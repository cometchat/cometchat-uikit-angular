import { test, expect, Page } from '../fixtures/coverage';
import {
  loginToApp,
  openConversation,
  scrollToLatestMessage,
  getUserName,
  sendTextAs,
  createE2EGroup,
  unblockUser,
  PRIMARY_USER,
  SECONDARY_USER,
  THIRD_USER,
  uniqueTag,
} from '../helpers';

/**
 * Message composer behaviour: links, mentions, voice notes, polls, editing and
 * the blocked-user state. Every assertion waits on UI state.
 */

// A fake microphone and auto-accepted permission prompt for the voice-note tests. Must be
// file-level: launch options can't change inside a describe group.
test.use({
  launchOptions: { args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] },
});

/** Open the 1:1 chat with the secondary user at its latest message. */
async function openSecondaryChat(page: Page) {
  const secondaryName = await getUserName(SECONDARY_USER);
  await loginToApp(page);
  const list = await openConversation(page, secondaryName);
  await scrollToLatestMessage(page);
  return list;
}

const composer = (page: Page) => page.locator('cometchat-message-composer');
const editor = (page: Page) => composer(page).locator('[contenteditable="true"]').first();

/** The list row of the most recent message containing `text`. */
const rowWithText = (page: Page, text: string) =>
  page.locator('cometchat-message-list .cometchat-message-list__message').filter({ hasText: text }).last();

/** Open a message's "More options" menu (only rendered while the bubble is hovered). */
async function openMessageMenu(page: Page, text: string) {
  const row = rowWithText(page, text);
  await row.locator('.cometchat-message-bubble__body').first().hover();
  await row.getByRole('button', { name: 'More options' }).click();
}

// ─── Links ───────────────────────────────────────────────────────────────────

test.describe('Links', () => {
  /** Insert a link through the toolbar's link dialog. */
  async function insertLink(page: Page, text: string, url: string) {
    await editor(page).click();
    await composer(page).getByRole('button', { name: 'Link', exact: true }).click();
    const dialog = page.locator('cometchat-link-dialog');
    await dialog.getByRole('textbox', { name: 'Text' }).fill(text);
    await dialog.getByRole('textbox', { name: 'Link' }).fill(url);
    await dialog.getByRole('button', { name: 'Save' }).click();
    await expect(editor(page).locator(`a[href="${url}"]`)).toHaveText(text);
  }

  test('the link popover edits a link, and the sent message uses the new URL', async ({ page }) => {
    // Likely UI Kit defect (ENG-40817): a real mouse click on a link in the composer doesn't open the
    // link popover (the link is the hit target, and a synthetic click event does open it).
    // Expected to fail until fixed.
    test.fail();
    await openSecondaryChat(page);
    const label = `Docs ${uniqueTag()}`;
    await insertLink(page, label, 'https://www.cometchat.com/old');

    await editor(page).locator('a', { hasText: label }).click();
    const popover = page.locator('.cometchat-link-popover');
    await expect(popover).toBeVisible({ timeout: 5_000 });
    await popover.getByRole('button', { name: 'Edit Link' }).click();
    const dialog = page.locator('cometchat-link-dialog');
    await dialog.getByRole('textbox', { name: 'Link' }).fill('https://www.cometchat.com/new');
    await dialog.getByRole('button', { name: 'Save' }).click();
    await expect(editor(page).locator('a[href="https://www.cometchat.com/new"]')).toHaveText(label);

    await editor(page).press('End');
    await page.keyboard.press('Enter');
    await expect(rowWithText(page, label).locator('a[href="https://www.cometchat.com/new"]')).toBeVisible({
      timeout: 30_000,
    });
  });

  test('the link popover removes a link and keeps the text', async ({ page }) => {
    // Likely UI Kit defect (ENG-40817): a real mouse click on a link in the composer doesn't open the
    // link popover (the link is the hit target, and a synthetic click event does open it).
    // Expected to fail until fixed.
    test.fail();
    await openSecondaryChat(page);
    const label = `Unlink me ${uniqueTag()}`;
    await insertLink(page, label, 'https://www.cometchat.com/remove');

    await editor(page).locator('a', { hasText: label }).click();
    await page.locator('.cometchat-link-popover').getByRole('button', { name: 'Remove link' }).click({ timeout: 5_000 });

    await expect(editor(page).locator('a')).toHaveCount(0);
    await expect(editor(page)).toContainText(label);
  });

  test('a link shows a preview card (when the link-preview extension is on)', async ({ page }) => {
    const id = await sendTextAs(SECONDARY_USER, PRIMARY_USER, `Preview this: https://www.cometchat.com/docs?p=${uniqueTag()}`);

    await openSecondaryChat(page);

    const preview = page
      .locator(`.cometchat-message-list__message[data-message-id="${id}"]`)
      .locator('.cometchat-text-bubble__link-preview');
    await expect(preview).toBeVisible({ timeout: 30_000 });
    await expect(preview).toContainText('www.cometchat.com');
  });

  test('a plain URL in a message renders as a clickable link', async ({ page }) => {
    const url = `https://www.cometchat.com/docs?e2e=${uniqueTag()}`;
    await sendTextAs(SECONDARY_USER, PRIMARY_USER, `Have a look: ${url}`);

    await openSecondaryChat(page);

    await expect(rowWithText(page, 'Have a look:').locator(`a[href="${url}"]`)).toBeVisible({ timeout: 30_000 });
  });
});

