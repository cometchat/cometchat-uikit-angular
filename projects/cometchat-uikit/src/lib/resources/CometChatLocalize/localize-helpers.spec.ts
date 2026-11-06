/**
 * Localize helpers Tests
 *
 * Covers: formatDateFromPattern tokens, literals, 12/24-hour handling and
 * timezones; isYesterday; formatDate's relative/today/yesterday/lastWeek/
 * otherDays branches; formatDurationLong/Short incl. plurals, locales and
 * invalid input; cachedByLanguage memoisation.
 *
 * @module resources/localize-helpers
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  formatDateFromPattern,
  isYesterday,
  formatDate,
  formatDurationLong,
  formatDurationShort,
  cachedByLanguage,
} from './localize-helpers';

const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

const STRINGS: Record<string, string> = {};
MONTHS.forEach(m => {
  STRINGS[`month_${m}_full`] = cap(m);
  STRINGS[`month_${m}_short`] = cap(m).slice(0, 3);
});
DAYS.forEach(d => {
  STRINGS[`weekday_${d}_full`] = cap(d);
  STRINGS[`weekday_${d}_short`] = cap(d).slice(0, 3);
  STRINGS[`weekday_${d}_min`] = cap(d).slice(0, 2);
});
const t = (key: string) => STRINGS[key] ?? key;

/** Tuesday 5 March 2024, 19:35:00 UTC. */
const EVENING = new Date('2024-03-05T19:35:00Z');
const fmt = (pattern: string, date = EVENING, tz = 'UTC', locale = 'en-US', resolver = t) =>
  formatDateFromPattern(date, pattern, tz, locale, resolver);

describe('formatDateFromPattern', () => {
  it('formats day/month/year tokens', () => {
    expect(fmt('DD/MM/YYYY')).toBe('05/03/2024');
    expect(fmt('MM/DD/YYYY')).toBe('03/05/2024');
    expect(fmt('DD-MM-YY')).toBe('05-03-24');
    expect(fmt('D.M.YYYY')).toBe('5.3.2024');
  });

  it('formats 24-hour time', () => {
    expect(fmt('HH:mm')).toBe('19:35');
    expect(fmt('H:mm')).toBe('19:35');
  });

  it('formats 12-hour time with AM/PM', () => {
    expect(fmt('hh:mm A')).toBe('07:35 PM');
    expect(fmt('h:mm A')).toBe('7:35 PM');
    expect(fmt('A hh:mm')).toBe('PM 07:35');
  });

  it('renders midnight as 00 in 24-hour mode and 12 AM in 12-hour mode', () => {
    const midnight = new Date('2024-03-05T00:05:00Z');
    expect(fmt('HH:mm', midnight)).toBe('00:05');
    expect(fmt('hh:mm A', midnight)).toBe('12:05 AM');
  });

  it('uses localized month names for MMM / MMMM', () => {
    expect(fmt('DD MMMM YYYY')).toBe('05 March 2024');
    expect(fmt('MMM D')).toBe('Mar 5');
  });

  it('falls back to the numeric month when no localized name exists', () => {
    expect(fmt('MMM D', EVENING, 'UTC', 'en-US', () => '')).toBe('03 5');
  });

  it('uses localized weekday names for dddd / ddd / dd', () => {
    // Mid-day UTC so the weekday is Tuesday for any host between UTC-11 and UTC+11.
    const noon = new Date('2024-03-05T12:00:00Z');
    expect(fmt('dddd', noon)).toBe('Tuesday');
    expect(fmt('ddd, DD', noon)).toBe('Tue, 05');
    expect(fmt('dd', noon)).toBe('Tu');
  });

  it('keeps [bracketed] text literal and does not let it switch the clock', () => {
    // "Ayer" contains an A; it must not turn the 24-hour pattern into 12-hour.
    expect(fmt('[Ayer] HH:mm')).toBe('Ayer 19:35');
    expect(fmt('[Yesterday]')).toBe('Yesterday');
    expect(fmt('[at] h:mm A')).toBe('at 7:35 PM');
    expect(fmt('[DD MM] DD')).toBe('DD MM 05');
  });

  it('applies the target timezone to date and time', () => {
    // 19:35 UTC is 04:35 next day in Tokyo and 14:35 same day in New York.
    expect(fmt('DD/MM HH:mm', EVENING, 'Asia/Tokyo')).toBe('06/03 04:35');
    expect(fmt('DD/MM HH:mm', EVENING, 'America/New_York')).toBe('05/03 14:35');
  });

  it('throws a RangeError for an invalid timezone', () => {
    expect(() => fmt('HH:mm', EVENING, 'Not/AZone')).toThrow(RangeError);
  });

  describe('weekday follows the target timezone, not the host', () => {
    // 12:00 UTC on Tue 5 March is already Wed 6 March in Kiritimati (UTC+14) and
    // still Tue 5 March in Pago Pago (UTC-11). Whatever the host timezone, the
    // weekday printed must agree with the date printed beside it.
    const NOON = new Date('2024-03-05T12:00:00Z');

    it('Pacific/Kiritimati → Wednesday 06', () => {
      expect(fmt('dddd DD', NOON, 'Pacific/Kiritimati')).toBe('Wednesday 06');
    });

    it('Pacific/Pago_Pago → Tuesday 05', () => {
      expect(fmt('dddd DD', NOON, 'Pacific/Pago_Pago')).toBe('Tuesday 05');
    });
  });
});

