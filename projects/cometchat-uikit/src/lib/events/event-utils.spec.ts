/**
 * event-utils Tests
 *
 * Categories: subscribeWithOptionalCleanup — without DestroyRef, with DestroyRef,
 *             double-destroy safety, already-closed subscription, subscription.closed state
 *
 * Validates: Requirements 2.1, 2.2, 2.3, 2.4
 *
 * Tests the shared subscribeWithOptionalCleanup helper:
 * - Without DestroyRef: returns subscription, receives values
 * - With DestroyRef: auto-cleanup on destroy
 * - Double-destroy safety: calling triggerDestroy twice doesn't throw
 * - Already-closed subscription: unsubscribing before destroy doesn't throw on destroy
 * - Subscription.closed is true after destroy
 */
import { DestroyRef } from '@angular/core';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Subject } from 'rxjs';
import { ensureSdkReady, sdkCleanup } from '../test-setup';
import { subscribeWithOptionalCleanup } from './event-utils';

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

describe('subscribeWithOptionalCleanup', () => {
  beforeAll(async () => {
    await ensureSdkReady();
  });

  afterAll(async () => {
    await sdkCleanup();
  });

  describe('Without DestroyRef', () => {
    it('should return a subscription that receives values', () => {
      const subject = new Subject<string>();
      const received: string[] = [];

      const sub = subscribeWithOptionalCleanup(subject, v => received.push(v));

      subject.next('hello');
      subject.next('world');

      expect(received).toEqual(['hello', 'world']);
      expect(sub.closed).toBe(false);

      sub.unsubscribe();
    });

    it('should allow manual unsubscribe', () => {
      const subject = new Subject<number>();
      const received: number[] = [];

      const sub = subscribeWithOptionalCleanup(subject, v => received.push(v));

      subject.next(1);
      expect(received).toHaveLength(1);

      sub.unsubscribe();

      subject.next(2);
      expect(received).toHaveLength(1);
      expect(sub.closed).toBe(true);
    });
  });

  describe('With DestroyRef', () => {
    it('should auto-cleanup on destroy', () => {
      const destroyRef = createMockDestroyRef();
      const subject = new Subject<string>();
      const received: string[] = [];

      const sub = subscribeWithOptionalCleanup(subject, v => received.push(v), destroyRef);

      subject.next('before');
      expect(received).toEqual(['before']);
      expect(sub.closed).toBe(false);

      destroyRef.triggerDestroy();
      expect(sub.closed).toBe(true);

      subject.next('after');
      expect(received).toEqual(['before']);
    });

    it('subscription.closed should be true after destroy', () => {
      const destroyRef = createMockDestroyRef();
      const subject = new Subject<number>();

      const sub = subscribeWithOptionalCleanup(subject, () => {}, destroyRef);
      expect(sub.closed).toBe(false);

      destroyRef.triggerDestroy();
      expect(sub.closed).toBe(true);
    });
  });

  describe('Double-destroy safety', () => {
    it('should not throw when triggerDestroy is called twice', () => {
      const destroyRef = createMockDestroyRef();
      const subject = new Subject<string>();

      const sub = subscribeWithOptionalCleanup(subject, () => {}, destroyRef);

      destroyRef.triggerDestroy();
      expect(sub.closed).toBe(true);

      expect(() => destroyRef.triggerDestroy()).not.toThrow();
      expect(sub.closed).toBe(true);
    });
  });

  describe('Already-closed subscription', () => {
    it('should not throw when unsubscribing before destroy then triggering destroy', () => {
      const destroyRef = createMockDestroyRef();
      const subject = new Subject<string>();

      const sub = subscribeWithOptionalCleanup(subject, () => {}, destroyRef);

      sub.unsubscribe();
      expect(sub.closed).toBe(true);

      expect(() => destroyRef.triggerDestroy()).not.toThrow();
      expect(sub.closed).toBe(true);
    });
  });
});
