import { test, expect, Page, Browser, BrowserContext } from '../fixtures/coverage';
import {
  loginToApp,
  openConversation,
  scrollToLatestMessage,
  conversationRow,
  getUserName,
  sendTextAs,
  editTextAs,
  deleteMessageAs,
  addReactionAs,
  addGroupMembers,
  removeGroupMember,
  createE2EGroup,
  PRIMARY_USER,
  SECONDARY_USER,
  THIRD_USER,
  E2E_USER_UIDS,
  uniqueTag,
} from '../helpers';

/**
 * Realtime between two users: what one user sees, live, when another acts. The watcher
 * (primary user) is `page`; the other user acts in their own browser context or over REST.
 *
 * These depend on realtime delivery, which occasionally drops an event (seen about 1 in 10
 * for messages), so each test gets one retry. A pass on retry is reported as flaky, not hidden.
 */

test.describe.configure({ retries: 1 });

const header = (page: Page) => page.locator('cometchat-message-header');
const mainList = (page: Page) => page.locator('cometchat-messages cometchat-message-list').first();
const rowById = (page: Page, id: string) => mainList(page).locator(`.cometchat-message-list__message[data-message-id="${id}"]`);
const rowWithText = (page: Page, text: string) =>
  mainList(page).locator('.cometchat-message-list__message').filter({ hasText: text }).last();

/** Log `uid` in, in its own browser context, and wait for home. */
async function loginInNewContext(browser: Browser, uid: string): Promise<{ context: BrowserContext; page: Page }> {
  const context = await browser.newContext();
  const page = await context.newPage();
  await loginToApp(page, { userUid: uid });
  await expect(page.locator('.cometchat-conversations').first()).toBeVisible({ timeout: 30_000 });
  return { context, page };
}

/** As the primary user, open the 1:1 chat with the secondary user at its latest message. */
async function watchChatWithSecondary(page: Page) {
  await loginToApp(page);
  await openConversation(page, await getUserName(SECONDARY_USER));
  await scrollToLatestMessage(page);
}

// ─── Typing ──────────────────────────────────────────────────────────────────

test('typing shows "Typing..." in the header and the chat row, and clears when the other user stops @realtime', async ({
  page,
  browser,
}) => {
  const other = await loginInNewContext(browser, SECONDARY_USER);
  try {
    const secondaryName = await getUserName(SECONDARY_USER);
    await watchChatWithSecondary(page);
    await openConversation(other.page, await getUserName(PRIMARY_USER));
    const editor = other.page.locator('cometchat-message-composer [contenteditable="true"]').first();

    await editor.click();
    await other.page.keyboard.type('I am typing a reply', { delay: 40 });

    await expect(header(page)).toContainText('Typing...', { timeout: 15_000 });
    await expect(conversationRow(page, secondaryName)).toContainText('Typing...', { timeout: 15_000 });

    await editor.press('ControlOrMeta+a');
    await editor.press('Backspace');
    await expect(header(page)).not.toContainText('Typing...', { timeout: 20_000 });
  } finally {
    await other.context.close();
  }
});

// ─── Receipts ────────────────────────────────────────────────────────────────

test('a sent message is delivered when it reaches the recipient, and read once they open the chat @realtime @smoke', async ({
  page,
  browser,
}) => {
  // The recipient is online on the home screen (chat not open) when the message arrives.
  const other = await loginInNewContext(browser, SECONDARY_USER);
  try {
    await watchChatWithSecondary(page);
    const text = `Receipt flow ${uniqueTag()}`;
    const editor = page.locator('cometchat-messages cometchat-message-composer [contenteditable="true"]').first();
    await editor.click();
    await page.keyboard.type(text);
    await page.keyboard.press('Enter');
    const receipt = rowWithText(page, text).locator('.cometchat-receipts');

    await expect(receipt).toHaveClass(/cometchat-receipts-delivered/, { timeout: 30_000 });

    await openConversation(other.page, await getUserName(PRIMARY_USER));
    await scrollToLatestMessage(other.page);
    await expect(receipt).toHaveClass(/cometchat-receipts-read/, { timeout: 30_000 });
  } finally {
    await other.context.close();
  }
});

test('a message to a recipient who is offline stays "sent" @realtime', async ({ page }) => {
  await watchChatWithSecondary(page);
  const text = `Receipt offline ${uniqueTag()}`;
  const editor = page.locator('cometchat-messages cometchat-message-composer [contenteditable="true"]').first();
  await editor.click();
  await page.keyboard.type(text);
  await page.keyboard.press('Enter');

  const receipt = rowWithText(page, text).locator('.cometchat-receipts');
  await expect(receipt).toHaveClass(/cometchat-receipts-sent/, { timeout: 30_000 });
  await expect(receipt).not.toHaveClass(/cometchat-receipts-(delivered|read)/);
});

// ─── Edit, delete, react ─────────────────────────────────────────────────────

