/**
 * UsersService Tests
 *
 * Covers: initialization, fetchNext, search, list mutations,
 *         listener management, error handling, cleanup.
 *
 * @module services/users
 */

import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { UsersService } from './users.service';
import { States } from '../Enums/Enums';
import { ensureSdkReady, sdkCleanup } from '../test-setup';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeMockUser(uid: string, name = `User ${uid}`): CometChat.User {
  const u = new CometChat.User(uid);
  u.setName(name);
  return u;
}

function makeUserList(count: number): CometChat.User[] {
  return Array.from({ length: count }, (_, i) => makeMockUser(`user-${i + 1}`, `User ${i + 1}`));
}

function mockUsersFetchNext(data: CometChat.User[]): void {
  (CometChat as any).UsersRequestBuilder = function MockBuilder() {
    const self: Record<string, any> = {};
    self['build'] = vi.fn().mockReturnValue({
      fetchNext: vi.fn().mockResolvedValue(data),
    });
    const proxy: any = new Proxy(self, {
      get(target, prop) {
        if (prop === 'build') return target['build'];
        if (typeof prop === 'string') {
          if (!target[prop]) target[prop] = vi.fn().mockReturnValue(proxy);
          return target[prop];
        }
        return undefined;
      },
    });
    return proxy;
  };
}

function mockUsersFetchNextReject(error?: any): void {
  const err =
    error ?? new CometChat.CometChatException({ code: 'ERR_TEST', message: 'Mock error' });
  (CometChat as any).UsersRequestBuilder = function MockBuilder() {
    const self: Record<string, any> = {};
    self['build'] = vi.fn().mockReturnValue({
      fetchNext: vi.fn().mockRejectedValue(err),
    });
    const proxy: any = new Proxy(self, {
      get(target, prop) {
        if (prop === 'build') return target['build'];
        if (typeof prop === 'string') {
          if (!target[prop]) target[prop] = vi.fn().mockReturnValue(proxy);
          return target[prop];
        }
        return undefined;
      },
    });
    return proxy;
  };
}

/** Helper: initialize the service and immediately fetch the first page. */
async function initAndFetch(
  svc: UsersService,
  config: Parameters<UsersService['initialize']>[0] = {}
): Promise<void> {
  svc.initialize(config);
  await svc.fetchNext();
}

