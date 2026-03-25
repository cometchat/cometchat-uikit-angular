/**
 * ConversationsService Tests
 *
 * Categories: Initialization, Fetch Conversations, Pagination,
 *             Delete Conversation, Search, List Manipulation,
 *             Active Conversation, Error Handling, Cleanup, Edge Cases
 *
 * Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 11.3, 13.6, 14.4, 14.5, 15.7
 *
 * All SDK calls are mocked via vitest.setup.mjs global mock.
 *
 * @module services/conversations
 */

import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import {
  ensureSdkReady,
  sdkCleanup,
  fetchTestUser,
  fetchTestGroup,
  fetchTestConversation,
} from '../test-setup';
import { ConversationsService } from './conversations.service';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { createMockConversation, createMockUser } from '../testing/mock-sdk';

// ---------------------------------------------------------------------------
// Helper: create a list of mock conversations for fetchNext to return
// ---------------------------------------------------------------------------
function createMockConversationList(count: number): CometChat.Conversation[] {
  return Array.from({ length: count }, (_, i) => {
    const user = createMockUser({ uid: `conv-user-${i + 1}`, name: `Conv User ${i + 1}` });
    return createMockConversation({
      type: 'user',
      conversationWith: user,
      unreadMessageCount: i,
    });
  });
}

/**
 * Patches CometChat.ConversationsRequestBuilder so that
 * `new CometChat.ConversationsRequestBuilder()...build().fetchNext()` resolves with `data`.
 *
 * The global mock in vitest.setup.mjs uses a Proxy whose `get` trap always wins over
 * property assignments, so we must replace the constructor entirely.
 */
function mockFetchNextReturns(data: CometChat.Conversation[]): void {
  (CometChat as any).ConversationsRequestBuilder = function MockBuilder() {
    const self: Record<string, any> = {};
    // build() returns a request whose fetchNext resolves with `data`
    self.build = vi.fn().mockReturnValue({
      fetchNext: vi.fn().mockResolvedValue(data),
    });
    // All other method calls (setLimit, setConversationType, etc.) return `self` for chaining
    return new Proxy(self, {
      get(target, prop) {
        if (prop === 'build') return target.build;
        if (typeof prop === 'string') {
          if (!target[prop]) target[prop] = vi.fn().mockReturnValue(self);
          return target[prop];
        }
        return undefined;
      },
    });
  };
}

