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

  @Output() optionClick = new EventEmitter<ContextMenuItem>();

  @ViewChild('moreButtonRef') moreButtonRef!: ElementRef<HTMLDivElement>;
  @ViewChild('subMenuRef') subMenuRef!: ElementRef<HTMLDivElement>;
  @ViewChildren('menuItemRef') menuItemRefs!: QueryList<ElementRef<HTMLDivElement>>;
  @ViewChildren('topMenuItemRef') topMenuItemRefs!: QueryList<ElementRef<HTMLDivElement>>;

  showSubMenu = false;
  positionStyle: Record<string, string> = {};
  private positionPreCalculated = false;
  focusedItemIndex = -1;
  focusedTopMenuIndex = -1;

  private readonly cdr = inject(ChangeDetectorRef);
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

  private handleClickOutside(event: MouseEvent): void {
    if (this.moreButtonRef?.nativeElement &&
        !this.moreButtonRef.nativeElement.contains(event.target as Node)) {
      this.showSubMenu = false;
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
    this.closeSubMenu();
    this.optionClick.emit(item);
    if ('onClick' in item && typeof item.onClick === 'function') item.onClick(0);
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
    const width = this.subMenuRef?.nativeElement?.clientWidth || 160;
    const rect = this.moreButtonRef?.nativeElement?.getBoundingClientRect();
    if (!rect) return;

    const availablePlacement = getContextMenuPlacement(
      rect, height, this.placement, this.useParentContainer, this.forceStaticPlacement, this.parentViewRef
    );
    this.positionStyle = calculateContextMenuPosition(
      rect, { width, height }, null, availablePlacement, 'viewport', this.forceStaticPlacement, this.useParentHeight
    );
    this.cdr.detectChanges();
  }

  private calculatePopoverPosition(): void {
    if (!this.moreButtonRef?.nativeElement || !this.parentViewRef) return;

    const height = this.subMenuRef?.nativeElement?.clientHeight || 48 * this.data.length;
    const width = this.subMenuRef?.nativeElement?.clientWidth || 160;
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

    this.positionStyle = positionStyle;
    this.cdr.detectChanges();
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
