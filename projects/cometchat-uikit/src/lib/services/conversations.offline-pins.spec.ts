vi.mock('@cometchat/calls-sdk-javascript', () => ({ default: {} }));

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { installOfflineSdk, OfflineSdkFake } from '../testing/offline-sdk-fake';
import { OfflineHub } from '../utils/offline/offline-hub';
import { CometChatUIKit } from '../cometchat-uikit';
import { ConversationsService } from './conversations.service';
import { ConnectionStateService } from './connection-state.service';
import { setConnection } from '../testing/connection-driver';
import { NOT_CONNECTED, twoPhaseRequest } from '../testing/two-phase-request-fake';

/** A duck-typed conversation: what the pin path reads. */
function conv(
  type: 'user' | 'group',
  id: string,
  opts: { pinned?: boolean; last?: unknown } = {}
): any {
  let last = opts.last;
  // A real User: getConversationEntityId tells a 1:1 chat from a group with instanceof.
  const peer =
    type === 'user'
      ? Object.assign(Object.create(CometChat.User.prototype), { getUid: () => id })
      : { getGuid: () => id };
  return {
    getConversationType: () => type,
    getConversationWith: () => peer,
    getConversationId: () => `${type}_${id}`,
    getLastMessage: () => last,
    setLastMessage: (m: unknown) => {
      last = m;
    },
    // Pin state lives on the object, as on the SDK model, so a copy of the row carries its own.
    pinnedAt: opts.pinned ? 1 : undefined,
    getPinnedAt(this: any) {
      return this.pinnedAt;
    },
    setPinnedAt(this: any, at?: number | null) {
      this.pinnedAt = at ?? undefined;
    },
    getPinnedBy: () => undefined,
    setPinnedBy: () => undefined,
    isPinned(this: any) {
      return this.pinnedAt !== undefined;
    },
    getUnreadMessageCount: () => 0,
  };
}

