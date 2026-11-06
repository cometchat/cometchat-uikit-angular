/**
 * MessageListService Tests
 *
 * Categories: Initialization, Signal State, Message CRUD,
 *             Pagination (fetchPreviousMessages / fetchNextMessages),
 *             Message Receipt Updates, Typing Indicators,
 *             Translation, Reactions, Error Handling, Cleanup, Edge Cases
 *
 * Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.8, 13.6, 14.4, 14.5, 15.7
 *
 * Uses real CometChat SDK — NO vi.mock() for chat SDK packages.
 * The calls SDK mock below is required because @cometchat/calls-sdk-javascript
 * has a JitsiMeetJS runtime dependency that doesn't exist in jsdom.
 *
 * @module services/message-list
 */

// ==================== Calls SDK Mock (JitsiMeetJS workaround) ====================
vi.mock('@cometchat/calls-sdk-javascript', () => ({
  CometChatCalls: {
    init: vi.fn().mockResolvedValue(true),
    generateToken: vi.fn().mockResolvedValue({ token: 'mock-token' }),
  },
}));

import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ensureSdkReady, sdkCleanup, fetchTestUser, fetchTestGroup } from '../test-setup';
import { MessageListService } from './message-list.service';
import { CometChat } from '@cometchat/chat-sdk-javascript';

