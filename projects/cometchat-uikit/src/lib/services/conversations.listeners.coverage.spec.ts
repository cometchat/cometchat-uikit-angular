/**
 * conversations.listeners — behaviour coverage.
 *
 * This module had no spec of its own: the only thing exercising it was
 * ConversationsService, which registers the listeners and never fires them, so
 * every handler body and every catch block was dead in the suite. Here the
 * module is driven directly — the four `setup*` helpers are called, the real
 * SDK listener object they hand to `CometChat.add*Listener` is captured from the
 * mocked static, and each handler on it is invoked.
 *
 * Two things are asserted for every handler: the payload reaches the one
 * callback that owns it (and no other), and it arrives while `NgZone.run` is on
 * the stack — the zone stub flips a flag for the duration of the run, so a
 * handler that forgot to wrap its callback records `insideZone: false`.
 *
 * Only the four `add*Listener`/`remove*Listener` statics are mocked globally;
 * `CometChat.MessageListener` and friends are the real SDK classes, whose
 * constructors null every key they know and then copy an allowlist. That is why
 * reading handlers back off the registered object is a real check on this
 * module's wiring, and why the group listener is read under the renamed
 * `onGroupMemberAddedToGroup` property.
 *
 * The file has no conditional branches at all — no `if`, ternary or `||`/`&&`
 * arm — so the only error paths are the per-function `try`/`catch` around
 * registration, each driven here, plus the containment boundary at the end:
 * a throwing callback must escape the handler rather than be logged away.
 *
 * @module services/conversations.listeners
 */

// The calls SDK reaches for JitsiMeetJS, which jsdom does not provide.
import { vi } from 'vitest';

vi.mock('@cometchat/calls-sdk-javascript', () => ({
  CometChatCalls: {
    init: vi.fn().mockResolvedValue(true),
    generateToken: vi.fn().mockResolvedValue({ token: 'mock-token' }),
  },
}));

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { MockInstance } from 'vitest';
import { NgZone } from '@angular/core';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatLogger } from '../utils/CometChatLogger';
import {
  setupMessageListener,
  removeMessageListener,
  setupUserListener,
  removeUserListener,
  setupGroupListener,
  removeGroupListener,
  setupCallListener,
  removeCallListener,
  MessageListenerCallbacks,
} from './conversations.listeners';

// ---------------------------------------------------------------------------
// Harness
// ---------------------------------------------------------------------------

/** One callback invocation: which callback, with what, and in or out of the zone. */
interface Invocation {
  callback: string;
  arg: unknown;
  insideZone: boolean;
}

interface ZoneProbe {
  ngZone: NgZone;
  /** True only while a function passed to `NgZone.run` is executing. */
  insideZone: () => boolean;
  runCount: () => number;
}

function makeZoneProbe(): ZoneProbe {
  let depth = 0;
  let runs = 0;
  const ngZone = {
    run: <T>(fn: () => T): T => {
      runs += 1;
      depth += 1;
      try {
        return fn();
      } finally {
        depth -= 1;
      }
    },
  } as unknown as NgZone;
  return { ngZone, insideZone: () => depth > 0, runCount: () => runs };
}

/**
 * A recorder shared by every callback the helpers are given. Plain closures
 * rather than `vi.fn()` so the recording survives any spy restore, and so a
 * single ordered log can prove that no sibling callback also fired.
 */
function makeRecorder(probe: ZoneProbe): {
  log: Invocation[];
  callback: (name: string) => (arg: unknown) => void;
} {
  const log: Invocation[] = [];
  return {
    log,
    callback:
      (name: string) =>
      (arg: unknown): void => {
        log.push({ callback: name, arg, insideZone: probe.insideZone() });
      },
  };
}

/** The SDK listener object a `setup*` helper registered, as a callable map. */
type HandlerMap = Record<string, (arg: unknown) => void>;

