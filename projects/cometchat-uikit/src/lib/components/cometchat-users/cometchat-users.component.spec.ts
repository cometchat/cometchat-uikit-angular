/**
 * CometChatUsers Component Tests
 *
 * Comprehensive TestBed-based test suite for the users list component.
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
 * @module components/cometchat-users
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
import { ensureSdkReady, sdkCleanup, flushPromises, fetchTestUser } from '../../testing';
import { CometChatUsersComponent } from './cometchat-users.component';
import { SelectionMode, States } from '../../Enums/Enums';

import { CometChatLocalize } from '../../resources/CometChatLocalize/cometchat-localize';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function initAndDetect(fixture: ComponentFixture<CometChatUsersComponent>): Promise<void> {
  fixture.detectChanges();
  await flushPromises();
  await new Promise(r => setTimeout(r, 150));
  fixture.detectChanges();
}

@Component({
  standalone: true,
  imports: [CometChatUsersComponent],
  template: `
    <ng-template #customEmpty>
      <div class="test-custom-empty">No users here</div>
    </ng-template>
    <ng-template #customError>
      <div class="test-custom-error">Custom error view</div>
    </ng-template>
    <ng-template #customItem let-user>
      <div class="test-custom-item">Custom Item</div>
    </ng-template>
    <cometchat-users [emptyView]="customEmpty" [errorView]="customError" [itemView]="customItem">
    </cometchat-users>
  `,
})
class TestHostComponent {
  @ViewChild('customEmpty') customEmpty!: TemplateRef<any>;
  @ViewChild('customError') customError!: TemplateRef<any>;
  @ViewChild('customItem') customItem!: TemplateRef<any>;
  @ViewChild(CometChatUsersComponent)
  usersComponent!: CometChatUsersComponent;
}

// ---------------------------------------------------------------------------
// Test Suite
// ---------------------------------------------------------------------------
describe('CometChatUsersComponent', () => {
  let fixture: ComponentFixture<CometChatUsersComponent>;
  let component: CometChatUsersComponent;
  let el: HTMLElement;

  beforeAll(async () => {
    await ensureSdkReady();
  }, 30_000);

  afterAll(async () => {
    await sdkCleanup();
  }, 15_000);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CometChatUsersComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(CometChatUsersComponent);
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

    it('should render the root .cometchat-users element', async () => {
      await initAndDetect(fixture);
      expect(el.querySelector('.cometchat-users')).toBeTruthy();
    });

    it('should render the header section', async () => {
      await initAndDetect(fixture);
      expect(el.querySelector('.cometchat-users__header')).toBeTruthy();
    });

    it('should render the default header with title', async () => {
      await initAndDetect(fixture);
      const title = el.querySelector('.cometchat-users__header-title');
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

    it('should initialize userList as empty array', () => {
      expect(component.userList).toBeDefined();
      expect(Array.isArray(component.userList)).toBe(true);
      expect(component.userList.length).toBe(0);
    });

    it('should initialize fetchState as loading', () => {
      expect(component.fetchState).toBe(States.loading);
    });

    it('should render the search bar by default (hideSearch is false)', async () => {
      await initAndDetect(fixture);
      expect(el.querySelector('.cometchat-users__search-bar')).toBeTruthy();
    });
  });

  // -------------------------------------------------------------------------
  // Input Bindings
  // -------------------------------------------------------------------------
  describe('Input Bindings', () => {
    it('should default hideSearch to false', () => {
      expect(component.hideSearch).toBe(false);
    });

    it('should default showSectionHeader to true', () => {
      expect(component.showSectionHeader).toBe(true);
    });

    it('should default hideError to false', () => {
      expect(component.hideError).toBe(false);
    });

    it('should default hideUserStatus to false', () => {
      expect(component.hideUserStatus).toBe(false);
    });

    it('should default showScrollbar to false', () => {
      expect(component.showScrollbar).toBe(false);
    });

    it('should default disableLoadingState to false', () => {
      expect(component.disableLoadingState).toBe(false);
    });

    it('should default showSelectedUsersPreview to false', () => {
      expect(component.showSelectedUsersPreview).toBe(false);
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

    it('should default sectionHeaderKey to getName', () => {
      expect(component.sectionHeaderKey).toBe('getName');
    });

    it('should accept and reflect hideSearch input', () => {
      component.hideSearch = true;
      expect(component.hideSearch).toBe(true);
    });

    it('should accept and reflect selectionMode input', () => {
      component.selectionMode = SelectionMode.multiple;
      expect(component.selectionMode).toBe(SelectionMode.multiple);
    });

    it('should accept usersRequestBuilder input', () => {
      const builder = new CometChat.UsersRequestBuilder().setLimit(5);
      component.usersRequestBuilder = builder;
      expect(component.usersRequestBuilder).toBe(builder);
    });

    it('should handle undefined activeUser gracefully', () => {
      expect(() => {
        component.activeUser = undefined;
        fixture.detectChanges();
      }).not.toThrow();
    });

    it('should accept a real CometChat.User as activeUser', async () => {
      const user = await fetchTestUser('superhero1');
      expect(() => {
        component.activeUser = user;
        fixture.detectChanges();
      }).not.toThrow();
      expect(component.activeUser).toBe(user);
    });

    it('should hide search bar when hideSearch is true', async () => {
      component.hideSearch = true;
      await initAndDetect(fixture);
      expect(el.querySelector('.cometchat-users__search-bar')).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // Output Emissions
  // -------------------------------------------------------------------------
  describe('Output Emissions', () => {
    it('should emit itemClick when handleUserClick is called with a real user', async () => {
      const user = await fetchTestUser('superhero1');
      const spy = vi.fn();
      component.itemClick.subscribe(spy);
      fixture.detectChanges();
      component.handleUserClick(user);
      expect(spy).toHaveBeenCalledWith(user);
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

    it('should emit empty output when empty event fires', () => {
      const spy = vi.fn();
      component.empty.subscribe(spy);
      component.empty.emit();
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should emit select when handleSelectionChange is called in single mode', async () => {
      const user = await fetchTestUser('superhero1');
      component.selectionMode = SelectionMode.single;
      component.userList = [user];
      fixture.detectChanges();

      const spy = vi.fn();
      component.select.subscribe(spy);
      component.handleSelectionChange(user);
      expect(spy).toHaveBeenCalledWith(expect.objectContaining({ user, selected: true }));
    });

    it('should emit selectionChange when selection changes', async () => {
      const user = await fetchTestUser('superhero1');
      component.selectionMode = SelectionMode.single;
      component.userList = [user];
      fixture.detectChanges();

      const spy = vi.fn();
      component.selectionChange.subscribe(spy);
      component.handleSelectionChange(user);
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

    it('should have aria-label on the root users element', async () => {
      await initAndDetect(fixture);
      const root = el.querySelector('.cometchat-users');
      expect(root?.getAttribute('aria-label')).toBeTruthy();
    });

    it('should have role="region" on the root element', async () => {
      await initAndDetect(fixture);
      const root = el.querySelector('.cometchat-users');
      expect(root?.getAttribute('role')).toBe('region');
    });

    it('should render the title with localized text', async () => {
      await initAndDetect(fixture);
      const title = el.querySelector('.cometchat-users__header-title');
      const expectedText = CometChatLocalize.getLocalizedString('user_title');
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
      const root = el.querySelector('.cometchat-users');
      expect(root?.classList.contains('cometchat-users-hide-scrollbar')).toBe(true);
    });

    it('should not apply hide-scrollbar class when showScrollbar is true', async () => {
      component.showScrollbar = true;
      await initAndDetect(fixture);
      const root = el.querySelector('.cometchat-users');
      expect(root?.classList.contains('cometchat-users-hide-scrollbar')).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // Selection Modes
  // -------------------------------------------------------------------------
  describe('Selection Modes', () => {
    it('should track selected users in single mode', async () => {
      const user = await fetchTestUser('superhero1');
      component.selectionMode = SelectionMode.single;
      component.userList = [user];
      fixture.detectChanges();

      component.handleSelectionChange(user);
      expect(component.isUserSelected(user)).toBe(true);
      expect(component.selectedUsers.size).toBe(1);
    });

    it('should deselect previous user when selecting new one in single mode', async () => {
      const user1 = await fetchTestUser('superhero1');
      const user2 = await fetchTestUser('superhero2');
      component.selectionMode = SelectionMode.single;
      component.userList = [user1, user2];
      fixture.detectChanges();

      component.handleSelectionChange(user1);
      expect(component.isUserSelected(user1)).toBe(true);

      component.handleSelectionChange(user2);
      expect(component.isUserSelected(user1)).toBe(false);
      expect(component.isUserSelected(user2)).toBe(true);
    });

    it('should toggle selection in single mode (deselect on re-click)', async () => {
      const user = await fetchTestUser('superhero1');
      component.selectionMode = SelectionMode.single;
      component.userList = [user];
      fixture.detectChanges();

      component.handleSelectionChange(user);
      expect(component.isUserSelected(user)).toBe(true);

      component.handleSelectionChange(user);
      expect(component.isUserSelected(user)).toBe(false);
    });

    it('should allow multiple selections in multiple mode', async () => {
      const user1 = await fetchTestUser('superhero1');
      const user2 = await fetchTestUser('superhero2');
      component.selectionMode = SelectionMode.multiple;
      component.userList = [user1, user2];
      fixture.detectChanges();

      component.handleSelectionChange(user1);
      component.handleSelectionChange(user2);
      expect(component.isUserSelected(user1)).toBe(true);
      expect(component.isUserSelected(user2)).toBe(true);
      expect(component.selectedUsers.size).toBe(2);
    });

    it('should toggle individual selection in multiple mode', async () => {
      const user = await fetchTestUser('superhero1');
      component.selectionMode = SelectionMode.multiple;
      component.userList = [user];
      fixture.detectChanges();

      component.handleSelectionChange(user);
      expect(component.isUserSelected(user)).toBe(true);

      component.handleSelectionChange(user);
      expect(component.isUserSelected(user)).toBe(false);
    });

    it('should return selected users array via getSelectedUsersArray', async () => {
      const user1 = await fetchTestUser('superhero1');
      const user2 = await fetchTestUser('superhero2');
      component.selectionMode = SelectionMode.multiple;
      component.userList = [user1, user2];
      fixture.detectChanges();

      component.handleSelectionChange(user1);
      component.handleSelectionChange(user2);
      const selected = component.getSelectedUsersArray();
      expect(selected.length).toBe(2);
    });

    it('should remove user from selection via removeSelectedUser', async () => {
      const user = await fetchTestUser('superhero1');
      component.selectionMode = SelectionMode.multiple;
      component.userList = [user];
      fixture.detectChanges();

      component.handleSelectionChange(user);
      expect(component.isUserSelected(user)).toBe(true);

      const spy = vi.fn();
      component.select.subscribe(spy);
      component.removeSelectedUser(user);
      expect(component.isUserSelected(user)).toBe(false);
      expect(spy).toHaveBeenCalledWith(expect.objectContaining({ user, selected: false }));
    });

    it('should clear all selections via clearSelection', async () => {
      const user1 = await fetchTestUser('superhero1');
      const user2 = await fetchTestUser('superhero2');
      component.selectionMode = SelectionMode.multiple;
      component.userList = [user1, user2];
      fixture.detectChanges();

      component.handleSelectionChange(user1);
      component.handleSelectionChange(user2);
      expect(component.selectedUsers.size).toBe(2);

      component.clearSelection();
      expect(component.selectedUsers.size).toBe(0);
      expect(component.selectedUsersMap.size).toBe(0);
    });

    it('should select all users via selectAll', async () => {
      const user1 = await fetchTestUser('superhero1');
      const user2 = await fetchTestUser('superhero2');
      component.selectionMode = SelectionMode.multiple;
      fixture.detectChanges();

      // Set userList AFTER detectChanges (ngOnInit resets userList to [])
      component.userList = [user1, user2];

      component.selectAll();
      expect(component.selectedUsers.size).toBe(2);
      expect(component.isUserSelected(user1)).toBe(true);
      expect(component.isUserSelected(user2)).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // Localized Labels
  // -------------------------------------------------------------------------
  describe('Localized Labels', () => {
    it('should resolve user_title key', () => {
      const label = CometChatLocalize.getLocalizedString('user_title');
      expect(label).toBeTruthy();
      expect(typeof label).toBe('string');
    });

    it('should resolve user_search_placeholder key', () => {
      const label = CometChatLocalize.getLocalizedString('user_search_placeholder');
      expect(label).toBeTruthy();
      expect(typeof label).toBe('string');
    });

    it('should resolve user_empty_title key', () => {
      const label = CometChatLocalize.getLocalizedString('user_empty_title');
      expect(label).toBeTruthy();
      expect(typeof label).toBe('string');
    });

    it('should resolve user_empty_subtitle key', () => {
      const label = CometChatLocalize.getLocalizedString('user_empty_subtitle');
      expect(label).toBeTruthy();
      expect(typeof label).toBe('string');
    });

    it('should resolve user_error_title key', () => {
      const label = CometChatLocalize.getLocalizedString('user_error_title');
      expect(label).toBeTruthy();
      expect(typeof label).toBe('string');
    });

    it('should resolve user_error_subtitle key', () => {
      const label = CometChatLocalize.getLocalizedString('user_error_subtitle');
      expect(label).toBeTruthy();
      expect(typeof label).toBe('string');
    });

    it('should resolve accessibility_users_list key', () => {
      const label = CometChatLocalize.getLocalizedString('accessibility_users_list');
      expect(label).toBeTruthy();
      expect(typeof label).toBe('string');
    });
  });

  // -------------------------------------------------------------------------
  // Computed Signals & Effective Values
  // -------------------------------------------------------------------------
  describe('Computed Signals', () => {
    it('should compute effectiveHideUserStatus from input', () => {
      component.hideUserStatus = true;
      fixture.detectChanges();
      expect(component.effectiveHideUserStatus()).toBe(true);
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

    it('should default effectiveHideUserStatus to false when not explicitly set', () => {
      expect(component.effectiveHideUserStatus()).toBe(false);
    });

    it('should default effectiveShowScrollbar to false when not explicitly set', () => {
      expect(component.effectiveShowScrollbar()).toBe(false);
    });

    it('should default effectiveHideError to false when not explicitly set', () => {
      expect(component.effectiveHideError()).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // Section Headers
  // -------------------------------------------------------------------------
  describe('Section Headers', () => {
    it('should return first letter of user name as section header value', async () => {
      const user = await fetchTestUser('superhero1');
      const value = component.getSectionHeaderValue(user);
      expect(value).toBeTruthy();
      expect(typeof value).toBe('string');
      expect(value.length).toBe(1);
      expect(value).toBe(value.toUpperCase());
    });

    it('should show section header for first item when showSectionHeader is true', async () => {
      const user = await fetchTestUser('superhero1');
      component.showSectionHeader = true;
      fixture.detectChanges();
      component.userList = [user];
      expect(component.shouldShowSectionHeader(0)).toBe(true);
    });

    it('should not show section header when showSectionHeader is false', async () => {
      const user = await fetchTestUser('superhero1');
      component.showSectionHeader = false;
      fixture.detectChanges();
      component.userList = [user];
      expect(component.shouldShowSectionHeader(0)).toBe(false);
    });

    it('should not show section header for empty list', () => {
      component.showSectionHeader = true;
      component.userList = [];
      fixture.detectChanges();
      expect(component.shouldShowSectionHeader(0)).toBe(false);
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
    it('should handle empty userList gracefully', async () => {
      await initAndDetect(fixture);
      expect(el.querySelector('.cometchat-users')).toBeTruthy();
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

    it('should handle trackByUser with a real user', async () => {
      const user = await fetchTestUser('superhero1');
      const result = component.trackByUser(0, user);
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });

    it('should return correct ARIA label for user with status visible', async () => {
      const user = await fetchTestUser('superhero1');
      component.hideUserStatus = false;
      const label = component.getUserAriaLabel(user);
      expect(label).toBeTruthy();
      expect(typeof label).toBe('string');
      expect(label.length).toBeGreaterThan(0);
    });

    it('should return name-only ARIA label when hideUserStatus is true', async () => {
      const user = await fetchTestUser('superhero1');
      component.hideUserStatus = true;
      const label = component.getUserAriaLabel(user);
      expect(label).toBe(user.getName());
    });

    it('should handle isUserActive with a real user', async () => {
      const user = await fetchTestUser('superhero1');
      component.activeUser = user;
      fixture.detectChanges();
      expect(component.isUserActive(user)).toBe(true);
    });

    it('should return false for isUserActive when no activeUser set', async () => {
      const user = await fetchTestUser('superhero1');
      component.activeUser = undefined;
      fixture.detectChanges();
      expect(component.isUserActive(user)).toBe(false);
    });

    it('should return empty array from getOptionsForUser when no options function', async () => {
      const user = await fetchTestUser('superhero1');
      const options = component.getOptionsForUser(user);
      expect(Array.isArray(options)).toBe(true);
      expect(options.length).toBe(0);
    });

    it('should return options from getOptionsForUser when options function is set', async () => {
      const user = await fetchTestUser('superhero1');
      component.options = () => [{ id: 'block', title: 'Block', onClick: () => {} } as any];
      const options = component.getOptionsForUser(user);
      expect(options.length).toBe(1);
      expect(options[0].id).toBe('block');
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
      expect(hostComponent.usersComponent.emptyView).toBeTruthy();
    });

    it('should accept errorView template input', async () => {
      hostFixture.detectChanges();
      await flushPromises();
      await new Promise(r => setTimeout(r, 150));
      hostFixture.detectChanges();
      expect(hostComponent.usersComponent.errorView).toBeTruthy();
    });

    it('should accept itemView template input', async () => {
      hostFixture.detectChanges();
      await flushPromises();
      await new Promise(r => setTimeout(r, 150));
      hostFixture.detectChanges();
      expect(hostComponent.usersComponent.itemView).toBeTruthy();
    });
  });

  // -------------------------------------------------------------------------
  // Keyboard Navigation
  // -------------------------------------------------------------------------
  describe('Keyboard Navigation', () => {
    it('should handle ArrowDown keydown on the root element', async () => {
      await initAndDetect(fixture);
      const root = el.querySelector('.cometchat-users') as HTMLElement;
      expect(root).toBeTruthy();
      expect(() => {
        root.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      }).not.toThrow();
    });

    it('should handle ArrowUp keydown on the root element', async () => {
      await initAndDetect(fixture);
      const root = el.querySelector('.cometchat-users') as HTMLElement;
      expect(() => {
        root.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
      }).not.toThrow();
    });

    it('should handle Escape key without throwing', async () => {
      await initAndDetect(fixture);
      const root = el.querySelector('.cometchat-users') as HTMLElement;
      expect(() => {
        root.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      }).not.toThrow();
    });

    it('should handle Enter key without throwing', async () => {
      await initAndDetect(fixture);
      const root = el.querySelector('.cometchat-users') as HTMLElement;
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
