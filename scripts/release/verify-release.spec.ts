// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  GITHUB_ACTIONS_APP_ID,
  compareVersions,
  decideRelease,
  latestConclusion,
  outputLines,
  rehearsalVersion,
  releasePullRequest,
  versionProblems,
} from './verify-release.mjs';

const run = (conclusion: string | null, started_at: string, status = 'completed', appId = GITHUB_ACTIONS_APP_ID) => ({
  status,
  conclusion,
  started_at,
  app: { id: appId },
});
const OTHER_APP = 1234567;

describe('latestConclusion', () => {
  it('is missing when the check never ran', () => {
    expect(latestConclusion([])).toBe('missing');
  });

  it('uses the most recent run, so a failed re-run outweighs an earlier pass', () => {
    expect(latestConclusion([run('success', '2026-11-03T10:00:00Z'), run('failure', '2026-11-03T11:00:00Z')])).toBe('failure');
  });

  it('accepts a re-run that passed after a failure', () => {
    expect(latestConclusion([run('success', '2026-11-03T11:00:00Z'), run('failure', '2026-11-03T10:00:00Z')])).toBe('success');
  });

  it('reports a latest run that has not finished', () => {
    expect(latestConclusion([run('success', '2026-11-03T10:00:00Z'), run(null, '2026-11-03T11:00:00Z', 'in_progress')])).toBe('in_progress');
  });

  it('ignores a green check of the same name posted by another app', () => {
    expect(latestConclusion([run('success', '2026-11-03T10:00:00Z', 'completed', OTHER_APP)])).toBe('missing');
  });

  it("doesn't let another app's later pass hide a failed gate", () => {
    expect(
      latestConclusion([run('failure', '2026-11-03T10:00:00Z'), run('success', '2026-11-03T11:00:00Z', 'completed', OTHER_APP)])
    ).toBe('failure');
  });

  it('treats a run without app details as not from GitHub Actions', () => {
    expect(latestConclusion([{ status: 'completed', conclusion: 'success', started_at: '2026-11-03T10:00:00Z' }])).toBe('missing');
  });
});

describe('decideRelease', () => {
  it('releases a version that is neither on npm nor tagged publicly', () => {
    expect(decideRelease({ onNpm: false, publicTag: false, version: '5.3.0' })).toEqual({ release: true });
  });

  it('skips quietly when the version is already on npm (a merge that did not bump it)', () => {
    const d = decideRelease({ onNpm: true, publicTag: true, version: '5.2.2' });
    expect(d.release).toBe(false);
    expect(d.fail).toBeUndefined();
    expect(d.note).toContain('nothing to release');
  });

  it('fails when the public repo is tagged but npm never got the version', () => {
    const d = decideRelease({ onNpm: false, publicTag: true, version: '5.3.0' });
    expect(d.release).toBe(false);
    expect(d.fail).toContain('Re-run the failed "Release to npm" run');
  });

  it('releases a version higher than npm latest, including a pre-release of the next one', () => {
    expect(decideRelease({ onNpm: false, publicTag: false, version: '5.2.3', latest: '5.2.2' })).toEqual({ release: true });
    expect(decideRelease({ onNpm: false, publicTag: false, version: '5.2.3-rc.1', latest: '5.2.2' })).toEqual({ release: true });
  });

  it("refuses a version lower than npm latest, which would move customers back (a stale branch's 5.2.1)", () => {
    const d = decideRelease({ onNpm: false, publicTag: false, version: '5.2.1', latest: '5.2.3' });
    expect(d.release).toBe(false);
    expect(d.fail).toContain('5.2.1 is not higher than 5.2.3');
  });

  it('refuses a pre-release of a version that is already latest', () => {
    expect(decideRelease({ onNpm: false, publicTag: false, version: '5.2.3-rc.1', latest: '5.2.3' }).fail).toContain('not higher');
  });

  it('releases the first version of a package npm has never seen', () => {
    expect(decideRelease({ onNpm: false, publicTag: false, version: '5.0.0', latest: null })).toEqual({ release: true });
  });
});

