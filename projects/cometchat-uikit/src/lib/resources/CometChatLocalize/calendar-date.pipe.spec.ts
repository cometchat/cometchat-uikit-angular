/**
 * CalendarDatePipe, ConversationDatePipe, MessageDatePipe Tests
 *
 * Spec for the date formatting pipes that provide
 * localized calendar date formatting.
 *
 * The clock is pinned (only `Date` is faked) and the localizer runs in
 * en-US / UTC so every expected string is exact.
 *
 * Validates: Requirements 8.1, 8.2, 8.9, 9.5, 9.6
 *
 * @module resources/CometChatLocalize/calendar-date.pipe
 */
import * as fc from 'fast-check';
import { CalendarDatePipe, ConversationDatePipe, MessageDatePipe } from './calendar-date.pipe';
import { CometChatLocalize } from './cometchat-localize';
import { CalendarObject } from './localization.interfaces';

/** Pinned "now": 2024-06-15 12:00 UTC (a Saturday). */
const NOW = new Date('2024-06-15T12:00:00Z');
/** 2024-01-15 10:00:00 UTC — older than a week relative to NOW. */
const OLD_SECONDS = 1705312800;
const OLD_MILLIS = OLD_SECONDS * 1000;
const secondsOf = (iso: string) => Math.floor(Date.parse(iso) / 1000);

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(NOW);
  CometChatLocalize.init({ language: 'en-US', timezone: 'UTC', disableAutoDetection: true });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('CalendarDatePipe', () => {
  let pipe: CalendarDatePipe;

  beforeEach(() => {
    pipe = new CalendarDatePipe();
  });

  // -------------------------------------------------------------------------
  // Default Render
  // -------------------------------------------------------------------------
  describe('Default behavior', () => {
    it('should create the pipe', () => {
      expect(pipe).toBeTruthy();
    });

    it('should return a string for a valid Unix timestamp', () => {
      // en-US otherDays pattern is MM/DD/YYYY
      expect(pipe.transform(OLD_SECONDS)).toBe('01/15/2024');
      // Same day as "now" uses the en-US time pattern (hh:mm A)
      expect(pipe.transform(secondsOf('2024-06-15T09:30:00Z'))).toBe('09:30 AM');
      expect(pipe.transform(secondsOf('2024-06-14T09:30:00Z'))).toBe('Yesterday');
      expect(pipe.transform(secondsOf('2024-06-12T09:30:00Z'))).toBe('Wednesday');
    });
  });

  // -------------------------------------------------------------------------
  // Loading State (N/A for pipe — placeholder)
  // -------------------------------------------------------------------------

  // -------------------------------------------------------------------------
  // Empty State
  // -------------------------------------------------------------------------
  describe('Empty / null handling', () => {
    it('should return empty string for null input', () => {
      expect(pipe.transform(null)).toBe('');
    });

    it('should return empty string for undefined input', () => {
      expect(pipe.transform(undefined)).toBe('');
    });

    it('should return empty string for invalid date string', () => {
      expect(pipe.transform('not-a-date')).toBe('');
    });
  });

  // -------------------------------------------------------------------------
  // Error State
  // -------------------------------------------------------------------------
  describe('Error handling', () => {
    it('should not throw for NaN timestamp', () => {
      // An unusable number must be treated like an unparseable string: ''
      expect(() => pipe.transform(NaN)).not.toThrow();
      expect(pipe.transform(NaN)).toBe('');
    });

    it('should not throw for negative timestamp', () => {
      // -1 s is 1969-12-31 23:59:59 UTC — a valid (pre-epoch) date
      expect(() => pipe.transform(-1)).not.toThrow();
      expect(pipe.transform(-1)).toBe('12/31/1969');
    });
  });

  // -------------------------------------------------------------------------
  // Key Interactions — Input Types
  // -------------------------------------------------------------------------
  describe('Input type handling', () => {
    it('should handle Unix timestamp in seconds', () => {
      expect(pipe.transform(OLD_SECONDS)).toBe('01/15/2024');
    });

    it('should handle Unix timestamp in milliseconds', () => {
      // 13-digit value is detected as ms and gives the same result as seconds
      expect(pipe.transform(OLD_MILLIS)).toBe('01/15/2024');
      expect(pipe.transform(OLD_MILLIS)).toBe(pipe.transform(OLD_SECONDS));
    });

    it('should handle Date object input', () => {
      expect(pipe.transform(new Date(OLD_MILLIS))).toBe('01/15/2024');
      expect(pipe.transform(new Date('2024-06-15T08:05:00Z'))).toBe('08:05 AM');
    });

    it('should handle date string input', () => {
      // ISO date-only strings parse as UTC midnight
      expect(pipe.transform('2024-01-15')).toBe('01/15/2024');
      expect(pipe.transform('2024-01-15T10:00:00Z')).toBe('01/15/2024');
    });

    it('should accept a custom CalendarObject', () => {
      const custom = {
        today: '[Today] HH:mm',
        yesterday: '[Yday] HH:mm',
        lastWeek: 'ddd HH:mm',
        otherDays: 'YYYY-MM-DD [at] HH:mm',
      };
      expect(pipe.transform(OLD_SECONDS, custom)).toBe('2024-01-15 at 10:00');
      expect(pipe.transform(secondsOf('2024-06-15T09:30:00Z'), custom)).toBe('Today 09:30');
      expect(pipe.transform(secondsOf('2024-06-14T21:15:00Z'), custom)).toBe('Yday 21:15');
      expect(pipe.transform(secondsOf('2024-06-12T09:30:00Z'), custom)).toBe('Wed 09:30');
    });

    it('should fall back to the DD/MM/YYYY otherDays default for an empty CalendarObject', () => {
      // No today/yesterday/lastWeek patterns: every bucket falls through to otherDays,
      // and the missing otherDays defaults to DD/MM/YYYY (not the en-US MM/DD/YYYY)
      expect(pipe.transform(OLD_SECONDS, {})).toBe('15/01/2024');
      expect(pipe.transform(secondsOf('2024-06-15T09:30:00Z'), {})).toBe('15/06/2024');
    });
  });

  // -------------------------------------------------------------------------
  // Relative time (calendar with a relativeTime block)
  // -------------------------------------------------------------------------
  describe('Relative time formatting', () => {
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
    const nowSeconds = () => Math.floor(NOW.getTime() / 1000);

    it('should format less than 60 seconds ago as "1 minute ago"', () => {
      expect(pipe.transform(nowSeconds() - 30, RELATIVE_CALENDAR)).toBe('1 minute ago');
    });

    it('should format 5 minutes ago as "5 minutes ago"', () => {
      expect(pipe.transform(nowSeconds() - 300, RELATIVE_CALENDAR)).toBe('5 minutes ago');
    });

    it('should format exactly 1 hour ago with the singular hour pattern', () => {
      expect(pipe.transform(nowSeconds() - 3600, RELATIVE_CALENDAR)).toBe('1 hour ago');
    });

    it('should format 3 hours ago with the plural hours pattern', () => {
      expect(pipe.transform(nowSeconds() - 10800, RELATIVE_CALENDAR)).toBe('3 hours ago');
    });
  });

  // -------------------------------------------------------------------------
  // Boundary conditions
  // -------------------------------------------------------------------------
  describe('Boundary conditions', () => {
    it('should format exactly midnight today with the today pattern', () => {
      expect(pipe.transform(secondsOf('2024-06-15T00:00:00Z'))).toBe('12:00 AM');
    });

    it('should format exactly 24 hours ago as Yesterday', () => {
      expect(pipe.transform(secondsOf('2024-06-14T12:00:00Z'))).toBe('Yesterday');
    });

    it('should treat timestamp 0 (Unix epoch) as a valid old date, not as empty', () => {
      expect(pipe.transform(0)).toBe('01/01/1970');
    });
  });

  // -------------------------------------------------------------------------
  // Property-based
  // -------------------------------------------------------------------------
  describe('Properties', () => {
    const nowSec = Math.floor(NOW.getTime() / 1000);
    const fiveYearsAgoSec = nowSec - 5 * 365 * 24 * 60 * 60;
    const FIXED_CALENDAR: CalendarObject = {
      today: 'DD/MM/YYYY',
      yesterday: 'DD/MM/YYYY',
      lastWeek: 'DD/MM/YYYY',
      otherDays: 'DD/MM/YYYY',
    };

    it('should produce the same result for seconds and milliseconds of the same moment', () => {
      fc.assert(
        fc.property(fc.integer({ min: fiveYearsAgoSec, max: nowSec }), timestampSeconds => {
          expect(pipe.transform(timestampSeconds, FIXED_CALENDAR)).toBe(
            pipe.transform(timestampSeconds * 1000, FIXED_CALENDAR)
          );
        }),
        { numRuns: 100 }
      );
    });

    it('should format any timestamp in the last five years into one of the en-US buckets', () => {
      const bucket =
        /^(\d{2}:\d{2} (AM|PM)|Yesterday|(Sun|Mon|Tues|Wednes|Thurs|Fri|Satur)day|\d{2}\/\d{2}\/\d{4})$/;
      fc.assert(
        fc.property(fc.integer({ min: fiveYearsAgoSec, max: nowSec }), timestamp => {
          expect(pipe.transform(timestamp)).toMatch(bucket);
        }),
        { numRuns: 100 }
      );
    });
  });
});

