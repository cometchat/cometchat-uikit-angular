// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { base64Size, classifyChanges, ensureTag, mirror, parseRawDiff, planBatches, tagTarget } from './mirror-commit.mjs';

const A = 'a'.repeat(40);
const raw = (...lines: [string, string, string, string][]) =>
  lines.map(([oldMode, newMode, status, path]) => `:${oldMode} ${newMode} ${'0'.repeat(40)} ${'1'.repeat(40)} ${status}\0${path}\0`).join('');
/** A change of mode only: the same blob on both sides. */
const modeOnly = (oldMode: string, newMode: string, path: string) => `:${oldMode} ${newMode} ${'2'.repeat(40)} ${'2'.repeat(40)} M\0${path}\0`;

describe('parseRawDiff and classifyChanges', () => {
  it('splits a change set into additions and deletions, keeping odd paths whole', () => {
    const entries = parseRawDiff(
      raw(['000000', '100644', 'A', 'src/new file.ts'], ['100644', '100644', 'M', 'README.md'], ['100644', '000000', 'D', 'old.ts'])
    );
    expect(entries.map((e) => e.path)).toEqual(['src/new file.ts', 'README.md', 'old.ts']);
    const c = classifyChanges(entries);
    expect(c.additions).toEqual(['src/new file.ts', 'README.md']);
    expect(c.deletions).toEqual(['old.ts']);
    expect(c.unsupported).toEqual([]);
    expect(c.modeWarnings).toEqual([]);
  });

  it('warns that a new executable arrives as a regular file, and that a mode change is not carried', () => {
    const c = classifyChanges(parseRawDiff(raw(['000000', '100755', 'A', 'scripts/run.sh'], ['100755', '100644', 'M', 'scripts/old.sh'])));
    expect(c.additions).toEqual(['scripts/run.sh', 'scripts/old.sh']);
    expect(c.modeWarnings).toEqual([
      'scripts/run.sh: new and executable, arrives as a regular file',
      'scripts/old.sh: stays 100755 in the public repo (the release has 100644)',
    ]);
  });

  it('reads both blob names', () => {
    expect(parseRawDiff(modeOnly('100644', '100755', 'x.sh'))).toEqual([
      { status: 'M', oldMode: '100644', newMode: '100755', oldBlob: '2'.repeat(40), newBlob: '2'.repeat(40), path: 'x.sh' },
    ]);
  });

  it('leaves out a file whose only difference is its mode, with the warning (a re-run must find nothing to commit)', () => {
    // The real case: a script that is executable here arrived as a regular file in the public repo.
    const c = classifyChanges(parseRawDiff(modeOnly('100644', '100755', 'scripts/ci/package-digest.sh') + raw(['100644', '100644', 'M', 'README.md'])));
    expect(c.additions).toEqual(['README.md']);
    expect(c.deletions).toEqual([]);
    expect(c.modeWarnings).toEqual(['scripts/ci/package-digest.sh: stays 100644 in the public repo (the release has 100755)']);
  });

  it('still commits a file whose contents and mode both changed', () => {
    const c = classifyChanges(parseRawDiff(raw(['100644', '100755', 'M', 'scripts/x.sh'])));
    expect(c.additions).toEqual(['scripts/x.sh']);
    expect(c.modeWarnings).toEqual(['scripts/x.sh: stays 100644 in the public repo (the release has 100755)']);
  });

  it('does not warn when an existing executable is modified and stays executable', () => {
    expect(classifyChanges(parseRawDiff(raw(['100755', '100755', 'M', 'scripts/x.sh']))).modeWarnings).toEqual([]);
  });

  it('marks symlinks and submodules as unsupported (they need the plain push)', () => {
    const c = classifyChanges(parseRawDiff(raw(['000000', '120000', 'A', 'link'], ['000000', '160000', 'A', 'vendor/sub'], ['120000', '100644', 'T', 'was-link'])));
    expect(c.unsupported).toEqual(['link (symlink)', 'vendor/sub (submodule)', 'was-link (symlink)']);
    expect(c.additions).toEqual([]);
  });

  it('deleting a symlink is fine', () => {
    expect(classifyChanges(parseRawDiff(raw(['120000', '000000', 'D', 'link']))).deletions).toEqual(['link']);
  });

  it('parses an empty diff', () => {
    expect(parseRawDiff('')).toEqual([]);
  });
});

describe('base64Size', () => {
  it('rounds up to whole 4-character groups', () => {
    expect([0, 1, 3, 4, 300].map(base64Size)).toEqual([0, 4, 4, 8, 400]);
  });
});

