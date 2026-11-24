/**
 * The edges of the two-phase reads in `two-phase.ts`: pages that are not arrays, callbacks that arrive
 * after the read ended, an SDK without the listener class, a request that throws, the Promise backstop
 * in each of its forms, and the single-read helpers (a chat by id, a message by id) with every answer
 * the cache and the server can give.
 */
vi.mock('@cometchat/calls-sdk-javascript', () => ({ default: {} }));

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { installOfflineSdk, OfflineSdkFake } from '../../testing/offline-sdk-fake';
import { NOT_CONNECTED } from '../../testing/two-phase-request-fake';
import { fetchNextTwoPhase, getConversationTwoPhase, getMessageDetailsTwoPhase } from './two-phase';

const sdk = CometChat as any;
const later = () => new Promise(resolve => setTimeout(resolve, 5));

function handlers() {
  return { onCached: vi.fn(), onServer: vi.fn(), onError: vi.fn() };
}

describe('fetchNextTwoPhase: edges', () => {
  let fake: OfflineSdkFake;
  beforeEach(() => {
    fake = installOfflineSdk();
  });
  afterEach(() => fake.restore());

  it('a page that is not an array is an empty page, for the cache and for the server', async () => {
    const h = handlers();
    await fetchNextTwoPhase<string>(
      {
        fetchNext: (listener: any) => {
          listener.onCachedUsers('not a page');
          listener.onServerUsers(undefined);
          return Promise.resolve([]);
        },
      },
      'users',
      h
    );
    expect(h.onCached).toHaveBeenCalledWith([]);
    expect(h.onServer).toHaveBeenCalledWith([]);
  });

  it('a callback after the read ended is ignored: the cache, a second server page and an error', async () => {
    const h = handlers();
    await fetchNextTwoPhase<string>(
      {
        fetchNext: (listener: any) => {
          listener.onServerUsers(['a']);
          listener.onCachedUsers(['late']);
          listener.onServerUsers(['b']);
          listener.onError({ code: 'ERR_LATE' });
          return Promise.resolve(['a']);
        },
      },
      'users',
      h
    );
    await later();
    expect(h.onCached).not.toHaveBeenCalled();
    expect(h.onServer).toHaveBeenCalledTimes(1);
    expect(h.onServer).toHaveBeenCalledWith(['a']);
    expect(h.onError).not.toHaveBeenCalled();
  });

  it('an SDK without the listener class gets the callbacks themselves', async () => {
    fake.restore();
    fake = installOfflineSdk({ omit: ['UserFetchListener'] });
    const h = handlers();
    let received: any;
    await fetchNextTwoPhase<string>(
      {
        fetchNext: (listener: any) => {
          received = listener;
          listener.onServerUsers(['a']);
          return Promise.resolve(['a']);
        },
      },
      'users',
      h
    );
    expect(typeof received.onServerUsers).toBe('function');
    expect(h.onServer).toHaveBeenCalledWith(['a']);
  });

  it('a request that throws ends the read with that error, and says whether it was not-connected', async () => {
    const real = handlers();
    await fetchNextTwoPhase<string>(
      {
        fetchNext: () => {
          throw { code: 'ERR_SYNC' };
        },
      },
      'users',
      real
    );
    expect(real.onError).toHaveBeenCalledWith({ code: 'ERR_SYNC' }, false);
    const offline = handlers();
    await fetchNextTwoPhase<string>(
      {
        fetchNext: () => {
          throw NOT_CONNECTED;
        },
      },
      'users',
      offline
    );
    expect(offline.onError).toHaveBeenCalledWith(NOT_CONNECTED, true);
  });

  it('a Promise that resolves with a page and no callback is the server page; a non-array is an empty page', async () => {
    const withPage = handlers();
    await fetchNextTwoPhase<string>({ fetchNext: () => Promise.resolve(['x', 'y']) }, 'users', withPage);
    expect(withPage.onServer).toHaveBeenCalledWith(['x', 'y']);
    const withoutPage = handlers();
    await fetchNextTwoPhase<string>({ fetchNext: () => Promise.resolve(undefined) }, 'users', withoutPage);
    expect(withoutPage.onServer).toHaveBeenCalledWith([]);
  });

  it('a Promise that rejects with no callback ends the read with that error', async () => {
    const h = handlers();
    await fetchNextTwoPhase<string>(
      { fetchNext: () => Promise.reject(NOT_CONNECTED) },
      'groups',
      h
    );
    expect(h.onError).toHaveBeenCalledWith(NOT_CONNECTED, true);
  });

  it('a request whose fetchNext returns no Promise still ends on the listener', async () => {
    const h = handlers();
    await fetchNextTwoPhase<string>(
      {
        fetchNext: ((listener: any) => {
          listener.onServerUsers(['z']);
        }) as any,
      },
      'users',
      h
    );
    expect(h.onServer).toHaveBeenCalledWith(['z']);
  });
});

