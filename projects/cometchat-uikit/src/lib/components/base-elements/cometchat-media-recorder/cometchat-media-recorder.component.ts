import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  HostListener,
  ChangeDetectorRef,
  ElementRef,
  ViewChild,
  NgZone,
  inject, ChangeDetectionStrategy} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../../resources/CometChatLocalize';
import { CometChatLocalize } from '../../../resources/CometChatLocalize/cometchat-localize';
import { LiveAnnouncerService } from '../../../services/live-announcer.service';
import { WaveSurfer } from '../../cometchat-audio-bubble/wavesurfer';

/**
 * CometChatMediaRecorder is a component for recording audio with permission handling.
 * Uses Web Audio API AnalyserNode for real-time voice waveform visualization.
 * Uses WaveSurfer for preview playback when paused.
 *
 * Keyboard Accessibility:
 * - Space/Enter: Activate buttons
 * - Escape: Cancel recording and close recorder
 * - Tab: Navigate between control buttons
 */
@Component({
  selector: 'cometchat-media-recorder',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './cometchat-media-recorder.component.html',
  styleUrls: ['./cometchat-media-recorder.component.css'],
})
export class CometChatMediaRecorderComponent implements OnInit, OnDestroy {
  /** @internal Timer references for cleanup */
  private pendingTimers: ReturnType<typeof setTimeout>[] = [];

  @Input() autoRecording = false;

  @Output() closeRecording = new EventEmitter<void>();
  @Output() submitRecording = new EventEmitter<Blob>();
  @Output() recordingError = new EventEmitter<Error>();

  @ViewChild('waveformContainer') waveformContainer?: ElementRef<HTMLDivElement>;

