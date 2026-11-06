import { test, expect, Page } from '../fixtures/coverage';
import { loginToApp, sendMessageAs, conversationRow, openConversation, PRIMARY_USER } from '../helpers';
import { E2E_TAGS, runScoped } from '../helpers/run';
import { environment } from '../../projects/sample-app/src/environments/environment';

/**
 * E2E Tests — AI Agent Bubbles in Group Chat
 *
 * Tests that AI agent messages render correctly in group conversations:
 * - Agent bubble renders left-aligned with avatar and sender name
 * - Context menu shows copy-only option
 * - Copy action extracts correct text
 * - Conversation list subtitle shows agent message text
 * - Real-time: sending @mention triggers agent response
 *
 * Prerequisites:
 * - An AI agent user (role @agentic) must exist in the CometChat app
 * - E2E_AGENT_UID and E2E_AGENT_NAME must be set in environment or .env
 */

// ─── Configuration ────────────────────────────────────────────────────────────

const APP_ID = process.env['E2E_APP_ID'] || environment.appId;
const REGION = process.env['E2E_REGION'] || environment.region;
const API_KEY = process.env['E2E_API_KEY'] || (environment as any).apiKey;
// const API_BASE = `https://${APP_ID}.api-${REGION}.cometchat.io/v3`;
const API_BASE = `https://${APP_ID}.api-${REGION}.cometchat.io/v3`;
const HEADERS = { 'Content-Type': 'application/json', 'apikey': API_KEY };

const AGENT_UID = process.env['E2E_AGENT_UID'] || (environment as any).agentUid;
const AGENT_NAME = process.env['E2E_AGENT_NAME'] || (environment as any).agentName;

const E2E_GROUP_GUID = runScoped('agent-in-group');
const E2E_GROUP_NAME = 'E2E Agent In Group Test';

const AGENT_RESPONSE_TIMEOUT = 120_000; // Agent can take time to respond

// ─── API Helpers ──────────────────────────────────────────────────────────────

async function apiCall(method: string, path: string, body?: object): Promise<any> {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: HEADERS,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    console.warn(`[agent-e2e] ${method} ${path} → ${res.status}: ${text.substring(0, 200)}`);
    return null;
  }
  return res.json().catch(() => null);
}

async function createGroupIfNeeded(): Promise<void> {
  // Try to get group first
  const existing = await apiCall('GET', `/groups/${E2E_GROUP_GUID}`);
  if (existing?.data) {
    console.log(`[agent-e2e] Group ${E2E_GROUP_GUID} already exists.`);
    return;
  }

  // Create group
  console.log(`[agent-e2e] Creating group ${E2E_GROUP_GUID}...`);
  await apiCall('POST', '/groups', {
    guid: E2E_GROUP_GUID,
    name: E2E_GROUP_NAME,
    type: 'public',
    tags: E2E_TAGS,
  });
}

async function addMemberToGroup(uid: string): Promise<void> {
  await apiCall('POST', `/groups/${E2E_GROUP_GUID}/members`, {
    participants: [uid],
  });
}

/**
 * @mention the agent in the group over REST and wait for its reply, so the bubble tests have
 * an agent message to look at without depending on the real-time test. The send waits for
 * moderation, which (with the agent's own reply also moderated) is why replies take longer
 * than they used to.
 */
async function seedAgentReply(): Promise<void> {
  const mentionId = await sendMessageAs(
    PRIMARY_USER,
    E2E_GROUP_GUID,
    { category: 'message', type: 'text', data: { text: `<@uid:${AGENT_UID}> What is CometChat?`, mentions: [AGENT_UID] } },
    'group'
  );
  const deadline = Date.now() + AGENT_RESPONSE_TIMEOUT;
  while (Date.now() < deadline) {
    const res = await apiCall('GET', `/messages?receiver=${E2E_GROUP_GUID}&receiverType=group&perPage=50`);
    const replied = (res?.data ?? []).some(
      (m: { sender: string; receiver: string; id: string }) =>
        m.receiver === E2E_GROUP_GUID && m.sender === AGENT_UID && Number(m.id) > Number(mentionId)
    );
    if (replied) return;
    await new Promise((r) => setTimeout(r, 3_000));
  }
  throw new Error(`The agent did not reply in ${E2E_GROUP_GUID} within ${AGENT_RESPONSE_TIMEOUT}ms`);
}

