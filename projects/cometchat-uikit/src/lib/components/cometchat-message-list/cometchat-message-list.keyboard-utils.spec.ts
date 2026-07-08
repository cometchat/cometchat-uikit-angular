/**
 * cometchat-message-list.keyboard-utils Tests
 *
 * Covers: isEventFromOverlayImpl, setFocusedIndexImpl,
 *         getMessageTabIndexImpl.
 *
 * @module components/cometchat-message-list/keyboard-utils
 */

import { describe, it, expect, vi } from 'vitest';
import {
  isEventFromOverlayImpl,
  setFocusedIndexImpl,
  getMessageTabIndexImpl,
} from './cometchat-message-list.keyboard-utils';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeKeyEvent(target: HTMLElement): KeyboardEvent {
  return { target, key: 'ArrowDown', preventDefault: vi.fn() } as unknown as KeyboardEvent;
}

function makeSelf(overrides: Record<string, any> = {}) {
  const focusedMessageIndex = { value: -1, set: vi.fn((v: number) => { focusedMessageIndex.value = v; }) };

  return {
    focusedMessageIndex: Object.assign(() => focusedMessageIndex.value, focusedMessageIndex),
    listContainer: null,
    listNavigationService: {
      getItemTabIndex: vi.fn((index: number, focused: number) => index === focused ? 0 : -1),
    },
    messagesWithSeparators: vi.fn().mockReturnValue([]),
    ...overrides,
  };
}

describe('cometchat-message-list.keyboard-utils', () => {

  // ==================== isEventFromOverlayImpl ====================

  describe('isEventFromOverlayImpl', () => {
    it('should return false for null target', () => {
      const event = { target: null } as unknown as KeyboardEvent;
      expect(isEventFromOverlayImpl(event)).toBe(false);
    });

    it('should return false for regular element', () => {
      const div = document.createElement('div');
      document.body.appendChild(div);
      const event = makeKeyEvent(div);
      expect(isEventFromOverlayImpl(event)).toBe(false);
      document.body.removeChild(div);
    });

    it('should return true for element inside cometchat-emoji-keyboard', () => {
      const container = document.createElement('cometchat-emoji-keyboard');
      const inner = document.createElement('button');
      container.appendChild(inner);
      document.body.appendChild(container);
      const event = makeKeyEvent(inner);
      expect(isEventFromOverlayImpl(event)).toBe(true);
      document.body.removeChild(container);
    });

    it('should return true for element inside cometchat-popover__content', () => {
      const container = document.createElement('div');
      container.className = 'cometchat-popover__content';
      const inner = document.createElement('button');
      container.appendChild(inner);
      document.body.appendChild(container);
      const event = makeKeyEvent(inner);
      expect(isEventFromOverlayImpl(event)).toBe(true);
      document.body.removeChild(container);
    });

    it('should return true for element inside cometchat-confirm-dialog', () => {
      const container = document.createElement('cometchat-confirm-dialog');
      const inner = document.createElement('button');
      container.appendChild(inner);
      document.body.appendChild(container);
      const event = makeKeyEvent(inner);
      expect(isEventFromOverlayImpl(event)).toBe(true);
      document.body.removeChild(container);
    });

    it('should return true for element inside aria-modal', () => {
      const container = document.createElement('div');
      container.setAttribute('aria-modal', 'true');
      const inner = document.createElement('button');
      container.appendChild(inner);
      document.body.appendChild(container);
      const event = makeKeyEvent(inner);
      expect(isEventFromOverlayImpl(event)).toBe(true);
      document.body.removeChild(container);
    });

    it('should return false for element without closest method', () => {
      const target = { closest: undefined } as unknown as HTMLElement;
      const event = { target } as unknown as KeyboardEvent;
      expect(isEventFromOverlayImpl(event)).toBe(false);
    });
  });

  // ==================== setFocusedIndexImpl ====================

  describe('setFocusedIndexImpl', () => {
    it('should set focusedMessageIndex', () => {
      const self = makeSelf();
      setFocusedIndexImpl(self, 5);
      expect(self.focusedMessageIndex.set).toHaveBeenCalledWith(5);
    });

    it('should not throw when listContainer is null', () => {
      const self = makeSelf({ listContainer: null });
      expect(() => setFocusedIndexImpl(self, 0)).not.toThrow();
    });

    it('should scroll element into view when found', () => {
      vi.useFakeTimers();
      const container = document.createElement('div');
      const msgEl = document.createElement('div');
      msgEl.className = 'cometchat-message-list__message';
      msgEl.setAttribute('data-index', '3');
      msgEl.scrollIntoView = vi.fn();
      msgEl.focus = vi.fn();
      container.appendChild(msgEl);

      const self = makeSelf({ listContainer: { nativeElement: container } });
      setFocusedIndexImpl(self, 3);
      vi.advanceTimersByTime(0);
      expect(msgEl.scrollIntoView).toHaveBeenCalled();
      vi.useRealTimers();
    });
  });

  // ==================== getMessageTabIndexImpl ====================

  describe('getMessageTabIndexImpl', () => {
    it('should return 0 for first message when no item is focused', () => {
      const items = [
        { type: 'date-separator', date: 123 },
        { type: 'message', message: {} },
        { type: 'message', message: {} },
      ];
      const self = makeSelf({
        messagesWithSeparators: vi.fn().mockReturnValue(items),
        focusedMessageIndex: Object.assign(() => -1, { set: vi.fn() }),
      });
      // First message is at index 1
      expect(getMessageTabIndexImpl(self, 1)).toBe(0);
    });

    it('should return -1 for non-first message when no item is focused', () => {
      const items = [
        { type: 'message', message: {} },
        { type: 'message', message: {} },
      ];
      const self = makeSelf({
        messagesWithSeparators: vi.fn().mockReturnValue(items),
        focusedMessageIndex: Object.assign(() => -1, { set: vi.fn() }),
      });
      expect(getMessageTabIndexImpl(self, 1)).toBe(-1);
    });

    it('should delegate to listNavigationService when focused index is set', () => {
      const self = makeSelf({
        focusedMessageIndex: Object.assign(() => 2, { set: vi.fn() }),
      });
      getMessageTabIndexImpl(self, 2);
      expect(self.listNavigationService.getItemTabIndex).toHaveBeenCalledWith(2, 2);
    });

    it('should return 0 for focused item', () => {
      const self = makeSelf({
        focusedMessageIndex: Object.assign(() => 3, { set: vi.fn() }),
        listNavigationService: {
          getItemTabIndex: vi.fn().mockReturnValue(0),
        },
      });
      expect(getMessageTabIndexImpl(self, 3)).toBe(0);
    });

    it('should return -1 for non-focused item', () => {
      const self = makeSelf({
        focusedMessageIndex: Object.assign(() => 3, { set: vi.fn() }),
        listNavigationService: {
          getItemTabIndex: vi.fn().mockReturnValue(-1),
        },
      });
      expect(getMessageTabIndexImpl(self, 5)).toBe(-1);
    });
  });
});
