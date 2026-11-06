import { test, expect, Page, Browser, BrowserContext } from '../fixtures/coverage';
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
 * Calls between two (or three) real browsers: the caller in `page`, others in their own
 * contexts. Chromium's fake camera/microphone stand in for real devices.
 * Incoming calls arrive over the realtime connection, so a missed realtime event (seen
 * about 1 in 10 for messages) can fail these tests independently of the UI Kit.
 */

test.use({
  launchOptions: { args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] },
  permissions: ['camera', 'microphone'],
});


const outgoing = (page: Page) => page.locator('cometchat-outgoing-call');
const incoming = (page: Page) => page.locator('.cometchat-incoming-call');
const ongoing = (page: Page) => page.locator('cometchat-ongoing-call');

/** Log `uid` in, in a separate browser context, and wait for home. */
async function loginInNewContext(browser: Browser, uid: string): Promise<{ context: BrowserContext; page: Page }> {
  const context = await browser.newContext({ permissions: ['camera', 'microphone'] });
  const page = await context.newPage();
  await loginToApp(page, { userUid: uid });
  await expect(page.locator('.cometchat-conversations').first()).toBeVisible({ timeout: 30_000 });
  return { context, page };
}

/** Open a 1:1 chat from the Users tab (for users who have no conversation yet). */
async function openChatFromUsers(page: Page, name: string) {
  await page.getByLabel('Navigation tabs').getByRole('tab', { name: 'Users' }).click();
  const users = page.locator('cometchat-users');
  // Search typed before the list first renders is ignored (ENG-39946), so wait for it.
  await expect(users.locator('cometchat-user-item').first()).toBeVisible({ timeout: 30_000 });
  await expect(async () => {
    await users.getByRole('searchbox').fill(name);
    await expect(users.locator('cometchat-user-item').filter({ hasText: name })).toBeVisible({ timeout: 3_000 });
  }).toPass({ timeout: 30_000 });
  await users.locator('cometchat-user-item').filter({ hasText: name }).click();
  await expect(page.locator('cometchat-message-header')).toContainText(name, { timeout: 15_000 });
}

/** As the primary user, open the chat with `peer` and start a voice or video call. */
async function startCall(page: Page, peerName: string, kind: 'Voice call' | 'Video call' = 'Voice call') {
  await loginToApp(page);
  await openConversation(page, peerName);
  await scrollToLatestMessage(page);
  await page.locator('cometchat-message-header cometchat-call-buttons').getByRole('button', { name: kind }).click();
  await expect(outgoing(page)).toContainText(peerName, { timeout: 15_000 });
}

/** Wait for the incoming call on the callee and return its popup. */
async function expectIncoming(callee: Page, callerName: string) {
  await expect(incoming(callee)).toContainText(callerName, { timeout: 30_000 });
  await expect(incoming(callee)).toContainText('Incoming Call');
  return incoming(callee);
}

