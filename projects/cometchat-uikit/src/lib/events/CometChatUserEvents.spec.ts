/**
 * CometChatUserEvents Tests
 *
 * Categories: Subscribe/Emit, Unsubscribe, Multiple Subscribers,
 *             No-Subscriber Emission, Event Type Isolation, Null Payloads,
 *             publishEvent Helper
 *
 * Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5, 14.4, 14.5, 15.7
 *
 * Tests the static Subject-based event bus for user events:
 * - subscribe/emit delivery for ccUserBlocked and ccUserUnblocked
 * - unsubscribe prevents delivery
 * - multiple subscribers each receive the emitted value
 * - no error on emit with no subscribers
 * - event type isolation (subscribing to one does not receive from another)
 * - null/undefined payload handling
 * - publishEvent() static helper method
 */
import { DestroyRef } from '@angular/core';
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { Subscription } from 'rxjs';
import { ensureSdkReady, sdkCleanup } from '../test-setup';
import { CometChatUserEvents } from './CometChatUserEvents';

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

function createMockUser(overrides: Record<string, unknown> = {}): any {
  return {
    getUid: () => overrides['uid'] ?? 'user-1',
    getName: () => overrides['name'] ?? 'Test User',
    getAvatar: () => overrides['avatar'] ?? 'https://example.com/avatar.png',
    getStatus: () => overrides['status'] ?? 'online',
    ...overrides,
  };
}

