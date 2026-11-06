/**
 * CometChatMessageHeader — behaviour-level unit tests.
 *
 * The sibling spec drives this component against an SDK session. With no live
 * session the entity never arrives, every guard in the component takes its
 * early-return arm and the class body below `ngOnInit` is never reached. These
 * tests replace the data layer instead: `MessageHeaderService` and
 * `ChatStateService` are stubs whose signals the test writes to directly, so
 * the component can be put in any state its guards distinguish.
 *
 * Two things make that work:
 * - `MessageHeaderService` is declared in the component's own `providers`, so a
 *   module-level provider would be shadowed by the component injector. It has
 *   to be replaced with `TestBed.overrideComponent`.
 * - The real template pulls in the avatar, date, context-menu, call-button and
 *   error-boundary components, each with its own SDK appetite. The template is
 *   swapped for an inert stub and the component's methods are called directly.
 */

// The calls SDK reaches for JitsiMeetJS at import time, which jsdom lacks.
vi.mock('@cometchat/calls-sdk-javascript', () => ({
  CometChatCalls: {
    init: vi.fn().mockResolvedValue(true),
    generateToken: vi.fn().mockResolvedValue({ token: 'mock-token' }),
  },
}));

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { CometChat } from '@cometchat/chat-sdk-javascript';

import { CometChatMessageHeaderComponent } from './cometchat-message-header.component';
import { MessageHeaderService } from '../../services/message-header.service';
import { ChatStateService } from '../../services/chat-state.service';
import { COMETCHAT_GLOBAL_CONFIG, GlobalConfig } from '../../services/global-config.service';
import { CometChatUIEvents } from '../../events/CometChatUIEvents';
import { CometChatGroupEvents } from '../../events/CometChatGroupEvents';
import { CometChatUIKit } from '../../cometchat-uikit';
import { CometChatLocalize } from '../../resources/CometChatLocalize/cometchat-localize';
import { CometChatLogger } from '../../utils/CometChatLogger';
import { CometChatOption } from '../../modals';
import { PanelAlignment } from '../../Enums/Enums';

// ---------------------------------------------------------------------------
// Entity stubs — only the accessors the component actually reads.
// ---------------------------------------------------------------------------

interface UserOpts {
  name?: string;
  status?: string;
  avatar?: string;
  lastActiveAt?: number;
}

function makeUser(uid: string, opts: UserOpts = {}): CometChat.User {
  return {
    getUid: () => uid,
    getName: () => (opts.name === undefined ? uid : opts.name),
    getStatus: () => opts.status ?? 'offline',
    getAvatar: () => opts.avatar ?? '',
    getLastActiveAt: () => opts.lastActiveAt ?? 0,
  } as unknown as CometChat.User;
}

interface GroupStub {
  getGuid: () => string;
  getName: () => string;
  getIcon: () => string;
  getMembersCount: () => number;
  setMembersCount: ReturnType<typeof vi.fn>;
  setHasJoined: ReturnType<typeof vi.fn>;
  getOwner: () => string;
  setOwner: ReturnType<typeof vi.fn>;
}

function makeGroup(
  guid: string,
  opts: { name?: string; members?: number; owner?: string } = {}
): GroupStub & CometChat.Group {
  let members = opts.members ?? 4;
  let owner = opts.owner ?? 'original-owner';
  const stub: GroupStub = {
    getGuid: () => guid,
    getName: () => (opts.name === undefined ? guid : opts.name),
    getIcon: () => '',
    getMembersCount: () => members,
    setMembersCount: vi.fn((n: number) => {
      members = n;
    }),
    setHasJoined: vi.fn(),
    getOwner: () => owner,
    setOwner: vi.fn((o: string) => {
      owner = o;
    }),
  };
  return stub as unknown as GroupStub & CometChat.Group;
}

function makeTypingIndicator(sender: CometChat.User | null): CometChat.TypingIndicator {
  return { getSender: () => sender } as unknown as CometChat.TypingIndicator;
}

// ---------------------------------------------------------------------------
// Service stubs
// ---------------------------------------------------------------------------

function makeServiceMock() {
  const user = signal<CometChat.User | null>(null);
  const group = signal<CometChat.Group | null>(null);
  const userStatus = signal<string>('offline');
  const typingIndicator = signal<CometChat.TypingIndicator | null>(null);
  const typingUsers = signal<CometChat.User[]>([]);
  const groupMemberCount = signal<number>(0);
  const lastActiveAt = signal<number | null>(null);

  return {
    user,
    group,
    userStatus,
    typingIndicator,
    typingUsers,
    groupMemberCount,
    lastActiveAt,
    setUser: vi.fn((u: CometChat.User) => {
      user.set(u);
      group.set(null);
    }),
    setGroup: vi.fn((g: CometChat.Group) => {
      group.set(g);
      user.set(null);
    }),
    setupListeners: vi.fn(),
    cleanup: vi.fn(),
    setErrorCallback: vi.fn(),
    updateGroupMemberCount: vi.fn((n: number) => groupMemberCount.set(n)),
  };
}
type ServiceMock = ReturnType<typeof makeServiceMock>;

function makeChatStateMock() {
  return {
    activeUser: signal<CometChat.User | null>(null),
    activeGroup: signal<CometChat.Group | null>(null),
    activeConversation: signal<CometChat.Conversation | null>(null),
  };
}
type ChatStateMock = ReturnType<typeof makeChatStateMock>;

// ---------------------------------------------------------------------------
// Harness
// ---------------------------------------------------------------------------

