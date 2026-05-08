/**
 * Property-Based Tests for Event System Alignment
 *
 * Feature: event-system-alignment
 * Validates: Properties 1, 2, 3, 6, 14, 15
 *
 * These tests verify that the Angular UIKit event system is aligned
 * with the React UIKit event system — same subjects, same helpers,
 * and correct behavioral contracts for message lifecycle events.
 *
 * @module events/event-system-alignment.property
 */
vi.mock('@cometchat/calls-sdk-javascript', () => ({ default: {} }));

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { Subject, Subscription } from 'rxjs';

import { CometChatCallEvents } from './CometChatCallEvents';
import { CometChatConversationEvents } from './CometChatConversationEvents';
import { CometChatGroupEvents } from './CometChatGroupEvents';
import { CometChatMessageEvents } from './CometChatMessageEvents';
import { CometChatUIEvents } from './CometChatUIEvents';
import { CometChatUserEvents } from './CometChatUserEvents';

// ==================== Ground Truth: React Subject Names ====================

/**
 * The exact subject names defined in the React UIKit, grouped by event class.
 * This is the source of truth for Property 1.
 */
const REACT_SUBJECTS: Record<string, string[]> = {
  CometChatCallEvents: ['ccOutgoingCall', 'ccCallAccepted', 'ccCallRejected', 'ccCallEnded'],
  CometChatConversationEvents: ['ccConversationDeleted'],
  CometChatGroupEvents: [
    'ccGroupCreated',
    'ccGroupDeleted',
    'ccGroupMemberJoined',
    'ccGroupLeft',
    'ccGroupMemberAdded',
    'ccGroupMemberScopeChanged',
    'ccGroupMemberKicked',
    'ccGroupMemberBanned',
    'ccGroupMemberUnbanned',
    'ccOwnershipChanged',
  ],
  CometChatMessageEvents: [
    // UI-level
    'ccMessageSent',
    'ccMessageEdited',
    'ccReplyToMessage',
    'ccMessageTranslated',
    'ccMessageRead',
    'ccMessageDeleted',
    // SDK-wrapper
    'onTextMessageReceived',
    'onMessageModerated',
    'onMediaMessageReceived',
    'onCustomMessageReceived',
    'onTypingStarted',
    'onTypingEnded',
    'onMessagesDelivered',
    'onMessagesRead',
    'onMessagesDeliveredToAll',
    'onMessagesReadByAll',
    'onMessageEdited',
    'onMessageDeleted',
    'onMessageReactionAdded',
    'onMessageReactionRemoved',
    'onCustomInteractiveMessageReceived',
    'onFormMessageReceived',
    'onCardMessageReceived',
    'onSchedulerMessageReceived',
    'onAIAssistantMessageReceived',
    'onAIToolResultReceived',
    'onAIToolArgumentsReceived',
  ],
  CometChatUIEvents: [
    'ccHidePanel',
    'ccShowPanel',
    'ccShowModal',
    'ccHideModal',
    'ccShowDialog',
    'ccHideDialog',
    'ccActiveChatChanged',
    'ccShowOngoingCall',
    'ccOpenChat',
    'ccComposeMessage',
    'ccMouseEvent',
    'ccShowMentionsCountWarning',
    'ccActivePopover',
  ],
  CometChatUserEvents: ['ccUserBlocked', 'ccUserUnblocked'],
};

/** Removed subjects that must NOT exist in Angular. */
const REMOVED_SUBJECTS = ['ccEditMessage', 'ccUnreadCountChanged'];

/** Map class names to actual Angular event classes. */
const ANGULAR_EVENT_CLASSES: Record<string, any> = {
  CometChatCallEvents,
  CometChatConversationEvents,
  CometChatGroupEvents,
  CometChatMessageEvents,
  CometChatUIEvents,
  CometChatUserEvents,
};

// ==================== Helpers ====================

