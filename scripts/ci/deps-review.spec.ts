// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { blockers, lockChanges, libraryDependencyChanges, licenceAllowed } from './deps-review.mjs';

const ALLOWED = ['MIT', 'ISC', 'Apache-2.0', 'MPL-2.0', 'BSD-3-Clause'];
const lock = (packages: Record<string, object>) => ({ lockfileVersion: 3, packages: { '': { name: 'root' }, ...packages } });

describe('deps-review', () => {
  describe('lockChanges', () => {
    it('lists added and upgraded packages, and ignores unchanged ones', () => {
      const base = lock({
        'node_modules/kept': { version: '1.0.0', license: 'MIT' },
        'node_modules/upgraded': { version: '1.0.0', license: 'MIT' },
      });
      const head = lock({
        'node_modules/kept': { version: '1.0.0', license: 'MIT' },
        'node_modules/upgraded': { version: '1.1.0', license: 'MIT' },
        'node_modules/added': { version: '2.0.0', license: 'ISC', dev: true },
      });
      expect(lockChanges(base, head)).toEqual([
        { name: 'added', from: null, to: '2.0.0', licence: 'ISC', dev: true },
        { name: 'upgraded', from: '1.0.0', to: '1.1.0', licence: 'MIT', dev: false },
      ]);
    });

    it('names nested and scoped packages by their own name, once per version', () => {
      const head = lock({
        'node_modules/a/node_modules/@scope/b': { version: '1.0.0', license: 'MIT' },
        'node_modules/c/node_modules/@scope/b': { version: '1.0.0', license: 'MIT' },
      });
      expect(lockChanges(lock({}), head).map((c) => `${c.name}@${c.to}`)).toEqual(['@scope/b@1.0.0']);
    });

    it('treats every package as new when the base has no lockfile', () => {
      expect(lockChanges(null, lock({ 'node_modules/x': { version: '1.0.0' } }))).toHaveLength(1);
    });

    it('skips workspace links', () => {
      expect(lockChanges(lock({}), lock({ 'node_modules/ws': { link: true, resolved: 'projects/ws' } }))).toEqual([]);
    });
  });

  describe('licenceAllowed', () => {
    it.each([
      ['MIT', true],
      ['(MPL-2.0 OR Apache-2.0)', true],
      ['GPL-3.0 OR MIT', true],
      ['MIT AND BSD-3-Clause', true],
      ['MIT AND GPL-3.0', false],
      ['GPL-3.0', false],
      ['SEE LICENSE IN LICENSE.md', false],
      ['', false],
    ])('%s → %s', (expression, ok) => {
      expect(licenceAllowed(expression, ALLOWED)).toBe(ok);
    });
  });

  describe('libraryDependencyChanges', () => {
    it('reports added and changed dependencies and peer ranges, not unchanged ones', () => {
      const base = { dependencies: { dompurify: '^3.0.0', tslib: '^2.0.0' }, peerDependencies: { '@angular/core': '>=17' } };
      const head = { dependencies: { dompurify: '^3.4.17', tslib: '^2.0.0', leftpad: '^1.0.0' }, peerDependencies: { '@angular/core': '>=17' } };
      expect(libraryDependencyChanges(base, head)).toEqual([
        { field: 'dependencies', name: 'dompurify', from: '^3.0.0', to: '^3.4.17' },
        { field: 'dependencies', name: 'leftpad', from: null, to: '^1.0.0' },
      ]);
    });
  });

  describe('blockers', () => {
    const change = (name: string, licence: string, dev = false) => ({ name, from: null, to: '1.0.0', licence, dev });

    it('fails a production package with a licence outside the allowlist', () => {
      expect(blockers([change('gpl-lib', 'GPL-3.0')], ALLOWED, {})).toEqual([
        'gpl-lib@1.0.0: licence "GPL-3.0" is not on the allowlist',
      ]);
    });

    it('fails a production package with a high or critical advisory, not a moderate one', () => {
      const advisories = {
        bad: { severity: 'critical', titles: ['XSS'] },
        meh: { severity: 'moderate', titles: ['ReDoS'] },
      };
      expect(blockers([change('bad', 'MIT'), change('meh', 'MIT')], ALLOWED, advisories)).toEqual([
        'bad@1.0.0: critical vulnerability (XSS)',
      ]);
    });

    it('does not judge dev packages or CometChat packages', () => {
      const advisories = { 'dev-tool': { severity: 'critical', titles: ['x'] } };
      expect(
        blockers([change('dev-tool', 'GPL-3.0', true), change('@cometchat/cards', 'https://www.cometchat.com/legal')], ALLOWED, advisories)
      ).toEqual([]);
    });

    it('passes clean production changes', () => {
      expect(blockers([change('ok', 'MIT')], ALLOWED, {})).toEqual([]);
    });
  });
});
