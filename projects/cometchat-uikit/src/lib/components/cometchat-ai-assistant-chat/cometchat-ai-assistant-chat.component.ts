import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  OnDestroy,
  OnInit,
  output,
  signal,
  TemplateRef,
  untracked,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { safeEffect } from '../../utils/safe-effect';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatAIStreamingService } from '../../services/cometchat-ai-streaming.service';
import { CometChatAIAssistantTools } from '../../modals/CometChatAIAssistantTools';
import { CometChatMessageEvents } from '../../events/CometChatMessageEvents';
import { CometChatUIEvents } from '../../events/CometChatUIEvents';
import { CometChatLocalize } from '../../resources/CometChatLocalize/cometchat-localize';
import { MessageStatus } from '../../Enums/Enums';
import { NgTemplateOutlet } from '@angular/common';
import { TranslatePipe } from '../../resources/CometChatLocalize/translate.pipe';
import { CometChatMessageHeaderComponent } from '../cometchat-message-header/cometchat-message-header.component';
import { CometChatMessageListComponent } from '../cometchat-message-list/cometchat-message-list.component';
import { CometChatMessageComposerComponent } from '../cometchat-message-composer/cometchat-message-composer.component';
import { CometChatAIAssistantChatHistory } from '../cometchat-ai-assistant-chat-history/cometchat-ai-assistant-chat-history.component';
import { CometChatStreamMessageBubble } from '../cometchat-stream-message-bubble/cometchat-stream-message-bubble.component';
import { CometChatAvatarComponent } from '../base-elements/cometchat-avatar/cometchat-avatar.component';
import { CometChatErrorBoundaryComponent } from '../base-elements/cometchat-error-boundary/cometchat-error-boundary.component';
import { MessageBubbleConfigService } from '../../services/message-bubble-config.service';
import { CometChatUIKit } from '../../cometchat-uikit';

/**
 * CometChatAIAssistantChat is the top-level orchestrator component for the AI assistant
 * chat experience. It wires together MessageHeader, MessageList, MessageComposer, and the
 * ChatHistory sidebar, managing streaming state, suggestion pills, and focus management.
 *
 * Requirements: 10.1–10.18, 11.1, 12.1, 12.3–12.5, 12.7, 13.1, 13.3, 13.4, 13.7,
 *               13.10, 13.12, 13.13, 16.1
 */
