/**
 * CometChatSavedMessages — coverage spec.
 *
 * The data layer is replaced wholesale: `MessagesRequestBuilder`, `getUser` and
 * `getGroup` are swapped for fakes and the logged-in user is stubbed, so the
 * panel's own logic runs with no live session behind it. Nothing here waits on
 * a real backend, and nothing passes merely because an early guard fired.
 *
 * Two areas the sibling spec leaves untested are the point of this file:
 *   - source resolution: the per-conversation name/avatar lookup, its static
 *     cache and the cache's ownership by the logged-in user
 *   - the row's text: preview per message type, the sender prefix, the labels
 *
 * Deliberately NOT repeated here, because the sibling spec already owns them
 * and a second copy would assert nothing new: the empty first page, the host
 * builder's limit being honoured, the plain scroll-append, and the row click
 * that lands on a control inside the row. Run this file alone and those lines
 * show as uncovered; that is the division of labour, not a gap.
 *
 * Rows that must be RENDERED use a tolerant message proxy. Rows that only feed
 * a direct method call are plain objects, so a test about `preview()` never
 * drags the row's child components in with it.
 *
 * @module components/cometchat-saved-messages
 */

// The calls SDK pulls in a JitsiMeetJS runtime that does not exist in jsdom.
vi.mock('@cometchat/calls-sdk-javascript', () => ({
  CometChatCalls: {
    init: vi.fn().mockResolvedValue(true),
    generateToken: vi.fn().mockResolvedValue({ token: 'mock-token' }),
  },
}));

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatSavedMessagesComponent } from './cometchat-saved-messages.component';
import { PinSaveService } from '../../services/pin-save.service';
import { CometChatPinSaveEvents } from '../../events/CometChatPinSaveEvents';
import { CometChatUIKit } from '../../cometchat-uikit';
import { CometChatUIKitConstants } from '../../constants';
import { CometChatLogger } from '../../utils/CometChatLogger';
import { States } from '../../Enums/Enums';

// ---------------------------------------------------------------------------
// Fake data layer
// ---------------------------------------------------------------------------

/** One queued answer to `fetchPrevious()`: a page, a rejection, or a pending promise. */
type FetchEntry = unknown[] | Error | Promise<unknown[]>;

let fetchQueue: FetchEntry[] = [];
let fetchCalls = 0;
let buildCalls = 0;
let lastLimit: unknown = null;
/** Whether the request the panel actually built asked for saved messages. */
let builtSaved = false;

let getUserStub: ReturnType<typeof vi.fn>;
let getGroupStub: ReturnType<typeof vi.fn>;

const sdkOriginals: Record<string, unknown> = {};

function installSdkFake(): void {
  sdkOriginals['MessagesRequestBuilder'] = (CometChat as unknown as Record<string, unknown>)['MessagesRequestBuilder'];
  sdkOriginals['getUser'] = (CometChat as unknown as Record<string, unknown>)['getUser'];
  sdkOriginals['getGroup'] = (CometChat as unknown as Record<string, unknown>)['getGroup'];

  (CometChat as unknown as Record<string, unknown>)['MessagesRequestBuilder'] = class {
    limit = 30;
    saved = false;
    setLimit(n: number) { this.limit = n; return this; }
    setSaved(v = true) { this.saved = v; return this; }
    build() {
      buildCalls++;
      lastLimit = this.limit;
      builtSaved = this.saved;
      return {
        fetchPrevious: () => {
          const entry = fetchQueue[fetchCalls++];
          if (entry === undefined) return Promise.resolve([]);
          if (entry instanceof Error) return Promise.reject(entry);
          return Promise.resolve(entry);
        },
      };
    }
  };

  (CometChat as unknown as Record<string, unknown>)['getUser'] = getUserStub;
  (CometChat as unknown as Record<string, unknown>)['getGroup'] = getGroupStub;
}

function restoreSdk(): void {
  for (const key of Object.keys(sdkOriginals)) {
    (CometChat as unknown as Record<string, unknown>)[key] = sdkOriginals[key];
  }
}

