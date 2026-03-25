import {
  Component,
  Input,
  Output,
  EventEmitter,
  ElementRef,
  ViewChild,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  inject,
  AfterViewInit,
  HostListener,
  QueryList,
  ViewChildren, ChangeDetectionStrategy} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../../resources/CometChatLocalize';
import { Placement } from '../../../Enums/Enums';
import { CometChatActionsIcon, CometChatActionsView, CometChatOption } from '../../../modals';
import { isMobileDevice } from '../../../utils/util';
import {
  getNextIndex,
  getNavigationDirection,
  isActivationKey,
  isEscapeKey,
  isTabKey,
} from '../../../utils/keyboard-utils';

/** Type alias for menu item types */
export type ContextMenuItem = CometChatActionsIcon | CometChatActionsView | CometChatOption;

/**
 * CometChatContextMenu is a composite component used to display menu data in required format.
 * It accepts a data array for displaying the menu items and topMenuSize to specify how many
 * menu items should be visible by default.
 *
 * @example
 * ```html
 * <cometchat-context-menu
 *   [data]="menuItems"
 *   [topMenuSize]="3"
 *   [placement]="'left'"
 *   (optionClick)="onOptionClick($event)"
 * ></cometchat-context-menu>
 * ```
 */
@Component({
  selector: 'cometchat-context-menu',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './cometchat-context-menu.component.html',
  styleUrls: ['./cometchat-context-menu.component.css'],
})
export class CometChatContextMenuComponent implements OnInit, OnDestroy, AfterViewInit {
  /** Menu items data array */
  @Input() data: ContextMenuItem[] = [];

  /** Number of items visible in main menu before "more" button */
  @Input() topMenuSize = 2;

  /** Tooltip for the more menu button */
  @Input() moreIconHoverText?: string;

  /** Menu placement position */
  @Input() placement: Placement = Placement.left;

  /** Close menu when clicking outside */
  @Input() closeOnOutsideClick = false;

  /** Disable background interaction when menu is open */
  @Input() disableBackgroundInteraction = false;

  /** Use parent element as viewport for positioning */
  @Input() useParentContainer = false;

  /** Use parent height for positioning calculations */
  @Input() useParentHeight = false;

  /** Force static placement without positioning logic */
  @Input() forceStaticPlacement = false;

  /** Emitted when a menu option is clicked */
  @Output() optionClick = new EventEmitter<ContextMenuItem>();

  @ViewChild('moreButtonRef') moreButtonRef!: ElementRef<HTMLDivElement>;
  @ViewChild('subMenuRef') subMenuRef!: ElementRef<HTMLDivElement>;
  @ViewChildren('menuItemRef') menuItemRefs!: QueryList<ElementRef<HTMLDivElement>>;
  @ViewChildren('topMenuItemRef') topMenuItemRefs!: QueryList<ElementRef<HTMLDivElement>>;

  /** Internal state */
  showSubMenu = false;
  positionStyle: Record<string, string> = {};

  /** Whether position has been pre-calculated on hover */
  private positionPreCalculated = false;

  /** Keyboard navigation state */
  focusedItemIndex = -1;
  focusedTopMenuIndex = -1;

  private readonly cdr = inject(ChangeDetectorRef);
  private parentViewRef: HTMLElement | null = null;
  private resizeTimeoutRef: ReturnType<typeof setTimeout> | null = null;
  private boundHandleClickOutside: (event: MouseEvent) => void;
  private boundHandleOtherMenuOpen: (event: Event) => void;

  /** Unique instance ID for distinguishing menu instances */
  private readonly instanceId = Math.random().toString(36).substring(2);

  constructor() {
    this.boundHandleClickOutside = this.handleClickOutside.bind(this);
    this.boundHandleOtherMenuOpen = this.handleOtherMenuOpen.bind(this);
  }

  ngOnInit(): void {
    if (this.closeOnOutsideClick) {
      document.addEventListener('click', this.boundHandleClickOutside);
    }
    // Listen for other context menus opening so we can close ourselves
    document.addEventListener('cometchat-context-menu-open', this.boundHandleOtherMenuOpen);
  }

