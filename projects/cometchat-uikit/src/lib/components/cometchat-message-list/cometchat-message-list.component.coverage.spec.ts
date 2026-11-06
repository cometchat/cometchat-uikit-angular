/**
 * CometChatMessageList — behaviour coverage for the component shell.
 *
 * The component is almost entirely a thin shell: it owns the signals, the
 * computed view state and the delegation surface, while the work lives in the
 * sibling `*-handlers` / `*-utils` modules. Those modules have their own specs
 * that call them with hand-built contexts, which leaves the shell itself — the
 * wiring, the guards and the fallbacks — unexercised.
 *
 * So this suite drives the REAL component against a stubbed data layer and
 * asserts the observable result (a signal, an emitted output, an event on the
 * bus, a mutated message object) rather than re-checking that a delegate was
 * called. The data layer is stubbed because `MessageListService` is declared in
 * the component's own `providers:` array: a root-level provider would be
 * ignored, so it is replaced with `TestBed.overrideComponent`.
 *
 * The template is replaced too. Rendering a real row pulls in every bubble
 * component and its SDK surface; every method here is reachable directly on the
 * instance, and the three scroll anchors are the only DOM the component itself
 * reads.
 *
 * @module components/cometchat-message-list
 */

// The calls SDK reaches for JitsiMeetJS, which jsdom does not provide.
vi.mock('@cometchat/calls-sdk-javascript', () => ({
  CometChatCalls: {
    init: vi.fn().mockResolvedValue(true),
    generateToken: vi.fn().mockResolvedValue({ token: 'mock-token' }),
  },
}));

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TemplateRef, WritableSignal, signal } from '@angular/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CometChat } from '@cometchat/chat-sdk-javascript';

import { CometChatMessageListComponent, MessageListItem } from './cometchat-message-list.component';
import { MessageListService } from '../../services/message-list.service';
import { PinSaveService } from '../../services/pin-save.service';
import { ThreadSubscriptionService } from '../../services/thread-subscription.service';
import { ConversationsService } from '../../services/conversations.service';
import { LiveAnnouncerService } from '../../services/live-announcer.service';
import { CometChatTemplatesService } from '../../services/templates.service';
import { COMETCHAT_GLOBAL_CONFIG, GlobalConfig } from '../../services/global-config.service';
import { CometChatPinSaveEvents } from '../../events/CometChatPinSaveEvents';
import { CometChatThreadEvents } from '../../events/CometChatThreadEvents';
import { CometChatMessageEvents } from '../../events/CometChatMessageEvents';
import { CometChatConversationEvents } from '../../events/CometChatConversationEvents';
import { CometChatUIEvents } from '../../events/CometChatUIEvents';
import { States, MessageListAlignment, MessageBubbleAlignment, MessageStatus } from '../../Enums/Enums';
import { CometChatUIKitConstants } from '../../constants';
import { CometChatLocalize } from '../../resources/CometChatLocalize/cometchat-localize';
import { CometChatLogger } from '../../utils/CometChatLogger';
import { CometChatSoundManager } from '../../resources/CometChatSoundManager/CometChatSoundManager';
import { CometChatMentionsFormatter } from '../../formatters/cometchat-mentions-formatter';
import { ToastType } from '../base-elements/cometchat-toast/cometchat-toast.component';
import { CometChatToastService } from '../base-elements/cometchat-toast/cometchat-toast.service';

// ---------------------------------------------------------------------------
// Test doubles
// ---------------------------------------------------------------------------

/** The three anchors the component itself queries; nothing else is rendered. */
const BARE_TEMPLATE = `
  <div #listContainer class="cometchat-message-list__body">
    <div #scrollTopAnchor></div>
    <div #scrollBottomAnchor></div>
  </div>`;

interface ServiceStub {
  messages: WritableSignal<CometChat.BaseMessage[]>;
  loadingState: WritableSignal<boolean>;
  errorState: WritableSignal<Error | null>;
  unreadCount: WritableSignal<number>;
  [key: string]: any;
}

/**
 * Stands in for MessageListService. The mutators that the component observes
 * through its `messages` signal (add/remove/clear) really mutate the signal, so
 * a test can assert the list the component sees rather than the call it made.
 */
function createServiceStub(): ServiceStub {
  const messages = signal<CometChat.BaseMessage[]>([]);
  const loadingState = signal(false);
  const errorState = signal<Error | null>(null);
  const unreadCount = signal(0);
  return {
    messages,
    loadingState,
    errorState,
    unreadCount,
    setUser: vi.fn(),
    setGroup: vi.fn(),
    clearConversation: vi.fn(),
    setIsAgentChat: vi.fn(),
    setParentMessageId: vi.fn(),
    setParentMessage: vi.fn(),
    setMessagesRequestBuilder: vi.fn(),
    setHideGroupActionMessages: vi.fn(),
    setLoadingState: vi.fn((value: boolean) => loadingState.set(value)),
    setErrorCallback: vi.fn(),
    clearError: vi.fn(() => errorState.set(null)),
    getFetchGeneration: vi.fn(() => 0),
    fetchPreviousMessages: vi.fn().mockResolvedValue(false),
    fetchNextMessages: vi.fn().mockResolvedValue(false),
    fetchMessagesAroundId: vi.fn().mockResolvedValue(undefined),
    cleanup: vi.fn(),
    addMessage: vi.fn((m: CometChat.BaseMessage) => messages.update(list => [...list, m])),
    removeMessage: vi.fn((id: number) =>
      messages.update(list => list.filter(m => m.getId() !== id))
    ),
    deleteMessage: vi.fn(),
    clearMessages: vi.fn(() => messages.set([])),
    getMessageById: vi.fn<(id: number) => CometChat.BaseMessage | undefined>(() => undefined),
    updateMessageById: vi.fn(() => true),
    markAsRead: vi.fn().mockResolvedValue(undefined),
    markConversationAsRead: vi.fn().mockResolvedValue(undefined),
    markAsUnread: vi.fn(),
    updateLocalReadStatus: vi.fn(),
    addReaction: vi.fn().mockResolvedValue(undefined),
    removeReaction: vi.fn().mockResolvedValue(undefined),
    translateMessage: vi.fn().mockResolvedValue('hola'),
    flagMessage: vi.fn().mockResolvedValue(undefined),
  };
}

function createPinSaveStub() {
  return {
    isPinEnabled: vi.fn().mockResolvedValue(true),
    isSaveEnabled: vi.fn().mockResolvedValue(true),
    run: vi.fn().mockResolvedValue(null),
  };
}

function createThreadStub() {
  return {
    isSupported: vi.fn(() => true),
    toggle: vi.fn(() => true),
    isFollowing: vi.fn(() => false),
    isUnavailable: vi.fn(() => false),
  };
}

interface Harness {
  fixture: ComponentFixture<CometChatMessageListComponent>;
  c: any;
  svc: ServiceStub;
  pinSave: ReturnType<typeof createPinSaveStub>;
  thread: ReturnType<typeof createThreadStub>;
}

let openFixtures: ComponentFixture<unknown>[] = [];

function setup(
  opts: {
    globalConfig?: Partial<GlobalConfig>;
    realThreadService?: boolean;
  } = {}
): Harness {
  const svc = createServiceStub();
  const pinSave = createPinSaveStub();
  const thread = createThreadStub();

  const providers: any[] = [{ provide: PinSaveService, useValue: pinSave }];
  if (!opts.realThreadService) {
    providers.push({ provide: ThreadSubscriptionService, useValue: thread });
  } else {
    // The real thread service confirms a toggle with a toast whose dismiss timer
    // outlives the test, so the toast host is stubbed out rather than left to
    // write a signal against a torn-down ApplicationRef.
    providers.push({
      provide: CometChatToastService,
      useValue: { info: vi.fn(), error: vi.fn(), success: vi.fn(), warning: vi.fn() },
    });
  }
  if (opts.globalConfig) {
    providers.push({ provide: COMETCHAT_GLOBAL_CONFIG, useValue: opts.globalConfig });
  }

  TestBed.configureTestingModule({
    imports: [CometChatMessageListComponent],
    providers,
  });
  // MessageListService lives in the component's own `providers:` array, so only
  // a component-level override reaches the injector the component actually uses.
  TestBed.overrideComponent(CometChatMessageListComponent, {
    set: { providers: [{ provide: MessageListService, useValue: svc }] },
  });
  TestBed.overrideTemplate(CometChatMessageListComponent, BARE_TEMPLATE);

  const fixture = TestBed.createComponent(CometChatMessageListComponent);
  openFixtures.push(fixture);
  return { fixture, c: fixture.componentInstance as any, svc, pinSave, thread };
}

// ---------------------------------------------------------------------------
// Fixtures / helpers
// ---------------------------------------------------------------------------

const ME = 'loggedInUid';

function me(): CometChat.User {
  return new CometChat.User(ME);
}

interface MsgOpts {
  id?: number;
  muid?: string;
  text?: string;
  senderUid?: string;
  receiverId?: string;
  receiverType?: string;
  sentAt?: number;
  type?: string;
  category?: string;
  deletedAt?: number;
  readAt?: number;
  parentMessageId?: number;
  pinnedAt?: number;
  savedAt?: number;
  stripPinAccessors?: boolean;
}

function makeMessage(opts: MsgOpts = {}): any {
  const msg: any = new CometChat.TextMessage(
    opts.receiverId ?? 'receiver1',
    opts.text ?? 'Hello there',
    (opts.receiverType ?? CometChat.RECEIVER_TYPE.USER) as any
  );
  msg.setId(opts.id ?? 1);
  msg.setSender(new CometChat.User(opts.senderUid ?? 'otherUid'));
  msg.setSentAt(opts.sentAt ?? 1_700_000_000);
  if (opts.muid !== undefined) msg.setMuid(opts.muid);
  if (opts.type !== undefined) msg.getType = () => opts.type;
  if (opts.category !== undefined) msg.getCategory = () => opts.category;
  if (opts.deletedAt !== undefined) msg.getDeletedAt = () => opts.deletedAt;
  if (opts.readAt !== undefined) msg.getReadAt = () => opts.readAt;
  msg.getParentMessageId = () => opts.parentMessageId ?? 0;
  if (opts.pinnedAt !== undefined) {
    msg.setPinnedAt(opts.pinnedAt);
  }
  if (opts.savedAt !== undefined) {
    msg.setSavedAt(opts.savedAt);
  }
  if (opts.stripPinAccessors) {
    msg.isPinned = undefined;
    msg.isSaved = undefined;
  }
  return msg;
}

function makeGroup(guid = 'guid1'): CometChat.Group {
  return new CometChat.Group(guid, 'Group', CometChat.GROUP_TYPE.PUBLIC as any, '');
}

/** A DOM shape the component's own queries can walk: root → container → row. */
function makeListDom(messageId: number | string = 1): {
  root: HTMLElement;
  container: HTMLElement;
  row: HTMLElement;
} {
  const root = document.createElement('div');
  root.className = 'cometchat-message-list';
  const container = document.createElement('div');
  const row = document.createElement('div');
  row.setAttribute('data-message-id', String(messageId));
  row.className = 'cometchat-message-list__message';
  row.dataset['index'] = '0';
  const bubble = document.createElement('div');
  bubble.className = 'cometchat-message-bubble';
  row.appendChild(bubble);
  container.appendChild(row);
  root.appendChild(container);
  document.body.appendChild(root);
  return { root, container, row };
}

/**
 * Installs a stand-in for a `@ViewChild` and keeps it installed.
 *
 * Angular writes a view query onto the instance the first time the view is
 * checked, and a signal write anywhere in the component is enough to make that
 * happen part-way through a test — quietly swapping a prepared stub for the real
 * jsdom element, which reports every scroll dimension as zero. The ignoring
 * setter makes the stub authoritative for the life of the test.
 */
function pinViewChild(c: any, name: string, value: unknown): void {
  Object.defineProperty(c, name, {
    configurable: true,
    get: () => value,
    set: () => undefined,
  });
}

const tick = (ms = 0) => new Promise<void>(resolve => setTimeout(resolve, ms));

/**
 * Polls until `predicate` holds, and throws when it never does.
 *
 * The scroll and emoji-keyboard handlers chain requestAnimationFrame into
 * setTimeout, and jsdom's frame callbacks do not line up with a fixed sleep —
 * so the wait is on the state, not on a duration.
 */
async function waitFor(predicate: () => boolean, label: string, timeoutMs = 3000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (!predicate()) {
    if (Date.now() > deadline) {
      throw new Error(`waitFor timed out: ${label}`);
    }
    await tick(10);
  }
}

function collect<T>(output: { subscribe: (fn: (value: T) => void) => any }): T[] {
  const seen: T[] = [];
  output.subscribe(value => seen.push(value));
  return seen;
}

beforeEach(() => {
  // The root ConversationsService listens on the same message bus and resolves a
  // conversation through the real SDK helper. Left alone it rejects with an
  // unwrapped payload, and the SDK's own exception wrapper then throws inside its
  // promise chain — noise from a service this suite is not exercising. A promise
  // that never settles keeps that listener inert.
  vi.spyOn(CometChat.CometChatHelper, 'getConversationFromMessage').mockReturnValue(
    new Promise<CometChat.Conversation>(() => undefined)
  );
});

