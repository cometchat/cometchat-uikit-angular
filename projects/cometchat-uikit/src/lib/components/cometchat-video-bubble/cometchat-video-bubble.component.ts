import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ViewChild,
  ElementRef,
  inject,
} from '@angular/core';
import { CometChatLogger } from '../../utils/CometChatLogger';
import { CommonModule } from '@angular/common';

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
import { MediaControlsService } from '../../services/media-controls.service';

/**
 * CometChatVideoBubbleComponent
 *
 * A sophisticated video message bubble component that displays video messages with advanced
 * layout capabilities including single video display, multi-video grid layouts, overflow
 * handling, and fullscreen video player integration.
 *
 * @remarks
 * This component processes CometChat.MediaMessage objects to extract and display video
 * attachments with support for:
 * - Single video display with thumbnail and play button overlay
 * - Multi-video grid layouts (2-3 videos, 2×2 grid for 4 videos)
 * - Overflow indicator for messages with >4 videos
 * - Duration badges for video length display
 * - Caption rendering using TextMessageBubbleComponent
 * - Lazy loading for performance optimization
 * - Sender/receiver styling variants
 * - Full keyboard accessibility and screen reader support
 *
 * @example
 * ```html
 * <cometchat-video-bubble
 *   [message]="videoMessage"
 *   [alignment]="MessageBubbleAlignment.left"
 *   (videoClick)="onVideoClick($event)"
 *   (playerOpen)="onPlayerOpen()"
 *   (playerClose)="onPlayerClose()">
 * </cometchat-video-bubble>
 * ```
 *
 * @see Requirements 18.2, 18.6
 */
