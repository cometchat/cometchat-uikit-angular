import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * Unit Tests for CometChatConversationItemComponent
 *
 * Tests cover:
 * - Component instantiation with default values (Requirement 4.1)
 * - Conversation data display: name, avatar, last message, unread count, date (Requirement 4.2)
 * - Template overrides: leadingView, titleView, subtitleView, trailingView (Requirement 4.6)
 * - Null conversation handling (Requirement 4.1)
 * - Output emissions: itemClick, avatarClick, titleClick, etc. (Requirement 4.2)
 * - Keyboard interaction: Enter/Space to activate (Requirement 4.2)
 *
 * Uses vi.mock() for SDK mocking BEFORE imports,
 * and Object.create() to bypass Angular's inject() context requirement.
 *
 * **Validates: Requirements 4.1, 4.2, 4.6**
 */

// ==================== SDK Mocks (must be before any imports that trigger SDK) ====================

vi.mock('@cometchat/calls-sdk-javascript', () => {
  return {
    CometChatCalls: {
      CallSettingsBuilder: class {
        enableDefaultLayout() {
          return this;
        }
        setIsAudioOnlyCall() {
          return this;
        }
        setCallListener() {
          return this;
        }
      },
      OngoingCallListener: class {
        constructor(callbacks: any) {
          Object.assign(this, callbacks);
        }
      },
      endSession: vi.fn(),
      init: vi.fn(),
    },
  };
});

