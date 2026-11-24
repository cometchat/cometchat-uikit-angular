/**
 * A request double whose `fetchNext(listener)` / `fetchPrevious(listener)` run the SDK's
 * two-phase protocol from a script: one entry per call, each with the cached page (optional) and
 * the server page, or an error. Used with `installOfflineSdk()` by the list specs.
 *
 * @module testing/two-phase-request-fake
 */
import { vi, type Mock } from 'vitest';

export interface TwoPhaseCall<T = unknown> {
  /** Page handed to `onCached<Type>`; omitted = no cache phase. */
  cached?: T[];
  /** Page handed to `onServer<Type>`. */
  server?: T[];
  /** Fires `onError` after the cache phase instead of a server page. */
  error?: unknown;
}

/** `suffix` is the SDK callback suffix of the list, e.g. `Reactions`, `Messages`. */
export function twoPhaseRequest<T = unknown>(suffix: string, calls: TwoPhaseCall<T>[]) {
  const queue = [...calls];
  const run = (listener?: any): Promise<T[]> => {
    const call = queue.shift() ?? { server: [] };
    if (!listener)
      return call.error ? Promise.reject(call.error) : Promise.resolve(call.server ?? []);
    if (call.cached) listener[`onCached${suffix}`]?.(call.cached);
    if (call.error) {
      listener.onError?.(call.error);
      return Promise.reject(call.error);
    }
    listener[`onServer${suffix}`]?.(call.server ?? []);
    return Promise.resolve(call.server ?? []);
  };
  const request = {
    fetchNext: vi.fn(run),
    fetchPrevious: vi.fn(run),
    /** Calls still scripted. */
    pending: () => queue.length,
  };
  return request;
}

/** The SDK's not-connected terminal. */
export const NOT_CONNECTED = { code: 'FAILED_TO_FETCH', message: 'not connected' };

/**
 * Stub `CometChat.<builderName>` so every builder it makes is fluent and its
 * `build()` is the returned mock (set its return value with `mockReturnValue`).
 * The suite's setup replaces the SDK builders with prototype-less fluent
 * proxies, so a spy on `Builder.prototype.build` cannot work. Restored by
 * `vi.restoreAllMocks()`.
 */
export function stubBuild(sdk: any, builderName: string): Mock {
  const build = vi.fn();
  vi.spyOn(sdk, builderName).mockImplementation(function StubBuilder() {
    const proxy: any = new Proxy(
      {},
      {
        get(target: any, prop) {
          if (prop === 'build') return build;
          if (typeof prop !== 'string') return undefined;
          if (!target[prop]) target[prop] = vi.fn(() => proxy);
          return target[prop];
        },
      }
    );
    return proxy;
  } as any);
  return build;
}
