import { Injectable, OnDestroy, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatSoundManager } from '../resources/CometChatSoundManager/CometChatSoundManager';
import { CometChatCallEvents } from '../events/CometChatCallEvents';
import { CometChatUIEvents } from '../events/CometChatUIEvents';
import { CometChatMessageEvents } from '../events/CometChatMessageEvents';
import { CometChatUIKitConstants } from '../constants';
import { CometChatUIKitUtility } from '../CometChatUIKitUtility';
import { MessageStatus } from '../Enums/Enums';
import { CometChatLogger } from '../utils/CometChatLogger';

/**
 * CallButtonsService
 *
 * Injectable service managing call state, call initiation, call listener
 * registration, event subscriptions, and button disabled state for the
 * call buttons component.
 *
 * ## Overview
 *
 * This service provides a single source of truth for call button state.
 * It handles:
 * - User calls via `CometChat.initiateCall()`
 * - Group calls via direct calling with custom "meeting" messages
 * - Call listener registration for real-time call events
 * - Event subscriptions for call lifecycle management
 * - Button disabled state based on active calls
 *
 * ## Architecture
 *
 * - **Signals**: Provide synchronous, fine-grained reactivity for call state
 * - **CallListener**: Receives real-time call events from CometChat SDK
 * - **CometChatCallEvents**: RxJS subjects for call lifecycle events
 * - **CometChatUIEvents**: RxJS subjects for UI events (ongoing call screen)
 * - **CometChatMessageEvents**: RxJS subjects for message lifecycle events
 *
 * @Injectable providedIn: 'root'

 */
@Injectable({ providedIn: 'root' })
export class CallButtonsService implements OnDestroy {
  // ==================== State Signals ====================

  /**
   * The current active call object.
   * Set when a user call is initiated via `CometChat.initiateCall()`.
   * Cleared when the call ends, is rejected, or cancelled.
   *
   * @see Requirement 9.2 - Expose active call as a signal
   */
  private _activeCall = signal<CometChat.Call | null>(null);
  readonly activeCall = this._activeCall.asReadonly();

  /**
   * The current call session ID.
   * For user calls, set from the accepted call's session ID.
   * For group calls, set to the group GUID.
   *
   * @see Requirement 9.2 - Expose session ID as a signal
   */
  private _sessionId = signal<string>('');
  readonly sessionId = this._sessionId.asReadonly();

  /**
   * Whether the call buttons are disabled.
   * Disabled during active outgoing/incoming calls.
   *
   * @see Requirement 4.1 - Disable buttons on outgoing call
   * @see Requirement 4.2 - Disable buttons on incoming call
   */
  private _buttonsDisabled = signal<boolean>(false);
  readonly buttonsDisabled = this._buttonsDisabled.asReadonly();

  /**
   * Whether to show the outgoing call screen overlay.
   * Only true for user calls (not group calls).
   *
   * @see Requirement 5.1 - Show outgoing call screen for user calls
   */
  private _showOutgoingCallScreen = signal<boolean>(false);
  readonly showOutgoingCallScreen = this._showOutgoingCallScreen.asReadonly();

  /**
   * Whether to show the ongoing call screen.
   * True after outgoing call is accepted or group call is initiated.
   */
  private _showOngoingCall = signal<boolean>(false);
  readonly showOngoingCall = this._showOngoingCall.asReadonly();

  /**
   * The currently logged-in user.
   * Fetched during initialization, used for setting sender on custom messages
   * and filtering `onOutgoingCallAccepted` events.
   */
  private _loggedInUser = signal<CometChat.User | null>(null);
  readonly loggedInUser = this._loggedInUser.asReadonly();

  /**
   * The active user target for calls.
   * Mutually exclusive with activeGroup.
   *
   * @see Requirement 6.3 - Mutual exclusivity
   */
  private _activeUser = signal<CometChat.User | null>(null);
  readonly activeUser = this._activeUser.asReadonly();

  /**
   * The active group target for calls.
   * Mutually exclusive with activeUser.
   *
   * @see Requirement 6.3 - Mutual exclusivity
   */
  private _activeGroup = signal<CometChat.Group | null>(null);
  readonly activeGroup = this._activeGroup.asReadonly();

  /**
   * Whether the current group call is audio-only.
   * Used to determine call settings for the ongoing call screen.
   */
  private _isGroupAudioCall = signal<boolean>(false);
  readonly isGroupAudioCall = this._isGroupAudioCall.asReadonly();

