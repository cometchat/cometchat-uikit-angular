/**
 * A changed search shows only the new search: a read still running for the old
 * keyword is dropped when it lands, in Users, Groups, Group Members and both
 * Search lists, with offline support off (today's requests are unchanged).
 */
vi.mock('@cometchat/calls-sdk-javascript', () => ({ default: {} }));

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { UsersService } from './users.service';
import { GroupsService } from './groups.service';
import { GroupMembersService } from './group-members.service';
import { SearchMessagesService } from './search-messages.service';
import { SearchConversationsService } from './search-conversations.service';
import { States } from '../Enums/Enums';

/** A read the test settles by hand. */
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const user = (uid: string): any => ({ getUid: () => uid });
const group = (guid: string): any => ({ getGuid: () => guid });
const conversation = (id: string): any => ({ getConversationId: () => id });
const message = (id: number): any => ({ getId: () => id });

/** A builder whose request depends on the keyword it was given. */
function builderFor(requests: Record<string, unknown>): any {
  return {
    setSearchKeyword(keyword: string) {
      return { build: () => requests[keyword] };
    },
    build: () => requests[''],
  };
}

describe('a changed search drops the old keyword\'s late answer (offline off)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  it('users', async () => {
    TestBed.configureTestingModule({ providers: [UsersService] });
    const service = TestBed.inject(UsersService);
    const old = deferred<any[]>();
    const builder = builderFor({
      old: { fetchNext: () => old.promise },
      new: { fetchNext: () => Promise.resolve([user('new1')]) },
    });
    service.initialize({ searchText: 'old', usersRequestBuilder: builder });
    const oldRead = service.fetchNext();
    service.search('new', { usersRequestBuilder: builder });
    const newRead = service.fetchNext();
    // The old read answers while the new one is still waiting out its shimmer.
    old.resolve([user('old1'), user('old2')]);
    await vi.advanceTimersByTimeAsync(1500);
    await Promise.all([oldRead, newRead]);
    expect(service.users().map(u => u.getUid())).toEqual(['new1']);
    expect(service.hasMore()).toBe(false);
  });

  it('users: the old read\'s end does not release the new read\'s in-flight flag', async () => {
    TestBed.configureTestingModule({ providers: [UsersService] });
    const service = TestBed.inject(UsersService);
    const old = deferred<any[]>();
    const second = deferred<any[]>();
    const fresh = vi.fn().mockReturnValueOnce(second.promise);
    const builder = builderFor({
      old: { fetchNext: () => old.promise },
      new: { fetchNext: fresh },
    });
    service.initialize({ searchText: 'old', usersRequestBuilder: builder });
    const oldRead = service.fetchNext();
    service.search('new', { usersRequestBuilder: builder });
    const newRead = service.fetchNext();
    old.resolve([user('old1')]);
    await vi.advanceTimersByTimeAsync(1500);
    await oldRead;
    // The new read is still running: a second fetchNext must not start another.
    await service.fetchNext();
    expect(fresh).toHaveBeenCalledTimes(1);
    second.resolve([user('new1')]);
    await vi.advanceTimersByTimeAsync(1500);
    await newRead;
  });

  it('users: the old read\'s late failure is ignored', async () => {
    TestBed.configureTestingModule({ providers: [UsersService] });
    const service = TestBed.inject(UsersService);
    const onError = vi.fn();
    service.setErrorCallback(onError);
    const old = deferred<any[]>();
    const builder = builderFor({
      old: { fetchNext: () => old.promise },
      new: { fetchNext: () => Promise.resolve([user('new1')]) },
    });
    service.initialize({ searchText: 'old', usersRequestBuilder: builder });
    const oldRead = service.fetchNext();
    service.search('new', { usersRequestBuilder: builder });
    const newRead = service.fetchNext();
    old.reject(new Error('old search failed'));
    await vi.advanceTimersByTimeAsync(1500);
    await Promise.all([oldRead, newRead]);
    expect(onError).not.toHaveBeenCalled();
    expect(service.fetchState()).toBe(States.loaded);
    expect(service.users().map(u => u.getUid())).toEqual(['new1']);
  });

  it('groups', async () => {
    TestBed.configureTestingModule({ providers: [GroupsService] });
    const service = TestBed.inject(GroupsService);
    const old = deferred<any[]>();
    const builder = builderFor({
      old: { fetchNext: () => old.promise },
      new: { fetchNext: () => Promise.resolve([group('new1')]) },
    });
    service.initialize({ searchText: 'old', groupsRequestBuilder: builder });
    const oldRead = service.fetchNext();
    service.search('new', { groupsRequestBuilder: builder });
    const newRead = service.fetchNext();
    old.resolve([group('old1'), group('old2')]);
    await vi.advanceTimersByTimeAsync(1500);
    await Promise.all([oldRead, newRead]);
    expect(service.groups().map(g => g.getGuid())).toEqual(['new1']);
    expect(service.hasMore()).toBe(false);
  });

  it('group members', async () => {
    TestBed.configureTestingModule({ providers: [GroupMembersService] });
    const service = TestBed.inject(GroupMembersService);
    const old = deferred<any[]>();
    const requests: Record<string, unknown> = {
      '': { fetchNext: () => old.promise },
      new: { fetchNext: () => Promise.resolve([user('new1')]) },
    };
    const builder = {
      keyword: '',
      setSearchKeyword(keyword: string) {
        this.keyword = keyword;
        return this;
      },
      build() {
        return requests[this.keyword];
      },
    };
    service.initialize(group('room'), builder as any);
    service.search('new', builder as any);
    old.resolve([user('old1'), user('old2')]);
    await vi.advanceTimersByTimeAsync(1500);
    expect(service.members().map((m: any) => m.getUid())).toEqual(['new1']);
  });

  it('search messages: the answer and the load-more of the old keyword are dropped', async () => {
    TestBed.configureTestingModule({ providers: [SearchMessagesService] });
    const service = TestBed.inject(SearchMessagesService);
    const oldFirst = deferred<any[]>();
    const oldMore = deferred<any[]>();
    const page = Array.from({ length: 30 }, (_, i) => message(i + 1));
    const requests = [
      { fetchPrevious: vi.fn().mockReturnValueOnce(oldFirst.promise) },
      { fetchPrevious: vi.fn().mockResolvedValueOnce(page).mockReturnValueOnce(oldMore.promise) },
      { fetchPrevious: vi.fn().mockResolvedValue([message(500)]) },
    ];
    let built = 0;
    vi.spyOn(service as any, 'buildRequest').mockImplementation(() => requests[built++]);

    // The first keyword is replaced before it answers.
    const first = service.search('one', []);
    const second = service.search('two', []);
    oldFirst.resolve([message(900)]);
    await Promise.all([first, second]);
    expect(service.messages().map(m => m.getId()).sort((a, b) => a - b)).toEqual(
      Array.from({ length: 30 }, (_, i) => i + 1)
    );

    // A load-more asked for by "two" is dropped once "three" starts.
    const more = service.loadMore();
    await service.search('three', []);
    oldMore.resolve([message(901)]);
    await more;
    expect(service.messages().map(m => m.getId())).toEqual([500]);
    // "three" can load more: the old load-more did not leave the lock held.
    await service.loadMore();
    expect(requests[2]!.fetchPrevious).toHaveBeenCalledTimes(2);
  });

  it('search conversations: the answer and the load-more of the old keyword are dropped', async () => {
    TestBed.configureTestingModule({ providers: [SearchConversationsService] });
    const service = TestBed.inject(SearchConversationsService);
    const oldFirst = deferred<any[]>();
    const oldMore = deferred<any[]>();
    const page = Array.from({ length: 3 }, (_, i) => conversation(`c${i + 1}`));
    const requests = [
      { fetchNext: vi.fn().mockReturnValueOnce(oldFirst.promise) },
      { fetchNext: vi.fn().mockResolvedValueOnce(page).mockReturnValueOnce(oldMore.promise) },
      { fetchNext: vi.fn().mockResolvedValue([conversation('fresh')]) },
    ];
    let built = 0;
    vi.spyOn(service as any, 'buildRequest').mockImplementation(() => requests[built++]);

    const first = service.search('one', []);
    const second = service.search('two', []);
    oldFirst.resolve([conversation('stale')]);
    await Promise.all([first, second]);
    expect(service.conversations().map(c => c.getConversationId())).toEqual(['c1', 'c2', 'c3']);

    const more = service.loadMore();
    await service.search('three', []);
    oldMore.resolve([conversation('stale-more')]);
    await more;
    expect(service.conversations().map(c => c.getConversationId())).toEqual(['fresh']);
    await service.loadMore();
    expect(requests[2]!.fetchNext).toHaveBeenCalledTimes(2);
  });
});
