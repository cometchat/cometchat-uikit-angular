#!/usr/bin/env node
// E2E 2 stale-data sweeper (ENG-40473). The E2E app's plan allows only 100 users, and a cancelled or
// timed-out E2E job never runs its own teardown, so the users and groups it created would stay.
// Two modes:
//
//   --hours <n>   delete E2E data older than n hours (default 24):
//                   - users and groups tagged `e2e-test-data` (every run tags its data with it, next
//                     to `e2e-run-<id>`), and
//                   - untagged groups named "E2E …", which specs create through the app's own
//                     Create Group dialog.
//                 A run that is still going is never older than the cut-off, so this is safe at any
//                 time. pr-gate runs it once per workflow run, before the E2E jobs.
//   --run <id>    delete everything one workflow run created, whatever its age: data tagged
//                 `e2e-run-<id>` or `e2e-run-<id>-<shard>`. pr-gate runs it after the E2E jobs,
//                 also when they failed, timed out or were cancelled.
//
// Both never delete anything tagged `e2e-fixture` (the shared filler users, created once and kept).
// A delete answered with 404 counts as done: something else (the run's own teardown, another sweep)
// removed the item first.
//
//   node scripts/ci/e2e-sweep.mjs [--hours 24 | --run <run id>-<attempt>] [--dry-run]
//
// Needs E2E_APP_ID, E2E_REGION and E2E_API_KEY in the environment (the `e2e` environment's
// secrets in CI). Prints names and ids only, never the keys.

export const DATA_TAG = 'e2e-test-data';
export const FIXTURE_TAG = 'e2e-fixture';

/** The run tag e2e/helpers/run.ts derives from E2E_RUN_ID (same slug rules). */
export function runTag(runId) {
  const s = String(runId).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 24);
  return `e2e-run-${s || 'local'}`;
}

/**
 * What to delete. `users` and `groups` are the API's items (`tags`, `createdAt` in epoch seconds,
 * `name`); groups may include untagged "E2E …" ones. Fixtures are never chosen.
 * @param {{users: object[], groups: object[], now: number, hours?: number, run?: string}} input
 */
export function planDeletion({ users, groups, now, hours, run }) {
  const tags = (item) => item.tags ?? [];
  const isFixture = (item) => tags(item).includes(FIXTURE_TAG);
  let keep;
  if (run !== undefined) {
    const base = runTag(run);
    // Shards append -s<n> to the run id; `e2e-run-123-1` must not match run `e2e-run-123-10`.
    keep = (item) => tags(item).some((t) => t === base || t.startsWith(`${base}-`));
  } else {
    const cutoff = now - hours * 3600;
    const isE2E = (item) => tags(item).includes(DATA_TAG) || /^E2E\b/.test(item.name ?? '');
    keep = (item) => isE2E(item) && Number(item.createdAt) > 0 && Number(item.createdAt) < cutoff;
  }
  const pick = (list) => [...new Map(list.map((i) => [i.guid ?? i.uid, i])).values()].filter((i) => keep(i) && !isFixture(i));
  return { users: pick(users), groups: pick(groups) };
}

/** A failed delete that still means the item is gone. */
export const alreadyGone = (err) => err?.status === 404;

async function main() {
  const { E2E_APP_ID, E2E_REGION, E2E_API_KEY } = process.env;
  if (!E2E_APP_ID || !E2E_REGION || !E2E_API_KEY) {
    console.error('E2E_APP_ID, E2E_REGION and E2E_API_KEY must be set.');
    process.exit(1);
  }
  const arg = (name) => {
    const i = process.argv.indexOf(name);
    return i === -1 ? undefined : process.argv[i + 1];
  };
  const run = arg('--run');
  const hours = Number(arg('--hours') ?? process.env.E2E_SWEEP_HOURS ?? 24);
  if (run === undefined && (!Number.isFinite(hours) || hours < 0)) {
    console.error(`--hours must be a number >= 0, got ${arg('--hours')}`);
    process.exit(1);
  }
  if (run !== undefined && !run.trim()) {
    console.error('--run needs a run id.');
    process.exit(1);
  }
  const dryRun = process.argv.includes('--dry-run');
  const now = Math.floor(Date.now() / 1000);

  const API = `https://${E2E_APP_ID}.api-${E2E_REGION}.cometchat.io/v3`;
  const headers = { 'Content-Type': 'application/json', apikey: E2E_API_KEY };
  const api = async (method, path, body) => {
    const res = await fetch(API + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
    if (!res.ok) throw Object.assign(new Error(`${method} ${path.split('?')[0]} → HTTP ${res.status}`), { status: res.status });
    return res.json().catch(() => ({}));
  };
  // Every item of a paged list, collected before deleting so deletes don't shift the pages.
  const listAll = async (path) => {
    const items = [];
    for (let page = 1; ; page++) {
      const res = await api('GET', `${path}&perPage=100&page=${page}&withTags=true`);
      items.push(...(res.data ?? []));
      const p = res.meta?.pagination;
      if (!p || p.current_page >= p.total_pages) return items;
    }
  };

  const users = await listAll(`/users?tags=${DATA_TAG}`);
  const groups = [...(await listAll(`/groups?tags=${DATA_TAG}`)), ...(await listAll('/groups?searchKey=E2E'))];
  const plan = planDeletion({ users, groups, now, hours, run });
  const age = (item) => `${((now - Number(item.createdAt)) / 3600).toFixed(1)} h`;
  const scope = run !== undefined ? `created by run ${runTag(run)}` : `older than ${hours} h`;

  console.log(`${dryRun ? 'Dry run: would delete' : 'Deleting'} E2E data ${scope}: ${plan.groups.length} groups, ${plan.users.length} users.`);
  let failed = 0;
  for (const [kind, list, del] of [
    ['group', plan.groups, (g) => api('DELETE', `/groups/${encodeURIComponent(g.guid)}`)],
    ['user', plan.users, (u) => api('DELETE', `/users/${encodeURIComponent(u.uid)}`, { permanent: true })],
  ]) {
    for (const item of list) {
      const label = `${kind} ${item.guid ?? item.uid} "${item.name}" (${age(item)} old)`;
      if (dryRun) {
        console.log(`  ${label}`);
        continue;
      }
      try {
        await del(item);
        console.log(`  deleted ${label}`);
      } catch (err) {
        if (alreadyGone(err)) {
          console.log(`  already gone ${label}`);
          continue;
        }
        failed++;
        console.error(`  could not delete ${label}: ${err.message}`);
      }
    }
  }
  if (failed) process.exit(1);
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
