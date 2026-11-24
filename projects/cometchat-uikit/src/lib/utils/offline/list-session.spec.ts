/** Session lifecycle of a list that ran the offline read path. */
vi.mock('@cometchat/calls-sdk-javascript', () => ({ default: {} }));

import { describe, expect, it, vi } from 'vitest';
import { DestroyRef } from '@angular/core';
import { Subject } from 'rxjs';
import { OfflineListSession, watchOfflineSession } from './list-session';

describe('OfflineListSession', () => {
  it('a list that never ran offline is untouched by the end of a session', () => {
    const session = new OfflineListSession();
    session.end();
    expect(session.ranOffline).toBe(false);
    expect(session.takeReload()).toBe(false);
  });

  it('end() makes earlier reads stale and asks for one reload', () => {
    const session = new OfflineListSession();
    session.markRan();
    const epoch = session.epoch;
    session.end();
    expect(session.isStale(epoch)).toBe(true);
    expect(session.ranOffline).toBe(false);
    expect(session.takeReload()).toBe(true);
    expect(session.takeReload()).toBe(false);
  });

  it('supersede() stales a read without a reload or touching ranOffline', () => {
    const session = new OfflineListSession();
    session.markRan();
    const epoch = session.epoch;
    session.supersede();
    expect(session.isStale(epoch)).toBe(true);
    expect(session.ranOffline).toBe(true);
    expect(session.takeReload()).toBe(false);
  });

  it('watchOfflineSession clears on a session end and reloads on the cache reset that follows', () => {
    const session$ = new Subject<number>();
    const cacheReset$ = new Subject<unknown>();
    const destroyHandlers: (() => void)[] = [];
    const destroyRef = { onDestroy: (fn: () => void) => destroyHandlers.push(fn) } as unknown as DestroyRef;
    const handlers = { clear: vi.fn(), reload: vi.fn() };
    const session = new OfflineListSession();
    watchOfflineSession({ session$, cacheReset$ } as any, destroyRef, session, handlers);

    session.markRan();
    session$.next(1);
    expect(handlers.clear).toHaveBeenCalledTimes(1);
    cacheReset$.next({});
    expect(handlers.reload).toHaveBeenCalledTimes(1);

    // Not ran offline: nothing to clear, nothing to reload.
    session$.next(2);
    cacheReset$.next({});
    expect(handlers.clear).toHaveBeenCalledTimes(1);
    expect(handlers.reload).toHaveBeenCalledTimes(1);

    destroyHandlers.forEach(fn => fn());
    session.markRan();
    session$.next(3);
    expect(handlers.clear).toHaveBeenCalledTimes(1);
  });
});
