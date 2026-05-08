export function isInBlockquoteImpl(ctx: any): boolean {
  const selection = ctx.selectionManager.getSelection();
  if (!selection || selection.rangeCount === 0) { return false; }
  let node = selection.anchorNode;
  while (node && node !== ctx.contentEditable) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as HTMLElement;
      if (element.tagName.toLowerCase() === 'blockquote') return true;
    }
    node = node.parentNode;
  }
  return false;
}

export function shouldExitBlockquoteImpl(ctx: any): boolean {
  const selection = ctx.selectionManager.getSelection();
  if (!selection || selection.rangeCount === 0) { return false; }
  let node = selection.anchorNode;
  let blockquoteElement: HTMLElement | null = null;
  while (node && node !== ctx.contentEditable) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as HTMLElement;
      if (element.tagName.toLowerCase() === 'blockquote') { blockquoteElement = element; break; }
    }
    node = node.parentNode;
  }
  if (!blockquoteElement) { return false; }
  const lastChild = blockquoteElement.lastChild;
  let brCount = 0;
  let currentNode = lastChild;
  while (currentNode) {
    if (currentNode.nodeType === Node.ELEMENT_NODE) {
      const element = currentNode as HTMLElement;
      if (element.tagName.toLowerCase() === 'br') { brCount++; currentNode = currentNode.previousSibling; continue; }
      if (
        (element.tagName.toLowerCase() === 'p' || element.tagName.toLowerCase() === 'div') &&
        element.textContent?.trim() === ''
      ) { brCount++; currentNode = currentNode.previousSibling; continue; }
      break;
    } else if (currentNode.nodeType === Node.TEXT_NODE) {
      const text = currentNode.textContent || '';
      if (text.trim() === '') { currentNode = currentNode.previousSibling; continue; }
      const trimmedText = text.trimEnd();
      const trailingNewlines = text.length - trimmedText.length;
      if (trailingNewlines > 0) { brCount += trailingNewlines; }
      break;
    } else { break; }
  }
  if (brCount >= 2) { return true; }
  const range = selection.getRangeAt(0);
  const textNode = range.startContainer;
  if (textNode.nodeType === Node.TEXT_NODE) {
    const nodeText = textNode.textContent || '';
    const cursorPos = range.startOffset;
    if (cursorPos > 0 && nodeText[cursorPos - 1] === '\n') return true;
  }
  return false;
}

export function exitBlockquoteImpl(ctx: any): void {
  const selection = ctx.selectionManager.getSelection();
  if (!selection || selection.rangeCount === 0) { return; }
  let node = selection.anchorNode;
  let blockquoteElement: HTMLElement | null = null;
  while (node && node !== ctx.contentEditable) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as HTMLElement;
      if (element.tagName.toLowerCase() === 'blockquote') { blockquoteElement = element; break; }
    }
    node = node.parentNode;
  }
  if (!blockquoteElement) { return; }
  const br = document.createElement('br');
  if (blockquoteElement.nextSibling) {
    blockquoteElement.parentNode?.insertBefore(br, blockquoteElement.nextSibling);
  } else {
    blockquoteElement.parentNode?.appendChild(br);
  }
  const newRange = document.createRange();
  newRange.setStart(br.parentNode!, Array.from(br.parentNode!.childNodes).indexOf(br));
  newRange.collapse(true);
  selection.removeAllRanges();
  selection.addRange(newRange);
}

export function isInCodeBlockImpl(ctx: any): boolean {
  const selection = ctx.selectionManager.getSelection();
  if (!selection || selection.rangeCount === 0) { return false; }
  let node = selection.anchorNode;
  while (node && node !== ctx.contentEditable) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as HTMLElement;
      if (element.tagName.toLowerCase() === 'pre') return true;
    }
    node = node.parentNode;
  }
  return false;
}

export function shouldExitCodeBlockImpl(ctx: any): boolean {
  const selection = ctx.selectionManager.getSelection();
  if (!selection || selection.rangeCount === 0) { return false; }
  let node = selection.anchorNode;
  let preElement: HTMLElement | null = null;
  while (node && node !== ctx.contentEditable) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as HTMLElement;
      if (element.tagName.toLowerCase() === 'pre') { preElement = element; break; }
    }
    node = node.parentNode;
  }
  if (!preElement) { return false; }
  const text = preElement.textContent || '';
  const trimmedText = text.trimEnd();
  const trailingNewlines = text.length - trimmedText.length;
  if (trailingNewlines >= 2) { return true; }
  const range = selection.getRangeAt(0);
  const textNode = range.startContainer;
  if (textNode.nodeType === Node.TEXT_NODE) {
    const nodeText = textNode.textContent || '';
    const cursorPos = range.startOffset;
    if (cursorPos > 0 && nodeText[cursorPos - 1] === '\n') return true;
  }
  return false;
}

export function exitCodeBlockImpl(ctx: any): void {
  const selection = ctx.selectionManager.getSelection();
  if (!selection || selection.rangeCount === 0) { return; }
  let node = selection.anchorNode;
  let preElement: HTMLElement | null = null;
  while (node && node !== ctx.contentEditable) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as HTMLElement;
      if (element.tagName.toLowerCase() === 'pre') { preElement = element; break; }
    }
    node = node.parentNode;
  }
  if (!preElement) { return; }
  const br = document.createElement('br');
  if (preElement.nextSibling) {
    preElement.parentNode?.insertBefore(br, preElement.nextSibling);
  } else {
    preElement.parentNode?.appendChild(br);
  }
  const newRange = document.createRange();
  newRange.setStart(br.parentNode!, Array.from(br.parentNode!.childNodes).indexOf(br));
  newRange.collapse(true);
  selection.removeAllRanges();
  selection.addRange(newRange);
}

export function shouldExitListImpl(ctx: any): boolean {
  const listItem = getCurrentListItemImpl(ctx);
  if (!listItem) { return false; }
  const isEmpty = listItem.textContent?.trim() === '';
  const hasOnlyBr = listItem.innerHTML.trim() === '<br>' || listItem.innerHTML.trim() === '';
  return isEmpty || hasOnlyBr;
}

export function getCurrentListItemImpl(ctx: any): HTMLElement | null {
  const selection = ctx.selectionManager.getSelection();
  if (!selection || selection.rangeCount === 0) { return null; }
  let node = selection.anchorNode;
  while (node && node !== ctx.contentEditable) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as HTMLElement;
      if (element.tagName.toLowerCase() === 'li') return element;
    }
    node = node.parentNode;
  }
  return null;
}
