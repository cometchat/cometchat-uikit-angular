/**
 * cometchat-message-composer.mention-utils Tests
 *
 * Covers: detectMentionTrigger, isMentionTriggerActive, getMentionCount,
 *         isMentionLimitReached, scrollMentionSuggestionIntoView,
 *         getMentionCharsToDelete.
 *
 * @module components/cometchat-message-composer/mention-utils
 */

import { describe, it, expect, vi } from 'vitest';
import {
  detectMentionTrigger,
  isMentionTriggerActive,
  getMentionCount,
  isMentionLimitReached,
  scrollMentionSuggestionIntoView,
  getMentionCharsToDelete,
} from './cometchat-message-composer.mention-utils';

describe('cometchat-message-composer.mention-utils', () => {

  // ==================== detectMentionTrigger ====================

  describe('detectMentionTrigger', () => {
    it('should return null for empty text', () => {
      expect(detectMentionTrigger('', 0)).toBeNull();
    });

    it('should return null when cursor is at position 0', () => {
      expect(detectMentionTrigger('@alice', 0)).toBeNull();
    });

    it('should return empty string when @ is the last character', () => {
      expect(detectMentionTrigger('@', 1)).toBe('');
    });

    it('should return search text after @', () => {
      expect(detectMentionTrigger('@ali', 4)).toBe('ali');
    });

    it('should return search text after @ with preceding space', () => {
      expect(detectMentionTrigger('Hello @ali', 10)).toBe('ali');
    });

    it('should return null when @ is followed by a space', () => {
      expect(detectMentionTrigger('@ alice', 7)).toBeNull();
    });

    it('should return null when no @ before cursor', () => {
      expect(detectMentionTrigger('Hello world', 11)).toBeNull();
    });

    it('should return null when @ is part of a completed mention (followed by space)', () => {
      // "@alice " — cursor after the space, trigger is closed
      expect(detectMentionTrigger('@alice ', 7)).toBeNull();
    });

    it('should handle @ at start of text', () => {
      expect(detectMentionTrigger('@bob', 4)).toBe('bob');
    });

    it('should handle cursor in the middle of search text', () => {
      expect(detectMentionTrigger('@ali', 3)).toBe('al');
    });
  });

  // ==================== isMentionTriggerActive ====================

  describe('isMentionTriggerActive', () => {
    it('should return true when @ trigger is active', () => {
      expect(isMentionTriggerActive('@ali', 4)).toBe(true);
    });

    it('should return false when no trigger is active', () => {
      expect(isMentionTriggerActive('Hello world', 11)).toBe(false);
    });

    it('should return false for empty text', () => {
      expect(isMentionTriggerActive('', 0)).toBe(false);
    });
  });

  // ==================== getMentionCount ====================

  describe('getMentionCount', () => {
    it('should return 0 for empty set', () => {
      expect(getMentionCount(new Set())).toBe(0);
    });

    it('should return the size of the set', () => {
      expect(getMentionCount(new Set(['uid1', 'uid2', 'uid3']))).toBe(3);
    });

    it('should return 1 for single-element set', () => {
      expect(getMentionCount(new Set(['uid1']))).toBe(1);
    });
  });

  // ==================== isMentionLimitReached ====================

  describe('isMentionLimitReached', () => {
    it('should return false when under the limit', () => {
      const uids = new Set(['uid1', 'uid2']);
      expect(isMentionLimitReached(uids, 'uid3')).toBe(false);
    });

    it('should return false when UID is already in the set (re-mention)', () => {
      // Fill to limit
      const uids = new Set(Array.from({ length: 10 }, (_, i) => `uid${i}`));
      expect(isMentionLimitReached(uids, 'uid0')).toBe(false); // already mentioned
    });

    it('should return true when at limit and new UID', () => {
      // MENTIONS_LIMIT is 10 based on the component
      const uids = new Set(Array.from({ length: 10 }, (_, i) => `uid${i}`));
      expect(isMentionLimitReached(uids, 'uid_new')).toBe(true);
    });

    it('should return false for empty set', () => {
      expect(isMentionLimitReached(new Set(), 'uid1')).toBe(false);
    });
  });

  // ==================== scrollMentionSuggestionIntoView ====================

  describe('scrollMentionSuggestionIntoView', () => {
    it('should not throw when container is null', () => {
      expect(() => scrollMentionSuggestionIntoView(null, 0)).not.toThrow();
    });

    it('should not throw when container is undefined', () => {
      expect(() => scrollMentionSuggestionIntoView(undefined, 0)).not.toThrow();
    });

    it('should call scrollIntoView on the item at the given index', () => {
      const container = document.createElement('div');
      const item0 = document.createElement('div');
      item0.setAttribute('data-mention-index', '0');
      item0.scrollIntoView = vi.fn();
      const item1 = document.createElement('div');
      item1.setAttribute('data-mention-index', '1');
      item1.scrollIntoView = vi.fn();
      container.appendChild(item0);
      container.appendChild(item1);

      scrollMentionSuggestionIntoView(container, 1);
      expect(item1.scrollIntoView).toHaveBeenCalledWith({ block: 'nearest', inline: 'nearest' });
    });

    it('should not throw when index is out of bounds', () => {
      const container = document.createElement('div');
      expect(() => scrollMentionSuggestionIntoView(container, 99)).not.toThrow();
    });
  });

  // ==================== getMentionCharsToDelete ====================

  describe('getMentionCharsToDelete', () => {
    it('should return 0 when no @ trigger before cursor', () => {
      expect(getMentionCharsToDelete('Hello world', 11)).toBe(0);
    });

    it('should return length of @searchText', () => {
      // "@ali" → 4 chars (@ali)
      expect(getMentionCharsToDelete('@ali', 4)).toBe(4);
    });

    it('should return length of @ with preceding space', () => {
      // "Hello @ali" cursor at 10 → "@ali" = 4 chars
      expect(getMentionCharsToDelete('Hello @ali', 10)).toBe(4);
    });

    it('should return 1 for just @', () => {
      expect(getMentionCharsToDelete('@', 1)).toBe(1);
    });

    it('should return 0 for empty text', () => {
      expect(getMentionCharsToDelete('', 0)).toBe(0);
    });
  });
});
