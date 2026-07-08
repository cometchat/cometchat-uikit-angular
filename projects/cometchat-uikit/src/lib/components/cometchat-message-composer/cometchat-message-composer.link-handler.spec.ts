/**
 * cometchat-message-composer.link-handler Tests
 *
 * Covers: handleLinkDialogSaveImpl, handleLinkDialogRemoveImpl,
 *         handleLinkDialogCancelImpl, handleLinkClickImpl,
 *         handleLinkPopoverEditImpl, handleLinkPopoverRemoveImpl,
 *         handleLinkPopoverCloseImpl.
 *
 * @module components/cometchat-message-composer/link-handler
 */

import { describe, it, expect, vi } from 'vitest';
import {
  handleLinkDialogSaveImpl,
  handleLinkDialogRemoveImpl,
  handleLinkDialogCancelImpl,
  handleLinkClickImpl,
  handleLinkPopoverEditImpl,
  handleLinkPopoverRemoveImpl,
  handleLinkPopoverCloseImpl,
  LinkHandlerContext,
} from './cometchat-message-composer.link-handler';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeCtx(overrides: Partial<LinkHandlerContext> = {}): LinkHandlerContext {
  return {
    customRichTextEditor: {
      restoreSelection: vi.fn(),
      saveSelection: vi.fn().mockReturnValue({}),
      focus: vi.fn(),
    },
    richTextEditorService: {
      setLink: vi.fn(),
    },
    savedLinkSelection: null,
    isLinkDialogOpen: { set: vi.fn() },
    isLinkPopoverOpen: { set: vi.fn() },
    linkPopoverUrl: { set: vi.fn() },
    linkPopoverText: { set: vi.fn() },
    linkPopoverX: Object.assign(vi.fn().mockReturnValue(100), { set: vi.fn() }),
    linkPopoverY: { set: vi.fn() },
    linkDialogMode: { set: vi.fn() },
    linkDialogInitialText: { set: vi.fn() },
    linkDialogInitialUrl: { set: vi.fn() },
    linkDialogX: { set: vi.fn() },
    enableRichText: true,
    hostElementRef: {
      nativeElement: (() => {
        const host = document.createElement('div');
        const composer = document.createElement('div');
        composer.className = 'cometchat-message-composer';
        Object.defineProperty(composer, 'getBoundingClientRect', {
          value: () => ({ left: 0, width: 800 }),
        });
        host.appendChild(composer);
        return host;
      })(),
    },
    updateFormatStateFromEditor: vi.fn(),
    announceFormatStateChange: vi.fn(),
    richTextFormatState: vi.fn().mockReturnValue({ link: true }),
    ...overrides,
  };
}

