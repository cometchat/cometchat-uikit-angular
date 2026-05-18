/**
 * Toolbar action handler functions for CometChatMessageComposer.
 * Extracted to reduce component file size.
 */

import { CometChatLocalize } from '../../resources/CometChatLocalize/cometchat-localize';
import { CometChatLogger } from '../../utils/CometChatLogger';
import { RichTextFormatState } from '../../services/rich-text-editor.interfaces';

export interface ToolbarHandlerContext {
  enableRichText: boolean;
  customRichTextEditor: any;
  richTextEditorService: any;
  richTextFormatState: () => RichTextFormatState;
  richTextFormatStateSignal: any; // = richTextFormatState signal (writable)
  showBubbleMenuOnSelection: boolean;
  isMobileView: () => boolean;
  shouldShowToolbar: () => boolean;
  isFixedToolbarShown: () => boolean;
  isFixedToolbarManuallyToggled: () => boolean;
  isMouseDown: boolean;
  bubbleMenuDebounceTimer: ReturnType<typeof setTimeout> | null;
  bubbleMenuElementRef: any;
  textSelection: any;
  isBubbleMenuVisible: any;
  bubbleMenuPosition: any;
  isFixedToolbarShownSignal: any; // = isFixedToolbarShown signal (writable)
  isFixedToolbarManuallyToggledSignal: any; // = isFixedToolbarManuallyToggled signal (writable)
  savedLinkSelection: any;
  isLinkDialogOpen: any;
  linkDialogMode: any;
  linkDialogInitialText: any;
  linkDialogInitialUrl: any;
  linkDialogX: any;
  hostElementRef: any;
  cdr: any;
  updateFormatStateFromEditor: () => void;
  announceFormatStateChange: (name: string, enabled: boolean) => void;
  computeLinkDialogLeft: (x: number) => number;
}

export function handleToolbarBoldImpl(ctx: ToolbarHandlerContext): void {
  if (!ctx.enableRichText) return;
  const wasActive = ctx.richTextFormatState().bold;
  if (ctx.customRichTextEditor) ctx.richTextEditorService.toggleBold(ctx.customRichTextEditor);
  ctx.updateFormatStateFromEditor();
  ctx.announceFormatStateChange(CometChatLocalize.getLocalizedString('message_composer_bold'), !wasActive);
}

export function handleToolbarItalicImpl(ctx: ToolbarHandlerContext): void {
  if (!ctx.enableRichText) return;
  const wasActive = ctx.richTextFormatState().italic;
  if (ctx.customRichTextEditor) ctx.richTextEditorService.toggleItalic(ctx.customRichTextEditor);
  ctx.updateFormatStateFromEditor();
  ctx.announceFormatStateChange(CometChatLocalize.getLocalizedString('message_composer_italic'), !wasActive);
}

export function handleToolbarUnderlineImpl(ctx: ToolbarHandlerContext): void {
  if (!ctx.enableRichText) return;
  const wasActive = ctx.richTextFormatState().underline;
  if (ctx.customRichTextEditor) ctx.richTextEditorService.toggleUnderline(ctx.customRichTextEditor);
  ctx.updateFormatStateFromEditor();
  ctx.announceFormatStateChange(CometChatLocalize.getLocalizedString('message_composer_underline'), !wasActive);
}

export function handleToolbarStrikethroughImpl(ctx: ToolbarHandlerContext): void {
  if (!ctx.enableRichText) return;
  const wasActive = ctx.richTextFormatState().strikethrough;
  if (ctx.customRichTextEditor) ctx.richTextEditorService.toggleStrikethrough(ctx.customRichTextEditor);
  ctx.updateFormatStateFromEditor();
  ctx.announceFormatStateChange(CometChatLocalize.getLocalizedString('message_composer_strikethrough'), !wasActive);
}

export function handleToolbarInlineCodeImpl(ctx: ToolbarHandlerContext): void {
  if (!ctx.enableRichText) return;
  const wasActive = ctx.richTextFormatState().code;
  if (ctx.customRichTextEditor) ctx.richTextEditorService.toggleCode(ctx.customRichTextEditor);
  ctx.updateFormatStateFromEditor();
  ctx.announceFormatStateChange(CometChatLocalize.getLocalizedString('message_composer_inline_code'), !wasActive);
}

