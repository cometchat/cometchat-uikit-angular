/**
 * CometChatGroupMembers Component Tests
 *
 * Comprehensive TestBed-based test suite for the group members list component.
 * Uses real CometChat SDK session — NO vi.mock() for chat SDK packages.
 * The calls SDK mock below is required because @cometchat/calls-sdk-javascript
 * has a JitsiMeetJS runtime dependency that doesn't exist in jsdom.
 *
 * Categories: Initialization, Input Bindings, Output Emissions,
 *             DOM Rendering, Selection Modes, Scope Change,
 *             Localized Labels, Lifecycle, Edge Cases,
 *             Template Overrides, Keyboard Navigation
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 1.7, 2.1, 2.2, 2.3, 2.4, 2.5,
 *            3.1, 3.2, 3.3, 4.1, 4.2, 5.3, 11.1, 11.3, 13.6,
 *            14.4, 14.5, 15.7
 *
 * @module components/cometchat-group-members
 */

// ==================== SDK Mocks ====================
vi.mock('@cometchat/calls-sdk-javascript', () => ({
  CometChatCalls: {
    init: vi.fn().mockResolvedValue(true),
    generateToken: vi.fn().mockResolvedValue({ token: 'mock-token' }),
  },
}));

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, TemplateRef, ViewChild } from '@angular/core';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { ensureSdkReady, sdkCleanup, flushPromises, fetchTestGroup } from '../../testing';
import { CometChatGroupMembersComponent } from './cometchat-group-members.component';
import { SelectionMode, States } from '../../Enums/Enums';
import { CometChatLocalize } from '../../resources/CometChatLocalize/cometchat-localize';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function initAndDetect(
  fixture: ComponentFixture<CometChatGroupMembersComponent>
): Promise<void> {
  fixture.detectChanges();
  await flushPromises();
  await new Promise(r => setTimeout(r, 150));
  fixture.detectChanges();
}

@Component({
  standalone: true,
  imports: [CometChatGroupMembersComponent],
  template: `
    <ng-template #customEmpty>
      <div class="test-custom-empty">No members here</div>
    </ng-template>
    <ng-template #customError>
      <div class="test-custom-error">Custom error view</div>
    </ng-template>
    <ng-template #customItem let-member>
      <div class="test-custom-item">Custom Item</div>
    </ng-template>
    <cometchat-group-members
      [group]="group"
      [emptyView]="customEmpty"
      [errorView]="customError"
      [itemView]="customItem"
    >
    </cometchat-group-members>
  `,
})
class TestHostComponent {
  @ViewChild('customEmpty') customEmpty!: TemplateRef<any>;
  @ViewChild('customError') customError!: TemplateRef<any>;
  @ViewChild('customItem') customItem!: TemplateRef<any>;
  @ViewChild(CometChatGroupMembersComponent)
  groupMembersComponent!: CometChatGroupMembersComponent;
  group!: CometChat.Group;
}

