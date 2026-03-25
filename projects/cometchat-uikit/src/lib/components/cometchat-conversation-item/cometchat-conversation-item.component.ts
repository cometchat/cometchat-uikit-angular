/**
 * CometChatConversationItem Component
 *
 * A focused component for rendering a single conversation item.
 * This component is part of the enterprise refactoring that decomposes
 * the monolithic CometChatConversations component into smaller, focused pieces.
 *
 * @module components/cometchat-conversation-item
 * @see Requirements 2.1, 2.2, 2.3, 2.5, 2.7
 */

import {
  Component,
  Input,
  Output,
  EventEmitter,
  TemplateRef,
  OnInit,
  OnDestroy,
  inject,
  computed,
  signal,
  booleanAttribute, ChangeDetectionStrategy} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatLocalize } from '../../resources/CometChatLocalize/cometchat-localize';
import { COMETCHAT_GLOBAL_CONFIG, GlobalConfig } from '../../services/global-config.service';

import { CometChatAvatarComponent } from '../base-elements/cometchat-avatar/cometchat-avatar.component';
import { CometChatDateComponent } from '../base-elements/cometchat-date/cometchat-date.component';
import { CometChatContextMenuComponent } from '../base-elements/cometchat-context-menu/cometchat-context-menu.component';
import { TranslatePipe } from '../../resources/CometChatLocalize/translate.pipe';
import {
  ConversationSlots,
  ConversationSlotContext,
} from '../../interfaces/conversation-slots.interface';
import { CalendarObject } from '../../resources/CometChatLocalize/localization.interfaces';
import { CometChatOption } from '../../modals/CometChatOption';
import { Placement } from '../../Enums/Enums';
import { CometChatMentionsFormatter } from '../../formatters/cometchat-mentions-formatter';
import { CometChatTextFormatter } from '../../formatters/cometchat-text-formatter';
import { FormatterConfigService } from '../../services/formatter-config.service';
import { HtmlSanitizerService } from '../../services/html-sanitizer.service';
import { ConversationSubtitleService } from '../../services/conversation-subtitle.service';
import { stripRichTextFormatting } from '../../utils/util';
import { CometChatUIKitConstants } from '../../constants';

/**
 * CometChatConversationItem is a standalone Angular component that renders
 * a single conversation item with support for:
 * - State management (active, selected, focused)
 * - Typing indicators
 * - Display configuration (hide receipts, user status, group type)
 * - Slot-based customization for fine-grained UI control
 * - Section templates for backward compatibility
 * - Granular event emission for specific user interactions
 *
 * @example
 * ```html
 * <cometchat-conversation-item
 *   [conversation]="conversation"
 *   [isActive]="isActive"
 *   [isSelected]="isSelected"
 *   [typingIndicator]="typingIndicator"
 *   (itemClick)="onItemClick($event)"
 *   (avatarClick)="onAvatarClick($event)">
 * </cometchat-conversation-item>
 * ```
 *
 * @see Requirements 2.1 - THE CometChatConversationItem component SHALL be a standalone Angular component
 * @see Requirements 2.2 - THE CometChatConversationItem component SHALL accept a CometChat.Conversation object as @Input
 * @see Requirements 2.3 - THE CometChatConversationItem component SHALL emit events for: itemClick, itemSelect, contextMenuOpen
 * @see Requirements 2.5 - THE CometChatConversationItem component SHALL support all existing customization inputs
 * @see Requirements 2.7 - THE CometChatConversationItem component SHALL support slot-based customization via ConversationSlots interface
 */
@Component({
  selector: 'cometchat-conversation-item',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    CometChatAvatarComponent,
    CometChatDateComponent,
    CometChatContextMenuComponent,
    TranslatePipe,
  ],
  templateUrl: './cometchat-conversation-item.component.html',
  styleUrls: ['./cometchat-conversation-item.component.css'],
})
export class CometChatConversationItemComponent implements OnInit, OnDestroy {
  // ============================================
  // Global Config Injection
  // ============================================

  /** Global config injected via token (static configuration) */
  private globalConfig: Partial<GlobalConfig> | null = inject(COMETCHAT_GLOBAL_CONFIG, {
    optional: true,
  });

  /** Service for custom subtitle text and icon overrides per message type */
  private subtitleService = inject(ConversationSubtitleService);

  // ============================================
  // Required Inputs
  // ============================================

  /**
   * The conversation object to render.
   * This is the primary data source for the component.
   *
   * @required
   * @see Requirements 2.2
   */
  @Input({ required: true }) conversation!: CometChat.Conversation;

  // ============================================
  // State Inputs
  // ============================================

  /**
   * Whether this conversation is currently active/selected for viewing.
   * When true, applies active styling to the item.
   *
   * @default false
   */
  @Input() isActive = false;

  /**
   * Whether this conversation is selected in selection mode.
   * When true, applies selected styling and shows selection indicator.
   *
   * @default false
   */
  @Input() isSelected = false;

  /**
   * Whether this conversation item currently has keyboard focus.
   * When true, applies focus styling for accessibility.
   *
   * @default false
   */
  @Input() isFocused = false;

  /**
   * The tabindex for this conversation item.
   * Used for roving tabindex pattern - only focused item should have tabindex=0.
   * When -1, item is not focusable via Tab but can receive programmatic focus.
   *
   * @default -1
   */
  @Input() tabIndex = -1;

  /**
   * The typing indicator for this conversation, if someone is typing.
   * When provided, displays typing animation and text.
   *
   * @default null
   */
  @Input() typingIndicator: CometChat.TypingIndicator | null = null;

  /**
   * The logged-in user, used to determine receipt status and "You:" prefix.
   * Should be passed from parent component.
   *
   * @default null
   */
  @Input() loggedInUser: CometChat.User | null = null;

  // ============================================
  // Display Configuration Inputs (GlobalConfig Priority System)
  // ============================================

  // Track if @Input was explicitly set (for global config priority system)
  private hideReceiptsExplicitlySet = signal(false);
  private hideUserStatusExplicitlySet = signal(false);
  private hideGroupTypeExplicitlySet = signal(false);
  private disableDefaultContextMenuExplicitlySet = signal(false);
  private textFormattersExplicitlySet = signal(false);

  // Private backing fields for tracked @Input properties
  private _hideReceipts = signal(false);
  private _hideUserStatus = signal(false);
  private _hideGroupType = signal(false);
  private _disableDefaultContextMenu = signal(true);
  private _textFormatters = signal<CometChatTextFormatter[]>([]);

  /**
   * Whether to hide message receipts (sent, delivered, read indicators).
   *
   * @default false
   * @see Requirements 2.5
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
   * Whether to hide the user online/offline status indicator.
   *
   * @default false
   * @see Requirements 2.5
   */
  @Input({ transform: booleanAttribute })
  set hideUserStatus(value: boolean) {
    this._hideUserStatus.set(value);
    this.hideUserStatusExplicitlySet.set(true);
  }
  get hideUserStatus(): boolean {
    return this._hideUserStatus();
  }

