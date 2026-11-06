#!/usr/bin/env node
// E2E sleep ban (ENG-40475): fixed waits (`waitForTimeout`) make specs slow and flaky, so e2e/
// waits on conditions instead (expect, toPass, waitForResponse). The one allowed fixed wait is
// expectNothingFor() in e2e/helpers/wait.ts, for proving something did NOT happen in a period.
// Any other waitForTimeout counts against scripts/ci/e2e-sleeps-baseline.json, which is 0; a
// count above it fails, and the --update/lower-the-baseline flow stays for any future ratchet.
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const BASELINE = 'scripts/ci/e2e-sleeps-baseline.json';
const walk = (dir) =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : p.endsWith('.ts') ? [p] : [];
  });

const perFile = walk('e2e')
  .filter((file) => file !== join('e2e', 'helpers', 'wait.ts'))
  .map((file) => [file, (readFileSync(file, 'utf8').match(/\.waitForTimeout\(/g) ?? []).length])
  .filter(([, n]) => n > 0);
const total = perFile.reduce((sum, [, n]) => sum + n, 0);
const base = JSON.parse(readFileSync(BASELINE, 'utf8'));

if (process.argv.includes('--update')) {
  writeFileSync(BASELINE, JSON.stringify({ ...base, count: total }, null, 2) + '\n');
  console.log(`Baseline set to ${total}.`);
  process.exit(0);
}
if (total > base.count) {
  console.error(`✗ e2e/ has ${total} waitForTimeout calls, more than the baseline of ${base.count}.`);
  console.error('Wait for a condition instead (expect(...).toBeVisible(), toPass, waitForResponse), or, to prove');
  console.error('something does NOT happen within a period, use expectNothingFor() from e2e/helpers/wait.ts.');
  for (const [file, n] of perFile.sort((a, b) => b[1] - a[1])) console.error(`  ${n}  ${file}`);
  process.exit(1);
}
if (total < base.count) {
  console.error(`✗ e2e/ has ${total} waitForTimeout calls, fewer than the baseline of ${base.count}. Lock that in:`);
  console.error('run `node scripts/ci/check-e2e-sleeps.mjs --update` and commit the baseline.');
  process.exit(1);
}
console.log(`✓ e2e/ has ${total} waitForTimeout calls (baseline ${base.count}).`);
