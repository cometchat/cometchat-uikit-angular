/**
 * cometchat-message-composer.event-handlers Tests
 *
 * Covers: handleEmojiKeyboardCloseImpl, handleActionSheetCloseImpl,
 *         handleStickersKeyboardCloseImpl, handleVoiceRecordingClickImpl,
 *         emitErrorImpl, getFileSizeErrorMessageImpl,
 *         closeAllPopupsImpl, toggleFixedToolbarImpl.
 *
 * @module components/cometchat-message-composer/event-handlers
 */

import { describe, it, expect, vi } from 'vitest';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import {
  handleEmojiKeyboardCloseImpl,
  handleActionSheetCloseImpl,
  handleStickersKeyboardCloseImpl,
  handleVoiceRecordingClickImpl,
  emitErrorImpl,
  getFileSizeErrorMessageImpl,
  closeAllPopupsImpl,
  toggleFixedToolbarImpl,
} from './cometchat-message-composer.event-handlers';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeSelf(overrides: Record<string, any> = {}) {
  let _isRecording = false;
  let _isFixedToolbarShown = false;
  let _isFixedToolbarManuallyToggled = false;

  return {
    isEmojiKeyboardOpen: { set: vi.fn() },
    isStickersKeyboardOpen: { set: vi.fn() },
    isAttachmentMenuOpen: { set: vi.fn() },
    isMentionSuggestionsOpen: { set: vi.fn() },
    isFullscreenViewerOpen: Object.assign(vi.fn().mockReturnValue(false), { set: vi.fn() }),
    isRecording: Object.assign(() => _isRecording, { set: vi.fn((v: boolean) => { _isRecording = v; }) }),
    isFixedToolbarShown: Object.assign(() => _isFixedToolbarShown, { set: vi.fn((v: boolean) => { _isFixedToolbarShown = v; }) }),
    isFixedToolbarManuallyToggled: Object.assign(() => _isFixedToolbarManuallyToggled, { set: vi.fn((v: boolean) => { _isFixedToolbarManuallyToggled = v; }) }),
    isBubbleMenuVisible: { set: vi.fn() },
    textSelection: { set: vi.fn() },
    bubbleMenuPosition: { set: vi.fn() },
    recordingDuration: { set: vi.fn() },
    contentToDisplay: { set: vi.fn() },
    fileSizeError: vi.fn().mockReturnValue(null),
    syncLegacyPopoverSignals: vi.fn(),
    closeAllPopoverInstances: vi.fn(),
    focusRichTextEditor: vi.fn(),
    focusTextInput: vi.fn(),
    announceRecordingStarted: vi.fn(),
    announceRecordingStopped: vi.fn(),
    announceAssertive: vi.fn(),
    error: { emit: vi.fn() },
    customRichTextEditor: null,
    textInputRef: null,
    enableRichText: false,
    messageComposerService: { clearMentionSuggestions: vi.fn() },
    cdr: { markForCheck: vi.fn() },
    getPluralFileType: vi.fn().mockReturnValue('photos'),
    closeAllPopups: vi.fn(),
    closeAllPopoverInstances: vi.fn(),
    ...overrides,
  };
}

