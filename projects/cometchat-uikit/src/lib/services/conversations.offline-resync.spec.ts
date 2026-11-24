vi.mock('@cometchat/calls-sdk-javascript', () => ({ default: {} }));

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { installOfflineSdk, OfflineSdkFake } from '../testing/offline-sdk-fake';
import { OfflineHub } from '../utils/offline/offline-hub';
import { ConversationsService } from './conversations.service';
import { isPlainConversationsRequest } from './conversations.offline';
import { twoPhaseRequest, TwoPhaseCall } from '../testing/two-phase-request-fake';

/** A duck-typed 1:1 chat, newest first by `at`. */
function conv(id: string, at: number, opts: { unsent?: boolean } = {}): any {
  const peer = Object.assign(Object.create(CometChat.User.prototype), { getUid: () => id });
  const last = opts.unsent
    ? { getId: () => 0, getSentAt: () => at, getStatus: () => 'PENDING' }
    : { getId: () => at, getSentAt: () => at };
  return {
    getConversationType: () => 'user',
    getConversationWith: () => peer,
    getConversationId: () => `user_${id}`,
    getLastMessage: () => last,
    setLastMessage: () => undefined,
    getUpdatedAt: () => at,
    isPinned: () => false,
    getUnreadMessageCount: () => 0,
    tag: `${id}@${at}`,
  };
}

interface RequestShape {
  type?: string;
  tags?: string[];
  userTags?: string[];
  groupTags?: string[];
  search?: string;
  unread?: boolean;
  pinnedBy?: string[];
  hideAgentic?: boolean;
  onlyAgentic?: boolean;
}

/** A request double: the two-phase script plus the getters the real request has. */
function request(shape: RequestShape, calls: TwoPhaseCall[]): any {
  return Object.assign(twoPhaseRequest('Conversations', calls), {
    getConversationType: () => shape.type ?? '',
    getTags: () => shape.tags ?? [],
    getUserTags: () => shape.userTags ?? [],
    getGroupTags: () => shape.groupTags ?? [],
    getSearchKeyword: () => shape.search ?? '',
    getUnread: () => !!shape.unread,
    getPinnedBy: () => shape.pinnedBy ?? [],
    getHideAgentic: () => !!shape.hideAgentic,
    getOnlyAgentic: () => !!shape.onlyAgentic,
  });
}

/** A builder that hands out these requests in order (one per `build()`). */
function builderOf(...requests: any[]): any {
  const build = vi.fn();
  requests.forEach(r => build.mockReturnValueOnce(r));
  return { build };
}

describe('which request counts as a plain conversation list', () => {
  const plain = (shape: RequestShape) => isPlainConversationsRequest(request(shape, []));

  it('no request, a limit only, both types: plain', () => {
    expect(isPlainConversationsRequest(undefined)).toBe(true);
    expect(plain({})).toBe(true);
    expect(plain({ type: 'both' })).toBe(true);
    expect(plain({ type: 'BOTH' })).toBe(true);
  });

  it.each<[string, RequestShape]>([
    ['a user-only type', { type: 'user' }],
    ['a group-only type', { type: 'group' }],
    ['tags', { tags: ['vip'] }],
    ['user tags', { userTags: ['a'] }],
    ['group tags', { groupTags: ['a'] }],
    ['a search keyword', { search: 'sam' }],
    ['unread only', { unread: true }],
    ['pinned by', { pinnedBy: ['me'] }],
    ['hide agentic', { hideAgentic: true }],
    ['only agentic', { onlyAgentic: true }],
  ])('%s: not plain', (_name, shape) => {
    expect(plain(shape)).toBe(false);
  });
});

