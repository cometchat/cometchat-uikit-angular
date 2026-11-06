#!/usr/bin/env node
// CI lockfile-check: every package in package-lock.json must resolve from public npm.
// A private-registry URL (e.g. the Cloudsmith one that broke `npm ci` before PR #596)
// makes a clean install fail for anyone without credentials, including CI.
import { readFileSync } from 'node:fs';

const REGISTRY = 'https://registry.npmjs.org/';
const lock = JSON.parse(readFileSync(new URL('../../package-lock.json', import.meta.url), 'utf8'));

const bad = Object.entries(lock.packages ?? {})
  .filter(([, pkg]) => pkg.resolved && !pkg.link && !pkg.resolved.startsWith(REGISTRY))
  .map(([path, pkg]) => `${path} -> ${pkg.resolved}`);

const checked = Object.values(lock.packages ?? {}).filter((pkg) => pkg.resolved).length;
if (checked === 0) {
  console.error('lockfile-check: no resolved packages found; is package-lock.json empty?');
  process.exit(1);
}
if (bad.length > 0) {
  console.error(`lockfile-check: ${bad.length} package(s) do not resolve from ${REGISTRY}:`);
  for (const line of bad) console.error(`  ${line}`);
  process.exit(1);
}
console.log(`lockfile-check: all ${checked} resolved packages come from ${REGISTRY}`);
