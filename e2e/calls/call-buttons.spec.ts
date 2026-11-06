import { test, expect, Page } from '../fixtures/coverage';
import {
  loginToApp,
  openConversation,
  getUserName,
  sendTextAs,
  createE2EGroup,
  PRIMARY_USER,
  SECONDARY_USER,
  uniqueTag,
} from '../helpers';

/**
 * E2E Tests — CometChatCallButtons & Calling (Angular)
 *
 * The call buttons in the message header, the outgoing call screen they open, and the Calls
 * tab's call logs. Every call a test starts is cancelled before it ends, so no call keeps
 * ringing into the next test (a ringing call makes later calls fail as "busy").
 *
 * @see ENG-34945
 */

test.use({
  launchOptions: { args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] },
  permissions: ['camera', 'microphone'],
});

const callButtons = (page: Page) => page.locator('cometchat-message-header cometchat-call-buttons');
const outgoing = (page: Page) => page.locator('cometchat-outgoing-call');
const cancelButton = (page: Page) => outgoing(page).locator('.cometchat-outgoing-call__button').getByRole('button');
const callLogs = (page: Page) => page.locator('cometchat-call-logs');
const newestLog = (page: Page) => callLogs(page).locator('.cometchat-call-logs__list-item').first();

/** Log in as `uid` (the primary user by default) and open the 1:1 chat with `peerName`. */
async function openChatWith(page: Page, peerName: string, uid?: string) {
  await loginToApp(page, uid ? { userUid: uid } : undefined);
  await openConversation(page, peerName);
  await expect(callButtons(page)).toBeVisible({ timeout: 15_000 });
}

/**
 * Start a call from the open chat and wait for the outgoing call screen. The header re-renders
 * right after the chat opens and can drop the first click, so retry until the call starts.
 */
async function startCall(page: Page, kind: 'Voice call' | 'Video call', peerName: string) {
  await expect(async () => {
    await callButtons(page).getByRole('button', { name: kind }).click({ timeout: 2_000 });
    await expect(outgoing(page)).toContainText(peerName, { timeout: 5_000 });
  }).toPass({ timeout: 30_000 });
}

/** Cancel a ringing outgoing call, if one is on screen, and wait for the screen to close. */
async function cancelIfRinging(page: Page) {
  if (await outgoing(page).isVisible()) {
    await cancelButton(page).click();
    await expect(outgoing(page)).toBeHidden({ timeout: 15_000 });
  }
}