// ─── Mentions ────────────────────────────────────────────────────────────────

test.describe('Mentions', () => {
  test('@all is offered in a group, and the sent message renders it as a mention', async ({ page }) => {
    // A fresh group per run, so this test never depends on what earlier runs left behind.
    const runId = uniqueTag();
    const groupName = `E2E Mentions ${runId}`;
    await createE2EGroup(`e2e-mentions-${runId}`, groupName, PRIMARY_USER, [PRIMARY_USER, SECONDARY_USER]);
    await loginToApp(page);
    await openConversation(page, groupName);
    await scrollToLatestMessage(page).catch(() => undefined); // a new group may have only action messages

    // Scope to the composer: conversation rows are options too, and an earlier "@all" message
    // makes a conversation row match /@all/.
    const suggestion = composer(page).getByRole('option', { name: /@all/ }).first();
    // The suggestion list refreshes while typing, so a click can land on a stale row. Clear and
    // retype until the editor actually holds the @all mention.
    await expect(async () => {
      await editor(page).click();
      await editor(page).press('ControlOrMeta+a');
      await editor(page).press('Backspace');
      await page.keyboard.type('@al');
      await suggestion.click({ timeout: 3_000 });
      await expect(editor(page).locator('.cometchat-mentions').filter({ hasText: '@all' })).toBeVisible({ timeout: 1_000 });
    }).toPass({ timeout: 30_000 });
    await page.keyboard.type(` heads up ${runId}`);
    await page.keyboard.press('Enter');

    const sent = rowWithText(page, `heads up ${runId}`);
    await expect(sent.locator('.cometchat-mentions').filter({ hasText: '@all' })).toBeVisible({ timeout: 30_000 });
  });

  test('a mention of you is highlighted as yours; a mention of someone else is not', async ({ page }) => {
    const runId = uniqueTag();
    await sendTextAs(SECONDARY_USER, PRIMARY_USER, `<@uid:${PRIMARY_USER}> and <@uid:${THIRD_USER}> see ${runId}`);
    const [me, other] = await Promise.all([getUserName(PRIMARY_USER), getUserName(THIRD_USER)]);

    await openSecondaryChat(page);

    const row = rowWithText(page, `see ${runId}`);
    await expect(row.locator('.cometchat-mentions-you')).toHaveText(`@${me}`, { timeout: 30_000 });
    await expect(row.locator('.cometchat-mentions:not(.cometchat-mentions-you)')).toHaveText(`@${other}`);
  });
});

// ─── Voice note ──────────────────────────────────────────────────────────────

