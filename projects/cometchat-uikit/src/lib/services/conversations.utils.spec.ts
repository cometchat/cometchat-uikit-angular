/**
 * conversations.utils Tests
 *
 * Covers: isRecoverableError, getUserFriendlyErrorMessage, createEnhancedError,
 *         getConversationEntityId, findConversationIndex, isAMessage,
 *         shouldLastMessageAndUnreadCountBeUpdated, getTypingIndicatorKey,
 *         applyReceiptToConversations, orderPinnedFirst.
 *
 * @module services/conversations.utils
 */

import { describe, it, expect, vi } from 'vitest';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import {
  mergeSilentRefresh,
  orderPinnedFirst,
  isRecoverableError,
  getUserFriendlyErrorMessage,
  createEnhancedError,
  getConversationEntityId,
  findConversationIndex,
  isAMessage,
  getTypingIndicatorKey,
} from './conversations.utils';

import { CometChatLocalize } from '../resources/CometChatLocalize/cometchat-localize';
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeUser(uid: string): CometChat.User {
  const u = new CometChat.User(uid);
  u.setName(`User ${uid}`);
  return u;
}

function makeGroup(guid: string): CometChat.Group {
  return new CometChat.Group(guid, `Group ${guid}`, CometChat.GROUP_TYPE.PUBLIC, '');
}

function makeConversation(type: 'user' | 'group', id: string): CometChat.Conversation {
  const conversationWith = type === 'user' ? makeUser(id) : makeGroup(id);
  return new CometChat.Conversation(`${type}_${id}`, type, undefined, conversationWith, 0, [], 0, undefined);
}

