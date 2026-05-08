/**
 * Extracted paste/copy/drop handler logic for RichTextEditor.
 */

export interface PasteHandlerContext {
  config: { enableFormatting?: boolean; onUpdate?: (html: string, text: string) => void };
  selectionManager: {
    getSelection(): Selection | null;
    getSelectedHTML(): string;
  };
  contentEditableManager: {
    sanitizeHTML(html: string): string;
  };
  linkManager: {
    validateURL(url: string): boolean;
    normalizeURL(url: string): string;
    processAutoLink(html: string): string;
  };
  markdownToHtml(text: string): string;
  htmlToMarkdown(element: HTMLElement): string;
  pushToHistory(): void;
  emitUpdate(): void;
}

export function handlePasteImpl(ctx: PasteHandlerContext, event: ClipboardEvent): void {
  const clipboardData = event.clipboardData;
  if (!clipboardData) { return; }
  const enableFormatting = ctx.config.enableFormatting !== false;
  let pastedContent = clipboardData.getData('text/html');
  const isHtml = !!pastedContent;
  if (!pastedContent) { pastedContent = clipboardData.getData('text/plain'); }
  if (!pastedContent) { return; }
  event.preventDefault();
  if (!enableFormatting) {
    const plainText = clipboardData.getData('text/plain');
    if (plainText) {
      const selection = ctx.selectionManager.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        const textNode = document.createTextNode(plainText);
        range.insertNode(textNode);
        range.setStartAfter(textNode);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
      }
      ctx.pushToHistory();
      ctx.emitUpdate();
    }
    return;
  }
  const plainText = clipboardData.getData('text/plain').trim();
  if (plainText && ctx.linkManager.validateURL(plainText)) {
    const selection = ctx.selectionManager.getSelection();
    if (selection && selection.rangeCount > 0) {
      const selectedText = selection.toString();
      if (selectedText.length > 0) {
        const normalizedUrl = ctx.linkManager.normalizeURL(plainText);
        const range = selection.getRangeAt(0);
        const link = document.createElement('a');
        link.href = normalizedUrl;
        link.className = 'cometchat-rich-text__link';
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = selectedText;
        range.deleteContents();
        range.insertNode(link);
        const newRange = document.createRange();
        newRange.setStartAfter(link);
        newRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(newRange);
        ctx.pushToHistory();
        ctx.emitUpdate();
        return;
      }
    }
  }
  let processedContent: string;
  if (isHtml) {
    const plainFallback = clipboardData.getData('text/plain');
    if (plainFallback) { processedContent = ctx.linkManager.processAutoLink(ctx.markdownToHtml(plainFallback)); } else {
      processedContent = ctx.linkManager.processAutoLink(
        ctx.contentEditableManager.sanitizeHTML(pastedContent)
      );
    }
  } else {
    processedContent = ctx.markdownToHtml(pastedContent);
  }
  const selection = ctx.selectionManager.getSelection();
  if (selection && selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    range.deleteContents();
    const temp = document.createElement('div');
    temp.innerHTML = processedContent;
    const fragment = document.createDocumentFragment();
    while (temp.firstChild) {
      fragment.appendChild(temp.firstChild);
    }
    range.insertNode(fragment);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  }
  ctx.pushToHistory();
  ctx.emitUpdate();
}

export function handleCopyImpl(ctx: PasteHandlerContext, event: ClipboardEvent): void {
  const selection = ctx.selectionManager.getSelection();
  if (!selection || selection.rangeCount === 0) { return; }
  const range = selection.getRangeAt(0);
  if (range.collapsed) { return; }
  const selectedHTML = ctx.selectionManager.getSelectedHTML();
  const temp = document.createElement('div');
  temp.innerHTML = selectedHTML;
  const markdownText = ctx.htmlToMarkdown(temp);
  if (event.clipboardData) { event.preventDefault(); event.clipboardData.setData('text/html', selectedHTML); event.clipboardData.setData('text/plain', markdownText); }
}

export function handleDropImpl(ctx: PasteHandlerContext, event: DragEvent): void {
  event.preventDefault();
  const dataTransfer = event.dataTransfer;
  if (!dataTransfer) { return; }
  let droppedContent = dataTransfer.getData('text/html');
  if (!droppedContent) { droppedContent = dataTransfer.getData('text/plain'); }
  if (!droppedContent) { return; }
  const range = document.caretRangeFromPoint?.(event.clientX, event.clientY);
  if (!range) { return; }
  const selection = ctx.selectionManager.getSelection();
  if (selection) {
    selection.removeAllRanges();
    selection.addRange(range);
    const temp = document.createElement('div');
    temp.innerHTML = droppedContent;
    const fragment = document.createDocumentFragment();
    while (temp.firstChild) {
      fragment.appendChild(temp.firstChild);
    }
    range.insertNode(fragment);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  }
  ctx.pushToHistory();
  ctx.emitUpdate();
}