describe('compareVersions', () => {
  it('orders by major, minor, then patch, as numbers', () => {
    expect(compareVersions('5.10.0', '5.9.9')).toBeGreaterThan(0);
    expect(compareVersions('5.2.10', '5.2.9')).toBeGreaterThan(0);
    expect(compareVersions('4.99.99', '5.0.0')).toBeLessThan(0);
    expect(compareVersions('5.2.3', 'v5.2.3')).toBe(0);
  });

  it('puts a pre-release below its version, and orders pre-releases as semver does', () => {
    const ordered = ['5.3.0-alpha', '5.3.0-alpha.1', '5.3.0-alpha.beta', '5.3.0-beta', '5.3.0-beta.2', '5.3.0-beta.11', '5.3.0-rc.1', '5.3.0'];
    for (let i = 1; i < ordered.length; i++) expect(compareVersions(ordered[i - 1], ordered[i])).toBeLessThan(0);
  });

  it('ignores build metadata', () => {
    expect(compareVersions('5.3.0+build.7', '5.3.0')).toBe(0);
  });

  it('throws on something that is not a version, so the check cannot be skipped by accident', () => {
    expect(() => compareVersions('5.3', '5.2.0')).toThrow('not a semver version');
    expect(() => compareVersions('5.3.0', 'latest')).toThrow('not a semver version');
  });
});

describe('releasePullRequest', () => {
  // Built at runtime: a 40-hex literal looks like a CometChat key to the secret scan.
  const SHA = 'ab12'.repeat(10);
  const pull = (number: number, over: Partial<{ merged_at: string | null; merge_commit_sha: string; base: { ref: string } }> = {}) => ({
    number,
    merged_at: '2026-11-05T10:00:00Z',
    merge_commit_sha: SHA,
    base: { ref: 'master-v5' },
    ...over,
  });

  it('finds the PR whose merge into master-v5 made the commit', () => {
    expect(releasePullRequest([pull(700)], SHA)?.number).toBe(700);
  });

  it('skips PRs that only contain the commit, were not merged, or went into another branch', () => {
    const pulls = [
      pull(1, { merge_commit_sha: 'f'.repeat(40) }),
      pull(2, { merged_at: null }),
      pull(3, { base: { ref: 'dev-v5' } }),
      pull(4),
    ];
    expect(releasePullRequest(pulls, SHA)?.number).toBe(4);
  });

  it('is null for a commit pushed straight to master-v5', () => {
    expect(releasePullRequest([], SHA)).toBeNull();
    expect(releasePullRequest([pull(5, { base: { ref: 'dev-v5' } })], SHA)).toBeNull();
  });
});

describe('versionProblems', () => {
  it('accepts three matching versions', () => {
    expect(versionProblems('5.3.0', '5.3.0', ['5.3.0'])).toEqual([]);
  });

  it('rejects a runtime version that differs or is missing', () => {
    expect(versionProblems('5.3.0', '5.3.0', ['5.2.3'])).toHaveLength(1);
    expect(versionProblems('5.3.0', '5.3.0', [])).toHaveLength(1);
  });

  it('rejects a library version that differs', () => {
    expect(versionProblems('5.3.0', '5.2.3', ['5.3.0'])[0]).toContain('library 5.2.3');
  });
});

describe('outputLines', () => {
  it('writes single-line values as key=value and the notes in the heredoc form', () => {
    expect(outputLines({ release: 'true', tag: 'v5.3.0', notes: '## New\n- A' }, () => 'EOF_x')).toBe(
      'release=true\ntag=v5.3.0\nnotes<<EOF_x\n## New\n- A\nEOF_x\n'
    );
  });

  it('uses a fresh delimiter, so notes can never end the value early', () => {
    const out = outputLines({ notes: 'a\nEOF\nb' });
    const end = out.split('\n')[0].replace('notes<<', '');
    expect(end).toMatch(/^EOF_[0-9a-f-]{36}$/);
    expect(out).toBe(`notes<<${end}\na\nEOF\nb\n${end}\n`);
  });
});

describe('rehearsalVersion', () => {
  it('is a pre-release of the version, unique per run, as iOS', () => {
    expect(rehearsalVersion('5.3.0', '42')).toBe('5.3.0-citest.42');
    expect(rehearsalVersion('5.3.0-beta.1', '7')).toBe('5.3.0-beta.1-citest.7');
  });
});
