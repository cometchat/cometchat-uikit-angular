/**
 * cometchat-message-list.date-utils Tests
 *
 * Covers: getDefaultSeparatorDateFormat, getDefaultStickyDateFormat,
 *         getDefaultMessageDateFormat, getDateSeparatorKey, isSameDay.
 *
 * @module components/cometchat-message-list/date-utils
 */

import { describe, it, expect } from 'vitest';
import {
  getDefaultSeparatorDateFormat,
  getDefaultStickyDateFormat,
  getDefaultMessageDateFormat,
  getDateSeparatorKey,
  isSameDay,
} from './cometchat-message-list.date-utils';

describe('cometchat-message-list.date-utils', () => {

  // ==================== getDefaultSeparatorDateFormat ====================

  describe('getDefaultSeparatorDateFormat', () => {
    it('should return a CalendarObject with required fields', () => {
      const fmt = getDefaultSeparatorDateFormat();
      expect(fmt).toBeDefined();
      expect(typeof fmt.yesterday).toBe('string');
      expect(typeof fmt.today).toBe('string');
      expect(fmt.lastWeek).toBe('dddd');
      expect(fmt.otherDays).toBe('DD/MM/YYYY');
    });

    it('should return a new object on each call (not a singleton)', () => {
      const a = getDefaultSeparatorDateFormat();
      const b = getDefaultSeparatorDateFormat();
      expect(a).not.toBe(b);
    });

    it('should have non-empty today and yesterday strings', () => {
      const fmt = getDefaultSeparatorDateFormat();
      expect(fmt.today.length).toBeGreaterThan(0);
      expect(fmt.yesterday.length).toBeGreaterThan(0);
    });
  });

  // ==================== getDefaultStickyDateFormat ====================

  describe('getDefaultStickyDateFormat', () => {
    it('should return a CalendarObject with required fields', () => {
      const fmt = getDefaultStickyDateFormat();
      expect(fmt).toBeDefined();
      expect(typeof fmt.yesterday).toBe('string');
      expect(typeof fmt.today).toBe('string');
      expect(fmt.lastWeek).toBe('dddd');
      expect(fmt.otherDays).toBe('DD/MM/YYYY');
    });

    it('should match the separator format structure', () => {
      const sep = getDefaultSeparatorDateFormat();
      const sticky = getDefaultStickyDateFormat();
      expect(sticky.lastWeek).toBe(sep.lastWeek);
      expect(sticky.otherDays).toBe(sep.otherDays);
    });
  });

  // ==================== getDefaultMessageDateFormat ====================

  describe('getDefaultMessageDateFormat', () => {
    it('should return a CalendarObject with required fields', () => {
      const fmt = getDefaultMessageDateFormat();
      expect(fmt).toBeDefined();
      expect(typeof fmt.yesterday).toBe('string');
      expect(typeof fmt.today).toBe('string');
      expect(fmt.lastWeek).toBe('dddd');
      expect(fmt.otherDays).toBe('DD/MM/YYYY');
    });

    it('should return a new object on each call', () => {
      const a = getDefaultMessageDateFormat();
      const b = getDefaultMessageDateFormat();
      expect(a).not.toBe(b);
    });
  });

  // ==================== getDateSeparatorKey ====================

  describe('getDateSeparatorKey', () => {
    it('should return a YYYY-MM-DD formatted string', () => {
      // 2024-01-15 00:00:00 UTC
      const ts = 1705276800; // 2024-01-15
      const key = getDateSeparatorKey(ts);
      expect(key).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should return the same key for two timestamps on the same day', () => {
      // Two timestamps on the same day (different hours)
      const date = new Date('2024-06-15T00:00:00');
      const ts1 = Math.floor(date.getTime() / 1000);
      const ts2 = ts1 + 3600; // +1 hour
      expect(getDateSeparatorKey(ts1)).toBe(getDateSeparatorKey(ts2));
    });

    it('should return different keys for timestamps on different days', () => {
      const date1 = new Date('2024-06-15T12:00:00');
      const date2 = new Date('2024-06-16T12:00:00');
      const ts1 = Math.floor(date1.getTime() / 1000);
      const ts2 = Math.floor(date2.getTime() / 1000);
      expect(getDateSeparatorKey(ts1)).not.toBe(getDateSeparatorKey(ts2));
    });

    it('should zero-pad month and day', () => {
      // January 5th — month=01, day=05
      const date = new Date('2024-01-05T12:00:00');
      const ts = Math.floor(date.getTime() / 1000);
      const key = getDateSeparatorKey(ts);
      const parts = key.split('-');
      expect(parts[1].length).toBe(2);
      expect(parts[2].length).toBe(2);
    });

    it('should include the correct year', () => {
      const date = new Date('2025-03-20T10:00:00');
      const ts = Math.floor(date.getTime() / 1000);
      const key = getDateSeparatorKey(ts);
      expect(key.startsWith('2025')).toBe(true);
    });
  });

  // ==================== isSameDay ====================

  describe('isSameDay', () => {
    it('should return true for two timestamps on the same day', () => {
      const date = new Date('2024-06-15T08:00:00');
      const ts1 = Math.floor(date.getTime() / 1000);
      const ts2 = ts1 + 7200; // +2 hours
      expect(isSameDay(ts1, ts2)).toBe(true);
    });

    it('should return false for timestamps on different days', () => {
      const date1 = new Date('2024-06-15T23:00:00');
      const date2 = new Date('2024-06-16T01:00:00');
      const ts1 = Math.floor(date1.getTime() / 1000);
      const ts2 = Math.floor(date2.getTime() / 1000);
      expect(isSameDay(ts1, ts2)).toBe(false);
    });

    it('should return true when both timestamps are identical', () => {
      const ts = Math.floor(Date.now() / 1000);
      expect(isSameDay(ts, ts)).toBe(true);
    });

    it('should return false for timestamps a year apart', () => {
      const date1 = new Date('2023-06-15T12:00:00');
      const date2 = new Date('2024-06-15T12:00:00');
      const ts1 = Math.floor(date1.getTime() / 1000);
      const ts2 = Math.floor(date2.getTime() / 1000);
      expect(isSameDay(ts1, ts2)).toBe(false);
    });

    it('should return false for timestamps exactly 24 hours apart crossing midnight', () => {
      const date1 = new Date('2024-06-15T00:00:00');
      const date2 = new Date('2024-06-16T00:00:00');
      const ts1 = Math.floor(date1.getTime() / 1000);
      const ts2 = Math.floor(date2.getTime() / 1000);
      expect(isSameDay(ts1, ts2)).toBe(false);
    });

    it('should handle timestamps at start and end of same day', () => {
      const start = new Date('2024-06-15T00:00:00');
      const end = new Date('2024-06-15T23:59:59');
      const ts1 = Math.floor(start.getTime() / 1000);
      const ts2 = Math.floor(end.getTime() / 1000);
      expect(isSameDay(ts1, ts2)).toBe(true);
    });
  });
});
