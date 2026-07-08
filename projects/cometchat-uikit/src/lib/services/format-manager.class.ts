/**
 * FormatManager Class
 *
 * Handles text formatting operations using document.execCommand and Selection API.
 * Provides methods for applying inline and block formatting to contenteditable content.
 *
 * @module services/format-manager
 * @see Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7
 */

import { RichTextFormatState } from './rich-text-editor.interfaces';

/** Inline marks whose active state is driven by execCommand (no DOM inserted). */
type PendingInlineFormat = 'bold' | 'italic' | 'underline' | 'strikethrough';
import {
  applyBlockFormat,
  applyFormatSkippingMentions,
  ensureBlockWrapping,
  exitBlockFormat,
  isInsideFormattedElement,
  isInsideOrContainsFormattedElement,
  manuallyCreateList,
  wrapSelection,
} from './format-manager.utils';
/**
 * FormatManager handles all text formatting operations for a contenteditable element.
 * It uses document.execCommand with fallbacks for browser compatibility.
 * Heavy DOM logic is delegated to format-manager.utils.ts.
 */
export class FormatManager {
  private element: HTMLElement;

  /**
   * Pending inline-mark state for an EMPTY editor.
   *
   * bold/italic/underline/strikethrough are applied via document.execCommand,
   * which only toggles the browser's pending "typing state" and inserts no DOM.
   * On an empty composer the editor stays empty, so getCurrentFormats() — which
   * returns all-false when empty to avoid stale queryCommandState after a clear —
   * would never reflect a toolbar toggle until the user starts typing.
   *
   * We mirror the real command state here right after each toggle so the toolbar
   * can show active/inactive immediately on an empty composer, and reset it on
   * clear() so stale state never leaks across messages.
   */
  private pendingEmptyInlineFormats: Record<PendingInlineFormat, boolean> = {
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
  };

  constructor(element: HTMLElement) {
    this.element = element;
  }

  /** True when the editor has no meaningful content (only whitespace / <br>). */
  private isEditorEmpty(): boolean {
    return (
      !this.element.textContent?.trim() &&
      (!this.element.innerHTML.trim() || /^(<br\s*\/?>)*$/i.test(this.element.innerHTML.trim()))
    );
  }

  /**
   * Record the pending state of an inline mark after a toolbar toggle.
   * On an empty editor we capture the real command state so the toolbar reflects
   * what the next typed character will be; once content exists, queryCommandState
   * is authoritative and the pending value is cleared so it can't go stale.
   */
  private syncPendingEmptyFormat(format: PendingInlineFormat, command: string): void {
    this.pendingEmptyInlineFormats[format] = this.isEditorEmpty() ? this.isActive(command) : false;
  }

  /** Clear pending inline-mark state. Called when the editor content is cleared. */
  resetPendingEmptyFormats(): void {
    this.pendingEmptyInlineFormats = { bold: false, italic: false, underline: false, strikethrough: false };
  }

  // ==================== Inline Formatting ====================

  /** Apply bold formatting. Skips mention spans. @see Req 2.1 */
  applyBold(): void {
    this.element.focus();
    if (isInsideFormattedElement('pre', this.element)) return;
    applyFormatSkippingMentions('bold', 'strong', this.element);
    this.syncPendingEmptyFormat('bold', 'bold');
  }

  /** Apply italic formatting. Skips mention spans. @see Req 2.2 */
  applyItalic(): void {
    this.element.focus();
    if (isInsideFormattedElement('pre', this.element)) return;
    applyFormatSkippingMentions('italic', 'em', this.element);
    this.syncPendingEmptyFormat('italic', 'italic');
  }

  /** Apply underline formatting. Skips mention spans. @see Req 2.3 */
  applyUnderline(): void {
    this.element.focus();
    if (isInsideFormattedElement('pre', this.element)) return;
    applyFormatSkippingMentions('underline', 'u', this.element);
    this.syncPendingEmptyFormat('underline', 'underline');
  }

  /** Apply strikethrough formatting. Skips mention spans. @see Req 2.4 */
  applyStrikethrough(): void {
    this.element.focus();
    if (isInsideFormattedElement('pre', this.element)) return;
    applyFormatSkippingMentions('strikeThrough', 's', this.element);
    this.syncPendingEmptyFormat('strikethrough', 'strikeThrough');
  }

  /** Apply inline code formatting. Wraps selection in &lt;code&gt;. @see Req 2.5 */
  applyInlineCode(): void {
    this.element.focus();
    wrapSelection('code', 'cometchat-rich-text__code', this.element);
  }

  // ==================== Block Formatting ====================

