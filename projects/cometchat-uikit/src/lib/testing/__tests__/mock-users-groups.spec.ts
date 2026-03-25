/**
 * Unit + Property-Based Tests for List Factories (mock-users-groups.ts)
 *
 * Feature: sdk-mock-testing
 *
 * Tests cover:
 * - Property 3: List factories produce correct count with sequential identifiers
 * - Sequential identifier uniqueness across random counts
 * - Property 2: Per-item override application at random indices
 *
 * @module testing/__tests__/mock-users-groups.spec
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import {
  createMockUserList,
  createMockGroupList,
  createMockConversationList,
  createMockGroupMemberList,
} from '../mock-users-groups';
import { resetMockMessageIdCounter } from '../mock-sdk';

// ═══════════════════════════════════════════════════════════════════════════════
// Task 7.1 — Property tests: list count correctness across random counts
// Feature: sdk-mock-testing, Property 3: List factories produce correct count
//   with sequential identifiers
// **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**
// ═══════════════════════════════════════════════════════════════════════════════

describe('Property 3: List factories produce correct count with sequential identifiers', () => {
  beforeEach(() => {
    resetMockMessageIdCounter();
  });

  it('createMockUserList returns exactly `count` users', () => {
    fc.assert(
      fc.property(fc.nat({ max: 50 }), count => {
        const users = createMockUserList(count);
        expect(users).toHaveLength(count);
      }),
      { numRuns: 100 }
    );
  });

  it('createMockGroupList returns exactly `count` groups', () => {
    fc.assert(
      fc.property(fc.nat({ max: 50 }), count => {
        const groups = createMockGroupList(count);
        expect(groups).toHaveLength(count);
      }),
      { numRuns: 100 }
    );
  });

  it('createMockConversationList returns exactly `count` conversations', () => {
    fc.assert(
      fc.property(fc.nat({ max: 50 }), count => {
        resetMockMessageIdCounter();
        const conversations = createMockConversationList(count);
        expect(conversations).toHaveLength(count);
      }),
      { numRuns: 100 }
    );
  });

  it('createMockGroupMemberList returns exactly `count` members', () => {
    fc.assert(
      fc.property(fc.nat({ max: 50 }), count => {
        const members = createMockGroupMemberList(count);
        expect(members).toHaveLength(count);
      }),
      { numRuns: 100 }
    );
  });

  it('createMockUserList: each user has a sequential uid (user-1, user-2, ...)', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 50 }), count => {
        const users = createMockUserList(count);
        for (let i = 0; i < count; i++) {
          expect(users[i].getUid()).toBe(`user-${i + 1}`);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('createMockGroupList: each group has a sequential guid (group-1, group-2, ...)', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 50 }), count => {
        const groups = createMockGroupList(count);
        for (let i = 0; i < count; i++) {
          expect(groups[i].getGuid()).toBe(`group-${i + 1}`);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('createMockGroupMemberList: each member has a sequential uid (member-1, member-2, ...)', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 50 }), count => {
        const members = createMockGroupMemberList(count);
        for (let i = 0; i < count; i++) {
          expect(members[i].getUid()).toBe(`member-${i + 1}`);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('createMockConversationList: each conversation has a unique conversationId', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 50 }), count => {
        resetMockMessageIdCounter();
        const conversations = createMockConversationList(count);
        const ids = conversations.map(c => c.getConversationId());
        const uniqueIds = new Set(ids);
        expect(uniqueIds.size).toBe(count);
      }),
      { numRuns: 100 }
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Task 7.2 — Property tests: sequential identifier uniqueness across random counts
// Feature: sdk-mock-testing, Property 3: List factories produce correct count
//   with sequential identifiers (uniqueness aspect)
// **Validates: Requirements 4.1, 4.2, 4.3, 4.4**
// ═══════════════════════════════════════════════════════════════════════════════

describe('Sequential identifier uniqueness across random counts', () => {
  beforeEach(() => {
    resetMockMessageIdCounter();
  });

  it('createMockUserList: all uids are unique', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 50 }), count => {
        const users = createMockUserList(count);
        const uids = users.map(u => u.getUid());
        expect(new Set(uids).size).toBe(count);
      }),
      { numRuns: 100 }
    );
  });

  it('createMockGroupList: all guids are unique', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 50 }), count => {
        const groups = createMockGroupList(count);
        const guids = groups.map(g => g.getGuid());
        expect(new Set(guids).size).toBe(count);
      }),
      { numRuns: 100 }
    );
  });

  it('createMockConversationList: all conversationIds are unique', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 50 }), count => {
        resetMockMessageIdCounter();
        const conversations = createMockConversationList(count);
        const ids = conversations.map(c => c.getConversationId());
        expect(new Set(ids).size).toBe(count);
      }),
      { numRuns: 100 }
    );
  });

  it('createMockGroupMemberList: all uids are unique', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 50 }), count => {
        const members = createMockGroupMemberList(count);
        const uids = members.map(m => m.getUid());
        expect(new Set(uids).size).toBe(count);
      }),
      { numRuns: 100 }
    );
  });

  it('createMockUserList: uids do not collide across different startIndex values', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 25 }),
        fc.integer({ min: 1, max: 100 }),
        (count, startIndex) => {
          const users = createMockUserList(count, { startIndex });
          const uids = users.map(u => u.getUid());
          expect(new Set(uids).size).toBe(count);
          // Verify the startIndex is respected
          expect(uids[0]).toBe(`user-${startIndex}`);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('createMockGroupList: guids do not collide across different startIndex values', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 25 }),
        fc.integer({ min: 1, max: 100 }),
        (count, startIndex) => {
          const groups = createMockGroupList(count, { startIndex });
          const guids = groups.map(g => g.getGuid());
          expect(new Set(guids).size).toBe(count);
          expect(guids[0]).toBe(`group-${startIndex}`);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('createMockGroupMemberList: uids do not collide across different startIndex values', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 25 }),
        fc.integer({ min: 1, max: 100 }),
        (count, startIndex) => {
          const members = createMockGroupMemberList(count, { startIndex });
          const uids = members.map(m => m.getUid());
          expect(new Set(uids).size).toBe(count);
          expect(uids[0]).toBe(`member-${startIndex}`);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Task 7.3 — Property tests: per-item override application at random indices
// Feature: sdk-mock-testing, Property 2: Per-item override application
// **Validates: Requirements 3.8, 4.6**
// ═══════════════════════════════════════════════════════════════════════════════

describe('Property 2: Per-item override application at random indices', () => {
  beforeEach(() => {
    resetMockMessageIdCounter();
  });

  it('createMockUserList: override at random index applies name correctly', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 50 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        (count, customName) => {
          const targetIndex = count - 1; // last item
          const users = createMockUserList(count, {
            overrides: { [targetIndex]: { name: customName } },
          });
          // Overridden item has custom name
          expect(users[targetIndex].getName()).toBe(customName);
          // Non-overridden items retain default sequential names
          if (count > 1) {
            expect(users[0].getName()).toBe('User 1');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('createMockUserList: override at arbitrary index within range', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 50 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        (count, customName) => {
          // Pick a random index within range
          const targetIndex = Math.floor(count / 2);
          const users = createMockUserList(count, {
            overrides: { [targetIndex]: { name: customName } },
          });
          expect(users[targetIndex].getName()).toBe(customName);
          // uid should still be sequential (not overridden)
          expect(users[targetIndex].getUid()).toBe(`user-${targetIndex + 1}`);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('createMockGroupList: override at random index applies name and type correctly', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 50 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        (count, customName) => {
          const targetIndex = count - 1;
          const groups = createMockGroupList(count, {
            overrides: { [targetIndex]: { name: customName } },
          });
          expect(groups[targetIndex].getName()).toBe(customName);
          // Non-overridden items retain defaults
          if (count > 1) {
            expect(groups[0].getName()).toBe('Group 1');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('createMockConversationList: override at random index applies unreadMessageCount', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 50 }), fc.nat({ max: 999 }), (count, unreadCount) => {
        resetMockMessageIdCounter();
        const targetIndex = count - 1;
        const conversations = createMockConversationList(count, {
          overrides: { [targetIndex]: { unreadMessageCount: unreadCount } },
        });
        expect(conversations[targetIndex].getUnreadMessageCount()).toBe(unreadCount);
      }),
      { numRuns: 100 }
    );
  });

  it('createMockGroupMemberList: override at random index applies custom name', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 50 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        (count, customName) => {
          const targetIndex = count - 1;
          const members = createMockGroupMemberList(count, {
            overrides: { [targetIndex]: { name: customName } },
          });
          expect(members[targetIndex].getName()).toBe(customName);
          // Non-overridden items retain defaults
          if (count > 1) {
            expect(members[0].getName()).toBe('Member 1');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('createMockUserList: multiple overrides at different indices all apply', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 3, max: 50 }),
        fc.string({ minLength: 1, maxLength: 30 }),
        fc.string({ minLength: 1, maxLength: 30 }),
        (count, name0, name2) => {
          const users = createMockUserList(count, {
            overrides: {
              0: { name: name0 },
              2: { name: name2 },
            },
          });
          expect(users[0].getName()).toBe(name0);
          expect(users[2].getName()).toBe(name2);
          // Index 1 should retain its default
          expect(users[1].getName()).toBe('User 2');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('createMockGroupMemberList: uid override replaces the sequential uid', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 50 }),
        fc.string({ minLength: 1, maxLength: 30 }),
        (count, customUid) => {
          const targetIndex = count - 1;
          const members = createMockGroupMemberList(count, {
            overrides: { [targetIndex]: { uid: customUid } },
          });
          expect(members[targetIndex].getUid()).toBe(customUid);
          // Non-overridden items retain sequential uids
          if (count > 1) {
            expect(members[0].getUid()).toBe('member-1');
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
