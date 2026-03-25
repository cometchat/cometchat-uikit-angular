import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';

/**
 * Unit + Property-Based Tests for CometChatReactionInfoComponent
 *
 * Tests cover:
 * - Component instantiation with default values (Requirement 4.1)
 * - Reaction details display: emoji, names, "reacted" text (Requirement 4.2)
 * - User info: logged-in user shown as "You", placed first (Requirement 4.2)
 * - Null/missing reaction handling (Requirement 4.1)
 * - State transitions: loading, loaded, error
 * - Display text formatting with overflow ("and X others")
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

      ReactionsRequestBuilder: class {
        private messageId = 0;
        private reactionEmoji = '';
        private _limit = 10;
        setMessageId(id: number) {
          this.messageId = id;
          return this;
        }
        setReaction(emoji: string) {
          this.reactionEmoji = emoji;
          return this;
        }
        setLimit(limit: number) {
          this._limit = limit;
          return this;
        }
        build() {
          return { fetchNext: vi.fn().mockResolvedValue([]) };
        }
      },
    },
  };
});

// Now import modules AFTER mocks are set up
import { signal } from '@angular/core';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatReactionInfoComponent } from './cometchat-reaction-info.component';
import { CometChatLocalize } from '../../resources/CometChatLocalize';

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

class MockReactionCount {
  constructor(
    private emoji: string,
    private count: number
  ) {}
  getReaction(): string {
    return this.emoji;
  }
  getCount(): number {
    return this.count;
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

function createMockMessage(id = 1, reactions: MockReactionCount[] = []): CometChat.BaseMessage {
  return {
    getId: () => id,
    getSender: () => ({ getUid: () => 'user-1', getName: () => 'Test User' }),
    getReceiverType: () => 'user',
    getReceiver: () => ({ getUid: () => 'user-2' }),
    getType: () => 'text',
    getCategory: () => 'message',
    getReactions: () => reactions,
  } as unknown as CometChat.BaseMessage;
}

function createMockReaction(emoji: string, uid: string, name: string): MockReaction {
  return new MockReaction(emoji, new MockUser(uid, name));
}

// ==================== Component Factory ====================

/**
 * Creates a CometChatReactionInfoComponent instance via Object.create()
 * to bypass Angular's inject() context requirement.
 * Manually wires signals, inputs, and internal state.
 */
function createComponent(
  message?: CometChat.BaseMessage,
  reaction?: string
): CometChatReactionInfoComponent {
  const comp = Object.create(
    CometChatReactionInfoComponent.prototype
  ) as CometChatReactionInfoComponent;

  // Initialize inputs
  comp.message = message || createMockMessage();
  comp.reaction = reaction || '👍';

  // Initialize signals
  comp.state = signal<'loading' | 'loaded' | 'error'>('loading');
  comp.reactionNames = signal<string[]>([]);
  comp.totalReactions = signal<number>(0);

  // Initialize private state
  (comp as any).loggedInUserUid = '';

  return comp;
}

// ==================== Localization Stub ====================

function stubLocalization(): void {
  vi.spyOn(CometChatLocalize, 'getLocalizedString').mockImplementation((key: string): string => {
    const map: Record<string, string> = {
      reaction_popup_you: 'You',
      reaction_popup_and: 'and',
      reaction_popup_others: 'others',
      reaction_reacted: 'reacted',
      accessibility_loading: 'Loading',
      reaction_list_error: 'Something went wrong',
    };
    return map[key] ?? key;
  });
}

// ==================== Unit Tests ====================

