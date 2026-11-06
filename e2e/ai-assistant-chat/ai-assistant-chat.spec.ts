import { test, expect, Page } from '../fixtures/coverage';
import { loginToApp, openConversation, getUserName, sendTextAs, waitForAnswerFrom, PRIMARY_USER, uniqueTag } from '../helpers';

/**
 * E2E Tests — CometChatAIAssistantChat (Angular)
 *
 * The AI assistant chat the sample app opens for an AI agent (role "@agentic", E2E_AGENT_UID
 * in .env). The sample app reaches the agent from its conversation in Chats, which a message
 * over REST creates. Each test starts a fresh chat ("New Chat"), so the only replies are to its
 * own prompts. Replies come from a live model: tests check that a reply arrives and how it
 * renders, not its wording.
 */

const AGENT_UID = process.env['E2E_AGENT_UID'] ?? '';
const REPLY_TIMEOUT = 90_000;

const chat = (page: Page) => page.locator('cometchat-ai-assistant-chat');
const composer = (page: Page) => chat(page).locator('cometchat-message-composer [contenteditable="true"]').first();
const replies = (page: Page) => chat(page).locator('cometchat-ai-assistant-message-bubble');

/** Log in, open the agent from Chats and start a fresh chat. */
async function openFreshAgentChat(page: Page) {
  const agentName = await getUserName(AGENT_UID);
  await loginToApp(page);
  // openConversation re-clicks until the header names the agent (an early click can be dropped).
  await openConversation(page, agentName);
  await expect(chat(page).locator('cometchat-message-header')).toContainText(agentName);
  // The chat first opens the agent's last conversation. Clicking New Chat while that is still
  // loading can leave the new chat deaf to the agent's live replies (a UI Kit race, not yet
  // fixed), so wait for it to show, as a person would before starting a new chat.
  await expect(chat(page).getByRole('log').getByRole('article').first()).toBeVisible({ timeout: 20_000 });
  await chat(page).getByRole('button', { name: 'New Chat' }).click();
  await expect(chat(page)).toContainText('How can I help you today?', { timeout: 15_000 });
  await expect(replies(page)).toHaveCount(0);
}

/** Type and send a prompt in the open agent chat. */
async function send(page: Page, prompt: string) {
  await composer(page).click();
  await page.keyboard.type(prompt);
  await page.keyboard.press('Enter');
}

/** Wait until the agent has given `count` non-empty replies; returns the latest. */
async function waitForReplies(page: Page, count: number) {
  await expect(replies(page)).toHaveCount(count, { timeout: REPLY_TIMEOUT });
  const latest = replies(page).nth(count - 1);
  await expect(latest).toHaveText(/\S/, { timeout: REPLY_TIMEOUT });
  return latest;
}

