import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  signal,
  ViewChild,
  TemplateRef,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatMarkdownRenderer } from '../cometchat-markdown-renderer/cometchat-markdown-renderer.component';
import { CometChatUIEvents } from '../../events/CometChatUIEvents';
import { CometChatMessageEvents } from '../../events/CometChatMessageEvents';
import { TranslatePipe } from '../../resources/CometChatLocalize/translate.pipe';
// Same renderer the developer-card bubble uses; agent cards reuse it for their
// `card` element blocks.
import { CometChatCardViewComponent } from '@cometchat/cards-angular';
import type { CometChatCardActionEvent } from '@cometchat/cards-angular';
import { cardPayloadToJson, safeString } from '../../utils/card-utils';

/**
 * A normalized content block derived from one `AIAssistantElement`.
 * `text` blocks carry the assistant prose; `card` blocks carry the stringified raw
 * card payload (or a fallback string when the payload is empty/invalid).
 */
export type AIAssistantContentBlock =
  | { kind: 'text'; text: string }
  | { kind: 'card'; cardJson: string; fallback: string };

/**
 * CometChatAIAssistantMessageBubble renders a completed AI assistant message
 * with rich markdown formatting via CometChatMarkdownRenderer.
 *
 * Requirements: 5.1–5.8, 13.1, 16.1, 16.4, 16.5
 */
@Component({
  selector: 'cometchat-ai-assistant-message-bubble',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CometChatMarkdownRenderer, CometChatCardViewComponent, TranslatePipe],
  templateUrl: './cometchat-ai-assistant-message-bubble.component.html',
  styleUrls: ['./cometchat-ai-assistant-message-bubble.component.css'],
  host: {
    style: 'content-visibility: auto; contain-intrinsic-size: 0 120px;',
  },
})
export class CometChatAIAssistantMessageBubble {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);

  /** Required input: the completed AI assistant message to render. */
  readonly message = input.required<CometChat.AIAssistantMessage>();

  /** Derived text from the message data — re-computes only when message() changes. */
  readonly messageText = computed(
    () => this.message().getAssistantMessageData()?.getText() ?? ''
  );

  /**
   * Ordered content blocks from `getElements()`, or `null`
   * when the message has no elements (older messages) — in which case the
   * template falls back to the existing `getText()` markdown render. The
   * `agentic/assistant` routing is unchanged; only this content view differs.
   */
  readonly blocks = computed<AIAssistantContentBlock[] | null>(() => {
    let elements: CometChat.AIAssistantElement[] = [];
    try {
      elements = this.message().getElements?.() ?? [];
    } catch {
      elements = [];
    }
    if (!elements || elements.length === 0) return null;

    return elements.map((el): AIAssistantContentBlock => {
      const type = safeString(() => el.getType?.());
      let data: unknown;
      try { data = el.getData?.(); } catch { data = undefined; }

      if (type === 'card') {
        const card = (data as { card?: unknown } | undefined)?.card;
        return {
          kind: 'card',
          cardJson: cardPayloadToJson(card),
          fallback: (card as { fallbackText?: string } | undefined)?.fallbackText ?? '',
        };
      }

      // "text" (and any non-card block) renders as the assistant's existing text.
      const text =
        typeof data === 'string'
          ? data
          : ((data as { text?: string } | undefined)?.text ?? '');
      return { kind: 'text', text };
    });
  });

  /** Current color scheme, updated via window.matchMedia listener. Also handed to nested card renderers as the theme mode. */
  readonly colorScheme = signal<'light' | 'dark'>('light');

  /** Template ref for the image fullscreen viewer dialog. */
  @ViewChild('imageViewerTpl') imageViewerTpl!: TemplateRef<unknown>;

  /** Currently clicked image URL — used by the viewer template. */
  readonly activeImageUrl = signal<string>('');

  constructor() {
    if (!isPlatformBrowser(this.platformId)) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const updateScheme = (e: MediaQueryListEvent | MediaQueryList) => {
      this.colorScheme.set(e.matches ? 'dark' : 'light');
    };

    // Set initial value
    updateScheme(mediaQuery);

    // Listen for changes
    mediaQuery.addEventListener('change', updateScheme);

    // Cleanup on destroy
    this.destroyRef.onDestroy(() => {
      mediaQuery.removeEventListener('change', updateScheme);
    });
  }

  /**
   * Handles imageClick from CometChatMarkdownRenderer.
   * Opens the image in a dialog via CometChatUIEvents.ccShowDialog.
   */
  onImageClick(url: string): void {
    this.activeImageUrl.set(url);
    CometChatUIEvents.ccShowDialog.next({
      child: this.imageViewerTpl,
      confirmCallback: () => {},
    });
  }

  /**
   * Pure-forward of a nested agent-card action. This bubble is
   * kit-instantiated, so no `(onCardAction)` prop reaches the app — the action is
   * emitted on the global event bus only, carrying the owning AIAssistantMessage.
   */
  onCardAction(event: CometChatCardActionEvent): void {
    CometChatMessageEvents.ccCardActionClicked.next({
      message: this.message(),
      action: event?.action,
      elementId: event?.elementId,
      cardJson: event?.cardJson,
    });
  }
}
