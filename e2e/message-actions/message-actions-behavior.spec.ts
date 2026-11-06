import { test, expect, Page } from '../fixtures/coverage';
import {
  loginToApp,
  openConversation,
  scrollToLatestMessage,
  conversationRow,
  getUserName,
  sendTextAs,
  sendMessageAs,
  createE2EGroup,
  PRIMARY_USER,
  SECONDARY_USER,
  uniqueTag,
} from '../helpers';

/**
 * Message actions: which options a message offers, delete, message info, report and
 * mark as unread. Every assertion waits on UI state.
 */

/** Open the 1:1 chat with the secondary user at its latest message. */
async function openSecondaryChat(page: Page) {
  const secondaryName = await getUserName(SECONDARY_USER);
  await loginToApp(page);
  const list = await openConversation(page, secondaryName);
  await scrollToLatestMessage(page);
  return list;
}

/** The list row of the most recent message containing `text`. */
const rowWithText = (page: Page, text: string) =>
  page.locator('cometchat-message-list .cometchat-message-list__message').filter({ hasText: text }).last();

/**
 * Hover a message and open its "More options" menu. Returns every option the message offers:
 * the quick-action buttons on the bubble plus the items in the menu.
 */
async function openMessageMenu(page: Page, text: string): Promise<string[]> {
  const row = rowWithText(page, text);
  await expect(row).toBeVisible({ timeout: 30_000 });
  await row.locator('.cometchat-message-bubble__body').first().hover();
  await row.getByRole('button', { name: 'More options' }).click();
  await expect(page.getByRole('menuitem').first()).toBeVisible();
  const quick = await row.locator('.cometchat-message-bubble__options').getByRole('button').evaluateAll((els) =>
    els.map((e) => e.getAttribute('aria-label') || e.textContent || '')
  );
  const menu = await page.getByRole('menuitem').allTextContents();
  return [...quick, ...menu].map((t) => t.trim()).filter(Boolean);
}

// ─── Which options show ──────────────────────────────────────────────────────

test.describe('Which options show', () => {
  test('your own message offers Edit, Delete and Info, but not Report or Mark as Unread @smoke', async ({ page }) => {
    const text = `Own message ${uniqueTag()}`;
    await sendTextAs(PRIMARY_USER, SECONDARY_USER, text);
    await openSecondaryChat(page);

    const options = await openMessageMenu(page, text);

    expect(options).toEqual(expect.arrayContaining(['Edit', 'Delete', 'Info']));
    expect(options).not.toContain('Report');
    expect(options).not.toContain('Mark as Unread');
    expect(options).not.toContain('Message Privately');
  });

  test("someone else's message in a 1:1 chat offers Report and Mark as Unread, not Edit, Delete or Info", async ({
    page,
  }) => {
    const text = `Their message ${uniqueTag()}`;
    await sendTextAs(SECONDARY_USER, PRIMARY_USER, text);
    await openSecondaryChat(page);

    const options = await openMessageMenu(page, text);

    expect(options).toEqual(expect.arrayContaining(['Report', 'Mark as Unread']));
    for (const own of ['Edit', 'Delete', 'Info']) expect(options).not.toContain(own);
    expect(options).not.toContain('Message Privately');
  });

  test("someone else's message in a group also offers Message Privately", async ({ page }) => {
    const runId = uniqueTag();
    const groupName = `E2E Actions ${runId}`;
    const guid = `e2e-actions-${runId}`;
    await createE2EGroup(guid, groupName, PRIMARY_USER, [PRIMARY_USER, SECONDARY_USER]);
    const text = `Group message ${runId}`;
    await sendMessageAs(SECONDARY_USER, guid, { category: 'message', type: 'text', data: { text } }, 'group');
    await loginToApp(page);
    await openConversation(page, groupName);

    const options = await openMessageMenu(page, text);

    expect(options).toEqual(expect.arrayContaining(['Report', 'Message Privately']));
    for (const own of ['Edit', 'Delete', 'Info']) expect(options).not.toContain(own);
  });
});

// ─── Delete ──────────────────────────────────────────────────────────────────

test.describe('Delete', () => {
  test('delete asks first: Cancel keeps the message, Delete replaces it with "This message was deleted" @smoke', async ({
    page,
  }) => {
    const text = `Delete me ${uniqueTag()}`;
    await sendTextAs(PRIMARY_USER, SECONDARY_USER, text);
    await openSecondaryChat(page);
    const dialog = page.locator('cometchat-message-list cometchat-confirm-dialog');

    await openMessageMenu(page, text);
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await expect(dialog).toContainText('Delete Message?');
    await dialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(dialog).toBeHidden();
    await expect(rowWithText(page, text)).toBeVisible();

    await openMessageMenu(page, text);
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await dialog.getByRole('button', { name: 'Delete' }).click();
    await expect(dialog).toBeHidden();
    await expect(page.locator('cometchat-message-list').getByText(text)).toHaveCount(0, { timeout: 15_000 });
    await expect(page.locator('cometchat-message-list cometchat-delete-bubble').last()).toBeVisible();
  });
});

// ─── Message info ────────────────────────────────────────────────────────────

