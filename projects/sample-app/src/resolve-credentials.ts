/** The key the /credentials page writes `{ appId, region, authKey }` to. */
export const CREDENTIALS_STORAGE_KEY = 'cometchat-credentials';

export interface SampleAppCredentials {
  appId: string;
  region: string;
  authKey: string;
}

/**
 * The credentials the sample app starts with (S1): each of `appId`, `region` and
 * `authKey` comes from the values the /credentials page saved when that field is
 * a non-empty string, else from `fallback` (environment.ts). Bad JSON or a
 * storage that throws falls back entirely. `fallback` is never changed.
 */
export function resolveCredentials(
  fallback: SampleAppCredentials,
  storage?: Pick<Storage, 'getItem'>,
): SampleAppCredentials {
  let saved: Record<string, unknown> = {};
  try {
    const parsed: unknown = JSON.parse((storage ?? globalThis.localStorage)?.getItem(CREDENTIALS_STORAGE_KEY) ?? 'null');
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) saved = parsed as Record<string, unknown>;
  } catch {
    // Storage unavailable or bad JSON: environment.ts decides.
  }
  const pick = (field: keyof SampleAppCredentials): string => {
    const value = saved[field];
    return typeof value === 'string' && value !== '' ? value : fallback[field];
  };
  return { appId: pick('appId'), region: pick('region'), authKey: pick('authKey') };
}