  ngAfterViewInit(): void {
    if (this.useParentContainer) {
      this.parentViewRef = this.getTopMostCometChatElement();
    }
  }

  ngOnDestroy(): void {
    document.removeEventListener('click', this.boundHandleClickOutside);
    document.removeEventListener('cometchat-context-menu-open', this.boundHandleOtherMenuOpen);
    window.removeEventListener('resize', this.boundHandleResize);
    if (this.resizeTimeoutRef) {
      clearTimeout(this.resizeTimeoutRef);
    }
  }

  /**
   * Closes this menu when another context menu instance opens.
   */
  private handleOtherMenuOpen(event: Event): void {
    const detail = (event as CustomEvent).detail;
    if (detail?.instanceId !== this.instanceId && this.showSubMenu) {
      this.closeSubMenu();
    }
  }

  private boundHandleResize = this.handleResize.bind(this);

  /**
   * Handles keyboard events for accessibility.
   * Supports Arrow keys for navigation, Enter/Space for selection, Escape to close, and Tab to close.
   * Requirements: 5.1-5.4
   */
  @HostListener('keydown', ['$event'])
  handleKeydown(event: KeyboardEvent): void {
    // When submenu is closed, only handle activation on the more button itself
    if (!this.showSubMenu) {
      const target = event.target as HTMLElement;
      const isMoreButton = this.moreButtonRef?.nativeElement === target;
      if (isMoreButton && isActivationKey(event)) {
        event.preventDefault();
        this.handleMenuClick(event);
      }
      return;
    }

    // Handle Escape key - close submenu and restore focus to more button (Requirement 5.3)
    if (isEscapeKey(event)) {
      event.preventDefault();
      this.closeSubMenu();
      // Return focus to more button
      this.moreButtonRef?.nativeElement?.focus();
      return;
    }

    // Handle Tab key - close submenu and allow natural tab navigation (Requirement 5.4)
    if (isTabKey(event)) {
      this.closeSubMenu();
      return;
    }

    // Handle arrow key navigation (Requirement 5.1)
    const direction = getNavigationDirection(event);
    if (direction === 'down' || direction === 'up') {
      event.preventDefault();
      const items = this.menuItemRefs.toArray();
      if (items.length === 0) return;
      // Determine current index from focused element
      const activeEl = document.activeElement as HTMLElement;
      const currentIndex = items.findIndex(ref => ref.nativeElement === activeEl);
      const baseIndex = currentIndex >= 0 ? currentIndex : this.focusedItemIndex;
      const nextIndex = getNextIndex(baseIndex, direction, items.length, { wrap: true });
      this.focusedItemIndex = nextIndex;
      this.focusItemAtIndex(nextIndex);
      return;
    }

    // Handle Enter/Space activation (Requirement 5.2)
    if (isActivationKey(event)) {
      event.preventDefault();
      // Determine focused item from DOM focus state
      const activeEl = document.activeElement as HTMLElement;
      const items = this.menuItemRefs.toArray();
      const domIndex = items.findIndex(ref => ref.nativeElement === activeEl);
      const index = domIndex >= 0 ? domIndex : this.focusedItemIndex;
      if (index >= 0 && index < this.subMenu.length) {
        const item = this.subMenu[index];
        this.onMenuItemClick(item);
      }
      return;
    }
  }

  /**
   * Focuses the item at the specified index.
   */
  private focusItemAtIndex(index: number): void {
    const items = this.menuItemRefs.toArray();
    if (items[index]) {
      items[index].nativeElement.focus();
    }
  }

  /**
   * Closes the submenu and resets keyboard navigation state.
   */
  private closeSubMenu(): void {
    this.showSubMenu = false;
    this.positionStyle = {};
    this.positionPreCalculated = false;
    this.focusedItemIndex = -1;
    window.removeEventListener('resize', this.boundHandleResize);
    this.cdr.detectChanges();
  }

