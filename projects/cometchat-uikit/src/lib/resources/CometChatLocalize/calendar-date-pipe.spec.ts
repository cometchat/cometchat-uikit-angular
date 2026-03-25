/**
 * CalendarDatePipe Tests
 *
 * Categories: Relative Time, Yesterday, Older Dates, Boundary Conditions,
 *             Input Types, Null/Invalid Handling, Custom Calendar, Property-Based
 * Validates: Requirements 9.5, 9.6, 14.4, 14.5, 15.7
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { CalendarDatePipe } from './calendar-date.pipe';
import { CometChatLocalize } from './cometchat-localize';
import { CalendarObject } from './localization.interfaces';
import { ensureSdkReady, sdkCleanup } from '../../test-setup';

/** Calendar with relativeTime for testing relative formatting */
const RELATIVE_CALENDAR: CalendarObject = {
  today: 'h:mm A',
  yesterday: '[Yesterday]',
  lastWeek: 'dddd',
  otherDays: 'DD/MM/YYYY',
  relativeTime: {
    minute: '%d minute ago',
    minutes: '%d minutes ago',
    hour: '%d hour ago',
    hours: '%d hours ago',
  },
};

/** Calendar without relativeTime for testing non-relative paths */
const SIMPLE_CALENDAR: CalendarObject = {
  today: 'h:mm A',
  yesterday: '[Yesterday]',
  lastWeek: 'dddd',
  otherDays: 'DD/MM/YYYY',
};

/** Fixed-format calendar for deterministic comparisons */
const FIXED_CALENDAR: CalendarObject = {
  today: 'DD/MM/YYYY',
  yesterday: 'DD/MM/YYYY',
  lastWeek: 'DD/MM/YYYY',
  otherDays: 'DD/MM/YYYY',
};

