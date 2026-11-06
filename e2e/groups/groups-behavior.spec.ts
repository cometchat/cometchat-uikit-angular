import { test, expect, Page } from '../fixtures/coverage';
import {
  loginToApp,
  openConversation,
  conversationRow,
  getUserName,
  createE2EGroup,
  getGroupOwner,
  getMemberScope,
  PRIMARY_USER,
  SECONDARY_USER,
  THIRD_USER,
  E2E_USER_UIDS,
  findGroupByName,
  deleteGroup,
  uniqueTag,
  expectNothingFor,
} from '../helpers';

/**
 * Groups: creating, joining, leaving and deleting groups, managing members, and what a
 * member's scope allows. Groups are created per test (tagged for teardown) so each test
 * starts from known roles. Every assertion waits on UI state.
 */

const header = (page: Page) => page.locator('cometchat-message-header');
const details = (page: Page) => page.locator('cometchat-group-details');

/** A unique group id and name for this test. */
function newGroup(label: string) {
  const runId = `${uniqueTag()}${Math.floor(Math.random() * 1000)}`;
  return { guid: `e2e-${label}-${runId}`, name: `E2E ${label} ${runId}` };
}

async function openGroupsTab(page: Page) {
  await page.getByLabel('Navigation tabs').getByRole('tab', { name: 'Groups' }).click();
  const groups = page.locator('cometchat-groups');
  await expect(groups.locator('.cometchat-list-item, cometchat-group-item').first()).toBeVisible({ timeout: 30_000 });
  return groups;
}

/** Search the Groups tab and return the matching row (or an empty locator). */
async function findGroupInList(page: Page, name: string) {
  const groups = await openGroupsTab(page);
  const row = groups.locator('cometchat-group-item').filter({ hasText: name });
  await groups.getByRole('searchbox').fill(name);
  return { groups, row };
}

/** Open the group details panel from the header. */
async function openDetails(page: Page) {
  await header(page).locator('.cometchat-message-header__info').first().click();
  await expect(details(page)).toBeVisible();
}

/** The member row for `name` inside group details. */
const memberRow = (page: Page, name: string) =>
  details(page).locator('cometchat-group-member-item').filter({ hasText: name });

/** Open a member's options menu and return the menu item names on offer. */
async function memberOptions(page: Page, name: string): Promise<string[]> {
  const row = memberRow(page, name);
  await expect(row).toBeVisible({ timeout: 15_000 });
  await row.hover();
  const more = row.getByRole('button', { name: 'More options' });
  // No options button at all means the viewer can't act on this member.
  if (!(await more.isVisible())) return [];
  await more.click();
  await expect(page.getByRole('menuitem').first()).toBeVisible();
  return (await page.getByRole('menuitem').allTextContents()).map((t) => t.trim());
}

// ─── Create ──────────────────────────────────────────────────────────────────

