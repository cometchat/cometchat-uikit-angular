/**
 * Run-scoped E2E test data (E2E 2, ENG-40472).
 *
 * Every user and group an E2E run creates carries this run's id: in its UID/GUID, and in a
 * `e2e-run-<id>` tag next to the shared `e2e-test-data` tag. Global setup and teardown delete only
 * the current run's tag, so two runs on the same CometChat app (two PRs, or a local run during
 * CI) can no longer delete each other's users and groups. Data left behind by a cancelled run is
 * removed by the stale sweep (older than 24 h, by the shared tag).
 *
 * CI sets E2E_RUN_ID to `<run id>-<attempt>[-<shard>]`; a local run uses `local`.
 *
 * With E2E_RUN_ID set, the run is also isolated (E2E 2b): it logs in as users of its own
 * (see PRIMARY_USER in ./seed.ts) instead of the shared sample users, so another run's
 * messages, calls, receipts and unread counts never reach it. Without it, a local run keeps
 * using the sample users cometchat-uid-1..3.
 */

/** Tag on every E2E-created user and group, across all runs. */
export const E2E_TAG = 'e2e-test-data';

function slug(value: string): string {
  const s = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 24);
  return s || 'local';
}

/** True when E2E_RUN_ID is set: the run uses its own login users (see ./seed.ts). */
export const E2E_ISOLATED = !!process.env['E2E_RUN_ID'];

/** This run's id, safe for UIDs, GUIDs and tags. */
export const E2E_RUN_ID = slug(process.env['E2E_RUN_ID'] ?? 'local');

/** Tag that marks the data of this run only. */
export const E2E_RUN_TAG = `e2e-run-${E2E_RUN_ID}`;

/** Tags for anything this run creates. */
export const E2E_TAGS = [E2E_TAG, E2E_RUN_TAG];

/** A UID or GUID that belongs to this run, e.g. `e2e-<run>-public-group`. */
export function runScoped(name: string): string {
  return `e2e-${E2E_RUN_ID}-${name}`;
}