describe('getConversationTwoPhase: every answer', () => {
  let fake: OfflineSdkFake;
  beforeEach(() => {
    fake = installOfflineSdk();
  });
  afterEach(() => fake.restore());

  const script = (fn: (listener: any) => void, result: () => unknown = () => Promise.reject(NOT_CONNECTED)) => {
    sdk.getConversation = (_with: string, _type: string, listener?: any) => {
      if (listener) fn(listener);
      return result();
    };
  };

  it('a server copy that is empty settles with the device copy, or with nothing when there is none', async () => {
    script(l => {
      l.onCachedConversation({ v: 'cache' });
      l.onServerConversation(null);
    });
    expect(await getConversationTwoPhase('a', 'user')).toEqual({ value: { v: 'cache' }, from: 'cache' });
    script(l => l.onServerConversation(undefined));
    expect(await getConversationTwoPhase('a', 'user')).toEqual({ value: null, from: 'none' });
  });

  it('an empty cached answer is not a hit, and a painting callback that throws does not end the read', async () => {
    const onCached = vi.fn(() => {
      throw new Error('paint failed');
    });
    script(l => {
      l.onCachedConversation(null);
      l.onCachedConversation({ v: 'cache' });
      l.onServerConversation({ v: 'server' });
    });
    expect(await getConversationTwoPhase('a', 'user', onCached)).toEqual({ value: { v: 'server' }, from: 'server' });
    expect(onCached).toHaveBeenCalledTimes(1);
  });

  it('an error settles with the device copy when there is one, and with the error when there is not', async () => {
    script(l => {
      l.onCachedConversation({ v: 'cache' });
      l.onError(NOT_CONNECTED);
    });
    expect(await getConversationTwoPhase('a', 'user')).toEqual({
      value: { v: 'cache' },
      from: 'cache',
      error: NOT_CONNECTED,
    });
    script(l => l.onError(NOT_CONNECTED));
    expect(await getConversationTwoPhase('a', 'user')).toEqual({ value: null, from: 'none', error: NOT_CONNECTED });
  });

  it('a late callback after the read ended is ignored', async () => {
    script(l => {
      l.onServerConversation({ v: 'first' });
      l.onCachedConversation({ v: 'late' });
      l.onServerConversation({ v: 'second' });
    });
    expect(await getConversationTwoPhase('a', 'user')).toEqual({ value: { v: 'first' }, from: 'server' });
  });

  it('the SDK Promise answers when the listener does not: a server copy, a cached one, or nothing', async () => {
    script(() => undefined, () => Promise.resolve({ v: 'promise' }));
    expect(await getConversationTwoPhase('a', 'user')).toEqual({ value: { v: 'promise' }, from: 'server' });
    script(l => l.onCachedConversation({ v: 'cache' }), () => Promise.resolve(null));
    expect(await getConversationTwoPhase('a', 'user')).toEqual({ value: { v: 'cache' }, from: 'cache' });
    script(() => undefined, () => Promise.resolve(null));
    expect(await getConversationTwoPhase('a', 'user')).toEqual({ value: null, from: 'none' });
  });

  it('a call with no Promise and no answer is left to the listener', async () => {
    script(l => l.onServerConversation({ v: 'only listener' }), () => undefined);
    expect(await getConversationTwoPhase('a', 'user')).toEqual({ value: { v: 'only listener' }, from: 'server' });
  });

  it('a call that throws settles with the error', async () => {
    script(() => undefined, () => {
      throw { code: 'ERR_SYNC' };
    });
    expect(await getConversationTwoPhase('a', 'user')).toEqual({
      value: null,
      from: 'none',
      error: { code: 'ERR_SYNC' },
    });
  });

  it('without the listener class the Promise form is used: a copy, no copy, or a failure', async () => {
    fake.restore();
    fake = installOfflineSdk({ omit: ['ConversationDetailsListener'] });
    sdk.getConversation = () => Promise.resolve({ v: 'plain' });
    expect(await getConversationTwoPhase('a', 'user')).toEqual({ value: { v: 'plain' }, from: 'server' });
    sdk.getConversation = () => Promise.resolve(undefined);
    expect(await getConversationTwoPhase('a', 'user')).toEqual({ value: null, from: 'none' });
    sdk.getConversation = () => Promise.reject(NOT_CONNECTED);
    expect(await getConversationTwoPhase('a', 'user')).toEqual({ value: null, from: 'none', error: NOT_CONNECTED });
  });
});

