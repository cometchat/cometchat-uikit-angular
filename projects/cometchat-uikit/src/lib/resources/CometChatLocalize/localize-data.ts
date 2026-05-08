import { CalendarObject } from './localization.interfaces';

/**
 * Language-specific default CalendarObjects for date formatting.
 * Keys are BCP 47 language tags.
 */
export const LANGUAGE_CALENDAR_DEFAULTS: Record<string, CalendarObject> = {
  'en-US': { today: 'hh:mm A', yesterday: '[Yesterday]', lastWeek: 'dddd', otherDays: 'MM/DD/YYYY' },
  'en-GB': { today: 'HH:mm', yesterday: '[Yesterday]', lastWeek: 'dddd', otherDays: 'DD/MM/YYYY' },
  de: { today: 'HH:mm', yesterday: '[Gestern]', lastWeek: 'dddd', otherDays: 'DD.MM.YYYY' },
  fr: { today: 'HH:mm', yesterday: '[Hier]', lastWeek: 'dddd', otherDays: 'DD/MM/YYYY' },
  es: { today: 'HH:mm', yesterday: '[Ayer]', lastWeek: 'dddd', otherDays: 'DD/MM/YYYY' },
  ja: { today: 'HH:mm', yesterday: '[昨日]', lastWeek: 'dddd', otherDays: 'YYYY/MM/DD' },
  ko: { today: 'HH:mm', yesterday: '[어제]', lastWeek: 'dddd', otherDays: 'YYYY/MM/DD' },
  zh: { today: 'HH:mm', yesterday: '[昨天]', lastWeek: 'dddd', otherDays: 'YYYY/MM/DD' },
  'zh-TW': { today: 'HH:mm', yesterday: '[昨天]', lastWeek: 'dddd', otherDays: 'YYYY/MM/DD' },
  ru: { today: 'HH:mm', yesterday: '[Вчера]', lastWeek: 'dddd', otherDays: 'DD.MM.YYYY' },
  hi: { today: 'hh:mm A', yesterday: '[कल]', lastWeek: 'dddd', otherDays: 'DD/MM/YYYY' },
  ms: { today: 'HH:mm', yesterday: '[Semalam]', lastWeek: 'dddd', otherDays: 'DD/MM/YYYY' },
  pt: { today: 'HH:mm', yesterday: '[Ontem]', lastWeek: 'dddd', otherDays: 'DD/MM/YYYY' },
  sv: { today: 'HH:mm', yesterday: '[Igår]', lastWeek: 'dddd', otherDays: 'YYYY-MM-DD' },
  lt: { today: 'HH:mm', yesterday: '[Vakar]', lastWeek: 'dddd', otherDays: 'YYYY-MM-DD' },
  hu: { today: 'HH:mm', yesterday: '[Tegnap]', lastWeek: 'dddd', otherDays: 'YYYY.MM.DD' },
  it: { today: 'HH:mm', yesterday: '[Ieri]', lastWeek: 'dddd', otherDays: 'DD/MM/YYYY' },
  nl: { today: 'HH:mm', yesterday: '[Gisteren]', lastWeek: 'dddd', otherDays: 'DD-MM-YYYY' },
  tr: { today: 'HH:mm', yesterday: '[Dün]', lastWeek: 'dddd', otherDays: 'DD.MM.YYYY' },
};

/**
 * Default IANA timezone identifiers for each supported language.
 */
export const DEFAULT_TIMEZONES: Record<string, string> = {
  'en-US': 'America/New_York',
  'en-GB': 'Europe/London',
  ru: 'Europe/Moscow',
  fr: 'Europe/Paris',
  de: 'Europe/Berlin',
  zh: 'Asia/Shanghai',
  'zh-TW': 'Asia/Taipei',
  es: 'Europe/Madrid',
  hi: 'Asia/Kolkata',
  ms: 'Asia/Kuala_Lumpur',
  pt: 'Europe/Lisbon',
  sv: 'Europe/Stockholm',
  lt: 'Europe/Vilnius',
  hu: 'Europe/Budapest',
  it: 'Europe/Rome',
  ja: 'Asia/Tokyo',
  ko: 'Asia/Seoul',
  nl: 'Europe/Amsterdam',
  tr: 'Europe/Istanbul',
};
