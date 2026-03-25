/**
 * MessageHeaderService Tests
 *
 * Categories: Initialization, setUser, setGroup, User Status,
 *             Typing Indicators, Group Member Count, Connection Status,
 *             Listener Setup, Cleanup, Error Handling, Edge Cases
 *
 * Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.8, 13.6, 14.4, 14.5, 15.7
 *
 * Uses real CometChat SDK — NO vi.mock() for chat SDK packages.
 * The calls SDK mock below is required because @cometchat/calls-sdk-javascript
 * has a JitsiMeetJS runtime dependency that doesn't exist in jsdom.
 *
 * @module services/message-header
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
import { ensureSdkReady, sdkCleanup, fetchTestUser, fetchTestGroup } from '../test-setup';
import { MessageHeaderService } from './message-header.service';
import { CometChat } from '@cometchat/chat-sdk-javascript';

describe('MessageHeaderService', () => {
  let service: MessageHeaderService;
  let testUser: CometChat.User;
  let testUser2: CometChat.User;
  let testGroup: CometChat.Group;

  beforeAll(async () => {
    await ensureSdkReady();
    testUser = await fetchTestUser('superhero1');
    testUser2 = await fetchTestUser('superhero2');
    testGroup = await fetchTestGroup('supergroup');
  }, 30000);

  afterAll(async () => {
    await sdkCleanup();
  }, 30000);

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [MessageHeaderService],
    });
    service = TestBed.inject(MessageHeaderService);
    service.cleanup();
  });

  // ==================== Initialization ====================

  describe('Initialization', () => {
    it('should be provided in root', () => {
      expect(service).toBeTruthy();
    });

    it('should have null initial user signal', () => {
      expect(service.user()).toBeNull();
    });

    it('should have null initial group signal', () => {
      expect(service.group()).toBeNull();
    });

    it('should have offline initial userStatus signal', () => {
      expect(service.userStatus()).toBe('offline');
    });

    it('should have null initial typingIndicator signal', () => {
      expect(service.typingIndicator()).toBeNull();
    });

    it('should have empty initial typingUsers signal', () => {
      expect(service.typingUsers()).toEqual([]);
    });

    it('should have zero initial groupMemberCount signal', () => {
      expect(service.groupMemberCount()).toBe(0);
    });

    it('should have null initial lastActiveAt signal', () => {
      expect(service.lastActiveAt()).toBeNull();
    });

    it('should have connected initial connectionStatus signal', () => {
      expect(service.connectionStatus()).toBe('connected');
    });
  });

  // ==================== setUser ====================

  describe('setUser', () => {
    it('should set user signal with a real SDK user', () => {
      service.setUser(testUser);
      expect(service.user()).toBe(testUser);
      expect(service.user()!.getUid()).toBe('superhero1');
    });

    it('should initialize userStatus from the real SDK user object', () => {
      service.setUser(testUser);
      const status = testUser.getStatus?.() || 'offline';
      expect(service.userStatus()).toBe(status);
    });

    it('should initialize lastActiveAt from the real SDK user object', () => {
      service.setUser(testUser);
      const expectedLastActive = testUser.getLastActiveAt?.() || null;
      expect(service.lastActiveAt()).toBe(expectedLastActive);
    });

    it('should clear group state when setting a user', () => {
      service.setGroup(testGroup);
      expect(service.group()).toBe(testGroup);
      expect(service.groupMemberCount()).toBeGreaterThanOrEqual(0);

      service.setUser(testUser);
      expect(service.group()).toBeNull();
      expect(service.groupMemberCount()).toBe(0);
    });

    it('should clear typing indicator when switching users', () => {
      // Manually set a typing indicator first
      service.setTypingIndicator({} as CometChat.TypingIndicator);
      expect(service.typingIndicator()).toBeTruthy();

      service.setUser(testUser);
      expect(service.typingIndicator()).toBeNull();
      expect(service.typingUsers()).toEqual([]);
    });

    it('should replace previous user with a different real SDK user', () => {
      service.setUser(testUser);
      expect(service.user()!.getUid()).toBe('superhero1');

      service.setUser(testUser2);
      expect(service.user()!.getUid()).toBe('superhero2');
    });

    it('should invoke error callback when null is passed', () => {
      const errorSpy = vi.fn();
      service.setErrorCallback(errorSpy);

      service.setUser(null as any);
      expect(errorSpy).toHaveBeenCalled();
      expect(errorSpy.mock.calls[0][0]).toBeTruthy();
    });
  });

  // ==================== setGroup ====================

  describe('setGroup', () => {
    it('should set group signal with a real SDK group', () => {
      service.setGroup(testGroup);
      expect(service.group()).toBe(testGroup);
      expect(service.group()!.getGuid()).toBe('supergroup');
    });

    it('should initialize groupMemberCount from the real SDK group object', () => {
      service.setGroup(testGroup);
      const expectedCount = testGroup.getMembersCount?.() || 0;
      expect(service.groupMemberCount()).toBe(expectedCount);
    });

    it('should clear user state when setting a group', () => {
      service.setUser(testUser);
      expect(service.user()).toBe(testUser);

      service.setGroup(testGroup);
      expect(service.user()).toBeNull();
      expect(service.userStatus()).toBe('offline');
      expect(service.lastActiveAt()).toBeNull();
    });

    it('should clear typing indicator when switching groups', () => {
      service.setTypingIndicator({} as CometChat.TypingIndicator);
      expect(service.typingIndicator()).toBeTruthy();

      service.setGroup(testGroup);
      expect(service.typingIndicator()).toBeNull();
      expect(service.typingUsers()).toEqual([]);
    });

    it('should invoke error callback when null is passed', () => {
      const errorSpy = vi.fn();
      service.setErrorCallback(errorSpy);

      service.setGroup(null as any);
      expect(errorSpy).toHaveBeenCalled();
    });
  });

  // ==================== updateUserStatus ====================

  describe('updateUserStatus', () => {
    it('should update userStatus signal to online', () => {
      service.updateUserStatus('online');
      expect(service.userStatus()).toBe('online');
    });

    it('should update userStatus signal to offline', () => {
      service.updateUserStatus('online');
      service.updateUserStatus('offline');
      expect(service.userStatus()).toBe('offline');
    });
  });

  // ==================== updateLastActiveAt ====================

  describe('updateLastActiveAt', () => {
    it('should update lastActiveAt signal with a timestamp', () => {
      const ts = Date.now();
      service.updateLastActiveAt(ts);
      expect(service.lastActiveAt()).toBe(ts);
    });

    it('should clear lastActiveAt when null is passed', () => {
      service.updateLastActiveAt(Date.now());
      service.updateLastActiveAt(null);
      expect(service.lastActiveAt()).toBeNull();
    });
  });

  // ==================== setTypingIndicator ====================

  describe('setTypingIndicator', () => {
    it('should set typing indicator signal', () => {
      const indicator = {} as CometChat.TypingIndicator;
      service.setTypingIndicator(indicator);
      expect(service.typingIndicator()).toBe(indicator);
    });

    it('should clear typing indicator when null is passed', () => {
      service.setTypingIndicator({} as CometChat.TypingIndicator);
      service.setTypingIndicator(null);
      expect(service.typingIndicator()).toBeNull();
    });
  });

  // ==================== Group Member Count ====================

  describe('Group Member Count', () => {
    it('should update groupMemberCount via updateGroupMemberCount', () => {
      service.updateGroupMemberCount(42);
      expect(service.groupMemberCount()).toBe(42);
    });

    it('should increment groupMemberCount by 1', () => {
      service.updateGroupMemberCount(10);
      service.incrementGroupMemberCount();
      expect(service.groupMemberCount()).toBe(11);
    });

    it('should decrement groupMemberCount by 1', () => {
      service.updateGroupMemberCount(10);
      service.decrementGroupMemberCount();
      expect(service.groupMemberCount()).toBe(9);
    });

    it('should not decrement below zero', () => {
      service.updateGroupMemberCount(0);
      service.decrementGroupMemberCount();
      expect(service.groupMemberCount()).toBe(0);
    });

    it('should handle multiple increments correctly', () => {
      service.updateGroupMemberCount(5);
      service.incrementGroupMemberCount();
      service.incrementGroupMemberCount();
      service.incrementGroupMemberCount();
      expect(service.groupMemberCount()).toBe(8);
    });
  });

  // ==================== resetState ====================

  describe('resetState', () => {
    it('should reset all signals to initial values', () => {
      service.setUser(testUser);
      service.updateUserStatus('online');
      service.updateLastActiveAt(Date.now());
      service.setTypingIndicator({} as CometChat.TypingIndicator);
      service.updateGroupMemberCount(10);

      service.resetState();

      expect(service.user()).toBeNull();
      expect(service.group()).toBeNull();
      expect(service.userStatus()).toBe('offline');
      expect(service.typingIndicator()).toBeNull();
      expect(service.typingUsers()).toEqual([]);
      expect(service.groupMemberCount()).toBe(0);
      expect(service.lastActiveAt()).toBeNull();
      expect(service.connectionStatus()).toBe('connected');
    });

    it('should clear error callback on reset', () => {
      const errorSpy = vi.fn();
      service.setErrorCallback(errorSpy);
      service.resetState();

      // After reset, error callback should be null — passing null to setUser should not call spy
      service.setUser(null as any);
      expect(errorSpy).not.toHaveBeenCalled();
    });
  });

  // ==================== Listener Setup ====================

  describe('Listener Setup', () => {
    it('should set up user status listener without throwing', () => {
      expect(() => service.setupUserStatusListener(testUser.getUid())).not.toThrow();
    });

    it('should invoke error callback when empty userId is passed to setupUserStatusListener', () => {
      const errorSpy = vi.fn();
      service.setErrorCallback(errorSpy);
      service.setupUserStatusListener('');
      expect(errorSpy).toHaveBeenCalled();
    });

    it('should set up typing listener for user without throwing', () => {
      expect(() => service.setupTypingListener(testUser.getUid(), 'user')).not.toThrow();
    });

    it('should set up typing listener for group without throwing', () => {
      expect(() => service.setupTypingListener(testGroup.getGuid(), 'group')).not.toThrow();
    });

    it('should invoke error callback when empty entityId is passed to setupTypingListener', () => {
      const errorSpy = vi.fn();
      service.setErrorCallback(errorSpy);
      service.setupTypingListener('', 'user');
      expect(errorSpy).toHaveBeenCalled();
    });

    it('should set up group member listener without throwing', () => {
      expect(() => service.setupGroupMemberListener(testGroup.getGuid())).not.toThrow();
    });

    it('should invoke error callback when empty groupId is passed to setupGroupMemberListener', () => {
      const errorSpy = vi.fn();
      service.setErrorCallback(errorSpy);
      service.setupGroupMemberListener('');
      expect(errorSpy).toHaveBeenCalled();
    });

    it('should set up connection listener without throwing', () => {
      expect(() => service.setupConnectionListener()).not.toThrow();
    });

    it('should set up all listeners for user entity via setupListeners', () => {
      expect(() => service.setupListeners(testUser.getUid(), 'user')).not.toThrow();
    });

    it('should set up all listeners for group entity via setupListeners', () => {
      expect(() => service.setupListeners(testGroup.getGuid(), 'group')).not.toThrow();
    });

    it('should invoke error callback when empty entityId is passed to setupListeners', () => {
      const errorSpy = vi.fn();
      service.setErrorCallback(errorSpy);
      service.setupListeners('', 'user');
      expect(errorSpy).toHaveBeenCalled();
    });
  });

  // ==================== Listener Removal ====================

  describe('Listener Removal', () => {
    it('should remove user status listener without throwing', () => {
      service.setupUserStatusListener(testUser.getUid());
      expect(() => service.removeUserStatusListener()).not.toThrow();
    });

    it('should remove typing listener and clear typing state', () => {
      service.setupTypingListener(testUser.getUid(), 'user');
      service.setTypingIndicator({} as CometChat.TypingIndicator);

      service.removeTypingListener();

      expect(service.typingIndicator()).toBeNull();
      expect(service.typingUsers()).toEqual([]);
    });

    it('should remove group member listener without throwing', () => {
      service.setupGroupMemberListener(testGroup.getGuid());
      expect(() => service.removeGroupMemberListener()).not.toThrow();
    });

    it('should remove connection listener without throwing', () => {
      service.setupConnectionListener();
      expect(() => service.removeConnectionListener()).not.toThrow();
    });

    it('should be safe to remove listeners that were never set up', () => {
      expect(() => service.removeUserStatusListener()).not.toThrow();
      expect(() => service.removeTypingListener()).not.toThrow();
      expect(() => service.removeGroupMemberListener()).not.toThrow();
      expect(() => service.removeConnectionListener()).not.toThrow();
    });
  });

  // ==================== Cleanup ====================

  describe('cleanup', () => {
    it('should reset all state and remove listeners', () => {
      service.setUser(testUser);
      service.setupListeners(testUser.getUid(), 'user');
      service.updateUserStatus('online');
      service.updateGroupMemberCount(5);

      service.cleanup();

      expect(service.user()).toBeNull();
      expect(service.group()).toBeNull();
      expect(service.userStatus()).toBe('offline');
      expect(service.typingIndicator()).toBeNull();
      expect(service.typingUsers()).toEqual([]);
      expect(service.groupMemberCount()).toBe(0);
      expect(service.lastActiveAt()).toBeNull();
      expect(service.connectionStatus()).toBe('connected');
    });

    it('should be idempotent — safe to call multiple times', () => {
      service.setUser(testUser);
      service.cleanup();
      service.cleanup();
      service.cleanup();
      expect(service.user()).toBeNull();
    });

    it('should work correctly when called on fresh service', () => {
      expect(() => service.cleanup()).not.toThrow();
    });
  });

  // ==================== Error Handling ====================

  describe('Error Handling', () => {
    it('should set and invoke error callback', () => {
      const errorSpy = vi.fn();
      service.setErrorCallback(errorSpy);

      // Trigger an error by passing null to setUser
      service.setUser(null as any);

      expect(errorSpy).toHaveBeenCalledTimes(1);
      const error = errorSpy.mock.calls[0][0];
      expect(error).toBeTruthy();
      expect(error.message).toBeTruthy();
    });

    it('should clear error callback when null is passed to setErrorCallback', () => {
      const errorSpy = vi.fn();
      service.setErrorCallback(errorSpy);
      service.setErrorCallback(null);

      // This should not call the spy since callback was cleared
      service.setUser(null as any);
      expect(errorSpy).not.toHaveBeenCalled();
    });

    it('should not throw when error occurs without error callback set', () => {
      // No error callback set — passing null should not throw
      expect(() => service.setUser(null as any)).not.toThrow();
      expect(() => service.setGroup(null as any)).not.toThrow();
    });
  });

  // ==================== Error Recovery (Requirement 7.6) ====================

  describe('Error Recovery', () => {
    it('should invoke ErrorCallback when setUser is called with null', () => {
      const errors: CometChat.CometChatException[] = [];
      service.setErrorCallback(err => errors.push(err));

      // setUser(null) should catch the error and invoke callback — not throw
      service.setUser(null as any);

      expect(errors.length).toBe(1);
      expect(errors[0]).toBeTruthy();
      expect(errors[0].message).toBeTruthy();
    });

    it('should invoke ErrorCallback when setGroup is called with null', () => {
      const errors: CometChat.CometChatException[] = [];
      service.setErrorCallback(err => errors.push(err));

      service.setGroup(null as any);

      expect(errors.length).toBe(1);
      expect(errors[0]).toBeTruthy();
    });

    it('should not throw when error occurs without ErrorCallback set', () => {
      service.setErrorCallback(null);

      // These should not throw even without a callback
      expect(() => service.setUser(null as any)).not.toThrow();
      expect(() => service.setGroup(null as any)).not.toThrow();
      expect(() => service.setupUserStatusListener('')).not.toThrow();
      expect(() => service.setupTypingListener('', 'user')).not.toThrow();
      expect(() => service.setupGroupMemberListener('')).not.toThrow();
      expect(() => service.setupListeners('', 'user')).not.toThrow();
    });

    it('should invoke ErrorCallback for invalid setupUserStatusListener', () => {
      const errors: CometChat.CometChatException[] = [];
      service.setErrorCallback(err => errors.push(err));

      service.setupUserStatusListener('');

      expect(errors.length).toBe(1);
    });

    it('should invoke ErrorCallback for invalid setupGroupMemberListener', () => {
      const errors: CometChat.CometChatException[] = [];
      service.setErrorCallback(err => errors.push(err));

      service.setupGroupMemberListener('');

      expect(errors.length).toBe(1);
    });

    it('should invoke ErrorCallback for invalid setupListeners', () => {
      const errors: CometChat.CometChatException[] = [];
      service.setErrorCallback(err => errors.push(err));

      service.setupListeners('', 'user');

      // setupListeners validates entityId and calls handleError
      expect(errors.length).toBeGreaterThanOrEqual(1);
    });

    it('should remain usable after an error — subsequent operations succeed', () => {
      const errors: CometChat.CometChatException[] = [];
      service.setErrorCallback(err => errors.push(err));

      // Trigger error
      service.setUser(null as any);
      expect(errors.length).toBe(1);

      // Service should still work
      service.setUser(testUser);
      expect(service.user()).toBe(testUser);
      expect(service.user()!.getUid()).toBe('superhero1');
    });

    it('should not propagate listener removal errors', () => {
      // Removing listeners that were never set up should not throw
      expect(() => service.removeUserStatusListener()).not.toThrow();
      expect(() => service.removeTypingListener()).not.toThrow();
      expect(() => service.removeGroupMemberListener()).not.toThrow();
      expect(() => service.removeConnectionListener()).not.toThrow();
    });
  });

  // ==================== Real SDK User/Group Properties ====================

  describe('Real SDK Object Properties', () => {
    it('should verify real SDK user has expected properties after setUser', () => {
      service.setUser(testUser);
      const user = service.user()!;
      expect(user.getUid()).toBeTruthy();
      expect(user.getName()).toBeTruthy();
    });

    it('should verify real SDK group has expected properties after setGroup', () => {
      service.setGroup(testGroup);
      const group = service.group()!;
      expect(group.getGuid()).toBeTruthy();
      expect(group.getName()).toBeTruthy();
    });

    it('should extract membersCount from real SDK group', () => {
      service.setGroup(testGroup);
      // Real groups should have a non-negative member count
      expect(service.groupMemberCount()).toBeGreaterThanOrEqual(0);
    });
  });

  // ==================== Mutual Exclusivity ====================

  describe('Mutual Exclusivity (User vs Group)', () => {
    it('should clear group when user is set', () => {
      service.setGroup(testGroup);
      expect(service.group()).toBe(testGroup);

      service.setUser(testUser);
      expect(service.user()).toBe(testUser);
      expect(service.group()).toBeNull();
    });

    it('should clear user when group is set', () => {
      service.setUser(testUser);
      expect(service.user()).toBe(testUser);

      service.setGroup(testGroup);
      expect(service.group()).toBe(testGroup);
      expect(service.user()).toBeNull();
    });

    it('should handle rapid switching between user and group', () => {
      service.setUser(testUser);
      service.setGroup(testGroup);
      service.setUser(testUser2);

      expect(service.user()!.getUid()).toBe('superhero2');
      expect(service.group()).toBeNull();
    });
  });

  // ==================== Edge Cases ====================

  describe('Edge Cases', () => {
    it('should handle setting the same user multiple times', () => {
      service.setUser(testUser);
      service.setUser(testUser);
      service.setUser(testUser);
      expect(service.user()).toBe(testUser);
    });

    it('should handle setting the same group multiple times', () => {
      service.setGroup(testGroup);
      service.setGroup(testGroup);
      expect(service.group()).toBe(testGroup);
    });

    it('should handle updateGroupMemberCount with zero', () => {
      service.updateGroupMemberCount(0);
      expect(service.groupMemberCount()).toBe(0);
    });

    it('should handle updateGroupMemberCount with large number', () => {
      service.updateGroupMemberCount(999999);
      expect(service.groupMemberCount()).toBe(999999);
    });

    it('should handle updateUserStatus with arbitrary string', () => {
      service.updateUserStatus('busy');
      expect(service.userStatus()).toBe('busy');
    });

    it('should handle updateLastActiveAt with zero timestamp', () => {
      service.updateLastActiveAt(0);
      expect(service.lastActiveAt()).toBe(0);
    });

    it('should return consistent signal values across multiple reads', () => {
      service.setUser(testUser);
      const read1 = service.user();
      const read2 = service.user();
      const read3 = service.user();
      expect(read1).toBe(read2);
      expect(read2).toBe(read3);
    });

    it('should allow re-setup of listeners after cleanup', () => {
      service.setUser(testUser);
      service.setupListeners(testUser.getUid(), 'user');
      service.cleanup();

      // Re-setup should work fine
      service.setUser(testUser2);
      expect(() => service.setupListeners(testUser2.getUid(), 'user')).not.toThrow();
      expect(service.user()!.getUid()).toBe('superhero2');
    });
  });
});
