/**
 * cometchat-message-composer.announcements Tests
 *
 * Covers: announcePoliteImpl, announceAssertiveImpl,
 *         announceReplyModeActivatedImpl, announceEditModeActivatedImpl,
 *         announceRecordingStartedImpl, announceRecordingStoppedImpl,
 *         announceMessageSentImpl, announceAttachmentAddedImpl,
 *         announceAttachmentRemovedImpl, announceFocusedMentionImpl,
 *         announceFormatStateChangeImpl.
 *
 * @module components/cometchat-message-composer/announcements
 */

import { describe, it, expect, vi } from 'vitest';
import {
  announcePoliteImpl,
  announceAssertiveImpl,
  announceReplyModeActivatedImpl,
  announceEditModeActivatedImpl,
  announceRecordingStartedImpl,
  announceRecordingStoppedImpl,
  announceMessageSentImpl,
  announceAttachmentAddedImpl,
  announceAttachmentRemovedImpl,
  announceFocusedMentionImpl,
  announceFormatStateChangeImpl,
} from './cometchat-message-composer.announcements';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeCtx(overrides: Record<string, any> = {}) {
  const liveRegionPoliteText = { value: '', set: vi.fn((v: string) => { liveRegionPoliteText.value = v; }) };
  const liveRegionAssertiveText = { value: '', set: vi.fn((v: string) => { liveRegionAssertiveText.value = v; }) };

  return {
    liveRegionPoliteText: Object.assign(() => liveRegionPoliteText.value, liveRegionPoliteText),
    liveRegionAssertiveText: Object.assign(() => liveRegionAssertiveText.value, liveRegionAssertiveText),
    liveAnnouncerService: { announce: vi.fn() },
    ...overrides,
  };
}

