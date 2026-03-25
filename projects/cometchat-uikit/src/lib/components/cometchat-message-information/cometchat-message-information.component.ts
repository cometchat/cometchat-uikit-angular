/**
 * CometChatMessageInformation Component
 *
 * A panel component for displaying detailed message information including
 * delivery and read receipts with user avatars, names, and timestamps.
 *
 * Features:
 * - Displays message content preview
 * - Shows sent timestamp
 * - Displays delivery receipts with timestamps
 * - Displays read receipts with timestamps
 * - Shows user avatars and names for group messages
 * - Supports pagination for large groups
 * - Keyboard accessible close button
 * - Uses localization for all text
 *
 * @example
 * ```html
 * <cometchat-message-information
 *   [message]="selectedMessage"
 *   [dateTimeFormat]="customDateFormat"
 *   (closeClick)="onClosePanel()">
 * </cometchat-message-information>
 * ```
 *
 * @see Requirement 8.1 - Display message content
 * @see Requirement 8.2 - Display sent timestamp
 * @see Requirement 8.3 - Display delivery receipts with timestamps
 * @see Requirement 8.4 - Display read receipts with timestamps
 * @see Requirement 8.5 - Display user avatars and names for group messages
 * @see Requirement 8.6 - Support pagination for large groups
 * @see Requirement 8.7 - Accessible via message options menu
 * @see Requirement 8.8 - Use messageInfoDateTimeFormat for timestamps
 */
import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  OnInit,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ChangeDetectionStrategy,
  computed,
  ElementRef,
  inject,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatAvatarComponent } from '../base-elements/cometchat-avatar';
import { CometChatDateComponent } from '../base-elements/cometchat-date';
import { CometChatMessageBubbleComponent } from '../cometchat-message-bubble';
import { TranslatePipe } from '../../resources/CometChatLocalize/translate.pipe';
import { CometChatLocalize } from '../../resources/CometChatLocalize/cometchat-localize';
import { CalendarObject } from '../../resources/CometChatLocalize/localization.interfaces';
import { MessageBubbleAlignment } from '../../Enums/Enums';
import { CometChatTextFormatter } from '../../formatters/cometchat-text-formatter';
import { FocusTrapService } from '../../services/focus-trap.service';
import { COMETCHAT_GLOBAL_CONFIG, GlobalConfig } from '../../services/global-config.service';
import { CometChatLogger } from '../../utils/CometChatLogger';

/** Maximum characters for message preview truncation */
const MAX_PREVIEW_LENGTH = 100;

/**
 * Interface for receipt information with user details.
 */
interface ReceiptInfo {
  /** The user who received/read the message */
  user: CometChat.User;
  /** Timestamp when the action occurred (Unix timestamp in seconds) */
  timestamp: number;
}

/**
 * Interface for combined user receipt information (for group messages).
 * Shows both read and delivered timestamps for a single user.
 */
export interface UserReceiptInfo {
  /** The user who received/read the message */
  user: CometChat.User;
  /** Timestamp when the message was read (Unix timestamp in seconds), 0 if not read */
  readAt: number;
  /** Timestamp when the message was delivered (Unix timestamp in seconds), 0 if not delivered */
  deliveredAt: number;
}

/**
 * CometChatMessageInformationComponent displays detailed message information
 * including delivery and read receipts.
 *
 * @see Requirement 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8
 */
