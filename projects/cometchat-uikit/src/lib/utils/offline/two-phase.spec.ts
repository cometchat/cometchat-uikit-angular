/** The generic two-phase read of the snapshot lists, and the merge of its server page. */
vi.mock('@cometchat/calls-sdk-javascript', () => ({ default: {} }));

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { installOfflineSdk, OfflineSdkFake } from '../../testing/offline-sdk-fake';
import { NOT_CONNECTED, twoPhaseRequest } from '../../testing/two-phase-request-fake';
import { fetchNextTwoPhase, mergeSnapshotPage, readPageTwoPhase } from './two-phase';

describe('two-phase page read', () => {
  let fake: OfflineSdkFake;
  beforeEach(() => {
    fake = installOfflineSdk();
  });
  afterEach(() => fake.restore());

  it('hands the cached page, then the server page, then ends once', async () => {
    const request = twoPhaseRequest('Users', [{ cached: ['a'], server: ['a', 'b'] }]);
    const onCached = vi.fn();
    const result = await readPageTwoPhase<string>(request, 'users', onCached);
    expect(onCached).toHaveBeenCalledWith(['a']);
    expect(result).toEqual({ server: ['a', 'b'], unreachable: undefined });
    expect(request.fetchNext).toHaveBeenCalledTimes(1);
  });

  it('a read past the cache while not connected resolves with no server page', async () => {
    const request = twoPhaseRequest('Groups', [{ cached: ['g'], error: NOT_CONNECTED }]);
    const result = await readPageTwoPhase<string>(request, 'groups', () => undefined);
    expect(result.server).toBeNull();
    expect(result.unreachable).toBe(NOT_CONNECTED);
  });

  it('any other error rejects', async () => {
    const boom = { code: 'ERR_BOOM' };
    const request = twoPhaseRequest('Groups', [{ error: boom }]);
    await expect(readPageTwoPhase<string>(request, 'groups', () => undefined)).rejects.toBe(boom);
  });

  it('previous direction reads with fetchPrevious', async () => {
    const request = twoPhaseRequest('Messages', [{ server: ['m'] }]);
    await readPageTwoPhase<string>(request, 'messages', () => undefined, 'previous');
    expect(request.fetchPrevious).toHaveBeenCalledTimes(1);
    expect(request.fetchNext).not.toHaveBeenCalled();
  });

  it('reports the not-connected flag to the error handler', async () => {
    const request = twoPhaseRequest('Users', [{ error: NOT_CONNECTED }]);
    const onError = vi.fn();
    await fetchNextTwoPhase<string>(request, 'users', { onCached: vi.fn(), onServer: vi.fn(), onError });
    expect(onError).toHaveBeenCalledWith(NOT_CONNECTED, true);
  });
});

describe('mergeSnapshotPage', () => {
  const key = (s: string) => s;

  it('replaces the cached slice in the server order and drops cached rows the server lost', () => {
    const merged = mergeSnapshotPage(['a', 'b', 'c'], new Set(['a', 'b', 'c']), ['c', 'x', 'a'], key);
    expect(merged).toEqual(['c', 'x', 'a']);
  });

  it('keeps rows of other pages where they are', () => {
    const merged = mergeSnapshotPage(['old', 'a', 'b', 'tail'], new Set(['a', 'b']), ['b', 'n'], key);
    expect(merged).toEqual(['old', 'b', 'n', 'tail']);
  });

  it('with no overlap the page is appended', () => {
    expect(mergeSnapshotPage(['a'], new Set(), ['b', 'c'], key)).toEqual(['a', 'b', 'c']);
  });

  it('never lists a key twice', () => {
    expect(mergeSnapshotPage(['a', 'b'], new Set(['a']), ['a', 'a', 'b'], key)).toEqual(['a', 'b']);
  });
});
