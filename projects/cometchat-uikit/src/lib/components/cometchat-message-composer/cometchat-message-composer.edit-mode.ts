import {CometChat} from '@cometchat/chat-sdk-javascript';
import {CometChatLocalize} from '../../resources/CometChatLocalize/cometchat-localize';
import {CometChatMentionsFormatter} from '../../formatters/cometchat-mentions-formatter';
import {CometChatUIKit} from '../../cometchat-uikit';
import {MessageStatus} from '../../Enums/Enums';
import {CometChatMessageEvents} from '../../events/CometChatMessageEvents';
import {getMediaCaption, isMediaMessage} from '../../utils/message-metadata-utils';
import {convertInlineMarkdownToHtml} from '../../utils/inline-markdown';

export function enterEditModeImpl(ctx: any, message: CometChat.TextMessage | CometChat.MediaMessage): void {
  if (ctx._enteringEditMode) { return; }
  ctx._enteringEditMode = true;
  try {
    if (ctx.messageToReplySignal()) {
      ctx.exitReplyMode();
    }
    ctx.originalTextBeforeEdit = ctx.composerText();
    ctx.textMessageToEdit.set(message);
    ctx.isEditMode.set(true);
    // A media message is edited through its CAPTION; a text message through its text.
    const isMedia = isMediaMessage(message);
    const messageText = isMedia
      ? getMediaCaption(message)
      : (message as CometChat.TextMessage).getText?.() || '';
    ctx.composerText.set(messageText);
    if (ctx.customRichTextEditor) {
      // A caption carries the same markdown a text body does, so it needs the same markdown → rich
      // nodes conversion. `setContent` writes the string in verbatim, which surfaced the raw `**`.
      // getText() is absent on a MediaMessage, hence passing the caption as rawText.
      if (ctx.enableRichText) {
        populateEditorWithFormattedTextImpl(
          ctx,
          message as CometChat.TextMessage,
          isMedia ? messageText : undefined,
        );
      } else {
        ctx.richTextEditorService.setContent(ctx.customRichTextEditor, messageText);
      }
    }
    ctx.textChange.emit(messageText);
    CometChatMessageEvents.ccMessageEdited.next({
      message: message,
      status: MessageStatus.inprogress,
      parentMessageId: ctx.parentMessageId ?? null,
    });
    ctx.announceEditModeActivated();
    if (ctx.customRichTextEditor) {
      ctx.focusRichTextEditor();
    } else {
      ctx.focusTextInput();
    }
  } finally {
    ctx._enteringEditMode = false;
  }
}

/** @param rawText overrides `message.getText()` — pass a media message's CAPTION here. */
export function populateEditorWithFormattedTextImpl(ctx: any, message: CometChat.TextMessage, rawText?: string): void {
  if (!ctx.customRichTextEditor) { return; }
  const messageText = (rawText === undefined ? message.getText?.() : rawText) || '';
  const mentionedUsers = message.getMentionedUsers?.() || [];
  ctx.richTextEditorService.setContentWithMentions(
    ctx.customRichTextEditor,
    messageText,
    mentionedUsers
  );
  if (mentionedUsers.length > 0 && !ctx.disableMentions) {
    // mentions are preserved in the rich text editor as mention nodes
  }
}

export function cancelEditImpl(ctx: any): void {
  const editMessage = ctx.messageToEdit || ctx.textMessageToEdit();
  if (editMessage) {
    CometChatMessageEvents.ccMessageEdited.next({
      message: editMessage,
      status: MessageStatus.cancelled,
      parentMessageId: ctx.parentMessageId ?? null,
    });
  }
  ctx.textMessageToEdit.set(null);
  ctx.isEditMode.set(false);
  if (ctx.originalTextBeforeEdit !== undefined) {
    ctx.composerText.set(ctx.originalTextBeforeEdit);
    if (ctx.customRichTextEditor && ctx.enableRichText) {
      ctx.richTextEditorService.setContent(ctx.customRichTextEditor, ctx.originalTextBeforeEdit);
    }
    ctx.textChange.emit(ctx.originalTextBeforeEdit);
    ctx.originalTextBeforeEdit = '';
  }
  ctx.closePreview.emit();
}

export function exitEditModeWithoutEventImpl(ctx: any): void {
  ctx.textMessageToEdit.set(null);
  ctx.isEditMode.set(false);
  if (ctx.originalTextBeforeEdit !== undefined) {
    ctx.composerText.set(ctx.originalTextBeforeEdit);
    if (ctx.customRichTextEditor && ctx.enableRichText) {
      ctx.richTextEditorService.setContent(ctx.customRichTextEditor, ctx.originalTextBeforeEdit);
    }
    ctx.textChange.emit(ctx.originalTextBeforeEdit);
    ctx.originalTextBeforeEdit = '';
  }
}

/**
 * @param rawText overrides `message.getText()` — pass a media message's CAPTION here. When given,
 *   the `metadata.richText` shortcut is skipped: that pre-rendered HTML describes the message BODY,
 *   and substituting it for a caption would show the wrong text.
 */