test.describe('Voice note', () => {
  test('a recording can be discarded, and nothing is sent', async ({ page }) => {
    const list = await openSecondaryChat(page);
    const voiceNotesBefore = await list.locator('cometchat-voice-note-bubble').count();

    await composer(page).getByRole('button', { name: 'Voice recording' }).click();
    const recorder = page.getByLabel('Voice recorder');
    await expect(recorder).toBeVisible();
    await recorder.getByRole('button', { name: 'Delete recording' }).click();

    await expect(recorder).toBeHidden();
    await expect(editor(page)).toBeVisible();
    await expect(list.locator('cometchat-voice-note-bubble')).toHaveCount(voiceNotesBefore);
  });

  test('a denied microphone shows the permission message, not a broken recorder', async ({ page }) => {
    // Known UI Kit defect (ENG-40818): the recorder switches to its "Microphone Access Needed" state but
    // also emits recordingError, and the composer's handler closes the recorder, so the
    // message is removed before it can be seen. Clicking the mic appears to do nothing.
    // Expected to fail until fixed.
    test.fail();
    await openSecondaryChat(page);
    // Deny the microphone only now: replacing getUserMedia before startup breaks the app's init.
    await page.evaluate(() => {
      navigator.mediaDevices.getUserMedia = () =>
        Promise.reject(new DOMException('Permission denied', 'NotAllowedError'));
    });

    await composer(page).getByRole('button', { name: 'Voice recording' }).click();

    await expect(page.getByText('Microphone Access Needed')).toBeVisible({ timeout: 5_000 });
  });
});

// ─── Polls ───────────────────────────────────────────────────────────────────

test.describe('Polls', () => {
  async function openCreatePoll(page: Page) {
    await composer(page).getByRole('button', { name: 'Add attachment' }).click();
    await page.locator('[class*="action-sheet"]').getByText(/poll/i).first().click();
    const form = page.locator('cometchat-create-poll');
    await expect(form).toBeVisible();
    return form;
  }

  test('Create stays disabled until there is a question and two options; options can be added and removed', async ({
    page,
  }) => {
    await openSecondaryChat(page);
    const form = await openCreatePoll(page);
    const create = form.getByRole('button', { name: 'Create' });
    const option = (n: number) => form.getByRole('textbox', { name: `Options ${n}`, exact: true });

    await expect(create).toBeDisabled();
    await form.getByPlaceholder('Ask question').fill('E2E question?');
    await option(1).fill('Only one');
    await expect(create).toBeDisabled();
    await option(2).fill('Second');
    await expect(create).toBeEnabled();

    const optionInputs = form.getByRole('textbox', { name: /^Options \d+$/ });
    const before = await optionInputs.count();
    await form.getByRole('button', { name: 'Add Option' }).click();
    await expect(optionInputs).toHaveCount(before + 1);
    await form.getByRole('button', { name: `Remove option ${before + 1}` }).click();
    await expect(optionInputs).toHaveCount(before);
  });

  test('a created poll can be voted on, and the vote can be changed @quarantine (ENG-40810)', async ({ page }) => {
    // @quarantine (ENG-40810): intermittent UI Kit defect — the poll the extension posts as the user reaches
    // the client (the Chats row previews it) but is sometimes never rendered in the open chat.
    await openSecondaryChat(page);
    const form = await openCreatePoll(page);
    const question = `E2E vote ${uniqueTag()}?`;
    await form.getByPlaceholder('Ask question').fill(question);
    await form.getByRole('textbox', { name: 'Options 1', exact: true }).fill('First');
    await form.getByRole('textbox', { name: 'Options 2', exact: true }).fill('Second');
    await form.getByRole('button', { name: 'Create' }).click();
    const failed = form.getByText('Something went wrong. Please try again.');
    await expect(failed, 'Poll creation failed: is the Polls extension enabled in the dashboard?').toBeHidden();
    await expect(form).toBeHidden({ timeout: 15_000 });

    const poll = rowWithText(page, question).locator('cometchat-poll-bubble');
    await expect(poll).toBeVisible({ timeout: 30_000 });
    const first = poll.getByRole('radio', { name: /First/ });
    const second = poll.getByRole('radio', { name: /Second/ });

    await first.click();
    await expect(first).toBeChecked({ timeout: 15_000 });
    await second.click();
    await expect(second).toBeChecked({ timeout: 15_000 });
    await expect(first).not.toBeChecked();
  });
});

