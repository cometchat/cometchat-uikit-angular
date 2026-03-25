import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CometChat } from '@cometchat/chat-sdk-javascript';

import { TranslatePipe } from '../../resources/CometChatLocalize/translate.pipe';
import { CometChatLocalize } from '../../resources/CometChatLocalize/cometchat-localize';
import { MessageBubbleAlignment } from '../../Enums/Enums';
import { MediaAttachment, MediaLayoutType } from '../../modals/MediaAttachment';
import {
  extractMediaAttachments,
  extractMediaCaption,
  extractSenderInfo,
  determineMediaLayout,
} from '../../utils/media-bubble-utils';
import { CometChatTextBubbleComponent } from '../cometchat-text-bubble/cometchat-text-bubble.component';
import { CometChatFullScreenViewerComponent } from '../base-elements/cometchat-fullscreen-viewer/cometchat-fullscreen-viewer.component';

/**
 * CometChatImageBubbleComponent
 *
 * A sophisticated image message bubble component that displays image messages with advanced
 * layout capabilities including single image display, multi-image grid layouts, overflow
 * handling, and fullscreen gallery viewer integration.
 *
 * @remarks
 * This component processes CometChat.MediaMessage objects to extract and display image
 * attachments with support for:
 * - Single image display with click-to-expand
 * - Multi-image grid layouts (2-3 images, 2×2 grid for 4 images)
 * - Overflow indicator for messages with >4 images
 * - Caption rendering using TextMessageBubbleComponent
 * - Lazy loading for performance optimization
 * - Sender/receiver styling variants
 * - Full keyboard accessibility and screen reader support
 *
 * @example
 * ```html
 * <cometchat-image-bubble
 *   [message]="imageMessage"
 *   [alignment]="MessageBubbleAlignment.left"
 *   (imageClick)="onImageClick($event)"
 *   (viewerOpen)="onViewerOpen()"
 *   (viewerClose)="onViewerClose()">
 * </cometchat-image-bubble>
 * ```
 *
 * @see Requirements 18.1, 18.6
 */
