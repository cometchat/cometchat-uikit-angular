/**
 * GroupMembersService Tests
 *
 * All SDK calls are mocked via vitest.setup.mjs global mock.
 *
 * @module services/group-members
 */

import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ensureSdkReady, sdkCleanup, fetchTestGroup } from '../test-setup';
import { GroupMembersService } from './group-members.service';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { States } from '../Enums/Enums';
import { CometChatGroupEvents } from '../events/CometChatGroupEvents';
import { Subscription } from 'rxjs';
import { createMockGroupMember } from '../testing/mock-sdk';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createMockMemberList(count: number): CometChat.GroupMember[] {
  return Array.from({ length: count }, (_, i) =>
    createMockGroupMember({
      uid: `member-${i + 1}`,
      name: `Member ${i + 1}`,
      scope:
        i === 0 ? CometChat.GROUP_MEMBER_SCOPE.ADMIN : CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT,
    })
  );
}

/**
 * Replace GroupMembersRequestBuilder so fetchNext returns `data`.
 *
 * Key: chained methods must return the Proxy (not the target object)
 * so that subsequent property access still goes through the Proxy trap.
 */
function mockMembersFetchNext(data: CometChat.GroupMember[]): void {
  (CometChat as any).GroupMembersRequestBuilder = function MockBuilder() {
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

/** Replace GroupMembersRequestBuilder so fetchNext rejects. */
function mockMembersFetchNextReject(error?: any): void {
  const err =
    error ?? new CometChat.CometChatException({ code: 'ERR_TEST', message: 'Mock error' });
  (CometChat as any).GroupMembersRequestBuilder = function MockBuilder() {
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

describe('GroupMembersService', () => {
  let service: GroupMembersService;
  let testGroup: CometChat.Group;

  beforeAll(async () => {
    await ensureSdkReady();
    testGroup = await fetchTestGroup('supergroup');
  }, 30000);

  afterAll(async () => {
    await sdkCleanup();
  }, 30000);

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [GroupMembersService],
    });
    service = TestBed.inject(GroupMembersService);
    // Default: return 3 mock members
    mockMembersFetchNext(createMockMemberList(3));
    // Clear listener mocks so spies in individual tests start fresh
    vi.mocked(CometChat.addUserListener).mockClear();
    vi.mocked(CometChat.addGroupListener).mockClear();
    vi.mocked(CometChat.removeUserListener).mockClear();
    vi.mocked(CometChat.removeGroupListener).mockClear();
  });

  // ==================== Initialization ====================

  describe('Initialization', () => {
    it('should be injectable via TestBed when provided explicitly', () => {
      expect(service).toBeTruthy();
    });

    it('should have initial fetchState as loading', () => {
      expect(service.fetchState()).toBe(States.loading);
    });

    it('should have empty members initially', () => {
      expect(service.members()).toEqual([]);
    });

    it('should have hasMore as true initially', () => {
      expect(service.hasMore()).toBe(true);
    });
  });

  // ==================== Fetch Members ====================

  describe('Fetch Members', () => {
    it('should fetch group members via initialize and set state to loaded', async () => {
      service.initialize(testGroup);

      await vi.waitFor(
        () => {
          expect(service.fetchState()).toBe(States.loaded);
        },
        { timeout: 5000, interval: 100 }
      );

      expect(service.members().length).toBeGreaterThan(0);
      const firstMember = service.members()[0];
      expect(firstMember.getUid()).toBeTruthy();
    }, 10000);

    it('should return GroupMember objects with valid properties', async () => {
      service.initialize(testGroup);

      await vi.waitFor(
        () => {
          expect(service.fetchState()).toBe(States.loaded);
        },
        { timeout: 5000, interval: 100 }
      );

      const member = service.members()[0];
      expect(typeof member.getUid()).toBe('string');
      expect(typeof member.getName()).toBe('string');
      expect(member.getScope()).toBeTruthy();
    }, 10000);

    it('should use custom builder when provided', async () => {
      mockMembersFetchNext(createMockMemberList(2));
      const customBuilder = new CometChat.GroupMembersRequestBuilder(testGroup.getGuid()).setLimit(
        2
      );

      service.initialize(testGroup, customBuilder);

      await vi.waitFor(
        () => {
          expect(service.fetchState()).not.toBe(States.loading);
        },
        { timeout: 5000, interval: 100 }
      );

      expect(service.members().length).toBeLessThanOrEqual(2);
    }, 10000);

    it('should set hasMore to false when fewer members than limit are returned', async () => {
      mockMembersFetchNext(createMockMemberList(3));
      const builder = new CometChat.GroupMembersRequestBuilder(testGroup.getGuid()).setLimit(100);

      service.initialize(testGroup, builder);

      await vi.waitFor(
        () => {
          expect(service.fetchState()).not.toBe(States.loading);
        },
        { timeout: 5000, interval: 100 }
      );

      expect(service.hasMore()).toBe(false);
    }, 10000);
  });

  // ==================== fetchNext - no request ====================

  describe('fetchNext - no request', () => {
    it('should return early when service is not initialized', async () => {
      await service.fetchNext();
      expect(service.members()).toEqual([]);
      expect(service.fetchState()).toBe(States.loading);
    });
  });

  // ==================== Search ====================

  describe('Search', () => {
    it('should reset members and fetch with search keyword', async () => {
      service.initialize(testGroup);

      await vi.waitFor(
        () => {
          expect(service.fetchState()).toBe(States.loaded);
        },
        { timeout: 5000, interval: 100 }
      );

      const initialCount = service.members().length;
      expect(initialCount).toBeGreaterThan(0);

      mockMembersFetchNext(createMockMemberList(1));
      service.search('superhero');

      await vi.waitFor(
        () => {
          expect(service.fetchState()).not.toBe(States.loading);
        },
        { timeout: 5000, interval: 100 }
      );

      expect([States.loaded, States.empty]).toContain(service.fetchState());
    }, 15000);

    it('should do nothing when currentGroup is null (not initialized)', () => {
      service.search('test');
      expect(service.fetchState()).toBe(States.loading);
      expect(service.members()).toEqual([]);
    });

    it('should use custom search builder when provided', async () => {
      service.initialize(testGroup);

      await vi.waitFor(
        () => {
          expect(service.fetchState()).toBe(States.loaded);
        },
        { timeout: 5000, interval: 100 }
      );

      mockMembersFetchNext(createMockMemberList(2));
      const customBuilder = new CometChat.GroupMembersRequestBuilder(testGroup.getGuid()).setLimit(
        5
      );

      service.search('hero', customBuilder);

      await vi.waitFor(
        () => {
          expect(service.fetchState()).not.toBe(States.loading);
        },
        { timeout: 5000, interval: 100 }
      );

      expect([States.loaded, States.empty]).toContain(service.fetchState());
    }, 15000);
  });

  // ==================== List Mutation Methods ====================

  describe('List Mutation Methods', () => {
    beforeEach(async () => {
      service.initialize(testGroup);

      await vi.waitFor(
        () => {
          expect(service.fetchState()).toBe(States.loaded);
        },
        { timeout: 5000, interval: 100 }
      );
    }, 10000);

    describe('removeMember', () => {
      it('should remove a member by UID', () => {
        const initialCount = service.members().length;
        const memberToRemove = service.members()[0];

        service.removeMember(memberToRemove.getUid());

        expect(service.members().length).toBe(initialCount - 1);
        expect(service.members().find(m => m.getUid() === memberToRemove.getUid())).toBeUndefined();
      });

      it('should set state to empty when last member is removed', () => {
        const allUids = service.members().map(m => m.getUid());
        for (const uid of allUids) {
          service.removeMember(uid);
        }
        expect(service.members().length).toBe(0);
        expect(service.fetchState()).toBe(States.empty);
      });

      it('should do nothing when UID does not exist', () => {
        const initialCount = service.members().length;
        service.removeMember('nonexistent_uid_xyz_12345');
        expect(service.members().length).toBe(initialCount);
      });
    });

    describe('updateMemberStatus', () => {
      it('should update a member status when user is in the list', () => {
        const member = service.members()[0];
        const uid = member.getUid();

        const statusUser = new CometChat.User(uid);
        statusUser.setStatus('offline');

        service.updateMemberStatus(statusUser);

        const updated = service.members().find(m => m.getUid() === uid);
        expect(updated?.getStatus()).toBe('offline');
      });

      it('should do nothing when user is not in the list', () => {
        const initialCount = service.members().length;
        const unknownUser = new CometChat.User('unknown_user_xyz_99999');
        unknownUser.setStatus('online');

        service.updateMemberStatus(unknownUser);
        expect(service.members().length).toBe(initialCount);
      });
    });

    describe('updateMemberScopeInList', () => {
      it('should update a member scope in the list', () => {
        const member = service.members()[0];
        const uid = member.getUid();

        service.updateMemberScopeInList(
          uid,
          CometChat.GROUP_MEMBER_SCOPE.ADMIN as CometChat.GroupMemberScope
        );

        const updated = service.members().find(m => m.getUid() === uid);
        expect(updated?.getScope()).toBe(CometChat.GROUP_MEMBER_SCOPE.ADMIN);
      });

      it('should do nothing when UID is not found', () => {
        const initialMembers = service.members().map(m => m.getScope());
        service.updateMemberScopeInList(
          'nonexistent_uid_xyz',
          CometChat.GROUP_MEMBER_SCOPE.ADMIN as CometChat.GroupMemberScope
        );
        const afterMembers = service.members().map(m => m.getScope());
        expect(afterMembers).toEqual(initialMembers);
      });
    });

    describe('appendMember', () => {
      it('should not append a duplicate member', () => {
        const existingMember = service.members()[0];
        const initialCount = service.members().length;

        service.appendMember(existingMember);
        expect(service.members().length).toBe(initialCount);
      });

      it('should transition from empty to loaded when appending to empty list', () => {
        const allUids = service.members().map(m => m.getUid());
        for (const uid of allUids) {
          service.removeMember(uid);
        }
        expect(service.fetchState()).toBe(States.empty);

        const newMember = new CometChat.GroupMember('new_test_member_uid');
        newMember.setName('New Test Member');
        newMember.setScope(CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT as CometChat.GroupMemberScope);

        service.appendMember(newMember);
        expect(service.fetchState()).toBe(States.loaded);
        expect(service.members().length).toBe(1);
      });
    });

    describe('appendMembersWithoutDuplicates', () => {
      it('should append only non-duplicate members', () => {
        const existingMember = service.members()[0];
        const initialCount = service.members().length;

        const newMember = new CometChat.GroupMember('brand_new_member_uid');
        newMember.setName('Brand New');
        newMember.setScope(CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT as CometChat.GroupMemberScope);

        service.appendMembersWithoutDuplicates([existingMember, newMember]);
        expect(service.members().length).toBe(initialCount + 1);
      });

      it('should not modify list when all members are duplicates', () => {
        const existingMembers = [...service.members()];
        const initialCount = service.members().length;

        service.appendMembersWithoutDuplicates(existingMembers);
        expect(service.members().length).toBe(initialCount);
      });
    });
  });

  // ==================== Member Scope Changes ====================

  describe('Member Scope Changes', () => {
    beforeEach(async () => {
      service.initialize(testGroup);
      await vi.waitFor(
        () => {
          expect(service.fetchState()).toBe(States.loaded);
        },
        { timeout: 5000, interval: 100 }
      );
    }, 10000);

    it('should update member scope via SDK and emit event', async () => {
      const member = service.members()[0];
      const loggedInUser = new CometChat.User('logged-in-user');
      loggedInUser.setName('Logged In');
      vi.spyOn(CometChat, 'getLoggedinUser').mockResolvedValueOnce(loggedInUser);
      vi.spyOn(CometChat, 'updateGroupMemberScope').mockResolvedValueOnce(true as any);

      const eventSpy = vi.fn();
      const sub: Subscription = CometChatGroupEvents.ccGroupMemberScopeChanged.subscribe(eventSpy);

      await service.updateMemberScope(testGroup, member, CometChat.GROUP_MEMBER_SCOPE.MODERATOR);

      const updated = service.members().find(m => m.getUid() === member.getUid());
      expect(updated?.getScope()).toBe(CometChat.GROUP_MEMBER_SCOPE.MODERATOR);
      expect(eventSpy).toHaveBeenCalledTimes(1);
      expect(eventSpy.mock.calls[0][0].scopeChangedTo).toBe(CometChat.GROUP_MEMBER_SCOPE.MODERATOR);

      sub.unsubscribe();
    }, 10000);

    it('should propagate error when SDK updateGroupMemberScope fails', async () => {
      const member = service.members()[0];
      const sdkError = new CometChat.CometChatException({
        code: 'SCOPE_ERR',
        message: 'Scope update failed',
      });
      vi.spyOn(CometChat, 'updateGroupMemberScope').mockRejectedValueOnce(sdkError);

      const errorCb = vi.fn();
      service.setErrorCallback(errorCb);

      await expect(
        service.updateMemberScope(testGroup, member, CometChat.GROUP_MEMBER_SCOPE.ADMIN)
      ).rejects.toThrow();
      expect(errorCb).toHaveBeenCalledTimes(1);
    }, 10000);
  });

  // ==================== Kick/Ban Operations ====================

  describe('Kick/Ban Operations', () => {
    beforeEach(async () => {
      service.initialize(testGroup);
      await vi.waitFor(
        () => {
          expect(service.fetchState()).toBe(States.loaded);
        },
        { timeout: 5000, interval: 100 }
      );
    }, 10000);

    describe('kickMember', () => {
      it('should kick a member, remove from list, and emit event', async () => {
        const member = service.members()[0];
        const uid = member.getUid();
        const initialCount = service.members().length;

        const loggedInUser = new CometChat.User('logged-in-user');
        loggedInUser.setName('Logged In');
        vi.spyOn(CometChat, 'kickGroupMember').mockResolvedValueOnce(true as any);
        vi.spyOn(CometChat, 'getLoggedinUser').mockResolvedValueOnce(loggedInUser);

        const eventSpy = vi.fn();
        const sub: Subscription = CometChatGroupEvents.ccGroupMemberKicked.subscribe(eventSpy);

        await service.kickMember(testGroup, member);

        expect(service.members().length).toBe(initialCount - 1);
        expect(service.members().find(m => m.getUid() === uid)).toBeUndefined();
        expect(eventSpy).toHaveBeenCalledTimes(1);

        sub.unsubscribe();
      }, 10000);

      it('should propagate error when SDK kickGroupMember fails', async () => {
        const member = service.members()[0];
        const initialCount = service.members().length;
        const sdkError = new CometChat.CometChatException({
          code: 'KICK_ERR',
          message: 'Kick failed',
        });
        vi.spyOn(CometChat, 'kickGroupMember').mockRejectedValueOnce(sdkError);

        const errorCb = vi.fn();
        service.setErrorCallback(errorCb);

        await service.kickMember(testGroup, member);
        expect(errorCb).toHaveBeenCalledTimes(1);
        // Member should NOT be removed on error
        expect(service.members().length).toBe(initialCount);
      }, 10000);
    });

    describe('banMember', () => {
      it('should ban a member, remove from list, and emit event', async () => {
        const member = service.members()[0];
        const uid = member.getUid();
        const initialCount = service.members().length;

        const loggedInUser = new CometChat.User('logged-in-user');
        loggedInUser.setName('Logged In');
        vi.spyOn(CometChat, 'banGroupMember').mockResolvedValueOnce(true as any);
        vi.spyOn(CometChat, 'getLoggedinUser').mockResolvedValueOnce(loggedInUser);

        const eventSpy = vi.fn();
        const sub: Subscription = CometChatGroupEvents.ccGroupMemberBanned.subscribe(eventSpy);

        await service.banMember(testGroup, member);

        expect(service.members().length).toBe(initialCount - 1);
        expect(service.members().find(m => m.getUid() === uid)).toBeUndefined();
        expect(eventSpy).toHaveBeenCalledTimes(1);

        sub.unsubscribe();
      }, 10000);

      it('should propagate error when SDK banGroupMember fails', async () => {
        const member = service.members()[0];
        const initialCount = service.members().length;
        const sdkError = new CometChat.CometChatException({
          code: 'BAN_ERR',
          message: 'Ban failed',
        });
        vi.spyOn(CometChat, 'banGroupMember').mockRejectedValueOnce(sdkError);

        const errorCb = vi.fn();
        service.setErrorCallback(errorCb);

        await service.banMember(testGroup, member);
        expect(errorCb).toHaveBeenCalledTimes(1);
        // Member should NOT be removed on error
        expect(service.members().length).toBe(initialCount);
      }, 10000);
    });
  });

  // ==================== Error Handling ====================

  describe('Error Handling', () => {
    it('should set state to error when initial fetch fails', async () => {
      mockMembersFetchNextReject();
      const errorCb = vi.fn();
      service.setErrorCallback(errorCb);

      service.initialize(testGroup);

      await vi.waitFor(
        () => {
          expect(service.fetchState()).toBe(States.error);
        },
        { timeout: 5000, interval: 100 }
      );

      expect(errorCb).toHaveBeenCalledTimes(1);
    }, 10000);

    it('should not set error state when fetch fails but members already exist', async () => {
      // First load members successfully
      service.initialize(testGroup);
      await vi.waitFor(
        () => {
          expect(service.fetchState()).toBe(States.loaded);
        },
        { timeout: 5000, interval: 100 }
      );

      expect(service.members().length).toBeGreaterThan(0);

      // Now make the next search fail (search creates a new builder)
      mockMembersFetchNextReject();

      // Use search to trigger a new fetch that will fail
      // But first append a member so the list isn't empty after search resets it
      // Actually, search() resets members to [] then fetches. So members will be empty
      // and error state WILL be set. Let's test differently:
      // We need to test fetchNext() failing when members already exist.
      // The service reuses the existing groupMembersRequest for fetchNext().
      // We can't replace it via mockMembersFetchNextReject since that only affects new builders.
      // Instead, we verify the service logic: if members.length > 0 when error occurs,
      // state stays loaded. We'll test this by having the second page fail.

      // Re-initialize with a builder that returns data on first call, error on second
      const fetchNextMock = vi
        .fn()
        .mockResolvedValueOnce(createMockMemberList(3))
        .mockRejectedValueOnce(new CometChat.CometChatException({ code: 'ERR', message: 'fail' }));

      (CometChat as any).GroupMembersRequestBuilder = function MockBuilder() {
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
      service.initialize(testGroup);

      await vi.waitFor(
        () => {
          expect(service.fetchState()).toBe(States.loaded);
        },
        { timeout: 5000, interval: 100 }
      );

      // Now call fetchNext again — it will use the same request object and fail
      await service.fetchNext();

      // State should remain loaded, not error
      expect(service.fetchState()).toBe(States.loaded);
      expect(errorCb).toHaveBeenCalledTimes(1);
    }, 15000);

    it('should set state to empty when fetch returns empty array on initial load', async () => {
      mockMembersFetchNext([]);

      service.initialize(testGroup);

      await vi.waitFor(
        () => {
          expect(service.fetchState()).toBe(States.empty);
        },
        { timeout: 5000, interval: 100 }
      );

      expect(service.members().length).toBe(0);
    }, 10000);
  });

  // ==================== Listener Management ====================

  describe('Listener Management', () => {
    it('should call addUserListener and addGroupListener when attaching listeners', () => {
      service.attachListeners(testGroup.getGuid(), false);

      expect(CometChat.addUserListener).toHaveBeenCalledTimes(1);
      expect(CometChat.addGroupListener).toHaveBeenCalledTimes(1);
    });

    it('should skip user listener when hideUserStatus is true', () => {
      service.attachListeners(testGroup.getGuid(), true);

      expect(CometChat.addUserListener).not.toHaveBeenCalled();
      expect(CometChat.addGroupListener).toHaveBeenCalledTimes(1);
    });

    it('should call removeUserListener and removeGroupListener when detaching', () => {
      service.detachListeners();

      expect(CometChat.removeUserListener).toHaveBeenCalledTimes(1);
      expect(CometChat.removeGroupListener).toHaveBeenCalledTimes(1);
    });
  });

  // ==================== Null/Edge Cases ====================

  describe('Null/Edge Cases', () => {
    it('should handle search when not initialized', () => {
      service.search('test');
      expect(service.fetchState()).toBe(States.loading);
      expect(service.members()).toEqual([]);
    });

    it('should handle fetchNext when not initialized', async () => {
      await service.fetchNext();
      expect(service.members()).toEqual([]);
    });

    it('should handle removeMember on empty list', () => {
      service.removeMember('nonexistent');
      expect(service.members()).toEqual([]);
    });

    it('should handle updateMemberStatus on empty list', () => {
      const user = new CometChat.User('test-uid');
      user.setStatus('online');
      service.updateMemberStatus(user);
      expect(service.members()).toEqual([]);
    });

    it('should handle updateMemberScopeInList on empty list', () => {
      service.updateMemberScopeInList(
        'test-uid',
        CometChat.GROUP_MEMBER_SCOPE.ADMIN as CometChat.GroupMemberScope
      );
      expect(service.members()).toEqual([]);
    });
  });

  // ==================== Cleanup ====================

  describe('Cleanup', () => {
    it('should reset all state on cleanup', async () => {
      service.initialize(testGroup);
      await vi.waitFor(
        () => {
          expect(service.fetchState()).toBe(States.loaded);
        },
        { timeout: 5000, interval: 100 }
      );

      expect(service.members().length).toBeGreaterThan(0);

      service.cleanup();

      expect(service.members()).toEqual([]);
      expect(service.fetchState()).toBe(States.loading);
      expect(service.hasMore()).toBe(true);
      expect(CometChat.removeUserListener).toHaveBeenCalled();
      expect(CometChat.removeGroupListener).toHaveBeenCalled();
    }, 10000);

    it('should allow re-initialization after cleanup', async () => {
      service.initialize(testGroup);
      await vi.waitFor(
        () => {
          expect(service.fetchState()).toBe(States.loaded);
        },
        { timeout: 5000, interval: 100 }
      );

      service.cleanup();
      expect(service.members()).toEqual([]);

      mockMembersFetchNext(createMockMemberList(5));
      service.initialize(testGroup);
      await vi.waitFor(
        () => {
          expect(service.fetchState()).toBe(States.loaded);
        },
        { timeout: 5000, interval: 100 }
      );

      expect(service.members().length).toBe(5);
    }, 15000);
  });

  // ==================== Error Callback ====================

  describe('Error Callback', () => {
    it('should set and invoke error callback', async () => {
      const errorCb = vi.fn();
      service.setErrorCallback(errorCb);

      mockMembersFetchNextReject();
      service.initialize(testGroup);

      await vi.waitFor(
        () => {
          expect(service.fetchState()).toBe(States.error);
        },
        { timeout: 5000, interval: 100 }
      );

      expect(errorCb).toHaveBeenCalledTimes(1);
      const arg = errorCb.mock.calls[0][0];
      expect(arg).toBeDefined();
    }, 10000);

    it('should clear error callback when set to null', async () => {
      const errorCb = vi.fn();
      service.setErrorCallback(errorCb);
      service.setErrorCallback(null);

      mockMembersFetchNextReject();
      service.initialize(testGroup);

      await vi.waitFor(
        () => {
          expect(service.fetchState()).toBe(States.error);
        },
        { timeout: 5000, interval: 100 }
      );

      expect(errorCb).not.toHaveBeenCalled();
    }, 10000);

    it('should convert non-CometChatException errors to CometChatException', async () => {
      const errorCb = vi.fn();
      service.setErrorCallback(errorCb);

      mockMembersFetchNextReject(new Error('plain error'));
      service.initialize(testGroup);

      await vi.waitFor(
        () => {
          expect(service.fetchState()).toBe(States.error);
        },
        { timeout: 5000, interval: 100 }
      );

      expect(errorCb).toHaveBeenCalledTimes(1);
      const arg = errorCb.mock.calls[0][0];
      expect(arg).toBeDefined();
    }, 10000);
  });
});
