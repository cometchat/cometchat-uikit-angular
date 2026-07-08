/**
 * ChatSdkEventInitializer Tests
 *
 * Covers: attachListeners, detachListeners, and all message event routing
 * through the listener object to CometChatMessageEvents subjects.
 *
 * @module utils/ChatSdkEventInitializer
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { ChatSdkEventInitializer } from './ChatSdkEventInitializer';
import { CometChatMessageEvents } from '../events/CometChatMessageEvents';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function captureMessageListener(): CometChat.MessageListener {
  const calls = vi.mocked(CometChat.addMessageListener).mock.calls;
  return calls[calls.length - 1][1] as CometChat.MessageListener;
}

describe('ChatSdkEventInitializer', () => {

  beforeEach(() => {
    vi.mocked(CometChat.addMessageListener).mockClear();
    vi.mocked(CometChat.removeMessageListener).mockClear();
  });

  // ==================== attachListeners ====================

  describe('attachListeners', () => {
    it('should call CometChat.addMessageListener', () => {
      ChatSdkEventInitializer.attachListeners();
      expect(CometChat.addMessageListener).toHaveBeenCalledTimes(1);
    });

    it('should register with a string listener ID', () => {
      ChatSdkEventInitializer.attachListeners();
      const calls = vi.mocked(CometChat.addMessageListener).mock.calls;
      expect(typeof calls[0][0]).toBe('string');
    });
  });

  // ==================== detachListeners ====================

  describe('detachListeners', () => {
    it('should call CometChat.removeMessageListener', () => {
      ChatSdkEventInitializer.detachListeners();
      expect(CometChat.removeMessageListener).toHaveBeenCalledTimes(1);
    });

    it('should use the same listener ID as attachListeners', () => {
      ChatSdkEventInitializer.attachListeners();
      const attachId = vi.mocked(CometChat.addMessageListener).mock.calls[0][0];
      ChatSdkEventInitializer.detachListeners();
      const detachId = vi.mocked(CometChat.removeMessageListener).mock.calls[0][0];
      expect(attachId).toBe(detachId);
    });
  });

  // ==================== Message event routing ====================

  describe('Message event routing', () => {
    beforeEach(() => {
      ChatSdkEventInitializer.attachListeners();
    });

    it('should forward onTextMessageReceived to CometChatMessageEvents', () => {
      const listener = captureMessageListener();
      const spy = vi.fn();
      const sub = CometChatMessageEvents.onTextMessageReceived.subscribe(spy);
      const msg = new CometChat.TextMessage('r1', 'Hello', CometChat.RECEIVER_TYPE.USER);
      (listener as any).onTextMessageReceived(msg);
      expect(spy).toHaveBeenCalledWith(msg);
      sub.unsubscribe();
    });

    it('should forward onMediaMessageReceived to CometChatMessageEvents', () => {
      const listener = captureMessageListener();
      const spy = vi.fn();
      const sub = CometChatMessageEvents.onMediaMessageReceived.subscribe(spy);
      const msg = new CometChat.MediaMessage('r1', {} as File, 'image', CometChat.RECEIVER_TYPE.USER);
      (listener as any).onMediaMessageReceived(msg);
      expect(spy).toHaveBeenCalledWith(msg);
      sub.unsubscribe();
    });

    it('should forward onCustomMessageReceived to CometChatMessageEvents', () => {
      const listener = captureMessageListener();
      const spy = vi.fn();
      const sub = CometChatMessageEvents.onCustomMessageReceived.subscribe(spy);
      const msg = new CometChat.CustomMessage('r1', CometChat.RECEIVER_TYPE.USER, 'custom', {});
      (listener as any).onCustomMessageReceived(msg);
      expect(spy).toHaveBeenCalledWith(msg);
      sub.unsubscribe();
    });

    it('should forward onMessageEdited to CometChatMessageEvents', () => {
      const listener = captureMessageListener();
      const spy = vi.fn();
      const sub = CometChatMessageEvents.onMessageEdited.subscribe(spy);
      const msg = new CometChat.TextMessage('r1', 'Edited', CometChat.RECEIVER_TYPE.USER);
      (listener as any).onMessageEdited(msg);
      expect(spy).toHaveBeenCalledWith(msg);
      sub.unsubscribe();
    });

    it('should forward onMessageDeleted to CometChatMessageEvents', () => {
      const listener = captureMessageListener();
      const spy = vi.fn();
      const sub = CometChatMessageEvents.onMessageDeleted.subscribe(spy);
      const msg = new CometChat.TextMessage('r1', 'Deleted', CometChat.RECEIVER_TYPE.USER);
      (listener as any).onMessageDeleted(msg);
      expect(spy).toHaveBeenCalledWith(msg);
      sub.unsubscribe();
    });

    it('should forward onMessagesDelivered to CometChatMessageEvents', () => {
      const listener = captureMessageListener();
      const spy = vi.fn();
      const sub = CometChatMessageEvents.onMessagesDelivered.subscribe(spy);
      const receipt = new CometChat.MessageReceipt();
      (listener as any).onMessagesDelivered(receipt);
      expect(spy).toHaveBeenCalledWith(receipt);
      sub.unsubscribe();
    });

    it('should forward onMessagesRead to CometChatMessageEvents', () => {
      const listener = captureMessageListener();
      const spy = vi.fn();
      const sub = CometChatMessageEvents.onMessagesRead.subscribe(spy);
      const receipt = new CometChat.MessageReceipt();
      (listener as any).onMessagesRead(receipt);
      expect(spy).toHaveBeenCalledWith(receipt);
      sub.unsubscribe();
    });

    it('should forward onMessagesDeliveredToAll to CometChatMessageEvents', () => {
      const listener = captureMessageListener();
      const spy = vi.fn();
      const sub = CometChatMessageEvents.onMessagesDeliveredToAll.subscribe(spy);
      const receipt = new CometChat.MessageReceipt();
      (listener as any).onMessagesDeliveredToAll(receipt);
      expect(spy).toHaveBeenCalledWith(receipt);
      sub.unsubscribe();
    });

    it('should forward onMessagesReadByAll to CometChatMessageEvents', () => {
      const listener = captureMessageListener();
      const spy = vi.fn();
      const sub = CometChatMessageEvents.onMessagesReadByAll.subscribe(spy);
      const receipt = new CometChat.MessageReceipt();
      (listener as any).onMessagesReadByAll(receipt);
      expect(spy).toHaveBeenCalledWith(receipt);
      sub.unsubscribe();
    });

    it('should forward onMessageReactionAdded to CometChatMessageEvents', () => {
      const listener = captureMessageListener();
      const spy = vi.fn();
      const sub = CometChatMessageEvents.onMessageReactionAdded.subscribe(spy);
      const event = new CometChat.ReactionEvent();
      (listener as any).onMessageReactionAdded(event);
      expect(spy).toHaveBeenCalledWith(event);
      sub.unsubscribe();
    });

    it('should forward onMessageReactionRemoved to CometChatMessageEvents', () => {
      const listener = captureMessageListener();
      const spy = vi.fn();
      const sub = CometChatMessageEvents.onMessageReactionRemoved.subscribe(spy);
      const event = new CometChat.ReactionEvent();
      (listener as any).onMessageReactionRemoved(event);
      expect(spy).toHaveBeenCalledWith(event);
      sub.unsubscribe();
    });

    it('should forward onTypingStarted to CometChatMessageEvents', () => {
      const listener = captureMessageListener();
      const spy = vi.fn();
      const sub = CometChatMessageEvents.onTypingStarted.subscribe(spy);
      const indicator = new CometChat.TypingIndicator('r1', 'user');
      (listener as any).onTypingStarted(indicator);
      expect(spy).toHaveBeenCalledWith(indicator);
      sub.unsubscribe();
    });

    it('should forward onTypingEnded to CometChatMessageEvents', () => {
      const listener = captureMessageListener();
      const spy = vi.fn();
      const sub = CometChatMessageEvents.onTypingEnded.subscribe(spy);
      const indicator = new CometChat.TypingIndicator('r1', 'user');
      (listener as any).onTypingEnded(indicator);
      expect(spy).toHaveBeenCalledWith(indicator);
      sub.unsubscribe();
    });
  });
});
