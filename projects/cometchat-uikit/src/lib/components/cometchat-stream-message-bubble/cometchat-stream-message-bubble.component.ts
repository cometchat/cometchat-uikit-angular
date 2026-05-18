import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  OnInit,
  signal,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatAIStreamingService } from '../../services/cometchat-ai-streaming.service';
import { CometChatMarkdownRenderer } from '../cometchat-markdown-renderer/cometchat-markdown-renderer.component';
import { TranslatePipe } from '../../resources/CometChatLocalize/translate.pipe';

/**
 * CometChatStreamMessageBubble renders a live-streaming AI response.
 *
 * Mirrors the React CometChatStreamMessageBubble pattern:
 * - Subscribes directly to the global messageStream$ on mount
 * - No runId filtering — the bubble is only alive during one streaming session
 * - Accumulates text deltas and updates signals on every chunk
 */
@Component({
  selector: 'cometchat-stream-message-bubble',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CometChatMarkdownRenderer, TranslatePipe],
  templateUrl: './cometchat-stream-message-bubble.component.html',
  styleUrls: ['./cometchat-stream-message-bubble.component.css'],
  host: { style: 'display: block;' },
})
export class CometChatStreamMessageBubble implements OnInit {
  private readonly streamingService = inject(CometChatAIStreamingService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly document = inject(DOCUMENT);
  private readonly cdr = inject(ChangeDetectorRef);

  /** The chat ID — used to scope events to this chat. */
  readonly chatId = input.required<string>();

  // ── State signals ─────────────────────────────────────────────────────────
  readonly isThinking = signal(true);
  readonly isExecutingTool = signal(false);
  readonly hasError = signal(false);
  readonly streamedText = signal('');
  readonly toolExecutionText = signal('');

  readonly hasStreamedContent = computed(() => this.streamedText().length > 0);

  ngOnInit(): void {
    this._subscribeToStream();
    this._registerOfflineListener();
  }

  private _subscribeToStream(): void {
    this.streamingService.messageStream$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => {
        // Only handle events for this chat
        if (event.chatId !== this.chatId()) return;

        const type = event.message.getType();

        switch (type) {
          case 'run_started':
            this.isThinking.set(true);
            this.isExecutingTool.set(false);
            this.streamedText.set('');
            this.toolExecutionText.set('');
            break;

          case 'tool_call_start': {
            this.isThinking.set(false);
            this.isExecutingTool.set(true);
            const execText = (event.message as CometChat.AIAssistantToolStartedEvent).getData?.()?.executionText
              ?? (event.message as any).getExecutionText?.()
              ?? '';
            this.toolExecutionText.set(execText);
            break;
          }

          case 'tool_call_end':
            this.isExecutingTool.set(false);
            break;

          case 'text_message_content':
            this.isThinking.set(false);
            this.isExecutingTool.set(false);
            if (event.streamedContent !== undefined) {
              this.streamedText.set(event.streamedContent);
            }
            break;

          case 'run_finished':
            // streaming service already set isStreaming=false; bubble will be removed
            break;
        }

        this.cdr.markForCheck();
      });
  }

  private _registerOfflineListener(): void {
    const win = this.document.defaultView;
    if (!win) return;
    const handler = () => {
      this.streamingService.stopStreamingMessage(this.chatId());
      this.hasError.set(true);
      this.cdr.markForCheck();
    };
    win.addEventListener('offline', handler);
    this.destroyRef.onDestroy(() => win.removeEventListener('offline', handler));
  }
}
