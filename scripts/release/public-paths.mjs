#!/usr/bin/env node
// CI 5 (A5): what goes to the public repo is decided path by path, as React does
// (.github/public-sync/ there).
//
//   node scripts/release/public-paths.mjs check [<ref>]     every tracked path of <ref> (default
//                                                           HEAD) is classified (PR gate)
//   node scripts/release/public-paths.mjs prune <ref> <dir> the same check, then delete <ref>'s
//                                                           internal paths from <dir>, an export
//                                                           of <ref> (stage-public.sh)
//
// scripts/release/allowlist.txt lists what may go public, scripts/release/internal.txt what stays
// here. One entry per line: a path, a folder with a trailing slash, or **/<name> for a file of
// that name anywhere. An internal entry wins over an allowlist one: scripts/ is public,
// scripts/release/ isn't. A tracked path in neither list fails the PR gate and stops the release
// until it is added to one of them, so nothing new goes public by accident.
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, realpathSync, rmSync, rmdirSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));

/** The entries of a list file: blank lines and # comments dropped. */
export function parseList(text) {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'));
}

/** Does a list entry cover a tracked file path? */
export function covers(entry, path) {
  if (entry.startsWith('**/')) {
    const name = entry.slice(3);
    return path === name || path.endsWith(`/${name}`);
  }
  return entry.endsWith('/') ? path.startsWith(entry) : path === entry;
}

/**
 * @param {string[]} paths tracked file paths
 * @param {string[]} allow allowlist entries
 * @param {string[]} internal internal entries (they win)
 */
export function classify(paths, allow, internal) {
  const result = { publicPaths: [], internalPaths: [], unclassified: [] };
  for (const path of paths) {
    if (internal.some((e) => covers(e, path))) result.internalPaths.push(path);
    else if (allow.some((e) => covers(e, path))) result.publicPaths.push(path);
    else result.unclassified.push(path);
  }
  return result;
}

/** Unclassified paths as their top-level file or folder, with how many files each holds. */
export function summarise(unclassified) {
  const counts = new Map();
  for (const path of unclassified) {
    const top = path.includes('/') ? `${path.split('/')[0]}/` : path;
    counts.set(top, (counts.get(top) ?? 0) + 1);
  }
  return [...counts].map(([top, n]) => (top.endsWith('/') ? `${top} (${n} file${n === 1 ? '' : 's'})` : top));
}

/** Every file under dir, as paths relative to it. */
function filesUnder(dir) {
  return readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((d) => !d.isDirectory())
    .map((d) => relative(dir, join(d.parentPath, d.name)).split('\\').join('/'));
}

/** Removes the folders under dir that are left empty, deepest first. */
function removeEmptyFolders(dir) {
  for (const d of readdirSync(dir, { withFileTypes: true })) {
    if (!d.isDirectory()) continue;
    const sub = join(dir, d.name);
    removeEmptyFolders(sub);
    if (readdirSync(sub).length === 0) rmdirSync(sub);
  }
}

function main() {
  const [mode, ref = 'HEAD', dir] = process.argv.slice(2);
  if (mode !== 'check' && !(mode === 'prune' && dir)) {
    console.error('usage: public-paths.mjs check [<ref>] | prune <ref> <dir>');
    process.exit(2);
  }
  const root = execFileSync('git', ['-C', HERE, 'rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
  const list = (name) => parseList(readFileSync(join(HERE, name), 'utf8'));
  const paths = execFileSync('git', ['-C', root, 'ls-tree', '-r', '--name-only', '-z', ref], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
    .split('\0')
    .filter(Boolean);
  const { publicPaths, internalPaths, unclassified } = classify(paths, list('allowlist.txt'), list('internal.txt'));

  if (unclassified.length) {
    console.error(`✗ ${unclassified.length} tracked file(s) are in neither scripts/release/allowlist.txt (may go public) nor internal.txt (stays here):`);
    for (const s of summarise(unclassified)) console.error(`  - ${s}`);
    console.error('Add each to one of the two lists.');
    process.exit(1);
  }
  console.log(`✓ every tracked path is classified: ${publicPaths.length} files may go public, ${internalPaths.length} stay internal`);
  if (mode === 'check') return;

  for (const path of internalPaths) rmSync(join(dir, path), { force: true });
  removeEmptyFolders(dir);
  // The export must now hold exactly the public files: anything else means the export and the
  // tree disagree (an export-ignore attribute, say), which the lists didn't decide.
  const staged = new Set(filesUnder(dir));
  const missing = publicPaths.filter((p) => !staged.has(p));
  const extra = [...staged].filter((p) => !publicPaths.includes(p));
  if (missing.length || extra.length) {
    console.error(`✗ the staged copy differs from the allowlist: ${missing.length} missing (${missing.slice(0, 5).join(', ')}), ${extra.length} unexpected (${extra.slice(0, 5).join(', ')})`);
    process.exit(1);
  }
  console.log(`✓ removed ${internalPaths.length} internal files from ${dir}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) main();