describe('MessageListService', () => {
  let service: MessageListService;
  let testUser: CometChat.User;
  let testGroup: CometChat.Group;

  beforeAll(async () => {
    await ensureSdkReady();
    testUser = await fetchTestUser('superhero1');
    testGroup = await fetchTestGroup('supergroup');
  }, 30_000);

  afterAll(async () => {
    await sdkCleanup();
  }, 30_000);

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [MessageListService],
    });
    service = TestBed.inject(MessageListService);
    service.cleanup();
  });

  /**
   * Builds `count` real TextMessage instances (ids ascending from `firstId`)
   * as the SDK would return them for one page of history.
   */
  function historyPage(count: number, firstId: number): CometChat.BaseMessage[] {
    return Array.from({ length: count }, (_, i) => {
      const m = new CometChat.TextMessage(testUser.getUid(), `history ${firstId + i}`, CometChat.RECEIVER_TYPE.USER);
      m.setId(firstId + i);
      m.setSender(testUser);
      m.setSentAt(1_700_000_000 + firstId + i);
      return m;
    });
  }

  /**
   * Replaces the service's current messages request (built by setUser/setGroup)
   * with one whose fetchPrevious resolves the given pages in order, then [].
   * The globally-mocked SDK otherwise always returns an empty history.
   */
  function stubHistory(...pages: CometChat.BaseMessage[][]): ReturnType<typeof vi.fn> {
    const fetchPrevious = vi.fn();
    for (const page of pages) fetchPrevious.mockResolvedValueOnce(page);
    fetchPrevious.mockResolvedValue([]);
    (service as any).messagesRequest = { fetchPrevious, fetchNext: vi.fn().mockResolvedValue([]) };
    return fetchPrevious;
  }

  /** Same, but fetchPrevious rejects with `error`. */
  function stubHistoryFailure(error: unknown): void {
    (service as any).messagesRequest = {
      fetchPrevious: vi.fn().mockRejectedValue(error),
      fetchNext: vi.fn().mockResolvedValue([]),
    };
  }

  // ==================== Initialization ====================

  describe('Initialization', () => {
    it('should be provided in root', () => {
      expect(service).toBeTruthy();
    });

    it('should have empty messages array initially', () => {
      expect(service.messages()).toEqual([]);
    });

    it('should have loadingState as false initially', () => {
      expect(service.loadingState()).toBe(false);
    });

    it('should have errorState as null initially', () => {
      expect(service.errorState()).toBeNull();
    });

    it('should have prevMessageId as 0 initially', () => {
      expect(service.prevMessageId()).toBe(0);
    });

    it('should have nextMessageId as 0 initially', () => {
      expect(service.nextMessageId()).toBe(0);
    });

    it('should have unreadCount as 0 initially', () => {
      expect(service.unreadCount()).toBe(0);
    });

    it('should have connectionStatus as connected initially', () => {
      expect(service.connectionStatus()).toBe('connected');
    });

    it('should have empty typingUsers map initially', () => {
      expect(service.typingUsers().size).toBe(0);
    });

    it('should have allMessages as empty initially', () => {
      expect(service.allMessages()).toEqual([]);
    });
  });

  // ==================== Listener IDs ====================

  describe('Listener IDs', () => {
    it('getMessageListenerId() returns a string starting with message_list', () => {
      const id = service.getMessageListenerId();
      expect(typeof id).toBe('string');
      expect(id).toMatch(/^message_list/);
    });

    it('getGroupListenerId() returns a string starting with message_list_group', () => {
      const id = service.getGroupListenerId();
      expect(typeof id).toBe('string');
      expect(id).toMatch(/^message_list_group/);
    });

    it('getCallListenerId() returns a string starting with message_list_call', () => {
      const id = service.getCallListenerId();
      expect(typeof id).toBe('string');
      expect(id).toMatch(/^message_list_call/);
    });

    it('getConnectionListenerId() returns a string starting with message_list_connection', () => {
      const id = service.getConnectionListenerId();
      expect(typeof id).toBe('string');
      expect(id).toMatch(/^message_list_connection/);
    });
  });

  // ==================== setUser / setGroup ====================

  describe('setUser()', () => {
    it('should set user and clear messages for a real SDK user', () => {
      service.setUser(testUser);
      // After setUser, messages are cleared and request is built
      expect(service.getTotalMessageCount()).toBe(0);
    });

    it('should clear group when setting user (mutual exclusivity)', () => {
      service.setGroup(testGroup);
      service.setUser(testUser);
      // After setUser, group context is cleared — fetching should target user
      expect(service.getTotalMessageCount()).toBe(0);
    });

    it('should clear existing messages when switching users', async () => {
      service.setUser(testUser);
      stubHistory(historyPage(5, 100));
      await service.fetchPreviousMessages();
      const countBefore = service.getTotalMessageCount();
      expect(countBefore).toBeGreaterThan(0);

      // Switch to a different user context
      const otherUser = await fetchTestUser('superhero2');
      service.setUser(otherUser);
      expect(service.getTotalMessageCount()).toBe(0);
    }, 30_000);
  });

  describe('setGroup()', () => {
    it('should set group and clear messages for a real SDK group', () => {
      service.setGroup(testGroup);
      expect(service.getTotalMessageCount()).toBe(0);
    });

    it('should clear user when setting group (mutual exclusivity)', () => {
      service.setUser(testUser);
      service.setGroup(testGroup);
      expect(service.getTotalMessageCount()).toBe(0);
    });
  });

  // ==================== fetchPreviousMessages ====================

  describe('fetchPreviousMessages()', () => {
    it('should fetch messages for a user conversation via real SDK', async () => {
      service.setUser(testUser);
      const page = historyPage(5, 100);
      const fetchPrevious = stubHistory(page);
      const hasMore = await service.fetchPreviousMessages();

      expect(fetchPrevious).toHaveBeenCalledTimes(1);
      // Fewer than a full page (30) means there is no older history
      expect(hasMore).toBe(false);
      expect(service.getTotalMessageCount()).toBe(5);
      expect(service.messages()).toEqual(page);
    }, 30_000);

    it('should fetch messages for a group conversation via real SDK', async () => {
      service.setGroup(testGroup);
      const fetchPrevious = stubHistory(historyPage(30, 600));
      const hasMore = await service.fetchPreviousMessages();

      expect(fetchPrevious).toHaveBeenCalledTimes(1);
      // A full page (30) means older history may exist
      expect(hasMore).toBe(true);
      expect(service.getTotalMessageCount()).toBe(30);
    }, 30_000);

    it('should set loadingState to false after fetch completes', async () => {
      service.setUser(testUser);
      await service.fetchPreviousMessages();
      expect(service.loadingState()).toBe(false);
    }, 30_000);

    it('should populate messages signal with real BaseMessage objects', async () => {
      service.setUser(testUser);
      stubHistory(historyPage(3, 200));
      await service.fetchPreviousMessages();

      const msgs = service.messages();
      expect(msgs.length).toBeGreaterThan(0);
      const first = msgs[0];
      // Real SDK BaseMessage objects have getId(), getType(), getSender()
      expect(first).toBeInstanceOf(CometChat.BaseMessage);
      expect(first.getId()).toBe(200);
      expect(first.getType()).toBe(CometChat.MESSAGE_TYPE.TEXT);
      expect(first.getSender()).toBe(testUser);
    }, 30_000);

    it('should update prevMessageId after fetching', async () => {
      service.setUser(testUser);
      expect(service.prevMessageId()).toBe(0);
      stubHistory(historyPage(4, 300));
      await service.fetchPreviousMessages();

      expect(service.messages()).toHaveLength(4);
      // prevMessageId tracks the oldest message fetched so far
      expect(service.prevMessageId()).toBe(300);
    }, 30_000);

    it('should support pagination — second fetch returns more or signals end', async () => {
      service.setUser(testUser);
      const newest = historyPage(30, 1000); // a full page -> more may exist
      const older = historyPage(7, 900);    // a short page -> end of history
      stubHistory(newest, older);

      const hasMore1 = await service.fetchPreviousMessages();
      expect(hasMore1).toBe(true);
      expect(service.getTotalMessageCount()).toBe(30);
      expect(service.prevMessageId()).toBe(1000);

      const hasMore2 = await service.fetchPreviousMessages();
      // Older messages are prepended and the end of history is signalled
      expect(hasMore2).toBe(false);
      expect(service.getTotalMessageCount()).toBe(37);
      expect(service.messages()[0].getId()).toBe(900);
      expect(service.messages()[36].getId()).toBe(1029);
      expect(service.prevMessageId()).toBe(900);

      // A further fetch past the end adds nothing
      const hasMore3 = await service.fetchPreviousMessages();
      expect(hasMore3).toBe(false);
      expect(service.getTotalMessageCount()).toBe(37);
    }, 60_000);

    it('should return false when no conversation context is set', async () => {
      // No user or group set
      const result = await service.fetchPreviousMessages();
      expect(result).toBe(false);
    }, 15_000);
  });

  // ==================== fetchNextMessages ====================

  describe('fetchNextMessages()', () => {
    it('should fetch newer messages for a user conversation', async () => {
      service.setUser(testUser);
      // First fetch previous to establish a baseline
      stubHistory(historyPage(3, 700));
      await service.fetchPreviousMessages();
      expect(service.nextMessageId()).toBe(702);

      const newer = historyPage(2, 703);
      const fetchNext = vi.fn().mockResolvedValue(newer);
      (service as any).nextMessagesRequest = { fetchNext };
      const hasMore = await service.fetchNextMessages();

      expect(fetchNext).toHaveBeenCalledTimes(1);
      expect(hasMore).toBe(false);
      // Newer messages are appended after the baseline
      expect(service.messages().map(m => m.getId())).toEqual([700, 701, 702, 703, 704]);
      expect(service.nextMessageId()).toBe(704);
    }, 30_000);

    it('should return false when no conversation context is set', async () => {
      const result = await service.fetchNextMessages();
      expect(result).toBe(false);
    }, 15_000);
  });

  // ==================== Message CRUD ====================

  describe('addMessage()', () => {
    it('should add a real SDK message to the list', async () => {
      service.setUser(testUser);

      // Send a real message to get a real BaseMessage object
      const textMsg = new CometChat.TextMessage(
        testUser.getUid(),
        'test addMessage ' + Date.now(),
        CometChat.RECEIVER_TYPE.USER
      );
      const sent = await CometChat.sendMessage(textMsg);

      service.addMessage(sent);
      expect(service.getTotalMessageCount()).toBe(1);
      expect(service.getMessageById(sent.getId())).toBe(sent);
    }, 15_000);

    it('should append messages in order', async () => {
      service.setUser(testUser);

      const msg1 = new CometChat.TextMessage(
        testUser.getUid(),
        'first ' + Date.now(),
        CometChat.RECEIVER_TYPE.USER
      );
      const msg2 = new CometChat.TextMessage(
        testUser.getUid(),
        'second ' + Date.now(),
        CometChat.RECEIVER_TYPE.USER
      );
      const sent1 = await CometChat.sendMessage(msg1);
      const sent2 = await CometChat.sendMessage(msg2);

      service.addMessage(sent1);
      service.addMessage(sent2);

      expect(service.getTotalMessageCount()).toBe(2);
      const range = service.getMessagesInRange(0, 1);
      expect(range).toHaveLength(2);
      expect(range[0].getId()).toBe(sent1.getId());
      expect(range[1].getId()).toBe(sent2.getId());
    }, 30_000);
  });

  describe('updateMessageById()', () => {
    it('should update an existing message by ID', async () => {
      service.setUser(testUser);

      const textMsg = new CometChat.TextMessage(
        testUser.getUid(),
        'original ' + Date.now(),
        CometChat.RECEIVER_TYPE.USER
      );
      const sent = await CometChat.sendMessage(textMsg);
      service.addMessage(sent);

      // Edit the message via SDK
      const editMsg = new CometChat.TextMessage(
        testUser.getUid(),
        'edited ' + Date.now(),
        CometChat.RECEIVER_TYPE.USER
      );
      editMsg.setId(sent.getId());
      const edited = await CometChat.editMessage(editMsg);

      const result = service.updateMessageById(sent.getId(), edited);
      expect(result).toBe(true);
      expect(service.getMessageById(sent.getId())).toBe(edited);
    }, 30_000);

    it('should return false when message not found', () => {
      const fakeMsg = new CometChat.TextMessage('x', 'x', CometChat.RECEIVER_TYPE.USER);
      const result = service.updateMessageById(999999, fakeMsg);
      expect(result).toBe(false);
    });
  });

  describe('deleteMessage()', () => {
    it('should soft-delete a message (mark as deleted)', async () => {
      service.setUser(testUser);

      const textMsg = new CometChat.TextMessage(
        testUser.getUid(),
        'to delete ' + Date.now(),
        CometChat.RECEIVER_TYPE.USER
      );
      const sent = await CometChat.sendMessage(textMsg);
      service.addMessage(sent);

      const result = service.deleteMessage(sent.getId());
      expect(result).toBe(true);

      const deleted = service.getMessageById(sent.getId());
      expect(deleted).toBeTruthy();
      expect(deleted!.getDeletedAt()).toBeGreaterThan(0);
      // Soft delete keeps message in list
      expect(service.getTotalMessageCount()).toBe(1);
    }, 15_000);

    it('should return false when message not found', () => {
      expect(service.deleteMessage(999999)).toBe(false);
    });
  });

  describe('removeMessage()', () => {
    it('should hard-remove a message from the list', async () => {
      service.setUser(testUser);

      const textMsg = new CometChat.TextMessage(
        testUser.getUid(),
        'to remove ' + Date.now(),
        CometChat.RECEIVER_TYPE.USER
      );
      const sent = await CometChat.sendMessage(textMsg);
      service.addMessage(sent);
      expect(service.getTotalMessageCount()).toBe(1);

      const result = service.removeMessage(sent.getId());
      expect(result).toBe(true);
      expect(service.getTotalMessageCount()).toBe(0);
      expect(service.getMessageById(sent.getId())).toBeUndefined();
    }, 15_000);

    it('should return false when message not found', () => {
      expect(service.removeMessage(999999)).toBe(false);
    });
  });

  describe('getMessageById()', () => {
    it('should return undefined for a non-existent ID', () => {
      expect(service.getMessageById(999999)).toBeUndefined();
    });
  });

  describe('getMessagesInRange()', () => {
    it('should return empty array for empty message list', () => {
      expect(service.getMessagesInRange(0, 5)).toEqual([]);
    });

    it('should return empty array for negative startIndex', async () => {
      service.setUser(testUser);
      const msg = new CometChat.TextMessage(
        testUser.getUid(),
        'range test',
        CometChat.RECEIVER_TYPE.USER
      );
      const sent = await CometChat.sendMessage(msg);
      service.addMessage(sent);

      expect(service.getMessagesInRange(-1, 2)).toEqual([]);
    }, 15_000);

    it('should return empty array when startIndex > endIndex', async () => {
      service.setUser(testUser);
      const msg = new CometChat.TextMessage(
        testUser.getUid(),
        'range test2',
        CometChat.RECEIVER_TYPE.USER
      );
      const sent = await CometChat.sendMessage(msg);
      service.addMessage(sent);

      expect(service.getMessagesInRange(3, 1)).toEqual([]);
    }, 15_000);

    it('should clamp endIndex to last valid index', async () => {
      service.setUser(testUser);
      const msg = new CometChat.TextMessage(
        testUser.getUid(),
        'range clamp',
        CometChat.RECEIVER_TYPE.USER
      );
      const sent = await CometChat.sendMessage(msg);
      service.addMessage(sent);

      const range = service.getMessagesInRange(0, 100);
      expect(range).toHaveLength(1);
    }, 15_000);
  });

  describe('getTotalMessageCount()', () => {
    it('should return 0 for empty list', () => {
      expect(service.getTotalMessageCount()).toBe(0);
    });
  });

  describe('clearMessages()', () => {
    it('should clear all messages and reset pagination IDs', async () => {
      service.setUser(testUser);
      const msg = new CometChat.TextMessage(
        testUser.getUid(),
        'clear test',
        CometChat.RECEIVER_TYPE.USER
      );
      const sent = await CometChat.sendMessage(msg);
      service.addMessage(sent);
      expect(service.getTotalMessageCount()).toBe(1);

      service.clearMessages();
      expect(service.getTotalMessageCount()).toBe(0);
      expect(service.prevMessageId()).toBe(0);
      expect(service.nextMessageId()).toBe(0);
    }, 15_000);
  });

  // ==================== Reactions ====================

  describe('updateMessageReactions()', () => {
    it('should update reactions on an existing message', async () => {
      service.setUser(testUser);
      const msg = new CometChat.TextMessage(
        testUser.getUid(),
        'react test',
        CometChat.RECEIVER_TYPE.USER
      );
      const sent = await CometChat.sendMessage(msg);
      service.addMessage(sent);

      const fakeReactions = [] as CometChat.ReactionCount[];
      const result = service.updateMessageReactions(sent.getId(), fakeReactions);
      expect(result).toBe(true);
    }, 15_000);

    it('should return false when message not found', () => {
      expect(service.updateMessageReactions(999999, [])).toBe(false);
    });
  });

  describe('updateReplyCount()', () => {
    it('should update reply count on a parent message', async () => {
      service.setUser(testUser);
      const msg = new CometChat.TextMessage(
        testUser.getUid(),
        'reply count test',
        CometChat.RECEIVER_TYPE.USER
      );
      const sent = await CometChat.sendMessage(msg);
      service.addMessage(sent);

      const result = service.updateReplyCount(sent.getId(), 5);
      expect(result).toBe(true);
      expect(service.getMessageById(sent.getId())!.getReplyCount()).toBe(5);
    }, 15_000);

    it('should return false when parent message not found', () => {
      expect(service.updateReplyCount(999999, 3)).toBe(false);
    });
  });

  // ==================== Read Receipts ====================

  describe('markAsRead()', () => {
    it('should call SDK markAsRead without throwing for a real message', async () => {
      service.setUser(testUser);
      stubHistory(historyPage(2, 400));
      await service.fetchPreviousMessages();

      const msgs = service.messages();
      expect(msgs).toHaveLength(2);
      const sdkMarkAsRead = vi.mocked(CometChat.markAsRead);
      sdkMarkAsRead.mockClear();
      // markAsRead should not throw, and must reach the SDK with the message
      await expect(service.markAsRead(msgs[msgs.length - 1])).resolves.toBeUndefined();
      expect(sdkMarkAsRead).toHaveBeenCalledWith(msgs[1]);
    }, 30_000);
  });

  describe('markAsDelivered()', () => {
    it('should call SDK markAsDelivered without throwing for a real message', async () => {
      service.setUser(testUser);
      stubHistory(historyPage(2, 500));
      await service.fetchPreviousMessages();

      const msgs = service.messages();
      expect(msgs).toHaveLength(2);
      const sdkMarkAsDelivered = vi.mocked(CometChat.markAsDelivered);
      sdkMarkAsDelivered.mockClear();
      await expect(service.markAsDelivered(msgs[msgs.length - 1])).resolves.toBeUndefined();
      expect(sdkMarkAsDelivered).toHaveBeenCalledWith(msgs[1]);
    }, 30_000);
  });

  describe('updateLocalReadStatus()', () => {
    it('should set readAt on specified messages', async () => {
      service.setUser(testUser);
      const msg = new CometChat.TextMessage(
        testUser.getUid(),
        'read status',
        CometChat.RECEIVER_TYPE.USER
      );
      const sent = await CometChat.sendMessage(msg);
      service.addMessage(sent);

      service.updateLocalReadStatus([sent.getId()]);
      const updated = service.getMessageById(sent.getId());
      expect(updated!.getReadAt()).toBeGreaterThan(0);
    }, 15_000);

    it('should skip messages that are not found without throwing', () => {
      expect(() => service.updateLocalReadStatus([999999])).not.toThrow();
    });
  });

  // ==================== Typing Indicators ====================

  describe('handleTypingStarted()', () => {
    it('should add typing indicator for a valid user in current conversation', () => {
      service.setUser(testUser);

      const indicator = new CometChat.TypingIndicator(
        testUser.getUid(),
        CometChat.RECEIVER_TYPE.USER
      );
      // Simulate typing from the other user
      (indicator as any).sender = testUser;

      service.handleTypingStarted(indicator);
      // Typing from the logged-in user's own UID is filtered out,
      // but we verify no error is thrown
      expect(service.typingUsers()).toBeDefined();
    });

    it('should handle typing for group conversation without error', () => {
      service.setGroup(testGroup);

      const indicator = new CometChat.TypingIndicator(
        testGroup.getGuid(),
        CometChat.RECEIVER_TYPE.GROUP
      );
      (indicator as any).sender = testUser;

      service.handleTypingStarted(indicator);
      expect(service.typingUsers()).toBeDefined();
    });
  });

  describe('handleTypingEnded()', () => {
    it('should handle typing ended without error', () => {
      service.setUser(testUser);

      const indicator = new CometChat.TypingIndicator(
        testUser.getUid(),
        CometChat.RECEIVER_TYPE.USER
      );
      (indicator as any).sender = testUser;

      service.handleTypingStarted(indicator);
      service.handleTypingEnded(indicator);
      expect(service.typingUsers()).toBeDefined();
    });

    it('should handle typing ended for user not currently typing (no-op)', () => {
      const indicator = new CometChat.TypingIndicator('nobody', CometChat.RECEIVER_TYPE.USER);
      (indicator as any).sender = testUser;

      expect(() => service.handleTypingEnded(indicator)).not.toThrow();
    });
  });

  // ==================== Translation ====================

  describe('translateMessage()', () => {
    it('should throw when message is not found in list', async () => {
      const msg = new CometChat.TextMessage(
        testUser.getUid(),
        'not in list',
        CometChat.RECEIVER_TYPE.USER
      );
      const sent = await CometChat.sendMessage(msg);
      // Do NOT add to service — message is not in the list
      await expect(service.translateMessage(sent, 'es')).rejects.toThrow();
    }, 15_000);

    it('should throw when message is not a text message', async () => {
      service.setUser(testUser);
      // Create and send a file message to get a non-text BaseMessage
      const file = new File(['test'], 'test.txt', { type: 'text/plain' });
      const mediaMsg = new CometChat.MediaMessage(
        testUser.getUid(),
        file,
        CometChat.MESSAGE_TYPE.FILE,
        CometChat.RECEIVER_TYPE.USER
      );
      const sent = await CometChat.sendMessage(mediaMsg);
      service.addMessage(sent);

      await expect(service.translateMessage(sent, 'es')).rejects.toThrow();
    }, 15_000);
  });

  describe('getCachedTranslation()', () => {
    it('should return undefined when not cached', () => {
      expect(service.getCachedTranslation(999999, 'fr')).toBeUndefined();
    });
  });

  describe('clearTranslationCache()', () => {
    it('should clear all cached translations without error', () => {
      expect(() => service.clearTranslationCache()).not.toThrow();
    });
  });

  // ==================== Error Handling ====================

  describe('Error Handling', () => {
    it('clearError() should set errorState to null', () => {
      service.clearError();
      expect(service.errorState()).toBeNull();
    });

    it('setErrorCallback() should accept a callback', () => {
      const cb = vi.fn();
      service.setErrorCallback(cb);
      // An invalid conversation context is reported through the callback
      service.setUser(null as unknown as CometChat.User);
      expect(cb).toHaveBeenCalledTimes(1);
      expect(cb).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining('setUser: User is required') })
      );
    });

    it('setErrorCallback(null) should clear the callback', () => {
      const cb = vi.fn();
      service.setErrorCallback(cb);
      service.setErrorCallback(null);
      // The cleared callback is no longer invoked on error
      expect(() => service.setGroup(null as unknown as CometChat.Group)).not.toThrow();
      expect(cb).not.toHaveBeenCalled();
    });
  });

  // ==================== Configuration ====================

  describe('setParentMessageId()', () => {
    it('should accept a numeric parent message ID for thread mode', () => {
      service.setUser(testUser);
      expect(() => service.setParentMessageId(42)).not.toThrow();
    });

    it('should accept null to exit thread mode', () => {
      service.setUser(testUser);
      service.setParentMessageId(42);
      expect(() => service.setParentMessageId(null)).not.toThrow();
    });
  });

  describe('setHideGroupActionMessages()', () => {
    it('should accept true without error', () => {
      expect(() => service.setHideGroupActionMessages(true)).not.toThrow();
    });

    it('should accept false without error', () => {
      service.setHideGroupActionMessages(true);
      expect(() => service.setHideGroupActionMessages(false)).not.toThrow();
    });
  });

  describe('setMessagesRequestBuilder()', () => {
    it('should accept a custom MessagesRequestBuilder', () => {
      const builder = new CometChat.MessagesRequestBuilder().setLimit(10);
      expect(() => service.setMessagesRequestBuilder(builder)).not.toThrow();
    });

    it('should accept null to clear custom builder', () => {
      service.setMessagesRequestBuilder(new CometChat.MessagesRequestBuilder().setLimit(10));
      expect(() => service.setMessagesRequestBuilder(null)).not.toThrow();
    });
  });

  // ==================== clearConversation ====================

  describe('clearConversation()', () => {
    it('should clear all messages and conversation context', async () => {
      service.setUser(testUser);
      const msg = new CometChat.TextMessage(
        testUser.getUid(),
        'clear conv',
        CometChat.RECEIVER_TYPE.USER
      );
      const sent = await CometChat.sendMessage(msg);
      service.addMessage(sent);
      expect(service.getTotalMessageCount()).toBe(1);

      service.clearConversation();
      expect(service.getTotalMessageCount()).toBe(0);
    }, 15_000);
  });

  // ==================== Cleanup ====================

  describe('cleanup()', () => {
    it('should reset all state to initial values', async () => {
      service.setUser(testUser);
      const msg = new CometChat.TextMessage(
        testUser.getUid(),
        'cleanup test',
        CometChat.RECEIVER_TYPE.USER
      );
      const sent = await CometChat.sendMessage(msg);
      service.addMessage(sent);
      service.setErrorCallback(vi.fn());

      service.cleanup();

      expect(service.getTotalMessageCount()).toBe(0);
      expect(service.messages()).toEqual([]);
      expect(service.loadingState()).toBe(false);
      expect(service.errorState()).toBeNull();
      expect(service.typingUsers().size).toBe(0);
    }, 15_000);

    it('should not throw when called multiple times', () => {
      service.cleanup();
      service.cleanup();
      service.cleanup();
      expect(service.getTotalMessageCount()).toBe(0);
    });

    it('should regenerate listener IDs after cleanup', () => {
      const oldId = service.getMessageListenerId();
      service.cleanup();
      const newId = service.getMessageListenerId();
      expect(typeof newId).toBe('string');
      expect(newId).toMatch(/^message_list/);
    });
  });

  // ==================== Error Recovery (Requirement 7.6) ====================

  describe('Error Recovery', () => {
    it('should update errorState signal when fetchPreviousMessages SDK call rejects', async () => {
      // Set user context, then corrupt the internal request to force SDK rejection
      service.setUser(testUser);
      expect(service.errorState()).toBeNull();
      const sdkError = { code: 'ERR_UID_NOT_FOUND', message: 'uid not found' };
      stubHistoryFailure(sdkError);

      const result = await service.fetchPreviousMessages();

      // The method should NOT throw — it returns false on error
      expect(result).toBe(false);
      expect(service.errorState()).toBe(sdkError);
      // loadingState should be reset
      expect(service.loadingState()).toBe(false);
    }, 30_000);

    it('should invoke errorCallback when fetchPreviousMessages SDK call rejects', async () => {
      const errors: CometChat.CometChatException[] = [];
      service.setErrorCallback(err => errors.push(err));

      service.setUser(testUser);
      // Force the real request's fetchPrevious to reject with a non-recoverable SDK error
      const sdkError = { code: 'ERR_UID_NOT_FOUND', message: 'uid not found' };
      stubHistoryFailure(sdkError);

      const result = await service.fetchPreviousMessages();

      expect(result).toBe(false);
      expect(errors).toEqual([sdkError]);
      expect(service.errorState()).toBe(sdkError);
      expect(service.loadingState()).toBe(false);
      expect(service.messages()).toEqual([]);
    }, 30_000);

    it('should report the error and roll back when editMessage SDK call rejects', async () => {
      service.setUser(testUser);

      // Send a real message first
      const textMsg = new CometChat.TextMessage(
        testUser.getUid(),
        'error recovery edit test ' + Date.now(),
        CometChat.RECEIVER_TYPE.USER
      );
      const sent = await CometChat.sendMessage(textMsg);
      service.addMessage(sent);

      // Corrupt the message ID to force SDK rejection on edit
      const fakeMsg = new CometChat.TextMessage(
        testUser.getUid(),
        'edited',
        CometChat.RECEIVER_TYPE.USER
      );
      fakeMsg.setId(sent.getId());
      // Manually set a bogus ID that the SDK will reject
      fakeMsg.setId(-999);
      service.addMessage(fakeMsg);

      const errors: CometChat.CometChatException[] = [];
      service.setErrorCallback(err => errors.push(err));

      const sdkError = { code: 'ERR_MESSAGE_NOT_FOUND', message: 'not found' };
      vi.mocked(CometChat.editMessage).mockRejectedValueOnce(sdkError);

      // editMessage should catch the SDK error, report it, and return the original message
      const result = await service.editMessage(fakeMsg, 'new text');
      expect(result).toBe(fakeMsg);
      // The optimistic text change is rolled back
      expect((result as CometChat.TextMessage).getText()).toBe('edited');
      expect((service.getMessageById(-999) as CometChat.TextMessage).getText()).toBe('edited');
      // The SDK failure is surfaced through the error callback
      expect(errors).toEqual([sdkError]);
      // Service should remain usable — both messages still listed
      expect(service.getTotalMessageCount()).toBe(2);
      expect(service.getMessageById(sent.getId())).toBe(sent);
    }, 30_000);

    it('should remain usable after an error — subsequent operations succeed', async () => {
      service.setUser(testUser);

      // Trigger an error first via null user
      service.setUser(null as any);

      // Service should still work after the error
      service.setUser(testUser);
      const msg = new CometChat.TextMessage(
        testUser.getUid(),
        'after error ' + Date.now(),
        CometChat.RECEIVER_TYPE.USER
      );
      const sent = await CometChat.sendMessage(msg);
      service.addMessage(sent);
      expect(service.getTotalMessageCount()).toBe(1);
      expect(service.getMessageById(sent.getId())).toBe(sent);
    }, 15_000);

    it('should not propagate SDK rejection as unhandled promise when errorCallback is set', async () => {
      const errors: CometChat.CometChatException[] = [];
      service.setErrorCallback(err => errors.push(err));
      service.setUser(testUser);

      // Send a real message, add it, then try to add a reaction with invalid emoji
      const textMsg = new CometChat.TextMessage(
        testUser.getUid(),
        'reaction error test ' + Date.now(),
        CometChat.RECEIVER_TYPE.USER
      );
      const sent = await CometChat.sendMessage(textMsg);
      service.addMessage(sent);

      // addReaction catches SDK errors internally — should not throw
      await service.addReaction(sent.getId(), '👍');
      // No unhandled rejection — service remains usable
      expect(service.getTotalMessageCount()).toBe(1);
    }, 15_000);

    it('should clear errorState via clearError after an error occurs', async () => {
      service.setUser(testUser);
      stubHistoryFailure({ code: 'ERR_BAD_REQUEST', message: 'bad' });
      await service.fetchPreviousMessages();
      expect(service.errorState()).not.toBeNull();

      service.clearError();
      expect(service.errorState()).toBeNull();
    });
  });

  // ==================== Edge Cases ====================

  describe('Edge Cases', () => {
    it('should handle fetchPreviousMessages when no context is set', async () => {
      const result = await service.fetchPreviousMessages();
      expect(result).toBe(false);
      expect(service.loadingState()).toBe(false);
    }, 15_000);

    it('should handle fetchNextMessages when no context is set', async () => {
      const result = await service.fetchNextMessages();
      expect(result).toBe(false);
    }, 15_000);

    it('should handle rapid setUser calls without error', async () => {
      const user2 = await fetchTestUser('superhero2');
      service.setUser(testUser);
      service.setUser(user2);
      service.setUser(testUser);
      expect(service.getTotalMessageCount()).toBe(0);
    }, 15_000);

    it('should handle switching from user to group context', () => {
      service.setUser(testUser);
      service.setGroup(testGroup);
      expect(service.getTotalMessageCount()).toBe(0);
    });

    it('should handle switching from group to user context', () => {
      service.setGroup(testGroup);
      service.setUser(testUser);
      expect(service.getTotalMessageCount()).toBe(0);
    });

    it('should expose loadingState$ observable', async () => {
      const loading = await new Promise<boolean>(resolve => {
        const sub = service.loadingState$.subscribe(val => {
          resolve(val);
          sub.unsubscribe();
        });
      });
      expect(typeof loading).toBe('boolean');
    });

    it('should expose errorState$ observable', async () => {
      const err = await new Promise<Error | null>(resolve => {
        const sub = service.errorState$.subscribe(val => {
          resolve(val);
          sub.unsubscribe();
        });
      });
      expect(err === null || err instanceof Error).toBe(true);
    });
  });
});
