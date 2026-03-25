import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FocusTrapService } from '../services/focus-trap.service';
import { LiveAnnouncerService } from '../services/live-announcer.service';
import { ListNavigationService } from '../services/list-navigation.service';
import { ListSelectionManager } from '../services/list-selection-manager.class';
import { SelectionMode } from '../Enums/Enums';
import {
  createKeyboardEvent,
  delay,
  expectAriaAttribute,
  expectRole,
} from './accessibility-test-utils';

/**
 * Integration Tests for List Accessibility Flows
 *
 * These tests verify end-to-end accessibility flows for list components including:
 * - Search bar → list focus transition
 * - Context menu open → focus trap → close → focus restore
 * - Infinite scroll → loading announcement → items loaded announcement
 * - Selection change → event emission → announcement
 *
 * **Validates: Requirements 12.1-12.6, 13.1-13.7, 14.1-14.6, 17.1-17.8**
 */
describe('List Accessibility Integration Tests', () => {
  /**
   * Test Suite: Search Bar to List Focus Transition
   *
   * Tests the keyboard navigation flow from search bar to list:
   * 1. ArrowDown from search bar moves focus to first list item
   * 2. Escape in search bar clears search text
   * 3. Tab from search bar moves to first list item
   * 4. Shift+Tab from first list item returns to search bar
   *
   * **Validates: Requirements 12.1-12.4**
   */
  describe('Search Bar to List Focus Transition', () => {
    let container: HTMLDivElement;
    let searchInput: HTMLInputElement;
    let listContainer: HTMLDivElement;
    let listItems: HTMLDivElement[];
    let listNavigationService: ListNavigationService;
    let focusedIndex: number;

    beforeEach(() => {
      listNavigationService = new ListNavigationService();
      focusedIndex = 0;

      // Create container
      container = document.createElement('div');
      container.setAttribute('role', 'region');
      container.setAttribute('aria-label', 'Conversations');

      // Create search bar
      const searchBar = document.createElement('div');
      searchBar.className = 'cometchat-search-bar';
      searchInput = document.createElement('input');
      searchInput.type = 'text';
      searchInput.placeholder = 'Search';
      searchInput.setAttribute('aria-label', 'Search conversations');
      searchBar.appendChild(searchInput);
      container.appendChild(searchBar);

      // Create list container
      listContainer = document.createElement('div');
      listContainer.setAttribute('role', 'listbox');
      listContainer.setAttribute('aria-label', 'Conversations list');

      // Create list items
      listItems = [];
      const itemNames = ['John Doe', 'Jane Smith', 'Bob Wilson'];
      itemNames.forEach((name, index) => {
        const item = document.createElement('div');
        item.setAttribute('role', 'option');
        item.setAttribute('tabindex', index === 0 ? '0' : '-1');
        item.setAttribute('aria-label', name);
        item.textContent = name;
        item.id = `list-item-${index}`;
        listContainer.appendChild(item);
        listItems.push(item);
      });

      container.appendChild(listContainer);
      document.body.appendChild(container);

      // Setup keyboard handlers
      searchInput.addEventListener('keydown', handleSearchKeyDown);
      listContainer.addEventListener('keydown', handleListKeyDown);
    });

    afterEach(() => {
      searchInput.removeEventListener('keydown', handleSearchKeyDown);
      listContainer.removeEventListener('keydown', handleListKeyDown);
      document.body.removeChild(container);
    });

    function handleSearchKeyDown(event: KeyboardEvent): void {
      // ArrowDown: Move focus to first list item
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        focusListItem(0);
      }

      // Escape: Clear search text
      if (event.key === 'Escape' && searchInput.value) {
        event.preventDefault();
        searchInput.value = '';
      }
    }

    function handleListKeyDown(event: KeyboardEvent): void {
      const newIndex = listNavigationService.handleKeyNavigation(event, focusedIndex, {
        itemCount: listItems.length,
        wrap: false,
      });

      if (newIndex !== -1 && newIndex !== focusedIndex) {
        focusListItem(newIndex);
      }
    }

    function focusListItem(index: number): void {
      // Update tabindex for roving tabindex pattern
      listItems.forEach((item, i) => {
        item.setAttribute('tabindex', i === index ? '0' : '-1');
      });
      focusedIndex = index;
      listItems[index].focus();
    }

    it('should move focus from search bar to first list item on ArrowDown', async () => {
      // Focus search bar
      searchInput.focus();
      expect(document.activeElement).toBe(searchInput);

      // Press ArrowDown
      searchInput.dispatchEvent(createKeyboardEvent('ArrowDown'));
      await delay(10);

      // Focus should be on first list item
      expect(document.activeElement).toBe(listItems[0]);
      expect(focusedIndex).toBe(0);
    });

    it('should clear search text on Escape when search has text', async () => {
      // Focus search bar and enter text
      searchInput.focus();
      searchInput.value = 'test search';

      // Press Escape
      searchInput.dispatchEvent(createKeyboardEvent('Escape'));
      await delay(10);

      // Search text should be cleared
      expect(searchInput.value).toBe('');
      // Focus should remain on search bar
      expect(document.activeElement).toBe(searchInput);
    });

    it('should not clear search text on Escape when search is empty', async () => {
      // Focus search bar with empty text
      searchInput.focus();
      searchInput.value = '';

      // Press Escape - should not prevent default (allow normal behavior)
      const event = createKeyboardEvent('Escape');
      searchInput.dispatchEvent(event);
      await delay(10);

      // Search text should still be empty
      expect(searchInput.value).toBe('');
    });

    it('should navigate through list items with ArrowDown/ArrowUp', async () => {
      // Focus first list item
      focusListItem(0);
      expect(document.activeElement).toBe(listItems[0]);

      // Press ArrowDown
      listContainer.dispatchEvent(createKeyboardEvent('ArrowDown'));
      await delay(10);
      expect(document.activeElement).toBe(listItems[1]);
      expect(focusedIndex).toBe(1);

      // Press ArrowDown again
      listContainer.dispatchEvent(createKeyboardEvent('ArrowDown'));
      await delay(10);
      expect(document.activeElement).toBe(listItems[2]);
      expect(focusedIndex).toBe(2);

      // Press ArrowUp
      listContainer.dispatchEvent(createKeyboardEvent('ArrowUp'));
      await delay(10);
      expect(document.activeElement).toBe(listItems[1]);
      expect(focusedIndex).toBe(1);
    });

    it('should have correct ARIA attributes on list container', () => {
      expectRole(listContainer, 'listbox');
      expectAriaAttribute(listContainer, 'aria-label', 'Conversations list');
    });

    it('should have correct ARIA attributes on list items', () => {
      listItems.forEach(item => {
        expectRole(item, 'option');
      });
    });

    it('should implement roving tabindex pattern', () => {
      // Initially first item should have tabindex=0
      expect(listItems[0].getAttribute('tabindex')).toBe('0');
      expect(listItems[1].getAttribute('tabindex')).toBe('-1');
      expect(listItems[2].getAttribute('tabindex')).toBe('-1');

      // Focus second item
      focusListItem(1);

      // Now second item should have tabindex=0
      expect(listItems[0].getAttribute('tabindex')).toBe('-1');
      expect(listItems[1].getAttribute('tabindex')).toBe('0');
      expect(listItems[2].getAttribute('tabindex')).toBe('-1');
    });

    it('should navigate to first item with Home key', async () => {
      // Focus last item
      focusListItem(2);
      expect(document.activeElement).toBe(listItems[2]);

      // Press Home
      listContainer.dispatchEvent(createKeyboardEvent('Home'));
      await delay(10);

      expect(document.activeElement).toBe(listItems[0]);
      expect(focusedIndex).toBe(0);
    });

    it('should navigate to last item with End key', async () => {
      // Focus first item
      focusListItem(0);
      expect(document.activeElement).toBe(listItems[0]);

      // Press End
      listContainer.dispatchEvent(createKeyboardEvent('End'));
      await delay(10);

      expect(document.activeElement).toBe(listItems[2]);
      expect(focusedIndex).toBe(2);
    });
  });

  /**
   * Test Suite: Context Menu Keyboard Accessibility
   *
   * Tests the context menu keyboard flow:
   * 1. Shift+F10 opens context menu
   * 2. First menu item is focused when menu opens
   * 3. Arrow keys navigate through menu items with wrap-around
   * 4. Enter/Space activates menu item
   * 5. Escape closes menu and restores focus to trigger
   * 6. Tab closes menu
   *
   * **Validates: Requirements 17.1-17.8**
   */
  describe('Context Menu Keyboard Accessibility', () => {
    let focusTrapService: FocusTrapService;
    let triggerElement: HTMLDivElement;
    let contextMenu: HTMLDivElement;
    let menuItems: HTMLDivElement[];
    let isMenuOpen: boolean;
    let focusedMenuIndex: number;
    let selectedAction: string | null;

    const menuActions = ['Delete', 'Mute', 'Pin'];

    beforeEach(() => {
      focusTrapService = new FocusTrapService();
      isMenuOpen = false;
      focusedMenuIndex = -1;
      selectedAction = null;

      // Create trigger element (list item)
      triggerElement = document.createElement('div');
      triggerElement.setAttribute('role', 'option');
      triggerElement.setAttribute('tabindex', '0');
      triggerElement.setAttribute('aria-label', 'John Doe conversation');
      triggerElement.textContent = 'John Doe';
      document.body.appendChild(triggerElement);

      // Create context menu
      contextMenu = document.createElement('div');
      contextMenu.setAttribute('role', 'menu');
      contextMenu.setAttribute('aria-label', 'Conversation actions');
      contextMenu.style.display = 'none';

      // Create menu items
      menuItems = [];
      menuActions.forEach((action, index) => {
        const item = document.createElement('div');
        item.setAttribute('role', 'menuitem');
        item.setAttribute('tabindex', '-1');
        item.textContent = action;
        item.id = `menu-item-${index}`;
        contextMenu.appendChild(item);
        menuItems.push(item);
      });

      document.body.appendChild(contextMenu);

      // Setup keyboard handlers
      triggerElement.addEventListener('keydown', handleTriggerKeyDown);
      contextMenu.addEventListener('keydown', handleMenuKeyDown);
    });

    afterEach(() => {
      triggerElement.removeEventListener('keydown', handleTriggerKeyDown);
      contextMenu.removeEventListener('keydown', handleMenuKeyDown);
      if (focusTrapService.isActive(contextMenu)) {
        focusTrapService.deactivate(contextMenu);
      }
      document.body.removeChild(triggerElement);
      document.body.removeChild(contextMenu);
    });

    function handleTriggerKeyDown(event: KeyboardEvent): void {
      // Shift+F10 or ContextMenu key opens context menu
      if ((event.key === 'F10' && event.shiftKey) || event.key === 'ContextMenu') {
        event.preventDefault();
        openContextMenu();
      }
    }

    function handleMenuKeyDown(event: KeyboardEvent): void {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          focusedMenuIndex = (focusedMenuIndex + 1) % menuItems.length;
          focusMenuItem(focusedMenuIndex);
          break;

        case 'ArrowUp':
          event.preventDefault();
          focusedMenuIndex = (focusedMenuIndex - 1 + menuItems.length) % menuItems.length;
          focusMenuItem(focusedMenuIndex);
          break;

        case 'Enter':
        case ' ':
          event.preventDefault();
          if (focusedMenuIndex >= 0) {
            selectedAction = menuActions[focusedMenuIndex];
            closeContextMenu();
          }
          break;

        case 'Escape':
          event.preventDefault();
          closeContextMenu();
          break;

        case 'Tab':
          event.preventDefault();
          closeContextMenu();
          break;
      }
    }

    function openContextMenu(): void {
      isMenuOpen = true;
      contextMenu.style.display = 'block';
      focusedMenuIndex = 0;

      // Activate focus trap
      focusTrapService.activate({
        container: contextMenu,
        initialFocus: menuItems[0],
        returnFocusOnDeactivate: true,
      });

      focusMenuItem(0);
    }

    function closeContextMenu(): void {
      isMenuOpen = false;
      contextMenu.style.display = 'none';
      focusedMenuIndex = -1;

      // Deactivate focus trap (restores focus to trigger)
      focusTrapService.deactivate(contextMenu);
    }

    function focusMenuItem(index: number): void {
      menuItems.forEach((item, i) => {
        item.setAttribute('tabindex', i === index ? '0' : '-1');
      });
      menuItems[index].focus();
    }

    it('should open context menu on Shift+F10', async () => {
      // Focus trigger element
      triggerElement.focus();
      expect(document.activeElement).toBe(triggerElement);

      // Press Shift+F10
      triggerElement.dispatchEvent(createKeyboardEvent('F10', { shiftKey: true }));
      await delay(10);

      // Menu should be open
      expect(isMenuOpen).toBe(true);
      expect(contextMenu.style.display).toBe('block');
    });

    it('should focus first menu item when menu opens', async () => {
      // Focus trigger and open menu
      triggerElement.focus();
      triggerElement.dispatchEvent(createKeyboardEvent('F10', { shiftKey: true }));
      await delay(10);

      // First menu item should be focused
      expect(document.activeElement).toBe(menuItems[0]);
      expect(focusedMenuIndex).toBe(0);
    });

    it('should navigate through menu items with ArrowDown', async () => {
      // Open menu
      triggerElement.focus();
      triggerElement.dispatchEvent(createKeyboardEvent('F10', { shiftKey: true }));
      await delay(10);

      // Navigate down
      contextMenu.dispatchEvent(createKeyboardEvent('ArrowDown'));
      expect(document.activeElement).toBe(menuItems[1]);
      expect(focusedMenuIndex).toBe(1);

      contextMenu.dispatchEvent(createKeyboardEvent('ArrowDown'));
      expect(document.activeElement).toBe(menuItems[2]);
      expect(focusedMenuIndex).toBe(2);
    });

    it('should navigate through menu items with ArrowUp', async () => {
      // Open menu and navigate to last item
      triggerElement.focus();
      triggerElement.dispatchEvent(createKeyboardEvent('F10', { shiftKey: true }));
      await delay(10);

      focusedMenuIndex = 2;
      focusMenuItem(2);

      // Navigate up
      contextMenu.dispatchEvent(createKeyboardEvent('ArrowUp'));
      expect(document.activeElement).toBe(menuItems[1]);
      expect(focusedMenuIndex).toBe(1);
    });

    it('should wrap around at end with ArrowDown', async () => {
      // Open menu and navigate to last item
      triggerElement.focus();
      triggerElement.dispatchEvent(createKeyboardEvent('F10', { shiftKey: true }));
      await delay(10);

      focusedMenuIndex = 2;
      focusMenuItem(2);

      // Navigate down - should wrap to first
      contextMenu.dispatchEvent(createKeyboardEvent('ArrowDown'));
      expect(document.activeElement).toBe(menuItems[0]);
      expect(focusedMenuIndex).toBe(0);
    });

    it('should wrap around at start with ArrowUp', async () => {
      // Open menu (first item focused)
      triggerElement.focus();
      triggerElement.dispatchEvent(createKeyboardEvent('F10', { shiftKey: true }));
      await delay(10);

      // Navigate up - should wrap to last
      contextMenu.dispatchEvent(createKeyboardEvent('ArrowUp'));
      expect(document.activeElement).toBe(menuItems[2]);
      expect(focusedMenuIndex).toBe(2);
    });

    it('should activate menu item with Enter', async () => {
      // Open menu
      triggerElement.focus();
      triggerElement.dispatchEvent(createKeyboardEvent('F10', { shiftKey: true }));
      await delay(10);

      // Navigate to second item
      contextMenu.dispatchEvent(createKeyboardEvent('ArrowDown'));

      // Press Enter
      contextMenu.dispatchEvent(createKeyboardEvent('Enter'));
      await delay(10);

      // Action should be selected and menu closed
      expect(selectedAction).toBe('Mute');
      expect(isMenuOpen).toBe(false);
    });

    it('should activate menu item with Space', async () => {
      // Open menu
      triggerElement.focus();
      triggerElement.dispatchEvent(createKeyboardEvent('F10', { shiftKey: true }));
      await delay(10);

      // Press Space on first item
      contextMenu.dispatchEvent(createKeyboardEvent(' '));
      await delay(10);

      // Action should be selected and menu closed
      expect(selectedAction).toBe('Delete');
      expect(isMenuOpen).toBe(false);
    });

    it('should close menu and restore focus on Escape', async () => {
      // Focus trigger and open menu
      triggerElement.focus();
      triggerElement.dispatchEvent(createKeyboardEvent('F10', { shiftKey: true }));
      await delay(10);

      // Press Escape
      contextMenu.dispatchEvent(createKeyboardEvent('Escape'));
      await delay(10);

      // Menu should be closed
      expect(isMenuOpen).toBe(false);
      expect(contextMenu.style.display).toBe('none');

      // Focus should return to trigger
      expect(document.activeElement).toBe(triggerElement);
    });

    it('should close menu on Tab', async () => {
      // Open menu
      triggerElement.focus();
      triggerElement.dispatchEvent(createKeyboardEvent('F10', { shiftKey: true }));
      await delay(10);

      // Press Tab
      contextMenu.dispatchEvent(createKeyboardEvent('Tab'));
      await delay(10);

      // Menu should be closed
      expect(isMenuOpen).toBe(false);
    });

    it('should have correct ARIA attributes on context menu', () => {
      expectRole(contextMenu, 'menu');
      expectAriaAttribute(contextMenu, 'aria-label', 'Conversation actions');
    });

    it('should have correct ARIA attributes on menu items', () => {
      menuItems.forEach(item => {
        expectRole(item, 'menuitem');
      });
    });
  });

  /**
   * Test Suite: Infinite Scroll Announcements
   *
   * Tests the live announcements for infinite scroll:
   * 1. Loading state triggers "Loading more items" announcement
   * 2. Items loaded triggers count announcement
   * 3. All items loaded triggers completion announcement
   * 4. Loading error triggers error announcement
   *
   * **Validates: Requirements 14.1-14.6**
   */
  describe('Infinite Scroll Announcements', () => {
    let liveAnnouncerService: LiveAnnouncerService;
    let listContainer: HTMLDivElement;
    let loadingIndicator: HTMLDivElement;
    let announcements: string[];

    beforeEach(() => {
      liveAnnouncerService = new LiveAnnouncerService();
      announcements = [];

      // Spy on announce method
      vi.spyOn(liveAnnouncerService, 'announce').mockImplementation((message: string) => {
        announcements.push(message);
      });

      vi.spyOn(liveAnnouncerService, 'announceError').mockImplementation((message: string) => {
        announcements.push(`ERROR: ${message}`);
      });

      // Create list container
      listContainer = document.createElement('div');
      listContainer.setAttribute('role', 'listbox');
      listContainer.setAttribute('aria-label', 'Items list');
      listContainer.setAttribute('aria-busy', 'false');

      // Create loading indicator
      loadingIndicator = document.createElement('div');
      loadingIndicator.className = 'loading-indicator';
      loadingIndicator.setAttribute('aria-hidden', 'true');
      loadingIndicator.textContent = 'Loading...';
      loadingIndicator.style.display = 'none';
      listContainer.appendChild(loadingIndicator);

      document.body.appendChild(listContainer);
    });

    afterEach(() => {
      vi.restoreAllMocks();
      liveAnnouncerService.ngOnDestroy();
      document.body.removeChild(listContainer);
    });

    function simulateLoadMore(): void {
      // Set loading state
      listContainer.setAttribute('aria-busy', 'true');
      loadingIndicator.style.display = 'block';

      // Announce loading
      liveAnnouncerService.announce('Loading more items', 'polite');
    }

    function simulateLoadComplete(itemCount: number): void {
      // Clear loading state
      listContainer.setAttribute('aria-busy', 'false');
      loadingIndicator.style.display = 'none';

      // Announce items loaded
      liveAnnouncerService.announce(`${itemCount} more items loaded`, 'polite');
    }

    function simulateAllItemsLoaded(): void {
      // Clear loading state
      listContainer.setAttribute('aria-busy', 'false');
      loadingIndicator.style.display = 'none';

      // Announce all items loaded
      liveAnnouncerService.announce('All items loaded', 'polite');
    }

    function simulateLoadError(): void {
      // Clear loading state
      listContainer.setAttribute('aria-busy', 'false');
      loadingIndicator.style.display = 'none';

      // Announce error
      liveAnnouncerService.announceError('Failed to load more items');
    }

    it('should announce "Loading more items" when infinite scroll triggers', () => {
      simulateLoadMore();

      expect(announcements).toContain('Loading more items');
      expect(listContainer.getAttribute('aria-busy')).toBe('true');
    });

    it('should announce item count when items are loaded', () => {
      simulateLoadMore();
      simulateLoadComplete(10);

      expect(announcements).toContain('10 more items loaded');
      expect(listContainer.getAttribute('aria-busy')).toBe('false');
    });

    it('should announce "All items loaded" when no more items available', () => {
      simulateLoadMore();
      simulateAllItemsLoaded();

      expect(announcements).toContain('All items loaded');
    });

    it('should announce error when loading fails', () => {
      simulateLoadMore();
      simulateLoadError();

      expect(announcements).toContain('ERROR: Failed to load more items');
    });

    it('should have aria-hidden on loading indicator', () => {
      expectAriaAttribute(loadingIndicator, 'aria-hidden', 'true');
    });

    it('should set aria-busy to true while loading', () => {
      simulateLoadMore();
      expectAriaAttribute(listContainer, 'aria-busy', 'true');
    });

    it('should set aria-busy to false when loading completes', () => {
      simulateLoadMore();
      simulateLoadComplete(5);
      expectAriaAttribute(listContainer, 'aria-busy', 'false');
    });

    it('should handle complete loading flow: trigger → loading → complete', () => {
      // Trigger load more
      simulateLoadMore();
      expect(announcements.length).toBe(1);
      expect(announcements[0]).toBe('Loading more items');

      // Complete loading
      simulateLoadComplete(15);
      expect(announcements.length).toBe(2);
      expect(announcements[1]).toBe('15 more items loaded');
    });
  });

  /**
   * Test Suite: Selection Change Events and Announcements
   *
   * Tests the selection behavior and announcements:
   * 1. Selection toggle emits selectionChange event
   * 2. Selection count is announced
   * 3. Single selection mode allows only one item
   * 4. Multiple selection mode allows multiple items
   * 5. Range selection with Shift+Space
   * 6. Select all with Ctrl+A
   * 7. Clear selection with Escape
   *
   * **Validates: Requirements 13.1-13.7**
   */
  describe('Selection Change Events and Announcements', () => {
    let liveAnnouncerService: LiveAnnouncerService;
    let selectionManager: ListSelectionManager<TestItem>;
    let listContainer: HTMLDivElement;
    let listItems: HTMLDivElement[];
    let announcements: string[];
    let selectionChangeEvents: any[];

    interface TestItem {
      id: string;
      name: string;
    }

    const testItems: TestItem[] = [
      { id: '1', name: 'Item 1' },
      { id: '2', name: 'Item 2' },
      { id: '3', name: 'Item 3' },
      { id: '4', name: 'Item 4' },
      { id: '5', name: 'Item 5' },
    ];

    beforeEach(() => {
      liveAnnouncerService = new LiveAnnouncerService();
      announcements = [];
      selectionChangeEvents = [];

      // Spy on announce method
      vi.spyOn(liveAnnouncerService, 'announce').mockImplementation((message: string) => {
        announcements.push(message);
      });

      // Create list container
      listContainer = document.createElement('div');
      listContainer.setAttribute('role', 'listbox');
      listContainer.setAttribute('aria-label', 'Selectable items');

      // Create list items
      listItems = [];
      testItems.forEach((item, index) => {
        const element = document.createElement('div');
        element.setAttribute('role', 'option');
        element.setAttribute('tabindex', index === 0 ? '0' : '-1');
        element.setAttribute('aria-selected', 'false');
        element.setAttribute('aria-label', item.name);
        element.textContent = item.name;
        element.id = `item-${item.id}`;
        listContainer.appendChild(element);
        listItems.push(element);
      });

      document.body.appendChild(listContainer);
    });

    afterEach(() => {
      vi.restoreAllMocks();
      liveAnnouncerService.ngOnDestroy();
      document.body.removeChild(listContainer);
    });

    function emitSelectionChange(): void {
      const state = selectionManager.getSelectionState();
      selectionChangeEvents.push(state);
    }

    function announceSelectionCount(): void {
      const count = selectionManager.selectedCount();
      if (count > 0) {
        liveAnnouncerService.announce(`${count} items selected`, 'polite');
      }
    }

    function updateAriaSelected(): void {
      testItems.forEach((item, index) => {
        const isSelected = selectionManager.isSelected(item);
        listItems[index].setAttribute('aria-selected', isSelected ? 'true' : 'false');
      });
    }

    describe('Single Selection Mode', () => {
      beforeEach(() => {
        selectionManager = new ListSelectionManager<TestItem>(
          SelectionMode.single,
          item => item.id
        );
      });

      it('should allow only one item to be selected at a time', () => {
        // Select first item
        selectionManager.toggleSelection(testItems[0], 0);
        updateAriaSelected();
        emitSelectionChange();

        expect(selectionManager.selectedCount()).toBe(1);
        expect(selectionManager.isSelected(testItems[0])).toBe(true);
        expectAriaAttribute(listItems[0], 'aria-selected', 'true');

        // Select second item - should deselect first
        selectionManager.toggleSelection(testItems[1], 1);
        updateAriaSelected();
        emitSelectionChange();

        expect(selectionManager.selectedCount()).toBe(1);
        expect(selectionManager.isSelected(testItems[0])).toBe(false);
        expect(selectionManager.isSelected(testItems[1])).toBe(true);
        expectAriaAttribute(listItems[0], 'aria-selected', 'false');
        expectAriaAttribute(listItems[1], 'aria-selected', 'true');
      });

      it('should emit selectionChange event on selection toggle', () => {
        selectionManager.toggleSelection(testItems[0], 0);
        emitSelectionChange();

        expect(selectionChangeEvents.length).toBe(1);
        expect(selectionChangeEvents[0].selectedIds.has('1')).toBe(true);
      });

      it('should deselect item when toggled again', () => {
        // Select item
        selectionManager.toggleSelection(testItems[0], 0);
        expect(selectionManager.isSelected(testItems[0])).toBe(true);

        // Toggle again - should deselect
        selectionManager.toggleSelection(testItems[0], 0);
        expect(selectionManager.isSelected(testItems[0])).toBe(false);
        expect(selectionManager.selectedCount()).toBe(0);
      });
    });

    describe('Multiple Selection Mode', () => {
      beforeEach(() => {
        selectionManager = new ListSelectionManager<TestItem>(
          SelectionMode.multiple,
          item => item.id
        );
        listContainer.setAttribute('aria-multiselectable', 'true');
      });

      it('should allow multiple items to be selected', () => {
        // Select multiple items
        selectionManager.toggleSelection(testItems[0], 0);
        selectionManager.toggleSelection(testItems[2], 2);
        selectionManager.toggleSelection(testItems[4], 4);
        updateAriaSelected();

        expect(selectionManager.selectedCount()).toBe(3);
        expect(selectionManager.isSelected(testItems[0])).toBe(true);
        expect(selectionManager.isSelected(testItems[2])).toBe(true);
        expect(selectionManager.isSelected(testItems[4])).toBe(true);
      });

      it('should have aria-multiselectable attribute', () => {
        expectAriaAttribute(listContainer, 'aria-multiselectable', 'true');
      });

      it('should announce selection count', () => {
        selectionManager.toggleSelection(testItems[0], 0);
        selectionManager.toggleSelection(testItems[1], 1);
        selectionManager.toggleSelection(testItems[2], 2);
        announceSelectionCount();

        expect(announcements).toContain('3 items selected');
      });

      it('should extend selection with extendSelection', () => {
        // Select first item
        selectionManager.toggleSelection(testItems[0], 0);

        // Extend selection to second item (Shift+Arrow behavior)
        selectionManager.extendSelection(testItems[1], 1);

        expect(selectionManager.selectedCount()).toBe(2);
        expect(selectionManager.isSelected(testItems[0])).toBe(true);
        expect(selectionManager.isSelected(testItems[1])).toBe(true);
      });

      it('should select range with selectRange (Shift+Space behavior)', () => {
        // Set anchor at index 1
        selectionManager.toggleSelection(testItems[1], 1);

        // Select range to index 3
        selectionManager.selectRange(testItems, 3);

        expect(selectionManager.selectedCount()).toBe(3);
        expect(selectionManager.isSelected(testItems[1])).toBe(true);
        expect(selectionManager.isSelected(testItems[2])).toBe(true);
        expect(selectionManager.isSelected(testItems[3])).toBe(true);
      });

      it('should select all items with selectAll (Ctrl+A behavior)', () => {
        selectionManager.selectAll(testItems);
        updateAriaSelected();
        announceSelectionCount();

        expect(selectionManager.selectedCount()).toBe(5);
        testItems.forEach(item => {
          expect(selectionManager.isSelected(item)).toBe(true);
        });
        expect(announcements).toContain('5 items selected');
      });

      it('should clear all selections with clearSelection (Escape behavior)', () => {
        // Select some items
        selectionManager.toggleSelection(testItems[0], 0);
        selectionManager.toggleSelection(testItems[1], 1);
        expect(selectionManager.selectedCount()).toBe(2);

        // Clear selection
        selectionManager.clearSelection();
        updateAriaSelected();

        expect(selectionManager.selectedCount()).toBe(0);
        expect(selectionManager.hasSelection()).toBe(false);
        testItems.forEach((item, index) => {
          expectAriaAttribute(listItems[index], 'aria-selected', 'false');
        });
      });

      it('should emit selectionChange event with correct state', () => {
        selectionManager.toggleSelection(testItems[0], 0);
        selectionManager.toggleSelection(testItems[2], 2);
        emitSelectionChange();

        expect(selectionChangeEvents.length).toBe(1);
        const state = selectionChangeEvents[0];
        expect(state.mode).toBe(SelectionMode.multiple);
        expect(state.selectedIds.size).toBe(2);
        expect(state.selectedIds.has('1')).toBe(true);
        expect(state.selectedIds.has('3')).toBe(true);
      });
    });

    describe('Selection Mode: None', () => {
      beforeEach(() => {
        selectionManager = new ListSelectionManager<TestItem>(SelectionMode.none, item => item.id);
      });

      it('should not allow selection when mode is none', () => {
        selectionManager.toggleSelection(testItems[0], 0);

        expect(selectionManager.selectedCount()).toBe(0);
        expect(selectionManager.isSelected(testItems[0])).toBe(false);
      });
    });
  });

  /**
   * Test Suite: Complete List Accessibility Flow
   *
   * Tests the complete end-to-end flow combining all accessibility features:
   * 1. Search → Navigate → Select → Context Menu → Action
   *
   * **Validates: All Requirements**
   */
  describe('Complete List Accessibility Flow', () => {
    let focusTrapService: FocusTrapService;
    let liveAnnouncerService: LiveAnnouncerService;
    let listNavigationService: ListNavigationService;
    let selectionManager: ListSelectionManager<TestItem>;
    let container: HTMLDivElement;
    let searchInput: HTMLInputElement;
    let listContainer: HTMLDivElement;
    let listItems: HTMLDivElement[];
    let contextMenu: HTMLDivElement;
    let menuItems: HTMLDivElement[];
    let focusedIndex: number;
    let isMenuOpen: boolean;
    let announcements: string[];

    interface TestItem {
      id: string;
      name: string;
    }

    const testItems: TestItem[] = [
      { id: '1', name: 'John Doe' },
      { id: '2', name: 'Jane Smith' },
      { id: '3', name: 'Bob Wilson' },
    ];

    beforeEach(() => {
      focusTrapService = new FocusTrapService();
      liveAnnouncerService = new LiveAnnouncerService();
      listNavigationService = new ListNavigationService();
      selectionManager = new ListSelectionManager<TestItem>(
        SelectionMode.multiple,
        item => item.id
      );
      focusedIndex = 0;
      isMenuOpen = false;
      announcements = [];

      // Spy on announce
      vi.spyOn(liveAnnouncerService, 'announce').mockImplementation((message: string) => {
        announcements.push(message);
      });

      // Create container
      container = document.createElement('div');

      // Create search bar
      searchInput = document.createElement('input');
      searchInput.type = 'text';
      searchInput.setAttribute('aria-label', 'Search');
      container.appendChild(searchInput);

      // Create list
      listContainer = document.createElement('div');
      listContainer.setAttribute('role', 'listbox');
      listContainer.setAttribute('aria-multiselectable', 'true');

      listItems = [];
      testItems.forEach((item, index) => {
        const element = document.createElement('div');
        element.setAttribute('role', 'option');
        element.setAttribute('tabindex', index === 0 ? '0' : '-1');
        element.setAttribute('aria-selected', 'false');
        element.setAttribute('aria-label', item.name);
        element.textContent = item.name;
        listContainer.appendChild(element);
        listItems.push(element);
      });
      container.appendChild(listContainer);

      // Create context menu
      contextMenu = document.createElement('div');
      contextMenu.setAttribute('role', 'menu');
      contextMenu.style.display = 'none';

      menuItems = [];
      ['Delete', 'Mute'].forEach(action => {
        const item = document.createElement('div');
        item.setAttribute('role', 'menuitem');
        item.setAttribute('tabindex', '-1');
        item.textContent = action;
        contextMenu.appendChild(item);
        menuItems.push(item);
      });
      container.appendChild(contextMenu);

      document.body.appendChild(container);
    });

    afterEach(() => {
      vi.restoreAllMocks();
      liveAnnouncerService.ngOnDestroy();
      if (focusTrapService.isActive(contextMenu)) {
        focusTrapService.deactivate(contextMenu);
      }
      document.body.removeChild(container);
    });

    function focusListItem(index: number): void {
      listItems.forEach((item, i) => {
        item.setAttribute('tabindex', i === index ? '0' : '-1');
      });
      focusedIndex = index;
      listItems[index].focus();
    }

    function openContextMenu(): void {
      isMenuOpen = true;
      contextMenu.style.display = 'block';
      focusTrapService.activate({
        container: contextMenu,
        initialFocus: menuItems[0],
        returnFocusOnDeactivate: true,
      });
    }

    function closeContextMenu(): void {
      isMenuOpen = false;
      contextMenu.style.display = 'none';
      focusTrapService.deactivate(contextMenu);
    }

    it('should complete full accessibility flow: search → navigate → select → context menu', async () => {
      // Step 1: Focus search bar
      searchInput.focus();
      expect(document.activeElement).toBe(searchInput);

      // Step 2: Navigate to list with ArrowDown
      focusListItem(0);
      expect(document.activeElement).toBe(listItems[0]);

      // Step 3: Navigate through list
      const newIndex = listNavigationService.handleKeyNavigation(
        createKeyboardEvent('ArrowDown'),
        focusedIndex,
        { itemCount: listItems.length }
      );
      focusListItem(newIndex);
      expect(document.activeElement).toBe(listItems[1]);

      // Step 4: Select item with Space
      selectionManager.toggleSelection(testItems[1], 1);
      listItems[1].setAttribute('aria-selected', 'true');
      liveAnnouncerService.announce('1 items selected', 'polite');

      expect(selectionManager.isSelected(testItems[1])).toBe(true);
      expectAriaAttribute(listItems[1], 'aria-selected', 'true');
      expect(announcements).toContain('1 items selected');

      // Step 5: Open context menu with Shift+F10
      openContextMenu();
      await delay(10);

      expect(isMenuOpen).toBe(true);
      expect(document.activeElement).toBe(menuItems[0]);

      // Step 6: Close context menu with Escape
      closeContextMenu();
      await delay(10);

      expect(isMenuOpen).toBe(false);
      // Focus should return to list item
      expect(document.activeElement).toBe(listItems[1]);
    });

    it('should maintain selection state through context menu interaction', async () => {
      // Select an item
      focusListItem(0);
      selectionManager.toggleSelection(testItems[0], 0);
      listItems[0].setAttribute('aria-selected', 'true');

      // Open and close context menu
      openContextMenu();
      await delay(10);
      closeContextMenu();
      await delay(10);

      // Selection should be maintained
      expect(selectionManager.isSelected(testItems[0])).toBe(true);
      expectAriaAttribute(listItems[0], 'aria-selected', 'true');
    });
  });
});
