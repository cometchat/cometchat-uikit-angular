/**
 * CometChatThreadHeader Component
 *
 * A header component for threaded message views that displays the parent message
 * preview, reply count, and a close button to return to the main chat.
 *
 * Features:
 * - Displays parent message preview with truncation for long content
 * - Shows reply count with real-time updates
 * - Provides close button to return to main chat
 * - Displays appropriate icons for media parent messages (image, video, audio, file)
 * - Supports keyboard navigation for accessibility (Enter, Space, Escape)
 * - Uses localization for all text
 * - Full ARIA support with role="banner" and descriptive labels
 *
 * @example
 * ```html
 * <cometchat-thread-header
 *   [parentMessage]="message"
 *   [replyCount]="5"
 *   (closeClick)="onCloseClick()">
 * </cometchat-thread-header>
 * ```
 *
 * @see Requirement 7.1 - Display parent message preview
 * @see Requirement 7.2 - Display reply count
 * @see Requirement 7.3 - Display close button
 * @see Requirement 7.4 - Emit closeClick event
 * @see Requirement 7.5 - Truncate long parent message content
 * @see Requirement 7.6 - Display appropriate icons for media parent messages
 * @see Requirement 14.1 - Close button focusable via Tab navigation
 * @see Requirement 14.2 - Enter/Space on close button emits closeClick
 * @see Requirement 14.3 - Escape while header focused closes thread
 * @see Requirement 14.4 - role="banner" attribute
 * @see Requirement 14.5 - aria-label="Close thread" on close button
 * @see Requirement 14.6 - aria-label with preview and reply count
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
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { TranslatePipe } from '../../resources/CometChatLocalize/translate.pipe';
import { CometChatLocalize } from '../../resources/CometChatLocalize/cometchat-localize';
import { CometChatMessageBubbleComponent } from '../cometchat-message-bubble/cometchat-message-bubble.component';
import { MessageBubbleAlignment, MessageStatus } from '../../Enums/Enums';
import { CometChatUIKit } from '../../cometchat-uikit';
import { CometChatMessageEvents, IMessages } from '../../events/CometChatMessageEvents';

/** Maximum characters for message preview truncation */
const MAX_PREVIEW_LENGTH = 50;

