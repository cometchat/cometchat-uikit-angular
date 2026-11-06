import { test, expect, Page, Locator } from '../fixtures/coverage';
import {
  loginToApp,
  openConversation,
  scrollToLatestMessage,
  getUserName,
  createE2EGroup,
  PRIMARY_USER,
  SECONDARY_USER,
  THIRD_USER,
  uniqueTag,
} from '../helpers';

/**
 * E2E Tests — @Mentions in Message Composer
 *
 * Tests the @mentions functionality:
 * - Typing @ triggers user suggestion dropdown
 * - Selecting a user inserts mention
 * - Mention renders as a chip/tag
 * - Sending message with mention works
 *
 * Runs in a group of this run's own users (the secondary and third users as members), so the
 * suggestions are people the test knows. Every assertion waits on UI state.
 */

test.describe('Mentions', () => {
  let page: Page;
  let groupName: string;
  let secondaryName: string;
  let thirdName: string;

  test.beforeAll(async () => {
    const runId = uniqueTag();
    groupName = `E2E Mentions Spec ${runId}`;
    await createE2EGroup(`e2e-mentions-spec-${runId}`, groupName, PRIMARY_USER, [PRIMARY_USER, SECONDARY_USER, THIRD_USER]);
    [secondaryName, thirdName] = await Promise.all([getUserName(SECONDARY_USER), getUserName(THIRD_USER)]);
  });

  test.beforeEach(async ({ page: p }) => {
    page = p;
    await loginToApp(page);
    await openConversation(page, groupName);
    // Let the list finish its first load (the group's "added" messages): a message sent while
    // it is still loading can be missing from the list once the load lands.
    await scrollToLatestMessage(page);
    await expect(input()).toBeVisible();
  });

  const composer = (): Locator => page.locator('cometchat-messages cometchat-message-composer').first();
  const input = (): Locator => composer().locator('[contenteditable="true"]').first();
  const suggestions = (): Locator => composer().getByRole('listbox', { name: /mention/i });
  const option = (name: string): Locator => suggestions().getByRole('option', { name: new RegExp(name) });

  /**
   * Type `text` (starting with "@") into an empty composer until the suggestion list shows
   * `expected`. Member suggestions load asynchronously, so retype if the first query raced.
   */
  async function typeMentionQuery(text: string, expected: string) {
    await expect(async () => {
      await input().click();
      await page.keyboard.press('ControlOrMeta+a');
      await page.keyboard.press('Backspace');
      await page.keyboard.type(text);
      await expect(option(expected)).toBeVisible({ timeout: 5_000 });
    }).toPass({ timeout: 30_000 });
  }

  // ==================== Trigger Mentions ====================

  test('typing @ triggers mention suggestions dropdown', async () => {
    await typeMentionQuery('@', secondaryName);
    await expect(suggestions()).toBeVisible();
    await expect(option(thirdName)).toBeVisible();
    await expect(composer().locator('.cometchat-message-composer__rich-text-editor')).toHaveAttribute('aria-expanded', 'true');
  });

  // ==================== Filter Mentions ====================

  test('typing after @ filters suggestions', async () => {
    await typeMentionQuery('@', secondaryName);
    await page.keyboard.type(thirdName.slice(0, 4));

    await expect(option(thirdName)).toBeVisible();
    await expect(option(secondaryName)).toHaveCount(0);
  });

  // ==================== Select Mention ====================

  test('clicking a suggestion inserts mention', async () => {
    await typeMentionQuery(`@${secondaryName.slice(0, 3)}`, secondaryName);
    await option(secondaryName).click();

    await expect(input().locator('.cometchat-mentions')).toHaveText(`@${secondaryName}`);
    await expect(suggestions()).toHaveCount(0);
  });

  // ==================== Keyboard Selection ====================

  test('arrow keys navigate mention suggestions', async () => {
    await typeMentionQuery('@', secondaryName);
    const all = suggestions().getByRole('option');
    await expect(all.first()).toHaveAttribute('aria-selected', 'true');

    await page.keyboard.press('ArrowDown');
    await expect(all.nth(1)).toHaveAttribute('aria-selected', 'true');
    await expect(all.first()).toHaveAttribute('aria-selected', 'false');
    const chosen = (await all.nth(1).locator('.cometchat-message-composer__mention-option-name').innerText()).trim();

    await page.keyboard.press('Enter');

    // Enter inserts the highlighted suggestion (not a new line or a sent message).
    await expect(input().locator('.cometchat-mentions')).toContainText(chosen.replace(/^@/, ''));
    await expect(suggestions()).toHaveCount(0);
  });

  // ==================== Send Message with Mention ====================

  test('sending message with mention works', async () => {
    await typeMentionQuery(`@${secondaryName.slice(0, 3)}`, secondaryName);
    await option(secondaryName).click();
    await expect(input().locator('.cometchat-mentions')).toHaveText(`@${secondaryName}`);
    const suffix = `check this ${uniqueTag()}`;
    await page.keyboard.type(` ${suffix}`);
    await page.keyboard.press('Enter');

    const sent = page
      .locator('cometchat-messages .cometchat-message-list__message')
      .filter({ hasText: suffix })
      .last();
    await expect(sent.locator('.cometchat-mentions')).toHaveText(`@${secondaryName}`, { timeout: 30_000 });
    await expect(input()).toHaveText('');
  });

  // ==================== Escape Closes Dropdown ====================

  test('pressing Escape closes mention dropdown', async () => {
    await typeMentionQuery('@', secondaryName);
    await page.keyboard.press('Escape');

    await expect(suggestions()).toHaveCount(0);
    // The typed text stays; nothing is inserted.
    await expect(input()).toHaveText('@');
    await expect(input().locator('.cometchat-mentions')).toHaveCount(0);
  });
});
