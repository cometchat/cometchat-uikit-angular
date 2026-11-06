/**
 * CometChatGroupMembers — Focus and Keyboard Navigation
 *
 * Drives the real component against a fully mocked GroupMembersService, so the
 * host focus handler, the keydown switch, the focus delegations and the escape
 * handling all run without a live SDK session. `GroupMembersService` is a
 * component-level provider, so it is replaced with `TestBed.overrideComponent`
 * — a root-level provider would be shadowed by the component injector and the
 * real service would quietly take over, leaving every path bailing out early.
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
import { signal, WritableSignal } from '@angular/core';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatGroupMembersComponent } from './cometchat-group-members.component';
import { GroupMembersService } from '../../services/group-members.service';
import { SelectionMode, States } from '../../Enums/Enums';
import { SelectionState } from '../../modals/SelectionState';
import { CometChatUIKitConstants } from '../../constants';

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const GUID = 'guid-keyboard';
const SCOPE = CometChatUIKitConstants.groupMemberScope.participant;

/** The SDK model classes are plain data holders — no network, no init. */
function makeGroup(): CometChat.Group {
  return new CometChat.Group(GUID, 'Keyboard group', 'public');
}

function makeMember(uid: string, scope: string = SCOPE): CometChat.GroupMember {
  const member = new CometChat.GroupMember(uid, scope);
  member.setName(uid);
  return member;
}

// ---------------------------------------------------------------------------
// Service double
// ---------------------------------------------------------------------------

