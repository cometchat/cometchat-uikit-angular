import { Injectable, signal } from '@angular/core';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CallWorkflow } from '../Enums/Enums';
import { CometChatCallEvents } from '../events/CometChatCallEvents';
import { CometChatUIKit } from '../cometchat-uikit';
import { CometChatLogger } from '../utils/CometChatLogger';
import { CometChatUIKitCalls } from '../CometChatCalls';

/**
 * OngoingCallService manages ongoing call session state and configuration.
 * Handles session ID, call workflow type, call activity status, and call settings.
 * @Injectable providedIn: 'root'
 */
@Injectable({ providedIn: 'root' })
export class OngoingCallService {
  private _sessionID = signal<string>('');
  readonly sessionID = this._sessionID.asReadonly();

  private _callWorkflow = signal<CallWorkflow>(CallWorkflow.defaultCalling);
  readonly callWorkflow = this._callWorkflow.asReadonly();

  private _isCallActive = signal<boolean>(false);
  readonly isCallActive = this._isCallActive.asReadonly();

  private _callSettingsBuilder = signal<Record<string, any> | null>(null);
  readonly callSettingsBuilder = this._callSettingsBuilder.asReadonly();

  private _isAudioOnly = signal<boolean>(false);
  readonly isAudioOnly = this._isAudioOnly.asReadonly();

  /** Sets the current call session ID. @see Requirement 1.6 */
  setSessionID(sessionID: string): void { this._sessionID.set(sessionID); }

  /** Sets the call workflow type. @see Requirement 1.6 */
  setCallWorkflow(workflow: CallWorkflow): void { this._callWorkflow.set(workflow); }

  /** Sets a custom session settings object. @see Requirement 1.6 */
  setCallSettingsBuilder(builder: Record<string, any> | null): void { this._callSettingsBuilder.set(builder); }

  /** Sets whether the current call is audio-only. */
  setIsAudioOnly(isAudioOnly: boolean): void { this._isAudioOnly.set(isAudioOnly); }

  /** Builds and returns a v5 SessionSettings plain object. @see Requirements 3.1, 3.2 */
  getCallSettings(_sessionID: string, _onError?: Function): any {
    const customSettings = this._callSettingsBuilder();
    if (customSettings) return customSettings;

    return {
      sessionType: this._isAudioOnly() ? 'VOICE' : 'VIDEO',
      layout: 'TILE',
      startAudioMuted: false,
      startVideoPaused: false,
      hideControlPanel: false,
      hideLeaveSessionButton: false,
      hideToggleAudioButton: false,
      hideToggleVideoButton: false,
      hideRecordingButton: true,
      hideScreenSharingButton: false,
      hideChangeLayoutButton: false,
    };
  }

  private _eventUnsubscribers: Array<() => void> = [];
  private _chatCallListenerId = '';

  /** Registers v5 granular event listeners for the current call session. */
  private registerSessionEventListeners(sessionID: string, onError?: Function): void {
    const unsubSessionLeft = CometChatUIKitCalls.addEventListener('onSessionLeft', () => {
      if (this._callWorkflow() === CallWorkflow.defaultCalling) {
        CometChat.clearActiveCall();
        CometChatCallEvents.ccCallEnded.next(null as any);
      }
      this._isCallActive.set(false);
      this.removeChatCallListener();
    });

    const unsubLeaveBtn = CometChatUIKitCalls.addEventListener('onLeaveSessionButtonClicked', () => {
      if (this._callWorkflow() === CallWorkflow.defaultCalling) {
        CometChat.endCall(sessionID)
          .then((call: CometChat.Call) => {
            CometChatUIKitCalls.leaveSession();
            CometChatCallEvents.ccCallEnded.next(call);
            this._isCallActive.set(false);
            this.removeChatCallListener();
          })
          .catch((err: CometChat.CometChatException) => {
            const exception = this.toCometchatException(err, 'onLeaveSessionButtonClicked');
            CometChatLogger.error('OngoingCallService', 'onLeaveSessionButtonClicked:', err);
            if (onError) onError(exception);
          });
      } else {
        CometChatCallEvents.ccCallEnded.next(null as any);
        CometChatUIKitCalls.leaveSession();
        this._isCallActive.set(false);
        this.removeChatCallListener();
      }
    });

    // When the other participant leaves a 1:1 default call, end the session for this user too.
    // For group/direct calls, participants can leave independently without ending the session.
    const unsubParticipantLeft = CometChatUIKitCalls.addEventListener('onParticipantLeft', (_participant: any) => {
      if (this._isCallActive() && this._callWorkflow() === CallWorkflow.defaultCalling) {
        CometChatUIKitCalls.leaveSession();
        CometChat.clearActiveCall();
        CometChatCallEvents.ccCallEnded.next(null as any);
        this._isCallActive.set(false);
        this.removeChatCallListener();
        this.removeSessionEventListeners();
      }
    });

    // Session timed out due to inactivity
    const unsubSessionTimedOut = CometChatUIKitCalls.addEventListener('onSessionTimedOut', () => {
      if (this._isCallActive()) {
        if (this._callWorkflow() === CallWorkflow.defaultCalling) {
          CometChat.clearActiveCall();
        }
        CometChatCallEvents.ccCallEnded.next(null as any);
        this._isCallActive.set(false);
        this.removeChatCallListener();
      }
    });

    if (typeof unsubSessionLeft === 'function') this._eventUnsubscribers.push(unsubSessionLeft);
    if (typeof unsubLeaveBtn === 'function') this._eventUnsubscribers.push(unsubLeaveBtn);
    if (typeof unsubParticipantLeft === 'function') this._eventUnsubscribers.push(unsubParticipantLeft);
    if (typeof unsubSessionTimedOut === 'function') this._eventUnsubscribers.push(unsubSessionTimedOut);

    // Also register a Chat SDK CallListener to detect when the remote
    // user ends the call. Handles 1:1 calls ended via CometChat.endCall().
    this._chatCallListenerId = 'ongoing_call_' + Date.now();
    CometChat.addCallListener(
      this._chatCallListenerId,
      new CometChat.CallListener({
        onIncomingCallCancelled: (call: CometChat.Call) => {
          if (this._isCallActive() && call.getSessionId() === sessionID) {
            CometChatUIKitCalls.leaveSession();
            CometChat.clearActiveCall();
            CometChatCallEvents.ccCallEnded.next(null as any);
            this._isCallActive.set(false);
            this.removeChatCallListener();
            this.removeSessionEventListeners();
          }
        },
        onCallEndedMessageReceived: (call: CometChat.Call) => {
          if (this._isCallActive() && call.getSessionId() === sessionID) {
            CometChatUIKitCalls.leaveSession();
            CometChat.clearActiveCall();
            CometChatCallEvents.ccCallEnded.next(call);
            this._isCallActive.set(false);
            this.removeChatCallListener();
            this.removeSessionEventListeners();
          }
        },
      })
    );
  }

