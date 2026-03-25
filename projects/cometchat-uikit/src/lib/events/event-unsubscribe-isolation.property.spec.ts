/**
 * Property-Based Tests for Event Unsubscribe Isolation
 *
 * Categories: Property-Based Unsubscribe Invariants, Isolation After Unsubscribe
 * Validates: Requirements 7.2
 *
 * Property 11: Event Unsubscribe Isolation
 * After a subscriber unsubscribes, subsequent emissions do not invoke
 * that subscriber's callback.
 *
 * @module events/event-unsubscribe-isolation.property
 */
vi.mock('@cometchat/calls-sdk-javascript', () => ({ default: {} }));

import { vi, describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { Subject, Subscription } from 'rxjs';
import { DestroyRef } from '@angular/core';
import { ensureSdkReady, sdkCleanup } from '../test-setup';

import { CometChatCallEvents } from './CometChatCallEvents';
import { CometChatConversationEvents } from './CometChatConversationEvents';
import { CometChatGroupEvents } from './CometChatGroupEvents';
import { CometChatMessageEvents } from './CometChatMessageEvents';
import { CometChatUIEvents } from './CometChatUIEvents';
import { CometChatUserEvents } from './CometChatUserEvents';

// ==================== DestroyRef Mock ====================

function createMockDestroyRef(): DestroyRef & { triggerDestroy: () => void } {
  const callbacks: (() => void)[] = [];
  return {
    onDestroy: (cb: () => void) => {
      callbacks.push(cb);
    },
    triggerDestroy: () => {
      callbacks.forEach(cb => cb());
    },
  } as any;
}

// ==================== Typed Subscribe-with-DestroyRef Pair Registry ====================

interface TypedDestroyRefPairDescriptor {
  className: string;
  name: string;
  publishFn: (payload: any) => void;
  subscribeFn: (cb: (data: any) => void, destroyRef?: DestroyRef) => Subscription;
}

const ALL_TYPED_DESTROYREF_PAIRS: TypedDestroyRefPairDescriptor[] = [
  // CometChatCallEvents
  {
    className: 'CometChatCallEvents',
    name: 'OutgoingCall',
    publishFn: p => CometChatCallEvents.publishOutgoingCall(p),
    subscribeFn: (cb, dr) => CometChatCallEvents.onOutgoingCall(cb, dr),
  },
  {
    className: 'CometChatCallEvents',
    name: 'CallAccepted',
    publishFn: p => CometChatCallEvents.publishCallAccepted(p),
    subscribeFn: (cb, dr) => CometChatCallEvents.onCallAccepted(cb, dr),
  },
  {
    className: 'CometChatCallEvents',
    name: 'CallRejected',
    publishFn: p => CometChatCallEvents.publishCallRejected(p),
    subscribeFn: (cb, dr) => CometChatCallEvents.onCallRejected(cb, dr),
  },
  {
    className: 'CometChatCallEvents',
    name: 'CallEnded',
    publishFn: p => CometChatCallEvents.publishCallEnded(p),
    subscribeFn: (cb, dr) => CometChatCallEvents.onCallEnded(cb, dr),
  },
  // CometChatConversationEvents
  {
    className: 'CometChatConversationEvents',
    name: 'ConversationDeleted',
    publishFn: p => CometChatConversationEvents.publishConversationDeleted(p),
    subscribeFn: (cb, dr) => CometChatConversationEvents.onConversationDeleted(cb, dr),
  },
  // CometChatGroupEvents
  {
    className: 'CometChatGroupEvents',
    name: 'GroupCreated',
    publishFn: p => CometChatGroupEvents.publishGroupCreated(p),
    subscribeFn: (cb, dr) => CometChatGroupEvents.onGroupCreated(cb, dr),
  },
  {
    className: 'CometChatGroupEvents',
    name: 'GroupDeleted',
    publishFn: p => CometChatGroupEvents.publishGroupDeleted(p),
    subscribeFn: (cb, dr) => CometChatGroupEvents.onGroupDeleted(cb, dr),
  },
  {
    className: 'CometChatGroupEvents',
    name: 'OwnershipChanged',
    publishFn: p => CometChatGroupEvents.publishOwnershipChanged(p),
    subscribeFn: (cb, dr) => CometChatGroupEvents.onOwnershipChanged(cb, dr),
  },
  // CometChatMessageEvents (UI-level + SDK-wrapper sample)
  {
    className: 'CometChatMessageEvents',
    name: 'MessageSent',
    publishFn: p => CometChatMessageEvents.publishMessageSent(p),
    subscribeFn: (cb, dr) => CometChatMessageEvents.onMessageSent(cb, dr),
  },
  {
    className: 'CometChatMessageEvents',
    name: 'CcMessageEdited',
    publishFn: p => CometChatMessageEvents.publishMessageEdited(p),
    subscribeFn: (cb, dr) => CometChatMessageEvents.onCcMessageEdited(cb, dr),
  },
  {
    className: 'CometChatMessageEvents',
    name: 'TextMessageReceived',
    publishFn: p => CometChatMessageEvents.publishTextMessageReceived(p),
    subscribeFn: (cb, dr) => CometChatMessageEvents.subscribeOnTextMessageReceived(cb, dr),
  },
  {
    className: 'CometChatMessageEvents',
    name: 'TypingStarted',
    publishFn: p => CometChatMessageEvents.publishTypingStarted(p),
    subscribeFn: (cb, dr) => CometChatMessageEvents.subscribeOnTypingStarted(cb, dr),
  },
  // CometChatUIEvents
  {
    className: 'CometChatUIEvents',
    name: 'ShowPanel',
    publishFn: p => CometChatUIEvents.publishShowPanel(p),
    subscribeFn: (cb, dr) => CometChatUIEvents.onShowPanel(cb, dr),
  },
  {
    className: 'CometChatUIEvents',
    name: 'ActiveChatChanged',
    publishFn: p => CometChatUIEvents.publishActiveChatChanged(p),
    subscribeFn: (cb, dr) => CometChatUIEvents.onActiveChatChanged(cb, dr),
  },
  {
    className: 'CometChatUIEvents',
    name: 'ComposeMessage',
    publishFn: p => CometChatUIEvents.publishComposeMessage(p),
    subscribeFn: (cb, dr) => CometChatUIEvents.onComposeMessage(cb, dr),
  },
  {
    className: 'CometChatUIEvents',
    name: 'ActivePopover',
    publishFn: p => CometChatUIEvents.publishActivePopover(p),
    subscribeFn: (cb, dr) => CometChatUIEvents.onActivePopover(cb, dr),
  },
  // CometChatUserEvents
  {
    className: 'CometChatUserEvents',
    name: 'UserBlocked',
    publishFn: p => CometChatUserEvents.publishUserBlocked(p),
    subscribeFn: (cb, dr) => CometChatUserEvents.onUserBlocked(cb, dr),
  },
  {
    className: 'CometChatUserEvents',
    name: 'UserUnblocked',
    publishFn: p => CometChatUserEvents.publishUserUnblocked(p),
    subscribeFn: (cb, dr) => CometChatUserEvents.onUserUnblocked(cb, dr),
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

/** Positive integer for subscriber count (2–15, need at least 2 for isolation tests). */
const arbSubscriberCount = fc.integer({ min: 2, max: 15 });

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

/** Number of post-unsubscribe emissions (1–10). */
const arbEmissionCount = fc.integer({ min: 1, max: 10 });

// ==================== Tests ====================

describe('Property 11: Event Unsubscribe Isolation', () => {
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

  // ---------- Core unsubscribe isolation ----------

  /**
   * **Validates: Requirements 7.2**
   *
   * Subscribe one listener, unsubscribe it, then emit — the callback
   * must NOT be invoked after unsubscribe.
   */
  it('unsubscribed listener receives zero emissions after unsubscribe', () => {
    fc.assert(
      fc.property(arbEventSubject, arbPayload, (descriptor, payload) => {
        const { subject } = descriptor;
        let callCount = 0;

        const sub = subject.subscribe(() => {
          callCount++;
        });
        sub.unsubscribe();

        subject.next(payload);

        expect(callCount).toBe(0);
      }),
      { numRuns: 150 }
    );
  });

  /**
   * **Validates: Requirements 7.2**
   *
   * Subscribe, verify it receives an emission, then unsubscribe and
   * verify subsequent emissions are NOT received.
   */
  it('subscriber receives before unsubscribe but not after', () => {
    fc.assert(
      fc.property(
        arbEventSubject,
        arbPayload,
        arbPayload,
        (descriptor, payloadBefore, payloadAfter) => {
          const { subject } = descriptor;
          const received: any[] = [];

          const sub = subject.subscribe((v: any) => received.push(v));

          // Emit before unsubscribe — should be received
          subject.next(payloadBefore);
          expect(received).toHaveLength(1);
          expect(received[0]).toBe(payloadBefore);

          // Unsubscribe
          sub.unsubscribe();

          // Emit after unsubscribe — should NOT be received
          subject.next(payloadAfter);
          expect(received).toHaveLength(1);
        }
      ),
      { numRuns: 150 }
    );
  });

  // ---------- Multiple emissions after unsubscribe ----------

  /**
   * **Validates: Requirements 7.2**
   *
   * After unsubscribe, emitting M times still delivers zero callbacks
   * to the unsubscribed listener.
   */
  it('unsubscribed listener receives nothing across M subsequent emissions', () => {
    fc.assert(
      fc.property(arbEventSubject, arbPayloadSequence, (descriptor, payloads) => {
        const { subject } = descriptor;
        let callCount = 0;

        const sub = subject.subscribe(() => {
          callCount++;
        });
        sub.unsubscribe();

        for (const p of payloads) {
          subject.next(p);
        }

        expect(callCount).toBe(0);
      }),
      { numRuns: 100 }
    );
  });

  // ---------- Selective unsubscribe among N subscribers ----------

  /**
   * **Validates: Requirements 7.2**
   *
   * Subscribe N listeners, unsubscribe one specific listener, emit —
   * the unsubscribed one gets zero, the remaining N-1 each get one.
   */
  it('unsubscribing one of N leaves remaining N-1 receiving events', () => {
    fc.assert(
      fc.property(arbEventSubject, arbSubscriberCount, arbPayload, (descriptor, n, payload) => {
        const { subject } = descriptor;
        const callbacks: number[] = Array.from({ length: n }, () => 0);

        const subs = callbacks.map((_, i) =>
          subject.subscribe(() => {
            callbacks[i]++;
          })
        );

        // Pick a random index to unsubscribe
        const unsubIdx = Math.floor(n / 2);
        subs[unsubIdx].unsubscribe();

        // Keep remaining in cleanup
        subs.forEach((s, i) => {
          if (i !== unsubIdx) subscriptions.push(s);
        });

        subject.next(payload);

        for (let i = 0; i < n; i++) {
          if (i === unsubIdx) {
            expect(callbacks[i]).toBe(0);
          } else {
            expect(callbacks[i]).toBe(1);
          }
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 7.2**
   *
   * Subscribe N listeners, unsubscribe ALL, emit — none should be called.
   */
  it('unsubscribing all N listeners means zero callbacks on emission', () => {
    fc.assert(
      fc.property(arbEventSubject, arbSubscriberCount, arbPayload, (descriptor, n, payload) => {
        const { subject } = descriptor;
        let totalCallbacks = 0;

        const subs = Array.from({ length: n }, () =>
          subject.subscribe(() => {
            totalCallbacks++;
          })
        );

        // Unsubscribe all
        subs.forEach(s => s.unsubscribe());

        subject.next(payload);

        expect(totalCallbacks).toBe(0);
      }),
      { numRuns: 100 }
    );
  });

  // ---------- Double unsubscribe safety ----------

  /**
   * **Validates: Requirements 7.2**
   *
   * Calling unsubscribe() twice on the same subscription does not throw.
   */
  it('double unsubscribe does not throw', () => {
    fc.assert(
      fc.property(arbEventSubject, descriptor => {
        const { subject } = descriptor;
        const sub = subject.subscribe(() => {});

        expect(() => {
          sub.unsubscribe();
          sub.unsubscribe();
        }).not.toThrow();
      }),
      { numRuns: 100 }
    );
  });

  // ---------- Unsubscribe mid-sequence ----------

  /**
   * **Validates: Requirements 7.2**
   *
   * Subscribe, emit K payloads, unsubscribe, emit M more payloads —
   * subscriber receives exactly K values total.
   */
  it('subscriber receives exactly K values when unsubscribed after K emissions', () => {
    fc.assert(
      fc.property(
        arbEventSubject,
        fc.integer({ min: 1, max: 5 }),
        fc.integer({ min: 1, max: 5 }),
        (descriptor, k, m) => {
          const { subject } = descriptor;
          const received: any[] = [];

          const sub = subject.subscribe((v: any) => received.push(v));

          // Emit K payloads before unsubscribe
          for (let i = 0; i < k; i++) {
            subject.next(`before-${i}`);
          }
          expect(received).toHaveLength(k);

          sub.unsubscribe();

          // Emit M payloads after unsubscribe
          for (let i = 0; i < m; i++) {
            subject.next(`after-${i}`);
          }

          // Still only K received
          expect(received).toHaveLength(k);
        }
      ),
      { numRuns: 100 }
    );
  });

  // ---------- Unsubscribe isolation across event classes ----------

  /**
   * **Validates: Requirements 7.2**
   *
   * Unsubscribe isolation holds for subjects from every event class.
   * Iterates a sample of subjects to ensure broad coverage.
   */
  it('unsubscribe isolation holds across all event classes', () => {
    // Take one subject per event class
    const classNames = new Set<string>();
    const sampleSubjects: EventSubjectDescriptor[] = [];
    for (const desc of ALL_EVENT_SUBJECTS) {
      if (!classNames.has(desc.className)) {
        classNames.add(desc.className);
        sampleSubjects.push(desc);
      }
    }

    for (const descriptor of sampleSubjects) {
      const { subject } = descriptor;
      let callCount = 0;

      const sub = subject.subscribe(() => {
        callCount++;
      });
      sub.unsubscribe();

      subject.next('test-payload');

      expect(callCount).toBe(0);
    }
  });

  // ---------- Re-subscribe after unsubscribe ----------

  /**
   * **Validates: Requirements 7.2**
   *
   * After unsubscribing, a new subscription to the same subject
   * receives subsequent emissions while the old one does not.
   */
  it('re-subscribing after unsubscribe receives new emissions only', () => {
    fc.assert(
      fc.property(arbEventSubject, arbPayload, arbPayload, (descriptor, payload1, payload2) => {
        const { subject } = descriptor;
        const oldReceived: any[] = [];
        const newReceived: any[] = [];

        // First subscription
        const oldSub = subject.subscribe((v: any) => oldReceived.push(v));
        subject.next(payload1);
        expect(oldReceived).toHaveLength(1);

        // Unsubscribe old
        oldSub.unsubscribe();

        // New subscription
        const newSub = subject.subscribe((v: any) => newReceived.push(v));
        subscriptions.push(newSub);

        subject.next(payload2);

        // Old did not receive payload2
        expect(oldReceived).toHaveLength(1);
        // New received payload2
        expect(newReceived).toHaveLength(1);
        expect(newReceived[0]).toBe(payload2);
      }),
      { numRuns: 100 }
    );
  });

  // ---------- Unsubscribe with arbitrary index ----------

  /**
   * **Validates: Requirements 7.2**
   *
   * For N subscribers and any index I in [0, N-1], unsubscribing
   * subscriber I means it receives zero while others receive one.
   */
  it('unsubscribing subscriber at arbitrary index isolates only that subscriber', () => {
    fc.assert(
      fc.property(
        arbEventSubject,
        fc.integer({ min: 2, max: 10 }),
        arbPayload,
        (descriptor, n, payload) => {
          const { subject } = descriptor;
          // Pick a random index to unsubscribe
          const unsubIdx = fc.sample(fc.integer({ min: 0, max: n - 1 }), 1)[0];
          const callbacks: number[] = Array.from({ length: n }, () => 0);

          const subs = callbacks.map((_, i) =>
            subject.subscribe(() => {
              callbacks[i]++;
            })
          );

          subs[unsubIdx].unsubscribe();
          subs.forEach((s, i) => {
            if (i !== unsubIdx) subscriptions.push(s);
          });

          subject.next(payload);

          expect(callbacks[unsubIdx]).toBe(0);
          for (let i = 0; i < n; i++) {
            if (i !== unsubIdx) {
              expect(callbacks[i]).toBe(1);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // ---------- Multiple unsubscribes from N ----------

  /**
   * **Validates: Requirements 7.2**
   *
   * Unsubscribing K of N subscribers means exactly N-K callbacks on emission.
   */
  it('unsubscribing K of N subscribers yields exactly N-K callbacks', () => {
    fc.assert(
      fc.property(
        arbEventSubject,
        fc.integer({ min: 2, max: 15 }),
        arbPayload,
        (descriptor, n, payload) => {
          const { subject } = descriptor;
          const k = fc.sample(fc.integer({ min: 1, max: n - 1 }), 1)[0];
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
          // Keep remaining for cleanup
          subscriptions.push(...subs.slice(k));

          subject.next(payload);

          expect(callbackCount).toBe(n - k);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ==================== DestroyRef-Based Cleanup Isolation ====================

/** Arbitrary for picking a typed DestroyRef pair descriptor. */
const arbTypedDestroyRefPair = fc.constantFrom(...ALL_TYPED_DESTROYREF_PAIRS);

describe('DestroyRef-Based Cleanup Isolation (Correctness Properties #3, #4)', () => {
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
   * **Validates: Requirements 3 (DestroyRef cleanup)**
   *
   * After DestroyRef fires, the subscription returned by the typed subscribe
   * helper is closed (subscription.closed === true).
   */
  it('subscription.closed === true after DestroyRef fires', () => {
    fc.assert(
      fc.property(arbTypedDestroyRefPair, pair => {
        const destroyRef = createMockDestroyRef();
        const sub = pair.subscribeFn(() => {}, destroyRef);

        expect(sub.closed).toBe(false);

        destroyRef.triggerDestroy();

        expect(sub.closed).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 3 (DestroyRef cleanup)**
   *
   * After DestroyRef fires, emitting via typed publish delivers zero callbacks
   * to the destroyed subscription.
   */
  it('zero callbacks after DestroyRef fires and typed publish emits', () => {
    fc.assert(
      fc.property(arbTypedDestroyRefPair, pair => {
        const destroyRef = createMockDestroyRef();
        let callCount = 0;

        pair.subscribeFn(() => {
          callCount++;
        }, destroyRef);

        destroyRef.triggerDestroy();

        pair.publishFn({ id: 'post-destroy' });

        expect(callCount).toBe(0);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 4 (Idempotent unsubscribe)**
   *
   * Calling subscription.unsubscribe() before DestroyRef fires, then
   * triggering destroy, does not throw.
   */
  it('unsubscribe before destroy then destroy does not throw', () => {
    fc.assert(
      fc.property(arbTypedDestroyRefPair, pair => {
        const destroyRef = createMockDestroyRef();
        const sub = pair.subscribeFn(() => {}, destroyRef);

        sub.unsubscribe();

        expect(() => destroyRef.triggerDestroy()).not.toThrow();
        expect(sub.closed).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 3 (DestroyRef cleanup)**
   *
   * With N typed subscriptions using the same DestroyRef, triggering destroy
   * closes all N subscriptions and subsequent publish delivers zero callbacks.
   */
  it('N subscriptions with same DestroyRef all close on destroy', () => {
    fc.assert(
      fc.property(arbTypedDestroyRefPair, fc.integer({ min: 1, max: 10 }), (pair, n) => {
        const destroyRef = createMockDestroyRef();
        let totalCallbacks = 0;

        const subs = Array.from({ length: n }, () =>
          pair.subscribeFn(() => {
            totalCallbacks++;
          }, destroyRef)
        );

        destroyRef.triggerDestroy();

        pair.publishFn({ id: 'post-destroy-n' });

        expect(totalCallbacks).toBe(0);
        for (const sub of subs) {
          expect(sub.closed).toBe(true);
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 3 (DestroyRef cleanup)**
   *
   * Destroying one subscription's DestroyRef does not affect another
   * subscription using a different DestroyRef on the same typed pair.
   */
  it('destroying one DestroyRef does not affect subscriptions with a different DestroyRef', () => {
    fc.assert(
      fc.property(arbTypedDestroyRefPair, pair => {
        const destroyRef1 = createMockDestroyRef();
        const destroyRef2 = createMockDestroyRef();
        let callCount1 = 0;
        let callCount2 = 0;

        const sub1 = pair.subscribeFn(() => {
          callCount1++;
        }, destroyRef1);
        const sub2 = pair.subscribeFn(() => {
          callCount2++;
        }, destroyRef2);
        subscriptions.push(sub2);

        // Destroy only the first
        destroyRef1.triggerDestroy();

        pair.publishFn({ id: 'isolation-test' });

        expect(sub1.closed).toBe(true);
        expect(callCount1).toBe(0);
        expect(sub2.closed).toBe(false);
        expect(callCount2).toBe(1);
      }),
      { numRuns: 100 }
    );
  });
});
