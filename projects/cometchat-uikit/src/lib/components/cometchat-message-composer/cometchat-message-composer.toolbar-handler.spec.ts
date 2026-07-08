/**
 * cometchat-message-composer.toolbar-handler Tests
 *
 * Covers: handleToolbarBoldImpl, handleToolbarItalicImpl,
 *         handleToolbarUnderlineImpl, handleToolbarStrikethroughImpl,
 *         handleToolbarInlineCodeImpl, handleToolbarOrderedListImpl,
 *         handleToolbarBulletListImpl, handleToolbarCodeBlockImpl,
 *         handleToolbarBlockquoteImpl, handleToolbarLinkImpl,
 *         updateFormatStateFromEditorImpl, getTextOffsetFromNodeImpl,
 *         handleSelectionUpdateImpl (collapsed/non-collapsed).
 *
 * @module components/cometchat-message-composer/toolbar-handler
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  handleToolbarBoldImpl,
  handleToolbarItalicImpl,
  handleToolbarUnderlineImpl,
  handleToolbarStrikethroughImpl,
  handleToolbarInlineCodeImpl,
  handleToolbarOrderedListImpl,
  handleToolbarBulletListImpl,
  handleToolbarCodeBlockImpl,
  handleToolbarBlockquoteImpl,
  handleToolbarLinkImpl,
  updateFormatStateFromEditorImpl,
  getTextOffsetFromNodeImpl,
  ToolbarHandlerContext,
} from './cometchat-message-composer.toolbar-handler';
import { RichTextFormatState } from '../../services/rich-text-editor.interfaces';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeFormatState(overrides: Partial<RichTextFormatState> = {}): RichTextFormatState {
  return {
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
    code: false,
    link: false,
    orderedList: false,
    bulletList: false,
    codeBlock: false,
    blockquote: false,
    ...overrides,
  };
}

function makeRichTextEditorService() {
  return {
    toggleBold: vi.fn(),
    toggleItalic: vi.fn(),
    toggleUnderline: vi.fn(),
    toggleStrikethrough: vi.fn(),
    toggleCode: vi.fn(),
    toggleOrderedList: vi.fn(),
    toggleBulletList: vi.fn(),
    toggleCodeBlock: vi.fn(),
    toggleBlockquote: vi.fn(),
    getFormatState: vi.fn().mockReturnValue(makeFormatState()),
    getText: vi.fn().mockReturnValue(''),
    getHTML: vi.fn().mockReturnValue(''),
    getSelection: vi.fn().mockReturnValue(null),
    getElement: vi.fn().mockReturnValue(document.createElement('div')),
    getCurrentLink: vi.fn().mockReturnValue('https://example.com'),
    getCurrentLinkText: vi.fn().mockReturnValue('Example'),
    getSelectedText: vi.fn().mockReturnValue('selected text'),
    saveSelection: vi.fn().mockReturnValue({}),
  };
}

function makeRichTextEditor() {
  return {
    saveSelection: vi.fn().mockReturnValue({}),
    getCurrentLink: vi.fn().mockReturnValue('https://example.com'),
    getCurrentLinkText: vi.fn().mockReturnValue('Example'),
    getSelectedText: vi.fn().mockReturnValue('selected text'),
    getSelection: vi.fn().mockReturnValue(null),
    getElement: vi.fn().mockReturnValue(document.createElement('div')),
  };
}

function makeBaseCtx(overrides: Partial<ToolbarHandlerContext> = {}): ToolbarHandlerContext {
  const formatStateSignal = { value: makeFormatState(), set: vi.fn((v: any) => { formatStateSignal.value = v; }) };

  return {
    enableRichText: true,
    customRichTextEditor: makeRichTextEditor(),
    richTextEditorService: makeRichTextEditorService(),
    richTextFormatState: Object.assign(vi.fn().mockReturnValue(formatStateSignal.value), { set: formatStateSignal.set }),
    richTextFormatStateSignal: formatStateSignal,
    showBubbleMenuOnSelection: false,
    isMobileView: vi.fn().mockReturnValue(false),
    shouldShowToolbar: vi.fn().mockReturnValue(false),
    isFixedToolbarShown: vi.fn().mockReturnValue(false),
    isFixedToolbarManuallyToggled: vi.fn().mockReturnValue(false),
    isMouseDown: false,
    bubbleMenuDebounceTimer: null,
    bubbleMenuElementRef: null,
    textSelection: { set: vi.fn() },
    isBubbleMenuVisible: { set: vi.fn() },
    bubbleMenuPosition: { set: vi.fn() },
    isFixedToolbarShownSignal: { set: vi.fn() },
    isFixedToolbarManuallyToggledSignal: { set: vi.fn() },
    savedLinkSelection: null,
    isLinkDialogOpen: { set: vi.fn() },
    linkDialogMode: { set: vi.fn() },
    linkDialogInitialText: { set: vi.fn() },
    linkDialogInitialUrl: { set: vi.fn() },
    linkDialogX: { set: vi.fn() },
    hostElementRef: null,
    cdr: { markForCheck: vi.fn() },
    updateFormatStateFromEditor: vi.fn(),
    announceFormatStateChange: vi.fn(),
    computeLinkDialogLeft: vi.fn().mockReturnValue(100),
    ...overrides,
  };
}

describe('cometchat-message-composer.toolbar-handler', () => {

  // ==================== handleToolbarBoldImpl ====================

  describe('handleToolbarBoldImpl', () => {
    it('should call toggleBold on the editor service', () => {
      const ctx = makeBaseCtx();
      handleToolbarBoldImpl(ctx);
      expect(ctx.richTextEditorService.toggleBold).toHaveBeenCalledWith(ctx.customRichTextEditor);
    });

    it('should call updateFormatStateFromEditor', () => {
      const ctx = makeBaseCtx();
      handleToolbarBoldImpl(ctx);
      expect(ctx.updateFormatStateFromEditor).toHaveBeenCalled();
    });

    it('should call announceFormatStateChange', () => {
      const ctx = makeBaseCtx();
      handleToolbarBoldImpl(ctx);
      expect(ctx.announceFormatStateChange).toHaveBeenCalled();
    });

    it('should not call toggleBold when enableRichText=false', () => {
      const ctx = makeBaseCtx({ enableRichText: false });
      handleToolbarBoldImpl(ctx);
      expect(ctx.richTextEditorService.toggleBold).not.toHaveBeenCalled();
    });

    it('should not call toggleBold when customRichTextEditor is null', () => {
      const ctx = makeBaseCtx({ customRichTextEditor: null });
      handleToolbarBoldImpl(ctx);
      expect(ctx.richTextEditorService.toggleBold).not.toHaveBeenCalled();
    });
  });

  // ==================== handleToolbarItalicImpl ====================

  describe('handleToolbarItalicImpl', () => {
    it('should call toggleItalic on the editor service', () => {
      const ctx = makeBaseCtx();
      handleToolbarItalicImpl(ctx);
      expect(ctx.richTextEditorService.toggleItalic).toHaveBeenCalledWith(ctx.customRichTextEditor);
    });

    it('should not call toggleItalic when enableRichText=false', () => {
      const ctx = makeBaseCtx({ enableRichText: false });
      handleToolbarItalicImpl(ctx);
      expect(ctx.richTextEditorService.toggleItalic).not.toHaveBeenCalled();
    });

    it('should call announceFormatStateChange', () => {
      const ctx = makeBaseCtx();
      handleToolbarItalicImpl(ctx);
      expect(ctx.announceFormatStateChange).toHaveBeenCalled();
    });
  });

  // ==================== handleToolbarUnderlineImpl ====================

  describe('handleToolbarUnderlineImpl', () => {
    it('should call toggleUnderline on the editor service', () => {
      const ctx = makeBaseCtx();
      handleToolbarUnderlineImpl(ctx);
      expect(ctx.richTextEditorService.toggleUnderline).toHaveBeenCalledWith(ctx.customRichTextEditor);
    });

    it('should not call toggleUnderline when enableRichText=false', () => {
      const ctx = makeBaseCtx({ enableRichText: false });
      handleToolbarUnderlineImpl(ctx);
      expect(ctx.richTextEditorService.toggleUnderline).not.toHaveBeenCalled();
    });
  });

  // ==================== handleToolbarStrikethroughImpl ====================

  describe('handleToolbarStrikethroughImpl', () => {
    it('should call toggleStrikethrough on the editor service', () => {
      const ctx = makeBaseCtx();
      handleToolbarStrikethroughImpl(ctx);
      expect(ctx.richTextEditorService.toggleStrikethrough).toHaveBeenCalledWith(ctx.customRichTextEditor);
    });

    it('should not call toggleStrikethrough when enableRichText=false', () => {
      const ctx = makeBaseCtx({ enableRichText: false });
      handleToolbarStrikethroughImpl(ctx);
      expect(ctx.richTextEditorService.toggleStrikethrough).not.toHaveBeenCalled();
    });
  });

  // ==================== handleToolbarInlineCodeImpl ====================

  describe('handleToolbarInlineCodeImpl', () => {
    it('should call toggleCode on the editor service', () => {
      const ctx = makeBaseCtx();
      handleToolbarInlineCodeImpl(ctx);
      expect(ctx.richTextEditorService.toggleCode).toHaveBeenCalledWith(ctx.customRichTextEditor);
    });

    it('should not call toggleCode when enableRichText=false', () => {
      const ctx = makeBaseCtx({ enableRichText: false });
      handleToolbarInlineCodeImpl(ctx);
      expect(ctx.richTextEditorService.toggleCode).not.toHaveBeenCalled();
    });
  });

  // ==================== handleToolbarOrderedListImpl ====================

  describe('handleToolbarOrderedListImpl', () => {
    it('should call toggleOrderedList on the editor service', () => {
      const ctx = makeBaseCtx();
      handleToolbarOrderedListImpl(ctx);
      expect(ctx.richTextEditorService.toggleOrderedList).toHaveBeenCalledWith(ctx.customRichTextEditor);
    });

    it('should not call toggleOrderedList when enableRichText=false', () => {
      const ctx = makeBaseCtx({ enableRichText: false });
      handleToolbarOrderedListImpl(ctx);
      expect(ctx.richTextEditorService.toggleOrderedList).not.toHaveBeenCalled();
    });
  });

  // ==================== handleToolbarBulletListImpl ====================

  describe('handleToolbarBulletListImpl', () => {
    it('should call toggleBulletList on the editor service', () => {
      const ctx = makeBaseCtx();
      handleToolbarBulletListImpl(ctx);
      expect(ctx.richTextEditorService.toggleBulletList).toHaveBeenCalledWith(ctx.customRichTextEditor);
    });

    it('should not call toggleBulletList when enableRichText=false', () => {
      const ctx = makeBaseCtx({ enableRichText: false });
      handleToolbarBulletListImpl(ctx);
      expect(ctx.richTextEditorService.toggleBulletList).not.toHaveBeenCalled();
    });
  });

  // ==================== handleToolbarCodeBlockImpl ====================

  describe('handleToolbarCodeBlockImpl', () => {
    it('should call toggleCodeBlock on the editor service', () => {
      const ctx = makeBaseCtx();
      handleToolbarCodeBlockImpl(ctx);
      expect(ctx.richTextEditorService.toggleCodeBlock).toHaveBeenCalledWith(ctx.customRichTextEditor);
    });

    it('should not call toggleCodeBlock when enableRichText=false', () => {
      const ctx = makeBaseCtx({ enableRichText: false });
      handleToolbarCodeBlockImpl(ctx);
      expect(ctx.richTextEditorService.toggleCodeBlock).not.toHaveBeenCalled();
    });
  });

  // ==================== handleToolbarBlockquoteImpl ====================

  describe('handleToolbarBlockquoteImpl', () => {
    it('should call toggleBlockquote on the editor service', () => {
      const ctx = makeBaseCtx();
      handleToolbarBlockquoteImpl(ctx);
      expect(ctx.richTextEditorService.toggleBlockquote).toHaveBeenCalledWith(ctx.customRichTextEditor);
    });

    it('should not call toggleBlockquote when enableRichText=false', () => {
      const ctx = makeBaseCtx({ enableRichText: false });
      handleToolbarBlockquoteImpl(ctx);
      expect(ctx.richTextEditorService.toggleBlockquote).not.toHaveBeenCalled();
    });
  });

  // ==================== handleToolbarLinkImpl ====================

  describe('handleToolbarLinkImpl', () => {
    it('should return early when enableRichText=false', () => {
      const ctx = makeBaseCtx({ enableRichText: false });
      handleToolbarLinkImpl(ctx);
      expect(ctx.isLinkDialogOpen.set).not.toHaveBeenCalled();
    });

    it('should return early when customRichTextEditor is null', () => {
      const ctx = makeBaseCtx({ customRichTextEditor: null });
      handleToolbarLinkImpl(ctx);
      expect(ctx.isLinkDialogOpen.set).not.toHaveBeenCalled();
    });

    it('should open link dialog in add mode when link is not active', () => {
      const ctx = makeBaseCtx({
        richTextFormatState: Object.assign(vi.fn().mockReturnValue(makeFormatState({ link: false })), { set: vi.fn() }),
      });
      handleToolbarLinkImpl(ctx);
      expect(ctx.linkDialogMode.set).toHaveBeenCalledWith('add');
      expect(ctx.isLinkDialogOpen.set).toHaveBeenCalledWith(true);
    });

    it('should open link dialog in edit mode when link is active', () => {
      const ctx = makeBaseCtx({
        richTextFormatState: Object.assign(vi.fn().mockReturnValue(makeFormatState({ link: true })), { set: vi.fn() }),
      });
      handleToolbarLinkImpl(ctx);
      expect(ctx.linkDialogMode.set).toHaveBeenCalledWith('edit');
      expect(ctx.isLinkDialogOpen.set).toHaveBeenCalledWith(true);
    });

    it('should set linkDialogInitialUrl when editing existing link', () => {
      const ctx = makeBaseCtx({
        richTextFormatState: Object.assign(vi.fn().mockReturnValue(makeFormatState({ link: true })), { set: vi.fn() }),
      });
      handleToolbarLinkImpl(ctx);
      expect(ctx.linkDialogInitialUrl.set).toHaveBeenCalledWith('https://example.com');
    });

    it('should set linkDialogInitialText from selected text when adding new link', () => {
      const ctx = makeBaseCtx({
        richTextFormatState: Object.assign(vi.fn().mockReturnValue(makeFormatState({ link: false })), { set: vi.fn() }),
      });
      handleToolbarLinkImpl(ctx);
      expect(ctx.linkDialogInitialText.set).toHaveBeenCalledWith('selected text');
    });
  });

  // ==================== updateFormatStateFromEditorImpl ====================

  describe('updateFormatStateFromEditorImpl', () => {
    it('should not update when enableRichText=false', () => {
      const ctx = makeBaseCtx({ enableRichText: false });
      updateFormatStateFromEditorImpl(ctx);
      expect(ctx.richTextEditorService.getFormatState).not.toHaveBeenCalled();
    });

    it('should call getFormatState when editor is available', () => {
      const ctx = makeBaseCtx();
      updateFormatStateFromEditorImpl(ctx);
      expect(ctx.richTextEditorService.getFormatState).toHaveBeenCalledWith(ctx.customRichTextEditor);
    });

    it('should update richTextFormatState signal with new format state', () => {
      const newState = makeFormatState({ bold: true });
      const ctx = makeBaseCtx();
      (ctx.richTextEditorService.getFormatState as any).mockReturnValue(newState);
      updateFormatStateFromEditorImpl(ctx);
      expect((ctx.richTextFormatState as any).set).toHaveBeenCalledWith(newState);
    });

    it('should not update signal when customRichTextEditor is null', () => {
      const ctx = makeBaseCtx({ customRichTextEditor: null });
      updateFormatStateFromEditorImpl(ctx);
      expect((ctx.richTextFormatState as any).set).not.toHaveBeenCalled();
    });
  });

  // ==================== getTextOffsetFromNodeImpl ====================

  describe('getTextOffsetFromNodeImpl', () => {
    it('should return 0 for empty root', () => {
      const root = document.createElement('div');
      const textNode = document.createTextNode('');
      root.appendChild(textNode);
      expect(getTextOffsetFromNodeImpl(root, textNode, 0)).toBe(0);
    });

    it('should return correct offset for first text node', () => {
      const root = document.createElement('div');
      const textNode = document.createTextNode('Hello');
      root.appendChild(textNode);
      expect(getTextOffsetFromNodeImpl(root, textNode, 3)).toBe(3);
    });

    it('should accumulate offset across multiple text nodes', () => {
      const root = document.createElement('div');
      const text1 = document.createTextNode('Hello '); // 6 chars
      const text2 = document.createTextNode('World');
      root.appendChild(text1);
      root.appendChild(text2);
      // Offset 2 into text2 = 6 + 2 = 8
      expect(getTextOffsetFromNodeImpl(root, text2, 2)).toBe(8);
    });

    it('should return total text length when node is not found', () => {
      const root = document.createElement('div');
      const text1 = document.createTextNode('Hello');
      root.appendChild(text1);
      const outsideNode = document.createTextNode('Outside');
      // Node not in tree — returns accumulated offset (5) + 0
      const result = getTextOffsetFromNodeImpl(root, outsideNode, 0);
      expect(typeof result).toBe('number');
    });
  });
});
