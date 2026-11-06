/**
 * CometChatConversations — constructor effects and lifecycle hooks
 *
 * Covers the reactive wiring set up in the constructor (typing announcements,
 * the error relay, the delete-dialog focus move) and the lifecycle hooks
 * (`ngOnInit`, `ngOnDestroy`) including their failure paths, which only open up
 * when an injected service misbehaves.
 *
 * Every test builds its own fixture: these paths depend on what is provided and
 * on what was set before the first change detection, so a shared instance would
 * either hide the branch or trip NG0100.
 *
 * Conversations here deliberately report no last message — rendering one pulls
 * in the real conversation item, which then needs a fully formed SDK message.
 * Logic that needs a last message is driven by calling the method directly.
 *
 * @module components/cometchat-conversations
 */

vi.mock('@cometchat/calls-sdk-javascript', () => ({
  CometChatCalls: {
    init: vi.fn().mockResolvedValue(true),
    generateToken: vi.fn().mockResolvedValue({ token: 'mock-token' }),
  },
}));

// Playing a notification sound reaches into CometChatUIKit, which needs an
// initialised SDK. Only the audio playback itself is stubbed out.
vi.mock('../../resources/CometChatSoundManager/CometChatSoundManager', () => ({
  CometChatSoundManager: { play: vi.fn(), pause: vi.fn() },
}));

import { describe, it, expect, vi, afterEach } from 'vitest';
import { Provider, signal, WritableSignal } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatConversationsComponent } from './cometchat-conversations.component';
import { ConversationsService } from '../../services/conversations.service';
import { ChatStateService } from '../../services/chat-state.service';
import { LiveAnnouncerService } from '../../services/live-announcer.service';
import { PinSaveService } from '../../services/pin-save.service';
import { FormatterConfigService } from '../../services/formatter-config.service';
import { CometChatTextFormatter } from '../../formatters/cometchat-text-formatter';
import { CometChatLogger } from '../../utils/CometChatLogger';

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

/** A user the component can read a uid and a display name off. */
function userStub(uid: string): CometChat.User {
  const user = Object.create(CometChat.User.prototype) as CometChat.User;
  Object.assign(user, { uid, name: uid });
  (user as unknown as Record<string, unknown>)['getUid'] = () => uid;
  (user as unknown as Record<string, unknown>)['getName'] = () => uid;
  return user;
}

/** A conversation whose participant is a user with the given uid. */
function userConversation(uid: string): CometChat.Conversation {
  const participant = userStub(uid);

  return {
    getConversationId: () => `conv-${uid}`,
    getConversationWith: () => participant,
    getConversationType: () => 'user',
    getUnreadMessageCount: () => 0,
    getLastMessage: () => undefined,
  } as unknown as CometChat.Conversation;
}

/** A typing indicator reporting the given sender (or none at all). */
function typingIndicator(sender: CometChat.User | undefined): CometChat.TypingIndicator {
  return { getSender: () => sender } as unknown as CometChat.TypingIndicator;
}

/** A single typing entry keyed the way the service keys them. */
function typingMap(...senders: (CometChat.User | undefined)[]): Map<string, CometChat.TypingIndicator> {
  const map = new Map<string, CometChat.TypingIndicator>();
  senders.forEach((sender, index) => map.set(sender ? sender.getUid() : `unknown-${index}`, typingIndicator(sender)));
  return map;
}

// ---------------------------------------------------------------------------
// Service doubles
// ---------------------------------------------------------------------------

/**
 * The component reads its state from the service's Observables via toSignal(),
 * and `hasMore` as a signal. BehaviorSubjects let a test push new state and have
 * the component pick it up.
 */
