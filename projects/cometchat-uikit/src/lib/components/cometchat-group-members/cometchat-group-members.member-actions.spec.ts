/**
 * CometChatGroupMembers — Member Actions & Scope Change
 *
 * Covers the member action menu (`handleActionOnGroupMember`, `onOptionClick`,
 * `getOptionsForMember`, `hasActionOptions`, `getAllowedScopes`) and the
 * change-scope flow (`onScopeChanged`, `onChangeScopeClose`).
 *
 * The component declares `GroupMembersService` as a component-level provider,
 * so the data layer is swapped out with `TestBed.overrideComponent` rather than
 * a root provider — the component injector would otherwise win and every path
 * here would bail out waiting on a live SDK session.
 *
 * @module components/cometchat-group-members
 */

// The real Calls SDK reaches for JitsiMeetJS, which does not exist in jsdom.
vi.mock('@cometchat/calls-sdk-javascript', () => ({
  CometChatCalls: {
    init: vi.fn().mockResolvedValue(true),
    generateToken: vi.fn().mockResolvedValue({ token: 'mock-token' }),
  },
}));

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { signal, WritableSignal } from '@angular/core';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatGroupMembersComponent } from './cometchat-group-members.component';
import { GroupMembersService } from '../../services/group-members.service';
import { GroupMemberUtils } from '../../utils/GroupMemberUtils';
import { CometChatOption } from '../../modals/CometChatOption';
import { CometChatLogger } from '../../utils/CometChatLogger';
import { CometChatUIKitConstants } from '../../constants';
import { SelectionMode, States } from '../../Enums/Enums';
import { SelectionState } from '../../modals/SelectionState';

const SCOPES = CometChatUIKitConstants.groupMemberScope;
const MEMBER_OPTIONS = CometChatUIKitConstants.GroupMemberOptions;

// ---------------------------------------------------------------------------
// Test data — the SDK model classes are plain data holders, no network.
// ---------------------------------------------------------------------------

/** A group whose owner is `ownerUid` and whose logged-in-user scope is `scope`. */
function makeGroup(
  guid = 'g1',
  ownerUid = 'owner-uid',
  scope: string = SCOPES.admin
): CometChat.Group {
  const group = new CometChat.Group(guid, `Group-${guid}`, CometChat.GROUP_TYPE.PUBLIC);
  group.setScope(scope as CometChat.GroupMemberScope);
  group.getOwner = () => ownerUid;
  return group;
}

/** A group member with the given uid and scope. */
function makeMember(uid = 'bob', scope: string = SCOPES.participant): CometChat.GroupMember {
  const member = new CometChat.GroupMember(uid, scope as CometChat.GroupMemberScope);
  member.setName(`User-${uid}`);
  return member;
}

/** The logged-in user. */
function makeUser(uid = 'admin-uid'): CometChat.User {
  const user = new CometChat.User(uid);
  user.setName(`User-${uid}`);
  return user;
}

// ---------------------------------------------------------------------------
// Service double
// ---------------------------------------------------------------------------

/**
 * The component reads `members`, `fetchState` and `hasMore` as signals, so they
 * are backed by writable signals a test can push state into.
 */
interface MockGroupMembersService {
  members: WritableSignal<CometChat.GroupMember[]>;
  fetchState: WritableSignal<States>;
  hasMore: WritableSignal<boolean>;
  initialize: ReturnType<typeof vi.fn>;
  cleanup: ReturnType<typeof vi.fn>;
  attachListeners: ReturnType<typeof vi.fn>;
  detachListeners: ReturnType<typeof vi.fn>;
  setErrorCallback: ReturnType<typeof vi.fn>;
  fetchNext: ReturnType<typeof vi.fn>;
  search: ReturnType<typeof vi.fn>;
  removeMember: ReturnType<typeof vi.fn>;
  updateMemberScopeInList: ReturnType<typeof vi.fn>;
  appendMember: ReturnType<typeof vi.fn>;
  kickMember: ReturnType<typeof vi.fn>;
  banMember: ReturnType<typeof vi.fn>;
  updateMemberScope: ReturnType<typeof vi.fn>;
}

