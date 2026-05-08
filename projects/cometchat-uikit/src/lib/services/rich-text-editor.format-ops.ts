/**
 * Format application methods for RichTextEditor.
 * Extracted to reduce class file size.
 */

import { RichTextFormatState } from './rich-text-editor.interfaces';

export interface FormatOpsContext {
  formatManager: any;
  listManager: any;
  linkManager: any;
  contentEditable: HTMLDivElement;
  currentFormatState: RichTextFormatState;
  justAppliedFormatting: boolean;
  protectMentionsFromFormatting: () => void;
  convertMentionsToPlainText: (container: Element) => void;
  updateFormatState: () => void;
  emitUpdate: () => void;
  pushToHistory: () => void;
  announceToScreenReader: (msg: string) => void;
}

export function applyBoldImpl(ctx: FormatOpsContext): void {
  ctx.formatManager.applyBold();
  ctx.protectMentionsFromFormatting();
  ctx.updateFormatState();
  ctx.emitUpdate();
  ctx.announceToScreenReader(ctx.currentFormatState.bold ? 'Bold applied' : 'Bold removed');
}

export function applyItalicImpl(ctx: FormatOpsContext): void {
  ctx.formatManager.applyItalic();
  ctx.protectMentionsFromFormatting();
  ctx.updateFormatState();
  ctx.emitUpdate();
  ctx.announceToScreenReader(ctx.currentFormatState.italic ? 'Italic applied' : 'Italic removed');
}

export function applyUnderlineImpl(ctx: FormatOpsContext): void {
  ctx.formatManager.applyUnderline();
  ctx.protectMentionsFromFormatting();
  ctx.updateFormatState();
  ctx.emitUpdate();
  ctx.announceToScreenReader(ctx.currentFormatState.underline ? 'Underline applied' : 'Underline removed');
}

export function applyStrikethroughImpl(ctx: FormatOpsContext): void {
  ctx.formatManager.applyStrikethrough();
  ctx.protectMentionsFromFormatting();
  ctx.updateFormatState();
  ctx.emitUpdate();
  ctx.announceToScreenReader(ctx.currentFormatState.strikethrough ? 'Strikethrough applied' : 'Strikethrough removed');
}

export function applyInlineCodeImpl(ctx: FormatOpsContext): void {
  (ctx as any).justAppliedFormatting = true;
  ctx.formatManager.applyInlineCode();
  ctx.contentEditable.querySelectorAll('code').forEach((c: Element) => ctx.convertMentionsToPlainText(c));
  ctx.updateFormatState();
  ctx.emitUpdate();
  ctx.announceToScreenReader(ctx.currentFormatState.code ? 'Code formatting applied' : 'Code formatting removed');
}

export function applyCodeBlockImpl(ctx: FormatOpsContext): void {
  (ctx as any).justAppliedFormatting = true;
  if (ctx.currentFormatState.orderedList || ctx.currentFormatState.bulletList) {
    ctx.listManager.exitList();
    ctx.updateFormatState();
  }
  ctx.formatManager.applyCodeBlock();
  ctx.contentEditable.querySelectorAll('pre').forEach((p: Element) => ctx.convertMentionsToPlainText(p));
  ctx.updateFormatState();
  ctx.emitUpdate();
  ctx.announceToScreenReader(ctx.currentFormatState.codeBlock ? 'Code block applied' : 'Code block removed');
}

export function applyBlockquoteImpl(ctx: FormatOpsContext): void {
  (ctx as any).justAppliedFormatting = true;
  ctx.formatManager.applyBlockquote();
  ctx.updateFormatState();
  ctx.emitUpdate();
  ctx.announceToScreenReader(ctx.currentFormatState.blockquote ? 'Blockquote applied' : 'Blockquote removed');
}

export function applyOrderedListImpl(ctx: FormatOpsContext): void {
  (ctx as any).justAppliedFormatting = true;
  if (ctx.currentFormatState.codeBlock || ctx.contentEditable.querySelector('pre')) {
    ctx.formatManager.applyCodeBlock();
    ctx.updateFormatState();
  }
  ctx.listManager.toggleOrderedList();
  ctx.updateFormatState();
  ctx.pushToHistory();
  ctx.emitUpdate();
  ctx.announceToScreenReader(ctx.currentFormatState.orderedList ? 'Ordered list applied' : 'Ordered list removed');
}

export function applyBulletListImpl(ctx: FormatOpsContext): void {
  (ctx as any).justAppliedFormatting = true;
  if (ctx.currentFormatState.codeBlock || ctx.contentEditable.querySelector('pre')) {
    ctx.formatManager.applyCodeBlock();
    ctx.updateFormatState();
  }
  ctx.listManager.toggleBulletList();
  ctx.updateFormatState();
  ctx.pushToHistory();
  ctx.emitUpdate();
  ctx.announceToScreenReader(ctx.currentFormatState.bulletList ? 'Bullet list applied' : 'Bullet list removed');
}

export function setLinkImpl(ctx: FormatOpsContext, url: string | null, text?: string): void {
  if (url === null) { ctx.linkManager.removeLink(); } else if (ctx.linkManager.isLinkActive()) { ctx.linkManager.updateLink(url, text); } else { ctx.linkManager.insertLink(url, text); }
  ctx.updateFormatState();
  ctx.pushToHistory();
  ctx.emitUpdate();
}

export function isLinkActiveImpl(ctx: FormatOpsContext): boolean { return ctx.linkManager.isLinkActive(); }
export function getCurrentLinkImpl(ctx: FormatOpsContext): string | null { return ctx.linkManager.getCurrentLink(); }
export function getCurrentLinkTextImpl(ctx: FormatOpsContext): string | null { return ctx.linkManager.getCurrentLinkText(); }
export function isInListImpl(ctx: FormatOpsContext): boolean { return ctx.listManager.isInList(); }
