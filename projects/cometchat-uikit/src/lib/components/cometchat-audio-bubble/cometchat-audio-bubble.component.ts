/**
 * CometChatAudioBubbleComponent
 *
 * A presentational component that renders audio attachments within chat messages.
 * Displays audio with real-time waveform visualization, playback controls,
 * download functionality, and support for multiple audio attachments.
 *
 * @remarks
 * This component processes CometChat.MediaMessage objects to extract and display
 * audio attachments with support for:
 * - Real-time waveform visualization with seek support via WaveSurfer
 * - Play/pause controls with single audio player policy
 * - Current time / duration display
 * - Download with progress indicator
 * - Multiple audio support with expand/collapse
 * - Caption rendering via TextMessageBubbleComponent
 * - Sender/receiver styling variants
 * - Full keyboard accessibility and screen reader support
 *
 * @example
 * ```html
 * <cometchat-audio-bubble
 *   [message]="audioMessage"
 *   [alignment]="MessageBubbleAlignment.left">
 * </cometchat-audio-bubble>
 * ```
 *
 * @see Requirements 1.1, 1.2, 14.1, 14.2
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
import { CometChatLocalize } from '../../resources/CometChatLocalize/cometchat-localize';
import { MessageBubbleAlignment } from '../../Enums/Enums';
import { CometChatTextBubbleComponent } from '../cometchat-text-bubble/cometchat-text-bubble.component';
import type { AudioAttachment, AudioState } from '../../modals';
import { WaveSurfer } from './wavesurfer';
import { MediaControlsService } from '../../services/media-controls.service';
import { LiveAnnouncerService } from '../../services/live-announcer.service';

/**
 * Global singleton to track the currently playing audio across all audio bubbles.
 * Ensures only one audio plays at a time.
 *
 * @see Requirements 5.5
 */
export const currentAudioPlayer: {
  instance: WaveSurfer | null;
  setIsPlaying: ((isPlaying: boolean) => void) | null;
} = {
  instance: null,
  setIsPlaying: null,
};

