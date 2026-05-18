import {
  Component,
  Input,
  Output,
  EventEmitter,
  ElementRef,
  ViewChild,
  TemplateRef,
  HostListener,
  OnDestroy,
  AfterViewInit,
  OnInit,
  ChangeDetectorRef,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Placement } from '../../../Enums/Enums';
import {
  isDocsMode,
  getTopMostCometChatElement,
  getAvailablePlacement,
  calculateViewportPosition,
  calculateParentPosition,
  calculateNoParentHeightPosition,
  getFocusableElements,
} from './cometchat-popover.utils';

/**
 * CometChatPopover provides a floating popover positioned relative to a trigger element
 * with viewport-aware positioning and full accessibility support.
 */
@Component({
  selector: 'cometchat-popover',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './cometchat-popover.component.html',
  styleUrls: ['./cometchat-popover.component.css'],
})
export class CometChatPopoverComponent implements OnInit, AfterViewInit, OnDestroy {
  /** Static registry of all currently open popover instances for mutual exclusivity */
  private static openInstances = new Set<CometChatPopoverComponent>();

  private cdr = inject(ChangeDetectorRef);

  @Input() placement: Placement = Placement.bottom;
  @Input() closeOnOutsideClick = true;
  @Input() showOnHover = false;
  @Input() debounceOnHover = 500;
  @Input() content!: TemplateRef<any>;
  @Input() disableBackgroundInteraction = false;
  @Input() useParentContainer = false;
  @Input() useParentHeight = true;
  @Input() showTooltip = false;
  @Input() trapFocus = false;
  @Input() ariaLabel?: string;
  @Input() ariaLabelledBy?: string;
  @Input() ariaDescribedBy?: string;
  @Input() contentStyle: Record<string, string> = {};
  /**
   * When true (and useParentContainer is true), the popover will not overflow
   * the parent container horizontally. Use for popovers that must stay within
   * a bounded horizontal region (e.g. attachment menu in the message composer).
   */
  @Input() constrainHorizontal = false;
  /**
   * When true (and useParentContainer is true), the popover will not overflow
   * the parent container vertically. Use for popovers that must stay within
   * a bounded vertical region (e.g. message bubble context menus in the message list).
   */
  @Input() constrainVertical = false;

  @Output() popoverOpened = new EventEmitter<void>();
  @Output() popoverClosed = new EventEmitter<void>();
  @Output() outsideClick = new EventEmitter<void>();

  isOpen = false;
  isPositioned = false;
  positionStyle: Record<string, string> = {};
  availablePlacement: Placement = Placement.top;

  @ViewChild('popoverRef') popoverRef!: ElementRef<HTMLDivElement>;
  @ViewChild('childRef') childRef!: ElementRef<HTMLDivElement>;

  private hoverTimeout?: number;
  private parentViewRef?: HTMLElement;
  private resizeTimeout?: number;
  private previouslyFocusedElement: HTMLElement | null = null;
  public focusableElements: HTMLElement[] = [];
  private keydownListener: ((event: KeyboardEvent) => void) | null = null;
  private justOpened = false;

  Placement = Placement;
  popoverId = `cometchat-popover-${Math.random().toString(36).substr(2, 9)}`;