  /**
   * Whether the current call uses direct calling workflow.
   * True for group calls and meeting joins (no CometChat.endCall needed).
   * False for user-to-user calls (requires CometChat.endCall).
   */
  private _isDirectCalling = signal<boolean>(false);
  readonly isDirectCalling = this._isDirectCalling.asReadonly();

  // ==================== Private State ====================

  private readonly listenerId = 'callbuttons_' + Date.now();
  private subscriptions: Subscription[] = [];
  private initialized = false;

  // ==================== Public Methods ====================

  /**
   * Initializes the service by fetching the logged-in user,
   * registering the call listener, and subscribing to call events.
   *
   * Should be called once when the component initializes.
   * Multiple calls are safely ignored.
   *
   * @see Requirement 6.1 - Register listener and subscribe to events on init
   */
  initialize(): void {
    // Prevent multiple initializations
    if (this.initialized) {
      return;
    }
    this.initialized = true;

    CometChat.getLoggedinUser().then(
      (user: CometChat.User | null) => {
        this._loggedInUser.set(user);
      },
      (error: unknown) => {
        CometChatLogger.error('CallButtonsService', 'Error fetching logged-in user:', error);
      }
    );

    this.registerCallListener();
    this.subscribeToCallEvents();
  }

  /**
   * Sets the active user target for calls.
   * Clears the active group to maintain mutual exclusivity.
   *
   * @param user - The user to call, or null to clear
   * @see Requirement 6.3 - Mutual exclusivity
   */
  setActiveUser(user: CometChat.User | null): void {
    this._activeUser.set(user);
    if (user) {
      this._activeGroup.set(null);
    }
  }

  /**
   * Sets the active group target for calls.
   * Clears the active user to maintain mutual exclusivity.
   *
   * @param group - The group to call, or null to clear
   * @see Requirement 6.3 - Mutual exclusivity
   */
  setActiveGroup(group: CometChat.Group | null): void {
    this._activeGroup.set(group);
    if (group) {
      this._activeUser.set(null);
    }
  }

  /**
   * Initiates an audio call.
   * For user targets, initiates a direct user call.
   * For group targets, sends a custom meeting message and shows the ongoing call screen.
   *
   * @see Requirement 2.1 - User audio call
   * @see Requirement 3.1 - Group audio call
   */
  async initiateAudioCall(): Promise<void> {
    const user = this._activeUser();
    const group = this._activeGroup();

    if (user) {
      this._isDirectCalling.set(false); // User calls use defaultCalling
      await this.initiateUserCall(CometChatUIKitConstants.MessageTypes.audio);
    }

    if (group) {
      this._isDirectCalling.set(true); // Group calls use directCalling
      this._isGroupAudioCall.set(true);
      this._sessionId.set(group.getGuid());
      await this.sendCustomMeetingMessage(CometChatUIKitConstants.MessageTypes.audio);
      this._showOngoingCall.set(true);
      CometChatUIEvents.ccShowOngoingCall.next({
        child: group,
      });
    }
  }

  /**
   * Initiates a video call.
   * For user targets, initiates a direct user call.
   * For group targets, sends a custom meeting message and shows the ongoing call screen.
   *
   * @see Requirement 2.2 - User video call
   * @see Requirement 3.2 - Group video call
   */
  async initiateVideoCall(): Promise<void> {
    const user = this._activeUser();
    const group = this._activeGroup();

    if (user) {
      this._isDirectCalling.set(false); // User calls use defaultCalling
      await this.initiateUserCall(CometChatUIKitConstants.MessageTypes.video);
    }

    if (group) {
      this._isDirectCalling.set(true); // Group calls use directCalling
      this._isGroupAudioCall.set(false);
      this._sessionId.set(group.getGuid());
      await this.sendCustomMeetingMessage(CometChatUIKitConstants.MessageTypes.video);
      this._showOngoingCall.set(true);
      CometChatUIEvents.ccShowOngoingCall.next({
        child: group,
      });
    }
  }

