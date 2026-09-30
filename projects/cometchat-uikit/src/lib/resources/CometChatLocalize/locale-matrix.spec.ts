/**
 * Every supported locale, and every region-tagged variant a real browser
 * reports, rendered end to end.
 *
 * Three review rounds each found a locale-specific defect that the per-feature
 * tests missed, because each was written for the case being fixed. This runs
 * the whole matrix — the 19 bundled locales plus 39 region tags — through the
 * real `CometChatLocalize` and asserts the output is actually usable.
 *
 * Defects this would have caught, in the order they were found by hand:
 *   - `de-DE` resolved to en-US date order (04/05 read as the wrong day)
 *   - `en-AU` lost "Yesterday" entirely and rendered an empty string
 *   - `de-DE` rendered every weekday, and every other string, in English
 *
 * @module resources/CometChatLocalize/locale-matrix
 */
import { describe, it, expect } from 'vitest';
import { CometChatLocalize } from './cometchat-localize';
import { LANGUAGE_CALENDAR_DEFAULTS } from './localize-data';

/** Region tags real browsers report for the languages the kit bundles. */
const REGION_TAGS = [
  'en-AU', 'en-IN', 'en-CA', 'en-NZ', 'en-IE', 'en-ZA',
  'de-DE', 'de-AT', 'de-CH', 'fr-FR', 'fr-CA', 'fr-BE',
  'es-ES', 'es-MX', 'es-AR', 'pt-BR', 'pt-PT', 'it-IT',
  'nl-NL', 'nl-BE', 'sv-SE', 'ru-RU', 'ja-JP', 'ko-KR',
  'zh-CN', 'zh-TW', 'zh-HK', 'hi-IN', 'tr-TR', 'hu-HU',
  'lt-LT', 'ms-MY',
];

/** Locales with no bundle at all — these legitimately fall back to English. */
const UNBUNDLED = ['bg-BG', 'th-TH', 'vi-VN', 'pl-PL', 'cs-CZ', 'xx-YY'];

const BUNDLED = Object.keys(LANGUAGE_CALENDAR_DEFAULTS);

/** A raw pattern token that leaked into output, delimited by ASCII punctuation. */
const RAW_TOKEN = /(^|[\s/.,:-])(DD|MMMM|MMM|MM|YYYY|YY|hh|HH|mm|dddd|ddd)($|[\s/.,:-])/;
const UNRESOLVED_PLACEHOLDER = /\{\{?\w+\}?\}/;

function timestampDaysAgo(days: number): number {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(14, 5, 0, 0);
  return Math.floor(date.getTime() / 1000);
}

function renderAll(locale: string): Record<string, string> {
  CometChatLocalize.init({ language: locale, fallbackLanguage: 'en-US' });
  const calendar = CometChatLocalize.getCalendarObject();
  return {
    today: CometChatLocalize.formatDate(timestampDaysAgo(0), calendar),
    yesterday: CometChatLocalize.formatDate(timestampDaysAgo(1), calendar),
    lastWeek: CometChatLocalize.formatDate(timestampDaysAgo(3), calendar),
    older: CometChatLocalize.formatDate(timestampDaysAgo(400), calendar),
  };
}

