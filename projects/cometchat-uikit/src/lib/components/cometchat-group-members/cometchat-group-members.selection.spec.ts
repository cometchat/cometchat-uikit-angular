/**
 * CometChatGroupMembers — Item Click & Selection Model Tests
 *
 * Covers onItemClick, handleContextMenu, handleSelectionChange (single,
 * multiple, shift-click range, none), selectRange, emitSelectionChange,
 * handleSelectionControlChange, isMemberSelected, selectAll and
 * clearSelection.
 *
 * The component declares GroupMembersService as a component-level provider,
 * so the data layer is replaced by overriding the component itself. That
 * keeps every selection path reachable without a live SDK session — with the
 * real service the list stays empty and the handlers bail out early.
 *
 * @module components/cometchat-group-members
 */

// The calls SDK reaches for JitsiMeetJS at import time, which does not exist
// in jsdom. Nothing in the selection model touches calling.
vi.mock('@cometchat/calls-sdk-javascript', () => ({
  CometChatCalls: {
    init: vi.fn().mockResolvedValue(true),
    generateToken: vi.fn().mockResolvedValue({ token: 'mock-token' }),
  },
}));

// The two selection helpers are wrapped rather than replaced: the real
// behaviour still runs, and the recorded arguments prove the component
// delegates instead of re-implementing the logic. Plain wrapper functions
// (not vi.fn) so no mock reset can strip the implementation.
const utilCalls = vi.hoisted(() => ({
  selectMemberRange: [] as unknown[][],
  emitMemberSelectionChange: [] as unknown[][],
}));

vi.mock('./cometchat-group-members.utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./cometchat-group-members.utils')>();
  return {
    ...actual,
    selectMemberRange: (...args: Parameters<typeof actual.selectMemberRange>) => {
      utilCalls.selectMemberRange.push(args);
      return actual.selectMemberRange(...args);
    },
    emitMemberSelectionChange: (...args: Parameters<typeof actual.emitMemberSelectionChange>) => {
      utilCalls.emitMemberSelectionChange.push(args);
      return actual.emitMemberSelectionChange(...args);
    },
  };
});

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { signal, WritableSignal } from '@angular/core';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatGroupMembersComponent } from './cometchat-group-members.component';
import { GroupMembersService } from '../../services/group-members.service';
import { SelectionMode, States } from '../../Enums/Enums';
import { SelectionState } from '../../modals/SelectionState';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeGroup(guid = 'group-1'): CometChat.Group {
  return new CometChat.Group(guid, `Group ${guid}`, CometChat.GROUP_TYPE.PUBLIC, '');
}

function makeMember(uid: string): CometChat.GroupMember {
  const m = new CometChat.GroupMember(uid, CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT);
  m.setName(`User ${uid}`);
  return m;
}

function makeMembers(uids: string[]): CometChat.GroupMember[] {
  return uids.map(makeMember);
}

// ---------------------------------------------------------------------------
// Service double
// ---------------------------------------------------------------------------

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

