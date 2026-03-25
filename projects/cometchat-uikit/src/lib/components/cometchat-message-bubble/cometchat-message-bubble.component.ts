/**
 * CometChatMessageBubble Component
 *
 * A flexible, configurable container component for rendering different types of messages
 * (text, image, video, audio, file, action, deleted) with support for message options,
 * status indicators, reply previews, and thread views.
 *
 * Features:
 * - Configurable view slots (leadingView, headerView, replyView, contentView, etc.)
 * - Message options context menu with hover/click behavior
 * - Automatic content rendering based on message type
 * - Group vs 1-on-1 conversation handling
 * - Sender/receiver alignment styling
 * - Full accessibility support
 *
 * @module components/cometchat-message-bubble
 * @see Requirements 1.1, 1.2, 1.3, 1.4, 1.5
 */

import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  OnDestroy,
  AfterViewInit,
  SimpleChanges,
  TemplateRef,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  inject,
  ViewChild,
  ElementRef,
  computed,
  signal,
  booleanAttribute,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { DatePipe } from '@angular/common';
import { Subscription } from 'rxjs';

import { TranslatePipe } from '../../resources/CometChatLocalize/translate.pipe';
import { CometChatLocalize } from '../../resources/CometChatLocalize/cometchat-localize';
import { MessageBubbleAlignment, Placement } from '../../Enums/Enums';
import { CometChatActionsIcon } from '../../modals/CometChatActionsIcon';
import { CometChatActionsView } from '../../modals/CometChatActionsView';
import { CometChatTextFormatter } from '../../formatters/cometchat-text-formatter';
import { CometChatUIKit } from '../../cometchat-uikit';
import { CometChatUIKitConstants } from '../../constants';
import { MessageUtilsService } from '../../services/message-utils.service';
import {
  MessageBubbleConfigService,
  BubblePart,
} from '../../services/message-bubble-config.service';
import { COMETCHAT_GLOBAL_CONFIG, GlobalConfig } from '../../services/global-config.service';
import { CallButtonsService } from '../../services/call-buttons.service';
import { CalendarObject } from '../../resources/CometChatLocalize/localization.interfaces';

// Import supporting components
import {
  CometChatContextMenuComponent,
  ContextMenuItem,
} from '../base-elements/cometchat-context-menu/cometchat-context-menu.component';
import { CometChatAvatarComponent } from '../base-elements/cometchat-avatar/cometchat-avatar.component';
import { CometChatDateComponent } from '../base-elements/cometchat-date/cometchat-date.component';
import { CometChatTextBubbleComponent } from '../cometchat-text-bubble/cometchat-text-bubble.component';
import { CometChatImageBubbleComponent } from '../cometchat-image-bubble/cometchat-image-bubble.component';
import { CometChatVideoBubbleComponent } from '../cometchat-video-bubble/cometchat-video-bubble.component';
import { CometChatAudioBubbleComponent } from '../cometchat-audio-bubble/cometchat-audio-bubble.component';
import { CometChatFileBubbleComponent } from '../cometchat-file-bubble/cometchat-file-bubble.component';
import { CometChatDeleteBubbleComponent } from '../cometchat-delete-bubble/cometchat-delete-bubble.component';
import { CometChatActionBubbleComponent } from '../cometchat-action-bubble/cometchat-action-bubble.component';
import { CometChatMessagePreviewComponent } from '../base-elements/cometchat-message-preview/cometchat-message-preview.component';
import { CometChatThreadViewComponent } from '../base-elements/cometchat-thread-view/cometchat-thread-view.component';
import { CometChatPollBubbleComponent } from '../cometchat-poll-bubble/cometchat-poll-bubble.component';
import { CometChatCollaborativeDocumentBubbleComponent } from '../cometchat-collaborative-document-bubble/cometchat-collaborative-document-bubble.component';
import { CometChatCollaborativeWhiteboardBubbleComponent } from '../cometchat-collaborative-whiteboard-bubble/cometchat-collaborative-whiteboard-bubble.component';
import { CometChatStickerBubbleComponent } from '../cometchat-sticker-bubble/cometchat-sticker-bubble.component';
import { CometChatCallBubbleComponent } from '../cometchat-call-bubble/cometchat-call-bubble.component';
import { CallButtonClickEvent } from '../cometchat-call-bubble/cometchat-call-bubble.component';
import { CometChatReactionsComponent } from '../cometchat-reactions';

/**
 * Mapping of message type/category combinations to CSS class names.
 * Used to apply type-specific styling to message bubbles.
 *
 * @see Requirements 4.1-4.7
 */
const BUBBLE_TYPE_MAP: Record<string, string> = {
  text_message: 'cometchat-message-bubble__text-message',
  audio_message: 'cometchat-message-bubble__audio-message',
  delete_action: 'cometchat-message-bubble__delete-message',
  file_message: 'cometchat-message-bubble__file-message',
  groupMember_action: 'cometchat-message-bubble__group-message',
  image_message: 'cometchat-message-bubble__image-message',
  video_message: 'cometchat-message-bubble__video-message',
  extension_document_custom: 'cometchat-message-bubble__document-message',
  extension_whiteboard_custom: 'cometchat-message-bubble__whiteboard-message',
  extension_poll_custom: 'cometchat-message-bubble__poll-message',
  extension_sticker_custom: 'cometchat-message-bubble__sticker-message',
  audio_call: 'cometchat-message-bubble__audio-call',
  video_call: 'cometchat-message-bubble__video-call',
  meeting_custom: 'cometchat-message-bubble__meeting-message',
};

/**
 * Mapping of message type/category combinations to content type identifiers.
 * Used to determine which bubble component to render for each message type.
 *
 * Format: '{type}_{category}' -> 'contentType'
 *
 * NOTE: Call messages (category: 'call') are handled separately in getBubbleType()
 * to ensure they always render as action bubbles regardless of type.
 *
 * @see Requirements 3.5 - THE Message_Bubble component SHALL have a content type mapping for all custom message types
 * @see Requirements 4.1-4.4 - Call messages should render as action bubbles
 */
const CONTENT_TYPE_MAP: Record<string, string> = {
  // Standard message types (category: message)
  text_message: 'text',
  image_message: 'image',
  video_message: 'video',
  audio_message: 'audio',
  file_message: 'file',

  // Custom message types (category: custom)
  extension_poll_custom: 'poll',
  extension_sticker_custom: 'sticker',
  extension_document_custom: 'document',
  extension_whiteboard_custom: 'whiteboard',
  meeting_custom: 'meeting',

  // Action types (category: action)
  groupMember_action: 'action',
};

/**
 * CometChatMessageBubble is a standalone Angular component that provides
 * a flexible container for rendering chat messages with configurable view slots.
 *
 * The component supports:
 * - Multiple message types (text, image, video, audio, file, action, deleted)
 * - Configurable view slots for customization
 * - Message options context menu
 * - Group and 1-on-1 conversation handling
 * - Sender/receiver alignment styling
 *
 * @example
 * ```html
 * <cometchat-message-bubble
 *   [message]="textMessage"
 *   [alignment]="MessageBubbleAlignment.left"
 *   [group]="currentGroup"
 *   [options]="messageOptions"
 *   (optionClick)="onOptionClick($event)"
 *   (avatarClick)="onAvatarClick($event)">
 * </cometchat-message-bubble>
 * ```
 *
 * @see Requirements 1.1 - THE Message_Bubble SHALL be implemented as a standalone Angular component
 */