describe('conversation list: a sync page never cuts the list back to page one (offline on)', () => {
  let fake: OfflineSdkFake;
  let service: ConversationsService;
  const ids = () =>
    (service as any).allConversationsSignal().map((c: any) => c.getConversationWith().getUid());
  const syncPage = (page: any[]) => {
    const hub = OfflineHub.getInstance();
    hub.conversationSync$.next({ gen: hub.gen, conversations: page });
  };
  const page1 = () => [conv('a', 100), conv('b', 90), conv('c', 80)];
  const page2 = () => [conv('d', 70), conv('e', 60)];

  beforeEach(() => {
    OfflineHub.resetForTests();
    fake = installOfflineSdk();
    TestBed.configureTestingModule({});
    service = TestBed.inject(ConversationsService);
  });
  afterEach(() => {
    fake.restore();
    OfflineHub.resetForTests();
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  /** Load page one, then page two, through the builder. */
  async function loadTwoPages(builder: any) {
    await service.fetchConversations(builder);
    expect(ids()).toEqual(['a', 'b', 'c']);
    expect(await service.fetchNextConversations()).toBe(true);
    expect(ids()).toEqual(['a', 'b', 'c', 'd', 'e']);
  }

  /**
   * AC-7.4 / Aanshi's D3 on #674: the SDK's conversation phase completes before
   * the message phase whose completion flushes the remembered read receipts, so
   * the sync page carries the server's pre-read count. The badge must not come
   * back on a chat the user has read on this device.
   */
  it('a chat read while offline keeps its badge off when the sync page carries the old count', async () => {
    /** The same chat as `conv`, but with a settable unread count. */
    const unreadConv = (id: string, at: number, count: number) => {
      let value = count;
      return Object.assign(conv(id, at), {
        getUnreadMessageCount: () => value,
        setUnreadMessageCount: (next: number) => {
          value = next;
        },
      });
    };
    const countOf = (id: string) =>
      (service as any)
        .allConversationsSignal()
        .find((c: any) => c.getConversationWith().getUid() === id)
        ?.getUnreadMessageCount();

    await service.fetchConversations(builderOf(request({}, [{ server: page1() }])));
    // The user opens `a` while offline: the receipt cannot go out, so the kit
    // remembers it (markConversationAsReadImpl's offline branch).
    OfflineHub.getInstance().rememberReadWhileOffline('a', 'user');

    // Reconnect. The server has not seen the receipt yet and still counts 3.
    syncPage([unreadConv('a', 110, 3), conv('b', 90), conv('c', 80)]);

    expect(countOf('a')).toBe(0);
  });

  it('a chat nobody read on this device still shows the count the sync page brings', async () => {
    const unreadConv = (id: string, at: number, count: number) => {
      let value = count;
      return Object.assign(conv(id, at), {
        getUnreadMessageCount: () => value,
        setUnreadMessageCount: (next: number) => {
          value = next;
        },
      });
    };
    await service.fetchConversations(builderOf(request({}, [{ server: page1() }])));

    syncPage([unreadConv('a', 110, 3), conv('b', 90), conv('c', 80)]);

    expect(
      (service as any)
        .allConversationsSignal()
        .find((c: any) => c.getConversationWith().getUid() === 'a')
        .getUnreadMessageCount()
    ).toBe(3);
  });

  it('a plain builder (a limit only) reconciles the sync page as a slice: page-two rows stay, no re-read', async () => {
    const first = request({}, [{ server: page1() }, { server: page2() }]);
    const builder = builderOf(first);
    await loadTwoPages(builder);

    // The sync page covers page one: a changed, one new, and b is gone from the server.
    syncPage([conv('a', 110), conv('n', 95), conv('c', 80)]);

    expect(builder.build).toHaveBeenCalledTimes(1);
    expect(ids()).toEqual(['a', 'n', 'c', 'd', 'e']);
  });

  it('a plain builder never drops an own unsent preview inside the page range', async () => {
    const first = request({}, [{ server: page1() }, { server: page2() }]);
    await loadTwoPages(builderOf(first));
    const all = (service as any).allConversationsSignal();
    const unsent = conv('u', 85, { unsent: true });
    all.splice(2, 0, unsent);
    (service as any).allConversationsSignal.set([...all]);

    syncPage([conv('a', 100), conv('c', 80)]);

    expect(ids()).toEqual(['a', 'u', 'c', 'd', 'e']);
  });

  it('a filtered list re-runs its own request once and keeps the rows below page one; stale cached rows go', async () => {
    const first = request({ tags: ['vip'] }, [{ server: page1() }, { server: page2() }]);
    // The resync: its cached page still lists `x` (since removed); the server page does not.
    const again = request({ tags: ['vip'] }, [
      {
        cached: [conv('a', 100), conv('x', 95)],
        server: [conv('a', 110), conv('b', 90), conv('c', 80)],
      },
    ]);
    const builder = builderOf(first, again);
    await loadTwoPages(builder);

    syncPage([conv('foreign', 999)]);

    await vi.waitFor(() => expect(again.fetchNext).toHaveBeenCalledTimes(1));
    await vi.waitFor(() => expect(ids()).toEqual(['a', 'b', 'c', 'd', 'e']));
    // No row of the unfiltered sync page was merged in.
    expect(ids()).not.toContain('foreign');
    expect((service as any).allConversationsSignal()[0].tag).toBe('a@110');
    expect(service.hasMore()).toBe(true);
  });

  it('a filtered list: a page-one row its own cached phase showed and the server dropped goes; rows below stay', async () => {
    const first = request({ search: 'z' }, [{ server: page1() }, { server: page2() }]);
    const again = request({ search: 'z' }, [
      { cached: page1(), server: [conv('a', 100), conv('c', 80)] },
    ]);
    await loadTwoPages(builderOf(first, again));

    syncPage([]);

    await vi.waitFor(() => expect(ids()).toEqual(['a', 'c', 'd', 'e']));
  });

  it('a filtered list: an empty server answer never clears the rows shown', async () => {
    const first = request({ unread: true }, [{ server: page1() }, { server: page2() }]);
    const again = request({ unread: true }, [{ cached: page1(), server: [] }]);
    await loadTwoPages(builderOf(first, again));

    syncPage([]);

    await vi.waitFor(() => expect(again.fetchNext).toHaveBeenCalledTimes(1));
    await vi.waitFor(() => expect(service.isLoading()).toBe(false));
    expect(ids()).toEqual(['a', 'b', 'c', 'd', 'e']);
  });

  it('while a resync is in flight, further sync pages start no second one', async () => {
    const first = request({ tags: ['vip'] }, [{ server: page1() }]);
    let finish: () => void = () => undefined;
    const slow: any = {
      ...request({ tags: ['vip'] }, []),
      fetchNext: vi.fn(
        (listener: any) =>
          new Promise(resolve => {
            finish = () => {
              listener.onServerConversations(page1());
              resolve(page1());
            };
          })
      ),
    };
    const builder = builderOf(first, slow);
    await service.fetchConversations(builder);

    syncPage([conv('foreign', 1)]);
    syncPage([conv('foreign', 2)]);
    syncPage([conv('foreign', 3)]);
    expect(builder.build).toHaveBeenCalledTimes(2);
    expect(slow.fetchNext).toHaveBeenCalledTimes(1);

    finish();
    await new Promise(resolve => setTimeout(resolve));
    // Settled: the next sync page re-runs again.
    const next = request({ tags: ['vip'] }, [{ server: page1() }]);
    builder.build.mockReturnValueOnce(next);
    syncPage([conv('foreign', 4)]);
    await vi.waitFor(() => expect(next.fetchNext).toHaveBeenCalledTimes(1));
  });

  it('the resync is kit-started: its failure stays quiet', async () => {
    const first = request({ tags: ['vip'] }, [{ server: page1() }]);
    const again = request({ tags: ['vip'] }, [{ error: { code: 'ERR_SERVER', message: 'boom' } }]);
    const errors: unknown[] = [];
    service.keptRowsError$.subscribe(e => errors.push(e));
    await service.fetchConversations(builderOf(first, again));

    syncPage([conv('foreign', 1)]);

    await vi.waitFor(() => expect(again.fetchNext).toHaveBeenCalledTimes(1));
    expect(errors).toHaveLength(0);
    expect(service.hasError()).toBe(false);
    expect(ids()).toEqual(['a', 'b', 'c']);
  });

  it('a user-started refresh still replaces the list with page one', async () => {
    const first = request({ tags: ['vip'] }, [{ server: page1() }, { server: page2() }]);
    const refresh = request({ tags: ['vip'] }, [{ server: [conv('a', 120)] }]);
    await loadTwoPages(builderOf(first));

    await service.fetchConversations(builderOf(refresh));

    expect(ids()).toEqual(['a']);
  });
});
