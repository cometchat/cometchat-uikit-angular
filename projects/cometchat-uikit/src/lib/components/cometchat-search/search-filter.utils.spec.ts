import { describe, it, expect } from 'vitest';
import {
  CometChatSearchFilter,
  CometChatSearchScope,
} from '../../Enums/Enums';
import {
  getAvailableFilters,
  getVisibleFilters,
  toggleFilter,
  shouldRenderConversations,
  shouldRenderMessages,
  isConversationFilter,
  isMessageFilter,
  hasValidSearchCriteria,
  hasValidMessageSearchCriteria,
} from './search-filter.utils';

describe('search-filter.utils', () => {
  const ALL_FILTERS = [
    CometChatSearchFilter.Audio,
    CometChatSearchFilter.Documents,
    CometChatSearchFilter.Groups,
    CometChatSearchFilter.Photos,
    CometChatSearchFilter.Videos,
    CometChatSearchFilter.Links,
    CometChatSearchFilter.Unread,
  ];

  describe('isConversationFilter', () => {
    it('should return true for conversation-type filters', () => {
      expect(isConversationFilter(CometChatSearchFilter.Conversations)).toBe(true);
      expect(isConversationFilter(CometChatSearchFilter.Unread)).toBe(true);
      expect(isConversationFilter(CometChatSearchFilter.Groups)).toBe(true);
    });

    it('should return false for message-type filters', () => {
      expect(isConversationFilter(CometChatSearchFilter.Photos)).toBe(false);
      expect(isConversationFilter(CometChatSearchFilter.Audio)).toBe(false);
      expect(isConversationFilter(CometChatSearchFilter.Links)).toBe(false);
    });
  });

  describe('isMessageFilter', () => {
    it('should return true for message-type filters', () => {
      expect(isMessageFilter(CometChatSearchFilter.Messages)).toBe(true);
      expect(isMessageFilter(CometChatSearchFilter.Photos)).toBe(true);
      expect(isMessageFilter(CometChatSearchFilter.Links)).toBe(true);
    });

    it('should return false for conversation-type filters', () => {
      expect(isMessageFilter(CometChatSearchFilter.Conversations)).toBe(false);
      expect(isMessageFilter(CometChatSearchFilter.Unread)).toBe(false);
    });
  });

  describe('getAvailableFilters', () => {
    it('should return all filter types when both scopes active', () => {
      const result = getAvailableFilters([], ALL_FILTERS);
      expect(result).toEqual(ALL_FILTERS);
    });

    it('should return only conversation filters when scope is Conversations', () => {
      const result = getAvailableFilters(
        [CometChatSearchScope.Conversations],
        ALL_FILTERS
      );
      result.forEach((f) => expect(isConversationFilter(f)).toBe(true));
    });

    it('should return only message filters when scope is Messages', () => {
      const result = getAvailableFilters(
        [CometChatSearchScope.Messages],
        ALL_FILTERS
      );
      result.forEach((f) => expect(isMessageFilter(f)).toBe(true));
    });

    it('should only return filters present in searchFilters input', () => {
      const subset = [CometChatSearchFilter.Photos, CometChatSearchFilter.Groups];
      const result = getAvailableFilters([], subset);
      expect(result).toEqual(subset);
    });
  });

  describe('toggleFilter', () => {
    it('should add a filter when not active', () => {
      const result = toggleFilter([], CometChatSearchFilter.Photos);
      expect(result).toContain(CometChatSearchFilter.Photos);
    });

    it('should remove a filter when already active', () => {
      const result = toggleFilter(
        [CometChatSearchFilter.Photos],
        CometChatSearchFilter.Photos
      );
      expect(result).not.toContain(CometChatSearchFilter.Photos);
    });

    it('should remove Links when activating a content filter', () => {
      // toggleFilter is now a simple add/remove — no exclusivity
      const result = toggleFilter(
        [CometChatSearchFilter.Links],
        CometChatSearchFilter.Photos
      );
      expect(result).toContain(CometChatSearchFilter.Links);
      expect(result).toContain(CometChatSearchFilter.Photos);
    });

    it('should remove content filters when activating Links', () => {
      // toggleFilter is now a simple add/remove — no exclusivity
      const result = toggleFilter(
        [CometChatSearchFilter.Photos, CometChatSearchFilter.Videos],
        CometChatSearchFilter.Links
      );
      expect(result).toContain(CometChatSearchFilter.Photos);
      expect(result).toContain(CometChatSearchFilter.Videos);
      expect(result).toContain(CometChatSearchFilter.Links);
    });

    it('should allow multiple conversation filters', () => {
      const result = toggleFilter(
        [CometChatSearchFilter.Conversations],
        CometChatSearchFilter.Groups
      );
      expect(result).toContain(CometChatSearchFilter.Conversations);
      expect(result).toContain(CometChatSearchFilter.Groups);
    });
  });

  describe('shouldRenderConversations', () => {
    it('should return true when search text exists and no filters', () => {
      expect(shouldRenderConversations('hello', [], [])).toBe(true);
    });

    it('should return false when uid is set', () => {
      expect(shouldRenderConversations('hello', [], [], 'user1')).toBe(false);
    });

    it('should return false when guid is set', () => {
      expect(shouldRenderConversations('hello', [], [], undefined, 'group1')).toBe(false);
    });

    it('should return true when conversation filter is active', () => {
      expect(
        shouldRenderConversations('', [CometChatSearchFilter.Unread], [])
      ).toBe(true);
    });

    it('should return false when only message filters active', () => {
      expect(
        shouldRenderConversations('', [CometChatSearchFilter.Photos], [])
      ).toBe(false);
    });

    it('should return false when scope excludes Conversations', () => {
      expect(
        shouldRenderConversations('hello', [], [CometChatSearchScope.Messages])
      ).toBe(false);
    });
  });

  describe('shouldRenderMessages', () => {
    it('should return true when search text exists and no filters', () => {
      expect(shouldRenderMessages('hello', [], [])).toBe(true);
    });

    it('should return true when uid is set', () => {
      expect(shouldRenderMessages('', [], [], 'user1')).toBe(true);
    });

    it('should return true when guid is set', () => {
      expect(shouldRenderMessages('', [], [], undefined, 'group1')).toBe(true);
    });

    it('should return true when message filter is active', () => {
      expect(
        shouldRenderMessages('', [CometChatSearchFilter.Photos], [])
      ).toBe(true);
    });

    it('should return false when conversation filter is active', () => {
      expect(
        shouldRenderMessages('', [CometChatSearchFilter.Unread], [])
      ).toBe(false);
    });

    it('should return false when scope excludes Messages', () => {
      expect(
        shouldRenderMessages('hello', [], [CometChatSearchScope.Conversations])
      ).toBe(false);
    });
  });

  describe('hasValidSearchCriteria', () => {
    it('should return true for non-empty keyword', () => {
      expect(hasValidSearchCriteria('test', [])).toBe(true);
    });

    it('should return false for empty keyword and no filters', () => {
      expect(hasValidSearchCriteria('', [])).toBe(false);
    });

    it('should return true for conversation filters without keyword', () => {
      expect(
        hasValidSearchCriteria('', [CometChatSearchFilter.Unread])
      ).toBe(true);
    });

    it('should return false for message filters without keyword', () => {
      expect(
        hasValidSearchCriteria('', [CometChatSearchFilter.Photos])
      ).toBe(false);
    });
  });

  describe('hasValidMessageSearchCriteria', () => {
    it('should return true for non-empty keyword', () => {
      expect(hasValidMessageSearchCriteria('test', [])).toBe(true);
    });

    it('should return true when uid is set', () => {
      expect(hasValidMessageSearchCriteria('', [], 'user1')).toBe(true);
    });

    it('should return true when guid is set', () => {
      expect(
        hasValidMessageSearchCriteria('', [], undefined, 'group1')
      ).toBe(true);
    });

    it('should return false for empty keyword and no filters', () => {
      expect(hasValidMessageSearchCriteria('', [])).toBe(false);
    });
  });
});
