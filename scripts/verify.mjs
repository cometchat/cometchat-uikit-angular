#!/usr/bin/env node
// Local verify: the PR gate's checks, run on your machine before anything reaches CI, so a push
// is a change that is ready to be judged rather than a way to find out whether it works. Every
// CI run costs Actions minutes; a local run costs nothing.
//
//   npm run verify          quick (~1–2 min; the pre-push hook runs this): lockfile, versions,
//                           E2E sleeps, prop coverage, lint, typecheck, unit tests related to the
//                           files you changed, library build
//   npm run verify:full     everything CI's PR gate runs on a non-draft PR except the compat
//                           matrix, Storybook and mutation: the full unit suite with the coverage
//                           floors, the sample-app build and the smoke E2E (needs the E2E_* keys
//                           in .env)
//
//   --base <ref>   compare against this ref (default: VERIFY_BASE, or the closest of
//                  origin/dev-v5 and origin/master-v5; origin/ci-sandbox-v5 is also tried while
//                  that pre-release branch exists, and on a tie the earlier one wins)
//   --no-e2e       with --full, skip the sample-app build and smoke E2E
//
// Stops at the first failing step and prints a summary of what ran.
import { execFileSync, spawn } from 'node:child_process';
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';

const BASE_CANDIDATES = ['origin/dev-v5', 'origin/master-v5', 'origin/ci-sandbox-v5'];
const LIB_DIR = 'projects/cometchat-uikit/';
const ENV_FILE = 'projects/sample-app/src/environments/environment.ts';
const E2E_KEYS = ['E2E_APP_ID', 'E2E_REGION', 'E2E_AUTH_KEY', 'E2E_API_KEY'];

/** The candidate with the fewest commits between its merge base and HEAD: the branch HEAD came from. */
export function closestBase(candidates) {
  return [...candidates].filter((c) => c.ahead != null).sort((a, b) => a.ahead - b.ahead)[0]?.ref ?? null;
}

/**
 * The files to hand to `vitest related`: changed TypeScript files (source or spec) under the
 * test roots, plus the component class of a changed template or stylesheet, which the module
 * graph reaches only through that class.
 */
export function relatedInputs(changed, exists = existsSync) {
  const out = new Set();
  for (const f of changed) {
    if (!/^(projects|scripts|\.storybook)\//.test(f)) continue;
    if (/\.(ts|mjs)$/.test(f) && !f.endsWith('.d.ts') && !f.endsWith('.stories.ts')) out.add(f);
    else if (/\.(html|css|scss)$/.test(f)) {
      const cls = f.replace(/\.(html|css|scss)$/, '.ts');
      if (exists(cls)) out.add(cls);
    }
  }
  return [...out].sort();
}

/** Whether the change can affect the published library build. */
export function touchesLibrary(changed) {
  return changed.some(
    (f) => (f.startsWith(LIB_DIR) && !f.endsWith('.spec.ts')) || ['package.json', 'package-lock.json', 'angular.json'].includes(f)
  );
}

const git = (...args) => execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
const tryGit = (...args) => {
  try {
    return git(...args);
  } catch {
    return null;
  }
};

function resolveBase(explicit) {
  const refs = explicit ? [explicit] : process.env.VERIFY_BASE ? [process.env.VERIFY_BASE] : BASE_CANDIDATES;
  const candidates = refs.map((ref) => {
    const mb = tryGit('merge-base', 'HEAD', ref);
    return { ref, mb, ahead: mb ? Number(tryGit('rev-list', '--count', `${mb}..HEAD`)) : null };
  });
  const ref = closestBase(candidates);
  return ref ? candidates.find((c) => c.ref === ref) : null;
}

function changedFiles(mergeBase) {
  const tracked = git('diff', '--name-only', '--diff-filter=ACMR', mergeBase).split('\n');
  const untracked = git('ls-files', '--others', '--exclude-standard').split('\n');
  return [...new Set([...tracked, ...untracked].filter(Boolean))];
}

function run(cmd, args, env) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { stdio: 'inherit', env: { ...process.env, ...env } });
    child.on('close', (code) => resolve(code ?? 1));
  });
}

/** Write the sample app's environment.ts from .env for the E2E build, and put the original back. */
function withE2eEnvironment() {
  const original = readFileSync(ENV_FILE, 'utf8');
  const restore = () => {
    if (readFileSync(ENV_FILE, 'utf8') !== original) writeFileSync(ENV_FILE, original);
  };
  for (const sig of ['SIGINT', 'SIGTERM']) process.once(sig, () => (restore(), process.exit(130)));
  process.once('exit', restore);
  return restore;
}

