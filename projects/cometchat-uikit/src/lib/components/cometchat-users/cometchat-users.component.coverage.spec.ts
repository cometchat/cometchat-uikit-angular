/**
 * CometChatUsers — behaviour coverage suite.
 *
 * The sibling `cometchat-users.component.spec.ts` drives this component against
 * a REAL CometChat session. Without a live backend the service's guards fire and
 * most of the component body never executes, so those tests pass without
 * exercising anything. This suite replaces the data layer with an in-memory
 * double instead, which makes the fetch/search/selection/keyboard paths
 * deterministic and actually observable.
 *
 * Two wiring details matter and are easy to get wrong:
 *  - `UsersService` is declared in the component's own `providers:` array, so a
 *    root-level TestBed provider is ignored. It has to be swapped with
 *    `TestBed.overrideComponent`.
 *  - `ngOnInit` is invoked directly rather than through `fixture.detectChanges()`
 *    so the list template (and its real child components) stays out of the way;
 *    the class is what is under test here.
 */

vi.mock('@cometchat/calls-sdk-javascript', () => ({
  CometChatCalls: {
    init: vi.fn().mockResolvedValue(true),
    generateToken: vi.fn().mockResolvedValue({ token: 'mock-token' }),
  },
}));

import { ComponentFixture, ComponentFixtureAutoDetect, TestBed } from '@angular/core/testing';
import { ElementRef, TemplateRef, signal } from '@angular/core';
import { CometChat } from '@cometchat/chat-sdk-javascript';

import { CometChatUsersComponent } from './cometchat-users.component';
import { UsersService } from '../../services/users.service';
import { ChatStateService } from '../../services/chat-state.service';
import { CometChatTemplatesService } from '../../services/templates.service';
import { TypeAheadService } from '../../services/type-ahead.service';
import { LiveAnnouncerService } from '../../services/live-announcer.service';
import { COMETCHAT_GLOBAL_CONFIG, GlobalConfig } from '../../services/global-config.service';
import { CometChatUserEvents } from '../../events/CometChatUserEvents';
import { CometChatLogger } from '../../utils/CometChatLogger';
import { CometChatPaginatedListComponent } from '../cometchat-paginated-list/cometchat-paginated-list.component';
import { SelectionMode, States } from '../../Enums/Enums';
import { CometChatOption } from '../../modals/CometChatOption';
import { SelectionState } from '../../modals/SelectionState';

// ---------------------------------------------------------------------------
// Doubles
// ---------------------------------------------------------------------------

interface InitConfig {
  searchText?: string;
  usersRequestBuilder?: CometChat.UsersRequestBuilder | null;
  searchRequestBuilder?: CometChat.UsersRequestBuilder | null;
  usersSearchText?: string;
}

class FakeUsersService {
  readonly usersSignal = signal<CometChat.User[]>([]);
  readonly fetchStateSignal = signal<States>(States.loading);
  readonly hasMoreSignal = signal<boolean>(true);

  readonly users = this.usersSignal.asReadonly();
  readonly fetchState = this.fetchStateSignal.asReadonly();
  readonly hasMore = this.hasMoreSignal.asReadonly();

  errorCallback: ((error: CometChat.CometChatException) => void) | null = null;
  initializeCalls: InitConfig[] = [];
  searchCalls: { searchText: string; config: InitConfig }[] = [];
  updatedUsers: CometChat.User[] = [];
  cleanupCount = 0;
  fetchNextCount = 0;

  /** Swapped per-test to resolve, reject, or settle on demand. */
  fetchNextImpl: () => Promise<void> = () => Promise.resolve();

  setErrorCallback(cb: ((error: CometChat.CometChatException) => void) | null): void {
    this.errorCallback = cb;
  }
  initialize(config: InitConfig): void {
    this.initializeCalls.push(config);
  }
  search(searchText: string, config: InitConfig): void {
    this.searchCalls.push({ searchText, config });
  }
  updateUser(user: CometChat.User): void {
    this.updatedUsers.push(user);
  }
  cleanup(): void {
    this.cleanupCount++;
  }
  fetchNext(): Promise<void> {
    this.fetchNextCount++;
    return this.fetchNextImpl();
  }

  /** Convenience: pretend a fetch landed with this payload. */
  settle(users: CometChat.User[], state: States, hasMore = true): void {
    this.usersSignal.set(users);
    this.fetchStateSignal.set(state);
    this.hasMoreSignal.set(hasMore);
  }
}

function mkUser(uid: string, name = uid.toUpperCase(), status = 'online'): CometChat.User {
  return {
    getUid: () => uid,
    getName: () => name,
    getStatus: () => status,
  } as unknown as CometChat.User;
}

function flush(ms = 0): Promise<void> {
  return new Promise<void>(resolve => setTimeout(resolve, ms));
}

/**
 * `event.target` is a prototype getter, so an instance-level definition is the
 * only way to aim a synthetic event at a specific node without dispatching it.
 */
function aimAt<E extends Event>(event: E, target: EventTarget | null): E {
  Object.defineProperty(event, 'target', { value: target, configurable: true });
  return event;
}

// ---------------------------------------------------------------------------