describe('cometchat-message-composer.announcements', () => {

  // ==================== announcePoliteImpl ====================

  describe('announcePoliteImpl', () => {
    it('should clear liveRegionPoliteText first then set message', () => {
      vi.useFakeTimers();
      const ctx = makeCtx();
      announcePoliteImpl(ctx, 'Hello');
      // First call clears
      expect(ctx.liveRegionPoliteText.set).toHaveBeenCalledWith('');
      // After timeout, sets message
      vi.advanceTimersByTime(50);
      expect(ctx.liveRegionPoliteText.set).toHaveBeenCalledWith('Hello');
      vi.useRealTimers();
    });

    it('should not throw for empty message', () => {
      vi.useFakeTimers();
      const ctx = makeCtx();
      expect(() => announcePoliteImpl(ctx, '')).not.toThrow();
      vi.useRealTimers();
    });
  });

  // ==================== announceAssertiveImpl ====================

  describe('announceAssertiveImpl', () => {
    it('should clear liveRegionAssertiveText first then set message', () => {
      vi.useFakeTimers();
      const ctx = makeCtx();
      announceAssertiveImpl(ctx, 'Alert');
      expect(ctx.liveRegionAssertiveText.set).toHaveBeenCalledWith('');
      vi.advanceTimersByTime(50);
      expect(ctx.liveRegionAssertiveText.set).toHaveBeenCalledWith('Alert');
      vi.useRealTimers();
    });
  });

  // ==================== announceReplyModeActivatedImpl ====================

  describe('announceReplyModeActivatedImpl', () => {
    it('should call announcePoliteImpl (sets liveRegionPoliteText)', () => {
      vi.useFakeTimers();
      const ctx = makeCtx();
      announceReplyModeActivatedImpl(ctx);
      expect(ctx.liveRegionPoliteText.set).toHaveBeenCalledWith('');
      vi.useRealTimers();
    });
  });

  // ==================== announceEditModeActivatedImpl ====================

  describe('announceEditModeActivatedImpl', () => {
    it('should call announcePoliteImpl', () => {
      vi.useFakeTimers();
      const ctx = makeCtx();
      announceEditModeActivatedImpl(ctx);
      expect(ctx.liveRegionPoliteText.set).toHaveBeenCalledWith('');
      vi.useRealTimers();
    });
  });

  // ==================== announceRecordingStartedImpl ====================

  describe('announceRecordingStartedImpl', () => {
    it('should call announceAssertiveImpl', () => {
      vi.useFakeTimers();
      const ctx = makeCtx();
      announceRecordingStartedImpl(ctx);
      expect(ctx.liveRegionAssertiveText.set).toHaveBeenCalledWith('');
      vi.useRealTimers();
    });
  });

  // ==================== announceRecordingStoppedImpl ====================

  describe('announceRecordingStoppedImpl', () => {
    it('should call announceAssertiveImpl', () => {
      vi.useFakeTimers();
      const ctx = makeCtx();
      announceRecordingStoppedImpl(ctx);
      expect(ctx.liveRegionAssertiveText.set).toHaveBeenCalledWith('');
      vi.useRealTimers();
    });
  });

  // ==================== announceMessageSentImpl ====================

  describe('announceMessageSentImpl', () => {
    it('should call announcePoliteImpl', () => {
      vi.useFakeTimers();
      const ctx = makeCtx();
      announceMessageSentImpl(ctx);
      expect(ctx.liveRegionPoliteText.set).toHaveBeenCalledWith('');
      vi.useRealTimers();
    });
  });

  // ==================== announceAttachmentAddedImpl ====================

  describe('announceAttachmentAddedImpl', () => {
    it('should call announcePoliteImpl with file name', () => {
      vi.useFakeTimers();
      const ctx = makeCtx();
      announceAttachmentAddedImpl(ctx, 'photo.jpg');
      expect(ctx.liveRegionPoliteText.set).toHaveBeenCalledWith('');
      vi.advanceTimersByTime(50);
      const lastCall = ctx.liveRegionPoliteText.set.mock.calls.at(-1);
      expect(lastCall[0]).toContain('photo.jpg');
      vi.useRealTimers();
    });
  });

  // ==================== announceAttachmentRemovedImpl ====================

  describe('announceAttachmentRemovedImpl', () => {
    it('should call announcePoliteImpl with file name', () => {
      vi.useFakeTimers();
      const ctx = makeCtx();
      announceAttachmentRemovedImpl(ctx, 'photo.jpg');
      expect(ctx.liveRegionPoliteText.set).toHaveBeenCalledWith('');
      vi.advanceTimersByTime(50);
      const lastCall = ctx.liveRegionPoliteText.set.mock.calls.at(-1);
      expect(lastCall[0]).toContain('photo.jpg');
      vi.useRealTimers();
    });
  });

  // ==================== announceFocusedMentionImpl ====================

  describe('announceFocusedMentionImpl', () => {
    it('should call announcePoliteImpl', () => {
      vi.useFakeTimers();
      const ctx = makeCtx();
      announceFocusedMentionImpl(ctx, 'Alice', 1, 5);
      expect(ctx.liveRegionPoliteText.set).toHaveBeenCalledWith('');
      vi.useRealTimers();
    });
  });

  // ==================== announceFormatStateChangeImpl ====================

  describe('announceFormatStateChangeImpl', () => {
    it('should call announcePoliteImpl when format is enabled', () => {
      vi.useFakeTimers();
      const ctx = makeCtx();
      announceFormatStateChangeImpl(ctx, 'Bold', true);
      expect(ctx.liveRegionPoliteText.set).toHaveBeenCalledWith('');
      vi.useRealTimers();
    });

    it('should call announcePoliteImpl when format is disabled', () => {
      vi.useFakeTimers();
      const ctx = makeCtx();
      announceFormatStateChangeImpl(ctx, 'Bold', false);
      expect(ctx.liveRegionPoliteText.set).toHaveBeenCalledWith('');
      vi.useRealTimers();
    });
  });
});
