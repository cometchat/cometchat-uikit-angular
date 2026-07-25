import { Injectable } from '@angular/core';

/**
 * VoiceRecordingCoordinatorService
 *
 * Ensures at most ONE composer records a voice note at a time. Several composers can be on screen
 * together — the main message list and an open thread each render their own composer, their own
 * recorder and their own microphone stream — so without coordination both can record at once.
 *
 * The composer that starts recording claims the slot; whoever held it is asked to stop, which
 * unmounts their recorder and releases their mic.
 *
 * Why not reuse the existing `ccActivePopover` event: it carries only the popover *type*. A composer
 * receiving `'voiceRecording'` cannot tell whether it came from itself or from another composer, and
 * the guard that stops it closing itself (`contentToDisplay() !== id`) also stops it closing when a
 * second composer starts recording. Coordination needs instance identity, which this service adds
 * without changing that public event's payload.
 *
 * Mirrors TrayAudioCoordinatorService (at most one tray audio tile plays at a time).
 * Internal: not exported from `public-api.ts`.
 */
@Injectable({ providedIn: 'root' })
export class VoiceRecordingCoordinatorService {
  /** The composer currently holding the recording slot, or null when nobody is recording. */
  private active: object | null = null;
  /** How to stop {@link active}. Always cleared together with it. */
  private stopActive: (() => void) | null = null;

  /**
   * Claim the recording slot for `owner`, stopping the previous holder first.
   * Re-claiming while already the holder only refreshes the stop callback.
   */
  claim(owner: object, stop: () => void): void {
    if (this.active && this.active !== owner) {
      const stopPrevious = this.stopActive;
      // Clear BEFORE stopping: stopping the previous owner flips its recording state, which calls
      // release() straight back into this service. It must not observe a half-updated slot.
      this.active = null;
      this.stopActive = null;
      stopPrevious?.();
    }
    this.active = owner;
    this.stopActive = stop;
  }

  /** Release the slot, but only if `owner` still holds it — a stale release is a no-op. */
  release(owner: object): void {
    if (this.active === owner) {
      this.active = null;
      this.stopActive = null;
    }
  }
}
