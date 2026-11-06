import { test, expect, Page, Locator } from '../fixtures/coverage';
import {
  loginToApp,
  openConversation,
  scrollToLatestMessage,
  conversationRow,
  getUserName,
  sendTextAs,
  createE2EGroup,
  PRIMARY_USER,
  SECONDARY_USER,
  THIRD_USER,
  uniqueTag,
  waitForModeration,
} from '../helpers';

/**
 * Accessibility: an axe scan of each primary screen, focus management in dialogs and menus,
 * and keyboard-only use of the chat. axe-core is injected from the project's own dependency.
 */

// ─── Helpers ─────────────────────────────────────────────────────────────────

type Violation = { id: string; impact: string; nodes: number; example: string };

/** Run axe (WCAG 2.1 A/AA rules) on `include` and return its critical and serious violations. */
async function axeScan(page: Page, include: string): Promise<Violation[]> {
  await page.addScriptTag({ path: require.resolve('axe-core') });
  return page.evaluate(async (selector) => {
    const axe = (window as unknown as { axe: any }).axe;
    const result = await axe.run(
      { include: [selector] },
      { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] }, resultTypes: ['violations'] }
    );
    return result.violations
      .filter((v: any) => v.impact === 'critical' || v.impact === 'serious')
      .map((v: any) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, example: v.nodes[0].target.join(' ').slice(0, 160) }));
  }, include);
}

/** True when the focused element is `locator` or inside it. */
const hasFocus = (locator: Locator) =>
  locator.evaluate((el) => el === document.activeElement || el.contains(document.activeElement));

/** Press Tab `times` times and return whether focus stayed inside `container` each time. */
async function tabStaysInside(page: Page, container: Locator, times = 6): Promise<boolean[]> {
  const inside: boolean[] = [];
  for (let i = 0; i < times; i++) {
    await page.keyboard.press('Tab');
    inside.push(await hasFocus(container));
  }
  return inside;
}

const messageRow = (page: Page, text: string) =>
  page.locator('cometchat-message-list .cometchat-message-list__message').filter({ hasText: text }).last();

async function openSecondaryChat(page: Page) {
  await loginToApp(page);
  await openConversation(page, await getUserName(SECONDARY_USER));
  await scrollToLatestMessage(page);
}

// ─── axe scans ───────────────────────────────────────────────────────────────

