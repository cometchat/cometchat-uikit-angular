/**
 * D84: one error / empty / offline rule for every list, offline on. Users, groups, group members and
 * conversations. Nothing on screen: offline it is the offline state ("Connect to load ..."), in the error
 * state with one `onError`, and a keyword search is "Connect to search" with no `onError`; any other failure
 * is the error view and one `onError`. Rows on screen stay: offline reports nothing, an online failure of a
 * load the user or app started reports once, and a load the kit started stays quiet. The offline state loads
 * once by itself on reconnect.
 */
vi.mock('@cometchat/calls-sdk-javascript', () => ({ default: {} }));

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { installOfflineSdk, OfflineSdkFake } from '../testing/offline-sdk-fake';
import { NOT_CONNECTED, twoPhaseRequest } from '../testing/two-phase-request-fake';
import { OfflineHub } from '../utils/offline/offline-hub';
import { States } from '../Enums/Enums';
import { UsersService } from './users.service';
import { GroupsService } from './groups.service';
import { GroupMembersService } from './group-members.service';
import { ConversationsService } from './conversations.service';
import { ConnectionStateService } from './connection-state.service';
import { setConnection } from '../testing/connection-driver';

const SERVER_ERROR = { code: 'ERR_SERVER', message: 'boom' };
const user = (uid: string): any => ({ getUid: () => uid });
const group = (guid: string): any => ({ getGuid: () => guid });
const conv = (id: string): any => ({
  getConversationId: () => id,
  getConversationType: () => 'user',
  getConversationWith: () =>
    Object.assign(Object.create(CometChat.User.prototype), { getUid: () => id }),
  getLastMessage: () => undefined,
  isPinned: () => false,
  getUnreadMessageCount: () => 0,
});
const builderOf = (request: unknown): any => ({
  build: () => request,
  setSearchKeyword: () => ({ build: () => request }),
});

/** The connection drops and comes back, as the SDK reports it. */
function reconnect(): void {
  const connection = TestBed.inject(ConnectionStateService) as any;
  for (const value of [false, true]) {
    setConnection(connection, value);
    TestBed.tick();
  }
}

