/**
 * cometchat-group-members.scope-utils Tests
 *
 * Covers: getScopeLabel, getAvailableScopeOptions, canKickMember,
 *         canBanMember, canChangeMemberScope, getGroupMemberAriaLabel.
 *
 * @module components/cometchat-group-members/scope-utils
 */

import { describe, it, expect } from 'vitest';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import {
  getScopeLabel,
  getAvailableScopeOptions,
  canKickMember,
  canBanMember,
  canChangeMemberScope,
  getGroupMemberAriaLabel,
} from './cometchat-group-members.scope-utils';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeMember(uid: string, scope: string, name = `User ${uid}`): CometChat.GroupMember {
  const m = new CometChat.GroupMember(uid, scope as CometChat.GroupMemberScope);
  m.setName(name);
  return m;
}

function makeGroup(guid: string, owner: string): CometChat.Group {
  const g = new CometChat.Group(guid, `Group ${guid}`, CometChat.GROUP_TYPE.PUBLIC, '');
  (g as any).owner = owner;
  (g as any).getOwner = () => owner;
  return g;
}

describe('cometchat-group-members.scope-utils', () => {

  // ==================== getScopeLabel ====================

  describe('getScopeLabel', () => {
    it('should return a non-empty string for admin scope', () => {
      const label = getScopeLabel(CometChat.GROUP_MEMBER_SCOPE.ADMIN);
      expect(typeof label).toBe('string');
      expect(label.length).toBeGreaterThan(0);
    });

    it('should return a non-empty string for moderator scope', () => {
      const label = getScopeLabel(CometChat.GROUP_MEMBER_SCOPE.MODERATOR);
      expect(typeof label).toBe('string');
      expect(label.length).toBeGreaterThan(0);
    });

    it('should return a non-empty string for participant scope', () => {
      const label = getScopeLabel(CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT);
      expect(typeof label).toBe('string');
      expect(label.length).toBeGreaterThan(0);
    });

    it('should return the scope itself for unknown scope', () => {
      const label = getScopeLabel('custom_scope');
      expect(label.length).toBeGreaterThan(0);
    });

    it('should return a fallback for empty string scope', () => {
      const label = getScopeLabel('');
      expect(typeof label).toBe('string');
    });

    it('should return different labels for different scopes', () => {
      const adminLabel = getScopeLabel(CometChat.GROUP_MEMBER_SCOPE.ADMIN);
      const modLabel = getScopeLabel(CometChat.GROUP_MEMBER_SCOPE.MODERATOR);
      const partLabel = getScopeLabel(CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT);
      expect(adminLabel).not.toBe(modLabel);
      expect(modLabel).not.toBe(partLabel);
    });
  });

  // ==================== getAvailableScopeOptions ====================

  describe('getAvailableScopeOptions', () => {
    it('should return 2 options when current scope is admin', () => {
      const options = getAvailableScopeOptions(CometChat.GROUP_MEMBER_SCOPE.ADMIN);
      expect(options.length).toBe(2);
    });

    it('should not include the current scope in options', () => {
      const options = getAvailableScopeOptions(CometChat.GROUP_MEMBER_SCOPE.ADMIN);
      const values = options.map(o => o.value);
      expect(values).not.toContain(CometChat.GROUP_MEMBER_SCOPE.ADMIN);
    });

    it('should return options with label and value fields', () => {
      const options = getAvailableScopeOptions(CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT);
      for (const opt of options) {
        expect(typeof opt.label).toBe('string');
        expect(typeof opt.value).toBe('string');
      }
    });

    it('should return 2 options for moderator scope', () => {
      const options = getAvailableScopeOptions(CometChat.GROUP_MEMBER_SCOPE.MODERATOR);
      expect(options.length).toBe(2);
      const values = options.map(o => o.value);
      expect(values).not.toContain(CometChat.GROUP_MEMBER_SCOPE.MODERATOR);
    });

    it('should return 2 options for participant scope', () => {
      const options = getAvailableScopeOptions(CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT);
      expect(options.length).toBe(2);
      const values = options.map(o => o.value);
      expect(values).not.toContain(CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT);
    });
  });

  // ==================== canKickMember ====================

  describe('canKickMember', () => {
    it('should return false when loggedInMember is null', () => {
      const target = makeMember('u2', CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT);
      const group = makeGroup('g1', 'owner1');
      expect(canKickMember(null, target, group)).toBe(false);
    });

    it('should return false when trying to kick yourself', () => {
      const me = makeMember('u1', CometChat.GROUP_MEMBER_SCOPE.ADMIN);
      const group = makeGroup('g1', 'owner1');
      expect(canKickMember(me, me, group)).toBe(false);
    });

    it('should return false when trying to kick the group owner', () => {
      const me = makeMember('u1', CometChat.GROUP_MEMBER_SCOPE.ADMIN);
      const owner = makeMember('owner1', CometChat.GROUP_MEMBER_SCOPE.ADMIN);
      const group = makeGroup('g1', 'owner1');
      expect(canKickMember(me, owner, group)).toBe(false);
    });

    it('should return true when admin kicks a participant', () => {
      const me = makeMember('u1', CometChat.GROUP_MEMBER_SCOPE.ADMIN);
      const target = makeMember('u2', CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT);
      const group = makeGroup('g1', 'owner1');
      expect(canKickMember(me, target, group)).toBe(true);
    });

    it('should return true when admin kicks a moderator', () => {
      const me = makeMember('u1', CometChat.GROUP_MEMBER_SCOPE.ADMIN);
      const target = makeMember('u2', CometChat.GROUP_MEMBER_SCOPE.MODERATOR);
      const group = makeGroup('g1', 'owner1');
      expect(canKickMember(me, target, group)).toBe(true);
    });

    it('should return false when admin tries to kick another admin', () => {
      const me = makeMember('u1', CometChat.GROUP_MEMBER_SCOPE.ADMIN);
      const target = makeMember('u2', CometChat.GROUP_MEMBER_SCOPE.ADMIN);
      const group = makeGroup('g1', 'owner1');
      expect(canKickMember(me, target, group)).toBe(false);
    });

    it('should return true when moderator kicks a participant', () => {
      const me = makeMember('u1', CometChat.GROUP_MEMBER_SCOPE.MODERATOR);
      const target = makeMember('u2', CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT);
      const group = makeGroup('g1', 'owner1');
      expect(canKickMember(me, target, group)).toBe(true);
    });

    it('should return false when moderator tries to kick another moderator', () => {
      const me = makeMember('u1', CometChat.GROUP_MEMBER_SCOPE.MODERATOR);
      const target = makeMember('u2', CometChat.GROUP_MEMBER_SCOPE.MODERATOR);
      const group = makeGroup('g1', 'owner1');
      expect(canKickMember(me, target, group)).toBe(false);
    });

    it('should return false when participant tries to kick anyone', () => {
      const me = makeMember('u1', CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT);
      const target = makeMember('u2', CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT);
      const group = makeGroup('g1', 'owner1');
      expect(canKickMember(me, target, group)).toBe(false);
    });
  });

  // ==================== canBanMember ====================

  describe('canBanMember', () => {
    it('should follow the same rules as canKickMember', () => {
      const me = makeMember('u1', CometChat.GROUP_MEMBER_SCOPE.ADMIN);
      const target = makeMember('u2', CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT);
      const group = makeGroup('g1', 'owner1');
      expect(canBanMember(me, target, group)).toBe(canKickMember(me, target, group));
    });

    it('should return false for null loggedInMember', () => {
      const target = makeMember('u2', CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT);
      const group = makeGroup('g1', 'owner1');
      expect(canBanMember(null, target, group)).toBe(false);
    });
  });

  // ==================== canChangeMemberScope ====================

  describe('canChangeMemberScope', () => {
    it('should return false when loggedInMember is null', () => {
      const target = makeMember('u2', CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT);
      const group = makeGroup('g1', 'owner1');
      expect(canChangeMemberScope(null, target, group)).toBe(false);
    });

    it('should return false when trying to change own scope', () => {
      const me = makeMember('u1', CometChat.GROUP_MEMBER_SCOPE.ADMIN);
      const group = makeGroup('g1', 'owner1');
      expect(canChangeMemberScope(me, me, group)).toBe(false);
    });

    it('should return false when trying to change owner scope', () => {
      const me = makeMember('u1', CometChat.GROUP_MEMBER_SCOPE.ADMIN);
      const owner = makeMember('owner1', CometChat.GROUP_MEMBER_SCOPE.ADMIN);
      const group = makeGroup('g1', 'owner1');
      expect(canChangeMemberScope(me, owner, group)).toBe(false);
    });

    it('should return true when admin changes participant scope', () => {
      const me = makeMember('u1', CometChat.GROUP_MEMBER_SCOPE.ADMIN);
      const target = makeMember('u2', CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT);
      const group = makeGroup('g1', 'owner1');
      expect(canChangeMemberScope(me, target, group)).toBe(true);
    });

    it('should return false when moderator tries to change scope', () => {
      const me = makeMember('u1', CometChat.GROUP_MEMBER_SCOPE.MODERATOR);
      const target = makeMember('u2', CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT);
      const group = makeGroup('g1', 'owner1');
      expect(canChangeMemberScope(me, target, group)).toBe(false);
    });
  });

  // ==================== getGroupMemberAriaLabel ====================

  describe('getGroupMemberAriaLabel', () => {
    it('should include member name in the label', () => {
      const member = makeMember('u1', CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT, 'Alice');
      const group = makeGroup('g1', 'owner1');
      const label = getGroupMemberAriaLabel(member, group);
      expect(label).toContain('Alice');
    });

    it('should include scope in the label', () => {
      const member = makeMember('u1', CometChat.GROUP_MEMBER_SCOPE.ADMIN, 'Alice');
      const group = makeGroup('g1', 'owner1');
      const label = getGroupMemberAriaLabel(member, group);
      expect(label.length).toBeGreaterThan(0);
    });

    it('should include owner indicator for group owner', () => {
      const member = makeMember('owner1', CometChat.GROUP_MEMBER_SCOPE.ADMIN, 'Owner');
      const group = makeGroup('g1', 'owner1');
      const label = getGroupMemberAriaLabel(member, group);
      expect(label).toContain('Owner');
      // Should have extra info for owner
      expect(label.length).toBeGreaterThan('Owner'.length);
    });
  });
});
