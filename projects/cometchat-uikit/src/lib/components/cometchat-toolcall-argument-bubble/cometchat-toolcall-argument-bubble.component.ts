import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { CometChat } from '@cometchat/chat-sdk-javascript';

/**
 * CometChatToolCallArgumentBubble displays the arguments passed to a tool call
 * as formatted JSON (pretty-printed when valid, raw otherwise).
 *
 * Requirements: 7.1–7.7, 13.1, 15.1, 15.2, 16.1
 */
@Component({
  selector: 'cometchat-toolcall-argument-bubble',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  templateUrl: './cometchat-toolcall-argument-bubble.component.html',
  styleUrls: ['./cometchat-toolcall-argument-bubble.component.css'],
})
export class CometChatToolCallArgumentBubble {
  /** Required input: the AI tool argument message to render. */
  readonly message = input.required<CometChat.AIToolArgumentMessage>();

  /** Derived tool calls array — re-computes only when message() changes. */
  readonly toolCalls = computed(() =>
    this.message().getToolArgumentMessageData().getToolCalls() ?? []
  );

  /**
   * Formatted arguments per tool call.
   * Valid JSON is pretty-printed (2-space indent); invalid JSON is passed through raw.
   * Re-computes only when toolCalls() changes.
   */
  readonly formattedArgs = computed(() =>
    this.toolCalls().map((tc) => {
      try {
        return JSON.stringify(JSON.parse(tc.function.arguments), null, 2);
      } catch {
        return tc.function.arguments;
      }
    })
  );
}
