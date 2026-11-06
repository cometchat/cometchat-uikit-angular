import { test, expect, Page } from '../fixtures/coverage';
import {
  loginToApp,
  openConversation,
  conversationRow,
  getUserName,
  createE2EGroup,
  getMemberScope,
  createE2EUser,
  sendTextAs,
  addGroupMembers,
  PRIMARY_USER,
  SECONDARY_USER,
  uniqueTag,
  expectNothingFor,
} from '../helpers';

/**
 * The AI agent: finding it in the user list, the 1:1 AI assistant chat, its conversation
 * in Chats, and the agent as a group member.
 *
 * Needs an agent user (role "@agentic") in the app, set as E2E_AGENT_UID in .env. Replies
 * come from a live model, and the reply text the server stores sometimes misses a fragment of
 * what was asked for ("QXMVNC8TQ" for "QXMVNC8TQ3", "glacier fal cobalt" for "glacier falcon
 * cobalt"). So tests don't match the reply's wording: a 1:1 test starts a fresh chat, where the
 * only reply is the one to its prompt, and a conversation is recognised by the prompt (our own
 * text, stored exactly).
 *
 * The sample app's user pickers (Users tab, New Chat, Add Members) list only role "default",
 * as the platform leaves "@agentic" users out unless the app asks for that role. So these
 * tests reach the agent the way the shipped sample app offers it: from its conversation in
 * Chats, which a message over REST creates.
 */

const AGENT_UID = process.env['E2E_AGENT_UID'] ?? '';
const REPLY_TIMEOUT = 90_000;

test.beforeAll(async () => {
  expect(AGENT_UID, 'Set E2E_AGENT_UID in .env to the agent user\'s UID').not.toBe('');
  await startAgentConversation();
});
// Live model replies are occasionally slow.
test.describe.configure({ retries: 1, timeout: 180_000 });

const ECHO_WORDS = [
  'amber', 'birch', 'cobalt', 'delta', 'ember', 'falcon', 'garnet', 'harbor', 'indigo', 'juniper',
  'kestrel', 'lantern', 'meadow', 'nickel', 'orchid', 'pepper', 'quartz', 'raven', 'saffron', 'timber',
  'umber', 'violet', 'willow', 'yarrow', 'zephyr', 'acorn', 'basalt', 'cedar', 'dune', 'fjord',
  'glacier', 'hazel', 'iris', 'jasper', 'kelp', 'lichen', 'maple', 'nectar', 'onyx', 'pebble',
];

/** Three unique words for one prompt, and the prompt asking the agent to echo them. */
function echoPrompt() {
  const pick = () => ECHO_WORDS[Math.floor(Math.random() * ECHO_WORDS.length)];
  let words = [pick(), pick(), pick()];
  while (new Set(words).size < 3) words = [pick(), pick(), pick()];
  const code = words.join(' ');
  return { code, prompt: `Reply with exactly these three words and nothing else: ${code}` };
}

/** Matches the echoed words, in any case and with any punctuation between them. */
function echoed(code: string): RegExp {
  return new RegExp(code.split(' ').join('\\W+'), 'i');
}

const agentChat = (page: Page) => page.locator('cometchat-ai-assistant-chat');
const agentComposer = (page: Page) => agentChat(page).locator('cometchat-message-composer [contenteditable="true"]').first();
const agentReplies = (page: Page) => agentChat(page).locator('cometchat-ai-assistant-message-bubble');

/** Make sure `uid` has a conversation with the agent, so the agent's row shows in Chats. */
async function startAgentConversation(uid: string = PRIMARY_USER) {
  await sendTextAs(uid, AGENT_UID, `Hello agent ${uniqueTag()}`);
}

/** From Chats, open the agent's conversation; it opens as the AI assistant chat. */
async function openAgentFromChats(page: Page, agentName: string) {
  // openConversation re-clicks until the header names the agent (an early click can be dropped).
  await openConversation(page, agentName);
  await expect(agentChat(page).locator('cometchat-message-header')).toContainText(agentName);
}

/** Log in, open the agent from Chats and start a fresh chat. */
async function openAgentChat(page: Page, agentName: string) {
  await loginToApp(page);
  await openAgentFromChats(page, agentName);
  await agentChat(page).getByRole('button', { name: 'New Chat' }).click();
  await expect(agentChat(page)).toContainText('How can I help you today?', { timeout: 15_000 });
}

