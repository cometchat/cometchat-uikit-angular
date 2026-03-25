import { Pipe, PipeTransform } from '@angular/core';
import { CometChatLocalize } from './cometchat-localize';

/**
 * Angular pipe for translating keys to localized strings.
 *
 * This pipe uses the CometChatLocalize service to translate keys
 * to the current language. It's marked as impure to update when
 * the language changes at runtime.
 *
 * @example
 * // In your template:
 * <button>{{ 'conversation_chat_title' | translate }}</button>
 * // Outputs: "Chats" (in English)
 *
 * @example
 * // With parameters (using string interpolation):
 * <span>{{ 'add_n_members' | translate:{ n: 5 } }}</span>
 * // Outputs: "Add 5 Members"
 */
@Pipe({
  name: 'translate',
  standalone: true,
  pure: false, // Impure to update when language changes
})
export class TranslatePipe implements PipeTransform {
  /**
   * Transforms a translation key to its localized string value.
   *
   * @param key - The translation key to look up
   * @param params - Optional params object for string interpolation
   * @returns The translated string with parameters replaced
   */
  transform(
    key: string,
    params?: Record<string, string | number>
  ): string {
    if (!key) {
      return '';
    }

    let translated = CometChatLocalize.getLocalizedString(key);

    // If no translation found, return the key
    if (!translated) {
      return key;
    }

    // Replace parameters if provided
    if (params) {
      Object.keys(params).forEach(paramKey => {
        const regex = new RegExp(`\\{${paramKey}\\}`, 'g');
        translated = translated.replace(regex, String(params![paramKey]));
      });
    }

    return translated;
  }
}
