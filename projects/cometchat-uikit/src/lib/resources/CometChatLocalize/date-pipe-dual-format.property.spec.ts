/**
 * Property-Based Tests for Date Pipe Non-Empty Output
 *
 * Categories: Property-Based Date Formatting Invariants
 * Validates: Requirements 12.4, 9.5
 *
 * Property 4: Date Pipe Non-Empty Output
 * For any valid Unix timestamp (positive integer representing seconds since epoch),
 * CalendarDatePipe.transform(timestamp), ConversationDatePipe.transform(timestamp),
 * and MessageDatePipe.transform(timestamp) shall each produce a non-empty string.
 *
 * @module resources/CometChatLocalize/date-pipe-dual-format.property
 */
vi.mock('@cometchat/calls-sdk-javascript', () => ({ default: {} }));

import { vi, describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { ensureSdkReady, sdkCleanup } from '../../test-setup';
import { CalendarDatePipe, ConversationDatePipe, MessageDatePipe } from './calendar-date.pipe';
import { CometChatLocalize } from './cometchat-localize';
import { CalendarObject } from './localization.interfaces';

// ==================== Constants ====================

/**
 * A fixed calendar config with NO relativeTime to avoid timing-sensitive
 * differences. All branches use absolute date formats so output is deterministic.
 */
const FIXED_CALENDAR: CalendarObject = {
  today: 'DD/MM/YYYY',
  yesterday: 'DD/MM/YYYY',
  lastWeek: 'DD/MM/YYYY',
  otherDays: 'DD/MM/YYYY',
};

/**
 * Calendar config WITH relativeTime enabled, matching the default pipe behavior.
 */
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

// ==================== Arbitraries ====================

/** Timestamps spanning ~50 years (1974 → 2024-ish), well within 10-digit seconds range. */
const arbTimestampSeconds = fc.integer({ min: 100_000_000, max: 1_700_000_000 });

/** Recent timestamps: within the last hour (relative time territory). */
const arbRecentTimestamp = fc
  .integer({ min: 0, max: 3500 })
  .map(secsAgo => Math.floor(Date.now() / 1000) - secsAgo);

/** Timestamps from yesterday (24–48 hours ago). */
const arbYesterdayTimestamp = fc
  .integer({ min: 86400, max: 172800 })
  .map(secsAgo => Math.floor(Date.now() / 1000) - secsAgo);

/** Timestamps from last week (2–7 days ago). */
const arbLastWeekTimestamp = fc
  .integer({ min: 172801, max: 604800 })
  .map(secsAgo => Math.floor(Date.now() / 1000) - secsAgo);

/** Timestamps older than a week. */
const arbOldTimestamp = fc
  .integer({ min: 604801, max: 31536000 })
  .map(secsAgo => Math.floor(Date.now() / 1000) - secsAgo);

/** Millisecond timestamps (13-digit). */
const arbTimestampMillis = arbTimestampSeconds.map(ts => ts * 1000);

// ==================== Tests ====================

describe('Property 4: Date Pipe Non-Empty Output', () => {
  let calendarPipe: CalendarDatePipe;
  let conversationPipe: ConversationDatePipe;
  let messagePipe: MessageDatePipe;

  beforeAll(async () => {
    await ensureSdkReady();
  });

  afterAll(async () => {
    await sdkCleanup();
  });

  beforeEach(() => {
    CometChatLocalize.init({
      language: 'en-US',
      disableAutoDetection: true,
    });
    calendarPipe = new CalendarDatePipe();
    conversationPipe = new ConversationDatePipe();
    messagePipe = new MessageDatePipe();
  });

  // ---------- Core Property: CalendarDatePipe non-empty for any timestamp ----------

  /**
   * **Validates: Requirements 12.4, 9.5**
   *
   * For any valid Unix timestamp in seconds, CalendarDatePipe.transform()
   * produces a non-empty string.
   */
  it('CalendarDatePipe produces non-empty output for any Unix timestamp (seconds)', () => {
    fc.assert(
      fc.property(arbTimestampSeconds, ts => {
        const result = calendarPipe.transform(ts, FIXED_CALENDAR);
        expect(result).toBeTruthy();
        expect(typeof result).toBe('string');
        expect(result.trim().length).toBeGreaterThan(0);
      }),
      { numRuns: 150 }
    );
  });

  // ---------- Core Property: ConversationDatePipe non-empty ----------

  /**
   * **Validates: Requirements 12.4, 9.5**
   *
   * For any valid Unix timestamp, ConversationDatePipe.transform()
   * produces a non-empty string.
   */
  it('ConversationDatePipe produces non-empty output for any Unix timestamp', () => {
    fc.assert(
      fc.property(arbTimestampSeconds, ts => {
        const result = conversationPipe.transform(ts);
        expect(result).toBeTruthy();
        expect(typeof result).toBe('string');
        expect(result.trim().length).toBeGreaterThan(0);
      }),
      { numRuns: 150 }
    );
  });

  // ---------- Core Property: MessageDatePipe non-empty ----------

  /**
   * **Validates: Requirements 12.4, 9.5**
   *
   * For any valid Unix timestamp, MessageDatePipe.transform()
   * produces a non-empty string.
   */
  it('MessageDatePipe produces non-empty output for any Unix timestamp', () => {
    fc.assert(
      fc.property(arbTimestampSeconds, ts => {
        const result = messagePipe.transform(ts);
        expect(result).toBeTruthy();
        expect(typeof result).toBe('string');
        expect(result.trim().length).toBeGreaterThan(0);
      }),
      { numRuns: 150 }
    );
  });

  // ---------- Millisecond timestamps also produce non-empty output ----------

  /**
   * **Validates: Requirements 12.4, 9.5**
   *
   * For any valid millisecond timestamp (13-digit), all three pipes
   * produce non-empty strings.
   */
  it('CalendarDatePipe produces non-empty output for millisecond timestamps', () => {
    fc.assert(
      fc.property(arbTimestampMillis, tsMs => {
        const result = calendarPipe.transform(tsMs, FIXED_CALENDAR);
        expect(result).toBeTruthy();
        expect(result.trim().length).toBeGreaterThan(0);
      }),
      { numRuns: 100 }
    );
  });

  // ---------- Recent timestamps (relative time branch) ----------

  /**
   * **Validates: Requirements 12.4, 9.5**
   *
   * For recent timestamps (within the last hour), CalendarDatePipe with
   * relativeTime config produces a non-empty string.
   */
  it('CalendarDatePipe produces non-empty output for recent timestamps with relativeTime', () => {
    fc.assert(
      fc.property(arbRecentTimestamp, ts => {
        const result = calendarPipe.transform(ts, RELATIVE_CALENDAR);
        expect(result).toBeTruthy();
        expect(result.trim().length).toBeGreaterThan(0);
      }),
      { numRuns: 100 }
    );
  });

  // ---------- Yesterday timestamps ----------

  /**
   * **Validates: Requirements 12.4, 9.5**
   *
   * For timestamps from yesterday, all pipes produce non-empty strings.
   */
  it('all pipes produce non-empty output for yesterday timestamps', () => {
    fc.assert(
      fc.property(arbYesterdayTimestamp, ts => {
        const calResult = calendarPipe.transform(ts, FIXED_CALENDAR);
        const convResult = conversationPipe.transform(ts);
        const msgResult = messagePipe.transform(ts);

        expect(calResult.trim().length).toBeGreaterThan(0);
        expect(convResult.trim().length).toBeGreaterThan(0);
        expect(msgResult.trim().length).toBeGreaterThan(0);
      }),
      { numRuns: 100 }
    );
  });

  // ---------- Last week timestamps ----------

  /**
   * **Validates: Requirements 12.4, 9.5**
   *
   * For timestamps from last week, all pipes produce non-empty strings.
   */
  it('all pipes produce non-empty output for last week timestamps', () => {
    fc.assert(
      fc.property(arbLastWeekTimestamp, ts => {
        const calResult = calendarPipe.transform(ts, FIXED_CALENDAR);
        const convResult = conversationPipe.transform(ts);
        const msgResult = messagePipe.transform(ts);

        expect(calResult.trim().length).toBeGreaterThan(0);
        expect(convResult.trim().length).toBeGreaterThan(0);
        expect(msgResult.trim().length).toBeGreaterThan(0);
      }),
      { numRuns: 100 }
    );
  });

  // ---------- Old timestamps (otherDays branch) ----------

  /**
   * **Validates: Requirements 12.4, 9.5**
   *
   * For timestamps older than a week, all pipes produce non-empty strings.
   */
  it('all pipes produce non-empty output for old timestamps', () => {
    fc.assert(
      fc.property(arbOldTimestamp, ts => {
        const calResult = calendarPipe.transform(ts, FIXED_CALENDAR);
        const convResult = conversationPipe.transform(ts);
        const msgResult = messagePipe.transform(ts);

        expect(calResult.trim().length).toBeGreaterThan(0);
        expect(convResult.trim().length).toBeGreaterThan(0);
        expect(msgResult.trim().length).toBeGreaterThan(0);
      }),
      { numRuns: 100 }
    );
  });

  // ---------- Date object input ----------

  /**
   * **Validates: Requirements 12.4, 9.5**
   *
   * For any Date object derived from a valid timestamp, CalendarDatePipe
   * produces a non-empty string.
   */
  it('CalendarDatePipe produces non-empty output for Date object inputs', () => {
    fc.assert(
      fc.property(arbTimestampSeconds, ts => {
        const dateObj = new Date(ts * 1000);
        const result = calendarPipe.transform(dateObj, FIXED_CALENDAR);
        expect(result).toBeTruthy();
        expect(result.trim().length).toBeGreaterThan(0);
      }),
      { numRuns: 100 }
    );
  });

  // ---------- Output is always a string type ----------

  /**
   * **Validates: Requirements 12.4, 9.5**
   *
   * For any valid Unix timestamp, all three pipes return a value of type string.
   */
  it('all pipes return string type for any valid timestamp', () => {
    fc.assert(
      fc.property(arbTimestampSeconds, ts => {
        expect(typeof calendarPipe.transform(ts, FIXED_CALENDAR)).toBe('string');
        expect(typeof conversationPipe.transform(ts)).toBe('string');
        expect(typeof messagePipe.transform(ts)).toBe('string');
      }),
      { numRuns: 100 }
    );
  });

  // ---------- Null/undefined produce empty string (boundary) ----------

  /**
   * **Validates: Requirements 12.4, 9.5**
   *
   * Null and undefined inputs produce empty strings (not errors).
   * This is a boundary condition — the non-empty property applies to valid timestamps.
   */
  it('CalendarDatePipe returns empty string for null and undefined', () => {
    expect(calendarPipe.transform(null)).toBe('');
    expect(calendarPipe.transform(undefined)).toBe('');
  });

  it('ConversationDatePipe returns empty string for null and undefined', () => {
    expect(conversationPipe.transform(null)).toBe('');
    expect(conversationPipe.transform(undefined)).toBe('');
  });

  it('MessageDatePipe returns empty string for null and undefined', () => {
    expect(messagePipe.transform(null)).toBe('');
    expect(messagePipe.transform(undefined)).toBe('');
  });
});
