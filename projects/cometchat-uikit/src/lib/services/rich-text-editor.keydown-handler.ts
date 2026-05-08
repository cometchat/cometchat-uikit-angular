/**
 * Extracted keyboard handler logic for RichTextEditor.
 * Called from RichTextEditor.handleKeyDown via delegation.
 */

export interface KeyDownHandlerContext {
  config: { enableFormatting?: boolean };
  handleMentionDeletion(event: KeyboardEvent): boolean;
  applyBold(): void;
  applyItalic(): void;
  applyUnderline(): void;
  undo(): boolean;
  redo(): boolean;
  isInBlockquote(): boolean;
  shouldExitBlockquote(): boolean;
  exitBlockquote(): void;
  pushToHistory(): void;
  emitUpdate(): void;
  isInCodeBlock(): boolean;
  shouldExitCodeBlock(): boolean;
  exitCodeBlock(): void;
  getCurrentListItem(): HTMLElement | null;
  listManager: {
    exitList(): void;
    createNewListItem(): void;
    handleTabKey(event: KeyboardEvent): boolean;
    handleShiftTabKey(event: KeyboardEvent): boolean;
  };
  scrollCursorIntoView(): void;
}

export function handleKeyDownImpl(ctx: KeyDownHandlerContext, event: KeyboardEvent): void {
  const isCtrlOrCmd = event.ctrlKey || event.metaKey;
  if (event.key === 'Backspace' || event.key === 'Delete') {
    if (ctx.handleMentionDeletion(event)) { return; }
  }
  if (isCtrlOrCmd && !event.shiftKey && ctx.config.enableFormatting !== false) {
    if (event.key === 'b' || event.key === 'B') { event.preventDefault(); ctx.applyBold(); return; }
    if (event.key === 'i' || event.key === 'I') { event.preventDefault(); ctx.applyItalic(); return; }
    if (event.key === 'u' || event.key === 'U') { event.preventDefault(); ctx.applyUnderline(); return; }
  }
  if (isCtrlOrCmd && event.key === 'z' && !event.shiftKey) { event.preventDefault(); ctx.undo(); return; }
  if (
    isCtrlOrCmd &&
    (event.key === 'y' ||
      event.key === 'Y' ||
      (event.key === 'z' && event.shiftKey) ||
      (event.key === 'Z' && event.shiftKey))
  ) {
    event.preventDefault();
    ctx.redo();
    return;
  }
  if (event.key === 'Enter') {
    if (ctx.isInBlockquote()) {
      if (event.shiftKey) {
        if (ctx.shouldExitBlockquote()) {
          event.preventDefault();
          ctx.exitBlockquote();
          ctx.pushToHistory();
          ctx.emitUpdate();
          return;
        }
      }
      return;
    }
    if (ctx.isInCodeBlock()) {
      if (event.shiftKey) {
        if (ctx.shouldExitCodeBlock()) {
          event.preventDefault();
          ctx.exitCodeBlock();
          ctx.pushToHistory();
          ctx.emitUpdate();
          return;
        }
      }
      return;
    }
    const listItem = ctx.getCurrentListItem();
    if (listItem) {
      event.preventDefault();
      const isEmpty = listItem.textContent?.trim() === '';
      const hasOnlyBr = listItem.innerHTML.trim() === '<br>' || listItem.innerHTML.trim() === '';
      if (isEmpty || hasOnlyBr) {
        ctx.listManager.exitList();
        ctx.pushToHistory();
        ctx.emitUpdate();
        return;
      } else {
        ctx.listManager.createNewListItem();
        ctx.pushToHistory();
        ctx.emitUpdate();
        return;
      }
    }
  }
  if (event.key === 'Tab' && !event.shiftKey) {
    if (ctx.listManager.handleTabKey(event)) { ctx.pushToHistory(); ctx.emitUpdate(); return; }
  }
  if (event.key === 'Tab' && event.shiftKey) {
    if (ctx.listManager.handleShiftTabKey(event)) { ctx.pushToHistory(); ctx.emitUpdate(); return; }
  }
  if (['ArrowUp', 'ArrowDown', 'Enter', 'Backspace', 'Delete'].includes(event.key)) { ctx.scrollCursorIntoView(); }
}