afterEach(() => {
  openFixtures.forEach(f => {
    // The component clears its typing-announcement timeout on destroy but not
    // its inline-toast timer, so a toast raised during a test still fires its
    // markForCheck seconds later — against a torn-down ApplicationRef. Clearing
    // the raw handle avoids that without touching a signal.
    const instance = f.componentInstance as any;
    if (typeof instance?.inlineToastTimer === 'number') {
      clearTimeout(instance.inlineToastTimer);
    }
    f.destroy();
  });
  openFixtures = [];
  document.querySelectorAll('.cometchat-message-list').forEach(el => el.remove());
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------

describe('CometChatMessageListComponent — shell behaviour', () => {
  // -------------------------------------------------------------------------
  describe('data layer wiring', () => {
    it('reads its message list from the injected service, not a real session', () => {
      const { c, svc } = setup();

      expect(c.hasMessages()).toBe(false);
      svc.messages.set([makeMessage({ id: 7 }), makeMessage({ id: 8 })]);

      expect(c.hasMessages()).toBe(true);
      expect(c.messages().map((m: CometChat.BaseMessage) => m.getId())).toEqual([7, 8]);
      // Proves the component-level override is the injector that won: the real
      // service would never hold these two ids without a fetch.
      expect(svc.messages).toBe(c.messages);
    });

    it('initialises the service with the user input on ngOnInit', () => {
      const { c, svc, fixture } = setup();
      const user = new CometChat.User('u1');
      c.user = user;

      fixture.detectChanges();

      expect(svc['setUser']).toHaveBeenCalledWith(user);
      expect(svc['fetchPreviousMessages']).toHaveBeenCalled();
    });

    it('exposes the formatters set through the input setter', () => {
      const { c } = setup();
      const formatter = new CometChatMentionsFormatter();

      c.textFormatters = [formatter];

      expect(c.textFormatters).toEqual([formatter]);
      expect(c.effectiveTextFormatters()).toEqual([formatter]);
    });
  });

  // -------------------------------------------------------------------------
  describe('global-config fallbacks', () => {
    it('falls back to the hard default when neither an input nor a config is present', () => {
      const { c } = setup();

      expect(c.effectiveShowScrollbar()).toBe(false);
      expect(c.effectiveHideError()).toBe(false);
      expect(c.effectiveHideReceipts()).toBe(false);
      expect(c.effectiveDisableSoundForMessages()).toBe(false);
      expect(c.effectiveTextFormatters()).toEqual([]);
      expect(c.effectiveHideAvatar()).toBe(false);
      expect(c.effectiveCustomSoundForMessages()).toBe('');
      expect(c.effectiveHideModerationView()).toBe(false);
    });

    it('uses the global config when the input was never set', () => {
      const formatter = new CometChatMentionsFormatter();
      const { c } = setup({
        globalConfig: {
          showScrollbar: true,
          hideError: true,
          hideReceipts: true,
          disableSoundForMessages: true,
          textFormatters: [formatter],
          hideAvatar: true,
          customSoundForMessages: 'ping.wav',
        },
      });

      expect(c.effectiveShowScrollbar()).toBe(true);
      expect(c.effectiveHideError()).toBe(true);
      expect(c.effectiveHideReceipts()).toBe(true);
      expect(c.effectiveDisableSoundForMessages()).toBe(true);
      expect(c.effectiveTextFormatters()).toEqual([formatter]);
      expect(c.effectiveHideAvatar()).toBe(true);
      expect(c.effectiveCustomSoundForMessages()).toBe('ping.wav');
    });

    it('lets an explicit input override the global config', () => {
      const { c } = setup({
        globalConfig: {
          showScrollbar: true,
          hideError: true,
          hideReceipts: true,
          disableSoundForMessages: true,
          textFormatters: [new CometChatMentionsFormatter()],
          hideAvatar: true,
          customSoundForMessages: 'ping.wav',
        },
      });

      c.showScrollbar = false;
      c.hideError = false;
      c.hideReceipts = false;
      c.disableSoundForMessages = false;
      c.textFormatters = [];
      c.hideAvatar = false;
      c.customSoundForMessages = 'other.wav';
      c.hideModerationView = true;

      expect(c.effectiveShowScrollbar()).toBe(false);
      expect(c.effectiveHideError()).toBe(false);
      expect(c.effectiveHideReceipts()).toBe(false);
      expect(c.effectiveDisableSoundForMessages()).toBe(false);
      expect(c.effectiveTextFormatters()).toEqual([]);
      expect(c.effectiveHideAvatar()).toBe(false);
      expect(c.effectiveCustomSoundForMessages()).toBe('other.wav');
      // Moderation view has no config key — only the input can turn it on.
      expect(c.effectiveHideModerationView()).toBe(true);

      // Each setter is paired with a getter that reads back the stored value,
      // independent of whatever the config said.
      expect(c.showScrollbar).toBe(false);
      expect(c.hideError).toBe(false);
      expect(c.hideReceipts).toBe(false);
      expect(c.disableSoundForMessages).toBe(false);
      expect(c.hideAvatar).toBe(false);
      expect(c.customSoundForMessages).toBe('other.wav');
      expect(c.hideModerationView).toBe(true);
    });

    it('ignores a config object that omits the keys', () => {
      const { c } = setup({ globalConfig: { hideUserStatus: true } });

      expect(c.effectiveShowScrollbar()).toBe(false);
      expect(c.effectiveHideReceipts()).toBe(false);
      expect(c.effectiveCustomSoundForMessages()).toBe('');
      expect(c.effectiveTextFormatters()).toEqual([]);
    });
  });

  // -------------------------------------------------------------------------
  describe('template resolution and date formats', () => {
    it('prefers errorStateTemplate, then errorView, then the shared template', () => {
      const { c } = setup();
      const templates = TestBed.inject(CometChatTemplatesService);
      const shared = {} as TemplateRef<any>;
      const viaInput = {} as TemplateRef<any>;
      const viaDeprecated = {} as TemplateRef<any>;
      vi.spyOn(templates, 'resolveTemplate').mockReturnValue(shared);

      expect(c.effectiveErrorView).toBe(shared);

      c.errorView = viaDeprecated;
      expect(c.effectiveErrorView).toBe(viaDeprecated);

      c.errorStateTemplate = viaInput;
      expect(c.effectiveErrorView).toBe(viaInput);
    });

    it('resolves the loading, empty, header and footer slots in priority order', () => {
      const { c } = setup();
      const templates = TestBed.inject(CometChatTemplatesService);
      const shared = {} as TemplateRef<any>;
      const viaDeprecated = {} as TemplateRef<any>;
      const viaInput = {} as TemplateRef<any>;
      vi.spyOn(templates, 'resolveTemplate').mockReturnValue(shared);
      vi.spyOn(templates, 'getMessageListTemplates').mockReturnValue({
        headerView: shared,
        footerView: shared,
      } as any);

      expect(c.effectiveLoadingView).toBe(shared);
      expect(c.effectiveEmptyView).toBe(shared);
      expect(c.effectiveHeaderView).toBe(shared);
      expect(c.effectiveFooterView).toBe(shared);

      c.loadingView = viaDeprecated;
      c.emptyView = viaDeprecated;
      c.headerView = viaDeprecated;
      c.footerView = viaDeprecated;
      expect(c.effectiveLoadingView).toBe(viaDeprecated);
      expect(c.effectiveEmptyView).toBe(viaDeprecated);
      expect(c.effectiveHeaderView).toBe(viaDeprecated);
      expect(c.effectiveFooterView).toBe(viaDeprecated);

      c.loadingStateTemplate = viaInput;
      c.emptyStateTemplate = viaInput;
      expect(c.effectiveLoadingView).toBe(viaInput);
      expect(c.effectiveEmptyView).toBe(viaInput);
    });

    it('falls back to the localized defaults for every date format', () => {
      const { c } = setup();

      expect(c.getEffectiveSeparatorDateFormat()).toEqual(c.getDefaultSeparatorDateFormat());
      expect(c.getEffectiveStickyDateFormat()).toEqual(c.getDefaultStickyDateFormat());
      expect(c.getEffectiveMessageDateFormat()).toEqual(c.getDefaultMessageDateFormat());
      // The separator spells out the day; a bubble's own stamp shows the time.
      expect(c.getDefaultSeparatorDateFormat().otherDays).not.toBe(
        c.getDefaultMessageDateFormat().otherDays
      );
    });

    it('uses the supplied formats when the inputs are present', () => {
      const { c } = setup();
      const separator = { today: 'D-today', yesterday: 'D-yd', otherDays: 'D-other' };
      const sticky = { today: 'S-today', yesterday: 'S-yd', otherDays: 'S-other' };
      const message = { today: 'M-today', yesterday: 'M-yd', otherDays: 'M-other' };
      c.separatorDateTimeFormat = separator;
      c.stickyDateTimeFormat = sticky;
      c.messageSentAtDateTimeFormat = message;

      expect(c.getEffectiveSeparatorDateFormat()).toBe(separator);
      expect(c.getEffectiveStickyDateFormat()).toBe(sticky);
      expect(c.getEffectiveMessageDateFormat()).toBe(message);
    });
  });

  // -------------------------------------------------------------------------
  describe('list state derivation', () => {
    it('shows the empty state only when there is nothing to show and nothing to wait for', () => {
      const { c, svc } = setup();

      expect(c.isLoading()).toBe(false);
      expect(c.hasError()).toBe(false);
      expect(c.shouldShowEmptyState()).toBe(true);

      svc.messages.set([makeMessage()]);
      expect(c.shouldShowEmptyState()).toBe(false);

      svc.messages.set([]);
      svc.loadingState.set(true);
      expect(c.isLoading()).toBe(true);
      expect(c.shouldShowEmptyState()).toBe(false);

      svc.loadingState.set(false);
      svc.errorState.set(new Error('fetch failed'));
      expect(c.hasError()).toBe(true);
      expect(c.shouldShowEmptyState()).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  describe('keyboard navigation', () => {
    it('drops the roving focus on Escape', () => {
      const { c, svc } = setup();
      c.hideDateSeparator = true;
      svc.messages.set([makeMessage({ id: 1 })]);
      c.focusedMessageIndex.set(0);
      const event = new KeyboardEvent('keydown', { key: 'Escape', cancelable: true });

      c.handleKeydown(event);

      expect(c.focusedMessageIndex()).toBe(-1);
      expect(event.defaultPrevented).toBe(true);
    });

    it('ignores a keystroke while the list has no rows', () => {
      const { c } = setup();
      c.focusedMessageIndex.set(3);
      const event = new KeyboardEvent('keydown', { key: 'Escape', cancelable: true });

      c.handleKeydown(event);

      expect(c.focusedMessageIndex()).toBe(3);
      expect(event.defaultPrevented).toBe(false);
    });

    it('swallows the space key on a media row so the page does not scroll', () => {
      const { c, svc } = setup();
      c.hideDateSeparator = true;
      svc.messages.set([makeMessage({ id: 1, type: 'image' })]);
      c.focusedMessageIndex.set(0);
      const event = new KeyboardEvent('keydown', { key: ' ', cancelable: true });

      c.handleKeydown(event);

      expect(event.defaultPrevented).toBe(true);
    });

    it('keeps exactly one tab stop on the list', () => {
      const { c, svc } = setup();
      svc.messages.set([makeMessage({ id: 1 })]);

      // Nothing focused yet: the first message row owns the tab stop, and the
      // date separator ahead of it does not.
      expect(c.getMessageTabIndex(1)).toBe(0);
      expect(c.getMessageTabIndex(0)).toBe(-1);

      c.setFocusedIndex(1);
      expect(c.getMessageTabIndex(1)).toBe(0);
      expect(c.getMessageTabIndex(0)).toBe(-1);
    });
  });

  // -------------------------------------------------------------------------
  describe('smart replies and conversation starters gating', () => {
    it('shows smart replies only when every condition holds', () => {
      const { c } = setup();
      c.showSmartReplies = true;
      c.hideSmartReplies.set(false);
      c.lastReceivedMessage.set(makeMessage());

      expect(c.shouldShowSmartReplies()).toBe(true);
    });

    it('withholds smart replies for each failing condition in turn', () => {
      const { c } = setup();
      const base = () => {
        c.showSmartReplies = true;
        c.hideSmartReplies.set(false);
        c.lastReceivedMessage.set(makeMessage());
        c.showFooterPanel.set(false);
        c.parentMessageId = undefined;
      };

      base();
      c.showSmartReplies = false;
      expect(c.shouldShowSmartReplies()).toBe(false);

      base();
      c.hideSmartReplies.set(true);
      expect(c.shouldShowSmartReplies()).toBe(false);

      base();
      c.lastReceivedMessage.set(undefined);
      expect(c.shouldShowSmartReplies()).toBe(false);

      base();
      c.showFooterPanel.set(true);
      expect(c.shouldShowSmartReplies()).toBe(false);

      base();
      c.parentMessageId = 42;
      expect(c.shouldShowSmartReplies()).toBe(false);
    });

    it('shows conversation starters only on an empty, non-thread list', () => {
      const { c } = setup();
      c.showConversationStarters = true;
      c.listState.set(States.empty);

      expect(c.shouldShowConversationStarters()).toBe(true);
    });

    it('withholds conversation starters for each failing condition in turn', () => {
      const { c, svc } = setup();
      const base = () => {
        c.showConversationStarters = true;
        c.listState.set(States.empty);
        c.hideConversationStarters.set(false);
        c.showFooterPanel.set(false);
        c.parentMessageId = undefined;
        svc.messages.set([]);
      };

      base();
      c.showConversationStarters = false;
      expect(c.shouldShowConversationStarters()).toBe(false);

      base();
      svc.messages.set([makeMessage()]);
      expect(c.shouldShowConversationStarters()).toBe(false);

      base();
      c.hideConversationStarters.set(true);
      expect(c.shouldShowConversationStarters()).toBe(false);

      base();
      c.showFooterPanel.set(true);
      expect(c.shouldShowConversationStarters()).toBe(false);

      base();
      c.listState.set(States.loaded);
      expect(c.shouldShowConversationStarters()).toBe(false);

      base();
      c.parentMessageId = 9;
      expect(c.shouldShowConversationStarters()).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  describe('service-error effect', () => {
    it('surfaces a service error through the error output', () => {
      const { c, svc, fixture } = setup();
      vi.spyOn(CometChatLogger, 'error').mockImplementation(() => undefined);
      const errors = collect<CometChat.CometChatException>(c.error);
      const boom = new Error('fetch failed');
      svc.errorState.set(boom);

      fixture.detectChanges();

      expect(errors).toEqual([boom]);
      expect(c.listState()).toBe(States.error);
    });

    it('stays silent when errors are hidden', () => {
      const { c, svc, fixture } = setup();
      const errors = collect<CometChat.CometChatException>(c.error);
      c.hideError = true;
      svc.errorState.set(new Error('fetch failed'));

      fixture.detectChanges();

      expect(errors).toEqual([]);
      // The state machine also declines to show the error screen.
      expect(c.listState()).toBe(States.empty);
    });
  });

  // -------------------------------------------------------------------------
  describe('lifecycle hooks', () => {
    function change(currentValue: unknown, previousValue: unknown = undefined, firstChange = false) {
      return {
        currentValue,
        previousValue,
        firstChange,
        isFirstChange: () => firstChange,
      } as any;
    }

    it('refetches from scratch when hideGroupActionMessages flips', async () => {
      const { c, svc, fixture } = setup();
      fixture.detectChanges();
      svc.messages.set([makeMessage()]);
      c.hideGroupActionMessages = true;

      c.ngOnChanges({ hideGroupActionMessages: change(true, false) });
      await tick();

      expect(svc['setHideGroupActionMessages']).toHaveBeenCalledWith(true);
      expect(c.hasMessages()).toBe(false);
    });

    it('reports an ngOnInit failure through the error output', () => {
      const { c, fixture } = setup();
      vi.spyOn(CometChatLogger, 'error').mockImplementation(() => undefined);
      const errors = collect<CometChat.CometChatException>(c.error);
      c.initializeFormatters = () => {
        throw new Error('formatters unavailable');
      };

      fixture.detectChanges();

      expect(errors.map(e => e.message)).toEqual(['formatters unavailable']);
    });

    it('scrolls to a newly supplied goToMessageId', () => {
      const { c, svc, fixture } = setup();
      fixture.detectChanges();
      const { container } = makeListDom(999);
      pinViewChild(c, 'listContainer', { nativeElement: container });
      c.goToMessageId = '42';

      c.ngOnChanges({ goToMessageId: change('42', undefined) });

      // Not on screen, so the component converts the id and fetches around it.
      expect(svc['fetchMessagesAroundId']).toHaveBeenCalledWith(42);
    });

    it('re-pushes the parent message and reloads the thread when it changes', () => {
      const { c, svc, fixture } = setup();
      fixture.detectChanges();
      const oldParent = makeMessage({ id: 10 });
      const newParent = makeMessage({ id: 11 });
      c.parentMessage = newParent;

      c.ngOnChanges({ parentMessage: change(newParent, oldParent) });

      expect(svc['setParentMessage']).toHaveBeenCalledWith(newParent);
      expect(svc['setParentMessageId']).toHaveBeenCalledWith(11);
    });

    it('swallows and logs an ngOnChanges failure instead of breaking the view', () => {
      const { c, svc, fixture } = setup();
      fixture.detectChanges();
      const logged = vi.spyOn(CometChatLogger, 'error').mockImplementation(() => undefined);
      svc['setMessagesRequestBuilder'].mockImplementation(() => {
        throw new Error('builder rejected');
      });
      c.messagesRequestBuilder = {} as any;

      c.ngOnChanges({ messagesRequestBuilder: change({}, undefined) });

      expect(logged).toHaveBeenCalled();
      expect(logged.mock.calls[0][2]).toBeInstanceOf(Error);
    });

    it('wires the scroll listener and observers in ngAfterViewInit', () => {
      const { c, fixture } = setup();
      fixture.detectChanges();
      const { container } = makeListDom();
      const addEventListener = vi.spyOn(container, 'addEventListener');
      pinViewChild(c, 'listContainer', { nativeElement: container });
      pinViewChild(c, 'scrollTopAnchor', { nativeElement: document.createElement('div') });
      pinViewChild(c, 'scrollBottomAnchor', { nativeElement: document.createElement('div') });

      c.ngAfterViewInit();

      expect(c.scrollListener).toBeTypeOf('function');
      expect(addEventListener).toHaveBeenCalledWith('scroll', c.scrollListener);
      expect(c.scrollTopObserver).toBeDefined();
      expect(c.scrollBottomObserver).toBeDefined();
    });

    it('reports an ngAfterViewInit failure as an error state', () => {
      const { c, fixture } = setup();
      fixture.detectChanges();
      vi.spyOn(CometChatLogger, 'error').mockImplementation(() => undefined);
      const errors = collect<CometChat.CometChatException>(c.error);
      c.setupIntersectionObservers = () => {
        throw new Error('observer unavailable');
      };

      c.ngAfterViewInit();

      expect(c.listState()).toBe(States.error);
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toBe('observer unavailable');
    });

    it('tears down the listener, the timeout and the scroll handler on destroy', () => {
      const { c, fixture } = setup();
      fixture.detectChanges();
      const { container } = makeListDom();
      const removeEventListener = vi.spyOn(container, 'removeEventListener');
      const removeMessageListener = vi.spyOn(CometChat, 'removeMessageListener');
      const listener = () => undefined;
      pinViewChild(c, 'listContainer', { nativeElement: container });
      c.scrollListener = listener;
      c.typingAnnouncementTimeout = setTimeout(() => undefined, 10_000);
      c.pendingReadReceipts.add(5);

      c.ngOnDestroy();

      expect(removeMessageListener).toHaveBeenCalledWith(c.messageListenerId);
      expect(removeEventListener).toHaveBeenCalledWith('scroll', listener);
      expect(c.scrollListener).toBeNull();
      expect(c.typingAnnouncementTimeout).toBeNull();
      expect(c.pendingReadReceipts.size).toBe(0);
    });

    it('swallows and logs an ngOnDestroy failure', () => {
      const { c, fixture } = setup();
      fixture.detectChanges();
      const logged = vi.spyOn(CometChatLogger, 'error').mockImplementation(() => undefined);
      c.disconnectObservers = () => {
        throw new Error('already gone');
      };

      c.ngOnDestroy();

      expect(logged).toHaveBeenCalled();
      expect(logged.mock.calls[0][2]).toBeInstanceOf(Error);
    });
  });

  // -------------------------------------------------------------------------
  describe('conversation and thread switching', () => {
    it('resets the view and refetches when the conversation input changes', async () => {
      const { c, svc } = setup();
      c.user = new CometChat.User('peer');
      c.startFromUnreadMessages = false;
      c.showFooterPanel.set(true);
      c.showNewMessagesBanner.set(true);
      c.newMessagesCount.set(5);
      c.showScrollToBottom.set(true);
      c.hasMoreNext.set(true);
      c.hasMorePrevious.set(false);
      c.isFirstLoad = false;
      c.pendingReadReceipts.add(1);

      c.handleConversationChange();

      expect(svc['clearError']).toHaveBeenCalled();
      expect(svc['setUser']).toHaveBeenCalledWith(c.user);
      expect(c.showFooterPanel()).toBe(false);
      expect(c.showNewMessagesBanner()).toBe(false);
      expect(c.newMessagesCount()).toBe(0);
      expect(c.showScrollToBottom()).toBe(false);
      expect(c.hasMorePrevious()).toBe(true);
      expect(c.hasMoreNext()).toBe(false);
      expect(c.pendingReadReceipts.size).toBe(0);
      // Armed synchronously; the fetch below spends it on one activeChatChanged.
      expect(c.isFirstLoad).toBe(true);

      await tick();

      expect(svc['fetchPreviousMessages']).toHaveBeenCalled();
      expect(c.isFirstLoad).toBe(false);
    });

    it('holds an agent chat at the empty state on a conversation change', () => {
      const { c, svc } = setup();
      c.user = new CometChat.User('agent');
      c.isAgentChat = true;
      c.listState.set(States.loaded);

      c.handleConversationChange();

      expect(svc['setLoadingState']).toHaveBeenCalledWith(false);
      expect(c.listState()).toBe(States.empty);
      expect(svc['fetchPreviousMessages']).not.toHaveBeenCalled();
    });

    it('tears the conversation down when the inputs clear', () => {
      const { c, svc } = setup();

      c.handleConversationChange();

      expect(svc['clearConversation']).toHaveBeenCalled();
      expect(svc['setUser']).not.toHaveBeenCalled();
      expect(svc['setGroup']).not.toHaveBeenCalled();
    });

    it('reloads the thread when a parent message id is present', async () => {
      const { c, svc } = setup();
      svc.messages.set([makeMessage()]);
      c.parentMessage = makeMessage({ id: 77 });

      c.handleParentMessageIdChange();
      await tick();

      expect(svc['setParentMessageId']).toHaveBeenCalledWith(77);
      expect(c.hasMessages()).toBe(false);
      expect(svc['fetchPreviousMessages']).toHaveBeenCalled();
    });

    it('drops back to the empty state when an agent chat leaves its thread', () => {
      const { c, svc } = setup();
      c.isAgentChat = true;
      c.listState.set(States.loaded);

      c.handleParentMessageIdChange();

      expect(svc['setParentMessageId']).toHaveBeenCalledWith(null);
      expect(svc['setLoadingState']).toHaveBeenCalledWith(false);
      expect(c.listState()).toBe(States.empty);
    });

    it('does nothing when there is neither a thread nor an agent chat', () => {
      const { c, svc } = setup();

      c.handleParentMessageIdChange();

      expect(svc['setParentMessageId']).not.toHaveBeenCalled();
      expect(svc['clearMessages']).not.toHaveBeenCalled();
    });

    it('applies a deferred user change on the microtask queue', async () => {
      const { c, svc } = setup();
      const user = new CometChat.User('nextUser');
      c.startFromUnreadMessages = false;
      c.unreadDividerMessageId.set(123);
      c.pendingUser = user;

      c.scheduleDeferredConversationChange();
      await tick();

      expect(c.user).toBe(user);
      expect(c.group).toBeUndefined();
      expect(svc['setUser']).toHaveBeenCalledWith(user);
      expect(c.unreadDividerMessageId()).toBeNull();
    });

    it('applies a deferred group change and clears the pending user', async () => {
      const { c, svc } = setup();
      const group = makeGroup('nextGroup');
      c.startFromUnreadMessages = false;
      c.user = new CometChat.User('previous');
      c.pendingGroup = group;

      c.scheduleDeferredConversationChange();
      await tick();

      expect(c.group).toBe(group);
      expect(c.user).toBeUndefined();
      expect(svc['setGroup']).toHaveBeenCalledWith(group);
    });

    it('collapses two schedules in the same turn into one switch', async () => {
      const { c, svc } = setup();
      c.startFromUnreadMessages = false;
      c.pendingUser = new CometChat.User('a');

      c.scheduleDeferredConversationChange();
      c.scheduleDeferredConversationChange();
      await tick();

      // `clearError` is called once per conversation switch and by nothing else
      // on this path, so it counts the switches that actually happened. Counting
      // `setUser` would not: ngOnInit initialises the service with the same user
      // as soon as a tick runs.
      expect(svc['clearError']).toHaveBeenCalledTimes(1);
      expect(svc['setUser']).toHaveBeenCalledWith(c.user);
    });

    // The deferred scheduler reaches the handler functions directly, so these two
    // wrappers on the component are only reachable by name — they exist for
    // callers that hold the component rather than the handler module.
    it('loads around a target message when switching user with goToMessageId', async () => {
      const { c, svc } = setup();
      const user = new CometChat.User('jump');
      c.goToMessageId = '4242';

      c.handleUserChange(user);
      await tick();

      expect(c.user).toBe(user);
      expect(svc['fetchMessagesAroundId']).toHaveBeenCalledWith(4242);
      expect(svc['fetchPreviousMessages']).not.toHaveBeenCalled();
      expect(c.hasMorePrevious()).toBe(false);
      expect(c.hasMoreNext()).toBe(false);
    });

    it('scopes a group switch to the open thread', async () => {
      const { c, svc } = setup();
      const group = makeGroup('threadGroup');
      c.parentMessage = makeMessage({ id: 88 });

      c.handleGroupChange(group);
      await tick();

      expect(c.group).toBe(group);
      expect(c.user).toBeUndefined();
      expect(svc['setParentMessageId']).toHaveBeenCalledWith(88);
      expect(svc['setGroup']).toHaveBeenCalledWith(group);
      // A thread never takes the unread-pivot path, whatever the input says.
      expect(svc['fetchPreviousMessages']).toHaveBeenCalled();
    });

    it('logs a failed goToMessageId fetch during a group switch', async () => {
      const { c, svc } = setup();
      const logged = vi.spyOn(CometChatLogger, 'error').mockImplementation(() => undefined);
      svc['fetchMessagesAroundId'].mockRejectedValue(new Error('not found'));
      c.goToMessageId = '7';

      c.handleGroupChange(makeGroup('g'));
      await tick();

      expect(svc['fetchMessagesAroundId']).toHaveBeenCalledWith(7);
      expect(logged).toHaveBeenCalled();
    });

    it('positions on the first unread message when one exists', () => {
      const { c, svc } = setup();
      c.loggedInUser = me();
      svc.messages.set([
        makeMessage({ id: 1, senderUid: ME, readAt: 1 }),
        makeMessage({ id: 2, senderUid: 'otherUid' }),
        makeMessage({ id: 3, senderUid: 'otherUid' }),
      ]);

      c.scrollToFirstUnreadOrBottom();

      expect(c.unreadDividerMessageId()).toBe(2);
      expect(c.markedAsUnreadCount()).toBe(2);
      expect(c.showScrollToBottom()).toBe(true);
      expect(c.hasMorePrevious()).toBe(false);
      expect(c.hasMoreNext()).toBe(false);
    });

    it('goes straight to the bottom when unread positioning is off', () => {
      const { c, svc } = setup();
      c.loggedInUser = me();
      c.startFromUnreadMessages = false;
      svc.messages.set([makeMessage({ id: 2, senderUid: 'otherUid' })]);

      c.scrollToFirstUnreadOrBottom();

      expect(c.unreadDividerMessageId()).toBeNull();
      expect(c.markedAsUnreadCount()).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  describe('message classification', () => {
    const call = (receiverId: string, receiverType: string, senderUid = 'someone') =>
      ({
        getReceiverId: () => receiverId,
        getReceiverType: () => receiverType,
        getSender: () => new CometChat.User(senderUid),
      }) as any;

    it('matches a 1:1 call by either side of the conversation', () => {
      const { c } = setup();
      c.user = new CometChat.User('u1');

      expect(c.isCallForCurrentConversation(call('u1', 'user'))).toBe(true);
      expect(c.isCallForCurrentConversation(call('other', 'user', 'u1'))).toBe(true);
      expect(c.isCallForCurrentConversation(call('other', 'user', 'nobody'))).toBe(false);
      expect(c.isCallForCurrentConversation(call('guid1', 'group'))).toBe(false);
    });

    it('matches a group call by guid, and nothing at all with no conversation', () => {
      const { c } = setup();
      c.group = makeGroup('guid1');

      expect(c.isCallForCurrentConversation(call('guid1', 'group'))).toBe(true);
      expect(c.isCallForCurrentConversation(call('other', 'group'))).toBe(false);

      c.group = undefined;
      expect(c.isCallForCurrentConversation(call('guid1', 'group'))).toBe(false);
    });

    it('matches a 1:1 message in both directions', () => {
      const { c } = setup();
      c.loggedInUser = me();
      c.user = new CometChat.User('peer');

      const inbound = makeMessage({ senderUid: 'peer', receiverId: ME });
      const outbound = makeMessage({ senderUid: ME, receiverId: 'peer' });
      const stranger = makeMessage({ senderUid: 'nobody', receiverId: 'nowhere' });

      expect(c.isMessageForCurrentConversation(inbound)).toBe(true);
      expect(c.isMessageForCurrentConversation(outbound)).toBe(true);
      expect(c.isMessageForCurrentConversation(stranger)).toBe(false);
    });

    it('matches a group message by receiver id, and nothing with no conversation', () => {
      const { c } = setup();
      c.group = makeGroup('guid1');

      expect(c.isMessageForCurrentConversation(makeMessage({ receiverId: 'guid1' }))).toBe(true);
      expect(c.isMessageForCurrentConversation(makeMessage({ receiverId: 'other' }))).toBe(false);

      c.group = undefined;
      expect(c.isMessageForCurrentConversation(makeMessage({ receiverId: 'guid1' }))).toBe(false);
    });

    it('centres call and action messages and sides the rest by sender', () => {
      const { c } = setup();
      c.loggedInUser = me();

      const callMsg = makeMessage({ category: CometChatUIKitConstants.MessageCategory.call });
      const actionMsg = makeMessage({ category: CometChatUIKitConstants.MessageCategory.action });
      const mine = makeMessage({ senderUid: ME });
      const theirs = makeMessage({ senderUid: 'otherUid' });

      expect(c.getMessageAlignment(callMsg)).toBe(MessageBubbleAlignment.center);
      expect(c.getMessageAlignment(actionMsg)).toBe(MessageBubbleAlignment.center);
      expect(c.getMessageAlignment(mine)).toBe(MessageBubbleAlignment.right);
      expect(c.getMessageAlignment(theirs)).toBe(MessageBubbleAlignment.left);

      c.messageAlignment = MessageListAlignment.left;
      expect(c.getMessageAlignment(mine)).toBe(MessageBubbleAlignment.left);
    });

    it('fingerprints reactions so an unchanged set compares equal', () => {
      const { c } = setup();
      const reaction = (emoji: string, count: number, byMe: boolean) =>
        ({ getReaction: () => emoji, getCount: () => count, getReactedByMe: () => byMe }) as any;
      const bare = makeMessage();
      const reacted = makeMessage();
      reacted.getReactions = () => [reaction('👍', 2, true), reaction('🎉', 1, false)];

      expect(c.getReactionFingerprint(bare)).toBe('0');
      expect(c.getReactionFingerprint(reacted)).toBe('👍2m|🎉1');
    });

    it('buckets timestamps by calendar day', () => {
      const { c } = setup();
      const seconds = Math.floor(new Date(2024, 4, 17, 13, 30).getTime() / 1000);
      const laterSameDay = seconds + 3600;
      const nextDay = seconds + 86_400;

      expect(c.getDateString(seconds)).toBe('2024-4-17');
      expect(c.getDateString(laterSameDay)).toBe(c.getDateString(seconds));
      expect(c.getDateString(nextDay)).not.toBe(c.getDateString(seconds));
    });
  });

  // -------------------------------------------------------------------------
  describe('status-info footer visibility', () => {
    function item(message: any, isLastInBatch?: boolean): MessageListItem {
      return { type: 'message', message, key: 'k', isLastInBatch } as MessageListItem;
    }

    it('keeps the footer on a date separator row', () => {
      const { c } = setup();

      expect(c.shouldHideStatusInfoView({ type: 'date-separator', key: 'sep' })).toBe(false);
    });

    it('hides the footer on the agent side of an agent chat', () => {
      const { c } = setup();
      c.loggedInUser = me();
      c.isAgentChat = true;

      expect(c.shouldHideStatusInfoView(item(makeMessage({ senderUid: 'agent' })))).toBe(true);
      expect(c.shouldHideStatusInfoView(item(makeMessage({ senderUid: ME }), true))).toBe(false);
    });

    it('hides the footer on every batch message but the last', () => {
      const { c } = setup();

      expect(c.shouldHideStatusInfoView(item(makeMessage(), false))).toBe(true);
      expect(c.shouldHideStatusInfoView(item(makeMessage(), true))).toBe(false);
      expect(c.shouldHideStatusInfoView(item(makeMessage()))).toBe(false);
    });

    it('keeps the footer on a pinned or saved batch message', () => {
      const { c } = setup();

      expect(c.shouldHideStatusInfoView(item(makeMessage({ pinnedAt: 123 }), false))).toBe(false);
      expect(c.shouldHideStatusInfoView(item(makeMessage({ savedAt: 456 }), false))).toBe(false);
    });

    it('treats a message without the pin accessors as unmarked', () => {
      const { c } = setup();

      expect(c.shouldHideStatusInfoView(item(makeMessage({ stripPinAccessors: true }), false))).toBe(
        true
      );
    });
  });

  // -------------------------------------------------------------------------
  describe('message options', () => {
    it('builds the default option set for an incoming text message', () => {
      const { c } = setup();
      c.loggedInUser = me();

      const ids = c
        .getMessageOptions(makeMessage({ senderUid: 'otherUid' }))
        .map((o: any) => o.id);

      expect(ids).toContain(CometChatUIKitConstants.MessageOption.reactToMessage);
      expect(ids).toContain(CometChatUIKitConstants.MessageOption.replyMessage);
      expect(ids).toContain(CometChatUIKitConstants.MessageOption.copyMessage);
      expect(ids).not.toContain(CometChatUIKitConstants.MessageOption.deleteMessage);
    });

    it('offers no options at all on a deleted message', () => {
      const { c } = setup();
      c.loggedInUser = me();

      expect(c.getMessageOptions(makeMessage({ deletedAt: 1 }))).toEqual([]);
    });

    it('hands the built list to optionsOverride', () => {
      const { c } = setup();
      c.loggedInUser = me();
      let received: any[] = [];
      c.optionsOverride = (_message: CometChat.BaseMessage, options: any[]) => {
        received = options;
        return [options[0]];
      };

      const result = c.getMessageOptions(makeMessage());

      expect(received.length).toBeGreaterThan(1);
      expect(result).toEqual([received[0]]);
    });
  });

  // -------------------------------------------------------------------------
  describe('thread subscription', () => {
    it('stays off without the global-config flag, without consulting the SDK probe', () => {
      const { c, thread } = setup();

      expect(c.threadSubscriptionEnabled).toBe(false);
      expect(thread.isSupported).not.toHaveBeenCalled();
    });

    it('needs both the config flag and SDK support', () => {
      const { c, thread } = setup({ globalConfig: { enableThreadSubscription: true } });

      expect(c.threadSubscriptionEnabled).toBe(true);

      thread.isSupported.mockReturnValue(false);
      expect(c.threadSubscriptionEnabled).toBe(false);
    });

    it('toggling an option flips the held message and announces the change', async () => {
      const subscribeToThread = vi.fn().mockResolvedValue(undefined);
      const original = (CometChat as any).subscribeToThread;
      (CometChat as any).subscribeToThread = subscribeToThread;
      try {
        const { c } = setup({ realThreadService: true });
        const parent = makeMessage({ id: 50 });
        parent.setThreadSubscribed(false);
        c.parentMessage = parent;
        const changes = collect<{ parentMessageId: number; subscribed: boolean }>(
          c.threadSubscriptionChange
        );
        c.subscribeToThreadEvents();

        c.toggleThreadSubscription(parent);
        await tick();

        expect(subscribeToThread).toHaveBeenCalledWith(50);
        expect(changes[0]).toEqual({ parentMessageId: 50, subscribed: true });
        expect(parent.isThreadSubscribed()).toBe(true);
      } finally {
        (CometChat as any).subscribeToThread = original;
      }
    });

    it('stamps every held reply of the thread the event names', () => {
      const { c, svc } = setup();
      const parent = makeMessage({ id: 60 });
      const reply = makeMessage({ id: 61, parentMessageId: 60 });
      const unrelated = makeMessage({ id: 62 });
      [parent, reply, unrelated].forEach(m => m.setThreadSubscribed(false));
      c.parentMessage = parent;
      svc.messages.set([reply, unrelated]);
      c.subscribeToThreadEvents();

      CometChatThreadEvents.publishThreadSubscriptionChanged({
        parentMessageId: 60,
        subscribed: true,
      });

      expect(parent.isThreadSubscribed()).toBe(true);
      expect(reply.isThreadSubscribed()).toBe(true);
      expect(unrelated.isThreadSubscribed()).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  describe('pin and save', () => {
    it('resolves the app-level flags from the SDK when no override is given', async () => {
      const { c, pinSave } = setup();
      pinSave.isPinEnabled.mockResolvedValue(true);
      pinSave.isSaveEnabled.mockResolvedValue(false);

      await c.resolvePinSaveFlags();

      expect(c.pinMessageEnabled).toBe(true);
      expect(c.saveMessageEnabled).toBe(false);
    });

    it('lets the global config override the SDK flags', async () => {
      const { c, pinSave } = setup({
        globalConfig: { enablePinMessage: false, enableSaveMessage: true },
      });
      pinSave.isPinEnabled.mockResolvedValue(true);
      pinSave.isSaveEnabled.mockResolvedValue(false);

      await c.resolvePinSaveFlags();

      expect(c.pinMessageEnabled).toBe(false);
      expect(c.saveMessageEnabled).toBe(true);
      expect(pinSave.isPinEnabled).not.toHaveBeenCalled();
      expect(pinSave.isSaveEnabled).not.toHaveBeenCalled();
    });

    it('runs an adding action immediately', () => {
      const { c, pinSave } = setup();
      const message = makeMessage();

      c.requestPinSave('pin', message);
      c.requestPinSave('save', message);

      expect(c.pendingPinSave()).toBeNull();
      expect(pinSave.run).toHaveBeenNthCalledWith(1, 'pin', message);
      expect(pinSave.run).toHaveBeenNthCalledWith(2, 'save', message);
    });

    it('asks before a removing action', () => {
      const { c, pinSave } = setup();
      const message = makeMessage();

      c.requestPinSave('unpin', message);

      expect(c.pendingPinSave()).toEqual({ action: 'unpin', message });
      expect(pinSave.run).not.toHaveBeenCalled();

      c.cancelPinSave();
      c.requestPinSave('unsave', message);
      expect(c.pendingPinSave()).toEqual({ action: 'unsave', message });
      expect(pinSave.run).not.toHaveBeenCalled();
    });

    it('runs the pending action on confirm and clears the prompt', async () => {
      const { c, pinSave } = setup();
      const message = makeMessage();
      c.requestPinSave('unpin', message);

      c.confirmPinSave();
      await tick();

      expect(c.pendingPinSave()).toBeNull();
      expect(pinSave.run).toHaveBeenCalledWith('unpin', message);
    });

    it('does nothing on confirm with no prompt open', () => {
      const { c, pinSave } = setup();

      c.confirmPinSave();

      expect(c.pendingPinSave()).toBeNull();
      expect(pinSave.run).not.toHaveBeenCalled();
    });

    it('abandons the action on cancel', () => {
      const { c, pinSave } = setup();
      c.requestPinSave('unsave', makeMessage());

      c.cancelPinSave();

      expect(c.pendingPinSave()).toBeNull();
      expect(pinSave.run).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  describe('pin/save event bus', () => {
    it('patches the held row rather than swapping in the event payload', () => {
      const { c, svc } = setup();
      const held = makeMessage({ id: 90 });
      const incoming = makeMessage({ id: 90, pinnedAt: 1234 });
      svc['getMessageById'].mockReturnValue(held);
      c.subscribeToPinSaveEvents();

      CometChatPinSaveEvents.publishMessagePinned({ message: incoming });

      expect(held.getPinnedAt()).toBe(1234);
      expect(svc['updateMessageById']).toHaveBeenCalledWith(90, held);
    });

    it('clears the marker again on the unpin and unsave channels', () => {
      const { c, svc } = setup();
      const held = makeMessage({ id: 91, pinnedAt: 10, savedAt: 11 });
      svc['getMessageById'].mockReturnValue(held);
      c.subscribeToPinSaveEvents();

      CometChatPinSaveEvents.publishMessageUnpinned({ message: makeMessage({ id: 91 }) });
      expect(held.getPinnedAt()).toBeUndefined();

      CometChatPinSaveEvents.publishMessageUnsaved({ message: makeMessage({ id: 91 }) });
      expect(held.getSavedAt()).toBeUndefined();
    });

    it('uses the event payload when the list no longer holds the message', () => {
      const { c, svc } = setup();
      const incoming = makeMessage({ id: 92, savedAt: 77 });
      svc['getMessageById'].mockReturnValue(undefined);
      c.subscribeToPinSaveEvents();

      CometChatPinSaveEvents.publishMessageSaved({ message: incoming });

      expect(svc['updateMessageById']).toHaveBeenCalledWith(92, incoming);
    });

    it('ignores a payload with no message id', () => {
      const { c, svc } = setup();
      const idless = makeMessage({ id: 93 });
      idless.getId = () => 0;
      c.subscribeToPinSaveEvents();

      CometChatPinSaveEvents.publishMessagePinned({ message: idless });
      CometChatPinSaveEvents.publishMessagePinned({ message: undefined as any });

      expect(svc['updateMessageById']).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  describe('scroll handling', () => {
    /** A stub whose scroll geometry is writable — jsdom reports every size as 0. */
    function geometry(values: { scrollHeight?: number; scrollTop?: number; clientHeight?: number }) {
      return {
        nativeElement: {
          scrollHeight: values.scrollHeight ?? 0,
          scrollTop: values.scrollTop ?? 0,
          clientHeight: values.clientHeight ?? 0,
          querySelector: () => null,
          querySelectorAll: () => [],
          getBoundingClientRect: () => ({ top: 0, left: 0, right: 0, width: 0, height: 0 }),
          scrollTo: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          closest: () => null,
        },
      };
    }

    it('records whether more history remains after loading older messages', async () => {
      const { c, svc } = setup();
      svc['fetchPreviousMessages'].mockResolvedValue(true);
      pinViewChild(c, 'listContainer', geometry({ scrollHeight: 500, scrollTop: 100 }));

      await c.handleScrollToTop();

      expect(c.hasMorePrevious()).toBe(true);
      expect(c.isFetchingPrevious()).toBe(false);
    });

    it('refuses a second history fetch while one is in flight', async () => {
      const { c, svc } = setup();
      c.isFetchingPrevious.set(true);

      await c.handleScrollToTop();

      expect(svc['fetchPreviousMessages']).not.toHaveBeenCalled();
      expect(c.isFetchingPrevious()).toBe(true);
    });

    it('clears the in-flight flag when loading older messages fails', async () => {
      const { c, svc } = setup();
      vi.spyOn(CometChatLogger, 'error').mockImplementation(() => undefined);
      svc['fetchPreviousMessages'].mockRejectedValue(new Error('offline'));

      await c.handleScrollToTop();

      expect(c.isFetchingPrevious()).toBe(false);
    });

    it('only loads newer messages when the list is windowed', async () => {
      const { c, svc } = setup();

      c.handleScrollToBottom();
      expect(svc['fetchNextMessages']).not.toHaveBeenCalled();

      c.hasMoreNext.set(true);
      svc['fetchNextMessages'].mockResolvedValue(false);
      c.handleScrollToBottom();
      await tick();

      expect(svc['fetchNextMessages']).toHaveBeenCalled();
      expect(c.hasMoreNext()).toBe(false);
      expect(c.isFetchingNext()).toBe(false);
    });

    it('keeps the viewport anchored across a prepend', () => {
      const { c } = setup();
      const container = geometry({ scrollHeight: 300, scrollTop: 40 });
      pinViewChild(c, 'listContainer', container);

      c.saveScrollPosition();
      expect(c.scrollHeightBeforeLoad).toBe(300);

      container.nativeElement.scrollHeight = 500;
      c.restoreScrollPosition();
      expect(container.nativeElement.scrollTop).toBe(240);
    });

    it('does not touch the scroll position with no container', () => {
      const { c } = setup();
      pinViewChild(c, 'listContainer', undefined);
      c.scrollHeightBeforeLoad = 42;

      c.saveScrollPosition();
      c.restoreScrollPosition();

      expect(c.scrollHeightBeforeLoad).toBe(42);
    });

    it('absorbs the height a new reaction row adds', async () => {
      const { c } = setup();
      const container = geometry({ scrollHeight: 300, scrollTop: 50 });
      pinViewChild(c, 'listContainer', container);

      c.saveScrollPositionForReaction();
      container.nativeElement.scrollHeight = 420;
      await waitFor(() => container.nativeElement.scrollTop === 170, 'reaction height absorbed');

      expect(container.nativeElement.scrollTop).toBe(170);
    });

    it('leaves the scroll position alone when a reaction changes no heights', async () => {
      const { c } = setup();
      const container = geometry({ scrollHeight: 300, scrollTop: 50 });
      pinViewChild(c, 'listContainer', container);

      c.saveScrollPositionForReaction();
      await tick(60);

      expect(container.nativeElement.scrollTop).toBe(50);

      pinViewChild(c, 'listContainer', undefined);
      c.saveScrollPositionForReaction();
      await tick(60);
      expect(container.nativeElement.scrollTop).toBe(50);
    });

    it('tracks the day of the topmost visible row in the sticky header', () => {
      const { c, svc } = setup();
      const sentAt = 1_700_123_456;
      c.hideDateSeparator = true;
      svc.messages.set([makeMessage({ id: 1, sentAt })]);
      const { container } = makeListDom();
      Object.defineProperty(container, 'scrollTop', { value: 120, configurable: true });
      pinViewChild(c, 'listContainer', { nativeElement: container });

      c.updateStickyDate();

      expect(c.stickyDateTimestamp()).toBe(sentAt);
      expect(c.showStickyDateHeader()).toBe(true);
    });

    it('hides the sticky header when it is turned off or the list is empty', () => {
      const { c, svc } = setup();
      const { container } = makeListDom();
      c.showStickyDateHeader.set(true);
      c.hideStickyDate = true;
      pinViewChild(c, 'listContainer', { nativeElement: container });

      c.updateStickyDate();
      expect(c.showStickyDateHeader()).toBe(false);

      c.hideStickyDate = false;
      c.showStickyDateHeader.set(true);
      svc.messages.set([]);
      c.updateStickyDate();
      expect(c.showStickyDateHeader()).toBe(false);

      pinViewChild(c, 'listContainer', undefined);
      c.showStickyDateHeader.set(true);
      c.updateStickyDate();
      expect(c.showStickyDateHeader()).toBe(false);
    });

    it('shows the jump-to-bottom button once the user scrolls up', () => {
      const { c } = setup();
      pinViewChild(c, 'listContainer', geometry({ scrollHeight: 2000, scrollTop: 0, clientHeight: 500 }));

      c.updateIsAtBottom();

      expect(c.isAtBottom()).toBe(false);
      expect(c.showScrollToBottom()).toBe(true);
    });

    it('clears the unread markers and sends a receipt on reaching the bottom', async () => {
      const { c, svc } = setup();
      c.loggedInUser = me();
      c.user = new CometChat.User('peer');
      svc.messages.set([
        makeMessage({ id: 1, senderUid: ME }),
        makeMessage({ id: 2, senderUid: 'peer' }),
      ]);
      c.markedAsUnreadCount.set(3);
      c.unreadDividerMessageId.set(2);
      c.showNewMessagesBanner.set(true);
      c.isAtBottom.set(false);
      pinViewChild(c, 'listContainer', geometry({ scrollHeight: 500, scrollTop: 400, clientHeight: 100 }));

      c.updateIsAtBottom();
      await tick();

      expect(c.isAtBottom()).toBe(true);
      expect(c.markedAsUnreadCount()).toBe(0);
      expect(c.unreadDividerMessageId()).toBeNull();
      expect(c.showNewMessagesBanner()).toBe(false);
      expect(svc['markAsRead']).toHaveBeenCalledWith(svc.messages()[1]);
    });

    it('does nothing without a container', () => {
      const { c } = setup();
      c.isAtBottom.set(false);
      pinViewChild(c, 'listContainer', undefined);

      c.updateIsAtBottom();

      expect(c.isAtBottom()).toBe(false);
    });

    it('pins the scroll to the bottom and keeps retrying while rows render', async () => {
      const { c } = setup();
      const container = geometry({ scrollHeight: 900, scrollTop: 0 });
      pinViewChild(c, 'listContainer', container);

      c.scrollToBottomWithRetry(1);
      expect(container.nativeElement.scrollTop).toBe(900);

      container.nativeElement.scrollHeight = 1200;
      await waitFor(() => container.nativeElement.scrollTop === 1200, 'retry re-pinned the scroll');
      expect(container.nativeElement.scrollTop).toBe(1200);

      pinViewChild(c, 'listContainer', undefined);
      c.scrollToBottomWithRetry(0);
      expect(container.nativeElement.scrollTop).toBe(1200);
    });

    it('highlights a message already on screen', () => {
      const { c, svc } = setup();
      const { container, row } = makeListDom(321);
      pinViewChild(c, 'listContainer', { nativeElement: container });

      c.scrollToMessage(321);

      expect(row.classList.contains('cometchat-message-list__message--highlighted')).toBe(true);
      expect(svc['fetchMessagesAroundId']).not.toHaveBeenCalled();
    });

    it('fetches around a message that is not on screen', async () => {
      const { c, svc } = setup();
      const { container } = makeListDom(1);
      pinViewChild(c, 'listContainer', { nativeElement: container });

      c.scrollToMessage('555');
      await tick();

      expect(svc['fetchMessagesAroundId']).toHaveBeenCalledWith(555);
      expect(c.hasMorePrevious()).toBe(false);
      expect(c.hasMoreNext()).toBe(false);
    });

    it('ignores a non-numeric message id and a missing container', () => {
      const { c, svc } = setup();
      const { container } = makeListDom(1);
      pinViewChild(c, 'listContainer', { nativeElement: container });

      c.scrollToMessage('not-an-id');
      expect(svc['fetchMessagesAroundId']).not.toHaveBeenCalled();

      pinViewChild(c, 'listContainer', undefined);
      c.scrollToMessage(1);
      expect(svc['fetchMessagesAroundId']).not.toHaveBeenCalled();
    });

    it('re-enables pagination after the retry finds the row', async () => {
      const { c } = setup();
      const { container, row } = makeListDom(777);
      pinViewChild(c, 'listContainer', { nativeElement: container });
      c.hasMorePrevious.set(false);
      c.hasMoreNext.set(false);

      c.scrollToMessageWithRetry(777, 10);
      await waitFor(
        () => row.classList.contains('cometchat-message-list__message--highlighted'),
        'row highlighted by the retry'
      );

      expect(row.classList.contains('cometchat-message-list__message--highlighted')).toBe(true);
      await waitFor(() => c.hasMorePrevious() === true, 'pagination re-enabled');
      expect(c.hasMoreNext()).toBe(true);
    });

    it('stops retrying when the budget is spent', async () => {
      const { c } = setup();
      const { container } = makeListDom(1);
      const querySelector = vi.spyOn(container, 'querySelector');
      pinViewChild(c, 'listContainer', { nativeElement: container });

      c.scrollToMessageWithRetry(888, 0);
      await tick(120);

      expect(querySelector).not.toHaveBeenCalled();
    });

    it('applies and then lifts the highlight class', () => {
      const { c } = setup();
      const { row } = makeListDom();
      const HIGHLIGHT = 'cometchat-message-list__message--highlighted';

      // The class is lifted on a 2s timeout, so the clock is driven rather than
      // waited on. Installed after setup() so the component is built on the
      // real clock.
      vi.useFakeTimers();
      try {
        c.highlightAndScrollToElement(row);
        expect(row.classList.contains(HIGHLIGHT)).toBe(true);

        vi.advanceTimersByTime(1999);
        expect(row.classList.contains(HIGHLIGHT)).toBe(true);

        vi.advanceTimersByTime(1);
        expect(row.classList.contains(HIGHLIGHT)).toBe(false);
      } finally {
        vi.useRealTimers();
      }
    });

    it('rebuilds the list from the service on an explicit refresh', () => {
      const { c, svc } = setup();
      c.user = new CometChat.User('u1');

      c.refreshMessages();

      expect(svc['cleanup']).toHaveBeenCalled();
      expect(svc['setUser']).toHaveBeenCalledWith(c.user);
      expect(svc['fetchPreviousMessages']).toHaveBeenCalled();
    });

    it('clears the error and reloads on a retry click', () => {
      const { c, svc } = setup();
      svc.errorState.set(new Error('boom'));
      c.listState.set(States.error);

      c.handleRetryClick();

      expect(c.listState()).toBe(States.loading);
      expect(svc.errorState()).toBeNull();
      expect(svc['cleanup']).toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  describe('screen-reader announcements', () => {
    it('announces each message lifecycle event with its localized text', () => {
      const { c } = setup();
      const announcer = TestBed.inject(LiveAnnouncerService);
      const announce = vi.spyOn(announcer, 'announce').mockImplementation(() => undefined);
      const announceError = vi.spyOn(announcer, 'announceError').mockImplementation(() => undefined);

      c.announceNewMessage('Alice', 'Hi there');
      expect(announce).toHaveBeenLastCalledWith(
        CometChatLocalize.getLocalizedString('accessibility_new_message')
          .replace('{sender}', 'Alice')
          .replace('{preview}', 'Hi there'),
        'polite'
      );

      c.announceMessageSent();
      expect(announce).toHaveBeenLastCalledWith(
        CometChatLocalize.getLocalizedString('accessibility_message_sent'),
        'polite'
      );

      c.announceMessageDeleted();
      expect(announce).toHaveBeenLastCalledWith(
        CometChatLocalize.getLocalizedString('accessibility_message_deleted'),
        'polite'
      );

      c.announceMessageEdited();
      expect(announce).toHaveBeenLastCalledWith(
        CometChatLocalize.getLocalizedString('accessibility_message_edited'),
        'polite'
      );

      c.announceLoadingMore();
      expect(announce).toHaveBeenLastCalledWith(
        CometChatLocalize.getLocalizedString('accessibility_loading_older_messages'),
        'polite'
      );

      c.announceMessageFailed();
      expect(announceError).toHaveBeenCalledWith(
        CometChatLocalize.getLocalizedString('accessibility_message_failed')
      );
    });

    it('debounces the typing announcement and replaces an earlier pending one', async () => {
      const { c } = setup();
      const announcer = TestBed.inject(LiveAnnouncerService);
      const announce = vi.spyOn(announcer, 'announce').mockImplementation(() => undefined);

      c.announceTyping('Alice');
      expect(announce).not.toHaveBeenCalled();
      const firstTimer = c.typingAnnouncementTimeout;

      c.announceTyping('Bob');
      expect(c.typingAnnouncementTimeout).not.toBe(firstTimer);

      await tick(1100);
      expect(announce).toHaveBeenCalledTimes(1);
      expect(announce).toHaveBeenCalledWith(
        CometChatLocalize.getLocalizedString('accessibility_user_typing').replace('{name}', 'Bob'),
        'polite'
      );
    });
  });

  // -------------------------------------------------------------------------
  describe('inline toast', () => {
    it('shows a success toast by default and retires it after the duration', async () => {
      const { c } = setup();

      c.showInlineToast('Saved');

      expect(c.inlineToastText()).toBe('Saved');
      expect(c.inlineToastType()).toBe(ToastType.success);

      c.showInlineToast('Broken', ToastType.error, 5);
      expect(c.inlineToastType()).toBe(ToastType.error);

      await tick(40);
      expect(c.inlineToastText()).toBeNull();
    });

    it('cancels the pending retirement when the toast is dismissed', async () => {
      const { c } = setup();

      c.onInlineToastClosed();
      expect(c.inlineToastText()).toBeNull();

      c.showInlineToast('Saved', ToastType.success, 10);
      c.onInlineToastClosed();
      expect(c.inlineToastText()).toBeNull();

      c.showInlineToast('Still here', ToastType.success, 10_000);
      c.onInlineToastClosed();
      await tick(40);
      expect(c.inlineToastText()).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  describe('previews and media detection', () => {
    it('summarises a message by type', () => {
      const { c } = setup();

      expect(c.getMessagePreview(makeMessage({ text: 'Hello there' }))).toBe('Hello there');
      expect(c.getMessagePreview(makeMessage({ deletedAt: 1 }))).toBe(
        CometChatLocalize.getLocalizedString('message_deleted')
      );
      expect(c.getMessagePreview(makeMessage({ type: 'image' }))).toBe(
        CometChatLocalize.getLocalizedString('conversation_subtitle_image')
      );
    });

    it('recognises the four media types and nothing else', () => {
      const { c } = setup();

      expect(c.isMediaMessage(makeMessage({ type: 'image' }))).toBe(true);
      expect(c.isMediaMessage(makeMessage({ type: 'video' }))).toBe(true);
      expect(c.isMediaMessage(makeMessage({ type: 'audio' }))).toBe(true);
      expect(c.isMediaMessage(makeMessage({ type: 'file' }))).toBe(true);
      expect(c.isMediaMessage(makeMessage({ type: 'text' }))).toBe(false);
    });

    it('moves the roving focus to the requested row', () => {
      const { c } = setup();

      c.focusMessageAtIndex(4);

      expect(c.focusedMessageIndex()).toBe(4);
    });

    it('offers smart replies only for text that matches a keyword', () => {
      const { c } = setup();

      expect(c.shouldShowSmartRepliesForMessage(makeMessage({ text: 'How are you?' }))).toBe(true);
      expect(c.shouldShowSmartRepliesForMessage(makeMessage({ text: 'Thanks' }))).toBe(false);
      expect(c.shouldShowSmartRepliesForMessage(makeMessage({ type: 'image' }))).toBe(false);

      c.smartRepliesKeywords = [];
      expect(c.shouldShowSmartRepliesForMessage(makeMessage({ text: 'Thanks' }))).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  describe('read receipts', () => {
    it('marks the newest unread incoming message as read on first load', async () => {
      const { c, svc } = setup();
      c.loggedInUser = me();
      c.user = new CometChat.User('peer');
      const unread = makeMessage({ id: 5, senderUid: 'peer' });
      svc.messages.set([makeMessage({ id: 4, senderUid: ME }), unread]);
      const read = collect<CometChat.BaseMessage>(CometChatMessageEvents.ccMessageRead);

      await c.markInitialMessagesAsRead();

      expect(svc['markAsRead']).toHaveBeenCalledWith(unread);
      expect(svc['updateLocalReadStatus']).toHaveBeenCalledWith([5]);
      expect(read).toEqual([unread]);
    });

    it('does nothing with no messages or no session', async () => {
      const { c, svc } = setup();

      await c.markInitialMessagesAsRead();
      expect(svc['markAsRead']).not.toHaveBeenCalled();

      svc.messages.set([makeMessage({ id: 1, senderUid: 'peer' })]);
      c.loggedInUser = null;
      await c.markInitialMessagesAsRead();
      expect(svc['markAsRead']).not.toHaveBeenCalled();
    });

    it('receipts a live message straight away when the user is at the bottom', async () => {
      const { c, svc } = setup();
      c.loggedInUser = me();
      const incoming = makeMessage({ id: 20, senderUid: 'peer' });

      await c.handleRealtimeMessageReceipt(incoming);

      expect(svc['updateLocalReadStatus']).toHaveBeenCalledWith([20]);
      expect(svc['markAsRead']).toHaveBeenCalledWith(incoming);
      expect(svc['markConversationAsRead']).toHaveBeenCalled();
      expect(c.unreadMessages()).toEqual([]);
    });

    it('queues a live message while the user is scrolled up', async () => {
      const { c, svc } = setup();
      c.loggedInUser = me();
      c.isAtBottom.set(false);
      const incoming = makeMessage({ id: 21, senderUid: 'peer' });

      await c.handleRealtimeMessageReceipt(incoming);

      expect(c.unreadMessages()).toEqual([incoming]);
      expect(svc['markAsRead']).not.toHaveBeenCalled();
    });

    it('skips a live message with no session or from the logged-in user', async () => {
      const { c, svc } = setup();

      await c.handleRealtimeMessageReceipt(makeMessage({ senderUid: 'peer' }));
      expect(svc['markAsRead']).not.toHaveBeenCalled();

      c.loggedInUser = me();
      await c.handleRealtimeMessageReceipt(makeMessage({ senderUid: ME }));
      expect(svc['markAsRead']).not.toHaveBeenCalled();
    });

    it('flushes the queue with a single receipt on scrolling to the bottom', async () => {
      const { c, svc } = setup();
      c.loggedInUser = me();
      c.user = new CometChat.User('peer');
      const older = makeMessage({ id: 30, senderUid: 'peer' });
      const newest = makeMessage({ id: 31, senderUid: 'peer' });
      c.unreadMessages.set([older, newest]);

      await c.markMessagesReadOnScrollToBottom();

      expect(svc['markAsRead']).toHaveBeenCalledTimes(1);
      expect(svc['markAsRead']).toHaveBeenCalledWith(newest);
      expect(svc['updateLocalReadStatus']).toHaveBeenCalledWith([30, 31]);
      expect(c.unreadMessages()).toEqual([]);
    });

    it('flushes nothing when the queue is empty or holds only own messages', async () => {
      const { c, svc } = setup();
      c.loggedInUser = me();

      await c.markMessagesReadOnScrollToBottom();
      expect(svc['markAsRead']).not.toHaveBeenCalled();

      c.unreadMessages.set([makeMessage({ id: 40, senderUid: ME })]);
      await c.markMessagesReadOnScrollToBottom();
      expect(svc['markAsRead']).not.toHaveBeenCalled();
    });

    it('picks the highest-id incoming message, treating no session as "everything incoming"', () => {
      const { c } = setup();
      const mine = makeMessage({ id: 50, senderUid: ME });
      const theirs = makeMessage({ id: 51, senderUid: 'peer' });

      expect(c.getLatestReceiverMessage([mine, theirs])).toBe(theirs);
      expect(c.isReceiverMessage(theirs)).toBe(true);
      expect(c.isSenderMessage(theirs)).toBe(false);

      c.loggedInUser = me();
      expect(c.getLatestReceiverMessage([mine])).toBeUndefined();
      expect(c.isReceiverMessage(mine)).toBe(false);
      expect(c.isSenderMessage(mine)).toBe(true);
    });

    it('retries nothing when the receipt lands first time', async () => {
      const { c, svc } = setup();
      const message = makeMessage({ id: 60 });

      await c.markAsReadWithRetry(message);

      expect(svc['markAsRead']).toHaveBeenCalledTimes(1);
    });

    it('gives up after the retry budget and reports an SDK exception', async () => {
      const { c, svc } = setup();
      vi.spyOn(CometChatLogger, 'error').mockImplementation(() => undefined);
      vi.spyOn(CometChatLogger, 'warn').mockImplementation(() => undefined);
      const exception = new CometChat.CometChatException({
        code: 'ERR_NO_NET',
        message: 'offline',
      });
      svc['markAsRead'].mockRejectedValue(exception);
      const errors = collect<CometChat.CometChatException>(c.error);

      await c.markAsReadWithRetry(makeMessage({ id: 61 }), 2);

      expect(errors).toEqual([exception]);
    });

    it('does not report a plain receipt failure as an SDK exception', async () => {
      const { c, svc } = setup();
      vi.spyOn(CometChatLogger, 'error').mockImplementation(() => undefined);
      vi.spyOn(CometChatLogger, 'warn').mockImplementation(() => undefined);
      svc['markAsRead'].mockRejectedValue(new Error('plain'));
      const errors = collect<CometChat.CometChatException>(c.error);

      await c.markAsReadWithRetry(makeMessage({ id: 62 }), 2);

      expect(errors).toEqual([]);
    });

    it('republishes a read message on the event bus', () => {
      const { c } = setup();
      const message = makeMessage({ id: 70 });
      const read = collect<CometChat.BaseMessage>(CometChatMessageEvents.ccMessageRead);

      c.notifyMessagesRead(message);

      expect(read).toEqual([message]);
    });

    it('reports a receipt exception, and ignores a non-SDK error', () => {
      const { c } = setup();
      vi.spyOn(CometChatLogger, 'error').mockImplementation(() => undefined);
      const errors = collect<CometChat.CometChatException>(c.error);
      const exception = new CometChat.CometChatException({ code: 'ERR', message: 'bad' });

      c.handleReceiptError(exception, 'markAsRead');
      c.handleReceiptError(new Error('plain') as any, 'markAsRead');

      expect(errors).toEqual([exception]);
    });
  });

  // -------------------------------------------------------------------------
  describe('unread count propagation', () => {
    it('clears the conversation badge and every local unread marker at zero', () => {
      const { c } = setup();
      c.user = new CometChat.User('peer');
      const conversations = TestBed.inject(ConversationsService);
      const update = vi
        .spyOn(conversations, 'updateConversationUnreadCount')
        .mockImplementation(() => undefined);
      c.unreadDividerMessageId.set(9);
      c.markedAsUnreadCount.set(4);
      c.showScrollToBottom.set(true);
      c.showNewMessagesBanner.set(true);
      c.newMessagesCount.set(4);

      c.notifyUnreadCountChange(0);

      expect(update).toHaveBeenCalledWith('peer', 0);
      expect(c.unreadDividerMessageId()).toBeNull();
      expect(c.markedAsUnreadCount()).toBe(0);
      expect(c.showScrollToBottom()).toBe(false);
      expect(c.showNewMessagesBanner()).toBe(false);
      expect(c.newMessagesCount()).toBe(0);
    });

    it('keeps the local markers when the count is still non-zero', () => {
      const { c } = setup();
      c.group = makeGroup('guid1');
      const conversations = TestBed.inject(ConversationsService);
      const update = vi
        .spyOn(conversations, 'updateConversationUnreadCount')
        .mockImplementation(() => undefined);
      c.unreadDividerMessageId.set(9);

      c.notifyUnreadCountChange(3);

      expect(update).toHaveBeenCalledWith('guid1', 3);
      expect(c.unreadDividerMessageId()).toBe(9);
    });

    it('skips the badge with no conversation selected', () => {
      const { c } = setup();
      const conversations = TestBed.inject(ConversationsService);
      const update = vi
        .spyOn(conversations, 'updateConversationUnreadCount')
        .mockImplementation(() => undefined);

      c.notifyUnreadCountChange(0);

      expect(update).not.toHaveBeenCalled();
    });

    it('derives the conversation id and type from whichever chat is open', () => {
      const { c } = setup();

      expect(c.getConversationId()).toBeNull();
      expect(c.getConversationType()).toBe('');

      c.user = new CometChat.User('peer');
      expect(c.getConversationId()).toBe('peer');
      expect(c.getConversationType()).toBe(CometChat.RECEIVER_TYPE.USER);

      c.user = undefined;
      c.group = makeGroup('guid1');
      expect(c.getConversationId()).toBe('guid1');
      expect(c.getConversationType()).toBe(CometChat.RECEIVER_TYPE.GROUP);
    });
  });

  // -------------------------------------------------------------------------
  describe('notification sound', () => {
    it('plays for an incoming message, then throttles the next one', () => {
      const { c } = setup();
      vi.spyOn(CometChatSoundManager, 'play').mockImplementation(() => undefined);
      c.loggedInUser = me();
      const incoming = makeMessage({ senderUid: 'peer' });

      expect(c.shouldPlaySound(incoming)).toBe(true);
      c.playMessageSound();
      expect(c.shouldPlaySound(incoming)).toBe(false);
    });

    it('stays silent for own messages and when sound is disabled', () => {
      const { c } = setup();
      c.loggedInUser = me();

      expect(c.shouldPlaySound(makeMessage({ senderUid: ME }))).toBe(false);

      c.disableSoundForMessages = true;
      expect(c.shouldPlaySound(makeMessage({ senderUid: 'peer' }))).toBe(false);
    });

    it('passes the configured custom sound through to the sound manager', () => {
      const { c } = setup();
      const play = vi.spyOn(CometChatSoundManager, 'play').mockImplementation(() => undefined);

      c.playMessageSound();
      expect(play).toHaveBeenLastCalledWith('incomingMessage', null);

      c.customSoundForMessages = 'ping.wav';
      c.playMessageSound();
      expect(play).toHaveBeenLastCalledWith('incomingMessage', 'ping.wav');
    });

    it('swallows a playback failure', () => {
      const { c } = setup();
      const logged = vi.spyOn(CometChatLogger, 'error').mockImplementation(() => undefined);
      vi.spyOn(CometChatSoundManager, 'play').mockImplementation(() => {
        throw new Error('no audio device');
      });

      c.playMessageSound();

      expect(logged).toHaveBeenCalled();
      expect(c.lastSoundPlayedAt).toBeGreaterThan(0);
    });
  });

  // -------------------------------------------------------------------------
  describe('defensive wrappers', () => {
    it('reports "at bottom" when the scroll state cannot be read', () => {
      const { c } = setup();
      c.isAtBottom.set(false);

      expect(c.safeCheckScrollPosition()).toBe(false);

      c.isAtBottom = () => {
        throw new Error('detached');
      };
      expect(c.safeCheckScrollPosition()).toBe(true);
    });

    it('never lets an unread-count notification escape', () => {
      const { c } = setup();
      c.markedAsUnreadCount.set(2);

      c.safeEmitUnreadCountChange(0);
      expect(c.markedAsUnreadCount()).toBe(0);

      // This catch block is empty in the source, so statement coverage cannot
      // show it ran — the swallow has to be asserted directly.
      const boom = vi.fn(() => {
        throw new Error('listener threw');
      });
      c.notifyUnreadCountChange = boom;
      expect(() => c.safeEmitUnreadCountChange(0)).not.toThrow();
      expect(boom).toHaveBeenCalledWith(0);
    });

    it('logs a bubble render error without touching list state', () => {
      const { c } = setup();
      const logged = vi.spyOn(CometChatLogger, 'error').mockImplementation(() => undefined);
      c.listState.set(States.loaded);

      c.onBubbleError({ componentName: 'TextBubble', error: new Error('render') } as any);

      expect(logged).toHaveBeenCalled();
      expect(c.listState()).toBe(States.loaded);
    });
  });

  // -------------------------------------------------------------------------
  describe('list mutation passthrough', () => {
    it('adds and removes a temporary message', () => {
      const { c } = setup();
      const temp = makeMessage({ id: 101 });

      c.addMessage(temp);
      expect(c.messages()).toEqual([temp]);
      expect(c.hasMessages()).toBe(true);

      c.removeMessage(101);
      expect(c.messages()).toEqual([]);
      expect(c.hasMessages()).toBe(false);
    });

    it('hides the AI panels once the user sends something', () => {
      const { c } = setup();
      c.hideSmartReplies.set(false);
      c.hideConversationStarters.set(false);

      c.onMessageSent();

      expect(c.hideSmartReplies()).toBe(true);
      expect(c.hideConversationStarters()).toBe(true);
    });

    it('forwards a smart reply and a starter to the composer', () => {
      const { c } = setup();
      const composed = collect<string>(CometChatUIEvents.ccComposeMessage);
      const replies = collect<string>(c.smartReplyClick);
      const starters = collect<string>(c.conversationStarterClick);

      c.onSmartReplyClick('Sure!');
      c.onConversationStarterClick('Hello there');

      expect(replies).toEqual(['Sure!']);
      expect(starters).toEqual(['Hello there']);
      expect(composed).toEqual(['Sure!', 'Hello there']);
      expect(c.hideSmartReplies()).toBe(true);
      expect(c.hideConversationStarters()).toBe(true);
    });

    it('dismisses the smart replies panel on close, and accepts a typing ping', () => {
      const { c } = setup();
      c.hideSmartReplies.set(false);

      c.onSmartRepliesClose();
      c.onUserTyping();

      expect(c.hideSmartReplies()).toBe(true);
    });

    it('jumps to the bottom and clears the new-messages banner', () => {
      const { c } = setup();
      c.showNewMessagesBanner.set(true);
      c.newMessagesCount.set(3);

      c.onNewMessagesBannerClick();

      expect(c.showNewMessagesBanner()).toBe(false);
      expect(c.newMessagesCount()).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  describe('delete and flag dialogs', () => {
    it('opens the delete confirmation for the chosen message', () => {
      const { c } = setup();
      const message = makeMessage({ id: 200 });

      c.showDeleteConfirmation(message);

      expect(c.messageToDelete()).toBe(message);
      expect(c.showDeleteConfirmDialog()).toBe(true);
    });

    it('deletes, announces and closes on confirm', async () => {
      const { c, svc } = setup();
      const message = makeMessage({ id: 201 });
      c.showDeleteConfirmation(message);
      const deleted = collect<CometChat.BaseMessage>(CometChatMessageEvents.ccMessageDeleted);

      await c.handleDeleteConfirm();

      expect(svc['deleteMessage']).toHaveBeenCalledWith(201);
      expect(deleted).toHaveLength(1);
      expect(deleted[0].getDeletedAt()).toBeGreaterThan(0);
      expect(c.showDeleteConfirmDialog()).toBe(false);
      expect(c.messageToDelete()).toBeNull();
      expect(c.isDeleting()).toBe(false);
      expect(c.inlineToastText()).toBe(
        CometChatLocalize.getLocalizedString('message_list_message_deleted')
      );
    });

    it('reports a failed delete and leaves the dialog open', async () => {
      const { c, svc } = setup();
      vi.spyOn(CometChatLogger, 'error').mockImplementation(() => undefined);
      const failure = new Error('server refused');
      (CometChat.deleteMessage as any).mockRejectedValueOnce(failure);
      c.showDeleteConfirmation(makeMessage({ id: 202 }));
      const errors = collect<CometChat.CometChatException>(c.error);

      await c.handleDeleteConfirm();

      expect(errors).toEqual([failure]);
      expect(svc['deleteMessage']).not.toHaveBeenCalled();
      expect(c.showDeleteConfirmDialog()).toBe(true);
      expect(c.isDeleting()).toBe(false);
    });

    it('does nothing on confirm with no message selected', async () => {
      const { c, svc } = setup();

      await c.handleDeleteConfirm();

      expect(svc['deleteMessage']).not.toHaveBeenCalled();
      expect(c.isDeleting()).toBe(false);
    });

    it('closes the delete dialog on cancel', () => {
      const { c } = setup();
      c.showDeleteConfirmation(makeMessage());

      c.handleDeleteCancel();

      expect(c.showDeleteConfirmDialog()).toBe(false);
      expect(c.messageToDelete()).toBeNull();
    });

    it('labels the delete dialog from the localization bundle', () => {
      const { c } = setup();

      expect(c.getDeleteDialogTitle()).toBe(
        CometChatLocalize.getLocalizedString('message_delete_title')
      );
      expect(c.getDeleteDialogSubtitle()).toBe(
        CometChatLocalize.getLocalizedString('message_delete_subtitle')
      );
      expect(c.getDeleteDialogConfirmText()).toBe(
        CometChatLocalize.getLocalizedString('message_delete_confirm_yes')
      );
      expect(c.getDeleteDialogCancelText()).toBe(
        CometChatLocalize.getLocalizedString('message_delete_confirm_no')
      );
    });

    it('opens the flag dialog for the chosen message', () => {
      const { c } = setup();
      const message = makeMessage({ id: 210 });

      c.showFlagConfirmation(message);

      expect(c.messageToFlag()).toBe(message);
      expect(c.showFlagMessageDialog()).toBe(true);
    });

    it('reports the message and closes the flag dialog', async () => {
      const { c, svc } = setup();
      const message = makeMessage({ id: 211 });
      c.showFlagConfirmation(message);

      await c.handleFlagConfirm({ message, reasonId: 'spam', remark: 'bad' });

      expect(svc['flagMessage']).toHaveBeenCalledWith(message, 'spam', 'bad');
      expect(c.showFlagMessageDialog()).toBe(false);
      expect(c.messageToFlag()).toBeNull();
      expect(c.isFlagging()).toBe(false);
      expect(c.inlineToastText()).toBe(
        CometChatLocalize.getLocalizedString('flag_message_reported')
      );
    });

    it('surfaces a failed report as an error toast', async () => {
      const { c, svc } = setup();
      vi.spyOn(CometChatLogger, 'error').mockImplementation(() => undefined);
      const failure = new Error('report failed');
      svc['flagMessage'].mockRejectedValue(failure);
      const message = makeMessage({ id: 212 });
      c.showFlagConfirmation(message);
      const errors = collect<CometChat.CometChatException>(c.error);

      await c.handleFlagConfirm({ message, reasonId: 'spam', remark: '' });

      expect(errors).toEqual([failure]);
      expect(c.inlineToastType()).toBe(ToastType.error);
      expect(c.showFlagMessageDialog()).toBe(true);
      expect(c.isFlagging()).toBe(false);
    });

    it('closes the flag dialog on cancel', () => {
      const { c } = setup();
      c.showFlagConfirmation(makeMessage());

      c.handleFlagCancel();

      expect(c.showFlagMessageDialog()).toBe(false);
      expect(c.messageToFlag()).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  describe('message interactions', () => {
    it('starts an edit for a held text message, scoped to the thread', () => {
      const { c, svc } = setup();
      const message = makeMessage({ id: 300 });
      svc.messages.set([message]);
      c.parentMessage = makeMessage({ id: 299 });
      const edits = collect<any>(CometChatMessageEvents.ccMessageEdited);

      c.onEditMessage(300);
      c.onEditMessage(9999);

      expect(edits).toEqual([
        { message, status: MessageStatus.inprogress, parentMessageId: 299 },
      ]);
    });

    it('starts a reply and raises the reply output', () => {
      const { c, svc } = setup();
      const message = makeMessage({ id: 301 });
      svc.messages.set([message]);
      const replies = collect<any>(CometChatMessageEvents.ccReplyToMessage);
      const clicks = collect<CometChat.BaseMessage>(c.replyClick);

      c.onReplyMessage(301);
      c.onReplyMessage(9999);

      expect(replies).toEqual([
        { message, status: MessageStatus.inprogress, parentMessageId: null },
      ]);
      expect(clicks).toEqual([message]);
    });

    it('scrolls to a quoted message already held, and fetches one that is not', async () => {
      const { c, svc } = setup();
      const quoted = makeMessage({ id: 302 });
      svc.messages.set([quoted]);
      const { container, row } = makeListDom(302);
      pinViewChild(c, 'listContainer', { nativeElement: container });

      c.onReplyPreviewClick(quoted);
      expect(row.classList.contains('cometchat-message-list__message--highlighted')).toBe(true);
      expect(svc['fetchMessagesAroundId']).not.toHaveBeenCalled();

      c.onReplyPreviewClick(makeMessage({ id: 303 }));
      await tick();
      expect(svc['fetchMessagesAroundId']).toHaveBeenCalledWith(303);
    });

    it('ignores a quoted message with no id, and logs a failed fetch', async () => {
      const { c, svc } = setup();
      vi.spyOn(CometChatLogger, 'error').mockImplementation(() => undefined);
      const idless = makeMessage();
      idless.getId = () => 0;

      c.onReplyPreviewClick(idless);
      expect(svc['fetchMessagesAroundId']).not.toHaveBeenCalled();

      svc['fetchMessagesAroundId'].mockRejectedValue(new Error('gone'));
      c.onReplyPreviewClick(makeMessage({ id: 304 }));
      await tick();
      expect(svc['fetchMessagesAroundId']).toHaveBeenCalledWith(304);
    });

    it('opens and closes the message-information panel', () => {
      const { c, svc } = setup();
      const message = makeMessage({ id: 305 });
      svc.messages.set([message]);

      c.onMessageInfo(9999);
      expect(c.showMessageInfo()).toBe(false);

      c.onMessageInfo(305);
      expect(c.messageForInfo()).toBe(message);
      expect(c.showMessageInfo()).toBe(true);

      c.closeMessageInfo();
      expect(c.showMessageInfo()).toBe(false);
      expect(c.messageForInfo()).toBeNull();
    });

    it('copies text with mentions expanded to display names', async () => {
      const { c } = setup();
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
      const mentioned = new CometChat.User('superhero1');
      mentioned.setName('Iron Man');
      const message = makeMessage({ id: 310, text: 'hey <@uid:superhero1> and <@all:team>' });
      message.setMentionedUsers([mentioned]);

      await c.copyMessageToClipboard(message);

      expect(writeText).toHaveBeenCalledWith('hey @Iron Man and @team');
      expect(c.inlineToastText()).toBe(
        CometChatLocalize.getLocalizedString('message_list_message_copied')
      );
    });

    it('skips a message with nothing copyable, and reports a clipboard failure', async () => {
      const { c } = setup();
      vi.spyOn(CometChatLogger, 'error').mockImplementation(() => undefined);
      const writeText = vi.fn().mockRejectedValue(new Error('denied'));
      Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });

      // Media with no caption: there is no text to put on the clipboard.
      await c.copyMessageToClipboard(makeMessage({ id: 311, type: 'image', text: '' }));
      expect(writeText).not.toHaveBeenCalled();
      expect(c.inlineToastText()).toBeNull();

      await c.copyMessageToClipboard(makeMessage({ id: 312, text: 'plain' }));
      expect(c.inlineToastType()).toBe(ToastType.error);
    });

    it('opens a private chat with another member of the group', () => {
      const { c } = setup();
      c.loggedInUser = me();
      c.group = makeGroup('guid1');
      const message = makeMessage({ id: 320, senderUid: 'peer' });
      const opened = collect<any>(CometChatUIEvents.ccOpenChat);
      const clicks = collect<any>(c.messagePrivatelyClick);

      c.handleMessagePrivately(message);

      expect(opened).toHaveLength(1);
      expect(opened[0].user.getUid()).toBe('peer');
      expect(clicks).toHaveLength(1);
      expect(clicks[0].message).toBe(message);
    });

    it('offers no private chat outside a group or on the user\'s own message', () => {
      const { c } = setup();
      c.loggedInUser = me();
      const opened = collect<any>(CometChatUIEvents.ccOpenChat);

      c.handleMessagePrivately(makeMessage({ senderUid: 'peer' }));

      c.group = makeGroup('guid1');
      c.handleMessagePrivately(makeMessage({ senderUid: ME }));

      expect(opened).toEqual([]);
    });

    it('routes an action-sheet choice to the matching handler', () => {
      const { c, svc } = setup();
      const message = makeMessage({ id: 330 });
      svc.messages.set([message]);
      const threadClicks = collect<CometChat.BaseMessage>(c.threadRepliesClick);

      c.handleOptionClick({ id: CometChatUIKitConstants.MessageOption.deleteMessage } as any, message);
      expect(c.showDeleteConfirmDialog()).toBe(true);

      c.handleOptionClick({ id: CometChatUIKitConstants.MessageOption.flagMessage } as any, message);
      expect(c.showFlagMessageDialog()).toBe(true);

      c.handleOptionClick({ id: CometChatUIKitConstants.MessageOption.replyInThread } as any, message);
      expect(threadClicks).toEqual([message]);

      c.handleOptionClick({ id: CometChatUIKitConstants.MessageOption.messageInformation } as any, message);
      expect(c.messageForInfo()).toBe(message);

      c.handleOptionClick({ id: 'unknown-option' } as any, message);
      expect(c.emojiKeyboardMessage()).toBeNull();
    });

    it('routes a pin choice to the pin/save service', () => {
      const { c, pinSave } = setup();
      const message = makeMessage({ id: 331 });

      c.handleOptionClick({ id: CometChatUIKitConstants.MessageOption.pinMessage } as any, message);
      expect(pinSave.run).toHaveBeenCalledWith('pin', message);

      c.handleOptionClick({ id: CometChatUIKitConstants.MessageOption.unpinMessage } as any, message);
      expect(c.pendingPinSave()).toEqual({ action: 'unpin', message });
    });

    it('marks a message unread and raises the conversation update', async () => {
      const { c, svc } = setup();
      const message = makeMessage({ id: 340 });
      const conversation = { getUnreadMessageCount: () => 2 } as any;
      svc['markAsUnread'].mockResolvedValue(conversation);
      const updates = collect<any>(CometChatConversationEvents.ccUpdateConversation);

      await c.markMessageAsUnread(message);

      expect(c.unreadDividerMessageId()).toBe(340);
      expect(c.markedAsUnreadCount()).toBe(2);
      expect(c.showScrollToBottom()).toBe(true);
      expect(updates).toEqual([conversation]);
    });

    it('refuses to mark the same message unread twice', async () => {
      const { c, svc } = setup();
      const message = makeMessage({ id: 341 });
      svc['markAsUnread'].mockResolvedValue({ getUnreadMessageCount: () => 0 } as any);

      await c.markMessageAsUnread(message);
      await c.markMessageAsUnread(message);

      expect(svc['markAsUnread']).toHaveBeenCalledTimes(1);
      // The server reported nothing unread, so no badge was raised.
      expect(c.markedAsUnreadCount()).toBe(0);
      expect(c.showScrollToBottom()).toBe(false);
    });

    it('shows a toast when marking unread fails', async () => {
      const { c, svc } = setup();
      vi.spyOn(CometChatLogger, 'error').mockImplementation(() => undefined);
      svc['markAsUnread'].mockRejectedValue(new Error('rejected'));

      await c.markMessageAsUnread(makeMessage({ id: 342 }));

      expect(c.inlineToastType()).toBe(ToastType.error);
      expect(c.inlineToastText()).toBe(
        CometChatLocalize.getLocalizedString('something_went_wrong')
      );
      expect(c.unreadDividerMessageId()).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  describe('reactions and the emoji keyboard', () => {
    it('anchors the keyboard beside the bubble it was opened from', async () => {
      const { c } = setup();
      c.loggedInUser = me();
      const message = makeMessage({ id: 400, senderUid: 'peer' });
      const { container } = makeListDom(400);
      pinViewChild(c, 'listContainer', { nativeElement: container });

      c.showEmojiKeyboardForMessage(message);
      expect(c.emojiKeyboardMessage()).toBe(message);

      await waitFor(() => c.emojiKeyboardPosition() !== null, 'keyboard anchored');
      expect(c.emojiKeyboardPosition()?.side).toBe('right');
    });

    it('anchors an outgoing bubble\'s keyboard on the other side', () => {
      const { c } = setup();
      c.loggedInUser = me();
      const message = makeMessage({ id: 401, senderUid: ME });
      const { container } = makeListDom(401);
      pinViewChild(c, 'listContainer', { nativeElement: container });

      c.calculateEmojiKeyboardPosition(message);

      expect(c.emojiKeyboardPosition()?.side).toBe('left');
    });

    it('positions nothing when the bubble cannot be found', () => {
      const { c } = setup();
      const message = makeMessage({ id: 402 });

      pinViewChild(c, 'listContainer', undefined);
      c.calculateEmojiKeyboardPosition(message);
      expect(c.emojiKeyboardPosition()).toBeNull();

      const detached = document.createElement('div');
      pinViewChild(c, 'listContainer', { nativeElement: detached });
      c.calculateEmojiKeyboardPosition(message);
      expect(c.emojiKeyboardPosition()).toBeNull();

      const { container } = makeListDom(999);
      pinViewChild(c, 'listContainer', { nativeElement: container });
      c.calculateEmojiKeyboardPosition(message);
      expect(c.emojiKeyboardPosition()).toBeNull();
    });

    it('adds the chosen emoji and dismisses the keyboard', async () => {
      const { c, svc } = setup();
      const message = makeMessage({ id: 410 });
      c.emojiKeyboardMessage.set(message);
      c.emojiKeyboardPosition.set({ top: 0, left: 0, side: 'right' });

      await c.onEmojiSelected('🎉');

      expect(svc['addReaction']).toHaveBeenCalledWith(410, '🎉');
      expect(c.emojiKeyboardMessage()).toBeNull();
      expect(c.emojiKeyboardPosition()).toBeNull();
    });

    it('declines to react with no message or an unsent one', async () => {
      const { c, svc } = setup();
      vi.spyOn(CometChatLogger, 'warn').mockImplementation(() => undefined);

      await c.onEmojiSelected('🎉');
      expect(svc['addReaction']).not.toHaveBeenCalled();

      const unsent = makeMessage({ id: 411 });
      unsent.getId = () => 0;
      c.emojiKeyboardMessage.set(unsent);
      await c.onEmojiSelected('🎉');
      expect(svc['addReaction']).not.toHaveBeenCalled();
    });

    it('swallows a failed reaction write and still dismisses the keyboard', async () => {
      const { c, svc } = setup();
      const logged = vi.spyOn(CometChatLogger, 'error').mockImplementation(() => undefined);
      svc['addReaction'].mockRejectedValue(new Error('rate limited'));
      c.emojiKeyboardMessage.set(makeMessage({ id: 412 }));

      // The rejection must not surface: resolving at all is half the assertion.
      await expect(c.onEmojiSelected('🎉')).resolves.toBeUndefined();

      expect(svc['addReaction']).toHaveBeenCalledWith(412, '🎉');
      expect(logged).toHaveBeenCalled();
      expect(c.emojiKeyboardMessage()).toBeNull();
    });

    it('closes the keyboard without reacting', () => {
      const { c } = setup();
      c.emojiKeyboardMessage.set(makeMessage());
      c.emojiKeyboardPosition.set({ top: 1, left: 2, side: 'left' });

      c.onEmojiKeyboardClose();

      expect(c.emojiKeyboardMessage()).toBeNull();
      expect(c.emojiKeyboardPosition()).toBeNull();
    });

    it('toggles an existing reaction from the bubble', async () => {
      const { c, svc } = setup();
      const message = makeMessage({ id: 420 });
      const mine = { getReaction: () => '👍', getReactedByMe: () => true } as any;
      const theirs = { getReaction: () => '🎉', getReactedByMe: () => false } as any;
      const clicks = collect<any>(c.reactionClick);

      await c.onBubbleReactionClick({ reaction: mine, message });
      expect(svc['removeReaction']).toHaveBeenCalledWith(420, '👍');

      await c.onBubbleReactionClick({ reaction: theirs, message });
      expect(svc['addReaction']).toHaveBeenCalledWith(420, '🎉');

      expect(clicks).toHaveLength(2);
    });

    it('still raises the reaction output when the write fails', async () => {
      const { c, svc } = setup();
      vi.spyOn(CometChatLogger, 'error').mockImplementation(() => undefined);
      svc['addReaction'].mockRejectedValue(new Error('nope'));
      const clicks = collect<any>(c.reactionClick);
      const event = {
        reaction: { getReaction: () => '🎉', getReactedByMe: () => false } as any,
        message: makeMessage({ id: 421 }),
      };

      await c.onBubbleReactionClick(event);

      expect(svc['addReaction']).toHaveBeenCalledWith(421, '🎉');
      // The output is the bubble's cue to re-render; it fires on the failure path
      // too, so the optimistic chip the service reverted is redrawn.
      expect(clicks).toEqual([event]);
    });

    it('removes a reaction chosen from the reaction list', async () => {
      const { c, svc } = setup();
      const message = makeMessage({ id: 430 });
      const clicks = collect<any>(c.reactionListItemClick);

      await c.onBubbleReactionListItemClick({
        reaction: { getReaction: () => '👍' } as any,
        message,
      });

      expect(svc['removeReaction']).toHaveBeenCalledWith(430, '👍');
      expect(clicks).toHaveLength(1);
    });

    it('swallows a failed reaction removal but still raises the output', async () => {
      const { c, svc } = setup();
      const logged = vi.spyOn(CometChatLogger, 'error').mockImplementation(() => undefined);
      svc['removeReaction'].mockRejectedValue(new Error('nope'));
      const clicks = collect<any>(c.reactionListItemClick);
      const event = {
        reaction: { getReaction: () => '👍' } as any,
        message: makeMessage({ id: 431 }),
      };

      await c.onBubbleReactionListItemClick(event);

      expect(svc['removeReaction']).toHaveBeenCalledWith(431, '👍');
      expect(logged).toHaveBeenCalled();
      expect(clicks).toEqual([event]);
    });
  });

  // -------------------------------------------------------------------------
  describe('translation', () => {
    it('translates a text message into the preferred language and toasts', async () => {
      const { c, svc } = setup();
      const message = makeMessage({ id: 500 });
      c.setPreferredTranslationLanguage('es');

      await c.translateMessage(message);

      expect(svc['translateMessage']).toHaveBeenCalledWith(message, 'es');
      expect(c.getTranslatedText(500)).toBe('hola');
      expect(c.isMessageTranslated(500)).toBe(true);
      expect(c.isMessageTranslating(500)).toBe(false);
      expect(c.inlineToastText()).toBe(
        CometChatLocalize.getLocalizedString('message_list_message_translated')
      );
    });

    it('a second request removes the translation again', async () => {
      const { c } = setup();
      const message = makeMessage({ id: 501 });

      await c.translateMessage(message);
      await c.translateMessage(message);

      expect(c.isMessageTranslated(501)).toBe(false);
      expect(c.getTranslatedText(501)).toBeUndefined();
    });

    it('declines a non-text message and a request already in flight', async () => {
      const { c, svc } = setup();

      await c.translateMessage(makeMessage({ id: 502, type: 'image' }));
      expect(svc['translateMessage']).not.toHaveBeenCalled();

      c.translatingMessages.set(new Set([503]));
      await c.translateMessage(makeMessage({ id: 503 }));
      expect(svc['translateMessage']).not.toHaveBeenCalled();
      expect(c.isMessageTranslating(503)).toBe(true);
    });

    it('reports a failed translation and releases the in-flight flag', async () => {
      const { c, svc } = setup();
      vi.spyOn(CometChatLogger, 'error').mockImplementation(() => undefined);
      svc['translateMessage'].mockRejectedValue(new Error('no provider'));

      await c.translateMessage(makeMessage({ id: 504 }));

      expect(c.isMessageTranslating(504)).toBe(false);
      expect(c.isMessageTranslated(504)).toBe(false);
      expect(c.inlineToastType()).toBe(ToastType.error);
    });

    it('defaults the language to the browser locale, stripping the region', () => {
      const { c } = setup();
      // Asserting against fixed locales rather than re-deriving the answer from
      // navigator — the old version recomputed the implementation's own
      // expression, so it would have passed for any implementation.
      const original = Object.getOwnPropertyDescriptor(Navigator.prototype, 'language');
      const stubLocale = (value: string | undefined) =>
        Object.defineProperty(navigator, 'language', {
          configurable: true,
          get: () => value,
        });

      try {
        // The signal is seeded from this method while the field is built.
        expect(c.preferredTranslationLanguage()).toBe(c.getDefaultTranslationLanguage());

        stubLocale('pt-BR');
        expect(c.getDefaultTranslationLanguage()).toBe('pt');

        stubLocale('ja');
        expect(c.getDefaultTranslationLanguage()).toBe('ja');

        // No locale at all falls back to English.
        stubLocale(undefined);
        expect(c.getDefaultTranslationLanguage()).toBe('en');
      } finally {
        delete (navigator as any).language;
        if (original) Object.defineProperty(Navigator.prototype, 'language', original);
      }
    });
  });

  // -------------------------------------------------------------------------
  describe('track-by keys', () => {
    it('keys a row on the item key so a receipt does not rebuild the bubble', () => {
      const { c } = setup();

      expect(c.trackByItem(0, { type: 'message', key: 'msg-42' } as MessageListItem)).toBe('msg-42');
      expect(c.trackByItem(3, { type: 'date-separator', key: 'sep-2024-4-17' } as MessageListItem)).toBe(
        'sep-2024-4-17'
      );
    });

    it('keys a message on its id, falling back to the client muid', () => {
      const { c } = setup();
      const sent = makeMessage({ id: 600 });
      const optimistic = makeMessage({ id: 601, muid: 'muid-xyz' });
      optimistic.getId = () => 0;

      expect(c.trackByMessage(0, sent)).toBe(600);
      expect(c.trackByMessage(1, optimistic)).toBe('muid-xyz');
    });
  });
});