test.describe('Message info', () => {
  test('after the recipient opens the chat, Info shows the message as read @realtime', async ({ page, browser }) => {
    // Moderation's AI rules flagged "Read receipt check <tag>" as a scam (AI Scam detection);
    // keep the text plainly conversational.
    const text = `Lunch at noon works for me ${uniqueTag()}`;
    await sendTextAs(PRIMARY_USER, SECONDARY_USER, text);

    // The recipient opens the chat in their own browser, which marks the message read.
    const recipient = await browser.newContext();
    try {
      const recipientPage = await recipient.newPage();
      await loginToApp(recipientPage, { userUid: SECONDARY_USER });
      await openConversation(recipientPage, await getUserName(PRIMARY_USER));
      await scrollToLatestMessage(recipientPage);
      await expect(rowWithText(recipientPage, text)).toBeVisible({ timeout: 30_000 });
    } finally {
      await recipient.close();
    }

    await openSecondaryChat(page);
    await openMessageMenu(page, text);
    await page.getByRole('menuitem', { name: 'Info' }).click();

    const info = page.locator('cometchat-message-information');
    await expect(info).toContainText('Message Information');
    await expect(info).toContainText(text);
    await expect(info).toContainText('Read', { timeout: 15_000 });
  });
});

// ─── Report ──────────────────────────────────────────────────────────────────

test.describe('Report', () => {
  const dialog = (page: Page) => page.locator('.cometchat-flag-message-dialog').first();

  test('reporting with a reason confirms "Message Reported."', async ({ page }) => {
    const text = `Report me ${uniqueTag()}`;
    await sendTextAs(SECONDARY_USER, PRIMARY_USER, text);
    await openSecondaryChat(page);

    await openMessageMenu(page, text);
    await page.getByRole('menuitem', { name: 'Report' }).click();
    await expect(dialog(page)).toContainText('Report a Message');
    const reasons = dialog(page).locator('.cometchat-flag-message-dialog__reason');
    await expect(reasons.first()).toBeVisible({ timeout: 15_000 });
    await reasons.first().click();
    await expect(reasons.first()).toHaveAttribute('aria-pressed', 'true');
    await dialog(page).locator('textarea').fill('E2E report');
    const flagged = page.waitForResponse((r) => r.url().includes('/flagged') && r.request().method() === 'POST');
    await dialog(page).getByRole('button', { name: 'Report' }).click();
    const response = await flagged;
    expect(response.status(), 'Reporting needs the Moderation feature enabled for the app in the dashboard').not.toBe(403);

    await expect(page.getByText('Message Reported.')).toBeVisible({ timeout: 15_000 });
    await expect(dialog(page)).toBeHidden();
  });

  test('submitting a report always settles, with a confirmation or an error', async ({ page }) => {
    // Seen once on an app without Moderation: the report endpoint returned 403 ("Moderation
    // feature is not available… upgrade your plan"), the SDK re-authenticated (POST
    // /user_sessions) and the report never settled, so the Report button spun forever.
    // Whatever the server answers, the dialog must end in "Message Reported." or an error.
    const text = `Report settles ${uniqueTag()}`;
    await sendTextAs(SECONDARY_USER, PRIMARY_USER, text);
    await openSecondaryChat(page);

    await openMessageMenu(page, text);
    await page.getByRole('menuitem', { name: 'Report' }).click();
    await dialog(page).locator('.cometchat-flag-message-dialog__reason').first().click();
    await dialog(page).getByRole('button', { name: 'Report' }).click();

    await expect(
      page.getByText('Message Reported.').or(page.getByText('Looks like something went wrong'))
    ).toBeVisible({ timeout: 15_000 });
  });

  test('cancelling the report dialog reports nothing', async ({ page }) => {
    const text = `Do not report ${uniqueTag()}`;
    await sendTextAs(SECONDARY_USER, PRIMARY_USER, text);
    await openSecondaryChat(page);

    await openMessageMenu(page, text);
    await page.getByRole('menuitem', { name: 'Report' }).click();
    await expect(dialog(page)).toContainText('Report a Message');
    await dialog(page).getByRole('button', { name: 'Cancel' }).click();

    await expect(dialog(page)).toBeHidden();
    await expect(page.getByText('Message Reported.')).toHaveCount(0);
  });
});

// ─── Mark as unread ──────────────────────────────────────────────────────────

test.describe('Mark as unread', () => {
  test('marking a message unread adds the "New" divider and an unread badge on the chat', async ({ page }) => {
    const text = `Mark unread ${uniqueTag()}`;
    await sendTextAs(SECONDARY_USER, PRIMARY_USER, text);
    await openSecondaryChat(page);
    const secondaryName = await getUserName(SECONDARY_USER);
    await expect(conversationRow(page, secondaryName).locator('.cometchat-conversation-item__badge')).toBeHidden({
      timeout: 15_000,
    });

    // A click while the menu is still opening can be lost; retry until the unread request
    // actually goes out.
    await expect(async () => {
      await openMessageMenu(page, text);
      const markedUnread = page.waitForResponse(
        (r) => r.url().includes('/conversation/read') && r.request().method() === 'DELETE',
        { timeout: 3_000 }
      );
      await page.getByRole('menuitem', { name: 'Mark as Unread' }).click();
      expect((await markedUnread).ok()).toBe(true);
    }).toPass({ timeout: 30_000 });

    // The divider is rendered immediately before the row of the message that was marked.
    const divider = page.locator('.cometchat-message-list__unread-divider');
    await expect(divider).toBeVisible({ timeout: 15_000 });
    const markedRowFollowsDivider = await divider.evaluate((d, t) => {
      for (let el = d.nextElementSibling; el; el = el.nextElementSibling) {
        if (el.classList.contains('cometchat-message-list__message')) return (el.textContent ?? '').includes(t);
      }
      return false;
    }, text);
    expect(markedRowFollowsDivider, 'the first message after the divider is the one marked unread').toBe(true);
    await expect(conversationRow(page, secondaryName).locator('.cometchat-conversation-item__badge')).toBeVisible({
      timeout: 15_000,
    });
  });
});
