/**
 * CometChatMessageEvents Tests
 *
 * Categories: Subscribe/Emit, Unsubscribe, Multiple Subscribers,
 *             No-Subscriber Emission, Event Type Isolation, Null Payloads,
 *             publishEvent Helper, SDK Wrapper Events,
 *             Typed Publish Methods, Subscribe Helpers with DestroyRef
 *
 * Validates: Requirements 1.1, 1.2, 1.4, 2.1, 2.2, 2.3, 2.4, 7.1, 7.2, 7.3, 7.4, 7.5, 14.4, 14.5, 15.7
 *
 * Tests the static Subject-based event bus for message events:
 * - subscribe/emit delivery for UI-level and SDK-wrapper subjects
 * - unsubscribe prevents delivery
 * - multiple subscribers each receive the emitted value
 * - no error on emit with no subscribers
 * - event type isolation (subscribing to one does not receive from another)
 * - null/undefined payload handling
 * - publishEvent() helper method
 * - typed publish methods emit on correct subjects
 * - subscribe helpers with optional DestroyRef auto-cleanup
 */
import { DestroyRef } from '@angular/core';
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { Subscription } from 'rxjs';
import { ensureSdkReady, sdkCleanup } from '../test-setup';
import { CometChatMessageEvents, IMessages } from './CometChatMessageEvents';
import { MessageStatus } from '../Enums/Enums';

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

function createMockBaseMessage(overrides: Record<string, unknown> = {}): any {
  return {
    getId: () => overrides['id'] ?? 1,
    getType: () => overrides['type'] ?? 'text',
    getSender: () => overrides['sender'] ?? { getUid: () => 'user-1', getName: () => 'Test User' },
    getReceiverType: () => overrides['receiverType'] ?? 'user',
    getReceiverId: () => overrides['receiverId'] ?? 'user-2',
    getSentAt: () => overrides['sentAt'] ?? Math.floor(Date.now() / 1000),
    ...overrides,
  };
}

function createMockIMessages(overrides: Partial<IMessages> = {}): IMessages {
  return {
    message: overrides.message ?? createMockBaseMessage(),
    status: overrides.status ?? MessageStatus.success,
  };
}

