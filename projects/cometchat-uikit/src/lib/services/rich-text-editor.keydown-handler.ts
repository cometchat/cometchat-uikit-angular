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
        // ENG-35733: Shift+Enter inside a blockquote that isn't at the exit
        // boundary should insert a line break. Let the browser handle it by
        // not returning early here — fall through to the default behaviour.
        return;
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
        // ENG-35733: Shift+Enter inside a code block that isn't at the exit
        // boundary should insert a newline. Let the browser handle it.
        return;
      }
      // Plain Enter inside a code block → browser inserts newline naturally.
      return;
    }
    const listItem = ctx.getCurrentListItem();
    if (listItem) {
      // In a list, both Enter and Shift+Enter create a new list item or exit.
      // The composer layer (handleRichTextKeydownImpl) is responsible for
      // intercepting plain Enter to send the message BEFORE this handler runs.
      // If we reach here, it means the key wasn't consumed upstream.
      //
      // Behavior:
      // - Enter OR Shift+Enter on non-empty item → create next list item
      // - Enter OR Shift+Enter on empty item → exit the list
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
    // Safari fires insertParagraph (not insertLineBreak) for Shift+Enter in
    // contenteditable, and our beforeinput handler blocks insertParagraph when
    // enterKeyBehavior is SendMessage. To ensure Shift+Enter consistently
    // inserts a line break across all browsers, explicitly insert a <br>.
    if (event.shiftKey) {
      event.preventDefault();
      const selection = (ctx as any).selectionManager?.getSelection() as Selection | null;
      if (selection && selection.rangeCount > 0) {
        const r = selection.getRangeAt(0);
        r.deleteContents();
        const br = document.createElement('br');
        r.insertNode(br);
        // Browsers collapse a trailing <br> at the end of a contenteditable.
        // If the <br> we just inserted has no visible content after it, we
        // must insert a second <br> so the cursor actually appears on a new
        // line. This is the standard contenteditable line-break technique.
        const afterBr = br.nextSibling;
        const isAtEnd = !afterBr ||
          (afterBr.nodeType === Node.TEXT_NODE && afterBr.textContent === '') ||
          (afterBr.nodeType === Node.ELEMENT_NODE && (afterBr as HTMLElement).tagName === 'BR');
        if (isAtEnd) {
          const extraBr = document.createElement('br');
          br.parentNode!.insertBefore(extraBr, br.nextSibling);
        }
        // Move cursor after the first <br> (between the two if extra was added)
        const newRange = document.createRange();
        newRange.setStartAfter(br);
        newRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(newRange);
        ctx.pushToHistory();
        ctx.emitUpdate();
      }
      return;
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
