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
  ViewChildren,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../../resources/CometChatLocalize';
import { Placement } from '../../../Enums/Enums';
import { CometChatActionsIcon, CometChatActionsView, CometChatOption } from '../../../modals';
import {
  getNextIndex,
  getNavigationDirection,
  isActivationKey,
  isEscapeKey,
  isTabKey,
} from '../../../utils/keyboard-utils';

// Re-export type for backward compatibility
export type { ContextMenuItem } from './cometchat-context-menu.types';
import type { ContextMenuItem } from './cometchat-context-menu.types';
import {
  isContextMenuDocsMode,
  getContextMenuTopElement,
  getContextMenuPlacement,
  calculateContextMenuPosition,
} from './cometchat-context-menu.utils';

/**
 * Width to position against before the dropdown has been laid out and can be
 * measured, used only when `--cometchat-context-menu-menu-width` cannot be
 * resolved. The stylesheet is the source of truth — see resolveMenuWidth.
 */
const DEFAULT_MENU_WIDTH = 205;

/** Breathing room kept between a nested flyout and the viewport edge. */
const GROUP_FLYOUT_EDGE_MARGIN = 8;

/**
 * Width to assume when the flyout has not been laid out yet.
 *
 * Matches the `min-width` the stylesheet guarantees, so a decision made before
 * layout is the same one a measurement would produce for the narrowest flyout.
 */
const GROUP_FLYOUT_MIN_WIDTH = 180;