export function formatReplyPreviewTextImpl(ctx: any, message: CometChat.TextMessage, rawText?: string): string {
  const isMessageBody = rawText === undefined;
  const text = (isMessageBody ? message.getText?.() : rawText) || '';
  if (!text) { return ''; }
  if (isMessageBody) {
    try {
      const metadata = message.getMetadata?.() as Record<string, any> | undefined;
      const richText = metadata?.['richText'] as { html?: string; hasFormatting?: boolean } | undefined;
      if (richText?.html && richText?.hasFormatting) {
        const sanitized = ctx.htmlSanitizerService.sanitize(richText.html);
        if (sanitized) return flattenListsForPreview(sanitized);
      }
    } catch { /* ignore */ }
  }
  const loggedInUser = CometChatUIKit.getLoggedInUser();
  const formatters = ctx.formatterConfigService.getFormattersWithContext(
    loggedInUser || undefined,
    undefined
  );
  const mentionedUsers = message.getMentionedUsers?.() || [];
  const escapedText = ctx.htmlSanitizerService.escapeUserHtml(text);
  let formattedText = convertMarkdownToHtmlImpl(escapedText);
  for (const formatter of formatters) {
    formatter.reset();
    if (!formatter.shouldFormat(formattedText, message)) { continue; }
    if (formatter instanceof CometChatMentionsFormatter) {
      if (formatter.hasSdkMentions(formattedText)) {
        formattedText = formatter.formatSdkMentions(formattedText, mentionedUsers);
      } else {
        formattedText = formatter.format(formattedText);
      }
    } else {
      formattedText = formatter.format(formattedText);
    }
  }
  const sanitized = ctx.htmlSanitizerService.sanitize(formattedText);
  return flattenListsForPreview(sanitized);
}

/**
 * Replaces <ol>/<ul>/<li> with inline text representations for single-line previews.
 * Ordered list items get "1. ", "2. " prefixes; unordered get "• " prefix.
 */
function flattenListsForPreview(html: string): string {
  if (!html || (!html.includes('<ol') && !html.includes('<ul'))) return html;
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  const ols = tempDiv.querySelectorAll('ol');
  ols.forEach(ol => {
    const items = ol.querySelectorAll(':scope > li');
    items.forEach((li, idx) => {
      const span = document.createElement('span');
      span.innerHTML = `${idx + 1}. ${li.innerHTML} `;
      li.replaceWith(span);
    });
    const span = document.createElement('span');
    span.innerHTML = ol.innerHTML;
    ol.replaceWith(span);
  });
  const uls = tempDiv.querySelectorAll('ul');
  uls.forEach(ul => {
    const items = ul.querySelectorAll(':scope > li');
    items.forEach(li => {
      const span = document.createElement('span');
      span.innerHTML = `\u2022 ${li.innerHTML} `;
      li.replaceWith(span);
    });
    const span = document.createElement('span');
    span.innerHTML = ul.innerHTML;
    ul.replaceWith(span);
  });
  return tempDiv.innerHTML;
}

/** @param rawText overrides `message.getText()` — see {@link formatReplyPreviewTextImpl}. */
export function formatEditPreviewTextImpl(ctx: any, message: CometChat.TextMessage, rawText?: string): string {
  const isMessageBody = rawText === undefined;
  const text = (isMessageBody ? message.getText?.() : rawText) || '';
  if (!text) { return ''; }
  if (isMessageBody) {
    try {
      const metadata = message.getMetadata?.() as Record<string, any> | undefined;
      const richText = metadata?.['richText'] as { html?: string; hasFormatting?: boolean } | undefined;
      if (richText?.html && richText?.hasFormatting) {
        const sanitized = ctx.htmlSanitizerService.sanitize(richText.html);
        if (sanitized) return sanitized;
      }
    } catch { /* ignore */ }
  }
  const loggedInUser = CometChatUIKit.getLoggedInUser();
  const formatters = ctx.formatterConfigService.getFormattersWithContext(
    loggedInUser || undefined,
    undefined
  );
  const mentionedUsers = message.getMentionedUsers?.() || [];
  const escapedText = ctx.htmlSanitizerService.escapeUserHtml(text);
  let formattedText = convertMarkdownToHtmlImpl(escapedText);
  for (const formatter of formatters) {
    formatter.reset();
    if (!formatter.shouldFormat(formattedText, message)) { continue; }
    if (formatter instanceof CometChatMentionsFormatter) {
      if (formatter.hasSdkMentions(formattedText)) {
        formattedText = formatter.formatSdkMentions(formattedText, mentionedUsers);
      } else {
        formattedText = formatter.format(formattedText);
      }
    } else {
      formattedText = formatter.format(formattedText);
    }
  }
  return ctx.htmlSanitizerService.sanitize(formattedText);
}

export function convertMarkdownToHtmlImpl(text: string): string {
  if (!text) return '';
  let result = text;

  // Code blocks (``` ... ```) — must come before inline code to avoid double-processing
  result = result.replace(/```([\s\S]*?)```/g, (_match, code: string) => {
    // The text has already been HTML-escaped by the caller (escapeUserHtml), so
    // the content inside the fences is safe to wrap directly.
    // Trim leading/trailing newlines to avoid extra whitespace in the pre block.
    const trimmedCode = code.replace(/^\n/, '').replace(/\n$/, '');
    return `<pre class="cometchat-rich-text__code-block"><code class="cometchat-rich-text__code">${trimmedCode}</code></pre>`;
  });

  // Blockquotes — support both raw ">" and HTML-escaped "&gt;" (caller may escape first)
  result = result.replace(/^(?:&gt;|>) (.+)$/gm, '<blockquote class="cometchat-rich-text__blockquote">$1</blockquote>');

  // Inline code — must come before bold/italic to avoid mangling backtick content
  result = result.replace(/`([^`]+)`/g, '<code class="cometchat-rich-text__code">$1</code>');

  result = result.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  result = result.replace(/(?<!\*)\*(?!\*)([^*]+)\*(?!\*)/g, '<em>$1</em>');
  result = result.replace(/__([^_]+)__/g, '<u>$1</u>');
  result = result.replace(/(?<!_)_(?!_)([^_]+)_(?!_)/g, '<em>$1</em>');
  result = result.replace(/~~([^~]+)~~/g, '<s>$1</s>');
  result = result.replace(
    /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
  );
  return result;
}
