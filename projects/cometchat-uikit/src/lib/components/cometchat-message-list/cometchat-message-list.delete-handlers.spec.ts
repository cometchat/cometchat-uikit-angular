/**
 * cometchat-message-list.delete-handlers Tests
 *
 * Covers: showDeleteConfirmationImpl, handleDeleteCancelImpl,
 *         getDeleteDialogTitleImpl, getDeleteDialogSubtitleImpl,
 *         getDeleteDialogConfirmTextImpl, getDeleteDialogCancelTextImpl,
 *         showFlagConfirmationImpl, handleFlagCancelImpl,
 *         handleDeleteConfirmImpl, handleFlagConfirmImpl.
 *
 * @module components/cometchat-message-list/delete-handlers
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import {
  showDeleteConfirmationImpl,
  handleDeleteCancelImpl,
  getDeleteDialogTitleImpl,
  getDeleteDialogSubtitleImpl,
  getDeleteDialogConfirmTextImpl,
  getDeleteDialogCancelTextImpl,
  showFlagConfirmationImpl,
  handleFlagCancelImpl,
  handleDeleteConfirmImpl,
  handleFlagConfirmImpl,
  DeleteHandlerContext,
} from './cometchat-message-list.delete-handlers';
import { CometChatMessageEvents } from '../../events/CometChatMessageEvents';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeMessage(id = 1): CometChat.BaseMessage {
  const msg = new CometChat.TextMessage('r1', 'Hello', CometChat.RECEIVER_TYPE.USER);
  (msg as any).id = id;
  (msg as any).getId = () => id;
  return msg as unknown as CometChat.BaseMessage;
}

function makeCtx(overrides: Partial<DeleteHandlerContext> = {}): DeleteHandlerContext {
  const messageToDelete = { value: null as any, set: vi.fn((v: any) => { messageToDelete.value = v; }) };
  const messageToFlag = { value: null as any, set: vi.fn((v: any) => { messageToFlag.value = v; }) };
  const showDeleteConfirmDialog = { value: false, set: vi.fn((v: boolean) => { showDeleteConfirmDialog.value = v; }) };
  const showFlagMessageDialog = { value: false, set: vi.fn((v: boolean) => { showFlagMessageDialog.value = v; }) };
  const isDeleting = { value: false, set: vi.fn((v: boolean) => { isDeleting.value = v; }) };
  const isFlagging = { value: false, set: vi.fn((v: boolean) => { isFlagging.value = v; }) };

  return {
    messageToDelete: Object.assign(() => messageToDelete.value, messageToDelete),
    showDeleteConfirmDialog: Object.assign(() => showDeleteConfirmDialog.value, showDeleteConfirmDialog),
    isDeleting: Object.assign(() => isDeleting.value, isDeleting),
    messageToFlag: Object.assign(() => messageToFlag.value, messageToFlag),
    showFlagMessageDialog: Object.assign(() => showFlagMessageDialog.value, showFlagMessageDialog),
    isFlagging: Object.assign(() => isFlagging.value, isFlagging),
    messageListService: {
      deleteMessage: vi.fn(),
      flagMessage: vi.fn().mockResolvedValue(undefined),
    },
    error: { emit: vi.fn() },
    showInlineToast: vi.fn(),
    announceMessageDeleted: vi.fn(),
    ...overrides,
  };
}

describe('cometchat-message-list.delete-handlers', () => {

  // ==================== showDeleteConfirmationImpl ====================

  describe('showDeleteConfirmationImpl', () => {
    it('should set messageToDelete to the message', () => {
      const ctx = makeCtx();
      const msg = makeMessage(1);
      showDeleteConfirmationImpl(ctx, msg);
      expect(ctx.messageToDelete.set).toHaveBeenCalledWith(msg);
    });

    it('should set showDeleteConfirmDialog to true', () => {
      const ctx = makeCtx();
      showDeleteConfirmationImpl(ctx, makeMessage(1));
      expect(ctx.showDeleteConfirmDialog.set).toHaveBeenCalledWith(true);
    });
  });

  // ==================== handleDeleteCancelImpl ====================

  describe('handleDeleteCancelImpl', () => {
    it('should set showDeleteConfirmDialog to false', () => {
      const ctx = makeCtx();
      handleDeleteCancelImpl(ctx);
      expect(ctx.showDeleteConfirmDialog.set).toHaveBeenCalledWith(false);
    });

    it('should set messageToDelete to null', () => {
      const ctx = makeCtx();
      handleDeleteCancelImpl(ctx);
      expect(ctx.messageToDelete.set).toHaveBeenCalledWith(null);
    });
  });

  // ==================== Dialog text getters ====================

  describe('dialog text getters', () => {
    it('getDeleteDialogTitleImpl should return a string', () => {
      expect(typeof getDeleteDialogTitleImpl()).toBe('string');
    });

    it('getDeleteDialogSubtitleImpl should return a string', () => {
      expect(typeof getDeleteDialogSubtitleImpl()).toBe('string');
    });

    it('getDeleteDialogConfirmTextImpl should return a string', () => {
      expect(typeof getDeleteDialogConfirmTextImpl()).toBe('string');
    });

    it('getDeleteDialogCancelTextImpl should return a string', () => {
      expect(typeof getDeleteDialogCancelTextImpl()).toBe('string');
    });
  });

  // ==================== showFlagConfirmationImpl ====================

  describe('showFlagConfirmationImpl', () => {
    it('should set messageToFlag to the message', () => {
      const ctx = makeCtx();
      const msg = makeMessage(1);
      showFlagConfirmationImpl(ctx, msg);
      expect(ctx.messageToFlag.set).toHaveBeenCalledWith(msg);
    });

    it('should set showFlagMessageDialog to true', () => {
      const ctx = makeCtx();
      showFlagConfirmationImpl(ctx, makeMessage(1));
      expect(ctx.showFlagMessageDialog.set).toHaveBeenCalledWith(true);
    });
  });

  // ==================== handleFlagCancelImpl ====================

  describe('handleFlagCancelImpl', () => {
    it('should set showFlagMessageDialog to false', () => {
      const ctx = makeCtx();
      handleFlagCancelImpl(ctx);
      expect(ctx.showFlagMessageDialog.set).toHaveBeenCalledWith(false);
    });

    it('should set messageToFlag to null', () => {
      const ctx = makeCtx();
      handleFlagCancelImpl(ctx);
      expect(ctx.messageToFlag.set).toHaveBeenCalledWith(null);
    });
  });

  // ==================== handleDeleteConfirmImpl ====================

  describe('handleDeleteConfirmImpl', () => {
    it('should return early when no message to delete', async () => {
      const ctx = makeCtx();
      ctx.messageToDelete.value = null;
      await handleDeleteConfirmImpl(ctx);
      expect(ctx.messageListService.deleteMessage).not.toHaveBeenCalled();
    });

    it('should call messageListService.deleteMessage', async () => {
      const msg = makeMessage(42);
      const ctx = makeCtx();
      ctx.messageToDelete.set(msg);
      vi.mocked(CometChat.deleteMessage).mockResolvedValueOnce(msg as any);
      await handleDeleteConfirmImpl(ctx);
      expect(ctx.messageListService.deleteMessage).toHaveBeenCalledWith(42);
    });

    it('should emit ccMessageDeleted event', async () => {
      const msg = makeMessage(42);
      const ctx = makeCtx();
      ctx.messageToDelete.set(msg);
      vi.mocked(CometChat.deleteMessage).mockResolvedValueOnce(msg as any);
      const spy = vi.fn();
      const sub = CometChatMessageEvents.ccMessageDeleted.subscribe(spy);
      await handleDeleteConfirmImpl(ctx);
      sub.unsubscribe();
      expect(spy).toHaveBeenCalled();
    });

    it('should call announceMessageDeleted on success', async () => {
      const msg = makeMessage(42);
      const ctx = makeCtx();
      ctx.messageToDelete.set(msg);
      vi.mocked(CometChat.deleteMessage).mockResolvedValueOnce(msg as any);
      await handleDeleteConfirmImpl(ctx);
      expect(ctx.announceMessageDeleted).toHaveBeenCalled();
    });

    it('should close dialog on success', async () => {
      const msg = makeMessage(42);
      const ctx = makeCtx();
      ctx.messageToDelete.set(msg);
      vi.mocked(CometChat.deleteMessage).mockResolvedValueOnce(msg as any);
      await handleDeleteConfirmImpl(ctx);
      expect(ctx.showDeleteConfirmDialog.set).toHaveBeenCalledWith(false);
    });

    it('should emit error when deleteMessage fails', async () => {
      const msg = makeMessage(42);
      const ctx = makeCtx();
      ctx.messageToDelete.set(msg);
      const err = new Error('delete failed');
      vi.mocked(CometChat.deleteMessage).mockRejectedValueOnce(err);
      await handleDeleteConfirmImpl(ctx);
      expect(ctx.error.emit).toHaveBeenCalledWith(err);
    });

    it('should set isDeleting to false in finally block', async () => {
      const msg = makeMessage(42);
      const ctx = makeCtx();
      ctx.messageToDelete.set(msg);
      vi.mocked(CometChat.deleteMessage).mockResolvedValueOnce(msg as any);
      await handleDeleteConfirmImpl(ctx);
      expect(ctx.isDeleting.set).toHaveBeenCalledWith(false);
    });
  });

  // ==================== handleFlagConfirmImpl ====================

  describe('handleFlagConfirmImpl', () => {
    it('should call messageListService.flagMessage', async () => {
      const ctx = makeCtx();
      const msg = makeMessage(1);
      await handleFlagConfirmImpl(ctx, { message: msg, reasonId: 'spam', remark: 'test' });
      expect(ctx.messageListService.flagMessage).toHaveBeenCalledWith(msg, 'spam', 'test');
    });

    it('should close flag dialog on success', async () => {
      const ctx = makeCtx();
      const msg = makeMessage(1);
      await handleFlagConfirmImpl(ctx, { message: msg, reasonId: 'spam', remark: '' });
      expect(ctx.showFlagMessageDialog.set).toHaveBeenCalledWith(false);
    });

    it('should show inline toast on success', async () => {
      const ctx = makeCtx();
      const msg = makeMessage(1);
      await handleFlagConfirmImpl(ctx, { message: msg, reasonId: 'spam', remark: '' });
      expect(ctx.showInlineToast).toHaveBeenCalled();
    });

    it('should emit error when flagMessage fails', async () => {
      const ctx = makeCtx({
        messageListService: {
          deleteMessage: vi.fn(),
          flagMessage: vi.fn().mockRejectedValue(new Error('flag failed')),
        },
      });
      const msg = makeMessage(1);
      await handleFlagConfirmImpl(ctx, { message: msg, reasonId: 'spam', remark: '' });
      expect(ctx.error.emit).toHaveBeenCalled();
    });

    it('should set isFlagging to false in finally block', async () => {
      const ctx = makeCtx();
      const msg = makeMessage(1);
      await handleFlagConfirmImpl(ctx, { message: msg, reasonId: 'spam', remark: '' });
      expect(ctx.isFlagging.set).toHaveBeenCalledWith(false);
    });
  });
});
