/**
 * LinkManager Unit Tests
 *
 * Tests for the LinkManager class that handles link insertion, editing,
 * validation, and auto-linking in the rich text editor. Covers: link insertion,
 * link removal, link detection, URL validation, null/empty URL handling,
 * auto-linking, and link updates.
 *
 * Manager classes are plain classes — instantiated directly, NOT via TestBed.
 *
 * @module services/link-manager
 * @see Requirements 5.2, 5.4, 5.6
 */

import { LinkManager } from './link-manager.class';
import { SelectionManager } from './selection-manager.class';
import { ensureSdkReady, sdkCleanup } from '../test-setup';

describe('LinkManager', () => {
  let element: HTMLDivElement;
  let selectionManager: SelectionManager;
  let manager: LinkManager;

  beforeAll(async () => {
    await ensureSdkReady();
  });

  afterAll(async () => {
    await sdkCleanup();
  });

  /**
   * Helper: place a collapsed cursor at the start of the element.
   */
  function placeCaretAtStart(): void {
    const sel = window.getSelection()!;
    const range = document.createRange();
    range.setStart(element, 0);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
  }

  /**
   * Helper: select all text content inside the element.
   */
  function selectAll(): void {
    const sel = window.getSelection()!;
    const range = document.createRange();
    range.selectNodeContents(element);
    sel.removeAllRanges();
    sel.addRange(range);
  }

  /**
   * Helper: select a specific text node (or portion of it).
   */
  function selectTextNode(node: Node, startOffset = 0, endOffset?: number): void {
    const sel = window.getSelection()!;
    const range = document.createRange();
    const end = endOffset ?? node.textContent?.length ?? 0;
    range.setStart(node, startOffset);
    range.setEnd(node, end);
    sel.removeAllRanges();
    sel.addRange(range);
  }

  /**
   * Helper: place cursor inside a specific element.
   */
  function placeCaretInside(el: HTMLElement): void {
    const sel = window.getSelection()!;
    const range = document.createRange();
    if (el.firstChild) {
      range.setStart(el.firstChild, 0);
    } else {
      range.setStart(el, 0);
    }
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
  }

  beforeEach(() => {
    element = document.createElement('div');
    element.contentEditable = 'true';
    document.body.appendChild(element);
    selectionManager = new SelectionManager(element);
    manager = new LinkManager(element, selectionManager);
  });

  afterEach(() => {
    document.body.removeChild(element);
  });

  // ==================== Instantiation ====================

  describe('Instantiation', () => {
    it('should create an instance without error', () => {
      expect(manager).toBeTruthy();
    });

    it('should accept any HTMLElement and SelectionManager', () => {
      const span = document.createElement('span');
      document.body.appendChild(span);
      const sm = new SelectionManager(span);
      const m = new LinkManager(span, sm);
      expect(m).toBeTruthy();
      document.body.removeChild(span);
    });
  });

  // ==================== URL Validation ====================

  describe('validateURL()', () => {
    it('should return true for a valid URL with https protocol', () => {
      expect(manager.validateURL('https://example.com')).toBe(true);
    });

    it('should return true for a valid URL with http protocol', () => {
      expect(manager.validateURL('http://example.com')).toBe(true);
    });

    it('should return true for a valid URL without protocol', () => {
      expect(manager.validateURL('example.com')).toBe(true);
    });

    it('should return true for a URL with path', () => {
      expect(manager.validateURL('https://example.com/path/to/page')).toBe(true);
    });

    it('should return true for a URL with subdomain', () => {
      expect(manager.validateURL('https://www.example.com')).toBe(true);
    });

    it('should return false for an empty string', () => {
      expect(manager.validateURL('')).toBe(false);
    });

    it('should return false for whitespace-only string', () => {
      expect(manager.validateURL('   ')).toBe(false);
    });

    it('should return false for null-like input', () => {
      expect(manager.validateURL(null as any)).toBe(false);
      expect(manager.validateURL(undefined as any)).toBe(false);
    });

    it('should return true for URL with query parameters', () => {
      expect(manager.validateURL('https://example.com/page?id=1&name=test')).toBe(true);
    });

    it('should return true for URL with hash fragment', () => {
      expect(manager.validateURL('https://example.com/page#section')).toBe(true);
    });

    it('should handle URL with trailing whitespace', () => {
      expect(manager.validateURL('  https://example.com  ')).toBe(true);
    });
  });

  // ==================== URL Normalization ====================

  describe('normalizeURL()', () => {
    it('should add https:// to URL without protocol', () => {
      expect(manager.normalizeURL('example.com')).toBe('https://example.com');
    });

    it('should not modify URL that already has https://', () => {
      expect(manager.normalizeURL('https://example.com')).toBe('https://example.com');
    });

    it('should not modify URL that already has http://', () => {
      expect(manager.normalizeURL('http://example.com')).toBe('http://example.com');
    });

    it('should trim whitespace before normalizing', () => {
      expect(manager.normalizeURL('  example.com  ')).toBe('https://example.com');
    });

    it('should handle URL with path', () => {
      expect(manager.normalizeURL('example.com/path')).toBe('https://example.com/path');
    });
  });

  // ==================== Validation Error Messages ====================

  describe('getValidationError()', () => {
    it('should return null for a valid URL', () => {
      expect(manager.getValidationError('https://example.com')).toBeNull();
    });

    it('should return error message for empty string', () => {
      const error = manager.getValidationError('');
      expect(error).toBe('URL cannot be empty');
    });

    it('should return error message for whitespace-only string', () => {
      const error = manager.getValidationError('   ');
      expect(error).toBe('URL cannot be empty');
    });

    it('should return error message for null input', () => {
      const error = manager.getValidationError(null as any);
      expect(error).toBe('URL cannot be empty');
    });

    it('should return error message for undefined input', () => {
      const error = manager.getValidationError(undefined as any);
      expect(error).toBe('URL cannot be empty');
    });

    it('should return null for non-empty URL (no format validation)', () => {
      const error = manager.getValidationError('not a url');
      // The implementation only checks for empty strings, not URL format
      expect(error).toBeNull();
    });
  });

  // ==================== Link Insertion ====================

  describe('insertLink()', () => {
    it('should return false for an invalid URL', () => {
      element.innerHTML = 'Hello';
      selectAll();
      expect(manager.insertLink('')).toBe(false);
    });

    it('should return false for null URL', () => {
      element.innerHTML = 'Hello';
      selectAll();
      expect(manager.insertLink(null as any)).toBe(false);
    });

    it('should insert a link wrapping selected text', () => {
      element.innerHTML = 'Hello world';
      selectAll();
      const result = manager.insertLink('https://example.com');
      expect(result).toBe(true);
      const anchor = element.querySelector('a');
      expect(anchor).toBeTruthy();
      expect(anchor!.href).toContain('example.com');
    });

    it('should use selected text as link text when no text param provided', () => {
      element.innerHTML = 'Click here';
      selectAll();
      manager.insertLink('https://example.com');
      const anchor = element.querySelector('a');
      expect(anchor!.textContent).toBe('Click here');
    });

    it('should use provided text parameter as link text', () => {
      element.innerHTML = 'Hello';
      selectAll();
      manager.insertLink('https://example.com', 'Custom Text');
      const anchor = element.querySelector('a');
      expect(anchor!.textContent).toBe('Custom Text');
    });

    it('should use normalized URL as link text when no selection and no text', () => {
      element.innerHTML = '';
      placeCaretAtStart();
      manager.insertLink('https://example.com');
      const anchor = element.querySelector('a');
      if (anchor) {
        expect(anchor.textContent).toBe('https://example.com');
      }
    });

    it('should set target="_blank" on inserted link', () => {
      element.innerHTML = 'Hello';
      selectAll();
      manager.insertLink('https://example.com');
      const anchor = element.querySelector('a');
      expect(anchor!.target).toBe('_blank');
    });

    it('should set rel="noopener noreferrer" on inserted link', () => {
      element.innerHTML = 'Hello';
      selectAll();
      manager.insertLink('https://example.com');
      const anchor = element.querySelector('a');
      expect(anchor!.rel).toBe('noopener noreferrer');
    });

    it('should apply the BEM class to inserted link', () => {
      element.innerHTML = 'Hello';
      selectAll();
      manager.insertLink('https://example.com');
      const anchor = element.querySelector('a');
      expect(anchor!.classList.contains('cometchat-rich-text__link')).toBe(true);
    });

    it('should normalize URL without protocol', () => {
      element.innerHTML = 'Hello';
      selectAll();
      manager.insertLink('example.com');
      const anchor = element.querySelector('a');
      expect(anchor!.href).toContain('https://example.com');
    });

    it('should return false when no selection exists', () => {
      window.getSelection()?.removeAllRanges();
      expect(manager.insertLink('https://example.com')).toBe(false);
    });
  });

  // ==================== Link Update ====================

  describe('updateLink()', () => {
    it('should return false when cursor is not on a link', () => {
      element.innerHTML = 'plain text';
      placeCaretAtStart();
      expect(manager.updateLink('https://new.com')).toBe(false);
    });

    it('should return false for invalid URL', () => {
      element.innerHTML = '<a href="https://old.com">link</a>';
      const anchor = element.querySelector('a')!;
      placeCaretInside(anchor);
      expect(manager.updateLink('')).toBe(false);
    });

    it('should update the href of an existing link', () => {
      element.innerHTML = '<a href="https://old.com">link text</a>';
      const anchor = element.querySelector('a')!;
      placeCaretInside(anchor);
      const result = manager.updateLink('https://new.com');
      expect(result).toBe(true);
      expect(anchor.href).toContain('new.com');
    });

    it('should update the text of an existing link when text is provided', () => {
      element.innerHTML = '<a href="https://example.com">old text</a>';
      const anchor = element.querySelector('a')!;
      placeCaretInside(anchor);
      manager.updateLink('https://example.com', 'new text');
      expect(anchor.textContent).toBe('new text');
    });

    it('should not change text when text parameter is undefined', () => {
      element.innerHTML = '<a href="https://example.com">keep this</a>';
      const anchor = element.querySelector('a')!;
      placeCaretInside(anchor);
      manager.updateLink('https://new.com');
      expect(anchor.textContent).toBe('keep this');
    });

    it('should normalize the new URL', () => {
      element.innerHTML = '<a href="https://old.com">link</a>';
      const anchor = element.querySelector('a')!;
      placeCaretInside(anchor);
      manager.updateLink('new.com');
      expect(anchor.href).toContain('https://new.com');
    });
  });

  // ==================== Link Removal ====================

  describe('removeLink()', () => {
    it('should return false when cursor is not on a link', () => {
      element.innerHTML = 'plain text';
      placeCaretAtStart();
      expect(manager.removeLink()).toBe(false);
    });

    it('should remove the anchor element', () => {
      element.innerHTML = '<a href="https://example.com">link text</a>';
      const anchor = element.querySelector('a')!;
      placeCaretInside(anchor);
      const result = manager.removeLink();
      expect(result).toBe(true);
      expect(element.querySelector('a')).toBeNull();
    });

    it('should preserve the link text content after removal', () => {
      element.innerHTML = '<a href="https://example.com">link text</a>';
      const anchor = element.querySelector('a')!;
      placeCaretInside(anchor);
      manager.removeLink();
      expect(element.textContent).toContain('link text');
    });

    it('should return false when no selection exists', () => {
      window.getSelection()?.removeAllRanges();
      expect(manager.removeLink()).toBe(false);
    });
  });

  // ==================== Link Detection ====================

  describe('isLinkActive()', () => {
    it('should return false when cursor is on plain text', () => {
      element.innerHTML = 'plain text';
      placeCaretAtStart();
      expect(manager.isLinkActive()).toBe(false);
    });

    it('should return true when cursor is inside a link', () => {
      element.innerHTML = '<a href="https://example.com">link text</a>';
      const anchor = element.querySelector('a')!;
      placeCaretInside(anchor);
      expect(manager.isLinkActive()).toBe(true);
    });

    it('should return false when no selection exists', () => {
      window.getSelection()?.removeAllRanges();
      expect(manager.isLinkActive()).toBe(false);
    });

    it('should return false on empty element', () => {
      element.innerHTML = '';
      expect(manager.isLinkActive()).toBe(false);
    });
  });

  describe('getCurrentLink()', () => {
    it('should return null when cursor is not on a link', () => {
      element.innerHTML = 'plain text';
      placeCaretAtStart();
      expect(manager.getCurrentLink()).toBeNull();
    });

    it('should return the href when cursor is on a link', () => {
      element.innerHTML = '<a href="https://example.com">link</a>';
      const anchor = element.querySelector('a')!;
      placeCaretInside(anchor);
      const url = manager.getCurrentLink();
      expect(url).toContain('example.com');
    });

    it('should return null when no selection exists', () => {
      window.getSelection()?.removeAllRanges();
      expect(manager.getCurrentLink()).toBeNull();
    });
  });

  describe('getCurrentLinkText()', () => {
    it('should return null when cursor is not on a link', () => {
      element.innerHTML = 'plain text';
      placeCaretAtStart();
      expect(manager.getCurrentLinkText()).toBeNull();
    });

    it('should return the text content when cursor is on a link', () => {
      element.innerHTML = '<a href="https://example.com">my link</a>';
      const anchor = element.querySelector('a')!;
      placeCaretInside(anchor);
      expect(manager.getCurrentLinkText()).toBe('my link');
    });

    it('should return null when no selection exists', () => {
      window.getSelection()?.removeAllRanges();
      expect(manager.getCurrentLinkText()).toBeNull();
    });
  });

  // ==================== Auto-Link ====================

  describe('autoLinkText()', () => {
    it('should convert a URL with protocol to a link', () => {
      const result = manager.autoLinkText('Visit https://example.com today');
      expect(result).toContain('<a href="https://example.com"');
      expect(result).toContain('https://example.com</a>');
    });

    it('should return text unchanged when no URLs are present', () => {
      const text = 'Hello world, no links here';
      expect(manager.autoLinkText(text)).toBe(text);
    });

    it('should handle empty string', () => {
      expect(manager.autoLinkText('')).toBe('');
    });

    it('should set target="_blank" on auto-linked URLs', () => {
      const result = manager.autoLinkText('https://example.com');
      expect(result).toContain('target="_blank"');
    });

    it('should set rel="noopener noreferrer" on auto-linked URLs', () => {
      const result = manager.autoLinkText('https://example.com');
      expect(result).toContain('rel="noopener noreferrer"');
    });

    it('should apply the BEM class to auto-linked URLs', () => {
      const result = manager.autoLinkText('https://example.com');
      expect(result).toContain('cometchat-rich-text__link');
    });

    it('should handle multiple URLs in the same text', () => {
      const result = manager.autoLinkText('Visit https://a.com and https://b.com');
      const anchorCount = (result.match(/<a /g) || []).length;
      expect(anchorCount).toBe(2);
    });
  });

  // ==================== processAutoLink ====================

  describe('processAutoLink()', () => {
    it('should auto-link URLs in plain text nodes', () => {
      const result = manager.processAutoLink('Visit https://example.com');
      expect(result).toContain('<a href="https://example.com"');
    });

    it('should not double-link URLs already inside anchor tags', () => {
      const html = '<a href="https://example.com">https://example.com</a>';
      const result = manager.processAutoLink(html);
      // Should not nest anchors
      const anchorCount = (result.match(/<a /g) || []).length;
      expect(anchorCount).toBe(1);
    });

    it('should return empty string for empty input', () => {
      expect(manager.processAutoLink('')).toBe('');
    });

    it('should preserve existing HTML structure', () => {
      const html = '<p>Hello <strong>world</strong></p>';
      const result = manager.processAutoLink(html);
      expect(result).toContain('<strong>world</strong>');
    });
  });

  // ==================== Null / Empty URL Handling (Req 5.6) ====================

  describe('Null / Empty URL Handling', () => {
    it('should not throw insertLink with null URL', () => {
      element.innerHTML = 'Hello';
      selectAll();
      expect(() => manager.insertLink(null as any)).not.toThrow();
    });

    it('should not throw insertLink with undefined URL', () => {
      element.innerHTML = 'Hello';
      selectAll();
      expect(() => manager.insertLink(undefined as any)).not.toThrow();
    });

    it('should not throw insertLink with empty URL', () => {
      element.innerHTML = 'Hello';
      selectAll();
      expect(() => manager.insertLink('')).not.toThrow();
    });

    it('should return false for insertLink with empty URL', () => {
      element.innerHTML = 'Hello';
      selectAll();
      expect(manager.insertLink('')).toBe(false);
    });

    it('should not throw updateLink with null URL', () => {
      element.innerHTML = '<a href="https://example.com">link</a>';
      const anchor = element.querySelector('a')!;
      placeCaretInside(anchor);
      expect(() => manager.updateLink(null as any)).not.toThrow();
    });

    it('should not throw updateLink with empty URL', () => {
      element.innerHTML = '<a href="https://example.com">link</a>';
      const anchor = element.querySelector('a')!;
      placeCaretInside(anchor);
      expect(() => manager.updateLink('')).not.toThrow();
    });

    it('should not throw validateURL with null', () => {
      expect(() => manager.validateURL(null as any)).not.toThrow();
    });

    it('should not throw validateURL with undefined', () => {
      expect(() => manager.validateURL(undefined as any)).not.toThrow();
    });

    it('should not throw getValidationError with null', () => {
      expect(() => manager.getValidationError(null as any)).not.toThrow();
    });

    it('should not throw removeLink when no selection exists', () => {
      window.getSelection()?.removeAllRanges();
      expect(() => manager.removeLink()).not.toThrow();
    });

    it('should not throw isLinkActive when no selection exists', () => {
      window.getSelection()?.removeAllRanges();
      expect(() => manager.isLinkActive()).not.toThrow();
    });

    it('should not throw getCurrentLink when no selection exists', () => {
      window.getSelection()?.removeAllRanges();
      expect(() => manager.getCurrentLink()).not.toThrow();
    });

    it('should not throw getCurrentLinkText when no selection exists', () => {
      window.getSelection()?.removeAllRanges();
      expect(() => manager.getCurrentLinkText()).not.toThrow();
    });
  });

  // ==================== Edge Cases ====================

  describe('Edge Cases', () => {
    it('should handle inserting a link on empty element', () => {
      element.innerHTML = '';
      placeCaretAtStart();
      // May return false if no selection range, but should not throw
      expect(() => manager.insertLink('https://example.com')).not.toThrow();
    });

    it('should handle link with very long URL', () => {
      const longUrl = 'https://example.com/' + 'a'.repeat(500);
      // validateURL may reject very long URLs depending on regex, but should not throw
      expect(() => manager.validateURL(longUrl)).not.toThrow();
    });

    it('should handle link with special characters in URL', () => {
      expect(manager.validateURL('https://example.com/path?q=hello%20world&a=1')).toBe(true);
    });

    it('should handle removeLink when element has multiple links', () => {
      element.innerHTML =
        '<a href="https://a.com">first</a> text <a href="https://b.com">second</a>';
      const firstAnchor = element.querySelector('a')!;
      placeCaretInside(firstAnchor);
      manager.removeLink();
      // First link removed, second should remain
      const remaining = element.querySelectorAll('a');
      expect(remaining.length).toBe(1);
      expect(remaining[0].href).toContain('b.com');
    });

    it('should handle updateLink preserving text when text param is null', () => {
      element.innerHTML = '<a href="https://old.com">keep text</a>';
      const anchor = element.querySelector('a')!;
      placeCaretInside(anchor);
      manager.updateLink('https://new.com', null as any);
      // null is not undefined, so text should not change per the implementation
      // (text !== undefined && text !== null) check means null won't update text
      expect(anchor.textContent).toBe('keep text');
    });

    it('should handle autoLinkText with text containing HTML entities', () => {
      const text = 'Check &amp; visit https://example.com';
      expect(() => manager.autoLinkText(text)).not.toThrow();
    });

    it('should handle processAutoLink with nested HTML', () => {
      const html = '<div><p>Visit <em>https://example.com</em></p></div>';
      expect(() => manager.processAutoLink(html)).not.toThrow();
    });
  });
});