  /**
   * Cancels the current outgoing user call.
   * Pauses sound, rejects the call with "cancelled" status,
   * emits ccCallRejected, and resets state.
   *
   * @see Requirement 5.2 - Cancel outgoing call
   */
  async cancelOutgoingCall(): Promise<void> {
    const call = this._activeCall();
    if (!call) {
      return;
    }

    CometChatSoundManager.pause();

    try {
      const sessionId = call.getSessionId();
      const rejectedCall = await CometChat.rejectCall(
        sessionId,
        CometChatUIKitConstants.calls.cancelled
      );

      CometChatCallEvents.ccCallRejected.next(rejectedCall);
    } catch (error) {
      CometChatLogger.error('CallButtonsService', 'Error cancelling outgoing call:', error);
    }
    this.resetCallState();
  }

  /**
   * Resets all call state to defaults.
   * Enables buttons, clears active call, session ID, and hides screens.
   *
   * @see Requirement 4.5 - Reset state on call ended
   */
  resetCallState(): void {
    this._buttonsDisabled.set(false);
    this._activeCall.set(null);
    this._sessionId.set('');
    this._showOutgoingCallScreen.set(false);
    this._showOngoingCall.set(false);
    this._isDirectCalling.set(false);
    this._isGroupAudioCall.set(false);
  }

  /**
   * Joins an ongoing group meeting from a call bubble message.
   * Sets the session ID, marks this as a direct calling workflow,
   * and shows the ongoing call screen.
   *
   * @param sessionId - The session ID of the meeting to join
   */
  joinMeeting(sessionId: string, isAudioOnly?: boolean): void {
    if (!sessionId) {
      return;
    }
    this._sessionId.set(sessionId);
    // Meeting joins are always direct calling (no CometChat.endCall needed)
    this._isDirectCalling.set(true);
    this._isGroupAudioCall.set(isAudioOnly ?? false);
    this._showOngoingCall.set(true);
    CometChatUIEvents.ccShowOngoingCall.next({
      child: null,
    });
  }

  // ==================== Private Methods ====================

  /**
   * Initiates a user-to-user call.
   * Creates a CometChat.Call object, calls CometChat.initiateCall(),
   * stores the returned call, shows the outgoing call screen, and emits ccOutgoingCall.
   *
   * @param type - The call type ('audio' or 'video')
   * @see Requirement 2.1 - Create call object with audio type
   * @see Requirement 2.2 - Create call object with video type
   */
  private async initiateUserCall(type: string): Promise<void> {
    const user = this._activeUser();
    if (!user) {
      return;
    }

    const callObj = new CometChat.Call(
      user.getUid(),
      type,
      CometChatUIKitConstants.MessageReceiverType.user
    );

    const outgoingCall = await CometChat.initiateCall(callObj);

    this._activeCall.set(outgoingCall);
    this._showOutgoingCallScreen.set(true);
    CometChatCallEvents.ccOutgoingCall.next(outgoingCall);
  }

  /**
   * Sends a custom "meeting" message for group calls.
   * Creates a CustomMessage with meeting type, custom data containing
   * session ID and call type, metadata with incrementUnreadCount,
   * and emits ccMessageSent events.
   *
   * @param callType - The call type ('audio' or 'video')
   * @see Requirement 3.1 - Group audio call meeting message
   * @see Requirement 3.2 - Group video call meeting message
   * @see Requirement 3.3 - Meeting message structure
   */
  private async sendCustomMeetingMessage(callType: string): Promise<void> {
    const group = this._activeGroup();
    const loggedInUser = this._loggedInUser();
    if (!group) {
      return;
    }

    const sessionID = this._sessionId();
    const customData = {
      sessionID,
      sessionId: sessionID,
      callType,
    };

    const customType = CometChatUIKitConstants.calls.meeting;
    const conversationId = `group_${sessionID}`;

    const customMessage: CometChat.CustomMessage = new CometChat.CustomMessage(
      group.getGuid(),
      CometChatUIKitConstants.MessageReceiverType.group,
      customType,
      customData
    );

    customMessage.setMetadata({ incrementUnreadCount: true });
    customMessage.shouldUpdateConversation(true);
    if (loggedInUser) {
      customMessage.setSender(loggedInUser);
    }
    customMessage.setConversationId(conversationId);
    customMessage.setSentAt(CometChatUIKitUtility.getUnixTimestamp());
    customMessage.setMuid(CometChatUIKitUtility.ID());

    CometChatMessageEvents.ccMessageSent.next({
      message: customMessage,
      status: MessageStatus.inprogress,
    });

    try {
      const sentMessage = await CometChat.sendCustomMessage(customMessage);

      CometChatMessageEvents.ccMessageSent.next({
        message: sentMessage,
        status: MessageStatus.success,
      });
    } catch (error) {
      CometChatLogger.error('CallButtonsService', 'Error sending custom meeting message:', error);
    }
  }

