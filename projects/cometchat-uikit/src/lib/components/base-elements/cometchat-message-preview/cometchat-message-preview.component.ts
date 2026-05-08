import {
  Component,
  Input,
  Output,
  EventEmitter,
  TemplateRef,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  HostListener,
  inject,
  computed,
  signal, ChangeDetectionStrategy} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatLocalize } from '../../../resources/CometChatLocalize/cometchat-localize';
import { CometChatTextFormatter } from '../../../formatters/cometchat-text-formatter';
import { COMETCHAT_GLOBAL_CONFIG, GlobalConfig } from '../../../services/global-config.service';
import { MessagePreviewMode, MESSAGE_TYPES } from './cometchat-message-preview.types';

export type { MessagePreviewMode };

/**
 * CometChatMessagePreview is a component that displays a preview of a message
 * that is being replied to or edited. It shows a title, subtitle, and optional
 * close button. When the message is deleted, it displays a deleted message UI.
 *
 * ## Features
 * - Displays sender name (Requirement 7.2)
 * - Truncates long message content with ellipsis (Requirements 7.1, 7.3)
 * - Shows appropriate icons for media messages (Requirement 7.4)
 * - Shows "Message deleted" for deleted quoted messages (Requirement 7.8)
 *
 * ## Accessibility Features (Requirement 15.1-15.6)
 * - role="status" with aria-live="polite" for screen reader announcements
 * - aria-label describing context (replying to/editing)
 * - Keyboard accessible close button (Enter/Space/Escape keys)
 * - Proper ARIA attributes for screen readers
 * - Visible focus indicators meeting WCAG contrast requirements
 * - Support for nested interactive elements in templates
 *
 * @example
 * ```html
 * <cometchat-message-preview
 *   [previewTitle]="titleTemplate"
 *   [previewSubtitle]="subtitleTemplate"
 *   [message]="replyMessage"
 *   [mode]="'reply'"
 *   (closeClick)="onClosePreview()">
 * </cometchat-message-preview>
 * ```
 */
@Component({
  selector: 'cometchat-message-preview',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './cometchat-message-preview.component.html',
  styleUrls: ['./cometchat-message-preview.component.css'],
})
export class CometChatMessagePreviewComponent implements AfterViewInit, OnDestroy {
  // ============================================
  // Injected Services (GlobalConfig)
  // ============================================

  private globalConfig: Partial<GlobalConfig> | null = inject(COMETCHAT_GLOBAL_CONFIG, {
    optional: true,
  });

  // ============================================
  // ExplicitlySet Flags & Backing Fields (GlobalConfig Priority System)
  // ============================================

  private textFormattersExplicitlySet = signal(false);
  private _textFormatters = signal<CometChatTextFormatter[]>([]);

  // ============================================
  // Inputs
  // ============================================

  /** Title to display in preview - accepts template */
  @Input() previewTitle: TemplateRef<any> | null = null;

  /** Subtitle to display in preview - accepts template */
  @Input() previewSubtitle: TemplateRef<any> | null = null;

  /** Hide the close button */
  @Input() hideCloseButton = false;

  /** Message object being replied to or edited */
  @Input() message?: CometChat.BaseMessage | null; // CometChat.BaseMessage type

  /** Moderation status of the message */
  @Input() isMessageModerated = false;

  /**
   * Text formatters for message bubble.
   * Follows 3-tier priority: @Input > GlobalConfig > default ([])
   */
  @Input()
  set textFormatters(value: CometChatTextFormatter[]) {
    this._textFormatters.set(value);
    this.textFormattersExplicitlySet.set(true);
  }
  get textFormatters(): CometChatTextFormatter[] {
    return this._textFormatters();
  }

  /** Custom ARIA label for the preview container (for screen readers) */
  @Input() ariaLabel?: string;

  /**
   * Preview mode: 'reply' or 'edit'
   * Used to determine appropriate ARIA labels for accessibility
   * @see Requirement 15.5, 15.6
   */
  @Input() mode: MessagePreviewMode = 'reply';

