import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * Unit Tests for CometChatGroupMemberItemComponent
 *
 * Tests cover:
 * - Component instantiation with default values (Requirement 4.1)
 * - Member data display: name, avatar, scope (Requirement 4.2)
 * - Scope badge rendering for different scopes (admin, moderator, participant, owner) (Requirement 4.2)
 * - Template overrides: leadingView, titleView, subtitleView, trailingView (Requirement 4.6)
 * - Null member handling (Requirement 4.1)
 * - Output emissions: itemClick, contextMenuOptionClick, itemFocus (Requirement 4.2)
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

  class MockGroupMember extends MockUser {
    private scope: string;
    constructor(uid: string, scope?: string) {
      super(uid);
      this.scope = scope ?? 'participant';
    }
    getScope() {
      return this.scope;
    }
    setScope(s: string) {
      this.scope = s;
    }
  }

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
    getMembersCount() {
      return this.membersCount;
    }
  }

  return {
    CometChat: {
      CometChatException: MockCometChatException,
      User: MockUser,
      Group: MockGroup,
      GroupMember: MockGroupMember,
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
import { CometChatGroupMemberItemComponent } from './cometchat-group-member-item.component';

// ==================== Helper Factories ====================

/**
 * Creates a mock CometChat.GroupMember with sensible defaults.
 */
function createMockMember(overrides?: {
  uid?: string;
  name?: string;
  avatar?: string;
  status?: string;
  scope?: string;
}): CometChat.GroupMember {
  const member = new (CometChat as any).GroupMember(
    overrides?.uid ?? 'member-1',
    overrides?.scope ?? 'participant'
  ) as CometChat.GroupMember;
  (member as any).setName(overrides?.name ?? 'Test Member');
  if (overrides?.avatar) (member as any).setAvatar(overrides.avatar);
  if (overrides?.status) (member as any).setStatus(overrides.status);
  return member;
}

// ==================== Component Factory ====================

/**
 * Creates a CometChatGroupMemberItemComponent instance via Object.create()
 * to bypass Angular's inject() context requirement.
 * Manually wires inputs, outputs, computed signals, and internal state.
 */
function createComponent(overrides?: {
  member?: CometChat.GroupMember;
  isActive?: boolean;
  isSelected?: boolean;
  isFocused?: boolean;
  tabIndex?: number;
  hideUserStatus?: boolean;
  disableDefaultContextMenu?: boolean;
  contextMenuOptions?: any[];
  leadingView?: any;
  titleView?: any;
  subtitleView?: any;
  trailingView?: any;
}): CometChatGroupMemberItemComponent {
  const comp = Object.create(
    CometChatGroupMemberItemComponent.prototype
  ) as CometChatGroupMemberItemComponent;

  // Initialize required input
  comp.member = overrides?.member ?? createMockMember();

  // Initialize state inputs
  comp.isActive = overrides?.isActive ?? false;
  comp.isSelected = overrides?.isSelected ?? false;
  comp.isFocused = overrides?.isFocused ?? false;
  comp.tabIndex = overrides?.tabIndex ?? -1;

  // Initialize display config backing fields
  (comp as any)._hideUserStatus = overrides?.hideUserStatus ?? false;
  (comp as any)._disableDefaultContextMenu = overrides?.disableDefaultContextMenu ?? true;

  // Track explicit set flags
  (comp as any).hideUserStatusExplicitlySet = overrides?.hideUserStatus !== undefined;
  (comp as any).disableDefaultContextMenuExplicitlySet =
    overrides?.disableDefaultContextMenu !== undefined;

  // Initialize global config (null = no global config)
  (comp as any).globalConfig = null;

  // Initialize computed signals for effective values
  comp.effectiveHideUserStatus = computed(() => {
    if ((comp as any).hideUserStatusExplicitlySet) return (comp as any)._hideUserStatus;
    if ((comp as any).globalConfig?.hideUserStatus !== undefined)
      return (comp as any).globalConfig.hideUserStatus;
    return false;
  });
  comp.effectiveDisableDefaultContextMenu = computed(() => {
    if ((comp as any).disableDefaultContextMenuExplicitlySet)
      return (comp as any)._disableDefaultContextMenu;
    if ((comp as any).globalConfig?.disableDefaultContextMenu !== undefined)
      return (comp as any).globalConfig.disableDefaultContextMenu;
    return true;
  });

  // Initialize customization inputs
  comp.contextMenuOptions = overrides?.contextMenuOptions;
  comp.leadingView = overrides?.leadingView;
  comp.titleView = overrides?.titleView;
  comp.subtitleView = overrides?.subtitleView;
  comp.trailingView = overrides?.trailingView;

  // Initialize outputs
  comp.itemClick = new EventEmitter<CometChat.GroupMember>();
  comp.itemFocus = new EventEmitter<void>();
  comp.contextMenuOptionClick = new EventEmitter<any>();

  return comp;
}

// ==================== Unit Tests ====================

describe('CometChatGroupMemberItemComponent', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ==================== Instantiation (Req 4.1) ====================

  describe('instantiation with defaults', () => {
    let component: CometChatGroupMemberItemComponent;

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

    it('has itemClick EventEmitter initialized', () => {
      expect(component.itemClick).toBeInstanceOf(EventEmitter);
    });

    it('has itemFocus EventEmitter initialized', () => {
      expect(component.itemFocus).toBeInstanceOf(EventEmitter);
    });

    it('has contextMenuOptionClick EventEmitter initialized', () => {
      expect(component.contextMenuOptionClick).toBeInstanceOf(EventEmitter);
    });

    it('has effectiveHideUserStatus as false by default', () => {
      expect(component.effectiveHideUserStatus()).toBe(false);
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

    it('has no contextMenuOptions by default', () => {
      expect(component.contextMenuOptions).toBeUndefined();
    });
  });

  // ==================== Member Data Display - Name (Req 4.2) ====================

  describe('member data display - name', () => {
    it('returns member name via avatarName getter', () => {
      const member = createMockMember({ name: 'Alice' });
      const component = createComponent({ member });
      expect(component.avatarName).toBe('Alice');
    });

    it('returns empty string when member name is empty', () => {
      const member = createMockMember({ name: '' });
      const component = createComponent({ member });
      expect(component.avatarName).toBe('');
    });

    it('handles unicode characters in name', () => {
      const member = createMockMember({ name: '用户名 👤 🌟' });
      const component = createComponent({ member });
      expect(component.avatarName).toBe('用户名 👤 🌟');
    });

    it('handles special characters in name', () => {
      const member = createMockMember({ name: "O'Brien & Co." });
      const component = createComponent({ member });
      expect(component.avatarName).toBe("O'Brien & Co.");
    });
  });

  // ==================== Member Data Display - Avatar (Req 4.2) ====================

  describe('member data display - avatar', () => {
    it('returns member avatar URL via avatarImage getter', () => {
      const member = createMockMember({ avatar: 'https://example.com/alice.png' });
      const component = createComponent({ member });
      expect(component.avatarImage).toBe('https://example.com/alice.png');
    });

    it('returns empty string when member has no avatar', () => {
      const member = createMockMember();
      const component = createComponent({ member });
      expect(component.avatarImage).toBe('');
    });
  });

  // ==================== Member Data Display - Scope (Req 4.2) ====================

  describe('member data display - scope', () => {
    it('returns participant scope by default', () => {
      const member = createMockMember({ scope: 'participant' });
      const component = createComponent({ member });
      expect(component.memberScope).toBe('participant');
    });

    it('returns admin scope', () => {
      const member = createMockMember({ scope: 'admin' });
      const component = createComponent({ member });
      expect(component.memberScope).toBe('admin');
    });

    it('returns moderator scope', () => {
      const member = createMockMember({ scope: 'moderator' });
      const component = createComponent({ member });
      expect(component.memberScope).toBe('moderator');
    });

    it('returns owner scope', () => {
      const member = createMockMember({ scope: 'owner' });
      const component = createComponent({ member });
      expect(component.memberScope).toBe('owner');
    });

    it('reflects scope changes on the member object', () => {
      const member = createMockMember({ scope: 'participant' });
      const component = createComponent({ member });
      expect(component.memberScope).toBe('participant');

      (member as any).setScope('admin');
      expect(component.memberScope).toBe('admin');
    });
  });

  // ==================== Scope Badge Rendering (Req 4.2) ====================

  describe('scope badge rendering', () => {
    it('returns localized scope label for admin', () => {
      const member = createMockMember({ scope: 'admin' });
      const component = createComponent({ member });
      // CometChatLocalize.getLocalizedString returns the actual translated value
      const label = component.scopeLabel;
      expect(label).toBeTruthy();
      expect(typeof label).toBe('string');
    });

    it('returns localized scope label for moderator', () => {
      const member = createMockMember({ scope: 'moderator' });
      const component = createComponent({ member });
      const label = component.scopeLabel;
      expect(label).toBeTruthy();
      expect(typeof label).toBe('string');
    });

    it('returns localized scope label for participant', () => {
      const member = createMockMember({ scope: 'participant' });
      const component = createComponent({ member });
      const label = component.scopeLabel;
      expect(label).toBeTruthy();
      expect(typeof label).toBe('string');
    });

    it('returns localized scope label for owner', () => {
      const member = createMockMember({ scope: 'owner' });
      const component = createComponent({ member });
      const label = component.scopeLabel;
      expect(label).toBeTruthy();
      expect(typeof label).toBe('string');
    });

    it('returns different labels for different scopes', () => {
      const adminMember = createMockMember({ scope: 'admin' });
      const modMember = createMockMember({ scope: 'moderator' });
      const adminComp = createComponent({ member: adminMember });
      const modComp = createComponent({ member: modMember });
      expect(adminComp.scopeLabel).not.toBe(modComp.scopeLabel);
    });

    it('updates scope label when scope changes', () => {
      const member = createMockMember({ scope: 'participant' });
      const component = createComponent({ member });
      const originalLabel = component.scopeLabel;

      (member as any).setScope('admin');
      const updatedLabel = component.scopeLabel;
      expect(updatedLabel).not.toBe(originalLabel);
    });
  });

  // ==================== Member Data Display - Status (Req 4.2) ====================

  describe('member data display - status', () => {
    it('returns online status', () => {
      const member = createMockMember({ status: 'online' });
      const component = createComponent({ member });
      expect(component.memberStatus).toBe('online');
    });

    it('returns offline status', () => {
      const member = createMockMember({ status: 'offline' });
      const component = createComponent({ member });
      expect(component.memberStatus).toBe('offline');
    });

    it('defaults to offline when status is not set', () => {
      const member = createMockMember();
      const component = createComponent({ member });
      expect(component.memberStatus).toBe('offline');
    });

    it('reflects status changes on the member object', () => {
      const member = createMockMember({ status: 'online' });
      const component = createComponent({ member });
      expect(component.memberStatus).toBe('online');

      (member as any).setStatus('offline');
      expect(component.memberStatus).toBe('offline');
    });
  });

  // ==================== State Inputs ====================

  describe('state inputs', () => {
    it('accepts isActive true', () => {
      const component = createComponent({ isActive: true });
      expect(component.isActive).toBe(true);
    });

    it('accepts isSelected true', () => {
      const component = createComponent({ isSelected: true });
      expect(component.isSelected).toBe(true);
    });

    it('accepts isFocused true', () => {
      const component = createComponent({ isFocused: true });
      expect(component.isFocused).toBe(true);
    });

    it('accepts tabIndex 0', () => {
      const component = createComponent({ tabIndex: 0 });
      expect(component.tabIndex).toBe(0);
    });

    it('supports multiple active states simultaneously', () => {
      const component = createComponent({
        isActive: true,
        isSelected: true,
        isFocused: true,
        tabIndex: 0,
      });
      expect(component.isActive).toBe(true);
      expect(component.isSelected).toBe(true);
      expect(component.isFocused).toBe(true);
      expect(component.tabIndex).toBe(0);
    });
  });

  // ==================== Display Configuration ====================

  describe('display configuration', () => {
    it('hides user status when hideUserStatus is true', () => {
      const component = createComponent({ hideUserStatus: true });
      expect(component.effectiveHideUserStatus()).toBe(true);
    });

    it('shows user status when hideUserStatus is false', () => {
      const component = createComponent({ hideUserStatus: false });
      expect(component.effectiveHideUserStatus()).toBe(false);
    });

    it('disables default context menu by default', () => {
      const component = createComponent();
      expect(component.effectiveDisableDefaultContextMenu()).toBe(true);
    });

    it('allows enabling default context menu', () => {
      const component = createComponent({ disableDefaultContextMenu: false });
      expect(component.effectiveDisableDefaultContextMenu()).toBe(false);
    });
  });

  // ==================== Output Emissions (Req 4.2) ====================

  describe('output emissions', () => {
    it('emits itemClick with member when handleClick is called', () => {
      const member = createMockMember({ name: 'Alice' });
      const component = createComponent({ member });
      const spy = vi.spyOn(component.itemClick, 'emit');

      component.handleClick();

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(member);
    });

    it('emits contextMenuOptionClick with option and member', () => {
      const member = createMockMember({ name: 'Bob' });
      const component = createComponent({ member });
      const spy = vi.spyOn(component.contextMenuOptionClick, 'emit');
      const option = { id: 'kick', title: 'Kick' } as any;

      component.handleContextMenuOptionClick(option);

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith({ option, member });
    });

    it('emits itemFocus when onItemFocus is called', () => {
      const component = createComponent();
      const spy = vi.spyOn(component.itemFocus, 'emit');

      component.onItemFocus();

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('emits multiple itemClick events for multiple clicks', () => {
      const component = createComponent();
      const spy = vi.spyOn(component.itemClick, 'emit');

      component.handleClick();
      component.handleClick();
      component.handleClick();

      expect(spy).toHaveBeenCalledTimes(3);
    });
  });

  // ==================== Keyboard Interaction (Req 4.2) ====================

  describe('keyboard interaction', () => {
    it('calls handleClick on Enter key', () => {
      const component = createComponent();
      const spy = vi.spyOn(component, 'handleClick');
      const event = {
        key: 'Enter',
        shiftKey: false,
        preventDefault: vi.fn(),
      } as unknown as KeyboardEvent;

      component.onKeyDown(event);

      expect(spy).toHaveBeenCalledTimes(1);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('calls handleClick on Space key', () => {
      const component = createComponent();
      const spy = vi.spyOn(component, 'handleClick');
      const event = {
        key: ' ',
        shiftKey: false,
        preventDefault: vi.fn(),
      } as unknown as KeyboardEvent;

      component.onKeyDown(event);

      expect(spy).toHaveBeenCalledTimes(1);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('opens context menu on Shift+F10', () => {
      const component = createComponent();
      const spy = vi.spyOn(component, 'handleContextMenuOpen');
      const event = {
        key: 'F10',
        shiftKey: true,
        preventDefault: vi.fn(),
      } as unknown as KeyboardEvent;

      component.onKeyDown(event);

      expect(spy).toHaveBeenCalledTimes(1);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('opens context menu on ContextMenu key', () => {
      const component = createComponent();
      const spy = vi.spyOn(component, 'handleContextMenuOpen');
      const event = {
        key: 'ContextMenu',
        shiftKey: false,
        preventDefault: vi.fn(),
      } as unknown as KeyboardEvent;

      component.onKeyDown(event);

      expect(spy).toHaveBeenCalledTimes(1);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('does not call handleClick on unrelated keys', () => {
      const component = createComponent();
      const clickSpy = vi.spyOn(component, 'handleClick');
      const contextSpy = vi.spyOn(component, 'handleContextMenuOpen');
      const event = {
        key: 'Tab',
        shiftKey: false,
        preventDefault: vi.fn(),
      } as unknown as KeyboardEvent;

      component.onKeyDown(event);

      expect(clickSpy).not.toHaveBeenCalled();
      expect(contextSpy).not.toHaveBeenCalled();
    });
  });

  // ==================== Mouse Interaction ====================

  describe('mouse interaction', () => {
    it('prevents default on mousedown to avoid focus ring on click', () => {
      const component = createComponent();
      const event = { preventDefault: vi.fn() } as unknown as MouseEvent;

      component.handleMouseDown(event);

      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('prevents default context menu when disableDefaultContextMenu is true', () => {
      const component = createComponent({ disableDefaultContextMenu: true });
      const event = { preventDefault: vi.fn() } as unknown as MouseEvent;

      component.handleContextMenu(event);

      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('allows default context menu when disableDefaultContextMenu is false', () => {
      const component = createComponent({ disableDefaultContextMenu: false });
      const event = { preventDefault: vi.fn() } as unknown as MouseEvent;

      component.handleContextMenu(event);

      expect(event.preventDefault).not.toHaveBeenCalled();
    });
  });

  // ==================== Template Overrides (Req 4.6) ====================

  describe('template overrides', () => {
    it('accepts leadingView template', () => {
      const template = {} as any;
      const component = createComponent({ leadingView: template });
      expect(component.leadingView).toBe(template);
    });

    it('accepts titleView template', () => {
      const template = {} as any;
      const component = createComponent({ titleView: template });
      expect(component.titleView).toBe(template);
    });

    it('accepts subtitleView template', () => {
      const template = {} as any;
      const component = createComponent({ subtitleView: template });
      expect(component.subtitleView).toBe(template);
    });

    it('accepts trailingView template', () => {
      const template = {} as any;
      const component = createComponent({ trailingView: template });
      expect(component.trailingView).toBe(template);
    });

    it('accepts all templates simultaneously', () => {
      const leading = {} as any;
      const title = {} as any;
      const subtitle = {} as any;
      const trailing = {} as any;
      const component = createComponent({
        leadingView: leading,
        titleView: title,
        subtitleView: subtitle,
        trailingView: trailing,
      });
      expect(component.leadingView).toBe(leading);
      expect(component.titleView).toBe(title);
      expect(component.subtitleView).toBe(subtitle);
      expect(component.trailingView).toBe(trailing);
    });
  });

  // ==================== Accessible Label ====================

  describe('accessible label', () => {
    it('includes member name in accessible label', () => {
      const member = createMockMember({ name: 'Alice', status: 'online' });
      const component = createComponent({ member });
      expect(component.accessibleLabel).toContain('Alice');
    });

    it('includes admin scope in accessible label', () => {
      const member = createMockMember({ name: 'Alice', scope: 'admin' });
      const component = createComponent({ member });
      const label = component.accessibleLabel;
      expect(label).toContain('Alice');
      // Label should be longer than just the name (includes scope info)
      expect(label.length).toBeGreaterThan('Alice'.length);
    });

    it('includes moderator scope in accessible label', () => {
      const member = createMockMember({ name: 'Bob', scope: 'moderator' });
      const component = createComponent({ member });
      const label = component.accessibleLabel;
      expect(label).toContain('Bob');
      expect(label.length).toBeGreaterThan('Bob'.length);
    });

    it('does not include scope for participants', () => {
      const member = createMockMember({ name: 'Charlie', scope: 'participant' });
      const component = createComponent({ member, hideUserStatus: true });
      const label = component.accessibleLabel;
      expect(label).toContain('Charlie');
      // Participants don't get scope announced, and status is hidden
      // so label should just be the name
      expect(label).toBe('Charlie');
    });

    it('includes owner scope in accessible label', () => {
      const member = createMockMember({ name: 'Dave', scope: 'owner' });
      const component = createComponent({ member });
      const label = component.accessibleLabel;
      expect(label).toContain('Dave');
      expect(label.length).toBeGreaterThan('Dave'.length);
    });

    it('includes status info when hideUserStatus is false', () => {
      const member = createMockMember({ name: 'Alice', status: 'online' });
      const component = createComponent({ member, hideUserStatus: false });
      const label = component.accessibleLabel;
      expect(label).toContain('Alice');
      // Should contain status info (localized), making label longer than just name
      expect(label.length).toBeGreaterThan('Alice'.length);
    });

    it('excludes status info when hideUserStatus is true', () => {
      const member = createMockMember({ name: 'Alice', status: 'online', scope: 'participant' });
      const component = createComponent({ member, hideUserStatus: true });
      const label = component.accessibleLabel;
      expect(label).toContain('Alice');
      // With participant scope (not announced) and hidden status, label is just the name
      expect(label).toBe('Alice');
    });

    it('updates when member changes', () => {
      const member1 = createMockMember({ name: 'Alice' });
      const component = createComponent({ member: member1 });
      expect(component.accessibleLabel).toContain('Alice');

      const member2 = createMockMember({ name: 'Bob' });
      component.member = member2;
      expect(component.accessibleLabel).toContain('Bob');
      expect(component.accessibleLabel).not.toContain('Alice');
    });
  });

  // ==================== Null Member Handling (Req 4.1) ====================

  describe('null member handling', () => {
    it('returns empty string for avatarImage when member is null', () => {
      const component = createComponent();
      (component as any).member = null;
      expect(component.avatarImage).toBe('');
    });

    it('returns empty string for avatarName when member is null', () => {
      const component = createComponent();
      (component as any).member = null;
      expect(component.avatarName).toBe('');
    });

    it('returns offline for memberStatus when member is null', () => {
      const component = createComponent();
      (component as any).member = null;
      expect(component.memberStatus).toBe('offline');
    });

    it('returns participant for memberScope when member is null', () => {
      const component = createComponent();
      (component as any).member = null;
      expect(component.memberScope).toBe('participant');
    });

    it('returns empty string for avatarImage when member is undefined', () => {
      const component = createComponent();
      (component as any).member = undefined;
      expect(component.avatarImage).toBe('');
    });

    it('returns empty string for avatarName when member is undefined', () => {
      const component = createComponent();
      (component as any).member = undefined;
      expect(component.avatarName).toBe('');
    });

    it('returns offline for memberStatus when member is undefined', () => {
      const component = createComponent();
      (component as any).member = undefined;
      expect(component.memberStatus).toBe('offline');
    });

    it('returns participant for memberScope when member is undefined', () => {
      const component = createComponent();
      (component as any).member = undefined;
      expect(component.memberScope).toBe('participant');
    });
  });

  // ==================== Context Menu Options ====================

  describe('context menu options', () => {
    it('accepts context menu options array', () => {
      const options = [
        { id: 'kick', title: 'Kick' },
        { id: 'ban', title: 'Ban' },
      ] as any[];
      const component = createComponent({ contextMenuOptions: options });
      expect(component.contextMenuOptions).toBe(options);
      expect(component.contextMenuOptions!.length).toBe(2);
    });

    it('accepts empty context menu options', () => {
      const component = createComponent({ contextMenuOptions: [] });
      expect(component.contextMenuOptions).toEqual([]);
    });
  });

  // ==================== Integration Scenarios ====================

  describe('integration scenarios', () => {
    it('handles complete member interaction flow', () => {
      const member = createMockMember({ name: 'Alice', scope: 'admin' });
      const component = createComponent({ member });
      const clickSpy = vi.spyOn(component.itemClick, 'emit');
      const optionSpy = vi.spyOn(component.contextMenuOptionClick, 'emit');

      // Click an option
      const option = { id: 'change-scope', title: 'Change Scope' } as any;
      component.handleContextMenuOptionClick(option);
      expect(optionSpy).toHaveBeenCalledWith({ option, member });

      // Click the item
      component.handleClick();
      expect(clickSpy).toHaveBeenCalledWith(member);
    });

    it('maintains state consistency when member changes', () => {
      const member1 = createMockMember({
        name: 'Alice',
        avatar: 'https://a.com/1.png',
        status: 'online',
        scope: 'admin',
      });
      const component = createComponent({ member: member1, isActive: true, isSelected: true });

      expect(component.avatarName).toBe('Alice');
      expect(component.avatarImage).toBe('https://a.com/1.png');
      expect(component.memberStatus).toBe('online');
      expect(component.memberScope).toBe('admin');

      // Swap member
      const member2 = createMockMember({
        name: 'Bob',
        avatar: 'https://b.com/2.png',
        status: 'offline',
        scope: 'moderator',
      });
      component.member = member2;

      // State inputs remain
      expect(component.isActive).toBe(true);
      expect(component.isSelected).toBe(true);

      // Member data updates
      expect(component.avatarName).toBe('Bob');
      expect(component.avatarImage).toBe('https://b.com/2.png');
      expect(component.memberStatus).toBe('offline');
      expect(component.memberScope).toBe('moderator');
    });
  });

  // ─── Accessibility ───

  describe('Accessibility', () => {
    it('should provide accessible member name', () => {
      const component = createComponent({ member: createMockMember({ name: 'Alice' }) });
      expect(component.avatarName).toBe('Alice');
    });

    it('should provide accessible member scope', () => {
      const component = createComponent({ member: createMockMember({ scope: 'admin' }) });
      expect(component.memberScope).toBe('admin');
    });
  });
});
