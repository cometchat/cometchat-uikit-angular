#!/usr/bin/env node
// deps-review: what a PR does to the dependency tree, checked when it is proposed rather than at
// release. Compares the PR's package-lock.json with the base branch's and:
//   - lists every package the PR adds or moves to a new version, production and dev;
//   - fails if an added or changed production package has a licence outside
//     scripts/ci/licence-allowlist.json (the list the release's SBOM check uses), or a known
//     high or critical vulnerability (npm audit, production dependencies only);
//   - points out a new customer-facing dependency of the library (projects/cometchat-uikit
//     dependencies or peerDependencies), which every customer will install.
// CometChat's own packages are listed, not judged, as in the release check. A PR that changes no
// dependency passes at once. The full-tree audit stays in the advisory deps-audit job: a new
// advisory on an untouched package should not block unrelated PRs.
//
//   node scripts/ci/deps-review.mjs <base-sha>
import { execFileSync } from 'node:child_process';
import { appendFileSync, readFileSync } from 'node:fs';

const LOCK = 'package-lock.json';
const LIB_PACKAGE = 'projects/cometchat-uikit/package.json';
const BLOCKING_SEVERITIES = ['high', 'critical'];

const nameOf = (path) => path.slice(path.lastIndexOf('node_modules/') + 'node_modules/'.length);
const isCometChat = (name) => name.startsWith('@cometchat/');

/**
 * Packages the head lockfile adds or moves to another version, compared with the base lockfile.
 * @returns {{name: string, from: string | null, to: string, licence: string, dev: boolean}[]}
 */
export function lockChanges(baseLock, headLock) {
  const base = baseLock?.packages ?? {};
  const changes = new Map();
  for (const [path, entry] of Object.entries(headLock?.packages ?? {})) {
    if (!path || entry.link || !entry.version) continue;
    const before = base[path]?.version ?? null;
    if (before === entry.version) continue;
    const name = nameOf(path);
    const key = `${name}@${entry.version}`;
    if (changes.has(key)) continue;
    changes.set(key, {
      name,
      from: before,
      to: entry.version,
      licence: typeof entry.license === 'string' ? entry.license : entry.license?.type ?? '',
      dev: !!entry.dev,
    });
  }
  return [...changes.values()].sort((a, b) => a.name.localeCompare(b.name) || a.to.localeCompare(b.to));
}

/** Whether an SPDX licence expression is acceptable: every AND term needs an allowed OR option. */
export function licenceAllowed(expression, allowed) {
  const text = String(expression ?? '').trim().replace(/^\((.*)\)$/, '$1');
  if (!text) return false;
  return text
    .split(/\s+AND\s+/i)
    .every((term) => term.replace(/[()]/g, '').split(/\s+OR\s+/i).some((id) => allowed.includes(id.trim())));
}

/** Customer-facing dependencies of the library that the PR adds or changes. */
export function libraryDependencyChanges(basePkg, headPkg) {
  const out = [];
  for (const field of ['dependencies', 'peerDependencies']) {
    const before = basePkg?.[field] ?? {};
    for (const [name, range] of Object.entries(headPkg?.[field] ?? {})) {
      if (before[name] !== range) out.push({ field, name, from: before[name] ?? null, to: range });
    }
  }
  return out;
}

/** Production changes that must fail the PR: disallowed licence, or a high/critical advisory. */
export function blockers(changes, allowed, advisories) {
  const out = [];
  for (const c of changes) {
    if (c.dev || isCometChat(c.name)) continue;
    if (!licenceAllowed(c.licence, allowed)) out.push(`${c.name}@${c.to}: licence "${c.licence || 'none'}" is not on the allowlist`);
    const advisory = advisories[c.name];
    if (advisory && BLOCKING_SEVERITIES.includes(advisory.severity)) {
      out.push(`${c.name}@${c.to}: ${advisory.severity} vulnerability (${advisory.titles.join('; ')})`);
    }
  }
  return out;
}

/** High/critical production advisories from `npm audit --json`, by package name. */
function productionAdvisories() {
  let raw;
  try {
    raw = execFileSync('npm', ['audit', '--omit=dev', '--json'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch (err) {
    raw = err.stdout; // npm audit exits non-zero when it finds anything
  }
  const report = JSON.parse(raw || '{}');
  // A failed audit (registry unreachable, auth error) prints an error object with no
  // `vulnerabilities` key; reading that as "0 advisories" would pass the check unseen.
  if (!report.vulnerabilities) {
    throw new Error(`npm audit returned no vulnerability report${report.error ? `: ${report.error.summary ?? report.error.code}` : ''}`);
  }
  const out = {};
  for (const [name, v] of Object.entries(report.vulnerabilities)) {
    out[name] = { severity: v.severity, titles: v.via.filter((x) => typeof x === 'object').map((x) => x.title) };
  }
  return out;
}

const gitShow = (sha, path) => {
  try {
    return JSON.parse(
      execFileSync('git', ['show', `${sha}:${path}`], { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] })
    );
  } catch {
    return null;
  }
};

function main() {
  const baseSha = process.argv[2];
  if (!baseSha) {
    console.error('usage: node scripts/ci/deps-review.mjs <base-sha>');
    process.exit(2);
  }
  const allowed = JSON.parse(readFileSync('scripts/ci/licence-allowlist.json', 'utf8'));
  const changes = lockChanges(gitShow(baseSha, LOCK), JSON.parse(readFileSync(LOCK, 'utf8')));
  const library = libraryDependencyChanges(gitShow(baseSha, LIB_PACKAGE), JSON.parse(readFileSync(LIB_PACKAGE, 'utf8')));

  const lines = [];
  if (!changes.length && !library.length) {
    lines.push('### deps-review: this PR changes no dependencies');
  } else {
    const prod = changes.filter((c) => !c.dev);
    lines.push(`### deps-review: ${changes.length} package(s) added or changed (${prod.length} production, ${changes.length - prod.length} dev)`);
    if (library.length) {
      lines.push('', '**Customer-facing dependencies of the library changed** (every customer installs these):');
      for (const l of library) lines.push(`- \`${l.field}\` ${l.name}: ${l.from ?? '(new)'} → ${l.to}`);
    }
    lines.push('', '| Package | From | To | Licence | Kind |', '| --- | --- | --- | --- | --- |');
    for (const c of changes) lines.push(`| ${c.name} | ${c.from ?? '(new)'} | ${c.to} | ${c.licence || '—'} | ${c.dev ? 'dev' : 'production'} |`);
  }

  const failing = changes.some((c) => !c.dev) ? blockers(changes, allowed, productionAdvisories()) : [];
  if (failing.length) {
    lines.push('', `**✗ ${failing.length} problem(s) in added or changed production packages:**`);
    for (const f of failing) lines.push(`- ${f}`);
  }
  const text = lines.join('\n');
  console.log(text);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, text + '\n');
  if (failing.length) process.exit(1);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