/** Send `prompt` in a fresh agent chat and wait for the agent's reply (the chat's only one). */
async function askAgent(page: Page, prompt: string) {
  await expect(agentReplies(page)).toHaveCount(0);
  await agentComposer(page).click();
  await page.keyboard.type(prompt);
  await page.keyboard.press('Enter');
  const reply = agentReplies(page).first();
  await expect(reply).toHaveText(/\S/, { timeout: REPLY_TIMEOUT });
  return reply;
}

// ─── Agent in the user list ──────────────────────────────────────────────────

test.describe('Agent in the user list', () => {
  test('Chats lists the agent, and search finds it', async ({ page }) => {
    const agentName = await getUserName(AGENT_UID);
    await loginToApp(page);
    await expect(conversationRow(page, agentName)).toBeVisible({ timeout: 30_000 });

    await page.locator('cometchat-conversations').getByRole('searchbox').click();
    const search = page.locator('cometchat-search').first();
    await expect(async () => {
      await search.getByRole('searchbox').fill(agentName.slice(0, 6));
      await expect(search.locator('.cometchat-search__results')).toContainText(agentName, { timeout: 5_000 });
    }).toPass({ timeout: 30_000 });
  });

  test('opening the agent shows the AI assistant chat, with no call buttons', async ({ page }) => {
    const agentName = await getUserName(AGENT_UID);
    await openAgentChat(page, agentName);

    await expect(page.locator('cometchat-messages .cometchat-messages')).toHaveCount(0);
    await expect(agentComposer(page)).toBeVisible();
    await expect(agentChat(page).getByRole('button', { name: /voice call|video call/i })).toHaveCount(0);
  });
});

// ─── Agent chat (1:1) ────────────────────────────────────────────────────────

test.describe('Agent chat', () => {
  test('a question gets a reply from the agent, with a copy button', async ({ page }) => {
    const agentName = await getUserName(AGENT_UID);
    await openAgentChat(page, agentName);
    const { prompt } = echoPrompt();

    const reply = await askAgent(page, prompt);
    await expect(agentChat(page).locator('cometchat-message-list')).toContainText(prompt);
    await expect(page.getByRole('button', { name: 'Copy message' }).last()).toBeVisible();
    await expect(reply).toBeVisible();
  });

  test('New Chat clears the conversation and shows the greeting @quarantine (ENG-40619)', async ({ page }) => {
    // @quarantine (ENG-40619): intermittent UI Kit defect — the agent's reply is on the server
    // (and the prompt shows "Message read"), but the open AI assistant chat never renders it.
    // Failed its first attempt in the full run, so it can't be test.fail.
    const agentName = await getUserName(AGENT_UID);
    await openAgentChat(page, agentName);
    const { prompt } = echoPrompt();
    await askAgent(page, prompt);

    await agentChat(page).getByRole('button', { name: 'New Chat' }).click();
    await expect(agentChat(page)).toContainText('How can I help you today?');
    await expect(agentReplies(page)).toHaveCount(0);
  });

  test('chat history lists the conversation, and picking it reopens it @quarantine (ENG-40619)', async ({ page }) => {
    // @quarantine (ENG-40619): intermittent UI Kit defect — the agent's reply is on the server about 4s after
    // the prompt (REST lists it), but the open AI assistant chat never renders it. Failed 3 of 6
    // attempts, retries included, so it can't be test.fail.
    const agentName = await getUserName(AGENT_UID);
    await openAgentChat(page, agentName);
    const { prompt } = echoPrompt();
    await askAgent(page, prompt);
    await agentChat(page).getByRole('button', { name: 'New Chat' }).click();
    await expect(agentReplies(page)).toHaveCount(0);

    await agentChat(page).getByRole('button', { name: 'chat history' }).click();
    const item = page.locator('.cometchat-ai-assistant-chat-history__item').filter({ hasText: prompt });
    await expect(item).toBeVisible({ timeout: 15_000 });
    await item.click();
    await expect(agentChat(page).locator('cometchat-message-list')).toContainText(prompt, { timeout: 15_000 });
    await expect(agentReplies(page).first()).toHaveText(/\S/, { timeout: 15_000 });
  });

  test('a user with no earlier agent chat sees the greeting, not a loading skeleton @quarantine (ENG-40832)', async ({ page }) => {
    // @quarantine (ENG-40832): the committed sample app opens an agent only from an existing conversation,
    // so the agent has to write first, and whether the server returns that first message to
    // the receiver varies (see the first-message note in full-journey-extended 42.1). When it
    // returns nothing, the chat stays on its loading skeleton instead of the greeting (the UI Kit
    // defect this test is for); when it returns the message, the chat correctly shows it.
    const agentName = await getUserName(AGENT_UID);
    // A new user who has never asked the agent anything. (Named "E2E …" so it sorts among the
    // other test users in the Users list that other specs read.) The agent writes first, which puts
    // its conversation in the user's Chats (the only way the sample app opens an agent).
    const newbie = { uid: `e2e-agentnew-${uniqueTag()}`, name: `E2E Agent Newbie ${uniqueTag()}` };
    await createE2EUser(newbie.uid, newbie.name);
    await sendTextAs(AGENT_UID, newbie.uid, `Hi there ${uniqueTag()}`);
    await loginToApp(page, { userUid: newbie.uid });
    await openAgentFromChats(page, agentName);
    await expect(agentChat(page)).toContainText('How can I help you today?', { timeout: 20_000 });
  });
});

