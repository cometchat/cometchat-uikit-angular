/**
 * CometChatGroupMembers — UI Kit group event subscriptions
 *
 * Covers `setupGroupEventSubscriptions`: the four UI Kit level subjects the
 * component listens to (member kicked, banned, scope changed, added), the guid
 * guard that fronts each one, and the teardown that drops all four.
 *
 * Two things make these handlers testable without a live SDK session:
 *
 * 1. `GroupMembersService` is declared in the component's own `providers`, so a
 *    root-level TestBed provider would be shadowed by the component injector
 *    and the real service would still run. It is therefore replaced with
 *    `TestBed.overrideComponent`. The `test harness integrity` block below
 *    asserts the swap actually took effect, because every other test in this
 *    file is meaningless if it did not.
 * 2. The double's mutators really mutate its `members` signal, mirroring the
 *    real service. Inert `vi.fn()` stubs would let a test claim "the last
 *    member was removed" while the list had been empty the whole time.
 *
 * @module components/cometchat-group-members
 */

vi.mock('@cometchat/calls-sdk-javascript', () => ({
  CometChatCalls: {
    init: vi.fn().mockResolvedValue(true),
    generateToken: vi.fn().mockResolvedValue({ token: 'mock-token' }),
  },
}));

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ChangeDetectorRef, signal, WritableSignal } from '@angular/core';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { config as rxjsConfig } from 'rxjs';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatGroupMembersComponent } from './cometchat-group-members.component';
import { CometChatGroupMemberItemComponent } from '../cometchat-group-member-item/cometchat-group-member-item.component';
import { GroupMembersService } from '../../services/group-members.service';
import {
  CometChatGroupEvents,
  IGroupMemberAdded,
  IGroupMemberKickedBanned,
  IGroupMemberScopeChanged,
} from '../../events/CometChatGroupEvents';
import { States } from '../../Enums/Enums';
import { CometChatUIKitConstants } from '../../constants';

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const GUID = 'guid-1';
const OTHER_GUID = 'guid-other';
const PARTICIPANT = CometChatUIKitConstants.groupMemberScope.participant;

function makeGroup(guid: string): CometChat.Group {
  return new CometChat.Group(guid, `Group ${guid}`, CometChat.GROUP_TYPE.PUBLIC);
}

function makeUser(uid: string): CometChat.User {
  const user = new CometChat.User(uid);
  user.setName(`User ${uid}`);
  return user;
}

function makeMember(uid: string, scope: string = PARTICIPANT): CometChat.GroupMember {
  const member = new CometChat.GroupMember(uid, scope as CometChat.GroupMemberScope);
  member.setName(`Member ${uid}`);
  member.setGuid(GUID);
  return member;
}

/**
 * `kickedFrom` is deliberately allowed to be undefined — the component guards
 * it with `?.`, and that arm is a real branch worth driving.
 */
function kickedBannedPayload(
  kickedUser: CometChat.User,
  kickedFrom: CometChat.Group | undefined
): IGroupMemberKickedBanned {
  return {
    message: undefined,
    kickedFrom,
    kickedUser,
    kickedBy: makeUser('admin'),
  } as unknown as IGroupMemberKickedBanned;
}

function scopeChangedPayload(
  updatedUser: CometChat.GroupMember,
  group: CometChat.Group | undefined,
  scopeChangedTo: string = CometChat.GROUP_MEMBER_SCOPE.MODERATOR
): IGroupMemberScopeChanged {
  return {
    message: undefined,
    updatedUser,
    scopeChangedTo,
    scopeChangedFrom: PARTICIPANT,
    group,
  } as unknown as IGroupMemberScopeChanged;
}

function memberAddedPayload(
  usersAdded: CometChat.User[],
  userAddedIn: CometChat.Group | undefined
): IGroupMemberAdded {
  return {
    messages: [],
    usersAdded,
    userAddedIn,
    userAddedBy: makeUser('admin'),
  } as unknown as IGroupMemberAdded;
}

// ---------------------------------------------------------------------------
// Service double
// ---------------------------------------------------------------------------

/**
 * The component reads `members`, `fetchState` and `hasMore` as signals, so the
 * double backs them with writable signals a test can drive.
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

/**
 * The three list mutators behave like the real service — filter by uid, set the
 * scope of the matching entry, append unless the uid is already present — so a
 * test can assert the list the component actually ends up showing rather than
 * only the call it made.
 */
