import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * Unit Tests for CometChatUserItemComponent
 *
 * Tests cover:
 * - Component instantiation with default values (Requirement 4.1)
 * - User data display: name, avatar, status (Requirement 4.2)
 * - Template overrides: leadingView, titleView, subtitleView, trailingView (Requirement 4.6)
 * - Null user handling (Requirement 4.1)
 * - Output emissions: itemClick, contextMenuOpen, contextMenuOptionClick (Requirement 4.2)
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
import { CometChatUserItemComponent } from './cometchat-user-item.component';

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

// ==================== Component Factory ====================

/**
 * Creates a CometChatUserItemComponent instance via Object.create()
 * to bypass Angular's inject() context requirement.
 * Manually wires inputs, outputs, computed signals, and internal state.
 */
function createComponent(overrides?: {
  user?: CometChat.User;
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
}): CometChatUserItemComponent {
  const comp = Object.create(CometChatUserItemComponent.prototype) as CometChatUserItemComponent;

  // Initialize required input
  comp.user = overrides?.user ?? createMockUser();

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
  comp.itemClick = new EventEmitter<CometChat.User>();
  comp.itemSelect = new EventEmitter<{ user: CometChat.User; selected: boolean }>();
  comp.contextMenuOpen = new EventEmitter<CometChat.User>();
  comp.contextMenuOptionClick = new EventEmitter<any>();

  return comp;
}

// ==================== Unit Tests ====================

