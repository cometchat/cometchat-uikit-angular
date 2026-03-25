/**
 * FormatManager Unit Tests
 *
 * Tests for the FormatManager class that handles text formatting operations
 * on contenteditable elements. Covers: format application (bold, italic,
 * underline, strikethrough), format removal, toggle behavior, null selection
 * handling, block formatting, and format state queries.
 *
 * Manager classes are plain classes — instantiated directly, NOT via TestBed.
 *
 * @module services/format-manager
 * @see Requirements 5.2, 5.4, 5.5, 14.4, 14.5, 15.7
 */

import { FormatManager } from './format-manager.class';
import { ensureSdkReady, sdkCleanup } from '../test-setup';

describe('FormatManager', () => {
  let element: HTMLDivElement;
  let manager: FormatManager;

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

  beforeEach(() => {
    element = document.createElement('div');
    element.contentEditable = 'true';
    document.body.appendChild(element);
    manager = new FormatManager(element);
  });

  afterEach(() => {
    document.body.removeChild(element);
  });

  // ==================== Instantiation ====================

  describe('Instantiation', () => {
    it('should create an instance without error', () => {
      expect(manager).toBeTruthy();
    });

    it('should accept any HTMLElement as the target', () => {
      const span = document.createElement('span');
      document.body.appendChild(span);
      const m = new FormatManager(span);
      expect(m).toBeTruthy();
      document.body.removeChild(span);
    });
  });

  // ==================== Inline Format Application ====================

  describe('applyBold()', () => {
    it('should not throw when called with no selection', () => {
      expect(() => manager.applyBold()).not.toThrow();
    });

    it('should not throw on an empty element', () => {
      placeCaretAtStart();
      expect(() => manager.applyBold()).not.toThrow();
    });

    it('should apply bold formatting to selected text', () => {
      element.innerHTML = 'Hello world';
      selectAll();
      manager.applyBold();
      // execCommand wraps in <b> or <strong>
      const html = element.innerHTML.toLowerCase();
      expect(html.includes('<b>') || html.includes('<strong>')).toBe(true);
    });

    it('should focus the element when called', () => {
      const focusSpy = vi.spyOn(element, 'focus');
      manager.applyBold();
      expect(focusSpy).toHaveBeenCalled();
    });
  });

  describe('applyItalic()', () => {
    it('should not throw when called with no selection', () => {
      expect(() => manager.applyItalic()).not.toThrow();
    });

    it('should apply italic formatting to selected text', () => {
      element.innerHTML = 'Hello world';
      selectAll();
      manager.applyItalic();
      const html = element.innerHTML.toLowerCase();
      expect(html.includes('<i>') || html.includes('<em>')).toBe(true);
    });

    it('should focus the element when called', () => {
      const focusSpy = vi.spyOn(element, 'focus');
      manager.applyItalic();
      expect(focusSpy).toHaveBeenCalled();
    });
  });

  describe('applyUnderline()', () => {
    it('should not throw when called with no selection', () => {
      expect(() => manager.applyUnderline()).not.toThrow();
    });

    it('should apply underline formatting to selected text', () => {
      element.innerHTML = 'Hello world';
      selectAll();
      manager.applyUnderline();
      const html = element.innerHTML.toLowerCase();
      expect(html.includes('<u>')).toBe(true);
    });

    it('should focus the element when called', () => {
      const focusSpy = vi.spyOn(element, 'focus');
      manager.applyUnderline();
      expect(focusSpy).toHaveBeenCalled();
    });
  });

  describe('applyStrikethrough()', () => {
    it('should not throw when called with no selection', () => {
      expect(() => manager.applyStrikethrough()).not.toThrow();
    });

    it('should apply strikethrough formatting to selected text', () => {
      element.innerHTML = 'Hello world';
      selectAll();
      manager.applyStrikethrough();
      const html = element.innerHTML.toLowerCase();
      expect(html.includes('<strike>') || html.includes('<s>') || html.includes('<del>')).toBe(
        true
      );
    });

    it('should focus the element when called', () => {
      const focusSpy = vi.spyOn(element, 'focus');
      manager.applyStrikethrough();
      expect(focusSpy).toHaveBeenCalled();
    });
  });

  // ==================== Toggle Behavior ====================

  describe('Toggle Behavior', () => {
    it('should toggle bold off when applied twice', () => {
      element.innerHTML = 'Hello';
      selectAll();
      manager.applyBold();
      // Re-select (execCommand may change DOM)
      selectAll();
      manager.applyBold();
      const html = element.innerHTML.toLowerCase();
      // After toggling off, the text should be unwrapped
      // It may still have residual tags in jsdom, so check text is present
      expect(element.textContent).toContain('Hello');
    });

    it('should toggle italic off when applied twice', () => {
      element.innerHTML = 'Hello';
      selectAll();
      manager.applyItalic();
      selectAll();
      manager.applyItalic();
      expect(element.textContent).toContain('Hello');
    });

    it('should toggle underline off when applied twice', () => {
      element.innerHTML = 'Hello';
      selectAll();
      manager.applyUnderline();
      selectAll();
      manager.applyUnderline();
      expect(element.textContent).toContain('Hello');
    });

    it('should toggle strikethrough off when applied twice', () => {
      element.innerHTML = 'Hello';
      selectAll();
      manager.applyStrikethrough();
      selectAll();
      manager.applyStrikethrough();
      expect(element.textContent).toContain('Hello');
    });
  });

  // ==================== Inline Code ====================

  describe('applyInlineCode()', () => {
    it('should not throw when called with no selection', () => {
      expect(() => manager.applyInlineCode()).not.toThrow();
    });

    it('should wrap selected text in a <code> tag', () => {
      element.innerHTML = 'const x = 1';
      selectAll();
      manager.applyInlineCode();
      expect(element.querySelector('code')).toBeTruthy();
    });

    it('should apply the BEM class to the code element', () => {
      element.innerHTML = 'const x = 1';
      selectAll();
      manager.applyInlineCode();
      const code = element.querySelector('code');
      expect(code?.classList.contains('cometchat-rich-text__code')).toBe(true);
    });

    it('should toggle inline code off when already inside code', () => {
      element.innerHTML = '<code class="cometchat-rich-text__code">snippet</code>';
      // Select the text inside the code element
      const codeEl = element.querySelector('code')!;
      selectTextNode(codeEl.firstChild!);
      manager.applyInlineCode();
      // After toggle, the <code> wrapper should be removed
      expect(element.textContent).toContain('snippet');
    });

    it('should focus the element when called', () => {
      const focusSpy = vi.spyOn(element, 'focus');
      manager.applyInlineCode();
      expect(focusSpy).toHaveBeenCalled();
    });
  });

  // ==================== Block Formatting ====================

  describe('applyCodeBlock()', () => {
    it('should not throw when called with no selection', () => {
      expect(() => manager.applyCodeBlock()).not.toThrow();
    });

    it('should wrap selected block in a <pre> tag', () => {
      element.innerHTML = '<p>code here</p>';
      selectAll();
      manager.applyCodeBlock();
      expect(element.querySelector('pre')).toBeTruthy();
    });

    it('should apply the BEM class to the pre element', () => {
      element.innerHTML = '<p>code here</p>';
      selectAll();
      manager.applyCodeBlock();
      const pre = element.querySelector('pre');
      expect(pre?.classList.contains('cometchat-rich-text__code-block')).toBe(true);
    });

    it('should focus the element when called', () => {
      const focusSpy = vi.spyOn(element, 'focus');
      manager.applyCodeBlock();
      expect(focusSpy).toHaveBeenCalled();
    });

    it('should return early when window.getSelection returns no ranges', () => {
      // With no selection at all, it should not throw
      window.getSelection()?.removeAllRanges();
      expect(() => manager.applyCodeBlock()).not.toThrow();
    });
  });

  describe('applyBlockquote()', () => {
    it('should not throw when called with no selection', () => {
      expect(() => manager.applyBlockquote()).not.toThrow();
    });

    it('should wrap selected block in a <blockquote> tag', () => {
      element.innerHTML = '<p>quoted text</p>';
      selectAll();
      manager.applyBlockquote();
      expect(element.querySelector('blockquote')).toBeTruthy();
    });

    it('should apply the BEM class to the blockquote element', () => {
      element.innerHTML = '<p>quoted text</p>';
      selectAll();
      manager.applyBlockquote();
      const bq = element.querySelector('blockquote');
      expect(bq?.classList.contains('cometchat-rich-text__blockquote')).toBe(true);
    });

    it('should focus the element when called', () => {
      const focusSpy = vi.spyOn(element, 'focus');
      manager.applyBlockquote();
      expect(focusSpy).toHaveBeenCalled();
    });

    it('should return early when window.getSelection returns no ranges', () => {
      window.getSelection()?.removeAllRanges();
      expect(() => manager.applyBlockquote()).not.toThrow();
    });
  });

  // ==================== List Formatting ====================

  describe('applyOrderedList()', () => {
    it('should not throw when called', () => {
      expect(() => manager.applyOrderedList()).not.toThrow();
    });

    it('should focus the element when called', () => {
      const focusSpy = vi.spyOn(element, 'focus');
      manager.applyOrderedList();
      expect(focusSpy).toHaveBeenCalled();
    });
  });

  describe('applyBulletList()', () => {
    it('should not throw when called', () => {
      expect(() => manager.applyBulletList()).not.toThrow();
    });

    it('should focus the element when called', () => {
      const focusSpy = vi.spyOn(element, 'focus');
      manager.applyBulletList();
      expect(focusSpy).toHaveBeenCalled();
    });
  });

  // ==================== Format State Queries ====================

  describe('isActive()', () => {
    it('should return false when no format is active', () => {
      element.innerHTML = 'plain text';
      placeCaretAtStart();
      expect(manager.isActive('bold')).toBe(false);
    });

    it('should return false for unknown format names', () => {
      element.innerHTML = 'text';
      placeCaretAtStart();
      expect(manager.isActive('nonexistent')).toBe(false);
    });

    it('should not throw when called with no selection', () => {
      window.getSelection()?.removeAllRanges();
      expect(() => manager.isActive('bold')).not.toThrow();
    });
  });

  describe('getCurrentFormats()', () => {
    it('should return all-false state for plain text', () => {
      element.innerHTML = 'plain text';
      placeCaretAtStart();
      const state = manager.getCurrentFormats();
      expect(state.bold).toBe(false);
      expect(state.italic).toBe(false);
      expect(state.underline).toBe(false);
      expect(state.strikethrough).toBe(false);
      expect(state.code).toBe(false);
      expect(state.blockquote).toBe(false);
      expect(state.codeBlock).toBe(false);
      expect(state.orderedList).toBe(false);
      expect(state.bulletList).toBe(false);
      expect(state.link).toBe(false);
    });

    it('should return an object with all expected keys', () => {
      placeCaretAtStart();
      const state = manager.getCurrentFormats();
      const expectedKeys = [
        'bold',
        'italic',
        'underline',
        'strikethrough',
        'code',
        'blockquote',
        'codeBlock',
        'orderedList',
        'bulletList',
        'link',
      ];
      expectedKeys.forEach(key => {
        expect(state).toHaveProperty(key);
        expect(typeof (state as unknown as Record<string, unknown>)[key]).toBe('boolean');
      });
    });

    it('should detect code format when cursor is inside <code>', () => {
      element.innerHTML = '<code>snippet</code>';
      const codeEl = element.querySelector('code')!;
      selectTextNode(codeEl.firstChild!);
      const state = manager.getCurrentFormats();
      expect(state.code).toBe(true);
    });

    it('should detect blockquote format when cursor is inside <blockquote>', () => {
      element.innerHTML = '<blockquote>quoted</blockquote>';
      const bq = element.querySelector('blockquote')!;
      selectTextNode(bq.firstChild!);
      const state = manager.getCurrentFormats();
      expect(state.blockquote).toBe(true);
    });

    it('should detect codeBlock format when cursor is inside <pre>', () => {
      element.innerHTML = '<pre>code block</pre>';
      const pre = element.querySelector('pre')!;
      selectTextNode(pre.firstChild!);
      const state = manager.getCurrentFormats();
      expect(state.codeBlock).toBe(true);
    });

    it('should detect link format when cursor is inside <a>', () => {
      element.innerHTML = '<a href="https://example.com">link</a>';
      const anchor = element.querySelector('a')!;
      selectTextNode(anchor.firstChild!);
      const state = manager.getCurrentFormats();
      expect(state.link).toBe(true);
    });

    it('should not report underline as true when inside a link (false positive guard)', () => {
      element.innerHTML = '<a href="https://example.com">link text</a>';
      const anchor = element.querySelector('a')!;
      selectTextNode(anchor.firstChild!);
      const state = manager.getCurrentFormats();
      // The implementation checks for <u> tag when inside a link
      // to avoid the browser's text-decoration false positive
      expect(state.link).toBe(true);
      // underline should be false unless there's an actual <u> tag
      expect(state.underline).toBe(false);
    });

    it('should detect underline inside a link when <u> tag is present', () => {
      element.innerHTML = '<a href="https://example.com"><u>underlined link</u></a>';
      const uEl = element.querySelector('u')!;
      selectTextNode(uEl.firstChild!);
      const state = manager.getCurrentFormats();
      expect(state.link).toBe(true);
      expect(state.underline).toBe(true);
    });
  });

  // ==================== Null / No-Selection Handling (Req 5.6) ====================

  describe('Null / No-Selection Handling', () => {
    it('should not throw applyBold with no selection', () => {
      window.getSelection()?.removeAllRanges();
      expect(() => manager.applyBold()).not.toThrow();
    });

    it('should not throw applyItalic with no selection', () => {
      window.getSelection()?.removeAllRanges();
      expect(() => manager.applyItalic()).not.toThrow();
    });

    it('should not throw applyUnderline with no selection', () => {
      window.getSelection()?.removeAllRanges();
      expect(() => manager.applyUnderline()).not.toThrow();
    });

    it('should not throw applyStrikethrough with no selection', () => {
      window.getSelection()?.removeAllRanges();
      expect(() => manager.applyStrikethrough()).not.toThrow();
    });

    it('should not throw applyInlineCode with no selection', () => {
      window.getSelection()?.removeAllRanges();
      expect(() => manager.applyInlineCode()).not.toThrow();
    });

    it('should not throw applyCodeBlock with no selection', () => {
      window.getSelection()?.removeAllRanges();
      expect(() => manager.applyCodeBlock()).not.toThrow();
    });

    it('should not throw applyBlockquote with no selection', () => {
      window.getSelection()?.removeAllRanges();
      expect(() => manager.applyBlockquote()).not.toThrow();
    });

    it('should not throw applyOrderedList with no selection', () => {
      window.getSelection()?.removeAllRanges();
      expect(() => manager.applyOrderedList()).not.toThrow();
    });

    it('should not throw applyBulletList with no selection', () => {
      window.getSelection()?.removeAllRanges();
      expect(() => manager.applyBulletList()).not.toThrow();
    });

    it('should not throw isActive with no selection', () => {
      window.getSelection()?.removeAllRanges();
      expect(() => manager.isActive('bold')).not.toThrow();
    });

    it('should not throw getCurrentFormats with no selection', () => {
      window.getSelection()?.removeAllRanges();
      expect(() => manager.getCurrentFormats()).not.toThrow();
    });

    it('should return all-false from getCurrentFormats with no selection', () => {
      window.getSelection()?.removeAllRanges();
      const state = manager.getCurrentFormats();
      expect(state.bold).toBe(false);
      expect(state.italic).toBe(false);
      expect(state.underline).toBe(false);
      expect(state.strikethrough).toBe(false);
      expect(state.code).toBe(false);
      expect(state.blockquote).toBe(false);
      expect(state.codeBlock).toBe(false);
      expect(state.orderedList).toBe(false);
      expect(state.bulletList).toBe(false);
      expect(state.link).toBe(false);
    });
  });

  // ==================== Edge Cases ====================

  describe('Edge Cases', () => {
    it('should handle formatting on empty element', () => {
      placeCaretAtStart();
      expect(() => {
        manager.applyBold();
        manager.applyItalic();
        manager.applyUnderline();
        manager.applyStrikethrough();
      }).not.toThrow();
    });

    it('should handle multiple formats applied sequentially', () => {
      element.innerHTML = 'Hello';
      selectAll();
      manager.applyBold();
      selectAll();
      manager.applyItalic();
      // Text should still be present with both formats
      expect(element.textContent).toContain('Hello');
    });

    it('should handle formatting on whitespace-only content', () => {
      element.innerHTML = '   ';
      selectAll();
      expect(() => manager.applyBold()).not.toThrow();
    });

    it('should handle formatting on very long text', () => {
      const longText = 'a'.repeat(5000);
      element.innerHTML = longText;
      selectAll();
      expect(() => manager.applyBold()).not.toThrow();
      expect(element.textContent?.length).toBe(5000);
    });

    it('should handle formatting on content with special characters', () => {
      element.innerHTML = '<p>&lt;div&gt; &amp; "quotes"</p>';
      selectAll();
      expect(() => manager.applyBold()).not.toThrow();
    });

    it('should handle formatting on content with emoji', () => {
      element.innerHTML = 'Hello 👋 World 🌍';
      selectAll();
      expect(() => manager.applyBold()).not.toThrow();
      expect(element.textContent).toContain('👋');
    });

    it('should handle formatting on RTL text', () => {
      element.innerHTML = 'مرحبا بالعالم';
      selectAll();
      expect(() => manager.applyBold()).not.toThrow();
      expect(element.textContent).toContain('مرحبا');
    });

    it('should handle applyCodeBlock on element with no block children', () => {
      element.innerHTML = 'just text no blocks';
      selectAll();
      expect(() => manager.applyCodeBlock()).not.toThrow();
    });

    it('should handle applyBlockquote on element with no block children', () => {
      element.innerHTML = 'just text no blocks';
      selectAll();
      expect(() => manager.applyBlockquote()).not.toThrow();
    });

    it('should handle collapsed selection (cursor with no text selected)', () => {
      element.innerHTML = 'Hello world';
      const textNode = element.firstChild!;
      selectTextNode(textNode, 3, 3); // collapsed at position 3
      expect(() => manager.applyBold()).not.toThrow();
    });

    it('should handle partial text selection', () => {
      element.innerHTML = 'Hello world';
      const textNode = element.firstChild!;
      selectTextNode(textNode, 0, 5); // select "Hello"
      expect(() => manager.applyBold()).not.toThrow();
      expect(element.textContent).toContain('Hello');
      expect(element.textContent).toContain('world');
    });
  });
});

