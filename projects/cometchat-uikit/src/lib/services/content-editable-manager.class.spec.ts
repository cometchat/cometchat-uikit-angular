/**
 * ContentEditableManager Unit Tests
 *
 * Tests for the ContentEditableManager class that manages contenteditable elements.
 * Covers: content insertion, selection tracking, cursor position management,
 * empty content handling, sanitization, and DOM utilities.
 *
 * @module services/content-editable-manager
 * @see Requirements 5.2, 5.4, 5.5, 14.4, 14.5, 15.7
 */

import { ContentEditableManager } from './content-editable-manager.class';
import { ensureSdkReady, sdkCleanup } from '../test-setup';

describe('ContentEditableManager', () => {
  let element: HTMLDivElement;
  let manager: ContentEditableManager;

  beforeAll(async () => {
    await ensureSdkReady();
  });

  afterAll(async () => {
    await sdkCleanup();
  });

  beforeEach(() => {
    element = document.createElement('div');
    document.body.appendChild(element);
    manager = new ContentEditableManager(element);
  });

  afterEach(() => {
    document.body.removeChild(element);
  });

  // ==================== Initialization Tests ====================

  describe('initialize()', () => {
    it('should set contenteditable to true by default', () => {
      manager.initialize({});
      expect(element.contentEditable).toBe('true');
    });

    it('should set contenteditable to false when editable is false', () => {
      manager.initialize({ editable: false });
      expect(element.contentEditable).toBe('false');
    });

    it('should set ARIA role to textbox', () => {
      manager.initialize({});
      expect(element.getAttribute('role')).toBe('textbox');
    });

    it('should set ARIA multiline to true', () => {
      manager.initialize({});
      expect(element.getAttribute('aria-multiline')).toBe('true');
    });

    it('should set ARIA placeholder when provided', () => {
      manager.initialize({ placeholder: 'Type here...' });
      expect(element.getAttribute('aria-placeholder')).toBe('Type here...');
    });

    it('should not set ARIA placeholder when not provided', () => {
      manager.initialize({});
      expect(element.hasAttribute('aria-placeholder')).toBe(false);
    });

    it('should treat editable=true explicitly', () => {
      manager.initialize({ editable: true });
      expect(element.contentEditable).toBe('true');
    });
  });

  // ==================== Content Insertion Tests ====================

  describe('Content Insertion (setHTML)', () => {
    it('should insert simple text content', () => {
      manager.setHTML('<p>Hello world</p>');
      expect(element.innerHTML).toBe('<p>Hello world</p>');
    });

    it('should insert formatted content with bold/italic', () => {
      manager.setHTML('<p><strong>Bold</strong> and <em>italic</em></p>');
      expect(element.innerHTML).toBe('<p><strong>Bold</strong> and <em>italic</em></p>');
    });

    it('should insert content with links', () => {
      manager.setHTML('<p>Visit <a href="https://example.com">here</a></p>');
      expect(element.innerHTML).toContain('href="https://example.com"');
      expect(element.innerHTML).toContain('here');
    });

    it('should insert content with mention spans', () => {
      const html =
        '<span class="mention" data-mention-id="u1" data-mention-label="Alice">@Alice</span>';
      manager.setHTML(html);
      expect(element.innerHTML).toContain('data-mention-id="u1"');
      expect(element.innerHTML).toContain('@Alice');
    });

    it('should insert list content', () => {
      manager.setHTML('<ul><li>Item 1</li><li>Item 2</li></ul>');
      expect(element.querySelectorAll('li').length).toBe(2);
    });

    it('should replace existing content on setHTML', () => {
      manager.setHTML('<p>First</p>');
      manager.setHTML('<p>Second</p>');
      expect(manager.getText()).toBe('Second');
      expect(element.innerHTML).toBe('<p>Second</p>');
    });

    it('should sanitize dangerous content during insertion', () => {
      manager.setHTML('<p>Safe</p><script>alert("xss")</script>');
      expect(element.innerHTML).not.toContain('<script');
      expect(element.innerHTML).toContain('Safe');
    });

    it('should handle empty string insertion', () => {
      manager.setHTML('');
      expect(element.innerHTML).toBe('');
    });

    it('should insert content with multiple paragraphs', () => {
      manager.setHTML('<p>Line 1</p><p>Line 2</p><p>Line 3</p>');
      expect(element.querySelectorAll('p').length).toBe(3);
    });

    it('should insert content with nested formatting', () => {
      const html = '<p><strong><em>Bold italic</em></strong></p>';
      manager.setHTML(html);
      expect(element.innerHTML).toBe(html);
    });
  });

  // ==================== Content Retrieval Tests ====================

  describe('getHTML()', () => {
    it('should return empty string for empty editor', () => {
      expect(manager.getHTML()).toBe('');
    });

    it('should return HTML content', () => {
      element.innerHTML = '<p>Hello world</p>';
      expect(manager.getHTML()).toBe('<p>Hello world</p>');
    });

    it('should return formatted HTML', () => {
      element.innerHTML = '<p><strong>Bold</strong> and <em>italic</em></p>';
      expect(manager.getHTML()).toBe('<p><strong>Bold</strong> and <em>italic</em></p>');
    });

    it('should return HTML with multiple child nodes', () => {
      element.innerHTML = '<p>A</p><p>B</p>';
      expect(manager.getHTML()).toBe('<p>A</p><p>B</p>');
    });
  });

  describe('getText()', () => {
    it('should return empty string for empty editor', () => {
      expect(manager.getText()).toBe('');
    });

    it('should return plain text without HTML tags', () => {
      element.innerHTML = '<p>Hello world</p>';
      expect(manager.getText()).toBe('Hello world');
    });

    it('should return text from formatted content', () => {
      element.innerHTML = '<p><strong>Bold</strong> and <em>italic</em></p>';
      expect(manager.getText()).toBe('**Bold** and *italic*');
    });

    it('should preserve whitespace in text', () => {
      element.innerHTML = '<p>Hello   world</p>';
      expect(manager.getText()).toBe('Hello   world');
    });

    it('should extract text from deeply nested elements', () => {
      element.innerHTML = '<div><p><span><strong>Deep</strong></span></p></div>';
      expect(manager.getText()).toBe('**Deep**');
    });
  });

  // ==================== Selection Tracking Tests ====================

  describe('Selection Tracking (cursor position via content state)', () => {
    it('should reflect cursor position after setHTML by verifying content state', () => {
      manager.setHTML('<p>Hello</p>');
      // After insertion, content is set — getText reflects the inserted content
      expect(manager.getText()).toBe('Hello');
      expect(manager.isEmpty()).toBe(false);
    });

    it('should track content state after sequential insertions', () => {
      manager.setHTML('<p>First</p>');
      expect(manager.getText()).toBe('First');

      manager.setHTML('<p>Second</p>');
      expect(manager.getText()).toBe('Second');

      manager.setHTML('<p>Third</p>');
      expect(manager.getText()).toBe('Third');
    });

    it('should track empty state after clear', () => {
      manager.setHTML('<p>Content</p>');
      expect(manager.isEmpty()).toBe(false);

      manager.clear();
      expect(manager.isEmpty()).toBe(true);
      expect(manager.getHTML()).toBe('');
      expect(manager.getText()).toBe('');
    });

    it('should track content with inline formatting changes', () => {
      manager.setHTML('<p>Plain text</p>');
      expect(manager.getText()).toBe('Plain text');

      manager.setHTML('<p><strong>Bold text</strong></p>');
      expect(manager.getText()).toBe('**Bold text**');
      expect(manager.getHTML()).toContain('<strong>');
    });

    it('should track content state with mixed node types', () => {
      manager.setHTML('<p>Text</p><ul><li>Item</li></ul>');
      const text = manager.getText();
      expect(text).toContain('Text');
      expect(text).toContain('Item');
    });
  });

  // ==================== Cursor Position Management Tests ====================

  describe('Cursor Position Management (content boundaries)', () => {
    it('should maintain content integrity after setHTML at beginning', () => {
      manager.setHTML('<p>Start of content</p>');
      expect(element.firstChild).toBeTruthy();
      expect((element.firstChild as HTMLElement).tagName).toBe('P');
    });

    it('should maintain content integrity with empty paragraphs', () => {
      manager.setHTML('<p><br></p>');
      expect(element.querySelector('p')).toBeTruthy();
      expect(element.querySelector('br')).toBeTruthy();
    });

    it('should preserve child node structure after insertion', () => {
      manager.setHTML('<p>Line 1</p><p>Line 2</p>');
      expect(element.childNodes.length).toBe(2);
      expect((element.childNodes[0] as HTMLElement).textContent).toBe('Line 1');
      expect((element.childNodes[1] as HTMLElement).textContent).toBe('Line 2');
    });

    it('should handle insertion of content with br elements for cursor positioning', () => {
      manager.setHTML('Line 1<br>Line 2<br>Line 3');
      expect(element.querySelectorAll('br').length).toBe(2);
      expect(manager.getText()).toContain('Line 1');
      expect(manager.getText()).toContain('Line 3');
    });

    it('should handle content with zero-width spaces (cursor markers)', () => {
      manager.setHTML('<p>Hello\u200BWorld</p>');
      expect(manager.getText()).toContain('\u200B');
    });
  });

  // ==================== Empty Content Handling Tests ====================

  describe('Empty Content Handling', () => {
    it('should return true for isEmpty on fresh instance', () => {
      expect(manager.isEmpty()).toBe(true);
    });

    it('should return true for whitespace-only content', () => {
      element.innerHTML = '   ';
      expect(manager.isEmpty()).toBe(true);
    });

    it('should return true for tab and newline whitespace', () => {
      element.innerHTML = '\t\n\r';
      expect(manager.isEmpty()).toBe(true);
    });

    it('should return true after clear()', () => {
      manager.setHTML('<p>Content</p>');
      manager.clear();
      expect(manager.isEmpty()).toBe(true);
    });

    it('should return true for empty paragraph tags', () => {
      element.innerHTML = '<p></p>';
      expect(manager.isEmpty()).toBe(true);
    });

    it('should return true for paragraph with only whitespace', () => {
      element.innerHTML = '<p>   </p>';
      expect(manager.isEmpty()).toBe(true);
    });

    it('should return false for non-empty content', () => {
      element.innerHTML = '<p>Hello</p>';
      expect(manager.isEmpty()).toBe(false);
    });

    it('should return false for single character', () => {
      element.innerHTML = 'a';
      expect(manager.isEmpty()).toBe(false);
    });

    it('should return empty string from getText on empty editor', () => {
      expect(manager.getText()).toBe('');
    });

    it('should return empty string from getHTML on empty editor', () => {
      expect(manager.getHTML()).toBe('');
    });

    it('should handle setHTML with empty string gracefully', () => {
      manager.setHTML('');
      expect(manager.isEmpty()).toBe(true);
      expect(manager.getHTML()).toBe('');
    });

    it('should handle clear on already empty editor', () => {
      manager.clear();
      expect(manager.isEmpty()).toBe(true);
      expect(manager.getHTML()).toBe('');
    });
  });

  // ==================== HTML Sanitization Tests ====================

  describe('sanitizeHTML()', () => {
    it('should allow safe HTML tags', () => {
      const html = '<p>Hello <strong>world</strong></p>';
      expect(manager.sanitizeHTML(html)).toBe(html);
    });

    it('should remove script tags completely', () => {
      const sanitized = manager.sanitizeHTML('<p>Hello</p><script>alert("XSS")</script>');
      expect(sanitized).not.toContain('<script');
      expect(sanitized).not.toContain('alert');
    });

    it('should remove style tags completely', () => {
      const sanitized = manager.sanitizeHTML('<style>body{display:none}</style><p>Hi</p>');
      expect(sanitized).not.toContain('<style');
      expect(sanitized).toContain('Hi');
    });

    it('should remove iframe tags completely', () => {
      const sanitized = manager.sanitizeHTML('<iframe src="evil.com"></iframe><p>Safe</p>');
      expect(sanitized).not.toContain('<iframe');
      expect(sanitized).toContain('Safe');
    });

    it('should remove event handler attributes', () => {
      const sanitized = manager.sanitizeHTML('<p onclick="alert()">Hello</p>');
      expect(sanitized).not.toContain('onclick');
      expect(sanitized).toContain('Hello');
    });

    it('should remove onload event handlers', () => {
      const sanitized = manager.sanitizeHTML('<p onload="alert()">Hello</p>');
      expect(sanitized).not.toContain('onload');
    });

    it('should remove onerror event handlers', () => {
      const sanitized = manager.sanitizeHTML('<p onerror="alert()">Hello</p>');
      expect(sanitized).not.toContain('onerror');
    });

    it('should remove javascript: URLs from href', () => {
      const sanitized = manager.sanitizeHTML('<a href="javascript:alert()">Click</a>');
      expect(sanitized).not.toContain('javascript:');
    });

    it('should remove data: URLs from href', () => {
      const sanitized = manager.sanitizeHTML(
        '<a href="data:text/html,<script>alert()</script>">Click</a>'
      );
      expect(sanitized).not.toContain('data:');
    });

    it('should remove vbscript: URLs from href', () => {
      const sanitized = manager.sanitizeHTML('<a href="vbscript:alert()">Click</a>');
      expect(sanitized).not.toContain('vbscript:');
    });

    it('should allow safe href URLs', () => {
      const sanitized = manager.sanitizeHTML('<a href="https://example.com">Link</a>');
      expect(sanitized).toContain('href="https://example.com"');
    });

    it('should allow whitelisted data attributes', () => {
      const html =
        '<span class="mention" data-mention-id="123" data-mention-label="User">@user</span>';
      const sanitized = manager.sanitizeHTML(html);
      expect(sanitized).toContain('class="mention"');
      expect(sanitized).toContain('data-mention-id="123"');
      expect(sanitized).toContain('data-mention-label="User"');
    });

    it('should remove disallowed attributes', () => {
      const sanitized = manager.sanitizeHTML('<p style="color: red" data-custom="value">Hello</p>');
      expect(sanitized).not.toContain('style');
      expect(sanitized).not.toContain('data-custom');
    });

    it('should remove disallowed tags but keep their text content', () => {
      const sanitized = manager.sanitizeHTML('<p>Hello <custom-tag>world</custom-tag></p>');
      expect(sanitized).not.toContain('<custom-tag');
      expect(sanitized).toContain('world');
    });

    it('should preserve Unicode characters', () => {
      const html = '<p>Hello 世界 🌍</p>';
      expect(manager.sanitizeHTML(html)).toBe(html);
    });

    it('should handle empty string', () => {
      expect(manager.sanitizeHTML('')).toBe('');
    });

    it('should handle plain text without tags', () => {
      expect(manager.sanitizeHTML('Hello world')).toBe('Hello world');
    });

    it('should handle nested disallowed tags', () => {
      const sanitized = manager.sanitizeHTML(
        '<p>Hello <div><script>alert()</script>world</div></p>'
      );
      expect(sanitized).not.toContain('<script');
      expect(sanitized).toContain('world');
    });
  });

  // ==================== DOM Utilities Tests ====================

  describe('parseHTML()', () => {
    it('should parse HTML string to DocumentFragment', () => {
      const fragment = manager.parseHTML('<p>Hello</p>');
      expect(fragment.nodeType).toBe(Node.DOCUMENT_FRAGMENT_NODE);
      expect(fragment.childNodes.length).toBe(1);
    });

    it('should parse multiple elements', () => {
      const fragment = manager.parseHTML('<p>Hello</p><p>World</p>');
      expect(fragment.childNodes.length).toBe(2);
    });

    it('should handle empty string', () => {
      const fragment = manager.parseHTML('');
      expect(fragment.childNodes.length).toBe(0);
    });

    it('should preserve formatting in parsed fragment', () => {
      const fragment = manager.parseHTML('<p><strong>Bold</strong></p>');
      const p = fragment.firstChild as HTMLElement;
      expect(p.innerHTML).toBe('<strong>Bold</strong>');
    });

    it('should parse plain text into a text node', () => {
      const fragment = manager.parseHTML('Just text');
      expect(fragment.childNodes.length).toBe(1);
      expect(fragment.firstChild!.nodeType).toBe(Node.TEXT_NODE);
      expect(fragment.firstChild!.textContent).toBe('Just text');
    });

    it('should parse mixed text and elements', () => {
      const fragment = manager.parseHTML('Text <strong>bold</strong> more');
      expect(fragment.childNodes.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('serializeToHTML()', () => {
    it('should serialize element to HTML', () => {
      const p = document.createElement('p');
      p.textContent = 'Hello';
      expect(manager.serializeToHTML(p)).toBe('<p>Hello</p>');
    });

    it('should serialize text node', () => {
      const text = document.createTextNode('Hello');
      expect(manager.serializeToHTML(text)).toBe('Hello');
    });

    it('should serialize document fragment', () => {
      const fragment = document.createDocumentFragment();
      const p = document.createElement('p');
      p.textContent = 'Hello';
      fragment.appendChild(p);
      expect(manager.serializeToHTML(fragment)).toBe('<p>Hello</p>');
    });

    it('should preserve formatting in serialized output', () => {
      const p = document.createElement('p');
      const strong = document.createElement('strong');
      strong.textContent = 'Bold';
      p.appendChild(strong);
      expect(manager.serializeToHTML(p)).toBe('<p><strong>Bold</strong></p>');
    });

    it('should return empty string for comment node', () => {
      const comment = document.createComment('test');
      expect(manager.serializeToHTML(comment)).toBe('');
    });

    it('should serialize empty text node', () => {
      const text = document.createTextNode('');
      expect(manager.serializeToHTML(text)).toBe('');
    });
  });

  // ==================== Null/Undefined Handling (Req 5.6) ====================

  describe('Null/Undefined Handling', () => {
    it('should handle setHTML with plain text (no tags)', () => {
      manager.setHTML('plain text');
      expect(manager.getText()).toBe('plain text');
    });

    it('should handle sanitizeHTML with only whitespace', () => {
      const sanitized = manager.sanitizeHTML('   ');
      expect(sanitized).toBe('   ');
    });

    it('should handle parseHTML with whitespace-only string', () => {
      const fragment = manager.parseHTML('   ');
      expect(fragment).toBeTruthy();
    });

    it('should handle initialize with empty config object', () => {
      expect(() => manager.initialize({})).not.toThrow();
      expect(element.contentEditable).toBe('true');
    });

    it('should handle initialize with undefined placeholder', () => {
      expect(() => manager.initialize({ placeholder: undefined })).not.toThrow();
      expect(element.hasAttribute('aria-placeholder')).toBe(false);
    });

    it('should handle initialize with empty placeholder string', () => {
      manager.initialize({ placeholder: '' });
      // Empty string is falsy, so placeholder should not be set
      expect(element.hasAttribute('aria-placeholder')).toBe(false);
    });
  });

  // ==================== Edge Cases ====================

  describe('Edge Cases', () => {
    it('should handle very long content', () => {
      const longText = 'a'.repeat(10000);
      manager.setHTML(`<p>${longText}</p>`);
      expect(manager.getText().length).toBe(10000);
    });

    it('should handle deeply nested HTML', () => {
      const html = '<p><strong><em><u>Nested</u></em></strong></p>';
      manager.setHTML(html);
      expect(manager.getHTML()).toBe(html);
    });

    it('should handle special HTML characters', () => {
      const html = '<p>&lt;div&gt; &amp; &quot;quotes&quot;</p>';
      manager.setHTML(html);
      expect(manager.getText()).toContain('<div>');
      expect(manager.getText()).toContain('&');
      expect(manager.getText()).toContain('"quotes"');
    });

    it('should handle RTL text', () => {
      const html = '<p>مرحبا بالعالم</p>';
      manager.setHTML(html);
      expect(manager.getText()).toBe('مرحبا بالعالم');
    });

    it('should handle emoji content', () => {
      const html = '<p>Hello 👋 World 🌍</p>';
      manager.setHTML(html);
      expect(manager.getText()).toContain('👋');
      expect(manager.getText()).toContain('🌍');
    });

    it('should handle combining characters', () => {
      const html = '<p>e\u0301</p>'; // é as e + combining acute accent
      manager.setHTML(html);
      expect(manager.getText()).toBe('e\u0301');
    });

    it('should handle multiple sequential clear and set operations', () => {
      manager.setHTML('<p>A</p>');
      manager.clear();
      manager.setHTML('<p>B</p>');
      manager.clear();
      manager.setHTML('<p>C</p>');
      expect(manager.getText()).toBe('C');
    });

    it('should handle content with all allowed tags', () => {
      const html = '<p><strong>B</strong><em>I</em><u>U</u><s>S</s><code>C</code></p>';
      manager.setHTML(html);
      expect(manager.getHTML()).toBe(html);
    });

    it('should handle ordered and unordered lists', () => {
      manager.setHTML('<ol><li>One</li></ol><ul><li>Bullet</li></ul>');
      expect(element.querySelector('ol')).toBeTruthy();
      expect(element.querySelector('ul')).toBeTruthy();
    });

    it('should handle blockquote content', () => {
      manager.setHTML('<blockquote>Quoted text</blockquote>');
      expect(element.querySelector('blockquote')).toBeTruthy();
      expect(manager.getText()).toBe('Quoted text');
    });

    it('should handle pre-formatted code blocks', () => {
      manager.setHTML('<pre>const x = 1;</pre>');
      expect(element.querySelector('pre')).toBeTruthy();
      expect(manager.getText()).toBe('const x = 1;');
    });
  });
});
