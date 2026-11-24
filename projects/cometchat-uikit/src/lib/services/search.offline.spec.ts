vi.mock('@cometchat/calls-sdk-javascript', () => ({ default: {} }));

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { SearchMessagesService } from './search-messages.service';
import { SearchConversationsService } from './search-conversations.service';
import { CometChatSearchFilter, States } from '../Enums/Enums';
import { installOfflineSdk, OfflineSdkFake } from '../testing/offline-sdk-fake';
import { NOT_CONNECTED, stubBuild, twoPhaseRequest } from '../testing/two-phase-request-fake';
import { ConnectionStateService } from './connection-state.service';
import { setConnection } from '../testing/connection-driver';
import { SearchFailureHold } from './search-failure-hold';

const msg = (id: number): any => ({ getId: () => id });
const conv = (id: string): any => ({ getConversationId: () => id });

/** The connection drops and comes back, as the SDK reports it. */
function reconnect(): void {
  const connection = TestBed.inject(ConnectionStateService) as any;
  for (const value of [false, true]) {
    setConnection(connection, value);
    TestBed.tick();
  }
}

describe('message search: offline (UIT-LIST-02, README §3.9)', () => {
  let fake: OfflineSdkFake;
  let service: SearchMessagesService;

  beforeEach(() => {
    fake = installOfflineSdk();
    TestBed.configureTestingModule({ providers: [SearchMessagesService] });
    service = TestBed.inject(SearchMessagesService);
  });
  afterEach(() => {
    fake.restore();
    vi.restoreAllMocks();
  });

  const stub = (request: unknown) =>
    stubBuild(CometChat, 'MessagesRequestBuilder').mockReturnValue(request as any);

  it('D84 rule 7: a keyword while offline with nothing saved is "Connect to search" (empty, not an error) and resolves with no report', async () => {
    stub({ fetchPrevious: vi.fn().mockRejectedValue(NOT_CONNECTED) });
    await expect(service.search('hello', [], 'u1')).resolves.toBeUndefined();
    expect(service.fetchState()).toBe(States.empty);
    expect(service.connectToSearch()).toBe(true);
    expect(service.messages()).toEqual([]);
  });

  it('D84 rule 8: that "Connect to search" searches again once by itself on reconnect', async () => {
    const request = {
      fetchPrevious: vi.fn().mockRejectedValueOnce(NOT_CONNECTED).mockResolvedValue([msg(1)]),
    };
    stub(request);
    await service.search('hello', [], 'u1');
    reconnect();
    await vi.waitFor(() => expect(service.fetchState()).toBe(States.loaded));
    expect(service.connectToSearch()).toBe(false);
    expect(service.messages().map(m => m.getId())).toEqual([1]);
    expect(request.fetchPrevious).toHaveBeenCalledTimes(2);
    reconnect();
    await Promise.resolve();
    expect(request.fetchPrevious).toHaveBeenCalledTimes(2);
  });

  it('D84 rule 8: when the search that reconnect re-ran fails again offline, "Connect to search" stays and nothing is reported', async () => {
    stub({ fetchPrevious: vi.fn().mockRejectedValue(NOT_CONNECTED) });
    const reported: unknown[] = [];
    service.reconnectSearchError$.subscribe(e => reported.push(e));
    await service.search('hello', [], 'u1');
    reconnect();
    await Promise.resolve();
    await Promise.resolve();
    expect(service.connectToSearch()).toBe(true);
    expect(service.fetchState()).toBe(States.empty);
    expect(reported).toEqual([]);
  });

  it('D84 rule 4: a keyword search that fails online is the error view with the failure reported, and is not re-run', async () => {
    const request = { fetchPrevious: vi.fn().mockRejectedValue({ code: 'ERR_X' }) };
    stub(request);
    await expect(service.search('hello', [], 'u1')).rejects.toBeTruthy();
    expect(service.connectToSearch()).toBe(false);
    expect(service.fetchState()).toBe(States.error);
    reconnect();
    await Promise.resolve();
    expect(request.fetchPrevious).toHaveBeenCalledTimes(1);
  });

  it('a keyword search online asks for the server once, with no listener', async () => {
    const request = { fetchPrevious: vi.fn().mockResolvedValue([msg(1)]) };
    stub(request);
    await service.search('hello', [], 'u1');
    expect(request.fetchPrevious).toHaveBeenCalledWith();
    expect(service.fetchState()).toBe(States.loaded);
  });

  it('a filter without a keyword reads cached then server, newest first, no repeats', async () => {
    const request = twoPhaseRequest('Messages', [
      { cached: [msg(1), msg(2)], server: [msg(2), msg(3)] },
    ]);
    stub(request);
    await service.search('', [CometChatSearchFilter.Photos], 'u1');
    expect(service.messages().map(m => m.getId())).toEqual([3, 2]);
    expect(service.fetchState()).toBe(States.loaded);
  });

  it('D84 rule 2: a filter without a keyword, offline, keeps the cached rows and reports nothing', async () => {
    stub(twoPhaseRequest('Messages', [{ cached: [msg(1), msg(2)], error: NOT_CONNECTED }]));
    await expect(service.search('', [CometChatSearchFilter.Photos], 'u1')).resolves.toBeUndefined();
    expect(service.messages().map(m => m.getId())).toEqual([2, 1]);
    expect(service.fetchState()).toBe(States.loaded);
    expect(service.connectToSearch()).toBe(false);
  });

  it('D84 rule 5: an online failure over cached rows keeps them and is reported once', async () => {
    stub(twoPhaseRequest('Messages', [{ cached: [msg(1)], error: { code: 'ERR_X' } }]));
    await expect(service.search('', [CometChatSearchFilter.Photos], 'u1')).rejects.toEqual({ code: 'ERR_X' });
    expect(service.messages().map(m => m.getId())).toEqual([1]);
    expect(service.fetchState()).toBe(States.loaded);
  });

  it('D84 (Android): a filter alone, offline with an empty cached page, is the plain empty state: not "Connect to search", no report, and no search again on reconnect', async () => {
    const request = twoPhaseRequest('Messages', [
      { cached: [], error: NOT_CONNECTED },
      { server: [msg(7)] },
    ]);
    stub(request);
    await expect(service.search('', [CometChatSearchFilter.Photos], 'u1')).resolves.toBeUndefined();
    expect(service.fetchState()).toBe(States.empty);
    expect(service.connectToSearch()).toBe(false);
    reconnect();
    await new Promise(resolve => setTimeout(resolve, 20));
    expect(request.fetchPrevious).toHaveBeenCalledTimes(1);
    expect(service.messages()).toEqual([]);
    expect(service.fetchState()).toBe(States.empty);
  });

  it('D84 (Android): a filter alone that fails with a real error offline is still reported', async () => {
    stub(twoPhaseRequest('Messages', [{ cached: [], error: { code: 'ERR_X' } }]));
    await expect(service.search('', [CometChatSearchFilter.Photos], 'u1')).rejects.toEqual({ code: 'ERR_X' });
    expect(service.fetchState()).toBe(States.error);
    expect(service.connectToSearch()).toBe(false);
  });

  it('D84 rule 6: a server that answers an empty list is the empty view', async () => {
    stub(twoPhaseRequest('Messages', [{ server: [] }]));
    await service.search('', [CometChatSearchFilter.Photos], 'u1');
    expect(service.fetchState()).toBe(States.empty);
  });

  it('"load more" of a filter never repeats a row', async () => {
    const request = twoPhaseRequest('Messages', [
      { server: [msg(5), msg(6)] },
      { cached: [msg(4), msg(5)], server: [msg(3), msg(4), msg(5)] },
    ]);
    stub(request);
    await service.search('', [CometChatSearchFilter.Photos], 'u1');
    await service.loadMore();
    const ids = service.messages().map(m => m.getId());
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual([6, 5, 4, 3]);
  });

  it('offline off: a filter is one plain read (P1)', async () => {
    fake.setEnabled(false);
    const request = { fetchPrevious: vi.fn().mockResolvedValue([msg(1)]) };
    stub(request);
    await service.search('', [CometChatSearchFilter.Photos], 'u1');
    expect(request.fetchPrevious).toHaveBeenCalledWith();
  });

  it('offline off: a keyword failure stays an error (P1)', async () => {
    fake.setEnabled(false);
    stub({ fetchPrevious: vi.fn().mockRejectedValue(NOT_CONNECTED) });
    await expect(service.search('hello', [], 'u1')).rejects.toBeTruthy();
    expect(service.fetchState()).toBe(States.error);
    reconnect();
    await Promise.resolve();
    expect(service.fetchState()).toBe(States.error);
  });
});

