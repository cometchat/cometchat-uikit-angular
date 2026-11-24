/**
 * Localized text for offline notices, with an internal plural lookup: a key
 * `name` has `name_one`, `name_few`, `name_many` and `name_other` variants,
 * picked with `Intl.PluralRules` for the current language and falling back to
 * `name_other`. `{{count}}` is replaced with the count.
 *
 * @internal
 */
import { CometChatLocalize } from '../../resources/CometChatLocalize/cometchat-localize';
import { OfflineNotice } from './offline-hub';

/** `key` for `count`, from `key_<plural category>` then `key_other`. */
export function getLocalizedPlural(key: string, count: number): string {
  let category = 'other';
  try {
    category = new Intl.PluralRules(CometChatLocalize.getCurrentLanguage() || 'en').select(count);
  } catch {
    category = count === 1 ? 'one' : 'other';
  }
  const text =
    CometChatLocalize.getLocalizedString(`${key}_${category}`) ||
    CometChatLocalize.getLocalizedString(`${key}_other`);
  return text.replace(/\{\{count\}\}/g, String(count));
}

export function offlineNoticeText(notice: OfflineNotice): string {
  switch (notice.kind) {
    case 'unsent_message_removed':
      return CometChatLocalize.getLocalizedString('message_list_unsent_message_removed');
    case 'queue_full':
      return CometChatLocalize.getLocalizedString('message_list_queue_full');
    case 'file_too_large_offline':
      return CometChatLocalize.getLocalizedString('message_list_file_too_large_offline');
    case 'messages_not_sent':
      return getLocalizedPlural('message_list_messages_not_sent', notice.count ?? 1);
    case 'unsent_messages_lost':
      return getLocalizedPlural('message_list_unsent_messages_lost', notice.count ?? 1);
    case 'unsent_messages_maybe_lost':
      return CometChatLocalize.getLocalizedString('message_list_unsent_messages_maybe_lost');
    case 'send_in_flight':
      return CometChatLocalize.getLocalizedString('message_list_send_in_flight');
    default:
      return '';
  }
}
