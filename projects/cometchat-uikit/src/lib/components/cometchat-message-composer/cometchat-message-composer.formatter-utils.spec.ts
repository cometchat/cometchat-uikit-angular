/**
 * cometchat-message-composer.formatter-utils Tests
 *
 * Covers: getMediaMessageTypeImpl, forwardKeyEventToFormattersImpl,
 *         updateFormatterCaretPositionImpl, handleRichTextUpdateImpl,
 *         onEmojiPopoverOpenedImpl, onEmojiPopoverClosedImpl,
 *         onAttachmentPopoverOpenedImpl, onAttachmentPopoverClosedImpl,
 *         onVoiceRecorderPopoverOpenedImpl, onVoiceRecorderPopoverClosedImpl,
 *         onStickersPopoverOpenedImpl, onStickersPopoverClosedImpl.
 *
 * @module components/cometchat-message-composer/formatter-utils
 */

import { describe, it, expect, vi } from 'vitest';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import {
  getMediaMessageTypeImpl,
  forwardKeyEventToFormattersImpl,
  updateFormatterCaretPositionImpl,
  handleRichTextUpdateImpl,
  onEmojiPopoverOpenedImpl,
  onEmojiPopoverClosedImpl,
  onAttachmentPopoverOpenedImpl,
  onAttachmentPopoverClosedImpl,
  onVoiceRecorderPopoverOpenedImpl,
  onVoiceRecorderPopoverClosedImpl,
  onStickersPopoverOpenedImpl,
  onStickersPopoverClosedImpl,
} from './cometchat-message-composer.formatter-utils';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeKeyEvent(key: string): KeyboardEvent {
  return { key, preventDefault: vi.fn(), stopPropagation: vi.fn() } as unknown as KeyboardEvent;
}

function makeSelf(overrides: Record<string, any> = {}) {
  let _isRecording = false;
  const contentToDisplay = { value: 'none', set: vi.fn((v: string) => { contentToDisplay.value = v; }) };
  const isRecording = {
    get value() { return _isRecording; },
    set value(v: boolean) { _isRecording = v; },
    set: vi.fn((v: boolean) => { _isRecording = v; }),
  };
  const recordingDuration = { value: 0, set: vi.fn((v: number) => { recordingDuration.value = v; }) };

  return {
    contentToDisplay: Object.assign(() => contentToDisplay.value, contentToDisplay),
    isRecording: Object.assign(() => _isRecording, isRecording),
    recordingDuration: Object.assign(() => recordingDuration.value, recordingDuration),
    isEmojiKeyboardOpen: { set: vi.fn() },
    isAttachmentMenuOpen: { set: vi.fn() },
    isStickersKeyboardOpen: { set: vi.fn() },
    isMentionSuggestionsOpen: { set: vi.fn() },
    composerText: { set: vi.fn() },
    textChange: { emit: vi.fn() },
    updateMentionsCount: vi.fn(),
    handleTypingStart: vi.fn(),
    checkForMentionTrigger: vi.fn(),
    disableTypingEvents: false,
    disableMentions: false,
    customRichTextEditor: null,
    textFormatterArray: vi.fn().mockReturnValue([]),
    syncLegacyPopoverSignals: vi.fn(),
    focusEmojiButton: vi.fn(),
    focusAttachmentButton: vi.fn(),
    focusStickersButton: vi.fn(),
    announceRecordingStarted: vi.fn(),
    announceRecordingStopped: vi.fn(),
    ...overrides,
  };
}

