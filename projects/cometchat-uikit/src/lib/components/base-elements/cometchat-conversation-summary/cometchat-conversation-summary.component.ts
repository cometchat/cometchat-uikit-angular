import { Component, Input, ChangeDetectionStrategy, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../../resources/CometChatLocalize/translate.pipe';
import { States } from '../../../Enums/Enums';

/**
 * CometChatConversationSummaryComponent displays an AI-generated conversation summary
 * in a panel with a localized title, close button, and body area.
 *
 * The component fetches the summary via a provided callback on initialization,
 * showing a loading shimmer during the fetch, then transitions to loaded/empty/error state.
 *
 * @example
 * ```html
 * <cometchat-conversation-summary
 *   [getConversationSummary]="summaryCallback"
 *   [closeCallback]="onClose">
 * </cometchat-conversation-summary>
 * ```
 *
 * @see Requirement 1.1 - Render panel with title, close button, and body
 * @see Requirement 1.2 - Fetch summary and show loading shimmer
 * @see Requirement 1.3 - Display summary text for valid responses
 * @see Requirement 1.4 - Display empty state for empty responses
 * @see Requirement 1.5 - Display error state for errors
 * @see Requirement 1.6 - Close button invokes closeCallback
 * @see Requirement 1.7 - BEM CSS with CSS variables
 * @see Requirement 1.8 - Translate pipe for all text
 * @see Requirement 12.1 - Close button keyboard accessible
 */
@Component({
  selector: 'cometchat-conversation-summary',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './cometchat-conversation-summary.component.html',
  styleUrls: ['./cometchat-conversation-summary.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CometChatConversationSummaryComponent implements OnInit {
  /**
   * Callback that fetches the conversation summary from the SDK.
   * Returns a Promise resolving to the summary text string.
   */
  @Input() getConversationSummary?: () => Promise<string>;

  /**
   * Callback invoked when the close button is clicked to dismiss the panel.
   */
  @Input() closeCallback?: () => void;

  /** Current state of the component (loading, loaded, empty, error). */
  state = signal<States>(States.loading);

  /** The fetched summary text to display in the body area. */
  summaryText = signal<string>('');

  /** Expose States enum to the template for @switch comparison. */
  readonly States = States;

  ngOnInit(): void {
    this.fetchSummary();
  }

  /**
   * Handles close button keyboard events (Enter and Space).
   * @see Requirement 12.1
   */
  onCloseKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.closeCallback?.();
    }
  }

  /**
   * Fetches the conversation summary using the provided callback.
   * Transitions state from loading to loaded/empty/error based on the response.
   * @see Requirement 1.2, 1.3, 1.4, 1.5
   */
  private async fetchSummary(): Promise<void> {
    if (!this.getConversationSummary) {
      this.state.set(States.empty);
      return;
    }

    try {
      const summary = await this.getConversationSummary();
      if (summary && summary.trim().length > 0) {
        this.summaryText.set(summary);
        this.state.set(States.loaded);
      } else {
        this.state.set(States.empty);
      }
    } catch {
      this.state.set(States.error);
    }
  }
}