// ─── Edit ────────────────────────────────────────────────────────────────────

test.describe('Edit', () => {
  test('editing a sent message updates the bubble and marks it "Edited"', async ({ page }) => {
    const runId = uniqueTag();
    const original = `Edit me ${runId}`;
    await sendTextAs(PRIMARY_USER, SECONDARY_USER, original);
    await openSecondaryChat(page);

    await openMessageMenu(page, original);
    await page.getByRole('menuitem', { name: 'Edit' }).click();
    await expect(composer(page)).toContainText('Editing message');
    await expect(editor(page)).toContainText(original);
    await editor(page).press('ControlOrMeta+a');
    await page.keyboard.type(`Edited text ${runId}`);
    await page.keyboard.press('Enter');

    const row = rowWithText(page, `Edited text ${runId}`);
    await expect(row).toBeVisible({ timeout: 30_000 });
    await expect(row).toContainText('Edited');
    await expect(page.locator('cometchat-message-list').getByText(original)).toHaveCount(0);
  });

  test('the close button cancels an edit: the message is unchanged and not marked "Edited"', async ({ page }) => {
    const original = `Keep me (close) ${uniqueTag()}`;
    await sendTextAs(PRIMARY_USER, SECONDARY_USER, original);
    await openSecondaryChat(page);

    await openMessageMenu(page, original);
    await page.getByRole('menuitem', { name: 'Edit' }).click();
    await expect(composer(page)).toContainText('Editing message');
    await composer(page).locator('.cometchat-message-preview__close').click();

    await expect(composer(page)).not.toContainText('Editing message');
    const row = rowWithText(page, original);
    await expect(row).toBeVisible();
    await expect(row).not.toContainText('Edited');
  });

  test('Escape cancels an edit: the message is unchanged and not marked "Edited"', async ({ page }) => {
    // Known UI Kit defect (ENG-40819): Escape never leaves edit mode, even with the editor focused and
    // pressed repeatedly, although the composer's Escape handler is written to cancel it.
    // Expected to fail until fixed.
    test.fail();
    const original = `Keep me ${uniqueTag()}`;
    await sendTextAs(PRIMARY_USER, SECONDARY_USER, original);
    await openSecondaryChat(page);

    await openMessageMenu(page, original);
    await page.getByRole('menuitem', { name: 'Edit' }).click();
    await expect(composer(page)).toContainText('Editing message');
    await editor(page).press('Escape');

    await expect(composer(page)).not.toContainText('Editing message', { timeout: 5_000 });
    const row = rowWithText(page, original);
    await expect(row).toBeVisible();
    await expect(row).not.toContainText('Edited');
  });
});

// ─── Blocked user ────────────────────────────────────────────────────────────

test.describe('Blocked user', () => {
  test.afterEach(async () => {
    await unblockUser(PRIMARY_USER, SECONDARY_USER);
  });

  test('blocking replaces the composer with a banner; unblocking brings it back', async ({ page }) => {
    await openSecondaryChat(page);

    await page.locator('cometchat-message-header').getByText(await getUserName(SECONDARY_USER)).first().click();
    const details = page.locator('cometchat-user-details, app-cometchat-user-details').first();
    await details.getByText('Block User').click();
    await page.locator('.cometchat-block-user-dialog__backdrop').getByRole('button', { name: 'Block User' }).click();

    const banner = page.locator('.cometchat-messages__blocked-banner');
    await expect(banner).toContainText("Can't send a message to blocked user.", { timeout: 15_000 });
    await expect(composer(page)).toHaveCount(0);

    await banner.getByRole('button', { name: 'Click to unblock.' }).click();
    await expect(banner).toBeHidden({ timeout: 15_000 });
    await expect(editor(page)).toBeVisible();
  });
});
