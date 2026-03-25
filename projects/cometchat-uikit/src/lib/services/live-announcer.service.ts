import { Injectable, OnDestroy } from '@angular/core';

/**
 * ARIA live region politeness levels.
 *
 * - 'off': No announcements
 * - 'polite': Announces when user is idle (non-interruptive)
 * - 'assertive': Announces immediately (interruptive)
 */
export type AriaLivePoliteness = 'off' | 'polite' | 'assertive';

/**
 * LiveAnnouncerService provides screen reader announcements via ARIA live regions.
 *
 * This service creates a visually hidden element that screen readers monitor
 * for changes. When content is added to this element, screen readers announce
 * it to users. This is essential for communicating dynamic content changes
 * that may not be apparent to users who cannot see the screen.
 *
 * @example
 * ```typescript
 * // In a component
 * constructor(private liveAnnouncer: LiveAnnouncerService) {}
 *
 * onItemDeleted(): void {
 *   this.liveAnnouncer.announce('Item deleted successfully');
 * }
 *
 * onError(message: string): void {
 *   this.liveAnnouncer.announceError(message);
 * }
 *
 * onStatusChange(status: string): void {
 *   this.liveAnnouncer.announceStatus(`Status changed to ${status}`);
 * }
 * ```
 *
 * @usageNotes
 * ### Politeness Levels
 *
 * - Use `'polite'` (default) for non-critical updates that can wait
 *   until the user is idle (e.g., status updates, confirmations)
 * - Use `'assertive'` for critical information that should interrupt
 *   the user immediately (e.g., errors, warnings)
 *
 * ### Best Practices
 *
 * - Keep announcements concise and meaningful
 * - Avoid announcing every minor change
 * - Use `announceError()` for error messages
 * - Use `announceStatus()` for status updates
 *
 * @see https://www.w3.org/WAI/WCAG21/Understanding/status-messages.html
 */
@Injectable({ providedIn: 'root' })
export class LiveAnnouncerService implements OnDestroy {
  private liveElement: HTMLElement | null = null;
  private currentTimeout: ReturnType<typeof setTimeout> | null = null;

  /**
   * Announces a message to screen readers.
   *
   * Creates a visually hidden live region element if it doesn't exist,
   * then updates its content to trigger a screen reader announcement.
   *
   * @param message - The message to announce
   * @param politeness - 'polite' (default) or 'assertive'
   * @param duration - How long to keep the message (ms), default 1000
   */
  announce(message: string, politeness: AriaLivePoliteness = 'polite', duration = 1000): void {
    // Don't announce empty messages or if politeness is 'off'
    if (!message || politeness === 'off') {
      return;
    }

    this.ensureLiveElement();

    // Clear any pending timeout
    if (this.currentTimeout) {
      clearTimeout(this.currentTimeout);
      this.currentTimeout = null;
    }

    // Clear current content and set politeness level
    this.liveElement!.textContent = '';
    this.liveElement!.setAttribute('aria-live', politeness);

    // Use setTimeout to ensure the change is detected by screen readers.
    // Screen readers need to see the element empty before new content
    // is added for the announcement to be triggered.
    setTimeout(() => {
      if (this.liveElement) {
        this.liveElement.textContent = message;
      }
    }, 100);

    // Clear the message after duration to prevent re-announcement
    // if the user navigates back to the element
    this.currentTimeout = setTimeout(() => {
      if (this.liveElement) {
        this.liveElement.textContent = '';
      }
      this.currentTimeout = null;
    }, duration);
  }

  /**
   * Announces an error message to screen readers.
   *
   * Uses 'assertive' politeness to ensure the error is announced
   * immediately, interrupting any current speech.
   *
   * @param message - The error message to announce
   */
  announceError(message: string): void {
    this.announce(message, 'assertive');
  }

  /**
   * Announces a status update to screen readers.
   *
   * Uses 'polite' politeness to announce the status when the user
   * is idle, without interrupting current speech.
   *
   * @param message - The status message to announce
   */
  announceStatus(message: string): void {
    this.announce(message, 'polite');
  }

  /**
   * Clears any pending announcement and removes the current message.
   */
  clear(): void {
    if (this.currentTimeout) {
      clearTimeout(this.currentTimeout);
      this.currentTimeout = null;
    }

    if (this.liveElement) {
      this.liveElement.textContent = '';
    }
  }

  /**
   * Creates the visually hidden live region element if it doesn't exist.
   *
   * The element is styled to be invisible but still accessible to
   * screen readers. It uses the 'cometchat-sr-only' class and inline
   * styles to ensure it's properly hidden across all browsers.
   */
  private ensureLiveElement(): void {
    if (this.liveElement) {
      return;
    }

    this.liveElement = document.createElement('div');
    this.liveElement.setAttribute('aria-live', 'polite');
    this.liveElement.setAttribute('aria-atomic', 'true');
    this.liveElement.setAttribute('role', 'status');
    this.liveElement.className = 'cometchat-sr-only';

    // Visually hidden but accessible to screen readers
    // Using inline styles ensures the element is hidden even if
    // the CSS class is not loaded
    Object.assign(this.liveElement.style, {
      position: 'absolute',
      width: '1px',
      height: '1px',
      padding: '0',
      margin: '-1px',
      overflow: 'hidden',
      clip: 'rect(0, 0, 0, 0)',
      whiteSpace: 'nowrap',
      border: '0',
    });

    document.body.appendChild(this.liveElement);
  }

  /**
   * Cleanup when the service is destroyed.
   *
   * Clears any pending timeouts and removes the live region element
   * from the DOM to prevent memory leaks.
   */
  ngOnDestroy(): void {
    if (this.currentTimeout) {
      clearTimeout(this.currentTimeout);
      this.currentTimeout = null;
    }

    if (this.liveElement && this.liveElement.parentNode) {
      this.liveElement.parentNode.removeChild(this.liveElement);
      this.liveElement = null;
    }
  }
}
