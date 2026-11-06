#!/usr/bin/env node
// Record per-file unit test run times for the shard sequencer (scripts/ci/unit-shard-sequencer.mjs).
//
//   node scripts/ci/unit-durations.mjs <blob report folder | vitest json report> [--shards 4]
//
// Best input: the four `vitest-blob-*` artifacts of a pr-gate run, downloaded into one folder
// (gh run download <run id> --pattern 'vitest-blob-*' --dir blobs). They hold CI's own timings,
// and each file's cost includes its environment, setup and collect time, not only its tests. A
// Vitest JSON report of a local run also works, but has test time only and a laptop's speed.
// Writes scripts/ci/unit-durations.json and prints how the files would split across the shards:
// by file count (Vitest's default) and by time (the sequencer).
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { createHash } from 'node:crypto';

const [, , input, ...rest] = process.argv;
if (!input) {
  console.error('usage: node scripts/ci/unit-durations.mjs <blob report folder | vitest json report> [--shards 4]');
  process.exit(1);
}
const count = Number(rest[rest.indexOf('--shards') + 1] ?? 4) || 4;

// Blob reports are written with `flatted`. Its parse, from flatted 3.x (ISC, Andrea Giammarchi),
// so this script needs no extra dependency.
function unflatten(text) {
  const ignore = {};
  const input = JSON.parse(text, (_, v) => (typeof v === 'string' ? new String(v) : v)).map((v) =>
    v instanceof String ? String(v) : v
  );
  const revive = (parsed, output) => {
    const lazy = [];
    for (const k of Object.keys(output)) {
      const value = output[k];
      if (value instanceof String) {
        const tmp = input[value];
        if (typeof tmp === 'object' && tmp !== null && !parsed.has(tmp)) {
          parsed.add(tmp);
          output[k] = ignore;
          lazy.push([k, tmp]);
        } else output[k] = tmp;
      }
    }
    for (const [k, tmp] of lazy) output[k] = revive(parsed, tmp);
    return output;
  };
  return typeof input[0] === 'object' && input[0] ? revive(new Set(), input[0]) : input[0];
}

const times = {};
if (statSync(input).isDirectory()) {
  const walk = (d) => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));
  const raw = [];
  for (const blob of walk(input).filter((f) => f.endsWith('.json'))) {
    for (const file of unflatten(readFileSync(blob, 'utf8'))[1]) {
      const cost =
        (file.result?.duration ?? 0) +
        (file.environmentLoad ?? 0) +
        (file.setupDuration ?? 0) +
        (file.collectDuration ?? 0) +
        (file.prepareDuration ?? 0);
      raw.push([file.filepath, cost]);
    }
  }
  // Paths are absolute on the runner: drop the part they all share (the checkout folder).
  let prefix = raw[0][0];
  for (const [p] of raw) while (!p.startsWith(prefix)) prefix = prefix.slice(0, prefix.lastIndexOf('/', prefix.length - 2) + 1);
  for (const [p, t] of raw) times[p.slice(prefix.length)] = Math.round(t);
} else {
  for (const r of JSON.parse(readFileSync(input, 'utf8')).testResults) {
    times[relative(process.cwd(), r.name).split(sep).join('/')] = Math.round(r.endTime - r.startTime);
  }
}

const files = Object.fromEntries(Object.entries(times).sort(([a], [b]) => (a < b ? -1 : 1)));
writeFileSync(
  'scripts/ci/unit-durations.json',
  JSON.stringify({ measured: new Date().toISOString().slice(0, 10), files }, null, 2) + '\n'
);

// Vitest's default split: files ordered by a hash of their path, then equal counts per shard.
const byHash = Object.keys(files)
  .map((f) => ({ f, h: createHash('sha1').update('/' + f).digest('hex') }))
  .sort((a, b) => (a.h < b.h ? -1 : 1))
  .map(({ f }) => f);
const countTotals = [];
let start = 0;
for (let i = 1; i <= count; i++) {
  const size = Math.floor(byHash.length / count) + (i <= byHash.length % count ? 1 : 0);
  countTotals.push(byHash.slice(start, start + size).reduce((t, f) => t + files[f], 0));
  start += size;
}
// The sequencer's split: longest first, each to the shard with the least time so far.
const timeTotals = new Array(count).fill(0);
for (const [, t] of Object.entries(files).sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))) {
  timeTotals[timeTotals.indexOf(Math.min(...timeTotals))] += t;
}
const fmt = (totals) => totals.map((t) => `${(t / 60_000).toFixed(1)}`).join(' / ') + ' min';
const spread = (totals) => `${((Math.max(...totals) - Math.min(...totals)) / 60_000).toFixed(1)} min`;
console.log(`${Object.keys(files).length} files, ${(Object.values(files).reduce((a, b) => a + b, 0) / 60_000).toFixed(1)} min in all`);
console.log(`by file count (Vitest default): ${fmt(countTotals)}  (slowest − fastest: ${spread(countTotals)})`);
console.log(`by recorded time (sequencer):   ${fmt(timeTotals)}  (slowest − fastest: ${spread(timeTotals)})`);
