/**
 * GroupMemberUtils Unit Tests
 *
 * Categories: Standard Operations, Config Option Hiding, Owner Detection,
 *             Scope Change, Member Creation, Action Messages, Permission Matrix,
 *             Null/Invalid Handling, Boundary Inputs
 * Validates: Requirements 8.5, 8.6, 13.6, 14.4, 14.5, 15.7
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { ensureSdkReady, sdkCleanup } from '../test-setup';
import { GroupMemberUtils } from './GroupMemberUtils';
import { CometChatUIKitConstants } from '../constants';
import { CometChatOption } from '../modals/CometChatOption';

// ==================== Constants ====================

const SCOPES = CometChatUIKitConstants.groupMemberScope;
const MEMBER_OPTIONS = CometChatUIKitConstants.GroupMemberOptions;

// ==================== Test Helpers ====================

/** Creates a GroupMember with the given uid, scope, and optional name */
function mockGroupMember(uid: string, scope: string, name = `User-${uid}`): CometChat.GroupMember {
  const member = new CometChat.GroupMember(uid, scope as CometChat.GroupMemberScope);
  member.setName(name);
  member.setAvatar(`https://example.com/${uid}.png`);
  member.setStatus('online');
  return member;
}

/** Creates a Group with the given guid, owner UID, and logged-in user scope */
function mockGroup(guid: string, ownerUid: string, loggedInScope: string): CometChat.Group {
  const group = new CometChat.Group(guid, `Group-${guid}`, CometChat.GROUP_TYPE.PUBLIC);
  (group as any).owner = ownerUid;
  group.setScope(loggedInScope as CometChat.GroupMemberScope);
  group.getOwner = () => ownerUid;
  return group;
}

/** Creates a User with the given uid and optional name */
function mockUser(uid: string, name = `User-${uid}`): CometChat.User {
  const user = new CometChat.User(uid);
  user.setName(name);
  user.setAvatar(`https://example.com/${uid}.png`);
  user.setStatus('online');
  return user;
}

// ==================== Unit Tests ====================