describe('conversation search: offline (UIT-LIST-02, README §3.9)', () => {
  let fake: OfflineSdkFake;
  let service: SearchConversationsService;

  beforeEach(() => {
    fake = installOfflineSdk();
    TestBed.configureTestingModule({ providers: [SearchConversationsService] });
    service = TestBed.inject(SearchConversationsService);
  });
  afterEach(() => {
    fake.restore();
    vi.restoreAllMocks();
  });

  const stub = (request: unknown) =>
    stubBuild(CometChat, 'ConversationsRequestBuilder').mockReturnValue(request as any);

  it('D84 rule 7: a keyword while offline with nothing saved is "Connect to search" (empty, not an error) and resolves with no report', async () => {
    stub({ fetchNext: vi.fn().mockRejectedValue(NOT_CONNECTED) });
    await expect(service.search('ann', [])).resolves.toBeUndefined();
    expect(service.fetchState()).toBe(States.empty);
    expect(service.connectToSearch()).toBe(true);
    expect(service.conversations()).toEqual([]);
  });

  it('D84 rule 8: that "Connect to search" searches again once by itself on reconnect', async () => {
    const request = {
      fetchNext: vi.fn().mockRejectedValueOnce(NOT_CONNECTED).mockResolvedValue([conv('c1')]),
    };
    stub(request);
    await service.search('ann', []);
    reconnect();
    await vi.waitFor(() => expect(service.fetchState()).toBe(States.loaded));
    expect(service.connectToSearch()).toBe(false);
    expect(request.fetchNext).toHaveBeenCalledTimes(2);
    reconnect();
    await Promise.resolve();
    expect(request.fetchNext).toHaveBeenCalledTimes(2);
  });

  it('D84 rule 8: when the search that reconnect re-ran fails again offline, "Connect to search" stays and nothing is reported', async () => {
    const request = { fetchNext: vi.fn().mockRejectedValue(NOT_CONNECTED) };
    stub(request);
    const reported: unknown[] = [];
    service.reconnectSearchError$.subscribe(e => reported.push(e));
    await service.search('ann', []);
    reconnect();
    await vi.waitFor(() => expect(request.fetchNext).toHaveBeenCalledTimes(2));
    await Promise.resolve();
    await Promise.resolve();
    expect(service.connectToSearch()).toBe(true);
    expect(service.fetchState()).toBe(States.empty);
    expect(reported).toEqual([]);
  });

  it('D84 rule 4: a keyword search that fails online is the error view with the failure reported, and is not re-run on reconnect', async () => {
    const request = { fetchNext: vi.fn().mockRejectedValue({ code: 'ERR_X' }) };
    stub(request);
    await expect(service.search('ann', [])).rejects.toBeTruthy();
    reconnect();
    await Promise.resolve();
    expect(request.fetchNext).toHaveBeenCalledTimes(1);
  });

  it('the Unread filter without a keyword reads cached then server, deduped', async () => {
    stub(
      twoPhaseRequest('Conversations', [
        { cached: [conv('a'), conv('b')], server: [conv('b'), conv('c')] },
      ])
    );
    await service.search('', [CometChatSearchFilter.Unread]);
    expect(service.conversations().map(c => c.getConversationId())).toEqual(['b', 'c']);
  });

  it('D84 rule 2: the Unread filter offline keeps the cached rows and reports nothing', async () => {
    stub(twoPhaseRequest('Conversations', [{ cached: [conv('a')], error: NOT_CONNECTED }]));
    await expect(service.search('', [CometChatSearchFilter.Unread])).resolves.toBeUndefined();
    expect(service.conversations().map(c => c.getConversationId())).toEqual(['a']);
    expect(service.fetchState()).toBe(States.loaded);
    expect(service.connectToSearch()).toBe(false);
  });

  it('D84 (Android): the Unread filter offline with an empty cached page is the plain empty state, not "Connect to search", with no report', async () => {
    const request = twoPhaseRequest('Conversations', [
      { cached: [], error: NOT_CONNECTED },
      { server: [conv('z')] },
    ]);
    stub(request);
    await expect(service.search('', [CometChatSearchFilter.Unread])).resolves.toBeUndefined();
    expect(service.fetchState()).toBe(States.empty);
    expect(service.connectToSearch()).toBe(false);
    reconnect();
    await new Promise(resolve => setTimeout(resolve, 20));
    expect(request.fetchNext).toHaveBeenCalledTimes(1);
    expect(service.fetchState()).toBe(States.empty);
  });

  it('D84 rule 6: a server that answers an empty list is the empty view', async () => {
    stub(twoPhaseRequest('Conversations', [{ server: [] }]));
    await service.search('', [CometChatSearchFilter.Unread]);
    expect(service.fetchState()).toBe(States.empty);
  });

  it('offline off: one plain read, and a keyword failure stays an error (P1)', async () => {
    fake.setEnabled(false);
    const request = { fetchNext: vi.fn().mockRejectedValue(NOT_CONNECTED) };
    stub(request);
    await expect(service.search('ann', [])).rejects.toBeTruthy();
    expect(service.fetchState()).toBe(States.error);
    expect(request.fetchNext).toHaveBeenCalledWith();
  });
});

