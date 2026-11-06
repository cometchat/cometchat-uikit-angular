/**
 * CometChatGroups — behaviour coverage tests
 *
 * The existing suites drive this component against the globally stubbed chat
 * SDK, whose GroupsRequest always resolves an empty page. The list therefore
 * never reaches `States.loaded` and never holds a group, so every
 * data-dependent path — selection, keyboard navigation, focus tracking, group
 * event handling, retry — is unreachable from them and passes vacuously.
 *
 * These tests replace the data layer instead of the session. `GroupsService`
 * is declared in the component's own `providers`, so a module-level provider
 * is shadowed by the component injector and the component metadata itself has
 * to be overridden — see `build()`.
 *
 * Behaviour is driven by calling methods on the instance rather than through
 * the rendered list: rendering a populated list instantiates the real
 * group-item tree, which needs a far wider SDK surface than anything under
 * test here. The shell is still rendered once per test so the `@ViewChild`
 * refs and the template-facing getters are exercised for real.
 */

// The calls SDK reaches for JitsiMeetJS at import time, which jsdom lacks.
vi.mock('@cometchat/calls-sdk-javascript', () => ({
  CometChatCalls: {
    init: vi.fn().mockResolvedValue(true),
    generateToken: vi.fn().mockResolvedValue({ token: 'mock-token' }),
  },
}));

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TemplateRef, signal, WritableSignal } from '@angular/core';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatGroupsComponent } from './cometchat-groups.component';
import { CometChatGroupEvents } from '../../events/CometChatGroupEvents';
import { GroupsService } from '../../services/groups.service';
import { ChatStateService } from '../../services/chat-state.service';
import { LiveAnnouncerService } from '../../services/live-announcer.service';
import { CometChatTemplatesService } from '../../services/templates.service';
import { SelectionMode, States } from '../../Enums/Enums';
import { SelectionState } from '../../modals/SelectionState';
import { CometChatOption } from '../../modals/CometChatOption';
import { CometChatLocalize } from '../../resources/CometChatLocalize/cometchat-localize';

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

type SelectPayload = { group: CometChat.Group; selected: boolean };

/**
 * Groups are reduced to the accessors the component calls, plus the handful
 * the group-item row reads — a change detection pass can reach a seeded list,
 * and a row missing one of its getters throws out of the render instead of
 * failing a test.
 */
function makeGroup(
  guid: string,
  name: string = guid,
  type = 'public',
  membersCount = 5
): CometChat.Group {
  return {
    getGuid: () => guid,
    getName: () => name,
    getType: () => type,
    getMembersCount: () => membersCount,
    getIcon: () => '',
    getDescription: () => '',
    getOwner: () => 'owner',
    getHasJoined: () => true,
    getScope: () => 'participant',
  } as unknown as CometChat.Group;
}

/** Exercises the `getName() || ''` fallbacks, which a defaulted argument cannot. */
function makeNamelessGroup(guid: string): CometChat.Group {
  return {
    ...(makeGroup(guid) as unknown as Record<string, unknown>),
    getName: () => undefined,
    getMembersCount: () => 2,
  } as unknown as CometChat.Group;
}

/** A request builder stand-in — the component only forwards the reference. */
function makeBuilder(): CometChat.GroupsRequestBuilder {
  return { build: vi.fn() } as unknown as CometChat.GroupsRequestBuilder;
}

function makeException(code = 'ERR_GROUPS', message = 'boom'): CometChat.CometChatException {
  return { code, message, details: '' } as unknown as CometChat.CometChatException;
}

/** Distinct sentinel template refs — the getters only pass references along. */
function makeTemplate(tag: string): TemplateRef<any> {
  return { __tag: tag } as unknown as TemplateRef<any>;
}

/** Lets the component's promise chains settle under real timers. */
function flush(): Promise<void> {
  return new Promise<void>(resolve => setTimeout(resolve, 0));
}

