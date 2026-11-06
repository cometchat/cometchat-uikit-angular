#!/usr/bin/env node
// E2E 4 auto-quarantine (ENG-40490). Reads the merged e2e-full JSON reports of the last 7 days
// (one per run, downloaded by .github/workflows/e2e-flake-watch.yml) and:
//
//   analyze <report.json>... [--min 3] [--out dir]
//     - Weekly health for the job summary: runs, pass rate, flaky rate, p50/p95 test and run
//       durations, and the current quarantine count (from `--quarantined N`).
//     - Candidates: tests that were flaky (passed on retry) or failed in at least --min runs,
//       and passed (first time or on retry) in at least one. A test that never passed is
//       broken, not flaky: it is listed for a fix, not quarantined. Tests already tagged
//       @quarantine are skipped.
//     Writes <out>/summary.md and <out>/candidates.json.
//
//   tag <candidates.json> <issues.json>
//     - issues.json maps each candidate's key to its tracking issue (e.g. "#123"). Appends
//       `@quarantine (<issue>)` to the test's title in its spec file, with a comment saying
//       why, the same form the hand-made quarantines use.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [, , cmd, ...args] = process.argv;
const opt = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 ? args.splice(i, 2)[1] : fallback;
};

/** Every test of a Playwright JSON report: file, title (without describe path), status, durations. */
function testsOf(report) {
  const out = [];
  const walk = (suite, path) => {
    for (const s of suite.suites ?? []) walk(s, s.title ? [...path, s.title] : path);
    for (const spec of suite.specs ?? []) {
      for (const t of spec.tests ?? []) {
        const describe = path.filter((p) => !p.endsWith('.ts'));
        out.push({
          key: `${spec.file} › ${[...describe, spec.title].join(' › ')}`,
          file: spec.file,
          line: spec.line,
          title: spec.title,
          status: t.status, // expected | unexpected | flaky | skipped
          duration: (t.results ?? []).reduce((sum, r) => sum + (r.duration ?? 0), 0),
        });
      }
    }
  };
  for (const s of report.suites ?? []) walk(s, []);
  return out;
}

const pct = (n, d) => (d ? `${((n / d) * 100).toFixed(1)}%` : 'n/a');
const quantile = (sorted, q) => (sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))] : 0);
const secs = (ms) => `${(ms / 1000).toFixed(1)}s`;
const mins = (ms) => `${(ms / 60000).toFixed(1)} min`;