describe('planBatches', () => {
  const files = (n: number) => Array.from({ length: n }, (_, i) => `f${i}`);
  const sized = (paths: string[], size: number) => Object.fromEntries(paths.map((p) => [p, size]));

  it('keeps a small change set in one batch', () => {
    const p = files(5);
    expect(planBatches(p, sized(p, 10))).toEqual({ batches: [p] });
  });

  it('splits by file count: 504 files are 300 + 204, as Angular’s first automated release', () => {
    const p = files(504);
    const plan = planBatches(p, sized(p, 10)) as { batches: string[][] };
    expect(plan.batches.map((b) => b.length)).toEqual([300, 204]);
    expect(plan.batches.flat()).toEqual(p);
  });

  it('splits by bytes before the file count is reached', () => {
    const p = files(4);
    const plan = planBatches(p, sized(p, 40), { maxFiles: 300, maxBytes: 100 }) as { batches: string[][] };
    expect(plan.batches.map((b) => b.length)).toEqual([2, 2]);
  });

  it('is oversized when one file alone is over the byte cap', () => {
    const plan = planBatches(['small', 'huge'], { small: 1, huge: 200 }, { maxBytes: 100 });
    expect(plan).toHaveProperty('oversized');
    expect((plan as { oversized: string }).oversized).toContain('huge');
  });

  it('plans no batch for a change set with only deletions', () => {
    expect(planBatches([], {})).toEqual({ batches: [] });
  });
});

/** A fake GitHub: refs, the mutation and commit verification, recording every call. */
function fakeGitHub({ tags = {} as Record<string, { type: string; sha: string }>, branches = {} as Record<string, string>, failPatch = false, verified = true } = {}) {
  const calls: { path: string; method: string; body?: any }[] = [];
  let n = 0;
  const api = async (path: string, { method = 'GET', body, allow = [] as number[] }: { method?: string; body?: any; allow?: number[] } = {}) => {
    calls.push({ path, method, body });
    const notFound = () => {
      if (allow.includes(404)) return null;
      throw new Error(`404 ${path}`);
    };
    if (path === 'graphql') {
      const input = body.variables.input;
      const branch = input.branch.branchName;
      if (branches[branch] !== input.expectedHeadOid) throw new Error(`GraphQL: expectedHeadOid mismatch on ${branch}`);
      const oid = String(++n).repeat(40);
      branches[branch] = oid;
      return { data: { createCommitOnBranch: { commit: { oid } } } };
    }
    let m = path.match(/git\/ref\/tags\/(.+)$/);
    if (m && method === 'GET') return tags[m[1]] ? { object: tags[m[1]] } : notFound();
    m = path.match(/git\/tags\/(.+)$/);
    if (m) return { object: { type: 'commit', sha: 'c'.repeat(40) } };
    m = path.match(/git\/ref\/heads\/(.+)$/);
    if (m) return branches[m[1]] ? { object: { sha: branches[m[1]] } } : notFound();
    m = path.match(/git\/refs\/heads\/(.+)$/);
    if (m && method === 'DELETE') {
      delete branches[m[1]];
      return {};
    }
    if (m && method === 'PATCH') {
      if (failPatch) throw new Error('HTTP 422: Update is not a fast forward');
      branches[m[1]] = body.sha;
      return {};
    }
    if (path.endsWith('git/refs') && method === 'POST') {
      const [, kind, name] = body.ref.match(/^refs\/(heads|tags)\/(.+)$/);
      if (kind === 'heads') branches[name] = body.sha;
      else tags[name] = { type: 'commit', sha: body.sha };
      return {};
    }
    if (path.includes('/commits/')) return { commit: { verification: { verified } } };
    throw new Error(`unexpected ${method} ${path}`);
  };
  return { api, calls, branches, tags };
}

const base = (gh: ReturnType<typeof fakeGitHub>, over: Record<string, unknown> = {}) => ({
  api: gh.api,
  log: () => {},
  warn: () => {},
  readFile: (p: string) => Buffer.from(`contents of ${p}`),
  repo: 'cometchat/cometchat-uikit-angular',
  branch: 'v5',
  tag: 'v5.3.0',
  head: A,
  additions: ['a.ts', 'b.ts'],
  deletions: ['gone.ts'],
  batches: [['a.ts', 'b.ts']],
  ...over,
});

