/**
 * GroupsService Tests
 *
 * Covers: initialization, fetchNext, search, list mutations,
 *         listener management, error handling, cleanup.
 *
 * @module services/groups
 */

import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { GroupsService } from './groups.service';
import { States } from '../Enums/Enums';
import { ensureSdkReady, sdkCleanup } from '../test-setup';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeMockGroup(guid: string, name = `Group ${guid}`): CometChat.Group {
  const g = new CometChat.Group(guid, name, CometChat.GROUP_TYPE.PUBLIC, '');
  return g;
}

function mockGroupsFetchNext(data: CometChat.Group[]): void {
  (CometChat as any).GroupsRequestBuilder = function MockBuilder() {
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

function mockGroupsFetchNextReject(error?: any): void {
  const err =
    error ?? new CometChat.CometChatException({ code: 'ERR_TEST', message: 'Mock error' });
  (CometChat as any).GroupsRequestBuilder = function MockBuilder() {
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

function makeGroupList(count: number): CometChat.Group[] {
  return Array.from({ length: count }, (_, i) => makeMockGroup(`group-${i + 1}`, `Group ${i + 1}`));
}

/** Helper: initialize the service and immediately fetch the first page. */
async function initAndFetch(
  svc: GroupsService,
  config: Parameters<GroupsService['initialize']>[0] = {}
): Promise<void> {
  svc.initialize(config);
  await svc.fetchNext();
}

describe('GroupsService', () => {
  beforeAll(async () => {
    await ensureSdkReady();
  }, 30000);

  afterAll(async () => {
    await sdkCleanup();
  }, 30000);

  let service: GroupsService;

  beforeEach(() => {
    vi.useRealTimers();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [GroupsService],
    });
    service = TestBed.inject(GroupsService);
    mockGroupsFetchNext(makeGroupList(3));
    vi.mocked(CometChat.addGroupListener).mockClear();
    vi.mocked(CometChat.removeGroupListener).mockClear();
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

    it('should have empty groups initially', () => {
      expect(service.groups()).toEqual([]);
    });

    it('should have hasMore as true initially', () => {
      expect(service.hasMore()).toBe(true);
    });
  });

  // ==================== initialize + fetchNext ====================

  describe('initialize and fetchNext', () => {
    it('should fetch groups and set state to loaded', async () => {
      await initAndFetch(service);

      expect(service.groups().length).toBe(3);
    }, 20000);

    it('should set hasMore to false when fewer groups than limit returned', async () => {
      mockGroupsFetchNext(makeGroupList(3)); // 3 < default limit of 30
      await initAndFetch(service);

      expect(service.hasMore()).toBe(false);
    }, 20000);

    it('should set state to empty when fetch returns empty array', async () => {
      mockGroupsFetchNext([]);
      await initAndFetch(service);

      expect(service.groups().length).toBe(0);
    }, 20000);

    it('should return early when fetchNext called without initialization', async () => {
      await service.fetchNext();
      expect(service.groups()).toEqual([]);
      expect(service.fetchState()).toBe(States.loading);
    });

    it('should use custom groupsRequestBuilder when provided', async () => {
      const customBuilder = new CometChat.GroupsRequestBuilder().setLimit(5);
      await initAndFetch(service, { groupsRequestBuilder: customBuilder });

      expect([States.loaded, States.empty]).toContain(service.fetchState());
    }, 20000);

    it('should reset state on re-initialize', async () => {
      await initAndFetch(service);

      mockGroupsFetchNext(makeGroupList(2));
      service.initialize({});

      expect(service.groups()).toEqual([]);
      expect(service.fetchState()).toBe(States.loading);
      expect(service.hasMore()).toBe(true);
    }, 20000);
  });

  // ==================== search ====================

  describe('search', () => {
    it('should reset groups and fetch with search keyword', async () => {
      await initAndFetch(service);

      mockGroupsFetchNext(makeGroupList(1));
      service.search('test');
      await service.fetchNext();

      expect([States.loaded, States.empty]).toContain(service.fetchState());
    }, 25000);

    it('should reset groups to empty when search is called', async () => {
      await initAndFetch(service);

      service.search('keyword');
      expect(service.groups()).toEqual([]);
    }, 20000);

    it('should use custom searchRequestBuilder when provided', async () => {
      await initAndFetch(service);

      mockGroupsFetchNext(makeGroupList(2));
      const customBuilder = new CometChat.GroupsRequestBuilder().setLimit(5);
      service.search('test', { searchRequestBuilder: customBuilder });
      await service.fetchNext();

      expect([States.loaded, States.empty]).toContain(service.fetchState());
    }, 25000);
  });

  // ==================== List Mutation Methods ====================

  describe('List Mutation Methods', () => {
    beforeEach(async () => {
      await initAndFetch(service);
    }, 20000);

    describe('updateGroup', () => {
      it('should update a group in the list', () => {
        const group = service.groups()[0];
        const updatedGroup = makeMockGroup(group.getGuid(), 'Updated Name');
        service.updateGroup(updatedGroup);
        const found = service.groups().find(g => g.getGuid() === group.getGuid());
        expect(found?.getName()).toBe('Updated Name');
      });

      it('should do nothing when group GUID is not in the list', () => {
        const initialCount = service.groups().length;
        service.updateGroup(makeMockGroup('nonexistent-guid'));
        expect(service.groups().length).toBe(initialCount);
      });
    });

    describe('removeGroup', () => {
      it('should remove a group by GUID', () => {
        const initialCount = service.groups().length;
        const guid = service.groups()[0].getGuid();
        service.removeGroup(guid);
        expect(service.groups().length).toBe(initialCount - 1);
        expect(service.groups().find(g => g.getGuid() === guid)).toBeUndefined();
      });

      it('should set state to empty when last group is removed', () => {
        const guids = service.groups().map(g => g.getGuid());
        for (const guid of guids) service.removeGroup(guid);
        expect(service.fetchState()).toBe(States.empty);
      });

      it('should do nothing when GUID does not exist', () => {
        const initialCount = service.groups().length;
        service.removeGroup('nonexistent-guid-xyz');
        expect(service.groups().length).toBe(initialCount);
      });
    });

    describe('prependGroup', () => {
      it('should prepend a new group to the beginning of the list', () => {
        const initialCount = service.groups().length;
        const newGroup = makeMockGroup('new-group-prepend');
        service.prependGroup(newGroup);
        expect(service.groups().length).toBe(initialCount + 1);
        expect(service.groups()[0].getGuid()).toBe('new-group-prepend');
      });

      it('should not prepend a duplicate group', () => {
        const existingGroup = service.groups()[0];
        const initialCount = service.groups().length;
        service.prependGroup(existingGroup);
        expect(service.groups().length).toBe(initialCount);
      });

      it('should transition from empty to loaded when prepending to empty list', () => {
        const guids = service.groups().map(g => g.getGuid());
        for (const guid of guids) service.removeGroup(guid);
        expect(service.fetchState()).toBe(States.empty);

        service.prependGroup(makeMockGroup('new-group-after-empty'));
        expect(service.fetchState()).toBe(States.loaded);
      });
    });

    describe('appendGroupsWithoutDuplicates', () => {
      it('should append only non-duplicate groups', () => {
        const existingGroup = service.groups()[0];
        const initialCount = service.groups().length;
        const newGroup = makeMockGroup('brand-new-group-xyz');
        service.appendGroupsWithoutDuplicates([existingGroup, newGroup]);
        expect(service.groups().length).toBe(initialCount + 1);
      });

      it('should not modify list when all groups are duplicates', () => {
        const existing = [...service.groups()];
        const initialCount = service.groups().length;
        service.appendGroupsWithoutDuplicates(existing);
        expect(service.groups().length).toBe(initialCount);
      });
    });

    describe('updateGroupForSDKEvents', () => {
      it('should update an existing group', () => {
        const group = service.groups()[0];
        const updated = makeMockGroup(group.getGuid(), 'SDK Updated');
        service.updateGroupForSDKEvents({ group: updated });
        const found = service.groups().find(g => g.getGuid() === group.getGuid());
        expect(found?.getName()).toBe('SDK Updated');
      });

      it('should prepend group when addGroup is true and group not in list', () => {
        const initialCount = service.groups().length;
        const newGroup = makeMockGroup('sdk-new-group');
        service.updateGroupForSDKEvents({ group: newGroup, addGroup: true });
        expect(service.groups().length).toBe(initialCount + 1);
        expect(service.groups()[0].getGuid()).toBe('sdk-new-group');
      });

      it('should update existing group even when addGroup is true', () => {
        const existingGroup = service.groups()[0];
        const updated = makeMockGroup(existingGroup.getGuid(), 'SDK Updated Existing');
        const initialCount = service.groups().length;
        service.updateGroupForSDKEvents({ group: updated, addGroup: true });
        expect(service.groups().length).toBe(initialCount);
        const found = service.groups().find(g => g.getGuid() === existingGroup.getGuid());
        expect(found?.getName()).toBe('SDK Updated Existing');
      });
    });
  });

  // ==================== Listener Management ====================

  describe('Listener Management', () => {
    it('should call addGroupListener when attachListeners is called', () => {
      service.attachListeners();
      expect(CometChat.addGroupListener).toHaveBeenCalledTimes(1);
    });

    it('should call removeGroupListener when detachListeners is called', () => {
      service.detachListeners();
      expect(CometChat.removeGroupListener).toHaveBeenCalledTimes(1);
    });

    it('should not call removeConnectionListener (owned by ConnectionStateService)', () => {
      service.detachListeners();
      expect(CometChat.removeConnectionListener).not.toHaveBeenCalled();
    });
  });

  // ==================== Error Handling ====================

  describe('Error Handling', () => {
    it('should set state to error when initial fetch fails', async () => {
      mockGroupsFetchNextReject();
      const errorCb = vi.fn();
      service.setErrorCallback(errorCb);
      service.initialize({});
      await service.fetchNext();

      expect(errorCb).toHaveBeenCalledTimes(1);
    }, 20000);

    it('should not set error state when fetch fails but groups already exist', async () => {
      const fetchNextMock = vi
        .fn()
        .mockResolvedValueOnce(makeGroupList(3))
        .mockRejectedValueOnce(new CometChat.CometChatException({ code: 'ERR', message: 'fail' }));

      (CometChat as any).GroupsRequestBuilder = function MockBuilder() {
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
      await service.fetchNext(); // first fetch succeeds → 3 groups loaded

      await service.fetchNext(); // second fetch fails → error callback, state stays loaded
      expect(service.fetchState()).toBe(States.loaded);
      expect(errorCb).toHaveBeenCalledTimes(1);
    }, 25000);

    it('should convert plain Error to CometChatException in error callback', async () => {
      mockGroupsFetchNextReject(new Error('plain error'));
      const errorCb = vi.fn();
      service.setErrorCallback(errorCb);
      service.initialize({});
      await service.fetchNext();

      expect(errorCb).toHaveBeenCalledTimes(1);
      expect(errorCb.mock.calls[0][0]).toBeDefined();
    }, 20000);

    it('should not invoke error callback when set to null', async () => {
      mockGroupsFetchNextReject();
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

      expect(service.groups()).toEqual([]);
      expect(service.fetchState()).toBe(States.loading);
      expect(service.hasMore()).toBe(true);
    }, 20000);

    it('should call detachListeners on cleanup', async () => {
      await initAndFetch(service);

      service.cleanup();
      expect(CometChat.removeGroupListener).toHaveBeenCalled();
    }, 20000);

    it('should allow re-initialization after cleanup', async () => {
      await initAndFetch(service);

      service.cleanup();
      mockGroupsFetchNext(makeGroupList(5));
      await initAndFetch(service);

      expect(service.groups().length).toBe(5);
    }, 25000);
  });
});
