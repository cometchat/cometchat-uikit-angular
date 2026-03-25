import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { CometChatUIKitUtility } from './CometChatUIKitUtility';

/**
 * Property-Based Tests for CometChatUIKitUtility
 *
 * These tests verify universal properties that should hold across all inputs,
 * using fast-check for property-based testing.
 *
 * Feature: pr-review-fixes, Property 1: ID Uniqueness
 */
describe('CometChatUIKitUtility Property Tests', () => {
  /**
   * **Feature: pr-review-fixes, Property 1: ID Uniqueness**
   *
   * *For any* number of calls to CometChatUIKitUtility.ID(), all returned IDs
   * should be unique strings that are non-empty and not equal to the static string 'id'.
   *
   * **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
   */
  describe('Property 1: ID Uniqueness', () => {
    /**
     * Test that all generated IDs are unique across multiple calls
     */
    it('should generate unique IDs across multiple calls', () => {
      fc.assert(
        fc.property(fc.integer({ min: 10, max: 1000 }), count => {
          const ids = new Set<string>();
          for (let i = 0; i < count; i++) {
            const id = CometChatUIKitUtility.ID();
            // Verify ID is not the static string 'id'
            expect(id).not.toBe('id');
            // Verify ID is non-empty
            expect(id.length).toBeGreaterThan(0);
            // Verify ID is unique (not already in the set)
            expect(ids.has(id)).toBe(false);
            ids.add(id);
          }
          // Final verification: all IDs are unique
          return ids.size === count;
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test that IDs are always non-empty strings
     */
    it('should always generate non-empty string IDs', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 100 }), count => {
          for (let i = 0; i < count; i++) {
            const id = CometChatUIKitUtility.ID();
            expect(typeof id).toBe('string');
            expect(id.length).toBeGreaterThan(0);
          }
          return true;
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test that IDs never equal the static string 'id'
     */
    it('should never return the static string "id"', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 500 }), count => {
          for (let i = 0; i < count; i++) {
            const id = CometChatUIKitUtility.ID();
            expect(id).not.toBe('id');
          }
          return true;
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test that IDs follow the expected format (cc_timestamp_counter_random)
     */
    it('should generate IDs with the expected prefix format', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 100 }), count => {
          for (let i = 0; i < count; i++) {
            const id = CometChatUIKitUtility.ID();
            // ID should start with 'cc_' prefix
            expect(id.startsWith('cc_')).toBe(true);
            // ID should contain underscores separating components
            const parts = id.split('_');
            expect(parts.length).toBeGreaterThanOrEqual(4);
          }
          return true;
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test that rapid successive calls still produce unique IDs
     * This tests the counter mechanism for same-millisecond uniqueness
     */
    it('should generate unique IDs even with rapid successive calls', () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          const ids = new Set<string>();
          const rapidCount = 1000;

          // Generate many IDs as fast as possible
          for (let i = 0; i < rapidCount; i++) {
            const id = CometChatUIKitUtility.ID();
            expect(ids.has(id)).toBe(false);
            ids.add(id);
          }

          return ids.size === rapidCount;
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test that IDs are suitable for use as listener IDs and component identifiers
     * (no special characters that would cause issues)
     */
    it('should generate IDs suitable for use as identifiers', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 100 }), count => {
          for (let i = 0; i < count; i++) {
            const id = CometChatUIKitUtility.ID();
            // ID should only contain alphanumeric characters and underscores
            expect(/^[a-zA-Z0-9_]+$/.test(id)).toBe(true);
          }
          return true;
        }),
        { numRuns: 100 }
      );
    });
  });
});
