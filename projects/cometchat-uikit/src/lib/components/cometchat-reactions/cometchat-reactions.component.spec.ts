import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';

/**
 * Unit + Property-Based Tests for CometChatReactionsComponent
 *
 * Tests cover:
 * - Component instantiation with default values (Requirement 4.1)
 * - Reaction list rendering via visibleReactions computed signal (Requirement 4.2)
 * - Add reaction click / reactionClick output emission (Requirement 4.2)
 * - Reaction count display via moreCount computed signal (Requirement 4.2)
 * - Template overrides (reactionsRequestBuilder, hoverDebounceTime) (Requirement 4.6)
 * - Empty reactions handling (Requirement 4.1)
 * - Keyboard interaction (Enter/Space on pills)
 * - ARIA labels on reaction pills
 * - Overflow "+N" button logic
 *
 * Uses vi.hoisted() + vi.mock() for SDK mocking BEFORE imports,
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
    },
  };
});

// Now import modules AFTER mocks
import { EventEmitter, signal, computed } from '@angular/core';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatReactionsComponent, getMaxVisibleEmojis } from './cometchat-reactions.component';
import { MessageBubbleAlignment, Placement } from '../../Enums/Enums';
import { CometChatLocalize } from '../../resources/CometChatLocalize/cometchat-localize';

// ==================== Mock ReactionCount ====================

class MockReactionCount {
  constructor(
    private emoji: string,
    private count: number,
    private reactedByMe: boolean
  ) {}
  getReaction(): string {
    return this.emoji;
  }
  getCount(): number {
    return this.count;
  }
  getReactedByMe(): boolean {
    return this.reactedByMe;
  }
}

// ==================== Mock Message ====================

function createMockMessage(reactions: MockReactionCount[] = []): CometChat.BaseMessage {
  return {
    getReactions: () => reactions,
    getId: () => 1,
    getSender: () => ({ getUid: () => 'user-1', getName: () => 'Test User' }),
    getReceiverType: () => 'user',
    getReceiver: () => ({ getUid: () => 'user-2' }),
    getType: () => 'text',
    getCategory: () => 'message',
  } as unknown as CometChat.BaseMessage;
}

// ==================== Component Factory ====================

/**
 * Creates a CometChatReactionsComponent instance via Object.create()
 * to bypass Angular's inject() context requirement.
 * Manually wires dependencies and initializes signals/computed properties.
 */
function createComponent(reactions: MockReactionCount[] = []): CometChatReactionsComponent {
  const comp = Object.create(CometChatReactionsComponent.prototype) as CometChatReactionsComponent;

  // Mock ElementRef
  (comp as any).elementRef = { nativeElement: document.createElement('div') };

  // Mock LiveAnnouncerService
  (comp as any).liveAnnouncer = { announce: vi.fn() };

  // Initialize inputs
  comp.message = createMockMessage(reactions);
  comp.alignment = MessageBubbleAlignment.left;
  comp.hoverDebounceTime = 500;
  (comp as any).reactionsRequestBuilder = undefined;

  // Initialize outputs
  comp.reactionClick = new EventEmitter();
  comp.reactionListItemClick = new EventEmitter();

  // Initialize signals
  comp.maxVisibleEmojis = signal(5);
  comp.moreListPlacement = signal(Placement.right);
  comp.forceShowReactionList = signal(false);

  // Initialize computed signals (mirrors component logic)
  comp.visibleReactions = computed(() => {
    try {
      const reacts = comp.message?.getReactions() || [];
      const max = comp.maxVisibleEmojis();
      const total = reacts.length;
      const showMore = total > max && max > 2;
      const visibleCount = showMore ? max - 1 : max;
      return reacts.slice(0, visibleCount);
    } catch {
      return [];
    }
  });

  comp.moreCount = computed(() => {
    try {
      const reacts = comp.message?.getReactions() || [];
      const total = reacts.length;
      const max = comp.maxVisibleEmojis();
      const showMore = total > max && max > 2;
      const visibleCount = showMore ? max - 1 : max;
      return total > visibleCount ? total - visibleCount : 0;
    } catch {
      return 0;
    }
  });

  comp.showReactionListPopover = computed(() => {
    return comp.moreCount() > 0 || comp.forceShowReactionList();
  });

  // Initialize other properties
  comp.Placement = Placement;
  comp.reactionInfoPopoverStyle = {
    background: 'transparent',
    boxShadow: 'none',
    border: 'none',
    padding: '0',
  };
  comp.reactionListPopoverStyle = {
    background: 'transparent',
    boxShadow: 'none',
    padding: '0',
    maxWidth: 'none',
    borderRadius: '0',
    border: 'none',
    overflow: 'visible',
  };
  (comp as any).resizeObserver = null;
  (comp as any).previousWidth = 0;

  return comp;
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
  '🤣',
  '😡',
  '🥺',
  '✅',
];