function makeService(): MockGroupMembersService {
  return {
    members: signal<CometChat.GroupMember[]>([]),
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

describe('CometChatGroupMembersComponent — selection', () => {
  let fixture: ComponentFixture<CometChatGroupMembersComponent>;
  let c: CometChatGroupMembersComponent;
  let service: MockGroupMembersService;
  let group: CometChat.Group;
  let selectionEvents: SelectionState[];
  let itemClicks: CometChat.GroupMember[];

  const uids = ['alice', 'bob', 'carol', 'dave'];

  /**
   * Builds the component against the mocked service.
   *
   * Pass `renderMembers` to seed the list before the first change detection,
   * so the member rows really render and can be clicked. Logic-only tests
   * leave it out and push members in afterwards with `withMembers`, which
   * skips the member-item subtree entirely (OnPush, no further
   * detectChanges) and keeps those tests fast.
   */
  async function build(mode: SelectionMode = SelectionMode.none, renderMembers?: CometChat.GroupMember[]): Promise<void> {
    service = makeService();
    group = makeGroup();

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ imports: [CometChatGroupMembersComponent] });
    TestBed.overrideComponent(CometChatGroupMembersComponent, {
      set: { providers: [{ provide: GroupMembersService, useValue: service }] },
    });
    await TestBed.compileComponents();

    if (renderMembers) service.members.set(renderMembers);

    fixture = TestBed.createComponent(CometChatGroupMembersComponent);
    c = fixture.componentInstance;
    c.group = group;
    c.selectionMode = mode;

    selectionEvents = [];
    itemClicks = [];
    c.selectionChange.subscribe((s: SelectionState) => selectionEvents.push(s));
    c.itemClick.subscribe((m: CometChat.GroupMember) => itemClicks.push(m));

    fixture.detectChanges();
  }

  /** Puts members into the service signal without re-rendering the list. */
  function withMembers(list: CometChat.GroupMember[]): CometChat.GroupMember[] {
    service.members.set(list);
    return list;
  }

  /** The rendered member rows, in list order. */
  const rows = (): HTMLElement[] => Array.from(fixture.nativeElement.querySelectorAll('cometchat-group-member-item'));
  /** What a row tells assistive tech about its selection state. */
  const rowSelected = (index: number): boolean =>
    rows()[index].querySelector('[role="option"]')!.getAttribute('aria-selected') === 'true';
  const rowBody = (index: number): HTMLElement => rows()[index].firstElementChild as HTMLElement;
  const rowCheckbox = (index: number): HTMLInputElement | null =>
    rows()[index].querySelector('cometchat-checkbox input');
  const rowRadio = (index: number): HTMLInputElement | null =>
    rows()[index].querySelector('cometchat-radio-button input');

  const selectedIds = () => Array.from((c as unknown as { selectedMembers: Set<string> }).selectedMembers);
  const lastIndex = () => (c as unknown as { lastSelectedIndex: () => number }).lastSelectedIndex();
  const last = <T>(arr: T[]): T => arr[arr.length - 1];

  beforeEach(async () => {
    utilCalls.selectMemberRange.length = 0;
    utilCalls.emitMemberSelectionChange.length = 0;
    // Without a session this rejects; the component only logs, but stubbing it
    // keeps the noise out of every test.
    try {
      vi.spyOn(CometChat, 'getLoggedinUser').mockResolvedValue(null as unknown as CometChat.User);
    } catch {
      // Older SDK builds expose a non-configurable static; the component
      // already swallows the rejection, so carry on.
    }
    await build();
  });

  afterEach(() => {
    // CometChatGroupEvents subjects are static and shared, so a surviving
    // fixture would keep handling events from later tests.
    fixture?.destroy();
    vi.restoreAllMocks();
  });

  // -------------------------------------------------------------------------
  // Service override sanity — if this fails nothing else below is meaningful
  // -------------------------------------------------------------------------

  describe('Service override', () => {
    it('injects the mock in place of the component-level provider', () => {
      // GroupMembersService is declared in the @Component decorator, so a root
      // TestBed provider would be ignored. Identity plus the recorded calls
      // prove the override replaced the component's own provider.
      expect((c as unknown as { groupMembersService: unknown }).groupMembersService).toBe(service);
      expect(service.initialize).toHaveBeenCalledWith(group, undefined);
      expect(service.attachListeners).toHaveBeenCalledWith(group.getGuid(), false);
      expect(service.setErrorCallback).toHaveBeenCalledTimes(1);
    });

    it('resolves member positions out of the mock signal', async () => {
      await build(SelectionMode.multiple);
      const members = withMembers(makeMembers(uids));

      c.handleSelectionChange(members[2]);

      // Index 2 can only come from the four members pushed into the mock
      // signal; the real service would leave the list empty and yield -1.
      expect(lastIndex()).toBe(2);
      expect(last(selectionEvents).lastSelectedId).toBe('carol');
    });

    it('renders a row per member in the mock signal', async () => {
      await build(SelectionMode.none, makeMembers(uids));

      expect(rows()).toHaveLength(4);
      // The names come from the members put into the mock signal, in its order.
      expect(rows().map(r => r.querySelector('[role="option"]')!.getAttribute('aria-label')))
        .toEqual(uids.map(uid => expect.stringContaining(`User ${uid}`)));
    });
  });

  // -------------------------------------------------------------------------
  // onItemClick
  // -------------------------------------------------------------------------

  describe('onItemClick', () => {
    it('emits itemClick and selects nothing in none mode', async () => {
      const members = withMembers(makeMembers(uids));

      c.onItemClick(members[1]);

      expect(itemClicks).toEqual([members[1]]);
      expect(selectedIds()).toEqual([]);
      expect(c.isMemberSelected(members[1])).toBe(false);
    });

    it('selects instead of emitting itemClick in single mode', async () => {
      await build(SelectionMode.single);
      const members = withMembers(makeMembers(uids));

      c.onItemClick(members[0]);

      expect(itemClicks).toEqual([]);
      expect(c.isMemberSelected(members[0])).toBe(true);
    });

    it('selects instead of emitting itemClick in multiple mode', async () => {
      await build(SelectionMode.multiple);
      const members = withMembers(makeMembers(uids));

      c.onItemClick(members[2]);

      expect(itemClicks).toEqual([]);
      expect(selectedIds()).toEqual(['carol']);
    });
  });

  // -------------------------------------------------------------------------
  // handleContextMenu
  // -------------------------------------------------------------------------

  describe('handleContextMenu', () => {
    it('suppresses the native menu while disableDefaultContextMenu is on', () => {
      const event = new MouseEvent('contextmenu');
      const prevented = vi.spyOn(event, 'preventDefault');

      expect(c.disableDefaultContextMenu).toBe(true);
      c.handleContextMenu(event);

      expect(prevented).toHaveBeenCalled();
    });

    it('leaves the native menu alone when disableDefaultContextMenu is off', async () => {
      await build();
      c.disableDefaultContextMenu = false;
      const event = new MouseEvent('contextmenu');
      const prevented = vi.spyOn(event, 'preventDefault');

      c.handleContextMenu(event);

      expect(prevented).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // handleSelectionChange — single
  // -------------------------------------------------------------------------

  describe('handleSelectionChange — single mode', () => {
    let members: CometChat.GroupMember[];

    beforeEach(async () => {
      await build(SelectionMode.single);
      members = withMembers(makeMembers(uids));
    });

    it('selects an unselected member and reports it as the last selected', () => {
      c.handleSelectionChange(members[1]);

      expect(selectedIds()).toEqual(['bob']);
      expect(selectionEvents).toHaveLength(1);
      expect(last(selectionEvents).mode).toBe(SelectionMode.single);
      expect(Array.from(last(selectionEvents).selectedIds)).toEqual(['bob']);
      expect(last(selectionEvents).lastSelectedId).toBe('bob');
    });

    it('toggles a selected member back off and reports no last selection', () => {
      c.handleSelectionChange(members[1]);
      c.handleSelectionChange(members[1]);

      expect(selectedIds()).toEqual([]);
      expect(selectionEvents).toHaveLength(2);
      expect(Array.from(last(selectionEvents).selectedIds)).toEqual([]);
      expect(last(selectionEvents).lastSelectedId).toBeNull();
    });

    it('replaces the previous selection when another member is clicked', () => {
      c.handleSelectionChange(members[0]);
      c.handleSelectionChange(members[2]);

      expect(selectedIds()).toEqual(['carol']);
      expect(c.isMemberSelected(members[0])).toBe(false);
      expect(last(selectionEvents).lastSelectedId).toBe('carol');
    });

    it('never grows beyond one selected member', () => {
      members.forEach(m => c.handleSelectionChange(m));

      expect(selectedIds()).toEqual(['dave']);
      expect(selectionEvents).toHaveLength(4);
    });

    it('still selects a member that is absent from the list', () => {
      c.handleSelectionChange(members[0]);
      const stranger = makeMember('stranger');

      c.handleSelectionChange(stranger);

      // Single mode never consults the index, so a member the list has not
      // paged in yet still replaces the current selection.
      expect(selectedIds()).toEqual(['stranger']);
      expect(last(selectionEvents).lastSelectedId).toBe('stranger');
      expect(c.isMemberSelected(members[0])).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // handleSelectionChange — multiple, plain click
  // -------------------------------------------------------------------------

  describe('handleSelectionChange — multiple mode, plain click', () => {
    let members: CometChat.GroupMember[];

    beforeEach(async () => {
      await build(SelectionMode.multiple);
      members = withMembers(makeMembers(uids));
    });

    it('turns a member on', () => {
      c.handleSelectionChange(members[0]);

      expect(c.isMemberSelected(members[0])).toBe(true);
      expect(last(selectionEvents).lastSelectedId).toBe('alice');
      expect(last(selectionEvents).mode).toBe(SelectionMode.multiple);
    });

    it('turns the same member off again and reports no last selection', () => {
      c.handleSelectionChange(members[0]);
      c.handleSelectionChange(members[0]);

      expect(c.isMemberSelected(members[0])).toBe(false);
      expect(last(selectionEvents).lastSelectedId).toBeNull();
      expect(Array.from(last(selectionEvents).selectedIds)).toEqual([]);
    });

    it('accumulates several members', () => {
      c.handleSelectionChange(members[0]);
      c.handleSelectionChange(members[2]);

      expect(selectedIds()).toEqual(['alice', 'carol']);
      expect(Array.from(last(selectionEvents).selectedIds)).toEqual(['alice', 'carol']);
    });

    it('tracks the clicked index as the range anchor', () => {
      c.handleSelectionChange(members[2]);
      expect(lastIndex()).toBe(2);

      c.handleSelectionChange(members[0]);
      expect(lastIndex()).toBe(0);
    });

    it('records an anchor of -1 for a member outside the list', () => {
      const stranger = makeMember('stranger');

      expect(() => c.handleSelectionChange(stranger)).not.toThrow();
      expect(lastIndex()).toBe(-1);
      expect(selectedIds()).toEqual(['stranger']);
    });

    it('treats a non-MouseEvent carrying shiftKey as a plain click', () => {
      c.handleSelectionChange(members[0]);
      const fakeShift = { shiftKey: true } as unknown as Event;

      c.handleSelectionChange(members[3], fakeShift);

      expect(utilCalls.selectMemberRange).toHaveLength(0);
      expect(selectedIds()).toEqual(['alice', 'dave']);
    });

    it('treats a MouseEvent without shift as a plain click', () => {
      c.handleSelectionChange(members[0]);
      c.handleSelectionChange(members[3], new MouseEvent('click'));

      expect(utilCalls.selectMemberRange).toHaveLength(0);
      expect(selectedIds()).toEqual(['alice', 'dave']);
    });
  });

  // -------------------------------------------------------------------------
  // handleSelectionChange — multiple, shift click
  // -------------------------------------------------------------------------

  describe('handleSelectionChange — multiple mode, shift click', () => {
    let members: CometChat.GroupMember[];

    beforeEach(async () => {
      await build(SelectionMode.multiple);
      members = withMembers(makeMembers(uids));
    });

    it('selects the span between the anchor and the clicked member', () => {
      c.handleSelectionChange(members[0]);
      c.handleSelectionChange(members[2], new MouseEvent('click', { shiftKey: true }));

      expect(selectedIds()).toEqual(['alice', 'bob', 'carol']);
      expect(c.isMemberSelected(members[3])).toBe(false);
    });

    it('delegates the span to selectMemberRange with the anchor and clicked index', () => {
      c.handleSelectionChange(members[1]);
      c.handleSelectionChange(members[3], new MouseEvent('click', { shiftKey: true }));

      expect(utilCalls.selectMemberRange).toHaveLength(1);
      const [list, startIndex, endIndex, , , mode] = utilCalls.selectMemberRange[0];
      expect(list).toHaveLength(4);
      expect(startIndex).toBe(1);
      expect(endIndex).toBe(3);
      expect(mode).toBe(SelectionMode.multiple);
    });

    it('reports the clicked member as the last selected for the span', () => {
      c.handleSelectionChange(members[0]);
      c.handleSelectionChange(members[2], new MouseEvent('click', { shiftKey: true }));

      expect(last(selectionEvents).lastSelectedId).toBe('carol');
      expect(Array.from(last(selectionEvents).selectedIds)).toEqual(['alice', 'bob', 'carol']);
    });

    it('selects a span that runs backwards from the anchor', () => {
      c.handleSelectionChange(members[3]);
      c.handleSelectionChange(members[1], new MouseEvent('click', { shiftKey: true }));

      expect(selectedIds().sort()).toEqual(['bob', 'carol', 'dave']);
      expect(lastIndex()).toBe(1);
    });

    it('deselects the span when the clicked member is already selected', () => {
      c.handleSelectionChange(members[0]);
      c.handleSelectionChange(members[2], new MouseEvent('click', { shiftKey: true }));
      // The anchor is now index 2, so shift-clicking back to index 0 spans the
      // same three members — and the clicked one is already selected.
      c.handleSelectionChange(members[0], new MouseEvent('click', { shiftKey: true }));

      expect(selectedIds()).toEqual([]);
      expect(lastIndex()).toBe(0);
    });

    it('moves the anchor to the clicked index after a span', () => {
      c.handleSelectionChange(members[0]);
      c.handleSelectionChange(members[2], new MouseEvent('click', { shiftKey: true }));

      expect(lastIndex()).toBe(2);
    });

    it('falls back to a plain toggle when there is no anchor yet', () => {
      expect(lastIndex()).toBe(-1);

      c.handleSelectionChange(members[2], new MouseEvent('click', { shiftKey: true }));

      expect(utilCalls.selectMemberRange).toHaveLength(0);
      expect(selectedIds()).toEqual(['carol']);
      expect(lastIndex()).toBe(2);
    });

    it('falls back to a plain toggle when the member is not in the list', () => {
      c.handleSelectionChange(members[0]);
      const stranger = makeMember('stranger');

      c.handleSelectionChange(stranger, new MouseEvent('click', { shiftKey: true }));

      expect(utilCalls.selectMemberRange).toHaveLength(0);
      expect(selectedIds()).toEqual(['alice', 'stranger']);
      expect(lastIndex()).toBe(-1);
    });
  });

  // -------------------------------------------------------------------------
  // handleSelectionChange — none
  // -------------------------------------------------------------------------

  describe('handleSelectionChange — none mode', () => {
    it('selects nothing and emits nothing', () => {
      const members = withMembers(makeMembers(uids));

      c.handleSelectionChange(members[0]);
      c.handleSelectionChange(members[1], new MouseEvent('click', { shiftKey: true }));

      expect(selectedIds()).toEqual([]);
      expect(selectionEvents).toEqual([]);
      expect(utilCalls.emitMemberSelectionChange).toHaveLength(0);
    });
  });

  // -------------------------------------------------------------------------
  // selectRange
  // -------------------------------------------------------------------------

  describe('selectRange', () => {
    let members: CometChat.GroupMember[];

    beforeEach(async () => {
      await build(SelectionMode.multiple);
      members = withMembers(makeMembers(uids));
    });

    it('selects a forward span and stores the end index as the anchor', () => {
      (c as unknown as { selectRange: (a: number, b: number) => void }).selectRange(0, 2);

      expect(selectedIds()).toEqual(['alice', 'bob', 'carol']);
      expect(lastIndex()).toBe(2);
      expect(utilCalls.selectMemberRange).toHaveLength(1);
    });

    it('selects a backward span and stores the end index as the anchor', () => {
      (c as unknown as { selectRange: (a: number, b: number) => void }).selectRange(3, 1);

      expect(selectedIds().sort()).toEqual(['bob', 'carol', 'dave']);
      expect(lastIndex()).toBe(1);
    });

    it('leaves members outside the span untouched', () => {
      (c as unknown as { selectRange: (a: number, b: number) => void }).selectRange(1, 2);

      expect(c.isMemberSelected(members[0])).toBe(false);
      expect(c.isMemberSelected(members[3])).toBe(false);
    });

    it('selects a single member when the span has no width', () => {
      (c as unknown as { selectRange: (a: number, b: number) => void }).selectRange(2, 2);

      expect(selectedIds()).toEqual(['carol']);
      expect(lastIndex()).toBe(2);
    });
  });

  // -------------------------------------------------------------------------
  // emitSelectionChange
  // -------------------------------------------------------------------------

  describe('emitSelectionChange', () => {
    beforeEach(async () => {
      await build(SelectionMode.multiple);
    });

    it('emits the current mode, selected ids and last selected id', () => {
      (c as unknown as { selectedMembers: Set<string> }).selectedMembers.add('alice');
      (c as unknown as { emitSelectionChange: (id: string | null) => void }).emitSelectionChange('alice');

      expect(selectionEvents).toHaveLength(1);
      expect(selectionEvents[0].mode).toBe(SelectionMode.multiple);
      expect(Array.from(selectionEvents[0].selectedIds)).toEqual(['alice']);
      expect(selectionEvents[0].lastSelectedId).toBe('alice');
    });

    it('delegates to emitMemberSelectionChange', () => {
      (c as unknown as { emitSelectionChange: (id: string | null) => void }).emitSelectionChange(null);

      expect(utilCalls.emitMemberSelectionChange).toHaveLength(1);
      const [mode, , lastSelectedId] = utilCalls.emitMemberSelectionChange[0];
      expect(mode).toBe(SelectionMode.multiple);
      expect(lastSelectedId).toBeNull();
    });

    it('emits a snapshot that later selections do not mutate', () => {
      (c as unknown as { selectedMembers: Set<string> }).selectedMembers.add('alice');
      (c as unknown as { emitSelectionChange: (id: string | null) => void }).emitSelectionChange('alice');
      (c as unknown as { selectedMembers: Set<string> }).selectedMembers.add('bob');

      expect(Array.from(selectionEvents[0].selectedIds)).toEqual(['alice']);
    });
  });

  // -------------------------------------------------------------------------
  // handleSelectionControlChange
  // -------------------------------------------------------------------------

  describe('handleSelectionControlChange', () => {
    let members: CometChat.GroupMember[];

    beforeEach(async () => {
      await build(SelectionMode.multiple);
      members = withMembers(makeMembers(uids));
    });

    it('stops the event from reaching the row and then selects', () => {
      const event = new MouseEvent('click');
      const stopped = vi.spyOn(event, 'stopPropagation');

      c.handleSelectionControlChange(members[1], event);

      expect(stopped).toHaveBeenCalled();
      expect(selectedIds()).toEqual(['bob']);
    });

    it('selects with no event at all', () => {
      c.handleSelectionControlChange(members[1]);

      expect(selectedIds()).toEqual(['bob']);
      expect(last(selectionEvents).lastSelectedId).toBe('bob');
    });

    it('deselects on a second control change', () => {
      c.handleSelectionControlChange(members[1]);
      c.handleSelectionControlChange(members[1]);

      expect(selectedIds()).toEqual([]);
      expect(last(selectionEvents).lastSelectedId).toBeNull();
    });

    it('passes a shift-click through to range selection', () => {
      c.handleSelectionControlChange(members[0]);
      c.handleSelectionControlChange(members[2], new MouseEvent('click', { shiftKey: true }));

      expect(utilCalls.selectMemberRange).toHaveLength(1);
      expect(selectedIds()).toEqual(['alice', 'bob', 'carol']);
    });

    it('respects single mode when driven from the control', async () => {
      await build(SelectionMode.single);
      members = withMembers(makeMembers(uids));

      c.handleSelectionControlChange(members[0]);
      c.handleSelectionControlChange(members[1]);

      expect(selectedIds()).toEqual(['bob']);
    });
  });

  // -------------------------------------------------------------------------
  // isMemberSelected
  // -------------------------------------------------------------------------

  describe('isMemberSelected', () => {
    it('is true for a selected member and false for the rest', async () => {
      await build(SelectionMode.multiple);
      const members = withMembers(makeMembers(uids));

      c.handleSelectionChange(members[1]);

      expect(c.isMemberSelected(members[1])).toBe(true);
      expect(c.isMemberSelected(members[0])).toBe(false);
      expect(c.isMemberSelected(makeMember('stranger'))).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // selectAll
  // -------------------------------------------------------------------------

  describe('selectAll', () => {
    it('selects every member in multiple mode and reports no last selection', async () => {
      await build(SelectionMode.multiple);
      withMembers(makeMembers(uids));

      c.selectAll();

      expect(selectedIds()).toEqual(uids);
      expect(selectionEvents).toHaveLength(1);
      expect(Array.from(selectionEvents[0].selectedIds)).toEqual(uids);
      expect(selectionEvents[0].lastSelectedId).toBeNull();
    });

    it('keeps an existing selection and adds the rest', async () => {
      await build(SelectionMode.multiple);
      const members = withMembers(makeMembers(uids));

      c.handleSelectionChange(members[2]);
      c.selectAll();

      expect(selectedIds().sort()).toEqual([...uids].sort());
    });

    it('emits an empty selection when there are no members', async () => {
      await build(SelectionMode.multiple);

      c.selectAll();

      expect(selectedIds()).toEqual([]);
      expect(selectionEvents).toHaveLength(1);
      expect(Array.from(selectionEvents[0].selectedIds)).toEqual([]);
    });

    it('does nothing in single mode', async () => {
      await build(SelectionMode.single);
      withMembers(makeMembers(uids));

      c.selectAll();

      expect(selectedIds()).toEqual([]);
      expect(selectionEvents).toEqual([]);
    });

    it('does nothing in none mode', () => {
      withMembers(makeMembers(uids));

      c.selectAll();

      expect(selectedIds()).toEqual([]);
      expect(selectionEvents).toEqual([]);
    });
  });

  // -------------------------------------------------------------------------
  // Rendered list — the selection model as a user drives it
  // -------------------------------------------------------------------------

  describe('rendered list', () => {
    it('emits itemClick for the clicked row and marks nothing selected in none mode', async () => {
      await build(SelectionMode.none, makeMembers(uids));

      rowBody(1).click();
      fixture.detectChanges();

      expect(itemClicks.map(m => m.getUid())).toEqual(['bob']);
      expect(selectionEvents).toEqual([]);
      expect(rowSelected(1)).toBe(false);
      expect(rowCheckbox(1)).toBeNull();
      expect(rowRadio(1)).toBeNull();
    });

    it('selects the clicked row instead of emitting itemClick in multiple mode', async () => {
      await build(SelectionMode.multiple, makeMembers(uids));

      rowBody(2).click();
      fixture.detectChanges();

      expect(itemClicks).toEqual([]);
      expect(selectedIds()).toEqual(['carol']);
      expect(rowSelected(2)).toBe(true);
      expect(rowSelected(1)).toBe(false);
      expect(rowCheckbox(2)!.checked).toBe(true);
    });

    it('selects through the row checkbox without emitting itemClick', async () => {
      await build(SelectionMode.multiple, makeMembers(uids));

      rowCheckbox(1)!.click();
      fixture.detectChanges();

      // The checkbox wrapper stops the click, so the row handler never runs.
      expect(itemClicks).toEqual([]);
      expect(selectedIds()).toEqual(['bob']);
      expect(rowSelected(1)).toBe(true);
      expect(last(selectionEvents).lastSelectedId).toBe('bob');
    });

    it('unchecks the row checkbox when the same row is clicked again', async () => {
      await build(SelectionMode.multiple, makeMembers(uids));

      rowCheckbox(1)!.click();
      fixture.detectChanges();
      rowCheckbox(1)!.click();
      fixture.detectChanges();

      expect(selectedIds()).toEqual([]);
      expect(rowSelected(1)).toBe(false);
      expect(rowCheckbox(1)!.checked).toBe(false);
    });

    it('moves the radio to the newly clicked row in single mode', async () => {
      await build(SelectionMode.single, makeMembers(uids));

      rowRadio(0)!.click();
      fixture.detectChanges();
      rowRadio(3)!.click();
      fixture.detectChanges();

      expect(selectedIds()).toEqual(['dave']);
      expect(rowSelected(0)).toBe(false);
      expect(rowSelected(3)).toBe(true);
      expect(rowRadio(0)!.checked).toBe(false);
      expect(rowRadio(3)!.checked).toBe(true);
    });

    it('marks every row after selectAll and unmarks them after clearSelection', async () => {
      await build(SelectionMode.multiple, makeMembers(uids));

      c.selectAll();
      fixture.detectChanges();
      expect(rows().map((_, i) => rowSelected(i))).toEqual([true, true, true, true]);

      c.clearSelection();
      fixture.detectChanges();
      expect(rows().map((_, i) => rowSelected(i))).toEqual([false, false, false, false]);
    });
  });

  // -------------------------------------------------------------------------
  // clearSelection
  // -------------------------------------------------------------------------

  describe('clearSelection', () => {
    let members: CometChat.GroupMember[];

    beforeEach(async () => {
      await build(SelectionMode.multiple);
      members = withMembers(makeMembers(uids));
    });

    it('empties the selection', () => {
      c.handleSelectionChange(members[0]);
      c.handleSelectionChange(members[1]);

      c.clearSelection();

      expect(selectedIds()).toEqual([]);
      expect(c.isMemberSelected(members[0])).toBe(false);
    });

    it('drops the range anchor', () => {
      c.handleSelectionChange(members[2]);
      expect(lastIndex()).toBe(2);

      c.clearSelection();

      expect(lastIndex()).toBe(-1);
    });

    it('emits an empty selection with no last selected id', () => {
      c.handleSelectionChange(members[0]);
      selectionEvents.length = 0;

      c.clearSelection();

      expect(selectionEvents).toHaveLength(1);
      expect(Array.from(selectionEvents[0].selectedIds)).toEqual([]);
      expect(selectionEvents[0].lastSelectedId).toBeNull();
      expect(selectionEvents[0].mode).toBe(SelectionMode.multiple);
    });

    it('emits even when nothing was selected', () => {
      c.clearSelection();

      expect(selectionEvents).toHaveLength(1);
      expect(Array.from(selectionEvents[0].selectedIds)).toEqual([]);
    });
  });
});