  /**
   * Apply code block formatting (&lt;pre&gt;).
   * Exits if already in a code block. Removes blockquote first (mutual exclusivity).
   * @see Req 2.6
   */
  applyCodeBlock(): void {
    this.element.focus();
    // ENG-35732 (Safari): ensure a valid range exists after focus() before
    // querying the selection — Safari may return rangeCount === 0 synchronously.
    this.ensureSafariSelection();
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    if (isInsideOrContainsFormattedElement('pre', this.element)) {
      exitBlockFormat('pre', this.element);
      return;
    }
    if (isInsideOrContainsFormattedElement('blockquote', this.element)) {
      exitBlockFormat('blockquote', this.element);
    }
    applyBlockFormat('pre', 'cometchat-rich-text__code-block', this.element);
  }

  /**
   * Apply blockquote formatting.
   * Exits if already in a blockquote. Removes code block first (mutual exclusivity).
   * @see Req 2.7
   */
  applyBlockquote(): void {
    this.element.focus();
    // ENG-35732 (Safari): ensure a valid range exists after focus().
    this.ensureSafariSelection();
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    if (isInsideOrContainsFormattedElement('blockquote', this.element)) {
      exitBlockFormat('blockquote', this.element);
      return;
    }
    if (isInsideOrContainsFormattedElement('pre', this.element)) {
      exitBlockFormat('pre', this.element);
    }
    applyBlockFormat('blockquote', 'cometchat-rich-text__blockquote', this.element);
  }

  /**
   * Apply ordered list formatting.
   * Removes code block first (mutual exclusivity). @see Req 3.1
   */
  applyOrderedList(): void {
    this.element.focus();
    if (isInsideOrContainsFormattedElement('pre', this.element)) {
      exitBlockFormat('pre', this.element);
      ensureBlockWrapping();
    }
    try {
      let success = false;
      if (document.execCommand) success = document.execCommand('insertOrderedList', false);
      if (!success && !this.element.querySelector('ol')) manuallyCreateList('ol');
    } catch {
      manuallyCreateList('ol');
    }
  }

  /**
   * Apply bullet list formatting.
   * Removes code block first (mutual exclusivity). @see Req 3.2
   */
  applyBulletList(): void {
    this.element.focus();
    if (isInsideOrContainsFormattedElement('pre', this.element)) {
      exitBlockFormat('pre', this.element);
      ensureBlockWrapping();
    }
    try {
      let success = false;
      if (document.execCommand) success = document.execCommand('insertUnorderedList', false);
      if (!success && !this.element.querySelector('ul')) manuallyCreateList('ul');
    } catch {
      manuallyCreateList('ul');
    }
  }

  // ==================== Safari Selection Helper ====================

  /**
   * ENG-35732: Safari does not synchronously restore window.getSelection()
   * after a programmatic element.focus() call. When the toolbar button is
   * clicked, the contenteditable loses focus and rangeCount drops to 0.
   * This helper synthesises a collapsed range at the end of the element's
   * content so that subsequent formatting calls have a valid anchor point.
   */
  private ensureSafariSelection(): void {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount > 0) return;
    const range = document.createRange();
    if (this.element.lastChild) {
      range.setStartAfter(this.element.lastChild);
    } else {
      range.setStart(this.element, 0);
    }
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  // ==================== Format State ====================

  /** Check if a specific format is currently active at the cursor position. */
  isActive(format: string): boolean {    try {
      if (document.queryCommandState) return document.queryCommandState(format);
    } catch {
      return isInsideFormattedElement(format, this.element);
    }
    return false;
  }

  /** Get the current format state for all supported formats. */
  getCurrentFormats(): RichTextFormatState {
    // If the editor is empty, return all-false immediately.
    // Browsers can return stale queryCommandState('bold') = true on empty
    // contenteditables if formatting was active before the content was cleared.
    const isEmpty = this.isEditorEmpty();
    if (isEmpty) {
      // Inline marks (bold/italic/underline/strikethrough) leave no DOM, so reflect
      // the pending toolbar toggle state captured at apply time. Block/list/code/link
      // formats can't be active on truly empty content, so they stay false.
      return {
        ...this.pendingEmptyInlineFormats,
        code: false, blockquote: false, codeBlock: false, orderedList: false, bulletList: false, link: false,
      };
    }

    const isLink = isInsideFormattedElement('a', this.element);
    // Never use queryCommandState('underline') — browsers return true when the cursor
    // is inside or adjacent to an <a> tag due to text-decoration, causing false positives.
    // Always check for an actual <u> element in the ancestor chain instead.
    const isUnderline = isInsideFormattedElement('u', this.element);

    return {
      bold: this.isActive('bold'),
      italic: this.isActive('italic'),
      underline: isUnderline,
      strikethrough: this.isActive('strikeThrough'),
      code: isInsideFormattedElement('code', this.element),
      blockquote: isInsideFormattedElement('blockquote', this.element),
      codeBlock: isInsideFormattedElement('pre', this.element),
      orderedList: this.isActive('insertOrderedList'),
      bulletList: this.isActive('insertUnorderedList'),
      link: isLink,
    };
  }
}
