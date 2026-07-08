/**
 * cometchat-conversations.keyboard Tests
 *
 * Covers: focusNextConversationItem, focusPreviousConversationItem,
 *         scrollConversationItemIntoView, focusConversationItemAtIndex,
 *         extendConversationSelectionTo, getConversationKey.
 *
 * @module components/cometchat-conversations/keyboard
 */

import { describe, it, expect, vi } from 'vitest';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import {
  focusNextConversationItem,
  focusPreviousConversationItem,
  scrollConversationItemIntoView,
  focusConversationItemAtIndex,
  extendConversationSelectionTo,
  getConversationKey,
} from './cometchat-conversations.keyboard';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeConversation(id: string): CometChat.Conversation {
  const conv = new CometChat.Conversation();
  (conv as any).conversationId = id;
  (conv as any).getConversationId = () => id;
  return conv;
}

function makeCdr() {
  return { markForCheck: vi.fn() };
}

describe('cometchat-conversations.keyboard', () => {

  // ==================== focusNextConversationItem ====================

  describe('focusNextConversationItem', () => {
    it('should return same index when list is empty', () => {
      const cdr = makeCdr();
      const result = focusNextConversationItem([], 0, cdr as any, vi.fn());
      expect(result).toBe(0);
      expect(cdr.markForCheck).not.toHaveBeenCalled();
    });

    it('should move to index 0 when focusedIndex is -1', () => {
      const convs = [makeConversation('c1'), makeConversation('c2')];
      const cdr = makeCdr();
      const result = focusNextConversationItem(convs, -1, cdr as any, vi.fn());
      expect(result).toBe(0);
    });

    it('should move to next index', () => {
      const convs = [makeConversation('c1'), makeConversation('c2'), makeConversation('c3')];
      const cdr = makeCdr();
      const result = focusNextConversationItem(convs, 1, cdr as any, vi.fn());
      expect(result).toBe(2);
    });

    it('should wrap to 0 from last index', () => {
      const convs = [makeConversation('c1'), makeConversation('c2')];
      const cdr = makeCdr();
      const result = focusNextConversationItem(convs, 1, cdr as any, vi.fn());
      expect(result).toBe(0);
    });

    it('should call markForCheck', () => {
      const convs = [makeConversation('c1')];
      const cdr = makeCdr();
      focusNextConversationItem(convs, 0, cdr as any, vi.fn());
      expect(cdr.markForCheck).toHaveBeenCalled();
    });

    it('should call scrollFocusedItemIntoView', () => {
      const convs = [makeConversation('c1')];
      const scroll = vi.fn();
      focusNextConversationItem(convs, 0, makeCdr() as any, scroll);
      expect(scroll).toHaveBeenCalled();
    });
  });

  // ==================== focusPreviousConversationItem ====================

  describe('focusPreviousConversationItem', () => {
    it('should return same index when list is empty', () => {
      const result = focusPreviousConversationItem([], 0, makeCdr() as any, vi.fn());
      expect(result).toBe(0);
    });

    it('should move to last index when focusedIndex is -1', () => {
      const convs = [makeConversation('c1'), makeConversation('c2'), makeConversation('c3')];
      const result = focusPreviousConversationItem(convs, -1, makeCdr() as any, vi.fn());
      expect(result).toBe(2);
    });

    it('should move to previous index', () => {
      const convs = [makeConversation('c1'), makeConversation('c2'), makeConversation('c3')];
      const result = focusPreviousConversationItem(convs, 2, makeCdr() as any, vi.fn());
      expect(result).toBe(1);
    });

    it('should wrap to last index from 0', () => {
      const convs = [makeConversation('c1'), makeConversation('c2')];
      const result = focusPreviousConversationItem(convs, 0, makeCdr() as any, vi.fn());
      expect(result).toBe(1);
    });

    it('should call markForCheck', () => {
      const convs = [makeConversation('c1')];
      const cdr = makeCdr();
      focusPreviousConversationItem(convs, 0, cdr as any, vi.fn());
      expect(cdr.markForCheck).toHaveBeenCalled();
    });
  });

  // ==================== scrollConversationItemIntoView ====================

  describe('scrollConversationItemIntoView', () => {
    it('should not throw when listContainer is undefined', () => {
      vi.useFakeTimers();
      const timers: ReturnType<typeof setTimeout>[] = [];
      expect(() => scrollConversationItemIntoView(undefined, 0, timers)).not.toThrow();
      vi.advanceTimersByTime(0);
      vi.useRealTimers();
    });

    it('should push a timer to pendingTimers', () => {
      vi.useFakeTimers();
      const container = document.createElement('div');
      const timers: ReturnType<typeof setTimeout>[] = [];
      scrollConversationItemIntoView(container, 0, timers);
      expect(timers.length).toBe(1);
      vi.useRealTimers();
    });

    it('should call scrollIntoView on the element at the given index', () => {
      vi.useFakeTimers();
      const container = document.createElement('div');
      const item = document.createElement('div');
      item.setAttribute('data-index', '2');
      item.scrollIntoView = vi.fn();
      container.appendChild(item);

      const timers: ReturnType<typeof setTimeout>[] = [];
      scrollConversationItemIntoView(container, 2, timers);
      vi.advanceTimersByTime(0);
      expect(item.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      vi.useRealTimers();
    });
  });

  // ==================== focusConversationItemAtIndex ====================

  describe('focusConversationItemAtIndex', () => {
    it('should not throw when listContainer is undefined', () => {
      vi.useFakeTimers();
      const timers: ReturnType<typeof setTimeout>[] = [];
      expect(() => focusConversationItemAtIndex(undefined, 0, timers)).not.toThrow();
      vi.advanceTimersByTime(0);
      vi.useRealTimers();
    });

    it('should push a timer to pendingTimers', () => {
      vi.useFakeTimers();
      const container = document.createElement('div');
      const timers: ReturnType<typeof setTimeout>[] = [];
      focusConversationItemAtIndex(container, 0, timers);
      expect(timers.length).toBe(1);
      vi.useRealTimers();
    });

    it('should focus the tabindex element inside the item', () => {
      vi.useFakeTimers();
      const container = document.createElement('div');
      const item = document.createElement('div');
      item.setAttribute('data-index', '1');
      const focusable = document.createElement('button');
      focusable.setAttribute('tabindex', '0');
      focusable.focus = vi.fn();
      item.appendChild(focusable);
      container.appendChild(item);

      const timers: ReturnType<typeof setTimeout>[] = [];
      focusConversationItemAtIndex(container, 1, timers);
      vi.advanceTimersByTime(0);
      expect(focusable.focus).toHaveBeenCalled();
      vi.useRealTimers();
    });
  });

  // ==================== extendConversationSelectionTo ====================

  describe('extendConversationSelectionTo', () => {
    it('should add all conversations in range to selection', () => {
      const convs = [
        makeConversation('c1'),
        makeConversation('c2'),
        makeConversation('c3'),
        makeConversation('c4'),
      ];
      const selected = new Set<string>();
      const result = extendConversationSelectionTo(convs, selected, 1, 3);
      expect(result.has('c2')).toBe(true);
      expect(result.has('c3')).toBe(true);
      expect(result.has('c4')).toBe(true);
    });

    it('should handle reversed range (endIndex < startIndex)', () => {
      const convs = [makeConversation('c1'), makeConversation('c2'), makeConversation('c3')];
      const selected = new Set<string>();
      const result = extendConversationSelectionTo(convs, selected, 2, 0);
      expect(result.has('c1')).toBe(true);
      expect(result.has('c2')).toBe(true);
      expect(result.has('c3')).toBe(true);
    });

    it('should preserve existing selections', () => {
      const convs = [makeConversation('c1'), makeConversation('c2')];
      const selected = new Set(['existing-id']);
      const result = extendConversationSelectionTo(convs, selected, 0, 1);
      expect(result.has('existing-id')).toBe(true);
    });

    it('should not mutate the original set', () => {
      const convs = [makeConversation('c1'), makeConversation('c2')];
      const selected = new Set<string>();
      const result = extendConversationSelectionTo(convs, selected, 0, 1);
      expect(result).not.toBe(selected);
    });

    it('should handle single item range', () => {
      const convs = [makeConversation('c1'), makeConversation('c2')];
      const selected = new Set<string>();
      const result = extendConversationSelectionTo(convs, selected, 1, 1);
      expect(result.has('c2')).toBe(true);
      expect(result.size).toBe(1);
    });
  });

  // ==================== getConversationKey ====================

  describe('getConversationKey', () => {
    it('should return the conversation ID', () => {
      const conv = makeConversation('conv-123');
      expect(getConversationKey(conv)).toBe('conv-123');
    });
  });
});
