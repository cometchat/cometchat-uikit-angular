#!/usr/bin/env node
// CI 4 health metrics (ENG-40488), from run history only: nothing is re-run to measure.
//
//   node scripts/ci/ci-health.mjs [--days 28] [--workflow pr-gate.yml]
//
// Reads the workflow's runs and their jobs (every attempt) from the GitHub API with a read-only
// token (GITHUB_TOKEN or GH_TOKEN; GITHUB_REPOSITORY, default cometchat-team/uikit-angular) and
// reports, for the last 7 days and the last --days days:
//   - ci-gate pass rate, and p50/p95 time from the run starting to ci-gate finishing;
//   - unit and E2E stage p50/p95 (the slowest shard of each run attempt);
//   - flaky reruns: runs that passed only on a later attempt, and jobs that failed and then passed;
//   - failures per job;
// plus the current quarantine count (`@quarantine` tests in e2e/) and the 10 slowest unit test
// files recorded in scripts/ci/unit-durations.json, if present.
// Writes ci-health.md (also to the job summary) and ci-health.json.
import { readFileSync, writeFileSync, appendFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const arg = (name, fallback) => {
  const i = process.argv.indexOf(name);
  return i === -1 ? fallback : process.argv[i + 1];
};
const days = Number(arg('--days', 28));
const workflow = arg('--workflow', 'pr-gate.yml');
const repo = process.env.GITHUB_REPOSITORY || 'cometchat-team/uikit-angular';
const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
if (!token) {
  console.error('Set GITHUB_TOKEN (or GH_TOKEN) to a token that can read Actions.');
  process.exit(1);
}

async function gh(path) {
  const res = await fetch(`https://api.github.com/repos/${repo}/${path}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' },
  });
  if (!res.ok) throw new Error(`GET ${path.split('?')[0]} → HTTP ${res.status}`);
  return res.json();
}

async function pages(path, key) {
  const items = [];
  for (let page = 1; ; page++) {
    const res = await gh(`${path}${path.includes('?') ? '&' : '?'}per_page=100&page=${page}`);
    items.push(...res[key]);
    if (res[key].length < 100) return items;
  }
}

const now = Date.now();
const since = new Date(now - days * 86_400_000).toISOString().slice(0, 10);
const runs = (await pages(`actions/workflows/${workflow}/runs?created=>=${since}`, 'workflow_runs')).filter(
  (r) => r.status === 'completed'
);
// Jobs of every attempt, 8 runs at a time.
for (let i = 0; i < runs.length; i += 8) {
  await Promise.all(runs.slice(i, i + 8).map(async (run) => (run.jobs = await pages(`actions/runs/${run.id}/jobs?filter=all`, 'jobs'))));
}

const ms = (a, b) => (a && b ? new Date(b) - new Date(a) : NaN);
const minutes = (v) => (Number.isFinite(v) ? `${(v / 60_000).toFixed(1)} min` : '–');
function percentile(values, p) {
  const v = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!v.length) return NaN;
  return v[Math.min(v.length - 1, Math.ceil((p / 100) * v.length) - 1)];
}
// "unit 3/4" → "unit", so shards are counted as one job.
const jobKey = (name) => name.replace(/\s+\d+\/\d+$/, '').replace(/\s+\$\{\{.*\}\}\/\d+$/, '');

/** The slowest shard of `stage` in each run attempt. */
function stageTimes(list, stage) {
  const out = [];
  for (const run of list) {
    const byAttempt = new Map();
    for (const job of run.jobs) {
      if (jobKey(job.name) !== stage || job.conclusion !== 'success') continue;
      const t = ms(job.started_at, job.completed_at);
      byAttempt.set(job.run_attempt, Math.max(byAttempt.get(job.run_attempt) ?? 0, t));
    }
    out.push(...byAttempt.values());
  }
  return out;
}

function summarise(windowDays) {
  const from = now - windowDays * 86_400_000;
  const list = runs.filter((r) => new Date(r.created_at) >= from);
  const gates = list.map((r) => {
    const gate = r.jobs.filter((j) => j.name === 'ci-gate' && j.run_attempt === r.run_attempt)[0];
    return { run: r, gate, time: gate ? ms(r.run_started_at, gate.completed_at) : NaN };
  });
  const decided = gates.filter((g) => g.gate && ['success', 'failure'].includes(g.gate.conclusion));
  const passed = decided.filter((g) => g.gate.conclusion === 'success');
  const failures = {};
  const flakyJobs = {};
  for (const run of list) {
    const byJob = new Map();
    for (const job of run.jobs) {
      if (job.conclusion === 'failure') failures[jobKey(job.name)] = (failures[jobKey(job.name)] ?? 0) + 1;
      const list2 = byJob.get(job.name) ?? [];
      list2.push(job);
      byJob.set(job.name, list2);
    }
    for (const [name, attempts] of byJob) {
      const sorted = attempts.sort((a, b) => a.run_attempt - b.run_attempt);
      if (sorted.some((j) => j.conclusion === 'failure') && sorted.at(-1).conclusion === 'success') {
        flakyJobs[jobKey(name)] = (flakyJobs[jobKey(name)] ?? 0) + 1;
      }
    }
  }
  return {
    days: windowDays,
    runs: list.length,
    gateDecided: decided.length,
    gatePassRate: decided.length ? passed.length / decided.length : NaN,
    gateP50: percentile(passed.map((g) => g.time), 50),
    gateP95: percentile(passed.map((g) => g.time), 95),
    unitP50: percentile(stageTimes(list, 'unit'), 50),
    unitP95: percentile(stageTimes(list, 'unit'), 95),
    e2eP50: percentile(stageTimes(list, 'e2e-full'), 50),
    e2eP95: percentile(stageTimes(list, 'e2e-full'), 95),
    passedOnRerun: list.filter((r) => r.run_attempt > 1 && r.conclusion === 'success').length,
    flakyJobs,
    failures,
  };
}

function quarantineCount() {
  const walk = (d) =>
    readdirSync(d).flatMap((f) => {
      const p = join(d, f);
      return statSync(p).isDirectory() ? walk(p) : p.endsWith('.spec.ts') ? [p] : [];
    });
  if (!existsSync('e2e')) return NaN;
  const title = /\btest\s*\(\s*(['"`])((?:(?!\1).)*@quarantine(?:(?!\1).)*)\1/g;
  return walk('e2e').reduce((n, f) => n + [...readFileSync(f, 'utf8').matchAll(title)].length, 0);
}