function analyze(files) {
  const min = Number(opt('--min', '3'));
  const outDir = opt('--out', '.');
  const quarantined = opt('--quarantined', '');
  const runs = files.map((f) => JSON.parse(readFileSync(f, 'utf8')));
  const perTest = new Map();
  let ran = 0, passed = 0, flaky = 0, failed = 0;
  const testDurations = [];
  for (const run of runs) {
    for (const t of testsOf(run)) {
      if (t.status === 'skipped') continue;
      ran++;
      if (t.status === 'expected') passed++;
      if (t.status === 'flaky') flaky++;
      if (t.status === 'unexpected') failed++;
      testDurations.push(t.duration);
      const e = perTest.get(t.key) ?? { ...t, runs: 0, bad: 0, good: 0 };
      e.runs++;
      if (t.status === 'flaky' || t.status === 'unexpected') e.bad++;
      if (t.status === 'flaky' || t.status === 'expected') e.good++;
      Object.assign(e, { file: t.file, line: t.line, title: t.title });
      perTest.set(t.key, e);
    }
  }
  testDurations.sort((a, b) => a - b);
  const runDurations = runs.map((r) => r.stats?.duration ?? 0).sort((a, b) => a - b);

  const offenders = [...perTest.values()].filter((e) => e.bad >= min && !e.title.includes('@quarantine'));
  const candidates = offenders.filter((e) => e.good > 0).map(({ key, file, line, title, runs: n, bad }) => ({ key, file, line, title, runs: n, bad }));
  const broken = offenders.filter((e) => e.good === 0);

  const md = [
    '### E2E weekly health (e2e-full, last 7 days)',
    '',
    `Runs: ${runs.length} · tests run: ${ran} · **pass rate ${pct(passed, ran)}** (first try) · flaky ${pct(flaky, ran)} · failed ${pct(failed, ran)}`,
    `Test duration p50 ${secs(quantile(testDurations, 0.5))} · p95 ${secs(quantile(testDurations, 0.95))} · run duration p50 ${mins(quantile(runDurations, 0.5))} · p95 ${mins(quantile(runDurations, 0.95))}`,
    quarantined ? `Quarantined now: ${quarantined}` : '',
    '',
    candidates.length
      ? `**To quarantine** (flaky or failed in ≥ ${min} runs, passed in at least one):\n${candidates.map((c) => `- ${c.key} — ${c.bad} of ${c.runs} runs`).join('\n')}`
      : `Nothing to quarantine (no test flaky or failed in ≥ ${min} runs).`,
    broken.length ? `\n**Failed every run** (broken, not flaky: fix, or mark test.fail with an issue):\n${broken.map((c) => `- ${c.key} — ${c.bad} of ${c.runs} runs`).join('\n')}` : '',
  ].join('\n');
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'summary.md'), md + '\n');
  writeFileSync(join(outDir, 'candidates.json'), JSON.stringify(candidates, null, 2) + '\n');
  console.log(md);
}

/** The end index (exclusive of the quote) of the string literal starting at src[start]. */
function stringEnd(src, start) {
  const q = src[start];
  for (let i = start + 1; i < src.length; i++) {
    if (src[i] === '\\') i++;
    else if (src[i] === q) return i;
  }
  return -1;
}

function tag(candidatesFile, issuesFile) {
  const candidates = JSON.parse(readFileSync(candidatesFile, 'utf8'));
  const issues = JSON.parse(readFileSync(issuesFile, 'utf8'));
  let tagged = 0;
  for (const c of candidates) {
    const issue = issues[c.key];
    if (!issue) {
      console.error(`skip (no issue): ${c.key}`);
      continue;
    }
    const path = join('e2e', c.file);
    const src = readFileSync(path, 'utf8');
    // Find `test(<quote><title><quote>` for this title. Titles are matched as written, with any
    // escaped quote in the source unescaped, so line numbers may have moved since the run.
    const re = /(^[ \t]*)test\((['"`])/gm;
    let m, done = false;
    while ((m = re.exec(src)) && !done) {
      const open = m.index + m[0].length - 1;
      const end = stringEnd(src, open);
      if (end < 0) continue;
      const literal = src.slice(open + 1, end).replace(/\\(.)/g, '$1');
      if (literal !== c.title) continue;
      const indent = m[1];
      const comment = `${indent}  // @quarantine (${issue}): flaky in e2e-full, ${c.bad} of ${c.runs} runs in 7 days (auto-quarantine,\n${indent}  // ENG-40490). Fix the cause or the test, then remove the tag.\n`;
      const lineEnd = src.indexOf('\n', end) + 1;
      const next = src.slice(0, end) + ` @quarantine (${issue})` + src.slice(end, lineEnd) + comment + src.slice(lineEnd);
      writeFileSync(path, next);
      tagged++;
      done = true;
    }
    if (!done) console.error(`skip (title not found in ${path}): ${c.title}`);
  }
  console.log(`tagged ${tagged} of ${candidates.length}`);
}

if (cmd === 'analyze') analyze(args);
else if (cmd === 'tag') tag(args[0], args[1]);
else {
  console.error('usage: e2e-flake-watch.mjs analyze <report.json>... [--min 3] [--out dir] [--quarantined N]\n       e2e-flake-watch.mjs tag <candidates.json> <issues.json>');
  process.exit(2);
}
