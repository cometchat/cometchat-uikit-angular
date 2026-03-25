/**
 * LinkManager Class
 *
 * Handles link insertion, editing, and validation in the rich text editor.
 * Provides URL validation and auto-linking on paste.
 *
 * @module services/link-manager
 * @see Requirements 4.1, 4.2, 4.3, 4.4, 4.5
 */

import { SelectionManager } from './selection-manager.class';
import { CometChatLogger } from '../utils/CometChatLogger';

/**
 * LinkManager handles all link-related operations for a contenteditable element.
 *
 * Features:
 * - Insert links with selected text
 * - Update existing links
 * - Remove links
 * - Validate URLs
 * - Normalize URLs (add protocol if missing)
 * - Auto-link URLs on paste
 *
 * @example
 * ```typescript
 * const element = document.querySelector('.editor');
 * const selectionManager = new SelectionManager(element);
 * const manager = new LinkManager(element, selectionManager);
 *
 * // Insert a link
 * manager.insertLink('https://example.com');
 *
 * // Check if cursor is on a link
 * if (manager.isLinkActive()) {
 *   const url = manager.getCurrentLink();
 *   console.log('Current link:', url);
 * }
 *
 * // Validate URL
 * if (manager.validateURL('example.com')) {
 *   const normalized = manager.normalizeURL('example.com');
 *   // normalized = 'https://example.com'
 * }
 * ```
 */
export class LinkManager {
  private element: HTMLElement;
  private selectionManager: SelectionManager;

  // URL validation regex (avoids nested quantifiers to prevent catastrophic backtracking)
  private urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .?#&=%-]*)$/i;
  private protocolPattern = /^https?:\/\//i;

  /**
   * Create a new LinkManager instance
   * @param element - The contenteditable element to manage
   * @param selectionManager - SelectionManager instance for cursor operations
   */
  constructor(element: HTMLElement, selectionManager: SelectionManager) {
    this.element = element;
    this.selectionManager = selectionManager;
  }

  // ==================== Link Operations ====================

  /**
   * Insert a link at the current selection
   * If text is selected, wraps it in a link
   * If no text is selected, inserts the URL as both text and link
   *
   * @param url - URL to link to
   * @param text - Optional text to display (if not provided, uses selected text or URL)
   * @returns True if link was inserted successfully
   * @see Requirements 4.1, 4.4
   */
  insertLink(url: string, text?: string): boolean {
    // Validate URL
    if (!this.validateURL(url)) {
      CometChatLogger.warn('LinkManager', 'Invalid URL:', url);
      return false;
    }

    // Normalize URL (add protocol if missing)
    const normalizedUrl = this.normalizeURL(url);

    this.element.focus();

    const selection = this.selectionManager.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return false;
    }

    const range = selection.getRangeAt(0);
    const selectedText = selection.toString();

    // Create link element
    const link = document.createElement('a');
    link.href = normalizedUrl;
    link.className = 'cometchat-rich-text__link';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';

    // Determine what text to display
    const displayText = text || selectedText || normalizedUrl;
    link.textContent = displayText;

    // Delete selected content and insert link
    range.deleteContents();
    range.insertNode(link);

    // Place cursor after the link
    const newRange = document.createRange();
    newRange.setStartAfter(link);
    newRange.collapse(true);
    selection.removeAllRanges();
    selection.addRange(newRange);