@Component({
  selector: 'cometchat-video-bubble',
  standalone: true,
  templateUrl: './cometchat-video-bubble.component.html',
  styleUrls: ['./cometchat-video-bubble.component.css'],
  imports: [
    CommonModule,
    CometChatTextBubbleComponent,
    CometChatFullScreenViewerComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CometChatVideoBubbleComponent implements OnInit, OnChanges, OnDestroy {
  /** @internal Timer references for cleanup */
  private pendingTimers: ReturnType<typeof setTimeout>[] = [];

  // ============================================
  // Inputs
  // ============================================

  /**
   * The media message object containing video attachments and metadata.
   *
   * @remarks
   * This is a required input. The component extracts attachments, caption text,
   * and sender information from this message object.
   *
   * @see Requirements 1.2, 1.4, 1.6
   */
  @Input({ required: true }) message!: CometChat.MediaMessage;

  /**
   * The alignment of the message bubble.
   *
   * @remarks
   * LEFT for incoming/receiver messages, RIGHT for outgoing/sender messages.
   *
   * @default MessageBubbleAlignment.left
   * @see Requirements 1.6, 13.3, 13.4
   */
  @Input() alignment: MessageBubbleAlignment = MessageBubbleAlignment.left;

  /**
   * When true, disables click-to-open fullscreen viewer interaction.
   * Videos are still displayed but clicking them does nothing.
   *
   * @default false
   */
  @Input() disableInteraction = false;

  // ============================================
  // Outputs
  // ============================================

  /**
   * Emitted when a video thumbnail is clicked.
   *
   * @remarks
   * The event payload contains the clicked attachment object and its index.
   *
   * @see Requirements 17.2
   */
  @Output() videoClick = new EventEmitter<{ attachment: MediaAttachment; index: number }>();

  /**
   * Emitted when the fullscreen video player is opened.
   *
   * @see Requirements 17.5
   */
  @Output() playerOpen = new EventEmitter<void>();

  /**
   * Emitted when the fullscreen video player is closed.
   *
   * @see Requirements 17.6
   */
  @Output() playerClose = new EventEmitter<void>();

  // ============================================
  // Internal State
  // ============================================

  /** Extracted video attachments from the message */
  protected attachments: MediaAttachment[] = [];

  /** Caption text extracted from the message */
  protected captionText = '';

  /** Whether this is an outgoing message (sender is logged-in user) */
  protected isOutgoing = false;

  /** The determined layout type based on attachment count */
  protected layoutType: MediaLayoutType = 'single';

  /** Count of overflow videos (for >4 attachments) */
  protected overflowCount = 0;

  /** Whether the player viewer is currently shown */
  protected showPlayerViewer = false;

  /** Starting index for the player viewer */
  protected playerStartIndex = 0;

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
  // Picture-in-Picture State
  // ============================================

  /** Reference to the hidden PIP video element */
  @ViewChild('pipVideoElement') pipVideoElement?: ElementRef<HTMLVideoElement>;

  /** Whether PIP mode is currently active */
  protected isPipActive = false;

  /** URL of the video currently in PIP mode */
  protected pipVideoUrl = '';

  /** PIP event listener references for cleanup */
  private pipEnterListener: (() => void) | null = null;
  private pipLeaveListener: (() => void) | null = null;

  /** Set of attachment indices whose thumbnails failed to load */
  protected failedThumbnails = new Set<number>();

  // ============================================
  // Constructor
  // ============================================

  /** MediaControlsService for accessibility time formatting */
  private mediaControlsService = inject(MediaControlsService);

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

  ngOnDestroy(): void {
    this.pendingTimers.forEach(t => clearTimeout(t));
    this.pendingTimers = [];
    // Clean up PIP if active
    this.cleanupPip();
  }

  // ============================================
  // Private Methods
  // ============================================

  /**
   * Process the message to extract attachments, caption, and determine layout.
   *
   * @see Requirements 1.2, 1.4, 1.6
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

    // Determine layout based on attachment count
    this.determineLayout();

    // Trigger change detection
    this.cdr.markForCheck();
  }

  /**
   * Extract attachments from the message.
   *
   * @remarks
   * Extracts video attachments including URL, thumbnail, duration, width, height, size, and mimeType.
   * Handles null/undefined message and malformed attachment data gracefully.
   *
   * @returns Array of MediaAttachment objects
   * @see Requirements 1.2, 1.7, 1.8, 1.9, 1.10
   */
  private extractAttachments(): MediaAttachment[] {
    return extractMediaAttachments(this.message, 'video', 'CometChatVideoBubble');
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
   * @see Requirements 1.4
   */
  private extractCaption(): string {
    return extractMediaCaption(this.message, 'CometChatVideoBubble');
  }

  /**
   * Extract sender information from the message.
   *
   * @remarks
   * Extracts sender name and avatar URL for display in the fullscreen viewer header.
   */
  private extractSenderInfo(): void {
    const info = extractSenderInfo(this.message, 'CometChatVideoBubble');
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
   * @see Requirements 6.1, 7.1, 7.2, 8.1, 8.2
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
   * @see Requirements 1.6
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
   * Handle video click event.
   *
   * @param index - The index of the clicked video
   * @see Requirements 6.5, 7.5, 17.2
   */
  protected onVideoClick(index: number): void {
    if (this.disableInteraction) return;

    CometChatLogger.debug('CometChatVideoBubble', 'onVideoClick called with index:', index);

    // Validate index
    if (index < 0 || index >= this.attachments.length) {
      console.warn(`[CometChatVideoBubble] Invalid video index: ${index}`);
      return;
    }

    // Get the clicked attachment
    const attachment = this.attachments[index];

    // Emit videoClick event with attachment and index
    this.videoClick.emit({ attachment, index });

    // Open player viewer at the clicked video index
    this.openPlayerViewer(index);
  }

  /**
   * Open the player viewer at the specified index.
   *
   * @remarks
   * This method sets the player viewer state to open, sets the starting index
   * for the player, and emits the playerOpen event. The player viewer component
   * will be rendered conditionally based on the showPlayerViewer flag.
   *
   * @param startIndex - The starting video index for the player viewer
   * @see Requirements 17.5
   */
  protected openPlayerViewer(startIndex: number): void {
    // Set player viewer state to open
    this.showPlayerViewer = true;

    // Set the starting index for the player
    this.playerStartIndex = startIndex;

    // Emit playerOpen event
    this.playerOpen.emit();

    // Trigger change detection
    this.cdr.markForCheck();
  }

  /**
   * Close the player viewer.
   *
   * @remarks
   * This method sets the player viewer state to closed and emits the playerClose
   * event. This method is called when the user closes the player viewer through
   * the close button, escape key, or background click.
   *
   * @see Requirements 17.6
   */
  protected closePlayerViewer(): void {
    // Set player viewer state to closed
    this.showPlayerViewer = false;

    // Emit playerClose event
    this.playerClose.emit();

    // Trigger change detection
    this.cdr.markForCheck();
  }

  /**
   * Get the localized overflow text (e.g., "+3 more").
   *
   * @remarks
   * This method returns a localized string in the format "+N more" where N is the
   * overflow count (number of hidden videos beyond the first 4).
   *
   * The localization key used is 'video_bubble_overflow_more' which should be
   * defined in all language files with a placeholder for the count.
   *
   * @returns Localized overflow text
   * @see Requirements 8.4, 15.2
   */
  protected getOverflowText(): string {
    // Use localized format: "+N more"
    const template = CometChatLocalize.getLocalizedString('video_bubble_overflow_more');
    return template.replace('{count}', this.overflowCount.toString());
  }

  /**
   * Format video duration in seconds to display format (M:SS or H:MM:SS).
   *
   * @remarks
   * Formats duration as:
   * - "M:SS" for durations less than 1 hour (e.g., "2:05" for 125 seconds)
   * - "H:MM:SS" for durations 1 hour or more (e.g., "1:01:05" for 3665 seconds)
   *
   * @param seconds - Duration in seconds
   * @returns Formatted duration string
   * @see Requirements 6.4
   */
  protected formatDuration(seconds: number): string {
    // Handle invalid input
    if (!seconds || seconds < 0 || !isFinite(seconds)) {
      return '0:00';
    }

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      // Format as H:MM:SS
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      // Format as M:SS
      return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
  }

  // ============================================
  // Accessibility Methods
  // ============================================

  /**
   * Gets the accessible aria-label for a video thumbnail.
   * Includes "Play video" and duration information for screen readers.
   *
   * @param index - The index of the video attachment
   * @returns Localized aria-label string with duration
   * @see Requirements 8.6
   */
  protected getThumbnailAriaLabel(index: number): string {
    const attachment = this.attachments[index];
    if (!attachment) {
      return CometChatLocalize.getLocalizedString('video_bubble_play_video');
    }

    // Format duration for screen reader announcement
    const duration = attachment.duration || 0;
    const durationText = this.mediaControlsService.formatTimeForAnnouncement(duration);

    // Use localized string with duration placeholder
    const template = CometChatLocalize.getLocalizedString('accessibility_play_video');
    return template.replace('{duration}', durationText);
  }

  /**
   * Gets the accessible aria-label for the overflow indicator.
   * Announces how many more videos are available.
   *
   * @returns Localized aria-label string with count
   * @see Requirements 8.7
   */
  protected getOverflowAriaLabel(): string {
    const template = CometChatLocalize.getLocalizedString('accessibility_show_more_videos');
    return template.replace('{count}', this.overflowCount.toString());
  }

  /**
   * Handles keyboard events on video thumbnail for accessibility.
   * Opens fullscreen viewer on Enter or Space key press.
   *
   * @param event - The keyboard event
   * @param index - The index of the video to open
   * @see Requirements 8.2
   */
  protected onThumbnailKeyDown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.onVideoClick(index);
    }
  }

  // ============================================
  // Picture-in-Picture Methods
  // ============================================

  /**
   * Handle PIP state change from fullscreen viewer.
   * When PIP is activated, we close the fullscreen viewer.
   * Note: The PIP window is managed by the browser independently once activated,
   * so closing the fullscreen viewer won't affect the PIP playback.
   *
   * @param isPipActive - Whether PIP mode is now active
   */
  protected onPipStateChange(isPipActive: boolean): void {
    CometChatLogger.debug('CometChatVideoBubble', 'onPipStateChange:', isPipActive);

    if (isPipActive) {
      // PIP was activated - close the fullscreen viewer
      // The browser's PIP window will continue playing independently
      this.isPipActive = true;

      // Get the current video URL for reference
      if (this.attachments.length > 0 && this.playerStartIndex < this.attachments.length) {
        this.pipVideoUrl = this.attachments[this.playerStartIndex].url;
      }

      // Close the fullscreen viewer after a short delay to ensure PIP is established
      this.pendingTimers.push(setTimeout(() => {
        this.showPlayerViewer = false;
        this.playerClose.emit();
        this.cdr.markForCheck();
      }, 150));
    } else {
      // PIP was deactivated
      this.isPipActive = false;
      this.pipVideoUrl = '';
      this.cdr.markForCheck();
    }
  }

  /**
   * Handle when the fullscreen viewer requests to close while PIP is active.
   * This is called when the user clicks close on the fullscreen viewer after
   * activating PIP. We need to transfer the video to a hidden element.
   */
  protected onViewerCloseWithPip(): void {
    // Close the fullscreen viewer
    this.showPlayerViewer = false;
    this.playerClose.emit();
    this.cdr.markForCheck();
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

  /**
   * Handles thumbnail image load errors by marking the index as failed.
   * The template uses this to show a CSS placeholder instead.
   */
  protected onThumbnailError(index: number): void {
    this.failedThumbnails.add(index);
  }

  /**
   * Clean up PIP resources when component is destroyed.
   */
  private cleanupPip(): void {
    // Exit PIP if active
    if (this.isPipActive && (document as any).pictureInPictureElement) {
      try {
        (document as any).exitPictureInPicture();
      } catch (error) {
        console.warn('[VideoBubble] Error exiting PIP on cleanup:', error);
      }
    }

    // Remove event listeners
    if (this.pipVideoElement?.nativeElement) {
      const video = this.pipVideoElement.nativeElement;
      if (this.pipEnterListener) {
        video.removeEventListener('enterpictureinpicture', this.pipEnterListener);
      }
      if (this.pipLeaveListener) {
        video.removeEventListener('leavepictureinpicture', this.pipLeaveListener);
      }
    }

    this.pipEnterListener = null;
    this.pipLeaveListener = null;
    this.isPipActive = false;
    this.pipVideoUrl = '';
  }
}