export function handleToolbarLinkImpl(ctx: ToolbarHandlerContext): void {
  if (!ctx.enableRichText || !ctx.customRichTextEditor) return;
  ctx.savedLinkSelection = ctx.customRichTextEditor.saveSelection();
  let viewportX = 0;
  const sel = window.getSelection();
  if (sel && sel.rangeCount > 0) { const rect = sel.getRangeAt(0).getBoundingClientRect(); viewportX = rect.left; }
  const left = ctx.computeLinkDialogLeft(viewportX);
  const wasActive = ctx.richTextFormatState().link;
  if (wasActive) {
    const url = ctx.customRichTextEditor.getCurrentLink();
    const text = ctx.customRichTextEditor.getCurrentLinkText();
    ctx.linkDialogMode.set('edit');
    ctx.linkDialogInitialText.set(text || '');
    ctx.linkDialogInitialUrl.set(url || '');
    ctx.linkDialogX.set(left);
    ctx.isLinkDialogOpen.set(true);
  } else {
    const selectedText = ctx.customRichTextEditor.getSelectedText();
    ctx.linkDialogMode.set('add');
    ctx.linkDialogInitialText.set(selectedText);
    ctx.linkDialogInitialUrl.set('');
    ctx.linkDialogX.set(left);
    ctx.isLinkDialogOpen.set(true);
  }
}

export function handleToolbarOrderedListImpl(ctx: ToolbarHandlerContext): void {
  if (!ctx.enableRichText) return;
  const wasActive = ctx.richTextFormatState().orderedList;
  if (ctx.customRichTextEditor) ctx.richTextEditorService.toggleOrderedList(ctx.customRichTextEditor);
  ctx.updateFormatStateFromEditor();
  ctx.announceFormatStateChange(CometChatLocalize.getLocalizedString('message_composer_ordered_list'), !wasActive);
}

export function handleToolbarBulletListImpl(ctx: ToolbarHandlerContext): void {
  if (!ctx.enableRichText) return;
  const wasActive = ctx.richTextFormatState().bulletList;
  if (ctx.customRichTextEditor) ctx.richTextEditorService.toggleBulletList(ctx.customRichTextEditor);
  ctx.updateFormatStateFromEditor();
  ctx.announceFormatStateChange(CometChatLocalize.getLocalizedString('message_composer_bullet_list'), !wasActive);
}

export function handleToolbarCodeBlockImpl(ctx: ToolbarHandlerContext): void {
  if (!ctx.enableRichText) return;
  const wasActive = ctx.richTextFormatState().codeBlock;
  if (ctx.customRichTextEditor) ctx.richTextEditorService.toggleCodeBlock(ctx.customRichTextEditor);
  ctx.updateFormatStateFromEditor();
  ctx.announceFormatStateChange(CometChatLocalize.getLocalizedString('message_composer_code_block'), !wasActive);
}

export function handleToolbarBlockquoteImpl(ctx: ToolbarHandlerContext): void {
  if (!ctx.enableRichText) return;
  const wasActive = ctx.richTextFormatState().blockquote;
  if (ctx.customRichTextEditor) ctx.richTextEditorService.toggleBlockquote(ctx.customRichTextEditor);
  ctx.updateFormatStateFromEditor();
  ctx.announceFormatStateChange(CometChatLocalize.getLocalizedString('message_composer_blockquote'), !wasActive);
}

export function handleSelectionUpdateImpl(ctx: ToolbarHandlerContext, formatState: RichTextFormatState): void {
  // richTextFormatState IS the writable signal on the component
  (ctx as any).richTextFormatState.set(formatState);
  if (!ctx.showBubbleMenuOnSelection || !ctx.enableRichText || !ctx.customRichTextEditor) return;
  const selection = ctx.customRichTextEditor.getSelection();
  if (ctx.bubbleMenuDebounceTimer) { clearTimeout(ctx.bubbleMenuDebounceTimer); (ctx as any).bubbleMenuDebounceTimer = null; }
  const isFixedToolbarActive = ctx.shouldShowToolbar();
  if (selection && !selection.isCollapsed && selection.toString().trim().length > 0 && !isFixedToolbarActive) {
    const range = selection.getRangeAt(0);
    const startOffset = getTextOffsetFromNodeImpl(ctx.customRichTextEditor.getElement(), range.startContainer, range.startOffset);
    const endOffset = getTextOffsetFromNodeImpl(ctx.customRichTextEditor.getElement(), range.endContainer, range.endOffset);
    ctx.textSelection.set({ from: startOffset, to: endOffset });
    if (!ctx.isMouseDown) {
      (ctx as any).bubbleMenuDebounceTimer = setTimeout(() => {
        const currentSelection = ctx.customRichTextEditor?.getSelection();
        const isStillFixedToolbarActive = ctx.shouldShowToolbar();
        if (currentSelection && !currentSelection.isCollapsed && currentSelection.toString().trim().length > 0 && !isStillFixedToolbarActive) {
          if (ctx.isMobileView()) {
            // isFixedToolbarShown IS the writable signal
            (ctx as any).isFixedToolbarShown.set(true);
          } else {
            ctx.isBubbleMenuVisible.set(true);
            const currentRange = currentSelection.getRangeAt(0);
            updateBubbleMenuPositionImpl(ctx, currentRange);
          }
          ctx.cdr.markForCheck();
        }
      }, 100);
    }
  } else {
    ctx.isBubbleMenuVisible.set(false);
    ctx.textSelection.set(null);
    ctx.bubbleMenuPosition.set(null);
    if (ctx.isMobileView() && !ctx.isFixedToolbarManuallyToggled()) {
      const hasSelection = selection && !selection.isCollapsed && selection.toString().trim().length > 0;
      if (!hasSelection) { (ctx as any).isFixedToolbarShown.set(false); }
    }
    ctx.cdr.markForCheck();
  }
}

