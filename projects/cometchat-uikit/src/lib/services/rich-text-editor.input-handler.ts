export function handleInputImpl(ctx: any): void {
  if (ctx.justAppliedFormatting) {
    ctx.justAppliedFormatting = false;
    ctx.pushToHistory();
    ctx.emitUpdate();
    return;
  }
  // When typing inside an inline <code> element, skip all DOM manipulation
  // (ZWS cleanup, markdown detection, auto-list) to prevent cursor jumps.
  // Only push history and emit the update so the composer stays in sync.
  const sel = ctx.selectionManager?.getSelection?.() ?? window.getSelection();
  if (sel && sel.rangeCount > 0) {
    let anchorNode: Node | null = sel.anchorNode;
    while (anchorNode && anchorNode !== ctx.contentEditable) {
      if (anchorNode.nodeType === Node.ELEMENT_NODE) {
        const tag = (anchorNode as HTMLElement).tagName?.toLowerCase();
        // <code> inside <pre> is a code block — only skip for inline <code>
        if (tag === 'code' && !(anchorNode as HTMLElement).closest?.('pre')) {
          ctx.pushToHistory();
          ctx.emitUpdate();
          return;
        }
      }
      anchorNode = anchorNode.parentNode;
    }
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
      // Composer was emptied by manual deletion (backspace / select-all + delete).
      // Drop any pending inline-mark state so the toolbar buttons go inactive too.
      ctx.formatManager?.resetPendingEmptyFormats?.();
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
      ctx.formatManager?.resetPendingEmptyFormats?.();
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
  // Sync link href when the visible text of a link is itself a URL that was edited.
  // e.g., <a href="https://www.google.com">www.facebook.com</a> → update href to match text.
  syncLinkHrefsWithText(ctx);
  ctx.pushToHistory();
  ctx.emitUpdate();
  scrollCursorIntoViewImpl(ctx);
}

/**
 * For all <a> links in the editor where the visible text is a URL,
 * sync the href to match the text content. This handles the case where
 * a user edits the displayed URL text (e.g., google → facebook) but
 * the href stays stale.
 */
function syncLinkHrefsWithText(ctx: any): void {
  const links = ctx.contentEditable.querySelectorAll('a.cometchat-rich-text__link');
  for (const link of Array.from(links) as HTMLAnchorElement[]) {
    const text = (link.textContent || '').trim();
    if (!text) continue;
    // Check if the visible text looks like a URL
    const urlPattern = /^(https?:\/\/|www\.)[^\s]+$/i;
    if (urlPattern.test(text)) {
      const normalizedText = text.startsWith('http') ? text : `https://${text}`;
      if (link.href !== normalizedText) {
        link.href = normalizedText;
      }
    }
  }
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
  let didCleanup = false;
  codeElements.forEach((code: HTMLElement) => {
    const text = code.textContent || '';
    // Only remove ZWS when there are at least 2 real (non-ZWS) characters.
    // This prevents cursor instability on the 2nd keystroke — the browser
    // needs the text node to be stable between the 1st and 2nd input events.
    const realCharCount = text.replace(/\u200B/g, '').length;
    if (realCharCount >= 2 && text.includes('\u200B')) {
      const walker = document.createTreeWalker(code, NodeFilter.SHOW_TEXT);
      let node: Text | null;
      while ((node = walker.nextNode() as Text | null)) {
        if (node.data.includes('\u200B')) {
          if (range && range.startContainer === node) {
            const zwsBeforeStart = (node.data.slice(0, range.startOffset).match(/\u200B/g) || []).length;
            if (zwsBeforeStart > 0) {
              range.setStart(node, Math.max(0, range.startOffset - zwsBeforeStart));
            }
          }
          if (range && range.endContainer === node) {
            const zwsBeforeEnd = (node.data.slice(0, range.endOffset).match(/\u200B/g) || []).length;
            if (zwsBeforeEnd > 0) {
              range.setEnd(node, Math.max(0, range.endOffset - zwsBeforeEnd));
            }
          }
          node.data = node.data.replace(/\u200B/g, '');
          didCleanup = true;
        }
      }
    }
  });
  // Only restore selection when ZWS was actually removed — otherwise the
  // removeAllRanges/addRange call resets the cursor to a stale position,
  // causing the cursor to jump to the start on the 2nd character typed.
  if (didCleanup && range && selection) { selection.removeAllRanges(); selection.addRange(range); }
}

export function scrollCursorIntoViewImpl(ctx: any): void {
  requestAnimationFrame(() => {
    if (ctx.destroyed) { return; }
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) { return; }
    // Skip scroll-into-view when cursor is inside an inline <code> element —
    // inline code is always short and the scroll logic's getBoundingClientRect
    // calls can destabilize the cursor position in some browsers.
    let node: Node | null = selection.anchorNode;
    while (node && node !== ctx.contentEditable) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const tag = (node as HTMLElement).tagName?.toLowerCase();
        if (tag === 'code') return;
      }
      node = node.parentNode;
    }
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
