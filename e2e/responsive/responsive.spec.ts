import { test, expect, Page } from '../fixtures/coverage';
import {
  loginToApp,
  scrollToLatestMessage,
  conversationRow,
  getUserName,
  sendTextAs,
  PRIMARY_USER,
  SECONDARY_USER,
  uniqueTag,
} from '../helpers';

/**
 * Responsive layout. At 768px and below the sample app shows one panel at a time — the list,
 * the chat, or a side panel (details, thread) — with back/close buttons to move between them.
 * Tests run as a touch phone (390×844) unless they say otherwise.
 */

test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

// ─── Helpers ─────────────────────────────────────────────────────────────────

const listPanel = (page: Page) => page.locator('.cometchat-home__left-panel');
const chatPanel = (page: Page) => page.locator('.cometchat-home__center-panel');
const sidePanel = (page: Page) => page.locator('.cometchat-home__right-panel');
const header = (page: Page) => page.locator('cometchat-message-header').first();

/** Expect `panel` to fill the viewport's width. */
async function expectFullWidth(page: Page, panel: ReturnType<typeof listPanel>) {
  await expect(panel).toBeVisible();
  // Polled: after a resize the layout settles over a few frames.
  await expect
    .poll(async () => {
      const box = await panel.boundingBox();
      return box && [Math.round(box.x), Math.round(box.width)];
    })
    .toEqual([0, page.viewportSize()!.width]);
}

/** Tap a conversation until its chat opens (the first tap is sometimes ignored, ENG-39945). */
async function openChat(page: Page, name: string) {
  await expect(async () => {
    await conversationRow(page, name).tap();
    await expect(header(page)).toContainText(name, { timeout: 3_000 });
  }).toPass({ timeout: 30_000 });
}

async function loginAndOpenChat(page: Page) {
  const name = await getUserName(SECONDARY_USER);
  await loginToApp(page);
  await openChat(page, name);
  return name;
}

// ─── One panel at a time ─────────────────────────────────────────────────────

test.describe('Phone layout', () => {
  test('home shows only the chat list, full width, with the tab bar', async ({ page }) => {
    await loginToApp(page);

    await expectFullWidth(page, listPanel(page));
    await expect(chatPanel(page)).toBeHidden();
    await expect(page.getByRole('tablist', { name: 'Navigation tabs' })).toBeInViewport();
  });

  test('opening a chat shows only the chat, with a back button, and a message can be sent', async ({ page }) => {
    await loginAndOpenChat(page);

    await expectFullWidth(page, chatPanel(page));
    await expect(listPanel(page)).toBeHidden();
    await expect(header(page).getByRole('button', { name: 'Go back to conversations' })).toBeVisible();
    await scrollToLatestMessage(page);

    const text = `Sent from a phone ${uniqueTag()}`;
    await page.locator('cometchat-messages cometchat-message-composer [contenteditable="true"]').first().tap();
    await page.keyboard.type(text);
    await page.locator('cometchat-messages cometchat-message-composer').getByRole('button', { name: 'Send message' }).tap();
    await expect(page.locator('cometchat-message-list').getByText(text)).toBeInViewport({ timeout: 15_000 });
  });

  test("the chat header's back button returns to the list", async ({ page }) => {
    const name = await loginAndOpenChat(page);

    await header(page).getByRole('button', { name: 'Go back to conversations' }).tap();
    await expectFullWidth(page, listPanel(page));
    await expect(chatPanel(page)).toBeHidden();
    await expect(conversationRow(page, name)).toBeVisible();
  });

  test('user details open full screen, and closing them returns to the chat', async ({ page }) => {
    const name = await loginAndOpenChat(page);

    await header(page).locator('.cometchat-message-header__info').tap();
    const details = page.locator('cometchat-user-details');
    await expect(details).toContainText(name);
    await expectFullWidth(page, sidePanel(page));
    await expect(chatPanel(page)).toBeHidden();

    await details.getByRole('button', { name: /close/i }).first().tap();
    await expectFullWidth(page, chatPanel(page));
    await expect(details).toBeHidden();
  });

  test('a thread opens full screen, and closing it returns to the chat', async ({ page }) => {
    const parent = `Phone thread ${uniqueTag()}`;
    await sendTextAs(SECONDARY_USER, PRIMARY_USER, parent);
    await loginAndOpenChat(page);
    await scrollToLatestMessage(page);

    const row = page.locator('cometchat-message-list .cometchat-message-list__message').filter({ hasText: parent }).last();
    await row.locator('.cometchat-message-bubble__body').first().tap();
    await row.getByRole('button', { name: 'More options' }).tap();
    await page.getByRole('menuitem', { name: /thread/i }).first().tap();

    const thread = page.locator('cometchat-threaded-messages');
    await expect(thread).toContainText(parent);
    await expectFullWidth(page, sidePanel(page));
    await expect(chatPanel(page)).toBeHidden();

    await thread.getByRole('button', { name: 'Close thread' }).tap();
    await expectFullWidth(page, chatPanel(page));
  });

  test("the browser's back button returns from a chat to the list", async ({ page }) => {
    // Known sample-app gap (ENG-40826): opening a chat adds no history entry, so the browser (or Android
    // hardware) Back button does nothing — the chat stays open. Expected to fail until fixed.
    test.fail();
    await loginAndOpenChat(page);

    await page.goBack();
    await expectFullWidth(page, listPanel(page));
    await expect(chatPanel(page)).toBeHidden({ timeout: 5_000 });
  });

  test('the tabs keep their names for screen readers when only icons are shown', async ({ page }) => {
    // Known sample-app defect (ENG-40827): on phones the tab labels are hidden and nothing replaces them,
    // so all four tabs have no accessible name ("tab, tab, tab, tab"). Expected to fail until fixed.
    test.fail();
    await loginToApp(page);

    for (const name of ['Chats', 'Calls', 'Users', 'Groups']) {
      await expect(page.getByRole('tablist', { name: 'Navigation tabs' }).getByRole('tab', { name })).toBeVisible({
        timeout: 5_000,
      });
    }
  });
});