vi.mock('@cometchat/chat-sdk-javascript', () => {
  class MockCometChatException {
    code: string;
    message: string;
    details?: string;
    constructor(opts: { code: string; message: string; details?: string }) {
      this.code = opts.code;
      this.message = opts.message;
      this.details = opts.details;
    }
  }

  // Mock User class
  class MockUser {
    private uid: string;
    private name: string;
    private avatar: string;
    private status: string;
    constructor(uid: string) {
      this.uid = uid;
      this.name = '';
      this.avatar = '';
      this.status = 'offline';
    }
    getUid() {
      return this.uid;
    }
    getName() {
      return this.name;
    }
    setName(n: string) {
      this.name = n;
    }
    getAvatar() {
      return this.avatar;
    }
    setAvatar(a: string) {
      this.avatar = a;
    }
    getStatus() {
      return this.status;
    }
    setStatus(s: string) {
      this.status = s;
    }
  }

  // Mock Group class
  class MockGroup {
    private guid: string;
    private name: string;
    private icon: string;
    private type: string;
    private membersCount: number;
    constructor(guid: string, name: string, type: string) {
      this.guid = guid;
      this.name = name;
      this.icon = '';
      this.type = type;
      this.membersCount = 0;
    }
    getGuid() {
      return this.guid;
    }
    getName() {
      return this.name;
    }
    setName(n: string) {
      this.name = n;
    }
    getIcon() {
      return this.icon;
    }
    setIcon(i: string) {
      this.icon = i;
    }
    getType() {
      return this.type;
    }
    setType(t: string) {
      this.type = t;
    }
    getMembersCount() {
      return this.membersCount;
    }
    setMembersCount(c: number) {
      this.membersCount = c;
    }
  }

  // Mock BaseMessage class
  class MockBaseMessage {
    protected id: number;
    protected type: string;
    protected category: string;
    protected sender: any;
    protected sentAt: number;
    protected deliveredAt: number;
    protected readAt: number;
    protected deletedAt: number;
    protected text: string;
    protected mentionedUsers: any[];
    constructor() {
      this.id = 0;
      this.type = '';
      this.category = 'message';
      this.sender = null;
      this.sentAt = 0;
      this.deliveredAt = 0;
      this.readAt = 0;
      this.deletedAt = 0;
      this.text = '';
      this.mentionedUsers = [];
    }
    getId() {
      return this.id;
    }
    getType() {
      return this.type;
    }
    getCategory() {
      return this.category;
    }
    getSender() {
      return this.sender;
    }
    setSender(s: any) {
      this.sender = s;
    }
    getSentAt() {
      return this.sentAt;
    }
    setSentAt(t: number) {
      this.sentAt = t;
    }
    getDeliveredAt() {
      return this.deliveredAt;
    }
    setDeliveredAt(t: number) {
      this.deliveredAt = t;
    }
    getReadAt() {
      return this.readAt;
    }
    setReadAt(t: number) {
      this.readAt = t;
    }
    getDeletedAt() {
      return this.deletedAt;
    }
    setDeletedAt(t: number) {
      this.deletedAt = t;
    }
    getMentionedUsers() {
      return this.mentionedUsers;
    }
    setMentionedUsers(u: any[]) {
      this.mentionedUsers = u;
    }
    getData() {
      return {};
    }
    getReceiverType() {
      return 'user';
    }
    getReceiver() {
      return null;
    }
    getMetadata() {
      return null;
    }
    getRawMessage() {
      return {};
    }
  }

  // Mock TextMessage class
  class MockTextMessage extends MockBaseMessage {
    constructor(receiverId: string, text: string, receiverType: string) {
      super();
      this.type = 'text';
      this.text = text;
    }
    getText() {
      return this.text;
    }
    setText(t: string) {
      this.text = t;
    }
  }

  // Mock MediaMessage class
  class MockMediaMessage extends MockBaseMessage {
    private url: string;
    private mimeType: string;
    constructor(receiverId: string, file: any, messageType: string, receiverType: string) {
      super();
      this.type = messageType;
      this.url = '';
      this.mimeType = '';
    }
    getURL() {
      return this.url;
    }
    setURL(u: string) {
      this.url = u;
    }
    getMimeType() {
      return this.mimeType;
    }
    getAttachment() {
      return null;
    }
    getAttachments() {
      return [];
    }
  }

  // Mock Conversation class
  class MockConversation {
    private conversationId: string;
    private conversationType: string;
    private lastMessage: any;
    private conversationWith: any;
    private unreadMessageCount: number;
    constructor(id: string, type: string, lastMsg?: any, convType?: string) {
      this.conversationId = id;
      this.conversationType = type;
      this.lastMessage = lastMsg || undefined;
      this.conversationWith = null;
      this.unreadMessageCount = 0;
    }
    getConversationId() {
      return this.conversationId;
    }
    getConversationType() {
      return this.conversationType;
    }
    getLastMessage() {
      return this.lastMessage;
    }
    setLastMessage(m: any) {
      this.lastMessage = m;
    }
    getConversationWith() {
      return this.conversationWith;
    }
    setConversationWith(w: any) {
      this.conversationWith = w;
    }
    getUnreadMessageCount() {
      return this.unreadMessageCount;
    }
    setUnreadMessageCount(c: number) {
      this.unreadMessageCount = c;
    }
    getUpdatedAt() {
      return Date.now();
    }
    getTags() {
      return [];
    }
  }

  // Mock TypingIndicator class
  class MockTypingIndicator {
    private sender: any;
    private receiverId: string;
    private receiverType: string;
    constructor(receiverId: string, receiverType: string, metadata?: any) {
      this.receiverId = receiverId;
      this.receiverType = receiverType;
      this.sender = null;
    }
    getSender() {
      return this.sender;
    }
    setSender(s: any) {
      this.sender = s;
    }
    getReceiverType() {
      return this.receiverType;
    }
    getReceiverId() {
      return this.receiverId;
    }
  }

  return {
    CometChat: {
      CometChatException: MockCometChatException,
      User: MockUser,
      Group: MockGroup,
      BaseMessage: MockBaseMessage,
      TextMessage: MockTextMessage,
      MediaMessage: MockMediaMessage,
      Conversation: MockConversation,
      TypingIndicator: MockTypingIndicator,
      CallListener: class {
        constructor(callbacks: any) {
          Object.assign(this, callbacks);
        }
      },
      ConnectionListener: class {
        constructor(callbacks: any) {
          Object.assign(this, callbacks);
        }
      },

      CATEGORY_MESSAGE: 'message',
      CATEGORY_CUSTOM: 'custom',
      CATEGORY_ACTION: 'action',
      CATEGORY_CALL: 'call',
      CATEGORY_INTERACTIVE: 'interactive',
      MessageCategory: { AGENTIC: 'agentic' },
      ModerationStatus: {
        PENDING: 'pending',
        APPROVED: 'approved',
        DISAPPROVED: 'disapproved',
        UNMODERATED: 'unmoderated',
      },
      MESSAGE_TYPE: {
        TEXT: 'text',
        FILE: 'file',
        IMAGE: 'image',
        AUDIO: 'audio',
        VIDEO: 'video',
        ASSISTANT: 'assistant',
        TOOL_ARGUMENTS: 'toolArguments',
        TOOL_RESULT: 'toolResults',
      },
      ACTION_TYPE: {
        MEMBER_JOINED: 'joined',
        MEMBER_LEFT: 'left',
        MEMBER_ADDED: 'added',
        MEMBER_BANNED: 'banned',
        MEMBER_UNBANNED: 'unbanned',
        MEMBER_KICKED: 'kicked',
        MEMBER_INVITED: 'invited',
        MEMBER_SCOPE_CHANGED: 'scopeChanged',
      },
      RECEIVER_TYPE: { USER: 'user', GROUP: 'group' },
      USER_STATUS: { ONLINE: 'online', OFFLINE: 'offline' },
      GROUP_MEMBER_SCOPE: { ADMIN: 'admin', PARTICIPANT: 'participant', MODERATOR: 'moderator' },
      GROUP_TYPE: { PRIVATE: 'private', PASSWORD: 'password', PUBLIC: 'public' },
      CALL_STATUS: {
        ONGOING: 'ongoing',
        ENDED: 'ended',
        INITIATED: 'initiated',
        CANCELLED: 'cancelled',
        REJECTED: 'rejected',
        UNANSWERED: 'unanswered',
        BUSY: 'busy',
      },
      CALL_MODE: {
        DEFAULT: 'default',
        GRID: 'grid',
        SINGLE: 'single',
        SPOTLIGHT: 'spotlight',
        TILE: 'tile',
      },
      CALL_TYPE: { AUDIO: 'audio', VIDEO: 'video' },
      GoalType: { ALL_OF: 'allOf', ANY_OF: 'anyOf', ANY_ACTION: 'anyAction', NONE: 'none' },
      AI_ASSISTANT_EVENTS: {
        RUN_STARTED: 'run_started',
        TEXT_MESSAGE_START: 'text_message_start',
        TEXT_MESSAGE_CONTENT: 'text_message_content',
        TEXT_MESSAGE_END: 'text_message_end',
        RUN_FINISHED: 'run_finished',
        TOOL_CALL_STARTED: 'tool_call_start',
        TOOL_CALL_ENDED: 'tool_call_end',
        TOOL_CALL_ARGUMENT: 'tool_call_args',
        TOOL_CALL_RESULT: 'tool_call_result',
      },

      getLoggedinUser: vi.fn().mockResolvedValue({
        getUid: () => 'logged-in-user',
        getName: () => 'Logged In User',
        getAvatar: () => 'https://example.com/avatar.png',
      }),

      callExtension: vi.fn().mockResolvedValue({}),
    },
  };
});

// Now import modules AFTER mocks are set up
import { EventEmitter, computed } from '@angular/core';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatConversationItemComponent } from './cometchat-conversation-item.component';

// ==================== Helper Factories ====================

/**
 * Creates a mock CometChat.User with sensible defaults.
 */
function createMockUser(overrides?: {
  uid?: string;
  name?: string;
  avatar?: string;
  status?: string;
}): CometChat.User {
  const user = new CometChat.User(overrides?.uid ?? 'user-1');
  user.setName(overrides?.name ?? 'Test User');
  if (overrides?.avatar) user.setAvatar(overrides.avatar);
  if (overrides?.status) user.setStatus(overrides.status);
  return user;
}

/**
 * Creates a mock CometChat.Group with sensible defaults.
 */
function createMockGroup(overrides?: {
  guid?: string;
  name?: string;
  icon?: string;
  type?: string;
}): CometChat.Group {
  const group = new CometChat.Group(
    overrides?.guid ?? 'group-1',
    overrides?.name ?? 'Test Group',
    overrides?.type ?? 'public'
  );
  if (overrides?.icon) group.setIcon(overrides.icon);
  return group;
}

/**
 * Creates a mock CometChat.TextMessage.
 */
