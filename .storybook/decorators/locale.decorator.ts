import { CometChatLocalize } from '../../projects/cometchat-uikit/src/lib/resources/CometChatLocalize/cometchat-localize';

/**
 * Locale decorator for Storybook stories.
 *
 * Applies the selected locale from the toolbar to CometChatLocalize before each story renders.
 * Falls back to 'en-US' if the locale is unsupported or throws an error.
 */
export const withLocale = (story: any, context: any): any => {
  const locale = context.globals?.locale ?? 'en-US';

  try {
    CometChatLocalize.setCurrentLanguage(locale);
  } catch (err) {
    console.warn(`[withLocale] Unsupported locale "${locale}", falling back to en-US`, err);
    try {
      CometChatLocalize.setCurrentLanguage('en-US');
    } catch {
      // ignore
    }
  }

  // RTL support for Arabic
  const isRtl = locale === 'ar';
  document.documentElement.setAttribute('dir', isRtl ? 'rtl' : 'ltr');
  document.body.setAttribute('dir', isRtl ? 'rtl' : 'ltr');

  // Set lang attribute for accessibility
  document.documentElement.setAttribute('lang', locale);

  return story();
};