function makeService(initialMembers: CometChat.GroupMember[] = []): MockGroupMembersService {
  const members = signal<CometChat.GroupMember[]>([...initialMembers]);
  return {
    members,
    fetchState: signal<States>(States.loaded),
    hasMore: signal<boolean>(true),
    initialize: vi.fn(),
    cleanup: vi.fn(),
    attachListeners: vi.fn(),
    detachListeners: vi.fn(),
    setErrorCallback: vi.fn(),
    fetchNext: vi.fn().mockResolvedValue(undefined),
    search: vi.fn(),
    removeMember: vi.fn((uid: string) => {
      members.set(members().filter(m => m.getUid() !== uid));
    }),
    updateMemberScopeInList: vi.fn((uid: string, scope: CometChat.GroupMemberScope) => {
      const next = [...members()];
      const index = next.findIndex(m => m.getUid() === uid);
      if (index === -1) return;
      next[index].setScope(scope);
      members.set(next);
    }),
    appendMember: vi.fn((member: CometChat.GroupMember) => {
      if (members().some(m => m.getUid() === member.getUid())) return;
      members.set([...members(), member]);
    }),
    kickMember: vi.fn().mockResolvedValue(undefined),
    banMember: vi.fn().mockResolvedValue(undefined),
    updateMemberScope: vi.fn().mockResolvedValue(undefined),
  };
}

