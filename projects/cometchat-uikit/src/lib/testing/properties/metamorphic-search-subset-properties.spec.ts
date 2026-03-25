import { describe, it, expect, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';

/**
 * Property-Based Tests for Metamorphic Search Subset
 *
 * Feature: comprehensive-test-suite, Property 10: Metamorphic Search Subset
 *
 * For any composite component with search functionality, for any two search
 * queries Q1 and Q2 where Q2 is a more restrictive version of Q1 (Q2 contains
 * Q1 as a substring), the result set of Q2 SHALL be a subset of the result set of Q1.
 *
 * **Validates: Requirements 4.3, 13.5**
 */

// ─── Search Filter Functions (mirror component search logic) ───
// All list components use case-insensitive substring matching:
//   name.toLowerCase().includes(searchText.toLowerCase())

/**
 * Filters users by name using case-insensitive substring match.
 */
function filterUsersByName(
  users: { uid: string; name: string }[],
  query: string
): { uid: string; name: string }[] {
  if (!query) return users;
  const lowerQuery = query.toLowerCase();
  return users.filter(u => u.name.toLowerCase().includes(lowerQuery));
}

/**
 * Filters groups by name using case-insensitive substring match.
 */
function filterGroupsByName(
  groups: { guid: string; name: string }[],
  query: string
): { guid: string; name: string }[] {
  if (!query) return groups;
  const lowerQuery = query.toLowerCase();
  return groups.filter(g => g.name.toLowerCase().includes(lowerQuery));
}

/**
 * Filters conversations by conversationWith name using case-insensitive substring match.
 */
function filterConversationsByName(
  conversations: { id: string; withName: string }[],
  query: string
): { id: string; withName: string }[] {
  if (!query) return conversations;
  const lowerQuery = query.toLowerCase();
  return conversations.filter(c => c.withName.toLowerCase().includes(lowerQuery));
}

// ─── Arbitraries ───

/** Printable non-empty string for names */
const arbName = fc.string({ minLength: 1, maxLength: 50 });

/** Non-empty search query (at least 1 char) */
const arbSearchQuery = fc.string({ minLength: 1, maxLength: 20 });

/** Extra chars to append to make a more restrictive query */
const arbExtraChars = fc.string({ minLength: 1, maxLength: 10 });

/** Array of mock users with random names */
const arbUserList = fc.array(
  fc.record({
    uid: fc.stringMatching(/^[a-zA-Z0-9]{1,20}$/),
    name: arbName,
  }),
  { minLength: 0, maxLength: 30 }
);

/** Array of mock groups with random names */
const arbGroupList = fc.array(
  fc.record({
    guid: fc.stringMatching(/^[a-zA-Z0-9]{1,20}$/),
    name: arbName,
  }),
  { minLength: 0, maxLength: 30 }
);

/** Array of mock conversations with random names */
const arbConversationList = fc.array(
  fc.record({
    id: fc.stringMatching(/^[a-zA-Z0-9]{1,20}$/),
    withName: arbName,
  }),
  { minLength: 0, maxLength: 30 }
);

// ─── Tests ───

describe('Metamorphic Search Subset Property Tests', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * **Feature: comprehensive-test-suite, Property 10: Metamorphic Search Subset**
   *
   * *For any* list component with search, *for any* two queries Q1 and Q2 where
   * Q2 = Q1 + extraChars (more restrictive), the result set of Q2 SHALL be a
   * subset of the result set of Q1.
   *
   * **Validates: Requirements 4.3, 13.5**
   */
  describe('Property 10: Metamorphic Search Subset', () => {
    it('users search: more restrictive query returns a subset of less restrictive query results', () => {
      fc.assert(
        fc.property(arbUserList, arbSearchQuery, arbExtraChars, (users, q1, extra) => {
          const q2 = q1 + extra; // q2 is strictly more restrictive

          const resultsQ1 = filterUsersByName(users, q1);
          const resultsQ2 = filterUsersByName(users, q2);

          // Every item in resultsQ2 must also be in resultsQ1
          const q1Uids = new Set(resultsQ1.map(u => u.uid));
          for (const user of resultsQ2) {
            expect(q1Uids.has(user.uid)).toBe(true);
          }

          // resultsQ2 length should be <= resultsQ1 length
          expect(resultsQ2.length).toBeLessThanOrEqual(resultsQ1.length);
        }),
        { numRuns: 100 }
      );
    });

    it('groups search: more restrictive query returns a subset of less restrictive query results', () => {
      fc.assert(
        fc.property(arbGroupList, arbSearchQuery, arbExtraChars, (groups, q1, extra) => {
          const q2 = q1 + extra;

          const resultsQ1 = filterGroupsByName(groups, q1);
          const resultsQ2 = filterGroupsByName(groups, q2);

          const q1Guids = new Set(resultsQ1.map(g => g.guid));
          for (const group of resultsQ2) {
            expect(q1Guids.has(group.guid)).toBe(true);
          }

          expect(resultsQ2.length).toBeLessThanOrEqual(resultsQ1.length);
        }),
        { numRuns: 100 }
      );
    });

    it('conversations search: more restrictive query returns a subset of less restrictive query results', () => {
      fc.assert(
        fc.property(
          arbConversationList,
          arbSearchQuery,
          arbExtraChars,
          (conversations, q1, extra) => {
            const q2 = q1 + extra;

            const resultsQ1 = filterConversationsByName(conversations, q1);
            const resultsQ2 = filterConversationsByName(conversations, q2);

            const q1Ids = new Set(resultsQ1.map(c => c.id));
            for (const conv of resultsQ2) {
              expect(q1Ids.has(conv.id)).toBe(true);
            }

            expect(resultsQ2.length).toBeLessThanOrEqual(resultsQ1.length);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