export function updateBubbleMenuPositionImpl(ctx: ToolbarHandlerContext, range: Range): void {
  try {
    const rects = range.getClientRects();
    if (rects.length === 0) return;
    let rect = rects[0];
    const editorElement = ctx.customRichTextEditor?.getElement();
    if (!editorElement) return;
    const editorRect = editorElement.getBoundingClientRect();
    const composerElement = editorElement.closest('.cometchat-message-composer') as HTMLElement;
    const composerRect = composerElement ? composerElement.getBoundingClientRect() : editorRect;
    for (let i = 0; i < rects.length; i++) {
      const r = rects[i];
      if (r.top >= editorRect.top - 10 && r.bottom <= editorRect.bottom + 10) { rect = r; break; }
      if (r.top < editorRect.top && r.bottom > editorRect.top) { rect = r; break; }
    }
    if (rect.top < editorRect.top) { rect = new DOMRect(rect.left, editorRect.top, rect.width, rect.height); }
    let bubbleMenuWidth = 500;
    const bubbleMenuElement = ctx.bubbleMenuElementRef?.nativeElement;
    if (bubbleMenuElement) {
      requestAnimationFrame(() => {
        const actualWidth = bubbleMenuElement.offsetWidth;
        if (actualWidth > 0) { bubbleMenuWidth = actualWidth; calculateAndSetPositionImpl(ctx, rect, editorRect, composerRect, bubbleMenuWidth); }
      });
    }
    calculateAndSetPositionImpl(ctx, rect, editorRect, composerRect, bubbleMenuWidth);
  } catch (error) {
    CometChatLogger.warn('CometChatMessageComposer', 'Error calculating bubble menu position:', error);
  }
}

export function calculateAndSetPositionImpl(ctx: ToolbarHandlerContext, rect: DOMRect, editorRect: DOMRect, composerRect: DOMRect, bubbleMenuWidth: number): void {
  const bubbleMenuHeight = 44;
  const verticalGap = 8;
  let top = rect.top - bubbleMenuHeight - verticalGap;
  let left = rect.left;
  const selectionWidth = rect.width;
  const centerOffset = (selectionWidth - bubbleMenuWidth) / 2;
  left = left + centerOffset;
  const minLeft = composerRect.left + 8;
  const maxLeft = composerRect.right - bubbleMenuWidth - 8;
  if (left < minLeft) { left = minLeft; }
  if (left > maxLeft && maxLeft > minLeft) { left = maxLeft; }
  const minTop = 8;
  if (top < minTop) { top = minTop; }
  ctx.bubbleMenuPosition.set({ top, left });
  ctx.cdr.markForCheck();
}

export function getTextOffsetFromNodeImpl(root: HTMLElement, node: Node, offset: number): number {
  let textOffset = 0;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let currentNode: Node | null;
  while ((currentNode = walker.nextNode())) {
    if (currentNode === node) return textOffset + offset;
    textOffset += currentNode.textContent?.length || 0;
  }
  return textOffset;
}

export function updateFormatStateFromEditorImpl(ctx: ToolbarHandlerContext): void {
  if (!ctx.enableRichText) return;
  let formatState: RichTextFormatState | undefined;
  if (ctx.customRichTextEditor) { formatState = ctx.richTextEditorService.getFormatState(ctx.customRichTextEditor); }
  // richTextFormatState IS the writable signal on the component
  if (formatState) { (ctx as any).richTextFormatState.set(formatState); }
}
