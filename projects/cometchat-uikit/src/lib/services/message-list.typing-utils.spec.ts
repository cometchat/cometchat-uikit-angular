/**
 * message-list.typing-utils Tests
 *
 * Covers: handleTypingStartedImpl, handleTypingEndedImpl,
 *         clearTypingIndicatorImpl, isTypingIndicatorForCurrentConversationImpl.
 *
 * @module services/message-list.typing-utils
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import {
  handleTypingStartedImpl,
  handleTypingEndedImpl,
  clearTypingIndicatorImpl,
  isTypingIndicatorForCurrentConversationImpl,
} from './message-list.typing-utils';
import { CometChatUIKitConstants } from '../constants';

// Mock CometChatUIKit
vi.mock('../cometchat-uikit', () => ({
  CometChatUIKit: {
    getLoggedInUser: vi.fn(),
  },
}));

import { CometChatUIKit } from '../cometchat-uikit';

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

function makeTypingIndicator(senderUid: string, receiverId: string, receiverType: string): CometChat.TypingIndicator {
  const indicator = new CometChat.TypingIndicator(receiverId, receiverType);
  const sender = makeUser(senderUid);
  (indicator as any).sender = sender;
  (indicator as any).getSender = () => sender;
  (indicator as any).getReceiverType = () => receiverType;
  (indicator as any).getReceiverId = () => receiverId;
  return indicator;
}

function makeCtx(overrides: Record<string, any> = {}) {
  const typingUsersMap = new Map<string, CometChat.TypingIndicator>();
  const typingUsersSignal = {
    value: typingUsersMap,
    set: vi.fn((v: Map<string, CometChat.TypingIndicator>) => { typingUsersSignal.value = v; }),
  };

  return {
    currentUser: null as CometChat.User | null,
    currentGroup: null as CometChat.Group | null,
    typingUsersSignal: Object.assign(() => typingUsersSignal.value, typingUsersSignal),
    typingTimeoutsMap: new Map<string, ReturnType<typeof setTimeout>>(),
    TYPING_INDICATOR_TIMEOUT: 5000,
    ...overrides,
  };
}

describe('message-list.typing-utils', () => {

  beforeEach(() => {
    vi.mocked(CometChatUIKit.getLoggedInUser).mockReturnValue(makeUser('loggedIn'));
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ==================== isTypingIndicatorForCurrentConversationImpl ====================

  describe('isTypingIndicatorForCurrentConversationImpl', () => {
    it('should return false when no currentUser or currentGroup', () => {
      const ctx = makeCtx();
      const indicator = makeTypingIndicator('user1', 'loggedIn', CometChatUIKitConstants.MessageReceiverType.user);
      expect(isTypingIndicatorForCurrentConversationImpl(ctx, indicator)).toBe(false);
    });

    it('should return true for user conversation when sender matches currentUser', () => {
      const ctx = makeCtx({ currentUser: makeUser('user1') });
      const indicator = makeTypingIndicator('user1', 'loggedIn', CometChatUIKitConstants.MessageReceiverType.user);
      expect(isTypingIndicatorForCurrentConversationImpl(ctx, indicator)).toBe(true);
    });

    it('should return false for user conversation when sender does not match', () => {
      const ctx = makeCtx({ currentUser: makeUser('user1') });
      const indicator = makeTypingIndicator('user2', 'loggedIn', CometChatUIKitConstants.MessageReceiverType.user);
      expect(isTypingIndicatorForCurrentConversationImpl(ctx, indicator)).toBe(false);
    });

    it('should return false when receiverType is group but currentUser is set', () => {
      const ctx = makeCtx({ currentUser: makeUser('user1') });
      const indicator = makeTypingIndicator('user1', 'group1', CometChatUIKitConstants.MessageReceiverType.group);
      expect(isTypingIndicatorForCurrentConversationImpl(ctx, indicator)).toBe(false);
    });

    it('should return true for group conversation when receiverId matches', () => {
      const ctx = makeCtx({ currentGroup: makeGroup('group1') });
      const indicator = makeTypingIndicator('user1', 'group1', CometChatUIKitConstants.MessageReceiverType.group);
      expect(isTypingIndicatorForCurrentConversationImpl(ctx, indicator)).toBe(true);
    });

    it('should return false for group conversation when receiverId does not match', () => {
      const ctx = makeCtx({ currentGroup: makeGroup('group1') });
      const indicator = makeTypingIndicator('user1', 'group2', CometChatUIKitConstants.MessageReceiverType.group);
      expect(isTypingIndicatorForCurrentConversationImpl(ctx, indicator)).toBe(false);
    });
  });

  // ==================== clearTypingIndicatorImpl ====================

  describe('clearTypingIndicatorImpl', () => {
    it('should remove user from typingUsersSignal', () => {
      const ctx = makeCtx({ currentUser: makeUser('user1') });
      const indicator = makeTypingIndicator('user1', 'loggedIn', CometChatUIKitConstants.MessageReceiverType.user);
      // Pre-populate the map via the signal's set method
      const map = new Map([['user1', indicator]]);
      ctx.typingUsersSignal.set(map);
      // Reset the spy call count after setup
      ctx.typingUsersSignal.set.mockClear();

      clearTypingIndicatorImpl(ctx, 'user1');
      expect(ctx.typingUsersSignal.set).toHaveBeenCalled();
      const newMap = ctx.typingUsersSignal.set.mock.calls[0][0] as Map<string, any>;
      expect(newMap.has('user1')).toBe(false);
    });

    it('should clear the timeout for the user', () => {
      const ctx = makeCtx();
      const timeoutId = setTimeout(() => {}, 5000);
      ctx.typingTimeoutsMap.set('user1', timeoutId);

      clearTypingIndicatorImpl(ctx, 'user1');
      expect(ctx.typingTimeoutsMap.has('user1')).toBe(false);
    });

    it('should not throw when user is not in the map', () => {
      const ctx = makeCtx();
      expect(() => clearTypingIndicatorImpl(ctx, 'nonexistent')).not.toThrow();
    });
  });

  // ==================== handleTypingStartedImpl ====================

  describe('handleTypingStartedImpl', () => {
    it('should return early when loggedInUser is null', () => {
      vi.mocked(CometChatUIKit.getLoggedInUser).mockReturnValue(null);
      const ctx = makeCtx({ currentUser: makeUser('user1') });
      const indicator = makeTypingIndicator('user1', 'loggedIn', CometChatUIKitConstants.MessageReceiverType.user);
      handleTypingStartedImpl(ctx, indicator);
      expect(ctx.typingUsersSignal.set).not.toHaveBeenCalled();
    });

    it('should return early when sender is the logged-in user', () => {
      const ctx = makeCtx({ currentUser: makeUser('user1') });
      const indicator = makeTypingIndicator('loggedIn', 'user1', CometChatUIKitConstants.MessageReceiverType.user);
      handleTypingStartedImpl(ctx, indicator);
      expect(ctx.typingUsersSignal.set).not.toHaveBeenCalled();
    });

    it('should add user to typingUsersSignal for valid indicator', () => {
      const ctx = makeCtx({ currentUser: makeUser('user1') });
      const indicator = makeTypingIndicator('user1', 'loggedIn', CometChatUIKitConstants.MessageReceiverType.user);
      handleTypingStartedImpl(ctx, indicator);
      expect(ctx.typingUsersSignal.set).toHaveBeenCalled();
      const newMap = ctx.typingUsersSignal.set.mock.calls[0][0] as Map<string, any>;
      expect(newMap.has('user1')).toBe(true);
    });

    it('should set a timeout to clear the indicator', () => {
      const ctx = makeCtx({ currentUser: makeUser('user1') });
      const indicator = makeTypingIndicator('user1', 'loggedIn', CometChatUIKitConstants.MessageReceiverType.user);
      handleTypingStartedImpl(ctx, indicator);
      expect(ctx.typingTimeoutsMap.has('user1')).toBe(true);
    });

    it('should clear existing timeout before setting new one', () => {
      const ctx = makeCtx({ currentUser: makeUser('user1') });
      const existingTimeout = setTimeout(() => {}, 5000);
      ctx.typingTimeoutsMap.set('user1', existingTimeout);

      const indicator = makeTypingIndicator('user1', 'loggedIn', CometChatUIKitConstants.MessageReceiverType.user);
      handleTypingStartedImpl(ctx, indicator);
      // Should still have a timeout (new one)
      expect(ctx.typingTimeoutsMap.has('user1')).toBe(true);
    });

    it('should auto-clear indicator after TYPING_INDICATOR_TIMEOUT', () => {
      const ctx = makeCtx({ currentUser: makeUser('user1'), TYPING_INDICATOR_TIMEOUT: 1000 });
      const indicator = makeTypingIndicator('user1', 'loggedIn', CometChatUIKitConstants.MessageReceiverType.user);
      handleTypingStartedImpl(ctx, indicator);

      // Advance past timeout
      vi.advanceTimersByTime(1100);
      // clearTypingIndicatorImpl should have been called
      expect(ctx.typingTimeoutsMap.has('user1')).toBe(false);
    });
  });

  // ==================== handleTypingEndedImpl ====================

  describe('handleTypingEndedImpl', () => {
    it('should remove user from typingUsersSignal', () => {
      const ctx = makeCtx({ currentUser: makeUser('user1') });
      const indicator = makeTypingIndicator('user1', 'loggedIn', CometChatUIKitConstants.MessageReceiverType.user);
      const map = new Map([['user1', indicator]]);
      ctx.typingUsersSignal.set(map);
      ctx.typingUsersSignal.set.mockClear();

      handleTypingEndedImpl(ctx, indicator);
      expect(ctx.typingUsersSignal.set).toHaveBeenCalled();
    });

    it('should not throw when sender is null', () => {
      const ctx = makeCtx();
      const indicator = makeTypingIndicator('user1', 'loggedIn', CometChatUIKitConstants.MessageReceiverType.user);
      (indicator as any).getSender = () => null;
      expect(() => handleTypingEndedImpl(ctx, indicator)).not.toThrow();
    });
  });
});
