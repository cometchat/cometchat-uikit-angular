/**
 * message-list.listeners Tests
 *
 * Covers: setupMessageListener, setupGroupListener, setupCallListener,
 *         setupConnectionListener — verifies SDK listener registration,
 *         callback routing, and error isolation.
 *
 * @module services/message-list.listeners
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NgZone } from '@angular/core';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import {
  setupMessageListener,
  setupGroupListener,
  setupCallListener,
  setupConnectionListener,
  MessageListListenerHost,
} from './message-list.listeners';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeHost(): MessageListListenerHost {
  return {
    getMessageListenerId: vi.fn().mockReturnValue('msg-listener-id'),
    getGroupListenerId: vi.fn().mockReturnValue('group-listener-id'),
    getCallListenerId: vi.fn().mockReturnValue('call-listener-id'),
    getConnectionListenerId: vi.fn().mockReturnValue('conn-listener-id'),
    handleNewMessage: vi.fn(),
    handleMessageEdited: vi.fn(),
    handleMessageDeleted: vi.fn(),
    handleReceipt: vi.fn(),
    handleReactionEvent: vi.fn(),
    handleGroupAction: vi.fn(),
    handleCallAction: vi.fn(),
    handleReconnection: vi.fn().mockResolvedValue(undefined),
    getMessageById: vi.fn().mockReturnValue(undefined),
    updateMessageById: vi.fn().mockReturnValue(false),
    addMessage: vi.fn(),
    setConnectionStatus: vi.fn(),
  };
}

function makeNgZone(): NgZone {
  return { run: vi.fn((fn: () => any) => fn()) } as unknown as NgZone;
}

// Capture the listener registered with CometChat
function captureMessageListener(): CometChat.MessageListener {
  const calls = vi.mocked(CometChat.addMessageListener).mock.calls;
  const lastCall = calls[calls.length - 1];
  return lastCall[1] as CometChat.MessageListener;
}

function captureGroupListener(): CometChat.GroupListener {
  const calls = vi.mocked(CometChat.addGroupListener).mock.calls;
  const lastCall = calls[calls.length - 1];
  return lastCall[1] as CometChat.GroupListener;
}

function captureCallListener(): CometChat.CallListener {
  const calls = vi.mocked(CometChat.addCallListener).mock.calls;
  const lastCall = calls[calls.length - 1];
  return lastCall[1] as CometChat.CallListener;
}

function captureConnectionListener(): CometChat.ConnectionListener {
  const calls = vi.mocked(CometChat.addConnectionListener).mock.calls;
  const lastCall = calls[calls.length - 1];
  return lastCall[1] as CometChat.ConnectionListener;
}

function makeTextMessage(): CometChat.TextMessage {
  return new CometChat.TextMessage('r1', 'Hello', CometChat.RECEIVER_TYPE.USER);
}

function makeGroup(): CometChat.Group {
  return new CometChat.Group('g1', 'Group 1', CometChat.GROUP_TYPE.PUBLIC, '');
}

function makeUser(): CometChat.User {
  const u = new CometChat.User('u1');
  u.setName('User 1');
  return u;
}

describe('message-list.listeners', () => {

  beforeEach(() => {
    vi.mocked(CometChat.addMessageListener).mockClear();
    vi.mocked(CometChat.addGroupListener).mockClear();
    vi.mocked(CometChat.addCallListener).mockClear();
    vi.mocked(CometChat.addConnectionListener).mockClear();
    vi.mocked(CometChat.removeConnectionListener).mockClear();
  });

  // ==================== setupMessageListener ====================

  describe('setupMessageListener', () => {
    it('should call CometChat.addMessageListener with the host listener ID', () => {
      const host = makeHost();
      const zone = makeNgZone();
      setupMessageListener(host, zone);
      expect(CometChat.addMessageListener).toHaveBeenCalledWith('msg-listener-id', expect.any(Object));
    });

    it('should route onTextMessageReceived to handleNewMessage', () => {
      const host = makeHost();
      setupMessageListener(host, makeNgZone());
      const listener = captureMessageListener();
      const msg = makeTextMessage();
      (listener as any).onTextMessageReceived(msg);
      expect(host.handleNewMessage).toHaveBeenCalledWith(msg);
    });

    it('should route onMediaMessageReceived to handleNewMessage', () => {
      const host = makeHost();
      setupMessageListener(host, makeNgZone());
      const listener = captureMessageListener();
      const msg = new CometChat.MediaMessage('r1', {} as File, 'image', CometChat.RECEIVER_TYPE.USER);
      (listener as any).onMediaMessageReceived(msg);
      expect(host.handleNewMessage).toHaveBeenCalledWith(msg);
    });

    it('should route onCustomMessageReceived to handleNewMessage', () => {
      const host = makeHost();
      setupMessageListener(host, makeNgZone());
      const listener = captureMessageListener();
      const msg = new CometChat.CustomMessage('r1', CometChat.RECEIVER_TYPE.USER, 'custom', {});
      (listener as any).onCustomMessageReceived(msg);
      expect(host.handleNewMessage).toHaveBeenCalledWith(msg);
    });

    it('should route onMessageEdited to handleMessageEdited', () => {
      const host = makeHost();
      setupMessageListener(host, makeNgZone());
      const listener = captureMessageListener();
      const msg = makeTextMessage();
      (listener as any).onMessageEdited(msg);
      expect(host.handleMessageEdited).toHaveBeenCalledWith(msg);
    });

    it('should route onMessageDeleted to handleMessageDeleted', () => {
      const host = makeHost();
      setupMessageListener(host, makeNgZone());
      const listener = captureMessageListener();
      const msg = makeTextMessage();
      (listener as any).onMessageDeleted(msg);
      expect(host.handleMessageDeleted).toHaveBeenCalledWith(msg);
    });

    it('should route onMessagesDelivered to handleReceipt with isGroupReceipt=false', () => {
      const host = makeHost();
      const zone = makeNgZone();
      setupMessageListener(host, zone);
      const listener = captureMessageListener();
      const receipt = new CometChat.MessageReceipt();
      (listener as any).onMessagesDelivered(receipt);
      expect(host.handleReceipt).toHaveBeenCalledWith(receipt, false);
    });

    it('should route onMessagesRead to handleReceipt with isGroupReceipt=false', () => {
      const host = makeHost();
      const zone = makeNgZone();
      setupMessageListener(host, zone);
      const listener = captureMessageListener();
      const receipt = new CometChat.MessageReceipt();
      (listener as any).onMessagesRead(receipt);
      expect(host.handleReceipt).toHaveBeenCalledWith(receipt, false);
    });

    it('should route onMessagesDeliveredToAll to handleReceipt with isGroupReceipt=true', () => {
      const host = makeHost();
      const zone = makeNgZone();
      setupMessageListener(host, zone);
      const listener = captureMessageListener();
      const receipt = new CometChat.MessageReceipt();
      (listener as any).onMessagesDeliveredToAll(receipt);
      expect(host.handleReceipt).toHaveBeenCalledWith(receipt, true);
    });

    it('should route onMessagesReadByAll to handleReceipt with isGroupReceipt=true', () => {
      const host = makeHost();
      const zone = makeNgZone();
      setupMessageListener(host, zone);
      const listener = captureMessageListener();
      const receipt = new CometChat.MessageReceipt();
      (listener as any).onMessagesReadByAll(receipt);
      expect(host.handleReceipt).toHaveBeenCalledWith(receipt, true);
    });

    it('should route onMessageReactionAdded to handleReactionEvent with added', () => {
      const host = makeHost();
      setupMessageListener(host, makeNgZone());
      const listener = captureMessageListener();
      const event = new CometChat.ReactionEvent();
      (listener as any).onMessageReactionAdded(event);
      expect(host.handleReactionEvent).toHaveBeenCalledWith(event, 'added');
    });

    it('should route onMessageReactionRemoved to handleReactionEvent with removed', () => {
      const host = makeHost();
      setupMessageListener(host, makeNgZone());
      const listener = captureMessageListener();
      const event = new CometChat.ReactionEvent();
      (listener as any).onMessageReactionRemoved(event);
      expect(host.handleReactionEvent).toHaveBeenCalledWith(event, 'removed');
    });

    it('should not throw when handleNewMessage throws (error isolation)', () => {
      const host = makeHost();
      (host.handleNewMessage as any).mockImplementation(() => { throw new Error('handler error'); });
      setupMessageListener(host, makeNgZone());
      const listener = captureMessageListener();
      expect(() => (listener as any).onTextMessageReceived(makeTextMessage())).not.toThrow();
    });

    it('should not throw when handleMessageEdited throws (error isolation)', () => {
      const host = makeHost();
      (host.handleMessageEdited as any).mockImplementation(() => { throw new Error('edit error'); });
      setupMessageListener(host, makeNgZone());
      const listener = captureMessageListener();
      expect(() => (listener as any).onMessageEdited(makeTextMessage())).not.toThrow();
    });

    it('should route onAIAssistantMessageReceived to handleNewMessage', () => {
      const host = makeHost();
      setupMessageListener(host, makeNgZone());
      const listener = captureMessageListener();
      const msg = makeTextMessage();
      (listener as any).onAIAssistantMessageReceived(msg);
      expect(host.handleNewMessage).toHaveBeenCalledWith(msg);
    });
  });

  // ==================== setupGroupListener ====================

  describe('setupGroupListener', () => {
    it('should call CometChat.addGroupListener with the host group listener ID', () => {
      const host = makeHost();
      setupGroupListener(host);
      expect(CometChat.addGroupListener).toHaveBeenCalledWith('group-listener-id', expect.any(Object));
    });

    it('should route onGroupMemberJoined to handleGroupAction', () => {
      const host = makeHost();
      setupGroupListener(host);
      const listener = captureGroupListener();
      const action = {} as CometChat.Action;
      const group = makeGroup();
      (listener as any).onGroupMemberJoined(action, makeUser(), group);
      expect(host.handleGroupAction).toHaveBeenCalledWith(action, group);
    });

    it('should route onGroupMemberLeft to handleGroupAction', () => {
      const host = makeHost();
      setupGroupListener(host);
      const listener = captureGroupListener();
      const action = {} as CometChat.Action;
      const group = makeGroup();
      (listener as any).onGroupMemberLeft(action, makeUser(), group);
      expect(host.handleGroupAction).toHaveBeenCalledWith(action, group);
    });

    it('should route onGroupMemberKicked to handleGroupAction', () => {
      const host = makeHost();
      setupGroupListener(host);
      const listener = captureGroupListener();
      const action = {} as CometChat.Action;
      const group = makeGroup();
      (listener as any).onGroupMemberKicked(action, makeUser(), makeUser(), group);
      expect(host.handleGroupAction).toHaveBeenCalledWith(action, group);
    });

    it('should route onGroupMemberBanned to handleGroupAction', () => {
      const host = makeHost();
      setupGroupListener(host);
      const listener = captureGroupListener();
      const action = {} as CometChat.Action;
      const group = makeGroup();
      (listener as any).onGroupMemberBanned(action, makeUser(), makeUser(), group);
      expect(host.handleGroupAction).toHaveBeenCalledWith(action, group);
    });

    it('should route onGroupMemberScopeChanged to handleGroupAction', () => {
      const host = makeHost();
      setupGroupListener(host);
      const listener = captureGroupListener();
      const action = {} as CometChat.Action;
      const group = makeGroup();
      (listener as any).onGroupMemberScopeChanged(action, makeUser(), 'admin', 'participant', group);
      expect(host.handleGroupAction).toHaveBeenCalledWith(action, group);
    });

    it('should not throw when handleGroupAction throws (error isolation)', () => {
      const host = makeHost();
      (host.handleGroupAction as any).mockImplementation(() => { throw new Error('group error'); });
      setupGroupListener(host);
      const listener = captureGroupListener();
      expect(() => (listener as any).onGroupMemberJoined({} as CometChat.Action, makeUser(), makeGroup())).not.toThrow();
    });
  });

  // ==================== setupCallListener ====================

  describe('setupCallListener', () => {
    it('should call CometChat.addCallListener with the host call listener ID', () => {
      const host = makeHost();
      setupCallListener(host);
      expect(CometChat.addCallListener).toHaveBeenCalledWith('call-listener-id', expect.any(Object));
    });

    it('should route onIncomingCallReceived to handleCallAction', () => {
      const host = makeHost();
      setupCallListener(host);
      const listener = captureCallListener();
      const call = {} as CometChat.Call;
      (listener as any).onIncomingCallReceived(call);
      expect(host.handleCallAction).toHaveBeenCalledWith(call);
    });

    it('should route onIncomingCallCancelled to handleCallAction', () => {
      const host = makeHost();
      setupCallListener(host);
      const listener = captureCallListener();
      const call = {} as CometChat.Call;
      (listener as any).onIncomingCallCancelled(call);
      expect(host.handleCallAction).toHaveBeenCalledWith(call);
    });

    it('should route onOutgoingCallRejected to handleCallAction', () => {
      const host = makeHost();
      setupCallListener(host);
      const listener = captureCallListener();
      const call = {} as CometChat.Call;
      (listener as any).onOutgoingCallRejected(call);
      expect(host.handleCallAction).toHaveBeenCalledWith(call);
    });

    it('should route onCallEndedMessageReceived to handleCallAction', () => {
      const host = makeHost();
      setupCallListener(host);
      const listener = captureCallListener();
      const call = {} as CometChat.Call;
      (listener as any).onCallEndedMessageReceived(call);
      expect(host.handleCallAction).toHaveBeenCalledWith(call);
    });

    it('should not throw when handleCallAction throws (error isolation)', () => {
      const host = makeHost();
      (host.handleCallAction as any).mockImplementation(() => { throw new Error('call error'); });
      setupCallListener(host);
      const listener = captureCallListener();
      expect(() => (listener as any).onIncomingCallReceived({} as CometChat.Call)).not.toThrow();
    });
  });

  // ==================== setupConnectionListener ====================

  describe('setupConnectionListener', () => {
    it('should call removeConnectionListener before adding', () => {
      const host = makeHost();
      setupConnectionListener(host, 'conn-id');
      expect(CometChat.removeConnectionListener).toHaveBeenCalledWith('conn-id');
      expect(CometChat.addConnectionListener).toHaveBeenCalledWith('conn-id', expect.any(Object));
    });

    it('should call setConnectionStatus(connected) and handleReconnection on onConnected', () => {
      const host = makeHost();
      setupConnectionListener(host, 'conn-id');
      const listener = captureConnectionListener();
      (listener as any).onConnected();
      expect(host.setConnectionStatus).toHaveBeenCalledWith('connected');
      expect(host.handleReconnection).toHaveBeenCalled();
    });

    it('should call setConnectionStatus(disconnected) on onDisconnected', () => {
      const host = makeHost();
      setupConnectionListener(host, 'conn-id');
      const listener = captureConnectionListener();
      (listener as any).onDisconnected();
      expect(host.setConnectionStatus).toHaveBeenCalledWith('disconnected');
    });

    it('should not throw when setConnectionStatus throws (error isolation)', () => {
      const host = makeHost();
      (host.setConnectionStatus as any).mockImplementation(() => { throw new Error('status error'); });
      setupConnectionListener(host, 'conn-id');
      const listener = captureConnectionListener();
      expect(() => (listener as any).onConnected()).not.toThrow();
    });
  });
});
