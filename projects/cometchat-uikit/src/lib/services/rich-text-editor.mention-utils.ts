/**
 * Mention handling utilities for RichTextEditor class.
 *
 * Extracted from rich-text-editor.class.ts to isolate
 * mention node detection, boundary movement, and range intersection logic.
 */

// ==================== Mention Node Detection ====================

/**
 * CSS class applied to mention chip elements in the editor DOM.
 */
export const MENTION_CHIP_CLASS = 'cometchat-mention-chip';

/**
 * Checks whether a DOM node is a mention chip element.
 */
export function isMentionNode(node: Node): boolean {
  if (node.nodeType !== Node.ELEMENT_NODE) return false;
  return (node as HTMLElement).classList.contains(MENTION_CHIP_CLASS);
}

/**
 * Walks up the DOM tree to find the nearest mention ancestor of a node.
 * Returns null if no mention ancestor is found.
 */
export function findMentionAncestor(node: Node): HTMLElement | null {
  let current: Node | null = node;
  while (current) {
    if (isMentionNode(current)) return current as HTMLElement;
    current = current.parentNode;
  }
  return null;
}

// ==================== Mention Range Helpers ====================

/**
 * Collects all mention nodes that intersect with a given selection range.
 *
 * @param range - The current selection range
 * @param container - The editor's content-editable container
 */
export function getMentionsInRange(
  range: Range,
  container: HTMLElement
): HTMLElement[] {
  const mentions = Array.from(
    container.querySelectorAll<HTMLElement>(`.${MENTION_CHIP_CLASS}`)
  );
  return mentions.filter(mention => doesRangeIntersectNode(range, mention));
}

/**
 * Checks whether a range intersects with a given node.
 */
export function doesRangeIntersectNode(range: Range, node: Node): boolean {
  const nodeRange = document.createRange();
  nodeRange.selectNode(node);
  return (
    range.compareBoundaryPoints(Range.END_TO_START, nodeRange) < 0 &&
    range.compareBoundaryPoints(Range.START_TO_END, nodeRange) > 0
  );
}

/**
 * Extends a selection range to fully include any partially-selected mention nodes.
 *
 * @param range - The range to extend (modified in place)
 * @param mentions - Mention nodes that intersect the range
 */
export function extendSelectionToIncludeMentions(
  range: Range,
  mentions: HTMLElement[]
): void {
  if (mentions.length === 0) return;

  const first = mentions[0];
  const last = mentions[mentions.length - 1];

  // Extend start to include first mention if partially selected
  const firstRange = document.createRange();
  firstRange.selectNode(first);
  if (range.compareBoundaryPoints(Range.START_TO_START, firstRange) > 0) {
    range.setStartBefore(first);
  }

  // Extend end to include last mention if partially selected
  const lastRange = document.createRange();
  lastRange.selectNode(last);
  if (range.compareBoundaryPoints(Range.END_TO_END, lastRange) < 0) {
    range.setEndAfter(last);
  }
}

// ==================== Cursor Boundary Movement ====================

/**
 * Moves the cursor to the appropriate boundary of a mention node
 * when the cursor is placed inside it.
 *
 * @param mentionNode - The mention chip element
 * @param range - The current selection range
 */
export function moveCursorToMentionBoundary(
  mentionNode: HTMLElement,
  range: Range
): void {
  const mentionRange = document.createRange();
  mentionRange.selectNode(mentionNode);

  const mentionMidpoint =
    (mentionRange.getBoundingClientRect().left +
      mentionRange.getBoundingClientRect().right) /
    2;

  const cursorX = range.getBoundingClientRect().left;

  if (cursorX <= mentionMidpoint) {
    // Move cursor before the mention
    range.setStartBefore(mentionNode);
    range.setEndBefore(mentionNode);
  } else {
    // Move cursor after the mention
    range.setStartAfter(mentionNode);
    range.setEndAfter(mentionNode);
  }

  const selection = window.getSelection();
  if (selection) {
    selection.removeAllRanges();
    selection.addRange(range);
  }
}

// ==================== Mention Text Extraction ====================

/**
 * Extracts all unique mention UIDs from the editor's content.
 *
 * @param container - The editor's content-editable container
 */
export function getUniqueMentionUids(container: HTMLElement): Set<string> {
  const uids = new Set<string>();
  const mentions = container.querySelectorAll<HTMLElement>(`.${MENTION_CHIP_CLASS}`);
  mentions.forEach(mention => {
    const uid = mention.getAttribute('data-uid');
    if (uid) uids.add(uid);
  });
  return uids;
}

/**
 * Converts mention chip elements to SDK mention format (@uid).
 * Used when extracting text for message sending.
 *
 * @param container - The editor's content-editable container
 */
export function convertMentionsToPlainText(container: Element): void {
  const mentions = container.querySelectorAll<HTMLElement>(`.${MENTION_CHIP_CLASS}`);
  mentions.forEach(mention => {
    const uid = mention.getAttribute('data-uid') || '';
    const textNode = document.createTextNode(`@${uid}`);
    mention.parentNode?.replaceChild(textNode, mention);
  });
}