/**
 * The component reads `members`, `fetchState` and `hasMore` as signals, so the
 * double backs them with writable signals a test can push new state into.
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

function makeService(
  members: CometChat.GroupMember[],
  fetchState: States
): MockGroupMembersService {
  return {
    members: signal<CometChat.GroupMember[]>(members),
    fetchState: signal<States>(fetchState),
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

describe('CometChatGroupMembersComponent — focus and keyboard navigation', () => {
  let fixture: ComponentFixture<CometChatGroupMembersComponent>;
  let c: CometChatGroupMembersComponent;
  let service: MockGroupMembersService;
  let root: HTMLElement;
  let group: CometChat.Group;
  let members: CometChat.GroupMember[];
  let selections: SelectionState[];
  let clicked: CometChat.GroupMember[];

  interface BuildOptions {
    members?: CometChat.GroupMember[];
    fetchState?: States;
    selectionMode?: SelectionMode;
  }

  async function build(opts: BuildOptions = {}): Promise<void> {
    members = opts.members ?? [makeMember('alice'), makeMember('bob'), makeMember('carol')];
    group = makeGroup();
    service = makeService(members, opts.fetchState ?? States.loaded);

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ imports: [CometChatGroupMembersComponent] });
    TestBed.overrideComponent(CometChatGroupMembersComponent, {
      set: { providers: [{ provide: GroupMembersService, useValue: service }] },
    });
    await TestBed.compileComponents();

    fixture = TestBed.createComponent(CometChatGroupMembersComponent);
    c = fixture.componentInstance;
    // Inputs go in before the first change detection run, otherwise the
    // template reads a value the view was not created with (NG0100).
    c.group = group;
    c.selectionMode = opts.selectionMode ?? SelectionMode.none;

    selections = [];
    clicked = [];
    c.selectionChange.subscribe((state: SelectionState) => selections.push(state));
    c.itemClick.subscribe((member: CometChat.GroupMember) => clicked.push(member));

    fixture.detectChanges();
    root = fixture.nativeElement.querySelector('.cometchat-group-members') as HTMLElement;
  }

  beforeEach(async () => {
    // ngOnInit asks the SDK who is logged in; nobody is, in a unit test.
    vi.spyOn(CometChat, 'getLoggedinUser').mockResolvedValue(
      null as unknown as CometChat.User
    );
    await build();
  });

  afterEach(() => {
    // The group event subjects are static and shared; an undestroyed fixture
    // keeps answering events raised by later tests.
    fixture?.destroy();
    vi.useRealTimers();
  });

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  /**
   * Builds a keydown event, points its target at `target` (the component root
   * by default) and hands it straight to the host listener.
   */
  function keydown(
    init: KeyboardEventInit & { target?: Element | null } = {}
  ): KeyboardEvent {
    const { target, ...eventInit } = init;
    const event = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      ...eventInit,
    });
    Object.defineProperty(event, 'target', {
      value: target === undefined ? root : target,
      configurable: true,
    });
    vi.spyOn(event, 'stopPropagation');
    c.handleKeydown(event);
    return event;
  }

  /** A non-input element inside the search bar wrapper. */
  function insideSearchBar(): HTMLElement {
    const bar = root.querySelector('.cometchat-group-members__search-bar') as HTMLElement;
    const span = document.createElement('span');
    bar.appendChild(span);
    return span;
  }

  /** An input that lives in the list area rather than the search bar. */
  function inputOutsideSearchBar(): HTMLElement {
    const input = document.createElement('input');
    root.appendChild(input);
    return input;
  }

  /** The member rows the template actually rendered, in list order. */
  function renderedRows(): HTMLElement[] {
    return Array.from(
      root.querySelectorAll<HTMLElement>('cometchat-group-member-item[data-index]')
    );
  }

  /** The names shown on those rows. */
  function renderedNames(): string[] {
    return renderedRows().map(
      row =>
        row
          .querySelector('.cometchat-group-member-item__title-text')
          ?.textContent?.trim() ?? ''
    );
  }

  /**
   * Points the component's `listContainer` at the real rendered row container
   * and returns the real row elements, indexed by `data-index`.
   *
   * The ViewChild has to be assigned by hand: `#listContainer` sits on the
   * `<cometchat-paginated-list>` element, so Angular resolves the query to that
   * component instance rather than an ElementRef and `nativeElement` is
   * undefined at runtime. Supplying the element the query was meant to return
   * is what lets the scroll path be exercised at all.
   */
  function useRenderedListContainer(): HTMLElement[] {
    const container = root.querySelector<HTMLElement>('.cometchat-paginated-list__items');
    (c as unknown as Record<string, unknown>)['listContainer'] = { nativeElement: container };
    return renderedRows();
  }

  // -------------------------------------------------------------------------
  // Harness
  // -------------------------------------------------------------------------

  describe('Service override', () => {
    it('hands the component the mock instead of the real service', () => {
      // Both calls are made by ngOnInit. The real service records neither, so
      // seeing them proves the component injector resolved to the double.
      expect(service.initialize).toHaveBeenCalledWith(group, undefined);
      expect(service.attachListeners).toHaveBeenCalledWith(GUID, false);
      expect(service.cleanup).toHaveBeenCalled();
    });

    it('renders the members held in the mock signal', () => {
      expect(renderedNames()).toEqual(['alice', 'bob', 'carol']);
      expect(renderedRows().map(row => row.getAttribute('data-index'))).toEqual([
        '0',
        '1',
        '2',
      ]);
    });

    it('acts on a member pushed into the mock signal after startup', () => {
      const dave = makeMember('dave');
      service.members.set([...members, dave]);
      fixture.detectChanges();
      expect(renderedNames()).toEqual(['alice', 'bob', 'carol', 'dave']);

      c.handleItemFocus(3);
      keydown({ key: 'Enter' });

      expect(clicked).toEqual([dave]);
    });
  });

  // -------------------------------------------------------------------------
  // Host bindings
  // -------------------------------------------------------------------------

  describe('host bindings', () => {
    it('handles a keydown that bubbles up from the list body', () => {
      root.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true })
      );
      expect(c.focusedIndex()).toBe(0);
    });

    it('takes focus when the host element is focused', () => {
      fixture.nativeElement.dispatchEvent(new FocusEvent('focus'));
      expect(c.focusedIndex()).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // handleListFocus
  // -------------------------------------------------------------------------

  describe('handleListFocus', () => {
    it('focuses the first member when nothing is focused yet', () => {
      c.handleListFocus();
      expect(c.focusedIndex()).toBe(0);
    });

    it('scrolls the newly focused member into view', () => {
      const rows = useRenderedListContainer();
      const scrolled = vi.spyOn(rows[0], 'scrollIntoView');
      vi.useFakeTimers();

      c.handleListFocus();
      vi.advanceTimersByTime(1);

      expect(scrolled).toHaveBeenCalled();
    });

    it('leaves an existing focus alone', () => {
      c.handleItemFocus(2);
      c.handleListFocus();
      expect(c.focusedIndex()).toBe(2);
    });

    it('does nothing when the list is empty', async () => {
      await build({ members: [] });
      c.handleListFocus();
      expect(c.focusedIndex()).toBe(-1);
    });
  });

  // -------------------------------------------------------------------------
  // handleKeydown — preconditions
  // -------------------------------------------------------------------------

  describe('handleKeydown preconditions', () => {
    it('ignores keys when there are no members', async () => {
      await build({ members: [] });
      const event = keydown({ key: 'ArrowDown' });

      expect(event.defaultPrevented).toBe(false);
      expect(c.focusedIndex()).toBe(-1);
    });

    it('ignores keys while the first page is still loading', async () => {
      await build({ fetchState: States.loading });
      const event = keydown({ key: 'ArrowDown' });

      expect(event.defaultPrevented).toBe(false);
      expect(c.focusedIndex()).toBe(-1);
    });

    it('ignores keys when the list is in an error state', async () => {
      await build({ fetchState: States.error });
      const event = keydown({ key: 'ArrowDown' });

      expect(event.defaultPrevented).toBe(false);
      expect(c.focusedIndex()).toBe(-1);
    });

    it('ignores keys raised outside the component', () => {
      const outside = document.createElement('div');
      const event = keydown({ key: 'ArrowDown', target: outside });

      expect(event.defaultPrevented).toBe(false);
      expect(c.focusedIndex()).toBe(-1);
      // Control: the same key from inside the component does move focus.
      keydown({ key: 'ArrowDown' });
      expect(c.focusedIndex()).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // handleKeydown — change scope dialog
  // -------------------------------------------------------------------------

  describe('handleKeydown while the scope dialog is open', () => {
    beforeEach(() => {
      c.memberToChangeScope.set(members[0]);
    });

    it('closes the dialog on Escape', () => {
      const event = keydown({ key: 'Escape' });

      expect(event.defaultPrevented).toBe(true);
      expect(c.memberToChangeScope()).toBeNull();
    });

    it('swallows every other key', () => {
      const event = keydown({ key: 'ArrowDown' });

      expect(event.defaultPrevented).toBe(false);
      expect(c.focusedIndex()).toBe(-1);
      expect(c.memberToChangeScope()).toBe(members[0]);

      // Control: with the dialog closed the same key moves focus, so the
      // dialog is what swallowed it.
      c.memberToChangeScope.set(null);
      keydown({ key: 'ArrowDown' });
      expect(c.focusedIndex()).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // handleKeydown — select all / clear all shortcuts
  // -------------------------------------------------------------------------

  describe('handleKeydown clear-selection shortcut', () => {
    it('clears the selection on Ctrl+Shift+A in multiple mode', async () => {
      await build({ selectionMode: SelectionMode.multiple });
      c.handleSelectionChange(members[0]);

      const event = keydown({ key: 'a', ctrlKey: true, shiftKey: true });

      expect(event.defaultPrevented).toBe(true);
      expect(c.isMemberSelected(members[0])).toBe(false);
      expect(selections[selections.length - 1].selectedIds.size).toBe(0);
    });

    it('clears the selection on Meta+Shift+A in multiple mode', async () => {
      await build({ selectionMode: SelectionMode.multiple });
      c.handleSelectionChange(members[1]);

      const event = keydown({ key: 'a', metaKey: true, shiftKey: true });

      expect(event.defaultPrevented).toBe(true);
      expect(c.isMemberSelected(members[1])).toBe(false);
    });

    it('matches an uppercase A', async () => {
      await build({ selectionMode: SelectionMode.multiple });
      c.handleSelectionChange(members[0]);

      const event = keydown({ key: 'A', ctrlKey: true, shiftKey: true });

      expect(event.defaultPrevented).toBe(true);
      expect(c.isMemberSelected(members[0])).toBe(false);
    });

    it('falls through to the switch in single mode', async () => {
      await build({ selectionMode: SelectionMode.single });
      c.handleSelectionChange(members[0]);
      selections.length = 0;

      const event = keydown({ key: 'a', ctrlKey: true, shiftKey: true });

      expect(event.defaultPrevented).toBe(false);
      expect(selections).toHaveLength(0);
      // The selection survives, which is what clearSelection would have wiped.
      expect(c.isMemberSelected(members[0])).toBe(true);
      // Control: the handler ran on a live list.
      keydown({ key: 'ArrowDown' });
      expect(c.focusedIndex()).toBe(0);
    });

    it('falls through to the switch when selection is off', () => {
      const event = keydown({ key: 'a', ctrlKey: true, shiftKey: true });

      expect(event.defaultPrevented).toBe(false);
      expect(selections).toHaveLength(0);
      // Control: the handler ran to the end of the switch, it did not bail out.
      keydown({ key: 'ArrowDown' });
      expect(c.focusedIndex()).toBe(0);
    });
  });

  describe('handleKeydown select-all shortcut', () => {
    it('selects every member on Ctrl+A in multiple mode', async () => {
      await build({ selectionMode: SelectionMode.multiple });
      const event = keydown({ key: 'a', ctrlKey: true });

      expect(event.defaultPrevented).toBe(true);
      expect(members.every(m => c.isMemberSelected(m))).toBe(true);
      expect(selections[selections.length - 1].selectedIds.size).toBe(3);
    });

    it('selects every member on Meta+A in multiple mode', async () => {
      await build({ selectionMode: SelectionMode.multiple });
      const event = keydown({ key: 'a', metaKey: true });

      expect(event.defaultPrevented).toBe(true);
      expect(members.every(m => c.isMemberSelected(m))).toBe(true);
    });

    it('matches an uppercase A', async () => {
      await build({ selectionMode: SelectionMode.multiple });
      const event = keydown({ key: 'A', metaKey: true });

      expect(event.defaultPrevented).toBe(true);
      expect(c.isMemberSelected(members[2])).toBe(true);
    });

    it('falls through to the switch in single mode', async () => {
      await build({ selectionMode: SelectionMode.single });
      const event = keydown({ key: 'a', ctrlKey: true });

      expect(event.defaultPrevented).toBe(false);
      expect(members.some(m => c.isMemberSelected(m))).toBe(false);
      expect(selections).toHaveLength(0);
      // Control: the handler ran on a live list.
      keydown({ key: 'ArrowDown' });
      expect(c.focusedIndex()).toBe(0);
    });

    it('falls through to the switch when selection is off', () => {
      const event = keydown({ key: 'a', metaKey: true });

      expect(event.defaultPrevented).toBe(false);
      expect(selections).toHaveLength(0);
      // Control: the handler ran to the end of the switch, it did not bail out.
      keydown({ key: 'ArrowDown' });
      expect(c.focusedIndex()).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // handleKeydown — arrow navigation
  // -------------------------------------------------------------------------

  describe('ArrowDown', () => {
    it('focuses the first member from an unfocused list', () => {
      const event = keydown({ key: 'ArrowDown' });

      expect(c.focusedIndex()).toBe(0);
      expect(event.defaultPrevented).toBe(true);
      expect(event.stopPropagation).toHaveBeenCalled();
    });

    it('advances to the next member', () => {
      c.handleItemFocus(0);
      keydown({ key: 'ArrowDown' });
      expect(c.focusedIndex()).toBe(1);
    });

    it('wraps around at the end of the list', () => {
      c.handleItemFocus(2);
      keydown({ key: 'ArrowDown' });
      expect(c.focusedIndex()).toBe(0);
    });

    it('scrolls the member it moved to into view', () => {
      const rows = useRenderedListContainer();
      const scrolled = vi.spyOn(rows[1], 'scrollIntoView');
      c.handleItemFocus(0);
      vi.useFakeTimers();

      keydown({ key: 'ArrowDown' });
      vi.advanceTimersByTime(1);

      expect(scrolled).toHaveBeenCalled();
    });

    it('does nothing from inside the search bar', () => {
      const event = keydown({ key: 'ArrowDown', target: insideSearchBar() });

      expect(c.focusedIndex()).toBe(-1);
      expect(event.defaultPrevented).toBe(false);
      // Control: the same key from the list body does move focus, so the list
      // was navigable and the search bar is what stopped it.
      keydown({ key: 'ArrowDown' });
      expect(c.focusedIndex()).toBe(0);
    });

    it('does nothing from an input outside the search bar', () => {
      const event = keydown({ key: 'ArrowDown', target: inputOutsideSearchBar() });

      expect(c.focusedIndex()).toBe(-1);
      expect(event.defaultPrevented).toBe(false);
      keydown({ key: 'ArrowDown' });
      expect(c.focusedIndex()).toBe(0);
    });
  });

  describe('ArrowUp', () => {
    it('focuses the last member from an unfocused list', () => {
      const event = keydown({ key: 'ArrowUp' });

      expect(c.focusedIndex()).toBe(2);
      expect(event.defaultPrevented).toBe(true);
      expect(event.stopPropagation).toHaveBeenCalled();
    });

    it('steps back to the previous member', () => {
      c.handleItemFocus(1);
      keydown({ key: 'ArrowUp' });
      expect(c.focusedIndex()).toBe(0);
    });

    it('wraps around at the start of the list', () => {
      c.handleItemFocus(0);
      keydown({ key: 'ArrowUp' });
      expect(c.focusedIndex()).toBe(2);
    });

    it('does nothing from inside the search bar', () => {
      const event = keydown({ key: 'ArrowUp', target: insideSearchBar() });

      expect(c.focusedIndex()).toBe(-1);
      expect(event.defaultPrevented).toBe(false);
      keydown({ key: 'ArrowUp' });
      expect(c.focusedIndex()).toBe(2);
    });

    it('does nothing from an input outside the search bar', () => {
      const event = keydown({ key: 'ArrowUp', target: inputOutsideSearchBar() });

      expect(c.focusedIndex()).toBe(-1);
      expect(event.defaultPrevented).toBe(false);
      keydown({ key: 'ArrowUp' });
      expect(c.focusedIndex()).toBe(2);
    });
  });

  // -------------------------------------------------------------------------
  // focus delegations
  // -------------------------------------------------------------------------

  describe('focus delegations', () => {
    it('scrolls the row matching the focused index and no other', () => {
      const rows = useRenderedListContainer();
      const first = vi.spyOn(rows[0], 'scrollIntoView');
      const third = vi.spyOn(rows[2], 'scrollIntoView');
      c.handleItemFocus(2);
      vi.useFakeTimers();

      (c as unknown as Record<string, () => void>)['scrollFocusedItemIntoView']();
      vi.advanceTimersByTime(1);

      expect(third).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest',
      });
      expect(first).not.toHaveBeenCalled();
    });

    it('skips the scroll when the list container is not resolved', () => {
      const scrolled = renderedRows().map(row => vi.spyOn(row, 'scrollIntoView'));
      (c as unknown as Record<string, unknown>)['listContainer'] = undefined;
      c.handleItemFocus(1);
      vi.useFakeTimers();

      expect(() => {
        (c as unknown as Record<string, () => void>)['scrollFocusedItemIntoView']();
        vi.advanceTimersByTime(1);
      }).not.toThrow();
      scrolled.forEach(spy => expect(spy).not.toHaveBeenCalled());
    });
  });

  // -------------------------------------------------------------------------
  // Enter
  // -------------------------------------------------------------------------

  describe('Enter', () => {
    it('emits itemClick for the focused member when selection is off', () => {
      c.handleItemFocus(1);
      const event = keydown({ key: 'Enter' });

      expect(event.defaultPrevented).toBe(true);
      expect(clicked).toEqual([members[1]]);
    });

    it('selects the focused member in multiple mode instead of emitting itemClick', async () => {
      await build({ selectionMode: SelectionMode.multiple });
      c.handleItemFocus(2);
      keydown({ key: 'Enter' });

      expect(c.isMemberSelected(members[2])).toBe(true);
      expect(clicked).toHaveLength(0);
    });

    it('selects the focused member in single mode instead of emitting itemClick', async () => {
      await build({ selectionMode: SelectionMode.single });
      c.handleItemFocus(0);
      keydown({ key: 'Enter' });

      expect(c.isMemberSelected(members[0])).toBe(true);
      expect(clicked).toHaveLength(0);
    });

    it('does nothing when no member is focused', () => {
      keydown({ key: 'Enter' });
      expect(clicked).toHaveLength(0);

      // Control: with a member focused the same key does emit.
      c.handleItemFocus(0);
      keydown({ key: 'Enter' });
      expect(clicked).toEqual([members[0]]);
    });

    it('does nothing when the focused index is past the end of the list', () => {
      c.handleItemFocus(members.length);
      keydown({ key: 'Enter' });
      expect(clicked).toHaveLength(0);

      c.handleItemFocus(members.length - 1);
      keydown({ key: 'Enter' });
      expect(clicked).toEqual([members[members.length - 1]]);
    });

    it('does nothing from inside the search bar', () => {
      c.handleItemFocus(1);
      const event = keydown({ key: 'Enter', target: insideSearchBar() });

      expect(event.defaultPrevented).toBe(false);
      expect(clicked).toHaveLength(0);
      // Control: the same key from the list body does emit.
      keydown({ key: 'Enter' });
      expect(clicked).toEqual([members[1]]);
    });
  });

  // -------------------------------------------------------------------------
  // Space
  // -------------------------------------------------------------------------

  describe('Space', () => {
    it('selects the focused member in multiple mode', async () => {
      await build({ selectionMode: SelectionMode.multiple });
      c.handleItemFocus(1);
      const event = keydown({ key: ' ' });

      expect(event.defaultPrevented).toBe(true);
      expect(c.isMemberSelected(members[1])).toBe(true);
    });

    it('deselects the focused member on a second press', async () => {
      await build({ selectionMode: SelectionMode.multiple });
      c.handleItemFocus(1);
      keydown({ key: ' ' });
      keydown({ key: ' ' });

      expect(c.isMemberSelected(members[1])).toBe(false);
      expect(selections[selections.length - 1].selectedIds.size).toBe(0);
    });

    it('does nothing in single mode', async () => {
      await build({ selectionMode: SelectionMode.single });
      c.handleItemFocus(1);
      const event = keydown({ key: ' ' });

      expect(event.defaultPrevented).toBe(false);
      expect(c.isMemberSelected(members[1])).toBe(false);
      // Control: Enter on the same focused member does select it, so Space is
      // what single mode ignores.
      keydown({ key: 'Enter' });
      expect(c.isMemberSelected(members[1])).toBe(true);
    });

    it('does nothing when selection is off', () => {
      c.handleItemFocus(1);
      const event = keydown({ key: ' ' });

      expect(event.defaultPrevented).toBe(false);
      expect(selections).toHaveLength(0);
      // Control: Enter on the same focused member emits itemClick instead.
      keydown({ key: 'Enter' });
      expect(clicked).toEqual([members[1]]);
    });

    it('does nothing from inside the search bar', async () => {
      await build({ selectionMode: SelectionMode.multiple });
      c.handleItemFocus(1);
      const event = keydown({ key: ' ', target: insideSearchBar() });

      expect(event.defaultPrevented).toBe(false);
      expect(c.isMemberSelected(members[1])).toBe(false);
      // Control: the same key from the list body does select.
      keydown({ key: ' ' });
      expect(c.isMemberSelected(members[1])).toBe(true);
    });

    it('does nothing when no member is focused', async () => {
      await build({ selectionMode: SelectionMode.multiple });
      keydown({ key: ' ' });

      expect(selections).toHaveLength(0);

      // Control: with a member focused the same key does select.
      c.handleItemFocus(0);
      keydown({ key: ' ' });
      expect(c.isMemberSelected(members[0])).toBe(true);
    });

    it('does nothing when the focused index is past the end of the list', async () => {
      await build({ selectionMode: SelectionMode.multiple });
      c.handleItemFocus(members.length);
      keydown({ key: ' ' });

      expect(selections).toHaveLength(0);

      c.handleItemFocus(members.length - 1);
      keydown({ key: ' ' });
      expect(c.isMemberSelected(members[members.length - 1])).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // Escape
  // -------------------------------------------------------------------------

  describe('Escape', () => {
    it('clears the search text first and leaves selection and focus alone', async () => {
      await build({ selectionMode: SelectionMode.multiple });
      c.handleSelectionChange(members[0]);
      c.handleItemFocus(2);
      c.searchText.set('ali');

      const event = keydown({ key: 'Escape' });

      expect(event.defaultPrevented).toBe(true);
      expect(c.searchText()).toBe('');
      expect(c.isMemberSelected(members[0])).toBe(true);
      expect(c.focusedIndex()).toBe(2);
    });

    it('pushes the cleared keyword through the debounced search', async () => {
      c.searchText.set('ali');
      vi.useFakeTimers();

      keydown({ key: 'Escape' });
      await vi.advanceTimersByTimeAsync(400);

      expect(service.search).toHaveBeenCalledWith('', undefined);
    });

    it('clears a multiple-mode selection when the search is empty', async () => {
      await build({ selectionMode: SelectionMode.multiple });
      c.handleSelectionChange(members[0]);
      c.handleSelectionChange(members[1]);
      c.handleItemFocus(1);

      keydown({ key: 'Escape' });

      expect(c.isMemberSelected(members[0])).toBe(false);
      expect(c.isMemberSelected(members[1])).toBe(false);
      expect(selections[selections.length - 1].selectedIds.size).toBe(0);
      expect(c.focusedIndex()).toBe(-1);
    });

    it('clears a single-mode selection when the search is empty', async () => {
      await build({ selectionMode: SelectionMode.single });
      c.handleSelectionChange(members[2]);

      keydown({ key: 'Escape' });

      expect(c.isMemberSelected(members[2])).toBe(false);
      expect(c.focusedIndex()).toBe(-1);
    });

    it('only resets the focus when nothing is selected', async () => {
      await build({ selectionMode: SelectionMode.multiple });
      c.handleItemFocus(2);

      keydown({ key: 'Escape' });

      expect(selections).toHaveLength(0);
      expect(c.focusedIndex()).toBe(-1);
    });

    it('resets the focus when selection is off', () => {
      c.handleItemFocus(1);
      const event = keydown({ key: 'Escape' });

      expect(event.defaultPrevented).toBe(true);
      expect(c.focusedIndex()).toBe(-1);
    });

    it('blurs whatever is focused', () => {
      const input = document.createElement('input');
      document.body.appendChild(input);
      input.focus();
      expect(document.activeElement).toBe(input);

      c.handleItemFocus(0);
      keydown({ key: 'Escape' });

      expect(document.activeElement).not.toBe(input);
      input.remove();
    });
  });

  // -------------------------------------------------------------------------
  // Keys the component does not own
  // -------------------------------------------------------------------------

  describe('unhandled keys', () => {
    it('leaves an ordinary character alone', () => {
      c.handleItemFocus(1);
      const event = keydown({ key: 'x' });

      expect(event.defaultPrevented).toBe(false);
      expect(c.focusedIndex()).toBe(1);
      expect(clicked).toHaveLength(0);
      expect(selections).toHaveLength(0);
      // Control: a key the component does own still moves focus on.
      keydown({ key: 'ArrowDown' });
      expect(c.focusedIndex()).toBe(2);
    });

    it('leaves Tab to the browser', () => {
      const event = keydown({ key: 'Tab' });

      expect(event.defaultPrevented).toBe(false);
      expect(event.stopPropagation).not.toHaveBeenCalled();
      expect(c.focusedIndex()).toBe(-1);
      keydown({ key: 'ArrowDown' });
      expect(c.focusedIndex()).toBe(0);
    });
  });
});
