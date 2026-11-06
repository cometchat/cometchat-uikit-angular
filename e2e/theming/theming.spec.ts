import { test, expect, Page } from '../fixtures/coverage';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  loginToApp,
  openConversation,
  scrollToLatestMessage,
  getUserName,
  sendTextAs,
  PRIMARY_USER,
  SECONDARY_USER,
  uniqueTag,
} from '../helpers';

/**
 * Theming and localization. The UI Kit picks its theme from the OS colour scheme
 * (`data-theme` on <html>) and its language from the browser, so these tests set both through
 * Playwright's `colorScheme` and `locale` options. Expected strings come from the UI Kit's own
 * translation files.
 *
 * Not covered: right-to-left layout. The UI Kit ships no RTL language (Arabic, Hebrew) and no
 * RTL styles, so there is nothing to mirror yet.
 */

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TRANSLATIONS = join(__dirname, '../../projects/cometchat-uikit/src/lib/resources/CometChatLocalize/resources');

/** The UI Kit's string for `key` in `language`, wherever it sits in the translation file. */
function translation(language: string, key: string): string {
  const find = (node: unknown): string | undefined => {
    if (!node || typeof node !== 'object') return undefined;
    const record = node as Record<string, unknown>;
    if (typeof record[key] === 'string') return record[key] as string;
    for (const value of Object.values(record)) {
      const found = find(value);
      if (found) return found;
    }
    return undefined;
  };
  const value = find(JSON.parse(readFileSync(join(TRANSLATIONS, language, 'translation.json'), 'utf8')));
  if (!value) throw new Error(`No "${key}" in the ${language} translations`);
  return value;
}