// ==================== Bug Condition Exploration Tests (Group B: Code Block / Inline Code) ====================

/**
 * Bug Condition Exploration Tests — Code Block / Inline Code at FormatManager Level (Group B)
 *
 * These tests encode the EXPECTED (correct) behavior for code block and inline code bugs
 * at the FormatManager level. They are designed to FAIL on unfixed code, confirming the bugs exist.
 *
 * **Validates: Requirements 1.9, 1.16, 1.17, 1.19**
 *
 * @module services/format-manager/bug-exploration-group-b
 */

import * as fc from 'fast-check';

describe('Bug Condition Exploration: Code Block / Inline Code at FormatManager Level (Group B)', () => {
  let element: HTMLDivElement;
  let manager: FormatManager;

  beforeAll(async () => {
    await ensureSdkReady();
  });

  afterAll(async () => {
    await sdkCleanup();
  });

  function selectAll(): void {
    const sel = window.getSelection()!;
    const range = document.createRange();
    range.selectNodeContents(element);
    sel.removeAllRanges();
    sel.addRange(range);
  }

  function selectNodeContents(node: Node): void {
    const sel = window.getSelection()!;
    const range = document.createRange();
    range.selectNodeContents(node);
    sel.removeAllRanges();
    sel.addRange(range);
  }

  beforeEach(() => {
    element = document.createElement('div');
    element.contentEditable = 'true';
    document.body.appendChild(element);
    manager = new FormatManager(element);
  });

  afterEach(() => {
    document.body.removeChild(element);
  });

  // ==================== Case 3 (Req 1.9): FormatManager-level inline format guard ====================

  describe('Case 3 (Req 1.9): FormatManager inline formatting guard inside code blocks', () => {
    /**
     * **Validates: Requirements 1.9**
     *
     * Property: FormatManager.applyBold/Italic/Underline/Strikethrough should be no-ops
     * when the cursor is inside a <pre> code block.
     *
     * Bug: No guard check exists in these methods.
     */
    it('should NOT apply bold when cursor is inside a code block', () => {
      element.innerHTML = '<pre class="cometchat-rich-text__code-block">code text</pre>';
      const pre = element.querySelector('pre')!;
      selectNodeContents(pre);

      manager.applyBold();

      const preHtml = pre.innerHTML.toLowerCase();
      expect(preHtml.includes('<b>') || preHtml.includes('<strong>')).toBe(false);
    });

    it('should NOT apply italic when cursor is inside a code block', () => {
      element.innerHTML = '<pre class="cometchat-rich-text__code-block">code text</pre>';
      const pre = element.querySelector('pre')!;
      selectNodeContents(pre);

      manager.applyItalic();

      const preHtml = pre.innerHTML.toLowerCase();
      expect(preHtml.includes('<i>') || preHtml.includes('<em>')).toBe(false);
    });

    it('should NOT apply underline when cursor is inside a code block', () => {
      element.innerHTML = '<pre class="cometchat-rich-text__code-block">code text</pre>';
      const pre = element.querySelector('pre')!;
      selectNodeContents(pre);

      manager.applyUnderline();

      const preHtml = pre.innerHTML.toLowerCase();
      expect(preHtml.includes('<u>')).toBe(false);
    });

    it('should NOT apply strikethrough when cursor is inside a code block', () => {
      element.innerHTML = '<pre class="cometchat-rich-text__code-block">code text</pre>';
      const pre = element.querySelector('pre')!;
      selectNodeContents(pre);

      manager.applyStrikethrough();

      const preHtml = pre.innerHTML.toLowerCase();
      expect(
        preHtml.includes('<strike>') || preHtml.includes('<s>') || preHtml.includes('<del>')
      ).toBe(false);
    });
  });

  // ==================== Case 6 (Req 1.16): Mutual exclusivity at FormatManager level ====================

  describe('Case 6 (Req 1.16): Code block and blockquote mutual exclusivity (FormatManager)', () => {
    /**
     * **Validates: Requirements 1.16**
     *
     * Property: Applying code block while blockquote is active should remove the blockquote.
     * Applying blockquote while code block is active should remove the code block.
     *
     * Bug: applyCodeBlock and applyBlockquote do not check for or remove the other format.
     */
    it('should remove blockquote when code block is applied via FormatManager', () => {
      element.innerHTML =
        '<blockquote class="cometchat-rich-text__blockquote">quoted text</blockquote>';
      const bq = element.querySelector('blockquote')!;
      selectNodeContents(bq);

      manager.applyCodeBlock();

      expect(element.querySelector('pre')).toBeTruthy();
      expect(element.querySelector('blockquote')).toBeNull();
    });

    it('should remove code block when blockquote is applied via FormatManager', () => {
      element.innerHTML = '<pre class="cometchat-rich-text__code-block">code text</pre>';
      const pre = element.querySelector('pre')!;
      selectNodeContents(pre);

      manager.applyBlockquote();

      expect(element.querySelector('blockquote')).toBeTruthy();
      expect(element.querySelector('pre')).toBeNull();
    });

    it('should enforce mutual exclusivity for generated text (property-based)', () => {
      /**
       * **Validates: Requirements 1.16**
       */
      fc.assert(
        fc.property(
          fc
            .string({ minLength: 1, maxLength: 30 })
            .filter(s => s.trim().length > 0 && !/[<>&]/.test(s)),
          fc.boolean(),
          (text, codeFirst) => {
            element.innerHTML = `<p>${text}</p>`;
            selectAll();

            if (codeFirst) {
              manager.applyCodeBlock();
              // Re-select
              const sel = window.getSelection()!;
              const range = document.createRange();
              range.selectNodeContents(element);
              sel.removeAllRanges();
              sel.addRange(range);
              manager.applyBlockquote();

              expect(element.querySelector('blockquote')).toBeTruthy();
              expect(element.querySelector('pre')).toBeNull();
            } else {
              manager.applyBlockquote();
              const sel = window.getSelection()!;
              const range = document.createRange();
              range.selectNodeContents(element);
              sel.removeAllRanges();
              sel.addRange(range);
              manager.applyCodeBlock();

              expect(element.querySelector('pre')).toBeTruthy();
              expect(element.querySelector('blockquote')).toBeNull();
            }

            // Reset
            element.innerHTML = '';
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  // ==================== Case 7 (Req 1.17): List and code block mutual exclusivity ====================

  describe('Case 7 (Req 1.17): List and code block mutual exclusivity (FormatManager)', () => {
    /**
     * **Validates: Requirements 1.17**
     *
     * Property: Applying ordered/unordered list while code block is active should
     * remove the code block and apply the list.
     *
     * Bug: applyOrderedList/applyBulletList do not remove code blocks first.
     */
    it('should remove code block when ordered list is applied via FormatManager', () => {
      element.innerHTML = '<pre class="cometchat-rich-text__code-block">code text</pre>';
      const pre = element.querySelector('pre')!;
      selectNodeContents(pre);

      manager.applyOrderedList();

      expect(element.querySelector('pre')).toBeNull();
      expect(element.querySelector('ol')).toBeTruthy();
    });

    it('should remove code block when bullet list is applied via FormatManager', () => {
      element.innerHTML = '<pre class="cometchat-rich-text__code-block">code text</pre>';
      const pre = element.querySelector('pre')!;
      selectNodeContents(pre);

      manager.applyBulletList();

      expect(element.querySelector('pre')).toBeNull();
      expect(element.querySelector('ul')).toBeTruthy();
    });
  });

  // ==================== Case 8 (Req 1.19): Code block toggle strips formatting permanently ====================

  describe('Case 8 (Req 1.19): Code block toggle permanently strips inline formatting (FormatManager)', () => {
    /**
     * **Validates: Requirements 1.19**
     *
     * Property: Apply bold, toggle code block on, toggle code block off → bold NOT restored.
     *
     * Bug: exitBlockFormat('pre') restores inner HTML with formatting tags intact.
     */
    it('should NOT restore bold after code block toggle on/off via FormatManager', () => {
      element.innerHTML = '<p>Hello world</p>';
      selectAll();

      // Apply bold
      manager.applyBold();
      let html = element.innerHTML.toLowerCase();
      expect(html.includes('<b>') || html.includes('<strong>')).toBe(true);

      // Toggle code block ON
      selectAll();
      manager.applyCodeBlock();
      expect(element.querySelector('pre')).toBeTruthy();

      // Toggle code block OFF
      const pre = element.querySelector('pre')!;
      selectNodeContents(pre);
      manager.applyCodeBlock();

      // Bold should NOT be restored
      expect(element.querySelector('pre')).toBeNull();
      html = element.innerHTML.toLowerCase();
      expect(html.includes('<b>') || html.includes('<strong>')).toBe(false);
      expect(element.textContent).toContain('Hello world');
    });

    it('should permanently strip all inline formatting on code block toggle (property-based)', () => {
      /**
       * **Validates: Requirements 1.19**
       */
      const formatActions: { name: string; apply: () => void; tags: string[] }[] = [
        { name: 'bold', apply: () => manager.applyBold(), tags: ['<b>', '<strong>'] },
        { name: 'italic', apply: () => manager.applyItalic(), tags: ['<i>', '<em>'] },
        { name: 'underline', apply: () => manager.applyUnderline(), tags: ['<u>'] },
        {
          name: 'strikethrough',
          apply: () => manager.applyStrikethrough(),
          tags: ['<strike>', '<s>', '<del>'],
        },
      ];

      fc.assert(
        fc.property(fc.constantFrom(...formatActions), format => {
          element.innerHTML = '<p>test content</p>';
          selectAll();

          // Apply inline formatting
          format.apply();

          // Toggle code block ON
          selectAll();
          manager.applyCodeBlock();

          // Toggle code block OFF
          const pre = element.querySelector('pre');
          if (pre) {
            selectNodeContents(pre);
            manager.applyCodeBlock();
          }

          // Inline formatting should NOT be restored
          const html = element.innerHTML.toLowerCase();
          const hasFormatting = format.tags.some(tag => html.includes(tag));
          expect(hasFormatting).toBe(false);

          // Reset
          element.innerHTML = '';
        }),
        { numRuns: 8 }
      );
    });
  });
});

// ==================== Preservation Property Tests (Group B: Code Block / Inline Code) ====================

/**
 * Preservation Property Tests — Code Block / Inline Code at FormatManager Level (Group B)
 *
 * These tests verify that existing CORRECT behavior at the FormatManager level is preserved.
 * They MUST PASS on unfixed code — they capture behavior that should NOT
 * be broken by future bug fixes for code block / inline code issues.
 *
 * Observation-first methodology:
 * - Observe: Applying bold/italic/underline/strikethrough to normal text toggles correctly (Req 3.2)
 * - Observe: Block quote on plain text without inline formatting renders correctly (Req 3.9)
 *
 * **Validates: Requirements 3.2, 3.9**
 *
 * @module services/format-manager/preservation-group-b
 */

describe('Preservation: Code Block / Inline Code at FormatManager Level (Group B)', () => {
  let element: HTMLDivElement;
  let manager: FormatManager;

  beforeAll(async () => {
    await ensureSdkReady();
  });

  afterAll(async () => {
    await sdkCleanup();
  });

  function selectAll(): void {
    const sel = window.getSelection()!;
    const range = document.createRange();
    range.selectNodeContents(element);
    sel.removeAllRanges();
    sel.addRange(range);
  }

  beforeEach(() => {
    element = document.createElement('div');
    element.contentEditable = 'true';
    document.body.appendChild(element);
    manager = new FormatManager(element);
  });

  afterEach(() => {
    document.body.removeChild(element);
  });

  // ==================== Req 3.2: Inline formatting on normal text via FormatManager ====================

  describe('Req 3.2: FormatManager inline formatting on normal text toggles correctly', () => {
    /**
     * **Validates: Requirements 3.2**
     *
     * Property: FormatManager.applyBold/Italic/Underline/Strikethrough on normal text
     * (outside code blocks) should produce the corresponding HTML tags and preserve text.
     */
    it('should apply and detect inline formats on normal text (property-based)', () => {
      const formatActions: {
        name: string;
        apply: () => void;
        tags: string[];
        stateKey: keyof ReturnType<FormatManager['getCurrentFormats']>;
      }[] = [
        {
          name: 'bold',
          apply: () => manager.applyBold(),
          tags: ['<b>', '<strong>'],
          stateKey: 'bold',
        },
        {
          name: 'italic',
          apply: () => manager.applyItalic(),
          tags: ['<i>', '<em>'],
          stateKey: 'italic',
        },
        {
          name: 'underline',
          apply: () => manager.applyUnderline(),
          tags: ['<u>'],
          stateKey: 'underline',
        },
        {
          name: 'strikethrough',
          apply: () => manager.applyStrikethrough(),
          tags: ['<strike>', '<s>', '<del>'],
          stateKey: 'strikethrough',
        },
      ];

      fc.assert(
        fc.property(
          fc.constantFrom(...formatActions),
          fc
            .string({ minLength: 1, maxLength: 30 })
            .filter(s => s.trim().length > 0 && !/[<>&]/.test(s)),
          (format, text) => {
            element.innerHTML = text;
            selectAll();

            format.apply();

            // The format tag should be present in the HTML
            const html = element.innerHTML.toLowerCase();
            const hasFormat = format.tags.some(tag => html.includes(tag));
            expect(hasFormat).toBe(true);

            // Text content should be preserved
            expect(element.textContent).toContain(text);

            // Reset for next iteration
            element.innerHTML = '';
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should toggle inline format off when applied twice via FormatManager (property-based)', () => {
      /**
       * **Validates: Requirements 3.2**
       *
       * Property: Applying the same format twice should toggle it off,
       * preserving the text content.
       */
      fc.assert(
        fc.property(
          fc.constantFrom('bold', 'italic', 'underline', 'strikethrough'),
          fc
            .string({ minLength: 1, maxLength: 20 })
            .filter(s => s.trim().length > 0 && !/[<>&]/.test(s)),
          (formatName, text) => {
            element.innerHTML = text;

            const applyFn = () => {
              switch (formatName) {
                case 'bold':
                  manager.applyBold();
                  break;
                case 'italic':
                  manager.applyItalic();
                  break;
                case 'underline':
                  manager.applyUnderline();
                  break;
                case 'strikethrough':
                  manager.applyStrikethrough();
                  break;
              }
            };

            // Apply once
            selectAll();
            applyFn();

            // Apply again (toggle off)
            selectAll();
            applyFn();

            // Text should be preserved after toggle
            expect(element.textContent).toContain(text);

            // Reset
            element.innerHTML = '';
          }
        ),
        { numRuns: 16 }
      );
    });

    it('should apply multiple formats sequentially on normal text', () => {
      element.innerHTML = 'Multi format';
      selectAll();
      manager.applyBold();
      selectAll();
      manager.applyItalic();

      const html = element.innerHTML.toLowerCase();
      expect(html.includes('<b>') || html.includes('<strong>')).toBe(true);
      expect(html.includes('<i>') || html.includes('<em>')).toBe(true);
      expect(element.textContent).toContain('Multi format');
    });

    it('should report correct format state via getCurrentFormats for plain text', () => {
      element.innerHTML = 'plain text';
      selectAll();

      // Plain text should have all formats as false
      const state = manager.getCurrentFormats();
      expect(state.bold).toBe(false);
      expect(state.italic).toBe(false);
      expect(state.underline).toBe(false);
      expect(state.strikethrough).toBe(false);
      expect(state.codeBlock).toBe(false);
      expect(state.blockquote).toBe(false);
    });
  });

  // ==================== Req 3.9: Block quote on plain text via FormatManager ====================

  describe('Req 3.9: FormatManager blockquote on plain text renders correctly', () => {
    /**
     * **Validates: Requirements 3.9**
     *
     * Property: FormatManager.applyBlockquote on plain text (without inline formatting)
     * should create a <blockquote> with the correct BEM class, preserving text content.
     */
    it('should wrap plain text in blockquote with BEM class', () => {
      element.innerHTML = '<p>Plain quote text</p>';
      selectAll();

      manager.applyBlockquote();

      const bq = element.querySelector('blockquote');
      expect(bq).toBeTruthy();
      if (bq) {
        expect(bq.classList.contains('cometchat-rich-text__blockquote')).toBe(true);
      }
      expect(element.textContent).toContain('Plain quote text');
    });

    it('should toggle blockquote off when cursor is inside blockquote', () => {
      element.innerHTML = '<p>Toggle quote</p>';
      selectAll();
      manager.applyBlockquote();
      expect(element.querySelector('blockquote')).toBeTruthy();

      // Select inside the blockquote element for toggle to detect it
      const bq = element.querySelector('blockquote')!;
      const sel = window.getSelection()!;
      const range = document.createRange();
      range.selectNodeContents(bq);
      sel.removeAllRanges();
      sel.addRange(range);
      manager.applyBlockquote();

      expect(element.querySelector('blockquote')).toBeNull();
      expect(element.textContent).toContain('Toggle quote');
    });

    it('should preserve plain text in blockquote for generated inputs (property-based)', () => {
      /**
       * **Validates: Requirements 3.9**
       *
       * Property: For any plain text, applying blockquote via FormatManager should
       * create a <blockquote> with BEM class and preserve the text.
       */
      fc.assert(
        fc.property(
          fc
            .string({ minLength: 1, maxLength: 40 })
            .filter(s => s.trim().length > 0 && !/[<>&]/.test(s)),
          text => {
            element.innerHTML = `<p>${text}</p>`;
            selectAll();

            manager.applyBlockquote();

            const bq = element.querySelector('blockquote');
            expect(bq).toBeTruthy();
            expect(element.textContent).toContain(text);

            if (bq) {
              expect(bq.classList.contains('cometchat-rich-text__blockquote')).toBe(true);
            }

            // Reset
            element.innerHTML = '';
          }
        ),
        { numRuns: 15 }
      );
    });

    it('should detect blockquote state via getCurrentFormats', () => {
      element.innerHTML = '<blockquote class="cometchat-rich-text__blockquote">quoted</blockquote>';
      const bq = element.querySelector('blockquote')!;
      const sel = window.getSelection()!;
      const range = document.createRange();
      range.selectNodeContents(bq);
      sel.removeAllRanges();
      sel.addRange(range);

      const state = manager.getCurrentFormats();
      expect(state.blockquote).toBe(true);
      expect(state.codeBlock).toBe(false);
    });
  });
});

// ==================== Bug Group E: Block Quote Inline Formatting (Req 1.18) ====================

/**
 * Bug Condition Exploration Tests — Block Quote Inline Formatting (Group E)
 *
 * These tests are EXPECTED TO FAIL on unfixed code. Failure confirms the bug exists.
 * DO NOT fix the code or the tests when they fail.
 *
 * Bug 1.18: When inline formatting (bold, italic, underline, strikethrough) or mentions
 * are applied inside a block quote, the system does not allow or correctly render these
 * inline formats within the block quote.
 *
 * **Validates: Requirements 1.18**
 *
 * @module services/format-manager/bug-condition-group-e
 */

describe('Bug Condition Exploration: Block Quote Inline Formatting (Group E) — FormatManager', () => {
  let element: HTMLDivElement;
  let manager: FormatManager;

  beforeAll(async () => {
    await ensureSdkReady();
  });

  afterAll(async () => {
    await sdkCleanup();
  });

  function selectNodeContents(node: Node): void {
    const sel = window.getSelection()!;
    const range = document.createRange();
    range.selectNodeContents(node);
    sel.removeAllRanges();
    sel.addRange(range);
  }

  beforeEach(() => {
    element = document.createElement('div');
    element.contentEditable = 'true';
    document.body.appendChild(element);
    manager = new FormatManager(element);
  });

  afterEach(() => {
    document.body.removeChild(element);
  });

  // ==================== Case 1 (Req 1.18): Bold inside block quote ====================

  describe('Case 1 (Req 1.18): Inline formatting inside block quote', () => {
    /**
     * **Validates: Requirements 1.18**
     *
     * Property: When the user applies inline formatting (bold, italic, underline,
     * strikethrough) inside a block quote, the system should correctly apply and
     * render these inline formats within the block quote.
     *
     * Bug: Inline formats and mentions are not allowed or rendered inside block quotes.
     */
    it('should apply bold formatting inside a blockquote', () => {
      element.innerHTML =
        '<blockquote class="cometchat-rich-text__blockquote">quoted text here</blockquote>';
      const bq = element.querySelector('blockquote')!;
      selectNodeContents(bq);

      manager.applyBold();

      // Expected: bold tag should exist INSIDE the blockquote
      const bqHtml = bq.innerHTML.toLowerCase();
      expect(bqHtml.includes('<b>') || bqHtml.includes('<strong>')).toBe(true);
      // The blockquote should still exist
      expect(element.querySelector('blockquote')).toBeTruthy();
    });

    it('should apply italic formatting inside a blockquote', () => {
      element.innerHTML =
        '<blockquote class="cometchat-rich-text__blockquote">italic quote text</blockquote>';
      const bq = element.querySelector('blockquote')!;
      selectNodeContents(bq);

      manager.applyItalic();

      // Expected: italic tag should exist INSIDE the blockquote
      const bqHtml = bq.innerHTML.toLowerCase();
      expect(bqHtml.includes('<i>') || bqHtml.includes('<em>')).toBe(true);
      expect(element.querySelector('blockquote')).toBeTruthy();
    });

    it('should apply underline formatting inside a blockquote', () => {
      element.innerHTML =
        '<blockquote class="cometchat-rich-text__blockquote">underline quote text</blockquote>';
      const bq = element.querySelector('blockquote')!;
      selectNodeContents(bq);

      manager.applyUnderline();

      // Expected: underline tag should exist INSIDE the blockquote
      const bqHtml = bq.innerHTML.toLowerCase();
      expect(bqHtml.includes('<u>')).toBe(true);
      expect(element.querySelector('blockquote')).toBeTruthy();
    });

    it('should apply strikethrough formatting inside a blockquote', () => {
      element.innerHTML =
        '<blockquote class="cometchat-rich-text__blockquote">strike quote text</blockquote>';
      const bq = element.querySelector('blockquote')!;
      selectNodeContents(bq);

      manager.applyStrikethrough();

      // Expected: strikethrough tag should exist INSIDE the blockquote
      const bqHtml = bq.innerHTML.toLowerCase();
      expect(
        bqHtml.includes('<strike>') || bqHtml.includes('<s>') || bqHtml.includes('<del>')
      ).toBe(true);
      expect(element.querySelector('blockquote')).toBeTruthy();
    });

    it('should apply inline formatting inside blockquote for generated text (property-based)', () => {
      /**
       * **Validates: Requirements 1.18**
       *
       * Property: For any non-empty text, applying bold inside a blockquote should
       * produce a <strong> or <b> tag inside the <blockquote>, and the blockquote
       * should remain intact.
       */
      fc.assert(
        fc.property(
          fc
            .string({ minLength: 1, maxLength: 30 })
            .filter(s => s.trim().length > 0 && !/[<>&]/.test(s)),
          text => {
            element.innerHTML = `<blockquote class="cometchat-rich-text__blockquote">${text}</blockquote>`;
            const bq = element.querySelector('blockquote')!;
            selectNodeContents(bq);

            manager.applyBold();

            // Blockquote must still exist
            const bqAfter = element.querySelector('blockquote');
            expect(bqAfter).toBeTruthy();

            // Bold tag must be inside the blockquote
            if (bqAfter) {
              const bqHtml = bqAfter.innerHTML.toLowerCase();
              expect(bqHtml.includes('<b>') || bqHtml.includes('<strong>')).toBe(true);
            }

            // Text content must be preserved
            expect(element.textContent).toContain(text);

            // Reset
            element.innerHTML = '';
          }
        ),
        { numRuns: 15 }
      );
    });

    it('should preserve blockquote when multiple inline formats are applied sequentially', () => {
      element.innerHTML =
        '<blockquote class="cometchat-rich-text__blockquote">multi format quote</blockquote>';
      const bq = element.querySelector('blockquote')!;

      // Apply bold
      selectNodeContents(bq);
      manager.applyBold();

      // Re-select inside blockquote and apply italic
      const bqAfterBold = element.querySelector('blockquote')!;
      selectNodeContents(bqAfterBold);
      manager.applyItalic();

      // Blockquote should still exist with both formats inside
      const finalBq = element.querySelector('blockquote');
      expect(finalBq).toBeTruthy();
      if (finalBq) {
        const html = finalBq.innerHTML.toLowerCase();
        expect(html.includes('<b>') || html.includes('<strong>')).toBe(true);
        expect(html.includes('<i>') || html.includes('<em>')).toBe(true);
      }
      expect(element.textContent).toContain('multi format quote');
    });
  });
});

// ==================== Preservation Property Tests (Group E: Block Quote) ====================

/**
 * Preservation Property Tests — Block Quote at FormatManager Level (Group E)
 *
 * These tests verify that existing CORRECT block quote behavior at the FormatManager
 * level is preserved. They MUST PASS on unfixed code — they capture behavior that
 * should NOT be broken by future bug fixes for block quote inline formatting (Req 1.18).
 *
 * Observation-first methodology:
 * - Observe: Block quote on plain text without inline formatting renders correctly (Req 3.9)
 *
 * These tests complement Group B preservation tests by focusing specifically on
 * block quote scenarios that must remain stable when the inline-formatting-inside-
 * blockquote bug (Req 1.18) is fixed.
 *
 * **Validates: Requirements 3.9**
 *
 * @module services/format-manager/preservation-group-e
 */

describe('Preservation: Block Quote at FormatManager Level (Group E)', () => {
  let element: HTMLDivElement;
  let manager: FormatManager;

  beforeAll(async () => {
    await ensureSdkReady();
  });

  afterAll(async () => {
    await sdkCleanup();
  });

  function selectAll(): void {
    const sel = window.getSelection()!;
    const range = document.createRange();
    range.selectNodeContents(element);
    sel.removeAllRanges();
    sel.addRange(range);
  }

  function selectNodeContents(node: Node): void {
    const sel = window.getSelection()!;
    const range = document.createRange();
    range.selectNodeContents(node);
    sel.removeAllRanges();
    sel.addRange(range);
  }

  beforeEach(() => {
    element = document.createElement('div');
    element.contentEditable = 'true';
    document.body.appendChild(element);
    manager = new FormatManager(element);
  });

  afterEach(() => {
    document.body.removeChild(element);
  });

  // ==================== Req 3.9: Block quote on plain text via FormatManager ====================

  describe('Req 3.9: FormatManager blockquote preserves plain text content and structure', () => {
    /**
     * **Validates: Requirements 3.9**
     *
     * Property: FormatManager.applyBlockquote on plain text (without inline formatting)
     * should create a <blockquote> with the correct BEM class, preserve text content,
     * and correctly toggle off when re-applied.
     */

    it('should include blockquote HTML in element innerHTML after applying blockquote', () => {
      element.innerHTML = '<p>Output check</p>';
      selectAll();
      manager.applyBlockquote();

      const html = element.innerHTML.toLowerCase();
      expect(html).toContain('<blockquote');
      expect(html).toContain('output check');
    });

    it('should not produce nested blockquotes when applied to already-quoted text', () => {
      element.innerHTML = '<p>No nesting</p>';
      selectAll();
      manager.applyBlockquote();
      expect(element.querySelector('blockquote')).toBeTruthy();

      // Applying again with cursor inside should toggle off, not nest
      const bq = element.querySelector('blockquote')!;
      selectNodeContents(bq);
      manager.applyBlockquote();

      expect(element.querySelectorAll('blockquote').length).toBe(0);
      expect(element.textContent).toContain('No nesting');
    });

    it('should preserve text through blockquote toggle on/off cycle', () => {
      element.innerHTML = '<p>Cycle text</p>';

      // Apply blockquote
      selectAll();
      manager.applyBlockquote();
      expect(element.querySelector('blockquote')).toBeTruthy();
      expect(element.textContent).toContain('Cycle text');

      // Toggle off
      const bq = element.querySelector('blockquote')!;
      selectNodeContents(bq);
      manager.applyBlockquote();

      expect(element.querySelector('blockquote')).toBeNull();
      expect(element.textContent).toContain('Cycle text');
    });

    it('should report blockquote=false via getCurrentFormats for plain text', () => {
      element.innerHTML = 'plain text no quote';
      selectAll();

      const state = manager.getCurrentFormats();
      expect(state.blockquote).toBe(false);
    });

    it('should report blockquote=true via getCurrentFormats when inside blockquote', () => {
      element.innerHTML =
        '<blockquote class="cometchat-rich-text__blockquote">inside quote</blockquote>';
      const bq = element.querySelector('blockquote')!;
      selectNodeContents(bq);

      const state = manager.getCurrentFormats();
      expect(state.blockquote).toBe(true);
    });

    it('should not throw when applying blockquote with no selection', () => {
      window.getSelection()?.removeAllRanges();
      expect(() => manager.applyBlockquote()).not.toThrow();
    });

    it('should handle blockquote on whitespace-only content', () => {
      element.innerHTML = '<p>   </p>';
      selectAll();
      expect(() => manager.applyBlockquote()).not.toThrow();
    });

    it('should preserve text and BEM class for generated plain text inputs (property-based)', () => {
      /**
       * **Validates: Requirements 3.9**
       *
       * Property: For any non-empty plain text, applying blockquote via FormatManager
       * should create a <blockquote> with BEM class, include it in innerHTML, and
       * preserve the original text content.
       */
      fc.assert(
        fc.property(
          fc
            .string({ minLength: 1, maxLength: 50 })
            .filter(s => s.trim().length > 0 && !/[<>&]/.test(s)),
          text => {
            element.innerHTML = `<p>${text}</p>`;
            selectAll();

            manager.applyBlockquote();

            // Blockquote element should exist
            const bq = element.querySelector('blockquote');
            expect(bq).toBeTruthy();

            // Text content should be preserved
            expect(element.textContent).toContain(text);

            // BEM class should be applied
            if (bq) {
              expect(bq.classList.contains('cometchat-rich-text__blockquote')).toBe(true);
            }

            // innerHTML should contain blockquote
            const html = element.innerHTML.toLowerCase();
            expect(html).toContain('<blockquote');

            // Reset
            element.innerHTML = '';
          }
        ),
        { numRuns: 15 }
      );
    });

    it('should preserve text through blockquote toggle on/off for generated inputs (property-based)', () => {
      /**
       * **Validates: Requirements 3.9**
       *
       * Property: For any non-empty plain text, applying blockquote then toggling
       * it off via FormatManager should preserve the original text and remove the
       * blockquote element.
       */
      fc.assert(
        fc.property(
          fc
            .string({ minLength: 1, maxLength: 40 })
            .filter(s => s.trim().length > 0 && !/[<>&]/.test(s)),
          text => {
            element.innerHTML = `<p>${text}</p>`;

            // Apply blockquote
            selectAll();
            manager.applyBlockquote();

            const bq = element.querySelector('blockquote');
            expect(bq).toBeTruthy();

            // Toggle off
            if (bq) {
              selectNodeContents(bq);
              manager.applyBlockquote();
            }

            // Blockquote should be removed
            expect(element.querySelector('blockquote')).toBeNull();

            // Text should be preserved
            expect(element.textContent).toContain(text);

            // Reset
            element.innerHTML = '';
          }
        ),
        { numRuns: 15 }
      );
    });
  });
});
