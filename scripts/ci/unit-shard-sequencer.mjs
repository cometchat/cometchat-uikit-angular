// CI 1 (ENG-40609): split unit test files across `--shard` by recorded run time, not file count.
//
// Vitest's own sharding gives each shard the same number of files, so the shard that draws the
// heavy specs (call logs, conversations, group members, users, groups) sets the PR's wait. This
// keeps Vitest's sort order but replaces the split: files are dealt longest first, each to the
// shard with the least time so far, using scripts/ci/unit-durations.json. A file missing from it
// (a new spec) counts as the median. Ties go by path, so every shard computes the same split.
//
// Refresh the durations after big test changes: node scripts/ci/unit-durations.mjs <vitest json>.
import { existsSync, readFileSync } from 'node:fs';
import { relative, resolve, sep } from 'node:path';
import { BaseSequencer } from 'vitest/node';

const DURATIONS = resolve(import.meta.dirname, 'unit-durations.json');

export class DurationShardSequencer extends BaseSequencer {
  async shard(files) {
    if (!existsSync(DURATIONS)) return super.shard(files);
    const { index, count } = this.ctx.config.shard;
    const recorded = JSON.parse(readFileSync(DURATIONS, 'utf8')).files;
    const known = Object.values(recorded).sort((a, b) => a - b);
    const median = known.length ? known[Math.floor(known.length / 2)] : 1;

    const items = files
      .map((spec) => {
        const key = relative(this.ctx.config.root, spec.moduleId).split(sep).join('/');
        return { spec, key, time: recorded[key] ?? median };
      })
      .sort((a, b) => b.time - a.time || (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));

    const totals = new Array(count).fill(0);
    const shards = Array.from({ length: count }, () => []);
    for (const item of items) {
      const lightest = totals.indexOf(Math.min(...totals));
      totals[lightest] += item.time;
      shards[lightest].push(item.spec);
    }
    return shards[index - 1];
  }
}
