/**
 * CometChatFileBubbleComponent renders file attachments within chat messages.
 * Supports single/multiple files, inline expand/collapse, file type icons,
 * human-readable sizes, caption support, and full keyboard accessibility.
 * @see Requirements 1.1, 1.2, 11.1
 */

import {
  Component,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ViewChild,
  ElementRef,
  inject, OnDestroy} from '@angular/core';
import { CommonModule } from '@angular/common';
import type { CometChat } from '@cometchat/chat-sdk-javascript';

import { TranslatePipe } from '../../resources/CometChatLocalize/translate.pipe';
import { CometChatLocalize } from '../../resources/CometChatLocalize/cometchat-localize';
import { MessageBubbleAlignment } from '../../Enums/Enums';
import { CometChatTextBubbleComponent } from '../cometchat-text-bubble/cometchat-text-bubble.component';
import { FileAttachment } from '../../modals/FileAttachment';
import { LiveAnnouncerService } from '../../services/live-announcer.service';
import { CometChatLogger } from '../../utils/CometChatLogger';
import { triggerMediaDownload } from '../../utils/media-download';
import { getFileType, getFileIcon, formatFileSize, resolveFileExtension } from './cometchat-file-bubble.types';

/**
 * CometChatFileBubbleComponent renders file/document message attachments.
 * @deprecated Prefer {@link CometChatFilesBubbleComponent}, which the message bubble now renders
 * for every file message. This bubble stays public for direct use and remains the internal
 * primitive that the new bubble delegates to.
 */
