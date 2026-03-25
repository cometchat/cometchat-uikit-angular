import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * Unit Tests for CometChatGroupItemComponent
 *
 * Tests cover:
 * - Component instantiation with default values (Requirement 4.1)
 * - Group data display: name, icon, member count, type (Requirement 4.2)
 * - Template overrides: leadingView, titleView, subtitleView, trailingView (Requirement 4.6)
 * - Null group handling (Requirement 4.1)
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
    setMembersCount(c: number) {
      this.membersCount = c;
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
import { CometChatGroupItemComponent } from './cometchat-group-item.component';

// ==================== Helper Factories ====================

/**
 * Creates a mock CometChat.Group with sensible defaults.
 */
function createMockGroup(overrides?: {
  guid?: string;
  name?: string;
  type?: string;
  membersCount?: number;
  icon?: string;
}): CometChat.Group {
  const group = new CometChat.Group(
    overrides?.guid ?? 'group-1',
    overrides?.name ?? 'Test Group',
    overrides?.type ?? 'public'
  );
  if (overrides?.icon) group.setIcon(overrides.icon);
  if (overrides?.membersCount !== undefined) group.setMembersCount(overrides.membersCount);
  return group;
}

// ==================== Component Factory ====================

/**
 * Creates a CometChatGroupItemComponent instance via Object.create()
 * to bypass Angular's inject() context requirement.
 * Manually wires inputs, outputs, computed signals, and internal state.
 */
function createComponent(overrides?: {
  group?: CometChat.Group;
  isActive?: boolean;
  isSelected?: boolean;
  isFocused?: boolean;
  tabIndex?: number;
  hideGroupType?: boolean;
  disableDefaultContextMenu?: boolean;
  contextMenuOptions?: any[];
  leadingView?: any;
  titleView?: any;
  subtitleView?: any;
  trailingView?: any;
}): CometChatGroupItemComponent {
  const comp = Object.create(CometChatGroupItemComponent.prototype) as CometChatGroupItemComponent;

  // Initialize required input
  comp.group = overrides?.group ?? createMockGroup();

  // Initialize state inputs
  comp.isActive = overrides?.isActive ?? false;
  comp.isSelected = overrides?.isSelected ?? false;
  comp.isFocused = overrides?.isFocused ?? false;
  comp.tabIndex = overrides?.tabIndex ?? -1;

  // Initialize display config backing fields
  (comp as any)._hideGroupType = overrides?.hideGroupType ?? false;
  (comp as any)._disableDefaultContextMenu = overrides?.disableDefaultContextMenu ?? true;

  // Track explicit set flags
  (comp as any).hideGroupTypeExplicitlySet = overrides?.hideGroupType !== undefined;
  (comp as any).disableDefaultContextMenuExplicitlySet =
    overrides?.disableDefaultContextMenu !== undefined;

  // Initialize global config (null = no global config)
  (comp as any).globalConfig = null;

  // Initialize computed signals for effective values
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

  // Initialize customization inputs
  comp.contextMenuOptions = overrides?.contextMenuOptions;
  comp.leadingView = overrides?.leadingView;
  comp.titleView = overrides?.titleView;
  comp.subtitleView = overrides?.subtitleView;
  comp.trailingView = overrides?.trailingView;

  // Initialize outputs
  comp.itemClick = new EventEmitter<CometChat.Group>();
  comp.itemSelect = new EventEmitter<{ group: CometChat.Group; selected: boolean }>();
  comp.contextMenuOpen = new EventEmitter<CometChat.Group>();
  comp.contextMenuOptionClick = new EventEmitter<any>();
  comp.itemFocus = new EventEmitter<void>();

  return comp;
}

// ==================== Unit Tests ====================

describe('CometChatGroupItemComponent', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ==================== Instantiation (Req 4.1) ====================

  describe('instantiation with defaults', () => {
    let component: CometChatGroupItemComponent;

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

    it('has itemFocus EventEmitter initialized', () => {
      expect(component.itemFocus).toBeInstanceOf(EventEmitter);
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

    it('has no contextMenuOptions by default', () => {
      expect(component.contextMenuOptions).toBeUndefined();
    });
  });

  // ==================== Group Data Display - Name (Req 4.2) ====================

  describe('group data display - name', () => {
    it('returns group name via groupName getter', () => {
      const group = createMockGroup({ name: 'Engineering Team' });
      const component = createComponent({ group });
      expect(component.groupName).toBe('Engineering Team');
    });

    it('returns empty string when group name is empty', () => {
      const group = createMockGroup({ name: '' });
      const component = createComponent({ group });
      expect(component.groupName).toBe('');
    });

    it('handles unicode characters in name', () => {
      const group = createMockGroup({ name: '团队 👥 🌟' });
      const component = createComponent({ group });
      expect(component.groupName).toBe('团队 👥 🌟');
    });

    it('handles special characters in name', () => {
      const group = createMockGroup({ name: "O'Brien & Co." });
      const component = createComponent({ group });
      expect(component.groupName).toBe("O'Brien & Co.");
    });
  });

  // ==================== Group Data Display - Icon (Req 4.2) ====================

  describe('group data display - icon', () => {
    it('returns group icon URL via groupIcon getter', () => {
      const group = createMockGroup({ icon: 'https://example.com/group.png' });
      const component = createComponent({ group });
      expect(component.groupIcon).toBe('https://example.com/group.png');
    });

    it('returns empty string when group has no icon', () => {
      const group = createMockGroup();
      const component = createComponent({ group });
      expect(component.groupIcon).toBe('');
    });
  });

  // ==================== Group Data Display - Member Count (Req 4.2) ====================

  describe('group data display - member count', () => {
    it('returns correct member count', () => {
      const group = createMockGroup({ membersCount: 25 });
      const component = createComponent({ group });
      expect(component.memberCount).toBe(25);
    });

    it('returns 0 when group has no members', () => {
      const group = createMockGroup({ membersCount: 0 });
      const component = createComponent({ group });
      expect(component.memberCount).toBe(0);
    });

    it('formats singular member count text', () => {
      const group = createMockGroup({ membersCount: 1 });
      const component = createComponent({ group });
      // Uses CometChatLocalize which returns the key itself in test context
      expect(component.memberCountText).toContain('1');
    });

    it('formats plural member count text', () => {
      const group = createMockGroup({ membersCount: 25 });
      const component = createComponent({ group });
      expect(component.memberCountText).toContain('25');
    });

    it('formats zero member count text', () => {
      const group = createMockGroup({ membersCount: 0 });
      const component = createComponent({ group });
      expect(component.memberCountText).toContain('0');
    });

    it('updates member count when group changes', () => {
      const group = createMockGroup({ membersCount: 10 });
      const component = createComponent({ group });
      expect(component.memberCount).toBe(10);

      group.setMembersCount(50);
      expect(component.memberCount).toBe(50);
    });
  });

  // ==================== Group Data Display - Type (Req 4.2) ====================

  describe('group data display - type', () => {
    it('returns public group type', () => {
      const group = createMockGroup({ type: 'public' });
      const component = createComponent({ group });
      expect(component.groupType).toBe('public');
    });

    it('returns private group type', () => {
      const group = createMockGroup({ type: 'private' });
      const component = createComponent({ group });
      expect(component.groupType).toBe('private');
    });

    it('returns password group type', () => {
      const group = createMockGroup({ type: 'password' });
      const component = createComponent({ group });
      expect(component.groupType).toBe('password');
    });

    it('returns empty string for empty type', () => {
      const group = createMockGroup({ type: '' });
      const component = createComponent({ group });
      expect(component.groupType).toBe('');
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
    it('hides group type when hideGroupType is true', () => {
      const component = createComponent({ hideGroupType: true });
      expect(component.effectiveHideGroupType()).toBe(true);
    });

    it('shows group type when hideGroupType is false', () => {
      const component = createComponent({ hideGroupType: false });
      expect(component.effectiveHideGroupType()).toBe(false);
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
    it('emits itemClick with group when handleClick is called', () => {
      const group = createMockGroup({ name: 'Engineering' });
      const component = createComponent({ group });
      const spy = vi.spyOn(component.itemClick, 'emit');

      component.handleClick();

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(group);
    });

    it('emits contextMenuOpen with group when handleContextMenuOpen is called', () => {
      const group = createMockGroup({ name: 'Sales' });
      const component = createComponent({ group });
      const spy = vi.spyOn(component.contextMenuOpen, 'emit');

      component.handleContextMenuOpen();

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(group);
    });

    it('emits contextMenuOptionClick with option and group', () => {
      const group = createMockGroup({ name: 'Marketing' });
      const component = createComponent({ group });
      const spy = vi.spyOn(component.contextMenuOptionClick, 'emit');
      const option = { id: 'delete', title: 'Delete' } as any;

      component.handleContextMenuOptionClick(option);

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith({ option, group });
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
    it('includes group name in accessible label', () => {
      const group = createMockGroup({ name: 'Engineering', membersCount: 10 });
      const component = createComponent({ group });
      expect(component.accessibleLabel).toContain('Engineering');
    });

    it('includes member count in accessible label', () => {
      const group = createMockGroup({ name: 'Team', membersCount: 25 });
      const component = createComponent({ group });
      expect(component.accessibleLabel).toContain('25');
    });

    it('includes group type info when hideGroupType is false', () => {
      const group = createMockGroup({ name: 'Team', type: 'public', membersCount: 5 });
      const component = createComponent({ group, hideGroupType: false });
      const label = component.accessibleLabel;
      expect(label).toContain('Team');
      // Should contain type reference (localized key)
      expect(label.length).toBeGreaterThan('Team'.length);
    });

    it('excludes group type info when hideGroupType is true', () => {
      const group = createMockGroup({ name: 'Team', type: 'public', membersCount: 5 });
      const component = createComponent({ group, hideGroupType: true });
      const label = component.accessibleLabel;
      expect(label).toContain('Team');
      // Should not contain type-specific accessibility keys
      expect(label).not.toContain('accessibility_group_type_public');
    });

    it('updates when group changes', () => {
      const group1 = createMockGroup({ name: 'Alpha', membersCount: 10 });
      const component = createComponent({ group: group1 });
      expect(component.accessibleLabel).toContain('Alpha');

      const group2 = createMockGroup({ name: 'Beta', membersCount: 20 });
      component.group = group2;
      expect(component.accessibleLabel).toContain('Beta');
      expect(component.accessibleLabel).not.toContain('Alpha');
    });
  });

  // ==================== Null Group Handling (Req 4.1) ====================

  describe('null group handling', () => {
    it('returns empty string for groupIcon when group is null', () => {
      const component = createComponent();
      (component as any).group = null;
      expect(component.groupIcon).toBe('');
    });

    it('returns empty string for groupName when group is null', () => {
      const component = createComponent();
      (component as any).group = null;
      expect(component.groupName).toBe('');
    });

    it('returns empty string for groupType when group is null', () => {
      const component = createComponent();
      (component as any).group = null;
      expect(component.groupType).toBe('');
    });

    it('returns 0 for memberCount when group is null', () => {
      const component = createComponent();
      (component as any).group = null;
      expect(component.memberCount).toBe(0);
    });

    it('returns empty string for groupIcon when group is undefined', () => {
      const component = createComponent();
      (component as any).group = undefined;
      expect(component.groupIcon).toBe('');
    });

    it('returns empty string for groupName when group is undefined', () => {
      const component = createComponent();
      (component as any).group = undefined;
      expect(component.groupName).toBe('');
    });

    it('returns empty string for groupType when group is undefined', () => {
      const component = createComponent();
      (component as any).group = undefined;
      expect(component.groupType).toBe('');
    });

    it('returns 0 for memberCount when group is undefined', () => {
      const component = createComponent();
      (component as any).group = undefined;
      expect(component.memberCount).toBe(0);
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
    it('handles complete group interaction flow', () => {
      const group = createMockGroup({ name: 'Engineering', membersCount: 25 });
      const component = createComponent({ group });
      const clickSpy = vi.spyOn(component.itemClick, 'emit');
      const contextSpy = vi.spyOn(component.contextMenuOpen, 'emit');
      const optionSpy = vi.spyOn(component.contextMenuOptionClick, 'emit');

      // Open context menu
      component.handleContextMenuOpen();
      expect(contextSpy).toHaveBeenCalledWith(group);

      // Click an option
      const option = { id: 'view', title: 'View Group Info' } as any;
      component.handleContextMenuOptionClick(option);
      expect(optionSpy).toHaveBeenCalledWith({ option, group });

      // Click the item
      component.handleClick();
      expect(clickSpy).toHaveBeenCalledWith(group);
    });

    it('maintains state consistency when group changes', () => {
      const group1 = createMockGroup({
        name: 'Alpha',
        icon: 'https://a.com/1.png',
        membersCount: 10,
        type: 'public',
      });
      const component = createComponent({ group: group1, isActive: true, isSelected: true });

      expect(component.groupName).toBe('Alpha');
      expect(component.groupIcon).toBe('https://a.com/1.png');
      expect(component.memberCount).toBe(10);
      expect(component.groupType).toBe('public');

      // Swap group
      const group2 = createMockGroup({
        name: 'Beta',
        icon: 'https://b.com/2.png',
        membersCount: 30,
        type: 'private',
      });
      component.group = group2;

      // State inputs remain
      expect(component.isActive).toBe(true);
      expect(component.isSelected).toBe(true);

      // Group data updates
      expect(component.groupName).toBe('Beta');
      expect(component.groupIcon).toBe('https://b.com/2.png');
      expect(component.memberCount).toBe(30);
      expect(component.groupType).toBe('private');
    });
  });

  // ─── Accessibility ───

  describe('Accessibility', () => {
    it('should provide accessible group name', () => {
      const component = createComponent({ group: createMockGroup({ name: 'Developers' }) });
      expect(component.groupName).toBe('Developers');
    });

    it('should provide accessible member count', () => {
      const component = createComponent({ group: createMockGroup({ membersCount: 10 }) });
      expect(component.memberCount).toBe(10);
    });

    it('should provide accessible group type', () => {
      const component = createComponent({ group: createMockGroup({ type: 'public' }) });
      expect(component.groupType).toBe('public');
    });
  });
});