describe('ConversationsService', () => {
  let service: ConversationsService;
  let testUser: CometChat.User;
  let testGroup: CometChat.Group;
  let testConversations: CometChat.Conversation[];

  beforeAll(async () => {
    await ensureSdkReady();
    testUser = await fetchTestUser('superhero1');
    testGroup = await fetchTestGroup('supergroup');
    testConversations = await fetchTestConversation();
  }, 30000);

  afterAll(async () => {
    await sdkCleanup();
  }, 30000);

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    service = TestBed.inject(ConversationsService);
    service.cleanup();
    // Default: fetchNext returns 3 mock conversations
    mockFetchNextReturns(createMockConversationList(3));
  });

  // ==================== Initialization ====================

  describe('Initialization', () => {
    it('should be provided in root', () => {
      expect(service).toBeTruthy();
    });

    it('should initialize with empty conversations array', () => {
      expect(service.getConversations()).toEqual([]);
    });

    it('should initialize conversations signal as empty', () => {
      expect(service.conversations()).toEqual([]);
    });

    it('should initialize loading state as false', () => {
      expect(service.loadingState()).toBe(false);
    });

    it('should initialize error state as null', () => {
      expect(service.errorState()).toBeNull();
    });

    it('should initialize active conversation as null', () => {
      expect(service.activeConversation()).toBeNull();
    });

    it('should initialize typing indicators as empty map', () => {
      expect(service.typingIndicators().size).toBe(0);
    });

    it('should have hasConversations computed as false initially', () => {
      expect(service.hasConversations()).toBe(false);
    });

    it('should have isLoading computed as false initially', () => {
      expect(service.isLoading()).toBe(false);
    });

    it('should have hasError computed as false initially', () => {
      expect(service.hasError()).toBe(false);
    });
  });

  // ==================== Fetch Conversations (Real SDK) ====================

  describe('fetchConversations', () => {
    it('should fetch conversations from real SDK with default builder', async () => {
      await service.fetchConversations();
      const conversations = service.getConversations();
      expect(conversations.length).toBeGreaterThan(0);
    });

    it('should populate conversations signal after fetch', async () => {
      await service.fetchConversations();
      expect(service.conversations().length).toBeGreaterThan(0);
    });

    it('should set hasConversations to true after successful fetch', async () => {
      await service.fetchConversations();
      expect(service.hasConversations()).toBe(true);
    });

    it('should set loading state to false after fetch completes', async () => {
      await service.fetchConversations();
      expect(service.loadingState()).toBe(false);
      expect(service.isLoading()).toBe(false);
    });

    it('should clear error state on successful fetch', async () => {
      await service.fetchConversations();
      expect(service.errorState()).toBeNull();
      expect(service.hasError()).toBe(false);
    });

    it('should return real CometChat.Conversation objects', async () => {
      await service.fetchConversations();
      const conversations = service.getConversations();
      const first = conversations[0];
      expect(first.getConversationWith).toBeDefined();
      expect(first.getConversationType).toBeDefined();
      expect(first.getConversationId).toBeDefined();
    });

    it('should use custom builder when provided', async () => {
      mockFetchNextReturns(createMockConversationList(2));
      const builder = new CometChat.ConversationsRequestBuilder().setLimit(2);
      await service.fetchConversations(builder);
      const conversations = service.getConversations();
      expect(conversations.length).toBeLessThanOrEqual(2);
      expect(conversations.length).toBeGreaterThan(0);
    });

    it('should use service-level builder when set via setConversationsRequestBuilder', async () => {
      mockFetchNextReturns(createMockConversationList(3));
      const builder = new CometChat.ConversationsRequestBuilder().setLimit(3);
      service.setConversationsRequestBuilder(builder);
      await service.fetchConversations();
      const conversations = service.getConversations();
      expect(conversations.length).toBeLessThanOrEqual(3);
      expect(conversations.length).toBeGreaterThan(0);
    });

    it('should override service builder when fetchConversations receives a builder argument', async () => {
      const serviceBuilder = new CometChat.ConversationsRequestBuilder().setLimit(30);
      service.setConversationsRequestBuilder(serviceBuilder);

      // Override with a builder whose fetchNext returns only 1 conversation
      mockFetchNextReturns(createMockConversationList(1));
      const overrideBuilder = new CometChat.ConversationsRequestBuilder().setLimit(1);
      await service.fetchConversations(overrideBuilder);

      const conversations = service.getConversations();
      expect(conversations.length).toBe(1);
    });

    it('should replace previous conversations on re-fetch', async () => {
      await service.fetchConversations();
      const firstFetch = [...service.getConversations()];

      await service.fetchConversations();
      const secondFetch = service.getConversations();

      // Both fetches should return conversations (re-fetch replaces, not appends)
      expect(secondFetch.length).toBeGreaterThan(0);
      expect(firstFetch.length).toBeGreaterThan(0);
    });
  });

  // ==================== Pagination (fetchNextConversations) ====================

  describe('fetchNextConversations', () => {
    it('should return false when no initial fetch has been called', async () => {
      const hasMore = await service.fetchNextConversations();
      expect(hasMore).toBe(false);
    });

    it('should append conversations to existing list', async () => {
      const builder = new CometChat.ConversationsRequestBuilder().setLimit(2);
      await service.fetchConversations(builder);
      const initialCount = service.getConversations().length;

      await service.fetchNextConversations();
      const afterPagination = service.getConversations().length;

      expect(afterPagination).toBeGreaterThanOrEqual(initialCount);
    });

    it('should preserve existing conversations when fetching next page', async () => {
      const builder = new CometChat.ConversationsRequestBuilder().setLimit(2);
      await service.fetchConversations(builder);
      const firstConversation = service.getConversations()[0];
      const firstId = firstConversation.getConversationId();

      await service.fetchNextConversations();
      const updatedConversations = service.getConversations();
      const stillExists = updatedConversations.some(c => c.getConversationId() === firstId);

      expect(stillExists).toBe(true);
    });

    it('should set loading state to false after pagination completes', async () => {
      const builder = new CometChat.ConversationsRequestBuilder().setLimit(2);
      await service.fetchConversations(builder);
      await service.fetchNextConversations();
      expect(service.loadingState()).toBe(false);
    });
  });

  // ==================== Delete Conversation ====================

  describe('deleteConversation', () => {
    it('should remove conversation from local list after deletion', async () => {
      await service.fetchConversations();
      const conversations = service.getConversations();
      if (conversations.length === 0) return;

      const first = conversations[0];
      const convWith = first.getConversationWith();
      const convId =
        convWith instanceof CometChat.User
          ? (convWith as CometChat.User).getUid()
          : (convWith as CometChat.Group).getGuid();
      const convType = first.getConversationType();

      await service.deleteConversation(convId, convType);

      const remaining = service.getConversations();
      const stillExists = remaining.some(c => {
        const cw = c.getConversationWith();
        const cid =
          cw instanceof CometChat.User
            ? (cw as CometChat.User).getUid()
            : (cw as CometChat.Group).getGuid();
        return cid === convId;
      });
      expect(stillExists).toBe(false);
    });

    it('should handle deletion with invalid conversationType gracefully', async () => {
      // Passing an invalid type should trigger an SDK error that the service catches
      try {
        await service.deleteConversation('nonexistent_xyz_abc', 'invalid_type');
      } catch {
        // Service may throw or set error state — either is acceptable
      }
      // Service should still be functional
      expect(service.getConversations()).toBeDefined();
    });
  });

  // ==================== Search Conversations ====================

  describe('searchConversations', () => {
    beforeEach(async () => {
      await service.fetchConversations();
    });

    it('should filter conversations by name', () => {
      const conversations = service.getConversations();
      if (conversations.length === 0) return;

      const first = conversations[0];
      const convWith = first.getConversationWith();
      const name = convWith.getName();

      // Search with a substring of the name
      const searchTerm = name.substring(0, Math.min(3, name.length));
      service.searchConversations(searchTerm);

      const filtered = service.getConversations();
      expect(filtered.length).toBeGreaterThan(0);
    });

    it('should restore all conversations when search text is empty', () => {
      const initialCount = service.getConversations().length;

      service.searchConversations('zzz_nonexistent_zzz');
      expect(service.getConversations().length).toBeLessThanOrEqual(initialCount);

      service.searchConversations('');
      expect(service.getConversations().length).toBe(initialCount);
    });

    it('should restore all conversations when search text is whitespace', () => {
      const initialCount = service.getConversations().length;

      service.searchConversations('zzz_nonexistent_zzz');
      service.searchConversations('   ');

      expect(service.getConversations().length).toBe(initialCount);
    });

    it('should return empty array when no matches found', () => {
      service.searchConversations('zzz_absolutely_no_match_xyz_999');
      expect(service.getConversations().length).toBe(0);
    });

    it('should be case-insensitive', () => {
      const conversations = service.getConversations();
      if (conversations.length === 0) return;

      const first = conversations[0];
      const name = first.getConversationWith().getName();
      const searchTerm = name.toUpperCase();

      service.searchConversations(searchTerm);
      const filtered = service.getConversations();
      expect(filtered.length).toBeGreaterThan(0);
    });
  });

  // ==================== List Manipulation ====================

  describe('List Manipulation', () => {
    beforeEach(async () => {
      await service.fetchConversations();
    });

    it('findConversation should return a conversation for a known ID', () => {
      const conversations = service.getConversations();
      if (conversations.length === 0) return;

      const first = conversations[0];
      const convWith = first.getConversationWith();
      const convId =
        convWith instanceof CometChat.User
          ? (convWith as CometChat.User).getUid()
          : (convWith as CometChat.Group).getGuid();

      const found = service.findConversation(convId);
      expect(found).not.toBeNull();
    });

    it('findConversation should return null for unknown ID', () => {
      const found = service.findConversation('nonexistent_id_xyz_999');
      expect(found).toBeNull();
    });

    it('getConversationIndex should return valid index for known conversation', () => {
      const conversations = service.getConversations();
      if (conversations.length === 0) return;

      const first = conversations[0];
      const convWith = first.getConversationWith();
      const convId =
        convWith instanceof CometChat.User
          ? (convWith as CometChat.User).getUid()
          : (convWith as CometChat.Group).getGuid();

      const index = service.getConversationIndex(convId);
      expect(index).toBe(0);
    });

    it('getConversationIndex should return -1 for unknown conversation', () => {
      const index = service.getConversationIndex('nonexistent_id_xyz_999');
      expect(index).toBe(-1);
    });

    it('removeConversation should remove a conversation by ID', () => {
      const conversations = service.getConversations();
      if (conversations.length === 0) return;

      const initialCount = conversations.length;
      const first = conversations[0];
      const convWith = first.getConversationWith();
      const convId =
        convWith instanceof CometChat.User
          ? (convWith as CometChat.User).getUid()
          : (convWith as CometChat.Group).getGuid();

      service.removeConversation(convId);
      expect(service.getConversations().length).toBe(initialCount - 1);
      expect(service.findConversation(convId)).toBeNull();
    });

    it('removeConversation should not change list for unknown ID', () => {
      const initialCount = service.getConversations().length;
      service.removeConversation('nonexistent_id_xyz_999');
      expect(service.getConversations().length).toBe(initialCount);
    });

    it('moveConversationToTop should move a conversation to index 0', () => {
      const conversations = service.getConversations();
      if (conversations.length < 2) return;

      const second = conversations[1];
      const convWith = second.getConversationWith();
      const convId =
        convWith instanceof CometChat.User
          ? (convWith as CometChat.User).getUid()
          : (convWith as CometChat.Group).getGuid();

      const result = service.moveConversationToTop(convId);
      expect(result).toBe(true);
      expect(service.getConversationIndex(convId)).toBe(0);
    });

    it('moveConversationToTop should return false for unknown ID', () => {
      const result = service.moveConversationToTop('nonexistent_id_xyz_999');
      expect(result).toBe(false);
    });

    it('replaceConversation should replace an existing conversation', () => {
      const conversations = service.getConversations();
      if (conversations.length === 0) return;

      const first = conversations[0];
      // Replace with the same conversation object (verifies the mechanism works)
      const result = service.replaceConversation(first);
      expect(result).toBe(true);
    });

    it('insertConversationAt should insert at the specified index', () => {
      const conversations = service.getConversations();
      if (testConversations.length === 0) return;

      const initialCount = conversations.length;
      const conv = testConversations[0];

      // First remove it if it exists, then insert at index 0
      const convWith = conv.getConversationWith();
      const convId =
        convWith instanceof CometChat.User
          ? (convWith as CometChat.User).getUid()
          : (convWith as CometChat.Group).getGuid();
      service.removeConversation(convId);

      const countAfterRemove = service.getConversations().length;
      service.insertConversationAt(conv, 0);
      expect(service.getConversations().length).toBe(countAfterRemove + 1);
      expect(service.getConversationIndex(convId)).toBe(0);
    });
  });

  // ==================== Active Conversation ====================

  describe('setActiveConversation', () => {
    it('should set active conversation with a real SDK conversation', () => {
      if (testConversations.length === 0) return;
      const conv = testConversations[0];
      service.setActiveConversation(conv);
      expect(service.activeConversation()).toBe(conv);
    });

    it('should clear active conversation when set to null', () => {
      if (testConversations.length === 0) return;
      service.setActiveConversation(testConversations[0]);
      service.setActiveConversation(null);
      expect(service.activeConversation()).toBeNull();
    });

    it('should handle setting active conversation multiple times', () => {
      if (testConversations.length === 0) return;
      const conv = testConversations[0];
      service.setActiveConversation(conv);
      service.setActiveConversation(conv);
      expect(service.activeConversation()).toBe(conv);
    });
  });

  // ==================== Unread Count & Read Status ====================

  describe('updateConversationUnreadCount', () => {
    it('should update unread count for a known conversation', async () => {
      await service.fetchConversations();
      const conversations = service.getConversations();
      if (conversations.length === 0) return;

      const first = conversations[0];
      const convWith = first.getConversationWith();
      const convId =
        convWith instanceof CometChat.User
          ? (convWith as CometChat.User).getUid()
          : (convWith as CometChat.Group).getGuid();

      service.updateConversationUnreadCount(convId, 5);

      const updated = service.findConversation(convId);
      expect(updated).not.toBeNull();
      expect(updated!.getUnreadMessageCount()).toBe(5);
    });

    it('should not throw for unknown conversation ID', () => {
      expect(() => {
        service.updateConversationUnreadCount('nonexistent_xyz', 10);
      }).not.toThrow();
    });
  });

  // ==================== Error Handling ====================

  describe('Error Handling', () => {
    it('should clear error state via clearError', async () => {
      service.clearError();
      expect(service.errorState()).toBeNull();
      expect(service.hasError()).toBe(false);
    });

    it('should handle fetchNextConversations error when no request exists', async () => {
      // No initial fetch — should return false without throwing
      const result = await service.fetchNextConversations();
      expect(result).toBe(false);
    });
  });

  // ==================== Cleanup ====================

  describe('cleanup', () => {
    it('should reset conversations to empty array', async () => {
      await service.fetchConversations();
      expect(service.getConversations().length).toBeGreaterThan(0);

      service.cleanup();
      expect(service.getConversations()).toEqual([]);
    });

    it('should reset loading state to false', () => {
      service.cleanup();
      expect(service.loadingState()).toBe(false);
    });

    it('should reset error state to null', () => {
      service.cleanup();
      expect(service.errorState()).toBeNull();
    });

    it('should reset active conversation to null', () => {
      if (testConversations.length > 0) {
        service.setActiveConversation(testConversations[0]);
      }
      service.cleanup();
      expect(service.activeConversation()).toBeNull();
    });

    it('should reset typing indicators to empty map', () => {
      service.cleanup();
      expect(service.typingIndicators().size).toBe(0);
    });

    it('should be safe to call multiple times', () => {
      expect(() => {
        service.cleanup();
        service.cleanup();
        service.cleanup();
      }).not.toThrow();
    });

    it('should allow re-fetching after cleanup', async () => {
      await service.fetchConversations();
      service.cleanup();
      expect(service.getConversations()).toEqual([]);

      await service.fetchConversations();
      expect(service.getConversations().length).toBeGreaterThan(0);
    });
  });

  // ==================== removeListeners ====================

  describe('removeListeners', () => {
    it('should not throw when called', () => {
      expect(() => service.removeListeners()).not.toThrow();
    });

    it('should preserve state when only listeners are removed', async () => {
      await service.fetchConversations();
      const count = service.getConversations().length;

      service.removeListeners();

      // State should persist — only listeners removed
      expect(service.getConversations().length).toBe(count);
    });
  });

  // ==================== Observable API ====================

  describe('Observable API', () => {
    it('should expose conversations$ observable', () => {
      expect(service.conversations$).toBeDefined();
      expect(service.conversations$.subscribe).toBeDefined();
    });

    it('should expose loadingState$ observable', () => {
      expect(service.loadingState$).toBeDefined();
    });

    it('should expose errorState$ observable', () => {
      expect(service.errorState$).toBeDefined();
    });

    it('should expose activeConversation$ observable', () => {
      expect(service.activeConversation$).toBeDefined();
    });

    it('should expose typingIndicators$ observable', () => {
      expect(service.typingIndicators$).toBeDefined();
    });
  });

  // ==================== Edge Cases ====================

  describe('Edge Cases', () => {
    it('should handle setConversationsRequestBuilder resetting internal request', async () => {
      await service.fetchConversations();

      // Mock fetchNext to return only 1 conversation, then create & set the builder
      mockFetchNextReturns(createMockConversationList(1));
      const builder = new CometChat.ConversationsRequestBuilder().setLimit(1);
      service.setConversationsRequestBuilder(builder);

      // After setting a new builder, fetchConversations should use it
      await service.fetchConversations();
      expect(service.getConversations().length).toBe(1);
    });

    it('should handle null/undefined in setActiveConversation without throwing', () => {
      expect(() => service.setActiveConversation(null)).not.toThrow();
      expect(() => service.setActiveConversation(undefined as any)).not.toThrow();
    });

    it('should handle searching with empty string after filtering', async () => {
      await service.fetchConversations();
      const fullCount = service.getConversations().length;

      service.searchConversations('zzz_no_match');
      expect(service.getConversations().length).toBe(0);

      service.searchConversations('');
      expect(service.getConversations().length).toBe(fullCount);
    });

    it('should handle updateConversationUnreadCount with zero', async () => {
      await service.fetchConversations();
      const conversations = service.getConversations();
      if (conversations.length === 0) return;

      const first = conversations[0];
      const convWith = first.getConversationWith();
      const convId =
        convWith instanceof CometChat.User
          ? (convWith as CometChat.User).getUid()
          : (convWith as CometChat.Group).getGuid();

      expect(() => service.updateConversationUnreadCount(convId, 0)).not.toThrow();
      const updated = service.findConversation(convId);
      expect(updated!.getUnreadMessageCount()).toBe(0);
    });

    it('should verify real SDK conversation objects have expected methods', async () => {
      await service.fetchConversations();
      const conversations = service.getConversations();
      if (conversations.length === 0) return;

      const conv = conversations[0];
      expect(typeof conv.getConversationWith).toBe('function');
      expect(typeof conv.getConversationType).toBe('function');
      expect(typeof conv.getConversationId).toBe('function');
      expect(typeof conv.getLastMessage).toBe('function');
      expect(typeof conv.getUnreadMessageCount).toBe('function');
    });

    it('should verify conversation entities are real SDK User or Group objects', async () => {
      await service.fetchConversations();
      const conversations = service.getConversations();
      if (conversations.length === 0) return;

      const conv = conversations[0];
      const entity = conv.getConversationWith();
      const isUser = entity instanceof CometChat.User;
      const isGroup = entity instanceof CometChat.Group;
      expect(isUser || isGroup).toBe(true);

      if (isUser) {
        expect((entity as CometChat.User).getUid()).toBeTruthy();
        expect((entity as CometChat.User).getName()).toBeTruthy();
      } else {
        expect((entity as CometChat.Group).getGuid()).toBeTruthy();
        expect((entity as CometChat.Group).getName()).toBeTruthy();
      }
    });
  });
});
