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
 * CallButtonsService manages call state, call initiation, call listener registration,
 * event subscriptions, and button disabled state for the call buttons component.
 * @Injectable providedIn: 'root'
 */
@Injectable({ providedIn: 'root' })
export class CallButtonsService implements OnDestroy {
  private _activeCall = signal<CometChat.Call | null>(null);
  readonly activeCall = this._activeCall.asReadonly();

  private _sessionId = signal<string>('');
  readonly sessionId = this._sessionId.asReadonly();

  private _buttonsDisabled = signal<boolean>(false);
  readonly buttonsDisabled = this._buttonsDisabled.asReadonly();

  private _showOutgoingCallScreen = signal<boolean>(false);
  readonly showOutgoingCallScreen = this._showOutgoingCallScreen.asReadonly();

  private _showOngoingCall = signal<boolean>(false);
  readonly showOngoingCall = this._showOngoingCall.asReadonly();

  private _loggedInUser = signal<CometChat.User | null>(null);
  readonly loggedInUser = this._loggedInUser.asReadonly();

  private _activeUser = signal<CometChat.User | null>(null);
  readonly activeUser = this._activeUser.asReadonly();

  private _activeGroup = signal<CometChat.Group | null>(null);
  readonly activeGroup = this._activeGroup.asReadonly();

  private _isGroupAudioCall = signal<boolean>(false);
  readonly isGroupAudioCall = this._isGroupAudioCall.asReadonly();

  private _isDirectCalling = signal<boolean>(false);
  readonly isDirectCalling = this._isDirectCalling.asReadonly();

  private readonly listenerId = 'callbuttons_' + Date.now();
  private subscriptions: Subscription[] = [];
  private initialized = false;

  /** Initializes the service. Should be called once when the component initializes. @see Requirement 6.1 */
  initialize(): void {
    if (this.initialized) return;
    this.initialized = true;

    CometChat.getLoggedinUser().then(
      (user: CometChat.User | null) => { this._loggedInUser.set(user); },
      (error: unknown) => { CometChatLogger.error('CallButtonsService', 'Error fetching logged-in user:', error); }
    );

    this.registerCallListener();
    this.subscribeToCallEvents();
  }

  /** Sets the active user target. Clears active group. @see Requirement 6.3 */
  setActiveUser(user: CometChat.User | null): void {
    this._activeUser.set(user);
    if (user) this._activeGroup.set(null);
  }

  /** Sets the active group target. Clears active user. @see Requirement 6.3 */
  setActiveGroup(group: CometChat.Group | null): void {
    this._activeGroup.set(group);
    if (group) this._activeUser.set(null);
  }

  /** Initiates an audio call. @see Requirements 2.1, 3.1 */
  async initiateAudioCall(): Promise<void> {
    const user = this._activeUser();
    const group = this._activeGroup();

    if (user) {
      this._isDirectCalling.set(false);
      await this.initiateUserCall(CometChatUIKitConstants.MessageTypes.audio);
    }

    if (group) {
      this._isDirectCalling.set(true);
      this._isGroupAudioCall.set(true);
      this._sessionId.set(group.getGuid());
      await this.sendCustomMeetingMessage(CometChatUIKitConstants.MessageTypes.audio);
      this._showOngoingCall.set(true);
      CometChatUIEvents.ccShowOngoingCall.next({ child: group });
    }
  }

  /** Initiates a video call. @see Requirements 2.2, 3.2 */
  async initiateVideoCall(): Promise<void> {
    const user = this._activeUser();
    const group = this._activeGroup();

    if (user) {
      this._isDirectCalling.set(false);
      await this.initiateUserCall(CometChatUIKitConstants.MessageTypes.video);
    }

    if (group) {
      this._isDirectCalling.set(true);
      this._isGroupAudioCall.set(false);
      this._sessionId.set(group.getGuid());
      await this.sendCustomMeetingMessage(CometChatUIKitConstants.MessageTypes.video);
      this._showOngoingCall.set(true);
      CometChatUIEvents.ccShowOngoingCall.next({ child: group });
    }
  }

  /** Cancels the current outgoing user call. @see Requirement 5.2 */
  async cancelOutgoingCall(): Promise<void> {
    const call = this._activeCall();
    if (!call) return;

    CometChatSoundManager.pause();

    try {
      const sessionId = call.getSessionId();
      const rejectedCall = await CometChat.rejectCall(sessionId, CometChatUIKitConstants.calls.cancelled);
      CometChatCallEvents.ccCallRejected.next(rejectedCall);
    } catch (error) {
      CometChatLogger.error('CallButtonsService', 'Error cancelling outgoing call:', error);
    }
    this.resetCallState();
  }

  /** Resets all call state to defaults. @see Requirement 4.5 */
  resetCallState(): void {
    this._buttonsDisabled.set(false);
    this._activeCall.set(null);
    this._sessionId.set('');
    this._showOutgoingCallScreen.set(false);
    this._showOngoingCall.set(false);
    this._isDirectCalling.set(false);
    this._isGroupAudioCall.set(false);
  }

  /** Joins an ongoing group meeting from a call bubble message. */
  joinMeeting(sessionId: string, isAudioOnly?: boolean): void {
    if (!sessionId) return;
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
