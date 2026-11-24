#!/usr/bin/env node
// CI 5 (A6): give a rehearsal its own version, <V>-citest.<run> as iOS does, so every rehearsal
// gets a fresh tag and Release in the rehearsal repo (tags are never moved).
//
//   node scripts/release/set-version.mjs <version> [<dir>]
//
// Rewrites every place the version lives, in <dir> (default: the current folder): package.json,
// package-lock.json (its root entries), the library's package.json and cometchat-uikit.ts. The
// release runs it on its checkout before building the package and on the staged public copy,
// so both builds have the same version and the package digests still match. It changes nothing
// when the version is already <version>, so real releases run it too.
import { readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

export const RUNTIME_FILE = 'projects/cometchat-uikit/src/lib/cometchat-uikit.ts';

/** package.json, rewritten the way npm writes it (it round-trips). */
export function setPackageVersion(text, version) {
  return JSON.stringify({ ...JSON.parse(text), version }, null, 2) + '\n';
}

/** package-lock.json: the root project's version, at the top and in packages[""]. */
export function setLockVersion(text, version) {
  const lock = JSON.parse(text);
  lock.version = version;
  if (lock.packages?.['']) lock.packages[''].version = version;
  return JSON.stringify(lock, null, 2) + '\n';
}

/** The library's package.json, whose formatting doesn't round-trip: only its top-level version changes. */
export function setLibraryVersion(text, version) {
  const out = text.replace(/("version"\s*:\s*")[^"]*(")/, `$1${version}$2`);
  if (JSON.parse(out).version !== version) throw new Error('could not set the library version');
  return out;
}

/** cometchat-uikit.ts: every `version: '…'` (the runtime reports it to window.CometChatUiKit). */
export function setRuntimeVersion(text, version) {
  if (!/version:\s*'[^']+'/.test(text)) throw new Error(`no version: '…' in ${RUNTIME_FILE}`);
  return text.replace(/(version:\s*')[^']+(')/g, `$1${version}$2`);
}

function main() {
  const [version, dir = '.'] = process.argv.slice(2);
  if (!/^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/.test(version ?? '')) {
    console.error(`usage: set-version.mjs <version> [<dir>]; '${version ?? ''}' is not a version`);
    process.exit(2);
  }
  const edits = [
    ['package.json', setPackageVersion],
    ['package-lock.json', setLockVersion],
    ['projects/cometchat-uikit/package.json', setLibraryVersion],
    [RUNTIME_FILE, setRuntimeVersion],
  ];
  let changed = 0;
  for (const [file, edit] of edits) {
    const path = join(dir, file);
    const before = readFileSync(path, 'utf8');
    const after = edit(before, version);
    if (after !== before) {
      writeFileSync(path, after);
      changed++;
    }
  }
  console.log(changed ? `Version set to ${version} in ${changed} files under ${dir}` : `Version is already ${version}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) main();
