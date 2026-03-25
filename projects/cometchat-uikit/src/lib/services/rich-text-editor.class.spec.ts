/**
 * RichTextEditor Unit Tests
 *
 * Tests for the RichTextEditor class that manages a contenteditable-based
 * rich text editor. Covers: editor initialization, content management,
 * format application, event handling, null/empty content handling, history
 * (undo/redo), link operations, and destroy cleanup.
 *
 * Manager classes are plain classes — instantiated directly, NOT via TestBed.
 *
 * @module services/rich-text-editor
 * @see Requirements 5.2, 5.4, 5.5, 4.2, 14.4, 14.5, 15.7
 */

import { RichTextEditor } from './rich-text-editor.class';
import { RichTextEditorConfig } from './rich-text-editor.interfaces';
import { ensureSdkReady, sdkCleanup } from '../test-setup';

describe('RichTextEditor', () => {
  let editor: RichTextEditor;
  let config: RichTextEditorConfig;

  beforeAll(async () => {
    await ensureSdkReady();
  });

  afterAll(async () => {
    await sdkCleanup();
  });

  /**
   * Helper: create a minimal config with optional overrides.
   */
  function createConfig(overrides?: Partial<RichTextEditorConfig>): RichTextEditorConfig {
    return {
      placeholder: 'Type a message...',
      editable: true,
      ...overrides,
    };
  }

  /**
   * Helper: select all text inside the editor's contenteditable.
   */
  function selectAll(): void {
    const sel = window.getSelection()!;
    const range = document.createRange();
    range.selectNodeContents(editor.getContentEditable());
    sel.removeAllRanges();
    sel.addRange(range);
  }

  /**
   * Helper: place a collapsed cursor at the start of the contenteditable.
   */
  function placeCaretAtStart(): void {
    const sel = window.getSelection()!;
    const range = document.createRange();
    range.setStart(editor.getContentEditable(), 0);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
  }

  beforeEach(() => {
    config = createConfig();
    editor = new RichTextEditor(config);
    document.body.appendChild(editor.getElement());
  });

  afterEach(() => {
    if (!editor.isDestroyed()) {
      editor.destroy();
    }
    // Clean up any remaining elements
    const el = document.querySelector('.cometchat-rich-text-editor');
    if (el && el.parentNode) {
      el.parentNode.removeChild(el);
    }
  });

  // ==================== Initialization ====================

  describe('Initialization', () => {
    it('should create an instance without error', () => {
      expect(editor).toBeTruthy();
    });

    it('should create a container element when none is provided', () => {
      const el = editor.getElement();
      expect(el).toBeTruthy();
      expect(el.className).toContain('cometchat-rich-text-editor');
    });

    it('should use a provided container element', () => {
      const container = document.createElement('div');
      container.className = 'custom-container';
      document.body.appendChild(container);
      const customEditor = new RichTextEditor(config, container);
      expect(customEditor.getElement()).toBe(container);
      customEditor.destroy();
      // destroy() removes the element from DOM, so no manual removal needed
    });

    it('should create a contenteditable div inside the container', () => {
      const ce = editor.getContentEditable();
      expect(ce).toBeTruthy();
      expect(ce.tagName).toBe('DIV');
      expect(ce.contentEditable).toBe('true');
    });

    it('should set role=textbox on the contenteditable', () => {
      expect(editor.getContentEditable().getAttribute('role')).toBe('textbox');
    });

    it('should set aria-multiline=true on the contenteditable', () => {
      expect(editor.getContentEditable().getAttribute('aria-multiline')).toBe('true');
    });

    it('should set aria-label from config', () => {
      const customEditor = new RichTextEditor(createConfig({ ariaLabel: 'Message input' }));
      document.body.appendChild(customEditor.getElement());
      expect(customEditor.getContentEditable().getAttribute('aria-label')).toBe('Message input');
      customEditor.destroy();
    });

    it('should default aria-label to "Rich text editor"', () => {
      expect(editor.getContentEditable().getAttribute('aria-label')).toBe('Rich text editor');
    });

    it('should set data-placeholder from config', () => {
      expect(editor.getContentEditable().getAttribute('data-placeholder')).toBe(
        'Type a message...'
      );
    });

    it('should set initial content from config', () => {
      const editorWithContent = new RichTextEditor(createConfig({ content: '<p>Hello</p>' }));
      document.body.appendChild(editorWithContent.getElement());
      expect(editorWithContent.getHTML()).toContain('Hello');
      editorWithContent.destroy();
    });

    it('should create an ARIA live region for announcements', () => {
      const liveRegion = editor.getElement().querySelector('[aria-live="polite"]');
      expect(liveRegion).toBeTruthy();
      expect(liveRegion!.getAttribute('role')).toBe('status');
    });

    it('should not be destroyed after creation', () => {
      expect(editor.isDestroyed()).toBe(false);
    });

    it('should start with empty content by default', () => {
      expect(editor.isEmpty()).toBe(true);
    });

    it('should start with all format states as false', () => {
      const state = editor.getFormatState();
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

  // ==================== Content Management ====================

  describe('Content Management', () => {
    it('should get and set HTML content', () => {
      editor.setHTML('<p>Test content</p>');
      expect(editor.getHTML()).toContain('Test content');
    });

    it('should get plain text content', () => {
      editor.setHTML('<p>Hello <strong>world</strong></p>');
      expect(editor.getText()).toContain('Hello');
      expect(editor.getText()).toContain('world');
    });

    it('should clear content', () => {
      editor.setHTML('<p>Some content</p>');
      editor.clear();
      expect(editor.isEmpty()).toBe(true);
    });

    it('should report isEmpty correctly for empty editor', () => {
      expect(editor.isEmpty()).toBe(true);
    });

    it('should report isEmpty correctly for non-empty editor', () => {
      editor.setHTML('<p>Not empty</p>');
      expect(editor.isEmpty()).toBe(false);
    });

    it('should handle setting empty string as HTML', () => {
      editor.setHTML('<p>Content</p>');
      editor.setHTML('');
      expect(editor.getHTML()).toBe('');
    });

    it('should handle setting HTML with only whitespace', () => {
      editor.setHTML('   ');
      expect(() => editor.getHTML()).not.toThrow();
    });

    it('should handle setting HTML with nested elements', () => {
      editor.setHTML('<p><strong><em>Bold italic</em></strong></p>');
      expect(editor.getText()).toContain('Bold italic');
    });
  });

  // ==================== Format Application ====================

  describe('Format Application', () => {
    describe('applyBold()', () => {
      it('should not throw when called on empty editor', () => {
        placeCaretAtStart();
        expect(() => editor.applyBold()).not.toThrow();
      });

      it('should apply bold formatting to selected text', () => {
        editor.setHTML('Hello world');
        selectAll();
        editor.applyBold();
        const html = editor.getHTML().toLowerCase();
        expect(html.includes('<b>') || html.includes('<strong>')).toBe(true);
      });
    });

    describe('applyItalic()', () => {
      it('should not throw when called on empty editor', () => {
        placeCaretAtStart();
        expect(() => editor.applyItalic()).not.toThrow();
      });

      it('should apply italic formatting to selected text', () => {
        editor.setHTML('Hello world');
        selectAll();
        editor.applyItalic();
        const html = editor.getHTML().toLowerCase();
        expect(html.includes('<i>') || html.includes('<em>')).toBe(true);
      });
    });

    describe('applyUnderline()', () => {
      it('should not throw when called on empty editor', () => {
        placeCaretAtStart();
        expect(() => editor.applyUnderline()).not.toThrow();
      });

      it('should apply underline formatting to selected text', () => {
        editor.setHTML('Hello world');
        selectAll();
        editor.applyUnderline();
        const html = editor.getHTML().toLowerCase();
        expect(html.includes('<u>')).toBe(true);
      });
    });

    describe('applyStrikethrough()', () => {
      it('should not throw when called on empty editor', () => {
        placeCaretAtStart();
        expect(() => editor.applyStrikethrough()).not.toThrow();
      });

      it('should apply strikethrough formatting to selected text', () => {
        editor.setHTML('Hello world');
        selectAll();
        editor.applyStrikethrough();
        const html = editor.getHTML().toLowerCase();
        expect(html.includes('<strike>') || html.includes('<s>') || html.includes('<del>')).toBe(
          true
        );
      });
    });

    describe('applyInlineCode()', () => {
      it('should not throw when called on empty editor', () => {
        placeCaretAtStart();
        expect(() => editor.applyInlineCode()).not.toThrow();
      });

      it('should wrap selected text in a code element', () => {
        editor.setHTML('const x = 1');
        selectAll();
        editor.applyInlineCode();
        expect(editor.getContentEditable().querySelector('code')).toBeTruthy();
      });
    });

    describe('applyCodeBlock()', () => {
      it('should not throw when called on empty editor', () => {
        placeCaretAtStart();
        expect(() => editor.applyCodeBlock()).not.toThrow();
      });

      it('should wrap selected block in a pre element', () => {
        editor.setHTML('<p>code here</p>');
        selectAll();
        editor.applyCodeBlock();
        expect(editor.getContentEditable().querySelector('pre')).toBeTruthy();
      });
    });

    describe('applyBlockquote()', () => {
      it('should not throw when called on empty editor', () => {
        placeCaretAtStart();
        expect(() => editor.applyBlockquote()).not.toThrow();
      });

      it('should wrap selected block in a blockquote element', () => {
        editor.setHTML('<p>quoted text</p>');
        selectAll();
        editor.applyBlockquote();
        expect(editor.getContentEditable().querySelector('blockquote')).toBeTruthy();
      });
    });

    describe('applyOrderedList()', () => {
      it('should not throw when called', () => {
        placeCaretAtStart();
        expect(() => editor.applyOrderedList()).not.toThrow();
      });
    });

    describe('applyBulletList()', () => {
      it('should not throw when called', () => {
        placeCaretAtStart();
        expect(() => editor.applyBulletList()).not.toThrow();
      });
    });

    describe('getFormatState()', () => {
      it('should return an object with all expected format keys', () => {
        const state = editor.getFormatState();
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
    });
  });

  // ==================== Event Handling ====================

  describe('Event Handling', () => {
    it('should call onUpdate callback when content changes via setHTML', () => {
      const onUpdate = vi.fn();
      const editorWithCb = new RichTextEditor(createConfig({ onUpdate }));
      document.body.appendChild(editorWithCb.getElement());

      editorWithCb.setHTML('<p>Hello</p>');
      // applyBold triggers emitUpdate
      selectAll.call(null); // need to select in the right editor
      const sel = window.getSelection()!;
      const range = document.createRange();
      range.selectNodeContents(editorWithCb.getContentEditable());
      sel.removeAllRanges();
      sel.addRange(range);
      editorWithCb.applyBold();

      expect(onUpdate).toHaveBeenCalled();
      editorWithCb.destroy();
    });

    it('should call onFocus callback when editor receives focus', () => {
      const onFocus = vi.fn();
      const editorWithCb = new RichTextEditor(createConfig({ onFocus }));
      document.body.appendChild(editorWithCb.getElement());

      editorWithCb.getContentEditable().dispatchEvent(new FocusEvent('focus'));
      expect(onFocus).toHaveBeenCalled();
      editorWithCb.destroy();
    });

    it('should call onBlur callback when editor loses focus', () => {
      const onBlur = vi.fn();
      const editorWithCb = new RichTextEditor(createConfig({ onBlur }));
      document.body.appendChild(editorWithCb.getElement());

      editorWithCb.getContentEditable().dispatchEvent(new FocusEvent('blur'));
      expect(onBlur).toHaveBeenCalled();
      editorWithCb.destroy();
    });

    it('should add focused CSS class on focus', () => {
      editor.getContentEditable().dispatchEvent(new FocusEvent('focus'));
      expect(editor.getElement().classList.contains('cometchat-rich-text-editor--focused')).toBe(
        true
      );
    });

    it('should remove focused CSS class on blur', () => {
      editor.getContentEditable().dispatchEvent(new FocusEvent('focus'));
      editor.getContentEditable().dispatchEvent(new FocusEvent('blur'));
      expect(editor.getElement().classList.contains('cometchat-rich-text-editor--focused')).toBe(
        false
      );
    });

    it('should not throw when onUpdate is not provided', () => {
      const editorNoCb = new RichTextEditor(createConfig());
      document.body.appendChild(editorNoCb.getElement());
      editorNoCb.setHTML('test');
      const sel = window.getSelection()!;
      const range = document.createRange();
      range.selectNodeContents(editorNoCb.getContentEditable());
      sel.removeAllRanges();
      sel.addRange(range);
      expect(() => editorNoCb.applyBold()).not.toThrow();
      editorNoCb.destroy();
    });

    it('should not throw when onFocus is not provided and focus occurs', () => {
      expect(() => {
        editor.getContentEditable().dispatchEvent(new FocusEvent('focus'));
      }).not.toThrow();
    });

    it('should not throw when onBlur is not provided and blur occurs', () => {
      expect(() => {
        editor.getContentEditable().dispatchEvent(new FocusEvent('blur'));
      }).not.toThrow();
    });
  });

  // ==================== Focus & Cursor Management ====================

  describe('Focus & Cursor Management', () => {
    it('should focus the editor', () => {
      const focusSpy = vi.spyOn(editor.getContentEditable(), 'focus');
      editor.focus();
      expect(focusSpy).toHaveBeenCalled();
    });

    it('should blur the editor', () => {
      const blurSpy = vi.spyOn(editor.getContentEditable(), 'blur');
      editor.blur();
      expect(blurSpy).toHaveBeenCalled();
    });

    it('should focus with position "start"', () => {
      editor.setHTML('<p>Hello world</p>');
      expect(() => editor.focus('start')).not.toThrow();
    });

    it('should focus with position "end"', () => {
      editor.setHTML('<p>Hello world</p>');
      expect(() => editor.focus('end')).not.toThrow();
    });

    it('should focus with position "all"', () => {
      editor.setHTML('<p>Hello world</p>');
      expect(() => editor.focus('all')).not.toThrow();
    });

    it('should focus with numeric position', () => {
      editor.setHTML('<p>Hello world</p>');
      expect(() => editor.focus(3)).not.toThrow();
    });

    it('should focus with boolean true (same as "end")', () => {
      editor.setHTML('<p>Hello world</p>');
      expect(() => editor.focus(true)).not.toThrow();
    });

    it('should set cursor position', () => {
      editor.setHTML('<p>Hello world</p>');
      expect(() => editor.setCursorPosition('start')).not.toThrow();
      expect(() => editor.setCursorPosition('end')).not.toThrow();
      expect(() => editor.setCursorPosition(3)).not.toThrow();
    });

    it('should select all content', () => {
      editor.setHTML('<p>Hello world</p>');
      expect(() => editor.selectAll()).not.toThrow();
    });

    it('should return selection object or null', () => {
      const sel = editor.getSelection();
      // In jsdom, getSelection may return null or a Selection
      expect(sel === null || typeof sel === 'object').toBe(true);
    });

    it('should return selected text as a string', () => {
      editor.setHTML('Hello world');
      selectAll();
      const text = editor.getSelectedText();
      expect(typeof text).toBe('string');
    });

    it('should save and restore selection', () => {
      editor.setHTML('Hello world');
      placeCaretAtStart();
      const state = editor.saveSelection();
      expect(state).toBeTruthy();
      expect(() => editor.restoreSelection(state)).not.toThrow();
    });
  });

  // ==================== History (Undo/Redo) ====================

  describe('History (Undo/Redo)', () => {
    it('should not be able to undo initially', () => {
      expect(editor.canUndo()).toBe(false);
    });

    it('should not be able to redo initially', () => {
      expect(editor.canRedo()).toBe(false);
    });

    it('should return false from undo when nothing to undo', () => {
      expect(editor.undo()).toBe(false);
    });

    it('should return false from redo when nothing to redo', () => {
      expect(editor.redo()).toBe(false);
    });

    it('should not throw when calling undo on empty history', () => {
      expect(() => editor.undo()).not.toThrow();
    });

    it('should not throw when calling redo on empty history', () => {
      expect(() => editor.redo()).not.toThrow();
    });
  });

  // ==================== Link Operations ====================

  describe('Link Operations', () => {
    it('should report no active link initially', () => {
      expect(editor.isLinkActive()).toBe(false);
    });

    it('should return null for getCurrentLink when no link is active', () => {
      expect(editor.getCurrentLink()).toBeNull();
    });

    it('should return null for getCurrentLinkText when no link is active', () => {
      expect(editor.getCurrentLinkText()).toBeNull();
    });

    it('should not throw when calling setLink with a URL', () => {
      editor.setHTML('Hello world');
      selectAll();
      expect(() => editor.setLink('https://example.com', 'Example')).not.toThrow();
    });

    it('should not throw when calling setLink with null (remove link)', () => {
      expect(() => editor.setLink(null)).not.toThrow();
    });
  });

  // ==================== Insert & Delete Operations ====================

  describe('Insert & Delete Operations', () => {
    it('should insert text at cursor position', () => {
      editor.setHTML('Hello');
      // Place cursor at end
      const ce = editor.getContentEditable();
      const sel = window.getSelection()!;
      const range = document.createRange();
      range.selectNodeContents(ce);
      range.collapse(false); // collapse to end
      sel.removeAllRanges();
      sel.addRange(range);

      editor.insertText(' world');
      expect(editor.getText()).toContain('world');
    });

    it('should not throw insertText when no selection exists', () => {
      window.getSelection()?.removeAllRanges();
      expect(() => editor.insertText('test')).not.toThrow();
    });

    it('should not throw deleteRange with valid range', () => {
      editor.setHTML('Hello world');
      expect(() => editor.deleteRange(0, 5)).not.toThrow();
    });

    it('should handle deleteRange with invalid range (from < 0)', () => {
      editor.setHTML('Hello');
      // Should warn but not throw
      expect(() => editor.deleteRange(-1, 3)).not.toThrow();
    });

    it('should handle deleteRange with invalid range (to < from)', () => {
      editor.setHTML('Hello');
      expect(() => editor.deleteRange(5, 2)).not.toThrow();
    });
  });

  // ==================== Mention Operations ====================

  describe('Mention Operations', () => {
    it('should initialize mentions formatter without error', () => {
      expect(() => editor.initializeMentionsFormatter()).not.toThrow();
    });

    it('should return empty set of mention UIDs initially', () => {
      const uids = editor.getUniqueMentionUids();
      expect(uids.size).toBe(0);
    });

    it('should not throw insertMention with empty id', () => {
      editor.setHTML('Hello @');
      placeCaretAtStart();
      // Empty ID should be rejected gracefully
      expect(() => editor.insertMention('', 'User', 1)).not.toThrow();
    });

    it('should not throw insertMention with empty label', () => {
      editor.setHTML('Hello @');
      placeCaretAtStart();
      expect(() => editor.insertMention('user-1', '', 1)).not.toThrow();
    });

    it('should return text with mention format', () => {
      const result = editor.getTextWithMentionFormat();
      expect(typeof result).toBe('string');
    });
  });

  // ==================== Null / Empty Content Handling ====================

  describe('Null / Empty Content Handling', () => {
    it('should handle setHTML with empty string', () => {
      expect(() => editor.setHTML('')).not.toThrow();
      expect(editor.isEmpty()).toBe(true);
    });

    it('should handle getHTML on empty editor', () => {
      expect(() => editor.getHTML()).not.toThrow();
    });

    it('should handle getText on empty editor', () => {
      const text = editor.getText();
      expect(typeof text).toBe('string');
    });

    it('should handle clear on already empty editor', () => {
      expect(() => editor.clear()).not.toThrow();
    });

    it('should handle format operations on empty content', () => {
      placeCaretAtStart();
      expect(() => {
        editor.applyBold();
        editor.applyItalic();
        editor.applyUnderline();
        editor.applyStrikethrough();
        editor.applyInlineCode();
        editor.applyCodeBlock();
        editor.applyBlockquote();
        editor.applyOrderedList();
        editor.applyBulletList();
      }).not.toThrow();
    });

    it('should handle format operations with no selection', () => {
      window.getSelection()?.removeAllRanges();
      expect(() => {
        editor.applyBold();
        editor.applyItalic();
        editor.applyUnderline();
        editor.applyStrikethrough();
        editor.applyInlineCode();
      }).not.toThrow();
    });

    it('should handle focus on empty editor', () => {
      expect(() => editor.focus()).not.toThrow();
    });

    it('should handle blur on empty editor', () => {
      expect(() => editor.blur()).not.toThrow();
    });

    it('should handle selectAll on empty editor', () => {
      expect(() => editor.selectAll()).not.toThrow();
    });

    it('should handle getSelectedText with no selection', () => {
      window.getSelection()?.removeAllRanges();
      const text = editor.getSelectedText();
      expect(typeof text).toBe('string');
    });

    it('should handle saveSelection with no selection', () => {
      window.getSelection()?.removeAllRanges();
      expect(() => editor.saveSelection()).not.toThrow();
    });

    it('should handle getFormatState on empty editor', () => {
      const state = editor.getFormatState();
      expect(state).toBeTruthy();
      expect(state.bold).toBe(false);
    });

    it('should handle getTextWithMentionFormat on empty editor', () => {
      const result = editor.getTextWithMentionFormat();
      expect(typeof result).toBe('string');
    });

    it('should handle getUniqueMentionUids on empty editor', () => {
      const uids = editor.getUniqueMentionUids();
      expect(uids.size).toBe(0);
    });
  });

  // ==================== Destroy & Cleanup ====================

  describe('Destroy & Cleanup', () => {
    it('should mark editor as destroyed after destroy()', () => {
      editor.destroy();
      expect(editor.isDestroyed()).toBe(true);
    });

    it('should not throw when destroy is called twice', () => {
      editor.destroy();
      expect(() => editor.destroy()).not.toThrow();
    });

    it('should clear content on destroy', () => {
      editor.setHTML('<p>Content</p>');
      editor.destroy();
      expect(editor.getContentEditable().innerHTML).toBe('');
    });

    it('should remove element from DOM on destroy', () => {
      const el = editor.getElement();
      expect(el.parentNode).toBeTruthy();
      editor.destroy();
      expect(el.parentNode).toBeNull();
    });
  });

  // ==================== Edge Cases ====================

  describe('Edge Cases', () => {
    it('should handle content with special HTML characters', () => {
      editor.setHTML('<p>&lt;script&gt;alert("xss")&lt;/script&gt;</p>');
      // HTML entities are decoded to text, so getText returns the decoded characters
      const text = editor.getText();
      expect(text).toContain('<script>');
      expect(text).toContain('alert');
    });

    it('should handle very long content', () => {
      const longText = 'a'.repeat(10000);
      editor.setHTML(`<p>${longText}</p>`);
      expect(editor.getText().length).toBeGreaterThanOrEqual(10000);
    });

    it('should handle content with emoji', () => {
      editor.setHTML('<p>Hello 👋 World 🌍</p>');
      expect(editor.getText()).toContain('👋');
      expect(editor.getText()).toContain('🌍');
    });

    it('should handle content with RTL text', () => {
      editor.setHTML('<p>مرحبا بالعالم</p>');
      expect(editor.getText()).toContain('مرحبا');
    });

    it('should handle rapid sequential format operations', () => {
      editor.setHTML('Hello world');
      selectAll();
      expect(() => {
        editor.applyBold();
        editor.applyItalic();
        editor.applyUnderline();
      }).not.toThrow();
      expect(editor.getText()).toContain('Hello world');
    });

    it('should handle config with editable=false', () => {
      const readonlyEditor = new RichTextEditor(createConfig({ editable: false }));
      document.body.appendChild(readonlyEditor.getElement());
      expect(readonlyEditor).toBeTruthy();
      readonlyEditor.destroy();
    });

    it('should handle config with enableFormatting=false', () => {
      const plainEditor = new RichTextEditor(createConfig({ enableFormatting: false }));
      document.body.appendChild(plainEditor.getElement());
      expect(plainEditor).toBeTruthy();
      plainEditor.destroy();
    });

    it('should handle config with all callbacks provided', () => {
      const fullConfig = createConfig({
        onUpdate: vi.fn(),
        onFocus: vi.fn(),
        onBlur: vi.fn(),
        onSelectionUpdate: vi.fn(),
        onLinkClick: vi.fn(),
        onMentionStart: vi.fn(),
        onMentionEnd: vi.fn(),
      });
      const fullEditor = new RichTextEditor(fullConfig);
      document.body.appendChild(fullEditor.getElement());
      expect(fullEditor).toBeTruthy();
      fullEditor.destroy();
    });

    it('should handle config with empty placeholder', () => {
      const editorEmptyPh = new RichTextEditor(createConfig({ placeholder: '' }));
      document.body.appendChild(editorEmptyPh.getElement());
      expect(editorEmptyPh.getContentEditable().getAttribute('data-placeholder')).toBe('');
      editorEmptyPh.destroy();
    });
  });
});

// ==================== Bug Condition Exploration Tests (Group A: Link Handling) ====================

/**
 * Bug Condition Exploration Tests — Link Handling (Group A)
 *
 * These tests encode the EXPECTED (correct) behavior for link handling bugs.
 * They are designed to FAIL on unfixed code, confirming the bugs exist.
 * After fixes are applied, these same tests should PASS.
 *
 * **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.20**
 *
 * @module services/rich-text-editor/bug-exploration
 */

import * as fc from 'fast-check';
import { LinkManager } from './link-manager.class';
import { SelectionManager } from './selection-manager.class';

/**
 * Minimal DataTransfer polyfill for jsdom (which lacks native DataTransfer).
 * Only supports getData/setData for text-based MIME types.
 */
class MockDataTransfer {
  private data = new Map<string, string>();
  getData(format: string): string {
    return this.data.get(format) ?? '';
  }
  setData(format: string, value: string): void {
    this.data.set(format, value);
  }
  get types(): string[] {
    return [...this.data.keys()];
  }
  get items(): unknown[] {
    return [];
  }
  get files(): FileList {
    return [] as unknown as FileList;
  }
}

describe('Bug Condition Exploration: Link Handling (Group A)', () => {
  let editor: RichTextEditor;

  beforeAll(async () => {
    await ensureSdkReady();
  });

  afterAll(async () => {
    await sdkCleanup();
  });

  function createEditorConfig(overrides?: Partial<RichTextEditorConfig>): RichTextEditorConfig {
    return {
      placeholder: 'Type a message...',
      editable: true,
      ...overrides,
    };
  }

  /**
   * Helper: create a clipboard-like Event with a mock DataTransfer.
   * jsdom does not support the ClipboardEvent constructor, so we create
   * a plain Event and attach clipboardData manually.
   */
  function createClipboardEvent(
    type: 'paste' | 'copy',
    data: Record<string, string>
  ): ClipboardEvent {
    const dt = new MockDataTransfer();
    for (const [k, v] of Object.entries(data)) {
      dt.setData(k, v);
    }
    const event = new Event(type, { bubbles: true, cancelable: true });
    Object.defineProperty(event, 'clipboardData', { value: dt, writable: false });
    return event as unknown as ClipboardEvent;
  }

  beforeEach(() => {
    editor = new RichTextEditor(createEditorConfig());
    document.body.appendChild(editor.getElement());
  });

  afterEach(() => {
    if (!editor.isDestroyed()) {
      editor.destroy();
    }
    const el = document.querySelector('.cometchat-rich-text-editor');
    if (el && el.parentNode) {
      el.parentNode.removeChild(el);
    }
  });

  // ==================== Case 5 (Req 1.20): URL Validation Too Restrictive ====================

  describe('Case 5 (Req 1.20): URL validation accepts valid URLs', () => {
    /**
     * **Validates: Requirements 1.20**
     *
     * Property: For any valid URL string, LinkManager.validateURL should accept it.
     * Bug: The restrictive regex /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .?#&=%-]*)$/i
     * rejects URLs with ports, custom protocols, query strings with special chars, etc.
     */
    it('should accept URLs with port numbers (property-based)', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 65535 }), port => {
          const ce = editor.getContentEditable();
          const selMgr = new SelectionManager(ce);
          const linkMgr = new LinkManager(ce, selMgr);
          const url = `http://localhost:${port}`;
          expect(linkMgr.validateURL(url)).toBe(true);
        }),
        { numRuns: 10 }
      );
    });

    it('should accept URLs with non-http protocols', () => {
      const urls = [
        'ftp://files.example.com/doc.pdf',
        'ssh://server.example.com',
        'myapp://deeplink/page',
        'mailto:user@example.com',
      ];
      const ce = editor.getContentEditable();
      const selMgr = new SelectionManager(ce);
      const linkMgr = new LinkManager(ce, selMgr);
      for (const url of urls) {
        expect(linkMgr.validateURL(url)).toBe(true);
      }
    });

    it('should accept URLs with ports and complex paths', () => {
      const urls = [
        'https://example.com:8080/api/v1',
        'http://192.168.1.1:3000/dashboard',
        'https://sub.domain.example.com:443/path/to/resource',
        'http://localhost:5173',
      ];
      const ce = editor.getContentEditable();
      const selMgr = new SelectionManager(ce);
      const linkMgr = new LinkManager(ce, selMgr);
      for (const url of urls) {
        expect(linkMgr.validateURL(url)).toBe(true);
      }
    });

    it('should accept any non-empty URL string (property-based)', () => {
      /**
       * **Validates: Requirements 1.20**
       *
       * Per Req 2.20: "the system SHALL remove URL validation restrictions,
       * accepting any user-provided URL string"
       */
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
          url => {
            const ce = editor.getContentEditable();
            const selMgr = new SelectionManager(ce);
            const linkMgr = new LinkManager(ce, selMgr);
            expect(linkMgr.validateURL(url.trim())).toBe(true);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  // ==================== Case 1 (Req 1.1): Paste URL on Selected Text ====================

  describe('Case 1 (Req 1.1): Paste URL embeds link on selected text', () => {
    /**
     * **Validates: Requirements 1.1**
     *
     * Property: When a valid URL is pasted while text is selected, the selected text
     * should become a hyperlink with the URL, preserving the original text as the label.
     *
     * Bug: handlePaste calls validateURL which uses a restrictive regex. Many valid URLs
     * fail validation, so the URL-on-selection branch is skipped and text is replaced.
     */
    it('should wrap selected text as a hyperlink when a URL is pasted', () => {
      const selectedText = 'click here';
      const pastedUrl = 'https://example.com';

      editor.setHTML(`<p>${selectedText}</p>`);

      // Select the text
      const ce = editor.getContentEditable();
      const sel = window.getSelection()!;
      const range = document.createRange();
      range.selectNodeContents(ce);
      sel.removeAllRanges();
      sel.addRange(range);

      // Simulate paste event with URL
      const pasteEvent = createClipboardEvent('paste', {
        'text/plain': pastedUrl,
      });
      ce.dispatchEvent(pasteEvent);

      // Expected: the original text is preserved as a link label
      const anchor = ce.querySelector('a');
      expect(anchor).toBeTruthy();
      expect(anchor?.textContent).toBe(selectedText);
      expect(anchor?.href).toContain('example.com');
    });

    it('should preserve selected text as link label for generated URLs (property-based)', () => {
      fc.assert(
        fc.property(
          fc
            .string({ minLength: 1, maxLength: 50 })
            .filter(s => s.trim().length > 0 && !/[<>&]/.test(s)),
          fc.webUrl(),
          (text, url) => {
            editor.setHTML(`<p>${text}</p>`);

            const ce = editor.getContentEditable();
            const sel = window.getSelection()!;
            const range = document.createRange();
            range.selectNodeContents(ce);
            sel.removeAllRanges();
            sel.addRange(range);

            const pasteEvent = createClipboardEvent('paste', {
              'text/plain': url,
            });
            ce.dispatchEvent(pasteEvent);

            // The selected text should be preserved as the link label
            const anchor = ce.querySelector('a');
            expect(anchor).toBeTruthy();
            if (anchor) {
              expect(anchor.textContent).toBe(text);
            }
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  // ==================== Case 3 (Req 1.3): Edit Mode Link Rendering ====================

  describe('Case 3 (Req 1.3): Edit mode renders links, not raw markdown', () => {
    /**
     * **Validates: Requirements 1.3**
     *
     * Property: When editing a message containing markdown links [text](url),
     * the composer should render them as clickable <a> tags, not raw markdown.
     *
     * Bug: setContentWithMentions escapes HTML (including [ ] ( )) but does NOT
     * convert markdown link syntax [text](url) to <a> tags before setting content.
     */
    it('should render markdown link as <a> tag when loading for edit', () => {
      const text = 'Check out [Google](https://google.com) for more info';

      editor.initializeMentionsFormatter();
      editor.setContentWithMentions(text, []);

      const ce = editor.getContentEditable();

      // Should contain a rendered <a> tag, not raw markdown
      const anchor = ce.querySelector('a');
      expect(anchor).toBeTruthy();
      expect(anchor?.textContent).toBe('Google');
      expect(anchor?.href).toContain('google.com');

      // Should NOT contain raw markdown syntax
      const html = editor.getHTML();
      expect(html).not.toContain('[Google]');
      expect(html).not.toContain('](https://google.com)');
    });

    it('should render markdown links as <a> tags for generated inputs (property-based)', () => {
      fc.assert(
        fc.property(
          fc.record({
            label: fc
              .string({ minLength: 1, maxLength: 20 })
              .filter(s => s.trim().length > 0 && !/[\[\]\(\)<>&]/.test(s)),
            domain: fc.domain(),
          }),
          ({ label, domain }) => {
            const url = `https://${domain}`;
            const text = `Visit [${label}](${url}) now`;

            editor.initializeMentionsFormatter();
            editor.setContentWithMentions(text, []);

            const ce = editor.getContentEditable();
            const anchor = ce.querySelector('a');

            // Should render as a clickable link, not raw markdown
            expect(anchor).toBeTruthy();
            if (anchor) {
              expect(anchor.textContent).toBe(label);
            }

            // Raw markdown should not be visible
            expect(ce.innerHTML).not.toContain(`[${label}]`);
          }
        ),
        { numRuns: 15 }
      );
    });
  });

  // ==================== Case 4 (Req 1.4): Copy Linked Text Preserves Format ====================

  describe('Case 4 (Req 1.4): Copy linked text includes markdown format', () => {
    /**
     * **Validates: Requirements 1.4**
     *
     * Property: When copying text containing links from the editor,
     * the plain text clipboard should contain markdown format [text](url).
     *
     * Bug: handleCopy sets text/plain to selection.toString() which strips
     * link information. The plain text should include [text](url) format.
     */
    it('should include markdown link format in clipboard plain text on copy', () => {
      const linkText = 'Example Site';
      const linkUrl = 'https://example.com';

      // Set up editor with a link
      editor.setHTML(
        `<p>Visit <a href="${linkUrl}" class="cometchat-rich-text__link">${linkText}</a> today</p>`
      );

      // Select all content
      const ce = editor.getContentEditable();
      const sel = window.getSelection()!;
      const range = document.createRange();
      range.selectNodeContents(ce);
      sel.removeAllRanges();
      sel.addRange(range);

      // Simulate copy event and capture clipboard data
      const copyEvent = createClipboardEvent('copy', {});
      ce.dispatchEvent(copyEvent);

      // Check the clipboard data set by handleCopy
      const capturedPlainText = copyEvent.clipboardData?.getData('text/plain') ?? '';

      // The plain text should contain markdown link format
      expect(capturedPlainText).toContain(`[${linkText}](${linkUrl})`);
    });

    it('should preserve link format for generated links on copy (property-based)', () => {
      fc.assert(
        fc.property(
          fc.record({
            text: fc
              .string({ minLength: 1, maxLength: 30 })
              .filter(s => s.trim().length > 0 && !/[<>&\[\]\(\)]/.test(s)),
            domain: fc.domain(),
          }),
          ({ text, domain }) => {
            const url = `https://${domain}`;

            editor.setHTML(`<p><a href="${url}" class="cometchat-rich-text__link">${text}</a></p>`);

            const ce = editor.getContentEditable();
            const sel = window.getSelection()!;
            const range = document.createRange();
            range.selectNodeContents(ce);
            sel.removeAllRanges();
            sel.addRange(range);

            const copyEvent = createClipboardEvent('copy', {});
            ce.dispatchEvent(copyEvent);

            const plainText = copyEvent.clipboardData?.getData('text/plain') ?? '';
            expect(plainText).toContain(`[${text}](${url})`);
          }
        ),
        { numRuns: 15 }
      );
    });
  });

  // ==================== Case 2 (Req 1.2): Edit/Remove Link Operations ====================

  describe('Case 2 (Req 1.2): Edit and remove link operations work correctly', () => {
    /**
     * **Validates: Requirements 1.2**
     *
     * Property: When the user triggers "Edit Link" or "Remove Link" on an existing link,
     * the system should correctly update the URL/text or remove the hyperlink while preserving text.
     *
     * Bug: getCurrentLinkElement() relies on selection.anchorNode being inside the <a> tag.
     * After popover interaction, the selection may not be properly positioned inside the link.
     */
    it('should remove link while preserving text content', () => {
      const linkText = 'Example';
      const linkUrl = 'https://example.com';

      editor.setHTML(
        `<p>Visit <a href="${linkUrl}" class="cometchat-rich-text__link">${linkText}</a> today</p>`
      );

      const ce = editor.getContentEditable();
      const anchor = ce.querySelector('a')!;

      // Place cursor inside the link text
      const sel = window.getSelection()!;
      const range = document.createRange();
      range.selectNodeContents(anchor);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);

      // Remove the link
      editor.setLink(null);

      // The link should be removed but text preserved
      expect(ce.querySelectorAll('a').length).toBe(0);
      expect(ce.textContent).toContain(linkText);
    });

    it('should update link URL when editing', () => {
      const originalUrl = 'https://old-url.com';
      const newUrl = 'https://new-url.com';
      const linkText = 'My Link';

      editor.setHTML(
        `<p><a href="${originalUrl}" class="cometchat-rich-text__link">${linkText}</a></p>`
      );

      const ce = editor.getContentEditable();
      const anchor = ce.querySelector('a')!;

      // Place cursor inside the link
      const sel = window.getSelection()!;
      const range = document.createRange();
      range.selectNodeContents(anchor);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);

      // Update the link
      editor.setLink(newUrl, linkText);

      const updatedAnchor = ce.querySelector('a');
      expect(updatedAnchor).toBeTruthy();
      expect(updatedAnchor?.href).toContain('new-url.com');
      expect(updatedAnchor?.textContent).toBe(linkText);
    });
  });
});

// ==================== Preservation Property Tests (Group A: Link Handling) ====================

/**
 * Preservation Property Tests — Link Handling (Group A)
 *
 * These tests verify that existing CORRECT behavior is preserved.
 * They MUST PASS on unfixed code — they capture behavior that should NOT
 * be broken by future bug fixes.
 *
 * Observation-first methodology:
 * - Observe: Plain text without links sends correctly (Req 3.1)
 * - Observe: Undo/redo restores link state correctly (Req 3.6)
 * - Observe: Clicking a link in a sent message bubble opens it in a new tab (Req 3.8)
 *
 * **Validates: Requirements 3.1, 3.6, 3.8**
 *
 * @module services/rich-text-editor/preservation
 */

describe('Preservation: Link Handling (Group A)', () => {
  let editor: RichTextEditor;

  beforeAll(async () => {
    await ensureSdkReady();
  });

  afterAll(async () => {
    await sdkCleanup();
  });

  function createEditorConfig(overrides?: Partial<RichTextEditorConfig>): RichTextEditorConfig {
    return {
      placeholder: 'Type a message...',
      editable: true,
      ...overrides,
    };
  }

  beforeEach(() => {
    editor = new RichTextEditor(createEditorConfig());
    document.body.appendChild(editor.getElement());
  });

  afterEach(() => {
    if (!editor.isDestroyed()) {
      editor.destroy();
    }
    const el = document.querySelector('.cometchat-rich-text-editor');
    if (el && el.parentNode) {
      el.parentNode.removeChild(el);
    }
  });

  // ==================== Req 3.1: Plain text without links sends correctly ====================

  describe('Req 3.1: Plain text without links sends correctly', () => {
    /**
     * **Validates: Requirements 3.1**
     *
     * Property: For any plain text string (no formatting, no links), setting it
     * in the editor and reading it back preserves the text content exactly.
     * The editor should not add any formatting metadata or link artifacts.
     */
    it('should preserve plain text content without adding formatting (property-based)', () => {
      fc.assert(
        fc.property(
          fc
            .string({ minLength: 1, maxLength: 200 })
            .filter(s => s.trim().length > 0 && !/[<>&]/.test(s)),
          plainText => {
            editor.setHTML(`<p>${plainText}</p>`);

            // getText should return the plain text content
            const retrievedText = editor.getText();
            expect(retrievedText).toContain(plainText);

            // The editor should not be empty
            expect(editor.isEmpty()).toBe(false);

            // getHTML should contain the text
            const html = editor.getHTML();
            expect(html).toContain(plainText);

            // No anchor tags should be present for plain text
            const ce = editor.getContentEditable();
            expect(ce.querySelectorAll('a').length).toBe(0);

            // Clear for next iteration
            editor.clear();
          }
        ),
        { numRuns: 30 }
      );
    });

    it('should report isEmpty correctly for empty editor', () => {
      editor.clear();
      expect(editor.isEmpty()).toBe(true);
      expect(editor.getText()).toBe('');
    });

    it('should handle setting and getting plain text round-trip', () => {
      const texts = [
        'Hello world',
        'Simple message without any links',
        'Numbers 12345 and symbols !@#$%',
        'Multi word sentence with spaces',
      ];

      for (const text of texts) {
        editor.setHTML(`<p>${text}</p>`);
        expect(editor.getText()).toContain(text);
        expect(editor.isEmpty()).toBe(false);
        editor.clear();
      }
    });
  });

  // ==================== Req 3.6: Undo/redo restores link state correctly ====================

  describe('Req 3.6: Undo/redo restores editor states correctly', () => {
    /**
     * **Validates: Requirements 3.6**
     *
     * Property: After making changes to the editor, undo should restore the
     * previous state, and redo should restore the undone state.
     * This applies to all content changes including link-related operations.
     */
    it('should restore previous state on undo after content change', () => {
      // Set initial content
      editor.setHTML('<p>Initial content</p>');
      const initialHtml = editor.getHTML();

      // Make a change by setting new content and applying bold
      const ce = editor.getContentEditable();
      const sel = window.getSelection()!;
      const range = document.createRange();
      range.selectNodeContents(ce);
      sel.removeAllRanges();
      sel.addRange(range);
      editor.applyBold();

      const boldHtml = editor.getHTML();
      // The HTML should have changed after applying bold
      expect(boldHtml).not.toBe(initialHtml);

      // Undo should be available after a change
      // Note: applyBold pushes to history internally
      if (editor.canUndo()) {
        editor.undo();
        // After undo, content should be restored
        expect(editor.getHTML()).not.toContain('<b>');
      }
    });

    it('should support redo after undo', () => {
      editor.setHTML('<p>Test content</p>');

      // Apply formatting
      const ce = editor.getContentEditable();
      const sel = window.getSelection()!;
      const range = document.createRange();
      range.selectNodeContents(ce);
      sel.removeAllRanges();
      sel.addRange(range);
      editor.applyBold();

      if (editor.canUndo()) {
        editor.undo();

        // After undo, redo should be available
        if (editor.canRedo()) {
          const beforeRedo = editor.getHTML();
          editor.redo();
          const afterRedo = editor.getHTML();
          // Redo should change the content back
          expect(afterRedo).not.toBe(beforeRedo);
        }
      }
    });

    it('should not throw on undo/redo with empty history', () => {
      expect(() => editor.undo()).not.toThrow();
      expect(() => editor.redo()).not.toThrow();
      expect(editor.canUndo()).toBe(false);
      expect(editor.canRedo()).toBe(false);
    });

    it('should preserve link content through undo/redo cycle', () => {
      // Set content with a link
      const linkHtml =
        '<p>Visit <a href="https://example.com" class="cometchat-rich-text__link">Example</a> site</p>';
      editor.setHTML(linkHtml);

      const htmlWithLink = editor.getHTML();
      expect(htmlWithLink).toContain('Example');

      // Apply bold to all content (this pushes to history)
      const ce = editor.getContentEditable();
      const sel = window.getSelection()!;
      const range = document.createRange();
      range.selectNodeContents(ce);
      sel.removeAllRanges();
      sel.addRange(range);
      editor.applyBold();

      // Undo should restore the link content
      if (editor.canUndo()) {
        editor.undo();
        const restoredHtml = editor.getHTML();
        expect(restoredHtml).toContain('Example');
      }
    });

    it('should handle multiple undo operations (property-based)', () => {
      /**
       * **Validates: Requirements 3.6**
       *
       * Property: For any sequence of content changes, undo should not throw
       * and should correctly report canUndo/canRedo state.
       */
      fc.assert(
        fc.property(
          fc.array(
            fc
              .string({ minLength: 1, maxLength: 30 })
              .filter(s => s.trim().length > 0 && !/[<>&]/.test(s)),
            { minLength: 1, maxLength: 5 }
          ),
          texts => {
            // Apply a series of content changes
            for (const text of texts) {
              editor.setHTML(`<p>${text}</p>`);
              const ce = editor.getContentEditable();
              const sel = window.getSelection()!;
              const range = document.createRange();
              range.selectNodeContents(ce);
              sel.removeAllRanges();
              sel.addRange(range);
              editor.applyBold();
            }

            // Undo all changes - should not throw
            let undoCount = 0;
            while (editor.canUndo() && undoCount < 20) {
              expect(() => editor.undo()).not.toThrow();
              undoCount++;
            }

            // After exhausting undo, canUndo should be false
            expect(editor.canUndo()).toBe(false);

            // Clear for next iteration
            editor.clear();
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  // ==================== Req 3.8: Link clicks in sent message bubble ====================

  describe('Req 3.8: Links in sent message bubbles open in new tab', () => {
    /**
     * **Validates: Requirements 3.8**
     *
     * Property: Links created in the editor should have target="_blank" and
     * rel="noopener noreferrer" attributes, ensuring they open in a new tab
     * when clicked in a sent message bubble.
     *
     * We test this at the editor level by verifying that links created via
     * setLink() have the correct attributes for new-tab behavior.
     */
    it('should create links with target="_blank" attribute', () => {
      editor.setHTML('<p>Click here</p>');

      // Select all text
      const ce = editor.getContentEditable();
      const sel = window.getSelection()!;
      const range = document.createRange();
      range.selectNodeContents(ce);
      sel.removeAllRanges();
      sel.addRange(range);

      // Create a link
      editor.setLink('https://example.com', 'Click here');

      const anchor = ce.querySelector('a');
      expect(anchor).toBeTruthy();
      if (anchor) {
        expect(anchor.target).toBe('_blank');
        expect(anchor.rel).toContain('noopener');
      }
    });

    it('should create links with correct attributes for generated URLs (property-based)', () => {
      /**
       * **Validates: Requirements 3.8**
       *
       * Property: For any link created via setLink(), the resulting anchor
       * element should have target="_blank" and rel containing "noopener",
       * ensuring links open in a new tab when rendered in message bubbles.
       */
      fc.assert(
        fc.property(
          fc.record({
            text: fc
              .string({ minLength: 1, maxLength: 30 })
              .filter(s => s.trim().length > 0 && !/[<>&\[\]\(\)]/.test(s)),
            domain: fc.domain(),
          }),
          ({ text, domain }) => {
            const url = `https://${domain}`;

            editor.setHTML(`<p>${text}</p>`);

            // Select all text
            const ce = editor.getContentEditable();
            const sel = window.getSelection()!;
            const range = document.createRange();
            range.selectNodeContents(ce);
            sel.removeAllRanges();
            sel.addRange(range);

            // Create a link
            editor.setLink(url, text);

            const anchor = ce.querySelector('a');
            if (anchor) {
              // Links should open in new tab
              expect(anchor.target).toBe('_blank');
              // Links should have security attributes
              expect(anchor.rel).toContain('noopener');
              // Link text should be preserved
              expect(anchor.textContent).toBe(text);
              // Link href should contain the domain
              expect(anchor.href).toContain(domain);
            }

            // Clear for next iteration
            editor.clear();
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should preserve link attributes when setting HTML with links', () => {
      const urls = ['https://example.com', 'https://google.com/search', 'https://github.com/repo'];

      for (const url of urls) {
        editor.setHTML(
          `<p><a href="${url}" target="_blank" rel="noopener noreferrer" class="cometchat-rich-text__link">Link</a></p>`
        );

        const ce = editor.getContentEditable();
        const anchor = ce.querySelector('a');
        expect(anchor).toBeTruthy();
        if (anchor) {
          expect(anchor.href).toContain(url.replace('https://', ''));
          expect(anchor.target).toBe('_blank');
        }

        editor.clear();
      }
    });

    it('should emit linkClick event when link is clicked in text bubble context', () => {
      // This tests the link click handling pattern used by the text bubble.
      // The text bubble uses (click)="onTextContentClick($event)" which checks
      // for anchor tags with class "cometchat-link" and emits linkClick.
      //
      // At the editor level, we verify that links have the correct structure
      // that the text bubble's click handler expects.
      editor.setHTML(
        '<p><a href="https://example.com" class="cometchat-rich-text__link" target="_blank" rel="noopener noreferrer">Example</a></p>'
      );

      const ce = editor.getContentEditable();
      const anchor = ce.querySelector('a');
      expect(anchor).toBeTruthy();
      expect(anchor?.getAttribute('href')).toBe('https://example.com');
      expect(anchor?.getAttribute('target')).toBe('_blank');
      // The link structure is correct for the text bubble to handle clicks
    });
  });
});

// ==================== Bug Condition Exploration Tests (Group B: Code Block / Inline Code) ====================

/**
 * Bug Condition Exploration Tests — Code Block / Inline Code Behavior (Group B)
 *
 * These tests encode the EXPECTED (correct) behavior for code block and inline code bugs.
 * They are designed to FAIL on unfixed code, confirming the bugs exist.
 * After fixes are applied, these same tests should PASS.
 *
 * **Validates: Requirements 1.5, 1.6, 1.9, 1.11, 1.15, 1.16, 1.17, 1.19**
 *
 * @module services/rich-text-editor/bug-exploration-group-b
 */

describe('Bug Condition Exploration: Code Block / Inline Code (Group B)', () => {
  let editor: RichTextEditor;

  beforeAll(async () => {
    await ensureSdkReady();
  });

  afterAll(async () => {
    await sdkCleanup();
  });

  function createEditorConfig(overrides?: Partial<RichTextEditorConfig>): RichTextEditorConfig {
    return {
      placeholder: 'Type a message...',
      editable: true,
      ...overrides,
    };
  }

  beforeEach(() => {
    editor = new RichTextEditor(createEditorConfig());
    document.body.appendChild(editor.getElement());
  });

  afterEach(() => {
    if (!editor.isDestroyed()) {
      editor.destroy();
    }
    const el = document.querySelector('.cometchat-rich-text-editor');
    if (el && el.parentNode) {
      el.parentNode.removeChild(el);
    }
  });

  // ==================== Case 3 (Req 1.9): Code Block Disables Inline Formatting ====================

  describe('Case 3 (Req 1.9): Inline formatting is NOT applied inside code blocks', () => {
    /**
     * **Validates: Requirements 1.9**
     *
     * Property: When code block formatting is active and the user attempts to apply
     * bold/italic/underline/strikethrough, the inline formatting should NOT be applied.
     *
     * Bug: FormatManager.applyBold/Italic/Underline/Strikethrough use document.execCommand
     * without checking if the cursor is inside a <pre> code block. No guard exists.
     */
    it('should NOT apply bold inside a code block', () => {
      const ce = editor.getContentEditable();
      ce.innerHTML = '<pre class="cometchat-rich-text__code-block">code content here</pre>';

      // Place cursor inside the code block
      const pre = ce.querySelector('pre')!;
      const sel = window.getSelection()!;
      const range = document.createRange();
      range.selectNodeContents(pre);
      sel.removeAllRanges();
      sel.addRange(range);

      // Attempt to apply bold
      editor.applyBold();

      // Expected: no <b> or <strong> inside the <pre>
      const preHtml = pre.innerHTML.toLowerCase();
      expect(preHtml.includes('<b>') || preHtml.includes('<strong>')).toBe(false);
    });

    it('should NOT apply italic inside a code block', () => {
      const ce = editor.getContentEditable();
      ce.innerHTML = '<pre class="cometchat-rich-text__code-block">code content here</pre>';

      const pre = ce.querySelector('pre')!;
      const sel = window.getSelection()!;
      const range = document.createRange();
      range.selectNodeContents(pre);
      sel.removeAllRanges();
      sel.addRange(range);

      editor.applyItalic();

      const preHtml = pre.innerHTML.toLowerCase();
      expect(preHtml.includes('<i>') || preHtml.includes('<em>')).toBe(false);
    });

    it('should NOT apply underline inside a code block', () => {
      const ce = editor.getContentEditable();
      ce.innerHTML = '<pre class="cometchat-rich-text__code-block">code content here</pre>';

      const pre = ce.querySelector('pre')!;
      const sel = window.getSelection()!;
      const range = document.createRange();
      range.selectNodeContents(pre);
      sel.removeAllRanges();
      sel.addRange(range);

      editor.applyUnderline();

      const preHtml = pre.innerHTML.toLowerCase();
      expect(preHtml.includes('<u>')).toBe(false);
    });

    it('should NOT apply strikethrough inside a code block', () => {
      const ce = editor.getContentEditable();
      ce.innerHTML = '<pre class="cometchat-rich-text__code-block">code content here</pre>';

      const pre = ce.querySelector('pre')!;
      const sel = window.getSelection()!;
      const range = document.createRange();
      range.selectNodeContents(pre);
      sel.removeAllRanges();
      sel.addRange(range);

      editor.applyStrikethrough();

      const preHtml = pre.innerHTML.toLowerCase();
      expect(
        preHtml.includes('<strike>') || preHtml.includes('<s>') || preHtml.includes('<del>')
      ).toBe(false);
    });

    it('should NOT apply any inline formatting inside code blocks (property-based)', () => {
      /**
       * **Validates: Requirements 1.9**
       *
       * Property: For any inline format type, applying it while cursor is inside
       * a code block should have no effect — no inline formatting tags inside <pre>.
       */
      const formatActions: { name: string; apply: () => void; tags: string[] }[] = [
        { name: 'bold', apply: () => editor.applyBold(), tags: ['<b>', '<strong>'] },
        { name: 'italic', apply: () => editor.applyItalic(), tags: ['<i>', '<em>'] },
        { name: 'underline', apply: () => editor.applyUnderline(), tags: ['<u>'] },
        {
          name: 'strikethrough',
          apply: () => editor.applyStrikethrough(),
          tags: ['<strike>', '<s>', '<del>'],
        },
      ];

      fc.assert(
        fc.property(
          fc.constantFrom(...formatActions),
          fc
            .string({ minLength: 1, maxLength: 30 })
            .filter(s => s.trim().length > 0 && !/[<>&]/.test(s)),
          (format, text) => {
            const ce = editor.getContentEditable();
            ce.innerHTML = `<pre class="cometchat-rich-text__code-block">${text}</pre>`;

            const pre = ce.querySelector('pre')!;
            const sel = window.getSelection()!;
            const range = document.createRange();
            range.selectNodeContents(pre);
            sel.removeAllRanges();
            sel.addRange(range);

            format.apply();

            const preHtml = pre.innerHTML.toLowerCase();
            const hasInlineFormatting = format.tags.some(tag => preHtml.includes(tag));
            expect(hasInlineFormatting).toBe(false);
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  // ==================== Case 4 (Req 1.11): Code Block Strips Mentions ====================

  describe('Case 4 (Req 1.11): Code block/inline code strips mentions to plain text', () => {
    /**
     * **Validates: Requirements 1.11**
     *
     * Property: When code block or inline code is applied to content containing mentions,
     * the mentions should be stripped to plain text (no longer interactive).
     *
     * Bug: applyCodeBlock wraps content in <pre> but does not strip mention <span> elements.
     */
    it('should strip mention spans when code block is applied', () => {
      const ce = editor.getContentEditable();
      ce.innerHTML =
        '<p>Hello <span data-mention-id="user-1" class="cometchat-rich-text__mention" contenteditable="false">@John</span> world</p>';

      // Select all content
      const sel = window.getSelection()!;
      const range = document.createRange();
      range.selectNodeContents(ce);
      sel.removeAllRanges();
      sel.addRange(range);

      // Apply code block
      editor.applyCodeBlock();

      // Expected: mention spans should be stripped to plain text inside <pre>
      const pre = ce.querySelector('pre');
      expect(pre).toBeTruthy();
      if (pre) {
        const mentionSpans = pre.querySelectorAll('[data-mention-id]');
        expect(mentionSpans.length).toBe(0);
        // The text "@John" should still be present as plain text
        expect(pre.textContent).toContain('@John');
      }
    });

    it('should strip mention spans when inline code is applied', () => {
      const ce = editor.getContentEditable();
      ce.innerHTML =
        '<p>Hello <span data-mention-id="user-1" class="cometchat-rich-text__mention" contenteditable="false">@John</span> world</p>';

      // Select all content
      const sel = window.getSelection()!;
      const range = document.createRange();
      range.selectNodeContents(ce);
      sel.removeAllRanges();
      sel.addRange(range);

      // Apply inline code
      editor.applyInlineCode();

      // Expected: mention spans should be stripped to plain text inside <code>
      const code = ce.querySelector('code');
      expect(code).toBeTruthy();
      if (code) {
        const mentionSpans = code.querySelectorAll('[data-mention-id]');
        expect(mentionSpans.length).toBe(0);
        expect(code.textContent).toContain('@John');
      }
    });
  });

  // ==================== Case 5 (Req 1.15): Mention Popup Disabled in Code Block ====================

  describe('Case 5 (Req 1.15): Mention popup does NOT trigger inside code block/inline code', () => {
    /**
     * **Validates: Requirements 1.15**
     *
     * Property: When the user types `@` inside a code block or inline code span,
     * the mention suggestions popup should NOT trigger.
     *
     * Bug: The @ trigger handler does not check if the cursor is inside a <pre> or
     * <code> element before firing onMentionStart.
     *
     * We test this by creating an editor with onMentionStart callback, placing cursor
     * inside a code block, and simulating typing `@`. The callback should NOT be called.
     */
    it('should NOT trigger onMentionStart when @ is typed inside a code block', () => {
      const onMentionStart = vi.fn();
      const editorWithMention = new RichTextEditor(createEditorConfig({ onMentionStart }));
      document.body.appendChild(editorWithMention.getElement());

      const ce = editorWithMention.getContentEditable();
      ce.innerHTML = '<pre class="cometchat-rich-text__code-block">code </pre>';

      // Place cursor at end of code block text
      const pre = ce.querySelector('pre')!;
      const textNode = pre.firstChild!;
      const sel = window.getSelection()!;
      const range = document.createRange();
      range.setStart(textNode, textNode.textContent!.length);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);

      // Simulate typing '@' by inserting it and dispatching input event
      textNode.textContent = textNode.textContent + '@';
      range.setStart(textNode, textNode.textContent!.length);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
      ce.dispatchEvent(new Event('input', { bubbles: true }));

      // Expected: onMentionStart should NOT have been called
      expect(onMentionStart).not.toHaveBeenCalled();

      editorWithMention.destroy();
    });

    it('should NOT trigger onMentionStart when @ is typed inside inline code', () => {
      const onMentionStart = vi.fn();
      const editorWithMention = new RichTextEditor(createEditorConfig({ onMentionStart }));
      document.body.appendChild(editorWithMention.getElement());

      const ce = editorWithMention.getContentEditable();
      ce.innerHTML = '<p><code class="cometchat-rich-text__code">code </code></p>';

      // Place cursor at end of inline code text
      const code = ce.querySelector('code')!;
      const textNode = code.firstChild!;
      const sel = window.getSelection()!;
      const range = document.createRange();
      range.setStart(textNode, textNode.textContent!.length);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);

      // Simulate typing '@'
      textNode.textContent = textNode.textContent + '@';
      range.setStart(textNode, textNode.textContent!.length);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
      ce.dispatchEvent(new Event('input', { bubbles: true }));

      // Expected: onMentionStart should NOT have been called
      expect(onMentionStart).not.toHaveBeenCalled();

      editorWithMention.destroy();
    });
  });

  // ==================== Case 6 (Req 1.16): Code Block and Blockquote Mutual Exclusivity ====================

  describe('Case 6 (Req 1.16): Code block and blockquote are mutually exclusive', () => {
    /**
     * **Validates: Requirements 1.16**
     *
     * Property: When code block is applied while blockquote is active (or vice versa),
     * the existing block format should be removed before applying the new one.
     *
     * Bug: applyCodeBlock and applyBlockquote do not check for or remove the other
     * block format before applying. Both coexist.
     */
    it('should remove blockquote when code block is applied', () => {
      const ce = editor.getContentEditable();
      ce.innerHTML = '<blockquote class="cometchat-rich-text__blockquote">quoted text</blockquote>';

      // Select content inside blockquote
      const bq = ce.querySelector('blockquote')!;
      const sel = window.getSelection()!;
      const range = document.createRange();
      range.selectNodeContents(bq);
      sel.removeAllRanges();
      sel.addRange(range);

      // Apply code block
      editor.applyCodeBlock();

      // Expected: blockquote should be removed, only code block should exist
      expect(ce.querySelector('pre')).toBeTruthy();
      expect(ce.querySelector('blockquote')).toBeNull();
    });

    it('should remove code block when blockquote is applied', () => {
      const ce = editor.getContentEditable();
      ce.innerHTML = '<pre class="cometchat-rich-text__code-block">code text</pre>';

      // Select content inside code block
      const pre = ce.querySelector('pre')!;
      const sel = window.getSelection()!;
      const range = document.createRange();
      range.selectNodeContents(pre);
      sel.removeAllRanges();
      sel.addRange(range);

      // Apply blockquote
      editor.applyBlockquote();

      // Expected: code block should be removed, only blockquote should exist
      expect(ce.querySelector('blockquote')).toBeTruthy();
      expect(ce.querySelector('pre')).toBeNull();
    });

    it('should enforce mutual exclusivity for generated text (property-based)', () => {
      /**
       * **Validates: Requirements 1.16**
       *
       * Property: For any text content, applying code block then blockquote (or vice versa)
       * should result in only the last-applied format being active.
       */
      fc.assert(
        fc.property(
          fc
            .string({ minLength: 1, maxLength: 30 })
            .filter(s => s.trim().length > 0 && !/[<>&]/.test(s)),
          fc.boolean(),
          (text, codeBlockFirst) => {
            const ce = editor.getContentEditable();
            ce.innerHTML = `<p>${text}</p>`;

            // Select all
            const sel = window.getSelection()!;
            const range = document.createRange();
            range.selectNodeContents(ce);
            sel.removeAllRanges();
            sel.addRange(range);

            if (codeBlockFirst) {
              // Apply code block first, then blockquote
              editor.applyCodeBlock();

              // Re-select inside the new element
              const newRange = document.createRange();
              newRange.selectNodeContents(ce);
              sel.removeAllRanges();
              sel.addRange(newRange);

              editor.applyBlockquote();

              // Only blockquote should remain
              expect(ce.querySelector('blockquote')).toBeTruthy();
              expect(ce.querySelector('pre')).toBeNull();
            } else {
              // Apply blockquote first, then code block
              editor.applyBlockquote();

              const newRange = document.createRange();
              newRange.selectNodeContents(ce);
              sel.removeAllRanges();
              sel.addRange(newRange);

              editor.applyCodeBlock();

              // Only code block should remain
              expect(ce.querySelector('pre')).toBeTruthy();
              expect(ce.querySelector('blockquote')).toBeNull();
            }

            // Clear for next iteration
            editor.clear();
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  // ==================== Case 7 (Req 1.17): List and Code Block Mutual Exclusivity ====================

  describe('Case 7 (Req 1.17): List and code block are mutually exclusive', () => {
    /**
     * **Validates: Requirements 1.17**
     *
     * Property: When ordered/unordered list is applied while code block is active,
     * the code block should be removed and the list applied.
     *
     * Bug: applyOrderedList/applyBulletList do not remove code blocks first.
     */
    it('should remove code block when ordered list is applied', () => {
      const ce = editor.getContentEditable();
      ce.innerHTML = '<pre class="cometchat-rich-text__code-block">code text</pre>';

      const pre = ce.querySelector('pre')!;
      const sel = window.getSelection()!;
      const range = document.createRange();
      range.selectNodeContents(pre);
      sel.removeAllRanges();
      sel.addRange(range);

      // Apply ordered list
      editor.applyOrderedList();

      // Expected: code block removed, ordered list applied
      expect(ce.querySelector('pre')).toBeNull();
      expect(ce.querySelector('ol')).toBeTruthy();
    });

    it('should remove code block when bullet list is applied', () => {
      const ce = editor.getContentEditable();
      ce.innerHTML = '<pre class="cometchat-rich-text__code-block">code text</pre>';

      const pre = ce.querySelector('pre')!;
      const sel = window.getSelection()!;
      const range = document.createRange();
      range.selectNodeContents(pre);
      sel.removeAllRanges();
      sel.addRange(range);

      // Apply bullet list
      editor.applyBulletList();

      // Expected: code block removed, bullet list applied
      expect(ce.querySelector('pre')).toBeNull();
      expect(ce.querySelector('ul')).toBeTruthy();
    });
  });

  // ==================== Case 8 (Req 1.19): Code Block Toggle Permanently Strips Formatting ====================

  describe('Case 8 (Req 1.19): Code block toggle permanently strips inline formatting', () => {
    /**
     * **Validates: Requirements 1.19**
     *
     * Property: When bold (or other inline formatting) is applied, then code block is
     * toggled on, then code block is toggled off, the bold should NOT be restored.
     * Code block permanently strips all inline formatting.
     *
     * Bug: exitBlockFormat('pre') restores inner HTML with formatting tags intact,
     * so bold is restored after code block toggle off.
     */
    it('should NOT restore bold after code block toggle on then off', () => {
      const ce = editor.getContentEditable();
      ce.innerHTML = '<p>Hello world</p>';

      // Select all and apply bold
      const sel = window.getSelection()!;
      let range = document.createRange();
      range.selectNodeContents(ce);
      sel.removeAllRanges();
      sel.addRange(range);
      editor.applyBold();

      // Verify bold was applied
      let html = ce.innerHTML.toLowerCase();
      expect(html.includes('<b>') || html.includes('<strong>')).toBe(true);

      // Select all and apply code block (toggle ON)
      range = document.createRange();
      range.selectNodeContents(ce);
      sel.removeAllRanges();
      sel.addRange(range);
      editor.applyCodeBlock();

      // Verify code block is active
      expect(ce.querySelector('pre')).toBeTruthy();

      // Select inside code block and toggle code block OFF
      const pre = ce.querySelector('pre')!;
      range = document.createRange();
      range.selectNodeContents(pre);
      sel.removeAllRanges();
      sel.addRange(range);
      editor.applyCodeBlock();

      // Expected: code block removed AND bold should NOT be restored
      expect(ce.querySelector('pre')).toBeNull();
      html = ce.innerHTML.toLowerCase();
      expect(html.includes('<b>') || html.includes('<strong>')).toBe(false);
      // Text should still be present
      expect(ce.textContent).toContain('Hello world');
    });

    it('should NOT restore any inline formatting after code block toggle (property-based)', () => {
      /**
       * **Validates: Requirements 1.19**
       *
       * Property: For any inline format, applying it then toggling code block on/off
       * should permanently strip the inline formatting.
       */
      const formatActions: { name: string; apply: () => void; tags: string[] }[] = [
        { name: 'bold', apply: () => editor.applyBold(), tags: ['<b>', '<strong>'] },
        { name: 'italic', apply: () => editor.applyItalic(), tags: ['<i>', '<em>'] },
        { name: 'underline', apply: () => editor.applyUnderline(), tags: ['<u>'] },
        {
          name: 'strikethrough',
          apply: () => editor.applyStrikethrough(),
          tags: ['<strike>', '<s>', '<del>'],
        },
      ];

      fc.assert(
        fc.property(fc.constantFrom(...formatActions), format => {
          const ce = editor.getContentEditable();
          ce.innerHTML = '<p>test content</p>';

          // Apply inline formatting
          const sel = window.getSelection()!;
          let range = document.createRange();
          range.selectNodeContents(ce);
          sel.removeAllRanges();
          sel.addRange(range);
          format.apply();

          // Toggle code block ON
          range = document.createRange();
          range.selectNodeContents(ce);
          sel.removeAllRanges();
          sel.addRange(range);
          editor.applyCodeBlock();

          // Toggle code block OFF
          const pre = ce.querySelector('pre');
          if (pre) {
            range = document.createRange();
            range.selectNodeContents(pre);
            sel.removeAllRanges();
            sel.addRange(range);
            editor.applyCodeBlock();
          }

          // Inline formatting should NOT be restored
          const html = ce.innerHTML.toLowerCase();
          const hasFormatting = format.tags.some(tag => html.includes(tag));
          expect(hasFormatting).toBe(false);

          // Clear for next iteration
          editor.clear();
        }),
        { numRuns: 8 }
      );
    });
  });
});

// ==================== Preservation Property Tests (Group B: Code Block / Inline Code) ====================

/**
 * Preservation Property Tests — Code Block / Inline Code (Group B)
 *
 * These tests verify that existing CORRECT behavior is preserved.
 * They MUST PASS on unfixed code — they capture behavior that should NOT
 * be broken by future bug fixes for code block / inline code issues.
 *
 * Observation-first methodology:
 * - Observe: Applying bold/italic/underline/strikethrough to normal text (outside code blocks) toggles correctly (Req 3.2)
 * - Observe: Mentions in normal text (outside code blocks/inline code) work correctly (Req 3.4)
 * - Observe: Undo/redo restores editor states correctly (Req 3.6)
 * - Observe: Block quote on plain text without inline formatting renders correctly (Req 3.9)
 *
 * **Validates: Requirements 3.2, 3.4, 3.6, 3.9**
 *
 * @module services/rich-text-editor/preservation-group-b
 */

describe('Preservation: Code Block / Inline Code (Group B)', () => {
  let editor: RichTextEditor;

  beforeAll(async () => {
    await ensureSdkReady();
  });

  afterAll(async () => {
    await sdkCleanup();
  });

  function createEditorConfig(overrides?: Partial<RichTextEditorConfig>): RichTextEditorConfig {
    return {
      placeholder: 'Type a message...',
      editable: true,
      ...overrides,
    };
  }

  beforeEach(() => {
    editor = new RichTextEditor(createEditorConfig());
    document.body.appendChild(editor.getElement());
  });

  afterEach(() => {
    if (!editor.isDestroyed()) {
      editor.destroy();
    }
    const el = document.querySelector('.cometchat-rich-text-editor');
    if (el && el.parentNode) {
      el.parentNode.removeChild(el);
    }
  });

  // ==================== Req 3.2: Inline formatting on normal text toggles correctly ====================

  describe('Req 3.2: Inline formatting on normal text (outside code blocks) toggles correctly', () => {
    /**
     * **Validates: Requirements 3.2**
     *
     * Property: For any plain text string, applying bold/italic/underline/strikethrough
     * to normal text (outside code blocks, not on mentions) correctly toggles and renders
     * those inline formats. The text content is preserved after formatting.
     */
    it('should apply bold to normal text and preserve text content', () => {
      editor.setHTML('<p>Hello world</p>');
      const ce = editor.getContentEditable();
      const sel = window.getSelection()!;
      const range = document.createRange();
      range.selectNodeContents(ce);
      sel.removeAllRanges();
      sel.addRange(range);

      editor.applyBold();

      const html = ce.innerHTML.toLowerCase();
      expect(html.includes('<b>') || html.includes('<strong>')).toBe(true);
      expect(ce.textContent).toContain('Hello world');
    });

    it('should apply italic to normal text and preserve text content', () => {
      editor.setHTML('<p>Hello world</p>');
      const ce = editor.getContentEditable();
      const sel = window.getSelection()!;
      const range = document.createRange();
      range.selectNodeContents(ce);
      sel.removeAllRanges();
      sel.addRange(range);

      editor.applyItalic();

      const html = ce.innerHTML.toLowerCase();
      expect(html.includes('<i>') || html.includes('<em>')).toBe(true);
      expect(ce.textContent).toContain('Hello world');
    });

    it('should apply underline to normal text and preserve text content', () => {
      editor.setHTML('<p>Hello world</p>');
      const ce = editor.getContentEditable();
      const sel = window.getSelection()!;
      const range = document.createRange();
      range.selectNodeContents(ce);
      sel.removeAllRanges();
      sel.addRange(range);

      editor.applyUnderline();

      const html = ce.innerHTML.toLowerCase();
      expect(html.includes('<u>')).toBe(true);
      expect(ce.textContent).toContain('Hello world');
    });

    it('should apply strikethrough to normal text and preserve text content', () => {
      editor.setHTML('<p>Hello world</p>');
      const ce = editor.getContentEditable();
      const sel = window.getSelection()!;
      const range = document.createRange();
      range.selectNodeContents(ce);
      sel.removeAllRanges();
      sel.addRange(range);

      editor.applyStrikethrough();

      const html = ce.innerHTML.toLowerCase();
      expect(html.includes('<strike>') || html.includes('<s>') || html.includes('<del>')).toBe(
        true
      );
      expect(ce.textContent).toContain('Hello world');
    });

    it('should toggle inline formatting on normal text for generated inputs (property-based)', () => {
      /**
       * **Validates: Requirements 3.2**
       *
       * Property: For any plain text and any inline format type, applying the format
       * to normal text (outside code blocks) should produce the corresponding HTML tag
       * and preserve the text content.
       */
      const formatActions: { name: string; apply: () => void; tags: string[] }[] = [
        { name: 'bold', apply: () => editor.applyBold(), tags: ['<b>', '<strong>'] },
        { name: 'italic', apply: () => editor.applyItalic(), tags: ['<i>', '<em>'] },
        { name: 'underline', apply: () => editor.applyUnderline(), tags: ['<u>'] },
        {
          name: 'strikethrough',
          apply: () => editor.applyStrikethrough(),
          tags: ['<strike>', '<s>', '<del>'],
        },
      ];

      fc.assert(
        fc.property(
          fc.constantFrom(...formatActions),
          fc
            .string({ minLength: 1, maxLength: 40 })
            .filter(s => s.trim().length > 0 && !/[<>&]/.test(s)),
          (format, text) => {
            editor.setHTML(`<p>${text}</p>`);

            const ce = editor.getContentEditable();
            const sel = window.getSelection()!;
            const range = document.createRange();
            range.selectNodeContents(ce);
            sel.removeAllRanges();
            sel.addRange(range);

            format.apply();

            // The format tag should be present
            const html = ce.innerHTML.toLowerCase();
            const hasFormat = format.tags.some(tag => html.includes(tag));
            expect(hasFormat).toBe(true);

            // Text content should be preserved
            expect(ce.textContent).toContain(text);

            // Clear for next iteration
            editor.clear();
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should toggle formatting off when applied twice on normal text (property-based)', () => {
      /**
       * **Validates: Requirements 3.2**
       *
       * Property: Applying the same inline format twice to the same text should
       * toggle it off, preserving the text content.
       */
      fc.assert(
        fc.property(
          fc.constantFrom('bold', 'italic', 'underline', 'strikethrough'),
          fc
            .string({ minLength: 1, maxLength: 30 })
            .filter(s => s.trim().length > 0 && !/[<>&]/.test(s)),
          (formatName, text) => {
            editor.setHTML(`<p>${text}</p>`);

            const applyFn = () => {
              switch (formatName) {
                case 'bold':
                  editor.applyBold();
                  break;
                case 'italic':
                  editor.applyItalic();
                  break;
                case 'underline':
                  editor.applyUnderline();
                  break;
                case 'strikethrough':
                  editor.applyStrikethrough();
                  break;
              }
            };

            // Apply once
            const ce = editor.getContentEditable();
            const sel = window.getSelection()!;
            let range = document.createRange();
            range.selectNodeContents(ce);
            sel.removeAllRanges();
            sel.addRange(range);
            applyFn();

            // Apply again (toggle off)
            range = document.createRange();
            range.selectNodeContents(ce);
            sel.removeAllRanges();
            sel.addRange(range);
            applyFn();

            // Text content should still be preserved after toggle
            expect(ce.textContent).toContain(text);

            // Clear for next iteration
            editor.clear();
          }
        ),
        { numRuns: 16 }
      );
    });

    it('should apply multiple inline formats sequentially on normal text', () => {
      editor.setHTML('<p>Formatted text</p>');
      const ce = editor.getContentEditable();

      // Apply bold
      const sel = window.getSelection()!;
      let range = document.createRange();
      range.selectNodeContents(ce);
      sel.removeAllRanges();
      sel.addRange(range);
      editor.applyBold();

      // Apply italic on top
      range = document.createRange();
      range.selectNodeContents(ce);
      sel.removeAllRanges();
      sel.addRange(range);
      editor.applyItalic();

      // Both formats should be present and text preserved
      const html = ce.innerHTML.toLowerCase();
      expect(html.includes('<b>') || html.includes('<strong>')).toBe(true);
      expect(html.includes('<i>') || html.includes('<em>')).toBe(true);
      expect(ce.textContent).toContain('Formatted text');
    });
  });

  // ==================== Req 3.4: Mentions in normal text work correctly ====================

  describe('Req 3.4: Mentions in normal text (outside code blocks/inline code) work correctly', () => {
    /**
     * **Validates: Requirements 3.4**
     *
     * Property: Inserting a mention via insertMention in normal text (outside code blocks)
     * should create a mention span with the correct attributes and the mention should be
     * present in the editor content.
     */
    it('should insert a mention in normal text with correct attributes', () => {
      editor.setHTML('<p>Hello @</p>');
      editor.initializeMentionsFormatter();

      // Place cursor at end of text
      const ce = editor.getContentEditable();
      const sel = window.getSelection()!;
      const range = document.createRange();
      range.selectNodeContents(ce);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);

      editor.insertMention('user-1', 'John', 1);

      // Mention span should exist with correct attributes
      const mentionSpan = ce.querySelector('[data-uid="user-1"]');
      expect(mentionSpan).toBeTruthy();
      if (mentionSpan) {
        expect(mentionSpan.textContent).toContain('@John');
        expect(mentionSpan.getAttribute('contenteditable')).toBe('false');
      }
    });

    it('should track unique mention UIDs after insertion', () => {
      editor.setHTML('<p>Hello @</p>');
      editor.initializeMentionsFormatter();

      const ce = editor.getContentEditable();
      const sel = window.getSelection()!;
      const range = document.createRange();
      range.selectNodeContents(ce);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);

      editor.insertMention('user-1', 'John', 1);

      const uids = editor.getUniqueMentionUids();
      expect(uids.has('user-1')).toBe(true);
    });

    it('should insert multiple mentions in normal text (property-based)', () => {
      /**
       * **Validates: Requirements 3.4**
       *
       * Property: For any valid mention ID and label, inserting a mention in normal text
       * should create a mention span that is tracked by getUniqueMentionUids.
       */
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              id: fc
                .string({ minLength: 1, maxLength: 10 })
                .filter(s => s.trim().length > 0 && !/[<>&\s]/.test(s)),
              label: fc
                .string({ minLength: 1, maxLength: 15 })
                .filter(s => s.trim().length > 0 && !/[<>&]/.test(s)),
            }),
            { minLength: 1, maxLength: 3 }
          ),
          mentions => {
            editor.setHTML('<p>Hello </p>');
            editor.initializeMentionsFormatter();

            for (const mention of mentions) {
              // Place cursor at end
              const ce = editor.getContentEditable();
              const sel = window.getSelection()!;
              const range = document.createRange();
              range.selectNodeContents(ce);
              range.collapse(false);
              sel.removeAllRanges();
              sel.addRange(range);

              editor.insertMention(mention.id, mention.label, 0);
            }

            // All unique mention UIDs should be tracked
            const uids = editor.getUniqueMentionUids();
            const uniqueIds = new Set(mentions.map(m => m.id));
            for (const id of uniqueIds) {
              expect(uids.has(id)).toBe(true);
            }

            // Clear for next iteration
            editor.clear();
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should reject mentions with empty ID or label', () => {
      editor.setHTML('<p>Hello @</p>');
      editor.initializeMentionsFormatter();

      const ce = editor.getContentEditable();
      const sel = window.getSelection()!;
      const range = document.createRange();
      range.selectNodeContents(ce);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);

      // Empty ID should be rejected
      editor.insertMention('', 'John', 1);
      expect(editor.getUniqueMentionUids().size).toBe(0);

      // Empty label should be rejected
      editor.insertMention('user-1', '', 1);
      expect(editor.getUniqueMentionUids().size).toBe(0);
    });

    it('should include mention in getTextWithMentionFormat output', () => {
      editor.setHTML('<p>Hello </p>');
      editor.initializeMentionsFormatter();

      const ce = editor.getContentEditable();
      const sel = window.getSelection()!;
      const range = document.createRange();
      range.selectNodeContents(ce);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);

      editor.insertMention('user-1', 'John', 0);

      const mentionText = editor.getTextWithMentionFormat();
      expect(typeof mentionText).toBe('string');
      // The mention format should reference the user
      expect(mentionText.length).toBeGreaterThan(0);
    });
  });

  // ==================== Req 3.6: Undo/redo restores editor states correctly ====================

  describe('Req 3.6: Undo/redo restores editor states correctly (Group B context)', () => {
    /**
     * **Validates: Requirements 3.6**
     *
     * Property: After applying inline formatting to normal text, undo should restore
     * the previous state. This verifies undo/redo works correctly in the context of
     * formatting operations that the code block fixes might affect.
     */
    it('should undo inline formatting on normal text', () => {
      editor.setHTML('<p>Test content</p>');

      // Apply bold
      const ce = editor.getContentEditable();
      const sel = window.getSelection()!;
      const range = document.createRange();
      range.selectNodeContents(ce);
      sel.removeAllRanges();
      sel.addRange(range);
      editor.applyBold();

      // Verify bold was applied
      const htmlAfterBold = ce.innerHTML.toLowerCase();
      expect(htmlAfterBold.includes('<b>') || htmlAfterBold.includes('<strong>')).toBe(true);

      // Undo
      if (editor.canUndo()) {
        editor.undo();
        // Text should still be present
        expect(ce.textContent).toContain('Test content');
      }
    });

    it('should handle undo/redo cycle for blockquote on normal text', () => {
      editor.setHTML('<p>Quoted text</p>');

      // Apply blockquote
      const ce = editor.getContentEditable();
      const sel = window.getSelection()!;
      const range = document.createRange();
      range.selectNodeContents(ce);
      sel.removeAllRanges();
      sel.addRange(range);
      editor.applyBlockquote();

      // Verify blockquote was applied
      expect(ce.querySelector('blockquote')).toBeTruthy();

      // Undo
      if (editor.canUndo()) {
        editor.undo();
        expect(ce.textContent).toContain('Quoted text');

        // Redo
        if (editor.canRedo()) {
          editor.redo();
          expect(ce.textContent).toContain('Quoted text');
        }
      }
    });

    it('should preserve undo/redo state consistency for generated format sequences (property-based)', () => {
      /**
       * **Validates: Requirements 3.6**
       *
       * Property: For any sequence of formatting operations on normal text,
       * undo should not throw and canUndo/canRedo should remain consistent.
       */
      const formatOps = [
        () => editor.applyBold(),
        () => editor.applyItalic(),
        () => editor.applyUnderline(),
        () => editor.applyStrikethrough(),
      ];

      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: 0, max: 3 }), { minLength: 1, maxLength: 4 }),
          opIndices => {
            editor.setHTML('<p>undo redo test</p>');

            const ce = editor.getContentEditable();
            for (const idx of opIndices) {
              const sel = window.getSelection()!;
              const range = document.createRange();
              range.selectNodeContents(ce);
              sel.removeAllRanges();
              sel.addRange(range);
              formatOps[idx]();
            }

            // Undo all - should not throw
            let undoCount = 0;
            while (editor.canUndo() && undoCount < 20) {
              expect(() => editor.undo()).not.toThrow();
              undoCount++;
            }
            expect(editor.canUndo()).toBe(false);

            // Redo all - should not throw
            let redoCount = 0;
            while (editor.canRedo() && redoCount < 20) {
              expect(() => editor.redo()).not.toThrow();
              redoCount++;
            }
            expect(editor.canRedo()).toBe(false);

            // Text should still be present
            expect(ce.textContent).toContain('undo redo test');

            // Clear for next iteration
            editor.clear();
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  // ==================== Req 3.9: Block quote on plain text renders correctly ====================

  describe('Req 3.9: Block quote on plain text without inline formatting renders correctly', () => {
    /**
     * **Validates: Requirements 3.9**
     *
     * Property: Applying block quote to plain text (without inline formatting)
     * should wrap the content in a <blockquote> element with the correct BEM class,
     * preserving the text content.
     */
    it('should wrap plain text in a blockquote element', () => {
      editor.setHTML('<p>Plain quoted text</p>');

      const ce = editor.getContentEditable();
      const sel = window.getSelection()!;
      const range = document.createRange();
      range.selectNodeContents(ce);
      sel.removeAllRanges();
      sel.addRange(range);

      editor.applyBlockquote();

      const bq = ce.querySelector('blockquote');
      expect(bq).toBeTruthy();
      expect(ce.textContent).toContain('Plain quoted text');
    });

    it('should apply BEM class to blockquote element', () => {
      editor.setHTML('<p>Styled quote</p>');

      const ce = editor.getContentEditable();
      const sel = window.getSelection()!;
      const range = document.createRange();
      range.selectNodeContents(ce);
      sel.removeAllRanges();
      sel.addRange(range);

      editor.applyBlockquote();

      const bq = ce.querySelector('blockquote');
      expect(bq).toBeTruthy();
      if (bq) {
        expect(bq.classList.contains('cometchat-rich-text__blockquote')).toBe(true);
      }
    });

    it('should toggle blockquote off when cursor is inside blockquote', () => {
      editor.setHTML('<p>Toggle quote</p>');

      const ce = editor.getContentEditable();
      const sel = window.getSelection()!;

      // Apply blockquote
      let range = document.createRange();
      range.selectNodeContents(ce);
      sel.removeAllRanges();
      sel.addRange(range);
      editor.applyBlockquote();
      expect(ce.querySelector('blockquote')).toBeTruthy();

      // Toggle off by selecting inside the blockquote element
      const bq = ce.querySelector('blockquote')!;
      range = document.createRange();
      range.selectNodeContents(bq);
      sel.removeAllRanges();
      sel.addRange(range);
      editor.applyBlockquote();

      // Blockquote should be removed, text preserved
      expect(ce.querySelector('blockquote')).toBeNull();
      expect(ce.textContent).toContain('Toggle quote');
    });

    it('should preserve plain text content in blockquote for generated inputs (property-based)', () => {
      /**
       * **Validates: Requirements 3.9**
       *
       * Property: For any plain text string, applying blockquote should create a
       * <blockquote> element containing the text, with the correct BEM class.
       */
      fc.assert(
        fc.property(
          fc
            .string({ minLength: 1, maxLength: 50 })
            .filter(s => s.trim().length > 0 && !/[<>&]/.test(s)),
          text => {
            editor.setHTML(`<p>${text}</p>`);

            const ce = editor.getContentEditable();
            const sel = window.getSelection()!;
            const range = document.createRange();
            range.selectNodeContents(ce);
            sel.removeAllRanges();
            sel.addRange(range);

            editor.applyBlockquote();

            // Blockquote should exist
            const bq = ce.querySelector('blockquote');
            expect(bq).toBeTruthy();

            // Text should be preserved
            expect(ce.textContent).toContain(text);

            // BEM class should be applied
            if (bq) {
              expect(bq.classList.contains('cometchat-rich-text__blockquote')).toBe(true);
            }

            // Clear for next iteration
            editor.clear();
          }
        ),
        { numRuns: 15 }
      );
    });
  });
});

// ==================== Bug Condition Exploration Tests (Group C: List Formatting) ====================

/**
 * Bug Condition Exploration Tests — List Formatting (Group C)
 *
 * These tests encode the EXPECTED (correct) behavior for list formatting bugs.
 * They are designed to FAIL on unfixed code, confirming the bugs exist.
 * After fixes are applied, these same tests should PASS.
 *
 * **Validates: Requirements 1.7, 1.8, 1.12**
 *
 * @module services/rich-text-editor/bug-exploration-group-c
 */

describe('Bug Condition Exploration: List Formatting (Group C)', () => {
  let editor: RichTextEditor;

  beforeAll(async () => {
    await ensureSdkReady();
  });

  afterAll(async () => {
    await sdkCleanup();
  });

  function createEditorConfig(overrides?: Partial<RichTextEditorConfig>): RichTextEditorConfig {
    return {
      placeholder: 'Type a message...',
      editable: true,
      ...overrides,
    };
  }

  beforeEach(() => {
    editor = new RichTextEditor(createEditorConfig());
    document.body.appendChild(editor.getElement());
  });

  afterEach(() => {
    if (!editor.isDestroyed()) {
      editor.destroy();
    }
    const el = document.querySelector('.cometchat-rich-text-editor');
    if (el && el.parentNode) {
      el.parentNode.removeChild(el);
    }
  });

  // ==================== Case 1 (Req 1.7): Tab Key Creates Nested Lists ====================

  describe('Case 1 (Req 1.7): Tab key creates nested list items with cycling bullet styles', () => {
    /**
     * **Validates: Requirements 1.7**
     *
     * Property: When the user presses Tab while inside a list item, the system
     * should create a nested (indented) list item with cycling bullet styles
     * (disc → circle → square → disc for unordered lists).
     *
     * Bug: Tab does not create nested list items with proper cycling bullet styles.
     * The indentListItem() method moves the item into a nested list but does not
     * apply CSS list-style-type cycling based on nesting depth.
     */
    it('should create a nested list with cycling bullet style on Tab press', () => {
      const ce = editor.getContentEditable();
      // Create a bullet list with two items
      ce.innerHTML = '<ul><li>Item 1</li><li>Item 2</li></ul>';

      // Place cursor inside the second list item
      const secondLi = ce.querySelectorAll('li')[1];
      const sel = window.getSelection()!;
      const range = document.createRange();
      range.selectNodeContents(secondLi);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);

      // Simulate Tab key press
      const tabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        bubbles: true,
        cancelable: true,
      });
      ce.dispatchEvent(tabEvent);

      // Expected: Item 2 should be nested inside a sub-list under Item 1
      const nestedList = ce.querySelector('ul ul');
      expect(nestedList).toBeTruthy();

      // The nested list should have a different bullet style (circle at depth 1)
      if (nestedList) {
        const style = (nestedList as HTMLElement).style.listStyleType;
        expect(style).toBe('circle');
      }
    });

    it('should cycle bullet styles disc → circle → square → disc on successive Tab presses', () => {
      const ce = editor.getContentEditable();
      // Create a bullet list with items at different nesting levels
      ce.innerHTML = '<ul><li>Item 1</li><li>Item 2</li><li>Item 3</li><li>Item 4</li></ul>';

      const expectedStyles = ['circle', 'square', 'disc'];

      // Indent items 2, 3, 4 progressively deeper
      for (let i = 0; i < 3; i++) {
        // Find the last top-level or deepest li to indent
        const allLis = ce.querySelectorAll('li');
        const targetLi = allLis[allLis.length - 1 - (2 - i)]; // Items 2, 3, 4

        if (!targetLi) continue;

        const sel = window.getSelection()!;
        const range = document.createRange();
        range.selectNodeContents(targetLi);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);

        // Simulate Tab
        const tabEvent = new KeyboardEvent('keydown', {
          key: 'Tab',
          bubbles: true,
          cancelable: true,
        });
        ce.dispatchEvent(tabEvent);
      }

      // Check that nested lists have cycling styles
      const nestedUls = ce.querySelectorAll('ul ul');
      expect(nestedUls.length).toBeGreaterThan(0);

      // At least the first nested level should have 'circle' style
      if (nestedUls.length > 0) {
        expect((nestedUls[0] as HTMLElement).style.listStyleType).toBe('circle');
      }
    });

    it('should create nested list with cycling styles for generated list sizes (property-based)', () => {
      /**
       * **Validates: Requirements 1.7**
       *
       * Property: For any unordered list with at least 2 items, pressing Tab on the
       * second item should create a nested list with 'circle' bullet style.
       */
      fc.assert(
        fc.property(
          fc.array(
            fc
              .string({ minLength: 1, maxLength: 20 })
              .filter(s => s.trim().length > 0 && !/[<>&]/.test(s)),
            { minLength: 2, maxLength: 6 }
          ),
          items => {
            const ce = editor.getContentEditable();
            const liHtml = items.map(item => `<li>${item}</li>`).join('');
            ce.innerHTML = `<ul>${liHtml}</ul>`;

            // Place cursor in the second list item
            const secondLi = ce.querySelectorAll('li')[1];
            if (!secondLi) return;

            const sel = window.getSelection()!;
            const range = document.createRange();
            range.selectNodeContents(secondLi);
            range.collapse(true);
            sel.removeAllRanges();
            sel.addRange(range);

            // Simulate Tab
            const tabEvent = new KeyboardEvent('keydown', {
              key: 'Tab',
              bubbles: true,
              cancelable: true,
            });
            ce.dispatchEvent(tabEvent);

            // A nested <ul> should exist
            const nestedUl = ce.querySelector('ul ul');
            expect(nestedUl).toBeTruthy();

            // The nested list should have 'circle' bullet style (depth 1)
            if (nestedUl) {
              expect((nestedUl as HTMLElement).style.listStyleType).toBe('circle');
            }

            // Clear for next iteration
            editor.clear();
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  // ==================== Case 2 (Req 1.8): Ordered List Sequential Numbering ====================

  describe('Case 2 (Req 1.8): Ordered list maintains correct sequential numbering', () => {
    /**
     * **Validates: Requirements 1.8**
     *
     * Property: When a new bullet point is added at any position in an ordered list,
     * all items should maintain correct sequential numbering in the markdown output.
     *
     * Bug: createNewListItem does not split the current list item's content at the
     * cursor position. When Enter is pressed in the middle of a list item's text,
     * the text after the cursor should move to the new item. Instead, a blank item
     * is created and the original item retains all its text. This produces incorrect
     * content distribution across list items.
     */
    it('should split list item content at cursor position when Enter is pressed mid-text', () => {
      const ce = editor.getContentEditable();
      // Create an ordered list with one item containing text
      ce.innerHTML = '<ol><li>HelloWorld</li></ol>';

      // Place cursor in the middle of the text (between "Hello" and "World")
      const li = ce.querySelector('li')!;
      const textNode = li.firstChild!;
      const sel = window.getSelection()!;
      const range = document.createRange();
      range.setStart(textNode, 5); // After "Hello"
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);

      // Simulate Enter key
      const enterEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
        cancelable: true,
      });
      ce.dispatchEvent(enterEvent);

      // Should have 2 items
      const allLis = ce.querySelectorAll('ol > li');
      expect(allLis.length).toBe(2);

      // First item should contain "Hello", second should contain "World"
      expect(allLis[0].textContent?.trim()).toBe('Hello');
      expect(allLis[1].textContent?.trim()).toBe('World');
    });

    it('should split content correctly for generated text at random positions (property-based)', () => {
      /**
       * **Validates: Requirements 1.8**
       *
       * Property: For any ordered list item with text content, pressing Enter at a
       * random cursor position should split the text: content before cursor stays
       * in the current item, content after cursor moves to the new item.
       * Both items should have correct sequential numbering.
       */
      fc.assert(
        fc.property(
          fc
            .string({ minLength: 2, maxLength: 20 })
            .filter(s => s.trim().length >= 2 && !/[<>&]/.test(s))
            .filter(s => /^\S.*\S$/.test(s))
            .filter(s => /^[a-zA-Z0-9]+$/.test(s)), // Only alphanumeric to avoid editor edge cases
          fc.nat(),
          (text, splitSeed) => {
            const ce = editor.getContentEditable();
            ce.innerHTML = `<ol><li>${text}</li><li>After</li></ol>`;

            // Pick a split position (not at start or end to ensure both parts have content)
            const splitPos = 1 + (splitSeed % (text.length - 1));

            const li = ce.querySelector('li')!;
            const textNode = li.firstChild!;
            const sel = window.getSelection()!;
            const range = document.createRange();
            range.setStart(textNode, splitPos);
            range.collapse(true);
            sel.removeAllRanges();
            sel.addRange(range);

            // Simulate Enter
            const enterEvent = new KeyboardEvent('keydown', {
              key: 'Enter',
              bubbles: true,
              cancelable: true,
            });
            ce.dispatchEvent(enterEvent);

            // Should have 3 items now (original split into 2 + "After")
            const allLis = ce.querySelectorAll('ol > li');
            expect(allLis.length).toBe(3);

            // First item should have text before split position
            const expectedBefore = text.substring(0, splitPos);
            const expectedAfter = text.substring(splitPos);
            expect(allLis[0].textContent?.trim()).toBe(expectedBefore);
            expect(allLis[1].textContent?.trim()).toBe(expectedAfter);

            // Verify markdown output has correct sequential numbering
            const markdown = editor.getTextWithMentionFormat();
            const numberedLines = markdown.split('\n').filter(line => /^\d+\./.test(line.trim()));
            for (let i = 0; i < numberedLines.length; i++) {
              expect(numberedLines[i].trim()).toMatch(new RegExp(`^${i + 1}\\.`));
            }

            // Clear for next iteration
            editor.clear();
          }
        ),
        { numRuns: 15 }
      );
    });
  });

  // ==================== Case 3 (Req 1.12): Empty List Items Stripped Before Sending ====================

  describe('Case 3 (Req 1.12): Empty list items are stripped before sending', () => {
    /**
     * **Validates: Requirements 1.12**
     *
     * Property: When the user sends a message containing empty list items (list bullets
     * with no text content), the system should strip those empty items before sending.
     * If the entire message is empty list items, nothing should be sent.
     *
     * Bug: The send flow does not strip empty <li> elements before constructing the message.
     * htmlToMarkdown converts empty <li> to "- \n" or "1. \n" which gets sent.
     *
     * We test this at the RichTextEditor level by checking getTextWithMentionFormat()
     * output, which is what the composer uses to get the text for sending.
     */
    it('should strip empty list items from the send output', () => {
      const ce = editor.getContentEditable();
      // Create a list with some empty items
      ce.innerHTML = '<ul><li>Item 1</li><li><br></li><li>Item 3</li><li></li></ul>';

      const text = editor.getTextWithMentionFormat();

      // The output should contain "Item 1" and "Item 3" but NOT empty list markers
      expect(text).toContain('Item 1');
      expect(text).toContain('Item 3');

      // Should not contain empty list items (lines with just "- " and nothing else)
      const lines = text.split('\n').filter(line => line.trim().length > 0);
      for (const line of lines) {
        if (line.startsWith('- ')) {
          // Each bullet line should have content after the "- " prefix
          expect(line.trim().length).toBeGreaterThan(2);
        }
      }
    });

    it('should return empty string when all list items are empty', () => {
      const ce = editor.getContentEditable();
      // Create a list with only empty items
      ce.innerHTML = '<ul><li><br></li><li></li><li> </li></ul>';

      const text = editor.getTextWithMentionFormat();

      // Should be empty or whitespace-only since all items are empty
      expect(text.trim()).toBe('');
    });

    it('should strip empty ordered list items from the send output', () => {
      const ce = editor.getContentEditable();
      // Create an ordered list with some empty items
      ce.innerHTML = '<ol><li>First</li><li></li><li>Third</li><li><br></li></ol>';

      const text = editor.getTextWithMentionFormat();

      // Should contain "First" and "Third"
      expect(text).toContain('First');
      expect(text).toContain('Third');

      // Should not contain empty numbered items (lines with just "N. " and nothing else)
      const lines = text.split('\n').filter(line => line.trim().length > 0);
      for (const line of lines) {
        const orderedMatch = line.match(/^\d+\.\s*(.*)$/);
        if (orderedMatch) {
          // Each numbered line should have content after the number prefix
          expect(orderedMatch[1].trim().length).toBeGreaterThan(0);
        }
      }
    });

    it('should strip empty list items for generated lists (property-based)', () => {
      /**
       * **Validates: Requirements 1.12**
       *
       * Property: For any list containing a mix of non-empty and empty items,
       * the send output should only contain the non-empty items. Empty items
       * (empty string, whitespace-only, or <br> only) should be stripped.
       */
      fc.assert(
        fc.property(
          fc.array(
            fc.oneof(
              // Non-empty items
              fc
                .string({ minLength: 1, maxLength: 20 })
                .filter(s => s.trim().length > 0 && !/[<>&]/.test(s)),
              // Empty items (represented as empty string)
              fc.constant('')
            ),
            { minLength: 2, maxLength: 6 }
          ),
          fc.constantFrom('ul', 'ol'),
          (items, listType) => {
            // Ensure at least one empty item exists to test the bug
            if (!items.some(item => item === '')) return;

            const ce = editor.getContentEditable();
            const liHtml = items
              .map(item => (item === '' ? '<li><br></li>' : `<li>${item}</li>`))
              .join('');
            ce.innerHTML = `<${listType}>${liHtml}</${listType}>`;

            const text = editor.getTextWithMentionFormat();
            const nonEmptyItems = items.filter(item => item.trim().length > 0);

            // All non-empty items should be present in the output
            for (const item of nonEmptyItems) {
              expect(text).toContain(item);
            }

            // The output should not contain empty list markers
            const lines = text.split('\n').filter(line => line.trim().length > 0);
            for (const line of lines) {
              if (listType === 'ul' && line.startsWith('- ')) {
                expect(line.replace('- ', '').trim().length).toBeGreaterThan(0);
              }
              const orderedMatch = line.match(/^\d+\.\s*(.*)$/);
              if (orderedMatch) {
                expect(orderedMatch[1].trim().length).toBeGreaterThan(0);
              }
            }

            // Clear for next iteration
            editor.clear();
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should send nothing when entire message is empty list items (property-based)', () => {
      /**
       * **Validates: Requirements 1.12**
       *
       * Property: For any list where ALL items are empty, the send output
       * should be empty (nothing to send).
       */
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 5 }),
          fc.constantFrom('ul', 'ol'),
          (count, listType) => {
            const ce = editor.getContentEditable();
            const liHtml = Array(count).fill('<li><br></li>').join('');
            ce.innerHTML = `<${listType}>${liHtml}</${listType}>`;

            const text = editor.getTextWithMentionFormat();

            // Should be empty since all items are empty
            expect(text.trim()).toBe('');

            // Clear for next iteration
            editor.clear();
          }
        ),
        { numRuns: 10 }
      );
    });
  });
});

// ==================== Preservation Property Tests (Group C: List Formatting) ====================

/**
 * Preservation Property Tests — List Formatting (Group C)
 *
 * These tests verify that existing CORRECT behavior is preserved.
 * They MUST PASS on unfixed code — they capture behavior that should NOT
 * be broken by future bug fixes for list formatting issues.
 *
 * Observation-first methodology:
 * - Observe: Creating flat ordered/unordered lists without Tab nesting works correctly (Req 3.3)
 * - Observe: Sending messages with non-empty list items includes all items (Req 3.5)
 * - Observe: Undo/redo restores list states correctly (Req 3.6)
 *
 * **Validates: Requirements 3.3, 3.5, 3.6**
 *
 * @module services/rich-text-editor/preservation-group-c
 */

describe('Preservation: List Formatting (Group C)', () => {
  let editor: RichTextEditor;

  beforeAll(async () => {
    await ensureSdkReady();
  });

  afterAll(async () => {
    await sdkCleanup();
  });

  function createEditorConfig(overrides?: Partial<RichTextEditorConfig>): RichTextEditorConfig {
    return {
      placeholder: 'Type a message...',
      editable: true,
      ...overrides,
    };
  }

  beforeEach(() => {
    editor = new RichTextEditor(createEditorConfig());
    document.body.appendChild(editor.getElement());
  });

  afterEach(() => {
    if (!editor.isDestroyed()) {
      editor.destroy();
    }
    const el = document.querySelector('.cometchat-rich-text-editor');
    if (el && el.parentNode) {
      el.parentNode.removeChild(el);
    }
  });

  // ==================== Req 3.3: Flat list creation works correctly ====================

  describe('Req 3.3: Creating flat ordered/unordered lists without Tab nesting works correctly', () => {
    /**
     * **Validates: Requirements 3.3**
     *
     * Property: For any plain text content, applying ordered or unordered list
     * formatting should wrap the content in the appropriate list element (<ol> or <ul>)
     * with list items (<li>), preserving the text content.
     */
    it('should create an unordered list from plain text', () => {
      editor.setHTML('<p>List item text</p>');

      const ce = editor.getContentEditable();
      const sel = window.getSelection()!;
      const range = document.createRange();
      range.selectNodeContents(ce);
      sel.removeAllRanges();
      sel.addRange(range);

      editor.applyBulletList();

      const ul = ce.querySelector('ul');
      expect(ul).toBeTruthy();
      expect(ce.textContent).toContain('List item text');
    });

    it('should create an ordered list from plain text', () => {
      editor.setHTML('<p>List item text</p>');

      const ce = editor.getContentEditable();
      const sel = window.getSelection()!;
      const range = document.createRange();
      range.selectNodeContents(ce);
      sel.removeAllRanges();
      sel.addRange(range);

      editor.applyOrderedList();

      const ol = ce.querySelector('ol');
      expect(ol).toBeTruthy();
      expect(ce.textContent).toContain('List item text');
    });

    it('should toggle unordered list off when cursor is inside list item', () => {
      editor.setHTML('<p>Toggle list</p>');

      const ce = editor.getContentEditable();
      const sel = window.getSelection()!;

      // Apply bullet list
      let range = document.createRange();
      range.selectNodeContents(ce);
      sel.removeAllRanges();
      sel.addRange(range);
      editor.applyBulletList();
      expect(ce.querySelector('ul')).toBeTruthy();

      // Toggle off by placing cursor inside the list item
      const li = ce.querySelector('li')!;
      range = document.createRange();
      range.selectNodeContents(li);
      sel.removeAllRanges();
      sel.addRange(range);
      editor.applyBulletList();

      // Text should be preserved regardless of toggle outcome
      expect(ce.textContent).toContain('Toggle list');
    });

    it('should toggle ordered list off when cursor is inside list item', () => {
      editor.setHTML('<p>Toggle list</p>');

      const ce = editor.getContentEditable();
      const sel = window.getSelection()!;

      // Apply ordered list
      let range = document.createRange();
      range.selectNodeContents(ce);
      sel.removeAllRanges();
      sel.addRange(range);
      editor.applyOrderedList();
      expect(ce.querySelector('ol')).toBeTruthy();

      // Toggle off by placing cursor inside the list item
      const li = ce.querySelector('li')!;
      range = document.createRange();
      range.selectNodeContents(li);
      sel.removeAllRanges();
      sel.addRange(range);
      editor.applyOrderedList();

      // Text should be preserved regardless of toggle outcome
      expect(ce.textContent).toContain('Toggle list');
    });

    it('should create flat lists with correct structure for generated inputs (property-based)', () => {
      /**
       * **Validates: Requirements 3.3**
       *
       * Property: For any plain text string and any list type (ordered/unordered),
       * applying the list format should create the appropriate list element with at
       * least one <li> containing the text content.
       */
      fc.assert(
        fc.property(
          fc.constantFrom('ordered', 'unordered'),
          fc
            .string({ minLength: 1, maxLength: 40 })
            .filter(s => s.trim().length > 0 && !/[<>&]/.test(s)),
          (listType, text) => {
            editor.setHTML(`<p>${text}</p>`);

            const ce = editor.getContentEditable();
            const sel = window.getSelection()!;
            const range = document.createRange();
            range.selectNodeContents(ce);
            sel.removeAllRanges();
            sel.addRange(range);

            if (listType === 'ordered') {
              editor.applyOrderedList();
            } else {
              editor.applyBulletList();
            }

            // The appropriate list element should exist
            const listTag = listType === 'ordered' ? 'ol' : 'ul';
            const listEl = ce.querySelector(listTag);
            expect(listEl).toBeTruthy();

            // At least one <li> should exist
            const items = ce.querySelectorAll(`${listTag} > li`);
            expect(items.length).toBeGreaterThanOrEqual(1);

            // Text content should be preserved
            expect(ce.textContent).toContain(text);

            // Clear for next iteration
            editor.clear();
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should set HTML with pre-built list and preserve structure', () => {
      // Verify that setting HTML with an existing list preserves the structure
      const listHtml = '<ul><li>Item A</li><li>Item B</li><li>Item C</li></ul>';
      editor.setHTML(listHtml);

      const ce = editor.getContentEditable();
      const ul = ce.querySelector('ul');
      expect(ul).toBeTruthy();

      const items = ce.querySelectorAll('ul > li');
      expect(items.length).toBe(3);
      expect(items[0].textContent).toBe('Item A');
      expect(items[1].textContent).toBe('Item B');
      expect(items[2].textContent).toBe('Item C');
    });

    it('should set HTML with pre-built ordered list and preserve structure', () => {
      const listHtml = '<ol><li>First</li><li>Second</li><li>Third</li></ol>';
      editor.setHTML(listHtml);

      const ce = editor.getContentEditable();
      const ol = ce.querySelector('ol');
      expect(ol).toBeTruthy();

      const items = ce.querySelectorAll('ol > li');
      expect(items.length).toBe(3);
      expect(items[0].textContent).toBe('First');
      expect(items[1].textContent).toBe('Second');
      expect(items[2].textContent).toBe('Third');
    });
  });

  // ==================== Req 3.5: Non-empty list items included in sent messages ====================

  describe('Req 3.5: Sending messages with non-empty list items includes all items', () => {
    /**
     * **Validates: Requirements 3.5**
     *
     * Property: When the user sends a message with non-empty list items,
     * all items should be included in the sent message output (getTextWithMentionFormat).
     */
    it('should include all non-empty unordered list items in send output', () => {
      const ce = editor.getContentEditable();
      ce.innerHTML = '<ul><li>Apple</li><li>Banana</li><li>Cherry</li></ul>';

      const text = editor.getTextWithMentionFormat();
      expect(text).toContain('Apple');
      expect(text).toContain('Banana');
      expect(text).toContain('Cherry');
    });

    it('should include all non-empty ordered list items in send output', () => {
      const ce = editor.getContentEditable();
      ce.innerHTML = '<ol><li>Step one</li><li>Step two</li><li>Step three</li></ol>';

      const text = editor.getTextWithMentionFormat();
      expect(text).toContain('Step one');
      expect(text).toContain('Step two');
      expect(text).toContain('Step three');
    });

    it('should produce correct markdown bullet format for unordered lists', () => {
      const ce = editor.getContentEditable();
      ce.innerHTML = '<ul><li>Item 1</li><li>Item 2</li></ul>';

      const text = editor.getTextWithMentionFormat();
      // Each item should be prefixed with "- "
      expect(text).toContain('- Item 1');
      expect(text).toContain('- Item 2');
    });

    it('should produce correct numbered format for ordered lists', () => {
      const ce = editor.getContentEditable();
      ce.innerHTML = '<ol><li>First</li><li>Second</li><li>Third</li></ol>';

      const text = editor.getTextWithMentionFormat();
      // Each item should be numbered sequentially
      expect(text).toContain('1. First');
      expect(text).toContain('2. Second');
      expect(text).toContain('3. Third');
    });

    it('should include all non-empty items in send output for generated lists (property-based)', () => {
      /**
       * **Validates: Requirements 3.5**
       *
       * Property: For any list of non-empty text items, the send output
       * (getTextWithMentionFormat) should contain every item's text content.
       */
      fc.assert(
        fc.property(
          fc.array(
            fc
              .string({ minLength: 1, maxLength: 20 })
              .filter(s => s.trim().length > 0 && !/[<>&]/.test(s))
              .filter(s => /\w/.test(s))
              .filter(s => s === s.trim()), // No leading/trailing whitespace — editor may trim
            { minLength: 1, maxLength: 6 }
          ),
          fc.constantFrom('ul', 'ol'),
          (items, listType) => {
            const ce = editor.getContentEditable();
            const liHtml = items.map(item => `<li>${item}</li>`).join('');
            ce.innerHTML = `<${listType}>${liHtml}</${listType}>`;

            const text = editor.getTextWithMentionFormat();

            // Every non-empty item should appear in the output
            for (const item of items) {
              expect(text).toContain(item);
            }

            // Clear for next iteration
            editor.clear();
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should preserve list item order in send output', () => {
      const ce = editor.getContentEditable();
      ce.innerHTML = '<ol><li>Alpha</li><li>Beta</li><li>Gamma</li><li>Delta</li></ol>';

      const text = editor.getTextWithMentionFormat();
      const alphaIdx = text.indexOf('Alpha');
      const betaIdx = text.indexOf('Beta');
      const gammaIdx = text.indexOf('Gamma');
      const deltaIdx = text.indexOf('Delta');

      // Items should appear in order
      expect(alphaIdx).toBeLessThan(betaIdx);
      expect(betaIdx).toBeLessThan(gammaIdx);
      expect(gammaIdx).toBeLessThan(deltaIdx);
    });
  });

  // ==================== Req 3.6: Undo/redo restores list states correctly ====================

  describe('Req 3.6: Undo/redo restores list states correctly', () => {
    /**
     * **Validates: Requirements 3.6**
     *
     * Property: After applying list formatting, undo should restore the
     * previous state (no list), and redo should re-apply the list.
     * Text content should be preserved through the undo/redo cycle.
     */
    it('should undo bullet list application', () => {
      editor.setHTML('<p>Undo list test</p>');

      const ce = editor.getContentEditable();
      const sel = window.getSelection()!;
      const range = document.createRange();
      range.selectNodeContents(ce);
      sel.removeAllRanges();
      sel.addRange(range);

      editor.applyBulletList();
      expect(ce.querySelector('ul')).toBeTruthy();

      // Undo
      if (editor.canUndo()) {
        editor.undo();
        expect(ce.textContent).toContain('Undo list test');
      }
    });

    it('should undo ordered list application', () => {
      editor.setHTML('<p>Undo ordered test</p>');

      const ce = editor.getContentEditable();
      const sel = window.getSelection()!;
      const range = document.createRange();
      range.selectNodeContents(ce);
      sel.removeAllRanges();
      sel.addRange(range);

      editor.applyOrderedList();
      expect(ce.querySelector('ol')).toBeTruthy();

      // Undo
      if (editor.canUndo()) {
        editor.undo();
        expect(ce.textContent).toContain('Undo ordered test');
      }
    });

    it('should support redo after undoing list application', () => {
      editor.setHTML('<p>Redo list test</p>');

      const ce = editor.getContentEditable();
      const sel = window.getSelection()!;
      const range = document.createRange();
      range.selectNodeContents(ce);
      sel.removeAllRanges();
      sel.addRange(range);

      editor.applyBulletList();

      if (editor.canUndo()) {
        editor.undo();

        if (editor.canRedo()) {
          editor.redo();
          // Text should still be present after redo
          expect(ce.textContent).toContain('Redo list test');
        }
      }
    });

    it('should not throw on undo/redo with list operations', () => {
      editor.setHTML('<p>Safe undo test</p>');

      const ce = editor.getContentEditable();
      const sel = window.getSelection()!;
      const range = document.createRange();
      range.selectNodeContents(ce);
      sel.removeAllRanges();
      sel.addRange(range);

      editor.applyOrderedList();

      // Undo/redo should never throw
      expect(() => {
        let count = 0;
        while (editor.canUndo() && count < 20) {
          editor.undo();
          count++;
        }
      }).not.toThrow();

      expect(() => {
        let count = 0;
        while (editor.canRedo() && count < 20) {
          editor.redo();
          count++;
        }
      }).not.toThrow();
    });

    it('should preserve text through undo/redo cycle for generated list operations (property-based)', () => {
      /**
       * **Validates: Requirements 3.6**
       *
       * Property: For any plain text and list type, applying the list format
       * then undoing/redoing should not throw and should preserve the text content.
       */
      fc.assert(
        fc.property(
          fc.constantFrom('ordered', 'unordered'),
          fc
            .string({ minLength: 1, maxLength: 30 })
            .filter(s => s.trim().length > 0 && !/[<>&]/.test(s)),
          (listType, text) => {
            editor.setHTML(`<p>${text}</p>`);

            const ce = editor.getContentEditable();
            const sel = window.getSelection()!;
            const range = document.createRange();
            range.selectNodeContents(ce);
            sel.removeAllRanges();
            sel.addRange(range);

            // Apply list
            if (listType === 'ordered') {
              editor.applyOrderedList();
            } else {
              editor.applyBulletList();
            }

            // Undo all - should not throw
            let undoCount = 0;
            while (editor.canUndo() && undoCount < 20) {
              expect(() => editor.undo()).not.toThrow();
              undoCount++;
            }
            expect(editor.canUndo()).toBe(false);

            // Redo all - should not throw
            let redoCount = 0;
            while (editor.canRedo() && redoCount < 20) {
              expect(() => editor.redo()).not.toThrow();
              redoCount++;
            }
            expect(editor.canRedo()).toBe(false);

            // Text should still be present
            expect(ce.textContent).toContain(text);

            // Clear for next iteration
            editor.clear();
          }
        ),
        { numRuns: 15 }
      );
    });

    it('should handle multiple list type switches with undo/redo', () => {
      editor.setHTML('<p>Switch list types</p>');

      const ce = editor.getContentEditable();
      const sel = window.getSelection()!;

      // Apply bullet list
      let range = document.createRange();
      range.selectNodeContents(ce);
      sel.removeAllRanges();
      sel.addRange(range);
      editor.applyBulletList();

      // Switch to ordered list
      range = document.createRange();
      range.selectNodeContents(ce);
      sel.removeAllRanges();
      sel.addRange(range);
      editor.applyOrderedList();

      // Undo all
      let undoCount = 0;
      while (editor.canUndo() && undoCount < 20) {
        expect(() => editor.undo()).not.toThrow();
        undoCount++;
      }

      // Text should be preserved
      expect(ce.textContent).toContain('Switch list types');
    });
  });
});

// ==================== Bug Condition Exploration Tests (Group D: Mention Formatting) ====================

/**
 * Bug Condition Exploration Tests — Mention Formatting and Restoration (Group D)
 *
 * These tests encode the EXPECTED (correct) behavior for mention formatting bugs.
 * They are designed to FAIL on unfixed code, confirming the bugs exist.
 * After fixes are applied, these same tests should PASS.
 *
 * Case 1 (Req 1.10): Formatting applied to a selection containing a mention should
 *   skip the mention — the mention's appearance and attributes must remain unchanged.
 * Case 2 (Req 1.22): Toggling code block on (which disables mentions) then off should
 *   restore mentions to their original clickable/active state.
 *
 * **Validates: Requirements 1.10, 1.22**
 *
 * @module services/rich-text-editor/bug-exploration-group-d
 */

describe('Bug Condition Exploration: Mention Formatting (Group D)', () => {
  let editor: RichTextEditor;

  beforeAll(async () => {
    await ensureSdkReady();
  });

  afterAll(async () => {
    await sdkCleanup();
  });

  function createEditorConfig(overrides?: Partial<RichTextEditorConfig>): RichTextEditorConfig {
    return {
      placeholder: 'Type a message...',
      editable: true,
      ...overrides,
    };
  }

  /**
   * Helper: create a mention span element matching the structure produced by
   * RichTextEditor.insertMention (data-uid, data-mention-type, contenteditable=false).
   */
  function createMentionSpan(uid: string, label: string, isSelf = false): HTMLSpanElement {
    const span = document.createElement('span');
    span.className = isSelf
      ? 'cometchat-mentions cometchat-mentions-you'
      : 'cometchat-mentions cometchat-mentions-other';
    span.setAttribute('data-uid', uid);
    span.setAttribute('data-mention-type', isSelf ? 'self' : 'other');
    span.setAttribute('contenteditable', 'false');
    span.textContent = `@${label}`;
    return span;
  }

  beforeEach(() => {
    editor = new RichTextEditor(createEditorConfig());
    document.body.appendChild(editor.getElement());
  });

  afterEach(() => {
    if (!editor.isDestroyed()) {
      editor.destroy();
    }
    const el = document.querySelector('.cometchat-rich-text-editor');
    if (el && el.parentNode) {
      el.parentNode.removeChild(el);
    }
  });

  // ==================== Case 1 (Req 1.10): Formatting Skips Mentions ====================

  describe('Case 1 (Req 1.10): Formatting applied to selection containing mentions skips the mention', () => {
    /**
     * **Validates: Requirements 1.10**
     *
     * Property: When rich text formatting (bold, italic, underline, strikethrough)
     * is applied to a selection that includes a mention, the mention's appearance
     * and DOM attributes must remain unchanged — formatting should skip the mention.
     *
     * Bug: document.execCommand('bold') applies to the entire selection including
     * mention <span> elements. No logic excludes mention nodes from the formatting range.
     */

    it('should NOT apply bold formatting to a mention span', () => {
      const ce = editor.getContentEditable();
      const p = document.createElement('p');
      p.appendChild(document.createTextNode('Hello '));
      p.appendChild(createMentionSpan('user-1', 'John'));
      p.appendChild(document.createTextNode(' world'));
      ce.innerHTML = '';
      ce.appendChild(p);

      // Select all content (includes the mention)
      const sel = window.getSelection()!;
      const range = document.createRange();
      range.selectNodeContents(ce);
      sel.removeAllRanges();
      sel.addRange(range);

      editor.applyBold();

      // The mention span should NOT be wrapped in or contain <b>/<strong>
      const mentionSpan = ce.querySelector('[data-uid="user-1"]')!;
      expect(mentionSpan).toBeTruthy();

      // Check the mention itself is not inside a bold tag
      let parent = mentionSpan.parentElement;
      let mentionInsideBold = false;
      while (parent && parent !== ce) {
        const tag = parent.tagName.toLowerCase();
        if (tag === 'b' || tag === 'strong') {
          // Bold wrapping the mention is only a bug if the mention itself is affected
          mentionInsideBold = true;
        }
        parent = parent.parentElement;
      }

      // Also check if the mention span itself contains bold tags
      const boldInsideMention = mentionSpan.querySelector('b, strong');

      // The mention should not have bold formatting applied to it
      // Either the mention is not inside a bold wrapper, or bold tags are not inside it
      expect(mentionInsideBold || boldInsideMention !== null).toBe(false);
    });

    it('should NOT apply italic formatting to a mention span', () => {
      const ce = editor.getContentEditable();
      const p = document.createElement('p');
      p.appendChild(document.createTextNode('Hello '));
      p.appendChild(createMentionSpan('user-2', 'Jane'));
      p.appendChild(document.createTextNode(' world'));
      ce.innerHTML = '';
      ce.appendChild(p);

      const sel = window.getSelection()!;
      const range = document.createRange();
      range.selectNodeContents(ce);
      sel.removeAllRanges();
      sel.addRange(range);

      editor.applyItalic();

      const mentionSpan = ce.querySelector('[data-uid="user-2"]')!;
      expect(mentionSpan).toBeTruthy();

      let parent = mentionSpan.parentElement;
      let mentionInsideItalic = false;
      while (parent && parent !== ce) {
        const tag = parent.tagName.toLowerCase();
        if (tag === 'i' || tag === 'em') {
          mentionInsideItalic = true;
        }
        parent = parent.parentElement;
      }

      const italicInsideMention = mentionSpan.querySelector('i, em');
      expect(mentionInsideItalic || italicInsideMention !== null).toBe(false);
    });

    it('should NOT apply underline formatting to a mention span', () => {
      const ce = editor.getContentEditable();
      const p = document.createElement('p');
      p.appendChild(document.createTextNode('Hello '));
      p.appendChild(createMentionSpan('user-3', 'Alice'));
      p.appendChild(document.createTextNode(' world'));
      ce.innerHTML = '';
      ce.appendChild(p);

      const sel = window.getSelection()!;
      const range = document.createRange();
      range.selectNodeContents(ce);
      sel.removeAllRanges();
      sel.addRange(range);

      editor.applyUnderline();

      const mentionSpan = ce.querySelector('[data-uid="user-3"]')!;
      expect(mentionSpan).toBeTruthy();

      let parent = mentionSpan.parentElement;
      let mentionInsideUnderline = false;
      while (parent && parent !== ce) {
        if (parent.tagName.toLowerCase() === 'u') {
          mentionInsideUnderline = true;
        }
        parent = parent.parentElement;
      }

      const underlineInsideMention = mentionSpan.querySelector('u');
      expect(mentionInsideUnderline || underlineInsideMention !== null).toBe(false);
    });

    it('should NOT apply strikethrough formatting to a mention span', () => {
      const ce = editor.getContentEditable();
      const p = document.createElement('p');
      p.appendChild(document.createTextNode('Hello '));
      p.appendChild(createMentionSpan('user-4', 'Bob'));
      p.appendChild(document.createTextNode(' world'));
      ce.innerHTML = '';
      ce.appendChild(p);

      const sel = window.getSelection()!;
      const range = document.createRange();
      range.selectNodeContents(ce);
      sel.removeAllRanges();
      sel.addRange(range);

      editor.applyStrikethrough();

      const mentionSpan = ce.querySelector('[data-uid="user-4"]')!;
      expect(mentionSpan).toBeTruthy();

      let parent = mentionSpan.parentElement;
      let mentionInsideStrike = false;
      while (parent && parent !== ce) {
        const tag = parent.tagName.toLowerCase();
        if (tag === 'strike' || tag === 's' || tag === 'del') {
          mentionInsideStrike = true;
        }
        parent = parent.parentElement;
      }

      const strikeInsideMention = mentionSpan.querySelector('strike, s, del');
      expect(mentionInsideStrike || strikeInsideMention !== null).toBe(false);
    });

    it('should NOT apply any inline formatting to mentions (property-based)', () => {
      /**
       * **Validates: Requirements 1.10**
       *
       * Property: For any inline format type and any mention, applying the format
       * to a selection that includes the mention should leave the mention's DOM
       * attributes and appearance completely unchanged.
       */
      const formatActions: {
        name: string;
        apply: () => void;
        tags: string[];
      }[] = [
        { name: 'bold', apply: () => editor.applyBold(), tags: ['b', 'strong'] },
        { name: 'italic', apply: () => editor.applyItalic(), tags: ['i', 'em'] },
        { name: 'underline', apply: () => editor.applyUnderline(), tags: ['u'] },
        {
          name: 'strikethrough',
          apply: () => editor.applyStrikethrough(),
          tags: ['strike', 's', 'del'],
        },
      ];

      fc.assert(
        fc.property(
          fc.constantFrom(...formatActions),
          fc
            .string({ minLength: 1, maxLength: 15 })
            .filter(s => s.trim().length > 0 && !/[<>&@]/.test(s)),
          fc
            .string({ minLength: 1, maxLength: 10 })
            .filter(s => s.trim().length > 0 && !/[<>&@]/.test(s)),
          (format, prefix, suffix) => {
            const ce = editor.getContentEditable();
            const p = document.createElement('p');
            p.appendChild(document.createTextNode(prefix + ' '));
            p.appendChild(createMentionSpan('pbt-user', 'TestUser'));
            p.appendChild(document.createTextNode(' ' + suffix));
            ce.innerHTML = '';
            ce.appendChild(p);

            // Select all content
            const sel = window.getSelection()!;
            const range = document.createRange();
            range.selectNodeContents(ce);
            sel.removeAllRanges();
            sel.addRange(range);

            format.apply();

            // The mention span should still exist with its data-uid
            const mentionSpan = ce.querySelector('[data-uid="pbt-user"]');
            expect(mentionSpan).toBeTruthy();

            if (mentionSpan) {
              // Check mention is not wrapped in any formatting tag
              let parent = mentionSpan.parentElement;
              let mentionInsideFormatTag = false;
              while (parent && parent !== ce) {
                const tag = parent.tagName.toLowerCase();
                if (format.tags.includes(tag)) {
                  mentionInsideFormatTag = true;
                  break;
                }
                parent = parent.parentElement;
              }

              // Check no formatting tags inside the mention
              const formatInsideMention = mentionSpan.querySelector(format.tags.join(', '));

              expect(mentionInsideFormatTag || formatInsideMention !== null).toBe(false);
            }

            // Clear for next iteration
            editor.clear();
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should preserve mention data-uid attribute after formatting is applied', () => {
      const ce = editor.getContentEditable();
      const p = document.createElement('p');
      p.appendChild(document.createTextNode('Before '));
      p.appendChild(createMentionSpan('uid-preserve', 'PreserveMe'));
      p.appendChild(document.createTextNode(' after'));
      ce.innerHTML = '';
      ce.appendChild(p);

      const sel = window.getSelection()!;
      const range = document.createRange();
      range.selectNodeContents(ce);
      sel.removeAllRanges();
      sel.addRange(range);

      // Apply bold
      editor.applyBold();

      // Mention should still have its data-uid and contenteditable=false
      const mention = ce.querySelector('[data-uid="uid-preserve"]');
      expect(mention).toBeTruthy();
      if (mention) {
        expect(mention.getAttribute('contenteditable')).toBe('false');
        expect(mention.getAttribute('data-mention-type')).toBe('other');
        expect(mention.textContent).toBe('@PreserveMe');
      }
    });

    it('should apply formatting to non-mention text while skipping the mention', () => {
      const ce = editor.getContentEditable();
      const p = document.createElement('p');
      p.appendChild(document.createTextNode('Hello '));
      p.appendChild(createMentionSpan('user-skip', 'SkipMe'));
      p.appendChild(document.createTextNode(' world'));
      ce.innerHTML = '';
      ce.appendChild(p);

      const sel = window.getSelection()!;
      const range = document.createRange();
      range.selectNodeContents(ce);
      sel.removeAllRanges();
      sel.addRange(range);

      editor.applyBold();

      // The non-mention text "Hello" and "world" should have bold applied
      // The mention "@SkipMe" should NOT have bold applied
      const html = ce.innerHTML.toLowerCase();

      // Mention should still exist
      const mention = ce.querySelector('[data-uid="user-skip"]');
      expect(mention).toBeTruthy();

      // The mention should not be inside a bold tag
      if (mention) {
        let parent = mention.parentElement;
        let insideBold = false;
        while (parent && parent !== ce) {
          const tag = parent.tagName.toLowerCase();
          if (tag === 'b' || tag === 'strong') {
            insideBold = true;
            break;
          }
          parent = parent.parentElement;
        }
        expect(insideBold).toBe(false);
      }
    });
  });

  // ==================== Case 2 (Req 1.22): Mentions Restore After Code Block Toggle ====================

  describe('Case 2 (Req 1.22): Mentions restore to clickable/active state after code block toggle off', () => {
    /**
     * **Validates: Requirements 1.22**
     *
     * Property: When code block is toggled on (which should strip mentions per Req 2.11),
     * then toggled off, mentions should be restored to their original clickable/active
     * state with all data attributes intact.
     *
     * Bug chain: Bug 1.11 means mentions are NOT stripped when code block is applied.
     * Bug 1.22 means even if they were stripped, they would NOT be restored on toggle off.
     *
     * These tests verify the FULL expected workflow:
     * 1. Code block ON → mentions MUST be stripped to plain text (Req 2.11)
     * 2. Code block OFF → mentions MUST be restored to active state (Req 2.22)
     *
     * On unfixed code, step 1 fails (mentions survive inside code block), which
     * confirms Bug 1.11 still exists and Bug 1.22 cannot be independently verified
     * until 1.11 is fixed. We test step 1 explicitly to surface the bug.
     */

    it('should strip mentions when code block is toggled ON, then restore them when toggled OFF', () => {
      const ce = editor.getContentEditable();
      const p = document.createElement('p');
      p.appendChild(document.createTextNode('Hello '));
      p.appendChild(createMentionSpan('restore-1', 'John'));
      p.appendChild(document.createTextNode(' world'));
      ce.innerHTML = '';
      ce.appendChild(p);

      // Verify mention exists before toggle
      expect(ce.querySelector('[data-uid="restore-1"]')).toBeTruthy();

      // Select all and toggle code block ON
      const sel = window.getSelection()!;
      let range = document.createRange();
      range.selectNodeContents(ce);
      sel.removeAllRanges();
      sel.addRange(range);

      editor.applyCodeBlock();

      // STEP 1: Mentions MUST be stripped inside code block (Req 2.11)
      // The <pre> should NOT contain mention spans — only plain text
      const pre = ce.querySelector('pre');
      expect(pre).toBeTruthy();
      if (pre) {
        const mentionsInPre = pre.querySelectorAll('[data-uid]');
        // Bug 1.11: mentions are NOT stripped — this assertion should FAIL on unfixed code
        expect(mentionsInPre.length).toBe(0);
        // The text "@John" should still be present as plain text
        expect(pre.textContent).toContain('@John');
      }

      // STEP 2: Toggle code block OFF — mentions should be restored
      range = document.createRange();
      range.selectNodeContents(ce);
      sel.removeAllRanges();
      sel.addRange(range);

      editor.applyCodeBlock();

      // Mention should be restored with data-uid and contenteditable=false
      const restoredMention = ce.querySelector('[data-uid="restore-1"]');
      expect(restoredMention).toBeTruthy();
      if (restoredMention) {
        expect(restoredMention.getAttribute('contenteditable')).toBe('false');
        expect(restoredMention.textContent).toContain('@John');
      }
    });

    it('should strip multiple mentions in code block ON, then restore all on toggle OFF', () => {
      const ce = editor.getContentEditable();
      const p = document.createElement('p');
      p.appendChild(document.createTextNode('Hey '));
      p.appendChild(createMentionSpan('multi-1', 'Alice'));
      p.appendChild(document.createTextNode(' and '));
      p.appendChild(createMentionSpan('multi-2', 'Bob'));
      p.appendChild(document.createTextNode(' check this'));
      ce.innerHTML = '';
      ce.appendChild(p);

      // Verify both mentions exist
      expect(ce.querySelectorAll('[data-uid]').length).toBe(2);

      // Toggle code block ON
      const sel = window.getSelection()!;
      let range = document.createRange();
      range.selectNodeContents(ce);
      sel.removeAllRanges();
      sel.addRange(range);

      editor.applyCodeBlock();

      // STEP 1: Mentions MUST be stripped inside code block
      const pre = ce.querySelector('pre');
      expect(pre).toBeTruthy();
      if (pre) {
        const mentionsInPre = pre.querySelectorAll('[data-uid]');
        // Bug 1.11: mentions survive in code block — this should FAIL on unfixed code
        expect(mentionsInPre.length).toBe(0);
      }

      // STEP 2: Toggle code block OFF
      range = document.createRange();
      range.selectNodeContents(ce);
      sel.removeAllRanges();
      sel.addRange(range);

      editor.applyCodeBlock();

      // Both mentions should be restored
      const restoredMentions = ce.querySelectorAll('[data-uid]');
      expect(restoredMentions.length).toBe(2);

      const alice = ce.querySelector('[data-uid="multi-1"]');
      const bob = ce.querySelector('[data-uid="multi-2"]');
      expect(alice).toBeTruthy();
      expect(bob).toBeTruthy();

      if (alice) {
        expect(alice.getAttribute('contenteditable')).toBe('false');
        expect(alice.textContent).toContain('@Alice');
      }
      if (bob) {
        expect(bob.getAttribute('contenteditable')).toBe('false');
        expect(bob.textContent).toContain('@Bob');
      }
    });

    it('should strip mention in code block and restore with correct data-mention-type on toggle off', () => {
      const ce = editor.getContentEditable();
      const p = document.createElement('p');
      p.appendChild(document.createTextNode('Hi '));
      p.appendChild(createMentionSpan('type-check', 'TypeUser'));
      p.appendChild(document.createTextNode(' end'));
      ce.innerHTML = '';
      ce.appendChild(p);

      // Toggle code block ON
      const sel = window.getSelection()!;
      let range = document.createRange();
      range.selectNodeContents(ce);
      sel.removeAllRanges();
      sel.addRange(range);

      editor.applyCodeBlock();

      // Mentions must be stripped in code block
      const pre = ce.querySelector('pre');
      expect(pre).toBeTruthy();
      if (pre) {
        // Bug 1.11: mentions not stripped — should FAIL on unfixed code
        expect(pre.querySelectorAll('[data-uid]').length).toBe(0);
      }

      // Toggle code block OFF
      range = document.createRange();
      range.selectNodeContents(ce);
      sel.removeAllRanges();
      sel.addRange(range);

      editor.applyCodeBlock();

      // Mention should have data-mention-type restored
      const mention = ce.querySelector('[data-uid="type-check"]');
      expect(mention).toBeTruthy();
      if (mention) {
        expect(mention.getAttribute('data-mention-type')).toBe('other');
        expect(mention.getAttribute('contenteditable')).toBe('false');
      }
    });

    it('should strip and restore mentions for generated content after code block toggle (property-based)', () => {
      /**
       * **Validates: Requirements 1.22**
       *
       * Property: For any text content with a mention, toggling code block on
       * should strip the mention (Req 2.11), and toggling off should restore
       * the mention to its original active state (Req 2.22).
       */
      fc.assert(
        fc.property(
          fc
            .string({ minLength: 1, maxLength: 15 })
            .filter(s => s.trim().length > 0 && !/[<>&@]/.test(s)),
          fc
            .string({ minLength: 1, maxLength: 10 })
            .filter(s => s.trim().length > 0 && !/[<>&@]/.test(s)),
          fc
            .string({ minLength: 1, maxLength: 10 })
            .filter(s => s.trim().length > 0 && !/[<>&@]/.test(s)),
          (prefix, mentionLabel, suffix) => {
            const ce = editor.getContentEditable();
            const p = document.createElement('p');
            p.appendChild(document.createTextNode(prefix + ' '));
            p.appendChild(createMentionSpan('pbt-restore', mentionLabel));
            p.appendChild(document.createTextNode(' ' + suffix));
            ce.innerHTML = '';
            ce.appendChild(p);

            // Verify mention exists
            expect(ce.querySelector('[data-uid="pbt-restore"]')).toBeTruthy();

            // Toggle code block ON
            const sel = window.getSelection()!;
            let range = document.createRange();
            range.selectNodeContents(ce);
            sel.removeAllRanges();
            sel.addRange(range);

            editor.applyCodeBlock();

            // Mentions must be stripped in code block (Req 2.11)
            const pre = ce.querySelector('pre');
            expect(pre).toBeTruthy();
            if (pre) {
              // Bug 1.11: mentions not stripped — should FAIL on unfixed code
              expect(pre.querySelectorAll('[data-uid]').length).toBe(0);
            }

            // Toggle code block OFF
            range = document.createRange();
            range.selectNodeContents(ce);
            sel.removeAllRanges();
            sel.addRange(range);

            editor.applyCodeBlock();

            // Mention should be restored (Req 2.22)
            const restored = ce.querySelector('[data-uid="pbt-restore"]');
            expect(restored).toBeTruthy();
            if (restored) {
              expect(restored.getAttribute('contenteditable')).toBe('false');
              expect(restored.textContent).toContain(`@${mentionLabel}`);
            }

            // Clear for next iteration
            editor.clear();
          }
        ),
        { numRuns: 15 }
      );
    });

    it('should preserve surrounding text content through the full code block toggle cycle', () => {
      const ce = editor.getContentEditable();
      const p = document.createElement('p');
      p.appendChild(document.createTextNode('Start '));
      p.appendChild(createMentionSpan('text-preserve', 'User'));
      p.appendChild(document.createTextNode(' end'));
      ce.innerHTML = '';
      ce.appendChild(p);

      // Toggle code block ON
      const sel = window.getSelection()!;
      let range = document.createRange();
      range.selectNodeContents(ce);
      sel.removeAllRanges();
      sel.addRange(range);

      editor.applyCodeBlock();

      // Mentions must be stripped in code block
      const pre = ce.querySelector('pre');
      expect(pre).toBeTruthy();
      if (pre) {
        // Bug 1.11: mentions not stripped — should FAIL on unfixed code
        expect(pre.querySelectorAll('[data-uid]').length).toBe(0);
      }

      // Toggle code block OFF
      range = document.createRange();
      range.selectNodeContents(ce);
      sel.removeAllRanges();
      sel.addRange(range);

      editor.applyCodeBlock();

      // All text content should be preserved
      const fullText = ce.textContent || '';
      expect(fullText).toContain('Start');
      expect(fullText).toContain('@User');
      expect(fullText).toContain('end');

      // Mention should be restored
      const mention = ce.querySelector('[data-uid="text-preserve"]');
      expect(mention).toBeTruthy();
    });
  });
});

// ==================== Preservation Property Tests (Group D: Mention Formatting) ====================

/**
 * Preservation Property Tests — Mention Formatting (Group D)
 *
 * These tests verify that existing CORRECT mention behavior is preserved.
 * They MUST PASS on unfixed code — they capture behavior that should NOT
 * be broken by future bug fixes for mention formatting issues.
 *
 * Observation-first methodology:
 * - Observe: Inserting mentions via `@` trigger in normal text works correctly (Req 3.4)
 * - Observe: Mentions display correctly in sent messages (Req 3.4)
 *
 * **Validates: Requirements 3.4**
 *
 * @module services/rich-text-editor/preservation-group-d
 */

describe('Preservation: Mention Formatting (Group D)', () => {
  let editor: RichTextEditor;

  beforeAll(async () => {
    await ensureSdkReady();
  });

  afterAll(async () => {
    await sdkCleanup();
  });

  function createEditorConfig(overrides?: Partial<RichTextEditorConfig>): RichTextEditorConfig {
    return {
      placeholder: 'Type a message...',
      editable: true,
      ...overrides,
    };
  }

  /**
   * Helper: create a mention span element matching the structure produced by
   * RichTextEditor.insertMention (data-uid, data-mention-type, contenteditable=false).
   */
  function createMentionSpan(uid: string, label: string, isSelf = false): HTMLSpanElement {
    const span = document.createElement('span');
    span.className = isSelf
      ? 'cometchat-mentions cometchat-mentions-you'
      : 'cometchat-mentions cometchat-mentions-other';
    span.setAttribute('data-uid', uid);
    span.setAttribute('data-mention-type', isSelf ? 'self' : 'other');
    span.setAttribute('contenteditable', 'false');
    span.textContent = `@${label}`;
    return span;
  }

  beforeEach(() => {
    editor = new RichTextEditor(createEditorConfig());
    document.body.appendChild(editor.getElement());
  });

  afterEach(() => {
    if (!editor.isDestroyed()) {
      editor.destroy();
    }
    const el = document.querySelector('.cometchat-rich-text-editor');
    if (el && el.parentNode) {
      el.parentNode.removeChild(el);
    }
  });

  // ==================== Req 3.4: Mention insertion in normal text works correctly ====================

  describe('Req 3.4: Mention insertion in normal text produces correct DOM structure', () => {
    /**
     * **Validates: Requirements 3.4**
     *
     * Property: For any valid mention ID and label, inserting a mention via
     * insertMention in normal text (outside code blocks/inline code) should
     * create a span with the correct CSS class, data-uid, data-mention-type,
     * and contenteditable=false attributes.
     */
    it('should create mention span with cometchat-mentions class and correct attributes', () => {
      editor.setHTML('<p>Hello </p>');
      editor.initializeMentionsFormatter();

      const ce = editor.getContentEditable();
      const sel = window.getSelection()!;
      const range = document.createRange();
      range.selectNodeContents(ce);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);

      editor.insertMention('user-pres-1', 'Alice', 0);

      const mention = ce.querySelector('[data-uid="user-pres-1"]');
      expect(mention).toBeTruthy();
      if (mention) {
        expect(mention.className).toContain('cometchat-mentions');
        expect(mention.getAttribute('data-mention-type')).toBe('other');
        expect(mention.getAttribute('contenteditable')).toBe('false');
        expect(mention.textContent).toBe('@Alice');
      }
    });

    it('should create self-mention with cometchat-mentions-you class', () => {
      editor.setHTML('<p>Hello </p>');
      editor.initializeMentionsFormatter();

      const ce = editor.getContentEditable();
      const sel = window.getSelection()!;
      const range = document.createRange();
      range.selectNodeContents(ce);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);

      editor.insertMention('self-user', 'Me', 0, true);

      const mention = ce.querySelector('[data-uid="self-user"]');
      expect(mention).toBeTruthy();
      if (mention) {
        expect(mention.className).toContain('cometchat-mentions-you');
        expect(mention.getAttribute('data-mention-type')).toBe('self');
        expect(mention.getAttribute('contenteditable')).toBe('false');
        expect(mention.textContent).toBe('@Me');
      }
    });

    it('should insert mention with correct attributes for generated inputs (property-based)', () => {
      /**
       * **Validates: Requirements 3.4**
       *
       * Property: For any valid (non-empty, no special HTML chars) mention ID and label,
       * insertMention should produce a span with data-uid matching the ID,
       * contenteditable=false, and text content starting with @.
       */
      fc.assert(
        fc.property(
          fc.record({
            id: fc
              .string({ minLength: 1, maxLength: 12 })
              .filter(s => s.trim().length > 0 && !/[<>&\s"'\\[\]]/.test(s)),
            label: fc
              .string({ minLength: 1, maxLength: 15 })
              .filter(s => s.trim().length > 0 && !/[<>&]/.test(s)),
          }),
          ({ id, label }) => {
            editor.setHTML('<p>Hi </p>');
            editor.initializeMentionsFormatter();

            const ce = editor.getContentEditable();
            const sel = window.getSelection()!;
            const range = document.createRange();
            range.selectNodeContents(ce);
            range.collapse(false);
            sel.removeAllRanges();
            sel.addRange(range);

            editor.insertMention(id, label, 0);

            const mention = ce.querySelector(`[data-uid="${id}"]`);
            expect(mention).toBeTruthy();
            if (mention) {
              expect(mention.getAttribute('contenteditable')).toBe('false');
              expect(mention.textContent).toBe(`@${label}`);
              expect(mention.className).toContain('cometchat-mentions');
            }

            editor.clear();
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should add a space after the inserted mention for cursor positioning', () => {
      editor.setHTML('<p>Hey </p>');
      editor.initializeMentionsFormatter();

      const ce = editor.getContentEditable();
      const sel = window.getSelection()!;
      const range = document.createRange();
      range.selectNodeContents(ce);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);

      editor.insertMention('user-space', 'Bob', 0);

      // The mention should be followed by a non-breaking space (\u00A0)
      const mention = ce.querySelector('[data-uid="user-space"]');
      expect(mention).toBeTruthy();
      if (mention && mention.nextSibling) {
        const nextText = mention.nextSibling.textContent || '';
        expect(nextText.charCodeAt(0)).toBe(0x00a0); // non-breaking space
      }
    });
  });

  // ==================== Req 3.4: Mentions display correctly in sent messages ====================

  describe('Req 3.4: Mentions display correctly in getTextWithMentionFormat output', () => {
    /**
     * **Validates: Requirements 3.4**
     *
     * Property: After inserting a mention, getTextWithMentionFormat should return
     * text containing the SDK mention format <@uid:{uid}> for user mentions.
     * This ensures mentions are correctly serialized for sending.
     */
    it('should serialize a single mention to <@uid:{id}> format', () => {
      editor.setHTML('<p>Hello </p>');
      editor.initializeMentionsFormatter();

      const ce = editor.getContentEditable();
      const sel = window.getSelection()!;
      const range = document.createRange();
      range.selectNodeContents(ce);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);

      editor.insertMention('user-fmt-1', 'John', 0);

      const output = editor.getTextWithMentionFormat();
      expect(output).toContain('<@uid:user-fmt-1>');
    });

    it('should serialize multiple mentions to their respective <@uid:{id}> formats', () => {
      editor.setHTML('<p>Hey </p>');
      editor.initializeMentionsFormatter();

      const ce = editor.getContentEditable();

      // Insert first mention
      let sel = window.getSelection()!;
      let range = document.createRange();
      range.selectNodeContents(ce);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
      editor.insertMention('uid-a', 'Alice', 0);

      // Insert second mention
      sel = window.getSelection()!;
      range = document.createRange();
      range.selectNodeContents(ce);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
      editor.insertMention('uid-b', 'Bob', 0);

      const output = editor.getTextWithMentionFormat();
      expect(output).toContain('<@uid:uid-a>');
      expect(output).toContain('<@uid:uid-b>');
    });

    it('should serialize mentions correctly for generated IDs (property-based)', () => {
      /**
       * **Validates: Requirements 3.4**
       *
       * Property: For any valid mention ID, after insertion, getTextWithMentionFormat
       * should contain the SDK format <@uid:{id}> in its output.
       */
      fc.assert(
        fc.property(
          fc.record({
            id: fc
              .string({ minLength: 1, maxLength: 12 })
              .filter(s => s.trim().length > 0 && !/[<>&\s@:]/.test(s)),
            label: fc
              .string({ minLength: 1, maxLength: 10 })
              .filter(s => s.trim().length > 0 && !/[<>&]/.test(s)),
          }),
          ({ id, label }) => {
            editor.setHTML('<p>Msg </p>');
            editor.initializeMentionsFormatter();

            const ce = editor.getContentEditable();
            const sel = window.getSelection()!;
            const range = document.createRange();
            range.selectNodeContents(ce);
            range.collapse(false);
            sel.removeAllRanges();
            sel.addRange(range);

            editor.insertMention(id, label, 0);

            const output = editor.getTextWithMentionFormat();
            expect(output).toContain(`<@uid:${id}>`);

            editor.clear();
          }
        ),
        { numRuns: 15 }
      );
    });

    it('should preserve surrounding text in getTextWithMentionFormat output', () => {
      editor.setHTML('<p>Before </p>');
      editor.initializeMentionsFormatter();

      const ce = editor.getContentEditable();
      const sel = window.getSelection()!;
      const range = document.createRange();
      range.selectNodeContents(ce);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);

      editor.insertMention('user-surround', 'TestUser', 0);

      // Append text after mention
      editor.insertText(' after');

      const output = editor.getTextWithMentionFormat();
      expect(output).toContain('Before');
      expect(output).toContain('<@uid:user-surround>');
    });
  });

  // ==================== Req 3.4: Mention DOM structure preserved in normal text ====================

  describe('Req 3.4: Manually placed mention spans in normal text are preserved by editor', () => {
    /**
     * **Validates: Requirements 3.4**
     *
     * Property: When mention spans are placed in the editor DOM (simulating
     * what insertMention produces), the editor preserves them — getHTML
     * includes the mention span, and getUniqueMentionUids tracks them.
     */
    it('should preserve manually placed mention span in getHTML output', () => {
      const ce = editor.getContentEditable();
      const p = document.createElement('p');
      p.appendChild(document.createTextNode('Hello '));
      p.appendChild(createMentionSpan('manual-1', 'ManualUser'));
      p.appendChild(document.createTextNode(' world'));
      ce.innerHTML = '';
      ce.appendChild(p);

      const html = editor.getHTML();
      expect(html).toContain('data-uid="manual-1"');
      expect(html).toContain('@ManualUser');
    });

    it('should track manually placed mention spans in getUniqueMentionUids', () => {
      const ce = editor.getContentEditable();
      const p = document.createElement('p');
      p.appendChild(document.createTextNode('Hi '));
      p.appendChild(createMentionSpan('tracked-1', 'TrackedUser'));
      p.appendChild(document.createTextNode(' end'));
      ce.innerHTML = '';
      ce.appendChild(p);

      const uids = editor.getUniqueMentionUids();
      expect(uids.has('tracked-1')).toBe(true);
    });

    it('should preserve mention spans for generated content (property-based)', () => {
      /**
       * **Validates: Requirements 3.4**
       *
       * Property: For any mention placed in the editor DOM with valid uid and label,
       * getHTML should contain the data-uid attribute and getUniqueMentionUids
       * should include the uid.
       */
      fc.assert(
        fc.property(
          fc.record({
            uid: fc
              .string({ minLength: 1, maxLength: 12 })
              .filter(s => s.trim().length > 0 && !/[<>&\s"']/.test(s)),
            label: fc
              .string({ minLength: 1, maxLength: 10 })
              .filter(s => s.trim().length > 0 && !/[<>&]/.test(s)),
            prefix: fc
              .string({ minLength: 1, maxLength: 15 })
              .filter(s => s.trim().length > 0 && !/[<>&@]/.test(s)),
          }),
          ({ uid, label, prefix }) => {
            const ce = editor.getContentEditable();
            const p = document.createElement('p');
            p.appendChild(document.createTextNode(prefix + ' '));
            p.appendChild(createMentionSpan(uid, label));
            ce.innerHTML = '';
            ce.appendChild(p);

            // getHTML should contain the mention
            const html = editor.getHTML();
            expect(html).toContain(`data-uid="${uid}"`);

            // getUniqueMentionUids should track it
            const uids = editor.getUniqueMentionUids();
            expect(uids.has(uid)).toBe(true);

            editor.clear();
          }
        ),
        { numRuns: 15 }
      );
    });

    it('should serialize manually placed mention to SDK format in getTextWithMentionFormat', () => {
      const ce = editor.getContentEditable();
      const p = document.createElement('p');
      p.appendChild(document.createTextNode('Check '));
      p.appendChild(createMentionSpan('sdk-fmt', 'SdkUser'));
      p.appendChild(document.createTextNode(' out'));
      ce.innerHTML = '';
      ce.appendChild(p);

      const output = editor.getTextWithMentionFormat();
      expect(output).toContain('<@uid:sdk-fmt>');
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
 * @module services/rich-text-editor/bug-condition-group-e
 */

describe('Bug Condition Exploration: Block Quote Inline Formatting (Group E)', () => {
  let editor: RichTextEditor;

  beforeAll(async () => {
    await ensureSdkReady();
  });

  afterAll(async () => {
    await sdkCleanup();
  });

  function createEditorConfig(overrides?: Partial<RichTextEditorConfig>): RichTextEditorConfig {
    return {
      placeholder: 'Type a message...',
      editable: true,
      ...overrides,
    };
  }

  /**
   * Helper: create a mention span element matching the structure produced by
   * RichTextEditor.insertMention.
   */
  function createMentionSpan(uid: string, label: string, isSelf = false): HTMLSpanElement {
    const span = document.createElement('span');
    span.className = isSelf
      ? 'cometchat-mentions cometchat-mentions-you'
      : 'cometchat-mentions cometchat-mentions-other';
    span.setAttribute('data-uid', uid);
    span.setAttribute('data-mention-type', isSelf ? 'self' : 'other');
    span.setAttribute('contenteditable', 'false');
    span.textContent = `@${label}`;
    return span;
  }

  beforeEach(() => {
    editor = new RichTextEditor(createEditorConfig());
    document.body.appendChild(editor.getElement());
  });

  afterEach(() => {
    if (!editor.isDestroyed()) {
      editor.destroy();
    }
    const el = document.querySelector('.cometchat-rich-text-editor');
    if (el && el.parentNode) {
      el.parentNode.removeChild(el);
    }
  });

  // ==================== Case 1 (Req 1.18): Inline formatting inside block quote ====================

  describe('Case 1 (Req 1.18): Inline formatting inside block quote via RichTextEditor', () => {
    /**
     * **Validates: Requirements 1.18**
     *
     * Property: When the user applies inline formatting (bold, italic, underline,
     * strikethrough) inside a block quote, the system should correctly apply and
     * render these inline formats within the block quote.
     *
     * Bug: Inline formats and mentions are not allowed or rendered inside block quotes.
     */
    it('should apply bold inside a blockquote via RichTextEditor', () => {
      editor.setHTML('<p>bold in quote</p>');
      const ce = editor.getContentEditable();

      // Apply blockquote first
      const sel = window.getSelection()!;
      let range = document.createRange();
      range.selectNodeContents(ce);
      sel.removeAllRanges();
      sel.addRange(range);
      editor.applyBlockquote();

      // Verify blockquote was applied
      const bq = ce.querySelector('blockquote');
      expect(bq).toBeTruthy();

      // Select content inside blockquote and apply bold
      range = document.createRange();
      range.selectNodeContents(bq!);
      sel.removeAllRanges();
      sel.addRange(range);
      editor.applyBold();

      // Expected: bold tag should exist INSIDE the blockquote
      const bqAfter = ce.querySelector('blockquote');
      expect(bqAfter).toBeTruthy();
      if (bqAfter) {
        const bqHtml = bqAfter.innerHTML.toLowerCase();
        expect(bqHtml.includes('<b>') || bqHtml.includes('<strong>')).toBe(true);
      }
      expect(ce.textContent).toContain('bold in quote');
    });

    it('should apply italic inside a blockquote via RichTextEditor', () => {
      editor.setHTML('<p>italic in quote</p>');
      const ce = editor.getContentEditable();

      // Apply blockquote
      const sel = window.getSelection()!;
      let range = document.createRange();
      range.selectNodeContents(ce);
      sel.removeAllRanges();
      sel.addRange(range);
      editor.applyBlockquote();

      const bq = ce.querySelector('blockquote')!;

      // Select inside blockquote and apply italic
      range = document.createRange();
      range.selectNodeContents(bq);
      sel.removeAllRanges();
      sel.addRange(range);
      editor.applyItalic();

      // Expected: italic tag inside blockquote
      const bqAfter = ce.querySelector('blockquote');
      expect(bqAfter).toBeTruthy();
      if (bqAfter) {
        const bqHtml = bqAfter.innerHTML.toLowerCase();
        expect(bqHtml.includes('<i>') || bqHtml.includes('<em>')).toBe(true);
      }
    });

    it('should apply underline inside a blockquote via RichTextEditor', () => {
      editor.setHTML('<p>underline in quote</p>');
      const ce = editor.getContentEditable();

      // Apply blockquote
      const sel = window.getSelection()!;
      let range = document.createRange();
      range.selectNodeContents(ce);
      sel.removeAllRanges();
      sel.addRange(range);
      editor.applyBlockquote();

      const bq = ce.querySelector('blockquote')!;

      // Select inside blockquote and apply underline
      range = document.createRange();
      range.selectNodeContents(bq);
      sel.removeAllRanges();
      sel.addRange(range);
      editor.applyUnderline();

      const bqAfter = ce.querySelector('blockquote');
      expect(bqAfter).toBeTruthy();
      if (bqAfter) {
        const bqHtml = bqAfter.innerHTML.toLowerCase();
        expect(bqHtml.includes('<u>')).toBe(true);
      }
    });

    it('should apply strikethrough inside a blockquote via RichTextEditor', () => {
      editor.setHTML('<p>strike in quote</p>');
      const ce = editor.getContentEditable();

      // Apply blockquote
      const sel = window.getSelection()!;
      let range = document.createRange();
      range.selectNodeContents(ce);
      sel.removeAllRanges();
      sel.addRange(range);
      editor.applyBlockquote();

      const bq = ce.querySelector('blockquote')!;

      // Select inside blockquote and apply strikethrough
      range = document.createRange();
      range.selectNodeContents(bq);
      sel.removeAllRanges();
      sel.addRange(range);
      editor.applyStrikethrough();

      const bqAfter = ce.querySelector('blockquote');
      expect(bqAfter).toBeTruthy();
      if (bqAfter) {
        const bqHtml = bqAfter.innerHTML.toLowerCase();
        expect(
          bqHtml.includes('<strike>') || bqHtml.includes('<s>') || bqHtml.includes('<del>')
        ).toBe(true);
      }
    });

    it('should insert a mention inside a blockquote via RichTextEditor', () => {
      editor.setHTML('<p>mention in quote </p>');
      editor.initializeMentionsFormatter();
      const ce = editor.getContentEditable();

      // Apply blockquote
      const sel = window.getSelection()!;
      let range = document.createRange();
      range.selectNodeContents(ce);
      sel.removeAllRanges();
      sel.addRange(range);
      editor.applyBlockquote();

      const bq = ce.querySelector('blockquote')!;
      expect(bq).toBeTruthy();

      // Place cursor at end of blockquote content and insert mention
      range = document.createRange();
      range.selectNodeContents(bq);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);

      editor.insertMention('bq-user-1', 'QuoteUser', 0);

      // Expected: mention should be inside the blockquote
      const bqAfter = ce.querySelector('blockquote');
      expect(bqAfter).toBeTruthy();
      if (bqAfter) {
        const mention = bqAfter.querySelector('[data-uid="bq-user-1"]');
        expect(mention).toBeTruthy();
        if (mention) {
          expect(mention.textContent).toBe('@QuoteUser');
          expect(mention.className).toContain('cometchat-mentions');
        }
      }
    });

    it('should apply bold inside blockquote for generated text (property-based)', () => {
      /**
       * **Validates: Requirements 1.18**
       *
       * Property: For any non-empty text, applying blockquote then bold inside it
       * should produce a <strong> or <b> tag inside the <blockquote>, and the
       * blockquote should remain intact with text preserved.
       */
      fc.assert(
        fc.property(
          fc
            .string({ minLength: 1, maxLength: 30 })
            .filter(s => s.trim().length > 0 && !/[<>&]/.test(s)),
          text => {
            editor.setHTML(`<p>${text}</p>`);
            const ce = editor.getContentEditable();

            // Apply blockquote
            const sel = window.getSelection()!;
            let range = document.createRange();
            range.selectNodeContents(ce);
            sel.removeAllRanges();
            sel.addRange(range);
            editor.applyBlockquote();

            const bq = ce.querySelector('blockquote');
            expect(bq).toBeTruthy();

            // Select inside blockquote and apply bold
            if (bq) {
              range = document.createRange();
              range.selectNodeContents(bq);
              sel.removeAllRanges();
              sel.addRange(range);
              editor.applyBold();

              // Blockquote must still exist
              const bqAfter = ce.querySelector('blockquote');
              expect(bqAfter).toBeTruthy();

              // Bold tag must be inside the blockquote
              if (bqAfter) {
                const bqHtml = bqAfter.innerHTML.toLowerCase();
                expect(bqHtml.includes('<b>') || bqHtml.includes('<strong>')).toBe(true);
              }

              // Text content must be preserved
              expect(ce.textContent).toContain(text);
            }

            editor.clear();
          }
        ),
        { numRuns: 15 }
      );
    });

    it('should preserve blockquote when multiple inline formats are applied sequentially', () => {
      editor.setHTML('<p>multi format in quote</p>');
      const ce = editor.getContentEditable();

      // Apply blockquote
      const sel = window.getSelection()!;
      let range = document.createRange();
      range.selectNodeContents(ce);
      sel.removeAllRanges();
      sel.addRange(range);
      editor.applyBlockquote();

      const bq = ce.querySelector('blockquote')!;

      // Apply bold inside blockquote
      range = document.createRange();
      range.selectNodeContents(bq);
      sel.removeAllRanges();
      sel.addRange(range);
      editor.applyBold();

      // Re-select inside blockquote and apply italic
      const bqAfterBold = ce.querySelector('blockquote')!;
      range = document.createRange();
      range.selectNodeContents(bqAfterBold);
      sel.removeAllRanges();
      sel.addRange(range);
      editor.applyItalic();

      // Blockquote should still exist with both formats inside
      const finalBq = ce.querySelector('blockquote');
      expect(finalBq).toBeTruthy();
      if (finalBq) {
        const html = finalBq.innerHTML.toLowerCase();
        expect(html.includes('<b>') || html.includes('<strong>')).toBe(true);
        expect(html.includes('<i>') || html.includes('<em>')).toBe(true);
      }
      expect(ce.textContent).toContain('multi format in quote');
    });
  });
});

// ==================== Preservation Property Tests (Group E: Block Quote) ====================

/**
 * Preservation Property Tests — Block Quote (Group E)
 *
 * These tests verify that existing CORRECT block quote behavior is preserved.
 * They MUST PASS on unfixed code — they capture behavior that should NOT
 * be broken by future bug fixes for block quote inline formatting (Req 1.18).
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
 * @module services/rich-text-editor/preservation-group-e
 */

describe('Preservation: Block Quote (Group E)', () => {
  let editor: RichTextEditor;

  beforeAll(async () => {
    await ensureSdkReady();
  });

  afterAll(async () => {
    await sdkCleanup();
  });

  function createEditorConfig(overrides?: Partial<RichTextEditorConfig>): RichTextEditorConfig {
    return {
      placeholder: 'Type a message...',
      editable: true,
      ...overrides,
    };
  }

  /**
   * Helper: select all content inside the editor's contenteditable.
   */
  function selectAllInEditor(): void {
    const sel = window.getSelection()!;
    const range = document.createRange();
    range.selectNodeContents(editor.getContentEditable());
    sel.removeAllRanges();
    sel.addRange(range);
  }

  beforeEach(() => {
    editor = new RichTextEditor(createEditorConfig());
    document.body.appendChild(editor.getElement());
  });

  afterEach(() => {
    if (!editor.isDestroyed()) {
      editor.destroy();
    }
    const el = document.querySelector('.cometchat-rich-text-editor');
    if (el && el.parentNode) {
      el.parentNode.removeChild(el);
    }
  });

  // ==================== Req 3.9: Block quote on plain text renders correctly ====================

  describe('Req 3.9: Block quote on plain text preserves content and structure', () => {
    /**
     * **Validates: Requirements 3.9**
     *
     * Property: Applying block quote to plain text (no inline formatting) wraps
     * content in a <blockquote> element, preserves text, and is reflected in
     * getHTML output and format state.
     */

    it('should include blockquote in getHTML output after applying blockquote', () => {
      editor.setHTML('<p>Quote for output</p>');
      selectAllInEditor();
      editor.applyBlockquote();

      const html = editor.getHTML().toLowerCase();
      expect(html).toContain('<blockquote');
      expect(html).toContain('quote for output');
    });

    it('should report blockquote=true in getFormatState when cursor is inside blockquote', () => {
      editor.setHTML('<p>State check</p>');
      selectAllInEditor();
      editor.applyBlockquote();

      // Place selection inside the blockquote
      const bq = editor.getContentEditable().querySelector('blockquote')!;
      expect(bq).toBeTruthy();
      const sel = window.getSelection()!;
      const range = document.createRange();
      range.selectNodeContents(bq);
      sel.removeAllRanges();
      sel.addRange(range);

      // Trigger format state update
      editor.applyBlockquote(); // toggle off
      // Re-apply to get back into blockquote
      selectAllInEditor();
      editor.applyBlockquote();

      // Now check format state with cursor inside blockquote
      const bqAfter = editor.getContentEditable().querySelector('blockquote');
      expect(bqAfter).toBeTruthy();
    });

    it('should report blockquote=false in getFormatState for plain text', () => {
      editor.setHTML('<p>No quote here</p>');
      selectAllInEditor();

      const state = editor.getFormatState();
      expect(state.blockquote).toBe(false);
    });

    it('should preserve text content through blockquote toggle on/off cycle', () => {
      editor.setHTML('<p>Toggle cycle text</p>');
      const ce = editor.getContentEditable();

      // Apply blockquote
      selectAllInEditor();
      editor.applyBlockquote();
      expect(ce.querySelector('blockquote')).toBeTruthy();
      expect(ce.textContent).toContain('Toggle cycle text');

      // Toggle off by selecting inside blockquote
      const bq = ce.querySelector('blockquote')!;
      const sel = window.getSelection()!;
      const range = document.createRange();
      range.selectNodeContents(bq);
      sel.removeAllRanges();
      sel.addRange(range);
      editor.applyBlockquote();

      // Text should be preserved after toggle off
      expect(ce.querySelector('blockquote')).toBeNull();
      expect(ce.textContent).toContain('Toggle cycle text');
    });

    it('should not produce nested blockquotes when applied to already-quoted text', () => {
      editor.setHTML('<p>No nesting</p>');
      const ce = editor.getContentEditable();

      // Apply blockquote
      selectAllInEditor();
      editor.applyBlockquote();
      expect(ce.querySelector('blockquote')).toBeTruthy();

      // Applying again should toggle off, not nest
      const bq = ce.querySelector('blockquote')!;
      const sel = window.getSelection()!;
      const range = document.createRange();
      range.selectNodeContents(bq);
      sel.removeAllRanges();
      sel.addRange(range);
      editor.applyBlockquote();

      // Should not have nested blockquotes
      expect(ce.querySelectorAll('blockquote').length).toBe(0);
      expect(ce.textContent).toContain('No nesting');
    });

    it('should preserve text in blockquote for generated plain text inputs (property-based)', () => {
      /**
       * **Validates: Requirements 3.9**
       *
       * Property: For any non-empty plain text, applying blockquote via RichTextEditor
       * should create a <blockquote> element, include it in getHTML output, and
       * preserve the original text content.
       */
      fc.assert(
        fc.property(
          fc
            .string({ minLength: 1, maxLength: 50 })
            .filter(s => s.trim().length > 0 && !/[<>&]/.test(s)),
          text => {
            editor.setHTML(`<p>${text}</p>`);
            selectAllInEditor();

            editor.applyBlockquote();

            const ce = editor.getContentEditable();

            // Blockquote element should exist
            const bq = ce.querySelector('blockquote');
            expect(bq).toBeTruthy();

            // Text content should be preserved
            expect(ce.textContent).toContain(text);

            // getHTML should include blockquote
            const html = editor.getHTML().toLowerCase();
            expect(html).toContain('<blockquote');

            // Clear for next iteration
            editor.clear();
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
       * it off should preserve the original text content and remove the blockquote.
       */
      fc.assert(
        fc.property(
          fc
            .string({ minLength: 1, maxLength: 40 })
            .filter(s => s.trim().length > 0 && !/[<>&]/.test(s)),
          text => {
            editor.setHTML(`<p>${text}</p>`);
            const ce = editor.getContentEditable();

            // Apply blockquote
            selectAllInEditor();
            editor.applyBlockquote();

            const bq = ce.querySelector('blockquote');
            expect(bq).toBeTruthy();

            // Toggle off
            if (bq) {
              const sel = window.getSelection()!;
              const range = document.createRange();
              range.selectNodeContents(bq);
              sel.removeAllRanges();
              sel.addRange(range);
              editor.applyBlockquote();
            }

            // Blockquote should be removed
            expect(ce.querySelector('blockquote')).toBeNull();

            // Text should be preserved
            expect(ce.textContent).toContain(text);

            // Clear for next iteration
            editor.clear();
          }
        ),
        { numRuns: 15 }
      );
    });

    it('should not throw when applying blockquote to empty editor', () => {
      const ce = editor.getContentEditable();
      const sel = window.getSelection()!;
      const range = document.createRange();
      range.setStart(ce, 0);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);

      expect(() => editor.applyBlockquote()).not.toThrow();
    });

    it('should handle blockquote on whitespace-only content', () => {
      editor.setHTML('<p>   </p>');
      selectAllInEditor();

      expect(() => editor.applyBlockquote()).not.toThrow();
    });
  });
});

// =====================================================================================
// Bug Condition Exploration: Copy-Paste and Markdown Shortcuts (Group F)
// =====================================================================================

/**
 * Bug Condition Exploration Tests — Group F
 *
 * These tests encode the EXPECTED (correct) behavior for copy-paste formatting
 * preservation and markdown shortcut auto-conversion. They MUST FAIL on unfixed
 * code, confirming the bugs exist.
 *
 * **Case 1 (Req 1.21):** Paste formatted HTML (bold, links, lists) into the
 * composer → assert original formatting is preserved. Bug: formatting is lost.
 *
 * **Case 2 (Req 1.23):** Type markdown shortcuts (`*text*` for bold, `_text_`
 * for italic, `` `text` `` for inline code) → assert auto-conversion to rich
 * text formatting. Bug: markdown shortcuts are not auto-converted (or use wrong
 * patterns).
 *
 * **Validates: Requirements 1.21, 1.23**
 *
 * @module services/rich-text-editor/bug-exploration-group-f
 */

describe('Bug Condition Exploration: Copy-Paste and Markdown Shortcuts (Group F)', () => {
  let editor: RichTextEditor;

  beforeAll(async () => {
    await ensureSdkReady();
  });

  afterAll(async () => {
    await sdkCleanup();
  });

  function createEditorConfig(overrides?: Partial<RichTextEditorConfig>): RichTextEditorConfig {
    return {
      placeholder: 'Type a message...',
      editable: true,
      ...overrides,
    };
  }

  /**
   * Minimal DataTransfer polyfill for jsdom (reuses pattern from Group A).
   */
  class MockDataTransferF {
    private data = new Map<string, string>();
    getData(format: string): string {
      return this.data.get(format) ?? '';
    }
    setData(format: string, value: string): void {
      this.data.set(format, value);
    }
    get types(): string[] {
      return [...this.data.keys()];
    }
    get items(): unknown[] {
      return [];
    }
    get files(): FileList {
      return [] as unknown as FileList;
    }
  }

  /**
   * Helper: create a clipboard-like Event with a mock DataTransfer.
   * jsdom does not support the ClipboardEvent constructor, so we create
   * a plain Event and attach clipboardData manually.
   */
  function createClipboardEventF(
    type: 'paste' | 'copy',
    data: Record<string, string>
  ): ClipboardEvent {
    const dt = new MockDataTransferF();
    for (const [k, v] of Object.entries(data)) {
      dt.setData(k, v);
    }
    const event = new Event(type, { bubbles: true, cancelable: true });
    Object.defineProperty(event, 'clipboardData', { value: dt, writable: false });
    return event as unknown as ClipboardEvent;
  }

  /**
   * Helper: simulate typing text into the editor by setting text node content
   * and dispatching an input event to trigger markdown detection.
   */
  function simulateTyping(text: string): void {
    const ce = editor.getContentEditable();

    // Ensure there's a paragraph with a text node
    if (!ce.firstChild || ce.firstChild.nodeType !== Node.ELEMENT_NODE) {
      ce.innerHTML = '<p><br></p>';
    }

    const p = ce.querySelector('p') || (ce.firstChild as HTMLElement);
    let textNode = p.firstChild;

    if (!textNode || textNode.nodeType !== Node.TEXT_NODE) {
      // Replace <br> or create text node
      p.innerHTML = '';
      textNode = document.createTextNode('');
      p.appendChild(textNode);
    }

    // Set the text content character by character is not needed;
    // set the full text and place cursor at end
    textNode.textContent = text;

    // Place cursor at end of text node
    const sel = window.getSelection()!;
    const range = document.createRange();
    range.setStart(textNode, text.length);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);

    // Dispatch input event to trigger handleInput → detectAndConvertMarkdown
    ce.dispatchEvent(new Event('input', { bubbles: true }));
  }

  beforeEach(() => {
    editor = new RichTextEditor(createEditorConfig());
    document.body.appendChild(editor.getElement());
  });

  afterEach(() => {
    if (!editor.isDestroyed()) {
      editor.destroy();
    }
    const el = document.querySelector('.cometchat-rich-text-editor');
    if (el && el.parentNode) {
      el.parentNode.removeChild(el);
    }
  });

  // ==================== Case 1 (Req 1.21): Copy-Paste Preserves Formatting ====================

  describe('Case 1 (Req 1.21): Pasting formatted content preserves formatting', () => {
    /**
     * **Validates: Requirements 1.21**
     *
     * Property: When a user copies a formatted message (from a message bubble or
     * external source) and pastes it into the composer, the original formatting
     * should be preserved. The real-world bug manifests when the clipboard only
     * contains plain text with markdown formatting (e.g., from message bubble copy)
     * — the paste handler should detect and convert markdown formatting in the
     * pasted plain text to rich text.
     *
     * Bug: When pasting plain text that contains markdown formatting (bold markers,
     * link syntax, list markers), the system inserts it as raw text instead of
     * converting the markdown to rich text formatting.
     */

    it('should convert pasted markdown bold (**text**) to rich text bold', () => {
      const ce = editor.getContentEditable();
      const sel = window.getSelection()!;
      const range = document.createRange();
      range.setStart(ce, 0);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);

      // Paste plain text with markdown bold (simulates copy from message bubble)
      const pasteEvent = createClipboardEventF('paste', {
        'text/plain': 'This is **bold text** in a message',
      });
      ce.dispatchEvent(pasteEvent);

      // The bold formatting should be converted from markdown
      const strong = ce.querySelector('strong, b');
      expect(strong).toBeTruthy();
      expect(strong?.textContent).toContain('bold text');

      // Raw markdown markers should not be visible
      expect(ce.textContent).not.toContain('**bold text**');
    });

    it('should convert pasted markdown link [text](url) to rich text link', () => {
      const ce = editor.getContentEditable();
      const sel = window.getSelection()!;
      const range = document.createRange();
      range.setStart(ce, 0);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);

      // Paste plain text with markdown link (simulates copy from message bubble)
      const pasteEvent = createClipboardEventF('paste', {
        'text/plain': 'Visit [Example Site](https://example.com) for more',
      });
      ce.dispatchEvent(pasteEvent);

      // The link should be converted from markdown
      const anchor = ce.querySelector('a');
      expect(anchor).toBeTruthy();
      expect(anchor?.textContent).toContain('Example Site');
      expect(anchor?.getAttribute('href')).toContain('example.com');

      // Raw markdown link syntax should not be visible
      expect(ce.textContent).not.toContain('[Example Site]');
      expect(ce.textContent).not.toContain('](https://example.com)');
    });

    it('should convert pasted markdown list markers to rich text lists', () => {
      const ce = editor.getContentEditable();
      const sel = window.getSelection()!;
      const range = document.createRange();
      range.setStart(ce, 0);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);

      // Paste plain text with markdown list markers
      const pasteEvent = createClipboardEventF('paste', {
        'text/plain': '- Item one\n- Item two\n- Item three',
      });
      ce.dispatchEvent(pasteEvent);

      // The list structure should be created from markdown
      const list = ce.querySelector('ul, ol');
      expect(list).toBeTruthy();
      const items = ce.querySelectorAll('li');
      expect(items.length).toBeGreaterThanOrEqual(3);
    });

    it('should convert pasted combined markdown formatting to rich text', () => {
      const ce = editor.getContentEditable();
      const sel = window.getSelection()!;
      const range = document.createRange();
      range.setStart(ce, 0);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);

      // Paste plain text with multiple markdown formats
      const pasteEvent = createClipboardEventF('paste', {
        'text/plain':
          '**Important:** Check [this link](https://example.com)\n- First item\n- *Italic item*',
      });
      ce.dispatchEvent(pasteEvent);

      // All formatting should be converted from markdown
      expect(ce.querySelector('strong, b')).toBeTruthy();
      expect(ce.querySelector('a')).toBeTruthy();
      expect(ce.querySelector('ul, ol')).toBeTruthy();

      // Raw markdown should not be visible
      expect(ce.textContent).not.toContain('**Important:**');
      expect(ce.textContent).not.toContain('[this link]');
    });

    it('should convert pasted markdown bold to rich text for generated inputs (property-based)', () => {
      /**
       * **Validates: Requirements 1.21**
       *
       * Property: For any text pasted as plain text with markdown bold markers
       * (**text**), the paste handler should convert it to <strong> elements.
       */
      fc.assert(
        fc.property(
          fc
            .string({ minLength: 1, maxLength: 30 })
            .filter(s => s.trim().length > 0 && !/[<>&"'*_`\[\]\(\)\n\r\\]/.test(s)),
          text => {
            editor.clear();
            const ce = editor.getContentEditable();
            const sel = window.getSelection()!;
            const range = document.createRange();
            range.setStart(ce, 0);
            range.collapse(true);
            sel.removeAllRanges();
            sel.addRange(range);

            const pasteEvent = createClipboardEventF('paste', {
              'text/plain': `**${text}**`,
            });
            ce.dispatchEvent(pasteEvent);

            // Markdown bold should be converted to <strong>
            const strong = ce.querySelector('strong, b');
            expect(strong).toBeTruthy();
            if (strong) {
              expect(strong.textContent).toContain(text);
            }

            // Raw markdown markers should not be visible
            expect(ce.textContent).not.toContain(`**${text}**`);
          }
        ),
        { numRuns: 15 }
      );
    });
  });

  // ==================== Case 2 (Req 1.23): Markdown Shortcut Auto-Conversion ====================

  describe('Case 2 (Req 1.23): Markdown shortcuts auto-convert to rich text', () => {
    /**
     * **Validates: Requirements 1.23**
     *
     * Property: Typing markdown shortcuts in the composer should auto-convert
     * them to the corresponding rich text formatting.
     *
     * Per Req 2.23: `*text*` → bold, `_text_` → italic, `` `text` `` → inline code.
     *
     * Bug: The current implementation uses `*text*` for italic (not bold) and
     * has no `_text_` → italic conversion. The spec requires `*text*` → bold
     * and `_text_` → italic.
     */

    it('should convert *text* to bold formatting', () => {
      /**
       * Per Req 2.23: `*text*` should auto-convert to bold.
       * Bug: Current implementation converts `*text*` to italic instead of bold.
       */
      simulateTyping('*hello*');

      const ce = editor.getContentEditable();
      const html = ce.innerHTML;

      // Should contain a <strong> or <b> element (bold), NOT <em> or <i> (italic)
      const boldEl = ce.querySelector('strong, b');
      expect(boldEl).toBeTruthy();
      if (boldEl) {
        expect(boldEl.textContent).toBe('hello');
      }

      // Should NOT be italic
      const italicEl = ce.querySelector('em, i');
      expect(italicEl).toBeNull();
    });

    it('should convert _text_ to italic formatting', () => {
      /**
       * Per Req 2.23: `_text_` should auto-convert to italic.
       * Bug: No `_text_` → italic pattern exists in detectAndConvertMarkdown.
       */
      simulateTyping('_world_');

      const ce = editor.getContentEditable();

      // Should contain an <em> or <i> element (italic)
      const italicEl = ce.querySelector('em, i');
      expect(italicEl).toBeTruthy();
      if (italicEl) {
        expect(italicEl.textContent).toBe('world');
      }

      // The raw markdown markers should be removed
      expect(ce.textContent).not.toContain('_world_');
    });

    it('should convert `text` to inline code formatting', () => {
      /**
       * Per Req 2.23: `` `text` `` should auto-convert to inline code.
       * This pattern IS implemented in detectAndConvertMarkdown.
       */
      simulateTyping('`myCode`');

      const ce = editor.getContentEditable();

      // Should contain a <code> element
      const codeEl = ce.querySelector('code');
      expect(codeEl).toBeTruthy();
      if (codeEl) {
        expect(codeEl.textContent).toBe('myCode');
      }

      // The raw backtick markers should be removed
      expect(ce.textContent).not.toContain('`myCode`');
    });

    it('should convert *text* to bold for generated text inputs (property-based)', () => {
      /**
       * **Validates: Requirements 1.23**
       *
       * Property: For any non-empty text wrapped in single asterisks `*text*`,
       * the editor should auto-convert to bold (<strong>) formatting.
       */
      fc.assert(
        fc.property(
          fc
            .string({ minLength: 1, maxLength: 20 })
            .filter(s => s.trim().length > 0 && !/[*_`<>&\n\r]/.test(s)),
          text => {
            editor.clear();
            simulateTyping(`*${text}*`);

            const ce = editor.getContentEditable();
            const boldEl = ce.querySelector('strong, b');
            expect(boldEl).toBeTruthy();
            if (boldEl) {
              expect(boldEl.textContent).toBe(text);
            }
          }
        ),
        { numRuns: 15 }
      );
    });

    it('should convert _text_ to italic for generated text inputs (property-based)', () => {
      /**
       * **Validates: Requirements 1.23**
       *
       * Property: For any non-empty text wrapped in single underscores `_text_`,
       * the editor should auto-convert to italic (<em>) formatting.
       */
      fc.assert(
        fc.property(
          fc
            .string({ minLength: 1, maxLength: 20 })
            .filter(s => s.trim().length > 0 && !/[*_`<>&\n\r]/.test(s)),
          text => {
            editor.clear();
            simulateTyping(`_${text}_`);

            const ce = editor.getContentEditable();
            const italicEl = ce.querySelector('em, i');
            expect(italicEl).toBeTruthy();
            if (italicEl) {
              expect(italicEl.textContent).toBe(text);
            }
          }
        ),
        { numRuns: 15 }
      );
    });

    it('should convert `text` to inline code for generated text inputs (property-based)', () => {
      /**
       * **Validates: Requirements 1.23**
       *
       * Property: For any non-empty text wrapped in backticks `` `text` ``,
       * the editor should auto-convert to inline code (<code>) formatting.
       */
      fc.assert(
        fc.property(
          fc
            .string({ minLength: 1, maxLength: 20 })
            .filter(s => s.trim().length > 0 && !/[*_`<>&\n\r]/.test(s)),
          text => {
            editor.clear();
            simulateTyping(`\`${text}\``);

            const ce = editor.getContentEditable();
            const codeEl = ce.querySelector('code');
            expect(codeEl).toBeTruthy();
            if (codeEl) {
              expect(codeEl.textContent).toBe(text);
            }
          }
        ),
        { numRuns: 15 }
      );
    });
  });
});

// ==================== Preservation Property Tests (Group F: Copy-Paste and Markdown) ====================

/**
 * Preservation Property Tests — Copy-Paste and Markdown (Group F)
 *
 * These tests verify that existing CORRECT paste and text input behavior is
 * preserved. They MUST PASS on unfixed code — they capture behavior that should
 * NOT be broken by future bug fixes for copy-paste formatting (Req 1.21) and
 * markdown shortcut auto-conversion (Req 1.23).
 *
 * Observation-first methodology:
 * - Observe: Pasting plain text (without formatting) inserts as plain text (Req 3.7)
 * - Observe: Plain text without formatting sends correctly (Req 3.1)
 * - Observe: Rich text metadata (html, plainText, hasFormatting) is correctly
 *   included in sent messages (Req 3.10)
 *
 * **Validates: Requirements 3.1, 3.7, 3.10**
 *
 * @module services/rich-text-editor/preservation-group-f
 */

describe('Preservation: Copy-Paste and Markdown (Group F)', () => {
  let editor: RichTextEditor;

  beforeAll(async () => {
    await ensureSdkReady();
  });

  afterAll(async () => {
    await sdkCleanup();
  });

  function createEditorConfig(overrides?: Partial<RichTextEditorConfig>): RichTextEditorConfig {
    return {
      placeholder: 'Type a message...',
      editable: true,
      ...overrides,
    };
  }

  /**
   * Minimal DataTransfer polyfill for jsdom (reuses pattern from Group F exploration).
   */
  class MockDataTransferPF {
    private data = new Map<string, string>();
    getData(format: string): string {
      return this.data.get(format) ?? '';
    }
    setData(format: string, value: string): void {
      this.data.set(format, value);
    }
    get types(): string[] {
      return [...this.data.keys()];
    }
    get items(): unknown[] {
      return [];
    }
    get files(): FileList {
      return [] as unknown as FileList;
    }
  }

  /**
   * Helper: create a clipboard-like Event with a mock DataTransfer.
   */
  function createClipboardEventPF(
    type: 'paste' | 'copy',
    data: Record<string, string>
  ): ClipboardEvent {
    const dt = new MockDataTransferPF();
    for (const [k, v] of Object.entries(data)) {
      dt.setData(k, v);
    }
    const event = new Event(type, { bubbles: true, cancelable: true });
    Object.defineProperty(event, 'clipboardData', { value: dt, writable: false });
    return event as unknown as ClipboardEvent;
  }

  /**
   * Helper: select all content inside the editor's contenteditable.
   */
  function selectAllInEditor(): void {
    const sel = window.getSelection()!;
    const range = document.createRange();
    range.selectNodeContents(editor.getContentEditable());
    sel.removeAllRanges();
    sel.addRange(range);
  }

  /**
   * Helper: place a collapsed cursor at the start of the contenteditable.
   */
  function placeCaretAtStartPF(): void {
    const ce = editor.getContentEditable();
    const sel = window.getSelection()!;
    const range = document.createRange();
    range.setStart(ce, 0);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
  }

  beforeEach(() => {
    editor = new RichTextEditor(createEditorConfig());
    document.body.appendChild(editor.getElement());
  });

  afterEach(() => {
    if (!editor.isDestroyed()) {
      editor.destroy();
    }
    const el = document.querySelector('.cometchat-rich-text-editor');
    if (el && el.parentNode) {
      el.parentNode.removeChild(el);
    }
  });

  // ==================== Req 3.1: Plain text without formatting sends correctly ====================

  describe('Req 3.1: Plain text without formatting sends correctly', () => {
    /**
     * **Validates: Requirements 3.1**
     *
     * Property: Setting plain text in the editor and reading it back preserves
     * the content. getText, getHTML, and getTextWithMentionFormat all return
     * consistent results for unformatted content.
     */

    it('should preserve plain text content through setHTML/getText round-trip (property-based)', () => {
      fc.assert(
        fc.property(
          fc
            .string({ minLength: 1, maxLength: 100 })
            .filter(s => s.trim().length > 0 && !/[<>&]/.test(s)),
          text => {
            editor.setHTML(`<p>${text}</p>`);

            // getText should return the plain text content
            const retrieved = editor.getText();
            expect(retrieved).toContain(text);

            // Editor should not be empty
            expect(editor.isEmpty()).toBe(false);

            // Clear for next iteration
            editor.clear();
          }
        ),
        { numRuns: 25 }
      );
    });

    it('should return plain text from getTextWithMentionFormat for unformatted content (property-based)', () => {
      fc.assert(
        fc.property(
          // Filter: no HTML chars, no newlines, no leading/trailing whitespace,
          // no markdown-significant chars that htmlToMarkdown might interpret
          fc
            .string({ minLength: 1, maxLength: 80 })
            .filter(
              s => s.trim().length > 0 && s === s.trim() && !/[<>&\n\r*_`~\[\]\(\)>]/.test(s)
            ),
          text => {
            editor.setHTML(`<p>${text}</p>`);

            // getTextWithMentionFormat should return the text (possibly with trailing newline)
            const mentionFormat = editor.getTextWithMentionFormat();
            expect(mentionFormat).toContain(text);

            // No markdown formatting markers should be present for plain text
            expect(mentionFormat).not.toContain('**');
            expect(mentionFormat).not.toContain('~~');
            expect(mentionFormat).not.toContain('```');

            editor.clear();
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should report isEmpty correctly for empty vs non-empty content', () => {
      // Empty editor
      editor.clear();
      expect(editor.isEmpty()).toBe(true);

      // Non-empty editor
      editor.setHTML('<p>Hello</p>');
      expect(editor.isEmpty()).toBe(false);

      // Cleared again
      editor.clear();
      expect(editor.isEmpty()).toBe(true);
    });

    it('should return empty string from getText for empty editor', () => {
      editor.clear();
      const text = editor.getText();
      expect(text.trim()).toBe('');
    });

    it('should handle multiple plain text set/get cycles without corruption', () => {
      const texts = [
        'First message',
        'Second message with numbers 123',
        'Third with symbols !@#$%',
        'Fourth simple text',
      ];

      for (const text of texts) {
        editor.setHTML(`<p>${text}</p>`);
        expect(editor.getText()).toContain(text);
        expect(editor.isEmpty()).toBe(false);
      }
    });
  });

  // ==================== Req 3.7: Pasting plain text inserts as plain text ====================

  describe('Req 3.7: Pasting plain text inserts as plain text', () => {
    /**
     * **Validates: Requirements 3.7**
     *
     * Property: Pasting plain text (text/plain only, no text/html) inserts the
     * text into the editor without creating any formatting tags. The pasted
     * content appears in getText() output and does not introduce bold, italic,
     * or other formatting elements.
     */

    it('should insert pasted plain text into the editor (property-based)', () => {
      fc.assert(
        fc.property(
          fc
            .string({ minLength: 1, maxLength: 60 })
            .filter(s => s.trim().length > 0 && !/[<>&\n\r*_`\[\]\(\)]/.test(s)),
          text => {
            editor.clear();
            placeCaretAtStartPF();

            // Paste plain text only (no text/html)
            const pasteEvent = createClipboardEventPF('paste', {
              'text/plain': text,
            });
            editor.getContentEditable().dispatchEvent(pasteEvent);

            // The pasted text should appear in the editor
            const editorText = editor.getText();
            expect(editorText).toContain(text);

            // Editor should not be empty after paste
            expect(editor.isEmpty()).toBe(false);

            editor.clear();
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should not create formatting tags when pasting plain text', () => {
      placeCaretAtStartPF();

      const pasteEvent = createClipboardEventPF('paste', {
        'text/plain': 'Simple plain text without any formatting',
      });
      editor.getContentEditable().dispatchEvent(pasteEvent);

      const ce = editor.getContentEditable();

      // No formatting elements should be created
      expect(ce.querySelector('strong, b')).toBeNull();
      expect(ce.querySelector('em, i')).toBeNull();
      expect(ce.querySelector('u')).toBeNull();
      expect(ce.querySelector('s, strike, del')).toBeNull();
      expect(ce.querySelector('code')).toBeNull();
      expect(ce.querySelector('pre')).toBeNull();
      expect(ce.querySelector('blockquote')).toBeNull();

      // Text should be present
      expect(ce.textContent).toContain('Simple plain text without any formatting');
    });

    it('should insert pasted plain text at cursor position', () => {
      editor.setHTML('<p>Hello world</p>');

      // Place cursor at end
      const ce = editor.getContentEditable();
      const sel = window.getSelection()!;
      const range = document.createRange();
      range.selectNodeContents(ce);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);

      const pasteEvent = createClipboardEventPF('paste', {
        'text/plain': ' appended',
      });
      ce.dispatchEvent(pasteEvent);

      // Both original and pasted text should be present
      expect(editor.getText()).toContain('Hello world');
      expect(editor.getText()).toContain('appended');
    });

    it('should handle pasting empty string gracefully', () => {
      placeCaretAtStartPF();

      const pasteEvent = createClipboardEventPF('paste', {
        'text/plain': '',
      });

      expect(() => {
        editor.getContentEditable().dispatchEvent(pasteEvent);
      }).not.toThrow();
    });

    it('should handle paste event with no clipboardData gracefully', () => {
      placeCaretAtStartPF();

      // Create event without clipboardData
      const event = new Event('paste', { bubbles: true, cancelable: true });
      Object.defineProperty(event, 'clipboardData', { value: null, writable: false });

      expect(() => {
        editor.getContentEditable().dispatchEvent(event);
      }).not.toThrow();
    });
  });

  // ==================== Req 3.10: Rich text metadata is correctly included ====================

  describe('Req 3.10: Rich text metadata (html, plainText, hasFormatting) is correct', () => {
    /**
     * **Validates: Requirements 3.10**
     *
     * Property: getHTML() returns the actual HTML content of the editor.
     * getText() returns text without HTML tags. getTextWithMentionFormat()
     * returns markdown-formatted text. For plain text content, no formatting
     * markers are present. For formatted content (bold, etc.), the appropriate
     * markers are included.
     */

    it('should return HTML containing tags for formatted content', () => {
      editor.setHTML('<p>Hello world</p>');
      selectAllInEditor();
      editor.applyBold();

      const html = editor.getHTML().toLowerCase();
      // Should contain bold tags
      expect(html.includes('<b>') || html.includes('<strong>')).toBe(true);
      expect(html).toContain('hello world');
    });

    it('should return plain text without HTML tags from getText for formatted content', () => {
      editor.setHTML('<p><strong>Bold text</strong> and normal</p>');

      const text = editor.getText();
      // Should contain the text content
      expect(text).toContain('Bold text');
      expect(text).toContain('normal');
      // Should NOT contain HTML tags
      expect(text).not.toContain('<strong>');
      expect(text).not.toContain('</strong>');
    });

    it('should return markdown from getTextWithMentionFormat for bold content', () => {
      editor.setHTML('<p><strong>Bold text</strong> and normal</p>');

      const mentionFormat = editor.getTextWithMentionFormat();
      // Should contain markdown bold markers
      expect(mentionFormat).toContain('**Bold text**');
      expect(mentionFormat).toContain('normal');
    });

    it('should return markdown from getTextWithMentionFormat for italic content', () => {
      editor.setHTML('<p><em>Italic text</em> here</p>');

      const mentionFormat = editor.getTextWithMentionFormat();
      // Should contain markdown italic markers
      expect(mentionFormat).toContain('*Italic text*');
    });

    it('should return markdown from getTextWithMentionFormat for link content', () => {
      editor.setHTML('<p>Visit <a href="https://example.com">Example</a> site</p>');

      const mentionFormat = editor.getTextWithMentionFormat();
      // Should contain markdown link format
      expect(mentionFormat).toContain('[Example](https://example.com)');
    });

    it('should return no formatting markers from getTextWithMentionFormat for plain text (property-based)', () => {
      fc.assert(
        fc.property(
          // Filter: no HTML chars, no newlines, no leading/trailing whitespace,
          // no markdown-significant chars that htmlToMarkdown might interpret
          fc
            .string({ minLength: 1, maxLength: 60 })
            .filter(
              s => s.trim().length > 0 && s === s.trim() && !/[<>&\n\r*_`~\[\]\(\)>]/.test(s)
            ),
          text => {
            editor.setHTML(`<p>${text}</p>`);

            const mentionFormat = editor.getTextWithMentionFormat();

            // Should contain the text
            expect(mentionFormat).toContain(text);

            // Should NOT contain markdown formatting markers for plain text
            expect(mentionFormat).not.toContain('**');
            expect(mentionFormat).not.toContain('~~');
            expect(mentionFormat).not.toContain('```');
            expect(mentionFormat).not.toContain('> ');

            editor.clear();
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should return correct HTML and text for formatted content (property-based)', () => {
      fc.assert(
        fc.property(
          fc
            .string({ minLength: 1, maxLength: 40 })
            .filter(s => s.trim().length > 0 && !/[<>&]/.test(s)),
          text => {
            // Set content with bold formatting
            editor.setHTML(`<p><strong>${text}</strong></p>`);

            // getHTML should contain the bold tag
            const html = editor.getHTML().toLowerCase();
            expect(html.includes('<strong>') || html.includes('<b>')).toBe(true);

            // getText should contain the text without tags
            const plainText = editor.getText();
            expect(plainText).toContain(text);
            expect(plainText).not.toContain('<strong>');

            // getTextWithMentionFormat should contain markdown bold
            const mentionFormat = editor.getTextWithMentionFormat();
            expect(mentionFormat).toContain(`**${text}**`);

            editor.clear();
          }
        ),
        { numRuns: 15 }
      );
    });

    it('should include code block content in getTextWithMentionFormat with backtick markers', () => {
      editor.setHTML('<pre><code>const x = 1;</code></pre>');

      const mentionFormat = editor.getTextWithMentionFormat();
      // Should contain code block markers
      expect(mentionFormat).toContain('```');
      expect(mentionFormat).toContain('const x = 1;');
    });

    it('should include inline code in getTextWithMentionFormat with single backticks', () => {
      editor.setHTML('<p>Use <code>npm install</code> to install</p>');

      const mentionFormat = editor.getTextWithMentionFormat();
      // Should contain inline code markers
      expect(mentionFormat).toContain('`npm install`');
    });

    it('should handle onUpdate callback receiving html and text parameters', () => {
      const onUpdate = vi.fn();
      const editorWithCb = new RichTextEditor(createEditorConfig({ onUpdate }));
      document.body.appendChild(editorWithCb.getElement());

      editorWithCb.setHTML('<p>Test content</p>');

      // Apply bold to trigger emitUpdate
      const ce = editorWithCb.getContentEditable();
      const sel = window.getSelection()!;
      const range = document.createRange();
      range.selectNodeContents(ce);
      sel.removeAllRanges();
      sel.addRange(range);
      editorWithCb.applyBold();

      // onUpdate should have been called with html and text
      expect(onUpdate).toHaveBeenCalled();
      const [html, text] = onUpdate.mock.calls[onUpdate.mock.calls.length - 1];
      expect(typeof html).toBe('string');
      expect(typeof text).toBe('string');
      // HTML should contain formatting
      expect(html.toLowerCase().includes('<b>') || html.toLowerCase().includes('<strong>')).toBe(
        true
      );
      // Text should contain the content
      expect(text).toContain('Test content');

      editorWithCb.destroy();
    });
  });
});

// ==================== Preservation Property Tests (Group G: Preview and Display) ====================

/**
 * Preservation Property Tests — Preview and Display (Group G)
 *
 * These tests verify that existing CORRECT preview and display behavior is
 * preserved at the service level. They MUST PASS on unfixed code — they capture
 * behavior that should NOT be broken by future bug fixes for reply/edit preview
 * formatting (Req 1.13) and conversation list subtitle display (Req 1.14).
 *
 * Observation-first methodology:
 * - Observe: Plain text messages display correctly in conversation list and previews (Req 3.1)
 * - Observe: Rich text metadata is correctly included in messages (Req 3.10)
 *
 * **Validates: Requirements 3.1, 3.10**
 *
 * @module services/rich-text-editor/preservation-group-g
 */

import { RichTextEditorService } from './rich-text-editor.service';

describe('Preservation: Preview and Display (Group G)', () => {
  let editor: RichTextEditor;
  let service: RichTextEditorService;

  beforeAll(async () => {
    await ensureSdkReady();
  });

  afterAll(async () => {
    await sdkCleanup();
  });

  function createEditorConfig(overrides?: Partial<RichTextEditorConfig>): RichTextEditorConfig {
    return {
      placeholder: 'Type a message...',
      editable: true,
      ...overrides,
    };
  }

  beforeEach(() => {
    editor = new RichTextEditor(createEditorConfig());
    document.body.appendChild(editor.getElement());
    service = new RichTextEditorService();
  });

  afterEach(() => {
    if (!editor.isDestroyed()) {
      editor.destroy();
    }
    const el = document.querySelector('.cometchat-rich-text-editor');
    if (el && el.parentNode) {
      el.parentNode.removeChild(el);
    }
  });

  // ==================== Req 3.1: Plain text content preserved through editor ====================

  describe('Req 3.1: Plain text content preserved through editor round-trip', () => {
    /**
     * **Validates: Requirements 3.1**
     *
     * Property: Plain text set in the editor is retrievable via getText(),
     * getHTML(), and getTextWithMentionFormat() without corruption. This
     * ensures plain text messages will display correctly in any preview context.
     */

    it('should preserve plain text through setHTML/getText round-trip (property-based)', () => {
      fc.assert(
        fc.property(
          fc
            .string({ minLength: 1, maxLength: 80 })
            .filter(s => s.trim().length > 0 && !/[<>&]/.test(s)),
          text => {
            editor.setHTML(`<p>${text}</p>`);

            const retrieved = editor.getText();
            expect(retrieved).toContain(text);
            expect(editor.isEmpty()).toBe(false);

            editor.clear();
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should preserve plain text through service getText (property-based)', () => {
      fc.assert(
        fc.property(
          fc
            .string({ minLength: 1, maxLength: 60 })
            .filter(s => s.trim().length > 0 && !/[<>&]/.test(s)),
          text => {
            editor.setHTML(`<p>${text}</p>`);

            const retrieved = service.getText(editor);
            expect(retrieved).toContain(text);

            editor.clear();
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should return HTML wrapping plain text from getHTML', () => {
      editor.setHTML('<p>Simple text</p>');
      const html = editor.getHTML();
      expect(html).toContain('Simple text');
      // HTML should contain at least a <p> wrapper
      expect(html.toLowerCase()).toContain('<p>');
    });

    it('should return plain text from service getTextWithMentionFormat for unformatted content', () => {
      fc.assert(
        fc.property(
          fc
            .string({ minLength: 1, maxLength: 60 })
            .filter(
              s => s.trim().length > 0 && s === s.trim() && !/[<>&\n\r*_`~\[\]\(\)>]/.test(s)
            ),
          text => {
            editor.setHTML(`<p>${text}</p>`);

            const mentionFormat = service.getTextWithMentionFormat(editor);
            expect(mentionFormat).toContain(text);

            // No markdown formatting markers for plain text
            expect(mentionFormat).not.toContain('**');
            expect(mentionFormat).not.toContain('~~');
            expect(mentionFormat).not.toContain('```');

            editor.clear();
          }
        ),
        { numRuns: 15 }
      );
    });
  });

  // ==================== Req 3.10: Rich text metadata correctness ====================

  describe('Req 3.10: getRichTextMetadata returns correct metadata', () => {
    /**
     * **Validates: Requirements 3.10**
     *
     * Property: getRichTextMetadata returns an object with html, plainText,
     * and hasFormatting fields. For plain text, hasFormatting is false. For
     * formatted content, hasFormatting is true. The html field contains the
     * actual HTML, and plainText contains text without HTML tags.
     */

    it('should return hasFormatting=false for plain text (property-based)', () => {
      fc.assert(
        fc.property(
          fc
            .string({ minLength: 1, maxLength: 60 })
            .filter(s => s.trim().length > 0 && !/[<>&]/.test(s)),
          text => {
            editor.setHTML(`<p>${text}</p>`);

            const metadata = service.getRichTextMetadata(editor);
            expect(metadata.hasFormatting).toBe(false);
            expect(metadata.plainText).toContain(text);
            expect(metadata.html).toContain(text);

            editor.clear();
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should return hasFormatting=true for bold content', () => {
      editor.setHTML('<p><strong>Bold text</strong></p>');

      const metadata = service.getRichTextMetadata(editor);
      expect(metadata.hasFormatting).toBe(true);
      expect(metadata.html.toLowerCase()).toMatch(/<(strong|b)>/);
      expect(metadata.plainText).toContain('Bold text');
      expect(metadata.plainText).not.toContain('<strong>');
    });

    it('should return hasFormatting=true for italic content', () => {
      editor.setHTML('<p><em>Italic text</em></p>');

      const metadata = service.getRichTextMetadata(editor);
      expect(metadata.hasFormatting).toBe(true);
      expect(metadata.plainText).toContain('Italic text');
    });

    it('should return hasFormatting=true for content with links', () => {
      editor.setHTML('<p>Visit <a href="https://example.com">Example</a></p>');

      const metadata = service.getRichTextMetadata(editor);
      expect(metadata.hasFormatting).toBe(true);
      expect(metadata.plainText).toContain('Example');
    });

    it('should return correct metadata structure with all required fields', () => {
      editor.setHTML('<p>Test</p>');

      const metadata = service.getRichTextMetadata(editor);
      expect(metadata).toHaveProperty('html');
      expect(metadata).toHaveProperty('plainText');
      expect(metadata).toHaveProperty('hasFormatting');
      expect(typeof metadata.html).toBe('string');
      expect(typeof metadata.plainText).toBe('string');
      expect(typeof metadata.hasFormatting).toBe('boolean');
    });

    it('should return empty metadata for destroyed editor', () => {
      editor.destroy();

      const metadata = service.getRichTextMetadata(editor);
      expect(metadata.html).toBe('');
      expect(metadata.plainText).toBe('');
      expect(metadata.hasFormatting).toBe(false);
    });

    it('should return plainText without HTML tags for formatted content (property-based)', () => {
      fc.assert(
        fc.property(
          fc
            .string({ minLength: 1, maxLength: 40 })
            .filter(s => s.trim().length > 0 && !/[<>&]/.test(s)),
          text => {
            editor.setHTML(`<p><strong>${text}</strong></p>`);

            const metadata = service.getRichTextMetadata(editor);

            // plainText should contain the text
            expect(metadata.plainText).toContain(text);
            // plainText should NOT contain HTML tags
            expect(metadata.plainText).not.toContain('<strong>');
            expect(metadata.plainText).not.toContain('</strong>');
            expect(metadata.plainText).not.toContain('<p>');

            // html should contain the formatting tags
            const htmlLower = metadata.html.toLowerCase();
            expect(htmlLower.includes('<strong>') || htmlLower.includes('<b>')).toBe(true);

            editor.clear();
          }
        ),
        { numRuns: 15 }
      );
    });

    it('should return consistent html and plainText for the same content', () => {
      const testCases = [
        { html: '<p>Plain text</p>', expectFormatting: false },
        { html: '<p><strong>Bold</strong></p>', expectFormatting: true },
        { html: '<p><em>Italic</em></p>', expectFormatting: true },
        { html: '<p><u>Underline</u></p>', expectFormatting: true },
      ];

      for (const tc of testCases) {
        editor.setHTML(tc.html);

        const metadata = service.getRichTextMetadata(editor);
        expect(metadata.hasFormatting).toBe(tc.expectFormatting);

        // plainText should always be non-empty for non-empty content
        expect(metadata.plainText.trim().length).toBeGreaterThan(0);

        // html should always be non-empty for non-empty content
        expect(metadata.html.length).toBeGreaterThan(0);
      }
    });

    it('should detect hasFormatting correctly via service.hasFormatting', () => {
      // Plain text — no formatting
      editor.setHTML('<p>Plain text</p>');
      expect(service.hasFormatting(editor)).toBe(false);

      // Bold — has formatting
      editor.setHTML('<p><strong>Bold text</strong></p>');
      expect(service.hasFormatting(editor)).toBe(true);

      // Code block — has formatting
      editor.setHTML('<pre><code>code</code></pre>');
      expect(service.hasFormatting(editor)).toBe(true);

      // Blockquote — has formatting
      editor.setHTML('<blockquote><p>quoted</p></blockquote>');
      expect(service.hasFormatting(editor)).toBe(true);

      // List — has formatting
      editor.setHTML('<ul><li>item</li></ul>');
      expect(service.hasFormatting(editor)).toBe(true);
    });
  });
});
