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
  inject, ChangeDetectionStrategy} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Placement } from '../../../Enums/Enums';

/**
 * CometChatPopover component provides a floating popover that can be positioned
 * relative to a trigger element with viewport-aware positioning.
 *
 * Accessibility Features:
 * - Keyboard navigation: Escape key closes popover
 * - Focus management: Focus trap within popover (when enabled)
 * - Focus restoration: Returns focus to trigger element on close
 * - ARIA attributes: Proper role, aria-modal, aria-labelledby/aria-describedby
 * - Screen reader support: Announces popover state changes
 *
 * @example
 * ```html
 * <cometchat-popover
 *   [placement]="Placement.bottom"
 *   [content]="popoverContent"
 *   [closeOnOutsideClick]="true"
 *   [trapFocus]="true"
 *   [ariaLabel]="'Settings menu'">
 *   <button>Click me</button>
 * </cometchat-popover>
 *
 * <ng-template #popoverContent>
 *   <div>Popover content here</div>
 * </ng-template>
 * ```
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

  /** ChangeDetectorRef for manual change detection */
  private cdr = inject(ChangeDetectorRef);

  /** Placement of the popover relative to trigger */
  @Input() placement: Placement = Placement.bottom;

  /** Close popover when clicking outside */
  @Input() closeOnOutsideClick = true;

  /** Show popover on hover instead of click */
  @Input() showOnHover = false;

  /** Debounce delay for hover trigger (ms) */
  @Input() debounceOnHover = 500;

  /** Content template for the popover */
  @Input() content!: TemplateRef<any>;

  /** Disable background interaction when popover is open */
  @Input() disableBackgroundInteraction = false;

  /** Use parent container as viewport for positioning */
  @Input() useParentContainer = false;

  /** Use parent height for positioning calculations */
  @Input() useParentHeight = true;

  /** Show tooltip arrow */
  @Input() showTooltip = false;

  /** Enable focus trap within popover (default: false for tooltips, true for dialogs) */
  @Input() trapFocus = false;

  /** Custom ARIA label for the popover */
  @Input() ariaLabel?: string;

  /** ID of element that labels the popover */
  @Input() ariaLabelledBy?: string;

  /** ID of element that describes the popover */
  @Input() ariaDescribedBy?: string;

  /**
   * Custom inline styles to apply to the popover content container.
   * Merged with the computed position styles. Useful for overriding
   * background, padding, max-width, border-radius, etc. from the parent.
   */
  @Input() contentStyle: Record<string, string> = {};

  /** Emitted when popover is opened */
  @Output() popoverOpened = new EventEmitter<void>();

  /** Emitted when popover is closed */
  @Output() popoverClosed = new EventEmitter<void>();

  /** Emitted when clicking outside */
  @Output() outsideClick = new EventEmitter<void>();

  // Internal state
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

  /** Flag to prevent immediate close after opening (handles click event propagation) */
  private justOpened = false;

  // Expose Placement enum to template
  Placement = Placement;

  /** Unique ID for ARIA attributes */
  popoverId = `cometchat-popover-${Math.random().toString(36).substr(2, 9)}`;

  ngOnInit(): void {
    // Keyboard event listener will be added when popover opens
  }

  ngAfterViewInit(): void {
    // View initialization complete
  }

  ngOnDestroy(): void {
    CometChatPopoverComponent.openInstances.delete(this);
    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
    }
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }
    if (this.keydownListener) {
      document.removeEventListener('keydown', this.keydownListener);
    }
    // Restore focus if popover is destroyed while open
    if (this.isOpen) {
      this.restoreFocus();
    }
  }

  /**
   * Toggles the popover open/closed state
   */
  togglePopover(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      // Close all other open popovers first (mutual exclusivity)
      CometChatPopoverComponent.openInstances.forEach(instance => {
        if (instance !== this) {
          instance.closePopover();
        }
      });
      CometChatPopoverComponent.openInstances.add(this);

      // Reset positioned flag - will be set after position is calculated
      this.isPositioned = false;

      // Set flag to prevent immediate close from document click handler
      this.justOpened = true;
      setTimeout(() => {
        this.justOpened = false;
      }, 0);

      this.saveFocus();
      // Use multiple setTimeout calls to ensure DOM is fully rendered
      // First timeout allows Angular to render the content
      // Second timeout ensures layout is complete for accurate measurements
      setTimeout(() => {
        setTimeout(() => {
          this.getPopoverPositionStyle();
          this.setupFocusTrap();
          this.focusFirstElement();
        }, 0);
      }, 0);
      this.popoverOpened.emit();
    } else {
      CometChatPopoverComponent.openInstances.delete(this);
      this.isPositioned = false;
      this.cleanupFocusTrap();
      this.restoreFocus();
      this.popoverClosed.emit();
    }
  }

  /**
   * Opens the popover
   */
  openPopover(): void {
    if (!this.isOpen) {
      // Close all other open popovers first (mutual exclusivity)
      CometChatPopoverComponent.openInstances.forEach(instance => {
        if (instance !== this) {
          instance.closePopover();
        }
      });

      this.isOpen = true;
      CometChatPopoverComponent.openInstances.add(this);

      // Reset positioned flag - will be set after position is calculated
      this.isPositioned = false;

      // Set flag to prevent immediate close from document click handler
      this.justOpened = true;
      setTimeout(() => {
        this.justOpened = false;
      }, 0);

      this.saveFocus();
      // Use multiple setTimeout calls to ensure DOM is fully rendered
      setTimeout(() => {
        setTimeout(() => {
          this.getPopoverPositionStyle();
          this.setupFocusTrap();
          this.focusFirstElement();
        }, 0);
      }, 0);
      this.popoverOpened.emit();
    }
  }

  /**
   * Closes the popover
   */
  closePopover(): void {
    if (this.isOpen) {
      this.isOpen = false;
      CometChatPopoverComponent.openInstances.delete(this);
      this.cleanupFocusTrap();
      this.restoreFocus();
      this.popoverClosed.emit();
    }
  }

  /**
   * Programmatically close the popover without emitting the popoverClosed event.
   * Used by parent components to enforce mutual exclusivity between popovers
   * without triggering cascading event handlers.
   */
  closePopoverSilently(): void {
    if (this.isOpen) {
      this.isOpen = false;
      this.isPositioned = false;
      CometChatPopoverComponent.openInstances.delete(this);
      this.cleanupFocusTrap();
      this.restoreFocus();
    }
  }

  /**
   * Handles mouse enter event for hover trigger
   */
  onPopoverMouseEnter(): void {
    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
    }

    if (this.showOnHover && !this.isOpen) {
      this.hoverTimeout = window.setTimeout(() => {
        this.openPopover();
      }, this.debounceOnHover);
    }
  }

  /**
   * Handles mouse leave event for hover trigger
   */
  onPopoverMouseLeave(): void {
    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
    }

    if (this.showOnHover && this.isOpen) {
      this.hoverTimeout = window.setTimeout(() => {
        this.closePopover();
      }, this.debounceOnHover);
    }
  }

  /**
   * Handles click events on the trigger element
   */
  onChildClick(event: MouseEvent): void {
    event.stopPropagation();
    if (!this.showOnHover) {
      this.togglePopover();
    }
  }

  /**
   * Handles keyboard events (Enter/Space) on the trigger element
   * Allows keyboard navigation to trigger the popover
   */
  onChildKeydown(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    if (!this.showOnHover) {
      this.togglePopover();
    }
  }

  /**
   * Handles clicks outside the popover
   */
  @HostListener('document:click', ['$event'])
  handleClickOutside(event: MouseEvent): void {
    if (!this.closeOnOutsideClick || !this.isOpen) return;

    // Skip if popover was just opened (prevents immediate close from same click event)
    if (this.justOpened) return;

    // Skip if popoverRef is not yet available (popover just opened)
    if (!this.popoverRef) return;

    if (this.popoverRef && this.childRef) {
      const popoverElement = this.popoverRef.nativeElement;
      const childElement = this.childRef.nativeElement;
      const target = event.target as Node;

      // Check if click is inside popover content or trigger
      if (!popoverElement.contains(target) && !childElement.contains(target)) {
        this.closePopover();
        this.outsideClick.emit();
      }
    }
  }

  /**
   * Handles window resize events
   */
  @HostListener('window:resize')
  handleWindowResize(): void {
    if (this.isOpen) {
      if (this.resizeTimeout) {
        clearTimeout(this.resizeTimeout);
      }
      this.resizeTimeout = window.setTimeout(() => {
        requestAnimationFrame(() => {
          this.getPopoverPositionStyle();
        });
      }, 0);
    }
  }

  /**
   * Handles window scroll events
   */
  @HostListener('window:scroll')
  handleWindowScroll(): void {
    if (this.isOpen) {
      requestAnimationFrame(() => {
        this.getPopoverPositionStyle();
      });
    }
  }

  /**
   * Handles Escape key press
   */
  @HostListener('keydown.escape')
  handleEscapeKey(): void {
    if (this.isOpen) {
      this.closePopover();
    }
  }

  /**
   * Determines the best placement for the popover based on available space
   */
  getAvailablePlacement(rect: DOMRect, height: number): Placement {
    const spaceAbove = rect.top;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceLeft = rect.left;
    const spaceRight = window.innerWidth - rect.right;

    // Use parent-scoped space checks when parent container is explicitly enabled
    // OR when running in Storybook docs mode (parentViewRef set by getPopoverPositionStyle)
    const effectiveUseParent = this.useParentContainer || this.isDocsMode();

    if (effectiveUseParent && this.parentViewRef) {
      const parentRect = this.parentViewRef.getBoundingClientRect();
      const spaceAboveParent = rect.top - parentRect.top;
      const spaceBelowParent = parentRect.bottom - rect.bottom;
      const spaceLeftParent = rect.left - parentRect.left;
      const spaceRightParent = parentRect.right - rect.right;

      const offset = !this.showTooltip ? 10 : 5;

      if (this.placement === Placement.top && spaceAboveParent >= height + offset)
        return Placement.top;
      if (this.placement === Placement.bottom && spaceBelowParent >= height + offset)
        return Placement.bottom;
      if (this.placement === Placement.left && spaceLeftParent >= height + 10)
        return Placement.left;
      if (this.placement === Placement.right && spaceRightParent >= height + 10)
        return Placement.right;

      if (spaceAboveParent >= height + 10) return Placement.top;
      if (spaceBelowParent >= height + 10) return Placement.bottom;
      if (spaceLeftParent >= height + 10) return Placement.left;
      if (spaceRightParent >= height + 10) return Placement.right;
    }

    if (this.placement === Placement.top && spaceAbove >= height + 10) return Placement.top;
    if (this.placement === Placement.bottom && spaceBelow >= height + 10) return Placement.bottom;
    if (this.placement === Placement.left && spaceLeft >= height + 10) return Placement.left;
    if (this.placement === Placement.right && spaceRight >= height + 10) return Placement.right;

    if (spaceAbove >= height + 10) return Placement.top;
    if (spaceBelow >= height + 10) return Placement.bottom;
    if (spaceLeft >= height + 10) return Placement.left;
    if (spaceRight >= height + 10) return Placement.right;

    return this.placement;
  }

  /**
   * Calculates and applies the popover position.
   * In Storybook docs mode (window.parent !== window) we automatically
   * scope positioning to the nearest container so the overlay stays
   * within the story canvas.
   */
  getPopoverPositionStyle(): void {
    if (!this.popoverRef || !this.childRef) return;

    // Auto-enable parent-container scoping in Storybook docs mode
    const effectiveUseParent = this.useParentContainer || this.isDocsMode();

    // Force a reflow to ensure accurate measurements
    const popoverEl = this.popoverRef.nativeElement;
    popoverEl.style.visibility = 'hidden';
    popoverEl.style.display = 'block';

    const height = popoverEl.scrollHeight || popoverEl.offsetHeight;
    const width = popoverEl.scrollWidth || popoverEl.offsetWidth;
    const rect = this.childRef.nativeElement.getBoundingClientRect();

    // Restore visibility
    popoverEl.style.visibility = '';
    popoverEl.style.display = '';

    if (effectiveUseParent) {
      this.parentViewRef = this.parentViewRef || this.getTopMostCometChatElement();
      this.calculatePopoverPosition();
      // Mark as positioned after calculation (detectChanges called in calculatePopoverPosition)
      return;
    }

    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const availablePlacement = this.getAvailablePlacement(rect, height);
    this.availablePlacement = availablePlacement;

    const positionStyle: Record<string, string> = {};
    const offset = 10; // Gap between trigger and popover

    if (availablePlacement === Placement.top) {
      // Position above the trigger
      positionStyle['top'] = `${rect.top - height - offset}px`;
      // Center horizontally relative to trigger, but keep within viewport
      let left = rect.left + rect.width / 2 - width / 2;
      left = Math.max(10, Math.min(left, viewportWidth - width - 10));
      positionStyle['left'] = `${left}px`;
    } else if (availablePlacement === Placement.bottom) {
      // Position below the trigger
      positionStyle['top'] = `${rect.bottom + offset}px`;
      // Center horizontally relative to trigger, but keep within viewport
      let left = rect.left + rect.width / 2 - width / 2;
      left = Math.max(10, Math.min(left, viewportWidth - width - 10));
      positionStyle['left'] = `${left}px`;
    } else if (availablePlacement === Placement.left) {
      // Position to the left of the trigger
      positionStyle['left'] = `${rect.left - width - offset}px`;
      // Center vertically relative to trigger, but keep within viewport
      let top = rect.top + rect.height / 2 - height / 2;
      top = Math.max(10, Math.min(top, viewportHeight - height - 10));
      positionStyle['top'] = `${top}px`;
    } else if (availablePlacement === Placement.right) {
      // Position to the right of the trigger
      positionStyle['left'] = `${rect.right + offset}px`;
      // Center vertically relative to trigger, but keep within viewport
      let top = rect.top + rect.height / 2 - height / 2;
      top = Math.max(10, Math.min(top, viewportHeight - height - 10));
      positionStyle['top'] = `${top}px`;
    }

    this.positionStyle = positionStyle;
    // Mark as positioned after calculation
    this.isPositioned = true;
    // Trigger change detection to update the view
    this.cdr.detectChanges();
  }

  /**
   * Calculates popover position when using parent container
   */
  calculatePopoverPosition(): void {
    if (!this.popoverRef || !this.childRef || !this.parentViewRef) return;

    // Force a reflow to ensure accurate measurements
    const popoverEl = this.popoverRef.nativeElement;
    popoverEl.style.visibility = 'hidden';
    popoverEl.style.display = 'block';

    const height = popoverEl.scrollHeight || popoverEl.offsetHeight;
    const width = popoverEl.scrollWidth || popoverEl.offsetWidth;
    const rect = this.childRef.nativeElement.getBoundingClientRect();
    const parentRect = this.parentViewRef.getBoundingClientRect();

    // Restore visibility
    popoverEl.style.visibility = '';
    popoverEl.style.display = '';

    if (!this.useParentHeight) {
      this.setPopoverHeight();
      return;
    }

    const availablePlacement = this.getAvailablePlacement(rect, height);
    this.availablePlacement = availablePlacement;

    const positionStyle: Record<string, string> = {};
    const offset = !this.showTooltip ? 10 : 5;

    // In Storybook docs mode, use absolute positioning relative to the
    // popover's own wrapper (.cometchat-popover which has position:relative)
    // so the popover scrolls with the story preview instead of being
    // fixed to the viewport.
    const inDocsMode = this.isDocsMode();

    if (inDocsMode) {
      positionStyle['position'] = 'absolute';

      // The positioned ancestor is .cometchat-popover (the host wrapper).
      // Get its rect to convert viewport coords to local coords.
      const hostEl = popoverEl.closest('.cometchat-popover') as HTMLElement;
      const hostRect = hostEl
        ? hostEl.getBoundingClientRect()
        : rect; // fallback to trigger rect

      if (availablePlacement === Placement.top) {
        positionStyle['top'] = `${rect.top - height - offset - hostRect.top}px`;
        let left = rect.left + rect.width / 2 - width / 2;
        left = Math.max(parentRect.left + 10, Math.min(left, parentRect.right - width - 10));
        positionStyle['left'] = `${left - hostRect.left}px`;
      } else if (availablePlacement === Placement.bottom) {
        positionStyle['top'] = `${rect.bottom + offset - hostRect.top}px`;
        let left = rect.left + rect.width / 2 - width / 2;
        left = Math.max(parentRect.left + 10, Math.min(left, parentRect.right - width - 10));
        positionStyle['left'] = `${left - hostRect.left}px`;
      } else if (availablePlacement === Placement.left) {
        positionStyle['left'] = `${rect.left - width - offset - hostRect.left}px`;
        let top = rect.top + rect.height / 2 - height / 2;
        top = Math.max(parentRect.top + 10, Math.min(top, parentRect.bottom - height - 10));
        positionStyle['top'] = `${top - hostRect.top}px`;
      } else if (availablePlacement === Placement.right) {
        positionStyle['left'] = `${rect.right + offset - hostRect.left}px`;
        let top = rect.top + rect.height / 2 - height / 2;
        top = Math.max(parentRect.top + 10, Math.min(top, parentRect.bottom - height - 10));
        positionStyle['top'] = `${top - hostRect.top}px`;
      }
    } else {
      // Normal parent-container mode: use fixed positioning with viewport coords
      if (availablePlacement === Placement.top) {
        positionStyle['top'] = `${Math.max(parentRect.top, rect.top - height - offset)}px`;
        let left = rect.left + rect.width / 2 - width / 2;
        left = Math.max(parentRect.left + 10, Math.min(left, parentRect.right - width - 10));
        positionStyle['left'] = `${left}px`;
      } else if (availablePlacement === Placement.bottom) {
        positionStyle['top'] = `${Math.min(parentRect.bottom - height, rect.bottom + offset)}px`;
        let left = rect.left + rect.width / 2 - width / 2;
        left = Math.max(parentRect.left + 10, Math.min(left, parentRect.right - width - 10));
        positionStyle['left'] = `${left}px`;
      } else if (availablePlacement === Placement.left) {
        positionStyle['left'] = `${Math.max(parentRect.left, rect.left - width - offset)}px`;
        let top = rect.top + rect.height / 2 - height / 2;
        top = Math.max(parentRect.top + 10, Math.min(top, parentRect.bottom - height - 10));
        positionStyle['top'] = `${top}px`;
      } else if (availablePlacement === Placement.right) {
        positionStyle['left'] = `${Math.min(parentRect.right - width, rect.right + offset)}px`;
        let top = rect.top + rect.height / 2 - height / 2;
        top = Math.max(parentRect.top + 10, Math.min(top, parentRect.bottom - height - 10));
        positionStyle['top'] = `${top}px`;
      }
    }

    this.positionStyle = positionStyle;
    // Mark as positioned after calculation
    this.isPositioned = true;
    // Trigger change detection to update the view
    this.cdr.detectChanges();
  }

  /**
   * Sets popover height when not using parent height
   */
  setPopoverHeight(): void {
    if (!this.popoverRef || !this.childRef) return;

    const popoverWidth = this.popoverRef.nativeElement.scrollWidth;
    const rect = this.childRef.nativeElement.getBoundingClientRect();
    const parentRect = this.parentViewRef?.getBoundingClientRect() || {
      left: 0,
      right: window.innerWidth,
      width: window.innerWidth,
    };

    const height = this.popoverRef.nativeElement.scrollHeight;
    const positionStyle: Record<string, string> = {};

    if (this.placement === Placement.top) {
      positionStyle['top'] = `${rect.top - height - 10}px`;
    } else if (this.placement === Placement.bottom) {
      positionStyle['top'] = `${rect.bottom + 10}px`;
    }

    const popoverLeft = rect.left + rect.width / 2 - popoverWidth / 2;
    if (popoverLeft < parentRect.left) {
      positionStyle['left'] = `${parentRect.left + 10}px`;
    } else if (popoverLeft + popoverWidth > parentRect.right) {
      positionStyle['left'] = `${parentRect.right - popoverWidth - 10}px`;
    } else {
      positionStyle['left'] = `${popoverLeft}px`;
    }

    this.positionStyle = positionStyle;
    // Mark as positioned after calculation
    this.isPositioned = true;
    // Trigger change detection to update the view
    this.cdr.detectChanges();
  }

  /**
   * Finds the nearest [data-cometchat-container] ancestor, or falls back to
   * the topmost element with the 'cometchat' class.
   *
   * In Storybook docs mode the [data-cometchat-container] wrapper added by
   * overlay stories is preferred so placement is scoped to the story canvas.
   */
  getTopMostCometChatElement(): HTMLElement | undefined {
    if (!this.popoverRef) return undefined;

    let current = this.popoverRef.nativeElement as HTMLElement;

    // Prefer the nearest [data-cometchat-container] ancestor (Storybook wrapper)
    while (current) {
      if (current.hasAttribute?.('data-cometchat-container')) {
        return current;
      }
      current = current.parentElement as HTMLElement;
    }

    // Fall back to topmost .cometchat element
    current = this.popoverRef.nativeElement as HTMLElement;
    let topMostElement: HTMLElement | null = null;
    while (current) {
      if (current.classList?.contains('cometchat')) {
        topMostElement = current;
      }
      current = current.parentElement as HTMLElement;
    }

    return topMostElement || undefined;
  }

  /**
   * Returns true when running inside a Storybook docs-mode iframe.
   * In docs mode the URL contains 'viewMode=docs' and stories are
   * rendered inline within a single page, requiring parent-container
   * scoping. In canvas mode (single story per iframe) viewport-based
   * positioning works correctly.
   */
  private isDocsMode(): boolean {
    try {
      return window.location.search.includes('viewMode=docs');
    } catch {
      return false;
    }
  }

  /**
   * Gets the combined style object for popover content
   */
  getPopoverContentStyle(): Record<string, string> {
    const baseStyle = { ...this.positionStyle, ...this.contentStyle };

    if (this.disableBackgroundInteraction && this.isOpen) {
      baseStyle['zIndex'] = '1000';
      baseStyle['pointerEvents'] = 'auto';
    }

    return baseStyle;
  }

  /**
   * Saves the currently focused element for later restoration
   */
  private saveFocus(): void {
    this.previouslyFocusedElement = document.activeElement as HTMLElement;
  }

  /**
   * Restores focus to the previously focused element (trigger element)
   */
  private restoreFocus(): void {
    if (
      this.previouslyFocusedElement &&
      typeof this.previouslyFocusedElement.focus === 'function'
    ) {
      setTimeout(() => {
        this.previouslyFocusedElement?.focus();
      }, 0);
    }
  }

  /**
   * Sets up focus trap within the popover when trapFocus is enabled
   */
  private setupFocusTrap(): void {
    if (!this.trapFocus || !this.popoverRef) {
      return;
    }

    // Find all focusable elements within the popover
    const focusableSelectors = [
      'button:not([disabled])',
      '[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ];

    const elements = this.popoverRef.nativeElement.querySelectorAll(focusableSelectors.join(', '));

    this.focusableElements = Array.from(elements) as HTMLElement[];

    // Add keyboard event listener for Tab key trapping
    this.keydownListener = this.handleKeydownForFocusTrap.bind(this);
    document.addEventListener('keydown', this.keydownListener);
  }

  /**
   * Cleans up focus trap event listeners
   */
  private cleanupFocusTrap(): void {
    if (this.keydownListener) {
      document.removeEventListener('keydown', this.keydownListener);
      this.keydownListener = null;
    }
    this.focusableElements = [];
  }

  /**
   * Handles keyboard events for focus trapping
   */
  private handleKeydownForFocusTrap(event: KeyboardEvent): void {
    if (!this.trapFocus || !this.isOpen || this.focusableElements.length === 0) {
      return;
    }

    // Stop arrow key propagation to prevent parent handlers (e.g., message list)
    // from processing arrow keys that belong to popover content navigation
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
      event.stopPropagation();
    }

    // Handle Tab key for focus trapping
    if (event.key === 'Tab') {
      const firstElement = this.focusableElements[0];
      const lastElement = this.focusableElements[this.focusableElements.length - 1];
      const activeElement = document.activeElement as HTMLElement;

      // If Shift+Tab on first element, move to last element
      if (event.shiftKey && activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
      // If Tab on last element, move to first element
      else if (!event.shiftKey && activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  }

  /**
   * Focuses the first focusable element in the popover
   */
  private focusFirstElement(): void {
    if (!this.trapFocus || !this.popoverRef) {
      return;
    }

    setTimeout(() => {
      if (this.focusableElements.length > 0) {
        this.focusableElements[0].focus();
      } else {
        // If no focusable elements, focus the popover container itself
        this.popoverRef.nativeElement.focus();
      }
    }, 0);
  }
}
