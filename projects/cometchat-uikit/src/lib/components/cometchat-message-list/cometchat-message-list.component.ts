/**
 * CometChatMessageList Component
 *
 * A comprehensive component that displays a real-time list of messages
 * for the active conversation. This component consumes the MessageListService
 * for data management and provides a rich, performant UI with virtualization,
 * infinite scrolling, date separators, and scroll-to-bottom functionality.
 *
 * ## Read and Delivery Receipt Handling
 *
 * This component implements intelligent read receipt marking with the following behavior:
 *
 * ### Initial Load
 * - Automatically marks all unread receiver messages as read on initial load
 * - Uses a single SDK call with the latest message for optimization
 * - Updates all unread messages locally without additional SDK calls
 *
 * ### Real-time Messages
 * - **At bottom**: New messages are immediately marked as read
 * - **Not at bottom**: New messages increment the unread count
 * - Unread count is displayed on the scroll-to-bottom button
 *
 * ### Scroll Behavior
 * - When user scrolls to bottom, all unread messages are marked as read
 * - Single SDK call with the latest message for optimization
 * - Unread count is cleared and conversations component is notified
 *
 * ### Sender vs Receiver Classification
 * - Only receiver messages (from other users) are marked as read
 * - Sender messages (from logged-in user) are never marked as read
 * - Classification is based on comparing sender UID with logged-in user UID
 *
 * ### Event Synchronization
 * - Emits `ccMessageRead` event when messages are marked as read
 * - Conversations component subscribes to ccMessageRead for UI updates
 *
 * ### Error Handling
 * - Receipt errors are logged but don't disrupt user experience
 * - Retry logic with exponential backoff for transient failures
 * - Safe wrappers for scroll position detection and event emission
 *
 * @module components/cometchat-message-list
 * @see Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7
 */
