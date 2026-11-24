vi.mock('@cometchat/calls-sdk-javascript', () => ({ default: {} }));

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { MessageComposerService } from './message-composer.service';
import { installOfflineSdk, OfflineSdkFake } from '../testing/offline-sdk-fake';
import { NOT_CONNECTED, stubBuild, twoPhaseRequest } from '../testing/two-phase-request-fake';

const person = (uid: string): any => ({
  getUid: () => uid,
  getName: () => uid,
  getAvatar: () => '',
});
const wait = (ms = 220) => new Promise<void>(resolve => setTimeout(resolve, ms));

/**
 * Mentions suggestions: two rounds without a keyword; offline with a keyword there is nothing to
 * show: an empty list, no error and no "Connect to search" (Android `TwoPhaseSuggestionFetch`, and
 * the same "no match" every other kit shows).
 */
describe('MessageComposerService: mentions offline', () => {
  let fake: OfflineSdkFake;
  let service: MessageComposerService;
  let onError: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fake = installOfflineSdk();
    TestBed.configureTestingModule({ providers: [MessageComposerService] });
    service = TestBed.inject(MessageComposerService);
    onError = vi.fn();
    service.setErrorCallback(onError as any);
  });
  afterEach(() => {
    service.cleanup();
    fake.restore();
    vi.restoreAllMocks();
  });

  const stubUsers = (request: unknown) =>
    stubBuild(CometChat, 'UsersRequestBuilder').mockReturnValue(request as any);
  const uids = () => service.mentionSuggestions().map(s => s.uid);

  it("without a keyword it shows the cached people, then the server's", async () => {
    stubUsers(
      twoPhaseRequest('Users', [{ cached: [person('a')], server: [person('a'), person('b')] }])
    );
    service.searchMentions('');
    await wait();
    expect(uids()).toEqual(['a', 'b']);
    expect(service.isFetchingMentions()).toBe(false);
    expect(onError).not.toHaveBeenCalled();
  });

  it('without a keyword, offline, it keeps the cached people and raises no error', async () => {
    stubUsers(twoPhaseRequest('Users', [{ cached: [person('a')], error: NOT_CONNECTED }]));
    service.searchMentions('');
    await wait();
    expect(uids()).toEqual(['a']);
    expect(onError).not.toHaveBeenCalled();
  });

  it('without a keyword, offline, with nothing cached it ends loading with no list and no error', async () => {
    stubUsers(twoPhaseRequest('Users', [{ cached: [], error: NOT_CONNECTED }]));
    service.searchMentions('');
    await wait();
    expect(uids()).toEqual([]);
    expect(service.isFetchingMentions()).toBe(false);
    expect(onError).not.toHaveBeenCalled();
  });

  it('with a keyword, offline, there is nothing to show: no list, no error, no "Connect to search"', async () => {
    stubUsers({ fetchNext: vi.fn().mockRejectedValue(NOT_CONNECTED) });
    service.searchMentions('jo');
    await wait();
    expect(uids()).toEqual([]);
    expect((service as any).mentionsNeedConnection?.() ?? false).toBe(false);
    expect(service.isFetchingMentions()).toBe(false);
    expect(onError).not.toHaveBeenCalled();
  });

  it('a search after an offline one shows the people found', async () => {
    const request = {
      fetchNext: vi
        .fn()
        .mockRejectedValueOnce(NOT_CONNECTED)
        .mockResolvedValue([person('jo')]),
    };
    stubUsers(request);
    service.searchMentions('jo');
    await wait();
    expect(uids()).toEqual([]);
    service.searchMentions('jon');
    await wait();
    expect(uids()).toEqual(['jo']);
  });

  it('a keyword with a real error is still reported', async () => {
    stubUsers({ fetchNext: vi.fn().mockRejectedValue({ code: 'ERR_X' }) });
    service.searchMentions('jo');
    await wait();
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it('offline off: one plain read, and the failure is reported as today (P1)', async () => {
    fake.setEnabled(false);
    const request = { fetchNext: vi.fn().mockRejectedValue(NOT_CONNECTED) };
    stubUsers(request);
    service.searchMentions('');
    await wait();
    expect(request.fetchNext).toHaveBeenCalledWith();
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it('group members without a keyword read two-phase and keep @all', async () => {
    stubBuild(CometChat, 'GroupMembersRequestBuilder').mockReturnValue(
      twoPhaseRequest('GroupMembers', [
        { cached: [person('a')], server: [person('a'), person('b')] },
      ]) as any
    );
    service.searchMentions('', { getGuid: () => 'g1' } as any, undefined, undefined, false, 'all');
    await wait();
    expect(uids()).toEqual(['all', 'a', 'b']);
  });
});

describe('MessageComposerService: more mentions offline', () => {
  let fake: OfflineSdkFake;

  beforeEach(() => {
    fake = installOfflineSdk();
    TestBed.configureTestingModule({ providers: [MessageComposerService] });
  });
  afterEach(() => {
    fake.restore();
    vi.restoreAllMocks();
  });

  it('scrolling past the cache while offline raises no error', async () => {
    const service = TestBed.inject(MessageComposerService);
    const onError = vi.fn();
    service.setErrorCallback(onError as any);
    stubBuild(CometChat, 'UsersRequestBuilder').mockReturnValue({
      fetchNext: vi.fn().mockRejectedValue(NOT_CONNECTED),
    } as any);
    service.initializeMentionsPagination('');
    await service.fetchMoreMentions(false);
    expect(onError).not.toHaveBeenCalled();
  });

  it('offline off: the failure is reported as today (P1)', async () => {
    fake.setEnabled(false);
    const service = TestBed.inject(MessageComposerService);
    const onError = vi.fn();
    service.setErrorCallback(onError as any);
    stubBuild(CometChat, 'UsersRequestBuilder').mockReturnValue({
      fetchNext: vi.fn().mockRejectedValue(NOT_CONNECTED),
    } as any);
    service.initializeMentionsPagination('');
    await service.fetchMoreMentions(false);
    expect(onError).toHaveBeenCalledTimes(1);
  });
});
