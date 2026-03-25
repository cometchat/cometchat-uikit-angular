import { Injectable } from '@angular/core';

/**
 * Configuration for media playback controls
 */
export interface MediaControlsConfig {
  /** Current playback position in seconds */
  currentTime: number;
  /** Total duration in seconds */
  duration: number;
  /** Whether media is currently playing */
  isPlaying: boolean;
  /** Seek increment in seconds (default: 5) */
  seekIncrement?: number;
}

/**
 * Result of handling a media control keyboard event
 */
export interface MediaControlsResult {
  /** The action to perform */
  action: 'play' | 'pause' | 'seek' | 'seekStart' | 'seekEnd' | 'none';
  /** The time to seek to (only present for seek actions) */
  seekTime?: number;
}

/**
 * MediaControlsService provides keyboard controls for audio/video playback.
 *
 * Implements standard media keyboard shortcuts:
 * - Space/Enter: Toggle play/pause
 * - ArrowRight: Seek forward (default 5 seconds)
 * - ArrowLeft: Seek backward (default 5 seconds)
 * - Home: Seek to start
 * - End: Seek to end
 *
 * Also provides helper methods for screen reader accessibility:
 * - formatTimeForAnnouncement: Formats time for screen reader announcement
 * - getPlayPauseLabel: Gets aria-label for play/pause button
 * - getProgressValueText: Gets aria-valuetext for progress slider
 *
 * @example
 * ```typescript
 * // In an audio bubble component
 * private mediaControlsService = inject(MediaControlsService);
 *
 * onAudioKeyDown(event: KeyboardEvent): void {
 *   const result = this.mediaControlsService.handleKeyDown(event, {
 *     currentTime: this.currentTime(),
 *     duration: this.duration(),
 *     isPlaying: this.isPlaying(),
 *     seekIncrement: 5
 *   });
 *
 *   switch (result.action) {
 *     case 'play':
 *       this.play();
 *       break;
 *     case 'pause':
 *       this.pause();
 *       break;
 *     case 'seek':
 *     case 'seekStart':
 *     case 'seekEnd':
 *       this.seekTo(result.seekTime!);
 *       break;
 *   }
 * }
 * ```
 */
@Injectable({ providedIn: 'root' })
export class MediaControlsService {
  private readonly DEFAULT_SEEK_INCREMENT = 5;

  /**
   * Handles keyboard events for media playback controls.
   * Returns the action to perform based on the key pressed.
   *
   * @param event - The keyboard event to handle
   * @param config - Configuration with current playback state
   * @returns MediaControlsResult - The action to perform
   */
  handleKeyDown(event: KeyboardEvent, config: MediaControlsConfig): MediaControlsResult {
    if (!event || !config) return { action: 'none' };
    const {
      currentTime,
      duration,
      isPlaying,
      seekIncrement = this.DEFAULT_SEEK_INCREMENT,
    } = config;

    switch (event.key) {
      case ' ':
      case 'Enter':
        event.preventDefault();
        return { action: isPlaying ? 'pause' : 'play' };

      case 'ArrowRight':
        event.preventDefault();
        const forwardTime = Math.min(currentTime + seekIncrement, duration);
        return { action: 'seek', seekTime: forwardTime };

      case 'ArrowLeft':
        event.preventDefault();
        const backwardTime = Math.max(currentTime - seekIncrement, 0);
        return { action: 'seek', seekTime: backwardTime };

      case 'Home':
        event.preventDefault();
        return { action: 'seekStart', seekTime: 0 };

      case 'End':
        event.preventDefault();
        return { action: 'seekEnd', seekTime: duration };

      default:
        return { action: 'none' };
    }
  }

  /**
   * Formats time in seconds for screen reader announcement.
   * Returns a human-readable string like "2 minutes 30 seconds" or "45 seconds".
   *
   * @param seconds - The time in seconds to format
   * @returns string - Human-readable time string
   */
  formatTimeForAnnouncement(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);

    if (mins === 0) {
      return secs === 1 ? '1 second' : `${secs} seconds`;
    }

    const minuteText = mins === 1 ? '1 minute' : `${mins} minutes`;
    const secondText = secs === 1 ? '1 second' : `${secs} seconds`;

    if (secs === 0) {
      return minuteText;
    }

    return `${minuteText} ${secondText}`;
  }

  /**
   * Gets the aria-label for a play/pause button based on current state.
   *
   * @param isPlaying - Whether media is currently playing
   * @returns string - "Pause" if playing, "Play" if paused
   */
  getPlayPauseLabel(isPlaying: boolean): string {
    return isPlaying ? 'Pause' : 'Play';
  }

  /**
   * Gets the aria-valuetext for a progress slider.
   * Returns a string like "2 minutes 30 seconds of 5 minutes".
   *
   * @param currentTime - Current playback position in seconds
   * @param duration - Total duration in seconds
   * @returns string - Human-readable progress text
   */
  getProgressValueText(currentTime: number, duration: number): string {
    const current = this.formatTimeForAnnouncement(currentTime);
    const total = this.formatTimeForAnnouncement(duration);
    return `${current} of ${total}`;
  }
}