@Component({
  selector: 'cometchat-message-information',
  standalone: true,
  imports: [
    CommonModule,
    CometChatAvatarComponent,
    CometChatDateComponent,
    CometChatMessageBubbleComponent,
    TranslatePipe,
  ],
  templateUrl: './cometchat-message-information.component.html',
  styleUrls: ['./cometchat-message-information.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CometChatMessageInformationComponent implements OnInit, OnChanges, OnDestroy {
  /** @internal Timer references for cleanup */
  private pendingTimers: ReturnType<typeof setTimeout>[] = [];

  // ==================== Injected Services ====================

  private elementRef = inject(ElementRef);
  private focusTrapService = inject(FocusTrapService);
  private datePipe = new DatePipe('en-US');
  private globalConfig: Partial<GlobalConfig> | null = inject(COMETCHAT_GLOBAL_CONFIG, {
    optional: true,
  });

  // ==================== ExplicitlySet Flags & Backing Fields (GlobalConfig Priority System) ====================
  private textFormattersExplicitlySet = signal(false);
  private _textFormatters = signal<CometChatTextFormatter[]>([]);

  // ==================== Inputs ====================

  /**
   * The message to show information for.
   * @see Requirement 8.1
   */
  @Input() message!: CometChat.BaseMessage;

  /**
   * Date format for timestamps.
   * @see Requirement 8.8
   */
  @Input() dateTimeFormat?: CalendarObject;

  /**
   * Text formatters for processing message text content.
   * If not provided, default formatters will be used.
   */
  @Input()
  set textFormatters(value: CometChatTextFormatter[]) {
    this._textFormatters.set(value);
    this.textFormattersExplicitlySet.set(true);
  }
  get textFormatters(): CometChatTextFormatter[] {
    return this._textFormatters();
  }

  /**
   * Mock receipts for Storybook/testing purposes.
   * When provided, these receipts are used instead of fetching from SDK.
   * Each entry contains a user with their read and delivered timestamps.
   */
  @Input() mockReceipts?: UserReceiptInfo[];

  /**
   * Whether to show the scrollbar in the content area.
   * When false (default), the scrollbar is hidden but scrolling still works.
   */
  @Input() showScrollbar = false;

  // ==================== Outputs ====================

  /**
   * Emitted when the panel close button is clicked.
   * @see Requirement 8.7
   */
  @Output() closeClick = new EventEmitter<void>();

  // ==================== Effective Values (GlobalConfig Priority System) ====================

  /**
   * Resolved textFormatters value using 3-tier priority:
   * 1. Explicitly set @Input value
   * 2. GlobalConfig value (if defined)
   * 3. Component default ([])
   */
  effectiveTextFormatters = computed(() => {
    if (this.textFormattersExplicitlySet()) return this._textFormatters();
    if (this.globalConfig?.textFormatters !== undefined) return this.globalConfig.textFormatters;
    return [];
  });

  // ==================== Signals ====================

  /**
   * Combined user receipts for group messages.
   * Each entry contains a user with both read and delivered timestamps.
   * @see Requirement 8.3, 8.4, 8.5
   */
  userReceipts = signal<UserReceiptInfo[]>([]);

  /**
   * Delivery receipts signal (legacy, kept for backward compatibility).
   * @see Requirement 8.3
   */
  deliveryReceipts = signal<ReceiptInfo[]>([]);

  /**
   * Read receipts signal (legacy, kept for backward compatibility).
   * @see Requirement 8.4
   */
  readReceipts = signal<ReceiptInfo[]>([]);

  /**
   * Loading state signal.
   */
  isLoading = signal<boolean>(false);

  /**
   * Error state signal.
   */
  hasError = signal<boolean>(false);

  /**
   * Whether there are more receipts to fetch.
   */
  hasMoreReceipts = signal<boolean>(true);

  /**
   * Read timestamp for 1-on-1 messages (Unix timestamp in seconds).
   */
  oneOnOneReadAt = signal<number>(0);

  /**
   * Delivered timestamp for 1-on-1 messages (Unix timestamp in seconds).
   */
  oneOnOneDeliveredAt = signal<number>(0);

  // ==================== Private Properties ====================

  /**
   * Current logged-in user UID.
   */
  private loggedInUserUid = '';

  // ==================== Computed Properties ====================

  /**
   * Gets the default date format for timestamps in receipt sections.
   * @see Requirement 8.8
   */
  get effectiveDateFormat(): CalendarObject {
    return (
      this.dateTimeFormat || {
        today: 'hh:mm A',
        yesterday: '[Yesterday] hh:mm A',
        otherDays: 'DD/MM/YYYY hh:mm A',
      }
    );
  }

  /**
   * Gets the date format for the message bubble (time only).
   */
  get messageBubbleDateFormat(): CalendarObject {
    return {
      today: 'hh:mm A',
      yesterday: 'hh:mm A',
      otherDays: 'hh:mm A',
    };
  }

  /**
   * Gets the truncated message preview.
   * @see Requirement 8.1
   */
  get messagePreview(): string {
    if (!this.message) {
      return '';
    }

    const messageType = this.message.getType();

    // Handle text messages
    if (messageType === CometChat.MESSAGE_TYPE.TEXT) {
      const textMessage = this.message as CometChat.TextMessage;
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
        return CometChatLocalize.getLocalizedString('message');
    }
  }

  /**
   * Gets the icon URL for media messages.
   */
  get mediaIcon(): string | null {
    if (!this.message) {
      return null;
    }

    const messageType = this.message.getType();

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
   * Checks if the message is a media type.
   */
  get isMediaMessage(): boolean {
    return this.mediaIcon !== null;
  }

  /**
   * Gets the sent timestamp.
   * @see Requirement 8.2
   */
  get sentTimestamp(): number {
    return this.message?.getSentAt() || 0;
  }

  /**
   * Checks if this is a group message.
   * @see Requirement 8.5
   */
  get isGroupMessage(): boolean {
    return this.message?.getReceiverType() === CometChat.RECEIVER_TYPE.GROUP;
  }

  /**
   * Gets the accessible label for the panel.
   */
  get ariaLabel(): string {
    return CometChatLocalize.getLocalizedString('message_information_title');
  }

  /**
   * Gets the accessible label for the close button.
   */
  get closeButtonAriaLabel(): string {
    return CometChatLocalize.getLocalizedString('message_information_close_hover');
  }

  /**
   * Gets the message bubble alignment based on sender.
   * Returns 'right' for logged-in user's messages, 'left' for others.
   */
  get messageBubbleAlignment(): MessageBubbleAlignment {
    if (!this.message || !this.loggedInUserUid) {
      return MessageBubbleAlignment.left;
    }

    const senderId = this.message.getSender()?.getUid();
    return senderId == this.loggedInUserUid
      ? MessageBubbleAlignment.right
      : MessageBubbleAlignment.left;
  }

  // ==================== Lifecycle Hooks ====================

  ngOnInit(): void {
    this.initializeLoggedInUser();

    // Activate focus trap for modal behavior
    this.pendingTimers.push(setTimeout(() => {
      this.focusTrapService.activate({
        container: this.elementRef.nativeElement,
        initialFocus: 'first',
        returnFocusOnDeactivate: true,
      });
    }, 0));
  }

  ngOnDestroy(): void {
    this.pendingTimers.forEach(t => clearTimeout(t));
    this.pendingTimers = [];
    // Deactivate focus trap when component is destroyed
    this.focusTrapService.deactivate(this.elementRef.nativeElement);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['message'] && this.message) {
      this.resetAndFetchReceipts();
    }
  }

  // ==================== Private Methods ====================

  /**
   * Initializes the logged-in user UID.
   */
  private async initializeLoggedInUser(): Promise<void> {
    try {
      const user = await CometChat.getLoggedinUser();
      if (user) {
        this.loggedInUserUid = user.getUid();
      }
    } catch (error) {
      CometChatLogger.error('CometChatMessageInformation', 'Error getting logged-in user:', error);
    }
  }

  /**
   * Resets state and fetches receipts for the message.
   */
  private resetAndFetchReceipts(): void {
    this.userReceipts.set([]);
    this.deliveryReceipts.set([]);
    this.readReceipts.set([]);
    this.oneOnOneReadAt.set(0);
    this.oneOnOneDeliveredAt.set(0);
    this.hasMoreReceipts.set(true);
    this.hasError.set(false);

    // If mock receipts are provided (for Storybook/testing), use them directly
    if (this.mockReceipts && this.mockReceipts.length > 0) {
      this.userReceipts.set(this.mockReceipts);
      this.hasMoreReceipts.set(false);
      this.isLoading.set(false);
      return;
    }

    this.fetchReceipts();
  }

  /**
   * Fetches message receipts.
   * @see Requirement 8.3, 8.4, 8.5, 8.6
   */
  async fetchReceipts(): Promise<void> {
    if (!this.message || this.isLoading() || !this.hasMoreReceipts()) {
      return;
    }

    this.isLoading.set(true);
    this.hasError.set(false);

    try {
      const messageId = this.message.getId();

      // For group messages, fetch receipts using the SDK
      if (this.isGroupMessage) {
        await this.fetchGroupMessageReceipts(messageId);
      } else {
        // For 1-on-1 messages, use the message's delivery/read timestamps
        this.processOneOnOneReceipts();
      }
    } catch (error) {
      CometChatLogger.error('CometChatMessageInformation', 'Error fetching receipts:', error);
      this.hasError.set(true);
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Fetches receipts for group messages using the SDK.
   * @see Requirement 8.5, 8.6
   */
  private async fetchGroupMessageReceipts(messageId: number): Promise<void> {
    try {
      // Fetch message receipts using the SDK
      const receiptsResponse = await CometChat.getMessageReceipts(messageId);

      // Cast to array of MessageReceipt
      const receipts = receiptsResponse as CometChat.MessageReceipt[];

      if (!receipts || !Array.isArray(receipts) || receipts.length === 0) {
        this.hasMoreReceipts.set(false);
        return;
      }

      // Process and combine receipts per user
      const userReceiptMap = new Map<string, UserReceiptInfo>();

      for (const receipt of receipts) {
        const sender = receipt.getSender();

        // Skip if no sender or if it's the logged-in user's own receipts
        if (!sender || sender.getUid() === this.loggedInUserUid) {
          continue;
        }

        const uid = sender.getUid();
        const readAt = receipt.getReadAt() || 0;
        const deliveredAt = receipt.getDeliveredAt() || 0;

        // Get or create user receipt entry
        const existing = userReceiptMap.get(uid);
        if (existing) {
          // Update with latest timestamps
          if (readAt > existing.readAt) existing.readAt = readAt;
          if (deliveredAt > existing.deliveredAt) existing.deliveredAt = deliveredAt;
        } else {
          userReceiptMap.set(uid, {
            user: sender,
            readAt,
            deliveredAt,
          });
        }
      }

      // Convert map to array and update signal
      const userReceiptList = Array.from(userReceiptMap.values());
      this.userReceipts.set([...this.userReceipts(), ...userReceiptList]);

      // For getMessageReceipts, pagination is not supported - all receipts are returned at once
      this.hasMoreReceipts.set(false);
    } catch (error) {
      CometChatLogger.error('CometChatMessageInformation', 'Error fetching group receipts:', error);
      throw error;
    }
  }

  /**
   * Processes receipts for 1-on-1 messages.
   * Uses the message's built-in readAt/deliveredAt timestamps.
   */
  private processOneOnOneReceipts(): void {
    const deliveredAt = this.message.getDeliveredAt();
    const readAt = this.message.getReadAt();

    this.oneOnOneReadAt.set(readAt || 0);
    this.oneOnOneDeliveredAt.set(deliveredAt || 0);
    this.hasMoreReceipts.set(false);
  }

  // ==================== Event Handlers ====================

  /**
   * Handles keyboard events for the panel.
   * Closes the panel when Escape is pressed.
   * @see Requirement 16.2
   */
  onPanelKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.onCloseClick();
    }
  }

  /**
   * Handles close button click.
   */
  onCloseClick(): void {
    this.closeClick.emit();
  }

  /**
   * Handles keyboard events for the close button.
   */
  onCloseKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.onCloseClick();
    }
  }

  /**
   * Handles scroll event for pagination.
   * @see Requirement 8.6
   */
  onScroll(event: Event): void {
    const element = event.target as HTMLElement;
    const scrollBottom = element.scrollHeight - element.scrollTop - element.clientHeight;

    if (scrollBottom < 50 && !this.isLoading() && this.hasMoreReceipts()) {
      this.fetchReceipts();
    }
  }

  /**
   * Retries fetching receipts after an error.
   */
  retry(): void {
    this.hasError.set(false);
    this.fetchReceipts();
  }

  // ==================== Accessibility Methods ====================

  /**
   * Gets the aria-label for a receipt item.
   * Combines the receipt type (delivered/read), user name, and timestamp.
   * @see Requirement 16.6
   */
  getReceiptAriaLabel(receipt: ReceiptInfo, type: 'delivered' | 'read'): string {
    const userName = receipt.user.getName();
    const timestamp = this.formatTimestampForAccessibility(receipt.timestamp);

    if (type === 'read') {
      return CometChatLocalize.getLocalizedString('accessibility_read_by_user')
        .replace('{name}', userName)
        .replace('{time}', timestamp);
    }

    return CometChatLocalize.getLocalizedString('accessibility_delivered_to_user')
      .replace('{name}', userName)
      .replace('{time}', timestamp);
  }

  /**
   * Formats a timestamp for accessibility announcements.
   */
  private formatTimestampForAccessibility(timestamp: number): string {
    // Convert Unix timestamp (seconds) to milliseconds for Date
    const date = new Date(timestamp * 1000);
    return this.datePipe.transform(date, 'medium') || '';
  }

  // ==================== TrackBy Functions ====================

  /**
   * TrackBy function for receipt items.
   */
  trackByReceipt(index: number, receipt: ReceiptInfo): string {
    return `${receipt.user.getUid()}-${receipt.timestamp}`;
  }

  /**
   * TrackBy function for user receipt items.
   */
  trackByUserReceipt(index: number, receipt: UserReceiptInfo): string {
    return receipt.user.getUid();
  }
}