async function deleteGroup(): Promise<void> {
  await apiCall('DELETE', `/groups/${E2E_GROUP_GUID}?permanent=true`);
}

// ─── Setup & Teardown ─────────────────────────────────────────────────────────

test.beforeAll(async () => {
  test.setTimeout(AGENT_RESPONSE_TIMEOUT + 60_000);
  if (!AGENT_UID || !AGENT_NAME) {
    throw new Error(
      'E2E_AGENT_UID and E2E_AGENT_NAME must be set in environment.ts or .env'
    );
  }

  // Clean up any leftover group from a previous run
  await deleteGroup();

  // Create fresh group and add members
  await createGroupIfNeeded();
  await addMemberToGroup(PRIMARY_USER);
  await addMemberToGroup(AGENT_UID);

  console.log(`[agent-e2e] Group ready: ${E2E_GROUP_GUID} with members: ${PRIMARY_USER}, ${AGENT_UID}`);

  await seedAgentReply();
  console.log('[agent-e2e] Agent replied in the group.');
});

test.afterAll(async () => {
  // Clean up: delete the e2e group
  console.log(`[agent-e2e] Cleaning up group ${E2E_GROUP_GUID}...`);
  await deleteGroup();
});

// ─── Tests ────────────────────────────────────────────────────────────────────