function captureListener(statik: unknown): HandlerMap {
  const calls = (statik as { mock: { calls: unknown[][] } }).mock.calls;
  expect(calls.length).toBe(1);
  return calls[0][1] as HandlerMap;
}

function registeredId(statik: unknown): unknown {
  const calls = (statik as { mock: { calls: unknown[][] } }).mock.calls;
  return calls[0][0];
}

const ADD_STATICS = ['addMessageListener', 'addUserListener', 'addGroupListener', 'addCallListener'] as const;

/**
 * A `setup*` helper must register exactly one listener, of its own kind. Without
 * this a copy-paste slip — `setupCallListener` reaching for `addUserListener`,
 * or registering twice — still satisfies every per-handler routing test below,
 * because those read the listener object back from whichever static got it.
 */
function expectOnlyRegistered(expected: (typeof ADD_STATICS)[number]): void {
  for (const name of ADD_STATICS) {
    const mock = vi.mocked(CometChat[name] as unknown as (...args: unknown[]) => unknown);
    expect(mock.mock.calls.length, name).toBe(name === expected ? 1 : 0);
  }
}

type MessageHandlerName = keyof MessageListenerCallbacks;

/** Every handler `setupMessageListener` wires, each with a distinct payload. */
const MESSAGE_PAYLOADS: Record<MessageHandlerName, () => unknown> = {
  onTextMessageReceived: () => new CometChat.TextMessage('u1', 'hello', CometChat.RECEIVER_TYPE.USER),
  onMediaMessageReceived: () =>
    new CometChat.MediaMessage('u1', 'https://example.test/a.png', CometChat.MESSAGE_TYPE.IMAGE, CometChat.RECEIVER_TYPE.USER),
  onCustomMessageReceived: () => new CometChat.CustomMessage('u1', CometChat.RECEIVER_TYPE.USER, 'poll', { question: 'q' }),
  onInteractiveMessageReceived: () => new CometChat.InteractiveMessage('u1', CometChat.RECEIVER_TYPE.USER, 'form', { title: 't' }),
  onCardMessageReceived: () => new CometChat.CardMessage('u1', CometChat.RECEIVER_TYPE.USER),
  onAIAssistantMessageReceived: () => new CometChat.TextMessage('u1', 'agent reply', CometChat.RECEIVER_TYPE.USER),
  onMessageEdited: () => new CometChat.TextMessage('u1', 'edited', CometChat.RECEIVER_TYPE.USER),
  onMessageDeleted: () => new CometChat.TextMessage('u1', 'deleted', CometChat.RECEIVER_TYPE.USER),
  onMessagesDelivered: () => new CometChat.MessageReceipt(),
  onMessagesRead: () => new CometChat.MessageReceipt(),
  onMessagesDeliveredToAll: () => new CometChat.MessageReceipt(),
  onMessagesReadByAll: () => new CometChat.MessageReceipt(),
  onTypingStarted: () => new CometChat.TypingIndicator('u1', CometChat.RECEIVER_TYPE.USER),
  onTypingEnded: () => new CometChat.TypingIndicator('u1', CometChat.RECEIVER_TYPE.USER),
};

const MESSAGE_HANDLERS = Object.keys(MESSAGE_PAYLOADS) as MessageHandlerName[];

/** Handlers the SDK supports but this module deliberately leaves unwired. */
const UNWIRED_MESSAGE_HANDLERS = ['onTransientMessageReceived', 'onMessagePinned', 'onMessageUnpinned', 'onInteractionGoalCompleted'];

const USER_HANDLERS = ['onUserOnline', 'onUserOffline'];

/**
 * Membership handlers as `[key this module passes in, property the SDK exposes]`.
 * They match for six of the seven: the SDK stores `onMemberAddedToGroup` under
 * `onGroupMemberAddedToGroup`, and the renamed property is the one it calls.
 */
