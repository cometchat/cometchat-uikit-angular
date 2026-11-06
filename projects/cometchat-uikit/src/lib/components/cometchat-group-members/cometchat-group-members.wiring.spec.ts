/**
 * CometChatGroupMembers — Lifecycle & Service Wiring Tests
 *
 * Drives the real component against a fully mocked GroupMembersService, so the
 * lifecycle hooks, service hand-off, pagination, debounced search and retry
 * path all run without a live SDK session.
 *
 * `GroupMembersService` is a COMPONENT-level provider, so a root TestBed
 * provider is shadowed by the component injector — the component metadata
 * itself has to be overridden. See `build()` below.
 *
 * Covers: ngOnInit, ngOnDestroy, fetchLoggedInUser, initializeService,
 *         setupSearchDebouncing, onLoadMore, onSearch, handleSearchTextChange,
 *         onItemClick, checkEmptyState, handleRetryClick.
 *
 * @module components/cometchat-group-members
 */

// The calls SDK reaches for JitsiMeetJS at import time, which does not exist
// in jsdom. Stubbed so importing the component tree stays side-effect free.
vi.mock('@cometchat/calls-sdk-javascript', () => ({
  CometChatCalls: {
    init: vi.fn().mockResolvedValue(true),
    generateToken: vi.fn().mockResolvedValue({ token: 'mock-token' }),
  },
}));

import { describe, it, expect, vi, beforeEach, afterEach, type MockInstance } from 'vitest';
import { ChangeDetectorRef, signal, WritableSignal } from '@angular/core';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatGroupMembersComponent } from './cometchat-group-members.component';
import { CometChatGroupEvents, IGroupMemberKickedBanned } from '../../events/CometChatGroupEvents';
import { GroupMembersService } from '../../services/group-members.service';
import { CometChatLogger } from '../../utils/CometChatLogger';
import { SelectionMode, States } from '../../Enums/Enums';
import { SelectionState } from '../../modals/SelectionState';

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

/**
 * Groups and members are reduced to the accessors the component actually
 * calls. Real SDK model instances would work too, but these keep every test
 * free of SDK construction details.
 */
function makeGroup(guid = 'guid-1', name = 'Design'): CometChat.Group {
  return {
    getGuid: () => guid,
    getName: () => name,
  } as unknown as CometChat.Group;
}

/**
 * The four accessors here are exactly what the member-item component renders,
 * so a member pushed into the mock list can be change-detected without the
 * template tripping over a missing getter.
 */
function makeMember(uid: string, scope = 'participant'): CometChat.GroupMember {
  return {
    getUid: () => uid,
    getName: () => uid,
    getScope: () => scope,
    getAvatar: () => '',
    getStatus: () => 'offline',
  } as unknown as CometChat.GroupMember;
}

function makeUser(uid = 'me'): CometChat.User {
  return {
    getUid: () => uid,
    getName: () => uid,
  } as unknown as CometChat.User;
}

/** A request builder stand-in — the component only forwards the reference. */
function makeBuilder(): CometChat.GroupMembersRequestBuilder {
  return { build: vi.fn() } as unknown as CometChat.GroupMembersRequestBuilder;
}

function makeException(code = 'ERR', message = 'boom'): CometChat.CometChatException {
  return { code, message, details: '' } as unknown as CometChat.CometChatException;
}

/** CometChatLogger's static signature, shared by `error` and `warn`. */
type LogFn = (tag: string, message: string, ...args: unknown[]) => void;

/** Lets the component's promise chains settle under real timers. */
function flush(): Promise<void> {
  return new Promise<void>(resolve => setTimeout(resolve, 0));
}

// ---------------------------------------------------------------------------
// Service double
// ---------------------------------------------------------------------------

/**
 * The component reads `members`, `fetchState` and `hasMore` as signals, both
 * from its own code and from the template, so they are backed by writable
 * signals a test can push into.
 */
