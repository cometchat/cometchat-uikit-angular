import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { CometChat } from '@cometchat/chat-sdk-javascript';

/**
 * CometChatToolCallResultBubble displays the result returned by a tool call
 * as formatted JSON (pretty-printed when valid, raw otherwise).
 * Renders nothing when the result is empty or null.
 *
 * Requirements: 8.1–8.7, 13.1, 15.1, 15.2, 16.1
 */
@Component({
  selector: 'cometchat-toolcall-result-bubble',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cometchat-toolcall-result-bubble.component.html',
  styleUrls: ['./cometchat-toolcall-result-bubble.component.css'],
})
export class CometChatToolCallResultBubble {
  /** Required input: the AI tool result message to render. */
  readonly message = input.required<CometChat.AIToolResultMessage>();

  /** Extracted result text — re-computes only when message() changes. */
  readonly resultText = computed(() =>
    this.message().getToolResultMessageData().getText()
  );

  /**
   * Formatted result text.
   * Returns null for empty/absent text (template renders nothing).
   * Valid JSON is pretty-printed (2-space indent); invalid JSON is passed through raw.
   * Re-computes only when resultText() changes.
   */
  readonly formattedResult = computed(() => {
    const text = this.resultText();
    if (!text) return null;
    try {
      return JSON.stringify(JSON.parse(text), null, 2);
    } catch {
      return text;
    }
  });
}
