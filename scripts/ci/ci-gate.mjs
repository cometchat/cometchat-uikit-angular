#!/usr/bin/env node
// The single required check (`ci-gate`): fails unless every job it needs succeeded.
//
// E2E is mandatory. e2e-smoke must pass on every PR. e2e-full and its report must pass on PRs
// into the branches in FULL_E2E_BRANCHES; PRs into a release branch (release-*-v5) skip them. A
// skipped E2E job that should have run fails the gate, with the reason: E2E not enabled (the
// `e2e` environment and E2E_ENABLED=true are missing, admin runbook step 2) or a fork PR, which
// GitHub gives no secrets.
//
// A draft PR skips every E2E job, so a long-lived draft (the promotion PR) does not spend the E2E
// app's user quota on each push; the gate reports E2E as not run. GitHub does not merge a draft,
// and marking it ready for review starts a run in which E2E is required again.
//
//   RESULTS=<toJSON(needs)> E2E_ENABLED=<vars.E2E_ENABLED> SAME_REPO=<true|false> BASE_REF=<base> \
//     DRAFT=<true|false> node scripts/ci/ci-gate.mjs

export const FULL_E2E_BRANCHES = ['dev-v5', 'master-v5'];
const FULL_E2E_JOBS = ['e2e-full', 'e2e-full-report'];

/**
 * Decide the gate from each needed job's result.
 * @param {Record<string, {result: string}>} needs `toJSON(needs)` from the workflow
 * @param {{e2eEnabled: boolean, sameRepo: boolean, baseRef: string, draft?: boolean}} opts
 * @returns {{ok: boolean, lines: string[]}}
 */
export function decide(needs, { e2eEnabled, sameRepo, baseRef, draft = false }) {
  const fullExpected = FULL_E2E_BRANCHES.includes(baseRef);
  const lines = [];
  let failed = 0;
  for (const [job, { result }] of Object.entries(needs)) {
    if (result === 'success') {
      lines.push(`✓ ${job}: success`);
    } else if (result === 'skipped' && job.startsWith('e2e-') && draft) {
      lines.push(`- ${job}: not run (draft PR; E2E runs and is required once it is marked ready for review)`);
    } else if (result === 'skipped' && FULL_E2E_JOBS.includes(job) && !fullExpected) {
      lines.push(`- ${job}: not run (required on PRs into ${FULL_E2E_BRANCHES.join(', ')})`);
    } else {
      failed++;
      const why =
        result !== 'skipped' || !job.startsWith('e2e-')
          ? ''
          : !sameRepo
            ? ' (E2E does not run on fork PRs: push the branch to this repo)'
            : !e2eEnabled
              ? ' (E2E is not enabled: create the `e2e` environment and set E2E_ENABLED=true, runbook step 2)'
              : '';
      lines.push(`✗ ${job}: ${result}${why}`);
    }
  }
  if (failed) lines.push('', `ci-gate: ${failed} job(s) did not succeed`);
  return { ok: failed === 0, lines };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { ok, lines } = decide(JSON.parse(process.env.RESULTS ?? '{}'), {
    e2eEnabled: process.env.E2E_ENABLED === 'true',
    sameRepo: process.env.SAME_REPO === 'true',
    baseRef: process.env.BASE_REF ?? '',
    draft: process.env.DRAFT === 'true',
  });
  for (const line of lines) (ok ? console.log : console.error)(line);
  process.exit(ok ? 0 : 1);
}