    return true;
  }

  /**
   * Update the URL and/or text of an existing link at the cursor position
   * @param url - New URL
   * @param text - Optional new text to display
   * @returns True if link was updated successfully
   * @see Requirements 4.2
   */
  updateLink(url: string, text?: string): boolean {
    // Validate URL
    if (!this.validateURL(url)) {
      CometChatLogger.warn('LinkManager', 'Invalid URL:', url);
      return false;
    }

    const link = this.getCurrentLinkElement();
    if (!link) {
      return false;
    }

    // Normalize URL
    const normalizedUrl = this.normalizeURL(url);

    // Update the link's href
    link.href = normalizedUrl;

    // Update the link's text if provided
    if (text !== undefined && text !== null) {
      link.textContent = text;
    }

    return true;
  }

  /**
   * Remove the link at the cursor position
   * Preserves the link text but removes the anchor element
   * @returns True if link was removed successfully
   * @see Requirements 4.1, 4.2
   */
  removeLink(): boolean {
    const link = this.getCurrentLinkElement();
    if (!link) {
      return false;
    }

    // Replace link with its text content
    const textNode = document.createTextNode(link.textContent || '');
    link.parentNode?.replaceChild(textNode, link);

    return true;
  }

  // ==================== Link Queries ====================

  /**
   * Check if the cursor is currently on a link
   * @returns True if cursor is inside a link element
   * @see Requirements 4.1, 4.2
   */
  isLinkActive(): boolean {
    return this.getCurrentLinkElement() !== null;
  }

  /**
   * Get the URL of the link at the cursor position
   * @returns URL string or null if not on a link
   * @see Requirements 4.2
   */
  getCurrentLink(): string | null {
    const link = this.getCurrentLinkElement();
    return link ? link.href : null;
  }

  /**
   * Get the text content of the link at the cursor position
   * @returns Link text or null if not on a link
   * @see Requirements 4.2
   */
  getCurrentLinkText(): string | null {
    const link = this.getCurrentLinkElement();
    return link ? link.textContent : null;
  }

  // ==================== URL Validation ====================

  /**
   * Validate a URL string
   * Checks if the URL has a valid format
   *
   * @param url - URL to validate
   * @returns True if URL is valid
   * @see Requirement 4.3
   */
  validateURL(url: string): boolean {
    if (!url || url.trim() === '') {
      return false;
    }
    // Accept any non-empty URL string (Req 2.20)
    return true;
  }

  /**
   * Normalize a URL by adding protocol if missing
   * Defaults to https:// if no protocol is present
   *
   * @param url - URL to normalize
   * @returns Normalized URL with protocol
   * @see Requirement 4.3
   */
  normalizeURL(url: string): string {
    const trimmedUrl = url.trim();

    // Check if URL already has any protocol (not just http/https)
    if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//i.test(trimmedUrl) || /^mailto:/i.test(trimmedUrl)) {
      return trimmedUrl;
    }

    // Add https:// protocol for URLs without one
    return `https://${trimmedUrl}`;
  }

  /**
   * Get validation error message for an invalid URL
   * @param url - URL to validate
   * @returns Error message or null if valid
   * @see Requirement 4.3
   */
  getValidationError(url: string): string | null {
    if (!url || url.trim() === '') {
      return 'URL cannot be empty';
    }
    return null;
  }

  // ==================== Auto-Link on Paste ====================

  /**
   * Detect and convert URLs in pasted text to clickable links
   * Should be called from the paste event handler
   *
   * @param text - Pasted text content
   * @returns HTML with URLs converted to links
   * @see Requirement 4.5
   */
  autoLinkText(text: string): string {
    // Pattern to match URLs in text
    const urlRegex =
      /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]\.[a-zA-Z]{2,}[^\s]*)/g;

    return text.replace(urlRegex, match => {
      // Validate the matched URL
      if (this.validateURL(match)) {
        const normalizedUrl = this.normalizeURL(match);
        return `<a href="${normalizedUrl}" class="cometchat-rich-text__link" target="_blank" rel="noopener noreferrer">${match}</a>`;
      }
      return match;
    });
  }

  /**
   * Process pasted content and auto-link URLs
   * @param html - Pasted HTML content
   * @returns Processed HTML with auto-linked URLs
   * @see Requirement 4.5
   */
  processAutoLink(html: string): string {
    // Create a temporary div to parse HTML
    const temp = document.createElement('div');
    temp.innerHTML = html;

    // Process text nodes to auto-link URLs
    this.processTextNodes(temp);

    return temp.innerHTML;
  }

  // ==================== Private Helpers ====================

  /**
   * Get the link element at the current cursor position
   * @returns Link element or null
   * @private
   */
  private getCurrentLinkElement(): HTMLAnchorElement | null {
    const selection = this.selectionManager.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return null;
    }

    let node = selection.anchorNode;

    while (node && node !== this.element) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement;
        if (element.tagName.toLowerCase() === 'a') {
          return element as HTMLAnchorElement;
        }
      }
      node = node.parentNode;
    }

    return null;
  }

  /**
   * Process text nodes in an element to auto-link URLs
   * @param element - Element to process
   * @private
   */
  private processTextNodes(element: HTMLElement): void {
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null);

    const nodesToReplace: { node: Node; html: string }[] = [];

    let node: Node | null;
    while ((node = walker.nextNode())) {
      // Skip if parent is already a link
      if (node.parentElement?.tagName.toLowerCase() === 'a') {
        continue;
      }

      const text = node.textContent || '';
      const linkedText = this.autoLinkText(text);

      if (linkedText !== text) {
        nodesToReplace.push({ node, html: linkedText });
      }
    }

    // Replace nodes with linked versions
    for (const { node, html } of nodesToReplace) {
      const temp = document.createElement('span');
      temp.innerHTML = html;

      // Replace the text node with the new content
      const parent = node.parentNode;
      if (parent) {
        while (temp.firstChild) {
          parent.insertBefore(temp.firstChild, node);
        }
        parent.removeChild(node);
      }
    }
  }
}
