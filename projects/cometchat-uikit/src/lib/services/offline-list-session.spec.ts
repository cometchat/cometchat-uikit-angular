vi.mock('@cometchat/calls-sdk-javascript', () => ({ default: {} }));

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { UsersService } from './users.service';
import { GroupsService } from './groups.service';
import { GroupMembersService } from './group-members.service';
import { OfflineHub } from '../utils/offline/offline-hub';
import { OfflineListSession } from '../utils/offline/list-session';
import { States } from '../Enums/Enums';
import { installOfflineSdk, OfflineSdkFake } from '../testing/offline-sdk-fake';
import { twoPhaseRequest } from '../testing/two-phase-request-fake';

const flush = () => new Promise<void>(resolve => setTimeout(resolve, 0));
const user = (uid: string): any => ({ getUid: () => uid });
const group = (guid: string): any => ({ getGuid: () => guid });
const member = (uid: string): any => ({ getUid: () => uid });

describe('OfflineListSession', () => {
  it('keeps the reload for the cache reset that follows the end of the session, once', async () => {
    const s = new OfflineListSession();
    s.markRan();
    s.end();
    expect(s.ranOffline).toBe(false);
    expect(s.takeReload()).toBe(true);
    expect(s.takeReload()).toBe(false);
  });

  it('forgets the reload once the hub call has finished (a plain logout never reloads)', async () => {
    const s = new OfflineListSession();
    s.markRan();
    s.end();
    await Promise.resolve();
    expect(s.takeReload()).toBe(false);
  });

  it('a list that never ran offline neither clears nor reloads', () => {
    const s = new OfflineListSession();
    s.end();
    expect(s.takeReload()).toBe(false);
  });

  it('marks reads of the ended session stale', () => {
    const s = new OfflineListSession();
    const epoch = s.epoch;
    s.end();
    expect(s.isStale(epoch)).toBe(true);
  });
});

/** UIK-LIFE-01/02: lists that ran the offline path clear on logout / user switch and reload on a cache reset. */
describe('snapshot lists: session lifecycle', () => {
  let fake: OfflineSdkFake;
  let hub: OfflineHub;

  beforeEach(() => {
    OfflineHub.resetForTests();
    fake = installOfflineSdk();
    hub = OfflineHub.getInstance();
    hub.start();
    hub.onLogin(user('alice'));
  });
  afterEach(() => {
    fake.restore();
    OfflineHub.resetForTests();
    vi.restoreAllMocks();
  });

  const switchUser = () => hub.onLogin(user('bob'));
  const resetCache = () => fake.fire('cacheReset', 'onOfflineCacheReset', 'CORRUPT', 0);

  describe('users', () => {
    function open(calls: Parameters<typeof twoPhaseRequest>[1]) {
      TestBed.configureTestingModule({ providers: [UsersService] });
      const service = TestBed.inject(UsersService);
      const request = twoPhaseRequest('Users', calls);
      service.initialize({ usersRequestBuilder: { build: () => request } as any });
      return { service, request };
    }

    it('clears on a user switch', async () => {
      const { service } = open([{ cached: [user('a')], server: [user('a')] }]);
      await service.fetchNext();
      expect(service.users()).toHaveLength(1);
      switchUser();
      expect(service.users()).toEqual([]);
      expect(service.fetchState()).toBe(States.loading);
    });

    it('drops a read that was in flight when the session ended', async () => {
      TestBed.configureTestingModule({ providers: [UsersService] });
      const service = TestBed.inject(UsersService);
      let release!: () => void;
      const gate = new Promise<void>(resolve => {
        release = resolve;
      });
      const request = {
        fetchNext: vi.fn(async (listener: any) => {
          await gate;
          listener.onServerUsers([user('old')]);
          return [];
        }),
      };
      service.initialize({ usersRequestBuilder: { build: () => request } as any });
      const pending = service.fetchNext();
      switchUser();
      release();
      await pending;
      expect(service.users()).toEqual([]);
    });

    it('reloads two-phase on a cache reset', async () => {
      const { service, request } = open([
        { server: [user('a')] },
        { cached: [user('b')], server: [user('b'), user('c')] },
      ]);
      await service.fetchNext();
      resetCache();
      await flush();
      expect(request.fetchNext).toHaveBeenCalledTimes(2);
      expect(service.users().map(u => u.getUid())).toEqual(['b', 'c']);
    });

    it('does not reload on a plain user switch', async () => {
      const { service, request } = open([{ server: [user('a')] }]);
      await service.fetchNext();
      switchUser();
      await flush();
      expect(request.fetchNext).toHaveBeenCalledTimes(1);
    });

    it('offline off: untouched by session events (P1)', async () => {
      fake.setEnabled(false);
      TestBed.configureTestingModule({ providers: [UsersService] });
      const service = TestBed.inject(UsersService);
      const request = { fetchNext: vi.fn().mockResolvedValue([user('a')]) };
      service.initialize({ usersRequestBuilder: { build: () => request } as any });
      await service.fetchNext();
      switchUser();
      resetCache();
      await flush();
      expect(service.users()).toHaveLength(1);
      expect(request.fetchNext).toHaveBeenCalledTimes(1);
    });
  });

  describe('groups', () => {
    it('clears on a user switch and reloads on a cache reset', async () => {
      TestBed.configureTestingModule({ providers: [GroupsService] });
      const service = TestBed.inject(GroupsService);
      vi.spyOn(CometChat, 'getLoggedinUser').mockResolvedValue(user('alice'));
      // One scripted read each: the first open, the read after re-initialising, the reload after the reset.
      const request = twoPhaseRequest('Groups', [
        { server: [group('g1')] },
        { cached: [group('g2')], server: [group('g2')] },
        { cached: [group('g2')], server: [group('g2')] },
      ]);
      service.initialize({ groupsRequestBuilder: { build: () => request } as any });
      await service.fetchNext();
      switchUser();
      expect(service.groups()).toEqual([]);

      await service.fetchNext(); // no request until the host re-initialises
      expect(request.fetchNext).toHaveBeenCalledTimes(1);

      service.initialize({ groupsRequestBuilder: { build: () => request } as any });
      await service.fetchNext();
      resetCache();
      await flush();
      expect(service.groups().map(g => g.getGuid())).toEqual(['g2']);
    });
  });

  describe('group members', () => {
    function open(calls: Parameters<typeof twoPhaseRequest>[1]) {
      TestBed.configureTestingModule({ providers: [GroupMembersService] });
      const service = TestBed.inject(GroupMembersService);
      const request = twoPhaseRequest('GroupMembers', calls);
      service.initialize(group('g1'), { build: () => request } as any);
      return { service, request };
    }

    it('clears on a user switch', async () => {
      const { service } = open([{ server: [member('m1')] }]);
      await flush();
      expect(service.members()).toHaveLength(1);
      switchUser();
      expect(service.members()).toEqual([]);
    });

    it('reloads from the rebuilt cache on a cache reset', async () => {
      const { service } = open([
        { server: [member('m1')] },
        { cached: [member('m1')], server: [member('m1'), member('m2')] },
      ]);
      await flush();
      resetCache();
      await flush();
      expect(service.members().map(m => m.getUid())).toEqual(['m1', 'm2']);
    });
  });
});
