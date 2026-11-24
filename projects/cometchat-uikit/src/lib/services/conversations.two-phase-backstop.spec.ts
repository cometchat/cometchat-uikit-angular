/**
 * The conversations two-phase read can never hang: when the SDK's fetchNext
 * Promise resolves and no onServerConversations callback came by the next
 * task, the resolved page is taken as the server page, as the shared
 * two-phase read (two-phase.ts) and the message list (message-list.offline.ts)
 * already do (P6). Hardening: the 4.3.x SDKs fire the callback with resolve.
 */
vi.mock('@cometchat/calls-sdk-javascript', () => ({ default: {} }));

import { describe, expect, it, vi } from 'vitest';
import { fetchConversationsTwoPhase } from './conversations.offline';

const tick = () => new Promise<void>(resolve => setTimeout(resolve, 5));

function handlers() {
  return { onCached: vi.fn(), onServer: vi.fn(), onError: vi.fn() };
}

describe('fetchConversationsTwoPhase: resolve-without-callback backstop', () => {
  it('a resolved Promise with no server callback ends the read with the resolved page', async () => {
    const page = [{ id: 'c1' }] as any[];
    const request = { fetchNext: () => Promise.resolve(page) } as any;
    const h = handlers();
    let ended = false;
    void fetchConversationsTwoPhase(request, h).then(() => (ended = true));
    await tick();
    expect(ended).toBe(true);
    expect(h.onServer).toHaveBeenCalledTimes(1);
    expect(h.onServer).toHaveBeenCalledWith(page);
    expect(h.onError).not.toHaveBeenCalled();
  });

  it('a non-array resolution ends the read with an empty page', async () => {
    const request = { fetchNext: () => Promise.resolve(undefined) } as any;
    const h = handlers();
    await Promise.race([fetchConversationsTwoPhase(request, h), tick()]);
    expect(h.onServer).toHaveBeenCalledWith([]);
  });

  it('the server callback that comes with the resolution is not doubled', async () => {
    const page = [{ id: 'c2' }] as any[];
    const request = {
      fetchNext: (listener: any) => {
        listener.onCachedConversations([{ id: 'cached' }]);
        listener.onServerConversations(page);
        return Promise.resolve(page);
      },
    } as any;
    const h = handlers();
    await fetchConversationsTwoPhase(request, h);
    await tick();
    expect(h.onCached).toHaveBeenCalledTimes(1);
    expect(h.onServer).toHaveBeenCalledTimes(1);
  });

  it('a rejection still ends the read through onError', async () => {
    const request = { fetchNext: () => Promise.reject({ code: 'FAILED_TO_FETCH' }) } as any;
    const h = handlers();
    await fetchConversationsTwoPhase(request, h);
    expect(h.onError).toHaveBeenCalledTimes(1);
    expect(h.onServer).not.toHaveBeenCalled();
  });
});
