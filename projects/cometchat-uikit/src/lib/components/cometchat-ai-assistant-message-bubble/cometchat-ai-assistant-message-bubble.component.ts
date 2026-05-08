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
  imports: [CometChatMarkdownRenderer],
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

  /** Current color scheme, updated via window.matchMedia listener. */
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
}
