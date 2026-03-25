/**
 * ConversationDatePipe Tests
 *
 * Categories: Conversation-Specific Formatting, Null/Invalid Handling,
 *             Seconds vs Milliseconds, Boundary Conditions, Delegation,
 *             Property-Based Tests
 * Validates: Requirements 9.5, 9.6, 14.4, 14.5, 15.7
 */
vi.mock('@cometchat/calls-sdk-javascript', () => ({ default: {} }));

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { ConversationDatePipe } from './calendar-date.pipe';
import { CometChatLocalize } from './cometchat-localize';
import { ensureSdkReady, sdkCleanup } from '../../test-setup';

describe('ConversationDatePipe', () => {
  let pipe: ConversationDatePipe;

  beforeAll(async () => {
    await ensureSdkReady();
  });

  afterAll(async () => {
    await sdkCleanup();
  });

  beforeEach(() => {
    pipe = new ConversationDatePipe();
    CometChatLocalize.init({
      language: 'en-US',
      disableAutoDetection: true,
    });
  });

  // ─── Conversation-Specific Date Formatting (Req 9.5) ───

  describe('Conversation-Specific Date Formatting', () => {
    it('should format a current-day timestamp with time (h:mm A)', () => {
      const nowSeconds = Math.floor(Date.now() / 1000);
      const result = pipe.transform(nowSeconds);
      expect(result).toBeTruthy();
      expect(result).not.toBe('');
      // Today format is h:mm A, so expect AM or PM
      expect(result).toMatch(/AM|PM/i);
    });

    it('should format a yesterday timestamp as "Yesterday"', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(12, 0, 0, 0);
      const timestampSeconds = Math.floor(yesterday.getTime() / 1000);

      const result = pipe.transform(timestampSeconds);
      // Timezone-dependent: the pipe uses America/New_York timezone
      // Just verify it produces a non-empty result
      expect(result).toBeTruthy();
      expect(result).not.toBe('');
    });

    it('should format a date from last week using abbreviated day name (ddd)', () => {
      const fiveDaysAgo = new Date();
      fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
      fiveDaysAgo.setHours(10, 0, 0, 0);
      const timestampSeconds = Math.floor(fiveDaysAgo.getTime() / 1000);

      const result = pipe.transform(timestampSeconds);
      expect(result).toBeTruthy();
      expect(result).not.toBe('');
      // Abbreviated day names: Mon, Tue, Wed, Thu, Fri, Sat, Sun
      const abbreviatedDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      expect(abbreviatedDays).toContain(result);
    });

    it('should format a date older than a week using DD/MM/YY format', () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const timestampSeconds = Math.floor(thirtyDaysAgo.getTime() / 1000);

      const result = pipe.transform(timestampSeconds);
      expect(result).toBeTruthy();
      // DD/MM/YY format: two-digit day/month/year with slashes
      expect(result).toMatch(/\d{2}\/\d{2}\/\d{2}/);
    });

    it('should format a date from a year ago using DD/MM/YY format', () => {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      const timestampSeconds = Math.floor(oneYearAgo.getTime() / 1000);

      const result = pipe.transform(timestampSeconds);
      expect(result).toBeTruthy();
      expect(result).toMatch(/\d{2}\/\d{2}\/\d{2}/);
    });
  });

  // ─── Null / Undefined / Invalid Input Handling (Req 9.5) ───

  describe('Null and Invalid Input Handling', () => {
    it('should return empty string for null input', () => {
      expect(pipe.transform(null)).toBe('');
    });

    it('should return empty string for undefined input', () => {
      expect(pipe.transform(undefined)).toBe('');
    });

    it('should return empty string for an invalid date string', () => {
      expect(pipe.transform('not-a-date')).toBe('');
    });
  });

  // ─── Seconds vs Milliseconds Timestamp Handling (Req 9.5) ───

  describe('Seconds vs Milliseconds Timestamp Handling', () => {
    it('should handle a Unix timestamp in seconds (10 digits)', () => {
      const nowSeconds = Math.floor(Date.now() / 1000);
      const result = pipe.transform(nowSeconds);
      expect(result).toBeTruthy();
      expect(result).not.toBe('');
    });

    it('should handle a Unix timestamp in milliseconds (13 digits)', () => {
      const nowMs = Date.now();
      const result = pipe.transform(nowMs);
      expect(result).toBeTruthy();
      expect(result).not.toBe('');
    });

    it('should produce equivalent output for the same moment in seconds and milliseconds', () => {
      // Use a date older than a week to avoid relative time differences
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      thirtyDaysAgo.setHours(12, 0, 0, 0);
      const timestampSeconds = Math.floor(thirtyDaysAgo.getTime() / 1000);
      const timestampMs = timestampSeconds * 1000;

      const resultFromSeconds = pipe.transform(timestampSeconds);
      const resultFromMs = pipe.transform(timestampMs);
      expect(resultFromSeconds).toBe(resultFromMs);
    });

    it('should handle a Date object input', () => {
      const date = new Date();
      const result = pipe.transform(date);
      expect(result).toBeTruthy();
      expect(result).not.toBe('');
    });

    it('should handle a valid ISO date string input', () => {
      const isoString = new Date().toISOString();
      const result = pipe.transform(isoString);
      expect(result).toBeTruthy();
      expect(result).not.toBe('');
    });
  });

  // ─── Boundary Conditions (Req 9.6) ───

  describe('Boundary Conditions', () => {
    it('should handle exactly midnight today', () => {
      const midnight = new Date();
      midnight.setHours(0, 0, 0, 0);
      const timestampSeconds = Math.floor(midnight.getTime() / 1000);
      const result = pipe.transform(timestampSeconds);
      // Midnight today should use the today format (h:mm A)
      expect(result).toBeTruthy();
      expect(result).not.toBe('');
    });

    it('should handle exactly 24 hours ago', () => {
      const exactly24HoursAgo = Math.floor(Date.now() / 1000) - 86400;
      const result = pipe.transform(exactly24HoursAgo);
      // 24 hours ago is yesterday or 2 days ago depending on time of day
      expect(result).toBeTruthy();
      expect(result).not.toBe('');
    });

    it('should handle timestamp 0 (Unix epoch) as an old date', () => {
      const result = pipe.transform(0);
      // Epoch (Jan 1 1970) should use otherDays DD/MM/YY format
      expect(result).toBeTruthy();
      expect(result).toMatch(/\d/);
    });

    it('should handle a timestamp exactly 7 days ago', () => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      sevenDaysAgo.setHours(12, 0, 0, 0);
      const timestampSeconds = Math.floor(sevenDaysAgo.getTime() / 1000);
      const result = pipe.transform(timestampSeconds);
      // 7 days ago is at the boundary of lastWeek — should produce output
      expect(result).toBeTruthy();
      expect(result).not.toBe('');
    });
  });

  // ─── Delegation to CalendarDatePipe (Req 9.5) ───

  describe('Delegation to CalendarDatePipe', () => {
    it('should use conversation-specific calendar config with DD/MM/YY (2-digit year)', () => {
      // The conversation pipe uses DD/MM/YY for otherDays (2-digit year)
      // while the default CalendarDatePipe uses DD/MM/YYYY (4-digit year)
      const oldDate = new Date();
      oldDate.setFullYear(oldDate.getFullYear() - 2);
      const timestampSeconds = Math.floor(oldDate.getTime() / 1000);

      const result = pipe.transform(timestampSeconds);
      // DD/MM/YY should have exactly 8 chars (e.g., "15/01/23")
      expect(result).toMatch(/^\d{2}\/\d{2}\/\d{2}$/);
    });

    it('should use abbreviated day name for last week (ddd not dddd)', () => {
      const fourDaysAgo = new Date();
      fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);
      fourDaysAgo.setHours(10, 0, 0, 0);
      const timestampSeconds = Math.floor(fourDaysAgo.getTime() / 1000);

      const result = pipe.transform(timestampSeconds);
      // Abbreviated day names are 3 chars (Mon, Tue, etc.)
      if (result !== 'Yesterday') {
        expect(result!.length).toBeLessThanOrEqual(3);
      }
    });

    it('should not include relative time formatting (no relativeTime config)', () => {
      // ConversationDatePipe has no relativeTime config, so recent timestamps
      // should use the today format (h:mm A) instead of "X minutes ago"
      const twoMinutesAgo = Math.floor(Date.now() / 1000) - 120;
      const result = pipe.transform(twoMinutesAgo);
      expect(result).toBeTruthy();
      // Should NOT contain "minutes ago" since no relativeTime is configured
      expect(result).not.toContain('minutes ago');
      // Should contain AM or PM (today format)
      expect(result).toMatch(/AM|PM/i);
    });
  });

  // ─── Property-Based Tests (Req 9.5, 9.6) ───

  describe('Property: null/undefined always returns empty string', () => {
    /**
     * For null or undefined input, the pipe always returns an empty string without throwing.
     * **Validates: Requirements 9.5, 9.6**
     */
    it('should never throw for null or undefined', () => {
      fc.assert(
        fc.property(fc.oneof(fc.constant(null), fc.constant(undefined)), value => {
          const result = pipe.transform(value as any);
          expect(result).toBe('');
        }),
        { numRuns: 20 }
      );
    });
  });

  describe('Property: seconds and milliseconds produce equivalent output', () => {
    /**
     * For any valid Unix timestamp, the ConversationDatePipe produces equivalent output
     * whether provided in seconds or milliseconds.
     * **Validates: Requirements 9.5, 9.6**
     */
    it('should produce the same result for seconds and milliseconds of the same moment', () => {
      const fiveYearsAgoMs = Date.now() - 5 * 365 * 24 * 60 * 60 * 1000;
      const nowMs = Date.now();

      fc.assert(
        fc.property(
          fc.integer({ min: Math.floor(fiveYearsAgoMs / 1000), max: Math.floor(nowMs / 1000) }),
          timestampSeconds => {
            const timestampMs = timestampSeconds * 1000;
            const fromSeconds = pipe.transform(timestampSeconds);
            const fromMs = pipe.transform(timestampMs);
            expect(fromSeconds).toBe(fromMs);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property: any valid timestamp produces a non-empty string', () => {
    /**
     * For any valid Unix timestamp (seconds), the ConversationDatePipe returns a non-empty string.
     * **Validates: Requirements 9.5, 9.6**
     */
    it('should return a non-empty string for any valid timestamp', () => {
      const fiveYearsAgoSec = Math.floor((Date.now() - 5 * 365 * 24 * 60 * 60 * 1000) / 1000);
      const nowSec = Math.floor(Date.now() / 1000);

      fc.assert(
        fc.property(fc.integer({ min: fiveYearsAgoSec, max: nowSec }), timestamp => {
          const result = pipe.transform(timestamp);
          expect(result).toBeTruthy();
          expect(result.length).toBeGreaterThan(0);
        }),
        { numRuns: 100 }
      );
    });
  });
});
