/**
 * cometchat-message-composer.focus-utils Tests
 *
 * Covers: focusTextInputImpl, focusAttachmentButtonImpl, focusEmojiButtonImpl,
 *         focusStickersButtonImpl, focusVoiceButtonImpl, insertTextAtCursorImpl.
 *
 * @module components/cometchat-message-composer/focus-utils
 */

import { describe, it, expect, vi } from 'vitest';
import {
  focusTextInputImpl,
  focusAttachmentButtonImpl,
  focusEmojiButtonImpl,
  focusStickersButtonImpl,
  focusVoiceButtonImpl,
  insertTextAtCursorImpl,
} from './cometchat-message-composer.focus-utils';

describe('cometchat-message-composer.focus-utils', () => {

  // ==================== focusTextInputImpl ====================

  describe('focusTextInputImpl', () => {
    it('should not throw when textInputRef is undefined', () => {
      expect(() => focusTextInputImpl({})).not.toThrow();
    });

    it('should not throw when textInputRef.nativeElement is null', () => {
      expect(() => focusTextInputImpl({ textInputRef: { nativeElement: null } })).not.toThrow();
    });

    it('should call focus and setSelectionRange on the input after timeout', async () => {
      vi.useFakeTimers();
      const input = {
        focus: vi.fn(),
        setSelectionRange: vi.fn(),
        value: 'Hello',
      };
      focusTextInputImpl({ textInputRef: { nativeElement: input } });
      vi.advanceTimersByTime(50);
      expect(input.focus).toHaveBeenCalled();
      expect(input.setSelectionRange).toHaveBeenCalledWith(5, 5);
      vi.useRealTimers();
    });

    it('should set cursor at end of text', async () => {
      vi.useFakeTimers();
      const input = { focus: vi.fn(), setSelectionRange: vi.fn(), value: 'Hello World' };
      focusTextInputImpl({ textInputRef: { nativeElement: input } });
      vi.advanceTimersByTime(50);
      expect(input.setSelectionRange).toHaveBeenCalledWith(11, 11);
      vi.useRealTimers();
    });
  });

  // ==================== focusAttachmentButtonImpl ====================

  describe('focusAttachmentButtonImpl', () => {
    it('should not throw when attachmentButtonRef is undefined', () => {
      expect(() => focusAttachmentButtonImpl({})).not.toThrow();
    });

    it('should focus the button inside the element after timeout', () => {
      vi.useFakeTimers();
      const btn = document.createElement('button');
      btn.focus = vi.fn();
      const el = document.createElement('div');
      el.appendChild(btn);
      focusAttachmentButtonImpl({ attachmentButtonRef: { nativeElement: el } });
      vi.advanceTimersByTime(0);
      expect(btn.focus).toHaveBeenCalled();
      vi.useRealTimers();
    });

    it('should focus the element itself when no button child exists', () => {
      vi.useFakeTimers();
      const el = document.createElement('div');
      el.focus = vi.fn();
      focusAttachmentButtonImpl({ attachmentButtonRef: { nativeElement: el } });
      vi.advanceTimersByTime(0);
      expect(el.focus).toHaveBeenCalled();
      vi.useRealTimers();
    });
  });

  // ==================== focusEmojiButtonImpl ====================

  describe('focusEmojiButtonImpl', () => {
    it('should not throw when emojiButtonRef is undefined', () => {
      expect(() => focusEmojiButtonImpl({})).not.toThrow();
    });

    it('should focus the button inside the element after timeout', () => {
      vi.useFakeTimers();
      const btn = document.createElement('button');
      btn.focus = vi.fn();
      const el = document.createElement('div');
      el.appendChild(btn);
      focusEmojiButtonImpl({ emojiButtonRef: { nativeElement: el } });
      vi.advanceTimersByTime(0);
      expect(btn.focus).toHaveBeenCalled();
      vi.useRealTimers();
    });
  });

  // ==================== focusStickersButtonImpl ====================

  describe('focusStickersButtonImpl', () => {
    it('should not throw when stickersButtonRef is undefined', () => {
      expect(() => focusStickersButtonImpl({})).not.toThrow();
    });

    it('should focus the button inside the element after timeout', () => {
      vi.useFakeTimers();
      const btn = document.createElement('button');
      btn.focus = vi.fn();
      const el = document.createElement('div');
      el.appendChild(btn);
      focusStickersButtonImpl({ stickersButtonRef: { nativeElement: el } });
      vi.advanceTimersByTime(0);
      expect(btn.focus).toHaveBeenCalled();
      vi.useRealTimers();
    });
  });

  // ==================== focusVoiceButtonImpl ====================

  describe('focusVoiceButtonImpl', () => {
    it('should not throw when voiceButtonRef is undefined', () => {
      expect(() => focusVoiceButtonImpl({})).not.toThrow();
    });

    it('should focus the button inside the element after timeout', () => {
      vi.useFakeTimers();
      const btn = document.createElement('button');
      btn.focus = vi.fn();
      const el = document.createElement('div');
      el.appendChild(btn);
      focusVoiceButtonImpl({ voiceButtonRef: { nativeElement: el } });
      vi.advanceTimersByTime(0);
      expect(btn.focus).toHaveBeenCalled();
      vi.useRealTimers();
    });
  });

  // ==================== insertTextAtCursorImpl ====================

  describe('insertTextAtCursorImpl', () => {
    it('should insert text at the cursor position', () => {
      const composerText = { value: 'Hello World', set: vi.fn((v: string) => { composerText.value = v; }) };
      const self = {
        composerText: Object.assign(() => composerText.value, { set: composerText.set }),
        cursorPosition: () => 5,
      };
      const newPos = insertTextAtCursorImpl(self, ' Beautiful');
      expect(composerText.set).toHaveBeenCalledWith('Hello Beautiful World');
      expect(newPos).toBe(15); // 5 + 10
    });

    it('should insert at the beginning when cursor is at 0', () => {
      const composerText = { value: 'World', set: vi.fn((v: string) => { composerText.value = v; }) };
      const self = {
        composerText: Object.assign(() => composerText.value, { set: composerText.set }),
        cursorPosition: () => 0,
      };
      const newPos = insertTextAtCursorImpl(self, 'Hello ');
      expect(composerText.set).toHaveBeenCalledWith('Hello World');
      expect(newPos).toBe(6);
    });

    it('should insert at the end when cursor is at text length', () => {
      const composerText = { value: 'Hello', set: vi.fn((v: string) => { composerText.value = v; }) };
      const self = {
        composerText: Object.assign(() => composerText.value, { set: composerText.set }),
        cursorPosition: () => 5,
      };
      const newPos = insertTextAtCursorImpl(self, ' World');
      expect(composerText.set).toHaveBeenCalledWith('Hello World');
      expect(newPos).toBe(11);
    });

    it('should clamp cursor position to valid range', () => {
      const composerText = { value: 'Hi', set: vi.fn((v: string) => { composerText.value = v; }) };
      const self = {
        composerText: Object.assign(() => composerText.value, { set: composerText.set }),
        cursorPosition: () => 100, // beyond text length
      };
      const newPos = insertTextAtCursorImpl(self, '!');
      expect(composerText.set).toHaveBeenCalledWith('Hi!');
      expect(newPos).toBe(3);
    });

    it('should handle empty text insertion', () => {
      const composerText = { value: 'Hello', set: vi.fn((v: string) => { composerText.value = v; }) };
      const self = {
        composerText: Object.assign(() => composerText.value, { set: composerText.set }),
        cursorPosition: () => 3,
      };
      const newPos = insertTextAtCursorImpl(self, '');
      expect(composerText.set).toHaveBeenCalledWith('Hello');
      expect(newPos).toBe(3);
    });

    it('should handle empty composer text', () => {
      const composerText = { value: '', set: vi.fn((v: string) => { composerText.value = v; }) };
      const self = {
        composerText: Object.assign(() => composerText.value, { set: composerText.set }),
        cursorPosition: () => 0,
      };
      const newPos = insertTextAtCursorImpl(self, 'Hello');
      expect(composerText.set).toHaveBeenCalledWith('Hello');
      expect(newPos).toBe(5);
    });
  });
});