test.describe('1:1 calls', () => {
  test('a voice call: the callee accepts, both join the call, and leaving ends it for both', async ({ page, browser }) => {
    const callee = await loginInNewContext(browser, SECONDARY_USER);
    try {
      const [calleeName, callerName] = await Promise.all([getUserName(SECONDARY_USER), getUserName(PRIMARY_USER)]);
      await startCall(page, calleeName);
      await expect(outgoing(page)).toContainText('Calling...');

      const popup = await expectIncoming(callee.page, callerName);
      await popup.getByRole('button', { name: 'Accept' }).click();

      for (const p of [page, callee.page]) {
        await expect(ongoing(p)).toBeVisible({ timeout: 30_000 });
        await expect(ongoing(p).getByRole('button', { name: 'Leave session' })).toBeVisible({ timeout: 30_000 });
      }
      await expect(outgoing(page)).toBeHidden();

      await ongoing(page).getByRole('button', { name: 'Leave session' }).click();
      await expect(ongoing(page)).toBeHidden({ timeout: 30_000 });
      await expect(ongoing(callee.page)).toBeHidden({ timeout: 30_000 });
    } finally {
      await callee.context.close();
    }
  });

  test('microphone mute toggles during a call', async ({ page, browser }) => {
    const callee = await loginInNewContext(browser, SECONDARY_USER);
    try {
      const [calleeName, callerName] = await Promise.all([getUserName(SECONDARY_USER), getUserName(PRIMARY_USER)]);
      await startCall(page, calleeName);
      await (await expectIncoming(callee.page, callerName)).getByRole('button', { name: 'Accept' }).click();
      const call = ongoing(page);
      await expect(call.getByRole('button', { name: 'Mute microphone' })).toBeVisible({ timeout: 30_000 });

      await call.getByRole('button', { name: 'Mute microphone' }).click();
      await expect(call.getByRole('button', { name: /unmute microphone/i })).toBeVisible();
      await call.getByRole('button', { name: /unmute microphone/i }).click();
      await expect(call.getByRole('button', { name: 'Mute microphone' })).toBeVisible();

      await call.getByRole('button', { name: 'Leave session' }).click();
    } finally {
      await callee.context.close();
    }
  });

  test('a video call connects both sides with video', async ({ page, browser }) => {
    const callee = await loginInNewContext(browser, SECONDARY_USER);
    try {
      const [calleeName, callerName] = await Promise.all([getUserName(SECONDARY_USER), getUserName(PRIMARY_USER)]);
      await startCall(page, calleeName, 'Video call');
      await (await expectIncoming(callee.page, callerName)).getByRole('button', { name: 'Accept' }).click();

      for (const p of [page, callee.page]) {
        await expect(ongoing(p).locator('video').first()).toBeVisible({ timeout: 30_000 });
      }
      await ongoing(page).getByRole('button', { name: 'Leave session' }).click();
    } finally {
      await callee.context.close();
    }
  });

  test('the callee declines: both sides close the call screens @smoke', async ({ page, browser }) => {
    const callee = await loginInNewContext(browser, SECONDARY_USER);
    try {
      const [calleeName, callerName] = await Promise.all([getUserName(SECONDARY_USER), getUserName(PRIMARY_USER)]);
      await startCall(page, calleeName);

      const popup = await expectIncoming(callee.page, callerName);
      await popup.getByRole('button', { name: 'Decline' }).click();

      await expect(incoming(callee.page)).toBeHidden({ timeout: 15_000 });
      await expect(outgoing(page)).toBeHidden({ timeout: 30_000 });
      await expect(ongoing(page)).toBeHidden();
    } finally {
      await callee.context.close();
    }
  });

  test('the caller cancels: the incoming call disappears for the callee', async ({ page, browser }) => {
    const callee = await loginInNewContext(browser, SECONDARY_USER);
    try {
      const [calleeName, callerName] = await Promise.all([getUserName(SECONDARY_USER), getUserName(PRIMARY_USER)]);
      await startCall(page, calleeName);
      await expectIncoming(callee.page, callerName);

      await outgoing(page).getByRole('button').first().click();

      await expect(outgoing(page)).toBeHidden({ timeout: 15_000 });
      await expect(incoming(callee.page)).toBeHidden({ timeout: 30_000 });
    } finally {
      await callee.context.close();
    }
  });

  test('a third caller gets "busy" while the callee is already on a call', async ({ page, browser }) => {
    const callee = await loginInNewContext(browser, SECONDARY_USER);
    const third = await loginInNewContext(browser, THIRD_USER);
    try {
      const [calleeName, callerName] = await Promise.all([getUserName(SECONDARY_USER), getUserName(PRIMARY_USER)]);
      await startCall(page, calleeName);
      await (await expectIncoming(callee.page, callerName)).getByRole('button', { name: 'Accept' }).click();
      await expect(ongoing(callee.page)).toBeVisible({ timeout: 30_000 });

      await openChatFromUsers(third.page, calleeName); // the third user has no existing chat with them
      await third.page.locator('cometchat-message-header cometchat-call-buttons').getByRole('button', { name: 'Voice call' }).click();

      // The busy callee is not interrupted, and the third caller's outgoing screen closes.
      await expect(incoming(callee.page)).toBeHidden();
      await expect(outgoing(third.page)).toBeHidden({ timeout: 30_000 });
      await ongoing(page).getByRole('button', { name: 'Leave session' }).click();
    } finally {
      await third.context.close();
      await callee.context.close();
    }
  });

  test('a finished call appears in Calls and as a call bubble in the chat', async ({ page, browser }) => {
    const callee = await loginInNewContext(browser, SECONDARY_USER);
    try {
      const [calleeName, callerName] = await Promise.all([getUserName(SECONDARY_USER), getUserName(PRIMARY_USER)]);
      await startCall(page, calleeName);
      await (await expectIncoming(callee.page, callerName)).getByRole('button', { name: 'Accept' }).click();
      await expect(ongoing(page).getByRole('button', { name: 'Leave session' })).toBeVisible({ timeout: 30_000 });
      await ongoing(page).getByRole('button', { name: 'Leave session' }).click();
      await expect(ongoing(page)).toBeHidden({ timeout: 30_000 });

      // A call action bubble in the chat (calls render as action bubbles).
      await expect(
        page.locator('cometchat-messages cometchat-message-list cometchat-action-bubble').last()
      ).toBeVisible({ timeout: 30_000 });

      // The newest call log is with the callee.
      await page.getByLabel('Navigation tabs').getByRole('tab', { name: 'Calls' }).click();
      const logs = page.locator('cometchat-call-logs');
      await expect(logs.locator('.cometchat-list-item, cometchat-list-item').first()).toContainText(calleeName, {
        timeout: 30_000,
      });
    } finally {
      await callee.context.close();
    }
  });
});