describe('getMessageDetailsTwoPhase: every answer', () => {
  let fake: OfflineSdkFake;
  beforeEach(() => {
    fake = installOfflineSdk();
  });
  afterEach(() => fake.restore());

  const script = (fn: (listener: any) => void, result: () => unknown = () => Promise.reject(NOT_CONNECTED)) => {
    sdk.getMessageDetails = (_id: unknown, listener?: any) => {
      if (listener) fn(listener);
      return result();
    };
  };

  it('a server message settles it; an empty server answer falls back to the device copy or to nothing', async () => {
    script(l => {
      l.onCachedMessage({ id: 'cache' });
      l.onServerMessage({ id: 'server' });
    });
    expect(await getMessageDetailsTwoPhase(1)).toEqual({ value: { id: 'server' }, from: 'server' });
    script(l => {
      l.onCachedMessage({ id: 'cache' });
      l.onServerMessage(null);
    });
    expect(await getMessageDetailsTwoPhase(1)).toEqual({ value: { id: 'cache' }, from: 'cache' });
    script(l => l.onServerMessage(undefined));
    expect(await getMessageDetailsTwoPhase(1)).toEqual({ value: null, from: 'none' });
  });

  it('an empty cached answer is not a hit, and a painting callback that throws does not end the read', async () => {
    const onCached = vi.fn(() => {
      throw new Error('paint failed');
    });
    script(l => {
      l.onCachedMessage(undefined);
      l.onCachedMessage({ id: 'cache' });
      l.onServerMessage({ id: 'server' });
    });
    expect(await getMessageDetailsTwoPhase(1, onCached)).toEqual({ value: { id: 'server' }, from: 'server' });
    expect(onCached).toHaveBeenCalledTimes(1);
  });

  it('an error settles with the device copy when there is one, and with the error when there is not', async () => {
    script(l => {
      l.onCachedMessage({ id: 'cache' });
      l.onError(NOT_CONNECTED);
    });
    expect(await getMessageDetailsTwoPhase(1)).toEqual({
      value: { id: 'cache' },
      from: 'cache',
      error: NOT_CONNECTED,
    });
    script(l => l.onError(NOT_CONNECTED));
    expect(await getMessageDetailsTwoPhase(1)).toEqual({ value: null, from: 'none', error: NOT_CONNECTED });
  });

  it('a late callback after the read ended is ignored', async () => {
    script(l => {
      l.onServerMessage({ id: 'first' });
      l.onCachedMessage({ id: 'late' });
      l.onServerMessage({ id: 'second' });
    });
    expect(await getMessageDetailsTwoPhase(1)).toEqual({ value: { id: 'first' }, from: 'server' });
  });

  it('the SDK Promise answers when the listener does not', async () => {
    script(() => undefined, () => Promise.resolve({ id: 'promise' }));
    expect(await getMessageDetailsTwoPhase(1)).toEqual({ value: { id: 'promise' }, from: 'server' });
  });

  it('a call with no Promise is left to the listener', async () => {
    script(l => l.onServerMessage({ id: 'listener' }), () => undefined);
    expect(await getMessageDetailsTwoPhase(1)).toEqual({ value: { id: 'listener' }, from: 'server' });
  });

  it('a call that throws settles with the error', async () => {
    script(() => undefined, () => {
      throw { code: 'ERR_SYNC' };
    });
    expect(await getMessageDetailsTwoPhase(1)).toEqual({ value: null, from: 'none', error: { code: 'ERR_SYNC' } });
  });

  it('without the listener class the Promise form is used: a message, no message, or a failure', async () => {
    fake.restore();
    fake = installOfflineSdk({ omit: ['MessageDetailsListener'] });
    sdk.getMessageDetails = () => Promise.resolve({ id: 'plain' });
    expect(await getMessageDetailsTwoPhase(1)).toEqual({ value: { id: 'plain' }, from: 'server' });
    sdk.getMessageDetails = () => Promise.resolve(null);
    expect(await getMessageDetailsTwoPhase(1)).toEqual({ value: null, from: 'none' });
    sdk.getMessageDetails = () => Promise.reject(NOT_CONNECTED);
    expect(await getMessageDetailsTwoPhase(1)).toEqual({ value: null, from: 'none', error: NOT_CONNECTED });
  });
});