interface MockGroupMembersService {
  members: WritableSignal<CometChat.GroupMember[]>;
  fetchState: WritableSignal<States>;
  hasMore: WritableSignal<boolean>;
  initialize: ReturnType<typeof vi.fn>;
  cleanup: ReturnType<typeof vi.fn>;
  attachListeners: ReturnType<typeof vi.fn>;
  detachListeners: ReturnType<typeof vi.fn>;
  setErrorCallback: ReturnType<typeof vi.fn>;
  fetchNext: ReturnType<typeof vi.fn>;
  search: ReturnType<typeof vi.fn>;
  removeMember: ReturnType<typeof vi.fn>;
  updateMemberScopeInList: ReturnType<typeof vi.fn>;
  appendMember: ReturnType<typeof vi.fn>;
  kickMember: ReturnType<typeof vi.fn>;
  banMember: ReturnType<typeof vi.fn>;
  updateMemberScope: ReturnType<typeof vi.fn>;
}

function makeGroupMembersService(): MockGroupMembersService {
  return {
    members: signal<CometChat.GroupMember[]>([]),
    fetchState: signal<States>(States.loaded),
    hasMore: signal<boolean>(true),
    initialize: vi.fn(),
    cleanup: vi.fn(),
    attachListeners: vi.fn(),
    detachListeners: vi.fn(),
    setErrorCallback: vi.fn(),
    fetchNext: vi.fn().mockResolvedValue(undefined),
    search: vi.fn(),
    removeMember: vi.fn(),
    updateMemberScopeInList: vi.fn(),
    appendMember: vi.fn(),
    kickMember: vi.fn().mockResolvedValue(undefined),
    banMember: vi.fn().mockResolvedValue(undefined),
    updateMemberScope: vi.fn().mockResolvedValue(undefined),
  };
}

// ---------------------------------------------------------------------------

interface BuildOptions {
  /** `null` builds the component with no group input, hitting the early return. */
  group?: CometChat.Group | null;
  hideUserStatus?: boolean;
  groupMemberRequestBuilder?: CometChat.GroupMembersRequestBuilder;
  searchRequestBuilder?: CometChat.GroupMembersRequestBuilder;
  selectionMode?: SelectionMode;
  /** Resolution value for CometChat.getLoggedinUser. */
  loggedInUser?: CometChat.User | null;
  /** Make CometChat.getLoggedinUser reject instead of resolve. */
  loggedInUserRejects?: unknown;
  /** Skip the first change detection, leaving @ViewChild refs unresolved. */
  detect?: boolean;
}

