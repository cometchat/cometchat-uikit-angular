/**
 * CometChatMessageComposer Component
 *
 * A comprehensive Angular component for composing and sending messages in chat applications.
 * Supports text input, attachments, emoji picker, voice recording, mentions, and rich text editing.
 *
 * The component follows a service-based architecture where MessageComposerService handles
 * all SDK interactions, while the component manages UI state and user interactions.
 *
 * @module components/cometchat-message-composer
 * @see Requirements 1.1, 1.2, 1.5, 1.6, 1.7, 33.1, 33.4
 */
import {
  Component,
  Input,
  Output,
  EventEmitter,
  TemplateRef,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  signal,
  computed,
  inject,
  ViewChild,
  ElementRef,
  AfterViewInit,
  effect,
  HostListener,
  ViewChildren,
  QueryList,
  booleanAttribute,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { CometChat } from '@cometchat/chat-sdk-javascript';

// Event imports
import { CometChatUIEvents, IModal, IMentionsCountWarning } from '../../events/CometChatUIEvents';
import { CometChatMessageEvents } from '../../events/CometChatMessageEvents';

// Component imports
import { CometChatActionSheetComponent } from '../base-elements/cometchat-action-sheet/cometchat-action-sheet.component';
import { CometChatEmojiKeyboardComponent } from '../base-elements/cometchat-emoji-keyboard/cometchat-emoji-keyboard.component';
import { CometChatMediaRecorderComponent } from '../base-elements/cometchat-media-recorder/cometchat-media-recorder.component';
import { CometChatAvatarComponent } from '../base-elements/cometchat-avatar/cometchat-avatar.component';
import {
  CometChatStickersKeyboardComponent,
  StickerClickEvent,
} from '../cometchat-stickers-keyboard/cometchat-stickers-keyboard.component';
import { CometChatFullScreenViewerComponent } from '../base-elements/cometchat-fullscreen-viewer/cometchat-fullscreen-viewer.component';
import { CometChatPopoverComponent } from '../base-elements/cometchat-popover/cometchat-popover.component';
import { CometChatMessagePreviewComponent } from '../base-elements/cometchat-message-preview/cometchat-message-preview.component';
import { CometChatCreatePollComponent } from '../cometchat-create-poll/cometchat-create-poll.component';
import { CometChatButtonComponent } from '../base-elements/cometchat-button/cometchat-button.component';
import {
  CometChatLinkDialogComponent,
  type LinkData,
} from '../base-elements/cometchat-link-dialog/cometchat-link-dialog.component';
import { CometChatLinkPopoverComponent } from '../base-elements/cometchat-link-popover/cometchat-link-popover.component';

// Service imports
import { MessageComposerService, MentionSuggestion } from '../../services/message-composer.service';
import {
  RichTextFormatState,
  RichTextMetadata,
  SelectionState,
} from '../../services/rich-text-editor.interfaces';
import { RichTextEditorService } from '../../services/rich-text-editor.service';
import { RichTextEditor } from '../../services/rich-text-editor.class';
import { ChatStateService } from '../../services/chat-state.service';
import { FormatterConfigService } from '../../services/formatter-config.service';
import { HtmlSanitizerService } from '../../services/html-sanitizer.service';
import { LiveAnnouncerService } from '../../services/live-announcer.service';

// Global config imports
import { COMETCHAT_GLOBAL_CONFIG, GlobalConfig } from '../../services/global-config.service';

// Resource imports
import { TranslatePipe } from '../../resources/CometChatLocalize/translate.pipe';
import { CometChatSoundManager } from '../../resources/CometChatSoundManager/CometChatSoundManager';
import { CometChatLocalize } from '../../resources/CometChatLocalize/cometchat-localize';
import { CometChatLogger } from '../../utils/CometChatLogger';
import { isMobileDevice } from '../../utils/util';

// Enum imports
import { EnterKeyBehavior, MessageStatus, Placement } from '../../Enums/Enums';

// Formatter imports
import { CometChatMentionsFormatter } from '../../formatters/cometchat-mentions-formatter';
import { CometChatTextFormatter } from '../../formatters/cometchat-text-formatter';

// Modal imports
import { CometChatMessageComposerAction, CometChatActionsView } from '../../modals';
import { CometChatUIKitUtility } from '../../CometChatUIKitUtility';
import { CometChatUIKit } from '../../cometchat-uikit';

/**
 * Maximum number of unique mentions allowed in a single message.
 * When this limit is reached, additional mention insertions are blocked
 * and a warning banner is displayed above the input area.
 * @see Requirements 6.1, 6.4
 */
export const MENTIONS_LIMIT = 10;

/**
 * Interface for attachment file tracking
 */
export interface AttachmentFile {
  /** Unique identifier for the file */
  id: string;
  /** The actual File object */
  file: File;
  /** Type of attachment */
  type: 'image' | 'video' | 'audio' | 'file';
  /** File name */
  name: string;
  /** File size in bytes */
  size: number;
  /** Thumbnail URL for preview (images/videos) */
  thumbnailUrl?: string;
  /** Upload progress percentage (0-100) */
  uploadProgress: number;
  /** Current upload status */
  status: 'pending' | 'uploading' | 'uploaded' | 'error';
  /** Error message if status is 'error' */
  errorMessage?: string;
}

/**
 * Interface for file size validation errors
 * Used to display error messages when files exceed the size limit
 * @see Requirements 12.1, 12.3, 12.4
 */
export interface FileSizeError {
  /** Number of files that exceeded the limit */
  count: number;
  /** Type of files (photo, video, file) */
  fileType: string;
  /** Size limit in MB */
  limitMB: number;
  /** Timestamp when error occurred */
  timestamp: number;
}

/**
 * CometChatMessageComposer displays a message input area with rich features.
 * It supports text input, attachments, emoji picker, voice recording, mentions,
 * and optional rich text editing capabilities.
 *
 * The component offers two layout modes:
 * - **Single-line layout** (default): Horizontal arrangement with attachment button on the left,
 *   input area in the center, and auxiliary buttons (emoji, stickers, voice, send) on the right.
 * - **Multiline layout**: Vertical arrangement with input area spanning full width at the top,
 *   and all action buttons arranged in a horizontal row below.
 *
 * @example
 * ```html
 * <!-- Basic usage with user (single-line layout) -->
 * <cometchat-message-composer
 *   [user]="selectedUser"
 *   (sendButtonClick)="onMessageSent($event)">
 * </cometchat-message-composer>
 *
 * <!-- Usage with group and multiline layout -->
 * <cometchat-message-composer
 *   [group]="selectedGroup"
 *   [layout]="'multiline'"
 *   [enableRichText]="true"
 *   (sendButtonClick)="onMessageSent($event)">
 * </cometchat-message-composer>
 *
 * <!-- Advanced usage with custom templates -->
 * <cometchat-message-composer
 *   [user]="selectedUser"
 *   [layout]="'single-line'"
 *   [parentMessageId]="replyToMessageId"
 *   [sendButtonView]="customSendButton"
 *   (textChange)="onTextChange($event)"
 *   (closePreview)="onClosePreview()">
 * </cometchat-message-composer>
 * ```
 */
@Component({
  selector: 'cometchat-message-composer',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CometChatActionSheetComponent,
    CometChatEmojiKeyboardComponent,
    CometChatMediaRecorderComponent,
    CometChatAvatarComponent,
    CometChatStickersKeyboardComponent,
    CometChatFullScreenViewerComponent,
    CometChatPopoverComponent,
    CometChatMessagePreviewComponent,
    CometChatCreatePollComponent,
    CometChatButtonComponent,
    CometChatLinkDialogComponent,
    CometChatLinkPopoverComponent,
    TranslatePipe,
  ],
  templateUrl: './cometchat-message-composer.component.html',
  styleUrls: ['./cometchat-message-composer.component.css', '../../services/rich-text-editor.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CometChatMessageComposerComponent
  implements OnInit, OnDestroy, OnChanges, AfterViewInit
{
  // ==================== Service Injection ====================
  private messageComposerService = inject(MessageComposerService);
  private richTextEditorService = inject(RichTextEditorService);
  private chatStateService = inject(ChatStateService);
  private formatterConfigService = inject(FormatterConfigService);
  private htmlSanitizerService = inject(HtmlSanitizerService);
  private liveAnnouncerService = inject(LiveAnnouncerService);
  private cdr = inject(ChangeDetectorRef);
  private hostElementRef = inject(ElementRef);

  // Global config injected via token (static configuration)
  private globalConfig: Partial<GlobalConfig> | null = inject(COMETCHAT_GLOBAL_CONFIG, {
    optional: true,
  });

  // ==================== ExplicitlySet Flags & Backing Fields (GlobalConfig Priority System) ====================
  // Track if @Input was explicitly set (for global config priority system)
  private textFormattersExplicitlySet = signal(false);
  private disableSoundForMessageExplicitlySet = signal(false);
  private customSoundForMessageExplicitlySet = signal(false);

  // Private backing fields for tracked @Input properties
  private _textFormatters = signal<CometChatTextFormatter[]>([]);
  private _disableSoundForMessage = signal(false);
  private _customSoundForMessage = signal('');

  // ==================== Effective Value Computed Signals (Priority System) ====================
  /**
   * Computed effective values implementing the priority system:
   * 1. If @Input was explicitly set → use @Input value
   * 2. Else if global config is set (not undefined) → use global config value
   * 3. Else → use internal default value
   *
   * Note: Composer uses singular names (disableSoundForMessage, customSoundForMessage)
   * while GlobalConfig uses plural names (disableSoundForMessages, customSoundForMessages)
   */
  effectiveTextFormatters = computed(() => {
    if (this.textFormattersExplicitlySet()) return this._textFormatters();
    if (this.globalConfig?.textFormatters !== undefined) return this.globalConfig.textFormatters;
    return [];
  });

  effectiveDisableSoundForMessage = computed(() => {
    if (this.disableSoundForMessageExplicitlySet()) return this._disableSoundForMessage();
    if (this.globalConfig?.disableSoundForMessages !== undefined)
      return this.globalConfig.disableSoundForMessages;
    return false;
  });

  effectiveCustomSoundForMessage = computed(() => {
    if (this.customSoundForMessageExplicitlySet()) return this._customSoundForMessage();
    if (this.globalConfig?.customSoundForMessages !== undefined)
      return this.globalConfig.customSoundForMessages;
    return '';
  });

  // ==================== Rich Text Editor ====================

  /**
   * Custom RichTextEditor instance for rich text editing
   * Only initialized when enableRichText is true
   * @see Requirements 15.1, 15.2
   */
  customRichTextEditor: RichTextEditor | null = null;

  /**
   * Reference to the rich text editor container element
   */
  @ViewChild('richTextEditorContainer') richTextEditorContainerRef?: ElementRef<HTMLDivElement>;

  /**
   * Signal tracking the current rich text format state
   * @see Requirements 19.13
   */
  richTextFormatState = signal<RichTextFormatState>({
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
    code: false,
    blockquote: false,
    codeBlock: false,
    orderedList: false,
    bulletList: false,
    link: false,
  });

  /**
   * Computed property that returns whether inline formatters should be disabled.
   * Inline formatters (bold, italic, underline, strikethrough) are disabled when
   * code block is active, since code blocks should not contain inline formatting.
   * @see Requirement 2.15 (Bug 5 fix)
   */
  isInlineFormattingDisabled = computed(() => this.richTextFormatState().codeBlock);

  // ==================== Entity Configuration Inputs ====================

  /**
   * The user to send messages to (for 1-on-1 conversations)
   * Mutually exclusive with group input
   * @see Requirements 2.1, 2.3
   */
  @Input() user?: CometChat.User;

  /**
   * The group to send messages to (for group conversations)
   * Mutually exclusive with user input
   * @see Requirements 2.2, 2.4
   */
  @Input() group?: CometChat.Group;

  /**
   * Parent message ID for threaded replies
   * When set, messages will be sent as replies to this message
   * @see Requirements 2.5, 2.6, 14.1
   */
  @Input() parentMessageId?: number;

  // ==================== Text Input Configuration Inputs ====================

  /**
   * Placeholder text for the input area
   * @default 'message_composer_placeholder'
   * @see Requirements 3.3
   */
  @Input() placeholderText = 'message_composer_placeholder';

  /**
   * Initial text to pre-fill in the composer
   * @see Requirements 3.4
   */
  @Input() initialComposerText = '';

  /**
   * Controlled text value for the composer
   * @see Requirements 3.5
   */
  @Input() text = '';

  /**
   * Maximum height for the text input area in pixels
   * @default 200
   * @see Requirements 3.8
   */
  @Input() maxHeight = 200;

  /**
   * Behavior when Enter key is pressed
   * @default EnterKeyBehavior.SendMessage
   * @see Requirements 4.3, 4.4, 4.6
   */
  @Input() enterKeyBehavior: EnterKeyBehavior = EnterKeyBehavior.SendMessage;

  // ==================== Attachment Configuration Inputs ====================

  /**
   * Custom attachment options to display in the attachment menu
   * @see Requirements 5.8
   */
  @Input() attachmentOptions?: CometChatMessageComposerAction[];

  /**
   * Maximum number of attachments allowed
   * @default 10
   * @see Requirements 6.2
   */
  @Input() maxAttachments = 10;

  /**
   * Allowed file MIME types for attachments
   * @see Requirements 9.1, 9.2
   */
  @Input() allowedFileTypes?: string[];

  /**
   * Maximum file size in bytes
   * @see Requirements 9.3, 9.4
   */
  @Input() maxFileSize?: number;

  /**
   * Whether to show attachment preview thumbnails
   * @default true
   * @see Requirements 7.1, 7.2
   */
  @Input() showAttachmentPreview = true;

  /**
   * Whether to enable drag and drop file uploads
   * @default true
   * @see Requirements 8.1, 8.2
   */
  @Input() enableDragDrop = true;

  // ==================== Hide Option Inputs ====================

  /**
   * Whether to hide the attachment button
   * @default false
   * @see Requirements 5.9
   */
  @Input() hideAttachmentButton = false;

  /**
   * Whether to hide the image attachment option
   * @default false
   * @see Requirements 5.10
   */
  @Input() hideImageAttachmentOption = false;

  /**
   * Whether to hide the video attachment option
   * @default false
   * @see Requirements 5.11
   */
  @Input() hideVideoAttachmentOption = false;

  /**
   * Whether to hide the audio attachment option
   * @default false
   * @see Requirements 5.12
   */
  @Input() hideAudioAttachmentOption = false;

  /**
   * Whether to hide the file attachment option
   * @default false
   * @see Requirements 5.13
   */
  @Input() hideFileAttachmentOption = false;

  /**
   * Whether to hide the polls option
   * @default false
   * @see Requirements 5.14
   */
  @Input() hidePollsOption = false;

  /**
   * Whether to hide the collaborative document option
   * @default false
   * @see Requirements 5.15
   */
  @Input() hideCollaborativeDocumentOption = false;

  /**
   * Whether to hide the collaborative whiteboard option
   * @default false
   * @see Requirements 5.16
   */
  @Input() hideCollaborativeWhiteboardOption = false;

  /**
   * Whether to hide the emoji keyboard button
   * @default false
   * @see Requirements 10.4
   */
  @Input() hideEmojiKeyboardButton = false;

  /**
   * Whether to hide the voice recording button
   * @default false
   * @see Requirements 11.4
   */
  @Input() hideVoiceRecordingButton = false;

  /**
   * Whether to hide the stickers button
   * @default false
   * @see Requirements 12.4
   */
  @Input() hideStickersButton = false;

  /**
   * Whether to hide the live reaction button
   * @default false
   * @see Requirements 13.3
   */
  @Input() hideLiveReaction = false;

  /**
   * Whether to hide the send button
   * @default false
   * @see Requirements 4.10
   */
  @Input() hideSendButton = false;

  // ==================== Mentions Configuration Inputs ====================

  /**
   * Whether to disable @mentions functionality
   * @default false
   * @see Requirements 16.1
   */
  @Input() disableMentions = false;

  /**
   * Whether to disable @all mention option in groups
   * @default false
   * @see Requirements 16.10
   */
  @Input() disableMentionAll = false;

  /**
   * Label for the @all mention option
   * @default 'all'
   * @see Requirements 16.12
   */
  @Input() mentionAllLabel = '';

  /**
   * Custom request builder for fetching users for mentions
   * @see Requirements 16.8
   */
  @Input() mentionsUsersRequestBuilder?: CometChat.UsersRequestBuilder;

  /**
   * Custom request builder for fetching group members for mentions
   * @see Requirements 16.9
   */
  @Input() mentionsGroupMembersRequestBuilder?: CometChat.GroupMembersRequestBuilder;

  // ==================== Rich Text Configuration Inputs ====================

  /**
   * Whether to enable rich text editing.
   * When disabled: toolbar toggle button is hidden, pasting or adding content
   * in the composer will not apply rich text formatting.
   * Mentions and other text formatters still work independently.
   * @default false
   * @see Requirements 18.1
   */
  @Input() enableRichText = true;

  /**
   * Whether to hide the rich text toolbar.
   * When true: toolbar is always hidden.
   * When false: toolbar is always shown, UNLESS showToolbarToggle is enabled,
   * in which case toolbar visibility is controlled by the toggle button click.
   * @default true
   * @see Requirements 19.1
   */
  @Input() hideRichTextToolbar = true;

  /**
   * Whether to show the bubble menu on text selection (Web/Desktop only)
   * When enabled, a floating toolbar appears near selected text with formatting options.
   * This feature is only available on Web/Desktop platforms and is automatically disabled on mobile.
   * @default false
   * @see Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 1.10
   */
  @Input() showBubbleMenuOnSelection = false;



  /**
   * Layout mode for the message composer.
   *
   * Controls the arrangement of the input area and action buttons:
   * - **'single-line'** (default): Horizontal layout with attachment button on the left,
   *   input area in the center (with flex-grow), and auxiliary buttons (emoji, stickers,
   *   voice, send) on the right. All elements are vertically centered in a single row.
   * - **'multiline'**: Vertical layout with input area spanning full width at the top,
   *   and all action buttons (attachment, emoji, stickers, voice, send) arranged in a
   *   horizontal row below. The send button is positioned on the far right of the button row.
   *
   * Both layouts support all composer features including:
   * - Text input and rich text editing
   * - File attachments with preview
   * - Emoji and stickers
   * - Voice recording
   * - @mentions functionality
   * - Reply and edit modes
   * - Keyboard shortcuts and accessibility
   *
   * The layout can be changed at runtime and the component will update immediately.
   * All functionality remains identical across both layouts.
   *
   * @default 'single-line'
   *
   * @example
   * ```html
   * <!-- Default single-line layout -->
   * <cometchat-message-composer
   *   [user]="selectedUser">
   * </cometchat-message-composer>
   *
   * <!-- Explicit single-line layout -->
   * <cometchat-message-composer
   *   [user]="selectedUser"
   *   [layout]="'single-line'">
   * </cometchat-message-composer>
   *
   * <!-- Multiline layout for more input space -->
   * <cometchat-message-composer
   *   [group]="selectedGroup"
   *   [layout]="'multiline'"
   *   [enableRichText]="true">
   * </cometchat-message-composer>
   *
   * <!-- Dynamic layout switching -->
   * <cometchat-message-composer
   *   [user]="selectedUser"
   *   [layout]="isCompactView ? 'multiline' : 'single-line'">
   * </cometchat-message-composer>
   * ```
   *
   * @see Requirements 1.1, 1.2, 1.3, 1.4, 1.5
   */
  @Input() layout: 'single-line' | 'multiline' = 'single-line';

  // ==================== Other Configuration Inputs ====================

  /**
   * Whether to disable auto-focus on mobile devices.
   * When true (default), the composer input will not auto-focus on mobile devices,
   * preventing the keyboard from automatically opening on load.
   * When false, auto-focus behaves the same on mobile as on desktop.
   * @default true
   */
  @Input() disableAutoFocusOnMobile = true;

  /**
   * Whether to disable typing indicator events
   * @default false
   * @see Requirements 17.3
   */
  @Input() disableTypingEvents = false;

  /**
   * Whether to disable sound when sending messages
   * @default false
   * @see Requirements 24.1
   */
  @Input()
  set disableSoundForMessage(value: boolean) {
    this._disableSoundForMessage.set(value);
    this.disableSoundForMessageExplicitlySet.set(true);
  }
  get disableSoundForMessage(): boolean {
    return this._disableSoundForMessage();
  }

  /**
   * Custom sound URL for message sent notification
   * @see Requirements 24.3
   */
  @Input()
  set customSoundForMessage(value: string) {
    this._customSoundForMessage.set(value);
    this.customSoundForMessageExplicitlySet.set(true);
  }
  get customSoundForMessage(): string {
    return this._customSoundForMessage();
  }

  /**
   * Custom icon for live reaction button
   * @see Requirements 13.4
   */
  @Input() liveReactionIcon?: string;

  /**
   * Message to edit (enables edit mode)
   * @see Requirements 15.1
   */
  @Input() messageToEdit?: CometChat.BaseMessage;

  /**
   * Message to reply to (enables quoted reply mode)
   * When set, the composer displays a reply preview and sends messages with quoted message metadata
   * @see Requirements 2.1
   */
  @Input() messageToReply?: CometChat.BaseMessage;

  /**
   * Array of text formatters to apply to messages
   * Text formatters are used to detect and transform patterns in text content,
   * such as @mentions, URLs, or custom patterns
   * @see Requirements 5.1
   */
  @Input()
  set textFormatters(value: CometChatTextFormatter[]) {
    this._textFormatters.set(value);
    this.textFormattersExplicitlySet.set(true);
  }
  get textFormatters(): CometChatTextFormatter[] {
    return this._textFormatters();
  }

  // ==================== Template Inputs ====================

  /**
   * Custom template for the header section above the input
   * @see Requirements 25.3
   */
  @Input() headerView?: TemplateRef<unknown>;

  /**
   * Custom template for the footer section below the input
   * @see Requirements 25.4
   */
  @Input() footerView?: TemplateRef<unknown>;

  /**
   * Custom template for the send button
   * @see Requirements 25.1
   */
  @Input() sendButtonView?: TemplateRef<unknown>;

  /**
   * Custom template for auxiliary action buttons
   * @see Requirements 25.2
   */
  @Input() auxiliaryButtonView?: TemplateRef<unknown>;

  /**
   * Custom template for secondary action buttons
   * @see Requirements 25.5
   */
  @Input() secondaryButtonView?: TemplateRef<unknown>;

  /**
   * Custom template for the attachment icon
   * @see Requirements 25.6
   */
  @Input() attachmentIconView?: TemplateRef<unknown>;

  /**
   * Custom template for the voice recording icon
   * @see Requirements 25.7
   */
  @Input() voiceRecordingIconView?: TemplateRef<unknown>;

  /**
   * Custom template for the emoji icon
   * @see Requirements 25.8
   */
  @Input() emojiIconView?: TemplateRef<unknown>;

  /**
   * Custom template for error state UI
   * When provided, renders this template instead of the default error fallback
   * @see Requirements 3.4, 3.5
   */
  @Input() errorView?: TemplateRef<any>;

  // ==================== Standardised Template Slot Inputs (Property 6 / Req 3.2) ====================
  /** Custom template for each list item. */
  @Input() listItemTemplate: TemplateRef<any> | null = null;
  /** Custom template for the empty state. */
  @Input() emptyStateTemplate: TemplateRef<any> | null = null;
  /** Custom template for the error state. Alias for `errorView`. */
  @Input() errorStateTemplate: TemplateRef<any> | null = null;
  /** Custom template for the loading state. */
  @Input() loadingStateTemplate: TemplateRef<any> | null = null;

  /**
   * Whether to hide the error state UI entirely
   * When true, no error UI is shown even when composerError is set
   * @default false
   * @see Requirements 3.5
   */
  @Input({ transform: booleanAttribute }) hideError = false;

  // ==================== Output Events ====================

  /**
   * Emitted when the text content changes
   * @see Requirements 26.1
   */
  @Output() textChange = new EventEmitter<string>();

  /**
   * Emitted when a message is sent
   * @see Requirements 26.2
   */
  @Output() sendButtonClick = new EventEmitter<CometChat.BaseMessage>();

  /**
   * Emitted when an error occurs
   * @see Requirements 26.3
   */
  @Output() error = new EventEmitter<CometChat.CometChatException>();

  /**
   * Emitted when the reply/edit preview is closed
   * @see Requirements 26.4
   */
  @Output() closePreview = new EventEmitter<void>();

  /**
   * Emitted when an attachment is added
   * @see Requirements 26.5
   */
  @Output() attachmentAdded = new EventEmitter<File>();

  /**
   * Emitted when an attachment is removed
   * @see Requirements 26.6
   */
  @Output() attachmentRemoved = new EventEmitter<File>();

  /**
   * Emitted when a mention is selected
   * @see Requirements 26.7
   */
  @Output() mentionSelected = new EventEmitter<CometChat.User | CometChat.GroupMember>();


  // ==================== View Children ====================

  /**
   * Reference to the text input element
   */
  @ViewChild('textInput') textInputRef?: ElementRef<HTMLTextAreaElement>;

  /**
   * Reference to the hidden file input element
   */
  @ViewChild('fileInput') fileInputRef?: ElementRef<HTMLInputElement>;

  /**
   * Reference to the attachment button element for focus management
   * Used to return focus when attachment popover closes
   * @see Requirements 1.10, 15.8
   */
  @ViewChild('attachmentButton', { read: ElementRef }) attachmentButtonRef?: ElementRef;

  /**
   * Reference to the emoji button element for focus management
   * Used to return focus when emoji popover closes
   * @see Requirements 1.10, 15.8
   */
  @ViewChild('emojiButton', { read: ElementRef }) emojiButtonRef?: ElementRef;

  /**
   * Reference to the stickers button element for focus management
   * Used to return focus when stickers popover closes
   * @see Requirements 1.10, 15.8
   */
  @ViewChild('stickersButton', { read: ElementRef }) stickersButtonRef?: ElementRef;

  /**
   * Reference to the voice recording button element for focus management
   * Used to return focus when voice recorder popover closes
   * @see Requirements 1.10, 15.8
   */
  @ViewChild('voiceButton', { read: ElementRef }) voiceButtonRef?: ElementRef;

  /**
   * Reference to the send button element for focus management
   * @see Requirements 15.8
   */
  @ViewChild('sendButton', { read: ElementRef }) sendButtonRef?: ElementRef;

  /**
   * Reference to the inline media recorder component
   */
  @ViewChild(CometChatMediaRecorderComponent) mediaRecorderRef?: CometChatMediaRecorderComponent;

  /**
   * Reference to the bubble menu element for width calculation
   * Used to get actual rendered width for accurate positioning
   */
  @ViewChild('bubbleMenuElement', { read: ElementRef }) bubbleMenuElementRef?: ElementRef;

  /**
   * References to all CometChatPopoverComponent instances in the template.
   * Used to programmatically close other popovers when one opens (mutual exclusivity).
   */
  @ViewChildren(CometChatPopoverComponent) popoverInstances!: QueryList<CometChatPopoverComponent>;

  // ==================== Icon URLs for cometchat-button ====================

  /** Icon URL for attachment button (default state) */
  readonly attachmentIconUrl = 'assets/add_circle.svg';
  /** Icon URL for attachment button (active/fill state) */
  readonly attachmentIconUrlActive = 'assets/add_circle_fill.svg';
  /** Icon URL for emoji button (default state) */
  readonly emojiIconUrl = 'assets/mood.svg';
  /** Icon URL for emoji button (active/fill state) */
  readonly emojiIconUrlActive = 'assets/mood_fill.svg';
  /** Icon URL for sticker button (default state) */
  readonly stickerIconUrl = 'assets/sticker.svg';
  /** Icon URL for sticker button (active/fill state) */
  readonly stickerIconUrlActive = 'assets/sticker_fill.svg';
  /** Icon URL for voice recording button */
  readonly voiceIconUrl = 'assets/mic.svg';
  /** Icon URL for send button */
  readonly sendIconUrl = 'assets/send_fill.svg';
  /** Icon URL for toolbar toggle button (show fixed toolbar) */
  readonly toolbarToggleIconUrl = 'assets/toolbar-toggle.svg';

  // ==================== Internal State (Signals) ====================

  /**
   * Internal signal for current user (from props or service)
   * This signal is used internally to track the effective user
   * @see Requirements 2.1, 2.3
   */
  protected currentUser = signal<CometChat.User | null>(null);

  /**
   * Internal signal for current group (from props or service)
   * This signal is used internally to track the effective group
   * @see Requirements 2.2, 2.4
   */
  protected currentGroup = signal<CometChat.Group | null>(null);

  /**
   * Error state signal for the composer
   * Set when a lifecycle hook error occurs, cleared on retry/reset
   * @see Requirements 3.4, 3.5
   */
  composerError = signal<Error | null>(null);

  /**
   * Signal tracking whether props were provided (for hybrid approach)
   * Set to true in ngOnInit if user or group props are provided
   * Used by effect to determine whether to use service state
   */
  private propsProvided = signal<boolean>(false);

  /**
   * Placement enum reference for template access
   * Used for popover positioning
   * @see Requirements 1.1, 1.5
   */
  Placement = Placement;

  /**
   * Content display state for floating UI elements (matches React's ContentToDisplay type)
   * Tracks which popover/floating UI is currently displayed
   * Only one can be open at a time for mutual exclusivity
   * @see Requirements 1.8, 1.9
   */
  contentToDisplay = signal<
    'attachments' | 'emojiKeyboard' | 'voiceRecording' | 'stickers' | 'ai' | 'none'
  >('none');

  /**
   * Current text content of the composer
   * @see Requirements 1.6
   */
  composerText = signal<string>('');

  /**
   * Array of attached files
   * @see Requirements 1.6
   */
  attachments = signal<AttachmentFile[]>([]);

  /**
   * Whether the emoji keyboard is open
   */
  isEmojiKeyboardOpen = signal<boolean>(false);

  /**
   * Whether the stickers keyboard is open
   * @see Requirements 8.1, 8.2, 8.3
   */
  isStickersKeyboardOpen = signal<boolean>(false);

  /**
   * Whether the fixed toolbar is currently shown (user toggle state)
   * When true, the fixed toolbar is visible and the floating bubble menu is hidden.
   * When false, the floating bubble menu can appear on text selection (if enabled).
   */
  isFixedToolbarShown = signal<boolean>(false);

  /**
   * Whether the fixed toolbar was opened via manual toggle button click.
   * When true, handleSelectionUpdate() will not auto-close the toolbar on empty selection.
   * Reset to false when toolbar is explicitly closed (toggle off, outside click, Escape).
   * @see Requirements 2.22 - Mobile toolbar stays open on manual toggle
   */
  isFixedToolbarManuallyToggled = signal<boolean>(false);

  /**
   * Whether the fullscreen viewer is open for attachment preview
   * @see Requirements 11.1, 11.6
   */
  isFullscreenViewerOpen = signal<boolean>(false);

  /**
   * Index of the currently viewed attachment in fullscreen
   * @see Requirements 11.3, 11.4, 11.5
   */
  fullscreenViewerIndex = signal<number>(0);

  /**
   * Whether the attachment menu is open
   */
  isAttachmentMenuOpen = signal<boolean>(false);

  /**
   * Whether the mention suggestions panel is open
   */
  isMentionSuggestionsOpen = signal<boolean>(false);

  /**
   * Whether voice recording is in progress
   */
  isRecording = signal<boolean>(false);

  /**
   * Whether the CreatePoll modal is open
   * @see Requirements 2.2, 2.5, 2.6, 9.1
   */
  isPollModalOpen = signal<boolean>(false);

  /**
   * Whether the link dialog is open
   */
  isLinkDialogOpen = signal<boolean>(false);

  /**
   * Whether the link popover is open (quick actions on link click)
   */
  isLinkPopoverOpen = signal<boolean>(false);

  /**
   * Link popover URL
   */
  linkPopoverUrl = signal<string>('');

  /**
   * Link popover text
   */
  linkPopoverText = signal<string>('');

  /**
   * Link popover X coordinate
   */
  linkPopoverX = signal<number>(0);

  /**
   * Link popover Y coordinate
   */
  linkPopoverY = signal<number>(0);

  /**
   * Link dialog mode - 'add' for new links, 'edit' for existing links
   */
  linkDialogMode = signal<'add' | 'edit'>('add');

  /**
   * Initial text for link dialog (selected text or existing link text)
   */
  linkDialogInitialText = signal<string>('');

  /**
   * Initial URL for link dialog (existing link URL in edit mode)
   */
  linkDialogInitialUrl = signal<string>('');

  /**
   * Link dialog X coordinate (viewport-relative)
   */
  linkDialogX = signal<number>(0);

  /**
   * Link dialog Y coordinate (viewport-relative)
   */
  linkDialogY = signal<number>(0);

  /**
   * Saved editor selection state before opening link dialog
   * Used to restore selection when applying link changes
   */
  private savedLinkSelection: SelectionState | null = null;

  /**
   * Whether a collaborative extension operation is in progress
   * @see Requirements 4.2, 5.2
   */
  isExtensionLoading = signal<boolean>(false);

  /**
   * Current recording duration in seconds
   * @see Requirements 11.5
   */
  recordingDuration = signal<number>(0);

  /**
   * Whether files are being dragged over the composer
   */
  isDraggingOver = signal<boolean>(false);

  /**
   * Signal tracking bubble menu position
   * Used to position the bubble menu above the selected text
   * @see Requirements 1.5, 1.6
   */
  protected bubbleMenuPosition = signal<{ top: number; left: number } | null>(null);

  /**
   * Timer for debouncing bubble menu visibility during selection
   * Prevents the menu from appearing while user is actively selecting text
   */
  private bubbleMenuDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * Flag to track if mouse button is currently pressed
   * Used to prevent bubble menu from showing while user is dragging to select
   */
  private isMouseDown = false;

  /**
   * Whether the bubble menu is currently visible
   * The bubble menu is a floating toolbar that appears when text is selected in the editor.
   * This signal tracks its visibility state and is used to manage the bubble menu's display.
   * @see Requirements 1.1, 1.2
   */
  protected isBubbleMenuVisible = signal<boolean>(false);

  /**
   * Signal to track if viewport is mobile (< 480px)
   * Used to show fixed toolbar instead of floating bubble menu on mobile
   */
  protected isMobileView = signal<boolean>(false);

  /**
   * Current text selection range in the editor
   * Tracks the start and end positions of the selected text in the rich text editor.
   * Used for bubble menu positioning and determining when to show/hide the bubble menu.
   * Set to null when there is no selection or the selection is collapsed.
   * @see Requirements 1.5, 1.6
   */
  protected textSelection = signal<{ from: number; to: number } | null>(null);

  /**
   * Counter for nested drag enter/leave events to prevent flicker
   * Incremented on dragenter, decremented on dragleave
   * Drop zone only hides when counter reaches 0
   * @see Requirements 10.1, 10.2, 10.3, 10.7, 10.8
   */
  private dragCounter = 0;

  /**
   * Bound resize handler for cleanup
   * Used to detect mobile viewport for toolbar behavior
   */
  private boundResizeHandler: (() => void) | null = null;

  /**
   * Current search text for mentions (text after @)
   */
  mentionSearchText = signal<string>('');

  /**
   * Current cursor position in the text input
   */
  cursorPosition = signal<number>(0);

  /**
   * Currently focused index in the mention suggestions list
   * Used for keyboard navigation with Arrow Up/Down
   * @see Requirements 27.10
   */
  focusedMentionIndex = signal<number>(0);

  /**
   * Array of mention suggestions for keyboard navigation
   * This is populated from the service when searching for mentions
   * @see Requirements 27.10
   */
  mentionSuggestions = computed(() => this.messageComposerService.mentionSuggestions());

  /**
   * Whether mention suggestions are being fetched
   */
  isFetchingMentions = computed(() => this.messageComposerService.isFetchingMentions());

  /**
   * Request builder for fetching mentions with pagination support
   * @deprecated Use messageComposerService.initializeMentionsPagination() instead.
   * Kept for backward compatibility with custom builder inputs.
   * @see Requirements 11.1, 11.2, 11.3
   */
  mentionsRequestBuilder:
    | CometChat.UsersRequestBuilder
    | CometChat.GroupMembersRequestBuilder
    | null = null;

  /**
   * Whether additional mention suggestions are being fetched (pagination)
   * Delegates to the service signal for centralized state management
   * @see Requirements 11.1, 11.4
   */
  isFetchingMoreMentions = computed(() => this.messageComposerService.isFetchingMoreMentions());

  /**
   * Whether more mention suggestions are available to fetch
   * Delegates to the service signal for centralized state management
   * @see Requirements 11.2, 11.3
   */
  hasMoreMentions = computed(() => this.messageComposerService.hasMoreMentions());

  /**
   * Internal signal for text formatter array
   * Initialized from textFormatters input in ngOnInit
   * Used to manage the text formatter pipeline for message formatting
   * @see Requirements 5.1
   */
  textFormatterArray = signal<CometChatTextFormatter[]>([]);

  /**
   * Reference to the mentions formatter for mention metadata extraction
   * Automatically created and added to the formatter pipeline if not present
   * and mentions are not disabled
   * @see Requirements 5.4
   */
  mentionsFormatter = signal<CometChatMentionsFormatter | null>(null);

  // ==================== Live Region Signals ====================

  /**
   * Text content for the polite aria-live region
   * Used for non-urgent announcements (reply/edit preview, message sent, attachment added/removed)
   * @see Requirements 28.9, 28.11, 28.12
   */
  liveRegionPoliteText = signal<string>('');

  /**
   * Text content for the assertive aria-live region
   * Used for urgent announcements (recording state, errors)
   * @see Requirements 28.10, 28.13
   */
  liveRegionAssertiveText = signal<string>('');

  /**
   * File size validation error state
   * Set when one or more files exceed the maximum file size limit
   * @see Requirements 12.1, 12.3, 12.4
   */
  fileSizeError = signal<FileSizeError | null>(null);

  /**
   * Signal tracking the number of unique mention UIDs in the current message.
   * Updated whenever the editor content changes (rich text update or plain text input).
   * @see Requirements 6.1, 6.3, 6.4
   */
  uniqueMentionCount = signal<number>(0);

  /**
   * Signal indicating whether the mentions count warning banner should be displayed.
   * True when the number of unique mentions exceeds MENTIONS_LIMIT (10).
   * @see Requirements 6.1, 6.3
   */
  showMentionsCountWarning = signal<boolean>(false);

  /**
   * Set of unique mention UIDs currently in the composer (plain text mode).
   * In rich text mode, UIDs are extracted from the editor content instead.
   * This set is updated when mentions are inserted via selectMentionSuggestion
   * and cleared when the composer is reset.
   * @see Requirements 6.1, 6.4
   */
  private plainTextMentionUids = new Set<string>();

  /**
   * Map of mentioned user UIDs to user objects.
   * Stores user information when mentions are inserted so we can retrieve them
   * when building the message, even if the user is no longer in suggestions.
   * Cleared when the composer is reset.
   * @see Requirements 6.1, 6.4
   */
  private mentionedUsersMap = new Map<string, CometChat.User>();

  /**
   * Flag to prevent mention trigger checking immediately after mention insertion.
   * Set to true when a mention is inserted, prevents checkForMentionTrigger from running.
   * Automatically reset after a short delay to allow normal mention detection to resume.
   */
  private skipNextMentionCheck = false;

  /**
   * Internal signal for messageToReply state
   * Synced from the messageToReply input in ngOnChanges
   * Used for reactive state management of quoted reply mode
   * @see Requirements 2.1, 2.5, 2.6, 2.7
   */
  messageToReplySignal = signal<CometChat.BaseMessage | null>(null);

  /**
   * Internal signal for text message being edited
   * Tracks the message being edited when triggered via ccMessageEdited event
   * Used for reactive state management of edit mode
   * @see Requirements 7.1
   */
  textMessageToEdit = signal<CometChat.TextMessage | null>(null);

  /**
   * Internal signal for edit mode state
   * Tracks whether the composer is in edit mode (triggered via ccMessageEdited event)
   * @see Requirements 7.1
   */
  isEditMode = signal<boolean>(false);

  // ==================== Computed Signals ====================

  /**
   * Whether the send button should be enabled
   * Enabled when there is text or attachments
   * @see Requirements 4.9
   */
  canSend = computed(
    () =>
      this.composerText().trim().length > 0 || this.attachments().length > 0 || this.isRecording()
  );

  /**
   * Whether the voice recording button should be visible.
   * Hidden when the text input has content — user can either record or type.
   * @see Requirements 2.12
   */
  showVoiceButton = computed(() => !this.composerText().trim().length);

  /**
   * Whether the composer is in threaded reply mode (parentMessageId set)
   * @see Requirements 14.1
   */
  isInReplyMode = computed(() => !!this.parentMessageId);

  /**
   * Whether the composer is in quoted reply mode (messageToReply set)
   * @see Requirements 2.1
   */
  isInQuotedReplyMode = computed(() => !!this.messageToReplySignal());

  /**
   * Whether the composer is in edit mode
   * Checks both the messageToEdit input property and the textMessageToEdit signal
   * (for event-triggered edits via ccMessageEdited)
   * @see Requirements 15.1, 7.1, 5.3, 5.4
   */
  isInEditMode = computed(() => !!this.messageToEdit || !!this.textMessageToEdit());

  /**
   * Whether there are any attachments
   */
  hasAttachments = computed(() => this.attachments().length > 0);

  /**
   * Current number of attachments
   */
  attachmentCount = computed(() => this.attachments().length);

  /**
   * Whether more attachments can be added
   * @see Requirements 6.3
   */
  canAddMoreAttachments = computed(() => this.attachments().length < this.maxAttachments);

  /**
   * Computed signal for toolbar visibility.
   * - If enableRichText is false → never show.
   * - If showToolbarToggle is enabled → respect the user's toggle state (overrides hideRichTextToolbar).
   * - If hideRichTextToolbar is true → hide toolbar.
   * - If hideRichTextToolbar is false → always show toolbar.
   */
  protected shouldShowToolbar = computed(() => {
    // If rich text is disabled, never show toolbar
    if (!this.enableRichText) return false;

    // On mobile, when showBubbleMenuOnSelection is enabled and text is selected,
    // show the fixed toolbar as a replacement for the floating bubble menu
    // even if hideRichTextToolbar is true
    if (this.isMobileView() && this.showBubbleMenuOnSelection && this.isFixedToolbarShown()) {
      return true;
    }

    // If hideRichTextToolbar is true, hide toolbar
    if (this.hideRichTextToolbar) return false;

    // Otherwise, toolbar is always shown
    return true;
  });

  /**
   * Computed signal for current layout mode
   * Returns the current layout mode based on the layout input property
   * @see Requirements 1.1, 1.2, 1.3, 1.4, 1.5
   */
  protected currentLayoutMode = computed(() => this.layout);

  /**
   * Computed signal to determine if multiline layout is active
   * @see Requirements 1.3, 1.4
   */
  protected isMultilineLayout = computed(() => this.layout === 'multiline');

  /**
   * Computed signal that builds the array of attachment options for the action sheet.
   * Respects hide* inputs for each option and includes custom attachmentOptions if provided.
   * @see Requirements 5.2, 5.3, 5.4, 5.5, 5.6, 5.8, 5.10-5.16
   */
  attachmentMenuOptions = computed(() => {
    const options: CometChatMessageComposerAction[] = [];

    // Image attachment option
    if (!this.hideImageAttachmentOption) {
      options.push(
        new CometChatMessageComposerAction({
          id: 'image',
          title: CometChatLocalize.getLocalizedString('message_composer_attach_image'),
          iconURL: 'assets/photo.svg',
          onClick: () => this.handleAttachmentOptionClick('image'),
        })
      );
    }

    // Video attachment option
    if (!this.hideVideoAttachmentOption) {
      options.push(
        new CometChatMessageComposerAction({
          id: 'video',
          title: CometChatLocalize.getLocalizedString('message_composer_attach_video'),
          iconURL: 'assets/videocam.svg',
          onClick: () => this.handleAttachmentOptionClick('video'),
        })
      );
    }

    // Audio attachment option
    if (!this.hideAudioAttachmentOption) {
      options.push(
        new CometChatMessageComposerAction({
          id: 'audio',
          title: CometChatLocalize.getLocalizedString('message_composer_attach_audio'),
          iconURL: 'assets/play_circle.svg',
          onClick: () => this.handleAttachmentOptionClick('audio'),
        })
      );
    }

    // File attachment option
    if (!this.hideFileAttachmentOption) {
      options.push(
        new CometChatMessageComposerAction({
          id: 'file',
          title: CometChatLocalize.getLocalizedString('message_composer_attach_file'),
          iconURL: 'assets/document_icon.svg',
          onClick: () => this.handleAttachmentOptionClick('file'),
        })
      );
    }

    // Polls option (only in main conversation composer, not in thread mode)
    if (!this.hidePollsOption && !this.parentMessageId) {
      options.push(
        new CometChatMessageComposerAction({
          id: 'polls',
          title: CometChatLocalize.getLocalizedString('message_composer_polls'),
          iconURL: 'assets/poll.svg',
          onClick: () => this.handleAttachmentOptionClick('polls'),
        })
      );
    }

    // Collaborative Document option (only in main conversation composer, not in thread mode)
    if (!this.hideCollaborativeDocumentOption && !this.parentMessageId) {
      options.push(
        new CometChatMessageComposerAction({
          id: 'collaborative-document',
          title: CometChatLocalize.getLocalizedString('messsage_composer_collaborative_document'),
          iconURL: 'assets/collabrative_document.svg',
          onClick: () => this.handleAttachmentOptionClick('collaborative-document'),
        })
      );
    }

    // Collaborative Whiteboard option (only in main conversation composer, not in thread mode)
    if (!this.hideCollaborativeWhiteboardOption && !this.parentMessageId) {
      options.push(
        new CometChatMessageComposerAction({
          id: 'collaborative-whiteboard',
          title: CometChatLocalize.getLocalizedString('messsage_composer_collaborative_whiteboard'),
          iconURL: 'assets/collaborative_whiteboard.svg',
          onClick: () => this.handleAttachmentOptionClick('collaborative-whiteboard'),
        })
      );
    }

    // Add custom attachment options if provided
    if (this.attachmentOptions && this.attachmentOptions.length > 0) {
      options.push(...this.attachmentOptions);
    }

    return options;
  });

  // ==================== Private State ====================

  /**
   * Subject for component destruction cleanup
   */
  private destroy$ = new Subject<void>();

  /**
   * Subscription for ccActivePopover event coordination
   * Used to close this component's popovers when another component opens one
   * @see Requirements 1.8
   */
  private activePopoverSubscription?: Subscription;

  /**
   * Subscription for ccReplyToMessage event
   * Used to handle external reply triggers from message list context menu
   * @see Requirements 6.6
   */
  private replyToMessageSubscription?: Subscription;

  /**
   * Subscription for ccMessageEdited event
   * Handles edit lifecycle: inprogress (enter edit mode), success/cancelled (exit edit mode)
   * @see Requirements 7.1, 11.4, 11.5, 11.6, 11.7
   */
  private messageEditedSubscription?: Subscription;

  /**
   * Subscription for ccMessageDeleted event
   * Used to exit edit mode if the message being edited is deleted
   * @see Requirements 6.8
   */
  private messageDeletedSubscription?: Subscription;

  /**
   * Subscription for ccComposeMessage event
   * Used to handle external text insertion from smart replies, AI suggestions, etc.
   * @see Requirements 6.7
   */
  private composeMessageSubscription?: Subscription;

  /**
   * Subscription for SDK onMessageDeleted event
   * Used to exit edit mode if the message being edited is deleted by another user
   * @see Requirements 7.4
   */
  private sdkMessageDeletedSubscription?: Subscription;

  /**
   * Subscription for ccShowModal event
   * Used to show the poll creation modal when triggered externally
   * @see Requirements 7.7
   */
  private showModalSubscription?: Subscription;

  /**
   * Subscription for ccHideModal event
   * Used to hide the poll creation modal when triggered externally
   * @see Requirements 7.8
   */
  private hideModalSubscription?: Subscription;

  /**
   * Subscription for ccShowMentionsCountWarning event
   * Used to show/hide the mentions count warning when triggered by the mentions formatter
   * @see Requirements 7.9
   */
  private showMentionsCountWarningSubscription?: Subscription;

  /**
   * Timeout for typing indicator debounce
   */
  private typingTimeout?: ReturnType<typeof setTimeout>;

  /**
   * Original text before entering edit mode (for restoration on cancel)
   */
  private originalTextBeforeEdit = '';

  /**
   * Re-entrancy guard for enterEditMode.
   * Prevents infinite loop: enterEditMode emits ccMessageEdited(inprogress),
   * which the subscription handler receives and calls enterEditMode again.
   */
  private _enteringEditMode = false;

  // ==================== Constructor ====================

  /**
   * Constructor
   * Sets up effects within injection context
   */
  constructor() {
    // Effect 1: Mention search
    // @see Requirements 3.1, 3.2, 3.3, 3.4, 3.5
    effect(() => {
      const searchText = this.mentionSearchText();
      const isOpen = this.isMentionSuggestionsOpen();

      // Skip if the skipNextMentionCheck flag is set (right after mention insertion)
      if (this.skipNextMentionCheck) {
        return;
      }

      if (isOpen && !this.disableMentions) {
        // Initialize request builder for pagination when mentions are opened
        // @see Requirements 11.1, 11.2, 11.3
        this.initializeMentionsRequestBuilder(searchText);

        this.messageComposerService.searchMentions(
          searchText,
          this.currentGroup() ?? undefined,
          this.mentionsUsersRequestBuilder,
          this.mentionsGroupMembersRequestBuilder,
          this.disableMentionAll,
          this.mentionAllLabel
        );
      }
    }, { allowSignalWrites: true });

    // Effect 2: Focused mention index scrolling
    // Ensures the focused item is visible when outside the viewport
    // @see Requirements 3.1, 3.2, 3.3, 3.4, 3.5
    effect(() => {
      const index = this.focusedMentionIndex();
      if (this.isMentionSuggestionsOpen()) {
        this.scrollMentionIntoView(index);
      }
    }, { allowSignalWrites: true });

    // Effect 3: Service signal fallback (hybrid approach)
    // Reacts to service state changes when no props are provided
    effect(
      () => {
        const serviceUser = this.chatStateService.activeUser();
        const serviceGroup = this.chatStateService.activeGroup();
        const usingProps = this.propsProvided();

        // Only update from service if no props were provided
        if (!usingProps) {
          const prevUser = this.currentUser();
          const prevGroup = this.currentGroup();

          const userChanged = serviceUser?.getUid() !== prevUser?.getUid();
          const groupChanged = serviceGroup?.getGuid() !== prevGroup?.getGuid();

          // Update internal signals
          this.currentUser.set(serviceUser);
          this.currentGroup.set(serviceGroup);

          // Reset composer state when conversation context changes via service
          if (userChanged || groupChanged) {
            this.resetComposerState();
          }

          // Trigger change detection since we're using OnPush
          this.cdr.markForCheck();
        }
      },
      { allowSignalWrites: true }
    );

    // Effect 4: Layout change announcements for screen readers
    // Announces when the layout mode changes between single-line and multiline
    // @see Requirements 10.4
    effect(() => {
      const layoutMode = this.currentLayoutMode();

      // Announce layout change to screen readers via polite live region
      // Skip announcement on initial render (first effect run)
      if (layoutMode) {
        const layoutKey =
          layoutMode === 'multiline'
            ? 'message_composer_layout_multiline'
            : 'message_composer_layout_single_line';
        const announcement = CometChatLocalize.getLocalizedString(layoutKey);

        // Use setTimeout to ensure the announcement happens after the DOM update
        setTimeout(() => {
          this.liveRegionPoliteText.set(announcement);
          // Clear after announcement to allow future announcements
          setTimeout(() => this.liveRegionPoliteText.set(''), 100);
        }, 0);
      }
    }, { allowSignalWrites: true });

    // Effect 5: Mention suggestions count announcement for screen readers
    // Announces the number of suggestions when the mentions panel opens
    // @see Requirements 23.7
    effect(() => {
      const suggestions = this.mentionSuggestions();
      const isOpen = this.isMentionSuggestionsOpen();
      const isLoading = this.isFetchingMentions();

      // Only announce when panel is open, not loading, and has suggestions
      if (isOpen && !isLoading && suggestions.length > 0) {
        this.announceMentionSuggestionsCount(suggestions.length);
      }
    }, { allowSignalWrites: true });
  }

  // ==================== Lifecycle Hooks ====================

  /**
   * Initialize the component
   * Sets up service error callback and initializes state
   * Implements hybrid approach: props take priority over service
   * @see Requirements 1.4, 33.3
   */
  ngOnInit(): void {
    try {
      // Resolve localized @Input() defaults
      if (!this.mentionAllLabel) {
        this.mentionAllLabel = CometChatLocalize.getLocalizedString('message_composer_mention_all');
      }

      // Set up error callback to receive errors from service
      this.setupErrorCallback();

      // Initialize mobile view detection
      this.initializeMobileViewDetection();

      // Initialize composer text from inputs
      this.initializeComposerText();

      // Initialize text formatters from input
      // @see Requirements 5.1
      this.initializeTextFormatters();

      // Implement hybrid approach: props take priority over service
      if (this.user) {
        // Props provided: use them (backward compatible)
        this.propsProvided.set(true);
        this.currentUser.set(this.user);
        this.currentGroup.set(null);
      } else if (this.group) {
        // Props provided: use them (backward compatible)
        this.propsProvided.set(true);
        this.currentUser.set(null);
        this.currentGroup.set(this.group);
      } else {
        // No props provided - effect in constructor will handle service-based initialization
        this.propsProvided.set(false);
      }
      // Service-based initialization is handled by effect in constructor

      // Subscribe to ccActivePopover event for popover coordination
      // When another component opens a popover, close ours
      // @see Requirements 1.8
      this.subscribeToActivePopoverEvent();

      // Subscribe to ccReplyToMessage event for external reply triggers
      // @see Requirements 6.6
      this.subscribeToReplyToMessageEvent();

      // Subscribe to ccMessageEdited event for edit triggers and edit lifecycle
      // Handles inprogress (enter edit mode), success/cancelled (exit edit mode)
      // @see Requirements 7.1, 11.4, 11.5, 11.6, 11.7
      this.subscribeToMessageEditedEvent();

      // Subscribe to ccMessageDeleted event to exit edit mode if editing deleted message
      // @see Requirements 6.8
      this.subscribeToMessageDeletedEvent();

      // Subscribe to ccComposeMessage event for external text insertion
      // @see Requirements 6.7
      this.subscribeToComposeMessageEvent();

      // Subscribe to SDK onMessageDeleted event to exit edit mode if edited message
      // is deleted by another user
      // @see Requirements 7.4
      this.subscribeToSdkMessageDeletedEvent();

      // Subscribe to ccShowModal event to show poll creation modal
      // @see Requirements 7.7
      this.subscribeToShowModalEvent();

      // Subscribe to ccHideModal event to hide poll creation modal
      // @see Requirements 7.8
      this.subscribeToHideModalEvent();

      // Subscribe to ccShowMentionsCountWarning event for mentions warning
      // @see Requirements 7.9
      this.subscribeToShowMentionsCountWarningEvent();
    } catch (error) {
      this.handleLifecycleError(error, 'ngOnInit');
    }
  }

  /**
   * Initialize rich text editor after view is initialized
   * Only creates editor when enableRichText is true
   * @see Requirements 18.1, 18.2, 15.1, 15.2
   */
  ngAfterViewInit(): void {
    try {
      // Always initialize rich text editor (even when enableRichText is false)
      // The editor will work as a plain text input with mentions when formatting is disabled
      this.initializeRichTextEditor();
    } catch (error) {
      this.handleLifecycleError(error, 'ngAfterViewInit');
    }
  }

  /**
   * Handle input changes
   * Updates internal state when inputs change
   * @param changes - SimpleChanges object containing changed inputs
   * @see Requirements 33.3, 28.9
   */
  ngOnChanges(changes: SimpleChanges): void {
    try {
      // Handle text input change
      // @see Requirements 6.1
      if (changes['text'] && !changes['text'].firstChange) {
        const newText = changes['text'].currentValue || '';
        this.composerText.set(newText);
        // Also update rich text editor if it exists
        if (this.customRichTextEditor && this.enableRichText) {
          this.richTextEditorService.setContent(this.customRichTextEditor, newText);
        }
        // Emit textChange event for every text content change
        this.textChange.emit(newText);
      }

      // Handle messageToEdit change (entering/exiting edit mode)
      if (changes['messageToEdit']) {
        this.handleEditModeChange(changes['messageToEdit'].currentValue);
      }

      // Handle messageToReply change (entering/exiting quoted reply mode)
      // @see Requirements 2.1
      if (changes['messageToReply']) {
        this.handleReplyModeChange(changes['messageToReply'].currentValue);
      }

      // Handle parentMessageId change (entering/exiting reply mode)
      // @see Requirements 28.9
      if (changes['parentMessageId'] && !changes['parentMessageId'].firstChange) {
        if (changes['parentMessageId'].currentValue && !changes['parentMessageId'].previousValue) {
          // Entering reply mode - announce to screen readers
          this.announceReplyModeActivated();
        }
      }

      // Handle initialComposerText change
      // @see Requirements 6.1
      if (changes['initialComposerText'] && !changes['initialComposerText'].firstChange) {
        if (changes['initialComposerText'].currentValue) {
          const newText = changes['initialComposerText'].currentValue;
          this.composerText.set(newText);
          // Also update rich text editor if it exists
          if (this.customRichTextEditor && this.enableRichText) {
            this.richTextEditorService.setContent(this.customRichTextEditor, newText);
          }
          // Emit textChange event for every text content change
          this.textChange.emit(newText);
        }
      }

      // Handle enableRichText change - update CSS class on editor
      // The editor is always initialized, we just toggle formatting behavior via CSS
      if (changes['enableRichText'] && !changes['enableRichText'].firstChange) {
        // Trigger change detection to update the CSS class binding
        this.cdr.markForCheck();
      }

      // Handle user/group changes - reset composer state when conversation context changes
      // This ensures the composer is clean when switching between conversations
      // Also update internal signals when props change
      // @see Requirements 14.1, 14.2, 14.3, 14.4, 14.5, 14.6
      if (changes['user'] || changes['group']) {
        const userChanged =
          changes['user'] &&
          !changes['user'].firstChange &&
          changes['user'].currentValue?.getUid() !== changes['user'].previousValue?.getUid();
        const groupChanged =
          changes['group'] &&
          !changes['group'].firstChange &&
          changes['group'].currentValue?.getGuid() !== changes['group'].previousValue?.getGuid();

        // Update internal signals when props change
        if (changes['user']) {
          this.currentUser.set(changes['user'].currentValue || null);
          if (changes['user'].currentValue) {
            this.currentGroup.set(null);
          }
        }
        if (changes['group']) {
          this.currentGroup.set(changes['group'].currentValue || null);
          if (changes['group'].currentValue) {
            this.currentUser.set(null);
          }
        }

        if (userChanged || groupChanged) {
          this.resetComposerState();
        }
      }

      // Handle user/group/parentMessageId changes - reconfigure formatters
      // @see Requirements 5.6, 5.7, 5.9
      if (changes['user'] || changes['group'] || changes['parentMessageId']) {
        this.configureTextFormatters();
      }
    } catch (error) {
      // Log and continue with previous state — don't set error state for input changes
      CometChatLogger.error('CometChatMessageComposer', 'Error in ngOnChanges:', error);
    }
  }

  /**
   * Clean up the component
   * Clears timeouts and resets service state
   * @see Requirements 1.4, 33.3
   */
  ngOnDestroy(): void {
    try {
      // Complete the destroy subject to clean up any subscriptions
      this.destroy$.next();
      this.destroy$.complete();

      // Remove resize listener
      if (this.boundResizeHandler) {
        window.removeEventListener('resize', this.boundResizeHandler);
        this.boundResizeHandler = null;
      }

      // Unsubscribe from ccActivePopover event
      if (this.activePopoverSubscription) {
        this.activePopoverSubscription.unsubscribe();
      }

      // Unsubscribe from ccReplyToMessage event
      if (this.replyToMessageSubscription) {
        this.replyToMessageSubscription.unsubscribe();
      }

      // Unsubscribe from ccMessageEdited event
      if (this.messageEditedSubscription) {
        this.messageEditedSubscription.unsubscribe();
      }

      // Unsubscribe from ccMessageDeleted event
      if (this.messageDeletedSubscription) {
        this.messageDeletedSubscription.unsubscribe();
      }

      // Unsubscribe from ccComposeMessage event
      if (this.composeMessageSubscription) {
        this.composeMessageSubscription.unsubscribe();
      }

      // Unsubscribe from SDK onMessageDeleted event
      if (this.sdkMessageDeletedSubscription) {
        this.sdkMessageDeletedSubscription.unsubscribe();
      }

      // Unsubscribe from ccShowModal event
      if (this.showModalSubscription) {
        this.showModalSubscription.unsubscribe();
      }

      // Unsubscribe from ccHideModal event
      if (this.hideModalSubscription) {
        this.hideModalSubscription.unsubscribe();
      }

      // Unsubscribe from ccShowMentionsCountWarning event
      if (this.showMentionsCountWarningSubscription) {
        this.showMentionsCountWarningSubscription.unsubscribe();
      }

      // Clear typing timeout
      // @see Requirements 11.7
      if (this.typingTimeout) {
        clearTimeout(this.typingTimeout);
        this.typingTimeout = undefined;
      }

      // End typing indicator if active
      // @see Requirements 11.7
      this.endTypingIndicator();

      // Destroy rich text editor if it exists
      this.destroyRichTextEditor();

      // Clean up the service
      this.messageComposerService.cleanup();
    } catch (error) {
      CometChatLogger.error('CometChatMessageComposer', 'Error during cleanup:', error);
      // Don't emit error during destroy as component is being destroyed
    }
  }

  // ==================== Initialization Methods ====================

  /**
   * Handle lifecycle hook errors by setting error state and emitting
   * Used by ngOnInit and ngAfterViewInit to transition to error state
   * @param error - The caught error
   * @param hook - Name of the lifecycle hook where the error occurred
   * @see Requirements 2.1, 2.2 (Error Boundaries spec)
   */
  private handleLifecycleError(error: unknown, hook: string): void {
    const err = error instanceof Error ? error : new Error(String(error));
    CometChatLogger.error('CometChatMessageComposer', `Error in ${hook}:`, err);
    this.composerError.set(err);
    this.error.emit(err as CometChat.CometChatException);
  }

  /**
   * Handles retry click from the error state UI.
   * Resets the error state and re-runs initialization.
   * @see Requirements 3.3, 3.5
   */
  handleRetryClick(): void {
    this.composerError.set(null);
    // Re-run initialization
    try {
      this.setupErrorCallback();
      this.initializeMobileViewDetection();
      this.initializeComposerText();
      this.initializeTextFormatters();
    } catch (error) {
      this.handleLifecycleError(error, 'handleRetryClick');
    }
  }

  /**
   * Set up error callback to receive errors from service
   * @private
   */
  private setupErrorCallback(): void {
    this.messageComposerService.setErrorCallback((error: CometChat.CometChatException) => {
      this.error.emit(error);
    });
  }

  /**
   * Initialize composer text from inputs
   * Emits textChange event if initial text is set
   * @private
   * @see Requirements 6.1
   */
  private initializeComposerText(): void {
    if (this.text) {
      this.composerText.set(this.text);
      // Emit textChange event for initial text value
      this.textChange.emit(this.text);
    } else if (this.initialComposerText) {
      this.composerText.set(this.initialComposerText);
      // Emit textChange event for initial text value
      this.textChange.emit(this.initialComposerText);
    }
  }

  /**
   * Initialize mobile view detection
   * Sets up resize listener to track viewport width for toolbar behavior
   * On mobile (< 480px), fixed toolbar is shown instead of floating bubble menu
   * @private
   */
  private initializeMobileViewDetection(): void {
    // Check initial viewport width
    this.updateMobileViewState();

    // Set up resize listener
    this.boundResizeHandler = () => this.updateMobileViewState();
    window.addEventListener('resize', this.boundResizeHandler);
  }

  /**
   * Update mobile view state based on current viewport width
   * @private
   */
  private updateMobileViewState(): void {
    const isMobile = window.innerWidth < 480;
    this.isMobileView.set(isMobile);
  }

  /**
   * Initialize text formatters from input
   * Sets up the textFormatterArray signal with provided formatters
   * Automatically injects CometChatMentionsFormatter if not present and mentions enabled
   * @private
   * @see Requirements 5.1, 5.4
   */
  private initializeTextFormatters(): void {
    const formatters: CometChatTextFormatter[] = [];

    // Add provided formatters (using effective value for GlobalConfig priority)
    const effectiveFormatters = this.effectiveTextFormatters();
    if (effectiveFormatters && effectiveFormatters.length > 0) {
      formatters.push(...effectiveFormatters);
    }

    // Check if mentions formatter exists in provided formatters
    const hasMentionsFormatter = formatters.some(f => f instanceof CometChatMentionsFormatter);

    // Add mentions formatter if not present and mentions not disabled
    // @see Requirements 5.4
    if (!hasMentionsFormatter && !this.disableMentions) {
      const mentionsFormatter = new CometChatMentionsFormatter();

      // Configure @all mention based on component settings
      mentionsFormatter.setAllMentionConfig(!this.disableMentionAll, this.mentionAllLabel);

      formatters.push(mentionsFormatter);
      this.mentionsFormatter.set(mentionsFormatter);
    } else if (hasMentionsFormatter) {
      // Store reference to existing mentions formatter
      const existingFormatter = formatters.find(f => f instanceof CometChatMentionsFormatter);
      if (existingFormatter) {
        this.mentionsFormatter.set(existingFormatter as CometChatMentionsFormatter);
      }
    }

    this.textFormatterArray.set(formatters);
  }

  /**
   * Get the composer ID for formatter configuration
   * Returns an object identifying the current conversation context
   * @returns ComposerId object with user, group, and parentMessageId
   * @private
   * @see Requirements 5.9
   */
  private getComposerId(): {
    user: string | null;
    group: string | null;
    parentMessageId: number | null;
  } {
    return {
      user: this.currentUser()?.getUid() || null,
      group: this.currentGroup()?.getGuid() || null,
      parentMessageId: this.parentMessageId || null,
    };
  }

  /**
   * Configure text formatters with current conversation context
   * Called when user/group/parentMessageId changes or after editor initialization
   * Sets composer configuration and input element reference on each formatter
   * @private
   * @see Requirements 5.6, 5.7
   */
  private configureTextFormatters(): void {
    const composerId = this.getComposerId();

    for (const formatter of this.textFormatterArray()) {
      // Set composer configuration if the method exists on the formatter
      // Some formatters may implement this method for context-aware formatting
      const formatterWithConfig = formatter as unknown as {
        setComposerConfig?: (
          user: CometChat.User | undefined,
          group: CometChat.Group | undefined,
          composerId: { user: string | null; group: string | null; parentMessageId: number | null }
        ) => void;
      };
      if (typeof formatterWithConfig.setComposerConfig === 'function') {
        formatterWithConfig.setComposerConfig(
          this.currentUser() ?? undefined,
          this.currentGroup() ?? undefined,
          composerId
        );
      }

      // Set input element reference if rich text editor exists and method is available
      // This allows formatters to interact with the editor element directly
      // Note: We check for customRichTextEditor only (not enableRichText) because
      // the contentEditable is always the input mechanism. enableRichText only controls
      // markdown/formatting features, not text formatters like mentions.
      if (this.customRichTextEditor) {
        const editorElement = this.richTextEditorContainerRef?.nativeElement;
        if (editorElement) {
          const formatterWithRef = formatter as unknown as {
            setInputElementReference?: (element: HTMLElement) => void;
          };
          if (typeof formatterWithRef.setInputElementReference === 'function') {
            formatterWithRef.setInputElementReference(editorElement);
          }
        }
      }
    }

    // Pass custom formatters to the rich text editor for live pattern highlighting
    if (this.customRichTextEditor) {
      this.customRichTextEditor.setCustomFormatters(this.textFormatterArray());
    }
  }

  /**
   * Forward keyboard events to text formatters
   * Allows formatters to handle keyboard events for pattern detection
   * @param event - The keyboard event
   * @param eventType - 'keydown' or 'keyup'
   * @private
   * @see Requirements 5.8
   */
  private forwardKeyEventToFormatters(event: KeyboardEvent, eventType: 'keydown' | 'keyup'): void {
    for (const formatter of this.textFormatterArray()) {
      const formatterWithMethod = formatter as unknown as {
        onKeyDown?: (event: KeyboardEvent) => void;
        onKeyUp?: (event: KeyboardEvent) => void;
      };

      if (eventType === 'keydown' && typeof formatterWithMethod.onKeyDown === 'function') {
        formatterWithMethod.onKeyDown(event);
      } else if (eventType === 'keyup' && typeof formatterWithMethod.onKeyUp === 'function') {
        formatterWithMethod.onKeyUp(event);
      }
    }
  }

  /**
   * Update caret position and range on formatters
   * Called when selection changes in the editor to keep formatters in sync
   * @private
   * @see Requirements 5.8
   */
  private updateFormatterCaretPosition(): void {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return;
    }

    const range = selection.getRangeAt(0);

    for (const formatter of this.textFormatterArray()) {
      const formatterWithMethod = formatter as unknown as {
        setCaretPositionAndRange?: (selection: Selection, range: Range) => void;
      };

      if (typeof formatterWithMethod.setCaretPositionAndRange === 'function') {
        formatterWithMethod.setCaretPositionAndRange(selection, range);
      }
    }
  }

  /**
   * Subscribe to ccActivePopover event for popover coordination
   * When another component broadcasts that it opened a popover,
   * this component closes its own popover to maintain mutual exclusivity
   * @private
   * @see Requirements 1.8
   */
  private subscribeToActivePopoverEvent(): void {
    this.activePopoverSubscription = CometChatUIEvents.ccActivePopover.subscribe((id: string) => {
      // If another popover is being opened (different from ours), close ours
      if (this.contentToDisplay() !== 'none' && this.contentToDisplay() !== id) {
        this.contentToDisplay.set('none');
        // Also update the legacy boolean signals for backward compatibility
        this.syncLegacyPopoverSignals();
      }
    });
  }

  /**
   * Subscribe to ccReplyToMessage event for external reply triggers
   * Handles reply mode entry/exit when triggered from message list context menu
   * @private
   * @see Requirements 6.6
   */
  private subscribeToReplyToMessageEvent(): void {
    this.replyToMessageSubscription = CometChatMessageEvents.ccReplyToMessage.subscribe(data => {
      if (data.status === MessageStatus.inprogress) {
        // Enter reply mode when status is inprogress
        this.enterReplyMode(data.message);
      } else if (data.status === MessageStatus.success || data.status === MessageStatus.cancelled) {
        // Exit reply mode when status is success or cancelled
        this.exitReplyMode();
      }
    });
  }

  /**
   * Subscribe to ccMessageEdited event for edit triggers and edit lifecycle
   * Handles:
   * - inprogress: Enter edit mode (user initiates editing from message list)
   * - success: Exit edit mode (edit completed successfully)
   * - cancelled: Exit edit mode (user cancelled editing)
   * - error: No action (user may retry the edit)
   * @private
   * @see Requirements 7.1, 11.4, 11.5, 11.6, 11.7
   */
  private subscribeToMessageEditedEvent(): void {
    this.messageEditedSubscription = CometChatMessageEvents.ccMessageEdited.subscribe(data => {
      // Thread composer (parentMessageId set): only handle events with matching parentMessageId
      // Main composer (no parentMessageId): only handle events with no parentMessageId (null/undefined/0)
      const eventParentId = data.parentMessageId;
      const composerParentId = this.parentMessageId;

      if (composerParentId) {
        // This is a thread composer — only respond to events from the same thread
        if (!eventParentId || eventParentId !== composerParentId) {
          return;
        }
      } else {
        // This is the main composer — ignore events that have a thread context
        if (eventParentId) {
          return;
        }
      }

      if (data.status === MessageStatus.inprogress) {
        // Enter edit mode when status is inprogress
        this.enterEditMode(data.message as CometChat.TextMessage);
      } else if (data.status === MessageStatus.success || data.status === MessageStatus.cancelled) {
        // Exit edit mode when status is success or cancelled
        this.exitEditModeWithoutEvent();
      }
    });
  }

  /**
   * Subscribe to ccMessageDeleted event to exit edit mode if editing deleted message
   * When a message is deleted while being edited, the edit mode should be exited
   * without emitting events since the message no longer exists
   * @private
   * @see Requirements 6.8
   */
  private subscribeToMessageDeletedEvent(): void {
    this.messageDeletedSubscription = CometChatMessageEvents.ccMessageDeleted.subscribe(
      (message: CometChat.BaseMessage) => {
        // Check if the deleted message is the one being edited
        if (this.messageToEdit && this.messageToEdit.getId() === message.getId()) {
          // Exit edit mode without emitting events - the message is already deleted
          this.exitEditModeWithoutEvent();
        }
      }
    );
  }

  /**
   * Subscribe to ccComposeMessage event for external text insertion
   * Handles text insertion from smart replies, AI suggestions, etc.
   * @private
   * @see Requirements 6.7
   */
  private subscribeToComposeMessageEvent(): void {
    this.composeMessageSubscription = CometChatUIEvents.ccComposeMessage.subscribe(
      (text: string) => {
        // Insert the text into the editor
        this.insertTextFromExternalSource(text);

        // Emit textChange event
        this.textChange.emit(this.composerText());
      }
    );
  }

  /**
   * Subscribe to SDK onMessageDeleted event to exit edit mode if the edited message
   * is deleted by another user. Complements ccMessageDeleted which handles UI-level deletions.
   * @private
   * @see Requirements 7.4
   */
  private subscribeToSdkMessageDeletedEvent(): void {
    this.sdkMessageDeletedSubscription = CometChatMessageEvents.onMessageDeleted.subscribe(
      (message: CometChat.BaseMessage) => {
        // Check if the deleted message is the one being edited
        if (this.messageToEdit && this.messageToEdit.getId() === message.getId()) {
          this.exitEditModeWithoutEvent();
        }
        // Also check the signal-based edit state (for event-triggered edits)
        const editingMessage = this.textMessageToEdit();
        if (editingMessage && editingMessage.getId() === message.getId()) {
          this.exitEditModeWithoutEvent();
        }
      }
    );
  }

  /**
   * Subscribe to ccShowModal event to show the poll creation modal
   * Matches the composerId to ensure the modal is for this composer instance
   * @private
   * @see Requirements 7.7
   */
  private subscribeToShowModalEvent(): void {
    this.showModalSubscription = CometChatUIEvents.ccShowModal.subscribe((data: IModal) => {
      const { composerId } = data;
      const parentMessageId = this.parentMessageId;
      const userId = this.currentUser()?.getUid();
      const groupId = this.currentGroup()?.getGuid();

      if (composerId) {
        // Match composer ID to ensure this modal is for this composer instance
        if (
          (composerId.parentMessageId &&
            parentMessageId &&
            composerId.parentMessageId === parentMessageId) ||
          (!parentMessageId && (composerId.user === userId || composerId.group === groupId)) ||
          (!composerId.parentMessageId && !composerId.user && !composerId.group)
        ) {
          this.openPollModal();
        }
      } else {
        // No composerId specified — open for any composer
        this.openPollModal();
      }
    });
  }

  /**
   * Subscribe to ccHideModal event to hide the poll creation modal
   * @private
   * @see Requirements 7.8
   */
  private subscribeToHideModalEvent(): void {
    this.hideModalSubscription = CometChatUIEvents.ccHideModal.subscribe(() => {
      this.closePollModal();
    });
  }

  /**
   * Subscribe to ccShowMentionsCountWarning event to show/hide the mentions count warning
   * Filters by mentions formatter instance ID to ensure the warning is for this composer
   * @private
   * @see Requirements 7.9
   */
  private subscribeToShowMentionsCountWarningEvent(): void {
    this.showMentionsCountWarningSubscription =
      CometChatUIEvents.ccShowMentionsCountWarning.subscribe((data: IMentionsCountWarning) => {
        // Only handle warnings for this composer's mentions formatter instance
        const formatter = this.mentionsFormatter();
        if (data.id && formatter && data.id !== formatter.id) {
          return;
        }
        this.showMentionsCountWarning.set(data.showWarning);
      });
  }

  /**
   * Insert text from an external source (smart replies, AI suggestions, etc.)
   * Appends the text to the current composer content with a space separator if needed
   * @param text - The text to insert
   * @private
   * @see Requirements 6.7
   */
  private insertTextFromExternalSource(text: string): void {
    const currentText = this.composerText();
    const newText = currentText ? `${currentText} ${text}` : text;
    this.composerText.set(newText);

    // Update rich text editor if enabled
    if (this.customRichTextEditor && this.enableRichText) {
      this.richTextEditorService.setContent(this.customRichTextEditor, newText);
    }
  }

  /**
   * Sync legacy boolean popover signals with contentToDisplay state
   * This ensures backward compatibility with existing code that uses
   * isEmojiKeyboardOpen, isAttachmentMenuOpen, etc.
   * @private
   */
  private syncLegacyPopoverSignals(): void {
    const content = this.contentToDisplay();
    this.isEmojiKeyboardOpen.set(content === 'emojiKeyboard');
    this.isAttachmentMenuOpen.set(content === 'attachments');
    this.isRecording.set(content === 'voiceRecording');
    this.isStickersKeyboardOpen.set(content === 'stickers');
  }

  // ==================== Popover Toggle Methods ====================

  /**
   * Toggle the emoji keyboard popover
   * Implements mutual exclusivity - closes other popovers when opening
   * @see Requirements 1.1, 1.8, 1.9
   */
  toggleEmojiKeyboard(): void {
    if (this.contentToDisplay() === 'emojiKeyboard') {
      this.contentToDisplay.set('none');
    } else {
      this.contentToDisplay.set('emojiKeyboard');
      // Broadcast to other components that this popover is now active
      CometChatUIEvents.ccActivePopover.next('emojiKeyboard');
    }
    // Sync legacy signals for backward compatibility
    this.syncLegacyPopoverSignals();
    // Close mention suggestions when opening a popover
    this.isMentionSuggestionsOpen.set(false);
  }

  /**
   * Toggle the attachment menu popover
   * Implements mutual exclusivity - closes other popovers when opening
   * @see Requirements 1.2, 1.8, 1.9
   */
  toggleAttachmentMenu(): void {
    if (this.contentToDisplay() === 'attachments') {
      this.contentToDisplay.set('none');
    } else {
      this.contentToDisplay.set('attachments');
      // Broadcast to other components that this popover is now active
      CometChatUIEvents.ccActivePopover.next('attachments');
    }
    // Sync legacy signals for backward compatibility
    this.syncLegacyPopoverSignals();
    // Close mention suggestions when opening a popover
    this.isMentionSuggestionsOpen.set(false);
  }

  /**
   * Toggle the voice recording popover
   * Implements mutual exclusivity - closes other popovers when opening
   * When opening, sets isRecording to true since media recorder has autoRecording enabled
   * @see Requirements 1.3, 1.8, 1.9
   */
  toggleVoiceRecording(): void {
    if (this.contentToDisplay() === 'voiceRecording') {
      // Closing the popover - cancel recording if in progress
      if (this.isRecording()) {
        this.isRecording.set(false);
        this.recordingDuration.set(0);
        this.announceRecordingStopped();
      }
      this.contentToDisplay.set('none');
    } else {
      // Opening the popover - start recording (autoRecording is enabled)
      this.contentToDisplay.set('voiceRecording');
      this.isRecording.set(true);
      this.announceRecordingStarted();
      // Broadcast to other components that this popover is now active
      CometChatUIEvents.ccActivePopover.next('voiceRecording');
    }
    // Sync legacy signals for backward compatibility
    this.syncLegacyPopoverSignals();
    // Close mention suggestions when opening a popover
    this.isMentionSuggestionsOpen.set(false);
  }

  /**
   * Toggle the stickers keyboard popover
   * Implements mutual exclusivity - closes other popovers when opening
   * @see Requirements 1.4, 1.8, 1.9
   */
  toggleStickersKeyboard(): void {
    if (this.contentToDisplay() === 'stickers') {
      this.contentToDisplay.set('none');
    } else {
      this.contentToDisplay.set('stickers');
      // Broadcast to other components that this popover is now active
      CometChatUIEvents.ccActivePopover.next('stickers');
    }
    // Sync legacy signals for backward compatibility
    this.syncLegacyPopoverSignals();
    // Close mention suggestions when opening a popover
    this.isMentionSuggestionsOpen.set(false);
  }

  /**
   * Toggle the AI features popover
   * Implements mutual exclusivity - closes other popovers when opening
   * @see Requirements 1.8, 1.9
   */
  toggleAI(): void {
    if (this.contentToDisplay() === 'ai') {
      this.contentToDisplay.set('none');
    } else {
      this.contentToDisplay.set('ai');
      // Broadcast to other components that this popover is now active
      CometChatUIEvents.ccActivePopover.next('ai');
    }
    // Sync legacy signals for backward compatibility
    this.syncLegacyPopoverSignals();
    // Close mention suggestions when opening a popover
    this.isMentionSuggestionsOpen.set(false);
  }

  /**
   * Handle entering/exiting edit mode
   * Called when messageToEdit input changes
   * @param messageToEdit - The message to edit, or undefined to exit edit mode
   * @private
   * @see Requirements 15.2, 15.7, 15.8, 28.9
   */
  private handleEditModeChange(messageToEdit?: CometChat.BaseMessage): void {
    if (messageToEdit) {
      // Entering edit mode via input - use enterEditMode which emits inprogress event
      this.enterEditMode(messageToEdit as CometChat.TextMessage);
    } else if (this.originalTextBeforeEdit !== undefined) {
      // Exiting edit mode via input change - restore original text without emitting event
      // (the event was already emitted by the source that cleared the input)
      this.exitEditModeWithoutEvent();
    }
  }

  /**
   * Handle entering/exiting quoted reply mode
   * Syncs the messageToReply input to the internal signal
   * @param messageToReply - The message to reply to, or undefined to exit reply mode
   * @private
   * @see Requirements 2.1
   */
  private handleReplyModeChange(messageToReply?: CometChat.BaseMessage): void {
    if (messageToReply) {
      this.enterReplyMode(messageToReply);
    } else {
      this.exitReplyMode();
    }
  }

  /**
   * Reset the composer state when conversation context changes (user or group changes).
   * This ensures the composer is clean when switching between conversations,
   * preventing accidental message sends to the wrong recipient.
   *
   * Clears:
   * - composerText (text input)
   * - attachments (pending files)
   * - messageToReplySignal (quoted reply mode)
   * - messageToEdit (edit mode) - Note: This is an input, so we emit closePreview
   * - contentToDisplay (closes all popovers)
   * - Rich text editor content (if enabled)
   * - Active typing indicator
   *
   * @private
   * @see Requirements 14.1, 14.2, 14.3, 14.4, 14.5, 14.6
   */
  private resetComposerState(): void {
    // Clear composerText
    // @see Requirements 14.1, 14.2
    this.composerText.set('');

    // Clear attachments
    // @see Requirements 14.3
    this.attachments.set([]);

    // Clear messageToReply (quoted reply mode)
    // @see Requirements 14.6
    this.messageToReplySignal.set(null);

    // Clear edit mode state (signals + original text tracking)
    // @see Requirements 14.5
    if (this.isEditMode() || this.textMessageToEdit() || this.messageToEdit) {
      this.textMessageToEdit.set(null);
      this.isEditMode.set(false);
      this.originalTextBeforeEdit = '';
      this.closePreview.emit();
    }

    // Close all popovers by setting contentToDisplay to 'none'
    // @see Requirements 14.4
    this.contentToDisplay.set('none');

    // Sync legacy popover signals for backward compatibility
    this.syncLegacyPopoverSignals();

    // Close mention suggestions if open
    this.isMentionSuggestionsOpen.set(false);

    // Reset mentions count and warning
    // @see Requirements 6.1, 6.3
    this.uniqueMentionCount.set(0);
    this.showMentionsCountWarning.set(false);
    this.plainTextMentionUids.clear();
    this.mentionedUsersMap.clear();

    // Clear rich text editor content if it exists
    if (this.customRichTextEditor && this.enableRichText) {
      this.richTextEditorService.clearContent(this.customRichTextEditor);
    }

    // End any active typing indicator
    // @see Requirements 11.7
    if (!this.disableTypingEvents) {
      // Clear the typing timeout to prevent stale endTyping calls
      if (this.typingTimeout) {
        clearTimeout(this.typingTimeout);
        this.typingTimeout = undefined;
      }
      this.endTypingIndicator();
    }

    // Emit textChange event to notify parent of cleared text
    // @see Requirements 6.1
    this.textChange.emit('');
  }

  /**
   * Clears the composer input and any preview states after sending a message.
   * This is a simpler version of resetComposerState() specifically for post-send cleanup.
   *
   * Key difference from resetComposerState():
   * - resetComposerState() is for conversation changes (clears everything, ends typing indicator)
   * - clearComposer() is for after sending (clears input/attachments/preview, but doesn't end typing)
   *
   * Clears:
   * - Editor content (rich text or plain text)
   * - Reply mode state (messageToReplySignal)
   * - Edit mode state (textMessageToEdit, isEditMode)
   * - Attachments
   *
   * @private
   * @see Requirements 4.1, 4.2, 4.7, 4.8
   */
  private clearComposer(): void {
    // Clear editor content
    // @see Requirements 4.1
    this.composerText.set('');
    if (this.customRichTextEditor) {
      this.richTextEditorService.clearContent(this.customRichTextEditor);
    }

    // Clear reply mode if active
    // @see Requirements 4.8
    if (this.messageToReplySignal()) {
      this.messageToReplySignal.set(null);
    }

    // Clear edit mode if active
    // @see Requirements 4.7
    if (this.isEditMode() || this.textMessageToEdit()) {
      this.textMessageToEdit.set(null);
      this.isEditMode.set(false);
      this.originalTextBeforeEdit = '';
    }

    // Clear attachments
    // @see Requirements 4.2
    this.attachments.set([]);

    // Reset rich text toolbar format state
    this.richTextFormatState.set({
      bold: false,
      italic: false,
      underline: false,
      strikethrough: false,
      code: false,
      blockquote: false,
      codeBlock: false,
      orderedList: false,
      bulletList: false,
      link: false,
    });

    // Reset mentions count and warning
    // @see Requirements 6.1, 6.3
    this.uniqueMentionCount.set(0);
    this.showMentionsCountWarning.set(false);
    this.plainTextMentionUids.clear();
    this.mentionedUsersMap.clear();

    // Emit textChange event to notify parent of cleared text
    this.textChange.emit('');
  }

  /**
   * Enter quoted reply mode
   * Sets the messageToReplySignal and announces to screen readers
   * @param message - The message to reply to
   * @see Requirements 2.1, 2.9
   */
  enterReplyMode(message: CometChat.BaseMessage): void {
    // Clear edit mode if active
    if (this.messageToEdit) {
      this.exitEditMode();
    }

    // Set reply message signal
    this.messageToReplySignal.set(message);

    // Announce to screen readers
    const senderName =
      message.getSender()?.getName() || CometChatLocalize.getLocalizedString('unknown');
    const replyTemplate = CometChatLocalize.getLocalizedString('message_composer_replying_to');
    this.announcePolite(replyTemplate.replace('{sender}', senderName));

    // Focus the editor
    if (this.customRichTextEditor) {
      this.focusRichTextEditor();
    } else {
      this.focusTextInput();
    }
  }

  /**
   * Exit quoted reply mode
   * Clears the messageToReplySignal
   * @see Requirements 2.4, 2.7
   */
  exitReplyMode(): void {
    this.messageToReplySignal.set(null);
  }

  // ==================== Poll Modal Methods ====================

  /**
   * Open the CreatePoll modal
   * @see Requirements 2.2, 2.5, 9.1
   */
  openPollModal(): void {
    this.isPollModalOpen.set(true);
  }

  /**
   * Close the CreatePoll modal
   * @see Requirements 2.5, 9.1
   */
  closePollModal(): void {
    this.isPollModalOpen.set(false);
  }

  /**
   * Handle successful poll creation
   * Closes the modal and handles reply mode if active
   * @see Requirements 2.6, 2.7
   */
  onPollCreated(): void {
    this.closePollModal();
    // Clear reply preview if present
    if (this.messageToReplySignal()) {
      CometChatMessageEvents.ccReplyToMessage.next({
        message: this.messageToReplySignal()!,
        status: MessageStatus.success,
      });
      this.exitReplyMode();
    }
  }

  // ==================== Link Dialog Methods ====================

  /**
   * Handle link dialog save event
   * Inserts or updates link in the editor
   */
  handleLinkDialogSave(linkData: LinkData): void {
    if (this.customRichTextEditor) {
      // Restore the saved selection so setLink replaces the selected text
      // instead of inserting at a lost cursor position (which causes duplication)
      if (this.savedLinkSelection) {
        this.customRichTextEditor.restoreSelection(this.savedLinkSelection);
        this.savedLinkSelection = null;
      }

      // Set the link with both URL and text
      this.richTextEditorService.setLink(this.customRichTextEditor, linkData.url, linkData.text);

      // Update format state
      this.updateFormatStateFromEditor();

      // Announce to screen readers
      const formatName = CometChatLocalize.getLocalizedString('message_composer_link');
      const isActive = this.richTextFormatState().link;
      this.announceFormatStateChange(formatName, isActive);

      // Focus back to editor
      this.customRichTextEditor.focus();
    }

    // Close dialog
    this.isLinkDialogOpen.set(false);
  }

  /**
   * Handle link dialog remove event (edit mode only)
   * Removes the link from the editor
   */
  handleLinkDialogRemove(): void {
    if (this.customRichTextEditor) {
      // Restore the saved selection so unlink operates on the correct link element
      if (this.savedLinkSelection) {
        this.customRichTextEditor.restoreSelection(this.savedLinkSelection);
        this.savedLinkSelection = null;
      }

      // Remove the link (preserves text content, removes <a> wrapper)
      this.richTextEditorService.setLink(this.customRichTextEditor, null);

      // Update format state
      this.updateFormatStateFromEditor();

      // Announce to screen readers
      const formatName = CometChatLocalize.getLocalizedString('message_composer_link');
      this.announceFormatStateChange(formatName, false);

      // Focus back to editor
      this.customRichTextEditor.focus();
    }

    // Close dialog
    this.isLinkDialogOpen.set(false);
  }

  /**
   * Handle link dialog cancel event
   * Closes the dialog without making changes
   */
  handleLinkDialogCancel(): void {
    this.isLinkDialogOpen.set(false);
    this.savedLinkSelection = null;

    // Focus back to editor
    if (this.customRichTextEditor) {
      this.customRichTextEditor.focus();
    }
  }

  /**
   * Compute link dialog horizontal position relative to the composer host element.
   * Converts viewport X coordinate (clientX) to parent-relative left offset.
   */
  private computeLinkDialogLeft(viewportX: number): number {
    const hostEl = this.hostElementRef.nativeElement as HTMLElement;
    const composerDiv = hostEl.querySelector('.cometchat-message-composer') as HTMLElement;
    const parent = composerDiv || hostEl;
    const parentRect = parent.getBoundingClientRect();

    // Convert viewport X to parent-relative X
    let left = viewportX - parentRect.left;

    // Clamp so dialog stays within parent width (dialog is max 400px)
    const dialogWidth = 400;
    if (left + dialogWidth > parentRect.width) {
      left = parentRect.width - dialogWidth;
    }
    if (left < 0) {
      left = 0;
    }

    return left;
  }

  /**
   * Handle link click in the editor
   * Opens the popover with Edit and Remove options
   */
  private handleLinkClick(url: string, text: string, x: number, y: number): void {
    if (this.enableRichText) {
      // Save the current selection so edit/remove operations can restore it
      if (this.customRichTextEditor) {
        this.savedLinkSelection = this.customRichTextEditor.saveSelection();
      }

      // Use the click coordinates directly (clientX/clientY are already viewport-relative,
      // which matches the popover's position: fixed). The popover's calculatePosition()
      // handles viewport boundary clamping.
      this.linkPopoverUrl.set(url);
      this.linkPopoverText.set(text);
      this.linkPopoverX.set(x);
      this.linkPopoverY.set(y);
      this.isLinkPopoverOpen.set(true);
    }
  }

  /**
   * Handle edit click from link popover
   * Opens the full dialog in edit mode
   */
  handleLinkPopoverEdit(data: { url: string; text: string }): void {
    // Capture popover coordinates before closing it
    const x = this.linkPopoverX();

    // Close popover
    this.isLinkPopoverOpen.set(false);

    // Compute parent-relative position for the floating dialog
    const left = this.computeLinkDialogLeft(x);

    // savedLinkSelection was already set in handleLinkClick
    // Open dialog in edit mode positioned above the composer
    this.linkDialogMode.set('edit');
    this.linkDialogInitialText.set(data.text);
    this.linkDialogInitialUrl.set(data.url);
    this.linkDialogX.set(left);
    this.isLinkDialogOpen.set(true);
  }

  /**
   * Handle remove click from link popover
   * Removes the link and keeps the text
   */
  handleLinkPopoverRemove(): void {
    // Close popover
    this.isLinkPopoverOpen.set(false);

    // Remove the link
    if (this.customRichTextEditor) {
      // Restore the saved selection so unlink operates on the correct link element
      // (focus moved to the popover, so the editor selection was lost)
      if (this.savedLinkSelection) {
        this.customRichTextEditor.focus();
        this.customRichTextEditor.restoreSelection(this.savedLinkSelection);
        this.savedLinkSelection = null;
      }

      // Remove the link (preserves text content, removes <a> wrapper)
      this.richTextEditorService.setLink(this.customRichTextEditor, null);

      // Update format state
      this.updateFormatStateFromEditor();

      // Announce to screen readers
      const formatName = CometChatLocalize.getLocalizedString('message_composer_link');
      this.announceFormatStateChange(formatName, false);

      // Focus back to editor
      this.customRichTextEditor.focus();
    }
  }

  /**
   * Handle close click from link popover
   * Just closes the popover
   */
  handleLinkPopoverClose(): void {
    this.isLinkPopoverOpen.set(false);
    this.savedLinkSelection = null;

    // Focus back to editor
    if (this.customRichTextEditor) {
      this.customRichTextEditor.focus();
    }
  }

  // ==================== Collaborative Extension Methods ====================

  /**
   * Create a collaborative document via the document extension API
   *
   * Gets receiver info from user or group, calls the service method,
   * and handles success/error states including reply mode cleanup.
   *
   * @see Requirements 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9
   */
  async createCollaborativeDocument(): Promise<void> {
    const receiver = this.currentUser() || this.currentGroup();
    if (!receiver) {
      console.warn('[CometChatMessageComposer] No receiver set for collaborative document');
      return;
    }

    this.isExtensionLoading.set(true);

    try {
      const receiverId = this.currentUser()
        ? this.currentUser()!.getUid()
        : this.currentGroup()!.getGuid();
      const receiverType = this.currentUser() ? 'user' : 'group';
      const quotedMessageId = this.messageToReplySignal()?.getId();

      await this.messageComposerService.createCollaborativeDocument(
        receiverId,
        receiverType,
        quotedMessageId
      );

      // Handle success - close attachment menu
      this.contentToDisplay.set('none');
      this.syncLegacyPopoverSignals();

      // Handle quoted reply success
      // @see Requirements 4.7
      if (this.messageToReplySignal()) {
        CometChatMessageEvents.ccReplyToMessage.next({
          message: this.messageToReplySignal()!,
          status: MessageStatus.success,
        });
        this.exitReplyMode();
      }
    } catch (error) {
      // @see Requirements 4.8
      this.emitError(error);
    } finally {
      this.isExtensionLoading.set(false);
    }
  }

  /**
   * Create a collaborative whiteboard via the whiteboard extension API.
   * Gets receiver info, calls the service method, handles loading state,
   * and emits appropriate events on success or error.
   *
   * @see Requirements 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9
   */
  async createCollaborativeWhiteboard(): Promise<void> {
    const receiver = this.currentUser() || this.currentGroup();
    if (!receiver) {
      console.warn('[CometChatMessageComposer] No receiver set for collaborative whiteboard');
      return;
    }

    this.isExtensionLoading.set(true);

    try {
      const receiverId = this.currentUser()
        ? this.currentUser()!.getUid()
        : this.currentGroup()!.getGuid();
      const receiverType = this.currentUser() ? 'user' : 'group';
      const quotedMessageId = this.messageToReplySignal()?.getId();

      await this.messageComposerService.createCollaborativeWhiteboard(
        receiverId,
        receiverType,
        quotedMessageId
      );

      // Handle success - close attachment menu
      this.contentToDisplay.set('none');
      this.syncLegacyPopoverSignals();

      // Handle quoted reply success
      // @see Requirements 5.7
      if (this.messageToReplySignal()) {
        CometChatMessageEvents.ccReplyToMessage.next({
          message: this.messageToReplySignal()!,
          status: MessageStatus.success,
        });
        this.exitReplyMode();
      }
    } catch (error) {
      // @see Requirements 5.8
      this.emitError(error);
    } finally {
      this.isExtensionLoading.set(false);
    }
  }

  /**
   * Get the title for the reply preview
   * Returns the sender name of the message being replied to
   * @returns The sender name for the reply preview title
   * @see Requirements 2.2
   */
  getReplyPreviewTitle(): string {
    const message = this.messageToReplySignal();
    if (!message) {
      return '';
    }
    const senderName =
      message.getSender()?.getName() || CometChatLocalize.getLocalizedString('unknown');
    return senderName;
  }

  /**
   * Get the subtitle for the reply preview
   * Returns the message text preview or a description for non-text messages
   * Applies formatters to render SDK format mentions and rich text formatting
   * @returns The formatted reply preview subtitle (HTML string)
   * @see Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6
   */
  getReplyPreviewSubtitle(): string {
    const message = this.messageToReplySignal();
    if (!message) {
      return '';
    }

    // Check message type and return appropriate preview text
    const messageType = message.getType();

    if (messageType === CometChat.MESSAGE_TYPE.TEXT) {
      // For text messages, format the text content
      const textMessage = message as CometChat.TextMessage;
      return this.formatReplyPreviewText(textMessage);
    } else if (messageType === CometChat.MESSAGE_TYPE.IMAGE) {
      return CometChatLocalize.getLocalizedString('conversation_subtitle_image');
    } else if (messageType === CometChat.MESSAGE_TYPE.VIDEO) {
      return CometChatLocalize.getLocalizedString('conversation_subtitle_video');
    } else if (messageType === CometChat.MESSAGE_TYPE.AUDIO) {
      return CometChatLocalize.getLocalizedString('conversation_subtitle_audio');
    } else if (messageType === CometChat.MESSAGE_TYPE.FILE) {
      return CometChatLocalize.getLocalizedString('conversation_subtitle_file');
    } else {
      // For custom messages or other types
      return CometChatLocalize.getLocalizedString('message');
    }
  }

  /**
   * Format text for reply preview with mentions and rich text formatting
   * Applies formatters WITHOUT alignment (no direction CSS classes for previews)
   * @param message - The text message to format
   * @returns Formatted and sanitized HTML string
   * @see Requirements 2.1, 2.2, 2.3, 2.5, 2.6
   * @private
   */
  private formatReplyPreviewText(message: CometChat.TextMessage): string {
    // Extract text from message
    const text = message.getText() || '';

    if (!text) {
      return '';
    }

    // Check for rich text metadata HTML — use it if available.
    // This ensures ALL formatting types (italic, blockquote, underline, etc.)
    // are rendered correctly in the preview, not just the ones formatters handle.
    try {
      const metadata = message.getMetadata?.() as Record<string, any> | undefined;
      const richText = metadata?.['richText'] as
        | { html?: string; hasFormatting?: boolean }
        | undefined;
      if (richText?.html && richText?.hasFormatting) {
        const sanitized = this.htmlSanitizerService.sanitize(richText.html);
        if (sanitized) {
          return sanitized;
        }
      }
    } catch {
      // Fall through to formatter-based approach
    }

    // Get formatters without alignment (no direction classes for previews)
    const loggedInUser = CometChatUIKit.getLoggedInUser();
    const formatters = this.formatterConfigService.getFormattersWithContext(
      loggedInUser || undefined, // Convert null to undefined
      undefined // No alignment for preview contexts
    );

    // Get mentioned users from the message
    const mentionedUsers = message.getMentionedUsers?.() || [];

    // SECURITY: Escape HTML entities in raw user text before formatter processing.
    // Prevents XSS payloads from being interpreted as HTML in reply preview.
    const escapedText = this.htmlSanitizerService.escapeUserHtml(text);

    // Convert markdown formatting markers to HTML for rich text display.
    // This converts **bold** → <strong>bold</strong>, _italic_ → <em>italic</em>, etc.
    let formattedText = this.convertMarkdownToHtml(escapedText);

    // Apply formatters to the text, handling SDK mentions specially
    for (const formatter of formatters) {
      formatter.reset();

      if (!formatter.shouldFormat(formattedText, message)) {
        continue;
      }

      // For CometChatMentionsFormatter, use formatSdkMentions if SDK mentions are present
      if (formatter instanceof CometChatMentionsFormatter) {
        if (formatter.hasSdkMentions(formattedText)) {
          formattedText = formatter.formatSdkMentions(formattedText, mentionedUsers);
        } else {
          formattedText = formatter.format(formattedText);
        }
      } else {
        formattedText = formatter.format(formattedText);
      }
    }

    // Sanitize the HTML output
    const sanitized = this.htmlSanitizerService.sanitize(formattedText);

    return sanitized;
  }

  /**
   * Handle reply preview close button click
   * Clears the reply mode and emits closePreview event
   * @see Requirements 2.3, 2.4
   */
  onReplyPreviewClose(): void {
    // Publish ccReplyToMessage with cancelled status before exiting reply mode
    // @see Requirements 11.9
    if (this.messageToReplySignal()) {
      CometChatMessageEvents.ccReplyToMessage.next({
        message: this.messageToReplySignal()!,
        status: MessageStatus.cancelled,
      });
    }
    this.exitReplyMode();
    this.closePreview.emit();
  }

  /**
   * Enter edit mode for a message
   * Saves original text, populates editor with message text, and emits inprogress event
   * @param message - The text message to edit
   * @see Requirements 3.1, 3.2, 3.5, 6.1, 6.5
   */
  enterEditMode(message: CometChat.TextMessage): void {
    // Guard against re-entrant calls. enterEditMode emits ccMessageEdited(inprogress),
    // which the subscription handler also calls enterEditMode — causing an infinite loop.
    if (this._enteringEditMode) {
      return;
    }
    this._enteringEditMode = true;

    try {
      // Clear reply mode if active
      if (this.messageToReplySignal()) {
        this.exitReplyMode();
      }

      // Save original text for cancellation
      this.originalTextBeforeEdit = this.composerText();

      // Set the edit mode signals
      // @see Requirements 7.1 - Track the message being edited
      this.textMessageToEdit.set(message);
      this.isEditMode.set(true);

      // Populate editor with message text
      const messageText = message.getText?.() || '';
      this.composerText.set(messageText);

      // Also update rich text editor content if it exists
      // This ensures the editor shows the message text even when enableRichText is false
      if (this.customRichTextEditor) {
        if (this.enableRichText) {
          // Populate with formatted text including mentions
          this.populateEditorWithFormattedText(message);
        } else {
          // Just set plain text content
          this.richTextEditorService.setContent(this.customRichTextEditor, messageText);
        }
      }

      // Emit textChange event for every text content change
      // @see Requirements 6.1
      this.textChange.emit(messageText);

      // Emit ccMessageEdited with inprogress status
      // @see Requirements 3.5
      CometChatMessageEvents.ccMessageEdited.next({
        message: message,
        status: MessageStatus.inprogress,
        parentMessageId: this.parentMessageId ?? null,
      });

      // Announce edit mode activation to screen readers
      // @see Requirements 3.8
      this.announceEditModeActivated();

      // Focus the editor
      if (this.customRichTextEditor) {
        this.focusRichTextEditor();
      } else {
        this.focusTextInput();
      }
    } finally {
      this._enteringEditMode = false;
    }
  }

  /**
   * Populate the rich text editor with formatted text including mentions.
   * Converts mention placeholders in the message text to mention nodes.
   * Also sets the mentioned users on the mentions formatter for tracking.
   * @param message - The text message to populate the editor with
   * @private
   * @see Requirements 3.2, 3.9
   */
  private populateEditorWithFormattedText(message: CometChat.TextMessage): void {
    if (!this.customRichTextEditor) {
      return;
    }

    const messageText = message.getText?.() || '';
    const mentionedUsers = message.getMentionedUsers?.() || [];

    // Use the RichTextEditorService to set content with mentions
    this.richTextEditorService.setContentWithMentions(
      this.customRichTextEditor,
      messageText,
      mentionedUsers
    );

    // Set mentioned users on the mentions formatter so they're tracked
    // This ensures that when the edited message is sent, the mentions are preserved
    if (mentionedUsers.length > 0 && !this.disableMentions) {
      // Store the mentioned users for use when sending the edited message
      // The mentions will be extracted from the editor content when sending
      this.setMentionedUsersForEdit(mentionedUsers);
    }
  }

  /**
   * Set the mentioned users for edit mode.
   * This stores the mentioned users so they can be included when the edited message is sent.
   * @param mentionedUsers - Array of mentioned users from the original message
   * @private
   */
  private setMentionedUsersForEdit(mentionedUsers: CometChat.User[]): void {
    // The mentioned users are stored in the message and will be re-extracted
    // from the editor content when the message is sent.
    // This method can be extended to pre-populate a mentions formatter if needed.
    // For now, the mentions are preserved in the rich text editor as mention nodes
    // and will be extracted when formatMessageWithMentions is called during send.
  }

  /**
   * Cancel edit mode
   * Restores original text, emits cancelled event, and emits closePreview
   * Called when user clicks the close button on edit preview
   * @see Requirements 3.4, 3.10, 6.1
   */
  cancelEdit(): void {
    const editMessage = this.messageToEdit || this.textMessageToEdit();

    if (editMessage) {
      // Emit ccMessageEdited with cancelled status
      // @see Requirements 3.4
      CometChatMessageEvents.ccMessageEdited.next({
        message: editMessage,
        status: MessageStatus.cancelled,
        parentMessageId: this.parentMessageId ?? null,
      });
    }

    // Clear the edit mode signals
    // @see Requirements 5.2
    this.textMessageToEdit.set(null);
    this.isEditMode.set(false);

    // Restore original text
    if (this.originalTextBeforeEdit !== undefined) {
      this.composerText.set(this.originalTextBeforeEdit);
      if (this.customRichTextEditor && this.enableRichText) {
        this.richTextEditorService.setContent(
          this.customRichTextEditor,
          this.originalTextBeforeEdit
        );
      }
      // Emit textChange event for every text content change
      // @see Requirements 6.1
      this.textChange.emit(this.originalTextBeforeEdit);
      this.originalTextBeforeEdit = '';
    }

    // Emit closePreview event
    this.closePreview.emit();
  }

  /**
   * Get the current message being edited
   * Returns the message from either the messageToEdit input or the textMessageToEdit signal
   * (for event-triggered edits via ccMessageEdited)
   * @returns The message being edited, or null if not in edit mode
   * @see Requirements 5.3, 5.4
   */
  getCurrentEditMessage(): CometChat.BaseMessage | null {
    return this.messageToEdit || this.textMessageToEdit();
  }

  /**
   * Get the title for the edit preview
   * Returns the localized "Edit message" text
   * @returns The edit preview title
   * @see Requirements 3.3
   */
  getEditPreviewTitle(): string {
    return CometChatLocalize.getLocalizedString('message_composer_edit_message');
  }

  /**
   * Get the subtitle for the edit preview
   * Returns the message text with mentions properly formatted
   * @returns The formatted edit preview subtitle with mentions displayed
   * @see Requirements 3.3, 3.9
   */
  getEditPreviewSubtitle(): string {
    // Get the current edit message from either input or signal
    const editMessage = this.getCurrentEditMessage();
    if (!editMessage) {
      return '';
    }

    // Check if it's a text message
    if (editMessage.getType() === CometChat.MESSAGE_TYPE.TEXT) {
      const textMessage = editMessage as CometChat.TextMessage;
      return this.formatEditPreviewText(textMessage);
    }

    // For non-text messages, escape raw text to prevent XSS via [innerHTML]
    const textMessage = editMessage as CometChat.TextMessage;
    const rawText = textMessage.getText?.() || '';
    return this.htmlSanitizerService.escapeUserHtml(rawText);
  }

  /**
   * Format text for edit preview with mentions and rich text formatting
   * Applies formatters WITHOUT alignment (no direction CSS classes for previews)
   * @param message - The text message to format
   * @returns Formatted and sanitized HTML string
   * @see Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6
   * @private
   */
  private formatEditPreviewText(message: CometChat.TextMessage): string {
    // Extract text from message
    const text = message.getText() || '';

    if (!text) {
      return '';
    }

    // Check for rich text metadata HTML — use it if available.
    // This ensures ALL formatting types (italic, blockquote, underline, etc.)
    // are rendered correctly in the preview, not just the ones formatters handle.
    try {
      const metadata = message.getMetadata?.() as Record<string, any> | undefined;
      const richText = metadata?.['richText'] as
        | { html?: string; hasFormatting?: boolean }
        | undefined;
      if (richText?.html && richText?.hasFormatting) {
        const sanitized = this.htmlSanitizerService.sanitize(richText.html);
        if (sanitized) {
          return sanitized;
        }
      }
    } catch {
      // Fall through to formatter-based approach
    }

    // Get formatters without alignment (no direction classes for previews)
    const loggedInUser = CometChatUIKit.getLoggedInUser();
    const formatters = this.formatterConfigService.getFormattersWithContext(
      loggedInUser || undefined, // Convert null to undefined
      undefined // No alignment for preview contexts
    );

    // Get mentioned users from the message
    const mentionedUsers = message.getMentionedUsers?.() || [];

    // SECURITY: Escape HTML entities in raw user text before formatter processing.
    // Prevents XSS payloads from being interpreted as HTML in edit preview.
    const escapedText = this.htmlSanitizerService.escapeUserHtml(text);

    // Convert markdown formatting markers to HTML for rich text display.
    // This converts **bold** → <strong>bold</strong>, _italic_ → <em>italic</em>, etc.
    let formattedText = this.convertMarkdownToHtml(escapedText);

    // Apply formatters to the text, handling SDK mentions specially
    for (const formatter of formatters) {
      formatter.reset();

      if (!formatter.shouldFormat(formattedText, message)) {
        continue;
      }

      // For CometChatMentionsFormatter, use formatSdkMentions if SDK mentions are present
      if (formatter instanceof CometChatMentionsFormatter) {
        if (formatter.hasSdkMentions(formattedText)) {
          formattedText = formatter.formatSdkMentions(formattedText, mentionedUsers);
        } else {
          formattedText = formatter.format(formattedText);
        }
      } else {
        formattedText = formatter.format(formattedText);
      }
    }

    // Sanitize the HTML output
    const sanitized = this.htmlSanitizerService.sanitize(formattedText);

    return sanitized;
  }

  /**
   * Converts markdown formatting markers to HTML tags for rich text display
   * in reply/edit previews.
   *
   * Order matters: double markers (**,__) must be processed before single (*,_)
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
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
    );

    return result;
  }

  /**
   * Handle edit preview close button click
   * Cancels the edit and emits closePreview event
   * @see Requirements 3.4
   */
  onEditPreviewClose(): void {
    this.cancelEdit();
  }

  /**
   * Exit edit mode without emitting events
   * Used when exiting due to external event (success/cancelled already emitted)
   * @private
   * @see Requirements 3.10, 6.1
   */
  private exitEditModeWithoutEvent(): void {
    // Clear the edit mode signals
    // @see Requirements 5.2
    this.textMessageToEdit.set(null);
    this.isEditMode.set(false);

    if (this.originalTextBeforeEdit !== undefined) {
      this.composerText.set(this.originalTextBeforeEdit);
      if (this.customRichTextEditor && this.enableRichText) {
        this.richTextEditorService.setContent(
          this.customRichTextEditor,
          this.originalTextBeforeEdit
        );
      }
      // Emit textChange event for every text content change
      // @see Requirements 6.1
      this.textChange.emit(this.originalTextBeforeEdit);
      this.originalTextBeforeEdit = '';
    }
  }

  /**
   * Exit edit mode (legacy method for backward compatibility)
   * Clears the edit state and restores original text
   * @private
   * @see Requirements 3.10
   */
  private exitEditMode(): void {
    this.exitEditModeWithoutEvent();
  }

  // ==================== Rich Text Editor Methods ====================

  /**
   * Initialize the rich text editor
   * Creates editor instance and mounts it to the container element
   * @private
   * @see Requirements 15.1, 15.2, 18.1, 18.2
   */
  private initializeRichTextEditor(): void {
    // Don't initialize if already exists
    if (this.customRichTextEditor) {
      return;
    }

    // Wait for the container element to be available
    setTimeout(() => {
      const containerElement = this.richTextEditorContainerRef?.nativeElement;
      if (!containerElement) {
        console.warn('[CometChatMessageComposer] Rich text editor container not found');
        return;
      }

      try {
        // Get localized placeholder text
        const placeholder = CometChatLocalize.getLocalizedString(this.placeholderText);

        // Determine if autofocus should be enabled
        // On mobile devices, autofocus is disabled by default to prevent keyboard from opening
        // Users can enable it by setting disableAutoFocusOnMobile to false
        const shouldAutofocus = this.disableAutoFocusOnMobile && isMobileDevice() ? false : true;

        // Create the RichTextEditor
        this.customRichTextEditor = this.richTextEditorService.createEditor(
          {
            placeholder,
            editable: true,
            autofocus: shouldAutofocus,
            content: this.composerText() || '',
            enableFormatting: this.enableRichText, // Pass enableRichText to control formatting
            onUpdate: (html: string, text: string) => {
              this.handleRichTextUpdate(html, text);
            },
            onSelectionUpdate: (formatState: RichTextFormatState) => {
              this.handleSelectionUpdate(formatState);
            },
            onFocus: () => {
              this.handleInputFocus();
            },
            onBlur: () => {
              this.handleInputBlur();
            },
            onLinkClick: (url: string, text: string, x: number, y: number) => {
              this.handleLinkClick(url, text, x, y);
            },
          },
          containerElement
        );

        // Add keyboard event listener for mention navigation
        containerElement.addEventListener(
          'keydown',
          (event: KeyboardEvent) => {
            this.handleRichTextKeydown(event);
          },
          true
        );

        // Safari fix: Prevent line breaks in single-line mode via beforeinput event.
        // Safari may fire 'insertParagraph' or 'insertLineBreak' beforeinput events
        // that bypass the keydown handler, causing unwanted line breaks in single-line mode.
        // Only prevent insertParagraph (Enter) when enterKeyBehavior is SendMessage.
        // insertLineBreak (Shift+Enter) should always be allowed for new lines.
        containerElement.addEventListener(
          'beforeinput',
          (event: InputEvent) => {
            if (
              !this.isMultilineLayout() &&
              event.inputType === 'insertParagraph' &&
              this.enterKeyBehavior === EnterKeyBehavior.SendMessage
            ) {
              event.preventDefault();
            }
          },
          true
        );

        // Add mouse event listeners to track mouse button state
        // This prevents bubble menu from showing while user is dragging to select
        containerElement.addEventListener('mousedown', () => {
          this.isMouseDown = true;
        });

        containerElement.addEventListener('mouseup', () => {
          this.isMouseDown = false;
          // Trigger selection update after mouse release
          // This will show the bubble menu if there's a selection
          if (this.customRichTextEditor) {
            const formatState = this.richTextEditorService.getFormatState(
              this.customRichTextEditor
            );
            this.handleSelectionUpdate(formatState);
          }
        });

        // Also listen for mouseup on document in case user releases outside the editor
        document.addEventListener('mouseup', () => {
          if (this.isMouseDown) {
            this.isMouseDown = false;
            // Trigger selection update after mouse release
            if (this.customRichTextEditor) {
              const formatState = this.richTextEditorService.getFormatState(
                this.customRichTextEditor
              );
              this.handleSelectionUpdate(formatState);
            }
          }
        });

        // Configure formatters with editor element reference
        this.configureTextFormatters();
      } catch (error) {
        CometChatLogger.error(
          'CometChatMessageComposer',
          'Error initializing rich text editor:',
          error
        );
        this.emitError(error);
      }
    }, 0);
  }

  /**
   * Handle keydown events in the rich text editor
   * Handles mention navigation, Tab navigation, Enter key behavior, and formatting shortcuts
   * @param event - Keyboard event
   * @private
   * @see Requirements 2.1, 2.2 - Tab/Shift+Tab navigation
   * @see Requirements 4.4 - Escape clears reply/edit preview
   * @see Requirements 4.5, 4.6, 4.7 - Ctrl/Cmd+B/I/U for formatting
   */
  private handleRichTextKeydown(event: KeyboardEvent): void {
    // Handle Escape key - close popups first, then clear reply/edit preview
    // @see Requirements 4.4
    if (event.key === 'Escape') {
      // First check if any popup is open
      if (this.isAnyPopupOpen()) {
        this.closeAllPopups();
        return;
      }
      // If no popup is open, clear reply/edit preview if present
      if (this.isInQuotedReplyMode() || this.isInEditMode()) {
        event.preventDefault();
        this.handleClosePreview();
        return;
      }
      return;
    }

    // Handle rich text formatting shortcuts (Ctrl/Cmd+B/I/U)
    // @see Requirements 4.5, 4.6, 4.7
    if (this.enableRichText && this.handleFormattingShortcuts(event)) {
      return;
    }

    // Handle Tab key for focus navigation
    // @see Requirements 2.1, 2.2
    if (event.key === 'Tab') {
      // When mention suggestions are open, Tab selects the focused suggestion
      if (this.isMentionSuggestionsOpen()) {
        const suggestions = this.mentionSuggestions();
        const currentIndex = this.focusedMentionIndex();
        if (suggestions.length > 0 && currentIndex >= 0 && currentIndex < suggestions.length) {
          event.preventDefault();
          event.stopPropagation();
          this.selectMentionSuggestion(suggestions[currentIndex]);
        }
        return;
      }

      // When inside a list, let the event propagate to the rich text editor
      // so it can handle Tab for indentation / Shift+Tab for outdentation
      // @see Requirement 2.17 (Bug 6 fix)
      if (this.customRichTextEditor && this.richTextEditorService.isInList(this.customRichTextEditor)) {
        // Don't stop propagation — let the editor's handleKeyDown handle it
        return;
      }

      // When mention suggestions are NOT open, allow Tab to move focus to next element
      // Don't prevent default - let the browser handle focus navigation
      event.stopPropagation();
      return;
    }

    // Only intercept arrow keys when mention suggestions are open
    // Let the editor handle native cursor movement for all other cases
    // @see Requirements 2.3
    if (this.isMentionSuggestionsOpen()) {
      const suggestions = this.mentionSuggestions();
      const currentIndex = this.focusedMentionIndex();

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          event.stopPropagation();
          // Move focus to next suggestion (wrap around)
          if (suggestions.length > 0) {
            const newIndex = (currentIndex + 1) % suggestions.length;
            this.focusedMentionIndex.set(newIndex);
            // Announce focused mention to screen readers
            // @see Requirements 14.3
            const focusedSuggestion = suggestions[newIndex];
            this.announceFocusedMention(focusedSuggestion.name, newIndex + 1, suggestions.length);
          }
          return;

        case 'ArrowUp':
          event.preventDefault();
          event.stopPropagation();
          // Move focus to previous suggestion (wrap around)
          if (suggestions.length > 0) {
            const newIndex = (currentIndex - 1 + suggestions.length) % suggestions.length;
            this.focusedMentionIndex.set(newIndex);
            // Announce focused mention to screen readers
            // @see Requirements 14.3
            const focusedSuggestion = suggestions[newIndex];
            this.announceFocusedMention(focusedSuggestion.name, newIndex + 1, suggestions.length);
          }
          return;

        case 'Enter':
          // Select the currently focused mention suggestion
          if (suggestions.length > 0 && currentIndex >= 0 && currentIndex < suggestions.length) {
            event.preventDefault();
            event.stopPropagation();
            this.selectMentionSuggestion(suggestions[currentIndex]);
          }
          return;
      }
    }

    // Handle Enter key based on enterKeyBehavior
    // Note: Arrow keys are NOT intercepted here - the editor handles native cursor movement
    if (event.key === 'Enter' && !event.shiftKey) {
      if (this.enterKeyBehavior === EnterKeyBehavior.SendMessage) {
        event.preventDefault();
        event.stopPropagation();
        this.handleSend();
      }
    }
  }

  /**
   * Destroy the rich text editor and clean up resources
   * @private
   */
  private destroyRichTextEditor(): void {
    if (this.customRichTextEditor) {
      this.richTextEditorService.destroyEditor(this.customRichTextEditor);
      this.customRichTextEditor = null;
      this.richTextEditorService.resetFormatState();
    }
  }

  /**
   * Handle rich text editor content update
   * @param html - The HTML content from the editor
   * @param text - The plain text content from the editor
   * @private
   */
  private handleRichTextUpdate(html: string, text: string): void {
    // Update the composer text signal with plain text
    this.composerText.set(text);

    // Emit text change event
    this.textChange.emit(text);

    // Update unique mention count and warning state
    // @see Requirements 6.1, 6.3
    this.updateMentionsCount();

    // Handle typing indicator
    if (!this.disableTypingEvents) {
      this.handleTypingStart();
    }

    // Check for mention trigger - use actual cursor position from editor
    if (!this.disableMentions && this.customRichTextEditor) {
      // Pass 0 as cursor position - the method will get actual position from editor state
      this.checkForMentionTrigger(text, 0);
    }
  }

  /**
   * Get rich text metadata from the editor
   * Used when sending messages with rich text formatting
   * @returns RichTextMetadata or undefined if editor not available
   * @see Requirements 18.13
   */
  getRichTextMetadata(): RichTextMetadata | undefined {
    if (!this.enableRichText) {
      return undefined;
    }

    if (this.customRichTextEditor) {
      return this.richTextEditorService.getRichTextMetadata(this.customRichTextEditor);
    }

    return undefined;
  }

  /**
   * Insert text into the rich text editor
   * @param text - Text to insert
   */
  insertTextIntoRichTextEditor(text: string): void {
    if (this.customRichTextEditor) {
      this.richTextEditorService.insertText(this.customRichTextEditor, text);
    }
  }

  /**
   * Clear the rich text editor content
   */
  clearRichTextEditorContent(): void {
    if (this.customRichTextEditor) {
      this.richTextEditorService.clearContent(this.customRichTextEditor);
    }
  }

  /**
   * Focus the rich text editor
   * Note: We don't force position to 'end' to let the editor handle click positioning natively.
   * This ensures the cursor is positioned at the click location, not forced to the end.
   * @see Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6
   */
  focusRichTextEditor(): void {
    if (this.customRichTextEditor) {
      // Use setTimeout to ensure focus happens after DOM updates
      setTimeout(() => {
        const editor = this.customRichTextEditor;
        if (editor) {
          const contentEditable = editor.getContentEditable();
          contentEditable.focus();

          // Move cursor to the end of the content
          // This is especially important for edit mode
          const selection = window.getSelection();
          const range = document.createRange();

          // Select all content and collapse to end
          range.selectNodeContents(contentEditable);
          range.collapse(false); // false = collapse to end

          if (selection) {
            selection.removeAllRanges();
            selection.addRange(range);
          }
        }
      }, 50);
    }
  }

  // ==================== Event Handlers ====================

  /**
   * Handle text input change
   * @param event - Input event from textarea
   * @see Requirements 3.6, 26.1
   */
  handleTextInput(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    const newText = target.value;
    this.composerText.set(newText);
    this.textChange.emit(newText);

    // Update cursor position
    this.cursorPosition.set(target.selectionStart || 0);

    // Handle typing indicator
    if (!this.disableTypingEvents) {
      this.handleTypingStart();
    }

    // Check for mention trigger
    if (!this.disableMentions) {
      this.checkForMentionTrigger(newText, target.selectionStart || 0);
    }

    // Update caret position on formatters after text input
    // @see Requirements 5.8
    this.updateFormatterCaretPosition();
  }

  /**
   * Handle keydown events in the text input
   * @param event - Keyboard event
   * @see Requirements 2.1, 2.2, 4.4, 4.5, 4.6, 27.2, 27.3, 27.10
   */
  handleKeydown(event: KeyboardEvent): void {
    // Handle Escape key - close popups first, then clear reply/edit preview
    // @see Requirements 4.4
    if (event.key === 'Escape') {
      // First check if any popup is open
      if (this.isAnyPopupOpen()) {
        this.closeAllPopups();
        return;
      }
      // If no popup is open, clear reply/edit preview if present
      if (this.isInQuotedReplyMode() || this.isInEditMode()) {
        event.preventDefault();
        this.handleClosePreview();
        return;
      }
      return;
    }

    // Handle rich text formatting shortcuts (Ctrl/Cmd+B/I/U)
    // @see Requirements 4.5, 4.6, 4.7
    if (this.enableRichText && this.handleFormattingShortcuts(event)) {
      return;
    }

    // Handle Tab key for focus navigation
    // @see Requirements 2.1, 2.2
    if (event.key === 'Tab') {
      // When mention suggestions are open, Tab selects the focused suggestion
      if (this.isMentionSuggestionsOpen()) {
        const suggestions = this.mentionSuggestions();
        const currentIndex = this.focusedMentionIndex();
        if (suggestions.length > 0 && currentIndex >= 0 && currentIndex < suggestions.length) {
          event.preventDefault();
          this.selectMentionSuggestion(suggestions[currentIndex]);
        }
        return;
      }

      // When mention suggestions are NOT open, allow Tab to move focus to next element
      // Don't prevent default - let the browser handle focus navigation naturally
      return;
    }

    // Handle keyboard navigation for mention suggestions
    // @see Requirements 27.10
    if (this.isMentionSuggestionsOpen()) {
      const suggestions = this.mentionSuggestions();
      const currentIndex = this.focusedMentionIndex();

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          // Move focus to next suggestion (wrap around)
          if (suggestions.length > 0) {
            const newIndex = (currentIndex + 1) % suggestions.length;
            this.focusedMentionIndex.set(newIndex);
            // Announce focused mention to screen readers
            // @see Requirements 14.3
            const focusedSuggestion = suggestions[newIndex];
            this.announceFocusedMention(focusedSuggestion.name, newIndex + 1, suggestions.length);
          }
          return;

        case 'ArrowUp':
          event.preventDefault();
          // Move focus to previous suggestion (wrap around)
          if (suggestions.length > 0) {
            const newIndex = (currentIndex - 1 + suggestions.length) % suggestions.length;
            this.focusedMentionIndex.set(newIndex);
            // Announce focused mention to screen readers
            // @see Requirements 14.3
            const focusedSuggestion = suggestions[newIndex];
            this.announceFocusedMention(focusedSuggestion.name, newIndex + 1, suggestions.length);
          }
          return;

        case 'Enter':
          // Select the currently focused mention suggestion
          if (suggestions.length > 0 && currentIndex >= 0 && currentIndex < suggestions.length) {
            event.preventDefault();
            this.selectMentionSuggestion(suggestions[currentIndex]);
          }
          return;
      }
    }

    // Handle Enter key based on enterKeyBehavior
    if (event.key === 'Enter') {
      if (event.shiftKey) {
        // Shift+Enter always inserts newline
        return;
      }

      if (this.enterKeyBehavior === EnterKeyBehavior.SendMessage) {
        event.preventDefault();
        this.handleSend();
      }
      // For NewLine and None, let the default behavior happen
    }

    // Forward keyboard event to formatters
    // @see Requirements 5.8
    this.forwardKeyEventToFormatters(event, 'keydown');

    // Update caret position on formatters
    // @see Requirements 5.8
    this.updateFormatterCaretPosition();
  }

  /**
   * Handle keyup events in the text input
   * Forwards keyup events to text formatters for pattern detection
   * @param event - Keyboard event
   * @see Requirements 5.8
   */
  handleKeyup(event: KeyboardEvent): void {
    // Forward keyboard event to formatters
    // @see Requirements 5.8
    this.forwardKeyEventToFormatters(event, 'keyup');

    // Update caret position on formatters after key release
    // @see Requirements 5.8
    this.updateFormatterCaretPosition();
  }

  /**
   * Handle send button click
   * Sends text message or edits existing message based on mode
   * Also handles sending attachments as separate media messages
   * @see Requirements 4.2, 4.7, 4.8, 15.5, 24.2
   */
  async handleSend(): Promise<void> {
    // Close the bubble menu if it's open
    this.closeBubbleMenu();

    // If recording is active, delegate to the media recorder's stop+send flow
    if (this.isRecording() && this.mediaRecorderRef) {
      this.mediaRecorderRef.handleInlineSend();
      return;
    }

    // Sync composerText signal from the editor before the canSend() check.
    // Inside block-level formatting (e.g. blockquote), cursor-restoration in
    // handleInput may run after emitUpdate, leaving the signal stale.
    // Reading fresh text here ensures canSend() reflects the actual content.
    if (this.customRichTextEditor) {
      const freshText = this.richTextEditorService.getText(this.customRichTextEditor);
      this.composerText.set(freshText);
    }

    // Check if we can send (has text or attachments)
    if (!this.canSend()) {
      return;
    }

    // Get the receiver (user or group)
    const receiver = this.getReceiver();
    if (!receiver) {
      console.warn('[CometChatMessageComposer] No receiver (user or group) specified');
      return;
    }

    try {
      // End typing indicator before sending
      // @see Requirements 11.6
      if (!this.disableTypingEvents) {
        // Clear the typing timeout to prevent double endTyping calls
        if (this.typingTimeout) {
          clearTimeout(this.typingTimeout);
          this.typingTimeout = undefined;
        }
        this.endTypingIndicator();
      }

      // Get text - always use the rich text editor when available
      // since it's the actual input mechanism regardless of enableRichText.
      // getTextWithMentionFormat converts mention nodes to SDK format (<@uid:{uid}>)
      // and when enableRichText is false, htmlToMarkdown still handles mentions correctly.
      let text: string;
      if (this.customRichTextEditor) {
        // Convert content to text with CometChat mention format (<@uid:{uid}>)
        text = this.richTextEditorService
          .getTextWithMentionFormat(this.customRichTextEditor)
          .trim();
      } else {
        text = this.composerText().trim();
      }

      const currentAttachments = this.attachments();

      // Check if in edit mode - handle both messageToEdit input and textMessageToEdit signal
      // @see Requirements 5.5, 5.6
      const editMessage = this.messageToEdit || this.textMessageToEdit();
      if (this.isInEditMode() && editMessage) {
        // Edit existing message
        await this.handleEditMessage(text, editMessage);
      } else {
        // Send new message(s)
        await this.handleSendNewMessage(receiver, text, currentAttachments);
      }
    } catch (error) {
      CometChatLogger.error('CometChatMessageComposer', 'Error during send:', error);
      this.emitError(error);
    }
  }

  /**
   * Handle editing an existing message
   * Emits ccMessageEdited with success on successful edit, error on failure
   * Clears edit state immediately when user initiates send (optimistic UI)
   * Shows toast notification on error
   * @param newText - The new text content for the message
   * @param messageToEdit - The message to edit (from input or signal)
   * @private
   * @see Requirements 3.6, 3.7, 5.5, 5.6, 6.1, 15.5, 28.11
   */
  private async handleEditMessage(
    newText: string,
    messageToEdit: CometChat.BaseMessage
  ): Promise<void> {
    if (!messageToEdit) {
      return;
    }

    // Clear edit state immediately (optimistic UI)
    // User expects the preview to close and input to clear as soon as they click send
    // @see Requirements 5.6
    this.textMessageToEdit.set(null);
    this.isEditMode.set(false);

    // Clear input immediately
    this.composerText.set('');

    // Emit textChange event for every text content change
    // @see Requirements 6.1
    this.textChange.emit('');

    // Clear editor content
    if (this.customRichTextEditor) {
      this.richTextEditorService.clearContent(this.customRichTextEditor);
    }

    // Clear original text since we're proceeding with edit
    this.originalTextBeforeEdit = '';

    // Emit closePreview event to notify parent components immediately
    // @see Requirements 5.6
    this.closePreview.emit();

    try {
      const editedMessage = await this.messageComposerService.editMessage(messageToEdit, newText);

      if (editedMessage) {
        // Emit ccMessageEdited with success status
        // @see Requirements 3.6
        CometChatMessageEvents.ccMessageEdited.next({
          message: editedMessage,
          status: MessageStatus.success,
          parentMessageId: this.parentMessageId ?? null,
        });

        // Emit sendButtonClick event with the edited message
        this.sendButtonClick.emit(editedMessage);

        // Announce message sent to screen readers
        // @see Requirements 28.11
        this.announceMessageSent();

        // Play sound if not disabled
        this.playOutgoingMessageSound();
      }
    } catch (error) {
      // Emit ccMessageEdited with error status
      // @see Requirements 3.7
      CometChatMessageEvents.ccMessageEdited.next({
        message: messageToEdit,
        status: MessageStatus.error,
        parentMessageId: this.parentMessageId ?? null,
      });

      // Emit error event
      this.emitError(error);

      CometChatLogger.error('CometChatMessageComposer', 'Error editing message:', error);
    }
  }

  /**
   * Handle sending new message(s)
   * Sends text message first (if any), then attachments as separate media messages
   * Supports both parentMessageId (threaded replies) and messageToReply (quoted replies) simultaneously
   * Emits ccMessageSent events with inprogress, success, or error status
   * @param receiver - The user or group to send to
   * @param text - The text content to send
   * @param attachments - Array of attachments to send
   * @private
   * @see Requirements 4.2, 4.7, 4.8, 6.7, 28.11, 2.5, 2.6, 2.7, 2.8, 5.2, 5.10, 6.10
   */
  private async handleSendNewMessage(
    receiver: CometChat.User | CometChat.Group,
    text: string,
    attachments: AttachmentFile[]
  ): Promise<void> {
    let lastSentMessage: CometChat.BaseMessage | null = null;

    // Build metadata including mentions if present
    // NOTE: Must be called BEFORE clearComposer() since it reads from composerText()
    const metadata = this.buildMessageMetadata();

    // Extract mentioned users BEFORE clearing composer
    const mentionedUsers = this.extractMentionedUsers();

    // Get the quoted message if in reply mode
    // NOTE: Must be saved BEFORE clearComposer() since it clears messageToReplySignal
    // @see Requirements 2.5, 2.6, 2.8
    const quotedMessage = this.messageToReplySignal() || undefined;

    // Send text message if there is text
    if (text.length > 0) {
      // Create the text message object for inprogress event
      // @see Requirements 6.10
      const receiverId =
        receiver instanceof CometChat.User ? receiver.getUid() : receiver.getGuid();
      const receiverType =
        receiver instanceof CometChat.User
          ? CometChat.RECEIVER_TYPE.USER
          : CometChat.RECEIVER_TYPE.GROUP;

      const pendingTextMessage = new CometChat.TextMessage(receiverId, text, receiverType);

      if (metadata) {
        pendingTextMessage.setMetadata(metadata);
      }
      if (this.parentMessageId) {
        pendingTextMessage.setParentMessageId(this.parentMessageId);
      }
      if (quotedMessage) {
        pendingTextMessage.setQuotedMessage(quotedMessage);
        pendingTextMessage.setQuotedMessageId(quotedMessage.getId());
      }
      // Set mentioned users on the message
      if (mentionedUsers.length > 0) {
        pendingTextMessage.setMentionedUsers(mentionedUsers);
      }

      pendingTextMessage.setMuid(CometChatUIKitUtility.ID());
      pendingTextMessage.setSentAt(CometChatUIKitUtility.getUnixTimestamp());

      // Emit ccMessageSent with inprogress status before sending
      // @see Requirements 6.10, 4.3
      CometChatMessageEvents.ccMessageSent.next({
        message: pendingTextMessage,
        status: MessageStatus.inprogress,
      });

      // Clear composer immediately after emitting inprogress (optimistic UI)
      // This allows the user to start typing their next message immediately
      // @see Requirements 4.1, 4.2, 4.3, 4.6
      this.clearComposer();

      // Reset mentions formatter after clearing
      // @see Requirements 5.10
      this.resetMentionsFormatter();

      try {
        const textMessage = await this.messageComposerService.sendTextMessage(
          receiver,
          text,
          metadata,
          this.parentMessageId,
          quotedMessage,
          pendingTextMessage
        );

        if (textMessage) {
          // Apply text formatters to the message for any post-send processing
          // Note: Formatters with formatMessageForSending can modify the message
          // @see Requirements 5.2, 5.10
          this.applyTextFormatters(textMessage);

          lastSentMessage = textMessage;

          // Emit ccMessageSent with success status after successful send
          // @see Requirements 6.10
          CometChatMessageEvents.ccMessageSent.next({
            message: textMessage,
            status: MessageStatus.success,
          });
        } else {
          // Emit ccMessageSent with error status on failure
          // @see Requirements 6.10
          CometChatMessageEvents.ccMessageSent.next({
            message: pendingTextMessage,
            status: MessageStatus.error,
          });
        }
      } catch (error) {
        // Emit ccMessageSent with error status on exception
        // @see Requirements 6.10
        CometChatMessageEvents.ccMessageSent.next({
          message: pendingTextMessage,
          status: MessageStatus.error,
        });

        // Emit error output for SDK errors
        // @see Requirements 6.3
        this.emitError(error);
        throw error;
      }
    }

    // Send each attachment as a separate media message
    // Requirements 6.7: When send is clicked with multiple attachments, send each as a separate message
    // @see Requirements 12.7: Media messages should include quotedMessage if in quoted reply mode
    // Track if we've cleared the composer for media-only messages (no text)
    let composerClearedForMedia = false;

    for (const attachment of attachments) {
      const mediaType = this.getMediaMessageType(attachment.type);

      // Create the media message object for inprogress event
      // @see Requirements 6.10
      const receiverId =
        receiver instanceof CometChat.User ? receiver.getUid() : receiver.getGuid();
      const receiverType =
        receiver instanceof CometChat.User
          ? CometChat.RECEIVER_TYPE.USER
          : CometChat.RECEIVER_TYPE.GROUP;

      const pendingMediaMessage = new CometChat.MediaMessage(
        receiverId,
        attachment.file,
        mediaType,
        receiverType
      );

      if (this.parentMessageId) {
        pendingMediaMessage.setParentMessageId(this.parentMessageId);
      }
      if (quotedMessage) {
        pendingMediaMessage.setQuotedMessage(quotedMessage);
        pendingMediaMessage.setQuotedMessageId(quotedMessage.getId());
      }
      pendingMediaMessage.setMuid(CometChatUIKitUtility.ID());
      pendingMediaMessage.setSentAt(CometChatUIKitUtility.getUnixTimestamp());

      // Emit ccMessageSent with inprogress status before sending
      // @see Requirements 6.10
      CometChatMessageEvents.ccMessageSent.next({
        message: pendingMediaMessage,
        status: MessageStatus.inprogress,
      });

      // For media-only messages (no text), clear composer immediately after emitting
      // the FIRST inprogress event. This allows users to start composing their next
      // message without waiting for uploads to complete (optimistic UI).
      // @see Requirements 4.1, 4.2
      if (text.length === 0 && !composerClearedForMedia) {
        this.clearComposer();
        this.resetMentionsFormatter();
        composerClearedForMedia = true;
      }

      try {
        const mediaMessage = await this.messageComposerService.sendMediaMessage(
          receiver,
          attachment.file,
          mediaType,
          undefined,
          this.parentMessageId,
          quotedMessage,
          pendingMediaMessage
        );

        if (mediaMessage) {
          lastSentMessage = mediaMessage;

          // Emit ccMessageSent with success status after successful send
          // @see Requirements 6.10
          CometChatMessageEvents.ccMessageSent.next({
            message: mediaMessage,
            status: MessageStatus.success,
          });
        } else {
          // Emit ccMessageSent with error status on failure
          // @see Requirements 6.10
          CometChatMessageEvents.ccMessageSent.next({
            message: pendingMediaMessage,
            status: MessageStatus.error,
          });
        }
      } catch (error) {
        // Emit ccMessageSent with error status on exception
        // @see Requirements 6.10
        CometChatMessageEvents.ccMessageSent.next({
          message: pendingMediaMessage,
          status: MessageStatus.error,
        });

        // Emit error output for SDK errors
        // @see Requirements 6.3
        this.emitError(error);
        // Continue with other attachments even if one fails
        CometChatLogger.error('CometChatMessageComposer', 'Error sending media message:', error);
      }

      // Clean up thumbnail URL if it exists
      if (attachment.thumbnailUrl) {
        URL.revokeObjectURL(attachment.thumbnailUrl);
      }
    }

    // Note: Composer is already cleared immediately after emitting inprogress:
    // - For text messages: cleared after text message inprogress event
    // - For media-only messages: cleared after FIRST media message inprogress event
    // This allows users to start composing their next message without waiting for uploads.
    // @see Requirements 4.1, 4.2

    // Emit ccReplyToMessage event after successful send if in reply mode
    // @see Requirements 2.7
    if (quotedMessage && lastSentMessage) {
      // Note: exitReplyMode() was already called by clearComposer()
      // Emit ccReplyToMessage with success status
      CometChatMessageEvents.ccReplyToMessage.next({
        message: lastSentMessage,
        status: MessageStatus.success,
      });
    }

    // Emit sendButtonClick event with the last sent message
    // Requirements 4.8: When a message is sent, emit sendButtonClick event
    if (lastSentMessage) {
      this.sendButtonClick.emit(lastSentMessage);

      // Announce message sent to screen readers
      // @see Requirements 28.11
      this.announceMessageSent();
    }

    // Play sound if not disabled
    // Requirements 24.2: When message is sent, play send sound
    this.playOutgoingMessageSound();
  }

  /**
   * Build metadata for the message including mentions and rich text
   * @returns Metadata object or undefined if no metadata
   * @private
   * @see Requirements 16.7, 18.13
   */
  private buildMessageMetadata(): Record<string, unknown> | undefined {
    // Note: We do NOT send any formatting metadata
    // All formatting (rich text, mentions) is converted to Markdown in the plain text
    // and will be processed by formatters on the receiving side
    //
    // Benefits:
    // 1. Simple: Single rendering path (formatters always run)
    // 2. Consistent: Mentions always get proper CSS classes
    // 3. Flexible: Custom formatters always work
    // 4. Human-readable: Markdown is readable in plain text
    //
    // The message text already contains:
    // - SDK mention format: <@uid:123> or <@all:label>
    // - Markdown formatting: **bold**, *italic*, etc.
    //
    // Formatters on receiving side will convert these to HTML

    // Return undefined (no metadata needed for formatting)
    return undefined;
  }

  /**
   * Extract mentioned users from the rich text editor content
   * @returns Array of mentioned CometChat.User objects
   * @private
   */
  private extractMentionedUsers(): CometChat.User[] {
    if (this.disableMentions) {
      return [];
    }

    const mentionedUsers: CometChat.User[] = [];
    const addedUids = new Set<string>();

    // Build user map from both suggestions AND the persistent mentionedUsersMap
    const userMap = new Map<string, CometChat.User>();

    // First, add users from the persistent map (users that were mentioned)
    this.mentionedUsersMap.forEach((user, uid) => {
      userMap.set(uid, user);
    });

    // Then, add users from current suggestions (may include additional users)
    const suggestions = this.mentionSuggestions();
    suggestions.forEach(suggestion => {
      if (suggestion.entity && suggestion.entity instanceof CometChat.User) {
        userMap.set(suggestion.uid, suggestion.entity);
      }
    });

    // Collect UIDs from different sources
    const uids = new Set<string>();

    if (this.customRichTextEditor) {
      // Extract UIDs from rich text editor mention nodes
      const editorUids = this.richTextEditorService.getUniqueMentionUids(this.customRichTextEditor);
      editorUids.forEach(uid => uids.add(uid));
    } else {
      // Plain text mode - use tracked UIDs
      this.plainTextMentionUids.forEach(uid => uids.add(uid));
    }

    // Also extract UIDs from the text itself (SDK format: <@uid:123>)
    // This ensures we catch all mentions even if they're not in suggestions anymore
    const text = this.composerText();
    const sdkMentionRegex = /<@uid:([^>]+)>/g;
    let match;
    while ((match = sdkMentionRegex.exec(text)) !== null) {
      uids.add(match[1]);
    }

    // Build mentioned users array with minimal user objects
    uids.forEach(uid => {
      if (!addedUids.has(uid)) {
        const user = userMap.get(uid);
        if (user) {
          // Create minimal user object with only uid and name
          const minimalUser = new CometChat.User({
            uid: user.getUid(),
            name: user.getName(),
          });
          mentionedUsers.push(minimalUser);
          addedUids.add(uid);
        }
      }
    });

    return mentionedUsers;
  }

  /**
   * Get the CometChat message type for a file type
   * @param fileType - The file type category
   * @returns CometChat message type string
   * @private
   */
  private getMediaMessageType(fileType: 'image' | 'video' | 'audio' | 'file'): string {
    switch (fileType) {
      case 'image':
        return CometChat.MESSAGE_TYPE.IMAGE;
      case 'video':
        return CometChat.MESSAGE_TYPE.VIDEO;
      case 'audio':
        return CometChat.MESSAGE_TYPE.AUDIO;
      case 'file':
      default:
        return CometChat.MESSAGE_TYPE.FILE;
    }
  }

  /**
   * Play outgoing message sound notification
   *
   * Called after successful message sends (text, media, sticker, voice recording).
   * Uses CometChatSoundManager to play the outgoing message sound.
   * Respects disableSoundForMessage input and customSoundForMessage configuration.
   *
   * @private
   * @see Requirements 7.1 - Play outgoing message sound on successful send
   * @see Requirements 7.2 - Respect disableSoundForMessage input
   * @see Requirements 7.3 - Use customSoundForMessage when provided
   * @see Requirements 7.5 - Play sound on sticker send
   * @see Requirements 7.6 - Play sound on media message send
   * @see Requirements 7.7 - Handle sound playback errors gracefully
   */
  private playOutgoingMessageSound(): void {
    // Check if sound is disabled
    // @see Requirements 7.2
    if (this.effectiveDisableSoundForMessage()) {
      return;
    }

    try {
      // Play outgoing message sound using CometChatSoundManager
      // Uses customSoundForMessage if provided, otherwise plays default sound
      // @see Requirements 7.1, 7.3, 7.4
      CometChatSoundManager.play(
        CometChatSoundManager.Sound.outgoingMessage!,
        this.effectiveCustomSoundForMessage() || null
      );
    } catch (error) {
      // Log but don't propagate - sound is non-critical
      // @see Requirements 7.7
      CometChatLogger.error(
        'CometChatMessageComposer',
        'Error playing outgoing message sound:',
        error
      );
    }
  }

  /**
   * Apply text formatters to a message before sending
   * Chains formatter outputs - output of one formatter is input to next
   * @param message - The message to format
   * @returns The formatted message
   * @private
   * @see Requirements 5.2, 5.10
   */
  private applyTextFormatters<T extends CometChat.TextMessage>(message: T): T {
    let formattedMessage = message;

    for (const formatter of this.textFormatterArray()) {
      // Apply formatMessageForSending if the method exists
      // Not all formatters may have this method, so we check dynamically
      const formatterWithMethod = formatter as unknown as {
        formatMessageForSending?: <M extends CometChat.TextMessage>(msg: M) => M;
      };
      if (typeof formatterWithMethod.formatMessageForSending === 'function') {
        formattedMessage = formatterWithMethod.formatMessageForSending(formattedMessage);
      }
    }

    return formattedMessage;
  }

  /**
   * Reset the mentions formatter after sending a message
   * Clears the stored mentioned users/members
   * @private
   * @see Requirements 5.10
   */
  private resetMentionsFormatter(): void {
    const formatter = this.mentionsFormatter();
    if (formatter) {
      // Reset the formatter state (clears mentions, original text, formatted text)
      formatter.reset();
    }
  }

  /**
   * Handle attachment button click
   * Uses toggleAttachmentMenu for consistent popover state management
   * @see Requirements 5.1, 5.2, 1.2, 1.8
   */
  handleAttachmentButtonClick(): void {
    this.toggleAttachmentMenu();
  }

  /**
   * Handle attachment option click from the action sheet.
   * Sets the appropriate file type filter on the hidden file input and triggers it.
   * @param optionId - The ID of the selected attachment option
   * @see Requirements 5.2, 5.3, 5.4, 5.5, 5.6
   */
  handleAttachmentOptionClick(optionId: string): void {
    // Close the attachment menu popover
    this.contentToDisplay.set('none');
    this.syncLegacyPopoverSignals();

    // Get the file input element
    const fileInput = this.fileInputRef?.nativeElement;
    if (!fileInput) {
      console.warn('[CometChatMessageComposer] File input element not found');
      return;
    }

    // Set the appropriate accept type based on the option
    switch (optionId) {
      case 'image':
        fileInput.accept = 'image/*';
        fileInput.click();
        break;
      case 'video':
        fileInput.accept = 'video/*';
        fileInput.click();
        break;
      case 'audio':
        fileInput.accept = 'audio/*';
        fileInput.click();
        break;
      case 'file':
        fileInput.accept = '*/*';
        fileInput.click();
        break;
      case 'polls':
        // Open the CreatePoll modal
        this.openPollModal();
        break;
      case 'collaborative-document':
        // Create collaborative document via extension API
        // @see Requirements 4.2
        this.createCollaborativeDocument();
        break;
      case 'collaborative-whiteboard':
        // Create collaborative whiteboard via extension API
        // @see Requirements 5.2
        this.createCollaborativeWhiteboard();
        break;
      default:
        // For custom options, the onClick handler should be called by the action sheet
        break;
    }
  }

  /**
   * Handle action sheet item click.
   * Called when an item in the attachment action sheet is clicked.
   * Closes the action sheet immediately, then executes the action's onClick handler.
   * @param action - The action that was clicked
   * @see Requirements 5.2
   */
  /**
   * Handle action sheet item click.
   * Called when an item in the attachment action sheet is clicked.
   * Closes the action sheet by triggering the attachment button click, then executes the action's onClick handler.
   * @param action - The action that was clicked
   * @see Requirements 5.2
   */
  handleActionSheetItemClick(action: CometChatMessageComposerAction | CometChatActionsView): void {
    // Close the popover by programmatically clicking the attachment button
    // This is necessary because the popover manages its own open/close state
    const attachmentButton = this.attachmentButtonRef?.nativeElement;
    if (attachmentButton) {
      attachmentButton.click();
    }

    // Execute the action's onClick handler after closing
    if ('onClick' in action && action.onClick) {
      action.onClick();
    }
  }

  /**
   * Handle action sheet close.
   * Called when the action sheet requests to be closed (e.g., Escape key).
   * Updates both legacy signal and contentToDisplay for proper popover state management.
   * @see Requirements 1.6, 1.7
   */
  handleActionSheetClose(): void {
    this.contentToDisplay.set('none');
    this.syncLegacyPopoverSignals();
  }

  /**
   * Handle emoji button click
   * Uses toggleEmojiKeyboard for consistent popover state management
   * @see Requirements 10.1, 10.2, 1.1, 1.8
   */
  handleEmojiButtonClick(): void {
    this.toggleEmojiKeyboard();
  }

  /**
   * Handle emoji selection from the emoji keyboard
   * Inserts the selected emoji at the current cursor position
   * @param emoji - The emoji character to insert
   * @see Requirements 10.2, 10.3, 10.5
   */
  handleEmojiSelect(emoji: string): void {
    // Insert into rich text editor (always used as input)
    if (this.customRichTextEditor) {
      this.insertTextIntoRichTextEditor(emoji);
      // Close emoji keyboard after selection
      this.contentToDisplay.set('none');
      this.syncLegacyPopoverSignals();
      // insertText() already handles focus and cursor positioning (including Safari),
      // so we don't call focusRichTextEditor() which would move cursor to end.
      return;
    }

    // Insert emoji at cursor position (plain text mode)
    const newCursorPosition = this.insertTextAtCursor(emoji);

    // Update cursor position signal
    this.cursorPosition.set(newCursorPosition);

    // Emit text change event
    this.textChange.emit(this.composerText());

    // Close emoji keyboard after selection (configurable behavior - default is to close)
    this.contentToDisplay.set('none');
    this.syncLegacyPopoverSignals();

    // Focus back on the text input
    this.focusTextInput();
  }

  /**
   * Handle emoji keyboard close event
   * Called when the emoji keyboard requests to be closed (e.g., Escape key)
   * @see Requirements 10.5, 27.11
   */
  handleEmojiKeyboardClose(): void {
    this.isEmojiKeyboardOpen.set(false);
    this.contentToDisplay.set('none');
    this.syncLegacyPopoverSignals();
    // Focus back on the appropriate input
    if (this.customRichTextEditor) {
      this.focusRichTextEditor();
    } else {
      this.focusTextInput();
    }
  }

  /**
   * Programmatically closes all open CometChatPopoverComponent instances.
   * Uses closePopover() which emits popoverClosed events.
   * Called from closeAllPopups() to ensure popover DOM state is in sync.
   */
  private closeAllPopoverInstances(): void {
    this.popoverInstances?.forEach(popover => {
      if (popover.isOpen) {
        popover.closePopover();
      }
    });
  }

  /**
   * Handle emoji popover opened event from CometChatPopoverComponent
   * Called when the popover is opened via click
   * Closes other popovers first, then sets the contentToDisplay state
   * @see Requirements 1.2, 1.8, 1.9
   */
  onEmojiPopoverOpened(): void {
    this.contentToDisplay.set('emojiKeyboard');
    this.syncLegacyPopoverSignals();
  }

  /**
   * Handle emoji popover closed event from CometChatPopoverComponent
   * Called when the popover is closed via outside click, Escape key, or programmatically
   * Resets the contentToDisplay state and returns focus to the trigger button
   * @see Requirements 1.6, 1.7, 1.10, 15.8
   */
  onEmojiPopoverClosed(): void {
    this.contentToDisplay.set('none');
    this.syncLegacyPopoverSignals();
    // Return focus to the emoji button as a fallback
    // The popover component handles this automatically, but we ensure it here for reliability
    this.focusEmojiButton();
  }

  /**
   * Handle attachment popover opened event from CometChatPopoverComponent
   * Called when the popover is opened via click
   * Sets the contentToDisplay state to track which popover is open
   * @see Requirements 1.1, 1.8, 1.9
   */
  onAttachmentPopoverOpened(): void {
    this.contentToDisplay.set('attachments');
    this.syncLegacyPopoverSignals();
  }

  /**
   * Handle attachment popover closed event from CometChatPopoverComponent
   * Called when the popover is closed via outside click, Escape key, or programmatically
   * Resets the contentToDisplay state and returns focus to the trigger button
   * @see Requirements 1.6, 1.7, 1.10, 15.8
   */
  onAttachmentPopoverClosed(): void {
    this.contentToDisplay.set('none');
    this.syncLegacyPopoverSignals();
    // Return focus to the attachment button as a fallback
    // The popover component handles this automatically, but we ensure it here for reliability
    this.focusAttachmentButton();
  }

  /**
   * Handle voice recorder popover opened event from CometChatPopoverComponent
   * @deprecated Voice recorder now uses inline mode instead of popover.
   * Kept for backward compatibility.
   * @see Requirements 1.3, 1.8, 1.9
   */
  onVoiceRecorderPopoverOpened(): void {
    this.contentToDisplay.set('voiceRecording');
    this.isRecording.set(true);
    this.syncLegacyPopoverSignals();
  }

  /**
   * Handle voice recorder popover closed event from CometChatPopoverComponent
   * @deprecated Voice recorder now uses inline mode instead of popover.
   * Kept for backward compatibility.
   * @see Requirements 1.3, 1.6, 1.7, 1.10, 15.8
   */
  onVoiceRecorderPopoverClosed(): void {
    // Cancel recording if in progress when popover closes
    if (this.isRecording()) {
      this.isRecording.set(false);
      this.recordingDuration.set(0);
      // Announce recording stopped to screen readers
      this.announceRecordingStopped();
    }
    this.contentToDisplay.set('none');
    this.syncLegacyPopoverSignals();
  }

  /**
   * Handle stickers popover opened event from CometChatPopoverComponent
   * Called when the popover is opened via click
   * Sets the contentToDisplay state to track which popover is open
   * @see Requirements 1.4, 1.8, 1.9
   */
  onStickersPopoverOpened(): void {
    this.contentToDisplay.set('stickers');
    this.syncLegacyPopoverSignals();
  }

  /**
   * Handle stickers popover closed event from CometChatPopoverComponent
   * Called when the popover is closed via outside click, Escape key, or programmatically
   * Resets the contentToDisplay state and returns focus to the trigger button
   * @see Requirements 1.4, 1.6, 1.7, 1.10, 15.8
   */
  onStickersPopoverClosed(): void {
    this.contentToDisplay.set('none');
    this.syncLegacyPopoverSignals();
    // Return focus to the stickers button as a fallback
    // The popover component handles this automatically, but we ensure it here for reliability
    this.focusStickersButton();
  }

  /**
   * Handle sticker selection from the stickers keyboard
   * Closes the keyboard and sends the sticker message
   * @param event - The sticker click event containing sticker URL and name
   * @see Requirements 8.7
   */
  async handleStickerSelect(event: StickerClickEvent): Promise<void> {
    // Close the stickers keyboard via contentToDisplay signal
    this.contentToDisplay.set('none');
    this.syncLegacyPopoverSignals();

    // Get the receiver (user or group)
    const receiver = this.getReceiver();
    if (!receiver) {
      console.warn(
        '[CometChatMessageComposer] No receiver (user or group) specified for sticker message'
      );
      return;
    }

    try {
      // Send sticker message via service
      await this.sendStickerMessage(receiver, event.stickerUrl, event.stickerName);
    } catch (error) {
      CometChatLogger.error('CometChatMessageComposer', 'Error sending sticker message:', error);
      this.emitError(error);
    }
  }

  /**
   * Handle stickers keyboard close event
   * Called when the stickers keyboard requests to be closed (e.g., Escape key)
   * @see Requirements 8.3
   */
  handleStickersKeyboardClose(): void {
    this.contentToDisplay.set('none');
    this.syncLegacyPopoverSignals();
    // Focus back on the appropriate input
    if (this.customRichTextEditor) {
      this.focusRichTextEditor();
    } else {
      this.focusTextInput();
    }
  }

  /**
   * Send a sticker message
   * Supports quoted replies if in reply mode
   * Emits ccMessageSent events with inprogress, success, or error status
   * @param receiver - The user or group to send the sticker to
   * @param stickerUrl - URL of the sticker image
   * @param stickerName - Name of the sticker
   * @private
   * @see Requirements 8.7, 12.7, 6.10
   */
  private async sendStickerMessage(
    receiver: CometChat.User | CometChat.Group,
    stickerUrl: string,
    stickerName: string
  ): Promise<void> {
    // Get the quoted message if in reply mode
    const quotedMessage = this.messageToReplySignal() || undefined;

    // Create the sticker message object for inprogress event
    // @see Requirements 6.10
    const receiverId = receiver instanceof CometChat.User ? receiver.getUid() : receiver.getGuid();
    const receiverType =
      receiver instanceof CometChat.User
        ? CometChat.RECEIVER_TYPE.USER
        : CometChat.RECEIVER_TYPE.GROUP;

    // Create sticker message metadata following CometChat sticker extension format
    const customData = {
      sticker_url: stickerUrl,
      sticker_name: stickerName,
    };

    // Create pending custom message for sticker
    const pendingStickerMessage = new CometChat.CustomMessage(
      receiverId,
      receiverType,
      'extension_sticker',
      customData
    );
    pendingStickerMessage.setMuid(CometChatUIKitUtility.ID());
    pendingStickerMessage.setSentAt(CometChatUIKitUtility.getUnixTimestamp());

    if (this.parentMessageId) {
      pendingStickerMessage.setParentMessageId(this.parentMessageId);
    }
    if (quotedMessage) {
      pendingStickerMessage.setQuotedMessage(quotedMessage);
      pendingStickerMessage.setQuotedMessageId(quotedMessage.getId());
    }

    // Emit ccMessageSent with inprogress status before sending
    // @see Requirements 6.10
    CometChatMessageEvents.ccMessageSent.next({
      message: pendingStickerMessage,
      status: MessageStatus.inprogress,
    });

    try {
      // Send sticker message via service
      const sentMessage = await this.messageComposerService.sendStickerMessage(
        receiver,
        stickerUrl,
        stickerName,
        this.parentMessageId,
        quotedMessage,
        pendingStickerMessage
      );

      if (sentMessage) {
        // Emit ccMessageSent with success status after successful send
        // @see Requirements 6.10
        CometChatMessageEvents.ccMessageSent.next({
          message: sentMessage,
          status: MessageStatus.success,
        });

        // Clear reply mode after successful send and emit ccReplyToMessage event
        // @see Requirements 2.7
        if (quotedMessage) {
          this.exitReplyMode();
          CometChatMessageEvents.ccReplyToMessage.next({
            message: sentMessage,
            status: MessageStatus.success,
          });
        }

        // Emit sendButtonClick event with the sent message
        this.sendButtonClick.emit(sentMessage);

        // Announce message sent to screen readers
        this.announceMessageSent();

        // Play sound notification if not disabled
        this.playOutgoingMessageSound();
      } else {
        // Emit ccMessageSent with error status on failure
        // @see Requirements 6.10
        CometChatMessageEvents.ccMessageSent.next({
          message: pendingStickerMessage,
          status: MessageStatus.error,
        });
      }
    } catch (error) {
      // Emit ccMessageSent with error status on exception
      // @see Requirements 6.10
      CometChatMessageEvents.ccMessageSent.next({
        message: pendingStickerMessage,
        status: MessageStatus.error,
      });
      // Emit error output for SDK errors
      // @see Requirements 6.3
      this.emitError(error);
      throw error;
    }
  }

  // ==================== Fullscreen Viewer Methods ====================

  /**
   * Handle attachment click to open fullscreen viewer
   * @param attachment - The attachment that was clicked
   * @param index - Index of the attachment in the list
   * @see Requirements 11.1
   */
  handleAttachmentClick(attachment: AttachmentFile, index: number): void {
    // Only open fullscreen for images and videos
    if (attachment.type === 'image' || attachment.type === 'video') {
      this.fullscreenViewerIndex.set(index);
      this.isFullscreenViewerOpen.set(true);
    }
  }

  /**
   * Handle fullscreen viewer close
   * @see Requirements 11.6
   */
  handleFullscreenViewerClose(): void {
    this.isFullscreenViewerOpen.set(false);
  }

  /**
   * Navigate to previous attachment in fullscreen viewer
   * @see Requirements 11.4
   */
  handleFullscreenViewerPrevious(): void {
    const currentIndex = this.fullscreenViewerIndex();
    const attachmentsList = this.attachments();
    if (currentIndex > 0) {
      this.fullscreenViewerIndex.set(currentIndex - 1);
    } else {
      // Wrap to last attachment
      this.fullscreenViewerIndex.set(attachmentsList.length - 1);
    }
  }

  /**
   * Navigate to next attachment in fullscreen viewer
   * @see Requirements 11.4
   */
  handleFullscreenViewerNext(): void {
    const currentIndex = this.fullscreenViewerIndex();
    const attachmentsList = this.attachments();
    if (currentIndex < attachmentsList.length - 1) {
      this.fullscreenViewerIndex.set(currentIndex + 1);
    } else {
      // Wrap to first attachment
      this.fullscreenViewerIndex.set(0);
    }
  }

  /**
   * Get the current attachment for fullscreen viewer
   * @returns The current attachment or undefined
   */
  getCurrentFullscreenAttachment(): AttachmentFile | undefined {
    const attachmentsList = this.attachments();
    const index = this.fullscreenViewerIndex();
    return attachmentsList[index];
  }

  /**
   * Insert text at the current cursor position
   * @param textToInsert - The text to insert at cursor position
   * @returns The new cursor position after insertion
   * @see Requirements 10.3, 3.9
   */
  insertTextAtCursor(textToInsert: string): number {
    const currentText = this.composerText();
    const currentCursorPos = this.cursorPosition();

    // Ensure cursor position is within bounds
    const safePosition = Math.min(Math.max(0, currentCursorPos), currentText.length);

    // Split text at cursor position and insert new text
    const textBefore = currentText.substring(0, safePosition);
    const textAfter = currentText.substring(safePosition);
    const newText = textBefore + textToInsert + textAfter;

    // Update composer text
    this.composerText.set(newText);

    // Calculate new cursor position (after the inserted text)
    const newCursorPosition = safePosition + textToInsert.length;

    return newCursorPosition;
  }

  /**
   * Focus the text input element and set cursor position
   * @private
   */
  private focusTextInput(): void {
    const textInput = this.textInputRef?.nativeElement;
    if (textInput) {
      // Use setTimeout with longer delay to ensure focus happens after DOM updates
      // Increased from 0ms to 50ms for more reliable focusing
      setTimeout(() => {
        textInput.focus();
        // Set cursor position to the end of the text
        // This is especially important for edit mode
        const textLength = textInput.value.length;
        textInput.setSelectionRange(textLength, textLength);
      }, 50);
    }
  }

  /**
   * Focus the attachment button element
   * Used to return focus when attachment popover closes
   * @private
   * @see Requirements 1.10, 15.8
   */
  private focusAttachmentButton(): void {
    const el = this.attachmentButtonRef?.nativeElement;
    if (el) {
      setTimeout(() => {
        const btn = el.querySelector('button') as HTMLButtonElement;
        (btn || el).focus();
      }, 0);
    }
  }

  /**
   * Focus the emoji button element
   * Used to return focus when emoji popover closes
   * @private
   * @see Requirements 1.10, 15.8
   */
  private focusEmojiButton(): void {
    const el = this.emojiButtonRef?.nativeElement;
    if (el) {
      setTimeout(() => {
        const btn = el.querySelector('button') as HTMLButtonElement;
        (btn || el).focus();
      }, 0);
    }
  }

  /**
   * Focus the stickers button element
   * Used to return focus when stickers popover closes
   * @private
   * @see Requirements 1.10, 15.8
   */
  private focusStickersButton(): void {
    const el = this.stickersButtonRef?.nativeElement;
    if (el) {
      setTimeout(() => {
        const btn = el.querySelector('button') as HTMLButtonElement;
        (btn || el).focus();
      }, 0);
    }
  }

  /**
   * Focus the voice recording button element
   * Used to return focus when voice recorder popover closes
   * @private
   * @see Requirements 1.10, 15.8
   */
  private focusVoiceButton(): void {
    const el = this.voiceButtonRef?.nativeElement;
    if (el) {
      setTimeout(() => {
        const btn = el.querySelector('button') as HTMLButtonElement;
        (btn || el).focus();
      }, 0);
    }
  }

  /**
   * Handle voice recording button click
   * Toggles the recording state and shows/hides the CometChatMediaRecorder
   * @see Requirements 11.1, 11.2, 28.10
   */
  handleVoiceRecordingClick(): void {
    // Toggle recording state
    const newRecordingState = !this.isRecording();
    this.isRecording.set(newRecordingState);

    // Announce recording state change to screen readers
    // @see Requirements 28.10
    if (newRecordingState) {
      this.announceRecordingStarted();
    } else {
      this.announceRecordingStopped();
    }

    // Close other popups when starting recording
    if (newRecordingState) {
      this.closeAllPopups();
    }

    // Reset recording duration when stopping
    if (!newRecordingState) {
      this.recordingDuration.set(0);
    }
  }

  /**
   * Start inline voice recording
   * Activates the inline media recorder by setting isRecording to true.
   * This hides the text input, attachment, emoji, and stickers buttons
   * and shows the inline media recorder in their place.
   * @see Requirements 4.1, 4.2
   */
  startInlineRecording(): void {
    // Close any open popovers first
    this.closeAllPopups();

    // Set recording state - this triggers the template to show the inline recorder
    this.isRecording.set(true);
    this.contentToDisplay.set('voiceRecording');
    this.syncLegacyPopoverSignals();

    // Announce recording started to screen readers
    this.announceRecordingStarted();

    // Close mention suggestions
    this.isMentionSuggestionsOpen.set(false);
  }

  /**
   * Toggles the fixed toolbar visibility
   * When enabled, shows the fixed toolbar and hides the floating bubble menu.
   * When disabled, hides the fixed toolbar and allows the floating bubble menu to appear on text selection.
   */
  toggleFixedToolbar(): void {
    // Toggle the fixed toolbar state
    const newState = !this.isFixedToolbarShown();
    this.isFixedToolbarShown.set(newState);

    // Track manual toggle: set true when opening, reset when closing
    // This prevents handleSelectionUpdate() from auto-closing on empty selection
    // @see Requirements 2.22 - Mobile toolbar stays open on manual toggle
    this.isFixedToolbarManuallyToggled.set(newState);

    // If enabling fixed toolbar, hide the bubble menu
    if (newState) {
      this.isBubbleMenuVisible.set(false);
      this.textSelection.set(null);
      this.bubbleMenuPosition.set(null);
    }

    // Emit toolbar toggle state for consumers

    // Focus the editor after toggle
    this.focusRichTextEditor();

    // Trigger change detection
    this.cdr.markForCheck();
  }

  /**
   * Handle recording complete event from CometChatMediaRecorder
   * Creates a File from the Blob and sends it as an audio message
   * Supports quoted replies if in reply mode
   * Emits ccMessageSent events with inprogress, success, or error status
   * @param audioBlob - The recorded audio Blob
   * @see Requirements 11.3, 1.3, 12.7, 6.10
   */
  async handleRecordingComplete(audioBlob: Blob): Promise<void> {
    // Reset recording state and restore normal composer
    this.isRecording.set(false);
    this.recordingDuration.set(0);
    this.contentToDisplay.set('none');
    this.syncLegacyPopoverSignals();

    // Get the receiver (user or group)
    const receiver = this.getReceiver();
    if (!receiver) {
      console.warn(
        '[CometChatMessageComposer] No receiver (user or group) specified for audio message'
      );
      return;
    }

    // Create a File from the Blob with a proper filename
    const timestamp = Date.now();
    const audioFile = new File([audioBlob], `voice_message_${timestamp}.webm`, {
      type: audioBlob.type || 'audio/webm',
    });

    // Get the quoted message if in reply mode
    // @see Requirements 12.7
    const quotedMessage = this.messageToReplySignal() || undefined;

    // Create the media message object for inprogress event
    // @see Requirements 6.10
    const receiverId = receiver instanceof CometChat.User ? receiver.getUid() : receiver.getGuid();
    const receiverType =
      receiver instanceof CometChat.User
        ? CometChat.RECEIVER_TYPE.USER
        : CometChat.RECEIVER_TYPE.GROUP;

    const pendingAudioMessage = new CometChat.MediaMessage(
      receiverId,
      audioFile,
      CometChat.MESSAGE_TYPE.AUDIO,
      receiverType
    );

    if (this.parentMessageId) {
      pendingAudioMessage.setParentMessageId(this.parentMessageId);
    }
    if (quotedMessage) {
      pendingAudioMessage.setQuotedMessage(quotedMessage);
      pendingAudioMessage.setQuotedMessageId(quotedMessage.getId());
    }

    // Set MUID and sentAt so the message list can match inprogress → success by MUID
    pendingAudioMessage.setMuid(CometChatUIKitUtility.ID());
    pendingAudioMessage.setSentAt(CometChatUIKitUtility.getUnixTimestamp());

    // Create a local blob URL so the audio bubble can render a player during inprogress
    const blobUrl = URL.createObjectURL(audioFile);
    const fileExtension = audioFile.name.split('.').pop() || '';
    const localAttachment = {
      url: blobUrl,
      name: audioFile.name,
      mimeType: audioFile.type,
      size: audioFile.size,
      extension: fileExtension,
      getUrl: () => blobUrl,
      getName: () => audioFile.name,
      getMimeType: () => audioFile.type,
      getSize: () => audioFile.size,
      getExtension: () => fileExtension,
    };
    (pendingAudioMessage as any).getAttachments = () => [localAttachment];

    // Emit ccMessageSent with inprogress status before sending
    // @see Requirements 6.10
    CometChatMessageEvents.ccMessageSent.next({
      message: pendingAudioMessage,
      status: MessageStatus.inprogress,
    });

    try {
      // Send as audio message via messageComposerService
      // Pass pendingAudioMessage so the SDK reuses the same MUID for matching
      const mediaMessage = await this.messageComposerService.sendMediaMessage(
        receiver,
        audioFile,
        CometChat.MESSAGE_TYPE.AUDIO,
        undefined,
        this.parentMessageId,
        quotedMessage,
        pendingAudioMessage
      );

      if (mediaMessage) {
        // Emit ccMessageSent with success status after successful send
        // @see Requirements 6.10
        CometChatMessageEvents.ccMessageSent.next({
          message: mediaMessage,
          status: MessageStatus.success,
        });

        // Clear reply mode after successful send and emit ccReplyToMessage event
        // @see Requirements 2.7
        if (quotedMessage) {
          this.exitReplyMode();
          CometChatMessageEvents.ccReplyToMessage.next({
            message: mediaMessage,
            status: MessageStatus.success,
          });
        }

        // Emit sendButtonClick event with the sent message
        this.sendButtonClick.emit(mediaMessage);

        // Play sound notification if not disabled
        // @see Requirements 11.3, 24.2
        this.playOutgoingMessageSound();
      } else {
        // Emit ccMessageSent with error status on failure
        // @see Requirements 6.10
        CometChatMessageEvents.ccMessageSent.next({
          message: pendingAudioMessage,
          status: MessageStatus.error,
        });
      }
    } catch (error) {
      // Emit ccMessageSent with error status on exception
      // @see Requirements 6.10
      CometChatMessageEvents.ccMessageSent.next({
        message: pendingAudioMessage,
        status: MessageStatus.error,
      });
      CometChatLogger.error('CometChatMessageComposer', 'Error sending audio message:', error);
      this.emitError(error);
    }

    // Clean up the blob URL to avoid memory leaks
    URL.revokeObjectURL(blobUrl);
  }

  /**
   * Handle recording cancel event from CometChatMediaRecorder
   * Resets the recording state and cleans up
   * @see Requirements 11.7, 28.10, 1.3
   */
  handleRecordingCancel(): void {
    // Reset recording state and restore normal composer
    this.isRecording.set(false);
    this.recordingDuration.set(0);
    this.contentToDisplay.set('none');
    this.syncLegacyPopoverSignals();

    // Announce recording stopped to screen readers
    // @see Requirements 28.10
    this.announceRecordingStopped();

    // Return focus to the text input
    if (this.enableRichText && this.customRichTextEditor) {
      this.focusRichTextEditor();
    } else {
      this.focusTextInput();
    }
  }

  /**
   * Handle recording error event from CometChatMediaRecorder
   * @param error - The recording error
   */
  handleRecordingError(error: Error): void {
    CometChatLogger.error('CometChatMessageComposer', 'Recording error:', error);
    this.isRecording.set(false);
    this.recordingDuration.set(0);
    this.contentToDisplay.set('none');
    this.syncLegacyPopoverSignals();
    this.emitError(error);

    // Announce error to screen readers
    this.announceRecordingStopped();

    // Return focus to the text input
    if (this.enableRichText && this.customRichTextEditor) {
      this.focusRichTextEditor();
    } else {
      this.focusTextInput();
    }
  }

  /**
   * Handle close preview button click (reply/edit mode)
   * For edit mode, emits ccMessageEdited with cancelled status
   * For reply mode, just clears the reply state
   * @see Requirements 3.4, 14.6, 14.7, 15.6, 15.7, 26.4
   */
  handleClosePreview(): void {
    // Check if in edit mode - use cancelEdit which emits cancelled event
    if (this.isInEditMode() && this.messageToEdit) {
      this.cancelEdit();
    } else if (this.isInQuotedReplyMode()) {
      // For reply mode, just exit and emit closePreview
      this.onReplyPreviewClose();
    } else {
      // Fallback - just emit closePreview
      this.closePreview.emit();
    }
  }

  /**
   * Close all open popups and return focus to the editor
   * Closes: emoji keyboard, stickers keyboard, attachment menu, mention suggestions,
   * voice recorder, and fullscreen viewer
   * @see Requirements 2.6, 14.9, 14.10, 27.11
   */
  closeAllPopups(): void {
    // Reset contentToDisplay to 'none' (closes all popovers)
    this.contentToDisplay.set('none');

    // Close all open popover component instances programmatically
    this.closeAllPopoverInstances();

    // Close all popup states (legacy signals for backward compatibility)
    this.isEmojiKeyboardOpen.set(false);
    this.isStickersKeyboardOpen.set(false);
    this.isAttachmentMenuOpen.set(false);
    this.isMentionSuggestionsOpen.set(false);
    this.messageComposerService.clearMentionSuggestions();

    // Close voice recorder if open
    // @see Requirements 14.9 - ALL popups SHALL be closable via Escape key
    if (this.isRecording()) {
      this.isRecording.set(false);
      this.recordingDuration.set(0);
    }

    // Close fullscreen viewer if open
    // @see Requirements 14.9 - ALL popups SHALL be closable via Escape key
    if (this.isFullscreenViewerOpen()) {
      this.isFullscreenViewerOpen.set(false);
    }

    // Return focus to the editor after closing popups without moving cursor
    // @see Requirements 2.6, 14.10 - Escape closes popups and returns focus
    if (this.enableRichText && this.customRichTextEditor) {
      this.customRichTextEditor.getContentEditable().focus();
    } else if (this.textInputRef?.nativeElement) {
      this.textInputRef.nativeElement.focus();
    }
  }

  /**
   * Check if any popup is currently open
   * Used to determine if Escape key should close popups
   * @returns true if any popup is open
   * @private
   */
  private isAnyPopupOpen(): boolean {
    return (
      this.isEmojiKeyboardOpen() ||
      this.isStickersKeyboardOpen() ||
      this.isAttachmentMenuOpen() ||
      this.isMentionSuggestionsOpen() ||
      this.isRecording() ||
      this.isFullscreenViewerOpen()
    );
  }

  /**
   * Handle rich text formatting keyboard shortcuts (Ctrl/Cmd+B/I/U)
   * @param event - Keyboard event
   * @returns true if the event was handled, false otherwise
   * @private
   * @see Requirements 4.5 - Ctrl/Cmd+B toggles bold
   * @see Requirements 4.6 - Ctrl/Cmd+I toggles italic
   * @see Requirements 4.7 - Ctrl/Cmd+U toggles underline
   */
  private handleFormattingShortcuts(event: KeyboardEvent): boolean {
    // Check for modifier key (Ctrl on Windows/Linux, Cmd on Mac)
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const modifierKey = isMac ? event.metaKey : event.ctrlKey;

    if (!modifierKey) {
      return false;
    }

    // Handle formatting shortcuts
    switch (event.key.toLowerCase()) {
      case 'b':
        // @see Requirements 4.5 - Ctrl/Cmd+B toggles bold
        event.preventDefault();
        event.stopPropagation();
        this.handleToolbarBold();
        return true;

      case 'i':
        // @see Requirements 4.6 - Ctrl/Cmd+I toggles italic
        event.preventDefault();
        event.stopPropagation();
        this.handleToolbarItalic();
        return true;

      case 'u':
        // @see Requirements 4.7 - Ctrl/Cmd+U toggles underline
        event.preventDefault();
        event.stopPropagation();
        this.handleToolbarUnderline();
        return true;

      default:
        return false;
    }
  }

  /**
   * Close the bubble menu and return focus to the editor
   * Called when Escape key is pressed while bubble menu is visible
   * @see Requirements 4.4
   */
  private closeBubbleMenu(): void {
    // For custom rich text editor, just clear the selection state
    if (this.customRichTextEditor) {
      // Return focus to the editor without moving cursor
      // @see Requirements 4.4 - Escape returns focus to editor
      this.customRichTextEditor.getContentEditable().focus();
    }

    // Update signals
    this.isBubbleMenuVisible.set(false);
    this.textSelection.set(null);

    // Trigger change detection
    this.cdr.markForCheck();
  }

  /**
   * Global Escape key handler for the component
   * Ensures all popups can be closed via Escape key regardless of focus location
   * Also handles closing the bubble menu when visible
   * @param event - Keyboard event
   * @see Requirements 14.9, 14.10, 4.4
   */
  @HostListener('keydown.escape', ['$event'])
  handleGlobalEscapeKey(event: Event): void {
    // Check if bubble menu is visible and close it first
    // @see Requirements 4.4 - Escape key closes bubble menu and returns focus to editor
    if (this.isBubbleMenuVisible()) {
      event.preventDefault();
      event.stopPropagation();
      this.closeBubbleMenu();
      return;
    }

    // Close fixed toolbar on Escape if it was manually toggled open
    // @see Requirements 2.22, 3.25 - Escape closes toolbar
    if (this.isFixedToolbarManuallyToggled() && this.isFixedToolbarShown()) {
      event.preventDefault();
      event.stopPropagation();
      this.isFixedToolbarShown.set(false);
      this.isFixedToolbarManuallyToggled.set(false);
      this.cdr.markForCheck();
      return;
    }

    // Handle other popups
    if (this.isAnyPopupOpen()) {
      event.preventDefault();
      event.stopPropagation();
      this.closeAllPopups();
    }
  }

  // ==================== Typing Indicator Methods ====================

  /**
   * Typing indicator debounce timeout in milliseconds
   * Used to determine when to call endTyping after user stops typing
   * @see Requirements 11.2, 11.8
   */
  private readonly TYPING_TIMEOUT_MS = 500;

  /**
   * Handle typing start - send typing indicator with proper debouncing
   *
   * Implements the typing indicator lifecycle:
   * - Calls startTyping on first keystroke (when no existing timeout)
   * - Debounces endTyping with 500ms timeout
   * - Clears and resets timeout on subsequent keystrokes
   *
   * Typing indicators are suppressed when:
   * - disableTypingEvents is true
   * - The user is blocked (either blocked by me or has blocked me)
   *
   * @private
   * @see Requirements 11.1, 11.2, 11.3, 11.5, 11.8
   */
  private handleTypingStart(): void {
    // Check if typing events are disabled
    // @see Requirements 11.3
    if (this.disableTypingEvents) {
      return;
    }

    const receiver = this.getReceiver();
    if (!receiver) {
      return;
    }

    // Check if user is blocked (only applicable for 1-on-1 conversations)
    // Don't send typing indicators if the user has blocked us or we have blocked them
    // @see Requirements 11.5
    if (this.currentUser()?.getBlockedByMe() || this.currentUser()?.getHasBlockedMe()) {
      return;
    }

    // Clear existing timeout if any
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
      this.typingTimeout = undefined;
    } else {
      // No existing timeout means this is the first keystroke
      // Call startTyping only on first keystroke
      // @see Requirements 11.1
      this.startTyping();
    }

    // Set timeout to end typing after 500ms of inactivity
    // @see Requirements 11.2
    this.typingTimeout = setTimeout(() => {
      this.endTypingIndicator();
      this.typingTimeout = undefined;
    }, this.TYPING_TIMEOUT_MS);
  }

  /**
   * Start typing indicator
   * Creates a TypingIndicator and calls CometChat.startTyping via the service
   *
   * @private
   * @see Requirements 11.1
   */
  private startTyping(): void {
    const receiver = this.getReceiver();
    if (receiver) {
      this.messageComposerService.startTyping(receiver);
    }
  }

  /**
   * End typing indicator
   * Creates a TypingIndicator and calls CometChat.endTyping via the service
   *
   * Called in the following scenarios:
   * - After 500ms of typing inactivity (debounced)
   * - When a message is sent
   * - When the component is destroyed
   *
   * @private
   * @see Requirements 11.2, 11.6, 11.7
   */
  private endTypingIndicator(): void {
    const receiver = this.getReceiver();
    if (receiver) {
      this.messageComposerService.endTyping(receiver);
    }
  }

  /**
   * Get the current receiver (user or group)
   * @returns The user or group, or undefined if neither is set
   * @private
   */
  private getReceiver(): CometChat.User | CometChat.Group | undefined {
    return this.currentUser() ?? this.currentGroup() ?? undefined;
  }

  // ==================== Mention Methods ====================

  /**
   * Check if the user is triggering a mention
   * @param text - Current text content
   * @param cursorPos - Current cursor position
   * @private
   * @see Requirements 16.2, 16.4
   */
  private checkForMentionTrigger(text: string, cursorPos: number): void {
    // Skip mention check if flag is set (right after mention insertion)
    if (this.skipNextMentionCheck) {
      return;
    }

    // If the unique mention limit has been reached, don't open the suggestions list.
    // The warning banner is already shown via updateMentionsCount().
    // @see Requirements 6.1, 6.4
    if (this.uniqueMentionCount() >= MENTIONS_LIMIT) {
      this.closeMentionSuggestions();
      return;
    }

    // Guard: no mention trigger inside code blocks or inline code (Req 1.15)
    if (this.enableRichText && this.customRichTextEditor) {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        let node: Node | null = sel.anchorNode;
        while (node) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const tagName = (node as HTMLElement).tagName?.toLowerCase();
            if (tagName === 'pre' || tagName === 'code') {
              this.closeMentionSuggestions();
              return;
            }
          }
          node = node.parentNode;
        }
      }
    }

    // For rich text editor, get the plain text content
    // Use the rich text editor path whenever the editor exists (regardless of enableRichText)
    // since the contentEditable is always the input mechanism
    if (this.customRichTextEditor) {
      // Get plain text from the editor
      const plainText = this.richTextEditorService.getText(this.customRichTextEditor);

      // Get the HTML to check for mention nodes
      const html = this.richTextEditorService.getHTML(this.customRichTextEditor);

      // Count mention nodes in HTML
      const mentionMatches = html.match(/data-uid="[^"]*"/g);
      const mentionCount = mentionMatches ? mentionMatches.length : 0;

      // Count @ symbols in plain text
      const atMatches = plainText.match(/@/g);
      const atCount = atMatches ? atMatches.length : 0;

      // If there are no @ symbols, close suggestions
      if (atCount === 0) {
        this.closeMentionSuggestions();
        return;
      }

      // If all @ symbols are accounted for by mention nodes, there's no new @ trigger
      if (atCount <= mentionCount) {
        this.closeMentionSuggestions();
        return;
      }

      // Find the last @ in the text - this should be the new trigger
      const lastAtIndex = plainText.lastIndexOf('@');

      // Get the text after the last @
      const textAfterAt = plainText.substring(lastAtIndex + 1);

      // Check if there's a space, non-breaking space, or newline after @ (mention ended)
      // Note: Mentions are followed by non-breaking space (\u00A0), so we check for both
      const hasSpace = textAfterAt.includes(' ');
      const hasNbsp = textAfterAt.includes('\u00A0');
      const hasNewline = textAfterAt.includes('\n');

      if (hasSpace || hasNbsp || hasNewline) {
        // Space or newline found after @ - this @ is part of a completed mention
        // Close suggestions
        this.closeMentionSuggestions();
        return;
      }

      // We have an active mention trigger (@ at end of text or followed by partial search text)
      const newSearchText = textAfterAt;
      const previousSearchText = this.mentionSearchText();

      // Always update search text
      this.mentionSearchText.set(newSearchText);

      // Reset focused index when search text changes
      if (newSearchText !== previousSearchText) {
        this.focusedMentionIndex.set(0);
      }

      // Open suggestions panel
      this.isMentionSuggestionsOpen.set(true);

      // If search text is the same as before, explicitly trigger the search
      if (newSearchText === previousSearchText && !this.disableMentions) {
        this.messageComposerService.searchMentions(
          newSearchText,
          this.currentGroup() ?? undefined,
          this.mentionsUsersRequestBuilder,
          this.mentionsGroupMembersRequestBuilder,
          this.disableMentionAll,
          this.mentionAllLabel
        );
      }
      return;
    }

    // Plain text mode - original logic
    const textBeforeCursor = text.substring(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex === -1) {
      // No @ found - close suggestions and reset state
      this.closeMentionSuggestions();
      return;
    }

    // Check if there's a space between @ and cursor (mention ended)
    const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
    if (textAfterAt.includes(' ')) {
      // Space found after @ - close suggestions and reset state
      this.closeMentionSuggestions();
      return;
    }

    // We have an active mention trigger
    const newSearchText = textAfterAt;
    const previousSearchText = this.mentionSearchText();

    // Only update if search text changed
    if (newSearchText !== previousSearchText) {
      this.mentionSearchText.set(newSearchText);
      // Reset focused index when search text changes
      this.focusedMentionIndex.set(0);
    }

    // Open suggestions panel
    this.isMentionSuggestionsOpen.set(true);
  }

  /**
   * Scroll the focused mention suggestion into view
   * Called by the mentionScrollEffect when focusedMentionIndex changes
   * Uses smooth scrolling for a better user experience
   * @param index - The index of the focused mention suggestion
   * @private
   * @see Requirements 3.1, 3.2, 3.3, 3.4, 3.5
   */
  private scrollMentionIntoView(index: number): void {
    const element = document.getElementById(`mention-option-${index}`);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }

  /**
   * Close mention suggestions and reset all related state
   * @private
   */
  private closeMentionSuggestions(): void {
    this.isMentionSuggestionsOpen.set(false);
    this.mentionSearchText.set('');
    this.focusedMentionIndex.set(0);
    this.messageComposerService.clearMentionSuggestions();
    // Also stop any ongoing mention search to clear the loading state
    this.messageComposerService.stopMentionSearch();
  }

  /**
   * Handle clicks outside the mention suggestions panel to close it.
   * This provides a better UX by allowing users to dismiss the panel
   * by clicking anywhere outside of it.
   *
   * @param event - The click event
   * @see Requirements 27.10
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    // Only process if mention suggestions are open
    if (!this.isMentionSuggestionsOpen()) {
      return;
    }

    // Check if the click was inside the mention suggestions panel
    const target = event.target as HTMLElement;
    const mentionPanel = target.closest('.cometchat-message-composer__mention-suggestions');

    // Check if the click was inside the rich text editor (where user types)
    const richTextEditor = target.closest('.cometchat-message-composer__rich-text-editor');

    // If click was outside both the panel and the editor, close the suggestions
    if (!mentionPanel && !richTextEditor) {
      this.closeMentionSuggestions();
    }
  }

  /**
   * Count unique mention UIDs in the current editor content and update
   * the `uniqueMentionCount` and `showMentionsCountWarning` signals.
   *
   * In rich text mode, traverses the editor content to find mention nodes.
   * In plain text mode, uses the `plainTextMentionUids` set which is maintained
   * when mentions are inserted via `selectMentionSuggestion`.
   *
   * @private
   * @see Requirements 6.1, 6.3
   */
  private updateMentionsCount(): void {
    if (this.disableMentions) {
      this.uniqueMentionCount.set(0);
      this.showMentionsCountWarning.set(false);
      return;
    }

    let count = 0;

    if (this.customRichTextEditor) {
      // Use the service to extract unique mention UIDs from editor content
      const uids = this.richTextEditorService.getUniqueMentionUids(this.customRichTextEditor);
      count = uids.size;
    } else {
      // Plain text mode: use the tracked set of mentioned UIDs
      count = this.plainTextMentionUids.size;
    }

    this.uniqueMentionCount.set(count);
    this.showMentionsCountWarning.set(count >= MENTIONS_LIMIT);
  }

  /**
   * Initialize the mentions request builder for pagination
   * Delegates to the service for SDK request builder creation
   * @param searchText - The current search text for mentions
   * @private
   * @see Requirements 2.1, 2.2, 2.3
   */
  private initializeMentionsRequestBuilder(searchText: string): void {
    const group = this.currentGroup();

    this.messageComposerService.initializeMentionsPagination(
      searchText,
      group ?? undefined,
      this.mentionsUsersRequestBuilder ?? undefined,
      this.mentionsGroupMembersRequestBuilder ?? undefined
    );
  }

  /**
   * Fetch more mention suggestions for pagination
   * Delegates to the service for SDK pagination logic
   * Called when user scrolls to the bottom of the mentions dropdown
   * @see Requirements 2.1, 2.2, 2.3
   */
  async fetchMoreMentions(): Promise<void> {
    const isGroupContext = !!this.currentGroup();
    await this.messageComposerService.fetchMoreMentions(isGroupContext);
    this.cdr.markForCheck();
  }

  /**
   * Handle scroll event on mentions dropdown
   * Detects when user has scrolled to bottom and triggers pagination
   * Uses a 50px threshold to trigger loading before reaching absolute bottom
   * @param event - The scroll event from the mentions dropdown
   * @see Requirements 11.1
   */
  handleMentionsScroll(event: Event): void {
    const element = event.target as HTMLElement;

    // Calculate scroll position
    const scrollTop = element.scrollTop;
    const scrollHeight = element.scrollHeight;
    const clientHeight = element.clientHeight;

    // Check if scrolled to bottom (with 50px threshold)
    // This triggers loading slightly before reaching the absolute bottom
    // for a smoother user experience
    if (scrollTop + clientHeight >= scrollHeight - 50) {
      this.fetchMoreMentions();
    }
  }

  /**
   * Check if a mention is for the logged-in user
   * Used to apply different styling for self mentions vs other mentions
   * @param userId - The user ID to check
   * @returns Promise that resolves to true if the user ID matches the logged-in user
   * @private
   */
  private async checkIfSelfMention(userId: string): Promise<boolean> {
    return this.messageComposerService.checkIfSelfMention(userId);
  }

  /**
   * Select a mention suggestion and insert it into the text
   * Called when user presses Enter/Tab on a focused suggestion or clicks on it
   * @param suggestion - The mention suggestion to insert
   * @see Requirements 16.5, 16.6, 27.10
   */
  async selectMentionSuggestion(suggestion: MentionSuggestion): Promise<void> {
    // Validate suggestion has valid uid and name
    if (!suggestion.uid || suggestion.uid.trim() === '') {
      console.warn('[CometChatMessageComposer] Cannot select mention with empty UID');
      this.closeMentionSuggestions();
      return;
    }
    if (!suggestion.name || suggestion.name.trim() === '') {
      console.warn('[CometChatMessageComposer] Cannot select mention with empty name');
      this.closeMentionSuggestions();
      return;
    }

    // Check if adding this mention would exceed the limit
    // Only block if this is a NEW unique mention (not already mentioned)
    // @see Requirements 6.4
    if (!this.disableMentions) {
      const currentCount = this.uniqueMentionCount();
      if (currentCount >= MENTIONS_LIMIT) {
        // Check if this user is already mentioned (duplicate mentions are allowed)
        let alreadyMentioned = false;

        if (this.customRichTextEditor) {
          const existingUids = this.richTextEditorService.getUniqueMentionUids(
            this.customRichTextEditor
          );
          alreadyMentioned = existingUids.has(suggestion.uid);
        } else {
          alreadyMentioned = this.plainTextMentionUids.has(suggestion.uid);
        }

        if (!alreadyMentioned) {
          // Block the insertion — limit reached for new unique mentions
          this.closeMentionSuggestions();
          return;
        }
      }
    }

    // Get the search text length to know how many chars to delete
    const searchText = this.mentionSearchText();
    const charsToDelete = searchText.length + 1; // +1 for the @ symbol

    // Get the mention name and ID
    const mentionName = suggestion.name;
    const mentionId = suggestion.uid;

    // Check if this is a self mention (for styling)
    const isSelf = await this.checkIfSelfMention(mentionId);

    // Store the user object in the map for later retrieval
    // This ensures we can build the mentionedUsers array even if suggestions are cleared
    // @see Requirements 6.1, 6.4
    if (suggestion.entity) {
      if (suggestion.entity instanceof CometChat.User) {
        this.mentionedUsersMap.set(mentionId, suggestion.entity);
      } else if ((suggestion.entity as unknown) instanceof CometChat.GroupMember) {
        // Convert GroupMember to User for storage
        const user = new CometChat.User({
          uid: (suggestion.entity as CometChat.GroupMember).getUid(),
          name: (suggestion.entity as CometChat.GroupMember).getName(),
        });
        this.mentionedUsersMap.set(mentionId, user);
      }
    }

    // Close the mention suggestions panel and reset state
    this.closeMentionSuggestions();

    // Set flag to skip next mention check
    this.skipNextMentionCheck = true;

    // Handle rich text editor — always use this path when the editor exists
    // since the contentEditable is always the input mechanism regardless of enableRichText
    if (this.customRichTextEditor) {
      // Use the service method to insert mention as an atomic node
      this.richTextEditorService.insertMention(
        this.customRichTextEditor,
        mentionId,
        mentionName,
        charsToDelete,
        isSelf
      );

      // Update composer text signal from editor
      this.composerText.set(this.customRichTextEditor.getText());

      // Emit text change event
      this.textChange.emit(this.customRichTextEditor.getText());

      // Focus back on the rich text editor and reset flag immediately after focus
      setTimeout(() => {
        this.focusRichTextEditor();
        // Reset the skip flag after a short delay
        // This prevents the panel from reopening when the editor emits update after focus
        setTimeout(() => {
          this.skipNextMentionCheck = false;
        }, 100);
      }, 0);
    } else {
      // Plain text mode - insert as @name text
      const mentionText = `@${mentionName} `;
      const currentText = this.composerText();
      const cursorPos = this.cursorPosition();

      // Find the @ symbol position for the current mention
      const textBeforeCursor = currentText.substring(0, cursorPos);
      const lastAtIndex = textBeforeCursor.lastIndexOf('@');

      if (lastAtIndex === -1) {
        this.skipNextMentionCheck = false;
        return;
      }

      // Track the mentioned UID for plain text mode
      // @see Requirements 6.1, 6.4
      this.plainTextMentionUids.add(mentionId);

      // Build the new text with the mention inserted
      const textBefore = currentText.substring(0, lastAtIndex);
      const textAfter = currentText.substring(cursorPos);
      const newText = `${textBefore}${mentionText}${textAfter}`;

      // Update the composer text
      this.composerText.set(newText);

      // Calculate new cursor position (after the mention and space)
      const newCursorPos = lastAtIndex + mentionText.length;
      this.cursorPosition.set(newCursorPos);

      // Emit text change event
      this.textChange.emit(newText);

      // Focus back on the text input and set cursor position
      this.focusTextInput();

      // Reset the skip flag after a longer delay to ensure mention detection doesn't trigger
      // This prevents the panel from reopening when user continues typing after selecting a mention
      setTimeout(() => {
        this.skipNextMentionCheck = false;
      }, 300);
    }

    // Announce mention insertion to screen readers
    // @see Requirements 23.8
    this.announceMentionInserted(mentionName);

    // Update mention count after insertion
    // @see Requirements 6.1, 6.3
    this.updateMentionsCount();

    // Emit the mentionSelected event with the entity if available
    if (suggestion.entity) {
      this.mentionSelected.emit(suggestion.entity);
    }
  }

  // ==================== Error Handling ====================

  /**
   * Emit error through error output
   * @param error - The error to emit
   * @private
   */
  private emitError(error: unknown): void {
    CometChatLogger.error('CometChatMessageComposer', 'Error:', error);

    let exception: CometChat.CometChatException;

    if (error instanceof CometChat.CometChatException) {
      exception = error;
    } else if (error instanceof Error) {
      exception = new CometChat.CometChatException({
        code: 'COMPONENT_ERROR',
        message: error.message,
        details: error.stack || '',
      });
    } else {
      exception = new CometChat.CometChatException({
        code: 'UNKNOWN_ERROR',
        message: String(error),
        details: '',
      });
    }

    // Announce error to screen readers via assertive live region
    // @see Requirements 28.13
    this.announceAssertive(
      CometChatLocalize.getLocalizedString('message_composer_error_occurred') +
        ': ' +
        exception.message
    );

    this.error.emit(exception);
  }

  // ==================== Live Region Announcement Methods ====================

  /**
   * Announce a message to screen readers via the polite aria-live region
   * Used for non-urgent announcements that should not interrupt the user
   * @param message - The message to announce
   * @see Requirements 28.9, 28.11, 28.12
   */
  private announcePolite(message: string): void {
    // Clear the region first to ensure the announcement is made even if the same message is repeated
    this.liveRegionPoliteText.set('');
    // Use setTimeout to ensure the DOM updates before setting the new message
    setTimeout(() => {
      this.liveRegionPoliteText.set(message);
    }, 50);
  }

  /**
   * Announce a message to screen readers via the assertive aria-live region
   * Used for urgent announcements that should interrupt the user immediately
   * @param message - The message to announce
   * @see Requirements 28.10, 28.13
   */
  private announceAssertive(message: string): void {
    // Clear the region first to ensure the announcement is made even if the same message is repeated
    this.liveRegionAssertiveText.set('');
    // Use setTimeout to ensure the DOM updates before setting the new message
    setTimeout(() => {
      this.liveRegionAssertiveText.set(message);
    }, 50);
  }

  /**
   * Announce reply mode activation to screen readers
   * @see Requirements 28.9
   */
  private announceReplyModeActivated(): void {
    this.announcePolite(
      CometChatLocalize.getLocalizedString('message_composer_reply_mode_activated')
    );
  }

  /**
   * Announce edit mode activation to screen readers
   * @see Requirements 28.9
   */
  private announceEditModeActivated(): void {
    this.announcePolite(
      CometChatLocalize.getLocalizedString('message_composer_edit_mode_activated')
    );
  }

  /**
   * Announce recording started to screen readers
   * @see Requirements 28.10
   */
  private announceRecordingStarted(): void {
    this.announceAssertive(
      CometChatLocalize.getLocalizedString('message_composer_recording_started')
    );
  }

  /**
   * Announce recording stopped to screen readers
   * @see Requirements 28.10
   */
  private announceRecordingStopped(): void {
    this.announceAssertive(
      CometChatLocalize.getLocalizedString('message_composer_recording_stopped')
    );
  }

  /**
   * Announce message sent to screen readers
   * @see Requirements 28.11
   */
  private announceMessageSent(): void {
    this.announcePolite(CometChatLocalize.getLocalizedString('message_composer_message_sent'));
  }

  /**
   * Announce attachment added to screen readers
   * @param fileName - The name of the added file
   * @see Requirements 28.12
   */
  private announceAttachmentAdded(fileName: string): void {
    this.announcePolite(
      CometChatLocalize.getLocalizedString('message_composer_attachment_added') + ': ' + fileName
    );
  }

  /**
   * Announce attachment removed to screen readers
   * @param fileName - The name of the removed file
   * @see Requirements 28.12
   */
  private announceAttachmentRemoved(fileName: string): void {
    this.announcePolite(
      CometChatLocalize.getLocalizedString('message_composer_attachment_removed') + ': ' + fileName
    );
  }

  /**
   * Announce focused mention suggestion to screen readers
   * Called when navigating mention suggestions with arrow keys
   * @param name - The name of the focused suggestion
   * @param position - The 1-based position in the list
   * @param total - The total number of suggestions
   * @see Requirements 14.3
   */
  private announceFocusedMention(name: string, position: number, total: number): void {
    // Build the announcement message with placeholders replaced
    const template = CometChatLocalize.getLocalizedString('message_composer_mention_focused');
    const message = template
      .replace('{name}', name)
      .replace('{position}', position.toString())
      .replace('{total}', total.toString());
    this.announcePolite(message);
  }

  /**
   * Announce the number of mention suggestions available
   * Called when the mentions panel opens and suggestions are loaded
   * @param count - The number of suggestions available
   * @see Requirements 23.7
   */
  private announceMentionSuggestionsCount(count: number): void {
    const template = CometChatLocalize.getLocalizedString('accessibility_mentions_suggestions');
    const message = template.replace('{count}', count.toString());
    this.liveAnnouncerService.announce(message, 'polite');
  }

  /**
   * Announce when a mention is inserted
   * Called after successfully inserting a mention into the composer
   * @param name - The name of the mentioned user
   * @see Requirements 23.8
   */
  private announceMentionInserted(name: string): void {
    const template = CometChatLocalize.getLocalizedString('accessibility_mentioned_user');
    const message = template.replace('{name}', name);
    this.liveAnnouncerService.announce(message, 'polite');
  }

  /**
   * Announce format state change to screen readers
   * Called when toggling formatting options (bold, italic, etc.)
   * @param formatName - The localized name of the format (e.g., "Bold", "Italic")
   * @param enabled - Whether the format is now enabled or disabled
   * @see Requirements 14.4
   */
  private announceFormatStateChange(formatName: string, enabled: boolean): void {
    const templateKey = enabled
      ? 'message_composer_format_enabled'
      : 'message_composer_format_disabled';
    const template = CometChatLocalize.getLocalizedString(templateKey);
    const message = template.replace('{format}', formatName);
    this.announcePolite(message);
  }

  // ==================== Drag and Drop Methods ====================

  /**
   * Handle drag enter event
   * Uses drag counter to prevent flicker from nested elements
   * @param event - Drag event
   * @see Requirements 10.1, 10.2, 10.3, 10.7, 10.8
   */
  handleDragEnter(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragCounter++;
    this.isDraggingOver.set(true);
  }

  /**
   * Handle drag leave event
   * Only hides drop zone when drag counter reaches 0
   * @param event - Drag event
   * @see Requirements 10.1, 10.2, 10.3, 10.7, 10.8
   */
  handleDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragCounter--;
    if (this.dragCounter === 0) {
      this.isDraggingOver.set(false);
    }
  }

  /**
   * Handle drag over event
   * @param event - Drag event
   * @see Requirements 8.3
   */
  handleDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  /**
   * Handle drop event
   * Resets drag counter and processes dropped files
   * @param event - Drag event
   * @see Requirements 10.4, 10.5
   */
  handleDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragCounter = 0;
    this.isDraggingOver.set(false);

    // [DISABLED] Drag-drop disabled — files are sent directly from file picker instead
    // const files = event.dataTransfer?.files;
    // if (files && files.length > 0) {
    //   this.processFiles(Array.from(files));
    // }
  }

  /**
   * Handle paste event for images, files, and formatted text
   *
   * This method handles two types of paste operations:
   * 1. File paste (images, etc.) - Processes files and adds them as attachments
   * 2. Text paste (plain or formatted) - Delegated to rich text editor for proper handling
   *
   * For formatted text paste (HTML content from other applications):
   * - The rich text editor handles HTML paste natively
   * - Formatting (bold, italic, lists, etc.) is preserved
   * - Potentially dangerous content is sanitized
   *
   * For special characters and unicode:
   * - The rich text editor handles unicode natively
   * - RTL text, emojis, and special characters are supported
   *
   * @param event - Clipboard event
   * @see Requirements 13.3 - Handle copy/paste of formatted text correctly
   * @see Requirements 13.10 - Handle special characters and unicode correctly
   */
  handlePaste(event: ClipboardEvent): void {
    const clipboardData = event.clipboardData;
    if (!clipboardData) {
      return;
    }

    // Block pasted files/images — only allow text paste
    // Files should only be sent via the attachment button
    const items = clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].kind === 'file') {
        event.preventDefault();
        return;
      }
    }
    // If no files, let the default paste behavior handle text
    // The rich text editor will handle formatted text paste correctly:
    // - HTML content is parsed and formatting is preserved
    // - Plain text is inserted as-is
    // - Special characters and unicode are handled natively
    // @see Requirements 13.3, 13.10
  }

  // ==================== File Handling Methods ====================

  /**
   * Handle file input change
   * @param event - Change event from file input
   * @see Requirements 5.7
   */
  handleFileInputChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    const files = target.files;
    if (files && files.length > 0) {
      this.processFiles(Array.from(files));
    }
    // Reset input to allow selecting the same file again
    target.value = '';
  }

  /**
   * Process selected files
   * @param files - Array of files to process
   * @private
   * @see Requirements 6.1, 6.3, 9.1, 9.3, 12.1, 12.3, 12.4
   */
  private processFiles(files: File[]): void {
    // Track files that exceed size limit for error reporting
    const oversizedFiles: File[] = [];
    // Track files with invalid types for error reporting
    const invalidTypeFiles: File[] = [];

    // Collect valid files for direct sending
    const validFiles: File[] = [];

    for (const file of files) {
      // // [DISABLED] Check if we can add more attachments
      // if (!this.canAddMoreAttachments()) {
      //   console.warn('[CometChatMessageComposer] Maximum attachments reached');
      //   break;
      // }

      // Validate file type if allowedFileTypes is specified
      if (this.allowedFileTypes && this.allowedFileTypes.length > 0) {
        if (!this.allowedFileTypes.includes(file.type)) {
          console.warn('[CometChatMessageComposer] File type not allowed:', file.type);
          invalidTypeFiles.push(file);
          continue;
        }
      }

      // Validate file size if maxFileSize is specified (default 100MB)
      const maxSize = this.maxFileSize || 100 * 1024 * 1024; // 100MB default
      if (file.size > maxSize) {
        console.warn('[CometChatMessageComposer] File size exceeds limit:', file.size);
        oversizedFiles.push(file);
        continue;
      }

      // // [DISABLED] Add file to attachments (preview mode)
      // this.addAttachment(file);

      // [ENABLED] Collect valid file for direct sending
      validFiles.push(file);
    }

    // Emit error for invalid file types
    // @see Requirements 6.3
    if (invalidTypeFiles.length > 0) {
      const errorMessage =
        CometChatLocalize.getLocalizedString('message_composer_file_type_error') ||
        `${invalidTypeFiles.length} file(s) have unsupported file type`;
      this.emitError(new Error(errorMessage));
    }

    // Set file size error if any files exceeded the limit
    // @see Requirements 12.1, 12.3, 12.4
    if (oversizedFiles.length > 0) {
      const fileType = this.getFileTypeLabel(oversizedFiles[0].type);
      const maxSize = this.maxFileSize || 100 * 1024 * 1024;
      this.fileSizeError.set({
        count: oversizedFiles.length,
        fileType,
        limitMB: Math.round(maxSize / (1024 * 1024)),
        timestamp: Date.now(),
      });

      // Emit error output for validation errors
      // @see Requirements 6.3
      const errorMessage =
        CometChatLocalize.getLocalizedString('message_composer_file_size_error') ||
        `${oversizedFiles.length} ${fileType}(s) exceeded the ${Math.round(maxSize / (1024 * 1024))}MB limit`;
      this.emitError(new Error(errorMessage));
    }

    // [ENABLED] Send valid files directly as media messages (skip attachment preview)
    if (validFiles.length > 0) {
      this.sendFilesDirectly(validFiles);
    }
  }

  /**
   * Send files directly as media messages without adding to attachment preview.
   * Each file is sent as a separate media message immediately.
   * @param files - Array of validated files to send
   * @private
   */
  private async sendFilesDirectly(files: File[]): Promise<void> {
    const receiver = this.getReceiver();
    if (!receiver) {
      console.warn('[CometChatMessageComposer] No receiver (user or group) specified');
      return;
    }

    const quotedMessage = this.messageToReplySignal() || undefined;
    let lastSentMessage: CometChat.BaseMessage | null = null;

    for (const file of files) {
      const fileType = this.getFileType(file);
      const mediaType = this.getMediaMessageType(fileType);

      const receiverId =
        receiver instanceof CometChat.User ? receiver.getUid() : receiver.getGuid();
      const receiverType =
        receiver instanceof CometChat.User
          ? CometChat.RECEIVER_TYPE.USER
          : CometChat.RECEIVER_TYPE.GROUP;

      const pendingMediaMessage = new CometChat.MediaMessage(
        receiverId,
        file,
        mediaType,
        receiverType
      );

      if (this.parentMessageId) {
        pendingMediaMessage.setParentMessageId(this.parentMessageId);
      }
      if (quotedMessage) {
        pendingMediaMessage.setQuotedMessage(quotedMessage);
        pendingMediaMessage.setQuotedMessageId(quotedMessage.getId());
      }
      pendingMediaMessage.setMuid(CometChatUIKitUtility.ID());
      pendingMediaMessage.setSentAt(CometChatUIKitUtility.getUnixTimestamp());

      // Create a local blob URL so bubble components can show a preview
      // during the inprogress state (before the server returns the real URL).
      // We override getAttachments() directly because the SDK's setAttachment()
      // expects a proper CometChat.Attachment instance with getter methods.
      const blobUrl = URL.createObjectURL(file);
      const fileExtension = file.name.split('.').pop() || '';
      const localAttachment = {
        url: blobUrl,
        name: file.name,
        mimeType: file.type,
        size: file.size,
        extension: fileExtension,
        getUrl: () => blobUrl,
        getName: () => file.name,
        getMimeType: () => file.type,
        getSize: () => file.size,
        getExtension: () => fileExtension,
      };
      (pendingMediaMessage as any).getAttachments = () => [localAttachment];

      // Emit inprogress
      CometChatMessageEvents.ccMessageSent.next({
        message: pendingMediaMessage,
        status: MessageStatus.inprogress,
      });

      try {
        const mediaMessage = await this.messageComposerService.sendMediaMessage(
          receiver,
          file,
          mediaType,
          undefined,
          this.parentMessageId,
          quotedMessage,
          pendingMediaMessage
        );

        if (mediaMessage) {
          lastSentMessage = mediaMessage;
          CometChatMessageEvents.ccMessageSent.next({
            message: mediaMessage,
            status: MessageStatus.success,
          });
        } else {
          CometChatMessageEvents.ccMessageSent.next({
            message: pendingMediaMessage,
            status: MessageStatus.error,
          });
        }
      } catch (error) {
        CometChatMessageEvents.ccMessageSent.next({
          message: pendingMediaMessage,
          status: MessageStatus.error,
        });
        this.emitError(error);
        CometChatLogger.error('CometChatMessageComposer', 'Error sending media message:', error);
      }

      // Clean up the blob URL to avoid memory leaks
      URL.revokeObjectURL(blobUrl);
    }

    // Handle reply mode cleanup
    if (quotedMessage && lastSentMessage) {
      this.exitReplyMode();
      CometChatMessageEvents.ccReplyToMessage.next({
        message: lastSentMessage,
        status: MessageStatus.success,
      });
    }

    if (lastSentMessage) {
      this.sendButtonClick.emit(lastSentMessage);
      this.announceMessageSent();
    }

    this.playOutgoingMessageSound();
  }

  /**
   * Handle remove attachment button click
   * @param attachment - Attachment to remove
   * @see Requirements 6.6, 7.8, 26.6, 28.12
   */
  handleRemoveAttachment(attachment: AttachmentFile): void {
    // Revoke object URL if it exists
    if (attachment.thumbnailUrl) {
      URL.revokeObjectURL(attachment.thumbnailUrl);
    }

    this.attachments.update(attachments => attachments.filter(a => a.id !== attachment.id));
    this.attachmentRemoved.emit(attachment.file);

    // Announce attachment removed to screen readers
    // @see Requirements 28.12
    this.announceAttachmentRemoved(attachment.name);
  }

  /**
   * Get the file type category
   * @param file - File to categorize
   * @returns File type category
   * @private
   */
  private getFileType(file: File): 'image' | 'video' | 'audio' | 'file' {
    if (file.type.startsWith('image/')) {
      return 'image';
    }
    if (file.type.startsWith('video/')) {
      return 'video';
    }
    if (file.type.startsWith('audio/')) {
      return 'audio';
    }
    return 'file';
  }

  /**
   * Get a user-friendly label for a file type based on MIME type
   * Used for error messages when files exceed size limits
   * @param mimeType - The MIME type of the file (e.g., 'image/jpeg', 'video/mp4')
   * @returns User-friendly label ('photo', 'video', 'audio', or 'file')
   * @private
   * @see Requirements 12.3, 12.4
   */
  private getFileTypeLabel(mimeType: string): string {
    if (mimeType.startsWith('image/')) {
      return 'photo';
    }
    if (mimeType.startsWith('video/')) {
      return 'video';
    }
    if (mimeType.startsWith('audio/')) {
      return 'audio';
    }
    return 'file';
  }

  /**
   * Dismiss the file size error message
   * Called when user clicks the dismiss button on the error banner
   * @see Requirements 12.5, 12.8
   */
  dismissFileSizeError(): void {
    this.fileSizeError.set(null);
  }

  /**
   * Get the formatted file size error message
   * Format: "{count} {fileType} you tried adding is larger than the {limit} limit"
   * @returns The formatted error message string
   * @see Requirements 12.2
   */
  getFileSizeErrorMessage(): string {
    const error = this.fileSizeError();
    if (!error) {
      return '';
    }

    // Format: "1 photo you tried adding is larger than the 100 MB limit"
    // or "2 photos you tried adding are larger than the 100 MB limit"
    const count = error.count;
    const fileType = count === 1 ? error.fileType : this.getPluralFileType(error.fileType);
    const verb = count === 1 ? 'is' : 'are';
    const limit = `${error.limitMB} MB`;

    return `${count} ${fileType} you tried adding ${verb} larger than the ${limit} limit`;
  }

  /**
   * Get the plural form of a file type
   * @param fileType - The singular file type (photo, video, audio, file)
   * @returns The plural form of the file type
   * @private
   */
  private getPluralFileType(fileType: string): string {
    switch (fileType) {
      case 'photo':
        return 'photos';
      case 'video':
        return 'videos';
      case 'audio':
        return 'audio files';
      case 'file':
        return 'files';
      default:
        return `${fileType}s`;
    }
  }

  // ==================== Focus Handling Methods ====================

  /**
   * Handle input focus
   * Called when the text input or rich text editor receives focus
   */
  handleInputFocus(): void {
    // Can be used for focus-related styling or behavior
  }

  /**
   * Handle input blur (focus loss)
   *
   * Content is automatically preserved when the editor loses focus because:
   * 1. The rich text editor maintains its internal state
   * 2. The composerText signal is updated on every content change via handleRichTextUpdate
   * 3. No content clearing happens on blur
   *
   * This ensures users don't lose their work when clicking outside the editor.
   *
   * @see Requirements 13.9 - WHEN the editor loses focus THEN THE Content SHALL be preserved
   */
  handleInputBlur(): void {
    // Content is preserved automatically - no action needed
    // The composerText signal maintains the current content
    // The rich text editor's internal state also preserves the content
  }

  // ==================== Template Context ====================

  /**
   * Get the template context for custom templates
   */
  get templateContext(): { user?: CometChat.User; group?: CometChat.Group } {
    return {
      user: this.currentUser() || undefined,
      group: this.currentGroup() || undefined,
    };
  }

  // ==================== Rich Text Toolbar Methods ====================

  /**
   * Handle bold button click in the rich text toolbar
   * Toggles bold formatting on the selected text
   * @see Requirements 1.1, 1.2, 19.3, 14.4
   */
  /**
   * Handle bold button click in the rich text toolbar
   * Toggles bold formatting on the selected text
   * @see Requirements 1.1, 1.2, 19.3, 14.4
   */
  handleToolbarBold(): void {
    if (this.enableRichText) {
      const wasActive = this.richTextFormatState().bold;

      if (this.customRichTextEditor) {
        this.richTextEditorService.toggleBold(this.customRichTextEditor);
      }

      // Update format state after toggle to ensure toolbar reflects current state
      this.updateFormatStateFromEditor();
      // Announce format state change to screen readers
      // @see Requirements 14.4
      const formatName = CometChatLocalize.getLocalizedString('message_composer_bold');
      this.announceFormatStateChange(formatName, !wasActive);
    }
  }

  /**
   * Handle italic button click in the rich text toolbar
   * Toggles italic formatting on the selected text
   * @see Requirements 1.5, 19.4, 14.4
   */
  /**
   * Handle italic button click in the rich text toolbar
   * Toggles italic formatting on the selected text
   * @see Requirements 1.5, 19.4, 14.4
   */
  handleToolbarItalic(): void {
    if (this.enableRichText) {
      const wasActive = this.richTextFormatState().italic;

      if (this.customRichTextEditor) {
        this.richTextEditorService.toggleItalic(this.customRichTextEditor);
      }

      // Update format state after toggle to ensure toolbar reflects current state
      this.updateFormatStateFromEditor();
      // Announce format state change to screen readers
      // @see Requirements 14.4
      const formatName = CometChatLocalize.getLocalizedString('message_composer_italic');
      this.announceFormatStateChange(formatName, !wasActive);
    }
  }

  /**
   * Handle underline button click in the rich text toolbar
   * Toggles underline formatting on the selected text
   * @see Requirements 1.6, 19.5, 14.4
   */
  /**
   * Handle underline button click in the rich text toolbar
   * Toggles underline formatting on the selected text
   * @see Requirements 1.6, 19.5, 14.4
   */
  handleToolbarUnderline(): void {
    if (this.enableRichText) {
      const wasActive = this.richTextFormatState().underline;

      if (this.customRichTextEditor) {
        this.richTextEditorService.toggleUnderline(this.customRichTextEditor);
      }

      // Update format state after toggle to ensure toolbar reflects current state
      this.updateFormatStateFromEditor();
      // Announce format state change to screen readers
      // @see Requirements 14.4
      const formatName = CometChatLocalize.getLocalizedString('message_composer_underline');
      this.announceFormatStateChange(formatName, !wasActive);
    }
  }

  /**
   * Handle strikethrough button click in the rich text toolbar
   * Toggles strikethrough formatting on the selected text
   * @see Requirements 1.7, 19.6, 14.4
   */
  /**
   * Handle strikethrough button click in the rich text toolbar
   * Toggles strikethrough formatting on the selected text
   * @see Requirements 1.7, 19.6, 14.4
   */
  handleToolbarStrikethrough(): void {
    if (this.enableRichText) {
      const wasActive = this.richTextFormatState().strikethrough;

      if (this.customRichTextEditor) {
        this.richTextEditorService.toggleStrikethrough(this.customRichTextEditor);
      }

      // Update format state after toggle to ensure toolbar reflects current state
      this.updateFormatStateFromEditor();
      // Announce format state change to screen readers
      // @see Requirements 14.4
      const formatName = CometChatLocalize.getLocalizedString('message_composer_strikethrough');
      this.announceFormatStateChange(formatName, !wasActive);
    }
  }

  /**
   * Handle inline code button click in the rich text toolbar
   * Toggles inline code formatting on the selected text
   * @see Requirements 1.7, 19.6.5, 14.4
   */
  handleToolbarInlineCode(): void {
    if (this.enableRichText) {
      const wasActive = this.richTextFormatState().code;

      if (this.customRichTextEditor) {
        this.richTextEditorService.toggleCode(this.customRichTextEditor);
      }

      // Update format state after toggle to ensure toolbar reflects current state
      this.updateFormatStateFromEditor();
      // Announce format state change to screen readers
      // @see Requirements 14.4
      const formatName = CometChatLocalize.getLocalizedString('message_composer_inline_code');
      this.announceFormatStateChange(formatName, !wasActive);
    }
  }

  /**
   * Handle link button click in the rich text toolbar
   * Opens link dialog for adding/editing links or removes link if already active
   * @see Requirements 19.7, 14.4
   */
  handleToolbarLink(): void {
    if (this.enableRichText && this.customRichTextEditor) {
      // Save the current selection before opening the dialog
      // so we can restore it when applying link changes
      this.savedLinkSelection = this.customRichTextEditor.saveSelection();

      // Compute position from the current selection
      let viewportX = 0;
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        viewportX = rect.left;
      }

      // Convert to parent-relative coordinates
      const left = this.computeLinkDialogLeft(viewportX);

      // Check if link is already active
      const wasActive = this.richTextFormatState().link;

      if (wasActive) {
        // Get current link URL and text for edit mode
        const currentUrl = this.customRichTextEditor.getCurrentLink();
        const currentLinkText = this.customRichTextEditor.getCurrentLinkText();

        // Open dialog in edit mode with the link's actual text
        this.linkDialogMode.set('edit');
        this.linkDialogInitialText.set(currentLinkText || '');
        this.linkDialogInitialUrl.set(currentUrl || '');
        this.linkDialogX.set(left);
        this.isLinkDialogOpen.set(true);
      } else {
        // Get selected text for new link
        const selectedText = this.customRichTextEditor.getSelectedText();

        // Open dialog in add mode
        this.linkDialogMode.set('add');
        this.linkDialogInitialText.set(selectedText);
        this.linkDialogInitialUrl.set('');
        this.linkDialogX.set(left);
        this.isLinkDialogOpen.set(true);
      }
    }
  }

  /**
   * Handle ordered list button click in the rich text toolbar
   * Toggles ordered list formatting
   * @see Requirements 19.8, 14.4
   */
  /**
   * Handle ordered list button click in the rich text toolbar
   * Toggles ordered list formatting
   * @see Requirements 19.8, 14.4
   */
  handleToolbarOrderedList(): void {
    if (this.enableRichText) {
      const wasActive = this.richTextFormatState().orderedList;

      if (this.customRichTextEditor) {
        this.richTextEditorService.toggleOrderedList(this.customRichTextEditor);
      }

      // Update format state after toggle to ensure toolbar reflects current state
      this.updateFormatStateFromEditor();
      // Announce format state change to screen readers
      // @see Requirements 14.4
      const formatName = CometChatLocalize.getLocalizedString('message_composer_ordered_list');
      this.announceFormatStateChange(formatName, !wasActive);
    }
  }

  /**
   * Handle bullet list button click in the rich text toolbar
   * Toggles unordered/bullet list formatting
   * @see Requirements 19.9, 14.4
   */
  /**
   * Handle bullet list button click in the rich text toolbar
   * Toggles bullet list formatting
   * @see Requirements 19.9, 14.4
   */
  handleToolbarBulletList(): void {
    if (this.enableRichText) {
      const wasActive = this.richTextFormatState().bulletList;

      if (this.customRichTextEditor) {
        this.richTextEditorService.toggleBulletList(this.customRichTextEditor);
      }

      // Update format state after toggle to ensure toolbar reflects current state
      this.updateFormatStateFromEditor();
      // Announce format state change to screen readers
      // @see Requirements 14.4
      const formatName = CometChatLocalize.getLocalizedString('message_composer_bullet_list');
      this.announceFormatStateChange(formatName, !wasActive);
    }
  }

  /**
   * Handle code block button click in the rich text toolbar
   * Toggles code block formatting
   * @see Requirements 19.10, 14.4
   */
  /**
   * Handle code block button click in the rich text toolbar
   * Toggles code block formatting
   * @see Requirements 19.10, 14.4
   */
  handleToolbarCodeBlock(): void {
    if (this.enableRichText) {
      const wasActive = this.richTextFormatState().codeBlock;

      if (this.customRichTextEditor) {
        this.richTextEditorService.toggleCodeBlock(this.customRichTextEditor);
      }

      // Update format state after toggle to ensure toolbar reflects current state
      this.updateFormatStateFromEditor();
      // Announce format state change to screen readers
      // @see Requirements 14.4
      const formatName = CometChatLocalize.getLocalizedString('message_composer_code_block');
      this.announceFormatStateChange(formatName, !wasActive);
    }
  }

  /**
   * Handle blockquote button click in the rich text toolbar
   * Toggles blockquote formatting
   * @see Requirements 19.11, 14.4
   */
  /**
   * Handle blockquote button click in the rich text toolbar
   * Toggles blockquote formatting
   * @see Requirements 19.11, 14.4
   */
  handleToolbarBlockquote(): void {
    if (this.enableRichText) {
      const wasActive = this.richTextFormatState().blockquote;

      if (this.customRichTextEditor) {
        this.richTextEditorService.toggleBlockquote(this.customRichTextEditor);
      }

      // Update format state after toggle to ensure toolbar reflects current state
      this.updateFormatStateFromEditor();
      // Announce format state change to screen readers
      // @see Requirements 14.4
      const formatName = CometChatLocalize.getLocalizedString('message_composer_blockquote');
      this.announceFormatStateChange(formatName, !wasActive);
    }
  }

  /**
   * Handle selection update from rich text editor
   * Updates the richTextFormatState signal to reflect active formats at cursor position
   * This ensures toolbar buttons display correct active/inactive state
   * Also controls bubble menu visibility and positioning based on text selection
   * Only shows bubble menu after mouse is released (not while dragging)
   * On mobile (< 480px), shows fixed toolbar instead of floating bubble menu
   * @param formatState - The current format state from the editor
   * @private
   * @see Requirements 1.3, 1.4, 1.8, 1.9
   */
  private handleSelectionUpdate(formatState: RichTextFormatState): void {
    this.richTextFormatState.set(formatState);

    // Control bubble menu visibility and positioning based on text selection
    if (this.showBubbleMenuOnSelection && this.enableRichText && this.customRichTextEditor) {
      const selection = this.customRichTextEditor.getSelection();

      // Clear any existing debounce timer
      if (this.bubbleMenuDebounceTimer) {
        clearTimeout(this.bubbleMenuDebounceTimer);
        this.bubbleMenuDebounceTimer = null;
      }

      // Check if fixed toolbar is shown (mutual exclusivity with bubble menu)
      const isFixedToolbarActive = this.shouldShowToolbar();

      if (
        selection &&
        !selection.isCollapsed &&
        selection.toString().trim().length > 0 &&
        !isFixedToolbarActive
      ) {
        // There's actual text selected and fixed toolbar is not active
        // Get selection range for tracking
        const range = selection.getRangeAt(0);
        const startOffset = this.getTextOffsetFromNode(
          this.customRichTextEditor.getElement(),
          range.startContainer,
          range.startOffset
        );
        const endOffset = this.getTextOffsetFromNode(
          this.customRichTextEditor.getElement(),
          range.endContainer,
          range.endOffset
        );

        this.textSelection.set({ from: startOffset, to: endOffset });

        // Only show bubble menu if mouse is not pressed (selection is complete)
        if (!this.isMouseDown) {
          // Small debounce to ensure selection is stable
          this.bubbleMenuDebounceTimer = setTimeout(() => {
            // Verify selection is still valid after debounce and fixed toolbar is still not active
            const currentSelection = this.customRichTextEditor?.getSelection();
            const isStillFixedToolbarActive = this.shouldShowToolbar();
            if (
              currentSelection &&
              !currentSelection.isCollapsed &&
              currentSelection.toString().trim().length > 0 &&
              !isStillFixedToolbarActive
            ) {
              // On mobile, show fixed toolbar instead of floating bubble menu
              if (this.isMobileView()) {
                // Show fixed toolbar on mobile
                this.isFixedToolbarShown.set(true);
              } else {
                // Show floating bubble menu on desktop
                this.isBubbleMenuVisible.set(true);

                // Calculate bubble menu position
                const currentRange = currentSelection.getRangeAt(0);
                this.updateBubbleMenuPosition(currentRange);
              }

              // Trigger change detection
              this.cdr.markForCheck();
            }
          }, 100); // 100ms delay for stability
        }
      } else {
        // No text selected or selection is collapsed or fixed toolbar is active - hide bubble menu immediately
        this.isBubbleMenuVisible.set(false);
        this.textSelection.set(null);
        this.bubbleMenuPosition.set(null);

        // On mobile, hide fixed toolbar when selection is cleared (if it was shown due to selection)
        // Only hide if showToolbarToggle is enabled (user can toggle)
        // Do NOT hide if toolbar was manually toggled open by the user
        // @see Requirements 2.22 - Mobile toolbar stays open on manual toggle
        if (
          this.isMobileView() &&
         
          !this.isFixedToolbarManuallyToggled()
        ) {
          // Check if there's no text selected - hide the toolbar
          const hasSelection =
            selection && !selection.isCollapsed && selection.toString().trim().length > 0;
          if (!hasSelection) {
            this.isFixedToolbarShown.set(false);
          }
        }

        // Trigger change detection
        this.cdr.markForCheck();
      }
    }
  }

  /**
   * Update bubble menu position based on selection range
   * Positions the bubble menu above the selected text with boundary detection
   * Ensures the menu stays within the composer bounds
   * Uses actual rendered bubble menu width for accurate positioning
   * @param range - The selection range
   * @private
   */
  private updateBubbleMenuPosition(range: Range): void {
    try {
      const rects = range.getClientRects();
      if (rects.length === 0) {
        return;
      }

      // Get the first rect for positioning (start of selection)
      let rect = rects[0];

      // Get the editor container position
      const editorElement = this.customRichTextEditor?.getElement();
      if (!editorElement) {
        return;
      }

      const editorRect = editorElement.getBoundingClientRect();

      // Get the main composer container for boundary detection
      const composerElement = editorElement.closest('.cometchat-message-composer') as HTMLElement;
      const composerRect = composerElement ? composerElement.getBoundingClientRect() : editorRect;

      // For multi-line selections, find the first visible rect
      // This prevents the toolbar from floating way above when selection starts off-screen
      for (let i = 0; i < rects.length; i++) {
        const r = rects[i];
        // Check if this rect is visible within the editor area
        if (r.top >= editorRect.top - 10 && r.bottom <= editorRect.bottom + 10) {
          rect = r;
          break;
        }
        // If rect is partially visible (top is above but bottom is in view)
        if (r.top < editorRect.top && r.bottom > editorRect.top) {
          rect = r;
          break;
        }
      }

      // If the selection rect is above the visible editor area,
      // use the editor's top as reference
      if (rect.top < editorRect.top) {
        rect = new DOMRect(rect.left, editorRect.top, rect.width, rect.height);
      }

      // Get actual bubble menu width if element exists, otherwise use estimate
      let bubbleMenuWidth = 500; // Default estimate
      const bubbleMenuElement = this.bubbleMenuElementRef?.nativeElement;
      if (bubbleMenuElement) {
        // Wait for next frame to get accurate width after render
        requestAnimationFrame(() => {
          const actualWidth = bubbleMenuElement.offsetWidth;
          if (actualWidth > 0) {
            bubbleMenuWidth = actualWidth;
            // Recalculate position with actual width
            this.calculateAndSetPosition(rect, editorRect, composerRect, bubbleMenuWidth);
          }
        });
      }

      // Initial calculation with estimate
      this.calculateAndSetPosition(rect, editorRect, composerRect, bubbleMenuWidth);
    } catch (error) {
      console.warn('[CometChatMessageComposer] Error calculating bubble menu position:', error);
    }
  }

  /**
   * Calculate and set bubble menu position
   * Helper method to avoid code duplication
   * @private
   */
  private calculateAndSetPosition(
    rect: DOMRect,
    editorRect: DOMRect,
    composerRect: DOMRect,
    bubbleMenuWidth: number
  ): void {
    const bubbleMenuHeight = 44; // Approximate height with padding
    const verticalGap = 8; // Gap between selection and menu

    // Use viewport coordinates since bubble menu uses position: fixed
    // Position ABOVE the selection by default
    let top = rect.top - bubbleMenuHeight - verticalGap;
    let left = rect.left;

    // Center the bubble menu horizontally over the selection
    const selectionWidth = rect.width;
    const centerOffset = (selectionWidth - bubbleMenuWidth) / 2;
    left = left + centerOffset;

    // Horizontal boundary detection - keep within composer width
    const minLeft = composerRect.left + 8;
    const maxLeft = composerRect.right - bubbleMenuWidth - 8;

    if (left < minLeft) {
      left = minLeft;
    }
    if (left > maxLeft && maxLeft > minLeft) {
      left = maxLeft;
    }

    // Vertical boundary detection:
    // - Toolbar should appear above the selection when there's space
    // - If selection is near top of composer, toolbar can go above composer (up to viewport top)
    // - Toolbar should never go below the selection or outside viewport

    // Minimum top is viewport top with padding
    const minTop = 8;

    // If calculated top is above viewport, clamp to viewport top
    if (top < minTop) {
      top = minTop;
    }

    // No maxTop constraint - let the toolbar appear above the selection naturally
    // The updateBubbleMenuPosition already handles clamping the rect to visible area

    this.bubbleMenuPosition.set({ top, left });
    this.cdr.markForCheck();
  }

  /**
   * Get text offset from a node position
   * Helper method to calculate character position in the editor
   * @param root - The root element
   * @param node - The target node
   * @param offset - The offset within the node
   * @returns The character offset from the start of the editor
   * @private
   */
  private getTextOffsetFromNode(root: HTMLElement, node: Node, offset: number): number {
    let textOffset = 0;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);

    let currentNode: Node | null;
    while ((currentNode = walker.nextNode())) {
      if (currentNode === node) {
        return textOffset + offset;
      }
      textOffset += currentNode.textContent?.length || 0;
    }

    return textOffset;
  }

  /**
   * Update the format state signal from the current editor state
   * Called after formatting operations to ensure toolbar buttons reflect current state
   * @private
   * @see Requirements 1.3, 1.4, 1.8, 1.9
   */
  /**
   * Update the format state signal from the editor
   * Called after formatting operations to ensure toolbar buttons reflect current state
   * @private
   * @see Requirements 1.3, 1.4, 1.8, 1.9
   */
  private updateFormatStateFromEditor(): void {
    if (this.enableRichText) {
      let formatState: RichTextFormatState | undefined;

      if (this.customRichTextEditor) {
        formatState = this.richTextEditorService.getFormatState(this.customRichTextEditor);
      }

      if (formatState) {
        this.richTextFormatState.set(formatState);
      }
    }
  }
}
