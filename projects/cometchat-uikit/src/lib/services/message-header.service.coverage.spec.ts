/**
 * MessageHeaderService coverage tests
 *
 * The existing spec drives this service against a real SDK session, which
 * means the callbacks the service registers are handed to the SDK and nothing
 * ever invokes them: every private event handler, every listener catch block
 * and the user-status refresh never ran. Here the SDK listener module is
 * auto-mocked instead, so the test can capture those callbacks and fire them
 * the way the SDK would, leaving the service's own guards as the only thing
 * under test.
 *
 * Covers: state setters and their fallbacks, listener setup/teardown including
 *         the failure paths, the user-status / typing / group-member /
 *         connection handlers, and refreshUserStatus.
 *
 * @module services/message-header
 */

// The UI Kit pulls in the Calls SDK, which needs JitsiMeetJS at import time;
// jsdom has no such global.
vi.mock('@cometchat/calls-sdk-javascript', () => ({
  CometChatCalls: {
    init: vi.fn().mockResolvedValue(true),
    generateToken: vi.fn().mockResolvedValue({ token: 'mock-token' }),
  },
}));

// Auto-mock the SDK listener layer. This is what makes the service's own
// callbacks reachable: they are recorded as arguments instead of disappearing
// into the SDK, and registration can be made to fail on demand.
vi.mock('./message-header.listeners');

import { describe, it, expect, vi, beforeEach, afterEach, type MockInstance } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { CometChat } from '@cometchat/chat-sdk-javascript';

import { MessageHeaderService } from './message-header.service';
import { CometChatLogger } from '../utils/CometChatLogger';
import {
  addUserStatusListener,
  removeUserStatusListener,
  addTypingListener,
  removeTypingListener,
  addGroupMemberListener,
  removeGroupMemberListener,
  addConnectionListener,
  removeConnectionListener,
} from './message-header.listeners';

// ==================== Stub factories ====================

interface UserStubOptions {
  status?: string;
  lastActiveAt?: number;
  uidThrows?: boolean;
  statusThrows?: boolean;
}

/** A User with only the accessors the service actually calls. */
function userStub(uid: string, options: UserStubOptions = {}): CometChat.User {
  return {
    getUid: () => {
      if (options.uidThrows) throw new Error('uid unavailable');
      return uid;
    },
    getStatus: () => {
      if (options.statusThrows) throw new Error('status unavailable');
      return options.status;
    },
    getLastActiveAt: () => options.lastActiveAt,
  } as unknown as CometChat.User;
}

function groupStub(guid: string, membersCount?: number): CometChat.Group {
  return {
    getGuid: () => guid,
    getMembersCount: () => membersCount,
  } as unknown as CometChat.Group;
}

function typingStub(options: {
  receiverId?: string;
  receiverType?: string;
  sender?: CometChat.User | null;
}): CometChat.TypingIndicator {
  return {
    getReceiverId: () => options.receiverId,
    getReceiverType: () => options.receiverType,
    getSender: () => options.sender ?? null,
  } as unknown as CometChat.TypingIndicator;
}

/** A typing event the group branch of isTypingEventRelevant accepts. */
function groupTyping(guid: string, sender: CometChat.User | null): CometChat.TypingIndicator {
  return typingStub({
    receiverId: guid,
    receiverType: CometChat.RECEIVER_TYPE.GROUP,
    sender,
  });
}

/** A typing event the user branch accepts (relevance is sender-based there). */
function userTyping(senderUid: string): CometChat.TypingIndicator {
  return typingStub({
    receiverId: 'me',
    receiverType: CometChat.RECEIVER_TYPE.USER,
    sender: userStub(senderUid),
  });
}

// ==================== Captured callback accessors ====================

function statusCallbacks() {
  const calls = vi.mocked(addUserStatusListener).mock.calls;
  const [, onOnline, onOffline] = calls[calls.length - 1];
  return { onOnline, onOffline };
}

function typingCallbacks() {
  const calls = vi.mocked(addTypingListener).mock.calls;
  const [, onStarted, onEnded] = calls[calls.length - 1];
  return { onStarted, onEnded };
}

function memberCallbacks() {
  const calls = vi.mocked(addGroupMemberListener).mock.calls;
  return calls[calls.length - 1][1];
}

