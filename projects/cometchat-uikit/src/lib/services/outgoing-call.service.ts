import { Injectable, signal } from '@angular/core';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatSoundManager } from '../resources/CometChatSoundManager/CometChatSoundManager';

/**
 * OutgoingCallService
 *
 * Injectable service managing outgoing call state, sound playback,
 * and configuration for the outgoing call UI.
 *
 * ## Overview
 *
 * This service provides a single source of truth for outgoing call state.
 * It manages sound playback for outgoing calls and exposes reactive signals
 * for call state and configuration that any component can consume.
 *
 * ## Architecture
 *
 * - **Signals**: Provide synchronous, fine-grained reactivity for call state
 * - **CometChatSoundManager**: Static class for sound playback
 *
 * ## Usage
 *
 * ```typescript
 * export class MyComponent {
 *   private outgoingCallService = inject(OutgoingCallService);
 *
 *   currentCall = this.outgoingCallService.activeCall;
 *
 *   startCall(call: CometChat.Call) {
 *     this.outgoingCallService.setActiveCall(call);
 *     this.outgoingCallService.playOutgoingSound();
 *   }
 *
 *   cancelCall() {
 *     this.outgoingCallService.stopOutgoingSound();
 *     this.outgoingCallService.setActiveCall(null);
 *   }
 * }
 * ```
 *
 * @Injectable providedIn: 'root'

 */
@Injectable({ providedIn: 'root' })
export class OutgoingCallService {
  // ==================== State Signals ====================

  /**
   * The current outgoing call.
   * Set when an outgoing call is initiated.
   * Cleared when the call is accepted, rejected, cancelled, or ended.
   *
   * @see Requirement 5.2 - Expose active call as a signal
   */
  private _activeCall = signal<CometChat.Call | null>(null);
  readonly activeCall = this._activeCall.asReadonly();

  // ==================== Configuration Signals ====================

  /**
   * When true, outgoing call ringtone is not played.
   *
   * @see Requirement 2.3 - Skip playback when sound is disabled
   */
  private _disableSoundForCalls = signal<boolean>(false);
  readonly disableSoundForCalls = this._disableSoundForCalls.asReadonly();

  /**
   * Custom sound URL for the outgoing call ringtone.
   * When empty, the default ringtone is used.
   *
   * @see Requirement 2.2 - Use custom sound URL when configured
   */
  private _customSoundForCalls = signal<string>('');
  readonly customSoundForCalls = this._customSoundForCalls.asReadonly();

  // ==================== Public Setters ====================

  /**
   * Sets the current outgoing call.
   * @param call - The outgoing call object, or null to clear
   *
   * @see Requirement 5.2 - Signal reflects active call
   */
  setActiveCall(call: CometChat.Call | null): void {
    this._activeCall.set(call);
  }

  /**
   * Enables or disables the outgoing call ringtone.
   * @param disable - True to disable sound, false to enable
   *
   * @see Requirement 2.3 - Disable sound flag
   */
  setDisableSoundForCalls(disable: boolean): void {
    this._disableSoundForCalls.set(disable);
  }

  /**
   * Sets a custom sound URL for the outgoing call ringtone.
   * @param url - The custom sound URL, or empty string for default
   *
   * @see Requirement 2.2 - Custom sound URL
   */
  setCustomSoundForCalls(url: string): void {
    this._customSoundForCalls.set(url);
  }

  // ==================== Sound Management ====================

  /**
   * Plays the outgoing call ringtone (looping).
   * Respects the disableSoundForCalls and customSoundForCalls configuration.
   *
   * @see Requirement 2.1 - Play ringtone when call is set and sound is enabled
   * @see Requirement 2.2 - Use custom sound URL when configured
   * @see Requirement 2.3 - Skip playback when sound is disabled
   */
  playOutgoingSound(): void {
    if (this._disableSoundForCalls()) {
      return;
    }
    const customUrl = this._customSoundForCalls();
    CometChatSoundManager.play('outgoingCall', customUrl || null);
  }

  /**
   * Stops the currently playing outgoing call ringtone.
   *
   * @see Requirement 2.4 - Pause ringtone on destroy or call cleared
   */
  stopOutgoingSound(): void {
    CometChatSoundManager.pause();
  }
}
