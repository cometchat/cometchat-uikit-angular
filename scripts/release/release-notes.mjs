#!/usr/bin/env node
// CI 5 (A2): the description of the pull request merged into master-v5 is the public release
// notes, as on iOS. The release bot publishes it as the GitHub Release in
// cometchat/cometchat-uikit-angular, and GitHub emails it to everyone watching that repo, so it
// must be complete and must not mention anything internal.
//
//   PR_BODY=… node scripts/release/release-notes.mjs
//
// Run on pull requests into master-v5 (.github/workflows/release-notes.yml), so problems show
// before the merge. A PR whose version is already on npm doesn't release, so it isn't checked.
// The release itself checks again (verify-release.mjs) and stops before anything is built.
import { execFileSync } from 'node:child_process';
import { appendFileSync, readFileSync, realpathSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export const SECTIONS = ['New', 'Enhancements', 'Fixes'];
const INTERNAL = [
  { pattern: /\bENG-\d+\b/i, what: 'an internal ticket ID' },
  { pattern: /cometchat-team\//i, what: 'a link to a private cometchat-team repo' },
  { pattern: /\blinear\.app\b/i, what: 'a Linear link' },
  { pattern: /\bclaude\.ai\/code\b/i, what: 'a link to a Claude Code session' },
  // In the public repo's Release, GitHub links a bare "#123" to that repo's own issue or PR 123,
  // an unrelated one. Not "&#123;", "page#12" or "owner/repo#12", which name what they mean.
  { pattern: /(?<![\w&/#])#\d+\b/, what: 'a bare #number, which links to an unrelated issue or PR in the public repo' },
];

/** The notes as published: HTML comments (notes to the author) removed, line endings normalised. */
export function releaseNotes(body) {
  return String(body ?? '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\r\n?/g, '\n')
    .trim();
}

/**
 * Why a PR description can't be published as release notes; [] when it can.
 * @param {string | null | undefined} body
 * @returns {string[]}
 */
export function notesProblems(body) {
  const notes = releaseNotes(body);
  if (!notes) return ['The description is empty.'];
  const problems = [];
  const missing = SECTIONS.filter((s) => !new RegExp(`^#{1,6}[ \\t]*${s}\\b`, 'im').test(notes));
  if (missing.length) {
    problems.push(`No ${missing.map((s) => `"## ${s}"`).join(', ')} heading. Every release lists ${SECTIONS.join(', ')}; write "- None" under an empty one.`);
  }
  notes.split('\n').forEach((line, i) => {
    for (const { pattern, what } of INTERNAL) {
      const m = line.match(pattern);
      if (m) problems.push(`Line ${i + 1} has ${what} (${m[0]}): ${line.trim().slice(0, 120)}`);
    }
  });
  return problems;
}

function main() {
  const version = JSON.parse(readFileSync('package.json', 'utf8')).version;
  const name = JSON.parse(readFileSync('projects/cometchat-uikit/package.json', 'utf8')).name;
  let onNpm = false;
  try {
    onNpm = execFileSync('npm', ['view', `${name}@${version}`, 'version'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim() === version;
  } catch {
    onNpm = false; // E404: not published
  }
  if (onNpm) {
    console.log(`✓ ${version} is already on npm, so merging this doesn't release: the description isn't release notes.`);
    return;
  }
  const problems = notesProblems(process.env.PR_BODY);
  if (problems.length) {
    console.error(`✗ Merging this releases ${version}, and its description becomes the public release notes:`);
    for (const p of problems) console.error(`  - ${p}`);
    console.error('Edit the description; this check runs again.');
    process.exit(1);
  }
  console.log(`✓ The description can be the release notes of ${version}.`);
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, `### Release notes of v${version}, as they will be published\n\n${releaseNotes(process.env.PR_BODY)}\n`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) main();
