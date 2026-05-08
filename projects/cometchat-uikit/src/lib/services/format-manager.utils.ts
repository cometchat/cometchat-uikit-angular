/**
 * format-manager.utils.ts
 *
 * Higher-level formatting operations: block format apply/exit,
 * inline format skipping mentions, and list helpers.
 * Low-level DOM helpers live in format-manager.dom.ts.
 */

import {
  getSelectedBlocks,
  getSelectedBlocksOfType,
  isInsideFormattedElement,
  MentionSnapshot,
  snapshotMentions,
  stripInlineAncestors,
  stripInlineFormatting,
  stripMentions,
  wrapSelection,
  unwrapSelection,
} from './format-manager.dom';

// Re-export DOM helpers so format-manager.class.ts only needs one import
export {
  isInsideFormattedElement,
  isInsideOrContainsFormattedElement,
  wrapSelection,
} from './format-manager.dom';

// ==================== Block Format Apply/Exit ====================

/** Apply block formatting (pre/blockquote) to all selected blocks. */
export function applyBlockFormat(tagName: string, className: string | undefined, element: HTMLElement): void {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;
  const range = selection.getRangeAt(0);
  const blocks = getSelectedBlocks(range, element);

  if (blocks.length === 0) {
    wrapSelection(tagName, className, element);
    setTimeout(() => {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;
      const rng = sel.getRangeAt(0);
      const container = rng.commonAncestorContainer;
      const wrapper: HTMLElement | null = container.nodeType === Node.ELEMENT_NODE
        ? container as HTMLElement
        : (container as HTMLElement).parentElement;
      if (wrapper && wrapper.tagName.toLowerCase() === tagName.toLowerCase()) {
        if (!wrapper.textContent || wrapper.textContent.trim() === '') {
          if (!wrapper.querySelector('br')) wrapper.appendChild(document.createElement('br'));
          const newRange = document.createRange();
          newRange.setStart(wrapper, 0);
          newRange.collapse(true);
          sel.removeAllRanges();
          sel.addRange(newRange);
        }
      }
    }, 0);
    return;
  }

  blocks.forEach(block => {
    const wrapper = document.createElement(tagName);
    if (className) wrapper.className = className;
    wrapper.innerHTML = block.innerHTML || '<br>';
    if (tagName === 'pre') {
      stripInlineFormatting(wrapper);
      snapshotMentions(wrapper);
      stripMentions(wrapper);
    }
    if (block.parentNode) block.parentNode.replaceChild(wrapper, block);
    if (tagName === 'pre') stripInlineAncestors(wrapper, element);
  });

  if (blocks.length > 0 && selection) {
    const newRange = document.createRange();
    newRange.setStart(blocks[0].parentNode || element, 0);
    newRange.collapse(true);
    selection.removeAllRanges();
    selection.addRange(newRange);
  }
}

/** Exit block formatting, converting blocks back to text nodes with br tags. */
export function exitBlockFormat(tagName: string, element: HTMLElement): void {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;
  const range = selection.getRangeAt(0);
  const blocks = getSelectedBlocksOfType(range, tagName, element);

  if (blocks.length === 0) {
    unwrapSelection(tagName, element);
    return;
  }

  const firstBlock = blocks[0];
  const fragment = document.createDocumentFragment();
  const insertedNodes: Node[] = [];

  blocks.forEach((block, index) => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = block.innerHTML || '';
    Array.from(tempDiv.childNodes).forEach(node => {
      if (node.nodeType === Node.TEXT_NODE) {
        const tn = document.createTextNode(node.textContent || '');
        fragment.appendChild(tn);
        insertedNodes.push(tn);
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        if (el.tagName.toLowerCase() === 'br') {
          const br = document.createElement('br');
          fragment.appendChild(br);
          insertedNodes.push(br);
        } else {
          const tc = el.textContent || '';
          if (tc) { const tn = document.createTextNode(tc); fragment.appendChild(tn); insertedNodes.push(tn); }
        }
      }
    });
    if (index < blocks.length - 1) {
      const br = document.createElement('br');
      fragment.appendChild(br);
      insertedNodes.push(br);
    }
  });

  // Restore mentions from snapshot when exiting code block
  if (tagName === 'pre') {
    restoreMentionsFromSnapshot(blocks, fragment, insertedNodes);
  }

  if (firstBlock.parentNode) firstBlock.parentNode.insertBefore(fragment, firstBlock);
  blocks.forEach(block => block.remove());

  if (insertedNodes.length > 0) {
    const newRange = document.createRange();
    newRange.setStartBefore(insertedNodes[0]);
    newRange.setEndAfter(insertedNodes[insertedNodes.length - 1]);
    selection.removeAllRanges();
    selection.addRange(newRange);
  }
}

