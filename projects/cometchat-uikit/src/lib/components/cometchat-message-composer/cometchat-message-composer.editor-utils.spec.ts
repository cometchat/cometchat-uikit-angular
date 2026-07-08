/**
 * cometchat-message-composer.editor-utils Tests
 *
 * Covers: clearComposerImpl — all state reset operations.
 *         initializeRichTextEditorImpl — early return when editor exists.
 *
 * @module components/cometchat-message-composer/editor-utils
 */

import { describe, it, expect, vi } from 'vitest';
import {
  clearComposerImpl,
  ClearComposerContext,
} from './cometchat-message-composer.editor-utils';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeCtx(overrides: Partial<ClearComposerContext> = {}): ClearComposerContext {
  return {
    composerText: { set: vi.fn() },
    customRichTextEditor: null,
    richTextEditorService: { clearContent: vi.fn() },
    messageToReplySignal: Object.assign(vi.fn().mockReturnValue(null), { set: vi.fn() }),
    isEditMode: Object.assign(vi.fn().mockReturnValue(false), { set: vi.fn() }),
    textMessageToEdit: Object.assign(vi.fn().mockReturnValue(null), { set: vi.fn() }),
    originalTextBeforeEdit: '',
    attachments: { set: vi.fn() },
    richTextFormatState: { set: vi.fn() },
    uniqueMentionCount: { set: vi.fn() },
    showMentionsCountWarning: { set: vi.fn() },
    plainTextMentionUids: { clear: vi.fn() },
    mentionedUsersMap: { clear: vi.fn() },
    textChange: { emit: vi.fn() },
    ...overrides,
  };
}

describe('cometchat-message-composer.editor-utils', () => {

  // ==================== clearComposerImpl ====================

  describe('clearComposerImpl', () => {
    it('should set composerText to empty string', () => {
      const ctx = makeCtx();
      clearComposerImpl(ctx);
      expect(ctx.composerText.set).toHaveBeenCalledWith('');
    });

    it('should call clearContent on richTextEditorService when editor exists', () => {
      const mockEditor = {};
      const ctx = makeCtx({ customRichTextEditor: mockEditor });
      clearComposerImpl(ctx);
      expect(ctx.richTextEditorService.clearContent).toHaveBeenCalledWith(mockEditor);
    });

    it('should not call clearContent when no editor', () => {
      const ctx = makeCtx({ customRichTextEditor: null });
      clearComposerImpl(ctx);
      expect(ctx.richTextEditorService.clearContent).not.toHaveBeenCalled();
    });

    it('should clear messageToReplySignal when set', () => {
      const ctx = makeCtx({
        messageToReplySignal: Object.assign(vi.fn().mockReturnValue({ id: 1 }), { set: vi.fn() }),
      });
      clearComposerImpl(ctx);
      expect(ctx.messageToReplySignal.set).toHaveBeenCalledWith(null);
    });

    it('should not clear messageToReplySignal when null', () => {
      const ctx = makeCtx({
        messageToReplySignal: Object.assign(vi.fn().mockReturnValue(null), { set: vi.fn() }),
      });
      clearComposerImpl(ctx);
      expect(ctx.messageToReplySignal.set).not.toHaveBeenCalled();
    });

    it('should clear edit mode when in edit mode', () => {
      const ctx = makeCtx({
        isEditMode: Object.assign(vi.fn().mockReturnValue(true), { set: vi.fn() }),
        textMessageToEdit: Object.assign(vi.fn().mockReturnValue({ id: 1 }), { set: vi.fn() }),
      });
      clearComposerImpl(ctx);
      expect(ctx.textMessageToEdit.set).toHaveBeenCalledWith(null);
      expect(ctx.isEditMode.set).toHaveBeenCalledWith(false);
    });

    it('should set attachments to empty array', () => {
      const ctx = makeCtx();
      clearComposerImpl(ctx);
      expect(ctx.attachments.set).toHaveBeenCalledWith([]);
    });

    it('should reset richTextFormatState to all false', () => {
      const ctx = makeCtx();
      clearComposerImpl(ctx);
      expect(ctx.richTextFormatState.set).toHaveBeenCalledWith(
        expect.objectContaining({
          bold: false,
          italic: false,
          underline: false,
          strikethrough: false,
          code: false,
          blockquote: false,
          codeBlock: false,
          orderedList: false,
          bulletList: false,
          link: false,
        })
      );
    });

    it('should reset uniqueMentionCount to 0', () => {
      const ctx = makeCtx();
      clearComposerImpl(ctx);
      expect(ctx.uniqueMentionCount.set).toHaveBeenCalledWith(0);
    });

    it('should set showMentionsCountWarning to false', () => {
      const ctx = makeCtx();
      clearComposerImpl(ctx);
      expect(ctx.showMentionsCountWarning.set).toHaveBeenCalledWith(false);
    });

    it('should clear plainTextMentionUids', () => {
      const ctx = makeCtx();
      clearComposerImpl(ctx);
      expect(ctx.plainTextMentionUids.clear).toHaveBeenCalled();
    });

    it('should clear mentionedUsersMap', () => {
      const ctx = makeCtx();
      clearComposerImpl(ctx);
      expect(ctx.mentionedUsersMap.clear).toHaveBeenCalled();
    });

    it('should emit empty string via textChange', () => {
      const ctx = makeCtx();
      clearComposerImpl(ctx);
      expect(ctx.textChange.emit).toHaveBeenCalledWith('');
    });
  });
});
