/**
 * l10n gate for the offline strings (README §4, UIK-A11Y-01, UIT-A11Y-02): every
 * shipped locale has every offline key, and each plural notice resolves for
 * every plural category the locale's Intl.PluralRules can pick.
 */
import { describe, expect, it } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const RESOURCES = path.resolve(__dirname, '../../resources/CometChatLocalize/resources');
const locales = fs
  .readdirSync(RESOURCES)
  .filter(d => fs.statSync(path.join(RESOURCES, d)).isDirectory());
const load = (locale: string): Record<string, string> =>
  JSON.parse(fs.readFileSync(path.join(RESOURCES, locale, 'translation.json'), 'utf8'));

const PLAIN_KEYS = [
  'message_list_not_sent_yet',
  'message_list_not_sent_tap_to_retry',
  'message_list_unsent_message_removed',
  'message_list_unsent_messages_maybe_lost',
  'message_list_queue_full',
  'message_list_file_too_large_offline',
  'message_list_connect_to_load_more',
  'message_list_option_delete_failed',
  'conversations_connect_to_search',
  'message_bubble_media_available_when_online',
  'message_list_send_in_flight',
  'retry',
  'message_list_option_delete',
  'message_list_option_copy',
];
const PLURAL_KEYS = ['message_list_messages_not_sent', 'message_list_unsent_messages_lost'];
const COUNTS = [0, 1, 2, 3, 4, 5, 11, 12, 21, 22, 25, 101, 111];

describe('offline strings in every locale', () => {
  it('ships 19 locales', () => {
    expect(locales.length).toBe(19);
  });

  for (const locale of locales) {
    it(`${locale}: every offline key is present and non-empty`, () => {
      const strings = load(locale);
      for (const key of PLAIN_KEYS) expect(strings[key], `${locale} ${key}`).toBeTruthy();
      for (const key of PLURAL_KEYS)
        expect(strings[`${key}_other`], `${locale} ${key}_other`).toMatch(/\{\{count\}\}/);
    });

    it(`${locale}: each plural notice resolves for every category Intl.PluralRules picks`, () => {
      const strings = load(locale);
      const rules = new Intl.PluralRules(locale);
      for (const key of PLURAL_KEYS) {
        for (const count of COUNTS) {
          const category = rules.select(count);
          const text = strings[`${key}_${category}`] ?? strings[`${key}_other`];
          expect(text, `${locale} ${key} n=${count} (${category})`).toBeTruthy();
          expect(text).toContain('{{count}}');
        }
      }
    });
  }
});
