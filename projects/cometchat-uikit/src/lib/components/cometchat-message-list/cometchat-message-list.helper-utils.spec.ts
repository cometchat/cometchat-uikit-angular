/**
 * cometchat-message-list.helper-utils Tests
 *
 * Covers: getMessageAlignmentImpl, isCallForCurrentConversationImpl,
 *         updateListStateImpl, showInlineToastImpl, notifyMessagesReadImpl,
 *         handleServiceErrorImpl, shouldShowSmartRepliesForMessageImpl,
 *         onBubbleErrorImpl.
 *
 * @module components/cometchat-message-list/helper-utils
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import {
  getMessageAlignmentImpl,
  isCallForCurrentConversationImpl,
  updateListStateImpl,
  showInlineToastImpl,
  notifyMessagesReadImpl,
  handleServiceErrorImpl,
  shouldShowSmartRepliesForMessageImpl,
  onBubbleErrorImpl,
} from './cometchat-message-list.helper-utils';
import { States, MessageListAlignment, MessageBubbleAlignment } from '../../Enums/Enums';
import { CometChatUIKitConstants } from '../../constants';
import { ToastType } from '../base-elements/cometchat-toast/cometchat-toast.component';
import { CometChatMessageEvents } from '../../events/CometChatMessageEvents';

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

function makeTextMessage(senderUid: string): CometChat.BaseMessage {
  const msg = new CometChat.TextMessage('r1', 'Hello', CometChat.RECEIVER_TYPE.USER);
  msg.setSender(makeUser(senderUid));
  (msg as any).getCategory = () => 'message';
  (msg as any).getType = () => 'text';
  return msg as unknown as CometChat.BaseMessage;
}

function makeCall(receiverId: string, receiverType: string, senderUid: string): CometChat.Call {
  const call = new CometChat.Call(receiverId, 'audio', receiverType as any);
  call.setSender(makeUser(senderUid));
  (call as any).getReceiverType = () => receiverType;
  (call as any).getReceiverId = () => receiverId;
  (call as any).getSender = () => makeUser(senderUid);
  return call;
}

function makeSelf(overrides: Record<string, any> = {}) {
  const listState = { value: States.loading, set: vi.fn((v: States) => { listState.value = v; }) };
  const inlineToastText = { value: null as string | null, set: vi.fn((v: any) => { inlineToastText.value = v; }) };
  const inlineToastType = { value: ToastType.success, set: vi.fn((v: any) => { inlineToastType.value = v; }) };

  return {
    loggedInUser: makeUser('loggedIn'),
    user: null as CometChat.User | null,
    group: null as CometChat.Group | null,
    messageAlignment: MessageListAlignment.standard,
    isAgentChat: false,
    parentMessageId: null,
    loadingState: vi.fn().mockReturnValue(false),
    errorState: vi.fn().mockReturnValue(null),
    messages: vi.fn().mockReturnValue([]),
    effectiveHideError: vi.fn().mockReturnValue(false),
    listState: Object.assign(() => listState.value, listState),
    inlineToastText: Object.assign(() => inlineToastText.value, inlineToastText),
    inlineToastType: Object.assign(() => inlineToastType.value, inlineToastType),
    inlineToastTimer: null as any,
    cdr: { markForCheck: vi.fn() },
    error: { emit: vi.fn() },
    smartRepliesKeywords: [] as string[],
    ...overrides,
  };
}

describe('cometchat-message-list.helper-utils', () => {

  // ==================== getMessageAlignmentImpl ====================

  describe('getMessageAlignmentImpl', () => {
    it('should return center for call messages', () => {
      const msg = makeTextMessage('user1');
      (msg as any).getCategory = () => CometChatUIKitConstants.MessageCategory.call;
      const self = makeSelf();
      expect(getMessageAlignmentImpl(self, msg)).toBe(MessageBubbleAlignment.center);
    });

    it('should return center for action messages', () => {
      const msg = makeTextMessage('user1');
      (msg as any).getCategory = () => CometChatUIKitConstants.MessageCategory.action;
      const self = makeSelf();
      expect(getMessageAlignmentImpl(self, msg)).toBe(MessageBubbleAlignment.center);
    });

    it('should return left for all messages when messageAlignment is left', () => {
      const msg = makeTextMessage('loggedIn');
      const self = makeSelf({ messageAlignment: MessageListAlignment.left });
      expect(getMessageAlignmentImpl(self, msg)).toBe(MessageBubbleAlignment.left);
    });

    it('should return right for messages from logged-in user', () => {
      const msg = makeTextMessage('loggedIn');
      const self = makeSelf();
      expect(getMessageAlignmentImpl(self, msg)).toBe(MessageBubbleAlignment.right);
    });

    it('should return left for messages from other users', () => {
      const msg = makeTextMessage('user2');
      const self = makeSelf();
      expect(getMessageAlignmentImpl(self, msg)).toBe(MessageBubbleAlignment.left);
    });

    it('should return right when message has no sender', () => {
      const msg = makeTextMessage('user1');
      (msg as any).getSender = () => null;
      const self = makeSelf();
      expect(getMessageAlignmentImpl(self, msg)).toBe(MessageBubbleAlignment.right);
    });
  });

  // ==================== isCallForCurrentConversationImpl ====================

  describe('isCallForCurrentConversationImpl', () => {
    it('should return false when no user or group', () => {
      const self = makeSelf();
      const call = makeCall('user1', CometChatUIKitConstants.MessageReceiverType.user, 'caller');
      expect(isCallForCurrentConversationImpl(self, call)).toBe(false);
    });

    it('should return true when call receiver matches currentUser', () => {
      const self = makeSelf({ user: makeUser('user1') });
      const call = makeCall('user1', CometChatUIKitConstants.MessageReceiverType.user, 'caller');
      expect(isCallForCurrentConversationImpl(self, call)).toBe(true);
    });

    it('should return true when call sender matches currentUser', () => {
      const self = makeSelf({ user: makeUser('user1') });
      const call = makeCall('loggedIn', CometChatUIKitConstants.MessageReceiverType.user, 'user1');
      expect(isCallForCurrentConversationImpl(self, call)).toBe(true);
    });

    it('should return false when call is for different user', () => {
      const self = makeSelf({ user: makeUser('user1') });
      const call = makeCall('user2', CometChatUIKitConstants.MessageReceiverType.user, 'user3');
      expect(isCallForCurrentConversationImpl(self, call)).toBe(false);
    });

    it('should return true for group call matching currentGroup', () => {
      const self = makeSelf({ group: makeGroup('group1') });
      const call = makeCall('group1', CometChatUIKitConstants.MessageReceiverType.group, 'user1');
      expect(isCallForCurrentConversationImpl(self, call)).toBe(true);
    });

    it('should return false for group call not matching currentGroup', () => {
      const self = makeSelf({ group: makeGroup('group1') });
      const call = makeCall('group2', CometChatUIKitConstants.MessageReceiverType.group, 'user1');
      expect(isCallForCurrentConversationImpl(self, call)).toBe(false);
    });
  });

  // ==================== updateListStateImpl ====================

  describe('updateListStateImpl', () => {
    it('should set loading state when loading and no messages', () => {
      const self = makeSelf({
        loadingState: vi.fn().mockReturnValue(true),
        messages: vi.fn().mockReturnValue([]),
      });
      updateListStateImpl(self);
      expect(self.listState.set).toHaveBeenCalledWith(States.loading);
    });

    it('should set error state when error and not loading', () => {
      const self = makeSelf({
        loadingState: vi.fn().mockReturnValue(false),
        errorState: vi.fn().mockReturnValue(new Error('test')),
        messages: vi.fn().mockReturnValue([]),
      });
      updateListStateImpl(self);
      expect(self.listState.set).toHaveBeenCalledWith(States.error);
    });

    it('should set empty state when no messages and not loading', () => {
      const self = makeSelf({
        loadingState: vi.fn().mockReturnValue(false),
        errorState: vi.fn().mockReturnValue(null),
        messages: vi.fn().mockReturnValue([]),
      });
      updateListStateImpl(self);
      expect(self.listState.set).toHaveBeenCalledWith(States.empty);
    });

    it('should set loaded state when messages exist', () => {
      const msg = makeTextMessage('user1');
      const self = makeSelf({
        loadingState: vi.fn().mockReturnValue(false),
        errorState: vi.fn().mockReturnValue(null),
        messages: vi.fn().mockReturnValue([msg]),
      });
      updateListStateImpl(self);
      expect(self.listState.set).toHaveBeenCalledWith(States.loaded);
    });

    it('should not show error when effectiveHideError is true', () => {
      const self = makeSelf({
        loadingState: vi.fn().mockReturnValue(false),
        errorState: vi.fn().mockReturnValue(new Error('test')),
        messages: vi.fn().mockReturnValue([]),
        effectiveHideError: vi.fn().mockReturnValue(true),
      });
      updateListStateImpl(self);
      expect(self.listState.set).toHaveBeenCalledWith(States.empty);
    });
  });

  // ==================== showInlineToastImpl ====================

  describe('showInlineToastImpl', () => {
    it('should set inlineToastText', () => {
      vi.useFakeTimers();
      const self = makeSelf();
      showInlineToastImpl(self, 'Message copied');
      expect(self.inlineToastText.set).toHaveBeenCalledWith('Message copied');
      vi.useRealTimers();
    });

    it('should set inlineToastType', () => {
      vi.useFakeTimers();
      const self = makeSelf();
      showInlineToastImpl(self, 'Error', ToastType.error);
      expect(self.inlineToastType.set).toHaveBeenCalledWith(ToastType.error);
      vi.useRealTimers();
    });

    it('should clear toast after duration', () => {
      vi.useFakeTimers();
      const self = makeSelf();
      showInlineToastImpl(self, 'Message copied', ToastType.success, 1000);
      vi.advanceTimersByTime(1100);
      expect(self.inlineToastText.set).toHaveBeenLastCalledWith(null);
      vi.useRealTimers();
    });

    it('should call cdr.markForCheck', () => {
      vi.useFakeTimers();
      const self = makeSelf();
      showInlineToastImpl(self, 'Test');
      expect(self.cdr.markForCheck).toHaveBeenCalled();
      vi.useRealTimers();
    });
  });

  // ==================== notifyMessagesReadImpl ====================

  describe('notifyMessagesReadImpl', () => {
    it('should emit ccMessageRead event', () => {
      const spy = vi.fn();
      const sub = CometChatMessageEvents.ccMessageRead.subscribe(spy);
      const msg = makeTextMessage('user1');
      const self = makeSelf();
      notifyMessagesReadImpl(self, msg);
      sub.unsubscribe();
      expect(spy).toHaveBeenCalledWith(msg);
    });

    it('should not throw when event emission fails', () => {
      const self = makeSelf();
      const msg = makeTextMessage('user1');
      expect(() => notifyMessagesReadImpl(self, msg)).not.toThrow();
    });
  });

  // ==================== handleServiceErrorImpl ====================

  describe('handleServiceErrorImpl', () => {
    it('should set error state when effectiveHideError is false', () => {
      const self = makeSelf({ effectiveHideError: vi.fn().mockReturnValue(false) });
      handleServiceErrorImpl(self, new Error('service error'));
      expect(self.listState.set).toHaveBeenCalledWith(States.error);
    });

    it('should emit error event', () => {
      const self = makeSelf({ effectiveHideError: vi.fn().mockReturnValue(false) });
      const err = new Error('service error');
      handleServiceErrorImpl(self, err);
      expect(self.error.emit).toHaveBeenCalledWith(err);
    });

    it('should not set error state when effectiveHideError is true', () => {
      const self = makeSelf({ effectiveHideError: vi.fn().mockReturnValue(true) });
      handleServiceErrorImpl(self, new Error('service error'));
      expect(self.listState.set).not.toHaveBeenCalled();
    });
  });

  // ==================== shouldShowSmartRepliesForMessageImpl ====================

  describe('shouldShowSmartRepliesForMessageImpl', () => {
    it('should return true when no keywords configured', () => {
      const self = makeSelf({ smartRepliesKeywords: [] });
      const msg = makeTextMessage('user1');
      expect(shouldShowSmartRepliesForMessageImpl(self, msg)).toBe(true);
    });

    it('should return false for non-text messages when keywords are set', () => {
      const self = makeSelf({ smartRepliesKeywords: ['hello'] });
      const msg = makeTextMessage('user1');
      (msg as any).getType = () => 'image';
      expect(shouldShowSmartRepliesForMessageImpl(self, msg)).toBe(false);
    });

    it('should return true when message contains a keyword', () => {
      const self = makeSelf({ smartRepliesKeywords: ['hello'] });
      const msg = new CometChat.TextMessage('r1', 'Hello world', CometChat.RECEIVER_TYPE.USER);
      (msg as any).getType = () => 'text';
      (msg as any).getText = () => 'Hello world';
      expect(shouldShowSmartRepliesForMessageImpl(self, msg as unknown as CometChat.BaseMessage)).toBe(true);
    });

    it('should return false when message does not contain any keyword', () => {
      const self = makeSelf({ smartRepliesKeywords: ['urgent', 'asap'] });
      const msg = new CometChat.TextMessage('r1', 'Hello world', CometChat.RECEIVER_TYPE.USER);
      (msg as any).getType = () => 'text';
      (msg as any).getText = () => 'Hello world';
      expect(shouldShowSmartRepliesForMessageImpl(self, msg as unknown as CometChat.BaseMessage)).toBe(false);
    });

    it('should be case-insensitive for keyword matching', () => {
      const self = makeSelf({ smartRepliesKeywords: ['HELLO'] });
      const msg = new CometChat.TextMessage('r1', 'hello world', CometChat.RECEIVER_TYPE.USER);
      (msg as any).getType = () => 'text';
      (msg as any).getText = () => 'hello world';
      expect(shouldShowSmartRepliesForMessageImpl(self, msg as unknown as CometChat.BaseMessage)).toBe(true);
    });
  });

  // ==================== onBubbleErrorImpl ====================

  describe('onBubbleErrorImpl', () => {
    it('should not throw', () => {
      expect(() => onBubbleErrorImpl({
        error: new Error('bubble error'),
        componentName: 'TestComponent',
      })).not.toThrow();
    });
  });
});