describe('locale matrix', () => {
  const everyLocale = [...BUNDLED, ...REGION_TAGS, ...UNBUNDLED];

  it('renders a usable date in every locale and region variant', () => {
    const problems: string[] = [];
    for (const locale of everyLocale) {
      const rendered = renderAll(locale);
      for (const [branch, value] of Object.entries(rendered)) {
        if (!value.trim()) problems.push(`${locale}/${branch}: empty`);
        if (RAW_TOKEN.test(value)) problems.push(`${locale}/${branch}: raw token in "${value}"`);
        if (UNRESOLVED_PLACEHOLDER.test(value)) problems.push(`${locale}/${branch}: placeholder in "${value}"`);
      }
    }
    expect(problems, problems.join('\n')).toEqual([]);
  });

  it('always supplies a yesterday label, however the calendar was resolved', () => {
    // The Intl-derived branch omitted `yesterday`, and because the object still
    // had keys its consumers stopped reaching their own defaults.
    const missing = everyLocale.filter(locale => {
      CometChatLocalize.init({ language: locale, fallbackLanguage: 'en-US' });
      return !CometChatLocalize.getCalendarObject().yesterday;
    });
    expect(missing, `no yesterday for: ${missing.join(', ')}`).toEqual([]);
  });

  it('resolves a region tag to its base language for text, not to English', () => {
    const wrong: string[] = [];
    for (const tag of REGION_TAGS) {
      const base = tag.split('-')[0];
      // zh-TW has its own bundle and must keep winning over zh; Hong Kong and
      // Macau write Traditional, so they take that bundle too.
      const traditional = /^zh\b.*\b(Hant|HK|MO|TW)\b/i.test(tag);
      const expected = BUNDLED.includes(tag)
        ? tag
        : traditional
          ? 'zh-TW'
          : BUNDLED.includes(base)
            ? base
            : 'en-US';
      CometChatLocalize.init({ language: tag, fallbackLanguage: 'en-US' });
      const actual = CometChatLocalize.getCurrentLanguage();
      if (actual !== expected) wrong.push(`${tag}: resolved to ${actual}, expected ${expected}`);
    }
    expect(wrong, wrong.join('\n')).toEqual([]);
  });

  it('translates strings for a region tag', () => {
    // The kit reads navigator.language verbatim, which is region-tagged on most
    // real browsers, so this is the common path rather than an edge case.
    const english = (() => {
      CometChatLocalize.init({ language: 'en-US', fallbackLanguage: 'en-US' });
      return CometChatLocalize.getLocalizedString('message_list_option_delete');
    })();

    const untranslated: string[] = [];
    for (const tag of ['de-DE', 'fr-FR', 'es-ES', 'ja-JP', 'pt-BR', 'ru-RU', 'zh-CN', 'tr-TR']) {
      CometChatLocalize.init({ language: tag, fallbackLanguage: 'en-US' });
      const value = CometChatLocalize.getLocalizedString('message_list_option_delete');
      if (!value || value === english) untranslated.push(`${tag}: "${value}"`);
    }
    expect(untranslated, untranslated.join('\n')).toEqual([]);
  });

  it('gives a region tag the date and time patterns of its base language', () => {
    // Checking that output is merely non-empty is not enough: MM/DD/YYYY for a
    // German reader is well-formed and still wrong. Assert the actual patterns.
    const wrong: string[] = [];
    for (const tag of REGION_TAGS) {
      const base = tag.split('-')[0];
      const table = LANGUAGE_CALENDAR_DEFAULTS[tag] ?? LANGUAGE_CALENDAR_DEFAULTS[base];
      if (!table) continue; // no bundled base language; the platform decides
      CometChatLocalize.init({ language: tag, fallbackLanguage: 'en-US' });
      const time = CometChatLocalize.getTimePattern();
      const date = CometChatLocalize.getDatePattern();
      if (time !== table.today || date !== table.otherDays) {
        wrong.push(`${tag}: got ${time} / ${date}, expected ${table.today} / ${table.otherDays}`);
      }
    }
    expect(wrong, wrong.join('\n')).toEqual([]);
  });

  it('renders the month-name date without doubling or dropping a unit', () => {
    // The previous assertions only checked for empty output and raw tokens, so
    // "2026年11月月22日" passed: it is non-empty and token-free, and simply wrong.
    // ja/zh/zh-TW/lt have no short month *name* — Intl returns a numeric month
    // with the unit as a literal, and filling MMM from month_*_short (already
    // "11月") doubled the character.
    const timestamp = Math.floor(Date.UTC(2026, 10, 22, 12, 0, 0) / 1000);
    const expected: Record<string, string> = {
      'en-US': 'Nov 22, 2026',
      'en-GB': '22 Nov 2026',
      ja: '2026/11/22',
      zh: '2026/11/22',
      'zh-TW': '2026/11/22',
      ko: '2026년 11월 22일',
      lt: '2026-11-22',
    };
    const wrong: string[] = [];
    for (const [locale, want] of Object.entries(expected)) {
      CometChatLocalize.init({ language: locale, fallbackLanguage: 'en-US' });
      const pattern = CometChatLocalize.getDatePattern('monthName');
      const got = CometChatLocalize.formatDate(timestamp, {
        today: pattern, yesterday: pattern, lastWeek: pattern, otherDays: pattern,
      });
      if (got !== want) wrong.push(`${locale}: got "${got}", expected "${want}"`);
    }
    expect(wrong, wrong.join('\n')).toEqual([]);
  });

  it('never repeats a date unit character in any locale', () => {
    // Generic backstop for the same class: 月月, 年年, 日日 and their kin.
    const timestamp = Math.floor(Date.UTC(2026, 10, 22, 12, 0, 0) / 1000);
    const doubled: string[] = [];
    for (const locale of [...BUNDLED, ...REGION_TAGS]) {
      CometChatLocalize.init({ language: locale, fallbackLanguage: 'en-US' });
      for (const style of ['numeric', 'monthName'] as const) {
        const pattern = CometChatLocalize.getDatePattern(style);
        const rendered = CometChatLocalize.formatDate(timestamp, {
          today: pattern, yesterday: pattern, lastWeek: pattern, otherDays: pattern,
        });
        if (/([\u4e00-\u9fff\uac00-\ud7af])\1/.test(rendered)) {
          doubled.push(`${locale}/${style}: "${rendered}"`);
        }
      }
    }
    expect(doubled, doubled.join('\n')).toEqual([]);
  });

  it('picks the Chinese bundle by script subtag first, then region', () => {
    // zh-Hans-HK asks for Simplified even though Hong Kong ordinarily writes
    // Traditional, so an explicit script has to beat the region.
    for (const tag of ['zh-HK', 'zh-MO', 'zh-Hant-HK', 'zh-Hant', 'zh-TW']) {
      CometChatLocalize.init({ language: tag, fallbackLanguage: 'en-US' });
      expect(CometChatLocalize.getCurrentLanguage(), `${tag} should use Traditional`).toBe('zh-TW');
    }
    for (const tag of ['zh-CN', 'zh-SG', 'zh', 'zh-Hans', 'zh-Hans-HK']) {
      CometChatLocalize.init({ language: tag, fallbackLanguage: 'en-US' });
      expect(CometChatLocalize.getCurrentLanguage(), `${tag} should use Simplified`).toBe('zh');
    }
  });

  it('keeps the yesterday label in the UI language when date localization is off', () => {
    // disableDateTimeLocalization pins the *date* locale to en-US by design,
    // but "yesterday" is UI text: a German UI showed "Yesterday" next to
    // "Sonntag" because the label came from the en-US calendar table.
    const wrong: string[] = [];
    for (const language of ['de', 'fr', 'ja', 'ru', 'tr']) {
      CometChatLocalize.init({ language, fallbackLanguage: language, disableDateTimeLocalization: true });
      const label = CometChatLocalize.getCalendarObject().yesterday;
      const expected = `[${CometChatLocalize.getLocalizedString('yesterday')}]`;
      if (label !== expected) wrong.push(`${language}: got ${label}, expected ${expected}`);
    }
    // Restore, so the flag does not leak into later tests.
    CometChatLocalize.init({ language: 'en-US', fallbackLanguage: 'en-US' });
    expect(wrong, wrong.join('\n')).toEqual([]);
  });

  it('reports no custom calendar object unless one was set', () => {
    // Components guard their own format with this. If it ever returned true by
    // default, every component default would be silently overwritten — which
    // is how the fullscreen viewer lost its "date at time" header.
    CometChatLocalize.init({ language: 'de-DE', fallbackLanguage: 'en-US' });
    expect(CometChatLocalize.hasCustomCalendarObject()).toBe(false);
    CometChatLocalize.setGlobalCalendarObject({ today: 'YYYY' });
    expect(CometChatLocalize.hasCustomCalendarObject()).toBe(true);
    CometChatLocalize.init({ language: 'en-US', fallbackLanguage: 'en-US' });
  });

  it('keeps an exact bundle match ahead of the base language', () => {
    CometChatLocalize.init({ language: 'zh-TW', fallbackLanguage: 'en-US' });
    expect(CometChatLocalize.getCurrentLanguage()).toBe('zh-TW');
    CometChatLocalize.init({ language: 'en-GB', fallbackLanguage: 'en-US' });
    expect(CometChatLocalize.getCurrentLanguage()).toBe('en-GB');
  });
});
