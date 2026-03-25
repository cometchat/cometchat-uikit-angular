/**
 * CometChatCallEvents Tests
 *
 * Categories: Subscribe/Emit, Unsubscribe, Multiple Subscribers,
 *             No-Subscriber Emission, Event Type Isolation, Null Payloads
 *
 * Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5, 14.4, 14.5, 15.7
 *
 * Tests the static Subject-based event bus for call events:
 * - subscribe/emit delivery for all four call event subjects
 * - unsubscribe prevents delivery
 * - multiple subscribers each receive the emitted value
 * - no error on emit with no subscribers
 * - event type isolation (subscribing to one does not receive from another)
 * - null/undefined payload handling
 */
import { DestroyRef } from '@angular/core';
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { Subscription } from 'rxjs';
import { ensureSdkReady, sdkCleanup } from '../test-setup';
import { CometChatCallEvents } from './CometChatCallEvents';

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

function createMockCall(overrides: Record<string, unknown> = {}): any {
  return {
    getSessionId: () => overrides['sessionId'] ?? 'session-1',
    getType: () => overrides['type'] ?? 'audio',
    getStatus: () => overrides['status'] ?? 'initiated',
    getSender: () => overrides['sender'] ?? { getUid: () => 'user-1', getName: () => 'Caller' },
    getReceiver: () => overrides['receiver'] ?? { getUid: () => 'user-2', getName: () => 'Callee' },
    getReceiverType: () => overrides['receiverType'] ?? 'user',
    ...overrides,
  };
}

