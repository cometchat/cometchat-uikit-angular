/**
 * Property-Based Tests for Event Subscription Fan-Out
 *
 * Categories: Property-Based Fan-Out Invariants, Multi-Subscriber Delivery
 * Validates: Requirements 12.3, 7.1, 7.3
 *
 * Property 3: Event Subscription Fan-Out
 * For any event Subject and any positive integer N, subscribing N times
 * and emitting once delivers exactly N callbacks.
 *
 * @module events/event-subscription-lifecycle.property
 */
vi.mock('@cometchat/calls-sdk-javascript', () => ({ default: {} }));

import { vi, describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { Subject, Subscription } from 'rxjs';
import { ensureSdkReady, sdkCleanup } from '../test-setup';

import { CometChatCallEvents } from './CometChatCallEvents';
import { CometChatConversationEvents } from './CometChatConversationEvents';
import { CometChatGroupEvents } from './CometChatGroupEvents';
import { CometChatMessageEvents } from './CometChatMessageEvents';
import { CometChatUIEvents } from './CometChatUIEvents';
import { CometChatUserEvents } from './CometChatUserEvents';

// ==================== Typed Publish/Subscribe Pair Registry ====================

interface TypedPairDescriptor {
  className: string;
  name: string;
  publishFn: (payload: any) => void;
  subscribeFn: (cb: (data: any) => void) => Subscription;
}

const ALL_TYPED_PAIRS: TypedPairDescriptor[] = [
  // CometChatCallEvents
  {
    className: 'CometChatCallEvents',
    name: 'OutgoingCall',
    publishFn: p => CometChatCallEvents.publishOutgoingCall(p),
    subscribeFn: cb => CometChatCallEvents.onOutgoingCall(cb),
  },
  {
    className: 'CometChatCallEvents',
    name: 'CallAccepted',
    publishFn: p => CometChatCallEvents.publishCallAccepted(p),
    subscribeFn: cb => CometChatCallEvents.onCallAccepted(cb),
  },
  {
    className: 'CometChatCallEvents',
    name: 'CallRejected',
    publishFn: p => CometChatCallEvents.publishCallRejected(p),
    subscribeFn: cb => CometChatCallEvents.onCallRejected(cb),
  },
  {
    className: 'CometChatCallEvents',
    name: 'CallEnded',
    publishFn: p => CometChatCallEvents.publishCallEnded(p),
    subscribeFn: cb => CometChatCallEvents.onCallEnded(cb),
  },
  // CometChatConversationEvents
  {
    className: 'CometChatConversationEvents',
    name: 'ConversationDeleted',
    publishFn: p => CometChatConversationEvents.publishConversationDeleted(p),
    subscribeFn: cb => CometChatConversationEvents.onConversationDeleted(cb),
  },
  // CometChatGroupEvents
  {
    className: 'CometChatGroupEvents',
    name: 'GroupCreated',
    publishFn: p => CometChatGroupEvents.publishGroupCreated(p),
    subscribeFn: cb => CometChatGroupEvents.onGroupCreated(cb),
  },
  {
    className: 'CometChatGroupEvents',
    name: 'GroupDeleted',
    publishFn: p => CometChatGroupEvents.publishGroupDeleted(p),
    subscribeFn: cb => CometChatGroupEvents.onGroupDeleted(cb),
  },
  {
    className: 'CometChatGroupEvents',
    name: 'GroupMemberJoined',
    publishFn: p => CometChatGroupEvents.publishGroupMemberJoined(p),
    subscribeFn: cb => CometChatGroupEvents.onGroupMemberJoined(cb),
  },
  {
    className: 'CometChatGroupEvents',
    name: 'GroupLeft',
    publishFn: p => CometChatGroupEvents.publishGroupLeft(p),
    subscribeFn: cb => CometChatGroupEvents.onGroupLeft(cb),
  },
  {
    className: 'CometChatGroupEvents',
    name: 'GroupMemberAdded',
    publishFn: p => CometChatGroupEvents.publishGroupMemberAdded(p),
    subscribeFn: cb => CometChatGroupEvents.onGroupMemberAdded(cb),
  },
  {
    className: 'CometChatGroupEvents',
    name: 'GroupMemberScopeChanged',
    publishFn: p => CometChatGroupEvents.publishGroupMemberScopeChanged(p),
    subscribeFn: cb => CometChatGroupEvents.onGroupMemberScopeChanged(cb),
  },
  {
    className: 'CometChatGroupEvents',
    name: 'GroupMemberKicked',
    publishFn: p => CometChatGroupEvents.publishGroupMemberKicked(p),
    subscribeFn: cb => CometChatGroupEvents.onGroupMemberKicked(cb),
  },
  {
    className: 'CometChatGroupEvents',
    name: 'GroupMemberBanned',
    publishFn: p => CometChatGroupEvents.publishGroupMemberBanned(p),
    subscribeFn: cb => CometChatGroupEvents.onGroupMemberBanned(cb),
  },
  {
    className: 'CometChatGroupEvents',
    name: 'GroupMemberUnbanned',
    publishFn: p => CometChatGroupEvents.publishGroupMemberUnbanned(p),
    subscribeFn: cb => CometChatGroupEvents.onGroupMemberUnbanned(cb),
  },
  {
    className: 'CometChatGroupEvents',
    name: 'OwnershipChanged',
    publishFn: p => CometChatGroupEvents.publishOwnershipChanged(p),
    subscribeFn: cb => CometChatGroupEvents.onOwnershipChanged(cb),
  },
  // CometChatMessageEvents (UI-level)
  {
    className: 'CometChatMessageEvents',
    name: 'MessageSent',
    publishFn: p => CometChatMessageEvents.publishMessageSent(p),
    subscribeFn: cb => CometChatMessageEvents.onMessageSent(cb),
  },
  {
    className: 'CometChatMessageEvents',
    name: 'CcMessageEdited',
    publishFn: p => CometChatMessageEvents.publishMessageEdited(p),
    subscribeFn: cb => CometChatMessageEvents.onCcMessageEdited(cb),
  },
  {
    className: 'CometChatMessageEvents',
    name: 'ReplyToMessage',
    publishFn: p => CometChatMessageEvents.publishReplyToMessage(p),
    subscribeFn: cb => CometChatMessageEvents.onReplyToMessage(cb),
  },
  {
    className: 'CometChatMessageEvents',
    name: 'MessageTranslated',
    publishFn: p => CometChatMessageEvents.publishMessageTranslated(p),
    subscribeFn: cb => CometChatMessageEvents.onMessageTranslated(cb),
  },
  {
    className: 'CometChatMessageEvents',
    name: 'CcMessageRead',
    publishFn: p => CometChatMessageEvents.publishMessageRead(p),
    subscribeFn: cb => CometChatMessageEvents.onCcMessageRead(cb),
  },
  {
    className: 'CometChatMessageEvents',
    name: 'CcMessageDeleted',
    publishFn: p => CometChatMessageEvents.publishMessageDeleted(p),
    subscribeFn: cb => CometChatMessageEvents.onCcMessageDeleted(cb),
  },
  // CometChatMessageEvents (SDK-wrapper)
  {
    className: 'CometChatMessageEvents',
    name: 'TextMessageReceived',
    publishFn: p => CometChatMessageEvents.publishTextMessageReceived(p),
    subscribeFn: cb => CometChatMessageEvents.subscribeOnTextMessageReceived(cb),
  },
  {
    className: 'CometChatMessageEvents',
    name: 'MediaMessageReceived',
    publishFn: p => CometChatMessageEvents.publishMediaMessageReceived(p),
    subscribeFn: cb => CometChatMessageEvents.subscribeOnMediaMessageReceived(cb),
  },
  {
    className: 'CometChatMessageEvents',
    name: 'CustomMessageReceived',
    publishFn: p => CometChatMessageEvents.publishCustomMessageReceived(p),
    subscribeFn: cb => CometChatMessageEvents.subscribeOnCustomMessageReceived(cb),
  },
  {
    className: 'CometChatMessageEvents',
    name: 'TypingStarted',
    publishFn: p => CometChatMessageEvents.publishTypingStarted(p),
    subscribeFn: cb => CometChatMessageEvents.subscribeOnTypingStarted(cb),
  },
  {
    className: 'CometChatMessageEvents',
    name: 'TypingEnded',
    publishFn: p => CometChatMessageEvents.publishTypingEnded(p),
    subscribeFn: cb => CometChatMessageEvents.subscribeOnTypingEnded(cb),
  },
  {
    className: 'CometChatMessageEvents',
    name: 'MessagesDelivered',
    publishFn: p => CometChatMessageEvents.publishMessagesDelivered(p),
    subscribeFn: cb => CometChatMessageEvents.subscribeOnMessagesDelivered(cb),
  },
  {
    className: 'CometChatMessageEvents',
    name: 'MessagesRead',
    publishFn: p => CometChatMessageEvents.publishMessagesRead(p),
    subscribeFn: cb => CometChatMessageEvents.subscribeOnMessagesRead(cb),
  },
  {
    className: 'CometChatMessageEvents',
    name: 'MessagesDeliveredToAll',
    publishFn: p => CometChatMessageEvents.publishMessagesDeliveredToAll(p),
    subscribeFn: cb => CometChatMessageEvents.subscribeOnMessagesDeliveredToAll(cb),
  },
  {
    className: 'CometChatMessageEvents',
    name: 'MessagesReadByAll',
    publishFn: p => CometChatMessageEvents.publishMessagesReadByAll(p),
    subscribeFn: cb => CometChatMessageEvents.subscribeOnMessagesReadByAll(cb),
  },
  {
    className: 'CometChatMessageEvents',
    name: 'MessageModerated',
    publishFn: p => CometChatMessageEvents.publishMessageModerated(p),
    subscribeFn: cb => CometChatMessageEvents.subscribeOnMessageModerated(cb),
  },
  {
    className: 'CometChatMessageEvents',
    name: 'OnMessageEdited',
    publishFn: p => CometChatMessageEvents.publishOnMessageEdited(p),
    subscribeFn: cb => CometChatMessageEvents.subscribeOnMessageEdited(cb),
  },
  {
    className: 'CometChatMessageEvents',
    name: 'OnMessageDeleted',
    publishFn: p => CometChatMessageEvents.publishOnMessageDeleted(p),
    subscribeFn: cb => CometChatMessageEvents.subscribeOnMessageDeleted(cb),
  },
  {
    className: 'CometChatMessageEvents',
    name: 'MessageReactionAdded',
    publishFn: p => CometChatMessageEvents.publishMessageReactionAdded(p),
    subscribeFn: cb => CometChatMessageEvents.subscribeOnMessageReactionAdded(cb),
  },
  {
    className: 'CometChatMessageEvents',
    name: 'MessageReactionRemoved',
    publishFn: p => CometChatMessageEvents.publishMessageReactionRemoved(p),
    subscribeFn: cb => CometChatMessageEvents.subscribeOnMessageReactionRemoved(cb),
  },
  {
    className: 'CometChatMessageEvents',
    name: 'CustomInteractiveMessageReceived',
    publishFn: p => CometChatMessageEvents.publishCustomInteractiveMessageReceived(p),
    subscribeFn: cb => CometChatMessageEvents.subscribeOnCustomInteractiveMessageReceived(cb),
  },
  {
    className: 'CometChatMessageEvents',
    name: 'FormMessageReceived',
    publishFn: p => CometChatMessageEvents.publishFormMessageReceived(p),
    subscribeFn: cb => CometChatMessageEvents.subscribeOnFormMessageReceived(cb),
  },
  {
    className: 'CometChatMessageEvents',
    name: 'CardMessageReceived',
    publishFn: p => CometChatMessageEvents.publishCardMessageReceived(p),
    subscribeFn: cb => CometChatMessageEvents.subscribeOnCardMessageReceived(cb),
  },
  {
    className: 'CometChatMessageEvents',
    name: 'SchedulerMessageReceived',
    publishFn: p => CometChatMessageEvents.publishSchedulerMessageReceived(p),
    subscribeFn: cb => CometChatMessageEvents.subscribeOnSchedulerMessageReceived(cb),
  },
  {
    className: 'CometChatMessageEvents',
    name: 'AIAssistantMessageReceived',
    publishFn: p => CometChatMessageEvents.publishAIAssistantMessageReceived(p),
    subscribeFn: cb => CometChatMessageEvents.subscribeOnAIAssistantMessageReceived(cb),
  },
  {
    className: 'CometChatMessageEvents',
    name: 'AIToolResultReceived',
    publishFn: p => CometChatMessageEvents.publishAIToolResultReceived(p),
    subscribeFn: cb => CometChatMessageEvents.subscribeOnAIToolResultReceived(cb),
  },
  {
    className: 'CometChatMessageEvents',
    name: 'AIToolArgumentsReceived',
    publishFn: p => CometChatMessageEvents.publishAIToolArgumentsReceived(p),
    subscribeFn: cb => CometChatMessageEvents.subscribeOnAIToolArgumentsReceived(cb),
  },
  // CometChatUIEvents
  {
    className: 'CometChatUIEvents',
    name: 'ShowPanel',
    publishFn: p => CometChatUIEvents.publishShowPanel(p),
    subscribeFn: cb => CometChatUIEvents.onShowPanel(cb),
  },
  {
    className: 'CometChatUIEvents',
    name: 'HidePanel',
    publishFn: p => CometChatUIEvents.publishHidePanel(p),
    subscribeFn: cb => CometChatUIEvents.onHidePanel(cb),
  },
  {
    className: 'CometChatUIEvents',
    name: 'ShowModal',
    publishFn: p => CometChatUIEvents.publishShowModal(p),
    subscribeFn: cb => CometChatUIEvents.onShowModal(cb),
  },
  {
    className: 'CometChatUIEvents',
    name: 'HideModal',
    publishFn: () => CometChatUIEvents.publishHideModal(),
    subscribeFn: cb => CometChatUIEvents.onHideModal(cb as any),
  },
  {
    className: 'CometChatUIEvents',
    name: 'ShowDialog',
    publishFn: p => CometChatUIEvents.publishShowDialog(p),
    subscribeFn: cb => CometChatUIEvents.onShowDialog(cb),
  },
  {
    className: 'CometChatUIEvents',
    name: 'HideDialog',
    publishFn: () => CometChatUIEvents.publishHideDialog(),
    subscribeFn: cb => CometChatUIEvents.onHideDialog(cb as any),
  },
  {
    className: 'CometChatUIEvents',
    name: 'ActiveChatChanged',
    publishFn: p => CometChatUIEvents.publishActiveChatChanged(p),
    subscribeFn: cb => CometChatUIEvents.onActiveChatChanged(cb),
  },
  {
    className: 'CometChatUIEvents',
    name: 'ShowOngoingCall',
    publishFn: p => CometChatUIEvents.publishShowOngoingCall(p),
    subscribeFn: cb => CometChatUIEvents.onShowOngoingCall(cb),
  },
  {
    className: 'CometChatUIEvents',
    name: 'OpenChat',
    publishFn: p => CometChatUIEvents.publishOpenChat(p),
    subscribeFn: cb => CometChatUIEvents.onOpenChat(cb),
  },
  {
    className: 'CometChatUIEvents',
    name: 'ComposeMessage',
    publishFn: p => CometChatUIEvents.publishComposeMessage(p),
    subscribeFn: cb => CometChatUIEvents.onComposeMessage(cb),
  },
  {
    className: 'CometChatUIEvents',
    name: 'MouseEvent',
    publishFn: p => CometChatUIEvents.publishMouseEvent(p),
    subscribeFn: cb => CometChatUIEvents.onMouseEvent(cb),
  },
  {
    className: 'CometChatUIEvents',
    name: 'ShowMentionsCountWarning',
    publishFn: p => CometChatUIEvents.publishShowMentionsCountWarning(p),
    subscribeFn: cb => CometChatUIEvents.onShowMentionsCountWarning(cb),
  },
  {
    className: 'CometChatUIEvents',
    name: 'ActivePopover',
    publishFn: p => CometChatUIEvents.publishActivePopover(p),
    subscribeFn: cb => CometChatUIEvents.onActivePopover(cb),
  },
  // CometChatUserEvents
  {
    className: 'CometChatUserEvents',
    name: 'UserBlocked',
    publishFn: p => CometChatUserEvents.publishUserBlocked(p),
    subscribeFn: cb => CometChatUserEvents.onUserBlocked(cb),
  },
  {
    className: 'CometChatUserEvents',
    name: 'UserUnblocked',
    publishFn: p => CometChatUserEvents.publishUserUnblocked(p),
    subscribeFn: cb => CometChatUserEvents.onUserUnblocked(cb),
  },
];

// ==================== Event Subject Registry ====================

interface EventSubjectDescriptor {
  className: string;
  subjectName: string;
  subject: Subject<any>;
}

function extractSubjects(
  className: string,
  eventClass: Record<string, any>
): EventSubjectDescriptor[] {
  const descriptors: EventSubjectDescriptor[] = [];
  for (const key of Object.keys(eventClass)) {
    const value = eventClass[key];
    if (value instanceof Subject) {
      descriptors.push({ className, subjectName: key, subject: value });
    }
  }
  return descriptors;
}

const ALL_EVENT_SUBJECTS: EventSubjectDescriptor[] = [
  ...extractSubjects('CometChatCallEvents', CometChatCallEvents),
  ...extractSubjects('CometChatConversationEvents', CometChatConversationEvents),
  ...extractSubjects('CometChatGroupEvents', CometChatGroupEvents),
  ...extractSubjects('CometChatMessageEvents', CometChatMessageEvents),
  ...extractSubjects('CometChatUIEvents', CometChatUIEvents),
  ...extractSubjects('CometChatUserEvents', CometChatUserEvents),
];

// ==================== Arbitraries ====================

/** Pick any event subject from the registry. */
const arbEventSubject = fc.constantFrom(...ALL_EVENT_SUBJECTS);

/** Positive integer for subscriber count (1–20). */
const arbSubscriberCount = fc.integer({ min: 1, max: 20 });

/** Arbitrary payload values. */
const arbPayload = fc.oneof(
  fc.constant(null),
  fc.constant(undefined),
  fc.string({ minLength: 0, maxLength: 80 }),
  fc.integer(),
  fc.boolean(),
  fc.record({
    id: fc.string({ minLength: 1, maxLength: 20 }),
    value: fc.oneof(fc.string(), fc.integer(), fc.constant(null)),
  })
);

/** Sequence of payloads (1–5 items). */
const arbPayloadSequence = fc.array(arbPayload, { minLength: 1, maxLength: 5 });

/** Two distinct event subjects for isolation tests. */
const arbTwoDistinctSubjects = fc
  .tuple(
    fc.integer({ min: 0, max: ALL_EVENT_SUBJECTS.length - 1 }),
    fc.integer({ min: 0, max: ALL_EVENT_SUBJECTS.length - 1 })
  )
  .filter(([a, b]) => a !== b)
  .map(
    ([a, b]) =>
      [ALL_EVENT_SUBJECTS[a], ALL_EVENT_SUBJECTS[b]] as [
        EventSubjectDescriptor,
        EventSubjectDescriptor,
      ]
  );

// ==================== Tests ====================

describe('Property 3: Event Subscription Fan-Out', () => {
  const subscriptions: Subscription[] = [];

  beforeAll(async () => {
    await ensureSdkReady();
  });

  afterAll(async () => {
    await sdkCleanup();
  });

  afterEach(() => {
    subscriptions.forEach(s => s.unsubscribe());
    subscriptions.length = 0;
  });

  // ---------- Core fan-out property ----------

  /**
   * **Validates: Requirements 12.3, 7.1, 7.3**
   *
   * For any event Subject and any positive integer N,
   * subscribing N times and emitting once delivers exactly N callbacks.
   */
  it('subscribing N times and emitting once delivers exactly N callbacks', () => {
    fc.assert(
      fc.property(arbEventSubject, arbSubscriberCount, arbPayload, (descriptor, n, payload) => {
        const { subject } = descriptor;
        const callbacks: any[][] = Array.from({ length: n }, () => []);

        const subs = callbacks.map(arr => subject.subscribe((v: any) => arr.push(v)));
        subscriptions.push(...subs);

        subject.next(payload);

        // Exactly N callbacks invoked, each with the payload
        for (let i = 0; i < n; i++) {
          expect(callbacks[i]).toHaveLength(1);
          expect(callbacks[i][0]).toBe(payload);
        }
      }),
      { numRuns: 150 }
    );
  });

  /**
   * **Validates: Requirements 12.3, 7.1, 7.3**
   *
   * Total callback count across all subscribers equals N for a single emission.
   */
  it('total callback invocations equal N for single emission', () => {
    fc.assert(
      fc.property(arbEventSubject, arbSubscriberCount, arbPayload, (descriptor, n, payload) => {
        const { subject } = descriptor;
        let totalCallbacks = 0;

        const subs = Array.from({ length: n }, () =>
          subject.subscribe(() => {
            totalCallbacks++;
          })
        );
        subscriptions.push(...subs);

        subject.next(payload);

        expect(totalCallbacks).toBe(n);
      }),
      { numRuns: 150 }
    );
  });

  // ---------- Fan-out with multiple emissions ----------

  /**
   * **Validates: Requirements 12.3, 7.1, 7.3**
   *
   * For N subscribers and M emissions, each subscriber receives exactly M values.
   */
  it('N subscribers each receive M values for M emissions', () => {
    fc.assert(
      fc.property(
        arbEventSubject,
        arbSubscriberCount,
        arbPayloadSequence,
        (descriptor, n, payloads) => {
          const { subject } = descriptor;
          const callbacks: any[][] = Array.from({ length: n }, () => []);

          const subs = callbacks.map(arr => subject.subscribe((v: any) => arr.push(v)));
          subscriptions.push(...subs);

          for (const p of payloads) {
            subject.next(p);
          }

          for (let i = 0; i < n; i++) {
            expect(callbacks[i]).toHaveLength(payloads.length);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 12.3, 7.1, 7.3**
   *
   * Total callback count equals N * M for N subscribers and M emissions.
   */
  it('total callbacks equal N * M for N subscribers and M emissions', () => {
    fc.assert(
      fc.property(
        arbEventSubject,
        arbSubscriberCount,
        arbPayloadSequence,
        (descriptor, n, payloads) => {
          const { subject } = descriptor;
          let totalCallbacks = 0;

          const subs = Array.from({ length: n }, () =>
            subject.subscribe(() => {
              totalCallbacks++;
            })
          );
          subscriptions.push(...subs);

          for (const p of payloads) {
            subject.next(p);
          }

          expect(totalCallbacks).toBe(n * payloads.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  // ---------- Fan-out preserves payload identity ----------

  /**
   * **Validates: Requirements 12.3, 7.1, 7.3**
   *
   * All N subscribers receive the exact same object reference.
   */
  it('all N subscribers receive the same payload reference', () => {
    fc.assert(
      fc.property(arbEventSubject, arbSubscriberCount, (descriptor, n) => {
        const { subject } = descriptor;
        const payload = { unique: Math.random() };
        const received: any[] = [];

        const subs = Array.from({ length: n }, () =>
          subject.subscribe((v: any) => received.push(v))
        );
        subscriptions.push(...subs);

        subject.next(payload);

        expect(received).toHaveLength(n);
        for (const val of received) {
          expect(val).toBe(payload);
        }
      }),
      { numRuns: 100 }
    );
  });

  // ---------- Fan-out with partial unsubscribe ----------

  /**
   * **Validates: Requirements 12.3, 7.1, 7.3**
   *
   * After K of N subscribers unsubscribe, emitting delivers exactly N-K callbacks.
   */
  it('after K unsubscribes, emission delivers exactly N-K callbacks', () => {
    fc.assert(
      fc.property(
        arbEventSubject,
        fc.integer({ min: 2, max: 15 }),
        arbPayload,
        (descriptor, n, payload) => {
          const { subject } = descriptor;
          const k = Math.floor(n / 2); // unsubscribe half
          let callbackCount = 0;

          const subs = Array.from({ length: n }, () =>
            subject.subscribe(() => {
              callbackCount++;
            })
          );

          // Unsubscribe first K
          for (let i = 0; i < k; i++) {
            subs[i].unsubscribe();
          }
          // Keep remaining in cleanup list
          subscriptions.push(...subs.slice(k));

          subject.next(payload);

          expect(callbackCount).toBe(n - k);
        }
      ),
      { numRuns: 100 }
    );
  });

  // ---------- Fan-out ordering ----------

  /**
   * **Validates: Requirements 12.3, 7.1, 7.3**
   *
   * Subscribers receive emissions in subscription order.
   */
  it('subscribers receive emissions in subscription order', () => {
    fc.assert(
      fc.property(
        arbEventSubject,
        fc.integer({ min: 2, max: 10 }),
        arbPayload,
        (descriptor, n, payload) => {
          const { subject } = descriptor;
          const order: number[] = [];

          const subs = Array.from({ length: n }, (_, i) => subject.subscribe(() => order.push(i)));
          subscriptions.push(...subs);

          subject.next(payload);

          expect(order).toHaveLength(n);
          for (let i = 0; i < n; i++) {
            expect(order[i]).toBe(i);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // ---------- Zero subscribers ----------

  /**
   * **Validates: Requirements 12.3, 7.1, 7.3**
   *
   * Emitting with zero subscribers does not throw.
   */
  it('emitting with zero subscribers does not throw', () => {
    fc.assert(
      fc.property(arbEventSubject, arbPayload, (descriptor, payload) => {
        const { subject } = descriptor;
        expect(() => subject.next(payload)).not.toThrow();
      }),
      { numRuns: 100 }
    );
  });

  // ---------- Fan-out across event classes ----------

  /**
   * **Validates: Requirements 12.3, 7.1, 7.3**
   *
   * Fan-out holds for every event class — subscribing N times on any
   * Subject from any event module delivers exactly N callbacks.
   */
  it('fan-out holds across all event classes', () => {
    for (const descriptor of ALL_EVENT_SUBJECTS.slice(0, 6)) {
      const { subject } = descriptor;
      const n = 5;
      let count = 0;

      const subs = Array.from({ length: n }, () =>
        subject.subscribe(() => {
          count++;
        })
      );
      subscriptions.push(...subs);

      subject.next('test-payload');

      expect(count).toBe(n);
      count = 0;
    }
  });

  // ---------- Event type isolation with fan-out ----------

  /**
   * **Validates: Requirements 12.3, 7.1, 7.3**
   *
   * Subscribing N times to Subject A and emitting on Subject B
   * delivers zero callbacks to A's subscribers.
   */
  it('fan-out is isolated between distinct event subjects', () => {
    fc.assert(
      fc.property(
        arbTwoDistinctSubjects,
        arbSubscriberCount,
        arbPayload,
        ([descriptorA, descriptorB], n, payload) => {
          let callbackCount = 0;

          const subs = Array.from({ length: n }, () =>
            descriptorA.subject.subscribe(() => {
              callbackCount++;
            })
          );
          subscriptions.push(...subs);

          // Emit on B, not A
          descriptorB.subject.next(payload);

          expect(callbackCount).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ==================== Typed Subscribe Helpers: Fan-Out ====================

/** Arbitrary for picking a typed pair descriptor. */
const arbTypedPair = fc.constantFrom(...ALL_TYPED_PAIRS);

/** Typed pairs that forward payload (excludes void events like HideDialog, HideModal). */
const PAYLOAD_TYPED_PAIRS = ALL_TYPED_PAIRS.filter(
  p => p.name !== 'HideDialog' && p.name !== 'HideModal'
);
const arbPayloadTypedPair = fc.constantFrom(...PAYLOAD_TYPED_PAIRS);

describe('Typed Subscribe Helpers: Fan-Out', () => {
  const subscriptions: Subscription[] = [];

  beforeAll(async () => {
    await ensureSdkReady();
  }, 30000);

  afterAll(async () => {
    await sdkCleanup();
  });

  afterEach(() => {
    subscriptions.forEach(s => s.unsubscribe());
    subscriptions.length = 0;
  });

  /**
   * **Validates: Requirements 2.1**
   *
   * For any typed pair, subscribing N times via the typed subscribe helper
   * and emitting once via the typed publish method delivers exactly N callbacks.
   */
  it('N typed subscriptions receive exactly N callbacks on typed publish', () => {
    fc.assert(
      fc.property(arbPayloadTypedPair, arbSubscriberCount, (descriptor, n) => {
        const payload = { id: 'test', value: Math.random() };
        const callbacks: any[][] = Array.from({ length: n }, () => []);

        const subs = callbacks.map(arr => descriptor.subscribeFn((v: any) => arr.push(v)));
        subscriptions.push(...subs);

        descriptor.publishFn(payload);

        for (let i = 0; i < n; i++) {
          expect(callbacks[i]).toHaveLength(1);
          expect(callbacks[i][0]).toBe(payload);
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 2.1**
   *
   * Total callback count across N typed subscribers equals N for a single
   * typed publish.
   */
  it('total typed subscriber callbacks equal N for single typed publish', () => {
    fc.assert(
      fc.property(arbTypedPair, arbSubscriberCount, (descriptor, n) => {
        let totalCallbacks = 0;

        const subs = Array.from({ length: n }, () =>
          descriptor.subscribeFn(() => {
            totalCallbacks++;
          })
        );
        subscriptions.push(...subs);

        descriptor.publishFn({ id: 'test' });

        expect(totalCallbacks).toBe(n);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 2.1**
   *
   * All N typed subscribers receive the exact same payload reference.
   */
  it('all N typed subscribers receive the same payload reference', () => {
    fc.assert(
      fc.property(arbPayloadTypedPair, arbSubscriberCount, (descriptor, n) => {
        const payload = { unique: Math.random() };
        const received: any[] = [];

        const subs = Array.from({ length: n }, () =>
          descriptor.subscribeFn((v: any) => received.push(v))
        );
        subscriptions.push(...subs);

        descriptor.publishFn(payload);

        expect(received).toHaveLength(n);
        for (const val of received) {
          expect(val).toBe(payload);
        }
      }),
      { numRuns: 100 }
    );
  });
});