const GROUP_HANDLERS: ReadonlyArray<[string, string]> = [
  ['onGroupMemberJoined', 'onGroupMemberJoined'],
  ['onGroupMemberLeft', 'onGroupMemberLeft'],
  ['onGroupMemberKicked', 'onGroupMemberKicked'],
  ['onGroupMemberBanned', 'onGroupMemberBanned'],
  ['onGroupMemberUnbanned', 'onGroupMemberUnbanned'],
  ['onGroupMemberScopeChanged', 'onGroupMemberScopeChanged'],
  ['onMemberAddedToGroup', 'onGroupMemberAddedToGroup'],
];

const CALL_HANDLERS = [
  'onIncomingCallReceived',
  'onIncomingCallCancelled',
  'onOutgoingCallAccepted',
  'onOutgoingCallRejected',
  'onCallEndedMessageReceived',
];

function makeMessageCallbacks(probe: ZoneProbe): { callbacks: MessageListenerCallbacks; log: Invocation[] } {
  const recorder = makeRecorder(probe);
  const callbacks: HandlerMap = {};
  for (const name of MESSAGE_HANDLERS) {
    callbacks[name] = recorder.callback(name);
  }
  return { callbacks: callbacks as unknown as MessageListenerCallbacks, log: recorder.log };
}

function makeUser(): CometChat.User {
  const user = new CometChat.User('u1');
  user.setName('User One');
  return user;
}

function makeAction(): CometChat.Action {
  return new CometChat.Action('g1', 'groupMember', CometChat.RECEIVER_TYPE.GROUP, 'action' as CometChat.MessageCategory);
}

function makeCall(): CometChat.Call {
  return new CometChat.Call('u1', 'audio', CometChat.RECEIVER_TYPE.USER);
}

const SDK_STATICS = [
  'addMessageListener',
  'removeMessageListener',
  'addUserListener',
  'removeUserListener',
  'addGroupListener',
  'removeGroupListener',
  'addCallListener',
  'removeCallListener',
] as const;