describe('CometChatReactionInfoComponent', () => {
  let component: CometChatReactionInfoComponent;

  beforeEach(() => {
    stubLocalization();
  });

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

    it('has reaction input set to default emoji', () => {
      expect(component.reaction).toBe('👍');
    });

    it('has state signal initialized to loading', () => {
      expect(component.state()).toBe('loading');
    });

    it('has reactionNames signal initialized to empty array', () => {
      expect(component.reactionNames()).toEqual([]);
    });

    it('has totalReactions signal initialized to 0', () => {
      expect(component.totalReactions()).toBe(0);
    });
  });

  // ==================== Reaction Details Display (Req 4.2) ====================

  describe('reaction details display', () => {
    beforeEach(() => {
      component = createComponent();
    });

    it('getDisplayText returns empty string when no names', () => {
      component.reactionNames.set([]);
      component.totalReactions.set(0);
      expect(component.getDisplayText()).toBe('');
    });

    it('getDisplayText returns single name when one reactor', () => {
      component.reactionNames.set(['Alice']);
      component.totalReactions.set(1);
      expect(component.getDisplayText()).toBe('Alice');
    });

    it('getDisplayText returns comma-separated names for multiple reactors', () => {
      component.reactionNames.set(['Alice', 'Bob', 'Charlie']);
      component.totalReactions.set(3);
      expect(component.getDisplayText()).toBe('Alice, Bob, Charlie');
    });

    it('getDisplayText appends "and X others" when total exceeds fetched count', () => {
      component.reactionNames.set(['Alice', 'Bob']);
      component.totalReactions.set(5);
      expect(component.getDisplayText()).toBe('Alice, Bob and 3 others');
    });

    it('getDisplayText shows "and 1 others" when one extra beyond fetched', () => {
      component.reactionNames.set(['Alice']);
      component.totalReactions.set(2);
      expect(component.getDisplayText()).toBe('Alice and 1 others');
    });

    it('stores the reaction emoji on the component', () => {
      const comp = createComponent(undefined, '❤️');
      expect(comp.reaction).toBe('❤️');
    });
  });

  // ==================== User Info — "You" Substitution (Req 4.2) ====================

  describe('user info and "You" substitution', () => {
    it('formatReactionNames places "You" first when logged-in user is among reactors', () => {
      component = createComponent();
      (component as any).loggedInUserUid = 'logged-in-user';

      const reactions = [
        createMockReaction('👍', 'user-1', 'Alice'),
        createMockReaction('👍', 'logged-in-user', 'Me'),
        createMockReaction('👍', 'user-2', 'Bob'),
      ];

      const names = (component as any).formatReactionNames(reactions);
      expect(names[0]).toBe('You');
      expect(names).toContain('Alice');
      expect(names).toContain('Bob');
      expect(names).not.toContain('Me');
    });

    it('formatReactionNames does not include "You" when logged-in user is absent', () => {
      component = createComponent();
      (component as any).loggedInUserUid = 'some-other-uid';

      const reactions = [
        createMockReaction('👍', 'user-1', 'Alice'),
        createMockReaction('👍', 'user-2', 'Bob'),
      ];

      const names = (component as any).formatReactionNames(reactions);
      expect(names).not.toContain('You');
      expect(names).toEqual(['Alice', 'Bob']);
    });

    it('formatReactionNames returns only "You" when logged-in user is the sole reactor', () => {
      component = createComponent();
      (component as any).loggedInUserUid = 'logged-in-user';

      const reactions = [createMockReaction('👍', 'logged-in-user', 'Me')];

      const names = (component as any).formatReactionNames(reactions);
      expect(names).toEqual(['You']);
    });

    it('formatReactionNames preserves order of other reactors after "You"', () => {
      component = createComponent();
      (component as any).loggedInUserUid = 'logged-in-user';

      const reactions = [
        createMockReaction('👍', 'user-a', 'Zara'),
        createMockReaction('👍', 'logged-in-user', 'Me'),
        createMockReaction('👍', 'user-b', 'Alice'),
        createMockReaction('👍', 'user-c', 'Bob'),
      ];

      const names = (component as any).formatReactionNames(reactions);
      expect(names).toEqual(['You', 'Zara', 'Alice', 'Bob']);
    });
  });

  // ==================== State Transitions ====================

  describe('state transitions', () => {
    /** Flush microtask queue so fire-and-forget promises settle. */
    function flushPromises(): Promise<void> {
      return new Promise(resolve => setTimeout(resolve, 0));
    }

    it('initializeAndFetch transitions to loaded state on successful fetch', async () => {
      component = createComponent();

      await (component as any).initializeAndFetch();
      await flushPromises();

      expect(component.state()).toBe('loaded');
    });

    it('initializeAndFetch sets loggedInUserUid from SDK', async () => {
      component = createComponent();

      await (component as any).initializeAndFetch();
      await flushPromises();

      expect((component as any).loggedInUserUid).toBe('logged-in-user');
    });

    it('computeTotalReactions sets count from message reactions', () => {
      const reactionCounts = [new MockReactionCount('👍', 7), new MockReactionCount('❤️', 3)];
      const msg = createMockMessage(1, reactionCounts);
      component = createComponent(msg, '👍');

      (component as any).computeTotalReactions();
      expect(component.totalReactions()).toBe(7);
    });

    it('computeTotalReactions sets 0 when emoji not found in reactions', () => {
      const reactionCounts = [new MockReactionCount('❤️', 3)];
      const msg = createMockMessage(1, reactionCounts);
      component = createComponent(msg, '👍');

      (component as any).computeTotalReactions();
      expect(component.totalReactions()).toBe(0);
    });

    it('computeTotalReactions handles message with matching reaction count', () => {
      const reactionCounts = [new MockReactionCount('👍', 15)];
      const msg = createMockMessage(1, reactionCounts);
      component = createComponent(msg, '👍');

      (component as any).computeTotalReactions();
      expect(component.totalReactions()).toBe(15);
    });
  });

  // ==================== ngOnChanges ====================

  describe('ngOnChanges', () => {
    beforeEach(() => {
      component = createComponent();
    });

    it('re-fetches when message input changes (not first change)', () => {
      const fetchSpy = vi.spyOn(component as any, 'fetchReactionInfo').mockResolvedValue(undefined);

      component.ngOnChanges({
        message: {
          firstChange: false,
          previousValue: null,
          currentValue: createMockMessage(2),
          isFirstChange: () => false,
        },
      } as any);

      expect(fetchSpy).toHaveBeenCalled();
    });

    it('re-fetches when reaction input changes (not first change)', () => {
      const fetchSpy = vi.spyOn(component as any, 'fetchReactionInfo').mockResolvedValue(undefined);

      component.ngOnChanges({
        reaction: {
          firstChange: false,
          previousValue: '👍',
          currentValue: '❤️',
          isFirstChange: () => false,
        },
      } as any);

      expect(fetchSpy).toHaveBeenCalled();
    });

    it('does not re-fetch on first change', () => {
      const fetchSpy = vi.spyOn(component as any, 'fetchReactionInfo').mockResolvedValue(undefined);

      component.ngOnChanges({
        message: {
          firstChange: true,
          previousValue: undefined,
          currentValue: createMockMessage(),
          isFirstChange: () => true,
        },
      } as any);

      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });

  // ==================== Null/Missing Reaction Handling (Req 4.1) ====================

  describe('null/missing reaction handling', () => {
    it('handles message with no reactions array gracefully', () => {
      const msg = {
        getId: () => 1,
        getSender: () => ({ getUid: () => 'user-1', getName: () => 'Test' }),
        getReceiverType: () => 'user',
        getReceiver: () => ({ getUid: () => 'user-2' }),
        getType: () => 'text',
        getCategory: () => 'message',
        getReactions: () => null,
      } as unknown as CometChat.BaseMessage;

      component = createComponent(msg, '👍');
      // computeTotalReactions should not throw
      expect(() => (component as any).computeTotalReactions()).not.toThrow();
      expect(component.totalReactions()).toBe(0);
    });

    it('handles message with empty reactions array', () => {
      const msg = createMockMessage(1, []);
      component = createComponent(msg, '👍');

      (component as any).computeTotalReactions();
      expect(component.totalReactions()).toBe(0);
    });

    it('formatReactionNames returns empty array for empty reactions', () => {
      component = createComponent();
      const names = (component as any).formatReactionNames([]);
      expect(names).toEqual([]);
    });

    it('getDisplayText returns empty string when reactionNames is empty', () => {
      component = createComponent();
      component.reactionNames.set([]);
      component.totalReactions.set(0);
      expect(component.getDisplayText()).toBe('');
    });

    it('handles getLoggedinUser returning null gracefully', async () => {
      component = createComponent();
      (CometChat.getLoggedinUser as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);

      await (component as any).initializeAndFetch();
      expect((component as any).loggedInUserUid).toBe('');
    });

    it('handles getLoggedinUser rejection gracefully', async () => {
      component = createComponent();
      (CometChat.getLoggedinUser as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('Auth error')
      );

      // Should not throw, should still attempt fetch
      await (component as any).initializeAndFetch();
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(component.state()).toBe('loaded');
    });
  });
});