async function main() {
  const argv = process.argv.slice(2);
  if (argv.includes('--help') || argv.includes('-h')) {
    console.log(readFileSync(new URL(import.meta.url), 'utf8').split('\n').slice(1, 18).map((l) => l.replace(/^\/\/ ?/, '')).join('\n'));
    return;
  }
  const full = argv.includes('--full');
  const e2e = full && !argv.includes('--no-e2e');
  const baseArg = argv.includes('--base') ? argv[argv.indexOf('--base') + 1] : null;

  const base = resolveBase(baseArg);
  if (!base) {
    console.error(`verify: no base branch found (tried ${baseArg ?? BASE_CANDIDATES.join(', ')}). Run git fetch, or pass --base <ref>.`);
    process.exit(2);
  }
  const changed = changedFiles(base.mb);
  console.log(`verify (${full ? 'full' : 'quick'}): ${changed.length} file(s) changed since ${base.ref} (${base.mb.slice(0, 8)})\n`);

  if (e2e) {
    const { config } = await import('dotenv');
    config({ path: '.env', quiet: true });
    const missing = E2E_KEYS.filter((k) => !process.env[k]);
    if (missing.length) {
      console.error(`verify: smoke E2E needs ${missing.join(', ')} in .env (or run with --no-e2e).`);
      process.exit(2);
    }
  }

  const related = relatedInputs(changed);
  const runId = `local-${Date.now()}`;
  const steps = [
    ['lockfile', 'node', ['scripts/ci/check-lockfile.mjs']],
    ['versions', 'node', ['scripts/ci/check-versions.mjs']],
    ['e2e sleeps', 'node', ['scripts/ci/check-e2e-sleeps.mjs']],
    ['prop coverage', 'node', ['scripts/ci/prop-coverage.mjs']],
    // What may go public (A5). The release scripts stay private, so the public repo skips this.
    ...(existsSync('scripts/release/public-paths.mjs') ? [['public paths', 'node', ['scripts/release/public-paths.mjs', 'check']]] : []),
    ['lint', 'npx', ['eslint', '.']],
    ['typecheck', 'npx', ['tsc', '-b', '--noEmit']],
    ['typecheck storybook', 'npx', ['tsc', '-p', '.storybook/tsconfig.json', '--noEmit']],
    full
      ? ['unit (all, with coverage)', 'npx', ['vitest', 'run', '--coverage', '--reporter=dot', '--reporter=json', '--outputFile.json=test-results/vitest-full-results.json']]
      : related.length
        ? [`unit (related to ${related.length} changed file(s))`, 'npx', ['vitest', 'related', ...related, '--run', '--passWithNoTests', '--reporter=dot']]
        : ['unit', null, 'no changed source or spec files'],
    full ? ['coverage floors', 'coverage', []] : null,
    full || touchesLibrary(changed) ? ['build library', 'npx', ['ng', 'build', 'cometchat-uikit']] : ['build library', null, 'library unchanged'],
    e2e ? ['build sample app (E2E keys)', 'e2e-build', []] : null,
    e2e ? ['smoke E2E', 'npx', ['playwright', 'test', '--grep', '@smoke'], { E2E_STATIC_DIR: 'dist/sample-app/browser', E2E_RUN_ID: runId, E2E_PORT: process.env.E2E_PORT || '4321' }] : null,
  ].filter(Boolean);

  const summary = [];
  let failed = null;
  for (const [name, cmd, args, env] of steps) {
    if (cmd === null) {
      summary.push(['skip', name, args]);
      continue;
    }
    console.log(`\n▶ ${name}`);
    const started = Date.now();
    let code;
    if (cmd === 'coverage') {
      code = await run('node', ['scripts/ci/coverage-report.mjs'], { BASE_SHA: base.mb, HEAD_SHA: git('rev-parse', 'HEAD') });
      if (code === 0) code = JSON.parse(readFileSync('coverage-gate.json', 'utf8')).ok ? 0 : 1;
      rmSync('coverage-comment.md', { force: true });
      rmSync('coverage-gate.json', { force: true });
    } else if (cmd === 'e2e-build') {
      const restore = withE2eEnvironment();
      code = await run('node', ['scripts/ci/write-environment.mjs']);
      if (code === 0) code = await run('npx', ['ng', 'build', 'sample-app']);
      restore();
    } else {
      code = await run(cmd, args, env);
    }
    const secs = Math.round((Date.now() - started) / 1000);
    summary.push([code === 0 ? 'pass' : 'FAIL', name, `${secs}s`]);
    if (code !== 0) {
      failed = name;
      break;
    }
  }
  if (e2e && summary.some(([, name]) => name === 'smoke E2E')) {
    // global-teardown deletes this run's data; the sweep catches anything an interrupted run left.
    await run('node', ['scripts/ci/e2e-sweep.mjs', '--run', runId]);
  }

  console.log('\n── verify summary ──');
  for (const [status, name, note] of summary) console.log(`${status.padEnd(4)}  ${name}  (${note})`);
  if (failed) {
    console.log(`\n✗ ${failed} failed. Fix it before pushing; CI would fail on the same check.`);
    process.exit(1);
  }
  console.log(`\n✓ all ${full ? 'full' : 'quick'} checks passed${full ? '' : ' (run npm run verify:full before marking a PR ready)'}`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
