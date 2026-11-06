/**
 * ConversationsService — behaviour coverage.
 *
 * The sibling spec drives this service against a live SDK session, so with no
 * session every realtime handler, receipt path and error branch is skipped. This
 * spec replaces the data layer instead: the SDK listener module and the UI-event
 * module are mocked so the callbacks the service registers can be invoked
 * directly, and the conversations request is a local stub. Nothing here needs a
 * network, a login, or a rendered component.
 *
 * @module services/conversations
 */

// The calls SDK reaches for JitsiMeetJS, which jsdom does not provide.
import { vi } from 'vitest';

vi.mock('@cometchat/calls-sdk-javascript', () => {
  const CallSettingsBuilder = vi.fn().mockImplementation(function (this: Record<string, unknown>) {
    this['enableDefaultLayout'] = vi.fn().mockReturnThis();
    this['setIsAudioOnlyCall'] = vi.fn().mockReturnThis();
    this['setCallListener'] = vi.fn().mockReturnThis();
    this['build'] = vi.fn().mockReturnValue({});
  });
  const OngoingCallListener = vi.fn().mockImplementation(function (this: Record<string, unknown>, callbacks: unknown) {
    this['callbacks'] = callbacks;
  });
  return {
    CometChatCalls: {
      init: vi.fn().mockResolvedValue(true),
      generateToken: vi.fn().mockResolvedValue({ token: 'mock-token' }),
      startSession: vi.fn(),
      endSession: vi.fn(),
      CallSettingsBuilder,
      OngoingCallListener,
    },
  };
});

/**
 * Everything the service hands to the two collaborator modules. Plain functions
 * rather than `vi.fn()` so a spy restore between tests cannot strip the
 * recording implementations out of the hoisted factories.
 */
const captured = vi.hoisted(() => ({
  ids: {} as Record<string, string>,
  removed: [] as string[],
  messageCallbacks: null as Record<string, (arg: unknown) => void> | null,
  userCallback: null as ((user: unknown) => void) | null,
  groupCallback: null as ((message: unknown) => void) | null,
  callCallback: null as ((call: unknown) => void) | null,
  uiHandlers: null as Record<string, (arg: unknown) => void> | null,
  callEventHandler: null as ((call: unknown) => void) | null,
  uiSubs: [] as Array<{ count: number; unsubscribe: () => void }>,
  callSubs: [] as Array<{ count: number; unsubscribe: () => void }>,
  reset(): void {
    this.ids = {};
    this.removed = [];
    this.messageCallbacks = null;
    this.userCallback = null;
    this.groupCallback = null;
    this.callCallback = null;
    this.uiHandlers = null;
    this.callEventHandler = null;
    this.uiSubs = [];
    this.callSubs = [];
  },
}));

vi.mock('./conversations.listeners', () => ({
  setupMessageListener: (id: string, cbs: Record<string, (arg: unknown) => void>) => {
    captured.ids['message'] = id;
    captured.messageCallbacks = cbs;
  },
  removeMessageListener: (id: string) => captured.removed.push(`message:${id}`),
  setupUserListener: (id: string, cb: (user: unknown) => void) => {
    captured.ids['user'] = id;
    captured.userCallback = cb;
  },
  removeUserListener: (id: string) => captured.removed.push(`user:${id}`),
  setupGroupListener: (id: string, cb: (message: unknown) => void) => {
    captured.ids['group'] = id;
    captured.groupCallback = cb;
  },
  removeGroupListener: (id: string) => captured.removed.push(`group:${id}`),
  setupCallListener: (id: string, cb: (call: unknown) => void) => {
    captured.ids['call'] = id;
    captured.callCallback = cb;
  },
  removeCallListener: (id: string) => captured.removed.push(`call:${id}`),
}));

vi.mock('./conversations.ui-events', () => {
  const makeSub = () => {
    const sub = { count: 0, unsubscribe: () => { sub.count += 1; } };
    return sub;
  };
  return {
    setupUIEventSubscriptions: (handlers: Record<string, (arg: unknown) => void>) => {
      captured.uiHandlers = handlers;
      captured.uiSubs = [makeSub(), makeSub()];
      return captured.uiSubs;
    },
    setupCallEventSubscriptions: (cb: (call: unknown) => void) => {
      captured.callEventHandler = cb;
      captured.callSubs = [makeSub()];
      return captured.callSubs;
    },
  };
});

import { describe, it, expect, beforeEach, afterEach, type MockInstance } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { ConversationsService } from './conversations.service';
import { ConnectionStateService } from './connection-state.service';
import { CometChatMessageEvents } from '../events/CometChatMessageEvents';
import { CometChatConversationEvents } from '../events/CometChatConversationEvents';
import { MessageStatus } from '../Enums/Enums';
import { CometChatUIKit } from '../cometchat-uikit';
import { CometChatUIKitConstants } from '../constants';
import { CometChatLogger } from '../utils/CometChatLogger';
import {
  createMockUser,
  createMockGroup,
  createMockConversation,
  createMockTextMessage,
  createMockMediaMessage,
} from '../testing/mock-sdk';

const GROUP = CometChatUIKitConstants.MessageReceiverType.group;
const USER = CometChatUIKitConstants.MessageReceiverType.user;