  /**
   * Gets the items to display in the top/main menu.
   * Returns items up to (topMenuSize - 1) to leave room for "more" button.
   */
  get topMenu(): ContextMenuItem[] {
    return this.data.slice(0, this.topMenuSize > 0 ? this.topMenuSize - 1 : 0);
  }

  /**
   * Gets the items to display in the sub/overflow menu.
   * Returns items from (topMenuSize - 1) onwards.
   */
  get subMenu(): ContextMenuItem[] {
    return this.data.slice(this.topMenuSize > 0 ? this.topMenuSize - 1 : 0);
  }

  /**
   * Checks if the "more" button should be shown.
   */
  get shouldShowMoreButton(): boolean {
    return this.data.length > this.topMenu.length;
  }

  /**
   * Handles click outside the menu to close submenu.
   */
  private handleClickOutside(event: MouseEvent): void {
    if (
      this.moreButtonRef?.nativeElement &&
      !this.moreButtonRef.nativeElement.contains(event.target as Node)
    ) {
      this.showSubMenu = false;
      this.cdr.detectChanges();
    }
  }

  /**
   * Handles window resize events.
   */
  private handleResize(): void {
    if (this.resizeTimeoutRef) {
      clearTimeout(this.resizeTimeoutRef);
    }
    this.resizeTimeoutRef = setTimeout(() => {
      if (this.showSubMenu) {
        this.getPopoverPositionStyle();
      }
    }, 100);
  }

  /**
   * Toggles the submenu visibility.
   * Stops event propagation to prevent triggering parent click handlers.
   */
  handleMenuClick(event?: Event): void {
    // Stop propagation to prevent parent click handlers from firing
    if (event) {
      event.stopPropagation();
    }

    this.showSubMenu = !this.showSubMenu;

    if (this.showSubMenu) {
      // Notify other context menus to close
      document.dispatchEvent(
        new CustomEvent('cometchat-context-menu-open', {
          detail: { instanceId: this.instanceId },
        })
      );

      // If position was pre-calculated on hover, use it immediately.
      // Otherwise calculate now with estimated dimensions.
      if (!this.positionPreCalculated) {
        this.getPopoverPositionStyle();
      }

      // Force change detection to render submenu at the pre-calculated position
      this.cdr.detectChanges();

      // Refine position after DOM renders with actual submenu dimensions
      // Use requestAnimationFrame for a single-frame refinement (no visible flicker)
      requestAnimationFrame(() => {
        this.getPopoverPositionStyle();
      });

      // Add resize listener when submenu is shown
      if (this.useParentContainer && !this.useParentHeight) {
        window.addEventListener('resize', this.boundHandleResize);
      }

      // Reset keyboard navigation state and focus first item after DOM renders
      this.focusedItemIndex = 0;
      requestAnimationFrame(() => {
        this.focusItemAtIndex(0);
      });
    } else {
      this.closeSubMenu();
    }
  }

  /**
   * Handles menu item click.
   * Stops event propagation to prevent triggering parent click handlers.
   */
  onMenuItemClick(item: ContextMenuItem, event?: Event): void {
    // Stop propagation to prevent parent click handlers from firing
    if (event) {
      event.stopPropagation();
    }

    this.closeSubMenu();
    this.optionClick.emit(item);

    // Call onClick if it exists on the item
    if ('onClick' in item && typeof item.onClick === 'function') {
      item.onClick(0);
    }
  }

  /**
   * Handles mouse enter on more button to pre-calculate submenu position.
   * This eliminates flicker when the submenu opens on click.
   */
  onMoreButtonMouseEnter(): void {
    this.getPopoverPositionStyle();
    this.positionPreCalculated = true;
  }

  /**
   * Handles overlay click to close submenu.
   */
  onOverlayClick(event: MouseEvent): void {
    event.stopPropagation();
    this.closeSubMenu();
  }

  /**
   * Checks if an item is a CometChatActionsView with customView.
   */
  isActionsView(item: ContextMenuItem): item is CometChatActionsView {
    return item instanceof CometChatActionsView && !!item.customView;
  }