describe('cometchat-message-composer.formatter-utils', () => {

  // ==================== getMediaMessageTypeImpl ====================

  describe('getMediaMessageTypeImpl', () => {
    it('should return IMAGE type for image', () => {
      expect(getMediaMessageTypeImpl('image')).toBe(CometChat.MESSAGE_TYPE.IMAGE);
    });

    it('should return VIDEO type for video', () => {
      expect(getMediaMessageTypeImpl('video')).toBe(CometChat.MESSAGE_TYPE.VIDEO);
    });

    it('should return AUDIO type for audio', () => {
      expect(getMediaMessageTypeImpl('audio')).toBe(CometChat.MESSAGE_TYPE.AUDIO);
    });

    it('should return FILE type for file', () => {
      expect(getMediaMessageTypeImpl('file')).toBe(CometChat.MESSAGE_TYPE.FILE);
    });

    it('should return FILE type for unknown type', () => {
      expect(getMediaMessageTypeImpl('unknown' as any)).toBe(CometChat.MESSAGE_TYPE.FILE);
    });
  });

  // ==================== forwardKeyEventToFormattersImpl ====================

  describe('forwardKeyEventToFormattersImpl', () => {
    it('should call onKeyDown on formatters for keydown events', () => {
      const formatter = { onKeyDown: vi.fn() };
      const self = makeSelf({ textFormatterArray: vi.fn().mockReturnValue([formatter]) });
      const event = makeKeyEvent('Enter');
      forwardKeyEventToFormattersImpl(self, event, 'keydown');
      expect(formatter.onKeyDown).toHaveBeenCalledWith(event);
    });

    it('should call onKeyUp on formatters for keyup events', () => {
      const formatter = { onKeyUp: vi.fn() };
      const self = makeSelf({ textFormatterArray: vi.fn().mockReturnValue([formatter]) });
      const event = makeKeyEvent('Enter');
      forwardKeyEventToFormattersImpl(self, event, 'keyup');
      expect(formatter.onKeyUp).toHaveBeenCalledWith(event);
    });

    it('should not throw when formatter has no onKeyDown', () => {
      const formatter = {}; // no onKeyDown
      const self = makeSelf({ textFormatterArray: vi.fn().mockReturnValue([formatter]) });
      expect(() => forwardKeyEventToFormattersImpl(self, makeKeyEvent('a'), 'keydown')).not.toThrow();
    });

    it('should handle empty formatters array', () => {
      const self = makeSelf({ textFormatterArray: vi.fn().mockReturnValue([]) });
      expect(() => forwardKeyEventToFormattersImpl(self, makeKeyEvent('a'), 'keydown')).not.toThrow();
    });
  });

  // ==================== handleRichTextUpdateImpl ====================

  describe('handleRichTextUpdateImpl', () => {
    it('should set composerText with the plain text', async () => {
      const self = makeSelf();
      handleRichTextUpdateImpl(self, '<p>Hello</p>', 'Hello');
      await Promise.resolve();
      expect(self.composerText.set).toHaveBeenCalledWith('Hello');
    });

    it('should emit textChange with the plain text', async () => {
      const self = makeSelf();
      handleRichTextUpdateImpl(self, '<p>Hello</p>', 'Hello');
      await Promise.resolve();
      expect(self.textChange.emit).toHaveBeenCalledWith('Hello');
    });

    it('should call updateMentionsCount', () => {
      const self = makeSelf();
      handleRichTextUpdateImpl(self, '<p>Hello</p>', 'Hello');
      expect(self.updateMentionsCount).toHaveBeenCalled();
    });

    it('should call handleTypingStart when typing events are enabled', () => {
      const self = makeSelf({ disableTypingEvents: false });
      handleRichTextUpdateImpl(self, '<p>Hello</p>', 'Hello');
      expect(self.handleTypingStart).toHaveBeenCalled();
    });

    it('should not call handleTypingStart when typing events are disabled', () => {
      const self = makeSelf({ disableTypingEvents: true });
      handleRichTextUpdateImpl(self, '<p>Hello</p>', 'Hello');
      expect(self.handleTypingStart).not.toHaveBeenCalled();
    });
  });

  // ==================== Popover open/close handlers ====================

  describe('onEmojiPopoverOpenedImpl', () => {
    it('should set contentToDisplay to emojiKeyboard', () => {
      const self = makeSelf();
      onEmojiPopoverOpenedImpl(self);
      expect(self.contentToDisplay.set).toHaveBeenCalledWith('emojiKeyboard');
    });

    it('should call syncLegacyPopoverSignals', () => {
      const self = makeSelf();
      onEmojiPopoverOpenedImpl(self);
      expect(self.syncLegacyPopoverSignals).toHaveBeenCalled();
    });
  });

  describe('onEmojiPopoverClosedImpl', () => {
    it('should set contentToDisplay to none', () => {
      const self = makeSelf();
      onEmojiPopoverClosedImpl(self);
      expect(self.contentToDisplay.set).toHaveBeenCalledWith('none');
    });

    it('should call focusEmojiButton', () => {
      const self = makeSelf();
      onEmojiPopoverClosedImpl(self);
      expect(self.focusEmojiButton).toHaveBeenCalled();
    });
  });

  describe('onAttachmentPopoverOpenedImpl', () => {
    it('should set contentToDisplay to attachments', () => {
      const self = makeSelf();
      onAttachmentPopoverOpenedImpl(self);
      expect(self.contentToDisplay.set).toHaveBeenCalledWith('attachments');
    });
  });

  describe('onAttachmentPopoverClosedImpl', () => {
    it('should set contentToDisplay to none', () => {
      const self = makeSelf();
      onAttachmentPopoverClosedImpl(self);
      expect(self.contentToDisplay.set).toHaveBeenCalledWith('none');
    });

    it('should call focusAttachmentButton', () => {
      const self = makeSelf();
      onAttachmentPopoverClosedImpl(self);
      expect(self.focusAttachmentButton).toHaveBeenCalled();
    });
  });

  describe('onVoiceRecorderPopoverOpenedImpl', () => {
    it('should set contentToDisplay to voiceRecording', () => {
      const self = makeSelf();
      onVoiceRecorderPopoverOpenedImpl(self);
      expect(self.contentToDisplay.set).toHaveBeenCalledWith('voiceRecording');
    });

    it('should set isRecording to true', () => {
      const self = makeSelf();
      onVoiceRecorderPopoverOpenedImpl(self);
      expect(self.isRecording.set).toHaveBeenCalledWith(true);
    });
  });

  describe('onVoiceRecorderPopoverClosedImpl', () => {
    it('should set contentToDisplay to none', () => {
      const self = makeSelf();
      onVoiceRecorderPopoverClosedImpl(self);
      expect(self.contentToDisplay.set).toHaveBeenCalledWith('none');
    });

    it('should stop recording when isRecording is true', () => {
      const self = makeSelf();
      // Set isRecording to true via the set method
      self.isRecording.set(true);
      self.isRecording.set.mockClear();
      onVoiceRecorderPopoverClosedImpl(self);
      expect(self.isRecording.set).toHaveBeenCalledWith(false);
      expect(self.recordingDuration.set).toHaveBeenCalledWith(0);
    });
  });

  describe('onStickersPopoverOpenedImpl', () => {
    it('should set contentToDisplay to stickers', () => {
      const self = makeSelf();
      onStickersPopoverOpenedImpl(self);
      expect(self.contentToDisplay.set).toHaveBeenCalledWith('stickers');
    });
  });

  describe('onStickersPopoverClosedImpl', () => {
    it('should set contentToDisplay to none', () => {
      const self = makeSelf();
      onStickersPopoverClosedImpl(self);
      expect(self.contentToDisplay.set).toHaveBeenCalledWith('none');
    });

    it('should call focusStickersButton', () => {
      const self = makeSelf();
      onStickersPopoverClosedImpl(self);
      expect(self.focusStickersButton).toHaveBeenCalled();
    });
  });
});
