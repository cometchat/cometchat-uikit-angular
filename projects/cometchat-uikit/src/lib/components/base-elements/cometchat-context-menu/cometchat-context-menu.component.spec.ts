/**
 * CometChatContextMenu Component Tests
 *
 * Comprehensive test suite for the context menu component that supports
 * a data array of menu items, topMenuSize for visible items, a "more" button
 * for overflow items, keyboard navigation (ArrowUp/Down, Enter, Space, Escape, Tab),
 * and ARIA accessibility attributes (role=menu, role=menuitem, aria-expanded, aria-haspopup).
 *
 * Categories: Initialization, Input Bindings, Output Emissions,
 *             DOM Rendering, Keyboard Accessibility, ARIA,
 *             Positioning, Edge Cases
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 3.1, 3.3,
 *            10.1, 10.2, 10.4, 10.5, 14.4, 14.5, 15.7
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ensureSdkReady, sdkCleanup } from '../../../testing';
import { CometChatContextMenuComponent } from './cometchat-context-menu.component';
import { CometChatActionsIcon, CometChatActionsView, CometChatOption } from '../../../modals';
import { Placement } from '../../../Enums/Enums';

describe('CometChatContextMenuComponent', () => {
  let fixture: ComponentFixture<CometChatContextMenuComponent>;
  let component: CometChatContextMenuComponent;
  let el: HTMLElement;

  beforeAll(async () => {
    await ensureSdkReady();
  });

  afterAll(async () => {
    await sdkCleanup();
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CometChatContextMenuComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CometChatContextMenuComponent);
    component = fixture.componentInstance;
    el = fixture.nativeElement;
  });

  afterEach(() => {
    fixture.destroy();
  });

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  function createSampleActions(count = 5): CometChatActionsIcon[] {
    const ids = ['edit', 'copy', 'delete', 'reply', 'forward', 'pin', 'star'];
    const titles = [
      'Edit Message',
      'Copy Message',
      'Delete Message',
      'Reply',
      'Forward',
      'Pin',
      'Star',
    ];
    return Array.from(
      { length: count },
      (_, i) =>
        new CometChatActionsIcon({
          id: ids[i] || `action-${i}`,
          title: titles[i] || `Action ${i}`,
          iconURL: `${ids[i] || 'action'}.svg`,
          onClick: vi.fn(),
        })
    );
  }

  function getMenuList(): HTMLElement | null {
    return el.querySelector('.cometchat-menu-list');
  }

  function getTopMenuItems(): NodeListOf<HTMLElement> {
    return el.querySelectorAll('.cometchat-menu-list__main-menu-item');
  }

  function getMoreButton(): HTMLElement | null {
    return el.querySelector('.cometchat-menu-list__sub-menu');
  }

  function getSubMenuList(): HTMLElement | null {
    return el.querySelector('.cometchat-menu-list__sub-menu-list');
  }

  function getSubMenuItems(): NodeListOf<HTMLElement> {
    return el.querySelectorAll('.cometchat-menu-list__sub-menu-list-item');
  }

  function dispatchKeydown(key: string, target?: HTMLElement): void {
    const event = new KeyboardEvent('keydown', {
      key,
      bubbles: true,
      cancelable: true,
    });
    (target ?? el).dispatchEvent(event);
    fixture.detectChanges();
  }

  // ---------------------------------------------------------------------------
  // Initialization
  // ---------------------------------------------------------------------------
  describe('Initialization', () => {
    it('should create the component', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should have default empty data array', () => {
      expect(component.data).toEqual([]);
    });

    it('should have default topMenuSize of 2', () => {
      expect(component.topMenuSize).toBe(2);
    });

    it('should have default placement of left', () => {
      expect(component.placement).toBe(Placement.left);
    });

    it('should have showSubMenu false initially', () => {
      expect(component.showSubMenu).toBe(false);
    });

    it('should have focusedItemIndex at -1 initially', () => {
      expect(component.focusedItemIndex).toBe(-1);
    });

    it('should render the root .cometchat wrapper', () => {
      fixture.detectChanges();
      expect(el.querySelector('.cometchat')).toBeTruthy();
    });

    it('should render the menu list container', () => {
      fixture.detectChanges();
      expect(getMenuList()).toBeTruthy();
    });

    it('should have default closeOnOutsideClick as false', () => {
      expect(component.closeOnOutsideClick).toBe(false);
    });

    it('should have default disableBackgroundInteraction as false', () => {
      expect(component.disableBackgroundInteraction).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // Input Bindings
  // ---------------------------------------------------------------------------
  describe('Input Bindings', () => {
    it('should accept data input with CometChatActionsIcon items', () => {
      const actions = createSampleActions(3);
      component.data = actions;
      fixture.detectChanges();
      expect(component.data.length).toBe(3);
    });

    it('should accept data input with CometChatOption items', () => {
      const options = [
        new CometChatOption({ id: 'opt-1', title: 'Option 1' }),
        new CometChatOption({ id: 'opt-2', title: 'Option 2' }),
      ];
      component.data = options;
      fixture.detectChanges();
      expect(component.data.length).toBe(2);
    });

    it('should compute topMenu based on topMenuSize', () => {
      component.data = createSampleActions(5);
      component.topMenuSize = 3;
      fixture.detectChanges();
      // topMenu = data.slice(0, topMenuSize - 1) = first 2 items
      expect(component.topMenu.length).toBe(2);
      expect(component.topMenu[0].id).toBe('edit');
      expect(component.topMenu[1].id).toBe('copy');
    });

    it('should compute subMenu as remaining items after topMenu', () => {
      component.data = createSampleActions(5);
      component.topMenuSize = 3;
      fixture.detectChanges();
      // subMenu = data.slice(topMenuSize - 1) = items from index 2 onwards
      expect(component.subMenu.length).toBe(3);
      expect(component.subMenu[0].id).toBe('delete');
    });

    it('should return empty topMenu when topMenuSize is 0', () => {
      component.data = createSampleActions(3);
      component.topMenuSize = 0;
      fixture.detectChanges();
      expect(component.topMenu.length).toBe(0);
    });

    it('should return all items in subMenu when topMenuSize is 0', () => {
      component.data = createSampleActions(3);
      component.topMenuSize = 0;
      fixture.detectChanges();
      expect(component.subMenu.length).toBe(3);
    });

    it('should accept placement input', () => {
      component.placement = Placement.right;
      fixture.detectChanges();
      expect(component.placement).toBe(Placement.right);
    });

    it('should accept moreIconHoverText input', () => {
      component.moreIconHoverText = 'Show more';
      fixture.detectChanges();
      expect(component.moreIconHoverText).toBe('Show more');
    });

    it('should show more button when data exceeds topMenu', () => {
      component.data = createSampleActions(5);
      component.topMenuSize = 3;
      fixture.detectChanges();
      expect(component.shouldShowMoreButton).toBe(true);
    });

    it('should not show more button when all items fit in topMenu', () => {
      component.data = [
        new CometChatActionsIcon({ id: 'a', title: 'A', iconURL: 'a.svg', onClick: vi.fn() }),
      ];
      component.topMenuSize = 3;
      fixture.detectChanges();
      // topMenu = data.slice(0, 2) = [a], data.length (1) <= topMenu.length (1)
      expect(component.shouldShowMoreButton).toBe(false);
    });

    it('should update DOM when data input changes', () => {
      component.data = createSampleActions(3);
      component.topMenuSize = 2;
      fixture.detectChanges();
      expect(getTopMenuItems().length).toBe(1);

      component.data = createSampleActions(5);
      fixture.detectChanges();
      expect(getTopMenuItems().length).toBe(1);
      expect(component.subMenu.length).toBe(4);
    });
  });

  // ---------------------------------------------------------------------------
  // Output Emissions
  // ---------------------------------------------------------------------------
  describe('Output Emissions', () => {
    it('should emit optionClick when a top menu item is clicked', () => {
      const actions = createSampleActions(5);
      component.data = actions;
      component.topMenuSize = 3;
      fixture.detectChanges();

      const spy = vi.fn();
      component.optionClick.subscribe(spy);

      const topItems = getTopMenuItems();
      topItems[0].click();
      fixture.detectChanges();

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(actions[0]);
    });

    it('should emit optionClick when a sub menu item is clicked', () => {
      const actions = createSampleActions(5);
      component.data = actions;
      component.topMenuSize = 2;
      fixture.detectChanges();

      // Open submenu
      component.handleMenuClick();
      fixture.detectChanges();

      const spy = vi.fn();
      component.optionClick.subscribe(spy);

      const subItems = getSubMenuItems();
      subItems[0].click();
      fixture.detectChanges();

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(component.data[1]); // subMenu starts at index 1
    });

    it('should call onClick on CometChatActionsIcon items when clicked', () => {
      const actions = createSampleActions(3);
      component.data = actions;
      component.topMenuSize = 2;
      fixture.detectChanges();

      const topItems = getTopMenuItems();
      topItems[0].click();
      fixture.detectChanges();

      expect(actions[0].onClick).toHaveBeenCalledWith(0);
    });

    it('should not throw when clicking CometChatOption without onClick', () => {
      const option = new CometChatOption({ id: 'opt', title: 'Option' });
      component.data = [option, new CometChatOption({ id: 'opt2', title: 'Option 2' })];
      component.topMenuSize = 2;
      fixture.detectChanges();

      expect(() => {
        const topItems = getTopMenuItems();
        topItems[0].click();
        fixture.detectChanges();
      }).not.toThrow();
    });

    it('should close submenu after item click', () => {
      component.data = createSampleActions(5);
      component.topMenuSize = 2;
      fixture.detectChanges();

      component.handleMenuClick();
      fixture.detectChanges();
      expect(component.showSubMenu).toBe(true);

      const subItems = getSubMenuItems();
      subItems[0].click();
      fixture.detectChanges();

      expect(component.showSubMenu).toBe(false);
    });

    it('should emit different items for sequential clicks', () => {
      const actions = createSampleActions(5);
      component.data = actions;
      component.topMenuSize = 2;
      fixture.detectChanges();

      const emitted: string[] = [];
      component.optionClick.subscribe(item => emitted.push(item.id || ''));

      // Click top menu item
      getTopMenuItems()[0].click();
      fixture.detectChanges();

      // Open submenu and click sub item
      component.handleMenuClick();
      fixture.detectChanges();
      getSubMenuItems()[0].click();
      fixture.detectChanges();

      expect(emitted).toEqual(['edit', 'copy']);
    });
  });

  // ---------------------------------------------------------------------------
  // DOM Rendering
  // ---------------------------------------------------------------------------
  describe('DOM Rendering', () => {
    it('should render BEM block class .cometchat-menu-list', () => {
      fixture.detectChanges();
      expect(getMenuList()).toBeTruthy();
    });

    it('should render top menu items based on topMenuSize', () => {
      component.data = createSampleActions(5);
      component.topMenuSize = 3;
      fixture.detectChanges();
      // topMenu = 2 items (topMenuSize - 1)
      expect(getTopMenuItems().length).toBe(2);
    });

    it('should render the more button when there are overflow items', () => {
      component.data = createSampleActions(5);
      component.topMenuSize = 3;
      fixture.detectChanges();
      expect(getMoreButton()).toBeTruthy();
    });

    it('should not render the more button when all items fit', () => {
      component.data = [
        new CometChatActionsIcon({ id: 'a', title: 'A', iconURL: 'a.svg', onClick: vi.fn() }),
      ];
      component.topMenuSize = 3;
      fixture.detectChanges();
      expect(getMoreButton()).toBeNull();
    });

    it('should hide sub menu list when showSubMenu is false', () => {
      component.data = createSampleActions(5);
      component.topMenuSize = 2;
      fixture.detectChanges();

      const subMenuList = getSubMenuList();
      expect(subMenuList?.style.display).toBe('none');
    });

    it('should show sub menu list when submenu is opened', () => {
      component.data = createSampleActions(5);
      component.topMenuSize = 2;
      fixture.detectChanges();

      component.handleMenuClick();
      fixture.detectChanges();

      const subMenuList = getSubMenuList();
      expect(subMenuList?.style.display).toBe('flex');
    });

    it('should render correct number of sub menu items', () => {
      component.data = createSampleActions(5);
      component.topMenuSize = 3;
      fixture.detectChanges();

      component.handleMenuClick();
      fixture.detectChanges();

      // subMenu = 3 items (from index 2 onwards)
      expect(getSubMenuItems().length).toBe(3);
    });

    it('should render item titles in sub menu items', () => {
      component.data = createSampleActions(5);
      component.topMenuSize = 2;
      fixture.detectChanges();

      component.handleMenuClick();
      fixture.detectChanges();

      const subItems = getSubMenuItems();
      const firstLabel = subItems[0].querySelector('.cometchat-menu-list__sub-menu-item-title');
      expect(firstLabel?.textContent?.trim()).toBe('Copy Message');
    });

    it('should render icon elements for items with iconURL', () => {
      component.data = createSampleActions(3);
      component.topMenuSize = 2;
      fixture.detectChanges();

      component.handleMenuClick();
      fixture.detectChanges();

      const subItems = getSubMenuItems();
      const icon = subItems[0].querySelector('.cometchat-menu-list__sub-menu-list-item-icon');
      expect(icon).toBeTruthy();
    });

    it('should render no menu items when data is empty', () => {
      component.data = [];
      fixture.detectChanges();
      expect(getTopMenuItems().length).toBe(0);
      expect(getSubMenuItems().length).toBe(0);
    });

    it('should apply destructive modifier for delete items', () => {
      component.data = createSampleActions(5);
      component.topMenuSize = 2;
      fixture.detectChanges();

      component.handleMenuClick();
      fixture.detectChanges();

      // 'delete' is at subMenu index 1 (data index 2, subMenu starts at 1)
      const subItems = getSubMenuItems();
      const deleteItem = Array.from(subItems).find(item => item.id === 'delete');
      expect(
        deleteItem?.classList.contains('cometchat-menu-list__sub-menu-list-item--destructive')
      ).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // Keyboard Accessibility
  // ---------------------------------------------------------------------------
  describe('Keyboard Accessibility', () => {
    it('should not handle keyboard events when submenu is closed', () => {
      component.data = createSampleActions(5);
      component.topMenuSize = 2;
      fixture.detectChanges();

      dispatchKeydown('ArrowDown');

      expect(component.focusedItemIndex).toBe(-1);
    });

    it('should navigate down with ArrowDown when submenu is open', () => {
      component.data = createSampleActions(5);
      component.topMenuSize = 2;
      fixture.detectChanges();

      component.handleMenuClick();
      fixture.detectChanges();
      // focusedItemIndex starts at 0 after opening

      dispatchKeydown('ArrowDown');

      expect(component.focusedItemIndex).toBe(1);
    });

    it('should navigate up with ArrowUp when submenu is open', () => {
      component.data = createSampleActions(5);
      component.topMenuSize = 2;
      fixture.detectChanges();

      component.handleMenuClick();
      fixture.detectChanges();
      component.focusedItemIndex = 2;

      dispatchKeydown('ArrowUp');

      expect(component.focusedItemIndex).toBe(1);
    });

    it('should wrap to last item when ArrowUp from first item', () => {
      component.data = createSampleActions(5);
      component.topMenuSize = 2;
      fixture.detectChanges();

      component.handleMenuClick();
      fixture.detectChanges();
      component.focusedItemIndex = 0;

      dispatchKeydown('ArrowUp');

      expect(component.focusedItemIndex).toBe(component.subMenu.length - 1);
    });

    it('should wrap to first item when ArrowDown from last item', () => {
      component.data = createSampleActions(5);
      component.topMenuSize = 2;
      fixture.detectChanges();

      component.handleMenuClick();
      fixture.detectChanges();
      component.focusedItemIndex = component.subMenu.length - 1;

      dispatchKeydown('ArrowDown');

      expect(component.focusedItemIndex).toBe(0);
    });

    it('should select focused item with Enter key', () => {
      const actions = createSampleActions(5);
      component.data = actions;
      component.topMenuSize = 2;
      fixture.detectChanges();

      component.handleMenuClick();
      fixture.detectChanges();

      const spy = vi.fn();
      component.optionClick.subscribe(spy);

      // focusedItemIndex is 0 after opening
      dispatchKeydown('Enter');

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(component.subMenu[0]);
    });

    it('should select focused item with Space key', () => {
      const actions = createSampleActions(5);
      component.data = actions;
      component.topMenuSize = 2;
      fixture.detectChanges();

      component.handleMenuClick();
      fixture.detectChanges();
      component.focusedItemIndex = 1;

      const spy = vi.fn();
      component.optionClick.subscribe(spy);

      dispatchKeydown(' ');

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(component.subMenu[1]);
    });

    it('should close submenu with Escape key', () => {
      component.data = createSampleActions(5);
      component.topMenuSize = 2;
      fixture.detectChanges();

      component.handleMenuClick();
      fixture.detectChanges();
      expect(component.showSubMenu).toBe(true);

      dispatchKeydown('Escape');

      expect(component.showSubMenu).toBe(false);
      expect(component.focusedItemIndex).toBe(-1);
    });

    it('should close submenu with Tab key without preventing default', () => {
      component.data = createSampleActions(5);
      component.topMenuSize = 2;
      fixture.detectChanges();

      component.handleMenuClick();
      fixture.detectChanges();
      expect(component.showSubMenu).toBe(true);

      dispatchKeydown('Tab');

      expect(component.showSubMenu).toBe(false);
    });

    it('should not emit when Enter pressed with no focused item', () => {
      component.data = createSampleActions(5);
      component.topMenuSize = 2;
      fixture.detectChanges();

      component.handleMenuClick();
      fixture.detectChanges();
      component.focusedItemIndex = -1;

      const spy = vi.fn();
      component.optionClick.subscribe(spy);

      dispatchKeydown('Enter');

      expect(spy).not.toHaveBeenCalled();
    });

    it('should have tabindex="0" on top menu items for focusability', () => {
      component.data = createSampleActions(5);
      component.topMenuSize = 3;
      fixture.detectChanges();

      const topItems = getTopMenuItems();
      topItems.forEach(item => {
        expect(item.getAttribute('tabindex')).toBe('0');
      });
    });

    it('should have tabindex="0" on sub menu items for focusability', () => {
      component.data = createSampleActions(5);
      component.topMenuSize = 2;
      fixture.detectChanges();

      component.handleMenuClick();
      fixture.detectChanges();

      const subItems = getSubMenuItems();
      subItems.forEach(item => {
        expect(item.getAttribute('tabindex')).toBe('0');
      });
    });

    it('should have tabindex="0" on more button for focusability', () => {
      component.data = createSampleActions(5);
      component.topMenuSize = 3;
      fixture.detectChanges();

      const moreBtn = getMoreButton();
      expect(moreBtn?.getAttribute('tabindex')).toBe('0');
    });

    it('should activate top menu item via Enter keydown binding', () => {
      const actions = createSampleActions(5);
      component.data = actions;
      component.topMenuSize = 3;
      fixture.detectChanges();

      const spy = vi.fn();
      component.optionClick.subscribe(spy);

      const topItems = getTopMenuItems();
      const enterEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
        cancelable: true,
      });
      topItems[0].dispatchEvent(enterEvent);
      fixture.detectChanges();

      expect(spy).toHaveBeenCalledWith(actions[0]);
    });
  });

  // ---------------------------------------------------------------------------
  // ARIA
  // ---------------------------------------------------------------------------
  describe('ARIA', () => {
    it('should have role="menu" on the menu list container', () => {
      component.data = createSampleActions(5);
      fixture.detectChanges();
      const menu = getMenuList();
      expect(menu?.getAttribute('role')).toBe('menu');
    });

    it('should have aria-label on the menu list container', () => {
      component.data = createSampleActions(5);
      fixture.detectChanges();
      const menu = getMenuList();
      expect(menu?.getAttribute('aria-label')).toBeTruthy();
    });

    it('should have role="menuitem" on each top menu item', () => {
      component.data = createSampleActions(5);
      component.topMenuSize = 3;
      fixture.detectChanges();

      const topItems = getTopMenuItems();
      expect(topItems.length).toBe(2);
      topItems.forEach(item => {
        expect(item.getAttribute('role')).toBe('menuitem');
      });
    });

    it('should have role="menuitem" on each sub menu item', () => {
      component.data = createSampleActions(5);
      component.topMenuSize = 2;
      fixture.detectChanges();

      component.handleMenuClick();
      fixture.detectChanges();

      const subItems = getSubMenuItems();
      subItems.forEach(item => {
        expect(item.getAttribute('role')).toBe('menuitem');
      });
    });

    it('should set aria-label to item title on top menu items', () => {
      component.data = createSampleActions(5);
      component.topMenuSize = 3;
      fixture.detectChanges();

      const topItems = getTopMenuItems();
      expect(topItems[0].getAttribute('aria-label')).toBe('Edit Message');
      expect(topItems[1].getAttribute('aria-label')).toBe('Copy Message');
    });

    it('should set aria-label to item title on sub menu items', () => {
      component.data = createSampleActions(5);
      component.topMenuSize = 2;
      fixture.detectChanges();

      component.handleMenuClick();
      fixture.detectChanges();

      const subItems = getSubMenuItems();
      expect(subItems[0].getAttribute('aria-label')).toBe('Copy Message');
    });

    it('should have role="button" on the more button', () => {
      component.data = createSampleActions(5);
      component.topMenuSize = 3;
      fixture.detectChanges();

      const moreBtn = getMoreButton();
      expect(moreBtn?.getAttribute('role')).toBe('button');
    });

    it('should have aria-haspopup="menu" on the more button', () => {
      component.data = createSampleActions(5);
      component.topMenuSize = 3;
      fixture.detectChanges();

      const moreBtn = getMoreButton();
      expect(moreBtn?.getAttribute('aria-haspopup')).toBe('menu');
    });

    it('should have aria-expanded="false" on more button when submenu is closed', () => {
      component.data = createSampleActions(5);
      component.topMenuSize = 3;
      fixture.detectChanges();

      const moreBtn = getMoreButton();
      expect(moreBtn?.getAttribute('aria-expanded')).toBe('false');
    });

    it('should have aria-expanded="true" on more button when submenu is open', () => {
      component.data = createSampleActions(5);
      component.topMenuSize = 3;
      fixture.detectChanges();

      component.handleMenuClick();
      fixture.detectChanges();

      const moreBtn = getMoreButton();
      expect(moreBtn?.getAttribute('aria-expanded')).toBe('true');
    });

    it('should have default aria-label "More options" on more button', () => {
      component.data = createSampleActions(5);
      component.topMenuSize = 3;
      fixture.detectChanges();

      const moreBtn = getMoreButton();
      expect(moreBtn?.getAttribute('aria-label')).toBe('More options');
    });

    it('should use moreIconHoverText as aria-label on more button when provided', () => {
      component.data = createSampleActions(5);
      component.topMenuSize = 3;
      component.moreIconHoverText = 'Show more actions';
      fixture.detectChanges();

      const moreBtn = getMoreButton();
      expect(moreBtn?.getAttribute('aria-label')).toBe('Show more actions');
    });

    it('should have role="menu" on the sub menu list', () => {
      component.data = createSampleActions(5);
      component.topMenuSize = 2;
      fixture.detectChanges();

      const subMenuList = getSubMenuList();
      expect(subMenuList?.getAttribute('role')).toBe('menu');
    });

    it('should still render menu container with role="menu" when data is empty', () => {
      component.data = [];
      fixture.detectChanges();
      const menu = getMenuList();
      expect(menu).toBeTruthy();
      expect(menu?.getAttribute('role')).toBe('menu');
    });
  });

  // ---------------------------------------------------------------------------
  // Positioning / Toggle
  // ---------------------------------------------------------------------------
  describe('Positioning', () => {
    it('should toggle showSubMenu on handleMenuClick', () => {
      component.data = createSampleActions(5);
      component.topMenuSize = 2;
      fixture.detectChanges();

      component.handleMenuClick();
      fixture.detectChanges();
      expect(component.showSubMenu).toBe(true);

      component.handleMenuClick();
      fixture.detectChanges();
      expect(component.showSubMenu).toBe(false);
    });

    it('should set focusedItemIndex to 0 when opening submenu', () => {
      component.data = createSampleActions(5);
      component.topMenuSize = 2;
      fixture.detectChanges();

      component.handleMenuClick();
      fixture.detectChanges();

      expect(component.focusedItemIndex).toBe(0);
    });

    it('should reset focusedItemIndex to -1 when closing submenu', () => {
      component.data = createSampleActions(5);
      component.topMenuSize = 2;
      fixture.detectChanges();

      component.handleMenuClick();
      fixture.detectChanges();
      expect(component.focusedItemIndex).toBe(0);

      component.handleMenuClick();
      fixture.detectChanges();
      expect(component.focusedItemIndex).toBe(-1);
    });

    it('should close submenu on overlay click when disableBackgroundInteraction is true', () => {
      component.data = createSampleActions(5);
      component.topMenuSize = 2;
      component.disableBackgroundInteraction = true;
      fixture.detectChanges();

      component.handleMenuClick();
      fixture.detectChanges();
      expect(component.showSubMenu).toBe(true);

      const overlay = el.querySelector('.cometchat-popover__overlay') as HTMLElement;
      expect(overlay).toBeTruthy();
      overlay.click();
      fixture.detectChanges();

      expect(component.showSubMenu).toBe(false);
    });

    it('should reset positionStyle when closing submenu', () => {
      component.data = createSampleActions(5);
      component.topMenuSize = 2;
      fixture.detectChanges();

      component.handleMenuClick();
      fixture.detectChanges();

      component.handleMenuClick(); // close
      fixture.detectChanges();

      expect(component.positionStyle).toEqual({});
    });
  });

  // ---------------------------------------------------------------------------
  // Edge Cases
  // ---------------------------------------------------------------------------
  describe('Edge Cases', () => {
    it('should handle empty data array gracefully', () => {
      component.data = [];
      fixture.detectChanges();
      expect(component.topMenu).toEqual([]);
      expect(component.subMenu).toEqual([]);
      expect(component.shouldShowMoreButton).toBe(false);
    });

    it('should not throw when created with no inputs', () => {
      expect(() => fixture.detectChanges()).not.toThrow();
    });

    it('should handle single item in data', () => {
      component.data = [
        new CometChatActionsIcon({ id: 'a', title: 'A', iconURL: 'a.svg', onClick: vi.fn() }),
      ];
      component.topMenuSize = 2;
      fixture.detectChanges();

      expect(component.topMenu.length).toBe(1);
      expect(component.subMenu.length).toBe(0);
      expect(component.shouldShowMoreButton).toBe(false);
    });

    it('should handle mixed item types in data', () => {
      const icon = new CometChatActionsIcon({
        id: 'i1',
        title: 'Icon',
        iconURL: 'i.svg',
        onClick: vi.fn(),
      });
      const option = new CometChatOption({ id: 'o1', title: 'Option' });
      const view = new CometChatActionsView({ id: 'v1', title: 'View' });
      component.data = [icon, option, view];
      component.topMenuSize = 2;
      fixture.detectChanges();

      expect(component.topMenu.length).toBe(1);
      expect(component.subMenu.length).toBe(2);
    });

    it('should return correct trackByItem values', () => {
      const item = new CometChatActionsIcon({
        id: 'test-id',
        title: 'Test',
        iconURL: 'i.svg',
        onClick: vi.fn(),
      });
      expect(component.trackByItem(0, item)).toBe('test-id');
    });

    it('should return title from trackByItem when id is empty', () => {
      const item = new CometChatOption({ id: '', title: 'Fallback Title' });
      expect(component.trackByItem(0, item)).toBe('Fallback Title');
    });

    it('should return index string from trackByItem when id and title are empty', () => {
      const item = new CometChatOption({ id: '', title: '' });
      expect(component.trackByItem(5, item)).toBe('5');
    });

    it('should return empty string from getItemId when item has no id', () => {
      const item = new CometChatOption({});
      expect(component.getItemId(item)).toBe('');
    });

    it('should return empty string from getItemTitle when item has no title', () => {
      const item = new CometChatOption({});
      expect(component.getItemTitle(item)).toBe('');
    });

    it('should return icon style object when iconURL is present', () => {
      const item = new CometChatActionsIcon({
        id: 'a',
        title: 'A',
        iconURL: 'icon.svg',
        onClick: vi.fn(),
      });
      const style = component.getIconStyle(item);
      expect(style['-webkit-mask']).toContain('icon.svg');
      expect(style['display']).toBe('flex');
    });

    it('should return empty object from getIconStyle when no iconURL', () => {
      const item = new CometChatOption({ id: 'a', title: 'A' });
      expect(component.getIconStyle(item)).toEqual({});
    });

    it('should identify CometChatActionsView with customView via isActionsView', () => {
      const mockTemplate = {} as any;
      const view = new CometChatActionsView({ id: 'v', title: 'V', customView: mockTemplate });
      expect(component.isActionsView(view)).toBe(true);
    });

    it('should return false from isActionsView for CometChatActionsIcon', () => {
      const icon = new CometChatActionsIcon({
        id: 'i',
        title: 'I',
        iconURL: 'i.svg',
        onClick: vi.fn(),
      });
      expect(component.isActionsView(icon)).toBe(false);
    });

    it('should clean up event listeners on destroy', () => {
      component.data = createSampleActions(5);
      component.closeOnOutsideClick = true;
      fixture.detectChanges();

      // Should not throw on destroy
      expect(() => fixture.destroy()).not.toThrow();

      // Re-create for afterEach cleanup
      fixture = TestBed.createComponent(CometChatContextMenuComponent);
      component = fixture.componentInstance;
      el = fixture.nativeElement;
    });

    it('should handle topMenuSize larger than data length', () => {
      component.data = createSampleActions(2);
      component.topMenuSize = 10;
      fixture.detectChanges();

      expect(component.topMenu.length).toBe(2);
      expect(component.subMenu.length).toBe(0);
      expect(component.shouldShowMoreButton).toBe(false);
    });

    it('should render more button when topMenuSize is 0 and data exists', () => {
      component.data = createSampleActions(3);
      component.topMenuSize = 0;
      fixture.detectChanges();

      expect(component.topMenu.length).toBe(0);
      expect(component.shouldShowMoreButton).toBe(true);
      expect(getMoreButton()).toBeTruthy();
    });
  });
});