test("the other user's new message, edit, reaction and delete all appear live @realtime @smoke", async ({ page }) => {
  await watchChatWithSecondary(page);
  const runId = uniqueTag();

  const id = await sendTextAs(SECONDARY_USER, PRIMARY_USER, `Live original ${runId}`);
  await expect(rowById(page, id)).toContainText(`Live original ${runId}`, { timeout: 30_000 });

  await editTextAs(SECONDARY_USER, id, `Live edited ${runId}`);
  await expect(rowById(page, id)).toContainText(`Live edited ${runId}`, { timeout: 30_000 });
  await expect(rowById(page, id)).toContainText('Edited');

  await addReactionAs(SECONDARY_USER, id, '👍');
  await expect(rowById(page, id).locator('cometchat-reactions')).toContainText('👍', { timeout: 30_000 });

  await deleteMessageAs(SECONDARY_USER, id);
  await expect(rowById(page, id).locator('cometchat-delete-bubble')).toBeVisible({ timeout: 30_000 });
});

// ─── Unread and ordering ─────────────────────────────────────────────────────

test('new messages move the chat to the top of the list and count up its unread badge @realtime', async ({ page }) => {
  const sender = E2E_USER_UIDS[6];
  const senderName = await getUserName(sender);
  await loginToApp(page);
  const firstRow = page.locator('.cometchat-conversation-item').first();
  const badge = conversationRow(page, senderName).locator('.cometchat-conversation-item__badge');

  await sendTextAs(sender, PRIMARY_USER, `Unread one ${uniqueTag()}`);
  await expect(firstRow).toContainText(senderName, { timeout: 30_000 });
  const before = Number((await badge.textContent())?.trim() || '0');
  expect(before).toBeGreaterThanOrEqual(1);

  await sendTextAs(sender, PRIMARY_USER, `Unread two ${uniqueTag()}`);
  await expect(badge).toHaveText(String(before + 1), { timeout: 30_000 });
  await expect(firstRow).toContainText(senderName);
});

// ─── Group events ────────────────────────────────────────────────────────────

test('members added and kicked show action messages and update the member count live @realtime', async ({ page }) => {
  const runId = uniqueTag();
  const guid = `e2e-live-group-${runId}`;
  const name = `E2E Live Group ${runId}`;
  await createE2EGroup(guid, name, PRIMARY_USER, [SECONDARY_USER]);
  const thirdName = await getUserName(THIRD_USER);
  await loginToApp(page);
  await openConversation(page, name);
  await expect(header(page)).toContainText(/2\s+Members/);

  await addGroupMembers(guid, [THIRD_USER]);
  await expect(mainList(page).locator('cometchat-action-bubble').filter({ hasText: thirdName }).last()).toContainText(
    'added',
    { timeout: 30_000 }
  );
  await expect(header(page)).toContainText(/3\s+Members/, { timeout: 30_000 });

  await removeGroupMember(guid, THIRD_USER);
  await expect(mainList(page).locator('cometchat-action-bubble').filter({ hasText: thirdName }).last()).toContainText(
    'kicked',
    { timeout: 30_000 }
  );
  await expect(header(page)).toContainText(/2\s+Members/, { timeout: 30_000 });
});

test('a member who is kicked while the group is open can no longer send to it @realtime @quarantine (ENG-40622)', async ({ page }) => {
  // @quarantine (ENG-40622): intermittent UI Kit / sample app defect — after the kick the chat
  // sometimes stays open with a usable composer: either the kick reaches the header ("1 Member")
  // but the chat isn't closed, or it never reaches the open chat at all. Failed 1 of 3 isolated
  // runs and 1 of 5 probe runs, so it can't be test.fail.
  const runId = uniqueTag();
  const guid = `e2e-kicked-${runId}`;
  const name = `E2E Kicked ${runId}`;
  // The secondary user owns the group; the primary user is the one who gets kicked.
  await createE2EGroup(guid, name, SECONDARY_USER, [PRIMARY_USER]);
  await loginToApp(page);
  await openConversation(page, name);
  await expect(page.locator('cometchat-messages cometchat-message-composer')).toBeVisible();
  // Kick only once the chat has loaded: "while the group is open", not while it is still opening
  // (a kick during the first fetch makes that fetch fail with 401 instead).
  await expect(
    page.locator('cometchat-messages cometchat-message-list').locator('.cometchat-message-list__loading, .cometchat-message-list__shimmer')
  ).toHaveCount(0, { timeout: 30_000 });

  await removeGroupMember(guid, PRIMARY_USER);

  // Either the chat closes or the composer goes away; the user can't keep typing into it.
  await expect(
    page.locator('cometchat-messages cometchat-message-composer').filter({ visible: true })
  ).toHaveCount(0, { timeout: 30_000 });
});

// ─── Pins ────────────────────────────────────────────────────────────────────