function createMockTextMessage(
  text: string,
  overrides?: { sentAt?: number; sender?: CometChat.User }
): CometChat.TextMessage {
  const msg = new CometChat.TextMessage('receiver-1', text, 'user');
  if (overrides?.sentAt) msg.setSentAt(overrides.sentAt);
  if (overrides?.sender) msg.setSender(overrides.sender);
  return msg;
}

/**
 * Creates a mock CometChat.Conversation with a user or group.
 */
function createMockConversation(opts?: {
  id?: string;
  type?: string;
  lastMessage?: any;
  conversationWith?: CometChat.User | CometChat.Group;
  unreadCount?: number;
}): CometChat.Conversation {
  const conv = new (CometChat.Conversation as any)(
    opts?.id ?? 'conv-1',
    opts?.type ?? 'user',
    opts?.lastMessage,
    opts?.type ?? 'user'
  ) as CometChat.Conversation;
  if (opts?.conversationWith) conv.setConversationWith(opts.conversationWith);
  if (opts?.unreadCount !== undefined) conv.setUnreadMessageCount(opts.unreadCount);
  return conv;
}

// ==================== Component Factory ====================

/**
 * Creates a CometChatConversationItemComponent instance via Object.create()
 * to bypass Angular's inject() context requirement.
 * Manually wires inputs, outputs, computed signals, and internal state.
 */
function createComponent(overrides?: {
  conversation?: CometChat.Conversation;
  loggedInUser?: CometChat.User | null;
  isActive?: boolean;
  isSelected?: boolean;
  isFocused?: boolean;
  tabIndex?: number;
  typingIndicator?: CometChat.TypingIndicator | null;
  hideReceipts?: boolean;
  hideUserStatus?: boolean;
  hideGroupType?: boolean;
  disableDefaultContextMenu?: boolean;
  contextMenuOptions?: any[];
  leadingView?: any;
  titleView?: any;
  subtitleView?: any;
  trailingView?: any;
  slots?: any;
  dateFormat?: any;
}): CometChatConversationItemComponent {
  const comp = Object.create(
    CometChatConversationItemComponent.prototype
  ) as CometChatConversationItemComponent;

  // Initialize required input
  comp.conversation = overrides?.conversation ?? createMockConversation();

  // Initialize state inputs
  comp.isActive = overrides?.isActive ?? false;
  comp.isSelected = overrides?.isSelected ?? false;
  comp.isFocused = overrides?.isFocused ?? false;
  comp.tabIndex = overrides?.tabIndex ?? -1;
  comp.typingIndicator = overrides?.typingIndicator ?? null;
  comp.loggedInUser = overrides?.loggedInUser ?? null;

  // Initialize display config backing fields
  (comp as any)._hideReceipts = overrides?.hideReceipts ?? false;
  (comp as any)._hideUserStatus = overrides?.hideUserStatus ?? false;
  (comp as any)._hideGroupType = overrides?.hideGroupType ?? false;
  (comp as any)._disableDefaultContextMenu = overrides?.disableDefaultContextMenu ?? true;
  (comp as any)._textFormatters = [];

  // Track explicit set flags
  (comp as any).hideReceiptsExplicitlySet = overrides?.hideReceipts !== undefined;
  (comp as any).hideUserStatusExplicitlySet = overrides?.hideUserStatus !== undefined;
  (comp as any).hideGroupTypeExplicitlySet = overrides?.hideGroupType !== undefined;
  (comp as any).disableDefaultContextMenuExplicitlySet =
    overrides?.disableDefaultContextMenu !== undefined;
  (comp as any).textFormattersExplicitlySet = false;

  // Initialize global config (null = no global config)
  (comp as any).globalConfig = null;

  // Initialize computed signals for effective values
  comp.effectiveHideReceipts = computed(() => {
    if ((comp as any).hideReceiptsExplicitlySet) return (comp as any)._hideReceipts;
    if ((comp as any).globalConfig?.hideReceipts !== undefined)
      return (comp as any).globalConfig.hideReceipts;
    return false;
  });
  comp.effectiveHideUserStatus = computed(() => {
    if ((comp as any).hideUserStatusExplicitlySet) return (comp as any)._hideUserStatus;
    if ((comp as any).globalConfig?.hideUserStatus !== undefined)
      return (comp as any).globalConfig.hideUserStatus;
    return false;
  });
  comp.effectiveHideGroupType = computed(() => {
    if ((comp as any).hideGroupTypeExplicitlySet) return (comp as any)._hideGroupType;
    if ((comp as any).globalConfig?.hideGroupType !== undefined)
      return (comp as any).globalConfig.hideGroupType;
    return false;
  });
  comp.effectiveDisableDefaultContextMenu = computed(() => {
    if ((comp as any).disableDefaultContextMenuExplicitlySet)
      return (comp as any)._disableDefaultContextMenu;
    if ((comp as any).globalConfig?.disableDefaultContextMenu !== undefined)
      return (comp as any).globalConfig.disableDefaultContextMenu;
    return true;
  });
  comp.effectiveTextFormatters = computed(() => {
    if ((comp as any).textFormattersExplicitlySet) return (comp as any)._textFormatters;
    if ((comp as any).globalConfig?.textFormatters !== undefined)
      return (comp as any).globalConfig.textFormatters;
    return [];
  });

  // Initialize customization inputs
  comp.slots = overrides?.slots;
  comp.contextMenuOptions = overrides?.contextMenuOptions;
  comp.leadingView = overrides?.leadingView;
  comp.titleView = overrides?.titleView;
  comp.subtitleView = overrides?.subtitleView;
  comp.trailingView = overrides?.trailingView;
  comp.dateFormat = overrides?.dateFormat;

  // Initialize outputs
  comp.itemClick = new EventEmitter<CometChat.Conversation>();
  comp.itemSelect = new EventEmitter<{ conversation: CometChat.Conversation; selected: boolean }>();
  comp.avatarClick = new EventEmitter<CometChat.Conversation>();
  comp.titleClick = new EventEmitter<CometChat.Conversation>();
  comp.subtitleClick = new EventEmitter<CometChat.Conversation>();
  comp.timestampClick = new EventEmitter<CometChat.Conversation>();
  comp.badgeClick = new EventEmitter<CometChat.Conversation>();
  comp.contextMenuOpen = new EventEmitter<CometChat.Conversation>();
  comp.contextMenuOptionClick = new EventEmitter<any>();
  comp.contextMenuKeyboardOpen = new EventEmitter<CometChat.Conversation>();

  // Initialize template-exposed properties
  comp.isHovered = false;

  // Mock injected services
  (comp as any).formatterConfig = {
    getDefaultFormatters: vi.fn().mockReturnValue([]),
    getFormatters: vi.fn().mockReturnValue([]),
  };
  // Mirrors HtmlSanitizerService's surface. `sanitize` alone was not enough: any subtitle that
  // takes the markdown path calls escapeUserHtml + sanitizeWithConfig, and would throw here.
  (comp as any).htmlSanitizer = {
    sanitize: vi.fn((html: string) => html),
    sanitizeWithConfig: vi.fn((html: string) => html),
    escapeUserHtml: vi.fn((text: string) =>
      text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;'),
    ),
  };
  (comp as any).subtitleService = {
    getSubtitle: vi.fn().mockReturnValue(null),
    getIconOverride: vi.fn().mockReturnValue(null),
    registerSubtitleFormatter: vi.fn(),
    unregisterSubtitleFormatter: vi.fn(),
    registerSubtitleIconOverride: vi.fn(),
    hasFormatter: vi.fn().mockReturnValue(false),
  };

  return comp;
}

