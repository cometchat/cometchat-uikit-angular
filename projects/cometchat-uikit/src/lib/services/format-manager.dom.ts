/**
 * format-manager.dom.ts
 *
 * Low-level DOM helpers for FormatManager: node/range queries,
 * mention snapshot/strip utilities, and wrap/unwrap selection.
 */

import { CometChatLogger } from '../utils/CometChatLogger';

// ==================== Node/Range Helpers ====================

/** Check if a node intersects with a range. */
export function isNodeInRange(node: Node, range: Range): boolean {
  try {
    const nodeRange = document.createRange();
    nodeRange.selectNode(node);
    return (
      range.compareBoundaryPoints(Range.START_TO_END, nodeRange) > 0 &&
      range.compareBoundaryPoints(Range.END_TO_START, nodeRange) < 0
    );
  } catch { return false; }
}

/** Get all block-level elements within the selection range. */
export function getSelectedBlocks(range: Range, element: HTMLElement): HTMLElement[] {
  const blocks: HTMLElement[] = [];
  const commonAncestor = range.commonAncestorContainer;
  const searchRoot: HTMLElement = commonAncestor.nodeType === Node.ELEMENT_NODE
    ? commonAncestor as HTMLElement
    : commonAncestor.parentElement || element;

  const blockTags = ['p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li'];
  blockTags.forEach(tag => {
    searchRoot.querySelectorAll(tag).forEach(el => {
      if (isNodeInRange(el, range)) blocks.push(el as HTMLElement);
    });
  });

  if (blocks.length === 0) {
    let node: Node | null = range.startContainer;
    while (node && node !== element) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        if (blockTags.includes(el.tagName.toLowerCase())) { blocks.push(el); break; }
      }
      node = node.parentNode;
    }
  }
  return blocks;
}

/** Get all blocks of a specific tag type within the selection range. */
export function getSelectedBlocksOfType(range: Range, tagName: string, element: HTMLElement): HTMLElement[] {
  const blocks: HTMLElement[] = [];
  const commonAncestor = range.commonAncestorContainer;
  const searchRoot: HTMLElement = commonAncestor.nodeType === Node.ELEMENT_NODE
    ? commonAncestor as HTMLElement
    : commonAncestor.parentElement || element;

  searchRoot.querySelectorAll(tagName).forEach(el => {
    if (isNodeInRange(el, range)) blocks.push(el as HTMLElement);
  });

  if (blocks.length === 0) {
    let node: Node | null = range.startContainer;
    while (node && node !== element) {
      if (node.nodeType === Node.ELEMENT_NODE &&
          (node as HTMLElement).tagName.toLowerCase() === tagName.toLowerCase()) {
        blocks.push(node as HTMLElement);
        break;
      }
      node = node.parentNode;
    }
  }
  return blocks;
}

/** Check if cursor is inside an element with the given tag name. */
export function isInsideFormattedElement(tagName: string, element: HTMLElement): boolean {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return false;
  let node = selection.anchorNode;
  while (node && node !== element) {
    if (node.nodeType === Node.ELEMENT_NODE &&
        (node as HTMLElement).tagName.toLowerCase() === tagName.toLowerCase()) return true;
    node = node.parentNode;
  }
  return false;
}

/** Check if cursor is inside or selection contains an element with the given tag. */
export function isInsideOrContainsFormattedElement(tagName: string, element: HTMLElement): boolean {
  if (isInsideFormattedElement(tagName, element)) return true;
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return false;
  const range = selection.getRangeAt(0);
  const container = range.commonAncestorContainer;
  const searchRoot = container.nodeType === Node.ELEMENT_NODE
    ? container as HTMLElement
    : container.parentElement || element;
  if (searchRoot.tagName?.toLowerCase() === tagName.toLowerCase()) return true;
  return searchRoot.querySelector(tagName) !== null;
}

// ==================== Mention Snapshot Helpers ====================

export type MentionSnapshot = { uid: string; label: string; type: string; className: string };

/** Snapshot mention metadata from a wrapper before stripping. */
export function snapshotMentions(wrapper: HTMLElement): void {
  const mentions = wrapper.querySelectorAll('[data-uid]');
  if (mentions.length === 0) return;
  const data: MentionSnapshot[] = [];
  mentions.forEach(m => {
    data.push({
      uid: m.getAttribute('data-uid') || '',
      label: m.textContent || '',
      type: m.getAttribute('data-mention-type') || 'other',
      className: (m as HTMLElement).className || '',
    });
  });
  wrapper.setAttribute('data-mention-snapshot', JSON.stringify(data));
}

/** Strip inline formatting tags from a wrapper (for code blocks). */
export function stripInlineFormatting(wrapper: HTMLElement): void {
  wrapper.querySelectorAll('strong, em, u, s, b, i, del, strike').forEach(tag => {
    const parent = tag.parentNode;
    while (tag.firstChild) parent?.insertBefore(tag.firstChild, tag);
    parent?.removeChild(tag);
  });
}

