/**
 * ChatStateService Tests
 *
 * Categories: Initialization, Setters, Getters, Signal Reactivity,
 *             Observable State Propagation, Mutual Exclusivity,
 *             clearActiveChat, Edge Cases
 *
 * Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 13.6, 14.4, 14.5, 15.7
 *
 * Uses real CometChat SDK — NO vi.mock() for chat SDK packages.
 * The calls SDK mock below is required because @cometchat/calls-sdk-javascript
 * has a JitsiMeetJS runtime dependency that doesn't exist in jsdom.
 *
 * @module services/chat-state
 */

// ==================== Calls SDK Mock (JitsiMeetJS workaround) ====================
vi.mock('@cometchat/calls-sdk-javascript', () => ({
  CometChatCalls: {
    init: vi.fn().mockResolvedValue(true),
    generateToken: vi.fn().mockResolvedValue({ token: 'mock-token' }),
  },
}));

import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import {
  ensureSdkReady,
  sdkCleanup,
  fetchTestUser,
  fetchTestGroup,
  fetchTestConversation,
} from '../test-setup';
import { ChatStateService } from './chat-state.service';
import { CometChat } from '@cometchat/chat-sdk-javascript';

describe('ChatStateService', () => {
  let service: ChatStateService;
  let testUser: CometChat.User;
  let testUser2: CometChat.User;
  let testGroup: CometChat.Group;
  let testConversations: CometChat.Conversation[];

  beforeAll(async () => {
    await ensureSdkReady();
    testUser = await fetchTestUser('superhero1');
    testUser2 = await fetchTestUser('superhero2');
    testGroup = await fetchTestGroup('supergroup');
    testConversations = await fetchTestConversation();
  }, 30000);

  afterAll(async () => {
    await sdkCleanup();
  }, 30000);

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    service = TestBed.inject(ChatStateService);
    service.clearActiveChat();
  });

  // ==================== Initialization ====================

  describe('Initialization', () => {
    it('should be provided in root', () => {
      expect(service).toBeTruthy();
    });

    it('should have null initial values for all signals', () => {
      expect(service.activeUser()).toBeNull();
      expect(service.activeGroup()).toBeNull();
      expect(service.activeConversation()).toBeNull();
    });

    it('should have null initial values for all getters', () => {
      expect(service.getActiveUser()).toBeNull();
      expect(service.getActiveGroup()).toBeNull();
      expect(service.getActiveConversation()).toBeNull();
    });

    it('should return null from getActiveChatEntity initially', () => {
      expect(service.getActiveChatEntity()).toBeNull();
    });
  });

  // ==================== setActiveUser ====================

  describe('setActiveUser', () => {
    it('should update activeUser signal with a real SDK user', () => {
      service.setActiveUser(testUser);
      expect(service.activeUser()).toBe(testUser);
      expect(service.activeUser()!.getUid()).toBe('superhero1');
    });

    it('should clear activeUser when null is passed', () => {
      service.setActiveUser(testUser);
      service.setActiveUser(null);
      expect(service.activeUser()).toBeNull();
    });

    it('should update getActiveUser snapshot', () => {
      service.setActiveUser(testUser);
      expect(service.getActiveUser()).toBe(testUser);
    });

    it('should clear activeGroup when a user is set (mutual exclusivity)', () => {
      service.setActiveGroup(testGroup);
      expect(service.activeGroup()).toBe(testGroup);
      service.setActiveUser(testUser);
      expect(service.activeUser()).toBe(testUser);
      expect(service.activeGroup()).toBeNull();
    });

    it('should NOT clear activeGroup when user is set to null', () => {
      service.setActiveGroup(testGroup);
      service.setActiveUser(null);
      expect(service.activeGroup()).toBe(testGroup);
    });

    it('should handle undefined without throwing', () => {
      expect(() => service.setActiveUser(undefined as any)).not.toThrow();
    });

    it('should update getActiveChatEntity to return the user', () => {
      service.setActiveUser(testUser);
      const entity = service.getActiveChatEntity();
      expect(entity).toBe(testUser);
      expect(entity).toBeTruthy();
      expect(typeof (entity as any).getUid).toBe('function');
    });

    it('should replace previous user with a different real SDK user', () => {
      service.setActiveUser(testUser);
      expect(service.activeUser()!.getUid()).toBe('superhero1');
      service.setActiveUser(testUser2);
      expect(service.activeUser()!.getUid()).toBe('superhero2');
    });
  });

  // ==================== setActiveGroup ====================

  describe('setActiveGroup', () => {
    it('should update activeGroup signal with a real SDK group', () => {
      service.setActiveGroup(testGroup);
      expect(service.activeGroup()).toBe(testGroup);
      expect(service.activeGroup()!.getGuid()).toBe('supergroup');
    });

    it('should clear activeGroup when null is passed', () => {
      service.setActiveGroup(testGroup);
      service.setActiveGroup(null);
      expect(service.activeGroup()).toBeNull();
    });

    it('should update getActiveGroup snapshot', () => {
      service.setActiveGroup(testGroup);
      expect(service.getActiveGroup()).toBe(testGroup);
    });

    it('should clear activeUser when a group is set (mutual exclusivity)', () => {
      service.setActiveUser(testUser);
      expect(service.activeUser()).toBe(testUser);
      service.setActiveGroup(testGroup);
      expect(service.activeGroup()).toBe(testGroup);
      expect(service.activeUser()).toBeNull();
    });

    it('should NOT clear activeUser when group is set to null', () => {
      service.setActiveUser(testUser);
      service.setActiveGroup(null);
      expect(service.activeUser()).toBe(testUser);
    });

    it('should handle undefined without throwing', () => {
      expect(() => service.setActiveGroup(undefined as any)).not.toThrow();
    });

    it('should update getActiveChatEntity to return the group', () => {
      service.setActiveGroup(testGroup);
      const entity = service.getActiveChatEntity();
      expect(entity).toBe(testGroup);
      expect(entity).toBeTruthy();
      expect(typeof (entity as any).getGuid).toBe('function');
    });
  });

  // ==================== setActiveConversation ====================

  describe('setActiveConversation', () => {
    it('should update activeConversation signal with a real SDK conversation', () => {
      if (testConversations.length === 0) return;
      const conv = testConversations[0];
      service.setActiveConversation(conv);
      expect(service.activeConversation()).toBe(conv);
    });

    it('should extract user or group from conversation and set it active', () => {
      if (testConversations.length === 0) return;
      const conv = testConversations[0];
      service.setActiveConversation(conv);
      const conversationWith = conv.getConversationWith();
      if (conversationWith instanceof CometChat.User) {
        expect(service.activeUser()).toBeTruthy();
        expect(service.activeUser()!.getUid()).toBe((conversationWith as CometChat.User).getUid());
      } else if (conversationWith instanceof CometChat.Group) {
        expect(service.activeGroup()).toBeTruthy();
        expect(service.activeGroup()!.getGuid()).toBe(
          (conversationWith as CometChat.Group).getGuid()
        );
      }
    });

    it('should clear all entities when conversation is set to null', () => {
      service.setActiveUser(testUser);
      service.setActiveConversation(null);
      expect(service.activeConversation()).toBeNull();
      expect(service.activeUser()).toBeNull();
      expect(service.activeGroup()).toBeNull();
    });

    it('should update getActiveConversation snapshot', () => {
      if (testConversations.length === 0) return;
      const conv = testConversations[0];
      service.setActiveConversation(conv);
      expect(service.getActiveConversation()).toBe(conv);
    });

    it('should handle undefined gracefully without throwing', () => {
      expect(() => service.setActiveConversation(undefined as any)).not.toThrow();
    });
  });

  // ==================== Observable State Propagation ====================

  describe('Observable State Propagation', () => {
    it('should emit null as initial value from activeUser$', async () => {
      const value = await firstValueFrom(service.activeUser$);
      expect(value).toBeNull();
    });

    it('should emit null as initial value from activeGroup$', async () => {
      const value = await firstValueFrom(service.activeGroup$);
      expect(value).toBeNull();
    });

    it('should emit null as initial value from activeConversation$', async () => {
      const value = await firstValueFrom(service.activeConversation$);
      expect(value).toBeNull();
    });

    it('should propagate user updates to activeUser$ subscribers', async () => {
      const values: (CometChat.User | null)[] = [];
      const sub = service.activeUser$.subscribe(v => values.push(v));
      await new Promise(r => setTimeout(r, 0));

      service.setActiveUser(testUser);
      await new Promise(r => setTimeout(r, 0));

      service.setActiveUser(null);
      await new Promise(r => setTimeout(r, 0));

      sub.unsubscribe();
      expect(values.length).toBeGreaterThanOrEqual(3);
      expect(values[0]).toBeNull();
      expect(values).toContain(testUser);
      expect(values[values.length - 1]).toBeNull();
    });

    it('should propagate group updates to activeGroup$ subscribers', async () => {
      const values: (CometChat.Group | null)[] = [];
      const sub = service.activeGroup$.subscribe(v => values.push(v));
      await new Promise(r => setTimeout(r, 0));

      service.setActiveGroup(testGroup);
      await new Promise(r => setTimeout(r, 0));

      service.setActiveGroup(null);
      await new Promise(r => setTimeout(r, 0));

      sub.unsubscribe();
      expect(values.length).toBeGreaterThanOrEqual(3);
      expect(values[0]).toBeNull();
      expect(values).toContain(testGroup);
      expect(values[values.length - 1]).toBeNull();
    });

    it('should deliver same updates to multiple activeUser$ subscribers', async () => {
      const values1: (CometChat.User | null)[] = [];
      const values2: (CometChat.User | null)[] = [];
      const sub1 = service.activeUser$.subscribe(v => values1.push(v));
      const sub2 = service.activeUser$.subscribe(v => values2.push(v));
      await new Promise(r => setTimeout(r, 0));

      service.setActiveUser(testUser);
      await new Promise(r => setTimeout(r, 0));

      sub1.unsubscribe();
      sub2.unsubscribe();
      expect(values1[values1.length - 1]).toBe(testUser);
      expect(values2[values2.length - 1]).toBe(testUser);
    });

    it('should stop delivering to unsubscribed subscriber', async () => {
      const values: (CometChat.User | null)[] = [];
      const sub = service.activeUser$.subscribe(v => values.push(v));
      await new Promise(r => setTimeout(r, 0));

      service.setActiveUser(testUser);
      await new Promise(r => setTimeout(r, 0));

      sub.unsubscribe();
      const countAfterUnsub = values.length;

      service.setActiveUser(testUser2);
      await new Promise(r => setTimeout(r, 0));

      expect(values.length).toBe(countAfterUnsub);
    });
  });

  // ==================== Signal Reactivity ====================

  describe('Signal Reactivity', () => {
    it('should reflect user changes synchronously via signal', () => {
      expect(service.activeUser()).toBeNull();
      service.setActiveUser(testUser);
      expect(service.activeUser()).toBe(testUser);
      service.setActiveUser(null);
      expect(service.activeUser()).toBeNull();
    });

    it('should reflect group changes synchronously via signal', () => {
      expect(service.activeGroup()).toBeNull();
      service.setActiveGroup(testGroup);
      expect(service.activeGroup()).toBe(testGroup);
      service.setActiveGroup(null);
      expect(service.activeGroup()).toBeNull();
    });

    it('should return consistent value across multiple reads', () => {
      service.setActiveUser(testUser);
      const read1 = service.activeUser();
      const read2 = service.activeUser();
      const read3 = service.activeUser();
      expect(read1).toBe(read2);
      expect(read2).toBe(read3);
    });
  });

  // ==================== Mutual Exclusivity ====================

  describe('Mutual Exclusivity', () => {
    it('should maintain only user when user is set', () => {
      service.setActiveUser(testUser);
      expect(service.activeUser()).toBe(testUser);
      expect(service.activeGroup()).toBeNull();
    });

    it('should maintain only group when group is set', () => {
      service.setActiveGroup(testGroup);
      expect(service.activeUser()).toBeNull();
      expect(service.activeGroup()).toBe(testGroup);
    });

    it('should switch from user to group correctly', () => {
      service.setActiveUser(testUser);
      service.setActiveGroup(testGroup);
      expect(service.activeUser()).toBeNull();
      expect(service.activeGroup()).toBe(testGroup);
    });

    it('should switch from group to user correctly', () => {
      service.setActiveGroup(testGroup);
      service.setActiveUser(testUser);
      expect(service.activeUser()).toBe(testUser);
      expect(service.activeGroup()).toBeNull();
    });

    it('should handle rapid switching between user and group', () => {
      service.setActiveUser(testUser);
      service.setActiveGroup(testGroup);
      service.setActiveUser(testUser2);
      expect(service.activeUser()).toBe(testUser2);
      expect(service.activeGroup()).toBeNull();
    });
  });

  // ==================== clearActiveChat ====================

  describe('clearActiveChat', () => {
    it('should clear all signals when called', () => {
      service.setActiveUser(testUser);
      service.clearActiveChat();
      expect(service.activeUser()).toBeNull();
      expect(service.activeGroup()).toBeNull();
      expect(service.activeConversation()).toBeNull();
    });

    it('should clear all getters when called', () => {
      service.setActiveGroup(testGroup);
      service.clearActiveChat();
      expect(service.getActiveUser()).toBeNull();
      expect(service.getActiveGroup()).toBeNull();
      expect(service.getActiveConversation()).toBeNull();
    });

    it('should clear getActiveChatEntity when called', () => {
      service.setActiveUser(testUser);
      service.clearActiveChat();
      expect(service.getActiveChatEntity()).toBeNull();
    });

    it('should be idempotent (safe to call multiple times)', () => {
      service.setActiveUser(testUser);
      service.clearActiveChat();
      service.clearActiveChat();
      service.clearActiveChat();
      expect(service.activeUser()).toBeNull();
    });

    it('should work correctly when called on empty state', () => {
      expect(() => service.clearActiveChat()).not.toThrow();
      expect(service.activeUser()).toBeNull();
      expect(service.activeGroup()).toBeNull();
      expect(service.activeConversation()).toBeNull();
    });
  });

  // ==================== getActiveChatEntity ====================

  describe('getActiveChatEntity', () => {
    it('should return user when user is active', () => {
      service.setActiveUser(testUser);
      const entity = service.getActiveChatEntity();
      expect(entity).toBe(testUser);
      expect(entity).toBeTruthy();
      expect(typeof (entity as any).getUid).toBe('function');
    });

    it('should return group when group is active', () => {
      service.setActiveGroup(testGroup);
      const entity = service.getActiveChatEntity();
      expect(entity).toBe(testGroup);
      expect(entity).toBeTruthy();
      expect(typeof (entity as any).getGuid).toBe('function');
    });

    it('should return null when neither is active', () => {
      expect(service.getActiveChatEntity()).toBeNull();
    });

    it('should update when switching between user and group', () => {
      service.setActiveUser(testUser);
      expect(service.getActiveChatEntity()).toBe(testUser);
      service.setActiveGroup(testGroup);
      expect(service.getActiveChatEntity()).toBe(testGroup);
    });
  });

  // ==================== Edge Cases ====================

  describe('Edge Cases', () => {
    it('should handle setting the same user multiple times', () => {
      service.setActiveUser(testUser);
      service.setActiveUser(testUser);
      service.setActiveUser(testUser);
      expect(service.activeUser()).toBe(testUser);
    });

    it('should handle setting the same group multiple times', () => {
      service.setActiveGroup(testGroup);
      service.setActiveGroup(testGroup);
      expect(service.activeGroup()).toBe(testGroup);
    });

    it('should handle setting null multiple times for user', () => {
      service.setActiveUser(testUser);
      service.setActiveUser(null);
      service.setActiveUser(null);
      expect(service.activeUser()).toBeNull();
    });

    it('should verify real SDK user has expected properties', () => {
      service.setActiveUser(testUser);
      const user = service.getActiveUser()!;
      expect(user.getUid()).toBeTruthy();
      expect(user.getName()).toBeTruthy();
    });

    it('should verify real SDK group has expected properties', () => {
      service.setActiveGroup(testGroup);
      const group = service.getActiveGroup()!;
      expect(group.getGuid()).toBeTruthy();
      expect(group.getName()).toBeTruthy();
    });
  });
});