describe('D84 list errors and offline states (offline on)', () => {
  let fake: OfflineSdkFake;
  beforeEach(() => {
    OfflineHub.resetForTests();
    fake = installOfflineSdk();
    fake.connected = false;
    TestBed.configureTestingModule({
      providers: [UsersService, GroupsService, GroupMembersService],
    });
  });
  afterEach(() => {
    fake.restore();
    OfflineHub.resetForTests();
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  describe('users', () => {
    const setup = (calls: Parameters<typeof twoPhaseRequest>[1], searchText = '') => {
      const service = TestBed.inject(UsersService);
      const onError = vi.fn();
      service.setErrorCallback(onError);
      const request = twoPhaseRequest('Users', calls);
      service.initialize({ searchText, usersRequestBuilder: builderOf(request) });
      return { service, onError, request };
    };

    it('rule 3: nothing on screen and not connected is the offline state ("Connect to load users"), the error state and one onError', async () => {
      const { service, onError } = setup([{ error: NOT_CONNECTED }]);
      await service.fetchNext();
      expect(service.fetchState()).toBe(States.error);
      expect(service.connectToLoad()).toBe(true);
      expect(service.connectToSearch()).toBe(false);
      expect(service.users()).toEqual([]);
      expect(onError).toHaveBeenCalledTimes(1);
    });

    it('rule 4: a real error with nothing on screen is the error view with Retry (not the offline state) and one onError', async () => {
      const { service, onError } = setup([{ error: SERVER_ERROR }]);
      await service.fetchNext();
      expect(service.fetchState()).toBe(States.error);
      expect(service.connectToLoad()).toBe(false);
      expect(onError).toHaveBeenCalledTimes(1);
    });

    it('rule 2: offline with cached rows on screen, the rows stay, no error view and no onError', async () => {
      const { service, onError } = setup([{ cached: [user('sam')], error: NOT_CONNECTED }]);
      await service.fetchNext();
      expect(service.fetchState()).toBe(States.loaded);
      expect(service.connectToLoad()).toBe(false);
      expect(service.users().map((u: any) => u.getUid())).toEqual(['sam']);
      expect(onError).not.toHaveBeenCalled();
    });

    it('rule 5: an online error over cached rows keeps the rows and reports once', async () => {
      const { service, onError } = setup([{ cached: [user('sam')], error: SERVER_ERROR }]);
      await service.fetchNext();
      expect(service.fetchState()).toBe(States.loaded);
      expect(onError).toHaveBeenCalledTimes(1);
    });

    it('rule 2: a "load more" page that cannot be read offline reports nothing', async () => {
      const { service, onError } = setup([{ server: [user('sam')] }, { error: NOT_CONNECTED }]);
      await service.fetchNext();
      await service.fetchNext();
      expect(service.users().length).toBe(1);
      expect(service.fetchState()).toBe(States.loaded);
      expect(onError).not.toHaveBeenCalled();
    });

    it('rule 5: a reload the kit starts after a reconnect stays quiet over rows, offline or not', async () => {
      const { service, onError } = setup([
        { cached: [user('sam')], error: NOT_CONNECTED },
        { cached: [user('sam')], error: SERVER_ERROR },
      ]);
      await service.fetchNext();
      expect(onError).not.toHaveBeenCalled();
      fake.connected = true;
      reconnect();
      await vi.waitFor(() => expect(service.offlineSettled()).toBe(1));
      expect(service.users().length).toBe(1);
      expect(service.fetchState()).toBe(States.loaded);
      expect(onError).not.toHaveBeenCalled();
    });

    it("rule 8: the offline state loads once by itself on reconnect; a second reconnect is only today's silent refresh", async () => {
      const { service, request } = setup([
        { error: NOT_CONNECTED },
        { server: [user('sam')] },
        { server: [user('sam')] },
      ]);
      await service.fetchNext();
      fake.connected = true;
      reconnect();
      await vi.waitFor(() => expect(service.users().length).toBe(1));
      expect(service.fetchState()).toBe(States.loaded);
      expect(request.fetchNext).toHaveBeenCalledTimes(2);
      reconnect();
      await Promise.resolve();
      // The list is loaded now: a reconnect refreshes it as before (no listener, no error view).
      expect(request.fetchNext.mock.calls.slice(2).every(call => call.length === 0)).toBe(true);
      expect(service.fetchState()).toBe(States.loaded);
    });

    it('rule 3: when that reload fails offline again with nothing shown, the offline state stays and onError is not repeated', async () => {
      const { service, onError, request } = setup([{ error: NOT_CONNECTED }, { error: NOT_CONNECTED }]);
      await service.fetchNext();
      reconnect();
      await vi.waitFor(() => expect(request.fetchNext).toHaveBeenCalledTimes(2));
      await vi.waitFor(() => expect(service.offlineSettled()).toBe(1));
      expect(service.fetchState()).toBe(States.error);
      expect(service.connectToLoad()).toBe(true);
      expect(onError).toHaveBeenCalledTimes(1);
    });

    it('rule 4: when that reload fails with a real error it is the error view with Retry and onError', async () => {
      const { service, onError } = setup([{ error: NOT_CONNECTED }, { error: SERVER_ERROR }]);
      await service.fetchNext();
      reconnect();
      await vi.waitFor(() => expect(onError).toHaveBeenCalledTimes(2));
      expect(service.fetchState()).toBe(States.error);
      expect(service.connectToLoad()).toBe(false);
    });

    it('rule 8: a non-network error is not reloaded on reconnect', async () => {
      const { service, request } = setup([{ error: SERVER_ERROR }, { server: [user('sam')] }]);
      await service.fetchNext();
      fake.connected = true;
      reconnect();
      await Promise.resolve();
      expect(request.fetchNext).toHaveBeenCalledTimes(1);
      expect(service.fetchState()).toBe(States.error);
    });

    it('rule 5: an empty server page is the empty view, not an error', async () => {
      const { service, onError } = setup([{ server: [] }]);
      await service.fetchNext();
      expect(service.fetchState()).toBe(States.empty);
      expect(onError).not.toHaveBeenCalled();
    });

    it('rule 7: an offline keyword search with no saved match is "Connect to search", an empty state with no onError, and re-runs once on reconnect', async () => {
      const { service, onError, request } = setup(
        [{ cached: [], error: NOT_CONNECTED }, { server: [user('sam')] }],
        'sa'
      );
      await service.fetchNext();
      expect(service.fetchState()).toBe(States.empty);
      expect(service.connectToSearch()).toBe(true);
      expect(service.connectToLoad()).toBe(false);
      expect(onError).not.toHaveBeenCalled();
      fake.connected = true;
      reconnect();
      await vi.waitFor(() => expect(service.users().length).toBe(1));
      expect(request.fetchNext).toHaveBeenCalledTimes(2);
      expect(service.connectToSearch()).toBe(false);
    });

    it('addition B: a list opened with only a filter (no keyword) offline with nothing saved is "Connect to load users", not "Connect to search"', async () => {
      const { service, onError } = setup([{ error: NOT_CONNECTED }]);
      await service.fetchNext();
      expect(service.connectToLoad()).toBe(true);
      expect(service.connectToSearch()).toBe(false);
      expect(service.fetchState()).toBe(States.error);
      expect(onError).toHaveBeenCalledTimes(1);
    });

    it('addition B: a builder that carries a keyword is a keyword search: "Connect to search", no onError', async () => {
      const service = TestBed.inject(UsersService);
      const onError = vi.fn();
      service.setErrorCallback(onError);
      const request: any = twoPhaseRequest('Users', [{ error: NOT_CONNECTED }]);
      request.getSearchKeyword = () => 'sam';
      service.initialize({ usersRequestBuilder: builderOf(request) });
      await service.fetchNext();
      expect(service.connectToSearch()).toBe(true);
      expect(service.connectToLoad()).toBe(false);
      expect(service.fetchState()).toBe(States.empty);
      expect(onError).not.toHaveBeenCalled();
    });

    it('addition B: the list\'s own searchKeyword input is a keyword search too', async () => {
      const service = TestBed.inject(UsersService);
      const onError = vi.fn();
      service.setErrorCallback(onError);
      const request = twoPhaseRequest('Users', [{ error: NOT_CONNECTED }]);
      service.initialize({ searchText: 'sam', usersSearchText: 'sam', usersRequestBuilder: builderOf(request) });
      await service.fetchNext();
      expect(service.connectToSearch()).toBe(true);
      expect(onError).not.toHaveBeenCalled();
    });

    it('rule 5: a user-started page that fails online reports once; a "load more" page offline reports nothing', async () => {
      const { service, onError } = setup([{ server: [user('sam')] }, { error: SERVER_ERROR }]);
      await service.fetchNext();
      await service.fetchNext();
      expect(service.users().length).toBe(1);
      expect(onError).toHaveBeenCalledTimes(1);
    });

    it("offline off: an error stays today's error and a reconnect does not reload it", async () => {
      fake.setEnabled(false);
      const service = TestBed.inject(UsersService);
      const request = { fetchNext: vi.fn().mockRejectedValue(NOT_CONNECTED) };
      const onError = vi.fn();
      service.setErrorCallback(onError);
      service.initialize({ usersRequestBuilder: builderOf(request) });
      await service.fetchNext();
      expect(service.fetchState()).toBe(States.error);
      expect(onError).toHaveBeenCalledTimes(1);
      reconnect();
      expect(request.fetchNext).toHaveBeenCalledTimes(1);
      expect(service.offlineSettled()).toBe(0);
    });
  });

  describe('groups', () => {
    const setup = (calls: Parameters<typeof twoPhaseRequest>[1], searchText = '') => {
      const service = TestBed.inject(GroupsService);
      vi.spyOn(CometChat, 'getLoggedinUser').mockResolvedValue(user('alex'));
      const onError = vi.fn();
      service.setErrorCallback(onError);
      const request = twoPhaseRequest('Groups', calls);
      service.initialize({ searchText, groupsRequestBuilder: builderOf(request) });
      return { service, onError, request };
    };

    it('rule 3: nothing on screen and not connected is "Connect to load groups", the error state and one onError', async () => {
      const { service, onError } = setup([{ error: NOT_CONNECTED }]);
      await service.fetchNext();
      expect(service.fetchState()).toBe(States.error);
      expect(service.connectToLoad()).toBe(true);
      expect(service.connectToSearch()).toBe(false);
      expect(onError).toHaveBeenCalledTimes(1);
    });

    it('rule 4: a real error with nothing on screen is the error view with Retry and one onError', async () => {
      const { service, onError } = setup([{ error: SERVER_ERROR }]);
      await service.fetchNext();
      expect(service.fetchState()).toBe(States.error);
      expect(service.connectToLoad()).toBe(false);
      expect(onError).toHaveBeenCalledTimes(1);
    });

    it('rule 2: offline with cached rows on screen, the rows stay and nothing is reported', async () => {
      const { service, onError } = setup([{ cached: [group('g1')], error: NOT_CONNECTED }]);
      await service.fetchNext();
      expect(service.fetchState()).toBe(States.loaded);
      expect(service.groups().length).toBe(1);
      expect(onError).not.toHaveBeenCalled();
    });

    it('rule 5: an online error over cached rows keeps them and reports once', async () => {
      const { service, onError } = setup([{ cached: [group('g1')], error: SERVER_ERROR }]);
      await service.fetchNext();
      expect(service.groups().length).toBe(1);
      expect(onError).toHaveBeenCalledTimes(1);
    });

    it('rule 8: the offline state loads once by itself on reconnect; a non-network error does not', async () => {
      const { service, request } = setup([{ error: NOT_CONNECTED }, { server: [group('g1')] }]);
      await service.fetchNext();
      fake.connected = true;
      reconnect();
      await vi.waitFor(() => expect(service.groups().length).toBe(1));
      expect(request.fetchNext).toHaveBeenCalledTimes(2);
    });

    it('rule 4: a non-network error is not reloaded', async () => {
      const { service, request } = setup([{ error: SERVER_ERROR }, { server: [group('g1')] }]);
      await service.fetchNext();
      reconnect();
      await Promise.resolve();
      expect(request.fetchNext).toHaveBeenCalledTimes(1);
      expect(service.fetchState()).toBe(States.error);
    });

    it('rule 5: an empty server page is the empty view', async () => {
      const { service, onError } = setup([{ server: [] }]);
      await service.fetchNext();
      expect(service.fetchState()).toBe(States.empty);
      expect(onError).not.toHaveBeenCalled();
    });

    it('rule 7: an offline keyword search with no saved match is "Connect to search" with no onError and re-runs on reconnect', async () => {
      const { service, onError, request } = setup(
        [{ error: NOT_CONNECTED }, { server: [group('g1')] }],
        'cr'
      );
      await service.fetchNext();
      expect(service.fetchState()).toBe(States.empty);
      expect(service.connectToSearch()).toBe(true);
      expect(onError).not.toHaveBeenCalled();
      fake.connected = true;
      reconnect();
      await vi.waitFor(() => expect(service.groups().length).toBe(1));
      expect(request.fetchNext).toHaveBeenCalledTimes(2);
    });

    it('addition B: a filter-only list (no keyword) offline with nothing saved is "Connect to load groups"', async () => {
      const { service, onError } = setup([{ error: NOT_CONNECTED }]);
      await service.fetchNext();
      expect(service.connectToLoad()).toBe(true);
      expect(service.connectToSearch()).toBe(false);
      expect(onError).toHaveBeenCalledTimes(1);
    });

    it('addition B: a builder that carries a keyword is a keyword search', async () => {
      const service = TestBed.inject(GroupsService);
      vi.spyOn(CometChat, 'getLoggedinUser').mockResolvedValue(user('alex'));
      const onError = vi.fn();
      service.setErrorCallback(onError);
      const request: any = twoPhaseRequest('Groups', [{ error: NOT_CONNECTED }]);
      request.getSearchKeyword = () => 'crew';
      service.initialize({ groupsRequestBuilder: builderOf(request) });
      await service.fetchNext();
      expect(service.connectToSearch()).toBe(true);
      expect(service.connectToLoad()).toBe(false);
      expect(onError).not.toHaveBeenCalled();
    });
  });

  describe('group members', () => {
    const setup = (calls: Parameters<typeof twoPhaseRequest>[1]) => {
      const service = TestBed.inject(GroupMembersService);
      const onError = vi.fn();
      service.setErrorCallback(onError);
      const request = twoPhaseRequest('GroupMembers', calls);
      service.initialize({ getGuid: () => 'g' } as any, builderOf(request));
      return { service, onError, request };
    };

    it('rule 3: nothing on screen and not connected is "Connect to load members", the error state and one onError', async () => {
      const { service, onError } = setup([{ error: NOT_CONNECTED }]);
      await vi.waitFor(() => expect(service.fetchState()).toBe(States.error));
      expect(service.connectToLoad()).toBe(true);
      expect(service.connectToSearch()).toBe(false);
      expect(onError).toHaveBeenCalledTimes(1);
    });

    it('rule 2: offline with cached rows on screen, the rows stay and nothing is reported', async () => {
      const { service, onError } = setup([{ cached: [user('m1')], error: NOT_CONNECTED }]);
      await vi.waitFor(() => expect(service.fetchState()).toBe(States.loaded));
      await Promise.resolve();
      expect(service.members().length).toBe(1);
      expect(onError).not.toHaveBeenCalled();
    });

    it('rule 5: an online error over cached rows keeps them and reports once', async () => {
      const { service, onError } = setup([{ cached: [user('m1')], error: SERVER_ERROR }]);
      await vi.waitFor(() => expect(onError).toHaveBeenCalledTimes(1));
      expect(service.fetchState()).toBe(States.loaded);
      expect(service.members().length).toBe(1);
    });

    it('rule 7: a keyword search offline with no saved match is "Connect to search" with no onError and re-runs on reconnect', async () => {
      const { service, onError } = setup([{ error: NOT_CONNECTED }]);
      await vi.waitFor(() => expect(service.fetchState()).toBe(States.error));
      expect(service.connectToLoad()).toBe(true);
      const search = twoPhaseRequest('GroupMembers', [{ error: NOT_CONNECTED }, { server: [user('m1')] }]);
      service.search('m', builderOf(search));
      await vi.waitFor(() => expect(service.connectToSearch()).toBe(true));
      expect(service.connectToLoad()).toBe(false);
      expect(service.fetchState()).toBe(States.empty);
      expect(onError).toHaveBeenCalledTimes(1);
      fake.connected = true;
      reconnect();
      await vi.waitFor(() => expect(service.members().length).toBe(1));
      expect(search.fetchNext).toHaveBeenCalledTimes(2);
    });

    it('rule 8: the offline state loads once by itself on reconnect', async () => {
      const { service, request } = setup([{ error: NOT_CONNECTED }, { server: [user('m1')] }]);
      await vi.waitFor(() => expect(service.fetchState()).toBe(States.error));
      fake.connected = true;
      reconnect();
      await vi.waitFor(() => expect(service.members().length).toBe(1));
      expect(request.fetchNext).toHaveBeenCalledTimes(2);
    });

    it('rule 4: a non-network error is not reloaded', async () => {
      const { service, request } = setup([{ error: SERVER_ERROR }, { server: [user('m1')] }]);
      await vi.waitFor(() => expect(service.fetchState()).toBe(States.error));
      reconnect();
      await Promise.resolve();
      expect(request.fetchNext).toHaveBeenCalledTimes(1);
    });

    it('rule 5: an empty server page is the empty view', async () => {
      const { service, onError } = setup([{ server: [] }]);
      await vi.waitFor(() => expect(service.fetchState()).toBe(States.empty));
      expect(onError).not.toHaveBeenCalled();
    });
  });

  describe('conversations', () => {
    const setup = (calls: Parameters<typeof twoPhaseRequest>[1]) => {
      vi.spyOn(CometChat, 'getLoggedinUser').mockResolvedValue(user('alex'));
      const service = TestBed.inject(ConversationsService);
      const kept: unknown[] = [];
      service.keptRowsError$.subscribe(e => kept.push(e));
      const request = twoPhaseRequest('Conversations', calls);
      return { service, kept, request };
    };

    it('rule 3: nothing on screen and not connected is "Connect to load chats" in the error state', async () => {
      const { service, kept, request } = setup([{ error: NOT_CONNECTED }]);
      await service.fetchConversations(builderOf(request));
      expect(service.errorState()).not.toBeNull();
      expect(service.connectToLoad()).toBe(true);
      expect(service.connectToSearch()).toBe(false);
      expect(service.getConversations()).toEqual([]);
      expect(kept).toEqual([]);
    });

    it('rule 4: a real error with nothing on screen is the error view with Retry', async () => {
      const { service, request } = setup([{ error: SERVER_ERROR }]);
      await service.fetchConversations(builderOf(request));
      expect(service.errorState()).not.toBeNull();
      expect(service.connectToLoad()).toBe(false);
    });

    it('rule 2: offline with saved chats on screen, they stay, with no error view and nothing reported', async () => {
      const { service, kept, request } = setup([{ cached: [conv('a')], error: NOT_CONNECTED }]);
      await service.fetchConversations(builderOf(request));
      expect(service.errorState()).toBeNull();
      expect(service.getConversations().length).toBe(1);
      expect(kept).toEqual([]);
    });

    it('rule 5: an online error over saved chats keeps them and reports once; a load the kit starts (silent) stays quiet', async () => {
      const { service, kept, request } = setup([
        { cached: [conv('a')], error: SERVER_ERROR },
        { cached: [conv('a')], error: SERVER_ERROR },
      ]);
      await service.fetchConversations(builderOf(request));
      expect(service.errorState()).toBeNull();
      expect(kept.length).toBe(1);
      await service.fetchConversations(builderOf(request), true);
      expect(kept.length).toBe(1);
    });

    it('rule 7: a request that carries a keyword offline with nothing saved is "Connect to search": no error state, no report', async () => {
      const { service, kept, request } = setup([{ error: NOT_CONNECTED }, { server: [conv('a')] }]);
      (request as any).getSearchKeyword = () => 'al';
      await service.fetchConversations(builderOf(request));
      expect(service.connectToSearch()).toBe(true);
      expect(service.connectToLoad()).toBe(false);
      expect(service.errorState()).toBeNull();
      expect(kept).toEqual([]);
      fake.connected = true;
      reconnect();
      await vi.waitFor(() => expect(service.getConversations().length).toBe(1));
      expect(service.connectToSearch()).toBe(false);
    });

    it('addition B: a request with only a filter is the plain list: "Connect to load chats"', async () => {
      const { service, request } = setup([{ error: NOT_CONNECTED }]);
      (request as any).getSearchKeyword = () => '';
      await service.fetchConversations(builderOf(request));
      expect(service.connectToLoad()).toBe(true);
      expect(service.connectToSearch()).toBe(false);
    });

    it('rule 8: the offline state loads once by itself on reconnect, and a second reconnect does not read again', async () => {
      const { service, request } = setup([{ error: NOT_CONNECTED }, { server: [conv('a')] }]);
      await service.fetchConversations(builderOf(request));
      fake.connected = true;
      reconnect();
      await vi.waitFor(() => expect(service.getConversations().length).toBe(1));
      expect(service.errorState()).toBeNull();
      reconnect();
      await Promise.resolve();
      expect(request.fetchNext).toHaveBeenCalledTimes(2);
    });

    it('rule 4: a non-network error is not reloaded on reconnect', async () => {
      const { service, request } = setup([{ error: SERVER_ERROR }, { server: [conv('a')] }]);
      await service.fetchConversations(builderOf(request));
      reconnect();
      await Promise.resolve();
      expect(request.fetchNext).toHaveBeenCalledTimes(1);
      expect(service.errorState()).not.toBeNull();
    });

    it('rule 5: an empty server page is the empty view, not an error', async () => {
      const { service, kept, request } = setup([{ server: [] }]);
      await service.fetchConversations(builderOf(request));
      expect(service.errorState()).toBeNull();
      expect(service.getConversations()).toEqual([]);
      expect(kept).toEqual([]);
    });

    it('a load-more asked for while the error view shows does not clear it', async () => {
      const { service, request } = setup([{ error: NOT_CONNECTED }, { server: [conv('a')] }]);
      await service.fetchConversations(builderOf(request));
      await service.fetchNextConversations();
      expect(service.errorState()).not.toBeNull();
      expect(request.fetchNext).toHaveBeenCalledTimes(1);
    });
  });
  describe('offline off: exactly as before (rule 11)', () => {
    beforeEach(() => fake.setEnabled(false));

    it('users: a not-connected error is the plain error state with one onError; no offline state, even for a keyword', async () => {
      for (const keyword of ['', 'sam']) {
        const service = TestBed.inject(UsersService);
        const onError = vi.fn();
        service.setErrorCallback(onError);
        const request = { fetchNext: vi.fn().mockRejectedValue(NOT_CONNECTED) };
        service.initialize({ searchText: keyword, usersRequestBuilder: builderOf(request) });
        await service.fetchNext();
        expect(service.fetchState()).toBe(States.error);
        expect(service.connectToLoad()).toBe(false);
        expect(service.connectToSearch()).toBe(false);
        expect(onError).toHaveBeenCalledTimes(1);
        service.cleanup();
      }
    });

    it('groups and group members: the same plain error state', async () => {
      const groups = TestBed.inject(GroupsService);
      vi.spyOn(CometChat, 'getLoggedinUser').mockResolvedValue(user('alex'));
      const onGroupsError = vi.fn();
      groups.setErrorCallback(onGroupsError);
      groups.initialize({ searchText: 'cr', groupsRequestBuilder: builderOf({ fetchNext: vi.fn().mockRejectedValue(NOT_CONNECTED) }) });
      await groups.fetchNext();
      expect(groups.fetchState()).toBe(States.error);
      expect(groups.connectToLoad()).toBe(false);
      expect(groups.connectToSearch()).toBe(false);
      expect(onGroupsError).toHaveBeenCalledTimes(1);

      const members = TestBed.inject(GroupMembersService);
      const onMembersError = vi.fn();
      members.setErrorCallback(onMembersError);
      members.initialize({ getGuid: () => 'g' } as any, builderOf({ fetchNext: vi.fn().mockRejectedValue(NOT_CONNECTED) }));
      await vi.waitFor(() => expect(members.fetchState()).toBe(States.error));
      expect(members.connectToLoad()).toBe(false);
      expect(members.connectToSearch()).toBe(false);
      expect(onMembersError).toHaveBeenCalledTimes(1);
    });

    it('conversations: no offline state is ever raised', async () => {
      vi.spyOn(CometChat, 'getLoggedinUser').mockResolvedValue(user('alex'));
      const service = TestBed.inject(ConversationsService);
      const request: any = { fetchNext: vi.fn().mockRejectedValue(NOT_CONNECTED), getSearchKeyword: () => 'al' };
      await service.fetchConversations({ build: () => request } as any).catch(() => undefined);
      expect(service.connectToLoad()).toBe(false);
      expect(service.connectToSearch()).toBe(false);
    });
  });
});