describe('conversation list: pin events on the offline path (UIK-CONV-01)', () => {
  let fake: OfflineSdkFake;
  let service: ConversationsService;
  let getConversation: ReturnType<typeof vi.fn>;
  const rows = () => (service as any).allConversationsSignal() as any[];
  const set = (list: any[]) => {
    (service as any).allConversationsSignal.set(list);
    (service as any).conversationsSignal.set(list);
  };

  beforeEach(() => {
    OfflineHub.resetForTests();
    fake = installOfflineSdk();
    getConversation = vi.fn();
    Object.defineProperty(CometChat, 'getConversation', {
      value: getConversation,
      configurable: true,
      writable: true,
    });
    vi.spyOn(CometChatUIKit, 'getLoggedInUser').mockReturnValue({ getUid: () => 'Alex' } as any);
    TestBed.configureTestingModule({});
    service = TestBed.inject(ConversationsService);
  });
  afterEach(() => {
    fake.restore();
    OfflineHub.resetForTests();
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  it('matches the row by (type, with), case-insensitive, and keeps its last message', async () => {
    const last = { id: 7 };
    set([conv('user', 'bea'), conv('user', 'Sam', { last })]);
    await service.applyPinEvent(conv('user', 'SAM', { pinned: true }));
    expect(rows()[1].isPinned()).toBe(true);
    expect(rows()[1].getLastMessage()).toBe(last);
    expect(getConversation).not.toHaveBeenCalled();
  });

  it('a user and a group with the same id are different chats', async () => {
    set([conv('user', 'team')]);
    getConversation.mockResolvedValue(conv('group', 'team', { pinned: true, last: { id: 1 } }));
    await service.applyPinEvent(conv('group', 'team', { pinned: true }));
    expect(rows().map(r => r.getConversationType())).toEqual(['group', 'user']);
    expect(rows()[1].isPinned()).toBe(false);
  });

  it('ignores a 1:1 event whose peer is the user', async () => {
    set([conv('user', 'bea')]);
    await service.applyPinEvent(conv('user', 'alex', { pinned: true }));
    expect(rows()).toHaveLength(1);
    expect(getConversation).not.toHaveBeenCalled();
  });

  it('a pinned chat not on screen is fetched and inserted', async () => {
    set([conv('user', 'bea')]);
    getConversation.mockResolvedValue(conv('user', 'zed', { pinned: true, last: { id: 3 } }));
    await service.applyPinEvent(conv('user', 'zed', { pinned: true }));
    expect(getConversation).toHaveBeenCalledWith('zed', 'user');
    expect(rows().map(r => r.getConversationWith().getUid())).toEqual(['zed', 'bea']);
  });

  it('a failed fetch is ignored', async () => {
    set([conv('user', 'bea')]);
    getConversation.mockRejectedValue({ code: 'FAILED_TO_FETCH' });
    await service.applyPinEvent(conv('user', 'zed', { pinned: true }));
    expect(rows()).toHaveLength(1);
  });

  it('a filtered list only updates the rows it shows', async () => {
    set([conv('user', 'bea')]);
    (service as any).customRequestActive = true;
    await service.applyPinEvent(conv('user', 'zed', { pinned: true }));
    expect(getConversation).not.toHaveBeenCalled();
    expect(rows()).toHaveLength(1);
  });

  it('an unpin of a chat not shown changes nothing', async () => {
    set([conv('user', 'bea')]);
    await service.applyPinEvent(conv('user', 'zed', { pinned: false }));
    expect(getConversation).not.toHaveBeenCalled();
  });
});

describe('conversation list: sync on a filtered list (UIT-SYNC-08)', () => {
  let fake: OfflineSdkFake;
  let service: ConversationsService;
  const rows = () => (service as any).allConversationsSignal() as any[];

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

  it('re-runs its own request once instead of taking the unfiltered sync page', () => {
    const filtered = { build: vi.fn() } as any;
    (service as any).allConversationsSignal.set([conv('group', 'team')]);
    (service as any).customRequestActive = true;
    (service as any).activeBuilder = filtered;
    (service as any).initialFetchDone = true;
    const refetch = vi.spyOn(service, 'fetchConversations').mockResolvedValue(undefined);
    const hub = OfflineHub.getInstance();
    hub.conversationSync$.next({
      gen: hub.gen,
      conversations: [conv('user', 'foreign', { last: { id: 9 } })],
    });
    expect(refetch).toHaveBeenCalledTimes(1);
    expect(refetch).toHaveBeenCalledWith(filtered, true);
    // No foreign row was merged in from the unfiltered page.
    expect(
      rows().map(r => r.getConversationWith().getGuid?.() ?? r.getConversationWith().getUid())
    ).toEqual(['team']);
  });

  it('an unfiltered list reconciles the sync slice in place without a fetch', () => {
    (service as any).allConversationsSignal.set([conv('user', 'bea', { last: { id: 1 } })]);
    (service as any).initialFetchDone = true;
    const refetch = vi.spyOn(service, 'fetchConversations').mockResolvedValue(undefined);
    const hub = OfflineHub.getInstance();
    hub.conversationSync$.next({
      gen: hub.gen,
      conversations: [conv('user', 'bea', { last: { id: 2 } })],
    });
    expect(refetch).not.toHaveBeenCalled();
  });
});

describe('conversation list: paging after an offline read past the cache (R5)', () => {
  let fake: OfflineSdkFake;
  let service: ConversationsService;
  const listed = () => ((service as any).conversationsSignal() as any[]).length;
  const set = (list: any[]) => {
    (service as any).allConversationsSignal.set(list);
    (service as any).conversationsSignal.set(list);
  };
  const peers = (from: number, to: number) =>
    Array.from({ length: to - from + 1 }, (_, i) => conv('user', `p${from + i}`));

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

  it('a refused read closes paging; the connection coming back opens it and runs that load', async () => {
    set(peers(1, 3));
    (service as any).initialFetchDone = true;
    const request = twoPhaseRequest('Conversations', [
      { error: NOT_CONNECTED },
      { server: peers(4, 5) },
    ]);
    (service as any).conversationsRequest = request;
    expect(await service.fetchNextConversations()).toBe(false);
    expect(service.hasMore()).toBe(false);
    const connection = TestBed.inject(ConnectionStateService) as any;
    setConnection(connection, true);
    TestBed.tick();
    setConnection(connection, false);
    TestBed.tick();
    setConnection(connection, true);
    TestBed.tick();
    expect(service.hasMore()).toBe(true);
    await vi.waitFor(() => expect(listed()).toBe(5));
    expect(request.fetchNext).toHaveBeenCalledTimes(2);
  });

  it('the load that reopened by itself after a reconnect fails: rows stay and no error shows', async () => {
    set(peers(1, 3));
    (service as any).initialFetchDone = true;
    const request = twoPhaseRequest('Conversations', [
      { error: NOT_CONNECTED },
      { error: { code: 'ERR_SERVER', message: 'boom' } },
    ]);
    (service as any).conversationsRequest = request;
    await service.fetchNextConversations();
    const connection = TestBed.inject(ConnectionStateService) as any;
    for (const v of [true, false, true]) {
      setConnection(connection, v);
      TestBed.tick();
    }
    await vi.waitFor(() => expect(request.fetchNext).toHaveBeenCalledTimes(2));
    await vi.waitFor(() => expect(service.isLoading()).toBe(false));
    expect(service.hasError()).toBe(false);
    expect(listed()).toBe(3);
  });

  it('a load the user started that fails with rows shown still shows the error', async () => {
    set(peers(1, 3));
    const request = twoPhaseRequest('Conversations', [
      { error: { code: 'ERR_SERVER', message: 'boom' } },
    ]);
    (service as any).conversationsRequest = request;
    await service.fetchNextConversations();
    expect(service.hasError()).toBe(true);
    expect(listed()).toBe(3);
  });

  it('a reconnect with paging never closed offline makes no read', () => {
    set(peers(1, 3));
    (service as any).initialFetchDone = true;
    const request = twoPhaseRequest('Conversations', []);
    (service as any).conversationsRequest = request;
    const connection = TestBed.inject(ConnectionStateService) as any;
    for (const v of [true, false, true]) {
      setConnection(connection, v);
      TestBed.tick();
    }
    expect(request.fetchNext).not.toHaveBeenCalled();
  });

  it('a page of rows the reconnect sync already listed reads on until the list grows', async () => {
    set(peers(1, 6));
    const request = twoPhaseRequest('Conversations', [
      { server: peers(3, 4) },
      { server: peers(5, 6) },
      { server: peers(7, 8) },
    ]);
    (service as any).conversationsRequest = request;
    expect(await service.fetchNextConversations()).toBe(true);
    expect(request.fetchNext).toHaveBeenCalledTimes(3);
    expect(listed()).toBe(8);
  });

  it('an empty server page ends the read-on', async () => {
    set(peers(1, 2));
    const request = twoPhaseRequest('Conversations', [{ server: peers(1, 2) }, { server: [] }]);
    (service as any).conversationsRequest = request;
    expect(await service.fetchNextConversations()).toBe(false);
    expect(request.fetchNext).toHaveBeenCalledTimes(2);
  });
});

describe('conversation list: a send the SDK dropped is not previewed as failed', () => {
  let fake: OfflineSdkFake;
  let service: ConversationsService;
  let refresh: ReturnType<typeof vi.spyOn>;
  const rows = () => (service as any).allConversationsSignal() as any[];
  const pending = {
    getId: () => 0,
    getLocalMessageId: () => 'L1',
    getMuid: () => 'M1',
    getConversationId: () => 'user_sam',
    getStatus: () => 'PENDING',
  };
  const before = { getId: () => 41, getConversationId: () => 'user_sam' };

  beforeEach(() => {
    OfflineHub.resetForTests();
    fake = installOfflineSdk();
    TestBed.configureTestingModule({});
    service = TestBed.inject(ConversationsService);
    const list = [conv('user', 'cara'), conv('user', 'sam', { last: before })];
    (service as any).allConversationsSignal.set(list);
    (service as any).conversationsSignal.set(list);
    // The pending send moves its preview onto the row (what refreshSingleConversation does).
    refresh = vi.spyOn(service as any, 'refreshSingleConversation').mockImplementation((m: any) => {
      rows()
        .find(r => r.getConversationId() === m.getConversationId())
        ?.setLastMessage(m);
    });
    OfflineHub.getInstance().reportSendState(pending as any, 'sending');
    expect(rows()[1].getLastMessage().getLocalMessageId()).toBe('L1');
  });
  afterEach(() => {
    fake.restore();
    OfflineHub.resetForTests();
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  it('discarded: the preview goes back to the message before it, in place', () => {
    OfflineHub.getInstance().reportSendState(pending as any, 'discarded', { reason: 'DISCARDED' });
    expect(rows()[1].getConversationId()).toBe('user_sam');
    expect(rows()[1].getLastMessage()).toBe(before);
  });

  it('rejected as DISCARDED: the preview goes back too, and is not refreshed as failed', () => {
    refresh.mockClear();
    OfflineHub.getInstance().reportSendState(pending as any, 'failed', { reason: 'DISCARDED' });
    expect(refresh).not.toHaveBeenCalled();
    expect(rows()[1].getLastMessage()).toBe(before);
  });

  it('discarded: a chat the send itself had listed is removed again', () => {
    const hub = OfflineHub.getInstance();
    const fresh = {
      ...pending,
      getLocalMessageId: () => 'L2',
      getMuid: () => 'M2',
      getConversationId: () => 'user_dana',
    };
    refresh.mockImplementation((m: any) => {
      const row = conv('user', 'dana', { last: m });
      (service as any).allConversationsSignal.set([row, ...rows()]);
      (service as any).conversationsSignal.set([row, ...rows()]);
    });
    hub.reportSendState(fresh as any, 'sending');
    expect(rows().map(r => r.getConversationId())).toEqual(['user_dana', 'user_cara', 'user_sam']);
    hub.reportSendState(fresh as any, 'discarded', { reason: 'DISCARDED' });
    expect(rows().map(r => r.getConversationId())).toEqual(['user_cara', 'user_sam']);
  });

  it('an ordinary failure still shows on the preview', () => {
    refresh.mockClear();
    OfflineHub.getInstance().reportSendState(pending as any, 'failed', { reason: 'TRANSIENT' });
    expect(refresh).toHaveBeenCalledTimes(1);
  });
});