test.describe('Agent Bubbles in Group Chat', () => {
  let page: Page;

  /**
   * Navigate to the agent test group conversation.
   * The group is freshly created so we navigate via the Groups tab.
   */
  async function openAgentGroupConversation(p: Page): Promise<void> {
    await p.waitForSelector('.cometchat-conversations, cometchat-conversations', { timeout: 30_000 });

    // Navigate to Groups tab
    const groupsTab = p.locator('[data-testid="tab-groups"], button:has-text("Groups"), .cometchat-tabs__tab:has-text("Groups")').first();
    await groupsTab.click();
    await p.waitForSelector('cometchat-groups, .cometchat-groups', { timeout: 15_000 });

    // Find and click our test group
    const groupItem = p.locator(`.cometchat-group-item:has-text("${E2E_GROUP_NAME}"), cometchat-group-item:has-text("${E2E_GROUP_NAME}"), .cometchat-list-item:has-text("${E2E_GROUP_NAME}")`).first();
    await expect(groupItem).toBeVisible({ timeout: 10_000 });
    await groupItem.click();

    // Wait for the chat's first load: the agent reply seeded in beforeAll is shown. A message
    // sent while the list is still loading can be dropped (ENG-40618).
    await expect(p.locator('cometchat-message-header').first()).toContainText(E2E_GROUP_NAME, { timeout: 15_000 });
    await expect(p.locator('cometchat-messages cometchat-ai-assistant-message-bubble').first()).toBeVisible({ timeout: 30_000 });
  }

  /**
   * Every option the agent bubble offers on hover: its quick actions, plus the items of its
   * "More options" menu when it has one. Menus are closed again before returning.
   */
  async function agentOptions(p: Page, wrapper: ReturnType<typeof getAgentBubbleWrapper>): Promise<string[]> {
    const options = wrapper.locator('.cometchat-message-bubble__options');
    await expect(async () => {
      await wrapper.locator('.cometchat-message-bubble__body').first().hover();
      await expect(options).toBeVisible({ timeout: 2_000 });
    }).toPass({ timeout: 15_000 });
    const quick = await options
      .locator('[role="menuitem"], button')
      .filter({ visible: true })
      .evaluateAll((els) => els.map((e) => (e.getAttribute('aria-label') || e.getAttribute('title') || e.textContent || '').trim()));
    const labels = quick.filter((l) => l && l !== 'More options');
    const more = options.getByRole('button', { name: 'More options' });
    if (await more.count()) {
      await more.click();
      const items = p.locator('.cometchat-menu-list__sub-menu-list-item').filter({ visible: true });
      await expect(items.first()).toBeVisible();
      labels.push(...(await items.evaluateAll((els) => els.map((e) => (e.getAttribute('aria-label') || e.textContent || '').trim()))));
      await p.keyboard.press('Escape');
    }
    return [...new Set(labels)];
  }

  /**
   * Locate a wrapper that contains an AI assistant bubble (incoming).
   * DOM: .cometchat-message-bubble__wrapper has child .cometchat-message-bubble-incoming
   *      which contains cometchat-ai-assistant-message-bubble.
   */
  function getAgentBubbleWrapper(p: Page) {
    return p.locator('.cometchat-message-bubble__wrapper:has(.cometchat-message-bubble-incoming cometchat-ai-assistant-message-bubble)').first();
  }

  test.beforeEach(async ({ page: p }) => {
    page = p;
    await loginToApp(page);
    await openAgentGroupConversation(page);
  });

  // ==================== Real-time Agent Response ====================

  test('sending @mention triggers real-time agent response', async () => {
    // Waiting for the agent can take up to AGENT_RESPONSE_TIMEOUT, past the default test timeout.
    test.setTimeout(AGENT_RESPONSE_TIMEOUT + 60_000);
    // Find the composer
    const composer = page.locator('cometchat-message-composer').first();
    await expect(composer).toBeVisible({ timeout: 10_000 });

    const input = composer.locator('[contenteditable="true"]').first();
    await expect(input).toBeVisible({ timeout: 5_000 });

    // Count existing AI bubbles before sending
    const initialAiBubbleCount = await page.locator('cometchat-ai-assistant-message-bubble').count();

    // Type @ to trigger mentions dropdown
    await input.click();
    await page.keyboard.type('@');

    // Wait for mentions dropdown to appear
    const mentionDropdown = page.locator('[class*="mention"], [class*="user-member-wrapper"], [class*="suggestion"], [role="listbox"]').first();
    await expect(mentionDropdown).toBeVisible({ timeout: 5_000 });

    // Search with the agent's first word: a space ends the mention search. The group's only
    // members are the owner and the agent, so the agent's full name picks it below.
    const partialName = AGENT_NAME.split(' ')[0];
    await page.keyboard.type(partialName);

    // Select agent from suggestions using the mention-option class
    const agentSuggestion = page.locator(`.cometchat-message-composer__mention-option:has-text("${AGENT_NAME}")`).first();
    await expect(agentSuggestion).toBeVisible({ timeout: 5_000 });
    await agentSuggestion.click();
    // The mention is in the composer before the rest of the message is typed after it.
    await expect(input).toContainText(AGENT_NAME);

    // Type the rest of the message after the mention
    await page.keyboard.type(' What is CometChat?');
    await expect(input).toContainText('What is CometChat?');

    // Send the message
    await page.keyboard.press('Enter');
    await expect(input).not.toContainText('What is CometChat?');

    // Wait for the agent to respond (can take a while)
    await expect(async () => {
      const currentCount = await page.locator('cometchat-ai-assistant-message-bubble').count();
      expect(currentCount).toBeGreaterThan(initialAiBubbleCount);
    }).toPass({ timeout: AGENT_RESPONSE_TIMEOUT, intervals: [3_000, 5_000, 10_000] });

    // Verify the new agent bubble is visible and has content
    const latestAiBubble = page.locator('cometchat-ai-assistant-message-bubble').last();
    await expect(latestAiBubble).toBeVisible();
    const content = await latestAiBubble.textContent();
    expect(content?.trim().length).toBeGreaterThan(0);
  });

  // ==================== Agent Bubble Rendering ====================

  test('agent message renders as left-aligned incoming bubble', async () => {
    const wrapper = getAgentBubbleWrapper(page);
    await expect(wrapper).toBeVisible({ timeout: 10_000 });

    // The inner bubble should have the incoming class
    const incomingBubble = wrapper.locator('.cometchat-message-bubble-incoming').first();
    await expect(incomingBubble).toBeVisible();
  });

  test('agent bubble shows avatar in leading view', async () => {
    // Avatar is in leading-view sibling of the incoming bubble, inside the wrapper
    const wrapper = getAgentBubbleWrapper(page);
    await expect(wrapper).toBeVisible({ timeout: 10_000 });

    const avatar = wrapper.locator('.cometchat-message-bubble__leading-view .cometchat-avatar, .cometchat-message-bubble__leading-view cometchat-avatar').first();
    await expect(avatar).toBeVisible();
  });

  test('agent bubble shows sender name', async () => {
    const wrapper = getAgentBubbleWrapper(page);
    await expect(wrapper).toBeVisible({ timeout: 10_000 });

    // Sender name is in the header area of the bubble
    const senderName = wrapper.locator('.cometchat-message-bubble__sender-name').first();
    await expect(senderName).toBeVisible();

    const nameText = await senderName.textContent();
    expect(nameText?.trim().length).toBeGreaterThan(0);
  });

  test('agent AI assistant bubble renders with content', async () => {
    const wrapper = getAgentBubbleWrapper(page);
    await expect(wrapper).toBeVisible({ timeout: 10_000 });

    const aiBubble = wrapper.locator('cometchat-ai-assistant-message-bubble').first();
    await expect(aiBubble).toBeVisible();

    const content = await aiBubble.textContent();
    expect(content?.trim().length).toBeGreaterThan(0);
  });

  // ==================== Context Menu (Message Options) ====================

  test('agent bubble context menu shows only copy option', async () => {
    const wrapper = getAgentBubbleWrapper(page);
    await expect(wrapper).toBeVisible({ timeout: 10_000 });

    expect(await agentOptions(page, wrapper)).toEqual(['Copy']);
  });

  test('agent bubble does NOT show react, reply, or thread options', async () => {
    const wrapper = getAgentBubbleWrapper(page);
    await expect(wrapper).toBeVisible({ timeout: 10_000 });

    const options = (await agentOptions(page, wrapper)).map((o) => o.toLowerCase());
    expect(options.length, 'the agent bubble offers at least one option').toBeGreaterThan(0);
    for (const option of options) {
      expect(option).not.toContain('react');
      expect(option).not.toContain('reply');
      expect(option).not.toContain('thread');
    }
  });

  // ==================== Copy Action ====================

  test('copy option copies agent message text to clipboard', async () => {
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);

    const wrapper = getAgentBubbleWrapper(page);
    await expect(wrapper).toBeVisible({ timeout: 10_000 });

    // Copy is a quick action on the bubble, or an item of its "More options" menu.
    const options = wrapper.locator('.cometchat-message-bubble__options');
    const quickCopy = options.locator('[role="menuitem"], button').filter({ visible: true }).and(options.locator('[aria-label="Copy"], [title="Copy"]'));
    await expect(async () => {
      await wrapper.locator('.cometchat-message-bubble__body').first().hover();
      if (await quickCopy.count()) {
        await quickCopy.first().click({ timeout: 2_000 });
        return;
      }
      await options.getByRole('button', { name: 'More options' }).click({ timeout: 2_000 });
      await page.locator('.cometchat-menu-list__sub-menu-list-item[aria-label="Copy"]').filter({ visible: true }).click({ timeout: 2_000 });
    }).toPass({ timeout: 15_000 });

    // Verify clipboard has content
    // textContent, not innerText: innerText is empty while the bubble isn't laid out.
    const bubbleText = ((await wrapper.locator('cometchat-ai-assistant-message-bubble').first().textContent()) ?? '').replace(/\s+/g, ' ');
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText().then((t) => t.trim()))).not.toBe('');
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    // The copied text is the agent's message (its first line is in the bubble).
    expect(bubbleText).toContain(clipboardText.trim().split('\n')[0].replace(/[*_#`>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 20));
  });

  // ==================== No Footer Copy Button in Groups ====================

  test('agent bubble does NOT show inline footer copy button in group', async () => {
    const wrapper = getAgentBubbleWrapper(page);
    await expect(wrapper).toBeVisible({ timeout: 10_000 });

    const footerCopy = wrapper.locator('.cometchat-ai-assistant-chat__bubble-copy-icon');
    await expect(footerCopy).not.toBeVisible({ timeout: 2_000 });
  });

  // ==================== Quoted Reply Preview ====================

  test('agent bubble shows reply preview when message has quoted message', async () => {
    // Find an agent bubble wrapper that has a reply view
    const wrapperWithReply = page.locator('.cometchat-message-bubble__wrapper:has(.cometchat-message-bubble-incoming cometchat-ai-assistant-message-bubble):has(.cometchat-message-bubble__reply-view, cometchat-message-preview)').first();
    await expect(wrapperWithReply).toBeVisible({ timeout: 5_000 });

    // The reply preview should contain text
    const replyContent = wrapperWithReply.locator('.cometchat-message-bubble__reply-view, cometchat-message-preview').first();
    await expect(replyContent).toBeVisible();
    const text = await replyContent.textContent();
    expect(text?.trim().length).toBeGreaterThan(0);
  });

  // ==================== Conversation List Subtitle (Real-time) ====================

  test('conversation list shows agent message text as subtitle in real-time @quarantine (ENG-40810)', async () => {
    // @quarantine (ENG-40810): intermittent UI Kit defect — the agent's reply reaches the client (the Chats
    // row previews "E2E Assistant: …") but is sometimes never rendered in the open group chat
    // (2 of 3 runs). Not every run, so it can't be test.fail.
    test.setTimeout(AGENT_RESPONSE_TIMEOUT + 60_000);
    // Open the group FROM the Chats tab, so the conversation list stays mounted beside it.
    await page.getByLabel('Navigation tabs').getByRole('tab', { name: 'Chats' }).click();
    const groupConvItem = conversationRow(page, E2E_GROUP_NAME);
    await openConversation(page, E2E_GROUP_NAME);
    // Wait for the first load to finish (the agent reply seeded in beforeAll shows) before
    // counting and sending; a message sent while the list is still loading can be dropped.
    const agentBubbles = page.locator('cometchat-messages cometchat-ai-assistant-message-bubble');
    await expect(agentBubbles.first()).toBeVisible({ timeout: 30_000 });
    const initialCount = await agentBubbles.count();

    // @mention the agent. Filter with its first word: a space ends the mention search, so
    // "E2E Assist" would close the suggestions. The agent's full name picks it.
    const input = page.locator('cometchat-messages cometchat-message-composer [contenteditable="true"]').first();
    await input.click();
    await page.keyboard.type(`@${AGENT_NAME.split(' ')[0]}`);
    const agentSuggestion = page.locator('.cometchat-message-composer__mention-option').filter({ hasText: AGENT_NAME }).first();
    await agentSuggestion.click();
    await page.keyboard.type(' What can CometChat do?');
    await page.keyboard.press('Enter');

    // The agent replies in the open chat…
    await expect.poll(() => agentBubbles.count(), { timeout: AGENT_RESPONSE_TIMEOUT }).toBeGreaterThan(initialCount);

    // …and the Chats row previews it in real time, prefixed with the agent's name and not as
    // a raw message type.
    const subtitle = groupConvItem.locator('.cometchat-conversation-item__subtitle').first();
    await expect(subtitle).toContainText(`${AGENT_NAME}:`, { timeout: 15_000 });
    await expect(subtitle).not.toHaveText(/^\s*(assistant|agentic)\s*$/);
  });
});