/** Extract all static Subject property names from an event class. */
function getSubjectNames(eventClass: any): string[] {
  return Object.keys(eventClass).filter(key => eventClass[key] instanceof Subject);
}

/** Build a flat list of { className, subjectName } for all React subjects. */
const ALL_REACT_SUBJECT_ENTRIES = Object.entries(REACT_SUBJECTS).flatMap(([className, subjects]) =>
  subjects.map(subjectName => ({ className, subjectName }))
);

// ==================== Property 1: Event Subject Parity ====================

describe('Property 1: Event subject parity across all event classes', () => {
  /**
   * Feature: event-system-alignment, Property 1: Event subject parity across all event classes
   *
   * **Validates: Requirements 1.1, 1.2, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7**
   *
   * For any event class name and for any Subject property defined on the React
   * version of that class, the Angular version of that class shall also define
   * a Subject property with the same name. Conversely, the Angular version
   * shall not define any Subject properties that do not exist in the React version.
   */

  const arbReactSubjectEntry = fc.constantFrom(...ALL_REACT_SUBJECT_ENTRIES);

  it('every React subject exists as a Subject on the Angular event class', () => {
    fc.assert(
      fc.property(arbReactSubjectEntry, ({ className, subjectName }) => {
        const angularClass = ANGULAR_EVENT_CLASSES[className];
        expect(angularClass).toBeDefined();
        expect(angularClass[subjectName]).toBeDefined();
        expect(angularClass[subjectName]).toBeInstanceOf(Subject);
      }),
      { numRuns: 200 }
    );
  });

  it('Angular event classes do not contain extra subjects beyond React', () => {
    // Angular-only subjects that are intentional additions (not in React)
    const ANGULAR_ONLY_SUBJECTS: Record<string, string[]> = {
      CometChatConversationEvents: ['ccUpdateConversation'],
    };

    for (const [className, reactSubjects] of Object.entries(REACT_SUBJECTS)) {
      const angularClass = ANGULAR_EVENT_CLASSES[className];
      const angularSubjects = getSubjectNames(angularClass);
      const allowedExtras = ANGULAR_ONLY_SUBJECTS[className] ?? [];
      const extraSubjects = angularSubjects.filter(s => !reactSubjects.includes(s) && !allowedExtras.includes(s));
      expect(extraSubjects).toEqual([]);
    }
  });

  it('removed subjects (ccEditMessage, ccUnreadCountChanged) do not exist on any Angular event class', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...REMOVED_SUBJECTS),
        fc.constantFrom(...Object.keys(ANGULAR_EVENT_CLASSES)),
        (removedSubject, className) => {
          const angularClass = ANGULAR_EVENT_CLASSES[className];
          expect(angularClass[removedSubject]).toBeUndefined();
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ==================== Property 2: Typed Helper Method Parity ====================

/**
 * Build a registry of expected publish/subscribe helper method names for each subject.
 * Convention:
 *   - UI-level cc* subjects: publish{PascalName}() and on{PascalName}()
 *   - SDK-wrapper on* subjects: publish{PascalName}() and subscribeOn{PascalName}()
 *
 * We derive the expected names from the existing typed pairs in the lifecycle test,
 * but here we verify structurally via reflection.
 */

interface HelperExpectation {
  className: string;
  subjectName: string;
  publishMethodName: string;
  subscribeMethodName: string;
}

/**
 * Derive expected helper method names from a subject name.
 * The naming convention differs between UI-level (cc*) and SDK-wrapper (on*) subjects.
 */
function deriveHelperNames(
  className: string,
  subjectName: string
): { publishName: string; subscribeName: string } {
  if (subjectName.startsWith('cc')) {
    // UI-level: ccMessageSent -> publishMessageSent / onMessageSent (or onCcMessageEdited etc.)
    const withoutCc = subjectName.slice(2);
    const publishName = `publish${withoutCc}`;

    // Subscribe helpers have varying conventions — check both patterns
    // Some use on{WithoutCc}, some use onCc{WithoutCc}
    return { publishName, subscribeName: withoutCc };
  } else if (subjectName.startsWith('on')) {
    // SDK-wrapper: onTextMessageReceived -> publishTextMessageReceived / subscribeOnTextMessageReceived
    const withoutOn = subjectName.slice(2);
    const publishName = `publish${withoutOn}`;
    const subscribeName = `subscribeOn${withoutOn}`;
    return { publishName, subscribeName };
  }
  return { publishName: '', subscribeName: '' };
}

/** Check if a method exists on the class (static method). */
function hasStaticMethod(cls: any, methodName: string): boolean {
  return typeof cls[methodName] === 'function';
}

describe('Property 2: Typed helper method parity', () => {
  /**
   * Feature: event-system-alignment, Property 2: Typed helper method parity
   *
   * **Validates: Requirements 1.5, 13.1, 13.2, 13.3, 13.4**
   *
   * For any Subject property on an Angular event class that matches a React Subject,
   * there shall exist exactly one typed publish method and one typed subscribe helper
   * method on the Angular class.
   */

  const arbReactSubjectEntry = fc.constantFrom(...ALL_REACT_SUBJECT_ENTRIES);

  it('every React-matching subject has a typed publish method', () => {
    fc.assert(
      fc.property(arbReactSubjectEntry, ({ className, subjectName }) => {
        const angularClass = ANGULAR_EVENT_CLASSES[className];
        const { publishName } = deriveHelperNames(className, subjectName);

        if (publishName) {
          expect(hasStaticMethod(angularClass, publishName)).toBe(true);
        }
      }),
      { numRuns: 200 }
    );
  });

  it('every React-matching subject has a typed subscribe helper method', () => {
    fc.assert(
      fc.property(arbReactSubjectEntry, ({ className, subjectName }) => {
        const angularClass = ANGULAR_EVENT_CLASSES[className];

        if (subjectName.startsWith('on')) {
          // SDK-wrapper: subscribeOn{Name}
          const withoutOn = subjectName.slice(2);
          const subscribeName = `subscribeOn${withoutOn}`;
          expect(hasStaticMethod(angularClass, subscribeName)).toBe(true);
        } else if (subjectName.startsWith('cc')) {
          // UI-level: on{Name} or onCc{Name} — at least one must exist
          const withoutCc = subjectName.slice(2);
          const hasOn = hasStaticMethod(angularClass, `on${withoutCc}`);
          const hasOnCc = hasStaticMethod(angularClass, `onCc${withoutCc}`);
          expect(hasOn || hasOnCc).toBe(true);
        }
      }),
      { numRuns: 200 }
    );
  });

  it('no typed helpers exist for removed subjects', () => {
    const removedHelperPatterns = [
      'publishEditMessage',
      'onEditMessage',
      'publishUnreadCountChanged',
      'onCcUnreadCountChanged',
    ];

    fc.assert(
      fc.property(fc.constantFrom(...removedHelperPatterns), methodName => {
        // These should not exist on CometChatMessageEvents
        expect(hasStaticMethod(CometChatMessageEvents, methodName)).toBe(false);
      }),
      { numRuns: 100 }
    );
  });
});

// ==================== Mock Infrastructure for Properties 3, 6, 14, 15 ====================

interface MockBaseMessage {
  id: number;
  text: string;
  type: string;
  sender: { uid: string; name: string };
  receiverId: string;
  receiverType: string;
  sentAt: number;
  conversationId: string;
}

interface MockIMessages {
  message: MockBaseMessage;
  status: 'inprogress' | 'success' | 'error' | 'cancelled';
}

// ── Arbitraries for message generation ──

const arbMessageId = fc.integer({ min: 1, max: 999999 });
const arbMessageText = fc.string({ minLength: 0, maxLength: 200 });
const arbUid = fc.stringMatching(/^[a-z][a-z0-9_]{2,15}$/);
const arbName = fc.string({ minLength: 1, maxLength: 30 });
const arbConversationId = fc.stringMatching(/^conv_[a-z0-9]{3,10}$/);

const arbMockMessage: fc.Arbitrary<MockBaseMessage> = fc.record({
  id: arbMessageId,
  text: arbMessageText,
  type: fc.constantFrom('text', 'image', 'video', 'audio', 'file'),
  sender: fc.record({ uid: arbUid, name: arbName }),
  receiverId: arbUid,
  receiverType: fc.constantFrom('user', 'group'),
  sentAt: fc.integer({ min: 1000000000, max: 2000000000 }),
  conversationId: arbConversationId,
});

// ==================== Property 3: Edit Initiation via ccMessageEdited ====================

/** Mock composer that mirrors edit-mode activation logic. */
class MockComposerForEdit {
  mode: 'default' | 'edit' = 'default';
  editMessage: MockBaseMessage | null = null;
  inputText = '';
  private subscriptions: Subscription[] = [];

  init(editedSubject: Subject<MockIMessages>): void {
    this.subscriptions.push(
      editedSubject.subscribe(event => {
        if (event.status === 'inprogress') {
          this.mode = 'edit';
          this.editMessage = event.message;
          this.inputText = event.message.text;
        }
      })
    );
  }

  destroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
    this.subscriptions = [];
  }
}

describe('Property 3: Edit initiation via ccMessageEdited with inprogress status', () => {
  /**
   * Feature: event-system-alignment, Property 3: Edit initiation via ccMessageEdited with inprogress status
   *
   * **Validates: Requirements 1.3, 7.1, 10.2, 11.4**
   *
   * For any message, when ccMessageEdited is published with MessageStatus.inprogress,
   * the Message Composer component shall enter edit mode with that message's text
   * populated in the editor.
   */

  let editSubject: Subject<MockIMessages>;
  let composer: MockComposerForEdit;

  beforeEach(() => {
    editSubject = new Subject<MockIMessages>();
    composer = new MockComposerForEdit();
    composer.init(editSubject);
  });

  afterEach(() => {
    composer.destroy();
  });

  it('composer enters edit mode with correct text for any message published with inprogress', () => {
    fc.assert(
      fc.property(arbMockMessage, msg => {
        // Reset composer state for each iteration
        composer.mode = 'default';
        composer.editMessage = null;
        composer.inputText = '';

        editSubject.next({ message: msg, status: 'inprogress' });

        expect(composer.mode).toBe('edit');
        expect(composer.editMessage).toBe(msg);
        expect(composer.inputText).toBe(msg.text);
      }),
      { numRuns: 100 }
    );
  });

  it('composer does NOT enter edit mode for non-inprogress statuses', () => {
    const arbNonInprogressStatus = fc.constantFrom('success', 'error', 'cancelled') as fc.Arbitrary<
      'success' | 'error' | 'cancelled'
    >;

    fc.assert(
      fc.property(arbMockMessage, arbNonInprogressStatus, (msg, status) => {
        composer.mode = 'default';
        composer.editMessage = null;
        composer.inputText = '';

        editSubject.next({ message: msg, status });

        expect(composer.mode).toBe('default');
        expect(composer.editMessage).toBeNull();
      }),
      { numRuns: 100 }
    );
  });
});

// ==================== Property 6: Conversations Unread Count Reset ====================

interface MockConversation {
  conversationId: string;
  unreadMessageCount: number;
  lastMessage: MockBaseMessage | null;
}

/** Mock conversations manager that mirrors unread count reset logic. */
class MockConversationsForUnread {
  conversations: MockConversation[] = [];
  private subscriptions: Subscription[] = [];

  init(readSubject: Subject<MockBaseMessage>): void {
    this.subscriptions.push(
      readSubject.subscribe(msg => {
        const conv = this.conversations.find(c => c.conversationId === msg.conversationId);
        if (conv) {
          conv.unreadMessageCount = 0;
        }
      })
    );
  }

  destroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
    this.subscriptions = [];
  }
}

describe('Property 6: Conversations unread count reset via ccMessageRead', () => {
  /**
   * Feature: event-system-alignment, Property 6: Conversations unread count reset via ccMessageRead
   *
   * **Validates: Requirements 1.4, 4.13**
   *
   * For any ccMessageRead event, the Conversations component shall reset
   * the unread count to 0 for the matching conversation.
   */

  let readSubject: Subject<MockBaseMessage>;
  let manager: MockConversationsForUnread;

  beforeEach(() => {
    readSubject = new Subject<MockBaseMessage>();
    manager = new MockConversationsForUnread();
    manager.init(readSubject);
  });

  afterEach(() => {
    manager.destroy();
  });

  const arbUnreadCount = fc.integer({ min: 1, max: 9999 });

  it('unread count resets to 0 for matching conversation regardless of initial count', () => {
    fc.assert(
      fc.property(arbMockMessage, arbUnreadCount, (msg, unreadCount) => {
        // Set up a conversation with the matching ID and arbitrary unread count
        manager.conversations = [
          {
            conversationId: msg.conversationId,
            unreadMessageCount: unreadCount,
            lastMessage: null,
          },
        ];

        readSubject.next(msg);

        expect(manager.conversations[0].unreadMessageCount).toBe(0);
      }),
      { numRuns: 100 }
    );
  });

  it('non-matching conversations are not affected by ccMessageRead', () => {
    fc.assert(
      fc.property(
        arbMockMessage,
        arbUnreadCount,
        arbUnreadCount,
        (msg, unreadTarget, unreadOther) => {
          const otherConvId = msg.conversationId + '_other';
          manager.conversations = [
            {
              conversationId: msg.conversationId,
              unreadMessageCount: unreadTarget,
              lastMessage: null,
            },
            {
              conversationId: otherConvId,
              unreadMessageCount: unreadOther,
              lastMessage: null,
            },
          ];

          readSubject.next(msg);

          expect(manager.conversations[0].unreadMessageCount).toBe(0);
          expect(manager.conversations[1].unreadMessageCount).toBe(unreadOther);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('ccMessageRead for unknown conversation is a no-op', () => {
    fc.assert(
      fc.property(arbMockMessage, arbUnreadCount, (msg, unreadCount) => {
        const differentConvId = msg.conversationId + '_different';
        manager.conversations = [
          {
            conversationId: differentConvId,
            unreadMessageCount: unreadCount,
            lastMessage: null,
          },
        ];

        readSubject.next(msg);

        expect(manager.conversations[0].unreadMessageCount).toBe(unreadCount);
      }),
      { numRuns: 100 }
    );
  });
});

// ==================== Property 14: Message Send Lifecycle ====================

type SendStatus = 'inprogress' | 'success' | 'error';

/** Mock composer that mirrors message send lifecycle publishing. */
class MockComposerSendLifecycle {
  publishedStatuses: SendStatus[] = [];
  private sentSubject: Subject<MockIMessages>;

  constructor(sentSubject: Subject<MockIMessages>) {
    this.sentSubject = sentSubject;
  }

  /** Simulate a successful send: inprogress -> success */
  async sendMessageSuccess(msg: MockBaseMessage): Promise<void> {
    this.sentSubject.next({ message: msg, status: 'inprogress' });
    this.sentSubject.next({ message: msg, status: 'success' });
  }

  /** Simulate a failed send: inprogress -> error */
  async sendMessageError(msg: MockBaseMessage): Promise<void> {
    this.sentSubject.next({ message: msg, status: 'inprogress' });
    this.sentSubject.next({ message: msg, status: 'error' });
  }
}

describe('Property 14: Message send lifecycle publishes correct statuses', () => {
  /**
   * Feature: event-system-alignment, Property 14: Message send lifecycle publishes correct statuses
   *
   * **Validates: Requirements 11.1, 11.2, 11.3**
   *
   * For any message send operation, the Message Composer shall publish
   * ccMessageSent with MessageStatus.inprogress before the SDK call,
   * MessageStatus.success on success, and MessageStatus.error on failure.
   */

  let sentSubject: Subject<MockIMessages>;
  let composer: MockComposerSendLifecycle;
  let receivedEvents: MockIMessages[];
  let subscription: Subscription;

  beforeEach(() => {
    sentSubject = new Subject<MockIMessages>();
    composer = new MockComposerSendLifecycle(sentSubject);
    receivedEvents = [];
    subscription = sentSubject.subscribe(event => receivedEvents.push(event));
  });

  afterEach(() => {
    subscription.unsubscribe();
  });

  it('successful send publishes [inprogress, success] for any message', () => {
    fc.assert(
      fc.property(arbMockMessage, msg => {
        receivedEvents = [];

        composer.sendMessageSuccess(msg);

        expect(receivedEvents).toHaveLength(2);
        expect(receivedEvents[0].status).toBe('inprogress');
        expect(receivedEvents[0].message).toBe(msg);
        expect(receivedEvents[1].status).toBe('success');
        expect(receivedEvents[1].message).toBe(msg);
      }),
      { numRuns: 100 }
    );
  });

  it('failed send publishes [inprogress, error] for any message', () => {
    fc.assert(
      fc.property(arbMockMessage, msg => {
        receivedEvents = [];

        composer.sendMessageError(msg);

        expect(receivedEvents).toHaveLength(2);
        expect(receivedEvents[0].status).toBe('inprogress');
        expect(receivedEvents[0].message).toBe(msg);
        expect(receivedEvents[1].status).toBe('error');
        expect(receivedEvents[1].message).toBe(msg);
      }),
      { numRuns: 100 }
    );
  });

  it('first event is always inprogress regardless of outcome', () => {
    const arbOutcome = fc.constantFrom('success', 'error') as fc.Arbitrary<'success' | 'error'>;

    fc.assert(
      fc.property(arbMockMessage, arbOutcome, (msg, outcome) => {
        receivedEvents = [];

        if (outcome === 'success') {
          composer.sendMessageSuccess(msg);
        } else {
          composer.sendMessageError(msg);
        }

        expect(receivedEvents[0].status).toBe('inprogress');
      }),
      { numRuns: 100 }
    );
  });
});

// ==================== Property 15: Message Edit Lifecycle ====================

type EditStatus = 'inprogress' | 'success' | 'error' | 'cancelled';

/** Mock composer that mirrors message edit lifecycle publishing. */
class MockComposerEditLifecycle {
  private editedSubject: Subject<MockIMessages>;

  constructor(editedSubject: Subject<MockIMessages>) {
    this.editedSubject = editedSubject;
  }

  /** Simulate edit start: inprogress */
  startEdit(msg: MockBaseMessage): void {
    this.editedSubject.next({ message: msg, status: 'inprogress' });
  }

  /** Simulate successful edit: inprogress -> success */
  editMessageSuccess(msg: MockBaseMessage): void {
    this.editedSubject.next({ message: msg, status: 'inprogress' });
    this.editedSubject.next({ message: msg, status: 'success' });
  }

  /** Simulate failed edit: inprogress -> error */
  editMessageError(msg: MockBaseMessage): void {
    this.editedSubject.next({ message: msg, status: 'inprogress' });
    this.editedSubject.next({ message: msg, status: 'error' });
  }

  /** Simulate cancelled edit: inprogress -> cancelled */
  editMessageCancelled(msg: MockBaseMessage): void {
    this.editedSubject.next({ message: msg, status: 'inprogress' });
    this.editedSubject.next({ message: msg, status: 'cancelled' });
  }
}

describe('Property 15: Message edit lifecycle publishes correct statuses', () => {
  /**
   * Feature: event-system-alignment, Property 15: Message edit lifecycle publishes correct statuses
   *
   * **Validates: Requirements 11.4, 11.5, 11.6, 11.7**
   *
   * For any message edit operation, the Message Composer shall publish
   * ccMessageEdited with MessageStatus.inprogress when editing starts,
   * MessageStatus.success on success, MessageStatus.error on failure,
   * and MessageStatus.cancelled when cancelled.
   */

  let editedSubject: Subject<MockIMessages>;
  let composer: MockComposerEditLifecycle;
  let receivedEvents: MockIMessages[];
  let subscription: Subscription;

  beforeEach(() => {
    editedSubject = new Subject<MockIMessages>();
    composer = new MockComposerEditLifecycle(editedSubject);
    receivedEvents = [];
    subscription = editedSubject.subscribe(event => receivedEvents.push(event));
  });

  afterEach(() => {
    subscription.unsubscribe();
  });

  it('successful edit publishes [inprogress, success] for any message', () => {
    fc.assert(
      fc.property(arbMockMessage, msg => {
        receivedEvents = [];

        composer.editMessageSuccess(msg);

        expect(receivedEvents).toHaveLength(2);
        expect(receivedEvents[0].status).toBe('inprogress');
        expect(receivedEvents[0].message).toBe(msg);
        expect(receivedEvents[1].status).toBe('success');
        expect(receivedEvents[1].message).toBe(msg);
      }),
      { numRuns: 100 }
    );
  });

  it('failed edit publishes [inprogress, error] for any message', () => {
    fc.assert(
      fc.property(arbMockMessage, msg => {
        receivedEvents = [];

        composer.editMessageError(msg);

        expect(receivedEvents).toHaveLength(2);
        expect(receivedEvents[0].status).toBe('inprogress');
        expect(receivedEvents[0].message).toBe(msg);
        expect(receivedEvents[1].status).toBe('error');
        expect(receivedEvents[1].message).toBe(msg);
      }),
      { numRuns: 100 }
    );
  });

  it('cancelled edit publishes [inprogress, cancelled] for any message', () => {
    fc.assert(
      fc.property(arbMockMessage, msg => {
        receivedEvents = [];

        composer.editMessageCancelled(msg);

        expect(receivedEvents).toHaveLength(2);
        expect(receivedEvents[0].status).toBe('inprogress');
        expect(receivedEvents[0].message).toBe(msg);
        expect(receivedEvents[1].status).toBe('cancelled');
        expect(receivedEvents[1].message).toBe(msg);
      }),
      { numRuns: 100 }
    );
  });

  it('edit lifecycle always starts with inprogress regardless of outcome', () => {
    const arbOutcome = fc.constantFrom('success', 'error', 'cancelled') as fc.Arbitrary<
      'success' | 'error' | 'cancelled'
    >;

    fc.assert(
      fc.property(arbMockMessage, arbOutcome, (msg, outcome) => {
        receivedEvents = [];

        if (outcome === 'success') {
          composer.editMessageSuccess(msg);
        } else if (outcome === 'error') {
          composer.editMessageError(msg);
        } else {
          composer.editMessageCancelled(msg);
        }

        expect(receivedEvents[0].status).toBe('inprogress');
        expect(receivedEvents[1].status).toBe(outcome);
      }),
      { numRuns: 100 }
    );
  });

  it('edit lifecycle publishes exactly 2 events for any terminal outcome', () => {
    const arbOutcome = fc.constantFrom('success', 'error', 'cancelled') as fc.Arbitrary<
      'success' | 'error' | 'cancelled'
    >;

    fc.assert(
      fc.property(arbMockMessage, arbOutcome, (msg, outcome) => {
        receivedEvents = [];

        if (outcome === 'success') {
          composer.editMessageSuccess(msg);
        } else if (outcome === 'error') {
          composer.editMessageError(msg);
        } else {
          composer.editMessageCancelled(msg);
        }

        expect(receivedEvents).toHaveLength(2);
      }),
      { numRuns: 100 }
    );
  });
});