/**
 * Inside the search component (a `SearchFailureHold` is provided) a real failure with nothing shown is
 * not reported by the scope: it keeps the error for the component, which has the other scope's answer
 * (Android's `updateFinalStateIfCompleted`).
 */
describe('search services inside the search component: a real failure with nothing shown is held', () => {
  const SERVER_ERROR = { code: 'ERR_SERVER' };
  let fake: OfflineSdkFake;
  let hold: SearchFailureHold;
  let messages: SearchMessagesService;
  let conversations: SearchConversationsService;

  beforeEach(() => {
    fake = installOfflineSdk();
    TestBed.configureTestingModule({
      providers: [SearchMessagesService, SearchConversationsService, SearchFailureHold],
    });
    hold = TestBed.inject(SearchFailureHold);
    messages = TestBed.inject(SearchMessagesService);
    conversations = TestBed.inject(SearchConversationsService);
  });
  afterEach(() => {
    fake.restore();
    vi.restoreAllMocks();
  });

  const stubMessages = (request: unknown) =>
    stubBuild(CometChat, 'MessagesRequestBuilder').mockReturnValue(request as any);
  const stubConversations = (request: unknown) =>
    stubBuild(CometChat, 'ConversationsRequestBuilder').mockReturnValue(request as any);

  it('a keyword search that fails resolves as failed, empty, with the error held and nothing thrown', async () => {
    stubMessages({ fetchPrevious: vi.fn().mockRejectedValue(SERVER_ERROR) });
    await expect(messages.search('ann', [])).resolves.toBeUndefined();
    expect(messages.searchFailed()).toBe(true);
    expect(messages.fetchState()).toBe(States.empty);
    expect(messages.connectToSearch()).toBe(false);
    expect(hold.hasHeld).toBe(true);
    expect(hold.take()).toEqual([SERVER_ERROR]);
    expect(hold.hasHeld).toBe(false);
  });

  it('the same for the conversations of a keyword', async () => {
    stubConversations({ fetchNext: vi.fn().mockRejectedValue(SERVER_ERROR) });
    await expect(conversations.search('ann', [])).resolves.toBeUndefined();
    expect(conversations.searchFailed()).toBe(true);
    expect(conversations.fetchState()).toBe(States.empty);
    expect(hold.take()).toEqual([SERVER_ERROR]);
  });

  it('a filter alone that fails with a real error is held too, for messages and for conversations', async () => {
    stubMessages(twoPhaseRequest('Messages', [{ cached: [], error: SERVER_ERROR }]));
    await expect(messages.search('', [CometChatSearchFilter.Photos], 'u1')).resolves.toBeUndefined();
    expect(messages.searchFailed()).toBe(true);
    expect(messages.fetchState()).toBe(States.empty);
    stubConversations(twoPhaseRequest('Conversations', [{ cached: [], error: SERVER_ERROR }]));
    await expect(conversations.search('', [CometChatSearchFilter.Unread])).resolves.toBeUndefined();
    expect(conversations.searchFailed()).toBe(true);
    expect(conversations.fetchState()).toBe(States.empty);
    expect(hold.take()).toEqual([SERVER_ERROR, SERVER_ERROR]);
  });

  it('a failure is not run again on reconnect', async () => {
    const request = { fetchPrevious: vi.fn().mockRejectedValue(SERVER_ERROR) };
    stubMessages(request);
    await messages.search('ann', []);
    reconnect();
    await new Promise(resolve => setTimeout(resolve, 20));
    expect(request.fetchPrevious).toHaveBeenCalledTimes(1);
  });

  it('a new search, and a reset, forget the held error and the failed flag', async () => {
    stubMessages({ fetchPrevious: vi.fn().mockRejectedValueOnce(SERVER_ERROR).mockResolvedValue([msg(1)]) });
    await messages.search('ann', []);
    expect(hold.hasHeld).toBe(true);
    await messages.search('anna', []);
    expect(messages.searchFailed()).toBe(false);
    expect(hold.hasHeld).toBe(false);
    expect(messages.fetchState()).toBe(States.loaded);

    stubConversations({ fetchNext: vi.fn().mockRejectedValue(SERVER_ERROR) });
    await conversations.search('ann', []);
    expect(hold.hasHeld).toBe(true);
    conversations.reset();
    expect(conversations.searchFailed()).toBe(false);
    expect(hold.hasHeld).toBe(false);
  });

  it('a failure over results on screen is still thrown, to be reported once (rule 5)', async () => {
    stubMessages(twoPhaseRequest('Messages', [{ cached: [msg(1)], error: SERVER_ERROR }]));
    await expect(messages.search('', [CometChatSearchFilter.Photos], 'u1')).rejects.toEqual(SERVER_ERROR);
    expect(messages.searchFailed()).toBe(false);
    expect(hold.hasHeld).toBe(false);
    expect(messages.fetchState()).toBe(States.loaded);
  });

  it('a not-connected keyword search is still "Connect to search", never held', async () => {
    stubMessages({ fetchPrevious: vi.fn().mockRejectedValue(NOT_CONNECTED) });
    await messages.search('ann', []);
    expect(messages.connectToSearch()).toBe(true);
    expect(messages.searchFailed()).toBe(false);
    expect(hold.hasHeld).toBe(false);
  });

  it('an older search that fails after a newer one started holds nothing', async () => {
    let failFirst!: (error: unknown) => void;
    const first = { fetchPrevious: vi.fn().mockReturnValue(new Promise((_, reject) => (failFirst = reject))) };
    stubMessages(first);
    const older = messages.search('a', []);
    stubMessages({ fetchPrevious: vi.fn().mockResolvedValue([msg(2)]) });
    await messages.search('ab', []);
    failFirst(SERVER_ERROR);
    await older;
    expect(hold.hasHeld).toBe(false);
    expect(messages.searchFailed()).toBe(false);
    expect(messages.fetchState()).toBe(States.loaded);
  });

  it('offline off: the same failure is thrown as an error, as today', async () => {
    fake.setEnabled(false);
    stubMessages({ fetchPrevious: vi.fn().mockRejectedValue(SERVER_ERROR) });
    await expect(messages.search('ann', [])).rejects.toEqual(SERVER_ERROR);
    expect(messages.fetchState()).toBe(States.error);
    expect(messages.searchFailed()).toBe(false);
    expect(hold.hasHeld).toBe(false);
  });
});