@Component({
  selector: 'cometchat-image-bubble',
  standalone: true,
  templateUrl: './cometchat-image-bubble.component.html',
  styleUrls: ['./cometchat-image-bubble.component.css'],
  imports: [
    CommonModule,
    TranslatePipe,
    CometChatTextBubbleComponent,
    CometChatFullScreenViewerComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CometChatImageBubbleComponent implements OnInit, OnChanges {
  // ============================================
  // Inputs
  // ============================================

  /**
   * The media message object containing image attachments and metadata.
   *
   * @remarks
   * This is a required input. The component extracts attachments, caption text,
   * and sender information from this message object.
   *
   * @see Requirements 1.1, 1.3, 1.5
   */
  @Input({ required: true }) message!: CometChat.MediaMessage;

  /**
   * The alignment of the message bubble.
   *
   * @remarks
   * LEFT for incoming/receiver messages, RIGHT for outgoing/sender messages.
   *
   * @default MessageBubbleAlignment.left
   * @see Requirements 1.5, 13.1, 13.2
   */
  @Input() alignment: MessageBubbleAlignment = MessageBubbleAlignment.left;

  /**
   * When true, disables click-to-open fullscreen viewer interaction.
   * Images are still displayed but clicking them does nothing.
   *
   * @default false
   */
  @Input() disableInteraction = false;

  // ============================================
  // Outputs
  // ============================================

  /**
   * Emitted when an image is clicked.
   *
   * @remarks
   * The event payload contains the clicked attachment object and its index.
   *
   * @see Requirements 17.1
   */
  @Output() imageClick = new EventEmitter<{ attachment: MediaAttachment; index: number }>();

  /**
   * Emitted when the fullscreen gallery viewer is opened.
   *
   * @see Requirements 17.3
   */
  @Output() viewerOpen = new EventEmitter<void>();

  /**
   * Emitted when the fullscreen gallery viewer is closed.
   *
   * @see Requirements 17.4
   */
  @Output() viewerClose = new EventEmitter<void>();

  // ============================================
  // Internal State
  // ============================================

  /** Extracted image attachments from the message */
  protected attachments: MediaAttachment[] = [];

  /** Caption text extracted from the message */
  protected captionText = '';

  /** Whether this is an outgoing message (sender is logged-in user) */
  protected isOutgoing = false;

  /** The determined layout type based on attachment count */
  protected layoutType: MediaLayoutType = 'single';

  /** Count of overflow images (for >4 attachments) */
  protected overflowCount = 0;

  /** Whether the gallery viewer is currently shown */
  protected showGalleryViewer = false;

  /** Starting index for the gallery viewer */
  protected galleryStartIndex = 0;

  /** Sender name for viewer header */
  protected senderName = '';

  /** Sender avatar URL for viewer header */
  protected senderAvatarUrl = '';

  // ============================================
  // Template Exposed Properties
  // ============================================

  /** Expose MessageBubbleAlignment enum to template */
  readonly MessageBubbleAlignment = MessageBubbleAlignment;

  // ============================================
  // Constructor
  // ============================================

  constructor(private cdr: ChangeDetectorRef) {}

  // ============================================
  // Lifecycle Hooks
  // ============================================

  ngOnInit(): void {
    this.processMessage();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['message'] || changes['alignment']) {
      this.processMessage();
    }
  }

  // ============================================
  // Private Methods
  // ============================================

  /**
   * Process the message to extract attachments, caption, and determine layout.
   *
   * @see Requirements 1.1, 1.3, 1.5
   */
  private processMessage(): void {
    // Extract attachments from the message
    this.attachments = this.extractAttachments();

    // Extract caption text
    this.captionText = this.extractCaption();

    // Extract sender information
    this.extractSenderInfo();

    // Determine if message is outgoing based on alignment
    // The alignment input is set by the parent component based on sender comparison
    this.determineAlignment();

    // Determine layout based on attachment count (will be implemented in Task 3.1)
    this.determineLayout();

    // Trigger change detection
    this.cdr.markForCheck();
  }

  /**
   * Extract attachments from the message.
   *
   * @returns Array of MediaAttachment objects
   * @see Requirements 1.1, 1.7, 1.8, 1.9
   */
  private extractAttachments(): MediaAttachment[] {
    return extractMediaAttachments(this.message, 'image', 'CometChatImageBubble');
  }

  /**
   * Extract caption text from the message.
   *
   * @remarks
   * Tries to extract caption from message.getText() first, then falls back to
   * message.getData()?.text if getText() is empty. Returns empty string if neither exists.
   * Handles malformed metadata gracefully with optional chaining and type checking.
   *
   * @returns Caption text or empty string
   * @see Requirements 1.3
   */
  private extractCaption(): string {
    return extractMediaCaption(this.message, 'CometChatImageBubble');
  }

  /**
   * Extract sender information from the message.
   *
   * @remarks
   * Extracts sender name and avatar URL for display in the fullscreen viewer header.
   */
  private extractSenderInfo(): void {
    const info = extractSenderInfo(this.message, 'CometChatImageBubble');
    this.senderName = info.senderName;
    this.senderAvatarUrl = info.senderAvatarUrl;
  }

  /**
   * Determine the layout type based on attachment count.
   *
   * @remarks
   * Layout determination logic:
   * - 1 attachment → 'single'
   * - 2-3 attachments → 'grid'
   * - 4 attachments → 'grid-2x2'
   * - >4 attachments → 'overflow'
   *
   * For overflow layout (>4 attachments), also calculates the overflow count
   * which is the number of hidden attachments (total - 4).
   *
   * @see Requirements 2.1, 3.1, 3.2, 4.1, 4.2
   */
  private determineLayout(): void {
    const result = determineMediaLayout(this.attachments.length);
    this.layoutType = result.layoutType;
    this.overflowCount = result.overflowCount;
  }

  /**
   * Determine if the message is outgoing based on alignment.
   *
   * @remarks
   * The alignment input is provided by the parent component, which compares
   * the message sender UID with the logged-in user UID. This method simply
   * computes the isOutgoing boolean for styling purposes.
   *
   * When alignment is RIGHT, the message is outgoing (sent by logged-in user).
   * When alignment is LEFT, the message is incoming (received from another user).
   *
   * @see Requirements 1.5
   */
  private determineAlignment(): void {
    // Compute isOutgoing based on alignment
    // RIGHT alignment = outgoing message (sender is logged-in user)
    // LEFT alignment = incoming message (sender is another user)
    this.isOutgoing = this.alignment === MessageBubbleAlignment.right;
  }

  // ============================================
  // Protected Methods (Template Access)
  // ============================================

  /**
   * Handle image click event.
   *
   * @param index - The index of the clicked image
   * @see Requirements 2.5, 3.5, 17.1
   */
  protected onImageClick(index: number): void {
    if (this.disableInteraction) return;

    // Validate index
    if (index < 0 || index >= this.attachments.length) {
      console.warn(`[CometChatImageBubble] Invalid image index: ${index}`);
      return;
    }

    // Get the clicked attachment
    const attachment = this.attachments[index];

    // Emit imageClick event with attachment and index
    this.imageClick.emit({ attachment, index });

    // Open gallery viewer at the clicked image index
    this.openGalleryViewer(index);
  }

  /**
   * Open the gallery viewer at the specified index.
   *
   * @remarks
   * This method sets the gallery viewer state to open, sets the starting index
   * for the gallery, and emits the viewerOpen event. The gallery viewer component
   * will be rendered conditionally based on the showGalleryViewer flag.
   *
   * @param startIndex - The starting image index for the gallery viewer
   * @see Requirements 17.3
   */
  protected openGalleryViewer(startIndex: number): void {
    // Set gallery viewer state to open
    this.showGalleryViewer = true;

    // Set the starting index for the gallery
    this.galleryStartIndex = startIndex;

    // Emit viewerOpen event
    this.viewerOpen.emit();

    // Trigger change detection
    this.cdr.markForCheck();
  }

  /**
   * Close the gallery viewer.
   *
   * @remarks
   * This method sets the gallery viewer state to closed and emits the viewerClose
   * event. This method is called when the user closes the gallery viewer through
   * the close button, escape key, or background click.
   *
   * @see Requirements 17.4
   */
  protected closeGalleryViewer(): void {
    // Set gallery viewer state to closed
    this.showGalleryViewer = false;

    // Emit viewerClose event
    this.viewerClose.emit();

    // Trigger change detection
    this.cdr.markForCheck();
  }

  /**
   * Get the localized overflow text (e.g., "+3 more").
   *
   * @remarks
   * This method returns a localized string in the format "+N more" where N is the
   * overflow count (number of hidden images beyond the first 4).
   *
   * The localization key used is 'image_bubble_overflow_more' which should be
   * defined in all language files with a placeholder for the count.
   *
   * @returns Localized overflow text
   * @see Requirements 4.4, 15.1
   */
  protected getOverflowText(): string {
    // Use localized format: "+N more"
    const template = CometChatLocalize.getLocalizedString('image_bubble_overflow_more');
    return template.replace('{count}', this.overflowCount.toString());
  }

  // ============================================
  // Accessibility Methods
  // ============================================

  /**
   * Handles keyboard events on image wrapper.
   * Opens fullscreen viewer on Enter or Space key press.
   *
   * @param event - The keyboard event
   * @param index - The index of the image
   * @see Requirements 9.1, 9.2
   */
  protected onImageKeyDown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.onImageClick(index);
    }
  }

  /**
   * Gets aria-label for image based on whether caption is present.
   *
   * @returns Localized aria-label string
   * @see Requirements 9.5
   */
  protected get imageAriaLabel(): string {
    if (this.captionText) {
      return CometChatLocalize.getLocalizedString('accessibility_image_with_caption').replace(
        '{caption}',
        this.captionText
      );
    }
    return CometChatLocalize.getLocalizedString('accessibility_view_image');
  }

  /**
   * Gets aria-label for overflow indicator showing count of additional images.
   *
   * @returns Localized aria-label string
   * @see Requirements 9.6
   */
  protected get overflowAriaLabel(): string {
    return CometChatLocalize.getLocalizedString('accessibility_show_more_images').replace(
      '{count}',
      this.overflowCount.toString()
    );
  }

  /**
   * TrackBy function for *ngFor over media attachments.
   *
   * Uses the attachment URL as a stable unique identifier to prevent
   * unnecessary DOM re-creation when the list is re-rendered.
   *
   * @param index - The index of the item in the list
   * @param attachment - The media attachment
   * @returns The attachment URL as a stable identifier
   * @see Requirements 2.2
   */
  protected trackByAttachment(index: number, attachment: MediaAttachment): string {
    return attachment.url || index.toString();
  }
}
