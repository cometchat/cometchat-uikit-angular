/**
 * Property-Based Tests for Event Type Isolation
 *
 * Categories: Property-Based Cross-Subject Isolation, Inter-Class Isolation,
 *             Intra-Class Isolation, Positive Control
 * Validates: Requirements 7.5
 *
 * Property 12: Event Type Isolation
 * Subscribing to one event Subject and emitting on another does not
 * invoke the subscriber's callback.
 *
 * @module events/event-type-isolation.property
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
    name: 'OwnershipChanged',
    publishFn: p => CometChatGroupEvents.publishOwnershipChanged(p),
    subscribeFn: cb => CometChatGroupEvents.onOwnershipChanged(cb),
  },
  // CometChatMessageEvents (sample UI + SDK)
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
    name: 'TextMessageReceived',
    publishFn: p => CometChatMessageEvents.publishTextMessageReceived(p),
    subscribeFn: cb => CometChatMessageEvents.subscribeOnTextMessageReceived(cb),
  },
  {
    className: 'CometChatMessageEvents',
    name: 'TypingStarted',
    publishFn: p => CometChatMessageEvents.publishTypingStarted(p),
    subscribeFn: cb => CometChatMessageEvents.subscribeOnTypingStarted(cb),
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
    name: 'ActiveChatChanged',
    publishFn: p => CometChatUIEvents.publishActiveChatChanged(p),
    subscribeFn: cb => CometChatUIEvents.onActiveChatChanged(cb),
  },
  {
    className: 'CometChatUIEvents',
    name: 'ComposeMessage',
    publishFn: p => CometChatUIEvents.publishComposeMessage(p),
    subscribeFn: cb => CometChatUIEvents.onComposeMessage(cb),
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

/** Two distinct typed pairs. */
const arbTwoDistinctTypedPairs = fc
  .tuple(
    fc.integer({ min: 0, max: ALL_TYPED_PAIRS.length - 1 }),
    fc.integer({ min: 0, max: ALL_TYPED_PAIRS.length - 1 })
  )
  .filter(([a, b]) => a !== b)
  .map(
    ([a, b]) =>
      [ALL_TYPED_PAIRS[a], ALL_TYPED_PAIRS[b]] as [TypedPairDescriptor, TypedPairDescriptor]
  );

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

/** Map from className to its descriptors for intra-class tests. */
const SUBJECTS_BY_CLASS = new Map<string, EventSubjectDescriptor[]>();
for (const desc of ALL_EVENT_SUBJECTS) {
  const list = SUBJECTS_BY_CLASS.get(desc.className) ?? [];
  list.push(desc);
  SUBJECTS_BY_CLASS.set(desc.className, list);
}

/** Classes that have at least 2 subjects (for intra-class isolation). */
const CLASSES_WITH_MULTIPLE_SUBJECTS = [...SUBJECTS_BY_CLASS.entries()].filter(
  ([, list]) => list.length >= 2
);

// ==================== Arbitraries ====================

/** Two distinct event subjects (any classes). */
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

/** Two distinct subjects from DIFFERENT event classes. */
const arbCrossClassSubjects = arbTwoDistinctSubjects.filter(
  ([a, b]) => a.className !== b.className
);

/** Two distinct subjects from the SAME event class (if available). */
const arbIntraClassSubjects =
  CLASSES_WITH_MULTIPLE_SUBJECTS.length > 0
    ? fc.constantFrom(...CLASSES_WITH_MULTIPLE_SUBJECTS).chain(([, list]) =>
        fc
          .tuple(
            fc.integer({ min: 0, max: list.length - 1 }),
            fc.integer({ min: 0, max: list.length - 1 })
          )
          .filter(([a, b]) => a !== b)
          .map(([a, b]) => [list[a], list[b]] as [EventSubjectDescriptor, EventSubjectDescriptor])
      )
    : arbTwoDistinctSubjects; // fallback

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

/** Positive subscriber count. */
const arbSubscriberCount = fc.integer({ min: 1, max: 15 });

// ==================== Tests ====================

