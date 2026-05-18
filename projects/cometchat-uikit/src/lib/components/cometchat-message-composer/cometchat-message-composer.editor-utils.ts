/**
 * Extracted editor initialization and composer clear logic for CometChatMessageComposerComponent.
 */
import {CometChatLocalize} from '../../resources/CometChatLocalize/cometchat-localize';
import {CometChatLogger} from '../../utils/CometChatLogger';
import {isMobileDevice} from '../../utils/util';
import {RichTextFormatState} from '../../services/rich-text-editor.interfaces';
import {EnterKeyBehavior} from '../../Enums/Enums';

export interface EditorInitContext {
  customRichTextEditor: any;
  richTextEditorContainerRef?: { nativeElement: HTMLDivElement };
  placeholderText: string;
  disableAutoFocusOnMobile: boolean;
  composerText: () => string;
  enableRichText: boolean;
  isMultilineLayout: () => boolean;
  enterKeyBehavior: EnterKeyBehavior;
  isMouseDown: boolean;
  richTextEditorService: {
    createEditor(config: any, container: HTMLDivElement): any;
    getFormatState(editor: any): RichTextFormatState;
  };
  handleRichTextUpdate(html: string, text: string): void;
  handleSelectionUpdate(formatState: RichTextFormatState): void;
  handleInputFocus(): void;
  handleInputBlur(): void;
  handleLinkClick(url: string, text: string, x: number, y: number): void;
  handleRichTextKeydown(event: KeyboardEvent): void;
  configureTextFormatters(): void;
  emitError(error: unknown): void;
}

export function initializeRichTextEditorImpl(ctx: EditorInitContext): void {
  if (ctx.customRichTextEditor) { return; }
  setTimeout(() => {
    const containerElement = ctx.richTextEditorContainerRef?.nativeElement;
    if (!containerElement) { CometChatLogger.warn('CometChatMessageComposer', 'Rich text editor container not found'); return; }
    try {
      const placeholder = CometChatLocalize.getLocalizedString(ctx.placeholderText);
      const shouldAutofocus = ctx.disableAutoFocusOnMobile && isMobileDevice() ? false : true;
      ctx.customRichTextEditor = ctx.richTextEditorService.createEditor(
        {
          placeholder,
          editable: true,
          autofocus: shouldAutofocus,
          content: ctx.composerText() || '',
          enableFormatting: ctx.enableRichText,
          ariaLabel: placeholder || CometChatLocalize.getLocalizedString('message_composer_aria_label'),
          onUpdate: (html: string, text: string) => { ctx.handleRichTextUpdate(html, text); },
          onSelectionUpdate: (formatState: RichTextFormatState) => { ctx.handleSelectionUpdate(formatState); },
          onFocus: () => { ctx.handleInputFocus(); },
          onBlur: () => { ctx.handleInputBlur(); },
          onLinkClick: (url: string, text: string, x: number, y: number) => { ctx.handleLinkClick(url, text, x, y); },
        },
        containerElement
      );
      containerElement.addEventListener('keydown', (event: KeyboardEvent) => { ctx.handleRichTextKeydown(event); }, true);
      containerElement.addEventListener('beforeinput', (event: InputEvent) => {
        if (!ctx.isMultilineLayout() && event.inputType === 'insertParagraph' && ctx.enterKeyBehavior === EnterKeyBehavior.SendMessage) {
          event.preventDefault();
        }
      }, true);
      containerElement.addEventListener('mousedown', () => { ctx.isMouseDown = true; });
      containerElement.addEventListener('mouseup', () => {
        ctx.isMouseDown = false;
        if (ctx.customRichTextEditor) {
          const formatState = ctx.richTextEditorService.getFormatState(ctx.customRichTextEditor);
          ctx.handleSelectionUpdate(formatState);
        }
      });
      document.addEventListener('mouseup', () => {
        if (ctx.isMouseDown) {
          ctx.isMouseDown = false;
          if (ctx.customRichTextEditor) {
            const formatState = ctx.richTextEditorService.getFormatState(ctx.customRichTextEditor);
            ctx.handleSelectionUpdate(formatState);
          }
        }
      });
      ctx.configureTextFormatters();
    } catch (error) {
      CometChatLogger.error('CometChatMessageComposer', 'Error initializing rich text editor:', error);
      ctx.emitError(error);
    }
  }, 0);
}

export interface ClearComposerContext {
  composerText: { set(v: string): void };
  customRichTextEditor: any;
  richTextEditorService: { clearContent(editor: any): void };
  messageToReplySignal: { (): any; set(v: any): void };
  isEditMode: { (): boolean; set(v: boolean): void };
  textMessageToEdit: { (): any; set(v: any): void };
  originalTextBeforeEdit: string;
  attachments: { set(v: any[]): void };
  richTextFormatState: { set(v: RichTextFormatState): void };
  uniqueMentionCount: { set(v: number): void };
  showMentionsCountWarning: { set(v: boolean): void };
  plainTextMentionUids: { clear(): void };
  mentionedUsersMap: { clear(): void };
  textChange: { emit(v: string): void };
}

export function clearComposerImpl(ctx: ClearComposerContext): void {
  ctx.composerText.set('');
  if (ctx.customRichTextEditor) { ctx.richTextEditorService.clearContent(ctx.customRichTextEditor); }
  if (ctx.messageToReplySignal()) { ctx.messageToReplySignal.set(null); }
  if (ctx.isEditMode() || ctx.textMessageToEdit()) { ctx.textMessageToEdit.set(null); ctx.isEditMode.set(false); ctx.originalTextBeforeEdit = ''; }
  ctx.attachments.set([]);
  ctx.richTextFormatState.set({
    bold: false, italic: false, underline: false, strikethrough: false,
    code: false, blockquote: false, codeBlock: false, orderedList: false, bulletList: false, link: false,
  });
  ctx.uniqueMentionCount.set(0);
  ctx.showMentionsCountWarning.set(false);
  ctx.plainTextMentionUids.clear();
  ctx.mentionedUsersMap.clear();
  ctx.textChange.emit('');
}