describe('ConversationsService (coverage)', () => {
  let service: ConversationsService;
  let reconnected$: Subject<boolean>;
  let loggedInUser: CometChat.User | null;
  let errorLog: MockInstance;
  let infoLog: MockInstance;
  let helperSpy: MockInstance;
  let spies: MockInstance[] = [];
  let originalRequestBuilder: unknown;

  /** Registers a spy so it is restored even when a test fails part-way. */
  function track<T extends MockInstance>(spy: T): T {
    spies.push(spy);
    return spy;
  }

  // ─── fixtures ──────────────────────────────────────────────────────────────

  /**
   * `createMockConversation` uses the entity id as the conversation id, so a
   * message addressed to the same id is the one that resolves to this entry.
   */
  function userConversation(
    uid: string,
    opts: { unread?: number; lastMessage?: CometChat.BaseMessage; name?: string } = {}
  ): CometChat.Conversation {
    return createMockConversation({
      type: 'user',
      conversationWith: createMockUser({ uid, name: opts.name ?? `User ${uid}` }),
      unreadMessageCount: opts.unread ?? 0,
      ...(opts.lastMessage ? { lastMessage: opts.lastMessage } : {}),
    });
  }

  function groupConversation(
    guid: string,
    opts: { membersCount?: number; lastMessage?: CometChat.BaseMessage } = {}
  ): CometChat.Conversation {
    return createMockConversation({
      type: 'group',
      conversationWith: createMockGroup({ guid, membersCount: opts.membersCount ?? 5 }),
      ...(opts.lastMessage ? { lastMessage: opts.lastMessage } : {}),
    });
  }

  function textFor(
    conversationId: string,
    opts: { text?: string; sender?: CometChat.User; id?: number; deliveredAt?: number } = {}
  ): CometChat.TextMessage {
    const msg = createMockTextMessage({
      receiverId: conversationId,
      text: opts.text ?? 'hello',
      ...(opts.sender ? { sender: opts.sender } : {}),
      ...(opts.id !== undefined ? { id: opts.id } : {}),
      ...(opts.deliveredAt ? { deliveredAt: opts.deliveredAt } : {}),
    });
    msg.setConversationId(conversationId);
    return msg;
  }

  function groupAction(
    conversationId: string,
    opts: { actionFor?: unknown; receiver?: unknown; receiverType?: string } = {}
  ): CometChat.Action {
    const action = new CometChat.Action(
      conversationId,
      CometChatUIKitConstants.MessageTypes.groupMember,
      opts.receiverType ?? GROUP,
      CometChatUIKitConstants.MessageCategory.action as CometChat.MessageCategory
    );
    action.setConversationId(conversationId);
    action.setSender(createMockUser({ uid: 'actor' }));
    if (opts.actionFor) action.setActionFor(opts.actionFor as CometChat.Group);
    if (opts.receiver) action.setReceiver(opts.receiver as CometChat.Group);
    return action;
  }

  function makeReceipt(opts: {
    messageId: string;
    senderUid?: string;
    receiver?: string;
    readAt?: number;
    deliveredAt?: number;
  }): CometChat.MessageReceipt {
    const receipt = new CometChat.MessageReceipt();
    const sender = opts.senderUid ? createMockUser({ uid: opts.senderUid }) : undefined;
    const patched = receipt as unknown as Record<string, unknown>;
    patched['getMessageId'] = () => opts.messageId;
    patched['getReadAt'] = () => opts.readAt;
    patched['getDeliveredAt'] = () => opts.deliveredAt;
    patched['getSender'] = () => sender;
    patched['getReceiver'] = () => opts.receiver;
    return receipt;
  }

  function typing(receiverType: string, receiverId: string, senderUid: string): CometChat.TypingIndicator {
    const indicator = new CometChat.TypingIndicator(receiverId, receiverType);
    indicator.setSender(createMockUser({ uid: senderUid }));
    return indicator;
  }

  /** Both signals must be seeded: mutators read `all`, readers read the view. */
  function seed(...conversations: CometChat.Conversation[]): void {
    const internals = service as unknown as Record<string, { set: (v: unknown) => void }>;
    internals['allConversationsSignal'].set(conversations);
    internals['conversationsSignal'].set(conversations);
  }

  function priv(): Record<string, (...args: unknown[]) => unknown> {
    return service as unknown as Record<string, (...args: unknown[]) => unknown>;
  }

  // ─── request-builder stubs ────────────────────────────────────────────────

  function builderReturning(...pages: CometChat.Conversation[][]) {
    const fetchNext = vi.fn();
    pages.forEach(page => fetchNext.mockResolvedValueOnce(page));
    fetchNext.mockResolvedValue([]);
    const request = { fetchNext };
    const build = vi.fn(() => request);
    return { builder: { build } as unknown as CometChat.ConversationsRequestBuilder, fetchNext, build };
  }

  function builderWith(impl: () => Promise<CometChat.Conversation[]>) {
    const fetchNext = vi.fn(impl);
    const request = { fetchNext };
    const build = vi.fn(() => request);
    return { builder: { build } as unknown as CometChat.ConversationsRequestBuilder, fetchNext, build };
  }

  /**
   * Replaces the SDK builder constructor so the "no builder supplied at all"
   * fallback can be observed, including the limit the service picks.
   */
  function stubDefaultRequestBuilder(page: CometChat.Conversation[] = []) {
    const fetchNext = vi.fn().mockResolvedValue(page);
    const request = { fetchNext };
    const instance: Record<string, unknown> = { build: vi.fn(() => request) };
    const setLimit = vi.fn(() => instance);
    instance['setLimit'] = setLimit;
    let constructed = 0;
    (CometChat as unknown as Record<string, unknown>)['ConversationsRequestBuilder'] = function MockDefault() {
      constructed += 1;
      return instance;
    };
    return { fetchNext, setLimit, constructedCount: () => constructed };
  }

  /**
   * A normal fetch sleeps out the remainder of a one-second shimmer window.
   * Making every `Date.now()` read jump far ahead makes that window look long
   * expired instead of costing the suite a real second per test.
   */
  function skipShimmerDelay(): void {
    let clock = Date.now();
    track(vi.spyOn(Date, 'now').mockImplementation(() => {
      clock += 1_000_000;
      return clock;
    }));
  }

  /**
   * Several paths kick off a promise chain without returning it (the reconnect
   * refresh, the SDK's conversation-from-message lookup). None of them schedule
   * a macrotask, so draining the microtask queue is enough — and unlike
   * `vi.waitFor` it does not read a `Date.now()` that `skipShimmerDelay` moved.
   */
  const flush = async (): Promise<void> => {
    for (let i = 0; i < 25; i++) await Promise.resolve();
  };

  /**
   * `toObservable` republishes its signal from an effect, and effects only run
   * when change detection flushes — draining microtasks is not enough. Values
   * are coalesced per flush, so a test that wants to see an intermediate value
   * has to flush while that value is still the current one.
   */
  const flushEffects = async (): Promise<void> => {
    TestBed.tick();
    await flush();
  };

  // ─── wiring ───────────────────────────────────────────────────────────────

  beforeEach(() => {
    captured.reset();
    spies = [];
    originalRequestBuilder = (CometChat as unknown as Record<string, unknown>)['ConversationsRequestBuilder'];
    reconnected$ = new Subject<boolean>();
    loggedInUser = null;

    errorLog = track(vi.spyOn(CometChatLogger, 'error').mockImplementation(() => undefined));
    infoLog = track(vi.spyOn(CometChatLogger, 'info').mockImplementation(() => undefined));
    track(vi.spyOn(CometChatUIKit, 'getLoggedInUser').mockImplementation(() => loggedInUser));
    helperSpy = track(
      vi
        .spyOn(CometChat.CometChatHelper, 'getConversationFromMessage')
        .mockResolvedValue(userConversation('from-sdk'))
    );
    CometChatUIKit.conversationUpdateSettings = undefined as unknown as CometChat.ConversationUpdateSettings;

    TestBed.configureTestingModule({
      providers: [{ provide: ConnectionStateService, useValue: { reconnected$ } }],
    });
    service = TestBed.inject(ConversationsService);
  });

  afterEach(() => {
    // The event subjects are static and shared; a surviving instance would make
    // later tests' handlers fire twice.
    service?.cleanup();
    TestBed.resetTestingModule();
    spies.forEach(spy => spy.mockRestore());
    spies = [];
    CometChatUIKit.conversationUpdateSettings = undefined as unknown as CometChat.ConversationUpdateSettings;
    (CometChat as unknown as Record<string, unknown>)['ConversationsRequestBuilder'] = originalRequestBuilder;
  });

  // ==========================================================================
  // Construction wiring
  // ==========================================================================

  describe('construction', () => {
    it('registers all four SDK listeners under its own ids and tears them down with the same ids', () => {
      expect(captured.ids).toEqual({
        message: expect.stringMatching(/^conversations_\d+$/),
        user: expect.stringMatching(/^conversations_user_\d+$/),
        group: expect.stringMatching(/^conversations_group_\d+$/),
        call: expect.stringMatching(/^conversations_call_\d+$/),
      });

      service.removeListeners();

      expect(captured.removed).toEqual([
        `message:${captured.ids['message']}`,
        `user:${captured.ids['user']}`,
        `group:${captured.ids['group']}`,
        `call:${captured.ids['call']}`,
      ]);
    });

    it('unsubscribes every UI-event and call-event subscription it was handed', () => {
      expect(captured.uiSubs).toHaveLength(2);
      expect(captured.callSubs).toHaveLength(1);

      service.removeListeners();

      expect(captured.uiSubs.map(s => s.count)).toEqual([1, 1]);
      expect(captured.callSubs.map(s => s.count)).toEqual([1]);

      // A second teardown must not double-unsubscribe: the lists are emptied.
      service.removeListeners();
      expect(captured.uiSubs.map(s => s.count)).toEqual([1, 1]);
      expect(captured.callSubs.map(s => s.count)).toEqual([1]);
    });
  });

  // ==========================================================================
  // Reconnect refresh
  // ==========================================================================

  describe('reconnect refresh', () => {
    it('ignores a reconnect that arrives before the first fetch has completed', async () => {
      const def = stubDefaultRequestBuilder();

      reconnected$.next(true);
      await flush();

      expect(def.constructedCount()).toBe(0);
      expect(infoLog).not.toHaveBeenCalled();
    });

    it('refetches through the stored builder and merges onto the visible list', async () => {
      const first = userConversation('u-first');
      const second = userConversation('u-second');
      const { builder, fetchNext } = builderReturning([first], [second]);
      service.setConversationsRequestBuilder(builder);
      skipShimmerDelay();

      await service.fetchConversations();
      expect(service.getConversations()).toEqual([first]);

      reconnected$.next(true);
      await flush();

      // Silent: the existing entry was never cleared, so the new page lands behind it.
      expect(service.getConversations()).toEqual([first, second]);
      expect(fetchNext).toHaveBeenCalledTimes(2);
      expect(infoLog).toHaveBeenCalledWith(
        'ConversationsService',
        'WebSocket reconnected — refreshing conversation list'
      );
    });

    it('falls back to a fresh 30-limit builder when no request builder was ever stored', async () => {
      const seeded = userConversation('u-seeded');
      const { builder } = builderReturning([seeded]);
      skipShimmerDelay();
      // Passing the builder as an argument leaves `requestBuilder` unset.
      await service.fetchConversations(builder);

      const reconnectPage = userConversation('u-reconnect');
      const def = stubDefaultRequestBuilder([reconnectPage]);

      reconnected$.next(true);
      await flush();

      expect(def.constructedCount()).toBe(1);
      expect(def.setLimit).toHaveBeenCalledWith(30);
      expect(service.getConversations()).toEqual([seeded, reconnectPage]);
    });

    it('logs the failure when the silent reconnect refetch rejects', async () => {
      const { builder, fetchNext } = builderReturning([]);
      service.setConversationsRequestBuilder(builder);
      skipShimmerDelay();
      await service.fetchConversations();

      fetchNext.mockRejectedValue(new Error('boom'));
      reconnected$.next(true);
      await flush();

      expect(errorLog).toHaveBeenCalledWith(
        'ConversationsService',
        'Error refreshing conversations on reconnect:',
        expect.any(Error)
      );
    });
  });

  // ==========================================================================
  // fetchConversations
  // ==========================================================================

  describe('fetchConversations', () => {
    it('clears the list and raises the loading flag for the whole of a normal fetch', async () => {
      skipShimmerDelay();
      const stale = userConversation('u-stale');
      seed(stale);
      let release!: (value: CometChat.Conversation[]) => void;
      const { builder } = builderWith(() => new Promise(resolve => { release = resolve; }));

      const pending = service.fetchConversations(builder);

      expect(service.getConversations()).toEqual([]);
      expect(service.loadingState()).toBe(true);
      expect(service.isLoading()).toBe(true);
      expect(service.hasConversations()).toBe(false);

      const fresh = userConversation('u-fresh');
      release([fresh]);
      await pending;

      expect(service.getConversations()).toEqual([fresh]);
      expect(service.loadingState()).toBe(false);
      expect(service.hasConversations()).toBe(true);
      expect(service.hasMore()).toBe(true);
    });

    it('leaves the list and the loading flag untouched for the whole of a silent fetch', async () => {
      const stale = userConversation('u-stale');
      seed(stale);
      let release!: (value: CometChat.Conversation[]) => void;
      const { builder } = builderWith(() => new Promise(resolve => { release = resolve; }));

      const pending = service.fetchConversations(builder, true);

      expect(service.getConversations()).toEqual([stale]);
      expect(service.loadingState()).toBe(false);

      const fresh = userConversation('u-fresh');
      release([fresh]);
      await pending;

      expect(service.getConversations()).toEqual([stale, fresh]);
      expect(service.loadingState()).toBe(false);
    });

    it('keeps the realtime copy of a conversation that also arrives in the fetched page', async () => {
      skipShimmerDelay();
      let release!: (value: CometChat.Conversation[]) => void;
      const { builder } = builderWith(() => new Promise(resolve => { release = resolve; }));

      const pending = service.fetchConversations(builder);

      // A realtime listener promotes a brand-new conversation mid-flight.
      const realtime = userConversation('u-race', { name: 'realtime copy' });
      captured.uiHandlers!['addConversationToTop'](realtime);

      const fromPage = userConversation('u-race', { name: 'page copy' });
      const other = userConversation('u-other');
      release([fromPage, other]);
      await pending;

      expect(service.getConversations()).toHaveLength(2);
      expect(service.getConversations()[0]).toBe(realtime);
      expect(service.getConversations()[1]).toBe(other);
    });

    it('prefers the builder it was passed over the stored one', async () => {
      skipShimmerDelay();
      const storedConv = userConversation('u-stored');
      const passedConv = userConversation('u-passed');
      const stored = builderReturning([storedConv]);
      const passed = builderReturning([passedConv]);
      service.setConversationsRequestBuilder(stored.builder);

      await service.fetchConversations(passed.builder);

      expect(service.getConversations()).toEqual([passedConv]);
      expect(stored.build).not.toHaveBeenCalled();
    });

    it('builds a default 30-limit request when neither a passed nor a stored builder exists', async () => {
      skipShimmerDelay();
      const fetched = userConversation('u-default');
      const def = stubDefaultRequestBuilder([fetched]);

      await service.fetchConversations();

      expect(def.constructedCount()).toBe(1);
      expect(def.setLimit).toHaveBeenCalledWith(30);
      expect(service.getConversations()).toEqual([fetched]);
    });

    it('re-opens pagination after a fresh first page', async () => {
      skipShimmerDelay();
      const { builder } = builderReturning([], []);
      await service.fetchConversations(builder);
      await service.fetchNextConversations();
      expect(service.hasMore()).toBe(false);

      await service.fetchConversations(builder);

      expect(service.hasMore()).toBe(true);
    });

    it('stops loading and publishes a contextual error when the fetch fails', async () => {
      const cause = new Error('boom');
      const fetchNext = vi.fn().mockRejectedValue(cause);
      const builder = { build: vi.fn(() => ({ fetchNext })) } as unknown as CometChat.ConversationsRequestBuilder;

      await expect(service.fetchConversations(builder)).rejects.toThrow();

      expect(service.loadingState()).toBe(false);
      expect(service.hasError()).toBe(true);
      const published = service.errorState() as (Error & { originalError: unknown; context: string }) | null;
      expect(published?.context).toBe('fetchConversations');
      expect(published?.originalError).toBe(cause);

      service.clearError();
      expect(service.errorState()).toBeNull();
      expect(service.hasError()).toBe(false);
    });

    it('retries a recoverable fetch failure and succeeds on the second attempt', async () => {
      skipShimmerDelay();
      const recovered = userConversation('u-recovered');
      const fetchNext = vi
        .fn()
        .mockRejectedValueOnce(new Error('network timeout'))
        .mockResolvedValue([recovered]);
      const builder = { build: vi.fn(() => ({ fetchNext })) } as unknown as CometChat.ConversationsRequestBuilder;

      await service.fetchConversations(builder);

      expect(fetchNext).toHaveBeenCalledTimes(2);
      expect(service.getConversations()).toEqual([recovered]);
      expect(service.errorState()).toBeNull();
    });
  });

  // ==========================================================================
  // Pagination
  // ==========================================================================

  describe('fetchNextConversations', () => {
    it('reports no next page before any request has been built', async () => {
      await expect(service.fetchNextConversations()).resolves.toBe(false);
    });

    it('does not start a second request while a fetch is already in flight', async () => {
      skipShimmerDelay();
      let release!: (value: CometChat.Conversation[]) => void;
      const { builder, fetchNext } = builderWith(() => new Promise(resolve => { release = resolve; }));

      const pending = service.fetchConversations(builder);
      await expect(service.fetchNextConversations()).resolves.toBe(true);
      expect(fetchNext).toHaveBeenCalledTimes(1);

      release([]);
      await pending;
    });

    it('appends the next page and drops an entry already promoted by a realtime event', async () => {
      skipShimmerDelay();
      const firstPage = userConversation('u-1');
      const duplicate = userConversation('u-1', { name: 'page copy' });
      const fresh = userConversation('u-2');
      const { builder } = builderReturning([firstPage], [duplicate, fresh]);

      await service.fetchConversations(builder);
      await expect(service.fetchNextConversations()).resolves.toBe(true);

      expect(service.getConversations()).toHaveLength(2);
      expect(service.getConversations()[0]).toBe(firstPage);
      expect(service.getConversations()[1]).toBe(fresh);
      expect(service.hasMore()).toBe(true);
    });

    it('reports the end of the list when the next page comes back empty', async () => {
      skipShimmerDelay();
      const only = userConversation('u-1');
      const { builder } = builderReturning([only], []);

      await service.fetchConversations(builder);

      await expect(service.fetchNextConversations()).resolves.toBe(false);
      expect(service.hasMore()).toBe(false);
      expect(service.getConversations()).toEqual([only]);
    });

    it('publishes a contextual error and returns false when the next page fails', async () => {
      skipShimmerDelay();
      const cause = new Error('boom');
      const fetchNext = vi.fn().mockResolvedValueOnce([]).mockRejectedValue(cause);
      const builder = { build: vi.fn(() => ({ fetchNext })) } as unknown as CometChat.ConversationsRequestBuilder;
      await service.fetchConversations(builder);

      await expect(service.fetchNextConversations()).resolves.toBe(false);

      expect(service.loadingState()).toBe(false);
      const published = service.errorState() as (Error & { originalError: unknown; context: string }) | null;
      expect(published?.context).toBe('fetchNextConversations');
      expect(published?.originalError).toBe(cause);
    });

    it('discards the built request when a new request builder is installed', async () => {
      skipShimmerDelay();
      const { builder } = builderReturning([userConversation('u-1')], [userConversation('u-2')]);
      await service.fetchConversations(builder);
      await expect(service.fetchNextConversations()).resolves.toBe(true);

      service.setConversationsRequestBuilder(builderReturning([]).builder);

      await expect(service.fetchNextConversations()).resolves.toBe(false);
    });
  });

  // ==========================================================================
  // deleteConversation
  // ==========================================================================

  describe('deleteConversation', () => {
    it('removes the conversation and announces the deletion on success', async () => {
      const deleteSpy = track(vi.spyOn(CometChat, 'deleteConversation').mockResolvedValue('ok'));
      const conv = userConversation('u-1');
      seed(conv, userConversation('u-2'));
      const announced: CometChat.Conversation[] = [];
      const sub = CometChatConversationEvents.ccConversationDeleted.subscribe(c => announced.push(c));

      await service.deleteConversation('u-1', USER);
      sub.unsubscribe();

      expect(deleteSpy).toHaveBeenCalledWith('u-1', USER);
      expect(service.getConversations().map(c => c.getConversationId())).toEqual(['u-2']);
      expect(announced).toEqual([conv]);
    });

    it('publishes a contextual error when the delete fails outright', async () => {
      const cause = new Error('boom');
      track(vi.spyOn(CometChat, 'deleteConversation').mockRejectedValue(cause));
      const conv = userConversation('u-1');
      seed(conv);

      await expect(service.deleteConversation('u-1', USER)).rejects.toThrow();

      expect(service.getConversations()).toEqual([conv]);
      const published = service.errorState() as (Error & { context: string }) | null;
      expect(published?.context).toBe('deleteConversation');
    });

    it('retries a recoverable delete failure and removes the conversation on the retry', async () => {
      const deleteSpy = track(
        vi
          .spyOn(CometChat, 'deleteConversation')
          .mockRejectedValueOnce(new Error('connection lost'))
          .mockResolvedValue('ok')
      );
      seed(userConversation('u-1'));

      await service.deleteConversation('u-1', USER);

      expect(deleteSpy).toHaveBeenCalledTimes(2);
      expect(service.getConversations()).toEqual([]);
      expect(service.errorState()).toBeNull();
    });
  });

  // ==========================================================================
  // Search
  // ==========================================================================

  describe('searchConversations', () => {
    it('restores the full list for blank search text', () => {
      const a = userConversation('u-a', { name: 'Alice' });
      const b = userConversation('u-b', { name: 'Bob' });
      seed(a, b);
      service.searchConversations('alice');
      expect(service.getConversations()).toEqual([a]);

      service.searchConversations('   ');

      expect(service.getConversations()).toEqual([a, b]);
    });

    it('matches on the text of a text last message', () => {
      const a = userConversation('u-a', {
        name: 'Alice',
        lastMessage: createMockTextMessage({ receiverId: 'u-a', text: 'budget review' }),
      });
      const b = userConversation('u-b', {
        name: 'Bob',
        lastMessage: createMockTextMessage({ receiverId: 'u-b', text: 'lunch plans' }),
      });
      seed(a, b);

      service.searchConversations('BUDGET');

      expect(service.getConversations()).toEqual([a]);
    });

    it('cannot match on a non-text last message', () => {
      const media = createMockMediaMessage({ receiverId: 'u-a', fileName: 'budget.pdf' });
      const a = userConversation('u-a', { name: 'Alice', lastMessage: media });
      seed(a);

      service.searchConversations('budget');

      expect(service.getConversations()).toEqual([]);
    });
  });

  // ==========================================================================
  // List manipulation
  // ==========================================================================

  describe('list manipulation', () => {
    it('does not announce a deletion for an id that is not in the list', () => {
      const conv = userConversation('u-1');
      seed(conv);
      const announced: CometChat.Conversation[] = [];
      const sub = CometChatConversationEvents.ccConversationDeleted.subscribe(c => announced.push(c));

      service.removeConversation('u-missing');
      sub.unsubscribe();

      expect(announced).toEqual([]);
      expect(service.getConversations()).toEqual([conv]);
    });

    it('finds a conversation by entity id and returns null for an unknown one', () => {
      const conv = userConversation('u-1');
      seed(conv);

      expect(service.findConversation('u-1')).toBe(conv);
      expect(service.findConversation('u-nope')).toBeNull();
    });

    it('refuses to replace a conversation that is not in the list', () => {
      const existing = userConversation('u-1');
      seed(existing);

      expect(service.replaceConversation(userConversation('u-other'))).toBe(false);
      expect(service.getConversations()).toEqual([existing]);

      const replacement = userConversation('u-1', { name: 'renamed' });
      expect(service.replaceConversation(replacement)).toBe(true);
      expect(service.getConversations()[0]).toBe(replacement);
    });

    it('moves a known conversation to the top and refuses an unknown one', () => {
      const a = userConversation('u-a');
      const b = userConversation('u-b');
      seed(a, b);

      expect(service.moveConversationToTop('u-missing')).toBe(false);
      expect(service.getConversations()).toEqual([a, b]);

      expect(service.moveConversationToTop('u-b')).toBe(true);
      expect(service.getConversations()).toEqual([b, a]);
    });

    it('clamps an out-of-range insert index to the ends of the list', () => {
      const a = userConversation('u-a');
      seed(a);
      const before = userConversation('u-before');
      const after = userConversation('u-after');

      service.insertConversationAt(before, -5);
      service.insertConversationAt(after, 99);

      expect(service.getConversations()).toEqual([before, a, after]);
      expect(service.getConversationIndex('u-a')).toBe(1);
      expect(service.getConversationIndex('u-missing')).toBe(-1);
    });

  });

  // ==========================================================================
  // Public read API
  // ==========================================================================

  describe('public read API', () => {
    /** `mock-sdk` has no pin support, so the predicate is patched on. */
    function pinned(conversation: CometChat.Conversation): CometChat.Conversation {
      (conversation as unknown as Record<string, unknown>)['isPinned'] = () => true;
      return conversation;
    }

    it('shows pinned conversations first without disturbing the stored order', () => {
      const newest = userConversation('u-newest');
      const pin = pinned(userConversation('u-pinned'));
      const older = userConversation('u-older');
      seed(newest, pin, older);

      // The view applies the pin rule...
      expect(service.conversations()).toEqual([pin, newest, older]);
      // ...while the stored list stays purely recency-ordered.
      expect(service.getConversations()).toEqual([newest, pin, older]);
    });

    it('keeps the pin rule applied after a mutation that would otherwise bury the pin', () => {
      const pin = pinned(userConversation('u-pinned'));
      const other = userConversation('u-other');
      seed(pin, other);

      // Promoting the unpinned conversation puts it first in the stored list.
      service.updateConversationList(other, textFor('u-other', { text: 'newest' }));

      expect(service.getConversations()[0]).toBe(other);
      expect(service.conversations()[0]).toBe(pin);
    });

    it('hands back the stored array unchanged when nothing is pinned', () => {
      seed(userConversation('u-a'), userConversation('u-b'));

      expect(service.conversations()).toBe(service.getConversations());
    });

    it('republishes the list and the loading flag on their observables', async () => {
      const emitted: CometChat.Conversation[][] = [];
      const loading: boolean[] = [];
      const subs = [
        service.conversations$.subscribe(v => emitted.push(v)),
        service.loadingState$.subscribe(v => loading.push(v)),
      ];
      skipShimmerDelay();
      let release!: (value: CometChat.Conversation[]) => void;
      const { builder } = builderWith(() => new Promise(resolve => { release = resolve; }));

      const pending = service.fetchConversations(builder);
      await flushEffects();
      expect(loading.at(-1)).toBe(true);

      const conv = userConversation('u-a');
      release([conv]);
      await pending;
      await flushEffects();
      subs.forEach(s => s.unsubscribe());

      expect(emitted.at(-1)).toEqual([conv]);
      expect(loading.at(-1)).toBe(false);
    });

    it('republishes the active conversation, the error and the typing map as observables', async () => {
      const active: (CometChat.Conversation | null)[] = [];
      const errors: (Error | null)[] = [];
      const typingSeen: string[][] = [];
      const subs = [
        service.activeConversation$.subscribe(v => active.push(v)),
        service.errorState$.subscribe(v => errors.push(v)),
        service.typingIndicators$.subscribe(v => typingSeen.push([...v.keys()])),
      ];
      const conv = userConversation('u-a');

      service.setActiveConversation(conv);
      priv()['setError'](new Error('published'));
      captured.messageCallbacks!['onTypingStarted'](typing(USER, 'me', 'u-a'));
      await flushEffects();
      subs.forEach(s => s.unsubscribe());

      expect(active.at(-1)).toBe(conv);
      expect(errors.at(-1)?.message).toBe('published');
      expect(typingSeen.at(-1)).toEqual(['u-a']);
    });
  });

  // ==========================================================================
  // updateConversationList
  // ==========================================================================

  describe('updateConversationList', () => {
    it('stores the passed message as the last message and promotes the conversation', () => {
      const a = userConversation('u-a');
      const b = userConversation('u-b');
      seed(a, b);
      const msg = textFor('u-b', { text: 'newest' });

      service.updateConversationList(b, msg);

      expect(service.getConversations()).toEqual([b, a]);
      expect(b.getLastMessage()).toBe(msg);
    });

    it('appends a conversation that was not already in the list', () => {
      const a = userConversation('u-a');
      seed(a);
      const fresh = userConversation('u-new');

      service.updateConversationList(fresh, textFor('u-new'));

      expect(service.getConversations()).toEqual([fresh, a]);
    });

    it('falls back to the conversation\'s own last message when none is passed', () => {
      const own = createMockTextMessage({ receiverId: 'u-b', text: 'stored' });
      const a = userConversation('u-a');
      const b = userConversation('u-b', { lastMessage: own });
      // The Conversation constructor re-wraps the message it is handed, so the
      // stored last message is compared by content rather than by reference.
      const stored = b.getLastMessage();
      seed(a, b);

      service.updateConversationList(b);

      expect(service.getConversations()).toEqual([b, a]);
      expect(b.getLastMessage()).toBe(stored);
      expect(b.getLastMessage().getId()).toBe(own.getId());
      expect((b.getLastMessage() as CometChat.TextMessage).getText()).toBe('stored');
    });

    it('promotes a conversation that has no last message at all', () => {
      const a = userConversation('u-a');
      seed(a);
      const empty = {
        getConversationWith: () => createMockUser({ uid: 'u-empty' }),
        getLastMessage: () => undefined,
      } as unknown as CometChat.Conversation;

      service.updateConversationList(empty);

      expect(service.getConversations()[0]).toBe(empty);
      expect(service.getConversations()).toHaveLength(2);
    });

    it('ignores anything that is not an SDK message', () => {
      const a = userConversation('u-a');
      const b = userConversation('u-b');
      seed(a, b);

      service.updateConversationList(b, { getCategory: () => 'message' } as unknown as CometChat.BaseMessage);

      expect(service.getConversations()).toEqual([a, b]);
    });

    it('ignores a thread reply while reply updates are switched off', () => {
      const a = userConversation('u-a');
      const b = userConversation('u-b');
      seed(a, b);
      const reply = createMockTextMessage({ receiverId: 'u-b', parentMessageId: 42 });

      service.updateConversationList(b, reply);

      expect(service.getConversations()).toEqual([a, b]);
      expect(b.getLastMessage()).not.toBe(reply);
    });

    it('increments the unread count for an incoming message in a background conversation', () => {
      loggedInUser = createMockUser({ uid: 'me' });
      const conv = userConversation('u-a', { unread: 2 });
      seed(conv);

      service.updateConversationList(conv, textFor('u-a', { sender: createMockUser({ uid: 'them' }) }));

      expect(conv.getUnreadMessageCount()).toBe(3);
    });

    it('treats an absent unread count as zero when incrementing', () => {
      loggedInUser = createMockUser({ uid: 'me' });
      const setUnread = vi.fn();
      const conv = {
        getConversationWith: () => createMockUser({ uid: 'u-a' }),
        getLastMessage: () => undefined,
        getUnreadMessageCount: () => undefined,
        setUnreadMessageCount: setUnread,
        getConversationType: () => USER,
        getConversationId: () => 'u-a',
        setLastMessage: vi.fn(),
      } as unknown as CometChat.Conversation;
      seed();

      service.updateConversationList(conv, textFor('u-a', { sender: createMockUser({ uid: 'them' }) }));

      expect(setUnread).toHaveBeenCalledWith(1);
    });

    it('leaves the unread count alone for the conversation that is currently open', () => {
      loggedInUser = createMockUser({ uid: 'me' });
      const conv = userConversation('u-a', { unread: 2 });
      seed(conv);
      service.setActiveConversation(conv);

      service.updateConversationList(conv, textFor('u-a', { sender: createMockUser({ uid: 'them' }) }));

      expect(conv.getUnreadMessageCount()).toBe(2);
    });

    it('leaves the unread count alone for the logged-in user\'s own message', () => {
      loggedInUser = createMockUser({ uid: 'me' });
      const conv = userConversation('u-a', { unread: 2 });
      seed(conv);

      service.updateConversationList(conv, textFor('u-a', { sender: createMockUser({ uid: 'me' }) }));

      expect(conv.getUnreadMessageCount()).toBe(2);
    });

    it('leaves the unread count alone while nobody is logged in', () => {
      const conv = userConversation('u-a', { unread: 2 });
      seed(conv);

      service.updateConversationList(conv, textFor('u-a', { sender: createMockUser({ uid: 'them' }) }));

      expect(conv.getUnreadMessageCount()).toBe(2);
    });

    it('syncs the member count from a group action onto the group conversation', () => {
      const conv = groupConversation('g-1', { membersCount: 5 });
      seed(conv);
      const actionGroup = createMockGroup({ guid: 'g-1', membersCount: 11 });
      const action = groupAction('g-1', { actionFor: actionGroup, receiver: createMockGroup({ guid: 'g-1' }) });

      service.updateConversationList(conv, action);

      expect((conv.getConversationWith() as CometChat.Group).getMembersCount()).toBe(11);
      expect(conv.getLastMessage()).toBe(action);
    });

    it('does not sync the member count when the action group is not the receiving group', () => {
      const conv = groupConversation('g-1', { membersCount: 5 });
      seed(conv);
      const action = groupAction('g-1', {
        actionFor: createMockGroup({ guid: 'g-other', membersCount: 11 }),
        receiver: createMockGroup({ guid: 'g-1' }),
      });

      service.updateConversationList(conv, action);

      expect((conv.getConversationWith() as CometChat.Group).getMembersCount()).toBe(5);
    });

    it('does not sync the member count when the action receiver is not a group', () => {
      const conv = groupConversation('g-1', { membersCount: 5 });
      seed(conv);
      const action = groupAction('g-1', {
        actionFor: createMockGroup({ guid: 'g-1', membersCount: 11 }),
        receiver: createMockUser({ uid: 'someone' }),
      });

      service.updateConversationList(conv, action);

      expect((conv.getConversationWith() as CometChat.Group).getMembersCount()).toBe(5);
    });

    it('does not sync the member count when the action is not for a group', () => {
      const conv = groupConversation('g-1', { membersCount: 5 });
      seed(conv);
      const action = groupAction('g-1', {
        actionFor: createMockUser({ uid: 'someone' }),
        receiver: createMockGroup({ guid: 'g-1', membersCount: 11 }),
      });

      service.updateConversationList(conv, action);

      expect((conv.getConversationWith() as CometChat.Group).getMembersCount()).toBe(5);
    });

    it('does not sync the member count when the action was not addressed to a group', () => {
      const conv = groupConversation('g-1', { membersCount: 5 });
      seed(conv);
      const action = groupAction('g-1', {
        receiverType: USER,
        actionFor: createMockGroup({ guid: 'g-1', membersCount: 11 }),
        receiver: createMockGroup({ guid: 'g-1', membersCount: 11 }),
      });

      service.updateConversationList(conv, action);

      expect((conv.getConversationWith() as CometChat.Group).getMembersCount()).toBe(5);
    });

    it('does not sync the member count onto a one-to-one conversation', () => {
      const conv = createMockConversation({
        type: 'user',
        conversationWith: createMockUser({ uid: 'u-a' }),
      });
      // The constructor re-wraps the entity, so identity is captured up front.
      const storedEntity = conv.getConversationWith();
      seed(conv);
      const action = groupAction('u-a', {
        actionFor: createMockGroup({ guid: 'g-1', membersCount: 11 }),
        receiver: createMockGroup({ guid: 'g-1', membersCount: 11 }),
      });

      service.updateConversationList(conv, action);

      expect(conv.getConversationWith()).toBe(storedEntity);
      expect(conv.getLastMessage()).toBe(action);
    });
  });

  // ==========================================================================
  // Receipts
  // ==========================================================================

  describe('receipts', () => {
    it('sets the unread count on a known conversation and ignores an unknown one', () => {
      const conv = userConversation('u-a', { unread: 7 });
      seed(conv);

      service.updateConversationUnreadCount('u-a', 0);
      expect(conv.getUnreadMessageCount()).toBe(0);

      service.updateConversationUnreadCount('u-missing', 5);
      expect(conv.getUnreadMessageCount()).toBe(0);
    });

    it('logs and swallows a failure while setting the unread count', () => {
      const broken = {
        getConversationWith: () => createMockUser({ uid: 'u-a' }),
        setUnreadMessageCount: () => { throw new Error('read-only'); },
      } as unknown as CometChat.Conversation;
      seed(broken);

      service.updateConversationUnreadCount('u-a', 0);

      expect(errorLog).toHaveBeenCalledWith(
        'ConversationsService',
        'Error updating unread count:',
        expect.any(Error)
      );
    });

    it('clears the unread count and stamps readAt on the matching last message', () => {
      const last = createMockTextMessage({ id: 77, receiverId: 'u-a' });
      const conv = userConversation('u-a', { unread: 4, lastMessage: last });
      seed(conv);
      const read = createMockTextMessage({ id: 77, receiverId: 'u-a', readAt: 1700000000 });

      service.updateConversationReadStatus('u-a', read);

      expect(conv.getUnreadMessageCount()).toBe(0);
      expect(conv.getLastMessage().getReadAt()).toBe(1700000000);
    });

    it('ignores a read status update for a conversation that is not in the list', () => {
      const conv = userConversation('u-a', { unread: 4 });
      seed(conv);

      service.updateConversationReadStatus('u-missing', createMockTextMessage({ id: 1 }));

      expect(conv.getUnreadMessageCount()).toBe(4);
    });

    it('clears the unread count but leaves an older last message unstamped', () => {
      const last = createMockTextMessage({ id: 77, receiverId: 'u-a' });
      const conv = userConversation('u-a', { unread: 4, lastMessage: last });
      seed(conv);

      service.updateConversationReadStatus('u-a', createMockTextMessage({ id: 12, readAt: 1700000000 }));

      expect(conv.getUnreadMessageCount()).toBe(0);
      expect(conv.getLastMessage().getReadAt()).toBeFalsy();
    });

    it('clears the unread count without stamping when the receipt carries no readAt', () => {
      const last = createMockTextMessage({ id: 77, receiverId: 'u-a' });
      const conv = userConversation('u-a', { unread: 4, lastMessage: last });
      seed(conv);

      service.updateConversationReadStatus('u-a', createMockTextMessage({ id: 77 }));

      expect(conv.getUnreadMessageCount()).toBe(0);
      expect(conv.getLastMessage().getReadAt()).toBeFalsy();
    });

    it('clears the unread count on a conversation that has no last message', () => {
      const setUnread = vi.fn();
      const conv = {
        getConversationWith: () => createMockUser({ uid: 'u-a' }),
        setUnreadMessageCount: setUnread,
        getLastMessage: () => undefined,
      } as unknown as CometChat.Conversation;
      seed(conv);

      service.updateConversationReadStatus('u-a', createMockTextMessage({ id: 77, readAt: 1 }));

      expect(setUnread).toHaveBeenCalledWith(0);
      expect(errorLog).not.toHaveBeenCalled();
    });

    it('logs and swallows a failure while updating read status', () => {
      const broken = {
        getConversationWith: () => createMockUser({ uid: 'u-a' }),
        setUnreadMessageCount: () => { throw new Error('read-only'); },
      } as unknown as CometChat.Conversation;
      seed(broken);

      service.updateConversationReadStatus('u-a', createMockTextMessage({ id: 1 }));

      expect(errorLog).toHaveBeenCalledWith(
        'ConversationsService',
        'Error updating read status:',
        expect.any(Error)
      );
    });

    it('stamps a one-to-one read receipt onto the matching conversation', () => {
      const last = createMockTextMessage({ id: 50, receiverId: 'u-a' });
      const conv = userConversation('u-a', { lastMessage: last });
      seed(conv);

      captured.messageCallbacks!['onMessagesRead'](
        makeReceipt({ messageId: '50', senderUid: 'u-a', readAt: 1700000500 })
      );

      // A read receipt implies delivery, so both stamps land on the stored message.
      expect(conv.getLastMessage().getReadAt()).toBe(1700000500);
      expect(conv.getLastMessage().getDeliveredAt()).toBe(1700000500);
    });

    it('stamps a one-to-one delivery receipt without marking the message read', () => {
      const last = createMockTextMessage({ id: 50, receiverId: 'u-a' });
      const conv = userConversation('u-a', { lastMessage: last });
      seed(conv);

      captured.messageCallbacks!['onMessagesDelivered'](
        makeReceipt({ messageId: '50', senderUid: 'u-a', deliveredAt: 1700000100 })
      );

      expect(conv.getLastMessage().getDeliveredAt()).toBe(1700000100);
      expect(conv.getLastMessage().getReadAt()).toBeFalsy();
    });

    it('stamps a group read-by-all receipt onto the matching group conversation', () => {
      const last = createMockTextMessage({ id: 60, receiverId: 'g-1', receiverType: GROUP });
      const conv = groupConversation('g-1', { lastMessage: last });
      seed(conv);

      captured.messageCallbacks!['onMessagesReadByAll'](
        makeReceipt({ messageId: '60', receiver: 'g-1', readAt: 1700000600 })
      );

      expect(conv.getLastMessage().getReadAt()).toBe(1700000600);
    });

    it('stamps a group delivered-to-all receipt onto the matching group conversation', () => {
      const last = createMockTextMessage({ id: 60, receiverId: 'g-1', receiverType: GROUP });
      const conv = groupConversation('g-1', { lastMessage: last });
      seed(conv);

      captured.messageCallbacks!['onMessagesDeliveredToAll'](
        makeReceipt({ messageId: '60', receiver: 'g-1', deliveredAt: 1700000200 })
      );

      expect(conv.getLastMessage().getDeliveredAt()).toBe(1700000200);
    });

    it('leaves the stored list identical when no conversation matches the receipt', () => {
      const conv = userConversation('u-a', { lastMessage: createMockTextMessage({ id: 50, receiverId: 'u-a' }) });
      seed(conv);
      const before = service.getConversations();

      captured.messageCallbacks!['onMessagesRead'](
        makeReceipt({ messageId: '50', senderUid: 'u-somebody-else', readAt: 1 })
      );

      expect(service.getConversations()).toBe(before);
    });

    it('logs and swallows a receipt it cannot read', () => {
      seed(userConversation('u-a'));
      const broken = { getMessageId: () => { throw new Error('malformed'); } } as unknown as CometChat.MessageReceipt;

      captured.messageCallbacks!['onMessagesRead'](broken);

      expect(errorLog).toHaveBeenCalledWith(
        'ConversationsService',
        'Error handling receipt:',
        expect.any(Error)
      );
    });
  });

  // ==========================================================================
  // SDK listener callbacks
  // ==========================================================================

  describe('SDK listener callbacks', () => {
    it('routes every message-received callback into the conversation list', () => {
      const a = userConversation('u-a');
      const b = userConversation('u-b');
      seed(a, b);
      const names = [
        'onTextMessageReceived',
        'onMediaMessageReceived',
        'onCustomMessageReceived',
        'onInteractiveMessageReceived',
        'onCardMessageReceived',
        'onAIAssistantMessageReceived',
      ];

      names.forEach((name, i) => {
        const target = i % 2 === 0 ? b : a;
        const other = i % 2 === 0 ? a : b;
        const msg = textFor(target.getConversationId(), { text: `ping ${i}` });

        captured.messageCallbacks![name](msg);

        expect(service.getConversations()[0]).toBe(target);
        expect(service.getConversations()[1]).toBe(other);
        expect(target.getLastMessage()).toBe(msg);
      });
    });

    it('replaces the last message when a message is edited', () => {
      const original = createMockTextMessage({ id: 9, receiverId: 'u-a', text: 'before' });
      const conv = userConversation('u-a', { lastMessage: original });
      seed(userConversation('u-b'), conv);
      const edited = textFor('u-a', { id: 9, text: 'after' });

      captured.messageCallbacks!['onMessageEdited'](edited);

      expect(conv.getLastMessage()).toBe(edited);
      expect(service.getConversations()[0]).toBe(conv);
    });

    it('replaces the last message when a message is deleted', () => {
      const original = createMockTextMessage({ id: 9, receiverId: 'u-a', text: 'before' });
      const conv = userConversation('u-a', { lastMessage: original });
      seed(conv);
      const tombstone = textFor('u-a', { id: 9, text: 'deleted' });

      captured.messageCallbacks!['onMessageDeleted'](tombstone);

      expect(conv.getLastMessage()).toBe(tombstone);
    });

    it('records a one-to-one typing indicator against its sender', () => {
      captured.messageCallbacks!['onTypingStarted'](typing(USER, 'me', 'u-a'));

      expect([...service.typingIndicators().keys()]).toEqual(['u-a']);
    });

    it('records a group typing indicator against the group', () => {
      captured.messageCallbacks!['onTypingStarted'](typing(GROUP, 'g-1', 'u-a'));

      expect([...service.typingIndicators().keys()]).toEqual(['g-1']);
    });

    it('drops the typing indicator again when typing ends', () => {
      captured.messageCallbacks!['onTypingStarted'](typing(USER, 'me', 'u-a'));
      captured.messageCallbacks!['onTypingStarted'](typing(USER, 'me', 'u-b'));

      captured.messageCallbacks!['onTypingEnded'](typing(USER, 'me', 'u-a'));

      expect([...service.typingIndicators().keys()]).toEqual(['u-b']);
    });

    it('logs and swallows a typing-started indicator it cannot key', () => {
      const broken = { getReceiverType: () => { throw new Error('malformed'); } } as unknown as CometChat.TypingIndicator;

      captured.messageCallbacks!['onTypingStarted'](broken);

      expect(errorLog).toHaveBeenCalledWith(
        'ConversationsService',
        'Error handling typing started:',
        expect.any(Error)
      );
      expect(service.typingIndicators().size).toBe(0);
    });

    it('logs and swallows a typing-ended indicator it cannot key', () => {
      const broken = { getReceiverType: () => { throw new Error('malformed'); } } as unknown as CometChat.TypingIndicator;

      captured.messageCallbacks!['onTypingEnded'](broken);

      expect(errorLog).toHaveBeenCalledWith(
        'ConversationsService',
        'Error handling typing ended:',
        expect.any(Error)
      );
    });

    it('applies a user status change only to that user\'s one-to-one conversation', () => {
      const them = createMockUser({ uid: 'u-a', status: 'online' });
      const someoneElse = createMockUser({ uid: 'u-b', status: 'online' });
      const theirConv = createMockConversation({ type: 'user', conversationWith: them });
      const otherConv = createMockConversation({ type: 'user', conversationWith: someoneElse });
      const groupConv = groupConversation('g-1');
      seed(theirConv, otherConv, groupConv);

      captured.userCallback!(createMockUser({ uid: 'u-a', status: 'offline' }));

      expect((theirConv.getConversationWith() as CometChat.User).getStatus()).toBe('offline');
      expect((otherConv.getConversationWith() as CometChat.User).getStatus()).toBe('online');
    });

    it('logs and swallows a failure while applying a user status change', () => {
      const broken = {
        getConversationWith: () => { throw new Error('detached'); },
      } as unknown as CometChat.Conversation;
      seed(broken);

      captured.userCallback!(createMockUser({ uid: 'u-a' }));

      expect(errorLog).toHaveBeenCalledWith(
        'ConversationsService',
        'Error handling user status change:',
        expect.any(Error)
      );
    });

    it('routes a group listener action into the conversation list', () => {
      const conv = groupConversation('g-1', { membersCount: 5 });
      seed(userConversation('u-a'), conv);
      const action = groupAction('g-1', {
        actionFor: createMockGroup({ guid: 'g-1', membersCount: 6 }),
        receiver: createMockGroup({ guid: 'g-1' }),
      });

      captured.groupCallback!(action);

      expect(service.getConversations()[0]).toBe(conv);
      expect((conv.getConversationWith() as CometChat.Group).getMembersCount()).toBe(6);
    });

    it('routes a call listener event into the conversation list', () => {
      const conv = userConversation('u-a');
      seed(userConversation('u-b'), conv);
      const call = new CometChat.Call(
        'u-a',
        CometChat.CALL_TYPE.AUDIO,
        USER,
        CometChatUIKitConstants.MessageCategory.call
      );
      call.setConversationId('u-a');
      call.setSender(createMockUser({ uid: 'u-a' }));

      captured.callCallback!(call);

      expect(service.getConversations()[0]).toBe(conv);
      expect(conv.getLastMessage()).toBe(call);
    });
  });

  // ==========================================================================
  // UI event bus handlers
  // ==========================================================================

  describe('UI event handlers', () => {
    it('routes a call raised on the UI event bus into the conversation list', () => {
      const conv = userConversation('u-a');
      seed(userConversation('u-b'), conv);
      const call = new CometChat.Call(
        'u-a',
        CometChat.CALL_TYPE.VIDEO,
        USER,
        CometChatUIKitConstants.MessageCategory.call
      );
      call.setConversationId('u-a');
      call.setSender(createMockUser({ uid: 'u-a' }));

      captured.callEventHandler!(call);

      expect(service.getConversations()[0]).toBe(conv);
    });

    it('refreshes a single conversation from a UI-event message', () => {
      const conv = userConversation('u-a');
      seed(userConversation('u-b'), conv);
      const msg = textFor('u-a', { text: 'from the bus' });

      captured.uiHandlers!['refreshSingleConversation'](msg);

      expect(service.getConversations()[0]).toBe(conv);
      expect(conv.getLastMessage()).toBe(msg);
    });

    it('removes a conversation silently, without announcing a deletion', () => {
      const a = userConversation('u-a');
      const b = userConversation('u-b');
      seed(a, b);
      const announced: CometChat.Conversation[] = [];
      const sub = CometChatConversationEvents.ccConversationDeleted.subscribe(c => announced.push(c));

      captured.uiHandlers!['removeConversationSilently']('u-a');
      captured.uiHandlers!['removeConversationFromList']('u-b');
      sub.unsubscribe();

      expect(service.getConversations()).toEqual([]);
      expect(announced).toEqual([]);
    });

    it('swaps the updated group into every conversation that is with that group', () => {
      const stale = createMockGroup({ guid: 'g-1', membersCount: 2 });
      const matching = createMockConversation({ type: 'group', conversationWith: stale });
      const otherGroup = groupConversation('g-2');
      const userConv = userConversation('u-a');
      seed(matching, otherGroup, userConv);
      const renamed = createMockGroup({ guid: 'g-1', name: 'Renamed', membersCount: 9 });

      captured.uiHandlers!['updateGroupOnConversation'](renamed);

      expect(matching.getConversationWith()).toBe(renamed);
      expect(otherGroup.getConversationWith()).not.toBe(renamed);
      expect(userConv.getConversationWith()).not.toBe(renamed);
    });

    it('swaps the updated user into every conversation that is with that user', () => {
      const stale = createMockUser({ uid: 'u-a', name: 'Old' });
      const matching = createMockConversation({ type: 'user', conversationWith: stale });
      const otherUser = userConversation('u-b');
      const groupConv = groupConversation('g-1');
      seed(matching, otherUser, groupConv);
      const renamed = createMockUser({ uid: 'u-a', name: 'New' });

      captured.uiHandlers!['updateUserOnConversation'](renamed);

      expect(matching.getConversationWith()).toBe(renamed);
      expect(otherUser.getConversationWith()).not.toBe(renamed);
      expect(groupConv.getConversationWith()).not.toBe(renamed);
    });

    it('adds a conversation to the top, replacing any copy already in the list', () => {
      const existing = userConversation('u-a');
      seed(existing);
      const fresh = userConversation('u-new');

      captured.uiHandlers!['addConversationToTop'](fresh);
      expect(service.getConversations()).toEqual([fresh, existing]);

      // The incoming copy goes first, so dedupe keeps it and drops the stale one.
      const newer = userConversation('u-new', { name: 'newer copy' });
      captured.uiHandlers!['addConversationToTop'](newer);

      expect(service.getConversations()).toHaveLength(2);
      expect(service.getConversations()[0]).toBe(newer);
      expect(service.getConversations()[1]).toBe(existing);
    });
  });

  // ==========================================================================
  // UI Kit message events
  // ==========================================================================

  describe('UI Kit message events', () => {
    it('promotes the conversation when a send succeeds', () => {
      const conv = userConversation('u-a');
      seed(userConversation('u-b'), conv);
      const msg = textFor('u-a', { text: 'sent' });

      CometChatMessageEvents.ccMessageSent.next({ message: msg, status: MessageStatus.success });

      expect(service.getConversations()[0]).toBe(conv);
      expect(conv.getLastMessage()).toBe(msg);
    });

    it('ignores a send that has not succeeded yet', () => {
      const a = userConversation('u-a');
      const b = userConversation('u-b');
      seed(a, b);

      CometChatMessageEvents.ccMessageSent.next({
        message: textFor('u-b', { text: 'uploading' }),
        status: MessageStatus.inprogress,
      });

      expect(service.getConversations()).toEqual([a, b]);
    });

    it('refreshes the conversation when a message is deleted through the UI', () => {
      const original = createMockTextMessage({ id: 9, receiverId: 'u-a' });
      const conv = userConversation('u-a', { lastMessage: original });
      seed(conv);
      const tombstone = textFor('u-a', { id: 9, text: 'deleted' });

      CometChatMessageEvents.ccMessageDeleted.next(tombstone);

      expect(conv.getLastMessage()).toBe(tombstone);
    });
  });

  // ==========================================================================
  // handleNewMessage delivery receipts and update settings
  // ==========================================================================

  describe('handleNewMessage', () => {
    function incoming(conversationId = 'u-a'): CometChat.TextMessage {
      return textFor(conversationId, { sender: createMockUser({ uid: 'them' }) });
    }

    it('marks an incoming background message as delivered', () => {
      loggedInUser = createMockUser({ uid: 'me' });
      const markSpy = track(vi.spyOn(CometChat, 'markAsDelivered').mockResolvedValue(undefined));
      const conv = userConversation('u-a');
      seed(conv);
      const msg = incoming();

      captured.messageCallbacks!['onTextMessageReceived'](msg);

      expect(markSpy).toHaveBeenCalledWith(msg);
      expect(conv.getLastMessage()).toBe(msg);
    });

    it('still updates the list when the delivery receipt cannot be sent', async () => {
      loggedInUser = createMockUser({ uid: 'me' });
      const markSpy = track(vi.spyOn(CometChat, 'markAsDelivered').mockRejectedValue(new Error('offline')));
      const conv = userConversation('u-a');
      seed(conv);
      const msg = incoming();

      captured.messageCallbacks!['onTextMessageReceived'](msg);
      await flush();

      expect(markSpy).toHaveBeenCalledWith(msg);
      expect(conv.getLastMessage()).toBe(msg);
      expect(errorLog).not.toHaveBeenCalled();
    });

    it('does not re-mark a message that the SDK already delivered', () => {
      loggedInUser = createMockUser({ uid: 'me' });
      const markSpy = track(vi.spyOn(CometChat, 'markAsDelivered').mockResolvedValue(undefined));
      seed(userConversation('u-a'));

      captured.messageCallbacks!['onTextMessageReceived'](
        textFor('u-a', { sender: createMockUser({ uid: 'them' }), deliveredAt: 1700000000 })
      );

      expect(markSpy).not.toHaveBeenCalled();
    });

    it('does not mark the logged-in user\'s own message as delivered', () => {
      loggedInUser = createMockUser({ uid: 'me' });
      const markSpy = track(vi.spyOn(CometChat, 'markAsDelivered').mockResolvedValue(undefined));
      seed(userConversation('u-a'));

      captured.messageCallbacks!['onTextMessageReceived'](
        textFor('u-a', { sender: createMockUser({ uid: 'me' }) })
      );

      expect(markSpy).not.toHaveBeenCalled();
    });

    it('does not mark anything as delivered while nobody is logged in', () => {
      const markSpy = track(vi.spyOn(CometChat, 'markAsDelivered').mockResolvedValue(undefined));
      const conv = userConversation('u-a');
      seed(conv);
      const msg = incoming();

      captured.messageCallbacks!['onTextMessageReceived'](msg);

      expect(markSpy).not.toHaveBeenCalled();
      // Skipped deliberately by the guard, not by an exception on the way to it:
      // the message still has to reach the list, and nothing may be logged.
      expect(conv.getLastMessage()).toBe(msg);
      expect(errorLog).not.toHaveBeenCalled();
    });

    it('does not mark a message as delivered while its conversation is open', () => {
      loggedInUser = createMockUser({ uid: 'me' });
      const markSpy = track(vi.spyOn(CometChat, 'markAsDelivered').mockResolvedValue(undefined));
      const conv = userConversation('u-a');
      seed(conv);
      service.setActiveConversation(conv);
      const msg = incoming();

      captured.messageCallbacks!['onTextMessageReceived'](msg);

      expect(markSpy).not.toHaveBeenCalled();
      // The message list owns the receipt here, but the list entry still updates.
      expect(conv.getLastMessage()).toBe(msg);
    });

    /**
     * The custom-message guard returns before anything else happens, so the
     * delivery receipt is the first observable sign that a message got past it.
     */
    function customPayload(): unknown {
      return {
        getCategory: () => CometChatUIKitConstants.MessageCategory.custom,
        getConversationId: () => 'u-a',
        getSender: () => createMockUser({ uid: 'them' }),
        getDeliveredAt: () => undefined,
      };
    }

    it('drops a custom message when custom-message updates are switched off', () => {
      loggedInUser = createMockUser({ uid: 'me' });
      const markSpy = track(vi.spyOn(CometChat, 'markAsDelivered').mockResolvedValue(undefined));
      CometChatUIKit.conversationUpdateSettings = {
        shouldUpdateOnCustomMessages: () => false,
      } as unknown as CometChat.ConversationUpdateSettings;
      seed(userConversation('u-a'));

      captured.messageCallbacks!['onCustomMessageReceived'](customPayload());

      expect(markSpy).not.toHaveBeenCalled();
    });

    it('treats a settings object with no custom-message predicate as "do not update"', () => {
      loggedInUser = createMockUser({ uid: 'me' });
      const markSpy = track(vi.spyOn(CometChat, 'markAsDelivered').mockResolvedValue(undefined));
      CometChatUIKit.conversationUpdateSettings = {} as unknown as CometChat.ConversationUpdateSettings;
      seed(userConversation('u-a'));

      captured.messageCallbacks!['onCustomMessageReceived'](customPayload());

      expect(markSpy).not.toHaveBeenCalled();
    });

    it('lets a custom message through when custom-message updates are switched on', () => {
      loggedInUser = createMockUser({ uid: 'me' });
      const markSpy = track(vi.spyOn(CometChat, 'markAsDelivered').mockResolvedValue(undefined));
      CometChatUIKit.conversationUpdateSettings = {
        shouldUpdateOnCustomMessages: () => true,
      } as unknown as CometChat.ConversationUpdateSettings;
      seed(userConversation('u-a'));
      const payload = customPayload();

      captured.messageCallbacks!['onCustomMessageReceived'](payload);

      expect(markSpy).toHaveBeenCalledWith(payload);
    });

    it('lets a plain message through while custom-message updates are switched off', () => {
      CometChatUIKit.conversationUpdateSettings = {
        shouldUpdateOnCustomMessages: () => false,
        shouldUpdateOnGroupActions: () => false,
      } as unknown as CometChat.ConversationUpdateSettings;
      const conv = userConversation('u-a');
      seed(userConversation('u-b'), conv);
      const msg = textFor('u-a');

      captured.messageCallbacks!['onTextMessageReceived'](msg);

      expect(service.getConversations()[0]).toBe(conv);
      expect(conv.getLastMessage()).toBe(msg);
    });

    it('drops a group action when group-action updates are switched off', () => {
      CometChatUIKit.conversationUpdateSettings = {
        shouldUpdateOnCustomMessages: () => true,
        shouldUpdateOnGroupActions: () => false,
      } as unknown as CometChat.ConversationUpdateSettings;
      const conv = groupConversation('g-1', { membersCount: 5 });
      seed(userConversation('u-a'), conv);

      captured.groupCallback!(
        groupAction('g-1', {
          actionFor: createMockGroup({ guid: 'g-1', membersCount: 9 }),
          receiver: createMockGroup({ guid: 'g-1' }),
        })
      );

      expect(service.getConversations()[0]).not.toBe(conv);
      expect((conv.getConversationWith() as CometChat.Group).getMembersCount()).toBe(5);
    });

    it('treats a settings object with no group-action predicate as "do not update"', () => {
      CometChatUIKit.conversationUpdateSettings = {
        shouldUpdateOnCustomMessages: () => true,
      } as unknown as CometChat.ConversationUpdateSettings;
      const conv = groupConversation('g-1', { membersCount: 5 });
      seed(userConversation('u-a'), conv);

      captured.groupCallback!(
        groupAction('g-1', {
          actionFor: createMockGroup({ guid: 'g-1', membersCount: 9 }),
          receiver: createMockGroup({ guid: 'g-1' }),
        })
      );

      expect((conv.getConversationWith() as CometChat.Group).getMembersCount()).toBe(5);
    });

    it('lets a group action through when group-action updates are switched on', () => {
      CometChatUIKit.conversationUpdateSettings = {
        shouldUpdateOnCustomMessages: () => true,
        shouldUpdateOnGroupActions: () => true,
      } as unknown as CometChat.ConversationUpdateSettings;
      const conv = groupConversation('g-1', { membersCount: 5 });
      seed(userConversation('u-a'), conv);

      captured.groupCallback!(
        groupAction('g-1', {
          actionFor: createMockGroup({ guid: 'g-1', membersCount: 9 }),
          receiver: createMockGroup({ guid: 'g-1' }),
        })
      );

      expect(service.getConversations()[0]).toBe(conv);
      expect((conv.getConversationWith() as CometChat.Group).getMembersCount()).toBe(9);
    });

    it('logs and swallows a message it cannot inspect', () => {
      const broken = { getCategory: () => { throw new Error('malformed'); } };

      captured.messageCallbacks!['onTextMessageReceived'](broken);

      expect(errorLog).toHaveBeenCalledWith(
        'ConversationsService',
        'Error handling new message:',
        expect.any(Error)
      );
    });
  });

  // ==========================================================================
  // refreshSingleConversation
  // ==========================================================================

  describe('refreshSingleConversation', () => {
    it('asks the SDK to build a conversation for a message it has never seen', async () => {
      const built = userConversation('u-new');
      helperSpy.mockResolvedValue(built);
      const existing = userConversation('u-a');
      seed(existing);
      const msg = textFor('u-new');

      captured.messageCallbacks!['onTextMessageReceived'](msg);
      await flush();

      expect(service.getConversations()).toHaveLength(2);
      expect(helperSpy).toHaveBeenCalledWith(msg);
      expect(service.getConversations()[0]).toBe(built);
      expect(built.getLastMessage()).toBe(msg);
    });

    it('logs when the SDK cannot build a conversation from the message', async () => {
      helperSpy.mockRejectedValue(new Error('unknown receiver'));
      const existing = userConversation('u-a');
      seed(existing);

      captured.messageCallbacks!['onTextMessageReceived'](textFor('u-new'));
      await flush();

      expect(errorLog).toHaveBeenCalledWith(
        'ConversationsService',
        'Error getting conversation from message:',
        expect.any(Error)
      );
      expect(service.getConversations()).toEqual([existing]);
    });

    it('removes the conversation instead of refreshing it when asked to', () => {
      const conv = userConversation('u-a');
      seed(conv, userConversation('u-b'));
      const announced: CometChat.Conversation[] = [];
      const sub = CometChatConversationEvents.ccConversationDeleted.subscribe(c => announced.push(c));

      priv()['refreshSingleConversation'](textFor('u-a'), true);
      sub.unsubscribe();

      expect(service.getConversations().map(c => c.getConversationId())).toEqual(['u-b']);
      expect(announced).toEqual([conv]);
    });

    it('logs and swallows a message whose conversation id cannot be read', () => {
      seed(userConversation('u-a'));
      const broken = { getConversationId: () => { throw new Error('malformed'); } };

      priv()['refreshSingleConversation'](broken);

      expect(errorLog).toHaveBeenCalledWith(
        'ConversationsService',
        'Error in refreshSingleConversation:',
        expect.any(Error)
      );
    });

    it('contains an error raised while handling a message edit', () => {
      // Shadow the collaborator on the instance: it swallows its own errors, so
      // the handler's own catch is only reachable when the call itself throws.
      priv()['refreshSingleConversation'] = () => { throw new Error('signal detached'); };

      expect(() => priv()['handleMessageUpdate'](textFor('u-a'))).not.toThrow();

      expect(errorLog).toHaveBeenCalledWith(
        'ConversationsService',
        'Error handling message update:',
        expect.any(Error)
      );
    });

    it('contains an error raised while handling a message delete', () => {
      // Shadow the collaborator on the instance: it swallows its own errors, so
      // the handler's own catch is only reachable when the call itself throws.
      priv()['refreshSingleConversation'] = () => { throw new Error('signal detached'); };

      expect(() => priv()['handleMessageDelete'](textFor('u-a'))).not.toThrow();

      expect(errorLog).toHaveBeenCalledWith(
        'ConversationsService',
        'Error handling message delete:',
        expect.any(Error)
      );
    });
  });

  // ==========================================================================
  // Cleanup
  // ==========================================================================

  describe('cleanup', () => {
    it('resets every piece of state and stops listening', async () => {
      skipShimmerDelay();
      const conv = userConversation('u-a');
      const { builder } = builderReturning([conv], []);
      await service.fetchConversations(builder);
      await service.fetchNextConversations();
      service.setActiveConversation(conv);
      captured.messageCallbacks!['onTypingStarted'](typing(USER, 'me', 'u-a'));
      priv()['setError'](new Error('previous failure'));

      expect(service.hasMore()).toBe(false);
      expect(service.hasError()).toBe(true);
      expect(service.typingIndicators().size).toBe(1);

      service.cleanup();

      expect(service.getConversations()).toEqual([]);
      expect(service.loadingState()).toBe(false);
      expect(service.errorState()).toBeNull();
      expect(service.activeConversation()).toBeNull();
      expect(service.typingIndicators().size).toBe(0);
      expect(service.hasMore()).toBe(true);
      expect(captured.removed).toHaveLength(4);

      // A UI Kit send event must no longer reach the list.
      seed(conv);
      CometChatMessageEvents.ccMessageSent.next({
        message: textFor('u-a', { text: 'after cleanup' }),
        status: MessageStatus.success,
      });
      expect((conv.getLastMessage() as CometChat.TextMessage).getText()).not.toBe('after cleanup');
    });

    it('allows a reconnect refresh again only after a fetch completes post-cleanup', async () => {
      skipShimmerDelay();
      const { builder, fetchNext } = builderReturning([]);
      service.setConversationsRequestBuilder(builder);
      await service.fetchConversations();
      service.cleanup();

      // cleanup() cleared the initial-fetch flag, so the guard holds again.
      reconnected$.next(true);
      await flush();
      expect(fetchNext).toHaveBeenCalledTimes(1);
      expect(infoLog).not.toHaveBeenCalled();

      // One completed fetch re-arms it, and the next reconnect does refetch.
      await service.fetchConversations();
      reconnected$.next(true);
      await flush();

      expect(fetchNext).toHaveBeenCalledTimes(3);
      expect(infoLog).toHaveBeenCalledWith(
        'ConversationsService',
        'WebSocket reconnected — refreshing conversation list'
      );
    });
  });
});