describe('cometchat-message-composer.link-handler', () => {

  // ==================== handleLinkDialogSaveImpl ====================

  describe('handleLinkDialogSaveImpl', () => {
    it('should call setLink on the editor service', () => {
      const ctx = makeCtx();
      handleLinkDialogSaveImpl(ctx, { url: 'https://example.com', text: 'Example' });
      expect(ctx.richTextEditorService.setLink).toHaveBeenCalledWith(
        ctx.customRichTextEditor, 'https://example.com', 'Example'
      );
    });

    it('should close the link dialog', () => {
      const ctx = makeCtx();
      handleLinkDialogSaveImpl(ctx, { url: 'https://example.com', text: 'Example' });
      expect(ctx.isLinkDialogOpen.set).toHaveBeenCalledWith(false);
    });

    it('should restore selection when savedLinkSelection exists', () => {
      const ctx = makeCtx();
      ctx.savedLinkSelection = { from: 0, to: 5 };
      handleLinkDialogSaveImpl(ctx, { url: 'https://example.com', text: 'Example' });
      expect(ctx.customRichTextEditor.restoreSelection).toHaveBeenCalled();
      expect(ctx.savedLinkSelection).toBeNull();
    });

    it('should call updateFormatStateFromEditor', () => {
      const ctx = makeCtx();
      handleLinkDialogSaveImpl(ctx, { url: 'https://example.com', text: 'Example' });
      expect(ctx.updateFormatStateFromEditor).toHaveBeenCalled();
    });

    it('should call announceFormatStateChange', () => {
      const ctx = makeCtx();
      handleLinkDialogSaveImpl(ctx, { url: 'https://example.com', text: 'Example' });
      expect(ctx.announceFormatStateChange).toHaveBeenCalled();
    });

    it('should focus the editor after saving', () => {
      const ctx = makeCtx();
      handleLinkDialogSaveImpl(ctx, { url: 'https://example.com', text: 'Example' });
      expect(ctx.customRichTextEditor.focus).toHaveBeenCalled();
    });

    it('should still close dialog when no editor', () => {
      const ctx = makeCtx({ customRichTextEditor: null });
      handleLinkDialogSaveImpl(ctx, { url: 'https://example.com', text: 'Example' });
      expect(ctx.isLinkDialogOpen.set).toHaveBeenCalledWith(false);
    });
  });

  // ==================== handleLinkDialogRemoveImpl ====================

  describe('handleLinkDialogRemoveImpl', () => {
    it('should call setLink with null to remove the link', () => {
      const ctx = makeCtx();
      handleLinkDialogRemoveImpl(ctx);
      expect(ctx.richTextEditorService.setLink).toHaveBeenCalledWith(ctx.customRichTextEditor, null);
    });

    it('should close the link dialog', () => {
      const ctx = makeCtx();
      handleLinkDialogRemoveImpl(ctx);
      expect(ctx.isLinkDialogOpen.set).toHaveBeenCalledWith(false);
    });

    it('should call announceFormatStateChange with false', () => {
      const ctx = makeCtx();
      handleLinkDialogRemoveImpl(ctx);
      expect(ctx.announceFormatStateChange).toHaveBeenCalledWith(expect.any(String), false);
    });
  });

  // ==================== handleLinkDialogCancelImpl ====================

  describe('handleLinkDialogCancelImpl', () => {
    it('should close the link dialog', () => {
      const ctx = makeCtx();
      handleLinkDialogCancelImpl(ctx);
      expect(ctx.isLinkDialogOpen.set).toHaveBeenCalledWith(false);
    });

    it('should clear savedLinkSelection', () => {
      const ctx = makeCtx();
      ctx.savedLinkSelection = { from: 0, to: 5 };
      handleLinkDialogCancelImpl(ctx);
      expect(ctx.savedLinkSelection).toBeNull();
    });

    it('should focus the editor', () => {
      const ctx = makeCtx();
      handleLinkDialogCancelImpl(ctx);
      expect(ctx.customRichTextEditor.focus).toHaveBeenCalled();
    });
  });

  // ==================== handleLinkClickImpl ====================

  describe('handleLinkClickImpl', () => {
    it('should open link popover when enableRichText=true', () => {
      const ctx = makeCtx({ enableRichText: true });
      handleLinkClickImpl(ctx, 'https://example.com', 'Example', 100, 200);
      expect(ctx.isLinkPopoverOpen.set).toHaveBeenCalledWith(true);
    });

    it('should set link popover URL', () => {
      const ctx = makeCtx({ enableRichText: true });
      handleLinkClickImpl(ctx, 'https://example.com', 'Example', 100, 200);
      expect(ctx.linkPopoverUrl.set).toHaveBeenCalledWith('https://example.com');
    });

    it('should set link popover text', () => {
      const ctx = makeCtx({ enableRichText: true });
      handleLinkClickImpl(ctx, 'https://example.com', 'Example', 100, 200);
      expect(ctx.linkPopoverText.set).toHaveBeenCalledWith('Example');
    });

    it('should not open popover when enableRichText=false', () => {
      const ctx = makeCtx({ enableRichText: false });
      handleLinkClickImpl(ctx, 'https://example.com', 'Example', 100, 200);
      expect(ctx.isLinkPopoverOpen.set).not.toHaveBeenCalled();
    });

    it('should save selection when editor exists', () => {
      const ctx = makeCtx({ enableRichText: true });
      handleLinkClickImpl(ctx, 'https://example.com', 'Example', 100, 200);
      expect(ctx.customRichTextEditor.saveSelection).toHaveBeenCalled();
    });
  });

  // ==================== handleLinkPopoverEditImpl ====================

  describe('handleLinkPopoverEditImpl', () => {
    it('should close the link popover', () => {
      const ctx = makeCtx();
      handleLinkPopoverEditImpl(ctx, { url: 'https://example.com', text: 'Example' });
      expect(ctx.isLinkPopoverOpen.set).toHaveBeenCalledWith(false);
    });

    it('should open the link dialog in edit mode', () => {
      const ctx = makeCtx();
      handleLinkPopoverEditImpl(ctx, { url: 'https://example.com', text: 'Example' });
      expect(ctx.linkDialogMode.set).toHaveBeenCalledWith('edit');
      expect(ctx.isLinkDialogOpen.set).toHaveBeenCalledWith(true);
    });

    it('should set initial URL and text', () => {
      const ctx = makeCtx();
      handleLinkPopoverEditImpl(ctx, { url: 'https://example.com', text: 'Example' });
      expect(ctx.linkDialogInitialUrl.set).toHaveBeenCalledWith('https://example.com');
      expect(ctx.linkDialogInitialText.set).toHaveBeenCalledWith('Example');
    });
  });

  // ==================== handleLinkPopoverRemoveImpl ====================

  describe('handleLinkPopoverRemoveImpl', () => {
    it('should close the link popover', () => {
      const ctx = makeCtx();
      handleLinkPopoverRemoveImpl(ctx);
      expect(ctx.isLinkPopoverOpen.set).toHaveBeenCalledWith(false);
    });

    it('should call setLink with null', () => {
      const ctx = makeCtx();
      handleLinkPopoverRemoveImpl(ctx);
      expect(ctx.richTextEditorService.setLink).toHaveBeenCalledWith(ctx.customRichTextEditor, null);
    });

    it('should call announceFormatStateChange with false', () => {
      const ctx = makeCtx();
      handleLinkPopoverRemoveImpl(ctx);
      expect(ctx.announceFormatStateChange).toHaveBeenCalledWith(expect.any(String), false);
    });
  });

  // ==================== handleLinkPopoverCloseImpl ====================

  describe('handleLinkPopoverCloseImpl', () => {
    it('should close the link popover', () => {
      const ctx = makeCtx();
      handleLinkPopoverCloseImpl(ctx);
      expect(ctx.isLinkPopoverOpen.set).toHaveBeenCalledWith(false);
    });

    it('should clear savedLinkSelection', () => {
      const ctx = makeCtx();
      ctx.savedLinkSelection = { from: 0, to: 5 };
      handleLinkPopoverCloseImpl(ctx);
      expect(ctx.savedLinkSelection).toBeNull();
    });

    it('should focus the editor', () => {
      const ctx = makeCtx();
      handleLinkPopoverCloseImpl(ctx);
      expect(ctx.customRichTextEditor.focus).toHaveBeenCalled();
    });
  });
});