function slowestUnitFiles() {
  const file = 'scripts/ci/unit-durations.json';
  if (!existsSync(file)) return [];
  const { files } = JSON.parse(readFileSync(file, 'utf8'));
  return Object.entries(files)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
}

const windows = [summarise(7), summarise(days)];
const quarantined = quarantineCount();
const slowest = slowestUnitFiles();
const pct = (v) => (Number.isFinite(v) ? `${(v * 100).toFixed(0)}%` : '–');
const counts = (obj) =>
  Object.entries(obj)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${k} ${v}`)
    .join(', ') || 'none';

const md = [
  `### CI health: ${workflow}`,
  '',
  `From run history up to ${new Date(now).toISOString().slice(0, 16).replace('T', ' ')} UTC. Times are for passing runs; unit and E2E are the slowest shard.`,
  '',
  `| | last ${windows[0].days} days | last ${windows[1].days} days |`,
  '|---|---|---|',
  `| completed runs | ${windows[0].runs} | ${windows[1].runs} |`,
  `| ci-gate pass rate | ${pct(windows[0].gatePassRate)} (${windows[0].gateDecided}) | ${pct(windows[1].gatePassRate)} (${windows[1].gateDecided}) |`,
  `| ci-gate p50 / p95 | ${minutes(windows[0].gateP50)} / ${minutes(windows[0].gateP95)} | ${minutes(windows[1].gateP50)} / ${minutes(windows[1].gateP95)} |`,
  `| unit p50 / p95 | ${minutes(windows[0].unitP50)} / ${minutes(windows[0].unitP95)} | ${minutes(windows[1].unitP50)} / ${minutes(windows[1].unitP95)} |`,
  `| e2e-full p50 / p95 | ${minutes(windows[0].e2eP50)} / ${minutes(windows[0].e2eP95)} | ${minutes(windows[1].e2eP50)} / ${minutes(windows[1].e2eP95)} |`,
  `| runs passing only on a rerun | ${windows[0].passedOnRerun} | ${windows[1].passedOnRerun} |`,
  `| jobs that failed, then passed | ${counts(windows[0].flakyJobs)} | ${counts(windows[1].flakyJobs)} |`,
  `| failed jobs | ${counts(windows[0].failures)} | ${counts(windows[1].failures)} |`,
  '',
  `**Quarantined E2E tests:** ${Number.isFinite(quarantined) ? quarantined : '–'}`,
  ...(slowest.length
    ? ['', '**10 slowest unit test files** (scripts/ci/unit-durations.json)', '', ...slowest.map(([f, t]) => `- ${f}: ${(t / 1000).toFixed(1)} s`)]
    : []),
  '',
].join('\n');

writeFileSync('ci-health.md', md);
writeFileSync('ci-health.json', JSON.stringify({ workflow, generatedAt: new Date(now).toISOString(), windows, quarantined, slowest }, null, 2));
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, md);
console.log(md);
