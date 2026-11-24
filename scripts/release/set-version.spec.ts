// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { RUNTIME_FILE, setLibraryVersion, setLockVersion, setPackageVersion, setRuntimeVersion } from './set-version.mjs';
import { versionProblems } from './verify-release.mjs';

const ROOT = join(import.meta.dirname, '../..');
const read = (file: string) => readFileSync(join(ROOT, file), 'utf8');
const V = JSON.parse(read('package.json')).version as string;
const CITEST = `${V}-citest.42`;

describe('set-version on the repo’s own files', () => {
  it('changes nothing when the version is already right, so real releases can run it', () => {
    expect(setPackageVersion(read('package.json'), V)).toBe(read('package.json'));
    expect(setLockVersion(read('package-lock.json'), V)).toBe(read('package-lock.json'));
    expect(setLibraryVersion(read('projects/cometchat-uikit/package.json'), V)).toBe(read('projects/cometchat-uikit/package.json'));
    expect(setRuntimeVersion(read(RUNTIME_FILE), V)).toBe(read(RUNTIME_FILE));
  });

  it('sets a rehearsal version everywhere verify-release looks', () => {
    const root = JSON.parse(setPackageVersion(read('package.json'), CITEST)).version;
    const lib = JSON.parse(setLibraryVersion(read('projects/cometchat-uikit/package.json'), CITEST)).version;
    const runtime = [...setRuntimeVersion(read(RUNTIME_FILE), CITEST).matchAll(/version:\s*'([^']+)'/g)].map((m) => m[1]);
    expect(runtime.length).toBeGreaterThan(0);
    expect(versionProblems(root, lib, runtime)).toEqual([]);
    expect(root).toBe(CITEST);
  });

  it('changes only the version lines', () => {
    const lines = (a: string, b: string) => {
      const after = b.split('\n');
      return a.split('\n').filter((l, i) => l !== after[i]);
    };
    expect(lines(read('package.json'), setPackageVersion(read('package.json'), CITEST))).toEqual([`  "version": "${V}",`]);
    expect(lines(read('package-lock.json'), setLockVersion(read('package-lock.json'), CITEST))).toHaveLength(2);
    expect(lines(read('projects/cometchat-uikit/package.json'), setLibraryVersion(read('projects/cometchat-uikit/package.json'), CITEST))).toHaveLength(1);
  });
});

describe('set-version edge cases', () => {
  it('rewrites only the top-level version of the library package.json', () => {
    const text = '{\n  "name": "x",\n  "version": "1.0.0",\n  "peerDependencies": { "y": "1.0.0" },\n  "z": { "version": "9" }\n}\n';
    expect(setLibraryVersion(text, '2.0.0')).toBe(text.replace('"version": "1.0.0"', '"version": "2.0.0"'));
  });

  it('refuses a runtime file without a version', () => {
    expect(() => setRuntimeVersion('export const x = 1;', '1.0.0')).toThrow(/no version/);
  });

  it('works when called repeatedly (no regex state carried between calls)', () => {
    const src = "a = { version: '1.0.0' }; b = { version: '1.0.0' };";
    expect(setRuntimeVersion(src, '2.0.0')).toBe("a = { version: '2.0.0' }; b = { version: '2.0.0' };");
    expect(setRuntimeVersion(src, '3.0.0')).toBe("a = { version: '3.0.0' }; b = { version: '3.0.0' };");
  });
});