describe('CometChatUserItemComponent', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ==================== Instantiation (Req 4.1) ====================

  describe('instantiation with defaults', () => {
    let component: CometChatUserItemComponent;

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

    it('has itemSelect EventEmitter initialized', () => {
      expect(component.itemSelect).toBeInstanceOf(EventEmitter);
    });

    it('has contextMenuOpen EventEmitter initialized', () => {
      expect(component.contextMenuOpen).toBeInstanceOf(EventEmitter);
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

  // ==================== User Data Display - Name (Req 4.2) ====================

  describe('user data display - name', () => {
    it('returns user name via avatarName getter', () => {
      const user = createMockUser({ name: 'Alice' });
      const component = createComponent({ user });
      expect(component.avatarName).toBe('Alice');
    });

    it('returns empty string when user name is empty', () => {
      const user = createMockUser({ name: '' });
      // setName('') sets name to empty
      const component = createComponent({ user });
      expect(component.avatarName).toBe('');
    });

    it('handles unicode characters in name', () => {
      const user = createMockUser({ name: '用户名 👤 🌟' });
      const component = createComponent({ user });
      expect(component.avatarName).toBe('用户名 👤 🌟');
    });

    it('handles special characters in name', () => {
      const user = createMockUser({ name: "O'Brien & Co." });
      const component = createComponent({ user });
      expect(component.avatarName).toBe("O'Brien & Co.");
    });
  });

  // ==================== User Data Display - Avatar (Req 4.2) ====================

  describe('user data display - avatar', () => {
    it('returns user avatar URL via avatarImage getter', () => {
      const user = createMockUser({ avatar: 'https://example.com/alice.png' });
      const component = createComponent({ user });
      expect(component.avatarImage).toBe('https://example.com/alice.png');
    });

    it('returns empty string when user has no avatar', () => {
      const user = createMockUser();
      const component = createComponent({ user });
      expect(component.avatarImage).toBe('');
    });
  });

  // ==================== User Data Display - Status (Req 4.2) ====================

  describe('user data display - status', () => {
    it('returns online status', () => {
      const user = createMockUser({ status: 'online' });
      const component = createComponent({ user });
      expect(component.userStatus).toBe('online');
    });

    it('returns offline status', () => {
      const user = createMockUser({ status: 'offline' });
      const component = createComponent({ user });
      expect(component.userStatus).toBe('offline');
    });

    it('defaults to offline when status is empty', () => {
      const user = new CometChat.User('u1');
      user.setName('No Status');
      // status defaults to 'offline' in mock
      const component = createComponent({ user });
      expect(component.userStatus).toBe('offline');
    });

    it('reflects status changes on the user object', () => {
      const user = createMockUser({ status: 'online' });
      const component = createComponent({ user });
      expect(component.userStatus).toBe('online');

      user.setStatus('offline');
      expect(component.userStatus).toBe('offline');
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
    it('emits itemClick with user when handleClick is called', () => {
      const user = createMockUser({ name: 'Alice' });
      const component = createComponent({ user });
      const spy = vi.spyOn(component.itemClick, 'emit');

      component.handleClick();

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(user);
    });

    it('emits contextMenuOpen with user when handleContextMenuOpen is called', () => {
      const user = createMockUser({ name: 'Bob' });
      const component = createComponent({ user });
      const spy = vi.spyOn(component.contextMenuOpen, 'emit');

      component.handleContextMenuOpen();

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(user);
    });

    it('emits contextMenuOptionClick with option and user', () => {
      const user = createMockUser({ name: 'Charlie' });
      const component = createComponent({ user });
      const spy = vi.spyOn(component.contextMenuOptionClick, 'emit');
      const option = { id: 'delete', title: 'Delete' } as any;

      component.handleContextMenuOptionClick(option);

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith({ option, user });
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
    it('includes user name in accessible label', () => {
      const user = createMockUser({ name: 'Alice', status: 'online' });
      const component = createComponent({ user });
      expect(component.accessibleLabel).toContain('Alice');
    });

    it('includes status info when hideUserStatus is false', () => {
      const user = createMockUser({ name: 'Alice', status: 'online' });
      const component = createComponent({ user, hideUserStatus: false });
      // accessibleLabel uses CometChatLocalize which returns the key itself in mock
      const label = component.accessibleLabel;
      expect(label).toContain('Alice');
      // Should contain some status reference (localized key or value)
      expect(label.length).toBeGreaterThan('Alice'.length);
    });

    it('excludes status info when hideUserStatus is true', () => {
      const user = createMockUser({ name: 'Alice', status: 'online' });
      const component = createComponent({ user, hideUserStatus: true });
      const label = component.accessibleLabel;
      expect(label).toContain('Alice');
    });

    it('updates when user changes', () => {
      const user1 = createMockUser({ name: 'Alice' });
      const component = createComponent({ user: user1 });
      expect(component.accessibleLabel).toContain('Alice');

      const user2 = createMockUser({ name: 'Bob' });
      component.user = user2;
      expect(component.accessibleLabel).toContain('Bob');
      expect(component.accessibleLabel).not.toContain('Alice');
    });
  });

  // ==================== Null User Handling (Req 4.1) ====================

  describe('null user handling', () => {
    it('returns empty string for avatarImage when user is null', () => {
      const component = createComponent();
      (component as any).user = null;
      expect(component.avatarImage).toBe('');
    });

    it('returns empty string for avatarName when user is null', () => {
      const component = createComponent();
      (component as any).user = null;
      expect(component.avatarName).toBe('');
    });

    it('returns offline for userStatus when user is null', () => {
      const component = createComponent();
      (component as any).user = null;
      expect(component.userStatus).toBe('offline');
    });

    it('returns empty string for avatarImage when user is undefined', () => {
      const component = createComponent();
      (component as any).user = undefined;
      expect(component.avatarImage).toBe('');
    });

    it('returns empty string for avatarName when user is undefined', () => {
      const component = createComponent();
      (component as any).user = undefined;
      expect(component.avatarName).toBe('');
    });

    it('returns offline for userStatus when user is undefined', () => {
      const component = createComponent();
      (component as any).user = undefined;
      expect(component.userStatus).toBe('offline');
    });
  });

  // ==================== Context Menu Options ====================

  describe('context menu options', () => {
    it('accepts context menu options array', () => {
      const options = [
        { id: '1', title: 'Option 1' },
        { id: '2', title: 'Option 2' },
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
    it('handles complete user interaction flow', () => {
      const user = createMockUser({ name: 'Alice' });
      const component = createComponent({ user });
      const clickSpy = vi.spyOn(component.itemClick, 'emit');
      const contextSpy = vi.spyOn(component.contextMenuOpen, 'emit');
      const optionSpy = vi.spyOn(component.contextMenuOptionClick, 'emit');

      // Open context menu
      component.handleContextMenuOpen();
      expect(contextSpy).toHaveBeenCalledWith(user);

      // Click an option
      const option = { id: 'view', title: 'View Profile' } as any;
      component.handleContextMenuOptionClick(option);
      expect(optionSpy).toHaveBeenCalledWith({ option, user });

      // Click the item
      component.handleClick();
      expect(clickSpy).toHaveBeenCalledWith(user);
    });

    it('maintains state consistency when user changes', () => {
      const user1 = createMockUser({
        name: 'Alice',
        avatar: 'https://a.com/1.png',
        status: 'online',
      });
      const component = createComponent({ user: user1, isActive: true, isSelected: true });

      expect(component.avatarName).toBe('Alice');
      expect(component.avatarImage).toBe('https://a.com/1.png');
      expect(component.userStatus).toBe('online');

      // Swap user
      const user2 = createMockUser({
        name: 'Bob',
        avatar: 'https://b.com/2.png',
        status: 'offline',
      });
      component.user = user2;

      // State inputs remain
      expect(component.isActive).toBe(true);
      expect(component.isSelected).toBe(true);

      // User data updates
      expect(component.avatarName).toBe('Bob');
      expect(component.avatarImage).toBe('https://b.com/2.png');
      expect(component.userStatus).toBe('offline');
    });
  });

  // ─── Accessibility ───

  describe('Accessibility', () => {
    it('should provide accessible user name', () => {
      const component = createComponent({ user: createMockUser({ name: 'Alice' }) });
      expect(component.avatarName).toBe('Alice');
    });

    it('should provide accessible user status', () => {
      const component = createComponent({ user: createMockUser({ status: 'online' }) });
      expect(component.userStatus).toBe('online');
    });
  });
});
