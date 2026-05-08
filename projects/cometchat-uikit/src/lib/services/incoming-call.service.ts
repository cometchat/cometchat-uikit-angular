import { Injectable, OnDestroy, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatSoundManager } from '../resources/CometChatSoundManager/CometChatSoundManager';
import { CometChatCallEvents } from '../events/CometChatCallEvents';
import { CometChatUIEvents } from '../events/CometChatUIEvents';
import { CometChatLogger } from '../utils/CometChatLogger';

/**
 * IncomingCallService
 *
 * Injectable service managing incoming call state, sound playback,
 * CometChat call listener registration, and active call tracking.
 *
 * ## Overview
 *
 * This service provides a single source of truth for incoming call state.
 * It registers a CometChat CallListener to receive real-time call events,
 * manages sound playback for incoming calls, and tracks active calls to
 * auto-reject with "busy" when the user is already on a call.
 *
 * ## Architecture
 *
 * - **Signals**: Provide synchronous, fine-grained reactivity for call state
 * - **CallListener**: Receives real-time call events from CometChat SDK
 * - **CometChatCallEvents**: RxJS subjects for call lifecycle events
 * - **CometChatSoundManager**: Static class for sound playback
 *
 * ## Usage
 *
 * ```typescript
 * export class MyComponent {
 *   private incomingCallService = inject(IncomingCallService);
 *
 *   currentCall = this.incomingCallService.incomingCall;
 *
 *   async accept() {
 *     const call = this.currentCall();
 *     if (call) {
 *       await this.incomingCallService.acceptCall(call.getSessionId());
 *     }
 *   }
 * }
 * ```
 *
 * @Injectable providedIn: 'root'

 */
@Injectable({ providedIn: 'root' })
export class IncomingCallService implements OnDestroy {
  // ==================== State Signals ====================

  /**
   * The current incoming call.
   * Set when an incoming call is received via CallListener or programmatically.
   * Cleared when the call is accepted, declined, cancelled, or ended.
   */
  private _incomingCall = signal<CometChat.Call | null>(null);
  readonly incomingCall = this._incomingCall.asReadonly();

  /**
   * The currently active call (ongoing or outgoing).
   * Used to determine if the user is already on a call.
   * When set, new incoming calls are auto-rejected with "busy" status.
   */
  private _activeCall = signal<CometChat.Call | null>(null);
  readonly activeCall = this._activeCall.asReadonly();

  // ==================== Configuration Signals ====================

  /**
   * When true, incoming call ringtone is not played.
   */
  private _disableSoundForCalls = signal<boolean>(false);
  readonly disableSoundForCalls = this._disableSoundForCalls.asReadonly();

  /**
   * Custom sound URL for the incoming call ringtone.
   * When empty, the default ringtone is used.
   */
  private _customSoundForCalls = signal<string>('');
  readonly customSoundForCalls = this._customSoundForCalls.asReadonly();

  // ==================== Private State ====================

  private readonly listenerId = 'incoming_call_listener_' + Date.now();
  private subscriptions: Subscription[] = [];

  // ==================== Constructor ====================

  constructor() {
    this.registerCallListener();
    this.subscribeToCallEvents();
  }

  // ==================== Public Setters ====================

  /**
   * Sets the current incoming call.
   * @param call - The incoming call object, or null to clear
   */
  setIncomingCall(call: CometChat.Call | null): void {
    this._incomingCall.set(call);
  }

  /**
   * Sets the active call (ongoing or outgoing).
   * @param call - The active call object, or null to clear
   */
  setActiveCall(call: CometChat.Call | null): void {
    this._activeCall.set(call);
  }

  /**
   * Enables or disables the incoming call ringtone.
   * @param disable - True to disable sound, false to enable
   */
  setDisableSoundForCalls(disable: boolean): void {
    this._disableSoundForCalls.set(disable);
  }

  /**
   * Sets a custom sound URL for the incoming call ringtone.
   * @param url - The custom sound URL, or empty string for default
   */
  setCustomSoundForCalls(url: string): void {
    this._customSoundForCalls.set(url);
  }

  // ==================== Sound Management ====================

  /**
   * Plays the incoming call ringtone (looping).
   * Respects the disableSoundForCalls and customSoundForCalls configuration.
   *
   * @see Requirement 2.1 - Play ringtone when call is set and sound is enabled
   * @see Requirement 2.2 - Use custom sound URL when configured
   * @see Requirement 2.3 - Skip playback when sound is disabled
   */
  playIncomingSound(): void {
    if (this._disableSoundForCalls()) {
      return;
    }
    const customUrl = this._customSoundForCalls();
    CometChatSoundManager.play('incomingCall', customUrl || null);
  }

  /**
   * Stops the currently playing incoming call ringtone.
   *
   * @see Requirement 2.4 - Pause ringtone on accept, decline, cancel, or destroy
   */
  stopIncomingSound(): void {
    CometChatSoundManager.pause();
  }

  // ==================== Call Actions ====================

  /**
   * Accepts an incoming call.
   *
   * Calls CometChat.acceptCall() with the session ID, emits ccCallAccepted
   * via CometChatCallEvents, emits ccShowOngoingCall via CometChatUIEvents,
   * sets the active call, and clears the incoming call.
   *
   * @param sessionId - The call session ID
   * @returns The accepted call object
   * @throws CometChat.CometChatException on SDK error
   *
   * @see Requirement 3.3 - Default accept behavior
   * @see Requirement 5.2 - Set active call after accept
   */
  async acceptCall(sessionId: string): Promise<CometChat.Call> {
    try {
      const call = await CometChat.acceptCall(sessionId);

      CometChatCallEvents.ccCallAccepted.next(call);

      CometChatUIEvents.ccShowOngoingCall.next({
        child: call,
      });

      this._activeCall.set(call);
      this._incomingCall.set(null);

      return call;
    } catch (error) {
      CometChatLogger.error('IncomingCallService', 'Error accepting call:', error);
      throw error;
    }
  }

