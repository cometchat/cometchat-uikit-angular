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
 * - Permanent fixture users (cometchat-uid-1..5) are NEVER deleted
 * - All E2E-created entities are tagged with E2E_TAG for reliable cleanup
 * - Cleanup runs in globalTeardown AND at the start of seedTestData (double-clean)
 *
 * API Base: https://{appId}.api-{region}.cometchat.io/v3
 */

import { environment } from '../../projects/sample-app/src/environments/environment';

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
export const PRIMARY_USER = TEST_USERS[0];
export const SECONDARY_USER = TEST_USERS[1];

/** Tag applied to every E2E-created group/user for reliable cleanup */
const E2E_TAG = 'e2e-test-data';

/** Fixed GUIDs for the three standard test groups */
export const E2E_GROUP_GUIDS = {
  public: 'e2e-public-group',
  private: 'e2e-private-group',
  password: 'e2e-password-group',
} as const;

/** 30 E2E users created fresh each run */
const E2E_USER_COUNT = 30;
export function getE2EUserUid(index: number): string {
  return `e2e-user-${String(index + 1).padStart(2, '0')}`;
}
export const E2E_USER_UIDS: string[] = Array.from({ length: E2E_USER_COUNT }, (_, i) => getE2EUserUid(i));

// ─── API helpers ─────────────────────────────────────────────────────────────

async function apiCall(method: string, path: string, body?: object): Promise<any> {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: HEADERS,
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

async function createUser(uid: string, name: string): Promise<void> {
  // Use PUT (upsert) — creates if not exists, updates if exists.
  // This avoids 400 errors when users already exist from a previous run
  // where permanent deletion wasn't supported.
  await apiCall('PUT', `/users/${uid}`, {
    name,
    tags: [E2E_TAG],
    deactivated: false, // reactivate if previously deactivated
  });
}

async function deleteUserPermanently(uid: string): Promise<void> {
  // Try permanent delete first; if not supported by the plan, deactivate instead
  const result = await apiCall('DELETE', `/users/${uid}?permanent=true`);
  if (!result) {
    // Fallback: deactivate the user (soft delete — supported on all plans)
    await apiCall('PUT', `/users/${uid}`, { deactivated: true });
  }
}

/** Returns UIDs of all users tagged with E2E_TAG */
async function getE2EUsers(): Promise<string[]> {
  const data = await apiCall('GET', `/users?perPage=100&tags=${E2E_TAG}`);
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
    tags: [E2E_TAG],
  });
}

async function deleteGroup(guid: string): Promise<void> {
  await apiCall('DELETE', `/groups/${guid}?permanent=true`);
}

/** Returns GUIDs of all groups tagged with E2E_TAG */
async function getE2EGroups(): Promise<string[]> {
  const data = await apiCall('GET', `/groups?tags=${E2E_TAG}&perPage=100`);
  return (data?.data || []).map((g: any) => g.guid);
}

/** Returns GUIDs of groups whose guid or name matches the E2E test-run pattern */
async function getTestRunGroups(): Promise<string[]> {
  const data = await apiCall('GET', '/groups?perPage=100');
  return (data?.data || [])
    .filter((g: any) => /^E2E_(Public|Private|Password)_/.test(g.guid || g.name || ''))
    .map((g: any) => g.guid);
}

// ─── Message operations ───────────────────────────────────────────────────────

async function getMessageCount(uid: string, receiverUid: string): Promise<number> {
  const data = await apiCall('GET', `/messages?sender=${uid}&receiver=${receiverUid}&receiverType=user&count=1`);
  return data?.meta?.pagination?.total || 0;
}

async function sendMessage(senderUid: string, receiverUid: string, text: string): Promise<void> {
  await apiCall('POST', '/messages', {
    category: 'message',
    type: 'text',
    receiver: receiverUid,
    receiverType: 'user',
    data: { text },
    sender: senderUid,
  });
}

// ─── Core cleanup ─────────────────────────────────────────────────────────────

/**
 * Delete all E2E-created groups and users.
 * Called both at the START of seedTestData (pre-clean) and in globalTeardown (post-clean).
 */