describe('CometChatMessageHeaderComponent (behaviour)', () => {
  let fixture: ComponentFixture<CometChatMessageHeaderComponent>;
  let c: CometChatMessageHeaderComponent;
  let svc: ServiceMock;
  let chatState: ChatStateMock;
  const subs: Subscription[] = [];

  /** Collects everything a subject emits for the rest of the test. */
  function capture<T>(subject: Subject<T>): T[] {
    const bag: T[] = [];
    subs.push(subject.subscribe(v => bag.push(v)));
    return bag;
  }

  /** Collects everything the component's `error` output emits. */
  function captureErrors(): CometChat.CometChatException[] {
    const bag: CometChat.CometChatException[] = [];
    subs.push(c.error.subscribe(e => bag.push(e)));
    return bag;
  }

  /** Lets the component's `setTimeout(..., 0)` work items run. */
  const flushTimers = () => new Promise<void>(r => setTimeout(r, 0));

  interface BuildOpts {
    user?: CometChat.User;
    group?: CometChat.Group;
    globalConfig?: Partial<GlobalConfig>;
    inputs?: Record<string, unknown>;
    /** Run the first change detection, which is what invokes ngOnInit. */
    detect?: boolean;
  }

  async function build(opts: BuildOpts = {}): Promise<void> {
    svc = makeServiceMock();
    chatState = makeChatStateMock();

    TestBed.resetTestingModule();
    const providers: unknown[] = [{ provide: ChatStateService, useValue: chatState }];
    if (opts.globalConfig) {
      providers.push({ provide: COMETCHAT_GLOBAL_CONFIG, useValue: opts.globalConfig });
    }
    TestBed.configureTestingModule({
      imports: [CometChatMessageHeaderComponent],
      providers: providers as never[],
    });
    // The component declares MessageHeaderService in its own `providers`, so
    // only a component-level override reaches it.
    TestBed.overrideComponent(CometChatMessageHeaderComponent, {
      set: {
        template: '<div class="header-stub"></div>',
        styles: [],
        providers: [{ provide: MessageHeaderService, useValue: svc }],
      },
    });
    await TestBed.compileComponents();

    fixture = TestBed.createComponent(CometChatMessageHeaderComponent);
    c = fixture.componentInstance;

    // Inputs have to be in place before the first change detection.
    if (opts.user) c.user = opts.user;
    if (opts.group) c.group = opts.group;
    if (opts.inputs) Object.assign(c, opts.inputs);

    if (opts.detect) fixture.detectChanges();
  }

  /** A SimpleChanges entry, which only needs these four members here. */
  function change(previousValue: unknown, currentValue: unknown, firstChange = false) {
    return {
      previousValue,
      currentValue,
      firstChange,
      isFirstChange: () => firstChange,
    };
  }

  beforeEach(() => {
    // Identity translations keep the assertions below readable and stable.
    vi.spyOn(CometChatLocalize, 'getLocalizedString').mockImplementation((k: string) => k);
    vi.spyOn(CometChatLocalize, 'getTimePattern').mockReturnValue('hh:mm A');
    vi.spyOn(CometChatLocalize, 'getDatePattern').mockReturnValue('DD/MM/YYYY');
    vi.spyOn(CometChatLogger, 'error').mockImplementation(() => {});
    vi.spyOn(CometChatLogger, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    subs.forEach(s => s.unsubscribe());
    subs.length = 0;
    // The group/UI event subjects are static and shared; an undestroyed fixture
    // keeps answering events raised by later tests.
    fixture?.destroy();
    document.querySelectorAll('.cometchat-sr-only').forEach(n => n.remove());
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // =========================================================================
  // isUserConversation / isGroupConversation
  // =========================================================================

  describe('conversation kind', () => {
    it('tells a user conversation from a group one by which service signal is set', async () => {
      await build({ detect: false });

      // Neither flag is on before the service resolves an entity.
      expect(c.isUserConversation()).toBe(false);
      expect(c.isGroupConversation()).toBe(false);

      svc.user.set(makeUser('u9'));
      expect(c.isUserConversation()).toBe(true);
      expect(c.isGroupConversation()).toBe(false);

      // setUser/setGroup are mutually exclusive, so a group clears the user.
      svc.setGroup(makeGroup('g9'));
      expect(c.isGroupConversation()).toBe(true);
      expect(c.isUserConversation()).toBe(false);
    });
  });

  // =========================================================================
  // ngOnInit / initializeService
  // =========================================================================

  describe('ngOnInit', () => {
    it('adopts a user input and stops listening to chat state', async () => {
      const input = makeUser('input-user');
      const fromState = makeUser('state-user');
      await build({ user: input, detect: false });

      chatState.activeUser.set(fromState);
      fixture.detectChanges();

      expect((c as never as { currentUser: () => unknown }).currentUser()).toBe(input);
      expect((c as never as { currentGroup: () => unknown }).currentGroup()).toBeNull();
      expect(svc.setUser).not.toHaveBeenCalledWith(fromState);
    });

    it('adopts a group input and sets up group listeners', async () => {
      const group = makeGroup('g1');
      await build({ group, detect: true });

      expect(svc.setGroup).toHaveBeenCalledWith(group);
      expect(svc.setupListeners).toHaveBeenCalledWith('g1', 'group');
      expect((c as never as { currentGroup: () => unknown }).currentGroup()).toBe(group);
      expect((c as never as { currentUser: () => unknown }).currentUser()).toBeNull();
    });

    it('gives the user precedence over the group and says so', async () => {
      const user = makeUser('u1');
      const group = makeGroup('g1');
      await build({ user, group, detect: true });

      expect(CometChatLogger.warn).toHaveBeenCalledWith(
        'CometChatMessageHeader',
        'Both user and group provided; user takes precedence.'
      );
      expect(svc.setUser).toHaveBeenCalledWith(user);
      expect(svc.setGroup).not.toHaveBeenCalled();
    });

    it('emits an error and skips listeners when the user input has no uid', async () => {
      await build({ user: makeUser(''), detect: false });
      const errors = captureErrors();

      c.ngOnInit();

      expect(errors).toHaveLength(1);
      expect(errors[0].message).toBe('Invalid user: missing UID');
      expect(svc.setupListeners).not.toHaveBeenCalled();
    });

    it('emits an error and skips listeners when the group input has no guid', async () => {
      await build({ group: makeGroup(''), detect: false });
      const errors = captureErrors();

      c.ngOnInit();

      expect(errors).toHaveLength(1);
      expect(errors[0].message).toBe('Invalid group: missing GUID');
      expect(svc.setupListeners).not.toHaveBeenCalled();
    });

    it('does nothing if service setup is reached with neither entity set', async () => {
      // Both call sites guard on user/group, so this arm is only reachable
      // directly — but it is what stops `this.user.getUid()` from throwing if a
      // future caller forgets the guard.
      await build({ detect: false });

      (c as never as { initializeService: () => void }).initializeService();

      expect(svc.setUser).not.toHaveBeenCalled();
      expect(svc.setGroup).not.toHaveBeenCalled();
      expect(svc.setupListeners).not.toHaveBeenCalled();
    });

    it('stays in chat-state mode when neither input is given', async () => {
      await build({ detect: false });

      c.ngOnInit();

      expect((c as never as { propsProvided: () => boolean }).propsProvided()).toBe(false);
      expect(svc.setUser).not.toHaveBeenCalled();
      expect(svc.setGroup).not.toHaveBeenCalled();
    });

    it('wraps a non-Error thrown during init before emitting it', async () => {
      await build({ detect: false });
      svc.setErrorCallback.mockImplementation(() => {
        throw 'string failure';
      });
      const errors = captureErrors();

      c.ngOnInit();

      expect(errors[0]).toBeInstanceOf(Error);
      expect(errors[0].message).toBe('string failure');
      expect(CometChatLogger.error).toHaveBeenCalledWith(
        'CometChatMessageHeader',
        'Error in ngOnInit:',
        errors[0]
      );
    });

    it('forwards an error raised by the service to the error output', async () => {
      await build({ user: makeUser('u1'), detect: true });
      const errors = captureErrors();
      const callback = (svc.setErrorCallback.mock.calls[0] as unknown[])[0] as (
        e: CometChat.CometChatException
      ) => void;
      const exception = new CometChat.CometChatException({ code: 'ERR_X', message: 'from sdk' });

      callback(exception);

      expect(errors).toEqual([exception]);
    });
  });

  // =========================================================================
  // Chat-state driven adoption (constructor effect)
  // =========================================================================

  describe('chat state adoption', () => {
    it('adopts the active user from chat state when no input was given', async () => {
      const user = makeUser('state-user');
      await build({ detect: false });

      chatState.activeUser.set(user);
      fixture.detectChanges();

      expect((c as never as { currentUser: () => unknown }).currentUser()).toBe(user);
      expect(svc.setUser).toHaveBeenCalledWith(user);
      expect(svc.setupListeners).toHaveBeenCalledWith('state-user', 'user');
    });

    it('adopts the active group from chat state when no input was given', async () => {
      const group = makeGroup('state-group');
      await build({ detect: false });

      chatState.activeGroup.set(group);
      fixture.detectChanges();

      expect((c as never as { currentGroup: () => unknown }).currentGroup()).toBe(group);
      expect(svc.setGroup).toHaveBeenCalledWith(group);
      expect(svc.setupListeners).toHaveBeenCalledWith('state-group', 'group');
    });

    it('skips listener setup for an active user with a blank uid', async () => {
      await build({ detect: false });

      chatState.activeUser.set(makeUser(''));
      fixture.detectChanges();

      expect(svc.setUser).toHaveBeenCalled();
      expect(svc.setupListeners).not.toHaveBeenCalled();
    });

    it('skips listener setup for an active user object with no uid accessor', async () => {
      await build({ detect: false });

      chatState.activeUser.set({} as CometChat.User);
      fixture.detectChanges();

      expect(svc.setUser).toHaveBeenCalled();
      expect(svc.setupListeners).not.toHaveBeenCalled();
    });

    it('skips listener setup for an active group with a blank guid', async () => {
      await build({ detect: false });

      chatState.activeGroup.set(makeGroup(''));
      fixture.detectChanges();

      expect(svc.setGroup).toHaveBeenCalled();
      expect(svc.setupListeners).not.toHaveBeenCalled();
    });

    it('skips listener setup for an active group object with no guid accessor', async () => {
      await build({ detect: false });

      chatState.activeGroup.set({} as CometChat.Group);
      fixture.detectChanges();

      expect(svc.setGroup).toHaveBeenCalled();
      expect(svc.setupListeners).not.toHaveBeenCalled();
    });

    it('cleans up when chat state holds neither a user nor a group', async () => {
      await build({ detect: true });

      expect(svc.cleanup).toHaveBeenCalled();
      expect(svc.setUser).not.toHaveBeenCalled();
      expect(svc.setGroup).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // ngOnChanges
  // =========================================================================

  describe('ngOnChanges — user', () => {
    it('re-points the service at a different user', async () => {
      const previous = makeUser('u1');
      const next = makeUser('u2');
      await build({ user: previous, detect: true });
      svc.setupListeners.mockClear();

      c.user = next;
      c.ngOnChanges({ user: change(previous, next) } as never);

      expect(svc.setUser).toHaveBeenLastCalledWith(next);
      expect(svc.setupListeners).toHaveBeenCalledWith('u2', 'user');
      expect((c as never as { currentUser: () => unknown }).currentUser()).toBe(next);
      expect((c as never as { currentGroup: () => unknown }).currentGroup()).toBeNull();
    });

    it('refreshes the same user without re-registering listeners', async () => {
      const previous = makeUser('u1');
      const refreshed = makeUser('u1', { name: 'Renamed' });
      await build({ user: previous, detect: true });
      svc.setupListeners.mockClear();

      c.user = refreshed;
      c.ngOnChanges({ user: change(previous, refreshed) } as never);

      expect(svc.setUser).toHaveBeenLastCalledWith(refreshed);
      expect(svc.setupListeners).not.toHaveBeenCalled();
      expect((c as never as { currentUser: () => unknown }).currentUser()).toBe(refreshed);
    });

    it('tears down when the user input is removed', async () => {
      const previous = makeUser('u1');
      await build({ user: previous, detect: true });
      svc.cleanup.mockClear();
      svc.setErrorCallback.mockClear();

      c.user = undefined;
      c.ngOnChanges({ user: change(previous, undefined) } as never);

      expect(svc.cleanup).toHaveBeenCalledTimes(1);
      expect(svc.setErrorCallback).toHaveBeenCalledTimes(1);
      expect((c as never as { currentUser: () => unknown }).currentUser()).toBeNull();
    });

    it('does nothing when the user input goes from absent to absent', async () => {
      await build({ detect: false });
      svc.cleanup.mockClear();

      c.ngOnChanges({ user: change(undefined, undefined) } as never);

      expect(svc.cleanup).not.toHaveBeenCalled();
    });

    it('emits a COMPONENT_ERROR exception when the new user has no uid', async () => {
      await build({ detect: false });
      const errors = captureErrors();

      c.user = makeUser('');
      c.ngOnChanges({ user: change(makeUser('u1'), c.user) } as never);

      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe('COMPONENT_ERROR');
      expect(errors[0].message).toBe('Invalid user: missing UID');
      expect(svc.setUser).not.toHaveBeenCalled();
    });

    it('ignores the first change, which ngOnInit already handled', async () => {
      const user = makeUser('u1');
      await build({ user, detect: true });
      svc.setUser.mockClear();

      c.ngOnChanges({ user: change(undefined, user, true) } as never);

      expect(svc.setUser).not.toHaveBeenCalled();
    });

    it('ignores a change set that touches neither user nor group', async () => {
      await build({ user: makeUser('u1'), detect: true });
      svc.setUser.mockClear();

      c.ngOnChanges({ showBackButton: change(false, true) } as never);

      expect(svc.setUser).not.toHaveBeenCalled();
    });

    it('logs an Error raised while applying a change instead of rethrowing', async () => {
      const previous = makeUser('u1');
      await build({ user: previous, detect: true });
      const failure = new Error('service unavailable');
      svc.setUser.mockImplementation(() => {
        throw failure;
      });

      c.user = makeUser('u2');
      c.ngOnChanges({ user: change(previous, c.user) } as never);

      expect(CometChatLogger.error).toHaveBeenCalledWith(
        'CometChatMessageHeader',
        'Error in ngOnChanges:',
        failure
      );
    });

    it('wraps a non-Error raised while applying a change', async () => {
      const previous = makeUser('u1');
      await build({ user: previous, detect: true });
      svc.setUser.mockImplementation(() => {
        throw 'plain string';
      });

      c.user = makeUser('u2');
      c.ngOnChanges({ user: change(previous, c.user) } as never);

      const call = (CometChatLogger.error as unknown as { mock: { calls: unknown[][] } }).mock.calls
        .filter(args => args[1] === 'Error in ngOnChanges:')
        .pop();
      expect(call).toBeDefined();
      expect(call![2]).toBeInstanceOf(Error);
      expect((call![2] as Error).message).toBe('plain string');
    });
  });

  describe('ngOnChanges — group', () => {
    it('re-points the service at a different group', async () => {
      const previous = makeGroup('g1');
      const next = makeGroup('g2');
      await build({ group: previous, detect: true });
      svc.setupListeners.mockClear();

      c.group = next;
      c.ngOnChanges({ group: change(previous, next) } as never);

      expect(svc.setGroup).toHaveBeenLastCalledWith(next);
      expect(svc.setupListeners).toHaveBeenCalledWith('g2', 'group');
      expect((c as never as { currentGroup: () => unknown }).currentGroup()).toBe(next);
      expect((c as never as { currentUser: () => unknown }).currentUser()).toBeNull();
    });

    it('refreshes the same group without re-registering listeners', async () => {
      const previous = makeGroup('g1');
      const refreshed = makeGroup('g1', { name: 'Renamed' });
      await build({ group: previous, detect: true });
      svc.setupListeners.mockClear();

      c.group = refreshed;
      c.ngOnChanges({ group: change(previous, refreshed) } as never);

      expect(svc.setGroup).toHaveBeenLastCalledWith(refreshed);
      expect(svc.setupListeners).not.toHaveBeenCalled();
      expect((c as never as { currentGroup: () => unknown }).currentGroup()).toBe(refreshed);
    });

    it('tears down when the group input is removed', async () => {
      const previous = makeGroup('g1');
      await build({ group: previous, detect: true });
      svc.cleanup.mockClear();
      svc.setErrorCallback.mockClear();

      c.group = undefined;
      c.ngOnChanges({ group: change(previous, undefined) } as never);

      expect(svc.cleanup).toHaveBeenCalledTimes(1);
      expect(svc.setErrorCallback).toHaveBeenCalledTimes(1);
      expect((c as never as { currentGroup: () => unknown }).currentGroup()).toBeNull();
    });

    it('does nothing when the group input goes from absent to absent', async () => {
      await build({ detect: false });
      svc.cleanup.mockClear();

      c.ngOnChanges({ group: change(undefined, undefined) } as never);

      expect(svc.cleanup).not.toHaveBeenCalled();
    });

    it('emits a COMPONENT_ERROR exception when the new group has no guid', async () => {
      await build({ detect: false });
      const errors = captureErrors();

      c.group = makeGroup('');
      c.ngOnChanges({ group: change(makeGroup('g1'), c.group) } as never);

      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe('COMPONENT_ERROR');
      expect(errors[0].message).toBe('Invalid group: missing GUID');
      expect(svc.setGroup).not.toHaveBeenCalled();
    });

    it('ignores the first group change', async () => {
      const group = makeGroup('g1');
      await build({ group, detect: true });
      svc.setGroup.mockClear();

      c.ngOnChanges({ group: change(undefined, group, true) } as never);

      expect(svc.setGroup).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // ngOnDestroy
  // =========================================================================

  describe('ngOnDestroy', () => {
    it('cancels the pending announcement timer so it cannot fire after teardown', async () => {
      await build({ detect: false });
      vi.useFakeTimers();

      (c as never as { announceStatusChange: (s: string) => void }).announceStatusChange('online');
      const node = document.querySelector('.cometchat-sr-only');
      expect(node).not.toBeNull();
      expect((c as never as { pendingTimers: unknown[] }).pendingTimers).toHaveLength(1);

      c.ngOnDestroy();

      expect((c as never as { pendingTimers: unknown[] }).pendingTimers).toHaveLength(0);
      vi.advanceTimersByTime(5000);
      // The removal timer was cancelled, so the node is still attached.
      expect(document.body.contains(node!)).toBe(true);
      expect(svc.cleanup).toHaveBeenCalled();
    });

    it('lets the announcement timer remove its node when the view survives', async () => {
      await build({ detect: false });
      vi.useFakeTimers();

      (c as never as { announceStatusChange: (s: string) => void }).announceStatusChange('offline');
      const node = document.querySelector('.cometchat-sr-only');
      expect(node).not.toBeNull();

      vi.advanceTimersByTime(1000);

      expect(document.body.contains(node!)).toBe(false);
    });

    it('logs an Error raised by service cleanup instead of rethrowing', async () => {
      await build({ detect: false });
      const failure = new Error('cleanup exploded');
      svc.cleanup.mockImplementation(() => {
        throw failure;
      });

      expect(() => c.ngOnDestroy()).not.toThrow();

      expect(CometChatLogger.error).toHaveBeenCalledWith(
        'CometChatMessageHeader',
        'Error in ngOnDestroy:',
        failure
      );
    });

    it('wraps a non-Error raised by service cleanup', async () => {
      await build({ detect: false });
      svc.cleanup.mockImplementation(() => {
        throw 42;
      });

      c.ngOnDestroy();

      const call = (CometChatLogger.error as unknown as { mock: { calls: unknown[][] } }).mock.calls
        .filter(args => args[1] === 'Error in ngOnDestroy:')
        .pop();
      expect(call).toBeDefined();
      expect(call![2]).toBeInstanceOf(Error);
      expect((call![2] as Error).message).toBe('42');
    });
  });

  // =========================================================================
  // emitError
  // =========================================================================

  describe('error translation', () => {
    function emit(value: unknown): CometChat.CometChatException[] {
      const errors = captureErrors();
      (c as never as { emitError: (e: unknown) => void }).emitError(value);
      return errors;
    }

    it('passes a CometChatException through untouched', async () => {
      await build({ detect: false });
      const exception = new CometChat.CometChatException({ code: 'SDK_CODE', message: 'sdk said' });

      const errors = emit(exception);

      expect(errors).toEqual([exception]);
    });

    it('wraps an Error as COMPONENT_ERROR and keeps its stack as details', async () => {
      await build({ detect: false });
      const failure = new Error('component broke');
      failure.stack = 'STACK-LINE';

      const errors = emit(failure);

      expect(errors[0].code).toBe('COMPONENT_ERROR');
      expect(errors[0].message).toBe('component broke');
      expect(errors[0].details).toBe('STACK-LINE');
    });

    it('falls back to empty details when the Error carries no stack', async () => {
      await build({ detect: false });
      const failure = new Error('stackless');
      failure.stack = undefined;

      const errors = emit(failure);

      expect(errors[0].code).toBe('COMPONENT_ERROR');
      expect(errors[0].message).toBe('stackless');
      // The component passes '' for a missing stack; the SDK's exception model
      // keeps only truthy fields, so nothing lands on `details`.
      expect(errors[0].details).toBeUndefined();
    });

    it('wraps a thrown non-Error as UNKNOWN_ERROR', async () => {
      await build({ detect: false });

      const errors = emit({ toString: () => 'weird value' });

      expect(errors[0].code).toBe('UNKNOWN_ERROR');
      expect(errors[0].message).toBe('weird value');
      expect(errors[0].details).toBeUndefined();
    });
  });

  // =========================================================================
  // Back button, item and keyboard handling
  // =========================================================================

  describe('back button', () => {
    it('emits backClick on click', async () => {
      await build({ detect: false });
      const seen: unknown[] = [];
      subs.push(c.backClick.subscribe(() => seen.push('back')));

      c.handleBackClick();

      expect(seen).toEqual(['back']);
    });

    it.each([['Enter'], [' ']])('activates the back button on %s and suppresses scrolling', async key => {
      await build({ detect: false });
      const seen: unknown[] = [];
      subs.push(c.backClick.subscribe(() => seen.push(key)));
      const event = { key, preventDefault: vi.fn() } as unknown as KeyboardEvent;

      c.handleBackKeydown(event);

      expect(seen).toEqual([key]);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('ignores other keys on the back button', async () => {
      await build({ detect: false });
      const seen: unknown[] = [];
      subs.push(c.backClick.subscribe(() => seen.push('back')));
      const event = { key: 'a', preventDefault: vi.fn() } as unknown as KeyboardEvent;

      c.handleBackKeydown(event);

      expect(seen).toEqual([]);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('reads showBackButton once and then caches it', async () => {
      await build({ detect: false });

      expect(c.shouldShowBackButton()).toBe(false);

      // `shouldShowBackButton` is a computed() over a plain field, so it has no
      // signal producer to invalidate it. The first read is memoised for the
      // lifetime of the component and a later input change is not picked up.
      c.showBackButton = true;
      expect(c.shouldShowBackButton()).toBe(false);
    });

    it('shows the back button when the input is set before the first read', async () => {
      await build({ inputs: { showBackButton: true }, detect: false });

      expect(c.shouldShowBackButton()).toBe(true);
    });
  });

  describe('item activation', () => {
    it('emits the open user on item click', async () => {
      const user = makeUser('u1');
      await build({ user, detect: true });
      const seen: unknown[] = [];
      subs.push(c.itemClick.subscribe(v => seen.push(v)));

      c.handleItemClick();

      expect(seen).toEqual([user]);
    });

    it('emits the open group on item click', async () => {
      const group = makeGroup('g1');
      await build({ group, detect: true });
      const seen: unknown[] = [];
      subs.push(c.itemClick.subscribe(v => seen.push(v)));

      c.handleItemClick();

      expect(seen).toEqual([group]);
    });

    it('emits nothing on item click when no conversation is open', async () => {
      await build({ detect: false });
      const seen: unknown[] = [];
      subs.push(c.itemClick.subscribe(v => seen.push(v)));

      c.handleItemClick();

      expect(seen).toEqual([]);
    });

    it.each([['Enter'], [' ']])('activates the item on %s', async key => {
      const user = makeUser('u1');
      await build({ user, detect: true });
      const seen: unknown[] = [];
      subs.push(c.itemClick.subscribe(v => seen.push(v)));
      const event = { key, preventDefault: vi.fn() } as unknown as KeyboardEvent;

      c.handleItemKeydown(event);

      expect(seen).toEqual([user]);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('ignores other keys on the item', async () => {
      await build({ user: makeUser('u1'), detect: true });
      const seen: unknown[] = [];
      subs.push(c.itemClick.subscribe(v => seen.push(v)));
      const event = { key: 'Tab', preventDefault: vi.fn() } as unknown as KeyboardEvent;

      c.handleItemKeydown(event);

      expect(seen).toEqual([]);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // Overflow menu
  // =========================================================================

  describe('overflow menu', () => {
    it('stays inline for a single eligible action', async () => {
      await build({ inputs: { showSearchOption: true }, detect: false });

      expect(c.shouldShowOverflowMenu()).toBe(false);
    });

    it('collapses two eligible actions into the menu', async () => {
      await build({
        inputs: { showSearchOption: true, showConversationSummaryButton: true },
        detect: false,
      });

      expect(c.shouldShowOverflowMenu()).toBe(true);
    });

    it('stays inline when no action is enabled', async () => {
      await build({ detect: false });

      expect(c.shouldShowOverflowMenu()).toBe(false);
      expect(c.getOverflowMenuOptions()).toEqual([]);
    });

    it('builds one option per enabled action, in order', async () => {
      await build({
        inputs: {
          showSearchOption: true,
          showConversationSummaryButton: true,
          showPinnedMessagesOption: true,
        },
        detect: false,
      });

      const options = c.getOverflowMenuOptions();

      expect(options.map(o => o.id)).toEqual(['search', 'summary', 'pinnedMessages']);
      expect(options.map(o => o.title)).toEqual([
        'search_title',
        'ai_conversation_summary_title',
        'pinned_messages_menu',
      ]);
      expect(options.map(o => o.iconURL)).toEqual([
        'assets/search.svg',
        'assets/ai_conversation_summary.svg',
        'assets/keep.svg',
      ]);
    });

    it('wires the search option to the searchClick output', async () => {
      await build({ inputs: { showSearchOption: true }, detect: false });
      const seen: unknown[] = [];
      subs.push(c.searchClick.subscribe(() => seen.push('search')));

      c.getOverflowMenuOptions()[0].onClick!();

      expect(seen).toEqual(['search']);
    });

    it('wires the summary option to the summary panel', async () => {
      const panels = capture(CometChatUIEvents.ccShowPanel);
      await build({
        user: makeUser('u1'),
        inputs: { showConversationSummaryButton: true },
        detect: true,
      });

      c.getOverflowMenuOptions()[0].onClick!();

      expect(panels).toHaveLength(1);
    });

    it('wires the pinned option to the pinnedMessagesClick output', async () => {
      await build({ inputs: { showPinnedMessagesOption: true }, detect: false });
      const seen: unknown[] = [];
      subs.push(c.pinnedMessagesClick.subscribe(() => seen.push('pinned')));

      c.getOverflowMenuOptions()[0].onClick!();

      expect(seen).toEqual(['pinned']);
    });

    it('runs the handler of a real CometChatOption', async () => {
      await build({ detect: false });
      const onClick = vi.fn();

      c.handleOverflowMenuOptionClick(new CometChatOption({ id: 'x', onClick }) as never);

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('tolerates a CometChatOption with no handler', async () => {
      await build({ detect: false });

      expect(() =>
        c.handleOverflowMenuOptionClick(new CometChatOption({ id: 'x' }) as never)
      ).not.toThrow();
    });

    it('refuses to run a handler on an object that is not a CometChatOption', async () => {
      await build({ detect: false });
      const onClick = vi.fn();

      c.handleOverflowMenuOptionClick({ id: 'x', onClick } as never);

      expect(onClick).not.toHaveBeenCalled();
    });

    it('tracks the menu open state', async () => {
      await build({ detect: false });

      c.handleOverflowMenuStateChange(true);
      expect(c.isOverflowMenuOpen).toBe(true);

      c.handleOverflowMenuStateChange(false);
      expect(c.isOverflowMenuOpen).toBe(false);
    });

    it('closes the open menu on Escape and swallows the key', async () => {
      await build({ detect: false });
      c.isOverflowMenuOpen = true;
      const event = { preventDefault: vi.fn() } as unknown as Event;

      c.handleEscapeKey(event);

      expect(c.isOverflowMenuOpen).toBe(false);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('leaves Escape alone when the menu is already closed', async () => {
      await build({ detect: false });
      const event = { preventDefault: vi.fn() } as unknown as Event;

      c.handleEscapeKey(event);

      expect(event.preventDefault).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // Conversation summary
  // =========================================================================

  describe('conversation summary', () => {
    it('opens a footer panel that can fetch the summary and close itself', async () => {
      const panels = capture(CometChatUIEvents.ccShowPanel);
      const hidden = capture(CometChatUIEvents.ccHidePanel);
      const fetch = vi
        .spyOn(CometChat, 'getConversationSummary')
        .mockResolvedValue('the summary' as never);
      await build({
        user: makeUser('u1'),
        inputs: { summaryGenerationMessageCount: 42 },
        detect: true,
      });
      const clicks: { messageCount: number }[] = [];
      subs.push(c.conversationSummaryClick.subscribe(v => clicks.push(v)));

      c.handleSummaryClick();

      expect(panels).toHaveLength(1);
      expect(panels[0].position).toBe(PanelAlignment.messageListFooter);
      const configuration = panels[0].configuration as {
        getConversationSummary: () => Promise<string>;
        closeCallback: () => void;
      };

      await expect(configuration.getConversationSummary()).resolves.toBe('the summary');
      expect(fetch).toHaveBeenCalledWith('u1', 'user', { lastNMessages: 42 });

      configuration.closeCallback();
      expect(hidden).toEqual([PanelAlignment.messageListFooter]);
      expect(clicks).toEqual([{ messageCount: 42 }]);
    });

    it('asks for a group summary with the group receiver type', async () => {
      const panels = capture(CometChatUIEvents.ccShowPanel);
      const fetch = vi
        .spyOn(CometChat, 'getConversationSummary')
        .mockResolvedValue('group summary' as never);
      await build({ group: makeGroup('g1'), detect: true });

      c.handleSummaryClick();
      await (
        panels[0].configuration as { getConversationSummary: () => Promise<string> }
      ).getConversationSummary();

      expect(fetch).toHaveBeenCalledWith('g1', 'group', { lastNMessages: 1000 });
    });

    it('refuses to summarise when no conversation is open', async () => {
      const panels = capture(CometChatUIEvents.ccShowPanel);
      await build({ detect: false });
      const errors = captureErrors();

      c.handleSummaryClick();

      expect(panels).toEqual([]);
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toBe('Cannot generate summary: No user or group configured');
      expect(CometChatLogger.warn).toHaveBeenCalledWith(
        'CometChatMessageHeader',
        'Cannot generate summary: No user or group configured'
      );
    });

    it('reports a panel failure through the error output', async () => {
      vi.spyOn(CometChatUIEvents.ccShowPanel, 'next').mockImplementation(() => {
        throw new Error('panel refused');
      });
      await build({ user: makeUser('u1'), detect: true });
      const errors = captureErrors();

      c.handleSummaryClick();

      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe('COMPONENT_ERROR');
      expect(errors[0].message).toBe('panel refused');
      expect(CometChatLogger.error).toHaveBeenCalledWith(
        'CometChatMessageHeader',
        'Error triggering summary generation:',
        expect.any(Error)
      );
    });
  });

  // =========================================================================
  // Automatic summary generation
  // =========================================================================

  describe('automatic summary generation', () => {
    it('summarises immediately when a conversation is already open', async () => {
      const panels = capture(CometChatUIEvents.ccShowPanel);
      await build({
        user: makeUser('u1'),
        inputs: { enableAutoSummaryGeneration: true },
        detect: true,
      });

      await flushTimers();

      expect(panels).toHaveLength(1);
    });

    it('stays quiet when automatic generation is off', async () => {
      const panels = capture(CometChatUIEvents.ccShowPanel);
      await build({ user: makeUser('u1'), detect: true });

      CometChatUIEvents.ccActiveChatChanged.next({ unreadMessageCount: 50 } as never);
      await flushTimers();

      expect(panels).toEqual([]);
    });

    // The trigger threshold is the literal 15 in `handleAutoSummaryGeneration`.
    // `summaryGenerationMessageCount` does not govern it — that input only
    // becomes `lastNMessages` on the summary request — so the cases below pin
    // 15 rather than the input, and one of them sets the input away from it.
    it('summarises once the unread backlog reaches 15', async () => {
      const panels = capture(CometChatUIEvents.ccShowPanel);
      await build({
        user: makeUser('u1'),
        inputs: { enableAutoSummaryGeneration: true, summaryGenerationMessageCount: 500 },
        detect: true,
      });
      await flushTimers();
      panels.length = 0;

      CometChatUIEvents.ccActiveChatChanged.next({ unreadMessageCount: 15 } as never);
      await flushTimers();

      expect(panels).toHaveLength(1);
      expect((c as never as { unreadMessageCount: number }).unreadMessageCount).toBe(15);
    });

    it('stays quiet at 14 unread, one short of the threshold', async () => {
      const panels = capture(CometChatUIEvents.ccShowPanel);
      await build({
        user: makeUser('u1'),
        inputs: { enableAutoSummaryGeneration: true },
        detect: true,
      });
      await flushTimers();
      panels.length = 0;

      CometChatUIEvents.ccActiveChatChanged.next({ unreadMessageCount: 14 } as never);
      await flushTimers();

      expect(panels).toEqual([]);
      expect((c as never as { unreadMessageCount: number }).unreadMessageCount).toBe(14);
    });

    it('treats a missing unread count as zero', async () => {
      const panels = capture(CometChatUIEvents.ccShowPanel);
      await build({
        user: makeUser('u1'),
        inputs: { enableAutoSummaryGeneration: true },
        detect: true,
      });
      await flushTimers();
      panels.length = 0;

      CometChatUIEvents.ccActiveChatChanged.next({} as never);
      await flushTimers();

      expect(panels).toEqual([]);
      expect((c as never as { unreadMessageCount: number }).unreadMessageCount).toBe(0);
    });

    it('ignores a large unread backlog while no conversation is open', async () => {
      const panels = capture(CometChatUIEvents.ccShowPanel);
      await build({ inputs: { enableAutoSummaryGeneration: true }, detect: true });
      await flushTimers();

      CometChatUIEvents.ccActiveChatChanged.next({ unreadMessageCount: 99 } as never);
      await flushTimers();

      expect(panels).toEqual([]);
    });

    it('summarises once, and only once, when the conversation arrives later', async () => {
      const panels = capture(CometChatUIEvents.ccShowPanel);
      await build({ inputs: { enableAutoSummaryGeneration: true }, detect: true });
      await flushTimers();
      expect(panels).toEqual([]);

      chatState.activeUser.set(makeUser('late-user'));
      fixture.detectChanges();
      await flushTimers();
      expect(panels).toHaveLength(1);

      chatState.activeUser.set(makeUser('another-user'));
      fixture.detectChanges();
      await flushTimers();
      expect(panels).toHaveLength(1);
    });

    it('reports a failure of the immediate automatic summary', async () => {
      vi.spyOn(CometChatUIEvents.ccShowPanel, 'next').mockImplementation(() => {
        throw new Error('auto panel refused');
      });
      await build({
        user: makeUser('u1'),
        inputs: { enableAutoSummaryGeneration: true },
        detect: false,
      });
      const errors = captureErrors();
      fixture.detectChanges();

      await flushTimers();

      expect(errors).toHaveLength(1);
      expect(errors[0].message).toBe('auto panel refused');
      expect(CometChatLogger.error).toHaveBeenCalledWith(
        'CometChatMessageHeader',
        'Error during auto-summary generation:',
        expect.any(Error)
      );
    });

    it('reports a failure of the backlog-triggered automatic summary', async () => {
      await build({
        user: makeUser('u1'),
        inputs: { enableAutoSummaryGeneration: true },
        detect: true,
      });
      await flushTimers();
      const errors = captureErrors();
      vi.spyOn(CometChatUIEvents.ccShowPanel, 'next').mockImplementation(() => {
        throw new Error('backlog panel refused');
      });

      CometChatUIEvents.ccActiveChatChanged.next({ unreadMessageCount: 20 } as never);
      await flushTimers();

      expect(errors).toHaveLength(1);
      expect(errors[0].message).toBe('backlog panel refused');
    });

    it('reports a failure of the deferred automatic summary', async () => {
      await build({ inputs: { enableAutoSummaryGeneration: true }, detect: true });
      await flushTimers();
      const errors = captureErrors();
      vi.spyOn(CometChatUIEvents.ccShowPanel, 'next').mockImplementation(() => {
        throw new Error('deferred panel refused');
      });

      chatState.activeUser.set(makeUser('late-user'));
      fixture.detectChanges();
      await flushTimers();

      expect(errors).toHaveLength(1);
      expect(errors[0].message).toBe('deferred panel refused');
    });
  });

  // =========================================================================
  // Group events
  // =========================================================================

  describe('group events', () => {
    const loggedInUid = 'me';

    function asLoggedIn(uid: string | null) {
      vi.spyOn(CometChatUIKit, 'getLoggedInUser').mockReturnValue(
        uid === null ? null : makeUser(uid)
      );
    }

    it('tracks membership and count when the logged-in user is the subject', async () => {
      asLoggedIn(loggedInUid);
      const group = makeGroup('g1');
      await build({ group, detect: true });
      const me = makeUser(loggedInUid);

      CometChatGroupEvents.ccGroupMemberAdded.next({
        usersAdded: [me],
        userAddedIn: makeGroup('g1', { members: 10 }),
      } as never);
      expect(group.setHasJoined).toHaveBeenLastCalledWith(true);
      expect(group.setMembersCount).toHaveBeenLastCalledWith(10);
      expect(svc.updateGroupMemberCount).toHaveBeenLastCalledWith(10);

      CometChatGroupEvents.ccGroupMemberJoined.next({
        joinedUser: me,
        joinedGroup: makeGroup('g1', { members: 11 }),
      } as never);
      expect(group.setHasJoined).toHaveBeenLastCalledWith(true);
      expect(svc.updateGroupMemberCount).toHaveBeenLastCalledWith(11);

      CometChatGroupEvents.ccGroupMemberBanned.next({
        kickedUser: me,
        kickedFrom: makeGroup('g1', { members: 9 }),
      } as never);
      expect(group.setHasJoined).toHaveBeenLastCalledWith(false);
      expect(svc.updateGroupMemberCount).toHaveBeenLastCalledWith(9);

      CometChatGroupEvents.ccGroupMemberKicked.next({
        kickedUser: me,
        kickedFrom: makeGroup('g1', { members: 8 }),
      } as never);
      expect(group.setHasJoined).toHaveBeenLastCalledWith(false);
      expect(svc.updateGroupMemberCount).toHaveBeenLastCalledWith(8);

      CometChatGroupEvents.ccGroupLeft.next({
        userLeft: me,
        leftGroup: makeGroup('g1', { members: 7 }),
      } as never);
      expect(group.setHasJoined).toHaveBeenLastCalledWith(false);
      expect(svc.updateGroupMemberCount).toHaveBeenLastCalledWith(7);

      CometChatGroupEvents.ccOwnershipChanged.next({
        group: makeGroup('g1', { owner: 'new-owner' }),
      } as never);
      expect(group.setOwner).toHaveBeenCalledWith('new-owner');
    });

    it('updates only the count when someone else is the subject', async () => {
      asLoggedIn(loggedInUid);
      const group = makeGroup('g1');
      await build({ group, detect: true });
      const other = makeUser('someone-else');

      CometChatGroupEvents.ccGroupMemberAdded.next({
        usersAdded: [other],
        userAddedIn: makeGroup('g1', { members: 20 }),
      } as never);
      CometChatGroupEvents.ccGroupMemberJoined.next({
        joinedUser: other,
        joinedGroup: makeGroup('g1', { members: 21 }),
      } as never);
      CometChatGroupEvents.ccGroupMemberBanned.next({
        kickedUser: other,
        kickedFrom: makeGroup('g1', { members: 19 }),
      } as never);
      CometChatGroupEvents.ccGroupMemberKicked.next({
        kickedUser: other,
        kickedFrom: makeGroup('g1', { members: 18 }),
      } as never);
      CometChatGroupEvents.ccGroupLeft.next({
        userLeft: other,
        leftGroup: makeGroup('g1', { members: 17 }),
      } as never);

      expect(group.setHasJoined).not.toHaveBeenCalled();
      expect(svc.updateGroupMemberCount.mock.calls.map(args => args[0])).toEqual([
        20, 21, 19, 18, 17,
      ]);
    });

    it('updates the count when nobody is logged in', async () => {
      asLoggedIn(null);
      const group = makeGroup('g1');
      await build({ group, detect: true });

      CometChatGroupEvents.ccGroupMemberJoined.next({
        joinedUser: makeUser('whoever'),
        joinedGroup: makeGroup('g1', { members: 30 }),
      } as never);

      expect(group.setHasJoined).not.toHaveBeenCalled();
      expect(svc.updateGroupMemberCount).toHaveBeenCalledWith(30);
    });

    it('ignores an empty usersAdded list but still trusts the new count', async () => {
      asLoggedIn(loggedInUid);
      const group = makeGroup('g1');
      await build({ group, detect: true });

      CometChatGroupEvents.ccGroupMemberAdded.next({
        usersAdded: [],
        userAddedIn: makeGroup('g1', { members: 5 }),
      } as never);

      expect(group.setHasJoined).not.toHaveBeenCalled();
      expect(svc.updateGroupMemberCount).toHaveBeenCalledWith(5);
    });

    it('ignores a missing usersAdded list but still trusts the new count', async () => {
      asLoggedIn(loggedInUid);
      const group = makeGroup('g1');
      await build({ group, detect: true });

      CometChatGroupEvents.ccGroupMemberAdded.next({
        userAddedIn: makeGroup('g1', { members: 6 }),
      } as never);

      expect(group.setHasJoined).not.toHaveBeenCalled();
      expect(svc.updateGroupMemberCount).toHaveBeenCalledWith(6);
    });

    it('ignores events about a different group', async () => {
      asLoggedIn(loggedInUid);
      const group = makeGroup('g1');
      await build({ group, detect: true });
      const me = makeUser(loggedInUid);
      const other = makeGroup('other-group', { members: 99 });

      CometChatGroupEvents.ccGroupMemberAdded.next({
        usersAdded: [me],
        userAddedIn: other,
      } as never);
      CometChatGroupEvents.ccGroupMemberJoined.next({ joinedUser: me, joinedGroup: other } as never);
      CometChatGroupEvents.ccGroupMemberBanned.next({ kickedUser: me, kickedFrom: other } as never);
      CometChatGroupEvents.ccGroupMemberKicked.next({ kickedUser: me, kickedFrom: other } as never);
      CometChatGroupEvents.ccGroupLeft.next({ userLeft: me, leftGroup: other } as never);
      CometChatGroupEvents.ccOwnershipChanged.next({ group: other } as never);

      expect(group.setHasJoined).not.toHaveBeenCalled();
      expect(group.setOwner).not.toHaveBeenCalled();
      expect(svc.updateGroupMemberCount).not.toHaveBeenCalled();
    });

    it('ignores events whose group payload is missing', async () => {
      asLoggedIn(loggedInUid);
      const group = makeGroup('g1');
      await build({ group, detect: true });

      CometChatGroupEvents.ccGroupMemberAdded.next({ usersAdded: [] } as never);
      CometChatGroupEvents.ccGroupMemberJoined.next({} as never);
      CometChatGroupEvents.ccGroupMemberBanned.next({} as never);
      CometChatGroupEvents.ccGroupMemberKicked.next({} as never);
      CometChatGroupEvents.ccGroupLeft.next({} as never);
      CometChatGroupEvents.ccOwnershipChanged.next({} as never);

      expect(group.setMembersCount).not.toHaveBeenCalled();
      expect(group.setOwner).not.toHaveBeenCalled();
      expect(svc.updateGroupMemberCount).not.toHaveBeenCalled();
    });

    it('ignores group events while a user conversation is open', async () => {
      asLoggedIn(loggedInUid);
      await build({ user: makeUser('u1'), detect: true });
      const payloadGroup = makeGroup('g1', { members: 50 });

      CometChatGroupEvents.ccGroupMemberAdded.next({
        usersAdded: [makeUser(loggedInUid)],
        userAddedIn: payloadGroup,
      } as never);
      CometChatGroupEvents.ccGroupMemberJoined.next({
        joinedUser: makeUser(loggedInUid),
        joinedGroup: payloadGroup,
      } as never);
      CometChatGroupEvents.ccGroupMemberBanned.next({
        kickedUser: makeUser(loggedInUid),
        kickedFrom: payloadGroup,
      } as never);
      CometChatGroupEvents.ccGroupMemberKicked.next({
        kickedUser: makeUser(loggedInUid),
        kickedFrom: payloadGroup,
      } as never);
      CometChatGroupEvents.ccGroupLeft.next({
        userLeft: makeUser(loggedInUid),
        leftGroup: payloadGroup,
      } as never);
      CometChatGroupEvents.ccOwnershipChanged.next({ group: payloadGroup } as never);

      expect(payloadGroup.setHasJoined).not.toHaveBeenCalled();
      expect(svc.updateGroupMemberCount).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // Call buttons and search
  // =========================================================================

  describe('call and search actions', () => {
    it('emits searchClick', async () => {
      await build({ detect: false });
      const seen: unknown[] = [];
      subs.push(c.searchClick.subscribe(() => seen.push('search')));

      c.handleSearchClick();

      expect(seen).toEqual(['search']);
    });

    it('emits the open user for a voice and a video call', async () => {
      const user = makeUser('u1');
      await build({ user, detect: true });
      const voice: unknown[] = [];
      const video: unknown[] = [];
      subs.push(c.voiceCallClick.subscribe(v => voice.push(v)));
      subs.push(c.videoCallClick.subscribe(v => video.push(v)));

      c.handleVoiceCallClick();
      c.handleVideoCallClick();

      expect(voice).toEqual([user]);
      expect(video).toEqual([user]);
    });

    it('emits the open group for a voice and a video call', async () => {
      const group = makeGroup('g1');
      await build({ group, detect: true });
      const voice: unknown[] = [];
      const video: unknown[] = [];
      subs.push(c.voiceCallClick.subscribe(v => voice.push(v)));
      subs.push(c.videoCallClick.subscribe(v => video.push(v)));

      c.handleVoiceCallClick();
      c.handleVideoCallClick();

      expect(voice).toEqual([group]);
      expect(video).toEqual([group]);
    });

    it('emits nothing for a call with no conversation open', async () => {
      await build({ detect: false });
      const voice: unknown[] = [];
      const video: unknown[] = [];
      subs.push(c.voiceCallClick.subscribe(v => voice.push(v)));
      subs.push(c.videoCallClick.subscribe(v => video.push(v)));

      c.handleVoiceCallClick();
      c.handleVideoCallClick();

      expect(voice).toEqual([]);
      expect(video).toEqual([]);
    });
  });

  // =========================================================================
  // Retry and error passthrough
  // =========================================================================

  describe('retry', () => {
    it('rebuilds the user subscription from scratch', async () => {
      const user = makeUser('u1');
      await build({ user, detect: true });
      svc.cleanup.mockClear();
      svc.setupListeners.mockClear();

      c.handleRetryClick();

      expect(svc.cleanup).toHaveBeenCalledTimes(1);
      expect(svc.setupListeners).toHaveBeenCalledWith('u1', 'user');
    });

    it('rebuilds the group subscription from scratch', async () => {
      const group = makeGroup('g1');
      await build({ group, detect: true });
      svc.cleanup.mockClear();
      svc.setupListeners.mockClear();

      c.handleRetryClick();

      expect(svc.cleanup).toHaveBeenCalledTimes(1);
      expect(svc.setupListeners).toHaveBeenCalledWith('g1', 'group');
    });

    it('only cleans up when there is no input to rebuild from', async () => {
      await build({ detect: false });

      c.handleRetryClick();

      expect(svc.cleanup).toHaveBeenCalledTimes(1);
      expect(svc.setupListeners).not.toHaveBeenCalled();
    });

    it('reports a retry failure through the error output', async () => {
      await build({ user: makeUser('u1'), detect: true });
      const errors = captureErrors();
      svc.cleanup.mockImplementation(() => {
        throw new Error('retry failed');
      });

      c.handleRetryClick();

      expect(errors).toHaveLength(1);
      expect(errors[0].message).toBe('retry failed');
      expect(CometChatLogger.error).toHaveBeenCalledWith(
        'CometChatMessageHeader',
        'Error in handleRetryClick:',
        errors[0]
      );
    });

    it('republishes an error raised by the error boundary', async () => {
      await build({ detect: false });
      const errors = captureErrors();
      const exception = new CometChat.CometChatException({ code: 'BOUNDARY', message: 'child' });

      c.handleError(exception);

      expect(errors).toEqual([exception]);
    });
  });

  // =========================================================================
  // Display helpers
  // =========================================================================

  describe('display helpers', () => {
    it('reads avatar and name from the open user', async () => {
      await build({
        user: makeUser('u1', { name: 'Alice', avatar: 'alice.png' }),
        detect: true,
      });

      expect(c.getAvatarImage()).toBe('alice.png');
      expect(c.getAvatarName()).toBe('Alice');
      expect(c.getDisplayName()).toBe('Alice');
    });

    it('reads name from the open group and falls back for a missing icon', async () => {
      await build({ group: makeGroup('g1', { name: 'Heroes' }), detect: true });

      expect(c.getAvatarImage()).toBe('');
      expect(c.getAvatarName()).toBe('Heroes');
      expect(c.getDisplayName()).toBe('Heroes');
    });

    it('returns empty display values with no conversation open', async () => {
      await build({ detect: false });

      expect(c.getAvatarImage()).toBe('');
      expect(c.getAvatarName()).toBe('');
      expect(c.getDisplayName()).toBe('');
    });

    it('reports the member count only for a group', async () => {
      await build({ group: makeGroup('g1'), detect: true });
      svc.groupMemberCount.set(7);

      expect(c.getMemberCount()).toBe(7);
      expect(c.getMemberCountText()).toBe('7');
    });

    it('reports no member count for a user conversation', async () => {
      await build({ user: makeUser('u1'), detect: true });
      svc.groupMemberCount.set(7);

      expect(c.getMemberCount()).toBe(0);
      expect(c.getMemberCountText()).toBe('');
    });

    it('tracks the online flag from the status signal', async () => {
      await build({ user: makeUser('u1'), detect: true });

      svc.userStatus.set('online');
      expect(c.isUserOnline()).toBe(true);

      svc.userStatus.set('offline');
      expect(c.isUserOnline()).toBe(false);
    });

    it('exposes the last-active timestamp from the service', async () => {
      await build({ user: makeUser('u1'), detect: true });

      expect(c.getLastActiveTimestamp()).toBeNull();

      svc.lastActiveAt.set(1710000000);
      expect(c.getLastActiveTimestamp()).toBe(1710000000);
    });

    it('prefers an explicit last-active date format', async () => {
      const format = { today: 'HH:mm', yesterday: 'custom' };
      await build({ inputs: { lastActiveAtDateTimeFormat: format }, detect: false });

      expect(c.getLastActiveDateFormat()).toBe(format);
    });

    it('builds a localized last-active date format by default', async () => {
      await build({ detect: false });

      const format = c.getLastActiveDateFormat();

      expect(format.today).toBe('hh:mm A');
      // Square brackets keep the translated word out of the pattern tokenizer.
      expect(format.yesterday).toBe('[yesterday]');
      expect(format.lastWeek).toBe('dddd');
      expect(format.otherDays).toBe('DD/MM/YYYY');
      expect(format.relativeTime).toEqual({
        minute: 'message_header_minute_ago',
        minutes: 'message_header_minutes_ago',
        hour: 'message_header_hour_ago',
        hours: 'message_header_hours_ago',
      });
    });

    it('describes a user conversation for assistive technology', async () => {
      await build({ user: makeUser('u1', { name: 'Alice' }), detect: true });
      svc.userStatus.set('online');

      expect(c.getHeaderAriaLabel()).toBe('Alice, message_header_status_online');
      expect(c.getItemAriaLabel()).toBe(
        'Alice, message_header_status_online. message_header_click_for_details'
      );
    });

    it('describes a group conversation for assistive technology', async () => {
      await build({ group: makeGroup('g1', { name: 'Heroes' }), detect: true });
      svc.groupMemberCount.set(3);

      expect(c.getHeaderAriaLabel()).toBe('Heroes, 3 message_header_members');
      expect(c.getItemAriaLabel()).toBe(
        'Heroes, 3 message_header_members. message_header_click_for_details'
      );
    });
  });

  // =========================================================================
  // Typing text
  // =========================================================================

  describe('typing text', () => {
    it('is empty when nobody is typing', async () => {
      await build({ user: makeUser('u1'), detect: true });

      expect(c.isTyping()).toBe(false);
      expect(c.getTypingText()).toBe('');
    });

    it('does not name the sender in a one-to-one conversation', async () => {
      await build({ user: makeUser('u1', { name: 'Alice' }), detect: true });
      svc.typingIndicator.set(makeTypingIndicator(makeUser('u1', { name: 'Alice' })));

      expect(c.isTyping()).toBe(true);
      expect(c.getTypingText()).toBe('message_header_typing');
    });

    it('names the indicator sender in a group when the typing list is empty', async () => {
      await build({ group: makeGroup('g1'), detect: true });
      svc.typingIndicator.set(makeTypingIndicator(makeUser('u1', { name: 'Alice' })));

      expect(c.getTypingText()).toBe('Alice message_header_is_typing');
    });

    it('falls back to a generic phrase when the group sender has no name', async () => {
      await build({ group: makeGroup('g1'), detect: true });
      svc.typingIndicator.set(makeTypingIndicator(makeUser('u1', { name: '' })));

      expect(c.getTypingText()).toBe(' message_header_is_typing');
    });

    it('falls back to a generic phrase when the group indicator has no sender', async () => {
      await build({ group: makeGroup('g1'), detect: true });
      svc.typingIndicator.set(makeTypingIndicator(null));

      expect(c.getTypingText()).toBe('message_header_typing');
    });

    it('names a single typist in a group', async () => {
      await build({ group: makeGroup('g1'), detect: true });
      svc.typingIndicator.set(makeTypingIndicator(makeUser('u1')));
      svc.typingUsers.set([makeUser('u1', { name: 'Alice' })]);

      expect(c.getTypingText()).toBe('Alice message_header_is_typing');
      expect(c.getTypingUsersCount()).toBe(1);
    });

    it('names both typists in a group', async () => {
      await build({ group: makeGroup('g1'), detect: true });
      svc.typingIndicator.set(makeTypingIndicator(makeUser('u1')));
      svc.typingUsers.set([makeUser('u1', { name: 'Alice' }), makeUser('u2', { name: 'Bob' })]);

      expect(c.getTypingText()).toBe(
        'Alice message_header_and Bob message_header_are_typing'
      );
      expect(c.getTypingUsersCount()).toBe(2);
    });

    it('counts the rest once a group has three typists', async () => {
      await build({ group: makeGroup('g1'), detect: true });
      svc.typingIndicator.set(makeTypingIndicator(makeUser('u1')));
      svc.typingUsers.set([
        makeUser('u1', { name: 'Alice' }),
        makeUser('u2', { name: 'Bob' }),
        makeUser('u3', { name: 'Cara' }),
      ]);

      expect(c.getTypingText()).toBe('Alice message_header_and 2 message_header_others_typing');
      expect(c.getTypingUsersCount()).toBe(3);
    });

    it('drops a missing name for a lone typist', async () => {
      await build({ group: makeGroup('g1'), detect: true });
      svc.typingIndicator.set(makeTypingIndicator(makeUser('u1')));
      svc.typingUsers.set([makeUser('u1', { name: '' })]);

      expect(c.getTypingText()).toBe(' message_header_is_typing');
    });

    it('drops missing names for a pair of typists', async () => {
      await build({ group: makeGroup('g1'), detect: true });
      svc.typingIndicator.set(makeTypingIndicator(makeUser('u1')));
      svc.typingUsers.set([makeUser('u1', { name: '' }), makeUser('u2', { name: '' })]);

      expect(c.getTypingText()).toBe(' message_header_and  message_header_are_typing');
    });

    it('drops the leading name when a crowd of typists starts with a nameless one', async () => {
      await build({ group: makeGroup('g1'), detect: true });
      svc.typingIndicator.set(makeTypingIndicator(makeUser('u1')));
      svc.typingUsers.set([
        makeUser('u1', { name: '' }),
        makeUser('u2', { name: 'Bob' }),
        makeUser('u3', { name: 'Cara' }),
      ]);

      expect(c.getTypingText()).toBe(' message_header_and 2 message_header_others_typing');
    });

    it('falls back to a generic phrase with an indicator but no conversation', async () => {
      await build({ detect: false });
      svc.typingIndicator.set(makeTypingIndicator(makeUser('u1', { name: 'Alice' })));

      expect(c.getTypingText()).toBe('message_header_typing');
    });
  });

  // =========================================================================
  // Status announcements
  // =========================================================================

  describe('status announcements', () => {
    function announcements(): string[] {
      return Array.from(document.querySelectorAll('.cometchat-sr-only')).map(
        n => n.textContent ?? ''
      );
    }

    it('announces a status change for the open user', async () => {
      await build({ user: makeUser('u1', { name: 'Alice' }), detect: true });
      expect(announcements()).toEqual([]);

      svc.userStatus.set('online');
      fixture.detectChanges();

      expect(announcements()).toEqual(['Alice message_header_user_now_online']);
      const node = document.querySelector('.cometchat-sr-only')!;
      expect(node.getAttribute('role')).toBe('status');
      expect(node.getAttribute('aria-live')).toBe('polite');
    });

    it('announces a return to offline', async () => {
      await build({ user: makeUser('u1', { name: 'Alice' }), detect: true });
      svc.userStatus.set('online');
      fixture.detectChanges();
      document.querySelectorAll('.cometchat-sr-only').forEach(n => n.remove());

      svc.userStatus.set('offline');
      fixture.detectChanges();

      expect(announcements()).toEqual(['Alice message_header_user_now_offline']);
    });

    it('stays silent when the status settles back on the announced value', async () => {
      await build({ user: makeUser('u1', { name: 'Alice' }), detect: true });

      // Two writes before the effect runs: it sees only the final value, which
      // equals the one it last recorded, so there is nothing to announce.
      svc.userStatus.set('online');
      svc.userStatus.set('offline');
      fixture.detectChanges();

      expect(announcements()).toEqual([]);
    });

    it('stays silent for a group conversation', async () => {
      await build({ group: makeGroup('g1'), detect: true });

      svc.userStatus.set('online');
      fixture.detectChanges();

      expect(announcements()).toEqual([]);
    });

    it('announces without a name when the open user has none', async () => {
      await build({ detect: false });

      (c as never as { announceStatusChange: (s: string) => void }).announceStatusChange('online');

      expect(announcements()).toEqual([' message_header_user_now_online']);
    });
  });

  // =========================================================================
  // Effective flags
  // =========================================================================

  describe('effective hideUserStatus', () => {
    it('honours an explicit input over everything else', async () => {
      await build({ globalConfig: { hideUserStatus: false }, inputs: { hideUserStatus: true } });

      expect(c.hideUserStatus).toBe(true);
      expect(c.effectiveHideUserStatus()).toBe(true);
    });

    it('falls back to the global config when the input was never set', async () => {
      await build({ globalConfig: { hideUserStatus: true } });

      expect(c.hideUserStatus).toBe(false);
      expect(c.effectiveHideUserStatus()).toBe(true);
    });

    it('shows the status when the global config is silent on it', async () => {
      await build({ globalConfig: { hideReceipts: true } });

      expect(c.effectiveHideUserStatus()).toBe(false);
    });

    it('shows the status when there is no global config at all', async () => {
      await build();

      expect((c as never as { globalConfig: unknown }).globalConfig).toBeNull();
      expect(c.effectiveHideUserStatus()).toBe(false);
    });
  });

  describe('effective call button flags', () => {
    it('honours explicit inputs even when calling is switched off', async () => {
      vi.spyOn(CometChatUIKit, 'isCallingEnabled').mockReturnValue(false);
      await build({ inputs: { hideVoiceCallButton: false, hideVideoCallButton: false } });

      expect(c.hideVoiceCallButton).toBe(false);
      expect(c.hideVideoCallButton).toBe(false);
      expect(c.effectiveHideVoiceCallButton()).toBe(false);
      expect(c.effectiveHideVideoCallButton()).toBe(false);
    });

    it('shows both buttons when calling is enabled and no input was set', async () => {
      vi.spyOn(CometChatUIKit, 'isCallingEnabled').mockReturnValue(true);
      await build();

      expect(c.effectiveHideVoiceCallButton()).toBe(false);
      expect(c.effectiveHideVideoCallButton()).toBe(false);
    });

    it('hides both buttons when calling is disabled and no input was set', async () => {
      vi.spyOn(CometChatUIKit, 'isCallingEnabled').mockReturnValue(false);
      await build();

      expect(c.effectiveHideVoiceCallButton()).toBe(true);
      expect(c.effectiveHideVideoCallButton()).toBe(true);
    });

    it('honours an explicit request to hide the buttons while calling is on', async () => {
      vi.spyOn(CometChatUIKit, 'isCallingEnabled').mockReturnValue(true);
      await build({ inputs: { hideVoiceCallButton: true, hideVideoCallButton: true } });

      expect(c.effectiveHideVoiceCallButton()).toBe(true);
      expect(c.effectiveHideVideoCallButton()).toBe(true);
    });
  });

  // =========================================================================
  // Template slot resolution
  // =========================================================================

  describe('template slots', () => {
    const asTemplate = (id: string) => ({ id }) as never;

    it('prefers an input template over a projected one', async () => {
      await build({ detect: false });
      const input = asTemplate('input');
      const projected = asTemplate('projected');

      c.headerView = input;
      c.headerViewContent = projected;
      expect(c.effectiveHeaderView).toBe(input);

      c.headerView = undefined;
      expect(c.effectiveHeaderView).toBe(projected);
    });

    it('prefers the deprecated listItemTemplate over itemView', async () => {
      await build({ detect: false });
      const legacy = asTemplate('legacy');
      const itemView = asTemplate('itemView');
      const projected = asTemplate('projected');

      c.listItemTemplate = legacy;
      c.itemView = itemView;
      c.itemViewContent = projected;
      expect(c.effectiveItemView).toBe(legacy);

      c.listItemTemplate = null;
      expect(c.effectiveItemView).toBe(itemView);

      c.itemView = undefined;
      expect(c.effectiveItemView).toBe(projected);
    });

    it('resolves the remaining slots from input then projection', async () => {
      await build({ detect: false });
      const input = asTemplate('input');
      const projected = asTemplate('projected');

      c.leadingView = input;
      c.titleView = input;
      c.subtitleView = input;
      c.trailingView = input;
      c.backButtonView = input;
      c.auxiliaryButtonView = input;
      expect([
        c.effectiveLeadingView,
        c.effectiveTitleView,
        c.effectiveSubtitleView,
        c.effectiveTrailingView,
        c.effectiveBackButtonView,
        c.effectiveAuxiliaryButtonView,
      ]).toEqual([input, input, input, input, input, input]);

      c.leadingView = undefined;
      c.titleView = undefined;
      c.subtitleView = undefined;
      c.trailingView = undefined;
      c.backButtonView = undefined;
      c.auxiliaryButtonView = undefined;
      c.leadingViewContent = projected;
      c.titleViewContent = projected;
      c.subtitleViewContent = projected;
      c.trailingViewContent = projected;
      c.backButtonViewContent = projected;
      c.auxiliaryButtonViewContent = projected;
      expect([
        c.effectiveLeadingView,
        c.effectiveTitleView,
        c.effectiveSubtitleView,
        c.effectiveTrailingView,
        c.effectiveBackButtonView,
        c.effectiveAuxiliaryButtonView,
      ]).toEqual([projected, projected, projected, projected, projected, projected]);
    });

    it('hands the open user to slot templates and drops the group key', async () => {
      const user = makeUser('u1');
      await build({ user, detect: true });

      expect(c.templateContext).toEqual({ user, group: undefined });
    });

    it('hands the open group to slot templates and drops the user key', async () => {
      const group = makeGroup('g1');
      await build({ group, detect: true });

      expect(c.templateContext).toEqual({ user: undefined, group });
    });
  });
});