/** Strip mention spans from a wrapper, replacing with plain text. */
export function stripMentions(wrapper: HTMLElement): void {
  wrapper.querySelectorAll('[data-mention-id], [data-uid]').forEach(mention => {
    mention.parentNode?.replaceChild(document.createTextNode(mention.textContent || ''), mention);
  });
}

/** Strip inline formatting ancestor elements wrapping a node. */
export function stripInlineAncestors(wrapper: HTMLElement, element: HTMLElement): void {
  const inlineAncestorTags = ['strong', 'em', 'u', 's', 'b', 'i', 'del', 'strike'];
  let ancestor = wrapper.parentElement;
  while (ancestor && ancestor !== element) {
    const nextAncestor = ancestor.parentElement;
    if (inlineAncestorTags.includes(ancestor.tagName.toLowerCase())) {
      const parent = ancestor.parentNode;
      if (parent) {
        while (ancestor.firstChild) parent.insertBefore(ancestor.firstChild, ancestor);
        parent.removeChild(ancestor);
      }
    }
    ancestor = nextAncestor;
  }
}

// ==================== Wrap/Unwrap Selection ====================

/** Wrap the current selection in a tag, or unwrap if already inside that tag. */
export function wrapSelection(tagName: string, className: string | undefined, element: HTMLElement): void {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;
  const range = selection.getRangeAt(0);

  if (isInsideFormattedElement(tagName, element)) {
    unwrapSelection(tagName, element);
    return;
  }

  const selectedContent = range.extractContents();
  const wrapper = document.createElement(tagName);
  if (className) wrapper.className = className;
  wrapper.appendChild(selectedContent);

  if (tagName === 'pre') {
    stripInlineFormatting(wrapper);
    snapshotMentions(wrapper);
    stripMentions(wrapper);
  }
  if (tagName === 'pre' || tagName === 'code') stripMentions(wrapper);

  const isEmptyInline = wrapper.textContent === '' && tagName !== 'pre';
  if (isEmptyInline) wrapper.appendChild(document.createTextNode('\u200B'));

  range.insertNode(wrapper);
  if (tagName === 'pre') stripInlineAncestors(wrapper, element);

  selection.removeAllRanges();
  const newRange = document.createRange();
  if (isEmptyInline) {
    const textNode = wrapper.firstChild!;
    newRange.setStart(textNode, 1);
    newRange.collapse(true);
  } else {
    newRange.selectNodeContents(wrapper);
  }
  selection.addRange(newRange);
}

/** Unwrap content from a tag, preserving selection. */
export function unwrapSelection(tagName: string, element: HTMLElement): void {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;
  const range = selection.getRangeAt(0);
  const startOffset = range.startOffset;
  const endOffset = range.endOffset;
  const startContainer = range.startContainer;
  const endContainer = range.endContainer;

  let node = selection.anchorNode;
  let targetElement: HTMLElement | null = null;
  while (node && node !== element) {
    if (node.nodeType === Node.ELEMENT_NODE &&
        (node as HTMLElement).tagName.toLowerCase() === tagName.toLowerCase()) {
      targetElement = node as HTMLElement;
      break;
    }
    node = node.parentNode;
  }
  if (!targetElement) return;

  const parent = targetElement.parentNode;
  if (!parent) return;

  const movedNodes: Node[] = [];
  while (targetElement.firstChild) {
    const child = targetElement.firstChild;
    parent.insertBefore(child, targetElement);
    movedNodes.push(child);
  }
  parent.removeChild(targetElement);

  if (movedNodes.length > 0) {
    const newRange = document.createRange();
    try {
      if (startContainer === endContainer && movedNodes.length === 1) {
        const textNode = movedNodes[0];
        if (textNode.nodeType === Node.TEXT_NODE) {
          newRange.setStart(textNode, Math.min(startOffset, textNode.textContent?.length || 0));
          newRange.setEnd(textNode, Math.min(endOffset, textNode.textContent?.length || 0));
        } else {
          newRange.selectNodeContents(textNode);
        }
      } else {
        newRange.setStartBefore(movedNodes[0]);
        newRange.setEndAfter(movedNodes[movedNodes.length - 1]);
      }
      selection.removeAllRanges();
      selection.addRange(newRange);
    } catch {
      try {
        newRange.setStartBefore(movedNodes[0]);
        newRange.setEndAfter(movedNodes[movedNodes.length - 1]);
        selection.removeAllRanges();
        selection.addRange(newRange);
      } catch (fallbackError) {
        CometChatLogger.warn('FormatManager', 'Failed to restore selection after unwrap', fallbackError);
      }
    }
  }
}
