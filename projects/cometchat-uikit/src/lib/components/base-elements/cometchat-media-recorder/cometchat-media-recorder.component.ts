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
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../../resources/CometChatLocalize';
import { CometChatLocalize } from '../../../resources/CometChatLocalize/cometchat-localize';
import { LiveAnnouncerService } from '../../../services/live-announcer.service';
import { WaveSurfer } from '../../cometchat-audio-bubble/wavesurfer';
import {
  formatRecordingTime,
  checkMicrophonePermission,
  startWaveformLoop,
  buildWaveSurferOptions,
  setupMediaRecorderHandlers,
  wireWaveSurferEvents,
} from './cometchat-media-recorder.utils';

/**
 * CometChatMediaRecorder records audio with permission handling.
 * Uses Web Audio API AnalyserNode for real-time waveform visualization.
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
  private pendingTimers: ReturnType<typeof setTimeout>[] = [];

  @Input() autoRecording = false;
  @Output() closeRecording = new EventEmitter<void>();
  @Output() submitRecording = new EventEmitter<Blob>();
  @Output() recordingError = new EventEmitter<Error>();

  @ViewChild('waveformContainer') waveformContainer?: ElementRef<HTMLDivElement>;

  private liveAnnouncer = inject(LiveAnnouncerService);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);

  mediaRecorder?: MediaRecorder;
  isRecording = false;
  isPaused = false;
  mediaPreviewUrl?: string;
  counter = 0;
  hasError = false;
  permissionState: PermissionState = 'prompt';

  private readonly WAVEFORM_BAR_COUNT = 30;
  waveformHeights: number[] = new Array(this.WAVEFORM_BAR_COUNT).fill(4);
  isPreviewPlaying = false;
  previewCurrentTime = 0;
  previewDuration = 0;

  // ── Private state ──
  private stream?: MediaStream;
  private audioChunks: Blob[] = [];
  private timerInterval?: number;
  private recordedBlob?: Blob;
  private hasInitialized = false;
  private pendingInlineSend = false;
  private durationAnnouncementInterval?: number;
  private readonly DURATION_ANNOUNCEMENT_INTERVAL = 10;
  private audioContext?: AudioContext;
  private analyser?: AnalyserNode;
  private sourceNode?: MediaStreamAudioSourceNode;
  private animationFrameId?: number;
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
    this.handleStopRecording(); this.clearTimer(); this.clearStream();
    this.clearDurationAnnouncementInterval(); this.stopWaveformAnalysis(); this.destroyWaveSurfer();
  }

  @HostListener('keydown.escape', ['$event'])
  handleEscapeKey(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.handleCloseRecording();
  }

  handleKeydown(event: KeyboardEvent, action: string): void {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    event.stopPropagation();
    switch (action) {
      case 'start': this.handleStartRecording(); break;
      case 'pause': this.handlePauseRecording(); break;
      case 'stop': this.handleStopRecording(); break;
      case 'close': this.handleCloseRecording(); break;
      case 'submit': this.handleSubmitRecording(); break;
      case 'preview': this.togglePreviewPlayback(); break;
    }
  }

  async checkMicrophonePermission(): Promise<PermissionState> {
    return checkMicrophonePermission();
  }

  async setupPermissionMonitoring(): Promise<void> {
    try {
      const perm = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      perm.onchange = () => {
        this.permissionState = perm.state;
        if (perm.state === 'denied') {
          Object.assign(this, { hasError: true, isRecording: false, isPaused: false });
          this.clearStream(); this.stopTimer(); this.stopWaveformAnalysis();
        } else if (perm.state === 'granted') { this.hasError = false; }
        this.cdr.detectChanges();
      };
    } catch (e) { console.error('Permission monitoring setup failed:', e); }
  }

  async initMediaRecorder(): Promise<MediaRecorder | null> {
    try {
      if (this.hasInitialized) return null;
      this.clearStream();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.hasInitialized = true;
      this.stream = stream;
      this.startWaveformAnalysis(stream);

      const audioRecorder = new MediaRecorder(stream);
      this.setupMediaRecorderHandlers(audioRecorder, stream);
      audioRecorder.start(250);
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

  private setupMediaRecorderHandlers(audioRecorder: MediaRecorder, stream: MediaStream): void {
    setupMediaRecorderHandlers(audioRecorder, stream, {
      onDataAvailable: (chunk) => this.audioChunks.push(chunk),
      onStop: () => {
        if (this.audioChunks.length === 0) return;
        const blob = new Blob(this.audioChunks, { type: this.audioChunks[0]?.type || 'audio/webm' });
        this.recordedBlob = blob;
        this.audioChunks = [];
        if (this.pendingInlineSend) { this.pendingInlineSend = false; this.submitRecording.emit(blob); this.reset(); return; }
        this.mediaPreviewUrl = URL.createObjectURL(blob);
        this.cdr.detectChanges();
      },
      onError: (event: Event) => {
        const err = event as { error?: Error };
        this.hasError = true; this.isRecording = false; this.isPaused = false;
        this.clearStream(); this.hasInitialized = false; this.stopWaveformAnalysis();
        if (err.error) this.recordingError.emit(err.error);
        this.cdr.detectChanges();
      },
      onTrackEnded: () => { this.hasError = true; this.isRecording = false; this.stopWaveformAnalysis(); this.cdr.detectChanges(); },
    });
  }

  // ── Waveform analysis ──
  private startWaveformAnalysis(stream: MediaStream): void {
    try {
      this.audioContext = new AudioContext();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 64;
      this.sourceNode = this.audioContext.createMediaStreamSource(stream);
      this.sourceNode.connect(this.analyser);
      this.animationFrameId = this.runWaveformLoop();
    } catch (error) {
      console.error('Failed to initialize audio analysis:', error);
    }
  }

  private stopWaveformAnalysis(): void {
    if (this.animationFrameId) { cancelAnimationFrame(this.animationFrameId); this.animationFrameId = undefined; }
    this.sourceNode?.disconnect();
    this.sourceNode = undefined;
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => {});
      this.audioContext = undefined;
    }
    this.analyser = undefined;
    this.waveformHeights = new Array(this.WAVEFORM_BAR_COUNT).fill(4);
  }

  private resumeWaveformAnalysis(): void {
    if (!this.analyser) return;
    this.animationFrameId = this.runWaveformLoop();
  }

  private runWaveformLoop(): number {
    return startWaveformLoop(
      this.analyser!,
      this.WAVEFORM_BAR_COUNT,
      () => this.isRecording,
      () => this.isPaused,
      heights => { this.waveformHeights = heights; this.cdr.detectChanges(); }
    );
  }

  // ── Recording control methods ──
  async handleStartRecording(): Promise<void> {
    if (this.isRecording && !this.isPaused) return;
    const announce = (key: string) => this.liveAnnouncer.announce(CometChatLocalize.getLocalizedString(key));

    if (this.isPaused && this.mediaRecorder?.state === 'paused') {
      this.stopPreviewPlayback(); this.destroyWaveSurfer();
      this.mediaRecorder.resume();
      this.isPaused = false; this.isRecording = true;
      this.startTimer();
      if (this.audioContext && this.analyser) this.resumeWaveformAnalysis();
      announce('media_recorder_recording'); this.cdr.detectChanges();
      return;
    }

    const recorder = await this.initMediaRecorder();
    if (!recorder) return;
    this.mediaRecorder = recorder;
    this.isRecording = true; this.isPaused = false;
    this.counter = 0; this.mediaPreviewUrl = undefined; this.recordedBlob = undefined;
    this.startTimer(); this.announceDuration();
    announce('media_recorder_recording'); this.cdr.detectChanges();
  }

  handlePauseRecording(): void {
    if (!this.isRecording || this.isPaused || this.mediaRecorder?.state !== 'recording') return;
    this.mediaRecorder.pause(); this.isPaused = true; this.pauseTimer();
    if (this.animationFrameId) { cancelAnimationFrame(this.animationFrameId); this.animationFrameId = undefined; }
    this.liveAnnouncer.announce(CometChatLocalize.getLocalizedString('media_recorder_paused'));
    this.cdr.detectChanges();
    this.pendingTimers.push(setTimeout(() => this.initWaveSurferPreview(), 50));
  }

  handleStopRecording(): void {
    if (this.mediaRecorder?.state === 'recording' || this.mediaRecorder?.state === 'paused') this.mediaRecorder.stop();
    this.isRecording = false; this.isPaused = false;
    this.stopTimer(); this.stopWaveformAnalysis(); this.stopPreviewPlayback(); this.destroyWaveSurfer();
    this.cdr.detectChanges();
  }

  handleCloseRecording(): void { this.handleStopRecording(); this.reset(); this.closeRecording.emit(); }
  handleSubmitRecording(): void { if (this.recordedBlob) { this.submitRecording.emit(this.recordedBlob); this.reset(); } }

  handleInlineSend(): void {
    if (this.mediaRecorder?.state === 'recording' || this.mediaRecorder?.state === 'paused') {
      this.stopPreviewPlayback(); this.destroyWaveSurfer();
      this.pendingInlineSend = true; this.mediaRecorder.stop();
      this.isRecording = false; this.isPaused = false;
      this.stopTimer(); this.stopWaveformAnalysis(); this.cdr.detectChanges();
    } else if (this.recordedBlob) { this.submitRecording.emit(this.recordedBlob); this.reset(); }
  }

  // ── WaveSurfer preview playback ──
  private initWaveSurferPreview(): void {
    if (!this.waveformContainer?.nativeElement || this.waveSurfer) return;
    const previewBlob = new Blob(this.audioChunks, { type: this.audioChunks[0]?.type || 'audio/webm' });
    if (previewBlob.size === 0) return;
    const previewUrl = URL.createObjectURL(previewBlob);
    const options = buildWaveSurferOptions(this.waveformContainer.nativeElement);
    this.waveSurfer = WaveSurfer.create(options as any);
    this.wireWaveSurferEvents();
    this.waveSurfer.load(previewUrl).catch((e: Error) => console.error('Failed to load preview audio:', e));
  }

  private wireWaveSurferEvents(): void {
    if (!this.waveSurfer) return;
    wireWaveSurferEvents(this.waveSurfer, fn => this.ngZone.run(fn), {
      onReady: (d) => { this.previewDuration = d; this.cdr.detectChanges(); },
      onTimeUpdate: (t) => { this.previewCurrentTime = t; this.cdr.detectChanges(); },
      onFinish: () => { this.isPreviewPlaying = false; this.previewCurrentTime = 0; this.waveSurfer?.seekTo(0); this.cdr.detectChanges(); },
      onPlay: () => { this.isPreviewPlaying = true; this.cdr.detectChanges(); },
      onPause: () => { this.isPreviewPlaying = false; this.cdr.detectChanges(); },
    });
  }

  togglePreviewPlayback(): void {
    if (!this.waveSurfer) return;
    this.waveSurfer.playPause();
  }

  private stopPreviewPlayback(): void {
    if (this.waveSurfer && this.isPreviewPlaying) this.waveSurfer.pause();
    this.isPreviewPlaying = false;
    this.previewCurrentTime = 0;
  }

  private destroyWaveSurfer(): void {
    if (this.waveSurfer) { this.waveSurfer.destroy(); this.waveSurfer = undefined; }
    this.isPreviewPlaying = false;
    this.previewCurrentTime = 0;
    this.previewDuration = 0;
  }

  get previewTimeDisplay(): string {
    if (this.isPreviewPlaying || this.previewCurrentTime > 0) {
      return formatRecordingTime(Math.floor(this.previewCurrentTime)) + ' / ' + formatRecordingTime(this.counter);
    }
    return formatRecordingTime(this.counter);
  }

  // ── Utility methods ──
  private reset(): void {
    this.isRecording = false; this.isPaused = false; this.counter = 0; this.hasError = false;
    this.audioChunks = []; this.recordedBlob = undefined; this.pendingInlineSend = false;
    if (this.mediaPreviewUrl) { URL.revokeObjectURL(this.mediaPreviewUrl); this.mediaPreviewUrl = undefined; }
    this.clearStream(); this.clearTimer(); this.clearDurationAnnouncementInterval();
    this.stopWaveformAnalysis(); this.stopPreviewPlayback(); this.destroyWaveSurfer();
    this.hasInitialized = false; this.mediaRecorder = undefined; this.cdr.detectChanges();
  }

  private clearStream(): void {
    if (this.stream) { this.stream.getTracks().forEach(t => t.stop()); this.stream = undefined; }
  }

  private startTimer(): void {
    this.clearTimer();
    this.timerInterval = window.setInterval(() => { this.counter++; this.cdr.detectChanges(); }, 1000);
  }

  private pauseTimer(): void { this.clearTimer(); }
  private stopTimer(): void { this.clearTimer(); }

  private clearTimer(): void {
    if (this.timerInterval) { clearInterval(this.timerInterval); this.timerInterval = undefined; }
  }

  private announceDuration(): void {
    this.clearDurationAnnouncementInterval();
    this.durationAnnouncementInterval = window.setInterval(
      () => this.liveAnnouncer.announce(this.durationAriaLabel),
      this.DURATION_ANNOUNCEMENT_INTERVAL * 1000
    );
  }

  private clearDurationAnnouncementInterval(): void {
    if (this.durationAnnouncementInterval) { clearInterval(this.durationAnnouncementInterval); this.durationAnnouncementInterval = undefined; }
  }

  formatTime(seconds: number): string {
    return formatRecordingTime(seconds);
  }

  get formattedCounter(): string { return formatRecordingTime(this.counter); }

  get recordingStateText(): string {
    if (this.hasError) return CometChatLocalize.getLocalizedString('media_recorder_error_title');
    if (this.isPaused) return CometChatLocalize.getLocalizedString('media_recorder_paused');
    if (this.isRecording) return CometChatLocalize.getLocalizedString('media_recorder_recording');
    return '';
  }

  get recordButtonAriaLabel(): string {
    return this.isPaused
      ? CometChatLocalize.getLocalizedString('media_recorder_resume')
      : CometChatLocalize.getLocalizedString('media_recorder_start');
  }

  get recordButtonAriaPressed(): string { return this.isRecording ? 'true' : 'false'; }

  get durationAriaLabel(): string {
    const mins = Math.floor(this.counter / 60);
    const secs = this.counter % 60;
    return `${mins} minutes ${secs} seconds`;
  }
}
