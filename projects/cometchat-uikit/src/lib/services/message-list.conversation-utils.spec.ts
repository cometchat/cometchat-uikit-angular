/**
 * message-list.conversation-utils Tests
 *
 * Covers: isMessageForCurrentConversationImpl, isThreadReplyForCurrentConversationImpl,
 *         handleGroupActionImpl, handleCallActionImpl, handleReconnectionImpl.
 *
 * @module services/message-list.conversation-utils
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import {
  isMessageForCurrentConversationImpl,
  isThreadReplyForCurrentConversationImpl,
  handleGroupActionImpl,
  handleCallActionImpl,
  handleReconnectionImpl,
} from './message-list.conversation-utils';
import { CometChatUIKitConstants } from '../constants';

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

function makeTextMessage(
  senderUid: string,
  receiverId: string,
  receiverType: string,
  opts: { parentMessageId?: number } = {}
): CometChat.BaseMessage {
  const msg = new CometChat.TextMessage(receiverId, 'Hello', receiverType as any);
  msg.setSender(makeUser(senderUid));
  (msg as any).getReceiverId = () => receiverId;
  (msg as any).getReceiverType = () => receiverType;
  (msg as any).getParentMessageId = () => opts.parentMessageId ?? null;
  return msg as unknown as CometChat.BaseMessage;
}

function makeSelf(overrides: Record<string, any> = {}) {
  return {
    currentUser: null as CometChat.User | null,
    currentGroup: null as CometChat.Group | null,
    parentMessageId: null as number | null,
    isAgentChatMode: false,
    hideGroupActionMessages: false,
    addMessage: vi.fn(),
    updateMessageById: vi.fn(),
    getMessageById: vi.fn().mockReturnValue(undefined),
    nextMessageIdSignal: vi.fn().mockReturnValue(0),
    buildNextMessagesRequest: vi.fn().mockReturnValue({}),
    fetchNextMessages: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

// Mock CometChatUIKit.getLoggedInUser
vi.mock('../cometchat-uikit', () => ({
  CometChatUIKit: {
    getLoggedInUser: vi.fn().mockReturnValue(null),
  },
}));

import { CometChatUIKit } from '../cometchat-uikit';

describe('message-list.conversation-utils', () => {

  beforeEach(() => {
    vi.mocked(CometChatUIKit.getLoggedInUser).mockReturnValue(makeUser('loggedIn'));
  });

  // ==================== isMessageForCurrentConversationImpl ====================

  describe('isMessageForCurrentConversationImpl', () => {
    it('should return false when no currentUser or currentGroup', () => {
      const self = makeSelf();
      const msg = makeTextMessage('user1', 'loggedIn', CometChatUIKitConstants.MessageReceiverType.user);
      expect(isMessageForCurrentConversationImpl(self, msg)).toBe(false);
    });

    it('should return true for message between loggedIn user and currentUser', () => {
      const self = makeSelf({ currentUser: makeUser('user1') });
      const msg = makeTextMessage('user1', 'loggedIn', CometChatUIKitConstants.MessageReceiverType.user);
      expect(isMessageForCurrentConversationImpl(self, msg)).toBe(true);
    });

    it('should return true for message sent by loggedIn to currentUser', () => {
      const self = makeSelf({ currentUser: makeUser('user1') });
      const msg = makeTextMessage('loggedIn', 'user1', CometChatUIKitConstants.MessageReceiverType.user);
      expect(isMessageForCurrentConversationImpl(self, msg)).toBe(true);
    });

    it('should return false for message between unrelated users', () => {
      const self = makeSelf({ currentUser: makeUser('user1') });
      const msg = makeTextMessage('user3', 'user4', CometChatUIKitConstants.MessageReceiverType.user);
      expect(isMessageForCurrentConversationImpl(self, msg)).toBe(false);
    });

    it('should return false when receiverType is group but currentUser is set', () => {
      const self = makeSelf({ currentUser: makeUser('user1') });
      const msg = makeTextMessage('user1', 'group1', CometChatUIKitConstants.MessageReceiverType.group);
      expect(isMessageForCurrentConversationImpl(self, msg)).toBe(false);
    });

    it('should return true for group message matching currentGroup', () => {
      const self = makeSelf({ currentGroup: makeGroup('group1') });
      const msg = makeTextMessage('user1', 'group1', CometChatUIKitConstants.MessageReceiverType.group);
      expect(isMessageForCurrentConversationImpl(self, msg)).toBe(true);
    });

    it('should return false for group message not matching currentGroup', () => {
      const self = makeSelf({ currentGroup: makeGroup('group1') });
      const msg = makeTextMessage('user1', 'group2', CometChatUIKitConstants.MessageReceiverType.group);
      expect(isMessageForCurrentConversationImpl(self, msg)).toBe(false);
    });

    it('should return false when loggedInUser is null', () => {
      vi.mocked(CometChatUIKit.getLoggedInUser).mockReturnValue(null);
      const self = makeSelf({ currentUser: makeUser('user1') });
      const msg = makeTextMessage('user1', 'loggedIn', CometChatUIKitConstants.MessageReceiverType.user);
      expect(isMessageForCurrentConversationImpl(self, msg)).toBe(false);
    });

    it('should return false for thread reply when parentMessageId is null and message has parent', () => {
      const self = makeSelf({ currentUser: makeUser('user1'), parentMessageId: null });
      const msg = makeTextMessage('user1', 'loggedIn', CometChatUIKitConstants.MessageReceiverType.user, { parentMessageId: 99 });
      expect(isMessageForCurrentConversationImpl(self, msg)).toBe(false);
    });

    it('should return true for thread reply when parentMessageId matches', () => {
      const self = makeSelf({ currentUser: makeUser('user1'), parentMessageId: 99 });
      const msg = makeTextMessage('user1', 'loggedIn', CometChatUIKitConstants.MessageReceiverType.user, { parentMessageId: 99 });
      expect(isMessageForCurrentConversationImpl(self, msg)).toBe(true);
    });
  });

  // ==================== isThreadReplyForCurrentConversationImpl ====================

  describe('isThreadReplyForCurrentConversationImpl', () => {
    it('should return false when no currentUser or currentGroup', () => {
      const self = makeSelf();
      const msg = makeTextMessage('user1', 'loggedIn', CometChatUIKitConstants.MessageReceiverType.user);
      expect(isThreadReplyForCurrentConversationImpl(self, msg)).toBe(false);
    });

    it('should return true for user conversation thread reply', () => {
      const self = makeSelf({ currentUser: makeUser('user1') });
      const msg = makeTextMessage('loggedIn', 'user1', CometChatUIKitConstants.MessageReceiverType.user);
      expect(isThreadReplyForCurrentConversationImpl(self, msg)).toBe(true);
    });

    it('should return true for group conversation thread reply', () => {
      const self = makeSelf({ currentGroup: makeGroup('group1') });
      const msg = makeTextMessage('user1', 'group1', CometChatUIKitConstants.MessageReceiverType.group);
      expect(isThreadReplyForCurrentConversationImpl(self, msg)).toBe(true);
    });

    it('should return false for group message not matching currentGroup', () => {
      const self = makeSelf({ currentGroup: makeGroup('group1') });
      const msg = makeTextMessage('user1', 'group2', CometChatUIKitConstants.MessageReceiverType.group);
      expect(isThreadReplyForCurrentConversationImpl(self, msg)).toBe(false);
    });
  });

  // ==================== handleGroupActionImpl ====================

  describe('handleGroupActionImpl', () => {
    it('should return early when no currentGroup', () => {
      const self = makeSelf({ currentGroup: null });
      const action = {} as CometChat.Action;
      const group = makeGroup('group1');
      handleGroupActionImpl(self, action, group);
      expect(self.addMessage).not.toHaveBeenCalled();
    });

    it('should return early when group GUID does not match currentGroup', () => {
      const self = makeSelf({ currentGroup: makeGroup('group1') });
      const action = {} as CometChat.Action;
      handleGroupActionImpl(self, action, makeGroup('group2'));
      expect(self.addMessage).not.toHaveBeenCalled();
    });

    it('should return early when hideGroupActionMessages is true', () => {
      const self = makeSelf({ currentGroup: makeGroup('group1'), hideGroupActionMessages: true });
      const action = {} as CometChat.Action;
      handleGroupActionImpl(self, action, makeGroup('group1'));
      expect(self.addMessage).not.toHaveBeenCalled();
    });

    it('should call addMessage when group matches and messages are not hidden', () => {
      const self = makeSelf({ currentGroup: makeGroup('group1') });
      const action = {} as CometChat.Action;
      handleGroupActionImpl(self, action, makeGroup('group1'));
      expect(self.addMessage).toHaveBeenCalledWith(action);
    });
  });

  // ==================== handleCallActionImpl ====================

  describe('handleCallActionImpl', () => {
    it('should return early when no currentUser or currentGroup', () => {
      const self = makeSelf();
      const call = {} as CometChat.Call;
      (call as any).getReceiverType = () => CometChatUIKitConstants.MessageReceiverType.user;
      (call as any).getReceiver = () => makeUser('user1');
      (call as any).getSender = () => makeUser('user2');
      handleCallActionImpl(self, call);
      expect(self.addMessage).not.toHaveBeenCalled();
    });

    it('should add call message when receiver matches currentUser', () => {
      const self = makeSelf({ currentUser: makeUser('user1') });
      const call = {} as CometChat.Call;
      (call as any).getReceiverType = () => CometChatUIKitConstants.MessageReceiverType.user;
      (call as any).getReceiver = () => ({ getUid: () => 'user1' });
      (call as any).getSender = () => makeUser('user2');
      (call as any).getId = () => 1;
      handleCallActionImpl(self, call);
      expect(self.addMessage).toHaveBeenCalledWith(call);
    });

    it('should update existing call message when found by ID', () => {
      const existingCall = {} as CometChat.Call;
      const self = makeSelf({
        currentUser: makeUser('user1'),
        getMessageById: vi.fn().mockReturnValue(existingCall),
      });
      const call = {} as CometChat.Call;
      (call as any).getReceiverType = () => CometChatUIKitConstants.MessageReceiverType.user;
      (call as any).getReceiver = () => ({ getUid: () => 'user1' });
      (call as any).getSender = () => makeUser('user2');
      (call as any).getId = () => 1;
      handleCallActionImpl(self, call);
      expect(self.updateMessageById).toHaveBeenCalledWith(1, call);
    });

    it('should add group call message when group matches', () => {
      const self = makeSelf({ currentGroup: makeGroup('group1') });
      const call = {} as CometChat.Call;
      (call as any).getReceiverType = () => CometChatUIKitConstants.MessageReceiverType.group;
      (call as any).getReceiver = () => ({ getGuid: () => 'group1' });
      (call as any).getSender = () => makeUser('user1');
      (call as any).getId = () => 2;
      handleCallActionImpl(self, call);
      expect(self.addMessage).toHaveBeenCalledWith(call);
    });
  });

  // ==================== handleReconnectionImpl ====================

  describe('handleReconnectionImpl', () => {
    it('should return early when no currentUser or currentGroup', async () => {
      const self = makeSelf();
      await handleReconnectionImpl(self);
      expect(self.fetchNextMessages).not.toHaveBeenCalled();
    });

    it('should return early when lastMessageId is 0', async () => {
      const self = makeSelf({
        currentUser: makeUser('user1'),
        nextMessageIdSignal: vi.fn().mockReturnValue(0),
      });
      await handleReconnectionImpl(self);
      expect(self.fetchNextMessages).not.toHaveBeenCalled();
    });

    it('should call fetchNextMessages when lastMessageId > 0', async () => {
      const self = makeSelf({
        currentUser: makeUser('user1'),
        nextMessageIdSignal: vi.fn().mockReturnValue(100),
      });
      await handleReconnectionImpl(self);
      expect(self.fetchNextMessages).toHaveBeenCalled();
    });

    it('should not throw when fetchNextMessages fails', async () => {
      const self = makeSelf({
        currentUser: makeUser('user1'),
        nextMessageIdSignal: vi.fn().mockReturnValue(100),
        fetchNextMessages: vi.fn().mockRejectedValue(new Error('network error')),
      });
      await expect(handleReconnectionImpl(self)).resolves.not.toThrow();
    });
  });
});
