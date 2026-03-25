/**
 * CometChatConversationEvents Tests
 *
 * Categories: Subscribe/Emit, Unsubscribe, Multiple Subscribers,
 *             No-Subscriber Emission, Event Type Isolation, publishEvent Helper,
 *             Null Payloads
 *
 * Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5, 14.4, 14.5, 15.7
 *
 * Tests the static Subject-based event bus for conversation events:
 * - subscribe/emit delivery for ccConversationDeleted
 * - publishEvent() helper method
 * - unsubscribe prevents delivery
 * - multiple subscribers each receive the emitted value
 * - no error on emit with no subscribers
 * - event type isolation (conversation events do not cross-deliver with other event modules)
 * - null/undefined payload handling
 */
import { DestroyRef } from '@angular/core';
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { Subject, Subscription } from 'rxjs';
import { ensureSdkReady, sdkCleanup } from '../test-setup';
import { CometChatConversationEvents } from './CometChatConversationEvents';

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

function createMockConversation(overrides: Record<string, unknown> = {}): any {
  return {
    getConversationId: () => overrides['conversationId'] ?? 'conv-1',
    getConversationType: () => overrides['conversationType'] ?? 'user',
    getConversationWith: () =>
      overrides['conversationWith'] ?? {
        getUid: () => 'user-1',
        getName: () => 'Test User',
      },
    getLastMessage: () => overrides['lastMessage'] ?? null,
    getUnreadMessageCount: () => overrides['unreadMessageCount'] ?? 0,
    ...overrides,
  };
}

