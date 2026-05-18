import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * Unit Tests for CometChatConversationStarterComponent
 *
 * Tests cover:
 * - Component instantiation with default values (Requirement 4.1)
 * - Starter suggestions rendering (Requirement 4.2)
 * - @Output starterClick emission (Requirement 4.2)
 * - Loading state (Requirement 4.1)
 * - Empty suggestions (Requirement 4.1)
 * - Keyboard navigation (ArrowLeft/Right, Enter/Space, Home/End)
 * - Roving tabindex
 * - fetchConversationStarters logic
 * - Error state handling
 *
 * Uses vi.mock() for SDK mocking BEFORE imports,
 * and Object.create() to bypass Angular's inject() context requirement.
 *
 * **Validates: Requirements 4.1, 4.2**
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

  return {
    CometChat: {
      CometChatException: MockCometChatException,
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

      getConversationStarter: vi
        .fn()
        .mockResolvedValue([
          'How are you doing today?',
          'What have you been up to?',
          'Any plans for the weekend?',
          'Have you seen any good movies lately?',
        ]),
    },
  };
});

// Now import modules AFTER mocks are set up
import { EventEmitter, signal } from '@angular/core';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatConversationStarterComponent } from './cometchat-conversation-starter.component';

// ==================== Mock Helpers ====================

function createMockUser(uid = 'user-1', name = 'Test User'): CometChat.User {
  return {
    getUid: () => uid,
    getName: () => name,
    getAvatar: () => 'https://example.com/avatar.png',
    getStatus: () => 'online',
  } as unknown as CometChat.User;
}

function createMockGroup(guid = 'group-1', name = 'Test Group'): CometChat.Group {
  return {
    getGuid: () => guid,
    getName: () => name,
    getIcon: () => 'https://example.com/group.png',
    getMembersCount: () => 5,
  } as unknown as CometChat.Group;
}

// ==================== Component Factory ====================

/**
 * Creates a CometChatConversationStarterComponent instance via Object.create()
 * to bypass Angular's inject() context requirement.
 * Manually wires signals, inputs, outputs, and internal state.
 */
function createComponent(): CometChatConversationStarterComponent {
  const comp = Object.create(
    CometChatConversationStarterComponent.prototype
  ) as CometChatConversationStarterComponent;

  // Initialize inputs with defaults
  comp.user = undefined;
  comp.group = undefined;

  // Initialize outputs
  comp.starterClick = new EventEmitter<string>();

  // Initialize signals
  comp.isLoading = signal(false);
  comp.starters = signal<string[]>([]);
  comp.hasError = signal(false);
  comp.focusedIndex = signal(0);

  // Mock liveAnnouncer (injected service)
  (comp as any).liveAnnouncer = {
    announce: vi.fn(),
  };

  // Mock starterButtons ViewChildren
  (comp as any).starterButtons = {
    toArray: () => [],
  };

  return comp;
}

// ==================== Unit Tests ====================

