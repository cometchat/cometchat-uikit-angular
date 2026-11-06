/**
 * cometchat-notification-feed.pipes Tests
 *
 * Covers: BadgeCountPipe, CardJsonPipe, CategoryUnreadCountPipe.
 *
 * @module components/cometchat-notification-feed/pipes
 */

import { describe, it, expect } from 'vitest';
import {
  BadgeCountPipe,
  CardJsonPipe,
  CategoryUnreadCountPipe,
} from './cometchat-notification-feed.pipes';
import type { NotificationFeedItem } from './cometchat-notification-feed.types';

/** A feed item whose getContent() returns the supplied value or throws. */
function item(content: unknown, shouldThrow = false): NotificationFeedItem {
  return {
    getContent: () => {
      if (shouldThrow) throw new Error('no content');
      return content;
    },
  } as unknown as NotificationFeedItem;
}

// ---------------------------------------------------------------------------
// BadgeCountPipe
// ---------------------------------------------------------------------------

describe('BadgeCountPipe', () => {
  const pipe = new BadgeCountPipe();

  it.each([
    [0, '0'],
    [1, '1'],
    [42, '42'],
    [99, '99'],
  ])('renders %i as "%s" below the cap', (count, expected) => {
    expect(pipe.transform(count)).toBe(expected);
  });

  it('caps at 99+ once the count passes the default max', () => {
    expect(pipe.transform(100)).toBe('99+');
  });

  it('shows the cap for a far larger count', () => {
    expect(pipe.transform(5000)).toBe('99+');
  });

  it('honours a custom max', () => {
    expect(pipe.transform(10, 9)).toBe('9+');
  });

  it('does not cap exactly at a custom max', () => {
    expect(pipe.transform(9, 9)).toBe('9');
  });

  it('handles a zero max', () => {
    expect(pipe.transform(1, 0)).toBe('0+');
  });

  it('renders a negative count as-is', () => {
    expect(pipe.transform(-3)).toBe('-3');
  });
});

// ---------------------------------------------------------------------------
// CardJsonPipe
// ---------------------------------------------------------------------------

describe('CardJsonPipe', () => {
  const pipe = new CardJsonPipe();

  it('passes a string through unchanged', () => {
    expect(pipe.transform(item('{"already":"json"}'))).toBe('{"already":"json"}');
  });

  it('passes an empty string through', () => {
    expect(pipe.transform(item(''))).toBe('');
  });

  it('serialises an object', () => {
    expect(pipe.transform(item({ title: 'Hi' }))).toBe('{"title":"Hi"}');
  });

  it('serialises an array', () => {
    expect(pipe.transform(item([1, 2]))).toBe('[1,2]');
  });

  it('serialises null as the literal null', () => {
    expect(pipe.transform(item(null))).toBe('null');
  });

  it('returns an empty string when getContent throws', () => {
    expect(pipe.transform(item(undefined, true))).toBe('');
  });

  it('returns an empty string when the item has no getContent', () => {
    expect(pipe.transform({} as unknown as NotificationFeedItem)).toBe('');
  });

  it('returns an empty string for content that cannot be serialised', () => {
    const circular: Record<string, unknown> = {};
    circular['self'] = circular;
    expect(pipe.transform(item(circular))).toBe('');
  });
});

// ---------------------------------------------------------------------------
// CategoryUnreadCountPipe
// ---------------------------------------------------------------------------

describe('CategoryUnreadCountPipe', () => {
  const pipe = new CategoryUnreadCountPipe();

  it('returns the count for a known category', () => {
    expect(pipe.transform('mentions', new Map([['mentions', 7]]))).toBe(7);
  });

  it('returns zero for an unknown category', () => {
    expect(pipe.transform('missing', new Map([['mentions', 7]]))).toBe(0);
  });

  it('returns zero for an empty map', () => {
    expect(pipe.transform('mentions', new Map())).toBe(0);
  });

  it('returns zero rather than a stored zero-ish value', () => {
    expect(pipe.transform('mentions', new Map([['mentions', 0]]))).toBe(0);
  });

  it('distinguishes between categories', () => {
    const counts = new Map([
      ['mentions', 3],
      ['replies', 8],
    ]);
    expect(pipe.transform('mentions', counts)).toBe(3);
    expect(pipe.transform('replies', counts)).toBe(8);
  });
});
