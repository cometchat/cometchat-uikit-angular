#!/usr/bin/env node
// E2E 4 (ENG-40490): summarise a Playwright JSON report and enforce the quarantine budget.
//
//   node scripts/ci/e2e-report.mjs <playwright-json> [--budget 5]
//
// - Counts passed, failed, flaky (passed only on retry) and skipped tests, and the same for the
//   two-user @realtime set.
// - Lists every flaky test, so it can be quarantined and ticketed the same day (E2E design doc §8):
//   tag it `@quarantine` (excluded from smoke and full runs) and put the Linear issue in its title.
// - Fails if quarantined tests exceed the budget (default 5% of all tests): past that, fixing
//   flakes comes before adding tests.
// - Writes e2e-report.md (PR comment / job summary) next to the JSON.
// Exit code: 1 if any test failed or the quarantine budget is exceeded; flaky alone does not fail.
import { readFileSync, writeFileSync, appendFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { execFileSync } from 'node:child_process';

const [, , jsonPath, ...rest] = process.argv;
const budget = Number(rest[rest.indexOf('--budget') + 1] ?? 5) || 5;
const report = JSON.parse(readFileSync(jsonPath, 'utf8'));

const results = { passed: [], failed: [], flaky: [], skipped: [] };
function walk(suite, path) {
  for (const s of suite.suites ?? []) walk(s, [...path, s.title]);
  for (const spec of suite.specs ?? []) {
    for (const t of spec.tests ?? []) {
      const title = [...path, spec.title].filter(Boolean).join(' › ');
      const where = `${spec.file}:${spec.line}`;
      const status = t.status; // expected | unexpected | flaky | skipped
      const bucket = status === 'expected' ? 'passed' : status === 'unexpected' ? 'failed' : status === 'flaky' ? 'flaky' : 'skipped';
      results[bucket].push({ title, where });
    }
  }
}
for (const s of report.suites ?? []) walk(s, []);

// Quarantined tests carry @quarantine in their title; count them across the whole suite. The run
// itself never sees them (the config's grepInvert drops them, and a CLI --grep-invert doesn't
// override that), so list the suite with E2E_INCLUDE_QUARANTINE set.
let quarantined = 0;
let total = 0;
try {
  const list = execFileSync('npx', ['playwright', 'test', '--list'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
    env: { ...process.env, E2E_INCLUDE_QUARANTINE: '1' },
  });
  for (const line of list.split('\n')) {
    if (!line.includes('›')) continue;
    total++;
    if (line.includes('@quarantine')) quarantined++;
  }
} catch (err) {
  console.error(`Could not list the suite to count quarantined tests: ${err.message}`);
  process.exitCode = 1;
}
const q = total ? (quarantined / total) * 100 : 0;
const overBudget = q > budget;

// The two-user real-time set (ENG-40481): done when it is green on 3 consecutive e2e-full runs.
const realtime = Object.fromEntries(Object.entries(results).map(([k, arr]) => [k, arr.filter((t) => t.title.includes('@realtime')).length]));
const realtimeRan = realtime.passed + realtime.failed + realtime.flaky;
const realtimeLine = realtimeRan
  ? `@realtime: ${realtime.passed} of ${realtimeRan} passed${realtime.failed ? ` · ${realtime.failed} failed` : ''}${realtime.flaky ? ` · ${realtime.flaky} flaky` : ''}`
  : '';

const fmt = (arr) => arr.map((t) => `- ${t.title} (\`${t.where}\`)`).join('\n');
const md = [
  '<!-- pr-gate-e2e -->',
  `### E2E ${results.failed.length || overBudget ? '❌' : '✅'}`,
  '',
  `**${results.passed.length} passed** · ${results.failed.length} failed · ${results.flaky.length} flaky · ${results.skipped.length} skipped`,
  total
    ? `Quarantined: ${quarantined} of ${total} tests (${q.toFixed(1)}%, budget ${budget}%)${overBudget ? ' ❌ over budget' : ''}`
    : 'Quarantined: unknown (listing the suite failed) ❌',
  realtimeLine,
  ...(results.failed.length ? ['', '**Failed**', fmt(results.failed)] : []),
  ...(results.flaky.length
    ? ['', '**Flaky (passed on retry)**: quarantine with `@quarantine` + a Linear issue in the title, or fix today', fmt(results.flaky)]
    : []),
].join('\n');

const out = join(dirname(jsonPath), 'e2e-report.md');
writeFileSync(out, md);
if (process.env.GITHUB_STEP_SUMMARY && existsSync(process.env.GITHUB_STEP_SUMMARY)) appendFileSync(process.env.GITHUB_STEP_SUMMARY, md.replace('<!-- pr-gate-e2e -->\n', ''));
console.log(md);
process.exit(results.failed.length || overBudget || !total ? 1 : 0);