describe('ConversationDatePipe', () => {
  let pipe: ConversationDatePipe;

  beforeEach(() => {
    pipe = new ConversationDatePipe();
  });

  // -------------------------------------------------------------------------
  // Default Render
  // -------------------------------------------------------------------------
  describe('Default behavior', () => {
    it('should create the pipe', () => {
      expect(pipe).toBeTruthy();
    });

    it('should return a formatted string for a valid timestamp', () => {
      // Compact format: two-digit year, short weekday
      expect(pipe.transform(OLD_SECONDS)).toBe('01/15/24');
      expect(pipe.transform(secondsOf('2024-06-15T09:30:00Z'))).toBe('09:30 AM');
      expect(pipe.transform(secondsOf('2024-06-14T09:30:00Z'))).toBe('Yesterday');
      expect(pipe.transform(secondsOf('2024-06-12T09:30:00Z'))).toBe('Wed');
    });
  });

  // -------------------------------------------------------------------------
  // Empty State
  // -------------------------------------------------------------------------
  describe('Empty / null handling', () => {
    it('should return empty string for null input', () => {
      expect(pipe.transform(null)).toBe('');
    });

    it('should return empty string for undefined input', () => {
      expect(pipe.transform(undefined)).toBe('');
    });
  });
});

describe('MessageDatePipe', () => {
  let pipe: MessageDatePipe;

  beforeEach(() => {
    pipe = new MessageDatePipe();
  });

  // -------------------------------------------------------------------------
  // Default Render
  // -------------------------------------------------------------------------
  describe('Default behavior', () => {
    it('should create the pipe', () => {
      expect(pipe).toBeTruthy();
    });

    it('should return a formatted string for a valid timestamp', () => {
      // Message-bubble format: every bucket carries the time
      expect(pipe.transform(OLD_SECONDS)).toBe('Jan 15, 2024 10:00 AM');
      expect(pipe.transform(secondsOf('2024-06-15T09:30:00Z'))).toBe('09:30 AM');
      expect(pipe.transform(secondsOf('2024-06-14T09:30:00Z'))).toBe('Yesterday 09:30 AM');
      expect(pipe.transform(secondsOf('2024-06-12T09:30:00Z'))).toBe('Wednesday 09:30 AM');
    });
  });

  // -------------------------------------------------------------------------
  // Empty State
  // -------------------------------------------------------------------------
  describe('Empty / null handling', () => {
    it('should return empty string for null input', () => {
      expect(pipe.transform(null)).toBe('');
    });

    it('should return empty string for undefined input', () => {
      expect(pipe.transform(undefined)).toBe('');
    });
  });
});
