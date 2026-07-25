/**
 * cometchat-message-composer.drag-utils Tests
 *
 * Covers: handleDragEnterImpl, handleDragLeaveImpl, handleDragOverImpl,
 *         handleDropImpl, handlePasteImpl, handleFileInputChangeImpl,
 *         processFilesImpl (valid/oversized/invalid-type), sendFilesDirectlyImpl.
 *
 * @module components/cometchat-message-composer/drag-utils
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import {
  handleDragEnterImpl,
  handleDragLeaveImpl,
  handleDragOverImpl,
  handleDropImpl,
  handlePasteImpl,
  handleFileInputChangeImpl,
  processFilesImpl,
  sendFilesDirectlyImpl,
  DragUtilsContext,
} from './cometchat-message-composer.drag-utils';
import { CometChatMessageEvents } from '../../events/CometChatMessageEvents';
import { MessageStatus } from '../../Enums/Enums';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeUser(uid: string): CometChat.User {
  const u = new CometChat.User(uid);
  u.setName(`User ${uid}`);
  return u;
}

function makeFile(name: string, type: string, size = 1024): File {
  const file = new File(['x'.repeat(size)], name, { type });
  return file;
}

function makeDragEvent(withFiles = false): DragEvent {
  const event = {
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
    dataTransfer: withFiles
      ? { files: [makeFile('test.jpg', 'image/jpeg')] }
      : { files: [] },
  } as unknown as DragEvent;
  return event;
}

function makeClipboardEvent(withFile = false): ClipboardEvent {
  const items = withFile
    ? [{ kind: 'file', getAsFile: () => makeFile('paste.jpg', 'image/jpeg') }]
    : [{ kind: 'string' }];
  return {
    preventDefault: vi.fn(),
    clipboardData: { items },
  } as unknown as ClipboardEvent;
}

function makeBaseCtx(overrides: Partial<DragUtilsContext> = {}): DragUtilsContext {
  const isDraggingOver = { value: false, set: vi.fn((v: boolean) => { isDraggingOver.value = v; }) };
  const fileSizeError = { set: vi.fn() };
  const mockService = {
    sendMediaMessage: vi.fn().mockResolvedValue(
      new CometChat.MediaMessage('r1', {} as File, 'image', CometChat.RECEIVER_TYPE.USER)
    ),
  };

  return {
    isDraggingOver,
    dragCounter: 0,
    parentMessageId: undefined,
    allowedFileTypes: undefined,
    maxFileSize: undefined,
    fileSizeError,
    messageComposerService: mockService as any,
    messageToReplySignal: vi.fn().mockReturnValue(null),
    getReceiver: vi.fn().mockReturnValue(makeUser('receiver1')),
    getMediaMessageType: vi.fn().mockReturnValue('image'),
    getFileType: vi.fn().mockReturnValue('image'),
    getFileTypeLabel: vi.fn().mockReturnValue('image'),
    exitReplyMode: vi.fn(),
    playOutgoingMessageSound: vi.fn(),
    emitError: vi.fn(),
    sendButtonClick: { emit: vi.fn() },
    announceMessageSent: vi.fn(),
    // Drop/paste/file-input now route through the composer's own processFiles (the multi-attachment
    // tray path); the drag-utils impls call ctx.processFiles, so the mock context must supply it.
    processFiles: vi.fn(),
    ...overrides,
  };
}

describe('cometchat-message-composer.drag-utils', () => {

  // ==================== handleDragEnterImpl ====================

  describe('handleDragEnterImpl', () => {
    it('should call preventDefault and stopPropagation', () => {
      const ctx = makeBaseCtx();
      const event = makeDragEvent();
      handleDragEnterImpl(ctx, event);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopPropagation).toHaveBeenCalled();
    });

    it('should increment dragCounter', () => {
      const ctx = makeBaseCtx();
      ctx.dragCounter = 0;
      handleDragEnterImpl(ctx, makeDragEvent());
      expect(ctx.dragCounter).toBe(1);
    });

    it('should set isDraggingOver to true', () => {
      const ctx = makeBaseCtx();
      handleDragEnterImpl(ctx, makeDragEvent());
      expect(ctx.isDraggingOver.set).toHaveBeenCalledWith(true);
    });

    it('should accumulate counter on multiple enters', () => {
      const ctx = makeBaseCtx();
      ctx.dragCounter = 0;
      handleDragEnterImpl(ctx, makeDragEvent());
      handleDragEnterImpl(ctx, makeDragEvent());
      expect(ctx.dragCounter).toBe(2);
    });
  });

  // ==================== handleDragLeaveImpl ====================

  describe('handleDragLeaveImpl', () => {
    it('should call preventDefault and stopPropagation', () => {
      const ctx = makeBaseCtx();
      ctx.dragCounter = 1;
      const event = makeDragEvent();
      handleDragLeaveImpl(ctx, event);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopPropagation).toHaveBeenCalled();
    });

    it('should decrement dragCounter', () => {
      const ctx = makeBaseCtx();
      ctx.dragCounter = 2;
      handleDragLeaveImpl(ctx, makeDragEvent());
      expect(ctx.dragCounter).toBe(1);
    });

    it('should set isDraggingOver to false when counter reaches 0', () => {
      const ctx = makeBaseCtx();
      ctx.dragCounter = 1;
      handleDragLeaveImpl(ctx, makeDragEvent());
      expect(ctx.isDraggingOver.set).toHaveBeenCalledWith(false);
    });

    it('should not set isDraggingOver to false when counter is still > 0', () => {
      const ctx = makeBaseCtx();
      ctx.dragCounter = 2;
      handleDragLeaveImpl(ctx, makeDragEvent());
      expect(ctx.isDraggingOver.set).not.toHaveBeenCalledWith(false);
    });
  });

  // ==================== handleDragOverImpl ====================

  describe('handleDragOverImpl', () => {
    it('should call preventDefault and stopPropagation', () => {
      const ctx = makeBaseCtx();
      const event = makeDragEvent();
      handleDragOverImpl(ctx, event);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopPropagation).toHaveBeenCalled();
    });
  });

  // ==================== handleDropImpl ====================

  describe('handleDropImpl', () => {
    it('should call preventDefault and stopPropagation', () => {
      const ctx = makeBaseCtx();
      const event = makeDragEvent(true);
      handleDropImpl(ctx, event);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopPropagation).toHaveBeenCalled();
    });

    it('should reset dragCounter to 0', () => {
      const ctx = makeBaseCtx();
      ctx.dragCounter = 3;
      handleDropImpl(ctx, makeDragEvent(true));
      expect(ctx.dragCounter).toBe(0);
    });

    it('should set isDraggingOver to false', () => {
      const ctx = makeBaseCtx();
      handleDropImpl(ctx, makeDragEvent(true));
      expect(ctx.isDraggingOver.set).toHaveBeenCalledWith(false);
    });
  });

  // ==================== handlePasteImpl ====================

  describe('handlePasteImpl', () => {
    it('should call preventDefault when clipboard contains a file', () => {
      const ctx = makeBaseCtx();
      const event = makeClipboardEvent(true);
      handlePasteImpl(ctx, event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should not call preventDefault for text-only paste', () => {
      const ctx = makeBaseCtx();
      const event = makeClipboardEvent(false);
      handlePasteImpl(ctx, event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should return early when clipboardData is null', () => {
      const ctx = makeBaseCtx();
      const event = { preventDefault: vi.fn(), clipboardData: null } as unknown as ClipboardEvent;
      expect(() => handlePasteImpl(ctx, event)).not.toThrow();
    });
  });

  // ==================== handleFileInputChangeImpl ====================

  describe('handleFileInputChangeImpl', () => {
    it('should process files from the input element', async () => {
      const ctx = makeBaseCtx();
      const file = makeFile('test.jpg', 'image/jpeg');
      const input = { files: [file], value: '' } as unknown as HTMLInputElement;
      const event = { target: input } as unknown as Event;
      handleFileInputChangeImpl(ctx, event);
      // File-input selection now routes into the composer's processFiles (multi-attachment tray path),
      // not the deprecated direct sendMediaMessage path.
      expect(ctx.processFiles).toHaveBeenCalledWith([file]);
    });

    it('should reset input value after processing', () => {
      const ctx = makeBaseCtx();
      const input = { files: [], value: 'some-path' } as unknown as HTMLInputElement;
      const event = { target: input } as unknown as Event;
      handleFileInputChangeImpl(ctx, event);
      expect(input.value).toBe('');
    });

    it('should not process when files is null', () => {
      const ctx = makeBaseCtx();
      const input = { files: null, value: '' } as unknown as HTMLInputElement;
      const event = { target: input } as unknown as Event;
      expect(() => handleFileInputChangeImpl(ctx, event)).not.toThrow();
    });
  });

  // ==================== processFilesImpl ====================

  describe('processFilesImpl', () => {
    it('should emit error for oversized files', () => {
      const ctx = makeBaseCtx({ maxFileSize: 100 }); // 100 bytes max
      const bigFile = makeFile('big.jpg', 'image/jpeg', 200);
      processFilesImpl(ctx, [bigFile]);
      expect(ctx.fileSizeError.set).toHaveBeenCalled();
      expect(ctx.emitError).toHaveBeenCalled();
    });

    it('should emit error for invalid file types', () => {
      const ctx = makeBaseCtx({ allowedFileTypes: ['image/jpeg'] });
      const invalidFile = makeFile('doc.pdf', 'application/pdf');
      processFilesImpl(ctx, [invalidFile]);
      expect(ctx.emitError).toHaveBeenCalled();
    });

    it('should not emit error for valid files', async () => {
      const ctx = makeBaseCtx({ allowedFileTypes: ['image/jpeg'] });
      const validFile = makeFile('photo.jpg', 'image/jpeg');
      processFilesImpl(ctx, [validFile]);
      expect(ctx.emitError).not.toHaveBeenCalled();
    });

    it('should process valid files and skip invalid ones', async () => {
      const ctx = makeBaseCtx({ allowedFileTypes: ['image/jpeg'] });
      const validFile = makeFile('photo.jpg', 'image/jpeg');
      const invalidFile = makeFile('doc.pdf', 'application/pdf');
      processFilesImpl(ctx, [validFile, invalidFile]);
      await new Promise(r => setTimeout(r, 50));
      expect(ctx.messageComposerService.sendMediaMessage).toHaveBeenCalledTimes(1);
    });

    it('should use default max file size of 100MB when not specified', () => {
      const ctx = makeBaseCtx({ maxFileSize: undefined });
      // 100MB + 1 byte
      const bigFile = { name: 'big.jpg', type: 'image/jpeg', size: 100 * 1024 * 1024 + 1 } as File;
      processFilesImpl(ctx, [bigFile]);
      expect(ctx.fileSizeError.set).toHaveBeenCalled();
    });
  });

  // ==================== sendFilesDirectlyImpl ====================

  describe('sendFilesDirectlyImpl', () => {
    it('should return early when no receiver', async () => {
      const ctx = makeBaseCtx({ getReceiver: vi.fn().mockReturnValue(undefined) });
      const file = makeFile('test.jpg', 'image/jpeg');
      await sendFilesDirectlyImpl(ctx, [file]);
      expect(ctx.messageComposerService.sendMediaMessage).not.toHaveBeenCalled();
    });

    it('should send each file as a media message', async () => {
      const ctx = makeBaseCtx();
      const file1 = makeFile('a.jpg', 'image/jpeg');
      const file2 = makeFile('b.jpg', 'image/jpeg');
      await sendFilesDirectlyImpl(ctx, [file1, file2]);
      expect(ctx.messageComposerService.sendMediaMessage).toHaveBeenCalledTimes(2);
    });

    it('should emit ccMessageSent inprogress then success', async () => {
      const ctx = makeBaseCtx();
      const file = makeFile('test.jpg', 'image/jpeg');
      const events: any[] = [];
      const sub = CometChatMessageEvents.ccMessageSent.subscribe(e => events.push(e));
      await sendFilesDirectlyImpl(ctx, [file]);
      sub.unsubscribe();
      expect(events.some(e => e.status === MessageStatus.inprogress)).toBe(true);
      expect(events.some(e => e.status === MessageStatus.success)).toBe(true);
    });

    it('should emit error event when sendMediaMessage fails', async () => {
      const ctx = makeBaseCtx({
        messageComposerService: {
          sendMediaMessage: vi.fn().mockRejectedValue(new Error('Upload failed')),
        } as any,
      });
      const file = makeFile('test.jpg', 'image/jpeg');
      await sendFilesDirectlyImpl(ctx, [file]);
      expect(ctx.emitError).toHaveBeenCalled();
    });

    it('should call playOutgoingMessageSound after sending', async () => {
      const ctx = makeBaseCtx();
      const file = makeFile('test.jpg', 'image/jpeg');
      await sendFilesDirectlyImpl(ctx, [file]);
      expect(ctx.playOutgoingMessageSound).toHaveBeenCalled();
    });

    it('should emit sendButtonClick with the last sent message', async () => {
      const ctx = makeBaseCtx();
      const file = makeFile('test.jpg', 'image/jpeg');
      await sendFilesDirectlyImpl(ctx, [file]);
      expect(ctx.sendButtonClick.emit).toHaveBeenCalledTimes(1);
    });

    it('should set parentMessageId on pending message when provided', async () => {
      const ctx = makeBaseCtx({ parentMessageId: 99 });
      const file = makeFile('test.jpg', 'image/jpeg');
      await sendFilesDirectlyImpl(ctx, [file]);
      expect(ctx.messageComposerService.sendMediaMessage).toHaveBeenCalledTimes(1);
      // parentMessageId is set on the pending message — verify service was called
      const callArgs = (ctx.messageComposerService.sendMediaMessage as any).mock.calls[0];
      expect(callArgs[4]).toBe(99); // parentMessageId arg
    });
  });
});