@Component({
  selector: 'cometchat-message-bubble',
  standalone: true,
  templateUrl: './cometchat-message-bubble.component.html',
  styleUrls: ['./cometchat-message-bubble.component.css'],
  imports: [
    CommonModule,
    CometChatContextMenuComponent,
    CometChatAvatarComponent,
    CometChatDateComponent,
    CometChatTextBubbleComponent,
    CometChatImageBubbleComponent,
    CometChatVideoBubbleComponent,
    CometChatAudioBubbleComponent,
    CometChatFileBubbleComponent,
    CometChatDeleteBubbleComponent,
    CometChatActionBubbleComponent,
    CometChatMessagePreviewComponent,
    CometChatThreadViewComponent,
    CometChatPollBubbleComponent,
    CometChatCollaborativeDocumentBubbleComponent,
    CometChatCollaborativeWhiteboardBubbleComponent,
    CometChatStickerBubbleComponent,
    CometChatCallBubbleComponent,
    CometChatReactionsComponent,
    TranslatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CometChatMessageBubbleComponent
  implements OnInit, OnChanges, OnDestroy, AfterViewInit
{
  // ============================================================================
  // Primary Inputs (Task 5.2)
  // Requirements: 1.2, 1.3, 1.4, 1.5
  // ============================================================================

  /**
   * The CometChat message object to render.
   * This is the primary data source for the component.
   *
   * @required
   * @see Requirement 1.2
   */
  @Input({ required: true }) message!: CometChat.BaseMessage;

  /**
   * The alignment of the message bubble.
   * - `left`: Incoming/receiver messages
   * - `right`: Outgoing/sender messages
   * - `center`: Action/system messages
   *
   * @default MessageBubbleAlignment.right
   * @see Requirement 1.3
   */
  @Input() alignment: MessageBubbleAlignment = MessageBubbleAlignment.right;

  /**
   * The group context for group conversations.
   * When provided, enables group-specific features like avatar and sender name display.
   *
   * @see Requirement 3A.1
   */
  @Input() group: CometChat.Group | null = null;

  /**
   * Array of message options to display in the context menu.
   *
   * @see Requirement 1.4
   */
  @Input() options: (CometChatActionsIcon | CometChatActionsView)[] = [];

  /**
   * Number of quick options to display directly on the message bubble.
   * Remaining options will be shown in an overflow menu.
   *
   * @default 2
   * @see Requirements 4.2, 4.3
   */
  @Input() quickOptionsCount = 2;

  // ============================================================================
  // View Override Inputs (Task 5.2)
  // Requirements: 2.1-2.8
  // ============================================================================

  /**
   * Custom template for the leading view (avatar section).
   * When provided, overrides the default avatar rendering.
   *
   * @see Requirement 2.1
   */
  @Input() leadingView: TemplateRef<any> | null = null;

  /**
   * Custom template for the header view (sender name section).
   * When provided, overrides the default sender name rendering.
   *
   * @see Requirement 2.2
   */
  @Input() headerView: TemplateRef<any> | null = null;

  /**
   * Custom template for the reply view (quoted message preview).
   * When provided, overrides the default reply preview rendering.
   *
   * @see Requirement 2.3
   */
  @Input() replyView: TemplateRef<any> | null = null;

  /**
   * Custom template for the content view (main message content).
   * When provided, overrides the default content rendering based on message type.
   *
   * @see Requirement 2.4
   */
  @Input() contentView: TemplateRef<any> | null = null;

  /**
   * Custom template for the bottom view (additional content below message).
   *
   * @see Requirement 2.5
   */
  @Input() bottomView: TemplateRef<any> | null = null;

  /**
   * Custom template for the footer view (reactions and footer content).
   *
   * @see Requirement 2.6
   */
  @Input() footerView: TemplateRef<any> | null = null;

  /**
   * Custom template for the status info view (timestamp and receipts).
   * When provided, overrides the default status info rendering.
   *
   * @see Requirement 2.7
   */
  @Input() statusInfoView: TemplateRef<any> | null = null;

  /**
   * Custom template for the thread view (thread indicators).
   *
   * @see Requirement 2.8
   */
  @Input() threadView: TemplateRef<any> | null = null;

  /**
   * Custom template for the entire bubble view.
   * When provided, replaces the entire message bubble rendering.
   * This is the highest level of customization, allowing complete control
   * over how the message is displayed.
   *
   * @see Requirement 6.9
   */
  @Input() bubbleView: TemplateRef<any> | null = null;

  // ============================================================================
  // Display Control Inputs (Task 5.2)
  // Requirements: 3A.2, 3A.3
  // ============================================================================

  /**
   * Whether to hide the avatar in the leading view.
   *
   * @default false
   * @see Requirement 3A.2
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
   * Whether to hide the sender name in the header view.
   *
   * @default false
   * @see Requirement 3A.3
   */
  @Input() hideSenderName = false;

  /**
   * Whether to hide read receipt indicators.
   *
   * @default false
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
   * Whether to hide the timestamp.
   *
   * @default false
   */
  @Input() hideTimestamp = false;

  /**
   * Whether to show error state indicator.
   * When true, displays an error icon instead of normal receipt indicators.
   *
   * @default false
   * @see Requirement 3.8
   */
  @Input() showError = false;

  /**
   * Whether to hide moderation status indicators.
   * When false, moderation status (pending/disapproved) will be displayed on messages.
   *
   * @default false
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

  // ============================================================================
  // Text Formatters Input (Task 5.2)
  // ============================================================================

  /**
   * Array of text formatters to apply to text message content.
   *
   * @see Requirement 15.1-15.5
   */
  @Input()
  set textFormatters(value: CometChatTextFormatter[] | undefined) {
    if (value != null) {
      this._textFormatters.set(value);
      this.textFormattersExplicitlySet.set(true);
    }
  }
  get textFormatters(): CometChatTextFormatter[] {
    return this._textFormatters();
  }

  /**
   * Custom date format for the timestamp display.
   * If not provided, uses a default format.
   */
  @Input() dateFormat?: CalendarObject;

  /**
   * Whether the message is currently selected.
   * Used for aria-selected attribute for accessibility.
   *
   * @default false
   * @see Requirement 2.7 - aria-selected for selected state
   */
  @Input() isSelected = false;

  /**
   * Position of this message in the list (1-indexed).
   * Used for aria-posinset attribute for accessibility.
   * Should be passed from the parent message list component.
   *
   * @see Requirement 2.7 - aria-posinset for position in set
   */
  @Input() ariaPosinset?: number;

  /**
   * Total number of messages in the list.
   * Used for aria-setsize attribute for accessibility.
   * Should be passed from the parent message list component.
   *
   * @see Requirement 2.7 - aria-setsize for total count
   */
  @Input() ariaSetsize?: number;

  /**
   * Translated text to display for text messages.
   * When provided, this text will be displayed as the translation
   * in the text bubble component.
   *
   * @see Requirement 14.3 - Display original and translated text
   */
  @Input() translatedText?: string;

  /**
   * Optional custom reactions request builder for fetching reaction details.
   * Passed through to the CometChatReactions component.
   *
   * @see Requirement 7.2
   */
  @Input() reactionsRequestBuilder?: CometChat.ReactionsRequestBuilder;

  /**
   * Whether to disable interactive elements in the message bubble.
   * When true, disables reactions, poll voting, hover options, and keyboard
   * interactions — but still allows media (image/video) fullscreen viewing.
   * Used by the thread header to render a read-only parent message preview.
   *
   * @default false
   */
  @Input() disableInteraction = false;

  // ============================================================================
  // Outputs (Task 5.3)
  // Requirement: 3.6
  // ============================================================================

  /**
   * Emitted when a message option is clicked.
   *
   * @see Requirement 3.6
   */
  @Output() optionClick = new EventEmitter<ContextMenuItem>();

  /**
   * Emitted when the reply preview is clicked.
   */
  @Output() replyPreviewClick = new EventEmitter<CometChat.BaseMessage>();

  /**
   * Emitted when the avatar is clicked.
   */
  @Output() avatarClick = new EventEmitter<CometChat.User>();

  /**
   * Emitted when the thread replies view is clicked.
   * Bubbles up from CometChatThreadViewComponent.
   *
   * @see Requirement 10.6
   */
  @Output() threadRepliesClick = new EventEmitter<CometChat.BaseMessage>();

  /**
   * Emitted when a reaction pill is clicked.
   * Contains the reaction that was clicked and the message it belongs to.
   *
   * @see Requirement 7.2
   */
  @Output() reactionClick = new EventEmitter<{
    reaction: CometChat.ReactionCount;
    message: CometChat.BaseMessage;
  }>();

  /**
   * Emitted when a reaction list item is clicked (from the overflow popover).
   * Contains the individual reaction and the message it belongs to.
   *
   * @see Requirement 7.2
   */
  @Output() reactionListItemClick = new EventEmitter<{
    reaction: CometChat.Reaction;
    message: CometChat.BaseMessage;
  }>();

  /**
   * Emitted when media playback should be toggled via keyboard.
   * Only emitted for media messages (audio, video, image).
   * Parent component should handle the actual media toggle.
   *
   * @see Requirement 2.3 - Space key toggles media playback
   */
  @Output() mediaToggle = new EventEmitter<CometChat.BaseMessage>();

  /**
   * Emitted when message actions menu should be opened via keyboard.
   * Triggered by Enter, Shift+F10, or ContextMenu key.
   *
   * @see Requirement 2.2, 2.4 - Keyboard triggers for message actions
   */
  @Output() messageActionsOpen = new EventEmitter<CometChat.BaseMessage>();

  // ============================================================================
  // ViewChild References (Task 9.2)
  // Requirements: 9.8 - Focus management for options menu
  // ============================================================================

  /**
   * Reference to the message bubble wrapper element for focus management.
   * Used to return focus when options menu closes.
   *
   * @see Requirement 9.8
   */
  @ViewChild('bubbleWrapper') bubbleWrapperRef!: ElementRef<HTMLDivElement>;

  /**
   * Reference to the content view element for measuring width.
   * Used by the moderation indicator to match the content bubble width.
   *
   * @see React CometChatModerationView - ResizeObserver pattern
   */
  @ViewChild('contentViewRef') contentViewRef?: ElementRef<HTMLElement>;

  /**
   * Reference to the context menu component for focus management.
   *
   * @see Requirement 9.6
   */
  @ViewChild(CometChatContextMenuComponent) contextMenuRef?: CometChatContextMenuComponent;

  // ============================================================================
  // Internal State
  // ============================================================================

  /** Whether the mouse is hovering over the message body */
  protected isHovering = false;

  /** Whether the device is mobile */
  protected isMobile = false;

  /** Timeout reference for delayed hover hide */
  private hoverTimeoutRef: ReturnType<typeof setTimeout> | null = null;

  /** Cached logged-in user */
  loggedInUser: CometChat.User | null = null;

  /**
   * Observed width of the content view element.
   * Used to dynamically size the moderation indicator to match the content bubble.
   * Mirrors React's CometChatModerationView ResizeObserver pattern.
   */
  contentViewWidth = signal(0);

  /** ResizeObserver for tracking content view width changes */
  private contentViewResizeObserver: ResizeObserver | null = null;

  // ============================================================================
  // Injected Services
  // ============================================================================

  private readonly cdr = inject(ChangeDetectorRef);
  private readonly messageUtils = inject(MessageUtilsService);
  private readonly bubbleConfigService = inject(MessageBubbleConfigService);
  private readonly callButtonsService = inject(CallButtonsService);
  private readonly datePipe = new DatePipe('en-US');

  /** Re-render when bubble config service changes (e.g., custom views toggled at runtime) */
  private _configChangeSub?: Subscription;
  private globalConfig: Partial<GlobalConfig> | null = inject(COMETCHAT_GLOBAL_CONFIG, {
    optional: true,
  });

  // ==================== ExplicitlySet Flags & Backing Fields (GlobalConfig Priority System) ====================
  private hideReceiptsExplicitlySet = signal(false);
  private hideAvatarExplicitlySet = signal(false);
  private textFormattersExplicitlySet = signal(false);
  private hideModerationViewExplicitlySet = signal(false);

  private _hideReceipts = signal(false);
  private _hideAvatar = signal(false);
  private _textFormatters = signal<CometChatTextFormatter[]>([]);
  private _hideModerationView = signal(false);

  // ============================================================================
  // Template Exposed Enums
  // ============================================================================

  /** Expose MessageBubbleAlignment enum to template */
  readonly MessageBubbleAlignment = MessageBubbleAlignment;

  /** Expose Placement enum to template */
  readonly Placement = Placement;

  // ==================== Effective Values (GlobalConfig Priority System) ====================

  /**
   * Resolved hideReceipts value using 3-tier priority:
   * 1. Explicitly set @Input value
   * 2. GlobalConfig value (if defined)
   * 3. Component default (false)
   */
  effectiveHideReceipts = computed(() => {
    if (this.hideReceiptsExplicitlySet()) return this._hideReceipts();
    if (this.globalConfig?.hideReceipts !== undefined) return this.globalConfig.hideReceipts;
    return false;
  });

  /**
   * Resolved hideAvatar value using 3-tier priority:
   * 1. Explicitly set @Input value
   * 2. GlobalConfig value (if defined)
   * 3. Component default (false)
   */
  effectiveHideAvatar = computed(() => {
    if (this.hideAvatarExplicitlySet()) return this._hideAvatar();
    if (this.globalConfig?.hideAvatar !== undefined) return this.globalConfig.hideAvatar;
    return false;
  });

  /**
   * Resolved textFormatters value using 3-tier priority:
   * 1. Explicitly set @Input value
   * 2. GlobalConfig value (if defined)
   * 3. undefined (signals "no formatters provided", allowing child components to fall back to defaults)
   */
  effectiveTextFormatters = computed((): CometChatTextFormatter[] | undefined => {
    if (this.textFormattersExplicitlySet()) return this._textFormatters();
    if (this.globalConfig?.textFormatters !== undefined) return this.globalConfig.textFormatters;
    return undefined;
  });

  /**
   * Resolved hideModerationView value using 3-tier priority:
   * 1. Explicitly set @Input value
   * 2. GlobalConfig value (if defined)
   * 3. Component default (false)
   */
  effectiveHideModerationView = computed(() => {
    if (this.hideModerationViewExplicitlySet()) return this._hideModerationView();
    return false;
  });

  // ============================================================================
  // Lifecycle Hooks
  // ============================================================================

  ngOnInit(): void {
    this.loggedInUser = CometChatUIKit.getLoggedInUser();
    this.detectMobileDevice();
    // Subscribe to config changes for real-time bubble customization updates
    this._configChangeSub = this.bubbleConfigService.configChanged$.subscribe(() => {
      this.cdr.markForCheck();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['message']) {
      this.cdr.markForCheck();
    }
  }

  ngAfterViewInit(): void {
    this.setupContentViewResizeObserver();
  }

  ngOnDestroy(): void {
    this.clearHoverTimeout();
    this._configChangeSub?.unsubscribe();
    this.contentViewResizeObserver?.disconnect();
    this.contentViewResizeObserver = null;
  }

  // ============================================================================
  // Computed Properties (Task 5.4)
  // Requirements: 1.6, 1.7, 1.8
  // ============================================================================

  /**
   * Gets the message ID from the message object.
   * Uses getId() or falls back to getMuid() for pending messages.
   *
   * @see Requirement 1.6
   */
  get messageId(): string | number {
    if (!this.message) {
      return '';
    }
    return this.message.getId() || this.message.getMuid() || '';
  }

  /**
   * Gets the message type from the message object.
   *
   * @see Requirement 1.7
   */
  get messageType(): string {
    if (!this.message) {
      return '';
    }
    return this.message.getType() || '';
  }

  /**
   * Gets the message category from the message object.
   *
   * @see Requirement 1.8
   */
  get messageCategory(): string {
    if (!this.message) {
      return '';
    }
    return this.message.getCategory() || '';
  }

  /**
   * Gets the CSS class for the message bubble based on alignment.
   *
   * @see Requirements 1.9, 1.10, 1.11
   */
  get bubbleClassName(): string {
    switch (this.alignment) {
      case MessageBubbleAlignment.left:
        return 'cometchat-message-bubble-incoming';
      case MessageBubbleAlignment.right:
        return 'cometchat-message-bubble-outgoing';
      case MessageBubbleAlignment.center:
        return 'cometchat-message-bubble-action';
      default:
        return 'cometchat-message-bubble-outgoing';
    }
  }

  /**
   * Gets the CSS class for the message type.
   *
   * @see Requirements 4.1-4.7
   */
  get bubbleTypeClassName(): string {
    if (!this.message) {
      return '';
    }

    const type = this.messageType;
    const category = this.messageCategory;
    const key = `${type}_${category}`;

    return BUBBLE_TYPE_MAP[key] || '';
  }

  /**
   * Gets the content type for the message.
   * Used to determine which bubble component to render.
   *
   * The content type is derived by checking the message category first,
   * then falling back to the type/category combination mapping.
   *
   * Category priority (checked first):
   * - 'call' category -> always returns 'action' (renders as action bubble)
   * - 'action' category -> always returns 'action' (renders as action bubble)
   *
   * Then type/category mapping:
   * - 'text' + 'message' -> 'text'
   * - 'extension_poll' + 'custom' -> 'poll'
   * - etc.
   *
   * @returns The content type string (e.g., 'text', 'image', 'poll', 'sticker', 'document', 'whiteboard', 'action', 'unsupported')
   * @see Requirements 3.5 - THE Message_Bubble component SHALL have a content type mapping for all custom message types
   * @see Requirements 4.1, 4.2 - Audio/video with category 'message' render as media bubbles
   * @see Requirements 4.3, 4.4 - Audio/video with category 'call' render as action bubbles
   */
  get contentType(): string {
    return this.getBubbleType();
  }

  /**
   * Determines the bubble type to render based on message category and type.
   *
   * This method implements the category-first logic for bubble type selection:
   * 1. Call messages (category: 'call') -> always 'action' bubble (centered)
   * 2. Action messages (category: 'action') -> always 'action' bubble (centered)
   * 3. Regular messages (category: 'message') -> based on type (text, image, video, audio, file)
   * 4. Custom messages (category: 'custom') -> based on extension type (poll, sticker, document, whiteboard)
   *
   * @returns The bubble type string for rendering
   * @see Requirements 4.1 - Audio with category 'message' renders as Audio_Bubble
   * @see Requirements 4.2 - Video with category 'message' renders as Video_Bubble
   * @see Requirements 4.3 - Audio with category 'call' renders as Action_Bubble
   * @see Requirements 4.4 - Video with category 'call' renders as Action_Bubble
   */
  getBubbleType(): string {
    if (!this.message) {
      return 'unsupported';
    }

    const category = this.messageCategory;
    const type = this.messageType;

    // Call messages should render as call bubbles (not action bubbles)
    // This ensures audio/video call notifications render with proper call UI
    // Compare with both SDK constant and string literal for robustness
    if (category === CometChatUIKitConstants.MessageCategory.call || category === 'call') {
      return 'call';
    }

    // Action messages (group member joined, left, etc.)
    if (category === CometChatUIKitConstants.MessageCategory.action || category === 'action') {
      return 'action';
    }

    // Regular message types - use type/category mapping
    if (category === CometChatUIKitConstants.MessageCategory.message || category === 'message') {
      switch (type) {
        case CometChatUIKitConstants.MessageTypes.text:
          return 'text';
        case CometChatUIKitConstants.MessageTypes.image:
          return 'image';
        case CometChatUIKitConstants.MessageTypes.video:
          return 'video';
        case CometChatUIKitConstants.MessageTypes.audio:
          return 'audio';
        case CometChatUIKitConstants.MessageTypes.file:
          return 'file';
        default:
          return 'text';
      }
    }

    // Custom message types - check for extension types
    // Compare with both SDK constant and string literal for robustness
    // The SDK constant CometChat.CATEGORY_CUSTOM should equal 'custom'
    if (category === CometChatUIKitConstants.MessageCategory.custom || category === 'custom') {
      if (type.includes('poll')) return 'poll';
      if (type.includes('sticker')) return 'sticker';
      if (type.includes('document')) return 'document';
      if (type.includes('whiteboard')) return 'whiteboard';
      if (type.includes('meeting')) return 'meeting';
    }

    // Fallback to type/category mapping for any other cases
    const key = `${type}_${category}`;
    return CONTENT_TYPE_MAP[key] || 'unsupported';
  }

  /**
   * Determines if the leading view (avatar) should be shown.
   *
   * Standard alignment (right for sender, left for receiver):
   * - Group: Show only for receiver (left-aligned messages)
   * - 1v1: Don't show
   *
   * Left alignment (all messages left-aligned):
   * - Group: Show for both sender and receiver
   * - 1v1: Show for both sender and receiver
   *
   * @see Requirements 2A.9, 3A.4
   */
  get shouldShowLeadingView(): boolean {
    // Don't show for action messages
    if (this.alignment === MessageBubbleAlignment.center) {
      return false;
    }

    // Don't show if explicitly hidden
    if (this.effectiveHideAvatar()) {
      return false;
    }

    // If a custom leadingView is provided (via input or service), always show it.
    // The developer is responsible for conditional display logic.
    if (this.effectiveLeadingView) {
      return true;
    }

    // Default avatar: only show for left-aligned (incoming) messages
    if (this.alignment === MessageBubbleAlignment.left) {
      return true;
    }

    return false;
  }

  /**
   * Determines if the header view (sender name) should be shown.
   *
   * Standard alignment (right for sender, left for receiver):
   * - Group: Show only for receiver (left-aligned messages)
   * - 1v1: Don't show
   *
   * Left alignment (all messages left-aligned):
   * - Group: Show for both sender and receiver
   * - 1v1: Show for both sender and receiver
   *
   * @see Requirements 2.14, 2.15, 3A.5
   */
  get shouldShowHeaderView(): boolean {
    // Don't show for action messages
    if (this.alignment === MessageBubbleAlignment.center) {
      return false;
    }

    // Don't show if explicitly hidden
    if (this.hideSenderName) {
      return false;
    }

    // If a custom headerView is provided (via input or service), always show it.
    // The developer is responsible for conditional display logic.
    if (this.effectiveHeaderView) {
      return true;
    }

    // Default sender name: only show for left-aligned (incoming) messages
    if (this.alignment === MessageBubbleAlignment.left) {
      return true;
    }

    return false;
  }

  /**
   * Determines if the reply view should be shown.
   * Shows when message has a quoted message and is not deleted or action.
   *
   * @see Requirements 11.5, 11.6, 11.7
   */
  get shouldShowReplyView(): boolean {
    // Don't show for deleted messages
    if (this.isDeleted) {
      return false;
    }

    // Don't show for action messages
    if (this.messageCategory === CometChatUIKitConstants.MessageCategory.action) {
      return false;
    }

    // Show if message has a quoted message
    return this.quotedMessage !== null;
  }

  /**
   * Determines if the status info view should be shown.
   * Hides for action messages and call messages.
   *
   * @see Requirements 10.5, 10.6
   */
  get shouldShowStatusInfoView(): boolean {
    // Don't show for center-aligned messages (action/call style)
    if (this.alignment === MessageBubbleAlignment.center) {
      return false;
    }

    // Don't show for action messages
    if (this.messageCategory === CometChatUIKitConstants.MessageCategory.action) {
      return false;
    }

    // Don't show for call messages
    if (this.messageCategory === CometChatUIKitConstants.MessageCategory.call) {
      return false;
    }
    if (
      this.messageCategory == CometChatUIKitConstants.MessageCategory.custom &&
      this.messageType == 'meeting'
    ) {
      return false;
    }

    return true;
  }

  /**
   * Gets the sender of the message.
   */
  get sender(): CometChat.User | null {
    if (!this.message) {
      return null;
    }
    return this.message.getSender() || this.loggedInUser || null;
  }

  /**
   * Determines if the message is outgoing (sent by logged-in user).
   * Used for functional checks like permissions (edit, delete, etc.).
   *
   * @see Requirement 3A.7
   */
  get isOutgoing(): boolean {
    if (!this.message || !this.loggedInUser) {
      return false;
    }

    const sender = this.message.getSender();
    if (!sender) {
      return true; // Messages without sender are assumed to be outgoing
    }

    return sender.getUid() === this.loggedInUser.getUid();
  }

  /**
   * Determines if the message should use outgoing (sender) style.
   * This is based on alignment, not actual sender.
   * When messageAlignment is 'left', all messages use incoming style (like Slack).
   *
   * @see Requirement 3A.7
   */
  get isOutgoingStyle(): boolean {
    // Use alignment to determine style, not actual sender
    return this.alignment === MessageBubbleAlignment.right;
  }

  /**
   * Determines if the message is deleted.
   *
   * @see Requirement 2A.6
   */
  get isDeleted(): boolean {
    if (!this.message) {
      return false;
    }
    return !!this.message.getDeletedAt();
  }

  /**
   * Gets the quoted message (for reply preview).
   *
   * @see Requirement 11.2
   */
  get quotedMessage(): CometChat.BaseMessage | null {
    if (!this.message) {
      return null;
    }

    // Check if message has getQuotedMessage method (TextMessage, MediaMessage)
    if (typeof (this.message as any).getQuotedMessage === 'function') {
      return (this.message as any).getQuotedMessage() || null;
    }

    return null;
  }

  /**
   * Determines if the message has been edited.
   */
  get isEdited(): boolean {
    if (!this.message) {
      return false;
    }
    return (
      !!this.message.getEditedAt() &&
      this.message.getType() == CometChatUIKitConstants.MessageTypes.text &&
      this.message.getCategory() == CometChatUIKitConstants.MessageCategory.message
    );
  }

  /**
   * Gets the action message text for action messages and call messages.
   * For action messages (group member joined, left, etc.), delegates to messagesDataSource.
   * For call messages, generates appropriate call status text.
   *
   * @see Requirements 4.5 - THE Action_Bubble for call messages SHALL display call status information
   */
  get actionMessageText(): string {
    if (!this.message) {
      return '';
    }

    const category = this.messageCategory;

    // Handle call messages - generate call status text
    if (category === CometChatUIKitConstants.MessageCategory.call) {
      return this.getCallMessageText();
    }

    // Handle action messages (group member actions)
    if (category === CometChatUIKitConstants.MessageCategory.action) {
      return this.messageUtils.getActionMessage(this.message as CometChat.Action);
    }

    return '';
  }

  /**
   * Generates the display text for call messages based on call status.
   * Uses localization keys for internationalization.
   * Logic matches React UIKit's CallingDetailsUtils.getCallStatus().
   *
   * @returns Localized call status text (e.g., "Outgoing Call", "Missed Call", etc.)
   * @see Requirements 4.5 - THE Action_Bubble for call messages SHALL display call status information
   */
  private getCallMessageText(): string {
    if (!this.message) {
      return '';
    }

    // Cast to Call type to access call-specific properties
    const callMessage = this.message as any;
    const callStatus = callMessage.getStatus?.() || callMessage.status || '';

    // Determine if this is an outgoing call based on sender (matches React's isSentByMe logic)
    const isSentByMe = this.isOutgoing;

    if (isSentByMe) {
      // Outgoing call status mapping
      switch (callStatus) {
        case CometChatUIKitConstants.calls.initiated:
          return CometChatLocalize.getLocalizedString('conversation_subtitle_outgoing_call');
        case CometChatUIKitConstants.calls.cancelled:
          return CometChatLocalize.getLocalizedString('conversation_subtitle_cancelled_call');
        case CometChatUIKitConstants.calls.rejected:
          return CometChatLocalize.getLocalizedString('conversation_subtitle_rejected_call');
        case CometChatUIKitConstants.calls.busy:
          return CometChatLocalize.getLocalizedString('conversation_subtitle_missed_call');
        case CometChatUIKitConstants.calls.ended:
          return CometChatLocalize.getLocalizedString('conversation_subtitle_ended_call');
        case CometChatUIKitConstants.calls.ongoing:
          return CometChatLocalize.getLocalizedString('conversation_subtitle_answered_call');
        case CometChatUIKitConstants.calls.unanswered:
          return CometChatLocalize.getLocalizedString('conversation_subtitle_unasnwered_call');
        default:
          return CometChatLocalize.getLocalizedString('conversation_subtitle_outgoing_call');
      }
    } else {
      // Incoming call status mapping
      switch (callStatus) {
        case CometChatUIKitConstants.calls.initiated:
          return CometChatLocalize.getLocalizedString('conversation_subtitle_incoming_call');
        case CometChatUIKitConstants.calls.ongoing:
          return CometChatLocalize.getLocalizedString('conversation_subtitle_answered_call');
        case CometChatUIKitConstants.calls.ended:
          return CometChatLocalize.getLocalizedString('conversation_subtitle_ended_call');
        case CometChatUIKitConstants.calls.unanswered:
        case CometChatUIKitConstants.calls.cancelled:
          return CometChatLocalize.getLocalizedString('conversation_subtitle_missed_call');
        case CometChatUIKitConstants.calls.busy:
          return CometChatLocalize.getLocalizedString('conversation_subtitle_busy_call');
        case CometChatUIKitConstants.calls.rejected:
          return CometChatLocalize.getLocalizedString('conversation_subtitle_rejected_call');
        default:
          return CometChatLocalize.getLocalizedString('conversation_subtitle_outgoing_call');
      }
    }
  }

  /**
   * Gets the CSS class for call status styling.
   * Used to apply appropriate icon via CSS mask.
   * Matches React UIKit's getCallStatusClass() logic.
   *
   * @returns CSS class name for call status (e.g., 'cometchat-message-bubble__outgoing-call')
   * @see Requirements 4.5, 4.6 - Call messages display with appropriate icons
   */
  get callStatusClass(): string {
    if (!this.message || this.messageCategory !== CometChatUIKitConstants.MessageCategory.call) {
      return '';
    }

    const statusText = this.getCallMessageText();

    // Map localized status text to CSS class
    if (
      statusText === CometChatLocalize.getLocalizedString('conversation_subtitle_outgoing_call')
    ) {
      return 'cometchat-message-bubble__outgoing-call';
    }
    if (
      statusText === CometChatLocalize.getLocalizedString('conversation_subtitle_incoming_call')
    ) {
      return 'cometchat-message-bubble__incoming-call';
    }
    if (
      statusText === CometChatLocalize.getLocalizedString('conversation_subtitle_cancelled_call')
    ) {
      return 'cometchat-message-bubble__cancelled-call';
    }
    if (
      statusText === CometChatLocalize.getLocalizedString('conversation_subtitle_rejected_call')
    ) {
      return 'cometchat-message-bubble__rejected-call';
    }
    if (statusText === CometChatLocalize.getLocalizedString('conversation_subtitle_busy_call')) {
      return 'cometchat-message-bubble__busy-call';
    }
    if (statusText === CometChatLocalize.getLocalizedString('conversation_subtitle_ended_call')) {
      return 'cometchat-message-bubble__ended-call';
    }
    if (
      statusText === CometChatLocalize.getLocalizedString('conversation_subtitle_answered_call')
    ) {
      return 'cometchat-message-bubble__answered-call';
    }
    if (
      statusText === CometChatLocalize.getLocalizedString('conversation_subtitle_unasnwered_call')
    ) {
      return 'cometchat-message-bubble__unanswered-call';
    }
    if (statusText === CometChatLocalize.getLocalizedString('conversation_subtitle_missed_call')) {
      return 'cometchat-message-bubble__missed-call';
    }

    return '';
  }

  /**
   * Gets the icon URL for call status messages.
   * Returns the appropriate icon based on call type (audio/video) and status.
   *
   * @returns Icon URL path for the call status
   * @see Requirements 4.5, 4.6 - Call messages display with appropriate icons
   */
  get callIconUrl(): string {
    if (!this.message || this.messageCategory !== CometChatUIKitConstants.MessageCategory.call) {
      return '';
    }

    const isVideoCall = this.messageType === CometChatUIKitConstants.MessageTypes.video;
    const statusText = this.getCallMessageText();

    // Video call icons
    if (isVideoCall) {
      if (
        statusText === CometChatLocalize.getLocalizedString('conversation_subtitle_outgoing_call')
      ) {
        return 'assets/outgoing_video_no_fill.svg';
      }
      if (
        statusText === CometChatLocalize.getLocalizedString('conversation_subtitle_incoming_call')
      ) {
        return 'assets/incoming_video_no_fill.svg';
      }
      if (
        statusText === CometChatLocalize.getLocalizedString('conversation_subtitle_missed_call')
      ) {
        return 'assets/missed_video_call_no_fill.svg';
      }
      if (statusText === CometChatLocalize.getLocalizedString('conversation_subtitle_ended_call')) {
        return 'assets/call_end_no_fill.svg';
      }
      // Default video call icon for other statuses
      return 'assets/video_call_button.svg';
    }

    // Audio call icons
    if (
      statusText === CometChatLocalize.getLocalizedString('conversation_subtitle_outgoing_call')
    ) {
      return 'assets/phone_outgoing_no_fill.svg';
    }
    if (
      statusText === CometChatLocalize.getLocalizedString('conversation_subtitle_incoming_call')
    ) {
      return 'assets/phone_incoming_no_fill.svg';
    }
    if (statusText === CometChatLocalize.getLocalizedString('conversation_subtitle_missed_call')) {
      return 'assets/phone_missed_no_fill.svg';
    }
    if (statusText === CometChatLocalize.getLocalizedString('conversation_subtitle_ended_call')) {
      return 'assets/call_end_no_fill.svg';
    }
    // Default audio call icon for other statuses
    return 'assets/audio_call_button.svg';
  }

  /**
   * Determines if the call icon should use error color.
   * Returns true for missed calls to show red icon.
   *
   * @returns True if icon should use error color
   * @see Requirements 4.5, 4.6 - Missed calls show error color
   */
  get callIconErrorColor(): boolean {
    if (!this.message || this.messageCategory !== CometChatUIKitConstants.MessageCategory.call) {
      return false;
    }

    const statusText = this.getCallMessageText();
    return (
      statusText === CometChatLocalize.getLocalizedString('conversation_subtitle_missed_call') ||
      statusText === CometChatLocalize.getLocalizedString('conversation_subtitle_ended_call') ||
      statusText === CometChatLocalize.getLocalizedString('conversation_subtitle_cancelled_call')
    );
  }

  /**
   * Gets the context menu placement based on alignment.
   *
   * @see Requirements 3.7, 3.8
   */
  get contextMenuPlacement(): Placement {
    if (this.alignment === MessageBubbleAlignment.left) {
      return Placement.right;
    }
    return Placement.left;
  }

  // ============================================================================
  // Options Distribution (Task 5.2)
  // Requirements: 4.2, 4.3, 4.10
  // ============================================================================

  /**
   * Gets the effective quick options count.
   * Uses quickOptionsCount if set, otherwise falls back to topMenuSize for backward compatibility.
   *
   * @see Requirements 4.2, 4.3
   */
  get effectiveQuickOptionsCount(): number {
    // quickOptionsCount takes precedence if explicitly set differently from default
    return this.quickOptionsCount;
  }

  /**
   * Gets the distributed message options.
   * Splits options into quick options and overflow options based on quickOptionsCount.
   *
   * @see Requirements 4.2, 4.3
   */
  get distributedOptions(): {
    quickOptions: (CometChatActionsIcon | CometChatActionsView)[];
    overflowOptions: (CometChatActionsIcon | CometChatActionsView)[];
  } {
    return this.messageUtils.distributeMessageOptions(
      this.options,
      this.effectiveQuickOptionsCount
    );
  }

  /**
   * Gets the CSS class for options positioning based on alignment.
   * - Left alignment (incoming): options on right side
   * - Right alignment (outgoing): options on left side
   * - Center alignment (action): no options
   *
   * @see Requirement 4.10
   */
  get optionsPositionClass(): string {
    return this.messageUtils.getOptionsPositionClass(this.alignment);
  }

  /**
   * Gets the receipt CSS class based on message status.
   */
  get receiptClass(): string {
    if (!this.message) {
      return '';
    }

    const readAt = this.message.getReadAt();
    const deliveredAt = this.message.getDeliveredAt();
    const sentAt = this.message.getSentAt();

    if (readAt) {
      return 'cometchat-receipts-read';
    }
    if (deliveredAt) {
      return 'cometchat-receipts-delivered';
    }
    if (sentAt && this.message.getId()) {
      return 'cometchat-receipts-sent';
    }
    return 'cometchat-receipts-wait';
  }

  /**
   * Gets the ARIA label for the receipt icon based on message status.
   * Uses localization keys for accessibility.
   *
   * @see Requirement 3.7
   */
  get receiptAriaLabel(): string {
    if (!this.message) {
      return '';
    }

    const readAt = this.message.getReadAt();
    const deliveredAt = this.message.getDeliveredAt();
    const sentAt = this.message.getSentAt();

    if (readAt) {
      return CometChatLocalize.getLocalizedString('message_status_read');
    }
    if (deliveredAt) {
      return CometChatLocalize.getLocalizedString('message_status_delivered');
    }
    if (sentAt) {
      return CometChatLocalize.getLocalizedString('message_status_sent');
    }
    return CometChatLocalize.getLocalizedString('message_status_sending');
  }

  /**
   * Gets the calendar object for date formatting.
   * Returns custom dateFormat if provided, otherwise returns default format.
   */
  get calendarObject(): CalendarObject {
    if (this.dateFormat) {
      return this.dateFormat;
    }
    // Default format for message timestamps
    return {
      today: 'hh:mm A',
      yesterday: 'hh:mm A',
      otherDays: 'hh:mm A',
    };
  }

  /**
   * Gets the reply count for the message thread.
   * Returns 0 if the message doesn't have a reply count.
   *
   * @see Requirement 10.6
   */
  get replyCount(): number {
    if (!this.message) {
      return 0;
    }
    return this.message.getReplyCount() || 0;
  }

  /**
   * Gets the unread reply count for the message thread.
   * Returns 0 if the message doesn't have unread replies.
   *
   * @see Requirement 10.6
   */
  get unreadReplyCount(): number {
    if (!this.message) {
      return 0;
    }
    return this.message.getUnreadRepliesCount() || 0;
  }

  /**
   * Determines if the thread view should be shown.
   * Shows when message has replies and is not deleted or action.
   *
   * @see Requirement 10.6
   */
  get shouldShowThreadView(): boolean {
    // Don't show for deleted messages
    if (this.isDeleted) {
      return false;
    }

    // Don't show for action messages
    if (this.messageCategory === CometChatUIKitConstants.MessageCategory.action) {
      return false;
    }

    // Show if message has replies
    return this.replyCount > 0;
  }

  // ============================================================================
  // Reactions Computed Properties (Task 5.2)
  // Requirements: 4.1, 4.2, 4.3, 4.8
  // ============================================================================

  /**
   * Gets all reactions from the message.
   *
   * @see Requirement 4.1
   */
  get reactions(): CometChat.ReactionCount[] {
    if (!this.message) {
      return [];
    }
    return this.message.getReactions() || [];
  }

  /**
   * Determines if the message has any reactions.
   *
   * @see Requirement 7.1
   */
  get hasReactions(): boolean {
    return this.reactions.length > 0;
  }

  /**
   * Determines if the reactions section should be shown.
   * Shows when message has reactions and is not deleted or action.
   *
   * @see Requirement 4.1
   */
  get shouldShowReactions(): boolean {
    // Don't show for deleted messages
    if (this.isDeleted) {
      return false;
    }

    // Don't show for action messages
    if (this.messageCategory === CometChatUIKitConstants.MessageCategory.action) {
      return false;
    }

    // Show if message has reactions
    return this.hasReactions;
  }

  // ============================================================================
  // Moderation Status Computed Properties (Task 18.3)
  // Requirement: 9.7 - Display moderation status indicators
  // ============================================================================

  /**
   * Gets the moderation status of the message.
   * Returns the moderation status if available, otherwise 'unmoderated'.
   *
   * @see Requirement 9.7
   */
  get moderationStatus(): string {
    if (!this.message) {
      return CometChatUIKitConstants.moderationStatus.unmoderated;
    }

    // Check if message has getModerationStatus method (TextMessage or MediaMessage)
    if (typeof (this.message as any).getModerationStatus === 'function') {
      return (
        (this.message as any).getModerationStatus() ||
        CometChatUIKitConstants.moderationStatus.unmoderated
      );
    }

    return CometChatUIKitConstants.moderationStatus.unmoderated;
  }

  /**
   * Determines if the message is pending moderation.
   *
   * @see Requirement 9.7
   */
  get isPendingModeration(): boolean {
    return this.moderationStatus === CometChatUIKitConstants.moderationStatus.pending;
  }

  /**
   * Determines if the message has been disapproved by moderation.
   *
   * @see Requirement 9.7
   */
  get isDisapprovedByModeration(): boolean {
    return this.moderationStatus === CometChatUIKitConstants.moderationStatus.disapproved;
  }

  /**
   * Determines if the moderation indicator should be shown.
   * Shows when message is pending or disapproved and hideModerationView is false.
   *
   * @see Requirement 9.7
   */
  get shouldShowModerationIndicator(): boolean {
    // Don't show if explicitly hidden
    if (this.effectiveHideModerationView()) {
      return false;
    }

    // Don't show for deleted messages
    if (this.isDeleted) {
      return false;
    }

    // Don't show for action messages
    if (this.messageCategory === CometChatUIKitConstants.MessageCategory.action) {
      return false;
    }

    // Show if message is pending or disapproved
    return this.isDisapprovedByModeration;
  }

  /**
   * Computed width style for the moderation indicator.
   * Mirrors React's CometChatModerationView width logic:
   * - If content view width >= 240px: use content width + padding
   * - Otherwise: use 240px minimum
   */
  moderationIndicatorWidth = computed(() => {
    const width = this.contentViewWidth();
    if (width >= 240) {
      return `calc(${width}px + var(--cometchat-padding-1) * 2)`;
    }
    return '240px';
  });

  // ============================================================================
  // Effective View Getters (Task 10.1)
  // Requirements: 10.1, 10.2, 10.3
  // Priority: 1. Input template ref, 2. Service configured view, 3. Default
  // ============================================================================

  /**
   * Gets the message type key for configuration lookup.
   * Format: "{type}_{category}" e.g., "text_message", "image_message"
   *
   * @see Requirements 10.1, 10.2
   */
  get messageTypeKey(): string {
    if (!this.message) {
      return '';
    }
    return `${this.messageType}_${this.messageCategory}`;
  }

  /**
   * Gets the effective leading view template.
   * Priority: Input > Service configured > null (use default)
   *
   * @see Requirement 10.3
   */
  get effectiveLeadingView(): TemplateRef<any> | null {
    return this.getEffectiveView('leadingView', this.leadingView);
  }

  /**
   * Gets the effective header view template.
   * Priority: Input > Service configured > null (use default)
   *
   * @see Requirement 10.3
   */
  get effectiveHeaderView(): TemplateRef<any> | null {
    return this.getEffectiveView('headerView', this.headerView);
  }

  /**
   * Gets the effective reply view template.
   * Priority: Input > Service configured > null (use default)
   *
   * @see Requirement 10.3
   */
  get effectiveReplyView(): TemplateRef<any> | null {
    return this.getEffectiveView('replyView', this.replyView);
  }

  /**
   * Gets the effective content view template.
   * Priority: Input > Service configured > null (use default)
   *
   * @see Requirement 10.3
   */
  get effectiveContentView(): TemplateRef<any> | null {
    return this.getEffectiveView('contentView', this.contentView);
  }

  /**
   * Gets the effective bottom view template.
   * Priority: Input > Service configured > null (use default)
   *
   * @see Requirement 10.3
   */
  get effectiveBottomView(): TemplateRef<any> | null {
    return this.getEffectiveView('bottomView', this.bottomView);
  }

  /**
   * Gets the effective footer view template.
   * Priority: Input > Service configured > null (use default)
   *
   * @see Requirement 10.3
   */
  get effectiveFooterView(): TemplateRef<any> | null {
    return this.getEffectiveView('footerView', this.footerView);
  }

  /**
   * Gets the effective status info view template.
   * Priority: Input > Service configured > null (use default)
   *
   * @see Requirement 10.3
   */
  get effectiveStatusInfoView(): TemplateRef<any> | null {
    return this.getEffectiveView('statusInfoView', this.statusInfoView);
  }

  /**
   * Gets the effective thread view template.
   * Priority: Input > Service configured > null (use default)
   *
   * @see Requirement 10.3
   */
  get effectiveThreadView(): TemplateRef<any> | null {
    return this.getEffectiveView('threadView', this.threadView);
  }

  /**
   * Gets the effective bubble view template.
   * Priority: Input > Service configured > null (use default)
   *
   * @see Requirement 10.3
   */
  get effectiveBubbleView(): TemplateRef<any> | null {
    return this.getEffectiveView('bubbleView', this.bubbleView);
  }

  /**
   * Helper method to get the effective view for a bubble part.
   * Implements the priority logic:
   * 1. Input template ref (passed directly to component)
   * 2. Service configured view (type-specific or global)
   * 3. null (use default rendering)
   *
   * @param part - The bubble part to get the view for
   * @param inputView - The input template ref passed to the component
   * @returns The effective template to use, or null for default rendering
   *
   * @see Requirements 10.1, 10.2, 10.3
   */
  private getEffectiveView(
    part: BubblePart,
    inputView: TemplateRef<any> | null
  ): TemplateRef<any> | null {
    // Priority 1: Input template ref takes highest priority
    if (inputView) {
      return inputView;
    }

    // Priority 2: Check service for configured view (type-specific or global)
    const serviceView = this.bubbleConfigService.getView(this.messageTypeKey, part);
    if (serviceView) {
      return serviceView;
    }

    // Priority 3: Return null to use default rendering
    return null;
  }

  // ============================================================================
  // Event Handlers
  // ============================================================================

  /**
   * Handles mouse enter on the message body.
   * Shows the options menu.
   *
   * @see Requirement 3.2
   */
  onMouseEnter(): void {
    this.clearHoverTimeout();
    this.isHovering = true;
    this.cdr.markForCheck();
  }

  /**
   * Handles mouse leave from the message body.
   * Hides the options menu after a 150ms delay.
   *
   * @see Requirement 3.4
   */
  onMouseLeave(): void {
    this.clearHoverTimeout();
    this.hoverTimeoutRef = setTimeout(() => {
      this.isHovering = false;
      this.cdr.markForCheck();
    }, 150);
  }

  /**
   * Handles click on the message body (for mobile).
   * Shows the options menu on mobile devices.
   *
   * @see Requirement 3.3
   */
  onBodyClick(): void {
    if (this.isMobile) {
      this.isHovering = !this.isHovering;
      this.cdr.markForCheck();
    }
  }

  /**
   * Handles option click from the context menu.
   * Closes the options menu and restores focus to the bubble.
   *
   * @see Requirements 3.6, 9.8
   */
  onOptionClick(option: ContextMenuItem): void {
    this.isHovering = false;
    this.cdr.markForCheck();
    this.optionClick.emit(option);

    // Restore focus to bubble after option selection
    this.restoreFocusToBubble();
  }

  /**
   * Handles click on the reply preview.
   * Emits the replyPreviewClick event with the quoted message.
   *
   * @param event - Optional mouse event to stop propagation
   * @see Requirements 7.5, 7.6
   */
  onReplyPreviewClick(event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    if (this.quotedMessage) {
      this.replyPreviewClick.emit(this.quotedMessage);
    }
  }

  /**
   * Handles keyboard navigation for the reply preview.
   * Activates on Enter or Space key press.
   *
   * @param event - Keyboard event
   * @see Requirement 7.7
   */
  onReplyPreviewKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault(); // Prevent default space scrolling
      event.stopPropagation();
      if (this.quotedMessage) {
        this.replyPreviewClick.emit(this.quotedMessage);
      }
    }
  }

  /**
   * Handles click on the avatar.
   */
  onAvatarClick(): void {
    if (this.sender) {
      this.avatarClick.emit(this.sender);
    }
  }

  /**
   * Handles click on the thread view.
   * Bubbles up the threadRepliesClick event with the current message.
   *
   * @see Requirement 10.6
   */
  onThreadClick(): void {
    this.threadRepliesClick.emit(this.message);
  }

  /**
   * Handles click on a reaction pill.
   * Emits the reactionClick event with the reaction and message.
   *
   * @param reaction - The reaction that was clicked
   * @see Requirement 7.2
   */
  onReactionClick(reaction: CometChat.ReactionCount): void {
    this.reactionClick.emit({
      reaction,
      message: this.message,
    });
  }

  /**
   * Handles click on a reaction list item from the overflow popover.
   * Emits the reactionListItemClick event.
   *
   * @param event - The reaction list item click event
   * @see Requirement 7.2
   */
  onReactionListItemClick(event: {
    reaction: CometChat.Reaction;
    message: CometChat.BaseMessage;
  }): void {
    this.reactionListItemClick.emit(event);
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Detects if the device is mobile.
   */
  private detectMobileDevice(): void {
    this.isMobile = window.innerWidth <= 768;
  }

  /**
   * Clears the hover timeout.
   */
  private clearHoverTimeout(): void {
    if (this.hoverTimeoutRef) {
      clearTimeout(this.hoverTimeoutRef);
      this.hoverTimeoutRef = null;
    }
  }

  /**
   * Sets up a ResizeObserver on the content view element to track its width.
   * The observed width is used to dynamically size the moderation indicator
   * so it matches the content bubble width (min 240px).
   *
   * Mirrors React's CometChatModerationView ResizeObserver pattern.
   */
  private setupContentViewResizeObserver(): void {
    if (!this.contentViewRef?.nativeElement) {
      return;
    }

    const contentEl = this.contentViewRef.nativeElement;

    this.contentViewResizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const newWidth = entry.contentRect.width;
        if (this.contentViewWidth() !== newWidth) {
          this.contentViewWidth.set(newWidth);
        }
      }
    });

    this.contentViewResizeObserver.observe(contentEl);
    // Set initial width
    this.contentViewWidth.set(contentEl.offsetWidth);
  }

  // ============================================================================
  // Accessibility Methods (Task 10.1, 10.2, Task 3.1)
  // Requirements: 16.1, 16.2, 16.4, 16.5, 16.6, 2.1-2.8
  // ============================================================================

  /**
   * Computes the accessible label for the message bubble.
   * Combines sender name, message type, content preview, timestamp, and reactions.
   * This is the primary accessibility label used by screen readers.
   *
   * @see Requirement 2.6 - aria-label combining sender name, message type, content preview, and timestamp
   * @see Requirement 2.8 - reactions announced as part of aria-label
   */
  get accessibleLabel(): string {
    const parts: string[] = [];

    // Sender name
    const senderName =
      this.sender?.getName() ||
      CometChatLocalize.getLocalizedString('accessibility_unknown_sender');
    parts.push(senderName);

    // Message type (localized)
    const typeKey = `accessibility_message_type_${this.messageType}`;
    const typeLabel = CometChatLocalize.getLocalizedString(typeKey);
    // Fallback to generic message type if key not found
    parts.push(
      typeLabel || CometChatLocalize.getLocalizedString('accessibility_message_type_custom')
    );

    // Content preview
    const preview = this.getContentPreview();
    if (preview) {
      parts.push(preview);
    }

    // Timestamp
    const timestamp = this.getFormattedTimestamp();
    if (timestamp) {
      parts.push(timestamp);
    }

    // Reactions summary
    if (this.hasReactions) {
      const reactionSummary = this.getReactionsSummary();
      if (reactionSummary) {
        parts.push(reactionSummary);
      }
    }

    // Edited indicator
    if (this.isEdited) {
      parts.push(CometChatLocalize.getLocalizedString('accessibility_message_edited'));
    }

    return parts.join(', ');
  }

  /**
   * Gets the ARIA label for the message bubble.
   * Uses the accessibleLabel computed property for comprehensive screen reader support.
   *
   * @see Requirement 2.6 - aria-label for message bubble
   */
  getAriaLabel(): string {
    // For deleted messages, return a simple deleted message label
    if (this.isDeleted) {
      const senderName =
        this.sender?.getName() ||
        CometChatLocalize.getLocalizedString('accessibility_unknown_sender');
      return CometChatLocalize.getLocalizedString('accessibility_message_deleted_from').replace(
        '{sender}',
        senderName
      );
    }

    return this.accessibleLabel;
  }

  /**
   * Gets content preview based on message type for accessibility.
   * Returns a truncated preview of the message content.
   *
   * @see Requirement 2.6 - content preview in aria-label
   */
  private getContentPreview(): string {
    if (this.isDeleted) {
      return '';
    }

    switch (this.messageType) {
      case 'text':
        const textMessage = this.message as CometChat.TextMessage;
        const text = textMessage.getText?.() || '';
        return this.truncateText(text, 100);
      case 'image':
        return CometChatLocalize.getLocalizedString('accessibility_image_message');
      case 'video':
        return CometChatLocalize.getLocalizedString('accessibility_video_message');
      case 'audio':
        return CometChatLocalize.getLocalizedString('accessibility_audio_message');
      case 'file':
        const fileMessage = this.message as CometChat.MediaMessage;
        const attachment = fileMessage.getAttachment?.();
        return (
          attachment?.getName?.() ||
          CometChatLocalize.getLocalizedString('accessibility_file_message')
        );
      default:
        // Check for poll
        if (this.messageType.includes('poll')) {
          const customData = (this.message as any).getCustomData?.();
          return (
            customData?.question ||
            CometChatLocalize.getLocalizedString('accessibility_poll_message')
          );
        }
        return '';
    }
  }

  /**
   * Truncates text to a maximum length with ellipsis.
   *
   * @param text - The text to truncate
   * @param maxLength - Maximum length before truncation
   * @returns Truncated text with ellipsis if needed
   */
  private truncateText(text: string, maxLength: number): string {
    if (!text || text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength).trim() + '...';
  }

  /**
   * Gets formatted timestamp for accessibility.
   *
   * @returns Formatted timestamp string
   */
  private getFormattedTimestamp(): string {
    if (!this.message) {
      return '';
    }
    const sentAt = this.message.getSentAt();
    if (!sentAt) {
      return '';
    }
    // Convert to milliseconds if needed (CometChat returns seconds)
    const timestamp = sentAt > 9999999999 ? sentAt : sentAt * 1000;
    return this.datePipe.transform(timestamp, 'short') || '';
  }

  /**
   * Gets reactions summary for aria-label.
   * Returns a human-readable summary of reactions on the message.
   *
   * @see Requirement 2.8 - reactions announced as part of aria-label
   */
  private getReactionsSummary(): string {
    const reactions = this.reactions;
    if (!reactions || reactions.length === 0) {
      return '';
    }

    const totalCount = reactions.reduce((sum, r) => sum + (r.getCount?.() || 0), 0);

    if (totalCount === 1) {
      return CometChatLocalize.getLocalizedString('accessibility_one_reaction');
    }

    return CometChatLocalize.getLocalizedString('accessibility_reactions_count').replace(
      '{count}',
      totalCount.toString()
    );
  }

  /**
   * Gets a human-readable label for the message type.
   * Used as fallback when localization key is not found.
   */
  private getMessageTypeLabel(): string {
    switch (this.messageType) {
      case 'text':
        return 'text message';
      case 'image':
        return 'image';
      case 'video':
        return 'video';
      case 'audio':
        return 'audio message';
      case 'file':
        return 'file';
      default:
        return 'message';
    }
  }

  /**
   * Determines if the message is a media message (audio, video, or image).
   * Used to determine if Space key should toggle media playback.
   *
   * @see Requirement 2.3 - Space toggles media playback for media messages
   */
  get isMediaMessage(): boolean {
    return ['audio', 'video', 'image'].includes(this.messageType);
  }

  /**
   * Handles keyboard navigation for the message bubble.
   * - Enter: Open message actions menu
   * - Shift+F10 or ContextMenu: Open message actions menu (context menu shortcut)
   * - Space: Toggle media playback for media messages, or open actions for non-media
   * - Escape: Close options menu and return focus to bubble
   *
   * @see Requirement 2.2 - Enter opens message actions
   * @see Requirement 2.3 - Space toggles media playback for media messages
   * @see Requirement 2.4 - Shift+F10/ContextMenu opens message actions
   */
  onKeyDown(event: KeyboardEvent): void {
    // When interaction is disabled, only allow media toggle (image/video fullscreen)
    if (this.disableInteraction) {
      if (event.key === ' ' && this.isMediaMessage) {
        event.preventDefault();
        this.mediaToggle.emit(this.message);
      }
      return;
    }

    switch (event.key) {
      case 'Enter':
        // Enter: Open message actions menu
        event.preventDefault();
        this.openMessageActions();
        break;

      case ' ':
        // Space: Toggle media playback for media messages
        event.preventDefault();
        if (this.isMediaMessage) {
          this.mediaToggle.emit(this.message);
        } else if (this.options.length > 0) {
          // For non-media messages, toggle options menu
          this.isHovering = !this.isHovering;
          this.cdr.markForCheck();
        }
        break;

      case 'F10':
        // Shift+F10: Open message actions (Windows context menu shortcut)
        if (event.shiftKey) {
          event.preventDefault();
          this.openMessageActions();
        }
        break;

      case 'ContextMenu':
        // ContextMenu key: Open message actions
        event.preventDefault();
        this.openMessageActions();
        break;

      case 'Escape':
        // Close options menu on Escape and return focus to bubble
        if (this.isHovering) {
          event.preventDefault();
          event.stopPropagation();
          this.isHovering = false;
          this.cdr.markForCheck();
          this.restoreFocusToBubble();
        }
        break;
    }
  }

  /**
   * Opens the message actions menu.
   * Shows the options menu and emits the messageActionsOpen event.
   *
   * @see Requirement 2.2, 2.4 - Keyboard triggers for message actions
   */
  private openMessageActions(): void {
    if (this.options.length > 0) {
      this.isHovering = true;
      this.cdr.markForCheck();
      this.messageActionsOpen.emit(this.message);
    }
  }

  /**
   * Restores focus to the message bubble wrapper element.
   * Used when options menu closes to maintain keyboard navigation flow.
   *
   * @see Requirement 9.8
   */
  private restoreFocusToBubble(): void {
    // Use setTimeout to ensure focus is restored after the menu is fully closed
    setTimeout(() => {
      if (this.bubbleWrapperRef?.nativeElement) {
        this.bubbleWrapperRef.nativeElement.focus();
      }
    }, 0);
  }

  // ============================================================================
  // Custom Message Helper Methods (Task 4.2)
  // Requirements: 3.1, 3.2, 3.3, 3.4
  // ============================================================================

  /**
   * Gets the sticker URL from a sticker message's metadata.
   * Sticker data is stored at `data.sticker_url` in the message metadata.
   *
   * @returns The sticker image URL or empty string if not found
   * @see Requirement 3.2
   */
  /**
   * Gets the document URL from a collaborative document message's metadata.
   * Document data is stored at `@injected.extensions.document.document_url`.
   *
   * @returns The document URL or empty string if not found
   * @see Requirement 3.3
   */
  getDocumentUrl(): string {
    if (!this.message) {
      return '';
    }

    try {
      // Cast to any to access getMetadata which exists on CustomMessage
      const metadata = (this.message as any).getMetadata?.() as Record<string, any> | null;
      if (!metadata) {
        return '';
      }

      // Check for document URL in @injected.extensions.document path
      const injected = metadata['@injected'];
      if (injected?.['extensions']?.['document']?.['document_url']) {
        return injected['extensions']['document']['document_url'];
      }

      // Check for document_url in data object (alternative format)
      if (metadata['data']?.['document_url']) {
        return metadata['data']['document_url'];
      }

      // Check in customData (another alternative format)
      const customData = (this.message as any).getCustomData?.();
      if (customData?.['document_url']) {
        return customData['document_url'];
      }

      return '';
    } catch (error) {
      console.warn('[CometChatMessageBubble] Error extracting document URL:', error);
      return '';
    }
  }

  /**
   * Gets the whiteboard URL from a collaborative whiteboard message's metadata.
   * Whiteboard data is stored at `@injected.extensions.whiteboard.board_url`.
   *
   * @returns The whiteboard URL or empty string if not found
   * @see Requirement 3.4
   */
  getWhiteboardUrl(): string {
    if (!this.message) {
      return '';
    }

    try {
      // Cast to any to access getMetadata which exists on CustomMessage
      const metadata = (this.message as any).getMetadata?.() as Record<string, any> | null;
      if (!metadata) {
        return '';
      }

      // Check for whiteboard URL in @injected.extensions.whiteboard path
      const injected = metadata['@injected'];
      if (injected?.['extensions']?.['whiteboard']?.['board_url']) {
        return injected['extensions']['whiteboard']['board_url'];
      }

      // Check for board_url in data object (alternative format)
      if (metadata['data']?.['board_url']) {
        return metadata['data']['board_url'];
      }

      // Check in customData (another alternative format)
      const customData = (this.message as any).getCustomData?.();
      if (customData?.['board_url']) {
        return customData['board_url'];
      }

      return '';
    } catch (error) {
      console.warn('[CometChatMessageBubble] Error extracting whiteboard URL:', error);
      return '';
    }
  }

  /**
   * Gets the button text for call messages based on call status.
   * Returns localized button text for joining or calling back.
   *
   * @returns The localized button text or empty string if no button should be shown
   */
  getCallButtonText(): string {
    if (!this.message) {
      return '';
    }

    const callMessage = this.message as any;
    const callStatus = callMessage.getStatus?.() || '';

    // Show "Join" button for ongoing calls
    if (
      callStatus === CometChatUIKitConstants.calls.ongoing ||
      callStatus === CometChatUIKitConstants.calls.initiated
    ) {
      return CometChatLocalize.getLocalizedString('message_list_join_call');
    }

    // Show "Join Call" for ended calls (to rejoin or call back)
    if (callStatus === CometChatUIKitConstants.calls.ended) {
      return CometChatLocalize.getLocalizedString('message_list_join_call');
    }

    return '';
  }

  /**
   * Handles the Join button click on a call bubble (meeting message).
   * Extracts the session ID and call type from the custom message data
   * and joins the meeting via the CallButtonsService, which shows the ongoing call screen.
   */
  onCallBubbleJoinClick(event: CallButtonClickEvent): void {
    const msg = event.message as any;
    const sessionId =
      event.sessionId ||
      msg?.getCustomData?.()?.sessionID ||
      msg?.getCustomData?.()?.sessionId ||
      msg?.getSessionId?.() ||
      '';

    // Extract call type from custom data to determine audio-only flag
    const customData = msg?.getCustomData?.();
    const callType = customData?.callType || msg?.getType?.();
    const isAudioOnly = callType === CometChatUIKitConstants.MessageTypes.audio;

    if (sessionId) {
      this.callButtonsService.joinMeeting(sessionId, isAudioOnly);
    }
  }
}