describe('CometChatGroupMembersComponent — lifecycle and service wiring', () => {
  let fixture: ComponentFixture<CometChatGroupMembersComponent>;
  let c: CometChatGroupMembersComponent;
  let service: MockGroupMembersService;
  let getLoggedinUser: ReturnType<typeof vi.fn>;
  let logError: MockInstance<LogFn>;
  let logWarn: MockInstance<LogFn>;

  const group = makeGroup();

  async function build(opts: BuildOptions = {}): Promise<void> {
    service = makeGroupMembersService();

    getLoggedinUser = vi.fn();
    if ('loggedInUserRejects' in opts) {
      getLoggedinUser.mockRejectedValue(opts.loggedInUserRejects);
    } else {
      getLoggedinUser.mockResolvedValue(opts.loggedInUser ?? null);
    }
    vi.spyOn(CometChat, 'getLoggedinUser').mockImplementation(
      getLoggedinUser as unknown as typeof CometChat.getLoggedinUser
    );

    // The default log level suppresses warn output, but the call still has to
    // be observable — spy rather than read the console.
    logError = vi.spyOn(CometChatLogger, 'error').mockImplementation(() => undefined);
    logWarn = vi.spyOn(CometChatLogger, 'warn').mockImplementation(() => undefined);

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ imports: [CometChatGroupMembersComponent] });
    // GroupMembersService is declared in the component's own `providers`, so
    // the component injector would win over any module-level provider.
    TestBed.overrideComponent(CometChatGroupMembersComponent, {
      set: { providers: [{ provide: GroupMembersService, useValue: service }] },
    });
    await TestBed.compileComponents();

    fixture = TestBed.createComponent(CometChatGroupMembersComponent);
    c = fixture.componentInstance;

    // Inputs must be in place before the first change detection; setting them
    // afterwards trips Angular's changed-after-checked guard.
    if (opts.group !== null) c.group = opts.group ?? group;
    if (opts.hideUserStatus !== undefined) c.hideUserStatus = opts.hideUserStatus;
    if (opts.groupMemberRequestBuilder) c.groupMemberRequestBuilder = opts.groupMemberRequestBuilder;
    if (opts.searchRequestBuilder) c.searchRequestBuilder = opts.searchRequestBuilder;
    if (opts.selectionMode !== undefined) c.selectionMode = opts.selectionMode;

    if (opts.detect !== false) fixture.detectChanges();
  }

  beforeEach(async () => {
    await build();
  });

  afterEach(() => {
    vi.useRealTimers();
    // CometChatGroupEvents subjects are static and shared; an undestroyed
    // fixture keeps reacting to events raised by later tests.
    fixture?.destroy();
    vi.restoreAllMocks();
  });

  // -------------------------------------------------------------------------
  // Harness sanity — if the component-level override failed, everything below
  // would silently be testing the real service.
  // -------------------------------------------------------------------------

  describe('Service override', () => {
    it('injects the mock service into the component, not the real one', () => {
      // Identity, not just behaviour: the real service would never record a call.
      expect(c['groupMembersService']).toBe(service as unknown as GroupMembersService);
      expect(service.initialize).toHaveBeenCalledTimes(1);
    });

    it('lets a member pushed into the mock signal drive the component', () => {
      // handleListFocus only moves focus when members() is non-empty, so the
      // index landing on 0 proves the component reads the mock's signal.
      c.handleListFocus();
      expect(c.focusedIndex()).toBe(-1);

      service.members.set([makeMember('alice')]);
      c.handleListFocus();

      expect(c.focusedIndex()).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // ngOnInit
  // -------------------------------------------------------------------------

  describe('ngOnInit', () => {
    it('fetches the logged-in user', () => {
      expect(getLoggedinUser).toHaveBeenCalled();
    });

    it('initializes the service', () => {
      expect(service.cleanup).toHaveBeenCalled();
      expect(service.initialize).toHaveBeenCalled();
      expect(service.attachListeners).toHaveBeenCalled();
    });

    it('subscribes to the group events that mutate the list', () => {
      // A kick for this group reaches the service only if ngOnInit subscribed.
      CometChatGroupEvents.ccGroupMemberKicked.next({
        kickedFrom: group,
        kickedUser: makeMember('alice'),
      } as unknown as IGroupMemberKickedBanned);
      expect(service.removeMember).toHaveBeenCalledWith('alice');
    });
  });

  // -------------------------------------------------------------------------
  // ngOnDestroy
  // -------------------------------------------------------------------------

  describe('ngOnDestroy', () => {
    it('clears every pending timer and empties the list', () => {
      const t1 = setTimeout(() => undefined, 60_000);
      const t2 = setTimeout(() => undefined, 60_000);
      (c as unknown as { pendingTimers: ReturnType<typeof setTimeout>[] }).pendingTimers = [t1, t2];
      const clearSpy = vi.spyOn(globalThis, 'clearTimeout');

      fixture.destroy();

      expect(clearSpy).toHaveBeenCalledWith(t1);
      expect(clearSpy).toHaveBeenCalledWith(t2);
      expect(
        (c as unknown as { pendingTimers: ReturnType<typeof setTimeout>[] }).pendingTimers
      ).toEqual([]);
      clearSpy.mockRestore();
    });

    it('cleans up the service', () => {
      const before = service.cleanup.mock.calls.length;
      fixture.destroy();
      expect(service.cleanup.mock.calls.length).toBe(before + 1);
    });

    it('completes the search subject', () => {
      const subject = (c as unknown as { searchSubject$: { isStopped: boolean } }).searchSubject$;
      expect(subject.isStopped).toBe(false);
      fixture.destroy();
      expect(subject.isStopped).toBe(true);
    });

    it('stops reacting to group events once destroyed', () => {
      fixture.destroy();
      service.removeMember.mockClear();
      CometChatGroupEvents.ccGroupMemberKicked.next({
        kickedFrom: group,
        kickedUser: makeMember('alice'),
      } as unknown as IGroupMemberKickedBanned);
      expect(service.removeMember).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // fetchLoggedInUser
  // -------------------------------------------------------------------------

  describe('fetchLoggedInUser', () => {
    it('stores the resolved user', async () => {
      const user = makeUser('ada');
      await build({ loggedInUser: user });
      await flush();
      expect(c.loggedInUser()).toBe(user);
    });

    it('leaves the signal null when the SDK resolves nothing', async () => {
      await build({ loggedInUser: null });
      await flush();
      expect(c.loggedInUser()).toBeNull();
    });

    it('logs a rejection instead of letting it escape', async () => {
      await build({ loggedInUserRejects: new Error('not logged in') });
      await flush();
      expect(logError).toHaveBeenCalled();
      expect(logError.mock.calls[0][0]).toBe('CometChatGroupMembers');
      expect(c.loggedInUser()).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // initializeService
  // -------------------------------------------------------------------------

  describe('initializeService', () => {
    it('warns and touches nothing when no group is supplied', async () => {
      await build({ group: null });
      expect(logWarn).toHaveBeenCalledWith(
        'CometChatGroupMembers',
        'No group input provided.'
      );
      expect(service.cleanup).not.toHaveBeenCalled();
      expect(service.setErrorCallback).not.toHaveBeenCalled();
      expect(service.initialize).not.toHaveBeenCalled();
      expect(service.attachListeners).not.toHaveBeenCalled();
    });

    it('clears stale state before initializing, not after', () => {
      expect(service.cleanup).toHaveBeenCalledTimes(1);
      expect(service.cleanup.mock.invocationCallOrder[0])
        .toBeLessThan(service.initialize.mock.invocationCallOrder[0]);
    });

    it('registers an error callback', () => {
      expect(service.setErrorCallback).toHaveBeenCalledTimes(1);
      expect(typeof service.setErrorCallback.mock.calls[0][0]).toBe('function');
    });

    it('initializes with no builder when none is given', () => {
      expect(service.initialize).toHaveBeenCalledWith(group, undefined);
    });

    it('forwards a supplied groupMemberRequestBuilder', async () => {
      const builder = makeBuilder();
      await build({ groupMemberRequestBuilder: builder });
      expect(service.initialize).toHaveBeenCalledWith(group, builder);
    });

    it('attaches listeners for the group guid with user status visible', () => {
      expect(service.attachListeners).toHaveBeenCalledWith('guid-1', false);
    });

    it('passes hideUserStatus through to attachListeners', async () => {
      await build({ hideUserStatus: true });
      expect(service.attachListeners).toHaveBeenCalledWith('guid-1', true);
    });

    it('records the error and emits it when the service callback fires', () => {
      const emitted: CometChat.CometChatException[] = [];
      c.error.subscribe(e => emitted.push(e));

      const callback = service.setErrorCallback.mock
        .calls[0][0] as (e: CometChat.CometChatException) => void;
      const ex = makeException('GROUP_MEMBERS_ERROR', 'fetch failed');
      callback(ex);

      expect(c.lastError).toBe(ex as unknown as Error);
      expect(emitted).toEqual([ex]);
    });
  });

  // -------------------------------------------------------------------------
  // Search debouncing
  // -------------------------------------------------------------------------

  describe('onSearch and handleSearchTextChange', () => {
    it('does not reach the service before the debounce elapses', () => {
      vi.useFakeTimers();
      c.onSearch('ada');
      vi.advanceTimersByTime(299);
      expect(service.search).not.toHaveBeenCalled();
    });

    it('searches once the debounce elapses', () => {
      vi.useFakeTimers();
      c.onSearch('ada');
      vi.advanceTimersByTime(300);
      expect(service.search).toHaveBeenCalledTimes(1);
      expect(service.search).toHaveBeenCalledWith('ada', undefined);
    });

    it('forwards a supplied searchRequestBuilder', async () => {
      const builder = makeBuilder();
      await build({ searchRequestBuilder: builder });
      vi.useFakeTimers();
      c.onSearch('ada');
      vi.advanceTimersByTime(300);
      expect(service.search).toHaveBeenCalledWith('ada', builder);
    });

    it('publishes the keyword to searchText', () => {
      vi.useFakeTimers();
      c.onSearch('ada');
      vi.advanceTimersByTime(300);
      expect(c.searchText()).toBe('ada');
    });

    it('resets the first-fetch flag so the next page re-checks emptiness', () => {
      (c as unknown as { isFirstFetch: boolean }).isFirstFetch = false;
      vi.useFakeTimers();
      c.onSearch('ada');
      vi.advanceTimersByTime(300);
      expect((c as unknown as { isFirstFetch: boolean }).isFirstFetch).toBe(true);
    });

    it('ignores a repeat of the same keyword', () => {
      vi.useFakeTimers();
      c.onSearch('ada');
      vi.advanceTimersByTime(300);
      c.onSearch('ada');
      vi.advanceTimersByTime(300);
      expect(service.search).toHaveBeenCalledTimes(1);
    });

    it('collapses a burst of keystrokes into the last one', () => {
      vi.useFakeTimers();
      c.onSearch('a');
      c.onSearch('ad');
      c.onSearch('ada');
      vi.advanceTimersByTime(300);
      expect(service.search).toHaveBeenCalledTimes(1);
      expect(service.search).toHaveBeenCalledWith('ada', undefined);
    });

    it('searches again for a genuinely new keyword', () => {
      vi.useFakeTimers();
      c.onSearch('ada');
      vi.advanceTimersByTime(300);
      c.onSearch('bob');
      vi.advanceTimersByTime(300);
      expect(service.search).toHaveBeenCalledTimes(2);
      expect(service.search).toHaveBeenLastCalledWith('bob', undefined);
      expect(c.searchText()).toBe('bob');
    });

    it('treats clearing the box as a search for the empty string', () => {
      vi.useFakeTimers();
      c.onSearch('ada');
      vi.advanceTimersByTime(300);
      c.onSearch('');
      vi.advanceTimersByTime(300);
      expect(service.search).toHaveBeenLastCalledWith('', undefined);
      expect(c.searchText()).toBe('');
    });
  });

  // -------------------------------------------------------------------------
  // Pagination
  // -------------------------------------------------------------------------

  describe('onLoadMore', () => {
    it('asks the service for the next page', () => {
      c.onLoadMore();
      expect(service.fetchNext).toHaveBeenCalledTimes(1);
    });

    it('tells the paginated list the load finished', async () => {
      const loadComplete = vi.spyOn(c.paginatedList!, 'loadComplete');
      c.onLoadMore();
      await flush();
      expect(loadComplete).toHaveBeenCalledTimes(1);
    });

    it('checks for emptiness on the first page only', async () => {
      let empties = 0;
      c.empty.subscribe(() => empties++);

      c.onLoadMore();
      await flush();
      expect(empties).toBe(1);
      expect((c as unknown as { isFirstFetch: boolean }).isFirstFetch).toBe(false);

      c.onLoadMore();
      await flush();
      expect(empties).toBe(1);
    });

    it('still settles the paginated list when the fetch fails', async () => {
      const loadComplete = vi.spyOn(c.paginatedList!, 'loadComplete');
      service.fetchNext.mockRejectedValueOnce(new Error('network down'));

      c.onLoadMore();
      await flush();

      expect(loadComplete).toHaveBeenCalledTimes(1);
    });

    it('does not emit empty when the fetch fails', async () => {
      let empties = 0;
      c.empty.subscribe(() => empties++);
      service.fetchNext.mockRejectedValueOnce(new Error('network down'));

      c.onLoadMore();
      await flush();

      expect(empties).toBe(0);
      expect((c as unknown as { isFirstFetch: boolean }).isFirstFetch).toBe(true);
    });

    it('completes the first load even when the list is not rendered yet', async () => {
      await build({ detect: false });
      expect(c.paginatedList).toBeUndefined();
      let empties = 0;
      c.empty.subscribe(() => empties++);

      c.onLoadMore();
      await flush();

      // Both of these sit after the optional loadComplete() call, so they only
      // happen if the missing list did not abort the success handler.
      expect((c as unknown as { isFirstFetch: boolean }).isFirstFetch).toBe(false);
      expect(empties).toBe(1);
    });

    it('runs the failure handler when the list is not rendered yet', async () => {
      await build({ detect: false });
      const markForCheck = vi.spyOn(
        (c as unknown as { cdr: ChangeDetectorRef }).cdr,
        'markForCheck'
      );
      service.fetchNext.mockRejectedValueOnce(new Error('network down'));

      c.onLoadMore();
      await flush();

      // markForCheck is the only observable effect of the catch block once
      // there is no paginated list to settle.
      expect(markForCheck).toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // Item click
  // -------------------------------------------------------------------------

  describe('onItemClick', () => {
    it('emits itemClick when selection is off', () => {
      const member = makeMember('alice');
      const clicked: CometChat.GroupMember[] = [];
      c.itemClick.subscribe(m => clicked.push(m));

      c.onItemClick(member);

      expect(clicked).toEqual([member]);
    });

    it('routes into selection instead of itemClick when a mode is set', async () => {
      await build({ selectionMode: SelectionMode.single });
      const member = makeMember('alice');
      // The member has to be in the list the component reads, otherwise the
      // selection path would be exercised against an index of -1.
      service.members.set([member]);
      const clicked: CometChat.GroupMember[] = [];
      const selections: SelectionState[] = [];
      c.itemClick.subscribe(m => clicked.push(m));
      c.selectionChange.subscribe(s => selections.push(s));

      c.onItemClick(member);

      expect(clicked).toEqual([]);
      expect(selections).toHaveLength(1);
      expect(selections[0].lastSelectedId).toBe('alice');
      expect([...selections[0].selectedIds]).toEqual(['alice']);
      expect(c.isMemberSelected(member)).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // Empty state
  // -------------------------------------------------------------------------

  describe('checkEmptyState', () => {
    it('stays quiet when the first page brought members back', async () => {
      let empties = 0;
      c.empty.subscribe(() => empties++);
      // A real fetch populates the service's own signal; the component decides
      // emptiness from that list, not from the fetch result.
      service.fetchNext.mockImplementationOnce(async () => {
        service.members.set([makeMember('alice')]);
      });

      c.onLoadMore();
      await flush();

      expect(service.members()).toHaveLength(1);
      expect(empties).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // Retry
  // -------------------------------------------------------------------------

  describe('handleRetryClick', () => {
    it('does nothing without a group', async () => {
      await build({ group: null });
      service.cleanup.mockClear();
      service.initialize.mockClear();
      service.attachListeners.mockClear();
      service.setErrorCallback.mockClear();
      service.fetchNext.mockClear();

      c.handleRetryClick();

      expect(service.cleanup).not.toHaveBeenCalled();
      expect(service.initialize).not.toHaveBeenCalled();
      expect(service.attachListeners).not.toHaveBeenCalled();
      expect(service.setErrorCallback).not.toHaveBeenCalled();
      expect(service.fetchNext).not.toHaveBeenCalled();
    });

    it('clears the recorded error', () => {
      c.lastError = new Error('previous failure');
      c.handleRetryClick();
      expect(c.lastError).toBeNull();
    });

    it('re-runs the service initialization', () => {
      service.cleanup.mockClear();
      service.initialize.mockClear();
      service.attachListeners.mockClear();

      c.handleRetryClick();

      expect(service.cleanup).toHaveBeenCalledTimes(1);
      expect(service.initialize).toHaveBeenCalledWith(group, undefined);
      expect(service.attachListeners).toHaveBeenCalledWith('guid-1', false);
    });

    it('fetches the first page again', () => {
      service.fetchNext.mockClear();
      c.handleRetryClick();
      expect(service.fetchNext).toHaveBeenCalledTimes(1);
    });

    it('registers a fresh error callback that still reports upward', () => {
      c.handleRetryClick();
      const callback = service.setErrorCallback.mock.calls.at(-1)![0] as (
        e: CometChat.CometChatException
      ) => void;

      const emitted: CometChat.CometChatException[] = [];
      c.error.subscribe(e => emitted.push(e));
      const ex = makeException();
      callback(ex);

      expect(emitted).toEqual([ex]);
      expect(c.lastError).toBe(ex as unknown as Error);
    });
  });
});
