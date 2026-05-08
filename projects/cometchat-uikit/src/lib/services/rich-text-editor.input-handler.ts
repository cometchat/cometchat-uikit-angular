export function handleInputImpl(ctx: any): void {
  if (ctx.justAppliedFormatting) {
    ctx.justAppliedFormatting = false;
    ctx.pushToHistory();
    ctx.emitUpdate();
    return;
  }
  const insideBlockquote = ctx.isInBlockquote();
  let savedOffset = -1;
  if (insideBlockquote) { savedOffset = ctx.getCharacterOffset(); }
  cleanupZeroWidthSpacesImpl(ctx);
  if (ctx.config.enableFormatting !== false) {
    if (ctx.detectAndConvertMarkdown()) { ctx.pushToHistory(); ctx.emitUpdate(); return; }
    if (!ctx.listManager.isInList()) {
      if (ctx.detectAndConvertAutoList()) { ctx.pushToHistory(); ctx.emitUpdate(); return; }
    }
  }
  const text = ctx.getText().trim();
  if (text === '') {
    const html = ctx.contentEditable.innerHTML.trim();
    if (html === '' || /^(<br\s*\/?>)+$/i.test(html)) {
      ctx.contentEditable.innerHTML = '';
      ctx.updateFormatState();
      ctx.pushToHistory();
      ctx.emitUpdate();
      return;
    }
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    const allTextContent = tempDiv.textContent || '';
    if (allTextContent.trim() === '') {
      // No visible text content — clear the editor entirely
      ctx.contentEditable.innerHTML = '';
      ctx.updateFormatState();
      ctx.pushToHistory();
      ctx.emitUpdate();
      return;
    }
  }
  ctx.scheduleCustomFormatters();
  if (insideBlockquote && savedOffset >= 0) {
    const currentOffset = ctx.getCharacterOffset();
    if (currentOffset !== savedOffset) { ctx.restoreCharacterOffset(savedOffset); }
  }
  ctx.pushToHistory();
  ctx.emitUpdate();
  scrollCursorIntoViewImpl(ctx);
}

export function handleBeforeInputImpl(ctx: any, event: InputEvent): void {
  const selection = ctx.selectionManager.getSelection();
  if (!selection || selection.rangeCount === 0) return;
  const range = selection.getRangeAt(0);
  const node = range.startContainer;
  const mentionAncestor = ctx.findMentionAncestor(node);
  if (mentionAncestor) { event.preventDefault(); return; }
  if (!range.collapsed) {
    const endMention = ctx.findMentionAncestor(range.endContainer);
    if (endMention) { event.preventDefault(); return; }
  }
}

export function cleanupZeroWidthSpacesImpl(ctx: any): void {
  const selection = ctx.selectionManager.getSelection();
  const range = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
  const codeElements = ctx.contentEditable.querySelectorAll('code');
  codeElements.forEach((code: HTMLElement) => {
    const text = code.textContent || '';
    if (text.length > 1 && text.includes('\u200B')) {
      const walker = document.createTreeWalker(code, NodeFilter.SHOW_TEXT);
      let node: Text | null;
      while ((node = walker.nextNode() as Text | null)) {
        if (node.data.includes('\u200B')) {
          const zwsIndex = node.data.indexOf('\u200B');
          if (range && range.startContainer === node && range.startOffset > zwsIndex) {
            range.setStart(node, range.startOffset - 1);
          }
          if (range && range.endContainer === node && range.endOffset > zwsIndex) {
            range.setEnd(node, range.endOffset - 1);
          }
          node.data = node.data.replace(/\u200B/g, '');
        }
      }
    }
  });
  if (range && selection) { selection.removeAllRanges(); selection.addRange(range); }
}

export function scrollCursorIntoViewImpl(ctx: any): void {
  requestAnimationFrame(() => {
    if (ctx.destroyed) { return; }
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) { return; }
    let scrollContainer: HTMLElement | null = ctx.contentEditable.parentElement;
    while (scrollContainer) {
      const style = window.getComputedStyle(scrollContainer);
      if (style.overflowY === 'auto' || style.overflowY === 'scroll') { break; }
      scrollContainer = scrollContainer.parentElement;
    }
    if (!scrollContainer || scrollContainer.scrollHeight <= scrollContainer.clientHeight) { return; }
    const range = selection.getRangeAt(0).cloneRange();
    range.collapse(false);
    let cursorRect = range.getBoundingClientRect();
    if (cursorRect.height === 0) {
      const node = selection.focusNode;
      const el = node?.nodeType === Node.ELEMENT_NODE
        ? node as HTMLElement
        : node?.parentElement;
      if (el) { cursorRect = el.getBoundingClientRect(); }
    }
    const containerRect = scrollContainer.getBoundingClientRect();
    const padding = 4;
    if (cursorRect.bottom > containerRect.bottom - padding) {
      scrollContainer.scrollTop += cursorRect.bottom - containerRect.bottom + padding;
    } else if (cursorRect.top < containerRect.top + padding) {
      scrollContainer.scrollTop -= containerRect.top - cursorRect.top + padding;
    }
  });
}