  /**
   * Whether to hide the group type icon (public, private, password).
   *
   * @default false
   * @see Requirements 2.5
   */
  @Input({ transform: booleanAttribute })
  set hideGroupType(value: boolean) {
    this._hideGroupType.set(value);
    this.hideGroupTypeExplicitlySet.set(true);
  }
  get hideGroupType(): boolean {
    return this._hideGroupType();
  }

  /**
   * Custom date format configuration for the timestamp display.
   * Uses CalendarObject interface for flexible date formatting.
   */
  @Input() dateFormat?: CalendarObject;

  /**
   * Whether to disable the browser's default context menu (tooltip) on long press/right-click.
   * When true (default), the browser's context menu is disabled to show only the custom menu.
   * Set to false to allow the browser's default context menu behavior.
   *
   * @default true
   */
  @Input({ transform: booleanAttribute })
  set disableDefaultContextMenu(value: boolean) {
    this._disableDefaultContextMenu.set(value);
    this.disableDefaultContextMenuExplicitlySet.set(true);
  }
  get disableDefaultContextMenu(): boolean {
    return this._disableDefaultContextMenu();
  }

  /**
   * Text formatters to apply to the last message subtitle.
   * If not provided, defaults from FormatterConfigService will be used.
   * Formatters are applied in priority order to format mentions, URLs, etc.
   *
   * @see Requirements 4.1, 4.2, 4.3
   */
  @Input()
  set textFormatters(value: CometChatTextFormatter[]) {
    this._textFormatters.set(value);
    this.textFormattersExplicitlySet.set(true);
  }
  get textFormatters(): CometChatTextFormatter[] {
    return this._textFormatters();
  }

  // ============================================
  // Effective Value Computed Signals (Priority System)
  // ============================================
  /**
   * Computed effective values implementing the priority system:
   * 1. If @Input was explicitly set → use @Input value
   * 2. Else if global config is set (not undefined) → use global config value
   * 3. Else → use internal default value
   */
  effectiveHideReceipts = computed(() => {
    if (this.hideReceiptsExplicitlySet()) return this._hideReceipts();
    if (this.globalConfig?.hideReceipts !== undefined) return this.globalConfig.hideReceipts;
    return false;
  });

  effectiveHideUserStatus = computed(() => {
    if (this.hideUserStatusExplicitlySet()) return this._hideUserStatus();
    if (this.globalConfig?.hideUserStatus !== undefined) return this.globalConfig.hideUserStatus;
    return false;
  });

  effectiveHideGroupType = computed(() => {
    if (this.hideGroupTypeExplicitlySet()) return this._hideGroupType();
    if (this.globalConfig?.hideGroupType !== undefined) return this.globalConfig.hideGroupType;
    return false;
  });

  effectiveDisableDefaultContextMenu = computed(() => {
    if (this.disableDefaultContextMenuExplicitlySet()) return this._disableDefaultContextMenu();
    if (this.globalConfig?.disableDefaultContextMenu !== undefined)
      return this.globalConfig.disableDefaultContextMenu;
    return true;
  });

  effectiveTextFormatters = computed(() => {
    if (this.textFormattersExplicitlySet()) return this._textFormatters();
    if (this.globalConfig?.textFormatters !== undefined) return this.globalConfig.textFormatters;
    return [];
  });

  // ============================================
  // Customization Inputs
  // ============================================

  /**
   * Slot-based customization for fine-grained UI control.
   * Allows overriding specific UI elements without affecting others.
   *
   * @see Requirements 2.7, 5.1
   * @example
   * ```typescript
   * const slots: Partial<ConversationSlots> = {
   *   avatar: myCustomAvatarTemplate,
   *   unreadBadge: myCustomBadgeTemplate,
   * };
   * ```
   */
  @Input() slots?: Partial<ConversationSlots>;

  /**
   * Options for the context menu displayed on hover/right-click.
   * Each option can have an id, title, iconURL, and onClick handler.
   */
  @Input() contextMenuOptions?: CometChatOption[];

  // ============================================
  // Section Templates (Backward Compatibility)
  // ============================================

  /**
   * Custom template for the leading section (avatar area).
   * For backward compatibility with existing implementations.
   */
  @Input() leadingView?: TemplateRef<{ $implicit: CometChat.Conversation }>;

  /**
   * Custom template for the title section.
   * For backward compatibility with existing implementations.
   */
  @Input() titleView?: TemplateRef<{ $implicit: CometChat.Conversation }>;

  /**
   * Custom template for the subtitle section.
   * For backward compatibility with existing implementations.
   */
  @Input() subtitleView?: TemplateRef<{ $implicit: CometChat.Conversation }>;

  /**
   * Custom template for the trailing section (timestamp, badge area).
   * For backward compatibility with existing implementations.
   */
  @Input() trailingView?: TemplateRef<{ $implicit: CometChat.Conversation }>;

  // ============================================
  // Output Events
  // ============================================

  /**
   * Emitted when the conversation item is clicked.
   *
   * @see Requirements 2.3
   */
  @Output() itemClick = new EventEmitter<CometChat.Conversation>();

  /**
   * Emitted when the conversation is selected/deselected in selection mode.
   * Includes the conversation and the new selection state.
   *
   * @see Requirements 2.3
   */
  @Output() itemSelect = new EventEmitter<{
    conversation: CometChat.Conversation;
    selected: boolean;
  }>();

  /**
   * Emitted when the avatar is clicked.
   * Allows handling avatar clicks separately from item clicks.
   *
   * @see Requirements 7.1
   */
  @Output() avatarClick = new EventEmitter<CometChat.Conversation>();

  /**
   * Emitted when the title is clicked.
   * Allows handling title clicks separately from item clicks.
   *
   * @see Requirements 7.2
   */
  @Output() titleClick = new EventEmitter<CometChat.Conversation>();

  /**
   * Emitted when the subtitle is clicked.
   * Allows handling subtitle clicks separately from item clicks.
   *
   * @see Requirements 7.3
   */
  @Output() subtitleClick = new EventEmitter<CometChat.Conversation>();

  /**
   * Emitted when the timestamp is clicked.
   * Allows handling timestamp clicks separately from item clicks.
   *
   * @see Requirements 7.4
   */
  @Output() timestampClick = new EventEmitter<CometChat.Conversation>();

  /**
   * Emitted when the unread badge is clicked.
   * Allows handling badge clicks separately from item clicks.
   *
   * @see Requirements 7.5
   */
  @Output() badgeClick = new EventEmitter<CometChat.Conversation>();

  /**
   * Emitted when the context menu is opened.
   *
   * @see Requirements 2.3
   */
  @Output() contextMenuOpen = new EventEmitter<CometChat.Conversation>();

  /**
   * Emitted when a context menu option is clicked.
   * Includes the selected option and the conversation.
   */
  @Output() contextMenuOptionClick = new EventEmitter<{
    option: CometChatOption;
    conversation: CometChat.Conversation;
  }>();

