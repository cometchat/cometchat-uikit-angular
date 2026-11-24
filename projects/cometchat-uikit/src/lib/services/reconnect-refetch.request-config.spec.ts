/** Users, groups, group members: the refetch on reconnect uses the list's own request config (app builder, search keyword). */
vi.mock('@cometchat/calls-sdk-javascript', () => ({ default: {} }));

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { UsersService } from './users.service';
import { GroupsService } from './groups.service';
import { GroupMembersService } from './group-members.service';
import { ConnectionStateService } from './connection-state.service';
import { setConnection } from '../testing/connection-driver';

const item = (id: string): any => ({ getUid: () => id, getGuid: () => id });

/** A fluent builder whose requests are named, so a spec sees which one the refetch read. */
function appBuilder(name: string, rows: any[]) {
  const searched: string[] = [];
  const builder: any = {
    searched,
    setSearchKeyword: (k: string) => {
      searched.push(k);
      return builder;
    },
    build: () => ({ name, fetchNext: vi.fn().mockResolvedValue(rows) }),
  };
  return builder;
}

function reconnect(): void {
  const connection = TestBed.inject(ConnectionStateService) as any;
  for (const value of [true, false, true]) {
    setConnection(connection, value);
    TestBed.tick();
  }
}

describe('reconnect refetch keeps the list request config', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [UsersService, GroupsService, GroupMembersService],
    });
  });
  afterEach(() => {
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  it('users: the app builder and search keyword are used, not a default request', async () => {
    const service = TestBed.inject(UsersService);
    const builder = appBuilder('app', [item('sam')]);
    service.initialize({ usersRequestBuilder: builder, searchText: 'sa' });
    (service as any).initialFetchDone = true;
    reconnect();
    await vi.waitFor(() => expect(service.users().length).toBe(1));
    expect(builder.searched.filter((k: string) => k === 'sa').length).toBeGreaterThanOrEqual(2);
    expect((service as any).usersRequest.name).toBe('app');
  });

  it('groups: the app builder and search keyword are used, not a default request', async () => {
    const service = TestBed.inject(GroupsService);
    const builder = appBuilder('app', [item('g1')]);
    service.initialize({ groupsRequestBuilder: builder, searchText: 'ga' } as any);
    (service as any).initialFetchDone = true;
    reconnect();
    await vi.waitFor(() => expect(service.groups().length).toBe(1));
    expect(builder.searched.filter((k: string) => k === 'ga').length).toBeGreaterThanOrEqual(2);
    expect((service as any).groupsRequest.name).toBe('app');
  });

  it('group members: the integrator builder is used for the refetch', async () => {
    const service = TestBed.inject(GroupMembersService);
    const builder = appBuilder('app', [item('m1')]);
    (service as any).currentGroup = { getGuid: () => 'g1' };
    (service as any).lastBuild = { builder };
    (service as any).initialFetchDone = true;
    reconnect();
    await vi.waitFor(() => expect(service.members().length).toBe(1));
    expect((service as any).groupMembersRequest.name).toBe('app');
  });

  it('group members: the search keyword and search builder are used for the refetch', async () => {
    const service = TestBed.inject(GroupMembersService);
    const searchBuilder = appBuilder('search', [item('m2')]);
    (service as any).currentGroup = { getGuid: () => 'g1' };
    (service as any).lastBuild = { keyword: 'mo', searchBuilder };
    (service as any).initialFetchDone = true;
    reconnect();
    await vi.waitFor(() => expect(service.members().length).toBe(1));
    expect(searchBuilder.searched).toEqual(['mo']);
    expect((service as any).groupMembersRequest.name).toBe('search');
  });
});