  private liveAnnouncer = inject(LiveAnnouncerService);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);

  // Internal state
  mediaRecorder?: MediaRecorder;
  isRecording = false;
  isPaused = false;
  mediaPreviewUrl?: string;
  counter = 0;
  hasError = false;
  permissionState: PermissionState = 'prompt';

  /** Number of waveform bars to display */
  private readonly WAVEFORM_BAR_COUNT = 30;

  /** Real-time waveform bar heights driven by AnalyserNode */
  waveformHeights: number[] = new Array(this.WAVEFORM_BAR_COUNT).fill(4);

  /** WaveSurfer preview playback state */
  isPreviewPlaying = false;
  previewCurrentTime = 0;
  previewDuration = 0;

  private stream?: MediaStream;
  private audioChunks: Blob[] = [];
  private timerInterval?: number;
  private recordedBlob?: Blob;
  private hasInitialized = false;
  private pendingInlineSend = false;
  private durationAnnouncementInterval?: number;
  private readonly DURATION_ANNOUNCEMENT_INTERVAL = 10;

  // Web Audio API for real-time waveform
  private audioContext?: AudioContext;
  private analyser?: AnalyserNode;
  private sourceNode?: MediaStreamAudioSourceNode;
  private animationFrameId?: number;

  // WaveSurfer for preview playback
  private waveSurfer?: WaveSurfer;

  ngOnInit(): void {
    if (this.autoRecording) {
      this.pendingTimers.push(setTimeout(() => this.handleStartRecording(), 100));
    }
    this.setupPermissionMonitoring();
  }

  ngOnDestroy(): void {
    this.pendingTimers.forEach(t => clearTimeout(t));
    this.pendingTimers = [];
    this.handleStopRecording();
    this.clearTimer();
    this.clearStream();
    this.clearDurationAnnouncementInterval();
    this.stopWaveformAnalysis();
    this.destroyWaveSurfer();
  }

  @HostListener('keydown.escape', ['$event'])
  handleEscapeKey(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.handleCloseRecording();
  }

  handleKeydown(
    event: KeyboardEvent,
    action: 'start' | 'pause' | 'stop' | 'close' | 'submit' | 'preview'
  ): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      event.stopPropagation();
      switch (action) {
        case 'start':
          this.handleStartRecording();
          break;
        case 'pause':
          this.handlePauseRecording();
          break;
        case 'stop':
          this.handleStopRecording();
          break;
        case 'close':
          this.handleCloseRecording();
          break;
        case 'submit':
          this.handleSubmitRecording();
          break;
        case 'preview':
          this.togglePreviewPlayback();
          break;
      }
    }
  }

  async checkMicrophonePermission(): Promise<PermissionState> {
    try {
      const permission = await navigator.permissions.query({
        name: 'microphone' as PermissionName,
      });
      return permission.state;
    } catch {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        return 'granted';
      } catch (err: unknown) {
        const error = err as { name?: string };
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          return 'denied';
        }
        return 'prompt';
      }
    }
  }

  async setupPermissionMonitoring(): Promise<void> {
    try {
      const permission = await navigator.permissions.query({
        name: 'microphone' as PermissionName,
      });
      permission.onchange = () => {
        this.permissionState = permission.state;
        if (permission.state === 'denied') {
          this.hasError = true;
          this.isRecording = false;
          this.isPaused = false;
          this.clearStream();
          this.stopTimer();
          this.stopWaveformAnalysis();
        } else if (permission.state === 'granted') {
          this.hasError = false;
        }
        this.cdr.detectChanges();
      };
    } catch (error) {
      console.error('Permission monitoring setup failed:', error);
    }
  }

  async initMediaRecorder(): Promise<MediaRecorder | null> {
    try {
      if (this.hasInitialized) return null;

      this.clearStream();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.hasInitialized = true;
      this.stream = stream;

      // Set up Web Audio API for real-time waveform analysis
      this.startWaveformAnalysis(stream);

      const audioRecorder = new MediaRecorder(stream);

      audioRecorder.ondataavailable = (e: BlobEvent) => {
        if (e.data.size > 0) {
          this.audioChunks.push(e.data);
        }
      };

      audioRecorder.onstop = () => {
        if (this.audioChunks.length > 0) {
          const recordedBlob = new Blob(this.audioChunks, {
            type: this.audioChunks[0]?.type || 'audio/webm',
          });
          this.recordedBlob = recordedBlob;
          this.audioChunks = [];

          if (this.pendingInlineSend && this.recordedBlob) {
            this.pendingInlineSend = false;
            this.submitRecording.emit(this.recordedBlob);
            this.reset();
            return;
          }

          this.mediaPreviewUrl = URL.createObjectURL(recordedBlob);
          this.cdr.detectChanges();
        }
      };

      audioRecorder.onerror = (event: Event) => {
        const errorEvent = event as { error?: Error };
        console.error('MediaRecorder error:', errorEvent.error);
        this.hasError = true;
        this.isRecording = false;
        this.isPaused = false;
        this.clearStream();
        this.hasInitialized = false;
        this.stopWaveformAnalysis();
        if (errorEvent.error) {
          this.recordingError.emit(errorEvent.error);
        }
        this.cdr.detectChanges();
      };

      stream.getTracks().forEach(track => {
        track.onended = () => {
          this.hasError = true;
          this.isRecording = false;
          this.stopWaveformAnalysis();
          this.cdr.detectChanges();
        };
      });

      audioRecorder.start(250); // Collect data every 250ms for preview during pause
      this.hasError = false;
      return audioRecorder;
    } catch (error: unknown) {
      const err = error as { name?: string };
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        this.hasError = true;
        this.permissionState = 'denied';
      }
      this.hasInitialized = false;
      this.recordingError.emit(error as Error);
      return null;
    }
  }

  /**
   * Start real-time waveform analysis using Web Audio API AnalyserNode.
   */
  private startWaveformAnalysis(stream: MediaStream): void {
    try {
      this.audioContext = new AudioContext();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 64;
      this.sourceNode = this.audioContext.createMediaStreamSource(stream);
      this.sourceNode.connect(this.analyser);

      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateWaveform = () => {
        if (!this.analyser || !this.isRecording || this.isPaused) return;
        this.analyser.getByteFrequencyData(dataArray);
        const step = Math.max(1, Math.floor(bufferLength / this.WAVEFORM_BAR_COUNT));
        for (let i = 0; i < this.WAVEFORM_BAR_COUNT; i++) {
          const index = Math.min(i * step, bufferLength - 1);
          const value = dataArray[index];
          this.waveformHeights[i] = Math.max(4, Math.round((value / 255) * 24));
        }
        this.waveformHeights = [...this.waveformHeights];
        this.cdr.detectChanges();
        this.animationFrameId = requestAnimationFrame(updateWaveform);
      };
      this.animationFrameId = requestAnimationFrame(updateWaveform);
    } catch (error) {
      console.error('Failed to initialize audio analysis:', error);
    }
  }

  private stopWaveformAnalysis(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = undefined;
    }
    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = undefined;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => {});
      this.audioContext = undefined;
    }
    this.analyser = undefined;
    this.waveformHeights = new Array(this.WAVEFORM_BAR_COUNT).fill(4);
  }

  private resumeWaveformAnalysis(): void {
    if (!this.analyser) return;
    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const updateWaveform = () => {
      if (!this.analyser || !this.isRecording || this.isPaused) return;
      this.analyser.getByteFrequencyData(dataArray);
      const step = Math.max(1, Math.floor(bufferLength / this.WAVEFORM_BAR_COUNT));
      for (let i = 0; i < this.WAVEFORM_BAR_COUNT; i++) {
        const index = Math.min(i * step, bufferLength - 1);
        const value = dataArray[index];
        this.waveformHeights[i] = Math.max(4, Math.round((value / 255) * 24));
      }
      this.waveformHeights = [...this.waveformHeights];
      this.cdr.detectChanges();
      this.animationFrameId = requestAnimationFrame(updateWaveform);
    };
    this.animationFrameId = requestAnimationFrame(updateWaveform);
  }

  // ── Recording control methods ──

  async handleStartRecording(): Promise<void> {
    if (this.isRecording && !this.isPaused) return;

    // If paused, resume recording
    if (this.isPaused && this.mediaRecorder && this.mediaRecorder.state === 'paused') {
      // Stop any preview playback first
      this.stopPreviewPlayback();
      this.destroyWaveSurfer();

      this.mediaRecorder.resume();
      this.isPaused = false;
      this.isRecording = true;
      this.startTimer();
      if (this.audioContext && this.analyser) {
        this.resumeWaveformAnalysis();
      }
      this.liveAnnouncer.announce(CometChatLocalize.getLocalizedString('media_recorder_recording'));
      this.cdr.detectChanges();
      return;
    }

    // Fresh start
    const recorder = await this.initMediaRecorder();
    if (recorder) {
      this.mediaRecorder = recorder;
      this.isRecording = true;
      this.isPaused = false;
      this.counter = 0;
      this.mediaPreviewUrl = undefined;
      this.recordedBlob = undefined;
      this.startTimer();
      this.announceDuration();
      this.liveAnnouncer.announce(CometChatLocalize.getLocalizedString('media_recorder_recording'));
      this.cdr.detectChanges();
    }
  }

  handlePauseRecording(): void {
    if (!this.isRecording || this.isPaused) return;
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.pause();
      this.isPaused = true;
      this.pauseTimer();
      // Stop waveform animation loop
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = undefined;
      }
      this.liveAnnouncer.announce(CometChatLocalize.getLocalizedString('media_recorder_paused'));
      this.cdr.detectChanges();

      // Initialize WaveSurfer preview after view updates (need the container in DOM)
      this.pendingTimers.push(setTimeout(() => this.initWaveSurferPreview(), 50));
    }
  }

  handleStopRecording(): void {
    if (
      this.mediaRecorder &&
      (this.mediaRecorder.state === 'recording' || this.mediaRecorder.state === 'paused')
    ) {
      this.mediaRecorder.stop();
    }
    this.isRecording = false;
    this.isPaused = false;
    this.stopTimer();
    this.stopWaveformAnalysis();
    this.stopPreviewPlayback();
    this.destroyWaveSurfer();
    this.cdr.detectChanges();
  }

  handleCloseRecording(): void {
    this.handleStopRecording();
    this.reset();
    this.closeRecording.emit();
  }

  handleSubmitRecording(): void {
    if (this.recordedBlob) {
      this.submitRecording.emit(this.recordedBlob);
      this.reset();
    }
  }

  /**
   * Called by the composer's send button via ViewChild when recording is active.
   */
  handleInlineSend(): void {
    if (
      this.mediaRecorder &&
      (this.mediaRecorder.state === 'recording' || this.mediaRecorder.state === 'paused')
    ) {
      this.stopPreviewPlayback();
      this.destroyWaveSurfer();
      this.pendingInlineSend = true;
      this.mediaRecorder.stop();
      this.isRecording = false;
      this.isPaused = false;
      this.stopTimer();
      this.stopWaveformAnalysis();
      this.cdr.detectChanges();
    } else if (this.recordedBlob) {
      this.submitRecording.emit(this.recordedBlob);
      this.reset();
    }
  }

  // ── WaveSurfer preview playback ──

  /**
   * Initialize WaveSurfer to preview the recorded audio when paused.
   * Creates a blob URL from current audio chunks and loads it into WaveSurfer.
   */
  private initWaveSurferPreview(): void {
    if (!this.waveformContainer?.nativeElement) return;
    if (this.waveSurfer) return; // Already initialized

    // Create a temporary blob from current chunks for preview
    const previewBlob = new Blob(this.audioChunks, {
      type: this.audioChunks[0]?.type || 'audio/webm',
    });
    if (previewBlob.size === 0) return;

    const previewUrl = URL.createObjectURL(previewBlob);

    const root = document.documentElement;
    const progressColor = getComputedStyle(root)
      .getPropertyValue('--cometchat-primary-color')
      .trim();
    const waveColor = getComputedStyle(root)
      .getPropertyValue('--cometchat-icon-color-secondary')
      .trim();
    const barRadiusStr = getComputedStyle(root).getPropertyValue('--cometchat-radius-max').trim();
    const barRadius = parseInt(barRadiusStr.replace('px', ''), 10) || 1000;

    this.waveSurfer = WaveSurfer.create({
      container: this.waveformContainer.nativeElement,
      height: 24,
      normalize: false,
      waveColor,
      progressColor,
      cursorWidth: 0,
      barWidth: 3,
      barGap: 2,
      barRadius,
      barHeight: 1.2,
      fillParent: true,
      mediaControls: false,
      interact: true,
      dragToSeek: true,
      hideScrollbar: true,
      audioRate: 1,
      sampleRate: 17000,
    });

    this.waveSurfer.on('ready', (duration: number) => {
      this.ngZone.run(() => {
        this.previewDuration = duration;
        this.cdr.detectChanges();
      });
    });

    this.waveSurfer.on('timeupdate', (currentTime: number) => {
      this.ngZone.run(() => {
        this.previewCurrentTime = currentTime;
        this.cdr.detectChanges();
      });
    });

    this.waveSurfer.on('finish', () => {
      this.ngZone.run(() => {
        this.isPreviewPlaying = false;
        this.previewCurrentTime = 0;
        this.waveSurfer?.seekTo(0);
        this.cdr.detectChanges();
      });
    });

    this.waveSurfer.on('play', () => {
      this.ngZone.run(() => {
        this.isPreviewPlaying = true;
        this.cdr.detectChanges();
      });
    });

    this.waveSurfer.on('pause', () => {
      this.ngZone.run(() => {
        this.isPreviewPlaying = false;
        this.cdr.detectChanges();
      });
    });

    this.waveSurfer.load(previewUrl).catch((error: Error) => {
      console.error('Failed to load preview audio:', error);
    });
  }

  /** Toggle play/pause of the WaveSurfer preview */
  togglePreviewPlayback(): void {
    if (!this.waveSurfer) return;
    this.waveSurfer.playPause();
  }

  private stopPreviewPlayback(): void {
    if (this.waveSurfer && this.isPreviewPlaying) {
      this.waveSurfer.pause();
    }
    this.isPreviewPlaying = false;
    this.previewCurrentTime = 0;
  }

  private destroyWaveSurfer(): void {
    if (this.waveSurfer) {
      this.waveSurfer.destroy();
      this.waveSurfer = undefined;
    }
    this.isPreviewPlaying = false;
    this.previewCurrentTime = 0;
    this.previewDuration = 0;
  }

  /** Display string for the timer in paused/preview state */
  get previewTimeDisplay(): string {
    if (this.isPreviewPlaying || this.previewCurrentTime > 0) {
      return (
        this.formatTime(Math.floor(this.previewCurrentTime)) + ' / ' + this.formatTime(this.counter)
      );
    }
    return this.formatTime(this.counter);
  }

  // ── Utility methods ──

  private reset(): void {
    this.isRecording = false;
    this.isPaused = false;
    this.counter = 0;
    this.hasError = false;
    this.audioChunks = [];
    this.recordedBlob = undefined;
    this.pendingInlineSend = false;
    if (this.mediaPreviewUrl) {
      URL.revokeObjectURL(this.mediaPreviewUrl);
      this.mediaPreviewUrl = undefined;
    }
    this.clearStream();
    this.clearTimer();
    this.clearDurationAnnouncementInterval();
    this.stopWaveformAnalysis();
    this.stopPreviewPlayback();
    this.destroyWaveSurfer();
    this.hasInitialized = false;
    this.mediaRecorder = undefined;
    this.cdr.detectChanges();
  }

  private clearStream(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = undefined;
    }
  }

  private startTimer(): void {
    this.clearTimer();
    this.timerInterval = window.setInterval(() => {
      this.counter++;
      this.cdr.detectChanges();
    }, 1000);
  }

  private pauseTimer(): void {
    this.clearTimer();
  }

  private stopTimer(): void {
    this.clearTimer();
  }

  private clearTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = undefined;
    }
  }

  private announceDuration(): void {
    this.clearDurationAnnouncementInterval();
    this.durationAnnouncementInterval = window.setInterval(() => {
      this.liveAnnouncer.announce(this.durationAriaLabel);
    }, this.DURATION_ANNOUNCEMENT_INTERVAL * 1000);
  }

  private clearDurationAnnouncementInterval(): void {
    if (this.durationAnnouncementInterval) {
      clearInterval(this.durationAnnouncementInterval);
      this.durationAnnouncementInterval = undefined;
    }
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  get formattedCounter(): string {
    return this.formatTime(this.counter);
  }

  get recordingStateText(): string {
    if (this.hasError) {
      return CometChatLocalize.getLocalizedString('media_recorder_error_title');
    }
    if (this.isPaused) {
      return CometChatLocalize.getLocalizedString('media_recorder_paused');
    }
    if (this.isRecording) {
      return CometChatLocalize.getLocalizedString('media_recorder_recording');
    }
    return '';
  }

  get recordButtonAriaLabel(): string {
    if (this.isPaused) {
      return CometChatLocalize.getLocalizedString('media_recorder_resume');
    }
    return CometChatLocalize.getLocalizedString('media_recorder_start');
  }

  get recordButtonAriaPressed(): string {
    return this.isRecording ? 'true' : 'false';
  }

  get durationAriaLabel(): string {
    const mins = Math.floor(this.counter / 60);
    const secs = this.counter % 60;
    return `${mins} minutes ${secs} seconds`;
  }
}
