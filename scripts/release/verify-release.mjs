#!/usr/bin/env node
// CI 5 release checks (ENG-40491, ENG-40492). Run in the private repo before anything is copied
// or published. A pull request merged into master-v5 is the release: there is no tag to push and
// no approval to give, so this is the gate.
//
//   node scripts/release/verify-release.mjs rehearsal <commit-sha>
//   node scripts/release/verify-release.mjs release   <master-v5 commit-sha>
//
// The release starts on the push to master-v5, so the release bot's key can live in an
// environment limited to master-v5 (RELEASE.md §7); this finds the pull request whose merge made
// the commit.
//
// Always: the three version locations agree (package.json, the library package.json,
// cometchat-uikit.ts).
// rehearsal (A6): releases <version>-citest.<run number> into the rehearsal repo, as iOS does, so
// each rehearsal has its own tag; set-version.mjs applies it before the build. The checks below
// are skipped.
// release:
//   1. The version must be new. Already on npm means the merge didn't bump it (a dependency or CI
//      change): nothing to release, so the run ends green. Tagged in the public repo but not on
//      npm means an earlier release stopped halfway: fail, and say how to finish it. Not higher
//      than npm's `latest` (a stale branch's 5.2.1 after 5.2.3): fail, since it would publish as
//      `latest` and move customers back.
//   2. The commit is on master-v5, and a pull request merged into master-v5 made it. A version
//      bump pushed straight to master-v5 fails: it has no reviewed PR, gate or notes.
//   3. The merged pull request's description can be the public release notes (A2,
//      release-notes.mjs). It is read now, not from the merge event, so after fixing it a
//      "Re-run failed jobs" picks up the new text.
//   4. The merged pull request passed ci-gate and the full E2E. Only the latest run of each check
//      counts, so a re-run that failed outweighs an earlier pass. Only runs made by GitHub Actions
//      count: any GitHub App with checks write can post a check named ci-gate. Publishing never
//      re-runs tests; it relies on that gate (CI design doc §3, principle 4). The checks are read
//      on the PR's head commit; "require branches to be up to date" on master-v5 (RELEASE.md §7)
//      makes that the code that was merged.
// Writes release=true|false, version, tag and (release) notes to $GITHUB_OUTPUT.
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { appendFileSync, readFileSync, realpathSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { notesProblems, releaseNotes } from './release-notes.mjs';

export const GATE_CHECKS = ['ci-gate', 'e2e-full report'];
export const PUBLIC_REPO = 'https://github.com/cometchat/cometchat-uikit-angular.git';
/** The GitHub App that GitHub Actions posts its check runs as, on github.com. */
export const GITHUB_ACTIONS_APP_ID = 15368;

/**
 * The conclusion of the most recent run among a commit's runs of one check (re-runs add runs).
 * Runs posted by any other app are ignored, so a look-alike check can't pass or hide the gate.
 * @param {{status: string, conclusion: string | null, started_at: string | null, app?: {id: number} | null}[]} runs
 * @returns {string} 'success', another conclusion, 'in_progress' etc., or 'missing'
 */
export function latestConclusion(runs) {
  const ours = (runs ?? []).filter((r) => r.app?.id === GITHUB_ACTIONS_APP_ID);
  if (ours.length === 0) return 'missing';
  const latest = [...ours].sort((a, b) => String(b.started_at ?? '').localeCompare(String(a.started_at ?? '')))[0];
  return latest.status === 'completed' ? (latest.conclusion ?? 'missing') : latest.status;
}

/**
 * Compare two semver versions (MAJOR.MINOR.PATCH, optional -pre-release, +build ignored):
 * negative when a < b, 0 when equal, positive when a > b. A pre-release is lower than its
 * version (5.3.0-rc.1 < 5.3.0); pre-release fields compare as semver says (numbers as numbers,
 * below words). Throws on anything else, so a malformed version can't slip past the check.
 * @param {string} a
 * @param {string} b
 */
export function compareVersions(a, b) {
  const parse = (v) => {
    const m = /^v?(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/.exec(String(v).trim());
    if (!m) throw new Error(`not a semver version: ${v}`);
    return { core: [Number(m[1]), Number(m[2]), Number(m[3])], pre: m[4] ? m[4].split('.') : [] };
  };
  const x = parse(a);
  const y = parse(b);
  for (let i = 0; i < 3; i++) if (x.core[i] !== y.core[i]) return x.core[i] - y.core[i];
  if (!x.pre.length || !y.pre.length) return y.pre.length - x.pre.length; // no pre-release is higher
  for (let i = 0; i < Math.max(x.pre.length, y.pre.length); i++) {
    const [p, q] = [x.pre[i], y.pre[i]];
    if (p === undefined) return -1;
    if (q === undefined) return 1;
    if (p === q) continue;
    const [pn, qn] = [/^\d+$/.test(p), /^\d+$/.test(q)];
    if (pn && qn) return Number(p) - Number(q);
    if (pn !== qn) return pn ? -1 : 1;
    return p < q ? -1 : 1;
  }
  return 0;
}

/**
 * Is there a release to make, given where the version already is?
 * @param {{onNpm: boolean, publicTag: boolean, version: string, latest?: string | null}} state
 *   latest: npm's `latest` dist-tag, or null when the package has never been published
 * @returns {{release: boolean, fail?: string, note?: string}}
 */
export function decideRelease({ onNpm, publicTag, version, latest = null }) {
  if (onNpm) {
    return { release: false, note: `${version} is already on npm: this merge doesn't bump the version, so there is nothing to release.` };
  }
  if (publicTag) {
    return {
      release: false,
      fail:
        `v${version} is tagged in the public repo but ${version} isn't on npm: an earlier release stopped after the public push. ` +
        `Re-run the failed "Release to npm" run in cometchat/cometchat-uikit-angular.`,
    };
  }
  if (latest && compareVersions(version, latest) <= 0) {
    return {
      release: false,
      fail:
        `${version} is not higher than ${latest}, npm's latest. Published, it would become latest and move customers back. ` +
        `Bump the version above ${latest} in a new PR into master-v5. Nothing has been built or published.`,
    };
  }
  return { release: true };
}

/**
 * The pull request whose merge into master-v5 made commit `sha`, from GitHub's "pull requests
 * associated with a commit": merged, into master-v5, with `sha` as its merge commit (a merge,
 * squash or rebase merge all record it). Null when none did, e.g. a push straight to master-v5.
 * @param {{number: number, merged_at: string | null, merge_commit_sha: string | null, base: {ref: string}}[]} pulls
 * @param {string} sha
 */
export function releasePullRequest(pulls, sha) {
  return (pulls ?? []).find((p) => p.merged_at && p.base?.ref === 'master-v5' && p.merge_commit_sha === sha) ?? null;
}

/** Version strings that disagree, or [] when all three match. */
/** A rehearsal's version: its own pre-release of the version, so it can't collide or reach `latest`. */
export const rehearsalVersion = (version, runNumber) => `${version}-citest.${runNumber}`;

export function versionProblems(root, lib, runtime) {
  if (lib !== root || runtime.length === 0 || runtime.some((v) => v !== root)) {
    return [`versions disagree: package.json ${root}, library ${lib}, cometchat-uikit.ts ${runtime.join(', ') || 'none'}`];
  }
  return [];
}

/** $GITHUB_OUTPUT lines; a multi-line value (the release notes) uses the heredoc form. */
export function outputLines(values, delimiter = () => `EOF_${randomUUID()}`) {
  const lines = Object.entries(values).map(([k, v]) => {
    if (!String(v).includes('\n')) return `${k}=${v}`;
    const end = delimiter();
    return `${k}<<${end}\n${v}\n${end}`;
  });
  return lines.join('\n') + '\n';
}

function main() {
  const [, , mode, sha] = process.argv;
  const fail = (msg) => {
    console.error(`✗ ${msg}`);
    process.exit(1);
  };
  const run = (cmd, args) => execFileSync(cmd, args, { encoding: 'utf8' }).trim();
  const output = (values) => {
    if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, outputLines(values));
    console.log(Object.entries(values).map(([k, v]) => (String(v).includes('\n') ? `${k}=(${String(v).split('\n').length} lines)` : `${k}=${v}`)).join(' '));
  };

  if (mode !== 'rehearsal' && mode !== 'release') fail(`mode must be 'rehearsal' or 'release', got '${mode}'`);
  if (!sha) fail('missing the commit to release');

  const root = JSON.parse(readFileSync('package.json', 'utf8')).version;
  const libPkg = JSON.parse(readFileSync('projects/cometchat-uikit/package.json', 'utf8'));
  const runtime = [...readFileSync('projects/cometchat-uikit/src/lib/cometchat-uikit.ts', 'utf8').matchAll(/version:\s*'([^']+)'/g)].map((m) => m[1]);
  const [problem] = versionProblems(root, libPkg.version, runtime);
  if (problem) fail(problem);
  console.log(`✓ version ${root} is consistent`);
  const tag = `v${root}`;

  if (mode === 'rehearsal') {
    const version = rehearsalVersion(root, process.env.GITHUB_RUN_NUMBER ?? '0');
    console.log(`Rehearsal of ${root} as ${version}: the new-version, branch, release notes and gate checks are skipped.`);
    const notes = `Rehearsal of ${tag} from ${process.env.GITHUB_REF_NAME ?? 'a local run'} at ${sha.slice(0, 9)}. Not a release.`;
    output({ release: 'true', version, tag: `v${version}`, notes });
    return;
  }

  // 1. Is the version new, and higher than npm's latest?
  const npmView = (spec, field) => {
    try {
      return execFileSync('npm', ['view', spec, field], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    } catch {
      return ''; // E404: not published
    }
  };
  const onNpm = npmView(`${libPkg.name}@${root}`, 'version') === root;
  const latest = npmView(libPkg.name, 'dist-tags.latest') || null;
  const publicTag = run('git', ['ls-remote', '--tags', PUBLIC_REPO, `refs/tags/${tag}`]) !== '';
  const decision = decideRelease({ onNpm, publicTag, version: root, latest });
  if (decision.fail) fail(decision.fail);
  if (!decision.release) {
    console.log(`✓ ${decision.note}`);
    if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `### Nothing to release\n${decision.note}\n`);
    output({ release: 'false', version: root, tag });
    return;
  }
  console.log(`✓ ${root} is not on npm yet${latest ? `, and is higher than latest (${latest})` : ''}`);

  // 2. On master-v5, made by a merged pull request.
  run('git', ['fetch', '--quiet', 'origin', 'master-v5']);
  try {
    execFileSync('git', ['merge-base', '--is-ancestor', sha, 'origin/master-v5']);
  } catch {
    fail(`${sha.slice(0, 8)} is not on master-v5; release only what was merged there`);
  }
  console.log(`✓ ${sha.slice(0, 8)} is on master-v5`);

  const repo = process.env.GITHUB_REPOSITORY;
  // GitHub links a new merge commit to its pull request a few seconds after the push; allow a minute.
  let pr = null;
  for (let attempt = 0; attempt < 7 && !pr; attempt++) {
    if (attempt) execFileSync('sleep', ['10']);
    pr = releasePullRequest(JSON.parse(run('gh', ['api', `repos/${repo}/commits/${sha}/pulls?per_page=100`])), sha);
  }
  if (!pr) {
    fail(
      `No pull request merged into master-v5 made ${sha.slice(0, 8)}: it was pushed straight to master-v5. ` +
        `A release needs its PR, for the gate and the release notes: bump the version in a PR into master-v5.`
    );
  }
  console.log(`✓ PR #${pr.number} was merged into master-v5 as ${sha.slice(0, 8)}`);

  // 3. Its description can be the public release notes.
  const problems = notesProblems(pr.body);
  if (problems.length) {
    fail(
      `PR #${pr.number}'s description becomes the public release notes of ${tag}, and it can't be published:\n` +
        problems.map((p) => `  - ${p}`).join('\n') +
        `\nEdit the description of PR #${pr.number}, then use "Re-run failed jobs" on this run. Nothing has been built or published.`
    );
  }
  const notes = releaseNotes(pr.body);
  console.log(`✓ PR #${pr.number}'s description can be the release notes`);

  // 4. The merged pull request passed the gate (latest run of each check).
  for (const check of GATE_CHECKS) {
    const runs = JSON.parse(
      run('gh', ['api', `repos/${repo}/commits/${pr.head.sha}/check-runs?check_name=${encodeURIComponent(check)}&app_id=${GITHUB_ACTIONS_APP_ID}&filter=all&per_page=100`])
    ).check_runs;
    const conclusion = latestConclusion(runs);
    if (conclusion !== 'success') {
      fail(`${check} on PR #${pr.number} (${pr.head.sha.slice(0, 8)}) is ${conclusion}, not success${check === 'e2e-full report' ? ': mark the PR ready for review so the full E2E runs' : ''}`);
    }
  }
  console.log(`✓ ${GATE_CHECKS.join(' and ')} passed on PR #${pr.number}, which brought this commit to master-v5`);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `### Release notes of ${tag} (PR #${pr.number})\n\n${notes}\n`);
  output({ release: 'true', version: root, tag, notes });
}

if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) main();