test.describe('Group calls', () => {
  test('starting a group call posts a Join bubble, and a member can join the call', async ({ page, browser }) => {
    const runId = uniqueTag();
    const groupName = `E2E Call ${runId}`;
    await createE2EGroup(`e2e-call-${runId}`, groupName, PRIMARY_USER, [PRIMARY_USER, SECONDARY_USER]);
    const member = await loginInNewContext(browser, SECONDARY_USER);
    try {
      await loginToApp(page);
      await openConversation(page, groupName);
      await page.locator('cometchat-message-header cometchat-call-buttons').getByRole('button', { name: 'Video call' }).click();
      await expect(ongoing(page).getByRole('button', { name: 'Leave session' })).toBeVisible({ timeout: 30_000 });

      await openConversation(member.page, groupName);
      const join = member.page.locator('cometchat-call-bubble').last().getByRole('button', { name: 'Join' });
      await expect(join).toBeVisible({ timeout: 30_000 });
      await join.click();
      await expect(ongoing(member.page).getByRole('button', { name: 'Leave session' })).toBeVisible({ timeout: 30_000 });

      await ongoing(member.page).getByRole('button', { name: 'Leave session' }).click();
      await ongoing(page).getByRole('button', { name: 'Leave session' }).click();
    } finally {
      await member.context.close();
    }
  });

  test('a group voice call posts a "Voice call" Join bubble, and a member can join it', async ({ page, browser }) => {
    const runId = uniqueTag();
    const groupName = `E2E Voice Call ${runId}`;
    await createE2EGroup(`e2e-voice-call-${runId}`, groupName, PRIMARY_USER, [PRIMARY_USER, SECONDARY_USER]);
    const member = await loginInNewContext(browser, SECONDARY_USER);
    try {
      await loginToApp(page);
      await openConversation(page, groupName);
      await page.locator('cometchat-message-header cometchat-call-buttons').getByRole('button', { name: 'Voice call' }).click();
      await expect(ongoing(page).getByRole('button', { name: 'Leave session' })).toBeVisible({ timeout: 30_000 });

      await openConversation(member.page, groupName);
      const bubble = member.page.locator('cometchat-call-bubble').last();
      await expect(bubble).toContainText(/voice call/i, { timeout: 30_000 });
      await bubble.getByRole('button', { name: 'Join' }).click();
      await expect(ongoing(member.page).getByRole('button', { name: 'Leave session' })).toBeVisible({ timeout: 30_000 });

      await ongoing(member.page).getByRole('button', { name: 'Leave session' }).click();
      await ongoing(page).getByRole('button', { name: 'Leave session' }).click();
    } finally {
      await member.context.close();
    }
  });
});

test.describe('Accessibility', () => {
  test("the outgoing call's cancel button names who is being called", async ({ page }) => {
    // Known UI Kit defect (ENG-40813): the cancel button's accessible name is the raw template
    // "Cancel call to {name}" — the placeholder is never filled in. Expected to fail until fixed.
    test.fail();
    const calleeName = await getUserName(SECONDARY_USER);
    await startCall(page, calleeName);

    try {
      await expect(outgoing(page).getByRole('button', { name: `Cancel call to ${calleeName}` })).toBeVisible({
        timeout: 5_000,
      });
    } finally {
      // Always cancel, so the call doesn't keep ringing into the next test.
      await outgoing(page).locator('.cometchat-outgoing-call__button').getByRole('button').click();
      await expect(outgoing(page)).toBeHidden({ timeout: 15_000 });
    }
  });
});

// Last in the file: while the bug exists, the extra session it opens refuses every later call
// for the primary user as "busy", so it must run after the other call tests and close it.
test.describe('Signed in on two devices', () => {
  test("a call you make doesn't ring on your other device, and you can call again afterwards", async ({
    page,
    browser,
  }) => {
    // Known UI Kit defect (incoming-call.service.ts, ENG-40814): a call started by the logged-in user rings
    // as an incoming call on that user's other sessions, the popup is never cleared when the
    // call is answered or ends, and while it is stuck that session rejects every new call for
    // the user as "busy". Expected to fail until fixed.
    test.fail();
    const otherDevice = await loginInNewContext(browser, PRIMARY_USER);
    const callee = await loginInNewContext(browser, SECONDARY_USER);
    try {
      const [calleeName, callerName] = await Promise.all([getUserName(SECONDARY_USER), getUserName(PRIMARY_USER)]);
      await startCall(page, calleeName);
      await expect(incoming(otherDevice.page)).toBeHidden({ timeout: 5_000 });

      await (await expectIncoming(callee.page, callerName)).getByRole('button', { name: 'Accept' }).click();
      await ongoing(page).getByRole('button', { name: 'Leave session' }).click({ timeout: 30_000 });
      await expect(ongoing(callee.page)).toBeHidden({ timeout: 30_000 });

      // A second call must still connect.
      await page.locator('cometchat-message-header cometchat-call-buttons').getByRole('button', { name: 'Voice call' }).click();
      await (await expectIncoming(callee.page, callerName)).getByRole('button', { name: 'Accept' }).click();
      await expect(ongoing(page).getByRole('button', { name: 'Leave session' })).toBeVisible({ timeout: 30_000 });
      await ongoing(page).getByRole('button', { name: 'Leave session' }).click();
    } finally {
      await otherDevice.context.close();
      await callee.context.close();
    }
  });
});
