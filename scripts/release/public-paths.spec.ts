// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { classify, covers, parseList, summarise } from './public-paths.mjs';

describe('parseList', () => {
  it('drops blank lines and comments, and trims', () => {
    expect(parseList('# heading\n\nprojects/\n  README.md  \n# note\n')).toEqual(['projects/', 'README.md']);
  });
});

describe('covers', () => {
  it('matches a file exactly, not by prefix', () => {
    expect(covers('README.md', 'README.md')).toBe(true);
    expect(covers('README.md', 'docs/README.md')).toBe(false);
    expect(covers('api', 'api/x.md')).toBe(false);
  });

  it('matches everything under a folder entry', () => {
    expect(covers('scripts/', 'scripts/ci/ci-gate.mjs')).toBe(true);
    expect(covers('scripts/', 'scripts-old/x.js')).toBe(false);
  });

  it('matches **/<name> at any depth', () => {
    expect(covers('**/.DS_Store', '.DS_Store')).toBe(true);
    expect(covers('**/.DS_Store', 'projects/cometchat-uikit/.DS_Store')).toBe(true);
    expect(covers('**/.DS_Store', 'projects/not.DS_Store')).toBe(false);
  });
});

describe('classify', () => {
  const allow = ['projects/', 'scripts/', 'README.md'];
  const internal = ['scripts/release/', '**/.DS_Store', '.github/'];

  it('lets an internal entry win over the allowlist', () => {
    const r = classify(['scripts/verify.mjs', 'scripts/release/stage-public.sh', 'projects/.DS_Store'], allow, internal);
    expect(r.publicPaths).toEqual(['scripts/verify.mjs']);
    expect(r.internalPaths).toEqual(['scripts/release/stage-public.sh', 'projects/.DS_Store']);
  });

  it('reports what neither list decides', () => {
    const r = classify(['README.md', 'renovate.json', 'tools/a.ts', '.github/workflows/ci.yml'], allow, internal);
    expect(r.unclassified).toEqual(['renovate.json', 'tools/a.ts']);
  });
});

describe('summarise', () => {
  it('groups unclassified paths by their top-level file or folder', () => {
    expect(summarise(['tools/a.ts', 'tools/b/c.ts', 'renovate.json', 'api/x.md'])).toEqual(['tools/ (2 files)', 'renovate.json', 'api/ (1 file)']);
  });
});

describe('the lists', () => {
  const list = (name: string) => parseList(readFileSync(join(import.meta.dirname, name), 'utf8'));

  it('keep the paths that must never go public internal, however the allowlist grows', () => {
    const r = classify(
      ['.github/workflows/release.yml', '.kiro/notes.md', 'aidlc-docs/plan.md', 'scripts/release/allowlist.txt', 'scripts/public-repo/workflows/ci.yml', 'docs/.DS_Store'],
      [...list('allowlist.txt'), '.github/', '.kiro/', 'aidlc-docs/'],
      list('internal.txt')
    );
    expect(r.publicPaths).toEqual([]);
  });

  it('let the files the public workflows and npm ci need go public', () => {
    const needed = ['.nvmrc', 'package.json', 'package-lock.json', 'scripts/install-hooks-auto.mjs', 'scripts/ci/package-digest.sh', 'scripts/ci/sbom-and-licenses.sh', 'scripts/ci/consumer-app.sh'];
    expect(classify(needed, list('allowlist.txt'), list('internal.txt')).publicPaths).toEqual(needed);
  });
});
