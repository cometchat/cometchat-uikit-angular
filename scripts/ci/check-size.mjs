#!/usr/bin/env node
// CI 3 size job (ENG-40477): the packed library may not grow more than `maxGrowthPercent` over
// scripts/ci/size-baseline.json without the baseline being updated (and reviewed) in the same PR.
// Input: the JSON that `npm pack --json` printed, as a file path argument.
import { readFileSync } from 'node:fs';

const [, , packJsonPath] = process.argv;
const pack = JSON.parse(readFileSync(packJsonPath, 'utf8'))[0];
const base = JSON.parse(readFileSync('scripts/ci/size-baseline.json', 'utf8'));
const mb = (n) => `${(n / 1024 / 1024).toFixed(2)} MB`;
const rows = [
  ['packed (download)', pack.size, base.packedBytes],
  ['unpacked (installed)', pack.unpackedSize, base.unpackedBytes],
  ['files', pack.entryCount, base.files],
];
let failed = false;
for (const [label, now, was] of rows) {
  const growth = ((now - was) / was) * 100;
  const over = growth > base.maxGrowthPercent;
  failed ||= over;
  const show = label === 'files' ? String(now) : mb(now);
  const showWas = label === 'files' ? String(was) : mb(was);
  console.log(`${over ? '✗' : '✓'} ${label}: ${show} (baseline ${showWas}, ${growth >= 0 ? '+' : ''}${growth.toFixed(1)}%)`);
}
if (failed) {
  console.error(`\nThe package grew more than ${base.maxGrowthPercent}%. If intended, update scripts/ci/size-baseline.json in this PR.`);
  process.exit(1);
}
