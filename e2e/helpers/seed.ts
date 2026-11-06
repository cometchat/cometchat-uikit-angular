/**
 * E2E Data Seeding Helper
 *
 * Uses CometChat REST API to:
 * 1. Seed fresh test data (users, groups, messages) before each test run
 * 2. Permanently delete ALL E2E-created data after tests complete
 *
 * Design principles:
 * - 30 E2E users are ALWAYS deleted and recreated fresh on every run
 * - 3 groups are ALWAYS deleted and recreated fresh on every run
 * - An isolated run (E2E_RUN_ID set) also creates its own 3 login users and deletes them after
 * - Permanent fixture users (cometchat-uid-1..5) are NEVER deleted
 * - All E2E-created entities are tagged with E2E_TAG for reliable cleanup
 * - Cleanup runs in globalTeardown AND at the start of seedTestData (double-clean)
 *
 * API Base: https://{appId}.api-{region}.cometchat.io/v3
 */

import { environment } from '../../projects/sample-app/src/environments/environment';
import { fetchWithRateLimit, sendTextAs, uniqueTag } from './rest';
import { E2E_ISOLATED, E2E_RUN_ID, E2E_RUN_TAG, E2E_TAG, E2E_TAGS, runScoped } from './run';

// Credentials: environment variables take priority (for CI), fall back to environment.ts
const APP_ID = process.env['E2E_APP_ID'] || environment.appId;
const REGION = process.env['E2E_REGION'] || environment.region;
const API_KEY = process.env['E2E_API_KEY'] || environment.apiKey;
const API_BASE = `https://${APP_ID}.api-${REGION}.cometchat.io/v3`;

const HEADERS = {
  'Content-Type': 'application/json',
  'apikey': API_KEY,
};

/** Permanent fixture users — never deleted */
export const TEST_USERS = ['cometchat-uid-1', 'cometchat-uid-2', 'cometchat-uid-3', 'cometchat-uid-4', 'cometchat-uid-5'];

/**
 * The run's login users. An isolated run (E2E_RUN_ID set, see ./run.ts) creates its own three
 * in global setup, named after the run so two runs' users never look alike; a local run uses
 * the sample users. PRIMARY_USER is who the specs log in as, SECONDARY_USER the other side of
 * the seeded 1:1 chat, THIRD_USER a third person for groups and other chats.
 */
const RUN_USERS = [
  { uid: runScoped('alice'), name: `Alice ${E2E_RUN_ID}` },
  { uid: runScoped('bob'), name: `Bob ${E2E_RUN_ID}` },
  { uid: runScoped('carol'), name: `Carol ${E2E_RUN_ID}` },
];
export const PRIMARY_USER = E2E_ISOLATED ? RUN_USERS[0].uid : TEST_USERS[0];
export const SECONDARY_USER = E2E_ISOLATED ? RUN_USERS[1].uid : TEST_USERS[1];
export const THIRD_USER = E2E_ISOLATED ? RUN_USERS[2].uid : TEST_USERS[2];

/** Names of the three standard test groups; an isolated run adds its id, as other runs' public groups are visible. */
export const E2E_GROUP_NAMES = {
  public: E2E_ISOLATED ? `E2E Public Group ${E2E_RUN_ID}` : 'E2E Public Group',
  private: E2E_ISOLATED ? `E2E Private Group ${E2E_RUN_ID}` : 'E2E Private Group',
  password: E2E_ISOLATED ? `E2E Password Group ${E2E_RUN_ID}` : 'E2E Password Group',
} as const;

/** GUIDs of the three standard test groups, scoped to this run (see ./run.ts). */
export const E2E_GROUP_GUIDS = {
  public: runScoped('public-group'),
  private: runScoped('private-group'),
  password: runScoped('password-group'),
} as const;