describe('time-dependent helpers', () => {
  /** "Now" for these tests: Wed 6 March 2024, 12:00:00 UTC. */
  const NOW = new Date('2024-03-06T12:00:00Z');
  const sec = (iso: string) => Math.floor(new Date(iso).getTime() / 1000);
  const ago = (seconds: number) => Math.floor(NOW.getTime() / 1000) - seconds;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('isYesterday', () => {
    it('is true for a time on the previous calendar day', () => {
      expect(isYesterday(sec('2024-03-05T08:00:00Z'), 'UTC')).toBe(true);
      expect(isYesterday(sec('2024-03-05T23:59:59Z'), 'UTC')).toBe(true);
    });

    it('is false for today and for two days ago', () => {
      expect(isYesterday(sec('2024-03-06T00:00:01Z'), 'UTC')).toBe(false);
      expect(isYesterday(sec('2024-03-04T12:00:00Z'), 'UTC')).toBe(false);
    });

    it('evaluates the calendar day in the given timezone', () => {
      // 16:00 UTC on 5 March is 01:00 on 6 March in Tokyo — today there, not yesterday.
      expect(isYesterday(sec('2024-03-05T16:00:00Z'), 'Asia/Tokyo')).toBe(false);
      expect(isYesterday(sec('2024-03-05T16:00:00Z'), 'UTC')).toBe(true);
    });
  });

  describe('formatDate', () => {
    const base = { today: 'HH:mm', yesterday: '[Yesterday]', lastWeek: 'dddd', otherDays: 'DD/MM/YYYY' };
    const fd = (ts: number, cal: object = base, tz = 'UTC') => formatDate(ts, cal as never, tz, 'en-US', t);

    it('uses the today pattern for a time earlier today', () => {
      expect(fd(sec('2024-03-06T08:15:00Z'))).toBe('08:15');
    });

    it('uses the yesterday pattern for the previous day', () => {
      expect(fd(sec('2024-03-05T08:15:00Z'))).toBe('Yesterday');
    });

    it('uses the lastWeek pattern within 7 days', () => {
      expect(fd(sec('2024-03-02T10:00:00Z'))).toBe('Saturday');
    });

    it('uses the otherDays pattern beyond a week', () => {
      expect(fd(sec('2024-01-15T10:00:00Z'))).toBe('15/01/2024');
    });

    it('defaults otherDays to DD/MM/YYYY when absent', () => {
      expect(fd(sec('2024-01-15T10:00:00Z'), { today: 'HH:mm' })).toBe('15/01/2024');
    });

    it('accepts a millisecond timestamp as well as seconds', () => {
      const ms = new Date('2024-01-15T10:00:00Z').getTime();
      expect(fd(ms)).toBe('15/01/2024');
    });

    it('decides "today" in the given timezone', () => {
      // 20:00 UTC on 5 March is 05:00 on 6 March in Tokyo, where "now" is 21:00 on 6 March.
      expect(fd(sec('2024-03-05T20:00:00Z'), base, 'Asia/Tokyo')).toBe('05:00');
      expect(fd(sec('2024-03-05T20:00:00Z'), base, 'UTC')).toBe('Yesterday');
    });

    describe('relativeTime', () => {
      const rel = {
        ...base,
        relativeTime: { minute: 'Just now', minutes: '%d minutes ago', hour: '%d hour ago', hours: '%d hours ago' },
      };

      it('uses the minute string under 60 seconds', () => {
        expect(fd(ago(30), rel)).toBe('Just now');
      });

      it('substitutes %d with 1 in the minute string', () => {
        expect(fd(ago(30), { ...rel, relativeTime: { ...rel.relativeTime, minute: '%d min ago' } })).toBe('1 min ago');
      });

      it('falls back to the today pattern under 60s when minute is missing', () => {
        expect(fd(ago(30), { ...base, relativeTime: { minutes: '%d minutes ago' } })).toBe('11:59');
      });

      it('uses the minutes string with the count under an hour', () => {
        expect(fd(ago(5 * 60), rel)).toBe('5 minutes ago');
        expect(fd(ago(59 * 60), rel)).toBe('59 minutes ago');
      });

      it('returns a minutes string without %d verbatim', () => {
        expect(fd(ago(5 * 60), { ...base, relativeTime: { minutes: 'a few minutes ago' } })).toBe('a few minutes ago');
      });

      it('falls back to the today pattern under an hour when minutes is missing', () => {
        expect(fd(ago(5 * 60), { ...base, relativeTime: { hours: '%d hours ago' } })).toBe('11:55');
      });

      it('uses the singular hour string at exactly one hour', () => {
        expect(fd(ago(90 * 60), rel)).toBe('1 hour ago');
      });

      it('uses the hours string for 2–23 hours', () => {
        expect(fd(ago(3 * 3600), rel)).toBe('3 hours ago');
        expect(fd(ago(23 * 3600), rel)).toBe('23 hours ago');
      });

      it('uses the hours string at one hour when no singular is given', () => {
        expect(fd(ago(3600), { ...base, relativeTime: { hours: '%d hours ago' } })).toBe('1 hours ago');
      });

      it('stops being relative at 24 hours', () => {
        expect(fd(ago(30 * 3600), rel)).toBe('Yesterday');
      });

      it('ignores an empty relativeTime object', () => {
        expect(fd(ago(30), { ...base, relativeTime: {} })).toBe('11:59');
      });
    });
  });
});

