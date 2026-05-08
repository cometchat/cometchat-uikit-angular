export function detectAndConvertMarkdownImpl(ctx: any): boolean {
  const selection = ctx.selectionManager.getSelection();
  if (!selection || selection.rangeCount === 0) { return false; }
  const range = selection.getRangeAt(0);
  const textNode = range.startContainer;
  if (textNode.nodeType !== Node.TEXT_NODE) { return false; }
  const text = textNode.textContent || '';
  const cursorPos = range.startOffset;
  const textBeforeCursor = text.substring(0, cursorPos);

  const boldMatch = textBeforeCursor.match(/\*\*([^\*]+)\*\*$/);
  if (boldMatch) { applyMarkdownFormatImpl(ctx, textNode, range, boldMatch, 'bold', 2); return true; }

  const singleBoldMatch = textBeforeCursor.match(/(?<!\*)\*([^\*]+)\*$/);
  if (singleBoldMatch) { applyMarkdownFormatImpl(ctx, textNode, range, singleBoldMatch, 'bold', 1); return true; }

  const italicUnderscoreMatch = textBeforeCursor.match(/(?<!_)_([^_]+)_$/);
  if (italicUnderscoreMatch) { applyMarkdownFormatImpl(ctx, textNode, range, italicUnderscoreMatch, 'italic', 1); return true; }

  const underlineMatch = textBeforeCursor.match(/__([^_]+)__$/);
  if (underlineMatch) { applyMarkdownFormatImpl(ctx, textNode, range, underlineMatch, 'underline', 2); return true; }

  const strikethroughMatch = textBeforeCursor.match(/~~([^~]+)~~$/);
  if (strikethroughMatch) { applyMarkdownFormatImpl(ctx, textNode, range, strikethroughMatch, 'strikethrough', 2); return true; }

  const codeMatch = textBeforeCursor.match(/`([^`]+)`$/);
  if (codeMatch) { applyMarkdownFormatImpl(ctx, textNode, range, codeMatch, 'code', 1); return true; }

  return false;
}

export function applyMarkdownFormatImpl(
  ctx: any,
  textNode: Node,
  range: Range,
  match: RegExpMatchArray,
  format: 'bold' | 'italic' | 'underline' | 'strikethrough' | 'code',
  markerLength: number
): void {
  const fullMatch = match[0];
  const content = match[1];
  const matchStart = (textNode.textContent || '').lastIndexOf(fullMatch);
  const matchEnd = matchStart + fullMatch.length;
  const matchRange = document.createRange();
  matchRange.setStart(textNode, matchStart);
  matchRange.setEnd(textNode, matchEnd);
  matchRange.deleteContents();
  let formattedElement: HTMLElement;
  switch (format) {
    case 'bold': formattedElement = document.createElement('strong'); break;
    case 'italic': formattedElement = document.createElement('em'); break;
    case 'underline': formattedElement = document.createElement('u'); break;
    case 'strikethrough': formattedElement = document.createElement('s'); break;
    case 'code': formattedElement = document.createElement('code'); break;
  }
  formattedElement.textContent = content;
  matchRange.insertNode(formattedElement);
  const zeroWidthSpace = document.createTextNode('\u200B');
  matchRange.setStartAfter(formattedElement);
  matchRange.insertNode(zeroWidthSpace);
  matchRange.setStartAfter(zeroWidthSpace);
  matchRange.collapse(true);
  const selection = ctx.selectionManager.getSelection();
  if (selection) { selection.removeAllRanges(); selection.addRange(matchRange); }
  ctx.justAppliedFormatting = true;
  ctx.updateFormatState();
}

export function detectAndConvertAutoListImpl(ctx: any): boolean {
  const selection = ctx.selectionManager.getSelection();
  if (!selection || selection.rangeCount === 0) { return false; }
  const range = selection.getRangeAt(0);
  const textNode = range.startContainer;
  if (textNode.nodeType !== Node.TEXT_NODE) { return false; }
  const text = textNode.textContent || '';
  const cursorPos = range.startOffset;
  const textBeforeCursor = text.substring(0, cursorPos);

  const orderedListMatch = textBeforeCursor.match(/^(\d+)(\.|\))\s$/);
  if (orderedListMatch) {
    const patternLength = orderedListMatch[0].length;
    range.setStart(textNode, 0);
    range.setEnd(textNode, patternLength);
    range.deleteContents();
    ctx.justAppliedFormatting = true;
    ctx.listManager.toggleOrderedList();
    ctx.updateFormatState();
    return true;
  }

  const bulletListMatch = textBeforeCursor.match(/^(-|\*)\s$/);
  if (bulletListMatch) {
    const patternLength = bulletListMatch[0].length;
    range.setStart(textNode, 0);
    range.setEnd(textNode, patternLength);
    range.deleteContents();
    ctx.justAppliedFormatting = true;
    ctx.listManager.toggleBulletList();
    ctx.updateFormatState();
    return true;
  }

  return false;
}
