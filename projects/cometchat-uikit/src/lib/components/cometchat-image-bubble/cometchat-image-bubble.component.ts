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

/**
 * CometChatImageBubbleComponent renders image messages with single/multi-image layouts,
 * overflow handling, fullscreen gallery, and keyboard accessibility.
 * @see Requirements 18.1, 18.6
 */
@Component({
  selector: 'cometchat-image-bubble',
  standalone: true,
  templateUrl: './cometchat-image-bubble.component.html',
  styleUrls: ['./cometchat-image-bubble.component.css'],
  imports: [CommonModule, TranslatePipe, CometChatTextBubbleComponent, CometChatFullScreenViewerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CometChatImageBubbleComponent implements OnInit, OnChanges {
  /** The media message object. @see Requirements 1.1, 1.3, 1.5 */
  @Input({ required: true }) message!: CometChat.MediaMessage;

  /** LEFT for incoming, RIGHT for outgoing. @see Requirements 1.5, 13.1, 13.2 */
  @Input() alignment: MessageBubbleAlignment = MessageBubbleAlignment.left;

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

  /** Path to the placeholder image shown while the real image loads */
  readonly placeholderSrc = 'assets/image_placeholder.png';

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
    this.loadedIndices = new Set<number>(); // reset on message change
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
   * Returns the src to display for an image at the given index.
   * Shows the placeholder until the real image has loaded.
   */
  protected getImageSrc(index: number): string {
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
   * Called when the real image fails to load — keep showing placeholder.
   */
  protected onImageError(index: number): void {
    // Keep placeholder — nothing to do, loadedIndices stays without this index
  }
}