interface MockConversationsService {
  conversations$: BehaviorSubject<CometChat.Conversation[]>;
  loadingState$: BehaviorSubject<boolean>;
  errorState$: BehaviorSubject<Error | null>;
  activeConversation$: BehaviorSubject<CometChat.Conversation | null>;
  typingIndicators$: BehaviorSubject<Map<string, CometChat.TypingIndicator>>;
  hasMore: WritableSignal<boolean>;
  fetchConversations: ReturnType<typeof vi.fn>;
  fetchNextConversations: ReturnType<typeof vi.fn>;
  setActiveConversation: ReturnType<typeof vi.fn>;
  deleteConversation: ReturnType<typeof vi.fn>;
  searchConversations: ReturnType<typeof vi.fn>;
  clearError: ReturnType<typeof vi.fn>;
  replaceConversation: ReturnType<typeof vi.fn>;
  updateConversationReadStatus: ReturnType<typeof vi.fn>;
  updateConversationUnreadCount: ReturnType<typeof vi.fn>;
}

function makeConversationsService(items: CometChat.Conversation[] = []): MockConversationsService {
  return {
    conversations$: new BehaviorSubject<CometChat.Conversation[]>(items),
    loadingState$: new BehaviorSubject<boolean>(false),
    errorState$: new BehaviorSubject<Error | null>(null),
    activeConversation$: new BehaviorSubject<CometChat.Conversation | null>(null),
    typingIndicators$: new BehaviorSubject<Map<string, CometChat.TypingIndicator>>(new Map()),
    hasMore: signal(true),
    fetchConversations: vi.fn(),
    fetchNextConversations: vi.fn().mockResolvedValue(true),
    setActiveConversation: vi.fn(),
    deleteConversation: vi.fn().mockResolvedValue(undefined),
    searchConversations: vi.fn(),
    clearError: vi.fn(),
    replaceConversation: vi.fn(),
    updateConversationReadStatus: vi.fn(),
    updateConversationUnreadCount: vi.fn(),
  };
}

/** A formatter stand-in — the component only ever moves these around. */
function formatterStub(label: string): CometChatTextFormatter {
  return { label } as unknown as CometChatTextFormatter;
}

interface MockFormatterConfig {
  getDefaultFormatters: ReturnType<typeof vi.fn>;
  getFormattersWithContext: ReturnType<typeof vi.fn>;
}

function makeFormatterConfig(overrides: Partial<MockFormatterConfig> = {}): MockFormatterConfig {
  return {
    getDefaultFormatters: vi.fn(() => [formatterStub('default')]),
    getFormattersWithContext: vi.fn(() => [formatterStub('with-context')]),
    ...overrides,
  };
}