  /**
   * Emitted when the context menu should be opened via keyboard.
   * This allows the parent component to handle context menu display.
   */
  @Output() contextMenuKeyboardOpen = new EventEmitter<CometChat.Conversation>();

  // ============================================
  // Template Exposed Properties
  // ============================================

  /**
   * Expose Placement enum to template for context menu positioning.
   */
  readonly Placement = Placement;

  /**
   * Whether the conversation item is currently hovered.
   * Used to toggle between tail view (timestamp + badge) and context menu.
   */
  isHovered = false;

  // ============================================
  // Constructor
  // ============================================

  /**
   * Constructor to inject required services.
   * @param formatterConfig - Service for managing default text formatters
   * @param htmlSanitizer - Service for sanitizing HTML output
   */
  constructor(
    private formatterConfig: FormatterConfigService,
    private htmlSanitizer: HtmlSanitizerService
  ) {}

  // ============================================
  // Lifecycle Hooks
  // ============================================

  /**
   * Initialize the component.
   * Fetches the logged-in user if not provided via input.
   */
  async ngOnInit(): Promise<void> {
    if (!this.loggedInUser) {
      try {
        this.loggedInUser = await CometChat.getLoggedinUser();
      } catch (error) {
        console.error('[CometChatConversationItem] Error getting logged-in user:', error);
      }
    }
  }

  /**
   * Clean up on destroy.
   */
  ngOnDestroy(): void {
    // Cleanup if needed in the future
  }

  // ============================================
  // Computed Properties and Getters
  // @see Requirements 2.2
  // ============================================

  /**
   * Gets the entity (User or Group) that this conversation is with.
   * This is the primary accessor for conversation participant data.
   *
   * @returns The User or Group object associated with this conversation, or null
   */
  get conversationWith(): CometChat.User | CometChat.Group | null {
    try {
      return this.conversation?.getConversationWith() || null;
    } catch {
      return null;
    }
  }

  /**
   * Determines if this is a one-on-one user conversation.
   *
   * @returns true if the conversation is with a User, false otherwise
   */
  get isUserConversation(): boolean {
    return this.conversationWith instanceof CometChat.User;
  }

  /**
   * Determines if this is a group conversation.
   *
   * @returns true if the conversation is with a Group, false otherwise
   */
  get isGroupConversation(): boolean {
    return this.conversationWith instanceof CometChat.Group;
  }

  /**
   * Gets the avatar image URL for the conversation.
   * For user conversations, returns the user's avatar.
   * For group conversations, returns the group's icon.
   *
   * @returns The avatar/icon URL or empty string if not available
   */
  get avatarImage(): string {
    if (!this.conversationWith) return '';
    if (this.isUserConversation) {
      return (this.conversationWith as CometChat.User).getAvatar() || '';
    }
    return (this.conversationWith as CometChat.Group).getIcon() || '';
  }

  /**
   * Gets the display name for the conversation.
   * Returns the name of the user or group.
   *
   * @returns The name of the conversation participant or empty string
   */
  get avatarName(): string {
    return this.conversationWith?.getName() || '';
  }

  /**
   * Gets the online/offline status for user conversations.
   * Returns empty string for group conversations.
   *
   * @returns The user's status ('online', 'offline', etc.) or empty string for groups
   */
  get userStatus(): string {
    if (this.isUserConversation && this.conversationWith) {
      return (this.conversationWith as CometChat.User).getStatus() || 'offline';
    }
    return '';
  }

  /**
   * Gets the group type for group conversations.
   * Returns empty string for user conversations.
   *
   * @returns The group type ('public', 'private', 'password') or empty string for users
   */
  get groupType(): string {
    if (this.isGroupConversation && this.conversationWith) {
      return (this.conversationWith as CometChat.Group).getType() || '';
    }
    return '';
  }

  /**
   * Gets the count of unread messages in this conversation.
   *
   * @returns The number of unread messages, or 0 if none
   */
  get unreadCount(): number {
    return this.conversation.getUnreadMessageCount() || 0;
  }

  /**
   * Gets the last message in this conversation.
   *
   * @returns The last BaseMessage object, or undefined if no messages
   */
  get lastMessage(): CometChat.BaseMessage | undefined {
    return this.conversation.getLastMessage();
  }

  /**
   * Gets the timestamp of the last message in this conversation.
   * Returns 0 if there is no last message.
   *
   * @returns The Unix timestamp of the last message, or 0
   */
  get lastMessageTimestamp(): number {
    return this.lastMessage?.getSentAt() || 0;
  }

  /**
   * Determines if someone is currently typing in this conversation.
   *
   * @returns true if there is an active typing indicator, false otherwise
   */
  get isTyping(): boolean {
    return this.typingIndicator !== null;
  }

  /**
   * Determines if the last message was sent by the logged-in user.
   *
   * @returns true if the logged-in user sent the last message, false otherwise
   */
  get isLastMessageByMe(): boolean {
    if (!this.lastMessage || !this.loggedInUser) return false;
    const sender = this.lastMessage.getSender();
    return sender?.getUid() === this.loggedInUser.getUid();
  }

  /**
   * Determines if the conversation has any messages.
   *
   * @returns true if there is a last message, false otherwise
   */
  get hasLastMessage(): boolean {
    return !!this.lastMessage;
  }

  /**
   * Gets the receipt status for the last message.
   * Only applicable for messages sent by the logged-in user.
   *
   * @returns 'wait' | 'sent' | 'delivered' | 'read' | null
   */
  get receiptStatus(): 'wait' | 'sent' | 'delivered' | 'read' | null {
    if (
      !this.lastMessage ||
      !this.isLastMessageByMe ||
      this.lastMessage.getDeletedAt() ||
      this.lastMessage.getCategory() == CometChatUIKitConstants.MessageCategory.action ||
      this.lastMessage.getCategory() == CometChatUIKitConstants.MessageCategory.call
    )
      return null;

    const sentAt = this.lastMessage.getSentAt();
    const deliveredAt = this.lastMessage.getDeliveredAt();
    const readAt = this.lastMessage.getReadAt();

    if (readAt) return 'read';
    if (deliveredAt) return 'delivered';
    if (sentAt) return 'sent';
    return 'wait';
  }

