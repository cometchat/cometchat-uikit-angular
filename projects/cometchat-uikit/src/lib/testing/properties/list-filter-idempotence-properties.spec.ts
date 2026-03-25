import { describe, it, expect, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';

/**
 * Property-Based Tests for List Filter Idempotence
 *
 * Feature: comprehensive-test-suite, Property 24: List Filter Idempotence
 *
 * For any list and any filter predicate, applying the filter twice
 * produces the same result as applying it once.
 *
 * **Validates: Requirements 13.4**
 */

// ─── Filter Functions (mirror component search/filter logic) ───

function filterByName<T extends { name: string }>(items: T[], query: string): T[] {
  if (!query.trim()) return [...items];
  const lower = query.toLowerCase();
  return items.filter(item => item.name.toLowerCase().includes(lower));
}

function filterByStatus<T extends { status: string }>(items: T[], status: string): T[] {
  if (!status) return [...items];
  return items.filter(item => item.status === status);
}

function filterByType<T extends { type: string }>(items: T[], type: string): T[] {
  if (!type) return [...items];
  return items.filter(item => item.type === type);
}

function filterByPredicate<T>(items: T[], predicate: (item: T) => boolean): T[] {
  return items.filter(predicate);
}

// ─── Arbitraries ───

interface MockItem {
  id: string;
  name: string;
  status: string;
  type: string;
}

const arbStatus = fc.constantFrom('online', 'offline', 'away', 'busy');
const arbType = fc.constantFrom('user', 'group');
const arbName = fc.string({ minLength: 1, maxLength: 30 });

const arbMockItem: fc.Arbitrary<MockItem> = fc.record({
  id: fc.stringMatching(/^[a-z0-9]{1,10}$/),
  name: arbName,
  status: arbStatus,
  type: arbType,
});

const arbItemList = fc.array(arbMockItem, { minLength: 0, maxLength: 30 });
const arbSearchQuery = fc.string({ minLength: 0, maxLength: 15 });

// ─── Tests ───

describe('List Filter Idempotence Property Tests', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Property 24: List Filter Idempotence', () => {
    it('filterByName applied twice equals applied once', () => {
      fc.assert(
        fc.property(arbItemList, arbSearchQuery, (items, query) => {
          const once = filterByName(items, query);
          const twice = filterByName(once, query);

          expect(twice).toEqual(once);
        }),
        { numRuns: 200 }
      );
    });

    it('filterByStatus applied twice equals applied once', () => {
      fc.assert(
        fc.property(arbItemList, arbStatus, (items, status) => {
          const once = filterByStatus(items, status);
          const twice = filterByStatus(once, status);

          expect(twice).toEqual(once);
        }),
        { numRuns: 200 }
      );
    });

    it('filterByType applied twice equals applied once', () => {
      fc.assert(
        fc.property(arbItemList, arbType, (items, type) => {
          const once = filterByType(items, type);
          const twice = filterByType(once, type);

          expect(twice).toEqual(once);
        }),
        { numRuns: 200 }
      );
    });

    it('any pure predicate filter is idempotent', () => {
      // Test with various predicate functions
      const predicates: { name: string; fn: (item: MockItem) => boolean }[] = [
        { name: 'online only', fn: i => i.status === 'online' },
        { name: 'users only', fn: i => i.type === 'user' },
        { name: 'groups only', fn: i => i.type === 'group' },
        { name: 'name length > 3', fn: i => i.name.length > 3 },
        { name: 'id starts with a', fn: i => i.id.startsWith('a') },
      ];

      fc.assert(
        fc.property(arbItemList, fc.constantFrom(...predicates), (items, pred) => {
          const once = filterByPredicate(items, pred.fn);
          const twice = filterByPredicate(once, pred.fn);

          expect(twice).toEqual(once);
        }),
        { numRuns: 200 }
      );
    });

    it('empty query filter returns original list (identity)', () => {
      fc.assert(
        fc.property(arbItemList, items => {
          const result = filterByName(items, '');
          expect(result).toEqual(items);
        }),
        { numRuns: 100 }
      );
    });

    it('filtered result is always a subset of original', () => {
      fc.assert(
        fc.property(arbItemList, arbSearchQuery, (items, query) => {
          const filtered = filterByName(items, query);

          // Every item in filtered must exist in original
          for (const item of filtered) {
            expect(items).toContainEqual(item);
          }
          // Filtered length <= original length
          expect(filtered.length).toBeLessThanOrEqual(items.length);
        }),
        { numRuns: 200 }
      );
    });

    it('chained different filters are order-independent for intersection', () => {
      fc.assert(
        fc.property(arbItemList, arbStatus, arbType, (items, status, type) => {
          // Filter status then type
          const statusFirst = filterByType(filterByStatus(items, status), type);
          // Filter type then status
          const typeFirst = filterByStatus(filterByType(items, type), status);

          // Same items (order may differ, so sort by id)
          const sortById = (a: MockItem, b: MockItem) => a.id.localeCompare(b.id);
          expect([...statusFirst].sort(sortById)).toEqual([...typeFirst].sort(sortById));
        }),
        { numRuns: 200 }
      );
    });
  });
});