describe('CometChatConversationsComponent — effects and lifecycle', () => {
  let fixture: ComponentFixture<CometChatConversationsComponent> | undefined;
  let c: CometChatConversationsComponent;
  let service: MockConversationsService;
  let announcer: { announce: ReturnType<typeof vi.fn> };

  const convs = [userConversation('alice'), userConversation('bob')];

  interface BuildOptions {
    items?: CometChat.Conversation[];
    /** Appended last, so a token here overrides the default double. */
    providers?: Provider[];
    /** Runs after construction but before the first change detection. */
    beforeFirstCheck?: (instance: CometChatConversationsComponent) => void;
  }

  async function build(options: BuildOptions = {}): Promise<void> {
    service = makeConversationsService(options.items ?? convs);
    announcer = { announce: vi.fn() };

    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [CometChatConversationsComponent],
      providers: [
        { provide: ConversationsService, useValue: service },
        { provide: ChatStateService, useValue: { setActiveConversation: vi.fn() } },
        { provide: LiveAnnouncerService, useValue: announcer },
        ...(options.providers ?? []),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CometChatConversationsComponent);
    c = fixture.componentInstance;
    // The conversations effect plays a notification sound, which reaches into
    // CometChatUIKit and needs an initialised SDK.
    c.disableSoundForMessages = true;
    options.beforeFirstCheck?.(c);
    fixture.detectChanges();
  }

  /** Lets already-queued promise callbacks (the pin lookup, the user lookup) run. */
  function flushMicrotasks(): Promise<void> {
    return new Promise<void>(resolve => setTimeout(resolve, 0));
  }

  afterEach(() => {
    // Static event Subjects outlive the test; an undestroyed component keeps
    // answering them and skews the next test's call counts.
    fixture?.destroy();
    fixture = undefined;
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    // The SDK double is a module-level vi.fn shared by every test in this file,
    // so spying on it mutates it for good. Put the default back by hand.
    (CometChat.getLoggedinUser as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(null);
  });

  // -------------------------------------------------------------------------
  // Typing announcements
  // -------------------------------------------------------------------------

  describe('typing announcement effect', () => {
    it('announces the sender when the typing map grows', async () => {
      await build();
      const announceTyping = vi.spyOn(c, 'announceTyping');

      service.typingIndicators$.next(typingMap(userStub('alice')));
      fixture!.detectChanges();

      expect(announceTyping).toHaveBeenCalledWith('alice');
    });

    it('reaches the live announcer once the announcement debounce elapses', async () => {
      await build();
      vi.useFakeTimers();

      service.typingIndicators$.next(typingMap(userStub('alice')));
      fixture!.detectChanges();
      expect(announcer.announce).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1000);

      expect(announcer.announce).toHaveBeenCalledTimes(1);
      const [message, politeness] = announcer.announce.mock.calls[0];
      expect(String(message)).toContain('alice');
      expect(politeness).toBe('polite');
    });

    it('announces only the first entry when several people start typing at once', async () => {
      await build();
      const announceTyping = vi.spyOn(c, 'announceTyping');

      service.typingIndicators$.next(typingMap(userStub('alice'), userStub('bob')));
      fixture!.detectChanges();

      expect(announceTyping).toHaveBeenCalledTimes(1);
      expect(announceTyping).toHaveBeenCalledWith('alice');
    });

    it('stays silent for a typing indicator with no sender', async () => {
      await build();
      const announceTyping = vi.spyOn(c, 'announceTyping');

      service.typingIndicators$.next(typingMap(undefined));
      fixture!.detectChanges();

      expect(announceTyping).not.toHaveBeenCalled();
      expect((c as unknown as Record<string, unknown>)['previousTypingSize']).toBe(1);
    });

    it('resets its size watermark when everyone stops typing', async () => {
      await build();
      const announceTyping = vi.spyOn(c, 'announceTyping');

      service.typingIndicators$.next(typingMap(userStub('alice')));
      fixture!.detectChanges();
      announceTyping.mockClear();

      service.typingIndicators$.next(new Map());
      fixture!.detectChanges();

      expect(announceTyping).not.toHaveBeenCalled();
      expect((c as unknown as Record<string, unknown>)['previousTypingSize']).toBe(0);
    });

    it('settles on nobody typing when the service pushes no map at all', async () => {
      await build();
      const announceTyping = vi.spyOn(c, 'announceTyping');

      service.typingIndicators$.next(typingMap(userStub('alice')));
      fixture!.detectChanges();
      announceTyping.mockClear();

      service.typingIndicators$.next(undefined as unknown as Map<string, CometChat.TypingIndicator>);
      fixture!.detectChanges();

      expect(announceTyping).not.toHaveBeenCalled();
      expect((c as unknown as Record<string, unknown>)['previousTypingSize']).toBe(0);
    });

    it('stays silent for a map that reports a size but yields no entries', async () => {
      await build();
      const announceTyping = vi.spyOn(c, 'announceTyping');

      // An inconsistent map is the only way into the entry guard: a real Map of
      // non-zero size always hands back a first entry.
      const hollowMap = {
        size: 1,
        get: () => undefined,
        entries: () => ({ next: () => ({ value: undefined, done: true }) }),
      } as unknown as Map<string, CometChat.TypingIndicator>;
      service.typingIndicators$.next(hollowMap);
      fixture!.detectChanges();

      expect(announceTyping).not.toHaveBeenCalled();
      expect((c as unknown as Record<string, unknown>)['previousTypingSize']).toBe(1);
    });

    it('does not re-announce when the map is replaced at the same size', async () => {
      await build();

      service.typingIndicators$.next(typingMap(userStub('alice')));
      fixture!.detectChanges();
      const announceTyping = vi.spyOn(c, 'announceTyping');

      service.typingIndicators$.next(typingMap(userStub('bob')));
      fixture!.detectChanges();

      expect(announceTyping).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // Error relay
  // -------------------------------------------------------------------------

  describe('error relay effect', () => {
    it('emits a service error through the error output', async () => {
      const seen: unknown[] = [];
      await build({ beforeFirstCheck: instance => instance.error.subscribe(e => seen.push(e)) });

      const failure = new Error('fetch failed');
      service.errorState$.next(failure);
      fixture!.detectChanges();

      expect(seen).toEqual([failure]);
    });

    it('emits nothing while the service reports no error', async () => {
      const seen: unknown[] = [];
      await build({ beforeFirstCheck: instance => instance.error.subscribe(e => seen.push(e)) });

      expect(seen).toEqual([]);
    });

    it('withholds the error when hideError is set', async () => {
      const seen: unknown[] = [];
      await build({
        beforeFirstCheck: instance => {
          instance.hideError = true;
          instance.error.subscribe(e => seen.push(e));
        },
      });

      service.errorState$.next(new Error('fetch failed'));
      fixture!.detectChanges();

      expect(seen).toEqual([]);
    });
  });

  // -------------------------------------------------------------------------
  // Delete-dialog focus move
  // -------------------------------------------------------------------------

  describe('delete dialog focus effect', () => {
    it('moves focus to the dialog overlay once it is in the view', async () => {
      await build();
      vi.useFakeTimers();

      c.handleDeleteConversationClick(convs[0]);
      fixture!.detectChanges();
      const overlay = c.dialogOverlay?.nativeElement;
      expect(overlay).toBeTruthy();

      const focus = vi.spyOn(overlay!, 'focus');
      vi.advanceTimersByTime(0);
      const scheduledOnRender = focus.mock.calls.length;

      // Re-arm the effect now that the overlay reference exists.
      c.showDeleteConfirmDialog.set(false);
      c.showDeleteConfirmDialog.set(true);
      fixture!.detectChanges();
      vi.advanceTimersByTime(0);

      expect(focus.mock.calls.length).toBe(scheduledOnRender + 1);
    });

    it('does nothing when the overlay reference is unavailable', async () => {
      await build();
      vi.useFakeTimers();
      // Swallow the view query's write so the effect sees no overlay. The
      // confirm dialog traps focus of its own accord, so the assertion is
      // scoped to the overlay element rather than to focus() in general.
      Object.defineProperty(c, 'dialogOverlay', {
        get: () => undefined,
        set: () => undefined,
        configurable: true,
      });

      c.handleDeleteConversationClick(convs[0]);
      fixture!.detectChanges();
      const overlayEl = fixture!.nativeElement.querySelector(
        '.cometchat-conversations__dialog-overlay'
      ) as HTMLElement;
      expect(overlayEl).toBeTruthy();
      const focus = vi.spyOn(overlayEl, 'focus');
      vi.advanceTimersByTime(0);

      expect(focus).not.toHaveBeenCalled();
    });

    it('schedules no focus move while the dialog is closed', async () => {
      await build();
      // Closing the real dialog also tears the overlay out of the view, which
      // would satisfy the guard for the wrong reason. Pinning a stand-in
      // overlay in place leaves the open flag as the only thing that varies.
      const standIn = document.createElement('div');
      Object.defineProperty(c, 'dialogOverlay', {
        get: () => ({ nativeElement: standIn }),
        set: () => undefined,
        configurable: true,
      });
      const focus = vi.spyOn(standIn, 'focus');
      vi.useFakeTimers();

      c.showDeleteConfirmDialog.set(true);
      fixture!.detectChanges();
      vi.advanceTimersByTime(0);
      expect(focus).toHaveBeenCalledTimes(1);

      focus.mockClear();
      c.showDeleteConfirmDialog.set(false);
      fixture!.detectChanges();
      vi.advanceTimersByTime(0);

      expect(focus).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // ngOnInit — conversation pin availability
  // -------------------------------------------------------------------------

  describe('ngOnInit — pin availability lookup', () => {
    it('turns the pin option on when the lookup resolves true', async () => {
      const pinSave = { isPinConversationEnabled: vi.fn().mockResolvedValue(true) };
      await build({ providers: [{ provide: PinSaveService, useValue: pinSave }] });

      await flushMicrotasks();
      fixture!.detectChanges();

      expect(pinSave.isPinConversationEnabled).toHaveBeenCalled();
      expect((c as unknown as { conversationPinEnabled: () => boolean }).conversationPinEnabled()).toBe(true);
    });

    it('leaves the pin option off when the lookup resolves false', async () => {
      const pinSave = { isPinConversationEnabled: vi.fn().mockResolvedValue(false) };
      await build({ providers: [{ provide: PinSaveService, useValue: pinSave }] });

      await flushMicrotasks();
      fixture!.detectChanges();

      expect((c as unknown as { conversationPinEnabled: () => boolean }).conversationPinEnabled()).toBe(false);
    });

    it('survives a rejected pin lookup and leaves the option off', async () => {
      const pinSave = { isPinConversationEnabled: vi.fn().mockRejectedValue(new Error('no plan')) };
      await build({ providers: [{ provide: PinSaveService, useValue: pinSave }] });

      await flushMicrotasks();
      fixture!.detectChanges();

      expect(pinSave.isPinConversationEnabled).toHaveBeenCalled();
      expect((c as unknown as { conversationPinEnabled: () => boolean }).conversationPinEnabled()).toBe(false);
      expect(c.conversations()).toHaveLength(2);
    });

    it('initialises with no pin service at all', async () => {
      await build({ providers: [{ provide: PinSaveService, useValue: null }] });

      await flushMicrotasks();
      fixture!.detectChanges();

      expect((c as unknown as { conversationPinEnabled: () => boolean }).conversationPinEnabled()).toBe(false);
      expect(service.fetchConversations).toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // ngOnInit — logged-in user and formatters
  // -------------------------------------------------------------------------

  describe('ngOnInit — logged-in user and formatters', () => {
    it('reconfigures the formatters once the logged-in user resolves', async () => {
      const formatterConfig = makeFormatterConfig();
      vi.spyOn(CometChat, 'getLoggedinUser').mockResolvedValue(userStub('alice'));
      await build({ providers: [{ provide: FormatterConfigService, useValue: formatterConfig }] });

      await flushMicrotasks();

      expect(c.loggedInUser?.getUid()).toBe('alice');
      expect(formatterConfig.getFormattersWithContext).toHaveBeenCalledWith(c.loggedInUser, undefined);
      expect(c.activeFormatters).toHaveLength(1);
      expect((c.activeFormatters[0] as unknown as { label: string }).label).toBe('with-context');
    });

    it('swallows a formatter failure raised after the user resolves', async () => {
      const seen: unknown[] = [];
      const formatterConfig = makeFormatterConfig({
        getFormattersWithContext: vi.fn(() => {
          throw new Error('formatter context blew up');
        }),
      });
      vi.spyOn(CometChat, 'getLoggedinUser').mockResolvedValue(userStub('alice'));

      await build({
        providers: [{ provide: FormatterConfigService, useValue: formatterConfig }],
        beforeFirstCheck: instance => instance.error.subscribe(e => seen.push(e)),
      });
      await flushMicrotasks();

      expect(formatterConfig.getFormattersWithContext).toHaveBeenCalled();
      expect(seen).toEqual([]);
      expect(c.loggedInUser?.getUid()).toBe('alice');
      // The synchronous setup after the promise still completed.
      expect(service.fetchConversations).toHaveBeenCalled();
    });

    it('wraps a non-Error thrown during init before emitting it', async () => {
      const seen: unknown[] = [];
      const logger = vi.spyOn(CometChatLogger, 'error').mockImplementation(() => undefined);
      const formatterConfig = makeFormatterConfig({
        getDefaultFormatters: vi.fn(() => {
          throw 'boom';
        }),
      });

      await build({
        providers: [{ provide: FormatterConfigService, useValue: formatterConfig }],
        beforeFirstCheck: instance => instance.error.subscribe(e => seen.push(e)),
      });

      expect(seen).toHaveLength(1);
      expect(seen[0]).toBeInstanceOf(Error);
      expect((seen[0] as Error).message).toBe('boom');
      expect(logger).toHaveBeenCalled();
    });

    it('emits the thrown Error itself when init fails with an Error', async () => {
      const seen: unknown[] = [];
      vi.spyOn(CometChatLogger, 'error').mockImplementation(() => undefined);
      const failure = new Error('formatters unavailable');
      const formatterConfig = makeFormatterConfig({
        getDefaultFormatters: vi.fn(() => {
          throw failure;
        }),
      });

      await build({
        providers: [{ provide: FormatterConfigService, useValue: formatterConfig }],
        beforeFirstCheck: instance => instance.error.subscribe(e => seen.push(e)),
      });

      expect(seen).toEqual([failure]);
    });

    it('abandons the rest of init once something throws', async () => {
      vi.spyOn(CometChatLogger, 'error').mockImplementation(() => undefined);
      const formatterConfig = makeFormatterConfig({
        getDefaultFormatters: vi.fn(() => {
          throw new Error('formatters unavailable');
        }),
      });

      await build({ providers: [{ provide: FormatterConfigService, useValue: formatterConfig }] });

      expect(service.fetchConversations).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // initializeLoggedInUser
  // -------------------------------------------------------------------------

  describe('initializeLoggedInUser', () => {
    it('stores the resolved user', async () => {
      await build();
      const user = userStub('zara');
      vi.spyOn(CometChat, 'getLoggedinUser').mockResolvedValue(user);

      await (c as unknown as { initializeLoggedInUser: () => Promise<void> }).initializeLoggedInUser();

      expect(c.loggedInUser).toBe(user);
    });

    it('logs and leaves the user unset when the lookup rejects', async () => {
      await build();
      const logger = vi.spyOn(CometChatLogger, 'error').mockImplementation(() => undefined);
      vi.spyOn(CometChat, 'getLoggedinUser').mockRejectedValue(new Error('not logged in'));
      c.loggedInUser = null;

      await (c as unknown as { initializeLoggedInUser: () => Promise<void> }).initializeLoggedInUser();

      expect(logger).toHaveBeenCalled();
      expect(c.loggedInUser).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // Formatter configuration
  // -------------------------------------------------------------------------

  describe('formatter configuration', () => {
    it('replaces the active formatters with user-context ones', async () => {
      const formatterConfig = makeFormatterConfig();
      await build({ providers: [{ provide: FormatterConfigService, useValue: formatterConfig }] });
      formatterConfig.getFormattersWithContext.mockClear();

      const user = userStub('alice');
      c.loggedInUser = user;
      (c as unknown as { configureFormattersWithUser: () => void }).configureFormattersWithUser();

      expect(formatterConfig.getFormattersWithContext).toHaveBeenCalledWith(user, undefined);
      expect((c.activeFormatters[0] as unknown as { label: string }).label).toBe('with-context');
    });

    it('leaves the active formatters alone with no logged-in user', async () => {
      const formatterConfig = makeFormatterConfig();
      await build({ providers: [{ provide: FormatterConfigService, useValue: formatterConfig }] });
      formatterConfig.getFormattersWithContext.mockClear();
      const before = c.activeFormatters;

      c.loggedInUser = null;
      (c as unknown as { configureFormattersWithUser: () => void }).configureFormattersWithUser();

      expect(formatterConfig.getFormattersWithContext).not.toHaveBeenCalled();
      expect(c.activeFormatters).toBe(before);
    });

    it('falls back to the service defaults when no formatters are supplied', async () => {
      const formatterConfig = makeFormatterConfig();
      await build({ providers: [{ provide: FormatterConfigService, useValue: formatterConfig }] });

      expect(formatterConfig.getDefaultFormatters).toHaveBeenCalled();
      expect((c.activeFormatters[0] as unknown as { label: string }).label).toBe('default');
    });

    it('prefers explicitly supplied text formatters', async () => {
      const formatterConfig = makeFormatterConfig();
      const supplied = [formatterStub('supplied')];
      await build({
        providers: [{ provide: FormatterConfigService, useValue: formatterConfig }],
        beforeFirstCheck: instance => {
          instance.textFormatters = supplied;
        },
      });

      expect(formatterConfig.getDefaultFormatters).not.toHaveBeenCalled();
      expect((c.activeFormatters[0] as unknown as { label: string }).label).toBe('supplied');
      // Copied, not aliased — the component must not mutate the caller's array.
      expect(c.activeFormatters).not.toBe(supplied);
    });
  });

  // -------------------------------------------------------------------------
  // ngOnDestroy
  // -------------------------------------------------------------------------

  describe('ngOnDestroy', () => {
    it('clears a pending typing announcement', async () => {
      await build();
      const announceTyping = vi.spyOn(c, 'announceTyping');
      vi.useFakeTimers();

      service.typingIndicators$.next(typingMap(userStub('alice')));
      fixture!.detectChanges();
      expect(announceTyping).toHaveBeenCalled();
      expect((c as unknown as Record<string, unknown>)['typingAnnouncementTimeout']).not.toBeNull();

      c.ngOnDestroy();
      vi.advanceTimersByTime(1000);

      expect((c as unknown as Record<string, unknown>)['typingAnnouncementTimeout']).toBeNull();
      expect(announcer.announce).not.toHaveBeenCalled();
    });

    it('logs and does not rethrow when clearing the timeout fails', async () => {
      await build();
      const logger = vi.spyOn(CometChatLogger, 'error').mockImplementation(() => undefined);
      const internals = c as unknown as Record<string, unknown>;
      internals['typingAnnouncementTimeout'] = 1;

      vi.stubGlobal('clearTimeout', () => {
        throw new Error('clearTimeout unavailable');
      });
      try {
        expect(() => c.ngOnDestroy()).not.toThrow();
      } finally {
        vi.unstubAllGlobals();
      }

      expect(logger).toHaveBeenCalled();
      // The assignment after the failing call never ran.
      expect(internals['typingAnnouncementTimeout']).toBe(1);
      internals['typingAnnouncementTimeout'] = null;
    });
  });

  // -------------------------------------------------------------------------
  // Signal wiring set up in the constructor
  // -------------------------------------------------------------------------

  describe('constructor signal wiring', () => {
    it('mirrors the service state into its signals', async () => {
      await build({ items: [userConversation('alice')] });

      expect(c.conversations()).toHaveLength(1);
      expect(c.isLoading()).toBe(false);
      expect(c.hasError()).toBe(false);
      expect(c.activeConversationSignal()).toBeNull();
      expect(c.typingIndicators().size).toBe(0);
    });

    it('tracks the service hasMore flag', async () => {
      await build();
      expect(c.hasMore()).toBe(true);

      service.hasMore.set(false);
      fixture!.detectChanges();

      expect(c.hasMore()).toBe(false);
    });

    it('picks up loading state pushed by the service', async () => {
      await build();

      service.loadingState$.next(true);
      fixture!.detectChanges();

      expect(c.isLoading()).toBe(true);
    });
  });
});