  /**
   * Gets the subtitle text for the conversation.
   * Handles different message types and formats appropriately.
   * For text messages, applies formatters to render mentions and rich text.
   *
   * @returns The formatted subtitle text (may contain HTML for mentions)
   * @see Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.7
   */
  get subtitleText(): string {
    if (!this.lastMessage) {
      return CometChatLocalize.getLocalizedString('conversation_start');
    }

    // Check ConversationSubtitleService for a custom formatter before default logic
    const typeKey = `${this.lastMessage.getType()}_${this.lastMessage.getCategory()}`;
    const customSubtitle = this.subtitleService.getSubtitle(typeKey, this.lastMessage);
    if (customSubtitle !== null) {
      return customSubtitle;
    }

    // Check if message is deleted
    if (this.lastMessage.getDeletedAt()) {
      return CometChatLocalize.getLocalizedString('conversation_subtitle_deleted_message');
    }

    const messageType = this.lastMessage.getType();
    const messageCategory = this.lastMessage.getCategory();

    // Handle action messages (group actions like join, leave, etc.)
    if (messageCategory === 'action') {
      return this.getActionMessageText();
    }

    // Handle call messages
    if (messageCategory === 'call') {
      return this.getCallMessageText();
    }

    // Handle group meeting (direct call) messages (category: custom, type: meeting)
    if (messageCategory === 'custom' && messageType === 'meeting') {
      return this.getMeetingMessageText();
    }

    // Handle different message types
    switch (messageType) {
      case 'text': {
        // If the message is a URL or markdown link, show plain text with the link icon.
        // For plain URLs: show the URL as-is.
        // For markdown links [text](url): extract just the display text.
        const textMsg = this.lastMessage as CometChat.TextMessage;
        const rawTextForSubtitle = textMsg.getText() || '';
        if (this.hasMarkdownLink(rawTextForSubtitle)) {
          // Extract display text from markdown link(s): [text](url) → text
          return rawTextForSubtitle.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
        }
        if (this.isURL(rawTextForSubtitle)) {
          return rawTextForSubtitle;
        }
        return this.formatLastMessageSubtitle();
      }

      case 'image':
        return CometChatLocalize.getLocalizedString('conversation_subtitle_image');

      case 'video':
        return CometChatLocalize.getLocalizedString('conversation_subtitle_video');

      case 'audio':
        return CometChatLocalize.getLocalizedString('conversation_subtitle_audio');

      case 'file':
        return CometChatLocalize.getLocalizedString('conversation_subtitle_file');

      case 'extension_poll':
        return CometChatLocalize.getLocalizedString('conversation_subtitle_poll');

      case 'extension_sticker':
        return CometChatLocalize.getLocalizedString('conversation_subtitle_sticker');

      case 'extension_document':
        return CometChatLocalize.getLocalizedString('conversation_subtitle_collaborative_document');

      case 'extension_whiteboard':
        return CometChatLocalize.getLocalizedString(
          'conversation_subtitle_collaborative_whiteboard'
        );

      default:
        // For custom messages, try to get text or return generic message
        if (messageCategory === 'custom') {
          return this.getCustomMessageText() || messageType;
        }
        return messageType;
    }
  }

  /**
   * Gets the icon name for the subtitle based on message type.
   * Returns empty string for text messages without links, or 'none' to hide the icon.
   *
   * @returns The icon name suffix for CSS class (e.g., 'image', 'video', 'link')
   */
  get subtitleIconName(): string {
    if (!this.lastMessage) {
      return 'none';
    }

    // Check ConversationSubtitleService for a custom icon override before default logic
    const typeKey = `${this.lastMessage.getType()}_${this.lastMessage.getCategory()}`;
    const iconOverride = this.subtitleService.getIconOverride(typeKey);
    if (iconOverride !== null) {
      return iconOverride;
    }

    // Check if message is deleted
    if (this.lastMessage.getDeletedAt()) {
      return 'deleted';
    }

    const messageType = this.lastMessage.getType();
    const messageCategory = this.lastMessage.getCategory();

    // Handle action messages - no icon
    if (messageCategory === 'action') {
      return 'none';
    }

    // Handle call messages
    if (messageCategory === 'call') {
      return this.getCallIconName();
    }

    // Handle interactive messages - no icon
    if (messageCategory === 'interactive') {
      return 'none';
    }

    // Handle group meeting (direct call) messages
    if (messageCategory === 'custom' && messageType === 'meeting') {
      return this.getMeetingIconName();
    }

    // Handle different message types
    switch (messageType) {
      case 'text':
        // Check if text is a URL or contains a markdown link [text](url)
        const textMessage = this.lastMessage as CometChat.TextMessage;
        const text = textMessage.getText() || '';
        if (this.isURL(text) || this.hasMarkdownLink(text)) {
          return 'link';
        }
        return 'none';

      case 'image':
        return 'image';

      case 'video':
        return 'video';

      case 'audio':
        return 'audio';

      case 'file':
        return 'file';

      case 'extension_poll':
        return 'poll';

      case 'extension_sticker':
        return 'sticker';

      case 'extension_document':
        return 'collaborative-document';

      case 'extension_whiteboard':
        return 'collaborative-whiteboard';

      default:
        // For custom/unknown message types
        return 'unsupported';
    }
  }

  /**
   * Gets the icon name for call messages based on call status and type.
   * Uses getCallInitiator() (not getSender()) to determine call direction,
   * matching the React UIKit's isMissedCall logic.
   * @private
   */
  private getCallIconName(): string {
    const call = this.lastMessage as CometChat.Call;
    const callType = call.getType?.() || '';
    const isMissed = this.isMissedCall(call);

    if (isMissed) {
      // Incoming missed call — shown with error color via CSS
      return callType === CometChatUIKitConstants.MessageTypes.audio
        ? 'incoming-audio-call'
        : 'incoming-video-call';
    }

    // Outgoing or completed calls
    return callType === CometChatUIKitConstants.MessageTypes.audio
      ? 'outgoing-audio-call'
      : 'outgoing-video-call';
  }

  /**
   * Determines if a call was missed by the logged-in user.
   * A call is missed when:
   * 1. The logged-in user did NOT initiate the call (it was incoming)
   * 2. The call status is one of: unanswered, cancelled, busy, rejected
   *
   * Uses getCallInitiator() to determine who started the call,
   * NOT getSender() which may differ for call messages.
   * @private
   */
  private isMissedCall(call: CometChat.Call): boolean {
    const callStatus = call.getStatus?.() || '';

    // Determine if the logged-in user initiated the call
    let initiatorUid = '';
    try {
      initiatorUid = call.getCallInitiator?.()?.getUid?.() || '';
    } catch {
      // Fallback: if getCallInitiator is not available, try getInitiator
      try {
        initiatorUid = (call as any).getInitiator?.()?.getUid?.() || '';
      } catch {
        // Cannot determine initiator
      }
    }

    const sentByMe = !initiatorUid || initiatorUid === this.loggedInUser?.getUid();

    // If the logged-in user initiated the call, it's not a missed call for them
    if (sentByMe) {
      return false;
    }

    // Check if the call status indicates a missed call
    const missedStatuses = [
      CometChatUIKitConstants.calls.unanswered,
      CometChatUIKitConstants.calls.cancelled,
      CometChatUIKitConstants.calls.busy,
      CometChatUIKitConstants.calls.rejected,
    ];

    return missedStatuses.includes(callStatus);
  }