test("a message the other user pins shows as pinned live @realtime", async ({ page, browser }) => {
  const text = `Pin me live ${uniqueTag()}`;
  const id = await sendTextAs(SECONDARY_USER, PRIMARY_USER, text);
  await watchChatWithSecondary(page);
  await expect(rowById(page, id)).toBeVisible({ timeout: 30_000 });

  const other = await loginInNewContext(browser, SECONDARY_USER);
  try {
    await openConversation(other.page, await getUserName(PRIMARY_USER));
    await scrollToLatestMessage(other.page);
    const otherRow = rowById(other.page, id);
    await otherRow.locator('.cometchat-message-bubble__body').first().hover();
    await otherRow.getByRole('button', { name: 'More options' }).click();
    await other.page.getByRole('menuitem', { name: 'Organise' }).hover();
    await other.page.getByRole('menuitem', { name: 'Pin message' }).click();
    await expect(otherRow.locator('.cometchat-message-bubble__pinned-indicator')).toBeVisible({ timeout: 15_000 });

    await expect(rowById(page, id).locator('.cometchat-message-bubble__pinned-indicator')).toBeVisible({
      timeout: 30_000,
    });
  } finally {
    await other.context.close();
  }
});

test('pinning a conversation in one tab shows it pinned in the same user\'s other tab @realtime', async ({ page, context }) => {
  // Known defect (likely SDK/backend, ENG-40825): the pin is saved — a reload of the other tab shows it —
  // but it is never pushed live: the other tab's realtime connection receives no pin event,
  // so onConversationPinned never fires there. Expected to fail until fixed.
  test.fail();
  const target = E2E_USER_UIDS[7];
  const targetName = await getUserName(target);
  await sendTextAs(target, PRIMARY_USER, `Pin across tabs ${uniqueTag()}`);
  await loginToApp(page);
  // A second tab of the same user shares the session: open the app, don't log in again
  // (loginToApp clears storage, which would end the first tab's session).
  const secondTab = await context.newPage();
  await secondTab.goto('/');
  await expect(conversationRow(secondTab, targetName)).toBeVisible({ timeout: 30_000 });
  const mark = (p: Page) => conversationRow(p, targetName).locator('.cometchat-conversation-item__pin');
  const row = conversationRow(page, targetName);
  const menu = async (item: string) => {
    await row.hover();
    await row.getByRole('button', { name: 'More options' }).click();
    await page.getByRole('menuitem', { name: item }).click();
  };
  const unpin = async () => {
    await menu('Unpin conversation');
    await page.locator('cometchat-pin-save-confirm-dialog').getByRole('button', { name: 'Unpin' }).click();
    await expect(mark(page)).toBeHidden({ timeout: 15_000 });
  };
  if (await mark(page).isVisible()) await unpin(); // left over from an interrupted attempt

  try {
    await menu('Pin conversation');
    await expect(mark(page)).toBeVisible({ timeout: 15_000 });

    await expect(mark(secondTab)).toBeVisible({ timeout: 20_000 });
  } finally {
    if (await mark(page).isVisible()) await unpin();
  }
});

// ─── Presence ────────────────────────────────────────────────────────────────

test("the header shows the other user going online and offline live @realtime", async ({ page, browser }) => {
  await watchChatWithSecondary(page);
  const status = header(page).locator('.cometchat-message-header__subtitle-wrapper');

  const other = await loginInNewContext(browser, SECONDARY_USER);
  await expect(status).toHaveText(/Online/, { timeout: 30_000 });

  await other.context.close();
  await expect(status).toHaveText(/Offline|Last seen/, { timeout: 60_000 });
});

// ─── Threads ─────────────────────────────────────────────────────────────────

test("the other user's thread reply updates the reply count live @realtime", async ({ page, browser }) => {
  const parent = `Live thread parent ${uniqueTag()}`;
  const id = await sendTextAs(SECONDARY_USER, PRIMARY_USER, parent);
  await watchChatWithSecondary(page);
  await expect(rowById(page, id)).toBeVisible({ timeout: 30_000 });

  const other = await loginInNewContext(browser, SECONDARY_USER);
  try {
    await openConversation(other.page, await getUserName(PRIMARY_USER));
    await scrollToLatestMessage(other.page);
    const otherRow = rowById(other.page, id);
    await otherRow.locator('.cometchat-message-bubble__body').first().hover();
    const quick = otherRow.getByRole('button', { name: 'Reply in thread' });
    if (await quick.isVisible()) await quick.click();
    else {
      await otherRow.getByRole('button', { name: 'More options' }).click();
      await other.page.getByRole('menuitem', { name: 'Reply in thread' }).click();
    }
    const panel = other.page.locator('.cometchat-threaded-messages');
    await expect(panel.locator('cometchat-thread-header')).toContainText(parent);
    // The parent was sent just above, so its thread has no replies yet: nothing to wait for in
    // the thread's list (that wait always ran out, using 30 of the test's 60 seconds).
    await panel.locator('cometchat-message-composer [contenteditable="true"]').first().click();
    await other.page.keyboard.type(`Live thread reply ${uniqueTag()}`);
    await other.page.keyboard.press('Enter');

    await expect(rowById(page, id).locator('cometchat-thread-view')).toContainText('1', { timeout: 30_000 });
  } finally {
    await other.context.close();
  }
});