describe('conversations.utils', () => {

  // ==================== isRecoverableError ====================

  describe('isRecoverableError', () => {
    it('should return false for null/undefined', () => {
      expect(isRecoverableError(null)).toBe(false);
      expect(isRecoverableError(undefined)).toBe(false);
    });

    it('should return true for network error messages', () => {
      expect(isRecoverableError({ message: 'network error' })).toBe(true);
      expect(isRecoverableError({ message: 'connection refused' })).toBe(true);
      expect(isRecoverableError({ message: 'timeout occurred' })).toBe(true);
    });

    it('should return true for recoverable error codes', () => {
      expect(isRecoverableError({ code: 'ERR_NETWORK' })).toBe(true);
      expect(isRecoverableError({ code: 'ERR_TIMEOUT' })).toBe(true);
      expect(isRecoverableError({ code: 'NETWORK_ERROR' })).toBe(true);
    });

    it('should return false for non-recoverable errors', () => {
      expect(isRecoverableError({ message: 'unauthorized' })).toBe(false);
      expect(isRecoverableError({ message: 'not found' })).toBe(false);
    });

    it('should be case-insensitive for message matching', () => {
      expect(isRecoverableError({ message: 'NETWORK ERROR' })).toBe(true);
    });
  });

  // ==================== getUserFriendlyErrorMessage ====================

  describe('getUserFriendlyErrorMessage', () => {
    it('should return unknown error for null', () => {
      expect(getUserFriendlyErrorMessage(null, 'test')).toBe('An unknown error occurred');
    });

    it('should return network message for network errors', () => {
      const msg = getUserFriendlyErrorMessage({ message: 'network error' }, 'test');
      expect(msg.toLowerCase()).toContain('connect');
    });

    it('should return timeout message for timeout errors', () => {
      // ENG-39096: the timeout wording is shared with message-list.error-utils
      // now that both maps draw from the same localization keys.
      const msg = getUserFriendlyErrorMessage({ message: 'timeout' }, 'test');
      expect(msg).toBe(CometChatLocalize.getLocalizedString('error_request_timeout'));
    });

    it('should return auth message for auth errors', () => {
      const msg = getUserFriendlyErrorMessage({ message: 'unauthorized' }, 'test');
      expect(msg.toLowerCase()).toContain('auth');
    });

    it('should return context-specific message for fetchConversations', () => {
      const msg = getUserFriendlyErrorMessage({ message: 'unknown' }, 'fetchConversations');
      expect(msg.toLowerCase()).toContain('conversation');
    });

    it('should return context-specific message for deleteConversation', () => {
      const msg = getUserFriendlyErrorMessage({ message: 'unknown' }, 'deleteConversation');
      expect(msg.toLowerCase()).toContain('delete');
    });
  });

  // ==================== createEnhancedError ====================

  describe('createEnhancedError', () => {
    it('should create an Error instance', () => {
      const err = createEnhancedError({ message: 'test error' }, 'test');
      expect(err).toBeInstanceOf(Error);
    });

    it('should attach originalError property', () => {
      const original = { message: 'original' };
      const err = createEnhancedError(original, 'test') as any;
      expect(err.originalError).toBe(original);
    });

    it('should attach context property', () => {
      const err = createEnhancedError({ message: 'test' }, 'myContext') as any;
      expect(err.context).toBe('myContext');
    });
  });

  // ==================== getConversationEntityId ====================

  describe('getConversationEntityId', () => {
    it('should return user UID for user conversation', () => {
      const conv = makeConversation('user', 'user1');
      expect(getConversationEntityId(conv)).toBe('user1');
    });

    it('should return group GUID for group conversation', () => {
      const conv = makeConversation('group', 'group1');
      expect(getConversationEntityId(conv)).toBe('group1');
    });
  });

  // ==================== findConversationIndex ====================

  describe('findConversationIndex', () => {
    it('should return the index of a matching conversation', () => {
      const convs = [
        makeConversation('user', 'user1'),
        makeConversation('user', 'user2'),
        makeConversation('group', 'group1'),
      ];
      expect(findConversationIndex(convs, 'user2')).toBe(1);
    });

    it('should return -1 when not found', () => {
      const convs = [makeConversation('user', 'user1')];
      expect(findConversationIndex(convs, 'nonexistent')).toBe(-1);
    });

    it('should return -1 for empty array', () => {
      expect(findConversationIndex([], 'user1')).toBe(-1);
    });
  });

  // ==================== isAMessage ====================

  describe('isAMessage', () => {
    it('should return true for TextMessage', () => {
      const msg = new CometChat.TextMessage('r1', 'Hello', CometChat.RECEIVER_TYPE.USER);
      expect(isAMessage(msg)).toBe(true);
    });

    it('should return true for MediaMessage', () => {
      const msg = new CometChat.MediaMessage('r1', {} as File, 'image', CometChat.RECEIVER_TYPE.USER);
      expect(isAMessage(msg)).toBe(true);
    });

    it('should return true for CustomMessage', () => {
      const msg = new CometChat.CustomMessage('r1', CometChat.RECEIVER_TYPE.USER, 'custom', {});
      expect(isAMessage(msg)).toBe(true);
    });

    it('should return false for plain objects', () => {
      expect(isAMessage({ type: 'text' })).toBe(false);
    });

    it('should return false for null', () => {
      expect(isAMessage(null)).toBe(false);
    });

    it('should return false for strings', () => {
      expect(isAMessage('hello')).toBe(false);
    });
  });

  // ==================== getTypingIndicatorKey ====================

  describe('getTypingIndicatorKey', () => {
    it('should return sender UID for user typing indicator', () => {
      const indicator = new CometChat.TypingIndicator('receiver1', 'user');
      const sender = makeUser('sender1');
      (indicator as any).sender = sender;
      (indicator as any).getSender = () => sender;
      (indicator as any).getReceiverType = () => 'user';
      (indicator as any).getReceiverId = () => 'receiver1';
      expect(getTypingIndicatorKey(indicator)).toBe('sender1');
    });

    it('should return receiver ID for group typing indicator', () => {
      const indicator = new CometChat.TypingIndicator('group1', 'group');
      const sender = makeUser('sender1');
      (indicator as any).sender = sender;
      (indicator as any).getSender = () => sender;
      (indicator as any).getReceiverType = () => 'group';
      (indicator as any).getReceiverId = () => 'group1';
      expect(getTypingIndicatorKey(indicator)).toBe('group1');
    });
  });
});

// ---------------------------------------------------------------------------
// orderPinnedFirst
// ---------------------------------------------------------------------------
describe('orderPinnedFirst', () => {
  /** A conversation whose pinned state and identity are both inspectable. */
  function conv(id: string, pinned = false): CometChat.Conversation {
    return { id, isPinned: () => pinned } as unknown as CometChat.Conversation;
  }
  const ids = (list: CometChat.Conversation[]) => list.map(c => (c as unknown as { id: string }).id);

  it('lifts pinned conversations above the rest', () => {
    const list = [conv('a'), conv('b', true), conv('c'), conv('d', true)];
    expect(ids(orderPinnedFirst(list))).toEqual(['b', 'd', 'a', 'c']);
  });

  it('keeps the server order within each block', () => {
    // Recency still decides inside a block, so a pinned chat with a new message
    // rises to the top of the pinned group rather than the whole list.
    const list = [conv('p1', true), conv('p2', true), conv('u1'), conv('u2')];
    expect(ids(orderPinnedFirst(list))).toEqual(['p1', 'p2', 'u1', 'u2']);
  });

  it('returns the SAME array when nothing is pinned', () => {
    // Identity matters: the common case must not allocate, and callers compare
    // by reference to decide whether anything moved.
    const list = [conv('a'), conv('b')];
    expect(orderPinnedFirst(list)).toBe(list);
  });

  it('returns a new array when something is pinned', () => {
    const list = [conv('a'), conv('b', true)];
    expect(orderPinnedFirst(list)).not.toBe(list);
  });

  it('handles an all-pinned list', () => {
    const list = [conv('a', true), conv('b', true)];
    expect(ids(orderPinnedFirst(list))).toEqual(['a', 'b']);
  });

  it('handles an empty list', () => {
    const list: CometChat.Conversation[] = [];
    expect(orderPinnedFirst(list)).toBe(list);
  });

  it('treats a conversation without isPinned as unpinned', () => {
    // An older SDK has no isPinned(); the optional call must not throw.
    const list = [{ id: 'legacy' } as unknown as CometChat.Conversation, conv('p', true)];
    expect(ids(orderPinnedFirst(list))).toEqual(['p', 'legacy']);
  });
});


