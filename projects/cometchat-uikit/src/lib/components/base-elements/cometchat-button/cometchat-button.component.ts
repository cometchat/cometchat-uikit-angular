import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, ChangeDetectionStrategy} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../../resources/CometChatLocalize/translate.pipe';

// Loading animation SVG as inline data URI for library portability
const LOADING_ICON_SVG = `data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M12 22C10.6333 22 9.34167 21.7375 8.125 21.2125C6.90833 20.6875 5.84583 19.9708 4.9375 19.0625C4.02917 18.1542 3.3125 17.0917 2.7875 15.875C2.2625 14.6583 2 13.3667 2 12C2 10.6167 2.2625 9.32083 2.7875 8.1125C3.3125 6.90417 4.02917 5.84583 4.9375 4.9375C5.84583 4.02917 6.90833 3.3125 8.125 2.7875C9.34167 2.2625 10.6333 2 12 2C12.2833 2 12.5208 2.09583 12.7125 2.2875C12.9042 2.47917 13 2.71667 13 3C13 3.28333 12.9042 3.52083 12.7125 3.7125C12.5208 3.90417 12.2833 4 12 4C9.78333 4 7.89583 4.77917 6.3375 6.3375C4.77917 7.89583 4 9.78333 4 12C4 14.2167 4.77917 16.1042 6.3375 17.6625C7.89583 19.2208 9.78333 20 12 20C14.2167 20 16.1042 19.2208 17.6625 17.6625C19.2208 16.1042 20 14.2167 20 12C20 11.7167 20.0958 11.4792 20.2875 11.2875C20.4792 11.0958 20.7167 11 21 11C21.2833 11 21.5208 11.0958 21.7125 11.2875C21.9042 11.4792 22 11.7167 22 12C22 13.3667 21.7375 14.6583 21.2125 15.875C20.6875 17.0917 19.9708 18.1542 19.0625 19.0625C18.1542 19.9708 17.0958 20.6875 15.8875 21.2125C14.6792 21.7375 13.3833 22 12 22Z' fill='%23FFFFFF'/%3E%3C/svg%3E`;

/**
 * CometChatButton is a reusable button component with consistent styling.
 * Supports text, icon, loading state, and disabled state.
 *
 * @example
 * ```html
 * <cometchat-button
 *   [text]="'Submit'"
 *   [iconURL]="'path/to/icon.svg'"
 *   [disabled]="false"
 *   [isLoading]="false"
 *   (buttonClick)="onButtonClick($event)"
 * ></cometchat-button>
 * ```
 */
@Component({
  selector: 'cometchat-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './cometchat-button.component.html',
  styleUrls: ['./cometchat-button.component.css'],
})
export class CometChatButtonComponent implements OnChanges {
  /** Button text label */
  @Input() text?: string;

  /** Tooltip text shown on hover */
  @Input() hoverText?: string;

  /** Icon URL for button icon (uses CSS mask) */
  @Input() iconURL?: string;

  /** Disabled state - prevents click events */
  @Input() disabled?: boolean;

  /** Loading state - shows loading animation and disables button */
  @Input() isLoading = false;

  /** Custom aria-label for accessibility (useful for icon-only buttons) */
  @Input() ariaLabel?: string;

  /** Icon-only mode - removes default width and padding for compact icon buttons */
  @Input() iconOnly = false;

  /** Emitted when button is clicked (only when not disabled and not loading) */
  @Output() buttonClick = new EventEmitter<MouseEvent>();

  /** Path to loading animation SVG (inline data URI for portability) */
  readonly loadingIconURL = LOADING_ICON_SVG;

  /**
   * Normalizes null/undefined inputs to their default values.
   * Prevents NG0100 ExpressionChangedAfterItHasBeenCheckedError.
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['disabled'] && changes['disabled'].currentValue == null) {
      this.disabled = false;
    }
    if (changes['isLoading'] && changes['isLoading'].currentValue == null) {
      this.isLoading = false;
    }
    if (changes['iconOnly'] && changes['iconOnly'].currentValue == null) {
      this.iconOnly = false;
    }
  }

  /**
   * Handles button click event.
   * Only emits if button is not disabled and not loading.
   */
  onButtonClick(event: MouseEvent): void {
    if (!this.disabled && !this.isLoading) {
      this.buttonClick.emit(event);
    }
  }

  /**
   * Handles keyboard events for accessibility.
   * Activates button on Enter or Space key press.
   * Requirement 11.2: Support Enter/Space key activation
   */
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault(); // Prevent default space scrolling
      event.stopPropagation(); // Prevent event from bubbling to parent handlers
      if (!this.disabled && !this.isLoading) {
        // Create a synthetic MouseEvent for consistency with click handler
        const syntheticEvent = new MouseEvent('click', {
          bubbles: false, // Don't bubble to prevent parent handlers from firing
          cancelable: true,
        });
        this.buttonClick.emit(syntheticEvent);
      }
    }
  }

  /**
   * Stops event propagation on mouse down/up to prevent parent handlers.
   */
  onMouseEvent(event: MouseEvent): void {
    event.stopPropagation();
  }

  /**
   * Determines if the button should be disabled.
   */
  get isDisabled(): boolean {
    return !!this.disabled || this.isLoading;
  }

  /**
   * Generates accessible label for the button.
   * Priority: custom ariaLabel > text > hoverText > default
   */
  get accessibleLabel(): string | undefined {
    if (this.ariaLabel) {
      return this.ariaLabel;
    }
    if (this.text) {
      return this.text;
    }
    if (this.hoverText) {
      return this.hoverText;
    }
    // Return undefined to let native button text be used
    return undefined;
  }
}
