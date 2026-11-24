/**
 * Offline-OFF baseline (offline TEST-PLAN §5, UIT-OFF-01, UIK-GATE-02).
 *
 * One scripted session with offline OFF, walked step by step against the fake
 * server. Each step records the server's request log and the kit's public events
 * (names and payloads). `OFF_BASELINE_MODE=record` writes them for the baseline
 * kit; `compare` (default) replays them on this branch and fails on any
 * difference beyond the ruled OFF changes in `normalize.ts`.
 *
 * Run through scripts/offline/off-baseline.sh, in the E2E phase.
 */
import { test, expect, Page, APIRequestContext } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import {
  bubble, chooseOption, composerInput, confirmDelete, control, expectNothingFor, FIXTURES, lastSeq, offline, online, openChat, send,
  serverRequests,
} from '../offline/helpers';
import { Baseline, compareBaselines, eventLine, normalizeRequests, RecordedStep } from './normalize';

const MODE = process.env['OFF_BASELINE_MODE'] ?? 'compare';
const KIT_LABEL = process.env['OFF_BASELINE_LABEL'] ?? 'dev-v5';
const FILE = path.join(__dirname, 'baselines', `${KIT_LABEL}.json`);
const CURRENT = path.join(__dirname, 'baselines', `${KIT_LABEL}.current.json`);

/** Long enough for the step's requests and events to land; there is no signal for "nothing more". */
const SETTLE_MS = 2_500;

class Recorder {
  readonly steps: RecordedStep[] = [];
  private seq = 0;
  private eventCount = 0;
  constructor(private readonly page: Page, private readonly request: APIRequestContext) {}

  private async events(): Promise<Array<{ name: string; payload: unknown }>> {
    return this.page.evaluate(() => (globalThis as any).__ccEvents ?? []);
  }

  /** A reload or navigation restarts the page's log. */
  restartEvents(): void { this.eventCount = 0; }

  async step(name: string, run: () => Promise<void>): Promise<void> {
    await run();
    await expectNothingFor(this.page, SETTLE_MS, 'the step\'s requests and events have landed and nothing more follows');
    const requests = (await serverRequests(this.request)).filter(r => (Number(r.seq) || 0) > this.seq);
    this.seq = await lastSeq(this.request);
    const all = await this.events();
    const events = all.slice(this.eventCount);
    this.eventCount = all.length;
    this.steps.push({ step: name, requests: normalizeRequests(requests), events: events.map(eventLine) });
  }
}

test('offline off: the walkthrough equals the baseline release (requests, event names and payloads)', async ({ page, request, context }) => {
  test.setTimeout(300_000);
  await control(request, '/reset', { fixtures: { ...FIXTURES, groups: [{ guid: 'crew', members: ['alex', 'sam'] }] } });
  await context.clearCookies();
  const rec = new Recorder(page, request);

  await rec.step('login and conversation list', async () => {
    await page.goto('/login?offline=0');
    await page.locator('#customUid').fill('alex');
    await page.locator('.cometchat-login__submit-button').click();
    await expect(page.locator('cometchat-conversations .cometchat-conversation-item').first()).toBeVisible({ timeout: 45_000 });
  });
  await rec.step('open a chat', async () => { await openChat(page, 'sam'); await expect(bubble(page, 'message 4')).toBeVisible(); });
  await rec.step('send text', async () => { await send(page, 'baseline text'); await expect(bubble(page, 'baseline text')).toBeVisible(); });
  await rec.step('reply', async () => {
    await chooseOption(page, 'message 4', /reply/i);
    await send(page, 'baseline reply');
    await expect(bubble(page, 'baseline reply')).toBeVisible();
  });
  await rec.step('edit', async () => {
    await chooseOption(page, 'baseline text', /edit/i);
    const input = composerInput(page);
    await input.press('End');
    await input.pressSequentially(' edited');
    await input.press('Enter');
    await expect(bubble(page, 'baseline text edited')).toBeVisible();
  });
  await rec.step('react', async () => {
    await chooseOption(page, 'message 4', /react/i);
    await page.getByRole('dialog', { name: 'Emoji picker' }).getByRole('gridcell').first().click();
  });
  await rec.step('receive a message', async () => {
    await control(request, '/push', { frame: 'message', from: 'sam', toUser: 'alex', text: 'baseline incoming' });
    await expect(bubble(page, 'baseline incoming')).toBeVisible();
  });
  await rec.step('delete', async () => {
    await chooseOption(page, 'baseline reply', /delete/i);
    await confirmDelete(page);
  });
  await rec.step('users', async () => {
    await page.locator('#tab-users').click();
    await expect(page.locator('cometchat-users .cometchat-users__list-item-wrapper').first()).toBeVisible({ timeout: 30_000 });
  });
  await rec.step('groups', async () => {
    await page.locator('#tab-groups').click();
    await expect(page.locator('cometchat-groups', { hasText: /crew/i }).first()).toBeVisible({ timeout: 30_000 });
  });
  await rec.step('back to chats', async () => {
    await page.locator('#tab-chats').click();
    await openChat(page, 'sam');
  });
  await rec.step('socket drop and reconnect: today\'s catch-up', async () => {
    await control(request, '/socket', { action: 'drop' });
    await expectNothingFor(page, 8_000, 'the reconnect and its catch-up requests have all been made');
  });
  await rec.step('device offline: a send fails as today', async () => {
    await offline(request);
    await send(page, 'baseline offline send');
    // No assertion on the receipt: the baseline keeps the clock here (D3), this branch shows the error tick.
    await expect(bubble(page, 'baseline offline send')).toBeVisible();
    await expectNothingFor(page, 8_000, 'the failed send is not retried while the device stays offline');
    await online(request);
    await expectNothingFor(page, 8_000, 'the reconnect has settled and the failed send is not delivered');
  });
  await rec.step('logout', async () => {
    await page.locator('.cometchat-selector__menu-button').first().click();
    await page.locator('.cometchat-selector__context-menu-item--danger').first().click();
    await expect(page.locator('#customUid')).toBeVisible({ timeout: 30_000 });
  });
  await rec.step('login as another user', async () => {
    await page.locator('#customUid').fill('bea');
    await page.locator('.cometchat-login__submit-button').click();
    await expect(page.locator('cometchat-conversations .cometchat-conversation-item').first()).toBeVisible({ timeout: 45_000 });
  });

  const current: Baseline = { kit: KIT_LABEL, recordedAt: new Date().toISOString(), steps: rec.steps };
  if (MODE === 'record') {
    fs.mkdirSync(path.dirname(FILE), { recursive: true });
    fs.writeFileSync(FILE, JSON.stringify(current, null, 2));
    return;
  }
  fs.writeFileSync(CURRENT, JSON.stringify(current, null, 2));
  expect(fs.existsSync(FILE), `no baseline at ${FILE}: run scripts/offline/off-baseline.sh record first`).toBe(true);
  const baseline: Baseline = JSON.parse(fs.readFileSync(FILE, 'utf8'));
  const diffs = compareBaselines(baseline, current);
  expect(diffs, JSON.stringify(diffs, null, 2)).toEqual([]);
});
