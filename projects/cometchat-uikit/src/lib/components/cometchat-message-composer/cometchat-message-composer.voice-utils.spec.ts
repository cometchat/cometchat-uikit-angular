/**
 * cometchat-message-composer.voice-utils Tests
 *
 * Covers: handleRecordingCancelImpl, handleRecordingErrorImpl,
 *         startInlineRecordingImpl, handleRecordingCompleteImpl.
 *
 * @module components/cometchat-message-composer/voice-utils
 */

import { describe, it, expect, vi } from 'vitest';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import {
  handleRecordingCancelImpl,
  handleRecordingErrorImpl,
  startInlineRecordingImpl,
  handleRecordingCompleteImpl,
  VoiceUtilsContext,
} from './cometchat-message-composer.voice-utils';
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

function makeCtx(overrides: Partial<VoiceUtilsContext> = {}): VoiceUtilsContext {
  let _isRecording = false;
  const isRecording = {
    get value() { return _isRecording; },
    set: vi.fn((v: boolean) => { _isRecording = v; }),
  };

  return {
    isRecording: Object.assign(() => _isRecording, isRecording),
    recordingDuration: { set: vi.fn() },
    contentToDisplay: { set: vi.fn() },
    parentMessageId: undefined,
    enableRichText: false,
    customRichTextEditor: null,
    messageComposerService: {
      sendMediaMessage: vi.fn().mockResolvedValue(
        new CometChat.MediaMessage('r1', {} as File, 'audio', CometChat.RECEIVER_TYPE.USER)
      ),
    } as any,
    messageToReplySignal: vi.fn().mockReturnValue(null),
    getReceiver: vi.fn().mockReturnValue(makeUser('receiver1')),
    exitReplyMode: vi.fn(),
    playOutgoingMessageSound: vi.fn(),
    emitError: vi.fn(),
    focusRichTextEditor: vi.fn(),
    focusTextInput: vi.fn(),
    closeAllPopups: vi.fn(),
    syncLegacyPopoverSignals: vi.fn(),
    isMentionSuggestionsOpen: { set: vi.fn() },
    sendButtonClick: { emit: vi.fn() },
    announceRecordingStarted: vi.fn(),
    announceRecordingStopped: vi.fn(),
    announceMessageSent: vi.fn(),
    ...overrides,
  };
}