describe('formatDurationLong', () => {
  it('reads seconds only under a minute', () => {
    expect(formatDurationLong(45, 'en-US')).toBe('45 seconds');
    expect(formatDurationLong(1, 'en-US')).toBe('1 second');
  });

  it('drops zero seconds on whole minutes', () => {
    expect(formatDurationLong(60, 'en-US')).toBe('1 minute');
    expect(formatDurationLong(120, 'en-US')).toBe('2 minutes');
  });

  it('combines minutes and seconds', () => {
    expect(formatDurationLong(150, 'en-US')).toBe('2 minutes 30 seconds');
  });

  it('rolls hours into minutes', () => {
    expect(formatDurationLong(3661, 'en-US')).toBe('61 minutes 1 second');
  });

  it('clamps zero, negative, NaN and Infinity to 0 seconds and floors fractions', () => {
    expect(formatDurationLong(0, 'en-US')).toBe('0 seconds');
    expect(formatDurationLong(-5, 'en-US')).toBe('0 seconds');
    expect(formatDurationLong(NaN, 'en-US')).toBe('0 seconds');
    expect(formatDurationLong(Infinity, 'en-US')).toBe('0 seconds');
    expect(formatDurationLong(59.9, 'en-US')).toBe('59 seconds');
  });

  it('applies the locale plural rules', () => {
    expect(formatDurationLong(60, 'ru')).toBe('1 минута');
    expect(formatDurationLong(120, 'ru')).toBe('2 минуты');
    expect(formatDurationLong(300, 'ru')).toBe('5 минут');
    expect(formatDurationLong(120, 'es')).toBe('2 minutos');
  });

  it('falls back to en-US for an invalid locale tag', () => {
    expect(formatDurationLong(60, 'not a locale!!')).toBe('1 minute');
  });
});

describe('formatDurationShort', () => {
  it('reads a zero duration as 0 sec', () => {
    expect(formatDurationShort(0, 'en-US')).toBe('0 sec');
  });

  it('drops leading zero units', () => {
    expect(formatDurationShort(5, 'en-US')).toBe('5 sec');
    expect(formatDurationShort(65, 'en-US')).toBe('1 min 5 sec');
  });

  it('includes all three units once hours are present, even zero ones', () => {
    expect(formatDurationShort(3723, 'en-US')).toBe('1 hr 2 min 3 sec');
    expect(formatDurationShort(3600, 'en-US')).toBe('1 hr 0 min 0 sec');
  });

  it('uses CLDR short forms for Japanese (not Latin h/m/s)', () => {
    expect(formatDurationShort(3723, 'ja')).toBe('1 時間 2 分 3 秒');
  });

  it('clamps invalid input to 0 sec', () => {
    expect(formatDurationShort(-10, 'en-US')).toBe('0 sec');
    expect(formatDurationShort(NaN, 'en-US')).toBe('0 sec');
  });
});

describe('cachedByLanguage', () => {
  it('builds once and returns the same instance for the same language', () => {
    const build = vi.fn(() => ({ today: 'HH:mm' }));
    const get = cachedByLanguage(build);
    const a = get('en');
    const b = get('en');
    expect(a).toBe(b);
    expect(build).toHaveBeenCalledTimes(1);
  });

  it('rebuilds when the language changes', () => {
    let n = 0;
    const get = cachedByLanguage(() => ({ n: ++n }));
    expect(get('en')).toEqual({ n: 1 });
    expect(get('fr')).toEqual({ n: 2 });
    expect(get('fr')).toEqual({ n: 2 });
  });

  it('keeps a single slot: switching back rebuilds a new instance', () => {
    const get = cachedByLanguage(() => ({}));
    const en1 = get('en');
    get('fr');
    const en2 = get('en');
    expect(en2).not.toBe(en1);
  });

  it('treats the empty string as a real key', () => {
    const build = vi.fn(() => 1);
    const get = cachedByLanguage(build);
    get('');
    get('');
    expect(build).toHaveBeenCalledTimes(1);
  });
});