  /**
   * Gets the icon style for a menu item.
   */
  getIconStyle(item: ContextMenuItem): Record<string, string> {
    if (item.iconURL) {
      return {
        '-webkit-mask': `url(${item.iconURL}) center center no-repeat`,
        '-webkit-mask-size': 'contain',
        display: 'flex',
      };
    }
    return {};
  }

  /**
   * Gets the ID of a menu item.
   */
  getItemId(item: ContextMenuItem): string {
    return item.id || '';
  }

  /**
   * Gets the title of a menu item.
   */
  getItemTitle(item: ContextMenuItem): string {
    return item.title || '';
  }

  /**
   * Finds the nearest [data-cometchat-container] ancestor, or falls back to
   * the topmost element with the 'cometchat' class.
   *
   * In Storybook docs mode (window.parent !== window) the container div
   * added by overlay stories is preferred so placement is scoped to the
   * story canvas rather than the full iframe viewport.
   */
  private getTopMostCometChatElement(): HTMLElement | null {
    let current: HTMLElement | null = this.moreButtonRef?.nativeElement;

    // Prefer the nearest [data-cometchat-container] ancestor (Storybook wrapper)
    while (current) {
      if (current.hasAttribute?.('data-cometchat-container')) {
        return current;
      }
      current = current.parentElement;
    }

    // Fall back to topmost .cometchat element
    current = this.moreButtonRef?.nativeElement;
    let topMostElement: HTMLElement | null = null;
    while (current) {
      if (current.classList?.contains('cometchat')) {
        topMostElement = current;
      }
      current = current.parentElement;
    }

    return topMostElement;
  }

  /**
   * Returns true when running inside a Storybook docs-mode iframe
   * (i.e. window.parent !== window).
   */
  private isDocsMode(): boolean {
    try {
      return window.parent !== window;
    } catch {
      return false;
    }
  }

  /**
   * Gets the available placement based on space.
   */
  private getAvailablePlacement(rect: DOMRect, height: number): Placement {
    // If forceStaticPlacement is true, always return the placement prop without any logic
    if (this.forceStaticPlacement) {
      return this.placement;
    }

    const spaceAbove = rect.top;
    const parentViewRect = this.parentViewRef?.getBoundingClientRect();
    const spaceBelow = parentViewRect ? parentViewRect.bottom - rect.bottom : 0;

    if (!this.useParentContainer) {
      // On mobile devices, prefer bottom placement if there's enough space
      if (isMobileDevice()) {
        return spaceBelow >= height + 10 ? Placement.bottom : Placement.top;
      }
      return this.placement;
    }

    if (!parentViewRect) {
      return this.placement;
    }

    // When using parent container, check available space
    if (spaceBelow >= height + 10) {
      return Placement.bottom;
    }
    if (spaceAbove >= height + 10) {
      return Placement.top;
    }
    return this.placement;
  }

