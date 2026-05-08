/**
 * CometChatAudioBubbleComponent
 *
 * Renders audio attachments with waveform visualization, playback controls,
 * download functionality, and support for multiple audio attachments.
 */

import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  OnDestroy,
  AfterViewInit,
  SimpleChanges,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ViewChild,
  ViewChildren,
  ElementRef,
  QueryList,
  NgZone,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';

import { TranslatePipe } from '../../resources/CometChatLocalize/translate.pipe';
import { MessageBubbleAlignment } from '../../Enums/Enums';
import { CometChatTextBubbleComponent } from '../cometchat-text-bubble/cometchat-text-bubble.component';
import type { AudioAttachment, AudioState } from '../../modals';
import { WaveSurfer } from './wavesurfer';
import { MediaControlsService } from '../../services/media-controls.service';
import { LiveAnnouncerService } from '../../services/live-announcer.service';
import {
  resolveWaveSurferColors,
  createWaveSurferInstance,
  attachWaveSurferEvents,
  downloadAudioWithProgress,
  triggerFileDownload,
  extractAudioAttachments,
  hasAudioCaption,
  getAudioRegionAriaLabel,
  getPlayPauseAriaLabel,
  announceSeekPosition,
  announcePlaybackComplete,
  announceSeekStart,
  announceSeekEnd,
  getProgressDashArray,
  formatAudioTime,
  getExpandAriaLabel,
} from './cometchat-audio-bubble.utils';

/** Global singleton tracking the currently playing audio across all bubbles. */
export const currentAudioPlayer: {
  instance: WaveSurfer | null;
  setIsPlaying: ((isPlaying: boolean) => void) | null;
} = { instance: null, setIsPlaying: null };

/** Pauses the currently playing audio if any. */
export function closeCurrentMediaPlayer(emitEvent = true): void {
  if (currentAudioPlayer.instance) {
    currentAudioPlayer.instance.pause();
    if (currentAudioPlayer.setIsPlaying && emitEvent) {
      currentAudioPlayer.setIsPlaying(false);
    }
    currentAudioPlayer.instance = null;
    currentAudioPlayer.setIsPlaying = null;
  }
}

