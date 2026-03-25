/**
 * Property-Based Tests for Event Emission Without Subscribers
 *
 * Categories: Property-Based No-Subscriber Safety, Zero-Subscriber Emission,
 *             Post-Unsubscribe Emission, Payload Variety, Late Subscription
 * Validates: Requirements 7.4
 *
 * Property 13: Event Emission Without Subscribers
 * For any event Subject with zero subscribers, calling next() with any
 * value does not throw an error.
 *
 * @module events/event-emission-no-subscribers.property
 */

import { vi, describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';

vi.mock('@cometchat/calls-sdk-javascript', () => ({ default: {} }));
import * as fc from 'fast-check';
import { Subject, Subscription } from 'rxjs';
import { ensureSdkReady, sdkCleanup } from '../test-setup';

import { CometChatCallEvents } from './CometChatCallEvents';
import { CometChatConversationEvents } from './CometChatConversationEvents';
import { CometChatGroupEvents } from './CometChatGroupEvents';
import { CometChatMessageEvents } from './CometChatMessageEvents';
import { CometChatUIEvents } from './CometChatUIEvents';
import { CometChatUserEvents } from './CometChatUserEvents';

// ==================== Typed Publish Method Registry ====================

interface TypedPublishDescriptor {
  className: string;
  methodName: string;
  publishFn: (payload: any) => void;
}

const ALL_TYPED_PUBLISH_METHODS: TypedPublishDescriptor[] = [
  // CometChatCallEvents
  {
    className: 'CometChatCallEvents',
    methodName: 'publishOutgoingCall',
    publishFn: p => CometChatCallEvents.publishOutgoingCall(p),
  },
  {
    className: 'CometChatCallEvents',
    methodName: 'publishCallAccepted',
    publishFn: p => CometChatCallEvents.publishCallAccepted(p),
  },
  {
    className: 'CometChatCallEvents',
    methodName: 'publishCallRejected',
    publishFn: p => CometChatCallEvents.publishCallRejected(p),
  },
  {
    className: 'CometChatCallEvents',
    methodName: 'publishCallEnded',
    publishFn: p => CometChatCallEvents.publishCallEnded(p),
  },
  // CometChatConversationEvents
  {
    className: 'CometChatConversationEvents',
    methodName: 'publishConversationDeleted',
    publishFn: p => CometChatConversationEvents.publishConversationDeleted(p),
  },
  // CometChatGroupEvents
  {
    className: 'CometChatGroupEvents',
    methodName: 'publishGroupCreated',
    publishFn: p => CometChatGroupEvents.publishGroupCreated(p),
  },
  {
    className: 'CometChatGroupEvents',
    methodName: 'publishGroupDeleted',
    publishFn: p => CometChatGroupEvents.publishGroupDeleted(p),
  },
  {
    className: 'CometChatGroupEvents',
    methodName: 'publishGroupMemberJoined',
    publishFn: p => CometChatGroupEvents.publishGroupMemberJoined(p),
  },
  {
    className: 'CometChatGroupEvents',
    methodName: 'publishGroupLeft',
    publishFn: p => CometChatGroupEvents.publishGroupLeft(p),
  },
  {
    className: 'CometChatGroupEvents',
    methodName: 'publishGroupMemberAdded',
    publishFn: p => CometChatGroupEvents.publishGroupMemberAdded(p),
  },
  {
    className: 'CometChatGroupEvents',
    methodName: 'publishGroupMemberScopeChanged',
    publishFn: p => CometChatGroupEvents.publishGroupMemberScopeChanged(p),
  },
  {
    className: 'CometChatGroupEvents',
    methodName: 'publishGroupMemberKicked',
    publishFn: p => CometChatGroupEvents.publishGroupMemberKicked(p),
  },
  {
    className: 'CometChatGroupEvents',
    methodName: 'publishGroupMemberBanned',
    publishFn: p => CometChatGroupEvents.publishGroupMemberBanned(p),
  },
  {
    className: 'CometChatGroupEvents',
    methodName: 'publishGroupMemberUnbanned',
    publishFn: p => CometChatGroupEvents.publishGroupMemberUnbanned(p),
  },
  {
    className: 'CometChatGroupEvents',
    methodName: 'publishOwnershipChanged',
    publishFn: p => CometChatGroupEvents.publishOwnershipChanged(p),
  },
  // CometChatMessageEvents (UI-level)
  {
    className: 'CometChatMessageEvents',
    methodName: 'publishMessageSent',
    publishFn: p => CometChatMessageEvents.publishMessageSent(p),
  },
  {
    className: 'CometChatMessageEvents',
    methodName: 'publishMessageEdited',
    publishFn: p => CometChatMessageEvents.publishMessageEdited(p),
  },
  {
    className: 'CometChatMessageEvents',
    methodName: 'publishReplyToMessage',
    publishFn: p => CometChatMessageEvents.publishReplyToMessage(p),
  },
  {
    className: 'CometChatMessageEvents',
    methodName: 'publishMessageTranslated',
    publishFn: p => CometChatMessageEvents.publishMessageTranslated(p),
  },
  {
    className: 'CometChatMessageEvents',
    methodName: 'publishMessageRead',
    publishFn: p => CometChatMessageEvents.publishMessageRead(p),
  },
  {
    className: 'CometChatMessageEvents',
    methodName: 'publishMessageDeleted',
    publishFn: p => CometChatMessageEvents.publishMessageDeleted(p),
  },
  // CometChatMessageEvents (SDK-wrapper)
  {
    className: 'CometChatMessageEvents',
    methodName: 'publishTextMessageReceived',
    publishFn: p => CometChatMessageEvents.publishTextMessageReceived(p),
  },
  {
    className: 'CometChatMessageEvents',
    methodName: 'publishMediaMessageReceived',
    publishFn: p => CometChatMessageEvents.publishMediaMessageReceived(p),
  },
  {
    className: 'CometChatMessageEvents',
    methodName: 'publishCustomMessageReceived',
    publishFn: p => CometChatMessageEvents.publishCustomMessageReceived(p),
  },
  {
    className: 'CometChatMessageEvents',
    methodName: 'publishTypingStarted',
    publishFn: p => CometChatMessageEvents.publishTypingStarted(p),
  },
  {
    className: 'CometChatMessageEvents',
    methodName: 'publishTypingEnded',
    publishFn: p => CometChatMessageEvents.publishTypingEnded(p),
  },
  {
    className: 'CometChatMessageEvents',
    methodName: 'publishMessagesDelivered',
    publishFn: p => CometChatMessageEvents.publishMessagesDelivered(p),
  },
  {
    className: 'CometChatMessageEvents',
    methodName: 'publishMessagesRead',
    publishFn: p => CometChatMessageEvents.publishMessagesRead(p),
  },
  {
    className: 'CometChatMessageEvents',
    methodName: 'publishMessagesDeliveredToAll',
    publishFn: p => CometChatMessageEvents.publishMessagesDeliveredToAll(p),
  },
  {
    className: 'CometChatMessageEvents',
    methodName: 'publishMessagesReadByAll',
    publishFn: p => CometChatMessageEvents.publishMessagesReadByAll(p),
  },
  {
    className: 'CometChatMessageEvents',
    methodName: 'publishMessageModerated',
    publishFn: p => CometChatMessageEvents.publishMessageModerated(p),
  },
  {
    className: 'CometChatMessageEvents',
    methodName: 'publishOnMessageEdited',
    publishFn: p => CometChatMessageEvents.publishOnMessageEdited(p),
  },
  {
    className: 'CometChatMessageEvents',
    methodName: 'publishOnMessageDeleted',
    publishFn: p => CometChatMessageEvents.publishOnMessageDeleted(p),
  },
  {
    className: 'CometChatMessageEvents',
    methodName: 'publishMessageReactionAdded',
    publishFn: p => CometChatMessageEvents.publishMessageReactionAdded(p),
  },
  {
    className: 'CometChatMessageEvents',
    methodName: 'publishMessageReactionRemoved',
    publishFn: p => CometChatMessageEvents.publishMessageReactionRemoved(p),
  },
  {
    className: 'CometChatMessageEvents',
    methodName: 'publishCustomInteractiveMessageReceived',
    publishFn: p => CometChatMessageEvents.publishCustomInteractiveMessageReceived(p),
  },
  {
    className: 'CometChatMessageEvents',
    methodName: 'publishFormMessageReceived',
    publishFn: p => CometChatMessageEvents.publishFormMessageReceived(p),
  },
  {
    className: 'CometChatMessageEvents',
    methodName: 'publishCardMessageReceived',
    publishFn: p => CometChatMessageEvents.publishCardMessageReceived(p),
  },
  {
    className: 'CometChatMessageEvents',
    methodName: 'publishSchedulerMessageReceived',
    publishFn: p => CometChatMessageEvents.publishSchedulerMessageReceived(p),
  },
  {
    className: 'CometChatMessageEvents',
    methodName: 'publishAIAssistantMessageReceived',
    publishFn: p => CometChatMessageEvents.publishAIAssistantMessageReceived(p),
  },
  {
    className: 'CometChatMessageEvents',
    methodName: 'publishAIToolResultReceived',
    publishFn: p => CometChatMessageEvents.publishAIToolResultReceived(p),
  },
  {
    className: 'CometChatMessageEvents',
    methodName: 'publishAIToolArgumentsReceived',
    publishFn: p => CometChatMessageEvents.publishAIToolArgumentsReceived(p),
  },
  // CometChatUIEvents
  {
    className: 'CometChatUIEvents',
    methodName: 'publishShowPanel',
    publishFn: p => CometChatUIEvents.publishShowPanel(p),
  },
  {
    className: 'CometChatUIEvents',
    methodName: 'publishHidePanel',
    publishFn: p => CometChatUIEvents.publishHidePanel(p),
  },
  {
    className: 'CometChatUIEvents',
    methodName: 'publishShowModal',
    publishFn: p => CometChatUIEvents.publishShowModal(p),
  },
  {
    className: 'CometChatUIEvents',
    methodName: 'publishHideModal',
    publishFn: () => CometChatUIEvents.publishHideModal(),
  },
  {
    className: 'CometChatUIEvents',
    methodName: 'publishShowDialog',
    publishFn: p => CometChatUIEvents.publishShowDialog(p),
  },
  {
    className: 'CometChatUIEvents',
    methodName: 'publishHideDialog',
    publishFn: () => CometChatUIEvents.publishHideDialog(),
  },
  {
    className: 'CometChatUIEvents',
    methodName: 'publishActiveChatChanged',
    publishFn: p => CometChatUIEvents.publishActiveChatChanged(p),
  },
  {
    className: 'CometChatUIEvents',
    methodName: 'publishShowOngoingCall',
    publishFn: p => CometChatUIEvents.publishShowOngoingCall(p),
  },
  {
    className: 'CometChatUIEvents',
    methodName: 'publishOpenChat',
    publishFn: p => CometChatUIEvents.publishOpenChat(p),
  },
  {
    className: 'CometChatUIEvents',
    methodName: 'publishComposeMessage',
    publishFn: p => CometChatUIEvents.publishComposeMessage(p),
  },
  {
    className: 'CometChatUIEvents',
    methodName: 'publishMouseEvent',
    publishFn: p => CometChatUIEvents.publishMouseEvent(p),
  },
  {
    className: 'CometChatUIEvents',
    methodName: 'publishShowMentionsCountWarning',
    publishFn: p => CometChatUIEvents.publishShowMentionsCountWarning(p),
  },
  {
    className: 'CometChatUIEvents',
    methodName: 'publishActivePopover',
    publishFn: p => CometChatUIEvents.publishActivePopover(p),
  },
  // CometChatUserEvents
  {
    className: 'CometChatUserEvents',
    methodName: 'publishUserBlocked',
    publishFn: p => CometChatUserEvents.publishUserBlocked(p),
  },
  {
    className: 'CometChatUserEvents',
    methodName: 'publishUserUnblocked',
    publishFn: p => CometChatUserEvents.publishUserUnblocked(p),
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

/** Arbitrary payload values covering diverse types. */
const arbPayload = fc.oneof(
  fc.constant(null),
  fc.constant(undefined),
  fc.string({ minLength: 0, maxLength: 80 }),
  fc.integer(),
  fc.boolean(),
  fc.double({ noNaN: true }),
  fc.record({
    id: fc.string({ minLength: 1, maxLength: 20 }),
    value: fc.oneof(fc.string(), fc.integer(), fc.constant(null)),
  }),
  fc.array(fc.oneof(fc.string(), fc.integer(), fc.constant(null)), { minLength: 0, maxLength: 10 })
);

/** Sequence of payloads (1–10 items). */
const arbPayloadSequence = fc.array(arbPayload, { minLength: 1, maxLength: 10 });

/** Positive subscriber count for subscribe-then-unsubscribe tests. */
const arbSubscriberCount = fc.integer({ min: 1, max: 15 });

// ==================== Tests ====================

describe('Property 13: Event Emission Without Subscribers', () => {
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

  // ---------- Core: zero subscribers, next() does not throw ----------

  /**
   * **Validates: Requirements 7.4**
   *
   * For any event Subject with zero subscribers, calling next(payload)
   * with any arbitrary payload does not throw.
   */
  it('calling next() with zero subscribers does not throw for any payload', () => {
    fc.assert(
      fc.property(arbEventSubject, arbPayload, (descriptor, payload) => {
        const { subject } = descriptor;
        expect(() => subject.next(payload)).not.toThrow();
      }),
      { numRuns: 150 }
    );
  });

  // ---------- Null payload with zero subscribers ----------

  /**
   * **Validates: Requirements 7.4**
   *
   * Emitting null on any Subject with zero subscribers does not throw.
   */
  it('emitting null with zero subscribers does not throw', () => {
    fc.assert(
      fc.property(arbEventSubject, descriptor => {
        const { subject } = descriptor;
        expect(() => subject.next(null)).not.toThrow();
      }),
      { numRuns: 100 }
    );
  });

  // ---------- Undefined payload with zero subscribers ----------

  /**
   * **Validates: Requirements 7.4**
   *
   * Emitting undefined on any Subject with zero subscribers does not throw.
   */
  it('emitting undefined with zero subscribers does not throw', () => {
    fc.assert(
      fc.property(arbEventSubject, descriptor => {
        const { subject } = descriptor;
        expect(() => subject.next(undefined)).not.toThrow();
      }),
      { numRuns: 100 }
    );
  });

  // ---------- Multiple emissions with zero subscribers ----------

  /**
   * **Validates: Requirements 7.4**
   *
   * Emitting a sequence of M payloads on a Subject with zero subscribers
   * does not throw on any emission.
   */
  it('emitting M payloads sequentially with zero subscribers never throws', () => {
    fc.assert(
      fc.property(arbEventSubject, arbPayloadSequence, (descriptor, payloads) => {
        const { subject } = descriptor;
        for (const p of payloads) {
          expect(() => subject.next(p)).not.toThrow();
        }
      }),
      { numRuns: 100 }
    );
  });

  // ---------- After all subscribers unsubscribe, emission is safe ----------

  /**
   * **Validates: Requirements 7.4**
   *
   * Subscribe N listeners, unsubscribe all, then emit — calling next()
   * does not throw even though subscriber count returned to zero.
   */
  it('emitting after all N subscribers unsubscribe does not throw', () => {
    fc.assert(
      fc.property(arbEventSubject, arbSubscriberCount, arbPayload, (descriptor, n, payload) => {
        const { subject } = descriptor;

        const subs = Array.from({ length: n }, () => subject.subscribe(() => {}));

        // Unsubscribe all
        subs.forEach(s => s.unsubscribe());

        // Now zero subscribers — should not throw
        expect(() => subject.next(payload)).not.toThrow();
      }),
      { numRuns: 100 }
    );
  });

  // ---------- After unsubscribe, multiple emissions are safe ----------

  /**
   * **Validates: Requirements 7.4**
   *
   * Subscribe N listeners, unsubscribe all, then emit M payloads —
   * none of the emissions throw.
   */
  it('emitting M payloads after all subscribers unsubscribe never throws', () => {
    fc.assert(
      fc.property(
        arbEventSubject,
        arbSubscriberCount,
        arbPayloadSequence,
        (descriptor, n, payloads) => {
          const { subject } = descriptor;

          const subs = Array.from({ length: n }, () => subject.subscribe(() => {}));
          subs.forEach(s => s.unsubscribe());

          for (const p of payloads) {
            expect(() => subject.next(p)).not.toThrow();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // ---------- No queued messages after zero-subscriber emission ----------

  /**
   * **Validates: Requirements 7.4**
   *
   * Emit with zero subscribers, then subscribe — the new subscriber
   * should NOT receive the previously emitted value (no queuing).
   */
  it('subscribing after zero-subscriber emission receives nothing (no queuing)', () => {
    fc.assert(
      fc.property(arbEventSubject, arbPayload, (descriptor, payload) => {
        const { subject } = descriptor;

        // Emit with zero subscribers
        subject.next(payload);

        // Now subscribe
        const received: any[] = [];
        const sub = subject.subscribe((v: any) => received.push(v));
        subscriptions.push(sub);

        // Should have received nothing — Subject does not queue
        expect(received).toHaveLength(0);
      }),
      { numRuns: 100 }
    );
  });

  // ---------- Late subscriber works correctly after zero-subscriber emission ----------

  /**
   * **Validates: Requirements 7.4**
   *
   * Emit with zero subscribers, then subscribe, then emit again —
   * the late subscriber receives only the second emission.
   */
  it('late subscriber receives only emissions after subscribing, not before', () => {
    fc.assert(
      fc.property(
        arbEventSubject,
        arbPayload,
        arbPayload,
        (descriptor, payloadBefore, payloadAfter) => {
          const { subject } = descriptor;

          // Emit with zero subscribers
          subject.next(payloadBefore);

          // Subscribe late
          const received: any[] = [];
          const sub = subject.subscribe((v: any) => received.push(v));
          subscriptions.push(sub);

          // Emit again
          subject.next(payloadAfter);

          // Only the post-subscribe emission is received
          expect(received).toHaveLength(1);
          expect(received[0]).toBe(payloadAfter);
        }
      ),
      { numRuns: 100 }
    );
  });

  // ---------- All event classes: zero-subscriber emission safety ----------

  /**
   * **Validates: Requirements 7.4**
   *
   * For every event class, emitting on each Subject with zero subscribers
   * does not throw. Ensures broad coverage across all event modules.
   */
  it('zero-subscriber emission is safe across all event classes and subjects', () => {
    fc.assert(
      fc.property(arbPayload, payload => {
        for (const descriptor of ALL_EVENT_SUBJECTS) {
          expect(() => descriptor.subject.next(payload)).not.toThrow();
        }
      }),
      { numRuns: 100 }
    );
  });

  // ---------- Complex object payloads with zero subscribers ----------

  /**
   * **Validates: Requirements 7.4**
   *
   * Emitting deeply nested or complex object payloads with zero subscribers
   * does not throw.
   */
  it('emitting complex/nested object payloads with zero subscribers does not throw', () => {
    const arbComplexPayload = fc.record({
      type: fc.string({ minLength: 1, maxLength: 20 }),
      data: fc.record({
        items: fc.array(fc.integer(), { minLength: 0, maxLength: 5 }),
        nested: fc.record({
          flag: fc.boolean(),
          label: fc.string({ minLength: 0, maxLength: 30 }),
        }),
      }),
      metadata: fc.constant(null),
    });

    fc.assert(
      fc.property(arbEventSubject, arbComplexPayload, (descriptor, payload) => {
        const { subject } = descriptor;
        expect(() => subject.next(payload)).not.toThrow();
      }),
      { numRuns: 100 }
    );
  });

  // ---------- Repeated subscribe/unsubscribe cycles then emit ----------

  /**
   * **Validates: Requirements 7.4**
   *
   * Subscribe and unsubscribe K times in a row, then emit —
   * the emission with zero remaining subscribers does not throw.
   */
  it('emission after K subscribe/unsubscribe cycles does not throw', () => {
    fc.assert(
      fc.property(
        arbEventSubject,
        fc.integer({ min: 1, max: 10 }),
        arbPayload,
        (descriptor, k, payload) => {
          const { subject } = descriptor;

          for (let i = 0; i < k; i++) {
            const sub = subject.subscribe(() => {});
            sub.unsubscribe();
          }

          // Zero subscribers after all cycles
          expect(() => subject.next(payload)).not.toThrow();
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ==================== Typed Publish Methods: Zero Subscribers ====================

/** Arbitrary for picking a typed publish descriptor. */
const arbTypedPublish = fc.constantFrom(...ALL_TYPED_PUBLISH_METHODS);

describe('Typed Publish Methods: Zero-Subscriber Safety', () => {
  beforeAll(async () => {
    await ensureSdkReady();
  }, 30000);

  afterAll(async () => {
    await sdkCleanup();
  });

  /**
   * **Validates: Requirements 1.4**
   *
   * Calling any typed publish method with an arbitrary payload and zero
   * subscribers does not throw.
   */
  it('typed publish with zero subscribers does not throw for any payload', () => {
    fc.assert(
      fc.property(arbTypedPublish, arbPayload, (descriptor, payload) => {
        expect(() => descriptor.publishFn(payload)).not.toThrow();
      }),
      { numRuns: 150 }
    );
  });

  /**
   * **Validates: Requirements 1.4**
   *
   * Calling every typed publish method across all event classes with zero
   * subscribers does not throw.
   */
  it('all typed publish methods are safe with zero subscribers', () => {
    fc.assert(
      fc.property(arbPayload, payload => {
        for (const descriptor of ALL_TYPED_PUBLISH_METHODS) {
          expect(() => descriptor.publishFn(payload)).not.toThrow();
        }
      }),
      { numRuns: 50 }
    );
  });

  /**
   * **Validates: Requirements 1.4**
   *
   * Calling a typed publish method multiple times in sequence with zero
   * subscribers does not throw on any invocation.
   */
  it('sequential typed publish calls with zero subscribers never throw', () => {
    fc.assert(
      fc.property(arbTypedPublish, arbPayloadSequence, (descriptor, payloads) => {
        for (const p of payloads) {
          expect(() => descriptor.publishFn(p)).not.toThrow();
        }
      }),
      { numRuns: 100 }
    );
  });
});
