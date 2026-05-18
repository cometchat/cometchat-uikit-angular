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
import { formatVideoDuration, cleanupPipResources } from './cometchat-video-bubble.utils';

// Re-export types for backward compatibility
export type { MediaAttachment, MediaLayoutType } from '../../modals/MediaAttachment';

/**
 * CometChatVideoBubbleComponent displays video messages with single/grid/overflow layouts
 * and fullscreen player integration.
 *
 * @see Requirements 18.2, 18.6
 */
@Component({
  selector: 'cometchat-video-bubble',
  standalone: true,
  templateUrl: './cometchat-video-bubble.component.html',
  styleUrls: ['./cometchat-video-bubble.component.css'],
  imports: [CommonModule, CometChatTextBubbleComponent, CometChatFullScreenViewerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CometChatVideoBubbleComponent implements OnInit, OnChanges, OnDestroy {
  /** @internal Timer references for cleanup */
  private pendingTimers: ReturnType<typeof setTimeout>[] = [];

  // ============================================
  // Inputs
  // ============================================

  /** The media message containing video attachments. Required. */
  @Input({ required: true }) message!: CometChat.MediaMessage;

  /** LEFT for incoming, RIGHT for outgoing messages. */
  @Input() alignment: MessageBubbleAlignment = MessageBubbleAlignment.left;

  /** When true, disables click-to-open fullscreen viewer. */
  @Input() disableInteraction = false;

  // ============================================
  // Outputs
  // ============================================

  /** Emitted when a video thumbnail is clicked. */
  @Output() videoClick = new EventEmitter<{ attachment: MediaAttachment; index: number }>();

  /** Emitted when the fullscreen video player is opened. */
  @Output() playerOpen = new EventEmitter<void>();

  /** Emitted when the fullscreen video player is closed. */
  @Output() playerClose = new EventEmitter<void>();

  // ============================================
  // Internal State
  // ============================================

  protected attachments: MediaAttachment[] = [];
  protected captionText = '';
  protected isOutgoing = false;
  protected layoutType: MediaLayoutType = 'single';
  protected overflowCount = 0;
  protected showPlayerViewer = false;
  protected playerStartIndex = 0;
  protected senderName = '';
  protected senderAvatarUrl = '';
  protected failedThumbnails = new Set<number>();

  readonly MessageBubbleAlignment = MessageBubbleAlignment;

  // ============================================
  // Picture-in-Picture State
  // ============================================

  @ViewChild('pipVideoElement') pipVideoElement?: ElementRef<HTMLVideoElement>;
  protected isPipActive = false;
  protected pipVideoUrl = '';
  private pipEnterListener: (() => void) | null = null;
  private pipLeaveListener: (() => void) | null = null;

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
    cleanupPipResources(this.isPipActive, this.pipVideoElement?.nativeElement ?? null,
      this.pipEnterListener, this.pipLeaveListener);
    this.pipEnterListener = null;
    this.pipLeaveListener = null;
    this.isPipActive = false;
    this.pipVideoUrl = '';
  }

  // ============================================
  // Private Methods
  // ============================================

  private processMessage(): void {
    this.attachments = extractMediaAttachments(this.message, 'video', 'CometChatVideoBubble');
    this.captionText = extractMediaCaption(this.message, 'CometChatVideoBubble');
    const info = extractSenderInfo(this.message, 'CometChatVideoBubble');
    this.senderName = info.senderName;
    this.senderAvatarUrl = info.senderAvatarUrl;
    this.isOutgoing = this.alignment === MessageBubbleAlignment.right;
    const result = determineMediaLayout(this.attachments.length);
    this.layoutType = result.layoutType;
    this.overflowCount = result.overflowCount;
    this.cdr.markForCheck();
  }

  // ============================================
  // Protected Methods (Template Access)
  // ============================================

  protected onVideoClick(index: number): void {
    if (this.disableInteraction) return;
    if (index < 0 || index >= this.attachments.length) {
      CometChatLogger.warn('CometChatVideoBubble', `Invalid video index: ${index}`);
      return;
    }
    this.videoClick.emit({ attachment: this.attachments[index], index });
    this.openPlayerViewer(index);
  }

  protected openPlayerViewer(startIndex: number): void {
    this.showPlayerViewer = true;
    this.playerStartIndex = startIndex;
    this.playerOpen.emit();
    this.cdr.markForCheck();
  }

  protected closePlayerViewer(): void {
    this.showPlayerViewer = false;
    this.playerClose.emit();
    this.cdr.markForCheck();
  }

  protected getOverflowText(): string {
    const template = CometChatLocalize.getLocalizedString('video_bubble_overflow_more');
    return template.replace('{count}', this.overflowCount.toString());
  }

  protected formatDuration(seconds: number): string {
    return formatVideoDuration(seconds);
  }

  // ============================================
  // Accessibility Methods
  // ============================================

  protected getThumbnailAriaLabel(index: number): string {
    const attachment = this.attachments[index];
    if (!attachment) return CometChatLocalize.getLocalizedString('video_bubble_play_video');
    // If duration is 0 or unknown, use a generic "play video" label
    if (!attachment.duration) {
      return CometChatLocalize.getLocalizedString('video_bubble_play_video');
    }
    const durationText = this.mediaControlsService.formatTimeForAnnouncement(attachment.duration);
    return CometChatLocalize.getLocalizedString('accessibility_play_video')
      .replace('{duration}', durationText);
  }

  protected getOverflowAriaLabel(): string {
    return CometChatLocalize.getLocalizedString('accessibility_show_more_videos')
      .replace('{count}', this.overflowCount.toString());
  }

  protected onThumbnailKeyDown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.onVideoClick(index);
    }
  }

  // ============================================
  // Picture-in-Picture Methods
  // ============================================

  protected onPipStateChange(isPipActive: boolean): void {
    CometChatLogger.debug('CometChatVideoBubble', 'onPipStateChange:', isPipActive);
    if (isPipActive) {
      this.isPipActive = true;
      if (this.attachments.length > 0 && this.playerStartIndex < this.attachments.length) {
        this.pipVideoUrl = this.attachments[this.playerStartIndex].url;
      }
      this.pendingTimers.push(setTimeout(() => {
        this.showPlayerViewer = false;
        this.playerClose.emit();
        this.cdr.markForCheck();
      }, 150));
    } else {
      this.isPipActive = false;
      this.pipVideoUrl = '';
      this.cdr.markForCheck();
    }
  }

  protected onViewerCloseWithPip(): void {
    this.showPlayerViewer = false;
    this.playerClose.emit();
    this.cdr.markForCheck();
  }

  protected trackByAttachment(index: number, attachment: MediaAttachment): string {
    return attachment.url || index.toString();
  }

  protected onThumbnailError(index: number): void {
    this.failedThumbnails.add(index);
  }
}