test.describe('Create', () => {
  async function openCreateDialog(page: Page) {
    await loginToApp(page);
    await openGroupsTab(page);
    // The "New Group" button sits in the Groups panel header, outside cometchat-groups.
    await page.locator('.cometchat-selector__create-button').click();
    const dialog = page.locator('.cometchat-create-group');
    await expect(dialog).toBeVisible();
    return dialog;
  }

  const SCENARIOS = [
    { type: 'Public', password: undefined },
    { type: 'Private', password: undefined },
    { type: 'Password', password: 'secret123' },
  ] as const;

  for (const { type, password } of SCENARIOS) {
    const kind = type.toLowerCase();
    test(`a ${kind} group: create it, land in its chat, send a message, and find it in Chats and Groups`, async ({
      page,
    }) => {
      const { name } = newGroup(kind);
      let guid: string | undefined;
      try {
        // 1. Fill in the form. Create stays disabled until it's complete.
        const dialog = await openCreateDialog(page);
        const create = dialog.getByRole('button', { name: 'Create Group' });
        await expect(create).toBeDisabled(); // no name yet
        await dialog.getByRole('radio', { name: type }).click();
        await dialog.getByPlaceholder('Enter the group name').fill(name);
        if (password) {
          await expect(create).toBeDisabled(); // password group, no password yet
          await dialog.getByPlaceholder('Enter a password').fill(password);
        }
        await expect(create).toBeEnabled();
        // The new chat's first message fetch; a message sent before it completes can be sent
        // but never shown (known UI Kit defect), so step 4 waits for it.
        const firstLoad = page.waitForResponse(
          (r) => r.request().method() === 'GET' && /\/groups\/[^/]+\/messages/.test(new URL(r.url()).pathname),
          { timeout: 30_000 }
        );
        await create.click();
        await expect(dialog).toBeHidden({ timeout: 15_000 });

        // 2. The new group opens: header with its name and one member, an empty list, a composer.
        await expect(header(page)).toContainText(name, { timeout: 15_000 });
        await expect(header(page)).toContainText(/\b1\s+Member\b/i);
        await expect(page.locator('cometchat-message-list')).toBeVisible();
        const composer = page.locator('cometchat-messages cometchat-message-composer [contenteditable="true"]').first();
        await expect(composer).toBeVisible();

        // 3. The backend has the group with the chosen type, owned by the creator.
        await expect.poll(async () => (await findGroupByName(name))?.type, { timeout: 15_000 }).toBe(kind);
        const group = (await findGroupByName(name))!;
        guid = group.guid;
        expect(group.owner).toBe(PRIMARY_USER);

        // 4. A message sent from the composer shows in the group's message list.
        await firstLoad;
        const text = `First message in ${name}`;
        await composer.click();
        await page.keyboard.type(text);
        await page.keyboard.press('Enter');
        await expect(
          page.locator('cometchat-message-list .cometchat-message-list__message').filter({ hasText: text })
        ).toBeVisible({ timeout: 15_000 });

        // 5. Chats lists the group with that message as its preview. (Creating from the Groups
        //    tab leaves that tab selected, so switch to Chats.)
        await page.getByLabel('Navigation tabs').getByRole('tab', { name: 'Chats' }).click();
        await expect(conversationRow(page, name)).toContainText(text, { timeout: 15_000 });

        // 6. Groups lists it with the matching type marker (none for public).
        const { row } = await findGroupInList(page, name);
        await expect(row).toBeVisible({ timeout: 15_000 });
        const marker = row.locator('.cometchat-group-item__type-indicator');
        if (kind === 'public') {
          await expect(marker).toHaveCount(0);
        } else {
          await expect(marker).toHaveAttribute('data-type', kind);
        }
      } finally {
        // Groups made through the UI carry no teardown tag, so remove this one here.
        guid ??= (await findGroupByName(name))?.guid;
        if (guid) await deleteGroup(guid);
      }
    });
  }

  test('the form starts on Public, and the password field shows only for the Password type', async ({ page }) => {
    await openCreateDialog(page);
    const dialog = page.getByRole('dialog', { name: 'New Group' });
    await expect(dialog).toBeVisible();
    const radio = (name: string) => dialog.getByRole('radio', { name });
    const passwordInput = dialog.getByPlaceholder('Enter a password');

    await expect(radio('Public')).toHaveAttribute('aria-checked', 'true');
    await expect(radio('Private')).toHaveAttribute('aria-checked', 'false');
    await expect(radio('Password')).toHaveAttribute('aria-checked', 'false');
    await expect(dialog.getByPlaceholder('Enter the group name')).toBeVisible();
    await expect(passwordInput).toBeHidden();

    await radio('Password').click();
    await expect(radio('Password')).toHaveAttribute('aria-checked', 'true');
    await expect(radio('Public')).toHaveAttribute('aria-checked', 'false');
    await expect(passwordInput).toBeVisible();
    await expect(passwordInput).toHaveAttribute('type', 'password');
    await dialog.getByRole('button', { name: 'Show password' }).click();
    await expect(passwordInput).toHaveAttribute('type', 'text');
    await dialog.getByRole('button', { name: 'Hide password' }).click();
    await expect(passwordInput).toHaveAttribute('type', 'password');

    await radio('Private').click();
    await expect(passwordInput).toBeHidden();
  });

  test('closing the dialog creates nothing', async ({ page }) => {
    const { name } = newGroup('closed');
    const dialog = await openCreateDialog(page);
    await dialog.getByPlaceholder('Enter the group name').fill(name);
    await dialog.getByRole('button', { name: 'Close' }).click();

    await expect(dialog).toBeHidden();
    await expectNothingFor(page, 3_000, 'a stray create request to land, if one was sent');
    expect(await findGroupByName(name)).toBeNull();
  });
});