function wait(ms: number): Promise<void> {
  return new Promise<void>(resolve => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Service doubles
// ---------------------------------------------------------------------------

/**
 * `groups`, `fetchState` and `hasMore` are read as signals by the component
 * and by `toObservable` in its constructor, so they are backed by writable
 * signals a test can push into.
 */
interface MockGroupsService {
  groups: WritableSignal<CometChat.Group[]>;
  fetchState: WritableSignal<States>;
  hasMore: WritableSignal<boolean>;
  initialize: ReturnType<typeof vi.fn>;
  cleanup: ReturnType<typeof vi.fn>;
  attachListeners: ReturnType<typeof vi.fn>;
  detachListeners: ReturnType<typeof vi.fn>;
  setErrorCallback: ReturnType<typeof vi.fn>;
  fetchNext: ReturnType<typeof vi.fn>;
  search: ReturnType<typeof vi.fn>;
  prependGroup: ReturnType<typeof vi.fn>;
  removeGroup: ReturnType<typeof vi.fn>;
  updateGroup: ReturnType<typeof vi.fn>;
}

function makeGroupsService(): MockGroupsService {
  return {
    groups: signal<CometChat.Group[]>([]),
    fetchState: signal<States>(States.loaded),
    hasMore: signal<boolean>(true),
    initialize: vi.fn(),
    cleanup: vi.fn(),
    attachListeners: vi.fn(),
    detachListeners: vi.fn(),
    setErrorCallback: vi.fn(),
    fetchNext: vi.fn().mockResolvedValue(undefined),
    search: vi.fn(),
    prependGroup: vi.fn(),
    removeGroup: vi.fn(),
    updateGroup: vi.fn(),
  };
}

interface MockChatState {
  activeGroup: CometChat.Group | null;
  setActiveGroup: ReturnType<typeof vi.fn>;
  getActiveGroup: ReturnType<typeof vi.fn>;
}

/** The paginated list shares this service, so the whole surface is stubbed. */
function makeAnnouncer() {
  return {
    announce: vi.fn(),
    announceError: vi.fn(),
    announceStatus: vi.fn(),
    clear: vi.fn(),
  };
}

// ---------------------------------------------------------------------------

interface BuildOptions {
  selectionMode?: SelectionMode;
  activeGroup?: CometChat.Group;
  groupsRequestBuilder?: CometChat.GroupsRequestBuilder;
  searchRequestBuilder?: CometChat.GroupsRequestBuilder;
  /** Skip the first change detection, leaving ngOnInit and @ViewChild refs alone. */
  detect?: boolean;
}

describe('CometChatGroupsComponent — behaviour coverage', () => {
  let fixture: ComponentFixture<CometChatGroupsComponent>;
  let c: CometChatGroupsComponent;
  let service: MockGroupsService;
  let chatState: MockChatState;
  let announcer: ReturnType<typeof makeAnnouncer>;
  let templates: CometChatTemplatesService;

  let selectEvents: SelectPayload[];
  let selectionStates: SelectionState[];
  let errorEvents: CometChat.CometChatException[];

  /** Synthetic event targets — the keyboard and focus handlers only read `target`. */
  let host: HTMLElement;
  let itemTarget: HTMLElement;
  let searchTarget: HTMLElement;

  const g1 = makeGroup('g1', 'Alpha');
  const g2 = makeGroup('g2', 'Beta', 'private', 1);
  const g3 = makeGroup('g3', 'Gamma', 'password', 9);

  async function build(opts: BuildOptions = {}): Promise<void> {
    service = makeGroupsService();
    chatState = {
      activeGroup: null,
      setActiveGroup: vi.fn(),
      getActiveGroup: vi.fn(() => chatState.activeGroup),
    };
    announcer = makeAnnouncer();

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [CometChatGroupsComponent],
      providers: [
        { provide: ChatStateService, useValue: chatState },
        { provide: LiveAnnouncerService, useValue: announcer },
      ],
    });
    // GroupsService lives in the component's own `providers`, so the component
    // injector would win over anything registered above.
    TestBed.overrideComponent(CometChatGroupsComponent, {
      set: { providers: [{ provide: GroupsService, useValue: service }] },
    });
    await TestBed.compileComponents();

    templates = TestBed.inject(CometChatTemplatesService);

    fixture = TestBed.createComponent(CometChatGroupsComponent);
    c = fixture.componentInstance;

    // Inputs must be in place before the first change detection; setting them
    // afterwards trips Angular's changed-after-checked guard.
    if (opts.selectionMode !== undefined) c.selectionMode = opts.selectionMode;
    if (opts.activeGroup) c.activeGroup = opts.activeGroup;
    if (opts.groupsRequestBuilder) c.groupsRequestBuilder = opts.groupsRequestBuilder;
    if (opts.searchRequestBuilder) c.searchRequestBuilder = opts.searchRequestBuilder;

    selectEvents = [];
    selectionStates = [];
    errorEvents = [];
    c.select.subscribe(e => selectEvents.push(e));
    c.selectionChange.subscribe(s => selectionStates.push(s));
    c.error.subscribe(e => errorEvents.push(e));

    if (opts.detect !== false) {
      fixture.detectChanges();
      // Let the initial fetch's promise chain settle so a stray `.then` cannot
      // overwrite list state a test sets up afterwards.
      await flush();
    }

    host = document.createElement('div');
    host.className = 'cometchat-groups';
    itemTarget = document.createElement('div');
    itemTarget.className = 'cometchat-group-item';
    host.appendChild(itemTarget);
    const searchBar = document.createElement('div');
    searchBar.className = 'cometchat-groups__search-bar';
    searchTarget = document.createElement('span');
    searchBar.appendChild(searchTarget);
    host.appendChild(searchBar);
    document.body.appendChild(host);
  }

  /** Puts the component and its service into a loaded, populated state. */
  function seed(groups: CometChat.Group[], state: States = States.loaded): void {
    service.groups.set(groups);
    service.fetchState.set(state);
    c.groupList = groups;
    c.fetchState = state;
  }

  /**
   * Dispatches a real keydown so the event carries a `target`, which the
   * shared handler needs for its containment checks.
   */
  function pressKey(init: KeyboardEventInit, target: HTMLElement = itemTarget): KeyboardEvent {
    const event = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init });
    const forward = (e: Event) => c.onGroupsKeyDown(e as KeyboardEvent);
    target.addEventListener('keydown', forward);
    target.dispatchEvent(event);
    target.removeEventListener('keydown', forward);
    return event;
  }

  /** The error callback the component hands to the service on init. */
  function serviceErrorCallback(): (error: unknown) => void {
    return service.setErrorCallback.mock.calls[0][0] as (error: unknown) => void;
  }

  beforeEach(async () => {
    await build();
  });

  afterEach(() => {
    vi.useRealTimers();
    // CometChatGroupEvents subjects are static and shared; an undestroyed
    // fixture keeps reacting to events raised by later tests.
    fixture?.destroy();
    host?.remove();
    vi.restoreAllMocks();
  });

  // -------------------------------------------------------------------------
  // Lifecycle
  // -------------------------------------------------------------------------

  describe('constructor', () => {
    it('tracks the service hasMore signal through the constructor subscription', async () => {
      service.hasMore.set(false);
      await flush();
      expect(c.hasMore()).toBe(false);
      service.hasMore.set(true);
      await flush();
      expect(c.hasMore()).toBe(true);
    });
  });

  describe('ngOnInit', () => {
    it('seeds the service with the current search text and both builders', async () => {
      const groupsBuilder = makeBuilder();
      const searchBuilder = makeBuilder();
      await build({ groupsRequestBuilder: groupsBuilder, searchRequestBuilder: searchBuilder });
      expect(service.initialize).toHaveBeenCalledWith({
        searchText: '',
        groupsRequestBuilder: groupsBuilder,
        searchRequestBuilder: searchBuilder,
        groupsSearchText: '',
      });
    });

    it('passes null for builders that were never supplied', () => {
      expect(service.initialize).toHaveBeenCalledWith({
        searchText: '',
        groupsRequestBuilder: null,
        searchRequestBuilder: null,
        groupsSearchText: '',
      });
    });

    it('attaches the group listeners and fetches the first page exactly once', () => {
      expect(service.initialize).toHaveBeenCalledTimes(1);
      expect(service.attachListeners).toHaveBeenCalledTimes(1);
      expect(service.fetchNext).toHaveBeenCalledTimes(1);
    });

    it('publishes a service error through lastError and the error output', () => {
      const failure = makeException();
      serviceErrorCallback()(failure);
      expect(c.lastError).toBe(failure as unknown as Error);
      expect(errorEvents).toEqual([failure]);
    });
  });

  describe('ngOnDestroy', () => {
    it('cancels pending timers so queued focus work never runs', async () => {
      let fired = false;
      c['pendingTimers'].push(setTimeout(() => (fired = true), 5));
      c.ngOnDestroy();
      await wait(30);
      expect(fired).toBe(false);
      expect(c['pendingTimers']).toEqual([]);
    });

    it('hands cleanup back to the service', () => {
      c.ngOnDestroy();
      expect(service.cleanup).toHaveBeenCalledTimes(1);
    });
  });

  // -------------------------------------------------------------------------
  // Template-facing getters
  // -------------------------------------------------------------------------

  describe('Effective view getters', () => {
    it('prefers listItemTemplate, then itemView, then the service template', () => {
      const fromService = makeTemplate('service-item');
      templates.setGroupTemplates({ itemView: fromService });
      expect(c.effectiveItemView).toBe(fromService);

      const fromInput = makeTemplate('input-item');
      c.itemView = fromInput;
      expect(c.effectiveItemView).toBe(fromInput);

      const legacy = makeTemplate('legacy-item');
      c.listItemTemplate = legacy;
      expect(c.effectiveItemView).toBe(legacy);
    });

    it('falls back to the service templates for each item slot', () => {
      const leading = makeTemplate('leading');
      const title = makeTemplate('title');
      const subtitle = makeTemplate('subtitle');
      const trailing = makeTemplate('trailing');
      templates.setGroupTemplates({
        leadingView: leading,
        titleView: title,
        subtitleView: subtitle,
        trailingView: trailing,
      });
      expect(c.effectiveLeadingView).toBe(leading);
      expect(c.effectiveTitleView).toBe(title);
      expect(c.effectiveSubtitleView).toBe(subtitle);
      expect(c.effectiveTrailingView).toBe(trailing);
    });

    it('lets each item slot input win over the service template', () => {
      templates.setGroupTemplates({
        leadingView: makeTemplate('s-leading'),
        titleView: makeTemplate('s-title'),
        subtitleView: makeTemplate('s-subtitle'),
        trailingView: makeTemplate('s-trailing'),
      });
      const leading = makeTemplate('i-leading');
      const title = makeTemplate('i-title');
      const subtitle = makeTemplate('i-subtitle');
      const trailing = makeTemplate('i-trailing');
      c.leadingView = leading;
      c.titleView = title;
      c.subtitleView = subtitle;
      c.trailingView = trailing;
      expect(c.effectiveLeadingView).toBe(leading);
      expect(c.effectiveTitleView).toBe(title);
      expect(c.effectiveSubtitleView).toBe(subtitle);
      expect(c.effectiveTrailingView).toBe(trailing);
    });

    it('returns undefined for item slots with no input and no service template', () => {
      expect(c.effectiveItemView).toBeUndefined();
      expect(c.effectiveLeadingView).toBeUndefined();
      expect(c.effectiveTitleView).toBeUndefined();
      expect(c.effectiveSubtitleView).toBeUndefined();
      expect(c.effectiveTrailingView).toBeUndefined();
    });

    it('resolves state views through the service when no input is given', () => {
      const loading = makeTemplate('loading');
      const empty = makeTemplate('empty');
      const error = makeTemplate('error');
      templates.setGroupTemplates({
        loadingView: loading,
        emptyView: empty,
        errorView: error,
      });
      expect(c.effectiveLoadingView).toBe(loading);
      expect(c.effectiveEmptyView).toBe(empty);
      expect(c.effectiveErrorView).toBe(error);
    });

    it('lets the state view inputs win over the resolved service templates', () => {
      templates.setGroupTemplates({
        loadingView: makeTemplate('s-loading'),
        emptyView: makeTemplate('s-empty'),
        errorView: makeTemplate('s-error'),
      });
      const loading = makeTemplate('i-loading');
      const empty = makeTemplate('i-empty');
      const error = makeTemplate('i-error');
      c.loadingView = loading;
      c.emptyView = empty;
      c.errorView = error;
      expect(c.effectiveLoadingView).toBe(loading);
      expect(c.effectiveEmptyView).toBe(empty);
      expect(c.effectiveErrorView).toBe(error);
    });

    it('lets the legacy state templates win over everything else', () => {
      c.loadingView = makeTemplate('i-loading');
      c.emptyView = makeTemplate('i-empty');
      c.errorView = makeTemplate('i-error');
      const loading = makeTemplate('legacy-loading');
      const empty = makeTemplate('legacy-empty');
      const error = makeTemplate('legacy-error');
      c.loadingStateTemplate = loading;
      c.emptyStateTemplate = empty;
      c.errorStateTemplate = error;
      expect(c.effectiveLoadingView).toBe(loading);
      expect(c.effectiveEmptyView).toBe(empty);
      expect(c.effectiveErrorView).toBe(error);
    });

    it('returns undefined for state views when nothing is registered anywhere', () => {
      expect(c.effectiveLoadingView).toBeUndefined();
      expect(c.effectiveEmptyView).toBeUndefined();
      expect(c.effectiveErrorView).toBeUndefined();
    });
  });

  // -------------------------------------------------------------------------
  // Fetching and pagination
  // -------------------------------------------------------------------------

  describe('Pagination', () => {
    it('ignores a load-more request while a fetch is already in flight', () => {
      service.fetchNext.mockClear();
      c.isFetchingMore.set(true);
      c.handleLoadMore();
      expect(service.fetchNext).not.toHaveBeenCalled();
    });

    it('ignores a load-more request once the last page has arrived', () => {
      service.fetchNext.mockClear();
      c.isFetchingMore.set(false);
      c.hasMore.set(false);
      c.handleLoadMore();
      expect(service.fetchNext).not.toHaveBeenCalled();
    });

    it('fetches the next page when idle and more data remains', async () => {
      service.fetchNext.mockClear();
      c.hasMore.set(true);
      c.handleLoadMore();
      expect(service.fetchNext).toHaveBeenCalledTimes(1);
      await flush();
      expect(c.isFetchingMore()).toBe(false);
    });

    it('refuses a direct fetch while one is already in flight', () => {
      service.fetchNext.mockClear();
      c.isFetchingMore.set(true);
      c.hasMore.set(true);
      c.fetchNextAndAppendGroups();
      expect(service.fetchNext).not.toHaveBeenCalled();
      // The guard must not clear the flag the in-flight fetch owns.
      expect(c.isFetchingMore()).toBe(true);
    });

    it('refuses a direct fetch once the last page has arrived', () => {
      service.fetchNext.mockClear();
      c.isFetchingMore.set(false);
      c.hasMore.set(false);
      c.fetchNextAndAppendGroups();
      expect(service.fetchNext).not.toHaveBeenCalled();
      expect(c.isFetchingMore()).toBe(false);
    });

    it('shows the shimmer only while the first page is loading', () => {
      (c as any).isFirstFetch = true;
      c.fetchState = States.loaded;
      c.fetchNextAndAppendGroups();
      expect(c.fetchState).toBe(States.loading);
    });

    it('leaves the current state alone when paging beyond the first page', () => {
      (c as any).isFirstFetch = false;
      c.fetchState = States.loaded;
      c.fetchNextAndAppendGroups();
      expect(c.fetchState).toBe(States.loaded);
    });

    it('clears the in-flight flag and syncs state when a fetch rejects', async () => {
      const failure = makeException();
      c.lastError = failure as unknown as Error;
      service.fetchState.set(States.error);
      service.fetchNext.mockRejectedValueOnce(new Error('network'));
      c.hasMore.set(true);
      c.fetchNextAndAppendGroups();
      await flush();
      expect(c.isFetchingMore()).toBe(false);
      expect(c.fetchState).toBe(States.error);
      // The error state must not wipe the error the service reported.
      expect(c.lastError).toBe(failure as unknown as Error);
    });

    it('drops a stale error once the service leaves the error state', () => {
      c.lastError = makeException() as unknown as Error;
      service.fetchState.set(States.empty);
      c['syncStateFromService']();
      expect(c.lastError).toBeNull();
      expect(c.fetchState).toBe(States.empty);
    });

    it('marks the initial load complete once, and only once', async () => {
      // build() already ran the first fetch; the one-shot timer is pending.
      await wait(150);
      expect(c['initialLoadComplete']).toBe(true);
      const timersAfterFirstLoad = c['pendingTimers'].length;

      c.hasMore.set(true);
      c.fetchNextAndAppendGroups();
      await flush();
      expect(c['pendingTimers'].length).toBe(timersAfterFirstLoad);
    });

    it('tells the rendered paginated list that loading finished', async () => {
      const loadComplete = vi.spyOn(c.paginatedList!, 'loadComplete');
      c.hasMore.set(true);
      c.fetchNextAndAppendGroups();
      await flush();
      expect(loadComplete).toHaveBeenCalledTimes(1);
    });

    it('completes a fetch that resolves before the view is ever rendered', async () => {
      await build({ detect: false });
      service.groups.set([g1, g2]);
      // A follow-up page fetched before the list view exists: the completion
      // callback has to cope with an unresolved ViewChild.
      (c as any).isFirstFetch = false;
      (c as any).paginatedList = undefined;
      c.fetchNextAndAppendGroups();
      await flush();
      expect(c.isFetchingMore()).toBe(false);
      expect(c.groupList).toEqual([g1, g2]);
    });

    it('rebuilds the request and refetches when the list is refreshed', () => {
      seed([g1, g2]);
      service.initialize.mockClear();
      service.fetchNext.mockClear();
      c.hasMore.set(true);
      c['refreshGroupList']();
      expect(c.groupList).toEqual([]);
      expect(service.initialize).toHaveBeenCalledTimes(1);
      expect(service.fetchNext).toHaveBeenCalledTimes(1);
    });
  });

  // -------------------------------------------------------------------------
  // Search
  // -------------------------------------------------------------------------

  describe('Search', () => {
    it('debounces typing before handing the keyword to the service', async () => {
      service.search.mockClear();
      service.fetchNext.mockClear();
      seed([g1, g2]);
      c.onSearch('al');
      c.onSearch('alp');
      c.onSearch('alph');
      expect(service.search).not.toHaveBeenCalled();

      await wait(350);
      expect(service.search).toHaveBeenCalledTimes(1);
      expect(service.search).toHaveBeenCalledWith('alph', {
        groupsRequestBuilder: null,
        searchRequestBuilder: null,
      });
      expect(c.searchText).toBe('alph');
      expect(service.fetchNext).toHaveBeenCalledTimes(1);
    });

    it('forwards both request builders with the search keyword', async () => {
      const groupsBuilder = makeBuilder();
      const searchBuilder = makeBuilder();
      await build({ groupsRequestBuilder: groupsBuilder, searchRequestBuilder: searchBuilder });
      service.search.mockClear();
      c.onSearch('beta');
      await wait(350);
      expect(service.search).toHaveBeenCalledWith('beta', {
        groupsRequestBuilder: groupsBuilder,
        searchRequestBuilder: searchBuilder,
      });
    });

    it('ignores a repeated keyword instead of refetching', async () => {
      c.onSearch('alpha');
      await wait(350);
      service.search.mockClear();
      c.onSearch('alpha');
      await wait(350);
      expect(service.search).not.toHaveBeenCalled();
    });

    it('clears the visible list and restarts paging for a new keyword', async () => {
      seed([g1, g2, g3]);
      c.hasMore.set(false);
      c['handleSearchTextChange']('gamma');
      expect(service.search).toHaveBeenCalledWith('gamma', {
        groupsRequestBuilder: null,
        searchRequestBuilder: null,
      });
      expect(c.groupList).toEqual([]);
      // Paging restarts from the top: hasMore is re-armed even though the
      // previous keyword had already exhausted its pages.
      expect(c.hasMore()).toBe(true);
      expect(c.fetchState).toBe(States.loading);
      await flush();
    });
  });

  // -------------------------------------------------------------------------
  // Group events
  // -------------------------------------------------------------------------

  describe('Group events', () => {
    it('prepends a newly created group', () => {
      service.groups.set([g3, g1]);
      CometChatGroupEvents.ccGroupCreated.next(g3);
      expect(service.prependGroup).toHaveBeenCalledWith(g3);
      expect(c.groupList).toEqual([g3, g1]);
    });

    it('drops a deleted group from the list and from the selection', () => {
      seed([g1, g2]);
      c.selectedGroups.add('g2');
      service.groups.set([g1]);
      CometChatGroupEvents.ccGroupDeleted.next(g2);
      expect(service.removeGroup).toHaveBeenCalledWith('g2');
      expect(c.selectedGroups.has('g2')).toBe(false);
      expect(c.groupList).toEqual([g1]);
    });

    it('drops a private group the user left', () => {
      seed([g1, g2]);
      c.selectedGroups.add('g2');
      service.groups.set([g1]);
      CometChatGroupEvents.ccGroupLeft.next({
        userLeft: {} as CometChat.User,
        leftGroup: g2,
        message: {} as CometChat.Action,
      });
      expect(service.removeGroup).toHaveBeenCalledWith('g2');
      expect(service.updateGroup).not.toHaveBeenCalled();
      expect(c.selectedGroups.has('g2')).toBe(false);
    });

    it('keeps a public group the user left and refreshes it instead', () => {
      seed([g1, g3]);
      c.selectedGroups.add('g1');
      CometChatGroupEvents.ccGroupLeft.next({
        userLeft: {} as CometChat.User,
        leftGroup: g1,
        message: {} as CometChat.Action,
      });
      expect(service.updateGroup).toHaveBeenCalledWith(g1);
      expect(service.removeGroup).not.toHaveBeenCalled();
      // A public group stays in the list, so its selection must survive.
      expect(c.selectedGroups.has('g1')).toBe(true);
    });

    it('refreshes the group a member joined', () => {
      service.groups.set([g1]);
      CometChatGroupEvents.ccGroupMemberJoined.next({
        joinedUser: {} as CometChat.User,
        joinedGroup: g1,
      });
      expect(service.updateGroup).toHaveBeenCalledWith(g1);
      expect(c.groupList).toEqual([g1]);
    });

    it('refreshes the group a member was kicked from', () => {
      CometChatGroupEvents.ccGroupMemberKicked.next({
        message: {} as CometChat.Action,
        kickedFrom: g2,
        kickedUser: {} as CometChat.User,
        kickedBy: {} as CometChat.User,
      });
      expect(service.updateGroup).toHaveBeenCalledWith(g2);
    });

    it('refreshes the group a member was banned from', () => {
      CometChatGroupEvents.ccGroupMemberBanned.next({
        message: {} as CometChat.Action,
        kickedFrom: g3,
        kickedUser: {} as CometChat.User,
        kickedBy: {} as CometChat.User,
      });
      expect(service.updateGroup).toHaveBeenCalledWith(g3);
    });

    it('refreshes the group members were added to', () => {
      CometChatGroupEvents.ccGroupMemberAdded.next({
        messages: [],
        usersAdded: [],
        userAddedIn: g1,
        userAddedBy: {} as CometChat.User,
      });
      expect(service.updateGroup).toHaveBeenCalledWith(g1);
    });

    it('refreshes a group whose ownership changed', () => {
      CometChatGroupEvents.ccOwnershipChanged.next({
        group: g2,
        newOwner: {} as CometChat.GroupMember,
      });
      expect(service.updateGroup).toHaveBeenCalledWith(g2);
    });
  });

  // -------------------------------------------------------------------------
  // Item labels and click-through
  // -------------------------------------------------------------------------

  describe('Item labels', () => {
    it('uses the singular member label for a group of one', () => {
      expect(c.getMemberCountText(makeGroup('g', 'G', 'public', 1))).toBe('group_member');
    });

    it('uses the plural member label for every other count', () => {
      expect(c.getMemberCountText(makeGroup('g', 'G', 'public', 7))).toBe('group_members');
      expect(c.getMemberCountText(makeGroup('g', 'G', 'public', 0))).toBe('group_members');
    });

    it('builds an aria label from the name, type and plural member count', () => {
      expect(c.getGroupAriaLabel(makeGroup('g', 'Design', 'public', 4))).toBe(
        'Design, public group, 4 members'
      );
    });

    it('uses the singular member noun in the aria label for a group of one', () => {
      expect(c.getGroupAriaLabel(g2)).toBe('Beta, private group, 1 member');
    });

    it('omits a missing group name from the aria label', () => {
      expect(c.getGroupAriaLabel(makeNamelessGroup('g9'))).toBe(', public group, 2 members');
    });
  });

  describe('handleGroupClick', () => {
    it('emits itemClick and leaves the active chat alone when a host listens', () => {
      const seen: CometChat.Group[] = [];
      c.itemClick.subscribe(g => seen.push(g));
      c.handleGroupClick(g1);
      expect(seen).toEqual([g1]);
      expect(chatState.setActiveGroup).not.toHaveBeenCalled();
    });

    it('opens the group itself when nothing listens to itemClick', () => {
      c.handleGroupClick(g1);
      expect(chatState.setActiveGroup).toHaveBeenCalledWith(g1);
    });
  });

  describe('Context menu options', () => {
    it('returns the options the callback produces, and nothing without one', () => {
      expect(c.getOptionsForGroup(g1)).toEqual([]);
      const option = new CometChatOption({ id: 'leave', title: 'Leave' });
      c.options = () => [option];
      expect(c.getOptionsForGroup(g1)).toEqual([option]);
    });

    it('invokes an option handler, and tolerates an option without one', () => {
      let invoked = 0;
      const withHandler = new CometChatOption({ id: 'leave', onClick: () => invoked++ });
      c.handleOptionClick(withHandler, g1);
      expect(invoked).toBe(1);

      // The guard is there to stop a handler-less option from throwing, which
      // is what this asserts — a bare `invoked` check would pass either way.
      const withoutHandler = new CometChatOption({ id: 'noop' });
      expect(() => c.handleOptionClick(withoutHandler, g1)).not.toThrow();
      expect(invoked).toBe(1);
    });
  });

  describe('isGroupActive', () => {
    it('matches the activeGroup input by guid', async () => {
      await build({ activeGroup: g2 });
      expect(c.isGroupActive(g2)).toBe(true);
      expect(c.isGroupActive(g1)).toBe(false);
      // The input wins, so the shared state is never consulted.
      expect(chatState.getActiveGroup).not.toHaveBeenCalled();
    });

    it('falls back to the shared active group when no input is set', () => {
      chatState.activeGroup = g3;
      expect(c.isGroupActive(g3)).toBe(true);
      expect(c.isGroupActive(g1)).toBe(false);
    });

    it('reports nothing active when neither the input nor the shared state has a group', () => {
      chatState.activeGroup = null;
      expect(c.isGroupActive(g1)).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // Selection
  // -------------------------------------------------------------------------

  describe('Selection — single mode', () => {
    beforeEach(() => {
      c.selectionMode = SelectionMode.single;
      seed([g1, g2, g3]);
    });

    it('selects the clicked group and announces the new state', () => {
      c.handleSelectionChange(g2);
      expect([...c.selectedGroups]).toEqual(['g2']);
      expect(selectEvents).toEqual([{ group: g2, selected: true }]);
      expect(selectionStates).toHaveLength(1);
      expect(selectionStates[0].mode).toBe(SelectionMode.single);
      expect([...selectionStates[0].selectedIds]).toEqual(['g2']);
      expect(selectionStates[0].lastSelectedId).toBe('g2');
    });

    it('deselects the group when it is clicked again', () => {
      c.handleSelectionChange(g2);
      c.handleSelectionChange(g2);
      expect(c.selectedGroups.size).toBe(0);
      expect(selectEvents[1]).toEqual({ group: g2, selected: false });
      expect([...selectionStates[1].selectedIds]).toEqual([]);
    });

    it('replaces the previous selection rather than adding to it', () => {
      c.handleSelectionChange(g1);
      c.handleSelectionChange(g3);
      expect([...c.selectedGroups]).toEqual(['g3']);
    });

    it('reports the selection through isGroupSelected', () => {
      c.handleSelectionChange(g1);
      expect(c.isGroupSelected(g1)).toBe(true);
      expect(c.isGroupSelected(g2)).toBe(false);
    });
  });

  describe('Selection — multiple mode', () => {
    beforeEach(() => {
      c.selectionMode = SelectionMode.multiple;
      seed([g1, g2, g3]);
    });

    it('accumulates selections and remembers the last index as the anchor', () => {
      c.handleSelectionChange(g1);
      c.handleSelectionChange(g3);
      expect([...c.selectedGroups]).toEqual(['g1', 'g3']);
      expect(c.lastSelectedIndex).toBe(2);
      expect(selectEvents).toEqual([
        { group: g1, selected: true },
        { group: g3, selected: true },
      ]);
    });

    it('toggles an already selected group back off', () => {
      c.handleSelectionChange(g1);
      c.handleSelectionChange(g1);
      expect(c.selectedGroups.size).toBe(0);
      expect(selectEvents[1]).toEqual({ group: g1, selected: false });
    });

    it('selects the whole range on a shift-click from the anchor', () => {
      c.handleSelectionChange(g1);
      selectEvents.length = 0;
      c.handleSelectionChange(g3, new MouseEvent('click', { shiftKey: true }));
      expect([...c.selectedGroups]).toEqual(['g1', 'g2', 'g3']);
      // g1 was already selected, so only the newly covered groups emit.
      expect(selectEvents).toEqual([
        { group: g2, selected: true },
        { group: g3, selected: true },
      ]);
      expect(c.lastSelectedIndex).toBe(2);
    });

    it('deselects the whole range when the shift-clicked group is already selected', () => {
      c.selectAll();
      c.lastSelectedIndex = 0;
      selectEvents.length = 0;
      c.handleSelectionChange(g3, new MouseEvent('click', { shiftKey: true }));
      expect(c.selectedGroups.size).toBe(0);
      expect(selectEvents).toEqual([
        { group: g1, selected: false },
        { group: g2, selected: false },
        { group: g3, selected: false },
      ]);
    });

    it('treats a shift-click with no anchor as a plain toggle', () => {
      c.lastSelectedIndex = -1;
      c.handleSelectionChange(g3, new MouseEvent('click', { shiftKey: true }));
      expect([...c.selectedGroups]).toEqual(['g3']);
      expect(c.lastSelectedIndex).toBe(2);
    });

    it('treats a shift-click on a group outside the list as a plain toggle', () => {
      c.handleSelectionChange(g1);
      const stranger = makeGroup('g-stranger');
      c.handleSelectionChange(stranger, new MouseEvent('click', { shiftKey: true }));
      expect([...c.selectedGroups]).toEqual(['g1', 'g-stranger']);
      // findIndex missed, so the anchor is reset to -1 rather than a real row.
      expect(c.lastSelectedIndex).toBe(-1);
    });

    it('ignores the shift modifier on a non-mouse event', () => {
      c.handleSelectionChange(g1);
      selectEvents.length = 0;
      c.handleSelectionChange(g3, new Event('change'));
      expect([...c.selectedGroups]).toEqual(['g1', 'g3']);
      expect(selectEvents).toEqual([{ group: g3, selected: true }]);
    });

    it('routes a checkbox change through the same selection path', () => {
      c.handleSelectionControlChange(g2, new Event('change'));
      expect([...c.selectedGroups]).toEqual(['g2']);
      expect(selectEvents).toEqual([{ group: g2, selected: true }]);
    });

    it('selects every group and drops the focus ring on select-all', () => {
      c.focusedIndex = 1;
      c.selectAll();
      expect([...c.selectedGroups]).toEqual(['g1', 'g2', 'g3']);
      expect(c.focusedIndex).toBe(-1);
      expect(selectionStates.at(-1)!.lastSelectedId).toBeNull();
    });

    it('clears every selection and resets the anchor', () => {
      c.selectAll();
      selectEvents.length = 0;
      c.clearSelection();
      expect(c.selectedGroups.size).toBe(0);
      expect(c.lastSelectedIndex).toBe(-1);
      expect(selectEvents).toEqual([
        { group: g1, selected: false },
        { group: g2, selected: false },
        { group: g3, selected: false },
      ]);
    });
  });

  describe('Selection — disabled', () => {
    it('does nothing when the selection mode is none', () => {
      seed([g1, g2]);
      c.handleSelectionChange(g1);
      expect(c.selectedGroups.size).toBe(0);
      expect(selectEvents).toEqual([]);
      expect(selectionStates).toEqual([]);
    });

    it('refuses select-all outside multiple mode', () => {
      c.selectionMode = SelectionMode.single;
      seed([g1, g2]);
      c.selectAll();
      expect(c.selectedGroups.size).toBe(0);
      expect(selectionStates).toEqual([]);
    });
  });

  describe('extendSelectionTo', () => {
    beforeEach(() => {
      c.selectionMode = SelectionMode.multiple;
      seed([g1, g2, g3]);
    });

    it('adds the group at the given index to the selection', () => {
      c['extendSelectionTo'](1);
      expect([...c.selectedGroups]).toEqual(['g2']);
      expect(selectEvents).toEqual([{ group: g2, selected: true }]);
      expect(selectionStates.at(-1)!.lastSelectedId).toBe('g2');
    });

    it('leaves an already selected group untouched', () => {
      c['extendSelectionTo'](1);
      selectEvents.length = 0;
      c['extendSelectionTo'](1);
      expect(selectEvents).toEqual([]);
      expect([...c.selectedGroups]).toEqual(['g2']);
    });

    it('ignores an index below the start of the list', () => {
      c['extendSelectionTo'](-1);
      expect(c.selectedGroups.size).toBe(0);
      expect(selectEvents).toEqual([]);
    });

    it('ignores an index past the end of the list', () => {
      c['extendSelectionTo'](3);
      expect(c.selectedGroups.size).toBe(0);
      expect(selectEvents).toEqual([]);
    });
  });

  describe('selectRangeFromAnchor', () => {
    beforeEach(() => {
      c.selectionMode = SelectionMode.multiple;
      seed([g1, g2, g3]);
    });

    it('selects the span between the anchor and the given index', () => {
      c.lastSelectedIndex = 0;
      c['selectRangeFromAnchor'](2);
      expect([...c.selectedGroups]).toEqual(['g1', 'g2', 'g3']);
    });

    it('toggles just the one group when there is no anchor yet', () => {
      c.lastSelectedIndex = -1;
      c['selectRangeFromAnchor'](1);
      expect([...c.selectedGroups]).toEqual(['g2']);
    });

    it('does nothing when there is no anchor and the index is out of range', () => {
      c.lastSelectedIndex = -1;
      c['selectRangeFromAnchor'](99);
      expect(c.selectedGroups.size).toBe(0);
      c['selectRangeFromAnchor'](-5);
      expect(c.selectedGroups.size).toBe(0);
      expect(selectEvents).toEqual([]);
    });
  });

  // -------------------------------------------------------------------------
  // Focus and keyboard
  // -------------------------------------------------------------------------

  describe('Focus tracking', () => {
    it('moves focus to the first group when the list gains focus', () => {
      seed([g1, g2]);
      c.focusedIndex = -1;
      c.handleListFocus();
      expect(c.focusedIndex).toBe(0);
    });

    it('leaves an existing focus position alone', () => {
      seed([g1, g2]);
      c.focusedIndex = 1;
      c.handleListFocus();
      expect(c.focusedIndex).toBe(1);
    });

    it('does not take focus when the list is empty', () => {
      seed([]);
      c.focusedIndex = -1;
      c.handleListFocus();
      expect(c.focusedIndex).toBe(-1);
    });

    it('records the focused row reported by an item', () => {
      seed([g1, g2, g3]);
      c.handleItemFocus(2);
      expect(c.focusedIndex).toBe(2);
    });

    it('adopts a new focus index from a focus-in event', () => {
      seed([g1, g2, g3]);
      const mark = vi.spyOn(c['cdr'], 'markForCheck');
      c.handleFocusIn(new FocusEvent('focusin'), 2);
      expect(c.focusedIndex).toBe(2);
      expect(mark).toHaveBeenCalledTimes(1);
    });

    it('skips the re-render when focus-in repeats the current index', () => {
      seed([g1, g2, g3]);
      c.focusedIndex = 2;
      const mark = vi.spyOn(c['cdr'], 'markForCheck');
      c.handleFocusIn(new FocusEvent('focusin'), 2);
      expect(c.focusedIndex).toBe(2);
      expect(mark).not.toHaveBeenCalled();
    });

    it('wraps forward through the list', () => {
      seed([g1, g2, g3]);
      c.focusedIndex = -1;
      c['focusNextItem']();
      expect(c.focusedIndex).toBe(0);
      c['focusNextItem']();
      expect(c.focusedIndex).toBe(1);
      c.focusedIndex = 2;
      c['focusNextItem']();
      expect(c.focusedIndex).toBe(0);
    });

    it('wraps backward through the list', () => {
      seed([g1, g2, g3]);
      c.focusedIndex = -1;
      c['focusPreviousItem']();
      expect(c.focusedIndex).toBe(2);
      c.focusedIndex = 2;
      c['focusPreviousItem']();
      expect(c.focusedIndex).toBe(1);
      c.focusedIndex = 0;
      c['focusPreviousItem']();
      expect(c.focusedIndex).toBe(2);
    });

    it('leaves the focus index alone when there is nothing to move through', () => {
      seed([]);
      c.focusedIndex = -1;
      c['focusNextItem']();
      expect(c.focusedIndex).toBe(-1);
      c['focusPreviousItem']();
      expect(c.focusedIndex).toBe(-1);
    });
  });

  describe('Focused-item DOM helpers', () => {
    let listContainer: HTMLElement;
    let row: HTMLElement;
    let focusable: HTMLElement;

    beforeEach(() => {
      listContainer = document.createElement('div');
      listContainer.innerHTML =
        '<div data-index="1"><cometchat-group-item>' +
        '<button tabindex="0">row</button>' +
        '</cometchat-group-item></div>';
      document.body.appendChild(listContainer);
      row = listContainer.querySelector('[data-index="1"]') as HTMLElement;
      focusable = listContainer.querySelector('button') as HTMLElement;
      // The list is deliberately left empty: a rendered row runs the
      // paginated list's own focus management, which would take the focus
      // back off the element under test.
    });

    afterEach(() => {
      listContainer.remove();
    });

    /**
     * The ViewChild resolves to the paginated-list component rather than an
     * ElementRef, so the container is supplied directly. It has to be assigned
     * with no intervening await: change detection re-runs the view queries and
     * would put the component instance back.
     */
    function attachContainer(): void {
      (c as unknown as { listContainer: { nativeElement: HTMLElement } }).listContainer = {
        nativeElement: listContainer,
      };
    }

    it('moves DOM focus to the row at the given index', async () => {
      // The rendered shell focuses its own state container on first render;
      // let that settle so it cannot land after the helper has run.
      await wait(20);
      attachContainer();
      c['focusItemAtIndex'](1);
      await wait(5);
      expect(document.activeElement).toBe(focusable);
    });

    it('scrolls the focused row into view once the initial load is done', async () => {
      const scrollIntoView = vi.fn();
      row.scrollIntoView = scrollIntoView;
      (c as any).initialLoadComplete = true;
      c.focusedIndex = 1;
      attachContainer();
      c['scrollFocusedItemIntoView']();
      await wait(5);
      expect(scrollIntoView).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest',
      });
    });

    it('suppresses scrolling until the initial load is done', async () => {
      const scrollIntoView = vi.fn();
      row.scrollIntoView = scrollIntoView;
      (c as any).initialLoadComplete = false;
      c.focusedIndex = 1;
      attachContainer();
      c['scrollFocusedItemIntoView']();
      await wait(5);
      expect(scrollIntoView).not.toHaveBeenCalled();
    });
  });

  describe('selectFocusedItem', () => {
    it('opens the focused group when selection is off', () => {
      seed([g1, g2, g3]);
      c.focusedIndex = 1;
      c['selectFocusedItem']();
      expect(chatState.setActiveGroup).toHaveBeenCalledWith(g2);
    });

    it('toggles the focused group when selection is on', () => {
      c.selectionMode = SelectionMode.multiple;
      seed([g1, g2, g3]);
      c.focusedIndex = 2;
      c['selectFocusedItem']();
      expect([...c.selectedGroups]).toEqual(['g3']);
      expect(chatState.setActiveGroup).not.toHaveBeenCalled();
    });

    it('does nothing when no row is focused', () => {
      seed([g1, g2]);
      c.focusedIndex = -1;
      c['selectFocusedItem']();
      expect(chatState.setActiveGroup).not.toHaveBeenCalled();
    });

    it('does nothing when the focused index is past the end of the list', () => {
      seed([g1, g2]);
      c.focusedIndex = 5;
      c['selectFocusedItem']();
      expect(chatState.setActiveGroup).not.toHaveBeenCalled();
    });
  });

  describe('handleEscapeKey', () => {
    it('clears the search text first and keeps the focus ring', () => {
      seed([g1, g2]);
      c.searchText = 'alpha';
      c.focusedIndex = 1;
      c['handleEscapeKey']();
      expect(c.searchText).toBe('');
      expect(c.focusedIndex).toBe(1);
    });

    it('clears an active selection when there is no search text', () => {
      c.selectionMode = SelectionMode.multiple;
      seed([g1, g2]);
      c.selectAll();
      // selectAll drops the focus ring itself, so put it back: otherwise the
      // assertion below would pass without Escape doing anything.
      c.focusedIndex = 1;
      c['handleEscapeKey']();
      expect(c.selectedGroups.size).toBe(0);
      expect(c.focusedIndex).toBe(-1);
    });

    it('drops the focus ring and blurs the active element', () => {
      seed([g1, g2]);
      const input = document.createElement('input');
      document.body.appendChild(input);
      input.focus();
      c.focusedIndex = 1;
      c['handleEscapeKey']();
      expect(c.focusedIndex).toBe(-1);
      expect(document.activeElement).not.toBe(input);
      input.remove();
    });
  });

  describe('Keyboard navigation', () => {
    beforeEach(() => {
      seed([g1, g2, g3]);
      c.focusedIndex = 0;
    });

    /**
     * Spies on the helpers the arrow keys delegate to, leaving the real
     * implementations in place. The guard tests below assert these never run:
     * a handler that did nothing at all would otherwise satisfy them exactly
     * as well as one that correctly bails out.
     */
    function navSpies() {
      return {
        next: vi.spyOn(c as any, 'focusNextItem'),
        previous: vi.spyOn(c as any, 'focusPreviousItem'),
      };
    }

    it('does not act on keys while the list is still loading', () => {
      seed([g1, g2, g3], States.loading);
      const spies = navSpies();
      const event = pressKey({ key: 'ArrowDown' });
      expect(event.defaultPrevented).toBe(false);
      expect(spies.next).not.toHaveBeenCalled();
    });

    it('does not act on keys raised outside the component', () => {
      const outside = document.createElement('div');
      document.body.appendChild(outside);
      const spies = navSpies();
      const event = pressKey({ key: 'ArrowDown' }, outside);
      expect(event.defaultPrevented).toBe(false);
      expect(spies.next).not.toHaveBeenCalled();
      outside.remove();
    });

    it('does not act on arrow keys coming from the search bar', () => {
      const spies = navSpies();
      const event = pressKey({ key: 'ArrowDown' }, searchTarget);
      expect(event.defaultPrevented).toBe(false);
      expect(spies.next).not.toHaveBeenCalled();
    });

    it('claims the arrow keys and runs the matching navigation helper', () => {
      const spies = navSpies();
      expect(pressKey({ key: 'ArrowDown' }).defaultPrevented).toBe(true);
      expect(spies.next).toHaveBeenCalledTimes(1);
      expect(spies.previous).not.toHaveBeenCalled();

      expect(pressKey({ key: 'ArrowUp' }).defaultPrevented).toBe(true);
      expect(spies.previous).toHaveBeenCalledTimes(1);
    });

    it('opens the focused group on Enter', () => {
      c.focusedIndex = 1;
      const event = pressKey({ key: 'Enter' });
      expect(event.defaultPrevented).toBe(true);
      expect(chatState.setActiveGroup).toHaveBeenCalledWith(g2);
    });

    it('lets type-ahead swallow Space rather than activating a group', () => {
      // Space is a printable single-character key, so the type-ahead branch
      // claims it and returns before the activation case can be reached. No
      // group name begins with a space, so nothing moves.
      c.focusedIndex = 2;
      const event = pressKey({ key: ' ' });
      expect(event.defaultPrevented).toBe(false);
      expect(chatState.setActiveGroup).not.toHaveBeenCalled();
      expect(c.focusedIndex).toBe(2);
    });

    it('claims Escape and clears the search text through the escape handler', () => {
      c.searchText = 'alpha';
      const event = pressKey({ key: 'Escape' });
      expect(event.defaultPrevented).toBe(true);
      expect(c.searchText).toBe('');
    });

    it('jumps to the next group whose name starts with the typed letter', () => {
      c.focusedIndex = 0;
      pressKey({ key: 'g' });
      expect(c.focusedIndex).toBe(2);
    });

    it('leaves focus where it is when type-ahead finds no match', () => {
      c.focusedIndex = 1;
      pressKey({ key: 'z' });
      expect(c.focusedIndex).toBe(1);
    });

    it('skips past a group with no name and matches the next one', () => {
      // A missing name is substituted with an empty string, so type-ahead has
      // to step over that row instead of throwing on it.
      seed([g1, makeNamelessGroup('g-nameless'), g2]);
      c.focusedIndex = 0;
      pressKey({ key: 'b' });
      expect(c.focusedIndex).toBe(2);
    });

    it('ignores printable characters typed in the search bar', () => {
      c.focusedIndex = 0;
      pressKey({ key: 'g' }, searchTarget);
      expect(c.focusedIndex).toBe(0);
    });

    it('does nothing on an unhandled key', () => {
      const spies = navSpies();
      c.focusedIndex = 1;
      const event = pressKey({ key: 'Tab' });
      expect(event.defaultPrevented).toBe(false);
      expect(spies.next).not.toHaveBeenCalled();
      expect(spies.previous).not.toHaveBeenCalled();
      expect(c.focusedIndex).toBe(1);
    });
  });

  describe('Keyboard selection', () => {
    beforeEach(() => {
      c.selectionMode = SelectionMode.multiple;
      seed([g1, g2, g3]);
      c.focusedIndex = 0;
    });

    it('selects every group on Ctrl+A and announces the count', () => {
      const event = pressKey({ key: 'a', ctrlKey: true });
      expect(event.defaultPrevented).toBe(true);
      expect([...c.selectedGroups]).toEqual(['g1', 'g2', 'g3']);
      expect(announcer.announce).toHaveBeenCalledWith(
        CometChatLocalize.getLocalizedString('accessibility_items_selected').replace('{count}', '3'),
        'polite'
      );
    });

    it('selects every group on Cmd+A too', () => {
      pressKey({ key: 'A', metaKey: true });
      expect([...c.selectedGroups]).toEqual(['g1', 'g2', 'g3']);
    });

    it('clears the selection on Ctrl+Shift+A and announces it', () => {
      c.selectAll();
      const event = pressKey({ key: 'a', ctrlKey: true, shiftKey: true });
      expect(event.defaultPrevented).toBe(true);
      expect(c.selectedGroups.size).toBe(0);
      expect(announcer.announce).toHaveBeenCalledWith(
        CometChatLocalize.getLocalizedString('accessibility_selection_cleared'),
        'polite'
      );
    });

    it('leaves Ctrl+A alone outside multiple mode', () => {
      c.selectionMode = SelectionMode.single;
      pressKey({ key: 'a', ctrlKey: true });
      expect(c.selectedGroups.size).toBe(0);
    });

    it('toggles the focused group on Space', () => {
      c.focusedIndex = 1;
      const event = pressKey({ key: ' ' });
      expect(event.defaultPrevented).toBe(true);
      expect([...c.selectedGroups]).toEqual(['g2']);
      // The handler leaves the focus index untouched on this path.
      expect(c.focusedIndex).toBe(1);
    });

    it('ignores Space when no row is focused', () => {
      c.focusedIndex = -1;
      pressKey({ key: ' ' });
      expect(c.selectedGroups.size).toBe(0);
    });

    it('selects the range from the anchor on Shift+Space', () => {
      c.handleSelectionChange(g1);
      c.focusedIndex = 2;
      const event = pressKey({ key: ' ', shiftKey: true });
      expect(event.defaultPrevented).toBe(true);
      expect([...c.selectedGroups]).toEqual(['g1', 'g2', 'g3']);
    });

    it('extends the selection downward on Shift+ArrowDown and moves focus', () => {
      c.focusedIndex = 0;
      const event = pressKey({ key: 'ArrowDown', shiftKey: true });
      expect(event.defaultPrevented).toBe(true);
      expect([...c.selectedGroups]).toEqual(['g2']);
      expect(c.focusedIndex).toBe(1);
    });

    it('stops extending downward at the end of the list', () => {
      c.focusedIndex = 2;
      pressKey({ key: 'ArrowDown', shiftKey: true });
      expect(c.selectedGroups.size).toBe(0);
      expect(c.focusedIndex).toBe(2);
    });

    it('extends the selection upward on Shift+ArrowUp and moves focus', () => {
      c.focusedIndex = 2;
      pressKey({ key: 'ArrowUp', shiftKey: true });
      expect([...c.selectedGroups]).toEqual(['g2']);
      expect(c.focusedIndex).toBe(1);
    });

    it('stops extending upward at the start of the list', () => {
      c.focusedIndex = 0;
      pressKey({ key: 'ArrowUp', shiftKey: true });
      expect(c.selectedGroups.size).toBe(0);
      expect(c.focusedIndex).toBe(0);
    });

    it('clears the selection on Escape and announces it', () => {
      c.selectAll();
      pressKey({ key: 'Escape' });
      expect(c.selectedGroups.size).toBe(0);
      expect(announcer.announce).toHaveBeenCalledWith(
        CometChatLocalize.getLocalizedString('accessibility_selection_cleared'),
        'polite'
      );
    });
  });

  // -------------------------------------------------------------------------
  // Pointer and focus-in handling
  // -------------------------------------------------------------------------

  describe('handleMouseDown', () => {
    it('stops the browser from moving focus on mousedown', () => {
      const event = new MouseEvent('mousedown', { cancelable: true });
      c.handleMouseDown(event);
      expect(event.defaultPrevented).toBe(true);
    });
  });

  describe('handleContainerClick', () => {
    function clickOn(target: HTMLElement): void {
      c.handleContainerClick({ target } as unknown as MouseEvent);
    }

    beforeEach(() => {
      seed([g1, g2, g3]);
      c.focusedIndex = 1;
    });

    it('drops the focus ring when the click lands on empty space', () => {
      const background = document.createElement('div');
      host.appendChild(background);
      const input = document.createElement('input');
      document.body.appendChild(input);
      input.focus();
      clickOn(background);
      expect(c.focusedIndex).toBe(-1);
      expect(document.activeElement).not.toBe(input);
      input.remove();
    });

    it('keeps the focus ring when the click lands on a group row', () => {
      clickOn(itemTarget);
      expect(c.focusedIndex).toBe(1);
    });

    it('keeps the focus ring when the click lands on a checkbox', () => {
      const checkbox = document.createElement('cometchat-checkbox');
      host.appendChild(checkbox);
      clickOn(checkbox);
      expect(c.focusedIndex).toBe(1);
    });

    it('keeps the focus ring when the click lands on a radio button', () => {
      const radio = document.createElement('cometchat-radio-button');
      host.appendChild(radio);
      clickOn(radio);
      expect(c.focusedIndex).toBe(1);
    });

    it('keeps the focus ring when the click lands on the search bar', () => {
      const searchBar = document.createElement('cometchat-search-bar');
      host.appendChild(searchBar);
      clickOn(searchBar);
      expect(c.focusedIndex).toBe(1);
    });
  });

  describe('handleFocusInEvent', () => {
    /** Mirrors the wrapper chain the real template renders around each row. */
    function buildRows(count: number): HTMLElement[] {
      const items = document.createElement('div');
      items.className = 'cometchat-paginated-list__items';
      const rows: HTMLElement[] = [];
      for (let i = 0; i < count; i++) {
        const item = document.createElement('div');
        item.className = 'cometchat-paginated-list__item';
        const wrapper = document.createElement('div');
        wrapper.className = 'cometchat-groups__list-item-wrapper';
        const groupItem = document.createElement('div');
        groupItem.className = 'cometchat-group-item';
        wrapper.appendChild(groupItem);
        item.appendChild(wrapper);
        items.appendChild(item);
        rows.push(groupItem);
      }
      host.appendChild(items);
      return rows;
    }

    function focusIn(target: EventTarget | null): void {
      c.handleFocusInEvent({ target } as unknown as FocusEvent);
    }

    beforeEach(() => {
      seed([g1, g2, g3]);
      c.focusedIndex = 0;
    });

    it('adopts the index of the focused row', () => {
      const rows = buildRows(3);
      focusIn(rows[2]);
      expect(c.focusedIndex).toBe(2);
    });

    it('works when focus lands on a descendant of the row', () => {
      const rows = buildRows(3);
      const child = document.createElement('span');
      rows[1].appendChild(child);
      focusIn(child);
      expect(c.focusedIndex).toBe(1);
    });

    it('skips the re-render when focus stays on the current row', () => {
      const rows = buildRows(3);
      c.focusedIndex = 1;
      const mark = vi.spyOn(c['cdr'], 'markForCheck');
      focusIn(rows[1]);
      expect(c.focusedIndex).toBe(1);
      expect(mark).not.toHaveBeenCalled();
    });

    it('ignores a focus event with no target', () => {
      focusIn(null);
      expect(c.focusedIndex).toBe(0);
    });

    it('ignores focus that lands outside any group row', () => {
      const stray = document.createElement('div');
      host.appendChild(stray);
      focusIn(stray);
      expect(c.focusedIndex).toBe(0);
    });

    it('ignores a group row that is not inside a list-item wrapper', () => {
      const bare = document.createElement('div');
      bare.className = 'cometchat-group-item';
      host.appendChild(bare);
      focusIn(bare);
      expect(c.focusedIndex).toBe(0);
    });

    it('ignores a wrapper that is not inside a paginated list item', () => {
      const wrapper = document.createElement('div');
      wrapper.className = 'cometchat-groups__list-item-wrapper';
      const groupItem = document.createElement('div');
      groupItem.className = 'cometchat-group-item';
      wrapper.appendChild(groupItem);
      host.appendChild(wrapper);
      focusIn(groupItem);
      expect(c.focusedIndex).toBe(0);
    });

    it('ignores a paginated list item with no parent element', () => {
      const item = document.createElement('div');
      item.className = 'cometchat-paginated-list__item';
      const wrapper = document.createElement('div');
      wrapper.className = 'cometchat-groups__list-item-wrapper';
      const groupItem = document.createElement('div');
      groupItem.className = 'cometchat-group-item';
      wrapper.appendChild(groupItem);
      item.appendChild(wrapper);
      focusIn(groupItem);
      expect(c.focusedIndex).toBe(0);
    });

    it('ignores a paginated list item whose parent is not the items container', () => {
      const container = document.createElement('div');
      container.className = 'some-other-container';
      const item = document.createElement('div');
      item.className = 'cometchat-paginated-list__item';
      const wrapper = document.createElement('div');
      wrapper.className = 'cometchat-groups__list-item-wrapper';
      const groupItem = document.createElement('div');
      groupItem.className = 'cometchat-group-item';
      wrapper.appendChild(groupItem);
      item.appendChild(wrapper);
      container.appendChild(item);
      host.appendChild(container);
      focusIn(groupItem);
      expect(c.focusedIndex).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // Retry
  // -------------------------------------------------------------------------

  describe('handleRetryClick', () => {
    it('drops the error, shows the shimmer and starts the fetch again', () => {
      c.lastError = makeException() as unknown as Error;
      c.fetchState = States.error;
      service.initialize.mockClear();
      service.fetchNext.mockClear();
      c.hasMore.set(true);

      c.handleRetryClick();

      expect(c.lastError).toBeNull();
      expect(c.fetchState).toBe(States.loading);
      expect(c.groupList).toEqual([]);
      expect(service.initialize).toHaveBeenCalledTimes(1);
      expect(service.fetchNext).toHaveBeenCalledTimes(1);
    });

    it('recovers the list from the service after a successful retry', async () => {
      c.lastError = makeException() as unknown as Error;
      service.fetchState.set(States.error);
      service.hasMore.set(true);
      await flush();

      service.groups.set([g1, g2]);
      service.fetchState.set(States.loaded);
      c.handleRetryClick();
      await flush();

      expect(c.groupList).toEqual([g1, g2]);
      expect(c.fetchState).toBe(States.loaded);
      expect(c.lastError).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // Tab index
  // -------------------------------------------------------------------------

  describe('getTabIndex', () => {
    it('puts the focused row in the tab order', () => {
      c.focusedIndex = 2;
      expect(c.getTabIndex(2)).toBe(0);
      expect(c.getTabIndex(0)).toBe(-1);
    });

    it('falls back to the first row when nothing is focused', () => {
      c.focusedIndex = -1;
      expect(c.getTabIndex(0)).toBe(0);
      expect(c.getTabIndex(1)).toBe(-1);
    });
  });

  describe('trackByGroup', () => {
    it('keys rows by guid so identity survives a refresh', () => {
      expect(c.trackByGroup(0, g1)).toBe('g1');
      expect(c.trackByGroup(7, g3)).toBe('g3');
    });
  });

  describe('getGroupType', () => {
    it('reports the group type for the row modifier classes', () => {
      expect(c.getGroupType(g1)).toBe('public');
      expect(c.getGroupType(g2)).toBe('private');
      expect(c.getGroupType(g3)).toBe('password');
    });
  });
});
