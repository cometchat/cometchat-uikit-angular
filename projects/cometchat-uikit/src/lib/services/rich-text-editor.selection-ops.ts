/**
 * Selection/cursor operation methods for RichTextEditor.
 * Extracted to reduce class file size.
 */

import { SelectionState } from './rich-text-editor.interfaces';
import { CometChatLogger } from '../utils/CometChatLogger';

export interface SelectionOpsContext {
  selectionManager: any;
  contentEditable: HTMLDivElement;
  lastSavedRange: Range | null;
  pushToHistory: () => void;
  emitUpdate: () => void;
}

export function setCursorPositionImpl(ctx: SelectionOpsContext, position: 'start' | 'end' | number): void {
  ctx.selectionManager.setCursorPosition(position);
}

export function selectAllImpl(ctx: SelectionOpsContext): void {
  ctx.selectionManager.selectAll();
}

export function getSelectionImpl(ctx: SelectionOpsContext): Selection | null {
  return ctx.selectionManager.getSelection();
}

export function getSelectedTextImpl(ctx: SelectionOpsContext): string {
  return ctx.selectionManager.getSelectedText();
}

export function saveSelectionImpl(ctx: SelectionOpsContext): SelectionState {
  return ctx.selectionManager.saveSelection();
}

export function restoreSelectionImpl(ctx: SelectionOpsContext, state: SelectionState): void {
  ctx.selectionManager.restoreSelection(state);
}

export function getFormatStateImpl(ctx: SelectionOpsContext): any {
  return (ctx as any).currentFormatState;
}

export function insertTextImpl(ctx: SelectionOpsContext, text: string): void {
  if (!ctx.contentEditable.contains(document.activeElement)) { ctx.contentEditable.focus(); }
  let selection = ctx.selectionManager.getSelection();
  let range: Range;
  if (selection && selection.rangeCount > 0) { range = selection.getRangeAt(0); } else if (ctx.lastSavedRange) {
    range = ctx.lastSavedRange;
    if (selection) { selection.removeAllRanges(); selection.addRange(range); }
  } else {
    range = document.createRange();
    range.selectNodeContents(ctx.contentEditable);
    range.collapse(false);
    if (selection) { selection.removeAllRanges(); selection.addRange(range); }
  }
  range.deleteContents();
  const textNode = document.createTextNode(text);
  range.insertNode(textNode);
  range.setStartAfter(textNode);
  range.collapse(true);
  selection = ctx.selectionManager.getSelection();
  if (selection) { selection.removeAllRanges(); selection.addRange(range); }
  (ctx as any).lastSavedRange = null;
  ctx.pushToHistory();
  ctx.emitUpdate();
}

export function deleteRangeImpl(ctx: SelectionOpsContext, from: number, to: number): void {
  if (from < 0 || to < from) { CometChatLogger.warn('RichTextEditor', 'Invalid range for deleteRange:', from, to); return; }
  const startNode = ctx.selectionManager['getTextNodeAtOffset'](from);
  const endNode = ctx.selectionManager['getTextNodeAtOffset'](to);
  if (!startNode || !endNode) { CometChatLogger.warn('RichTextEditor', 'Could not find nodes at specified positions'); return; }
  const range = document.createRange();
  range.setStart(startNode.node, startNode.offset);
  range.setEnd(endNode.node, endNode.offset);
  range.deleteContents();
  const selection = ctx.selectionManager.getSelection();
  if (selection) { range.collapse(true); selection.removeAllRanges(); selection.addRange(range); }
  ctx.pushToHistory();
  ctx.emitUpdate();
}

export function getCharacterOffsetImpl(ctx: SelectionOpsContext): number {
  const selection = ctx.selectionManager.getSelection();
  if (!selection || selection.rangeCount === 0) return 0;
  const range = selection.getRangeAt(0);
  const preRange = document.createRange();
  preRange.selectNodeContents(ctx.contentEditable);
  preRange.setEnd(range.startContainer, range.startOffset);
  return preRange.toString().length;
}

export function restoreCharacterOffsetImpl(ctx: SelectionOpsContext, targetOffset: number): void {
  const selection = ctx.selectionManager.getSelection();
  if (!selection) return;
  let currentOffset = 0;
  const walker = document.createTreeWalker(ctx.contentEditable, NodeFilter.SHOW_TEXT);
  let textNode: Text | null;
  while ((textNode = walker.nextNode() as Text | null)) {
    const nodeLength = (textNode.textContent || '').length;
    if (currentOffset + nodeLength >= targetOffset) {
      const range = document.createRange();
      range.setStart(textNode, targetOffset - currentOffset);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
      return;
    }
    currentOffset += nodeLength;
  }
  const range = document.createRange();
  range.selectNodeContents(ctx.contentEditable);
  range.collapse(false);
  selection.removeAllRanges();
  selection.addRange(range);
}