// ─── Agent conversation in Chats ─────────────────────────────────────────────

test.describe('Agent conversation in Chats', () => {
  test('reopening the agent from Chats loads the last conversation @quarantine (ENG-40619)', async ({ page }) => {
    // @quarantine (ENG-40619): intermittent UI Kit defect — the agent's reply is on the server
    // (and the prompt shows "Message read"), but the open AI assistant chat never renders it.
    // Failed its first attempt in the full run, so it can't be test.fail.
    const agentName = await getUserName(AGENT_UID);
    await openAgentChat(page, agentName);
    const { prompt } = echoPrompt();
    await askAgent(page, prompt);

    await page.getByLabel('Navigation tabs').getByRole('tab', { name: 'Chats' }).click();
    await conversationRow(page, agentName).click();
    await expect(agentChat(page).locator('cometchat-message-list')).toContainText(prompt, { timeout: 30_000 });
    await expect(agentReplies(page).first()).toHaveText(/\S/, { timeout: 30_000 });
  });

  test("the agent's row in Chats previews the last message", async ({ page }) => {
    // Known UI Kit defect (ENG-40811): the row keeps showing "Click to start conversation" after the
    // user and agent have exchanged messages. Expected to fail until fixed.
    test.fail();
    const agentName = await getUserName(AGENT_UID);
    await openAgentChat(page, agentName);
    const { prompt } = echoPrompt();
    const reply = await askAgent(page, prompt);
    const replyText = (await reply.innerText()).trim();

    await page.getByLabel('Navigation tabs').getByRole('tab', { name: 'Chats' }).click();
    const row = conversationRow(page, agentName);
    await expect(row).toBeVisible({ timeout: 15_000 });
    await expect(row.locator('.cometchat-conversation-item__subtitle')).toContainText(replyText.slice(0, 20), {
      timeout: 15_000,
    });
  });
});

// ─── Agent in a group ────────────────────────────────────────────────────────

