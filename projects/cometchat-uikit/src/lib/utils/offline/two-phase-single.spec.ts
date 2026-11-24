/**
 * Two-phase `getConversation` for a chat opened by id (BEH-READ-32, README
 * §3.9 message header row): the device copy when there is one, the server copy
 * when the server answers, and a settled answer (never a hang) otherwise.
 */
vi.mock('@cometchat/calls-sdk-javascript', () => ({ default: {} }));

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { fetchNextTwoPhase, getConversationTwoPhase, getMessageDetailsTwoPhase } from './two-phase';

describe('getConversationTwoPhase', () => {
  const sdk = CometChat as any;
  const saved: Record<string, PropertyDescriptor | undefined> = {};
  let script: (listener: any) => void;
  let calls: unknown[][];

  beforeEach(() => {
    calls = [];
    for (const name of ['getConversation', 'ConversationDetailsListener'])
      saved[name] = Object.getOwnPropertyDescriptor(sdk, name);
    class Holder {
      constructor(h: Record<string, unknown>) {
        Object.assign(this, h);
      }
    }
    Object.defineProperty(sdk, 'ConversationDetailsListener', {
      value: Holder,
      configurable: true,
      writable: true,
    });
    Object.defineProperty(sdk, 'getConversation', {
      configurable: true,
      writable: true,
      value: (...args: unknown[]) => {
        calls.push(args);
        script(args[2]);
        return Promise.reject({ code: 'FAILED_TO_FETCH' });
      },
    });
  });
  afterEach(() => {
    for (const [name, d] of Object.entries(saved)) {
      if (d) Object.defineProperty(sdk, name, d);
      else delete sdk[name];
    }
  });

  it('online: paints the cached copy, settles with the server copy', async () => {
    const cachedSeen: unknown[] = [];
    script = l => {
      l.onCachedConversation({ v: 'cache' });
      l.onServerConversation({ v: 'server' });
    };
    const answer = await getConversationTwoPhase('sam', 'user', c => cachedSeen.push(c));
    expect(cachedSeen).toEqual([{ v: 'cache' }]);
    expect(answer).toEqual({ value: { v: 'server' }, from: 'server' });
    expect(calls[0].slice(0, 2)).toEqual(['sam', 'user']);
    expect(typeof (calls[0][2] as any).onServerConversation).toBe('function');
  });

  it('offline on a hit: settles with the device copy', async () => {
    script = l => {
      l.onCachedConversation({ v: 'cache' });
      l.onError({ code: 'ERROR_INTERNET_UNAVAILABLE' });
    };
    const answer = await getConversationTwoPhase('sam', 'user');
    expect(answer.value).toEqual({ v: 'cache' });
    expect(answer.from).toBe('cache');
  });

  it("offline on a miss: settles with nothing (the caller keeps today's error path)", async () => {
    script = l => l.onError({ code: 'ERROR_INTERNET_UNAVAILABLE' });
    const answer = await getConversationTwoPhase('nobody', 'user');
    expect(answer.value).toBeNull();
    expect(answer.from).toBe('none');
  });

  it('settles when the SDK resolves its Promise without calling the listener', async () => {
    Object.defineProperty(sdk, 'getConversation', {
      configurable: true,
      writable: true,
      value: () => Promise.resolve({ v: 'server' }),
    });
    const answer = await getConversationTwoPhase('sam', 'user');
    expect(answer).toEqual({ value: { v: 'server' }, from: 'server' });
  });

  it('settles even when the SDK only rejects its Promise', async () => {
    script = () => undefined;
    const answer = await getConversationTwoPhase('sam', 'user');
    expect(answer.from).toBe('none');
  });

  it('an SDK without the listener form uses the Promise form', async () => {
    delete sdk.ConversationDetailsListener;
    Object.defineProperty(sdk, 'getConversation', {
      configurable: true,
      writable: true,
      value: (...args: unknown[]) => {
        calls.push(args);
        return Promise.resolve({ v: 'server' });
      },
    });
    const answer = await getConversationTwoPhase('sam', 'user');
    expect(answer).toEqual({ value: { v: 'server' }, from: 'server' });
    expect(calls[0]).toEqual(['sam', 'user']);
  });
});

describe('fetchNextTwoPhase never hangs (P6)', () => {
  it('a resolved SDK Promise with no server callback is taken as the server page', async () => {
    const seen: unknown[][] = [];
    const request = { fetchNext: () => Promise.resolve([{ id: 1 }]) };
    await fetchNextTwoPhase<any>(request, 'users', {
      onCached: () => undefined,
      onServer: page => seen.push(page),
      onError: () => undefined,
    });
    expect(seen).toEqual([[{ id: 1 }]]);
  });

  it('the listener answer wins; the Promise backstop never applies the page twice', async () => {
    const seen: unknown[][] = [];
    const request = {
      fetchNext: (listener: any) => {
        listener.onServerUsers([{ id: 2 }]);
        return Promise.resolve([{ id: 2 }]);
      },
    };
    await fetchNextTwoPhase<any>(request, 'users', {
      onCached: () => undefined,
      onServer: page => seen.push(page),
      onError: () => undefined,
    });
    await new Promise(r => setTimeout(r, 5));
    expect(seen).toEqual([[{ id: 2 }]]);
  });
});

describe('getMessageDetailsTwoPhase (BEH-READ-35)', () => {
  const sdk = CometChat as any;
  const saved: Record<string, PropertyDescriptor | undefined> = {};
  beforeEach(() => {
    for (const n of ['getMessageDetails', 'MessageDetailsListener'])
      saved[n] = Object.getOwnPropertyDescriptor(sdk, n);
  });
  afterEach(() => {
    for (const [n, d] of Object.entries(saved)) {
      if (d) Object.defineProperty(sdk, n, d);
      else delete sdk[n];
    }
  });

  it('cached then server; offline on a hit settles with the device copy', async () => {
    class Holder {
      constructor(h: Record<string, unknown>) {
        Object.assign(this, h);
      }
    }
    Object.defineProperty(sdk, 'MessageDetailsListener', {
      value: Holder,
      configurable: true,
      writable: true,
    });
    let script: (l: any) => void = l => {
      l.onCachedMessage({ v: 'c' });
      l.onServerMessage({ v: 's' });
    };
    Object.defineProperty(sdk, 'getMessageDetails', {
      configurable: true,
      writable: true,
      value: (_id: unknown, l: any) => {
        script(l);
        return new Promise(() => undefined);
      },
    });
    const seen: unknown[] = [];
    expect(await getMessageDetailsTwoPhase(7, m => seen.push(m))).toEqual({
      value: { v: 's' },
      from: 'server',
    });
    expect(seen).toEqual([{ v: 'c' }]);
    script = l => {
      l.onCachedMessage({ v: 'c' });
      l.onError({ code: 'ERROR_INTERNET_UNAVAILABLE' });
    };
    expect((await getMessageDetailsTwoPhase(7)).from).toBe('cache');
    script = l => l.onError({ code: 'ERROR_INTERNET_UNAVAILABLE' });
    expect((await getMessageDetailsTwoPhase(7)).from).toBe('none');
  });
});