async function deleteAllE2EData(): Promise<void> {
  // Delete tagged groups
  const taggedGroups = await getE2EGroups();
  for (const guid of taggedGroups) {
    console.log(`[seed] Deleting group: ${guid}`);
    await deleteGroup(guid);
  }

  // Delete test-run groups (by name pattern, in case tagging failed)
  const testRunGroups = await getTestRunGroups();
  for (const guid of testRunGroups) {
    if (!taggedGroups.includes(guid)) {
      console.log(`[seed] Deleting test-run group: ${guid}`);
      await deleteGroup(guid);
    }
  }

  // Delete E2E-tagged users — but NEVER the permanent fixture users
  const e2eUsers = await getE2EUsers();
  for (const uid of e2eUsers) {
    if (!TEST_USERS.includes(uid)) {
      console.log(`[seed] Permanently deleting user: ${uid}`);
      await deleteUserPermanently(uid);
    }
  }

  // Also explicitly delete the known E2E user UIDs in case tagging failed
  for (const uid of E2E_USER_UIDS) {
    if (!e2eUsers.includes(uid)) {
      // Try to delete silently — may not exist, that's fine
      await deleteUserPermanently(uid);
    }
  }

  const total = taggedGroups.length + testRunGroups.length + e2eUsers.length;
  if (total > 0) {
    console.log(`[seed] Deleted ${total} E2E entities.`);
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Seed fresh test data before the test suite.
 *
 * Always:
 * 1. Deletes any leftover E2E data from previous runs (pre-clean)
 * 2. Creates 30 fresh E2E users (e2e-user-01 through e2e-user-30)
 * 3. Creates the 3 standard test groups fresh
 * 4. Ensures at least 50 messages exist between uid-1 and uid-2
 */
export async function seedTestData(): Promise<void> {
  console.log('[seed] Starting pre-run cleanup and seeding...');

  // Step 1: Delete any leftover data from previous runs
  await deleteAllE2EData();

  // Step 2: Create 30 fresh E2E users in parallel batches
  console.log(`[seed] Creating ${E2E_USER_COUNT} fresh E2E users...`);
  const batchSize = 5;
  for (let i = 0; i < E2E_USER_COUNT; i += batchSize) {
    const batch = E2E_USER_UIDS.slice(i, i + batchSize);
    await Promise.all(
      batch.map((uid, j) =>
        createUser(uid, `E2E User ${String(i + j + 1).padStart(2, '0')}`)
      )
    );
    await new Promise(r => setTimeout(r, 150)); // avoid rate limiting
  }
  console.log(`[seed] Created ${E2E_USER_COUNT} E2E users.`);

  // Step 3: Create test groups fresh
  const groups = [
    { guid: E2E_GROUP_GUIDS.public, name: 'E2E Public Group', type: 'public' as const },
    { guid: E2E_GROUP_GUIDS.private, name: 'E2E Private Group', type: 'private' as const },
    { guid: E2E_GROUP_GUIDS.password, name: 'E2E Password Group', type: 'password' as const, password: 'test123' },
  ];

  for (const group of groups) {
    console.log(`[seed] Creating group: ${group.guid}`);
    await createGroup(group.guid, group.name, group.type, group.password);
  }

  // Step 4: Ensure enough messages exist between primary and secondary users
  const msgCount = await getMessageCount(PRIMARY_USER, SECONDARY_USER);
  const needed = Math.max(0, 50 - msgCount);

  if (needed > 0) {
    console.log(`[seed] Seeding ${needed} messages between ${PRIMARY_USER} and ${SECONDARY_USER}...`);
    const msgBatchSize = 5;
    for (let i = 0; i < needed; i += msgBatchSize) {
      const batch = Math.min(msgBatchSize, needed - i);
      await Promise.all(
        Array.from({ length: batch }, (_, j) =>
          sendMessage(
            (i + j) < needed / 2 ? PRIMARY_USER : SECONDARY_USER,
            (i + j) < needed / 2 ? SECONDARY_USER : PRIMARY_USER,
            `E2E seed message ${i + j + 1} [${Date.now()}]`
          )
        )
      );
      await new Promise(r => setTimeout(r, 200));
    }
    console.log(`[seed] Seeded ${needed} messages.`);
  } else {
    console.log(`[seed] Messages OK (${msgCount} existing).`);
  }

  console.log(`[seed] Test data ready: ${E2E_USER_COUNT} users + 3 groups created fresh.`);
}

/**
 * Clean up all E2E-created test data after the test suite.
 *
 * Permanently deletes:
 * - All 30 E2E users (e2e-user-01 through e2e-user-30)
 * - All groups tagged with E2E_TAG
 * - Groups matching the E2E test-run name pattern
 * - Any other E2E-tagged users (NOT the permanent fixture users)
 *
 * Note: Permanently deleting a user also permanently deletes all their
 * messages and conversations — no need to delete messages separately.
 */
export async function cleanupTestData(): Promise<void> {
  console.log('[seed] Running post-run cleanup...');
  await deleteAllE2EData();
  console.log('[seed] Post-run cleanup complete.');
}