  // ==================== Private: Call Listener ====================

  /**
   * Registers a CometChat CallListener to receive real-time call events.
   *
   * @see Requirement 6.1 - Register CallListener on init
   */
  private registerCallListener(): void {
    CometChat.addCallListener(
      this.listenerId,
      new CometChat.CallListener({
        /**
         * Handle incoming call received.
         * Disable buttons to prevent initiating calls during an incoming call.
         *
         * @see Requirement 4.2 - Disable buttons on incoming call
         */
        onIncomingCallReceived: (_call: CometChat.Call) => {
          this._buttonsDisabled.set(true);
        },

        /**
         * Handle incoming call cancelled by the caller.
         * Re-enable buttons.
         *
         * @see Requirement 4.4 - Enable buttons on incoming call cancelled
         */
        onIncomingCallCancelled: (_call: CometChat.Call) => {
          this._buttonsDisabled.set(false);
        },

        /**
         * Handle outgoing call accepted by the recipient.
         * If the sender UID matches the logged-in user or the session ID
         * doesn't match the current call, reset state (ignore the event).
         * Otherwise, transition to the ongoing call screen.
         *
         * @see Requirement 5.3 - Transition to ongoing call on acceptance
         * @see Requirement 5.5 - Ignore if sender is self or session mismatch
         */
        onOutgoingCallAccepted: (call: CometChat.Call) => {
          const loggedInUser = this._loggedInUser();
          const currentCall = this._activeCall();

          if (
            call.getSender()?.getUid() === loggedInUser?.getUid() ||
            call.getSessionId() !== currentCall?.getSessionId()
          ) {
            this.resetCallState();
            return;
          }

          // Stop the outgoing call ringtone immediately when call is accepted
          CometChatSoundManager.pause();

          this._sessionId.set(call.getSessionId());
          this._showOutgoingCallScreen.set(false);
          this._buttonsDisabled.set(true);
          this._showOngoingCall.set(true);

          CometChatUIEvents.ccShowOngoingCall.next({
            child: call,
          });
        },

        /**
         * Handle outgoing call rejected by the recipient.
         * Reset all call state.
         *
         * @see Requirement 5.4 - Reset state on outgoing call rejected
         */
        onOutgoingCallRejected: (_call: CometChat.Call) => {
          this.resetCallState();
        },
      })
    );
  }

  // ==================== Private: Event Subscriptions ====================

  /**
   * Subscribes to CometChatCallEvents for call lifecycle events.
   *
   * @see Requirement 4.3 - Enable buttons on ccCallRejected
   * @see Requirement 4.1 - Disable buttons on ccOutgoingCall
   * @see Requirement 4.5 - Reset state on ccCallEnded
   */
  private subscribeToCallEvents(): void {
    this.subscriptions.push(
      CometChatCallEvents.ccCallRejected.subscribe((_call: CometChat.Call) => {
        this.resetCallState();
      })
    );

    this.subscriptions.push(
      CometChatCallEvents.ccOutgoingCall.subscribe((_call: CometChat.Call) => {
        this._buttonsDisabled.set(true);
      })
    );

    this.subscriptions.push(
      CometChatCallEvents.ccCallEnded.subscribe((_call: CometChat.Call) => {
        // Use resetCallState() to ensure all state is properly cleared,
        // including _isDirectCalling which is needed for workflow switching
        this.resetCallState();
      })
    );

    // Safety reset: when the active chat changes (user navigates to a different
    // conversation), clear any stale disabled state left over from a previous
    // call that may not have fired ccCallEnded properly.
    this.subscriptions.push(
      CometChatUIEvents.ccActiveChatChanged.subscribe(() => {
        if (this._buttonsDisabled() && !this._showOngoingCall() && !this._showOutgoingCallScreen()) {
          this.resetCallState();
        }
      })
    );
  }

  // ==================== Lifecycle ====================

  /**
   * Removes the call listener and unsubscribes from all event subscriptions.
   *
   * @see Requirement 6.2 - Cleanup on destroy
   */
  ngOnDestroy(): void {
    CometChat.removeCallListener(this.listenerId);

    for (const sub of this.subscriptions) {
      sub.unsubscribe();
    }
    this.subscriptions = [];
  }
}