describe('GroupMemberUtils', () => {
  beforeAll(async () => {
    await ensureSdkReady();
  });

  afterAll(async () => {
    await sdkCleanup();
  });

  // ---------- getViewMemberOptions ----------
  describe('getViewMemberOptions', () => {
    describe('Standard Operations', () => {
      it('returns owner scope string when target member is the group owner', () => {
        const group = mockGroup('g1', 'owner-uid', SCOPES.admin);
        const member = mockGroupMember('owner-uid', SCOPES.admin);
        const result = GroupMemberUtils.getViewMemberOptions(member, group, 'admin-uid');
        expect(result).toBe(SCOPES.owner);
      });

      it('returns kick/ban/changeScope options when owner acts on participant', () => {
        const group = mockGroup('g1', 'owner-uid', SCOPES.owner);
        const member = mockGroupMember('p1', SCOPES.participant);
        const result = GroupMemberUtils.getViewMemberOptions(member, group, 'owner-uid');
        expect(Array.isArray(result)).toBe(true);
        const ids = (result as CometChatOption[]).map(o => o.id);
        expect(ids).toContain(MEMBER_OPTIONS.kick);
        expect(ids).toContain(MEMBER_OPTIONS.ban);
        expect(ids).toContain(MEMBER_OPTIONS.changeScope);
      });

      it('returns kick/ban/changeScope options when owner acts on admin', () => {
        const group = mockGroup('g1', 'owner-uid', SCOPES.owner);
        const member = mockGroupMember('a1', SCOPES.admin);
        const result = GroupMemberUtils.getViewMemberOptions(member, group, 'owner-uid');
        expect(Array.isArray(result)).toBe(true);
        const ids = (result as CometChatOption[]).map(o => o.id);
        expect(ids).toContain(MEMBER_OPTIONS.kick);
        expect(ids).toContain(MEMBER_OPTIONS.ban);
        expect(ids).toContain(MEMBER_OPTIONS.changeScope);
      });

      it('returns kick/ban/changeScope options when owner acts on moderator', () => {
        const group = mockGroup('g1', 'owner-uid', SCOPES.owner);
        const member = mockGroupMember('m1', SCOPES.moderator);
        const result = GroupMemberUtils.getViewMemberOptions(member, group, 'owner-uid');
        expect(Array.isArray(result)).toBe(true);
        const ids = (result as CometChatOption[]).map(o => o.id);
        expect(ids).toContain(MEMBER_OPTIONS.kick);
        expect(ids).toContain(MEMBER_OPTIONS.ban);
        expect(ids).toContain(MEMBER_OPTIONS.changeScope);
      });

      it('returns kick/ban/changeScope when admin acts on participant', () => {
        const group = mockGroup('g1', 'someone-else', SCOPES.admin);
        const member = mockGroupMember('p1', SCOPES.participant);
        const result = GroupMemberUtils.getViewMemberOptions(member, group, 'admin-uid');
        expect(Array.isArray(result)).toBe(true);
        const ids = (result as CometChatOption[]).map(o => o.id);
        expect(ids).toContain(MEMBER_OPTIONS.kick);
        expect(ids).toContain(MEMBER_OPTIONS.ban);
        expect(ids).toContain(MEMBER_OPTIONS.changeScope);
      });

      it('returns kick/ban/changeScope when admin acts on moderator', () => {
        const group = mockGroup('g1', 'someone-else', SCOPES.admin);
        const member = mockGroupMember('m1', SCOPES.moderator);
        const result = GroupMemberUtils.getViewMemberOptions(member, group, 'admin-uid');
        expect(Array.isArray(result)).toBe(true);
        const ids = (result as CometChatOption[]).map(o => o.id);
        expect(ids).toContain(MEMBER_OPTIONS.kick);
        expect(ids).toContain(MEMBER_OPTIONS.ban);
        expect(ids).toContain(MEMBER_OPTIONS.changeScope);
      });

      it('returns changeScope only (no kick/ban) when admin acts on another admin', () => {
        const group = mockGroup('g1', 'someone-else', SCOPES.admin);
        const member = mockGroupMember('a2', SCOPES.admin);
        const result = GroupMemberUtils.getViewMemberOptions(member, group, 'admin-uid');
        expect(Array.isArray(result)).toBe(true);
        const ids = (result as CometChatOption[]).map(o => o.id);
        expect(ids).not.toContain(MEMBER_OPTIONS.kick);
        expect(ids).not.toContain(MEMBER_OPTIONS.ban);
        expect(ids).toContain(MEMBER_OPTIONS.changeScope);
      });

      it('returns kick/ban/changeScope when moderator acts on participant', () => {
        const group = mockGroup('g1', 'someone-else', SCOPES.moderator);
        const member = mockGroupMember('p1', SCOPES.participant);
        const result = GroupMemberUtils.getViewMemberOptions(member, group, 'mod-uid');
        expect(Array.isArray(result)).toBe(true);
        const ids = (result as CometChatOption[]).map(o => o.id);
        expect(ids).toContain(MEMBER_OPTIONS.kick);
        expect(ids).toContain(MEMBER_OPTIONS.ban);
        expect(ids).toContain(MEMBER_OPTIONS.changeScope);
      });

      it('returns scope string when moderator acts on another moderator', () => {
        const group = mockGroup('g1', 'someone-else', SCOPES.moderator);
        const member = mockGroupMember('m2', SCOPES.moderator);
        const result = GroupMemberUtils.getViewMemberOptions(member, group, 'mod-uid');
        expect(typeof result).toBe('string');
      });

      it('returns scope string when participant acts on participant', () => {
        const group = mockGroup('g1', 'someone-else', SCOPES.participant);
        const member = mockGroupMember('p2', SCOPES.participant);
        const result = GroupMemberUtils.getViewMemberOptions(member, group, 'p1');
        expect(typeof result).toBe('string');
      });

      it('returns scope string when participant acts on admin', () => {
        const group = mockGroup('g1', 'someone-else', SCOPES.participant);
        const member = mockGroupMember('a1', SCOPES.admin);
        const result = GroupMemberUtils.getViewMemberOptions(member, group, 'p1');
        expect(typeof result).toBe('string');
      });
    });

    describe('Config option hiding', () => {
      it('hides kick option when hideKickMemberOption is true', () => {
        const group = mockGroup('g1', 'owner-uid', SCOPES.owner);
        const member = mockGroupMember('p1', SCOPES.participant);
        const result = GroupMemberUtils.getViewMemberOptions(member, group, 'owner-uid', {
          hideKickMemberOption: true,
        });
        expect(Array.isArray(result)).toBe(true);
        const ids = (result as CometChatOption[]).map(o => o.id);
        expect(ids).not.toContain(MEMBER_OPTIONS.kick);
        expect(ids).toContain(MEMBER_OPTIONS.ban);
        expect(ids).toContain(MEMBER_OPTIONS.changeScope);
      });

      it('hides ban option when hideBanMemberOption is true', () => {
        const group = mockGroup('g1', 'owner-uid', SCOPES.owner);
        const member = mockGroupMember('p1', SCOPES.participant);
        const result = GroupMemberUtils.getViewMemberOptions(member, group, 'owner-uid', {
          hideBanMemberOption: true,
        });
        expect(Array.isArray(result)).toBe(true);
        const ids = (result as CometChatOption[]).map(o => o.id);
        expect(ids).toContain(MEMBER_OPTIONS.kick);
        expect(ids).not.toContain(MEMBER_OPTIONS.ban);
        expect(ids).toContain(MEMBER_OPTIONS.changeScope);
      });

      it('hides scope change option when hideScopeChangeOption is true', () => {
        const group = mockGroup('g1', 'owner-uid', SCOPES.owner);
        const member = mockGroupMember('p1', SCOPES.participant);
        const result = GroupMemberUtils.getViewMemberOptions(member, group, 'owner-uid', {
          hideScopeChangeOption: true,
        });
        expect(Array.isArray(result)).toBe(true);
        const ids = (result as CometChatOption[]).map(o => o.id);
        expect(ids).toContain(MEMBER_OPTIONS.kick);
        expect(ids).toContain(MEMBER_OPTIONS.ban);
        expect(ids).not.toContain(MEMBER_OPTIONS.changeScope);
      });

      it('returns scope string when all options are hidden', () => {
        const group = mockGroup('g1', 'owner-uid', SCOPES.owner);
        const member = mockGroupMember('p1', SCOPES.participant);
        const result = GroupMemberUtils.getViewMemberOptions(member, group, 'owner-uid', {
          hideKickMemberOption: true,
          hideBanMemberOption: true,
          hideScopeChangeOption: true,
        });
        expect(typeof result).toBe('string');
      });
    });

    describe('Owner detection via loggedInUserUid', () => {
      it('treats logged-in user as owner when their UID matches group owner', () => {
        const group = mockGroup('g1', 'owner-uid', SCOPES.admin);
        const member = mockGroupMember('p1', SCOPES.participant);
        const result = GroupMemberUtils.getViewMemberOptions(member, group, 'owner-uid');
        expect(Array.isArray(result)).toBe(true);
        const ids = (result as CometChatOption[]).map(o => o.id);
        expect(ids).toContain(MEMBER_OPTIONS.kick);
        expect(ids).toContain(MEMBER_OPTIONS.ban);
        expect(ids).toContain(MEMBER_OPTIONS.changeScope);
      });

      it('defaults loggedInUserUid to empty string when not provided', () => {
        const group = mockGroup('g1', 'someone-else', SCOPES.participant);
        const member = mockGroupMember('p2', SCOPES.participant);
        const result = GroupMemberUtils.getViewMemberOptions(member, group);
        expect(typeof result).toBe('string');
      });
    });

    describe('Null/Invalid Handling', () => {
      it('returns scope string for unknown permission key combination', () => {
        const group = mockGroup('g1', 'someone-else', 'unknownScope' as any);
        const member = mockGroupMember('p1', SCOPES.participant);
        const result = GroupMemberUtils.getViewMemberOptions(member, group, 'user1');
        expect(typeof result).toBe('string');
      });
    });
  });

  // ---------- allowScopeChange ----------
  describe('allowScopeChange', () => {
    describe('Standard Operations', () => {
      it('returns allowed scopes when admin acts on participant', () => {
        const group = mockGroup('g1', 'someone-else', SCOPES.admin);
        const member = mockGroupMember('p1', SCOPES.participant);
        const scopes = GroupMemberUtils.allowScopeChange(group, member);
        expect(scopes.length).toBeGreaterThan(0);
        expect(scopes).toContain(SCOPES.participant);
        expect(scopes).toContain(SCOPES.admin);
        expect(scopes).toContain(SCOPES.moderator);
      });

      it('returns allowed scopes when admin acts on moderator', () => {
        const group = mockGroup('g1', 'someone-else', SCOPES.admin);
        const member = mockGroupMember('m1', SCOPES.moderator);
        const scopes = GroupMemberUtils.allowScopeChange(group, member);
        expect(scopes.length).toBeGreaterThan(0);
        expect(scopes).toContain(SCOPES.moderator);
      });

      it('moves current member scope to front of the list', () => {
        const group = mockGroup('g1', 'someone-else', SCOPES.admin);
        const member = mockGroupMember('p1', SCOPES.participant);
        const scopes = GroupMemberUtils.allowScopeChange(group, member);
        expect(scopes[0]).toBe(SCOPES.participant);
      });

      it('moves moderator scope to front when member is moderator', () => {
        const group = mockGroup('g1', 'someone-else', SCOPES.admin);
        const member = mockGroupMember('m1', SCOPES.moderator);
        const scopes = GroupMemberUtils.allowScopeChange(group, member);
        expect(scopes[0]).toBe(SCOPES.moderator);
      });

      it('returns scopes for moderator acting on participant (no admin)', () => {
        const group = mockGroup('g1', 'someone-else', SCOPES.moderator);
        const member = mockGroupMember('p1', SCOPES.participant);
        const scopes = GroupMemberUtils.allowScopeChange(group, member);
        expect(scopes).toContain(SCOPES.participant);
        expect(scopes).toContain(SCOPES.moderator);
        expect(scopes).not.toContain(SCOPES.admin);
      });
    });

    describe('Boundary Inputs', () => {
      it('returns empty array when participant acts on participant', () => {
        const group = mockGroup('g1', 'someone-else', SCOPES.participant);
        const member = mockGroupMember('p2', SCOPES.participant);
        expect(GroupMemberUtils.allowScopeChange(group, member)).toEqual([]);
      });

      it('returns empty array when moderator acts on admin', () => {
        const group = mockGroup('g1', 'someone-else', SCOPES.moderator);
        const member = mockGroupMember('a1', SCOPES.admin);
        expect(GroupMemberUtils.allowScopeChange(group, member)).toEqual([]);
      });

      it('returns empty array when admin acts on owner', () => {
        const group = mockGroup('g1', 'owner-uid', SCOPES.admin);
        const member = mockGroupMember('owner-uid', SCOPES.owner);
        expect(GroupMemberUtils.allowScopeChange(group, member)).toEqual([]);
      });
    });

    describe('Null/Invalid Handling', () => {
      it('returns empty array for unknown permission key', () => {
        const group = mockGroup('g1', 'someone-else', 'unknownScope' as any);
        const member = mockGroupMember('p1', SCOPES.participant);
        expect(GroupMemberUtils.allowScopeChange(group, member)).toEqual([]);
      });

      it('does not mutate the original permission matrix across calls', () => {
        const group = mockGroup('g1', 'someone-else', SCOPES.admin);
        const member = mockGroupMember('p1', SCOPES.participant);
        const first = GroupMemberUtils.allowScopeChange(group, member);
        const second = GroupMemberUtils.allowScopeChange(group, member);
        expect(first).toEqual(second);
      });
    });
  });

  // ---------- createParticipantGroupMember ----------
  describe('createParticipantGroupMember', () => {
    it('creates a GroupMember with participant scope from a User', () => {
      const user = mockUser('u1', 'Alice');
      const group = mockGroup('g1', 'owner', SCOPES.admin);
      const member = GroupMemberUtils.createParticipantGroupMember(user, group);
      expect(member).toBeTruthy();
      expect(member.getUid()).toBe('u1');
      expect(member.getName()).toBe('Alice');
      expect(member.getScope()).toBe(SCOPES.participant);
    });

    it('copies avatar from user to group member', () => {
      const user = mockUser('u1', 'Alice');
      user.setAvatar('https://example.com/alice.png');
      const group = mockGroup('g1', 'owner', SCOPES.admin);
      const member = GroupMemberUtils.createParticipantGroupMember(user, group);
      expect(member.getAvatar()).toBe('https://example.com/alice.png');
    });

    it('copies status from user to group member', () => {
      const user = mockUser('u1', 'Alice');
      user.setStatus('online');
      const group = mockGroup('g1', 'owner', SCOPES.admin);
      const member = GroupMemberUtils.createParticipantGroupMember(user, group);
      expect(member.getStatus()).toBe('online');
    });

    it('sets the group GUID on the member', () => {
      const user = mockUser('u1', 'Alice');
      const group = mockGroup('g1', 'owner', SCOPES.admin);
      const member = GroupMemberUtils.createParticipantGroupMember(user, group);
      expect(member.getGuid()).toBe('g1');
    });

    it('handles user with special characters in name', () => {
      const user = mockUser('u1', 'Ñoño 日本語');
      const group = mockGroup('g1', 'owner', SCOPES.admin);
      const member = GroupMemberUtils.createParticipantGroupMember(user, group);
      expect(member.getName()).toBe('Ñoño 日本語');
    });
  });

  // ---------- createActionMessage ----------
  describe('createActionMessage', () => {
    it('creates an Action message with correct action type', () => {
      const actionOn = mockGroupMember('target', SCOPES.participant);
      const group = mockGroup('g1', 'owner', SCOPES.admin);
      const loggedInUser = mockUser('actor', 'Actor');
      const action = GroupMemberUtils.createActionMessage(actionOn, 'kicked', group, loggedInUser);
      expect(action).toBeTruthy();
      expect(action.getAction()).toBe('kicked');
    });

    it('sets the sender as the logged-in user', () => {
      const actionOn = mockGroupMember('target', SCOPES.participant);
      const group = mockGroup('g1', 'owner', SCOPES.admin);
      const loggedInUser = mockUser('actor', 'Actor');
      const action = GroupMemberUtils.createActionMessage(actionOn, 'kicked', group, loggedInUser);
      expect(action.getSender().getUid()).toBe('actor');
    });

    it('sets the message string with actor, action, and target', () => {
      const actionOn = mockGroupMember('target', SCOPES.participant);
      const group = mockGroup('g1', 'owner', SCOPES.admin);
      const loggedInUser = mockUser('actor', 'Actor');
      const action = GroupMemberUtils.createActionMessage(actionOn, 'kicked', group, loggedInUser);
      expect(action.getMessage()).toBe('actor kicked target');
    });

    it('sets conversationId as group_ prefix + guid', () => {
      const actionOn = mockGroupMember('target', SCOPES.participant);
      const group = mockGroup('g1', 'owner', SCOPES.admin);
      const loggedInUser = mockUser('actor', 'Actor');
      const action = GroupMemberUtils.createActionMessage(actionOn, 'kicked', group, loggedInUser);
      expect(action.getConversationId()).toBe('group_g1');
    });

    it('sets receiverType to group', () => {
      const actionOn = mockGroupMember('target', SCOPES.participant);
      const group = mockGroup('g1', 'owner', SCOPES.admin);
      const loggedInUser = mockUser('actor', 'Actor');
      const action = GroupMemberUtils.createActionMessage(actionOn, 'banned', group, loggedInUser);
      expect(action.getReceiverType()).toBe(CometChatUIKitConstants.MessageReceiverType.group);
    });

    it('sets data with scope information from target member', () => {
      const actionOn = mockGroupMember('target', SCOPES.moderator);
      const group = mockGroup('g1', 'owner', SCOPES.admin);
      const loggedInUser = mockUser('actor', 'Actor');
      const action = GroupMemberUtils.createActionMessage(
        actionOn,
        'scopeChanged',
        group,
        loggedInUser
      );
      const data = action.getData();
      expect(data).toBeTruthy();
      expect(data.extras.scope.new).toBe(SCOPES.moderator);
    });

    it('generates unique muid for each action message', () => {
      const actionOn = mockGroupMember('target', SCOPES.participant);
      const group = mockGroup('g1', 'owner', SCOPES.admin);
      const loggedInUser = mockUser('actor', 'Actor');
      const action1 = GroupMemberUtils.createActionMessage(actionOn, 'kicked', group, loggedInUser);
      const action2 = GroupMemberUtils.createActionMessage(actionOn, 'kicked', group, loggedInUser);
      expect(action1.getMuid()).toBeTruthy();
      expect(action2.getMuid()).toBeTruthy();
      expect(action1.getMuid()).not.toBe(action2.getMuid());
    });

    it('sets sentAt to a valid timestamp', () => {
      const actionOn = mockGroupMember('target', SCOPES.participant);
      const group = mockGroup('g1', 'owner', SCOPES.admin);
      const loggedInUser = mockUser('actor', 'Actor');
      const action = GroupMemberUtils.createActionMessage(actionOn, 'kicked', group, loggedInUser);
      expect(action.getSentAt()).toBeGreaterThan(0);
    });

    it('handles empty action string', () => {
      const actionOn = mockGroupMember('target', SCOPES.participant);
      const group = mockGroup('g1', 'owner', SCOPES.admin);
      const loggedInUser = mockUser('actor', 'Actor');
      const action = GroupMemberUtils.createActionMessage(actionOn, '', group, loggedInUser);
      expect(action.getMessage()).toBe('actor  target');
    });

    it('handles different action types (banned, scopeChanged)', () => {
      const actionOn = mockGroupMember('target', SCOPES.participant);
      const group = mockGroup('g1', 'owner', SCOPES.admin);
      const loggedInUser = mockUser('actor', 'Actor');

      const banned = GroupMemberUtils.createActionMessage(actionOn, 'banned', group, loggedInUser);
      expect(banned.getAction()).toBe('banned');
      expect(banned.getMessage()).toContain('banned');

      const scopeChanged = GroupMemberUtils.createActionMessage(
        actionOn,
        'scopeChanged',
        group,
        loggedInUser
      );
      expect(scopeChanged.getAction()).toBe('scopeChanged');
      expect(scopeChanged.getMessage()).toContain('scopeChanged');
    });
  });

  // ---------- Permission Matrix Completeness ----------
  describe('Permission Matrix', () => {
    const scopeHierarchy = [SCOPES.participant, SCOPES.moderator, SCOPES.admin, SCOPES.owner];

    it('owner cannot be acted upon (always returns owner scope string)', () => {
      for (const actorScope of [SCOPES.participant, SCOPES.moderator, SCOPES.admin, SCOPES.owner]) {
        const group = mockGroup('g1', 'owner-uid', actorScope);
        const ownerMember = mockGroupMember('owner-uid', SCOPES.owner);
        const result = GroupMemberUtils.getViewMemberOptions(ownerMember, group, 'actor-uid');
        expect(result).toBe(SCOPES.owner);
      }
    });

    it('participant has no actions on any scope', () => {
      for (const targetScope of scopeHierarchy) {
        const group = mockGroup('g1', 'someone-else', SCOPES.participant);
        const member = mockGroupMember('target', targetScope);
        const result = GroupMemberUtils.getViewMemberOptions(member, group, 'participant-uid');
        expect(typeof result).toBe('string');
      }
    });

    it('moderator can kick/ban participant but not moderator/admin/owner', () => {
      const group = mockGroup('g1', 'someone-else', SCOPES.moderator);

      const participant = mockGroupMember('p1', SCOPES.participant);
      const pResult = GroupMemberUtils.getViewMemberOptions(participant, group, 'mod-uid');
      expect(Array.isArray(pResult)).toBe(true);
      const pIds = (pResult as CometChatOption[]).map(o => o.id);
      expect(pIds).toContain(MEMBER_OPTIONS.kick);
      expect(pIds).toContain(MEMBER_OPTIONS.ban);

      const mod = mockGroupMember('m2', SCOPES.moderator);
      expect(typeof GroupMemberUtils.getViewMemberOptions(mod, group, 'mod-uid')).toBe('string');

      const admin = mockGroupMember('a1', SCOPES.admin);
      expect(typeof GroupMemberUtils.getViewMemberOptions(admin, group, 'mod-uid')).toBe('string');
    });

    it('admin can kick/ban participant and moderator but not admin or owner', () => {
      const group = mockGroup('g1', 'someone-else', SCOPES.admin);

      const participant = mockGroupMember('p1', SCOPES.participant);
      const pResult = GroupMemberUtils.getViewMemberOptions(
        participant,
        group,
        'admin-uid'
      ) as CometChatOption[];
      expect(pResult.map(o => o.id)).toContain(MEMBER_OPTIONS.kick);

      const mod = mockGroupMember('m1', SCOPES.moderator);
      const mResult = GroupMemberUtils.getViewMemberOptions(
        mod,
        group,
        'admin-uid'
      ) as CometChatOption[];
      expect(mResult.map(o => o.id)).toContain(MEMBER_OPTIONS.kick);

      const admin2 = mockGroupMember('a2', SCOPES.admin);
      const aResult = GroupMemberUtils.getViewMemberOptions(
        admin2,
        group,
        'admin-uid'
      ) as CometChatOption[];
      const aIds = aResult.map(o => o.id);
      expect(aIds).not.toContain(MEMBER_OPTIONS.kick);
      expect(aIds).not.toContain(MEMBER_OPTIONS.ban);
      expect(aIds).toContain(MEMBER_OPTIONS.changeScope);
    });
  });
});
