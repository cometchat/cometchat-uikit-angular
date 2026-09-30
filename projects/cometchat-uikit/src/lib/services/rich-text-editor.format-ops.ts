/**
 * Format application methods for RichTextEditor.
 * Extracted to reduce class file size.
 */

import { RichTextFormatState } from './rich-text-editor.interfaces';
import { CometChatLocalize } from '../resources/CometChatLocalize/cometchat-localize';

/**
 * Builds the screen-reader announcement for a formatting toggle.
 *
 * The format's own name is already localized (the toolbar buttons use the same
 * keys), so only the "applied"/"removed" frame is added here. Announcing
 * "Bold applied" in English to every language was the previous behaviour.
 *
 * @param formatKey - Localization key for the format name, e.g. 'message_composer_bold'
 * @param isApplied - Whether the format was turned on or off
 * @returns The localized announcement
 */
function formatAnnouncement(formatKey: string, isApplied: boolean): string {
  const template = CometChatLocalize.getLocalizedString(
    isApplied ? 'accessibility_formatting_applied' : 'accessibility_formatting_removed'
  );
  return template.replace('{format}', CometChatLocalize.getLocalizedString(formatKey));
}

export interface FormatOpsContext {
  formatManager: any;
  listManager: any;
  linkManager: any;
  contentEditable: HTMLDivElement;
  currentFormatState: RichTextFormatState;
  justAppliedFormatting: boolean;
  protectMentionsFromFormatting: () => void;
  convertMentionsToPlainText: (container: Element) => void;
  updateFormatState: () => void;
  emitUpdate: () => void;
  pushToHistory: () => void;
  announceToScreenReader: (msg: string) => void;
}

export function applyBoldImpl(ctx: FormatOpsContext): void {
  ctx.formatManager.applyBold();
  ctx.protectMentionsFromFormatting();
  ctx.updateFormatState();
  ctx.emitUpdate();
  ctx.announceToScreenReader(formatAnnouncement('message_composer_bold', ctx.currentFormatState.bold));
}

export function applyItalicImpl(ctx: FormatOpsContext): void {
  ctx.formatManager.applyItalic();
  ctx.protectMentionsFromFormatting();
  ctx.updateFormatState();
  ctx.emitUpdate();
  ctx.announceToScreenReader(formatAnnouncement('message_composer_italic', ctx.currentFormatState.italic));
}

export function applyUnderlineImpl(ctx: FormatOpsContext): void {
  ctx.formatManager.applyUnderline();
  ctx.protectMentionsFromFormatting();
  ctx.updateFormatState();
  ctx.emitUpdate();
  ctx.announceToScreenReader(formatAnnouncement('message_composer_underline', ctx.currentFormatState.underline));
}

export function applyStrikethroughImpl(ctx: FormatOpsContext): void {
  ctx.formatManager.applyStrikethrough();
  ctx.protectMentionsFromFormatting();
  ctx.updateFormatState();
  ctx.emitUpdate();
  ctx.announceToScreenReader(formatAnnouncement('message_composer_strikethrough', ctx.currentFormatState.strikethrough));
}

export function applyInlineCodeImpl(ctx: FormatOpsContext): void {
  (ctx as any).justAppliedFormatting = true;
  ctx.formatManager.applyInlineCode();
  ctx.contentEditable.querySelectorAll('code').forEach((c: Element) => ctx.convertMentionsToPlainText(c));
  ctx.updateFormatState();
  ctx.emitUpdate();
  ctx.announceToScreenReader(formatAnnouncement('message_composer_inline_code', ctx.currentFormatState.code));
}

export function applyCodeBlockImpl(ctx: FormatOpsContext): void {
  (ctx as any).justAppliedFormatting = true;
  if (ctx.currentFormatState.orderedList || ctx.currentFormatState.bulletList) {
    ctx.listManager.exitList();
    ctx.updateFormatState();
  }
  ctx.formatManager.applyCodeBlock();
  ctx.contentEditable.querySelectorAll('pre').forEach((p: Element) => ctx.convertMentionsToPlainText(p));
  ctx.updateFormatState();
  ctx.emitUpdate();
  ctx.announceToScreenReader(formatAnnouncement('message_composer_code_block', ctx.currentFormatState.codeBlock));
}

export function applyBlockquoteImpl(ctx: FormatOpsContext): void {
  (ctx as any).justAppliedFormatting = true;
  ctx.formatManager.applyBlockquote();
  ctx.updateFormatState();
  ctx.emitUpdate();
  ctx.announceToScreenReader(formatAnnouncement('message_composer_blockquote', ctx.currentFormatState.blockquote));
}

export function applyOrderedListImpl(ctx: FormatOpsContext): void {
  (ctx as any).justAppliedFormatting = true;
  if (ctx.currentFormatState.codeBlock || ctx.contentEditable.querySelector('pre')) {
    ctx.formatManager.applyCodeBlock();
    ctx.updateFormatState();
  }
  // ENG-35096: Restore the saved selection before applying list formatting.
  // Clicking the toolbar button blurs the contenteditable, losing the cursor
  // position. Without restoring, the list manager's focus() call resets the
  // cursor to position 0 instead of the user's current position.
  const savedRange = (ctx as any).lastSavedRange as Range | null;
  if (savedRange) {
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
      selection.addRange(savedRange);
    }
  }
  ctx.listManager.toggleOrderedList();
  ctx.updateFormatState();
  ctx.pushToHistory();
  ctx.emitUpdate();
  ctx.announceToScreenReader(formatAnnouncement('message_composer_ordered_list', ctx.currentFormatState.orderedList));
}

export function applyBulletListImpl(ctx: FormatOpsContext): void {
  (ctx as any).justAppliedFormatting = true;
  if (ctx.currentFormatState.codeBlock || ctx.contentEditable.querySelector('pre')) {
    ctx.formatManager.applyCodeBlock();
    ctx.updateFormatState();
  }
  // ENG-35096: Same fix — restore saved selection before applying bullet list.
  const savedRange = (ctx as any).lastSavedRange as Range | null;
  if (savedRange) {
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
      selection.addRange(savedRange);
    }
  }
  ctx.listManager.toggleBulletList();
  ctx.updateFormatState();
  ctx.pushToHistory();
  ctx.emitUpdate();
  ctx.announceToScreenReader(formatAnnouncement('message_composer_bullet_list', ctx.currentFormatState.bulletList));
}

export function setLinkImpl(ctx: FormatOpsContext, url: string | null, text?: string): void {
  if (url === null) { ctx.linkManager.removeLink(); } else if (ctx.linkManager.isLinkActive()) { ctx.linkManager.updateLink(url, text); } else { ctx.linkManager.insertLink(url, text); }
  ctx.updateFormatState();
  ctx.pushToHistory();
  ctx.emitUpdate();
}

export function isLinkActiveImpl(ctx: FormatOpsContext): boolean { return ctx.linkManager.isLinkActive(); }
export function getCurrentLinkImpl(ctx: FormatOpsContext): string | null { return ctx.linkManager.getCurrentLink(); }
export function getCurrentLinkTextImpl(ctx: FormatOpsContext): string | null { return ctx.linkManager.getCurrentLinkText(); }
export function isInListImpl(ctx: FormatOpsContext): boolean { return ctx.listManager.isInList(); }
