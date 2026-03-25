import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  HostListener, ChangeDetectionStrategy} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../../resources/CometChatLocalize';

export enum ToastType {
  success = 'success',
  error = 'error',
  warning = 'warning',
  info = 'info',
}

/**
 * CometChatToast Component
 *
 * A toast notification component for displaying temporary feedback messages.
 * Supports different types (success, error, warning, info) with auto-dismiss
 * and manual close functionality.
 *
 * Accessibility Features:
 * - ARIA live regions for screen reader announcements
 * - Keyboard accessible close button (Enter, Space, Escape)
 * - Proper ARIA roles based on toast type
 * - Focus indicators for keyboard navigation
 * - Does not trap focus (allows navigation to other elements)
 */
@Component({
  selector: 'cometchat-toast',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './cometchat-toast.component.html',
  styleUrls: ['./cometchat-toast.component.css'],
})
export class CometChatToastComponent implements OnInit, OnDestroy {
  /** Toast message text */
  @Input() text = '';
  /** Toast type for styling and icon */
  @Input() type: ToastType = ToastType.info;
  /** Duration in milliseconds before auto-dismiss (default: 3000ms, 0 = no auto-dismiss) */
  @Input() duration = 3000;
  /** Show close button */
  @Input() showCloseButton = true;
  /** Enable Escape key to dismiss toast (default: true) */
  @Input() dismissOnEscape = true;
  /** When true, toast uses static positioning (for service-managed container layout) */
  @Input() inline = false;

  /** Emitted when toast is closed (auto or manual) */
  @Output() toastClosed = new EventEmitter<void>();

  // Internal state
  isVisible = true;
  private autoCloseTimeout?: number;

  ngOnInit(): void {
    if (this.duration > 0) {
      this.autoCloseTimeout = window.setTimeout(() => {
        this.close();
      }, this.duration);
    }
  }

  ngOnDestroy(): void {
    if (this.autoCloseTimeout) {
      clearTimeout(this.autoCloseTimeout);
    }
  }

  close(): void {
    this.isVisible = false;
    this.toastClosed.emit();
  }

  onCloseClick(): void {
    if (this.autoCloseTimeout) {
      clearTimeout(this.autoCloseTimeout);
    }
    this.close();
  }

  get iconClass(): string {
    return `cometchat-toast__icon--${this.type}`;
  }

  get toastClass(): string {
    const classes = `cometchat-toast--${this.type}`;
    return this.inline ? `${classes} cometchat-toast--inline` : classes;
  }

  get iconSvg(): string {
    switch (this.type) {
      case ToastType.success:
        return 'check_circle';
      case ToastType.error:
        return 'error';
      case ToastType.warning:
        return 'warning';
      case ToastType.info:
      default:
        return 'info_icon';
    }
  }

  /**
   * Get ARIA role based on toast type
   * - 'alert' for error and warning (interrupting)
   * - 'status' for success and info (non-interrupting)
   */
  get ariaRole(): string {
    return this.type === ToastType.error || this.type === ToastType.warning ? 'alert' : 'status';
  }

  /**
   * Get aria-live value based on toast type
   * - 'assertive' for error and warning (immediate announcement)
   * - 'polite' for success and info (wait for pause)
   */
  get ariaLive(): 'assertive' | 'polite' {
    return this.type === ToastType.error || this.type === ToastType.warning
      ? 'assertive'
      : 'polite';
  }

  /**
   * Handle keyboard events on close button
   * Supports Enter and Space keys for accessibility
   */
  onCloseKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.onCloseClick();
    }
  }

  /**
   * Handle global keyboard events
   * Supports Escape key to dismiss toast
   */
  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: Event): void {
    if (this.dismissOnEscape && this.isVisible) {
      event.preventDefault();
      this.onCloseClick();
    }
  }
}
