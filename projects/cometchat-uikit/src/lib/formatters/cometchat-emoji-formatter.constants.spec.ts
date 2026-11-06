/**
 * Emoji formatter constants Tests
 *
 * Covers: EMOJI_MAP contents, aliases and key hygiene; EMOJI_SHORTCODE_REGEX
 * matching rules; and that every map key is reachable through the regex.
 *
 * @module formatters/emoji-constants
 */

import { describe, it, expect } from 'vitest';
import { EMOJI_MAP, EMOJI_SHORTCODE_REGEX } from './cometchat-emoji-formatter.constants';

const fresh = () => new RegExp(EMOJI_SHORTCODE_REGEX.source, EMOJI_SHORTCODE_REGEX.flags);
const shortcodes = (text: string) => [...text.matchAll(fresh())].map(m => m[1]);

describe('EMOJI_MAP', () => {
  it('maps common shortcodes to the expected emoji', () => {
    expect(EMOJI_MAP['joy']).toBe('😂');
    expect(EMOJI_MAP['fire']).toBe('🔥');
    expect(EMOJI_MAP['thumbsup']).toBe('👍');
    expect(EMOJI_MAP['heart']).toBe('❤️');
    expect(EMOJI_MAP['tada']).toBe('🎉');
    expect(EMOJI_MAP['rocket']).toBeUndefined();
  });

  it('maps aliases to the same emoji', () => {
    expect(EMOJI_MAP['+1']).toBe(EMOJI_MAP['thumbsup']);
    expect(EMOJI_MAP['-1']).toBe(EMOJI_MAP['thumbsdown']);
    expect(EMOJI_MAP['boom']).toBe(EMOJI_MAP['collision']);
    expect(EMOJI_MAP['zap']).toBe(EMOJI_MAP['lightning']);
    expect(EMOJI_MAP['check']).toBe(EMOJI_MAP['white_check_mark']);
    expect(EMOJI_MAP['x']).toBe(EMOJI_MAP['cross_mark']);
  });

  it('keeps the numeric key "1234"', () => {
    expect(EMOJI_MAP['1234']).toBe('🔢');
  });

  it('is case-sensitive (no upper-case keys)', () => {
    expect(EMOJI_MAP['Smile']).toBeUndefined();
    expect(Object.keys(EMOJI_MAP).filter(k => k !== k.toLowerCase())).toEqual([]);
  });

  it('has several hundred entries', () => {
    expect(Object.keys(EMOJI_MAP).length).toBeGreaterThan(500);
  });

  it('has only non-empty values that contain no ASCII letters', () => {
    const bad = Object.entries(EMOJI_MAP).filter(([, v]) => typeof v !== 'string' || v.length === 0 || /[A-Za-z]/.test(v));
    expect(bad).toEqual([]);
  });

  it('does not inherit prototype keys as emoji', () => {
    expect(Object.prototype.hasOwnProperty.call(EMOJI_MAP, 'toString')).toBe(false);
  });
});

describe('EMOJI_SHORTCODE_REGEX', () => {
  it('is a global regex', () => {
    expect(EMOJI_SHORTCODE_REGEX.flags).toBe('g');
  });

  it('captures the name between colons', () => {
    expect(shortcodes('hello :smile:')).toEqual(['smile']);
  });

  it('captures several shortcodes in order', () => {
    expect(shortcodes(':fire::fire: and :tada:')).toEqual(['fire', 'fire', 'tada']);
  });

  it('accepts digits, underscore, plus and minus', () => {
    expect(shortcodes(':+1: :-1: :star2: :heart_eyes:')).toEqual(['+1', '-1', 'star2', 'heart_eyes']);
  });

  it('rejects spaces, empty names and unclosed codes', () => {
    expect(shortcodes(':not valid: :: :smile')).toEqual([]);
  });

  it('matches unknown names too (lookup happens in the map)', () => {
    expect(shortcodes(':notanemoji:')).toEqual(['notanemoji']);
  });

  it('does not match a clock time like 10:30', () => {
    expect(shortcodes('meet at 10:30')).toEqual([]);
  });

  it('can reach every key in EMOJI_MAP', () => {
    const unreachable = Object.keys(EMOJI_MAP).filter(k => {
      const m = fresh().exec(`:${k}:`);
      return !m || m[1] !== k;
    });
    expect(unreachable).toEqual([]);
  });
});
