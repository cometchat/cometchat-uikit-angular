import {
  Component,
  EventEmitter,
  Input,
  Output,
  ElementRef,
  AfterViewInit,
  ViewChild,
  OnInit,
  OnDestroy, ChangeDetectionStrategy} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../../resources/CometChatLocalize/translate.pipe';

/**
 * Link data interface
 */
export interface LinkPopoverData {
  url: string;
  text: string;
}

/**
 * CometChatLinkPopoverComponent
 *
 * A small popover that appears when clicking on a link in the editor.
 * Shows "Edit" and "Remove" buttons for quick link actions.
 * Positioned above the clicked link using viewport coordinates.
 *
 * @component
 */
@Component({
  selector: 'cometchat-link-popover',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './cometchat-link-popover.component.html',
  styleUrls: ['./cometchat-link-popover.component.css'],
})
export class CometChatLinkPopoverComponent implements OnInit, AfterViewInit, OnDestroy {
  /** @internal Timer references for cleanup */
  private pendingTimers: ReturnType<typeof setTimeout>[] = [];

  @ViewChild('popoverElement') popoverElement!: ElementRef<HTMLDivElement>;
  @ViewChild('editButton') editButton!: ElementRef<HTMLButtonElement>;
  @ViewChild('removeButton') removeButton!: ElementRef<HTMLButtonElement>;

  /** The link URL to display */
  @Input() url = '';

  /** The link text */
  @Input() text = '';

  /** X coordinate (viewport-relative center of the link element) */
  @Input() x = 0;

  /** Y coordinate (viewport-relative top of the link element) */
  @Input() y = 0;

  /** Emitted when the Edit button is clicked */
  @Output() editClick = new EventEmitter<LinkPopoverData>();

  /** Emitted when the Remove button is clicked */
  @Output() removeClick = new EventEmitter<void>();

  /** Emitted when the popover should be closed */
  @Output() closeClick = new EventEmitter<void>();

  /** Whether the popover position has been calculated */
  isPositioned = false;

  /** Calculated position styles */
  popoverTop = 0;
  popoverLeft = 0;

  /** Store the previously focused element for restoration */
  private previouslyFocusedElement: HTMLElement | null = null;

  /** Keyboard event listener reference for cleanup */
  private keydownListener: ((event: KeyboardEvent) => void) | null = null;

  /** Document click listener for closing on outside click */
  private documentClickListener: ((event: MouseEvent) => void) | null = null;

  /** Current focused menu item index (0 = edit, 1 = remove) */
  private focusedIndex = 0;

  constructor(private hostEl: ElementRef) {}

  ngOnInit(): void {
    this.previouslyFocusedElement = document.activeElement as HTMLElement;

    this.keydownListener = this.handleKeydown.bind(this);
    document.addEventListener('keydown', this.keydownListener);

    // Close on outside click — delay 150ms to avoid catching the triggering click
    this.pendingTimers.push(setTimeout(() => {
      this.documentClickListener = this.handleDocumentClick.bind(this);
      document.addEventListener('click', this.documentClickListener as EventListener, true);
    }, 150));
  }

  ngAfterViewInit(): void {
    // Initial position estimate using link coordinates
    this.positionAboveLink();
    this.isPositioned = true;

    // Refine with actual popover dimensions after layout
    this.pendingTimers.push(setTimeout(() => {
      this.refinePosition();
      this.editButton?.nativeElement.focus();
    }, 0));
  }

  ngOnDestroy(): void {
    this.pendingTimers.forEach(t => clearTimeout(t));
    this.pendingTimers = [];
    if (this.keydownListener) {
      document.removeEventListener('keydown', this.keydownListener);
    }
    if (this.documentClickListener) {
      document.removeEventListener('click', this.documentClickListener as EventListener, true);
    }
    this.restoreFocus();
  }

