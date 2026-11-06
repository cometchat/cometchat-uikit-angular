#!/usr/bin/env node
// CI 4 version-consistency and changelog (ENG-40487, Track 2 GOV3).
// The release version lives in three places; they must agree:
//   package.json, projects/cometchat-uikit/package.json, and every `version: 'x.y.z'` in
//   projects/cometchat-uikit/src/lib/cometchat-uikit.ts (reported to the SDK at runtime).
// With --changelog (PRs into master-v5), CHANGELOG.md must also have a `## [x.y.z]` entry for it.
import { existsSync, readFileSync } from 'node:fs';

const read = (p) => readFileSync(p, 'utf8');
const root = JSON.parse(read('package.json')).version;
const lib = JSON.parse(read('projects/cometchat-uikit/package.json')).version;
const runtime = [...read('projects/cometchat-uikit/src/lib/cometchat-uikit.ts').matchAll(/version:\s*'(\d+\.\d+\.\d+[^']*)'/g)].map((m) => m[1]);

const problems = [];
if (runtime.length === 0) problems.push('no version string found in cometchat-uikit.ts');
for (const [where, v] of [['projects/cometchat-uikit/package.json', lib], ...runtime.map((v, i) => [`cometchat-uikit.ts (occurrence ${i + 1})`, v])]) {
  if (v !== root) problems.push(`${where} says ${v}, package.json says ${root}`);
}

if (process.argv.includes('--changelog')) {
  if (!existsSync('CHANGELOG.md')) {
    problems.push('CHANGELOG.md does not exist');
  } else {
    const escaped = root.replace(/\./g, '\\.');
    // Keep a Changelog heading: "## [5.2.3]", optionally followed by " - <date>".
    const heading = new RegExp(`^## \\[${escaped}\\]`, 'm');
    if (!heading.test(read('CHANGELOG.md'))) problems.push(`CHANGELOG.md has no "## [${root}]" heading`);
  }
}

if (problems.length) {
  for (const p of problems) console.error(`✗ ${p}`);
  process.exit(1);
}
console.log(`✓ version ${root} is consistent across package.json, the library package.json and cometchat-uikit.ts${process.argv.includes('--changelog') ? ', and CHANGELOG.md has an entry' : ''}`);
