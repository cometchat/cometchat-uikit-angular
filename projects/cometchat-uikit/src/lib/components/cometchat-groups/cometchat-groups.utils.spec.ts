/**
 * cometchat-groups.utils Tests
 *
 * Covers: getGroupMemberCountText, getGroupTypeDisplay, getGroupAriaLabel,
 *         shouldShowGroupSectionHeader, getGroupSectionHeaderValue.
 *
 * @module components/cometchat-groups/groups-utils
 */

import { describe, it, expect } from 'vitest';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import {
  getGroupMemberCountText,
  getGroupTypeDisplay,
  getGroupAriaLabel,
  shouldShowGroupSectionHeader,
  getGroupSectionHeaderValue,
} from './cometchat-groups.utils';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeGroup(guid: string, name: string, type: string, memberCount: number): CometChat.Group {
  const g = new CometChat.Group(guid, name, type as any, '');
  (g as any).membersCount = memberCount;
  (g as any).getMembersCount = () => memberCount;
  return g;
}

describe('cometchat-groups.utils', () => {

  // ==================== getGroupMemberCountText ====================

  describe('getGroupMemberCountText', () => {
    it('should return empty string for 0 members', () => {
      const g = makeGroup('g1', 'Test', CometChat.GROUP_TYPE.PUBLIC, 0);
      expect(getGroupMemberCountText(g)).toBe('');
    });

    it('should return empty string for negative count', () => {
      const g = makeGroup('g1', 'Test', CometChat.GROUP_TYPE.PUBLIC, -1);
      expect(getGroupMemberCountText(g)).toBe('');
    });

    it('should include the count in the result', () => {
      const g = makeGroup('g1', 'Test', CometChat.GROUP_TYPE.PUBLIC, 5);
      expect(getGroupMemberCountText(g)).toContain('5');
    });

    it('should return non-empty string for 1 member', () => {
      const g = makeGroup('g1', 'Test', CometChat.GROUP_TYPE.PUBLIC, 1);
      const result = getGroupMemberCountText(g);
      expect(result).toContain('1');
      expect(result.length).toBeGreaterThan(1);
    });

    it('should return non-empty string for multiple members', () => {
      const g = makeGroup('g1', 'Test', CometChat.GROUP_TYPE.PUBLIC, 10);
      const result = getGroupMemberCountText(g);
      expect(result).toContain('10');
    });
  });

  // ==================== getGroupTypeDisplay ====================

  describe('getGroupTypeDisplay', () => {
    it('should return a non-empty string for public group', () => {
      const g = makeGroup('g1', 'Test', CometChat.GROUP_TYPE.PUBLIC, 1);
      const result = getGroupTypeDisplay(g);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should return a non-empty string for private group', () => {
      const g = makeGroup('g1', 'Test', CometChat.GROUP_TYPE.PRIVATE, 1);
      const result = getGroupTypeDisplay(g);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should return a non-empty string for password group', () => {
      const g = makeGroup('g1', 'Test', CometChat.GROUP_TYPE.PASSWORD, 1);
      const result = getGroupTypeDisplay(g);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should return different strings for different types', () => {
      const pub = makeGroup('g1', 'Test', CometChat.GROUP_TYPE.PUBLIC, 1);
      const priv = makeGroup('g2', 'Test', CometChat.GROUP_TYPE.PRIVATE, 1);
      expect(getGroupTypeDisplay(pub)).not.toBe(getGroupTypeDisplay(priv));
    });

    it('should return the type itself for unknown type', () => {
      const g = makeGroup('g1', 'Test', 'custom_type', 1);
      const result = getGroupTypeDisplay(g);
      expect(result).toBe('custom_type');
    });
  });

  // ==================== getGroupAriaLabel ====================

  describe('getGroupAriaLabel', () => {
    it('should include group name in the label', () => {
      const g = makeGroup('g1', 'My Group', CometChat.GROUP_TYPE.PUBLIC, 5);
      const label = getGroupAriaLabel(g, false);
      expect(label).toContain('My Group');
    });

    it('should include member count in the label', () => {
      const g = makeGroup('g1', 'My Group', CometChat.GROUP_TYPE.PUBLIC, 5);
      const label = getGroupAriaLabel(g, false);
      expect(label).toContain('5');
    });

    it('should include group type when hideGroupType=false', () => {
      const g = makeGroup('g1', 'My Group', CometChat.GROUP_TYPE.PUBLIC, 5);
      const withType = getGroupAriaLabel(g, false);
      const withoutType = getGroupAriaLabel(g, true);
      expect(withType.length).toBeGreaterThan(withoutType.length);
    });

    it('should not include group type when hideGroupType=true', () => {
      const g = makeGroup('g1', 'My Group', CometChat.GROUP_TYPE.PUBLIC, 5);
      const label = getGroupAriaLabel(g, true);
      expect(label).toContain('My Group');
      expect(label).toContain('5');
    });
  });

  // ==================== shouldShowGroupSectionHeader ====================

  describe('shouldShowGroupSectionHeader', () => {
    it('should return false when showSectionHeader=false', () => {
      const groups = [makeGroup('g1', 'Alpha', CometChat.GROUP_TYPE.PUBLIC, 1)];
      expect(shouldShowGroupSectionHeader(groups, 0, false)).toBe(false);
    });

    it('should return false for empty list', () => {
      expect(shouldShowGroupSectionHeader([], 0, true)).toBe(false);
    });

    it('should return true for first item when showSectionHeader=true', () => {
      const groups = [makeGroup('g1', 'Alpha', CometChat.GROUP_TYPE.PUBLIC, 1)];
      expect(shouldShowGroupSectionHeader(groups, 0, true)).toBe(true);
    });

    it('should return false when consecutive groups have same first letter', () => {
      const groups = [
        makeGroup('g1', 'Alpha', CometChat.GROUP_TYPE.PUBLIC, 1),
        makeGroup('g2', 'Apex', CometChat.GROUP_TYPE.PUBLIC, 1),
      ];
      expect(shouldShowGroupSectionHeader(groups, 1, true)).toBe(false);
    });

    it('should return true when consecutive groups have different first letters', () => {
      const groups = [
        makeGroup('g1', 'Alpha', CometChat.GROUP_TYPE.PUBLIC, 1),
        makeGroup('g2', 'Beta', CometChat.GROUP_TYPE.PUBLIC, 1),
      ];
      expect(shouldShowGroupSectionHeader(groups, 1, true)).toBe(true);
    });
  });

  // ==================== getGroupSectionHeaderValue ====================

  describe('getGroupSectionHeaderValue', () => {
    it('should return the first letter of the group name uppercased', () => {
      const g = makeGroup('g1', 'alpha', CometChat.GROUP_TYPE.PUBLIC, 1);
      expect(getGroupSectionHeaderValue(g)).toBe('A');
    });

    it('should return # for group with empty name', () => {
      const g = makeGroup('g1', '', CometChat.GROUP_TYPE.PUBLIC, 1);
      expect(getGroupSectionHeaderValue(g)).toBe('#');
    });

    it('should handle uppercase names', () => {
      const g = makeGroup('g1', 'BETA', CometChat.GROUP_TYPE.PUBLIC, 1);
      expect(getGroupSectionHeaderValue(g)).toBe('B');
    });

    it('should return # for numeric names', () => {
      const g = makeGroup('g1', '123Group', CometChat.GROUP_TYPE.PUBLIC, 1);
      expect(getGroupSectionHeaderValue(g)).toBe('1');
    });
  });
});