/**
 * mergeSilentRefresh — the reconnect refresh against live socket updates
 * (Prajwal 2026-11-20T11:54Z on #674).
 *
 * The refresh runs silently while the list stays on screen, so a realtime
 * listener can update a row WHILE the fetch is in flight. That copy is newer
 * than anything the fetch can return, and the refresh used to replace it
 * regardless: the message vanished from the subtitle and the unread count went
 * back to what the server had said.
 */
describe('mergeSilentRefresh', () => {
  /** A conversation whose last message has this sentAt (and optionally id). */
  function withLastMessage(uid: string, sentAt: number, id = 1): CometChat.Conversation {
    const conv = makeConversation('user', uid);
    const message = new CometChat.TextMessage(uid, 'hi', CometChat.RECEIVER_TYPE.USER);
    message.setSentAt(sentAt);
    message.setId(id);
    conv.setLastMessage(message);
    return conv;
  }
  const ids = (list: CometChat.Conversation[]) => list.map(getConversationEntityId);
  const sentAtOf = (list: CometChat.Conversation[], uid: string) =>
    list.find(c => getConversationEntityId(c) === uid)?.getLastMessage()?.getSentAt();

  it('keeps a row a realtime event made newer while the fetch was in flight', () => {
    const live = withLastMessage('a', 2000);
    const fetched = withLastMessage('a', 1000);

    const merged = mergeSilentRefresh([fetched], [live]);

    expect(merged).toHaveLength(1);
    expect(merged[0]).toBe(live);
  });

  it('takes the fetched row when it is the newer one', () => {
    const stale = withLastMessage('a', 1000);
    const fetched = withLastMessage('a', 2000);

    const merged = mergeSilentRefresh([fetched], [stale]);

    expect(merged[0]).toBe(fetched);
  });

  it('breaks a sentAt tie on the message id, so a same-second message is not lost', () => {
    const live = withLastMessage('a', 1000, 9);
    const fetched = withLastMessage('a', 1000, 4);

    expect(mergeSilentRefresh([fetched], [live])[0]).toBe(live);
    expect(mergeSilentRefresh([withLastMessage('a', 1000, 9)], [withLastMessage('a', 1000, 4)])[0]
      ?.getLastMessage()
      ?.getId()).toBe(9);
  });

  it('follows the server page order and keeps a row below it (D1)', () => {
    const shown = [withLastMessage('old', 500), withLastMessage('b', 900)];
    const page = [withLastMessage('a', 3000), withLastMessage('b', 1000)];

    const merged = mergeSilentRefresh(page, shown);

    expect(ids(merged)).toEqual(['a', 'b', 'old']);
    // 'b' is newer in the page, so the page's copy won.
    expect(sentAtOf(merged, 'b')).toBe(1000);
  });

  it('lists each conversation once, whichever copy wins', () => {
    const live = withLastMessage('a', 2000);
    const merged = mergeSilentRefresh([withLastMessage('a', 1000)], [live, withLastMessage('b', 1)]);
    expect(ids(merged)).toEqual(['a', 'b']);
  });

  it('keeps a row the fetch has no last message for', () => {
    const live = withLastMessage('a', 2000);
    const fetchedWithout = makeConversation('user', 'a');

    expect(mergeSilentRefresh([fetchedWithout], [live])[0]).toBe(live);
  });

  it('takes the fetched row when the one on screen has no last message', () => {
    const fetched = withLastMessage('a', 2000);

    expect(mergeSilentRefresh([fetched], [makeConversation('user', 'a')])[0]).toBe(fetched);
  });

  it('is the fetched page when nothing is on screen', () => {
    const page = [withLastMessage('a', 1), withLastMessage('b', 2)];
    expect(ids(mergeSilentRefresh(page, []))).toEqual(['a', 'b']);
  });

  it('keeps the rows on screen when the fetch came back empty', () => {
    const live = withLastMessage('a', 2000);
    expect(mergeSilentRefresh([], [live])).toEqual([live]);
  });
});