describe('mirror', () => {
  it('commits one batch straight onto the branch, then tags it and checks the signature', async () => {
    const gh = fakeGitHub({ branches: { v5: A } });
    const r = await mirror(base(gh));
    const mutation = gh.calls.find((c) => c.path === 'graphql')!.body.variables.input;
    expect(mutation.branch.branchName).toBe('v5');
    expect(mutation.expectedHeadOid).toBe(A);
    expect(mutation.message.headline).toBe('Release v5.3.0');
    expect(mutation.fileChanges.additions).toEqual([
      { path: 'a.ts', contents: Buffer.from('contents of a.ts').toString('base64') },
      { path: 'b.ts', contents: Buffer.from('contents of b.ts').toString('base64') },
    ]);
    expect(mutation.fileChanges.deletions).toEqual([{ path: 'gone.ts' }]);
    expect(r).toEqual({ committed: true, oversized: false, oid: '1'.repeat(40), verified: true, batches: 1 });
    expect(gh.branches.v5).toBe('1'.repeat(40));
    expect(gh.tags['v5.3.0'].sha).toBe('1'.repeat(40));
  });

  it('stacks several batches on a staging branch, fast-forwards the branch once and removes the staging branch', async () => {
    const gh = fakeGitHub({ branches: { v5: A, 'mirror-staging/v5.3.0': 'f'.repeat(40) } });
    const r = await mirror(base(gh, { additions: ['a', 'b', 'c'], batches: [['a', 'b'], ['c']] }));
    const commits = gh.calls.filter((c) => c.path === 'graphql').map((c) => c.body.variables.input);
    expect(commits.map((c) => c.branch.branchName)).toEqual(['mirror-staging/v5.3.0', 'mirror-staging/v5.3.0']);
    expect(commits.map((c) => c.message.headline)).toEqual(['Release v5.3.0 (1/2)', 'Release v5.3.0']);
    expect(commits[0].expectedHeadOid).toBe(A);
    expect(commits[1].expectedHeadOid).toBe('1'.repeat(40));
    expect(commits.map((c) => c.fileChanges.deletions.length)).toEqual([1, 0]);
    // The stale staging branch from an earlier run is dropped and recreated at the public head.
    expect(gh.calls.some((c) => c.method === 'POST' && c.body?.ref === 'refs/heads/mirror-staging/v5.3.0' && c.body.sha === A)).toBe(true);
    const patch = gh.calls.find((c) => c.method === 'PATCH')!;
    expect(patch.body).toEqual({ sha: '2'.repeat(40), force: false });
    expect(gh.branches.v5).toBe('2'.repeat(40));
    expect(gh.branches['mirror-staging/v5.3.0']).toBeUndefined();
    expect(r.batches).toBe(2);
    expect(gh.tags['v5.3.0'].sha).toBe('2'.repeat(40));
  });

  it('puts the message body (the package digest) on the commit the tag points at', async () => {
    const body = 'npm package contents digest: sha256:abc';
    const one = fakeGitHub({ branches: { v5: A } });
    await mirror(base(one, { messageBody: body }));
    expect(one.calls.find((c) => c.path === 'graphql')!.body.variables.input.message).toEqual({ headline: 'Release v5.3.0', body });

    const two = fakeGitHub({ branches: { v5: A } });
    await mirror(base(two, { messageBody: body, batches: [['a.ts'], ['b.ts']] }));
    const messages = two.calls.filter((c) => c.path === 'graphql').map((c) => c.body.variables.input.message);
    expect(messages).toEqual([{ headline: 'Release v5.3.0 (1/2)' }, { headline: 'Release v5.3.0', body }]);
  });

  it('leaves the branch untouched and does not tag when the fast-forward is refused', async () => {
    const gh = fakeGitHub({ branches: { v5: A }, failPatch: true });
    await expect(mirror(base(gh, { batches: [['a.ts'], ['b.ts']] }))).rejects.toThrow(/v5 is unchanged/);
    expect(gh.branches.v5).toBe(A);
    expect(gh.tags['v5.3.0']).toBeUndefined();
  });

  it('fails without committing when the branch moved after the clone', async () => {
    const gh = fakeGitHub({ branches: { v5: 'e'.repeat(40) } });
    await expect(mirror(base(gh))).rejects.toThrow(/expectedHeadOid/);
    expect(gh.tags['v5.3.0']).toBeUndefined();
  });

  it('tags the existing head when there is nothing to commit (a re-run after the commit landed)', async () => {
    const gh = fakeGitHub({ branches: { v5: A } });
    const r = await mirror(base(gh, { additions: [], deletions: [], batches: [] }));
    expect(gh.calls.some((c) => c.path === 'graphql')).toBe(false);
    expect(r).toMatchObject({ committed: false, oid: A, batches: 0 });
    expect(gh.tags['v5.3.0'].sha).toBe(A);
  });

  it('commits a change set that only deletes files', async () => {
    const gh = fakeGitHub({ branches: { v5: A } });
    await mirror(base(gh, { additions: [], batches: [] }));
    const input = gh.calls.find((c) => c.path === 'graphql')!.body.variables.input;
    expect(input.fileChanges).toEqual({ additions: [], deletions: [{ path: 'gone.ts' }] });
  });

  it('accepts a re-run whose tag is already on the head, without writing anything', async () => {
    const gh = fakeGitHub({ branches: { v5: A }, tags: { 'v5.3.0': { type: 'commit', sha: A } } });
    const r = await mirror(base(gh, { additions: [], deletions: [], batches: [] }));
    expect(r).toMatchObject({ committed: false, oid: A });
    expect(gh.calls.filter((c) => c.method !== 'GET')).toEqual([]);
  });

  it('stops before writing anything when the tag exists and there is still something to commit', async () => {
    const gh = fakeGitHub({ branches: { v5: A }, tags: { 'v5.3.0': { type: 'commit', sha: 'b'.repeat(40) } } });
    await expect(mirror(base(gh))).rejects.toThrow(/already exists .* at bbbbbbbbb, and v5 at aaaaaaaaa doesn't hold this release\. Nothing was written/);
    expect(gh.calls.filter((c) => c.method !== 'GET')).toEqual([]);
    expect(gh.branches.v5).toBe(A);
  });

  it('stops before writing anything when the tag exists on a commit other than the head', async () => {
    const gh = fakeGitHub({ branches: { v5: A }, tags: { 'v5.3.0': { type: 'commit', sha: 'b'.repeat(40) } } });
    await expect(mirror(base(gh, { additions: [], deletions: [], batches: [] }))).rejects.toThrow(/not v5's head aaaaaaaaa\. Nothing was written/);
    expect(gh.calls.filter((c) => c.method !== 'GET')).toEqual([]);
  });

  it('stops before creating the staging branch when a batched release meets an existing tag', async () => {
    const gh = fakeGitHub({ branches: { v5: A }, tags: { 'v5.3.0': { type: 'tag', sha: 'd'.repeat(40) } } });
    await expect(mirror(base(gh, { batches: [['a.ts'], ['b.ts']] }))).rejects.toThrow(/Nothing was written/);
    expect(gh.calls.filter((c) => c.method !== 'GET')).toEqual([]);
    expect(gh.branches['mirror-staging/v5.3.0']).toBeUndefined();
  });

  it('warns when GitHub did not verify the commit', async () => {
    const gh = fakeGitHub({ branches: { v5: A }, verified: false });
    const warnings: string[] = [];
    const r = await mirror(base(gh, { warn: (title: string) => warnings.push(title) }));
    expect(r.verified).toBe(false);
    expect(warnings).toEqual(['Unsigned release commit']);
  });
});

describe('tagTarget', () => {
  it('returns null for a missing tag, the commit for a lightweight one, and follows an annotated one', async () => {
    const gh = fakeGitHub({ tags: { light: { type: 'commit', sha: A }, annotated: { type: 'tag', sha: 'd'.repeat(40) } } });
    const t = (tag: string) => tagTarget({ api: gh.api, repo: 'o/r', tag });
    expect(await t('missing')).toBeNull();
    expect(await t('light')).toBe(A);
    expect(await t('annotated')).toBe('c'.repeat(40));
  });
});

describe('ensureTag', () => {
  const run = (gh: ReturnType<typeof fakeGitHub>, oid = A) => ensureTag({ api: gh.api, log: () => {}, repo: 'o/r', tag: 'v5.3.0', oid });

  it('creates a missing tag', async () => {
    const gh = fakeGitHub();
    await run(gh);
    expect(gh.tags['v5.3.0']).toEqual({ type: 'commit', sha: A });
  });

  it('accepts a tag that already points at the release commit', async () => {
    const gh = fakeGitHub({ tags: { 'v5.3.0': { type: 'commit', sha: A } } });
    await run(gh);
    expect(gh.calls.filter((c) => c.method !== 'GET')).toEqual([]);
  });

  it('never moves a tag that points elsewhere', async () => {
    const gh = fakeGitHub({ tags: { 'v5.3.0': { type: 'commit', sha: 'b'.repeat(40) } } });
    await expect(run(gh)).rejects.toThrow(/never moved/);
    expect(gh.calls.filter((c) => c.method !== 'GET')).toEqual([]);
  });

  it('follows an annotated tag to its commit', async () => {
    const gh = fakeGitHub({ tags: { 'v5.3.0': { type: 'tag', sha: 'd'.repeat(40) } } });
    await run(gh, 'c'.repeat(40));
    expect(gh.calls.filter((c) => c.method !== 'GET')).toEqual([]);
  });
});