test.describe('Agent in a group', () => {
  /** A unique group id and name for this test. */
  function newGroup(label: string) {
    const runId = `${uniqueTag()}${Math.floor(Math.random() * 1000)}`;
    return { guid: `e2e-agent-${label}-${runId}`, name: `E2E Agent ${label} ${runId}` };
  }

  const groupMessages = (page: Page) => page.locator('cometchat-messages cometchat-message-list');
  const groupComposer = (page: Page) => page.locator('cometchat-messages cometchat-message-composer [contenteditable="true"]').first();
  /** The row of the agent's reply: in these groups the agent replies once, to the one prompt. */
  const agentReplyRow = (page: Page) =>
    groupMessages(page)
      .locator('.cometchat-message-list__message')
      .filter({ has: page.locator('cometchat-ai-assistant-message-bubble') })
      .first();

  /**
   * Open the group and wait for its first load to finish (the "added <agent>" action shows),
   * so a message typed next isn't sent while the list is still loading.
   */
  async function openAgentGroup(page: Page, groupName: string, agentName: string) {
    await openConversation(page, groupName);
    await expect(groupMessages(page)).toContainText(`added ${agentName}`, { timeout: 15_000 });
  }

  test('an agent added to a group is listed among its members', async ({ page }) => {
    // The sample app's Add Members picker lists only role "default" users, so the agent is
    // added over REST, as an app that lists agents would add it.
    const agentName = await getUserName(AGENT_UID);
    const group = newGroup('add');
    await createE2EGroup(group.guid, group.name, PRIMARY_USER, [SECONDARY_USER]);
    await addGroupMembers(group.guid, [AGENT_UID]);
    expect(await getMemberScope(group.guid, AGENT_UID)).toBe('participant');
    await loginToApp(page);
    await openAgentGroup(page, group.name, agentName);

    await page.locator('cometchat-message-header .cometchat-message-header__info').first().click();
    const details = page.locator('cometchat-group-details');
    await expect(details).toBeVisible();
    await expect(details.locator('cometchat-group-member-item').filter({ hasText: agentName })).toBeVisible({
      timeout: 15_000,
    });
  });

  test('with only one person and the agent, the agent replies without an @mention', async ({ page }) => {
    const agentName = await getUserName(AGENT_UID);
    const group = newGroup('solo');
    await createE2EGroup(group.guid, group.name, PRIMARY_USER, [AGENT_UID]);
    await loginToApp(page);
    await openAgentGroup(page, group.name, agentName);
    const { prompt } = echoPrompt();

    await groupComposer(page).click();
    await page.keyboard.type(prompt);
    await page.keyboard.press('Enter');

    const row = agentReplyRow(page);
    await expect(row).toBeVisible({ timeout: REPLY_TIMEOUT });
    // Shown like any other member's message: incoming, with the agent's name and avatar.
    await expect(row.locator('.cometchat-message-bubble-incoming')).toBeVisible();
    await expect(row.locator('.cometchat-message-bubble__sender-name')).toContainText(agentName);
    await expect(row.locator('.cometchat-message-bubble__leading-view cometchat-avatar')).toBeVisible();
    // In a group the reply has no inline copy button (that's only in the 1:1 agent chat).
    await expect(row.getByRole('button', { name: 'Copy message' })).toHaveCount(0);

    // Chats previews the agent's reply with its name.
    await expect(conversationRow(page, group.name).locator('.cometchat-conversation-item__subtitle')).toContainText(
      `${agentName}:`,
      { timeout: 15_000 }
    );
  });

  test("an agent's reply in a group offers only Copy in its menu", async ({ page }) => {
    const agentName = await getUserName(AGENT_UID);
    const group = newGroup('menu');
    await createE2EGroup(group.guid, group.name, PRIMARY_USER, [AGENT_UID]);
    await loginToApp(page);
    await openAgentGroup(page, group.name, agentName);
    const { prompt } = echoPrompt();
    await groupComposer(page).click();
    await page.keyboard.type(prompt);
    await page.keyboard.press('Enter');
    const row = agentReplyRow(page);
    await expect(row).toBeVisible({ timeout: REPLY_TIMEOUT });

    // With a single option the menu shows it inline, with no "More options" overflow.
    await row.locator('.cometchat-message-bubble__body').first().hover();
    const menu = row.getByRole('menu', { name: 'Context menu' });
    await expect(menu.getByRole('menuitem').first()).toBeVisible();
    await expect(row.getByRole('button', { name: 'More options' })).toHaveCount(0);
    // The option is an icon button named by its aria-label.
    await expect(menu.getByRole('menuitem')).toHaveCount(1);
    await expect(menu.getByRole('menuitem', { name: 'Copy' })).toBeVisible();
  });

  test('in a bigger group, the agent stays quiet until @mentioned, then replies', async ({ page }) => {
    const agentName = await getUserName(AGENT_UID);
    const group = newGroup('squad');
    await createE2EGroup(group.guid, group.name, PRIMARY_USER, [SECONDARY_USER, AGENT_UID]);
    await loginToApp(page);
    await openAgentGroup(page, group.name, agentName);

    // Without a mention: no reply.
    const quiet = echoPrompt();
    await groupComposer(page).click();
    await page.keyboard.type(quiet.prompt);
    await page.keyboard.press('Enter');
    await expect(groupMessages(page)).toContainText(quiet.prompt);
    await expectNothingFor(page, 20_000, 'a reply to have arrived, if one were coming');
    await expect(groupMessages(page).locator('cometchat-ai-assistant-message-bubble')).toHaveCount(0);

    // With a mention: a reply.
    const mentioned = echoPrompt();
    await groupComposer(page).click();
    // Search with the agent's first word (a space ends the mention search); the option is
    // then picked by the agent's full name.
    await page.keyboard.type(`@${agentName.split(' ')[0]}`);
    await page.locator('.cometchat-message-composer__mention-option').filter({ hasText: agentName }).click();
    await page.keyboard.type(` ${mentioned.prompt}`);
    await page.keyboard.press('Enter');
    // The agent answers the mention as a reply quoting it. Match the reply by that quote: the
    // live model sometimes echoes the earlier, unmentioned code instead, as both are in context.
    const replyToMention = groupMessages(page)
      .locator('.cometchat-message-list__message')
      .filter({ has: page.locator('cometchat-ai-assistant-message-bubble') })
      .filter({ hasText: echoed(mentioned.code) });
    await expect(replyToMention).toBeVisible({ timeout: REPLY_TIMEOUT });
  });
});