describe('CometChatConversationEvents', () => {
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
    it('should deliver ccConversationDeleted payloads to subscriber', () => {
      const received: any[] = [];
      const sub = CometChatConversationEvents.ccConversationDeleted.subscribe(v =>
        received.push(v)
      );
      subscriptions.push(sub);

      const conversation = createMockConversation();
      CometChatConversationEvents.ccConversationDeleted.next(conversation);

      expect(received).toHaveLength(1);
      expect(received[0]).toBe(conversation);
    });

    it('should not deliver prior emissions to new subscribers (Subject behavior)', () => {
      const conversation = createMockConversation();
      CometChatConversationEvents.ccConversationDeleted.next(conversation);

      const received: any[] = [];
      const sub = CometChatConversationEvents.ccConversationDeleted.subscribe(v =>
        received.push(v)
      );
      subscriptions.push(sub);

      expect(received).toHaveLength(0);
    });

    it('should deliver multiple sequential emissions in order', () => {
      const received: any[] = [];
      const sub = CometChatConversationEvents.ccConversationDeleted.subscribe(v =>
        received.push(v)
      );
      subscriptions.push(sub);

      const conv1 = createMockConversation({ conversationId: 'conv-1' });
      const conv2 = createMockConversation({ conversationId: 'conv-2' });
      CometChatConversationEvents.ccConversationDeleted.next(conv1);
      CometChatConversationEvents.ccConversationDeleted.next(conv2);

      expect(received).toHaveLength(2);
      expect(received[0]).toBe(conv1);
      expect(received[1]).toBe(conv2);
    });
  });

  // ─── publishEvent() helper ─────────────────────────────────────────

  describe('publishEvent()', () => {
    it('should emit the conversation on the given subject', () => {
      const received: any[] = [];
      const sub = CometChatConversationEvents.ccConversationDeleted.subscribe(v =>
        received.push(v)
      );
      subscriptions.push(sub);

      const conversation = createMockConversation();
      CometChatConversationEvents.publishEvent(
        CometChatConversationEvents.ccConversationDeleted,
        conversation
      );

      expect(received).toHaveLength(1);
      expect(received[0]).toBe(conversation);
    });

    it('should deliver to all active subscribers via publishEvent', () => {
      const receivedA: any[] = [];
      const receivedB: any[] = [];
      const subA = CometChatConversationEvents.ccConversationDeleted.subscribe(v =>
        receivedA.push(v)
      );
      const subB = CometChatConversationEvents.ccConversationDeleted.subscribe(v =>
        receivedB.push(v)
      );
      subscriptions.push(subA, subB);

      const conversation = createMockConversation({ conversationId: 'conv-pub' });
      CometChatConversationEvents.publishEvent(
        CometChatConversationEvents.ccConversationDeleted,
        conversation
      );

      expect(receivedA).toHaveLength(1);
      expect(receivedB).toHaveLength(1);
      expect(receivedA[0]).toBe(conversation);
    });

    it('should work with an external Subject passed to publishEvent', () => {
      const externalSubject = new Subject<any>();
      const received: any[] = [];
      const sub = externalSubject.subscribe(v => received.push(v));
      subscriptions.push(sub);

      const conversation = createMockConversation({ conversationId: 'ext-1' });
      CometChatConversationEvents.publishEvent(externalSubject, conversation);

      expect(received).toHaveLength(1);
      expect(received[0]).toBe(conversation);
    });
  });

  // ─── Unsubscribe ───────────────────────────────────────────────────

  describe('Unsubscribe', () => {
    it('should stop receiving ccConversationDeleted after unsubscribe', () => {
      const received: any[] = [];
      const sub = CometChatConversationEvents.ccConversationDeleted.subscribe(v =>
        received.push(v)
      );

      CometChatConversationEvents.ccConversationDeleted.next(createMockConversation());
      expect(received).toHaveLength(1);

      sub.unsubscribe();

      CometChatConversationEvents.ccConversationDeleted.next(createMockConversation());
      expect(received).toHaveLength(1);
    });

    it('should not affect other subscribers when one unsubscribes', () => {
      const receivedA: any[] = [];
      const receivedB: any[] = [];
      const subA = CometChatConversationEvents.ccConversationDeleted.subscribe(v =>
        receivedA.push(v)
      );
      const subB = CometChatConversationEvents.ccConversationDeleted.subscribe(v =>
        receivedB.push(v)
      );
      subscriptions.push(subB);

      CometChatConversationEvents.ccConversationDeleted.next(createMockConversation());
      expect(receivedA).toHaveLength(1);
      expect(receivedB).toHaveLength(1);

      subA.unsubscribe();

      CometChatConversationEvents.ccConversationDeleted.next(createMockConversation());
      expect(receivedA).toHaveLength(1);
      expect(receivedB).toHaveLength(2);
    });

    it('should stop receiving emissions via publishEvent after unsubscribe', () => {
      const received: any[] = [];
      const sub = CometChatConversationEvents.ccConversationDeleted.subscribe(v =>
        received.push(v)
      );

      CometChatConversationEvents.publishEvent(
        CometChatConversationEvents.ccConversationDeleted,
        createMockConversation()
      );
      expect(received).toHaveLength(1);

      sub.unsubscribe();

      CometChatConversationEvents.publishEvent(
        CometChatConversationEvents.ccConversationDeleted,
        createMockConversation()
      );
      expect(received).toHaveLength(1);
    });
  });

  // ─── Multiple Subscribers ──────────────────────────────────────────

  describe('Multiple Subscribers', () => {
    it('should deliver to three subscribers simultaneously', () => {
      const receivedA: any[] = [];
      const receivedB: any[] = [];
      const receivedC: any[] = [];
      const subA = CometChatConversationEvents.ccConversationDeleted.subscribe(v =>
        receivedA.push(v)
      );
      const subB = CometChatConversationEvents.ccConversationDeleted.subscribe(v =>
        receivedB.push(v)
      );
      const subC = CometChatConversationEvents.ccConversationDeleted.subscribe(v =>
        receivedC.push(v)
      );
      subscriptions.push(subA, subB, subC);

      const conversation = createMockConversation();
      CometChatConversationEvents.ccConversationDeleted.next(conversation);

      expect(receivedA).toHaveLength(1);
      expect(receivedB).toHaveLength(1);
      expect(receivedC).toHaveLength(1);
      expect(receivedA[0]).toBe(conversation);
      expect(receivedB[0]).toBe(conversation);
      expect(receivedC[0]).toBe(conversation);
    });
  });

  // ─── No-Subscriber Emission ────────────────────────────────────────

  describe('No-Subscriber Emission', () => {
    it('should not throw when emitting ccConversationDeleted with no subscribers', () => {
      expect(() =>
        CometChatConversationEvents.ccConversationDeleted.next(createMockConversation())
      ).not.toThrow();
    });

    it('should not throw when using publishEvent with no subscribers', () => {
      expect(() =>
        CometChatConversationEvents.publishEvent(
          CometChatConversationEvents.ccConversationDeleted,
          createMockConversation()
        )
      ).not.toThrow();
    });

    it('should not throw when emitting null with no subscribers', () => {
      expect(() =>
        CometChatConversationEvents.ccConversationDeleted.next(null as any)
      ).not.toThrow();
    });
  });

  // ─── Event Type Isolation ──────────────────────────────────────────

  describe('Event Type Isolation', () => {
    it('should not deliver ccConversationDeleted emissions to a separate Subject subscriber', () => {
      const otherSubject = new Subject<any>();
      const received: any[] = [];
      const sub = otherSubject.subscribe(v => received.push(v));
      subscriptions.push(sub);

      CometChatConversationEvents.ccConversationDeleted.next(createMockConversation());

      expect(received).toHaveLength(0);
    });

    it('should not deliver external Subject emissions to ccConversationDeleted subscriber', () => {
      const otherSubject = new Subject<any>();
      const received: any[] = [];
      const sub = CometChatConversationEvents.ccConversationDeleted.subscribe(v =>
        received.push(v)
      );
      subscriptions.push(sub);

      otherSubject.next(createMockConversation());

      expect(received).toHaveLength(0);
    });

    it('should isolate ccConversationDeleted from CometChatCallEvents subjects', async () => {
      const { CometChatCallEvents } = await import('./CometChatCallEvents');

      const conversationReceived: any[] = [];
      const callReceived: any[] = [];

      const subConv = CometChatConversationEvents.ccConversationDeleted.subscribe(v =>
        conversationReceived.push(v)
      );
      const subCall = CometChatCallEvents.ccOutgoingCall.subscribe(v => callReceived.push(v));
      subscriptions.push(subConv, subCall);

      // Emit on conversation — call subscriber should not receive
      CometChatConversationEvents.ccConversationDeleted.next(createMockConversation());
      expect(conversationReceived).toHaveLength(1);
      expect(callReceived).toHaveLength(0);

      // Emit on call — conversation subscriber should not receive
      CometChatCallEvents.ccOutgoingCall.next({} as any);
      expect(conversationReceived).toHaveLength(1);
      expect(callReceived).toHaveLength(1);
    });
  });

  // ─── Null / Undefined Payload Handling ─────────────────────────────

  describe('Null Payload Handling', () => {
    it('should deliver null payload on ccConversationDeleted without error', () => {
      const received: any[] = [];
      const sub = CometChatConversationEvents.ccConversationDeleted.subscribe(v =>
        received.push(v)
      );
      subscriptions.push(sub);

      CometChatConversationEvents.ccConversationDeleted.next(null as any);

      expect(received).toHaveLength(1);
      expect(received[0]).toBeNull();
    });

    it('should deliver undefined payload on ccConversationDeleted without error', () => {
      const received: any[] = [];
      const sub = CometChatConversationEvents.ccConversationDeleted.subscribe(v =>
        received.push(v)
      );
      subscriptions.push(sub);

      CometChatConversationEvents.ccConversationDeleted.next(undefined as any);

      expect(received).toHaveLength(1);
      expect(received[0]).toBeUndefined();
    });

    it('should deliver null via publishEvent without error', () => {
      const received: any[] = [];
      const sub = CometChatConversationEvents.ccConversationDeleted.subscribe(v =>
        received.push(v)
      );
      subscriptions.push(sub);

      CometChatConversationEvents.publishEvent(
        CometChatConversationEvents.ccConversationDeleted,
        null as any
      );

      expect(received).toHaveLength(1);
      expect(received[0]).toBeNull();
    });
  });

  // ─── Typed Publish Methods ─────────────────────────────────────────

  describe('Typed Publish Methods', () => {
    it('publishConversationDeleted should emit on ccConversationDeleted', () => {
      const received: any[] = [];
      const sub = CometChatConversationEvents.ccConversationDeleted.subscribe(v =>
        received.push(v)
      );
      subscriptions.push(sub);

      const conversation = createMockConversation();
      CometChatConversationEvents.publishConversationDeleted(conversation);

      expect(received).toHaveLength(1);
      expect(received[0]).toBe(conversation);
    });

    it('should not throw when typed publish is called with no subscribers', () => {
      expect(() =>
        CometChatConversationEvents.publishConversationDeleted(createMockConversation())
      ).not.toThrow();
    });
  });

  // ─── Subscribe Helpers with DestroyRef ─────────────────────────────

  describe('Subscribe Helpers with DestroyRef', () => {
    it('onConversationDeleted should receive emitted values', () => {
      const received: any[] = [];
      const sub = CometChatConversationEvents.onConversationDeleted(v => received.push(v));
      subscriptions.push(sub);

      const conversation = createMockConversation();
      CometChatConversationEvents.ccConversationDeleted.next(conversation);

      expect(received).toHaveLength(1);
      expect(received[0]).toBe(conversation);
    });

    it('should close subscription when DestroyRef is triggered', () => {
      const destroyRef = createMockDestroyRef();
      const received: any[] = [];
      const sub = CometChatConversationEvents.onConversationDeleted(
        v => received.push(v),
        destroyRef
      );

      CometChatConversationEvents.ccConversationDeleted.next(createMockConversation());
      expect(received).toHaveLength(1);
      expect(sub.closed).toBe(false);

      destroyRef.triggerDestroy();
      expect(sub.closed).toBe(true);

      CometChatConversationEvents.ccConversationDeleted.next(createMockConversation());
      expect(received).toHaveLength(1);
    });

    it('should keep subscription open when no DestroyRef is provided', () => {
      const received: any[] = [];
      const sub = CometChatConversationEvents.onConversationDeleted(v => received.push(v));
      subscriptions.push(sub);

      CometChatConversationEvents.ccConversationDeleted.next(createMockConversation());
      CometChatConversationEvents.ccConversationDeleted.next(createMockConversation());

      expect(received).toHaveLength(2);
      expect(sub.closed).toBe(false);
    });
  });
});