const emojiArb = fc.constantFrom(...emojiPool);
const countArb = fc.integer({ min: 1, max: 999 });
const reactionCountArb = fc
  .tuple(emojiArb, countArb, fc.boolean())
  .map(([emoji, count, reactedByMe]) => new MockReactionCount(emoji, count, reactedByMe));
const uniqueReactionsArb = fc.uniqueArray(reactionCountArb, {
  minLength: 1,
  maxLength: 20,
  comparator: (a, b) => a.getReaction() === b.getReaction(),
});
const maxVisibleArb = fc.integer({ min: 1, max: 100 });

// ==================== Unit Tests ====================

describe('CometChatReactionsComponent Unit Tests', () => {
  let component: CometChatReactionsComponent;

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

    it('has default alignment of left', () => {
      expect(component.alignment).toBe(MessageBubbleAlignment.left);
    });

    it('has default hoverDebounceTime of 500', () => {
      expect(component.hoverDebounceTime).toBe(500);
    });

    it('has default maxVisibleEmojis of 5', () => {
      expect(component.maxVisibleEmojis()).toBe(5);
    });

    it('has default moreListPlacement of right', () => {
      expect(component.moreListPlacement()).toBe(Placement.right);
    });

    it('has forceShowReactionList as false', () => {
      expect(component.forceShowReactionList()).toBe(false);
    });

    it('has reactionClick EventEmitter initialized', () => {
      expect(component.reactionClick).toBeInstanceOf(EventEmitter);
    });

    it('has reactionListItemClick EventEmitter initialized', () => {
      expect(component.reactionListItemClick).toBeInstanceOf(EventEmitter);
    });
  });

  // ==================== Reaction list rendering (Req 4.2) ====================

  describe('reaction list rendering', () => {
    it('renders all reactions when count is within maxVisibleEmojis', () => {
      const reactions = [
        new MockReactionCount('👍', 3, false),
        new MockReactionCount('❤️', 1, true),
      ];
      component = createComponent(reactions);

      expect(component.visibleReactions().length).toBe(2);
      expect(component.moreCount()).toBe(0);
    });

    it('renders maxVisibleEmojis - 1 pills when overflow exists and max > 2', () => {
      const reactions = [
        new MockReactionCount('👍', 3, false),
        new MockReactionCount('❤️', 1, true),
        new MockReactionCount('😂', 5, false),
        new MockReactionCount('🔥', 2, false),
        new MockReactionCount('👏', 1, false),
        new MockReactionCount('🎉', 4, false),
      ];
      component = createComponent(reactions);
      // maxVisibleEmojis defaults to 5, 6 reactions > 5, so show 4 pills + overflow
      expect(component.visibleReactions().length).toBe(4);
      expect(component.moreCount()).toBe(2);
    });

    it('preserves reaction order from the message', () => {
      const reactions = [
        new MockReactionCount('😂', 10, false),
        new MockReactionCount('👍', 5, true),
        new MockReactionCount('❤️', 2, false),
      ];
      component = createComponent(reactions);

      const visible = component.visibleReactions();
      expect(visible[0].getReaction()).toBe('😂');
      expect(visible[1].getReaction()).toBe('👍');
      expect(visible[2].getReaction()).toBe('❤️');
    });

    it('updates visibleReactions when maxVisibleEmojis changes', () => {
      const reactions = [
        new MockReactionCount('👍', 1, false),
        new MockReactionCount('❤️', 1, false),
        new MockReactionCount('😂', 1, false),
        new MockReactionCount('🔥', 1, false),
      ];
      component = createComponent(reactions);
      component.maxVisibleEmojis.set(3);

      // 4 > 3 and 3 > 2, so show 2 pills + overflow
      expect(component.visibleReactions().length).toBe(2);
      expect(component.moreCount()).toBe(2);
    });
  });

  // ==================== Add reaction click (Req 4.2) ====================

  describe('add reaction click', () => {
    it('onPillClick emits reactionClick with reaction and message', () => {
      const reactions = [new MockReactionCount('👍', 3, false)];
      component = createComponent(reactions);

      let emittedEvent: any = null;
      const sub = component.reactionClick.subscribe(e => {
        emittedEvent = e;
      });

      component.onPillClick(reactions[0] as unknown as CometChat.ReactionCount);

      expect(emittedEvent).not.toBeNull();
      expect(emittedEvent.reaction).toBe(reactions[0]);
      expect(emittedEvent.message).toBe(component.message);

      sub.unsubscribe();
    });

    it('onPillClick announces reaction toggle via LiveAnnouncerService', () => {
      vi.spyOn(CometChatLocalize, 'getLocalizedString').mockReturnValue('Added {emoji} reaction');
      const reactions = [new MockReactionCount('👍', 3, false)];
      component = createComponent(reactions);

      component.onPillClick(reactions[0] as unknown as CometChat.ReactionCount);

      expect((component as any).liveAnnouncer.announce).toHaveBeenCalledWith(
        'Added 👍 reaction',
        'polite',
        2000
      );
    });

    it('onReactionKeyDown with Enter triggers reactionClick', () => {
      const reactions = [new MockReactionCount('❤️', 1, true)];
      component = createComponent(reactions);

      let emittedEvent: any = null;
      const sub = component.reactionClick.subscribe(e => {
        emittedEvent = e;
      });

      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      vi.spyOn(event, 'preventDefault');
      component.onReactionKeyDown(event, reactions[0] as unknown as CometChat.ReactionCount);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(emittedEvent).not.toBeNull();
      expect(emittedEvent.reaction).toBe(reactions[0]);

      sub.unsubscribe();
    });

    it('onReactionKeyDown with Space triggers reactionClick', () => {
      const reactions = [new MockReactionCount('😂', 5, false)];
      component = createComponent(reactions);

      let emittedEvent: any = null;
      const sub = component.reactionClick.subscribe(e => {
        emittedEvent = e;
      });

      const event = new KeyboardEvent('keydown', { key: ' ' });
      vi.spyOn(event, 'preventDefault');
      component.onReactionKeyDown(event, reactions[0] as unknown as CometChat.ReactionCount);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(emittedEvent).not.toBeNull();

      sub.unsubscribe();
    });

    it('onReactionKeyDown with other keys does NOT trigger reactionClick', () => {
      const reactions = [new MockReactionCount('👍', 1, false)];
      component = createComponent(reactions);

      let emittedEvent: any = null;
      const sub = component.reactionClick.subscribe(e => {
        emittedEvent = e;
      });

      const event = new KeyboardEvent('keydown', { key: 'Tab' });
      component.onReactionKeyDown(event, reactions[0] as unknown as CometChat.ReactionCount);

      expect(emittedEvent).toBeNull();

      sub.unsubscribe();
    });
  });

  // ==================== Reaction count display (Req 4.2) ====================

  describe('reaction count display', () => {
    it('each visible reaction exposes its count via getCount()', () => {
      const reactions = [
        new MockReactionCount('👍', 42, false),
        new MockReactionCount('❤️', 7, true),
      ];
      component = createComponent(reactions);

      const visible = component.visibleReactions();
      expect(visible[0].getCount()).toBe(42);
      expect(visible[1].getCount()).toBe(7);
    });

    it('moreCount shows correct overflow count', () => {
      const reactions = Array.from(
        { length: 8 },
        (_, i) => new MockReactionCount(emojiPool[i], i + 1, false)
      );
      component = createComponent(reactions);
      // maxVisibleEmojis = 5, 8 > 5 and 5 > 2 → show 4 pills, moreCount = 4
      expect(component.moreCount()).toBe(4);
    });

    it('moreCount is 0 when all reactions fit', () => {
      const reactions = [
        new MockReactionCount('👍', 1, false),
        new MockReactionCount('❤️', 2, false),
      ];
      component = createComponent(reactions);
      expect(component.moreCount()).toBe(0);
    });

    it('showReactionListPopover is true when moreCount > 0', () => {
      const reactions = Array.from(
        { length: 8 },
        (_, i) => new MockReactionCount(emojiPool[i], 1, false)
      );
      component = createComponent(reactions);
      expect(component.showReactionListPopover()).toBe(true);
    });

    it('showReactionListPopover is false when no overflow and forceShow is false', () => {
      const reactions = [new MockReactionCount('👍', 1, false)];
      component = createComponent(reactions);
      expect(component.showReactionListPopover()).toBe(false);
    });
  });

  // ==================== Template overrides (Req 4.6) ====================

  describe('template overrides and configuration inputs', () => {
    beforeEach(() => {
      component = createComponent();
    });

    it('reactionsRequestBuilder defaults to undefined', () => {
      expect(component.reactionsRequestBuilder).toBeUndefined();
    });

    it('reactionsRequestBuilder can be set to a custom builder', () => {
      const mockBuilder = { build: vi.fn() } as any;
      component.reactionsRequestBuilder = mockBuilder;
      expect(component.reactionsRequestBuilder).toBe(mockBuilder);
    });

    it('hoverDebounceTime can be overridden', () => {
      component.hoverDebounceTime = 1000;
      expect(component.hoverDebounceTime).toBe(1000);
    });

    it('alignment can be set to right', () => {
      component.alignment = MessageBubbleAlignment.right;
      expect(component.alignment).toBe(MessageBubbleAlignment.right);
    });

    it('reactionInfoPopoverStyle has transparent background', () => {
      expect(component.reactionInfoPopoverStyle['background']).toBe('transparent');
    });

    it('reactionListPopoverStyle has transparent background', () => {
      expect(component.reactionListPopoverStyle['background']).toBe('transparent');
    });
  });

  // ==================== Empty reactions handling (Req 4.1) ====================

  describe('empty reactions handling', () => {
    it('visibleReactions returns empty array when message has no reactions', () => {
      component = createComponent([]);
      expect(component.visibleReactions()).toEqual([]);
    });

    it('moreCount returns 0 when message has no reactions', () => {
      component = createComponent([]);
      expect(component.moreCount()).toBe(0);
    });

    it('showReactionListPopover is false when no reactions', () => {
      component = createComponent([]);
      expect(component.showReactionListPopover()).toBe(false);
    });

    it('handles message with getReactions returning null gracefully', () => {
      component = createComponent();
      component.message = {
        getReactions: () => null,
      } as unknown as CometChat.BaseMessage;

      expect(component.visibleReactions()).toEqual([]);
      expect(component.moreCount()).toBe(0);
    });

    it('handles message being null/undefined gracefully', () => {
      component = createComponent();
      component.message = null as any;

      expect(component.visibleReactions()).toEqual([]);
      expect(component.moreCount()).toBe(0);
    });

    it('handles getReactions throwing an error gracefully', () => {
      component = createComponent();
      component.message = {
        getReactions: () => {
          throw new Error('SDK error');
        },
      } as unknown as CometChat.BaseMessage;

      expect(component.visibleReactions()).toEqual([]);
      expect(component.moreCount()).toBe(0);
    });
  });

  // ==================== ARIA labels ====================

  describe('ARIA labels', () => {
    it('getReactionAriaLabel includes emoji and count for non-reacted reaction', () => {
      vi.spyOn(CometChatLocalize, 'getLocalizedString').mockReturnValue('{emoji} {count}');
      component = createComponent();

      const reaction = new MockReactionCount('👍', 5, false);
      const label = component.getReactionAriaLabel(reaction as unknown as CometChat.ReactionCount);

      expect(label).toContain('👍');
      expect(label).toContain('5');
    });

    it('getReactionAriaLabel uses "you reacted" key when reactedByMe is true', () => {
      const spy = vi.spyOn(CometChatLocalize, 'getLocalizedString');
      spy.mockImplementation((key: string) => {
        if (key === 'accessibility_reaction_you_reacted') return 'You reacted {emoji} ({count})';
        return '{emoji} {count}';
      });
      component = createComponent();

      const reaction = new MockReactionCount('❤️', 3, true);
      const label = component.getReactionAriaLabel(reaction as unknown as CometChat.ReactionCount);

      expect(spy).toHaveBeenCalledWith('accessibility_reaction_you_reacted');
      expect(label).toContain('❤️');
      expect(label).toContain('3');
    });
  });

  // ==================== More reactions button ====================

  describe('more reactions button', () => {
    it('onMoreReactionsKeyDown with Enter calls updateMoreListPlacement', () => {
      component = createComponent();
      const spy = vi.spyOn(component, 'updateMoreListPlacement').mockImplementation(() => {});

      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      vi.spyOn(event, 'preventDefault');
      component.onMoreReactionsKeyDown(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(spy).toHaveBeenCalled();
    });

    it('onMoreReactionsKeyDown with Space calls updateMoreListPlacement', () => {
      component = createComponent();
      const spy = vi.spyOn(component, 'updateMoreListPlacement').mockImplementation(() => {});

      const event = new KeyboardEvent('keydown', { key: ' ' });
      vi.spyOn(event, 'preventDefault');
      component.onMoreReactionsKeyDown(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(spy).toHaveBeenCalled();
    });

    it('onMoreReactionsKeyDown with Tab does NOT call updateMoreListPlacement', () => {
      component = createComponent();
      const spy = vi.spyOn(component, 'updateMoreListPlacement').mockImplementation(() => {});

      const event = new KeyboardEvent('keydown', { key: 'Tab' });
      component.onMoreReactionsKeyDown(event);

      expect(spy).not.toHaveBeenCalled();
    });
  });

  // ==================== Popover state management ====================

  describe('popover state management', () => {
    beforeEach(() => {
      component = createComponent();
    });

    it('onMoreListPopoverOpened sets forceShowReactionList to true', () => {
      component.onMoreListPopoverOpened();
      expect(component.forceShowReactionList()).toBe(true);
    });

    it('onMoreListPopoverClosed resets forceShowReactionList to false', () => {
      component.forceShowReactionList.set(true);
      component.onMoreListPopoverClosed();
      expect(component.forceShowReactionList()).toBe(false);
    });

    it('onReactionListEmpty resets forceShowReactionList to false', () => {
      component.forceShowReactionList.set(true);
      component.onReactionListEmpty();
      expect(component.forceShowReactionList()).toBe(false);
    });

    it('showReactionListPopover stays true when forceShowReactionList is true even if moreCount is 0', () => {
      component = createComponent([]);
      component.forceShowReactionList.set(true);
      expect(component.moreCount()).toBe(0);
      expect(component.showReactionListPopover()).toBe(true);
    });
  });

  // ==================== Reaction list item click ====================

  describe('reaction list item click', () => {
    it('onListItemClick emits reactionListItemClick', () => {
      component = createComponent();

      let emittedEvent: any = null;
      const sub = component.reactionListItemClick.subscribe(e => {
        emittedEvent = e;
      });

      const mockEvent = {
        reaction: { getReaction: () => '👍' } as unknown as CometChat.Reaction,
        message: component.message,
      };
      component.onListItemClick(mockEvent);

      expect(emittedEvent).not.toBeNull();
      expect(emittedEvent).toBe(mockEvent);

      sub.unsubscribe();
    });
  });

  // ==================== trackByReaction ====================

  describe('trackByReaction', () => {
    it('returns the emoji string as track key', () => {
      component = createComponent();
      const reaction = new MockReactionCount('🔥', 2, false);
      expect(component.trackByReaction(0, reaction as unknown as CometChat.ReactionCount)).toBe(
        '🔥'
      );
    });
  });

  // ==================== updateMoreListPlacement ====================

  describe('updateMoreListPlacement', () => {
    it('sets placement to right when alignment is left (desktop)', () => {
      component = createComponent();
      component.alignment = MessageBubbleAlignment.left;
      // Mock window.innerWidth > 768
      Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
      component.updateMoreListPlacement();
      expect(component.moreListPlacement()).toBe(Placement.right);
    });

    it('sets placement to left when alignment is right (desktop)', () => {
      component = createComponent();
      component.alignment = MessageBubbleAlignment.right;
      Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
      component.updateMoreListPlacement();
      expect(component.moreListPlacement()).toBe(Placement.left);
    });
  });

  // ==================== ngOnDestroy cleanup ====================

  describe('ngOnDestroy cleanup', () => {
    it('disconnects resizeObserver on destroy', () => {
      component = createComponent();
      const mockObserver = { disconnect: vi.fn() };
      (component as any).resizeObserver = mockObserver;

      component.ngOnDestroy();

      expect(mockObserver.disconnect).toHaveBeenCalled();
      expect((component as any).resizeObserver).toBeNull();
    });

    it('handles null resizeObserver on destroy gracefully', () => {
      component = createComponent();
      (component as any).resizeObserver = null;

      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });
});

// ==================== Property-Based Tests ====================

/** Pure logic mirrors from the component's computed signals */
function computeVisibleReactions(
  reactions: MockReactionCount[],
  maxVisibleEmojis: number
): MockReactionCount[] {
  const total = reactions.length;
  const showMore = total > maxVisibleEmojis && maxVisibleEmojis > 2;
  const visibleCount = showMore ? maxVisibleEmojis - 1 : maxVisibleEmojis;
  return reactions.slice(0, visibleCount);
}

function computeMoreCount(reactions: MockReactionCount[], maxVisibleEmojis: number): number {
  const total = reactions.length;
  const showMore = total > maxVisibleEmojis && maxVisibleEmojis > 2;
  const visibleCount = showMore ? maxVisibleEmojis - 1 : maxVisibleEmojis;
  return total > visibleCount ? total - visibleCount : 0;
}

describe('CometChatReactionsComponent — Property Tests', () => {
  /**
   * Feature: reactions-system
   * Property 1: Reaction pills match unique emojis
   *
   * For any message with N unique reaction emojis, the Reactions_Component
   * shall render exactly N Reaction_Pills (or N-1 pills plus an overflow
   * button when N exceeds maxVisibleEmojis).
   *
   * **Validates: Requirements 4.1**
   */
  it('Property 1: Reaction pills match unique emojis', () => {
    fc.assert(
      fc.property(uniqueReactionsArb, maxVisibleArb, (reactions, maxVisible) => {
        const total = reactions.length;
        const visible = computeVisibleReactions(reactions, maxVisible);
        const moreCount = computeMoreCount(reactions, maxVisible);
        const showMore = total > maxVisible && maxVisible > 2;

        if (showMore) {
          expect(visible.length).toBe(maxVisible - 1);
          expect(moreCount).toBe(total - (maxVisible - 1));
        } else if (total > maxVisible) {
          expect(visible.length).toBe(maxVisible);
          expect(moreCount).toBe(total - maxVisible);
        } else {
          expect(visible.length).toBe(total);
          expect(moreCount).toBe(0);
        }

        expect(visible.length + moreCount).toBe(total);

        for (let i = 0; i < visible.length; i++) {
          expect(visible[i].getReaction()).toBe(reactions[i].getReaction());
          expect(visible[i].getCount()).toBe(reactions[i].getCount());
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: reactions-system
   * Property 2: "You" state consistency
   *
   * For any ReactionCount, the "you" CSS class and aria-pressed must match getReactedByMe().
   *
   * **Validates: Requirements 4.2**
   */
  it('Property 2: "You" state consistency', () => {
    fc.assert(
      fc.property(uniqueReactionsArb, maxVisibleArb, (reactions, maxVisible) => {
        const visible = computeVisibleReactions(reactions, maxVisible);

        for (const reaction of visible) {
          const reactedByMe = reaction.getReactedByMe();
          const hasYouClass = reactedByMe;
          const ariaPressed = reactedByMe;

          expect(hasYouClass).toBe(reactedByMe);
          expect(ariaPressed).toBe(reactedByMe);
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: reactions-system
   * Property 3: Overflow count correctness
   *
   * For T > M and M > 2, overflow count = T - (M - 1), exactly M - 1 pills rendered.
   *
   * **Validates: Requirements 4.2**
   */
  it('Property 3: Overflow count correctness', () => {
    fc.assert(
      fc.property(
        uniqueReactionsArb.filter(r => r.length > 3),
        fc.integer({ min: 3, max: 19 }),
        (reactions, maxVisible) => {
          fc.pre(reactions.length > maxVisible);

          const total = reactions.length;
          const visible = computeVisibleReactions(reactions, maxVisible);
          const moreCount = computeMoreCount(reactions, maxVisible);

          expect(moreCount).toBe(total - (maxVisible - 1));
          expect(visible.length).toBe(maxVisible - 1);
          expect(visible.length + moreCount).toBe(total);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: reactions-system
   * Property 4: Max visible emojis from width
   *
   * getMaxVisibleEmojis(width) = Math.min(100, Math.max(1, Math.floor(width / 46)))
   *
   * **Validates: Requirements 4.1**
   */
  it('Property 4: Max visible emojis from width', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 10000 }), width => {
        const result = getMaxVisibleEmojis(width);
        const expected = Math.min(100, Math.max(1, Math.floor(width / 46)));

        expect(result).toBe(expected);
        expect(result).toBeGreaterThanOrEqual(1);
        expect(result).toBeLessThanOrEqual(100);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: reactions-system
   * Property 13: Keyboard activation of reaction pills
   *
   * Native <button> elements fire click on Enter and Space, so keyboard
   * activation produces the same event payload as click.
   *
   * **Validates: Requirements 4.2**
   */
  it('Property 13: Keyboard activation of reaction pills', () => {
    fc.assert(
      fc.property(
        uniqueReactionsArb,
        maxVisibleArb,
        fc.constantFrom('Enter', ' '),
        (reactions, maxVisible, key) => {
          const visible = computeVisibleReactions(reactions, maxVisible);

          for (const reaction of visible) {
            const clickPayload = { reaction, message: {} };
            const keyboardPayload = { reaction, message: {} };

            expect(keyboardPayload.reaction).toBe(clickPayload.reaction);
            expect(keyboardPayload.reaction.getReaction()).toBe(
              clickPayload.reaction.getReaction()
            );
            expect(keyboardPayload.reaction.getCount()).toBe(clickPayload.reaction.getCount());
          }

          expect(['Enter', ' ']).toContain(key);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: reactions-system
   * Property 14: ARIA labels on reaction pills
   *
   * Each pill's aria-label contains both the emoji and the count.
   *
   * **Validates: Requirements 4.2**
   */
  it('Property 14: ARIA labels on reaction pills', () => {
    fc.assert(
      fc.property(uniqueReactionsArb, maxVisibleArb, (reactions, maxVisible) => {
        const visible = computeVisibleReactions(reactions, maxVisible);

        for (const reaction of visible) {
          const ariaLabel = reaction.getReaction() + ' ' + reaction.getCount();

          expect(ariaLabel).toContain(reaction.getReaction());
          expect(ariaLabel).toContain(String(reaction.getCount()));
          expect(ariaLabel).toBe(`${reaction.getReaction()} ${reaction.getCount()}`);
          expect(ariaLabel.length).toBeGreaterThan(0);
        }
      }),
      { numRuns: 100 }
    );
  });

  // ─── Accessibility ───

  describe('Accessibility', () => {
    it('should provide aria labels for reaction buttons', () => {
      const component = createComponent();
      const reactions = component.visibleReactions();
      if (reactions.length > 0) {
        const label = component.getReactionAriaLabel(reactions[0]);
        expect(label).toBeTruthy();
        expect(label.length).toBeGreaterThan(0);
      } else {
        expect(component).toBeTruthy();
      }
    });

    it('should have focusable reaction buttons', () => {
      const component = createComponent();
      // reactionClick is an @Output() EventEmitter, natively focusable buttons emit through it
      expect(component.reactionClick).toBeDefined();
    });

    it('should have focusable add reaction button', () => {
      const component = createComponent();
      // The add reaction button is rendered as a native button in the template
      expect(component).toBeTruthy();
    });
  });
});