  ngOnInit(): void {}
  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
    CometChatPopoverComponent.openInstances.delete(this);
    if (this.hoverTimeout) clearTimeout(this.hoverTimeout);
    if (this.resizeTimeout) clearTimeout(this.resizeTimeout);
    if (this.keydownListener) document.removeEventListener('keydown', this.keydownListener);
    if (this.isOpen) this.restoreFocus();
  }

  togglePopover(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.openPopoverInternal();
    } else {
      this.closePopoverInternal(true);
    }
  }

  openPopover(): void {
    if (!this.isOpen) {
      this.isOpen = true;
      this.openPopoverInternal();
    }
  }

  closePopover(): void {
    if (this.isOpen) {
      this.isOpen = false;
      this.closePopoverInternal(true);
    }
  }

  closePopoverSilently(): void {
    if (this.isOpen) {
      this.isOpen = false;
      this.isPositioned = false;
      CometChatPopoverComponent.openInstances.delete(this);
      this.cleanupFocusTrap();
      this.restoreFocus();
    }
  }

  private openPopoverInternal(): void {
    CometChatPopoverComponent.openInstances.forEach(i => { if (i !== this) i.closePopover(); });
    CometChatPopoverComponent.openInstances.add(this);
    this.isPositioned = false;
    this.justOpened = true;
    setTimeout(() => { this.justOpened = false; }, 0);
    this.saveFocus();
    setTimeout(() => {
      setTimeout(() => {
        this.getPopoverPositionStyle();
        this.setupFocusTrap();
        this.focusFirstElement();
      }, 0);
    }, 0);
    this.popoverOpened.emit();
  }

  private closePopoverInternal(emit: boolean): void {
    CometChatPopoverComponent.openInstances.delete(this);
    this.isPositioned = false;
    this.cleanupFocusTrap();
    this.restoreFocus();
    this.cdr.markForCheck();
    this.cdr.detectChanges();
    if (emit) this.popoverClosed.emit();
  }

  onPopoverMouseEnter(): void {
    if (this.hoverTimeout) clearTimeout(this.hoverTimeout);
    if (this.showOnHover && !this.isOpen) {
      this.hoverTimeout = window.setTimeout(() => this.openPopover(), this.debounceOnHover);
    }
  }

  onPopoverMouseLeave(): void {
    if (this.hoverTimeout) clearTimeout(this.hoverTimeout);
    if (this.showOnHover && this.isOpen) {
      this.hoverTimeout = window.setTimeout(() => this.closePopover(), this.debounceOnHover);
    }
  }

  onChildClick(event: MouseEvent): void {
    event.stopPropagation();
    if (!this.showOnHover) this.togglePopover();
  }

  onChildKeydown(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    if (!this.showOnHover) this.togglePopover();
  }

  @HostListener('document:click', ['$event'])
  handleClickOutside(event: MouseEvent): void {
    if (!this.closeOnOutsideClick || !this.isOpen || this.justOpened || !this.popoverRef) return;
    if (this.popoverRef && this.childRef) {
      const target = event.target as Node;
      if (!this.popoverRef.nativeElement.contains(target) &&
          !this.childRef.nativeElement.contains(target)) {
        this.closePopover();
        this.outsideClick.emit();
      }
    }
  }

  @HostListener('window:resize')
  handleWindowResize(): void {
    if (this.isOpen) {
      if (this.resizeTimeout) clearTimeout(this.resizeTimeout);
      this.resizeTimeout = window.setTimeout(() => {
        requestAnimationFrame(() => this.getPopoverPositionStyle());
      }, 0);
    }
  }

  @HostListener('window:scroll')
  handleWindowScroll(): void {
    if (this.isOpen) requestAnimationFrame(() => this.getPopoverPositionStyle());
  }

  @HostListener('keydown.escape')
  handleEscapeKey(): void {
    if (this.isOpen) this.closePopover();
  }

  getAvailablePlacement(rect: DOMRect, height: number): Placement {
    return getAvailablePlacement(rect, height, this.placement, this.useParentContainer, this.parentViewRef);
  }

  getPopoverPositionStyle(): void {
    if (!this.popoverRef || !this.childRef) return;

    const effectiveUseParent = this.useParentContainer || isDocsMode();
    const popoverEl = this.popoverRef.nativeElement;
    popoverEl.style.visibility = 'hidden';
    popoverEl.style.display = 'block';
    const height = popoverEl.scrollHeight || popoverEl.offsetHeight;
    const width = popoverEl.scrollWidth || popoverEl.offsetWidth;
    const rect = this.childRef.nativeElement.getBoundingClientRect();
    popoverEl.style.visibility = '';
    popoverEl.style.display = '';

    if (effectiveUseParent) {
      this.parentViewRef = this.parentViewRef || getTopMostCometChatElement(popoverEl);
      this.calculatePopoverPosition();
      return;
    }

    // When constrainHorizontal or constrainVertical is set without useParentContainer,
    // find the parent container for constraint purposes but use viewport for placement.
    if (this.constrainHorizontal || this.constrainVertical) {
      this.parentViewRef = this.parentViewRef || getTopMostCometChatElement(popoverEl);
      if (this.parentViewRef) {
        const parentRect = this.parentViewRef.getBoundingClientRect();
        // Use viewport-based placement (not parent-based) so the menu opens above
        // even when the trigger is at the bottom of the parent container.
        const availablePlacement = getAvailablePlacement(rect, height, this.placement, false, undefined);
        this.availablePlacement = availablePlacement;
        this.positionStyle = calculateParentPosition(
          rect, height, width, parentRect, availablePlacement, false, null, this.showTooltip,
          this.constrainHorizontal, this.constrainVertical
        );
        this.isPositioned = true;
        this.cdr.detectChanges();
        return;
      }
    }

    const availablePlacement = this.getAvailablePlacement(rect, height);
    this.availablePlacement = availablePlacement;
    this.positionStyle = calculateViewportPosition(rect, height, width, availablePlacement);
    this.isPositioned = true;
    this.cdr.detectChanges();
  }

  calculatePopoverPosition(): void {
    if (!this.popoverRef || !this.childRef || !this.parentViewRef) return;

    const popoverEl = this.popoverRef.nativeElement;
    popoverEl.style.visibility = 'hidden';
    popoverEl.style.display = 'block';
    const height = popoverEl.scrollHeight || popoverEl.offsetHeight;
    const width = popoverEl.scrollWidth || popoverEl.offsetWidth;
    const rect = this.childRef.nativeElement.getBoundingClientRect();
    const parentRect = this.parentViewRef.getBoundingClientRect();
    popoverEl.style.visibility = '';
    popoverEl.style.display = '';

    if (!this.useParentHeight) {
      this.setPopoverHeight();
      return;
    }

    const availablePlacement = this.getAvailablePlacement(rect, height);
    this.availablePlacement = availablePlacement;

    const inDocsMode = isDocsMode();
    const hostEl = inDocsMode
      ? (popoverEl.closest('.cometchat-popover') as HTMLElement)
      : null;
    const hostRect = hostEl ? hostEl.getBoundingClientRect() : null;

    this.positionStyle = calculateParentPosition(
      rect, height, width, parentRect, availablePlacement, inDocsMode, hostRect, this.showTooltip,
      this.constrainHorizontal, this.constrainVertical
    );
    this.isPositioned = true;
    this.cdr.detectChanges();
  }

  setPopoverHeight(): void {
    if (!this.popoverRef || !this.childRef) return;
    const popoverWidth = this.popoverRef.nativeElement.scrollWidth;
    const rect = this.childRef.nativeElement.getBoundingClientRect();
    const parentRect = this.parentViewRef?.getBoundingClientRect() || {
      left: 0, right: window.innerWidth, width: window.innerWidth,
    };
    const height = this.popoverRef.nativeElement.scrollHeight;
    this.positionStyle = calculateNoParentHeightPosition(rect, popoverWidth, height, parentRect, this.placement);
    this.isPositioned = true;
    this.cdr.detectChanges();
  }

  getTopMostCometChatElement(): HTMLElement | undefined {
    if (!this.popoverRef) return undefined;
    return getTopMostCometChatElement(this.popoverRef.nativeElement);
  }

  getPopoverContentStyle(): Record<string, string> {
    const baseStyle = { ...this.positionStyle, ...this.contentStyle };
    if (this.disableBackgroundInteraction && this.isOpen) {
      baseStyle['zIndex'] = '1000';
      baseStyle['pointerEvents'] = 'auto';
    }
    return baseStyle;
  }

  private saveFocus(): void {
    this.previouslyFocusedElement = document.activeElement as HTMLElement;
  }

  private restoreFocus(): void {
    if (this.previouslyFocusedElement && typeof this.previouslyFocusedElement.focus === 'function') {
      setTimeout(() => this.previouslyFocusedElement?.focus(), 0);
    }
  }

  private setupFocusTrap(): void {
    if (!this.trapFocus || !this.popoverRef) return;
    this.focusableElements = getFocusableElements(this.popoverRef.nativeElement);
    this.keydownListener = this.handleKeydownForFocusTrap.bind(this);
    document.addEventListener('keydown', this.keydownListener);
  }

  private cleanupFocusTrap(): void {
    if (this.keydownListener) {
      document.removeEventListener('keydown', this.keydownListener);
      this.keydownListener = null;
    }
    this.focusableElements = [];
  }

  private handleKeydownForFocusTrap(event: KeyboardEvent): void {
    if (!this.trapFocus || !this.isOpen || this.focusableElements.length === 0) return;

    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
      event.stopPropagation();
    }

    if (event.key === 'Tab') {
      const first = this.focusableElements[0];
      const last = this.focusableElements[this.focusableElements.length - 1];
      const active = document.activeElement as HTMLElement;
      if (event.shiftKey && active === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && active === last) { event.preventDefault(); first.focus(); }
    }
  }

  private focusFirstElement(): void {
    if (!this.trapFocus || !this.popoverRef) return;
    setTimeout(() => {
      if (this.focusableElements.length > 0) this.focusableElements[0].focus();
      else this.popoverRef.nativeElement.focus();
    }, 0);
  }
}
