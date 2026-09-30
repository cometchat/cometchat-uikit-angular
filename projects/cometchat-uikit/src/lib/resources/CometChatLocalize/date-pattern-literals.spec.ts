/**
 * Text inside [brackets] is literal and must not change how the date renders.
 *
 * `formatDateFromPattern` used to strip the brackets first and then scan the
 * whole string to pick tokens and decide the clock. Spanish shipped a wrong
 * clock because of it: `yesterday` is "Ayer", the Message Information panel
 * builds `[Ayer] HH:mm`, and the capital A satisfied `includes('A')` — so the
 * formatter switched to 12-hour and 19:35 rendered as 07:35.
 *
 * Nothing caught it. The suite was green before the fix, because no test put a
 * bracketed word next to a time token. These tests exist so that cannot recur.
 *
 * Assertions compare a bracketed pattern against the same pattern without the
 * literal, rather than hard-coding digits — the formatter resolves timezone
 * from the environment, so fixed digits would only hold on one machine.
 *
 * @module resources/CometChatLocalize/date-pattern-literals
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { CometChatLocalize } from './cometchat-localize';
import { LANGUAGE_CALENDAR_DEFAULTS } from './localize-data';

/** An afternoon timestamp — the 12/24-hour split is invisible before 13:00. */
function yesterdayAt(hour: number, minute: number): number {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  date.setHours(hour, minute, 0, 0);
  return Math.floor(date.getTime() / 1000);
}

function render(timestamp: number, pattern: string): string {
  return CometChatLocalize.formatDate(timestamp, {
    today: pattern,
    yesterday: pattern,
    lastWeek: pattern,
    otherDays: pattern,
  });
}

describe('date patterns: bracketed literals', () => {
  beforeEach(() => {
    CometChatLocalize.init({ language: 'en-US', fallbackLanguage: 'en-US' });
  });

  it('a literal containing "A" does not switch the clock to 12-hour', () => {
    const timestamp = yesterdayAt(19, 35);
    const withLiteral = render(timestamp, '[Ayer] HH:mm');
    const bare = render(timestamp, 'HH:mm');

    // The regression: "Ayer 07:35" instead of "Ayer 19:35".
    expect(withLiteral).toBe(`Ayer ${bare}`);
  });

  it('keeps a 24-hour clock for every locale\'s own "yesterday" word', () => {
    const timestamp = yesterdayAt(19, 35);
    const wrong: string[] = [];

    for (const [language, defaults] of Object.entries(LANGUAGE_CALENDAR_DEFAULTS)) {
      if (defaults.today !== 'HH:mm') continue; // en-US and hi use a 12-hour clock by design
      CometChatLocalize.init({ language, fallbackLanguage: language });
      const word = CometChatLocalize.getLocalizedString('yesterday');
      const withLiteral = render(timestamp, `[${word}] HH:mm`);
      const bare = render(timestamp, 'HH:mm');
      if (withLiteral !== `${word} ${bare}`) {
        wrong.push(`${language}: "[${word}] HH:mm" -> "${withLiteral}", bare "HH:mm" -> "${bare}"`);
      }
    }

    expect(wrong, wrong.join('\n')).toEqual([]);
  });

  it('passes a literal through untouched even when it is made of date tokens', () => {
    // Worst case: every token the formatter knows, as literal text.
    const rendered = render(yesterdayAt(19, 35), '[D M h m H A dddd YYYY] HH:mm');
    expect(rendered.startsWith('D M h m H A dddd YYYY ')).toBe(true);
  });

  it('still honours AM/PM when the pattern itself asks for it', () => {
    const rendered = render(yesterdayAt(19, 35), 'hh:mm A');
    expect(rendered).toMatch(/\b(PM|p\.?\s?m\.?)\b/i);
  });

  it('leaves patterns without literals unchanged', () => {
    const timestamp = yesterdayAt(19, 35);
    expect(render(timestamp, 'DD/MM/YYYY HH:mm')).toMatch(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/);
  });

  it('restores multiple literals in the right order', () => {
    const timestamp = yesterdayAt(19, 35);
    const bare = render(timestamp, 'HH:mm');
    expect(render(timestamp, '[Ayer] [a las] HH:mm')).toBe(`Ayer a las ${bare}`);
  });
});

describe('date patterns: region-tagged locales', () => {
  /**
   * The browser reports a region-tagged code and the kit adopts it verbatim, but
   * LANGUAGE_CALENDAR_DEFAULTS is keyed by base language. A direct lookup misses,
   * and both pattern getters used to fall through to the hard-coded en-US values —
   * so a German reader saw MM/DD/YYYY and 04/05 meant a different day.
   */
  const cases: Array<[string, string, string]> = [
    // tag,     expected time, expected date
    ['de-DE', 'HH:mm', 'DD.MM.YYYY'],
    ['fr-FR', 'HH:mm', 'DD/MM/YYYY'],
    ['es-ES', 'HH:mm', 'DD/MM/YYYY'],
    ['es-MX', 'HH:mm', 'DD/MM/YYYY'],
    ['pt-BR', 'HH:mm', 'DD/MM/YYYY'],
    ['ja-JP', 'HH:mm', 'YYYY/MM/DD'],
    ['it-IT', 'HH:mm', 'DD/MM/YYYY'],
    ['nl-NL', 'HH:mm', 'DD-MM-YYYY'],
  ];

  it.each(cases)('%s resolves to its base language, not en-US', (tag, time, date) => {
    CometChatLocalize.init({ language: tag, fallbackLanguage: 'en-US' });
    expect(CometChatLocalize.getTimePattern()).toBe(time);
    expect(CometChatLocalize.getDatePattern()).toBe(date);
  });

  it('uses the platform for a region with no base-language entry', () => {
    // There is no plain `en` entry, so en-AU would otherwise inherit en-US and
    // show MM/DD/YYYY to a reader who writes day first.
    CometChatLocalize.init({ language: 'en-AU', fallbackLanguage: 'en-US' });
    expect(CometChatLocalize.getDatePattern()).toBe('DD/MM/YYYY');
  });

  it('falls back to en-US only when the locale is unknown to the platform too', () => {
    CometChatLocalize.init({ language: 'xx-YY', fallbackLanguage: 'en-US' });
    expect(CometChatLocalize.getTimePattern()).toBe('hh:mm A');
    expect(CometChatLocalize.getDatePattern()).toBe('MM/DD/YYYY');
  });

  it('leaves exact matches in the table untouched', () => {
    for (const [tag, time, date] of [
      ['en-US', 'hh:mm A', 'MM/DD/YYYY'],
      ['en-GB', 'HH:mm', 'DD/MM/YYYY'],
      ['sv', 'HH:mm', 'YYYY-MM-DD'],
      ['hu', 'HH:mm', 'YYYY.MM.DD'],
    ]) {
      CometChatLocalize.init({ language: tag, fallbackLanguage: tag });
      expect(`${tag}:${CometChatLocalize.getTimePattern()}:${CometChatLocalize.getDatePattern()}`).toBe(
        `${tag}:${time}:${date}`
      );
    }
  });
});
