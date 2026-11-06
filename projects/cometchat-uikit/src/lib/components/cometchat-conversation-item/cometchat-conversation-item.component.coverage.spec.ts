/**
 * Behavioural coverage for CometChatConversationItemComponent.
 *
 * The sibling spec builds the component with `Object.create()`, which skips every field
 * initializer and all DI — so the signals, the `computed()` precedence chain and the
 * constructor-injected services never exist there. This spec instead constructs the real class
 * inside a TestBed injection context, so `inject(COMETCHAT_GLOBAL_CONFIG)` and the two
 * constructor services behave as they do in an app.
 *
 * Nothing here renders the template: the row pulls in avatar/date/context-menu children whose
 * own SDK needs are irrelevant to the subtitle, receipt and menu logic under test. Methods are
 * driven directly on the instance, which is the convention in this repo for private members.
 */

// The real Calls SDK reaches for JitsiMeetJS, which jsdom does not provide. Shape mirrors the
// global setup mock so nothing that transitively imports it regresses.
vi.mock('@cometchat/calls-sdk-javascript', () => {
  class CallSettingsBuilder {
    enableDefaultLayout() { return this; }
    setIsAudioOnlyCall() { return this; }
    setCallListener() { return this; }
    build() { return {}; }
  }
  class OngoingCallListener {
    constructor(callbacks: unknown) { Object.assign(this as object, { callbacks }); }
  }
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

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { CometChat } from '@cometchat/chat-sdk-javascript';

import { CometChatConversationItemComponent } from './cometchat-conversation-item.component';
import { COMETCHAT_GLOBAL_CONFIG, GlobalConfig } from '../../services/global-config.service';
import { ConversationSubtitleService } from '../../services/conversation-subtitle.service';
import { FormatterConfigService } from '../../services/formatter-config.service';
import { HtmlSanitizerService } from '../../services/html-sanitizer.service';
import { CometChatMentionsFormatter } from '../../formatters/cometchat-mentions-formatter';
import { CometChatTextFormatter } from '../../formatters/cometchat-text-formatter';
import { CometChatLocalize } from '../../resources/CometChatLocalize/cometchat-localize';
import { CometChatUIKitConstants } from '../../constants';
import { CometChatLogger } from '../../utils/CometChatLogger';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

/** Marker meaning "register no COMETCHAT_GLOBAL_CONFIG provider at all". */
const NO_GLOBAL_CONFIG = Symbol('no-global-config');

interface Built {
  c: any;
  subtitleService: ConversationSubtitleService;
  formatterConfig: FormatterConfigService;
  sanitizer: HtmlSanitizerService;
}

function build(globalConfig: Partial<GlobalConfig> | null | typeof NO_GLOBAL_CONFIG = NO_GLOBAL_CONFIG): Built {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers:
      globalConfig === NO_GLOBAL_CONFIG
        ? []
        : [{ provide: COMETCHAT_GLOBAL_CONFIG, useValue: globalConfig }],
  });
  const formatterConfig = TestBed.inject(FormatterConfigService);
  const sanitizer = TestBed.inject(HtmlSanitizerService);
  const subtitleService = TestBed.inject(ConversationSubtitleService);
  const c = TestBed.runInInjectionContext(
    () => new CometChatConversationItemComponent(formatterConfig, sanitizer)
  ) as any;
  return { c, subtitleService, formatterConfig, sanitizer };
}

function makeUser(uid: string, name = uid, status = 'online'): CometChat.User {
  const u = new CometChat.User(uid);
  u.setName(name);
  u.setStatus(status as any);
  return u;
}

/** A user the component must treat as an AI agent (`getRole() === '@agentic'`). */
function makeAgentUser(uid = 'agent-1'): CometChat.User {
  const u = makeUser(uid, 'Support Agent');
  (u as any).getRole = () => '@agentic';
  return u;
}

function makeGroup(guid: string, name = guid): CometChat.Group {
  return new CometChat.Group(guid, name, CometChat.GROUP_TYPE.PUBLIC, '');
}

type Msg = Record<string, any>;

/** A BaseMessage-shaped stub carrying only the accessors this component calls. */
function makeMsg(overrides: Msg = {}): any {
  return {
    getId: () => 101,
    getType: () => 'text',
    getCategory: () => 'message',
    getDeletedAt: () => 0,
    getSentAt: () => 1700000000,
    getDeliveredAt: () => 0,
    getReadAt: () => 0,
    getSender: () => undefined,
    getText: () => '',
    getMentionedUsers: () => [],
    getMetadata: () => undefined,
    ...overrides,
  };
}

interface ConvSpec {
  with?: CometChat.User | CometChat.Group | null;
  lastMessage?: any;
  unread?: number | undefined;
  pinnedAt?: number;
  pinnedMissing?: boolean;
  throwOnWith?: boolean;
}

function makeConv(spec: ConvSpec = {}): CometChat.Conversation {
  const conv: Msg = {
    getConversationWith: () => {
      if (spec.throwOnWith) throw new Error('conversationWith unavailable');
      return spec.with === undefined ? null : spec.with;
    },
    getLastMessage: () => spec.lastMessage,
    getUnreadMessageCount: () => spec.unread,
  };
  if (!spec.pinnedMissing) {
    conv['isPinned'] = () => spec.pinnedAt ?? 0;
  }
  return conv as unknown as CometChat.Conversation;
}

/** Attaches a user conversation with the given last message and returns the component. */
function withMessage(c: any, lastMessage: any, conversationWith: CometChat.User | CometChat.Group = makeUser('u2', 'Bob')) {
  c.conversation = makeConv({ with: conversationWith, lastMessage });
  return c;
}

class StubFormatter extends CometChatTextFormatter {
  readonly id: string;
  constructor(
    id: string,
    private readonly transform: (t: string) => string = t => `<em>${t}</em>`,
    private readonly can = true
  ) {
    super();
    this.id = id;
  }
  getRegex(): RegExp { return /./g; }
  format(text: string): string { return this.transform(text); }
  override shouldFormat(): boolean { return this.can; }
}

class ExplodingFormatter extends CometChatTextFormatter {
  readonly id = 'exploding-formatter';
  getRegex(): RegExp { return /./g; }
  format(): string { throw new Error('formatter exploded'); }
}

const L = (key: string) => CometChatLocalize.getLocalizedString(key);

/**
 * Empties the formatter pipeline completely. Clearing the `textFormatters` input is not enough:
 * an empty input list makes the component fall back to FormatterConfigService's built-in
 * markdown + URL formatters, which count as "custom formatters" for subtitle purposes and so
 * force the HTML arm.
 */
function withoutFormatters(b: Built): any {
  b.formatterConfig.setDefaultFormatters([]);
  b.c.textFormatters = [];
  return b.c;
}

// ---------------------------------------------------------------------------