/** A promise this test resolves by hand, for races between two loads. */
function defer<T>(): { promise: Promise<T>; resolve: (v: T) => void; reject: (e: unknown) => void } {
  let resolve!: (v: T) => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

/**
 * A message that answers anything asked of it.
 *
 * Only the accessors a test cares about are passed; the rest resolve to
 * `undefined`/`false` so a rendered row never dies on an accessor the panel's
 * children happen to call.
 */
function fakeMessage(accessors: Record<string, unknown> = {}): any {
  const base: Record<string, unknown> = {
    getId: () => 1,
    getType: () => CometChatUIKitConstants.MessageTypes.text,
    getCategory: () => CometChatUIKitConstants.MessageCategory.message,
    getText: () => 'hello',
    getSender: () => ({ getUid: () => 'bob', getName: () => 'Bob' }),
    getReceiverId: () => 'bob',
    getReceiverType: () => CometChat.RECEIVER_TYPE.USER,
    getSentAt: () => 1_700_000_000,
    getDeletedAt: () => undefined,
    getParentMessageId: () => 0,
    ...accessors,
  };
  return new Proxy(base, {
    get(target, prop) {
      if (prop in target) return target[prop as string];
      if (typeof prop !== 'string') return undefined;
      if (prop.startsWith('get')) return () => undefined;
      if (prop.startsWith('is') || prop.startsWith('has')) return () => false;
      return undefined;
    },
  });
}

/** A message from `uid` in a 1-1 conversation, with a stable id. */
function userMessage(id: number, uid = 'bob', extra: Record<string, unknown> = {}): any {
  return fakeMessage({
    getId: () => id,
    getSender: () => ({ getUid: () => uid, getName: () => uid.toUpperCase() }),
    getReceiverId: () => uid,
    getReceiverType: () => CometChat.RECEIVER_TYPE.USER,
    ...extra,
  });
}

/** A message in a group, which keys on the guid whoever sent it. */
function groupMessage(id: number, guid = 'g1', extra: Record<string, unknown> = {}): any {
  return fakeMessage({
    getId: () => id,
    getReceiverId: () => guid,
    getReceiverType: () => CometChat.RECEIVER_TYPE.GROUP,
    ...extra,
  });
}

/** A real SDK user, so the avatar helper's `instanceof` test holds. */
function sdkUser(uid: string, name: string, avatar = ''): CometChat.User {
  const user = new CometChat.User(uid);
  user.setName(name);
  if (avatar) user.setAvatar(avatar);
  return user;
}

/** A row as the panel stores it, for methods that take one directly. */
function savedRow(message: any, sourceName: string | null = null, sourceAvatar = ''): any {
  return { message, sourceName, sourceAvatar };
}

function loggedInAs(uid: string | null): void {
  (CometChatUIKit.getLoggedInUser as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
    uid ? sdkUser(uid, uid.toUpperCase()) : null
  );
}

/** A page of `count` messages from the same person, newest first. */
function fullPage(count: number, uid = 'bob'): any[] {
  return Array.from({ length: count }, (_, i) => userMessage(i + 1, uid, { getSentAt: () => 1_000 - i }));
}

/** A scroll event that reads as "near the bottom". */
function scrollToEnd(): Event {
  return { target: { scrollHeight: 1000, scrollTop: 900, clientHeight: 100 } } as unknown as Event;
}

class FakePinSaveService {
  run = vi.fn().mockResolvedValue(null);
  isSystemPin = vi.fn().mockReturnValue(false);
  isSaveEnabled = vi.fn().mockResolvedValue(true);
  isPinEnabled = vi.fn().mockResolvedValue(true);
  isSupported = vi.fn().mockReturnValue(true);
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('CometChatSavedMessagesComponent — coverage', () => {
  let fixture: ComponentFixture<CometChatSavedMessagesComponent> | null = null;
  let component: CometChatSavedMessagesComponent;
  let pinSave: FakePinSaveService;
  let loggerError: ReturnType<typeof vi.fn>;

  /** Let every queued microtask settle, then re-render. */
  async function flush(): Promise<void> {
    await new Promise<void>(resolve => setTimeout(resolve, 0));
    fixture?.detectChanges();
  }

  /** An instance with its injectors wired, but nothing rendered and no load. */
  function create(): any {
    fixture = TestBed.createComponent(CometChatSavedMessagesComponent);
    component = fixture.componentInstance;
    return component as any;
  }

  /** Render the panel, which runs the first load, and settle it. */
  async function boot(configure?: (c: any) => void): Promise<any> {
    const instance = create();
    configure?.(instance);
    fixture!.detectChanges();
    await flush();
    return instance;
  }

  function rowIds(): unknown[] {
    return component.rows().map(r => r.message.getId());
  }

  beforeEach(async () => {
    fixture = null;
    fetchQueue = [];
    fetchCalls = 0;
    buildCalls = 0;
    lastLimit = null;
    builtSaved = false;

    getUserStub = vi.fn().mockResolvedValue(undefined);
    getGroupStub = vi.fn().mockResolvedValue(undefined);
    installSdkFake();

    vi.spyOn(CometChatUIKit, 'getLoggedInUser').mockReturnValue(null);
    loggerError = vi.spyOn(CometChatLogger, 'error').mockImplementation(() => undefined) as never;

    // The name cache is static so it outlives the panel; each test starts cold.
    (CometChatSavedMessagesComponent as any).sourceNames.clear();
    (CometChatSavedMessagesComponent as any).cacheOwnerUid = null;

    pinSave = new FakePinSaveService();
    await TestBed.configureTestingModule({
      imports: [CometChatSavedMessagesComponent],
      providers: [{ provide: PinSaveService, useValue: pinSave }],
    }).compileComponents();
  });

  afterEach(() => {
    // Static event subjects outlive the fixture; an undestroyed panel keeps
    // reacting to the next test's events.
    fixture?.destroy();
    fixture = null;
    restoreSdk();
    vi.restoreAllMocks();
  });

  // -------------------------------------------------------------------------
  // The request the panel builds
  // -------------------------------------------------------------------------

  describe('the request it builds', () => {
    it('re-asserts setSaved, without which the read is ordinary history', async () => {
      fetchQueue = [[userMessage(1), userMessage(2)]];
      await boot();

      expect(builtSaved).toBe(true);
      expect(component.rows().length).toBe(2);
      expect(component.state()).toBe(States.loaded);
    });

    it('ignores a limit on the supplied builder that it cannot read', async () => {
      // Both shapes the guard rejects: no limit at all, and a non-positive one.
      // A full page against the DEFAULT size must stay pageable either way —
      // had the unreadable limit been used as-is, `30 >= undefined` and
      // `30 >= 0`... the former is false and would have stopped paging after
      // one page, the latter true for every page and would never stop.
      for (const supplied of [{}, { limit: 0 }, { limit: -5 }, { limit: '30' }]) {
        fetchCalls = 0;
        fetchQueue = [fullPage(30)];
        await boot(c => { c.messagesRequestBuilder = supplied as any; });

        expect(lastLimit).toBe(30);
        expect(component.hasMoreToShow()).toBe(true);
        fixture?.destroy();
        fixture = null;
      }
    });
  });

  // -------------------------------------------------------------------------
  // Scroll guards
  // -------------------------------------------------------------------------

  describe('scroll guards', () => {
    it('does not fetch before a first load has produced a request', async () => {
      const c = create();
      await component.onListScroll(scrollToEnd());

      expect(fetchCalls).toBe(0);
      expect(component.rows()).toEqual([]);
      // Reaching for a request that does not exist yet would be caught as a
      // failed page and would leave the list permanently unpageable.
      expect(c.hasMore()).toBe(true);
      expect(loggerError).not.toHaveBeenCalled();
    });

    it('does not fetch once a short page has exhausted the list', async () => {
      fetchQueue = [fullPage(2)];
      await boot();
      expect(fetchCalls).toBe(1);
      expect(component.hasMoreToShow()).toBe(false);

      await component.onListScroll(scrollToEnd());

      expect(fetchCalls).toBe(1);
    });

    it('does not start a second page while one is genuinely still in flight', async () => {
      // A real race rather than a hand-set flag: the first scroll is left
      // unresolved while the second runs, so the guard is exercised in the
      // state it actually exists for.
      const page2 = defer<unknown[]>();
      fetchQueue = [fullPage(30), page2.promise, [userMessage(99, 'bob')]];
      await boot();

      const inFlight = component.onListScroll(scrollToEnd());
      await component.onListScroll(scrollToEnd());

      // The second scroll must not have consumed the third queue entry.
      expect(fetchCalls).toBe(2);
      expect(rowIds()).not.toContain(99);

      page2.resolve(fullPage(30, 'bob').map((m, i) =>
        userMessage(100 + i, 'bob', { getSentAt: () => 500 - i })
      ));
      await inFlight;
      await flush();

      // And once it lands, the page it was waiting on is the one appended.
      expect(component.rows().length).toBe(60);
      expect(fetchCalls).toBe(2);
    });

    it('marks the list exhausted when a scroll page fails, keeping the rows', async () => {
      fetchQueue = [fullPage(30), new Error('page down')];
      const c = await boot();

      await component.onListScroll(scrollToEnd());
      await flush();

      expect(c.hasMore()).toBe(false);
      expect(component.rows().length).toBe(30);
      expect(loggerError).toHaveBeenCalledWith(
        'CometChatSavedMessages',
        'Failed to load more saved messages:',
        expect.any(Error)
      );
    });
  });

  // -------------------------------------------------------------------------
  // Superseded reads
  // -------------------------------------------------------------------------

  describe('when a read is superseded', () => {
    it('throws away a page whose load was replaced mid-flight', async () => {
      const stale = defer<unknown[]>();
      fetchQueue = [stale.promise, [userMessage(9, 'bob', { getSentAt: () => 900 })]];

      create();
      fixture!.detectChanges();   // load #1 is now waiting on `stale`
      component.retry();          // load #2 owns the list
      await flush();

      stale.resolve([userMessage(1, 'bob', { getSentAt: () => 100 })]);
      await flush();

      expect(rowIds()).toEqual([9]);
    });

    it('leaves the fresh list alone when the superseded load fails', async () => {
      const stale = defer<unknown[]>();
      fetchQueue = [stale.promise, [userMessage(9)]];
      const emitted: unknown[] = [];

      create();
      component.error.subscribe(e => emitted.push(e));
      fixture!.detectChanges();
      component.retry();
      await flush();

      stale.reject(new Error('too late'));
      await flush();

      // The replacement load succeeded, so the panel must not go to error.
      expect(component.state()).toBe(States.loaded);
      expect(emitted).toEqual([]);
      expect(rowIds()).toEqual([9]);
    });

    it('reports the failure of the load that still owns the list', async () => {
      fetchQueue = [new Error('network')];
      const emitted: CometChat.CometChatException[] = [];
      await boot(c => c.error.subscribe((e: CometChat.CometChatException) => emitted.push(e)));

      expect(component.state()).toBe(States.error);
      expect(emitted.length).toBe(1);
      expect((emitted[0] as unknown as Error).message).toBe('network');
      expect(component.rows()).toEqual([]);
      expect(loggerError).toHaveBeenCalledWith(
        'CometChatSavedMessages',
        'Failed to load saved messages:',
        expect.any(Error)
      );
    });

    it('does not append a scroll page onto a list that replaced it', async () => {
      const stalePage = defer<unknown[]>();
      fetchQueue = [fullPage(30), stalePage.promise, [userMessage(7, 'bob', { getSentAt: () => 700 })]];
      await boot();

      const inFlight = component.onListScroll(scrollToEnd());
      component.retry();
      await flush();

      stalePage.resolve([userMessage(99, 'bob', { getSentAt: () => 50 })]);
      await inFlight;
      await flush();

      expect(rowIds()).toEqual([7]);
    });
  });

  // -------------------------------------------------------------------------
  // Panel keyboard
  // -------------------------------------------------------------------------

  describe('panel keyboard', () => {
    function keydown(key: string): { event: KeyboardEvent; preventDefault: ReturnType<typeof vi.fn> } {
      const preventDefault = vi.fn();
      return { event: { key, preventDefault } as unknown as KeyboardEvent, preventDefault };
    }

    it('closes the panel on Escape', () => {
      const c = create();
      const closed = vi.fn();
      c.closeClick.subscribe(closed);

      const { event, preventDefault } = keydown('Escape');
      c.onPanelKeydown(event);

      expect(closed).toHaveBeenCalledTimes(1);
      expect(preventDefault).toHaveBeenCalled();
    });

    it('dismisses the confirmation first, leaving the panel open', () => {
      const c = create();
      const closed = vi.fn();
      c.closeClick.subscribe(closed);
      c.pendingUnsave.set(userMessage(1));

      c.onPanelKeydown(keydown('Escape').event);

      expect(c.pendingUnsave()).toBeNull();
      expect(closed).not.toHaveBeenCalled();
    });

    it('leaves any other key to the rest of the page', () => {
      const c = create();
      const closed = vi.fn();
      c.closeClick.subscribe(closed);

      const { event, preventDefault } = keydown('Enter');
      c.onPanelKeydown(event);

      expect(closed).not.toHaveBeenCalled();
      expect(preventDefault).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // Source resolution
  // -------------------------------------------------------------------------

  describe('resolving which conversation a row came from', () => {
    it('labels each row with its own conversation', async () => {
      loggedInAs('me');
      getUserStub.mockImplementation(async (uid: string) =>
        uid === 'bob' ? sdkUser('bob', 'Bob', 'bob.png') : sdkUser('ann', 'Ann', 'ann.png')
      );
      fetchQueue = [[userMessage(1, 'bob', { getSentAt: () => 200 }), userMessage(2, 'ann', { getSentAt: () => 100 })]];
      await boot();

      expect(component.rows().map(r => [r.message.getId(), r.sourceName, r.sourceAvatar])).toEqual([
        [1, 'Bob', 'bob.png'],
        [2, 'Ann', 'ann.png'],
      ]);
    });

    it('resolves a group row through getGroup, keyed on the guid', async () => {
      loggedInAs('me');
      getGroupStub.mockResolvedValue({ getName: () => 'Design', getIcon: () => 'design.png' });
      fetchQueue = [[groupMessage(1, 'g1')]];
      await boot();

      expect(getGroupStub).toHaveBeenCalledWith('g1');
      expect(getUserStub).not.toHaveBeenCalled();
      expect(component.rows()[0].sourceName).toBe('Design');
      expect(component.rows()[0].sourceAvatar).toBe('design.png');
    });

    it('keys a 1-1 message I sent on the receiver, not on me', async () => {
      loggedInAs('me');
      getUserStub.mockResolvedValue(sdkUser('bob', 'Bob'));
      // Sent BY the logged-in user, so the other party is the receiver.
      fetchQueue = [[fakeMessage({
        getId: () => 1,
        getSender: () => ({ getUid: () => 'me', getName: () => 'Me' }),
        getReceiverId: () => 'bob',
        getReceiverType: () => CometChat.RECEIVER_TYPE.USER,
      })]];
      await boot();

      expect(getUserStub).toHaveBeenCalledWith('bob');
      expect(component.rows()[0].sourceName).toBe('Bob');
    });

    it('resolves a message that does not report a receiver type as a 1-1', async () => {
      loggedInAs('me');
      getUserStub.mockResolvedValue(sdkUser('bob', 'Bob'));
      // A payload that reaches the panel without a receiverType leaves the
      // sender as the only side to key on, and must not read as a group.
      fetchQueue = [[fakeMessage({
        getId: () => 1,
        getReceiverType: () => undefined,
        getReceiverId: () => undefined,
        getSender: () => ({ getUid: () => 'bob', getName: () => 'Bob' }),
      })]];
      await boot();

      expect(getGroupStub).not.toHaveBeenCalled();
      expect(getUserStub).toHaveBeenCalledWith('bob');
      expect(component.rows()[0].sourceName).toBe('Bob');
    });

    it('asks once per conversation and fans the answer out to every row', async () => {
      loggedInAs('me');
      getUserStub.mockResolvedValue(sdkUser('bob', 'Bob'));
      fetchQueue = [fullPage(3)];
      await boot();

      expect(getUserStub).toHaveBeenCalledTimes(1);
      expect(component.rows().map(r => r.sourceName)).toEqual(['Bob', 'Bob', 'Bob']);
    });

    it('reuses a name resolved by an earlier load instead of asking again', async () => {
      loggedInAs('me');
      getUserStub.mockResolvedValue(sdkUser('bob', 'Bob'));
      fetchQueue = [[userMessage(1)], [userMessage(2)]];
      await boot();
      expect(getUserStub).toHaveBeenCalledTimes(1);

      component.retry();
      await flush();

      expect(rowIds()).toEqual([2]);
      expect(component.rows()[0].sourceName).toBe('Bob');
      expect(getUserStub).toHaveBeenCalledTimes(1);
    });

    it('drops names cached for a different logged-in user', async () => {
      loggedInAs('me');
      getUserStub.mockResolvedValue(sdkUser('bob', 'Bob'));
      fetchQueue = [[userMessage(1)], [userMessage(2)]];
      await boot();
      expect(getUserStub).toHaveBeenCalledTimes(1);

      // The same peer id can be a different person for another account.
      loggedInAs('someone-else');
      getUserStub.mockResolvedValue(sdkUser('bob', 'Robert'));
      component.retry();
      await flush();

      expect(getUserStub).toHaveBeenCalledTimes(2);
      expect(component.rows()[0].sourceName).toBe('Robert');
    });

    it('keeps the row when the lookup rejects', async () => {
      loggedInAs('me');
      getUserStub.mockRejectedValue(new Error('no such user'));
      fetchQueue = [[userMessage(1)]];
      await boot();

      expect(component.rows().length).toBe(1);
      expect(component.rows()[0].sourceName).toBeNull();
      // The raw id carries the row until a name arrives.
      expect(component.sourceLabel(component.rows()[0])).toBe('bob');
    });

    it('keeps the row when the lookup resolves nothing', async () => {
      loggedInAs('me');
      getUserStub.mockResolvedValue(undefined);
      fetchQueue = [[userMessage(1)]];
      await boot();

      expect(component.rows()[0].sourceName).toBeNull();
      expect(component.rows()[0].sourceAvatar).toBe('');
    });

    it('does not cache an identity that resolved without a name', async () => {
      loggedInAs('me');
      getUserStub.mockResolvedValue({ getName: () => '', getIcon: () => '' });
      fetchQueue = [[userMessage(1)], [userMessage(2)]];
      await boot();

      expect(component.rows()[0].sourceName).toBeNull();

      // Nothing was cached, so the next load has to ask again.
      component.retry();
      await flush();
      expect(getUserStub).toHaveBeenCalledTimes(2);
    });

    it('does not look up a message with no resolvable peer', async () => {
      loggedInAs(null);
      fetchQueue = [[fakeMessage({
        getId: () => 1,
        getSender: () => undefined,
        getReceiverId: () => undefined,
        getReceiverType: () => undefined,
      })]];
      const c = await boot();

      expect(component.rows().length).toBe(1);
      expect(getUserStub).not.toHaveBeenCalled();
      expect(getGroupStub).not.toHaveBeenCalled();

      // Reached directly too: the single-row path guards the same way.
      await c.hydrateSource(component.rows()[0].message);
      expect(getUserStub).not.toHaveBeenCalled();
      expect(component.sourceLabel(component.rows()[0])).toBe('');
    });

    it('uses a cached name for a message saved in realtime', async () => {
      loggedInAs('me');
      getUserStub.mockResolvedValue(sdkUser('bob', 'Bob'));
      fetchQueue = [[userMessage(1, 'bob', { getSentAt: () => 500 })]];
      await boot();
      expect(getUserStub).toHaveBeenCalledTimes(1);

      CometChatPinSaveEvents.publishMessageSaved({
        message: userMessage(2, 'bob', { getSentAt: () => 400 }),
      } as never);
      await flush();

      expect(component.rows().map(r => r.sourceName)).toEqual(['Bob', 'Bob']);
      expect(getUserStub).toHaveBeenCalledTimes(1);
    });
  });

  // -------------------------------------------------------------------------
  // Save / unsave events
  // -------------------------------------------------------------------------

  describe('save and unsave events', () => {
    it('takes the panel out of the empty state when the first save arrives', async () => {
      fetchQueue = [[]];
      await boot();
      expect(component.state()).toBe(States.empty);

      CometChatPinSaveEvents.publishMessageSaved({ message: userMessage(1) } as never);
      await flush();

      expect(rowIds()).toEqual([1]);
      // The handler either keeps a row it already had or prepends the one it
      // was given, so it always leaves at least one row behind — the state it
      // lands on is never `empty`, whatever the list looked like before.
      expect(component.state()).toBe(States.loaded);
    });

    it('ignores a save event for a message already listed', async () => {
      fetchQueue = [[userMessage(1)]];
      await boot();
      const original = component.rows()[0].message;

      CometChatPinSaveEvents.publishMessageSaved({ message: userMessage(1) } as never);
      await flush();

      expect(component.rows().length).toBe(1);
      // The listed row was kept, not swapped for the event's copy.
      expect(component.rows()[0].message).toBe(original);
    });

    it('drops the row on an unsave, and reports empty when the last one goes', async () => {
      fetchQueue = [[userMessage(1, 'bob', { getSentAt: () => 200 }), userMessage(2, 'bob', { getSentAt: () => 100 })]];
      await boot();

      CometChatPinSaveEvents.publishMessageUnsaved({ message: userMessage(1) } as never);
      await flush();
      expect(rowIds()).toEqual([2]);
      expect(component.state()).toBe(States.loaded);

      CometChatPinSaveEvents.publishMessageUnsaved({ message: userMessage(2) } as never);
      await flush();
      expect(component.rows()).toEqual([]);
      expect(component.state()).toBe(States.empty);
    });
  });

  // -------------------------------------------------------------------------
  // Row labels
  // -------------------------------------------------------------------------

  describe('row labels', () => {
    it('labels a row by its name, then its peer id, then not at all', () => {
      const c = create();
      const orphan = fakeMessage({ getSender: () => undefined, getReceiverId: () => undefined });

      expect(c.sourceLabel(savedRow(userMessage(1), 'Bob & Co'))).toBe('Bob & Co');
      expect(c.sourceLabel(savedRow(userMessage(1, 'ann')))).toBe('ann');
      expect(c.sourceLabel(savedRow(orphan))).toBe('');
    });

    it('marks a group row as one', () => {
      const c = create();
      expect(c.isGroupRow(savedRow(groupMessage(1)))).toBe(true);
      expect(c.isGroupRow(savedRow(userMessage(1)))).toBe(false);
    });

    it('marks a saved thread reply', () => {
      const c = create();
      expect(c.isThreadReply(savedRow(fakeMessage({ getParentMessageId: () => 42 })))).toBe(true);
      expect(c.isThreadReply(savedRow(fakeMessage({ getParentMessageId: () => 0 })))).toBe(false);
      // A build whose message does not carry the field is not a thread reply.
      expect(c.isThreadReply(savedRow(fakeMessage({ getParentMessageId: () => undefined })))).toBe(false);
    });

    it('names the media glyph the conversation list would use', () => {
      // Delegation only — the glyph rules belong to the conversation-item
      // helper and are tested there. What is this panel's own is that the row's
      // message and the logged-in uid reach it, so a media row gets a glyph and
      // a plain text row gets none.
      loggedInAs('me');
      const c = create();
      expect(c.previewIcon(savedRow(fakeMessage({ getType: () => CometChatUIKitConstants.MessageTypes.image })))).toBe('image');
      expect(c.previewIcon(savedRow(fakeMessage({ getText: () => 'plain words' })))).toBe('none');
    });
  });

  // -------------------------------------------------------------------------
  // Sender prefix
  // -------------------------------------------------------------------------

  describe('the sender prefix', () => {
    it('is empty on a 1-1 row, where the title is already the other person', () => {
      loggedInAs('me');
      const c = create();
      expect(c.senderPrefix(savedRow(userMessage(1, 'ann')))).toBe('');
    });

    it('names the speaker on a group row', () => {
      loggedInAs('me');
      const c = create();
      const row = savedRow(groupMessage(1, 'g1', {
        getSender: () => ({ getUid: () => 'ann', getName: () => 'Ann' }),
      }));
      expect(c.senderPrefix(row)).toBe('Ann:');
    });

    it('says "You" on a group row the logged-in user sent', () => {
      loggedInAs('me');
      const c = create();
      const row = savedRow(groupMessage(1, 'g1', {
        getSender: () => ({ getUid: () => 'me', getName: () => 'Me' }),
      }));
      expect(c.senderPrefix(row)).toBe('You:');
    });

    it('is empty on a group row whose sender has no name', () => {
      loggedInAs('me');
      const c = create();
      const row = savedRow(groupMessage(1, 'g1', {
        getSender: () => ({ getUid: () => 'ann', getName: () => undefined }),
      }));
      expect(c.senderPrefix(row)).toBe('');
    });

    it('is empty with no logged-in user and an unnamed sender', () => {
      loggedInAs(null);
      const c = create();
      const row = savedRow(groupMessage(1, 'g1', { getSender: () => undefined }));
      expect(c.senderPrefix(row)).toBe('');
    });

    it('is empty on action and call rows, which read as whole sentences', () => {
      loggedInAs('me');
      const c = create();
      const action = savedRow(groupMessage(1, 'g1', {
        getCategory: () => CometChatUIKitConstants.MessageCategory.action,
      }));
      const call = savedRow(groupMessage(2, 'g1', {
        getCategory: () => CometChatUIKitConstants.MessageCategory.call,
      }));
      expect(c.senderPrefix(action)).toBe('');
      expect(c.senderPrefix(call)).toBe('');
    });
  });

  // -------------------------------------------------------------------------
  // Preview text
  // -------------------------------------------------------------------------

  describe('the preview text', () => {
    let c: any;

    beforeEach(() => { c = create(); });

    function preview(accessors: Record<string, unknown>): string {
      return c.preview(savedRow(fakeMessage(accessors)));
    }

    it('says so for a deleted message, whatever it used to be', () => {
      expect(preview({ getDeletedAt: () => 1_700_000_500, getText: () => 'secret' }))
        .toBe('Message is deleted');
    });

    it('shows a card message\'s own text', () => {
      expect(preview({
        getCategory: () => CometChatUIKitConstants.MessageCategory.card,
        getText: () => 'Pick a plan',
      })).toBe('Pick a plan');
    });

    it('names a card with no text of its own', () => {
      expect(preview({
        getCategory: () => CometChatUIKitConstants.MessageCategory.card,
        getText: () => '',
      })).toBe('Card Message');
    });

    it('shows a markdown link by its label, not its URL', () => {
      expect(preview({ getText: () => 'read [the docs](https://docs.test/page)' }))
        .toBe('read the docs');
    });

    it('shows plain text as it stands', () => {
      expect(preview({ getText: () => 'just text' })).toBe('just text');
    });

    it('reads a text message with no text as empty', () => {
      expect(preview({ getText: () => undefined })).toBe('');
    });

    it('names each attachment type when it has no caption', () => {
      const t = CometChatUIKitConstants.MessageTypes;
      expect(preview({ getType: () => t.image, getCaption: () => '' })).toBe('Image');
      expect(preview({ getType: () => t.video, getCaption: () => '' })).toBe('Video');
      expect(preview({ getType: () => t.audio, getCaption: () => '' })).toBe('Audio');
      expect(preview({ getType: () => t.file, getCaption: () => '' })).toBe('File');
    });

    it('prefers an attachment\'s caption over its type name', () => {
      expect(preview({
        getType: () => CometChatUIKitConstants.MessageTypes.image,
        getCaption: () => 'the view from here',
      })).toBe('the view from here');
    });

    it('names each extension type', () => {
      const x = CometChatUIKitConstants.ExtensionTypes;
      expect(preview({ getType: () => x.poll })).toBe('Poll');
      expect(preview({ getType: () => x.sticker })).toBe('Sticker');
      expect(preview({ getType: () => x.document })).toBe('Collaborative Document');
      expect(preview({ getType: () => x.whiteboard })).toBe('Collaborative Whiteboard');
    });

    it('falls back to the raw type for anything it does not know', () => {
      expect(preview({ getType: () => 'extension_unknown_thing' })).toBe('extension_unknown_thing');
    });

    it('reads as empty when the message has no type', () => {
      expect(preview({ getType: () => undefined })).toBe('');
    });
  });

  // -------------------------------------------------------------------------
  // Row interaction and the unsave confirmation
  // -------------------------------------------------------------------------

  describe('row interaction', () => {
    it('opens the message on Enter and on Space', () => {
      const c = create();
      const emitted: unknown[] = [];
      c.messageClick.subscribe((m: unknown) => emitted.push(m));
      const row = savedRow(userMessage(1));

      const enter = { key: 'Enter', preventDefault: vi.fn() } as unknown as KeyboardEvent;
      const space = { key: ' ', preventDefault: vi.fn() } as unknown as KeyboardEvent;
      c.onRowKeydown(enter, row);
      c.onRowKeydown(space, row);

      expect(emitted).toEqual([row.message, row.message]);
      expect(enter.preventDefault).toHaveBeenCalled();
      expect(space.preventDefault).toHaveBeenCalled();
    });

    it('leaves other keys to the page', () => {
      const c = create();
      const emitted: unknown[] = [];
      c.messageClick.subscribe((m: unknown) => emitted.push(m));
      const tab = { key: 'Tab', preventDefault: vi.fn() } as unknown as KeyboardEvent;

      c.onRowKeydown(tab, savedRow(userMessage(1)));

      expect(emitted).toEqual([]);
      expect(tab.preventDefault).not.toHaveBeenCalled();
    });
  });

  describe('the unsave confirmation', () => {
    it('asks first, and does not let the click open the row', () => {
      const c = create();
      const opened = vi.fn();
      c.messageClick.subscribe(opened);
      const row = savedRow(userMessage(1));
      const event = { stopPropagation: vi.fn() } as unknown as Event;

      c.unsave(row, event);

      expect(event.stopPropagation).toHaveBeenCalled();
      expect(c.pendingUnsave()).toBe(row.message);
      expect(opened).not.toHaveBeenCalled();
      expect(pinSave.run).not.toHaveBeenCalled();
    });

    it('runs the unsave once confirmed', () => {
      const c = create();
      const row = savedRow(userMessage(1));
      c.unsave(row, { stopPropagation: vi.fn() } as unknown as Event);

      c.confirmUnsave();

      expect(pinSave.run).toHaveBeenCalledWith('unsave', row.message);
      expect(c.pendingUnsave()).toBeNull();
    });

    it('does nothing when confirmed with nothing pending', () => {
      const c = create();
      c.confirmUnsave();

      expect(pinSave.run).not.toHaveBeenCalled();
      expect(c.pendingUnsave()).toBeNull();
    });

    it('keeps the save when cancelled', () => {
      const c = create();
      c.unsave(savedRow(userMessage(1)), { stopPropagation: vi.fn() } as unknown as Event);

      c.cancelUnsave();

      expect(c.pendingUnsave()).toBeNull();
      expect(pinSave.run).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // Ordering
  // -------------------------------------------------------------------------

  describe('ordering', () => {
    it('sorts a message with no sentAt below one that has it, keeping arrival order', async () => {
      // A build that cannot report `sentAt` must not poison the comparison and
      // leave the whole page in server order.
      fetchQueue = [[
        userMessage(2, 'bob', { getSentAt: () => undefined }),
        userMessage(3, 'bob', { getSentAt: () => undefined }),
        userMessage(1, 'bob', { getSentAt: () => 500 }),
      ]];
      await boot();

      expect(rowIds()).toEqual([1, 2, 3]);
    });
  });
});
