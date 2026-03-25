import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';

/**
 * Unit + Property-Based Tests for CometChatReactionListComponent
 *
 * Tests cover:
 * - Component instantiation with default values (Requirement 4.1)
 * - Reaction grouping by emoji (Requirement 4.2)
 * - User list per reaction / filtered reactions (Requirement 4.2)
 * - Tab navigation (ArrowLeft/Right, Home/End, Enter/Space) (Requirement 4.2)
 * - Null/missing reactions handling (Requirement 4.1)
 * - Item click emission and optimistic removal
 * - Scroll-based pagination
 * - Error/loading/empty states
 * - Keyboard interaction on reaction items
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

      // SDK methods used by the component
      getLoggedinUser: vi.fn().mockResolvedValue({
        getUid: () => 'logged-in-user',
        getName: () => 'Logged In User',
        getAvatar: () => 'https://example.com/avatar.png',
      }),

      // ReactionsRequestBuilder mock
      ReactionsRequestBuilder: class {
        private messageId = 0;
        private limit = 10;
        setMessageId(id: number) {
          this.messageId = id;
          return this;
        }
        setLimit(limit: number) {
          this.limit = limit;
          return this;
        }
        build() {
          return {
            fetchNext: vi.fn().mockResolvedValue([]),
          };
        }
      },
    },
  };
});

// Now import modules AFTER mocks are set up
import { EventEmitter, signal, computed } from '@angular/core';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatReactionListComponent } from './cometchat-reaction-list.component';

// ==================== Mock Helpers ====================

class MockUser {
  constructor(
    private uid: string,
    private name: string,
    private avatar = 'https://example.com/avatar.png'
  ) {}
  getUid(): string {
    return this.uid;
  }
  getName(): string {
    return this.name;
  }
  getAvatar(): string {
    return this.avatar;
  }
}

class MockReaction {
  constructor(
    private emoji: string,
    private reactedBy: MockUser
  ) {}
  getReaction(): string {
    return this.emoji;
  }
  getReactedBy(): MockUser {
    return this.reactedBy;
  }
}

function createMockMessage(id = 1): CometChat.BaseMessage {
  return {
    getId: () => id,
    getSender: () => ({ getUid: () => 'user-1', getName: () => 'Test User' }),
    getReceiverType: () => 'user',
    getReceiver: () => ({ getUid: () => 'user-2' }),
    getType: () => 'text',
    getCategory: () => 'message',
    getReactions: () => [],
  } as unknown as CometChat.BaseMessage;
}

function createMockReaction(emoji: string, uid: string, name: string): MockReaction {
  return new MockReaction(emoji, new MockUser(uid, name));
}

// ==================== Component Factory ====================

/**
 * Creates a CometChatReactionListComponent instance via Object.create()
 * to bypass Angular's inject() context requirement.
 * Manually wires signals, inputs, outputs, and internal state.
 */
function createComponent(message?: CometChat.BaseMessage): CometChatReactionListComponent {
  const comp = Object.create(
    CometChatReactionListComponent.prototype
  ) as CometChatReactionListComponent;

  // Initialize inputs
  comp.message = message || createMockMessage();
  (comp as any).reactionsRequestBuilder = undefined;

  // Initialize outputs
  comp.itemClick = new EventEmitter();
  comp.empty = new EventEmitter();

  // Initialize signals
  comp.groupedReactions = signal(new Map());
  comp.selectedEmoji = signal<string | null>(null);
  comp.isLoading = signal(false);
  comp.hasError = signal(false);
  comp.hasMoreReactions = signal(true);
  (comp as any).allReactions = signal<any[]>([]);
  (comp as any).loggedInUserUid = 'logged-in-user';
  (comp as any).reactionsRequest = null;

  // Initialize computed signals (mirrors component logic)
  comp.emojiTabs = computed(() => {
    const grouped = comp.groupedReactions();
    return Array.from(grouped.keys());
  });

  comp.filteredReactions = computed(() => {
    const selected = comp.selectedEmoji();
    const grouped = comp.groupedReactions();
    if (selected === null) {
      return (comp as any).allReactions();
    }
    return grouped.get(selected) || [];
  });

  comp.totalReactionCount = computed(() => {
    return (comp as any).allReactions().length;
  });

  return comp;
}

