#!/usr/bin/env node
// The PR gate's Lighthouse report (ported from PR #553's lighthouse-average.js): reads every run
// in .lighthouseci/ and reports the average (mean) of the category scores and the main timings,
// headed by the final Performance score. Averaging the runs smooths out CI noise.
//
// Writes lighthouse-report.md (the PR comment, found again by its first-line marker), prints it,
// and adds it to the job summary. Report-only: always exits 0.
import { appendFileSync, existsSync, readdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export const MARKER = '<!-- pr-gate-lighthouse -->';

const CATEGORIES = [
  ['performance', 'Performance'],
  ['accessibility', 'Accessibility'],
  ['best-practices', 'Best Practices'],
  ['seo', 'SEO'],
];

const METRICS = [
  ['first-contentful-paint', 'First Contentful Paint', 'ms'],
  ['largest-contentful-paint', 'Largest Contentful Paint', 'ms'],
  ['total-blocking-time', 'Total Blocking Time', 'ms'],
  ['cumulative-layout-shift', 'Cumulative Layout Shift', ''],
  ['speed-index', 'Speed Index', 'ms'],
  ['interactive', 'Time to Interactive', 'ms'],
];

/** Every run's result: the raw lhr-*.json from `collect`, else the *.report.json from `upload`. */
export function loadRuns(dir) {
  if (!existsSync(dir)) return [];
  const files = readdirSync(dir);
  let picked = files.filter((f) => f.startsWith('lhr-') && f.endsWith('.json'));
  if (picked.length === 0) picked = files.filter((f) => f.endsWith('.report.json'));
  const runs = [];
  for (const f of picked) {
    try {
      runs.push(JSON.parse(readFileSync(join(dir, f), 'utf8')));
    } catch {
      // An unreadable file is skipped; the others still count.
    }
  }
  return runs;
}

export function mean(values) {
  const valid = values.filter((v) => typeof v === 'number' && !Number.isNaN(v));
  return valid.length ? valid.reduce((a, b) => a + b, 0) / valid.length : null;
}

/** A 0–1 score as 0–100 with Lighthouse's colour bands: ≥90 good, 50–89 needs work, <50 poor. */
export function score(avg) {
  if (avg == null) return 'n/a';
  const pct = Math.round(avg * 100);
  return `${pct >= 90 ? '🟢' : pct >= 50 ? '🟠' : '🔴'} ${pct}`;
}

function metric(avg, unit) {
  if (avg == null) return 'n/a';
  return unit === 'ms' ? `${Math.round(avg)} ms` : avg.toFixed(3);
}

/** The report's markdown for these runs. */
export function report(runs, { coldCache = true } = {}) {
  const lines = [MARKER];
  if (runs.length === 0) {
    lines.push('## Lighthouse', '', 'No Lighthouse results were found in `.lighthouseci/`; see the job log.');
    return lines.join('\n');
  }
  const categoryAvg = (key) => mean(runs.map((r) => r.categories?.[key]?.score));
  const url = runs[0].finalDisplayedUrl || runs[0].finalUrl || runs[0].requestedUrl || 'the app';
  lines.push(
    `## Lighthouse: Performance ${score(categoryAvg('performance'))}`,
    '',
    `Average of ${runs.length} run${runs.length === 1 ? '' : 's'} of the signed-in sample app (\`${url}\`), desktop profile, ${coldCache ? 'cold cache (a first load)' : 'warm cache'}.`,
    '',
    '| Category | Average score |',
    '| -- | -- |'
  );
  for (const [key, label] of CATEGORIES) {
    if (runs.every((r) => r.categories?.[key]?.score == null)) continue;
    lines.push(`| ${label} | ${score(categoryAvg(key))} |`);
  }
  lines.push('', '| Timing | Average |', '| -- | -- |');
  for (const [id, label, unit] of METRICS) {
    const values = runs.map((r) => r.audits?.[id]?.numericValue);
    if (values.every((v) => v == null)) continue;
    lines.push(`| ${label} | ${metric(mean(values), unit)} |`);
  }
  lines.push(
    '',
    '<sub>Scores are 0–100 (🟢 90+ · 🟠 50–89 · 🔴 under 50). Report only: this check never blocks a merge. The full HTML reports are in the run’s `lighthouse-reports` artifact.</sub>'
  );
  return lines.join('\n');
}

function main() {
  const dir = resolve(process.cwd(), '.lighthouseci');
  const coldCache = (process.env.LH_COLD_CACHE || 'true').toLowerCase() !== 'false';
  const md = report(loadRuns(dir), { coldCache }) + '\n';
  process.stdout.write(md);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, md);
  writeFileSync(resolve(process.cwd(), 'lighthouse-report.md'), md);
}

if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) main();
