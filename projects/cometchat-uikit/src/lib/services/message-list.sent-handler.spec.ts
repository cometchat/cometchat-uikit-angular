/**
 * message-list.sent-handler Tests
 *
 * Covers: handleSentMessageImpl, updateSentMessageByMuidImpl,
 *         updateSentMessageReplyCountImpl, handleEditedMessageImpl,
 *         flushPendingSentMessages, setupSentMessageListenerImpl,
 *         setupEditedMessageListenerImpl.
 *
 * @module services/message-list.sent-handler
 */

import type { Subscription } from 'rxjs';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import {
  handleSentMessageImpl,
  updateSentMessageByMuidImpl,
  updateSentMessageReplyCountImpl,
  handleEditedMessageImpl,
  flushPendingSentMessages,
  setupSentMessageListenerImpl,
  setupEditedMessageListenerImpl,
} from './message-list.sent-handler';
import { CometChatMessageEvents } from '../events/CometChatMessageEvents';
import { MessageStatus } from '../Enums/Enums';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTextMessage(id = 1, muid = `muid-${id}`): CometChat.TextMessage {
  const msg = new CometChat.TextMessage('r1', 'Hello', CometChat.RECEIVER_TYPE.USER);
  (msg as any).id = id;
  (msg as any).getId = () => id;
  (msg as any).getMuid = () => muid;
  (msg as any).getParentMessageId = () => null;
  return msg;
}

function makeCtx(overrides: Record<string, any> = {}) {
  const messageMuidMap = new Map<string, CometChat.BaseMessage>();
  const messageIdMap = new Map<string, CometChat.BaseMessage>();

  return {
    parentMessageId: null,
    currentUser: null as { getUid: () => string } | null,
    currentGroup: null as { getGuid: () => string } | null,
    isAgentChatMode: false,
    loadingStateSignal: vi.fn().mockReturnValue(false),
    isMessageForCurrentConversation: vi.fn().mockReturnValue(true),
    isThreadReplyForCurrentConversation: vi.fn().mockReturnValue(false),
    addMessage: vi.fn(),
    updateMessageById: vi.fn().mockReturnValue(true),
    updateMessageByMuid: vi.fn(),
    messageMuidMap,
    messageIdMap,
    normalizeMessageId: vi.fn((id: any) => String(id)),
    // Written by setupSentMessageListenerImpl / setupEditedMessageListenerImpl.
    ccMessageSentSubscription: undefined as Subscription | undefined,
    ccMessageEditedSubscription: undefined as Subscription | undefined,
    ...overrides,
  };
}

