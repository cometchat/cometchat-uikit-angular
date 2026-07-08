/**
 * cometchat-users.section-utils Tests
 *
 * Covers: shouldShowUserSectionHeader, getUserSectionHeaderValue,
 *         getUserAriaLabel, computeSelectionRange.
 *
 * @module components/cometchat-users/section-utils
 */

import { describe, it, expect } from 'vitest';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import {
  shouldShowUserSectionHeader,
  getUserSectionHeaderValue,
  getUserAriaLabel,
  computeSelectionRange,
} from './cometchat-users.section-utils';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeUser(uid: string, name: string, status = 'offline'): CometChat.User {
  const u = new CometChat.User(uid);
  u.setName(name);
  u.setStatus(status as any);
  return u;
}

describe('cometchat-users.section-utils', () => {

  // ==================== shouldShowUserSectionHeader ====================

  describe('shouldShowUserSectionHeader', () => {
    it('should return false when showSectionHeader=false', () => {
      const users = [makeUser('u1', 'Alice')];
      expect(shouldShowUserSectionHeader(users, 0, false)).toBe(false);
    });

    it('should return false for empty list', () => {
      expect(shouldShowUserSectionHeader([], 0, true)).toBe(false);
    });

    it('should return true for first item when showSectionHeader=true', () => {
      const users = [makeUser('u1', 'Alice')];
      expect(shouldShowUserSectionHeader(users, 0, true)).toBe(true);
    });

    it('should return false when consecutive users have same first letter', () => {
      const users = [makeUser('u1', 'Alice'), makeUser('u2', 'Anna')];
      expect(shouldShowUserSectionHeader(users, 1, true)).toBe(false);
    });

    it('should return true when consecutive users have different first letters', () => {
      const users = [makeUser('u1', 'Alice'), makeUser('u2', 'Bob')];
      expect(shouldShowUserSectionHeader(users, 1, true)).toBe(true);
    });

    it('should handle case-insensitive comparison', () => {
      const users = [makeUser('u1', 'alice'), makeUser('u2', 'ANNA')];
      // Both start with 'A' — should not show header
      expect(shouldShowUserSectionHeader(users, 1, true)).toBe(false);
    });
  });

  // ==================== getUserSectionHeaderValue ====================

  describe('getUserSectionHeaderValue', () => {
    it('should return the first letter of the user name uppercased', () => {
      const u = makeUser('u1', 'alice');
      expect(getUserSectionHeaderValue(u)).toBe('A');
    });

    it('should return # for user with empty name', () => {
      const u = makeUser('u1', '');
      expect(getUserSectionHeaderValue(u)).toBe('#');
    });

    it('should handle uppercase names', () => {
      const u = makeUser('u1', 'BOB');
      expect(getUserSectionHeaderValue(u)).toBe('B');
    });

    it('should return first character for numeric names', () => {
      const u = makeUser('u1', '123User');
      expect(getUserSectionHeaderValue(u)).toBe('1');
    });

    it('should return # when name is null/undefined', () => {
      const u = makeUser('u1', '');
      (u as any).getName = () => null;
      expect(getUserSectionHeaderValue(u)).toBe('#');
    });
  });

  // ==================== getUserAriaLabel ====================

  describe('getUserAriaLabel', () => {
    it('should return just the name when hideUserStatus=true', () => {
      const u = makeUser('u1', 'Alice', 'online');
      expect(getUserAriaLabel(u, true)).toBe('Alice');
    });

    it('should include status when hideUserStatus=false', () => {
      const u = makeUser('u1', 'Alice', 'online');
      const label = getUserAriaLabel(u, false);
      expect(label).toContain('Alice');
      expect(label).toContain('online');
    });

    it('should return just name when status is empty', () => {
      const u = makeUser('u1', 'Alice', '');
      (u as any).getStatus = () => '';
      const label = getUserAriaLabel(u, false);
      expect(label).toBe('Alice');
    });

    it('should handle user with minimal name', () => {
      const u = makeUser('u1', 'A');
      const label = getUserAriaLabel(u, false);
      expect(typeof label).toBe('string');
    });
  });

  // ==================== computeSelectionRange ====================

  describe('computeSelectionRange', () => {
    it('should return correct range when anchor < clicked', () => {
      const range = computeSelectionRange(2, 5);
      expect(range.start).toBe(2);
      expect(range.end).toBe(5);
    });

    it('should return correct range when anchor > clicked', () => {
      const range = computeSelectionRange(5, 2);
      expect(range.start).toBe(2);
      expect(range.end).toBe(5);
    });

    it('should return same index when anchor === clicked', () => {
      const range = computeSelectionRange(3, 3);
      expect(range.start).toBe(3);
      expect(range.end).toBe(3);
    });

    it('should always have start <= end', () => {
      for (let i = 0; i < 10; i++) {
        const a = Math.floor(Math.random() * 10);
        const b = Math.floor(Math.random() * 10);
        const range = computeSelectionRange(a, b);
        expect(range.start).toBeLessThanOrEqual(range.end);
      }
    });
  });
});
