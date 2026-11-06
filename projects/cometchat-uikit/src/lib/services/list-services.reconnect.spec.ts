/**
 * Reconnect refresh of the users, groups and group members lists.
 *
 * After a reconnect each list re-fetches its first page. The refresh must rebuild the same list
 * the app asked for (its request builder and any active search), and must not overwrite a list
 * that a search or another group replaced while it was in flight (#632 review).
 *
 * @module services/list-reconnect
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { ConnectionStateService } from './connection-state.service';
import { UsersService } from './users.service';
import { GroupsService } from './groups.service';
import { GroupMembersService } from './group-members.service';

const user = (uid: string) => ({ getUid: () => uid }) as unknown as CometChat.User;
const group = (guid: string) => ({ getGuid: () => guid }) as unknown as CometChat.Group;
const member = (uid: string) => ({ getUid: () => uid }) as unknown as CometChat.GroupMember;

/** A request whose fetchNext resolves when the test says so. */
function request<T>() {
  let resolve!: (items: T[]) => void;
  const fetchNext = vi.fn(() => new Promise<T[]>((r) => (resolve = r)));
  return { req: { fetchNext } as any, resolve: (items: T[]) => resolve(items) };
}

/** A request builder whose build() hands out the given requests in order, recording the search keywords. */
function builder(...requests: any[]) {
  const keywords: string[] = [];
  const b: any = {
    build: vi.fn(() => requests.shift()),
    setSearchKeyword: vi.fn((k: string) => {
      keywords.push(k);
      return b;
    }),
  };
  return { b, keywords };
}

let reconnected$: Subject<boolean>;

function setup<T>(service: new () => T): T {
  reconnected$ = new Subject<boolean>();
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ providers: [service as any, { provide: ConnectionStateService, useValue: { reconnected$ } }] });
  return TestBed.inject(service as any) as T;
}

/** Let promise callbacks run, and the services' minimum shimmer time pass. */
const settle = () => vi.advanceTimersByTimeAsync(1_100);

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('UsersService reconnect refresh', () => {
  it("re-fetches with the app's usersRequestBuilder", async () => {
    const service = setup(UsersService);
    const first = request<CometChat.User>();
    const fresh = request<CometChat.User>();
    const { b } = builder(first.req, fresh.req);
    service.initialize({ usersRequestBuilder: b });
    const done = service.fetchNext();
    first.resolve([user('a')]);
    await settle();
    await done;

    reconnected$.next(true);
    fresh.resolve([user('b')]);
    await settle();

    expect(b.build).toHaveBeenCalledTimes(2);
    expect(service.users().map((u) => u.getUid())).toEqual(['b']);
  });

  it('keeps an active search', async () => {
    const service = setup(UsersService);
    const first = request<CometChat.User>();
    const fresh = request<CometChat.User>();
    const { b, keywords } = builder(first.req, fresh.req);
    service.search('ali', { searchRequestBuilder: b });
    const done = service.fetchNext();
    first.resolve([user('alice')]);
    await settle();
    await done;

    reconnected$.next(true);
    fresh.resolve([user('alina')]);
    await settle();

    expect(keywords).toEqual(['ali', 'ali']);
    expect(service.users().map((u) => u.getUid())).toEqual(['alina']);
  });

  it('does not overwrite a search made while the refresh was in flight', async () => {
    const service = setup(UsersService);
    const first = request<CometChat.User>();
    const fresh = request<CometChat.User>();
    const searched = request<CometChat.User>();
    const { b } = builder(first.req, fresh.req, searched.req);
    service.initialize({ usersRequestBuilder: b });
    const done = service.fetchNext();
    first.resolve([user('a')]);
    await settle();
    await done;

    reconnected$.next(true);
    service.search('zed', { usersRequestBuilder: b });
    const searching = service.fetchNext();
    searched.resolve([user('zed')]);
    await settle();
    await searching;
    fresh.resolve([user('stale')]);
    await settle();

    expect(service.users().map((u) => u.getUid())).toEqual(['zed']);
  });

  it('ignores a reconnect before the first fetch has completed', async () => {
    const service = setup(UsersService);
    const { b } = builder(request<CometChat.User>().req);
    service.initialize({ usersRequestBuilder: b });
    reconnected$.next(true);
    await settle();
    expect(b.build).toHaveBeenCalledTimes(1);
  });
});

describe('GroupsService reconnect refresh', () => {
  it("re-fetches with the app's groupsRequestBuilder and keeps an active search", async () => {
    const service = setup(GroupsService);
    const first = request<CometChat.Group>();
    const fresh = request<CometChat.Group>();
    const { b, keywords } = builder(first.req, fresh.req);
    service.search('team', { searchRequestBuilder: b });
    const done = service.fetchNext();
    first.resolve([group('team-1')]);
    await settle();
    await done;

    reconnected$.next(true);
    fresh.resolve([group('team-2')]);
    await settle();

    expect(keywords).toEqual(['team', 'team']);
    expect(service.groups().map((g) => g.getGuid())).toEqual(['team-2']);
  });

  it('does not overwrite a search made while the refresh was in flight', async () => {
    const service = setup(GroupsService);
    const first = request<CometChat.Group>();
    const fresh = request<CometChat.Group>();
    const searched = request<CometChat.Group>();
    const { b } = builder(first.req, fresh.req, searched.req);
    service.initialize({ groupsRequestBuilder: b });
    const done = service.fetchNext();
    first.resolve([group('g1')]);
    await settle();
    await done;

    reconnected$.next(true);
    service.search('zed', { groupsRequestBuilder: b });
    const searching = service.fetchNext();
    searched.resolve([group('zed')]);
    await settle();
    await searching;
    fresh.resolve([group('stale')]);
    await settle();

    expect(service.groups().map((g) => g.getGuid())).toEqual(['zed']);
  });
});

describe('GroupMembersService reconnect refresh', () => {
  it("re-fetches with the app's builder", async () => {
    const service = setup(GroupMembersService);
    const first = request<CometChat.GroupMember>();
    const fresh = request<CometChat.GroupMember>();
    const { b } = builder(first.req, fresh.req);
    service.initialize(group('g1'), b);
    first.resolve([member('m1')]);
    await settle();

    reconnected$.next(true);
    fresh.resolve([member('m2')]);
    await settle();

    expect(b.build).toHaveBeenCalledTimes(2);
    expect(service.members().map((m) => m.getUid())).toEqual(['m2']);
  });

  it("does not show the old group's members after switching group mid-refresh", async () => {
    const service = setup(GroupMembersService);
    const first = request<CometChat.GroupMember>();
    const fresh = request<CometChat.GroupMember>();
    const other = request<CometChat.GroupMember>();
    const { b: builderA } = builder(first.req, fresh.req);
    const { b: builderB } = builder(other.req);
    service.initialize(group('a'), builderA);
    first.resolve([member('a1')]);
    await settle();

    reconnected$.next(true);
    service.initialize(group('b'), builderB);
    other.resolve([member('b1')]);
    await settle();
    fresh.resolve([member('a-stale')]);
    await settle();

    expect(service.members().map((m) => m.getUid())).toEqual(['b1']);
  });
});