test.describe('CometChatAIAssistantChat', () => {
  // Live model replies are occasionally slow.
  test.describe.configure({ retries: 1, timeout: 240_000 });

  test.beforeAll(async () => {
    expect(AGENT_UID, "Set E2E_AGENT_UID in .env to the agent user's UID").not.toBe('');
    // The agent's conversation must exist for its row to show in Chats.
    const hello = await sendTextAs(PRIMARY_USER, AGENT_UID, `Hello agent ${uniqueTag()}`);
    // The agent answers this message too. An open chat shows the agent's live replies, so an
    // answer still on its way would land in the first test's fresh chat and pass for its reply.
    await waitForAnswerFrom(PRIMARY_USER, AGENT_UID, hello);
  });

  // ==================== Rendering ====================

  test('AI assistant chat component renders', async ({ page }) => {
    await openFreshAgentChat(page);
    await expect(chat(page)).toBeVisible();
    // It replaces the regular chat view.
    await expect(page.locator('cometchat-messages .cometchat-messages')).toHaveCount(0);
  });

  test('AI assistant renders with header, message list, and composer', async ({ page }) => {
    await openFreshAgentChat(page);
    await expect(chat(page).locator('cometchat-message-header')).toBeVisible();
    await expect(chat(page).getByRole('log', { name: 'Message list' })).toBeVisible();
    await expect(composer(page)).toBeVisible();
    await expect(chat(page).getByRole('button', { name: 'New Chat' })).toBeVisible();
    await expect(chat(page).getByRole('button', { name: 'chat history' })).toBeVisible();
  });

  // ==================== Sending Messages ====================

  test('sending a message triggers AI response', async ({ page }) => {
    await openFreshAgentChat(page);
    const prompt = `What is CometChat? ${uniqueTag()}`;
    await send(page, prompt);
    await expect(chat(page).getByRole('log')).toContainText(prompt);
    await waitForReplies(page, 1);
  });

  // ==================== Streaming ====================

  test('streaming bubble shows thinking indicator', async ({ page }) => {
    await openFreshAgentChat(page);
    // Moderation's AI rules disapproved "Tell me about messaging in two sentences" (the agent
    // never answers a blocked prompt), so keep prompts plainly about the product.
    await send(page, `What is CometChat? Answer in two sentences. ${uniqueTag()}`);
    // While the reply streams: a "Thinking..." bubble, and the send button becomes Stop.
    await expect(chat(page).locator('.cometchat-stream-message-bubble__thinking')).toHaveText('Thinking...');
    await expect(chat(page).getByRole('button', { name: 'Stop streaming' })).toBeVisible();
    // Once the reply is in, both are gone.
    await waitForReplies(page, 1);
    await expect(chat(page).locator('.cometchat-stream-message-bubble__thinking')).toHaveCount(0, { timeout: REPLY_TIMEOUT });
    await expect(chat(page).getByRole('button', { name: 'Stop streaming' })).toHaveCount(0);
  });

  // ==================== Suggested Messages ====================

  test('suggested messages render in empty state @quarantine (ENG-40832)', async ({ page }) => {
    // @quarantine (ENG-40832): suggestions come from the agent user's metadata.suggestedMessages, which the
    // E2E app's agent doesn't set, and the sample app passes none of its own. The shared agent's
    // configuration isn't changed from a test.
    await openFreshAgentChat(page);
    await expect(chat(page).locator('.cometchat-ai-assistant-chat__suggested-message-pill').first()).toBeVisible();
  });

  test('clicking a suggestion sends it as a message @quarantine (ENG-40832)', async ({ page }) => {
    // @quarantine (ENG-40832): as above, there are no suggestions to click.
    await openFreshAgentChat(page);
    const pill = chat(page).locator('.cometchat-ai-assistant-chat__suggested-message-pill').first();
    const text = (await pill.textContent())!.trim();
    await pill.click();
    await expect(chat(page).getByRole('log')).toContainText(text);
    await waitForReplies(page, 1);
  });

  // ==================== Back Button ====================

  test.describe('on a phone-sized screen', () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test('back button fires and closes AI assistant', async ({ page }) => {
      await openFreshAgentChat(page);
      // In the mobile layout the chat takes the screen and offers Back.
      const back = chat(page).locator('cometchat-message-header').getByRole('button', { name: /back/i });
      await expect(back).toBeVisible();
      await back.click();
      await expect(chat(page)).toBeHidden();
      await expect(page.locator('cometchat-conversations')).toBeVisible();
    });
  });

  // ==================== Markdown ====================

  test('markdown renders correctly in AI response bubbles', async ({ page }) => {
    await openFreshAgentChat(page);
    await send(page, 'Give me a markdown bulleted list of three CometChat features, each name in bold');
    const reply = await waitForReplies(page, 1);
    // The reply's markdown is rendered as HTML: a list with bold names. (Not checked: that no
    // "**" is left anywhere — the live model sometimes writes stray markdown of its own.)
    await expect(reply.locator('cometchat-markdown-renderer li').first()).toBeVisible();
    await expect(reply.locator('cometchat-markdown-renderer li strong').first()).toBeVisible();
  });

  test('multiple messages in sequence work correctly', async ({ page }) => {
    await openFreshAgentChat(page);
    const first = `Hello ${uniqueTag()}`;
    await send(page, first);
    await waitForReplies(page, 1);

    const second = `How are you? ${uniqueTag()}`;
    await send(page, second);
    await waitForReplies(page, 2);

    // Both prompts and both replies are in the chat, in order.
    const log = chat(page).getByRole('log');
    await expect(log).toContainText(first);
    await expect(log).toContainText(second);
    const text = (await log.innerText()).replace(/\s+/g, ' ');
    expect(text.indexOf(first)).toBeLessThan(text.indexOf(second));
  });

  // ==================== Scroll Behavior ====================

  test('long responses scroll properly', async ({ page }) => {
    await openFreshAgentChat(page);
    // Ask for a Markdown list, one item per line: the agent otherwise sometimes writes the tips
    // as one run-on paragraph, and this test is about scrolling, not about the agent's style.
    await send(page, 'Reply with a Markdown numbered list, one item per line: 25 tips for using a chat app, one short sentence each');
    // The reply that holds the list, not just the first reply, in case another arrives first.
    const reply = replies(page).filter({ has: page.locator('li') }).last();
    await expect(reply.locator('li').nth(9)).toBeVisible({ timeout: REPLY_TIMEOUT });

    // The reply overflows the list, which scrolls, and its end can be scrolled into view.
    const container = chat(page).locator('.cometchat-message-list__container').first();
    await expect
      .poll(() => container.evaluate((el) => el.scrollHeight > el.clientHeight), { timeout: REPLY_TIMEOUT })
      .toBe(true);
    await container.evaluate((el) => el.scrollTo({ top: el.scrollHeight }));
    await expect(reply.locator('li').last()).toBeInViewport();
  });

  // ==================== Error State ====================

  test('error state shows gracefully on failure', async ({ page }) => {
    await openFreshAgentChat(page);
    // The server refuses the message: the chat must show it failed and stay usable.
    const rejected = page.waitForResponse((r) => r.request().method() === 'POST' && /\/v3\.0\/messages$/.test(r.url()));
    await page.route(/\/v3\.0\/messages$/, (route) =>
      route.request().method() === 'POST'
        ? route.fulfill({ status: 500, contentType: 'application/json', body: '{"error":{"code":"ERR_E2E","message":"e2e failure"}}' })
        : route.continue()
    );
    const prompt = `This send fails ${uniqueTag()}`;
    await send(page, prompt);
    expect((await rejected).status()).toBe(500);

    const sent = chat(page).getByRole('log').getByRole('article', { name: new RegExp(`Text message, ${prompt}`) });
    await expect(sent).toBeVisible();
    await expect(sent.getByRole('img', { name: 'Message sent' })).toHaveCount(0, { timeout: 10_000 });
    await expect(sent.locator('[class*="receipts-error"], [aria-label*="fail" i]').first()).toBeVisible();
    await expect(composer(page)).toBeEditable();
  });

  // ==================== Accessibility ====================

  test('AI assistant chat has proper ARIA attributes', async ({ page }) => {
    await openFreshAgentChat(page);
    await expect(chat(page).getByRole('banner')).toHaveAttribute('aria-label', /.+/);
    await expect(chat(page).getByRole('log', { name: 'Message list' })).toBeVisible();
    await expect(chat(page).getByRole('region', { name: 'Message composer' })).toBeVisible();
    await expect(chat(page).getByRole('toolbar', { name: 'Formatting toolbar' })).toBeVisible();
    await expect(chat(page).getByRole('button', { name: 'New Chat' })).toBeVisible();
  });
});