  /**
   * Calculates the position style for the context menu.
   */
  private calculateMenuPosition(
    rect: DOMRect,
    menuDimensions: { width: number; height: number },
    parentRect: DOMRect | null,
    availablePlacement: Placement = this.placement,
    positioningStrategy: 'viewport' | 'parent' | 'centered' = 'viewport'
  ): Record<string, string> {
    const { width, height } = menuDimensions;
    const positionStyle: Record<string, string> = {};
    const padding = 10;

    // Force static placement - simple positioning based on placement
    if (this.forceStaticPlacement) {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let calculatedLeft = rect.left;
      let calculatedTop = rect.top;

      switch (availablePlacement) {
        case Placement.top:
          calculatedTop = rect.top - height - padding;
          calculatedLeft = rect.left;
          break;
        case Placement.bottom:
          calculatedTop = rect.bottom + padding;
          calculatedLeft = rect.left;
          break;
        case Placement.left:
          calculatedTop = rect.top;
          calculatedLeft = rect.left - width - padding;
          break;
        case Placement.right:
          calculatedTop = rect.top;
          calculatedLeft = rect.right + padding;
          break;
        default:
          calculatedTop = rect.top;
          calculatedLeft = rect.left - width - padding;
          break;
      }

      // Ensure submenu stays within viewport bounds
      // Horizontal bounds
      if (calculatedLeft < padding) {
        calculatedLeft = padding;
      }
      if (calculatedLeft + width > viewportWidth - padding) {
        calculatedLeft = viewportWidth - width - padding;
      }

      // Vertical bounds
      if (calculatedTop < padding) {
        calculatedTop = padding;
      }
      if (calculatedTop + height > viewportHeight - padding) {
        calculatedTop = viewportHeight - height - padding;
      }

      positionStyle['top'] = `${calculatedTop}px`;
      positionStyle['left'] = `${calculatedLeft}px`;
      return positionStyle;
    }

    // Parent container positioning strategy
    if (positioningStrategy === 'parent' && parentRect) {
      if ([Placement.top, Placement.bottom].includes(availablePlacement)) {
        if (this.useParentHeight) {
          positionStyle['top'] =
            availablePlacement === Placement.bottom
              ? `${Math.min(parentRect.bottom - height, rect.bottom + padding)}px`
              : `${Math.max(parentRect.top, rect.top - height - padding)}px`;
        } else {
          positionStyle['top'] =
            availablePlacement === Placement.bottom
              ? `${rect.bottom + padding}px`
              : `${rect.top - height - padding}px`;
        }

        let adjustedLeft = Math.max(parentRect.left, rect.left);
        adjustedLeft = Math.min(adjustedLeft, parentRect.right - width - padding);
        positionStyle['left'] = `${adjustedLeft}px`;
      } else {
        positionStyle['left'] =
          availablePlacement === Placement.left
            ? `${Math.max(parentRect.left, rect.left - width - padding)}px`
            : `${Math.min(parentRect.right - width, rect.right + padding)}px`;

        if (this.useParentHeight) {
          let adjustedTop = Math.max(parentRect.top, rect.top);
          adjustedTop = Math.min(adjustedTop, parentRect.bottom - height - padding);
          positionStyle['top'] = `${adjustedTop}px`;
        } else {
          positionStyle['top'] = `${rect.top}px`;
        }
      }
    }
    // Centered positioning strategy
    else if (positioningStrategy === 'centered' && parentRect) {
      if (availablePlacement === Placement.top) {
        positionStyle['top'] = `${rect.top - height - padding}px`;
      } else if (availablePlacement === Placement.bottom) {
        positionStyle['top'] = `${rect.bottom + padding}px`;
      }

      const menuLeft = rect.left + rect.width / 2 - width / 2;
      if (menuLeft < parentRect.left) {
        positionStyle['left'] = `${parentRect.left + padding}px`;
      } else if (menuLeft + width > parentRect.right) {
        positionStyle['left'] = `${parentRect.right - width - padding}px`;
      } else {
        positionStyle['left'] = `${menuLeft}px`;
      }
    }
    // Viewport positioning strategy (default)
    else {
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;

      if ([Placement.top, Placement.bottom].includes(availablePlacement)) {
        positionStyle['top'] =
          availablePlacement === Placement.bottom
            ? `${rect.bottom + height + padding > viewportHeight ? rect.top - height - padding : rect.bottom + padding}px`
            : `${rect.top - height - padding < 0 ? rect.bottom + padding : rect.top - height - padding}px`;

        positionStyle['left'] =
          rect.left + width - padding > viewportWidth
            ? `${viewportWidth - width - padding}px`
            : `${rect.left - padding}px`;
      } else {
        positionStyle['left'] =
          availablePlacement === Placement.left
            ? `${rect.left - width - padding < 0 ? rect.right + padding : rect.left - width - padding}px`
            : `${rect.right + width + padding > viewportWidth ? rect.left - width - padding : rect.right + padding}px`;

        positionStyle['top'] =
          rect.top + height - padding > viewportHeight
            ? `${viewportHeight - height - padding}px`
            : `${rect.top - padding}px`;
      }
    }

    return positionStyle;
  }