test.describe('axe scan', () => {
  // Safe to run in parallel: each scan only reads a screen and sends nothing.
  // Run with --workers=N to use it (the config default is 1 worker).
  test.describe.configure({ mode: 'parallel' });

  /**
   * Critical/serious WCAG violations each screen has today, by axe rule. A scan fails only on
   * a rule not listed here, so new violations are caught while these known ones are fixed.
   * Known UI Kit defects (to fix, then remove from the list):
   *   aria-required-children — the paginated list (role=listbox) contains non-option children;
   *                            in the chat, the menus (role=menu) contain non-menuitem children
   *   aria-allowed-attr      — message bubbles carry ARIA attributes their role doesn't allow
   *   aria-input-field-name  — the users and groups lists have no accessible name
   *   aria-required-parent   — call-log rows (role=option) are not inside a listbox
   *   nested-interactive     — call-log rows contain a focusable call button
   *   color-contrast         — avatar initials and secondary text are below 4.5:1
   */
  const SCREENS: { name: string; known: string[]; open: (page: Page) => Promise<string> }[] = [
    {
      name: 'conversations',
      known: ['aria-required-children', 'color-contrast'],
      open: async (page) => {
        await loginToApp(page);
        await expect(page.locator('cometchat-conversation-item').first()).toBeVisible({ timeout: 30_000 });
        return 'cometchat-conversations';
      },
    },
    {
      name: 'chat',
      known: ['aria-allowed-attr', 'aria-required-children', 'color-contrast'],
      open: async (page) => {
        await openSecondaryChat(page);
        return 'cometchat-messages';
      },
    },
    {
      name: 'users',
      known: ['aria-input-field-name', 'aria-required-children', 'color-contrast'],
      open: async (page) => {
        await loginToApp(page);
        await page.getByLabel('Navigation tabs').getByRole('tab', { name: 'Users' }).click();
        await expect(page.locator('cometchat-users cometchat-user-item').first()).toBeVisible({ timeout: 30_000 });
        return 'cometchat-users';
      },
    },
    {
      name: 'groups',
      known: ['aria-input-field-name', 'aria-required-children', 'color-contrast'],
      open: async (page) => {
        await loginToApp(page);
        await page.getByLabel('Navigation tabs').getByRole('tab', { name: 'Groups' }).click();
        await expect(page.locator('cometchat-groups cometchat-group-item').first()).toBeVisible({ timeout: 30_000 });
        return 'cometchat-groups';
      },
    },
    {
      name: 'call logs',
      known: ['aria-required-children', 'aria-required-parent', 'nested-interactive', 'color-contrast'],
      open: async (page) => {
        // The run's own user starts with no call history, and an empty list has no rows to
        // scan: make a call (cancelled while ringing) so the log has one.
        await openSecondaryChat(page);
        await page.locator('cometchat-message-header cometchat-call-buttons').getByRole('button', { name: 'Voice call' }).click();
        const outgoing = page.locator('cometchat-outgoing-call');
        await expect(outgoing.locator('.cometchat-outgoing-call__button').getByRole('button')).toBeVisible({ timeout: 15_000 });
        await outgoing.locator('.cometchat-outgoing-call__button').getByRole('button').click();
        await expect(outgoing).toBeHidden({ timeout: 15_000 });
        await page.getByLabel('Navigation tabs').getByRole('tab', { name: 'Calls' }).click();
        await expect(page.locator('.cometchat-call-logs__list-item').first()).toBeVisible({ timeout: 30_000 });
        return 'cometchat-call-logs';
      },
    },
    {
      name: 'user details',
      known: ['color-contrast'],
      open: async (page) => {
        await openSecondaryChat(page);
        await page.locator('cometchat-message-header .cometchat-message-header__info').first().click();
        await expect(page.locator('cometchat-user-details')).toBeVisible();
        return 'cometchat-user-details';
      },
    },
    {
      name: 'search',
      known: ['color-contrast'],
      open: async (page) => {
        await loginToApp(page);
        await page.locator('cometchat-conversations').getByRole('searchbox').click();
        await expect(page.locator('cometchat-search').first()).toBeVisible();
        return 'cometchat-search';
      },
    },
  ];

  for (const screen of SCREENS) {
    test(`the ${screen.name} screen has no new critical or serious violations`, async ({ page }, testInfo) => {
      const include = await screen.open(page);
      const violations = await axeScan(page, include);
      await testInfo.attach(`axe-${screen.name}.json`, {
        body: JSON.stringify(violations, null, 2),
        contentType: 'application/json',
      });

      const unexpected = violations.filter((v) => !screen.known.includes(v.id));
      expect(unexpected, 'violations not in the known list').toEqual([]);
    });
  }
});

// ─── Focus management ────────────────────────────────────────────────────────

