// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { DurationShardSequencer } from './unit-shard-sequencer.mjs';

const root = resolve(__dirname, '../..');
const recorded: Record<string, number> = JSON.parse(
  readFileSync(resolve(__dirname, 'unit-durations.json'), 'utf8')
).files;
const NEW_FILE = 'projects/cometchat-uikit/src/lib/not-yet-recorded.spec.ts';

/** The spec files a shard gets, as paths relative to the repo root. */
async function shardOf(paths: string[], index: number, count: number): Promise<string[]> {
  const ctx = { config: { root, shard: { index, count } } };
  // The sequencer reads only ctx.config; files only need a moduleId.
  const sequencer = new DurationShardSequencer(ctx as never);
  const specs = paths.map((p) => ({ moduleId: resolve(root, p) }));
  const picked = await sequencer.shard(specs as never);
  return (picked as unknown as { moduleId: string }[]).map((s) => s.moduleId.slice(root.length + 1));
}

describe('DurationShardSequencer', () => {
  const files = [...Object.keys(recorded), NEW_FILE];

  it('gives every file to exactly one of the 4 shards, including a file with no recorded time', async () => {
    const shards = await Promise.all([1, 2, 3, 4].map((i) => shardOf(files, i, 4)));
    const all = shards.flat();
    expect(all).toHaveLength(files.length);
    expect(new Set(all).size).toBe(files.length);
    expect(all).toContain(NEW_FILE);
  });

  it('splits by recorded time: the shards differ by less than the longest single file', async () => {
    const time = (p: string) => recorded[p] ?? 0;
    const totals = await Promise.all([1, 2, 3, 4].map(async (i) => (await shardOf(files, i, 4)).reduce((t, p) => t + time(p), 0)));
    const longest = Math.max(...Object.values(recorded));
    expect(Math.max(...totals) - Math.min(...totals)).toBeLessThan(longest);
  });

  it('computes the same split whatever order the files arrive in', async () => {
    const forward = await shardOf(files, 2, 4);
    const reversed = await shardOf([...files].reverse(), 2, 4);
    expect([...reversed].sort()).toEqual([...forward].sort());
  });
});