test.describe('CometChatCallButtons & Calling', () => {
  let peerName = '';

  test.beforeAll(async () => {
    peerName = await getUserName(SECONDARY_USER);
    // The chat must exist in the primary user's Chats list.
    await sendTextAs(SECONDARY_USER, PRIMARY_USER, `Call me later ${uniqueTag()}`);
  });

  // ==================== Call Buttons in Message Header ====================

  test.describe('Call Buttons', () => {
    test.beforeEach(async ({ page }) => {
      await openChatWith(page, peerName);
    });

    test.afterEach(async ({ page }) => {
      await cancelIfRinging(page);
    });

    test('call buttons render for 1-on-1 conversation', async ({ page }) => {
      await expect(callButtons(page).getByRole('button')).toHaveCount(2);
    });

    test('voice call button is present', async ({ page }) => {
      await expect(callButtons(page).getByRole('button', { name: 'Voice call' })).toBeVisible();
    });

    test('video call button is present', async ({ page }) => {
      await expect(callButtons(page).getByRole('button', { name: 'Video call' })).toBeVisible();
    });

    test('voice call button initiates outgoing voice call', async ({ page }) => {
      await startCall(page, 'Voice call', peerName);
      await expect(outgoing(page)).toContainText('Calling...');
    });

    test('video call button initiates outgoing video call', async ({ page }) => {
      await startCall(page, 'Video call', peerName);
      await expect(outgoing(page)).toContainText('Calling...');
    });

    test('outgoing call screen renders with user info and cancel button', async ({ page }) => {
      await startCall(page, 'Voice call', peerName);
      await expect(outgoing(page)).toContainText(peerName);
      await expect(outgoing(page).locator('cometchat-avatar').first()).toBeVisible();
      await expect(cancelButton(page)).toBeVisible();
    });

    test('cancelling outgoing call dismisses the screen', async ({ page }) => {
      await startCall(page, 'Voice call', peerName);
      await cancelButton(page).click();
      await expect(outgoing(page)).toBeHidden({ timeout: 15_000 });
    });
  });

  // ==================== Call Logs ====================

  test.describe('Call Logs', () => {
    test.beforeEach(async ({ page }) => {
      // Make a call to log: call the peer and cancel while it rings.
      await openChatWith(page, peerName);
      await startCall(page, 'Voice call', peerName);
      await cancelButton(page).click();
      await expect(outgoing(page)).toBeHidden({ timeout: 15_000 });
      await page.getByLabel('Navigation tabs').getByRole('tab', { name: 'Calls' }).click();
      await expect(newestLog(page)).toContainText(peerName, { timeout: 30_000 });
    });

    test('call logs list renders with call history', async ({ page }) => {
      await expect(callLogs(page).locator('.cometchat-call-logs__list-item').first()).toBeVisible();
    });

    test('call log entries show correct type (audio/video) and status', async ({ page }) => {
      await expect(newestLog(page)).toHaveAttribute('aria-label', new RegExp(`^${peerName}, voice call, Outgoing call`));
      await expect(newestLog(page).locator('.cometchat-call-logs__list-item-subtitle-icon-outgoing-call')).toBeVisible();
      await expect(newestLog(page).getByRole('button', { name: `voice call ${peerName}` })).toBeVisible();
    });

    test('missed call indicator displays correctly', async ({ page, browser }) => {
      // The peer calls the primary user and cancels before anyone answers: a missed call.
      const caller = await browser.newContext({ permissions: ['camera', 'microphone'] });
      try {
        const callerPage = await caller.newPage();
        await openChatWith(callerPage, await getUserName(PRIMARY_USER), SECONDARY_USER);
        await startCall(callerPage, 'Voice call', await getUserName(PRIMARY_USER));
        // Cancel only once the call rings on the primary user's screen: a call cancelled before
        // it reaches the callee is not logged as missed for them.
        const ringing = page.locator('.cometchat-incoming-call');
        await expect(ringing).toContainText(peerName, { timeout: 30_000 });
        await cancelButton(callerPage).click();
        await expect(outgoing(callerPage)).toBeHidden({ timeout: 15_000 });
        await expect(ringing).toBeHidden({ timeout: 30_000 });
      } finally {
        await caller.close();
      }

      // The server writes the call log asynchronously, so reload the list until it is there.
      await expect(async () => {
        await page.reload();
        await page.getByLabel('Navigation tabs').getByRole('tab', { name: 'Calls' }).click();
        await expect(newestLog(page)).toHaveAttribute('aria-label', new RegExp(`^${peerName}, voice call, Missed call`), {
          timeout: 10_000,
        });
      }).toPass({ timeout: 60_000 });
      await expect(newestLog(page).locator('.cometchat-call-logs__list-item-subtitle-icon-missed-call')).toBeVisible();
    });

    test('call log entries show duration', async ({ page }) => {
      // Each entry shows when the call was made.
      await expect(newestLog(page).locator('.cometchat-call-logs__list-item-subtitle-text cometchat-date')).not.toBeEmpty();
    });

    test('clicking a call log entry shows details or initiates call', async ({ page }) => {
      await newestLog(page).click();
      const details = page.locator('cometchat-call-log-details');
      await expect(details).toBeVisible({ timeout: 15_000 });
      await expect(details).toContainText(peerName);
    });

    test('call logs list has proper ARIA attributes', async ({ page }) => {
      await expect(callLogs(page).getByRole('listbox', { name: 'Call history list' })).toBeVisible();
      await expect(newestLog(page)).toHaveAttribute('role', 'option');
      await expect(newestLog(page)).toHaveAttribute('aria-label', new RegExp(peerName));
    });
  });

  // ==================== Call Buttons for Group ====================

  test('call buttons render for group conversations', async ({ page }) => {
    const groupName = `E2E Group Call ${uniqueTag()}`;
    await createE2EGroup(`e2e-group-call-${uniqueTag()}`, groupName, PRIMARY_USER, [PRIMARY_USER, SECONDARY_USER]);
    await openChatWith(page, groupName);
    await expect(callButtons(page).getByRole('button', { name: 'Voice call' })).toBeVisible();
    await expect(callButtons(page).getByRole('button', { name: 'Video call' })).toBeVisible();
  });
});