  /**
   * Gets the icon name for group meeting (direct call) messages.
   * Extracts callType from customData to determine audio vs video.
   * @private
   */
  private getMeetingIconName(): string {
    try {
      const customMessage = this.lastMessage as CometChat.CustomMessage;
      const customData = customMessage.getCustomData?.() as Record<string, any> | undefined;
      const callType = customData?.['callType'] || '';

      if (callType === CometChatUIKitConstants.MessageTypes.audio) {
        return 'meeting-audio-call';
      }
      return 'meeting-video-call';
    } catch {
      return 'meeting-video-call';
    }
  }

  /**
   * Checks if a string is a URL.
   * @private
   */
  private isURL(text: string): boolean {
    if (!text) return false;
    const urlPattern = /(https?:\/\/|www\.)\S+/i;
    return urlPattern.test(text.trim());
  }

  /**
   * Checks if text contains a markdown link [text](url).
   * @private
   */
  private hasMarkdownLink(text: string): boolean {
    if (!text) return false;
    return /\[([^\]]+)\]\(([^)]+)\)/.test(text);
  }

  /**
   * Formats the last message subtitle with text formatters.
   * Applies the formatter pipeline to render mentions and rich text.
   * Uses restrictive sanitization for conversation list context.
   *
   * @returns The formatted and sanitized HTML string or plain text
   * @private
   * @see Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6
   */
  private formatLastMessageSubtitle(): string {
    const textMessage = this.lastMessage as CometChat.TextMessage;
    const rawText = textMessage.getText() || '';
    const mentionedUsers = textMessage.getMentionedUsers() || [];

    // Check for rich text metadata HTML (legacy messages from other platforms).
    // If the message has richText.html with formatting, use it directly.
    try {
      const metadata = textMessage.getMetadata?.() as Record<string, any> | undefined;
      const richText = metadata?.['richText'] as
        | { html?: string; hasFormatting?: boolean }
        | undefined;
      if (richText?.html && richText?.hasFormatting) {
        const sanitized = this.sanitizeSubtitleHtml(richText.html);
        if (sanitized) {
          return sanitized;
        }
      }
    } catch {
      // Fall through to markdown/formatter-based approach
    }

    // Convert markdown formatting markers to HTML for rich text display.
    // Conversation subtitle shows bold, italic, etc. like Slack does.
    // This converts **bold** → <strong>bold</strong>, etc.
    const hasMarkdownFormatting = /(\*\*|__|~~|`|_(?=[^\s]))/.test(rawText);
    const hasMarkdownLinks = this.hasMarkdownLink(rawText);
    if (hasMarkdownFormatting || hasMarkdownLinks) {
      // Escape HTML first to prevent XSS, then convert markdown to HTML
      const escaped = this.htmlSanitizer.escapeUserHtml(rawText);
      const htmlText = this.convertMarkdownToHtml(escaped);

      // Get formatters and apply mentions + custom formatters
      const formatters = this.getFormattersForSubtitle();
      const mentionedUsers = textMessage.getMentionedUsers() || [];
      let formattedText = htmlText;

      for (const formatter of formatters) {
        try {
          if (formatter instanceof CometChatMentionsFormatter) {
            if (this.hasSdkMentionTags(rawText) && formatter.shouldFormat(formattedText, this.lastMessage)) {
              formattedText = formatter.formatSdkMentions(formattedText, mentionedUsers);
            }
          } else if (formatter.id !== 'tiptap-formatter') {
            if (formatter.shouldFormat(formattedText, this.lastMessage)) {
              formattedText = formatter.format(formattedText);
            }
          }
        } catch {
          // Continue on error
        }
      }

      return this.sanitizeSubtitleHtml(formattedText);
    }

    // Strip rich text formatting markers first (bold, italic, etc.)
    // This converts **bold** to bold, *italic* to italic, etc.
    const plainText = stripRichTextFormatting(rawText);

    // Get formatters (from input or defaults)
    const formatters = this.getFormattersForSubtitle();

    // If no formatters, return plain text with mentions formatted as plain text
    if (!formatters || formatters.length === 0) {
      return this.formatPlainMentions(plainText, mentionedUsers);
    }

    // Check if we have SDK mentions to format (user mentions OR channel mentions)
    const hasSdkMentions = this.hasSdkMentionTags(plainText);

    // Check for custom formatters (non-mentions, non-rich-text) that produce HTML
    const hasCustomFormatters = formatters.some(
      f => !(f instanceof CometChatMentionsFormatter) && f.id !== 'tiptap-formatter'
    );

    if (!hasSdkMentions && !hasCustomFormatters) {
      // No SDK mentions and no custom formatters — return plain text as-is.
      // The template uses {{ }} interpolation for this path, which auto-escapes HTML.
      return plainText;
    }

    // Check if we have a mentions formatter configured
    const hasMentionsFormatter = formatters.some(f => f instanceof CometChatMentionsFormatter);

    // If no mentions formatter and no custom formatters, return plain text with mentions formatted as plain text
    if (!hasMentionsFormatter && !hasCustomFormatters) {
      return this.formatPlainMentions(plainText, mentionedUsers);
    }

    // For the [innerHTML] path, escape HTML entities in user text
    // before applying formatters. This prevents XSS payloads from being interpreted as HTML.
    const escapedText = this.htmlSanitizer.escapeUserHtml(plainText);

    // Apply all formatters except rich text (mentions, URL, custom)
    let formattedText = escapedText;
    for (const formatter of formatters) {
      try {
        if (formatter instanceof CometChatMentionsFormatter) {
          // Process mentions formatter for subtitle
          if (hasSdkMentions && formatter.shouldFormat(formattedText, this.lastMessage)) {
            formattedText = formatter.formatSdkMentions(formattedText, mentionedUsers);
          }
        } else if (formatter.id !== 'tiptap-formatter') {
          // Apply URL formatter, custom formatters (e.g., hashtag formatter)
          if (formatter.shouldFormat(formattedText, this.lastMessage)) {
            formattedText = formatter.format(formattedText);
          }
        }
      } catch (error) {
        console.error('[CometChatConversationItem] Formatter error:', error);
        // Continue with current text on error
      }
    }

    // Sanitize with restrictive config (only span tags for subtitles)
    const sanitized = this.sanitizeSubtitleHtml(formattedText);
    return sanitized;
  }

  /**
   * Converts markdown formatting markers to HTML tags for rich text display
   * in conversation subtitles (like Slack).
   *
   * Order matters: double markers (**,__) must be processed before single (* ,_)
   * to avoid partial matches.
   *
   * Input text is already HTML-escaped, so only markdown markers need conversion.
   *
   * @param text - HTML-escaped text containing markdown markers
   * @returns Text with markdown markers converted to HTML tags
   * @private
   */
  private convertMarkdownToHtml(text: string): string {
    if (!text) return '';

    let result = text;

    // Inline code: `text` (process first to protect code content from other conversions)
    result = result.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Bold: **text**
    result = result.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

    // Bold: *text* (single asterisk = bold, matching the editor's behavior)
    result = result.replace(/(?<!\*)\*(?!\*)([^*]+)\*(?!\*)/g, '<strong>$1</strong>');

    // Underline: __text__
    result = result.replace(/__([^_]+)__/g, '<u>$1</u>');

    // Italic: _text_ (single underscore, not part of __)
    result = result.replace(/(?<!_)_(?!_)([^_]+)_(?!_)/g, '<em>$1</em>');

    // Strikethrough: ~~text~~
    result = result.replace(/~~([^~]+)~~/g, '<s>$1</s>');

    // Markdown links: [text](url) → <a> tags
    result = result.replace(
      /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer" class="cometchat-link">$1</a>'
    );

    return result;
  }

  /**
   * Gets formatters configured for subtitle rendering.
   * Uses input formatters or defaults from service.
   * Configures mentions formatter with logged-in user but NO alignment.
   *
   * @returns Array of configured formatters
   * @private
   * @see Requirements 4.3, 4.6
   */
  private getFormattersForSubtitle(): CometChatTextFormatter[] {
    // Use effective formatters (priority: @Input > GlobalConfig > default)
    const effectiveFormatters = this.effectiveTextFormatters();
    const formatters =
      effectiveFormatters.length > 0
        ? effectiveFormatters
        : this.formatterConfig.getDefaultFormatters();

    // Configure each formatter
    return formatters.map(formatter => {
      if (formatter instanceof CometChatMentionsFormatter) {
        // Clone the formatter to avoid mutating shared instance
        const cloned = new CometChatMentionsFormatter();
        cloned.setLoggedInUser(this.loggedInUser);
        // Do NOT set alignment - no direction classes in subtitle
        return cloned;
      }
      return formatter;
    });
  }

  /**
   * Checks if text contains SDK mention tags.
   * @private
   */
  private hasSdkMentionTags(text: string): boolean {
    if (!text) return false;
    // Check for user mentions: <@uid:xxx>
    // Check for channel mentions: <@all:xxx>
    return /<@uid:[^>]+>/.test(text) || /<@all:[^>]+>/.test(text);
  }

  /**
   * Returns true when the last message is a text message containing SDK mention tags
   * AND we have a mentions formatter configured to produce HTML output.
   * Used by the template to decide between [innerHTML] and text interpolation.
   *
   * @returns true if the subtitle contains formatted mention HTML
   * @see Requirements 2.1, 2.3
   */
  get subtitleHasHtml(): boolean {
    if (!this.lastMessage || this.lastMessage.getDeletedAt()) {
      return false;
    }
    if (this.lastMessage.getType() !== 'text' || this.lastMessage.getCategory() !== 'message') {
      return false;
    }
    const textMessage = this.lastMessage as CometChat.TextMessage;
    const rawText = textMessage.getText() || '';

    // Check for rich text metadata (legacy messages from other platforms)
    // If the message has richText.html with formatting, HTML rendering is needed.
    try {
      const metadata = textMessage.getMetadata?.() as Record<string, any> | undefined;
      const richText = metadata?.['richText'] as
        | { html?: string; hasFormatting?: boolean }
        | undefined;
      if (richText?.html && richText?.hasFormatting) {
        return true;
      }
    } catch {
      // Fall through to other checks
    }

    // If the message is a URL or markdown link, subtitle shows a plain localized string — no HTML needed.
    if (this.isURL(rawText) || this.hasMarkdownLink(rawText)) {
      return false;
    }

    // Check for markdown formatting markers in the raw text
    const hasMarkdownFormatting = /(\*\*|__|~~|`|_(?=[^\s]))/.test(rawText);
    if (hasMarkdownFormatting) {
      return true;
    }

    // Check for markdown links [text](url) — these need HTML rendering as <a> tags
    if (this.hasMarkdownLink(rawText)) {
      return true;
    }

    // Check if we have formatters configured
    const formatters = this.getFormattersForSubtitle();
    if (!formatters || formatters.length === 0) {
      return false; // No formatters, will use plain text
    }

    // Check for SDK mention tags (user mentions OR channel mentions)
    const hasSdkMentions = this.hasSdkMentionTags(rawText);

    // Check if we have a mentions formatter that will produce HTML
    const hasMentionsFormatter = formatters.some(f => f instanceof CometChatMentionsFormatter);

    // Check for custom formatters (non-mentions, non-rich-text) that produce HTML
    const hasCustomFormatters = formatters.some(
      f => !(f instanceof CometChatMentionsFormatter) && f.id !== 'tiptap-formatter'
    );

    return (hasSdkMentions && hasMentionsFormatter) || hasCustomFormatters;
  }

  /**
   * Sanitizes HTML content for the subtitle using DOMPurify.
   * Only allows `<span>` tags with `class`, `data-uid`, and `data-mention-type` attributes.
   * More restrictive than text bubble sanitization.
   *
   * @param html - The HTML string to sanitize
   * @returns The sanitized HTML string
   * @private
   * @see Requirements 4.5
   */
  private sanitizeSubtitleHtml(html: string): string {
    if (!html) return '';
    try {
      const sanitized = this.htmlSanitizer.sanitizeWithConfig(html, {
        ALLOWED_TAGS: [
          'span',
          'strong',
          'em',
          'b',
          'i',
          'u',
          's',
          'code',
          'pre',
          'blockquote',
          'a',
          'ul',
          'ol',
          'li',
          'p',
          'br',
        ],
        ALLOWED_ATTR: ['class', 'data-uid', 'data-mention-type', 'data-hashtag', 'href', 'target', 'rel', 'style'],
      });
      return String(sanitized);
    } catch (error) {
      console.error('[CometChatConversationItem] Sanitization error:', error);
      return '';
    }
  }

  /**
   * Formats mention tags as plain text (no HTML) for messages without SDK mention tags
   * or when mentionedUsers is empty. Replaces `<@uid:X>` with `@DisplayName`
   * and `<@all:L>` with `@L`.
   *
   * @param text - The raw text potentially containing SDK mention tags
   * @param mentionedUsers - Array of CometChat.User objects referenced in the text
   * @returns The processed plain text string with mention tags replaced
   * @private
   */
  private formatPlainMentions(text: string, mentionedUsers: CometChat.User[]): string {
    if (!text) return '';

    const userMap = new Map<string, string>();
    mentionedUsers.forEach(user => {
      userMap.set(user.getUid(), user.getName());
    });

    // Replace user mentions: <@uid:xxx> → @DisplayName
    let result = text.replace(/<@uid:(.*?)>/g, (_match, uid) => {
      const name = userMap.get(uid) || uid;
      return `@${name}`;
    });

    // Replace channel mentions: <@all:xxx> → @xxx
    result = result.replace(/<@all:(.*?)>/g, (_match, label) => {
      return `@${label}`;
    });

    return result;
  }

  /**
   * Gets the sender name prefix for group conversations.
   * Returns "You:" for messages sent by logged-in user, or sender name for others.
   *
   * @returns The sender name prefix or empty string
   */
  get senderNamePrefix(): string {
    if (!this.lastMessage) return '';

    const messageCategory = this.lastMessage.getCategory();

    // Don't show sender for action messages
    if (messageCategory === 'action') return '';

    // Don't show sender for call messages in certain states
    if (messageCategory === 'call') return '';

    // Don't show sender for meeting messages (subtitle already includes sender)
    if (
      messageCategory === 'custom' &&
      this.lastMessage.getType() === CometChatUIKitConstants.calls.meeting
    )
      return '';

    // For group conversations, show sender name
    if (this.isGroupConversation) {
      if (this.isLastMessageByMe) {
        return CometChatLocalize.getLocalizedString('conversation_subtitle_you_message') + ':';
      }
      const sender = this.lastMessage.getSender();
      if (sender) {
        return sender.getName() + ':';
      }
    }

    return '';
  }

  /**
   * Gets the text for action messages (group actions).
   * @private
   */
  private getActionMessageText(): string {
    const action = this.lastMessage as CometChat.Action;
    const actionType = action.getAction?.() || '';
    const actionBy = action.getActionBy?.();
    const actionOn = action.getActionOn?.();

    // Safely get names - actionBy/actionOn can be User, Group, or BaseMessage
    let actionByName = '';
    let actionOnName = '';

    if (actionBy && 'getName' in actionBy && typeof actionBy.getName === 'function') {
      actionByName = actionBy.getName() || '';
    }
    if (actionOn && 'getName' in actionOn && typeof actionOn.getName === 'function') {
      actionOnName = actionOn.getName() || '';
    }

    switch (actionType) {
      case 'added':
        return `${actionByName} ${CometChatLocalize.getLocalizedString('conversation_subtitle_added')} ${actionOnName}`;
      case 'joined':
        return `${actionByName} ${CometChatLocalize.getLocalizedString('conversation_subtitle_joined')}`;
      case 'left':
        return `${actionByName} ${CometChatLocalize.getLocalizedString('conversation_subtitle_left')}`;
      case 'kicked':
        return `${actionByName} ${CometChatLocalize.getLocalizedString('conversation_subtitle_kicked')} ${actionOnName}`;
      case 'banned':
        return `${actionByName} ${CometChatLocalize.getLocalizedString('conversation_subtitle_banned')} ${actionOnName}`;
      case 'unbanned':
        return `${actionByName} ${CometChatLocalize.getLocalizedString('conversation_subtitle_unbanned')} ${actionOnName}`;
      case 'scopeChanged':
        return `${actionByName} ${CometChatLocalize.getLocalizedString('conversation_subtitle_made')} ${actionOnName}`;
      default:
        return actionType;
    }
  }

  /**
   * Gets the text for call messages.
   * @private
   */
  private getCallMessageText(): string {
    const call = this.lastMessage as CometChat.Call;
    const callStatus = call.getStatus?.() || '';
    const callType = call.getType?.() || '';

    // Determine if it's incoming or outgoing
    const isOutgoing = this.isLastMessageByMe;

    switch (callStatus) {
      case 'initiated':
        if (callType === 'audio') {
          return isOutgoing
            ? CometChatLocalize.getLocalizedString('conversation_subtitle_outgoing_call')
            : CometChatLocalize.getLocalizedString('conversation_subtitle_incoming_call');
        }
        return isOutgoing
          ? CometChatLocalize.getLocalizedString('conversation_subtitle_outgoing_call')
          : CometChatLocalize.getLocalizedString('conversation_subtitle_incoming_call');
      case 'ongoing':
        return callType === 'audio'
          ? CometChatLocalize.getLocalizedString('conversation_subtitle_voice_call')
          : CometChatLocalize.getLocalizedString('conversation_subtitle_video_call');
      case 'unanswered':
        return CometChatLocalize.getLocalizedString('conversation_subtitle_unasnwered_call');
      case 'rejected':
        return CometChatLocalize.getLocalizedString('conversation_subtitle_rejected_call');
      case 'busy':
        return CometChatLocalize.getLocalizedString('conversation_subtitle_busy_call');
      case 'cancelled':
        return CometChatLocalize.getLocalizedString('conversation_subtitle_cancelled_call');
      case 'ended':
        return CometChatLocalize.getLocalizedString('conversation_subtitle_ended_call');
      case 'missed':
        return CometChatLocalize.getLocalizedString('conversation_subtitle_missed_call');
      default:
        return callType === 'audio'
          ? CometChatLocalize.getLocalizedString('conversation_subtitle_voice_call')
          : CometChatLocalize.getLocalizedString('conversation_subtitle_video_call');
    }
  }

  /**
   * Gets text for custom messages.
   * @private
   */
  private getCustomMessageText(): string {
    try {
      const customMessage = this.lastMessage as CometChat.CustomMessage;
      const customData = customMessage.getCustomData?.();
      if (customData && typeof customData === 'object' && 'text' in customData) {
        return String(customData.text);
      }
      return '';
    } catch {
      return '';
    }
  }

  /**
   * Gets text for group meeting (direct call) messages.
   * Determines audio/video from customData.callType and whether the
   * logged-in user initiated the call.
   * @private
   */
  private getMeetingMessageText(): string {
    try {
      const customMessage = this.lastMessage as CometChat.CustomMessage;
      const customData = customMessage.getCustomData?.() as Record<string, any> | undefined;
      const callType = customData?.['callType'] || '';
      const sender = customMessage.getSender?.();
      const isSelf = !sender || sender.getUid() === this.loggedInUser?.getUid();

      if (isSelf) {
        if (callType === CometChatUIKitConstants.MessageTypes.audio) {
          return CometChatLocalize.getLocalizedString(
            'conversation_subtitle_group_voice_call_initated_self'
          );
        }
        return CometChatLocalize.getLocalizedString(
          'conversation_subtitle_group_video_call_initated_self'
        );
      } else {
        const senderName = sender?.getName() || '';
        if (callType === CometChatUIKitConstants.MessageTypes.audio) {
          return `${senderName} ${CometChatLocalize.getLocalizedString('conversation_subtitle_group_voice_call_initated')}`;
        }
        return `${senderName} ${CometChatLocalize.getLocalizedString('conversation_subtitle_group_video_call_initated')}`;
      }
    } catch {
      return CometChatLocalize.getLocalizedString('conversation_subtitle_voice_call');
    }
  }

  /**
   * Creates the context object passed to slot templates.
   * This provides all necessary data for custom slot rendering.
   *
   * @returns The ConversationSlotContext object for template binding
   * @see Requirements 5.4
   */
  get slotContext(): ConversationSlotContext {
    return {
      $implicit: this.conversation,
      conversation: this.conversation,
      isActive: this.isActive,
      isSelected: this.isSelected,
      unreadCount: this.unreadCount,
      isTyping: this.isTyping,
    };
  }

  // ============================================
  // Accessibility Properties
  // @see Requirements 4.1-4.8
  // ============================================

  /**
   * Computes the accessible label for the conversation item.
   * Combines conversation name, unread count, last message preview, and typing status.
   * This provides screen readers with comprehensive context about the conversation.
   *
   * @returns The computed accessible label string
   * @see Requirements 4.7, 4.8
   */
  get accessibleLabel(): string {
    const parts: string[] = [];

    // Conversation name (always included)
    parts.push(this.avatarName);

    // Unread count (if any)
    if (this.unreadCount > 0) {
      const unreadText = CometChatLocalize.getLocalizedString(
        'accessibility_unread_messages'
      ).replace('{count}', this.unreadCount.toString());
      parts.push(unreadText);
    }

    // Typing indicator status
    if (this.isTyping) {
      parts.push(CometChatLocalize.getLocalizedString('accessibility_typing'));
    } else if (this.hasLastMessage) {
      // Last message preview (only if not typing)
      const preview = this.getPlainSubtitleText();
      if (preview) {
        const lastMessageLabel = CometChatLocalize.getLocalizedString('accessibility_last_message');
        parts.push(`${lastMessageLabel}: ${preview}`);
      }
    }

    return parts.join(', ');
  }

  /**
   * Gets plain text version of subtitle for accessibility label.
   * Strips any HTML formatting that might be present in mentions.
   *
   * @returns Plain text subtitle without HTML
   * @private
   */
  private getPlainSubtitleText(): string {
    const text = this.subtitleText;
    if (!text) return '';

    // Strip HTML tags if present (from mention formatting)
    return text.replace(/<[^>]*>/g, '').trim();
  }

  // ============================================
  // Event Handlers
  // @see Requirements 7.1, 7.2, 7.3, 7.4, 7.5
  // ============================================

  /**
   * Handles the main item click event.
   * This is the primary click handler for the entire conversation item.
   * Does NOT use stopPropagation as this is the main click handler.
   *
   * @emits itemClick with the conversation object
   */
  handleClick(): void {
    this.itemClick.emit(this.conversation);
  }

  /**
   * Handles mousedown event to prevent focus outline on mouse click.
   * This ensures that focus ring only appears for keyboard navigation,
   * not for mouse clicks. The active state styling will still be applied
   * via the isActive input.
   *
   * @param event - The DOM mousedown event
   */
  handleMouseDown(event: MouseEvent): void {
    // Prevent the element from receiving focus on mouse click
    // This ensures focus ring only appears for keyboard navigation
    // The click event will still fire and handle the selection
    event.preventDefault();
  }

  /**
   * Handles click on the avatar element.
   * Emits avatarClick event and allows event to bubble to trigger main itemClick.
   *
   * @param event - The DOM click event
   * @emits avatarClick with the conversation object
   * @see Requirements 7.1
   */
  handleAvatarClick(event: Event): void {
    // Emit the specific avatar click event
    this.avatarClick.emit(this.conversation);
    // Don't stop propagation - let it bubble to trigger handleClick()
  }

  /**
   * Handles click on the title element.
   * Emits titleClick event and allows event to bubble to trigger main itemClick.
   *
   * @param event - The DOM click event
   * @emits titleClick with the conversation object
   * @see Requirements 7.2
   */
  handleTitleClick(event: Event): void {
    // Emit the specific title click event
    this.titleClick.emit(this.conversation);
    // Don't stop propagation - let it bubble to trigger handleClick()
  }

  /**
   * Handles click on the subtitle element.
   * Emits subtitleClick event and allows event to bubble to trigger main itemClick.
   *
   * @param event - The DOM click event
   * @emits subtitleClick with the conversation object
   * @see Requirements 7.3
   */
  handleSubtitleClick(event: Event): void {
    // Emit the specific subtitle click event
    this.subtitleClick.emit(this.conversation);
    // Don't stop propagation - let it bubble to trigger handleClick()
  }

  /**
   * Handles click on the timestamp element.
   * Emits timestampClick event and allows event to bubble to trigger main itemClick.
   *
   * @param event - The DOM click event
   * @emits timestampClick with the conversation object
   * @see Requirements 7.4
   */
  handleTimestampClick(event: Event): void {
    // Emit the specific timestamp click event
    this.timestampClick.emit(this.conversation);
    // Don't stop propagation - let it bubble to trigger handleClick()
  }

  /**
   * Handles click on the unread badge element.
   * Emits badgeClick event and allows event to bubble to trigger main itemClick.
   *
   * @param event - The DOM click event
   * @emits badgeClick with the conversation object
   * @see Requirements 7.5
   */
  handleBadgeClick(event: Event): void {
    // Emit the specific badge click event
    this.badgeClick.emit(this.conversation);
    // Don't stop propagation - let it bubble to trigger handleClick()
  }

  /**
   * Handles the context menu open event.
   * Called when the context menu is triggered (hover or right-click).
   *
   * @emits contextMenuOpen with the conversation object
   */
  handleContextMenuOpen(): void {
    this.contextMenuOpen.emit(this.conversation);
  }

  /**
   * Handles the browser's native context menu event (right-click / long-press).
   * Prevents the default browser context menu when disableDefaultContextMenu is true.
   * This allows the custom context menu to be shown instead on hover/focus.
   *
   * @param event - The DOM contextmenu event
   */
  handleContextMenu(event: MouseEvent): void {
    if (this.effectiveDisableDefaultContextMenu()) {
      event.preventDefault();
    }
  }

  /**
   * Handles click on a context menu option.
   * Called when the user selects an option from the context menu.
   *
   * @param option - The selected CometChatOption
   * @emits contextMenuOptionClick with the option and conversation
   */
  handleContextMenuOptionClick(option: CometChatOption): void {
    this.contextMenuOptionClick.emit({ option, conversation: this.conversation });
  }

  // ============================================
  // Keyboard Event Handlers
  // @see Requirements 4.2, 4.3
  // ============================================

  /**
   * Handles keyboard events on the conversation item.
   * Implements accessibility requirements for keyboard navigation:
   * - Enter/Space: Activate item (emit itemClick)
   * - Shift+F10 or ContextMenu key: Open context menu
   *
   * @param event - The DOM keyboard event
   * @see Requirements 4.2, 4.3
   */
  onKeyDown(event: KeyboardEvent): void {
    // Enter or Space: Activate item
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.handleClick();
      return;
    }

    // Shift+F10 or ContextMenu key: Open context menu
    if ((event.key === 'F10' && event.shiftKey) || event.key === 'ContextMenu') {
      event.preventDefault();
      this.openContextMenuViaKeyboard();
      return;
    }
  }

  /**
   * Opens the context menu via keyboard shortcut.
   * Emits contextMenuKeyboardOpen event for parent component to handle.
   *
   * @private
   */
  private openContextMenuViaKeyboard(): void {
    // Set hover state to show context menu
    this.isHovered = true;
    // Emit event for context menu opening
    this.contextMenuOpen.emit(this.conversation);
    this.contextMenuKeyboardOpen.emit(this.conversation);
  }
}
