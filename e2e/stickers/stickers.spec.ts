import path from 'path';
import { test, expect, Page, Locator } from '../fixtures/coverage';
import { loginToApp, openConversation, scrollToLatestMessage, getUserName, SECONDARY_USER } from '../helpers';

/**
 * E2E Tests — Stickers Keyboard
 *
 * Tests the stickers keyboard component:
 * - Opening stickers panel
 * - Sticker categories display
 * - Selecting and sending a sticker
 * - Closing stickers panel
 *
 * Runs in the seeded 1:1 chat with the secondary user. Every assertion waits on UI state.
 *
 * The E2E app's stickers extension has no sticker sets (its catalogue answers
 * `{"defaultStickers":[],"customStickers":[]}`, so the keyboard can only show "No Stickers
 * Available"). The catalogue request is answered here with two small sets instead; everything
 * else — the keyboard, and sending the sticker through the real API — is the real thing.
 */

const STICKER_IMAGE = path.resolve(__dirname, '../fixtures/test-image.png');
const STICKER_HOST = 'https://e2e-stickers.example.com';
const STICKER_CATALOGUE = {
  data: {
    defaultStickers: [
      { stickerSetName: 'Animals', stickerOrder: 1, stickerUrl: `${STICKER_HOST}/animals-1.png` },
      { stickerSetName: 'Animals', stickerOrder: 2, stickerUrl: `${STICKER_HOST}/animals-2.png` },
      { stickerSetName: 'Faces', stickerOrder: 1, stickerUrl: `${STICKER_HOST}/faces-1.png` },
    ],
    customStickers: [],
  },
};

test.describe('Stickers Keyboard', () => {
  let page: Page;

  test.beforeEach(async ({ page: p }) => {
    page = p;
    await page.route(/^https:\/\/stickers-[a-z]+\.cometchat\.io\/v1\/fetch/, (route) =>
      route.fulfill({ json: STICKER_CATALOGUE })
    );
    await page.route(`${STICKER_HOST}/**`, (route) => route.fulfill({ path: STICKER_IMAGE, contentType: 'image/png' }));
    await loginToApp(page);
    await openConversation(page, await getUserName(SECONDARY_USER));
    await scrollToLatestMessage(page);
    await expect(stickersButton()).toBeVisible();
  });

  const composer = () => page.locator('cometchat-messages cometchat-message-composer').first();
  const stickersButton = (): Locator => composer().getByRole('button', { name: 'Sticker', exact: true });
  const keyboard = (): Locator => page.locator('.cometchat-stickers-keyboard');
  const stickerItems = (): Locator => keyboard().locator('.cometchat-stickers-keyboard__sticker-item');

  /** Open the stickers keyboard and wait until its stickers have loaded. */
  async function openKeyboard() {
    await stickersButton().click();
    await expect(keyboard()).toBeVisible();
    await expect(stickerItems().first()).toBeVisible({ timeout: 30_000 });
  }

  // ==================== Opening Stickers ====================

  test('stickers button is present in composer', async () => {
    await expect(stickersButton()).toBeVisible();
    await expect(stickersButton()).toBeEnabled();
  });

  test('clicking stickers button opens stickers keyboard', async () => {
    await stickersButton().click();
    await expect(keyboard()).toBeVisible();
    await expect(keyboard()).toHaveAttribute('role', 'dialog');
    await expect(keyboard()).toHaveAttribute('aria-label', 'Stickers keyboard');
  });

  // ==================== Sticker Categories ====================

  test('stickers keyboard shows category tabs', async () => {
    await openKeyboard();
    const tabs = keyboard().getByRole('tablist').getByRole('tab');
    await expect(tabs).toHaveCount(2);
    await expect(tabs.nth(0)).toHaveAttribute('aria-label', 'Animals');
    await expect(tabs.nth(1)).toHaveAttribute('aria-label', 'Faces');
    // The first category is selected and the grid shows its stickers; choosing another switches.
    await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'true');
    await expect(stickerItems()).toHaveCount(2);
    await tabs.nth(1).click();
    await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
    await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'false');
    await expect(stickerItems()).toHaveCount(1);
    await expect(stickerItems().first().locator('img')).toHaveAttribute('src', `${STICKER_HOST}/faces-1.png`);
  });

  // ==================== Sticker Grid ====================

  test('stickers grid displays sticker images', async () => {
    await openKeyboard();
    const firstImage = stickerItems().first().locator('img');
    await expect(firstImage).toHaveAttribute('src', `${STICKER_HOST}/animals-1.png`);
    // The image actually loads (not a broken image).
    await expect
      .poll(() => firstImage.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0), {
        timeout: 30_000,
      })
      .toBe(true);
  });

  // ==================== Send Sticker ====================

  test('clicking a sticker sends it as a message', async () => {
    await openKeyboard();
    const stickerUrl = await stickerItems().first().locator('img').getAttribute('src');
    const stickerBubbles = page.locator('cometchat-messages cometchat-message-list cometchat-sticker-bubble');
    const before = await stickerBubbles.count();

    await stickerItems().first().click();

    await expect(stickerBubbles).toHaveCount(before + 1, { timeout: 30_000 });
    await expect(stickerBubbles.last().locator('img')).toHaveAttribute('src', stickerUrl!);
  });

  // ==================== Close Stickers ====================

  test('clicking stickers button again closes the keyboard', async () => {
    await openKeyboard();
    await stickersButton().click();
    await expect(keyboard()).toBeHidden();
  });

  // ==================== Escape Closes Stickers ====================

  test('pressing Escape closes stickers keyboard', async () => {
    await openKeyboard();
    await stickerItems().first().focus();
    await page.keyboard.press('Escape');
    await expect(keyboard()).toBeHidden();
  });
});
