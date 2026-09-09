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
  NgZone,
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
import { CometChatLogger } from '../../utils/CometChatLogger';
import { CometChatTextFormatter } from '../../formatters/cometchat-text-formatter';

/**
 * CometChatImageBubbleComponent renders image messages with single/multi-image layouts,
 * overflow handling, fullscreen gallery, and keyboard accessibility.
 * @see Requirements 18.1, 18.6
 * @deprecated Prefer {@link CometChatImagesBubbleComponent}, which the message bubble now renders
 * for every image message. This bubble stays public for direct use and remains the internal
 * primitive that the new bubble delegates to.
 */
@Component({
  selector: 'cometchat-image-bubble',
  standalone: true,
  templateUrl: './cometchat-image-bubble.component.html',
  styleUrls: ['./cometchat-image-bubble.component.css'],
  imports: [CommonModule, TranslatePipe, CometChatTextBubbleComponent, CometChatFullScreenViewerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CometChatImageBubbleComponent implements OnInit, OnChanges, OnDestroy {
  /** The media message object. @see Requirements 1.1, 1.3, 1.5 */
  @Input({ required: true }) message!: CometChat.MediaMessage;

  /** LEFT for incoming, RIGHT for outgoing. @see Requirements 1.5, 13.1, 13.2 */
  @Input() alignment: MessageBubbleAlignment = MessageBubbleAlignment.left;
  /**
   * Formatters applied to the caption's text. Passed straight through to the
   * text bubble that renders it, which owns the formatting itself — this bubble
   * only forwards what the caller supplied.
   */
  @Input() textFormatters?: CometChatTextFormatter[];

  /** When true, disables click-to-open fullscreen viewer. @default false */
  @Input() disableInteraction = false;

  @Output() imageClick = new EventEmitter<{ attachment: MediaAttachment; index: number }>();
  @Output() viewerOpen = new EventEmitter<void>();
  @Output() viewerClose = new EventEmitter<void>();

  protected attachments: MediaAttachment[] = [];
  protected captionText = '';
  protected isOutgoing = false;
  protected layoutType: MediaLayoutType = 'single';
  protected overflowCount = 0;
  protected showGalleryViewer = false;
  protected galleryStartIndex = 0;
  protected senderName = '';
  protected senderAvatarUrl = '';
  /** Tracks which attachment indices have finished loading their real image */
  protected loadedIndices = new Set<number>();
  /** Tracks which attachment indices failed to load (unsupported / broken / 403) */
  protected errorIndices = new Set<number>();
  /**
   * Indices whose preloader is parked between a failed attempt and its retry. While an index is in
   * here the preloader is NOT rendered, so re-adding it later builds a FRESH <img> that re-requests
   * the URL (re-assigning the same src to the existing element would not).
   */
  protected reloadingIndices = new Set<number>();
  /** Failed attempts so far, per index. */
  private retryCounts = new Map<number, number>();
  private retryTimers: ReturnType<typeof setTimeout>[] = [];

  /**
   * A just-sent attachment can 403/404 for a moment before the CDN starts serving it, so the FIRST
   * load failure is not proof the media is unsupported. Retry once and keep showing the loading
   * placeholder in between; only a second failure flips the tile to the unsupported glyph.
   */
  private static readonly MAX_LOAD_RETRIES = 1;
  private static readonly RETRY_DELAY_MS = 700;

  /** Path to the placeholder image shown while the real image loads */
  readonly placeholderSrc = 'assets/image_placeholder.png';
  /** Glyph shown when the media can't be previewed (unsupported type or unreachable source) */
  readonly unsupportedSrc = 'assets/unsupported.svg';

  readonly MessageBubbleAlignment = MessageBubbleAlignment;

  constructor(private cdr: ChangeDetectorRef, private ngZone: NgZone) {}

  ngOnInit(): void { this.processMessage(); }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['message'] || changes['alignment']) this.processMessage();
  }

  /** Process the message to extract attachments, caption, and determine layout. */
  private processMessage(): void {
    this.attachments = this.extractAttachments();
    this.captionText = this.extractCaption();
    this.extractSenderInfo();
    this.determineAlignment();
    this.determineLayout();
    // Reset load state on message change — a pending message being replaced by its sent counterpart
    // must get a clean slate, otherwise a failure against the pending URL sticks to the real one.
    this.clearRetryTimers();
    this.loadedIndices = new Set<number>();
    this.errorIndices = new Set<number>();
    this.reloadingIndices = new Set<number>();
    this.retryCounts.clear();
    this.cdr.markForCheck();
  }

  private extractAttachments(): MediaAttachment[] { return extractMediaAttachments(this.message, 'image', 'CometChatImageBubble'); }
  private extractCaption(): string { return extractMediaCaption(this.message, 'CometChatImageBubble'); }

  private extractSenderInfo(): void {
    const info = extractSenderInfo(this.message, 'CometChatImageBubble');
    this.senderName = info.senderName;
    this.senderAvatarUrl = info.senderAvatarUrl;
  }

  private determineLayout(): void {
    const result = determineMediaLayout(this.attachments.length);
    this.layoutType = result.layoutType;
    this.overflowCount = result.overflowCount;
  }

  private determineAlignment(): void { this.isOutgoing = this.alignment === MessageBubbleAlignment.right; }

  protected onImageClick(index: number): void {
    if (this.disableInteraction) return;
    if (index < 0 || index >= this.attachments.length) { CometChatLogger.warn('CometChatImageBubble', `Invalid image index: ${index}`); return; }
    this.imageClick.emit({ attachment: this.attachments[index], index });
    this.openGalleryViewer(index);
  }

  protected openGalleryViewer(startIndex: number): void {
    this.showGalleryViewer = true;
    this.galleryStartIndex = startIndex;
    this.viewerOpen.emit();
    this.cdr.markForCheck();
  }

  protected closeGalleryViewer(): void {
    this.showGalleryViewer = false;
    this.viewerClose.emit();
    this.cdr.markForCheck();
  }

  protected getOverflowText(): string {
    return CometChatLocalize.getLocalizedString('image_bubble_overflow_more').replace('{count}', this.overflowCount.toString());
  }

  protected onImageKeyDown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); this.onImageClick(index); }
  }

  protected get imageAriaLabel(): string {
    if (this.captionText) return CometChatLocalize.getLocalizedString('accessibility_image_with_caption').replace('{caption}', this.captionText);
    return CometChatLocalize.getLocalizedString('accessibility_view_image');
  }

  protected get overflowAriaLabel(): string {
    return CometChatLocalize.getLocalizedString('accessibility_show_more_images').replace('{count}', this.overflowCount.toString());
  }

  protected trackByAttachment(index: number, attachment: MediaAttachment): string { return attachment.url || index.toString(); }

  /**
   * Whether the hidden preloader should be in the DOM for this index. It runs only while the image
   * is still unresolved: not loaded, not given up on, and not parked between a failed attempt and
   * its retry (that gap is what lets the retry mount a fresh <img> and re-request the URL).
   */
  protected shouldPreload(index: number): boolean {
    return (
      !this.loadedIndices.has(index) &&
      !this.errorIndices.has(index) &&
      !this.reloadingIndices.has(index)
    );
  }

  /**
   * Returns the src to display for an image at the given index.
   * Shows the placeholder until the real image has loaded.
   */
  protected getImageSrc(index: number): string {
    if (this.errorIndices.has(index)) return this.unsupportedSrc;
    return this.loadedIndices.has(index)
      ? (this.attachments[index]?.displayUrl ?? this.attachments[index]?.url ?? this.placeholderSrc)
      : this.placeholderSrc;
  }

  /**
   * Called when the real image finishes loading.
   * Runs inside NgZone so OnPush change detection picks it up immediately.
   */
  protected onImageLoad(index: number, event: Event): void {
    const img = event.target as HTMLImageElement;
    // Only swap if this is the real image loading (not the placeholder itself)
    if (img.src && !img.src.endsWith('image_placeholder.png')) {
      this.ngZone.run(() => {
        this.loadedIndices = new Set(this.loadedIndices).add(index);
        this.cdr.markForCheck();
      });
    }
  }

  /**
   * Called when the real image fails to load (unsupported format, broken/expired link, 403).
   *
   * The first failure is NOT treated as "unsupported": a freshly-sent attachment routinely 403s for
   * a moment before the CDN serves it, and flipping straight to the glyph made it flash on screen
   * before the picture appeared. Park the preloader, rebuild it shortly after so a new <img>
   * re-requests the URL, and only surface the glyph once that retry has failed too. The loading
   * placeholder stays visible throughout, so an unresolved image just looks like it is still loading.
   */
  protected onImageError(index: number): void {
    const attempts = this.retryCounts.get(index) ?? 0;

    if (attempts < CometChatImageBubbleComponent.MAX_LOAD_RETRIES) {
      this.retryCounts.set(index, attempts + 1);
      this.ngZone.run(() => {
        this.reloadingIndices = new Set(this.reloadingIndices).add(index);
        this.cdr.markForCheck();
      });
      this.retryTimers.push(
        setTimeout(() => {
          this.ngZone.run(() => {
            const next = new Set(this.reloadingIndices);
            next.delete(index);
            this.reloadingIndices = next;
            this.cdr.markForCheck();
          });
        }, CometChatImageBubbleComponent.RETRY_DELAY_MS)
      );
      return;
    }

    this.ngZone.run(() => {
      this.errorIndices = new Set(this.errorIndices).add(index);
      this.cdr.markForCheck();
    });
  }

  private clearRetryTimers(): void {
    this.retryTimers.forEach(clearTimeout);
    this.retryTimers = [];
  }

  ngOnDestroy(): void {
    this.clearRetryTimers();
  }
}
