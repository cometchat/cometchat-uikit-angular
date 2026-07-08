/**
 * cometchat-message-list.interaction-utils Tests
 *
 * Covers: onEditMessageImpl, onReplyMessageImpl, onMessageInfoImpl,
 *         closeMessageInfoImpl, handleMessagePrivatelyImpl,
 *         onReplyPreviewClickImpl, markMessageAsUnreadImpl.
 *
 * @module components/cometchat-message-list/interaction-utils
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import {
  onEditMessageImpl,
  onReplyMessageImpl,
  onMessageInfoImpl,
  closeMessageInfoImpl,
  handleMessagePrivatelyImpl,
  onReplyPreviewClickImpl,
  markMessageAsUnreadImpl,
} from './cometchat-message-list.interaction-utils';
import { CometChatMessageEvents } from '../../events/CometChatMessageEvents';
import { MessageStatus } from '../../Enums/Enums';

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

function makeTextMessage(id: number, senderUid: string): CometChat.TextMessage {
  const msg = new CometChat.TextMessage('r1', 'Hello', CometChat.RECEIVER_TYPE.USER);
  (msg as any).id = id;
  (msg as any).getId = () => id;
  msg.setSender(makeUser(senderUid));
  return msg;
}

function makeSelf(overrides: Record<string, any> = {}) {
  const messageForInfo = { value: null as any, set: vi.fn((v: any) => { messageForInfo.value = v; }) };
  const showMessageInfo = { value: false, set: vi.fn((v: boolean) => { showMessageInfo.value = v; }) };
  const lastUnreadMarkedMessageId = { value: null as any, set: vi.fn((v: any) => { lastUnreadMarkedMessageId.value = v; }) };
  const unreadDividerMessageId = { value: null as any, set: vi.fn((v: any) => { unreadDividerMessageId.value = v; }) };
  const markedAsUnreadCount = { value: 0, set: vi.fn((v: number) => { markedAsUnreadCount.value = v; }) };
  const showScrollToBottom = { value: false, set: vi.fn((v: boolean) => { showScrollToBottom.value = v; }) };

  return {
    messages: vi.fn().mockReturnValue([]),
    parentMessageId: null,
    group: null,
    loggedInUser: makeUser('loggedIn'),
    messageForInfo: Object.assign(() => messageForInfo.value, messageForInfo),
    showMessageInfo: Object.assign(() => showMessageInfo.value, showMessageInfo),
    lastUnreadMarkedMessageId: Object.assign(() => lastUnreadMarkedMessageId.value, lastUnreadMarkedMessageId),
    unreadDividerMessageId: Object.assign(() => unreadDividerMessageId.value, unreadDividerMessageId),
    markedAsUnreadCount: Object.assign(() => markedAsUnreadCount.value, markedAsUnreadCount),
    showScrollToBottom: Object.assign(() => showScrollToBottom.value, showScrollToBottom),
    replyClick: { emit: vi.fn() },
    messagePrivatelyClick: { emit: vi.fn() },
    scrollToMessage: vi.fn(),
    scrollToMessageWithRetry: vi.fn(),
    showInlineToast: vi.fn(),
    messageListService: {
      markAsUnread: vi.fn().mockResolvedValue({
        getUnreadMessageCount: () => 3,
      }),
      fetchMessagesAroundId: vi.fn().mockResolvedValue(undefined),
    },
    cdr: { markForCheck: vi.fn() },
    ...overrides,
  };
}

describe('cometchat-message-list.interaction-utils', () => {

  // ==================== onEditMessageImpl ====================

  describe('onEditMessageImpl', () => {
    it('should emit ccMessageEdited with inprogress status for text message', () => {
      const msg = makeTextMessage(1, 'user1');
      const self = makeSelf({ messages: vi.fn().mockReturnValue([msg]) });
      const spy = vi.fn();
      const sub = CometChatMessageEvents.ccMessageEdited.subscribe(spy);
      onEditMessageImpl(self, 1);
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({ status: MessageStatus.inprogress, message: msg })
      );
      sub.unsubscribe();
    });

    it('should not emit when message is not found', () => {
      const self = makeSelf({ messages: vi.fn().mockReturnValue([]) });
      const spy = vi.fn();
      const sub = CometChatMessageEvents.ccMessageEdited.subscribe(spy);
      onEditMessageImpl(self, 999);
      expect(spy).not.toHaveBeenCalled();
      sub.unsubscribe();
    });

    it('should not emit for non-text messages', () => {
      const mediaMsg = new CometChat.MediaMessage('r1', {} as File, 'image', CometChat.RECEIVER_TYPE.USER);
      (mediaMsg as any).id = 1;
      (mediaMsg as any).getId = () => 1;
      const self = makeSelf({ messages: vi.fn().mockReturnValue([mediaMsg]) });
      const spy = vi.fn();
      const sub = CometChatMessageEvents.ccMessageEdited.subscribe(spy);
      onEditMessageImpl(self, 1);
      expect(spy).not.toHaveBeenCalled();
      sub.unsubscribe();
    });
  });

  // ==================== onReplyMessageImpl ====================

  describe('onReplyMessageImpl', () => {
    it('should emit ccReplyToMessage with inprogress status', () => {
      const msg = makeTextMessage(1, 'user1');
      const self = makeSelf({ messages: vi.fn().mockReturnValue([msg]) });
      const spy = vi.fn();
      const sub = CometChatMessageEvents.ccReplyToMessage.subscribe(spy);
      onReplyMessageImpl(self, 1);
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({ status: MessageStatus.inprogress, message: msg })
      );
      sub.unsubscribe();
    });

    it('should emit replyClick event', () => {
      const msg = makeTextMessage(1, 'user1');
      const self = makeSelf({ messages: vi.fn().mockReturnValue([msg]) });
      onReplyMessageImpl(self, 1);
      expect(self.replyClick.emit).toHaveBeenCalledWith(msg);
    });

    it('should not emit when message is not found', () => {
      const self = makeSelf({ messages: vi.fn().mockReturnValue([]) });
      const spy = vi.fn();
      const sub = CometChatMessageEvents.ccReplyToMessage.subscribe(spy);
      onReplyMessageImpl(self, 999);
      expect(spy).not.toHaveBeenCalled();
      sub.unsubscribe();
    });
  });

  // ==================== onMessageInfoImpl ====================

  describe('onMessageInfoImpl', () => {
    it('should set messageForInfo and showMessageInfo when message found', () => {
      const msg = makeTextMessage(5, 'user1');
      const self = makeSelf({ messages: vi.fn().mockReturnValue([msg]) });
      onMessageInfoImpl(self, 5);
      expect(self.messageForInfo.set).toHaveBeenCalledWith(msg);
      expect(self.showMessageInfo.set).toHaveBeenCalledWith(true);
    });

    it('should not set anything when message not found', () => {
      const self = makeSelf({ messages: vi.fn().mockReturnValue([]) });
      onMessageInfoImpl(self, 999);
      expect(self.messageForInfo.set).not.toHaveBeenCalled();
    });
  });

  // ==================== closeMessageInfoImpl ====================

  describe('closeMessageInfoImpl', () => {
    it('should set showMessageInfo to false', () => {
      const self = makeSelf();
      closeMessageInfoImpl(self);
      expect(self.showMessageInfo.set).toHaveBeenCalledWith(false);
    });

    it('should set messageForInfo to null', () => {
      const self = makeSelf();
      closeMessageInfoImpl(self);
      expect(self.messageForInfo.set).toHaveBeenCalledWith(null);
    });
  });

  // ==================== handleMessagePrivatelyImpl ====================

  describe('handleMessagePrivatelyImpl', () => {
    it('should return early when no group context', () => {
      const msg = makeTextMessage(1, 'user2');
      const self = makeSelf({ group: null });
      handleMessagePrivatelyImpl(self, msg);
      expect(self.messagePrivatelyClick.emit).not.toHaveBeenCalled();
    });

    it('should return early when sender is the logged-in user', () => {
      const msg = makeTextMessage(1, 'loggedIn');
      const self = makeSelf({ group: makeGroup('g1') });
      handleMessagePrivatelyImpl(self, msg);
      expect(self.messagePrivatelyClick.emit).not.toHaveBeenCalled();
    });

    it('should emit messagePrivatelyClick for other user in group context', () => {
      const msg = makeTextMessage(1, 'user2');
      const self = makeSelf({ group: makeGroup('g1') });
      handleMessagePrivatelyImpl(self, msg);
      expect(self.messagePrivatelyClick.emit).toHaveBeenCalledWith(
        expect.objectContaining({ message: msg })
      );
    });
  });

  // ==================== onReplyPreviewClickImpl ====================

  describe('onReplyPreviewClickImpl', () => {
    it('should return early when quoted message has no ID', () => {
      const quotedMsg = makeTextMessage(0, 'user1');
      (quotedMsg as any).getId = () => 0;
      const self = makeSelf();
      onReplyPreviewClickImpl(self, quotedMsg);
      expect(self.scrollToMessage).not.toHaveBeenCalled();
    });

    it('should scroll to message when it exists in the list', () => {
      const quotedMsg = makeTextMessage(10, 'user1');
      const self = makeSelf({ messages: vi.fn().mockReturnValue([quotedMsg]) });
      onReplyPreviewClickImpl(self, quotedMsg);
      expect(self.scrollToMessage).toHaveBeenCalledWith(10);
    });

    it('should call fetchMessagesAroundId when message not in list', async () => {
      const quotedMsg = makeTextMessage(10, 'user1');
      const self = makeSelf({ messages: vi.fn().mockReturnValue([]) });
      onReplyPreviewClickImpl(self, quotedMsg);
      await new Promise(r => setTimeout(r, 10));
      expect(self.messageListService.fetchMessagesAroundId).toHaveBeenCalledWith(10);
    });
  });

  // ==================== markMessageAsUnreadImpl ====================

  describe('markMessageAsUnreadImpl', () => {
    it('should call markAsUnread on the service', async () => {
      const msg = makeTextMessage(5, 'user2');
      const self = makeSelf();
      await markMessageAsUnreadImpl(self, msg);
      expect(self.messageListService.markAsUnread).toHaveBeenCalledWith(msg);
    });

    it('should set lastUnreadMarkedMessageId', async () => {
      const msg = makeTextMessage(5, 'user2');
      const self = makeSelf();
      await markMessageAsUnreadImpl(self, msg);
      expect(self.lastUnreadMarkedMessageId.set).toHaveBeenCalledWith(5);
    });

    it('should set unreadDividerMessageId', async () => {
      const msg = makeTextMessage(5, 'user2');
      const self = makeSelf();
      await markMessageAsUnreadImpl(self, msg);
      expect(self.unreadDividerMessageId.set).toHaveBeenCalledWith(5);
    });

    it('should return early when message is already marked as unread', async () => {
      const msg = makeTextMessage(5, 'user2');
      const lastUnreadMarkedMessageId = { value: 5, set: vi.fn() };
      const self = makeSelf({
        lastUnreadMarkedMessageId: Object.assign(() => lastUnreadMarkedMessageId.value, lastUnreadMarkedMessageId),
      });
      await markMessageAsUnreadImpl(self, msg);
      expect(self.messageListService.markAsUnread).not.toHaveBeenCalled();
    });

    it('should show inline toast on error', async () => {
      const msg = makeTextMessage(5, 'user2');
      const self = makeSelf({
        messageListService: {
          markAsUnread: vi.fn().mockRejectedValue(new Error('fail')),
          fetchMessagesAroundId: vi.fn(),
        },
      });
      await markMessageAsUnreadImpl(self, msg);
      expect(self.showInlineToast).toHaveBeenCalled();
    });
  });
});