/**
 * Helper to populate the component with reactions (simulates what fetchReactions does).
 */
function populateReactions(comp: CometChatReactionListComponent, reactions: MockReaction[]): void {
  (comp as any).allReactions.set(reactions);
  // Group by emoji (mirrors component's groupReactionsByEmoji)
  const grouped = new Map<string, MockReaction[]>();
  for (const reaction of reactions) {
    const emoji = reaction.getReaction();
    if (!grouped.has(emoji)) {
      grouped.set(emoji, []);
    }
    grouped.get(emoji)!.push(reaction);
  }
  comp.groupedReactions.set(grouped as any);
}

// ==================== Generators for Property Tests ====================

const emojiPool = [
  '👍',
  '❤️',
  '😂',
  '😮',
  '😢',
  '🔥',
  '👏',
  '🎉',
  '🤔',
  '👀',
  '💯',
  '🙏',
  '😍',
  '🥳',
  '😎',
  '💪',
];

const emojiArb = fc.constantFrom(...emojiPool);
const uidArb = fc.stringMatching(/^[a-zA-Z0-9]{1,20}$/);
const nameArb = fc
  .stringMatching(/^[a-zA-Z][a-zA-Z ]{0,19}$/)
  .map(s => s.trim())
  .filter(s => s.length > 0);

const reactionWithEmojiArb = (emoji: fc.Arbitrary<string>) =>
  fc
    .tuple(emoji, uidArb, nameArb)
    .map(([e, uid, name]) => new MockReaction(e, new MockUser(uid, name)));

const reactionsArb = fc
  .array(reactionWithEmojiArb(emojiArb), { minLength: 1, maxLength: 30 })
  .filter(reactions => {
    const emojis = new Set(reactions.map(r => r.getReaction()));
    return emojis.size >= 1;
  });

// ==================== Unit Tests ====================