// ─── Join ────────────────────────────────────────────────────────────────────

test.describe('Join', () => {
  test('clicking a public group you are not in joins it and opens the chat @smoke', async ({ page }) => {
    const group = newGroup('join-public');
    await createE2EGroup(group.guid, group.name, SECONDARY_USER);
    await loginToApp(page);

    const { row } = await findGroupInList(page, group.name);
    await row.click();

    await expect(header(page)).toContainText(group.name, { timeout: 15_000 });
    await expect.poll(() => getMemberScope(group.guid, PRIMARY_USER)).toBe('participant');
  });

  /** Open the join dialog for a password group the primary user isn't in. */
  async function openPasswordGroupJoin(page: Page) {
    const group = newGroup('join-password');
    await createE2EGroup(group.guid, group.name, SECONDARY_USER, [], { type: 'password', password: 'right-pass' });
    await loginToApp(page);
    const { row } = await findGroupInList(page, group.name);
    await row.click();
    // The dialog element itself (role=dialog, "Join Group"); its host element has no box of its own.
    const join = page.getByRole('dialog', { name: 'Join Group' });
    await expect(join).toContainText(group.name);
    return { group, join };
  }

  test('a password group asks for the password: a wrong one is rejected, the right one joins', async ({ page }) => {
    const { group, join } = await openPasswordGroupJoin(page);

    await join.getByPlaceholder('Enter your password').fill('wrong-pass');
    await join.getByRole('button', { name: 'Continue' }).click();
    await expect(join).toBeVisible();
    expect(await getMemberScope(group.guid, PRIMARY_USER)).toBeNull();

    await join.getByPlaceholder('Enter your password').fill('right-pass');
    await join.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByText('Joined group successfully.').first()).toBeVisible({ timeout: 15_000 });
    await expect(join).toBeHidden();
    await expect.poll(() => getMemberScope(group.guid, PRIMARY_USER)).toBe('participant');
  });

  test('joining a password group opens its chat, like joining a public group does', async ({ page }) => {
    // Known sample-app defect (ENG-40816): after a successful password join the dialog closes and the
    // "Joined group successfully." toast shows, but the chat never opens (a public join does
    // open it). CometChatJoinGroupComponent.onSubmit calls setSelectedGroup(joined) and then
    // setActiveTab('groups'), which likely clears the selection. Expected to fail until fixed.
    test.fail();
    const { group, join } = await openPasswordGroupJoin(page);

    await join.getByPlaceholder('Enter your password').fill('right-pass');
    await join.getByRole('button', { name: 'Continue' }).click();

    await expect(header(page)).toContainText(group.name, { timeout: 10_000 });
  });

  test('a private group you are not in is not listed', async ({ page }) => {
    const hidden = newGroup('private-hidden');
    const visible = newGroup('public-control');
    await createE2EGroup(hidden.guid, hidden.name, SECONDARY_USER, [], { type: 'private' });
    await createE2EGroup(visible.guid, visible.name, SECONDARY_USER);
    await loginToApp(page);

    const control = await findGroupInList(page, visible.name);
    await expect(control.row).toBeVisible({ timeout: 15_000 }); // the search works…
    const { row } = await findGroupInList(page, hidden.name);
    await expect(row).toHaveCount(0); // …and the private group is not offered
  });
});

// ─── Leave and delete ────────────────────────────────────────────────────────