// ─── Resizing ────────────────────────────────────────────────────────────────

test.describe('Resizing', () => {
  test('an open chat stays open when the window widens to desktop and narrows back', async ({ page }) => {
    const name = await loginAndOpenChat(page);

    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(listPanel(page)).toBeVisible();
    await expect(chatPanel(page)).toBeVisible();
    await expect(header(page)).toContainText(name);

    await page.setViewportSize({ width: 390, height: 844 });
    await expectFullWidth(page, chatPanel(page));
    await expect(listPanel(page)).toBeHidden();
    await expect(header(page)).toContainText(name);
  });

  test("widening to desktop removes the phone's back button", async ({ page }) => {
    // Known sample-app defect (ENG-40828): the back button shown on phones stays in the chat header after
    // the window widens to desktop, where tapping it does nothing (a chat opened on desktop has
    // no back button). Expected to fail until fixed.
    test.fail();
    await loginAndOpenChat(page);

    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(chatPanel(page)).toBeVisible();
    await expect(header(page).getByRole('button', { name: 'Go back to conversations' })).toBeHidden({ timeout: 5_000 });
  });

  test('a desktop window narrowed to phone width switches to one panel', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await loginToApp(page);
    await expect(chatPanel(page)).toBeVisible();

    await page.setViewportSize({ width: 390, height: 844 });
    await expectFullWidth(page, listPanel(page));
    await expect(chatPanel(page)).toBeHidden();
  });
});

// ─── Small phones ────────────────────────────────────────────────────────────

test.describe('A 320px-wide phone', () => {
  test.use({ viewport: { width: 320, height: 640 } });

  test('nothing scrolls sideways, and the chat header, bubbles and composer fit the screen', async ({ page }) => {
    await sendTextAs(SECONDARY_USER, PRIMARY_USER, `A long incoming message that has to wrap on a very narrow phone ${uniqueTag()}`);
    await sendTextAs(PRIMARY_USER, SECONDARY_USER, `A long outgoing reply that also has to wrap on a very narrow phone ${uniqueTag()}`);
    await loginToApp(page);
    const noSideScroll = () => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
    expect(await noSideScroll(), 'chat list scrolls sideways').toBe(true);

    await openChat(page, await getUserName(SECONDARY_USER));
    await scrollToLatestMessage(page);
    expect(await noSideScroll(), 'chat scrolls sideways').toBe(true);

    // The visible parts — not their invisible layout wrappers — must sit inside the screen.
    const overflowing = await page.evaluate(() => {
      const width = window.innerWidth;
      const visible = [
        '.cometchat-home__center-panel cometchat-message-header',
        '.cometchat-home__center-panel cometchat-message-composer',
        '.cometchat-home__center-panel .cometchat-message-bubble__body',
      ];
      return visible.flatMap((selector) =>
        Array.from(document.querySelectorAll(selector))
          .map((el) => el.getBoundingClientRect())
          .filter((r) => r.height > 0 && (r.left < -1 || r.right > width + 1))
          .map((r) => `${selector} ${Math.round(r.left)}..${Math.round(r.right)}`)
      );
    });
    expect(overflowing).toEqual([]);
  });
});