describe('CometChatUserEvents', () => {
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
    it('should deliver ccUserBlocked payloads to subscriber', () => {
      const received: any[] = [];
      const sub = CometChatUserEvents.ccUserBlocked.subscribe(v => received.push(v));
      subscriptions.push(sub);

      const user = createMockUser({ uid: 'blocked-user' });
      CometChatUserEvents.ccUserBlocked.next(user);

      expect(received).toHaveLength(1);
      expect(received[0]).toBe(user);
    });

    it('should deliver ccUserUnblocked payloads to subscriber', () => {
      const received: any[] = [];
      const sub = CometChatUserEvents.ccUserUnblocked.subscribe(v => received.push(v));
      subscriptions.push(sub);

      const user = createMockUser({ uid: 'unblocked-user' });
      CometChatUserEvents.ccUserUnblocked.next(user);

      expect(received).toHaveLength(1);
      expect(received[0]).toBe(user);
    });

    it('should not deliver prior emissions to new subscribers (Subject behavior)', () => {
      const user = createMockUser();
      CometChatUserEvents.ccUserBlocked.next(user);

      const received: any[] = [];
      const sub = CometChatUserEvents.ccUserBlocked.subscribe(v => received.push(v));
      subscriptions.push(sub);

      expect(received).toHaveLength(0);
    });

    it('should deliver multiple sequential emissions in order', () => {
      const received: any[] = [];
      const sub = CometChatUserEvents.ccUserUnblocked.subscribe(v => received.push(v));
      subscriptions.push(sub);

      const u1 = createMockUser({ uid: 'user-1' });
      const u2 = createMockUser({ uid: 'user-2' });
      CometChatUserEvents.ccUserUnblocked.next(u1);
      CometChatUserEvents.ccUserUnblocked.next(u2);

      expect(received).toHaveLength(2);
      expect(received[0]).toBe(u1);
      expect(received[1]).toBe(u2);
    });
  });

  // ─── publishEvent() Helper ─────────────────────────────────────────

  describe('publishEvent()', () => {
    it('should emit the user on ccUserBlocked via publishEvent', () => {
      const received: any[] = [];
      const sub = CometChatUserEvents.ccUserBlocked.subscribe(v => received.push(v));
      subscriptions.push(sub);

      const user = createMockUser();
      CometChatUserEvents.publishEvent(CometChatUserEvents.ccUserBlocked, user);

      expect(received).toHaveLength(1);
      expect(received[0]).toBe(user);
    });

    it('should emit the user on ccUserUnblocked via publishEvent', () => {
      const received: any[] = [];
      const sub = CometChatUserEvents.ccUserUnblocked.subscribe(v => received.push(v));
      subscriptions.push(sub);

      const user = createMockUser({ uid: 'unblocked-via-helper' });
      CometChatUserEvents.publishEvent(CometChatUserEvents.ccUserUnblocked, user);

      expect(received).toHaveLength(1);
      expect(received[0]).toBe(user);
    });
  });

  // ─── Unsubscribe ───────────────────────────────────────────────────

  describe('Unsubscribe', () => {
    it('should stop receiving ccUserBlocked after unsubscribe', () => {
      const received: any[] = [];
      const sub = CometChatUserEvents.ccUserBlocked.subscribe(v => received.push(v));

      CometChatUserEvents.ccUserBlocked.next(createMockUser());
      expect(received).toHaveLength(1);

      sub.unsubscribe();

      CometChatUserEvents.ccUserBlocked.next(createMockUser());
      expect(received).toHaveLength(1);
    });

    it('should stop receiving ccUserUnblocked after unsubscribe', () => {
      const received: any[] = [];
      const sub = CometChatUserEvents.ccUserUnblocked.subscribe(v => received.push(v));

      CometChatUserEvents.ccUserUnblocked.next(createMockUser());
      expect(received).toHaveLength(1);

      sub.unsubscribe();

      CometChatUserEvents.ccUserUnblocked.next(createMockUser());
      expect(received).toHaveLength(1);
    });

    it('should not affect other subscribers when one unsubscribes', () => {
      const receivedA: any[] = [];
      const receivedB: any[] = [];
      const subA = CometChatUserEvents.ccUserBlocked.subscribe(v => receivedA.push(v));
      const subB = CometChatUserEvents.ccUserBlocked.subscribe(v => receivedB.push(v));
      subscriptions.push(subB);

      CometChatUserEvents.ccUserBlocked.next(createMockUser());
      expect(receivedA).toHaveLength(1);
      expect(receivedB).toHaveLength(1);

      subA.unsubscribe();

      CometChatUserEvents.ccUserBlocked.next(createMockUser());
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
      const subA = CometChatUserEvents.ccUserBlocked.subscribe(v => receivedA.push(v));
      const subB = CometChatUserEvents.ccUserBlocked.subscribe(v => receivedB.push(v));
      const subC = CometChatUserEvents.ccUserBlocked.subscribe(v => receivedC.push(v));
      subscriptions.push(subA, subB, subC);

      const user = createMockUser();
      CometChatUserEvents.ccUserBlocked.next(user);

      expect(receivedA).toHaveLength(1);
      expect(receivedB).toHaveLength(1);
      expect(receivedC).toHaveLength(1);
      expect(receivedA[0]).toBe(user);
      expect(receivedB[0]).toBe(user);
      expect(receivedC[0]).toBe(user);
    });

    it('should deliver same reference to all ccUserUnblocked subscribers', () => {
      const receivedA: any[] = [];
      const receivedB: any[] = [];
      const subA = CometChatUserEvents.ccUserUnblocked.subscribe(v => receivedA.push(v));
      const subB = CometChatUserEvents.ccUserUnblocked.subscribe(v => receivedB.push(v));
      subscriptions.push(subA, subB);

      const user = createMockUser({ uid: 'shared-ref' });
      CometChatUserEvents.ccUserUnblocked.next(user);

      expect(receivedA[0]).toBe(receivedB[0]);
    });
  });

  // ─── No-Subscriber Emission ────────────────────────────────────────

  describe('No-Subscriber Emission', () => {
    it('should not throw when emitting ccUserBlocked with no subscribers', () => {
      expect(() => CometChatUserEvents.ccUserBlocked.next(createMockUser())).not.toThrow();
    });

    it('should not throw when emitting ccUserUnblocked with no subscribers', () => {
      expect(() => CometChatUserEvents.ccUserUnblocked.next(createMockUser())).not.toThrow();
    });

    it('should not throw when using publishEvent with no subscribers', () => {
      expect(() =>
        CometChatUserEvents.publishEvent(CometChatUserEvents.ccUserBlocked, createMockUser())
      ).not.toThrow();
    });
  });

  // ─── Event Type Isolation ──────────────────────────────────────────

  describe('Event Type Isolation', () => {
    it('should not deliver ccUserBlocked emissions to ccUserUnblocked subscriber', () => {
      const received: any[] = [];
      const sub = CometChatUserEvents.ccUserUnblocked.subscribe(v => received.push(v));
      subscriptions.push(sub);

      CometChatUserEvents.ccUserBlocked.next(createMockUser());

      expect(received).toHaveLength(0);
    });

    it('should not deliver ccUserUnblocked emissions to ccUserBlocked subscriber', () => {
      const received: any[] = [];
      const sub = CometChatUserEvents.ccUserBlocked.subscribe(v => received.push(v));
      subscriptions.push(sub);

      CometChatUserEvents.ccUserUnblocked.next(createMockUser());

      expect(received).toHaveLength(0);
    });

    it('should isolate both event types from each other', () => {
      const blocked: any[] = [];
      const unblocked: any[] = [];

      subscriptions.push(
        CometChatUserEvents.ccUserBlocked.subscribe(v => blocked.push(v)),
        CometChatUserEvents.ccUserUnblocked.subscribe(v => unblocked.push(v))
      );

      CometChatUserEvents.ccUserBlocked.next(createMockUser({ uid: 'blocked-only' }));

      expect(blocked).toHaveLength(1);
      expect(unblocked).toHaveLength(0);

      CometChatUserEvents.ccUserUnblocked.next(createMockUser({ uid: 'unblocked-only' }));

      expect(blocked).toHaveLength(1);
      expect(unblocked).toHaveLength(1);
    });
  });

  // ─── Null / Undefined Payload Handling ─────────────────────────────

  describe('Null Payload Handling', () => {
    it('should deliver null payload on ccUserBlocked without error', () => {
      const received: any[] = [];
      const sub = CometChatUserEvents.ccUserBlocked.subscribe(v => received.push(v));
      subscriptions.push(sub);

      CometChatUserEvents.ccUserBlocked.next(null as any);

      expect(received).toHaveLength(1);
      expect(received[0]).toBeNull();
    });

    it('should deliver null payload on ccUserUnblocked without error', () => {
      const received: any[] = [];
      const sub = CometChatUserEvents.ccUserUnblocked.subscribe(v => received.push(v));
      subscriptions.push(sub);

      CometChatUserEvents.ccUserUnblocked.next(null as any);

      expect(received).toHaveLength(1);
      expect(received[0]).toBeNull();
    });

    it('should deliver undefined payload on ccUserBlocked without error', () => {
      const received: any[] = [];
      const sub = CometChatUserEvents.ccUserBlocked.subscribe(v => received.push(v));
      subscriptions.push(sub);

      CometChatUserEvents.ccUserBlocked.next(undefined as any);

      expect(received).toHaveLength(1);
      expect(received[0]).toBeUndefined();
    });

    it('should deliver null via publishEvent without error', () => {
      const received: any[] = [];
      const sub = CometChatUserEvents.ccUserBlocked.subscribe(v => received.push(v));
      subscriptions.push(sub);

      CometChatUserEvents.publishEvent(CometChatUserEvents.ccUserBlocked, null as any);

      expect(received).toHaveLength(1);
      expect(received[0]).toBeNull();
    });
  });

  // ─── Typed Publish Methods ─────────────────────────────────────────

  describe('Typed Publish Methods', () => {
    it('publishUserBlocked should emit on ccUserBlocked', () => {
      const received: any[] = [];
      const sub = CometChatUserEvents.ccUserBlocked.subscribe(v => received.push(v));
      subscriptions.push(sub);

      const user = createMockUser({ uid: 'blocked-user' });
      CometChatUserEvents.publishUserBlocked(user);

      expect(received).toHaveLength(1);
      expect(received[0]).toBe(user);
    });

    it('publishUserUnblocked should emit on ccUserUnblocked', () => {
      const received: any[] = [];
      const sub = CometChatUserEvents.ccUserUnblocked.subscribe(v => received.push(v));
      subscriptions.push(sub);

      const user = createMockUser({ uid: 'unblocked-user' });
      CometChatUserEvents.publishUserUnblocked(user);

      expect(received).toHaveLength(1);
      expect(received[0]).toBe(user);
    });

    it('should not throw when typed publish is called with no subscribers', () => {
      expect(() => CometChatUserEvents.publishUserBlocked(createMockUser())).not.toThrow();
      expect(() => CometChatUserEvents.publishUserUnblocked(createMockUser())).not.toThrow();
    });
  });

  // ─── Subscribe Helpers with DestroyRef ─────────────────────────────

  describe('Subscribe Helpers with DestroyRef', () => {
    it('onUserBlocked should receive emitted values', () => {
      const received: any[] = [];
      const sub = CometChatUserEvents.onUserBlocked(v => received.push(v));
      subscriptions.push(sub);

      const user = createMockUser({ uid: 'blocked-user' });
      CometChatUserEvents.ccUserBlocked.next(user);

      expect(received).toHaveLength(1);
      expect(received[0]).toBe(user);
    });

    it('onUserUnblocked should receive emitted values', () => {
      const received: any[] = [];
      const sub = CometChatUserEvents.onUserUnblocked(v => received.push(v));
      subscriptions.push(sub);

      const user = createMockUser({ uid: 'unblocked-user' });
      CometChatUserEvents.ccUserUnblocked.next(user);

      expect(received).toHaveLength(1);
      expect(received[0]).toBe(user);
    });

    it('should close subscription when DestroyRef is triggered', () => {
      const destroyRef = createMockDestroyRef();
      const received: any[] = [];
      const sub = CometChatUserEvents.onUserBlocked(v => received.push(v), destroyRef);

      CometChatUserEvents.ccUserBlocked.next(createMockUser());
      expect(received).toHaveLength(1);
      expect(sub.closed).toBe(false);

      destroyRef.triggerDestroy();
      expect(sub.closed).toBe(true);

      CometChatUserEvents.ccUserBlocked.next(createMockUser());
      expect(received).toHaveLength(1);
    });

    it('should keep subscription open when no DestroyRef is provided', () => {
      const received: any[] = [];
      const sub = CometChatUserEvents.onUserBlocked(v => received.push(v));
      subscriptions.push(sub);

      CometChatUserEvents.ccUserBlocked.next(createMockUser());
      CometChatUserEvents.ccUserBlocked.next(createMockUser());

      expect(received).toHaveLength(2);
      expect(sub.closed).toBe(false);
    });
  });
});