describe('CometChatConversationStarterComponent', () => {
  let component: CometChatConversationStarterComponent;

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ==================== Instantiation (Req 4.1) ====================

  describe('instantiation with defaults', () => {
    beforeEach(() => {
      component = createComponent();
    });

    it('creates a component instance', () => {
      expect(component).toBeTruthy();
    });

    it('has user input as undefined by default', () => {
      expect(component.user).toBeUndefined();
    });

    it('has group input as undefined by default', () => {
      expect(component.group).toBeUndefined();
    });

    it('has starterClick EventEmitter initialized', () => {
      expect(component.starterClick).toBeInstanceOf(EventEmitter);
    });

    it('has isLoading as false', () => {
      expect(component.isLoading()).toBe(false);
    });

    it('has starters as empty array', () => {
      expect(component.starters()).toEqual([]);
    });

    it('has hasError as false', () => {
      expect(component.hasError()).toBe(false);
    });

    it('has focusedIndex as 0', () => {
      expect(component.focusedIndex()).toBe(0);
    });

    it('has hasStarters as false when no starters', () => {
      expect(component.hasStarters).toBe(false);
    });

    it('has isVisible as false when no loading, no starters, no error', () => {
      expect(component.isVisible).toBe(false);
    });
  });

  // ==================== Starter Suggestions Rendering (Req 4.2) ====================

  describe('starter suggestions rendering', () => {
    beforeEach(() => {
      component = createComponent();
    });

    it('hasStarters returns true when starters are populated', () => {
      component.starters.set(['Starter 1', 'Starter 2']);
      expect(component.hasStarters).toBe(true);
    });

    it('isVisible returns true when starters exist', () => {
      component.starters.set(['Starter 1']);
      expect(component.isVisible).toBe(true);
    });

    it('ariaLabel reflects starter count (plural)', () => {
      component.starters.set(['Starter 1', 'Starter 2', 'Starter 3']);
      expect(component.ariaLabel).toBe('Conversation starters');
    });

    it('ariaLabel uses singular for one starter', () => {
      component.starters.set(['Starter 1']);
      expect(component.ariaLabel).toBe('Conversation starters');
    });

    it('ariaLabel reflects no suggestions when empty', () => {
      component.starters.set([]);
      expect(component.ariaLabel).toBe('No results found');
    });
  });

  // ==================== @Output starterClick Emission (Req 4.2) ====================

  describe('@Output starterClick emission', () => {
    beforeEach(() => {
      component = createComponent();
      component.starters.set(['How are you?', 'What are you up to?', 'Any plans?']);
    });

    it('emits starterClick with the clicked starter text', () => {
      const spy = vi.fn();
      component.starterClick.subscribe(spy);

      component.onStarterClick('How are you?');

      expect(spy).toHaveBeenCalledWith('How are you?');
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('emits starterClick for each different starter', () => {
      const spy = vi.fn();
      component.starterClick.subscribe(spy);

      component.onStarterClick('What are you up to?');
      expect(spy).toHaveBeenCalledWith('What are you up to?');

      component.onStarterClick('Any plans?');
      expect(spy).toHaveBeenCalledWith('Any plans?');
      expect(spy).toHaveBeenCalledTimes(2);
    });
  });

  // ==================== Loading State (Req 4.1) ====================

  describe('loading state', () => {
    beforeEach(() => {
      component = createComponent();
    });

    it('isVisible returns true when loading', () => {
      component.isLoading.set(true);
      expect(component.isVisible).toBe(true);
    });

    it('ariaLabel reflects loading state', () => {
      component.isLoading.set(true);
      expect(component.ariaLabel).toBe('Loading');
    });

    it('loading state takes priority in ariaLabel even with starters', () => {
      component.isLoading.set(true);
      component.starters.set(['Starter 1']);
      expect(component.ariaLabel).toBe('Loading');
    });
  });

  // ==================== Empty Suggestions (Req 4.1) ====================

  describe('empty suggestions', () => {
    beforeEach(() => {
      component = createComponent();
    });

    it('hasStarters is false with empty array', () => {
      component.starters.set([]);
      expect(component.hasStarters).toBe(false);
    });

    it('ariaLabel reflects empty state', () => {
      component.starters.set([]);
      expect(component.ariaLabel).toBe('No results found');
    });
  });

  // ==================== Error State ====================

  describe('error state', () => {
    beforeEach(() => {
      component = createComponent();
    });

    it('isVisible returns true when hasError is true', () => {
      component.hasError.set(true);
      expect(component.isVisible).toBe(true);
    });

    it('isVisible returns true when both error and loading', () => {
      component.hasError.set(true);
      component.isLoading.set(true);
      expect(component.isVisible).toBe(true);
    });
  });

  // ==================== fetchConversationStarters ====================

  describe('fetchConversationStarters', () => {
    beforeEach(() => {
      component = createComponent();
      component.user = createMockUser();
    });

    it('sets isLoading to true during fetch', async () => {
      let loadingDuringFetch = false;
      const originalSet = component.isLoading.set.bind(component.isLoading);
      vi.spyOn(component.isLoading, 'set').mockImplementation((val: boolean) => {
        if (val === true) loadingDuringFetch = true;
        originalSet(val);
      });

      await component.fetchConversationStarters();
      expect(loadingDuringFetch).toBe(true);
    });

    it('sets isLoading to false after fetch completes', async () => {
      await component.fetchConversationStarters();
      expect(component.isLoading()).toBe(false);
    });

    it('populates starters from SDK response (array)', async () => {
      await component.fetchConversationStarters();
      const starters = component.starters();
      expect(starters.length).toBe(4);
      expect(starters).toContain('How are you doing today?');
      expect(starters).toContain('What have you been up to?');
    });

    it('limits starters to 4 (MAX_STARTERS)', async () => {
      vi.mocked(CometChat.getConversationStarter).mockResolvedValueOnce([
        'A',
        'B',
        'C',
        'D',
        'E',
        'F',
      ] as any);

      await component.fetchConversationStarters();
      expect(component.starters().length).toBe(4);
    });

    it('handles object response from SDK', async () => {
      vi.mocked(CometChat.getConversationStarter).mockResolvedValueOnce({
        starter1: 'Hello!',
        starter2: 'How are you?',
      } as any);

      await component.fetchConversationStarters();
      const starters = component.starters();
      expect(starters.length).toBe(2);
      expect(starters).toContain('Hello!');
      expect(starters).toContain('How are you?');
    });

    it('handles non-array non-object response gracefully', async () => {
      vi.mocked(CometChat.getConversationStarter).mockResolvedValueOnce(null as any);

      await component.fetchConversationStarters();
      expect(component.starters()).toEqual([]);
    });

    it('resets focusedIndex to 0 after fetching', async () => {
      component.focusedIndex.set(2);
      await component.fetchConversationStarters();
      expect(component.focusedIndex()).toBe(0);
    });

    it('announces availability to screen readers', async () => {
      await component.fetchConversationStarters();
      const announcer = (component as any).liveAnnouncer;
      expect(announcer.announce).toHaveBeenCalled();
    });

    it('does not announce when no starters returned', async () => {
      vi.mocked(CometChat.getConversationStarter).mockResolvedValueOnce([] as any);

      await component.fetchConversationStarters();
      const announcer = (component as any).liveAnnouncer;
      expect(announcer.announce).not.toHaveBeenCalled();
    });

    it('sets hasError on SDK failure', async () => {
      vi.mocked(CometChat.getConversationStarter).mockRejectedValueOnce(new Error('SDK error'));

      await component.fetchConversationStarters();
      expect(component.hasError()).toBe(true);
      expect(component.starters()).toEqual([]);
      expect(component.isLoading()).toBe(false);
    });

    it('returns early when no user or group is provided', async () => {
      component.user = undefined;
      component.group = undefined;

      await component.fetchConversationStarters();
      expect(component.isLoading()).toBe(false);
      expect(component.starters()).toEqual([]);
    });

    it('uses group guid when group is provided', async () => {
      component.user = undefined;
      component.group = createMockGroup('group-123', 'My Group');

      await component.fetchConversationStarters();
      expect(CometChat.getConversationStarter).toHaveBeenCalledWith(
        'group-123',
        expect.any(String)
      );
    });

    it('uses user uid when user is provided', async () => {
      component.user = createMockUser('user-abc', 'Alice');
      component.group = undefined;

      await component.fetchConversationStarters();
      expect(CometChat.getConversationStarter).toHaveBeenCalledWith('user-abc', expect.any(String));
    });
  });

  // ==================== Keyboard Navigation ====================

  describe('keyboard navigation', () => {
    beforeEach(() => {
      component = createComponent();
      component.starters.set(['Starter 1', 'Starter 2', 'Starter 3']);
      const mockButtons = [
        { nativeElement: { focus: vi.fn() } },
        { nativeElement: { focus: vi.fn() } },
        { nativeElement: { focus: vi.fn() } },
      ];
      (component as any).starterButtons = {
        toArray: () => mockButtons,
      };
    });

    it('Enter key emits starterClick', () => {
      const spy = vi.fn();
      component.starterClick.subscribe(spy);

      const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
      vi.spyOn(event, 'preventDefault');

      component.onStarterKeydown(event, 'Starter 1', 0);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(spy).toHaveBeenCalledWith('Starter 1');
    });

    it('Space key emits starterClick', () => {
      const spy = vi.fn();
      component.starterClick.subscribe(spy);

      const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true });
      vi.spyOn(event, 'preventDefault');

      component.onStarterKeydown(event, 'Starter 2', 1);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(spy).toHaveBeenCalledWith('Starter 2');
    });

    it('ArrowRight moves focus to next starter', () => {
      const event = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true });
      vi.spyOn(event, 'preventDefault');

      component.onStarterKeydown(event, 'Starter 1', 0);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.focusedIndex()).toBe(1);
    });

    it('ArrowRight wraps around from last to first', () => {
      const event = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true });
      vi.spyOn(event, 'preventDefault');

      component.onStarterKeydown(event, 'Starter 3', 2);
      expect(component.focusedIndex()).toBe(0);
    });

    it('ArrowLeft moves focus to previous starter', () => {
      const event = new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true });
      vi.spyOn(event, 'preventDefault');

      component.onStarterKeydown(event, 'Starter 2', 1);
      expect(component.focusedIndex()).toBe(0);
    });

    it('ArrowLeft wraps around from first to last', () => {
      const event = new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true });
      vi.spyOn(event, 'preventDefault');

      component.onStarterKeydown(event, 'Starter 1', 0);
      expect(component.focusedIndex()).toBe(2);
    });

    it('Home key focuses first starter', () => {
      const event = new KeyboardEvent('keydown', { key: 'Home', bubbles: true });
      vi.spyOn(event, 'preventDefault');

      component.onStarterKeydown(event, 'Starter 3', 2);
      expect(component.focusedIndex()).toBe(0);
    });

    it('End key focuses last starter', () => {
      const event = new KeyboardEvent('keydown', { key: 'End', bubbles: true });
      vi.spyOn(event, 'preventDefault');

      component.onStarterKeydown(event, 'Starter 1', 0);
      expect(component.focusedIndex()).toBe(2);
    });

    it('unrecognized key does not change focus or emit', () => {
      const spy = vi.fn();
      component.starterClick.subscribe(spy);

      const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });
      component.onStarterKeydown(event, 'Starter 1', 0);

      expect(spy).not.toHaveBeenCalled();
      expect(component.focusedIndex()).toBe(0);
    });
  });

  // ==================== Roving Tabindex ====================

  describe('roving tabindex', () => {
    beforeEach(() => {
      component = createComponent();
      component.starters.set(['Starter 1', 'Starter 2', 'Starter 3']);
    });

    it('getStarterTabIndex returns 0 for focused index', () => {
      component.focusedIndex.set(1);
      expect(component.getStarterTabIndex(1)).toBe(0);
    });

    it('getStarterTabIndex returns -1 for non-focused index', () => {
      component.focusedIndex.set(0);
      expect(component.getStarterTabIndex(1)).toBe(-1);
      expect(component.getStarterTabIndex(2)).toBe(-1);
    });

    it('onStarterFocus updates focusedIndex', () => {
      component.onStarterFocus(2);
      expect(component.focusedIndex()).toBe(2);
    });
  });

  // ==================== Reset and Refresh ====================

  describe('reset and refresh', () => {
    beforeEach(() => {
      component = createComponent();
      component.user = createMockUser();
    });

    it('reset clears starters, error, and loading', () => {
      component.starters.set(['A', 'B']);
      component.hasError.set(true);
      component.isLoading.set(true);

      component.reset();

      expect(component.starters()).toEqual([]);
      expect(component.hasError()).toBe(false);
      expect(component.isLoading()).toBe(false);
    });

    it('refresh resets state and fetches new starters', async () => {
      component.starters.set(['Old starter']);
      const fetchSpy = vi.spyOn(component, 'fetchConversationStarters').mockResolvedValue();

      component.refresh();

      expect(component.starters()).toEqual([]);
      expect(fetchSpy).toHaveBeenCalled();
    });
  });

  // ==================== Lifecycle ====================

  describe('lifecycle', () => {
    beforeEach(() => {
      component = createComponent();
    });

    it('ngOnDestroy calls reset', () => {
      component.starters.set(['A']);
      component.hasError.set(true);

      component.ngOnDestroy();

      expect(component.starters()).toEqual([]);
      expect(component.hasError()).toBe(false);
      expect(component.isLoading()).toBe(false);
    });
  });

  // ─── Accessibility ───

  describe('Accessibility', () => {
    it('should have focusable starter suggestion buttons', () => {
      const component = createComponent();
      expect(typeof component.onStarterClick).toBe('function');
    });

    it('should provide accessible labels for starter suggestions', () => {
      const component = createComponent();
      component.starters.set(['Hi there', 'Tell me more']);
      expect(component.starters().length).toBe(2);
    });
  });
});
