/**
 * CometChatGroupMembers — template resolution and view helpers
 *
 * Covers the eight `effective*View` getters and the small view helpers
 * (focus, keydown, tab index, trackBy, aria label, container click).
 *
 * The data layer is replaced wholesale: `GroupMembersService` is a
 * component-level provider, so it is swapped with `TestBed.overrideComponent`
 * rather than a root provider, and `CometChatTemplatesService` — which is not
 * component-scoped — is swapped at the root. That keeps every code path
 * reachable without a live SDK session, which is what otherwise makes most of
 * this component bail out early.
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
import { TemplateRef, WritableSignal, signal } from '@angular/core';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatGroupMembersComponent } from './cometchat-group-members.component';
import { GroupMembersService } from '../../services/group-members.service';
import { CometChatTemplatesService } from '../../services/templates.service';
import { SelectionMode, States } from '../../Enums/Enums';

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

/** A group stub exposing only the accessors this component reaches for. */
function makeGroup(guid = 'guid-1'): CometChat.Group {
  return {
    getGuid: () => guid,
    getName: () => `Group ${guid}`,
    getType: () => 'public',
    getScope: () => 'admin',
  } as unknown as CometChat.Group;
}

/** A group member stub exposing only the accessors this component reaches for. */
function makeMember(uid: string, name = uid, scope = 'participant'): CometChat.GroupMember {
  return {
    getUid: () => uid,
    getName: () => name,
    getScope: () => scope,
    getStatus: () => 'offline',
    getAvatar: () => '',
  } as unknown as CometChat.GroupMember;
}

/**
 * A stand-in TemplateRef. The getters only pass these around by reference —
 * nothing is ever rendered — so an identity-bearing object is enough.
 */
function tpl(label: string): TemplateRef<any> {
  return { label } as unknown as TemplateRef<any>;
}

// ---------------------------------------------------------------------------
// Service doubles
// ---------------------------------------------------------------------------

/**
 * The component reads `members`, `fetchState` and `hasMore` as signals, so the
 * double backs them with writable signals a test can push into.
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

function makeMembersService(): MockGroupMembersService {
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

/** Group-member slots the templates service can hand back. */
type GmTemplates = Record<string, TemplateRef<any> | undefined>;

interface MockTemplatesService {
  gmt: GmTemplates;
  getGroupMemberTemplates: ReturnType<typeof vi.fn>;
  resolveTemplate: ReturnType<typeof vi.fn>;
}

/**
 * `getGroupMemberTemplates()` must return the SAME object on every call so a
 * test can assert the exact reference `resolveTemplate` was handed.
 */
function makeTemplatesService(): MockTemplatesService {
  const gmt: GmTemplates = {};
  return {
    gmt,
    getGroupMemberTemplates: vi.fn(() => gmt),
    resolveTemplate: vi.fn((templates: GmTemplates, slot: string) => templates?.[slot]),
  };
}

// ---------------------------------------------------------------------------
// DOM helpers
// ---------------------------------------------------------------------------

const spawned: HTMLElement[] = [];

/** An element attached to the document so `closest()` and focus behave. */
function el(tag: string, className?: string): HTMLElement {
  const node = document.createElement(tag);
  if (className) node.className = className;
  document.body.appendChild(node);
  spawned.push(node);
  return node;
}

/**
 * Dispatches a real keydown on `node` so the handler sees a genuine
 * `event.target` and `preventDefault()` is observable through
 * `defaultPrevented`.
 */
function keydown(node: HTMLElement, key: string, handler: (e: KeyboardEvent) => void): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key, cancelable: true, bubbles: true });
  const listener = (e: Event) => handler(e as KeyboardEvent);
  node.addEventListener('keydown', listener);
  node.dispatchEvent(event);
  node.removeEventListener('keydown', listener);
  return event;
}

/** Dispatches a real click on `node` and routes it through `handler`. */
function click(node: HTMLElement, handler: (e: MouseEvent) => void): MouseEvent {
  const event = new MouseEvent('click', { cancelable: true, bubbles: true });
  const listener = (e: Event) => handler(e as MouseEvent);
  node.addEventListener('click', listener);
  node.dispatchEvent(event);
  node.removeEventListener('click', listener);
  return event;
}

