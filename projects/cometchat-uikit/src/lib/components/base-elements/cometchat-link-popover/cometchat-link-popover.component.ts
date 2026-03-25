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
 * Positioned absolutely relative to the parent composer element.
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

  /** X coordinate (viewport-relative, i.e. clientX) */
  @Input() x = 0;

  /** Y coordinate (viewport-relative, i.e. clientY) */
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

    // Close on outside click (delayed to avoid catching the triggering click)
    this.pendingTimers.push(setTimeout(() => {
      this.documentClickListener = this.handleDocumentClick.bind(this);
      document.addEventListener('click', this.documentClickListener, true);
    }, 0));
  }

  ngAfterViewInit(): void {
    // Position centered above the composer — no dependency on click coordinates
    this.positionAboveComposer();
    this.isPositioned = true;

    // After layout, refine with actual popover dimensions
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
      document.removeEventListener('click', this.documentClickListener, true);
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
        event.preventDefault();
        this.closeClick.emit();
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
   * Position the popover centered horizontally, just above the composer.
   * Uses estimated popover height for initial placement before layout.
   * In Storybook docs mode, positions relative to the nearest
   * [data-cometchat-container] ancestor instead of the full viewport.
   */
  private positionAboveComposer(): void {
    const hostEl = this.hostEl.nativeElement as HTMLElement;

    // Prefer [data-cometchat-container] ancestor (Storybook wrapper)
    const container = this.findContainerAncestor(hostEl);
    if (container) {
      const containerRect = container.getBoundingClientRect();
      this.popoverTop = containerRect.top + containerRect.height / 2 - 80;
      this.popoverLeft = containerRect.left + (containerRect.width - 280) / 2;
      if (this.popoverTop < containerRect.top + 8) {
        this.popoverTop = containerRect.top + 8;
      }
      if (this.popoverLeft < containerRect.left + 8) {
        this.popoverLeft = containerRect.left + 8;
      }
      return;
    }

    const composer = hostEl.closest('.cometchat-message-composer') as HTMLElement;
    if (!composer) {
      // Fallback to click coordinates
      this.popoverTop = this.y - 160;
      this.popoverLeft = this.x;
      return;
    }

    const composerRect = composer.getBoundingClientRect();

    // Place just above the composer with a small gap (8px)
    this.popoverTop = composerRect.top - 160;
    // Center horizontally using estimated width (280px min-width)
    this.popoverLeft = composerRect.left + (composerRect.width - 280) / 2;

    // If would go above viewport, place at top of viewport
    if (this.popoverTop < 8) {
      this.popoverTop = 8;
    }
    if (this.popoverLeft < 8) {
      this.popoverLeft = 8;
    }
  }

  /**
   * After layout, refine position using actual popover dimensions.
   */
  private refinePosition(): void {
    if (!this.popoverElement) {
      return;
    }

    const popover = this.popoverElement.nativeElement;
    const popoverRect = popover.getBoundingClientRect();
    const hostEl = this.hostEl.nativeElement as HTMLElement;

    // Prefer [data-cometchat-container] ancestor (Storybook wrapper)
    const container = this.findContainerAncestor(hostEl);
    if (container) {
      const containerRect = container.getBoundingClientRect();
      this.popoverLeft = containerRect.left + (containerRect.width - popoverRect.width) / 2;
      this.popoverTop = containerRect.top + containerRect.height / 2 - popoverRect.height / 2;
      // Clamp to container bounds
      if (this.popoverLeft + popoverRect.width > containerRect.right - 8) {
        this.popoverLeft = containerRect.right - popoverRect.width - 8;
      }
      if (this.popoverLeft < containerRect.left + 8) {
        this.popoverLeft = containerRect.left + 8;
      }
      if (this.popoverTop < containerRect.top + 8) {
        this.popoverTop = containerRect.top + 8;
      }
      return;
    }

    const composer = hostEl.closest('.cometchat-message-composer') as HTMLElement;

    if (composer) {
      const composerRect = composer.getBoundingClientRect();
      // Re-center with actual popover width
      this.popoverLeft = composerRect.left + (composerRect.width - popoverRect.width) / 2;
      // Place just above composer with actual height + 8px gap
      this.popoverTop = composerRect.top - popoverRect.height - 8;
    }

    // Clamp to viewport
    if (this.popoverLeft + popoverRect.width > window.innerWidth) {
      this.popoverLeft = window.innerWidth - popoverRect.width - 8;
    }
    if (this.popoverLeft < 8) {
      this.popoverLeft = 8;
    }
    if (this.popoverTop < 8) {
      this.popoverTop = 8;
    }
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
    if (!this.popoverElement) {
      return;
    }
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