/**
 * CometChatContextMenu displays menu data in a required format.
 * Accepts a data array and topMenuSize to specify how many items are visible by default.
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
  @Input() data: ContextMenuItem[] = [];
  @Input() topMenuSize = 2;
  @Input() moreIconHoverText?: string;
  @Input() placement: Placement = Placement.left;
  @Input() closeOnOutsideClick = false;
  @Input() disableBackgroundInteraction = false;
  @Input() useParentContainer = false;
  @Input() useParentHeight = false;
  @Input() forceStaticPlacement = false;
  /**
   * Anchor the dropdown to this component's own box instead of to the "…"
   * button inside it.
   *
   * The "…" is the LAST control in a hover column that also holds the quick
   * options, so anchoring to it opens the dropdown a full column-width away
   * from whatever the column belongs to. Hosts that sit their column flush
   * against their content — the message bubble — set this so the dropdown lands
   * against the content instead, overlapping the quick options rather than
   * clearing them.
   */
  @Input() anchorToHost = false;

  @Output() optionClick = new EventEmitter<ContextMenuItem>();
  /**
   * Fires when the dropdown opens or closes. A host that renders this menu only
   * on hover needs it: the dropdown portals to document.body, so reaching for
   * it moves the pointer off the host, and without this the host unmounts the
   * menu before anything in it can be clicked.
   */
  @Output() openChange = new EventEmitter<boolean>();

  @ViewChild('moreButtonRef') moreButtonRef!: ElementRef<HTMLDivElement>;
  @ViewChild('subMenuRef') subMenuRef!: ElementRef<HTMLDivElement>;
  @ViewChild('groupFlyoutRef') groupFlyoutRef?: ElementRef<HTMLDivElement>;
  @ViewChildren('menuItemRef') menuItemRefs!: QueryList<ElementRef<HTMLDivElement>>;
  @ViewChildren('topMenuItemRef') topMenuItemRefs!: QueryList<ElementRef<HTMLDivElement>>;

  showSubMenu = false;
  positionStyle: Record<string, string> = {};
  private positionPreCalculated = false;
  focusedItemIndex = -1;
  focusedTopMenuIndex = -1;

  private readonly cdr = inject(ChangeDetectorRef);
  private readonly hostRef: ElementRef<HTMLElement> = inject(ElementRef);
  private parentViewRef: HTMLElement | null = null;
  private resizeTimeoutRef: ReturnType<typeof setTimeout> | null = null;
  private boundHandleClickOutside: (event: MouseEvent) => void;
  private boundHandleOtherMenuOpen: (event: Event) => void;
  private readonly instanceId = Math.random().toString(36).substring(2);

  constructor() {
    this.boundHandleClickOutside = this.handleClickOutside.bind(this);
    this.boundHandleOtherMenuOpen = this.handleOtherMenuOpen.bind(this);
  }

  ngOnInit(): void {
    if (this.closeOnOutsideClick) {
      document.addEventListener('click', this.boundHandleClickOutside);
    }
    document.addEventListener('cometchat-context-menu-open', this.boundHandleOtherMenuOpen);
  }

  ngAfterViewInit(): void {
    if (this.useParentContainer) {
      this.parentViewRef = getContextMenuTopElement(this.moreButtonRef?.nativeElement);
    }
  }

  ngOnDestroy(): void {
    document.removeEventListener('click', this.boundHandleClickOutside);
    document.removeEventListener('cometchat-context-menu-open', this.boundHandleOtherMenuOpen);
    window.removeEventListener('resize', this.boundHandleResize);
    if (this.resizeTimeoutRef) clearTimeout(this.resizeTimeoutRef);
    // If sub-menu was portaled to body, move it back before Angular destroys the view
    if (this.subMenuRef?.nativeElement && this.subMenuRef.nativeElement.parentElement === document.body) {
      this.subMenuRef.nativeElement.remove();
    }
  }

  private handleOtherMenuOpen(event: Event): void {
    const detail = (event as CustomEvent).detail;
    if (detail?.instanceId !== this.instanceId && this.showSubMenu) {
      this.closeSubMenu();
    }
  }

  private boundHandleResize = this.handleResize.bind(this);

  @HostListener('keydown', ['$event'])
  handleKeydown(event: KeyboardEvent): void {
    if (!this.showSubMenu) {
      const isMoreButton = this.moreButtonRef?.nativeElement === event.target;
      if (isMoreButton && isActivationKey(event)) { event.preventDefault(); this.handleMenuClick(event); }
      return;
    }

    // This handler is bound both as a @HostListener and on the (portaled) submenu
    // element. Stop propagation so it is not invoked twice (which would double-step
    // arrow navigation when the submenu is not portaled out of the host).
    event.stopPropagation();

    if (isEscapeKey(event)) {
      event.preventDefault();
      this.closeSubMenu();
      this.moreButtonRef?.nativeElement?.focus();
      return;
    }

    if (isTabKey(event)) { this.closeSubMenu(); return; }

    const direction = getNavigationDirection(event);
    if (direction === 'down' || direction === 'up') {
      event.preventDefault();
      const items = this.menuItemRefs.toArray();
      if (items.length === 0) return;
      const activeEl = document.activeElement as HTMLElement;
      const currentIndex = items.findIndex(ref => ref.nativeElement === activeEl);
      const baseIndex = currentIndex >= 0 ? currentIndex : this.focusedItemIndex;
      const nextIndex = getNextIndex(baseIndex, direction, items.length, { wrap: true });
      this.focusedItemIndex = nextIndex;
      this.focusItemAtIndex(nextIndex);
      return;
    }

    if (isActivationKey(event)) {
      event.preventDefault();
      const activeEl = document.activeElement as HTMLElement;
      const items = this.menuItemRefs.toArray();
      const domIndex = items.findIndex(ref => ref.nativeElement === activeEl);
      const index = domIndex >= 0 ? domIndex : this.focusedItemIndex;
      if (index >= 0 && index < this.subMenu.length) this.onMenuItemClick(this.subMenu[index]);
      return;
    }
  }

  private focusItemAtIndex(index: number): void {
    const items = this.menuItemRefs.toArray();
    if (items[index]) items[index].nativeElement.focus();
  }

  private originalSubMenuParent: HTMLElement | null = null;

  private closeSubMenu(): void {
    this.showSubMenu = false;
    this.openChange.emit(false);
    // A flyout cannot outlive the list it hangs off.
    this.openGroupId = null;
    // Move sub-menu back from document.body to its original parent
    if (this.subMenuRef?.nativeElement && this.originalSubMenuParent) {
      this.originalSubMenuParent.appendChild(this.subMenuRef.nativeElement);
      this.originalSubMenuParent = null;
    }
    this.positionStyle = {};
    this.positionPreCalculated = false;
    this.focusedItemIndex = -1;
    window.removeEventListener('resize', this.boundHandleResize);
    this.cdr.detectChanges();
  }

  get topMenu(): ContextMenuItem[] {
    return this.data.slice(0, this.topMenuSize > 0 ? this.topMenuSize - 1 : 0);
  }

  get subMenu(): ContextMenuItem[] {
    return this.data.slice(this.topMenuSize > 0 ? this.topMenuSize - 1 : 0);
  }

  get shouldShowMoreButton(): boolean {
    return this.data.length > this.topMenu.length;
  }

  /**
   * The menu's width before it has been measured.
   *
   * Read from `--cometchat-context-menu-menu-width` so the stylesheet stays the
   * single source of truth: the constant below is only a last resort for when
   * the property cannot be resolved. Hard-coding it here meant a theme that
   * retuned the width silently pushed a left-opening menu off by the
   * difference, with nothing but a comment to catch it.
   */
  private resolveMenuWidth(): number {
    const el = this.subMenuRef?.nativeElement ?? this.moreButtonRef?.nativeElement;
    if (!el) return DEFAULT_MENU_WIDTH;
    try {
      const raw = getComputedStyle(el).getPropertyValue('--cometchat-context-menu-menu-width');
      const parsed = Number.parseFloat(raw);
      return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_MENU_WIDTH;
    } catch {
      return DEFAULT_MENU_WIDTH;
    }
  }

  private handleClickOutside(event: MouseEvent): void {
    if (this.moreButtonRef?.nativeElement &&
        !this.moreButtonRef.nativeElement.contains(event.target as Node)) {
      // Route through closeSubMenu rather than clearing the flag directly: it
      // also emits `openChange(false)`, clears `openGroupId` and returns the
      // flyout to its original parent. Skipping it left hosts that track
      // `openChange` believing the menu was still open — a conversation row
      // would keep its trailing menu trigger visible for good.
      this.closeSubMenu();
      this.cdr.detectChanges();
    }
  }

  private handleResize(): void {
    if (this.resizeTimeoutRef) clearTimeout(this.resizeTimeoutRef);
    this.resizeTimeoutRef = setTimeout(() => {
      if (this.showSubMenu) this.getPopoverPositionStyle();
    }, 100);
  }

  handleMenuClick(event?: Event): void {
    if (event) event.stopPropagation();
    this.showSubMenu = !this.showSubMenu;
    this.openChange.emit(this.showSubMenu);

    if (this.showSubMenu) {
      document.dispatchEvent(new CustomEvent('cometchat-context-menu-open', {
        detail: { instanceId: this.instanceId },
      }));

      if (!this.positionPreCalculated) this.getPopoverPositionStyle();
      this.cdr.detectChanges();

      // Portal the sub-menu to document.body to escape any overflow:hidden
      // ancestors that clip position:fixed elements.
      requestAnimationFrame(() => {
        this.getPopoverPositionStyle();
        if (this.subMenuRef?.nativeElement && this.subMenuRef.nativeElement.parentElement !== document.body) {
          this.originalSubMenuParent = this.subMenuRef.nativeElement.parentElement;
          document.body.appendChild(this.subMenuRef.nativeElement);
        }
      });

      if (this.useParentContainer && !this.useParentHeight) {
        window.addEventListener('resize', this.boundHandleResize);
      }

      this.focusedItemIndex = 0;
      requestAnimationFrame(() => this.focusItemAtIndex(0));
    } else {
      this.closeSubMenu();
    }
  }

  onMenuItemClick(item: ContextMenuItem, event?: Event): void {
    if (event) event.stopPropagation();
    // A group holds actions rather than being one: opening it is the whole
    // interaction, so it must not close the menu or emit a selection.
    //
    // Opens rather than toggles. Pointer input reaches a group by hovering it,
    // which has already opened the flyout by the time the click lands — so a
    // toggle here would close what the hover just opened and read as the click
    // doing nothing at all.
    if (this.hasChildren(item)) {
      this.openGroup(item);
      return;
    }
    this.closeSubMenu();
    this.closeGroup();
    this.optionClick.emit(item);
    if ('onClick' in item && typeof item.onClick === 'function') item.onClick(0);
  }

  // ==================== Nested groups ====================

  /** Id of the group whose flyout is open, or null. One at a time. */
  openGroupId: string | null = null;

  hasChildren(item: ContextMenuItem): boolean {
    return !!(item as CometChatActionsIcon).children?.length;
  }

  childrenOf(item: ContextMenuItem): CometChatActionsIcon[] {
    return (item as CometChatActionsIcon).children ?? [];
  }

  /** True when the flyout opens to the LEFT because the right edge has no room. */
  groupFlyoutFlipped = false;

  /**
   * Inline `left` for the flyout, in px from the anchor, when neither side of
   * the menu can hold it — a narrow window, where flipping just swaps which
   * edge does the clipping. Null whenever a side fits and CSS can place it.
   */
  groupFlyoutShift: number | null = null;

  openGroup(item: ContextMenuItem): void {
    this.openGroupId = this.getItemId(item);
    // Measure from the default side, then decide; starting flipped would make
    // the measurement describe a position we are trying to choose.
    this.groupFlyoutFlipped = false;
    this.groupFlyoutShift = null;
    this.cdr.detectChanges();
    this.alignGroupFlyout();
  }

  /**
   * Flip the flyout to the left when opening right would run off screen.
   *
   * Which side has room depends on where the MENU sits, not on how wide the
   * window is — a menu near the right edge of a wide window overflows exactly
   * as it would on a narrow one. So this measures the rendered flyout instead
   * of relying on a width breakpoint, and only flips when the left side can
   * actually hold it, since flipping into a clipped left edge fixes nothing.
   */
  private alignGroupFlyout(): void {
    const flyout = this.groupFlyoutRef?.nativeElement;
    const anchor = flyout?.parentElement;
    if (!flyout || !anchor) return;

    // `offsetWidth` is 0 while any ancestor is still `display: none`, and the
    // submenu this flyout lives in is exactly that until it opens. A zero makes
    // every overflow test below pass trivially, so the flyout stayed on the
    // right and was clipped — fall back to the width the stylesheet guarantees.
    const width = flyout.offsetWidth || GROUP_FLYOUT_MIN_WIDTH;
    const rect = anchor.getBoundingClientRect();
    const roomRight = window.innerWidth - GROUP_FLYOUT_EDGE_MARGIN - rect.right;
    const roomLeft = rect.left - GROUP_FLYOUT_EDGE_MARGIN;

    // Right if it fits, then left. If neither does — a narrow window, where the
    // menu leaves under a flyout's width on either side — flipping only swaps
    // which edge clips, so place it by hand instead: pull it back until its
    // right edge sits inside the window. `left` is relative to the anchor.
    let flipped = false;
    let shift: number | null = null;
    if (roomRight >= width) {
      flipped = false;
    } else if (roomLeft >= width) {
      flipped = true;
    } else {
      const clampedLeft = Math.max(
        GROUP_FLYOUT_EDGE_MARGIN,
        Math.min(rect.right, window.innerWidth - GROUP_FLYOUT_EDGE_MARGIN - width)
      );
      shift = Math.round(clampedLeft - rect.left);
    }

    if (flipped === this.groupFlyoutFlipped && shift === this.groupFlyoutShift) return;
    this.groupFlyoutFlipped = flipped;
    this.groupFlyoutShift = shift;
    this.cdr.detectChanges();
  }

  closeGroup(): void {
    if (this.openGroupId === null) return;
    this.openGroupId = null;
    this.groupFlyoutFlipped = false;
    this.groupFlyoutShift = null;
    this.cdr.detectChanges();
  }


  /** Enter and Space activate a child; Escape returns to the parent list. */
  onGroupChildKeydown(event: KeyboardEvent, child: ContextMenuItem): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.onMenuItemClick(child, event);
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.closeGroup();
    }
  }

  onMoreButtonMouseEnter(): void {
    this.getPopoverPositionStyle();
    this.positionPreCalculated = true;
  }

  onOverlayClick(event: MouseEvent): void {
    event.stopPropagation();
    this.closeSubMenu();
  }

  isActionsView(item: ContextMenuItem): item is CometChatActionsView {
    return item instanceof CometChatActionsView && !!item.customView;
  }

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

  getItemId(item: ContextMenuItem): string { return item.id || ''; }
  getItemTitle(item: ContextMenuItem): string { return item.title || ''; }

  private getPopoverPositionStyle(): void {
    const effectiveUseParent = this.useParentContainer || isContextMenuDocsMode();

    if (effectiveUseParent) {
      this.parentViewRef = this.parentViewRef || getContextMenuTopElement(this.moreButtonRef?.nativeElement);
      this.calculatePopoverPosition();
      return;
    }

    if (this.useParentHeight) { this.setMenuHeight(); return; }

    const height = this.subMenuRef?.nativeElement?.clientHeight || 48 * this.subMenu.length;
    const width = this.subMenuRef?.nativeElement?.clientWidth || this.resolveMenuWidth();
    const rect = this.moreButtonRef?.nativeElement?.getBoundingClientRect();
    if (!rect) return;

    const availablePlacement = getContextMenuPlacement(
      rect, height, this.placement, this.useParentContainer, this.forceStaticPlacement, this.parentViewRef
    );
    this.positionStyle = calculateContextMenuPosition(
      rect, { width, height }, null, availablePlacement, 'viewport', this.forceStaticPlacement, this.useParentHeight
    );
    this.applyHostAnchor(this.positionStyle, width, null);
    this.cdr.detectChanges();
  }

  private calculatePopoverPosition(): void {
    if (!this.moreButtonRef?.nativeElement || !this.parentViewRef) return;

    const height = this.subMenuRef?.nativeElement?.clientHeight || 48 * this.data.length;
    const width = this.subMenuRef?.nativeElement?.clientWidth || DEFAULT_MENU_WIDTH;
    const rect = this.moreButtonRef.nativeElement.getBoundingClientRect();
    const parentViewRect = this.parentViewRef.getBoundingClientRect();
    if (!rect || !parentViewRect) return;

    const availablePlacement = getContextMenuPlacement(
      rect, height, this.placement, this.useParentContainer, this.forceStaticPlacement, this.parentViewRef
    );
    const positionStyle = calculateContextMenuPosition(
      rect, { width, height }, parentViewRect, availablePlacement, 'parent', this.forceStaticPlacement, this.useParentHeight
    );

    if (isContextMenuDocsMode() && positionStyle['top'] && positionStyle['left']) {
      const topVal = parseFloat(positionStyle['top']);
      const leftVal = parseFloat(positionStyle['left']);
      if (!isNaN(topVal) && !isNaN(leftVal)) {
        positionStyle['top'] = `${topVal - parentViewRect.top}px`;
        positionStyle['left'] = `${leftVal - parentViewRect.left}px`;
        positionStyle['position'] = 'absolute';
      }
    }

    this.applyHostAnchor(positionStyle, width, parentViewRect);

    this.positionStyle = positionStyle;
    this.cdr.detectChanges();
  }

  /**
   * Re-anchor the dropdown horizontally to the edge of this component's own box
   * that faces the content it belongs to. See `anchorToHost`.
   *
   * Vertical placement is left exactly as computed — the flip between above and
   * below still depends on the room available, and only the sideways offset was
   * ever wrong.
   */
  private applyHostAnchor(
    style: Record<string, string>,
    width: number,
    parentRect: DOMRect | null
  ): void {
    if (!this.anchorToHost) return;
    const host = this.hostRef?.nativeElement?.getBoundingClientRect();
    if (!host) return;

    const padding = 10;
    // `placement` is what the HOST asked for, not what the available room
    // settled on, so it still says which side of the content this column sits
    // on: `left` means the menu opens leftwards, i.e. the column is to the
    // content's left and its RIGHT edge is the one touching it.
    let left = this.placement === Placement.left ? host.right - width : host.left;

    const min = parentRect ? parentRect.left + padding : padding;
    const max = (parentRect ? parentRect.right : window.innerWidth) - width - padding;
    left = Math.max(min, Math.min(left, max));

    style['left'] = `${left}px`;
  }

  private setMenuHeight(): void {
    if (!this.subMenuRef?.nativeElement || !this.moreButtonRef?.nativeElement) return;

    const menuWidth = this.subMenuRef.nativeElement.scrollWidth;
    const menuHeight = this.subMenuRef.nativeElement.scrollHeight;
    const rect = this.moreButtonRef.nativeElement.getBoundingClientRect();
    const parentRect = this.parentViewRef?.getBoundingClientRect() || {
      left: 0, right: window.innerWidth, width: window.innerWidth,
      height: window.innerHeight, top: 0, bottom: window.innerHeight,
      x: 0, y: 0, toJSON: () => ({}),
    };

    this.positionStyle = calculateContextMenuPosition(
      rect, { width: menuWidth, height: menuHeight }, parentRect as DOMRect,
      this.placement, 'centered', this.forceStaticPlacement, this.useParentHeight
    );
    this.cdr.detectChanges();
  }

  getSubMenuItemIndex(item: ContextMenuItem): number { return this.subMenu.indexOf(item); }

  trackByItem(index: number, item: ContextMenuItem): string {
    return item.id || item.title || index.toString();
  }
}
