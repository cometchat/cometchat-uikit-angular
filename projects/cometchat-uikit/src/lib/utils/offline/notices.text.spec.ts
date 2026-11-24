/**
 * The text of each offline notice, with its plural lookup: the word for the count in the current
 * language, the `_other` text when a language has no word for that count, and the English rule when
 * the platform cannot pick a plural category.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CometChatLocalize } from '../../resources/CometChatLocalize/cometchat-localize';
import { getLocalizedPlural, offlineNoticeText } from './notices';
import type { OfflineNotice } from './offline-hub';

const notice = (kind: OfflineNotice['kind'], count?: number): OfflineNotice => ({ gen: 1, kind, count });

describe('offlineNoticeText', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each([
    ['unsent_message_removed', 'message_list_unsent_message_removed'],
    ['queue_full', 'message_list_queue_full'],
    ['file_too_large_offline', 'message_list_file_too_large_offline'],
    ['unsent_messages_maybe_lost', 'message_list_unsent_messages_maybe_lost'],
    ['send_in_flight', 'message_list_send_in_flight'],
  ] as const)('%s reads %s', (kind, key) => {
    expect(offlineNoticeText(notice(kind))).toBe(CometChatLocalize.getLocalizedString(key));
    expect(offlineNoticeText(notice(kind))).not.toBe('');
  });

  it('a count notice says how many, and says one when no count came', () => {
    expect(offlineNoticeText(notice('messages_not_sent', 3))).toContain('3');
    expect(offlineNoticeText(notice('unsent_messages_lost', 5))).toContain('5');
    expect(offlineNoticeText(notice('messages_not_sent'))).toBe(getLocalizedPlural('message_list_messages_not_sent', 1));
    expect(offlineNoticeText(notice('unsent_messages_lost'))).toBe(getLocalizedPlural('message_list_unsent_messages_lost', 1));
  });

  it('a notice of a kind this version does not know is no text', () => {
    expect(offlineNoticeText({ gen: 1, kind: 'from_the_future' as any })).toBe('');
  });
});

describe('getLocalizedPlural', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('English: one and other', () => {
    expect(getLocalizedPlural('message_list_messages_not_sent', 1)).not.toBe(
      getLocalizedPlural('message_list_messages_not_sent', 2)
    );
    expect(getLocalizedPlural('message_list_messages_not_sent', 2)).toContain('2');
  });

  it('a language that is not set reads as English', () => {
    vi.spyOn(CometChatLocalize, 'getCurrentLanguage').mockReturnValue('' as any);
    expect(getLocalizedPlural('message_list_messages_not_sent', 2)).toContain('2');
  });

  it('a category with no text falls back to the _other text, with the count in it', () => {
    vi.spyOn(Intl, 'PluralRules').mockImplementation(function () {
      return { select: () => 'few' } as any;
    } as any);
    const text = getLocalizedPlural('message_list_messages_not_sent', 7);
    expect(text).toContain('7');
    expect(text).toBe(
      CometChatLocalize.getLocalizedString('message_list_messages_not_sent_other').replace(/\{\{count\}\}/g, '7')
    );
  });

  it('a platform that cannot pick a category uses the English rule', () => {
    vi.spyOn(Intl, 'PluralRules').mockImplementation(function () {
      throw new RangeError('unsupported');
    } as any);
    const one = getLocalizedPlural('message_list_messages_not_sent', 1);
    const many = getLocalizedPlural('message_list_messages_not_sent', 4);
    expect(one).toContain('1');
    expect(many).toContain('4');
    expect(one).not.toBe(many.replace('4', '1'));
  });
});