@Component({
  selector: 'cometchat-audio-bubble',
  standalone: true,
  templateUrl: './cometchat-audio-bubble.component.html',
  styleUrls: ['./cometchat-audio-bubble.component.css'],
  imports: [CommonModule, TranslatePipe, CometChatTextBubbleComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CometChatAudioBubbleComponent implements OnInit, OnChanges, OnDestroy, AfterViewInit {
  private pendingTimers: ReturnType<typeof setTimeout>[] = [];

  @Input({ required: true }) message!: CometChat.MediaMessage;
  @Input() alignment: MessageBubbleAlignment = MessageBubbleAlignment.left;

  @Output() playStateChange = new EventEmitter<{ isPlaying: boolean; attachment: AudioAttachment }>();
  @Output() downloadStart = new EventEmitter<AudioAttachment>();
  @Output() downloadComplete = new EventEmitter<AudioAttachment>();
  @Output() downloadError = new EventEmitter<{ attachment: AudioAttachment; error: Error }>();
  @Output() expandChange = new EventEmitter<boolean>();

  @ViewChild('collapseButton') collapseButton?: ElementRef<HTMLButtonElement>;
  @ViewChild('expandIndicator') expandIndicator?: ElementRef<HTMLButtonElement>;
  @ViewChildren('waveformContainer') waveformContainers!: QueryList<ElementRef<HTMLDivElement>>;

  protected attachments: AudioAttachment[] = [];
  protected isExpanded = false;
  protected hasCaption = false;
  protected isOutgoing = false;
  protected audioStates = new Map<number, AudioState>();

  readonly MessageBubbleAlignment = MessageBubbleAlignment;

  private mediaControlsService = inject(MediaControlsService);
  private liveAnnouncer = inject(LiveAnnouncerService);

  constructor(private cdr: ChangeDetectorRef, private ngZone: NgZone) {}

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  ngOnInit(): void { this.processMessage(); }

  ngOnChanges(changes: SimpleChanges): void {
    const messageChange = changes['message'];
    const alignmentChange = changes['alignment'];
    if (messageChange || alignmentChange) {
      this.cleanupWaveSurferInstances();
      if (messageChange && !messageChange.firstChange) { this.isExpanded = false; }
      this.processMessage();
      if (
        (messageChange && !messageChange.firstChange) ||
        (alignmentChange && !alignmentChange.firstChange)
      ) {
        this.pendingTimers.push(setTimeout(() => this.initializeAllWaveSurfers(), 0));
      }
    }
  }

  ngAfterViewInit(): void { this.initializeAllWaveSurfers(); }

  ngOnDestroy(): void {
    this.pendingTimers.forEach(t => clearTimeout(t));
    this.pendingTimers = [];
    this.cleanupWaveSurferInstances();
  }

  // ── Message Processing ────────────────────────────────────────────────────

  private processMessage(): void {
    if (!this.message) {
      console.warn('[CometChatAudioBubble] Message is null or undefined');
      this.attachments = []; this.hasCaption = false; return;
    }
    this.attachments = extractAudioAttachments(this.message);
    this.hasCaption = hasAudioCaption(this.message);
    this.isOutgoing = this.alignment === MessageBubbleAlignment.right;
    this.cdr.markForCheck();
  }

  // ── WaveSurfer Management ─────────────────────────────────────────────────

  private cleanupWaveSurferInstances(): void {
    // Clear global player ref if owned by this component
    if (currentAudioPlayer.instance) {
      for (const [, s] of this.audioStates) {
        if (s.waveSurfer === currentAudioPlayer.instance) {
          currentAudioPlayer.instance = null; currentAudioPlayer.setIsPlaying = null; break;
        }
      }
    }
    this.audioStates.forEach(s => {
      if (s.waveSurfer) { s.waveSurfer.unAll(); try { s.waveSurfer.destroy(); } catch { /* ignore */ } }
      s.abortController?.abort();
    });
    this.audioStates.clear();
  }

  protected getAudioState(index: number): AudioState {
    if (!this.audioStates.has(index)) {
      this.audioStates.set(index, {
        waveSurfer: null, isPlaying: false, isLoading: true, hasError: false,
        currentTime: 0, duration: 0, isDownloading: false, downloadProgress: 0, abortController: null,
      });
    }
    return this.audioStates.get(index)!;
  }

  private initializeAllWaveSurfers(): void {
    if (!this.attachments.length) return;
    this.initializeWaveSurfer(0);
    if (this.isExpanded) {
      for (let i = 1; i < this.attachments.length; i++) { this.initializeWaveSurfer(i); }
    }
  }

  private initializeWaveSurfer(index: number): void {
    const attachment = this.attachments[index];
    if (!attachment?.url) return;
    const containers = this.waveformContainers?.toArray();
    if (!containers?.[index]) return;
    const container = containers[index].nativeElement;
    const state = this.getAudioState(index);
    if (state.waveSurfer) return;
    state.isLoading = true;
    this.cdr.markForCheck();
    const colors = resolveWaveSurferColors(this.isOutgoing);
    const waveSurfer = createWaveSurferInstance(container, colors);
    state.waveSurfer = waveSurfer;
    this.setupWaveSurferEvents(waveSurfer, index);
    waveSurfer.load(attachment.url).catch((error: Error) => this.handleLoadError(error, index));
  }

  private setupWaveSurferEvents(waveSurfer: WaveSurfer, index: number): void {
    attachWaveSurferEvents(waveSurfer, index, {
      onReady: (i, duration) => this.ngZone.run(() => {
        const s = this.getAudioState(i); s.isLoading = false; s.duration = duration; this.cdr.markForCheck();
      }),
      onTimeUpdate: (i, currentTime) => this.ngZone.run(() => {
        this.getAudioState(i).currentTime = currentTime; this.cdr.markForCheck();
      }),
      onFinish: (i) => this.ngZone.run(() => {
        const s = this.getAudioState(i);
        waveSurfer.stop(); waveSurfer.seekTo(0);
        s.isPlaying = false; s.currentTime = 0;
        if (currentAudioPlayer.instance === waveSurfer) {
          currentAudioPlayer.instance = null; currentAudioPlayer.setIsPlaying = null;
        }
        announcePlaybackComplete(this.liveAnnouncer);
        const attachment = this.attachments[i];
        if (attachment) { this.playStateChange.emit({ isPlaying: false, attachment }); }
        this.cdr.markForCheck();
      }),
      onPlay: (i) => this.ngZone.run(() => { this.getAudioState(i).isPlaying = true; this.cdr.markForCheck(); }),
      onPause: (i) => this.ngZone.run(() => { this.getAudioState(i).isPlaying = false; this.cdr.markForCheck(); }),
      onError: (i, error) => this.handleLoadError(error, i),
    });
  }

  private handleLoadError(error: Error, index: number): void {
    console.error(`[CometChatAudioBubble] Failed to load audio at index ${index}:`, error);
    this.ngZone.run(() => {
      const state = this.getAudioState(index);
      state.isLoading = false; state.hasError = true; state.waveSurfer = null;
      this.cdr.markForCheck();
    });
  }

  // ── Playback Controls ─────────────────────────────────────────────────────

  protected onPlayPause(index: number): void {
    const state = this.getAudioState(index);
    const waveSurfer = state.waveSurfer;
    if (!waveSurfer || state.isLoading) return;
    const attachment = this.attachments[index];
    if (!attachment) return;
    if (state.isPlaying) {
      waveSurfer.pause(); state.isPlaying = false;
      if (currentAudioPlayer.instance === waveSurfer) { currentAudioPlayer.instance = null; currentAudioPlayer.setIsPlaying = null; }
      this.playStateChange.emit({ isPlaying: false, attachment });
    } else {
      if (currentAudioPlayer.instance && currentAudioPlayer.instance !== waveSurfer) { closeCurrentMediaPlayer(true); }
      waveSurfer.play()
        .then(() => {
          state.isPlaying = true;
          currentAudioPlayer.instance = waveSurfer;
          currentAudioPlayer.setIsPlaying = (v: boolean) => { state.isPlaying = v; this.cdr.markForCheck(); };
          this.playStateChange.emit({ isPlaying: true, attachment });
          this.cdr.markForCheck();
        })
        .catch((e: Error) => { console.error('[CometChatAudioBubble] Failed to play audio:', e); state.isPlaying = false; this.cdr.markForCheck(); });
    }
    this.cdr.markForCheck();
  }

  // ── Download ──────────────────────────────────────────────────────────────

  protected onDownload(index: number): void {
    const attachment = this.attachments[index];
    if (!attachment?.url) return;
    const state = this.getAudioState(index);
    if (state.isDownloading) return;
    state.isDownloading = true; state.downloadProgress = 0;
    state.abortController = new AbortController();
    this.downloadStart.emit(attachment);
    this.cdr.markForCheck();
    downloadAudioWithProgress(
      attachment.url,
      (progress: number) => { state.downloadProgress = progress; this.cdr.markForCheck(); },
      state.abortController.signal
    ).then((blob: Blob) => {
      triggerFileDownload(blob, attachment.name);
      state.isDownloading = false; state.downloadProgress = 0; state.abortController = null;
      this.downloadComplete.emit(attachment);
      this.cdr.markForCheck();
    }).catch((error: Error) => { this.handleDownloadError(error, index); });
  }

  protected onCancelDownload(index: number): void {
    const state = this.getAudioState(index);
    if (state.abortController) { state.abortController.abort(); }
    state.isDownloading = false; state.downloadProgress = 0; state.abortController = null;
    this.cdr.markForCheck();
  }

  private handleDownloadError(error: Error, index: number): void {
    const state = this.getAudioState(index);
    const attachment = this.attachments[index];
    if (error.name === 'AbortError') {
      state.isDownloading = false; state.downloadProgress = 0; state.abortController = null;
      this.cdr.markForCheck(); return;
    }
    console.error(`[CometChatAudioBubble] Download failed for index ${index}:`, error);
    state.isDownloading = false; state.downloadProgress = 0; state.abortController = null;
    if (attachment) { this.downloadError.emit({ attachment, error }); }
    this.cdr.markForCheck();
  }

  // ── Expand/Collapse ───────────────────────────────────────────────────────

  protected toggleExpanded(): void {
    const wasExpanded = this.isExpanded;
    this.isExpanded = !this.isExpanded;
    this.expandChange.emit(this.isExpanded);
    this.cdr.markForCheck();
    if (this.isExpanded) {
      this.pendingTimers.push(setTimeout(() => {
        for (let i = 1; i < this.attachments.length; i++) { this.initializeWaveSurfer(i); }
        this.collapseButton?.nativeElement?.focus();
      }, 0));
    } else if (wasExpanded) {
      this.pendingTimers.push(setTimeout(() => { this.expandIndicator?.nativeElement?.focus(); }, 0));
    }
  }

  // ── Keyboard Navigation ───────────────────────────────────────────────────

  protected onWaveformKeydown(event: KeyboardEvent, index: number): void {
    const state = this.getAudioState(index);
    const waveSurfer = state.waveSurfer;
    if (!waveSurfer || state.isLoading || state.hasError || state.duration <= 0) return;
    const result = this.mediaControlsService.handleKeyDown(event, {
      currentTime: state.currentTime, duration: state.duration,
      isPlaying: state.isPlaying, seekIncrement: 5,
    });
    switch (result.action) {
      case 'play': case 'pause': this.onPlayPause(index); break;
      case 'seek':
        if (result.seekTime !== undefined) {
          waveSurfer.seekTo(result.seekTime / state.duration);
          state.currentTime = result.seekTime;
          announceSeekPosition(result.seekTime, this.mediaControlsService, this.liveAnnouncer);
          this.cdr.markForCheck();
        }
        break;
      case 'seekStart':
        waveSurfer.seekTo(0); state.currentTime = 0;
        announceSeekStart(this.liveAnnouncer); this.cdr.markForCheck(); break;
      case 'seekEnd':
        waveSurfer.seekTo(1); state.currentTime = state.duration;
        announceSeekEnd(this.liveAnnouncer); this.cdr.markForCheck(); break;
    }
  }

  private activateOnKey(event: KeyboardEvent, fn: () => void): void {
    if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); fn(); }
  }

  protected onPlayPauseKeydown(event: KeyboardEvent, index: number): void {
    this.activateOnKey(event, () => this.onPlayPause(index));
  }
  protected onDownloadKeydown(event: KeyboardEvent, index: number): void {
    this.activateOnKey(event, () => this.onDownload(index));
  }
  protected onCancelDownloadKeydown(event: KeyboardEvent, index: number): void {
    this.activateOnKey(event, () => this.onCancelDownload(index));
  }
  protected onExpandCollapseKeydown(event: KeyboardEvent): void {
    this.activateOnKey(event, () => this.toggleExpanded());
  }

  protected getAudioRegionAriaLabel(index: number): string {
    return getAudioRegionAriaLabel(this.getAudioState(index).duration, this.mediaControlsService);
  }

  protected getPlayPauseAriaLabel(index: number): string {
    return getPlayPauseAriaLabel(this.getAudioState(index).isPlaying);
  }

  protected getProgressValueText(index: number): string {
    const state = this.getAudioState(index);
    return this.mediaControlsService.getProgressValueText(state.currentTime, state.duration);
  }

  protected getProgressDashArray(index: number): string {
    return getProgressDashArray(this.getAudioState(index).downloadProgress);
  }

  protected formatTime(timeInSeconds: number): string {
    return formatAudioTime(timeInSeconds);
  }

  protected getRemainingAudiosCount(): number {
    return this.attachments.length - 1;
  }

  protected getExpandAriaLabel(): string {
    return getExpandAriaLabel(this.getRemainingAudiosCount());
  }
}
