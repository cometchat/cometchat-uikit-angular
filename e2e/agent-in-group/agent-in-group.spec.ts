import { test, expect, Page } from '@playwright/test';
import { loginToApp } from '../helpers';
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
const PRIMARY_USER = process.env['E2E_USER_UID'] || environment.userUid;

const E2E_GROUP_GUID = 'e2e-agent-in-group-test';
const E2E_GROUP_NAME = 'E2E Agent In Group Test';
const E2E_TAG = 'e2e-test-data';

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
    tags: [E2E_TAG],
  });
}

async function addMemberToGroup(uid: string): Promise<void> {
  await apiCall('POST', `/groups/${E2E_GROUP_GUID}/members`, {
    participants: [uid],
  });
}

async function deleteGroup(): Promise<void> {
  await apiCall('DELETE', `/groups/${E2E_GROUP_GUID}?permanent=true`);
}

// ─── Setup & Teardown ─────────────────────────────────────────────────────────

test.beforeAll(async () => {
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
    await p.waitForTimeout(2000);

    // Find and click our test group
    const groupItem = p.locator(`.cometchat-group-item:has-text("${E2E_GROUP_NAME}"), cometchat-group-item:has-text("${E2E_GROUP_NAME}"), .cometchat-list-item:has-text("${E2E_GROUP_NAME}")`).first();
    await expect(groupItem).toBeVisible({ timeout: 10_000 });
    await groupItem.click();

    // Wait for the message composer to be ready (group is fresh/empty so no bubbles yet)
    await p.waitForSelector('cometchat-message-composer, .cometchat-message-composer', { timeout: 15_000 });
    await p.waitForTimeout(2000);
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

  // ==================== Real-time Agent Response (runs first to seed a bubble) ====================

  test('sending @mention triggers real-time agent response', async () => {
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
    await page.waitForTimeout(2000);

    // Wait for mentions dropdown to appear
    const mentionDropdown = page.locator('[class*="mention"], [class*="user-member-wrapper"], [class*="suggestion"], [role="listbox"]').first();
    await expect(mentionDropdown).toBeVisible({ timeout: 5_000 });

    // Type partial agent name to filter
    const partialName = AGENT_NAME.substring(0, 3);
    await page.keyboard.type(partialName);
    await page.waitForTimeout(1500);

    // Select agent from suggestions using the mention-option class
    const agentSuggestion = page.locator(`.cometchat-message-composer__mention-option:has-text("${AGENT_NAME}")`).first();
    await expect(agentSuggestion).toBeVisible({ timeout: 5_000 });
    await agentSuggestion.click();
    await page.waitForTimeout(500);

    // Type the rest of the message after the mention
    await page.keyboard.type(' What is CometChat?');
    await page.waitForTimeout(300);

    // Send the message
    await page.keyboard.press('Enter');
    await page.waitForTimeout(2000);

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

    // Hover over the bubble body to trigger context menu
    const bodyArea = wrapper.locator('.cometchat-message-bubble__body').first();
    await bodyArea.hover();
    await page.waitForTimeout(500);

    // Options are scoped to THIS wrapper — only count visible ones inside it
    // Quick options appear on hover within the wrapper
    const visibleOptions = wrapper.locator('button:visible, [role="menuitem"]:visible').filter({
      has: page.locator('[title="Copy"], [title="React"], [title="Reply"], [title*="thread"], [aria-label="Copy"], [aria-label="React"], [aria-label*="Reply"]'),
    });

    // Alternative: count action buttons that appear on hover within the bubble
    const actionButtons = wrapper.locator('.cometchat-context-menu button:visible, .cometchat-message-bubble__options button:visible, [class*="quick-option"]:visible');
    const actionCount = await actionButtons.count();

    if (actionCount > 0) {
      // Should only have 1 option (copy)
      expect(actionCount).toBe(1);
      const firstTitle = await actionButtons.first().getAttribute('title') || await actionButtons.first().textContent();
      expect(firstTitle?.toLowerCase()).toContain('copy');
    } else {
      // Try more options button within this wrapper
      const moreBtn = wrapper.locator('button[aria-label="More options"]').first();
      const hasMore = await moreBtn.isVisible({ timeout: 2_000 }).catch(() => false);
      if (hasMore) {
        await moreBtn.click();
        await page.waitForTimeout(500);
        // Context menu opens — count items
        const menuItems = page.locator('[role="menuitem"]:visible');
        const menuCount = await menuItems.count();
        expect(menuCount).toBe(1);
        const itemText = await menuItems.first().textContent();
        expect(itemText?.toLowerCase()).toContain('copy');
      }
    }

    // Dismiss
    await page.keyboard.press('Escape');
  });

  test('agent bubble does NOT show react, reply, or thread options', async () => {
    const wrapper = getAgentBubbleWrapper(page);
    await expect(wrapper).toBeVisible({ timeout: 10_000 });

    // Hover to trigger options
    const bodyArea = wrapper.locator('.cometchat-message-bubble__body').first();
    await bodyArea.hover();
    await page.waitForTimeout(500);

    // Scope to this wrapper only — check that no react/reply/thread buttons appear
    const reactBtn = wrapper.locator('button[title="React"], button[aria-label*="React"], button[title*="react"]');
    await expect(reactBtn).not.toBeVisible({ timeout: 2_000 });

    const replyBtn = wrapper.locator('button[title="Reply"], button[aria-label*="Reply"], button[title*="reply"]');
    await expect(replyBtn).not.toBeVisible({ timeout: 1_000 });

    const threadBtn = wrapper.locator('button[title*="thread"], button[title*="Thread"], button[aria-label*="thread"]');
    await expect(threadBtn).not.toBeVisible({ timeout: 1_000 });

    // Also check overflow menu if present
    const moreBtn = wrapper.locator('button[aria-label="More options"]').first();
    const hasMore = await moreBtn.isVisible({ timeout: 1_000 }).catch(() => false);
    if (hasMore) {
      await moreBtn.click();
      await page.waitForTimeout(500);
      const menuItems = page.locator('[role="menuitem"]:visible');
      const count = await menuItems.count();
      for (let i = 0; i < count; i++) {
        const text = await menuItems.nth(i).textContent();
        expect(text?.toLowerCase()).not.toContain('reply');
        expect(text?.toLowerCase()).not.toContain('react');
        expect(text?.toLowerCase()).not.toContain('thread');
      }
    }

    // Dismiss
    await page.keyboard.press('Escape');
  });

  // ==================== Copy Action ====================

  test('copy option copies agent message text to clipboard', async () => {
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);

    const wrapper = getAgentBubbleWrapper(page);
    await expect(wrapper).toBeVisible({ timeout: 10_000 });

    // Hover to show options
    const bodyArea = wrapper.locator('.cometchat-message-bubble__body').first();
    await bodyArea.hover();
    await page.waitForTimeout(500);

    // Find and click the copy option
    let copyOption = wrapper.locator('button[title="Copy"], [aria-label="Copy"]').first();
    let hasCopy = await copyOption.isVisible({ timeout: 3_000 }).catch(() => false);

    if (!hasCopy) {
      // Try overflow menu
      const moreBtn = wrapper.locator('button[aria-label="More options"], [class*="more"]').first();
      const hasMore = await moreBtn.isVisible({ timeout: 2_000 }).catch(() => false);
      if (hasMore) {
        await moreBtn.click();
        await page.waitForTimeout(500);
      }
      copyOption = page.locator('[role="menuitem"]:has-text("Copy")').first();
      hasCopy = await copyOption.isVisible({ timeout: 3_000 }).catch(() => false);
    }

    expect(hasCopy).toBeTruthy();
    await copyOption.click();
    await page.waitForTimeout(1000);

    // Verify clipboard has content
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText.trim().length).toBeGreaterThan(0);
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
    await wrapperWithReply.isVisible({ timeout: 5_000 }).catch(() => false);

    // The reply preview should contain text
    const replyContent = wrapperWithReply.locator('.cometchat-message-bubble__reply-view, cometchat-message-preview').first();
    await expect(replyContent).toBeVisible();
    const text = await replyContent.textContent();
    expect(text?.trim().length).toBeGreaterThan(0);
  });

  // ==================== Conversation List Subtitle (Real-time) ====================

  test('conversation list shows agent message text as subtitle in real-time', async () => {
    // Step 1: Navigate to Chats tab
    const chatsTab = page.locator('[data-testid="tab-chats"], button:has-text("Chats"), .cometchat-tabs__tab:has-text("Chats")').first();
    await chatsTab.click();
    await page.waitForSelector('.cometchat-conversation-item', { timeout: 15_000 });
    await page.waitForTimeout(1000);

    // The group should appear in conversations (earlier tests sent messages in it)
    const groupConvItem = page.locator(`.cometchat-conversation-item:has-text("${E2E_GROUP_NAME}")`).first();
    await expect(groupConvItem).toBeVisible({ timeout: 10_000 });

    // Step 2: Open the group FROM the Chats tab (conv list stays mounted)
    await groupConvItem.click();
    await page.waitForSelector('cometchat-message-composer', { timeout: 15_000 });
    await page.waitForTimeout(1000);

    // Step 3: Send @mention to trigger agent response
    const input = page.locator('cometchat-message-composer [contenteditable="true"]').first();
    await expect(input).toBeVisible({ timeout: 5_000 });

    // Type @ to trigger mentions dropdown
    await input.click();
    await page.keyboard.type('@');
    await page.waitForTimeout(2000);

    // Wait for mentions dropdown
    const mentionDropdown = page.locator('[class*="mention"], [class*="user-member-wrapper"], [class*="suggestion"], [role="listbox"]').first();
    await expect(mentionDropdown).toBeVisible({ timeout: 5_000 });

    // Filter to agent
    const partialName = AGENT_NAME.substring(0, 10);
    await page.keyboard.type(partialName);
    await page.waitForTimeout(1500);

    // Select agent
    const agentSuggestion = page.locator(`.cometchat-message-composer__mention-option:has-text("${AGENT_NAME}")`).first();
    await expect(agentSuggestion).toBeVisible({ timeout: 5_000 });
    await agentSuggestion.click();
    await page.waitForTimeout(500);

    // Type rest of message
    await page.keyboard.type(' Tell me about real-time messaging');
    await page.waitForTimeout(300);

    // Send
    await page.keyboard.press('Enter');
    await page.waitForTimeout(2000);

    // Wait for agent to respond
    const initialCount = await page.locator('cometchat-ai-assistant-message-bubble').count();
    await expect(async () => {
      const currentCount = await page.locator('cometchat-ai-assistant-message-bubble').count();
      expect(currentCount).toBeGreaterThan(initialCount);
    }).toPass({ timeout: AGENT_RESPONSE_TIMEOUT, intervals: [3_000, 5_000, 10_000] });

    // Step 5: Check the conversation list subtitle was updated in real-time.
    const subtitle = groupConvItem.locator('.cometchat-conversation-item__subtitle').first();
    await expect(subtitle).toBeVisible();

    const subtitleText = await subtitle.textContent();

    // Subtitle should show sender name prefix like "AgentName: ..." confirming
    expect(subtitleText?.trim().length).toBeGreaterThan(0);
    expect(subtitleText).toContain(`${AGENT_NAME}:`);
    // Should not be raw type string
    expect(subtitleText?.trim()).not.toBe('assistant');
    expect(subtitleText?.trim()).not.toBe('agentic');
  });
});