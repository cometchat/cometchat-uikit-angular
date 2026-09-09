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
import { CometChatTextFormatter } from '../../formatters/cometchat-text-formatter';

// Re-export types for backward compatibility
export type { MediaAttachment, MediaLayoutType } from '../../modals/MediaAttachment';

/**
 * CometChatVideoBubbleComponent displays video messages with single/grid/overflow layouts
 * and fullscreen player integration.
 *
 * @see Requirements 18.2, 18.6
 * @deprecated Prefer {@link CometChatVideosBubbleComponent}, which the message bubble now renders
 * for every video message. This bubble stays public for direct use and remains the internal
 * primitive that the new bubble delegates to.
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
  /**
   * Formatters applied to the caption's text. Passed straight through to the
   * text bubble that renders it, which owns the formatting itself — this bubble
   * only forwards what the caller supplied.
   */
  @Input() textFormatters?: CometChatTextFormatter[];

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
  /**
   * Indices parked between a failed thumbnail attempt and its retry. While parked the <video> is not
   * rendered, so re-adding it mounts a fresh element that re-requests the source.
   */
  protected reloadingThumbnails = new Set<number>();
  /** Failed thumbnail attempts so far, per index. */
  private thumbnailRetryCounts = new Map<number, number>();

  /**
   * A just-sent video routinely 403s for a moment before the CDN serves it, so the FIRST failure is
   * not proof the media is broken. Retry once before falling back to the blank placeholder.
   */
  private static readonly MAX_THUMBNAIL_RETRIES = 1;
  private static readonly THUMBNAIL_RETRY_DELAY_MS = 700;

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
    // Reset per message. Without this a thumbnail that failed once — e.g. against a pending
    // message's URL, before the CDN began serving it — stayed blank for the life of the component,
    // even after the sent message arrived with a perfectly good URL.
    this.failedThumbnails = new Set<number>();
    this.reloadingThumbnails = new Set<number>();
    this.thumbnailRetryCounts.clear();
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

  /**
   * Duration-badge fallback. `attachment.duration` only exists when the backend put it in metadata,
   * which most messages don't. The thumbnail `<video preload="metadata">` already fetches the file
   * header, so read the real duration off it rather than downloading anything extra — the React kit
   * does the same via its `useVideoDuration` hook. Backend metadata always wins when present.
   */
  protected onThumbnailMetadata(index: number, event: Event): void {
    const attachment = this.attachments[index];
    if (!attachment || attachment.duration) {
      return;
    }
    const duration = (event.target as HTMLVideoElement | null)?.duration;
    if (typeof duration === 'number' && Number.isFinite(duration) && duration > 0) {
      attachment.duration = duration;
      this.cdr.markForCheck();
    }
  }

  protected onThumbnailError(index: number, attachment: MediaAttachment): void {
    // A <video> keeps showing its `poster=` image when the media itself fails to load/decode (403,
    // unsupported codec, expired URL). So only fall back to the blank placeholder when there is NO
    // backend poster to preserve — otherwise we'd throw away a perfectly good poster and show a gray
    // box, which would be a regression vs the old <img [src]="displayUrl">.
    if (this.getThumbnailPoster(attachment)) {
      return;
    }
    // Don't take the first failure as final — a freshly-sent video 403s briefly before the CDN
    // serves it. Park the element, remount it shortly after so a new <video> re-requests the source,
    // and only fall back to the blank placeholder once that retry has failed too.
    const attempts = this.thumbnailRetryCounts.get(index) ?? 0;
    if (attempts < CometChatVideoBubbleComponent.MAX_THUMBNAIL_RETRIES) {
      this.thumbnailRetryCounts.set(index, attempts + 1);
      this.reloadingThumbnails = new Set(this.reloadingThumbnails).add(index);
      this.cdr.markForCheck();
      this.pendingTimers.push(
        setTimeout(() => {
          const next = new Set(this.reloadingThumbnails);
          next.delete(index);
          this.reloadingThumbnails = next;
          this.cdr.markForCheck();
        }, CometChatVideoBubbleComponent.THUMBNAIL_RETRY_DELAY_MS)
      );
      return;
    }
    this.failedThumbnails.add(index);
    this.cdr.markForCheck();
  }

  /**
   * Whether the first-frame <video> should be mounted for this index — i.e. it has not been given up
   * on and is not parked awaiting a retry (that gap is what lets the retry mount a fresh element).
   */
  protected shouldShowThumbnail(index: number): boolean {
    return !this.failedThumbnails.has(index) && !this.reloadingThumbnails.has(index);
  }

  /**
   * Builds the <video> src used to paint a video's FIRST FRAME as the tile thumbnail.
   *
   * An <img> cannot decode a video file — that is why the old `<img [src]="url">` tiles were blank
   * whenever the backend had no generated poster (the img fired an error and fell back to the empty
   * placeholder). A <video> element paints the frame natively; the `#t=0.1` media fragment tells the
   * browser to seek to 0.1s and render that frame (supported in Chrome/Firefox/Safari 15+), so we get
   * a real preview even with no poster — as long as the video URL is reachable in the browser.
   */
  protected getThumbnailVideoSrc(attachment: MediaAttachment): string {
    const src = attachment.url ?? '';
    if (!src) {
      return '';
    }
    // Media fragments live after any query string; don't double-append if already present.
    return src.includes('#t=') ? src : `${src}#t=0.1`;
  }

  /**
   * Returns a real backend-generated poster (from the Thumbnail Generation extension) when one exists,
   * so the tile shows it immediately while the video's own first frame decodes. Returns null when the
   * only `displayUrl` we have is the video file itself (which is NOT a usable poster image).
   */
  protected getThumbnailPoster(attachment: MediaAttachment): string | null {
    const poster = attachment.displayUrl;
    return poster && poster !== attachment.url ? poster : null;
  }
}
