/**
 * CometChatThreadHeader displays the header for threaded message views.
 * Shows parent message preview, reply count, and close button.
 * @see Requirements 7.1-7.6, 14.1-14.6
 */
import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  HostListener,
  OnInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  TemplateRef,
  booleanAttribute,
  inject,
  DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { TranslatePipe } from '../../resources/CometChatLocalize/translate.pipe';
import { CometChatLocalize } from '../../resources/CometChatLocalize/cometchat-localize';
import { CometChatMessageBubbleComponent } from '../cometchat-message-bubble/cometchat-message-bubble.component';
import { MessageBubbleAlignment, MessageStatus } from '../../Enums/Enums';
import { CometChatUIKit } from '../../cometchat-uikit';
import { CometChatMessageEvents, IMessages } from '../../events/CometChatMessageEvents';
import { CometChatThreadEvents } from '../../events/CometChatThreadEvents';
import { ThreadSubscriptionService } from '../../services/thread-subscription.service';
import { toThreadId, writeThreadSubscribed } from '../../utils/thread-subscription-utils';
import { COMETCHAT_GLOBAL_CONFIG, GlobalConfig } from '../../services/global-config.service';
import { LiveAnnouncerService } from '../../services/live-announcer.service';
import { CometChatTextFormatter } from '../../formatters/cometchat-text-formatter';

const MAX_PREVIEW_LENGTH = 50;

/** Payload of {@link CometChatThreadHeaderComponent.threadSubscriptionChange}. */
export interface IThreadSubscriptionChange {
  parentMessageId: number;
  /** Whether the logged-in user now follows this thread. */
  subscribed: boolean;
}