  private handleKeydown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        this.closeClick.emit();
        break;
      case 'Tab':
        this.trapTabFocus(event);
        break;
      case 'ArrowDown':
      case 'ArrowRight':
        event.preventDefault();
        this.focusNextItem();
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        event.preventDefault();
        this.focusPreviousItem();
        break;
    }
  }

  /**
   * Keeps Tab focus cycling within the popover (dialog focus trap), so the
   * close button and URL link are reachable instead of Tab closing the popover.
   */
  private trapTabFocus(event: KeyboardEvent): void {
    const root = this.popoverElement?.nativeElement;
    if (!root) { event.preventDefault(); return; }
    const focusables = Array.from(
      root.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ).filter(el => el.offsetParent !== null);
    if (focusables.length === 0) { event.preventDefault(); return; }
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement as HTMLElement | null;
    const inside = !!active && root.contains(active);
    if (event.shiftKey) {
      if (!inside || active === first) { event.preventDefault(); last.focus(); }
    } else {
      if (!inside || active === last) { event.preventDefault(); first.focus(); }
    }
  }

  private focusNextItem(): void {
    if (this.focusedIndex === 0) {
      this.focusedIndex = 1;
      this.removeButton?.nativeElement.focus();
    } else {
      this.focusedIndex = 0;
      this.editButton?.nativeElement.focus();
    }
  }

  private focusPreviousItem(): void {
    if (this.focusedIndex === 1) {
      this.focusedIndex = 0;
      this.editButton?.nativeElement.focus();
    } else {
      this.focusedIndex = 1;
      this.removeButton?.nativeElement.focus();
    }
  }

  private restoreFocus(): void {
    if (
      this.previouslyFocusedElement &&
      typeof this.previouslyFocusedElement.focus === 'function'
    ) {
      this.pendingTimers.push(setTimeout(() => {
        this.previouslyFocusedElement?.focus();
      }, 0));
    }
  }

  /**
   * Initial position estimate using link x/y coordinates.
   * Uses estimated dimensions before the popover has been laid out.
   */
  private positionAboveLink(): void {
    const estimatedHeight = 120;
    const estimatedWidth = 280;
    const gap = 8;

    if (this.x > 0 && this.y > 0) {
      let top = this.y - estimatedHeight - gap;
      let left = this.x - estimatedWidth / 2;

      // Flip below if no room above
      if (top < gap) { top = this.y + gap; }
      // Clamp horizontally
      if (left < gap) { left = gap; }
      if (left + estimatedWidth > window.innerWidth - gap) {
        left = window.innerWidth - estimatedWidth - gap;
      }

      this.popoverTop = top;
      this.popoverLeft = left;
      return;
    }

    // Fallback: center above composer
    this.positionAboveComposer();
  }

  /**
   * Fallback positioning: center above the composer element.
   */
  private positionAboveComposer(): void {
    const hostEl = this.hostEl.nativeElement as HTMLElement;
    const gap = 8;

    const container = this.findContainerAncestor(hostEl);
    if (container) {
      const rect = container.getBoundingClientRect();
      this.popoverTop = rect.top + rect.height / 2 - 80;
      this.popoverLeft = rect.left + (rect.width - 280) / 2;
      if (this.popoverTop < rect.top + gap) { this.popoverTop = rect.top + gap; }
      if (this.popoverLeft < rect.left + gap) { this.popoverLeft = rect.left + gap; }
      return;
    }

    const composer = hostEl.closest('.cometchat-message-composer') as HTMLElement | null;
    if (composer) {
      const rect = composer.getBoundingClientRect();
      this.popoverTop = rect.top - 160;
      this.popoverLeft = rect.left + (rect.width - 280) / 2;
      if (this.popoverTop < gap) { this.popoverTop = gap; }
      if (this.popoverLeft < gap) { this.popoverLeft = gap; }
      return;
    }

    // Last resort: use click coordinates
    this.popoverTop = Math.max(gap, this.y - 160);
    this.popoverLeft = Math.max(gap, this.x);
  }

  /**
   * Refine position after layout using actual popover dimensions.
   */
  private refinePosition(): void {
    if (!this.popoverElement) { return; }

    const popoverEl = this.popoverElement.nativeElement;
    const rect = popoverEl.getBoundingClientRect();
    const gap = 8;

    if (this.x > 0 && this.y > 0) {
      let left = this.x - rect.width / 2;
      let top = this.y - rect.height - gap;

      // Flip below if no room above
      if (top < gap) { top = this.y + gap; }
      // Clamp horizontally
      if (left < gap) { left = gap; }
      if (left + rect.width > window.innerWidth - gap) {
        left = window.innerWidth - rect.width - gap;
      }
      // Clamp vertically
      if (top + rect.height > window.innerHeight - gap) {
        top = window.innerHeight - rect.height - gap;
      }

      this.popoverLeft = left;
      this.popoverTop = top;
      return;
    }

    // Fallback: refine composer-centered position
    const hostEl = this.hostEl.nativeElement as HTMLElement;
    const container = this.findContainerAncestor(hostEl);
    if (container) {
      const containerRect = container.getBoundingClientRect();
      this.popoverLeft = containerRect.left + (containerRect.width - rect.width) / 2;
      this.popoverTop = containerRect.top + containerRect.height / 2 - rect.height / 2;
      if (this.popoverLeft + rect.width > containerRect.right - gap) {
        this.popoverLeft = containerRect.right - rect.width - gap;
      }
      if (this.popoverLeft < containerRect.left + gap) { this.popoverLeft = containerRect.left + gap; }
      if (this.popoverTop < containerRect.top + gap) { this.popoverTop = containerRect.top + gap; }
      return;
    }

    const composer = hostEl.closest('.cometchat-message-composer') as HTMLElement | null;
    if (composer) {
      const composerRect = composer.getBoundingClientRect();
      this.popoverLeft = composerRect.left + (composerRect.width - rect.width) / 2;
      this.popoverTop = composerRect.top - rect.height - gap;
    }

    // Clamp to viewport
    if (this.popoverLeft + rect.width > window.innerWidth) {
      this.popoverLeft = window.innerWidth - rect.width - gap;
    }
    if (this.popoverLeft < gap) { this.popoverLeft = gap; }
    if (this.popoverTop < gap) { this.popoverTop = gap; }
  }

  /**
   * Finds the nearest [data-cometchat-container] ancestor element.
   * Used to scope positioning to the Storybook story container.
   */
  private findContainerAncestor(el: HTMLElement): HTMLElement | null {
    let current: HTMLElement | null = el.parentElement;
    while (current) {
      if (current.hasAttribute('data-cometchat-container')) {
        return current;
      }
      current = current.parentElement;
    }
    return null;
  }

  /** Handle document click to close popover when clicking outside */
  private handleDocumentClick(event: MouseEvent): void {
    if (!this.popoverElement) { return; }
    const popoverEl = this.popoverElement.nativeElement;
    if (!popoverEl.contains(event.target as Node)) {
      this.closeClick.emit();
    }
  }

  handleEditClick(): void {
    this.editClick.emit({ url: this.url, text: this.text });
  }

  handleRemoveClick(): void {
    this.removeClick.emit();
  }

  handleCloseClick(): void {
    this.closeClick.emit();
  }

  /** Prevent clicks inside popover from bubbling to document listener */
  handlePopoverClick(event: MouseEvent): void {
    event.stopPropagation();
  }
}