/** Restore mention spans from data-mention-snapshot attribute after exiting a code block. */
function restoreMentionsFromSnapshot(
  blocks: HTMLElement[],
  fragment: DocumentFragment,
  insertedNodes: Node[]
): void {
  blocks.forEach(block => {
    const snapshotAttr = block.getAttribute('data-mention-snapshot');
    if (!snapshotAttr) return;
    try {
      const mentionData = JSON.parse(snapshotAttr) as MentionSnapshot[];
      for (const mention of mentionData) {
        const label = mention.label;
        if (!label) continue;
        const walker = document.createTreeWalker(fragment, NodeFilter.SHOW_TEXT);
        let textNode: Text | null;
        let found = false;
        while (!found && (textNode = walker.nextNode() as Text | null)) {
          const content = textNode.textContent || '';
          const idx = content.indexOf(label);
          if (idx < 0 || !textNode.parentNode) continue;
          found = true;
          const before = content.substring(0, idx);
          const after = content.substring(idx + label.length);
          const mentionSpan = document.createElement('span');
          mentionSpan.className = mention.className;
          mentionSpan.setAttribute('data-uid', mention.uid);
          mentionSpan.setAttribute('data-mention-type', mention.type);
          mentionSpan.setAttribute('contenteditable', 'false');
          mentionSpan.textContent = label;
          const parent = textNode.parentNode;
          if (before) {
            const beforeNode = document.createTextNode(before);
            parent.insertBefore(beforeNode, textNode);
            const tnIdx = insertedNodes.indexOf(textNode);
            if (tnIdx >= 0) insertedNodes.splice(tnIdx, 0, beforeNode);
          }
          parent.insertBefore(mentionSpan, textNode);
          insertedNodes.push(mentionSpan);
          if (after) {
            const afterNode = document.createTextNode(after);
            parent.insertBefore(afterNode, textNode);
            insertedNodes.push(afterNode);
          }
          const origIdx = insertedNodes.indexOf(textNode);
          if (origIdx >= 0) insertedNodes.splice(origIdx, 1);
          parent.removeChild(textNode);
        }
      }
    } catch { /* JSON parse error, skip */ }
  });
}

// ==================== Inline Format Skipping Mentions ====================

/** Apply inline formatting while skipping mention spans. */
export function applyFormatSkippingMentions(command: string, tagName: string, element: HTMLElement): void {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;
  const range = selection.getRangeAt(0);

  const container = range.commonAncestorContainer;
  const searchRoot = container.nodeType === Node.ELEMENT_NODE
    ? container as HTMLElement
    : container.parentElement || element;

  const mentionsInRange: Element[] = [];
  searchRoot.querySelectorAll('[data-uid]').forEach(mention => {
    try {
      const mentionRange = document.createRange();
      mentionRange.selectNode(mention);
      if (
        range.compareBoundaryPoints(Range.START_TO_END, mentionRange) > 0 &&
        range.compareBoundaryPoints(Range.END_TO_START, mentionRange) < 0
      ) mentionsInRange.push(mention);
    } catch { /* node not in document */ }
  });

  if (mentionsInRange.length === 0) {
    try {
      if (document.execCommand) { document.execCommand(command, false); }
      else { wrapSelection(tagName, undefined, element); }
    } catch { wrapSelection(tagName, undefined, element); }
    return;
  }

  const textNodes: Text[] = [];
  const walker = document.createTreeWalker(searchRoot, NodeFilter.SHOW_TEXT, {
    acceptNode: (node: Node) => {
      try {
        const nodeRange = document.createRange();
        nodeRange.selectNode(node);
        const inRange =
          range.compareBoundaryPoints(Range.START_TO_END, nodeRange) > 0 &&
          range.compareBoundaryPoints(Range.END_TO_START, nodeRange) < 0;
        if (!inRange) return NodeFilter.FILTER_REJECT;
      } catch { return NodeFilter.FILTER_REJECT; }
      let parent = (node as Text).parentElement;
      while (parent && parent !== searchRoot) {
        if (parent.hasAttribute('data-uid')) return NodeFilter.FILTER_REJECT;
        parent = parent.parentElement;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  let textNode: Text | null;
  while ((textNode = walker.nextNode() as Text | null)) {
    if (textNode.textContent && textNode.textContent.length > 0) textNodes.push(textNode);
  }

  for (const tn of textNodes) {
    let alreadyWrapped = false;
    let p = tn.parentElement;
    while (p && p !== element) {
      if (p.tagName.toLowerCase() === tagName.toLowerCase()) { alreadyWrapped = true; break; }
      p = p.parentElement;
    }
    if (alreadyWrapped) continue;
    const wrapper = document.createElement(tagName);
    tn.parentNode?.insertBefore(wrapper, tn);
    wrapper.appendChild(tn);
  }

  try { selection.removeAllRanges(); selection.addRange(range); } catch { /* best-effort */ }
}

// ==================== List Helpers ====================

/** Manually create a list from the current selection. */
export function manuallyCreateList(listTag: string): void {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;
  const range = selection.getRangeAt(0);
  const textContent = range.extractContents().textContent || '';
  const list = document.createElement(listTag);
  const lines = textContent.split('\n').filter(l => l.trim().length > 0);
  if (lines.length === 0) lines.push(textContent || '');
  lines.forEach(line => {
    const li = document.createElement('li');
    li.textContent = line;
    list.appendChild(li);
  });
  range.insertNode(list);
  const newRange = document.createRange();
  newRange.selectNodeContents(list);
  selection.removeAllRanges();
  selection.addRange(newRange);
}

/** Ensure current selection content is wrapped in a block element (for execCommand compatibility). */
export function ensureBlockWrapping(): void {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;
  const range = selection.getRangeAt(0);
  const content = range.extractContents();
  const div = document.createElement('div');
  div.appendChild(content);
  range.insertNode(div);
  const newRange = document.createRange();
  newRange.selectNodeContents(div);
  selection.removeAllRanges();
  selection.addRange(newRange);
}