function connectionCallbacks() {
  const calls = vi.mocked(addConnectionListener).mock.calls;
  const [, onConnected, onDisconnected] = calls[calls.length - 1];
  return { onConnected, onDisconnected };
}

describe('MessageHeaderService (coverage)', () => {
  let service: MessageHeaderService;
  let errors: CometChat.CometChatException[];
  let errorLog: MockInstance;
  let getUserSpy: MockInstance;

  const action = {} as CometChat.Action;

  beforeEach(() => {
    // Auto-mocked exports keep any implementation installed by a previous
    // test, so clear them back to no-ops rather than just clearing calls.
    [
      addUserStatusListener,
      removeUserStatusListener,
      addTypingListener,
      removeTypingListener,
      addGroupMemberListener,
      removeGroupMemberListener,
      addConnectionListener,
      removeConnectionListener,
    ].forEach(fn => vi.mocked(fn).mockReset());

    // vi.spyOn hands back the existing spy when a method is already spied, so
    // the call history has to be cleared explicitly or it accumulates across
    // tests and a later "was it called" assertion passes on an earlier call.
    errorLog = vi.spyOn(CometChatLogger, 'error');
    errorLog.mockClear();
    errorLog.mockImplementation(() => undefined);

    // Always stubbed: a floating refreshUserStatus against the real SDK would
    // retry with exponential backoff well past the end of the test.
    getUserSpy = vi.spyOn(CometChat, 'getUser');
    getUserSpy.mockClear();
    getUserSpy.mockResolvedValue(userStub('u1', { status: 'online' }) as never);

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [MessageHeaderService] });
    service = TestBed.inject(MessageHeaderService);

    errors = [];
    service.setErrorCallback(error => errors.push(error));
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // ==================== Error plumbing ====================

  describe('error reporting', () => {
    it('reports a rejected setUser through the error callback as a CometChatException', () => {
      service.setUser(null as unknown as CometChat.User);

      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe('SERVICE_ERROR');
      expect(errors[0].message).toBe('Error setting user: User object is required');
      expect(service.user()).toBeNull();
    });

    it('still logs when no error callback is registered', () => {
      service.setErrorCallback(null);

      service.setGroup(null as unknown as CometChat.Group);

      expect(errors).toHaveLength(0);
      expect(errorLog).toHaveBeenCalledWith(
        'MessageHeaderService',
        'Error setting group:',
        expect.any(Error)
      );
    });
  });

  // ==================== State setters ====================

  describe('setUser / setGroup fallbacks', () => {
    it('falls back to offline and a null last-active when the user reports neither', () => {
      service.setUser(userStub('u1', { status: '', lastActiveAt: undefined }));

      expect(service.user()).not.toBeNull();
      expect(service.userStatus()).toBe('offline');
      expect(service.lastActiveAt()).toBeNull();
    });

    it('falls back to a zero member count when the group reports none', () => {
      service.setGroup(groupStub('g1', undefined));

      expect(service.group()).not.toBeNull();
      expect(service.groupMemberCount()).toBe(0);
    });

    it('keeps the reported status and last-active when the user has them', () => {
      service.setUser(userStub('u1', { status: 'online', lastActiveAt: 1710000000 }));

      expect(service.userStatus()).toBe('online');
      expect(service.lastActiveAt()).toBe(1710000000);
    });
  });

  describe('resetState', () => {
    it('abandons the reset and logs when clearing the typing map fails', () => {
      service.setGroup(groupStub('g1', 5));
      const broken = {
        clear: () => {
          throw new Error('map broken');
        },
      };
      (service as unknown as { typingUsersMap: unknown }).typingUsersMap = broken;

      service.resetState();

      expect(errorLog).toHaveBeenCalledWith(
        'MessageHeaderService',
        'Error resetting state:',
        expect.any(Error)
      );
      // Everything after the failing clear() is skipped, so the count that
      // reset would have zeroed is still there.
      expect(service.groupMemberCount()).toBe(5);
      expect(service.group()).toBeNull();
    });
  });

  // ==================== Listener setup ====================

  describe('setupListeners', () => {
    it('registers the user, typing and connection listeners for a user entity', () => {
      service.setupListeners('u1', 'user');

      expect(addUserStatusListener).toHaveBeenCalledTimes(1);
      expect(vi.mocked(addTypingListener).mock.calls[0][0]).toContain('message_header_message_');
      expect(addConnectionListener).toHaveBeenCalledTimes(1);
      expect(addGroupMemberListener).not.toHaveBeenCalled();
    });

    it('registers the group, typing and connection listeners for a group entity', () => {
      service.setupListeners('g1', 'group');

      expect(addGroupMemberListener).toHaveBeenCalledTimes(1);
      expect(addTypingListener).toHaveBeenCalledTimes(1);
      expect(addConnectionListener).toHaveBeenCalledTimes(1);
      expect(addUserStatusListener).not.toHaveBeenCalled();
    });

    it('rejects an empty entity id and registers nothing', () => {
      service.setupListeners('', 'user');

      expect(errors[0].message).toBe(
        'Error setting up listeners: Entity ID is required for setting up listeners'
      );
      expect(addUserStatusListener).not.toHaveBeenCalled();
      expect(addConnectionListener).not.toHaveBeenCalled();
    });

    it('rejects an empty user id for the status listener', () => {
      service.setupUserStatusListener('');

      expect(errors[0].message).toBe(
        'Error setting up user status listener: User ID is required for status listener'
      );
      expect(addUserStatusListener).not.toHaveBeenCalled();
    });

    it('rejects an empty entity id for the typing listener', () => {
      service.setupTypingListener('', 'group');

      expect(errors[0].message).toBe(
        'Error setting up typing listener: Entity ID is required for typing listener'
      );
      expect(addTypingListener).not.toHaveBeenCalled();
    });

    it('rejects an empty group id for the member listener', () => {
      service.setupGroupMemberListener('');

      expect(errors[0].message).toBe(
        'Error setting up group member listener: Group ID is required for member listener'
      );
      expect(addGroupMemberListener).not.toHaveBeenCalled();
    });

    it('reports a failure to register the connection listener', () => {
      vi.mocked(addConnectionListener).mockImplementation(() => {
        throw new Error('sdk down');
      });

      service.setupConnectionListener();

      expect(errors[0].message).toBe('Error setting up connection listener: sdk down');
    });

    it('clears any stale typing indicator when the typing listener is re-armed', () => {
      service.setupTypingListener('g1', 'group');
      service.setTypingIndicator(groupTyping('g1', userStub('s1')));

      service.setupTypingListener('g2', 'group');

      // No assertion on removeTypingListener here: arming the listener the
      // first time already called it, so "was it called" cannot fail.
      expect(service.typingIndicator()).toBeNull();
    });
  });

  // ==================== User status events ====================

  describe('user status events', () => {
    beforeEach(() => {
      service.setupListeners('u1', 'user');
    });

    it('marks the current user online and drops the last-active stamp', () => {
      service.setUser(userStub('u1', { status: 'offline', lastActiveAt: 99 }));

      statusCallbacks().onOnline(userStub('u1'));

      expect(service.userStatus()).toBe('online');
      expect(service.lastActiveAt()).toBeNull();
    });

    it('marks the current user offline and keeps the reported last-active stamp', () => {
      service.setUser(userStub('u1', { status: 'online' }));

      statusCallbacks().onOffline(userStub('u1', { lastActiveAt: 1710000123 }));

      expect(service.userStatus()).toBe('offline');
      expect(service.lastActiveAt()).toBe(1710000123);
    });

    it('stamps the current time when an offline user reports no last-active', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(1700000000000));
      service.setUser(userStub('u1', { status: 'online' }));

      statusCallbacks().onOffline(userStub('u1', { lastActiveAt: undefined }));

      expect(service.lastActiveAt()).toBe(1700000000000);
    });

    it('ignores a status event while no user is selected', () => {
      service.setGroup(groupStub('g1', 2));

      statusCallbacks().onOnline(userStub('u1'));

      expect(service.userStatus()).toBe('offline');
      // The status staying 'offline' is not enough on its own: without the
      // null guard the handler would dereference the absent user, and the
      // catch would swallow that and leave the status alone too. The event
      // has to be ignored silently.
      expect(errors).toHaveLength(0);
      expect(errorLog).not.toHaveBeenCalled();
    });

    it('ignores a status event for a different user', () => {
      service.setUser(userStub('u1', { status: 'offline' }));

      statusCallbacks().onOnline(userStub('u2'));

      expect(service.userStatus()).toBe('offline');
    });

    it('reports an error when the current user cannot be identified', () => {
      service.setUser(userStub('u1', { status: 'offline', uidThrows: true }));

      statusCallbacks().onOnline(userStub('u1'));

      expect(errors[0].message).toBe('Error handling user status change: uid unavailable');
      expect(service.userStatus()).toBe('offline');
    });
  });

  // ==================== Typing started ====================

  describe('typing started', () => {
    it('records the indicator and the typing group member', () => {
      vi.useFakeTimers();
      service.setupListeners('g1', 'group');
      const sender = userStub('s1');

      typingCallbacks().onStarted(groupTyping('g1', sender));

      expect(service.typingIndicator()).not.toBeNull();
      expect(service.typingUsers()).toEqual([sender]);
    });

    it('records the indicator but no typing users for a one-to-one chat', () => {
      vi.useFakeTimers();
      service.setupListeners('u1', 'user');

      typingCallbacks().onStarted(userTyping('u1'));

      expect(service.typingIndicator()).not.toBeNull();
      expect(service.typingUsers()).toEqual([]);
    });

    it('clears only the indicator for a one-to-one chat once typing goes quiet', () => {
      vi.useFakeTimers();
      service.setupListeners('u1', 'user');
      typingCallbacks().onStarted(userTyping('u1'));

      vi.advanceTimersByTime(2000);

      expect(service.typingIndicator()).toBeNull();
      expect(service.typingUsers()).toEqual([]);
    });

    it('drops each group member on their own timer and clears the indicator last', () => {
      vi.useFakeTimers();
      service.setupListeners('g1', 'group');
      const first = userStub('s1');
      const second = userStub('s2');
      const started = typingCallbacks().onStarted;

      started(groupTyping('g1', first));
      vi.advanceTimersByTime(1500);
      // A second typist re-arms the shared indicator timer, so the first
      // member's own timer is the only thing that fires next.
      started(groupTyping('g1', second));
      expect(service.typingUsers()).toEqual([first, second]);

      vi.advanceTimersByTime(500);

      expect(service.typingUsers()).toEqual([second]);
      expect(service.typingIndicator()).not.toBeNull();

      vi.advanceTimersByTime(1500);

      expect(service.typingUsers()).toEqual([]);
      expect(service.typingIndicator()).toBeNull();
    });

    it('leaves the typing users untouched when the member timer finds them already gone', () => {
      vi.useFakeTimers();
      service.setupListeners('g1', 'group');
      const { onStarted, onEnded } = typingCallbacks();
      const indicator = groupTyping('g1', userStub('s1'));

      onStarted(indicator);
      onEnded(indicator);
      const afterEnded = service.typingUsers();

      vi.advanceTimersByTime(2000);

      // The member timer must not publish a second, identical array when the
      // member has already been removed.
      expect(service.typingUsers()).toBe(afterEnded);
    });

    it('records the indicator with no typing users when the event has no sender', () => {
      vi.useFakeTimers();
      service.setupListeners('g1', 'group');

      typingCallbacks().onStarted(groupTyping('g1', null));

      expect(service.typingIndicator()).not.toBeNull();
      expect(service.typingUsers()).toEqual([]);
    });

    it('records the indicator with no typing users when the sender has no uid', () => {
      vi.useFakeTimers();
      service.setupListeners('g1', 'group');
      const anonymous = {
        getUid: () => undefined,
      } as unknown as CometChat.User;

      typingCallbacks().onStarted(groupTyping('g1', anonymous));

      expect(service.typingIndicator()).not.toBeNull();
      expect(service.typingUsers()).toEqual([]);
    });

    it('ignores a typing event aimed at another conversation', () => {
      service.setupListeners('g1', 'group');

      typingCallbacks().onStarted(groupTyping('other-group', userStub('s1')));

      expect(service.typingIndicator()).toBeNull();
      expect(service.typingUsers()).toEqual([]);
    });

    it('ignores a typing event after the typing listener was removed', () => {
      service.setupListeners('g1', 'group');
      const { onStarted } = typingCallbacks();
      service.removeTypingListener();

      onStarted(groupTyping('g1', userStub('s1')));

      expect(service.typingIndicator()).toBeNull();
    });

    it('ignores a typing event while the entity type is unknown', () => {
      service.setupListeners('g1', 'group');
      const { onStarted } = typingCallbacks();
      (service as unknown as { currentTypingEntityType: null }).currentTypingEntityType = null;

      onStarted(groupTyping('g1', userStub('s1')));

      expect(service.typingIndicator()).toBeNull();
    });

    it('reports an error when the typing user cannot be recorded', () => {
      service.setupListeners('g1', 'group');
      (service as unknown as { typingUsersMap: unknown }).typingUsersMap = {
        set: () => {
          throw new Error('map broken');
        },
      };

      typingCallbacks().onStarted(groupTyping('g1', userStub('s1')));

      expect(errors[0].message).toBe('Error handling typing started: map broken');
      // The indicator is published before the member bookkeeping, so it stays.
      expect(service.typingIndicator()).not.toBeNull();
    });
  });

  // ==================== Typing ended ====================

  describe('typing ended', () => {
    it('keeps the indicator while other group members are still typing', () => {
      vi.useFakeTimers();
      service.setupListeners('g1', 'group');
      const first = userStub('s1');
      const second = userStub('s2');
      const { onStarted, onEnded } = typingCallbacks();
      onStarted(groupTyping('g1', first));
      onStarted(groupTyping('g1', second));

      onEnded(groupTyping('g1', first));

      expect(service.typingUsers()).toEqual([second]);
      expect(service.typingIndicator()).not.toBeNull();
    });

    it('clears the indicator once the last group member stops typing', () => {
      vi.useFakeTimers();
      service.setupListeners('g1', 'group');
      const sender = userStub('s1');
      const { onStarted, onEnded } = typingCallbacks();
      onStarted(groupTyping('g1', sender));

      onEnded(groupTyping('g1', sender));

      expect(service.typingUsers()).toEqual([]);
      expect(service.typingIndicator()).toBeNull();
    });

    it('clears the indicator for a group event that carries no sender', () => {
      vi.useFakeTimers();
      service.setupListeners('g1', 'group');
      const { onStarted, onEnded } = typingCallbacks();
      onStarted(groupTyping('g1', userStub('s1')));

      onEnded(groupTyping('g1', null));

      expect(service.typingIndicator()).toBeNull();
    });

    it('clears the indicator for a one-to-one chat', () => {
      vi.useFakeTimers();
      service.setupListeners('u1', 'user');
      const { onStarted, onEnded } = typingCallbacks();
      onStarted(userTyping('u1'));

      onEnded(userTyping('u1'));

      expect(service.typingIndicator()).toBeNull();
    });

    it('cancels the pending indicator timer when typing ends', () => {
      vi.useFakeTimers();
      service.setupListeners('u1', 'user');
      const { onStarted, onEnded } = typingCallbacks();
      onStarted(userTyping('u1'));
      onEnded(userTyping('u1'));

      // A cancelled timer must not reach in later and clear a fresh indicator.
      service.setTypingIndicator(userTyping('u1'));
      vi.advanceTimersByTime(5000);

      expect(service.typingIndicator()).not.toBeNull();
    });

    it('ignores a typing-ended event aimed at another conversation', () => {
      service.setupListeners('g1', 'group');
      const indicator = groupTyping('g1', userStub('s1'));
      service.setTypingIndicator(indicator);

      typingCallbacks().onEnded(groupTyping('other-group', userStub('s1')));

      expect(service.typingIndicator()).toBe(indicator);
    });

    it('ignores a typing-ended event after the typing listener was removed', () => {
      service.setupListeners('g1', 'group');
      const { onEnded } = typingCallbacks();
      service.removeTypingListener();
      const indicator = groupTyping('g1', userStub('s1'));
      service.setTypingIndicator(indicator);

      onEnded(indicator);

      expect(service.typingIndicator()).toBe(indicator);
    });

    it('ignores a typing-ended event while the entity type is unknown', () => {
      service.setupListeners('g1', 'group');
      const { onEnded } = typingCallbacks();
      (service as unknown as { currentTypingEntityType: null }).currentTypingEntityType = null;
      const indicator = groupTyping('g1', userStub('s1'));
      service.setTypingIndicator(indicator);

      onEnded(indicator);

      expect(service.typingIndicator()).toBe(indicator);
    });

    it('reports an error when the typing user cannot be removed', () => {
      service.setupListeners('g1', 'group');
      (service as unknown as { typingUsersMap: unknown }).typingUsersMap = {
        delete: () => {
          throw new Error('map broken');
        },
      };

      typingCallbacks().onEnded(groupTyping('g1', userStub('s1')));

      expect(errors[0].message).toBe('Error handling typing ended: map broken');
    });
  });

  // ==================== Group member events ====================

  describe('group member events', () => {
    const member = userStub('m1');

    beforeEach(() => {
      service.setupListeners('g1', 'group');
      service.setGroup(groupStub('g1', 10));
    });

    it('raises the count when a member joins the current group', () => {
      memberCallbacks().onJoined(action, member, groupStub('g1'));

      expect(service.groupMemberCount()).toBe(11);
    });

    it('lowers the count when a member leaves the current group', () => {
      memberCallbacks().onLeft(action, member, groupStub('g1'));

      expect(service.groupMemberCount()).toBe(9);
    });

    it('lowers the count when a member is kicked from the current group', () => {
      memberCallbacks().onKicked(action, member, userStub('admin'), groupStub('g1'));

      expect(service.groupMemberCount()).toBe(9);
    });

    it('lowers the count when a member is banned from the current group', () => {
      memberCallbacks().onBanned(action, member, userStub('admin'), groupStub('g1'));

      expect(service.groupMemberCount()).toBe(9);
    });

    it('raises the count when a member is added to the current group', () => {
      memberCallbacks().onAdded(action, member, userStub('admin'), groupStub('g1'));

      expect(service.groupMemberCount()).toBe(11);
    });

    it('leaves the count alone on a scope change', () => {
      memberCallbacks().onScopeChanged(action, member, 'admin', 'participant', groupStub('g1'));

      expect(service.groupMemberCount()).toBe(10);
    });

    it('ignores member events for a different group', () => {
      const other = groupStub('g2');
      const callbacks = memberCallbacks();

      callbacks.onJoined(action, member, other);
      callbacks.onLeft(action, member, other);
      callbacks.onKicked(action, member, userStub('admin'), other);
      callbacks.onBanned(action, member, userStub('admin'), other);
      callbacks.onAdded(action, member, userStub('admin'), other);

      expect(service.groupMemberCount()).toBe(10);
    });

    it('ignores member events once the group listener has been removed', () => {
      const callbacks = memberCallbacks();
      service.removeGroupMemberListener();

      callbacks.onJoined(action, member, groupStub('g1'));
      callbacks.onLeft(action, member, groupStub('g1'));

      expect(service.groupMemberCount()).toBe(10);
    });

    it('never lets the member count go below zero', () => {
      service.updateGroupMemberCount(0);

      memberCallbacks().onLeft(action, member, groupStub('g1'));

      expect(service.groupMemberCount()).toBe(0);
    });
  });

  // ==================== Connection events ====================

  describe('connection events', () => {
    beforeEach(() => {
      service.setupConnectionListener();
    });

    it('marks the connection as disconnected', () => {
      connectionCallbacks().onDisconnected();

      expect(service.connectionStatus()).toBe('disconnected');
    });

    it('marks the connection as connected without a refresh when no user is selected', () => {
      connectionCallbacks().onDisconnected();

      connectionCallbacks().onConnected();

      expect(service.connectionStatus()).toBe('connected');
      expect(getUserSpy).not.toHaveBeenCalled();
    });

    it('refreshes the selected user on reconnect', async () => {
      service.setUser(userStub('u1', { status: 'offline' }));
      connectionCallbacks().onDisconnected();

      connectionCallbacks().onConnected();

      expect(service.connectionStatus()).toBe('connected');
      expect(getUserSpy).toHaveBeenCalledWith('u1');
      // Let the floating refresh settle so it does not write after teardown.
      await vi.waitFor(() => expect(service.userStatus()).toBe('online'));
    });

    it('reports an error when the selected user cannot be identified on reconnect', () => {
      service.setUser(userStub('u1', { uidThrows: true }));
      connectionCallbacks().onDisconnected();

      connectionCallbacks().onConnected();

      expect(errors[0].message).toBe('Error handling connected event: uid unavailable');
      // The status is written before the uid lookup, so it still flips.
      expect(service.connectionStatus()).toBe('connected');
      expect(getUserSpy).not.toHaveBeenCalled();
    });

    it('reports an error when the disconnect state cannot be written', () => {
      (service as unknown as { connectionStatusSignal: unknown }).connectionStatusSignal = {
        set: () => {
          throw new Error('signal broken');
        },
      };

      connectionCallbacks().onDisconnected();

      expect(errors[0].message).toBe('Error handling disconnected event: signal broken');
    });
  });

  // ==================== refreshUserStatus ====================

  describe('refreshUserStatus', () => {
    const refresh = (uid: string) =>
      (service as unknown as { refreshUserStatus: (id: string) => Promise<void> }).refreshUserStatus(
        uid
      );

    it('applies a refreshed online status and clears the last-active stamp', async () => {
      service.updateLastActiveAt(123);
      getUserSpy.mockResolvedValue(userStub('u1', { status: 'online', lastActiveAt: 456 }) as never);

      await refresh('u1');

      expect(service.userStatus()).toBe('online');
      expect(service.lastActiveAt()).toBeNull();
    });

    it('applies a refreshed offline status with its last-active stamp', async () => {
      getUserSpy.mockResolvedValue(
        userStub('u1', { status: 'offline', lastActiveAt: 1710000999 }) as never
      );

      await refresh('u1');

      expect(service.userStatus()).toBe('offline');
      expect(service.lastActiveAt()).toBe(1710000999);
    });

    it('nulls the last-active stamp when an offline user reports none', async () => {
      service.updateLastActiveAt(123);
      getUserSpy.mockResolvedValue(
        userStub('u1', { status: 'offline', lastActiveAt: undefined }) as never
      );

      await refresh('u1');

      expect(service.lastActiveAt()).toBeNull();
    });

    it('treats a missing status as offline', async () => {
      service.updateUserStatus('online');
      getUserSpy.mockResolvedValue(userStub('u1', { status: undefined }) as never);

      await refresh('u1');

      expect(service.userStatus()).toBe('offline');
    });

    it('leaves the status alone and reports the failure when the fetch fails', async () => {
      service.updateUserStatus('online');
      service.updateLastActiveAt(123);
      getUserSpy.mockRejectedValue(new Error('User not found'));

      await refresh('u1');

      expect(service.userStatus()).toBe('online');
      expect(service.lastActiveAt()).toBe(123);
      expect(errors[0].message).toBe('Error refreshing user status: User not found');
    });

    it('reports a failure to read the refreshed user', async () => {
      service.updateUserStatus('online');
      getUserSpy.mockResolvedValue(userStub('u1', { statusThrows: true }) as never);

      await refresh('u1');

      expect(errors[0].message).toBe(
        'Error processing refreshed user status: status unavailable'
      );
      expect(service.userStatus()).toBe('online');
    });
  });

  // ==================== Listener removal ====================

  describe('listener removal', () => {
    it('logs a failure to remove the user status listener', () => {
      vi.mocked(removeUserStatusListener).mockImplementation(() => {
        throw new Error('sdk down');
      });

      service.removeUserStatusListener();

      expect(errorLog).toHaveBeenCalledWith(
        'MessageHeaderService',
        'Error removing user status listener:',
        expect.any(Error)
      );
    });

    it('logs a failure to remove the typing listener and keeps the typing state', () => {
      vi.useFakeTimers();
      service.setupListeners('g1', 'group');
      const sender = userStub('s1');
      typingCallbacks().onStarted(groupTyping('g1', sender));
      vi.mocked(removeTypingListener).mockImplementation(() => {
        throw new Error('sdk down');
      });

      service.removeTypingListener();

      expect(errorLog).toHaveBeenCalledWith(
        'MessageHeaderService',
        'Error removing typing listener:',
        expect.any(Error)
      );
      // The teardown aborts on the first statement, so nothing is cleared.
      expect(service.typingUsers()).toEqual([sender]);
      expect(service.typingIndicator()).not.toBeNull();
    });

    it('clears the typing state when the typing listener is removed cleanly', () => {
      vi.useFakeTimers();
      service.setupListeners('g1', 'group');
      typingCallbacks().onStarted(groupTyping('g1', userStub('s1')));

      service.removeTypingListener();

      expect(service.typingUsers()).toEqual([]);
      expect(service.typingIndicator()).toBeNull();
    });

    it('logs a failure to remove the group member listener and keeps the group bound', () => {
      service.setupListeners('g1', 'group');
      service.setGroup(groupStub('g1', 4));
      const callbacks = memberCallbacks();
      vi.mocked(removeGroupMemberListener).mockImplementation(() => {
        throw new Error('sdk down');
      });

      service.removeGroupMemberListener();

      expect(errorLog).toHaveBeenCalledWith(
        'MessageHeaderService',
        'Error removing group member listener:',
        expect.any(Error)
      );
      // The current group id is cleared only after a successful removal.
      callbacks.onJoined(action, userStub('m1'), groupStub('g1'));
      expect(service.groupMemberCount()).toBe(5);
    });

    it('logs a failure to remove the connection listener', () => {
      vi.mocked(removeConnectionListener).mockImplementation(() => {
        throw new Error('sdk down');
      });

      service.removeConnectionListener();

      expect(errorLog).toHaveBeenCalledWith(
        'MessageHeaderService',
        'Error removing connection listener:',
        expect.any(Error)
      );
    });

    it('stops at the first failing teardown step when removing every listener', () => {
      (service as unknown as { removeUserStatusListener: () => void }).removeUserStatusListener =
        () => {
          throw new Error('teardown broken');
        };

      (service as unknown as { removeAllListeners: () => void }).removeAllListeners();

      expect(errorLog).toHaveBeenCalledWith(
        'MessageHeaderService',
        'Error removing all listeners:',
        expect.any(Error)
      );
      expect(removeConnectionListener).not.toHaveBeenCalled();
    });
  });

  // ==================== cleanup / destroy ====================

  describe('cleanup', () => {
    it('removes every listener and resets the state', () => {
      service.setupListeners('g1', 'group');
      service.setGroup(groupStub('g1', 3));
      // setupListeners tears the previous listeners down first, so every
      // remove* mock has already been called by this point; without clearing
      // them the assertions below would pass even if cleanup() did nothing.
      [
        removeUserStatusListener,
        removeTypingListener,
        removeGroupMemberListener,
        removeConnectionListener,
      ].forEach(fn => vi.mocked(fn).mockClear());

      service.cleanup();

      expect(removeUserStatusListener).toHaveBeenCalled();
      expect(removeTypingListener).toHaveBeenCalled();
      expect(removeGroupMemberListener).toHaveBeenCalled();
      expect(removeConnectionListener).toHaveBeenCalled();
      expect(service.group()).toBeNull();
      expect(service.groupMemberCount()).toBe(0);
    });

    it('logs a failed cleanup and leaves the state in place', () => {
      service.setGroup(groupStub('g1', 3));
      (service as unknown as { removeAllListeners: () => void }).removeAllListeners = () => {
        throw new Error('teardown broken');
      };

      service.cleanup();

      expect(errorLog).toHaveBeenCalledWith(
        'MessageHeaderService',
        'Error during cleanup:',
        expect.any(Error)
      );
      expect(service.group()).not.toBeNull();
      expect(service.groupMemberCount()).toBe(3);
    });

    it('tears down the listeners when the injector is destroyed', () => {
      service.setupListeners('u1', 'user');
      service.setUser(userStub('u1', { status: 'online', lastActiveAt: 42 }));
      // Same trap as in the cleanup test: setupListeners has already called
      // every remove* mock, and user() would read null if setUser were
      // skipped. Clear the history and put real state in place so destruction
      // is the only thing that can satisfy the assertions.
      [removeUserStatusListener, removeConnectionListener].forEach(fn =>
        vi.mocked(fn).mockClear()
      );
      expect(service.user()).not.toBeNull();

      TestBed.resetTestingModule();

      expect(removeUserStatusListener).toHaveBeenCalled();
      expect(removeConnectionListener).toHaveBeenCalled();
      expect(service.user()).toBeNull();
      expect(service.userStatus()).toBe('offline');
      expect(service.lastActiveAt()).toBeNull();
    });

    it('swallows and logs a teardown failure during injector destruction', () => {
      const failure = new Error('teardown broken');
      (service as unknown as { removeAllListeners: () => void }).removeAllListeners = () => {
        throw failure;
      };

      TestBed.resetTestingModule();

      expect(errorLog).toHaveBeenCalledWith(
        'MessageHeaderService',
        'Error during DestroyRef cleanup:',
        failure
      );
    });
  });
});
