import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges,
  OnDestroy,
  AfterViewInit,
  HostListener,
  ChangeDetectorRef,
  ViewChild,
  ElementRef,
  inject, ChangeDetectionStrategy} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  CometChatLocalize,
  getLocalizedString,
} from '../../../resources/CometChatLocalize/cometchat-localize';
import { CalendarObject } from '../../../resources/CometChatLocalize/localization.interfaces';
import { sanitizeCalendarObject } from '../../../utils/util';
import { MediaAttachment } from '../../../modals/MediaAttachment';
import { LiveAnnouncerService } from '../../../services/live-announcer.service';
import { FocusTrapService } from '../../../services/focus-trap.service';
import { MediaControlsService } from '../../../services/media-controls.service';
import { CometChatLogger } from '../../../utils/CometChatLogger';

/**
 * Type of media to display in the fullscreen viewer
 * @see Requirements 11.9
 */
export type FullscreenViewerMediaType = 'image' | 'video' | 'audio' | 'file';

/**
 * CometChatFullScreenViewer is a full-screen media viewer component that supports
 * images, videos, and file previews with download progress and sender information.
 * It also supports gallery mode for navigating through multiple media attachments.
 *
 * @example
 * ```html
 * <!-- Single image viewer with message context (backward compatible) -->
 * <cometchat-fullscreen-viewer
 *   [url]="imageUrl"
 *   [message]="message"
 *   (closeClick)="handleClose()">
 * </cometchat-fullscreen-viewer>
 *
 * <!-- Single video viewer for attachment preview -->
 * <cometchat-fullscreen-viewer
 *   [url]="videoUrl"
 *   [mediaType]="'video'"
 *   [fileName]="'my-video.mp4'"
 *   (closeClick)="handleClose()">
 * </cometchat-fullscreen-viewer>
 *
 * <!-- Gallery mode with multiple attachments -->
 * <cometchat-fullscreen-viewer
 *   [attachments]="mediaAttachments"
 *   [startIndex]="2"
 *   [isOpen]="viewerOpen"
 *   [explicitSenderName]="'John Doe'"
 *   [explicitSenderAvatarUrl]="'https://example.com/avatar.jpg'"
 *   (closeClick)="handleClose()"
 *   (indexChange)="handleIndexChange($event)">
 * </cometchat-fullscreen-viewer>
 *
 * <!-- File preview -->
 * <cometchat-fullscreen-viewer
 *   [url]="fileUrl"
 *   [mediaType]="'file'"
 *   [fileName]="'document.pdf'"
 *   (closeClick)="handleClose()">
 * </cometchat-fullscreen-viewer>
 * ```
 *
 * @see Requirements 11.1, 11.2, 11.9, 1.1, 1.8, 4.1, 4.2
 */