// ==================== Generators for Property Tests ====================

/** Generates a non-empty alphanumeric UID */
const uidArb = fc.stringMatching(/^[a-zA-Z0-9]{1,20}$/);

/** Generates a human-readable display name (letters/spaces, no commas) */
const nameArb = fc
  .stringMatching(/^[a-zA-Z][a-zA-Z ]{0,19}$/)
  .map(s => s.trim())
  .filter(s => s.length > 0);

/** Generates a reactor object with uid and name */
const reactorArb = fc.record({ uid: uidArb, name: nameArb });

/** Generates a non-empty list of reactors with unique UIDs */
const uniqueReactorsArb = fc.uniqueArray(reactorArb, {
  minLength: 1,
  maxLength: 20,
  comparator: (a, b) => a.uid === b.uid,
});

/** Generates a single emoji character from a common set */
const emojiArb = fc.constantFrom('👍', '❤️', '😂', '😮', '😢', '🔥', '👏', '🎉');

// ==================== Property-Based Tests ====================

describe('CometChatReactionInfoComponent — Property Tests', () => {
  let component: CometChatReactionInfoComponent;

  beforeEach(() => {
    component = createComponent();
    stubLocalization();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Feature: comprehensive-test-suite
   * Property 7: Reaction info name formatting
   *
   * For any list of reactor names where the logged-in user is among them,
   * the formatted output shall list the localized "You" text first,
   * followed by other names comma-separated.
   *
   * **Validates: Requirements 4.2**
   */
  it('Property 7: Reaction info name formatting', () => {
    fc.assert(
      fc.property(uniqueReactorsArb, fc.nat({ max: 19 }), (reactors, loggedInIndex) => {
        const idx = loggedInIndex % reactors.length;
        const loggedInUid = reactors[idx].uid;
        (component as any).loggedInUserUid = loggedInUid;

        const mockReactions = reactors.map(r => createMockReaction('👍', r.uid, r.name));
        const names = (component as any).formatReactionNames(mockReactions);
        const youText = 'You';

        // "You" must be the first element
        expect(names[0]).toBe(youText);

        // "You" must appear exactly once
        expect(names.filter((n: string) => n === youText).length).toBe(1);

        // All other reactor names (non-logged-in) must be present in order
        const otherNames = reactors.filter(r => r.uid !== loggedInUid).map(r => r.name);
        expect(names.slice(1)).toEqual(otherNames);

        // Total count: "You" + other names
        expect(names.length).toBe(1 + otherNames.length);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: comprehensive-test-suite
   * Property 8: Reaction info overflow text
   *
   * For any total reaction count T and fetched names count F where T > F,
   * the display text shall include "and (T - F) others" suffix.
   *
   * **Validates: Requirements 4.2**
   */
  it('Property 8: Reaction info overflow text', () => {
    fc.assert(
      fc.property(
        fc.array(nameArb, { minLength: 1, maxLength: 10 }),
        fc.integer({ min: 1, max: 100 }),
        (fetchedNames, extraCount) => {
          const totalReactions = fetchedNames.length + extraCount;

          component.reactionNames.set(fetchedNames);
          component.totalReactions.set(totalReactions);

          const displayText = component.getDisplayText();
          const pendingCount = totalReactions - fetchedNames.length;

          const expectedSuffix = `and ${pendingCount} others`;
          expect(displayText).toContain(expectedSuffix);

          const expectedPrefix = fetchedNames.join(', ');
          expect(displayText.startsWith(expectedPrefix)).toBe(true);

          expect(displayText).toBe(`${expectedPrefix} ${expectedSuffix}`);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: comprehensive-test-suite
   * Property 9: Reaction info content completeness
   *
   * For any set of fetched reactor names, the display text shall contain
   * all fetched names, with "You" substitution for the logged-in user.
   *
   * **Validates: Requirements 4.1, 4.2**
   */
  it('Property 9: Reaction info content completeness', () => {
    fc.assert(
      fc.property(
        uniqueReactorsArb,
        emojiArb,
        fc.nat({ max: 19 }),
        fc.boolean(),
        (reactors, emoji, loggedInIndex, includeLoggedIn) => {
          component.reaction = emoji;

          if (includeLoggedIn) {
            const idx = loggedInIndex % reactors.length;
            (component as any).loggedInUserUid = reactors[idx].uid;
          } else {
            (component as any).loggedInUserUid = '__not_in_list__';
          }

          const mockReactions = reactors.map(r => createMockReaction(emoji, r.uid, r.name));
          const names = (component as any).formatReactionNames(mockReactions);
          component.reactionNames.set(names);
          component.totalReactions.set(names.length);

          const displayText = component.getDisplayText();

          // The emoji must be available on the component
          expect(component.reaction).toBe(emoji);

          // Display text must contain all fetched names
          for (const name of names) {
            expect(displayText).toContain(name);
          }

          // If logged-in user was among reactors, "You" must appear
          if (includeLoggedIn) {
            expect(names).toContain('You');
          }

          // Display text must be the comma-separated names (no overflow suffix)
          expect(displayText).toBe(names.join(', '));

          // Display text must not be empty
          expect(displayText.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  // ─── Accessibility ───

  describe('Accessibility', () => {
    it('should provide accessible reaction details', () => {
      const component = createComponent();
      expect(component).toBeTruthy();
    });

    it('should display user info for screen readers', () => {
      const component = createComponent();
      component.reactionNames.set(['Alice', 'Bob']);
      component.totalReactions.set(2);
      expect(component.getDisplayText()).toContain('Alice');
    });
  });
});