describe('CometChatUsersComponent — behaviour coverage', () => {
  let fixture: ComponentFixture<CometChatUsersComponent>;
  let comp: CometChatUsersComponent;
  let svc: FakeUsersService;
  let chatState: { setActiveUser: ReturnType<typeof vi.fn>; getActiveUser: ReturnType<typeof vi.fn> };
  let templates: {
    getUserTemplates: ReturnType<typeof vi.fn>;
    resolveTemplate: ReturnType<typeof vi.fn>;
  };
  let typeAhead: { handleCharacter: ReturnType<typeof vi.fn> };
  let announcer: { announce: ReturnType<typeof vi.fn> };
  let addUserListener: ReturnType<typeof vi.spyOn>;
  let removeUserListener: ReturnType<typeof vi.spyOn>;
  let loggerError: ReturnType<typeof vi.spyOn>;
  let capturedListener: { onUserOnline?: Function; onUserOffline?: Function } | undefined;

  /** `.cometchat-users` root the shared keyboard handler requires as an ancestor. */
  let kbRoot: HTMLElement;
  let kbItem: HTMLElement;
  let kbSearch: HTMLElement;

  beforeEach(() => {
    svc = new FakeUsersService();
    chatState = { setActiveUser: vi.fn(), getActiveUser: vi.fn().mockReturnValue(null) };
    templates = {
      getUserTemplates: vi.fn().mockReturnValue({}),
      resolveTemplate: vi.fn().mockReturnValue(undefined),
    };
    typeAhead = { handleCharacter: vi.fn().mockReturnValue(-1) };
    announcer = { announce: vi.fn() };

    capturedListener = undefined;
    addUserListener = vi
      .spyOn(CometChat, 'addUserListener')
      .mockImplementation(((_id: string, listener: any) => {
        capturedListener = listener;
      }) as any);
    removeUserListener = vi
      .spyOn(CometChat, 'removeUserListener')
      .mockImplementation((() => undefined) as any);
    loggerError = vi.spyOn(CometChatLogger, 'error').mockImplementation(() => undefined);
    // Re-spying a static that is already spied hands back the existing mock with
    // its history intact, so call counts have to be zeroed explicitly.
    addUserListener.mockClear();
    removeUserListener.mockClear();
    loggerError.mockClear();

    buildFixture(null);

    kbRoot = document.createElement('div');
    kbRoot.className = 'cometchat-users';
    kbItem = document.createElement('div');
    kbSearch = document.createElement('div');
    kbSearch.className = 'cometchat-users__search-bar';
    kbRoot.append(kbItem, kbSearch);
    document.body.appendChild(kbRoot);
  });

  afterEach(() => {
    // Static event subjects are shared; an undestroyed fixture keeps replaying
    // handlers into later tests.
    fixture.destroy();
    kbRoot.remove();
    TestBed.resetTestingModule();
    vi.restoreAllMocks();
  });

  function buildFixture(globalConfig: Partial<GlobalConfig> | null): void {
    TestBed.configureTestingModule({
      imports: [CometChatUsersComponent],
      providers: [
        { provide: ChatStateService, useValue: chatState },
        { provide: CometChatTemplatesService, useValue: templates },
        { provide: TypeAheadService, useValue: typeAhead },
        { provide: LiveAnnouncerService, useValue: announcer },
        // Auto-detect would run ngOnInit a second time behind the explicit call
        // in `init()`, doubling every subscription and fetch.
        { provide: ComponentFixtureAutoDetect, useValue: false },
        ...(globalConfig ? [{ provide: COMETCHAT_GLOBAL_CONFIG, useValue: globalConfig }] : []),
      ],
    });
    // Two overrides in one: the component declares `providers: [UsersService]`,
    // so that is the only injector it reads from; and the list template is
    // replaced because rendering real rows would drag in the whole user-item /
    // avatar / status subtree, which this suite is not measuring.
    TestBed.overrideComponent(CometChatUsersComponent, {
      set: {
        providers: [{ provide: UsersService, useValue: svc }],
        template: '<div class="cometchat-users"></div>',
      },
    });

    fixture = TestBed.createComponent(CometChatUsersComponent);
    comp = fixture.componentInstance;
    // Keeps the shimmer template out of most tests; one test flips it back.
    comp.disableLoadingState = true;
  }

  /** Rebuilds the component against a different global config. */
  function rebuildWith(globalConfig: Partial<GlobalConfig> | null): void {
    fixture.destroy();
    TestBed.resetTestingModule();
    buildFixture(globalConfig);
  }

  async function init(): Promise<void> {
    comp.ngOnInit();
    await flush();
  }

  /** Puts the component in the state the keyboard handler demands. */
  function loaded(users: CometChat.User[], mode = SelectionMode.none): void {
    comp.userList = users;
    comp.fetchState = States.loaded;
    comp.selectionMode = mode;
  }

  function key(k: string, target: Element = kbItem, opts: KeyboardEventInit = {}): KeyboardEvent {
    return aimAt(new KeyboardEvent('keydown', { key: k, bubbles: true, ...opts }), target);
  }

  // =========================================================================
  // Wiring guard — proves the override took effect
  // =========================================================================

  it('resolves UsersService from the component-level override, not the real service', async () => {
    svc.fetchNextImpl = () => {
      svc.settle([mkUser('u1'), mkUser('u2')], States.loaded, false);
      return Promise.resolve();
    };

    await init();

    expect(svc.fetchNextCount).toBe(1);
    expect(svc.initializeCalls).toHaveLength(1);
    expect(comp.userList.map(u => u.getUid())).toEqual(['u1', 'u2']);
    expect(comp.fetchState).toBe(States.loaded);
    expect(comp.hasMore()).toBe(false);
  });

  it('maps component inputs onto the service initialize config', async () => {
    const usersBuilder = { tag: 'users' } as unknown as CometChat.UsersRequestBuilder;
    const searchBuilder = { tag: 'search' } as unknown as CometChat.UsersRequestBuilder;
    comp.usersRequestBuilder = usersBuilder;
    comp.searchRequestBuilder = searchBuilder;
    comp.searchKeyword = 'ali';

    await init();

    expect(svc.initializeCalls[0]).toEqual({
      searchText: 'ali',
      usersRequestBuilder: usersBuilder,
      searchRequestBuilder: searchBuilder,
      usersSearchText: 'ali',
    });
  });

  it('normalises absent builders and keyword to null/empty in the initialize config', async () => {
    await init();

    expect(svc.initializeCalls[0]).toEqual({
      searchText: '',
      usersRequestBuilder: null,
      searchRequestBuilder: null,
      usersSearchText: '',
    });
  });

  it('mirrors the service hasMore signal onto the component signal', async () => {
    await init();
    comp.hasMore.set(true);

    svc.hasMoreSignal.set(false);
    TestBed.tick();

    expect(comp.hasMore()).toBe(false);
  });

  // =========================================================================
  // Error callback / lifecycle
  // =========================================================================

  it('stores and re-emits the error the service reports through its callback', async () => {
    const seen: CometChat.CometChatException[] = [];
    comp.error.subscribe(e => seen.push(e));

    await init();
    const failure = { code: 'ERR_USERS', message: 'nope' } as CometChat.CometChatException;
    svc.errorCallback!(failure);

    expect(comp.lastError).toBe(failure as unknown as Error);
    expect(seen).toEqual([failure]);
  });

  it('registers a user listener whose online/offline callbacks refresh list state', async () => {
    svc.fetchNextImpl = () => {
      svc.settle([mkUser('u1')], States.loaded);
      return Promise.resolve();
    };
    await init();

    expect(addUserListener).toHaveBeenCalledTimes(1);
    const online = mkUser('u1', 'U1', 'online');
    const offline = mkUser('u2', 'U2', 'offline');

    svc.settle([online, offline], States.loaded);
    capturedListener!.onUserOnline!(online);
    capturedListener!.onUserOffline!(offline);

    expect(svc.updatedUsers).toEqual([online, offline]);
    expect(comp.userList.map(u => u.getUid())).toEqual(['u1', 'u2']);
  });

  it('logs and swallows a failure from addUserListener so the first fetch still runs', async () => {
    addUserListener.mockImplementation((() => {
      throw new Error('listener registry down');
    }) as any);

    await init();

    expect(loggerError).toHaveBeenCalledWith(
      'CometChatUsers',
      'Error setting up user listener:',
      expect.any(Error)
    );
    expect(svc.fetchNextCount).toBe(1);
  });

  it('removes the listener, clears pending timers and cleans the service up on destroy', async () => {
    await init();
    (comp as any).pendingTimers.push(setTimeout(() => undefined, 5000));

    fixture.destroy();

    expect(removeUserListener).toHaveBeenCalledTimes(1);
    expect((comp as any).pendingTimers).toEqual([]);
    expect(svc.cleanupCount).toBe(1);
  });

  it('logs and swallows a failure from removeUserListener and still cleans up', async () => {
    await init();
    removeUserListener.mockImplementation((() => {
      throw new Error('already gone');
    }) as any);

    fixture.destroy();

    expect(loggerError).toHaveBeenCalledWith(
      'CometChatUsers',
      'Error removing user listener:',
      expect.any(Error)
    );
    expect(svc.cleanupCount).toBe(1);
  });

  // =========================================================================
  // User block/unblock events
  // =========================================================================

  it('refreshes a user when a block event is published', async () => {
    await init();
    const blocked = mkUser('b1');
    svc.settle([blocked], States.loaded);

    CometChatUserEvents.publishUserBlocked(blocked);

    expect(svc.updatedUsers).toEqual([blocked]);
    expect(comp.userList).toEqual([blocked]);
  });

  it('refreshes a user when an unblock event is published', async () => {
    await init();
    const unblocked = mkUser('b2');

    CometChatUserEvents.publishUserUnblocked(unblocked);

    expect(svc.updatedUsers).toEqual([unblocked]);
  });

  // =========================================================================
  // refreshUserList
  // =========================================================================

  it('re-initialises the service and refetches when the list is refreshed', async () => {
    svc.fetchNextImpl = () => {
      svc.settle([mkUser('u1')], States.loaded);
      return Promise.resolve();
    };
    await init();
    expect(comp.userList).toHaveLength(1);

    svc.usersSignal.set([]);
    (comp as any).refreshUserList();
    await flush();

    expect(svc.initializeCalls).toHaveLength(2);
    expect(svc.fetchNextCount).toBe(2);
    expect((comp as any).isFirstFetch).toBe(false);
  });

  // =========================================================================
  // fetchNextAndAppendUsers / handleLoadMore
  // =========================================================================

  it('ignores a fetch request while one is already in flight', async () => {
    await init();
    comp.isFetchingMore.set(true);

    comp.fetchNextAndAppendUsers();

    expect(svc.fetchNextCount).toBe(1);
    expect(comp.isFetchingMore()).toBe(true);
  });

  it('ignores a fetch request once the service reports no more pages', async () => {
    svc.fetchNextImpl = () => {
      svc.settle([mkUser('u1')], States.loaded, false);
      return Promise.resolve();
    };
    await init();
    expect(comp.hasMore()).toBe(false);

    comp.fetchNextAndAppendUsers();

    expect(svc.fetchNextCount).toBe(1);
  });

  it('shows the loading state before the first fetch unless loading state is disabled', async () => {
    comp.disableLoadingState = false;
    comp.fetchState = States.loaded;
    let stateDuringFetch: States | undefined;
    svc.fetchNextImpl = () => {
      stateDuringFetch = comp.fetchState;
      svc.settle([mkUser('u1')], States.loaded);
      return Promise.resolve();
    };

    await init();

    expect(stateDuringFetch).toBe(States.loading);
    expect(comp.fetchState).toBe(States.loaded);
  });

  it('leaves the fetch state untouched on the first fetch when loading state is disabled', async () => {
    comp.disableLoadingState = true;
    comp.fetchState = States.loaded;
    let stateDuringFetch: States | undefined;
    svc.fetchNextImpl = () => {
      stateDuringFetch = comp.fetchState;
      return Promise.resolve();
    };

    // `initializeUsersManager` resets to loading, so the marker proves only that
    // the extra assignment at fetch time did not re-run.
    comp.ngOnInit();
    expect(stateDuringFetch).toBe(States.loading);
    comp.fetchState = States.loaded;
    (comp as any).isFirstFetch = true;
    comp.isFetchingMore.set(false);

    comp.fetchNextAndAppendUsers();
    expect(stateDuringFetch).toBe(States.loaded);
    await flush();
  });

  it('emits empty only when the first fetch comes back empty', async () => {
    const emptyEvents: void[] = [];
    comp.empty.subscribe(() => emptyEvents.push(undefined));
    svc.fetchNextImpl = () => {
      svc.settle([], States.empty);
      return Promise.resolve();
    };

    await init();
    expect(emptyEvents).toHaveLength(1);

    // A later page coming back empty must not re-emit.
    comp.isFetchingMore.set(false);
    comp.hasMore.set(true);
    comp.fetchNextAndAppendUsers();
    await flush();
    expect(emptyEvents).toHaveLength(1);
  });

  it('does not emit empty when the first fetch returns users', async () => {
    const emptyEvents: void[] = [];
    comp.empty.subscribe(() => emptyEvents.push(undefined));
    svc.fetchNextImpl = () => {
      svc.settle([mkUser('u1')], States.loaded);
      return Promise.resolve();
    };

    await init();

    expect(emptyEvents).toHaveLength(0);
  });

  it('marks the initial load complete once, and skips the timer on later fetches', async () => {
    svc.fetchNextImpl = () => {
      svc.settle([mkUser('u1')], States.loaded);
      return Promise.resolve();
    };
    await init();
    expect((comp as any).initialLoadComplete).toBe(false);

    await flush(150);
    expect((comp as any).initialLoadComplete).toBe(true);

    const timersBefore = (comp as any).pendingTimers.length;
    comp.isFetchingMore.set(false);
    comp.fetchNextAndAppendUsers();
    await flush();

    expect((comp as any).pendingTimers.length).toBe(timersBefore);
  });

  it('notifies the paginated list and clears the in-flight flag when a fetch rejects', async () => {
    const loadComplete = vi.fn();
    comp.paginatedList = { loadComplete } as unknown as CometChatPaginatedListComponent<CometChat.User>;
    svc.fetchNextImpl = () => {
      svc.settle([], States.error);
      return Promise.reject(new Error('network'));
    };

    await init();

    expect(comp.isFetchingMore()).toBe(false);
    expect(comp.fetchState).toBe(States.error);
    expect(loadComplete).toHaveBeenCalledTimes(1);
  });

  it('notifies the paginated list when a fetch resolves', async () => {
    const loadComplete = vi.fn();
    comp.paginatedList = { loadComplete } as unknown as CometChatPaginatedListComponent<CometChat.User>;
    svc.fetchNextImpl = () => {
      svc.settle([mkUser('u1')], States.loaded);
      return Promise.resolve();
    };

    await init();

    expect(loadComplete).toHaveBeenCalledTimes(1);
  });

  it('loads another page on demand, but not while fetching or when exhausted', async () => {
    svc.fetchNextImpl = () => {
      svc.settle([mkUser('u1')], States.loaded);
      return Promise.resolve();
    };
    await init();

    comp.handleLoadMore();
    await flush();
    expect(svc.fetchNextCount).toBe(2);

    comp.isFetchingMore.set(true);
    comp.handleLoadMore();
    expect(svc.fetchNextCount).toBe(2);

    comp.isFetchingMore.set(false);
    comp.hasMore.set(false);
    comp.handleLoadMore();
    expect(svc.fetchNextCount).toBe(2);
  });

  it('keeps the last error while the state is error and clears it once it is not', async () => {
    await init();
    const failure = { code: 'X' } as CometChat.CometChatException;
    svc.errorCallback!(failure);

    svc.settle([], States.error);
    (comp as any).syncStateFromService();
    expect(comp.lastError).toBe(failure as unknown as Error);

    svc.settle([mkUser('u1')], States.loaded);
    (comp as any).syncStateFromService();
    expect(comp.lastError).toBeNull();
  });

  // =========================================================================
  // Search
  // =========================================================================

  it('debounces search input before handing it to the service', async () => {
    const usersBuilder = { tag: 'users' } as unknown as CometChat.UsersRequestBuilder;
    comp.usersRequestBuilder = usersBuilder;
    comp.searchKeyword = 'seed';
    svc.fetchNextImpl = () => {
      svc.settle([mkUser('u9')], States.loaded, false);
      return Promise.resolve();
    };
    await init();
    const fetchesBefore = svc.fetchNextCount;

    comp.onSearch('ali');
    expect(svc.searchCalls).toHaveLength(0);

    await flush(350);

    expect(svc.searchCalls).toEqual([
      {
        searchText: 'ali',
        config: {
          usersRequestBuilder: usersBuilder,
          searchRequestBuilder: null,
          usersSearchText: 'seed',
        },
      },
    ]);
    expect(comp.searchText).toBe('ali');
    expect(comp.hasMore()).toBe(false);
    expect(svc.fetchNextCount).toBe(fetchesBefore + 1);
  });

  it('passes a search request builder through and defaults the keyword to empty', async () => {
    const searchBuilder = { tag: 'search' } as unknown as CometChat.UsersRequestBuilder;
    comp.searchRequestBuilder = searchBuilder;
    await init();

    (comp as any).handleSearchTextChange('bob');
    await flush();

    expect(svc.searchCalls[0].config).toEqual({
      usersRequestBuilder: null,
      searchRequestBuilder: searchBuilder,
      usersSearchText: '',
    });
    expect(comp.searchText).toBe('bob');
    expect((comp as any).isFirstFetch).toBe(false);
  });

  // =========================================================================
  // Section headers
  // =========================================================================

  it('suppresses section headers when disabled or when the list is empty', () => {
    comp.userList = [mkUser('a1', 'Alice')];
    comp.showSectionHeader = false;
    expect(comp.shouldShowSectionHeader(0)).toBe(false);

    comp.showSectionHeader = true;
    comp.userList = [];
    expect(comp.shouldShowSectionHeader(0)).toBe(false);
  });

  it('shows a section header on the first item and whenever the initial letter changes', () => {
    comp.showSectionHeader = true;
    comp.userList = [mkUser('a1', 'Alice'), mkUser('a2', 'amos'), mkUser('b1', 'Bob')];

    expect(comp.shouldShowSectionHeader(0)).toBe(true);
    expect(comp.shouldShowSectionHeader(1)).toBe(false);
    expect(comp.shouldShowSectionHeader(2)).toBe(true);
  });

  it('reads the section value from the configured accessor', () => {
    comp.sectionHeaderKey = 'getStatus' as keyof CometChat.User;

    expect(comp.getSectionHeaderValue(mkUser('u1', 'Alice', 'offline'))).toBe('O');
  });

  it('falls back to the display name when the configured key is not an accessor', () => {
    comp.sectionHeaderKey = 'getMetadata' as keyof CometChat.User;

    expect(comp.getSectionHeaderValue(mkUser('u1', 'Zoe'))).toBe('Z');
  });

  it('falls back to # when the resolved section value is not a usable string', () => {
    const numeric = {
      getUid: () => 'u1',
      getName: () => 'Alice',
      getStatus: () => 42,
    } as unknown as CometChat.User;
    comp.sectionHeaderKey = 'getStatus' as keyof CometChat.User;
    expect(comp.getSectionHeaderValue(numeric)).toBe('#');

    comp.sectionHeaderKey = 'getName' as keyof CometChat.User;
    expect(comp.getSectionHeaderValue(mkUser('u2', ''))).toBe('#');
  });

  it('falls back to # when the accessor throws', () => {
    const hostile = {
      getUid: () => 'u1',
      getName: () => {
        throw new Error('corrupt user');
      },
    } as unknown as CometChat.User;
    comp.sectionHeaderKey = 'getName' as keyof CometChat.User;

    expect(comp.getSectionHeaderValue(hostile)).toBe('#');
  });

  it('keys the list rows by uid', () => {
    expect(comp.trackByUser(3, mkUser('abc'))).toBe('abc');
  });

  // =========================================================================
  // Item click
  // =========================================================================

  it('emits itemClick when a consumer is listening instead of changing chat state', () => {
    const clicked: CometChat.User[] = [];
    comp.itemClick.subscribe(u => clicked.push(u));
    const user = mkUser('u1');

    comp.handleUserClick(user);

    expect(clicked).toEqual([user]);
    expect(chatState.setActiveUser).not.toHaveBeenCalled();
  });

  it('opens the user in chat state when nothing is listening to itemClick', () => {
    const user = mkUser('u1');

    comp.handleUserClick(user);

    expect(chatState.setActiveUser).toHaveBeenCalledWith(user);
  });

  // =========================================================================
  // Selection
  // =========================================================================

  it('does nothing when a selection change arrives in none mode', () => {
    const picks: unknown[] = [];
    comp.select.subscribe(p => picks.push(p));
    loaded([mkUser('u1')], SelectionMode.none);

    comp.handleSelectionChange(comp.userList[0]);

    expect(comp.selectedUsers.size).toBe(0);
    expect(picks).toEqual([]);
  });

  it('replaces the selection in single mode and toggles it off on a second click', () => {
    const picks: { user: CometChat.User; selected: boolean }[] = [];
    const states: SelectionState[] = [];
    comp.select.subscribe(p => picks.push(p));
    comp.selectionChange.subscribe(s => states.push(s));
    loaded([mkUser('u1'), mkUser('u2')], SelectionMode.single);

    comp.handleSelectionChange(comp.userList[0]);
    expect(Array.from(comp.selectedUsers)).toEqual(['u1']);

    comp.handleSelectionChange(comp.userList[1]);
    expect(Array.from(comp.selectedUsers)).toEqual(['u2']);

    comp.handleSelectionChange(comp.userList[1]);
    expect(comp.selectedUsers.size).toBe(0);
    expect(comp.selectedUsersMap.size).toBe(0);

    expect(picks.map(p => [p.user.getUid(), p.selected])).toEqual([
      ['u1', true],
      ['u2', true],
      ['u2', false],
    ]);
    expect(states.map(s => Array.from(s.selectedIds))).toEqual([['u1'], ['u2'], []]);
    expect(states[2].lastSelectedId).toBe('u2');
    expect(states[0].mode).toBe(SelectionMode.single);
  });

  it('accumulates and removes selections in multiple mode, tracking the click anchor', () => {
    const picks: { user: CometChat.User; selected: boolean }[] = [];
    comp.select.subscribe(p => picks.push(p));
    loaded([mkUser('u1'), mkUser('u2'), mkUser('u3')], SelectionMode.multiple);

    comp.handleSelectionChange(comp.userList[0]);
    comp.handleSelectionChange(comp.userList[2]);
    expect(Array.from(comp.selectedUsers)).toEqual(['u1', 'u3']);
    expect(comp.lastClickedIndex).toBe(2);
    expect(comp.lastClickedUserUid).toBe('u3');

    comp.handleSelectionChange(comp.userList[0]);
    expect(Array.from(comp.selectedUsers)).toEqual(['u3']);
    expect(comp.selectedUsersMap.has('u1')).toBe(false);
    expect(picks.map(p => p.selected)).toEqual([true, true, false]);
  });

  it('treats a non-mouse event, an unmodified click and a missing anchor as plain toggles', () => {
    loaded([mkUser('u1'), mkUser('u2')], SelectionMode.multiple);

    // Not a MouseEvent at all.
    comp.handleSelectionChange(comp.userList[1], new KeyboardEvent('keydown', { shiftKey: true }));
    expect(Array.from(comp.selectedUsers)).toEqual(['u2']);
    expect(comp.lastClickedIndex).toBe(1);

    // MouseEvent without the shift modifier.
    comp.handleSelectionChange(comp.userList[0], new MouseEvent('click'));
    expect(Array.from(comp.selectedUsers)).toEqual(['u2', 'u1']);

    // Shift held, but no anchor recorded yet.
    comp.selectedUsers.clear();
    comp.selectedUsersMap.clear();
    comp.lastClickedIndex = null;
    comp.lastClickedUserUid = null;
    comp.handleSelectionChange(comp.userList[1], new MouseEvent('click', { shiftKey: true }));
    expect(Array.from(comp.selectedUsers)).toEqual(['u2']);

    // Anchor index present but the uid half of the anchor is missing.
    comp.lastClickedUserUid = null;
    comp.handleSelectionChange(comp.userList[0], new MouseEvent('click', { shiftKey: true }));
    expect(Array.from(comp.selectedUsers)).toEqual(['u2', 'u1']);
  });

  it('selects the whole range on a shift-click above the anchor', () => {
    const picks: { user: CometChat.User; selected: boolean }[] = [];
    loaded([mkUser('u1'), mkUser('u2'), mkUser('u3'), mkUser('u4')], SelectionMode.multiple);
    comp.handleSelectionChange(comp.userList[3]);
    comp.select.subscribe(p => picks.push(p));

    comp.handleSelectionChange(comp.userList[1], new MouseEvent('click', { shiftKey: true }));

    expect(Array.from(comp.selectedUsers).sort()).toEqual(['u2', 'u3', 'u4']);
    // u4 was already selected, so only the newly added rows emit.
    expect(picks.map(p => [p.user.getUid(), p.selected])).toEqual([
      ['u2', true],
      ['u3', true],
    ]);
    expect(comp.lastClickedIndex).toBe(1);
    expect(comp.lastClickedUserUid).toBe('u2');
  });

  it('deselects the whole range when the shift-clicked row was already selected', () => {
    const picks: { user: CometChat.User; selected: boolean }[] = [];
    loaded([mkUser('u1'), mkUser('u2'), mkUser('u3')], SelectionMode.multiple);
    comp.handleSelectionChange(comp.userList[0]);
    comp.handleSelectionChange(comp.userList[1]);
    comp.lastClickedIndex = 0;
    comp.lastClickedUserUid = 'u1';
    comp.select.subscribe(p => picks.push(p));

    comp.handleSelectionChange(comp.userList[1], new MouseEvent('click', { shiftKey: true }));

    expect(comp.selectedUsers.size).toBe(0);
    expect(picks.map(p => [p.user.getUid(), p.selected])).toEqual([
      ['u1', false],
      ['u2', false],
    ]);
  });

  it('bails out of a shift range when no anchor is recorded', () => {
    const picks: unknown[] = [];
    comp.select.subscribe(p => picks.push(p));
    loaded([mkUser('u1'), mkUser('u2')], SelectionMode.multiple);
    comp.lastClickedIndex = null;

    (comp as any).handleShiftClickSelection(1, false);

    expect(comp.selectedUsers.size).toBe(0);
    expect(picks).toEqual([]);
  });

  it('reports a null anchor uid when the shift-clicked index is off the end of the list', () => {
    const states: SelectionState[] = [];
    comp.selectionChange.subscribe(s => states.push(s));
    loaded([mkUser('u1'), mkUser('u2')], SelectionMode.multiple);
    comp.lastClickedIndex = 0;

    (comp as any).handleShiftClickSelection(5, false);

    expect(Array.from(comp.selectedUsers)).toEqual(['u1', 'u2']);
    expect(states.at(-1)!.lastSelectedId).toBeNull();
    expect(comp.lastClickedUserUid).toBeNull();
  });

  it('skips holes in the list while walking a shift range', () => {
    const picks: { user: CometChat.User; selected: boolean }[] = [];
    comp.select.subscribe(p => picks.push(p));
    comp.selectionMode = SelectionMode.multiple;
    comp.fetchState = States.loaded;
    comp.userList = [mkUser('u1'), undefined as unknown as CometChat.User, mkUser('u3')];
    comp.lastClickedIndex = 0;
    comp.lastClickedUserUid = 'u1';

    (comp as any).handleShiftClickSelection(2, false);

    expect(Array.from(comp.selectedUsers)).toEqual(['u1', 'u3']);
    expect(picks).toHaveLength(2);
  });

  it('routes a checkbox/radio change through the same selection path', () => {
    loaded([mkUser('u1')], SelectionMode.single);

    comp.handleSelectionControlChange(comp.userList[0], new Event('change'));

    expect(Array.from(comp.selectedUsers)).toEqual(['u1']);
  });

  it('removes a user from the selected preview and announces the deselection', () => {
    const picks: { user: CometChat.User; selected: boolean }[] = [];
    const states: SelectionState[] = [];
    comp.select.subscribe(p => picks.push(p));
    comp.selectionChange.subscribe(s => states.push(s));
    loaded([mkUser('u1'), mkUser('u2')], SelectionMode.multiple);
    comp.handleSelectionChange(comp.userList[0]);
    comp.handleSelectionChange(comp.userList[1]);

    comp.removeSelectedUser(comp.userList[0]);

    expect(Array.from(comp.selectedUsers)).toEqual(['u2']);
    expect(picks.at(-1)).toEqual({ user: comp.userList[0], selected: false });
    expect(states.at(-1)!.lastSelectedId).toBe('u1');
  });

  it('refuses to select all outside multiple mode', () => {
    const picks: unknown[] = [];
    comp.select.subscribe(p => picks.push(p));
    loaded([mkUser('u1'), mkUser('u2')], SelectionMode.single);
    comp.focusedIndex = 1;

    comp.selectAll();

    expect(comp.selectedUsers.size).toBe(0);
    expect(picks).toEqual([]);
    expect(comp.focusedIndex).toBe(1);
  });

  it('selects every unselected row on select all and leaves existing picks alone', () => {
    const picks: { user: CometChat.User; selected: boolean }[] = [];
    loaded([mkUser('u1'), mkUser('u2'), mkUser('u3')], SelectionMode.multiple);
    comp.handleSelectionChange(comp.userList[1]);
    comp.focusedIndex = 2;
    comp.select.subscribe(p => picks.push(p));

    comp.selectAll();

    expect(Array.from(comp.selectedUsers).sort()).toEqual(['u1', 'u2', 'u3']);
    expect(picks.map(p => p.user.getUid())).toEqual(['u1', 'u3']);
    expect(comp.focusedIndex).toBe(-1);
  });

  it('clears every selection and resets the click anchor', () => {
    const picks: { user: CometChat.User; selected: boolean }[] = [];
    const states: SelectionState[] = [];
    loaded([mkUser('u1'), mkUser('u2')], SelectionMode.multiple);
    comp.handleSelectionChange(comp.userList[0]);
    comp.handleSelectionChange(comp.userList[1]);
    comp.select.subscribe(p => picks.push(p));
    comp.selectionChange.subscribe(s => states.push(s));

    comp.clearSelection();

    expect(picks.map(p => [p.user.getUid(), p.selected])).toEqual([
      ['u1', false],
      ['u2', false],
    ]);
    expect(comp.selectedUsers.size).toBe(0);
    expect(comp.selectedUsersMap.size).toBe(0);
    expect(comp.lastClickedIndex).toBeNull();
    expect(comp.lastClickedUserUid).toBeNull();
    expect(states[0].lastSelectedId).toBeNull();
  });

  it('reports selection membership and the ordered selected-user array', () => {
    loaded([mkUser('u1'), mkUser('u2')], SelectionMode.multiple);
    comp.handleSelectionChange(comp.userList[1]);

    expect(comp.isUserSelected(comp.userList[1])).toBe(true);
    expect(comp.isUserSelected(comp.userList[0])).toBe(false);
    expect(comp.getSelectedUsersArray().map(u => u.getUid())).toEqual(['u2']);
  });

  // =========================================================================
  // Active user
  // =========================================================================

  it('prefers the activeUser input when deciding which row is active', () => {
    comp.activeUser = mkUser('u2');

    expect(comp.isUserActive(mkUser('u2'))).toBe(true);
    expect(comp.isUserActive(mkUser('u1'))).toBe(false);
    expect(chatState.getActiveUser).not.toHaveBeenCalled();
  });

  it('falls back to chat state, and reports nothing active when chat state is empty', () => {
    chatState.getActiveUser.mockReturnValue(mkUser('u3'));
    expect(comp.isUserActive(mkUser('u3'))).toBe(true);
    expect(comp.isUserActive(mkUser('u1'))).toBe(false);

    chatState.getActiveUser.mockReturnValue(null);
    expect(comp.isUserActive(mkUser('u3'))).toBe(false);
  });

  // =========================================================================
  // Options / labels / tracking
  // =========================================================================

  it('returns an empty option list when no options factory is supplied', () => {
    expect(comp.getOptionsForUser(mkUser('u1'))).toEqual([]);
  });

  it('delegates to the options factory with the row user', () => {
    const option = new CometChatOption({ id: 'block', title: 'Block' });
    comp.options = vi.fn().mockReturnValue([option]);

    expect(comp.getOptionsForUser(mkUser('u1'))).toEqual([option]);
    expect(comp.options).toHaveBeenCalledWith(expect.objectContaining({ getUid: expect.any(Function) }));
  });

  it('invokes an option handler when present and tolerates one without a handler', () => {
    const onClick = vi.fn();
    const user = mkUser('u1');

    comp.handleOptionClick(new CometChatOption({ id: 'a', onClick }), user);
    expect(onClick).toHaveBeenCalledTimes(1);

    comp.handleOptionClick(new CometChatOption({ id: 'b' }), user);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('builds the row aria label from name and status, honouring hideUserStatus', () => {
    expect(comp.getUserAriaLabel(mkUser('u1', 'Alice', 'online'))).toBe('Alice, online');

    comp.hideUserStatus = true;
    expect(comp.getUserAriaLabel(mkUser('u1', 'Alice', 'online'))).toBe('Alice');

    comp.hideUserStatus = false;
    expect(comp.getUserAriaLabel(mkUser('u1', 'Alice', ''))).toBe('Alice');
    expect(comp.getUserAriaLabel(mkUser('u1', '', 'online'))).toBe(', online');
  });

  // KNOWN DEFECT, pinned deliberately. The template feeds the row component
  // `effectiveHideUserStatus()` (global-config aware) but builds the row's
  // aria-label from the raw `hideUserStatus` input. Under a global config that
  // hides the status, the dot disappears while a screen reader still reads it
  // out. Fixing the source should make the last assertion 'Alice'.
  it('builds the aria label from the raw input, ignoring a status hidden by global config', () => {
    rebuildWith({ hideUserStatus: true });

    expect(comp.effectiveHideUserStatus()).toBe(true);
    expect(comp.hideUserStatus).toBe(false);
    expect(comp.getUserAriaLabel(mkUser('u1', 'Alice', 'online'))).toBe('Alice, online');
  });

  it('keys the selected-user preview rows by their map key', () => {
    expect(comp.trackBySelectedUser(0, { key: 'u7', value: mkUser('u7') })).toBe('u7');
  });

  it('gives the focused row tabindex 0 and makes the first row tabbable when nothing is focused', () => {
    comp.focusedIndex = 2;
    expect(comp.getTabIndex(2)).toBe(0);
    expect(comp.getTabIndex(0)).toBe(-1);

    comp.focusedIndex = -1;
    expect(comp.getTabIndex(0)).toBe(0);
    expect(comp.getTabIndex(1)).toBe(-1);
  });

  // =========================================================================
  // Host focus
  // =========================================================================

  it('moves focus to the first row when the list gains focus with nothing focused', () => {
    comp.userList = [mkUser('u1'), mkUser('u2')];
    comp.focusedIndex = -1;

    comp.handleListFocus();

    expect(comp.focusedIndex).toBe(0);
  });

  it('leaves focus alone when a row is already focused or the list is empty', () => {
    comp.userList = [mkUser('u1')];
    comp.focusedIndex = 1;
    comp.handleListFocus();
    expect(comp.focusedIndex).toBe(1);

    comp.userList = [];
    comp.focusedIndex = -1;
    comp.handleListFocus();
    expect(comp.focusedIndex).toBe(-1);
  });

  it('records the row index reported by a row focus callback', () => {
    comp.handleItemFocus(4);

    expect(comp.focusedIndex).toBe(4);
  });

  // =========================================================================
  // Keyboard navigation through the shared handler
  // =========================================================================

  // These three guards have to be asserted against the navigation helper, not
  // against `focusedIndex`: the snapshot write-back in `onUsersKeyDown` means a
  // plain ArrowDown leaves `focusedIndex` untouched even when it IS handled, so
  // an assertion on the index would hold whether or not the guard fired.
  it('ignores keystrokes until the list is loaded and populated', () => {
    const focusNext = vi.spyOn(comp as any, 'focusNextItem');

    comp.userList = [];
    comp.fetchState = States.loaded;
    comp.focusedIndex = -1;
    comp.handleKeydown(key('ArrowDown'));

    comp.userList = [mkUser('u1'), mkUser('u2')];
    comp.fetchState = States.loading;
    comp.handleKeydown(key('ArrowDown'));

    expect(focusNext).not.toHaveBeenCalled();

    // Same keystroke once both preconditions hold — proves the guard above was
    // what stopped it, not the keystroke being inert.
    comp.fetchState = States.loaded;
    comp.handleKeydown(key('ArrowDown'));
    expect(focusNext).toHaveBeenCalledTimes(1);
  });

  it('advances the focused row and wraps at the end', () => {
    comp.userList = [mkUser('u1'), mkUser('u2')];
    comp.focusedIndex = -1;

    (comp as any).focusNextItem();
    expect(comp.focusedIndex).toBe(0);
    (comp as any).focusNextItem();
    expect(comp.focusedIndex).toBe(1);
    (comp as any).focusNextItem();
    expect(comp.focusedIndex).toBe(0);
  });

  it('retreats the focused row and wraps at the start', () => {
    comp.userList = [mkUser('u1'), mkUser('u2'), mkUser('u3')];
    comp.focusedIndex = -1;

    (comp as any).focusPreviousItem();
    expect(comp.focusedIndex).toBe(2);
    (comp as any).focusPreviousItem();
    expect(comp.focusedIndex).toBe(1);
    comp.focusedIndex = 0;
    (comp as any).focusPreviousItem();
    expect(comp.focusedIndex).toBe(2);
  });

  // KNOWN DEFECT, pinned deliberately rather than asserted as correct.
  // `onUsersKeyDown` hands the shared handler a host object holding a plain
  // number copy of `focusedIndex`. Plain ArrowDown/ArrowUp go through
  // `host.focusNextItem()`, which mutates the component field but leaves the
  // host's copy stale; the write-back on the next line then sees the two
  // disagree and assigns the STALE copy back, undoing the move. So arrow keys
  // call the navigation helpers and the focus move is immediately reverted.
  // (Shift+Arrow and type-ahead escape this because the handler assigns
  // `host.focusedIndex` itself.) These two tests therefore assert the helper
  // ran AND that the index snaps back; the second assertion is the bug. Fixing
  // the source should flip it to `toBe(0)` / `toBe(0)`.
  it('runs the forward navigation helper on ArrowDown but restores the snapshot index', () => {
    const focusNext = vi.spyOn(comp as any, 'focusNextItem');
    loaded([mkUser('u1'), mkUser('u2')]);
    comp.focusedIndex = -1;

    comp.handleKeydown(key('ArrowDown'));

    expect(focusNext).toHaveBeenCalledTimes(1);
    expect(comp.focusedIndex).toBe(-1);
  });

  it('runs the backward navigation helper on ArrowUp but restores the snapshot index', () => {
    const focusPrev = vi.spyOn(comp as any, 'focusPreviousItem');
    loaded([mkUser('u1'), mkUser('u2'), mkUser('u3')]);
    comp.focusedIndex = 1;

    comp.handleKeydown(key('ArrowUp'));

    expect(focusPrev).toHaveBeenCalledTimes(1);
    expect(comp.focusedIndex).toBe(1);
  });

  it('does not move focus when the navigation helpers run against an empty list', () => {
    comp.userList = [];
    comp.focusedIndex = 4;

    (comp as any).focusNextItem();
    expect(comp.focusedIndex).toBe(4);

    (comp as any).focusPreviousItem();
    expect(comp.focusedIndex).toBe(4);
  });

  it('activates the focused row with Enter — opening it in none mode', () => {
    const clicked: CometChat.User[] = [];
    comp.itemClick.subscribe(u => clicked.push(u));
    loaded([mkUser('u1'), mkUser('u2')], SelectionMode.none);
    comp.focusedIndex = 1;

    comp.handleKeydown(key('Enter'));

    expect(clicked.map(u => u.getUid())).toEqual(['u2']);
  });

  it('activates the focused row with Enter — toggling selection in multiple mode', () => {
    loaded([mkUser('u1'), mkUser('u2')], SelectionMode.multiple);
    comp.focusedIndex = 0;

    comp.handleKeydown(key('Enter'));

    expect(Array.from(comp.selectedUsers)).toEqual(['u1']);
  });

  it('does nothing when Enter arrives with no row focused or an out-of-range index', () => {
    const clicked: CometChat.User[] = [];
    comp.itemClick.subscribe(u => clicked.push(u));
    loaded([mkUser('u1')], SelectionMode.none);

    comp.focusedIndex = -1;
    comp.handleKeydown(key('Enter'));
    comp.focusedIndex = 9;
    comp.handleKeydown(key('Enter'));

    expect(clicked).toEqual([]);
  });

  it('toggles the focused row with Space in selection mode and announces the count', () => {
    loaded([mkUser('u1'), mkUser('u2')], SelectionMode.multiple);
    comp.focusedIndex = 1;

    comp.handleKeydown(key(' '));

    expect(Array.from(comp.selectedUsers)).toEqual(['u2']);
    expect(announcer.announce).toHaveBeenCalledWith(expect.stringContaining('1'), 'polite');
  });

  it('selects all rows on Ctrl+A in multiple mode and announces the count', () => {
    loaded([mkUser('u1'), mkUser('u2'), mkUser('u3')], SelectionMode.multiple);

    comp.handleKeydown(key('a', kbItem, { ctrlKey: true }));

    expect(comp.selectedUsers.size).toBe(3);
    expect(announcer.announce).toHaveBeenCalledWith(expect.stringContaining('3'), 'polite');
  });

  it('clears the selection on Ctrl+Shift+A and announces that it was cleared', () => {
    loaded([mkUser('u1'), mkUser('u2')], SelectionMode.multiple);
    comp.handleSelectionChange(comp.userList[0]);
    announcer.announce.mockClear();

    comp.handleKeydown(key('A', kbItem, { ctrlKey: true, shiftKey: true }));

    expect(comp.selectedUsers.size).toBe(0);
    expect(announcer.announce).toHaveBeenCalledTimes(1);
    expect(announcer.announce.mock.calls[0][1]).toBe('polite');
  });

  it('stays silent about a selection count of zero', () => {
    loaded([mkUser('u1')], SelectionMode.multiple);

    (comp as any).announceSelectionCount();

    expect(announcer.announce).not.toHaveBeenCalled();
  });

  it('clears the selection on Escape while rows are selected', () => {
    loaded([mkUser('u1'), mkUser('u2')], SelectionMode.multiple);
    comp.handleSelectionChange(comp.userList[0]);

    comp.handleKeydown(key('Escape'));

    expect(comp.selectedUsers.size).toBe(0);
  });

  it('hands Escape to the component when nothing is selected', async () => {
    await init();
    loaded([mkUser('u1')], SelectionMode.none);
    comp.searchText = 'ali';

    comp.handleKeydown(key('Escape'));

    expect(comp.searchText).toBe('');
  });

  it('jumps to the type-ahead match and feeds row names to the matcher', () => {
    const nameless = mkUser('u3', '');
    loaded([mkUser('u1', 'Alice'), mkUser('u2', 'Bob'), nameless]);
    comp.focusedIndex = 0;
    typeAhead.handleCharacter.mockImplementation(
      (_char: string, items: CometChat.User[], _idx: number, config: any) => {
        items.forEach(u => config.getSearchText(u));
        return 1;
      }
    );

    comp.handleKeydown(key('b'));

    expect(typeAhead.handleCharacter).toHaveBeenCalledWith('b', comp.userList, 0, expect.any(Object));
    const config = typeAhead.handleCharacter.mock.calls[0][3];
    expect(config.getSearchText(comp.userList[0])).toBe('Alice');
    expect(config.getSearchText(nameless)).toBe('');
    expect(comp.focusedIndex).toBe(1);
  });

  it('leaves focus where it is when type-ahead finds no match', () => {
    loaded([mkUser('u1', 'Alice'), mkUser('u2', 'Bob')]);
    comp.focusedIndex = 0;
    typeAhead.handleCharacter.mockReturnValue(-1);

    comp.handleKeydown(key('z'));

    expect(comp.focusedIndex).toBe(0);
  });

  it('selects from the anchor to the focused row on Shift+Space', () => {
    loaded([mkUser('u1'), mkUser('u2'), mkUser('u3')], SelectionMode.multiple);
    comp.handleSelectionChange(comp.userList[0]);
    comp.focusedIndex = 2;

    comp.handleKeydown(key(' ', kbItem, { shiftKey: true }));

    expect(Array.from(comp.selectedUsers).sort()).toEqual(['u1', 'u2', 'u3']);
  });

  it('extends the selection downward on Shift+ArrowDown and follows it with focus', () => {
    const states: SelectionState[] = [];
    comp.selectionChange.subscribe(s => states.push(s));
    loaded([mkUser('u1'), mkUser('u2'), mkUser('u3')], SelectionMode.multiple);
    comp.focusedIndex = 0;

    comp.handleKeydown(key('ArrowDown', kbItem, { shiftKey: true }));

    expect(Array.from(comp.selectedUsers)).toEqual(['u2']);
    expect(comp.focusedIndex).toBe(1);
    expect(comp.lastClickedIndex).toBe(1);
    expect(states.at(-1)!.lastSelectedId).toBe('u2');
  });

  it('extends the selection upward on Shift+ArrowUp', () => {
    loaded([mkUser('u1'), mkUser('u2'), mkUser('u3')], SelectionMode.multiple);
    comp.focusedIndex = 2;

    comp.handleKeydown(key('ArrowUp', kbItem, { shiftKey: true }));

    expect(Array.from(comp.selectedUsers)).toEqual(['u2']);
    expect(comp.focusedIndex).toBe(1);
  });

  it('ignores keystrokes aimed outside the component root', () => {
    const focusNext = vi.spyOn(comp as any, 'focusNextItem');
    const stranger = document.createElement('div');
    document.body.appendChild(stranger);
    loaded([mkUser('u1'), mkUser('u2')]);
    comp.focusedIndex = 0;

    comp.handleKeydown(key('ArrowDown', stranger));
    expect(focusNext).not.toHaveBeenCalled();

    // The identical key aimed inside the root is handled.
    comp.handleKeydown(key('ArrowDown', kbItem));
    expect(focusNext).toHaveBeenCalledTimes(1);

    stranger.remove();
  });

  it('leaves navigation keys to the search input while focus is in the search bar', () => {
    const focusNext = vi.spyOn(comp as any, 'focusNextItem');
    loaded([mkUser('u1'), mkUser('u2')]);
    comp.focusedIndex = 0;

    comp.handleKeydown(key('ArrowDown', kbSearch));
    expect(focusNext).not.toHaveBeenCalled();

    comp.handleKeydown(key('ArrowDown', kbItem));
    expect(focusNext).toHaveBeenCalledTimes(1);
  });

  // =========================================================================
  // extendSelectionTo / selectRangeFromAnchor guards
  // =========================================================================

  it('refuses to extend the selection to an index outside the list', () => {
    const picks: unknown[] = [];
    comp.select.subscribe(p => picks.push(p));
    loaded([mkUser('u1'), mkUser('u2')], SelectionMode.multiple);

    (comp as any).extendSelectionTo(-1);
    (comp as any).extendSelectionTo(2);

    expect(comp.selectedUsers.size).toBe(0);
    expect(picks).toEqual([]);
  });

  it('re-anchors without re-emitting when extending onto an already selected row', () => {
    const picks: unknown[] = [];
    loaded([mkUser('u1'), mkUser('u2')], SelectionMode.multiple);
    comp.handleSelectionChange(comp.userList[1]);
    comp.select.subscribe(p => picks.push(p));

    (comp as any).extendSelectionTo(1);

    expect(picks).toEqual([]);
    expect(comp.lastClickedIndex).toBe(1);
    expect(comp.lastClickedUserUid).toBe('u2');
  });

  it('selects only the current row when no anchor has been set', () => {
    const states: SelectionState[] = [];
    comp.selectionChange.subscribe(s => states.push(s));
    loaded([mkUser('u1'), mkUser('u2'), mkUser('u3')], SelectionMode.multiple);
    comp.lastClickedIndex = null;

    (comp as any).selectRangeFromAnchor(2);

    expect(Array.from(comp.selectedUsers)).toEqual(['u3']);
    expect(states.at(-1)!.lastSelectedId).toBe('u3');
  });

  it('clamps an anchored range to the bounds of the list', () => {
    const states: SelectionState[] = [];
    comp.selectionChange.subscribe(s => states.push(s));
    loaded([mkUser('u1'), mkUser('u2')], SelectionMode.multiple);

    comp.lastClickedIndex = 5;
    (comp as any).selectRangeFromAnchor(0);
    expect(Array.from(comp.selectedUsers)).toEqual(['u1', 'u2']);

    comp.selectedUsers.clear();
    comp.selectedUsersMap.clear();
    comp.lastClickedIndex = -3;
    (comp as any).selectRangeFromAnchor(1);
    expect(Array.from(comp.selectedUsers)).toEqual(['u1', 'u2']);
    expect(states.at(-1)!.lastSelectedId).toBe('u2');
  });

  it('skips the selection-change emission when the anchored index is off the list', () => {
    const states: SelectionState[] = [];
    comp.selectionChange.subscribe(s => states.push(s));
    loaded([mkUser('u1'), mkUser('u2')], SelectionMode.multiple);

    (comp as any).selectRangeFromAnchor(-1);
    (comp as any).selectRangeFromAnchor(7);

    expect(states).toEqual([]);
  });

  // =========================================================================
  // Scrolling / DOM focus helpers
  // =========================================================================

  it('does not scroll the focused row into view before the initial load settles', async () => {
    const container = document.createElement('div');
    container.innerHTML = '<div data-index="0"></div>';
    const row = container.querySelector('[data-index="0"]') as HTMLElement;
    row.scrollIntoView = vi.fn();
    comp.listContainer = { nativeElement: container } as ElementRef<HTMLElement>;
    (comp as any).initialLoadComplete = false;
    comp.focusedIndex = 0;

    (comp as any).scrollFocusedItemIntoView();
    await flush();

    expect(row.scrollIntoView).not.toHaveBeenCalled();
    expect((comp as any).pendingTimers).toEqual([]);
  });

  it('scrolls the focused row into view once the initial load has settled', async () => {
    const container = document.createElement('div');
    container.innerHTML = '<div data-index="0"></div><div data-index="1"></div>';
    const row = container.querySelector('[data-index="1"]') as HTMLElement;
    row.scrollIntoView = vi.fn();
    comp.listContainer = { nativeElement: container } as ElementRef<HTMLElement>;
    (comp as any).initialLoadComplete = true;
    comp.focusedIndex = 1;

    (comp as any).scrollFocusedItemIntoView();
    await flush();

    expect(row.scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'nearest',
    });
  });

  it('moves DOM focus onto the tabbable element of the row at an index', async () => {
    const container = document.createElement('div');
    container.innerHTML =
      '<div data-index="0"><cometchat-user-item><button tabindex="0">a</button></cometchat-user-item></div>';
    document.body.appendChild(container);
    comp.listContainer = { nativeElement: container } as ElementRef<HTMLElement>;

    (comp as any).focusItemAtIndex(0);
    await flush();

    expect(document.activeElement).toBe(container.querySelector('button'));
    container.remove();
  });

  it('prevents the default mousedown so a row click does not steal focus', () => {
    const event = new MouseEvent('mousedown', { cancelable: true });

    comp.handleMouseDown(event);

    expect(event.defaultPrevented).toBe(true);
  });

  // =========================================================================
  // Container click
  // =========================================================================

  it('drops row focus when the click lands on empty list background', () => {
    const blank = document.createElement('div');
    kbRoot.appendChild(blank);
    comp.focusedIndex = 3;

    comp.handleContainerClick(aimAt(new MouseEvent('click'), blank));

    expect(comp.focusedIndex).toBe(-1);
  });

  it('keeps row focus when the click lands on a row or on a selection control', () => {
    const cases = ['cometchat-user-item', 'cometchat-checkbox', 'cometchat-radio-button', 'cometchat-search-bar'];

    for (const marker of cases) {
      const wrapper =
        marker === 'cometchat-user-item'
          ? Object.assign(document.createElement('div'), { className: marker })
          : document.createElement(marker);
      const inner = document.createElement('span');
      wrapper.appendChild(inner);
      kbRoot.appendChild(wrapper);
      comp.focusedIndex = 2;

      comp.handleContainerClick(aimAt(new MouseEvent('click'), inner));

      expect(comp.focusedIndex, `click inside ${marker}`).toBe(2);
      wrapper.remove();
    }
  });

  // =========================================================================
  // Retry
  // =========================================================================

  it('clears the error and refetches from the start when retry is clicked', async () => {
    svc.fetchNextImpl = () => {
      svc.settle([], States.error);
      return Promise.reject(new Error('boom'));
    };
    await init();
    svc.errorCallback!({ code: 'ERR' } as CometChat.CometChatException);
    expect(comp.lastError).not.toBeNull();

    svc.fetchNextImpl = () => {
      svc.settle([mkUser('u1')], States.loaded);
      return Promise.resolve();
    };
    comp.handleRetryClick();
    expect(comp.lastError).toBeNull();
    await flush();

    expect(svc.initializeCalls).toHaveLength(2);
    expect(svc.fetchNextCount).toBe(2);
    expect(comp.fetchState).toBe(States.loaded);
  });

  // =========================================================================
  // Escape key handling
  // =========================================================================

  it('clears the search box first when Escape arrives with a search term', async () => {
    await init();
    comp.searchText = 'ali';
    comp.focusedIndex = 2;
    comp.selectionMode = SelectionMode.multiple;
    comp.selectedUsers.add('u1');

    (comp as any).handleEscapeKey();

    expect(comp.searchText).toBe('');
    // Focus and selection survive the first Escape.
    expect(comp.focusedIndex).toBe(2);
    expect(comp.selectedUsers.size).toBe(1);

    await flush(350);
    expect(svc.searchCalls.map(c => c.searchText)).toEqual(['']);
  });

  it('clears the selection and focus on Escape with no search term', () => {
    loaded([mkUser('u1')], SelectionMode.multiple);
    comp.handleSelectionChange(comp.userList[0]);
    comp.focusedIndex = 0;

    (comp as any).handleEscapeKey();

    expect(comp.selectedUsers.size).toBe(0);
    expect(comp.focusedIndex).toBe(-1);
  });

  it('only drops focus on Escape when selection is off or nothing is selected', () => {
    loaded([mkUser('u1')], SelectionMode.none);
    comp.focusedIndex = 0;
    (comp as any).handleEscapeKey();
    expect(comp.focusedIndex).toBe(-1);

    comp.selectionMode = SelectionMode.multiple;
    comp.focusedIndex = 0;
    comp.selectedUsers.clear();
    (comp as any).handleEscapeKey();
    expect(comp.focusedIndex).toBe(-1);
    expect(comp.selectedUsers.size).toBe(0);
  });

  // =========================================================================
  // focusin bookkeeping
  // =========================================================================

  function rowTree(opts: { wrapper?: boolean; paginated?: boolean; index?: string | null } = {}): {
    root: HTMLElement;
    itemDiv: HTMLElement;
    inner: HTMLElement;
  } {
    // `null` means "render the row without a data-index attribute"; `undefined`
    // would silently fall back to the default below.
    const { wrapper = true, paginated = true, index = '2' } = opts;
    const root = document.createElement('div');
    let mount: HTMLElement = root;
    if (paginated) {
      const pag = document.createElement('div');
      pag.className = 'cometchat-paginated-list__item';
      if (index !== null) pag.setAttribute('data-index', index);
      mount.appendChild(pag);
      mount = pag;
    }
    if (wrapper) {
      const wrap = document.createElement('div');
      wrap.className = 'cometchat-users__list-item-wrapper';
      mount.appendChild(wrap);
      mount = wrap;
    }
    const itemDiv = document.createElement('div');
    itemDiv.className = 'cometchat-user-item';
    const inner = document.createElement('span');
    itemDiv.appendChild(inner);
    mount.appendChild(itemDiv);
    document.body.appendChild(root);
    return { root, itemDiv, inner };
  }

  it('adopts the row index from the data-index attribute when a descendant gains focus', () => {
    const { root, inner } = rowTree({ index: '2' });
    comp.focusedIndex = 0;

    comp.handleFocusIn(aimAt(new FocusEvent('focusin'), inner));

    expect(comp.focusedIndex).toBe(2);
    root.remove();
  });

  it('adopts the row index when the row element itself gains focus', () => {
    const { root, itemDiv } = rowTree({ index: '3' });
    comp.focusedIndex = 0;

    comp.handleFocusIn(aimAt(new FocusEvent('focusin'), itemDiv));

    expect(comp.focusedIndex).toBe(3);
    root.remove();
  });

  it('leaves the focused index alone when the row already holds focus', () => {
    const { root, inner } = rowTree({ index: '2' });
    comp.focusedIndex = 2;
    const markForCheck = vi.spyOn((comp as any).cdr, 'markForCheck');

    comp.handleFocusIn(aimAt(new FocusEvent('focusin'), inner));

    expect(comp.focusedIndex).toBe(2);
    expect(markForCheck).not.toHaveBeenCalled();
    root.remove();
  });

  it('ignores a focusin with no target', () => {
    comp.focusedIndex = 1;

    comp.handleFocusIn(aimAt(new FocusEvent('focusin'), null));

    expect(comp.focusedIndex).toBe(1);
  });

  it('ignores a focusin from outside any row', () => {
    const stray = document.createElement('div');
    document.body.appendChild(stray);
    comp.focusedIndex = 1;

    comp.handleFocusIn(aimAt(new FocusEvent('focusin'), stray));

    expect(comp.focusedIndex).toBe(1);
    stray.remove();
  });

  it('ignores a focusin from a row that is not inside a list-item wrapper', () => {
    const { root, inner } = rowTree({ wrapper: false });
    comp.focusedIndex = 1;

    comp.handleFocusIn(aimAt(new FocusEvent('focusin'), inner));

    expect(comp.focusedIndex).toBe(1);
    root.remove();
  });

  it('ignores a focusin from a wrapper that is not inside a paginated list item', () => {
    const { root, inner } = rowTree({ paginated: false });
    comp.focusedIndex = 1;

    comp.handleFocusIn(aimAt(new FocusEvent('focusin'), inner));

    expect(comp.focusedIndex).toBe(1);
    root.remove();
  });

  it('ignores a focusin from a paginated row carrying no data-index', () => {
    const { root, inner } = rowTree({ index: null });
    comp.focusedIndex = 1;

    comp.handleFocusIn(aimAt(new FocusEvent('focusin'), inner));

    expect(comp.focusedIndex).toBe(1);
    root.remove();
  });

  // =========================================================================
  // Template resolution
  // =========================================================================

  const tpl = (id: string): TemplateRef<any> => ({ id } as unknown as TemplateRef<any>);

  it('prefers the deprecated template inputs over the newer view inputs and the service', () => {
    templates.getUserTemplates.mockReturnValue({
      itemView: tpl('svc-item'),
      leadingView: tpl('svc-leading'),
      titleView: tpl('svc-title'),
      subtitleView: tpl('svc-subtitle'),
      trailingView: tpl('svc-trailing'),
    });
    const legacyItem = tpl('legacy-item');
    const legacyEmpty = tpl('legacy-empty');
    const legacyError = tpl('legacy-error');
    const legacyLoading = tpl('legacy-loading');
    comp.listItemTemplate = legacyItem;
    comp.emptyStateTemplate = legacyEmpty;
    comp.errorStateTemplate = legacyError;
    comp.loadingStateTemplate = legacyLoading;
    comp.itemView = tpl('input-item');

    expect(comp.effectiveItemView).toBe(legacyItem);
    expect(comp.effectiveEmptyView).toBe(legacyEmpty);
    expect(comp.effectiveErrorView).toBe(legacyError);
    expect(comp.effectiveLoadingView).toBe(legacyLoading);
    expect(templates.resolveTemplate).not.toHaveBeenCalled();
  });

  it('prefers the view inputs over the service templates', () => {
    templates.getUserTemplates.mockReturnValue({
      itemView: tpl('svc-item'),
      leadingView: tpl('svc-leading'),
      titleView: tpl('svc-title'),
      subtitleView: tpl('svc-subtitle'),
      trailingView: tpl('svc-trailing'),
    });
    const item = tpl('in-item');
    const leading = tpl('in-leading');
    const title = tpl('in-title');
    const subtitle = tpl('in-subtitle');
    const trailing = tpl('in-trailing');
    const empty = tpl('in-empty');
    const error = tpl('in-error');
    const loading = tpl('in-loading');
    Object.assign(comp, {
      itemView: item,
      leadingView: leading,
      titleView: title,
      subtitleView: subtitle,
      trailingView: trailing,
      emptyView: empty,
      errorView: error,
      loadingView: loading,
    });

    expect(comp.effectiveItemView).toBe(item);
    expect(comp.effectiveLeadingView).toBe(leading);
    expect(comp.effectiveTitleView).toBe(title);
    expect(comp.effectiveSubtitleView).toBe(subtitle);
    expect(comp.effectiveTrailingView).toBe(trailing);
    expect(comp.effectiveEmptyView).toBe(empty);
    expect(comp.effectiveErrorView).toBe(error);
    expect(comp.effectiveLoadingView).toBe(loading);
  });

  it('falls back to the user templates registered on the service', () => {
    const svcItem = tpl('svc-item');
    const svcLeading = tpl('svc-leading');
    const svcTitle = tpl('svc-title');
    const svcSubtitle = tpl('svc-subtitle');
    const svcTrailing = tpl('svc-trailing');
    templates.getUserTemplates.mockReturnValue({
      itemView: svcItem,
      leadingView: svcLeading,
      titleView: svcTitle,
      subtitleView: svcSubtitle,
      trailingView: svcTrailing,
    });

    expect(comp.effectiveItemView).toBe(svcItem);
    expect(comp.effectiveLeadingView).toBe(svcLeading);
    expect(comp.effectiveTitleView).toBe(svcTitle);
    expect(comp.effectiveSubtitleView).toBe(svcSubtitle);
    expect(comp.effectiveTrailingView).toBe(svcTrailing);
  });

  it('asks the templates service to resolve the state views when nothing local is set', () => {
    const resolved = tpl('shared');
    templates.getUserTemplates.mockReturnValue({});
    templates.resolveTemplate.mockReturnValue(resolved);

    expect(comp.effectiveLoadingView).toBe(resolved);
    expect(comp.effectiveEmptyView).toBe(resolved);
    expect(comp.effectiveErrorView).toBe(resolved);
    expect(templates.resolveTemplate.mock.calls.map(c => c[1])).toEqual([
      'loadingView',
      'emptyView',
      'errorView',
    ]);
  });

  // =========================================================================
  // Global config priority: explicit @Input beats global config beats false
  // =========================================================================

  it('defaults the global-config-backed flags to false with no global config present', () => {
    expect(comp.effectiveHideUserStatus()).toBe(false);
    expect(comp.effectiveShowScrollbar()).toBe(false);
    expect(comp.effectiveHideError()).toBe(false);
    expect(comp.hideUserStatus).toBe(false);
    expect(comp.showScrollbar).toBe(false);
    expect(comp.hideError).toBe(false);
  });

  it('adopts the global config values while the inputs are untouched', () => {
    rebuildWith({ hideUserStatus: true, showScrollbar: true, hideError: true });

    expect(comp.effectiveHideUserStatus()).toBe(true);
    expect(comp.effectiveShowScrollbar()).toBe(true);
    expect(comp.effectiveHideError()).toBe(true);
    // The raw inputs stay at their declared defaults.
    expect(comp.hideUserStatus).toBe(false);
    expect(comp.showScrollbar).toBe(false);
    expect(comp.hideError).toBe(false);
  });

  it('falls back to false for flags the global config leaves unset', () => {
    rebuildWith({ hideUserStatus: true });

    expect(comp.effectiveHideUserStatus()).toBe(true);
    expect(comp.effectiveShowScrollbar()).toBe(false);
    expect(comp.effectiveHideError()).toBe(false);
  });

  it('lets an explicitly set input override the global config, even back to false', () => {
    rebuildWith({ hideUserStatus: true, showScrollbar: true, hideError: true });

    comp.hideUserStatus = false;
    comp.showScrollbar = false;
    comp.hideError = false;

    expect(comp.effectiveHideUserStatus()).toBe(false);
    expect(comp.effectiveShowScrollbar()).toBe(false);
    expect(comp.effectiveHideError()).toBe(false);
  });

  it('honours explicitly set inputs with no global config in play', () => {
    comp.hideUserStatus = true;
    comp.showScrollbar = true;
    comp.hideError = true;

    expect(comp.effectiveHideUserStatus()).toBe(true);
    expect(comp.effectiveShowScrollbar()).toBe(true);
    expect(comp.effectiveHideError()).toBe(true);
    expect(comp.hideUserStatus).toBe(true);
    expect(comp.showScrollbar).toBe(true);
    expect(comp.hideError).toBe(true);
  });

  it('reports no view at all when neither inputs nor service provide one', () => {
    templates.getUserTemplates.mockReturnValue({});
    templates.resolveTemplate.mockReturnValue(undefined);

    expect(comp.effectiveItemView).toBeUndefined();
    expect(comp.effectiveLeadingView).toBeUndefined();
    expect(comp.effectiveTitleView).toBeUndefined();
    expect(comp.effectiveSubtitleView).toBeUndefined();
    expect(comp.effectiveTrailingView).toBeUndefined();
    expect(comp.effectiveLoadingView).toBeUndefined();
    expect(comp.effectiveEmptyView).toBeUndefined();
    expect(comp.effectiveErrorView).toBeUndefined();
  });
});
