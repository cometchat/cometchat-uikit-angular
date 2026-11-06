// @vitest-environment node
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { MARKER, loadRuns, mean, report, score } from './lighthouse-report.mjs';

const run = (perf: number | null, a11y: number, lcp: number) => ({
  finalDisplayedUrl: 'http://localhost:9001/home',
  categories: { performance: { score: perf }, accessibility: { score: a11y } },
  audits: { 'largest-contentful-paint': { numericValue: lcp } },
});

describe('mean', () => {
  it('averages numbers and ignores missing values', () => {
    expect(mean([0.8, null, 0.9, undefined, Number.NaN])).toBeCloseTo(0.85);
  });

  it('is null when nothing was measured', () => {
    expect(mean([null, undefined])).toBeNull();
  });
});

describe('score', () => {
  it("uses Lighthouse's colour bands on a 0-100 scale", () => {
    expect(score(0.9)).toBe('🟢 90');
    expect(score(0.894)).toBe('🟠 89');
    expect(score(0.5)).toBe('🟠 50');
    expect(score(0.49)).toBe('🔴 49');
    expect(score(null)).toBe('n/a');
  });
});

describe('report', () => {
  it('starts with the marker the PR comment is found by', () => {
    expect(report([]).split('\n')[0]).toBe(MARKER);
    expect(report([run(0.9, 1, 1000)]).split('\n')[0]).toBe(MARKER);
  });

  it('heads the report with the average Performance score of all runs', () => {
    const md = report([run(0.8, 1, 1000), run(0.9, 0.9, 1400), run(null, 0.8, 1200)]);
    expect(md).toContain('## Lighthouse: Performance 🟠 85');
    expect(md).toContain('Average of 3 runs');
    expect(md).toContain('| Accessibility | 🟢 90 |');
    expect(md).toContain('| Largest Contentful Paint | 1200 ms |');
  });

  it('leaves out categories and timings no run measured', () => {
    const md = report([run(0.9, 1, 1000)]);
    expect(md).not.toContain('SEO');
    expect(md).not.toContain('Speed Index');
  });

  it('says so when there are no results, instead of failing', () => {
    expect(report([])).toContain('No Lighthouse results were found');
  });

  it('names the cache mode', () => {
    expect(report([run(0.9, 1, 1000)])).toContain('cold cache');
    expect(report([run(0.9, 1, 1000)], { coldCache: false })).toContain('warm cache');
  });
});

describe('loadRuns', () => {
  let dir = '';
  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  it('reads the raw lhr-*.json runs and skips unreadable files', () => {
    dir = mkdtempSync(join(tmpdir(), 'lhci-'));
    writeFileSync(join(dir, 'lhr-1.json'), JSON.stringify(run(0.9, 1, 1000)));
    writeFileSync(join(dir, 'lhr-2.json'), '{ not json');
    writeFileSync(join(dir, 'home.report.json'), JSON.stringify(run(0.1, 1, 9000)));
    expect(loadRuns(dir).map((r) => r.categories.performance.score)).toEqual([0.9]);
  });

  it('falls back to the uploaded *.report.json files', () => {
    dir = mkdtempSync(join(tmpdir(), 'lhci-'));
    writeFileSync(join(dir, 'home.report.json'), JSON.stringify(run(0.7, 1, 2000)));
    expect(loadRuns(dir)).toHaveLength(1);
  });

  it('is empty when the folder does not exist', () => {
    dir = join(tmpdir(), 'lhci-missing-folder');
    expect(loadRuns(dir)).toEqual([]);
  });
});
