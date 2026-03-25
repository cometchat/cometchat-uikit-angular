/**
 * CometChatGroupEvents Tests
 *
 * Categories: Subscribe/Emit, Unsubscribe, Multiple Subscribers,
 *             No-Subscriber Emission, Event Type Isolation, Null Payloads,
 *             publishEvent() Helper
 *
 * Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5, 14.4, 14.5, 15.7
 *
 * Tests the static Subject-based event bus for group events:
 * - subscribe/emit delivery for all ten group event subjects
 * - unsubscribe prevents delivery
 * - multiple subscribers each receive the emitted value
 * - no error on emit with no subscribers
 * - event type isolation (subscribing to one does not receive from another)
 * - null/undefined payload handling
 * - publishEvent() static helper
 */
import { DestroyRef } from '@angular/core';
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { Subscription } from 'rxjs';
import { ensureSdkReady, sdkCleanup } from '../test-setup';
import {
  CometChatGroupEvents,
  IGroupMemberAdded,
  IGroupMemberKickedBanned,
  IGroupMemberScopeChanged,
  IGroupMemberJoined,
  IGroupLeft,
  IGroupMemberUnBanned,
  IOwnershipChanged,
} from './CometChatGroupEvents';

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

// ─── Mock Helpers ────────────────────────────────────────────────────

function createMockGroup(overrides: Record<string, unknown> = {}): any {
  return {
    getGuid: () => overrides['guid'] ?? 'group-1',
    getName: () => overrides['name'] ?? 'Test Group',
    getType: () => overrides['type'] ?? 'public',
    getMembersCount: () => overrides['membersCount'] ?? 5,
    ...overrides,
  };
}

function createMockUser(overrides: Record<string, unknown> = {}): any {
  return {
    getUid: () => overrides['uid'] ?? 'user-1',
    getName: () => overrides['name'] ?? 'Test User',
    ...overrides,
  };
}

function createMockGroupMember(overrides: Record<string, unknown> = {}): any {
  return {
    ...createMockUser(overrides),
    getScope: () => overrides['scope'] ?? 'participant',
  };
}

function createMockAction(overrides: Record<string, unknown> = {}): any {
  return {
    getId: () => overrides['id'] ?? 1,
    getType: () => overrides['type'] ?? 'groupMember',
    getAction: () => overrides['action'] ?? 'added',
    ...overrides,
  };
}

function createMockGroupMemberAdded(overrides: Partial<IGroupMemberAdded> = {}): IGroupMemberAdded {
  return {
    messages: overrides.messages ?? [createMockAction()],
    usersAdded: overrides.usersAdded ?? [createMockUser()],
    userAddedIn: overrides.userAddedIn ?? createMockGroup(),
    userAddedBy: overrides.userAddedBy ?? createMockUser({ uid: 'admin-1', name: 'Admin' }),
  };
}

function createMockKickedBanned(
  overrides: Partial<IGroupMemberKickedBanned> = {}
): IGroupMemberKickedBanned {
  return {
    message: overrides.message ?? createMockAction({ action: 'kicked' }),
    kickedFrom: overrides.kickedFrom ?? createMockGroup(),
    kickedUser: overrides.kickedUser ?? createMockUser({ uid: 'kicked-1' }),
    kickedBy: overrides.kickedBy ?? createMockUser({ uid: 'admin-1' }),
  };
}

function createMockScopeChanged(
  overrides: Partial<IGroupMemberScopeChanged> = {}
): IGroupMemberScopeChanged {
  return {
    message: overrides.message ?? createMockAction({ action: 'scopeChanged' }),
    updatedUser: overrides.updatedUser ?? createMockGroupMember(),
    scopeChangedTo: overrides.scopeChangedTo ?? 'admin',
    scopeChangedFrom: overrides.scopeChangedFrom ?? 'participant',
    group: overrides.group ?? createMockGroup(),
  };
}

function createMockMemberJoined(overrides: Partial<IGroupMemberJoined> = {}): IGroupMemberJoined {
  return {
    joinedUser: overrides.joinedUser ?? createMockUser({ uid: 'joined-1' }),
    joinedGroup: overrides.joinedGroup ?? createMockGroup(),
  };
}