  private removeSessionEventListeners(): void {
    for (const unsub of this._eventUnsubscribers) {
      try { unsub(); } catch { /* ignore */ }
    }
    this._eventUnsubscribers = [];
  }

  private removeChatCallListener(): void {
    if (this._chatCallListenerId) {
      CometChat.removeCallListener(this._chatCallListenerId);
      this._chatCallListenerId = '';
    }
  }

  /** Starts an ongoing call session. @see Requirements 1.2, 11.1, 11.2 */
  async startCall(callScreenFrame: HTMLElement, onError?: Function): Promise<void> {
    try {
      await CometChatUIKit.callingReady;
      const sessionID = this._sessionID();
      this.registerSessionEventListeners(sessionID, onError);
      const sessionSettings = this.getCallSettings(sessionID, onError);
      const loggedInUser = CometChatUIKit.getLoggedInUser();
      const tokenResponse = await CometChatUIKitCalls.generateToken(sessionID, loggedInUser?.getAuthToken());
      await CometChatUIKitCalls.joinSession(tokenResponse.token, sessionSettings, callScreenFrame);
      this._isCallActive.set(true);
    } catch (error) {
      this.removeSessionEventListeners();
      const exception = this.toCometchatException(error, 'startCall');
      CometChatLogger.error('OngoingCallService', 'startCall:', error);
      if (onError) onError(exception);
      throw exception;
    }
  }

  /** Ends the current call session (local cleanup only). @see Requirement 1.3 */
  endSession(): void {
    CometChatUIKitCalls.leaveSession();
    this.removeSessionEventListeners();
    this.removeChatCallListener();
    this._isCallActive.set(false);
    this._sessionID.set('');
  }

  /** Ends the current call and cleans up the session. @see Requirements 1.4, 1.5, 11.3 */
  async endCall(onError?: Function): Promise<void> {
    const workflow = this._callWorkflow();
    const sessionID = this._sessionID();

    if (workflow === CallWorkflow.defaultCalling) {
      try {
        const endedCall = await CometChat.endCall(sessionID);
        this.endSession();
        CometChatCallEvents.ccCallEnded.next(endedCall as CometChat.Call);
      } catch (error) {
        const exception = this.toCometchatException(error, 'endCall');
        CometChatLogger.error('OngoingCallService', 'endCall:', error);
        if (onError) onError(exception);
        throw exception;
      }
    } else {
      CometChatCallEvents.ccCallEnded.next({} as CometChat.Call);
      this.endSession();
    }
  }

  private toCometchatException(error: unknown, context: string): CometChat.CometChatException {
    if (error instanceof CometChat.CometChatException) return error;
    if (error instanceof Error) {
      return new CometChat.CometChatException({ code: 'ONGOING_CALL_ERROR', message: `${context}: ${error.message}`, details: error.stack || '' });
    }
    let errorMessage: string;
    try { errorMessage = String(error); } catch { errorMessage = '[non-stringifiable error]'; }
    return new CometChat.CometChatException({ code: 'ONGOING_CALL_ERROR', message: `${context}: ${errorMessage}`, details: '' });
  }
}