  /**
   * Declines an incoming call.
   *
   * Calls CometChat.rejectCall() with the session ID and "rejected" status,
   * emits ccCallRejected via CometChatCallEvents, and clears the incoming call.
   *
   * @param sessionId - The call session ID
   * @throws CometChat.CometChatException on SDK error
   *
   * @see Requirement 4.3 - Default decline behavior
   */
  async declineCall(sessionId: string): Promise<void> {
    try {
      const call = await CometChat.rejectCall(sessionId, CometChat.CALL_STATUS.REJECTED);

      CometChatCallEvents.ccCallRejected.next(call);

      this._incomingCall.set(null);
    } catch (error) {
      CometChatLogger.error('IncomingCallService', 'Error declining call:', error);
      throw error;
    }
  }

  // ==================== Private: Call Listener ====================

  /**
   * Registers a CometChat CallListener to receive real-time call events.
   *
   * @see Requirement 5.1 - Register CallListener on init
   */
  private registerCallListener(): void {
    CometChat.addCallListener(
      this.listenerId,
      new CometChat.CallListener({
        /**
         * Handle incoming call received.
         * If no active call, set as incoming and play sound.
         * If active call exists, auto-reject with "busy".
         *
         * @see Requirement 5.2 - Set incoming call when no active call
         * @see Requirement 5.3 - Auto-reject with busy when active call exists
         */
        onIncomingCallReceived: (call: CometChat.Call) => {
          this.handleIncomingCall(call);
        },

        /**
         * Handle incoming call cancelled by the caller.
         * Clear state and pause sound.
         *
         * @see Requirement 5.4 - Clear state on cancel
         */
        onIncomingCallCancelled: (call: CometChat.Call) => {
          this.handleIncomingCallCancelled(call);
        },

        /**
         * Handle outgoing call accepted by the recipient.
         * Pause the ringtone.
         */
        onOutgoingCallAccepted: (_call: CometChat.Call) => {
          this.stopIncomingSound();
        },

        /**
         * Handle outgoing call rejected by the recipient.
         * Pause the ringtone.
         */
        onOutgoingCallRejected: (_call: CometChat.Call) => {
          this.stopIncomingSound();
        },
      })
    );
  }

  /**
   * Subscribes to CometChatCallEvents for call lifecycle events.
   *
   * @see Requirement 5.5 - Clear state on ccCallEnded
   * @see Requirement 5.6 - Track outgoing call as active
   */
  private subscribeToCallEvents(): void {
    // When a call ends, clear both active and incoming call state
    this.subscriptions.push(
      CometChatCallEvents.ccCallEnded.subscribe((_call: CometChat.Call) => {
        this._activeCall.set(null);
        this._incomingCall.set(null);
        this.stopIncomingSound();
      })
    );

    // Track outgoing calls as active to prevent incoming calls during outgoing
    this.subscriptions.push(
      CometChatCallEvents.ccOutgoingCall.subscribe((call: CometChat.Call) => {
        this._activeCall.set(call);
      })
    );

    // Handle call rejection events — clear both active and incoming state
    this.subscriptions.push(
      CometChatCallEvents.ccCallRejected.subscribe((_call: CometChat.Call) => {
        this._activeCall.set(null);
        this._incomingCall.set(null);
        this.stopIncomingSound();
      })
    );
  }

  // ==================== Private: Event Handlers ====================

  /**
   * Handles an incoming call received via CallListener.
   *
   * If no active call exists, sets the incoming call and plays the ringtone.
   * If an active call exists, auto-rejects the new call with "busy" status.
   *
   * @param call - The incoming call object
   */
  private handleIncomingCall(call: CometChat.Call): void {
    if (this._activeCall() || this._incomingCall()) {
      // Already on a call or have a pending incoming call — auto-reject with busy
      CometChat.rejectCall(call.getSessionId(), CometChat.CALL_STATUS.BUSY).catch(
        (error: unknown) => {
          CometChatLogger.error(
            'IncomingCallService',
            'Error auto-rejecting call with busy:',
            error
          );
        }
      );
      return;
    }

    this._incomingCall.set(call);
    this.playIncomingSound();
  }

  /**
   * Handles an incoming call cancelled by the caller.
   * Clears the incoming call state and pauses the ringtone.
   *
   * @param call - The cancelled call object
   */
  private handleIncomingCallCancelled(call: CometChat.Call): void {
    const currentIncoming = this._incomingCall();
    if (currentIncoming && currentIncoming.getSessionId() === call.getSessionId()) {
      this._incomingCall.set(null);
      this.stopIncomingSound();
    }
  }

  // ==================== Lifecycle ====================

  /**
   * Removes the call listener and unsubscribes from all event subscriptions.
   *
   * @see Requirement 5.7 - Cleanup on destroy
   */
  ngOnDestroy(): void {
    CometChat.removeCallListener(this.listenerId);

    for (const sub of this.subscriptions) {
      sub.unsubscribe();
    }
    this.subscriptions = [];
  }
}