describe('CometChatGroupMembersComponent — group event subscriptions', () => {
  let fixture: ComponentFixture<CometChatGroupMembersComponent>;
  let c: CometChatGroupMembersComponent;
  let service: MockGroupMembersService;
  let emptyEmissions: number;

  /**
   * Builds the component with the mocked data layer. The member item template
   * is stubbed down to the uid and scope it was handed, so the list rendering
   * can be asserted without dragging the real item component (avatar, context
   * menu, localisation) into these tests.
   */
  async function build(
    members: CometChat.GroupMember[] = [],
    guid: string = GUID
  ): Promise<void> {
    service = makeService(members);

    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [CometChatGroupMembersComponent],
    })
      .overrideComponent(CometChatGroupMembersComponent, {
        set: { providers: [{ provide: GroupMembersService, useValue: service }] },
      })
      .overrideComponent(CometChatGroupMemberItemComponent, {
        set: {
          template: '<span class="stub-member-item">{{ member.getUid() }}:{{ member.getScope() }}</span>',
          styles: [],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(CometChatGroupMembersComponent);
    c = fixture.componentInstance;
    // Inputs must be set before the first detectChanges or Angular reports
    // NG0100 for the change it did not see coming.
    c.group = makeGroup(guid);

    emptyEmissions = 0;
    c.empty.subscribe(() => emptyEmissions++);

    fixture.detectChanges();
  }

  /** `uid:scope` for every member the template actually rendered. */
  function rendered(): string[] {
    fixture.detectChanges();
    return Array.from(
      fixture.nativeElement.querySelectorAll('.stub-member-item') as NodeListOf<HTMLElement>
    ).map(el => el.textContent!.trim());
  }

  /** `uid:scope` for every member held in the service the component drives. */
  function listed(): string[] {
    return service.members().map(m => `${m.getUid()}:${m.getScope()}`);
  }

  /**
   * Each handler ends in `markForCheck`. The fixture's own `detectChanges`
   * checks the root view whether or not it was marked, so a dropped
   * `markForCheck` is invisible in the DOM here while it would stop the list
   * refreshing inside a real OnPush host. It is therefore asserted directly.
   */
  function watchMarkForCheck(): ReturnType<typeof vi.spyOn> {
    const cdr = (c as unknown as { cdr: ChangeDetectorRef }).cdr;
    return vi.spyOn(cdr, 'markForCheck');
  }

  /**
   * An exception thrown inside a subject subscriber does not propagate out of
   * `next()` — rxjs hands it to its unhandled-error reporter on a later tick.
   * Collecting from there is the only way a test can tell "handled and ignored"
   * apart from "blew up and swallowed".
   */
  async function collectRxjsErrors(emit: () => void): Promise<unknown[]> {
    const reported: unknown[] = [];
    const previous = rxjsConfig.onUnhandledError;
    rxjsConfig.onUnhandledError = err => reported.push(err);
    try {
      emit();
      await new Promise(resolve => setTimeout(resolve, 0));
    } finally {
      rxjsConfig.onUnhandledError = previous;
    }
    return reported;
  }

  beforeEach(() => {
    // Without a live session this rejects; the component only logs that, but the
    // resolved stub keeps the console quiet and the promise settled.
    vi.spyOn(CometChat, 'getLoggedinUser').mockResolvedValue(null);
  });

  afterEach(() => {
    // The subjects are static and shared, so a surviving fixture would keep
    // handling events from later tests and drift every call count.
    fixture?.destroy();
    vi.restoreAllMocks();
  });

  // -------------------------------------------------------------------------
  // Harness integrity — without this the rest of the file proves nothing
  // -------------------------------------------------------------------------

  describe('test harness integrity', () => {
    it('resolves the mocked service from the component injector', async () => {
      await build();

      // Reading the component's own reference is the direct proof; the calls
      // confirm the component drove this instance and not a second one.
      expect((c as unknown as { groupMembersService: unknown }).groupMembersService).toBe(service);
      expect(service.initialize).toHaveBeenCalledTimes(1);
      expect(service.initialize).toHaveBeenCalledWith(c.group, undefined);
      expect(service.setErrorCallback).toHaveBeenCalledTimes(1);
      expect(service.attachListeners).toHaveBeenCalledWith(GUID, false);
    });

    it('renders members from the mock signal, at build time and after', async () => {
      await build([makeMember('alice')]);

      expect(rendered()).toEqual([`alice:${PARTICIPANT}`]);

      service.members.set([makeMember('alice'), makeMember('bob', CometChat.GROUP_MEMBER_SCOPE.ADMIN)]);

      expect(rendered()).toEqual([
        `alice:${PARTICIPANT}`,
        `bob:${CometChat.GROUP_MEMBER_SCOPE.ADMIN}`,
      ]);
    });
  });

  // -------------------------------------------------------------------------
  // ccGroupMemberKicked
  // -------------------------------------------------------------------------

  describe('ccGroupMemberKicked', () => {
    it('drops the kicked member and keeps the rest', async () => {
      await build([makeMember('alice'), makeMember('bob')]);
      const markForCheck = watchMarkForCheck();

      CometChatGroupEvents.ccGroupMemberKicked.next(
        kickedBannedPayload(makeUser('alice'), makeGroup(GUID))
      );

      expect(markForCheck).toHaveBeenCalled();
      expect(service.removeMember).toHaveBeenCalledTimes(1);
      expect(service.removeMember).toHaveBeenCalledWith('alice');
      expect(rendered()).toEqual([`bob:${PARTICIPANT}`]);
      expect(emptyEmissions).toBe(0);
    });

    it('reports empty once the kicked member was the last one', async () => {
      await build([makeMember('alice')]);

      CometChatGroupEvents.ccGroupMemberKicked.next(
        kickedBannedPayload(makeUser('alice'), makeGroup(GUID))
      );

      expect(rendered()).toEqual([]);
      expect(emptyEmissions).toBe(1);
    });

    it('ignores a kick from a different group', async () => {
      await build([makeMember('alice'), makeMember('bob')]);

      CometChatGroupEvents.ccGroupMemberKicked.next(
        kickedBannedPayload(makeUser('alice'), makeGroup(OTHER_GUID))
      );

      expect(service.removeMember).not.toHaveBeenCalled();
      expect(rendered()).toEqual([`alice:${PARTICIPANT}`, `bob:${PARTICIPANT}`]);
      expect(emptyEmissions).toBe(0);
    });

    it('ignores a kick with no source group', async () => {
      await build([makeMember('alice')]);

      CometChatGroupEvents.ccGroupMemberKicked.next(
        kickedBannedPayload(makeUser('alice'), undefined)
      );

      expect(service.removeMember).not.toHaveBeenCalled();
      expect(rendered()).toEqual([`alice:${PARTICIPANT}`]);
    });
  });

  // -------------------------------------------------------------------------
  // ccGroupMemberBanned — a separate subscription with the same shape
  // -------------------------------------------------------------------------

  describe('ccGroupMemberBanned', () => {
    it('drops the banned member and keeps the rest', async () => {
      await build([makeMember('carol'), makeMember('bob')]);
      const markForCheck = watchMarkForCheck();

      CometChatGroupEvents.ccGroupMemberBanned.next(
        kickedBannedPayload(makeUser('carol'), makeGroup(GUID))
      );

      expect(markForCheck).toHaveBeenCalled();
      expect(service.removeMember).toHaveBeenCalledTimes(1);
      expect(service.removeMember).toHaveBeenCalledWith('carol');
      expect(rendered()).toEqual([`bob:${PARTICIPANT}`]);
      expect(emptyEmissions).toBe(0);
    });

    it('reports empty once the banned member was the last one', async () => {
      await build([makeMember('carol')]);

      CometChatGroupEvents.ccGroupMemberBanned.next(
        kickedBannedPayload(makeUser('carol'), makeGroup(GUID))
      );

      expect(rendered()).toEqual([]);
      expect(emptyEmissions).toBe(1);
    });

    it('ignores a ban from a different group', async () => {
      await build([makeMember('carol'), makeMember('bob')]);

      CometChatGroupEvents.ccGroupMemberBanned.next(
        kickedBannedPayload(makeUser('carol'), makeGroup(OTHER_GUID))
      );

      expect(service.removeMember).not.toHaveBeenCalled();
      expect(rendered()).toEqual([`carol:${PARTICIPANT}`, `bob:${PARTICIPANT}`]);
      expect(emptyEmissions).toBe(0);
    });

    it('ignores a ban with no source group', async () => {
      await build([makeMember('carol')]);

      CometChatGroupEvents.ccGroupMemberBanned.next(
        kickedBannedPayload(makeUser('carol'), undefined)
      );

      expect(service.removeMember).not.toHaveBeenCalled();
      expect(rendered()).toEqual([`carol:${PARTICIPANT}`]);
    });
  });

  // -------------------------------------------------------------------------
  // ccGroupMemberScopeChanged
  // -------------------------------------------------------------------------

  describe('ccGroupMemberScopeChanged', () => {
    it('applies the scope the event carries to the matching member', async () => {
      await build([makeMember('dave'), makeMember('erin')]);
      const markForCheck = watchMarkForCheck();

      // Moderator rather than the first scope in the enum, so a handler that
      // passed a fixed scope through would fail here.
      CometChatGroupEvents.ccGroupMemberScopeChanged.next(
        scopeChangedPayload(
          makeMember('dave'),
          makeGroup(GUID),
          CometChat.GROUP_MEMBER_SCOPE.MODERATOR
        )
      );

      expect(markForCheck).toHaveBeenCalled();
      expect(service.updateMemberScopeInList).toHaveBeenCalledTimes(1);
      expect(service.updateMemberScopeInList).toHaveBeenCalledWith(
        'dave',
        CometChat.GROUP_MEMBER_SCOPE.MODERATOR
      );
      expect(listed()).toEqual([
        `dave:${CometChat.GROUP_MEMBER_SCOPE.MODERATOR}`,
        `erin:${PARTICIPANT}`,
      ]);
    });

    it('does not add or remove members on a scope change', async () => {
      await build([makeMember('dave'), makeMember('erin')]);

      CometChatGroupEvents.ccGroupMemberScopeChanged.next(
        scopeChangedPayload(makeMember('dave'), makeGroup(GUID))
      );

      expect(service.removeMember).not.toHaveBeenCalled();
      expect(service.appendMember).not.toHaveBeenCalled();
      expect(service.members().map(m => m.getUid())).toEqual(['dave', 'erin']);
    });

    it('ignores a scope change in a different group', async () => {
      await build([makeMember('dave')]);

      CometChatGroupEvents.ccGroupMemberScopeChanged.next(
        scopeChangedPayload(makeMember('dave'), makeGroup(OTHER_GUID))
      );

      expect(service.updateMemberScopeInList).not.toHaveBeenCalled();
      expect(listed()).toEqual([`dave:${PARTICIPANT}`]);
    });

    it('ignores a scope change with no group', async () => {
      await build([makeMember('dave')]);

      CometChatGroupEvents.ccGroupMemberScopeChanged.next(
        scopeChangedPayload(makeMember('dave'), undefined)
      );

      expect(service.updateMemberScopeInList).not.toHaveBeenCalled();
      expect(listed()).toEqual([`dave:${PARTICIPANT}`]);
    });
  });

  // -------------------------------------------------------------------------
  // ccGroupMemberAdded
  // -------------------------------------------------------------------------

  describe('ccGroupMemberAdded', () => {
    it('appends one participant of this group per added user', async () => {
      await build();
      const markForCheck = watchMarkForCheck();

      CometChatGroupEvents.ccGroupMemberAdded.next(
        memberAddedPayload([makeUser('u1'), makeUser('u2')], makeGroup(GUID))
      );

      expect(markForCheck).toHaveBeenCalled();
      expect(service.appendMember).toHaveBeenCalledTimes(2);

      const appended = service.appendMember.mock.calls.map(
        call => call[0] as CometChat.GroupMember
      );
      expect(appended.map(m => m.getUid())).toEqual(['u1', 'u2']);
      expect(appended.map(m => m.getName())).toEqual(['User u1', 'User u2']);
      appended.forEach(member => {
        expect(member.getGuid()).toBe(GUID);
        expect(member.getScope()).toBe(PARTICIPANT);
      });
      expect(rendered()).toEqual([`u1:${PARTICIPANT}`, `u2:${PARTICIPANT}`]);
    });

    it('appends after the members already in the list', async () => {
      await build([makeMember('alice')]);

      CometChatGroupEvents.ccGroupMemberAdded.next(
        memberAddedPayload([makeUser('u1')], makeGroup(GUID))
      );

      expect(service.appendMember).toHaveBeenCalledTimes(1);
      expect(rendered()).toEqual([`alice:${PARTICIPANT}`, `u1:${PARTICIPANT}`]);
    });

    it('ignores users added to a different group', async () => {
      await build([makeMember('alice')]);

      CometChatGroupEvents.ccGroupMemberAdded.next(
        memberAddedPayload([makeUser('u1')], makeGroup(OTHER_GUID))
      );

      expect(service.appendMember).not.toHaveBeenCalled();
      expect(rendered()).toEqual([`alice:${PARTICIPANT}`]);
    });

    it('ignores an add event with no target group', async () => {
      await build([makeMember('alice')]);

      // Without the guid guard this payload makes member creation read a
      // missing group and throw, which also appends nothing — so "nothing was
      // appended" alone would not tell the two apart.
      const errors = await collectRxjsErrors(() =>
        CometChatGroupEvents.ccGroupMemberAdded.next(
          memberAddedPayload([makeUser('u1')], undefined)
        )
      );

      expect(errors).toEqual([]);
      expect(service.appendMember).not.toHaveBeenCalled();
      expect(rendered()).toEqual([`alice:${PARTICIPANT}`]);
    });

    it('leaves the list alone when a matching event carries no users', async () => {
      await build([makeMember('alice')]);

      CometChatGroupEvents.ccGroupMemberAdded.next(memberAddedPayload([], makeGroup(GUID)));

      expect(service.appendMember).not.toHaveBeenCalled();
      expect(rendered()).toEqual([`alice:${PARTICIPANT}`]);
    });
  });

  // -------------------------------------------------------------------------
  // Teardown — takeUntilDestroyed must drop all four subscriptions
  // -------------------------------------------------------------------------

  describe('teardown', () => {
    it('stops handling all four events after destroy', async () => {
      await build([makeMember('alice'), makeMember('dave')]);

      fixture.destroy();

      CometChatGroupEvents.ccGroupMemberKicked.next(
        kickedBannedPayload(makeUser('alice'), makeGroup(GUID))
      );
      CometChatGroupEvents.ccGroupMemberBanned.next(
        kickedBannedPayload(makeUser('dave'), makeGroup(GUID))
      );
      CometChatGroupEvents.ccGroupMemberScopeChanged.next(
        scopeChangedPayload(makeMember('dave'), makeGroup(GUID))
      );
      CometChatGroupEvents.ccGroupMemberAdded.next(
        memberAddedPayload([makeUser('u1')], makeGroup(GUID))
      );

      expect(service.removeMember).not.toHaveBeenCalled();
      expect(service.updateMemberScopeInList).not.toHaveBeenCalled();
      expect(service.appendMember).not.toHaveBeenCalled();
      expect(listed()).toEqual([`alice:${PARTICIPANT}`, `dave:${PARTICIPANT}`]);
      expect(emptyEmissions).toBe(0);
    });
  });
});