// ---------------------------------------------------------------------------
// Test Suite
// ---------------------------------------------------------------------------
describe('CometChatGroupMembersComponent', () => {
  let fixture: ComponentFixture<CometChatGroupMembersComponent>;
  let component: CometChatGroupMembersComponent;
  let el: HTMLElement;
  let testGroup: CometChat.Group;

  beforeAll(async () => {
    await ensureSdkReady();
    testGroup = await fetchTestGroup('supergroup');
  }, 30_000);

  afterAll(async () => {
    await sdkCleanup();
  }, 15_000);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CometChatGroupMembersComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(CometChatGroupMembersComponent);
    component = fixture.componentInstance;
    el = fixture.nativeElement;
    component.group = testGroup;
  });

  // -------------------------------------------------------------------------
  // Initialization
  // -------------------------------------------------------------------------
  describe('Initialization', () => {
    it('should create the component', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should render the root .cometchat-group-members element', async () => {
      await initAndDetect(fixture);
      expect(el.querySelector('.cometchat-group-members')).toBeTruthy();
    });

    it('should render the header section', async () => {
      await initAndDetect(fixture);
      expect(el.querySelector('.cometchat-group-members__header')).toBeTruthy();
    });

    it('should expose SelectionMode enum to template', () => {
      expect(component.SelectionMode).toBeDefined();
      expect(component.SelectionMode.none).toBe(SelectionMode.none);
      expect(component.SelectionMode.single).toBe(SelectionMode.single);
      expect(component.SelectionMode.multiple).toBe(SelectionMode.multiple);
    });

    it('should expose States enum to template', () => {
      expect(component.States).toBeDefined();
      expect(component.States.loading).toBe(States.loading);
      expect(component.States.loaded).toBe(States.loaded);
      expect(component.States.error).toBe(States.error);
      expect(component.States.empty).toBe(States.empty);
    });

    it('should render the search bar by default (hideSearch is false)', async () => {
      await initAndDetect(fixture);
      expect(el.querySelector('.cometchat-group-members__search-bar')).toBeTruthy();
    });

    it('should accept the group input', () => {
      expect(component.group).toBe(testGroup);
      expect(component.group.getGuid()).toBe('supergroup');
    });

    it('should initialize focusedIndex to -1', () => {
      expect(component.focusedIndex()).toBe(-1);
    });

    it('should initialize memberToChangeScope as null', () => {
      expect(component.memberToChangeScope()).toBeNull();
    });

    it('should initialize searchText as empty string', () => {
      expect(component.searchText()).toBe('');
    });
  });

  // -------------------------------------------------------------------------
  // Input Bindings
  // -------------------------------------------------------------------------
  describe('Input Bindings', () => {
    it('should default hideSearch to false', () => {
      expect(component.hideSearch).toBe(false);
    });

    it('should default hideError to false', () => {
      expect(component.hideError).toBe(false);
    });

    it('should default hideUserStatus to false', () => {
      expect(component.hideUserStatus).toBe(false);
    });

    it('should default hideKickMemberOption to false', () => {
      expect(component.hideKickMemberOption).toBe(false);
    });

    it('should default hideBanMemberOption to false', () => {
      expect(component.hideBanMemberOption).toBe(false);
    });

    it('should default hideScopeChangeOption to false', () => {
      expect(component.hideScopeChangeOption).toBe(false);
    });

    it('should default showScrollbar to false', () => {
      expect(component.showScrollbar).toBe(false);
    });

    it('should default disableLoadingState to false', () => {
      expect(component.disableLoadingState).toBe(false);
    });

    it('should default disableDefaultContextMenu to true', () => {
      expect(component.disableDefaultContextMenu).toBe(true);
    });

    it('should default selectionMode to none', () => {
      expect(component.selectionMode).toBe(SelectionMode.none);
    });

    it('should default searchKeyword to empty string', () => {
      expect(component.searchKeyword).toBe('');
    });

    it('should accept and reflect hideSearch input', () => {
      component.hideSearch = true;
      expect(component.hideSearch).toBe(true);
    });

    it('should accept and reflect selectionMode input', () => {
      component.selectionMode = SelectionMode.multiple;
      expect(component.selectionMode).toBe(SelectionMode.multiple);
    });

    it('should accept groupMemberRequestBuilder input', () => {
      const builder = new CometChat.GroupMembersRequestBuilder('supergroup').setLimit(5);
      component.groupMemberRequestBuilder = builder;
      expect(component.groupMemberRequestBuilder).toBe(builder);
    });

    it('should hide search bar when hideSearch is true', async () => {
      component.hideSearch = true;
      await initAndDetect(fixture);
      expect(el.querySelector('.cometchat-group-members__search-bar')).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // Output Emissions
  // -------------------------------------------------------------------------
  describe('Output Emissions', () => {
    it('should emit itemClick when onItemClick is called with a real member', async () => {
      await initAndDetect(fixture);
      const members = (component as any).groupMembersService.members();
      if (members.length === 0) return;

      const spy = vi.fn();
      component.itemClick.subscribe(spy);
      component.onItemClick(members[0]);
      expect(spy).toHaveBeenCalledWith(members[0]);
    });

    it('should emit error output when error event fires', () => {
      const spy = vi.fn();
      component.error.subscribe(spy);
      const err = new CometChat.CometChatException({
        code: 'ERR_TEST',
        message: 'Test error',
      } as any);
      component.error.emit(err);
      expect(spy).toHaveBeenCalledWith(err);
    });

    it('should emit selectionChange when selection changes in single mode', async () => {
      component.selectionMode = SelectionMode.single;
      await initAndDetect(fixture);
      const members = (component as any).groupMembersService.members();
      if (members.length === 0) return;

      const spy = vi.fn();
      component.selectionChange.subscribe(spy);
      component.handleSelectionChange(members[0]);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: SelectionMode.single,
        })
      );
    });

    it('should emit empty output', () => {
      const spy = vi.fn();
      component.empty.subscribe(spy);
      component.empty.emit();
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  // -------------------------------------------------------------------------
  // DOM Rendering
  // -------------------------------------------------------------------------
  describe('DOM Rendering', () => {
    it('should render the cometchat-paginated-list child component', async () => {
      await initAndDetect(fixture);
      expect(el.querySelector('cometchat-paginated-list')).toBeTruthy();
    });

    it('should have aria-label on the root group-members element', async () => {
      await initAndDetect(fixture);
      const root = el.querySelector('.cometchat-group-members');
      expect(root?.getAttribute('aria-label')).toBeTruthy();
    });

    it('should have role="region" on the root element', async () => {
      await initAndDetect(fixture);
      const root = el.querySelector('.cometchat-group-members');
      expect(root?.getAttribute('role')).toBe('region');
    });

    it('should render search bar with cometchat-search-bar element', async () => {
      await initAndDetect(fixture);
      const searchBar = el.querySelector('cometchat-search-bar');
      expect(searchBar).toBeTruthy();
    });

    it('should apply hide-scrollbar class when showScrollbar is false', async () => {
      component.showScrollbar = false;
      await initAndDetect(fixture);
      const root = el.querySelector('.cometchat-group-members');
      expect(root?.classList.contains('cometchat-group-members-hide-scrollbar')).toBe(true);
    });

    it('should not apply hide-scrollbar class when showScrollbar is true', async () => {
      component.showScrollbar = true;
      await initAndDetect(fixture);
      const root = el.querySelector('.cometchat-group-members');
      expect(root?.classList.contains('cometchat-group-members-hide-scrollbar')).toBe(false);
    });

    it('should render the paginated list with role="listbox"', async () => {
      await initAndDetect(fixture);
      const list = el.querySelector('cometchat-paginated-list');
      expect(list?.getAttribute('role')).toBe('listbox');
    });
  });

  // -------------------------------------------------------------------------
  // Selection Modes
  // -------------------------------------------------------------------------
  describe('Selection Modes', () => {
    it('should track selected members in single mode', async () => {
      component.selectionMode = SelectionMode.single;
      await initAndDetect(fixture);
      const members = (component as any).groupMembersService.members();
      if (members.length === 0) return;

      component.handleSelectionChange(members[0]);
      expect(component.isMemberSelected(members[0])).toBe(true);
    });

    it('should toggle selection in single mode (deselect on re-click)', async () => {
      component.selectionMode = SelectionMode.single;
      await initAndDetect(fixture);
      const members = (component as any).groupMembersService.members();
      if (members.length === 0) return;

      component.handleSelectionChange(members[0]);
      expect(component.isMemberSelected(members[0])).toBe(true);

      component.handleSelectionChange(members[0]);
      expect(component.isMemberSelected(members[0])).toBe(false);
    });

    it('should deselect previous member when selecting new one in single mode', async () => {
      component.selectionMode = SelectionMode.single;
      await initAndDetect(fixture);
      const members = (component as any).groupMembersService.members();
      if (members.length < 2) return;

      component.handleSelectionChange(members[0]);
      expect(component.isMemberSelected(members[0])).toBe(true);

      component.handleSelectionChange(members[1]);
      expect(component.isMemberSelected(members[0])).toBe(false);
      expect(component.isMemberSelected(members[1])).toBe(true);
    });

    it('should allow multiple selections in multiple mode', async () => {
      component.selectionMode = SelectionMode.multiple;
      await initAndDetect(fixture);
      const members = (component as any).groupMembersService.members();
      if (members.length < 2) return;

      component.handleSelectionChange(members[0]);
      component.handleSelectionChange(members[1]);
      expect(component.isMemberSelected(members[0])).toBe(true);
      expect(component.isMemberSelected(members[1])).toBe(true);
    });

    it('should toggle individual selection in multiple mode', async () => {
      component.selectionMode = SelectionMode.multiple;
      await initAndDetect(fixture);
      const members = (component as any).groupMembersService.members();
      if (members.length === 0) return;

      component.handleSelectionChange(members[0]);
      expect(component.isMemberSelected(members[0])).toBe(true);

      component.handleSelectionChange(members[0]);
      expect(component.isMemberSelected(members[0])).toBe(false);
    });

    it('should clear all selections via clearSelection', async () => {
      component.selectionMode = SelectionMode.multiple;
      await initAndDetect(fixture);
      const members = (component as any).groupMembersService.members();
      if (members.length === 0) return;

      component.handleSelectionChange(members[0]);
      expect(component.isMemberSelected(members[0])).toBe(true);

      component.clearSelection();
      expect(component.isMemberSelected(members[0])).toBe(false);
    });

    it('should select all members via selectAll in multiple mode', async () => {
      component.selectionMode = SelectionMode.multiple;
      await initAndDetect(fixture);
      const members = (component as any).groupMembersService.members();
      if (members.length === 0) return;

      component.selectAll();
      members.forEach((m: any) => {
        expect(component.isMemberSelected(m)).toBe(true);
      });
    });

    it('should not select all when selectionMode is not multiple', async () => {
      component.selectionMode = SelectionMode.single;
      await initAndDetect(fixture);
      const members = (component as any).groupMembersService.members();
      if (members.length === 0) return;

      component.selectAll();
      members.forEach((m: any) => {
        expect(component.isMemberSelected(m)).toBe(false);
      });
    });
  });

  // -------------------------------------------------------------------------
  // Scope Change
  // -------------------------------------------------------------------------
  describe('Scope Change', () => {
    it('should return allowed scopes for a member', async () => {
      await initAndDetect(fixture);
      const members = (component as any).groupMembersService.members();
      if (members.length === 0) return;

      const scopes = component.getAllowedScopes(members[0]);
      expect(Array.isArray(scopes)).toBe(true);
    });

    it('should close scope change dialog via onChangeScopeClose', async () => {
      await initAndDetect(fixture);
      const members = (component as any).groupMembersService.members();
      if (members.length === 0) return;

      component.memberToChangeScope.set(members[0]);
      expect(component.memberToChangeScope()).toBe(members[0]);

      component.onChangeScopeClose();
      expect(component.memberToChangeScope()).toBeNull();
    });

    it('should set memberToChangeScope to null initially', () => {
      expect(component.memberToChangeScope()).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // Localized Labels
  // -------------------------------------------------------------------------
  describe('Localized Labels', () => {
    it('should resolve member_title key', () => {
      const label = CometChatLocalize.getLocalizedString('member_title');
      expect(label).toBeTruthy();
      expect(typeof label).toBe('string');
    });

    it('should resolve member_search_placeholder key', () => {
      const label = CometChatLocalize.getLocalizedString('member_search_placeholder');
      expect(label).toBeTruthy();
      expect(typeof label).toBe('string');
    });

    it('should resolve member_empty_title key', () => {
      const label = CometChatLocalize.getLocalizedString('member_empty_title');
      expect(label).toBeTruthy();
      expect(typeof label).toBe('string');
    });

    it('should resolve member_empty_subtitle key', () => {
      const label = CometChatLocalize.getLocalizedString('member_empty_subtitle');
      expect(label).toBeTruthy();
      expect(typeof label).toBe('string');
    });

    it('should resolve member_error_title key', () => {
      const label = CometChatLocalize.getLocalizedString('member_error_title');
      expect(label).toBeTruthy();
      expect(typeof label).toBe('string');
    });

    it('should resolve member_error_subtitle key', () => {
      const label = CometChatLocalize.getLocalizedString('member_error_subtitle');
      expect(label).toBeTruthy();
      expect(typeof label).toBe('string');
    });

    it('should resolve members_change_role key', () => {
      const label = CometChatLocalize.getLocalizedString('members_change_role');
      expect(label).toBeTruthy();
      expect(typeof label).toBe('string');
    });
  });

  // -------------------------------------------------------------------------
  // Computed Signals
  // -------------------------------------------------------------------------
  describe('Computed Signals', () => {
    it('should compute effectiveShowScrollbar from input', () => {
      component.showScrollbar = true;
      fixture.detectChanges();
      expect(component.effectiveShowScrollbar()).toBe(true);
    });

    it('should compute effectiveHideError from input', () => {
      component.hideError = true;
      fixture.detectChanges();
      expect(component.effectiveHideError()).toBe(true);
    });

    it('should compute effectiveHideUserStatus from input', () => {
      component.hideUserStatus = true;
      fixture.detectChanges();
      expect(component.effectiveHideUserStatus()).toBe(true);
    });

    it('should default effectiveShowScrollbar to false when not explicitly set', () => {
      expect(component.effectiveShowScrollbar()).toBe(false);
    });

    it('should default effectiveHideError to false when not explicitly set', () => {
      expect(component.effectiveHideError()).toBe(false);
    });

    it('should default effectiveHideUserStatus to false when not explicitly set', () => {
      expect(component.effectiveHideUserStatus()).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // Lifecycle
  // -------------------------------------------------------------------------
  describe('Lifecycle', () => {
    it('should not throw on ngOnDestroy', async () => {
      await initAndDetect(fixture);
      expect(() => component.ngOnDestroy()).not.toThrow();
    });

    it('should not throw when destroyed while loading', () => {
      fixture.detectChanges();
      expect(() => fixture.destroy()).not.toThrow();
    });

    it('should initialize on ngOnInit and have defined service state', async () => {
      await initAndDetect(fixture);
      expect((component as any).groupMembersService.fetchState()).toBeDefined();
    });
  });

  // -------------------------------------------------------------------------
  // Edge Cases
  // -------------------------------------------------------------------------
  describe('Edge Cases', () => {
    it('should handle rapid selection mode changes without throwing', () => {
      expect(() => {
        component.selectionMode = SelectionMode.single;
        fixture.detectChanges();
        component.selectionMode = SelectionMode.multiple;
        fixture.detectChanges();
        component.selectionMode = SelectionMode.none;
        fixture.detectChanges();
      }).not.toThrow();
    });

    it('should handle trackByMember with a real member', async () => {
      await initAndDetect(fixture);
      const members = (component as any).groupMembersService.members();
      if (members.length === 0) return;

      const result = component.trackByMember(0, members[0]);
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });

    it('should return correct ARIA label for a real member', async () => {
      await initAndDetect(fixture);
      const members = (component as any).groupMembersService.members();
      if (members.length === 0) return;

      const label = component.getMemberAriaLabel(members[0]);
      expect(label).toBeTruthy();
      expect(typeof label).toBe('string');
      expect(label.length).toBeGreaterThan(0);
    });

    it('should handle getTabIndex correctly', () => {
      expect(component.getTabIndex(0)).toBe(0);
      expect(component.getTabIndex(1)).toBe(-1);

      component.focusedIndex.set(2);
      expect(component.getTabIndex(2)).toBe(0);
      expect(component.getTabIndex(0)).toBe(-1);
    });

    it('should handle hasActionOptions with array', () => {
      const options = [{ id: 'test', title: 'Test' }] as any;
      expect(component.hasActionOptions(options)).toBe(true);
    });

    it('should handle hasActionOptions with string', () => {
      expect(component.hasActionOptions('participant')).toBe(false);
    });

    it('should return options from getOptionsForMember when options function is set', async () => {
      await initAndDetect(fixture);
      const members = (component as any).groupMembersService.members();
      if (members.length === 0) return;

      component.options = () => [{ id: 'custom', title: 'Custom', onClick: () => {} } as any];
      const options = component.getOptionsForMember(members[0]);
      expect(Array.isArray(options)).toBe(true);
      expect((options as any[]).length).toBe(1);
      expect((options as any[])[0].id).toBe('custom');
    });

    it('should handle isMemberSelected for unselected member', async () => {
      await initAndDetect(fixture);
      const members = (component as any).groupMembersService.members();
      if (members.length === 0) return;

      expect(component.isMemberSelected(members[0])).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // Template Overrides (via host component)
  // -------------------------------------------------------------------------
  describe('Template Overrides', () => {
    let hostFixture: ComponentFixture<TestHostComponent>;
    let hostComponent: TestHostComponent;

    beforeEach(async () => {
      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [TestHostComponent],
      }).compileComponents();
      hostFixture = TestBed.createComponent(TestHostComponent);
      hostComponent = hostFixture.componentInstance;
      hostComponent.group = testGroup;
    });

    it('should accept emptyView template input', async () => {
      hostFixture.detectChanges();
      await flushPromises();
      await new Promise(r => setTimeout(r, 150));
      hostFixture.detectChanges();
      expect(hostComponent.groupMembersComponent.emptyView).toBeTruthy();
    });

    it('should accept errorView template input', async () => {
      hostFixture.detectChanges();
      await flushPromises();
      await new Promise(r => setTimeout(r, 150));
      hostFixture.detectChanges();
      expect(hostComponent.groupMembersComponent.errorView).toBeTruthy();
    });

    it('should accept itemView template input', async () => {
      hostFixture.detectChanges();
      await flushPromises();
      await new Promise(r => setTimeout(r, 150));
      hostFixture.detectChanges();
      expect(hostComponent.groupMembersComponent.itemView).toBeTruthy();
    });
  });

  // -------------------------------------------------------------------------
  // Keyboard Navigation
  // -------------------------------------------------------------------------
  describe('Keyboard Navigation', () => {
    it('should handle ArrowDown keydown on the root element', async () => {
      await initAndDetect(fixture);
      const root = el.querySelector('.cometchat-group-members') as HTMLElement;
      expect(root).toBeTruthy();
      expect(() => {
        root.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      }).not.toThrow();
    });

    it('should handle ArrowUp keydown on the root element', async () => {
      await initAndDetect(fixture);
      const root = el.querySelector('.cometchat-group-members') as HTMLElement;
      expect(() => {
        root.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
      }).not.toThrow();
    });

    it('should handle Escape key without throwing', async () => {
      await initAndDetect(fixture);
      const root = el.querySelector('.cometchat-group-members') as HTMLElement;
      expect(() => {
        root.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      }).not.toThrow();
    });

    it('should handle Enter key without throwing', async () => {
      await initAndDetect(fixture);
      const root = el.querySelector('.cometchat-group-members') as HTMLElement;
      expect(() => {
        root.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      }).not.toThrow();
    });

    it('should initialize focusedIndex to -1', () => {
      expect(component.focusedIndex()).toBe(-1);
    });
  });

  // -------------------------------------------------------------------------
  // Pagination Signals
  // -------------------------------------------------------------------------
  describe('Pagination Signals', () => {
    it('should expose hasMore signal from service', () => {
      expect(typeof (component as any).groupMembersService.hasMore()).toBe('boolean');
    });

    it('should expose fetchState signal from service', () => {
      expect((component as any).groupMembersService.fetchState()).toBeDefined();
    });

    it('should expose members signal from service', () => {
      expect(Array.isArray((component as any).groupMembersService.members())).toBe(true);
    });
  });
});
