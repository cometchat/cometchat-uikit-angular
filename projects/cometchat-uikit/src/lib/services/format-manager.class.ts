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

  constructor(element: HTMLElement) {
    this.element = element;
  }

  // ==================== Inline Formatting ====================

  /** Apply bold formatting. Skips mention spans. @see Req 2.1 */
  applyBold(): void {
    this.element.focus();
    if (isInsideFormattedElement('pre', this.element)) return;
    applyFormatSkippingMentions('bold', 'strong', this.element);
  }

  /** Apply italic formatting. Skips mention spans. @see Req 2.2 */
  applyItalic(): void {
    this.element.focus();
    if (isInsideFormattedElement('pre', this.element)) return;
    applyFormatSkippingMentions('italic', 'em', this.element);
  }

  /** Apply underline formatting. Skips mention spans. @see Req 2.3 */
  applyUnderline(): void {
    this.element.focus();
    if (isInsideFormattedElement('pre', this.element)) return;
    applyFormatSkippingMentions('underline', 'u', this.element);
  }

  /** Apply strikethrough formatting. Skips mention spans. @see Req 2.4 */
  applyStrikethrough(): void {
    this.element.focus();
    if (isInsideFormattedElement('pre', this.element)) return;
    applyFormatSkippingMentions('strikeThrough', 's', this.element);
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

  // ==================== Format State ====================

  /** Check if a specific format is currently active at the cursor position. */
  isActive(format: string): boolean {
    try {
      if (document.queryCommandState) return document.queryCommandState(format);
    } catch {
      return isInsideFormattedElement(format, this.element);
    }
    return false;
  }

  /** Get the current format state for all supported formats. */
  getCurrentFormats(): RichTextFormatState {
    const isLink = isInsideFormattedElement('a', this.element);
    // When inside a link, queryCommandState('underline') returns true due to text-decoration.
    // Check for an actual <u> tag instead to avoid false positives.
    const isUnderline = isLink
      ? isInsideFormattedElement('u', this.element)
      : this.isActive('underline');

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