describe('CometChatCallEvents', () => {
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

  // ─── Subscribe / Emit ────────────────────────────────────────────

  describe('Subscribe/Emit', () => {
    it('should deliver ccOutgoingCall payloads to subscriber', () => {
      const received: any[] = [];
      const sub = CometChatCallEvents.ccOutgoingCall.subscribe(v => received.push(v));
      subscriptions.push(sub);

      const call = createMockCall({ status: 'initiated' });
      CometChatCallEvents.ccOutgoingCall.next(call);

      expect(received).toHaveLength(1);
      expect(received[0]).toBe(call);
    });

    it('should deliver ccCallAccepted payloads to subscriber', () => {
      const received: any[] = [];
      const sub = CometChatCallEvents.ccCallAccepted.subscribe(v => received.push(v));
      subscriptions.push(sub);

      const call = createMockCall({ status: 'accepted' });
      CometChatCallEvents.ccCallAccepted.next(call);

      expect(received).toHaveLength(1);
      expect(received[0]).toBe(call);
    });

    it('should deliver ccCallRejected payloads to subscriber', () => {
      const received: any[] = [];
      const sub = CometChatCallEvents.ccCallRejected.subscribe(v => received.push(v));
      subscriptions.push(sub);

      const call = createMockCall({ status: 'rejected' });
      CometChatCallEvents.ccCallRejected.next(call);

      expect(received).toHaveLength(1);
      expect(received[0]).toBe(call);
    });

    it('should deliver ccCallEnded payloads to subscriber', () => {
      const received: any[] = [];
      const sub = CometChatCallEvents.ccCallEnded.subscribe(v => received.push(v));
      subscriptions.push(sub);

      const call = createMockCall({ status: 'ended' });
      CometChatCallEvents.ccCallEnded.next(call);

      expect(received).toHaveLength(1);
      expect(received[0]).toBe(call);
    });

    it('should not deliver prior emissions to new subscribers (Subject behavior)', () => {
      const call = createMockCall();
      CometChatCallEvents.ccOutgoingCall.next(call);

      const received: any[] = [];
      const sub = CometChatCallEvents.ccOutgoingCall.subscribe(v => received.push(v));
      subscriptions.push(sub);

      expect(received).toHaveLength(0);
    });

    it('should deliver multiple sequential emissions in order', () => {
      const received: any[] = [];
      const sub = CometChatCallEvents.ccCallAccepted.subscribe(v => received.push(v));
      subscriptions.push(sub);

      const call1 = createMockCall({ sessionId: 's-1' });
      const call2 = createMockCall({ sessionId: 's-2' });
      CometChatCallEvents.ccCallAccepted.next(call1);
      CometChatCallEvents.ccCallAccepted.next(call2);

      expect(received).toHaveLength(2);
      expect(received[0]).toBe(call1);
      expect(received[1]).toBe(call2);
    });
  });

  // ─── Unsubscribe ───────────────────────────────────────────────────

  describe('Unsubscribe', () => {
    it('should stop receiving ccCallAccepted after unsubscribe', () => {
      const received: any[] = [];
      const sub = CometChatCallEvents.ccCallAccepted.subscribe(v => received.push(v));

      CometChatCallEvents.ccCallAccepted.next(createMockCall());
      expect(received).toHaveLength(1);

      sub.unsubscribe();

      CometChatCallEvents.ccCallAccepted.next(createMockCall());
      expect(received).toHaveLength(1);
    });

    it('should stop receiving ccOutgoingCall after unsubscribe', () => {
      const received: any[] = [];
      const sub = CometChatCallEvents.ccOutgoingCall.subscribe(v => received.push(v));

      CometChatCallEvents.ccOutgoingCall.next(createMockCall());
      expect(received).toHaveLength(1);

      sub.unsubscribe();

      CometChatCallEvents.ccOutgoingCall.next(createMockCall());
      expect(received).toHaveLength(1);
    });

    it('should not affect other subscribers when one unsubscribes', () => {
      const receivedA: any[] = [];
      const receivedB: any[] = [];
      const subA = CometChatCallEvents.ccCallEnded.subscribe(v => receivedA.push(v));
      const subB = CometChatCallEvents.ccCallEnded.subscribe(v => receivedB.push(v));
      subscriptions.push(subB);

      CometChatCallEvents.ccCallEnded.next(createMockCall());
      expect(receivedA).toHaveLength(1);
      expect(receivedB).toHaveLength(1);

      subA.unsubscribe();

      CometChatCallEvents.ccCallEnded.next(createMockCall());
      expect(receivedA).toHaveLength(1);
      expect(receivedB).toHaveLength(2);
    });
  });

  // ─── Multiple Subscribers ──────────────────────────────────────────

  describe('Multiple Subscribers', () => {
    it('should deliver to multiple subscribers simultaneously', () => {
      const receivedA: any[] = [];
      const receivedB: any[] = [];
      const receivedC: any[] = [];
      const subA = CometChatCallEvents.ccCallAccepted.subscribe(v => receivedA.push(v));
      const subB = CometChatCallEvents.ccCallAccepted.subscribe(v => receivedB.push(v));
      const subC = CometChatCallEvents.ccCallAccepted.subscribe(v => receivedC.push(v));
      subscriptions.push(subA, subB, subC);

      const call = createMockCall();
      CometChatCallEvents.ccCallAccepted.next(call);

      expect(receivedA).toHaveLength(1);
      expect(receivedB).toHaveLength(1);
      expect(receivedC).toHaveLength(1);
      expect(receivedA[0]).toBe(call);
      expect(receivedB[0]).toBe(call);
      expect(receivedC[0]).toBe(call);
    });
  });

  // ─── No-Subscriber Emission ────────────────────────────────────────

  describe('No-Subscriber Emission', () => {
    it('should not throw when emitting ccOutgoingCall with no subscribers', () => {
      expect(() => CometChatCallEvents.ccOutgoingCall.next(createMockCall())).not.toThrow();
    });

    it('should not throw when emitting ccCallAccepted with no subscribers', () => {
      expect(() => CometChatCallEvents.ccCallAccepted.next(createMockCall())).not.toThrow();
    });

    it('should not throw when emitting ccCallRejected with no subscribers', () => {
      expect(() => CometChatCallEvents.ccCallRejected.next(createMockCall())).not.toThrow();
    });

    it('should not throw when emitting ccCallEnded with no subscribers', () => {
      expect(() => CometChatCallEvents.ccCallEnded.next(createMockCall())).not.toThrow();
    });
  });

  // ─── Event Type Isolation ──────────────────────────────────────────

  describe('Event Type Isolation', () => {
    it('should not deliver ccOutgoingCall emissions to ccCallAccepted subscriber', () => {
      const received: any[] = [];
      const sub = CometChatCallEvents.ccCallAccepted.subscribe(v => received.push(v));
      subscriptions.push(sub);

      CometChatCallEvents.ccOutgoingCall.next(createMockCall());

      expect(received).toHaveLength(0);
    });

    it('should not deliver ccCallRejected emissions to ccCallEnded subscriber', () => {
      const received: any[] = [];
      const sub = CometChatCallEvents.ccCallEnded.subscribe(v => received.push(v));
      subscriptions.push(sub);

      CometChatCallEvents.ccCallRejected.next(createMockCall());

      expect(received).toHaveLength(0);
    });

    it('should isolate all four event types from each other', () => {
      const outgoing: any[] = [];
      const accepted: any[] = [];
      const rejected: any[] = [];
      const ended: any[] = [];

      subscriptions.push(
        CometChatCallEvents.ccOutgoingCall.subscribe(v => outgoing.push(v)),
        CometChatCallEvents.ccCallAccepted.subscribe(v => accepted.push(v)),
        CometChatCallEvents.ccCallRejected.subscribe(v => rejected.push(v)),
        CometChatCallEvents.ccCallEnded.subscribe(v => ended.push(v))
      );

      CometChatCallEvents.ccOutgoingCall.next(createMockCall({ sessionId: 'out' }));

      expect(outgoing).toHaveLength(1);
      expect(accepted).toHaveLength(0);
      expect(rejected).toHaveLength(0);
      expect(ended).toHaveLength(0);
    });
  });

  // ─── Null / Undefined Payload Handling ─────────────────────────────

  describe('Null Payload Handling', () => {
    it('should deliver null payload on ccCallAccepted without error', () => {
      const received: any[] = [];
      const sub = CometChatCallEvents.ccCallAccepted.subscribe(v => received.push(v));
      subscriptions.push(sub);

      CometChatCallEvents.ccCallAccepted.next(null as any);

      expect(received).toHaveLength(1);
      expect(received[0]).toBeNull();
    });

    it('should deliver undefined payload on ccOutgoingCall without error', () => {
      const received: any[] = [];
      const sub = CometChatCallEvents.ccOutgoingCall.subscribe(v => received.push(v));
      subscriptions.push(sub);

      CometChatCallEvents.ccOutgoingCall.next(undefined as any);

      expect(received).toHaveLength(1);
      expect(received[0]).toBeUndefined();
    });
  });

  // ─── Typed Publish Methods ─────────────────────────────────────────

  describe('Typed Publish Methods', () => {
    it('publishOutgoingCall should emit on ccOutgoingCall', () => {
      const received: any[] = [];
      const sub = CometChatCallEvents.ccOutgoingCall.subscribe(v => received.push(v));
      subscriptions.push(sub);

      const call = createMockCall({ status: 'initiated' });
      CometChatCallEvents.publishOutgoingCall(call);

      expect(received).toHaveLength(1);
      expect(received[0]).toBe(call);
    });

    it('publishCallAccepted should emit on ccCallAccepted', () => {
      const received: any[] = [];
      const sub = CometChatCallEvents.ccCallAccepted.subscribe(v => received.push(v));
      subscriptions.push(sub);

      const call = createMockCall({ status: 'accepted' });
      CometChatCallEvents.publishCallAccepted(call);

      expect(received).toHaveLength(1);
      expect(received[0]).toBe(call);
    });

    it('publishCallRejected should emit on ccCallRejected', () => {
      const received: any[] = [];
      const sub = CometChatCallEvents.ccCallRejected.subscribe(v => received.push(v));
      subscriptions.push(sub);

      const call = createMockCall({ status: 'rejected' });
      CometChatCallEvents.publishCallRejected(call);

      expect(received).toHaveLength(1);
      expect(received[0]).toBe(call);
    });

    it('publishCallEnded should emit on ccCallEnded', () => {
      const received: any[] = [];
      const sub = CometChatCallEvents.ccCallEnded.subscribe(v => received.push(v));
      subscriptions.push(sub);

      const call = createMockCall({ status: 'ended' });
      CometChatCallEvents.publishCallEnded(call);

      expect(received).toHaveLength(1);
      expect(received[0]).toBe(call);
    });

    it('should not throw when typed publish is called with no subscribers', () => {
      expect(() => CometChatCallEvents.publishOutgoingCall(createMockCall())).not.toThrow();
      expect(() => CometChatCallEvents.publishCallAccepted(createMockCall())).not.toThrow();
      expect(() => CometChatCallEvents.publishCallRejected(createMockCall())).not.toThrow();
      expect(() => CometChatCallEvents.publishCallEnded(createMockCall())).not.toThrow();
    });
  });

  // ─── Subscribe Helpers with DestroyRef ─────────────────────────────

  describe('Subscribe Helpers with DestroyRef', () => {
    it('onOutgoingCall should receive emitted values', () => {
      const received: any[] = [];
      const sub = CometChatCallEvents.onOutgoingCall(v => received.push(v));
      subscriptions.push(sub);

      const call = createMockCall({ status: 'initiated' });
      CometChatCallEvents.ccOutgoingCall.next(call);

      expect(received).toHaveLength(1);
      expect(received[0]).toBe(call);
    });

    it('onCallAccepted should receive emitted values', () => {
      const received: any[] = [];
      const sub = CometChatCallEvents.onCallAccepted(v => received.push(v));
      subscriptions.push(sub);

      const call = createMockCall({ status: 'accepted' });
      CometChatCallEvents.ccCallAccepted.next(call);

      expect(received).toHaveLength(1);
      expect(received[0]).toBe(call);
    });

    it('onCallRejected should receive emitted values', () => {
      const received: any[] = [];
      const sub = CometChatCallEvents.onCallRejected(v => received.push(v));
      subscriptions.push(sub);

      const call = createMockCall({ status: 'rejected' });
      CometChatCallEvents.ccCallRejected.next(call);

      expect(received).toHaveLength(1);
      expect(received[0]).toBe(call);
    });

    it('onCallEnded should receive emitted values', () => {
      const received: any[] = [];
      const sub = CometChatCallEvents.onCallEnded(v => received.push(v));
      subscriptions.push(sub);

      const call = createMockCall({ status: 'ended' });
      CometChatCallEvents.ccCallEnded.next(call);

      expect(received).toHaveLength(1);
      expect(received[0]).toBe(call);
    });

    it('should close subscription when DestroyRef is triggered', () => {
      const destroyRef = createMockDestroyRef();
      const received: any[] = [];
      const sub = CometChatCallEvents.onOutgoingCall(v => received.push(v), destroyRef);

      CometChatCallEvents.ccOutgoingCall.next(createMockCall());
      expect(received).toHaveLength(1);
      expect(sub.closed).toBe(false);

      destroyRef.triggerDestroy();
      expect(sub.closed).toBe(true);

      CometChatCallEvents.ccOutgoingCall.next(createMockCall());
      expect(received).toHaveLength(1);
    });

    it('should keep subscription open when no DestroyRef is provided', () => {
      const received: any[] = [];
      const sub = CometChatCallEvents.onOutgoingCall(v => received.push(v));
      subscriptions.push(sub);

      CometChatCallEvents.ccOutgoingCall.next(createMockCall());
      CometChatCallEvents.ccOutgoingCall.next(createMockCall());

      expect(received).toHaveLength(2);
      expect(sub.closed).toBe(false);
    });
  });
});
