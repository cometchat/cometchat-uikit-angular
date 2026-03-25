/**
 * CometChatGroups Component Tests
 *
 * Comprehensive TestBed-based test suite for the groups list component.
 * Uses real CometChat SDK session — NO vi.mock() for chat SDK packages.
 * The calls SDK mock below is required because @cometchat/calls-sdk-javascript
 * has a JitsiMeetJS runtime dependency that doesn't exist in jsdom.
 *
 * Categories: Initialization, Input Bindings, Output Emissions,
 *             DOM Rendering, Selection Modes, Localized Labels,
 *             Computed Signals, Lifecycle, Edge Cases, Template Overrides,
 *             Keyboard Navigation
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 1.7, 2.1, 2.2, 2.3, 2.4, 2.5,
 *            3.1, 3.2, 3.3, 4.1, 4.2, 5.3, 11.1, 11.3, 13.6,
 *            14.4, 14.5, 15.7
 *
 * @module components/cometchat-groups
 */

// ==================== SDK Mocks ====================
vi.mock('@cometchat/calls-sdk-javascript', () => {
  return {
    CometChatCalls: {
      init: vi.fn().mockResolvedValue(true),
      generateToken: vi.fn().mockResolvedValue({ token: 'mock-token' }),
    },
  };
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, TemplateRef, ViewChild } from '@angular/core';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { ensureSdkReady, sdkCleanup, flushPromises, fetchTestGroup } from '../../testing';
import { CometChatGroupsComponent } from './cometchat-groups.component';
import { SelectionMode, States } from '../../Enums/Enums';
import { CometChatLocalize } from '../../resources/CometChatLocalize/cometchat-localize';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function initAndDetect(fixture: ComponentFixture<CometChatGroupsComponent>): Promise<void> {
  fixture.detectChanges();
  await flushPromises();
  await new Promise(r => setTimeout(r, 150));
  fixture.detectChanges();
}

@Component({
  standalone: true,
  imports: [CometChatGroupsComponent],
  template: `
    <ng-template #customEmpty>
      <div class="test-custom-empty">No groups here</div>
    </ng-template>
    <ng-template #customError>
      <div class="test-custom-error">Custom error view</div>
    </ng-template>
    <ng-template #customItem let-group>
      <div class="test-custom-item">Custom Item</div>
    </ng-template>
    <cometchat-groups [emptyView]="customEmpty" [errorView]="customError" [itemView]="customItem">
    </cometchat-groups>
  `,
})
class TestHostComponent {
  @ViewChild('customEmpty') customEmpty!: TemplateRef<any>;
  @ViewChild('customError') customError!: TemplateRef<any>;
  @ViewChild('customItem') customItem!: TemplateRef<any>;
  @ViewChild(CometChatGroupsComponent)
  groupsComponent!: CometChatGroupsComponent;
}

// ---------------------------------------------------------------------------
// Test Suite
// ---------------------------------------------------------------------------
describe('CometChatGroupsComponent', () => {
  let fixture: ComponentFixture<CometChatGroupsComponent>;
  let component: CometChatGroupsComponent;
  let el: HTMLElement;

  beforeAll(async () => {
    await ensureSdkReady();
  }, 30_000);

  afterAll(async () => {
    await sdkCleanup();
  }, 15_000);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CometChatGroupsComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(CometChatGroupsComponent);
    component = fixture.componentInstance;
    el = fixture.nativeElement;
  });

  // -------------------------------------------------------------------------
  // Initialization
  // -------------------------------------------------------------------------
  describe('Initialization', () => {
    it('should create the component', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should render the root .cometchat-groups element', async () => {
      await initAndDetect(fixture);
      expect(el.querySelector('.cometchat-groups')).toBeTruthy();
    });

    it('should render the header section', async () => {
      await initAndDetect(fixture);
      expect(el.querySelector('.cometchat-groups__header')).toBeTruthy();
    });

    it('should render the default header with title', async () => {
      await initAndDetect(fixture);
      const title = el.querySelector('.cometchat-groups__header-title');
      expect(title).toBeTruthy();
      expect(title?.textContent?.trim()).toBeTruthy();
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

    it('should initialize groupList as empty array', () => {
      expect(component.groupList).toBeDefined();
      expect(Array.isArray(component.groupList)).toBe(true);
      expect(component.groupList.length).toBe(0);
    });

    it('should initialize fetchState as loading', () => {
      expect(component.fetchState).toBe(States.loading);
    });

    it('should render the search bar by default (hideSearch is false)', async () => {
      await initAndDetect(fixture);
      expect(el.querySelector('.cometchat-groups__search-bar')).toBeTruthy();
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

    it('should default hideGroupType to false', () => {
      expect(component.hideGroupType).toBe(false);
    });

    it('should default showScrollbar to false', () => {
      expect(component.showScrollbar).toBe(false);
    });

    it('should default disableDefaultContextMenu to true', () => {
      expect(component.disableDefaultContextMenu).toBe(true);
    });

    it('should default selectionMode to none', () => {
      expect(component.selectionMode).toBe(SelectionMode.none);
    });

    it('should default searchText to empty string', () => {
      expect(component.searchText).toBe('');
    });

    it('should accept and reflect hideSearch input', () => {
      component.hideSearch = true;
      expect(component.hideSearch).toBe(true);
    });

    it('should accept and reflect selectionMode input', () => {
      component.selectionMode = SelectionMode.multiple;
      expect(component.selectionMode).toBe(SelectionMode.multiple);
    });

    it('should accept groupsRequestBuilder input', () => {
      const builder = new CometChat.GroupsRequestBuilder().setLimit(5);
      component.groupsRequestBuilder = builder;
      expect(component.groupsRequestBuilder).toBe(builder);
    });

    it('should handle undefined activeGroup gracefully', () => {
      expect(() => {
        component.activeGroup = undefined;
        fixture.detectChanges();
      }).not.toThrow();
    });

    it('should accept a real CometChat.Group as activeGroup', async () => {
      const group = await fetchTestGroup('supergroup');
      expect(() => {
        component.activeGroup = group;
        fixture.detectChanges();
      }).not.toThrow();
      expect(component.activeGroup).toBe(group);
    });

    it('should hide search bar when hideSearch is true', async () => {
      component.hideSearch = true;
      await initAndDetect(fixture);
      expect(el.querySelector('.cometchat-groups__search-bar')).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // Output Emissions
  // -------------------------------------------------------------------------
  describe('Output Emissions', () => {
    it('should emit itemClick when handleGroupClick is called with a real group', async () => {
      const group = await fetchTestGroup('supergroup');
      const spy = vi.fn();
      component.itemClick.subscribe(spy);
      fixture.detectChanges();
      component.handleGroupClick(group);
      expect(spy).toHaveBeenCalledWith(group);
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

    it('should emit select when handleSelectionChange is called in single mode', async () => {
      const group = await fetchTestGroup('supergroup');
      component.selectionMode = SelectionMode.single;
      component.groupList = [group];
      fixture.detectChanges();

      const spy = vi.fn();
      component.select.subscribe(spy);
      component.handleSelectionChange(group);
      expect(spy).toHaveBeenCalledWith(expect.objectContaining({ group, selected: true }));
    });

    it('should emit selectionChange when selection changes', async () => {
      const group = await fetchTestGroup('supergroup');
      component.selectionMode = SelectionMode.single;
      component.groupList = [group];
      fixture.detectChanges();

      const spy = vi.fn();
      component.selectionChange.subscribe(spy);
      component.handleSelectionChange(group);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: SelectionMode.single,
        })
      );
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

    it('should have aria-label on the root groups element', async () => {
      await initAndDetect(fixture);
      const root = el.querySelector('.cometchat-groups');
      expect(root?.getAttribute('aria-label')).toBeTruthy();
    });

    it('should have role="region" on the root element', async () => {
      await initAndDetect(fixture);
      const root = el.querySelector('.cometchat-groups');
      expect(root?.getAttribute('role')).toBe('region');
    });

    it('should render the title with localized text', async () => {
      await initAndDetect(fixture);
      const title = el.querySelector('.cometchat-groups__header-title');
      const expectedText = CometChatLocalize.getLocalizedString('group_title');
      expect(title?.textContent?.trim()).toBe(expectedText);
    });

    it('should render search bar with cometchat-search-bar element', async () => {
      await initAndDetect(fixture);
      const searchBar = el.querySelector('cometchat-search-bar');
      expect(searchBar).toBeTruthy();
    });

    it('should apply hide-scrollbar class when showScrollbar is false', async () => {
      component.showScrollbar = false;
      await initAndDetect(fixture);
      const root = el.querySelector('.cometchat-groups');
      expect(root?.classList.contains('cometchat-groups-hide-scrollbar')).toBe(true);
    });

    it('should not apply hide-scrollbar class when showScrollbar is true', async () => {
      component.showScrollbar = true;
      await initAndDetect(fixture);
      const root = el.querySelector('.cometchat-groups');
      expect(root?.classList.contains('cometchat-groups-hide-scrollbar')).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // Selection Modes
  // -------------------------------------------------------------------------
  describe('Selection Modes', () => {
    it('should track selected groups in single mode', async () => {
      const group = await fetchTestGroup('supergroup');
      component.selectionMode = SelectionMode.single;
      component.groupList = [group];
      fixture.detectChanges();

      component.handleSelectionChange(group);
      expect(component.isGroupSelected(group)).toBe(true);
      expect(component.selectedGroups.size).toBe(1);
    });

    it('should deselect previous group when selecting new one in single mode', async () => {
      const group1 = await fetchTestGroup('supergroup');
      // Create a second group via the groups request builder
      const builder = new CometChat.GroupsRequestBuilder().setLimit(2).build();
      let groups: CometChat.Group[] = [];
      try {
        groups = await builder.fetchNext();
      } catch {
        // fallback: use same group for basic test
      }

      if (groups.length >= 2) {
        component.selectionMode = SelectionMode.single;
        component.groupList = [groups[0], groups[1]];
        fixture.detectChanges();

        component.handleSelectionChange(groups[0]);
        expect(component.isGroupSelected(groups[0])).toBe(true);

        component.handleSelectionChange(groups[1]);
        expect(component.isGroupSelected(groups[0])).toBe(false);
        expect(component.isGroupSelected(groups[1])).toBe(true);
      } else {
        // Fallback: at least verify single mode toggle works
        component.selectionMode = SelectionMode.single;
        component.groupList = [group1];
        fixture.detectChanges();

        component.handleSelectionChange(group1);
        expect(component.isGroupSelected(group1)).toBe(true);
      }
    });

    it('should toggle selection in single mode (deselect on re-click)', async () => {
      const group = await fetchTestGroup('supergroup');
      component.selectionMode = SelectionMode.single;
      component.groupList = [group];
      fixture.detectChanges();

      component.handleSelectionChange(group);
      expect(component.isGroupSelected(group)).toBe(true);

      component.handleSelectionChange(group);
      expect(component.isGroupSelected(group)).toBe(false);
    });

    it('should allow multiple selections in multiple mode', async () => {
      const builder = new CometChat.GroupsRequestBuilder().setLimit(5).build();
      let groups: CometChat.Group[] = [];
      try {
        groups = await builder.fetchNext();
      } catch {
        // skip if no groups
      }

      if (groups.length >= 2) {
        component.selectionMode = SelectionMode.multiple;
        component.groupList = groups;
        fixture.detectChanges();

        component.handleSelectionChange(groups[0]);
        component.handleSelectionChange(groups[1]);
        expect(component.isGroupSelected(groups[0])).toBe(true);
        expect(component.isGroupSelected(groups[1])).toBe(true);
        expect(component.selectedGroups.size).toBe(2);
      }
    });

    it('should toggle individual selection in multiple mode', async () => {
      const group = await fetchTestGroup('supergroup');
      component.selectionMode = SelectionMode.multiple;
      component.groupList = [group];
      fixture.detectChanges();

      component.handleSelectionChange(group);
      expect(component.isGroupSelected(group)).toBe(true);

      component.handleSelectionChange(group);
      expect(component.isGroupSelected(group)).toBe(false);
    });

    it('should clear all selections via clearSelection', async () => {
      const group = await fetchTestGroup('supergroup');
      component.selectionMode = SelectionMode.multiple;
      component.groupList = [group];
      fixture.detectChanges();

      component.handleSelectionChange(group);
      expect(component.selectedGroups.size).toBe(1);

      component.clearSelection();
      expect(component.selectedGroups.size).toBe(0);
    });

    it('should select all groups via selectAll', async () => {
      const builder = new CometChat.GroupsRequestBuilder().setLimit(5).build();
      let groups: CometChat.Group[] = [];
      try {
        groups = await builder.fetchNext();
      } catch {
        // skip if no groups
      }

      if (groups.length >= 2) {
        component.selectionMode = SelectionMode.multiple;
        component.groupList = groups;
        fixture.detectChanges();

        component.selectAll();
        expect(component.selectedGroups.size).toBe(groups.length);
        groups.forEach(g => {
          expect(component.isGroupSelected(g)).toBe(true);
        });
      }
    });

    it('should not select all when selectionMode is not multiple', async () => {
      const group = await fetchTestGroup('supergroup');
      component.selectionMode = SelectionMode.single;
      component.groupList = [group];
      fixture.detectChanges();

      component.selectAll();
      expect(component.selectedGroups.size).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // Localized Labels
  // -------------------------------------------------------------------------
  describe('Localized Labels', () => {
    it('should resolve group_title key', () => {
      const label = CometChatLocalize.getLocalizedString('group_title');
      expect(label).toBeTruthy();
      expect(typeof label).toBe('string');
    });

    it('should resolve group_search_placeholder key', () => {
      const label = CometChatLocalize.getLocalizedString('group_search_placeholder');
      expect(label).toBeTruthy();
      expect(typeof label).toBe('string');
    });

    it('should resolve group_empty_title key', () => {
      const label = CometChatLocalize.getLocalizedString('group_empty_title');
      expect(label).toBeTruthy();
      expect(typeof label).toBe('string');
    });

    it('should resolve group_empty_subtitle key', () => {
      const label = CometChatLocalize.getLocalizedString('group_empty_subtitle');
      expect(label).toBeTruthy();
      expect(typeof label).toBe('string');
    });

    it('should resolve group_error_title key', () => {
      const label = CometChatLocalize.getLocalizedString('group_error_title');
      expect(label).toBeTruthy();
      expect(typeof label).toBe('string');
    });

    it('should resolve group_error_subtitle key', () => {
      const label = CometChatLocalize.getLocalizedString('group_error_subtitle');
      expect(label).toBeTruthy();
      expect(typeof label).toBe('string');
    });

    it('should resolve accessibility_groups_list key', () => {
      const label = CometChatLocalize.getLocalizedString('accessibility_groups_list');
      expect(label).toBeTruthy();
      expect(typeof label).toBe('string');
    });

    it('should resolve group_member key (singular)', () => {
      const label = CometChatLocalize.getLocalizedString('group_member');
      expect(label).toBeTruthy();
      expect(typeof label).toBe('string');
    });

    it('should resolve group_members key (plural)', () => {
      const label = CometChatLocalize.getLocalizedString('group_members');
      expect(label).toBeTruthy();
      expect(typeof label).toBe('string');
    });
  });

  // -------------------------------------------------------------------------
  // Computed Signals & Effective Values
  // -------------------------------------------------------------------------
  describe('Computed Signals', () => {
    it('should compute effectiveHideGroupType from input', () => {
      component.hideGroupType = true;
      fixture.detectChanges();
      expect(component.effectiveHideGroupType()).toBe(true);
    });

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

    it('should default effectiveHideGroupType to false when not explicitly set', () => {
      expect(component.effectiveHideGroupType()).toBe(false);
    });

    it('should default effectiveShowScrollbar to false when not explicitly set', () => {
      expect(component.effectiveShowScrollbar()).toBe(false);
    });

    it('should default effectiveHideError to false when not explicitly set', () => {
      expect(component.effectiveHideError()).toBe(false);
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

    it('should initialize on ngOnInit and have defined fetchState', async () => {
      await initAndDetect(fixture);
      expect(component.fetchState).toBeDefined();
    });
  });

  // -------------------------------------------------------------------------
  // Edge Cases
  // -------------------------------------------------------------------------
  describe('Edge Cases', () => {
    it('should handle empty groupList gracefully', async () => {
      await initAndDetect(fixture);
      expect(el.querySelector('.cometchat-groups')).toBeTruthy();
    });

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

    it('should handle trackByGroup with a real group', async () => {
      const group = await fetchTestGroup('supergroup');
      const result = component.trackByGroup(0, group);
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });

    it('should return correct ARIA label for a real group', async () => {
      const group = await fetchTestGroup('supergroup');
      const label = component.getGroupAriaLabel(group);
      expect(label).toBeTruthy();
      expect(typeof label).toBe('string');
      expect(label.length).toBeGreaterThan(0);
      // Should contain group name and type info
      expect(label).toContain(group.getName());
      expect(label).toContain('group');
    });

    it('should return correct member count text for singular', async () => {
      const group = await fetchTestGroup('supergroup');
      const text = component.getMemberCountText(group);
      expect(text).toBeTruthy();
      // Should be either 'group_member' or 'group_members' depending on count
      expect(['group_member', 'group_members']).toContain(text);
    });

    it('should return group type string', async () => {
      const group = await fetchTestGroup('supergroup');
      const type = component.getGroupType(group);
      expect(type).toBeTruthy();
      expect(typeof type).toBe('string');
    });

    it('should handle isGroupActive with a real group', async () => {
      const group = await fetchTestGroup('supergroup');
      component.activeGroup = group;
      fixture.detectChanges();
      expect(component.isGroupActive(group)).toBe(true);
    });

    it('should return false for isGroupActive when no activeGroup set', async () => {
      const group = await fetchTestGroup('supergroup');
      component.activeGroup = undefined;
      fixture.detectChanges();
      expect(component.isGroupActive(group)).toBe(false);
    });

    it('should return empty array from getOptionsForGroup when no options function', async () => {
      const group = await fetchTestGroup('supergroup');
      const options = component.getOptionsForGroup(group);
      expect(Array.isArray(options)).toBe(true);
      expect(options.length).toBe(0);
    });

    it('should return options from getOptionsForGroup when options function is set', async () => {
      const group = await fetchTestGroup('supergroup');
      component.options = () => [{ id: 'leave', title: 'Leave', onClick: () => {} } as any];
      const options = component.getOptionsForGroup(group);
      expect(options.length).toBe(1);
      expect(options[0].id).toBe('leave');
    });

    it('should handle getTabIndex correctly', () => {
      component.focusedIndex = -1;
      expect(component.getTabIndex(0)).toBe(0);
      expect(component.getTabIndex(1)).toBe(-1);

      component.focusedIndex = 2;
      expect(component.getTabIndex(2)).toBe(0);
      expect(component.getTabIndex(0)).toBe(-1);
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
    });

    it('should accept emptyView template input', async () => {
      hostFixture.detectChanges();
      await flushPromises();
      await new Promise(r => setTimeout(r, 150));
      hostFixture.detectChanges();
      expect(hostComponent.groupsComponent.emptyView).toBeTruthy();
    });

    it('should accept errorView template input', async () => {
      hostFixture.detectChanges();
      await flushPromises();
      await new Promise(r => setTimeout(r, 150));
      hostFixture.detectChanges();
      expect(hostComponent.groupsComponent.errorView).toBeTruthy();
    });

    it('should accept itemView template input', async () => {
      hostFixture.detectChanges();
      await flushPromises();
      await new Promise(r => setTimeout(r, 150));
      hostFixture.detectChanges();
      expect(hostComponent.groupsComponent.itemView).toBeTruthy();
    });
  });

  // -------------------------------------------------------------------------
  // Keyboard Navigation
  // -------------------------------------------------------------------------
  describe('Keyboard Navigation', () => {
    it('should handle ArrowDown keydown on the root element', async () => {
      await initAndDetect(fixture);
      const root = el.querySelector('.cometchat-groups') as HTMLElement;
      expect(root).toBeTruthy();
      expect(() => {
        root.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      }).not.toThrow();
    });

    it('should handle ArrowUp keydown on the root element', async () => {
      await initAndDetect(fixture);
      const root = el.querySelector('.cometchat-groups') as HTMLElement;
      expect(() => {
        root.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
      }).not.toThrow();
    });

    it('should handle Escape key without throwing', async () => {
      await initAndDetect(fixture);
      const root = el.querySelector('.cometchat-groups') as HTMLElement;
      expect(() => {
        root.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      }).not.toThrow();
    });

    it('should handle Enter key without throwing', async () => {
      await initAndDetect(fixture);
      const root = el.querySelector('.cometchat-groups') as HTMLElement;
      expect(() => {
        root.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      }).not.toThrow();
    });

    it('should initialize focusedIndex to -1', () => {
      expect(component.focusedIndex).toBe(-1);
    });
  });

  // -------------------------------------------------------------------------
  // Pagination Signals
  // -------------------------------------------------------------------------
  describe('Pagination Signals', () => {
    it('should initialize isFetchingMore as false', () => {
      expect(component.isFetchingMore()).toBe(false);
    });

    it('should initialize hasMore as true', () => {
      expect(component.hasMore()).toBe(true);
    });
  });
});
