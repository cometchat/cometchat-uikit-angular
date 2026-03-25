/**
 * Property-Based Tests for Observable State Round-Trip
 *
 * Categories: Property-Based Round-Trip Invariants, Signal/Observable Consistency
 * Validates: Requirements 12.6, 5.4
 *
 * Property 6: Observable State Round-Trip
 * For ChatStateService, setActiveUser(user) then reading activeUser yields
 * the same user object. Extends to setActiveGroup and setActiveConversation.
 *
 * Uses real CometChat SDK — NO vi.mock() for @cometchat/chat-sdk-javascript.
 *
 * @module services/reactive-state.property
 */
vi.mock('@cometchat/calls-sdk-javascript', () => ({ default: {} }));

import { vi, describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { TestBed } from '@angular/core/testing';
import {
  ensureSdkReady,
  sdkCleanup,
  fetchTestUser,
  fetchTestGroup,
  fetchTestConversation,
} from '../test-setup';
import { ChatStateService } from './chat-state.service';
import { CometChat } from '@cometchat/chat-sdk-javascript';

// ==================== Shared State ====================

let realUsers: CometChat.User[];
let realGroups: CometChat.Group[];
let realConversations: CometChat.Conversation[];

// ==================== Arbitraries ====================

/**
 * Arbitrary that picks a real SDK User from the fetched pool,
 * or null for clearing state.
 */
const arbUserOrNull = () => fc.oneof(fc.constant(null), fc.constantFrom(...realUsers));

/** Arbitrary that picks only a real SDK User (non-null). */
const arbUser = () => fc.constantFrom(...realUsers);

/**
 * Arbitrary that picks a real SDK Group from the fetched pool,
 * or null for clearing state.
 */
const arbGroupOrNull = () => fc.oneof(fc.constant(null), fc.constantFrom(...realGroups));

/** Arbitrary that picks only a real SDK Group (non-null). */
const arbGroup = () => fc.constantFrom(...realGroups);

/** Arbitrary sequence of user-or-null values (1–8 items). */
const arbUserSequence = () => fc.array(arbUserOrNull(), { minLength: 1, maxLength: 8 });

/** Arbitrary sequence of group-or-null values (1–8 items). */
const arbGroupSequence = () => fc.array(arbGroupOrNull(), { minLength: 1, maxLength: 8 });

/** Arbitrary positive subscriber count (1–5). */
const arbSubscriberCount = fc.integer({ min: 1, max: 5 });

// ==================== Tests ====================

describe('Property 6: Observable State Round-Trip', () => {
  let service: ChatStateService;

  beforeAll(async () => {
    await ensureSdkReady();

    // Fetch a pool of real SDK objects
    const user1 = await fetchTestUser('superhero1');
    const user2 = await fetchTestUser('superhero2');
    realUsers = [user1, user2];

    const group1 = await fetchTestGroup('supergroup');
    realGroups = [group1];

    realConversations = await fetchTestConversation();
  }, 30000);

  afterAll(async () => {
    await sdkCleanup();
  }, 30000);

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    service = TestBed.inject(ChatStateService);
    service.clearActiveChat();
  });

  // ---------- Core round-trip: User ----------

  /**
   * **Validates: Requirements 12.6, 5.4**
   *
   * For any real CometChat.User (or null), calling setActiveUser(value)
   * then reading activeUser() yields the exact same object reference.
   */
  it('setActiveUser then activeUser() returns the same object reference', () => {
    fc.assert(
      fc.property(arbUserOrNull(), userValue => {
        service.setActiveUser(userValue);
        expect(service.activeUser()).toBe(userValue);
      }),
      { numRuns: 150 }
    );
  });

  // ---------- Core round-trip: Group ----------

  /**
   * **Validates: Requirements 12.6, 5.4**
   *
   * For any real CometChat.Group (or null), calling setActiveGroup(value)
   * then reading activeGroup() yields the exact same object reference.
   */
  it('setActiveGroup then activeGroup() returns the same object reference', () => {
    fc.assert(
      fc.property(arbGroupOrNull(), groupValue => {
        service.setActiveGroup(groupValue);
        expect(service.activeGroup()).toBe(groupValue);
      }),
      { numRuns: 150 }
    );
  });

  // ---------- Round-trip via snapshot getter: User ----------

  /**
   * **Validates: Requirements 12.6, 5.4**
   *
   * For any real CometChat.User (or null), calling setActiveUser(value)
   * then getActiveUser() yields the exact same object reference.
   */
  it('setActiveUser then getActiveUser() returns the same object reference', () => {
    fc.assert(
      fc.property(arbUserOrNull(), userValue => {
        service.setActiveUser(userValue);
        expect(service.getActiveUser()).toBe(userValue);
      }),
      { numRuns: 150 }
    );
  });

  // ---------- Round-trip via snapshot getter: Group ----------

  /**
   * **Validates: Requirements 12.6, 5.4**
   *
   * For any real CometChat.Group (or null), calling setActiveGroup(value)
   * then getActiveGroup() yields the exact same object reference.
   */
  it('setActiveGroup then getActiveGroup() returns the same object reference', () => {
    fc.assert(
      fc.property(arbGroupOrNull(), groupValue => {
        service.setActiveGroup(groupValue);
        expect(service.getActiveGroup()).toBe(groupValue);
      }),
      { numRuns: 150 }
    );
  });

  // ---------- Signal and getter consistency ----------

  /**
   * **Validates: Requirements 12.6, 5.4**
   *
   * For any real user value, the signal read and the getter read
   * return the exact same reference (they are consistent).
   */
  it('activeUser() and getActiveUser() are always consistent after set', () => {
    fc.assert(
      fc.property(arbUserOrNull(), userValue => {
        service.setActiveUser(userValue);
        const fromSignal = service.activeUser();
        const fromGetter = service.getActiveUser();
        expect(fromSignal).toBe(fromGetter);
      }),
      { numRuns: 150 }
    );
  });

  // ---------- Sequential round-trip stability ----------

  /**
   * **Validates: Requirements 12.6, 5.4**
   *
   * For any sequence of user values, after setting each one the signal
   * always reflects the most recently set value (last-write-wins).
   */
  it('sequential setActiveUser calls always reflect the last value', () => {
    fc.assert(
      fc.property(arbUserSequence(), users => {
        for (const u of users) {
          service.setActiveUser(u);
        }
        const last = users[users.length - 1];
        expect(service.activeUser()).toBe(last);
        expect(service.getActiveUser()).toBe(last);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 12.6, 5.4**
   *
   * For any sequence of group values, after setting each one the signal
   * always reflects the most recently set value (last-write-wins).
   */
  it('sequential setActiveGroup calls always reflect the last value', () => {
    fc.assert(
      fc.property(arbGroupSequence(), groups => {
        for (const g of groups) {
          service.setActiveGroup(g);
        }
        const last = groups[groups.length - 1];
        expect(service.activeGroup()).toBe(last);
        expect(service.getActiveGroup()).toBe(last);
      }),
      { numRuns: 100 }
    );
  });

  // ---------- Mutual exclusivity round-trip ----------

  /**
   * **Validates: Requirements 12.6, 5.4**
   *
   * For any non-null user, setting a user clears the group.
   * The round-trip for user holds AND group becomes null.
   */
  it('setActiveUser(user) round-trips user AND clears group', () => {
    fc.assert(
      fc.property(arbUser(), arbGroup(), (user, group) => {
        // First set a group
        service.setActiveGroup(group);
        expect(service.activeGroup()).toBe(group);

        // Now set a user — group should be cleared
        service.setActiveUser(user);
        expect(service.activeUser()).toBe(user);
        expect(service.activeGroup()).toBeNull();
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 12.6, 5.4**
   *
   * For any non-null group, setting a group clears the user.
   * The round-trip for group holds AND user becomes null.
   */
  it('setActiveGroup(group) round-trips group AND clears user', () => {
    fc.assert(
      fc.property(arbUser(), arbGroup(), (user, group) => {
        // First set a user
        service.setActiveUser(user);
        expect(service.activeUser()).toBe(user);

        // Now set a group — user should be cleared
        service.setActiveGroup(group);
        expect(service.activeGroup()).toBe(group);
        expect(service.activeUser()).toBeNull();
      }),
      { numRuns: 100 }
    );
  });

  // ---------- Observable round-trip (async) ----------

  /**
   * **Validates: Requirements 12.6, 5.4**
   *
   * For any real user, setting it and then reading the latest emission
   * from activeUser$ yields the same object reference.
   */
  it('setActiveUser then activeUser$ emits the same object reference', async () => {
    await fc.assert(
      fc.asyncProperty(arbUserOrNull(), async userValue => {
        const emissions: (CometChat.User | null)[] = [];
        const sub = service.activeUser$.subscribe(v => emissions.push(v));

        // Wait for initial emission
        await new Promise(r => setTimeout(r, 0));

        service.setActiveUser(userValue);
        await new Promise(r => setTimeout(r, 0));

        const lastEmission = emissions[emissions.length - 1];
        expect(lastEmission).toBe(userValue);

        sub.unsubscribe();
      }),
      { numRuns: 100 }
    );
  });

  // ---------- getActiveChatEntity round-trip ----------

  /**
   * **Validates: Requirements 12.6, 5.4**
   *
   * For any non-null user, getActiveChatEntity() returns the same
   * user object that was set via setActiveUser().
   */
  it('getActiveChatEntity returns the same user set via setActiveUser', () => {
    fc.assert(
      fc.property(arbUser(), user => {
        service.setActiveUser(user);
        expect(service.getActiveChatEntity()).toBe(user);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 12.6, 5.4**
   *
   * For any non-null group, getActiveChatEntity() returns the same
   * group object that was set via setActiveGroup().
   */
  it('getActiveChatEntity returns the same group set via setActiveGroup', () => {
    fc.assert(
      fc.property(arbGroup(), group => {
        service.setActiveGroup(group);
        expect(service.getActiveChatEntity()).toBe(group);
      }),
      { numRuns: 100 }
    );
  });

  // ---------- Conversation round-trip ----------

  /**
   * **Validates: Requirements 12.6, 5.4**
   *
   * For any real conversation, setActiveConversation then
   * getActiveConversation returns the same object reference.
   */
  it('setActiveConversation then getActiveConversation returns the same reference', () => {
    if (realConversations.length === 0) return;

    const arbConv = fc.constantFrom(...realConversations);

    fc.assert(
      fc.property(arbConv, conv => {
        service.setActiveConversation(conv);
        expect(service.getActiveConversation()).toBe(conv);
        expect(service.activeConversation()).toBe(conv);
      }),
      { numRuns: 100 }
    );
  });

  // ---------- clearActiveChat resets all round-trips ----------

  /**
   * **Validates: Requirements 12.6, 5.4**
   *
   * After setting any user/group and calling clearActiveChat(),
   * all getters and signals return null.
   */
  it('clearActiveChat resets all state to null regardless of prior values', () => {
    fc.assert(
      fc.property(arbUserOrNull(), arbGroupOrNull(), (user, group) => {
        service.setActiveUser(user);
        service.setActiveGroup(group);
        service.clearActiveChat();

        expect(service.activeUser()).toBeNull();
        expect(service.activeGroup()).toBeNull();
        expect(service.activeConversation()).toBeNull();
        expect(service.getActiveUser()).toBeNull();
        expect(service.getActiveGroup()).toBeNull();
        expect(service.getActiveConversation()).toBeNull();
        expect(service.getActiveChatEntity()).toBeNull();
      }),
      { numRuns: 100 }
    );
  });

  // ---------- Multiple reads are idempotent ----------

  /**
   * **Validates: Requirements 12.6, 5.4**
   *
   * For any user, reading the signal multiple times without
   * intervening writes always returns the same reference.
   */
  it('multiple signal reads without writes return the same reference', () => {
    fc.assert(
      fc.property(arbUser(), fc.integer({ min: 2, max: 10 }), (user, readCount) => {
        service.setActiveUser(user);
        const reads = Array.from({ length: readCount }, () => service.activeUser());
        for (const read of reads) {
          expect(read).toBe(user);
        }
      }),
      { numRuns: 100 }
    );
  });
});