test.describe('Focus management', () => {
  /** Send a message from the primary user, open the chat, and focus the message's "More options". */
  async function focusMoreOptions(page: Page) {
    const text = `Focus ${uniqueTag()}`;
    await sendTextAs(PRIMARY_USER, SECONDARY_USER, text);
    await openSecondaryChat(page);
    const row = messageRow(page, text);
    await expect(row).toBeVisible({ timeout: 30_000 });
    await row.locator('.cometchat-message-bubble__body').first().hover();
    const more = row.getByRole('button', { name: 'More options' });
    await more.focus();
    return { row, more };
  }

  test('the message menu opens with focus inside it, and Esc closes it and returns focus', async ({ page }) => {
    const { more } = await focusMoreOptions(page);

    await page.keyboard.press('Enter');
    // The outermost menu holding the options (the "more" list is a menu nested inside it).
    const menu = page.getByRole('menu').filter({ has: page.getByRole('menuitem', { name: 'Delete' }) }).first();
    await expect(page.getByRole('menuitem', { name: 'Delete' })).toBeVisible();
    await expect.poll(() => hasFocus(menu), { timeout: 5_000 }).toBe(true);

    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();
    await expect(more).toBeFocused();
  });

  test('the delete confirmation takes focus, keeps Tab inside, and closes on Esc', async ({ page }) => {
    const { more } = await focusMoreOptions(page);
    await page.keyboard.press('Enter');
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    const confirm = page.locator('cometchat-message-list cometchat-confirm-dialog');
    await expect(confirm).toContainText('Delete Message?');

    expect(await hasFocus(confirm), 'focus moved into the dialog').toBe(true);
    expect(await tabStaysInside(page, confirm)).not.toContain(false);
    await page.keyboard.press('Escape');
    await expect(confirm).toBeHidden();
    await expect(more).toBeAttached();
  });

  test('closing the delete confirmation returns focus to the message', async ({ page }) => {
    // Known UI Kit defect (ENG-40807): after the confirmation closes, focus falls to <body> instead of
    // going back to the message it was opened from. Expected to fail until fixed.
    test.fail();
    const { row } = await focusMoreOptions(page);
    await page.keyboard.press('Enter');
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    const confirm = page.locator('cometchat-message-list cometchat-confirm-dialog');
    await expect(confirm).toContainText('Delete Message?');

    await page.keyboard.press('Escape');
    await expect(confirm).toBeHidden();
    await expect.poll(() => hasFocus(row), { timeout: 5_000 }).toBe(true);
  });

  test('the create-group dialog takes focus, keeps Tab inside, and closes on Esc', async ({ page }) => {
    // Known UI Kit defect (ENG-40808): focus stays on the page behind the dialog, Tab walks out of it,
    // and Esc does not close it. Expected to fail until fixed.
    test.fail();
    await loginToApp(page);
    await page.getByLabel('Navigation tabs').getByRole('tab', { name: 'Groups' }).click();
    const create = page.locator('.cometchat-selector__create-button');
    await create.focus();
    await page.keyboard.press('Enter');
    const dialog = page.locator('.cometchat-create-group');
    await expect(dialog).toBeVisible();

    await expect.poll(() => hasFocus(dialog), { timeout: 5_000 }).toBe(true);
    expect(await tabStaysInside(page, dialog)).not.toContain(false);
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden({ timeout: 5_000 });
    await expect(create).toBeFocused();
  });

  test('the join-group password dialog takes focus, keeps Tab inside, and closes on Esc', async ({ page }) => {
    // Known UI Kit defect (ENG-40808): same as the create-group dialog. Expected to fail until fixed.
    test.fail();
    const runId = uniqueTag();
    const name = `E2E A11y Join ${runId}`;
    await createE2EGroup(`e2e-a11y-join-${runId}`, name, SECONDARY_USER, [], { type: 'password', password: 'secret' });
    await loginToApp(page);
    await page.getByLabel('Navigation tabs').getByRole('tab', { name: 'Groups' }).click();
    const groups = page.locator('cometchat-groups');
    const row = groups.locator('cometchat-group-item').filter({ hasText: name });
    await expect(groups.locator('cometchat-group-item').first()).toBeVisible({ timeout: 30_000 });
    await expect(async () => {
      await groups.getByRole('searchbox').fill(name);
      await expect(row).toBeVisible({ timeout: 3_000 });
    }).toPass({ timeout: 30_000 });
    await row.click();
    const dialog = page.getByRole('dialog', { name: 'Join Group' });
    await expect(dialog).toContainText(name);

    await expect.poll(() => hasFocus(dialog), { timeout: 5_000 }).toBe(true);
    expect(await tabStaysInside(page, dialog)).not.toContain(false);
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden({ timeout: 5_000 });
  });
});

// ─── Keyboard only ───────────────────────────────────────────────────────────

