#!/usr/bin/env node
// CI 2 coverage gates (ENG-40467..40469), run on the merged report of all unit shards.
//
//   Ratchet: no metric may drop more than `tolerance` points below scripts/ci/coverage-baseline.json.
//            When a metric rises past the floor by more than `raiseBy`, the comment asks for the
//            floor to be raised in the same PR, so the gain is kept.
//   Patch:   of the library lines this PR adds or changes that hold a statement, at least
//            `patchMinimum` % must be covered (skipped when the PR changes no such line).
//
// Writes coverage-comment.md (PR comment and job summary) and coverage-gate.json ({ ok, failures }).
// Inputs: test-results/vitest-full-results.json, coverage/coverage-summary.json,
// coverage/coverage-final.json; BASE_SHA and HEAD_SHA from the environment for the patch check.
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, appendFileSync, existsSync } from 'node:fs';
import { relative } from 'node:path';

const read = (p) => JSON.parse(readFileSync(p, 'utf8'));
const baseline = read('scripts/ci/coverage-baseline.json');
const results = read('test-results/vitest-full-results.json');
const total = read('coverage/coverage-summary.json').total;
const METRICS = ['statements', 'branches', 'functions', 'lines'];
const failures = [];

if (results.numTotalTests === 0) failures.push('No tests ran.');
if (results.numFailedTests > 0) failures.push(`${results.numFailedTests} unit test(s) failed.`);

// ── Ratchet ──────────────────────────────────────────────────────────────────────────────────
const ratchetRows = METRICS.map((m) => {
  const now = total[m].pct;
  const floor = baseline.floors[m];
  const delta = now - floor;
  let status = '✅';
  if (delta < -baseline.tolerance) {
    status = '❌ dropped';
    failures.push(`${m} coverage ${now.toFixed(2)}% is below its floor ${floor.toFixed(2)}%.`);
  } else if (delta > baseline.raiseBy) {
    status = '⬆️ raise the floor';
  }
  const sign = delta >= 0 ? '+' : '';
  return `| ${m} | ${now.toFixed(2)}% | ${floor.toFixed(2)}% | ${sign}${delta.toFixed(2)} | ${status} |`;
});
const canRaise = METRICS.some((m) => total[m].pct - baseline.floors[m] > baseline.raiseBy);

// ── Patch coverage ───────────────────────────────────────────────────────────────────────────
function changedLines(base, head) {
  // Added or modified lines (new-file line numbers) in library source, per file.
  const diff = execFileSync(
    'git',
    ['diff', '--unified=0', '--no-color', '--diff-filter=AM', `${base}...${head}`, '--', 'projects/cometchat-uikit/src'],
    { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }
  );
  const byFile = new Map();
  let file = null;
  for (const line of diff.split('\n')) {
    if (line.startsWith('+++ ')) {
      file = line.startsWith('+++ b/') ? line.slice(6) : null;
    } else if (file && line.startsWith('@@')) {
      const m = line.match(/\+(\d+)(?:,(\d+))?/);
      const start = Number(m[1]);
      const count = m[2] === undefined ? 1 : Number(m[2]);
      if (!byFile.has(file)) byFile.set(file, new Set());
      for (let n = start; n < start + count; n++) byFile.get(file).add(n);
    }
  }
  return byFile;
}

let patch = { skipped: 'no base commit given' };
if (process.env.BASE_SHA && process.env.HEAD_SHA) {
  const finalCov = read('coverage/coverage-final.json');
  const covByPath = new Map(Object.entries(finalCov).map(([abs, data]) => [relative(process.cwd(), abs), data]));
  let executable = 0;
  let covered = 0;
  const uncovered = [];
  for (const [file, lines] of changedLines(process.env.BASE_SHA, process.env.HEAD_SHA)) {
    const data = covByPath.get(file);
    if (!data) continue; // not measured: specs, stories, excluded files
    const hitsByLine = new Map();
    for (const [id, loc] of Object.entries(data.statementMap)) {
      const l = loc.start.line;
      hitsByLine.set(l, Math.max(hitsByLine.get(l) ?? 0, data.s[id]));
    }
    const missed = [];
    for (const l of [...lines].sort((a, b) => a - b)) {
      if (!hitsByLine.has(l)) continue; // no statement starts here (comment, brace, type)
      executable++;
      if (hitsByLine.get(l) > 0) covered++;
      else missed.push(l);
    }
    if (missed.length) uncovered.push(`${file}: ${compress(missed)}`);
  }
  if (executable === 0) {
    patch = { skipped: 'no changed library lines with statements' };
  } else {
    const pct = (covered / executable) * 100;
    patch = { pct, covered, executable, uncovered };
    if (pct < baseline.patchMinimum) {
      failures.push(`Changed lines are ${pct.toFixed(1)}% covered; the minimum is ${baseline.patchMinimum}%.`);
    }
  }
}

function compress(nums) {
  const out = [];
  for (let i = 0; i < nums.length; i++) {
    let j = i;
    while (j + 1 < nums.length && nums[j + 1] === nums[j] + 1) j++;
    out.push(i === j ? `${nums[i]}` : `${nums[i]}-${nums[j]}`);
    i = j;
  }
  return out.join(', ');
}

// ── Comment ──────────────────────────────────────────────────────────────────────────────────
const patchLines =
  'skipped' in patch
    ? [`**Changed lines:** not checked (${patch.skipped}).`]
    : [
        `**Changed lines:** ${patch.pct.toFixed(1)}% covered (${patch.covered} of ${patch.executable} lines with statements) · minimum ${baseline.patchMinimum}% ${patch.pct >= baseline.patchMinimum ? '✅' : '❌'}`,
        ...(patch.uncovered.length
          ? ['', '<details><summary>Changed lines not covered</summary>', '', ...patch.uncovered.map((u) => `- \`${u}\``), '', '</details>']
          : []),
      ];

const body = [
  '<!-- pr-gate-coverage -->',
  `### Unit tests and coverage ${failures.length ? '❌' : '✅'}`,
  '',
  `**${results.numPassedTests.toLocaleString('en-US')} passed** · ${results.numFailedTests} failed · ${results.numPendingTests} skipped · ${results.numTodoTests} todo · ${results.testResults.length} files (4 shards)`,
  '',
  '| Metric | This PR | Floor | Change | |',
  '| --- | --: | --: | --: | --- |',
  ...ratchetRows,
  '',
  ...patchLines,
  ...(canRaise
    ? ['', `Coverage rose past a floor by more than ${baseline.raiseBy} points. Raise \`floors\` in \`scripts/ci/coverage-baseline.json\` in this PR to keep the gain.`]
    : []),
  ...(failures.length ? ['', '**Blocking:**', ...failures.map((f) => `- ${f}`)] : []),
  '',
  `<sub>Commit ${(process.env.HEAD_SHA ?? '').slice(0, 8)} · floors may drop at most ${baseline.tolerance} points · scripts/ci/coverage-report.mjs</sub>`,
].join('\n');

writeFileSync('coverage-comment.md', body);
writeFileSync('coverage-gate.json', JSON.stringify({ ok: failures.length === 0, failures }, null, 2));
if (process.env.GITHUB_STEP_SUMMARY && existsSync(process.env.GITHUB_STEP_SUMMARY)) {
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, body.replace('<!-- pr-gate-coverage -->\n', ''));
}
console.log(body);