function createMockGroupLeft(overrides: Partial<IGroupLeft> = {}): IGroupLeft {
  return {
    userLeft: overrides.userLeft ?? createMockUser({ uid: 'left-1' }),
    leftGroup: overrides.leftGroup ?? createMockGroup(),
    message: overrides.message ?? createMockAction({ action: 'left' }),
  };
}

function createMockUnbanned(overrides: Partial<IGroupMemberUnBanned> = {}): IGroupMemberUnBanned {
  return {
    unbannedUser: overrides.unbannedUser ?? createMockUser({ uid: 'unbanned-1' }),
    unbannedBy: overrides.unbannedBy ?? createMockUser({ uid: 'admin-1' }),
    unbannedFrom: overrides.unbannedFrom ?? createMockGroup(),
    message: overrides.message ?? createMockAction({ action: 'unbanned' }),
  };
}

function createMockOwnershipChanged(overrides: Partial<IOwnershipChanged> = {}): IOwnershipChanged {
  return {
    group: overrides.group ?? createMockGroup(),
    newOwner: overrides.newOwner ?? createMockGroupMember({ uid: 'new-owner', scope: 'owner' }),
  };
}

describe('CometChatGroupEvents', () => {
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
    it('should deliver ccGroupCreated payloads to subscriber', () => {
      const received: any[] = [];
      const sub = CometChatGroupEvents.ccGroupCreated.subscribe(v => received.push(v));
      subscriptions.push(sub);

      const group = createMockGroup();
      CometChatGroupEvents.ccGroupCreated.next(group);

      expect(received).toHaveLength(1);
      expect(received[0]).toBe(group);
    });

    it('should deliver ccGroupDeleted payloads to subscriber', () => {
      const received: any[] = [];
      const sub = CometChatGroupEvents.ccGroupDeleted.subscribe(v => received.push(v));
      subscriptions.push(sub);

      const group = createMockGroup({ guid: 'deleted-group' });
      CometChatGroupEvents.ccGroupDeleted.next(group);

      expect(received).toHaveLength(1);
      expect(received[0]).toBe(group);
    });

    it('should deliver ccGroupMemberAdded payloads to subscriber', () => {
      const received: IGroupMemberAdded[] = [];
      const sub = CometChatGroupEvents.ccGroupMemberAdded.subscribe(v => received.push(v));
      subscriptions.push(sub);

      const payload = createMockGroupMemberAdded();
      CometChatGroupEvents.ccGroupMemberAdded.next(payload);

      expect(received).toHaveLength(1);
      expect(received[0]).toBe(payload);
    });

    it('should deliver ccGroupMemberKicked payloads to subscriber', () => {
      const received: IGroupMemberKickedBanned[] = [];
      const sub = CometChatGroupEvents.ccGroupMemberKicked.subscribe(v => received.push(v));
      subscriptions.push(sub);

      const payload = createMockKickedBanned();
      CometChatGroupEvents.ccGroupMemberKicked.next(payload);

      expect(received).toHaveLength(1);
      expect(received[0]).toBe(payload);
    });

    it('should deliver ccGroupMemberBanned payloads to subscriber', () => {
      const received: IGroupMemberKickedBanned[] = [];
      const sub = CometChatGroupEvents.ccGroupMemberBanned.subscribe(v => received.push(v));
      subscriptions.push(sub);

      const payload = createMockKickedBanned();
      CometChatGroupEvents.ccGroupMemberBanned.next(payload);

      expect(received).toHaveLength(1);
      expect(received[0]).toBe(payload);
    });

    it('should deliver ccGroupMemberScopeChanged payloads to subscriber', () => {
      const received: IGroupMemberScopeChanged[] = [];
      const sub = CometChatGroupEvents.ccGroupMemberScopeChanged.subscribe(v => received.push(v));
      subscriptions.push(sub);

      const payload = createMockScopeChanged();
      CometChatGroupEvents.ccGroupMemberScopeChanged.next(payload);

      expect(received).toHaveLength(1);
      expect(received[0]).toBe(payload);
    });

    it('should deliver ccGroupMemberJoined payloads to subscriber', () => {
      const received: IGroupMemberJoined[] = [];
      const sub = CometChatGroupEvents.ccGroupMemberJoined.subscribe(v => received.push(v));
      subscriptions.push(sub);

      const payload = createMockMemberJoined();
      CometChatGroupEvents.ccGroupMemberJoined.next(payload);

      expect(received).toHaveLength(1);
      expect(received[0]).toBe(payload);
    });

    it('should deliver ccGroupLeft payloads to subscriber', () => {
      const received: IGroupLeft[] = [];
      const sub = CometChatGroupEvents.ccGroupLeft.subscribe(v => received.push(v));
      subscriptions.push(sub);

      const payload = createMockGroupLeft();
      CometChatGroupEvents.ccGroupLeft.next(payload);

      expect(received).toHaveLength(1);
      expect(received[0]).toBe(payload);
    });

    it('should deliver ccGroupMemberUnbanned payloads to subscriber', () => {
      const received: IGroupMemberUnBanned[] = [];
      const sub = CometChatGroupEvents.ccGroupMemberUnbanned.subscribe(v => received.push(v));
      subscriptions.push(sub);

      const payload = createMockUnbanned();
      CometChatGroupEvents.ccGroupMemberUnbanned.next(payload);

      expect(received).toHaveLength(1);
      expect(received[0]).toBe(payload);
    });

    it('should deliver ccOwnershipChanged payloads to subscriber', () => {
      const received: IOwnershipChanged[] = [];
      const sub = CometChatGroupEvents.ccOwnershipChanged.subscribe(v => received.push(v));
      subscriptions.push(sub);

      const payload = createMockOwnershipChanged();
      CometChatGroupEvents.ccOwnershipChanged.next(payload);

      expect(received).toHaveLength(1);
      expect(received[0]).toBe(payload);
    });

    it('should not deliver prior emissions to new subscribers (Subject behavior)', () => {
      const group = createMockGroup();
      CometChatGroupEvents.ccGroupCreated.next(group);

      const received: any[] = [];
      const sub = CometChatGroupEvents.ccGroupCreated.subscribe(v => received.push(v));
      subscriptions.push(sub);

      expect(received).toHaveLength(0);
    });

    it('should deliver multiple sequential emissions in order', () => {
      const received: any[] = [];
      const sub = CometChatGroupEvents.ccGroupDeleted.subscribe(v => received.push(v));
      subscriptions.push(sub);

      const g1 = createMockGroup({ guid: 'group-1' });
      const g2 = createMockGroup({ guid: 'group-2' });
      CometChatGroupEvents.ccGroupDeleted.next(g1);
      CometChatGroupEvents.ccGroupDeleted.next(g2);

      expect(received).toHaveLength(2);
      expect(received[0]).toBe(g1);
      expect(received[1]).toBe(g2);
    });
  });

  // ─── Unsubscribe ───────────────────────────────────────────────────

  describe('Unsubscribe', () => {
    it('should stop receiving ccGroupCreated after unsubscribe', () => {
      const received: any[] = [];
      const sub = CometChatGroupEvents.ccGroupCreated.subscribe(v => received.push(v));

      CometChatGroupEvents.ccGroupCreated.next(createMockGroup());
      expect(received).toHaveLength(1);

      sub.unsubscribe();

      CometChatGroupEvents.ccGroupCreated.next(createMockGroup());
      expect(received).toHaveLength(1);
    });

    it('should stop receiving ccGroupMemberAdded after unsubscribe', () => {
      const received: IGroupMemberAdded[] = [];
      const sub = CometChatGroupEvents.ccGroupMemberAdded.subscribe(v => received.push(v));

      CometChatGroupEvents.ccGroupMemberAdded.next(createMockGroupMemberAdded());
      expect(received).toHaveLength(1);

      sub.unsubscribe();

      CometChatGroupEvents.ccGroupMemberAdded.next(createMockGroupMemberAdded());
      expect(received).toHaveLength(1);
    });

    it('should stop receiving ccGroupMemberKicked after unsubscribe', () => {
      const received: IGroupMemberKickedBanned[] = [];
      const sub = CometChatGroupEvents.ccGroupMemberKicked.subscribe(v => received.push(v));

      CometChatGroupEvents.ccGroupMemberKicked.next(createMockKickedBanned());
      expect(received).toHaveLength(1);

      sub.unsubscribe();

      CometChatGroupEvents.ccGroupMemberKicked.next(createMockKickedBanned());
      expect(received).toHaveLength(1);
    });

    it('should not affect other subscribers when one unsubscribes', () => {
      const receivedA: any[] = [];
      const receivedB: any[] = [];
      const subA = CometChatGroupEvents.ccGroupCreated.subscribe(v => receivedA.push(v));
      const subB = CometChatGroupEvents.ccGroupCreated.subscribe(v => receivedB.push(v));
      subscriptions.push(subB);

      CometChatGroupEvents.ccGroupCreated.next(createMockGroup());
      expect(receivedA).toHaveLength(1);
      expect(receivedB).toHaveLength(1);

      subA.unsubscribe();

      CometChatGroupEvents.ccGroupCreated.next(createMockGroup());
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
      const subA = CometChatGroupEvents.ccGroupCreated.subscribe(v => receivedA.push(v));
      const subB = CometChatGroupEvents.ccGroupCreated.subscribe(v => receivedB.push(v));
      const subC = CometChatGroupEvents.ccGroupCreated.subscribe(v => receivedC.push(v));
      subscriptions.push(subA, subB, subC);

      const group = createMockGroup();
      CometChatGroupEvents.ccGroupCreated.next(group);

      expect(receivedA).toHaveLength(1);
      expect(receivedB).toHaveLength(1);
      expect(receivedC).toHaveLength(1);
      expect(receivedA[0]).toBe(group);
      expect(receivedB[0]).toBe(group);
      expect(receivedC[0]).toBe(group);
    });

    it('should deliver complex payloads to multiple subscribers', () => {
      const receivedA: IGroupMemberScopeChanged[] = [];
      const receivedB: IGroupMemberScopeChanged[] = [];
      const subA = CometChatGroupEvents.ccGroupMemberScopeChanged.subscribe(v => receivedA.push(v));
      const subB = CometChatGroupEvents.ccGroupMemberScopeChanged.subscribe(v => receivedB.push(v));
      subscriptions.push(subA, subB);

      const payload = createMockScopeChanged();
      CometChatGroupEvents.ccGroupMemberScopeChanged.next(payload);

      expect(receivedA).toHaveLength(1);
      expect(receivedB).toHaveLength(1);
      expect(receivedA[0]).toBe(receivedB[0]);
    });
  });

  // ─── No-Subscriber Emission ────────────────────────────────────────

  describe('No-Subscriber Emission', () => {
    it('should not throw when emitting ccGroupCreated with no subscribers', () => {
      expect(() => CometChatGroupEvents.ccGroupCreated.next(createMockGroup())).not.toThrow();
    });

    it('should not throw when emitting ccGroupDeleted with no subscribers', () => {
      expect(() => CometChatGroupEvents.ccGroupDeleted.next(createMockGroup())).not.toThrow();
    });

    it('should not throw when emitting ccGroupMemberAdded with no subscribers', () => {
      expect(() =>
        CometChatGroupEvents.ccGroupMemberAdded.next(createMockGroupMemberAdded())
      ).not.toThrow();
    });

    it('should not throw when emitting ccGroupMemberKicked with no subscribers', () => {
      expect(() =>
        CometChatGroupEvents.ccGroupMemberKicked.next(createMockKickedBanned())
      ).not.toThrow();
    });

    it('should not throw when emitting ccGroupMemberBanned with no subscribers', () => {
      expect(() =>
        CometChatGroupEvents.ccGroupMemberBanned.next(createMockKickedBanned())
      ).not.toThrow();
    });

    it('should not throw when emitting ccGroupMemberScopeChanged with no subscribers', () => {
      expect(() =>
        CometChatGroupEvents.ccGroupMemberScopeChanged.next(createMockScopeChanged())
      ).not.toThrow();
    });

    it('should not throw when emitting ccOwnershipChanged with no subscribers', () => {
      expect(() =>
        CometChatGroupEvents.ccOwnershipChanged.next(createMockOwnershipChanged())
      ).not.toThrow();
    });
  });

  // ─── Event Type Isolation ──────────────────────────────────────────

  describe('Event Type Isolation', () => {
    it('should not deliver ccGroupCreated emissions to ccGroupDeleted subscriber', () => {
      const received: any[] = [];
      const sub = CometChatGroupEvents.ccGroupDeleted.subscribe(v => received.push(v));
      subscriptions.push(sub);

      CometChatGroupEvents.ccGroupCreated.next(createMockGroup());

      expect(received).toHaveLength(0);
    });

    it('should not deliver ccGroupMemberKicked emissions to ccGroupMemberBanned subscriber', () => {
      const received: any[] = [];
      const sub = CometChatGroupEvents.ccGroupMemberBanned.subscribe(v => received.push(v));
      subscriptions.push(sub);

      CometChatGroupEvents.ccGroupMemberKicked.next(createMockKickedBanned());

      expect(received).toHaveLength(0);
    });

    it('should isolate all group event types from each other', () => {
      const created: any[] = [];
      const deleted: any[] = [];
      const memberAdded: any[] = [];
      const memberKicked: any[] = [];

      subscriptions.push(
        CometChatGroupEvents.ccGroupCreated.subscribe(v => created.push(v)),
        CometChatGroupEvents.ccGroupDeleted.subscribe(v => deleted.push(v)),
        CometChatGroupEvents.ccGroupMemberAdded.subscribe(v => memberAdded.push(v)),
        CometChatGroupEvents.ccGroupMemberKicked.subscribe(v => memberKicked.push(v))
      );

      CometChatGroupEvents.ccGroupCreated.next(createMockGroup({ guid: 'created' }));

      expect(created).toHaveLength(1);
      expect(deleted).toHaveLength(0);
      expect(memberAdded).toHaveLength(0);
      expect(memberKicked).toHaveLength(0);
    });
  });

  // ─── publishEvent() Helper ─────────────────────────────────────────

  describe('publishEvent()', () => {
    it('should emit the group on the given subject', () => {
      const received: any[] = [];
      const sub = CometChatGroupEvents.ccGroupCreated.subscribe(v => received.push(v));
      subscriptions.push(sub);

      const group = createMockGroup();
      CometChatGroupEvents.publishEvent(CometChatGroupEvents.ccGroupCreated, group);

      expect(received).toHaveLength(1);
      expect(received[0]).toBe(group);
    });

    it('should work with complex payload subjects via publishEvent', () => {
      const received: any[] = [];
      const sub = CometChatGroupEvents.ccGroupMemberAdded.subscribe(v => received.push(v));
      subscriptions.push(sub);

      const payload = createMockGroupMemberAdded();
      CometChatGroupEvents.publishEvent(CometChatGroupEvents.ccGroupMemberAdded as any, payload);

      expect(received).toHaveLength(1);
      expect(received[0]).toBe(payload);
    });
  });

  // ─── Null / Undefined Payload Handling ─────────────────────────────

  describe('Null Payload Handling', () => {
    it('should deliver null payload on ccGroupCreated without error', () => {
      const received: any[] = [];
      const sub = CometChatGroupEvents.ccGroupCreated.subscribe(v => received.push(v));
      subscriptions.push(sub);

      CometChatGroupEvents.ccGroupCreated.next(null as any);

      expect(received).toHaveLength(1);
      expect(received[0]).toBeNull();
    });

    it('should deliver undefined payload on ccGroupCreated without error', () => {
      const received: any[] = [];
      const sub = CometChatGroupEvents.ccGroupCreated.subscribe(v => received.push(v));
      subscriptions.push(sub);

      CometChatGroupEvents.ccGroupCreated.next(undefined as any);

      expect(received).toHaveLength(1);
      expect(received[0]).toBeUndefined();
    });

    it('should deliver null via publishEvent without error', () => {
      const received: any[] = [];
      const sub = CometChatGroupEvents.ccGroupCreated.subscribe(v => received.push(v));
      subscriptions.push(sub);

      CometChatGroupEvents.publishEvent(CometChatGroupEvents.ccGroupCreated, null as any);

      expect(received).toHaveLength(1);
      expect(received[0]).toBeNull();
    });
  });

  // ─── Typed Publish Methods ─────────────────────────────────────────

  describe('Typed Publish Methods', () => {
    it('publishGroupCreated should emit on ccGroupCreated', () => {
      const received: any[] = [];
      const sub = CometChatGroupEvents.ccGroupCreated.subscribe(v => received.push(v));
      subscriptions.push(sub);

      const group = createMockGroup();
      CometChatGroupEvents.publishGroupCreated(group);

      expect(received).toHaveLength(1);
      expect(received[0]).toBe(group);
    });

    it('publishGroupDeleted should emit on ccGroupDeleted', () => {
      const received: any[] = [];
      const sub = CometChatGroupEvents.ccGroupDeleted.subscribe(v => received.push(v));
      subscriptions.push(sub);

      const group = createMockGroup({ guid: 'deleted-group' });
      CometChatGroupEvents.publishGroupDeleted(group);

      expect(received).toHaveLength(1);
      expect(received[0]).toBe(group);
    });

    it('publishGroupMemberAdded should emit on ccGroupMemberAdded', () => {
      const received: IGroupMemberAdded[] = [];
      const sub = CometChatGroupEvents.ccGroupMemberAdded.subscribe(v => received.push(v));
      subscriptions.push(sub);

      const payload = createMockGroupMemberAdded();
      CometChatGroupEvents.publishGroupMemberAdded(payload);

      expect(received).toHaveLength(1);
      expect(received[0]).toBe(payload);
    });

    it('should not throw when typed publish is called with no subscribers', () => {
      expect(() => CometChatGroupEvents.publishGroupCreated(createMockGroup())).not.toThrow();
      expect(() => CometChatGroupEvents.publishGroupDeleted(createMockGroup())).not.toThrow();
      expect(() =>
        CometChatGroupEvents.publishGroupMemberAdded(createMockGroupMemberAdded())
      ).not.toThrow();
    });
  });

  // ─── Subscribe Helpers with DestroyRef ─────────────────────────────

  describe('Subscribe Helpers with DestroyRef', () => {
    it('onGroupCreated should receive emitted values', () => {
      const received: any[] = [];
      const sub = CometChatGroupEvents.onGroupCreated(v => received.push(v));
      subscriptions.push(sub);

      const group = createMockGroup();
      CometChatGroupEvents.ccGroupCreated.next(group);

      expect(received).toHaveLength(1);
      expect(received[0]).toBe(group);
    });

    it('onGroupDeleted should receive emitted values', () => {
      const received: any[] = [];
      const sub = CometChatGroupEvents.onGroupDeleted(v => received.push(v));
      subscriptions.push(sub);

      const group = createMockGroup({ guid: 'deleted-group' });
      CometChatGroupEvents.ccGroupDeleted.next(group);

      expect(received).toHaveLength(1);
      expect(received[0]).toBe(group);
    });

    it('onGroupMemberAdded should receive emitted values', () => {
      const received: IGroupMemberAdded[] = [];
      const sub = CometChatGroupEvents.onGroupMemberAdded(v => received.push(v));
      subscriptions.push(sub);

      const payload = createMockGroupMemberAdded();
      CometChatGroupEvents.ccGroupMemberAdded.next(payload);

      expect(received).toHaveLength(1);
      expect(received[0]).toBe(payload);
    });

    it('should close subscription when DestroyRef is triggered', () => {
      const destroyRef = createMockDestroyRef();
      const received: any[] = [];
      const sub = CometChatGroupEvents.onGroupCreated(v => received.push(v), destroyRef);

      CometChatGroupEvents.ccGroupCreated.next(createMockGroup());
      expect(received).toHaveLength(1);
      expect(sub.closed).toBe(false);

      destroyRef.triggerDestroy();
      expect(sub.closed).toBe(true);

      CometChatGroupEvents.ccGroupCreated.next(createMockGroup());
      expect(received).toHaveLength(1);
    });

    it('should keep subscription open when no DestroyRef is provided', () => {
      const received: any[] = [];
      const sub = CometChatGroupEvents.onGroupCreated(v => received.push(v));
      subscriptions.push(sub);

      CometChatGroupEvents.ccGroupCreated.next(createMockGroup());
      CometChatGroupEvents.ccGroupCreated.next(createMockGroup());

      expect(received).toHaveLength(2);
      expect(sub.closed).toBe(false);
    });
  });
});