describe('Property 12: Event Type Isolation', () => {
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

  // ---------- Core cross-subject isolation ----------

  /**
   * **Validates: Requirements 7.5**
   *
   * For any two distinct Subjects, subscribing to A and emitting on B
   * delivers zero callbacks to A's subscriber.
   */
  it('subscribing to A and emitting on B delivers zero callbacks to A', () => {
    fc.assert(
      fc.property(arbTwoDistinctSubjects, arbPayload, ([descriptorA, descriptorB], payload) => {
        let callCount = 0;

        const sub = descriptorA.subject.subscribe(() => {
          callCount++;
        });
        subscriptions.push(sub);

        descriptorB.subject.next(payload);

        expect(callCount).toBe(0);
      }),
      { numRuns: 150 }
    );
  });

  // ---------- Cross-class isolation ----------

  /**
   * **Validates: Requirements 7.5**
   *
   * Subscribing to a Subject in one event class and emitting on a Subject
   * in a different event class delivers zero callbacks.
   */
  it('cross-class: subscribing in ClassX and emitting in ClassY yields zero callbacks', () => {
    fc.assert(
      fc.property(arbCrossClassSubjects, arbPayload, ([descriptorA, descriptorB], payload) => {
        let callCount = 0;

        const sub = descriptorA.subject.subscribe(() => {
          callCount++;
        });
        subscriptions.push(sub);

        descriptorB.subject.next(payload);

        expect(callCount).toBe(0);
      }),
      { numRuns: 150 }
    );
  });

  // ---------- Intra-class isolation ----------

  /**
   * **Validates: Requirements 7.5**
   *
   * Within the same event class, subscribing to one Subject and emitting
   * on a different Subject delivers zero callbacks.
   */
  it('intra-class: subscribing to SubjectX and emitting on SubjectY within same class yields zero', () => {
    fc.assert(
      fc.property(arbIntraClassSubjects, arbPayload, ([descriptorA, descriptorB], payload) => {
        let callCount = 0;

        const sub = descriptorA.subject.subscribe(() => {
          callCount++;
        });
        subscriptions.push(sub);

        descriptorB.subject.next(payload);

        expect(callCount).toBe(0);
      }),
      { numRuns: 100 }
    );
  });

  // ---------- Positive control: subscribed subject DOES fire ----------

  /**
   * **Validates: Requirements 7.5**
   *
   * Emitting on the subscribed Subject DOES invoke the callback (positive control),
   * while emitting on a different Subject does NOT.
   */
  it('positive control: subscribed subject fires, other subject does not', () => {
    fc.assert(
      fc.property(
        arbTwoDistinctSubjects,
        arbPayload,
        arbPayload,
        ([descriptorA, descriptorB], payloadA, payloadB) => {
          let callCountA = 0;

          const sub = descriptorA.subject.subscribe(() => {
            callCountA++;
          });
          subscriptions.push(sub);

          // Emit on B — should NOT fire
          descriptorB.subject.next(payloadB);
          expect(callCountA).toBe(0);

          // Emit on A — SHOULD fire
          descriptorA.subject.next(payloadA);
          expect(callCountA).toBe(1);
        }
      ),
      { numRuns: 100 }
    );
  });

  // ---------- N subscribers on A, emit on B — all zero ----------

  /**
   * **Validates: Requirements 7.5**
   *
   * Subscribe N times to Subject A, emit on Subject B —
   * all N subscribers receive zero callbacks.
   */
  it('N subscribers on A receive zero callbacks when emission is on B', () => {
    fc.assert(
      fc.property(
        arbTwoDistinctSubjects,
        arbSubscriberCount,
        arbPayload,
        ([descriptorA, descriptorB], n, payload) => {
          const callbacks: number[] = Array.from({ length: n }, () => 0);

          const subs = callbacks.map((_, i) =>
            descriptorA.subject.subscribe(() => {
              callbacks[i]++;
            })
          );
          subscriptions.push(...subs);

          descriptorB.subject.next(payload);

          for (let i = 0; i < n; i++) {
            expect(callbacks[i]).toBe(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // ---------- Subscribe to one, emit on all others ----------

  /**
   * **Validates: Requirements 7.5**
   *
   * Subscribe to one Subject, emit on every OTHER Subject in the registry —
   * the subscriber callback is never invoked.
   */
  it('subscribing to one subject and emitting on all others yields zero callbacks', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: ALL_EVENT_SUBJECTS.length - 1 }),
        arbPayload,
        (subscribedIdx, payload) => {
          const subscribedDescriptor = ALL_EVENT_SUBJECTS[subscribedIdx];
          let callCount = 0;

          const sub = subscribedDescriptor.subject.subscribe(() => {
            callCount++;
          });
          subscriptions.push(sub);

          // Emit on every other subject
          for (let i = 0; i < ALL_EVENT_SUBJECTS.length; i++) {
            if (i !== subscribedIdx) {
              ALL_EVENT_SUBJECTS[i].subject.next(payload);
            }
          }

          expect(callCount).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  // ---------- Multiple emissions on wrong subject ----------

  /**
   * **Validates: Requirements 7.5**
   *
   * Subscribe to A, emit M payloads on B — subscriber on A receives
   * zero callbacks across all M emissions.
   */
  it('M emissions on wrong subject still yield zero callbacks on subscribed subject', () => {
    fc.assert(
      fc.property(
        arbTwoDistinctSubjects,
        arbPayloadSequence,
        ([descriptorA, descriptorB], payloads) => {
          let callCount = 0;

          const sub = descriptorA.subject.subscribe(() => {
            callCount++;
          });
          subscriptions.push(sub);

          for (const p of payloads) {
            descriptorB.subject.next(p);
          }

          expect(callCount).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  // ---------- Bidirectional isolation ----------

  /**
   * **Validates: Requirements 7.5**
   *
   * Subscribe to A and B separately. Emitting on A fires only A's subscriber,
   * emitting on B fires only B's subscriber.
   */
  it('bidirectional isolation: each subscriber only fires for its own subject', () => {
    fc.assert(
      fc.property(
        arbTwoDistinctSubjects,
        arbPayload,
        arbPayload,
        ([descriptorA, descriptorB], payloadA, payloadB) => {
          let callCountA = 0;
          let callCountB = 0;

          const subA = descriptorA.subject.subscribe(() => {
            callCountA++;
          });
          const subB = descriptorB.subject.subscribe(() => {
            callCountB++;
          });
          subscriptions.push(subA, subB);

          // Emit on A — only A fires
          descriptorA.subject.next(payloadA);
          expect(callCountA).toBe(1);
          expect(callCountB).toBe(0);

          // Emit on B — only B fires
          descriptorB.subject.next(payloadB);
          expect(callCountA).toBe(1);
          expect(callCountB).toBe(1);
        }
      ),
      { numRuns: 100 }
    );
  });

  // ---------- Isolation with N subscribers on each ----------

  /**
   * **Validates: Requirements 7.5**
   *
   * Subscribe N times to A and M times to B. Emitting on A delivers
   * exactly N callbacks (none to B's subscribers) and vice versa.
   */
  it('N subscribers on A and M on B: emission on A fires N, emission on B fires M', () => {
    fc.assert(
      fc.property(
        arbTwoDistinctSubjects,
        fc.integer({ min: 1, max: 8 }),
        fc.integer({ min: 1, max: 8 }),
        arbPayload,
        ([descriptorA, descriptorB], n, m, payload) => {
          let callCountA = 0;
          let callCountB = 0;

          const subsA = Array.from({ length: n }, () =>
            descriptorA.subject.subscribe(() => {
              callCountA++;
            })
          );
          const subsB = Array.from({ length: m }, () =>
            descriptorB.subject.subscribe(() => {
              callCountB++;
            })
          );
          subscriptions.push(...subsA, ...subsB);

          // Emit on A
          descriptorA.subject.next(payload);
          expect(callCountA).toBe(n);
          expect(callCountB).toBe(0);

          // Reset and emit on B
          callCountA = 0;
          descriptorB.subject.next(payload);
          expect(callCountA).toBe(0);
          expect(callCountB).toBe(m);
        }
      ),
      { numRuns: 100 }
    );
  });

  // ---------- Isolation across all event classes ----------

  /**
   * **Validates: Requirements 7.5**
   *
   * For one representative subject per event class, subscribing to it
   * and emitting on all other classes' representative subjects yields zero.
   */
  it('isolation holds across all event classes (one subject per class)', () => {
    const classNames = new Set<string>();
    const representatives: EventSubjectDescriptor[] = [];
    for (const desc of ALL_EVENT_SUBJECTS) {
      if (!classNames.has(desc.className)) {
        classNames.add(desc.className);
        representatives.push(desc);
      }
    }

    for (let i = 0; i < representatives.length; i++) {
      let callCount = 0;
      const sub = representatives[i].subject.subscribe(() => {
        callCount++;
      });
      subscriptions.push(sub);

      for (let j = 0; j < representatives.length; j++) {
        if (j !== i) {
          representatives[j].subject.next('cross-class-payload');
        }
      }

      expect(callCount).toBe(0);
    }
  });

  // ---------- Payload identity preserved on correct subject ----------

  /**
   * **Validates: Requirements 7.5**
   *
   * When emitting on the correct subject, the subscriber receives the
   * exact payload reference — confirming isolation doesn't corrupt data.
   */
  it('payload identity is preserved when emitting on the correct subject', () => {
    fc.assert(
      fc.property(arbTwoDistinctSubjects, ([descriptorA, descriptorB]) => {
        const payloadA = { marker: 'A', rand: Math.random() };
        const payloadB = { marker: 'B', rand: Math.random() };
        const receivedA: any[] = [];
        const receivedB: any[] = [];

        const subA = descriptorA.subject.subscribe((v: any) => receivedA.push(v));
        const subB = descriptorB.subject.subscribe((v: any) => receivedB.push(v));
        subscriptions.push(subA, subB);

        descriptorA.subject.next(payloadA);
        descriptorB.subject.next(payloadB);

        expect(receivedA).toHaveLength(1);
        expect(receivedA[0]).toBe(payloadA);
        expect(receivedB).toHaveLength(1);
        expect(receivedB[0]).toBe(payloadB);
      }),
      { numRuns: 100 }
    );
  });
});

// ==================== Typed Publish/Subscribe Isolation ====================

describe('Typed Publish/Subscribe Isolation (Correctness Property #5)', () => {
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
   * **Validates: Requirements 5 (No cross-talk)**
   *
   * Subscribe via one typed helper, publish via a different typed method —
   * the subscriber receives zero callbacks.
   */
  it('subscribing via typed helper A and publishing via typed method B yields zero callbacks', () => {
    fc.assert(
      fc.property(arbTwoDistinctTypedPairs, ([pairA, pairB]) => {
        let callCount = 0;

        const sub = pairA.subscribeFn(() => {
          callCount++;
        });
        subscriptions.push(sub);

        pairB.publishFn({ id: 'cross-talk-test' });

        expect(callCount).toBe(0);
      }),
      { numRuns: 150 }
    );
  });

  /**
   * **Validates: Requirements 5 (No cross-talk)**
   *
   * Positive control: subscribing and publishing via the SAME typed pair
   * delivers exactly one callback.
   */
  it('subscribing and publishing via the same typed pair delivers one callback', () => {
    const arbTypedPair = fc.constantFrom(...ALL_TYPED_PAIRS);
    fc.assert(
      fc.property(arbTypedPair, pair => {
        let callCount = 0;
        const payload = { id: 'same-pair' };

        const sub = pair.subscribeFn(() => {
          callCount++;
        });
        subscriptions.push(sub);

        pair.publishFn(payload);

        expect(callCount).toBe(1);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 5 (No cross-talk)**
   *
   * Bidirectional typed isolation: subscribe to A and B separately,
   * publishing on A fires only A's subscriber, publishing on B fires only B's.
   */
  it('bidirectional typed isolation: each typed subscriber only fires for its own publish', () => {
    fc.assert(
      fc.property(arbTwoDistinctTypedPairs, ([pairA, pairB]) => {
        let callCountA = 0;
        let callCountB = 0;

        const subA = pairA.subscribeFn(() => {
          callCountA++;
        });
        const subB = pairB.subscribeFn(() => {
          callCountB++;
        });
        subscriptions.push(subA, subB);

        pairA.publishFn({ id: 'a' });
        expect(callCountA).toBe(1);
        expect(callCountB).toBe(0);

        pairB.publishFn({ id: 'b' });
        expect(callCountA).toBe(1);
        expect(callCountB).toBe(1);
      }),
      { numRuns: 100 }
    );
  });
});