/** Relative luminance (0 black – 1 white) of a computed `rgb(...)` colour. */
function luminance(rgb: string): number {
  const [r, g, b] = (rgb.match(/[\d.]+/g) ?? []).slice(0, 3).map((c) => {
    const v = Number(c) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

const computed = (page: Page, selector: string, property: 'backgroundColor' | 'color') =>
  page.locator(selector).first().evaluate((el, prop) => getComputedStyle(el)[prop], property);

const theme = (page: Page) => page.evaluate(() => document.documentElement.getAttribute('data-theme'));

const outgoingBubble = '.cometchat-message-bubble-outgoing .cometchat-message-bubble__text-message';
const incomingBubble = '.cometchat-message-bubble-incoming .cometchat-message-bubble__body';

/**
 * Make sure the chat's latest messages include an incoming and an outgoing text message (other
 * specs may have sent a page of outgoing ones), then open it at its latest message.
 */
async function openChatWithOwnMessage(page: Page) {
  await sendTextAs(SECONDARY_USER, PRIMARY_USER, `Theming incoming ${uniqueTag()}`);
  await sendTextAs(PRIMARY_USER, SECONDARY_USER, `Theming ${uniqueTag()}`);
  await loginToApp(page);
  await openConversation(page, await getUserName(SECONDARY_USER));
  await scrollToLatestMessage(page);
  await expect(page.locator(outgoingBubble).last()).toBeVisible({ timeout: 30_000 });
  await expect(page.locator(incomingBubble).last()).toBeVisible();
}

// ─── Dark mode ───────────────────────────────────────────────────────────────

test.describe('Dark mode', () => {
  test.describe('with a dark OS setting', () => {
    test.use({ colorScheme: 'dark' });

    test('the app opens in the dark theme: dark surfaces with light text', async ({ page }) => {
      await openChatWithOwnMessage(page);
      expect(await theme(page)).toBe('dark');

      for (const surface of ['.cometchat-conversations', 'cometchat-message-composer .cometchat-message-composer']) {
        expect(luminance(await computed(page, surface, 'backgroundColor')), `${surface} background`).toBeLessThan(0.1);
      }
      expect(luminance(await computed(page, '.cometchat-conversation-item__title-text', 'color')), 'chat title text').toBeGreaterThan(0.8);
      // Incoming bubbles are a dark grey, not the light-theme grey.
      expect(
        luminance(await computed(page, incomingBubble, 'backgroundColor'))
      ).toBeLessThan(0.1);
    });

    test('a stored light/dark choice wins over the OS setting after a reload', async ({ page }) => {
      // Known UI Kit defect (ENG-40831): ThemeService documents "Persists user choice to localStorage" and
      // "Priority: 1. Stored user preference", but it never reads or writes localStorage — the
      // OS setting always wins on load, so an app's theme toggle is lost on reload.
      // Expected to fail until fixed.
      test.fail();
      await loginToApp(page);
      expect(await theme(page)).toBe('dark');
      await page.evaluate(() => localStorage.setItem('cometchat-theme', 'light'));

      await page.reload();
      await expect(page.locator('.cometchat-conversations').first()).toBeVisible({ timeout: 30_000 });
      await expect.poll(() => theme(page), { timeout: 5_000 }).toBe('light');
    });
  });

  test.describe('with a light OS setting', () => {
    test.use({ colorScheme: 'light' });

    test('the app opens in the light theme', async ({ page }) => {
      await loginToApp(page);
      expect(await theme(page)).toBe('light');
      expect(luminance(await computed(page, '.cometchat-conversations', 'backgroundColor'))).toBeGreaterThan(0.9);
    });

    test('changing the OS setting while the app is open switches the theme live', async ({ page }) => {
      await openChatWithOwnMessage(page);
      const lightBackground = await computed(page, '.cometchat-conversations', 'backgroundColor');

      await page.emulateMedia({ colorScheme: 'dark' });
      await expect.poll(() => theme(page)).toBe('dark');
      await expect.poll(() => computed(page, '.cometchat-conversations', 'backgroundColor')).not.toBe(lightBackground);

      await page.emulateMedia({ colorScheme: 'light' });
      await expect.poll(() => theme(page)).toBe('light');
      await expect.poll(() => computed(page, '.cometchat-conversations', 'backgroundColor')).toBe(lightBackground);
    });
  });
});

// ─── Custom theme ────────────────────────────────────────────────────────────

test.describe('Custom theme', () => {
  const RED = 'rgb(220, 38, 38)';

  test('overriding --cometchat-primary-color recolours outgoing bubbles', async ({ page }) => {
    await openChatWithOwnMessage(page);
    expect(await computed(page, outgoingBubble, 'backgroundColor')).not.toBe(RED);

    await page.addStyleTag({ content: `:root, :root[data-theme] { --cometchat-primary-color: ${RED}; }` });
    await expect.poll(() => computed(page, outgoingBubble, 'backgroundColor')).toBe(RED);
  });

  test('a component variable overrides only that component', async ({ page }) => {
    await openChatWithOwnMessage(page);
    const incomingBefore = await computed(page, incomingBubble, 'backgroundColor');

    await page.addStyleTag({ content: `:root { --cometchat-message-bubble-outgoing-text-background: ${RED}; }` });
    await expect.poll(() => computed(page, outgoingBubble, 'backgroundColor')).toBe(RED);
    expect(await computed(page, incomingBubble, 'backgroundColor')).toBe(
      incomingBefore
    );
  });

  test.describe('in dark mode', () => {
    test.use({ colorScheme: 'dark' });

    test('a primary-colour override also applies in the dark theme', async ({ page }) => {
      await openChatWithOwnMessage(page);
      expect(await theme(page)).toBe('dark');

      await page.addStyleTag({ content: `:root, :root[data-theme] { --cometchat-primary-color: ${RED}; }` });
      await expect.poll(() => computed(page, outgoingBubble, 'backgroundColor')).toBe(RED);
    });
  });
});

// ─── Localization ────────────────────────────────────────────────────────────

test.describe('Localization', () => {
  const LOCALES = [
    { locale: 'fr-FR', language: 'fr' },
    { locale: 'de-DE', language: 'de' },
    { locale: 'ja-JP', language: 'ja' },
  ];

  for (const { locale, language } of LOCALES) {
    test.describe(locale, () => {
      test.use({ locale });

      test(`with a ${locale} browser, the UI and dates are in that language`, async ({ page }) => {
        await openChatWithOwnMessage(page);

        // Tab bar, composer placeholder and the "Today" separator.
        const tabs = (await page.locator('.cometchat-tabs__tab').allTextContents()).map((t) => t.trim());
        expect(tabs).toEqual(
          ['selector_tab_conversations', 'call_logs_title', 'user_title', 'selector_tab_groups'].map((k) => translation(language, k))
        );
        await expect(page.locator('cometchat-message-composer [contenteditable="true"]').first()).toHaveAttribute(
          'data-placeholder',
          translation(language, 'message_composer_placeholder')
        );
        await expect(page.locator('cometchat-message-list').getByText(translation(language, 'today'), { exact: true }).first()).toBeVisible();

        // Message times use the locale's 24-hour clock, not "05:43 PM".
        const time = (await page.locator('cometchat-message-list .cometchat-message-bubble__status-info-view').last().innerText()).trim();
        expect(time).toMatch(/^\d{1,2}:\d{2}$/);
      });

      test(`with a ${locale} browser, the page declares its language`, async ({ page }) => {
        // ENG-40991: <html lang> stays "en" whatever the UI language, so screen readers read the
        // translated UI with English pronunciation (WCAG 3.1.1). Expected to fail until fixed.
        test.fail();
        await loginToApp(page);
        await expect(page.locator('html')).toHaveAttribute('lang', new RegExp(`^${language}`), { timeout: 5_000 });
      });
    });
  }

  test.describe('en-US', () => {
    test.use({ locale: 'en-US' });

    test('with an en-US browser, message times use a 12-hour clock', async ({ page }) => {
      await openChatWithOwnMessage(page);
      const time = (await page.locator('cometchat-message-list .cometchat-message-bubble__status-info-view').last().innerText()).trim();
      expect(time).toMatch(/^\d{1,2}:\d{2}\s?(AM|PM)$/i);
    });
  });

  test.describe('an unsupported language', () => {
    test.use({ locale: 'sw-KE' });

    test('with a browser language the UI Kit has no strings for, the UI falls back to English', async ({ page }) => {
      await openChatWithOwnMessage(page);
      const tabs = (await page.locator('.cometchat-tabs__tab').allTextContents()).map((t) => t.trim());
      expect(tabs).toEqual(['Chats', 'Calls', 'Users', 'Groups']);
      await expect(page.locator('cometchat-message-composer [contenteditable="true"]').first()).toHaveAttribute(
        'data-placeholder',
        translation('en-us', 'message_composer_placeholder')
      );
    });
  });
});