  // ============================================
  // Effective Values (GlobalConfig Priority System)
  // ============================================

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

  /** Emitted when close button is clicked */
  @Output() closeClick = new EventEmitter<void>();

  @ViewChild('elementRef') elementRef!: ElementRef<HTMLDivElement>;

  /** Internal width state for bubble view mode */
  width = 0;

  private resizeObserver: ResizeObserver | null = null;

  /**
   * Returns true if the message has been deleted
   * @see Requirement 7.8
   */
  get isDeleted(): boolean {
    return !!this.message?.getDeletedAt?.();
  }

  /**
   * Returns the localized "message deleted" text
   * @see Requirement 7.8
   */
  get deletedMessageText(): string {
    return CometChatLocalize.getLocalizedString('message_deleted');
  }

  /**
   * Returns the localized close button aria-label based on mode
   * @see Requirement 15.6: aria-label="Cancel reply" or "Cancel edit"
   */
  get closeButtonLabel(): string {
    if (this.mode === 'edit') {
      return CometChatLocalize.getLocalizedString('accessibility_cancel_edit');
    }
    return CometChatLocalize.getLocalizedString('accessibility_cancel_reply');
  }

  /**
   * Returns the default aria-label for the preview container based on mode
   * @see Requirement 15.5: aria-label describing context (replying to/editing)
   */
  get defaultAriaLabel(): string {
    const preview = this.messageContentPreview || '';

    if (this.mode === 'edit') {
      const template = CometChatLocalize.getLocalizedString('accessibility_editing_message');
      return template.replace('{preview}', preview);
    }

    // Reply mode
    const template = CometChatLocalize.getLocalizedString('accessibility_replying_to');
    return template.replace('{sender}', this.senderName).replace('{preview}', preview);
  }

  /**
   * Returns the sender name from the message object.
   * Used when previewTitle template is not provided.
   * @see Requirement 7.2
   */
  get senderName(): string {
    if (!this.message) {
      return '';
    }
    const sender = this.message.getSender?.();
    return sender?.getName?.() || CometChatLocalize.getLocalizedString('unknown');
  }

  /**
   * Returns whether to show the default title (sender name).
   * Shows when no previewTitle template is provided and message exists.
   * @see Requirement 7.2
   */
  get shouldShowDefaultTitle(): boolean {
    return !this.previewTitle && !!this.message;
  }

  /**
   * Returns whether to show the default subtitle (message content).
   * Shows when no previewSubtitle template is provided and message exists.
   * @see Requirements 7.1, 7.3
   */
  get shouldShowDefaultSubtitle(): boolean {
    return !this.previewSubtitle && !!this.message;
  }

  /**
   * Returns the message content preview text.
   * For text messages, returns the text content (truncated via CSS).
   * For media messages, returns localized type description.
   * @see Requirements 7.1, 7.3
   */
  get messageContentPreview(): string {
    if (!this.message) {
      return '';
    }

    const messageType = this.message.getType?.();

    switch (messageType) {
      case MESSAGE_TYPES.TEXT:
        // Return text content - CSS handles truncation with ellipsis
        return (this.message as CometChat.TextMessage).getText?.() || '';
      case MESSAGE_TYPES.IMAGE:
        return CometChatLocalize.getLocalizedString('conversation_subtitle_image');
      case MESSAGE_TYPES.VIDEO:
        return CometChatLocalize.getLocalizedString('conversation_subtitle_video');
      case MESSAGE_TYPES.AUDIO:
        return CometChatLocalize.getLocalizedString('conversation_subtitle_audio');
      case MESSAGE_TYPES.FILE:
        return CometChatLocalize.getLocalizedString('conversation_subtitle_file');
      default:
        // For custom messages or other types
        return CometChatLocalize.getLocalizedString('message');
    }
  }