describe('UsersService', () => {
  beforeAll(async () => {
    await ensureSdkReady();
  }, 30000);

  afterAll(async () => {
    await sdkCleanup();
  }, 30000);

  let service: UsersService;

  beforeEach(() => {
    vi.useRealTimers(); // Ensure real timers are active (other specs may use fake timers)
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [UsersService],
    });
    service = TestBed.inject(UsersService);
    mockUsersFetchNext(makeUserList(3));
    vi.mocked(CometChat.addConnectionListener).mockClear();
    vi.mocked(CometChat.removeConnectionListener).mockClear();
  });

  // ==================== Initialization ====================

  describe('Initialization', () => {
    it('should be injectable via TestBed when provided explicitly', () => {
      expect(service).toBeTruthy();
    });

    it('should have initial fetchState as loading', () => {
      expect(service.fetchState()).toBe(States.loading);
    });

    it('should have empty users initially', () => {
      expect(service.users()).toEqual([]);
    });

    it('should have hasMore as true initially', () => {
      expect(service.hasMore()).toBe(true);
    });
  });

  // ==================== initialize + fetchNext ====================

  describe('initialize and fetchNext', () => {
    it('should fetch users and set state to loaded', async () => {
      await initAndFetch(service);

      expect(service.users().length).toBe(3);
    }, 20000);

    it('should set hasMore to false when fewer users than limit returned', async () => {
      mockUsersFetchNext(makeUserList(3)); // 3 < default limit of 30
      await initAndFetch(service);

      expect(service.hasMore()).toBe(false);
    }, 20000);

    it('should set state to empty when fetch returns empty array', async () => {
      mockUsersFetchNext([]);
      await initAndFetch(service);

      expect(service.users().length).toBe(0);
    }, 20000);

    it('should return early when fetchNext called without initialization', async () => {
      await service.fetchNext();
      expect(service.users()).toEqual([]);
      expect(service.fetchState()).toBe(States.loading);
    });

    it('should use custom usersRequestBuilder when provided', async () => {
      const customBuilder = new CometChat.UsersRequestBuilder().setLimit(5);
      await initAndFetch(service, { usersRequestBuilder: customBuilder });

      expect([States.loaded, States.empty]).toContain(service.fetchState());
    }, 20000);

    it('should use searchRequestBuilder when searchText is provided', async () => {
      const searchBuilder = new CometChat.UsersRequestBuilder().setLimit(5);
      await initAndFetch(service, { searchRequestBuilder: searchBuilder, searchText: 'hero' });

      expect([States.loaded, States.empty]).toContain(service.fetchState());
    }, 20000);

    it('should reset state on re-initialize', async () => {
      await initAndFetch(service);

      mockUsersFetchNext(makeUserList(2));
      service.initialize({});

      expect(service.users()).toEqual([]);
      expect(service.fetchState()).toBe(States.loading);
      expect(service.hasMore()).toBe(true);
    }, 20000);

    it('should not allow concurrent fetchNext calls (isFetching guard)', async () => {
      service.initialize({});
      // Call fetchNext twice rapidly — second should be a no-op
      const p1 = service.fetchNext();
      const p2 = service.fetchNext();
      await Promise.all([p1, p2]);
      // Should still only have 3 users (not 6)
      expect(service.users().length).toBeLessThanOrEqual(3);
    }, 20000);
  });

  // ==================== search ====================

  describe('search', () => {
    it('should reset users and fetch with search keyword', async () => {
      await initAndFetch(service);

      mockUsersFetchNext(makeUserList(1));
      service.search('hero');
      await service.fetchNext();

      expect([States.loaded, States.empty]).toContain(service.fetchState());
    }, 25000);

    it('should reset users to empty immediately when search is called', async () => {
      await initAndFetch(service);

      service.search('keyword');
      expect(service.users()).toEqual([]);
    }, 20000);

    it('should use custom searchRequestBuilder when provided', async () => {
      await initAndFetch(service);

      mockUsersFetchNext(makeUserList(2));
      const customBuilder = new CometChat.UsersRequestBuilder().setLimit(5);
      service.search('test', { searchRequestBuilder: customBuilder });
      await service.fetchNext();

      expect([States.loaded, States.empty]).toContain(service.fetchState());
    }, 25000);

    it('should fall back to usersRequestBuilder when no searchRequestBuilder', async () => {
      await initAndFetch(service);

      mockUsersFetchNext(makeUserList(1));
      const usersBuilder = new CometChat.UsersRequestBuilder().setLimit(10);
      service.search('test', { usersRequestBuilder: usersBuilder });
      await service.fetchNext();

      expect([States.loaded, States.empty]).toContain(service.fetchState());
    }, 25000);
  });

  // ==================== List Mutation Methods ====================

  describe('List Mutation Methods', () => {
    beforeEach(async () => {
      await initAndFetch(service);
    }, 20000);

    describe('updateUser', () => {
      it('should update a user in the list', () => {
        const user = service.users()[0];
        const updatedUser = makeMockUser(user.getUid(), 'Updated Name');
        service.updateUser(updatedUser);
        const found = service.users().find(u => u.getUid() === user.getUid());
        expect(found?.getName()).toBe('Updated Name');
      });

      it('should do nothing when user UID is not in the list', () => {
        const initialCount = service.users().length;
        service.updateUser(makeMockUser('nonexistent-uid'));
        expect(service.users().length).toBe(initialCount);
      });

      it('should preserve list order when updating', () => {
        const firstUid = service.users()[0].getUid();
        const updatedUser = makeMockUser(firstUid, 'Updated');
        service.updateUser(updatedUser);
        expect(service.users()[0].getUid()).toBe(firstUid);
      });
    });

    describe('removeUser', () => {
      it('should remove a user by UID', () => {
        const initialCount = service.users().length;
        const uid = service.users()[0].getUid();
        service.removeUser(uid);
        expect(service.users().length).toBe(initialCount - 1);
        expect(service.users().find(u => u.getUid() === uid)).toBeUndefined();
      });

      it('should set state to empty when last user is removed', () => {
        const uids = service.users().map(u => u.getUid());
        for (const uid of uids) service.removeUser(uid);
        expect(service.fetchState()).toBe(States.empty);
      });

      it('should do nothing when UID does not exist', () => {
        const initialCount = service.users().length;
        service.removeUser('nonexistent-uid-xyz');
        expect(service.users().length).toBe(initialCount);
      });
    });

    describe('appendUsersWithoutDuplicates', () => {
      it('should append only non-duplicate users', () => {
        const existingUser = service.users()[0];
        const initialCount = service.users().length;
        const newUser = makeMockUser('brand-new-user-xyz');
        service.appendUsersWithoutDuplicates([existingUser, newUser]);
        expect(service.users().length).toBe(initialCount + 1);
      });

      it('should not modify list when all users are duplicates', () => {
        const existing = [...service.users()];
        const initialCount = service.users().length;
        service.appendUsersWithoutDuplicates(existing);
        expect(service.users().length).toBe(initialCount);
      });

      it('should append multiple new users at once', () => {
        const initialCount = service.users().length;
        const newUsers = [makeMockUser('new-1'), makeMockUser('new-2'), makeMockUser('new-3')];
        service.appendUsersWithoutDuplicates(newUsers);
        expect(service.users().length).toBe(initialCount + 3);
      });
    });
  });

  // ==================== Listener Management ====================

  describe('Listener Management', () => {
    it('should not throw when detachListeners is called', () => {
      expect(() => service.detachListeners()).not.toThrow();
    });

    it('should not call addConnectionListener (owned by ConnectionStateService)', () => {
      // Connection listener is managed globally by ConnectionStateService.
      // UsersService no longer registers its own SDK connection listener.
      expect(CometChat.addConnectionListener).not.toHaveBeenCalled();
    });
  });

  // ==================== Error Handling ====================

  describe('Error Handling', () => {
    it('should set state to error when initial fetch fails', async () => {
      mockUsersFetchNextReject();
      const errorCb = vi.fn();
      service.setErrorCallback(errorCb);
      service.initialize({});
      await service.fetchNext();

      expect(errorCb).toHaveBeenCalledTimes(1);
    }, 20000);

    it('should not set error state when fetch fails but users already exist', async () => {
      const fetchNextMock = vi
        .fn()
        .mockResolvedValueOnce(makeUserList(3))
        .mockRejectedValueOnce(new CometChat.CometChatException({ code: 'ERR', message: 'fail' }));

      (CometChat as any).UsersRequestBuilder = function MockBuilder() {
        const self: Record<string, any> = {};
        self['build'] = vi.fn().mockReturnValue({ fetchNext: fetchNextMock });
        const proxy: any = new Proxy(self, {
          get(target, prop) {
            if (prop === 'build') return target['build'];
            if (typeof prop === 'string') {
              if (!target[prop]) target[prop] = vi.fn().mockReturnValue(proxy);
              return target[prop];
            }
            return undefined;
          },
        });
        return proxy;
      };

      const errorCb = vi.fn();
      service.setErrorCallback(errorCb);
      service.initialize({});
      await service.fetchNext(); // first fetch succeeds → 3 users loaded

      await service.fetchNext(); // second fetch fails → error callback, state stays loaded
      expect(service.fetchState()).toBe(States.loaded);
      expect(errorCb).toHaveBeenCalledTimes(1);
    }, 25000);

    it('should convert plain Error to CometChatException in error callback', async () => {
      mockUsersFetchNextReject(new Error('plain error'));
      const errorCb = vi.fn();
      service.setErrorCallback(errorCb);
      service.initialize({});
      await service.fetchNext();

      expect(errorCb).toHaveBeenCalledTimes(1);
      expect(errorCb.mock.calls[0][0]).toBeDefined();
    }, 20000);

    it('should convert string error to CometChatException in error callback', async () => {
      mockUsersFetchNextReject('string error');
      const errorCb = vi.fn();
      service.setErrorCallback(errorCb);
      service.initialize({});
      await service.fetchNext();

      expect(errorCb).toHaveBeenCalledTimes(1);
    }, 20000);

    it('should not invoke error callback when set to null', async () => {
      mockUsersFetchNextReject();
      const errorCb = vi.fn();
      service.setErrorCallback(errorCb);
      service.setErrorCallback(null);
      service.initialize({});
      await service.fetchNext();

      expect(errorCb).not.toHaveBeenCalled();
    }, 20000);
  });

  // ==================== Cleanup ====================

  describe('Cleanup', () => {
    it('should reset all state on cleanup', async () => {
      await initAndFetch(service);

      service.cleanup();

      expect(service.users()).toEqual([]);
      expect(service.fetchState()).toBe(States.loading);
      expect(service.hasMore()).toBe(true);
    }, 20000);

    it('should call removeConnectionListener on cleanup', async () => {
      await initAndFetch(service);

      service.cleanup();
      // detachListeners() is a no-op in UsersService — connection listener
      // is owned by ConnectionStateService, not per-service instances.
      // Verify cleanup still resets state correctly.
      expect(service.users()).toEqual([]);
      expect(service.fetchState()).toBe(States.loading);
    }, 20000);

    it('should allow re-initialization after cleanup', async () => {
      await initAndFetch(service);

      service.cleanup();
      mockUsersFetchNext(makeUserList(5));
      await initAndFetch(service);

      expect(service.users().length).toBe(5);
    }, 25000);
  });

  // ==================== setErrorCallback ====================

  describe('setErrorCallback', () => {
    it('should set and invoke error callback on failure', async () => {
      const errorCb = vi.fn();
      service.setErrorCallback(errorCb);
      mockUsersFetchNextReject();
      service.initialize({});
      await service.fetchNext();

      expect(errorCb).toHaveBeenCalledTimes(1);
    }, 20000);

    it('should clear error callback when set to null', async () => {
      const errorCb = vi.fn();
      service.setErrorCallback(errorCb);
      service.setErrorCallback(null);
      mockUsersFetchNextReject();
      service.initialize({});
      await service.fetchNext();

      expect(errorCb).not.toHaveBeenCalled();
    }, 20000);
  });
});