import {
  Component,
  Input,
  Output,
  EventEmitter,
  TemplateRef,
  ViewChild,
  ElementRef,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnInit,
  OnDestroy,
  OnChanges,
  AfterViewInit,
  SimpleChanges,
  signal,
  computed,
  effect,
  Signal,
  inject,
  DestroyRef,
  booleanAttribute,
  Injector,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';
import { CometChat } from '@cometchat/chat-sdk-javascript';

// Component imports
import { CometChatMessageBubbleComponent } from '../cometchat-message-bubble/cometchat-message-bubble.component';
import { CometChatDateComponent } from '../base-elements/cometchat-date/cometchat-date.component';
import { CometChatButtonComponent } from '../base-elements/cometchat-button/cometchat-button.component';
import { CometChatSmartRepliesComponent } from '../base-elements/cometchat-smart-replies/cometchat-smart-replies.component';
import { CometChatConversationStarterComponent } from '../base-elements/cometchat-conversation-starter/cometchat-conversation-starter.component';
import { CometChatConversationSummaryComponent } from '../base-elements/cometchat-conversation-summary/cometchat-conversation-summary.component';
import { CometChatConfirmDialogComponent } from '../base-elements/cometchat-confirm-dialog/cometchat-confirm-dialog.component';
import { CometChatFlagMessageDialogComponent } from '../base-elements/cometchat-flag-message-dialog/cometchat-flag-message-dialog.component';
import { CometChatMessageInformationComponent } from '../cometchat-message-information/cometchat-message-information.component';
import { CometChatEmojiKeyboardComponent } from '../base-elements/cometchat-emoji-keyboard/cometchat-emoji-keyboard.component';
import {
  CometChatErrorBoundaryComponent,
  ErrorContext,
} from '../base-elements/cometchat-error-boundary/cometchat-error-boundary.component';
import { ContextMenuItem } from '../base-elements/cometchat-context-menu/cometchat-context-menu.component';

// Service imports
import { MessageListService } from '../../services/message-list.service';
import { ChatStateService } from '../../services/chat-state.service';
import { CometChatTemplatesService } from '../../services/templates.service';
import { CometChatToastComponent, ToastType } from '../base-elements/cometchat-toast/cometchat-toast.component';
import { FormatterConfigService } from '../../services/formatter-config.service';
import { ListNavigationService } from '../../services/list-navigation.service';
import { LiveAnnouncerService } from '../../services/live-announcer.service';
import { FocusTrapService } from '../../services/focus-trap.service';
import { COMETCHAT_GLOBAL_CONFIG, GlobalConfig } from '../../services/global-config.service';

// Resource imports
import { CometChatSoundManager } from '../../resources/CometChatSoundManager/CometChatSoundManager';
import { CometChatLocalize } from '../../resources/CometChatLocalize/cometchat-localize';
import { TranslatePipe } from '../../resources/CometChatLocalize/translate.pipe';
import { CometChatLogger } from '../../utils/CometChatLogger';

// Type imports
import {
  States,
  MessageListAlignment,
  MessageBubbleAlignment,
  MessageStatus,
  Placement,
  PanelAlignment,
} from '../../Enums/Enums';
import { CalendarObject } from '../../resources/CometChatLocalize/localization.interfaces';
import { CometChatTextFormatter } from '../../formatters/cometchat-text-formatter';
import { CometChatMentionsFormatter } from '../../formatters/cometchat-mentions-formatter';
import { CometChatUIKitConstants } from '../../constants';
import { CometChatActionsIcon } from '../../modals/CometChatActionsIcon';

// Event imports
import { CometChatMessageEvents, IMessages } from '../../events/CometChatMessageEvents';
import {
  CometChatUIEvents,
  IDialog,
  IPanel,
  IShowOngoingCall,
} from '../../events/CometChatUIEvents';
import {
  CometChatGroupEvents,
  IGroupLeft,
  IGroupMemberAdded,
  IGroupMemberKickedBanned,
  IGroupMemberScopeChanged,
  IOwnershipChanged,
} from '../../events/CometChatGroupEvents';
import { CometChatCallEvents } from '../../events/CometChatCallEvents';

/**
 * Represents an item in the message list.
 * Can be either a message or a date separator.
 */
export interface MessageListItem {
  /** Type of the item */
  type: 'message' | 'date-separator';
  /** The message object (only for type 'message') */
  message?: CometChat.BaseMessage;
  /** The date timestamp (only for type 'date-separator') */
  date?: number;
  /** Unique key for tracking */
  key: string;
}

/**
 * CometChatMessageList is a component that displays a real-time list of messages
 * for the active conversation. It delegates data management to MessageListService
 * while providing a rich UI with infinite scrolling, date separators, and
 * scroll-to-bottom functionality.
 *
 * @example
 * ```html
 * <cometchat-message-list
 *   [user]="activeUser"
 *   [scrollToBottomOnNewMessages]="true"
 *   (threadRepliesClick)="handleThreadClick($event)">
 * </cometchat-message-list>
 * ```
 */
@Component({
  selector: 'cometchat-message-list',
  standalone: true,
  imports: [
    CommonModule,
    CometChatMessageBubbleComponent,
    CometChatDateComponent,
    CometChatButtonComponent,
    CometChatSmartRepliesComponent,
    CometChatConversationStarterComponent,
    CometChatConversationSummaryComponent,
    CometChatConfirmDialogComponent,
    CometChatFlagMessageDialogComponent,
    CometChatMessageInformationComponent,
    CometChatEmojiKeyboardComponent,
    CometChatErrorBoundaryComponent,
    CometChatToastComponent,
    TranslatePipe,
  ],
  templateUrl: './cometchat-message-list.component.html',
  styleUrls: ['./cometchat-message-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [MessageListService],
})
export class CometChatMessageListComponent implements OnInit, OnDestroy, OnChanges, AfterViewInit {
  // ==================== Shared Constants ====================
  readonly shimmerList = CometChatUIKitConstants.shimmerList;

  // ==================== Service Injection ====================
  private messageListService = inject(MessageListService);
  private chatStateService = inject(ChatStateService);
  private templatesService = inject(CometChatTemplatesService);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);
  private injector = inject(Injector);
  private formatterConfigService = inject(FormatterConfigService);
  private listNavigationService = inject(ListNavigationService);
  private liveAnnouncer = inject(LiveAnnouncerService);
  private focusTrapService = inject(FocusTrapService);

  // Global config injected via token (static configuration)
  private globalConfig: Partial<GlobalConfig> | null = inject(COMETCHAT_GLOBAL_CONFIG, {
    optional: true,
  });

  // ==================== ExplicitlySet Flags & Backing Fields (GlobalConfig Priority System) ====================
  // Track if @Input was explicitly set (for global config priority system)
  private showScrollbarExplicitlySet = signal(false);
  private hideErrorExplicitlySet = signal(false);
  private hideReceiptsExplicitlySet = signal(false);
  private disableSoundForMessagesExplicitlySet = signal(false);
  private textFormattersExplicitlySet = signal(false);
  private hideAvatarExplicitlySet = signal(false);
  private customSoundForMessagesExplicitlySet = signal(false);
  private hideModerationViewExplicitlySet = signal(false);

  // Private backing fields for tracked @Input properties
  private _showScrollbar = signal(false);
  private _hideError = signal(false);
  private _hideReceipts = signal(false);
  private _disableSoundForMessages = signal(false);
  private _textFormatters = signal<CometChatTextFormatter[]>([]);
  private _hideAvatar = signal(false);
  private _customSoundForMessages = signal('');
  private _hideModerationView = signal(false);

  // ==================== Data Configuration Inputs ====================
  /**
   * User for 1-on-1 conversations.
   * @see Requirement 2.1
   */
  @Input() user?: CometChat.User;

  /**
   * Group for group conversations.
   * @see Requirement 2.2
   */
  @Input() group?: CometChat.Group;

  /**
   * Parent message ID for thread mode.
   * @see Requirement 2.3
   */
  @Input() parentMessageId?: number;

  /**
   * Custom messages request builder for advanced configuration.
   * @see Requirement 2.4
   */
  @Input() messagesRequestBuilder?: CometChat.MessagesRequestBuilder;

  /**
   * Custom reactions request builder for advanced configuration.
   * @see Requirement 2.5
   */
  @Input() reactionsRequestBuilder?: CometChat.ReactionsRequestBuilder;

  /**
   * Text formatters for processing message text content.
   * @see Requirement 2.7
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
   * Message alignment mode: 'left' or 'standard'.
   * @see Requirement 2.8
   */
  @Input() messageAlignment: MessageListAlignment = MessageListAlignment.standard;

  /**
   * Whether to auto-scroll to bottom when new messages arrive.
   * @see Requirement 2.9
   */
  @Input({ transform: booleanAttribute }) scrollToBottomOnNewMessages = false;

  /**
   * Number of quick options to show in message bubble.
   * @see Requirement 2.10
   */
  @Input() quickOptionsCount = 3;

  /**
   * Whether to disable sound notifications for new messages.
   * @see Requirement 2.11
   */
  @Input({ transform: booleanAttribute })
  set disableSoundForMessages(value: boolean) {
    this._disableSoundForMessages.set(value);
    this.disableSoundForMessagesExplicitlySet.set(true);
  }
  get disableSoundForMessages(): boolean {
    return this._disableSoundForMessages();
  }

  /**
   * Custom sound URL for message notifications.
   * @see Requirement 2.12
   */
  @Input()
  set customSoundForMessages(value: string) {
    this._customSoundForMessages.set(value);
    this.customSoundForMessagesExplicitlySet.set(true);
  }
  get customSoundForMessages(): string {
    return this._customSoundForMessages();
  }

  /**
   * Message ID to scroll to on load.
   * @see Requirement 2.13
   */
  @Input() goToMessageId?: string;

  /**
   * Whether to show the scrollbar.
   * @see Requirement 2.14
   */
  @Input({ transform: booleanAttribute })
  set showScrollbar(value: boolean) {
    this._showScrollbar.set(value);
    this.showScrollbarExplicitlySet.set(true);
  }
  get showScrollbar(): boolean {
    return this._showScrollbar();
  }

  // ==================== Hide/Show Control Inputs ====================
  /**
   * Hide delivery/read receipts.
   * @see Requirement 3.1
   */
  @Input({ transform: booleanAttribute })
  set hideReceipts(value: boolean) {
    this._hideReceipts.set(value);
    this.hideReceiptsExplicitlySet.set(true);
  }
  get hideReceipts(): boolean {
    return this._hideReceipts();
  }

  /**
   * Hide date separators between messages.
   * @see Requirement 3.2
   */
  @Input({ transform: booleanAttribute }) hideDateSeparator = false;

  /**
   * Hide the sticky date header.
   * @see Requirement 3.3
   */
  @Input({ transform: booleanAttribute }) hideStickyDate = false;

  /**
   * Hide user avatars.
   * @see Requirement 3.4
   */
  @Input({ transform: booleanAttribute })
  set hideAvatar(value: boolean) {
    this._hideAvatar.set(value);
    this.hideAvatarExplicitlySet.set(true);
  }
  get hideAvatar(): boolean {
    return this._hideAvatar();
  }

  /**
   * Hide group action messages.
   * @see Requirement 3.5
   */
  @Input({ transform: booleanAttribute }) hideGroupActionMessages = false;

  /**
   * Hide error views.
   * @see Requirement 3.6
   */
  @Input({ transform: booleanAttribute })
  set hideError(value: boolean) {
    this._hideError.set(value);
    this.hideErrorExplicitlySet.set(true);
  }
  get hideError(): boolean {
    return this._hideError();
  }

  /**
   * Hide reply in thread option.
   * @see Requirement 3.7
   */
  @Input({ transform: booleanAttribute }) hideReplyInThreadOption = false;

  /**
   * Hide translate message option.
   * @see Requirement 3.9
   */
  @Input({ transform: booleanAttribute }) hideTranslateMessageOption = false;

  /**
   * Hide edit message option.
   * @see Requirement 3.10
   */
  @Input({ transform: booleanAttribute }) hideEditMessageOption = false;

  /**
   * Hide delete message option.
   * @see Requirement 3.11
   */
  @Input({ transform: booleanAttribute }) hideDeleteMessageOption = false;

  /**
   * Hide reaction option.
   * @see Requirement 3.12
   */
  @Input({ transform: booleanAttribute }) hideReactionOption = false;

  /**
   * Hide message privately option.
   * @see Requirement 3.13
   */
  @Input({ transform: booleanAttribute }) hideMessagePrivatelyOption = false;

  /**
   * Hide copy message option.
   * @see Requirement 3.14
   */
  @Input({ transform: booleanAttribute }) hideCopyMessageOption = false;

  /**
   * Hide message info option.
   * @see Requirement 3.15
   */
  @Input({ transform: booleanAttribute }) hideMessageInfoOption = false;

  /**
   * Additional message options appended to the built-in options for every message.
   * These are added after the default options (react, thread, copy, edit, delete, etc.).
   *
   * @example
   * ```typescript
   * additionalOptions = [
   *   new CometChatActionsIcon({ id: 'bookmark', title: 'Bookmark', iconURL: '', onClick: () => {} }),
   * ];
   * ```
   */
  @Input() additionalOptions: CometChatActionsIcon[] = [];

  /**
   * Callback to completely override the options for a specific message.
   * Receives the message and the default options array; returns the final options array.
   * When provided, the return value replaces the default options entirely.
   *
   * @example
   * ```typescript
   * optionsOverride = (message, defaultOptions) => {
   *   if (message.getType() === 'text') return [...defaultOptions, myCustomOption];
   *   return defaultOptions;
   * };
   * ```
   */
  @Input() optionsOverride?: (
    message: CometChat.BaseMessage,
    defaultOptions: CometChatActionsIcon[]
  ) => CometChatActionsIcon[];

  /**
   * Hide moderation status indicators on messages.
   * When false, moderation status will be displayed on messages.
   * @see Requirement 9.7
   */
  @Input({ transform: booleanAttribute })
  set hideModerationView(value: boolean) {
    this._hideModerationView.set(value);
    this.hideModerationViewExplicitlySet.set(true);
  }
  get hideModerationView(): boolean {
    return this._hideModerationView();
  }

  /**
   * @future Hide the remark input field in the flag message dialog.
   * This feature is not yet available and will be implemented in a future release.
   * @todo Implement flag remark field visibility control
   */
  @Input({ transform: booleanAttribute }) hideFlagRemarkField: boolean = false;

  /**
   * @future Hide the "Flag Message" option from the message context menu.
   * This feature is not yet available and will be implemented in a future release.
   * @todo Implement flag message option visibility control
   */
  @Input({ transform: booleanAttribute }) hideFlagMessageOption: boolean = false;

  /**
   * @future Hide the "Reply" option from the message context menu.
   * This feature is not yet available and will be implemented in a future release.
   * @todo Implement reply option visibility control
   */
  @Input({ transform: booleanAttribute }) hideReplyOption: boolean = false;

  /**
   * Disable all interactive behaviour on message bubbles (context menu, fullscreen, reactions, etc.).
   * Useful in Storybook or preview contexts where interaction is not desired.
   * @default false
   */
  @Input({ transform: booleanAttribute }) disableInteraction = false;

  // ==================== Custom View Inputs ====================
  /**
   * Custom template for empty state.
   * @see Requirement 4.1
   */
  @Input() emptyView?: TemplateRef<any>;

  /**
   * Custom template for error state.
   * @see Requirement 4.2
   */
  @Input() errorView?: TemplateRef<any>;

  /**
   * Custom template for loading state.
   * @see Requirement 4.3
   */
  @Input() loadingView?: TemplateRef<any>;

  /**
   * Custom template for header.
   * @see Requirement 4.4
   */
  @Input() headerView?: TemplateRef<any>;

  /**
   * Custom template for footer.
   * @see Requirement 4.5
   */
  @Input() footerView?: TemplateRef<any>;

  // ==================== Standardised Template Slot Inputs (Property 6 / Req 3.2) ====================
  /** Custom template for each list item (message bubble). */
  @Input() listItemTemplate: TemplateRef<any> | null = null;
  /** Custom template for the empty state. Alias for `emptyView`. */
  @Input() emptyStateTemplate: TemplateRef<any> | null = null;
  /** Custom template for the error state. Alias for `errorView`. */
  @Input() errorStateTemplate: TemplateRef<any> | null = null;
  /** Custom template for the loading state. Alias for `loadingView`. */
  @Input() loadingStateTemplate: TemplateRef<any> | null = null;

  // ==================== Date Format Inputs ====================
  /**
   * Date format for date separators.
   * @see Requirement 5.1
   */
  @Input() separatorDateTimeFormat?: CalendarObject;

  /**
   * Date format for sticky date header.
   * @see Requirement 5.2
   */
  @Input() stickyDateTimeFormat?: CalendarObject;

  /**
   * Date format for message timestamps.
   * @see Requirement 5.3
   */
  @Input() messageSentAtDateTimeFormat?: CalendarObject;

  /**
   * Date format for message info timestamps.
   * @see Requirement 5.4
   */
  @Input() messageInfoDateTimeFormat?: CalendarObject;

  // ==================== AI Feature Inputs ====================
  /**
   * Whether to show conversation starters.
   * @see Requirement 15.1
   */
  @Input({ transform: booleanAttribute }) showConversationStarters = false;

  /**
   * Whether to show smart replies.
   * @see Requirement 15.2
   */
  @Input({ transform: booleanAttribute }) showSmartReplies = false;

  /**
   * Keywords that trigger smart replies.
   * @see Requirement 15.3
   */
  @Input() smartRepliesKeywords: string[] = ['what', 'when', 'why', 'who', 'where', 'how', '?'];

  /**
   * Delay duration for smart replies in milliseconds.
   * @see Requirement 15.4
   */
  @Input() smartRepliesDelayDuration = 10000;

  // ==================== Output Events ====================
  /**
   * Emitted when an error occurs.
   * @see Requirement 6.1
   */
  @Output() error = new EventEmitter<CometChat.CometChatException>();

  /**
   * Emitted when thread replies are clicked.
   * @see Requirement 6.2
   */
  @Output() threadRepliesClick = new EventEmitter<CometChat.BaseMessage>();

  /**
   * Emitted when a reaction is clicked.
   * @see Requirement 6.3
   */
  @Output() reactionClick = new EventEmitter<{
    reaction: CometChat.ReactionCount;
    message: CometChat.BaseMessage;
  }>();

  /**
   * Emitted when a reaction list item is clicked.
   * @see Requirement 6.4
   */
  @Output() reactionListItemClick = new EventEmitter<{
    reaction: CometChat.Reaction;
    message: CometChat.BaseMessage;
  }>();

  /**
   * Emitted when a smart reply is clicked.
   * The event payload is the reply text that was clicked.
   * @see Requirement 2.6
   */
  @Output() smartReplyClick = new EventEmitter<string>();

  /**
   * Emitted when a conversation starter is clicked.
   * The event payload is the starter text that was clicked.
   * @see Requirement 3.3
   */
  @Output() conversationStarterClick = new EventEmitter<string>();

  /**
   * Emitted when "Message Privately" option is clicked in a group chat.
   * The event payload contains the message and the sender user to message privately.
   * Only available in group chats for other users' messages.
   * @see Requirement 15.2 - Emit messagePrivatelyClick event when clicked
   */
  @Output() messagePrivatelyClick = new EventEmitter<{
    message: CometChat.BaseMessage;
    user: CometChat.User;
  }>();

  /**
   * Emitted when "Reply" option is clicked on a message.
   * The event payload is the message being replied to.
   * The reply should be handled by the message composer component.
   * @see Requirement 16.2 - Emit replyClick event with the message
   * @see Requirement 16.3 - Reply handled by message composer
   * @see Requirement 16.4 - Reply preview displayed in message composer
   */
  @Output() replyClick = new EventEmitter<CometChat.BaseMessage>();

  // ==================== ViewChild References ====================
  /**
   * Reference to the list container element.
   */
  @ViewChild('listContainer') listContainer?: ElementRef<HTMLElement>;

  /**
   * Reference to the scroll top anchor element for IntersectionObserver.
   */
  @ViewChild('scrollTopAnchor') scrollTopAnchor?: ElementRef<HTMLElement>;

  /**
   * Reference to the scroll bottom anchor element for IntersectionObserver.
   */
  @ViewChild('scrollBottomAnchor') scrollBottomAnchor?: ElementRef<HTMLElement>;

  // ==================== Signal-Based State from Service ====================
  /**
   * Messages array from the service.
   */
  messages!: Signal<CometChat.BaseMessage[]>;

  /**
   * Loading state from the service.
   */
  loadingState!: Signal<boolean>;

  /**
   * Error state from the service.
   */
  errorState!: Signal<Error | null>;

  /**
   * Unread message count from the service.
   */
  unreadCount!: Signal<number>;

  // ==================== Component State (Signals) ====================
  /**
   * Threshold in pixels from bottom to consider user "at bottom".
   * Used for scroll position detection and read receipt marking.
   * @see Requirements 2.1, 3.1, 4.1
   */
  private readonly BOTTOM_THRESHOLD = 100;

  /**
   * Current state of the message list.
   */
  listState = signal<States>(States.loading);

  /**
   * Whether to show the scroll-to-bottom button.
   */
  showScrollToBottom = signal(false);

  /**
   * Timestamp for the sticky date header.
   */
  stickyDateTimestamp = signal<number>(0);

  /**
   * Whether to show the sticky date header.
   */
  showStickyDateHeader = signal(false);

  /**
   * Whether the user is at the bottom of the list.
   */
  isAtBottom = signal(true);

  /**
   * Index of the currently focused message for keyboard navigation.
   */
  focusedMessageIndex = signal(-1);

  /**
   * Whether previous messages are being fetched.
   */
  isFetchingPrevious = signal(false);

  /**
   * Whether next messages are being fetched.
   */
  isFetchingNext = signal(false);

  /**
   * Whether there are more previous messages to fetch.
   */
  hasMorePrevious = signal(true);

  /**
   * Whether there are more next messages to fetch.
   * Initially false - only set to true when using goToMessage feature.
   */
  hasMoreNext = signal(false);

  // ==================== Smart Replies State ====================
  /**
   * Whether to hide smart replies.
   * Set to true when user starts typing or sends a message.
   * Reset to false when a new message is received.
   * @see Requirement 2.7, 2.8
   */
  hideSmartReplies = signal(true);

  /**
   * The last received message from another user.
   * Used to generate smart replies.
   * @see Requirement 2.2
   */
  lastReceivedMessage = signal<CometChat.BaseMessage | undefined>(undefined);

  // ==================== Conversation Starters State ====================
  /**
   * Whether to hide conversation starters.
   * Set to true when a message is sent or received.
   * @see Requirement 3.4 - Hide once a message is sent
   * @see Requirement 3.5 - Hide once a message is received
   */
  hideConversationStarters = signal(false);

  // ==================== New Messages Banner State ====================
  /**
   * Whether to show the new messages banner.
   * Shows when new messages arrive and user is not at the bottom.
   * @see Requirement 10.1 - Display banner when new messages arrive and not at bottom
   */
  showNewMessagesBanner = signal(false);

  /**
   * Count of new messages since user scrolled away from bottom.
   * @see Requirement 10.2 - Display count of new messages
   */
  newMessagesCount = signal(0);

  // ==================== Unread Message Tracking State ====================
  /**
   * Array of unread receiver messages.
   * Used to track which messages need to be marked as read.
   * @see Requirements 3.2, 3.3, 8.1
   */
  unreadMessages = signal<CometChat.BaseMessage[]>([]);

  /**
   * Count of unread messages (exposed via service).
   * Managed by the service based on message read status.
   * @see Requirements 3.2, 3.3, 8.1
   */
  // Note: unreadCount is already defined from service signal

  /**
   * Set of message IDs with pending read receipts.
   * Used to prevent duplicate SDK calls for the same message.
   * @see Requirements 1.4, 11.1
   */
  private pendingReadReceipts = new Set<number>();

  /**
   * Flag indicating if a mark-as-read operation is in progress.
   * Used to prevent concurrent read receipt operations.
   * @see Requirements 1.4, 11.1
   */
  private isMarkingAsRead = false;

  // ==================== Delete Confirmation Dialog State ====================
  /**
   * Whether to show the delete confirmation dialog.
   * @see Requirement 12.6 - Show confirmation dialog before deleting
   */
  showDeleteConfirmDialog = signal(false);

  /**
   * The message to be deleted (pending confirmation).
   * @see Requirement 12.6 - Show confirmation dialog before deleting
   */
  messageToDelete = signal<CometChat.BaseMessage | null>(null);

  /**
   * Whether the delete operation is in progress.
   */
  isDeleting = signal(false);

  // ==================== Inline Toast State ====================
  /** Current inline toast message (null = hidden) */
  inlineToastText = signal<string | null>(null);
  /** Current inline toast type */
  inlineToastType = signal<ToastType>(ToastType.success);
  /** Timer for auto-dismiss */
  private inlineToastTimer?: number;

  // ==================== Flag Message Dialog State ====================
  /**
   * Whether to show the flag message dialog.
   * @see Requirement 9.2 - THE Flag_Message_Dialog SHALL display a confirmation prompt
   */
  showFlagMessageDialog = signal(false);

  /**
   * The message to be flagged (pending confirmation).
   * @see Requirement 9.2
   */
  messageToFlag = signal<CometChat.BaseMessage | null>(null);

  /**
   * Whether the flag operation is in progress.
   */
  isFlagging = signal(false);

  // ==================== Message Info Panel State ====================
  /**
   * Whether to show the message information panel.
   * @see Requirement 7.1 - Open Message_Information component when info option is clicked
   */
  showMessageInfo = signal(false);

  /**
   * The message to display in the message information panel.
   * @see Requirement 7.1 - Open Message_Information component when info option is clicked
   */
  messageForInfo = signal<CometChat.BaseMessage | null>(null);

  // ==================== Translation State ====================
  /**
   * Map of message IDs to their translated text.
   * Key: message ID (number)
   * Value: translated text (string)
   * @see Requirement 14.3 - Display original and translated text
   * @see Requirement 14.4 - Cache translated messages
   */
  translatedMessages = signal<Map<number, string>>(new Map());

  /**
   * Set of message IDs currently being translated.
   * Used to show loading state during translation.
   */
  translatingMessages = signal<Set<number>>(new Set());

  /**
   * The user's preferred language for translation.
   * Defaults to browser language or 'en'.
   * @see Requirement 14.5 - Use user's preferred language setting
   */
  preferredTranslationLanguage = signal<string>(this.getDefaultTranslationLanguage());

  // ==================== Emoji Keyboard State ====================
  /**
   * The message currently being reacted to via the emoji keyboard.
   * When set, the emoji keyboard popover is shown.
   * @see Requirement 5.1 - Display Emoji_Keyboard when "React to Message" option is clicked
   */
  emojiKeyboardMessage = signal<CometChat.BaseMessage | null>(null);

  /**
   * Position and alignment for the emoji keyboard popover.
   * Calculated when the emoji keyboard is opened based on the message bubble's position.
   */
  emojiKeyboardPosition = signal<{ top: number; left: number; side: 'left' | 'right' } | null>(
    null
  );

  // ==================== Footer Panel State ====================
  /** Configuration for the footer panel (conversation summary). */
  footerPanelConfig = signal<IPanel | null>(null);

  /** Whether the footer panel is currently visible. */
  showFooterPanel = signal<boolean>(false);

  // ==================== Call Screen State ====================
  /** Whether to show the ongoing call screen. */
  showCallScreen = signal<boolean>(false);

  /** The ongoing call view content. */
  ongoingCallView = signal<any>(null);

  // ==================== Image Moderation Dialog State ====================
  /** Whether to show the image moderation confirmation dialog. */
  showImageModerationDialog = signal<boolean>(false);

  /** The image moderation dialog content. */
  imageModerationDialogContent = signal<any>(null);

  // ==================== First Load Tracking ====================
  /** Whether the first load has been completed (for ccActiveChatChanged). */
  private isFirstLoad = true;

  // ==================== Computed Signals ====================
  /**
   * Messages with date separators inserted.
   */
  messagesWithSeparators = computed(() => this.computeMessagesWithDateSeparators());

  /**
   * Whether there are any messages.
   */
  hasMessages = computed(() => this.messages().length > 0);

  /**
   * Whether the list is in loading state.
   */
  isLoading = computed(() => this.loadingState());

  /**
   * Whether there is an error.
   */
  hasError = computed(() => this.errorState() !== null);

  /**
   * Whether to show the empty state.
   */
  shouldShowEmptyState = computed(
    () => !this.isLoading() && !this.hasError() && !this.hasMessages()
  );

  /**
   * Whether smart replies should be visible.
   * Shows when: showSmartReplies is enabled, not hidden, and there's a last received message.
   * @see Requirement 2.1, 2.7, 2.8
   */
  shouldShowSmartReplies = computed(
    () =>
      this.showSmartReplies &&
      !this.hideSmartReplies() &&
      this.lastReceivedMessage() !== undefined &&
      !this.showFooterPanel() &&
      !this.parentMessageId
  );

  /**
   * Whether conversation starters should be visible.
   * Shows when: showConversationStarters is enabled, conversation is empty, and not hidden.
   * @see Requirement 3.1 - Show when conversation is empty
   * @see Requirement 3.4 - Hide once a message is sent
   * @see Requirement 3.5 - Hide once a message is received
   */
  shouldShowConversationStarters = computed(
    () =>
      this.showConversationStarters &&
      !this.hasMessages() &&
      !this.hideConversationStarters() &&
      !this.showFooterPanel() &&
      this.listState() === States.empty &&
      !this.parentMessageId
  );

  // ==================== Effective Value Computed Signals (Priority System) ====================
  /**
   * Computed effective values implementing the priority system:
   * 1. If @Input was explicitly set → use @Input value
   * 2. Else if global config is set (not undefined) → use global config value
   * 3. Else → use internal default value
   */
  effectiveShowScrollbar = computed(() => {
    if (this.showScrollbarExplicitlySet()) return this._showScrollbar();
    if (this.globalConfig?.showScrollbar !== undefined) return this.globalConfig.showScrollbar;
    return false;
  });

  effectiveHideError = computed(() => {
    if (this.hideErrorExplicitlySet()) return this._hideError();
    if (this.globalConfig?.hideError !== undefined) return this.globalConfig.hideError;
    return false;
  });

  effectiveHideReceipts = computed(() => {
    if (this.hideReceiptsExplicitlySet()) return this._hideReceipts();
    if (this.globalConfig?.hideReceipts !== undefined) return this.globalConfig.hideReceipts;
    return false;
  });

  effectiveDisableSoundForMessages = computed(() => {
    if (this.disableSoundForMessagesExplicitlySet()) return this._disableSoundForMessages();
    if (this.globalConfig?.disableSoundForMessages !== undefined)
      return this.globalConfig.disableSoundForMessages;
    return false;
  });

  effectiveTextFormatters = computed(() => {
    if (this.textFormattersExplicitlySet()) return this._textFormatters();
    if (this.globalConfig?.textFormatters !== undefined) return this.globalConfig.textFormatters;
    return [];
  });

  effectiveHideAvatar = computed(() => {
    if (this.hideAvatarExplicitlySet()) return this._hideAvatar();
    if (this.globalConfig?.hideAvatar !== undefined) return this.globalConfig.hideAvatar;
    return false;
  });

  effectiveCustomSoundForMessages = computed(() => {
    if (this.customSoundForMessagesExplicitlySet()) return this._customSoundForMessages();
    if (this.globalConfig?.customSoundForMessages !== undefined)
      return this.globalConfig.customSoundForMessages;
    return '';
  });

  effectiveHideModerationView = computed(() => {
    if (this.hideModerationViewExplicitlySet()) return this._hideModerationView();
    return false;
  });

  // ==================== Template Resolution (@Input > Component Service > Shared Service > Default) ====================
  get effectiveLoadingView(): TemplateRef<any> | undefined {
    return (
      this.loadingStateTemplate ||
      this.loadingView ||
      this.templatesService.resolveTemplate(this.templatesService.getMessageListTemplates(), 'loadingView')
    );
  }
  get effectiveEmptyView(): TemplateRef<any> | undefined {
    return (
      this.emptyStateTemplate ||
      this.emptyView ||
      this.templatesService.resolveTemplate(this.templatesService.getMessageListTemplates(), 'emptyView')
    );
  }
  get effectiveErrorView(): TemplateRef<any> | undefined {
    return (
      this.errorStateTemplate ||
      this.errorView ||
      this.templatesService.resolveTemplate(this.templatesService.getMessageListTemplates(), 'errorView')
    );
  }
  get effectiveHeaderView(): TemplateRef<any> | undefined {
    return this.headerView || this.templatesService.getMessageListTemplates().headerView;
  }
  get effectiveFooterView(): TemplateRef<any> | undefined {
    return this.footerView || this.templatesService.getMessageListTemplates().footerView;
  }

  // ==================== Private State ====================
  /**
   * Whether user/group props were explicitly provided via @Input.
   * When true, the component uses props and ignores ChatStateService.
   * When false, the component listens to ChatStateService for user/group changes.
   */
  private propsProvided = false;

  /**
   * The logged-in user.
   */
  private loggedInUser: CometChat.User | null = null;

  /**
   * Active text formatters to use for message rendering.
   * Initialized from input or defaults from FormatterConfigService.
   * @see Requirements 5.1, 5.2, 5.3
   */
  activeFormatters: CometChatTextFormatter[] = [];

  /**
   * Subject for cleanup on destroy.
   */
  private destroy$ = new Subject<void>();

  /** @internal Stored scroll listener for cleanup */
  private scrollListener: ((event: Event) => void) | null = null;

  /**
   * IntersectionObserver for scroll top detection.
   */
  private scrollTopObserver?: IntersectionObserver;

  /**
   * IntersectionObserver for scroll bottom detection.
   */
  private scrollBottomObserver?: IntersectionObserver;

  /**
   * Scroll height before loading more messages.
   */
  private scrollHeightBeforeLoad = 0;

  /**
   * Timestamp of the last sound played.
   */
  private lastSoundPlayedAt = 0;

  /**
   * Throttle interval for sound notifications in milliseconds.
   */
  private readonly SOUND_THROTTLE_INTERVAL = 2000;

  /**
   * Previous messages array for detecting new messages.
   */
  private previousMessages: CometChat.BaseMessage[] = [];

  /**
   * Timeout for debounced typing announcements.
   * @see Requirement 20.6 - Debounced typing announcement
   */
  private typingAnnouncementTimeout: ReturnType<typeof setTimeout> | null = null;

  // ==================== Exposed Enums ====================
  /**
   * States enum for template usage.
   */
  readonly States = States;

  /**
   * MessageListAlignment enum for template usage.
   */
  readonly MessageListAlignment = MessageListAlignment;

  /**
   * MessageBubbleAlignment enum for template usage.
   */
  readonly MessageBubbleAlignment = MessageBubbleAlignment;

  /**
   * Placement enum for template usage (popover positioning).
   */
  readonly Placement = Placement;

  private messageListenerId = `message_list_${Date.now()}`;


  constructor() {
    // Initialize signals from service - use signals directly instead of going through
    // toObservable → toSignal chain which has async timing issues with effects
    this.messages = this.messageListService.messages;
    this.loadingState = this.messageListService.loadingState;
    this.errorState = this.messageListService.errorState;
    // Use the signal directly from the service
    this.unreadCount = this.messageListService.unreadCount;

    // Effect for handling new messages and sound notifications
    effect(() => {
      const messages = this.messages();
      this.handleNewMessages(messages);
      this.previousMessages = [...messages];
      // Explicitly mark for check to ensure OnPush component re-renders
      // when messages signal changes (e.g., receipt updates from SDK listeners)
      this.cdr.markForCheck();
    });

    // Effect for error handling
    effect(() => {
      const error = this.errorState();
      if (error && !this.effectiveHideError()) {
        this.handleServiceError(error);
      }
    });

    // Effect for updating list state
    effect(() => {
      this.updateListState();
    });
  }
    private setupMessageListener(): void {
    CometChat.addMessageListener(
      this.messageListenerId,
      new CometChat.MessageListener({
        onMessagesDelivered: (messageReceipt: CometChat.MessageReceipt) => {
      setTimeout(() => {
             this.cdr.detectChanges();
           }, 500);
        },

        /**
         * Handle read receipt events (1-on-1 chats).
         *
         * Called when messages are read by a user in a 1-on-1 conversation.
         * Updates the read status of the corresponding messages.
         *
         * @param messageReceipt - The read receipt containing message IDs and timestamp
         * @see Requirement 7.2 - Set up listener for read receipts
         * @see Requirement 7.4 - Update corresponding message's read status
         */
        onMessagesRead: (messageReceipt: CometChat.MessageReceipt) => {
      setTimeout(() => {
             this.cdr.detectChanges();
           }, 500);
        },

      })
    );
  }

  // ==================== Lifecycle Hooks ====================
  ngOnInit(): void {
    try {
      this.messageListenerId = `message_list_${Date.now()}`;
      // Initialize logged-in user and formatters asynchronously
      this.initializeLoggedInUser().then(() => {
        // Configure formatters with logged-in user once available
        this.configureFormattersWithUser();
        this.setupMessageListener();

      });

      // Initialize formatters (will be configured with user once available)
      this.initializeFormatters();
      this.subscribeToMessageEvents();

      // If no props provided, subscribe to ChatStateService
      // @see Requirement 7.1 - Listen to activeUser from ChatStateService when user prop not provided
      // @see Requirement 7.2 - Listen to activeGroup from ChatStateService when group prop not provided
      if (!this.user && !this.group) {
        this.propsProvided = false;
        this.subscribeToChatStateService();
      } else {
        this.propsProvided = true;
        this.initializeService();
      }

      // Subscribe to panel show/hide events
      // @see Requirement 3.1 - Subscribe to ccShowPanel and display footer panel
      // @see Requirement 3.2 - Subscribe to ccHidePanel and hide footer panel
      CometChatUIEvents.ccShowPanel.pipe(takeUntil(this.destroy$)).subscribe((panel: IPanel) => {
        if (panel.position === PanelAlignment.messageListFooter) {
          this.footerPanelConfig.set(panel);
          this.showFooterPanel.set(true);
        }
      });

      CometChatUIEvents.ccHidePanel.pipe(takeUntil(this.destroy$)).subscribe(alignment => {
        if (alignment === PanelAlignment.messageListFooter || alignment === undefined) {
          this.footerPanelConfig.set(null);
          this.showFooterPanel.set(false);
        }
      });
    } catch (error) {
      this.handleLifecycleError(error, 'ngOnInit');
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    try {
      // Handle user/group prop changes (not first change - that's handled in ngOnInit)
      // @see Requirement 9.1 - Reset message list when user prop changes
      // @see Requirement 9.2 - Reset message list when group prop changes
      const userChange = changes['user'];
      const groupChange = changes['group'];

      if ((userChange && !userChange.firstChange) || (groupChange && !groupChange.firstChange)) {
        this.handleConversationChange();
      }

      if (changes['parentMessageId']) {
        this.handleParentMessageIdChange();
      }

      // Handle goToMessageId change — scroll to or fetch the target message
      const goToMessageIdChange = changes['goToMessageId'];
      if (goToMessageIdChange && !goToMessageIdChange.firstChange && this.goToMessageId) {
        this.scrollToMessage(this.goToMessageId);
      }

      // Handle hideGroupActionMessages change — update service filter and re-fetch
      const hideGroupActionChange = changes['hideGroupActionMessages'];
      if (hideGroupActionChange && !hideGroupActionChange.firstChange) {
        this.messageListService.setHideGroupActionMessages(this.hideGroupActionMessages);
        this.messageListService.clearMessages();
        this.messageListService.fetchPreviousMessages().then(() => {
          this.scrollToBottomAfterLoad();
        });
      }
    } catch (error) {
      CometChatLogger.error('CometChatMessageList', 'Error in ngOnChanges:', error);
      // Continue with previous state — don't set error
    }
  }

  ngAfterViewInit(): void {
    try {
      this.setupIntersectionObservers();
      this.setupScrollListeners();
      if (this.goToMessageId) {
        this.scrollToMessage(this.goToMessageId);
      }

      // Set up an effect to re-initialize observers when list state changes to loaded
      // This is needed because the scroll anchors are only rendered when state is loaded
      effect(
        () => {
          const state = this.listState();
          if (state === States.loaded) {
            // Use setTimeout to ensure DOM is updated before setting up observers
            setTimeout(() => {
              this.setupIntersectionObservers();
            }, 0);
          }
        },
        { injector: this.injector }
      );
    } catch (error) {
      this.handleLifecycleError(error, 'ngAfterViewInit');
    }
  }

  ngOnDestroy(): void {
    try {
      if(this.messageListenerId){
        CometChat.removeMessageListener(this.messageListenerId);
      }
      this.destroy$.next();
      this.destroy$.complete();
      this.disconnectObservers();

      // Clean up typing announcement timeout
      if (this.typingAnnouncementTimeout) {
        clearTimeout(this.typingAnnouncementTimeout);
        this.typingAnnouncementTimeout = null;
      }

      // Clean up scroll listener
      if (this.scrollListener && this.listContainer?.nativeElement) {
        this.listContainer.nativeElement.removeEventListener('scroll', this.scrollListener);
        this.scrollListener = null;
      }
    } catch (error) {
      CometChatLogger.error('CometChatMessageList', 'Error in ngOnDestroy:', error);
    }
  }

  // ==================== Initialization Methods ====================
  /**
   * Initializes the logged-in user.
   */
  private async initializeLoggedInUser(): Promise<void> {
    try {
      this.loggedInUser = await CometChat.getLoggedinUser();
    } catch (error) {
      CometChatLogger.error('CometChatMessageList', 'Error getting logged-in user:', error);
    }
  }

  /**
   * Initializes text formatters for message rendering.
   * Uses formatters from input if provided, otherwise gets defaults from FormatterConfigService.
   * Note: Formatters are configured with logged-in user separately once user is available.
   * @see Requirements 5.1, 5.2, 5.3
   */
  private initializeFormatters(): void {
    // Use formatters from input or get defaults from service
    const effectiveFormatters = this.effectiveTextFormatters();
    if (effectiveFormatters && effectiveFormatters.length > 0) {
      this.activeFormatters = [...effectiveFormatters];
    } else {
      this.activeFormatters = this.formatterConfigService.getDefaultFormatters();
    }
  }

  /**
   * Configures formatters with the logged-in user for self-mention detection.
   * This is called during initialization and when the logged-in user changes.
   * @see Requirement 5.5
   */
  private configureFormattersWithUser(): void {
    if (!this.loggedInUser) {
      return;
    }

    this.activeFormatters.forEach(formatter => {
      if (formatter instanceof CometChatMentionsFormatter) {
        formatter.setLoggedInUser(this.loggedInUser);
      }
    });
  }

  /**
   * Initializes the message list service with the current conversation context.
   * @see Requirement 4.1, 4.2, 4.3, 4.4 - Scroll to bottom after initial load
   */
  private initializeService(): void {
    if (this.user) {
      this.messageListService.setUser(this.user);
    } else if (this.group) {
      this.messageListService.setGroup(this.group);
    }

    if (this.parentMessageId) {
      this.messageListService.setParentMessageId(this.parentMessageId);
    }

    if (this.messagesRequestBuilder) {
      this.messageListService.setMessagesRequestBuilder(this.messagesRequestBuilder);
    }

    if (this.hideGroupActionMessages) {
      this.messageListService.setHideGroupActionMessages(this.hideGroupActionMessages);
    }

    // Fetch initial messages and scroll to bottom after load
    this.messageListService.fetchPreviousMessages().then(() => {
      this.scrollToBottomAfterLoad();
      // Publish ccActiveChatChanged on first load (non-thread mode only)
      // @see Requirement 10.6 - Message_List SHALL publish ccActiveChatChanged on first load
      this.publishActiveChatChanged();
    });
  }

  /**
   * Handles conversation change (user or group prop change).
   * Resets component state, sets new user/group, fetches new messages, and scrolls to bottom.
   * Note: We do NOT call cleanup() here because setUser()/setGroup() already handle
   * clearing messages and state internally. Calling cleanup() would remove
   * the ccMessageSent subscription which is needed for real-time message sync.
   * @see Requirement 4.3 - Scroll to bottom when switching conversations
   * @see Requirement 9.1 - Reset message list when user prop changes
   * @see Requirement 9.2 - Reset message list when group prop changes
   * @see Requirement 9.4 - Clear existing messages before fetching new ones
   * @see Requirement 9.5 - Scroll to bottom after fetching new messages
   */
  private handleConversationChange(): void {
    // Dismiss any active footer panel when conversation changes
    // @see Requirement 3.4
    this.footerPanelConfig.set(null);
    this.showFooterPanel.set(false);

    // Reset component state
    this.showScrollToBottom.set(false);
    this.showNewMessagesBanner.set(false);
    this.newMessagesCount.set(0);
    this.hasMorePrevious.set(true);
    this.hasMoreNext.set(false); // Only true when using goToMessage
    this.isFirstLoad = true; // Reset first load flag for new conversation

    // Set the new user/group - these methods internally call clearMessagesAndState()
    // which handles clearing messages, maps, and pagination state without removing listeners
    if (this.user) {
      this.messageListService.setUser(this.user);
      // Fetch messages and scroll to bottom after load
      this.messageListService.fetchPreviousMessages().then(() => {
        this.scrollToBottomAfterLoad();
        this.publishActiveChatChanged();
      });
    } else if (this.group) {
      this.messageListService.setGroup(this.group);
      // Fetch messages and scroll to bottom after load
      this.messageListService.fetchPreviousMessages().then(() => {
        this.scrollToBottomAfterLoad();
        this.publishActiveChatChanged();
      });
    } else {
      // Both user and group are null (conversation deleted or cleared)
      // Clear all messages and state without fetching new ones
      this.messageListService.clearConversation();
    }
  }

  /**
   * Handles parent message ID change for thread mode.
   */
  private handleParentMessageIdChange(): void {
    if (this.parentMessageId) {
      this.messageListService.setParentMessageId(this.parentMessageId);
      this.messageListService.fetchPreviousMessages();
    }
  }

  /**
   * Subscribes to ChatStateService for active user/group changes.
   * Only called when user and group props are not provided.
   * @see Requirement 7.1 - Listen to activeUser from ChatStateService when user prop not provided
   * @see Requirement 7.2 - Listen to activeGroup from ChatStateService when group prop not provided
   * @see Requirement 7.4 - Reset and fetch new messages when active user/group changes
   */
  private subscribeToChatStateService(): void {
    // Subscribe to active user changes
    this.chatStateService.activeUser$.pipe(takeUntil(this.destroy$)).subscribe(user => {
      if (user) {
        this.handleUserChange(user);
      }
    });

    // Subscribe to active group changes
    this.chatStateService.activeGroup$.pipe(takeUntil(this.destroy$)).subscribe(group => {
      if (group) {
        this.handleGroupChange(group);
      }
    });
  }

  /**
   * Handles user change from ChatStateService.
   * Sets the new user, fetches messages, and scrolls to bottom.
   * Note: We do NOT call cleanup() here because setUser() already handles
   * clearing messages and state internally. Calling cleanup() would remove
   * the ccMessageSent subscription which is needed for real-time message sync.
   * @param user - The new active user from ChatStateService
   * @see Requirement 7.1 - Listen to activeUser from ChatStateService
   * @see Requirement 7.4 - Reset and fetch new messages when active user changes
   */
  private handleUserChange(user: CometChat.User): void {
    // Dismiss any active footer panel when user changes
    // @see Requirement 3.4
    this.footerPanelConfig.set(null);
    this.showFooterPanel.set(false);

    // Reset component state
    this.showScrollToBottom.set(false);
    this.showNewMessagesBanner.set(false);
    this.newMessagesCount.set(0);
    this.hasMorePrevious.set(true);
    this.hasMoreNext.set(false); // Only true when using goToMessage

    // Update the local user reference so child components (e.g. conversation-starter)
    // receive the correct value via template bindings when user comes from ChatStateService
    this.user = user;
    this.group = undefined;

    // Set the new user and fetch messages
    // Note: setUser() internally calls clearMessagesAndState() which handles
    // clearing messages, maps, and pagination state without removing listeners
    this.messageListService.setUser(user);
    this.messageListService.fetchPreviousMessages().then(() => {
      this.scrollToBottomAfterLoad();
    });
  }

  /**
   * Handles group change from ChatStateService.
   * Sets the new group, fetches messages, and scrolls to bottom.
   * Note: We do NOT call cleanup() here because setGroup() already handles
   * clearing messages and state internally. Calling cleanup() would remove
   * the ccMessageSent subscription which is needed for real-time message sync.
   * @param group - The new active group from ChatStateService
   * @see Requirement 7.2 - Listen to activeGroup from ChatStateService
   * @see Requirement 7.4 - Reset and fetch new messages when active group changes
   */
  private handleGroupChange(group: CometChat.Group): void {
    // Dismiss any active footer panel when group changes
    // @see Requirement 3.4
    this.footerPanelConfig.set(null);
    this.showFooterPanel.set(false);

    // Reset component state
    this.showScrollToBottom.set(false);
    this.showNewMessagesBanner.set(false);
    this.newMessagesCount.set(0);
    this.hasMorePrevious.set(true);
    this.hasMoreNext.set(false); // Only true when using goToMessage

    // Update the local group reference so child components (e.g. conversation-starter)
    // receive the correct value via template bindings when group comes from ChatStateService
    this.group = group;
    this.user = undefined;

    // Set the new group and fetch messages
    // Note: setGroup() internally calls clearMessagesAndState() which handles
    // clearing messages, maps, and pagination state without removing listeners
    this.messageListService.setGroup(group);
    this.messageListService.fetchPreviousMessages().then(() => {
      this.scrollToBottomAfterLoad();
    });
  }

  /**
   * Subscribes to message events from CometChatMessageEvents.
   * Handles message edited and deleted events and emits the corresponding output events.
   * @private
   * @see Requirement 11.4 - THE Message_List_Component SHALL emit a `messageEdited` event when a message is edited
   * @see Requirement 12.4 - THE Message_List_Component SHALL emit a `messageDeleted` event when a message is deleted
   */
  private subscribeToMessageEvents(): void {
    // Subscribe to message sent events for auto-scroll
    // When user sends a message (inprogress status), scroll to bottom to show it
    // IMPORTANT: ccMessageSent is a global event received by ALL message list instances.
    // We must filter so only the correct instance scrolls (thread list vs main list).
    CometChatMessageEvents.ccMessageSent.pipe(takeUntil(this.destroy$)).subscribe(data => {
      // Only scroll on inprogress status (when message is being sent)
      // This ensures we scroll immediately when user sends a message
      if (data.status === MessageStatus.inprogress) {
        const messageParentId = data.message.getParentMessageId();

        // Thread mode: only scroll if the message's parentMessageId matches this list's parentMessageId
        // Main chat mode: only scroll if the message has no parentMessageId (not a thread reply)
        if (this.parentMessageId) {
          if (messageParentId !== this.parentMessageId) {
            return;
          }
        } else {
          if (messageParentId) {
            return;
          }
        }

        // Use requestAnimationFrame to ensure DOM is updated before scrolling
        requestAnimationFrame(() => {
          this.scrollToBottom(false);
        });
      }
    });

    // Subscribe to ccMessageDeleted for sender-side delete sync.
    // The SDK's onMessageDeleted listener only fires for remote events (other users).
    // When the logged-in user deletes their own message (from this or another component
    // like a thread view), ccMessageDeleted is emitted locally. We need to handle it
    // here so the message list updates in real-time without a page refresh.
    CometChatMessageEvents.ccMessageDeleted
      .pipe(takeUntil(this.destroy$))
      .subscribe((message: CometChat.BaseMessage) => {
        const messageId = message.getId();
        if (messageId) {
          // Check if the message is already marked as deleted to avoid redundant updates
          // (e.g., when this component itself triggered the delete via handleDeleteConfirm)
          const existing = this.messageListService.getMessageById(messageId);
          if (existing && !existing.getDeletedAt()) {
            this.messageListService.deleteMessage(messageId);
          }
          this.cdr.markForCheck();
        }
      });

    // Subscribe to ccMessageTranslated — update translated message in the list
    // @see Requirement 6.3 - Subscribe to ccMessageTranslated
    CometChatMessageEvents.ccMessageTranslated
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: IMessages) => {
        if (data.status === MessageStatus.success && data.message) {
          if (this.isMessageForCurrentConversation(data.message)) {
            this.messageListService.updateMessageById(data.message.getId(), data.message);
            this.cdr.markForCheck();
          }
        }
      });

    // Subscribe to ccMessageEdited — show inline toast for edit success/error
    // The composer emits ccMessageEdited with parentMessageId so we can scope
    // the toast to the correct message list instance (thread vs main).
    CometChatMessageEvents.ccMessageEdited
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: IMessages) => {
        // Filter: only handle events for this list instance
        if (this.parentMessageId) {
          if (data.parentMessageId !== this.parentMessageId) return;
        } else {
          if (data.parentMessageId) return;
        }

        if (data.status === MessageStatus.success) {
          this.showInlineToast(CometChatLocalize.getLocalizedString('message_list_message_edited'));
        } else if (data.status === MessageStatus.error) {
          this.showInlineToast(CometChatLocalize.getLocalizedString('message_edit_error'), ToastType.error, 3000);
        }
      });

    // Subscribe to ccMessageRead — update read receipts for user conversations
    // @see Requirement 6.4 - Subscribe to ccMessageRead
    CometChatMessageEvents.ccMessageRead
      .pipe(takeUntil(this.destroy$))
      .subscribe((message: CometChat.BaseMessage) => {
        // Only relevant for user conversations (1-on-1 chats) where we track read receipts
        if (
          this.user &&
          message.getReceiverType() === CometChatUIKitConstants.MessageReceiverType.user
        ) {
          // If the message is a thread reply for the current conversation, handle thread unread count
          if (message.getParentMessageId() && !this.parentMessageId) {
            // Thread reply read in main list context — no action needed
            return;
          }
        }
      });

    // Subscribe to group events (only for non-thread, non-agent mode)
    this.subscribeToGroupEvents();

    // Subscribe to call events
    this.subscribeToCallEvents();

    // Subscribe to UI events (dialog, ongoing call)
    this.subscribeToUIDialogEvents();
  }

  /**
   * Subscribes to group events for updating group reference and appending action messages.
   * @see Requirement 6.5-6.10
   */
  private subscribeToGroupEvents(): void {
    // ccOwnershipChanged — update group reference
    // @see Requirement 6.5
    CometChatGroupEvents.ccOwnershipChanged
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: IOwnershipChanged) => {
        if (this.group && data.group.getGuid() === this.group.getGuid()) {
          this.group = data.group;
          this.cdr.markForCheck();
        }
      });

    // ccGroupMemberScopeChanged — update group reference + append action message
    // @see Requirement 6.6, 6.11
    CometChatGroupEvents.ccGroupMemberScopeChanged
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: IGroupMemberScopeChanged) => {
        if (this.group && data.group.getGuid() === this.group.getGuid()) {
          this.group = data.group;
          if (!this.parentMessageId) {
            this.messageListService.addMessage(data.message);
            this.scrollToBottom(false);
          }
          this.cdr.markForCheck();
        }
      });

    // ccGroupMemberAdded — append action messages + update group reference
    // @see Requirement 6.7
    CometChatGroupEvents.ccGroupMemberAdded
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: IGroupMemberAdded) => {
        if (this.group && data.userAddedIn.getGuid() === this.group.getGuid()) {
          this.group = data.userAddedIn;
          if (!this.parentMessageId) {
            data.messages.forEach(message => {
              this.messageListService.addMessage(message);
            });
            this.scrollToBottom(false);
          }
          this.cdr.markForCheck();
        }
      });

    // ccGroupMemberBanned — append action messages + update group reference
    // @see Requirement 6.8
    CometChatGroupEvents.ccGroupMemberBanned
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: IGroupMemberKickedBanned) => {
        if (this.group && data.kickedFrom.getGuid() === this.group.getGuid()) {
          this.group = data.kickedFrom;
          if (!this.parentMessageId) {
            this.messageListService.addMessage(data.message);
            this.scrollToBottom(false);
          }
          this.cdr.markForCheck();
        }
      });

    // ccGroupMemberKicked — append action messages + update group reference
    // @see Requirement 6.9
    CometChatGroupEvents.ccGroupMemberKicked
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: IGroupMemberKickedBanned) => {
        if (this.group && data.kickedFrom.getGuid() === this.group.getGuid()) {
          this.group = data.kickedFrom;
          if (!this.parentMessageId) {
            this.messageListService.addMessage(data.message);
            this.scrollToBottom(false);
          }
          this.cdr.markForCheck();
        }
      });

    // ccGroupLeft — append action messages
    // @see Requirement 6.10
    CometChatGroupEvents.ccGroupLeft
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: IGroupLeft) => {
        if (this.group && data.leftGroup.getGuid() === this.group.getGuid()) {
          if (!this.parentMessageId) {
            this.messageListService.addMessage(data.message);
            this.scrollToBottom(false);
          }
          this.cdr.markForCheck();
        }
      });
  }

  /**
   * Subscribes to call events for appending call action messages and managing call screen.
   * @see Requirement 6.12-6.15
   */
  private subscribeToCallEvents(): void {
    // ccCallEnded — hide call screen + append call action message
    // @see Requirement 6.12
    CometChatCallEvents.ccCallEnded
      .pipe(takeUntil(this.destroy$))
      .subscribe((call: CometChat.Call) => {
        this.showCallScreen.set(false);
        this.ongoingCallView.set(null);
        if (call && !this.parentMessageId) {
          if (this.isCallForCurrentConversation(call)) {
            this.messageListService.addMessage(call);
            this.scrollToBottom(false);
            this.cdr.markForCheck();
          }
        }
      });

    // ccCallRejected — append call action message
    // @see Requirement 6.13
    CometChatCallEvents.ccCallRejected
      .pipe(takeUntil(this.destroy$))
      .subscribe((call: CometChat.Call) => {
        if (call && !this.parentMessageId) {
          if (this.isCallForCurrentConversation(call)) {
            this.messageListService.addMessage(call);
            this.scrollToBottom(false);
            this.cdr.markForCheck();
          }
        }
      });

    // ccOutgoingCall — append call action message
    // @see Requirement 6.14
    CometChatCallEvents.ccOutgoingCall
      .pipe(takeUntil(this.destroy$))
      .subscribe((call: CometChat.Call) => {
        if (call && !this.parentMessageId) {
          if (this.isCallForCurrentConversation(call)) {
            this.messageListService.addMessage(call);
            this.scrollToBottom(false);
            this.cdr.markForCheck();
          }
        }
      });

    // ccCallAccepted — append call action message
    // @see Requirement 6.15
    CometChatCallEvents.ccCallAccepted
      .pipe(takeUntil(this.destroy$))
      .subscribe((call: CometChat.Call) => {
        if (call && !this.parentMessageId) {
          if (this.isCallForCurrentConversation(call)) {
            this.messageListService.addMessage(call);
            this.scrollToBottom(false);
            this.cdr.markForCheck();
          }
        }
      });
  }

  /**
   * Subscribes to UI events for dialog and ongoing call screen management.
   * @see Requirement 6.16-6.18
   */
  private subscribeToUIDialogEvents(): void {
    // ccShowDialog — show image moderation dialog
    // @see Requirement 6.16
    CometChatUIEvents.ccShowDialog.pipe(takeUntil(this.destroy$)).subscribe((data: IDialog) => {
      this.imageModerationDialogContent.set(data.child);
      this.showImageModerationDialog.set(true);
      this.cdr.markForCheck();
    });

    // ccHideDialog — hide image moderation dialog
    // @see Requirement 6.17
    CometChatUIEvents.ccHideDialog.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.imageModerationDialogContent.set(null);
      this.showImageModerationDialog.set(false);
      this.cdr.markForCheck();
    });

    // ccShowOngoingCall — show ongoing call screen
    // @see Requirement 6.18
    CometChatUIEvents.ccShowOngoingCall
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: IShowOngoingCall) => {
        const shouldShow = !!data.child;
        // Check if the call message matches the current conversation context
        const isMatch = data.message
          ? (data.message.getParentMessageId() &&
              this.parentMessageId &&
              data.message.getParentMessageId() === this.parentMessageId) ||
            (!this.parentMessageId && !data.message?.getParentMessageId())
          : true; // No message context means show for all

        if (isMatch) {
          this.showCallScreen.set(shouldShow);
          this.ongoingCallView.set(data.child);
          this.cdr.markForCheck();
        }
      });
  }

  /**
   * Checks if a call message belongs to the current conversation.
   */
  private isCallForCurrentConversation(call: CometChat.Call): boolean {
    const receiverId = call.getReceiverId();
    const receiverType = call.getReceiverType();

    if (this.user) {
      if (receiverType === CometChatUIKitConstants.MessageReceiverType.user) {
        const senderId = call.getSender()?.getUid();
        return receiverId === this.user.getUid() || senderId === this.user.getUid();
      }
      return false;
    } else if (this.group) {
      return (
        receiverType === CometChatUIKitConstants.MessageReceiverType.group &&
        receiverId === this.group.getGuid()
      );
    }
    return false;
  }

  /**
   * Checks if a message belongs to the current conversation.
   */
  private isMessageForCurrentConversation(message: CometChat.BaseMessage): boolean {
    const receiverId = message.getReceiverId();
    const receiverType = message.getReceiverType();

    if (this.parentMessageId) {
      return message.getParentMessageId() === this.parentMessageId;
    }

    if (message.getParentMessageId()) {
      return false;
    }

    if (this.user) {
      if (receiverType === CometChatUIKitConstants.MessageReceiverType.user) {
        const senderId = message.getSender()?.getUid();
        return receiverId === this.user.getUid() || senderId === this.user.getUid();
      }
      return false;
    } else if (this.group) {
      return (
        receiverType === CometChatUIKitConstants.MessageReceiverType.group &&
        receiverId === this.group.getGuid()
      );
    }
    return false;
  }

  // ==================== State Management Methods ====================
  /**
   * Updates the list state based on loading, error, and messages.
   */
  private updateListState(): void {
    const loading = this.loadingState();
    const error = this.errorState();
    const messages = this.messages();

    if (loading && messages.length === 0) {
      this.listState.set(States.loading);
    } else if (error && !this.effectiveHideError()) {
      this.listState.set(States.error);
    } else if (messages.length === 0) {
      this.listState.set(States.empty);
    } else {
      this.listState.set(States.loaded);
    }
  }

  // ==================== Date Separator Methods ====================
  /**
   * Computes messages with date separators inserted between different days.
   * @returns Array of MessageListItem objects
   */
  private computeMessagesWithDateSeparators(): MessageListItem[] {
    const messages = this.messages();
    if (messages.length === 0 || this.hideDateSeparator) {
      return messages.map(msg => ({
        type: 'message' as const,
        message: msg,
        key: `msg-${msg.getId() || msg.getMuid()}-rc${msg.getReplyCount() || 0}-r${msg.getReadAt() || 0}-d${msg.getDeliveredAt() || 0}-del${msg.getDeletedAt() || 0}-e${msg.getEditedAt() || 0}`,
      }));
    }

    const result: MessageListItem[] = [];
    let lastDate: string | null = null;

    for (const message of messages) {
      const messageDate = this.getDateString(message.getSentAt());

      if (message?.getId() && messageDate !== lastDate) {
        result.push({
          type: 'date-separator',
          date: message.getSentAt(),
          key: `sep-${messageDate}`,
        });
        lastDate = messageDate;
      }

      result.push({
        type: 'message',
        message,
        key: `msg-${message.getId() || message.getMuid()}-rc${message.getReplyCount() || 0}-r${message.getReadAt() || 0}-d${message.getDeliveredAt() || 0}-del${message.getDeletedAt() || 0}-e${message.getEditedAt() || 0}`,
      });
    }

    return result;
  }

  /**
   * Generates a fingerprint string from a message's reactions for change tracking.
   * No longer used in @for track keys to prevent full bubble re-renders on reaction changes.
   * The reactions component handles its own updates via ngOnChanges.
   */
  private getReactionFingerprint(message: CometChat.BaseMessage): string {
    const reactions = message.getReactions?.();
    if (!reactions || reactions.length === 0) return '0';
    return reactions
      .map(r => `${r.getReaction()}${r.getCount()}${r.getReactedByMe() ? 'm' : ''}`)
      .join('|');
  }

  /**
   * Gets a date string for comparison (YYYY-MM-DD format).
   * @param timestamp - The timestamp in milliseconds
   * @returns Date string in YYYY-MM-DD format
   */
  private getDateString(timestamp: number): string {
    const date = new Date(timestamp * 1000);
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  }

  /**
   * Gets the default date format for date separators.
   * @returns CalendarObject with default formats
   */
  getDefaultSeparatorDateFormat(): CalendarObject {
    return {
      today: CometChatLocalize.getLocalizedString('today'),
      yesterday: CometChatLocalize.getLocalizedString('yesterday'),
      otherDays: 'DD MMM, YYYY',
    };
  }

  /**
   * Gets the default date format for sticky date header.
   * @returns CalendarObject with default formats
   */
  getDefaultStickyDateFormat(): CalendarObject {
    return {
      today: CometChatLocalize.getLocalizedString('today'),
      yesterday: CometChatLocalize.getLocalizedString('yesterday'),
      otherDays: 'DD MMM, YYYY',
    };
  }

  /**
   * Gets the default date format for message timestamps.
   * @returns CalendarObject with default formats
   */
  getDefaultMessageDateFormat(): CalendarObject {
    return {
      today: 'hh:mm A',
      yesterday: 'hh:mm A',
      otherDays: 'hh:mm A',
    };
  }

  /**
   * Gets the effective date format for date separators.
   * Returns user-provided format if available, otherwise returns default.
   * @returns CalendarObject with date formats
   */
  getEffectiveSeparatorDateFormat(): CalendarObject {
    return this.separatorDateTimeFormat || this.getDefaultSeparatorDateFormat();
  }

  /**
   * Gets the effective date format for sticky date header.
   * Returns user-provided format if available, otherwise returns default.
   * @returns CalendarObject with date formats
   */
  getEffectiveStickyDateFormat(): CalendarObject {
    return this.stickyDateTimeFormat || this.getDefaultStickyDateFormat();
  }

  /**
   * Gets the effective date format for message timestamps.
   * Returns user-provided format if available, otherwise returns default.
   * @returns CalendarObject with date formats
   */
  getEffectiveMessageDateFormat(): CalendarObject {
    return this.messageSentAtDateTimeFormat || this.getDefaultMessageDateFormat();
  }

  // ==================== Message Alignment Methods ====================
  /**
   * Gets the alignment for a message bubble.
   *
   * Alignment rules:
   * - Call messages (category: 'call') -> center (like action messages)
   * - Action messages (category: 'action') -> center
   * - Messages from logged-in user -> right
   * - All other messages -> left
   *
   * @param message - The message to get alignment for
   * @returns MessageBubbleAlignment value
   * @see Requirements 4.5, 4.6 - Call messages should be centered like action messages
   */
  getMessageAlignment(message: CometChat.BaseMessage): MessageBubbleAlignment {
    const category = message.getCategory();

    // Call messages are centered (like action messages)
    // This ensures call action messages (initiated, ended, missed, etc.) display centered
    // @see Requirement 4.6 - THE Action_Bubble for call messages SHALL be centered in the message list
    if (category === CometChatUIKitConstants.MessageCategory.call) {
      return MessageBubbleAlignment.center;
    }

    // Action/system messages are centered
    if (category === CometChatUIKitConstants.MessageCategory.action) {
      return MessageBubbleAlignment.center;
    }
    if (this.messageAlignment == MessageListAlignment.left) {
      return MessageBubbleAlignment.left;
    }

    // Messages from logged-in user are on the right
    const sender = message.getSender();
    if (!sender || (this.loggedInUser && sender?.getUid() === this.loggedInUser.getUid())) {
      return MessageBubbleAlignment.right;
    }

    // All other messages are on the left
    return MessageBubbleAlignment.left;
  }

  /**
   * Gets the message options based on hide* inputs.
   * @param message - The message to get options for
   * @returns Array of CometChatActionsIcon
   * @see Requirement 16.1 - Include Reply option when hideReplyOption is false
   */
  getMessageOptions(message: CometChat.BaseMessage): CometChatActionsIcon[] {
    if (message.getDeletedAt()) return [];
    const options: CometChatActionsIcon[] = [];
    if (!this.hideReactionOption) {
      options.push(
        new CometChatActionsIcon({
          id: CometChatUIKitConstants.MessageOption.reactToMessage,
          title: CometChatLocalize.getLocalizedString('message_list_option_react'),
          iconURL: 'assets/add_reaction_icon.svg',
          onClick: () => {},
        })
      );
    }

    if (!this.hideReplyInThreadOption) {
      options.push(
        new CometChatActionsIcon({
          id: CometChatUIKitConstants.MessageOption.replyInThread,
          title: CometChatLocalize.getLocalizedString('message_list_option_reply_in_thread'),
          iconURL: 'assets/reply_in_thread.svg',
          onClick: () => {},
        })
      );
    }

    if (!this.hideCopyMessageOption && message.getType() === 'text') {
      options.push(
        new CometChatActionsIcon({
          id: CometChatUIKitConstants.MessageOption.copyMessage,
          title: CometChatLocalize.getLocalizedString('message_list_option_copy'),
          iconURL: 'assets/Copy.svg',
          onClick: () => {},
        })
      );
    }

    // Only show edit/delete for own messages
    const sender = message.getSender();
    const isOwnMessage = this.loggedInUser && sender?.getUid() === this.loggedInUser.getUid();

    if (!this.hideEditMessageOption && isOwnMessage && message.getType() === 'text') {
      options.push(
        new CometChatActionsIcon({
          id: 'edit',
          title: CometChatLocalize.getLocalizedString('message_list_option_edit'),
          iconURL: 'assets/edit_icon.svg',
          onClick: () => {},
        })
      );
    }

    if (!this.hideDeleteMessageOption && isOwnMessage) {
      options.push(
        new CometChatActionsIcon({
          id: CometChatUIKitConstants.MessageOption.deleteMessage,
          title: CometChatLocalize.getLocalizedString('message_list_option_delete'),
          iconURL: 'assets/delete.svg',
          onClick: () => {},
        })
      );
    }

    if (!this.hideTranslateMessageOption && message.getType() === 'text') {
      options.push(
        new CometChatActionsIcon({
          id: CometChatUIKitConstants.MessageOption.translateMessage,
          title: CometChatLocalize.getLocalizedString('message_list_option_translate'),
          iconURL: 'assets/translate.svg',
          onClick: () => {},
        })
      );
    }

    if (!this.hideMessageInfoOption && isOwnMessage) {
      options.push(
        new CometChatActionsIcon({
          id: 'info',
          title: CometChatLocalize.getLocalizedString('message_list_option_info'),
          iconURL: 'assets/info_icon.svg',
          onClick: () => {},
        })
      );
    }

    // Add "React to Message" option
    // @see Requirement 5.1 - WHEN a user clicks the "React to Message" option

    // Add "Message Privately" option for group chats and other users' messages
    // @see Requirement 15.1 - Show when hideMessagePrivatelyOption is false and in a group chat
    // @see Requirement 15.3 - NOT available in 1-on-1 chats
    // @see Requirement 15.4 - NOT available for the user's own messages
    if (!this.hideMessagePrivatelyOption && this.group && !isOwnMessage) {
      options.push(
        new CometChatActionsIcon({
          id: CometChatUIKitConstants.MessageOption.sendMessagePrivately,
          title: CometChatLocalize.getLocalizedString('message_list_option_message_privately'),
          iconURL: 'assets/send_message_privately.svg',
          onClick: () => {},
        })
      );
    }

    // Append any additional options provided via input
    if (this.additionalOptions.length > 0) {
      options.push(...this.additionalOptions);
    }

    // If an override callback is provided, let it transform the final options
    if (this.optionsOverride) {
      return this.optionsOverride(message, options);
    }

    return options;
  }

  // ==================== Infinite Scrolling Methods ====================
  /**
   * Sets up IntersectionObservers for infinite scrolling.
   * @see Requirement 6.6 - Use IntersectionObserver to detect when user reaches the top
   */
  private setupIntersectionObservers(): void {
    if (!this.scrollTopAnchor?.nativeElement || !this.scrollBottomAnchor?.nativeElement) {
      return;
    }

    // Disconnect existing observers to avoid duplicates
    this.disconnectObservers();

    // Observer for scroll top (fetch previous messages)
    // rootMargin: '100px 0px 0px 0px' triggers earlier before reaching the top
    // @see Requirement 6.1 - Trigger fetch when user scrolls to top
    this.scrollTopObserver = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && !this.isFetchingPrevious() && this.hasMorePrevious()) {
          this.handleScrollToTop();
        }
      },
      {
        root: this.listContainer?.nativeElement,
        threshold: 0.1,
        rootMargin: '100px 0px 0px 0px', // Trigger earlier for smoother UX
      }
    );
    this.scrollTopObserver.observe(this.scrollTopAnchor.nativeElement);

    // Observer for scroll bottom (fetch next messages)
    this.scrollBottomObserver = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          this.handleScrollToBottom();
        }
      },
      { root: this.listContainer?.nativeElement, threshold: 0.1 }
    );
    this.scrollBottomObserver.observe(this.scrollBottomAnchor.nativeElement);
  }

  /**
   * Handles scroll to top event for fetching previous messages.
   * Stores scroll height before fetch and restores scroll position after fetch
   * to maintain the user's view position.
   * @see Requirement 6.1 - Trigger fetch when user scrolls to top
   * @see Requirement 6.2 - Display loading indicator during fetch
   * @see Requirement 6.3 - Prepend fetched messages to existing list
   * @see Requirement 6.4 - Maintain current scroll position after fetch
   * @see Requirement 6.5 - Stop fetching when no more messages exist
   */
  private async handleScrollToTop(): Promise<void> {
    if (this.isFetchingPrevious()) {
      return;
    }

    // Set loading state - triggers loading indicator display
    // @see Requirement 6.2
    this.isFetchingPrevious.set(true);

    // Store scroll height and scroll position before fetch for position restoration
    // @see Requirement 6.4
    const container = this.listContainer?.nativeElement;
    const scrollHeightBefore = container?.scrollHeight || 0;
    const scrollTopBefore = container?.scrollTop || 0;

    try {
      // Fetch previous messages
      const hasMore = await this.messageListService.fetchPreviousMessages();

      // Update pagination state
      // @see Requirement 6.5 - Stop fetching when no more messages
      this.hasMorePrevious.set(hasMore);

      // Restore scroll position after fetch
      // Use requestAnimationFrame to wait for Angular to render the new messages
      // Then calculate the difference in scroll height and adjust scrollTop
      // @see Requirement 6.4
      if (container) {
        // Wait for Angular change detection and DOM update
        requestAnimationFrame(() => {
          const scrollHeightAfter = container.scrollHeight;
          const scrollHeightDiff = scrollHeightAfter - scrollHeightBefore;
          // Maintain the same view position by adding the height difference
          // to the previous scroll position
          container.scrollTop = scrollTopBefore + scrollHeightDiff;
        });
      }
    } catch (error) {
      CometChatLogger.error('CometChatMessageList', 'Error fetching previous messages:', error);
    } finally {
      this.isFetchingPrevious.set(false);
    }
  }

  /**
   * Handles scroll to bottom event for fetching next messages.
   */
  private handleScrollToBottom(): void {
    if (this.isFetchingNext() || !this.hasMoreNext()) {
      return;
    }

    this.isFetchingNext.set(true);

    this.messageListService
      .fetchNextMessages()
      .then(hasMore => {
        this.hasMoreNext.set(hasMore);
        this.isFetchingNext.set(false);
      })
      .catch(error => {
        CometChatLogger.error('CometChatMessageList', 'Error fetching next messages:', error);
        this.isFetchingNext.set(false);
      });
  }

  /**
   * Saves the current scroll position before loading more messages.
   */
  private saveScrollPosition(): void {
    if (this.listContainer?.nativeElement) {
      this.scrollHeightBeforeLoad = this.listContainer.nativeElement.scrollHeight;
    }
  }

  /**
   * Restores the scroll position after loading more messages.
   */
  private restoreScrollPosition(): void {
    if (this.listContainer?.nativeElement) {
      const newScrollHeight = this.listContainer.nativeElement.scrollHeight;
      const scrollDiff = newScrollHeight - this.scrollHeightBeforeLoad;
      this.listContainer.nativeElement.scrollTop += scrollDiff;
    }
  }

  /**
   * Saves scroll position before a reaction update and schedules restoration
   * after the DOM updates. Prevents Safari scroll shift when reaction rows
   * appear/grow and change the message bubble height.
   */
  private saveScrollPositionForReaction(): void {
    if (!this.listContainer?.nativeElement) return;
    const container = this.listContainer.nativeElement;
    const scrollTopBefore = container.scrollTop;
    const scrollHeightBefore = container.scrollHeight;

    // Use requestAnimationFrame to restore after DOM update
    requestAnimationFrame(() => {
      if (!this.listContainer?.nativeElement) return;
      const scrollHeightAfter = container.scrollHeight;
      const heightDiff = scrollHeightAfter - scrollHeightBefore;
      if (heightDiff !== 0) {
        container.scrollTop = scrollTopBefore + heightDiff;
      }
    });
  }

  /**
   * Disconnects all IntersectionObservers.
   */
  private disconnectObservers(): void {
    this.scrollTopObserver?.disconnect();
    this.scrollBottomObserver?.disconnect();
  }

  // ==================== Scroll Methods ====================
  /**
   * Sets up scroll listeners for sticky date header and scroll-to-bottom button.
   */
  private setupScrollListeners(): void {
    if (!this.listContainer?.nativeElement) {
      return;
    }

    const scrollSubject$ = new Subject<Event>();
    scrollSubject$.pipe(debounceTime(100), takeUntil(this.destroy$)).subscribe(() => {
      this.updateStickyDate();
      this.updateIsAtBottom();
    });

    this.scrollListener = (event: Event) => {
      scrollSubject$.next(event);
    };
    this.listContainer.nativeElement.addEventListener('scroll', this.scrollListener);
  }

  /**
   * Updates the sticky date header based on scroll position.
   */
  private updateStickyDate(): void {
    if (this.hideStickyDate || !this.listContainer?.nativeElement) {
      this.showStickyDateHeader.set(false);
      return;
    }

    const container = this.listContainer.nativeElement;
    const items = this.messagesWithSeparators();

    if (items.length === 0) {
      this.showStickyDateHeader.set(false);
      return;
    }

    // Find the topmost visible message
    const messageElements = container.querySelectorAll('.cometchat-message-list__message');
    for (let i = 0; i < messageElements.length; i++) {
      const element = messageElements[i] as HTMLElement;
      const rect = element.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();

      if (rect.top >= containerRect.top) {
        // This is the topmost visible message — get its index in messagesWithSeparators
        const itemIndex = parseInt(element.dataset['index'] || '0', 10);
        const item = items[itemIndex];
        if (item?.type === 'message' && item.message) {
          this.stickyDateTimestamp.set(item.message.getSentAt());
          this.showStickyDateHeader.set(container.scrollTop > 50);
        }
        break;
      }
    }
  }

  /**
   * Updates whether the user is at the bottom of the list.
   * Hides new messages banner when user scrolls to bottom.
   * Marks unread messages as read when scrolling to bottom.
   * @see Requirement 10.4 - Hide banner when user scrolls to bottom
   * @see Requirements 2.1, 3.1, 4.1 - Use BOTTOM_THRESHOLD for scroll position detection
   * @see Requirements 4.1, 4.2, 4.3 - Mark messages as read when scrolling to bottom
   */
  private updateIsAtBottom(): void {
    if (!this.listContainer?.nativeElement) {
      return;
    }

    const container = this.listContainer.nativeElement;
    const wasAtBottom = this.isAtBottom();
    const isAtBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight < this.BOTTOM_THRESHOLD;

    this.isAtBottom.set(isAtBottom);
    this.showScrollToBottom.set(!isAtBottom);

    // Hide new messages banner and reset count when user scrolls to bottom (Requirement 10.4)
    if (isAtBottom) {
      this.showNewMessagesBanner.set(false);
      this.newMessagesCount.set(0);

      // Mark unread messages as read when scrolling to bottom (Requirements 4.1, 4.2, 4.3)
      if (!wasAtBottom && this.unreadMessages().length > 0) {
        this.markMessagesReadOnScrollToBottom();
      }
    }
  }

  /**
   * Scrolls to the bottom of the message list.
   * @param smooth - Whether to use smooth scrolling
   */
  scrollToBottom(smooth = false): void {
    if (!this.listContainer?.nativeElement) {
      return;
    }

    // Proactively clear unread state and mark messages as read
    // This handles cases where the scroll event guard (!wasAtBottom) might miss
    this.showNewMessagesBanner.set(false);
    this.newMessagesCount.set(0);

    if (this.unreadMessages().length > 0) {
      this.markMessagesReadOnScrollToBottom();
    }

    this.listContainer.nativeElement.scrollTo({
      top: this.listContainer.nativeElement.scrollHeight,
      behavior: smooth ? 'smooth' : 'auto',
    });
  }

  /**
   * Scrolls to the bottom of the message list after initial load.
   * Uses requestAnimationFrame to ensure DOM is painted before scrolling.
   * Includes retry mechanism to handle cases where DOM isn't ready.
   * Uses instant scroll (no smooth animation) for initial load.
   * @see Requirement 4.1 - Scroll to bottom showing latest messages
   * @see Requirement 4.2 - Position scroll at end of list after initial fetch
   * @see Requirement 4.3 - Scroll to bottom when switching conversations
   * @see Requirement 4.4 - Complete scroll after initial message fetch
   */
  private scrollToBottomAfterLoad(): void {
    // Use requestAnimationFrame to ensure DOM is painted
    // Then use setTimeout to allow Angular change detection to complete
    requestAnimationFrame(() => {
      setTimeout(() => {
        this.scrollToBottomWithRetry(3);
      }, 0);
    });
  }

  /**
   * Attempts to scroll to bottom with retry mechanism.
   * Retries if scroll position doesn't reach the bottom.
   * @param retries - Number of retry attempts remaining
   */
  private scrollToBottomWithRetry(retries: number): void {
    if (!this.listContainer?.nativeElement) {
      // If container not available, retry after a short delay
      if (retries > 0) {
        requestAnimationFrame(() => {
          setTimeout(() => this.scrollToBottomWithRetry(retries - 1), 50);
        });
      }
      return;
    }

    const container = this.listContainer.nativeElement;
    const scrollHeightBefore = container.scrollHeight;

    // Perform the scroll
    container.scrollTo({
      top: container.scrollHeight,
      behavior: 'auto',
    });

    // Verify scroll was successful after a frame
    requestAnimationFrame(() => {
      const scrollHeightAfter = container.scrollHeight;
      const isAtBottom =
        container.scrollTop + container.clientHeight >= container.scrollHeight - 10;

      // If scroll height changed (more content rendered) or not at bottom, retry
      if ((scrollHeightAfter !== scrollHeightBefore || !isAtBottom) && retries > 0) {
        setTimeout(() => this.scrollToBottomWithRetry(retries - 1), 50);
      }
    });
  }

  /**
   * Scrolls to a specific message by ID.
   * If the message is not in the DOM, fetches messages around the target ID
   * and retries scrolling after the DOM renders.
   * @param messageId - The ID of the message to scroll to
   */
  scrollToMessage(messageId: string | number): void {
    if (!this.listContainer?.nativeElement) {
      return;
    }

    const messageElement = this.listContainer.nativeElement.querySelector(
      `[data-message-id="${messageId}"]`
    );

    if (messageElement) {
      this.highlightAndScrollToElement(messageElement);
    } else {
      // Message not in DOM — fetch messages around the target ID, then retry scroll
      const numericId = typeof messageId === 'string' ? parseInt(messageId, 10) : messageId;
      if (isNaN(numericId)) return;

      this.messageListService.fetchMessagesAroundId(numericId).then(() => {
        this.cdr.markForCheck();
        this.scrollToMessageWithRetry(messageId, 10);
      }).catch((error) => {
        CometChatLogger.error('CometChatMessageList', 'Error fetching messages around ID for scroll:', error);
      });
    }
  }

  /**
   * Retries scrolling to a message element after DOM renders.
   * Uses requestAnimationFrame + setTimeout for reliable DOM availability.
   */
  private scrollToMessageWithRetry(messageId: string | number, retries: number): void {
    if (retries <= 0 || !this.listContainer?.nativeElement) return;

    requestAnimationFrame(() => {
      setTimeout(() => {
        const messageElement = this.listContainer?.nativeElement?.querySelector(
          `[data-message-id="${messageId}"]`
        );
        if (messageElement) {
          this.highlightAndScrollToElement(messageElement);
        } else if (retries > 1) {
          this.scrollToMessageWithRetry(messageId, retries - 1);
        }
      }, 50);
    });
  }

  /**
   * Scrolls to a message element and applies a temporary highlight animation.
   */
  private highlightAndScrollToElement(element: Element): void {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    element.classList.add('cometchat-message-list__message--highlighted');
    setTimeout(() => {
      element.classList.remove('cometchat-message-list__message--highlighted');
    }, 2000);
  }

  /**
   * Refreshes the message list.
   */
  refreshMessages(): void {
    this.messageListService.cleanup();
    this.initializeService();
  }

  // ==================== Keyboard Navigation Methods ====================
  /**
   * Handles keyboard events for message list navigation.
   * Implements roving tabindex pattern with ListNavigationService.
   * Supports ArrowUp/Down, Home/End navigation and triggers load more at boundaries.
   * @param event - The keyboard event
   * @see Requirements 1.1-1.10
   */
  handleKeydown(event: KeyboardEvent): void {
    // Guard: Skip message navigation when an overlay (popover, emoji keyboard, dialog) is open.
    // This prevents arrow key events from overlays from leaking into message list navigation.
    if (this.focusTrapService.hasActiveTraps() || this.isEventFromOverlay(event)) {
      return;
    }

    const items = this.messagesWithSeparators();
    if (items.length === 0) {
      return;
    }

    // Build list of message-only indices (skip date separators)
    const messageIndices = items
      .map((item, idx) => (item.type === 'message' ? idx : -1))
      .filter(idx => idx !== -1);

    if (messageIndices.length === 0) {
      return;
    }

    // Find current position within message-only indices
    const currentFocused = this.focusedMessageIndex();
    let currentPos = messageIndices.indexOf(currentFocused);
    if (currentPos === -1) {
      currentPos = 0;
    }

    // Navigate within message-only indices using ListNavigationService
    const newPos = this.listNavigationService.handleKeyNavigation(event, currentPos, {
      itemCount: messageIndices.length,
      wrap: false, // Don't wrap - trigger load more at boundaries
    });

    // Handle navigation result
    if (newPos !== -1 && messageIndices[newPos] !== this.focusedMessageIndex()) {
      this.setFocusedIndex(messageIndices[newPos]);

      // Check if we're at the first message and should load older messages
      // @see Requirement 1.7 - Trigger load more at boundaries
      if (newPos === 0 && this.hasMorePrevious() && !this.isFetchingPrevious()) {
        this.announceLoadingMore();
        this.handleScrollToTop();
      }
    }

    // Handle Enter to open message actions
    // @see Requirement 2.2 - Enter opens message actions
    if (event.key === 'Enter') {
      event.preventDefault();
    }

    // Handle Space for media toggle (if message has media)
    // @see Requirement 2.3 - Space toggles media playback
    if (event.key === ' ') {
      const focusedItem = items[this.focusedMessageIndex()];
      if (focusedItem?.message && this.isMediaMessage(focusedItem.message)) {
        event.preventDefault();
        // Media toggle is handled by the message bubble component
      }
    }

    // Handle Escape to clear focus
    if (event.key === 'Escape') {
      event.preventDefault();
      this.focusedMessageIndex.set(-1);
      (document.activeElement as HTMLElement)?.blur();
    }
  }

  /**
   * Checks if a keyboard event originated from within an overlay component.
   * Used by handleKeydown to skip message navigation when an overlay is open.
   * @param event - The keyboard event to check
   * @returns true if the event target is inside an overlay element
   */
  private isEventFromOverlay(event: KeyboardEvent): boolean {
    const target = event.target as HTMLElement;
    if (!target || typeof target.closest !== 'function') {
      return false;
    }
    return !!(
      target.closest('cometchat-emoji-keyboard') ||
      target.closest('.cometchat-popover__content') ||
      target.closest('cometchat-confirm-dialog') ||
      target.closest('cometchat-flag-message-dialog') ||
      target.closest('cometchat-context-menu') ||
      target.closest('[aria-modal="true"]')
    );
  }

  /**
   * Sets the focused index and scrolls message into view.
   * Updates the roving tabindex and focuses the element.
   * @param index - The index of the message to focus
   * @see Requirement 1.6 - Scroll focused message into view
   */
  setFocusedIndex(index: number): void {
    this.focusedMessageIndex.set(index);

    // Scroll message into view and focus
    if (!this.listContainer?.nativeElement) {
      return;
    }

    setTimeout(() => {
      const element = this.listContainer?.nativeElement.querySelector(
        `.cometchat-message-list__message[data-index="${index}"]`
      ) as HTMLElement;
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        element.focus();
      }
    }, 0);
  }

  /**
   * Gets tabindex for a message based on roving tabindex pattern.
   * Only the focused message has tabindex="0", others have tabindex="-1".
   * @param index - The message index
   * @returns 0 if focused, -1 otherwise
   * @see Requirement 1.1 - Roving tabindex pattern
   */
  getMessageTabIndex(index: number): number {
    // If no message is focused yet, make the first message-type item focusable
    if (this.focusedMessageIndex() === -1) {
      const items = this.messagesWithSeparators();
      const firstMessageIndex = items.findIndex(item => item.type === 'message');
      return index === firstMessageIndex ? 0 : -1;
    }
    return this.listNavigationService.getItemTabIndex(index, this.focusedMessageIndex());
  }

  /**
   * Announces loading state via live region.
   * @see Requirement 1.7 - Announce "Loading older messages"
   */
  private announceLoadingMore(): void {
    this.liveAnnouncer.announce(
      CometChatLocalize.getLocalizedString('accessibility_loading_older_messages'),
      'polite'
    );
  }

  /**
   * Announces new message arrival to screen readers.
   * @param senderName - The name of the message sender
   * @param preview - A preview of the message content
   * @see Requirement 20.1 - Announce "New message from [sender]: [message preview]"
   */
  announceNewMessage(senderName: string, preview: string): void {
    const message = CometChatLocalize.getLocalizedString('accessibility_new_message')
      .replace('{sender}', senderName)
      .replace('{preview}', preview);
    this.liveAnnouncer.announce(message, 'polite');
  }

  /**
   * Announces message sent successfully to screen readers.
   * @see Requirement 20.2 - Announce "Message sent"
   */
  announceMessageSent(): void {
    this.liveAnnouncer.announce(
      CometChatLocalize.getLocalizedString('accessibility_message_sent'),
      'polite'
    );
  }

  /**
   * Announces message send failure to screen readers.
   * Uses assertive politeness for immediate announcement.
   * @see Requirement 20.3 - Announce "Message failed to send"
   * @see Requirement 20.8 - Use aria-live="assertive" for errors
   */
  announceMessageFailed(): void {
    this.liveAnnouncer.announceError(
      CometChatLocalize.getLocalizedString('accessibility_message_failed')
    );
  }

  /**
   * Announces message deleted to screen readers.
   * @see Requirement 20.4 - Announce "Message deleted"
   */
  announceMessageDeleted(): void {
    this.liveAnnouncer.announce(
      CometChatLocalize.getLocalizedString('accessibility_message_deleted'),
      'polite'
    );
  }

  /**
   * Announces message edited to screen readers.
   * @see Requirement 20.5 - Announce "Message edited"
   */
  announceMessageEdited(): void {
    this.liveAnnouncer.announce(
      CometChatLocalize.getLocalizedString('accessibility_message_edited'),
      'polite'
    );
  }

  // ==================== Inline Toast Helper ====================
  /**
   * Show an inline toast within the message list.
   * Auto-dismisses after the specified duration.
   */
  showInlineToast(text: string, type: ToastType = ToastType.success, duration = 2000): void {
    if (this.inlineToastTimer) {
      clearTimeout(this.inlineToastTimer);
    }
    this.inlineToastText.set(text);
    this.inlineToastType.set(type);
    this.cdr.markForCheck();

    this.inlineToastTimer = window.setTimeout(() => {
      this.inlineToastText.set(null);
      this.cdr.markForCheck();
    }, duration);
  }

  /** Handle inline toast closed event */
  onInlineToastClosed(): void {
    if (this.inlineToastTimer) {
      clearTimeout(this.inlineToastTimer);
    }
    this.inlineToastText.set(null);
  }

  /**
   * Announces typing indicator to screen readers with debouncing.
   * Uses 1 second debounce to avoid excessive announcements.
   * @param name - The name of the user who is typing
   * @see Requirement 20.6 - Announce "[name] is typing" (debounced)
   */
  announceTyping(name: string): void {
    if (this.typingAnnouncementTimeout) {
      clearTimeout(this.typingAnnouncementTimeout);
    }

    this.typingAnnouncementTimeout = setTimeout(() => {
      const message = CometChatLocalize.getLocalizedString('accessibility_user_typing').replace(
        '{name}',
        name
      );
      this.liveAnnouncer.announce(message, 'polite');
      this.typingAnnouncementTimeout = null;
    }, 1000); // 1 second debounce
  }

  /**
   * Gets a preview of the message content for screen reader announcements.
   * @param message - The message to get a preview for
   * @returns A short preview of the message content
   * @see Requirement 20.1 - Message preview for new message announcements
   */
  private getMessagePreview(message: CometChat.BaseMessage): string {
    const type = message.getType();

    switch (type) {
      case 'text':
        const textMessage = message as CometChat.TextMessage;
        const text = textMessage.getText() || '';
        // Truncate to 50 characters for brevity
        return text.length > 50 ? text.substring(0, 50) + '...' : text;
      case 'image':
        return CometChatLocalize.getLocalizedString('accessibility_message_type_image');
      case 'video':
        return CometChatLocalize.getLocalizedString('accessibility_message_type_video');
      case 'audio':
        return CometChatLocalize.getLocalizedString('accessibility_message_type_audio');
      case 'file':
        return CometChatLocalize.getLocalizedString('accessibility_message_type_file');
      default:
        return CometChatLocalize.getLocalizedString('accessibility_message_type_custom');
    }
  }

  /**
   * Checks if a message is a media message (audio, video, image).
   * @param message - The message to check
   * @returns true if the message is a media message
   */
  private isMediaMessage(message: CometChat.BaseMessage): boolean {
    const type = message.getType();
    return type === 'audio' || type === 'video' || type === 'image';
  }

  /**
   * Focuses the message element at the given index.
   * @param index - The index of the message to focus
   * @deprecated Use setFocusedIndex instead
   */
  private focusMessageAtIndex(index: number): void {
    this.setFocusedIndex(index);
  }

  // ==================== Receipt Handling Methods ====================
  /**
   * Marks messages as read on initial load.
   * Iterates from last message backwards, stops after marking first unread message.
   * @see Requirements 1.1, 1.2, 1.3, 1.4, 1.5
   */
  private async markInitialMessagesAsRead(): Promise<void> {
    const messages = this.messages();
    if (messages.length === 0 || !this.loggedInUser) {
      return;
    }

    // Iterate from last message backwards (Requirement 1.1, 1.2, 1.3)
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];

      // Check if this is an unread receiver message
      if (!msg.getReadAt() && this.isReceiverMessage(msg)) {
        // Found the latest unread message - mark it as read
        try {
          // Make SDK call with this message (Requirement 1.4)
          // SDK will mark this and all previous messages as read automatically
          await this.messageListService.markAsRead(msg);

          // Update local status for this message (Requirement 1.2)
          const messageId = msg.getId();
          if (messageId) {
            this.messageListService.updateLocalReadStatus([messageId]);
          }

          // Notify conversations component to clear unread count
          this.notifyUnreadCountChange(0);
          this.notifyMessagesRead(msg);

          // Stop after marking the first (latest) unread message (Requirement 1.5)
          break;
        } catch (error) {
          CometChatLogger.error(
            'CometChatMessageList',
            'Error marking messages as read on initial load:',
            error
          );
        }
      }
    }
  }

  /**
   * Handles real-time message receipt based on scroll position.
   * If at bottom: marks as read locally and makes SDK call.
   * If not at bottom: increments unread count.
   * @param message - The newly received message
   * @see Requirements 2.1, 2.2, 2.3, 2.4, 3.2, 3.3, 3.4, 12.1, 12.2
   */
  private async handleRealtimeMessageReceipt(message: CometChat.BaseMessage): Promise<void> {
    if (!this.loggedInUser) {
      return;
    }

    // Check if this is a receiver message (Requirement 12.1, 12.2)
    if (!this.isReceiverMessage(message)) {
      return; // Don't mark sender messages as read
    }

    // Check scroll position (Requirement 2.1, 3.1)
    const atBottom = this.isAtBottom();

    if (atBottom) {
      // At bottom: mark as read (Requirements 2.2, 2.3, 2.4)
      const messageId = message.getId();
      if (messageId) {
        this.messageListService.updateLocalReadStatus([messageId]);
      }

      try {
        await this.messageListService.markAsRead(message);
      } catch (error) {
        CometChatLogger.error('CometChatMessageList', 'Error marking message as read:', error);
      }
    } else {
      // Not at bottom: increment unread count (Requirements 3.2, 3.3, 3.4)
      this.unreadMessages.update(msgs => [...msgs, message]);
    }
  }

  /**
   * Marks all unread messages as read when scrolling to bottom.
   * Gets all unread receiver messages, identifies latest,
   * makes single SDK call, updates all locally, and clears unread count.
   * @see Requirements 4.1, 4.2, 4.3, 4.5
   */
  private async markMessagesReadOnScrollToBottom(): Promise<void> {
    const unreadMsgs = this.unreadMessages();
    if (unreadMsgs.length === 0 || !this.loggedInUser) {
      return;
    }

    // Get latest receiver message (Requirement 4.3)
    const latestMessage = this.getLatestReceiverMessage(unreadMsgs);
    if (!latestMessage) {
      return;
    }

    // Get message IDs for batch update
    const messageIds = unreadMsgs
      .map(msg => msg.getId())
      .filter(id => id !== undefined) as number[];

    // Clear unread count (Requirement 4.5)
    this.unreadMessages.set([]);

    // Make single SDK call with latest message (Requirement 4.3)
    try {
      await this.messageListService.markAsRead(latestMessage);

      // Update all unread messages locally using service method (Requirement 4.2)
      this.messageListService.updateLocalReadStatus(messageIds);

      // Notify conversations component (Requirement 8.1)
      this.notifyUnreadCountChange(0);
      this.notifyMessagesRead(latestMessage);
    } catch (error) {
      CometChatLogger.error(
        'CometChatMessageList',
        'Error marking messages as read on scroll to bottom:',
        error
      );
    }
  }

  /**
   * Gets the latest receiver message from a list of messages.
   * Filters to receiver messages only and returns the most recent.
   * @param messages - Array of messages to filter
   * @returns The latest receiver message or null
   * @see Requirements 1.3, 4.3, 11.3
   */
  private getLatestReceiverMessage(
    messages: CometChat.BaseMessage[]
  ): CometChat.BaseMessage | null {
    if (!this.loggedInUser || messages.length === 0) {
      return null;
    }

    // Filter to receiver messages only
    const receiverMessages = messages.filter(msg => this.isReceiverMessage(msg));

    if (receiverMessages.length === 0) {
      return null;
    }

    // Return the last message (most recent)
    return receiverMessages[receiverMessages.length - 1];
  }

  /**
   * Classifies whether a message is a receiver message (from another user).
   * Compares the message sender's UID with the logged-in user's UID.
   * @param message - The message to classify
   * @returns True if the message is from another user (receiver message), false if from logged-in user (sender message)
   * @see Requirement 12.1 - Classify messages as sender or receiver
   */
  private isReceiverMessage(message: CometChat.BaseMessage): boolean {
    if (!this.loggedInUser) {
      return false;
    }

    const sender = message.getSender();
    return sender && sender.getUid() !== this.loggedInUser.getUid();
  }

  /**
   * Classifies whether a message is a sender message (from the logged-in user).
   * Compares the message sender's UID with the logged-in user's UID.
   * @param message - The message to classify
   * @returns True if the message is from the logged-in user (sender message), false if from another user (receiver message)
   * @see Requirement 12.1 - Classify messages as sender or receiver
   */
  private isSenderMessage(message: CometChat.BaseMessage): boolean {
    if (!this.loggedInUser) {
      return false;
    }

    const sender = message.getSender();
    return sender && sender.getUid() === this.loggedInUser.getUid();
  }

  /**
   * Notifies the conversations component of unread count changes.
   * Previously emitted ccUnreadCountChanged; now a no-op as unread count
   * is derived from ccMessageRead (matching React pattern).
   * @param count - The new unread count
   * @see Requirement 8.1
   */
  private notifyUnreadCountChange(count: number): void {
    try {
      // Unread count changes are now derived from ccMessageRead and SDK message listeners
      // (matching React pattern). No separate event is published.
      // The conversations component subscribes to ccMessageRead directly.
    } catch (error) {
      CometChatLogger.error('CometChatMessageList', 'Error emitting unread count change:', error);
    }
  }

  /**
   * Notifies the conversations component that a message was marked as read.
   * Emits ccMessageRead event with the message.
   * @param message - The message that was marked as read
   * @see Requirement 9.1
   */
  private notifyMessagesRead(message: CometChat.BaseMessage): void {
    try {
      CometChatMessageEvents.ccMessageRead.next(message);
    } catch (error) {
      CometChatLogger.error('CometChatMessageList', 'Error emitting message read event:', error);
    }
  }

  /**
   * Gets the conversation ID for the current conversation.
   * @returns The conversation ID (user UID or group GUID)
   */
  private getConversationId(): string | null {
    if (this.user) {
      return this.user.getUid();
    } else if (this.group) {
      return this.group.getGuid();
    }
    return null;
  }

  /**
   * Gets the conversation type for the current conversation.
   * @returns The conversation type ('user' or 'group')
   */
  private getConversationType(): string {
    return this.user ? 'user' : 'group';
  }

  /**
   * Publishes ccActiveChatChanged event on first load with the current user/group.
   * Only publishes once per conversation change and only in non-thread mode.
   * @see Requirement 10.6 - Message_List SHALL publish ccActiveChatChanged on first load
   */
  private publishActiveChatChanged(): void {
    if (!this.isFirstLoad || this.parentMessageId) {
      return;
    }
    this.isFirstLoad = false;

    const messages = this.messages();
    const lastMessage = messages.length > 0 ? messages[messages.length - 1] : undefined;

    CometChatUIEvents.ccActiveChatChanged.next({
      user: this.user,
      group: this.group,
      message: lastMessage,
      unreadMessageCount: 0,
    });
  }

  // ==================== Sound Notification Methods ====================
  /**
   * Handles new messages for sound notifications and auto-scroll.
   * Also tracks the last received message for smart replies.
   * Hides conversation starters when any message is sent or received.
   * Shows new messages banner when user is not at bottom.
   *
   * Scroll behavior:
   * - Own messages: Always scroll to bottom
   * - Other users' messages: Only scroll if already at bottom
   *
   * @param currentMessages - The current messages array
   * @see Requirement 2.2 - Smart replies based on last received message
   * @see Requirement 3.4 - Hide conversation starters when message is sent
   * @see Requirement 3.5 - Hide conversation starters when message is received
   * @see Requirement 10.1 - Display new messages banner when not at bottom
   * @see Requirement 10.2 - Display count of new messages
   */
  private handleNewMessages(currentMessages: CometChat.BaseMessage[]): void {
    if (currentMessages.length === 0 || this.previousMessages.length === 0) {
      // If messages appeared for the first time, hide conversation starters
      if (currentMessages.length > 0 && this.previousMessages.length === 0) {
        this.hideConversationStarters.set(true);

        // On initial load, show smart replies if the very last message is a received message
        // and matches the keyword filter
        const lastMessage = currentMessages[currentMessages.length - 1];
        if (
          lastMessage &&
          this.isReceiverMessage(lastMessage) &&
          this.shouldShowSmartRepliesForMessage(lastMessage)
        ) {
          this.lastReceivedMessage.set(lastMessage);
          this.hideSmartReplies.set(false);
        }
      }
      return;
    }

    // Check if there's a new message
    const latestMessage = currentMessages[currentMessages.length - 1];
    const previousLatest = this.previousMessages[this.previousMessages.length - 1];

    if (latestMessage.getId() !== previousLatest?.getId()) {
      // New message detected - hide conversation starters (Requirement 3.4, 3.5)
      this.hideConversationStarters.set(true);

      const sender = latestMessage.getSender();
      const isOwnMessage = this.loggedInUser && sender?.getUid() === this.loggedInUser.getUid();

      if (!isOwnMessage) {
        // New message from another user - update last received message and show smart replies
        // only if the message matches the keyword filter
        this.lastReceivedMessage.set(latestMessage);
        if (this.shouldShowSmartRepliesForMessage(latestMessage)) {
          this.hideSmartReplies.set(false);
        } else {
          this.hideSmartReplies.set(true);
        }

        // Handle real-time receipt marking (Requirements 2.1-2.5, 3.1-3.5)
        this.handleRealtimeMessageReceipt(latestMessage);

        // Announce new message for screen readers (Requirement 20.1)
        const senderName = sender?.getName() || CometChatLocalize.getLocalizedString('unknown');
        const preview = this.getMessagePreview(latestMessage);
        this.announceNewMessage(senderName, preview);

        // Update new messages banner if user is not at bottom (Requirement 10.1, 10.2)
        if (!this.isAtBottom()) {
          this.newMessagesCount.update(count => count + 1);
          this.showNewMessagesBanner.set(true);
        }
      }

      if (this.shouldPlaySound(latestMessage)) {
        this.playMessageSound();
      }

      // Scroll behavior based on message sender
      if (isOwnMessage) {
        // Always scroll to bottom for own messages
        setTimeout(() => this.scrollToBottom(), 0);
      } else if (this.scrollToBottomOnNewMessages && this.isAtBottom()) {
        // For other users' messages, only scroll if already at bottom
        setTimeout(() => this.scrollToBottom(), 0);
      }
    }
  }

  /**
   * Determines if a sound should be played for a message.
   * @param message - The message to check
   * @returns Whether to play sound
   */
  private shouldPlaySound(message: CometChat.BaseMessage): boolean {
    if (this.effectiveDisableSoundForMessages()) {
      return false;
    }

    // Don't play sound for own messages
    const sender = message.getSender();
    if (this.loggedInUser && sender?.getUid() === this.loggedInUser.getUid()) {
      return false;
    }

    // Check throttle interval
    if (Date.now() - this.lastSoundPlayedAt < this.SOUND_THROTTLE_INTERVAL) {
      return false;
    }

    return true;
  }

  /**
   * Plays the message notification sound.
   */
  private playMessageSound(): void {
    try {
      this.lastSoundPlayedAt = Date.now();
      CometChatSoundManager.play('incomingMessage', this.effectiveCustomSoundForMessages() || null);
    } catch (error) {
      CometChatLogger.error('CometChatMessageList', 'Error playing sound:', error);
    }
  }

  // ==================== Error Handling Methods ====================
  /**
   * Handles errors from the MessageListService.
   * @param error - The error that occurred
   */
  /**
   * Handles errors thrown during lifecycle hooks (ngOnInit, ngAfterViewInit).
   * Sets the component to error state and emits the error.
   * @param error - The error that occurred
   * @param hook - The lifecycle hook name where the error occurred
   * @see Requirement 2.1, 2.2 (Error Boundaries spec)
   */
  private handleLifecycleError(error: unknown, hook: string): void {
    const err = error instanceof Error ? error : new Error(String(error));
    CometChatLogger.error('CometChatMessageList', `Error in ${hook}:`, err);
    this.listState.set(States.error);
    this.error.emit(err as CometChat.CometChatException);
  }

  private handleServiceError(error: Error): void {
    CometChatLogger.error('CometChatMessageList', 'Service error:', error);

    if (!this.effectiveHideError()) {
      this.listState.set(States.error);
      this.error.emit(error as CometChat.CometChatException);
    }
  }

  /**
   * Handles errors caught by the error boundary wrapping individual message bubbles.
   * Logs the error but does NOT set the list to error state — other bubbles continue rendering.
   * @param context - The ErrorContext from the error boundary
   * @see Requirements 5.1, 5.4 (Error Boundaries spec)
   */
  onBubbleError(context: ErrorContext): void {
    CometChatLogger.error(
      'CometChatMessageList',
      `Bubble render error [${context.componentName}]:`,
      context.error
    );
  }

  /**
   * Handles errors that occur during receipt operations.
   * Logs errors for debugging but doesn't show user-facing errors.
   * Calls onError callback if provided.
   * @param error - The error that occurred
   * @param context - Context string describing where the error occurred
   * @see Requirements 10.1, 10.2
   */
  private handleReceiptError(error: CometChat.CometChatException, context: string): void {
    CometChatLogger.error('CometChatMessageList', `Receipt error in ${context}:`, error);

    // Call error callback if provided (but don't show user-facing errors for receipts)
    if (error instanceof CometChat.CometChatException) {
      this.error.emit(error);
    }
  }

  /**
   * Marks messages as read with retry logic.
   * Implements exponential backoff with maximum 2 retries.
   * Logs failures after retries are exhausted.
   * @param message - The message to mark as read
   * @param retryCount - Current retry attempt (default 0)
   * @see Requirements 10.1, 10.2
   */
  private async markAsReadWithRetry(message: CometChat.BaseMessage, retryCount = 0): Promise<void> {
    const MAX_RETRIES = 2;
    const RETRY_DELAYS = [1000, 2000]; // 1s, 2s exponential backoff

    try {
      await this.messageListService.markAsRead(message);
    } catch (error) {
      if (retryCount < MAX_RETRIES) {
        // Retry with exponential backoff
        const delay = RETRY_DELAYS[retryCount];
        console.warn(
          `[CometChatMessageList] Retrying markAsRead after ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`
        );

        await new Promise(resolve => setTimeout(resolve, delay));
        return this.markAsReadWithRetry(message, retryCount + 1);
      } else {
        // Retries exhausted, log failure
        this.handleReceiptError(error as CometChat.CometChatException, 'markAsReadWithRetry');
      }
    }
  }

  /**
   * Safely checks scroll position with error handling.
   * Wraps scroll position detection in try-catch.
   * Defaults to "at bottom" on error to prevent receipt marking issues.
   * @returns Whether the user is at the bottom of the list
   * @see Requirements 10.1, 10.2
   */
  private safeCheckScrollPosition(): boolean {
    try {
      return this.isAtBottom();
    } catch (error) {
      CometChatLogger.error('CometChatMessageList', 'Error checking scroll position:', error);
      // Default to "at bottom" on error to ensure receipts are marked
      return true;
    }
  }

  /**
   * Safely emits unread count change event with error handling.
   * Wraps event emission in try-catch.
   * Continues execution on emission failure.
   * @param count - The new unread count
   * @see Requirements 10.1, 10.2
   */
  private safeEmitUnreadCountChange(count: number): void {
    try {
      this.notifyUnreadCountChange(count);
    } catch (error) {
      CometChatLogger.error('CometChatMessageList', 'Error emitting unread count change:', error);
      // Continue execution - event emission failure shouldn't break functionality
    }
  }

  /**
   * Handles retry click for error state.
   * Resets state to loading and re-initializes the message list.
   * @see Requirement 3.3 - Reset state to States.loading and re-initialize
   */
  handleRetryClick(): void {
    this.listState.set(States.loading);
    this.messageListService.clearError();
    this.refreshMessages();
  }

  // ==================== Smart Replies Methods ====================
  /**
   * Hides smart replies when user starts typing.
   * Called by the message composer or parent component.
   * @see Requirement 2.7 - Hide when user starts typing
   */
  onUserTyping(): void {
    // this.hideSmartReplies.set(true);
  }

  /**
   * Hides smart replies and conversation starters when a message is sent.
   * Called by the message composer or parent component.
   * @see Requirement 2.8 - Hide smart replies when a new message is sent
   * @see Requirement 3.4 - Hide conversation starters when a message is sent
   */
  onMessageSent(): void {
    this.hideSmartReplies.set(true);
    this.hideConversationStarters.set(true);
  }

  /**
   * Handles smart reply click event.
   * Emits the smartReplyClick event and hides smart replies.
   * @param reply - The reply text that was clicked
   * @see Requirement 2.6 - Emit smartReplyClick event when clicked
   */
  onSmartReplyClick(reply: string): void {
    this.smartReplyClick.emit(reply);
    this.hideSmartReplies.set(true);
    // Send the reply text to the composer via ccComposeMessage event
    CometChatUIEvents.ccComposeMessage.next(reply);
  }
  /**
   * Handles close button click on smart replies panel.
   */
  onSmartRepliesClose(): void {
    this.hideSmartReplies.set(true);
  }

  /**
   * Checks if a message matches the smart replies keywords filter.
   * If smartRepliesKeywords is empty, returns true (show for all received messages).
   * Otherwise, checks if the message text contains any of the keywords (case-insensitive).
   * @param message - The received message to check
   * @returns true if smart replies should be shown for this message
   * @see Requirement 15.3
   */
  private shouldShowSmartRepliesForMessage(message: CometChat.BaseMessage): boolean {
    // If no keywords configured, show for every received message
    if (!this.smartRepliesKeywords || this.smartRepliesKeywords.length === 0) {
      return true;
    }

    // Only text messages can match keywords
    if (message.getType() !== 'text') {
      return false;
    }

    const textMessage = message as CometChat.TextMessage;
    const text = textMessage.getText()?.toLowerCase() || '';

    return this.smartRepliesKeywords.some(keyword => text.includes(keyword.toLowerCase()));
  }

  /**
   * Handles conversation starter click event.
   * Emits the conversationStarterClick event and hides conversation starters.
   * @param starter - The starter text that was clicked
   * @see Requirement 3.3 - Emit conversationStarterClick event when clicked
   */
  onConversationStarterClick(starter: string): void {
    this.conversationStarterClick.emit(starter);
    this.hideConversationStarters.set(true);
    // Send the starter text to the composer via ccComposeMessage event
    CometChatUIEvents.ccComposeMessage.next(starter);
  }

  /**
   * Handles new messages banner click event.
   * Scrolls to the bottom and hides the banner.
   * @see Requirement 10.3 - Scroll to newest message when banner is clicked
   */
  onNewMessagesBannerClick(): void {
    this.scrollToBottom();
    this.showNewMessagesBanner.set(false);
    this.newMessagesCount.set(0);
  }

  // ==================== Delete Confirmation Methods ====================
  /**
   * Shows the delete confirmation dialog for a message.
   * Called when the delete option is selected from message options.
   * @param message - The message to delete
   * @see Requirement 12.6 - Show confirmation dialog before deleting
   */
  showDeleteConfirmation(message: CometChat.BaseMessage): void {
    this.messageToDelete.set(message);
    this.showDeleteConfirmDialog.set(true);
  }

  /**
   * Handles the delete confirmation.
   * Calls the SDK to delete the message and updates the UI.
   * @see Requirement 12.5 - Call SDK's deleteMessage API
   * @see Requirement 12.6 - Show confirmation dialog before deleting
   * @see Requirement 20.4 - Announce "Message deleted"
   */
  async handleDeleteConfirm(): Promise<void> {
    const message = this.messageToDelete();
    if (!message) {
      return;
    }

    this.isDeleting.set(true);
    const messageId = message.getId();

    try {
      // Call SDK to delete the message (SDK expects string)
      await CometChat.deleteMessage(String(messageId));

      // Mark the message as deleted locally
      this.messageListService.deleteMessage(messageId);

      // Emit the ccMessageDeleted event for other components
      // Clone the message with deletedAt set so consumers (e.g., conversations list)
      // can detect it as deleted and update the last message subtitle accordingly.
      const deletedMessage = Object.create(
        Object.getPrototypeOf(message),
        Object.getOwnPropertyDescriptors(message)
      ) as CometChat.BaseMessage;
      deletedMessage.setDeletedAt(Math.floor(Date.now() / 1000));
      CometChatMessageEvents.ccMessageDeleted.next(deletedMessage);

      // Announce deletion for screen readers (Requirement 20.4)
      this.announceMessageDeleted();

      // Show success toast notification
      this.showInlineToast(CometChatLocalize.getLocalizedString('message_list_message_deleted'));

      // Close the dialog
      this.showDeleteConfirmDialog.set(false);
      this.messageToDelete.set(null);
    } catch (error) {
      CometChatLogger.error('CometChatMessageList', 'Error deleting message:', error);
      this.error.emit(error as CometChat.CometChatException);
    } finally {
      this.isDeleting.set(false);
    }
  }

  /**
   * Handles the delete cancellation.
   * Closes the dialog without deleting.
   */
  handleDeleteCancel(): void {
    this.showDeleteConfirmDialog.set(false);
    this.messageToDelete.set(null);
  }

  /**
   * Gets the localized title for the delete confirmation dialog.
   * @returns The localized title string
   */
  getDeleteDialogTitle(): string {
    return CometChatLocalize.getLocalizedString('message_delete_title');
  }

  /**
   * Gets the localized subtitle for the delete confirmation dialog.
   * @returns The localized subtitle string
   */
  getDeleteDialogSubtitle(): string {
    return CometChatLocalize.getLocalizedString('message_delete_subtitle');
  }

  /**
   * Gets the localized confirm button text for the delete confirmation dialog.
   * @returns The localized confirm button text
   */
  getDeleteDialogConfirmText(): string {
    return CometChatLocalize.getLocalizedString('message_delete_confirm_yes');
  }

  /**
   * Gets the localized cancel button text for the delete confirmation dialog.
   * @returns The localized cancel button text
   */
  getDeleteDialogCancelText(): string {
    return CometChatLocalize.getLocalizedString('message_delete_confirm_no');
  }

  // ==================== Flag Message Methods ====================
  /**
   * Shows the flag message dialog for a message.
   * Called when the flag/report option is selected from message options.
   * @param message - The message to flag
   * @see Requirement 9.1 - WHEN `hideFlagMessageOption` is false, THE Message_Options SHALL include a "Flag Message" option
   * @see Requirement 9.2 - THE Flag_Message_Dialog SHALL display a confirmation prompt
   */
  showFlagConfirmation(message: CometChat.BaseMessage): void {
    this.messageToFlag.set(message);
    this.showFlagMessageDialog.set(true);
  }

  /**
   * Handles the flag message confirmation.
   * Calls the SDK to flag the message and shows a toast notification.
   * @param event - The event containing the message and optional remark
   * @see Requirement 9.4 - THE Flag_Message_Dialog SHALL emit a `flagMessage` event when confirmed
   * @see Requirement 9.5 - THE Message_List_Component SHALL call the SDK's flag message API
   * @see Requirement 9.6 - THE Message_List_Component SHALL display a toast notification on successful flagging
   */
  async handleFlagConfirm(event: {
    message: CometChat.BaseMessage;
    remark: string;
  }): Promise<void> {
    const { message, remark } = event;

    this.isFlagging.set(true);

    try {
      // Call SDK to flag the message (Requirement 9.5)
      await this.messageListService.flagMessage(message, remark);

      // Show success toast notification (Requirement 9.6)
      this.showInlineToast(CometChatLocalize.getLocalizedString('flag_message_reported'));

      // Close the dialog
      this.showFlagMessageDialog.set(false);
      this.messageToFlag.set(null);
    } catch (error) {
      CometChatLogger.error('CometChatMessageList', 'Error flagging message:', error);
      this.error.emit(error as CometChat.CometChatException);

      // Show error toast notification
      this.showInlineToast(CometChatLocalize.getLocalizedString('flag_message_error'), ToastType.error, 3000);
    } finally {
      this.isFlagging.set(false);
    }
  }

  /**
   * Handles the flag message cancellation.
   * Closes the dialog without flagging.
   */
  handleFlagCancel(): void {
    this.showFlagMessageDialog.set(false);
    this.messageToFlag.set(null);
  }

  // ==================== Private Message Methods ====================
  /**
   * Handles the "Message Privately" option click.
   * Emits the messagePrivatelyClick event with the message and sender user.
   * Only works in group chats for other users' messages.
   * @param message - The message whose sender should be messaged privately
   * @see Requirement 15.2 - Emit messagePrivatelyClick event when clicked
   * @see Requirement 15.3 - NOT available in 1-on-1 chats
   * @see Requirement 15.4 - NOT available for the user's own messages
   */
  handleMessagePrivately(message: CometChat.BaseMessage): void {
    // Only available in group chats (Requirement 15.3)
    if (!this.group) {
      return;
    }

    const sender = message.getSender();

    // Only available for other users' messages (Requirement 15.4)
    if (!sender || (this.loggedInUser && sender.getUid() === this.loggedInUser.getUid())) {
      return;
    }

    // Publish ccOpenChat event for cross-component communication
    // @see Requirement 10.5 - Message_List SHALL publish ccOpenChat when user avatar is clicked
    CometChatUIEvents.ccOpenChat.next({
      user: sender,
    });

    // Emit the messagePrivatelyClick event (Requirement 15.2)
    this.messagePrivatelyClick.emit({
      message,
      user: sender,
    });
  }

  // ==================== Message Option Handlers ====================
  /**
   * Handles option click events from message bubbles.
   * Routes the option to the appropriate handler based on option ID.
   * @param option - The context menu item that was clicked
   * @param message - The message the option was clicked on
   * @see Requirement 13.1, 13.2, 13.3
   * @see Requirement 16.2 - Emit replyClick event when reply is clicked
   */
  handleOptionClick(option: ContextMenuItem, message: CometChat.BaseMessage): void {
    switch (option.id) {
      case CometChatUIKitConstants.MessageOption.copyMessage:
        this.copyMessageToClipboard(message);
        break;
      case CometChatUIKitConstants.MessageOption.deleteMessage:
        this.showDeleteConfirmation(message);
        break;
      case CometChatUIKitConstants.MessageOption.translateMessage:
        this.translateMessage(message);
        break;
      case CometChatUIKitConstants.MessageOption.flagMessage:
        this.showFlagConfirmation(message);
        break;
      case CometChatUIKitConstants.MessageOption.sendMessagePrivately:
        this.handleMessagePrivately(message);
        break;
      case CometChatUIKitConstants.MessageOption.replyMessage:
        // Handle reply message option
        // @see Requirement 6.1 - Emit reply event when reply option is clicked
        this.onReplyMessage(message.getId());
        break;
      case CometChatUIKitConstants.MessageOption.editMessage:
        // Handle edit message option
        // @see Requirement 5.1 - Emit edit event when edit option is clicked
        this.onEditMessage(message.getId());
        break;
      case 'info':
      case CometChatUIKitConstants.MessageOption.messageInformation:
        // Handle message info option
        // @see Requirement 7.1 - Open Message_Information component when info option is clicked
        this.onMessageInfo(message.getId());
        break;
      case CometChatUIKitConstants.MessageOption.reactToMessage:
        this.showEmojiKeyboardForMessage(message);
        break;
      case CometChatUIKitConstants.MessageOption.replyInThread:
        this.threadRepliesClick.emit(message);
        break;
      // Other options can be handled here or emitted to parent
      default:
        // For other options, they can be handled by parent components
        break;
    }
  }

  /**
   * Shows the emoji keyboard popover for reacting to a message.
   * Sets the emojiKeyboardMessage signal which triggers the popover in the template.
   * @param message - The message to react to
   * @see Requirement 5.1 - Display Emoji_Keyboard when "React to Message" option is clicked
   */
  showEmojiKeyboardForMessage(message: CometChat.BaseMessage): void {
    this.emojiKeyboardMessage.set(message);
    // Delay position calculation to ensure the context menu popover has fully
    // closed and the DOM is stable before querying element positions
    requestAnimationFrame(() => {
      this.calculateEmojiKeyboardPosition(message);
    });
  }

  /**
   * Calculates the position for the emoji keyboard relative to the message bubble.
   * Places it on the left side of outgoing (sender) bubbles and right side of incoming (receiver) bubbles.
   * Clamps vertically to stay within the message list container.
   */
  private calculateEmojiKeyboardPosition(message: CometChat.BaseMessage): void {
    const messageId = message.getId() || message.getMuid();
    const container = this.listContainer?.nativeElement;
    if (!container || !messageId) return;

    // Get the root .cometchat-message-list element (positioning parent)
    const rootEl = container.closest('.cometchat-message-list') as HTMLElement;
    if (!rootEl) return;

    const msgWrapper = container.querySelector(`[data-message-id="${messageId}"]`) as HTMLElement;
    if (!msgWrapper) return;

    // Find the actual bubble element inside the wrapper for accurate positioning
    const bubbleEl = msgWrapper.querySelector('.cometchat-message-bubble') as HTMLElement;
    const msgRect = bubbleEl
      ? bubbleEl.getBoundingClientRect()
      : msgWrapper.getBoundingClientRect();
    const rootRect = rootEl.getBoundingClientRect();
    const alignment = this.getMessageAlignment(message);
    const isOutgoing = alignment === MessageBubbleAlignment.right;

    // Emoji keyboard dimensions
    const kbWidth = 340;
    const kbHeight = 350;
    const gap = 8;

    // Use smaller width on narrow screens
    const availableWidth = rootRect.width;
    const effectiveKbWidth = Math.min(kbWidth, availableWidth - 16);

    let left: number;

    if (isOutgoing) {
      // Sender (outgoing) bubble is right-aligned: open keyboard on LEFT side
      left = msgRect.left - rootRect.left - effectiveKbWidth - gap;
      if (left < 0) {
        left = gap;
      }
    } else {
      // Receiver (incoming) bubble is left-aligned: open keyboard on RIGHT side
      left = msgRect.right - rootRect.left + gap;
      if (left + effectiveKbWidth > availableWidth) {
        left = availableWidth - effectiveKbWidth - gap;
      }
    }

    // Clamp left to stay within bounds
    left = Math.max(0, Math.min(left, availableWidth - effectiveKbWidth));

    // Vertical: center on the message bubble, clamped to root element bounds
    const msgCenterY = msgRect.top - rootRect.top + msgRect.height / 2;
    let top = msgCenterY - kbHeight / 2;

    // Clamp so keyboard stays within the root element
    top = Math.max(0, Math.min(top, rootRect.height - kbHeight));

    this.emojiKeyboardPosition.set({ top, left, side: isOutgoing ? 'left' : 'right' });
  }

  /**
   * Handles emoji selection from the emoji keyboard.
   * Captures the message reference before closing the keyboard, validates the messageId,
   * and adds the reaction via MessageListService with proper error handling.
   * @param emoji - The selected emoji character
   * @see Requirement 5.2 - Add reaction to message via MessageListService
   * @see Requirement 5.3 - Close Emoji_Keyboard after selection
   */
  async onEmojiSelected(emoji: string): Promise<void> {
    // Capture message reference before clearing the keyboard state
    const message = this.emojiKeyboardMessage();

    // Always close the emoji keyboard immediately
    this.emojiKeyboardMessage.set(null);
    this.emojiKeyboardPosition.set(null);

    if (!message) {
      console.warn('[CometChatMessageList] onEmojiSelected: No message reference available');
      return;
    }

    const messageId = message.getId();
    if (!messageId || messageId <= 0) {
      console.warn('[CometChatMessageList] onEmojiSelected: Invalid messageId', messageId);
      return;
    }

    try {
      // Save scroll position before reaction update to prevent Safari scroll shift
      this.saveScrollPositionForReaction();
      await this.messageListService.addReaction(messageId, emoji);
    } catch (error) {
      CometChatLogger.error(
        'CometChatMessageList',
        'onEmojiSelected: Failed to add reaction',
        error
      );
    }
  }

  /**
   * Handles closing the emoji keyboard popover.
   * Clears the emojiKeyboardMessage signal.
   */
  onEmojiKeyboardClose(): void {
    this.emojiKeyboardMessage.set(null);
    this.emojiKeyboardPosition.set(null);
  }

  /**
   * Handles reaction click from the message bubble.
   * Toggles the reaction: removes if already reacted by the logged-in user, adds otherwise.
   * Emits the reactionClick output event.
   * @param event - The reaction click event containing the reaction and message
   * @see Requirement 2.1 - Remove reaction if already reacted
   * @see Requirement 2.2 - Add reaction if not yet reacted
   * @see Requirement 2.3 - Optimistic update via MessageListService
   */
  async onBubbleReactionClick(event: {
    reaction: CometChat.ReactionCount;
    message: CometChat.BaseMessage;
  }): Promise<void> {
    const { reaction, message } = event;
    // Save scroll position before reaction update to prevent Safari scroll shift
    this.saveScrollPositionForReaction();
    try {
      if (reaction.getReactedByMe()) {
        await this.messageListService.removeReaction(message.getId(), reaction.getReaction());
      } else {
        await this.messageListService.addReaction(message.getId(), reaction.getReaction());
      }
    } catch (error) {
      // Gracefully handle reaction errors — don't show full error state
      // The service already handles optimistic rollback
      CometChatLogger.error(
        'CometChatMessageList',
        'onBubbleReactionClick: Reaction operation failed',
        error
      );
    }
    this.reactionClick.emit(event);
  }

  /**
   * Handles reaction list item click from the message bubble.
   * Removes the user's reaction via the service and forwards the event.
   * @param event - The reaction list item click event
   * @see Requirement 4.4
   */
  async onBubbleReactionListItemClick(event: {
    reaction: CometChat.Reaction;
    message: CometChat.BaseMessage;
  }): Promise<void> {
    const { reaction, message } = event;
    // Save scroll position before reaction update to prevent Safari scroll shift
    this.saveScrollPositionForReaction();
    try {
      // Remove the user's reaction via the service
      await this.messageListService.removeReaction(message.getId(), reaction.getReaction());
    } catch (error) {
      // Gracefully handle reaction errors — don't show full error state
      // The service already handles optimistic rollback
      CometChatLogger.error(
        'CometChatMessageList',
        'onBubbleReactionListItemClick: Reaction removal failed',
        error
      );
    }
    this.reactionListItemClick.emit(event);
  }

  /**
   * Handles the edit message action.
   * Finds the message by ID and emits an edit event for the composer to handle.
   * Only works for text messages owned by the logged-in user.
   * @param messageId - The ID of the message to edit
   * @see Requirement 5.1 - Emit edit event when edit option is clicked on own text message
   */
  onEditMessage(messageId: number): void {
    const message = this.messages().find(m => m.getId() === messageId);
    if (message && message instanceof CometChat.TextMessage) {
      // Emit event for composer to handle
      // @see Requirement 10.2 - Message_List SHALL publish ccMessageEdited with inprogress when user initiates edit
      // Include parentMessageId to scope the edit event to the correct context (thread vs main)
      CometChatMessageEvents.ccMessageEdited.next({
        message: message,
        status: MessageStatus.inprogress,
        parentMessageId: this.parentMessageId ?? null,
      });
    }
  }

  /**
   * Handles the reply message action.
   * Finds the message by ID and emits a reply event for the composer to handle.
   * Works for any message type.
   * @param messageId - The ID of the message to reply to
   * @see Requirement 6.1 - Emit reply event when reply option is clicked on any message
   */
  onReplyMessage(messageId: number): void {
    const message = this.messages().find(m => m.getId() === messageId);
    if (message) {
      // Emit event for composer to handle via CometChatMessageEvents
      // @see Requirement 6.1 - Message_List SHALL emit a reply event with the message
      CometChatMessageEvents.ccReplyToMessage.next({
        message: message,
        status: MessageStatus.inprogress,
      });
      // Also emit the output event for parent components
      this.replyClick.emit(message);
    }
  }

  /**
   * Handles the message info action.
   * Finds the message by ID and opens the message information panel.
   * Works for any message type.
   * @param messageId - The ID of the message to show info for
   * @see Requirement 7.1 - Open Message_Information component when info option is clicked
   */
  onMessageInfo(messageId: number): void {
    const message = this.messages().find(m => m.getId() === messageId);
    if (message) {
      this.messageForInfo.set(message);
      this.showMessageInfo.set(true);
    }
  }

  /**
   * Closes the message information panel.
   * Resets the message info state signals.
   * @see Requirement 7.6 - Hide Message_Information component when user closes the info panel
   */
  closeMessageInfo(): void {
    this.showMessageInfo.set(false);
    this.messageForInfo.set(null);
  }

  /**
   * Copies the message text to the clipboard.
   * Shows a toast notification on success or error.
   * Only works for text messages.
   * @param message - The message to copy
   * @see Requirement 13.2 - Copy message text to clipboard
   * @see Requirement 13.3 - Display toast notification on successful copy
   * @see Requirement 13.4 - Only available for text messages
   */
  async copyMessageToClipboard(message: CometChat.BaseMessage): Promise<void> {
    // Only copy text messages (Requirement 13.4)
    if (message.getType() !== CometChatUIKitConstants.MessageTypes.text) {
      return;
    }

    try {
      // Get the text content from the message
      const textMessage = message as CometChat.TextMessage;
      const text = textMessage.getText();

      if (!text) {
        return;
      }

      // Use the Clipboard API to copy the text (Requirement 13.2)
      await navigator.clipboard.writeText(text);

      // Show success toast notification (Requirement 13.3)
      this.showInlineToast(CometChatLocalize.getLocalizedString('message_list_message_copied'));
    } catch (error) {
      CometChatLogger.error('CometChatMessageList', 'Error copying message to clipboard:', error);
      // Show error toast notification
      this.showInlineToast(CometChatLocalize.getLocalizedString('message_copy_error'), ToastType.error, 3000);
    }
  }

  // ==================== Translation Methods ====================
  /**
   * Translates a message to the user's preferred language.
   * Shows a toast notification on success or error.
   * Only works for text messages.
   * @param message - The message to translate
   * @see Requirement 14.1 - Add translate option to message options
   * @see Requirement 14.2 - Call translation API
   * @see Requirement 14.3 - Display original and translated text
   * @see Requirement 14.4 - Cache translated messages
   * @see Requirement 14.5 - Use user's preferred language setting
   */
  async translateMessage(message: CometChat.BaseMessage): Promise<void> {
    // Only translate text messages
    if (message.getType() !== CometChatUIKitConstants.MessageTypes.text) {
      return;
    }

    const messageId = message.getId();
    const language = this.preferredTranslationLanguage();

    // Check if already translated
    if (this.translatedMessages().has(messageId)) {
      // Toggle off - remove translation
      this.translatedMessages.update(map => {
        const newMap = new Map(map);
        newMap.delete(messageId);
        return newMap;
      });
      return;
    }

    // Check if already translating
    if (this.translatingMessages().has(messageId)) {
      return;
    }

    // Mark as translating
    this.translatingMessages.update(set => {
      const newSet = new Set(set);
      newSet.add(messageId);
      return newSet;
    });

    try {
      // Call the translation API via MessageListService
      const translatedText = await this.messageListService.translateMessage(message, language);

      // Store the translated text
      this.translatedMessages.update(map => {
        const newMap = new Map(map);
        newMap.set(messageId, translatedText);
        return newMap;
      });

      // Show success toast notification
      this.showInlineToast(CometChatLocalize.getLocalizedString('message_list_message_translated'));
    } catch (error) {
      CometChatLogger.error('CometChatMessageList', 'Error translating message:', error);
      // Show error toast notification
      this.showInlineToast(CometChatLocalize.getLocalizedString('message_translate_error'), ToastType.error, 3000);
    } finally {
      // Remove from translating set
      this.translatingMessages.update(set => {
        const newSet = new Set(set);
        newSet.delete(messageId);
        return newSet;
      });
    }
  }

  /**
   * Gets the translated text for a message if available.
   * @param messageId - The ID of the message
   * @returns The translated text or undefined if not translated
   * @see Requirement 14.3 - Display original and translated text
   */
  getTranslatedText(messageId: number): string | undefined {
    return this.translatedMessages().get(messageId);
  }

  /**
   * Checks if a message is currently being translated.
   * @param messageId - The ID of the message
   * @returns True if the message is being translated
   */
  isMessageTranslating(messageId: number): boolean {
    return this.translatingMessages().has(messageId);
  }

  /**
   * Checks if a message has been translated.
   * @param messageId - The ID of the message
   * @returns True if the message has been translated
   * @see Requirement 14.3 - Display original and translated text
   */
  isMessageTranslated(messageId: number): boolean {
    return this.translatedMessages().has(messageId);
  }

  /**
   * Gets the default translation language based on browser settings.
   * @returns The language code (e.g., 'en', 'es', 'fr')
   * @see Requirement 14.5 - Use user's preferred language setting
   */
  private getDefaultTranslationLanguage(): string {
    // Get browser language (e.g., 'en-US' -> 'en')
    const browserLang = navigator.language?.split('-')[0] || 'en';
    return browserLang;
  }

  /**
   * Sets the preferred translation language.
   * @param language - The language code (e.g., 'en', 'es', 'fr')
   * @see Requirement 14.5 - Use user's preferred language setting
   */
  setPreferredTranslationLanguage(language: string): void {
    this.preferredTranslationLanguage.set(language);
  }

  // ==================== Utility Methods ====================
  /**
   * TrackBy function for ngFor optimization.
   * @param index - The index of the item
   * @param item - The MessageListItem
   * @returns Unique key for the item
   */
  trackByItem(_index: number, item: MessageListItem): string {
    return item.key;
  }

  /**
   * TrackBy function for messages.
   * @param index - The index of the message
   * @param message - The message
   * @returns Unique key for the message
   */
  trackByMessage(_index: number, message: CometChat.BaseMessage): string | number {
    return message.getId() || message.getMuid();
  }
}