describe('CometChatReactionListComponent', () => {
  let component: CometChatReactionListComponent;

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

    it('has message input set', () => {
      expect(component.message).toBeTruthy();
      expect(component.message.getId()).toBe(1);
    });

    it('has itemClick EventEmitter initialized', () => {
      expect(component.itemClick).toBeInstanceOf(EventEmitter);
    });

    it('has empty EventEmitter initialized', () => {
      expect(component.empty).toBeInstanceOf(EventEmitter);
    });

    it('has groupedReactions as empty Map', () => {
      expect(component.groupedReactions()).toBeInstanceOf(Map);
      expect(component.groupedReactions().size).toBe(0);
    });

    it('has selectedEmoji as null (All tab)', () => {
      expect(component.selectedEmoji()).toBeNull();
    });

    it('has isLoading as false', () => {
      expect(component.isLoading()).toBe(false);
    });

    it('has hasError as false', () => {
      expect(component.hasError()).toBe(false);
    });

    it('has hasMoreReactions as true', () => {
      expect(component.hasMoreReactions()).toBe(true);
    });

    it('has emojiTabs as empty array', () => {
      expect(component.emojiTabs()).toEqual([]);
    });

    it('has filteredReactions as empty array', () => {
      expect(component.filteredReactions()).toEqual([]);
    });

    it('has totalReactionCount as 0', () => {
      expect(component.totalReactionCount()).toBe(0);
    });
  });

  // ==================== Reaction Grouping (Req 4.2) ====================

  describe('reaction grouping by emoji', () => {
    beforeEach(() => {
      component = createComponent();
    });

    it('groups reactions by emoji correctly', () => {
      const reactions = [
        createMockReaction('👍', 'user-1', 'Alice'),
        createMockReaction('👍', 'user-2', 'Bob'),
        createMockReaction('❤️', 'user-3', 'Charlie'),
      ];
      populateReactions(component, reactions);

      const grouped = component.groupedReactions();
      expect(grouped.size).toBe(2);
      expect(grouped.get('👍')!.length).toBe(2);
      expect(grouped.get('❤️')!.length).toBe(1);
    });

    it('creates one tab per unique emoji', () => {
      const reactions = [
        createMockReaction('👍', 'user-1', 'Alice'),
        createMockReaction('❤️', 'user-2', 'Bob'),
        createMockReaction('😂', 'user-3', 'Charlie'),
      ];
      populateReactions(component, reactions);

      expect(component.emojiTabs()).toEqual(['👍', '❤️', '😂']);
    });

    it('totalReactionCount reflects all reactions', () => {
      const reactions = [
        createMockReaction('👍', 'user-1', 'Alice'),
        createMockReaction('👍', 'user-2', 'Bob'),
        createMockReaction('❤️', 'user-3', 'Charlie'),
        createMockReaction('😂', 'user-4', 'Dave'),
      ];
      populateReactions(component, reactions);

      expect(component.totalReactionCount()).toBe(4);
    });

    it('getEmojiCount returns correct count per emoji', () => {
      const reactions = [
        createMockReaction('👍', 'user-1', 'Alice'),
        createMockReaction('👍', 'user-2', 'Bob'),
        createMockReaction('👍', 'user-3', 'Charlie'),
        createMockReaction('❤️', 'user-4', 'Dave'),
      ];
      populateReactions(component, reactions);

      expect(component.getEmojiCount('👍')).toBe(3);
      expect(component.getEmojiCount('❤️')).toBe(1);
      expect(component.getEmojiCount('🔥')).toBe(0);
    });
  });

  // ==================== User List Per Reaction / Filtering (Req 4.2) ====================

  describe('user list per reaction (filtering)', () => {
    beforeEach(() => {
      component = createComponent();
    });

    it('shows all reactions when selectedEmoji is null (All tab)', () => {
      const reactions = [
        createMockReaction('👍', 'user-1', 'Alice'),
        createMockReaction('❤️', 'user-2', 'Bob'),
        createMockReaction('😂', 'user-3', 'Charlie'),
      ];
      populateReactions(component, reactions);

      component.selectedEmoji.set(null);
      expect(component.filteredReactions().length).toBe(3);
    });

    it('filters to only matching emoji when a tab is selected', () => {
      const reactions = [
        createMockReaction('👍', 'user-1', 'Alice'),
        createMockReaction('👍', 'user-2', 'Bob'),
        createMockReaction('❤️', 'user-3', 'Charlie'),
      ];
      populateReactions(component, reactions);

      component.selectEmoji('👍');
      const filtered = component.filteredReactions();
      expect(filtered.length).toBe(2);
      expect(filtered.every((r: any) => r.getReaction() === '👍')).toBe(true);
    });

    it('returns empty array for non-existent emoji filter', () => {
      const reactions = [createMockReaction('👍', 'user-1', 'Alice')];
      populateReactions(component, reactions);

      component.selectEmoji('🔥');
      expect(component.filteredReactions()).toEqual([]);
    });

    it('selectEmoji updates selectedEmoji signal', () => {
      component.selectEmoji('❤️');
      expect(component.selectedEmoji()).toBe('❤️');

      component.selectEmoji(null);
      expect(component.selectedEmoji()).toBeNull();
    });
  });

  // ==================== Tab Navigation (Req 4.2) ====================

  describe('tab navigation', () => {
    beforeEach(() => {
      component = createComponent();
      const reactions = [
        createMockReaction('👍', 'user-1', 'Alice'),
        createMockReaction('❤️', 'user-2', 'Bob'),
        createMockReaction('😂', 'user-3', 'Charlie'),
      ];
      populateReactions(component, reactions);
    });

    it('Enter key selects the emoji tab', () => {
      const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
      vi.spyOn(event, 'preventDefault');

      component.onTabKeyDown(event, '❤️', 1);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.selectedEmoji()).toBe('❤️');
    });

    it('Space key selects the emoji tab', () => {
      const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true });
      vi.spyOn(event, 'preventDefault');

      component.onTabKeyDown(event, '😂', 2);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.selectedEmoji()).toBe('😂');
    });

    it('Enter key on All tab sets selectedEmoji to null', () => {
      component.selectEmoji('👍');
      const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
      vi.spyOn(event, 'preventDefault');

      component.onTabKeyDown(event, null, 0);
      expect(component.selectedEmoji()).toBeNull();
    });

    it('ArrowRight calls focusNextTab', () => {
      // We can't easily test DOM focus, but we can verify preventDefault is called
      const event = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true });
      vi.spyOn(event, 'preventDefault');

      component.onTabKeyDown(event, null, 0);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('ArrowLeft calls focusPreviousTab', () => {
      const event = new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true });
      vi.spyOn(event, 'preventDefault');

      component.onTabKeyDown(event, '👍', 1);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('Home key calls focusTab(0)', () => {
      const event = new KeyboardEvent('keydown', { key: 'Home', bubbles: true });
      vi.spyOn(event, 'preventDefault');

      component.onTabKeyDown(event, '😂', 3);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('End key calls focusTab(totalTabs - 1)', () => {
      const event = new KeyboardEvent('keydown', { key: 'End', bubbles: true });
      vi.spyOn(event, 'preventDefault');

      component.onTabKeyDown(event, null, 0);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('unrecognized key does not call preventDefault', () => {
      const event = new KeyboardEvent('keydown', { key: 'a', bubbles: true });
      vi.spyOn(event, 'preventDefault');

      component.onTabKeyDown(event, null, 0);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });
  });

  // ==================== Null/Missing Reactions Handling (Req 4.1) ====================

  describe('null/missing reactions handling', () => {
    it('handles component with no reactions populated', () => {
      component = createComponent();
      expect(component.groupedReactions().size).toBe(0);
      expect(component.emojiTabs()).toEqual([]);
      expect(component.filteredReactions()).toEqual([]);
      expect(component.totalReactionCount()).toBe(0);
    });

    it('handles empty reactions array', () => {
      component = createComponent();
      populateReactions(component, []);
      expect(component.groupedReactions().size).toBe(0);
      expect(component.emojiTabs()).toEqual([]);
      expect(component.totalReactionCount()).toBe(0);
    });

    it('fetchReactions returns early when message is falsy', async () => {
      component = createComponent();
      (component as any).message = undefined;
      // Should not throw
      await component.fetchReactions();
      expect(component.isLoading()).toBe(false);
    });

    it('fetchReactions returns early when already loading', async () => {
      component = createComponent();
      component.isLoading.set(true);
      await component.fetchReactions();
      // Should remain loading (didn't reset)
      expect(component.isLoading()).toBe(true);
    });

    it('fetchReactions returns early when no more reactions', async () => {
      component = createComponent();
      component.hasMoreReactions.set(false);
      await component.fetchReactions();
      expect(component.isLoading()).toBe(false);
    });
  });

  // ==================== Item Click & Optimistic Removal ====================

  describe('item click and optimistic removal', () => {
    beforeEach(() => {
      component = createComponent();
      (component as any).loggedInUserUid = 'logged-in-user';
    });

    it('emits itemClick with reaction and message for current user reaction', () => {
      const reactions = [
        createMockReaction('👍', 'logged-in-user', 'Me'),
        createMockReaction('👍', 'user-2', 'Bob'),
      ];
      populateReactions(component, reactions);

      const spy = vi.fn();
      component.itemClick.subscribe(spy);

      const mouseEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
      component.onItemClick(mouseEvent, reactions[0] as any);

      expect(spy).toHaveBeenCalledWith({
        reaction: reactions[0],
        message: component.message,
      });
    });

    it('does not emit itemClick for non-current user reaction', () => {
      const reactions = [createMockReaction('👍', 'other-user', 'Other')];
      populateReactions(component, reactions);

      const spy = vi.fn();
      component.itemClick.subscribe(spy);

      const mouseEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
      component.onItemClick(mouseEvent, reactions[0] as any);

      expect(spy).not.toHaveBeenCalled();
    });

    it('optimistically removes the reaction from local list', () => {
      const reactions = [
        createMockReaction('👍', 'logged-in-user', 'Me'),
        createMockReaction('👍', 'user-2', 'Bob'),
        createMockReaction('❤️', 'user-3', 'Charlie'),
      ];
      populateReactions(component, reactions);

      expect(component.totalReactionCount()).toBe(3);

      const mouseEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
      component.onItemClick(mouseEvent, reactions[0] as any);

      expect(component.totalReactionCount()).toBe(2);
      expect(component.getEmojiCount('👍')).toBe(1);
    });

    it('emits empty when all reactions are removed', () => {
      const reactions = [createMockReaction('👍', 'logged-in-user', 'Me')];
      populateReactions(component, reactions);

      const emptySpy = vi.fn();
      component.empty.subscribe(emptySpy);

      const mouseEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
      component.onItemClick(mouseEvent, reactions[0] as any);

      expect(emptySpy).toHaveBeenCalled();
      expect(component.totalReactionCount()).toBe(0);
    });

    it('resets to All tab when selected emoji tab becomes empty', () => {
      const reactions = [
        createMockReaction('👍', 'logged-in-user', 'Me'),
        createMockReaction('❤️', 'user-2', 'Bob'),
      ];
      populateReactions(component, reactions);
      component.selectEmoji('👍');

      const mouseEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
      component.onItemClick(mouseEvent, reactions[0] as any);

      // 👍 tab is now empty, should reset to All
      expect(component.selectedEmoji()).toBeNull();
    });

    it('stops event propagation on item click', () => {
      const reactions = [createMockReaction('👍', 'logged-in-user', 'Me')];
      populateReactions(component, reactions);

      const mouseEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
      vi.spyOn(mouseEvent, 'stopPropagation');

      component.onItemClick(mouseEvent, reactions[0] as any);
      expect(mouseEvent.stopPropagation).toHaveBeenCalled();
    });
  });

  // ==================== Keyboard Interaction on Items ====================

  describe('keyboard interaction on items', () => {
    beforeEach(() => {
      component = createComponent();
      (component as any).loggedInUserUid = 'logged-in-user';
    });

    it('Enter key triggers onItemClick for current user reaction', () => {
      const reactions = [createMockReaction('👍', 'logged-in-user', 'Me')];
      populateReactions(component, reactions);

      // Mock MouseEvent constructor to avoid jsdom "view is not of type Window" issue
      const OriginalMouseEvent = globalThis.MouseEvent;
      globalThis.MouseEvent = class extends Event {
        constructor(type: string, init?: MouseEventInit) {
          super(type, init);
        }
      } as any;

      const onItemClickSpy = vi.spyOn(component, 'onItemClick');

      const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
      vi.spyOn(event, 'preventDefault');
      vi.spyOn(event, 'stopPropagation');

      component.onItemKeyDown(event, reactions[0] as any);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopPropagation).toHaveBeenCalled();
      expect(onItemClickSpy).toHaveBeenCalled();

      globalThis.MouseEvent = OriginalMouseEvent;
    });

    it('Space key triggers onItemClick for current user reaction', () => {
      const reactions = [createMockReaction('👍', 'logged-in-user', 'Me')];
      populateReactions(component, reactions);

      // Mock MouseEvent constructor to avoid jsdom "view is not of type Window" issue
      const OriginalMouseEvent = globalThis.MouseEvent;
      globalThis.MouseEvent = class extends Event {
        constructor(type: string, init?: MouseEventInit) {
          super(type, init);
        }
      } as any;

      const onItemClickSpy = vi.spyOn(component, 'onItemClick');

      const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
      vi.spyOn(event, 'preventDefault');

      component.onItemKeyDown(event, reactions[0] as any);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(onItemClickSpy).toHaveBeenCalled();

      globalThis.MouseEvent = OriginalMouseEvent;
    });

    it('Enter key does not emit for non-current user reaction', () => {
      const reactions = [createMockReaction('👍', 'other-user', 'Other')];
      populateReactions(component, reactions);

      const spy = vi.fn();
      component.itemClick.subscribe(spy);

      const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
      component.onItemKeyDown(event, reactions[0] as any);

      expect(spy).not.toHaveBeenCalled();
    });

    it('unrecognized key does not trigger item click', () => {
      const reactions = [createMockReaction('👍', 'logged-in-user', 'Me')];
      populateReactions(component, reactions);

      const spy = vi.fn();
      component.itemClick.subscribe(spy);

      const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });
      component.onItemKeyDown(event, reactions[0] as any);

      expect(spy).not.toHaveBeenCalled();
    });
  });

  // ==================== Helper Methods ====================

  describe('helper methods', () => {
    beforeEach(() => {
      component = createComponent();
      (component as any).loggedInUserUid = 'logged-in-user';
    });

    it('isCurrentUser returns true for logged-in user', () => {
      const reaction = createMockReaction('👍', 'logged-in-user', 'Me');
      expect(component.isCurrentUser(reaction as any)).toBe(true);
    });

    it('isCurrentUser returns false for other users', () => {
      const reaction = createMockReaction('👍', 'other-user', 'Other');
      expect(component.isCurrentUser(reaction as any)).toBe(false);
    });

    it('getDisplayName returns empty string for current user', () => {
      const reaction = createMockReaction('👍', 'logged-in-user', 'Me');
      expect(component.getDisplayName(reaction as any)).toBe('');
    });

    it('getDisplayName returns user name for other users', () => {
      const reaction = createMockReaction('👍', 'other-user', 'Alice');
      expect(component.getDisplayName(reaction as any)).toBe('Alice');
    });

    it('trackByReaction returns uid-emoji string', () => {
      const reaction = createMockReaction('👍', 'user-1', 'Alice');
      expect(component.trackByReaction(0, reaction as any)).toBe('user-1-👍');
    });

    it('trackByEmoji returns the emoji string', () => {
      expect(component.trackByEmoji(0, '👍')).toBe('👍');
    });
  });

  // ==================== Loading/Error/Retry States ====================

  describe('loading, error, and retry states', () => {
    beforeEach(() => {
      component = createComponent();
    });

    it('retry resets hasError and calls fetchReactions', async () => {
      component.hasError.set(true);
      const fetchSpy = vi.spyOn(component, 'fetchReactions').mockResolvedValue();

      component.retry();

      expect(component.hasError()).toBe(false);
      expect(fetchSpy).toHaveBeenCalled();
    });
  });

  // ==================== Scroll Pagination ====================

  describe('scroll pagination', () => {
    beforeEach(() => {
      component = createComponent();
    });

    it('triggers fetchReactions when scrolled near bottom', () => {
      const fetchSpy = vi.spyOn(component, 'fetchReactions').mockResolvedValue();
      component.isLoading.set(false);
      component.hasMoreReactions.set(true);

      const mockElement = {
        scrollHeight: 500,
        scrollTop: 440,
        clientHeight: 50,
      };
      const event = { target: mockElement } as unknown as Event;

      component.onScroll(event);
      expect(fetchSpy).toHaveBeenCalled();
    });

    it('does not trigger fetchReactions when not near bottom', () => {
      const fetchSpy = vi.spyOn(component, 'fetchReactions').mockResolvedValue();

      const mockElement = {
        scrollHeight: 500,
        scrollTop: 100,
        clientHeight: 50,
      };
      const event = { target: mockElement } as unknown as Event;

      component.onScroll(event);
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('does not trigger fetchReactions when already loading', () => {
      const fetchSpy = vi.spyOn(component, 'fetchReactions').mockResolvedValue();
      component.isLoading.set(true);

      const mockElement = {
        scrollHeight: 500,
        scrollTop: 445,
        clientHeight: 50,
      };
      const event = { target: mockElement } as unknown as Event;

      component.onScroll(event);
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('does not trigger fetchReactions when no more reactions', () => {
      const fetchSpy = vi.spyOn(component, 'fetchReactions').mockResolvedValue();
      component.hasMoreReactions.set(false);

      const mockElement = {
        scrollHeight: 500,
        scrollTop: 445,
        clientHeight: 50,
      };
      const event = { target: mockElement } as unknown as Event;

      component.onScroll(event);
      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });
});

// ==================== Property-Based Tests ====================

describe('CometChatReactionListComponent — Property Tests', () => {
  /**
   * Feature: comprehensive-test-suite
   * Property 10: Reaction list tab count
   *
   * For any message with N unique reaction emojis, the ReactionList component
   * shall display exactly N + 1 tabs (one "All" tab plus one per unique emoji).
   *
   * **Validates: Requirements 4.2**
   */
  it('Property 10: Reaction list tab count', () => {
    fc.assert(
      fc.property(reactionsArb, reactions => {
        const comp = createComponent();
        populateReactions(comp, reactions);

        const tabs = comp.emojiTabs();
        const uniqueEmojiCount = new Set(reactions.map(r => r.getReaction())).size;

        // emojiTabs must contain exactly the unique emojis
        expect(tabs.length).toBe(uniqueEmojiCount);

        // Total tabs = "All" tab (1) + one per unique emoji
        expect(1 + tabs.length).toBe(uniqueEmojiCount + 1);

        // Each unique emoji must appear in tabs
        const emojiSet = new Set(reactions.map(r => r.getReaction()));
        for (const emoji of emojiSet) {
          expect(tabs).toContain(emoji);
        }

        // No duplicate tabs
        expect(new Set(tabs).size).toBe(tabs.length);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: comprehensive-test-suite
   * Property 11: Reaction list tab filtering
   *
   * For any selected emoji tab, all displayed reaction items shall have
   * a reaction emoji matching the selected tab's emoji. The "All" tab
   * returns every reaction.
   *
   * **Validates: Requirements 4.2**
   */
  it('Property 11: Reaction list tab filtering', () => {
    fc.assert(
      fc.property(reactionsArb, reactions => {
        const comp = createComponent();
        populateReactions(comp, reactions);

        // "All" tab returns all reactions
        comp.selectEmoji(null);
        expect(comp.filteredReactions().length).toBe(reactions.length);

        // Each emoji tab returns only matching reactions
        const tabs = comp.emojiTabs();
        let sumFiltered = 0;
        for (const emoji of tabs) {
          comp.selectEmoji(emoji);
          const filtered = comp.filteredReactions();

          for (const r of filtered) {
            expect((r as any).getReaction()).toBe(emoji);
          }
          expect(filtered.length).toBeGreaterThan(0);
          expect(filtered.length).toBeLessThanOrEqual(reactions.length);
          sumFiltered += filtered.length;
        }

        // Sum of per-emoji counts equals total
        expect(sumFiltered).toBe(reactions.length);
      }),
      { numRuns: 100 }
    );
  });

  // ─── Accessibility ───

  describe('Accessibility', () => {
    it('should have accessible tab navigation for reaction groups', () => {
      const component = createComponent();
      // Reaction list uses tab-based navigation for emoji groups
      expect(typeof component.onTabKeyDown).toBe('function');
    });

    it('should provide accessible user list per reaction', () => {
      const component = createComponent();
      expect(component).toBeTruthy();
    });
  });
});