/**
 * Pauses the currently playing audio if any.
 *
 * @param emitEvent - Whether to emit the state change event
 */
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
  /** @internal Timer references for cleanup */
  private pendingTimers: ReturnType<typeof setTimeout>[] = [];

  // ============================================
  // Inputs
  // ============================================

  /**
   * The media message object containing audio attachments and metadata.
   *
   * @remarks
   * This is a required input. The component extracts attachments and caption text
   * from this message object.
   *
   * @see Requirements 1.1, 1.2
   */
  @Input({ required: true }) message!: CometChat.MediaMessage;

  /**
   * The alignment of the message bubble.
   *
   * @remarks
   * LEFT for incoming/receiver messages, RIGHT for outgoing/sender messages.
   *
   * @default MessageBubbleAlignment.left
   * @see Requirements 1.5, 1.6, 1.7
   */
  @Input() alignment: MessageBubbleAlignment = MessageBubbleAlignment.left;

  // ============================================
  // Outputs
  // ============================================

  /**
   * Emitted when playback state changes (play/pause).
   *
   * @see Requirements 15.1
   */
  @Output() playStateChange = new EventEmitter<{
    isPlaying: boolean;
    attachment: AudioAttachment;
  }>();

  /**
   * Emitted when download begins.
   *
   * @see Requirements 15.2
   */
  @Output() downloadStart = new EventEmitter<AudioAttachment>();

  /**
   * Emitted when download completes successfully.
   *
   * @see Requirements 15.3
   */
  @Output() downloadComplete = new EventEmitter<AudioAttachment>();

  /**
   * Emitted when download fails.
   *
   * @see Requirements 15.4
   */
  @Output() downloadError = new EventEmitter<{
    attachment: AudioAttachment;
    error: Error;
  }>();

  /**
   * Emitted when expand/collapse state changes.
   *
   * @see Requirements 15.5
   */
  @Output() expandChange = new EventEmitter<boolean>();

  // ============================================
  // ViewChild References
  // ============================================

  /**
   * Reference to the collapse button for focus management.
   *
   * @see Requirements 3.7
   */
  @ViewChild('collapseButton') collapseButton?: ElementRef<HTMLButtonElement>;

  /**
   * Reference to the expand indicator button for focus management.
   *
   * @see Requirements 3.7
   */
  @ViewChild('expandIndicator') expandIndicator?: ElementRef<HTMLButtonElement>;

  /**
   * References to waveform container elements.
   */
  @ViewChildren('waveformContainer') waveformContainers!: QueryList<ElementRef<HTMLDivElement>>;

  // ============================================
  // Internal State
  // ============================================

  /** Extracted audio attachments from the message */
  protected attachments: AudioAttachment[] = [];

  /** Whether the audio list is expanded (for multiple audios) */
  protected isExpanded = false;

  /** Whether the message has caption text */
  protected hasCaption = false;

  /** Whether this is an outgoing message (sender is logged-in user) */
  protected isOutgoing = false;

  /** Per-audio state (tracked by index) */
  protected audioStates = new Map<number, AudioState>();

  // ============================================
  // Template Exposed Properties
  // ============================================

  /** Expose MessageBubbleAlignment enum to template */
  readonly MessageBubbleAlignment = MessageBubbleAlignment;

  // ============================================
  // Constructor
  // ============================================

  /** MediaControlsService for keyboard controls */
  private mediaControlsService = inject(MediaControlsService);

  /** LiveAnnouncerService for screen reader announcements */
  private liveAnnouncer = inject(LiveAnnouncerService);

  constructor(
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  // ============================================
  // Lifecycle Hooks
  // ============================================

  ngOnInit(): void {
    this.processMessage();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Skip first change (handled by ngOnInit + ngAfterViewInit)
    const messageChange = changes['message'];
    const alignmentChange = changes['alignment'];

    if (messageChange || alignmentChange) {
      // Clean up old WaveSurfer instances before re-processing
      // @see Requirements 1.1, 14.4
      this.cleanupWaveSurferInstances();

      // Reset expanded state when message changes
      if (messageChange && !messageChange.firstChange) {
        this.isExpanded = false;
      }

      // Re-process the message to extract attachments and caption
      this.processMessage();

      // Re-initialize WaveSurfer instances after view updates
      // Only do this if not the first change (ngAfterViewInit handles that)
      if (
        (messageChange && !messageChange.firstChange) ||
        (alignmentChange && !alignmentChange.firstChange)
      ) {
        // Use setTimeout to ensure DOM is updated before initializing WaveSurfer
        // This is necessary because the waveform containers may have changed
        this.pendingTimers.push(setTimeout(() => {
          this.initializeAllWaveSurfers();
        }, 0));
      }
    }
  }

  ngAfterViewInit(): void {
    // Initialize WaveSurfer instances after view is ready
    this.initializeAllWaveSurfers();
  }

  ngOnDestroy(): void {
    this.pendingTimers.forEach(t => clearTimeout(t));
    this.pendingTimers = [];
    this.cleanupWaveSurferInstances();
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
    // Handle null/undefined message gracefully
    if (!this.message) {
      console.warn('[CometChatAudioBubble] Message is null or undefined');
      this.attachments = [];
      this.hasCaption = false;
      return;
    }

    // Extract attachments from the message
    this.extractAttachments();

    // Extract caption text from the message
    this.hasCaption = this.extractCaption();

    // Determine if message is outgoing based on alignment
    this.isOutgoing = this.alignment === MessageBubbleAlignment.right;

    // Trigger change detection
    this.cdr.markForCheck();
  }

  /**
   * Extract caption text from the message.
   *
   * @remarks
   * Tries getText() first, then falls back to getData()?.text.
   * Handles malformed metadata gracefully.
   *
   * @returns true if caption text exists, false otherwise
   * @see Requirements 8.1, 8.4
   */
  protected extractCaption(): boolean {
    if (!this.message) {
      return false;
    }

    try {
      // Try getText() first (primary method)
      const textFromGetText = (this.message as any)?.getText?.();
      if (
        textFromGetText &&
        typeof textFromGetText === 'string' &&
        textFromGetText.trim().length > 0
      ) {
        return true;
      }

      // Fallback to getData()?.text
      const data = (this.message as any)?.getData?.();
      if (data && typeof data === 'object') {
        const textFromData = data.text;
        if (textFromData && typeof textFromData === 'string' && textFromData.trim().length > 0) {
          return true;
        }
      }

      return false;
    } catch (error) {
      // Handle malformed metadata gracefully
      console.warn('[CometChatAudioBubble] Error extracting caption:', error);
      return false;
    }
  }

  /**
   * Extract attachments from the message and transform to internal model.
   *
   * @remarks
   * Transforms CometChat.Attachment objects to AudioAttachment interface.
   * Handles missing or invalid attachment data gracefully.
   *
   * @see Requirements 1.1, 1.2, 1.3, 1.4
   */
  protected extractAttachments(): void {
    // Handle null/undefined message gracefully
    if (!this.message) {
      this.attachments = [];
      return;
    }

    try {
      // Get attachments from the message
      const rawAttachments = this.message.getAttachments?.();

      // Handle null/undefined attachments array
      if (!rawAttachments || !Array.isArray(rawAttachments)) {
        this.attachments = [];
        return;
      }

      // Map CometChat.Attachment objects to AudioAttachment interface
      const audioAttachments: AudioAttachment[] = [];

      for (let i = 0; i < rawAttachments.length; i++) {
        const attachment = rawAttachments[i];

        // Skip invalid attachments
        if (!attachment || typeof attachment !== 'object') {
          continue;
        }

        // Extract properties with safe access
        const name =
          (attachment as any).name ||
          (attachment as any).getName?.() ||
          CometChatLocalize.getLocalizedString('audio_bubble_audio');
        const url = (attachment as any).url || (attachment as any).getUrl?.() || '';
        const mimeType =
          (attachment as any).mimeType || (attachment as any).getMimeType?.() || 'audio/mpeg';
        const extension =
          (attachment as any).extension || (attachment as any).getExtension?.() || 'mp3';
        const size = (attachment as any).size || (attachment as any).getSize?.() || 0;

        // Skip attachments without URL (required)
        if (!url || typeof url !== 'string' || url.length === 0) {
          continue;
        }

        // Build AudioAttachment object
        const audioAttachment: AudioAttachment = {
          name:
            typeof name === 'string'
              ? name
              : CometChatLocalize.getLocalizedString('audio_bubble_audio'),
          url,
          mimeType: typeof mimeType === 'string' ? mimeType : 'audio/mpeg',
          extension: typeof extension === 'string' ? extension : 'mp3',
          size: typeof size === 'number' ? size : 0,
        };

        audioAttachments.push(audioAttachment);
      }

      this.attachments = audioAttachments;
    } catch (error) {
      console.error('[CometChatAudioBubble] Error extracting attachments:', error);
      this.attachments = [];
    }
  }

  /**
   * Clean up WaveSurfer instances on component destruction or re-initialization.
   *
   * Order of operations:
   * 1. Clear global currentAudioPlayer if this component owns it (before any destruction)
   * 2. For each audioState: unAll() → try/catch destroy() → abort pending downloads
   * 3. Clear audioStates map
   *
   * @see Requirements 1.1, 1.2, 1.3, 1.4, 1.5
   */
  private cleanupWaveSurferInstances(): void {
    // Step 1: Clear global player reference first if this component owns it
    if (currentAudioPlayer.instance) {
      for (const [, state] of this.audioStates) {
        if (state.waveSurfer === currentAudioPlayer.instance) {
          currentAudioPlayer.instance = null;
          currentAudioPlayer.setIsPlaying = null;
          break;
        }
      }
    }

    // Step 2: Destroy each WaveSurfer instance safely
    this.audioStates.forEach(state => {
      if (state.waveSurfer) {
        // Remove all event listeners before destroying
        state.waveSurfer.unAll();

        // Destroy with error handling — waveSurfer.destroy() can throw
        // AbortError if audio is still loading
        try {
          state.waveSurfer.destroy();
        } catch (e) {
          console.warn('[CometChatAudioBubble] Error destroying WaveSurfer instance:', e);
        }
      }

      // Cancel any pending downloads
      if (state.abortController) {
        state.abortController.abort();
      }
    });

    // Step 3: Clear all state
    this.audioStates.clear();
  }

  /**
   * Get or create audio state for a specific index.
   *
   * @param index - The audio attachment index
   * @returns AudioState for the specified index
   */
  protected getAudioState(index: number): AudioState {
    if (!this.audioStates.has(index)) {
      this.audioStates.set(index, {
        waveSurfer: null,
        isPlaying: false,
        isLoading: true,
        hasError: false,
        currentTime: 0,
        duration: 0,
        isDownloading: false,
        downloadProgress: 0,
        abortController: null,
      });
    }
    return this.audioStates.get(index)!;
  }

  /**
   * Format time in seconds to M:SS format.
   *
   * @param timeInSeconds - Time value in seconds
   * @returns Formatted string like "2:05"
   * @see Requirements 6.1, 6.2
   */
  protected formatTime(timeInSeconds: number): string {
    if (!timeInSeconds || timeInSeconds < 0 || !isFinite(timeInSeconds)) {
      return '0:00';
    }
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  }

  /**
   * Get the count of remaining audios (for +N indicator).
   *
   * @returns Count of audios beyond the first one
   * @see Requirements 3.2
   */
  protected getRemainingAudiosCount(): number {
    return this.attachments.length - 1;
  }

  /**
   * Initialize all WaveSurfer instances for visible attachments.
   *
   * @see Requirements 4.1, 4.2, 4.6, 4.7
   */
  private initializeAllWaveSurfers(): void {
    if (!this.attachments.length) {
      return;
    }

    // Initialize WaveSurfer for the first audio (always visible)
    this.initializeWaveSurfer(0);

    // If expanded, initialize WaveSurfer for additional audios
    if (this.isExpanded) {
      for (let i = 1; i < this.attachments.length; i++) {
        this.initializeWaveSurfer(i);
      }
    }
  }

  /**
   * Initialize WaveSurfer for a specific audio attachment.
   *
   * @param index - The audio attachment index
   * @see Requirements 4.1, 4.2, 4.3, 4.6, 4.7, 4.8, 4.9
   */
  private initializeWaveSurfer(index: number): void {
    const attachment = this.attachments[index];
    if (!attachment || !attachment.url) {
      return;
    }

    // Get the waveform container element
    const containers = this.waveformContainers?.toArray();
    if (!containers || !containers[index]) {
      return;
    }

    const container = containers[index].nativeElement;
    const state = this.getAudioState(index);

    // Skip if already initialized
    if (state.waveSurfer) {
      return;
    }

    // Set loading state
    state.isLoading = true;
    this.cdr.markForCheck();

    // Get computed styles for colors based on sender/receiver variant
    const root = document.documentElement;
    const progressColor = this.isOutgoing
      ? getComputedStyle(root).getPropertyValue('--cometchat-static-white').trim()
      : getComputedStyle(root).getPropertyValue('--cometchat-primary-color').trim();
    const waveColor = this.isOutgoing
      ? getComputedStyle(root).getPropertyValue('--cometchat-neutral-color-500').trim()
      : getComputedStyle(root).getPropertyValue('--cometchat-extended-primary-color-300').trim();
    const barRadiusStr = getComputedStyle(root).getPropertyValue('--cometchat-radius-max').trim();
    const barRadius = parseInt(barRadiusStr.replace('px', ''), 10) || 1000;

    // Create WaveSurfer instance with configuration
    // @see Requirements 4.1, 4.2, 4.6, 4.7
    const waveSurfer = WaveSurfer.create({
      container,
      height: 16,
      normalize: false,
      waveColor,
      progressColor,
      cursorWidth: 0,
      barWidth: 2,
      barGap: 3,
      barRadius,
      barHeight: 1.2,
      minPxPerSec: 26,
      fillParent: true,
      mediaControls: false,
      interact: true,
      dragToSeek: true,
      hideScrollbar: true,
      audioRate: 1,
      autoScroll: true,
      autoCenter: true,
      sampleRate: 17000,
      width: 140,
    });

    // Store the WaveSurfer instance
    state.waveSurfer = waveSurfer;

    // Set up event listeners
    this.setupWaveSurferEvents(waveSurfer, index);

    // Load the audio
    waveSurfer.load(attachment.url).catch((error: Error) => {
      this.handleLoadError(error, index);
    });
  }

  /**
   * Set up event listeners for a WaveSurfer instance.
   *
   * @param waveSurfer - The WaveSurfer instance
   * @param index - The audio attachment index
   * @see Requirements 4.1, 4.2, 4.6, 4.7
   */
  private setupWaveSurferEvents(waveSurfer: WaveSurfer, index: number): void {
    const state = this.getAudioState(index);

    // Ready event - audio is loaded and ready to play
    waveSurfer.on('ready', (duration: number) => {
      this.ngZone.run(() => {
        state.isLoading = false;
        state.duration = duration;
        this.cdr.markForCheck();
      });
    });

    // Audioprocess event - fires continuously during playback
    waveSurfer.on('audioprocess', (currentTime: number) => {
      this.ngZone.run(() => {
        state.currentTime = currentTime;
        this.cdr.markForCheck();
      });
    });

    // Timeupdate event - fires on time changes (including seeks)
    waveSurfer.on('timeupdate', (currentTime: number) => {
      this.ngZone.run(() => {
        state.currentTime = currentTime;
        this.cdr.markForCheck();
      });
    });

    // Dragend event - user finished dragging to seek
    waveSurfer.on('dragend', () => {
      this.ngZone.run(() => {
        state.currentTime = waveSurfer.getCurrentTime();
        this.cdr.markForCheck();
      });
    });

    // Finish event - audio finished playing
    // @see Requirements 5.4, 7.10
    waveSurfer.on('finish', () => {
      this.ngZone.run(() => {
        // Reset to beginning on audio finish
        waveSurfer.stop();
        waveSurfer.seekTo(0);
        state.isPlaying = false;
        state.currentTime = 0;

        // Clear global player reference if this was the active player
        if (currentAudioPlayer.instance === waveSurfer) {
          currentAudioPlayer.instance = null;
          currentAudioPlayer.setIsPlaying = null;
        }

        // Announce playback completion for screen readers
        // @see Requirements 7.10
        this.announcePlaybackComplete();

        // Emit play state change event for finish
        const attachment = this.attachments[index];
        if (attachment) {
          this.playStateChange.emit({
            isPlaying: false,
            attachment,
          });
        }

        this.cdr.markForCheck();
      });
    });

    // Play event
    waveSurfer.on('play', () => {
      this.ngZone.run(() => {
        state.isPlaying = true;
        this.cdr.markForCheck();
      });
    });

    // Pause event
    waveSurfer.on('pause', () => {
      this.ngZone.run(() => {
        state.isPlaying = false;
        this.cdr.markForCheck();
      });
    });

    // Error event
    waveSurfer.on('error', (error: Error) => {
      this.handleLoadError(error, index);
    });
  }

  /**
   * Handle WaveSurfer load errors gracefully.
   *
   * @param error - The error that occurred
   * @param index - The audio attachment index
   * @see Requirements 13.4, 14.5
   */
  private handleLoadError(error: Error, index: number): void {
    console.error(`[CometChatAudioBubble] Failed to load audio at index ${index}:`, error);

    this.ngZone.run(() => {
      const state = this.getAudioState(index);
      state.isLoading = false;
      state.hasError = true;
      state.waveSurfer = null;

      // Component remains functional, just without waveform
      this.cdr.markForCheck();
    });
  }

  /**
   * Toggle the expanded/collapsed state for multiple audios.
   *
   * @see Requirements 3.3, 3.5, 3.7, 15.5
   */
  protected toggleExpanded(): void {
    const wasExpanded = this.isExpanded;
    this.isExpanded = !this.isExpanded;

    // Emit expand change event
    this.expandChange.emit(this.isExpanded);

    this.cdr.markForCheck();

    if (this.isExpanded) {
      // Expanding: Initialize WaveSurfer instances for newly visible audios
      // Use setTimeout to ensure DOM is updated before initializing
      this.pendingTimers.push(setTimeout(() => {
        for (let i = 1; i < this.attachments.length; i++) {
          this.initializeWaveSurfer(i);
        }
        // Set focus on collapse control after expansion
        this.collapseButton?.nativeElement?.focus();
      }, 0));
    } else if (wasExpanded) {
      // Collapsing: Set focus back to expand indicator
      // @see Requirements 3.7
      this.pendingTimers.push(setTimeout(() => {
        this.expandIndicator?.nativeElement?.focus();
      }, 0));
    }
  }

  /**
   * Get the ARIA label for the expand indicator.
   *
   * @returns ARIA label string
   * @see Requirements 10.9
   */
  protected getExpandAriaLabel(): string {
    const count = this.getRemainingAudiosCount();
    // Use localized format: "Show {count} more"
    const template = CometChatLocalize.getLocalizedString('audio_bubble_show_more');
    return template.replace('{count}', count.toString());
  }

  /**
   * Get the progress dash array for download progress indicator.
   *
   * @param index - The audio attachment index
   * @returns SVG strokeDasharray value
   * @see Requirements 7.2, 7.3
   */
  protected getProgressDashArray(index: number): string {
    const state = this.getAudioState(index);
    return `${state.downloadProgress * 0.628} 62.8`;
  }

  // ============================================
  // Playback Control Methods
  // ============================================

  /**
   * Handle play/pause toggle.
   *
   * @remarks
   * Toggles playback state on button click, updates isPlaying state,
   * and emits playStateChange event. Implements single audio player policy
   * by pausing any currently playing audio before starting new playback.
   *
   * @param index - The audio attachment index
   * @see Requirements 5.1, 5.2, 5.3, 5.5, 15.1
   */
  protected onPlayPause(index: number): void {
    const state = this.getAudioState(index);
    const waveSurfer = state.waveSurfer;

    // Skip if WaveSurfer is not initialized or still loading
    if (!waveSurfer || state.isLoading) {
      return;
    }

    const attachment = this.attachments[index];
    if (!attachment) {
      return;
    }

    if (state.isPlaying) {
      // Pause the audio
      waveSurfer.pause();
      state.isPlaying = false;

      // Clear global player reference if this was the active player
      if (currentAudioPlayer.instance === waveSurfer) {
        currentAudioPlayer.instance = null;
        currentAudioPlayer.setIsPlaying = null;
      }

      // Emit play state change event
      this.playStateChange.emit({
        isPlaying: false,
        attachment,
      });
    } else {
      // Implement single audio player policy - pause any currently playing audio
      // @see Requirements 5.5
      if (currentAudioPlayer.instance && currentAudioPlayer.instance !== waveSurfer) {
        closeCurrentMediaPlayer(true);
      }

      // Start playback
      waveSurfer
        .play()
        .then(() => {
          // Update state after successful play
          state.isPlaying = true;

          // Set this as the current audio player
          currentAudioPlayer.instance = waveSurfer;
          currentAudioPlayer.setIsPlaying = (isPlaying: boolean) => {
            state.isPlaying = isPlaying;
            this.cdr.markForCheck();
          };

          // Emit play state change event
          this.playStateChange.emit({
            isPlaying: true,
            attachment,
          });

          this.cdr.markForCheck();
        })
        .catch((error: Error) => {
          console.error('[CometChatAudioBubble] Failed to play audio:', error);
          state.isPlaying = false;
          this.cdr.markForCheck();
        });
    }

    this.cdr.markForCheck();
  }

  // ============================================
  // Download Methods
  // ============================================

  /**
   * Handle download button click.
   *
   * @remarks
   * Fetches audio with ReadableStream, tracks download progress,
   * creates blob and triggers download with original filename.
   *
   * @param index - The audio attachment index
   * @see Requirements 7.1, 7.6, 15.2, 15.3
   */
  protected onDownload(index: number): void {
    const attachment = this.attachments[index];
    if (!attachment || !attachment.url) {
      return;
    }

    const state = this.getAudioState(index);

    // Skip if already downloading
    if (state.isDownloading) {
      return;
    }

    // Set up download state
    state.isDownloading = true;
    state.downloadProgress = 0;
    state.abortController = new AbortController();

    // Emit download start event
    this.downloadStart.emit(attachment);

    this.cdr.markForCheck();

    // Start the download
    this.downloadAudio(
      attachment.url,
      (progress: number) => {
        state.downloadProgress = progress;
        this.cdr.markForCheck();
      },
      state.abortController.signal
    )
      .then((blob: Blob) => {
        // Download completed successfully
        this.triggerFileDownload(blob, attachment.name);

        // Reset download state
        state.isDownloading = false;
        state.downloadProgress = 0;
        state.abortController = null;

        // Emit download complete event
        this.downloadComplete.emit(attachment);

        this.cdr.markForCheck();
      })
      .catch((error: Error) => {
        // Handle download error (including cancellation)
        this.handleDownloadError(error, index);
      });
  }

  /**
   * Handle download cancellation.
   *
   * @remarks
   * Uses AbortController to cancel the fetch request and resets progress.
   *
   * @param index - The audio attachment index
   * @see Requirements 7.5
   */
  protected onCancelDownload(index: number): void {
    const state = this.getAudioState(index);

    // Abort the download if in progress
    if (state.abortController) {
      state.abortController.abort();
    }

    // Reset download state
    state.isDownloading = false;
    state.downloadProgress = 0;
    state.abortController = null;

    this.cdr.markForCheck();
  }

  /**
   * Download an audio file with progress tracking.
   *
   * @remarks
   * Uses ReadableStream to track download progress.
   * Supports cancellation via AbortSignal.
   *
   * @param url - The URL of the audio file
   * @param onProgress - Callback for progress updates (0-100)
   * @param signal - Optional AbortSignal for cancellation
   * @returns Promise resolving to the downloaded Blob
   * @see Requirements 7.1, 7.2, 7.3
   */
  private async downloadAudio(
    url: string,
    onProgress: (percent: number) => void,
    signal?: AbortSignal
  ): Promise<Blob> {
    const response = await fetch(url, { signal });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Check if ReadableStream is supported
    if (!response.body) {
      // Fallback: download without progress tracking
      const blob = await response.blob();
      onProgress(100);
      return blob;
    }

    const reader = response.body.getReader();
    const contentLength = parseInt(response.headers.get('Content-Length') || '0', 10);
    let receivedLength = 0;
    const chunks: BlobPart[] = [];

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      chunks.push(value);
      receivedLength += value.length;

      // Calculate and report progress
      if (contentLength > 0) {
        const progress = Math.floor((receivedLength / contentLength) * 100);
        onProgress(progress);
      } else {
        // If content length is unknown, show indeterminate progress
        // Use a logarithmic scale to show some progress
        const estimatedProgress = Math.min(90, Math.floor(Math.log10(receivedLength + 1) * 20));
        onProgress(estimatedProgress);
      }
    }

    // Final progress update
    onProgress(100);

    // Determine MIME type from response or default to audio/mpeg
    const contentType = response.headers.get('Content-Type') || 'audio/mpeg';

    // Combine chunks into a single Blob
    return new Blob(chunks, { type: contentType });
  }

  /**
   * Trigger a file download in the browser.
   *
   * @param blob - The file data as a Blob
   * @param filename - The filename for the download
   * @see Requirements 7.6
   */
  private triggerFileDownload(blob: Blob, filename: string): void {
    // Create a temporary URL for the blob
    const url = URL.createObjectURL(blob);

    // Create a temporary anchor element
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename || 'audio.mp3';
    anchor.style.display = 'none';

    // Append to body, click, and remove
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);

    // Revoke the URL to free memory
    URL.revokeObjectURL(url);
  }

  /**
   * Handle download errors and emit error event.
   *
   * @param error - The error that occurred
   * @param index - The audio attachment index
   * @see Requirements 7.7, 15.4
   */
  private handleDownloadError(error: Error, index: number): void {
    const state = this.getAudioState(index);
    const attachment = this.attachments[index];

    // Check if this was a cancellation (not a real error)
    if (error.name === 'AbortError') {
      // Cancellation is handled in onCancelDownload, just reset state
      state.isDownloading = false;
      state.downloadProgress = 0;
      state.abortController = null;
      this.cdr.markForCheck();
      return;
    }

    // Log the error
    console.error(`[CometChatAudioBubble] Download failed for index ${index}:`, error);

    // Reset download state
    state.isDownloading = false;
    state.downloadProgress = 0;
    state.abortController = null;

    // Emit error event if we have a valid attachment
    if (attachment) {
      this.downloadError.emit({
        attachment,
        error,
      });
    }

    this.cdr.markForCheck();
  }

  // ============================================
  // Keyboard Navigation Methods
  // @see Requirements 10.1, 10.2, 10.4, 10.5, 10.7, 10.8, 10.9
  // ============================================

  /**
   * Handle keyboard events on the waveform for seeking.
   *
   * @remarks
   * Uses MediaControlsService for standardized keyboard controls:
   * - Space/Enter: Toggle play/pause
   * - Left/Right arrows: Seek by 5 seconds
   * - Home: Seek to beginning
   * - End: Seek to end
   *
   * @param event - The keyboard event
   * @param index - The audio attachment index
   * @see Requirements 7.2, 7.3, 7.4, 7.5, 7.6, 10.7, 10.8
   */
  protected onWaveformKeydown(event: KeyboardEvent, index: number): void {
    const state = this.getAudioState(index);
    const waveSurfer = state.waveSurfer;

    // Skip if WaveSurfer is not initialized or still loading
    if (!waveSurfer || state.isLoading || state.hasError) {
      return;
    }

    const duration = state.duration;
    if (duration <= 0) {
      return;
    }

    // Use MediaControlsService for standardized keyboard handling
    const result = this.mediaControlsService.handleKeyDown(event, {
      currentTime: state.currentTime,
      duration: duration,
      isPlaying: state.isPlaying,
      seekIncrement: 5,
    });

    switch (result.action) {
      case 'play':
      case 'pause':
        this.onPlayPause(index);
        break;

      case 'seek':
        if (result.seekTime !== undefined) {
          const seekPosition = result.seekTime / duration;
          waveSurfer.seekTo(seekPosition);
          state.currentTime = result.seekTime;
          this.announceSeekPosition(result.seekTime);
          this.cdr.markForCheck();
        }
        break;

      case 'seekStart':
        waveSurfer.seekTo(0);
        state.currentTime = 0;
        this.announceSeekStart();
        this.cdr.markForCheck();
        break;

      case 'seekEnd':
        waveSurfer.seekTo(1);
        state.currentTime = duration;
        this.announceSeekEnd();
        this.cdr.markForCheck();
        break;
    }
  }

  /**
   * Handle keyboard events on play/pause button.
   *
   * @remarks
   * Supports Enter and Space keys for activation.
   * Native button elements handle this automatically, but this method
   * provides explicit handling for consistency.
   *
   * @param event - The keyboard event
   * @param index - The audio attachment index
   * @see Requirements 10.2
   */
  protected onPlayPauseKeydown(event: KeyboardEvent, index: number): void {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      this.onPlayPause(index);
    }
  }

  /**
   * Handle keyboard events on download button.
   *
   * @remarks
   * Supports Enter and Space keys for activation.
   *
   * @param event - The keyboard event
   * @param index - The audio attachment index
   * @see Requirements 10.5
   */
  protected onDownloadKeydown(event: KeyboardEvent, index: number): void {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      this.onDownload(index);
    }
  }

  /**
   * Handle keyboard events on cancel download button.
   *
   * @remarks
   * Supports Enter and Space keys for activation.
   *
   * @param event - The keyboard event
   * @param index - The audio attachment index
   */
  protected onCancelDownloadKeydown(event: KeyboardEvent, index: number): void {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      this.onCancelDownload(index);
    }
  }

  /**
   * Handle keyboard events on expand/collapse buttons.
   *
   * @remarks
   * Supports Enter and Space keys for activation.
   *
   * @param event - The keyboard event
   * @see Requirements 10.9
   */
  protected onExpandCollapseKeydown(event: KeyboardEvent): void {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      this.toggleExpanded();
    }
  }

  // ============================================
  // Accessibility Methods
  // @see Requirements 7.1-7.10
  // ============================================

  /**
   * Gets the aria-label for the audio bubble region.
   * Includes duration information for screen readers.
   *
   * @param index - The audio attachment index
   * @returns ARIA label string with duration
   * @see Requirements 7.8
   */
  protected getAudioRegionAriaLabel(index: number): string {
    const state = this.getAudioState(index);
    const durationText = this.mediaControlsService.formatTimeForAnnouncement(state.duration);
    return CometChatLocalize.getLocalizedString('audio_bubble_region').replace(
      '{duration}',
      durationText
    );
  }

  /**
   * Gets the aria-label for the play/pause button.
   *
   * @param index - The audio attachment index
   * @returns "Play audio" or "Pause audio" based on state
   * @see Requirements 7.7
   */
  protected getPlayPauseAriaLabel(index: number): string {
    const state = this.getAudioState(index);
    return state.isPlaying
      ? CometChatLocalize.getLocalizedString('audio_bubble_pause')
      : CometChatLocalize.getLocalizedString('audio_bubble_play');
  }

  /**
   * Gets the aria-valuetext for the progress slider.
   * Returns a human-readable string like "2 minutes 30 seconds of 5 minutes".
   *
   * @param index - The audio attachment index
   * @returns Human-readable progress text
   * @see Requirements 7.8
   */
  protected getProgressValueText(index: number): string {
    const state = this.getAudioState(index);
    return this.mediaControlsService.getProgressValueText(state.currentTime, state.duration);
  }

  /**
   * Announces the current seek position to screen readers.
   *
   * @param time - The time in seconds
   */
  private announceSeekPosition(time: number): void {
    const formattedTime = this.mediaControlsService.formatTimeForAnnouncement(time);
    this.liveAnnouncer.announce(formattedTime, 'polite');
  }

  /**
   * Announces audio playback completion to screen readers.
   *
   * @see Requirements 7.10
   */
  private announcePlaybackComplete(): void {
    this.liveAnnouncer.announce(
      CometChatLocalize.getLocalizedString('accessibility_audio_playback_complete'),
      'polite'
    );
  }

  /**
   * Announces seek to start position.
   */
  private announceSeekStart(): void {
    this.liveAnnouncer.announce(
      CometChatLocalize.getLocalizedString('audio_bubble_seek_start'),
      'polite'
    );
  }

  /**
   * Announces seek to end position.
   */
  private announceSeekEnd(): void {
    this.liveAnnouncer.announce(
      CometChatLocalize.getLocalizedString('audio_bubble_seek_end'),
      'polite'
    );
  }
}
