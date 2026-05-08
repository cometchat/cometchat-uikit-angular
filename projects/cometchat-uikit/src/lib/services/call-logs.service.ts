import { Injectable, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { MessageStatus, States } from '../Enums/Enums';
import { CometChatCallEvents } from '../events/CometChatCallEvents';
import { CometChatMessageEvents } from '../events/CometChatMessageEvents';
import { CometChatUIEvents } from '../events/CometChatUIEvents';
import { CometChatUIKitConstants } from '../constants';
import { CometChatLogger } from '../utils/CometChatLogger';
import { CometChatUIKitCalls } from '../CometChatCalls';
import { CometChatSoundManager } from '../resources/CometChatSoundManager/CometChatSoundManager';

/**
 * CallLogsService manages call log fetching, pagination, call initiation,
 * call listeners, and event subscriptions for the CometChatCallLogs component.
 * Not providedIn: 'root' — each component gets its own instance.
 */
@Injectable()
export class CallLogsService {
  private _callLogs = signal<any[]>([]);
  readonly callLogs = this._callLogs.asReadonly();

  private _state = signal<States>(States.loading);
  readonly state = this._state.asReadonly();

  private _hasMore = signal<boolean>(true);
  readonly hasMore = this._hasMore.asReadonly();

  private _showOutgoingCallScreen = signal<boolean>(false);
  readonly showOutgoingCallScreen = this._showOutgoingCallScreen.asReadonly();

  private _showOngoingCall = signal<boolean>(false);
  readonly showOngoingCall = this._showOngoingCall.asReadonly();

  private _activeCallObject = signal<CometChat.Call | null>(null);
  readonly activeCallObject = this._activeCallObject.asReadonly();

  private _sessionId = signal<string | null>(null);
  readonly sessionId = this._sessionId.asReadonly();

  private callLogRequest: any = null;
  private callLogRequestBuilder: any = null;
  private loggedInUser: CometChat.User | null = null;
  private onError: ((error: CometChat.CometChatException) => void) | null = null;
  private readonly listenerId = 'callLogs_' + Date.now();
  private subscriptions: Subscription[] = [];
  private isFetching = false;

  /** Sets a custom CallLogRequestBuilder. @see Requirement 2.5 */
  setCallLogRequestBuilder(builder: any): void {
    this.callLogRequestBuilder = builder;
    this.callLogRequest = null;
  }

  /** Sets the logged-in user (needed for default request builder). */
  setLoggedInUser(user: CometChat.User): void { this.loggedInUser = user; }

  /** Sets the error callback. @see Requirements 7.1, 7.2 */
  setOnError(callback: ((error: CometChat.CometChatException) => void) | null): void { this.onError = callback; }

  /** Sets the current state. */
  setState(state: States): void { this._state.set(state); }

  /** Fetches the initial page of call logs. @see Requirements 1.1, 1.4-1.6 */
  async fetchCallLogs(): Promise<void> {
    try {
      this._callLogs.set([]);
      this._state.set(States.loading);
      this.isFetching = true;

      const startTime = Date.now();
      const MIN_SHIMMER_TIME = 1000;

      if (this.callLogRequestBuilder) {
        this.callLogRequest = this.callLogRequestBuilder.build();
      } else {
        const authToken = this.loggedInUser?.getAuthToken();
        this.callLogRequest = new CometChatUIKitCalls.CallLogRequestBuilder()
          .setLimit(30)
          .setCallCategory('call')
          .setAuthToken(authToken!)
          .build();
      }

      const calls: any[] = await this.callLogRequest.fetchNext();

      // Ensure shimmer is visible for at least MIN_SHIMMER_TIME
      const elapsed = Date.now() - startTime;
      const remainingTime = Math.max(0, MIN_SHIMMER_TIME - elapsed);
      await new Promise<void>(resolve => setTimeout(resolve, remainingTime));

      if (calls && calls.length > 0) {
        this._callLogs.set(calls);
        this._state.set(States.loaded);
      } else {
        this._callLogs.set([]);
        this._state.set(States.empty);
        this._hasMore.set(false);
      }
    } catch (err: unknown) {
      this._state.set(States.error);
      this.handleError(err);
    } finally {
      this.isFetching = false;
    }
  }

  /** Fetches the next page of call logs. @see Requirement 1.3 */
  async fetchNextCallLogs(): Promise<boolean> {
    if (!this.callLogRequest || this.isFetching) return false;
    this.isFetching = true;

    try {
      const calls: any[] = await this.callLogRequest.fetchNext();
      if (calls && calls.length > 0) {
        this._callLogs.set([...this._callLogs(), ...calls]);
        this._hasMore.set(true);
        if (this._state() !== States.loaded) this._state.set(States.loaded);
        return true;
      } else {
        this._hasMore.set(false);
        return false;
      }
    } catch (err: unknown) {
      if (this._callLogs().length === 0) this._state.set(States.error);
      this.handleError(err);
      return false;
    } finally {
      this.isFetching = false;
    }
  }

  /** Initiates a new call to the specified user. @see Requirements 3.1, 3.3 */
  async initiateCall(type: string, uid: string): Promise<void> {
    try {
      const receiverType = CometChatUIKitConstants.MessageReceiverType.user;
      const callType = type === CometChat.CALL_TYPE.VIDEO ? CometChat.CALL_TYPE.VIDEO : CometChat.CALL_TYPE.AUDIO;
      const callObj = new CometChat.Call(uid, callType, receiverType);
      const outgoingCall = await CometChat.initiateCall(callObj);
      this._activeCallObject.set(outgoingCall);
      this._showOutgoingCallScreen.set(true);
      CometChatMessageEvents.ccMessageSent.next({ message: outgoingCall, status: MessageStatus.inprogress });
    } catch (err: unknown) {
      this.handleError(err);
    }
  }

  /** Cancels the current outgoing call. @see Requirement 3.4 */
  async cancelOutgoingCall(): Promise<void> {
    const call = this._activeCallObject();
    if (!call) return;

    try {
      const rejectedCall = await CometChat.rejectCall(call.getSessionId(), CometChatUIKitConstants.calls.cancelled);
      CometChatSoundManager.pause();
      this._activeCallObject.set(null);
      this._showOutgoingCallScreen.set(false);
      CometChatCallEvents.ccCallRejected.next(rejectedCall);
      CometChatMessageEvents.ccMessageSent.next({ message: call, status: MessageStatus.success });
    } catch (err: unknown) {
      CometChatSoundManager.pause();
      this._showOutgoingCallScreen.set(false);
      this.handleError(err);
    }
  }

  /** Initializes call listeners and event subscriptions. @see Requirements 4.1-4.3 */
  initialize(): void {
    CometChat.addCallListener(
      this.listenerId,
      new CometChat.CallListener({
        onOutgoingCallAccepted: (call: CometChat.Call) => {
          CometChatSoundManager.pause();
          this._showOutgoingCallScreen.set(false);
          this._sessionId.set(call.getSessionId());
          this._activeCallObject.set(call);
          this._showOngoingCall.set(true);
          CometChatUIEvents.ccShowOngoingCall.next({ child: call });
        },
        onOutgoingCallRejected: (_call: CometChat.Call) => {
          CometChatSoundManager.pause();
          this._showOutgoingCallScreen.set(false);
          this._activeCallObject.set(null);
        },
      })
    );

    this.subscriptions.push(
      CometChatCallEvents.ccCallEnded.subscribe((_call: CometChat.Call) => {
        this._showOngoingCall.set(false);
        this._sessionId.set(null);
        this._activeCallObject.set(null);
      })
    );
  }

  /** Removes the call listener and unsubscribes from all event subscriptions. @see Requirement 4.4 */
  cleanup(): void {
    CometChat.removeCallListener(this.listenerId);
    for (const sub of this.subscriptions) sub.unsubscribe();
    this.subscriptions = [];
  }

  private handleError(err: unknown): void {
    let exception: CometChat.CometChatException;
    if (err instanceof CometChat.CometChatException) {
      exception = err;
    } else if (err instanceof Error) {
      exception = new CometChat.CometChatException({ code: 'CALL_LOGS_ERROR', message: err.message, details: err.stack || '' });
    } else {
      exception = new CometChat.CometChatException({ code: 'CALL_LOGS_ERROR', message: String(err), details: '' });
    }
    if (this.onError) this.onError(exception);
    CometChatLogger.error('CometChatCallLogs', 'Error:', err);
  }
}