describe('CometChatConversationItemComponent — behavioural coverage', () => {
  let loggerError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // The global setup file installs the SDK statics as vi.fn()s; vitest's spyOn hands back
    // that same mock rather than wrapping it, so call history would otherwise leak between
    // tests and make "never calls the SDK" assertions pass or fail by ordering.
    vi.clearAllMocks();
    loggerError = vi.spyOn(CometChatLogger, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  // ==================== construction & real DI ====================

  describe('construction', () => {
    it('resolves its collaborators from DI and starts with documented defaults', () => {
      const { c, formatterConfig, sanitizer } = build();

      // The two constructor services must be the injector's singletons, not fresh objects.
      expect((c as any).formatterConfig).toBe(formatterConfig);
      expect((c as any).htmlSanitizer).toBe(sanitizer);
      expect((c as any).subtitleService).toBe(TestBed.inject(ConversationSubtitleService));
      // COMETCHAT_GLOBAL_CONFIG is injected optionally, so an app that never provides it
      // must still construct.
      expect((c as any).globalConfig).toBeNull();
      expect(c.isActive).toBe(false);
      expect(c.isSelected).toBe(false);
      expect(c.isFocused).toBe(false);
      expect(c.tabIndex).toBe(-1);
      expect(c.typingIndicator).toBeNull();
      expect(c.loggedInUser).toBeNull();
      expect(c.isHovered).toBe(false);
      expect(c.isMenuOpen).toBe(false);
      // Context menu is suppressed by default; every other flag defaults to "show".
      expect(c.disableDefaultContextMenu).toBe(true);
      expect(c.hideReceipts).toBe(false);
      expect(c.hideUserStatus).toBe(false);
      expect(c.hideGroupType).toBe(false);
      expect(c.textFormatters).toEqual([]);
    });
  });

  // ==================== input setters / getters ====================

  describe('boolean inputs', () => {
    it('round-trips each boolean input and records that it was set explicitly', () => {
      const { c } = build();
      // The "explicitly set" flag is the whole point of the setter: it is what makes a bound
      // input outrank the global config, so a setter that forgot it would read as unset.
      expect((c as any).hideReceiptsExplicitlySet()).toBe(false);
      expect((c as any).hideUserStatusExplicitlySet()).toBe(false);
      expect((c as any).hideGroupTypeExplicitlySet()).toBe(false);
      expect((c as any).disableDefaultContextMenuExplicitlySet()).toBe(false);

      c.hideReceipts = true;
      c.hideUserStatus = true;
      c.hideGroupType = true;
      c.disableDefaultContextMenu = false;

      expect(c.hideReceipts).toBe(true);
      expect(c.hideUserStatus).toBe(true);
      expect(c.hideGroupType).toBe(true);
      expect(c.disableDefaultContextMenu).toBe(false);
      expect((c as any).hideReceiptsExplicitlySet()).toBe(true);
      expect((c as any).hideUserStatusExplicitlySet()).toBe(true);
      expect((c as any).hideGroupTypeExplicitlySet()).toBe(true);
      expect((c as any).disableDefaultContextMenuExplicitlySet()).toBe(true);

      // Setting false must also count as explicit, or a deliberate "false" would be
      // overridden by a global config that says true.
      const fresh = build().c;
      fresh.hideReceipts = false;
      expect((fresh as any).hideReceiptsExplicitlySet()).toBe(true);
    });

    it('round-trips textFormatters and marks it explicitly set', () => {
      const { c } = build();
      const formatters = [new StubFormatter('x-formatter')];
      expect((c as any).textFormattersExplicitlySet()).toBe(false);
      c.textFormatters = formatters;
      expect(c.textFormatters).toBe(formatters);
      expect((c as any).textFormattersExplicitlySet()).toBe(true);
    });
  });

  // ==================== effective* precedence ====================

  describe('effective flag precedence', () => {
    it('falls back to documented defaults when no global config is provided', () => {
      const { c } = build();
      expect(c.effectiveHideReceipts()).toBe(false);
      expect(c.effectiveHideUserStatus()).toBe(false);
      expect(c.effectiveHideGroupType()).toBe(false);
      expect(c.effectiveDisableDefaultContextMenu()).toBe(true);
      expect(c.effectiveTextFormatters()).toEqual([]);
    });

    it('falls back to documented defaults when global config omits the keys', () => {
      const { c } = build({});
      expect(c.effectiveHideReceipts()).toBe(false);
      expect(c.effectiveHideUserStatus()).toBe(false);
      expect(c.effectiveHideGroupType()).toBe(false);
      expect(c.effectiveDisableDefaultContextMenu()).toBe(true);
      expect(c.effectiveTextFormatters()).toEqual([]);
    });

    it('reads global config when the input was never set', () => {
      const globalFormatters = [new StubFormatter('global-formatter')];
      const { c } = build({
        hideReceipts: true,
        hideUserStatus: true,
        hideGroupType: true,
        disableDefaultContextMenu: false,
        textFormatters: globalFormatters,
      });
      expect(c.effectiveHideReceipts()).toBe(true);
      expect(c.effectiveHideUserStatus()).toBe(true);
      expect(c.effectiveHideGroupType()).toBe(true);
      expect(c.effectiveDisableDefaultContextMenu()).toBe(false);
      expect(c.effectiveTextFormatters()).toBe(globalFormatters);
    });

    it('lets an explicit input win over the global config', () => {
      const localFormatters = [new StubFormatter('local-formatter')];
      const { c } = build({
        hideReceipts: true,
        hideUserStatus: true,
        hideGroupType: true,
        disableDefaultContextMenu: false,
        textFormatters: [new StubFormatter('global-formatter')],
      });
      c.hideReceipts = false;
      c.hideUserStatus = false;
      c.hideGroupType = false;
      c.disableDefaultContextMenu = true;
      c.textFormatters = localFormatters;
      expect(c.effectiveHideReceipts()).toBe(false);
      expect(c.effectiveHideUserStatus()).toBe(false);
      expect(c.effectiveHideGroupType()).toBe(false);
      expect(c.effectiveDisableDefaultContextMenu()).toBe(true);
      expect(c.effectiveTextFormatters()).toBe(localFormatters);
    });
  });

  // ==================== lifecycle ====================

  describe('ngOnInit', () => {
    it('resolves the logged-in user from the SDK when the input is absent', async () => {
      const { c } = build();
      const me = makeUser('me', 'Me');
      vi.spyOn(CometChat, 'getLoggedinUser').mockResolvedValue(me as any);
      await c.ngOnInit();
      expect(c.loggedInUser).toBe(me);
    });

    it('keeps the provided logged-in user and never calls the SDK', async () => {
      const { c } = build();
      const provided = makeUser('me', 'Me');
      const spy = vi.spyOn(CometChat, 'getLoggedinUser').mockResolvedValue(makeUser('other') as any);
      c.loggedInUser = provided;
      await c.ngOnInit();
      expect(spy).not.toHaveBeenCalled();
      expect(c.loggedInUser).toBe(provided);
    });

    it('logs and leaves loggedInUser null when the SDK lookup rejects', async () => {
      const { c } = build();
      const failure = new Error('not logged in');
      vi.spyOn(CometChat, 'getLoggedinUser').mockRejectedValue(failure);
      await c.ngOnInit();
      expect(c.loggedInUser).toBeNull();
      expect(loggerError).toHaveBeenCalledWith(
        'CometChatConversationItem',
        'Error getting logged-in user:',
        failure
      );
    });
  });

  describe('ngOnDestroy', () => {
    it('leaves the outputs usable, because the row subscribes to nothing', () => {
      const { c } = build();
      const conversation = makeConv({ with: makeUser('u1') });
      c.conversation = conversation;
      const clicks: unknown[] = [];
      c.itemClick.subscribe((v: unknown) => clicks.push(v));
      c.ngOnDestroy();
      c.handleClick();
      expect(clicks).toEqual([conversation]);
    });
  });

  // ==================== conversationWith and its derivatives ====================

  describe('conversationWith', () => {
    it('returns the participant for a user conversation', () => {
      const { c } = build();
      const user = makeUser('u1', 'Alice');
      c.conversation = makeConv({ with: user });
      expect(c.conversationWith).toBe(user);
      expect(c.isUserConversation).toBe(true);
      expect(c.isGroupConversation).toBe(false);
      expect(c.avatarName).toBe('Alice');
      expect(c.userStatus).toBe('online');
      expect(c.groupType).toBe('');
    });

    it('returns the group for a group conversation', () => {
      const { c } = build();
      const group = makeGroup('g1', 'Team');
      c.conversation = makeConv({ with: group });
      expect(c.conversationWith).toBe(group);
      expect(c.isUserConversation).toBe(false);
      expect(c.isGroupConversation).toBe(true);
      expect(c.avatarName).toBe('Team');
      expect(c.userStatus).toBe('');
      expect(c.groupType).toBe(CometChat.GROUP_TYPE.PUBLIC);
      expect(c.avatarImage).toBe('');
    });

    it('normalises a missing participant to null', () => {
      const { c } = build();
      c.conversation = makeConv({ with: null });
      expect(c.conversationWith).toBeNull();
      expect(c.avatarName).toBe('');
      expect(c.avatarImage).toBe('');
    });

    it('returns null when the conversation itself is not set yet', () => {
      const { c } = build();
      expect(c.conversationWith).toBeNull();
    });

    it('swallows an SDK failure and returns null', () => {
      const { c } = build();
      c.conversation = makeConv({ throwOnWith: true });
      expect(c.conversationWith).toBeNull();
      expect(c.isUserConversation).toBe(false);
    });
  });

  describe('isAgentConversation', () => {
    it('is true only for a user whose role is @agentic', () => {
      const { c } = build();
      c.conversation = makeConv({ with: makeAgentUser() });
      expect(c.isAgentConversation).toBe(true);
    });

    it('is false for a group, whatever its name', () => {
      const { c } = build();
      c.conversation = makeConv({ with: makeGroup('g1') });
      expect(c.isAgentConversation).toBe(false);
    });

    it('is false for a user with a different role', () => {
      const { c } = build();
      const user = makeUser('u1');
      (user as any).getRole = () => 'default';
      c.conversation = makeConv({ with: user });
      expect(c.isAgentConversation).toBe(false);
    });

    it('is false on an SDK build where getRole is not callable', () => {
      const { c } = build();
      const user = makeUser('u1');
      (user as any).getRole = 'not-a-function';
      c.conversation = makeConv({ with: user });
      expect(c.isAgentConversation).toBe(false);
    });
  });

  // ==================== counts, pin, timestamps, typing ====================

  describe('unreadCount', () => {
    it('reports the SDK count for a normal conversation', () => {
      const { c } = build();
      c.conversation = makeConv({ with: makeUser('u1'), unread: 7 });
      expect(c.unreadCount).toBe(7);
    });

    it('coerces a missing count to zero', () => {
      const { c } = build();
      c.conversation = makeConv({ with: makeUser('u1'), unread: undefined });
      expect(c.unreadCount).toBe(0);
    });

    it('suppresses the badge for an agent conversation even when the SDK reports unread', () => {
      const { c } = build();
      c.conversation = makeConv({ with: makeAgentUser(), unread: 12 });
      expect(c.unreadCount).toBe(0);
    });
  });

  describe('isPinned', () => {
    it('is true when the SDK reports a pin timestamp', () => {
      const { c } = build();
      c.conversation = makeConv({ with: makeUser('u1'), pinnedAt: 1700000000 });
      expect(c.isPinned).toBe(true);
    });

    it('is false when the SDK reports no pin', () => {
      const { c } = build();
      c.conversation = makeConv({ with: makeUser('u1'), pinnedAt: 0 });
      expect(c.isPinned).toBe(false);
    });

    it('is false on an older SDK build that does not expose isPinned', () => {
      const { c } = build();
      c.conversation = makeConv({ with: makeUser('u1'), pinnedMissing: true });
      expect(c.isPinned).toBe(false);
    });

    it('is false before a conversation is assigned', () => {
      const { c } = build();
      expect(c.isPinned).toBe(false);
    });
  });

  describe('lastMessage, timestamp and typing', () => {
    it('exposes the last message and its sent time', () => {
      const { c } = build();
      const msg = makeMsg({ getSentAt: () => 1699999999 });
      withMessage(c, msg);
      expect(c.lastMessage).toBe(msg);
      expect(c.hasLastMessage).toBe(true);
      expect(c.lastMessageTimestamp).toBe(1699999999);
    });

    it('reports a zero timestamp when there is no last message', () => {
      const { c } = build();
      withMessage(c, undefined);
      expect(c.lastMessage).toBeUndefined();
      expect(c.hasLastMessage).toBe(false);
      expect(c.lastMessageTimestamp).toBe(0);
    });

    it('reports a zero timestamp when the message carries no sentAt', () => {
      const { c } = build();
      withMessage(c, makeMsg({ getSentAt: () => 0 }));
      expect(c.lastMessageTimestamp).toBe(0);
    });

    it('is typing only while a typing indicator is attached', () => {
      const { c } = build();
      expect(c.isTyping).toBe(false);
      c.typingIndicator = {} as CometChat.TypingIndicator;
      expect(c.isTyping).toBe(true);
    });
  });

  describe('isLastMessageByMe', () => {
    it('is false without a last message', () => {
      const { c } = build();
      c.loggedInUser = makeUser('me');
      withMessage(c, undefined);
      expect(c.isLastMessageByMe).toBe(false);
    });

    it('is false before the logged-in user is known', () => {
      const { c } = build();
      withMessage(c, makeMsg({ getSender: () => makeUser('me') }));
      expect(c.isLastMessageByMe).toBe(false);
    });

    it('is false when the message carries no sender', () => {
      const { c } = build();
      c.loggedInUser = makeUser('me');
      withMessage(c, makeMsg({ getSender: () => undefined }));
      expect(c.isLastMessageByMe).toBe(false);
    });

    it('compares the sender uid against the logged-in uid', () => {
      const { c } = build();
      c.loggedInUser = makeUser('me');
      withMessage(c, makeMsg({ getSender: () => makeUser('me') }));
      expect(c.isLastMessageByMe).toBe(true);
      withMessage(c, makeMsg({ getSender: () => makeUser('someone-else') }));
      expect(c.isLastMessageByMe).toBe(false);
    });
  });

  describe('receiptStatus', () => {
    it('delegates to the receipt helper for a message of mine', () => {
      const { c } = build();
      c.loggedInUser = makeUser('me');
      withMessage(c, makeMsg({ getSender: () => makeUser('me'), getReadAt: () => 1700000001 }));
      expect(c.receiptStatus).toBe('read');
      withMessage(c, makeMsg({ getSender: () => makeUser('me'), getDeliveredAt: () => 1700000001 }));
      expect(c.receiptStatus).toBe('delivered');
    });

    it('never shows a receipt on an agent conversation', () => {
      const { c } = build();
      c.loggedInUser = makeUser('me');
      c.conversation = makeConv({
        with: makeAgentUser(),
        lastMessage: makeMsg({ getSender: () => makeUser('me'), getReadAt: () => 1700000001 }),
      });
      expect(c.receiptStatus).toBeNull();
    });
  });

  // ==================== subtitleText ====================

  describe('subtitleText', () => {
    it('invites the user to start chatting on an agent conversation, ignoring the last message', () => {
      const { c } = build();
      c.conversation = makeConv({
        with: makeAgentUser(),
        lastMessage: makeMsg({ getText: () => 'an earlier reply' }),
      });
      expect(c.subtitleText).toBe(L('conversation_start'));
    });

    it('invites the user to start chatting when there is no last message', () => {
      const { c } = build();
      withMessage(c, undefined);
      expect(c.subtitleText).toBe(L('conversation_start'));
    });

    it('prefers a registered subtitle formatter over the built-in type switch', () => {
      const { c, subtitleService } = build();
      subtitleService.registerSubtitleFormatter(
        'location_custom' as any,
        msg => `pinned ${msg.getId()}`
      );
      withMessage(c, makeMsg({ getType: () => 'location', getCategory: () => 'custom', getId: () => 55 }));
      expect(c.subtitleText).toBe('pinned 55');
    });

    it('reports a deleted message regardless of its original type', () => {
      const { c } = build();
      withMessage(c, makeMsg({ getDeletedAt: () => 1700000001, getText: () => 'gone' }));
      expect(c.subtitleText).toBe(L('conversation_subtitle_deleted_message'));
    });

    it('renders a card message title, falling back to the generic card label', () => {
      const { c } = build();
      withMessage(c, makeMsg({
        getCategory: () => CometChatUIKitConstants.MessageCategory.card,
        getType: () => 'promo',
        getText: () => 'Flash sale',
      }));
      expect(c.subtitleText).toBe('Flash sale');

      withMessage(c, makeMsg({
        getCategory: () => CometChatUIKitConstants.MessageCategory.card,
        getType: () => 'promo',
        getText: () => '',
      }));
      expect(c.subtitleText).toBe(L('card_message'));
    });

    it('renders agentic message text, falling back to the generic AI label', () => {
      const { c } = build();
      withMessage(c, makeMsg({
        getCategory: () => CometChatUIKitConstants.MessageCategory.agentic,
        getType: () => 'assistant',
        getElements: () => [{ getType: () => 'text', getData: () => ({ text: 'Here you go' }) }],
      }));
      expect(c.subtitleText).toBe('Here you go');

      withMessage(c, makeMsg({
        getCategory: () => CometChatUIKitConstants.MessageCategory.agentic,
        getType: () => 'assistant',
      }));
      expect(c.subtitleText).toBe(L('conversation_subtitle_ai_response'));
    });

    it('strips markdown link syntax down to its label', () => {
      const { c } = build();
      withMessage(c, makeMsg({ getText: () => 'see [the docs](https://example.com/docs) now' }));
      expect(c.subtitleText).toBe('see the docs now');
    });

    it('passes a bare URL through untouched', () => {
      const { c } = build();
      withMessage(c, makeMsg({ getText: () => 'https://example.com/a?b=c' }));
      expect(c.subtitleText).toBe('https://example.com/a?b=c');
    });

    it('renders plain text through the formatter pipeline', () => {
      const { c } = build();
      c.textFormatters = [];
      withMessage(c, makeMsg({ getText: () => 'just words' }));
      // The default pipeline must leave ordinary prose byte-identical: a substring assertion
      // here would also accept stray markup or a doubled string.
      expect(c.subtitleText).toBe('just words');
      expect(c.subtitleHasHtml).toBe(true);
    });

    it('treats a text message with no body as empty', () => {
      const { c } = build();
      c.textFormatters = [];
      withMessage(c, makeMsg({ getText: () => undefined }));
      expect(c.subtitleText).toBe('');
    });

    it('renders a text message whose mentioned-users list is null', () => {
      const c = withoutFormatters(build());
      withMessage(c, makeMsg({ getText: () => 'ping <@uid:u9>', getMentionedUsers: () => null }));
      // With no list to resolve against, the uid itself is the best available label.
      expect(c.subtitleText).toBe('ping @u9');
    });

    it('labels each extension type with its own string', () => {
      const { c } = build();
      const cases: [string, string][] = [
        ['extension_poll', 'conversation_subtitle_poll'],
        ['extension_sticker', 'conversation_subtitle_sticker'],
        ['extension_document', 'conversation_subtitle_collaborative_document'],
        ['extension_whiteboard', 'conversation_subtitle_collaborative_whiteboard'],
      ];
      for (const [type, key] of cases) {
        withMessage(c, makeMsg({ getType: () => type }));
        expect(c.subtitleText).toBe(L(key));
      }
    });

    it('uses custom data text for an unrecognised custom message, else its type', () => {
      const { c } = build();
      withMessage(c, makeMsg({
        getType: () => 'location',
        getCategory: () => 'custom',
        getCustomData: () => ({ text: 'Shared a location' }),
      }));
      expect(c.subtitleText).toBe('Shared a location');

      withMessage(c, makeMsg({
        getType: () => 'location',
        getCategory: () => 'custom',
        getCustomData: () => ({}),
      }));
      expect(c.subtitleText).toBe('location');
    });

    it('falls back to the raw type for an unrecognised non-custom message', () => {
      const { c } = build();
      withMessage(c, makeMsg({ getType: () => 'quantum_teleport', getCategory: () => 'message' }));
      expect(c.subtitleText).toBe('quantum_teleport');
    });
  });

  // ==================== media subtitles ====================

  describe('media subtitles', () => {
    function mediaMsg(type: string, overrides: Msg = {}) {
      return makeMsg({
        getType: () => type,
        getAttachments: () => [{ getName: () => 'holiday.jpg' }],
        getCaption: () => '',
        getData: () => ({}),
        ...overrides,
      });
    }

    it('labels a single attachment with its type', () => {
      const { c } = build();
      // Distinct ids: the media subtitle is memoized per message id, so reusing one id across
      // types would serve the first type's label for all four.
      let id = 200;
      for (const type of ['image', 'video', 'audio', 'file']) {
        withMessage(c, mediaMsg(type, { getId: () => id++ }));
        expect(c.subtitleText).toBe(L(`conversation_subtitle_${type}`));
      }
    });

    it('counts a batch and appends the caption', () => {
      const c = withoutFormatters(build());
      withMessage(c, mediaMsg('image', {
        getAttachments: () => [{ getName: () => 'a.jpg' }, { getName: () => 'b.jpg' }, { getName: () => 'c.jpg' }],
        getCaption: () => 'nice trip',
      }));
      const expected = `3 ${L('media_edit_preview_image_plural')} · nice trip`;
      expect(c.subtitleText).toBe(expected);
      expect(c.subtitleHasHtml).toBe(false);
    });

    it('drops a blank caption instead of rendering a dangling separator', () => {
      const { c } = build();
      withMessage(c, mediaMsg('file', { getCaption: () => '   ' }));
      expect(c.subtitleText).toBe(L('conversation_subtitle_file'));
    });

    it('reads a caption that only round-trips through data.text', () => {
      const { c } = build();
      c.textFormatters = [];
      withMessage(c, mediaMsg('file', { getCaption: () => '', getData: () => ({ text: 'contract' }) }));
      expect(c.subtitleText).toBe(`${L('conversation_subtitle_file')} · contract`);
    });

    it('shows a voice note as a recording, not as an audio file', () => {
      const { c } = build();
      withMessage(c, mediaMsg('audio', {
        getMetadata: () => ({ [CometChatUIKitConstants.MetadataKeys.audioType]: CometChatUIKitConstants.AudioType.voiceNote }),
      }));
      expect(c.subtitleText).toBe(L('conversation_subtitle_voice_note'));
    });

    it('escapes the type label once the caption has become HTML, so both are one flavour', () => {
      const { c } = build();
      c.textFormatters = [];
      // Every real locale's type label is plain word characters, so escaping it is a no-op and
      // dropping the escape would go unnoticed. Inject a label carrying "&" and a tag so the
      // branch has something to act on.
      const real = CometChatLocalize.getLocalizedString.bind(CometChatLocalize);
      vi.spyOn(CometChatLocalize, 'getLocalizedString').mockImplementation((key: string) =>
        key === 'media_edit_preview_file_plural' ? 'Files & <b>docs</b>' : real(key)
      );
      const twoFiles = { getAttachments: () => [{ getName: () => 'a.pdf' }, { getName: () => 'b.pdf' }] };

      // Markdown caption -> HTML subtitle -> the label must be escaped to match.
      withMessage(c, mediaMsg('file', { ...twoFiles, getId: () => 601, getCaption: () => '**urgent**' }));
      expect(c.subtitleHasHtml).toBe(true);
      expect(c.subtitleText).toBe('2 Files &amp; &lt;b&gt;docs&lt;/b&gt; · <strong>urgent</strong>');

      // Plain caption -> plain subtitle -> the same label must NOT be escaped, or the row
      // would show the entities verbatim. Needs the pipeline genuinely empty: the default
      // formatters alone are enough to push the subtitle onto the HTML arm.
      const plain = withoutFormatters(build());
      withMessage(plain, mediaMsg('file', { ...twoFiles, getId: () => 602, getCaption: () => 'read soon' }));
      expect(plain.subtitleHasHtml).toBe(false);
      expect(plain.subtitleText).toBe('2 Files & <b>docs</b> · read soon');

      // No caption at all -> nothing turned the subtitle into HTML, so still unescaped.
      withMessage(plain, mediaMsg('file', { ...twoFiles, getId: () => 603, getCaption: () => '' }));
      expect(plain.subtitleText).toBe('2 Files & <b>docs</b>');
    });

    it('serves the memoized pair on a repeat read and recomputes when the message changes', () => {
      const { c } = build();
      c.textFormatters = [];
      const msg = mediaMsg('image', { getId: () => 900, getEditedAt: () => 0, getCaption: () => 'first' });
      withMessage(c, msg);
      const first = (c as any).getMediaSubtitle();
      const second = (c as any).getMediaSubtitle();
      // Same object identity proves the memo was served rather than recomputed.
      expect(second).toBe(first);

      const edited = mediaMsg('image', { getId: () => 900, getEditedAt: () => 12345, getCaption: () => 'second' });
      withMessage(c, edited);
      const third = (c as any).getMediaSubtitle();
      expect(third).not.toBe(first);
      expect(third.text).toBe(`${L('conversation_subtitle_image')} · second`);
    });

    it('keys the memo off an absent getEditedAt without throwing', () => {
      const { c } = build();
      c.textFormatters = [];
      withMessage(c, mediaMsg('image', { getId: () => 901, getEditedAt: undefined, getCaption: () => 'no-edit' }));
      expect((c as any).getMediaSubtitle().text).toBe(`${L('conversation_subtitle_image')} · no-edit`);
    });

    it('resolves caption mentions when the SDK exposes mentioned users, and when it does not', () => {
      const { c } = build();
      c.textFormatters = [];
      const mentioned = makeUser('u9', 'Dana');
      withMessage(c, mediaMsg('file', {
        getCaption: () => 'ping <@uid:u9>',
        getMentionedUsers: () => [mentioned],
      }));
      expect(c.subtitleText).toContain('@Dana');

      withMessage(c, mediaMsg('file', {
        getId: () => 777,
        getCaption: () => 'ping <@uid:u9>',
        getMentionedUsers: undefined,
      }));
      expect(c.subtitleText).toContain('@u9');
    });
  });

  // ==================== subtitleIconName ====================

  describe('subtitleIconName', () => {
    it('is none without a last message', () => {
      const { c } = build();
      withMessage(c, undefined);
      expect(c.subtitleIconName).toBe('none');
    });

    it('prefers a registered icon override', () => {
      const { c, subtitleService } = build();
      subtitleService.registerSubtitleIconOverride('location_custom' as any, 'location-pin');
      withMessage(c, makeMsg({ getType: () => 'location', getCategory: () => 'custom' }));
      expect(c.subtitleIconName).toBe('location-pin');
    });

    it('is deleted for a deleted message', () => {
      const { c } = build();
      withMessage(c, makeMsg({ getDeletedAt: () => 1700000001, getType: () => 'image' }));
      expect(c.subtitleIconName).toBe('deleted');
    });

    it('is none for action, interactive and agentic categories', () => {
      const { c } = build();
      withMessage(c, makeMsg({ getCategory: () => 'action', getType: () => 'groupMember' }));
      expect(c.subtitleIconName).toBe('none');
      withMessage(c, makeMsg({ getCategory: () => 'interactive', getType: () => 'form' }));
      expect(c.subtitleIconName).toBe('none');
      withMessage(c, makeMsg({
        getCategory: () => CometChatUIKitConstants.MessageCategory.agentic,
        getType: () => 'assistant',
      }));
      expect(c.subtitleIconName).toBe('none');
    });

    it('marks a text message as a link only when it carries one', () => {
      const { c } = build();
      withMessage(c, makeMsg({ getText: () => 'https://example.com' }));
      expect(c.subtitleIconName).toBe('link');
      withMessage(c, makeMsg({ getText: () => 'read [this](https://example.com)' }));
      expect(c.subtitleIconName).toBe('link');
      withMessage(c, makeMsg({ getText: () => 'no links here' }));
      expect(c.subtitleIconName).toBe('none');
      withMessage(c, makeMsg({ getText: () => undefined }));
      expect(c.subtitleIconName).toBe('none');
    });

    it('maps each media and extension type to its own icon', () => {
      const { c } = build();
      const cases: [string, string][] = [
        ['image', 'image'],
        ['video', 'video'],
        ['audio', 'audio'],
        ['file', 'file'],
        ['extension_poll', 'poll'],
        ['extension_sticker', 'sticker'],
        ['extension_document', 'collaborative-document'],
        ['extension_whiteboard', 'collaborative-whiteboard'],
      ];
      for (const [type, icon] of cases) {
        withMessage(c, makeMsg({ getType: () => type }));
        expect(c.subtitleIconName).toBe(icon);
      }
    });

    it('is unsupported for an unknown type', () => {
      const { c } = build();
      withMessage(c, makeMsg({ getType: () => 'quantum_teleport' }));
      expect(c.subtitleIconName).toBe('unsupported');
    });
  });

  // ==================== call messages ====================

  describe('call messages', () => {
    function callMsg(overrides: Msg = {}) {
      return makeMsg({ getCategory: () => 'call', getType: () => 'audio', getStatus: () => 'initiated', ...overrides });
    }

    it('distinguishes an outgoing from an incoming initiated call', () => {
      const { c } = build();
      c.loggedInUser = makeUser('me');
      withMessage(c, callMsg({ getSender: () => makeUser('me') }));
      expect(c.subtitleText).toBe(L('conversation_subtitle_outgoing_call'));
      withMessage(c, callMsg({ getSender: () => makeUser('them') }));
      expect(c.subtitleText).toBe(L('conversation_subtitle_incoming_call'));
    });

    it('names an ongoing call by its medium', () => {
      const { c } = build();
      withMessage(c, callMsg({ getStatus: () => 'ongoing', getType: () => 'audio' }));
      expect(c.subtitleText).toBe(L('conversation_subtitle_voice_call'));
      withMessage(c, callMsg({ getStatus: () => 'ongoing', getType: () => 'video' }));
      expect(c.subtitleText).toBe(L('conversation_subtitle_video_call'));
    });

    it('has a distinct string for every terminal call status', () => {
      const { c } = build();
      const cases: [string, string][] = [
        ['unanswered', 'conversation_subtitle_unasnwered_call'],
        ['rejected', 'conversation_subtitle_rejected_call'],
        ['busy', 'conversation_subtitle_busy_call'],
        ['cancelled', 'conversation_subtitle_cancelled_call'],
        ['ended', 'conversation_subtitle_ended_call'],
        ['missed', 'conversation_subtitle_missed_call'],
      ];
      const rendered: string[] = [];
      for (const [status, key] of cases) {
        withMessage(c, callMsg({ getStatus: () => status }));
        expect(c.subtitleText).toBe(L(key));
        rendered.push(c.subtitleText);
      }
      // Two statuses that resolved to the same sentence would make the switch pointless and
      // would also pass the per-case assertions above, so pin the distinctness itself.
      expect(new Set(rendered).size).toBe(cases.length);
    });

    it('falls back to the medium for an unknown status, and for a call with no accessors', () => {
      const { c } = build();
      withMessage(c, callMsg({ getStatus: () => 'teleported', getType: () => 'video' }));
      expect(c.subtitleText).toBe(L('conversation_subtitle_video_call'));
      // An unknown status on an audio call still reads as a voice call.
      withMessage(c, callMsg({ getStatus: () => 'teleported', getType: () => 'audio' }));
      expect(c.subtitleText).toBe(L('conversation_subtitle_voice_call'));
      // An older SDK build exposes no getStatus at all.
      withMessage(c, callMsg({ getStatus: undefined, getType: () => 'call' }));
      expect(c.subtitleText).toBe(L('conversation_subtitle_video_call'));
      // A blank type is treated as video rather than crashing on the lookup.
      withMessage(c, callMsg({ getStatus: () => 'teleported', getType: () => '' }));
      expect(c.subtitleText).toBe(L('conversation_subtitle_video_call'));
    });

    it('picks the call icon by direction and medium', () => {
      const { c } = build();
      c.loggedInUser = makeUser('me');
      const initiator = (uid: string) => ({ getCallInitiator: () => makeUser(uid) });

      withMessage(c, callMsg({ getStatus: () => 'unanswered', getType: () => 'audio', ...initiator('them') }));
      expect(c.subtitleIconName).toBe('incoming-audio-call');

      withMessage(c, callMsg({ getStatus: () => 'unanswered', getType: () => 'video', ...initiator('them') }));
      expect(c.subtitleIconName).toBe('incoming-video-call');

      withMessage(c, callMsg({ getStatus: () => 'ended', getType: () => 'audio', ...initiator('them') }));
      expect(c.subtitleIconName).toBe('outgoing-audio-call');

      withMessage(c, callMsg({ getStatus: () => 'ended', getType: () => 'video', ...initiator('them') }));
      expect(c.subtitleIconName).toBe('outgoing-video-call');

      // No getType at all — treated as a video call. Driven through getCallIconName directly
      // because subtitleIconName builds its lookup key with an unguarded getType() call.
      withMessage(c, callMsg({ getStatus: () => 'ended', getType: undefined, ...initiator('them') }));
      expect((c as any).getCallIconName()).toBe('outgoing-video-call');
    });

    it('does not count my own unanswered call as missed', () => {
      const { c } = build();
      c.loggedInUser = makeUser('me');
      const call = callMsg({ getStatus: () => 'unanswered', getType: () => 'audio', getCallInitiator: () => makeUser('me') });
      withMessage(c, call);
      expect((c as any).isMissedCall(call)).toBe(false);
      expect(c.subtitleIconName).toBe('outgoing-audio-call');
    });

    it('does not count a call with no identifiable initiator as missed', () => {
      const { c } = build();
      c.loggedInUser = makeUser('me');
      const call = callMsg({ getStatus: () => 'rejected', getCallInitiator: () => undefined });
      withMessage(c, call);
      expect((c as any).isMissedCall(call)).toBe(false);
    });

    it('counts every unsuccessful status from another party as missed', () => {
      const { c } = build();
      c.loggedInUser = makeUser('me');
      for (const status of [
        CometChatUIKitConstants.calls.unanswered,
        CometChatUIKitConstants.calls.cancelled,
        CometChatUIKitConstants.calls.busy,
        CometChatUIKitConstants.calls.rejected,
      ]) {
        const call = callMsg({ getStatus: () => status, getCallInitiator: () => makeUser('them') });
        withMessage(c, call);
        expect((c as any).isMissedCall(call)).toBe(true);
      }
      const ended = callMsg({ getStatus: () => 'ended', getCallInitiator: () => makeUser('them') });
      expect((c as any).isMissedCall(ended)).toBe(false);
    });

    it('falls back to getInitiator when getCallInitiator throws', () => {
      const { c } = build();
      c.loggedInUser = makeUser('me');
      const call = callMsg({
        getStatus: () => 'busy',
        getCallInitiator: () => { throw new Error('removed in this SDK build'); },
        getInitiator: () => makeUser('them'),
      });
      withMessage(c, call);
      expect((c as any).isMissedCall(call)).toBe(true);
    });

    it('treats a call as not missed when the legacy initiator yields no uid', () => {
      const { c } = build();
      c.loggedInUser = makeUser('me');
      const call = callMsg({
        getStatus: () => 'busy',
        getCallInitiator: () => { throw new Error('removed in this SDK build'); },
        getInitiator: () => ({}),
      });
      withMessage(c, call);
      expect((c as any).isMissedCall(call)).toBe(false);
    });

    it('treats a call as not missed when both initiator accessors throw', () => {
      const { c } = build();
      c.loggedInUser = makeUser('me');
      const call = callMsg({
        getStatus: () => 'busy',
        getCallInitiator: () => { throw new Error('gone'); },
        getInitiator: () => { throw new Error('also gone'); },
      });
      withMessage(c, call);
      expect((c as any).isMissedCall(call)).toBe(false);
      expect(c.subtitleIconName).toBe('outgoing-audio-call');
    });

    it('treats a status-less call as not missed', () => {
      const { c } = build();
      c.loggedInUser = makeUser('me');
      const call = callMsg({ getStatus: undefined, getCallInitiator: () => makeUser('them') });
      withMessage(c, call);
      expect((c as any).isMissedCall(call)).toBe(false);
    });
  });

  // ==================== meeting (group call) messages ====================

  describe('meeting messages', () => {
    function meetingMsg(overrides: Msg = {}) {
      return makeMsg({
        getCategory: () => 'custom',
        getType: () => CometChatUIKitConstants.calls.meeting,
        getCustomData: () => ({ callType: 'audio' }),
        ...overrides,
      });
    }

    it('says I started the call when the message is mine or senderless', () => {
      const { c } = build();
      c.loggedInUser = makeUser('me');
      withMessage(c, meetingMsg({ getSender: () => makeUser('me') }));
      expect(c.subtitleText).toBe(L('conversation_subtitle_group_voice_call_initated_self'));

      withMessage(c, meetingMsg({ getCustomData: () => ({ callType: 'video' }), getSender: () => makeUser('me') }));
      expect(c.subtitleText).toBe(L('conversation_subtitle_group_video_call_initated_self'));

      withMessage(c, meetingMsg({ getSender: () => undefined }));
      expect(c.subtitleText).toBe(L('conversation_subtitle_group_voice_call_initated_self'));
    });

    it('names the other participant who started the call', () => {
      const { c } = build();
      c.loggedInUser = makeUser('me');
      withMessage(c, meetingMsg({ getSender: () => makeUser('them', 'Kim') }));
      expect(c.subtitleText).toBe(`Kim ${L('conversation_subtitle_group_voice_call_initated')}`);

      withMessage(c, meetingMsg({
        getCustomData: () => ({ callType: 'video' }),
        getSender: () => makeUser('them', 'Kim'),
      }));
      expect(c.subtitleText).toBe(`Kim ${L('conversation_subtitle_group_video_call_initated')}`);
    });

    it('omits an unnamed participant and defaults a call with no callType to video', () => {
      const { c } = build();
      c.loggedInUser = makeUser('me');
      // A plain stub, not CometChat.User: the real SDK model rejects an empty name, and that
      // throw would be swallowed by this method's own catch and hide what is being tested.
      withMessage(c, meetingMsg({
        getCustomData: () => undefined,
        getSender: () => ({ getUid: () => 'them', getName: () => '' }),
      }));
      expect(c.subtitleText).toBe(` ${L('conversation_subtitle_group_video_call_initated')}`);
    });

    it('degrades to a generic call label when the custom data cannot be read', () => {
      const { c } = build();
      withMessage(c, meetingMsg({ getCustomData: () => { throw new Error('corrupt payload'); } }));
      expect(c.subtitleText).toBe(L('conversation_subtitle_voice_call'));
      expect(c.subtitleIconName).toBe('meeting-video-call');
    });

    it('picks the meeting icon from the callType', () => {
      const { c } = build();
      withMessage(c, meetingMsg({ getCustomData: () => ({ callType: 'audio' }) }));
      expect(c.subtitleIconName).toBe('meeting-audio-call');
      withMessage(c, meetingMsg({ getCustomData: () => ({ callType: 'video' }) }));
      expect(c.subtitleIconName).toBe('meeting-video-call');
      withMessage(c, meetingMsg({ getCustomData: undefined }));
      expect(c.subtitleIconName).toBe('meeting-video-call');
    });
  });

  // ==================== action messages ====================

  describe('action messages', () => {
    function actionMsg(action: string | undefined, by?: unknown, on?: unknown) {
      return makeMsg({
        getCategory: () => 'action',
        getType: () => 'groupMember',
        getAction: action === undefined ? undefined : () => action,
        getActionBy: () => by,
        getActionOn: () => on,
      });
    }

    it('phrases every membership action with the names involved', () => {
      const { c } = build();
      const by = makeUser('admin', 'Ada');
      const on = makeUser('target', 'Bo');
      const cases: [string, string, boolean][] = [
        ['added', 'conversation_subtitle_added', true],
        ['joined', 'conversation_subtitle_joined', false],
        ['left', 'conversation_subtitle_left', false],
        ['kicked', 'conversation_subtitle_kicked', true],
        ['banned', 'conversation_subtitle_banned', true],
        ['unbanned', 'conversation_subtitle_unbanned', true],
        ['scopeChanged', 'conversation_subtitle_scope_changed', true],
      ];
      for (const [action, key, hasTarget] of cases) {
        withMessage(c, actionMsg(action, by, on), makeGroup('g1', 'Team'));
        const expected = hasTarget ? `Ada ${L(key)} Bo` : `Ada ${L(key)}`;
        expect(c.subtitleText).toBe(expected);
      }
    });

    it('returns the raw action for an unrecognised one, and empty for none at all', () => {
      const { c } = build();
      withMessage(c, actionMsg('promoted', makeUser('a', 'Ada'), undefined));
      expect(c.subtitleText).toBe('promoted');
      withMessage(c, actionMsg(undefined));
      expect(c.subtitleText).toBe('');
    });

    it('leaves a name blank when the actor cannot supply one', () => {
      const { c } = build();
      // No actor at all, an actor object with no getName, and one where getName is not callable.
      withMessage(c, actionMsg('joined', undefined, undefined));
      expect(c.subtitleText).toBe(` ${L('conversation_subtitle_joined')}`);

      withMessage(c, actionMsg('added', { uid: 'a' }, { uid: 'b' }));
      expect(c.subtitleText).toBe(` ${L('conversation_subtitle_added')} `);

      withMessage(c, actionMsg('added', { getName: 'not-callable' }, { getName: 'not-callable' }));
      expect(c.subtitleText).toBe(` ${L('conversation_subtitle_added')} `);

      withMessage(c, actionMsg('added', { getName: () => '' }, { getName: () => '' }));
      expect(c.subtitleText).toBe(` ${L('conversation_subtitle_added')} `);
    });
  });

  // ==================== custom message text ====================

  describe('custom message payloads', () => {
    it('ignores custom data that carries no text', () => {
      const { c } = build();
      const payloads: unknown[] = [null, 'a string', { other: 1 }];
      for (const customData of payloads) {
        withMessage(c, makeMsg({ getType: () => 'thing', getCategory: () => 'custom', getCustomData: () => customData }));
        expect(c.subtitleText).toBe('thing');
      }
      withMessage(c, makeMsg({ getType: () => 'thing', getCategory: () => 'custom', getCustomData: undefined }));
      expect(c.subtitleText).toBe('thing');
    });

    it('coerces a non-string text field rather than rendering [object Object]', () => {
      const { c } = build();
      withMessage(c, makeMsg({ getType: () => 'thing', getCategory: () => 'custom', getCustomData: () => ({ text: 42 }) }));
      expect(c.subtitleText).toBe('42');
    });

    it('falls back to the type when reading custom data throws', () => {
      const { c } = build();
      withMessage(c, makeMsg({
        getType: () => 'thing',
        getCategory: () => 'custom',
        getCustomData: () => { throw new Error('corrupt'); },
      }));
      expect(c.subtitleText).toBe('thing');
    });
  });

  // ==================== formatter resolution ====================

  describe('getFormattersForSubtitle', () => {
    it('uses the explicit input formatters when any are supplied', () => {
      const { c } = build();
      const mine = [new StubFormatter('mine')];
      c.textFormatters = mine;
      expect((c as any).getFormattersForSubtitle()).toEqual(mine);
    });

    it('falls back to the service defaults when the input list is empty', () => {
      const { c, formatterConfig } = build();
      const serviceDefaults = [new StubFormatter('from-service')];
      formatterConfig.setDefaultFormatters(serviceDefaults);
      c.textFormatters = [];
      expect((c as any).getFormattersForSubtitle()).toEqual(serviceDefaults);
    });

    it('clones a mentions formatter per render so the logged-in user cannot leak between rows', () => {
      const { c } = build();
      const shared = new CometChatMentionsFormatter();
      const other = new StubFormatter('other');
      c.textFormatters = [shared, other];
      c.loggedInUser = makeUser('me', 'Me');

      const resolved = (c as any).getFormattersForSubtitle();
      expect(resolved[0]).toBeInstanceOf(CometChatMentionsFormatter);
      expect(resolved[0]).not.toBe(shared);
      expect((resolved[0] as any).loggedInUser).toBe(c.loggedInUser);
      // Non-mentions formatters are passed through by reference.
      expect(resolved[1]).toBe(other);
      // The caller's instance must be left untouched.
      expect((shared as any).loggedInUser).toBeFalsy();
    });
  });

  describe('hasSdkMentionTags', () => {
    it('recognises uid and all tags, and nothing else', () => {
      const { c } = build();
      expect((c as any).hasSdkMentionTags('hi <@uid:u1>')).toBe(true);
      expect((c as any).hasSdkMentionTags('hi <@all:here>')).toBe(true);
      expect((c as any).hasSdkMentionTags('hi @u1')).toBe(false);
      expect((c as any).hasSdkMentionTags('')).toBe(false);
    });
  });

  // ==================== renderSubtitleSource ====================

  describe('renderSubtitleSource', () => {
    it('prefers pre-rendered rich-text HTML for a message body', () => {
      const { c } = build();
      withMessage(c, makeMsg({
        getText: () => 'bold please',
        getMetadata: () => ({ richText: { html: '<strong>bold please</strong>', hasFormatting: true } }),
      }));
      const result = (c as any).renderSubtitleSource('bold please', [], true);
      expect(result).toEqual({ text: '<strong>bold please</strong>', isHtml: true });
    });

    it('ignores rich-text metadata that reports no formatting', () => {
      const c = withoutFormatters(build());
      withMessage(c, makeMsg({
        getText: () => 'plain',
        getMetadata: () => ({ richText: { html: '<strong>plain</strong>', hasFormatting: false } }),
      }));
      expect((c as any).renderSubtitleSource('plain', [], true)).toEqual({ text: 'plain', isHtml: false });
    });

    it('ignores rich-text HTML that sanitizes away to nothing', () => {
      const c = withoutFormatters(build());
      withMessage(c, makeMsg({
        getText: () => 'plain',
        getMetadata: () => ({ richText: { html: '   ', hasFormatting: true } }),
      }));
      expect((c as any).renderSubtitleSource('plain', [], true)).toEqual({ text: 'plain', isHtml: false });
    });

    it('survives metadata that throws on read', () => {
      const c = withoutFormatters(build());
      withMessage(c, makeMsg({
        getText: () => 'plain',
        getMetadata: () => { throw new Error('metadata unreadable'); },
      }));
      expect((c as any).renderSubtitleSource('plain', [], true)).toEqual({ text: 'plain', isHtml: false });
    });

    it('never substitutes body rich-text HTML for a caption', () => {
      const c = withoutFormatters(build());
      withMessage(c, makeMsg({
        getText: () => 'the body',
        getMetadata: () => ({ richText: { html: '<strong>the body</strong>', hasFormatting: true } }),
      }));
      // isMessageBody = false, so the caption must render from its own raw text.
      expect((c as any).renderSubtitleSource('the caption', [], false)).toEqual({
        text: 'the caption',
        isHtml: false,
      });
    });

    it('defaults to treating the text as the message body', () => {
      const { c } = build();
      withMessage(c, makeMsg({
        getText: () => 'x',
        getMetadata: () => ({ richText: { html: '<em>from metadata</em>', hasFormatting: true } }),
      }));
      // Called with two arguments: the isMessageBody default must apply.
      expect((c as any).renderSubtitleSource('x', [])).toEqual({
        text: '<em>from metadata</em>',
        isHtml: true,
      });
    });

    describe('markdown path', () => {
      it('renders markdown through the custom formatters', () => {
        const { c } = build();
        c.textFormatters = [new StubFormatter('wrapper', t => `[${t}]`)];
        withMessage(c, makeMsg({ getText: () => '**hi**' }));
        const result = (c as any).renderSubtitleSource('**hi**', [], true);
        expect(result.isHtml).toBe(true);
        expect(result.text).toBe('[**hi**]');
      });

      it('resolves SDK mention tags inside markdown', () => {
        const { c } = build();
        c.textFormatters = [new CometChatMentionsFormatter()];
        const dana = makeUser('u9', 'Dana');
        withMessage(c, makeMsg({ getText: () => '**hi** <@uid:u9>' }));
        const result = (c as any).renderSubtitleSource('**hi** <@uid:u9>', [dana], true);
        expect(result.isHtml).toBe(true);
        expect(result.text).toContain('@Dana');
      });

      it('leaves markdown alone when there are no mention tags to resolve', () => {
        const { c } = build();
        c.textFormatters = [new CometChatMentionsFormatter()];
        withMessage(c, makeMsg({ getText: () => '**hi**' }));
        const result = (c as any).renderSubtitleSource('**hi**', [], true);
        expect(result).toEqual({ text: '**hi**', isHtml: true });
      });

      it('skips a mentions formatter that declines the text', () => {
        const { c } = build();
        const declined = vi
          .spyOn(CometChatMentionsFormatter.prototype, 'shouldFormat')
          .mockReturnValue(false);
        const applied = vi.spyOn(CometChatMentionsFormatter.prototype, 'formatSdkMentions');
        c.textFormatters = [new CometChatMentionsFormatter()];
        withMessage(c, makeMsg({ getText: () => '**hi** <@uid:u9>' }));
        const result = (c as any).renderSubtitleSource('**hi** <@uid:u9>', [makeUser('u9', 'Dana')], true);
        expect(declined).toHaveBeenCalled();
        expect(applied).not.toHaveBeenCalled();
        expect(result.text).not.toContain('@Dana');
      });

      it('skips the tiptap formatter, which owns the composer and not the subtitle', () => {
        const { c } = build();
        const tiptap = new StubFormatter('tiptap-formatter', t => `TIPTAP(${t})`);
        const spy = vi.spyOn(tiptap, 'format');
        c.textFormatters = [tiptap];
        withMessage(c, makeMsg({ getText: () => '**hi**' }));
        const result = (c as any).renderSubtitleSource('**hi**', [], true);
        expect(spy).not.toHaveBeenCalled();
        expect(result.text).toBe('**hi**');
      });

      it('skips a custom formatter that declines the text', () => {
        const { c } = build();
        const declining = new StubFormatter('declining', t => `NO(${t})`, false);
        c.textFormatters = [declining];
        withMessage(c, makeMsg({ getText: () => '**hi**' }));
        expect((c as any).renderSubtitleSource('**hi**', [], true).text).toBe('**hi**');
      });

      it('keeps the pipeline running when a formatter throws, without logging', () => {
        const { c } = build();
        c.textFormatters = [new ExplodingFormatter(), new StubFormatter('after', t => `${t}!`)];
        withMessage(c, makeMsg({ getText: () => '**hi**' }));
        const result = (c as any).renderSubtitleSource('**hi**', [], true);
        expect(result.text).toBe('**hi**!');
        // The markdown arm deliberately swallows formatter errors silently.
        expect(loggerError).not.toHaveBeenCalled();
      });
    });

    describe('plain-text path', () => {
      it('resolves mentions without escaping when there are no formatters at all', () => {
        const { c, formatterConfig } = build();
        formatterConfig.setDefaultFormatters([]);
        c.textFormatters = [];
        withMessage(c, makeMsg({ getText: () => 'hi <@uid:u9>' }));
        expect((c as any).renderSubtitleSource('hi <@uid:u9>', [makeUser('u9', 'Dana')], true)).toEqual({
          text: 'hi @Dana',
          isHtml: false,
        });
      });

      it('returns plain text when nothing in the pipeline would change it', () => {
        const { c } = build();
        c.textFormatters = [new CometChatMentionsFormatter()];
        withMessage(c, makeMsg({ getText: () => 'nothing to do' }));
        expect((c as any).renderSubtitleSource('nothing to do', [], true)).toEqual({
          text: 'nothing to do',
          isHtml: false,
        });
      });

      it('resolves mentions as plain text when no formatter can render them', () => {
        const { c } = build();
        // Only tiptap is present: it is skipped, so nothing can turn the tags into HTML.
        c.textFormatters = [new StubFormatter('tiptap-formatter')];
        withMessage(c, makeMsg({ getText: () => 'hi <@uid:u9>' }));
        expect((c as any).renderSubtitleSource('hi <@uid:u9>', [makeUser('u9', 'Dana')], true)).toEqual({
          text: 'hi @Dana',
          isHtml: false,
        });
      });

      it('renders mentions as HTML when a mentions formatter is present', () => {
        const { c } = build();
        c.textFormatters = [new CometChatMentionsFormatter()];
        withMessage(c, makeMsg({ getText: () => 'hi <@uid:u9>' }));
        const result = (c as any).renderSubtitleSource('hi <@uid:u9>', [makeUser('u9', 'Dana')], true);
        expect(result.isHtml).toBe(true);
        expect(result.text).toContain('@Dana');
        expect(result.text).toContain('data-uid="u9"');
      });

      it('skips a mentions formatter that declines, and a tiptap formatter, in the plain path', () => {
        const { c } = build();
        vi.spyOn(CometChatMentionsFormatter.prototype, 'shouldFormat').mockReturnValue(false);
        const applied = vi.spyOn(CometChatMentionsFormatter.prototype, 'formatSdkMentions');
        const tiptap = new StubFormatter('tiptap-formatter', t => `TIPTAP(${t})`);
        const tiptapSpy = vi.spyOn(tiptap, 'format');
        c.textFormatters = [new CometChatMentionsFormatter(), tiptap, new StubFormatter('real', t => `R(${t})`)];
        withMessage(c, makeMsg({ getText: () => 'hi <@uid:u9>' }));
        const result = (c as any).renderSubtitleSource('hi <@uid:u9>', [makeUser('u9', 'Dana')], true);
        expect(applied).not.toHaveBeenCalled();
        expect(tiptapSpy).not.toHaveBeenCalled();
        expect(result.text).toContain('R(');
      });

      it('skips a custom formatter that declines the plain text', () => {
        const { c } = build();
        c.textFormatters = [new StubFormatter('declining', t => `NO(${t})`, false), new StubFormatter('yes', t => `Y(${t})`)];
        withMessage(c, makeMsg({ getText: () => 'hello' }));
        const result = (c as any).renderSubtitleSource('hello', [], true);
        expect(result.text).toBe('Y(hello)');
        expect(result.text).not.toContain('NO(');
      });

      it('logs and carries on when a formatter throws in the plain path', () => {
        const { c } = build();
        c.textFormatters = [new ExplodingFormatter(), new StubFormatter('after', t => `${t}!`)];
        withMessage(c, makeMsg({ getText: () => 'hello' }));
        const result = (c as any).renderSubtitleSource('hello', [], true);
        expect(result).toEqual({ text: 'hello!', isHtml: true });
        expect(loggerError).toHaveBeenCalledWith(
          'CometChatConversationItem',
          'Formatter error:',
          expect.any(Error)
        );
      });
    });

    it('formatSubtitleSource returns only the rendered string', () => {
      const { c } = build();
      c.textFormatters = [];
      withMessage(c, makeMsg({ getText: () => 'hello' }));
      expect((c as any).formatSubtitleSource('hello', [], false)).toBe('hello');
    });
  });

  // ==================== subtitleHasHtml ====================

  describe('subtitleHasHtml', () => {
    it('is false without a last message, and for a deleted one', () => {
      const { c } = build();
      withMessage(c, undefined);
      expect(c.subtitleHasHtml).toBe(false);
      withMessage(c, makeMsg({ getDeletedAt: () => 1700000001, getText: () => '**bold**' }));
      expect(c.subtitleHasHtml).toBe(false);
    });

    it('is false for any category other than message', () => {
      const { c } = build();
      withMessage(c, makeMsg({ getCategory: () => 'custom', getType: () => 'thing' }));
      expect(c.subtitleHasHtml).toBe(false);
    });

    it('is false on an agent conversation, whose subtitle is a fixed prompt', () => {
      const { c } = build();
      c.conversation = makeConv({
        with: makeAgentUser(),
        lastMessage: makeMsg({ getText: () => '**bold**' }),
      });
      expect(c.subtitleHasHtml).toBe(false);
    });

    it('is false when a registered formatter owns the subtitle', () => {
      const { c, subtitleService } = build();
      subtitleService.registerSubtitleFormatter('text_message' as any, () => '**not html**');
      withMessage(c, makeMsg({ getText: () => '**bold**' }));
      expect(c.subtitleHasHtml).toBe(false);
    });

    it('is false for a non-text, non-media message type', () => {
      const { c } = build();
      withMessage(c, makeMsg({ getType: () => 'extension_poll' }));
      expect(c.subtitleHasHtml).toBe(false);
    });

    it('is false for a URL or a markdown link, which render as plain text', () => {
      const { c } = build();
      withMessage(c, makeMsg({ getText: () => 'https://example.com' }));
      expect(c.subtitleHasHtml).toBe(false);
      withMessage(c, makeMsg({ getText: () => 'read [this](https://example.com)' }));
      expect(c.subtitleHasHtml).toBe(false);
    });

    it('is true for markdown syntax', () => {
      const { c } = build();
      withMessage(c, makeMsg({ getText: () => '**bold**' }));
      expect(c.subtitleHasHtml).toBe(true);
    });

    it('falls back to rich-text metadata when the body text is empty', () => {
      const { c } = build();
      withMessage(c, makeMsg({
        getText: () => '',
        getMetadata: () => ({ richText: { html: '<strong>x</strong>', hasFormatting: true } }),
      }));
      expect(c.subtitleHasHtml).toBe(true);

      withMessage(c, makeMsg({ getText: () => '', getMetadata: () => ({}) }));
      expect(c.subtitleHasHtml).toBe(false);

      withMessage(c, makeMsg({ getText: () => '', getMetadata: () => { throw new Error('unreadable'); } }));
      expect(c.subtitleHasHtml).toBe(false);
    });

    it('is false when no formatter is configured at all', () => {
      const { c, formatterConfig } = build();
      formatterConfig.setDefaultFormatters([]);
      c.textFormatters = [];
      withMessage(c, makeMsg({ getText: () => 'hi <@uid:u9>' }));
      expect(c.subtitleHasHtml).toBe(false);
    });

    it('is true for SDK mentions only when a mentions formatter can render them', () => {
      const { c } = build();
      c.textFormatters = [new CometChatMentionsFormatter()];
      withMessage(c, makeMsg({ getText: () => 'hi <@uid:u9>' }));
      expect(c.subtitleHasHtml).toBe(true);

      c.textFormatters = [new StubFormatter('tiptap-formatter')];
      withMessage(c, makeMsg({ getText: () => 'hi <@uid:u9>' }));
      expect(c.subtitleHasHtml).toBe(false);
    });

    it('is true whenever a custom formatter is in the pipeline', () => {
      const { c } = build();
      c.textFormatters = [new StubFormatter('decorator')];
      withMessage(c, makeMsg({ getText: () => 'nothing special' }));
      expect(c.subtitleHasHtml).toBe(true);
    });

    it('is false when only a mentions formatter is present and there are no mentions', () => {
      const { c } = build();
      c.textFormatters = [new CometChatMentionsFormatter()];
      withMessage(c, makeMsg({ getText: () => 'nothing special' }));
      expect(c.subtitleHasHtml).toBe(false);
    });
  });

  // ==================== sanitizeSubtitleHtml ====================

  describe('sanitizeSubtitleHtml', () => {
    it('returns empty for empty input', () => {
      const { c } = build();
      expect((c as any).sanitizeSubtitleHtml('')).toBe('');
    });

    it('flattens an ordered list into numbered inline text', () => {
      const { c } = build();
      // `ol`/`li` are not allowed in a one-line subtitle, so the numbering is baked into spans.
      const out = (c as any).sanitizeSubtitleHtml('<ol><li>first</li><li>second</li></ol>');
      expect(out).toBe('<span><span>1. first </span><span>2. second </span></span>');
    });

    it('flattens an unordered list into bulleted inline text', () => {
      const { c } = build();
      const out = (c as any).sanitizeSubtitleHtml('<ul><li>alpha</li><li>beta</li></ul>');
      expect(out).toBe('<span><span>• alpha </span><span>• beta </span></span>');
    });

    it('collapses block structure to single spaces so the subtitle stays one line', () => {
      const { c } = build();
      expect((c as any).sanitizeSubtitleHtml('<p>one</p><p>two</p>line<br>break')).toBe('one two line break');
      expect((c as any).sanitizeSubtitleHtml('<blockquote>q</blockquote> <h3>h</h3>')).toBe('q h');
    });

    it('strips tags that are not allowed in a subtitle', () => {
      const { c } = build();
      const out = (c as any).sanitizeSubtitleHtml('<strong>keep</strong><script>alert(1)</script><img src="x">');
      expect(out).toBe('<strong>keep</strong>');
    });

    it('logs and yields empty text when sanitization itself fails', () => {
      const { c, sanitizer } = build();
      vi.spyOn(sanitizer, 'sanitizeWithConfig').mockImplementation(() => {
        throw new Error('DOMPurify unavailable');
      });
      expect((c as any).sanitizeSubtitleHtml('<strong>x</strong>')).toBe('');
      expect(loggerError).toHaveBeenCalledWith(
        'CometChatConversationItem',
        'Sanitization error:',
        expect.any(Error)
      );
    });
  });

  // ==================== formatPlainMentions ====================

  describe('formatPlainMentions', () => {
    it('returns empty for empty text', () => {
      const { c } = build();
      expect((c as any).formatPlainMentions('', [makeUser('u1', 'Alice')])).toBe('');
    });

    it('resolves a uid tag to the mentioned user name', () => {
      const { c } = build();
      expect((c as any).formatPlainMentions('hey <@uid:u1>', [makeUser('u1', 'Alice')])).toBe('hey @Alice');
    });

    it('falls back to the uid when the user is not in the mentioned list', () => {
      const { c } = build();
      expect((c as any).formatPlainMentions('hey <@uid:ghost>', [makeUser('u1', 'Alice')])).toBe('hey @ghost');
    });

    it('renders an all-mention using its label', () => {
      const { c } = build();
      expect((c as any).formatPlainMentions('hey <@all:everyone>', [])).toBe('hey @everyone');
    });
  });

  // ==================== senderNamePrefix ====================

  describe('senderNamePrefix', () => {
    it('is empty without a last message', () => {
      const { c } = build();
      withMessage(c, undefined, makeGroup('g1', 'Team'));
      expect(c.senderNamePrefix).toBe('');
    });

    it('is empty for action, call and meeting messages in a group', () => {
      const { c } = build();
      const group = makeGroup('g1', 'Team');
      withMessage(c, makeMsg({ getCategory: () => 'action', getSender: () => makeUser('a', 'Ada') }), group);
      expect(c.senderNamePrefix).toBe('');
      withMessage(c, makeMsg({ getCategory: () => 'call', getSender: () => makeUser('a', 'Ada') }), group);
      expect(c.senderNamePrefix).toBe('');
      withMessage(c, makeMsg({
        getCategory: () => 'custom',
        getType: () => CometChatUIKitConstants.calls.meeting,
        getSender: () => makeUser('a', 'Ada'),
      }), group);
      expect(c.senderNamePrefix).toBe('');
    });

    it('says "You" for my own message in a group', () => {
      const { c } = build();
      c.loggedInUser = makeUser('me');
      withMessage(c, makeMsg({ getSender: () => makeUser('me') }), makeGroup('g1', 'Team'));
      expect(c.senderNamePrefix).toBe(`${L('conversation_subtitle_you_message')}:`);
    });

    it('names the other sender in a group', () => {
      const { c } = build();
      c.loggedInUser = makeUser('me');
      withMessage(c, makeMsg({ getSender: () => makeUser('them', 'Kim') }), makeGroup('g1', 'Team'));
      expect(c.senderNamePrefix).toBe('Kim:');
    });

    it('is empty for a group message with no sender', () => {
      const { c } = build();
      c.loggedInUser = makeUser('me');
      withMessage(c, makeMsg({ getSender: () => undefined }), makeGroup('g1', 'Team'));
      expect(c.senderNamePrefix).toBe('');
    });

    it('is empty in a one-to-one conversation, where the sender is obvious', () => {
      const { c } = build();
      c.loggedInUser = makeUser('me');
      withMessage(c, makeMsg({ getSender: () => makeUser('them', 'Kim') }), makeUser('them', 'Kim'));
      expect(c.senderNamePrefix).toBe('');
    });
  });

  // ==================== accessibility ====================

  describe('accessibleLabel', () => {
    it('reads out the name, subtitle and unread count', () => {
      const { c } = build();
      c.textFormatters = [];
      c.conversation = makeConv({
        with: makeUser('u1', 'Alice'),
        lastMessage: makeMsg({ getText: () => 'see you' }),
        unread: 3,
        pinnedAt: 0,
      });
      expect(c.accessibleLabel).toBe(`Alice, see you, 3 ${L('conversation_unread_messages')}`);
    });

    it('appends the pinned state, which is otherwise invisible to a screen reader', () => {
      const { c } = build();
      c.textFormatters = [];
      c.conversation = makeConv({
        with: makeUser('u1', 'Alice'),
        lastMessage: makeMsg({ getText: () => 'see you' }),
        unread: 0,
        pinnedAt: 1700000000,
      });
      expect(c.accessibleLabel).toBe(`Alice, see you, ${L('conversation_pinned_status')}`);
    });
  });

  /**
   * `getPlainSubtitleText` is private and currently has no caller anywhere in the kit — neither
   * the template nor another method uses it. These two tests therefore pin what the shipped code
   * does, not a user-visible behaviour; if the method is deleted, delete them with it.
   */
  describe('getPlainSubtitleText (no caller in the kit today)', () => {
    it('strips the subtitle markup, leaving the text a screen reader would get', () => {
      const { c } = build();
      c.textFormatters = [];
      withMessage(c, makeMsg({ getText: () => '**bold** words' }));
      expect(c.subtitleHasHtml).toBe(true);
      expect((c as any).getPlainSubtitleText()).toBe('bold words');
    });

    it('returns empty when there is no subtitle text to strip', () => {
      const { c } = build();
      c.textFormatters = [];
      withMessage(c, makeMsg({ getText: () => '' }));
      expect((c as any).getPlainSubtitleText()).toBe('');
    });
  });

  // ==================== slot context ====================

  describe('slotContext', () => {
    it('hands a custom template the row state it needs to render', () => {
      const { c } = build();
      const conversation = makeConv({ with: makeAgentUser(), unread: 4 });
      c.conversation = conversation;
      c.isActive = true;
      c.isSelected = true;
      c.typingIndicator = {} as CometChat.TypingIndicator;
      expect(c.slotContext).toEqual({
        $implicit: conversation,
        conversation,
        isActive: true,
        isSelected: true,
        // Agent rows never show an unread badge, so the slot must see 0, not the SDK's 4.
        unreadCount: 0,
        isTyping: true,
      });
    });
  });

  // ==================== interaction ====================

  describe('interaction', () => {
    function emissions(c: any) {
      const log: Record<string, unknown[]> = {};
      for (const name of [
        'itemClick', 'avatarClick', 'titleClick', 'subtitleClick',
        'timestampClick', 'badgeClick', 'contextMenuOpen',
        'contextMenuOptionClick', 'contextMenuKeyboardOpen',
      ]) {
        log[name] = [];
        c[name].subscribe((v: unknown) => log[name].push(v));
      }
      return log;
    }

    it('emits the conversation from each region of the row', () => {
      const { c } = build();
      const conversation = makeConv({ with: makeUser('u1') });
      c.conversation = conversation;
      const log = emissions(c);
      const event = new MouseEvent('click');

      c.handleClick();
      c.handleAvatarClick(event);
      c.handleTitleClick(event);
      c.handleSubtitleClick(event);
      c.handleTimestampClick(event);
      c.handleBadgeClick(event);
      c.handleContextMenuOpen();

      expect(log['itemClick']).toEqual([conversation]);
      expect(log['avatarClick']).toEqual([conversation]);
      expect(log['titleClick']).toEqual([conversation]);
      expect(log['subtitleClick']).toEqual([conversation]);
      expect(log['timestampClick']).toEqual([conversation]);
      expect(log['badgeClick']).toEqual([conversation]);
      expect(log['contextMenuOpen']).toEqual([conversation]);
    });

    it('suppresses the mousedown default so pressing the row does not steal focus', () => {
      const { c } = build();
      const event = new MouseEvent('mousedown');
      const prevented = vi.spyOn(event, 'preventDefault');
      c.handleMouseDown(event);
      expect(prevented).toHaveBeenCalled();
    });

    it('pairs the chosen menu option with this row own conversation', () => {
      const { c } = build();
      const conversation = makeConv({ with: makeUser('u1') });
      c.conversation = conversation;
      const log = emissions(c);
      const option = { id: 'delete', title: 'Delete' } as any;
      c.handleContextMenuOptionClick(option);
      expect(log['contextMenuOptionClick']).toEqual([{ option, conversation }]);
    });

    it('blocks the browser context menu only while the kit menu is enabled', () => {
      const suppressing = build();
      const blocked = new MouseEvent('contextmenu');
      const blockedSpy = vi.spyOn(blocked, 'preventDefault');
      suppressing.c.handleContextMenu(blocked);
      expect(blockedSpy).toHaveBeenCalled();

      const allowing = build({ disableDefaultContextMenu: false });
      const allowed = new MouseEvent('contextmenu');
      const allowedSpy = vi.spyOn(allowed, 'preventDefault');
      allowing.c.handleContextMenu(allowed);
      expect(allowedSpy).not.toHaveBeenCalled();
    });

    it('activates the row on Enter and Space, keeping the key from the parent list', () => {
      const { c } = build();
      const conversation = makeConv({ with: makeUser('u1') });
      c.conversation = conversation;
      const log = emissions(c);

      for (const key of ['Enter', ' ']) {
        const event = new KeyboardEvent('keydown', { key });
        const prevented = vi.spyOn(event, 'preventDefault');
        const stopped = vi.spyOn(event, 'stopPropagation');
        c.onKeyDown(event);
        expect(prevented).toHaveBeenCalled();
        expect(stopped).toHaveBeenCalled();
      }
      expect(log['itemClick']).toEqual([conversation, conversation]);
      expect(log['contextMenuOpen']).toEqual([]);
    });

    it('opens the context menu on Shift+F10 and on the ContextMenu key', () => {
      const { c } = build();
      const conversation = makeConv({ with: makeUser('u1') });
      c.conversation = conversation;
      const log = emissions(c);

      const events = [
        new KeyboardEvent('keydown', { key: 'F10', shiftKey: true }),
        new KeyboardEvent('keydown', { key: 'ContextMenu' }),
      ];
      for (const event of events) {
        const prevented = vi.spyOn(event, 'preventDefault');
        const stopped = vi.spyOn(event, 'stopPropagation');
        c.onKeyDown(event);
        expect(prevented).toHaveBeenCalled();
        expect(stopped).toHaveBeenCalled();
      }
      // The menu trigger is hover-revealed, so keyboard access has to force the hover state.
      expect(c.isHovered).toBe(true);
      expect(log['contextMenuOpen']).toEqual([conversation, conversation]);
      expect(log['contextMenuKeyboardOpen']).toEqual([conversation, conversation]);
      expect(log['itemClick']).toEqual([]);
    });

    it('ignores F10 without Shift, and every other key', () => {
      const { c } = build();
      c.conversation = makeConv({ with: makeUser('u1') });
      const log = emissions(c);

      for (const init of [{ key: 'F10' }, { key: 'ArrowDown' }, { key: 'a' }]) {
        const event = new KeyboardEvent('keydown', init);
        const prevented = vi.spyOn(event, 'preventDefault');
        c.onKeyDown(event);
        expect(prevented).not.toHaveBeenCalled();
      }
      expect(log['itemClick']).toEqual([]);
      expect(log['contextMenuOpen']).toEqual([]);
      expect(log['contextMenuKeyboardOpen']).toEqual([]);
      expect(c.isHovered).toBe(false);
    });
  });
});