@Component({
  selector: 'cometchat-fullscreen-viewer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './cometchat-fullscreen-viewer.component.html',
  styleUrls: ['./cometchat-fullscreen-viewer.component.css'],
})
export class CometChatFullScreenViewerComponent
  implements OnInit, OnChanges, AfterViewInit, OnDestroy
{
  /**
   * URL of the media to display
   * @see Requirements 11.2
   */
  @Input() url = '';

  /**
   * Type of media to display (image, video, audio, file)
   * Defaults to 'image' for backward compatibility
   * @see Requirements 11.9
   */
  @Input() mediaType: FullscreenViewerMediaType = 'image';

  /**
   * File name to display for file previews
   * @see Requirements 11.6
   */
  @Input() fileName = '';

  /**
   * File size in bytes (optional, for file preview display)
   */
  @Input() fileSize?: number;

  /** Placeholder image URL */
  @Input() placeholderImage?: string;

  /**
   * The media message containing the image (optional, for backward compatibility)
   * When provided, sender info will be displayed
   */
  @Input() message?: CometChat.BaseMessage;

  /** Format for timestamps associated with images */
  @Input() imageSentAtDateTimeFormat?: CalendarObject;

  // ===== Gallery Mode Inputs (New) =====

  /**
   * Array of media attachments for gallery mode
   * When provided, enables gallery navigation with previous/next controls
   * @see Requirements 1.1, 1.8
   */
  @Input() attachments: MediaAttachment[] = [];

  /**
   * Starting index for gallery mode
   * Specifies which attachment to display initially
   * @default 0
   * @see Requirements 1.8
   */
  @Input() startIndex = 0;

  /**
   * Controls visibility of the viewer
   * When true, the viewer is displayed; when false, it's hidden
   * @default false
   * @see Requirements 8.1, 8.2
   */
  @Input() isOpen = false;

  /**
   * Sender name to display in header
   * If not provided, will be extracted from message input
   * @see Requirements 4.1, 4.2
   */
  @Input() explicitSenderName = '';

  /**
   * Sender avatar URL to display in header
   * If not provided, will be extracted from message input
   * @see Requirements 4.1, 4.2
   */
  @Input() explicitSenderAvatarUrl = '';

  /**
   * Icon URL for previous navigation button
   * @default 'assets/arrow_back.svg'
   * @see Requirements 1.1
   */
  @Input() prevIconUrl = 'assets/arrow_back.svg';

  /**
   * Icon URL for next navigation button
   * @default 'assets/arrow_forward.svg'
   * @see Requirements 1.1
   */
  @Input() nextIconUrl = 'assets/arrow_forward.svg';

  /**
   * Icon URL for download button
   * @default 'assets/download.svg'
   * @see Requirements 9.1
   */
  @Input() downloadIconUrl = 'assets/download.svg';

  /**
   * Emitted when close button is clicked
   * @see Requirements 11.7
   */
  @Output() closeClick = new EventEmitter<void>();

  /**
   * Emitted when the current index changes in gallery mode
   * Allows parent components to track which media is being viewed
   * @see Requirements 1.2, 1.3, 1.4, 1.5, 1.8
   */
  @Output() indexChange = new EventEmitter<number>();

  /**
   * Emitted when the download button is clicked
   * Provides the current media URL or MediaAttachment for download tracking
   * @see Requirements 9.1
   */
  @Output() downloadClick = new EventEmitter<MediaAttachment | string>();

  // ===== Picture-in-Picture (PIP) Inputs (Task 20.1) =====

  /**
   * Enables Picture-in-Picture mode for videos
   * When true, a PIP button will be shown for video content
   * @default true
   * @see Task 20.1 - Enterprise feature for video multitasking
   */
  @Input() enablePictureInPicture = true;

  /**
   * Icon URL for the Picture-in-Picture button
   * @default 'assets/zoom_out_map.svg'
   * @see Task 20.1
   */
  @Input() pipIconUrl = 'assets/zoom_out_map.svg';

  /**
   * Icon URL for exiting Picture-in-Picture mode
   * @default 'assets/zoom_in_map.svg'
   * @see Task 20.1
   */
  @Input() pipExitIconUrl = 'assets/zoom_in_map.svg';

  /**
   * Emitted when Picture-in-Picture state changes
   * Emits true when entering PIP mode, false when exiting
   * @see Task 20.2 - Allow parent components to react to PIP state changes
   */
  @Output() pipStateChange = new EventEmitter<boolean>();

  /** Reference to the close button for focus management */
  @ViewChild('closeButton') closeButton?: ElementRef<HTMLButtonElement>;

  /** Reference to the viewer container for focus trap */
  @ViewChild('viewerContainer') viewerContainer?: ElementRef<HTMLDivElement>;

  /** Reference to the video element for playback control */
  @ViewChild('videoElement') videoElement?: ElementRef<HTMLVideoElement>;

  // ===== Gallery State (Task 3) =====

  /**
   * Current index in the attachments array for gallery mode
   * Tracks which media item is currently displayed
   * @default 0
   * @see Requirements 1.2, 1.3, 1.8
   */
  currentIndex = 0;

  // Internal state
  image?: string;
  isDownloading = true;
  progress = 0;
  videoError = false;

  // ===== Picture-in-Picture State (Task 20.1) =====

  /**
   * Tracks whether the video is currently in Picture-in-Picture mode
   * @see Task 20.1
   */
  isPipMode = false;

  /**
   * Indicates whether the browser supports Picture-in-Picture
   * Checked on component initialization
   * @see Task 20.8
   */
  isPipSupported = false;

  // Store the previously focused element to restore focus on close
  private previouslyFocusedElement: HTMLElement | null = null;

  /**
   * Stores the original body overflow value before modifying it
   * Used to restore the original value when the viewer closes
   * @see Requirements 7.2
   */
  private originalBodyOverflow = '';

  // ===== PIP Event Listener References (Task 20.4) =====
  private pipEnterListener: (() => void) | null = null;
  private pipLeaveListener: (() => void) | null = null;

  // Inject LiveAnnouncerService for accessibility announcements
  private liveAnnouncer = inject(LiveAnnouncerService);

  // Inject FocusTrapService for focus management (Requirement 17.1)
  private focusTrapService = inject(FocusTrapService);

  // Inject MediaControlsService for video keyboard controls (Requirement 17.4, 17.5)
  private mediaControlsService = inject(MediaControlsService);

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    // Check for Picture-in-Picture browser support (Task 20.8)
    this.isPipSupported =
      'pictureInPictureEnabled' in document && (document as any).pictureInPictureEnabled;

    // Initialize currentIndex from startIndex input (Task 2)
    // Validate startIndex is within bounds
    if (this.isGalleryMode) {
      if (this.startIndex < 0) {
        this.currentIndex = 0;
      } else if (this.startIndex >= this.attachments.length) {
        this.currentIndex = this.attachments.length - 1;
      } else {
        this.currentIndex = this.startIndex;
      }
    }

    if (this.url) {
      if (this.mediaType === 'image') {
        // Set image immediately - browser will handle loading
        this.image = this.url;
        this.isDownloading = false;
        this.progress = 100;
      } else {
        // For video, audio, and file types, no download progress needed
        this.isDownloading = false;
        this.progress = 100;
      }
    } else {
      this.isDownloading = false;
    }
  }

  /**
   * Handle input changes - store triggering element when viewer opens
   * Handles changes to isOpen, startIndex, and attachments inputs
   * @see Requirements 5.5, 5.7, 8.1, 8.2, 8.3, 8.4, 7.1, 17.1
   */
  ngOnChanges(changes: SimpleChanges): void {
    // When isOpen changes to true, store the currently focused element and prevent body scroll
    if (
      changes['isOpen'] &&
      changes['isOpen'].currentValue === true &&
      !changes['isOpen'].previousValue
    ) {
      // Store the element that had focus before opening the viewer
      this.previouslyFocusedElement = document.activeElement as HTMLElement;

      // Prevent body scroll when viewer opens
      this.preventBodyScroll();

      // Announce viewer type for screen readers (Requirement 9.13)
      this.liveAnnouncer.announce(this.getViewerAriaLabel(), 'polite');

      // Announce gallery position if in gallery mode (Requirement 17.9)
      if (this.isGalleryMode) {
        setTimeout(() => {
          this.announceGalleryPosition();
        }, 100);
      }

      // Activate focus trap after DOM is ready (Requirement 17.1)
      setTimeout(() => {
        if (this.viewerContainer?.nativeElement) {
          this.focusTrapService.activate({
            container: this.viewerContainer.nativeElement,
            initialFocus: this.closeButton?.nativeElement || 'first',
            returnFocusOnDeactivate: true,
          });
        }
      }, 100);
    }

    // When isOpen changes to false, restore body scroll and deactivate focus trap
    if (
      changes['isOpen'] &&
      changes['isOpen'].currentValue === false &&
      changes['isOpen'].previousValue === true
    ) {
      this.restoreBodyScroll();

      // Deactivate focus trap (Requirement 17.2)
      if (this.viewerContainer?.nativeElement) {
        this.focusTrapService.deactivate(this.viewerContainer.nativeElement);
      }
    }

    // When startIndex changes, navigate to the new index
    // Only process if not the first change (to avoid duplicate navigation in ngOnInit)
    if (changes['startIndex'] && !changes['startIndex'].firstChange && this.isGalleryMode) {
      const newIndex = changes['startIndex'].currentValue;
      // Validate and navigate to the new index
      if (typeof newIndex === 'number' && newIndex >= 0 && newIndex < this.attachments.length) {
        this.navigateToIndex(newIndex);
      }
    }

    // When attachments array changes, update the displayed media
    // Reset currentIndex if it's now out of bounds
    if (changes['attachments'] && !changes['attachments'].firstChange) {
      const newAttachments = changes['attachments'].currentValue;
      if (newAttachments && Array.isArray(newAttachments)) {
        // If currentIndex is now out of bounds, reset to 0
        if (this.currentIndex >= newAttachments.length) {
          this.currentIndex = 0;
          this.indexChange.emit(this.currentIndex);
        }
        // Trigger change detection to update the view
        this.cdr.detectChanges();
      }
    }
  }

  /**
   * After view initialization - set focus trap for keyboard accessibility
   * Also sets up PIP event listeners on the video element
   * Only activates focus trap if the viewer is open
   * @see Requirements 5.5, 11.10, 17.1, Task 20.4
   */
  ngAfterViewInit(): void {
    // Activate focus trap if the viewer is currently open (Requirement 17.1)
    if (this.isOpen && this.viewerContainer?.nativeElement) {
      setTimeout(() => {
        this.focusTrapService.activate({
          container: this.viewerContainer!.nativeElement,
          initialFocus: this.closeButton?.nativeElement || 'first',
          returnFocusOnDeactivate: true,
        });

        // Announce gallery position if in gallery mode (Requirement 17.9)
        if (this.isGalleryMode) {
          this.announceGalleryPosition();
        }
      }, 100);
    }

    // Set up PIP event listeners (Task 20.4)
    // Use setTimeout to ensure video element is available after *ngIf renders
    setTimeout(() => {
      this.setupPipEventListeners();
    }, 200);
  }

  /**
   * Cleanup - stop video playback, restore body scroll, exit PIP, deactivate focus trap, and remove event listeners
   * Note: @HostListener decorators are automatically cleaned up by Angular
   * @see Requirements 7.3, 8.5, 8.7, 17.1, Task 20.4
   */
  ngOnDestroy(): void {
    // Deactivate focus trap (Requirement 17.1)
    if (this.viewerContainer?.nativeElement) {
      this.focusTrapService.deactivate(this.viewerContainer.nativeElement);
    }

    // Exit PIP mode if active (Task 20.7)
    if (this.isPipMode) {
      this.exitPictureInPicture();
    }

    // Remove PIP event listeners (Task 20.4)
    this.removePipEventListeners();

    // Stop any playing video before component destruction
    this.stopCurrentVideo();

    // Restore body scroll to ensure it's not left in a disabled state
    this.restoreBodyScroll();

    // Note: Keyboard event listeners using @HostListener are automatically
    // removed by Angular when the component is destroyed, so no manual cleanup needed
  }

  /**
   * Downloads image with retry logic (max 5 attempts for 403 errors)
   * This method is kept for compatibility with CometChat media messages
   * that may require authenticated downloads
   */
  downloadImage(imgUrl: string, attemptCount = 0): void {
    const maxAttempts = 5;
    const xhr = new XMLHttpRequest();
    xhr.open('GET', imgUrl, true);
    xhr.responseType = 'blob';

    xhr.onprogress = event => {
      if (event.lengthComputable) {
        this.progress = (event.loaded / event.total) * 100;
      }
    };

    xhr.onload = () => {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          const blob = xhr.response;
          const objectUrl = URL.createObjectURL(blob);
          const img = new Image();
          img.src = objectUrl;
          img.onload = () => {
            this.isDownloading = false;
            this.image = objectUrl;
          };
        } else if (xhr.status === 403 && attemptCount < maxAttempts) {
          setTimeout(() => this.downloadImage(imgUrl, attemptCount + 1), 800);
        } else {
          // Fallback to direct URL
          this.image = imgUrl;
          this.isDownloading = false;
        }
      }
    };

    xhr.onerror = () => {
      // Fallback to direct URL
      this.image = imgUrl;
      this.isDownloading = false;
    };

    xhr.ontimeout = () => {
      // Fallback to direct URL
      this.image = imgUrl;
      this.isDownloading = false;
    };

    xhr.send();
  }

  /**
   * Closes the viewer
   * Exits PIP mode if active (unless keepPipActive is true), stops any playing video,
   * deactivates focus trap, emits closeClick event, restores body scroll, and restores focus
   * @param keepPipActive If true, don't exit PIP mode when closing (used when closing due to PIP activation)
   * @see Requirements 3.4, 5.7, 7.2, 11.7, 17.2, Task 20.7
   */
  close(keepPipActive = false): void {
    // Exit PIP mode if active (Task 20.7), unless we're closing because PIP was activated
    if (this.isPipMode && !keepPipActive) {
      this.exitPictureInPicture();
    }

    // Stop video playback before closing (unless PIP is active and we want to keep it)
    if (!keepPipActive || !this.isPipMode) {
      this.stopCurrentVideo();
    }

    // Deactivate focus trap (Requirement 17.2)
    if (this.viewerContainer?.nativeElement) {
      this.focusTrapService.deactivate(this.viewerContainer.nativeElement);
    }

    // Restore body scroll
    this.restoreBodyScroll();

    // Emit close event
    this.closeClick.emit();

    // Restore focus to the element that was focused before opening the viewer
    // This ensures keyboard users return to where they were
    if (
      this.previouslyFocusedElement &&
      typeof this.previouslyFocusedElement.focus === 'function'
    ) {
      // Use setTimeout to ensure the viewer is hidden before restoring focus
      setTimeout(() => {
        this.previouslyFocusedElement?.focus();
      }, 0);
    }
  }

  /**
   * Handles close button click
   * @see Requirements 11.7
   */
  handleCloseClick(event: MouseEvent): void {
    event.stopPropagation();
    this.close();
  }

  /**
   * Handles keyboard activation of close button (Enter/Space)
   */
  handleCloseKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      event.stopPropagation();
      this.close();
    }
  }

  /**
   * Handles keyboard navigation and viewer control
   * Listens for ArrowLeft, ArrowRight, Escape, and Space keys
   * Integrates MediaControlsService for video playback controls
   * Only handles events when isOpen is true
   * @see Requirements 1.4, 1.5, 5.2, 5.3, 5.4, 17.2, 17.3, 17.4, 17.5
   */
  @HostListener('document:keydown', ['$event'])
  handleDocumentKeydown(event: KeyboardEvent): void {
    // Only handle keyboard events when viewer is open
    if (!this.isOpen) {
      return;
    }

    // Handle Escape to close viewer (Requirement 17.2)
    if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
      return;
    }

    // Determine if current media is video
    const isVideoMode = this.isGalleryMode
      ? this.currentAttachment?.type === 'video'
      : this.mediaType === 'video';

    // For video mode, use MediaControlsService for Space and Arrow keys (Requirements 17.4, 17.5)
    if (isVideoMode && this.videoElement?.nativeElement && !this.videoError) {
      const video = this.videoElement.nativeElement;

      // Handle video controls with MediaControlsService
      if (
        event.key === ' ' ||
        event.key === 'ArrowRight' ||
        event.key === 'ArrowLeft' ||
        event.key === 'Home' ||
        event.key === 'End'
      ) {
        const result = this.mediaControlsService.handleKeyDown(event, {
          currentTime: video.currentTime,
          duration: video.duration || 0,
          isPlaying: !video.paused,
          seekIncrement: 5,
        });

        switch (result.action) {
          case 'play':
            video.play();
            this.liveAnnouncer.announce(getLocalizedString('audio_bubble_play'), 'polite');
            break;
          case 'pause':
            video.pause();
            this.liveAnnouncer.announce(getLocalizedString('audio_bubble_pause'), 'polite');
            break;
          case 'seek':
          case 'seekStart':
          case 'seekEnd':
            if (result.seekTime !== undefined) {
              video.currentTime = result.seekTime;
              // Announce seek position
              const timeText = this.mediaControlsService.formatTimeForAnnouncement(result.seekTime);
              this.liveAnnouncer.announce(timeText, 'polite');
            }
            break;
        }
        return;
      }
    }

    // For gallery mode (images), handle arrow key navigation (Requirement 17.3)
    if (this.isGalleryMode && !isVideoMode) {
      switch (event.key) {
        case 'ArrowRight':
          if (this.canNavigateNext) {
            event.preventDefault();
            this.navigateNext();
          }
          break;

        case 'ArrowLeft':
          if (this.canNavigatePrev) {
            event.preventDefault();
            this.navigatePrev();
          }
          break;
      }
      return;
    }

    // For gallery mode with video, arrow keys navigate between items (not seek)
    if (this.isGalleryMode && isVideoMode) {
      switch (event.key) {
        case 'ArrowRight':
          if (this.canNavigateNext) {
            event.preventDefault();
            this.navigateNext();
          }
          break;

        case 'ArrowLeft':
          if (this.canNavigatePrev) {
            event.preventDefault();
            this.navigatePrev();
          }
          break;
      }
    }
  }

  /**
   * Note: Focus trapping is now handled by FocusTrapService
   * This method is kept for backward compatibility but delegates to the service
   * @see Requirements 11.10, 17.1
   */
  @HostListener('keydown', ['$event'])
  handleKeydown(event: KeyboardEvent): void {
    // Focus trapping is handled by FocusTrapService
    // This method is kept for any additional keydown handling if needed
  }

  /**
   * Handle video error event
   */
  handleVideoError(): void {
    this.videoError = true;
    this.cdr.detectChanges();
  }

  /**
   * Gets the merged date format configuration
   */
  getDateFormat(): CalendarObject {
    const defaultFormat = {
      yesterday: ` DD/M/YYYY [${getLocalizedString('full_screen_viewer_at')}] hh:mm A`,
      otherDays: ` DD/M/YYYY [${getLocalizedString('full_screen_viewer_at')}] hh:mm A`,
      today: ` DD/M/YYYY [${getLocalizedString('full_screen_viewer_at')}] hh:mm A`,
    };
    const globalCalendarFormat = sanitizeCalendarObject(CometChatLocalize.getCalendarObject());
    const componentCalendarFormat = sanitizeCalendarObject(this.imageSentAtDateTimeFormat);
    return { ...defaultFormat, ...globalCalendarFormat, ...componentCalendarFormat };
  }

  /**
   * Gets sender name from explicit input or message
   * Priority: explicitSenderName > message.sender.name
   */
  get senderName(): string {
    return this.explicitSenderName || this.message?.getSender()?.getName() || '';
  }

  /**
   * Gets sender avatar URL from explicit input or message
   * Priority: explicitSenderAvatarUrl > message.sender.avatar
   */
  get senderAvatar(): string {
    return this.explicitSenderAvatarUrl || this.message?.getSender()?.getAvatar() || '';
  }

  /**
   * Gets formatted date string
   */
  get formattedDate(): string {
    if (!this.message?.getSentAt) {
      return '';
    }
    return CometChatLocalize.formatDate(this.message.getSentAt(), this.getDateFormat());
  }

  /**
   * Gets the stroke dash array for progress circle
   */
  get progressStrokeDasharray(): string {
    return `${this.progress / 1.13} 113`;
  }

  /**
   * Gets formatted file size string
   */
  get formattedFileSize(): string {
    if (!this.fileSize) {
      return '';
    }

    const units = ['B', 'KB', 'MB', 'GB'];
    let size = this.fileSize;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  /**
   * Gets the file extension from filename
   */
  get fileExtension(): string {
    if (!this.fileName) {
      return '';
    }
    const parts = this.fileName.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toUpperCase() : '';
  }

  /**
   * Determines if sender info should be shown
   * Shows when either message is provided OR explicit sender name/avatar is provided
   */
  get showSenderInfo(): boolean {
    // Show if explicit sender info is provided
    if (this.explicitSenderName || this.explicitSenderAvatarUrl) {
      return true;
    }
    // Show if message with sender is provided
    return !!this.message && (!!this.senderName || !!this.senderAvatar);
  }

  /**
   * Gets the current file name for display in header
   * In gallery mode, uses current attachment name; in single mode, uses fileName input
   */
  get currentFileName(): string {
    if (this.isGalleryMode && this.currentAttachment) {
      return this.currentAttachment.name || '';
    }
    return this.fileName || '';
  }

  /**
   * Gets the current file size for display in header
   * In gallery mode, uses current attachment size; in single mode, uses fileSize input
   */
  get currentFileSize(): string {
    let size: number | undefined;

    if (this.isGalleryMode && this.currentAttachment) {
      size = this.currentAttachment.size;
    } else {
      size = this.fileSize;
    }

    if (!size) {
      return '';
    }

    const units = ['B', 'KB', 'MB', 'GB'];
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(unitIndex > 0 ? 1 : 0)} ${units[unitIndex]}`;
  }

  /**
   * Gets the current file extension for display in header
   * In gallery mode, uses current attachment; in single mode, uses fileName input
   */
  get currentFileExtension(): string {
    let name: string;

    if (this.isGalleryMode && this.currentAttachment) {
      name = this.currentAttachment.name || '';
    } else {
      name = this.fileName || '';
    }

    if (!name) {
      return '';
    }

    const parts = name.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toUpperCase() : '';
  }

  /**
   * Gets localized string for a key
   */
  getLocalizedString(key: string): string {
    return getLocalizedString(key);
  }

  /**
   * Gets the appropriate aria-label for the viewer based on media type
   * @see Requirements 11.10
   */
  getViewerAriaLabel(): string {
    switch (this.mediaType) {
      case 'video':
        return getLocalizedString('full_screen_viewer_video');
      case 'audio':
        return getLocalizedString('full_screen_viewer_audio');
      case 'file':
        return getLocalizedString('full_screen_viewer_file');
      default:
        return getLocalizedString('message_list_full_screen_viewer');
    }
  }

  /**
   * Gets the appropriate alt text for the media
   */
  getMediaAltText(): string {
    const mediaType = this.isGalleryMode ? this.currentAttachment?.type : this.mediaType;
    const sender = this.senderName || getLocalizedString('unknown');

    if (mediaType === 'video') {
      return getLocalizedString('fullscreen_viewer_video_alt').replace('{sender}', sender);
    } else if (mediaType === 'image') {
      return getLocalizedString('fullscreen_viewer_image_alt').replace('{sender}', sender);
    }

    // Fallback for other media types
    if (this.fileName) {
      return this.fileName;
    }
    return getLocalizedString('message_list_full_screen_viewer');
  }

  // ===== Mode Detection (Task 2) =====

  /**
   * Determines if the viewer is in gallery mode
   * Gallery mode is active when attachments array has items
   * Single mode is active when only url input is provided
   * @returns true if in gallery mode, false if in single mode
   * @see Requirements 1.1, 2.1, 2.2
   */
  get isGalleryMode(): boolean {
    return this.attachments && this.attachments.length > 0;
  }

  /**
   * Gets the currently displayed media attachment in gallery mode
   * Returns null in single mode
   * @returns MediaAttachment at currentIndex or null
   * @see Requirements 1.2, 1.3
   */
  get currentAttachment(): MediaAttachment | null {
    if (!this.isGalleryMode) {
      return null;
    }
    // Validate currentIndex is within bounds
    if (this.currentIndex < 0 || this.currentIndex >= this.attachments.length) {
      return null;
    }
    return this.attachments[this.currentIndex];
  }

  // ===== Navigation State (Task 3.2) =====

  /**
   * Determines if navigation to previous media is possible
   * Returns true when currentIndex > 0
   * @returns true if can navigate to previous, false otherwise
   * @see Requirements 1.6, 1.7
   */
  get canNavigatePrev(): boolean {
    return this.isGalleryMode && this.currentIndex > 0;
  }

  /**
   * Determines if navigation to next media is possible
   * Returns true when currentIndex < attachments.length - 1
   * @returns true if can navigate to next, false otherwise
   * @see Requirements 1.6, 1.7
   */
  get canNavigateNext(): boolean {
    return this.isGalleryMode && this.currentIndex < this.attachments.length - 1;
  }

  // ===== Navigation Methods (Task 3.3, 3.4, 3.5) =====

  /**
   * Navigates to the next media item in the gallery
   * Only works in gallery mode when not at the last item
   * Exits PIP mode and stops current video playback before navigating
   * @see Requirements 1.2, 1.4, 9.11, Task 20.6
   */
  navigateNext(): void {
    if (!this.canNavigateNext) {
      return;
    }

    // Exit PIP mode if active (Task 20.6)
    if (this.isPipMode) {
      this.exitPictureInPicture();
    }

    // Stop current video if playing
    this.stopCurrentVideo();

    // Increment index
    this.currentIndex++;

    // Emit index change event
    this.indexChange.emit(this.currentIndex);

    // Announce gallery position for screen readers (Requirement 9.11)
    const positionText =
      getLocalizedString('fullscreen_viewer_index')
        ?.replace('{current}', (this.currentIndex + 1).toString())
        ?.replace('{total}', this.attachments.length.toString()) ||
      `${this.currentIndex + 1} of ${this.attachments.length}`;
    this.liveAnnouncer.announce(positionText, 'polite');

    // Re-setup PIP event listeners for new video element
    setTimeout(() => this.setupPipEventListeners(), 100);

    // Trigger change detection
    this.cdr.detectChanges();
  }

  /**
   * Navigates to the previous media item in the gallery
   * Only works in gallery mode when not at the first item
   * Exits PIP mode and stops current video playback before navigating
   * @see Requirements 1.3, 1.5, 9.11, Task 20.6
   */
  navigatePrev(): void {
    if (!this.canNavigatePrev) {
      return;
    }

    // Exit PIP mode if active (Task 20.6)
    if (this.isPipMode) {
      this.exitPictureInPicture();
    }

    // Stop current video if playing
    this.stopCurrentVideo();

    // Decrement index
    this.currentIndex--;

    // Emit index change event
    this.indexChange.emit(this.currentIndex);

    // Announce gallery position for screen readers (Requirement 9.11)
    const positionText =
      getLocalizedString('fullscreen_viewer_index')
        ?.replace('{current}', (this.currentIndex + 1).toString())
        ?.replace('{total}', this.attachments.length.toString()) ||
      `${this.currentIndex + 1} of ${this.attachments.length}`;
    this.liveAnnouncer.announce(positionText, 'polite');

    // Re-setup PIP event listeners for new video element
    setTimeout(() => this.setupPipEventListeners(), 100);

    // Trigger change detection
    this.cdr.detectChanges();
  }

  /**
   * Navigates to a specific index in the gallery
   * Validates that the index is within bounds
   * Exits PIP mode and stops current video playback before navigating
   * @param index The target index to navigate to
   * @see Requirements 1.8, 8.3, Task 20.6
   */
  navigateToIndex(index: number): void {
    if (!this.isGalleryMode) {
      return;
    }

    // Validate index is within bounds
    if (index < 0 || index >= this.attachments.length) {
      console.warn(`Invalid index ${index}. Must be between 0 and ${this.attachments.length - 1}`);
      return;
    }

    // Exit PIP mode if active (Task 20.6)
    if (this.isPipMode) {
      this.exitPictureInPicture();
    }

    // Stop current video if playing
    this.stopCurrentVideo();

    // Update index
    this.currentIndex = index;

    // Emit index change event
    this.indexChange.emit(this.currentIndex);

    // Re-setup PIP event listeners for new video element
    setTimeout(() => this.setupPipEventListeners(), 100);

    // Trigger change detection
    this.cdr.detectChanges();
  }

  /**
   * Announces the current gallery position for screen readers
   * Called when viewer opens in gallery mode and after navigation
   * @see Requirement 17.9
   */
  private announceGalleryPosition(): void {
    if (!this.isGalleryMode) {
      return;
    }

    const positionText =
      getLocalizedString('accessibility_gallery_position')
        ?.replace('{current}', (this.currentIndex + 1).toString())
        ?.replace('{total}', this.attachments.length.toString()) ||
      `Image ${this.currentIndex + 1} of ${this.attachments.length}`;
    this.liveAnnouncer.announce(positionText, 'polite');
  }

  /**
   * Stops the currently playing video if the current media is a video
   * Pauses playback and resets currentTime to 0
   * @see Requirements 3.3, 3.4, 8.5
   */
  private stopCurrentVideo(): void {
    if (this.videoElement?.nativeElement) {
      const video = this.videoElement.nativeElement;
      video.pause();
      video.currentTime = 0;
    }
  }

  /**
   * Downloads the currently displayed media
   * In gallery mode, downloads the current attachment
   * In single mode, downloads the media from url input
   * Generates a default filename if none is provided
   * @see Requirements 9.1, 9.2, 9.3
   */
  download(): void {
    // Get current media URL
    let mediaUrl: string;
    let filename: string;
    let currentMedia: MediaAttachment | string;

    if (this.isGalleryMode && this.currentAttachment) {
      // Gallery mode: use current attachment
      mediaUrl = this.currentAttachment.url;
      filename =
        this.currentAttachment.name ||
        this.generateDefaultFilename(this.currentAttachment.type || 'image');
      currentMedia = this.currentAttachment;
    } else {
      // Single mode: use url input
      mediaUrl = this.url;
      filename = this.fileName || this.generateDefaultFilename(this.mediaType);
      currentMedia = mediaUrl;
    }

    // Validate URL exists
    if (!mediaUrl) {
      console.warn('No media URL available for download');
      return;
    }

    // Create a temporary anchor element to trigger download
    const link = document.createElement('a');
    link.href = mediaUrl;
    link.download = filename;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';

    // Append to body, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Emit downloadClick event with current media
    this.downloadClick.emit(currentMedia);
  }

  /**
   * Generates a default filename based on media type
   * @param mediaType The type of media (image, video, audio, file)
   * @returns A default filename with timestamp
   * @see Requirements 9.3
   */
  private generateDefaultFilename(mediaType: string): string {
    const timestamp = Date.now();
    const extensions: Record<string, string> = {
      image: 'jpg',
      video: 'mp4',
      audio: 'mp3',
      file: 'bin',
    };
    const extension = extensions[mediaType] || 'bin';
    return `download_${timestamp}.${extension}`;
  }

  /**
   * Prevents body scroll by setting overflow to hidden
   * Stores the original overflow value for later restoration
   * @see Requirements 7.1
   */
  private preventBodyScroll(): void {
    // Store the current body overflow value
    this.originalBodyOverflow = document.body.style.overflow;
    // Set body overflow to hidden to prevent scrolling
    document.body.style.overflow = 'hidden';
  }

  /**
   * Restores the original body overflow value
   * Called when the viewer closes or is destroyed
   * @see Requirements 7.2, 7.3
   */
  private restoreBodyScroll(): void {
    // Restore the original body overflow value
    document.body.style.overflow = this.originalBodyOverflow;
  }

  // ===== Picture-in-Picture Methods (Task 20.3) =====

  /**
   * Determines if the PIP button should be shown
   * Only shows for video content when PIP is enabled and supported
   * @see Task 20.5
   */
  get showPipButton(): boolean {
    const isVideo = this.isGalleryMode
      ? this.currentAttachment?.type === 'video'
      : this.mediaType === 'video';
    return this.enablePictureInPicture && this.isPipSupported && isVideo && !this.videoError;
  }

  /**
   * Enters Picture-in-Picture mode for the current video
   * Checks if video element exists and PIP is supported
   * Ensures video is playing before requesting PIP (browser requirement)
   * @see Task 20.3
   */
  async enterPictureInPicture(): Promise<void> {
    CometChatLogger.debug('CometChatFullscreenViewer', 'enterPictureInPicture called');

    // Check if PIP is supported
    if (!this.isPipSupported) {
      return;
    }

    // Check if another element is already in PIP mode
    if ((document as any).pictureInPictureElement) {
      try {
        await (document as any).exitPictureInPicture();
      } catch (e) {
        // Failed to exit existing PIP, continue anyway
        CometChatLogger.error('CometChatFullscreenViewer', 'Failed to exit existing PIP:', e);
      }
    }

    // Try to get video element from ViewChild first, then fallback to DOM query
    let video: HTMLVideoElement | null = this.videoElement?.nativeElement || null;

    if (!video) {
      // Fallback: query the DOM directly
      video = this.viewerContainer?.nativeElement?.querySelector('video') || null;
    }

    if (!video) {
      return;
    }

    try {
      // Wait for video to have enough data if needed
      if (video.readyState < 2) {
        CometChatLogger.debug(
          'CometChatFullscreenViewer',
          'Waiting for video to be ready (readyState < 2)...'
        );
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Video load timeout'));
          }, 5000);

          const onCanPlay = () => {
            clearTimeout(timeout);
            video!.removeEventListener('canplay', onCanPlay);
            video!.removeEventListener('error', onError);
            resolve();
          };

          const onError = () => {
            CometChatLogger.error('CometChatFullscreenViewer', 'Video error event fired');
            clearTimeout(timeout);
            video!.removeEventListener('canplay', onCanPlay);
            video!.removeEventListener('error', onError);
            reject(new Error('Video load error'));
          };

          video!.addEventListener('canplay', onCanPlay);
          video!.addEventListener('error', onError);

          // Try to load the video if not already loading
          if (video!.readyState === 0) {
            video!.load();
          }
        });
      }

      // Browser requires video to be playing before entering PIP
      // If video is paused, start playing it first
      if (video.paused) {
        try {
          await video.play();
        } catch (playError) {
          CometChatLogger.error(
            'CometChatFullscreenViewer',
            'Failed to start video playback:',
            playError
          );
          // Some browsers allow PIP even without playing, so continue
        }
      }

      // Small delay to ensure video is actually playing
      await new Promise(resolve => setTimeout(resolve, 100));

      const pipWindow = await video.requestPictureInPicture();
      CometChatLogger.debug(
        'CometChatFullscreenViewer',
        'Picture-in-Picture activated successfully'
      );

      // Update state immediately (event listener will also fire)
      this.isPipMode = true;
      this.pipStateChange.emit(true);
      this.cdr.detectChanges();
    } catch (error) {
      CometChatLogger.error(
        'CometChatFullscreenViewer',
        'Failed to enter Picture-in-Picture mode:',
        error
      );
      if (error instanceof DOMException) {
        CometChatLogger.error(
          'CometChatFullscreenViewer',
          `DOMException ${error.name}:`,
          error.message
        );
      }
    }
  }

  /**
   * Exits Picture-in-Picture mode
   * @see Task 20.3
   */
  async exitPictureInPicture(): Promise<void> {
    // Check if currently in PIP mode
    if (!(document as any).pictureInPictureElement) {
      return;
    }

    try {
      await (document as any).exitPictureInPicture();
      // State will be updated by the event listener
    } catch (error) {
      CometChatLogger.error(
        'CometChatFullscreenViewer',
        'Failed to exit Picture-in-Picture mode:',
        error
      );
    }
  }

  /**
   * Toggles Picture-in-Picture mode
   * Enters PIP if not in PIP mode, exits if in PIP mode
   * @see Task 20.3
   */
  togglePictureInPicture(): void {
    if (this.isPipMode) {
      this.exitPictureInPicture();
    } else {
      this.enterPictureInPicture();
    }
  }

  /**
   * Sets up event listeners for Picture-in-Picture events on the video element
   * @see Task 20.4
   */
  private setupPipEventListeners(): void {
    // Remove existing listeners first
    this.removePipEventListeners();

    // Try to get video element from ViewChild first, then fallback to DOM query
    let video: HTMLVideoElement | null = this.videoElement?.nativeElement || null;

    if (!video && this.viewerContainer?.nativeElement) {
      // Fallback: query the DOM directly
      video = this.viewerContainer.nativeElement.querySelector('video');
    }

    if (!video) {
      return;
    }

    // Create bound listeners
    this.pipEnterListener = () => {
      this.isPipMode = true;
      this.pipStateChange.emit(true);
      this.cdr.detectChanges();

      // Note: We emit pipStateChange(true) to notify parent components that PIP is active.
      // The parent component (e.g., video bubble) should handle closing the fullscreen viewer
      // while maintaining a hidden video element to keep PIP alive.
      // If the video element is destroyed (e.g., via *ngIf), the PIP window will close.
    };

    this.pipLeaveListener = () => {
      this.isPipMode = false;
      this.pipStateChange.emit(false);
      this.cdr.detectChanges();
    };

    // Add event listeners
    video.addEventListener('enterpictureinpicture', this.pipEnterListener);
    video.addEventListener('leavepictureinpicture', this.pipLeaveListener);
  }

  /**
   * Removes Picture-in-Picture event listeners from the video element
   * @see Task 20.4
   */
  private removePipEventListeners(): void {
    // Try to get video element from ViewChild first, then fallback to DOM query
    let video: HTMLVideoElement | null = this.videoElement?.nativeElement || null;

    if (!video && this.viewerContainer?.nativeElement) {
      // Fallback: query the DOM directly
      video = this.viewerContainer.nativeElement.querySelector('video');
    }

    if (!video) {
      return;
    }

    if (this.pipEnterListener) {
      video.removeEventListener('enterpictureinpicture', this.pipEnterListener);
      this.pipEnterListener = null;
    }

    if (this.pipLeaveListener) {
      video.removeEventListener('leavepictureinpicture', this.pipLeaveListener);
      this.pipLeaveListener = null;
    }
  }

  /**
   * Gets the appropriate aria-label for the PIP button
   * @see Task 20.5
   */
  getPipButtonAriaLabel(): string {
    if (this.isPipMode) {
      return getLocalizedString('fullscreen_viewer_pip_exit');
    }
    return getLocalizedString('fullscreen_viewer_pip_enter');
  }
}