test.describe('Leave and delete', () => {
  test('a member can leave a group, and it closes and drops out of Chats', async ({ page }) => {
    const group = newGroup('leave');
    await createE2EGroup(group.guid, group.name, SECONDARY_USER, [PRIMARY_USER]);
    await loginToApp(page);
    await openConversation(page, group.name);

    await openDetails(page);
    await details(page).getByText('Leave Group').click();
    const confirm = page.getByRole('dialog').filter({ hasText: 'Are you sure you want to leave this group?' }).last();
    await confirm.getByRole('button', { name: /leave/i }).click();

    // The chat closes: no header for this group remains.
    await expect(header(page).filter({ hasText: group.name })).toHaveCount(0, { timeout: 15_000 });
    await expect(conversationRow(page, group.name)).toHaveCount(0, { timeout: 15_000 });
    await expect.poll(() => getMemberScope(group.guid, PRIMARY_USER)).toBeNull();
  });

  test('the owner must transfer ownership before leaving', async ({ page }) => {
    const group = newGroup('transfer');
    const secondaryName = await getUserName(SECONDARY_USER);
    await createE2EGroup(group.guid, group.name, PRIMARY_USER, [SECONDARY_USER]);
    await loginToApp(page);
    await openConversation(page, group.name);

    await openDetails(page);
    await details(page).getByText('Leave Group').click();
    const transfer = page.locator('cometchat-transfer-ownership');
    await expect(page.getByText('You must transfer ownership before leaving the group.')).toBeVisible();
    await page.getByRole('button', { name: 'Transfer Ownership' }).first().click();
    await expect(transfer).toBeVisible();
    await transfer
      .locator('cometchat-group-member-item')
      .filter({ hasText: secondaryName })
      .locator('.cometchat-radio-button__label')
      .click();
    await transfer.getByRole('button', { name: 'Transfer Ownership' }).click();

    await expect.poll(() => getGroupOwner(group.guid), { timeout: 15_000 }).toBe(SECONDARY_USER);
  });

  test('the owner can delete the group', async ({ page }) => {
    const group = newGroup('delete');
    await createE2EGroup(group.guid, group.name, PRIMARY_USER, [SECONDARY_USER]);
    await loginToApp(page);
    await openConversation(page, group.name);

    await openDetails(page);
    await details(page).getByText('Delete', { exact: true }).last().click();
    const confirm = page.getByRole('dialog').filter({ hasText: 'Are you sure you want to delete this group?' }).last();
    await confirm.getByRole('button', { name: 'Delete' }).click();

    await expect(conversationRow(page, group.name)).toHaveCount(0, { timeout: 15_000 });
    await expect.poll(() => getGroupOwner(group.guid), { timeout: 15_000 }).toBeNull();
  });
});

// ─── Manage members ──────────────────────────────────────────────────────────