  /**
   * Calculates popover position when using parent container.
   */
  private calculatePopoverPosition(): void {
    if (!this.moreButtonRef?.nativeElement || !this.parentViewRef) {
      return;
    }

    const height = this.subMenuRef?.nativeElement?.clientHeight || 48 * this.data.length;
    const width = this.subMenuRef?.nativeElement?.clientWidth || 160;
    const rect = this.moreButtonRef.nativeElement.getBoundingClientRect();
    const parentViewRect = this.parentViewRef.getBoundingClientRect();

    if (!rect || !parentViewRect) {
      return;
    }

    const availablePlacement = this.getAvailablePlacement(rect, height);
    const positionStyle = this.calculateMenuPosition(
      rect,
      { width, height },
      parentViewRect,
      availablePlacement,
      'parent'
    );

    // In docs/iframe mode, convert viewport-relative coords to parent-relative
    // so the submenu positions correctly within the story canvas.
    if (this.isDocsMode() && positionStyle['top'] && positionStyle['left']) {
      const topVal = parseFloat(positionStyle['top']);
      const leftVal = parseFloat(positionStyle['left']);
      if (!isNaN(topVal) && !isNaN(leftVal)) {
        positionStyle['top'] = `${topVal - parentViewRect.top}px`;
        positionStyle['left'] = `${leftVal - parentViewRect.left}px`;
        positionStyle['position'] = 'absolute';
      }
    }

    this.positionStyle = positionStyle;
    this.cdr.detectChanges();
  }

  /**
   * Sets menu height and position for centered strategy.
   */
  private setMenuHeight(): void {
    if (!this.subMenuRef?.nativeElement || !this.moreButtonRef?.nativeElement) {
      return;
    }

    const menuWidth = this.subMenuRef.nativeElement.scrollWidth;
    const menuHeight = this.subMenuRef.nativeElement.scrollHeight;
    const rect = this.moreButtonRef.nativeElement.getBoundingClientRect();
    const parentRect = this.parentViewRef?.getBoundingClientRect() || {
      left: 0,
      right: window.innerWidth,
      width: window.innerWidth,
      height: window.innerHeight,
      top: 0,
      bottom: window.innerHeight,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    };

    const positionStyle = this.calculateMenuPosition(
      rect,
      { width: menuWidth, height: menuHeight },
      parentRect as DOMRect,
      this.placement,
      'centered'
    );

    this.positionStyle = positionStyle;
    this.cdr.detectChanges();
  }

  /**
   * Gets the popover position style based on configuration.
   * In Storybook docs mode (window.parent !== window) we automatically
   * scope positioning to the nearest container so the overlay stays
   * within the story canvas.
   */
  private getPopoverPositionStyle(): void {
    // Auto-enable parent-container scoping in Storybook docs mode
    const effectiveUseParent = this.useParentContainer || this.isDocsMode();

    if (effectiveUseParent) {
      this.parentViewRef = this.parentViewRef || this.getTopMostCometChatElement();
      this.calculatePopoverPosition();
      return;
    }

    if (this.useParentHeight) {
      this.setMenuHeight();
      return;
    }

    const height = this.subMenuRef?.nativeElement?.clientHeight || 48 * this.subMenu.length;
    const width = this.subMenuRef?.nativeElement?.clientWidth || 160;
    const rect = this.moreButtonRef?.nativeElement?.getBoundingClientRect();

    if (!rect) {
      return;
    }

    const availablePlacement = this.getAvailablePlacement(rect, height);
    const positionStyle = this.calculateMenuPosition(
      rect,
      { width, height },
      null,
      availablePlacement,
      'viewport'
    );

    // Always update position style when menu is shown
    this.positionStyle = positionStyle;
    this.cdr.detectChanges();
  }

  /**
   * Gets the index of an item in the submenu array.
   */
  getSubMenuItemIndex(item: ContextMenuItem): number {
    return this.subMenu.indexOf(item);
  }

  /**
   * Track by function for ngFor.
   */
  trackByItem(index: number, item: ContextMenuItem): string {
    return item.id || item.title || index.toString();
  }
}