@Component({
  selector: 'cometchat-ai-assistant-chat',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgTemplateOutlet,
    TranslatePipe,
    CometChatMessageHeaderComponent,
    CometChatMessageListComponent,
    CometChatMessageComposerComponent,
    CometChatAIAssistantChatHistory,
    CometChatStreamMessageBubble,
    CometChatAvatarComponent,
    CometChatErrorBoundaryComponent,
  ],
  templateUrl: './cometchat-ai-assistant-chat.component.html',
  styleUrls: ['./cometchat-ai-assistant-chat.component.css'],
})
export class CometChatAIAssistantChat implements OnInit, AfterViewInit, OnDestroy {
  // ── DI ───────────────────────────────────────────────────────────────────
  readonly streamingService = inject(CometChatAIStreamingService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly bubbleConfigService = inject(MessageBubbleConfigService);

  // ── Signal inputs ─────────────────────────────────────────────────────────
  readonly user = input.required<CometChat.User>();
  readonly streamingSpeed = input<number>(30);
  readonly aiAssistantTools = input<CometChatAIAssistantTools>();
  readonly loadLastAgentConversation = input<boolean>(false);
  readonly showSuggestedMessages = input<boolean>(true);
  readonly suggestedMessages = input<string[]>([]);
  readonly showBackButton = input<boolean>(false);
  readonly greetingTemplate = input<TemplateRef<{ $implicit: CometChat.User }>>();

  // ── Outputs ───────────────────────────────────────────────────────────────
  readonly backClick = output<void>();

  // ── State signals ─────────────────────────────────────────────────────────
  /**
   * Parent message ID 7passed to the composer for threading.
   * Set on first ccMessageSent SUCCESS and when loading from history.
   */
  readonly activeParentMessageId = signal<number | null>(null);

  /**
   * Parent message ID passed to the message list.
   * Only set when loading an existing conversation from history — NOT on first send.
   * This prevents the message list from clearing+refetching when the first message is sent.
   */
  readonly messageListParentId = signal<number | null>(null);

  readonly isSidebarOpen = signal(false);
  readonly isSuggestionsVisible = signal(true);
  readonly newChatKey = signal(0);
  readonly sidebarTriggerEl = signal<HTMLElement | null>(null);
  readonly hasComposerText = signal(false);
  readonly activeRunId = signal<string | null>(null);

  /**
   * Local mutable copy of loadLastAgentConversation. Set to false after the
   * first load resolves or when "New Chat" is clicked — prevents the message
   * list from staying in shimmer state forever.
   */
  readonly loadLastAgentConversationState = signal(false);

  /** Sentinel message ID used for the temporary streaming placeholder message. */
  private readonly STREAMING_MESSAGE_ID = -999999;

  /** The currently logged-in user (used in templates for sender checks). */
  readonly loggedInUser = signal<CometChat.User | null>(CometChatUIKit.getLoggedInUser());

  // ── ViewChild for sidebar focus management ────────────────────────────────
  @ViewChild('sidebarContainer') sidebarContainerRef?: ElementRef<HTMLElement>;
  @ViewChild('agentBubbleFooterTpl') agentBubbleFooter?: TemplateRef<any>;
  @ViewChild('streamBubbleViewTpl') streamBubbleViewTpl?: TemplateRef<any>;
  @ViewChild(CometChatMessageComposerComponent) composerRef?: CometChatMessageComposerComponent;
  @ViewChild(CometChatMessageListComponent) messageListRef?: CometChatMessageListComponent;

  // ── Computed signals ──────────────────────────────────────────────────────

  /** True while the AI is streaming a response for this user. */
  readonly isStreaming = signal(false);

  /** Suggestion pills: prefer explicit input, fall back to user metadata. */
  readonly availableSuggestions = computed(() => {
    const explicit = this.suggestedMessages();
    if (explicit.length > 0) return explicit;
    const meta = this.user().getMetadata() as Record<string, unknown> | null | undefined;
    return (meta?.['suggestedMessages'] as string[] | undefined) ?? [];
  });

  /** Greeting text: from user metadata.greetingMessage, fallback to user name. */
  readonly greetingMessage = computed(() => {
    const meta = this.user().getMetadata() as Record<string, unknown> | null | undefined;
    return (meta?.['greetingMessage'] as string | undefined) ?? this.user().getName();
  });

  /** Intro message: from user metadata.introductoryMessage, fallback to localized string. */
  readonly introMessage = computed(() => {
    const meta = this.user().getMetadata() as Record<string, unknown> | null | undefined;
    return (
      (meta?.['introductoryMessage'] as string | undefined) ??
      CometChatLocalize.getLocalizedString('ai_assistant_chat_intro_message')
    );
  });

  /**
   * MessageList config that disables reply/copy/delete/edit/reactions/thread
   * for the AI agent chat context.
   */
  readonly messageListConfig = computed(() => ({
    hideReplyInThreadOption: true,
    hideCopyMessageOption: true,
    hideDeleteMessageOption: true,
    hideEditMessageOption: true,
    hideReactionOption: true,
    disableInteraction: false,
  }));

  // ── Effects ───────────────────────────────────────────────────────────────

  constructor() {
    // Sync streamingSpeed input → service
    safeEffect(() => {
      const speed = this.streamingSpeed();
      untracked(() => this.streamingService.setStreamSpeed(speed));
    });

    // Sync aiAssistantTools input → service
    safeEffect(() => {
      const tools = this.aiAssistantTools();
      untracked(() => {
        if (tools) this.streamingService.setAIAssistantTools(tools);
      });
    });

    // Reset state when user changes (switching between agent chats)
    safeEffect(() => {
      const _user = this.user(); // track user signal
      untracked(() => {
        this.streamingService.stopStreamingMessage(_user.getUid());
        this.activeParentMessageId.set(null);
        this.messageListParentId.set(null);
        this.activeRunId.set(null);
        this.isSuggestionsVisible.set(true);
        this.hasComposerText.set(false);
      });
    });

    // Focus management: when sidebar opens, focus first focusable element inside it
    safeEffect(() => {
      const isOpen = this.isSidebarOpen();
      if (isOpen) {
        setTimeout(() => {
          const container = this.sidebarContainerRef?.nativeElement;
          if (container) {
            const firstFocusable = container.querySelector<HTMLElement>(
              'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            firstFocusable?.focus();
          }
        }, 0);
      } else {
        untracked(() => {
          const trigger = this.sidebarTriggerEl();
          trigger?.focus();
        });
      }
    });
  }

  ngOnInit(): void {
    this.loadLastAgentConversationState.set(this.loadLastAgentConversation());
    this._subscribeToStreamingState();
    this._subscribeToMessageSent();
    this._subscribeToStreamEvents();
    this._subscribeToAIMessageReceived();
  }

  ngAfterViewInit(): void {
    // Register the footer view via the service instead of passing it as an input
    if (this.agentBubbleFooter) {
      this.bubbleConfigService.setGlobalView('footerView', this.agentBubbleFooter);
    }
    // Register the streaming bubble view for the placeholder message type
    if (this.streamBubbleViewTpl) {
      this.bubbleConfigService.setBubbleView('ai_streaming_custom', {
        bubbleView: this.streamBubbleViewTpl,
      });
    }
  }

  ngOnDestroy(): void {
    // Clean up service-registered views to avoid leaking templates
    this.bubbleConfigService.setGlobalView('footerView', null);
    this.bubbleConfigService.clearType('ai_streaming_custom');
    this._removeStreamingMessage();
  }

  // ── Public event handlers ─────────────────────────────────────────────────

  /** Handle back button click — emits backClick output. */
  onBackClick(): void {
    this.backClick.emit();
  }

  /** Start a new chat: reset state, stop streaming, bump key. */
  onNewChat(): void {
    this.activeParentMessageId.set(null);
    this.messageListParentId.set(null);
    this.activeRunId.set(null);
    this.streamingService.stopStreamingMessage(this.user().getUid());
    this.newChatKey.update((k) => k + 1);
    this.isSuggestionsVisible.set(true);
    this.hasComposerText.set(false);
    this.loadLastAgentConversationState.set(false);
  }

  /** Called by the composer's (textChange) output to track whether text is present. */
  onComposerTextChange(text: string): void {
    this.hasComposerText.set(text.trim().length > 0);
  }

  /** Copy the text content of an AI message to clipboard. */
  onCopyMessage(message: CometChat.BaseMessage): void {
    let text = '';
    // AI assistant messages store text in getAssistantMessageData()
    const aiMessage = message as any;
    if (aiMessage.getAssistantMessageData?.()?.getText) {
      text = aiMessage.getAssistantMessageData().getText() ?? '';
    }
    // Fallback to regular getText()
    if (!text) {
      text = (message as CometChat.TextMessage).getText?.() ?? '';
    }
    if (text && navigator?.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
  }

  /** Toggle the chat history sidebar. */
  onToggleSidebar(triggerEl?: HTMLElement): void {
    if (triggerEl) this.sidebarTriggerEl.set(triggerEl);
    this.isSidebarOpen.update((open) => !open);
  }

  /** Handle a message click from the history sidebar. */
  onHistoryMessageClick(message: CometChat.TextMessage): void {
    const msgId = message.getId();
    this.activeParentMessageId.set(msgId);
    // Set messageListParentId so the list fetches the historical thread
    this.messageListParentId.set(msgId);
    this.isSidebarOpen.set(false);
    this.streamingService.stopStreamingMessage(this.user().getUid());
    this.isSuggestionsVisible.set(false);
    this.loadLastAgentConversationState.set(false);
  }

  /** Handle new-chat click from the history sidebar. */
  onHistoryNewChatClick(_message: CometChat.TextMessage | null): void {
    this.activeParentMessageId.set(null);
    this.messageListParentId.set(null);
    this.isSidebarOpen.set(false);
    this.isSuggestionsVisible.set(true);
  }

  /** Handle close click from the history sidebar. */
  onHistoryCloseClick(): void {
    this.isSidebarOpen.set(false);
  }

  /** Handle suggestion pill click: emit the text into the composer. */
  onSuggestionClick(text: string): void {
    CometChatUIEvents.publishComposeMessage(text);
    this.isSuggestionsVisible.set(false);
  }

  /** Handle stop-streaming button click (from the send button view). */
  onStopStreaming(): void {
    this.streamingService.stopStreamingMessage(this.user().getUid());
    this.activeRunId.set(null);
  }

  /** Handle send button click — delegates to the composer's handleSend(). */
  onSendClick(): void {
    if (this.composerRef && this.hasComposerText() && !this.isStreaming()) {
      this.composerRef.handleSend();
    }
  }

  /** Reset conversation state on error boundary retry. */
  handleRetryClick(): void {
    this.activeParentMessageId.set(null);
    this.messageListParentId.set(null);
    this.activeRunId.set(null);
    this.streamingService.stopStreamingMessage(this.user().getUid());
    this.newChatKey.update((k) => k + 1);
    this.isSuggestionsVisible.set(true);
    this.hasComposerText.set(false);
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  /**
   * Subscribe to the streaming state observable for this user and keep
   * the isStreaming signal in sync. When streaming stops, remove the
   * temporary placeholder message from the list.
   */
  private _subscribeToStreamingState(): void {
    this.streamingService.isStreamingFor(this.user().getUid())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((streaming) => {
        const wasStreaming = this.isStreaming();
        this.isStreaming.set(streaming);

        // Only handle removal here — addition is handled after message sent success
        if (!streaming && wasStreaming) {
          this._removeStreamingMessage();
        }
      });
  }

  /**
   * Subscribe to messageStream$ to capture the active runId when run_started fires.
   * The stream bubble needs the runId to filter events from the shared observable.
   */
  private _subscribeToStreamEvents(): void {
    this.streamingService.messageStream$
      .pipe(
        filter((event) => event.chatId === this.user().getUid()),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((event) => {
        const type = event.message.getType();
        if (type === 'run_started' || type === CometChat.AI_ASSISTANT_EVENTS?.RUN_STARTED) {
          this.activeRunId.set(event.runId);
        } else if (type === 'run_finished' || type === CometChat.AI_ASSISTANT_EVENTS?.RUN_FINISHED) {
          this.activeRunId.set(null);
        }
      });
  }

  private _subscribeToMessageSent(): void {
    CometChatMessageEvents.ccMessageSent
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => {
        const chatId = this.user().getUid();

        if (event.status === MessageStatus.inprogress) {
          this.streamingService.startStreamingMessage(chatId);
          this.isSuggestionsVisible.set(false);
        } else if (event.status === MessageStatus.success) {
          this.isSuggestionsVisible.set(false);

          const msg = event.message;
          if (
            this.activeParentMessageId() === null &&
            !msg.getParentMessageId() &&
            msg.getReceiverId() === chatId
          ) {
            const msgId = msg.getId();
            if (msgId) {
              // Set the composer threading ID so subsequent messages are sent as thread replies.
              // Do NOT set messageListParentId here — the message list stays in "no parentMessageId"
              // mode during an active chat session (matching React's goToMessageId pattern).
              // messageListParentId is only set when loading a historical conversation from the
              // sidebar (onHistoryMessageClick), which triggers a full thread fetch.
              // The service's isAgentChatMode flag ensures AI replies (which carry parentMessageId)
              // are still accepted and displayed in the list without a parentMessageId filter.
              this.activeParentMessageId.set(msgId);
            }
          }

          // Add the streaming placeholder message after the user's message is confirmed sent
          if (this.isStreaming() && msg.getReceiverId() === chatId) {
            this._addStreamingMessage();
          }
        }
      });
  }

  /**
   * When an AI assistant message is received in real-time, stop streaming
   * so the stream bubble disappears and only the final message shows.
   */
  private _subscribeToAIMessageReceived(): void {
    CometChatMessageEvents.onAIAssistantMessageReceived
      .pipe(
        filter((message) => message.getSender()?.getUid() === this.user().getUid()),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        if (this.isStreaming()) {
          this.streamingService.stopStreamingMessage(this.user().getUid());
          this.activeRunId.set(null);
        }
      });
  }

  /**
   * Adds a temporary placeholder message to the message list that triggers
   * the streaming bubble view via MessageBubbleConfigService.
   */
  private _addStreamingMessage(): void {
    if (!this.messageListRef) return;
    const placeholder = new CometChat.TextMessage(
      this.user().getUid(),
      '',
      CometChat.RECEIVER_TYPE.USER
    );
    // Use a stable sentinel ID so we can reliably remove it later
    placeholder.setId(this.STREAMING_MESSAGE_ID);
    placeholder.setMuid(`streaming_placeholder_${this.user().getUid()}`);
    placeholder.setType('ai_streaming');
    placeholder.setCategory(CometChat.CATEGORY_CUSTOM as any);
    placeholder.setSender(this.user());
    placeholder.setSentAt(Math.floor(Date.now() / 1000));
    this.messageListRef.addMessage(placeholder);
    this.messageListRef.scrollToBottom(false);
  }

  /**
   * Removes the temporary streaming placeholder message from the message list.
   */
  private _removeStreamingMessage(): void {
    if (!this.messageListRef) return;
    this.messageListRef.removeMessage(this.STREAMING_MESSAGE_ID);
  }
}
