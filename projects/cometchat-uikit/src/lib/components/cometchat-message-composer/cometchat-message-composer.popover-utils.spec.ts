/**
 * cometchat-message-composer.popover-utils Tests
 *
 * Covers: syncLegacyPopoverSignalsImpl, toggleEmojiKeyboardImpl,
 *         toggleAttachmentMenuImpl, toggleVoiceRecordingImpl,
 *         toggleStickersKeyboardImpl, toggleAIImpl,
 *         sendStickerMessageImpl.
 *
 * @module components/cometchat-message-composer/popover-utils
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import {
  syncLegacyPopoverSignalsImpl,
  toggleEmojiKeyboardImpl,
  toggleAttachmentMenuImpl,
  toggleVoiceRecordingImpl,
  toggleStickersKeyboardImpl,
  toggleAIImpl,
  sendStickerMessageImpl,
} from './cometchat-message-composer.popover-utils';
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

function makeCtx(overrides: Record<string, any> = {}) {
  let _content = 'none';
  let _isRecording = false;
  let _recordingDuration = 0;

  const contentToDisplay = {
    get value() { return _content; },
    set value(v: string) { _content = v; },
    set: vi.fn((v: string) => { _content = v; }),
  };
  const isEmojiKeyboardOpen = { set: vi.fn() };
  const isAttachmentMenuOpen = { set: vi.fn() };
  const isRecording = {
    get value() { return _isRecording; },
    set value(v: boolean) { _isRecording = v; },
    set: vi.fn((v: boolean) => { _isRecording = v; }),
  };
  const isStickersKeyboardOpen = { set: vi.fn() };
  const isMentionSuggestionsOpen = { set: vi.fn() };
  const recordingDuration = {
    get value() { return _recordingDuration; },
    set value(v: number) { _recordingDuration = v; },
    set: vi.fn((v: number) => { _recordingDuration = v; }),
  };

  const ctx: any = {
    get contentToDisplay() { return Object.assign(() => _content, contentToDisplay); },
    isEmojiKeyboardOpen,
    isAttachmentMenuOpen,
    get isRecording() { return Object.assign(() => _isRecording, isRecording); },
    isStickersKeyboardOpen,
    isMentionSuggestionsOpen,
    get recordingDuration() { return Object.assign(() => _recordingDuration, recordingDuration); },
    parentMessageId: undefined,
    messageToReplySignal: vi.fn().mockReturnValue(null),
    messageComposerService: {
      sendStickerMessage: vi.fn().mockResolvedValue(
        new CometChat.CustomMessage('r1', CometChat.RECEIVER_TYPE.USER, 'extension_sticker', {})
      ),
    },
    sendButtonClick: { emit: vi.fn() },
    announceMessageSent: vi.fn(),
    playOutgoingMessageSound: vi.fn(),
    exitReplyMode: vi.fn(),
    emitError: vi.fn(),
    announceRecordingStarted: vi.fn(),
    announceRecordingStopped: vi.fn(),
    ...overrides,
  };
  return ctx;
}

describe('cometchat-message-composer.popover-utils', () => {

  // ==================== syncLegacyPopoverSignalsImpl ====================

  describe('syncLegacyPopoverSignalsImpl', () => {
    it('should set isEmojiKeyboardOpen to true when content is emojiKeyboard', () => {
      const ctx = makeCtx();
      ctx.contentToDisplay.set('emojiKeyboard');
      syncLegacyPopoverSignalsImpl(ctx);
      expect(ctx.isEmojiKeyboardOpen.set).toHaveBeenCalledWith(true);
    });

    it('should set isAttachmentMenuOpen to true when content is attachments', () => {
      const ctx = makeCtx();
      ctx.contentToDisplay.set('attachments');
      syncLegacyPopoverSignalsImpl(ctx);
      expect(ctx.isAttachmentMenuOpen.set).toHaveBeenCalledWith(true);
    });

    it('should set isRecording to true when content is voiceRecording', () => {
      const ctx = makeCtx();
      ctx.contentToDisplay.set('voiceRecording');
      syncLegacyPopoverSignalsImpl(ctx);
      expect(ctx.isRecording.set).toHaveBeenCalledWith(true);
    });

    it('should set isStickersKeyboardOpen to true when content is stickers', () => {
      const ctx = makeCtx();
      ctx.contentToDisplay.set('stickers');
      syncLegacyPopoverSignalsImpl(ctx);
      expect(ctx.isStickersKeyboardOpen.set).toHaveBeenCalledWith(true);
    });

    it('should set all to false when content is none', () => {
      const ctx = makeCtx();
      ctx.contentToDisplay.set('none');
      syncLegacyPopoverSignalsImpl(ctx);
      expect(ctx.isEmojiKeyboardOpen.set).toHaveBeenCalledWith(false);
      expect(ctx.isAttachmentMenuOpen.set).toHaveBeenCalledWith(false);
      expect(ctx.isStickersKeyboardOpen.set).toHaveBeenCalledWith(false);
    });
  });

  // ==================== toggleEmojiKeyboardImpl ====================

  describe('toggleEmojiKeyboardImpl', () => {
    it('should open emoji keyboard when currently closed', () => {
      const ctx = makeCtx();
      ctx.contentToDisplay.value = 'none';
      toggleEmojiKeyboardImpl(ctx);
      expect(ctx.contentToDisplay.set).toHaveBeenCalledWith('emojiKeyboard');
    });

    it('should close emoji keyboard when currently open', () => {
      const ctx = makeCtx();
      ctx.contentToDisplay.set('emojiKeyboard');
      toggleEmojiKeyboardImpl(ctx);
      expect(ctx.contentToDisplay.set).toHaveBeenLastCalledWith('none');
    });

    it('should close mention suggestions', () => {
      const ctx = makeCtx();
      toggleEmojiKeyboardImpl(ctx);
      expect(ctx.isMentionSuggestionsOpen.set).toHaveBeenCalledWith(false);
    });
  });

  // ==================== toggleAttachmentMenuImpl ====================

  describe('toggleAttachmentMenuImpl', () => {
    it('should open attachment menu when currently closed', () => {
      const ctx = makeCtx();
      toggleAttachmentMenuImpl(ctx);
      expect(ctx.contentToDisplay.set).toHaveBeenCalledWith('attachments');
    });

    it('should close attachment menu when currently open', () => {
      const ctx = makeCtx();
      ctx.contentToDisplay.set('attachments');
      toggleAttachmentMenuImpl(ctx);
      expect(ctx.contentToDisplay.set).toHaveBeenLastCalledWith('none');
    });
  });

  // ==================== toggleVoiceRecordingImpl ====================

  describe('toggleVoiceRecordingImpl', () => {
    it('should start voice recording when currently closed', () => {
      const ctx = makeCtx();
      toggleVoiceRecordingImpl(ctx);
      expect(ctx.contentToDisplay.set).toHaveBeenCalledWith('voiceRecording');
      expect(ctx.isRecording.set).toHaveBeenCalledWith(true);
    });

    it('should stop voice recording when currently recording', () => {
      const ctx = makeCtx();
      ctx.contentToDisplay.set('voiceRecording');
      ctx.isRecording.set(true);
      toggleVoiceRecordingImpl(ctx);
      expect(ctx.contentToDisplay.set).toHaveBeenLastCalledWith('none');
      expect(ctx.isRecording.set).toHaveBeenCalledWith(false);
    });

    it('should call announceRecordingStarted when starting', () => {
      const ctx = makeCtx();
      toggleVoiceRecordingImpl(ctx);
      expect(ctx.announceRecordingStarted).toHaveBeenCalled();
    });

    it('should call announceRecordingStopped when stopping', () => {
      const ctx = makeCtx();
      ctx.contentToDisplay.set('voiceRecording');
      ctx.isRecording.set(true);
      toggleVoiceRecordingImpl(ctx);
      expect(ctx.announceRecordingStopped).toHaveBeenCalled();
    });
  });

  // ==================== toggleStickersKeyboardImpl ====================

  describe('toggleStickersKeyboardImpl', () => {
    it('should open stickers keyboard when currently closed', () => {
      const ctx = makeCtx();
      toggleStickersKeyboardImpl(ctx);
      expect(ctx.contentToDisplay.set).toHaveBeenCalledWith('stickers');
    });

    it('should close stickers keyboard when currently open', () => {
      const ctx = makeCtx();
      ctx.contentToDisplay.set('stickers');
      toggleStickersKeyboardImpl(ctx);
      expect(ctx.contentToDisplay.set).toHaveBeenLastCalledWith('none');
    });
  });

  // ==================== toggleAIImpl ====================

  describe('toggleAIImpl', () => {
    it('should open AI panel when currently closed', () => {
      const ctx = makeCtx();
      ctx.contentToDisplay.value = 'none';
      toggleAIImpl(ctx);
      expect(ctx.contentToDisplay.set).toHaveBeenCalledWith('ai');
    });

    it('should close AI panel when currently open', () => {
      const ctx = makeCtx();
      ctx.contentToDisplay.set('ai');
      toggleAIImpl(ctx);
      expect(ctx.contentToDisplay.set).toHaveBeenLastCalledWith('none');
    });
  });

  // ==================== sendStickerMessageImpl ====================

  describe('sendStickerMessageImpl', () => {
    it('should call sendStickerMessage on the service', async () => {
      const ctx = makeCtx();
      const receiver = makeUser('receiver1');
      await sendStickerMessageImpl(ctx, receiver, 'https://sticker.url', 'thumbs-up');
      expect(ctx.messageComposerService.sendStickerMessage).toHaveBeenCalledTimes(1);
    });

    it('should emit ccMessageSent inprogress then success', async () => {
      const ctx = makeCtx();
      const receiver = makeUser('receiver1');
      const events: any[] = [];
      const sub = CometChatMessageEvents.ccMessageSent.subscribe(e => events.push(e));
      await sendStickerMessageImpl(ctx, receiver, 'https://sticker.url', 'thumbs-up');
      sub.unsubscribe();
      expect(events.some(e => e.status === MessageStatus.inprogress)).toBe(true);
      expect(events.some(e => e.status === MessageStatus.success)).toBe(true);
    });

    it('should emit sendButtonClick with the sent message', async () => {
      const ctx = makeCtx();
      const receiver = makeUser('receiver1');
      await sendStickerMessageImpl(ctx, receiver, 'https://sticker.url', 'thumbs-up');
      expect(ctx.sendButtonClick.emit).toHaveBeenCalledTimes(1);
    });

    it('should call playOutgoingMessageSound', async () => {
      const ctx = makeCtx();
      const receiver = makeUser('receiver1');
      await sendStickerMessageImpl(ctx, receiver, 'https://sticker.url', 'thumbs-up');
      expect(ctx.playOutgoingMessageSound).toHaveBeenCalled();
    });

    it('should emit error and throw when sendStickerMessage fails', async () => {
      const ctx = makeCtx({
        messageComposerService: {
          sendStickerMessage: vi.fn().mockRejectedValue(new Error('sticker failed')),
        },
      });
      const receiver = makeUser('receiver1');
      await expect(sendStickerMessageImpl(ctx, receiver, 'https://sticker.url', 'thumbs-up')).rejects.toThrow();
      expect(ctx.emitError).toHaveBeenCalled();
    });

    it('should send to group receiver correctly', async () => {
      const ctx = makeCtx();
      const group = new CometChat.Group('group1', 'Test Group', CometChat.GROUP_TYPE.PUBLIC, '');
      await sendStickerMessageImpl(ctx, group, 'https://sticker.url', 'thumbs-up');
      expect(ctx.messageComposerService.sendStickerMessage).toHaveBeenCalledTimes(1);
    });
  });
});