test.describe('Manage members', () => {
  /** A group the primary user owns, with the secondary and third users as participants. */
  async function openOwnedGroup(page: Page) {
    const group = newGroup('members');
    await createE2EGroup(group.guid, group.name, PRIMARY_USER, [SECONDARY_USER, THIRD_USER]);
    await loginToApp(page);
    await openConversation(page, group.name);
    await openDetails(page);
    return group;
  }

  test('adding a member puts them in the member list @smoke', async ({ page }) => {
    const group = await openOwnedGroup(page);
    const newMember = E2E_USER_UIDS[4];
    const newName = await getUserName(newMember);

    await details(page).getByText('Add Members').click();
    const add = page.locator('cometchat-add-members');
    const users = add.locator('cometchat-users');
    await expect(users.locator('cometchat-user-item').first()).toBeVisible({ timeout: 30_000 });
    await expect(async () => {
      await users.getByRole('searchbox').fill(newName);
      await expect(users.locator('cometchat-user-item').filter({ hasText: newName })).toBeVisible({ timeout: 3_000 });
    }).toPass({ timeout: 30_000 });
    await users.locator('cometchat-user-item').filter({ hasText: newName }).click();
    await add.getByRole('button', { name: 'Add Members' }).click();

    await expect.poll(() => getMemberScope(group.guid, newMember), { timeout: 15_000 }).toBe('participant');
    await expect(memberRow(page, newName)).toBeVisible({ timeout: 15_000 });
  });

  test('kicking a member removes them from the group', async ({ page }) => {
    const group = await openOwnedGroup(page);
    const name = await getUserName(SECONDARY_USER);

    expect(await memberOptions(page, name)).toEqual(expect.arrayContaining(['Kick', 'Ban', 'Change Scope']));
    await page.getByRole('menuitem', { name: 'Kick' }).click();
    const confirm = page.getByRole('dialog').last();
    if (await confirm.getByRole('button', { name: /kick|confirm|remove/i }).isVisible()) {
      await confirm.getByRole('button', { name: /kick|confirm|remove/i }).click();
    }

    await expect(memberRow(page, name)).toHaveCount(0, { timeout: 15_000 });
    await expect.poll(() => getMemberScope(group.guid, SECONDARY_USER)).toBeNull();
  });

  test('a banned member moves to Banned Members, and unbanning removes them from it', async ({ page }) => {
    await openOwnedGroup(page);
    const name = await getUserName(SECONDARY_USER);

    await memberOptions(page, name);
    await page.getByRole('menuitem', { name: 'Ban' }).click();
    const confirm = page.getByRole('dialog').last();
    if (await confirm.getByRole('button', { name: /ban|confirm/i }).isVisible()) {
      await confirm.getByRole('button', { name: /ban|confirm/i }).click();
    }
    await expect(memberRow(page, name)).toHaveCount(0, { timeout: 15_000 });

    await details(page).getByRole('tab', { name: 'Banned Members' }).click();
    const banned = details(page).locator('cometchat-banned-members, .cometchat-group-details__banned').first();
    const bannedRow = page.locator('cometchat-group-details').getByText(name);
    await expect(bannedRow).toBeVisible({ timeout: 15_000 });
    await bannedRow.hover();
    await page.locator('cometchat-group-details').getByRole('button', { name: /unban/i }).first().click();
    await expect(page.locator('cometchat-group-details').getByText(name)).toHaveCount(0, { timeout: 15_000 });
    void banned;
  });

  test('changing a member to moderator updates their scope', async ({ page }) => {
    const group = await openOwnedGroup(page);
    const name = await getUserName(SECONDARY_USER);

    await memberOptions(page, name);
    await page.getByRole('menuitem', { name: 'Change Scope' }).click();
    const dialog = page.locator('.cometchat-change-scope');
    await page
      .locator('.cometchat-change-scope__list-item')
      .filter({ hasText: 'Moderator' })
      .locator('.cometchat-radio-button__label')
      .click();
    await dialog.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => getMemberScope(group.guid, SECONDARY_USER), { timeout: 15_000 }).toBe('moderator');
    await expect(memberRow(page, name)).toContainText('Moderator');
  });
});

// ─── Permissions ─────────────────────────────────────────────────────────────

test.describe('Permissions', () => {
  test('a participant cannot kick, ban or change the scope of other members', async ({ page }) => {
    const group = newGroup('perm-participant');
    await createE2EGroup(group.guid, group.name, SECONDARY_USER, [PRIMARY_USER, THIRD_USER]);
    await loginToApp(page);
    await openConversation(page, group.name);
    await openDetails(page);

    for (const uid of [SECONDARY_USER, THIRD_USER]) {
      const options = await memberOptions(page, await getUserName(uid));
      for (const action of ['Kick', 'Ban', 'Change Scope']) expect(options).not.toContain(action);
      // Close a menu only if one opened; Escape with nothing open closes the details panel.
      if (options.length) await page.keyboard.press('Escape');
    }
  });

  test('an admin can manage participants but not the owner', async ({ page }) => {
    const group = newGroup('perm-admin');
    await createE2EGroup(group.guid, group.name, SECONDARY_USER, [PRIMARY_USER, THIRD_USER], {
      admins: [PRIMARY_USER],
    });
    await loginToApp(page);
    await openConversation(page, group.name);
    await openDetails(page);

    expect(await memberOptions(page, await getUserName(THIRD_USER))).toEqual(
      expect.arrayContaining(['Kick', 'Ban', 'Change Scope'])
    );
    await page.keyboard.press('Escape');
    const ownerOptions = await memberOptions(page, await getUserName(SECONDARY_USER));
    for (const action of ['Kick', 'Ban', 'Change Scope']) expect(ownerOptions).not.toContain(action);
  });
});