describe('CometChatGroupMembersComponent — templates and view helpers', () => {
  let fixture: ComponentFixture<CometChatGroupMembersComponent>;
  let c: CometChatGroupMembersComponent;
  let service: MockGroupMembersService;
  let templates: MockTemplatesService;

  const WRAPPER_CLASS = 'cometchat-group-members__list-item-wrapper';

  async function build(): Promise<void> {
    service = makeMembersService();
    templates = makeTemplatesService();

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [CometChatGroupMembersComponent],
      providers: [{ provide: CometChatTemplatesService, useValue: templates }],
    });
    // GroupMembersService is declared in the component's own `providers`, so
    // the component injector would win over a root provider. The component
    // metadata itself has to be overridden.
    TestBed.overrideComponent(CometChatGroupMembersComponent, {
      set: { providers: [{ provide: GroupMembersService, useValue: service }] },
    });
    await TestBed.compileComponents();

    fixture = TestBed.createComponent(CometChatGroupMembersComponent);
    c = fixture.componentInstance;
    c.group = makeGroup();
    fixture.detectChanges();

    // The first render already drives the template getters once. Clearing here
    // means a `toHaveBeenCalled` assertion below can only be satisfied by the
    // getter the test itself invokes.
    templates.getGroupMemberTemplates.mockClear();
    templates.resolveTemplate.mockClear();
  }

  beforeEach(async () => {
    // jsdom has no scrollIntoView, and focus paths reach for it.
    if (!Element.prototype.scrollIntoView) {
      Element.prototype.scrollIntoView = vi.fn();
    }
    await build();
  });

  afterEach(() => {
    // CometChatGroupEvents subjects are static; a surviving fixture keeps
    // listening and skews call counts in later tests.
    fixture?.destroy();
    spawned.splice(0).forEach(node => node.remove());
    vi.restoreAllMocks();
  });

  // -------------------------------------------------------------------------
  // Harness sanity — the component-level override has to actually bite
  // -------------------------------------------------------------------------

  describe('Service override', () => {
    it('drives the mocked members service, not the real one', () => {
      expect(service.initialize).toHaveBeenCalledTimes(1);
      expect(service.initialize).toHaveBeenCalledWith(c.group, undefined);
      expect(service.attachListeners).toHaveBeenCalledWith('guid-1', false);
      expect(service.setErrorCallback).toHaveBeenCalled();
    });

    it('injects the double, not a freshly constructed real service', () => {
      expect((c as any).groupMembersService).toBe(service);
    });

    it('reads its member list from the mocked signal', () => {
      // Empty mock list: the focus handler has nothing to focus.
      c.handleListFocus();
      expect(c.focusedIndex()).toBe(-1);

      // A member pushed into the mock signal is visible to the component.
      service.members.set([makeMember('alice')]);
      c.handleListFocus();
      expect(c.focusedIndex()).toBe(0);
    });

    it('tears down through the double on destroy', () => {
      service.cleanup.mockClear();
      fixture.destroy();
      expect(service.cleanup).toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // effectiveItemView — listItemTemplate > itemView > service template
  // -------------------------------------------------------------------------

  describe('effectiveItemView', () => {
    it('prefers listItemTemplate over every other source', () => {
      const first = tpl('listItemTemplate');
      c.listItemTemplate = first;
      c.itemView = tpl('itemView');
      templates.gmt['itemView'] = tpl('service');
      expect(c.effectiveItemView).toBe(first);
    });

    it('falls back to itemView when listItemTemplate is absent', () => {
      const second = tpl('itemView');
      c.itemView = second;
      templates.gmt['itemView'] = tpl('service');
      expect(c.effectiveItemView).toBe(second);
    });

    it('falls back to the service item template when both inputs are absent', () => {
      const third = tpl('service');
      templates.gmt['itemView'] = third;
      expect(c.effectiveItemView).toBe(third);
    });

    it('is undefined when no source supplies a template', () => {
      expect(c.effectiveItemView).toBeUndefined();
      expect(templates.getGroupMemberTemplates).toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // effectiveLeadingView / TitleView / SubtitleView / TrailingView
  // -------------------------------------------------------------------------

  describe('effectiveLeadingView', () => {
    it('prefers the leadingView input', () => {
      const own = tpl('leadingView');
      c.leadingView = own;
      templates.gmt['leadingView'] = tpl('service');
      expect(c.effectiveLeadingView).toBe(own);
    });

    it('falls back to the service leading template', () => {
      const shared = tpl('service');
      templates.gmt['leadingView'] = shared;
      expect(c.effectiveLeadingView).toBe(shared);
    });

    it('is undefined with no source', () => {
      expect(c.effectiveLeadingView).toBeUndefined();
    });
  });

  describe('effectiveTitleView', () => {
    it('prefers the titleView input', () => {
      const own = tpl('titleView');
      c.titleView = own;
      templates.gmt['titleView'] = tpl('service');
      expect(c.effectiveTitleView).toBe(own);
    });

    it('falls back to the service title template', () => {
      const shared = tpl('service');
      templates.gmt['titleView'] = shared;
      expect(c.effectiveTitleView).toBe(shared);
    });

    it('is undefined with no source', () => {
      expect(c.effectiveTitleView).toBeUndefined();
    });
  });

  describe('effectiveSubtitleView', () => {
    it('prefers the subtitleView input', () => {
      const own = tpl('subtitleView');
      c.subtitleView = own;
      templates.gmt['subtitleView'] = tpl('service');
      expect(c.effectiveSubtitleView).toBe(own);
    });

    it('falls back to the service subtitle template', () => {
      const shared = tpl('service');
      templates.gmt['subtitleView'] = shared;
      expect(c.effectiveSubtitleView).toBe(shared);
    });

    it('is undefined with no source', () => {
      expect(c.effectiveSubtitleView).toBeUndefined();
    });
  });

  describe('effectiveTrailingView', () => {
    it('prefers the trailingView input', () => {
      const own = tpl('trailingView');
      c.trailingView = own;
      templates.gmt['trailingView'] = tpl('service');
      expect(c.effectiveTrailingView).toBe(own);
    });

    it('falls back to the service trailing template', () => {
      const shared = tpl('service');
      templates.gmt['trailingView'] = shared;
      expect(c.effectiveTrailingView).toBe(shared);
    });

    it('is undefined with no source', () => {
      expect(c.effectiveTrailingView).toBeUndefined();
    });
  });

  // -------------------------------------------------------------------------
  // State views — these three delegate the last step to resolveTemplate(),
  // which also consults the shared (cross-list) templates.
  // -------------------------------------------------------------------------

  describe('effectiveLoadingView', () => {
    it('prefers loadingStateTemplate and never asks the service to resolve', () => {
      const first = tpl('loadingStateTemplate');
      c.loadingStateTemplate = first;
      c.loadingView = tpl('loadingView');
      expect(c.effectiveLoadingView).toBe(first);
      expect(templates.resolveTemplate).not.toHaveBeenCalled();
    });

    it('falls back to loadingView', () => {
      const second = tpl('loadingView');
      c.loadingView = second;
      expect(c.effectiveLoadingView).toBe(second);
    });

    it('resolves through the templates service when no input is set', () => {
      const third = tpl('service-loading');
      templates.gmt['loadingView'] = third;
      expect(c.effectiveLoadingView).toBe(third);
      expect(templates.resolveTemplate).toHaveBeenCalledWith(templates.gmt, 'loadingView');
    });

    it('is undefined when the service resolves nothing', () => {
      expect(c.effectiveLoadingView).toBeUndefined();
      expect(templates.resolveTemplate).toHaveBeenCalledWith(templates.gmt, 'loadingView');
    });
  });

  describe('effectiveEmptyView', () => {
    it('prefers emptyStateTemplate and never asks the service to resolve', () => {
      const first = tpl('emptyStateTemplate');
      c.emptyStateTemplate = first;
      c.emptyView = tpl('emptyView');
      expect(c.effectiveEmptyView).toBe(first);
      expect(templates.resolveTemplate).not.toHaveBeenCalled();
    });

    it('falls back to emptyView', () => {
      const second = tpl('emptyView');
      c.emptyView = second;
      expect(c.effectiveEmptyView).toBe(second);
    });

    it('resolves through the templates service when no input is set', () => {
      const third = tpl('service-empty');
      templates.gmt['emptyView'] = third;
      expect(c.effectiveEmptyView).toBe(third);
      expect(templates.resolveTemplate).toHaveBeenCalledWith(templates.gmt, 'emptyView');
    });

    it('is undefined when the service resolves nothing', () => {
      expect(c.effectiveEmptyView).toBeUndefined();
      expect(templates.resolveTemplate).toHaveBeenCalledWith(templates.gmt, 'emptyView');
    });
  });

  describe('effectiveErrorView', () => {
    it('prefers errorStateTemplate and never asks the service to resolve', () => {
      const first = tpl('errorStateTemplate');
      c.errorStateTemplate = first;
      c.errorView = tpl('errorView');
      expect(c.effectiveErrorView).toBe(first);
      expect(templates.resolveTemplate).not.toHaveBeenCalled();
    });

    it('falls back to errorView', () => {
      const second = tpl('errorView');
      c.errorView = second;
      expect(c.effectiveErrorView).toBe(second);
    });

    it('resolves through the templates service when no input is set', () => {
      const third = tpl('service-error');
      templates.gmt['errorView'] = third;
      expect(c.effectiveErrorView).toBe(third);
      expect(templates.resolveTemplate).toHaveBeenCalledWith(templates.gmt, 'errorView');
    });

    it('is undefined when the service resolves nothing', () => {
      expect(c.effectiveErrorView).toBeUndefined();
      expect(templates.resolveTemplate).toHaveBeenCalledWith(templates.gmt, 'errorView');
    });
  });

  // -------------------------------------------------------------------------
  // Focus bookkeeping
  // -------------------------------------------------------------------------

  describe('handleItemFocus / handleItemBlur', () => {
    it('records the focused index', () => {
      c.handleItemFocus(3);
      expect(c.focusedIndex()).toBe(3);
    });

    it('overwrites a previously focused index', () => {
      c.handleItemFocus(1);
      c.handleItemFocus(4);
      expect(c.focusedIndex()).toBe(4);
    });

    it('blur re-checks the view without disturbing the focused index', () => {
      c.handleItemFocus(2);
      const markForCheck = vi.spyOn((c as any).cdr, 'markForCheck');

      c.handleItemBlur();

      expect(markForCheck).toHaveBeenCalledTimes(1);
      expect(c.focusedIndex()).toBe(2);
    });
  });

  // -------------------------------------------------------------------------
  // handleItemKeydown — both `if`s are evaluated, neither returns early
  // -------------------------------------------------------------------------

  describe('handleItemKeydown', () => {
    it('Enter on the item wrapper activates the member', () => {
      const member = makeMember('alice');
      const emit = vi.spyOn(c.itemClick, 'emit');
      const wrapper = el('div', WRAPPER_CLASS);

      const event = keydown(wrapper, 'Enter', e => c.handleItemKeydown(e, member, 0));

      expect(event.defaultPrevented).toBe(true);
      expect(emit).toHaveBeenCalledWith(member);
    });

    it('Enter outside the wrapper is ignored', () => {
      const member = makeMember('alice');
      const emit = vi.spyOn(c.itemClick, 'emit');
      const other = el('button', 'cometchat-group-members__some-button');

      const event = keydown(other, 'Enter', e => c.handleItemKeydown(e, member, 0));

      expect(event.defaultPrevented).toBe(false);
      expect(emit).not.toHaveBeenCalled();
    });

    it('Enter in a selection mode routes to selection instead of item click', () => {
      const member = makeMember('alice');
      c.selectionMode = SelectionMode.multiple;
      const select = vi.spyOn(c, 'handleSelectionChange').mockImplementation(() => {});
      const emit = vi.spyOn(c.itemClick, 'emit');
      const wrapper = el('div', WRAPPER_CLASS);

      keydown(wrapper, 'Enter', e => c.handleItemKeydown(e, member, 0));

      expect(select).toHaveBeenCalledWith(member);
      expect(emit).not.toHaveBeenCalled();
    });

    it('Space on the wrapper toggles selection in multiple mode', () => {
      const member = makeMember('alice');
      c.selectionMode = SelectionMode.multiple;
      const select = vi.spyOn(c, 'handleSelectionChange').mockImplementation(() => {});
      const wrapper = el('div', WRAPPER_CLASS);

      const event = keydown(wrapper, ' ', e => c.handleItemKeydown(e, member, 0));

      expect(event.defaultPrevented).toBe(true);
      expect(select).toHaveBeenCalledWith(member);
    });

    it('Space is ignored in single selection mode', () => {
      const member = makeMember('alice');
      c.selectionMode = SelectionMode.single;
      const select = vi.spyOn(c, 'handleSelectionChange').mockImplementation(() => {});
      const wrapper = el('div', WRAPPER_CLASS);

      const event = keydown(wrapper, ' ', e => c.handleItemKeydown(e, member, 0));

      expect(event.defaultPrevented).toBe(false);
      expect(select).not.toHaveBeenCalled();
    });

    it('Space is ignored when selection is off', () => {
      const member = makeMember('alice');
      c.selectionMode = SelectionMode.none;
      const select = vi.spyOn(c, 'handleSelectionChange').mockImplementation(() => {});
      const wrapper = el('div', WRAPPER_CLASS);

      const event = keydown(wrapper, ' ', e => c.handleItemKeydown(e, member, 0));

      expect(event.defaultPrevented).toBe(false);
      expect(select).not.toHaveBeenCalled();
    });

    it('Space outside the wrapper is ignored even in multiple mode', () => {
      const member = makeMember('alice');
      c.selectionMode = SelectionMode.multiple;
      const select = vi.spyOn(c, 'handleSelectionChange').mockImplementation(() => {});
      const other = el('span');

      const event = keydown(other, ' ', e => c.handleItemKeydown(e, member, 0));

      expect(event.defaultPrevented).toBe(false);
      expect(select).not.toHaveBeenCalled();
    });

    it('any other key on the wrapper is ignored', () => {
      const member = makeMember('alice');
      c.selectionMode = SelectionMode.multiple;
      const select = vi.spyOn(c, 'handleSelectionChange').mockImplementation(() => {});
      const emit = vi.spyOn(c.itemClick, 'emit');
      const wrapper = el('div', WRAPPER_CLASS);

      const event = keydown(wrapper, 'a', e => c.handleItemKeydown(e, member, 0));

      expect(event.defaultPrevented).toBe(false);
      expect(select).not.toHaveBeenCalled();
      expect(emit).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // getTabIndex — exactly one list item stays in the tab order
  // -------------------------------------------------------------------------

  describe('getTabIndex', () => {
    it('gives the focused item 0', () => {
      c.focusedIndex.set(2);
      expect(c.getTabIndex(2)).toBe(0);
    });

    it('gives the first item 0 while nothing is focused', () => {
      c.focusedIndex.set(-1);
      expect(c.getTabIndex(0)).toBe(0);
    });

    it('takes the first item out of the tab order once another is focused', () => {
      c.focusedIndex.set(2);
      expect(c.getTabIndex(0)).toBe(-1);
    });

    it('gives every non-first item -1 while nothing is focused', () => {
      c.focusedIndex.set(-1);
      expect(c.getTabIndex(3)).toBe(-1);
    });

    it('gives unfocused items -1', () => {
      c.focusedIndex.set(1);
      expect(c.getTabIndex(5)).toBe(-1);
    });
  });

  // -------------------------------------------------------------------------
  // List identity, labels and the empty-state signal
  // -------------------------------------------------------------------------

  describe('trackByMember', () => {
    it('keys a member by its uid', () => {
      expect(c.trackByMember(0, makeMember('alice'))).toBe('alice');
    });

    it('ignores the index so a reorder does not recreate the item', () => {
      const member = makeMember('bob');
      expect(c.trackByMember(0, member)).toBe(c.trackByMember(7, member));
    });
  });

  describe('getMemberAriaLabel', () => {
    it('reads out the name and scope', () => {
      expect(c.getMemberAriaLabel(makeMember('alice', 'Alice', 'admin'))).toBe('Alice, admin');
    });

    it('tolerates a member with no name', () => {
      expect(c.getMemberAriaLabel(makeMember('alice', '', 'admin'))).toBe(', admin');
    });

    it('tolerates a member with no scope', () => {
      expect(c.getMemberAriaLabel(makeMember('alice', 'Alice', ''))).toBe('Alice, ');
    });
  });

  describe('checkEmptyState', () => {
    it('announces emptiness when the list has no members', () => {
      const emit = vi.spyOn(c.empty, 'emit');
      (c as any).checkEmptyState();
      expect(emit).toHaveBeenCalledTimes(1);
    });

    it('stays quiet while the list has members', () => {
      service.members.set([makeMember('alice')]);
      const emit = vi.spyOn(c.empty, 'emit');
      (c as any).checkEmptyState();
      expect(emit).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // handleContainerClick — clicking the empty container surrenders focus,
  // but clicking an item, a selection control or the search bar must not.
  // -------------------------------------------------------------------------

  describe('handleContainerClick', () => {
    /** Focuses a real input so a blur is observable through activeElement. */
    function focusProbe(): HTMLElement {
      const input = el('input');
      input.focus();
      expect(document.activeElement).toBe(input);
      return input;
    }

    it('clears the focused index and blurs when the click lands on nothing', () => {
      const probe = focusProbe();
      c.focusedIndex.set(2);

      click(el('div', 'cometchat-group-members__list'), e => c.handleContainerClick(e));

      expect(c.focusedIndex()).toBe(-1);
      expect(document.activeElement).not.toBe(probe);
    });

    it('keeps focus when the click lands on a list item wrapper', () => {
      c.focusedIndex.set(2);
      click(el('div', WRAPPER_CLASS), e => c.handleContainerClick(e));
      expect(c.focusedIndex()).toBe(2);
    });

    it('keeps focus when the click lands inside a list item wrapper', () => {
      c.focusedIndex.set(2);
      const wrapper = el('div', WRAPPER_CLASS);
      const inner = document.createElement('span');
      wrapper.appendChild(inner);

      click(inner, e => c.handleContainerClick(e));

      expect(c.focusedIndex()).toBe(2);
    });

    it('keeps focus when the click lands on a checkbox', () => {
      c.focusedIndex.set(2);
      click(el('cometchat-checkbox'), e => c.handleContainerClick(e));
      expect(c.focusedIndex()).toBe(2);
    });

    it('keeps focus when the click lands on a radio button', () => {
      c.focusedIndex.set(2);
      click(el('cometchat-radio-button'), e => c.handleContainerClick(e));
      expect(c.focusedIndex()).toBe(2);
    });

    it('keeps focus when the click lands on the search bar element', () => {
      c.focusedIndex.set(2);
      click(el('cometchat-search-bar'), e => c.handleContainerClick(e));
      expect(c.focusedIndex()).toBe(2);
    });

    it('keeps focus when the click lands on the search bar wrapper', () => {
      c.focusedIndex.set(2);
      click(el('div', 'cometchat-group-members__search-bar'), e => c.handleContainerClick(e));
      expect(c.focusedIndex()).toBe(2);
    });

    it('does not blur the focused control when the click lands on an item', () => {
      const probe = focusProbe();
      c.focusedIndex.set(1);

      click(el('div', WRAPPER_CLASS), e => c.handleContainerClick(e));

      expect(document.activeElement).toBe(probe);
    });
  });
});
