import { afterEach, describe, expect, it } from 'vitest';
import { CREDENTIALS_STORAGE_KEY, resolveCredentials } from './resolve-credentials';

/** S1: the sample app starts with the credentials the /credentials page saved, else environment.ts. */
describe('resolveCredentials', () => {
  const env = { appId: 'env-app', region: 'env-region', authKey: 'env-key' };
  const storing = (value: string | null) => ({ getItem: (key: string) => (key === 'cometchat-credentials' ? value : null) });
  const stored = (value: unknown) => storing(JSON.stringify(value));

  afterEach(() => localStorage.clear());

  it('reads the key the credentials page writes', () => {
    expect(CREDENTIALS_STORAGE_KEY).toBe('cometchat-credentials');
  });

  it('uses environment.ts when nothing is stored', () => {
    expect(resolveCredentials(env, storing(null))).toEqual(env);
  });

  it('uses the stored values', () => {
    const saved = { appId: 'stored-app', region: 'eu', authKey: 'stored-key' };
    expect(resolveCredentials(env, stored(saved))).toEqual(saved);
  });

  it('falls back field by field when a stored field is missing, empty or not a string', () => {
    expect(resolveCredentials(env, stored({ appId: 'stored-app' }))).toEqual({
      appId: 'stored-app',
      region: 'env-region',
      authKey: 'env-key',
    });
    expect(resolveCredentials(env, stored({ appId: '', region: 'in', authKey: 42 }))).toEqual({
      appId: 'env-app',
      region: 'in',
      authKey: 'env-key',
    });
  });

  it('uses environment.ts when the stored value is not a JSON object', () => {
    for (const raw of ['{not json', 'null', '42', '"stored-app"', '[]']) {
      expect(resolveCredentials(env, storing(raw))).toEqual(env);
    }
  });

  it('uses environment.ts when storage throws', () => {
    const throwing = {
      getItem: (): string | null => {
        throw new Error('SecurityError');
      },
    };
    expect(resolveCredentials(env, throwing)).toEqual(env);
  });

  it('reads localStorage by default', () => {
    localStorage.setItem('cometchat-credentials', JSON.stringify({ appId: 'stored-app' }));
    expect(resolveCredentials(env).appId).toBe('stored-app');
  });

  it('does not change the fallback object', () => {
    const fallback = { ...env };
    resolveCredentials(fallback, stored({ appId: 'stored-app', region: 'eu', authKey: 'stored-key' }));
    expect(fallback).toEqual(env);
  });
});
