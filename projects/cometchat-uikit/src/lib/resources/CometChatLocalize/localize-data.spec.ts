/**
 * Localize data Tests
 *
 * Covers: LANGUAGE_CALENDAR_DEFAULTS shape and per-language values,
 * DEFAULT_TIMEZONES validity, key parity between the two tables, and that
 * every default pattern renders cleanly through formatDateFromPattern.
 *
 * @module resources/localize-data
 */

import { describe, it, expect } from 'vitest';
import { LANGUAGE_CALENDAR_DEFAULTS, DEFAULT_TIMEZONES } from './localize-data';
import { formatDateFromPattern } from './localize-helpers';

const LANGS = ['en-US', 'en-GB', 'de', 'fr', 'es', 'ja', 'ko', 'zh', 'zh-TW', 'ru', 'hi', 'ms', 'pt', 'sv', 'lt', 'hu', 'it', 'nl', 'tr'];

describe('LANGUAGE_CALENDAR_DEFAULTS', () => {
  it('covers exactly the supported languages', () => {
    expect(Object.keys(LANGUAGE_CALENDAR_DEFAULTS).sort()).toEqual([...LANGS].sort());
  });

  it('gives every language all four non-empty patterns', () => {
    for (const [lang, cal] of Object.entries(LANGUAGE_CALENDAR_DEFAULTS)) {
      expect(Object.keys(cal).sort(), lang).toEqual(['lastWeek', 'otherDays', 'today', 'yesterday']);
      for (const v of Object.values(cal)) expect(typeof v === 'string' && v.length > 0, lang).toBe(true);
    }
  });

  it('wraps every yesterday word in [brackets] so it is never parsed as tokens', () => {
    const bad = Object.entries(LANGUAGE_CALENDAR_DEFAULTS).filter(([, c]) => !/^\[[^\]]+\]$/.test(c.yesterday!));
    expect(bad).toEqual([]);
  });

  it('uses 12-hour time only for en-US and hi', () => {
    const twelveHour = Object.entries(LANGUAGE_CALENDAR_DEFAULTS)
      .filter(([, c]) => c.today === 'hh:mm A')
      .map(([l]) => l)
      .sort();
    expect(twelveHour).toEqual(['en-US', 'hi']);
    const others = Object.entries(LANGUAGE_CALENDAR_DEFAULTS).filter(([l]) => !twelveHour.includes(l));
    expect(others.every(([, c]) => c.today === 'HH:mm')).toBe(true);
  });

  it('uses the full weekday for lastWeek everywhere', () => {
    expect(Object.values(LANGUAGE_CALENDAR_DEFAULTS).every(c => c.lastWeek === 'dddd')).toBe(true);
  });

  it('has the expected regional date orders and yesterday words', () => {
    expect(LANGUAGE_CALENDAR_DEFAULTS['en-US']).toEqual({ today: 'hh:mm A', yesterday: '[Yesterday]', lastWeek: 'dddd', otherDays: 'MM/DD/YYYY' });
    expect(LANGUAGE_CALENDAR_DEFAULTS['en-GB'].otherDays).toBe('DD/MM/YYYY');
    expect(LANGUAGE_CALENDAR_DEFAULTS['de'].yesterday).toBe('[Gestern]');
    expect(LANGUAGE_CALENDAR_DEFAULTS['es'].yesterday).toBe('[Ayer]');
    expect(LANGUAGE_CALENDAR_DEFAULTS['ja'].otherDays).toBe('YYYY/MM/DD');
    expect(LANGUAGE_CALENDAR_DEFAULTS['sv'].otherDays).toBe('YYYY-MM-DD');
    expect(LANGUAGE_CALENDAR_DEFAULTS['hu'].otherDays).toBe('YYYY.MM.DD');
    expect(LANGUAGE_CALENDAR_DEFAULTS['nl'].otherDays).toBe('DD-MM-YYYY');
  });

  it('returns undefined for an unsupported language (callers must fall back)', () => {
    expect(LANGUAGE_CALENDAR_DEFAULTS['xx']).toBeUndefined();
  });
});

describe('DEFAULT_TIMEZONES', () => {
  it('has the same language keys as LANGUAGE_CALENDAR_DEFAULTS', () => {
    expect(Object.keys(DEFAULT_TIMEZONES).sort()).toEqual(Object.keys(LANGUAGE_CALENDAR_DEFAULTS).sort());
  });

  it('maps languages to the expected IANA zones', () => {
    expect(DEFAULT_TIMEZONES['en-US']).toBe('America/New_York');
    expect(DEFAULT_TIMEZONES['en-GB']).toBe('Europe/London');
    expect(DEFAULT_TIMEZONES['zh']).toBe('Asia/Shanghai');
    expect(DEFAULT_TIMEZONES['zh-TW']).toBe('Asia/Taipei');
    expect(DEFAULT_TIMEZONES['hi']).toBe('Asia/Kolkata');
    expect(DEFAULT_TIMEZONES['ja']).toBe('Asia/Tokyo');
  });

  it('contains only zones Intl accepts', () => {
    const invalid = Object.values(DEFAULT_TIMEZONES).filter(tz => {
      try {
        new Intl.DateTimeFormat('en-US', { timeZone: tz });
        return false;
      } catch {
        return true;
      }
    });
    expect(invalid).toEqual([]);
  });
});

describe('default patterns render through formatDateFromPattern', () => {
  /** Tue 5 March 2024, 14:07 UTC — safely mid-day in UTC. */
  const DATE = new Date('2024-03-05T14:07:00Z');
  const render = (lang: string, key: 'today' | 'yesterday' | 'otherDays') =>
    formatDateFromPattern(DATE, LANGUAGE_CALENDAR_DEFAULTS[lang][key]!, 'UTC', lang, k => k);

  it('renders otherDays in each region\'s order', () => {
    expect(render('en-US', 'otherDays')).toBe('03/05/2024');
    expect(render('en-GB', 'otherDays')).toBe('05/03/2024');
    expect(render('de', 'otherDays')).toBe('05.03.2024');
    expect(render('ja', 'otherDays')).toBe('2024/03/05');
    expect(render('sv', 'otherDays')).toBe('2024-03-05');
    expect(render('hu', 'otherDays')).toBe('2024.03.05');
    expect(render('nl', 'otherDays')).toBe('05-03-2024');
  });

  it('renders the today pattern as 24-hour or 12-hour time', () => {
    expect(render('de', 'today')).toBe('14:07');
    expect(render('en-US', 'today')).toBe('02:07 PM');
  });

  it('renders every yesterday pattern as just the bare word', () => {
    for (const lang of LANGS) {
      const expected = LANGUAGE_CALENDAR_DEFAULTS[lang].yesterday!.slice(1, -1);
      expect(render(lang, 'yesterday'), lang).toBe(expected);
    }
  });

  it('leaves no unreplaced date tokens in any otherDays/today output', () => {
    for (const lang of LANGS) {
      for (const key of ['otherDays', 'today'] as const) {
        expect(render(lang, key), `${lang}.${key}`).not.toMatch(/YYYY|MM|DD|HH|hh|mm/);
      }
    }
  });
});