describe('message-list.sent-handler', () => {

  // ==================== handleSentMessageImpl ====================

  describe('handleSentMessageImpl', () => {
    it('should call addMessage for inprogress status', () => {
      const ctx = makeCtx();
      const msg = makeTextMessage(1);
      handleSentMessageImpl(ctx, { message: msg, status: MessageStatus.inprogress });
      expect(ctx.addMessage).toHaveBeenCalledWith(msg);
    });

    it('swaps the pending bubble for the sent message on success', () => {
      const ctx = makeCtx();
      const msg = makeTextMessage(1);
      ctx.messageMuidMap.set('muid-1', makeTextMessage(0, 'muid-1'));
      handleSentMessageImpl(ctx, { message: msg, status: MessageStatus.success });
      expect(ctx.updateMessageByMuid).toHaveBeenCalledWith('muid-1', msg);
      expect(ctx.addMessage).not.toHaveBeenCalled();
    });

    it('adds a sent message the list never got as pending (ENG-39944)', () => {
      const ctx = makeCtx();
      const msg = makeTextMessage(1);
      handleSentMessageImpl(ctx, { message: msg, status: MessageStatus.success });
      expect(ctx.addMessage).toHaveBeenCalledWith(msg);
    });

    it('should call updateSentMessageByMuid for error status', () => {
      const ctx = makeCtx();
      const msg = makeTextMessage(1);
      handleSentMessageImpl(ctx, { message: msg, status: MessageStatus.error });
      expect(ctx.updateMessageById).toHaveBeenCalled();
    });

    it('should return early when message is not for current conversation', () => {
      const ctx = makeCtx({ isMessageForCurrentConversation: vi.fn().mockReturnValue(false) });
      const msg = makeTextMessage(1);
      handleSentMessageImpl(ctx, { message: msg, status: MessageStatus.inprogress });
      expect(ctx.addMessage).not.toHaveBeenCalled();
    });

    it('should queue message when loading state is true', () => {
      const ctx = makeCtx({ loadingStateSignal: vi.fn().mockReturnValue(true) });
      const msg = makeTextMessage(1);
      handleSentMessageImpl(ctx, { message: msg, status: MessageStatus.inprogress });
      // Should not add immediately
      expect(ctx.addMessage).not.toHaveBeenCalled();
    });

    // -----------------------------------------------------------------------
    // Auto-subscribe on send
    //
    // Sending a message subscribes its author to that message's thread
    // server-side, and a top-level message is the root of its own thread. The
    // send response does not carry the flag back, so the handler stamps it.
    // -----------------------------------------------------------------------

    /** A sent message carrying a local thread-subscription flag, as the SDK's does. */
    function makeSubscribable(parentMessageId: number | null = null) {
      let subscribed = false;
      const msg = makeTextMessage();
      (msg as any).getParentMessageId = () => parentMessageId;
      (msg as any).isThreadSubscribed = () => subscribed;
      (msg as any).setThreadSubscribed = (value: boolean) => {
        subscribed = value;
      };
      return msg;
    }

    it('stamps a top-level send subscribed — the author follows their own thread', () => {
      const msg = makeSubscribable();
      handleSentMessageImpl(makeCtx(), { message: msg, status: MessageStatus.success } as any);
      expect((msg as any).isThreadSubscribed()).toBe(true);
    });

    it('stamps a threaded reply subscribed too', () => {
      const msg = makeSubscribable(42);
      handleSentMessageImpl(
        makeCtx({ parentMessageId: 42 }),
        { message: msg, status: MessageStatus.success } as any
      );
      expect((msg as any).isThreadSubscribed()).toBe(true);
    });

    it('stamps while the send is still in flight, so the bubble reads right at once', () => {
      const msg = makeSubscribable();
      handleSentMessageImpl(makeCtx(), { message: msg, status: MessageStatus.inprogress } as any);
      expect((msg as any).isThreadSubscribed()).toBe(true);
    });

    it('leaves a failed send alone — it created no thread', () => {
      const msg = makeSubscribable();
      handleSentMessageImpl(makeCtx(), { message: msg, status: MessageStatus.error } as any);
      expect((msg as any).isThreadSubscribed()).toBe(false);
    });

    it('stamps even when the message is for another conversation', () => {
      // The author is subscribed whichever list happens to observe the send.
      const msg = makeSubscribable();
      handleSentMessageImpl(
        makeCtx({ isMessageForCurrentConversation: vi.fn().mockReturnValue(false) }),
        { message: msg, status: MessageStatus.success } as any
      );
      expect((msg as any).isThreadSubscribed()).toBe(true);
    });

    it('is a no-op on a Chat SDK without the thread flag', () => {
      const msg = makeTextMessage();
      expect(() =>
        handleSentMessageImpl(makeCtx(), { message: msg, status: MessageStatus.success } as any)
      ).not.toThrow();
    });

    it('should handle thread reply for current conversation when parentMessageId is set', () => {
      const msg = makeTextMessage(1);
      (msg as any).getParentMessageId = () => 99;
      const ctx = makeCtx({
        parentMessageId: null,
        isAgentChatMode: false,
        isThreadReplyForCurrentConversation: vi.fn().mockReturnValue(true),
      });
      handleSentMessageImpl(ctx, { message: msg, status: MessageStatus.success });
      // Should update reply count, not add message
      expect(ctx.addMessage).not.toHaveBeenCalled();
    });
  });

  // ==================== agent chat: a confirmed send the list doesn't show ====================

  describe('a confirmed send the agent chat list does not show', () => {
    /** A sent reply in the thread under `parent`, not in the list (its in-progress event went elsewhere). */
    function reply(parent: number | null, id = 900) {
      const msg = makeTextMessage(id);
      (msg as any).getParentMessageId = () => parent;
      return msg;
    }
    const agentCtx = (overrides: Record<string, any> = {}) => makeCtx({ isAgentChatMode: true, ...overrides });

    it('is not added to a new chat when it belongs to the previous conversation', () => {
      // Sent in the thread under 555, then New Chat before the send returned.
      const ctx = agentCtx({ parentMessageId: null });
      handleSentMessageImpl(ctx, { message: reply(555), status: MessageStatus.success });
      expect(ctx.addMessage).not.toHaveBeenCalled();
    });

    it("is added when its parent is the list's parent", () => {
      const ctx = agentCtx({ parentMessageId: 555 });
      const msg = reply(555);
      handleSentMessageImpl(ctx, { message: msg, status: MessageStatus.success });
      expect(ctx.addMessage).toHaveBeenCalledWith(msg);
    });

    it('is added when its parent is a message the list shows (a new chat after its first message)', () => {
      const ctx = agentCtx({ parentMessageId: null });
      ctx.messageIdMap.set('777', makeTextMessage(777));
      const msg = reply(777);
      handleSentMessageImpl(ctx, { message: msg, status: MessageStatus.success });
      expect(ctx.addMessage).toHaveBeenCalledWith(msg);
    });

    it('is not added when it has no thread, as before the lost-event fallback', () => {
      const ctx = agentCtx({ parentMessageId: null });
      handleSentMessageImpl(ctx, { message: reply(null), status: MessageStatus.success });
      expect(ctx.addMessage).not.toHaveBeenCalled();
    });

    it('is still added outside agent chat, where the conversation check decides', () => {
      const ctx = makeCtx({ parentMessageId: 555 });
      const msg = reply(555);
      handleSentMessageImpl(ctx, { message: msg, status: MessageStatus.success });
      expect(ctx.addMessage).toHaveBeenCalledWith(msg);
    });
  });

  // ==================== failed sends (ENG-39942) ====================

  describe('a failed send', () => {
    /** The pending message as the list holds it after the in-progress event. */
    function pendingInList(ctx: ReturnType<typeof makeCtx>, muid = 'pending-1') {
      const pending = makeTextMessage(0, muid);
      (pending as any).getId = () => undefined;
      ctx.messageMuidMap.set(muid, pending);
      return pending;
    }

    it('reaches the bubble even though the SDK cleared its receiver ID', () => {
      // On a failed send the SDK leaves the message without a receiver ID, so the conversation
      // check rejects it; the muid this list holds still identifies it.
      const ctx = makeCtx({ isMessageForCurrentConversation: vi.fn().mockReturnValue(false) });
      const pending = pendingInList(ctx);
      (pending as any).error = { code: 'ERR_X' };

      handleSentMessageImpl(ctx, { message: pending, status: MessageStatus.error });

      expect(ctx.updateMessageByMuid).toHaveBeenCalledTimes(1);
      const [muid, shown] = ctx.updateMessageByMuid.mock.calls[0];
      expect(muid).toBe('pending-1');
      expect((shown as any).error).toEqual({ code: 'ERR_X' });
    });

    it('hands the list a new object, so the OnPush bubble re-renders with its error tick', () => {
      const ctx = makeCtx();
      const pending = pendingInList(ctx);

      handleSentMessageImpl(ctx, { message: pending, status: MessageStatus.error });

      const shown = ctx.updateMessageByMuid.mock.calls[0][1];
      expect(shown).not.toBe(pending);
      expect(Object.getPrototypeOf(shown)).toBe(Object.getPrototypeOf(pending));
      expect(shown.getMuid()).toBe('pending-1');
    });

    it('still ignores a failed send for a message this list never showed', () => {
      const ctx = makeCtx({ isMessageForCurrentConversation: vi.fn().mockReturnValue(false) });
      const elsewhere = makeTextMessage(0, 'other-chat');

      handleSentMessageImpl(ctx, { message: elsewhere, status: MessageStatus.error });

      expect(ctx.updateMessageByMuid).not.toHaveBeenCalled();
      expect(ctx.updateMessageById).not.toHaveBeenCalled();
    });

    it('is applied from the queue after loading, even with the receiver ID cleared', () => {
      const ctx = makeCtx({ loadingStateSignal: vi.fn().mockReturnValue(true) });
      const pending = pendingInList(ctx, 'queued-1');
      handleSentMessageImpl(ctx, { message: pending, status: MessageStatus.error });
      expect(ctx.updateMessageByMuid).not.toHaveBeenCalled();

      ctx.isMessageForCurrentConversation.mockReturnValue(false);
      flushPendingSentMessages(ctx);

      expect(ctx.updateMessageByMuid).toHaveBeenCalledWith('queued-1', expect.anything());
    });
  });

  // ==================== updateSentMessageByMuidImpl ====================

  describe('updateSentMessageByMuidImpl', () => {
    it('should call updateMessageByMuid when MUID exists in map', () => {
      const ctx = makeCtx();
      const msg = makeTextMessage(1, 'test-muid');
      const existingMsg = makeTextMessage(1, 'test-muid');
      ctx.messageMuidMap.set('test-muid', existingMsg);
      updateSentMessageByMuidImpl(ctx, msg);
      expect(ctx.updateMessageByMuid).toHaveBeenCalledWith('test-muid', msg);
    });

    it('should call updateMessageById when MUID not in map but ID exists', () => {
      const ctx = makeCtx();
      const msg = makeTextMessage(42, 'unknown-muid');
      updateSentMessageByMuidImpl(ctx, msg);
      expect(ctx.updateMessageById).toHaveBeenCalledWith(42, msg);
    });

    it('should call updateMessageById when getMuid returns null', () => {
      const ctx = makeCtx();
      const msg = makeTextMessage(10);
      (msg as any).getMuid = () => null;
      updateSentMessageByMuidImpl(ctx, msg);
      expect(ctx.updateMessageById).toHaveBeenCalledWith(10, msg);
    });

    it('should not call updateMessageById when no MUID and no ID', () => {
      const ctx = makeCtx();
      const msg = makeTextMessage(0);
      (msg as any).getMuid = () => null;
      (msg as any).getId = () => 0;
      updateSentMessageByMuidImpl(ctx, msg);
      // id=0 is falsy, so updateMessageById should not be called
      expect(ctx.updateMessageById).not.toHaveBeenCalled();
    });
  });

  // ==================== updateSentMessageReplyCountImpl ====================

  describe('updateSentMessageReplyCountImpl', () => {
    it('should return early when message has no parentMessageId', () => {
      const ctx = makeCtx();
      const msg = makeTextMessage(1);
      (msg as any).getParentMessageId = () => null;
      updateSentMessageReplyCountImpl(ctx, msg);
      expect(ctx.updateMessageById).not.toHaveBeenCalled();
    });

    it('should return early when parent message not found in map', () => {
      const ctx = makeCtx();
      const msg = makeTextMessage(1);
      (msg as any).getParentMessageId = () => 99;
      updateSentMessageReplyCountImpl(ctx, msg);
      expect(ctx.updateMessageById).not.toHaveBeenCalled();
    });

    it('should increment reply count on parent message', () => {
      const ctx = makeCtx();
      const parentMsg = makeTextMessage(99);
      // Provide a real-ish parent with getReplyCount/setReplyCount
      let replyCount = 2;
      (parentMsg as any).getReplyCount = () => replyCount;
      (parentMsg as any).setReplyCount = (v: number) => { replyCount = v; };
      ctx.messageIdMap.set('99', parentMsg);
      ctx.normalizeMessageId = vi.fn().mockReturnValue('99');

      const msg = makeTextMessage(1);
      (msg as any).getParentMessageId = () => 99;

      updateSentMessageReplyCountImpl(ctx, msg);
      // updateMessageById should be called with the parent ID
      expect(ctx.updateMessageById).toHaveBeenCalledWith(99, expect.anything());
    });
  });

  // ==================== handleEditedMessageImpl ====================

  describe('handleEditedMessageImpl', () => {
    it('should call updateMessageById with the edited message', () => {
      const ctx = makeCtx();
      const msg = makeTextMessage(5);
      handleEditedMessageImpl(ctx, msg);
      expect(ctx.updateMessageById).toHaveBeenCalledWith(5, msg);
    });

    it('should return early when message is not for current conversation', () => {
      const ctx = makeCtx({ isMessageForCurrentConversation: vi.fn().mockReturnValue(false) });
      const msg = makeTextMessage(5);
      handleEditedMessageImpl(ctx, msg);
      expect(ctx.updateMessageById).not.toHaveBeenCalled();
    });

    it('should emit onMessageEdited event', () => {
      const ctx = makeCtx();
      const msg = makeTextMessage(5);
      const spy = vi.fn();
      const sub = CometChatMessageEvents.onMessageEdited.subscribe(spy);
      handleEditedMessageImpl(ctx, msg);
      expect(spy).toHaveBeenCalledWith(msg);
      sub.unsubscribe();
    });
  });

  // ==================== flushPendingSentMessages ====================

  describe('flushPendingSentMessages', () => {
    it('should do nothing when no pending messages', () => {
      const ctx = makeCtx();
      flushPendingSentMessages(ctx);
      expect(ctx.addMessage).not.toHaveBeenCalled();
    });

    it('should process queued inprogress messages after loading', () => {
      const ctx = makeCtx({ loadingStateSignal: vi.fn().mockReturnValue(true) });
      const msg = makeTextMessage(1);
      // Queue a message while loading
      handleSentMessageImpl(ctx, { message: msg, status: MessageStatus.inprogress });
      expect(ctx.addMessage).not.toHaveBeenCalled();

      // Now flush
      ctx.loadingStateSignal = vi.fn().mockReturnValue(false);
      flushPendingSentMessages(ctx);
      expect(ctx.addMessage).toHaveBeenCalledWith(msg);
    });

    it('should skip inprogress messages already in the list by MUID', () => {
      const ctx = makeCtx({ loadingStateSignal: vi.fn().mockReturnValue(true) });
      const msg = makeTextMessage(1, 'existing-muid');
      handleSentMessageImpl(ctx, { message: msg, status: MessageStatus.inprogress });

      // Simulate message already fetched from server
      ctx.messageMuidMap.set('existing-muid', msg);
      flushPendingSentMessages(ctx);
      expect(ctx.addMessage).not.toHaveBeenCalled();
    });

    it('should process success messages from queue', () => {
      const ctx = makeCtx({ loadingStateSignal: vi.fn().mockReturnValue(true) });
      const msg = makeTextMessage(1);
      handleSentMessageImpl(ctx, { message: msg, status: MessageStatus.success });
      flushPendingSentMessages(ctx);
      expect(ctx.addMessage).toHaveBeenCalledWith(msg);
    });

    /** A context showing a 1:1 chat with `uid`. */
    const chatWith = (uid: string) => ({ getUid: () => uid });

    it('replays a message queued for this chat even after the SDK cleared its receiver ID (ENG-39944)', () => {
      const ctx = makeCtx({ loadingStateSignal: vi.fn().mockReturnValue(true), currentUser: chatWith('bob') });
      const msg = makeTextMessage(0, 'pending-1');
      handleSentMessageImpl(ctx, { message: msg, status: MessageStatus.inprogress });

      // While the send is in flight the SDK clears the receiver, so the check now says no.
      ctx.isMessageForCurrentConversation = vi.fn().mockReturnValue(false);
      flushPendingSentMessages(ctx);

      expect(ctx.addMessage).toHaveBeenCalledWith(msg);
    });

    it('does not replay a queued message into another chat opened while loading', () => {
      const ctx = makeCtx({ loadingStateSignal: vi.fn().mockReturnValue(true), currentUser: chatWith('bob') });
      handleSentMessageImpl(ctx, { message: makeTextMessage(1), status: MessageStatus.inprogress });

      ctx.currentUser = chatWith('carol');
      flushPendingSentMessages(ctx);

      expect(ctx.addMessage).not.toHaveBeenCalled();
    });
  });

  // ==================== setupSentMessageListenerImpl ====================

  describe('setupSentMessageListenerImpl', () => {
    it('should subscribe to ccMessageSent and store subscription', () => {
      const ctx = makeCtx();
      setupSentMessageListenerImpl(ctx);
      expect(ctx.ccMessageSentSubscription).toBeDefined();
      ctx.ccMessageSentSubscription?.unsubscribe();
    });

    it('should call handleSentMessageImpl when ccMessageSent fires', () => {
      const ctx = makeCtx();
      setupSentMessageListenerImpl(ctx);
      const msg = makeTextMessage(1);
      CometChatMessageEvents.ccMessageSent.next({ message: msg, status: MessageStatus.inprogress });
      expect(ctx.addMessage).toHaveBeenCalledWith(msg);
      ctx.ccMessageSentSubscription?.unsubscribe();
    });
  });

  // ==================== setupEditedMessageListenerImpl ====================

  describe('setupEditedMessageListenerImpl', () => {
    it('should subscribe to ccMessageEdited and store subscription', () => {
      const ctx = makeCtx();
      setupEditedMessageListenerImpl(ctx);
      expect(ctx.ccMessageEditedSubscription).toBeDefined();
      ctx.ccMessageEditedSubscription?.unsubscribe();
    });

    it('should call handleEditedMessageImpl when ccMessageEdited fires with success', () => {
      const ctx = makeCtx();
      setupEditedMessageListenerImpl(ctx);
      const msg = makeTextMessage(5);
      CometChatMessageEvents.ccMessageEdited.next({ message: msg, status: MessageStatus.success });
      expect(ctx.updateMessageById).toHaveBeenCalledWith(5, msg);
      ctx.ccMessageEditedSubscription?.unsubscribe();
    });

    it('should not call handleEditedMessageImpl for non-success status', () => {
      const ctx = makeCtx();
      setupEditedMessageListenerImpl(ctx);
      const msg = makeTextMessage(5);
      CometChatMessageEvents.ccMessageEdited.next({ message: msg, status: MessageStatus.inprogress });
      expect(ctx.updateMessageById).not.toHaveBeenCalled();
      ctx.ccMessageEditedSubscription?.unsubscribe();
    });
  });
});