describe('cometchat-message-composer.event-handlers', () => {

  // ==================== handleEmojiKeyboardCloseImpl ====================

  describe('handleEmojiKeyboardCloseImpl', () => {
    it('should set isEmojiKeyboardOpen to false', () => {
      const self = makeSelf();
      handleEmojiKeyboardCloseImpl(self);
      expect(self.isEmojiKeyboardOpen.set).toHaveBeenCalledWith(false);
    });

    it('should set contentToDisplay to none', () => {
      const self = makeSelf();
      handleEmojiKeyboardCloseImpl(self);
      expect(self.contentToDisplay.set).toHaveBeenCalledWith('none');
    });

    it('should call syncLegacyPopoverSignals', () => {
      const self = makeSelf();
      handleEmojiKeyboardCloseImpl(self);
      expect(self.syncLegacyPopoverSignals).toHaveBeenCalled();
    });

    it('should focus text input when no rich text editor', () => {
      const self = makeSelf({ customRichTextEditor: null });
      handleEmojiKeyboardCloseImpl(self);
      expect(self.focusTextInput).toHaveBeenCalled();
    });

    it('should focus rich text editor when editor exists', () => {
      const self = makeSelf({ customRichTextEditor: {} });
      handleEmojiKeyboardCloseImpl(self);
      expect(self.focusRichTextEditor).toHaveBeenCalled();
    });
  });

  // ==================== handleActionSheetCloseImpl ====================

  describe('handleActionSheetCloseImpl', () => {
    it('should set contentToDisplay to none', () => {
      const self = makeSelf();
      handleActionSheetCloseImpl(self);
      expect(self.contentToDisplay.set).toHaveBeenCalledWith('none');
    });

    it('should call syncLegacyPopoverSignals', () => {
      const self = makeSelf();
      handleActionSheetCloseImpl(self);
      expect(self.syncLegacyPopoverSignals).toHaveBeenCalled();
    });
  });

  // ==================== handleStickersKeyboardCloseImpl ====================

  describe('handleStickersKeyboardCloseImpl', () => {
    it('should set contentToDisplay to none', () => {
      const self = makeSelf();
      handleStickersKeyboardCloseImpl(self);
      expect(self.contentToDisplay.set).toHaveBeenCalledWith('none');
    });

    it('should focus text input when no rich text editor', () => {
      const self = makeSelf({ customRichTextEditor: null });
      handleStickersKeyboardCloseImpl(self);
      expect(self.focusTextInput).toHaveBeenCalled();
    });
  });

  // ==================== handleVoiceRecordingClickImpl ====================

  describe('handleVoiceRecordingClickImpl', () => {
    it('should toggle isRecording from false to true', () => {
      const self = makeSelf();
      // isRecording() returns false by default
      handleVoiceRecordingClickImpl(self);
      expect(self.isRecording.set).toHaveBeenCalledWith(true);
    });

    it('should toggle isRecording from true to false', () => {
      let _isRecording = true;
      const self = makeSelf({
        isRecording: Object.assign(() => _isRecording, {
          set: vi.fn((v: boolean) => { _isRecording = v; }),
        }),
      });
      handleVoiceRecordingClickImpl(self);
      expect(self.isRecording.set).toHaveBeenCalledWith(false);
    });

    it('should call announceRecordingStarted when starting', () => {
      const self = makeSelf();
      handleVoiceRecordingClickImpl(self);
      expect(self.announceRecordingStarted).toHaveBeenCalled();
    });

    it('should call announceRecordingStopped when stopping', () => {
      let _isRecording = true;
      const self = makeSelf({
        isRecording: Object.assign(() => _isRecording, {
          set: vi.fn((v: boolean) => { _isRecording = v; }),
        }),
      });
      handleVoiceRecordingClickImpl(self);
      expect(self.announceRecordingStopped).toHaveBeenCalled();
    });

    it('should call closeAllPopups when starting recording', () => {
      const self = makeSelf({ closeAllPopups: vi.fn() });
      handleVoiceRecordingClickImpl(self);
      expect(self.closeAllPopups).toHaveBeenCalled();
    });

    it('should reset recordingDuration when stopping', () => {
      let _isRecording = true;
      const self = makeSelf({
        isRecording: Object.assign(() => _isRecording, {
          set: vi.fn((v: boolean) => { _isRecording = v; }),
        }),
      });
      handleVoiceRecordingClickImpl(self);
      expect(self.recordingDuration.set).toHaveBeenCalledWith(0);
    });
  });

  // ==================== emitErrorImpl ====================

  describe('emitErrorImpl', () => {
    it('should emit error event', () => {
      const self = makeSelf();
      emitErrorImpl(self, new Error('test error'));
      expect(self.error.emit).toHaveBeenCalled();
    });

    it('should call announceAssertive with error message', () => {
      const self = makeSelf();
      emitErrorImpl(self, new Error('test error'));
      expect(self.announceAssertive).toHaveBeenCalled();
    });

    it('should handle CometChatException directly', () => {
      const self = makeSelf();
      const exception = new CometChat.CometChatException({ code: 'ERR', message: 'SDK error' });
      emitErrorImpl(self, exception);
      expect(self.error.emit).toHaveBeenCalledWith(exception);
    });

    it('should convert plain Error to CometChatException', () => {
      const self = makeSelf();
      emitErrorImpl(self, new Error('plain error'));
      const emitted = self.error.emit.mock.calls[0][0];
      expect(emitted).toBeInstanceOf(CometChat.CometChatException);
    });

    it('should convert string error to CometChatException', () => {
      const self = makeSelf();
      emitErrorImpl(self, 'string error');
      const emitted = self.error.emit.mock.calls[0][0];
      expect(emitted).toBeInstanceOf(CometChat.CometChatException);
    });
  });

  // ==================== getFileSizeErrorMessageImpl ====================

  describe('getFileSizeErrorMessageImpl', () => {
    it('should return empty string when no error', () => {
      const self = makeSelf({ fileSizeError: vi.fn().mockReturnValue(null) });
      expect(getFileSizeErrorMessageImpl(self)).toBe('');
    });

    it('should return error message with count and limit', () => {
      const self = makeSelf({
        fileSizeError: vi.fn().mockReturnValue({ count: 1, fileType: 'photo', limitMB: 10 }),
      });
      const msg = getFileSizeErrorMessageImpl(self);
      expect(msg).toContain('1');
      expect(msg).toContain('10 MB');
    });

    it('should use plural form for multiple files', () => {
      const self = makeSelf({
        fileSizeError: vi.fn().mockReturnValue({ count: 3, fileType: 'photo', limitMB: 10 }),
        getPluralFileType: vi.fn().mockReturnValue('photos'),
      });
      const msg = getFileSizeErrorMessageImpl(self);
      expect(msg).toContain('3');
      expect(self.getPluralFileType).toHaveBeenCalledWith('photo');
    });
  });

  // ==================== closeAllPopupsImpl ====================

  describe('closeAllPopupsImpl', () => {
    it('should set contentToDisplay to none', () => {
      const self = makeSelf();
      closeAllPopupsImpl(self);
      expect(self.contentToDisplay.set).toHaveBeenCalledWith('none');
    });

    it('should call closeAllPopoverInstances', () => {
      const self = makeSelf();
      closeAllPopupsImpl(self);
      expect(self.closeAllPopoverInstances).toHaveBeenCalled();
    });

    it('should set isEmojiKeyboardOpen to false', () => {
      const self = makeSelf();
      closeAllPopupsImpl(self);
      expect(self.isEmojiKeyboardOpen.set).toHaveBeenCalledWith(false);
    });

    it('should set isStickersKeyboardOpen to false', () => {
      const self = makeSelf();
      closeAllPopupsImpl(self);
      expect(self.isStickersKeyboardOpen.set).toHaveBeenCalledWith(false);
    });

    it('should set isAttachmentMenuOpen to false', () => {
      const self = makeSelf();
      closeAllPopupsImpl(self);
      expect(self.isAttachmentMenuOpen.set).toHaveBeenCalledWith(false);
    });

    it('should clear mention suggestions', () => {
      const self = makeSelf();
      closeAllPopupsImpl(self);
      expect(self.messageComposerService.clearMentionSuggestions).toHaveBeenCalled();
    });
  });

  // ==================== toggleFixedToolbarImpl ====================

  describe('toggleFixedToolbarImpl', () => {
    it('should toggle isFixedToolbarShown from false to true', () => {
      const self = makeSelf();
      toggleFixedToolbarImpl(self);
      expect(self.isFixedToolbarShown.set).toHaveBeenCalledWith(true);
    });

    it('should set isFixedToolbarManuallyToggled to match new state', () => {
      const self = makeSelf();
      toggleFixedToolbarImpl(self);
      expect(self.isFixedToolbarManuallyToggled.set).toHaveBeenCalledWith(true);
    });

    it('should hide bubble menu when showing toolbar', () => {
      const self = makeSelf();
      toggleFixedToolbarImpl(self);
      expect(self.isBubbleMenuVisible.set).toHaveBeenCalledWith(false);
    });

    it('should call focusRichTextEditor', () => {
      const self = makeSelf();
      toggleFixedToolbarImpl(self);
      expect(self.focusRichTextEditor).toHaveBeenCalled();
    });

    it('should call cdr.markForCheck', () => {
      const self = makeSelf();
      toggleFixedToolbarImpl(self);
      expect(self.cdr.markForCheck).toHaveBeenCalled();
    });
  });
});
