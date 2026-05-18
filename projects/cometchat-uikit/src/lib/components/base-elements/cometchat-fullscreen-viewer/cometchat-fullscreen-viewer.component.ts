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
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
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
import type { FullscreenViewerMediaType } from './cometchat-fullscreen-viewer.types';
import {
  formatFileSize,
  getFileExtension,
  generateDefaultFilename,
  preventBodyScroll,
  restoreBodyScroll,
  triggerMediaDownload,
  resolveDownloadTarget,
  getViewerAriaLabel,
  getMediaAltText,
  getGalleryPositionText,
  enterPip,
  exitPip,
  downloadImageWithRetry,
} from './cometchat-fullscreen-viewer.utils';

// Re-export for backward compatibility
export type { FullscreenViewerMediaType } from './cometchat-fullscreen-viewer.types';

@Component({
  selector: 'cometchat-fullscreen-viewer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './cometchat-fullscreen-viewer.component.html',
  styleUrls: ['./cometchat-fullscreen-viewer.component.css'],
})
export class CometChatFullScreenViewerComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  // ── Single-mode Inputs ────────────────────────────────────────────────────
  @Input() url = '';
  @Input() mediaType: FullscreenViewerMediaType = 'image';
  @Input() fileName = '';
  @Input() fileSize?: number;
  @Input() placeholderImage?: string;
  @Input() message?: CometChat.BaseMessage;
  @Input() imageSentAtDateTimeFormat?: CalendarObject;

  // ── Gallery-mode Inputs ───────────────────────────────────────────────────
  @Input() attachments: MediaAttachment[] = [];
  @Input() startIndex = 0;
  @Input() isOpen = false;
  @Input() explicitSenderName = '';
  @Input() explicitSenderAvatarUrl = '';
  @Input() prevIconUrl = 'assets/arrow_back.svg';
  @Input() nextIconUrl = 'assets/arrow_forward.svg';
  @Input() downloadIconUrl = 'assets/download.svg';

  // ── PIP Inputs ────────────────────────────────────────────────────────────
  @Input() enablePictureInPicture = true;
  @Input() pipIconUrl = 'assets/zoom_out_map.svg';
  @Input() pipExitIconUrl = 'assets/zoom_in_map.svg';

  // ── Outputs ───────────────────────────────────────────────────────────────
  @Output() closeClick = new EventEmitter<void>();
  @Output() indexChange = new EventEmitter<number>();
  @Output() downloadClick = new EventEmitter<MediaAttachment | string>();
  @Output() pipStateChange = new EventEmitter<boolean>();

  // ── View References ───────────────────────────────────────────────────────
  @ViewChild('closeButton') closeButton?: ElementRef<HTMLButtonElement>;
  @ViewChild('viewerContainer') viewerContainer?: ElementRef<HTMLDivElement>;
  @ViewChild('videoElement') videoElement?: ElementRef<HTMLVideoElement>;

  // ── State ─────────────────────────────────────────────────────────────────
  currentIndex = 0;
  image?: string;
  isDownloading = true;
  progress = 0;
  videoError = false;
  isPipMode = false;
  isPipSupported = false;

  private previouslyFocusedElement: HTMLElement | null = null;
  private originalBodyOverflow = '';
  private pipEnterListener: (() => void) | null = null;
  private pipLeaveListener: (() => void) | null = null;

  private liveAnnouncer = inject(LiveAnnouncerService);
  private focusTrapService = inject(FocusTrapService);
  private mediaControlsService = inject(MediaControlsService);

  constructor(private cdr: ChangeDetectorRef) {}

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.isPipSupported =
      'pictureInPictureEnabled' in document && (document as any).pictureInPictureEnabled;

    if (this.isGalleryMode) {
      this.currentIndex = Math.max(0, Math.min(this.startIndex, this.attachments.length - 1));
    }

    if (this.url) {
      if (this.mediaType === 'image') { this.image = this.url; }
      this.isDownloading = false;
      this.progress = 100;
    } else {
      this.isDownloading = false;
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    const isOpenChange = changes['isOpen'];
    if (isOpenChange?.currentValue === true && !isOpenChange.previousValue) {
      this.previouslyFocusedElement = document.activeElement as HTMLElement;
      this.originalBodyOverflow = preventBodyScroll();
      this.liveAnnouncer.announce(getViewerAriaLabel(this.mediaType), 'polite');
      if (this.isGalleryMode) { setTimeout(() => this.announceGalleryPosition(), 100); }
      setTimeout(() => {
        if (this.viewerContainer?.nativeElement) {
          this.focusTrapService.activate({ container: this.viewerContainer.nativeElement, initialFocus: this.closeButton?.nativeElement || 'first', returnFocusOnDeactivate: true });
        }
      }, 100);
    }
    if (isOpenChange?.currentValue === false && isOpenChange.previousValue === true) {
      restoreBodyScroll(this.originalBodyOverflow);
      if (this.viewerContainer?.nativeElement) { this.focusTrapService.deactivate(this.viewerContainer.nativeElement); }
    }
    if (changes['startIndex'] && !changes['startIndex'].firstChange && this.isGalleryMode) {
      const idx = changes['startIndex'].currentValue;
      if (typeof idx === 'number' && idx >= 0 && idx < this.attachments.length) { this.navigateToIndex(idx); }
    }
    if (changes['attachments'] && !changes['attachments'].firstChange) {
      const arr = changes['attachments'].currentValue;
      if (Array.isArray(arr)) {
        if (this.currentIndex >= arr.length) { this.currentIndex = 0; this.indexChange.emit(0); }
        this.cdr.detectChanges();
      }
    }
  }

  ngAfterViewInit(): void {
    if (this.isOpen && this.viewerContainer?.nativeElement) {
      setTimeout(() => {
        this.focusTrapService.activate({ container: this.viewerContainer!.nativeElement, initialFocus: this.closeButton?.nativeElement || 'first', returnFocusOnDeactivate: true });
        if (this.isGalleryMode) { this.announceGalleryPosition(); }
      }, 100);
    }
    setTimeout(() => this.setupPipEventListeners(), 200);
  }

  ngOnDestroy(): void {
    if (this.viewerContainer?.nativeElement) { this.focusTrapService.deactivate(this.viewerContainer.nativeElement); }
    if (this.isPipMode) { this.exitPictureInPicture(); }
    this.removePipEventListeners();
    this.stopCurrentVideo();
    restoreBodyScroll(this.originalBodyOverflow);
  }

  // ── Image Download (legacy) ───────────────────────────────────────────────

  downloadImage(imgUrl: string, attemptCount = 0): void {
    downloadImageWithRetry(
      imgUrl,
      (percent) => { this.progress = percent; },
      (objectUrl) => { this.isDownloading = false; this.image = objectUrl; },
      (url) => { this.image = url; this.isDownloading = false; },
      attemptCount
    );
  }

  // ── Close ─────────────────────────────────────────────────────────────────

  close(keepPipActive = false): void {
    if (this.isPipMode && !keepPipActive) { this.exitPictureInPicture(); }
    if (!keepPipActive || !this.isPipMode) { this.stopCurrentVideo(); }
    if (this.viewerContainer?.nativeElement) {
      this.focusTrapService.deactivate(this.viewerContainer.nativeElement);
    }
    restoreBodyScroll(this.originalBodyOverflow);
    this.closeClick.emit();
    if (this.previouslyFocusedElement && typeof this.previouslyFocusedElement.focus === 'function') {
      setTimeout(() => this.previouslyFocusedElement?.focus(), 0);
    }
  }

  handleCloseClick(event: MouseEvent): void { event.stopPropagation(); this.close(); }

  handleCloseKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); event.stopPropagation(); this.close(); }
  }

  // ── Keyboard ──────────────────────────────────────────────────────────────

  @HostListener('document:keydown', ['$event'])
  handleDocumentKeydown(event: KeyboardEvent): void {
    if (!this.isOpen) return;
    if (event.key === 'Escape') { event.preventDefault(); this.close(); return; }

    const isVideoMode = this.isGalleryMode
      ? this.currentAttachment?.type === 'video'
      : this.mediaType === 'video';

    if (isVideoMode && this.videoElement?.nativeElement && !this.videoError) {
      const video = this.videoElement.nativeElement;
      if ([' ', 'ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) {
        const result = this.mediaControlsService.handleKeyDown(event, {
          currentTime: video.currentTime, duration: video.duration || 0, isPlaying: !video.paused, seekIncrement: 5,
        });
        if (result.action === 'play') { video.play(); this.liveAnnouncer.announce(getLocalizedString('audio_bubble_play'), 'polite'); }
        else if (result.action === 'pause') { video.pause(); this.liveAnnouncer.announce(getLocalizedString('audio_bubble_pause'), 'polite'); }
        else if (result.seekTime !== undefined) {
          video.currentTime = result.seekTime;
          this.liveAnnouncer.announce(this.mediaControlsService.formatTimeForAnnouncement(result.seekTime), 'polite');
        }
        return;
      }
    }

    if (this.isGalleryMode) {
      if (event.key === 'ArrowRight' && this.canNavigateNext) { event.preventDefault(); this.navigateNext(); }
      else if (event.key === 'ArrowLeft' && this.canNavigatePrev) { event.preventDefault(); this.navigatePrev(); }
    }
  }

  @HostListener('keydown', ['$event'])
  handleKeydown(_event: KeyboardEvent): void { /* Focus trapping handled by FocusTrapService */ }

  handleVideoError(): void { this.videoError = true; this.cdr.detectChanges(); }

  // ── Getters ───────────────────────────────────────────────────────────────

  getDateFormat(): CalendarObject {
    const defaultFormat = {
      yesterday: ` DD/M/YYYY [${getLocalizedString('full_screen_viewer_at')}] hh:mm A`,
      otherDays: ` DD/M/YYYY [${getLocalizedString('full_screen_viewer_at')}] hh:mm A`,
      today: ` DD/M/YYYY [${getLocalizedString('full_screen_viewer_at')}] hh:mm A`,
    };
    return {
      ...defaultFormat,
      ...sanitizeCalendarObject(CometChatLocalize.getCalendarObject()),
      ...sanitizeCalendarObject(this.imageSentAtDateTimeFormat),
    };
  }

  get senderName(): string { return this.explicitSenderName || this.message?.getSender()?.getName() || ''; }
  get senderAvatar(): string { return this.explicitSenderAvatarUrl || this.message?.getSender()?.getAvatar() || ''; }
  get formattedDate(): string { return this.message?.getSentAt ? CometChatLocalize.formatDate(this.message.getSentAt(), this.getDateFormat()) : ''; }
  get progressStrokeDasharray(): string { return `${this.progress / 1.13} 113`; }
  get formattedFileSize(): string { return formatFileSize(this.fileSize); }
  get fileExtension(): string { return getFileExtension(this.fileName); }
  get showSenderInfo(): boolean { return !!(this.explicitSenderName || this.explicitSenderAvatarUrl || (this.message && (this.senderName || this.senderAvatar))); }
  get currentFileName(): string { return this.isGalleryMode ? (this.currentAttachment?.name || '') : (this.fileName || ''); }
  get currentFileSize(): string { return formatFileSize(this.isGalleryMode ? this.currentAttachment?.size : this.fileSize); }
  get currentFileExtension(): string { return getFileExtension(this.isGalleryMode ? (this.currentAttachment?.name || '') : this.fileName); }
  getLocalizedString(key: string): string { return getLocalizedString(key); }
  getViewerAriaLabel(): string { return getViewerAriaLabel(this.mediaType); }
  getMediaAltText(): string { return getMediaAltText(this.isGalleryMode ? this.currentAttachment?.type : this.mediaType, this.senderName, this.fileName); }

  // ── Gallery Mode ──────────────────────────────────────────────────────────

  get isGalleryMode(): boolean { return this.attachments && this.attachments.length > 0; }
  get currentAttachment(): MediaAttachment | null {
    if (!this.isGalleryMode) return null;
    if (this.currentIndex < 0 || this.currentIndex >= this.attachments.length) return null;
    return this.attachments[this.currentIndex];
  }
  get canNavigatePrev(): boolean { return this.isGalleryMode && this.currentIndex > 0; }
  get canNavigateNext(): boolean { return this.isGalleryMode && this.currentIndex < this.attachments.length - 1; }

  navigateNext(): void {
    if (!this.canNavigateNext) return;
    if (this.isPipMode) { this.exitPictureInPicture(); }
    this.stopCurrentVideo(); this.currentIndex++;
    this.indexChange.emit(this.currentIndex);
    this.liveAnnouncer.announce(getGalleryPositionText(this.currentIndex + 1, this.attachments.length), 'polite');
    setTimeout(() => this.setupPipEventListeners(), 100); this.cdr.detectChanges();
  }

  navigatePrev(): void {
    if (!this.canNavigatePrev) return;
    if (this.isPipMode) { this.exitPictureInPicture(); }
    this.stopCurrentVideo(); this.currentIndex--;
    this.indexChange.emit(this.currentIndex);
    this.liveAnnouncer.announce(getGalleryPositionText(this.currentIndex + 1, this.attachments.length), 'polite');
    setTimeout(() => this.setupPipEventListeners(), 100); this.cdr.detectChanges();
  }

  navigateToIndex(index: number): void {
    if (!this.isGalleryMode || index < 0 || index >= this.attachments.length) return;
    if (this.isPipMode) { this.exitPictureInPicture(); }
    this.stopCurrentVideo(); this.currentIndex = index;
    this.indexChange.emit(this.currentIndex);
    setTimeout(() => this.setupPipEventListeners(), 100); this.cdr.detectChanges();
  }

  private announceGalleryPosition(): void {
    if (!this.isGalleryMode) return;
    const text =
      getLocalizedString('accessibility_gallery_position')
        ?.replace('{current}', (this.currentIndex + 1).toString())
        ?.replace('{total}', this.attachments.length.toString()) ||
      `Image ${this.currentIndex + 1} of ${this.attachments.length}`;
    this.liveAnnouncer.announce(text, 'polite');
  }

  private stopCurrentVideo(): void {
    if (this.videoElement?.nativeElement) {
      this.videoElement.nativeElement.pause();
      this.videoElement.nativeElement.currentTime = 0;
    }
  }

  // ── Download ──────────────────────────────────────────────────────────────

  download(): void {
    const target = resolveDownloadTarget(
      this.isGalleryMode, this.currentAttachment, this.url, this.fileName, this.mediaType
    );
    if (!target) { CometChatLogger.warn('CometChatFullscreenViewer', 'No media URL available for download'); return; }
    triggerMediaDownload(target.mediaUrl, target.filename);
    this.downloadClick.emit(target.currentMedia);
  }

  // ── Picture-in-Picture ────────────────────────────────────────────────────

  get showPipButton(): boolean {
    const isVideo = this.isGalleryMode ? this.currentAttachment?.type === 'video' : this.mediaType === 'video';
    return this.enablePictureInPicture && this.isPipSupported && isVideo && !this.videoError;
  }

  async enterPictureInPicture(): Promise<void> {
    if (!this.isPipSupported) return;
    if ((document as any).pictureInPictureElement) {
      try { await (document as any).exitPictureInPicture(); } catch { /* ignore */ }
    }
    const video: HTMLVideoElement | null = this.videoElement?.nativeElement ||
      this.viewerContainer?.nativeElement?.querySelector('video') || null;
    if (!video) return;
    const success = await enterPip(video);
    if (success) { this.isPipMode = true; this.pipStateChange.emit(true); this.cdr.detectChanges(); }
  }

  async exitPictureInPicture(): Promise<void> {
    await exitPip();
    // State updated by leavepictureinpicture event listener
  }

  togglePictureInPicture(): void {
    if (this.isPipMode) { this.exitPictureInPicture(); } else { this.enterPictureInPicture(); }
  }

  private setupPipEventListeners(): void {
    this.removePipEventListeners();
    const video: HTMLVideoElement | null = this.videoElement?.nativeElement ||
      this.viewerContainer?.nativeElement?.querySelector('video') || null;
    if (!video) return;
    this.pipEnterListener = () => { this.isPipMode = true; this.pipStateChange.emit(true); this.cdr.detectChanges(); };
    this.pipLeaveListener = () => { this.isPipMode = false; this.pipStateChange.emit(false); this.cdr.detectChanges(); };
    video.addEventListener('enterpictureinpicture', this.pipEnterListener);
    video.addEventListener('leavepictureinpicture', this.pipLeaveListener);
  }

  private removePipEventListeners(): void {
    const video: HTMLVideoElement | null = this.videoElement?.nativeElement ||
      this.viewerContainer?.nativeElement?.querySelector('video') || null;
    if (!video) return;
    if (this.pipEnterListener) { video.removeEventListener('enterpictureinpicture', this.pipEnterListener); this.pipEnterListener = null; }
    if (this.pipLeaveListener) { video.removeEventListener('leavepictureinpicture', this.pipLeaveListener); this.pipLeaveListener = null; }
  }

  getPipButtonAriaLabel(): string {
    return this.isPipMode
      ? getLocalizedString('fullscreen_viewer_pip_exit')
      : getLocalizedString('fullscreen_viewer_pip_enter');
  }
}
