/**
 * Unit + Property-Based Tests for Request Builder Mocks (mock-builders.ts)
 *
 * Feature: sdk-mock-testing
 *
 * Tests cover:
 * - Property 8: Builder fluent chain — all setters return `this`, build().fetchNext resolves []
 * - Unit: fetchNext() default resolves with empty array for all builders
 * - Unit: MessagesRequestBuilder also has fetchPrevious()
 *
 * @module testing/__tests__/mock-builders.spec
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  createMockConversationsRequestBuilder,
  createMockUsersRequestBuilder,
  createMockGroupsRequestBuilder,
  createMockMessagesRequestBuilder,
  createMockGroupMembersRequestBuilder,
  createMockReactionsRequestBuilder,
} from '../mock-builders';

// ─── Helpers ───

/** Extract all setter method names from a builder (everything except 'build'). */
function getSetterNames(builder: Record<string, any>): string[] {
  return Object.keys(builder).filter(key => key !== 'build');
}

/**
 * Map of builder factory name → factory function for iteration.
 * Avoids repetition across test cases.
 */
const BUILDER_FACTORIES = {
  ConversationsRequestBuilder: createMockConversationsRequestBuilder,
  UsersRequestBuilder: createMockUsersRequestBuilder,
  GroupsRequestBuilder: createMockGroupsRequestBuilder,
  MessagesRequestBuilder: createMockMessagesRequestBuilder,
  GroupMembersRequestBuilder: createMockGroupMembersRequestBuilder,
  ReactionsRequestBuilder: createMockReactionsRequestBuilder,
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// Task 9.1 — Property tests: fluent chain (all setters return `this`)
// Feature: sdk-mock-testing, Property 8: Builder fluent chain and default fetchNext
// **Validates: Requirements 5.7, 5.8**
// ═══════════════════════════════════════════════════════════════════════════════

describe('Property 8: Builder fluent chain — all setters return `this`', () => {
  for (const [name, factory] of Object.entries(BUILDER_FACTORIES)) {
    it(`${name}: random subsets of setter calls all return the builder itself`, () => {
      fc.assert(
        fc.property(fc.gen(), gen => {
          const builder = factory();
          const setters = getSetterNames(builder);

          // Pick a random non-empty subset of setters
          const subsetSize = gen(fc.integer, { min: 1, max: setters.length });
          const shuffled = [...setters].sort(() => gen(fc.integer, { min: -1, max: 1 }));
          const chosen = shuffled.slice(0, subsetSize);

          // Call each setter in sequence — each should return the builder
          let current: any = builder;
          for (const setter of chosen) {
            current = current[setter]('test-arg');
            expect(current).toBe(builder);
          }

          // After the chain, build() should return a request with fetchNext
          const request = builder.build();
          expect(request).toBeDefined();
          expect(typeof request.fetchNext).toBe('function');
        }),
        { numRuns: 100 }
      );
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// Task 9.2 — Unit tests: fetchNext() default resolves with empty array
// **Validates: Requirements 5.7**
// ═══════════════════════════════════════════════════════════════════════════════

describe('fetchNext() default resolves with empty array', () => {
  for (const [name, factory] of Object.entries(BUILDER_FACTORIES)) {
    it(`${name}: build().fetchNext() resolves with []`, async () => {
      const builder = factory();
      const request = builder.build();
      const result = await request.fetchNext();
      expect(result).toEqual([]);
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// Task 9.3 — Unit test: MessagesRequestBuilder also has fetchPrevious()
// **Validates: Requirements 5.4**
// ═══════════════════════════════════════════════════════════════════════════════

describe('MessagesRequestBuilder fetchPrevious()', () => {
  it('build() returns a request with fetchPrevious that resolves with []', async () => {
    const builder = createMockMessagesRequestBuilder();
    const request = builder.build();
    expect(typeof request.fetchPrevious).toBe('function');
    const result = await request.fetchPrevious();
    expect(result).toEqual([]);
  });

  it('other builders do NOT have fetchPrevious on the built request', () => {
    const nonMessageBuilders = {
      ConversationsRequestBuilder: createMockConversationsRequestBuilder,
      UsersRequestBuilder: createMockUsersRequestBuilder,
      GroupsRequestBuilder: createMockGroupsRequestBuilder,
      GroupMembersRequestBuilder: createMockGroupMembersRequestBuilder,
      ReactionsRequestBuilder: createMockReactionsRequestBuilder,
    };

    for (const [name, factory] of Object.entries(nonMessageBuilders)) {
      const builder = factory();
      const request = builder.build();
      expect(
        (request as any).fetchPrevious,
        `${name} should NOT have fetchPrevious`
      ).toBeUndefined();
    }
  });
});
