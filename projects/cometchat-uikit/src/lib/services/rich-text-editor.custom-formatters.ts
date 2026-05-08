/**
 * Extracted custom formatter logic for RichTextEditor.
 */
import {CometChatTextFormatter} from '../formatters/cometchat-text-formatter';

export interface CustomFormattersContext {
  customFormatters: CometChatTextFormatter[];
  contentEditable: HTMLDivElement;
  isInBlockquote(): boolean;
  getCharacterOffset(): number;
  restoreCharacterOffset(offset: number): void;
  selectionManager: { getSelection(): Selection | null };
}

export function scheduleCustomFormattersImpl(
  ctx: CustomFormattersContext,
  timerRef: { value: ReturnType<typeof setTimeout> | null },
  applyFn: () => void
): void {
  if (ctx.customFormatters.length === 0) return;
  if (timerRef.value !== null) { clearTimeout(timerRef.value); }
  timerRef.value = setTimeout(() => {
    timerRef.value = null;
    if (ctx.contentEditable.isConnected) { applyFn(); }
  }, 150);
}

export function applyCustomFormattersImpl(ctx: CustomFormattersContext): void {
  if (ctx.customFormatters.length === 0) return;
  const fullText = ctx.contentEditable.textContent || '';
  const hasAnyMatch = ctx.customFormatters.some(f => {
    const regex = f.getRegex();
    if (!regex) return false;
    const fresh = new RegExp(regex.source, regex.flags);
    return fresh.test(fullText);
  });
  const existingSpans = ctx.contentEditable.querySelectorAll('span[data-custom-format]');
  if (!hasAnyMatch && existingSpans.length === 0) return;
  const insideBlockquote = ctx.isInBlockquote();
  const charOffsetBackup = insideBlockquote ? ctx.getCharacterOffset() : -1;
  const selection = ctx.selectionManager.getSelection();
  const marker = document.createElement('span');
  marker.setAttribute('data-cursor-marker', 'true');
  marker.style.display = 'none';
  let hasMarker = false;
  if (selection && selection.rangeCount > 0) {
    try {
      const range = selection.getRangeAt(0).cloneRange();
      range.collapse(true);
      range.insertNode(marker);
      hasMarker = true;
    } catch {
    }
  }
  existingSpans.forEach(span => {
    const parent = span.parentNode;
    if (!parent) return;
    const textNode = document.createTextNode(span.textContent || '');
    parent.replaceChild(textNode, span);
  });
  ctx.contentEditable.normalize();
  const textNodes: Text[] = [];
  const walker = document.createTreeWalker(
    ctx.contentEditable,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node: Node) => {
        const parent = (node as Text).parentElement;
        if (parent && (
          parent.hasAttribute('data-uid') ||
          parent.hasAttribute('data-mention-type') ||
          parent.hasAttribute('data-cursor-marker')
        )) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );
  let node: Node | null;
  while ((node = walker.nextNode())) {
    textNodes.push(node as Text);
  }
  for (const textNode of textNodes) {
    const text = textNode.textContent || '';
    if (!text) continue;
    const matches: { start: number; end: number; matchText: string; formatter: CometChatTextFormatter }[] = [];
    for (const formatter of ctx.customFormatters) {
      const regex = formatter.getRegex();
      if (!regex) continue;
      const freshRegex = new RegExp(regex.source, regex.flags);
      let match: RegExpExecArray | null;
      while ((match = freshRegex.exec(text)) !== null) {
        matches.push({
          start: match.index,
          end: match.index + match[0].length,
          matchText: match[0],
          formatter,
        });
      }
    }
    if (matches.length === 0) continue;
    matches.sort((a, b) => a.start - b.start);
    const fragment = document.createDocumentFragment();
    let lastIndex = 0;
    for (const m of matches) {
      if (m.start > lastIndex) { fragment.appendChild(document.createTextNode(text.substring(lastIndex, m.start))); }
      const formattedHtml = m.formatter.format(m.matchText);
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = formattedHtml;
      const formattedSpan = tempDiv.querySelector('span');
      const span = document.createElement('span');
      span.setAttribute('data-custom-format', m.formatter.id);
      if (formattedSpan) {
        if (formattedSpan.className) span.className = formattedSpan.className;
        if (formattedSpan.getAttribute('style')) span.setAttribute('style', formattedSpan.getAttribute('style')!);
        for (const attr of Array.from(formattedSpan.attributes)) {
          if (attr.name.startsWith('data-') && attr.name !== 'data-custom-format') { span.setAttribute(attr.name, attr.value); }
        }
      }
      span.textContent = m.matchText;
      fragment.appendChild(span);
      lastIndex = m.end;
    }
    if (lastIndex < text.length) { fragment.appendChild(document.createTextNode(text.substring(lastIndex))); }
    const parent = textNode.parentNode;
    if (parent) { parent.replaceChild(fragment, textNode); }
  }
  if (hasMarker && marker.parentNode) {
    const range = document.createRange();
    range.setStartAfter(marker);
    range.collapse(true);
    if (selection) { selection.removeAllRanges(); selection.addRange(range); }
    marker.parentNode.removeChild(marker);
    if (insideBlockquote && charOffsetBackup >= 0) {
      const restoredOffset = ctx.getCharacterOffset();
      if (restoredOffset !== charOffsetBackup) { ctx.restoreCharacterOffset(charOffsetBackup); }
    }
  } else {
    if (marker.parentNode) { marker.parentNode.removeChild(marker); }
    if (insideBlockquote && charOffsetBackup >= 0) { ctx.restoreCharacterOffset(charOffsetBackup); }
  }
}