function makeService(members: CometChat.GroupMember[] = []): MockGroupMembersService {
  return {
    members: signal<CometChat.GroupMember[]>(members),
    fetchState: signal<States>(States.loaded),
    hasMore: signal<boolean>(true),
    initialize: vi.fn(),
    cleanup: vi.fn(),
    attachListeners: vi.fn(),
    detachListeners: vi.fn(),
    setErrorCallback: vi.fn(),
    fetchNext: vi.fn().mockResolvedValue(undefined),
    search: vi.fn(),
    removeMember: vi.fn(),
    updateMemberScopeInList: vi.fn(),
    appendMember: vi.fn(),
    kickMember: vi.fn().mockResolvedValue(undefined),
    banMember: vi.fn().mockResolvedValue(undefined),
    updateMemberScope: vi.fn().mockResolvedValue(undefined),
  };
}

describe('CometChatGroupMembersComponent — member actions', () => {
  let fixture: ComponentFixture<CometChatGroupMembersComponent>;
  let c: CometChatGroupMembersComponent;
  let service: MockGroupMembersService;

  const group = makeGroup();
  const member = makeMember();

  /** Lets queued `.then`/`.catch` callbacks run before assertions. */
  const flush = async () => {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  };

  async function build(
    opts: { group?: CometChat.Group; members?: CometChat.GroupMember[] } = {}
  ): Promise<void> {
    service = makeService(opts.members ?? []);

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ imports: [CometChatGroupMembersComponent] });
    // Component-level provider — only an override on the component itself wins.
    TestBed.overrideComponent(CometChatGroupMembersComponent, {
      set: { providers: [{ provide: GroupMembersService, useValue: service }] },
    });
    await TestBed.compileComponents();

    fixture = TestBed.createComponent(CometChatGroupMembersComponent);
    c = fixture.componentInstance;
    // Inputs must land before the first change detection run.
    if ('group' in opts) {
      if (opts.group) c.group = opts.group;
    } else {
      c.group = group;
    }
    fixture.detectChanges();
    c.loggedInUser.set(makeUser());
  }

  beforeEach(async () => {
    // ngOnInit resolves the logged-in user through the SDK; keep it off the wire.
    vi.spyOn(CometChat, 'getLoggedinUser').mockResolvedValue(makeUser());
    await build();
  });

  afterEach(() => {
    // CometChatGroupEvents subjects are static and shared — an undestroyed
    // fixture keeps reacting and skews call counts in later tests.
    fixture?.destroy();
    vi.restoreAllMocks();
  });

  // -------------------------------------------------------------------------
  // Service override wiring — if this fails nothing else below is meaningful
  // -------------------------------------------------------------------------

  describe('Service override', () => {
    it('injects the mocked service into the component', () => {
      expect(service.initialize).toHaveBeenCalledWith(group, undefined);
      expect(service.attachListeners).toHaveBeenCalledWith('g1', false);
    });

    it('reads its member list from the mocked service signal', async () => {
      await build({ members: [makeMember('bob'), makeMember('carol')] });
      c.selectionMode = SelectionMode.multiple;
      const states: SelectionState[] = [];
      c.selectionChange.subscribe(s => states.push(s));

      // selectAll walks groupMembersService.members(), so the uids it emits can
      // only have come from the signal the mock was built with.
      c.selectAll();

      expect([...states[0].selectedIds]).toEqual(['bob', 'carol']);
    });

    it('never touches the real service', () => {
      expect((c as any).groupMembersService).toBe(service);
      expect((c as any).groupMembersService instanceof GroupMembersService).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // handleActionOnGroupMember
  // -------------------------------------------------------------------------

  describe('handleActionOnGroupMember', () => {
    it('does nothing without a group', async () => {
      await build({ group: undefined });
      c.handleActionOnGroupMember(new CometChatOption({ id: MEMBER_OPTIONS.kick }), member);

      expect(service.kickMember).not.toHaveBeenCalled();
      expect(service.banMember).not.toHaveBeenCalled();
      expect(c.memberToChangeScope()).toBeNull();
    });

    it('kicks the member through the service', () => {
      c.handleActionOnGroupMember(new CometChatOption({ id: MEMBER_OPTIONS.kick }), member);
      expect(service.kickMember).toHaveBeenCalledWith(group, member);
    });

    it('emits empty once the kick resolves and no members remain', async () => {
      const empty = vi.fn();
      c.empty.subscribe(empty);

      c.handleActionOnGroupMember(new CometChatOption({ id: MEMBER_OPTIONS.kick }), member);
      expect(empty).not.toHaveBeenCalled();
      await flush();

      expect(empty).toHaveBeenCalledTimes(1);
    });

    it('does not emit empty after a kick when members remain', async () => {
      await build({ members: [makeMember('carol')] });
      const empty = vi.fn();
      c.empty.subscribe(empty);

      c.handleActionOnGroupMember(new CometChatOption({ id: MEMBER_OPTIONS.kick }), member);
      await flush();

      expect(empty).not.toHaveBeenCalled();
    });

    it('bans the member through the service', () => {
      c.handleActionOnGroupMember(new CometChatOption({ id: MEMBER_OPTIONS.ban }), member);
      expect(service.banMember).toHaveBeenCalledWith(group, member);
      expect(service.kickMember).not.toHaveBeenCalled();
    });

    it('emits empty once the ban resolves and no members remain', async () => {
      const empty = vi.fn();
      c.empty.subscribe(empty);

      c.handleActionOnGroupMember(new CometChatOption({ id: MEMBER_OPTIONS.ban }), member);
      await flush();

      expect(empty).toHaveBeenCalledTimes(1);
    });

    it('does not emit empty after a ban when members remain', async () => {
      await build({ members: [makeMember('carol')] });
      const empty = vi.fn();
      c.empty.subscribe(empty);

      c.handleActionOnGroupMember(new CometChatOption({ id: MEMBER_OPTIONS.ban }), member);
      await flush();

      expect(empty).not.toHaveBeenCalled();
    });

    it('stages the member for a scope change without calling the service', () => {
      c.handleActionOnGroupMember(new CometChatOption({ id: MEMBER_OPTIONS.changeScope }), member);

      expect(c.memberToChangeScope()).toBe(member);
      expect(service.kickMember).not.toHaveBeenCalled();
      expect(service.banMember).not.toHaveBeenCalled();
      expect(service.updateMemberScope).not.toHaveBeenCalled();
    });

    it('runs the onClick of an unrecognised option', () => {
      const onClick = vi.fn();
      c.handleActionOnGroupMember(new CometChatOption({ id: 'viewProfile', onClick }), member);

      expect(onClick).toHaveBeenCalledTimes(1);
      expect(service.kickMember).not.toHaveBeenCalled();
    });

    it('treats unban as an unrecognised option and runs its onClick', () => {
      const onClick = vi.fn();
      c.handleActionOnGroupMember(new CometChatOption({ id: MEMBER_OPTIONS.unban, onClick }), member);

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('is a no-op for an unrecognised option with no onClick', () => {
      expect(() =>
        c.handleActionOnGroupMember(new CometChatOption({ id: 'unknown-id' }), member)
      ).not.toThrow();

      expect(service.kickMember).not.toHaveBeenCalled();
      expect(service.banMember).not.toHaveBeenCalled();
      expect(c.memberToChangeScope()).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // onOptionClick
  // -------------------------------------------------------------------------

  describe('onOptionClick', () => {
    it('delegates a real CometChatOption instance', () => {
      const spy = vi.spyOn(c, 'handleActionOnGroupMember');
      const option = new CometChatOption({ id: MEMBER_OPTIONS.kick });

      c.onOptionClick(option, member);

      expect(spy).toHaveBeenCalledWith(option, member);
      expect(service.kickMember).toHaveBeenCalledWith(group, member);
    });

    it('delegates a plain object that merely carries an id', () => {
      const spy = vi.spyOn(c, 'handleActionOnGroupMember');
      const option = { id: MEMBER_OPTIONS.ban } as CometChatOption;

      c.onOptionClick(option, member);

      expect(spy).toHaveBeenCalledWith(option, member);
      expect(service.banMember).toHaveBeenCalledWith(group, member);
    });

    it('ignores an object that is neither an instance nor carries an id', () => {
      const spy = vi.spyOn(c, 'handleActionOnGroupMember');

      c.onOptionClick({ title: 'no id here' } as CometChatOption, member);

      expect(spy).not.toHaveBeenCalled();
      expect(c.memberToChangeScope()).toBeNull();
    });

    it('delegates a CometChatOption instance even when its id is empty', () => {
      const spy = vi.spyOn(c, 'handleActionOnGroupMember');
      const option = new CometChatOption({});

      c.onOptionClick(option, member);

      expect(spy).toHaveBeenCalledWith(option, member);
    });
  });

  // -------------------------------------------------------------------------
  // getOptionsForMember
  // -------------------------------------------------------------------------

  describe('getOptionsForMember', () => {
    it('returns the scope string when there is no logged-in user', () => {
      c.loggedInUser.set(null);
      expect(c.getOptionsForMember(member)).toBe(SCOPES.participant);
    });

    it('returns the scope string when there is no group', async () => {
      await build({ group: undefined });
      c.loggedInUser.set(makeUser());

      expect(c.getOptionsForMember(member)).toBe(SCOPES.participant);
    });

    it('returns a custom options function result verbatim', () => {
      const custom = [new CometChatOption({ id: 'custom', title: 'Custom' })];
      c.options = () => custom;

      expect(c.getOptionsForMember(member)).toBe(custom);
    });

    it('does not consult the permission matrix when custom options succeed', () => {
      const spy = vi.spyOn(GroupMemberUtils, 'getViewMemberOptions');
      c.options = () => [new CometChatOption({ id: 'custom' })];

      c.getOptionsForMember(member);

      expect(spy).not.toHaveBeenCalled();
    });

    it('receives the group and member in the custom options function', () => {
      const custom = vi.fn().mockReturnValue([]);
      c.options = custom;

      c.getOptionsForMember(member);

      expect(custom).toHaveBeenCalledWith(group, member);
    });

    it('logs when the custom options function throws', () => {
      const logged = vi.spyOn(CometChatLogger, 'error').mockImplementation(() => undefined);
      c.options = () => {
        throw new Error('boom');
      };

      c.getOptionsForMember(member);

      expect(logged).toHaveBeenCalled();
      expect(logged.mock.calls[0][0]).toBe('CometChatGroupMembers');
    });

    it('emits a CUSTOM_OPTIONS_ERROR exception when the custom options function throws', () => {
      vi.spyOn(CometChatLogger, 'error').mockImplementation(() => undefined);
      const errors: CometChat.CometChatException[] = [];
      c.error.subscribe(e => errors.push(e));
      c.options = () => {
        throw new Error('boom');
      };

      c.getOptionsForMember(member);

      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe('CUSTOM_OPTIONS_ERROR');
      expect(errors[0].details).toContain('boom');
    });

    it('falls through to the default options when the custom options function throws', () => {
      vi.spyOn(CometChatLogger, 'error').mockImplementation(() => undefined);
      const fallback = [new CometChatOption({ id: MEMBER_OPTIONS.kick })];
      const spy = vi.spyOn(GroupMemberUtils, 'getViewMemberOptions').mockReturnValue(fallback);
      c.options = () => {
        throw new Error('boom');
      };

      expect(c.getOptionsForMember(member)).toBe(fallback);
      expect(spy).toHaveBeenCalled();
    });

    it('builds the default options from the permission matrix', () => {
      const spy = vi.spyOn(GroupMemberUtils, 'getViewMemberOptions');

      const result = c.getOptionsForMember(member);

      expect(spy).toHaveBeenCalledWith(member, group, 'admin-uid', {
        hideKickMemberOption: false,
        hideBanMemberOption: false,
        hideScopeChangeOption: false,
      });
      expect(Array.isArray(result)).toBe(true);
      expect((result as CometChatOption[]).map(o => o.id)).toEqual([
        MEMBER_OPTIONS.kick,
        MEMBER_OPTIONS.ban,
        MEMBER_OPTIONS.changeScope,
      ]);
    });

    it('passes the hide* flags through to the permission matrix', () => {
      const spy = vi.spyOn(GroupMemberUtils, 'getViewMemberOptions');
      c.hideKickMemberOption = true;
      c.hideBanMemberOption = true;
      c.hideScopeChangeOption = true;

      c.getOptionsForMember(member);

      expect(spy).toHaveBeenCalledWith(member, group, 'admin-uid', {
        hideKickMemberOption: true,
        hideBanMemberOption: true,
        hideScopeChangeOption: true,
      });
    });

    it('drops the kick option when hideKickMemberOption is set', () => {
      c.hideKickMemberOption = true;

      const result = c.getOptionsForMember(member) as CometChatOption[];

      expect(result.map(o => o.id)).toEqual([MEMBER_OPTIONS.ban, MEMBER_OPTIONS.changeScope]);
    });
  });

  // -------------------------------------------------------------------------
  // hasActionOptions
  // -------------------------------------------------------------------------

  describe('hasActionOptions', () => {
    it('is true for an options array', () => {
      expect(c.hasActionOptions([new CometChatOption({ id: MEMBER_OPTIONS.kick })])).toBe(true);
    });

    it('is false for a scope string', () => {
      expect(c.hasActionOptions(SCOPES.owner)).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // getAllowedScopes
  // -------------------------------------------------------------------------

  describe('getAllowedScopes', () => {
    it('delegates to the permission matrix when a group is present', () => {
      const allowed = [SCOPES.participant, SCOPES.admin];
      const spy = vi.spyOn(GroupMemberUtils, 'allowScopeChange').mockReturnValue(allowed);

      expect(c.getAllowedScopes(member)).toBe(allowed);
      expect(spy).toHaveBeenCalledWith(group, member);
    });

    it('returns the real allowed scopes for an admin acting on a participant', () => {
      expect(c.getAllowedScopes(member)).toEqual([
        SCOPES.participant,
        SCOPES.admin,
        SCOPES.moderator,
      ]);
    });

    it('returns an empty list when there is no group', async () => {
      await build({ group: undefined });
      expect(c.getAllowedScopes(member)).toEqual([]);
    });
  });

  // -------------------------------------------------------------------------
  // onScopeChanged
  // -------------------------------------------------------------------------

  describe('onScopeChanged', () => {
    beforeEach(() => {
      (c as any).changeScopeRef = { setSuccess: vi.fn(), setError: vi.fn() };
    });

    it('does nothing when no member is staged', () => {
      c.onScopeChanged(SCOPES.admin);
      expect(service.updateMemberScope).not.toHaveBeenCalled();
    });

    it('does nothing when there is no group', async () => {
      await build({ group: undefined });
      (c as any).changeScopeRef = { setSuccess: vi.fn(), setError: vi.fn() };
      c.memberToChangeScope.set(member);

      c.onScopeChanged(SCOPES.admin);

      expect(service.updateMemberScope).not.toHaveBeenCalled();
    });

    it('sends the new scope to the service', () => {
      c.memberToChangeScope.set(member);
      c.onScopeChanged(SCOPES.moderator);

      expect(service.updateMemberScope).toHaveBeenCalledWith(group, member, SCOPES.moderator);
    });

    it('reports success and clears the staged member when the update resolves', async () => {
      c.memberToChangeScope.set(member);

      c.onScopeChanged(SCOPES.admin);
      await flush();

      expect((c as any).changeScopeRef.setSuccess).toHaveBeenCalledTimes(1);
      expect((c as any).changeScopeRef.setError).not.toHaveBeenCalled();
      expect(c.memberToChangeScope()).toBeNull();
    });

    it('reports an error and keeps the staged member when the update rejects', async () => {
      service.updateMemberScope.mockRejectedValue(new Error('denied'));
      c.memberToChangeScope.set(member);

      c.onScopeChanged(SCOPES.admin);
      await flush();

      expect((c as any).changeScopeRef.setError).toHaveBeenCalledTimes(1);
      expect((c as any).changeScopeRef.setSuccess).not.toHaveBeenCalled();
      expect(c.memberToChangeScope()).toBe(member);
    });

    it('still clears the staged member on success with no change-scope view attached', async () => {
      (c as any).changeScopeRef = undefined;
      c.memberToChangeScope.set(member);

      c.onScopeChanged(SCOPES.admin);
      await flush();

      expect(c.memberToChangeScope()).toBeNull();
    });

    it('survives a rejection with no change-scope view attached', async () => {
      (c as any).changeScopeRef = undefined;
      service.updateMemberScope.mockRejectedValue(new Error('denied'));
      c.memberToChangeScope.set(member);

      c.onScopeChanged(SCOPES.admin);
      await flush();

      expect(c.memberToChangeScope()).toBe(member);
    });
  });

  // -------------------------------------------------------------------------
  // onChangeScopeClose
  // -------------------------------------------------------------------------

  describe('onChangeScopeClose', () => {
    it('clears the staged member', () => {
      c.memberToChangeScope.set(member);
      c.onChangeScopeClose();

      expect(c.memberToChangeScope()).toBeNull();
      expect(service.updateMemberScope).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // Whole scope-change flow
  // -------------------------------------------------------------------------

  describe('Change-scope flow', () => {
    it('stages, updates and clears across the full flow', async () => {
      (c as any).changeScopeRef = { setSuccess: vi.fn(), setError: vi.fn() };

      c.onOptionClick(new CometChatOption({ id: MEMBER_OPTIONS.changeScope }), member);
      expect(c.memberToChangeScope()).toBe(member);
      expect(c.getAllowedScopes(c.memberToChangeScope()!)).toContain(SCOPES.moderator);

      c.onScopeChanged(SCOPES.moderator);
      await flush();

      expect(service.updateMemberScope).toHaveBeenCalledWith(group, member, SCOPES.moderator);
      expect(c.memberToChangeScope()).toBeNull();
    });

    it('abandons the flow when the modal is dismissed instead', () => {
      c.onOptionClick(new CometChatOption({ id: MEMBER_OPTIONS.changeScope }), member);
      c.onChangeScopeClose();
      c.onScopeChanged(SCOPES.moderator);

      expect(service.updateMemberScope).not.toHaveBeenCalled();
    });
  });
});