/**
 * 30 filler users that make the Users list long enough to scroll and paginate. They are SHARED,
 * permanent fixtures (tag `e2e-fixture`, never `e2e-test-data`): created once if missing and never
 * deleted, because no test changes them and the E2E app's free plan allows only 100 users. Per-run
 * copies (30 x 4 shards) exhausted that quota. Only a run's login users, groups and the few users
 * a test creates are per run.
 */
const E2E_USER_COUNT = 30;
const E2E_FIXTURE_TAG = 'e2e-fixture';
export function getE2EUserUid(index: number): string {
  return `e2e-user-${String(index + 1).padStart(2, '0')}`;
}
/** Display name of filler user `index` (0-based), e.g. `E2E User 01`. */
export function getE2EUserName(index: number): string {
  return `E2E User ${String(index + 1).padStart(2, '0')}`;
}
export const E2E_USER_UIDS: string[] = Array.from({ length: E2E_USER_COUNT }, (_, i) => getE2EUserUid(i));

// ─── API helpers ─────────────────────────────────────────────────────────────

async function apiCall(
  method: string,
  path: string,
  body?: object,
  extraHeaders: Record<string, string> = {}
): Promise<any> {
  const res = await fetchWithRateLimit(`${API_BASE}${path}`, {
    method,
    headers: { ...HEADERS, ...extraHeaders },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    console.warn(`[seed] ${method} ${path} → ${res.status}: ${text.substring(0, 200)}`);
    return null;
  }
  return res.json().catch(() => null);
}

// ─── User operations ──────────────────────────────────────────────────────────

async function createUser(uid: string, name: string, tags: string[] = E2E_TAGS): Promise<void> {
  // PUT only updates an existing user (404 for a new UID), so create with POST and
  // fall back to PUT when the user is left over from a run whose permanent
  // deletion wasn't supported.
  const created = await apiCall('POST', '/users', { uid, name, tags });
  if (created) return;
  await apiCall('PUT', `/users/${uid}`, {
    name,
    tags,
    deactivated: false, // reactivate if previously deactivated
  });
}

/** Create any of the 30 shared filler users that don't exist yet (see E2E_USER_COUNT). */
async function ensureFixtureUsers(): Promise<number> {
  const data = await apiCall('GET', `/users?perPage=100&tags=${E2E_FIXTURE_TAG}`);
  const existing = new Set<string>((data?.data || []).map((u: any) => u.uid));
  const missing = E2E_USER_UIDS.map((uid, i) => ({ uid, name: getE2EUserName(i) })).filter((u) => !existing.has(u.uid));
  for (let i = 0; i < missing.length; i += 5) {
    await Promise.all(missing.slice(i, i + 5).map((u) => createUser(u.uid, u.name, [E2E_FIXTURE_TAG])));
  }
  return missing.length;
}

async function deleteUserPermanently(uid: string): Promise<void> {
  // Try permanent delete first; if not supported by the plan, deactivate instead
  // `permanent` must be sent in the body; as a query parameter the API rejects it (400).
  const result = await apiCall('DELETE', `/users/${uid}`, { permanent: true });
  if (!result) {
    // Fallback: deactivate the user (soft delete — supported on all plans)
    await apiCall('PUT', `/users/${uid}`, { deactivated: true });
  }
}

/** UIDs of the users this run created (tagged E2E_RUN_TAG). */
async function getE2EUsers(): Promise<string[]> {
  const data = await apiCall('GET', `/users?perPage=100&tags=${E2E_RUN_TAG}`);
  return (data?.data || []).map((u: any) => u.uid);
}

// ─── Group operations ─────────────────────────────────────────────────────────

async function createGroup(
  guid: string,
  name: string,
  type: 'public' | 'private' | 'password',
  password?: string
): Promise<void> {
  await apiCall('POST', '/groups', {
    guid,
    name,
    type,
    ...(password ? { password } : {}),
    tags: E2E_TAGS,
  });
}

async function deleteGroup(guid: string): Promise<void> {
  await apiCall('DELETE', `/groups/${guid}`);
}

/** GUIDs of the groups this run created (tagged E2E_RUN_TAG). */
async function getE2EGroups(): Promise<string[]> {
  const data = await apiCall('GET', `/groups?tags=${E2E_RUN_TAG}&perPage=100`);
  return (data?.data || []).map((g: any) => g.guid);
}

/**
 * Delete E2E data (shared tag) created more than `maxAgeHours` ago by any run: what a
 * cancelled run, whose teardown never ran, left behind. Never touches the fixture users, and
 * never anything newer, so a run that is still going keeps its data.
 */
export async function sweepStaleE2EData(maxAgeHours = 24): Promise<number> {
  const cutoff = Math.floor(Date.now() / 1000) - maxAgeHours * 3600;
  const isStale = (e: { createdAt?: number }) => typeof e.createdAt === 'number' && e.createdAt < cutoff;
  let swept = 0;
  const groups = await apiCall('GET', `/groups?tags=${E2E_TAG}&perPage=100`);
  for (const g of (groups?.data || []).filter(isStale)) {
    await deleteGroup(g.guid);
    swept++;
  }
  // Groups created through the app's UI carry no tags; their tests name them "E2E …" and
  // delete them in a finally block. If a test crashed first, the name catches them here.
  const named = await apiCall('GET', `/groups?searchKey=E2E&perPage=100`);
  for (const g of (named?.data || []).filter((g: any) => /^E2E /.test(g.name || '') && isStale(g))) {
    await deleteGroup(g.guid);
    swept++;
  }
  const users = await apiCall('GET', `/users?tags=${E2E_TAG}&perPage=100`);
  for (const u of (users?.data || []).filter(isStale)) {
    if (TEST_USERS.includes(u.uid)) continue;
    await deleteUserPermanently(u.uid);
    swept++;
  }
  return swept;
}

// ─── Message operations ───────────────────────────────────────────────────────

/**
 * Messages in the 1:1 chat between `uidA` and `uidB` that a user sees (not deleted, not
 * blocked by moderation), counting at most the latest 100. The API's message list gives no
 * total, only cursors, so count the latest page.
 */
async function getMessageCount(uidA: string, uidB: string): Promise<number> {
  const conversationId = [uidA, uidB].sort().join('_user_');
  const res = await apiCall('GET', `/messages?conversationId=${conversationId}&perPage=100`);
  return ((res?.data ?? []) as { category: string; deletedAt?: number; data?: { moderation?: { status?: string } } }[])
    .filter((m) => m.category === 'message' && !m.deletedAt && m.data?.moderation?.status !== 'disapproved')
    .length;
}

/**
 * Permanently delete the messages moderation blocked in the 1:1 chat between `uidA` and
 * `uidB`, newest first, until the latest page is clean. A blocked message stays in the
 * sender's chat with a different menu, so leftovers from earlier runs would change what
 * the specs see in the seeded chat.
 */
async function deleteBlockedMessages(uidA: string, uidB: string): Promise<number> {
  const conversationId = [uidA, uidB].sort().join('_user_');
  let deleted = 0;
  for (let page = 0; page < 20; page++) {
    const res = await apiCall('GET', `/messages?conversationId=${conversationId}&perPage=100`);
    const blocked = ((res?.data ?? []) as { id: number; sender: string; data?: { moderation?: { status?: string } } }[])
      .filter((m) => m.data?.moderation?.status === 'disapproved');
    if (!blocked.length) break;
    let deletedThisPass = 0;
    for (let i = 0; i < blocked.length; i += 10) {
      const results = await Promise.all(
        blocked.slice(i, i + 10).map((m) =>
          apiCall('DELETE', `/messages/${m.id}`, { permanent: true }, { onBehalfOf: m.sender })
        )
      );
      deletedThisPass += results.filter((r) => r !== null).length;
    }
    deleted += deletedThisPass;
    // Deletes are failing (apiCall has logged why); re-reading the same page won't help.
    if (!deletedThisPass) break;
  }
  return deleted;
}

/**
 * Unpin every pinned message in the 1:1 chat between `uidA` and `uidB`.
 *
 * A conversation holds only a few pins (the app's cap is 5), and the specs that pin
 * leave their pins behind. Without this, pins from earlier runs fill the cap and every
 * later pin is refused with ERR_PINNED_MESSAGES_LIMIT_EXCEEDED.
 */
async function unpinAllMessages(uidA: string, uidB: string): Promise<number> {
  const conversationId = [uidA, uidB].sort().join('_user_');
  const res = await apiCall(
    'GET',
    `/messages?conversationId=${conversationId}&pinned=1&perPage=100`,
    undefined,
    { onBehalfOf: uidA }
  );
  const pinned = (res?.data ?? []) as { id: number }[];
  const results = await Promise.all(
    pinned.map((m) => apiCall('DELETE', `/messages/${m.id}/pin`, undefined, { onBehalfOf: uidA }))
  );
  return results.filter((r) => r !== null).length;
}

/**
 * Unsave every message `uid` has saved. Saves are capped per user (5 on the E2E app)
 * and the save specs leave theirs behind, so leftovers would refuse every later save.
 */
async function unsaveAllMessages(uid: string): Promise<number> {
  const res = await apiCall('GET', '/messages?saved=1&perPage=100', undefined, { onBehalfOf: uid });
  const saved = (res?.data ?? []) as { id: number }[];
  const results = await Promise.all(
    saved.map((m) => apiCall('DELETE', `/messages/${m.id}/save`, undefined, { onBehalfOf: uid }))
  );
  return results.filter((r) => r !== null).length;
}

// ─── Core cleanup ─────────────────────────────────────────────────────────────

/**
 * Delete all E2E-created groups and users.
 * Called both at the START of seedTestData (pre-clean) and in globalTeardown (post-clean).
 */
async function deleteAllE2EData(): Promise<void> {
  // Only this run's data: another run may be using its own users and groups right now.
  const groups = await getE2EGroups();
  for (const guid of groups) {
    console.log(`[seed] Deleting group: ${guid}`);
    await deleteGroup(guid);
  }

  const users = (await getE2EUsers()).filter((uid) => !TEST_USERS.includes(uid));
  for (const uid of users) {
    await deleteUserPermanently(uid);
  }

  if (groups.length + users.length > 0) {
    console.log(`[seed] Deleted ${groups.length} groups and ${users.length} users of run ${E2E_RUN_TAG}.`);
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Seed fresh test data before the test suite.
 *
 * Always:
 * 1. Deletes any data this run left behind earlier (pre-clean)
 * 2. Makes sure the 30 shared filler users (e2e-user-01 through -30, tag `e2e-fixture`) exist,
 *    and in an isolated run creates its login users (PRIMARY_USER, SECONDARY_USER, THIRD_USER)
 * 3. Creates this run's 3 standard test groups fresh
 * 4. Clears moderation-blocked messages and pins from the PRIMARY/SECONDARY chat, and PRIMARY's saves
 * 5. Ensures at least 50 messages exist between PRIMARY_USER and SECONDARY_USER
 */
export async function seedTestData(): Promise<void> {
  console.log('[seed] Starting pre-run cleanup and seeding...');

  // Step 1: Delete this run's leftovers (a retried attempt) and any run's data older than 24 h
  await deleteAllE2EData();
  const swept = await sweepStaleE2EData();
  if (swept) console.log(`[seed] Swept ${swept} stale entities left by earlier runs.`);

  // Step 2: Make sure the 30 shared filler users exist (created once, never deleted)
  const createdFixtures = await ensureFixtureUsers();
  console.log(`[seed] Filler users: ${E2E_USER_COUNT - createdFixtures} present, ${createdFixtures} created.`);

  // Step 2b: An isolated run's own login users (tagged with the run, so teardown deletes them)
  if (E2E_ISOLATED) {
    await Promise.all(RUN_USERS.map((u) => createUser(u.uid, u.name)));
    console.log(`[seed] Created login users ${RUN_USERS.map((u) => u.uid).join(', ')}.`);
  }

  // Step 3: Create test groups fresh
  const groups = [
    { guid: E2E_GROUP_GUIDS.public, name: E2E_GROUP_NAMES.public, type: 'public' as const },
    { guid: E2E_GROUP_GUIDS.private, name: E2E_GROUP_NAMES.private, type: 'private' as const },
    { guid: E2E_GROUP_GUIDS.password, name: E2E_GROUP_NAMES.password, type: 'password' as const, password: 'test123' },
  ];

  for (const group of groups) {
    console.log(`[seed] Creating group: ${group.guid}`);
    await createGroup(group.guid, group.name, group.type, group.password);
  }

  // Step 4: Clear messages moderation blocked from the primary/secondary chat
  const blocked = await deleteBlockedMessages(PRIMARY_USER, SECONDARY_USER);
  if (blocked) console.log(`[seed] Deleted ${blocked} moderation-blocked messages.`);

  // Step 4b: Clear pins and saves left by earlier runs, so the pin/save specs start under the caps
  const unpinned = await unpinAllMessages(PRIMARY_USER, SECONDARY_USER);
  if (unpinned) console.log(`[seed] Unpinned ${unpinned} messages.`);
  const unsaved = await unsaveAllMessages(PRIMARY_USER);
  if (unsaved) console.log(`[seed] Unsaved ${unsaved} messages.`);

  // Step 5: Ensure enough messages exist between primary and secondary users
  const msgCount = await getMessageCount(PRIMARY_USER, SECONDARY_USER);
  const needed = Math.max(0, 50 - msgCount);

  if (needed > 0) {
    console.log(`[seed] Seeding ${needed} messages between ${PRIMARY_USER} and ${SECONDARY_USER}...`);
    const msgBatchSize = 5;
    let failed = 0;
    for (let i = 0; i < needed; i += msgBatchSize) {
      const batch = Math.min(msgBatchSize, needed - i);
      // One message that fails to send or that moderation blocks/holds must not abort
      // global setup (and with it the whole run): log it and keep seeding.
      const results = await Promise.allSettled(
        Array.from({ length: batch }, (_, j) =>
          sendTextAs(
            (i + j) < needed / 2 ? PRIMARY_USER : SECONDARY_USER,
            (i + j) < needed / 2 ? SECONDARY_USER : PRIMARY_USER,
            `E2E seed message ${i + j + 1} [${uniqueTag()}]`
          )
        )
      );
      for (const r of results) {
        if (r.status === 'rejected') {
          failed++;
          console.warn(`[seed] Seed message not sent: ${(r.reason as Error)?.message ?? r.reason}`);
        }
      }
      await new Promise(r => setTimeout(r, 200));
    }
    console.log(`[seed] Seeded ${needed - failed} of ${needed} messages${failed ? ` (${failed} failed)` : ''}.`);
  } else {
    console.log(`[seed] Messages OK (${msgCount} existing).`);
  }

  console.log(`[seed] Test data ready: ${E2E_USER_COUNT} shared filler users, 3 groups for run ${E2E_RUN_ID}.`);
}

/**
 * Clean up all E2E-created test data after the test suite.
 *
 * Permanently deletes this run's data only (another run may be using its own right now):
 * - the groups this run created
 * - the users this run created (an isolated run's login users, users a test created)
 * Never the 30 shared filler users (`e2e-fixture`) or the permanent sample users.
 *
 * Note: Permanently deleting a user also permanently deletes all their
 * messages and conversations — no need to delete messages separately.
 */
export async function cleanupTestData(): Promise<void> {
  console.log('[seed] Running post-run cleanup...');
  await deleteAllE2EData();
  console.log('[seed] Post-run cleanup complete.');
}