describe('CometChatMessageEvents', () => {
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
    it('should deliver ccMessageSent payloads to subscriber', () => {
      const received: IMessages[] = [];
      const sub = CometChatMessageEvents.ccMessageSent.subscribe(v => received.push(v));
      subscriptions.push(sub);

      const payload = createMockIMessages({ status: MessageStatus.success });
      CometChatMessageEvents.ccMessageSent.next(payload);

      expect(received).toHaveLength(1);
      expect(received[0]).toBe(payload);
    });

    it('should deliver ccMessageEdited payloads to subscriber', () => {
      const received: IMessages[] = [];
      const sub = CometChatMessageEvents.ccMessageEdited.subscribe(v => received.push(v));
      subscriptions.push(sub);

      const payload = createMockIMessages();
      CometChatMessageEvents.ccMessageEdited.next(payload);

      expect(received).toHaveLength(1);
      expect(received[0]).toBe(payload);
    });

    it('should deliver ccMessageDeleted payloads to subscriber', () => {
      const received: any[] = [];
      const sub = CometChatMessageEvents.ccMessageDeleted.subscribe(v => received.push(v));
      subscriptions.push(sub);

      const msg = createMockBaseMessage({ id: 42 });
      CometChatMessageEvents.ccMessageDeleted.next(msg);

      expect(received).toHaveLength(1);
      expect(received[0]).toBe(msg);
    });

    it('should deliver ccReplyToMessage payloads to subscriber', () => {
      const received: IMessages[] = [];
      const sub = CometChatMessageEvents.ccReplyToMessage.subscribe(v => received.push(v));
      subscriptions.push(sub);

      const payload = createMockIMessages({ status: MessageStatus.inprogress });
      CometChatMessageEvents.ccReplyToMessage.next(payload);

      expect(received).toHaveLength(1);
      expect(received[0]).toBe(payload);
    });

    it('should deliver ccMessageRead payloads to subscriber', () => {
      const received: any[] = [];
      const sub = CometChatMessageEvents.ccMessageRead.subscribe(v => received.push(v));
      subscriptions.push(sub);

      const msg = createMockBaseMessage({ id: 99 });
      CometChatMessageEvents.ccMessageRead.next(msg);

      expect(received).toHaveLength(1);
      expect(received[0]).toBe(msg);
    });

    it('should deliver ccMessageTranslated payloads to subscriber', () => {
      const received: IMessages[] = [];
      const sub = CometChatMessageEvents.ccMessageTranslated.subscribe(v => received.push(v));
      subscriptions.push(sub);

      const payload = createMockIMessages();
      CometChatMessageEvents.ccMessageTranslated.next(payload);

      expect(received).toHaveLength(1);
      expect(received[0]).toBe(payload);
    });

    it('should not deliver prior emissions to new subscribers (Subject behavior)', () => {
      const payload = createMockIMessages();
      CometChatMessageEvents.ccMessageSent.next(payload);

      const received: IMessages[] = [];
      const sub = CometChatMessageEvents.ccMessageSent.subscribe(v => received.push(v));
      subscriptions.push(sub);

      expect(received).toHaveLength(0);
    });

    it('should deliver multiple sequential emissions in order', () => {
      const received: IMessages[] = [];
      const sub = CometChatMessageEvents.ccMessageEdited.subscribe(v => received.push(v));
      subscriptions.push(sub);

      const p1 = createMockIMessages({ message: createMockBaseMessage({ id: 1 }) });
      const p2 = createMockIMessages({ message: createMockBaseMessage({ id: 2 }) });
      CometChatMessageEvents.ccMessageEdited.next(p1);
      CometChatMessageEvents.ccMessageEdited.next(p2);

      expect(received).toHaveLength(2);
      expect(received[0]).toBe(p1);
      expect(received[1]).toBe(p2);
    });
  });

  // ─── SDK Wrapper Events ────────────────────────────────────────────

  describe('SDK Wrapper Events', () => {
    it('should deliver onTextMessageReceived payloads to subscriber', () => {
      const received: any[] = [];
      const sub = CometChatMessageEvents.onTextMessageReceived.subscribe(v => received.push(v));
      subscriptions.push(sub);

      const msg = createMockBaseMessage({ type: 'text' });
      CometChatMessageEvents.onTextMessageReceived.next(msg);

      expect(received).toHaveLength(1);
      expect(received[0]).toBe(msg);
    });

    it('should deliver onMediaMessageReceived payloads to subscriber', () => {
      const received: any[] = [];
      const sub = CometChatMessageEvents.onMediaMessageReceived.subscribe(v => received.push(v));
      subscriptions.push(sub);

      const msg = createMockBaseMessage({ type: 'image' });
      CometChatMessageEvents.onMediaMessageReceived.next(msg);

      expect(received).toHaveLength(1);
      expect(received[0]).toBe(msg);
    });

    it('should deliver onTypingStarted payloads to subscriber', () => {
      const received: any[] = [];
      const sub = CometChatMessageEvents.onTypingStarted.subscribe(v => received.push(v));
      subscriptions.push(sub);

      const indicator = {
        getSender: () => ({ getUid: () => 'user-1' }),
        getReceiverType: () => 'user',
      };
      CometChatMessageEvents.onTypingStarted.next(indicator as any);

      expect(received).toHaveLength(1);
      expect(received[0]).toBe(indicator);
    });

    it('should deliver onMessagesDelivered payloads to subscriber', () => {
      const received: any[] = [];
      const sub = CometChatMessageEvents.onMessagesDelivered.subscribe(v => received.push(v));
      subscriptions.push(sub);

      const receipt = { getMessageId: () => '100', getSender: () => ({ getUid: () => 'user-2' }) };
      CometChatMessageEvents.onMessagesDelivered.next(receipt as any);

      expect(received).toHaveLength(1);
      expect(received[0]).toBe(receipt);
    });

    it('should deliver onMessagesRead payloads to subscriber', () => {
      const received: any[] = [];
      const sub = CometChatMessageEvents.onMessagesRead.subscribe(v => received.push(v));
      subscriptions.push(sub);

      const receipt = { getMessageId: () => '200', getSender: () => ({ getUid: () => 'user-3' }) };
      CometChatMessageEvents.onMessagesRead.next(receipt as any);

      expect(received).toHaveLength(1);
      expect(received[0]).toBe(receipt);
    });

    it('should deliver onMessageEdited payloads to subscriber', () => {
      const received: any[] = [];
      const sub = CometChatMessageEvents.onMessageEdited.subscribe(v => received.push(v));
      subscriptions.push(sub);

      const msg = createMockBaseMessage({ id: 55 });
      CometChatMessageEvents.onMessageEdited.next(msg);

      expect(received).toHaveLength(1);
      expect(received[0]).toBe(msg);
    });

    it('should deliver onMessageDeleted payloads to subscriber', () => {
      const received: any[] = [];
      const sub = CometChatMessageEvents.onMessageDeleted.subscribe(v => received.push(v));
      subscriptions.push(sub);

      const msg = createMockBaseMessage({ id: 66 });
      CometChatMessageEvents.onMessageDeleted.next(msg);

      expect(received).toHaveLength(1);
      expect(received[0]).toBe(msg);
    });
  });

  // ─── publishEvent() helper ─────────────────────────────────────────

  describe('publishEvent()', () => {
    it('should emit the item on the given subject', () => {
      const received: IMessages[] = [];
      const sub = CometChatMessageEvents.ccMessageSent.subscribe(v => received.push(v));
      subscriptions.push(sub);

      const payload = createMockIMessages();
      CometChatMessageEvents.publishEvent(CometChatMessageEvents.ccMessageSent, payload);

      expect(received).toHaveLength(1);
      expect(received[0]).toBe(payload);
    });

    it('should emit null when called with no item argument', () => {
      const received: any[] = [];
      const sub = CometChatMessageEvents.ccMessageDeleted.subscribe(v => received.push(v));
      subscriptions.push(sub);

      CometChatMessageEvents.publishEvent(CometChatMessageEvents.ccMessageDeleted);

      expect(received).toHaveLength(1);
      expect(received[0]).toBeNull();
    });
  });

  // ─── Unsubscribe ───────────────────────────────────────────────────

  describe('Unsubscribe', () => {
    it('should stop receiving ccMessageSent after unsubscribe', () => {
      const received: IMessages[] = [];
      const sub = CometChatMessageEvents.ccMessageSent.subscribe(v => received.push(v));

      CometChatMessageEvents.ccMessageSent.next(createMockIMessages());
      expect(received).toHaveLength(1);

      sub.unsubscribe();

      CometChatMessageEvents.ccMessageSent.next(createMockIMessages());
      expect(received).toHaveLength(1);
    });

    it('should stop receiving ccMessageEdited after unsubscribe', () => {
      const received: IMessages[] = [];
      const sub = CometChatMessageEvents.ccMessageEdited.subscribe(v => received.push(v));

      CometChatMessageEvents.ccMessageEdited.next(createMockIMessages());
      expect(received).toHaveLength(1);

      sub.unsubscribe();

      CometChatMessageEvents.ccMessageEdited.next(createMockIMessages());
      expect(received).toHaveLength(1);
    });

    it('should stop receiving ccMessageDeleted after unsubscribe', () => {
      const received: any[] = [];
      const sub = CometChatMessageEvents.ccMessageDeleted.subscribe(v => received.push(v));

      CometChatMessageEvents.ccMessageDeleted.next(createMockBaseMessage());
      expect(received).toHaveLength(1);

      sub.unsubscribe();

      CometChatMessageEvents.ccMessageDeleted.next(createMockBaseMessage());
      expect(received).toHaveLength(1);
    });

    it('should stop receiving onTextMessageReceived after unsubscribe', () => {
      const received: any[] = [];
      const sub = CometChatMessageEvents.onTextMessageReceived.subscribe(v => received.push(v));

      CometChatMessageEvents.onTextMessageReceived.next(createMockBaseMessage() as any);
      expect(received).toHaveLength(1);

      sub.unsubscribe();

      CometChatMessageEvents.onTextMessageReceived.next(createMockBaseMessage() as any);
      expect(received).toHaveLength(1);
    });

    it('should not affect other subscribers when one unsubscribes', () => {
      const receivedA: IMessages[] = [];
      const receivedB: IMessages[] = [];
      const subA = CometChatMessageEvents.ccMessageSent.subscribe(v => receivedA.push(v));
      const subB = CometChatMessageEvents.ccMessageSent.subscribe(v => receivedB.push(v));
      subscriptions.push(subB);

      CometChatMessageEvents.ccMessageSent.next(createMockIMessages());
      expect(receivedA).toHaveLength(1);
      expect(receivedB).toHaveLength(1);

      subA.unsubscribe();

      CometChatMessageEvents.ccMessageSent.next(createMockIMessages());
      expect(receivedA).toHaveLength(1);
      expect(receivedB).toHaveLength(2);
    });
  });

  // ─── Multiple Subscribers ──────────────────────────────────────────

  describe('Multiple Subscribers', () => {
    it('should deliver to multiple subscribers simultaneously on ccMessageSent', () => {
      const receivedA: IMessages[] = [];
      const receivedB: IMessages[] = [];
      const receivedC: IMessages[] = [];
      const subA = CometChatMessageEvents.ccMessageSent.subscribe(v => receivedA.push(v));
      const subB = CometChatMessageEvents.ccMessageSent.subscribe(v => receivedB.push(v));
      const subC = CometChatMessageEvents.ccMessageSent.subscribe(v => receivedC.push(v));
      subscriptions.push(subA, subB, subC);

      const payload = createMockIMessages();
      CometChatMessageEvents.ccMessageSent.next(payload);

      expect(receivedA).toHaveLength(1);
      expect(receivedB).toHaveLength(1);
      expect(receivedC).toHaveLength(1);
      expect(receivedA[0]).toBe(payload);
      expect(receivedB[0]).toBe(payload);
      expect(receivedC[0]).toBe(payload);
    });

    it('should deliver to multiple subscribers simultaneously on onTextMessageReceived', () => {
      const receivedA: any[] = [];
      const receivedB: any[] = [];
      const subA = CometChatMessageEvents.onTextMessageReceived.subscribe(v => receivedA.push(v));
      const subB = CometChatMessageEvents.onTextMessageReceived.subscribe(v => receivedB.push(v));
      subscriptions.push(subA, subB);

      const msg = createMockBaseMessage({ type: 'text' });
      CometChatMessageEvents.onTextMessageReceived.next(msg as any);

      expect(receivedA).toHaveLength(1);
      expect(receivedB).toHaveLength(1);
      expect(receivedA[0]).toBe(msg);
      expect(receivedB[0]).toBe(msg);
    });
  });

  // ─── No-Subscriber Emission ────────────────────────────────────────

  describe('No-Subscriber Emission', () => {
    it('should not throw when emitting ccMessageSent with no subscribers', () => {
      expect(() => CometChatMessageEvents.ccMessageSent.next(createMockIMessages())).not.toThrow();
    });

    it('should not throw when emitting ccMessageEdited with no subscribers', () => {
      expect(() =>
        CometChatMessageEvents.ccMessageEdited.next(createMockIMessages())
      ).not.toThrow();
    });

    it('should not throw when emitting ccMessageDeleted with no subscribers', () => {
      expect(() =>
        CometChatMessageEvents.ccMessageDeleted.next(createMockBaseMessage())
      ).not.toThrow();
    });

    it('should not throw when emitting onTextMessageReceived with no subscribers', () => {
      expect(() =>
        CometChatMessageEvents.onTextMessageReceived.next(createMockBaseMessage() as any)
      ).not.toThrow();
    });

    it('should not throw when emitting onTypingStarted with no subscribers', () => {
      expect(() => CometChatMessageEvents.onTypingStarted.next({} as any)).not.toThrow();
    });
  });

  // ─── Event Type Isolation ──────────────────────────────────────────

  describe('Event Type Isolation', () => {
    it('should not deliver ccMessageSent emissions to ccMessageEdited subscriber', () => {
      const received: IMessages[] = [];
      const sub = CometChatMessageEvents.ccMessageEdited.subscribe(v => received.push(v));
      subscriptions.push(sub);

      CometChatMessageEvents.ccMessageSent.next(createMockIMessages());

      expect(received).toHaveLength(0);
    });

    it('should not deliver ccMessageDeleted emissions to ccMessageRead subscriber', () => {
      const received: any[] = [];
      const sub = CometChatMessageEvents.ccMessageRead.subscribe(v => received.push(v));
      subscriptions.push(sub);

      CometChatMessageEvents.ccMessageDeleted.next(createMockBaseMessage());

      expect(received).toHaveLength(0);
    });

    it('should not deliver onTextMessageReceived emissions to onMediaMessageReceived subscriber', () => {
      const received: any[] = [];
      const sub = CometChatMessageEvents.onMediaMessageReceived.subscribe(v => received.push(v));
      subscriptions.push(sub);

      CometChatMessageEvents.onTextMessageReceived.next(createMockBaseMessage() as any);

      expect(received).toHaveLength(0);
    });

    it('should isolate UI events from SDK wrapper events', () => {
      const uiReceived: IMessages[] = [];
      const sdkReceived: any[] = [];

      const sub1 = CometChatMessageEvents.ccMessageSent.subscribe(v => uiReceived.push(v));
      const sub2 = CometChatMessageEvents.onTextMessageReceived.subscribe(v => sdkReceived.push(v));
      subscriptions.push(sub1, sub2);

      CometChatMessageEvents.ccMessageSent.next(createMockIMessages());

      expect(uiReceived).toHaveLength(1);
      expect(sdkReceived).toHaveLength(0);
    });

    it('should isolate multiple event types from each other', () => {
      const sent: IMessages[] = [];
      const edited: IMessages[] = [];
      const deleted: any[] = [];
      const read: any[] = [];

      subscriptions.push(
        CometChatMessageEvents.ccMessageSent.subscribe(v => sent.push(v)),
        CometChatMessageEvents.ccMessageEdited.subscribe(v => edited.push(v)),
        CometChatMessageEvents.ccMessageDeleted.subscribe(v => deleted.push(v)),
        CometChatMessageEvents.ccMessageRead.subscribe(v => read.push(v))
      );

      CometChatMessageEvents.ccMessageSent.next(createMockIMessages());

      expect(sent).toHaveLength(1);
      expect(edited).toHaveLength(0);
      expect(deleted).toHaveLength(0);
      expect(read).toHaveLength(0);
    });
  });

  // ─── Null / Undefined Payload Handling ─────────────────────────────

  describe('Null Payload Handling', () => {
    it('should deliver null payload on ccMessageSent without error', () => {
      const received: any[] = [];
      const sub = CometChatMessageEvents.ccMessageSent.subscribe(v => received.push(v));
      subscriptions.push(sub);

      CometChatMessageEvents.ccMessageSent.next(null as any);

      expect(received).toHaveLength(1);
      expect(received[0]).toBeNull();
    });

    it('should deliver undefined payload on ccMessageEdited without error', () => {
      const received: any[] = [];
      const sub = CometChatMessageEvents.ccMessageEdited.subscribe(v => received.push(v));
      subscriptions.push(sub);

      CometChatMessageEvents.ccMessageEdited.next(undefined as any);

      expect(received).toHaveLength(1);
      expect(received[0]).toBeUndefined();
    });

    it('should deliver null payload on onTextMessageReceived without error', () => {
      const received: any[] = [];
      const sub = CometChatMessageEvents.onTextMessageReceived.subscribe(v => received.push(v));
      subscriptions.push(sub);

      CometChatMessageEvents.onTextMessageReceived.next(null as any);

      expect(received).toHaveLength(1);
      expect(received[0]).toBeNull();
    });

    it('should deliver null via publishEvent without error', () => {
      const received: any[] = [];
      const sub = CometChatMessageEvents.ccMessageSent.subscribe(v => received.push(v));
      subscriptions.push(sub);

      CometChatMessageEvents.publishEvent(CometChatMessageEvents.ccMessageSent, null);

      expect(received).toHaveLength(1);
      expect(received[0]).toBeNull();
    });
  });

  // ─── Typed Publish Methods ─────────────────────────────────────────

  describe('Typed Publish Methods', () => {
    // UI-level typed publish methods

    it('publishMessageSent should emit on ccMessageSent', () => {
      const received: IMessages[] = [];
      const sub = CometChatMessageEvents.ccMessageSent.subscribe(v => received.push(v));
      subscriptions.push(sub);

      const payload = createMockIMessages({ status: MessageStatus.success });
      CometChatMessageEvents.publishMessageSent(payload);

      expect(received).toHaveLength(1);
      expect(received[0]).toBe(payload);
    });

    it('publishMessageEdited should emit on ccMessageEdited', () => {
      const received: IMessages[] = [];
      const sub = CometChatMessageEvents.ccMessageEdited.subscribe(v => received.push(v));
      subscriptions.push(sub);

      const payload = createMockIMessages();
      CometChatMessageEvents.publishMessageEdited(payload);

      expect(received).toHaveLength(1);
      expect(received[0]).toBe(payload);
    });

    it('publishMessageDeleted should emit on ccMessageDeleted', () => {
      const received: any[] = [];
      const sub = CometChatMessageEvents.ccMessageDeleted.subscribe(v => received.push(v));
      subscriptions.push(sub);

      const msg = createMockBaseMessage({ id: 42 });
      CometChatMessageEvents.publishMessageDeleted(msg);

      expect(received).toHaveLength(1);
      expect(received[0]).toBe(msg);
    });

    // SDK-wrapper typed publish methods

    it('publishTextMessageReceived should emit on onTextMessageReceived', () => {
      const received: any[] = [];
      const sub = CometChatMessageEvents.onTextMessageReceived.subscribe(v => received.push(v));
      subscriptions.push(sub);

      const msg = createMockBaseMessage({ type: 'text' });
      CometChatMessageEvents.publishTextMessageReceived(msg as any);

      expect(received).toHaveLength(1);
      expect(received[0]).toBe(msg);
    });

    it('publishTypingStarted should emit on onTypingStarted', () => {
      const received: any[] = [];
      const sub = CometChatMessageEvents.onTypingStarted.subscribe(v => received.push(v));
      subscriptions.push(sub);

      const indicator = {
        getSender: () => ({ getUid: () => 'user-1' }),
        getReceiverType: () => 'user',
      };
      CometChatMessageEvents.publishTypingStarted(indicator as any);

      expect(received).toHaveLength(1);
      expect(received[0]).toBe(indicator);
    });

    it('publishOnMessageEdited should emit on onMessageEdited', () => {
      const received: any[] = [];
      const sub = CometChatMessageEvents.onMessageEdited.subscribe(v => received.push(v));
      subscriptions.push(sub);

      const msg = createMockBaseMessage({ id: 77 });
      CometChatMessageEvents.publishOnMessageEdited(msg as any);

      expect(received).toHaveLength(1);
      expect(received[0]).toBe(msg);
    });

    // No-subscriber safety

    it('should not throw when typed publish is called with no subscribers', () => {
      expect(() => CometChatMessageEvents.publishMessageSent(createMockIMessages())).not.toThrow();
      expect(() =>
        CometChatMessageEvents.publishTextMessageReceived(createMockBaseMessage() as any)
      ).not.toThrow();
    });
  });

  // ─── Subscribe Helpers with DestroyRef ─────────────────────────────

  describe('Subscribe Helpers with DestroyRef', () => {
    // UI-level subscribe helpers

    it('onMessageSent should receive emitted values', () => {
      const received: IMessages[] = [];
      const sub = CometChatMessageEvents.onMessageSent(v => received.push(v));
      subscriptions.push(sub);

      const payload = createMockIMessages({ status: MessageStatus.success });
      CometChatMessageEvents.ccMessageSent.next(payload);

      expect(received).toHaveLength(1);
      expect(received[0]).toBe(payload);
    });

    it('onCcMessageEdited should receive emitted values', () => {
      const received: IMessages[] = [];
      const sub = CometChatMessageEvents.onCcMessageEdited(v => received.push(v));
      subscriptions.push(sub);

      const payload = createMockIMessages();
      CometChatMessageEvents.ccMessageEdited.next(payload);

      expect(received).toHaveLength(1);
      expect(received[0]).toBe(payload);
    });

    it('onCcMessageDeleted should receive emitted values', () => {
      const received: any[] = [];
      const sub = CometChatMessageEvents.onCcMessageDeleted(v => received.push(v));
      subscriptions.push(sub);

      const msg = createMockBaseMessage({ id: 10 });
      CometChatMessageEvents.ccMessageDeleted.next(msg);

      expect(received).toHaveLength(1);
      expect(received[0]).toBe(msg);
    });

    // SDK-wrapper subscribe helpers

    it('subscribeOnTextMessageReceived should receive emitted values', () => {
      const received: any[] = [];
      const sub = CometChatMessageEvents.subscribeOnTextMessageReceived(v => received.push(v));
      subscriptions.push(sub);

      const msg = createMockBaseMessage({ type: 'text' });
      CometChatMessageEvents.onTextMessageReceived.next(msg as any);

      expect(received).toHaveLength(1);
      expect(received[0]).toBe(msg);
    });

    it('subscribeOnTypingStarted should receive emitted values', () => {
      const received: any[] = [];
      const sub = CometChatMessageEvents.subscribeOnTypingStarted(v => received.push(v));
      subscriptions.push(sub);

      const indicator = { getSender: () => ({ getUid: () => 'user-1' }) };
      CometChatMessageEvents.onTypingStarted.next(indicator as any);

      expect(received).toHaveLength(1);
      expect(received[0]).toBe(indicator);
    });

    it('subscribeOnMessageEdited should receive emitted values', () => {
      const received: any[] = [];
      const sub = CometChatMessageEvents.subscribeOnMessageEdited(v => received.push(v));
      subscriptions.push(sub);

      const msg = createMockBaseMessage({ id: 88 });
      CometChatMessageEvents.onMessageEdited.next(msg as any);

      expect(received).toHaveLength(1);
      expect(received[0]).toBe(msg);
    });

    // DestroyRef auto-cleanup

    it('should close subscription when DestroyRef is triggered (UI-level)', () => {
      const destroyRef = createMockDestroyRef();
      const received: IMessages[] = [];
      const sub = CometChatMessageEvents.onMessageSent(v => received.push(v), destroyRef);

      CometChatMessageEvents.ccMessageSent.next(createMockIMessages());
      expect(received).toHaveLength(1);
      expect(sub.closed).toBe(false);

      destroyRef.triggerDestroy();
      expect(sub.closed).toBe(true);

      CometChatMessageEvents.ccMessageSent.next(createMockIMessages());
      expect(received).toHaveLength(1);
    });

    it('should close subscription when DestroyRef is triggered (SDK-wrapper)', () => {
      const destroyRef = createMockDestroyRef();
      const received: any[] = [];
      const sub = CometChatMessageEvents.subscribeOnTextMessageReceived(
        v => received.push(v),
        destroyRef
      );

      CometChatMessageEvents.onTextMessageReceived.next(createMockBaseMessage() as any);
      expect(received).toHaveLength(1);
      expect(sub.closed).toBe(false);

      destroyRef.triggerDestroy();
      expect(sub.closed).toBe(true);

      CometChatMessageEvents.onTextMessageReceived.next(createMockBaseMessage() as any);
      expect(received).toHaveLength(1);
    });

    // Without DestroyRef — subscription stays open for manual management

    it('should keep subscription open when no DestroyRef is provided', () => {
      const received: IMessages[] = [];
      const sub = CometChatMessageEvents.onMessageSent(v => received.push(v));
      subscriptions.push(sub);

      CometChatMessageEvents.ccMessageSent.next(createMockIMessages());
      CometChatMessageEvents.ccMessageSent.next(createMockIMessages());

      expect(received).toHaveLength(2);
      expect(sub.closed).toBe(false);
    });

    it('should keep SDK-wrapper subscription open when no DestroyRef is provided', () => {
      const received: any[] = [];
      const sub = CometChatMessageEvents.subscribeOnTextMessageReceived(v => received.push(v));
      subscriptions.push(sub);

      CometChatMessageEvents.onTextMessageReceived.next(createMockBaseMessage() as any);
      CometChatMessageEvents.onTextMessageReceived.next(createMockBaseMessage() as any);

      expect(received).toHaveLength(2);
      expect(sub.closed).toBe(false);
    });
  });
});
