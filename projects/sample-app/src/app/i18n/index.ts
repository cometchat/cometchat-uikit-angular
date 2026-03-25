import en from './en.json';
import de from './de.json';
import es from './es.json';
import fr from './fr.json';
import hi from './hi.json';
import hu from './hu.json';
import it from './it.json';
import ja from './ja.json';
import ko from './ko.json';
import lt from './lt.json';
import ms from './ms.json';
import nl from './nl.json';
import pt from './pt.json';
import ru from './ru.json';
import sv from './sv.json';
import tr from './tr.json';
import zh from './zh.json';
import zhTw from './zh-tw.json';

/**
 * Sample-app-specific translations keyed by locale.
 * Register with CometChatLocalize.addTranslation() after UIKit init.
 */
export const sampleAppTranslations: Record<string, Record<string, string>> = {
  'en-US': en,
  'en-GB': en,
  'de': de,
  'es': es,
  'fr': fr,
  'hi': hi,
  'hu': hu,
  'it': it,
  'ja': ja,
  'ko': ko,
  'lt': lt,
  'ms': ms,
  'nl': nl,
  'pt': pt,
  'ru': ru,
  'sv': sv,
  'tr': tr,
  'zh': zh,
  'zh-TW': zhTw,
};