/**
 * CometChatThreadHeaderComponent displays the header for threaded message views.
 *
 * @see Requirement 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 14.1-14.6
 */
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
  private subscriptions: Subscription[] = [];
  private messageListenerId = '';

  /** Track processed message IDs to avoid double counting */
  private processedMessageIds = new Set<number>();

  // ==================== Inputs ====================

  /**
   * The parent message of the thread.
   * @see Requirement 7.1
   */
  @Input() parentMessage!: CometChat.BaseMessage;

  /**
   * The initial number of replies in the thread.
   * @see Requirement 7.2
   */
  @Input() replyCount = 0;

  // ==================== Internal State ====================

  /** Internal reply count that updates in real-time */
  protected internalReplyCount = 0;

  // ==================== Outputs ====================

  /**
   * Emitted when the close button is clicked or Escape is pressed.
   * @see Requirement 7.3, 7.4, 14.2, 14.3
   */
  @Output() closeClick = new EventEmitter<void>();

  /**
   * @deprecated Use closeClick instead. Kept for backward compatibility.
   */
  @Output() backClick = new EventEmitter<void>();

  // ==================== Computed Properties ====================

  /**
   * Gets the truncated parent message preview.
   * Truncates long text content and adds ellipsis.
   * For media messages, returns a localized description.
   * @see Requirement 7.1, 7.5
   */
  get messagePreview(): string {
    if (!this.parentMessage) {
      return '';
    }

    const messageType = this.parentMessage.getType();

    // Handle text messages
    if (messageType === CometChat.MESSAGE_TYPE.TEXT) {
      const textMessage = this.parentMessage as CometChat.TextMessage;
      const text = textMessage.getText() || '';

      if (text.length > MAX_PREVIEW_LENGTH) {
        return text.substring(0, MAX_PREVIEW_LENGTH) + '...';
      }
      return text;
    }

    // Handle media messages with localized descriptions
    switch (messageType) {
      case CometChat.MESSAGE_TYPE.IMAGE:
        return CometChatLocalize.getLocalizedString('conversation_subtitle_image');
      case CometChat.MESSAGE_TYPE.VIDEO:
        return CometChatLocalize.getLocalizedString('conversation_subtitle_video');
      case CometChat.MESSAGE_TYPE.AUDIO:
        return CometChatLocalize.getLocalizedString('conversation_subtitle_audio');
      case CometChat.MESSAGE_TYPE.FILE:
        return CometChatLocalize.getLocalizedString('conversation_subtitle_file');
      default:
        // For custom or other message types
        return CometChatLocalize.getLocalizedString('message');
    }
  }

  /**
   * Gets the icon URL for media parent messages.
   * Returns null for text messages.
   * @see Requirement 7.6
   */
  get mediaIcon(): string | null {
    if (!this.parentMessage) {
      return null;
    }

    const messageType = this.parentMessage.getType();

    switch (messageType) {
      case CometChat.MESSAGE_TYPE.IMAGE:
        return 'assets/conversations_image-message.svg';
      case CometChat.MESSAGE_TYPE.VIDEO:
        return 'assets/conversations_video-message.svg';
      case CometChat.MESSAGE_TYPE.AUDIO:
        return 'assets/conversations_audio-message.svg';
      case CometChat.MESSAGE_TYPE.FILE:
        return 'assets/conversations_file-message.svg';
      default:
        return null;
    }
  }

  /**
   * Gets the localized reply count text.
   * Uses singular form for 1 reply, plural for multiple.
   * @see Requirement 7.2
   */
  get replyCountText(): string {
    const displayCount = this.internalReplyCount > 999 ? '999+' : this.internalReplyCount;
    if (this.internalReplyCount === 1) {
      return `${displayCount} ${CometChatLocalize.getLocalizedString('thread_reply')}`;
    }
    return `${displayCount} ${CometChatLocalize.getLocalizedString('thread_replies')}`;
  }

  /**
   * Gets the accessible label for the header.
   * Combines parent message preview and reply count.
   * @see Requirement 14.6
   */
  get ariaLabel(): string {
    const preview = this.messagePreview;
    const count = this.internalReplyCount > 999 ? '999+' : this.internalReplyCount.toString();
    return CometChatLocalize.getLocalizedString('accessibility_thread_header')
      .replace('{preview}', preview)
      .replace('{count}', count);
  }

  /**
   * Gets the accessible label for the close button.
   * @see Requirement 14.5
   */
  get closeButtonAriaLabel(): string {
    return CometChatLocalize.getLocalizedString('accessibility_close_thread');
  }

  /**
   * @deprecated Use closeButtonAriaLabel instead.
   */
  get backButtonAriaLabel(): string {
    return this.closeButtonAriaLabel;
  }

  /**
   * Checks if the parent message is a media type.
   */
  get isMediaMessage(): boolean {
    return this.mediaIcon !== null;
  }

  /**
   * Gets the sender name of the parent message.
   */
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
    this.messageListenerId = `thread_header_${Date.now()}`;
    this.subscribeToMessageEvents();
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
      this.unsubscribeAll();
      this.removeSdkListener();
      this.subscribeToMessageEvents();
      this.attachSdkListener();
    }
  }

  ngOnDestroy(): void {
    this.unsubscribeAll();
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
    this.subscriptions.push(
      CometChatMessageEvents.ccMessageSent.subscribe((data: IMessages) => {
        if (
          data.status === MessageStatus.success &&
          data.message?.getParentMessageId() === parentId
        ) {
          this.incrementReplyCount(data.message);
        }
      })
    );
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

  /**
   * Unsubscribe from all UI event subscriptions.
   */
  private unsubscribeAll(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
  }
}