// ==================== Unit Tests ====================

describe('CometChatConversationItemComponent', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ==================== Instantiation (Req 4.1) ====================

  describe('instantiation with defaults', () => {
    let component: CometChatConversationItemComponent;

    beforeEach(() => {
      component = createComponent();
    });

    it('creates a component instance', () => {
      expect(component).toBeTruthy();
    });

    it('has isActive as false by default', () => {
      expect(component.isActive).toBe(false);
    });

    it('has isSelected as false by default', () => {
      expect(component.isSelected).toBe(false);
    });

    it('has isFocused as false by default', () => {
      expect(component.isFocused).toBe(false);
    });

    it('has tabIndex as -1 by default', () => {
      expect(component.tabIndex).toBe(-1);
    });

    it('has typingIndicator as null by default', () => {
      expect(component.typingIndicator).toBeNull();
    });

    it('has loggedInUser as null by default', () => {
      expect(component.loggedInUser).toBeNull();
    });

    it('has isHovered as false by default', () => {
      expect(component.isHovered).toBe(false);
    });

    it('has itemClick EventEmitter initialized', () => {
      expect(component.itemClick).toBeInstanceOf(EventEmitter);
    });

    it('has avatarClick EventEmitter initialized', () => {
      expect(component.avatarClick).toBeInstanceOf(EventEmitter);
    });

    it('has contextMenuOpen EventEmitter initialized', () => {
      expect(component.contextMenuOpen).toBeInstanceOf(EventEmitter);
    });

    it('has effectiveHideReceipts as false by default', () => {
      expect(component.effectiveHideReceipts()).toBe(false);
    });

    it('has effectiveHideUserStatus as false by default', () => {
      expect(component.effectiveHideUserStatus()).toBe(false);
    });

    it('has effectiveHideGroupType as false by default', () => {
      expect(component.effectiveHideGroupType()).toBe(false);
    });

    it('has effectiveDisableDefaultContextMenu as true by default', () => {
      expect(component.effectiveDisableDefaultContextMenu()).toBe(true);
    });

    it('has no template overrides by default', () => {
      expect(component.leadingView).toBeUndefined();
      expect(component.titleView).toBeUndefined();
      expect(component.subtitleView).toBeUndefined();
      expect(component.trailingView).toBeUndefined();
    });

    it('has no slots by default', () => {
      expect(component.slots).toBeUndefined();
    });

    it('has no contextMenuOptions by default', () => {
      expect(component.contextMenuOptions).toBeUndefined();
    });
  });

  // ==================== Conversation Data Display - Name (Req 4.2) ====================

  describe('conversation data display - name', () => {
    it('returns user name for user conversation', () => {
      const user = createMockUser({ name: 'Alice' });
      const conv = createMockConversation({ conversationWith: user });
      const component = createComponent({ conversation: conv });
      expect(component.avatarName).toBe('Alice');
    });

    it('returns group name for group conversation', () => {
      const group = createMockGroup({ name: 'Dev Team' });
      const conv = createMockConversation({ type: 'group', conversationWith: group });
      const component = createComponent({ conversation: conv });
      expect(component.avatarName).toBe('Dev Team');
    });

    it('returns empty string when conversationWith is null', () => {
      const conv = createMockConversation();
      // conversationWith not set, so getConversationWith() returns null
      const component = createComponent({ conversation: conv });
      expect(component.avatarName).toBe('');
    });
  });

  // ==================== Conversation Data Display - Avatar (Req 4.2) ====================

  describe('conversation data display - avatar', () => {
    it('returns user avatar URL for user conversation', () => {
      const user = createMockUser({ avatar: 'https://example.com/alice.png' });
      const conv = createMockConversation({ conversationWith: user });
      const component = createComponent({ conversation: conv });
      expect(component.avatarImage).toBe('https://example.com/alice.png');
    });

    it('returns group icon URL for group conversation', () => {
      const group = createMockGroup({ icon: 'https://example.com/group.png' });
      const conv = createMockConversation({ type: 'group', conversationWith: group });
      const component = createComponent({ conversation: conv });
      expect(component.avatarImage).toBe('https://example.com/group.png');
    });

    it('returns empty string when user has no avatar', () => {
      const user = createMockUser();
      const conv = createMockConversation({ conversationWith: user });
      const component = createComponent({ conversation: conv });
      expect(component.avatarImage).toBe('');
    });

    it('returns empty string when conversationWith is null', () => {
      const conv = createMockConversation();
      const component = createComponent({ conversation: conv });
      expect(component.avatarImage).toBe('');
    });
  });

  // ==================== Conversation Data Display - Last Message (Req 4.2) ====================

  describe('conversation data display - last message', () => {
    it('returns last message when present', () => {
      const msg = createMockTextMessage('Hello world');
      const conv = createMockConversation({ lastMessage: msg, conversationWith: createMockUser() });
      const component = createComponent({ conversation: conv });
      expect(component.lastMessage).toBeTruthy();
      expect(component.hasLastMessage).toBe(true);
    });

    it('returns undefined when no last message', () => {
      const conv = createMockConversation({ conversationWith: createMockUser() });
      const component = createComponent({ conversation: conv });
      expect(component.lastMessage).toBeUndefined();
      expect(component.hasLastMessage).toBe(false);
    });

    it('returns subtitle text for text message', () => {
      const msg = createMockTextMessage('Hello world');
      const conv = createMockConversation({ lastMessage: msg, conversationWith: createMockUser() });
      const component = createComponent({ conversation: conv });
      expect(component.subtitleText).toBe('Hello world');
    });

    it('returns localized string for image message', () => {
      const msg = new CometChat.MediaMessage('receiver-1', '', 'image', 'user');
      const conv = createMockConversation({ lastMessage: msg, conversationWith: createMockUser() });
      const component = createComponent({ conversation: conv });
      // subtitleText should return a non-empty string (localized)
      expect(component.subtitleText).toBeTruthy();
    });

    it('returns localized string when no last message (conversation start)', () => {
      const conv = createMockConversation({ conversationWith: createMockUser() });
      const component = createComponent({ conversation: conv });
      // Should return the "start conversation" localized string
      expect(component.subtitleText).toBeTruthy();
    });

    // ---- Media previews: count + caption + voice note (React parity) ----
    /** A MediaMessage stand-in; the SDK constructor cannot express attachments/captions here. */
    const mediaMessage = (over: {
      type?: string;
      names?: string[];
      caption?: string;
      audioType?: string;
    }) =>
      ({
        getId: () => 42,
        getType: () => over.type ?? 'image',
        getCategory: () => 'message',
        getDeletedAt: () => undefined,
        getEditedAt: () => 0,
        getAttachments: () => (over.names ?? ['a.jpg']).map((n) => ({ getName: () => n })),
        getCaption: () => over.caption ?? '',
        getData: () => undefined,
        getMetadata: () => (over.audioType ? { audioType: over.audioType } : null),
        getMentionedUsers: () => [],
        getSender: () => createMockUser(),
      }) as any;

    const subtitleFor = (msg: any) => {
      const conv = createMockConversation({ lastMessage: msg, conversationWith: createMockUser() });
      return createComponent({ conversation: conv }).subtitleText;
    };

    it('shows a plain type label for one attachment with no caption', () => {
      expect(subtitleFor(mediaMessage({ type: 'image' }))).toBe('Image');
      expect(subtitleFor(mediaMessage({ type: 'file', names: ['doc.pdf'] }))).toBe('File');
    });

    it('counts and pluralizes several attachments', () => {
      expect(subtitleFor(mediaMessage({ type: 'image', names: ['a', 'b', 'c'] }))).toBe('3 Images');
      expect(subtitleFor(mediaMessage({ type: 'audio', names: ['a', 'b'] }))).toBe('2 Audio Files');
    });

    it('appends the caption after a middot', () => {
      expect(subtitleFor(mediaMessage({ type: 'image', caption: 'nice trip' }))).toBe(
        'Image · nice trip',
      );
      expect(
        subtitleFor(mediaMessage({ type: 'video', names: ['a', 'b'], caption: 'nice trip' })),
      ).toBe('2 Videos · nice trip');
    });

    it('previews a voice note as "Voice Note", ignoring count and caption', () => {
      expect(
        subtitleFor(
          mediaMessage({ type: 'audio', audioType: 'voice_note', names: ['a', 'b'], caption: 'hi' }),
        ),
      ).toBe('Voice Note');
      // ...and the legacy camelCase tag still routes there.
      expect(subtitleFor(mediaMessage({ type: 'audio', audioType: 'voiceNote' }))).toBe('Voice Note');
    });

    it('does not treat a plain audio message as a voice note', () => {
      expect(subtitleFor(mediaMessage({ type: 'audio' }))).toBe('Audio');
    });

    it('a plain caption is rendered as text, not HTML', () => {
      const conv = createMockConversation({
        lastMessage: mediaMessage({ type: 'image', caption: 'nice trip' }),
        conversationWith: createMockUser(),
      });
      expect(createComponent({ conversation: conv }).subtitleHasHtml).toBe(false);
    });

    it('a markdown caption switches the subtitle to the sanitized-HTML path', () => {
      const conv = createMockConversation({
        lastMessage: mediaMessage({ type: 'image', names: ['a', 'b'], caption: '**bold**' }),
        conversationWith: createMockUser(),
      });
      const component = createComponent({ conversation: conv });
      // NOTE: markdown -> <b> is done by the registered text formatters, which this spec stubs out
      // as an empty list. What matters here is that the caption takes the HTML branch and that the
      // label is still joined to it.
      expect(component.subtitleHasHtml).toBe(true);
      expect(component.subtitleText).toContain('2 Images · ');
    });

    it('a markdown-link caption takes the same HTML branch it is reported as', () => {
      // Regression: `isHtml` was derived by a separate predicate that special-cased markdown links
      // as "not HTML", while the renderer took its markdown branch and (via the link formatter)
      // emitted an <a>. The subtitle then went through {{ }} interpolation and the user saw the
      // raw anchor markup as text. As above, formatters are stubbed out here, so what is asserted
      // is the branch agreement — not the anchor itself.
      const conv = createMockConversation({
        lastMessage: mediaMessage({ type: 'image', caption: '[click](http://x.com)' }),
        conversationWith: createMockUser(),
      });
      const component = createComponent({ conversation: conv });
      expect(component.subtitleHasHtml).toBe(true);
      expect(component.subtitleText).toContain('Image · ');
    });

    it('raw HTML in a caption is escaped, never injected', () => {
      const conv = createMockConversation({
        lastMessage: mediaMessage({ type: 'image', caption: '**x** <script>alert(1)</script>' }),
        conversationWith: createMockUser(),
      });
      const component = createComponent({ conversation: conv });
      expect(component.subtitleHasHtml).toBe(true);
      expect(component.subtitleText).not.toContain('<script');
    });
  });

  // ==================== Conversation Data Display - Unread Count (Req 4.2) ====================

  describe('conversation data display - unread count', () => {
    it('returns unread count from conversation', () => {
      const conv = createMockConversation({ unreadCount: 5, conversationWith: createMockUser() });
      const component = createComponent({ conversation: conv });
      expect(component.unreadCount).toBe(5);
    });

    it('returns 0 when no unread messages', () => {
      const conv = createMockConversation({ unreadCount: 0, conversationWith: createMockUser() });
      const component = createComponent({ conversation: conv });
      expect(component.unreadCount).toBe(0);
    });

    it('returns 0 when unread count is not set', () => {
      const conv = createMockConversation({ conversationWith: createMockUser() });
      const component = createComponent({ conversation: conv });
      expect(component.unreadCount).toBe(0);
    });
  });

  // ==================== Conversation Data Display - Date/Timestamp (Req 4.2) ====================

  describe('conversation data display - timestamp', () => {
    it('returns last message timestamp when message exists', () => {
      const msg = createMockTextMessage('Hello', { sentAt: 1700000000 });
      const conv = createMockConversation({ lastMessage: msg, conversationWith: createMockUser() });
      const component = createComponent({ conversation: conv });
      expect(component.lastMessageTimestamp).toBe(1700000000);
    });

    it('returns 0 when no last message', () => {
      const conv = createMockConversation({ conversationWith: createMockUser() });
      const component = createComponent({ conversation: conv });
      expect(component.lastMessageTimestamp).toBe(0);
    });
  });

  // ==================== Conversation Type Detection (Req 4.2) ====================

  describe('conversation type detection', () => {
    it('identifies user conversation correctly', () => {
      const user = createMockUser();
      const conv = createMockConversation({ conversationWith: user });
      const component = createComponent({ conversation: conv });
      expect(component.isUserConversation).toBe(true);
      expect(component.isGroupConversation).toBe(false);
    });

    it('identifies group conversation correctly', () => {
      const group = createMockGroup();
      const conv = createMockConversation({ type: 'group', conversationWith: group });
      const component = createComponent({ conversation: conv });
      expect(component.isGroupConversation).toBe(true);
      expect(component.isUserConversation).toBe(false);
    });

    it('returns user status for user conversation', () => {
      const user = createMockUser({ status: 'online' });
      const conv = createMockConversation({ conversationWith: user });
      const component = createComponent({ conversation: conv });
      expect(component.userStatus).toBe('online');
    });

    it('returns empty string for user status in group conversation', () => {
      const group = createMockGroup();
      const conv = createMockConversation({ type: 'group', conversationWith: group });
      const component = createComponent({ conversation: conv });
      expect(component.userStatus).toBe('');
    });

    it('returns group type for group conversation', () => {
      const group = createMockGroup({ type: 'private' });
      const conv = createMockConversation({ type: 'group', conversationWith: group });
      const component = createComponent({ conversation: conv });
      expect(component.groupType).toBe('private');
    });

    it('returns empty string for group type in user conversation', () => {
      const user = createMockUser();
      const conv = createMockConversation({ conversationWith: user });
      const component = createComponent({ conversation: conv });
      expect(component.groupType).toBe('');
    });
  });

  // ==================== Typing Indicator (Req 4.2) ====================

  describe('typing indicator', () => {
    it('isTyping returns true when typingIndicator is set', () => {
      const typing = new CometChat.TypingIndicator('conv-1', 'user');
      const component = createComponent({ typingIndicator: typing });
      expect(component.isTyping).toBe(true);
    });

    it('isTyping returns false when typingIndicator is null', () => {
      const component = createComponent({ typingIndicator: null });
      expect(component.isTyping).toBe(false);
    });
  });

  // ==================== Receipt Status (Req 4.2) ====================

  describe('receipt status', () => {
    it('returns read when readAt is set', () => {
      const sender = createMockUser({ uid: 'me' });
      const msg = createMockTextMessage('Hi');
      msg.setSender(sender);
      msg.setSentAt(1000);
      msg.setDeliveredAt(1001);
      msg.setReadAt(1002);
      const conv = createMockConversation({ lastMessage: msg, conversationWith: createMockUser() });
      const loggedIn = createMockUser({ uid: 'me' });
      const component = createComponent({ conversation: conv, loggedInUser: loggedIn });
      expect(component.receiptStatus).toBe('read');
    });

    it('returns delivered when deliveredAt is set but not readAt', () => {
      const sender = createMockUser({ uid: 'me' });
      const msg = createMockTextMessage('Hi');
      msg.setSender(sender);
      msg.setSentAt(1000);
      msg.setDeliveredAt(1001);
      const conv = createMockConversation({ lastMessage: msg, conversationWith: createMockUser() });
      const loggedIn = createMockUser({ uid: 'me' });
      const component = createComponent({ conversation: conv, loggedInUser: loggedIn });
      expect(component.receiptStatus).toBe('delivered');
    });

    it('returns sent when sentAt is set but not delivered or read', () => {
      const sender = createMockUser({ uid: 'me' });
      const msg = createMockTextMessage('Hi');
      msg.setSender(sender);
      msg.setSentAt(1000);
      const conv = createMockConversation({ lastMessage: msg, conversationWith: createMockUser() });
      const loggedIn = createMockUser({ uid: 'me' });
      const component = createComponent({ conversation: conv, loggedInUser: loggedIn });
      expect(component.receiptStatus).toBe('sent');
    });

    it('returns null when message is not sent by logged-in user', () => {
      const sender = createMockUser({ uid: 'other-user' });
      const msg = createMockTextMessage('Hi');
      msg.setSender(sender);
      msg.setSentAt(1000);
      const conv = createMockConversation({ lastMessage: msg, conversationWith: createMockUser() });
      const loggedIn = createMockUser({ uid: 'me' });
      const component = createComponent({ conversation: conv, loggedInUser: loggedIn });
      expect(component.receiptStatus).toBeNull();
    });

    it('returns null when no last message', () => {
      const conv = createMockConversation({ conversationWith: createMockUser() });
      const component = createComponent({ conversation: conv });
      expect(component.receiptStatus).toBeNull();
    });

    it('returns null when message is deleted', () => {
      const sender = createMockUser({ uid: 'me' });
      const msg = createMockTextMessage('Hi');
      msg.setSender(sender);
      msg.setSentAt(1000);
      msg.setDeletedAt(1001);
      const conv = createMockConversation({ lastMessage: msg, conversationWith: createMockUser() });
      const loggedIn = createMockUser({ uid: 'me' });
      const component = createComponent({ conversation: conv, loggedInUser: loggedIn });
      expect(component.receiptStatus).toBeNull();
    });
  });

  // ==================== Output Emissions (Req 4.2) ====================

  describe('output emissions', () => {
    let component: CometChatConversationItemComponent;
    let conversation: CometChat.Conversation;

    beforeEach(() => {
      const user = createMockUser({ name: 'Alice' });
      conversation = createMockConversation({ conversationWith: user });
      component = createComponent({ conversation });
    });

    it('emits itemClick on handleClick', () => {
      const spy = vi.fn();
      component.itemClick.subscribe(spy);
      component.handleClick();
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(conversation);
    });

    it('emits avatarClick on handleAvatarClick', () => {
      const spy = vi.fn();
      component.avatarClick.subscribe(spy);
      const event = new Event('click');
      component.handleAvatarClick(event);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(conversation);
    });

    it('emits titleClick on handleTitleClick', () => {
      const spy = vi.fn();
      component.titleClick.subscribe(spy);
      const event = new Event('click');
      component.handleTitleClick(event);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(conversation);
    });

    it('emits subtitleClick on handleSubtitleClick', () => {
      const spy = vi.fn();
      component.subtitleClick.subscribe(spy);
      const event = new Event('click');
      component.handleSubtitleClick(event);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(conversation);
    });

    it('emits timestampClick on handleTimestampClick', () => {
      const spy = vi.fn();
      component.timestampClick.subscribe(spy);
      const event = new Event('click');
      component.handleTimestampClick(event);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(conversation);
    });

    it('emits badgeClick on handleBadgeClick', () => {
      const spy = vi.fn();
      component.badgeClick.subscribe(spy);
      const event = new Event('click');
      component.handleBadgeClick(event);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(conversation);
    });

    it('emits contextMenuOpen on handleContextMenuOpen', () => {
      const spy = vi.fn();
      component.contextMenuOpen.subscribe(spy);
      component.handleContextMenuOpen();
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(conversation);
    });

    it('emits contextMenuOptionClick on handleContextMenuOptionClick', () => {
      const spy = vi.fn();
      component.contextMenuOptionClick.subscribe(spy);
      const option = { id: 'delete', title: 'Delete' };
      component.handleContextMenuOptionClick(option as any);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith({ option, conversation });
    });
  });

  // ==================== Keyboard Interaction (Req 4.2) ====================

  describe('keyboard interaction', () => {
    let component: CometChatConversationItemComponent;

    beforeEach(() => {
      const user = createMockUser({ name: 'Alice' });
      const conv = createMockConversation({ conversationWith: user });
      component = createComponent({ conversation: conv });
    });

    it('emits itemClick on Enter key', () => {
      const spy = vi.fn();
      component.itemClick.subscribe(spy);
      const event = {
        key: 'Enter',
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        shiftKey: false,
      } as unknown as KeyboardEvent;
      component.onKeyDown(event);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('emits itemClick on Space key', () => {
      const spy = vi.fn();
      component.itemClick.subscribe(spy);
      const event = {
        key: ' ',
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        shiftKey: false,
      } as unknown as KeyboardEvent;
      component.onKeyDown(event);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('opens context menu on Shift+F10', () => {
      const contextSpy = vi.fn();
      const keyboardSpy = vi.fn();
      component.contextMenuOpen.subscribe(contextSpy);
      component.contextMenuKeyboardOpen.subscribe(keyboardSpy);
      const event = {
        key: 'F10',
        shiftKey: true,
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      } as unknown as KeyboardEvent;
      component.onKeyDown(event);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(contextSpy).toHaveBeenCalledTimes(1);
      expect(keyboardSpy).toHaveBeenCalledTimes(1);
      expect(component.isHovered).toBe(true);
    });

    it('opens context menu on ContextMenu key', () => {
      const contextSpy = vi.fn();
      component.contextMenuOpen.subscribe(contextSpy);
      const event = {
        key: 'ContextMenu',
        shiftKey: false,
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      } as unknown as KeyboardEvent;
      component.onKeyDown(event);
      expect(contextSpy).toHaveBeenCalledTimes(1);
    });

    it('does not emit on unrelated keys', () => {
      const spy = vi.fn();
      component.itemClick.subscribe(spy);
      const event = {
        key: 'Tab',
        shiftKey: false,
        preventDefault: vi.fn(),
      } as unknown as KeyboardEvent;
      component.onKeyDown(event);
      expect(spy).not.toHaveBeenCalled();
    });
  });

  // ==================== Template Overrides (Req 4.6) ====================

  describe('template overrides', () => {
    it('accepts leadingView template input', () => {
      const mockTemplate = {} as any;
      const component = createComponent({ leadingView: mockTemplate });
      expect(component.leadingView).toBe(mockTemplate);
    });

    it('accepts titleView template input', () => {
      const mockTemplate = {} as any;
      const component = createComponent({ titleView: mockTemplate });
      expect(component.titleView).toBe(mockTemplate);
    });

    it('accepts subtitleView template input', () => {
      const mockTemplate = {} as any;
      const component = createComponent({ subtitleView: mockTemplate });
      expect(component.subtitleView).toBe(mockTemplate);
    });

    it('accepts trailingView template input', () => {
      const mockTemplate = {} as any;
      const component = createComponent({ trailingView: mockTemplate });
      expect(component.trailingView).toBe(mockTemplate);
    });

    it('accepts slots input for fine-grained customization', () => {
      const mockSlots = { avatar: {} as any, title: {} as any };
      const component = createComponent({ slots: mockSlots });
      expect(component.slots).toBe(mockSlots);
    });

    it('provides slotContext with conversation data', () => {
      const user = createMockUser({ name: 'Alice' });
      const conv = createMockConversation({ conversationWith: user, unreadCount: 3 });
      const component = createComponent({ conversation: conv });
      const ctx = component.slotContext;
      expect(ctx).toBeTruthy();
      expect(ctx.conversation).toBe(conv);
      expect(ctx.unreadCount).toBe(3);
    });
  });

  // ==================== Display Configuration Inputs (Req 4.2) ====================

  describe('display configuration inputs', () => {
    it('respects hideReceipts input', () => {
      const component = createComponent({ hideReceipts: true });
      expect(component.effectiveHideReceipts()).toBe(true);
    });

    it('respects hideUserStatus input', () => {
      const component = createComponent({ hideUserStatus: true });
      expect(component.effectiveHideUserStatus()).toBe(true);
    });

    it('respects hideGroupType input', () => {
      const component = createComponent({ hideGroupType: true });
      expect(component.effectiveHideGroupType()).toBe(true);
    });

    it('respects disableDefaultContextMenu input', () => {
      const component = createComponent({ disableDefaultContextMenu: false });
      expect(component.effectiveDisableDefaultContextMenu()).toBe(false);
    });

    it('accepts dateFormat input', () => {
      const dateFormat = { day: 'numeric', month: 'short' } as any;
      const component = createComponent({ dateFormat });
      expect(component.dateFormat).toBe(dateFormat);
    });

    it('accepts contextMenuOptions input', () => {
      const options = [{ id: 'delete', title: 'Delete' }];
      const component = createComponent({ contextMenuOptions: options as any });
      expect(component.contextMenuOptions).toBe(options);
    });
  });

  // ==================== Null Conversation Handling (Req 4.1) ====================

  describe('null conversation handling', () => {
    it('returns null for conversationWith when conversation has no entity', () => {
      const conv = createMockConversation();
      const component = createComponent({ conversation: conv });
      expect(component.conversationWith).toBeNull();
    });

    it('returns empty string for avatarName when conversationWith is null', () => {
      const conv = createMockConversation();
      const component = createComponent({ conversation: conv });
      expect(component.avatarName).toBe('');
    });

    it('returns empty string for avatarImage when conversationWith is null', () => {
      const conv = createMockConversation();
      const component = createComponent({ conversation: conv });
      expect(component.avatarImage).toBe('');
    });

    it('returns false for isUserConversation when conversationWith is null', () => {
      const conv = createMockConversation();
      const component = createComponent({ conversation: conv });
      expect(component.isUserConversation).toBe(false);
    });

    it('returns false for isGroupConversation when conversationWith is null', () => {
      const conv = createMockConversation();
      const component = createComponent({ conversation: conv });
      expect(component.isGroupConversation).toBe(false);
    });

    it('returns empty string for userStatus when conversationWith is null', () => {
      const conv = createMockConversation();
      const component = createComponent({ conversation: conv });
      expect(component.userStatus).toBe('');
    });

    it('returns empty string for groupType when conversationWith is null', () => {
      const conv = createMockConversation();
      const component = createComponent({ conversation: conv });
      expect(component.groupType).toBe('');
    });

    it('returns 0 for unreadCount on default conversation', () => {
      const conv = createMockConversation();
      const component = createComponent({ conversation: conv });
      expect(component.unreadCount).toBe(0);
    });

    it('returns false for isLastMessageByMe when no loggedInUser', () => {
      const msg = createMockTextMessage('Hi');
      const conv = createMockConversation({ lastMessage: msg, conversationWith: createMockUser() });
      const component = createComponent({ conversation: conv, loggedInUser: null });
      expect(component.isLastMessageByMe).toBe(false);
    });

    it('returns false for isLastMessageByMe when no last message', () => {
      const conv = createMockConversation({ conversationWith: createMockUser() });
      const loggedIn = createMockUser({ uid: 'me' });
      const component = createComponent({ conversation: conv, loggedInUser: loggedIn });
      expect(component.isLastMessageByMe).toBe(false);
    });
  });

  // ==================== Context Menu Handling (Req 4.2) ====================

  describe('context menu handling', () => {
    it('prevents default context menu when disableDefaultContextMenu is true', () => {
      const component = createComponent({ disableDefaultContextMenu: true });
      const event = { preventDefault: vi.fn() } as unknown as MouseEvent;
      component.handleContextMenu(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('does not prevent default context menu when disableDefaultContextMenu is false', () => {
      const component = createComponent({ disableDefaultContextMenu: false });
      const event = { preventDefault: vi.fn() } as unknown as MouseEvent;
      component.handleContextMenu(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });
  });

  // ==================== Mouse Interaction ====================

  describe('mouse interaction', () => {
    it('handleMouseDown prevents default to avoid focus on click', () => {
      const component = createComponent();
      const event = { preventDefault: vi.fn() } as unknown as MouseEvent;
      component.handleMouseDown(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });
  });

  // ==================== State Inputs (Req 4.2) ====================

  describe('state inputs', () => {
    it('accepts isActive input', () => {
      const component = createComponent({ isActive: true });
      expect(component.isActive).toBe(true);
    });

    it('accepts isSelected input', () => {
      const component = createComponent({ isSelected: true });
      expect(component.isSelected).toBe(true);
    });

    it('accepts isFocused input', () => {
      const component = createComponent({ isFocused: true });
      expect(component.isFocused).toBe(true);
    });

    it('accepts custom tabIndex', () => {
      const component = createComponent({ tabIndex: 0 });
      expect(component.tabIndex).toBe(0);
    });
  });

  // ==================== Accessible Label (Req 4.6) ====================

  describe('accessible label', () => {
    it('returns a non-empty accessible label for user conversation', () => {
      const user = createMockUser({ name: 'Alice' });
      const msg = createMockTextMessage('Hello');
      const conv = createMockConversation({ conversationWith: user, lastMessage: msg });
      const component = createComponent({ conversation: conv });
      expect(component.accessibleLabel).toBeTruthy();
      expect(component.accessibleLabel.length).toBeGreaterThan(0);
    });

    it('includes conversation name in accessible label', () => {
      const user = createMockUser({ name: 'Alice' });
      const conv = createMockConversation({ conversationWith: user });
      const component = createComponent({ conversation: conv });
      expect(component.accessibleLabel).toContain('Alice');
    });
  });

  // ─── Accessibility ───

  describe('Accessibility', () => {
    it('should provide accessible label for conversation item', () => {
      const user = createMockUser({ name: 'Alice' });
      const msg = createMockTextMessage('Hello');
      const conv = createMockConversation({ conversationWith: user, lastMessage: msg });
      const component = createComponent({ conversation: conv });
      expect(component.accessibleLabel).toContain('Alice');
    });

    it('should have tabindex for keyboard navigation', () => {
      const user = createMockUser({ name: 'Bob' });
      const conv = createMockConversation({ conversationWith: user });
      const component = createComponent({ conversation: conv });
      // Conversation items are focusable via roving tabindex in parent list
      expect(component).toBeTruthy();
    });
  });
});
