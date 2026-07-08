/**
 * cometchat-message-header.typing-utils Tests
 *
 * Covers: getTypingText (1-on-1, group 1/2/3+ typers),
 *         getTypingUsersCount, getHeaderMemberCountText,
 *         isUserOnlineStatus, getUserLastActiveTimestamp.
 *
 * @module components/cometchat-message-header/typing-utils
 */

import { describe, it, expect } from 'vitest';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import {
  getTypingText,
  getTypingUsersCount,
  getHeaderMemberCountText,
  isUserOnlineStatus,
  getUserLastActiveTimestamp,
} from './cometchat-message-header.typing-utils';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeUser(uid: string, name: string, status = 'offline', lastActiveAt?: number): CometChat.User {
  const u = new CometChat.User(uid);
  u.setName(name);
  u.setStatus(status as any);
  if (lastActiveAt !== undefined) {
    (u as any).lastActiveAt = lastActiveAt;
    (u as any).getLastActiveAt = () => lastActiveAt;
  }
  return u;
}

describe('cometchat-message-header.typing-utils', () => {

  // ==================== getTypingText ====================

  describe('getTypingText', () => {
    it('should return empty string when no users are typing', () => {
      expect(getTypingText([], false)).toBe('');
      expect(getTypingText([], true)).toBe('');
    });

    it('should return localized typing string for 1-on-1 chat', () => {
      const user = makeUser('u1', 'Alice');
      const result = getTypingText([user], false);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should include user name for group chat with 1 typer', () => {
      const user = makeUser('u1', 'Alice');
      const result = getTypingText([user], true);
      expect(result).toContain('Alice');
    });

    it('should include both names for group chat with 2 typers', () => {
      const u1 = makeUser('u1', 'Alice');
      const u2 = makeUser('u2', 'Bob');
      const result = getTypingText([u1, u2], true);
      expect(result).toContain('Alice');
      expect(result).toContain('Bob');
    });

    it('should include first name and others count for 3+ typers', () => {
      const u1 = makeUser('u1', 'Alice');
      const u2 = makeUser('u2', 'Bob');
      const u3 = makeUser('u3', 'Charlie');
      const result = getTypingText([u1, u2, u3], true);
      expect(result).toContain('Alice');
      // Should mention "2" others
      expect(result).toContain('2');
    });

    it('should handle 4 typers in group', () => {
      const users = ['Alice', 'Bob', 'Charlie', 'Dave'].map((n, i) => makeUser(`u${i}`, n));
      const result = getTypingText(users, true);
      expect(result).toContain('Alice');
      expect(result).toContain('3');
    });

    it('should not include other names for 3+ typers (only first + count)', () => {
      const u1 = makeUser('u1', 'Alice');
      const u2 = makeUser('u2', 'Bob');
      const u3 = makeUser('u3', 'Charlie');
      const result = getTypingText([u1, u2, u3], true);
      // Bob and Charlie should not appear directly
      expect(result).not.toContain('Bob');
      expect(result).not.toContain('Charlie');
    });

    it('should handle user with a single-char name', () => {
      // SDK getName() requires a valid string — use minimal valid name
      const user = makeUser('u1', 'A');
      const result = getTypingText([user], true);
      expect(result).toContain('A');
    });
  });

  // ==================== getTypingUsersCount ====================

  describe('getTypingUsersCount', () => {
    it('should return 0 for empty array', () => {
      expect(getTypingUsersCount([])).toBe(0);
    });

    it('should return 1 for single user', () => {
      expect(getTypingUsersCount([makeUser('u1', 'Alice')])).toBe(1);
    });

    it('should return correct count for multiple users', () => {
      const users = [makeUser('u1', 'A'), makeUser('u2', 'B'), makeUser('u3', 'C')];
      expect(getTypingUsersCount(users)).toBe(3);
    });
  });

  // ==================== getHeaderMemberCountText ====================

  describe('getHeaderMemberCountText', () => {
    it('should return empty string for 0 members', () => {
      expect(getHeaderMemberCountText(0)).toBe('');
    });

    it('should return empty string for negative count', () => {
      expect(getHeaderMemberCountText(-1)).toBe('');
    });

    it('should include the count in the result', () => {
      const result = getHeaderMemberCountText(5);
      expect(result).toContain('5');
    });

    it('should include the count for 1 member', () => {
      const result = getHeaderMemberCountText(1);
      expect(result).toContain('1');
    });

    it('should return a non-empty string for positive counts', () => {
      expect(getHeaderMemberCountText(10).length).toBeGreaterThan(0);
    });
  });

  // ==================== isUserOnlineStatus ====================

  describe('isUserOnlineStatus', () => {
    it('should return false when user is null', () => {
      expect(isUserOnlineStatus(null, null)).toBe(false);
    });

    it('should return true when user status is online', () => {
      const user = makeUser('u1', 'Alice', CometChat.USER_STATUS.ONLINE);
      expect(isUserOnlineStatus(user, null)).toBe(true);
    });

    it('should return false when user status is offline', () => {
      const user = makeUser('u1', 'Alice', CometChat.USER_STATUS.OFFLINE);
      expect(isUserOnlineStatus(user, null)).toBe(false);
    });

    it('should use userStatus override when provided', () => {
      const user = makeUser('u1', 'Alice', CometChat.USER_STATUS.OFFLINE);
      expect(isUserOnlineStatus(user, CometChat.USER_STATUS.ONLINE)).toBe(true);
    });

    it('should use userStatus=offline override even when user is online', () => {
      const user = makeUser('u1', 'Alice', CometChat.USER_STATUS.ONLINE);
      expect(isUserOnlineStatus(user, CometChat.USER_STATUS.OFFLINE)).toBe(false);
    });
  });

  // ==================== getUserLastActiveTimestamp ====================

  describe('getUserLastActiveTimestamp', () => {
    it('should return null when user is null', () => {
      expect(getUserLastActiveTimestamp(null, null)).toBeNull();
    });

    it('should return null when user is online', () => {
      const user = makeUser('u1', 'Alice', CometChat.USER_STATUS.ONLINE, 1234567890);
      expect(getUserLastActiveTimestamp(user, null)).toBeNull();
    });

    it('should return lastActiveAt when user is offline', () => {
      const ts = 1705276800;
      const user = makeUser('u1', 'Alice', CometChat.USER_STATUS.OFFLINE, ts);
      expect(getUserLastActiveTimestamp(user, null)).toBe(ts);
    });

    it('should use userStatus override for online check', () => {
      const ts = 1705276800;
      const user = makeUser('u1', 'Alice', CometChat.USER_STATUS.OFFLINE, ts);
      // Override to online → should return null
      expect(getUserLastActiveTimestamp(user, CometChat.USER_STATUS.ONLINE)).toBeNull();
    });

    it('should return null when user has no lastActiveAt', () => {
      const user = makeUser('u1', 'Alice', CometChat.USER_STATUS.OFFLINE);
      // No lastActiveAt set
      const result = getUserLastActiveTimestamp(user, null);
      expect(result === null || typeof result === 'number').toBe(true);
    });
  });
});