@Component({
  selector: 'cometchat-file-bubble',
  standalone: true,
  templateUrl: './cometchat-file-bubble.component.html',
  styleUrls: ['./cometchat-file-bubble.component.css'],
  imports: [CommonModule, TranslatePipe, CometChatTextBubbleComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CometChatFileBubbleComponent implements OnInit, OnChanges, OnDestroy {
  /** @internal Timer references for cleanup */
  private pendingTimers: ReturnType<typeof setTimeout>[] = [];

  /** The media message object. @see Requirements 1.1, 1.2 */
  @Input({ required: true }) message!: CometChat.MediaMessage;

  /** LEFT for incoming, RIGHT for outgoing. @see Requirements 1.2, 2.7, 2.8 */
  @Input() alignment: MessageBubbleAlignment = MessageBubbleAlignment.left;

  /** Reference to the collapse button for focus management. @see Requirements 4.8, 7.9 */
  @ViewChild('collapseButton') collapseButton?: ElementRef<HTMLButtonElement>;

  /** Extracted file attachments from the message */
  protected attachments: FileAttachment[] = [];
  /** Whether the file list is expanded (for multiple files) */
  protected isExpanded = false;
  /** Whether the message has caption text */
  protected hasCaption = false;
  /** Whether this is an outgoing message (sender is logged-in user) */
  protected isOutgoing = false;

  /** Expose MessageBubbleAlignment enum to template */
  readonly MessageBubbleAlignment = MessageBubbleAlignment;

  constructor(private cdr: ChangeDetectorRef) {}

  /** LiveAnnouncerService for screen reader announcements */
  private liveAnnouncer = inject(LiveAnnouncerService);

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
   * Process the message to extract attachments and caption.
   *
   * @see Requirements 1.1, 1.3
   */
  private processMessage(): void {
    // Extract attachments from the message
    this.extractAttachments();

    // A MediaMessage's caption lives in getCaption()/data.text (there is NO getText() on MediaMessage).
    this.hasCaption = !!(this.message as unknown as { getCaption?: () => string })?.getCaption?.();

    // Determine if message is outgoing based on alignment
    this.isOutgoing = this.alignment === MessageBubbleAlignment.right;

    // Trigger change detection
    this.cdr.markForCheck();
  }

  /**
   * Extract attachments from the message and transform to internal model.
   *
   * @remarks
   * Transforms CometChat.Attachment objects to FileAttachment interface.
   * Handles missing or invalid attachment data gracefully.
   *
   * @see Requirements 1.3, 1.5
   */
  protected extractAttachments(): void {
    // Handle null/undefined message gracefully
    if (!this.message) {
      CometChatLogger.warn('CometChatFileBubble', 'Message is null or undefined');
      this.attachments = [];
      return;
    }

    try {
      // Get attachments from the message
      const rawAttachments = this.message.getAttachments?.();

      // Handle null/undefined attachments array
      if (!rawAttachments || !Array.isArray(rawAttachments)) {
        CometChatLogger.warn('CometChatFileBubble', 'Message has no attachments or attachments is not an array');
        this.attachments = [];
        return;
      }

      // Map CometChat.Attachment objects to FileAttachment interface
      const fileAttachments: FileAttachment[] = [];

      for (let i = 0; i < rawAttachments.length; i++) {
        const attachment = rawAttachments[i];

        // Skip invalid attachments
        if (!attachment || typeof attachment !== 'object') {
          CometChatLogger.warn('CometChatFileBubble', `Attachment at index ${i} is invalid (not an object)`);
          continue;
        }

        // Extract properties with safe access
        const name =
          (attachment as any).name ||
          (attachment as any).getName?.() ||
          CometChatLocalize.getLocalizedString('file_bubble_unknown_file');
        const url = (attachment as any).url || (attachment as any).getUrl?.() || '';
        const mimeType =
          (attachment as any).mimeType ||
          (attachment as any).getMimeType?.() ||
          'application/octet-stream';
        const extension =
          (attachment as any).extension || (attachment as any).getExtension?.() || '';
        const size = (attachment as any).size || (attachment as any).getSize?.() || 0;

        // Skip attachments without URL (required)
        if (!url || typeof url !== 'string') {
          CometChatLogger.warn('CometChatFileBubble', `Attachment at index ${i} is missing URL, skipping`);
          continue;
        }

        // Build FileAttachment object
        const resolvedName =
          typeof name === 'string'
            ? name
            : CometChatLocalize.getLocalizedString('file_bubble_unknown_file');
        const fileAttachment: FileAttachment = {
          name: resolvedName,
          url,
          mimeType: typeof mimeType === 'string' ? mimeType : 'application/octet-stream',
          // The SDK often reports no extension on a received attachment; the filename still has it,
          // and it identifies the format far more precisely than the MIME type can.
          extension: resolveFileExtension(
            resolvedName,
            typeof extension === 'string' ? extension : '',
          ),
          size: typeof size === 'number' ? size : 0,
        };

        fileAttachments.push(fileAttachment);
      }

      this.attachments = fileAttachments;
    } catch (error) {
      CometChatLogger.error('CometChatFileBubble', 'Error extracting attachments:', error);
      this.attachments = [];
    }
  }

  /**
   * Get the file type from attachment for icon mapping.
   * @see Requirements 9.1
   */
  protected getFileType(attachment: FileAttachment): string {
    return getFileType(attachment);
  }

  /**
   * Get the file icon URL for a file type.
   * @see Requirements 9.1, 9.8
   */
  protected getFileIcon(fileType: string): string {
    return getFileIcon(fileType);
  }

  /**
   * Format file size in human-readable format.
   * @see Requirements 10.1-10.6
   */
  protected formatFileSize(bytes: number | null | undefined): string {
    return formatFileSize(bytes);
  }

  /** Chevrons on the expand / collapse bar. Masked, so they take the button's text colour. */
  protected readonly expandIconUrl = 'assets/keyboard_arrow_down.svg';
  protected readonly collapseIconUrl = 'assets/keyboard_arrow_up.svg';

  /** Files shown before the list collapses behind a "Show N more" toggle. Matches the React kit. */
  static readonly COLLAPSED_MAX = 3;

  /** The files rendered right now: the first three, or all of them once expanded. */
  protected get visibleAttachments(): FileAttachment[] {
    return this.isExpanded
      ? this.attachments
      : this.attachments.slice(0, CometChatFileBubbleComponent.COLLAPSED_MAX);
  }

  /** Whether there are more files than the collapsed list shows. */
  protected get hasOverflow(): boolean {
    return this.getRemainingFilesCount() > 0;
  }

  /** Count of files hidden by the collapsed list (drives the "+N more" label). */
  protected getRemainingFilesCount(): number {
    return Math.max(0, this.attachments.length - CometChatFileBubbleComponent.COLLAPSED_MAX);
  }

  /** "+N more", localized. */
  protected getShowMoreLabel(): string {
    return CometChatLocalize.getLocalizedString('bubble_show_more').replace(
      '{count}',
      String(this.getRemainingFilesCount()),
    );
  }

  /** Uppercased extension for the meta line (e.g. "DOC"), or "FILE" when there is none. */
  protected getFileExtLabel(attachment: FileAttachment): string {
    const parts = (attachment.name ?? '').split('.');
    if (parts.length < 2) {
      return 'FILE';
    }
    return (parts.pop() ?? '').toUpperCase();
  }

  /** Meta line: `DOC · 98 KB`, falling back to just the extension when the size is unknown. */
  protected getFileMeta(attachment: FileAttachment): string {
    const ext = this.getFileExtLabel(attachment);
    const size = attachment.size;
    return size && size > 0 ? `${ext} · ${formatFileSize(size)}` : ext;
  }

  /**
   * Toggle the expanded/collapsed state for multiple files.
   *
   * @remarks
   * When expanding, sets focus on the collapse control after a short delay
   * to allow the DOM to update.
   *
   * @see Requirements 4.1, 4.6, 4.8, 7.9
   */
  protected toggleExpanded(): void {
    const wasCollapsed = !this.isExpanded;
    this.isExpanded = !this.isExpanded;
    this.cdr.markForCheck();

    // Set focus on collapse control after expansion
    if (wasCollapsed && this.isExpanded) {
      // Use setTimeout to ensure DOM has updated
      this.pendingTimers.push(setTimeout(() => {
        this.collapseButton?.nativeElement?.focus();
      }, 0));
    }
  }

  /**
   * Get the ARIA label for the expand indicator.
   *
   * @remarks
   * Returns a dynamic label like "Show 3 more files" based on the count
   * of remaining files.
   *
   * @returns ARIA label string
   * @see Requirements 7.5
   */
  protected getExpandAriaLabel(): string {
    const count = this.getRemainingFilesCount();
    const template = CometChatLocalize.getLocalizedString('file_bubble_show_more_files');
    if (template && template !== 'file_bubble_show_more_files') {
      return template.replace('{count}', count.toString());
    }
    // Fallback with proper singular/plural
    return count === 1 ? `Show 1 more file` : `Show ${count} more files`;
  }

  /**
   * Get the ARIA label for a download link.
   *
   * @remarks
   * Returns a localized label like "Download filename.pdf" to provide
   * context for screen reader users.
   *
   * @param filename - The name of the file
   * @returns ARIA label string
   * @see Requirements 7.5, 10.4
   */
  protected getDownloadAriaLabel(filename: string): string {
    return CometChatLocalize.getLocalizedString('accessibility_file_bubble_download').replace(
      '{filename}',
      filename
    );
  }

  /**
   * Get the ARIA label for a file item.
   *
   * @remarks
   * Returns a localized label combining filename, file type, and size
   * for screen reader users.
   *
   * @param attachment - The file attachment
   * @returns ARIA label string
   * @see Requirements 10.3
   */
  protected getFileAriaLabel(attachment: FileAttachment): string {
    const fileType = this.getFileType(attachment);
    const formattedSize = this.formatFileSize(attachment.size);
    return CometChatLocalize.getLocalizedString('accessibility_file_bubble')
      .replace('{filename}', attachment.name)
      .replace('{type}', fileType.toUpperCase())
      .replace('{size}', formattedSize);
  }

  /**
   * Handles keyboard events on the download button.
   *
   * @remarks
   * Triggers file download when Enter or Space is pressed.
   *
   * @param event - The keyboard event
   * @param attachment - The file attachment to download
   * @see Requirements 10.2
   */
  protected onDownloadKeyDown(event: KeyboardEvent, attachment: FileAttachment): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.initiateDownload(attachment);
    }
  }

  /**
   * Initiates file download with screen reader announcements.
   *
   * @remarks
   * Announces download start, then completion or failure once the download actually resolves.
   * The outcome is real, not assumed: an anchor pointed at the cross-origin CDN can only open the
   * file in a tab, so `triggerMediaDownload` fetches the bytes into a same-origin blob and reports
   * back whether it managed to save or had to fall back to a tab.
   *
   * @param attachment - The file attachment to download
   * @see Requirements 10.5, 10.6, 10.7
   */
  protected initiateDownload(attachment: FileAttachment): void {
    // Announce download start
    this.liveAnnouncer.announce(
      CometChatLocalize.getLocalizedString('accessibility_downloading_file').replace(
        '{filename}',
        attachment.name
      ),
      'polite'
    );

    triggerMediaDownload(attachment.url, attachment.name).then(outcome => {
      if (outcome === 'saved') {
        this.liveAnnouncer.announce(
          CometChatLocalize.getLocalizedString('accessibility_download_complete').replace(
            '{filename}',
            attachment.name
          ),
          'polite'
        );
        return;
      }
      // Opened in a tab instead of saving — announcing "complete" here would tell a screen-reader
      // user the file is on disk when it isn't.
      this.liveAnnouncer.announceError(
        CometChatLocalize.getLocalizedString('accessibility_download_failed').replace(
          '{filename}',
          attachment.name
        )
      );
    });
  }

  /**
   * TrackBy function for *ngFor over file attachments.
   *
   * Uses the attachment URL as a stable unique identifier to prevent
   * unnecessary DOM re-creation when the list is re-rendered.
   *
   * @param index - The index of the item in the list
   * @param attachment - The file attachment
   * @returns The attachment URL as a stable identifier
   * @see Requirements 2.2
   */
  protected trackByAttachment(index: number, attachment: FileAttachment): string {
    return attachment.url || index.toString();
  }

  ngOnDestroy(): void {
    this.pendingTimers.forEach(t => clearTimeout(t));
    this.pendingTimers = [];
  }
}