  /**
   * Returns the CSS class for the media type icon.
   * Used to display appropriate icons for media messages.
   * @see Requirement 7.4
   */
  get mediaIconClass(): string {
    if (!this.message) {
      return 'cometchat-message-preview__subtitle-icon-none';
    }

    const messageType = this.message.getType?.();

    switch (messageType) {
      case MESSAGE_TYPES.IMAGE:
        return 'cometchat-message-preview__subtitle-icon-image';
      case MESSAGE_TYPES.VIDEO:
        return 'cometchat-message-preview__subtitle-icon-video';
      case MESSAGE_TYPES.AUDIO:
        return 'cometchat-message-preview__subtitle-icon-audio';
      case MESSAGE_TYPES.FILE:
        return 'cometchat-message-preview__subtitle-icon-file';
      default:
        return 'cometchat-message-preview__subtitle-icon-none';
    }
  }

  /**
   * Returns whether to show the media icon.
   * Shows for image, video, audio, and file messages.
   * @see Requirement 7.4
   */
  get shouldShowMediaIcon(): boolean {
    if (!this.message) {
      return false;
    }

    const messageType = this.message.getType?.();
    return ([
      MESSAGE_TYPES.IMAGE,
      MESSAGE_TYPES.VIDEO,
      MESSAGE_TYPES.AUDIO,
      MESSAGE_TYPES.FILE,
    ] as string[]).includes(messageType);
  }

  /**
   * Returns the container style based on view mode and moderation status
   */
  get containerStyle(): Record<string, string> {
    if (this.hideCloseButton) {
      const maxWidth = this.width <= 100 ? '105px' : `${this.width}px`;
      if (this.isMessageModerated && this.width < 240) {
        return { width: 'calc(240px - var(--cometchat-padding-1) * 2)' };
      }
      return { maxWidth, width: '100%' };
    }
    return { maxWidth: '100%', width: '100%' };
  }

  /**
   * Returns the CSS class for the container based on view mode
   */
  get containerClass(): string {
    return this.hideCloseButton ? 'cometchat-message-preview--bubble' : 'cometchat-message-preview--composer';
  }

  ngAfterViewInit(): void {
    this.setupResizeObserver();
  }

  ngOnDestroy(): void {
    this.cleanupResizeObserver();
  }

  /**
   * Sets up ResizeObserver for bubble view mode width calculation
   */
  private setupResizeObserver(): void {
    if (!this.hideCloseButton || !this.elementRef?.nativeElement) {
      return;
    }

    const parentNode = this.elementRef.nativeElement.closest(
      '.cometchat-message-bubble__body-reply-view'
    )?.parentNode;
    if (!parentNode) return;

    const contentNode = (parentNode as Element).querySelector(
      '.cometchat-message-bubble__body-content-view'
    ) as HTMLElement | null;
    if (!contentNode) return;

    this.cleanupResizeObserver();

    this.resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const newWidth = entry.contentRect.width;
        if (this.width !== newWidth) {
          this.width = newWidth;
        }
      }
    });

    this.resizeObserver.observe(contentNode);
    this.width = contentNode.offsetWidth;
  }

  /**
   * Cleans up the ResizeObserver
   */
  private cleanupResizeObserver(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
  }

  /**
   * Handles close button click
   */
  handleClose(): void {
    this.closeClick.emit();
  }

  /**
   * Handles keyboard events for close button accessibility.
   * Activates close button on Enter, Space, or Escape key press.
   * @see Requirement 15.2: Enter/Space on close button closes preview
   * @see Requirement 15.3: Escape while preview is visible closes preview
   */
  onCloseKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'Escape') {
      event.preventDefault(); // Prevent default space scrolling
      this.handleClose();
    }
  }

  /**
   * Handles Escape key at component level to close preview
   * @see Requirement 15.3: Escape while preview is visible closes preview
   */
  @HostListener('keydown.escape')
  onEscapeKey(): void {
    if (!this.hideCloseButton) {
      this.handleClose();
    }
  }
}