describe('conversations.listeners', () => {
  let loggerError: MockInstance;

  beforeEach(() => {
    // The SDK statics are shared mocks from the global setup; clear the call
    // history so `captureListener` can insist on exactly one registration.
    for (const name of SDK_STATICS) {
      vi.mocked(CometChat[name] as unknown as (...args: unknown[]) => unknown).mockReset();
    }
    loggerError = vi.spyOn(CometChatLogger, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    loggerError.mockRestore();
  });

  // ==================== setupMessageListener ====================

  describe('setupMessageListener', () => {
    it('registers a real SDK MessageListener under its id, wiring every handler the conversation list needs and nothing else', () => {
      const probe = makeZoneProbe();
      setupMessageListener('conv-message-listener', makeMessageCallbacks(probe).callbacks, probe.ngZone);
      const listener = captureListener(CometChat.addMessageListener);

      expect(registeredId(CometChat.addMessageListener)).toBe('conv-message-listener');
      expect(listener).toBeInstanceOf(CometChat.MessageListener);
      expectOnlyRegistered('addMessageListener');
      // The real SDK constructor nulls every key it knows and then copies only
      // the ones it was handed, so this is a two-way check: a handler the SDK
      // stopped recognising (card and AI assistant are the newest) would read
      // back undefined, and a handler wired here by mistake would read back as
      // a function instead of undefined.
      for (const name of MESSAGE_HANDLERS) {
        expect(typeof listener[name], name).toBe('function');
      }
      for (const name of UNWIRED_MESSAGE_HANDLERS) {
        expect(listener[name], name).toBeUndefined();
      }
    });

    it.each(MESSAGE_HANDLERS)('routes %s to its callback, inside the Angular zone', (name) => {
      const probe = makeZoneProbe();
      const { callbacks, log } = makeMessageCallbacks(probe);
      setupMessageListener('conv-message-listener', callbacks, probe.ngZone);
      const listener = captureListener(CometChat.addMessageListener);
      const payload = MESSAGE_PAYLOADS[name]();

      listener[name](payload);

      expect(log).toHaveLength(1);
      expect(log[0].callback).toBe(name);
      expect(log[0].arg).toBe(payload);
      expect(log[0].insideZone).toBe(true);
      expect(probe.runCount()).toBe(1);
      expect(probe.insideZone()).toBe(false);
    });

    it('logs and swallows a registration failure so the caller keeps running', () => {
      const failure = new Error('SDK not initialised');
      vi.mocked(CometChat.addMessageListener).mockImplementation(() => {
        throw failure;
      });
      const probe = makeZoneProbe();

      setupMessageListener('conv-message-listener', makeMessageCallbacks(probe).callbacks, probe.ngZone);

      expect(loggerError).toHaveBeenCalledTimes(1);
      expect(loggerError).toHaveBeenCalledWith('conversations.listeners', 'Error setting up message listener:', failure);
    });
  });

  // ==================== removeMessageListener ====================

  describe('removeMessageListener', () => {
    it('removes the listener registered under that id', () => {
      removeMessageListener('conv-message-listener');

      expect(CometChat.removeMessageListener).toHaveBeenCalledTimes(1);
      expect(CometChat.removeMessageListener).toHaveBeenCalledWith('conv-message-listener');
      expect(loggerError).not.toHaveBeenCalled();
    });

    it('logs and swallows a removal failure', () => {
      const failure = new Error('no such listener');
      vi.mocked(CometChat.removeMessageListener).mockImplementation(() => {
        throw failure;
      });

      removeMessageListener('conv-message-listener');

      expect(loggerError).toHaveBeenCalledWith('conversations.listeners', 'Error removing message listener:', failure);
    });
  });

  // ==================== setupUserListener ====================

  describe('setupUserListener', () => {
    it('registers a real SDK UserListener with both presence handlers', () => {
      const probe = makeZoneProbe();
      setupUserListener('conv-user-listener', makeRecorder(probe).callback('onStatusChange'), probe.ngZone);
      const listener = captureListener(CometChat.addUserListener);

      expect(registeredId(CometChat.addUserListener)).toBe('conv-user-listener');
      expect(listener).toBeInstanceOf(CometChat.UserListener);
      expectOnlyRegistered('addUserListener');
      for (const name of USER_HANDLERS) {
        expect(typeof listener[name], name).toBe('function');
      }
    });

    it.each(USER_HANDLERS)('routes %s to onStatusChange with the user, inside the Angular zone', (name) => {
      const probe = makeZoneProbe();
      const recorder = makeRecorder(probe);
      setupUserListener('conv-user-listener', recorder.callback('onStatusChange'), probe.ngZone);
      const listener = captureListener(CometChat.addUserListener);
      const user = makeUser();

      listener[name](user);

      expect(recorder.log).toEqual([{ callback: 'onStatusChange', arg: user, insideZone: true }]);
      expect(probe.runCount()).toBe(1);
    });

    it('logs and swallows a registration failure', () => {
      const failure = new Error('user listener rejected');
      vi.mocked(CometChat.addUserListener).mockImplementation(() => {
        throw failure;
      });
      const probe = makeZoneProbe();

      setupUserListener('conv-user-listener', makeRecorder(probe).callback('onStatusChange'), probe.ngZone);

      expect(loggerError).toHaveBeenCalledWith('conversations.listeners', 'Error setting up user listener:', failure);
    });
  });

  // ==================== removeUserListener ====================

  describe('removeUserListener', () => {
    it('removes the listener registered under that id', () => {
      removeUserListener('conv-user-listener');

      expect(CometChat.removeUserListener).toHaveBeenCalledTimes(1);
      expect(CometChat.removeUserListener).toHaveBeenCalledWith('conv-user-listener');
      expect(loggerError).not.toHaveBeenCalled();
    });

    it('logs and swallows a removal failure', () => {
      const failure = new Error('no such user listener');
      vi.mocked(CometChat.removeUserListener).mockImplementation(() => {
        throw failure;
      });

      removeUserListener('conv-user-listener');

      expect(loggerError).toHaveBeenCalledWith('conversations.listeners', 'Error removing user listener:', failure);
    });
  });

  // ==================== setupGroupListener ====================

  describe('setupGroupListener', () => {
    it('registers a real SDK GroupListener with every membership handler', () => {
      const probe = makeZoneProbe();
      setupGroupListener('conv-group-listener', makeRecorder(probe).callback('onGroupAction'), probe.ngZone);
      const listener = captureListener(CometChat.addGroupListener);

      expect(registeredId(CometChat.addGroupListener)).toBe('conv-group-listener');
      expect(listener).toBeInstanceOf(CometChat.GroupListener);
      expectOnlyRegistered('addGroupListener');
      for (const [wired, exposed] of GROUP_HANDLERS) {
        expect(typeof listener[exposed], wired).toBe('function');
      }
    });

    it.each(GROUP_HANDLERS)('routes %s to onGroupAction with the action message, inside the Angular zone', (_wired, exposed) => {
      const probe = makeZoneProbe();
      const recorder = makeRecorder(probe);
      setupGroupListener('conv-group-listener', recorder.callback('onGroupAction'), probe.ngZone);
      const listener = captureListener(CometChat.addGroupListener);
      const action = makeAction();

      listener[exposed](action);

      expect(recorder.log).toEqual([{ callback: 'onGroupAction', arg: action, insideZone: true }]);
      expect(probe.runCount()).toBe(1);
    });

    it('logs and swallows a registration failure', () => {
      const failure = new Error('group listener rejected');
      vi.mocked(CometChat.addGroupListener).mockImplementation(() => {
        throw failure;
      });
      const probe = makeZoneProbe();

      setupGroupListener('conv-group-listener', makeRecorder(probe).callback('onGroupAction'), probe.ngZone);

      expect(loggerError).toHaveBeenCalledWith('conversations.listeners', 'Error setting up group listener:', failure);
    });
  });

  // ==================== removeGroupListener ====================

  describe('removeGroupListener', () => {
    it('removes the listener registered under that id', () => {
      removeGroupListener('conv-group-listener');

      expect(CometChat.removeGroupListener).toHaveBeenCalledTimes(1);
      expect(CometChat.removeGroupListener).toHaveBeenCalledWith('conv-group-listener');
      expect(loggerError).not.toHaveBeenCalled();
    });

    it('logs and swallows a removal failure', () => {
      const failure = new Error('no such group listener');
      vi.mocked(CometChat.removeGroupListener).mockImplementation(() => {
        throw failure;
      });

      removeGroupListener('conv-group-listener');

      expect(loggerError).toHaveBeenCalledWith('conversations.listeners', 'Error removing group listener:', failure);
    });
  });

  // ==================== setupCallListener ====================

  describe('setupCallListener', () => {
    it('registers a real SDK CallListener with every call-lifecycle handler', () => {
      const probe = makeZoneProbe();
      setupCallListener('conv-call-listener', makeRecorder(probe).callback('onCallEvent'), probe.ngZone);
      const listener = captureListener(CometChat.addCallListener);

      expect(registeredId(CometChat.addCallListener)).toBe('conv-call-listener');
      expect(listener).toBeInstanceOf(CometChat.CallListener);
      expectOnlyRegistered('addCallListener');
      for (const name of CALL_HANDLERS) {
        expect(typeof listener[name], name).toBe('function');
      }
    });

    it.each(CALL_HANDLERS)('routes %s to onCallEvent with the call, inside the Angular zone', (name) => {
      const probe = makeZoneProbe();
      const recorder = makeRecorder(probe);
      setupCallListener('conv-call-listener', recorder.callback('onCallEvent'), probe.ngZone);
      const listener = captureListener(CometChat.addCallListener);
      const call = makeCall();

      listener[name](call);

      expect(recorder.log).toEqual([{ callback: 'onCallEvent', arg: call, insideZone: true }]);
      expect(probe.runCount()).toBe(1);
    });

    it('logs and swallows a registration failure', () => {
      const failure = new Error('call listener rejected');
      vi.mocked(CometChat.addCallListener).mockImplementation(() => {
        throw failure;
      });
      const probe = makeZoneProbe();

      setupCallListener('conv-call-listener', makeRecorder(probe).callback('onCallEvent'), probe.ngZone);

      expect(loggerError).toHaveBeenCalledWith('conversations.listeners', 'Error setting up call listener:', failure);
    });
  });

  // ==================== removeCallListener ====================

  describe('removeCallListener', () => {
    it('removes the listener registered under that id', () => {
      removeCallListener('conv-call-listener');

      expect(CometChat.removeCallListener).toHaveBeenCalledTimes(1);
      expect(CometChat.removeCallListener).toHaveBeenCalledWith('conv-call-listener');
      expect(loggerError).not.toHaveBeenCalled();
    });

    it('logs and swallows a removal failure', () => {
      const failure = new Error('no such call listener');
      vi.mocked(CometChat.removeCallListener).mockImplementation(() => {
        throw failure;
      });

      removeCallListener('conv-call-listener');

      expect(loggerError).toHaveBeenCalledWith('conversations.listeners', 'Error removing call listener:', failure);
    });
  });
  // ==================== error containment boundary ====================

  /**
   * Each helper wires one representative handler to a callback that throws.
   * The `try`/`catch` in this module guards registration only, so the throw has
   * to come straight back out of the handler: a future refactor that widened
   * the `catch` to cover the handler body would turn every failure inside a
   * conversation-list callback into a silent log line, which is exactly the
   * class of bug this module's logging is otherwise meant to surface.
   */
  describe('a throwing callback', () => {
    const boom = new Error('callback blew up');
    const thrower = (): never => {
      throw boom;
    };

    const CASES: ReadonlyArray<[string, (ngZone: NgZone) => HandlerMap, string]> = [
      [
        'setupMessageListener',
        (ngZone) => {
          const callbacks: HandlerMap = {};
          for (const name of MESSAGE_HANDLERS) callbacks[name] = thrower;
          setupMessageListener('conv-message-listener', callbacks as unknown as MessageListenerCallbacks, ngZone);
          return captureListener(CometChat.addMessageListener);
        },
        'onTextMessageReceived',
      ],
      [
        'setupUserListener',
        (ngZone) => {
          setupUserListener('conv-user-listener', thrower, ngZone);
          return captureListener(CometChat.addUserListener);
        },
        'onUserOnline',
      ],
      [
        'setupGroupListener',
        (ngZone) => {
          setupGroupListener('conv-group-listener', thrower, ngZone);
          return captureListener(CometChat.addGroupListener);
        },
        'onGroupMemberJoined',
      ],
      [
        'setupCallListener',
        (ngZone) => {
          setupCallListener('conv-call-listener', thrower, ngZone);
          return captureListener(CometChat.addCallListener);
        },
        'onIncomingCallReceived',
      ],
    ];

    it.each(CASES)('propagates out of a handler %s wired, rather than being logged', (_name, arrange, handler) => {
      const probe = makeZoneProbe();
      const listener = arrange(probe.ngZone);

      expect(() => listener[handler]({})).toThrow(boom);
      expect(loggerError).not.toHaveBeenCalled();
      // The zone was entered and left cleanly despite the throw, so a later
      // delivery is not stranded inside a half-open zone run.
      expect(probe.runCount()).toBe(1);
      expect(probe.insideZone()).toBe(false);
    });
  });
});