describe('cometchat-message-composer.voice-utils', () => {

  // ==================== handleRecordingCancelImpl ====================

  describe('handleRecordingCancelImpl', () => {
    it('should set isRecording to false', () => {
      const ctx = makeCtx();
      handleRecordingCancelImpl(ctx);
      expect(ctx.isRecording.set).toHaveBeenCalledWith(false);
    });

    it('should reset recordingDuration to 0', () => {
      const ctx = makeCtx();
      handleRecordingCancelImpl(ctx);
      expect(ctx.recordingDuration.set).toHaveBeenCalledWith(0);
    });

    it('should set contentToDisplay to none', () => {
      const ctx = makeCtx();
      handleRecordingCancelImpl(ctx);
      expect(ctx.contentToDisplay.set).toHaveBeenCalledWith('none');
    });

    it('should call syncLegacyPopoverSignals', () => {
      const ctx = makeCtx();
      handleRecordingCancelImpl(ctx);
      expect(ctx.syncLegacyPopoverSignals).toHaveBeenCalled();
    });

    it('should call announceRecordingStopped', () => {
      const ctx = makeCtx();
      handleRecordingCancelImpl(ctx);
      expect(ctx.announceRecordingStopped).toHaveBeenCalled();
    });

    it('should focus text input when not using rich text', () => {
      const ctx = makeCtx({ enableRichText: false, customRichTextEditor: null });
      handleRecordingCancelImpl(ctx);
      expect(ctx.focusTextInput).toHaveBeenCalled();
    });

    it('should focus rich text editor when using rich text', () => {
      const ctx = makeCtx({ enableRichText: true, customRichTextEditor: {} });
      handleRecordingCancelImpl(ctx);
      expect(ctx.focusRichTextEditor).toHaveBeenCalled();
    });
  });

  // ==================== handleRecordingErrorImpl ====================

  describe('handleRecordingErrorImpl', () => {
    it('should set isRecording to false', () => {
      const ctx = makeCtx();
      handleRecordingErrorImpl(ctx, new Error('mic error'));
      expect(ctx.isRecording.set).toHaveBeenCalledWith(false);
    });

    it('should reset recordingDuration to 0', () => {
      const ctx = makeCtx();
      handleRecordingErrorImpl(ctx, new Error('mic error'));
      expect(ctx.recordingDuration.set).toHaveBeenCalledWith(0);
    });

    it('should call emitError with the error', () => {
      const ctx = makeCtx();
      const err = new Error('mic error');
      handleRecordingErrorImpl(ctx, err);
      expect(ctx.emitError).toHaveBeenCalledWith(err);
    });

    it('should call announceRecordingStopped', () => {
      const ctx = makeCtx();
      handleRecordingErrorImpl(ctx, new Error('mic error'));
      expect(ctx.announceRecordingStopped).toHaveBeenCalled();
    });

    it('should set contentToDisplay to none', () => {
      const ctx = makeCtx();
      handleRecordingErrorImpl(ctx, new Error('mic error'));
      expect(ctx.contentToDisplay.set).toHaveBeenCalledWith('none');
    });
  });

  // ==================== startInlineRecordingImpl ====================

  describe('startInlineRecordingImpl', () => {
    it('should call closeAllPopups', () => {
      const ctx = makeCtx();
      startInlineRecordingImpl(ctx);
      expect(ctx.closeAllPopups).toHaveBeenCalled();
    });

    it('should set isRecording to true', () => {
      const ctx = makeCtx();
      startInlineRecordingImpl(ctx);
      expect(ctx.isRecording.set).toHaveBeenCalledWith(true);
    });

    it('should set contentToDisplay to voiceRecording', () => {
      const ctx = makeCtx();
      startInlineRecordingImpl(ctx);
      expect(ctx.contentToDisplay.set).toHaveBeenCalledWith('voiceRecording');
    });

    it('should call announceRecordingStarted', () => {
      const ctx = makeCtx();
      startInlineRecordingImpl(ctx);
      expect(ctx.announceRecordingStarted).toHaveBeenCalled();
    });

    it('should close mention suggestions', () => {
      const ctx = makeCtx();
      startInlineRecordingImpl(ctx);
      expect(ctx.isMentionSuggestionsOpen.set).toHaveBeenCalledWith(false);
    });
  });

  // ==================== handleRecordingCompleteImpl ====================

  describe('handleRecordingCompleteImpl', () => {
    it('should set isRecording to false', async () => {
      const ctx = makeCtx();
      const blob = new Blob(['audio'], { type: 'audio/webm' });
      await handleRecordingCompleteImpl(ctx, blob);
      expect(ctx.isRecording.set).toHaveBeenCalledWith(false);
    });

    it('should return early when no receiver', async () => {
      const ctx = makeCtx({ getReceiver: vi.fn().mockReturnValue(undefined) });
      const blob = new Blob(['audio'], { type: 'audio/webm' });
      await handleRecordingCompleteImpl(ctx, blob);
      expect(ctx.messageComposerService.sendMediaMessage).not.toHaveBeenCalled();
    });

    it('should call sendMediaMessage with audio file', async () => {
      const ctx = makeCtx();
      const blob = new Blob(['audio'], { type: 'audio/webm' });
      await handleRecordingCompleteImpl(ctx, blob);
      expect(ctx.messageComposerService.sendMediaMessage).toHaveBeenCalledTimes(1);
    });

    it('should emit ccMessageSent inprogress then success', async () => {
      const ctx = makeCtx();
      const blob = new Blob(['audio'], { type: 'audio/webm' });
      const events: any[] = [];
      const sub = CometChatMessageEvents.ccMessageSent.subscribe(e => events.push(e));
      await handleRecordingCompleteImpl(ctx, blob);
      sub.unsubscribe();
      expect(events.some(e => e.status === MessageStatus.inprogress)).toBe(true);
      expect(events.some(e => e.status === MessageStatus.success)).toBe(true);
    });

    it('should call playOutgoingMessageSound on success', async () => {
      const ctx = makeCtx();
      const blob = new Blob(['audio'], { type: 'audio/webm' });
      await handleRecordingCompleteImpl(ctx, blob);
      expect(ctx.playOutgoingMessageSound).toHaveBeenCalled();
    });

    it('should emit error when sendMediaMessage fails', async () => {
      const ctx = makeCtx({
        messageComposerService: {
          sendMediaMessage: vi.fn().mockRejectedValue(new Error('upload failed')),
        } as any,
      });
      const blob = new Blob(['audio'], { type: 'audio/webm' });
      await handleRecordingCompleteImpl(ctx, blob);
      expect(ctx.emitError).toHaveBeenCalled();
    });
  });
});