@Component({
  selector: 'cometchat-thread-header',
  standalone: true,
  imports: [CommonModule, TranslatePipe, CometChatMessageBubbleComponent],
  templateUrl: './cometchat-thread-header.component.html',
  styleUrls: ['./cometchat-thread-header.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CometChatThreadHeaderComponent implements OnInit, OnDestroy, OnChanges {
  private cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly threadSubscription = inject(ThreadSubscriptionService);
  private readonly liveAnnouncer = inject(LiveAnnouncerService);
  private readonly globalConfig: Partial<GlobalConfig> | null = inject(COMETCHAT_GLOBAL_CONFIG, {
    optional: true,
  });
  private messageListenerId = '';
  private processedMessageIds = new Set<number>();

  @Input() parentMessage!: CometChat.BaseMessage;
  @Input() replyCount = 0;
  /**
   * Hide the follow/unfollow control without turning the feature off — for apps
   * that want the action-sheet entry point only.
   */
  @Input({ transform: booleanAttribute }) hideThreadSubscriptionToggle = false;

  /**
   * Formatters applied to the parent message's text. Handed to the bubble that
   * renders it, which owns the formatting — the header only forwards them.
   */
  @Input() textFormatters?: CometChatTextFormatter[];
  /** Replaces the trailing area of the reply-count row, follow control included. */
  @Input() trailingView?: TemplateRef<unknown>;

  protected internalReplyCount = 0;

  @Output() closeClick = new EventEmitter<void>();
  /** @deprecated Use closeClick instead. */
  @Output() backClick = new EventEmitter<void>();
  /** Emitted on every change to this thread's subscription, whoever caused it. */
  @Output() threadSubscriptionChange = new EventEmitter<IThreadSubscriptionChange>();

  get messagePreview(): string {
    if (!this.parentMessage) return '';
    const messageType = this.parentMessage.getType();
    if (messageType === CometChat.MESSAGE_TYPE.TEXT) {
      const text = (this.parentMessage as CometChat.TextMessage).getText() || '';
      return text.length > MAX_PREVIEW_LENGTH ? text.substring(0, MAX_PREVIEW_LENGTH) + '...' : text;
    }
    const subtitleMap: Record<string, string> = {
      [CometChat.MESSAGE_TYPE.IMAGE]: 'conversation_subtitle_image',
      [CometChat.MESSAGE_TYPE.VIDEO]: 'conversation_subtitle_video',
      [CometChat.MESSAGE_TYPE.AUDIO]: 'conversation_subtitle_audio',
      [CometChat.MESSAGE_TYPE.FILE]: 'conversation_subtitle_file',
    };
    return CometChatLocalize.getLocalizedString(subtitleMap[messageType] || 'message');
  }

  get mediaIcon(): string | null {
    if (!this.parentMessage) return null;
    const iconMap: Record<string, string> = {
      [CometChat.MESSAGE_TYPE.IMAGE]: 'assets/conversations_image-message.svg',
      [CometChat.MESSAGE_TYPE.VIDEO]: 'assets/conversations_video-message.svg',
      [CometChat.MESSAGE_TYPE.AUDIO]: 'assets/conversations_audio-message.svg',
      [CometChat.MESSAGE_TYPE.FILE]: 'assets/conversations_file-message.svg',
    };
    return iconMap[this.parentMessage.getType()] || null;
  }

  get replyCountText(): string {
    const displayCount = this.internalReplyCount > 999 ? '999+' : this.internalReplyCount;
    return this.internalReplyCount === 1
      ? `${displayCount} ${CometChatLocalize.getLocalizedString('thread_reply')}`
      : `${displayCount} ${CometChatLocalize.getLocalizedString('thread_replies')}`;
  }

  get ariaLabel(): string {
    const count = this.internalReplyCount > 999 ? '999+' : this.internalReplyCount.toString();
    return CometChatLocalize.getLocalizedString('accessibility_thread_header').replace('{preview}', this.messagePreview).replace('{count}', count);
  }

  // ==================== Thread Subscription ====================

  /**
   * The follow control renders only when the integrator has opted into the
   * feature and has not hidden this particular surface — and never once the
   * server has told us the thread is gone.
   *
   * Renders in a 1:1 thread as well as a group one: a subscription is what
   * decides whether replies reach you, and unsubscribing genuinely silences
   * them in a 1:1 too. The message option is gated the same way.
   */
  get showThreadSubscription(): boolean {
    return (
      !!this.globalConfig?.enableThreadSubscription &&
      this.threadSubscription.isSupported() &&
      !this.hideThreadSubscriptionToggle &&
      !!this.parentMessage &&
      !this.threadSubscription.isUnavailable(this.parentMessage.getId())
    );
  }

  /**
   * Read straight off the parent message — the server stamps the viewer's flag
   * on every fetched message in the thread, and a change made anywhere is
   * written back onto this object before the re-render (see
   * {@link subscribeToThreadEvents}). A re-fetch hands us a new object whose
   * flag is authoritative, which is how a fetched value overrides a local mirror.
   */
  get isFollowingThread(): boolean {
    return this.threadSubscription.isFollowing(this.parentMessage);
  }

  /**
   * Names the action the click performs, not the current state: on a subscribed
   * thread, clicking unsubscribes. Used for both the tooltip and the accessible
   * name — one string, so a voice-control user can say what the tooltip showed
   * them (WCAG 2.5.3).
   */
  get threadSubscriptionLabel(): string {
    return CometChatLocalize.getLocalizedString(
      this.isFollowingThread ? 'thread_subscription_unsubscribe' : 'thread_subscription_subscribe'
    );
  }

  /**
   * Toggle following for this thread. The control stays enabled in every state,
   * including `UNKNOWN`: a disabled control on a deep-linked thread is a dead
   * end, and following something you already follow is idempotent server-side.
   */
  onThreadSubscriptionClick(): void {
    if (!this.parentMessage) return;
    // The service publishes the flip on the thread event bus, and this
    // component's own bus subscription is what stamps the parent message and
    // emits `threadSubscriptionChange` — so a local toggle and one made on the
    // action sheet are announced through the same path.
    const subscribed = this.threadSubscription.toggle(this.parentMessage);
    // Announce the outcome, not the label: the label names the *next* action,
    // which read backwards to a screen reader after the state had changed.
    this.liveAnnouncer.announce(
      CometChatLocalize.getLocalizedString(
        subscribed
          ? 'thread_subscription_subscribed_toast'
          : 'thread_subscription_unsubscribed_toast'
      )
    );
    this.cdr.markForCheck();
  }

  onThreadSubscriptionKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.onThreadSubscriptionClick();
    }
  }

  /**
   * Keeps this control in agreement with the action-sheet option and with
   * changes the server made on its own — replying to a thread, or being
   * mentioned in one, auto-subscribes the user, and the toggle has to show that
   * without a refetch.
   *
   * Stamps the parent message before re-rendering: the control reads its state
   * off that object, so a `markForCheck` alone would re-render against the
   * pre-flip value.
   */
  private subscribeToThreadEvents(): void {
    CometChatThreadEvents.ccThreadSubscriptionChanged
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ parentMessageId, subscribed }) => {
        if (toThreadId(parentMessageId) !== toThreadId(this.parentMessage?.getId())) return;
        writeThreadSubscribed(this.parentMessage, subscribed);
        this.threadSubscriptionChange.emit({ parentMessageId, subscribed });
        this.cdr.markForCheck();
      });
  }

  get closeButtonAriaLabel(): string { return CometChatLocalize.getLocalizedString('accessibility_close_thread'); }
  /** @deprecated Use closeButtonAriaLabel instead. */
  get backButtonAriaLabel(): string { return this.closeButtonAriaLabel; }
  get isMediaMessage(): boolean { return this.mediaIcon !== null; }

  get senderName(): string {
    if (!this.parentMessage) return '';
    return this.parentMessage.getSender()?.getName() || '';
  }

  /**
   * Determines the alignment for the parent message bubble.
   * Right-aligned if sent by the logged-in user, left otherwise.
   */
  get parentMessageAlignment(): MessageBubbleAlignment {
    if (!this.parentMessage) return MessageBubbleAlignment.left;

    const loggedInUser = CometChatUIKit.getLoggedInUser();
    if (!loggedInUser) return MessageBubbleAlignment.left;

    return this.parentMessage.getSender()?.getUid() === loggedInUser.getUid()
      ? MessageBubbleAlignment.right
      : MessageBubbleAlignment.left;
  }

  // ==================== Event Handlers ====================

  /**
   * Handles close button click.
   * Emits both closeClick and backClick for backward compatibility.
   * @see Requirement 7.4, 14.2
   */
  onCloseClick(): void {
    this.closeClick.emit();
    this.backClick.emit(); // Backward compatibility
  }

  /**
   * @deprecated Use onCloseClick instead.
   */
  onBackClick(): void {
    this.onCloseClick();
  }

  /**
   * Handles keyboard events for the close button.
   * Activates on Enter or Space key.
   * @see Requirement 14.2
   */
  onCloseKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.onCloseClick();
    }
  }

  /**
   * @deprecated Use onCloseKeydown instead.
   */
  onBackKeydown(event: KeyboardEvent): void {
    this.onCloseKeydown(event);
  }

  /**
   * Handles keyboard events on the header container.
   * Closes thread on Escape key press.
   * @see Requirement 14.3
   */
  @HostListener('keydown', ['$event'])
  onHeaderKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.onCloseClick();
    }
  }

  // ==================== Lifecycle Hooks ====================

  ngOnInit(): void {
    this.internalReplyCount = this.replyCount || this.parentMessage?.getReplyCount?.() || 0;
    // CometChat.addListener overwrites by observer id, so two headers alive at
    // once — a thread opening over another — would leave one silently dead.
    // A random suffix keeps both registrations, matching the list components.
    this.messageListenerId = `thread_header_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    this.subscribeToMessageEvents();
    this.subscribeToThreadEvents();
    this.attachSdkListener();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['replyCount'] && !changes['replyCount'].firstChange) {
      // Only update if the new value is greater (to handle SDK updates)
      // This prevents resetting when the parent component passes updated count
      const newCount = changes['replyCount'].currentValue;
      if (newCount > this.internalReplyCount) {
        this.internalReplyCount = newCount;
      }
    }
    if (changes['parentMessage'] && !changes['parentMessage'].firstChange) {
      // Re-subscribe when parent message changes
      this.processedMessageIds.clear();
      this.internalReplyCount = this.replyCount || this.parentMessage?.getReplyCount?.() || 0;
      this.removeSdkListener();
      this.subscribeToMessageEvents();
      this.attachSdkListener();
    }
  }

  ngOnDestroy(): void {
    this.removeSdkListener();
  }

  // ==================== Private Methods ====================

  /**
   * Increment reply count if message hasn't been processed yet.
   * Prevents double counting from multiple event sources.
   */
  private incrementReplyCount(message: CometChat.BaseMessage): void {
    const messageId = message.getId();
    if (messageId && !this.processedMessageIds.has(messageId)) {
      this.processedMessageIds.add(messageId);
      this.internalReplyCount++;
      this.cdr.markForCheck();
    }
  }

  /**
   * Subscribe to UI message events for sent messages by current user.
   */
  private subscribeToMessageEvents(): void {
    if (!this.parentMessage) return;

    const parentId = this.parentMessage.getId();

    // Handle messages sent by current user (UI event)
    CometChatMessageEvents.ccMessageSent.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((data: IMessages) => {
      if (
        data.status === MessageStatus.success &&
        data.message?.getParentMessageId() === parentId
      ) {
        this.incrementReplyCount(data.message);
      }
    });
  }

  /**
   * Attach SDK message listener for real-time received messages.
   * This is needed because the Angular UIKit doesn't have a global
   * SDK event initializer like React UIKit does.
   */
  private attachSdkListener(): void {
    if (!this.parentMessage) return;

    const parentId = this.parentMessage.getId();
    const loggedInUser = CometChatUIKit.getLoggedInUser();
    const loggedInUid = loggedInUser?.getUid();

    CometChat.addMessageListener(
      this.messageListenerId,
      new CometChat.MessageListener({
        onTextMessageReceived: (message: CometChat.TextMessage) => {
          if (
            message?.getParentMessageId() === parentId &&
            message.getSender()?.getUid() !== loggedInUid
          ) {
            this.incrementReplyCount(message);
          }
        },
        onMediaMessageReceived: (message: CometChat.MediaMessage) => {
          if (
            message?.getParentMessageId() === parentId &&
            message.getSender()?.getUid() !== loggedInUid
          ) {
            this.incrementReplyCount(message);
          }
        },
        onCustomMessageReceived: (message: CometChat.CustomMessage) => {
          if (
            message?.getParentMessageId() === parentId &&
            message.getSender()?.getUid() !== loggedInUid
          ) {
            this.incrementReplyCount(message);
          }
        },
        onInteractiveMessageReceived: (message: CometChat.InteractiveMessage) => {
          if (
            message?.getParentMessageId() === parentId &&
            message.getSender()?.getUid() !== loggedInUid
          ) {
            this.incrementReplyCount(message);
          }
        },
      })
    );
  }

  /**
   * Remove SDK message listener.
   */
  private removeSdkListener(): void {
    if (this.messageListenerId) {
      CometChat.removeMessageListener(this.messageListenerId);
    }
  }

}