test.describe('Keyboard only', () => {
  const header = (page: Page) => page.locator('cometchat-message-header');

  /** Title of the conversation row that holds keyboard focus. */
  const focusedConversation = (page: Page) =>
    page.evaluate(() =>
      document.activeElement
        ?.closest('.cometchat-paginated-list__item')
        ?.querySelector('.cometchat-conversation-item__title-text')
        ?.textContent?.trim()
    );

  /** Log in and Tab from the chats search box into the conversation list. */
  async function tabIntoConversations(page: Page) {
    await loginToApp(page);
    await expect(conversationRow(page, await getUserName(SECONDARY_USER))).toBeVisible({ timeout: 30_000 });
    await page.locator('cometchat-conversations').getByRole('searchbox').focus();
    await page.keyboard.press('Tab');
    const name = await focusedConversation(page);
    expect(name, 'a conversation row has focus').toBeTruthy();
    return name!;
  }

  test('Tab reaches the conversation list, and Enter opens the focused conversation', async ({ page }) => {
    // Known UI Kit defect (ENG-40809): the row reached with Tab ignores Enter and Space — nothing opens.
    // Expected to fail until fixed.
    test.fail();
    const name = await tabIntoConversations(page);

    await page.keyboard.press('Enter');
    await expect(header(page)).toContainText(name, { timeout: 10_000 });
  });

  test('arrow keys move between conversations, and Enter opens the one that has focus @quarantine (ENG-40631)', async ({ page }) => {
    // @quarantine (ENG-40631): intermittent UI Kit defect. After ArrowDown then ArrowUp, focus is
    // shown on the first row but Enter sometimes opens the second: the list's selected index and
    // the focused row disagree. In CI it opened the wrong chat in one run and the right one in the
    // next, so it can't be test.fail.
    // The defect needs a second row to move to: a run's own user may otherwise have one chat.
    await sendTextAs(THIRD_USER, PRIMARY_USER, `Second chat ${uniqueTag()}`);
    await tabIntoConversations(page);
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowUp');
    const name = await focusedConversation(page);

    // The first activation of a row is sometimes ignored (ENG-39945), so press until a chat opens.
    await expect(async () => {
      await page.keyboard.press('Enter');
      await expect(header(page)).not.toBeEmpty({ timeout: 2_000 });
    }).toPass({ timeout: 15_000 });
    await expect(header(page)).toContainText(name!);
  });

  test('opening a chat puts focus in the composer', async ({ page }) => {
    await loginToApp(page);
    await openConversation(page, await getUserName(SECONDARY_USER));
    await expect(page.locator('cometchat-messages cometchat-message-composer [contenteditable="true"]').first()).toBeFocused();
  });

  test('in an open chat, a message can be sent and reacted to with the keyboard alone', async ({ page }) => {
    await openSecondaryChat(page);
    const composer = page.locator('cometchat-messages cometchat-message-composer [contenteditable="true"]').first();
    // Scrolling to the latest message clicks a button, so put focus back in the composer.
    await composer.focus();

    const text = `Keyboard only ${uniqueTag()}`;
    await page.keyboard.type(text);
    await page.keyboard.press('Enter');
    const row = messageRow(page, text);
    await expect(row).toBeVisible({ timeout: 15_000 });
    await expect(composer).toBeFocused();
    await expect(row.locator('.cometchat-receipts')).toHaveClass(/cometchat-receipts-(sent|delivered|read)/, { timeout: 15_000 });
    // The E2E app moderates messages, and the server refuses a reaction on one still under
    // review (403 ERR_MESSAGE_NO_ACCESS). Wait until moderation has passed it.
    await expect(row).toHaveAttribute('data-message-id', /^\d+$/);
    await waitForModeration((await row.getAttribute('data-message-id'))!);

    // Shift+Tab back from the composer into the newest message's actions, then to React.
    const react = row.getByRole('button', { name: 'React' }).or(row.locator('[aria-label="React"]')).first();
    for (let i = 0; i < 20 && !(await hasFocus(react)); i++) await page.keyboard.press('Shift+Tab');
    await expect(react).toBeFocused();
    await page.keyboard.press('Enter');

    // The picker opens on its search box; Tab to the first emoji and choose it.
    const firstEmoji = page.locator('.cometchat-emoji-keyboard__list-item').first();
    await expect(firstEmoji).toBeVisible();
    for (let i = 0; i < 5 && !(await hasFocus(firstEmoji)); i++) await page.keyboard.press('Tab');
    await expect(firstEmoji).toBeFocused();
    const emoji = (await firstEmoji.textContent())!.trim();
    await page.keyboard.press('Enter');

    await expect(firstEmoji).toBeHidden();
    await expect(row.locator('cometchat-reactions, .cometchat-reactions').first()).toContainText(emoji, { timeout: 15_000 });
  });
});
