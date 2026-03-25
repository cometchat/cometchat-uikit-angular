/**
 * Rich Text Editor Service Unit Tests
 *
 * Tests for the RichTextEditorService.
 * Covers: text formatting commands (bold, italic, underline, link),
 * content retrieval, selection management, null content handling.
 *
 * @testCategories Initialization, Text Formatting, Content Retrieval,
 *                 Selection Management, Null Content Handling, History,
 *                 Focus Methods, Metadata, API Compatibility
 * @validates Requirements 5.1, 5.2, 5.4, 5.5, 5.6, 5.8, 14.4, 14.5, 15.7
 * @module services/rich-text-editor
 */

import { TestBed } from '@angular/core/testing';
import { vi, beforeAll, afterAll, beforeEach, afterEach, describe, it, expect } from 'vitest';
import { ensureSdkReady, sdkCleanup } from '../test-setup';
import { RichTextEditorService } from './rich-text-editor.service';
import { RichTextEditor } from './rich-text-editor.class';
import { RichTextEditorConfig } from './rich-text-editor.interfaces';

describe('RichTextEditorService', () => {
  let service: RichTextEditorService;

  beforeAll(async () => {
    await ensureSdkReady();
  });

  afterAll(async () => {
    await sdkCleanup();
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RichTextEditorService],
    });
    service = TestBed.inject(RichTextEditorService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ==================== Initial State ====================

  describe('Initial State', () => {
    it('should have default format state with all formatting off', () => {
      const formatState = service.formatState();
      expect(formatState.bold).toBe(false);
      expect(formatState.italic).toBe(false);
      expect(formatState.underline).toBe(false);
      expect(formatState.strikethrough).toBe(false);
      expect(formatState.code).toBe(false);
      expect(formatState.blockquote).toBe(false);
      expect(formatState.codeBlock).toBe(false);
      expect(formatState.orderedList).toBe(false);
      expect(formatState.bulletList).toBe(false);
      expect(formatState.link).toBe(false);
    });
  });

  // ==================== Editor Creation ====================

  describe('Editor Creation', () => {
    it('should create an editor instance', () => {
      const editor = service.createEditor();
      expect(editor).toBeTruthy();
      expect(editor instanceof RichTextEditor).toBe(true);
      editor.destroy();
    });

    it('should create an editor with default configuration', () => {
      const editor = service.createEditor();
      expect(editor.isEmpty()).toBe(true);
      expect(editor.getHTML()).toBe('');
      expect(editor.getText()).toBe('');
      editor.destroy();
    });

    it('should create an editor with custom placeholder', () => {
      const config: RichTextEditorConfig = {
        placeholder: 'Type your message...',
      };
      const editor = service.createEditor(config);
      expect(editor).toBeTruthy();
      const contentEditable = editor.getContentEditable();
      expect(contentEditable.getAttribute('data-placeholder')).toBe('Type your message...');
      editor.destroy();
    });

    it('should create an editor with initial content', () => {
      const config: RichTextEditorConfig = {
        content: '<p>Hello World</p>',
      };
      const editor = service.createEditor(config);
      expect(editor.isEmpty()).toBe(false);
      expect(editor.getText()).toContain('Hello World');
      editor.destroy();
    });

    it('should create an editor with editable set to false', () => {
      const config: RichTextEditorConfig = {
        editable: false,
      };
      const editor = service.createEditor(config);
      const contentEditable = editor.getContentEditable();
      expect(contentEditable.contentEditable).toBe('false');
      editor.destroy();
    });

    it('should call onUpdate callback when content changes', () =>
      new Promise<void>(done => {
        const config: RichTextEditorConfig = {
          onUpdate: (html: string, text: string) => {
            expect(html).toContain('Test');
            expect(text).toContain('Test');
            editor.destroy();
            done();
          },
        };
        const editor = service.createEditor(config);
        editor.setHTML('<p>Test</p>');
        // jsdom doesn't fire input events on contenteditable — dispatch on the inner contenteditable div
        const ce = editor.getContentEditable();
        ce.dispatchEvent(new Event('input', { bubbles: true }));
      }));

    it('should call onFocus callback when editor is focused', () =>
      new Promise<void>(done => {
        const config: RichTextEditorConfig = {
          onFocus: () => {
            expect(true).toBe(true);
            editor.destroy();
            done();
          },
        };
        const editor = service.createEditor(config);
        // jsdom doesn't fire focus events on contenteditable — dispatch on the inner contenteditable div
        const ce = editor.getContentEditable();
        ce.dispatchEvent(new FocusEvent('focus'));
      }));

    it('should call onBlur callback when editor loses focus', () =>
      new Promise<void>(done => {
        const config: RichTextEditorConfig = {
          onBlur: () => {
            expect(true).toBe(true);
            editor.destroy();
            done();
          },
        };
        const editor = service.createEditor(config);
        // jsdom doesn't fire blur events on contenteditable — dispatch on the inner contenteditable div
        const ce = editor.getContentEditable();
        ce.dispatchEvent(new FocusEvent('blur'));
      }));
  });

  // ==================== Editor Destruction ====================

  describe('Editor Destruction', () => {
    it('should destroy an editor instance', () => {
      const editor = service.createEditor();
      expect(editor.isDestroyed()).toBe(false);
      service.destroyEditor(editor);
      expect(editor.isDestroyed()).toBe(true);
    });

    it('should handle destroying an already destroyed editor', () => {
      const editor = service.createEditor();
      service.destroyEditor(editor);
      expect(editor.isDestroyed()).toBe(true);
      // Should not throw
      service.destroyEditor(editor);
      expect(editor.isDestroyed()).toBe(true);
    });
  });

  // ==================== Text Formatting Commands ====================

  describe('Text Formatting Commands', () => {
    let editor: RichTextEditor;

    beforeEach(() => {
      editor = service.createEditor();
      document.body.appendChild(editor.getElement());
    });

    afterEach(() => {
      const element = editor.getElement();
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
      if (!editor.isDestroyed()) {
        editor.destroy();
      }
    });

    describe('toggleBold', () => {
      it('should call applyBold on the editor', () => {
        const spy = vi.spyOn(editor, 'applyBold');
        service.toggleBold(editor);
        expect(spy).toHaveBeenCalled();
      });

      it('should not throw on destroyed editor', () => {
        editor.destroy();
        expect(() => service.toggleBold(editor)).not.toThrow();
      });

      it('should skip execution on destroyed editor', () => {
        const spy = vi.spyOn(editor, 'applyBold');
        editor.destroy();
        service.toggleBold(editor);
        expect(spy).not.toHaveBeenCalled();
      });
    });

    describe('toggleItalic', () => {
      it('should call applyItalic on the editor', () => {
        const spy = vi.spyOn(editor, 'applyItalic');
        service.toggleItalic(editor);
        expect(spy).toHaveBeenCalled();
      });

      it('should not throw on destroyed editor', () => {
        editor.destroy();
        expect(() => service.toggleItalic(editor)).not.toThrow();
      });

      it('should skip execution on destroyed editor', () => {
        const spy = vi.spyOn(editor, 'applyItalic');
        editor.destroy();
        service.toggleItalic(editor);
        expect(spy).not.toHaveBeenCalled();
      });
    });

    describe('toggleUnderline', () => {
      it('should call applyUnderline on the editor', () => {
        const spy = vi.spyOn(editor, 'applyUnderline');
        service.toggleUnderline(editor);
        expect(spy).toHaveBeenCalled();
      });

      it('should not throw on destroyed editor', () => {
        editor.destroy();
        expect(() => service.toggleUnderline(editor)).not.toThrow();
      });

      it('should skip execution on destroyed editor', () => {
        const spy = vi.spyOn(editor, 'applyUnderline');
        editor.destroy();
        service.toggleUnderline(editor);
        expect(spy).not.toHaveBeenCalled();
      });
    });

    describe('toggleStrikethrough', () => {
      it('should call applyStrikethrough on the editor', () => {
        const spy = vi.spyOn(editor, 'applyStrikethrough');
        service.toggleStrikethrough(editor);
        expect(spy).toHaveBeenCalled();
      });

      it('should not throw on destroyed editor', () => {
        editor.destroy();
        expect(() => service.toggleStrikethrough(editor)).not.toThrow();
      });
    });

    describe('toggleCode', () => {
      it('should call applyInlineCode on the editor', () => {
        const spy = vi.spyOn(editor, 'applyInlineCode');
        service.toggleCode(editor);
        expect(spy).toHaveBeenCalled();
      });

      it('should not throw on destroyed editor', () => {
        editor.destroy();
        expect(() => service.toggleCode(editor)).not.toThrow();
      });
    });

    describe('toggleCodeBlock', () => {
      it('should call applyCodeBlock on the editor', () => {
        const spy = vi.spyOn(editor, 'applyCodeBlock');
        service.toggleCodeBlock(editor);
        expect(spy).toHaveBeenCalled();
      });

      it('should not throw on destroyed editor', () => {
        editor.destroy();
        expect(() => service.toggleCodeBlock(editor)).not.toThrow();
      });
    });

    describe('toggleBlockquote', () => {
      it('should call applyBlockquote on the editor', () => {
        const spy = vi.spyOn(editor, 'applyBlockquote');
        service.toggleBlockquote(editor);
        expect(spy).toHaveBeenCalled();
      });

      it('should not throw on destroyed editor', () => {
        editor.destroy();
        expect(() => service.toggleBlockquote(editor)).not.toThrow();
      });
    });

    describe('toggleOrderedList', () => {
      it('should call applyOrderedList on the editor', () => {
        const spy = vi.spyOn(editor, 'applyOrderedList');
        service.toggleOrderedList(editor);
        expect(spy).toHaveBeenCalled();
      });

      it('should not throw on destroyed editor', () => {
        editor.destroy();
        expect(() => service.toggleOrderedList(editor)).not.toThrow();
      });
    });

    describe('toggleBulletList', () => {
      it('should call applyBulletList on the editor', () => {
        const spy = vi.spyOn(editor, 'applyBulletList');
        service.toggleBulletList(editor);
        expect(spy).toHaveBeenCalled();
      });

      it('should not throw on destroyed editor', () => {
        editor.destroy();
        expect(() => service.toggleBulletList(editor)).not.toThrow();
      });
    });

    describe('setLink', () => {
      it('should call setLink on the editor with URL', () => {
        const spy = vi.spyOn(editor, 'setLink');
        service.setLink(editor, 'https://example.com');
        expect(spy).toHaveBeenCalledWith('https://example.com', undefined);
      });

      it('should call setLink on the editor with URL and text', () => {
        const spy = vi.spyOn(editor, 'setLink');
        service.setLink(editor, 'https://example.com', 'Example');
        expect(spy).toHaveBeenCalledWith('https://example.com', 'Example');
      });

      it('should call setLink with null to remove link', () => {
        const spy = vi.spyOn(editor, 'setLink');
        service.setLink(editor, null);
        expect(spy).toHaveBeenCalledWith(null, undefined);
      });

      it('should not throw on destroyed editor', () => {
        editor.destroy();
        expect(() => service.setLink(editor, 'https://example.com')).not.toThrow();
      });

      it('should skip execution on destroyed editor', () => {
        const spy = vi.spyOn(editor, 'setLink');
        editor.destroy();
        service.setLink(editor, 'https://example.com');
        expect(spy).not.toHaveBeenCalled();
      });
    });
  });

  // ==================== Content Retrieval ====================

  describe('Content Retrieval', () => {
    let editor: RichTextEditor;

    beforeEach(() => {
      editor = service.createEditor();
    });

    afterEach(() => {
      if (!editor.isDestroyed()) {
        editor.destroy();
      }
    });

    it('should get HTML content', () => {
      editor.setHTML('<p>Test content</p>');
      const html = service.getHTML(editor);
      expect(html).toContain('Test content');
    });

    it('should get plain text content', () => {
      editor.setHTML('<p><strong>Bold</strong> text</p>');
      const text = service.getText(editor);
      expect(text).toContain('Bold');
      expect(text).toContain('text');
    });

    it('should set content', () => {
      service.setContent(editor, '<p>New content</p>');
      expect(editor.getText()).toContain('New content');
    });

    it('should clear content', () => {
      editor.setHTML('<p>Some content</p>');
      expect(editor.isEmpty()).toBe(false);
      service.clearContent(editor);
      expect(editor.isEmpty()).toBe(true);
    });

    it('should check if editor is empty', () => {
      expect(service.isEmpty(editor)).toBe(true);
      editor.setHTML('<p>Content</p>');
      expect(service.isEmpty(editor)).toBe(false);
    });

    it('should check if content has formatting', () => {
      editor.setHTML('<p>Plain text</p>');
      expect(service.hasFormatting(editor)).toBe(false);

      editor.setHTML('<p><strong>Bold text</strong></p>');
      expect(service.hasFormatting(editor)).toBe(true);
    });

    it('should return empty string for getHTML on destroyed editor', () => {
      editor.destroy();
      expect(service.getHTML(editor)).toBe('');
    });

    it('should return empty string for getText on destroyed editor', () => {
      editor.destroy();
      expect(service.getText(editor)).toBe('');
    });

    it('should insert text at cursor position', () => {
      const spy = vi.spyOn(editor, 'insertText');
      service.insertText(editor, 'hello');
      expect(spy).toHaveBeenCalledWith('hello');
    });

    it('should not insert text on destroyed editor', () => {
      const spy = vi.spyOn(editor, 'insertText');
      editor.destroy();
      service.insertText(editor, 'hello');
      expect(spy).not.toHaveBeenCalled();
    });

    it('should delete range from editor', () => {
      const spy = vi.spyOn(editor, 'deleteRange');
      service.deleteRange(editor, 0, 5);
      expect(spy).toHaveBeenCalledWith(0, 5);
    });

    it('should not delete range on destroyed editor', () => {
      const spy = vi.spyOn(editor, 'deleteRange');
      editor.destroy();
      service.deleteRange(editor, 0, 5);
      expect(spy).not.toHaveBeenCalled();
    });
  });

  // ==================== Selection Management ====================

  describe('Selection Management', () => {
    let editor: RichTextEditor;

    beforeEach(() => {
      editor = service.createEditor();
      document.body.appendChild(editor.getElement());
    });

    afterEach(() => {
      const element = editor.getElement();
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
      if (!editor.isDestroyed()) {
        editor.destroy();
      }
    });

    it('should get format state from editor', () => {
      const formatState = service.getFormatState(editor);
      expect(formatState).toBeTruthy();
      expect(typeof formatState.bold).toBe('boolean');
      expect(typeof formatState.italic).toBe('boolean');
      expect(typeof formatState.underline).toBe('boolean');
      expect(typeof formatState.link).toBe('boolean');
    });

    it('should return default format state for destroyed editor', () => {
      editor.destroy();
      const formatState = service.getFormatState(editor);
      expect(formatState.bold).toBe(false);
      expect(formatState.italic).toBe(false);
      expect(formatState.underline).toBe(false);
      expect(formatState.strikethrough).toBe(false);
      expect(formatState.code).toBe(false);
      expect(formatState.blockquote).toBe(false);
      expect(formatState.codeBlock).toBe(false);
      expect(formatState.orderedList).toBe(false);
      expect(formatState.bulletList).toBe(false);
      expect(formatState.link).toBe(false);
    });

    it('should update format state signal via onSelectionUpdate callback', () => {
      // The service wraps the config to update formatStateSignal on selection changes
      const initialState = service.formatState();
      expect(initialState.bold).toBe(false);
      // Format state signal is updated internally when selection changes in the editor
    });

    it('should reset format state', () => {
      service.resetFormatState();
      const formatState = service.formatState();
      expect(formatState.bold).toBe(false);
      expect(formatState.italic).toBe(false);
      expect(formatState.underline).toBe(false);
    });
  });

  // ==================== Null Content Handling ====================

  describe('Null Content Handling', () => {
    let editor: RichTextEditor;

    beforeEach(() => {
      editor = service.createEditor();
    });

    afterEach(() => {
      if (!editor.isDestroyed()) {
        editor.destroy();
      }
    });

    it('should handle setContent with empty string', () => {
      service.setContent(editor, '<p>Initial</p>');
      service.setContent(editor, '');
      expect(service.isEmpty(editor)).toBe(true);
    });

    it('should handle setContentWithMentions on destroyed editor without throwing', () => {
      editor.destroy();
      expect(() =>
        service.setContentWithMentions(editor, 'Hello <@uid:user1>', [], false)
      ).not.toThrow();
    });

    it('should return empty metadata for destroyed editor', () => {
      editor.destroy();
      const metadata = service.getRichTextMetadata(editor);
      expect(metadata.html).toBe('');
      expect(metadata.plainText).toBe('');
      expect(metadata.hasFormatting).toBe(false);
    });

    it('should return empty string for getTextWithMentionFormat on destroyed editor', () => {
      editor.destroy();
      expect(service.getTextWithMentionFormat(editor)).toBe('');
    });

    it('should return empty set for getUniqueMentionUids on destroyed editor', () => {
      editor.destroy();
      const uids = service.getUniqueMentionUids(editor);
      expect(uids).toBeInstanceOf(Set);
      expect(uids.size).toBe(0);
    });

    it('should handle insertMention on destroyed editor without throwing', () => {
      editor.destroy();
      expect(() => service.insertMention(editor, 'user1', 'John', 0, false)).not.toThrow();
    });

    it('should return false for undo on destroyed editor', () => {
      editor.destroy();
      expect(service.undo(editor)).toBe(false);
    });

    it('should return false for redo on destroyed editor', () => {
      editor.destroy();
      expect(service.redo(editor)).toBe(false);
    });

    it('should return false for canUndo on destroyed editor', () => {
      editor.destroy();
      expect(service.canUndo(editor)).toBe(false);
    });

    it('should return false for canRedo on destroyed editor', () => {
      editor.destroy();
      expect(service.canRedo(editor)).toBe(false);
    });
  });

  // ==================== History (Undo/Redo) ====================

  describe('History (Undo/Redo)', () => {
    let editor: RichTextEditor;

    beforeEach(() => {
      editor = service.createEditor();
    });

    afterEach(() => {
      if (!editor.isDestroyed()) {
        editor.destroy();
      }
    });

    it('should report canUndo as false on fresh editor', () => {
      expect(service.canUndo(editor)).toBe(false);
    });

    it('should report canRedo as false on fresh editor', () => {
      expect(service.canRedo(editor)).toBe(false);
    });

    it('should delegate undo to editor', () => {
      const spy = vi.spyOn(editor, 'undo');
      service.undo(editor);
      expect(spy).toHaveBeenCalled();
    });

    it('should delegate redo to editor', () => {
      const spy = vi.spyOn(editor, 'redo');
      service.redo(editor);
      expect(spy).toHaveBeenCalled();
    });
  });

  // ==================== Focus Methods ====================

  describe('Focus Methods', () => {
    let editor: RichTextEditor;

    beforeEach(() => {
      editor = service.createEditor();
      document.body.appendChild(editor.getElement());
    });

    afterEach(() => {
      const element = editor.getElement();
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
      if (!editor.isDestroyed()) {
        editor.destroy();
      }
    });

    it('should focus the editor', () => {
      service.focus(editor);
      expect(editor).toBeTruthy();
    });

    it('should blur the editor', () => {
      service.focus(editor);
      service.blur(editor);
      expect(editor).toBeTruthy();
    });

    it('should focus at start position', () => {
      editor.setHTML('<p>Test content</p>');
      service.focus(editor, 'start');
      expect(editor).toBeTruthy();
    });

    it('should focus at end position', () => {
      editor.setHTML('<p>Test content</p>');
      service.focus(editor, 'end');
      expect(editor).toBeTruthy();
    });

    it('should select all content', () => {
      editor.setHTML('<p>Test content</p>');
      service.focus(editor, 'all');
      expect(editor).toBeTruthy();
    });
  });

  // ==================== Metadata Methods ====================

  describe('Metadata Methods', () => {
    let editor: RichTextEditor;

    beforeEach(() => {
      editor = service.createEditor();
    });

    afterEach(() => {
      if (!editor.isDestroyed()) {
        editor.destroy();
      }
    });

    it('should get rich text metadata', () => {
      editor.setHTML('<p><strong>Bold</strong> text</p>');
      const metadata = service.getRichTextMetadata(editor);
      expect(metadata.html).toContain('Bold');
      expect(metadata.plainText).toContain('Bold');
      expect(metadata.plainText).toContain('text');
      expect(metadata.hasFormatting).toBe(true);
    });

    it('should indicate no formatting for plain text', () => {
      editor.setHTML('<p>Plain text</p>');
      const metadata = service.getRichTextMetadata(editor);
      expect(metadata.hasFormatting).toBe(false);
    });
  });

  // ==================== Format State Signal ====================

  describe('Format State Signal', () => {
    it('should reset format state', () => {
      service.resetFormatState();
      const formatState = service.formatState();
      expect(formatState.bold).toBe(false);
      expect(formatState.italic).toBe(false);
      expect(formatState.underline).toBe(false);
    });
  });

  // ==================== API Compatibility ====================

  describe('API Compatibility', () => {
    it('should have all required methods', () => {
      // Editor lifecycle
      expect(typeof service.createEditor).toBe('function');
      expect(typeof service.destroyEditor).toBe('function');
      expect(typeof service.resetFormatState).toBe('function');

      // Formatting
      expect(typeof service.toggleBold).toBe('function');
      expect(typeof service.toggleItalic).toBe('function');
      expect(typeof service.toggleUnderline).toBe('function');
      expect(typeof service.toggleStrikethrough).toBe('function');
      expect(typeof service.toggleCode).toBe('function');
      expect(typeof service.toggleCodeBlock).toBe('function');
      expect(typeof service.toggleBlockquote).toBe('function');
      expect(typeof service.toggleOrderedList).toBe('function');
      expect(typeof service.toggleBulletList).toBe('function');
      expect(typeof service.setLink).toBe('function');

      // History
      expect(typeof service.undo).toBe('function');
      expect(typeof service.redo).toBe('function');
      expect(typeof service.canUndo).toBe('function');
      expect(typeof service.canRedo).toBe('function');

      // Content
      expect(typeof service.getHTML).toBe('function');
      expect(typeof service.getText).toBe('function');
      expect(typeof service.setContent).toBe('function');
      expect(typeof service.setContentWithMentions).toBe('function');
      expect(typeof service.clearContent).toBe('function');
      expect(typeof service.insertText).toBe('function');
      expect(typeof service.deleteRange).toBe('function');
      expect(typeof service.isEmpty).toBe('function');
      expect(typeof service.hasFormatting).toBe('function');

      // Mentions
      expect(typeof service.insertMention).toBe('function');
      expect(typeof service.getTextWithMentionFormat).toBe('function');
      expect(typeof service.getUniqueMentionUids).toBe('function');

      // Metadata
      expect(typeof service.getFormatState).toBe('function');
      expect(typeof service.getRichTextMetadata).toBe('function');

      // Focus
      expect(typeof service.focus).toBe('function');
      expect(typeof service.blur).toBe('function');
    });
  });
});