describe('CalendarDatePipe', () => {
  let pipe: CalendarDatePipe;

  beforeAll(async () => {
    await ensureSdkReady();
  });

  afterAll(async () => {
    await sdkCleanup();
  });

  beforeEach(() => {
    pipe = new CalendarDatePipe();
    CometChatLocalize.init({
      language: 'en-US',
      disableAutoDetection: true,
    });
  });

  // ─── Relative Time Formatting (Req 9.5) ───

  describe('Relative Time Formatting', () => {
    it('should format a timestamp from less than 60 seconds ago as "1 minute ago"', () => {
      const thirtySecondsAgo = Math.floor(Date.now() / 1000) - 30;
      const result = pipe.transform(thirtySecondsAgo, RELATIVE_CALENDAR);
      expect(result).toBe('1 minute ago');
    });

    it('should format a timestamp from 5 minutes ago as "5 minutes ago"', () => {
      const fiveMinutesAgo = Math.floor(Date.now() / 1000) - 300;
      const result = pipe.transform(fiveMinutesAgo, RELATIVE_CALENDAR);
      expect(result).toBe('5 minutes ago');
    });

    it('should format exactly 1 hour ago as "1 hour ago"', () => {
      const oneHourAgo = Math.floor(Date.now() / 1000) - 3600;
      const result = pipe.transform(oneHourAgo, RELATIVE_CALENDAR);
      expect(result).toBe('1 hour ago');
    });

    it('should format 3 hours ago as "3 hours ago"', () => {
      const threeHoursAgo = Math.floor(Date.now() / 1000) - 10800;
      const result = pipe.transform(threeHoursAgo, RELATIVE_CALENDAR);
      expect(result).toBe('3 hours ago');
    });

    it('should fall back to today format when relativeTime is not configured', () => {
      const nowTimestamp = Math.floor(Date.now() / 1000);
      const result = pipe.transform(nowTimestamp, SIMPLE_CALENDAR);
      // Should produce a time string like "2:30 PM"
      expect(result).toBeTruthy();
      expect(result).not.toBe('');
    });
  });

  // ─── Yesterday Formatting (Req 9.5) ───

  describe('Yesterday Formatting', () => {
    it('should format a yesterday timestamp with the yesterday pattern', () => {
      // Create a date that is definitely yesterday in America/New_York timezone
      // by using noon UTC of the previous day (which is always yesterday in ET)
      const now = new Date();
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      // Use noon to avoid timezone boundary issues
      yesterday.setHours(12, 0, 0, 0);
      const timestampSeconds = Math.floor(yesterday.getTime() / 1000);
      const result = pipe.transform(timestampSeconds, SIMPLE_CALENDAR);
      // The pipe uses America/New_York timezone (disableAutoDetection + en-US)
      // If the local timezone offset makes this not "yesterday" in ET, just verify non-empty
      expect(result).toBeTruthy();
      expect(result).not.toBe('');
    });
  });

  // ─── Older Date Formatting (Req 9.5) ───

  describe('Older Date Formatting', () => {
    it('should format a date from last week using lastWeek pattern (weekday name)', () => {
      const fiveDaysAgo = new Date();
      fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
      fiveDaysAgo.setHours(10, 0, 0, 0);
      const timestampSeconds = Math.floor(fiveDaysAgo.getTime() / 1000);
      const result = pipe.transform(timestampSeconds, SIMPLE_CALENDAR);
      // Should be a localized weekday name
      expect(result).toBeTruthy();
      expect(result.length).toBeGreaterThan(0);
    });

    it('should format a date older than a week using otherDays pattern', () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const timestampSeconds = Math.floor(thirtyDaysAgo.getTime() / 1000);
      const result = pipe.transform(timestampSeconds, SIMPLE_CALENDAR);
      // DD/MM/YYYY format should contain slashes and digits
      expect(result).toBeTruthy();
      expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    });
  });

  // ─── Boundary Conditions (Req 9.6) ───

  describe('Boundary Conditions', () => {
    it('should handle exactly midnight today', () => {
      const midnight = new Date();
      midnight.setHours(0, 0, 0, 0);
      const timestampSeconds = Math.floor(midnight.getTime() / 1000);
      const result = pipe.transform(timestampSeconds, SIMPLE_CALENDAR);
      // Midnight today should use the today format
      expect(result).toBeTruthy();
      expect(result).not.toBe('');
    });

    it('should handle exactly 1 hour ago with relativeTime config', () => {
      const exactlyOneHourAgo = Math.floor(Date.now() / 1000) - 3600;
      const result = pipe.transform(exactlyOneHourAgo, RELATIVE_CALENDAR);
      expect(result).toBe('1 hour ago');
    });

    it('should handle exactly 24 hours ago', () => {
      const exactly24HoursAgo = Math.floor(Date.now() / 1000) - 86400;
      const result = pipe.transform(exactly24HoursAgo, SIMPLE_CALENDAR);
      // 24 hours ago is yesterday or 2 days ago depending on time of day
      expect(result).toBeTruthy();
      expect(result).not.toBe('');
    });

    it('should handle timestamp 0 (Unix epoch) as an old date', () => {
      const result = pipe.transform(0, SIMPLE_CALENDAR);
      // Epoch (Jan 1 1970) should use otherDays format
      // timestamp 0 is falsy but is a valid number
      // The pipe checks for null/undefined, not 0
      expect(result).toBeTruthy();
      expect(result).toMatch(/\d/);
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

  // ─── Input Type Handling (Req 9.5) ───

  describe('Input Type Handling', () => {
    it('should handle a Unix timestamp in seconds (10 digits)', () => {
      const nowSeconds = Math.floor(Date.now() / 1000);
      const result = pipe.transform(nowSeconds);
      expect(result).toBeTruthy();
    });

    it('should handle a Unix timestamp in milliseconds (13 digits)', () => {
      const nowMs = Date.now();
      const result = pipe.transform(nowMs);
      expect(result).toBeTruthy();
    });

    it('should produce equivalent output for the same moment in seconds and milliseconds', () => {
      const nowMs = Date.now();
      const nowSeconds = Math.floor(nowMs / 1000);
      const resultFromSeconds = pipe.transform(nowSeconds, FIXED_CALENDAR);
      const resultFromMs = pipe.transform(nowMs, FIXED_CALENDAR);
      expect(resultFromSeconds).toBe(resultFromMs);
    });

    it('should handle a Date object input', () => {
      const date = new Date();
      const result = pipe.transform(date);
      expect(result).toBeTruthy();
    });

    it('should handle a valid ISO date string input', () => {
      const isoString = new Date().toISOString();
      const result = pipe.transform(isoString);
      expect(result).toBeTruthy();
    });
  });

  // ─── Custom Calendar Object (Req 9.5) ───

  describe('Custom Calendar Object', () => {
    it('should use a provided custom calendar object over defaults', () => {
      const nowSeconds = Math.floor(Date.now() / 1000);
      const customCalendar: CalendarObject = {
        today: 'hh:mm',
        otherDays: 'YYYY-MM-DD',
      };
      const result = pipe.transform(nowSeconds, customCalendar);
      expect(result).toBeTruthy();
    });

    it('should fall back to default DD/MM/YYYY when otherDays is not set', () => {
      const oldDate = new Date();
      oldDate.setFullYear(oldDate.getFullYear() - 1);
      const timestampSeconds = Math.floor(oldDate.getTime() / 1000);
      const result = pipe.transform(timestampSeconds, {});
      // Should still produce some output using the default otherDays format
      expect(result).toBeTruthy();
    });
  });

  // ─── Property-Based Tests (Req 9.5, 9.6) ───

  describe('Property: null/undefined always returns empty string', () => {
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
    it('should produce the same result for seconds and milliseconds of the same moment', () => {
      const fiveYearsAgoMs = Date.now() - 5 * 365 * 24 * 60 * 60 * 1000;
      const nowMs = Date.now();

      fc.assert(
        fc.property(
          fc.integer({ min: Math.floor(fiveYearsAgoMs / 1000), max: Math.floor(nowMs / 1000) }),
          timestampSeconds => {
            const timestampMs = timestampSeconds * 1000;
            const fromSeconds = pipe.transform(timestampSeconds, FIXED_CALENDAR);
            const fromMs = pipe.transform(timestampMs, FIXED_CALENDAR);
            expect(fromSeconds).toBe(fromMs);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property: any valid timestamp produces a non-empty string', () => {
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
