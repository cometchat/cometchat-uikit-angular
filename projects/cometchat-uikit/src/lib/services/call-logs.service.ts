import { Injectable, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { MessageStatus, States } from '../Enums/Enums';
import { CometChatCalls } from '@cometchat/calls-sdk-javascript';
import { CometChatCallEvents } from '../events/CometChatCallEvents';
import { CometChatMessageEvents } from '../events/CometChatMessageEvents';
import { CometChatUIKitConstants } from '../constants';
import { CometChatLogger } from '../utils/CometChatLogger';
import { CometChatUIKitCalls } from '../CometChatCalls';
import { CometChatSoundManager } from '../resources/CometChatSoundManager/CometChatSoundManager';

/**
 * CallLogsService
 *
 * Injectable service managing call log fetching, pagination state,
 * call initiation, call listeners, and event subscriptions for the
 * CometChatCallLogs component.
 *
 * ## Overview
 *
 * This service provides a single source of truth for call log state.
 * It handles:
 * - Fetching call logs via `CallLogRequestBuilder` from the Calls SDK
 * - Pagination (infinite scroll) with `fetchNextCallLogs()`
 * - Call initiation and cancellation (Task 2)
 * - Call listener registration for real-time call events (Task 2)
 * - Error handling with `onError` callback propagation
 *
 * ## Architecture
 *
 * - **Signals**: Provide synchronous, fine-grained reactivity for call log state
 * - **Not providedIn: 'root'**: Each component instance gets its own service instance
 * - **CallLogRequestBuilder**: From CometChatCalls (Calls SDK), not the main Chat SDK
 *
 * @Injectable — not providedIn: 'root' so each component gets its own instance

 */
@Injectable()
export class CallLogsService {
  // ==================== State Signals ====================

  /**
   * Array of fetched call log objects.
   * Updated by `fetchCallLogs()` and `fetchNextCallLogs()`.
   *
   * @see Requirement 1.1, 1.2, 1.3
   */
  private _callLogs = signal<any[]>([]);
  readonly callLogs = this._callLogs.asReadonly();

  /**
   * Current list state (loading, loaded, empty, error).
   *
   * @see Requirement 1.4, 1.5, 1.6
   */
  private _state = signal<States>(States.loading);
  readonly state = this._state.asReadonly();

  /**
   * Whether more pages of call logs are available for pagination.
   *
   * @see Requirement 1.3
   */
  private _hasMore = signal<boolean>(true);
  readonly hasMore = this._hasMore.asReadonly();

  /**
   * Whether to show the outgoing call screen overlay.
   * Set to true when a call is initiated from the call logs list.
   *
   * @see Requirement 3.3
   */
  private _showOutgoingCallScreen = signal<boolean>(false);
  readonly showOutgoingCallScreen = this._showOutgoingCallScreen.asReadonly();

  /**
   * Whether to show the ongoing call screen.
   * Set to true when an outgoing call is accepted.
   *
   * @see Requirement 4.1
   */
  private _showOngoingCall = signal<boolean>(false);
  readonly showOngoingCall = this._showOngoingCall.asReadonly();

  /**
   * The currently active call object.
   * Set when a call is initiated, cleared when the call ends.
   *
   * @see Requirement 3.3
   */
  private _activeCallObject = signal<CometChat.Call | null>(null);
  readonly activeCallObject = this._activeCallObject.asReadonly();

  /**
   * Session ID for the ongoing call.
   * Set when an outgoing call is accepted by the receiver.
   *
   * @see Requirement 4.1
   */
  private _sessionId = signal<string | null>(null);
  readonly sessionId = this._sessionId.asReadonly();

  // ==================== Private State ====================

  /**
   * The built CallLogRequest used for pagination.
   * Created from the provided or default `CallLogRequestBuilder`.
   */
  private callLogRequest: any = null;

  /**
   * Optional custom `CallLogRequestBuilder` provided by the component.
   * If null, a default builder is created in `fetchCallLogs()`.
   *
   * @see Requirement 2.5
   */
  private callLogRequestBuilder: any = null;

  /**
   * The currently logged-in CometChat user.
   * Required for building the default `CallLogRequestBuilder` (auth token).
   */
  private loggedInUser: CometChat.User | null = null;

  /**
   * Optional error callback provided by the component.
   * If set, errors are forwarded to this callback.
   * If not set, errors are logged to the console only.
   *
   * @see Requirement 7.1, 7.2
   */
  private onError: ((error: CometChat.CometChatException) => void) | null = null;

  /**
   * Unique listener ID for the CometChat CallListener.
   * Uses timestamp to avoid collisions across multiple component instances.
   */
  private readonly listenerId = 'callLogs_' + Date.now();

  /**
   * RxJS subscriptions for CometChatCallEvents.
   * Stored for cleanup on destroy.
   *
   * @see Requirement 4.4
   */
  private subscriptions: Subscription[] = [];

  /**
   * Guard flag to prevent concurrent fetchNext() calls on the same request.
   * The SDK throws REQUEST_IN_PROGRESS if fetchNext() is called while one is pending.
   */
  private isFetching = false;

  // ==================== Configuration Methods ====================

  /**
   * Sets a custom `CallLogRequestBuilder` to use instead of the default.
   * When provided, this builder is used as-is (the consumer controls limit, category, etc.).
   *
   * @param builder - A `CallLogRequestBuilder` instance from CometChatCalls
   * @see Requirement 2.5
   */
  setCallLogRequestBuilder(builder: any): void {
    this.callLogRequestBuilder = builder;
    this.callLogRequest = null; // Reset so next fetch uses the new builder
  }

  /**
   * Sets the logged-in user. Required for building the default request builder
   * (needs the user's auth token).
   *
   * @param user - The currently logged-in CometChat user
   */
  setLoggedInUser(user: CometChat.User): void {
    this.loggedInUser = user;
  }

  /**
   * Sets the error callback for forwarding errors to the component.
   *
   * @param callback - Error callback, or null to clear
   * @see Requirement 7.1, 7.2
   */
  setOnError(callback: ((error: CometChat.CometChatException) => void) | null): void {
    this.onError = callback;
  }

  /**
   * Sets the current state of the call logs list.
   * Used by the component to control loading/error states for retry functionality.
   *
   * @param state - The new state to set
   */
  setState(state: States): void {
    this._state.set(state);
  }

  // ==================== Data Fetching ====================

  /**
   * Fetches the initial page of call logs.
   *
   * Uses the custom `callLogRequestBuilder` if provided, otherwise creates
   * a default builder with limit 30 and category "call".
   *
   * Sets state to `loading` before fetching, then to `loaded`, `empty`, or `error`
   * based on the result.
   *
   * @see Requirement 1.1, 1.4, 1.5, 1.6
   */
  async fetchCallLogs(): Promise<void> {
    try {
      // Clear existing data so shimmer shows (paginated list requires items.length === 0)
      this._callLogs.set([]);
      this._state.set(States.loading);
      this.isFetching = true;

      const startTime = Date.now();
      const MIN_SHIMMER_TIME = 1000; // Minimum 1s shimmer on initial fetch

      // Build the request from custom or default builder
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

  /**
   * Fetches the next page of call logs and appends them to the existing list.
   *
   * @returns `true` if there are potentially more pages, `false` if no more data
   * @see Requirement 1.3
   */
  async fetchNextCallLogs(): Promise<boolean> {
    if (!this.callLogRequest || this.isFetching) {
      return false;
    }

    this.isFetching = true;

    try {
      const calls: any[] = await this.callLogRequest.fetchNext();

      if (calls && calls.length > 0) {
        const currentLogs = this._callLogs();
        this._callLogs.set([...currentLogs, ...calls]);
        this._hasMore.set(true);
        // Ensure state is loaded if we had an empty initial state
        if (this._state() !== States.loaded) {
          this._state.set(States.loaded);
        }
        return true;
      } else {
        this._hasMore.set(false);
        return false;
      }
    } catch (err: unknown) {
      // If we already have items, keep them and just report the error
      if (this._callLogs().length === 0) {
        this._state.set(States.error);
      }
      this.handleError(err);
      return false;
    } finally {
      this.isFetching = false;
    }
  }

  // ==================== Call Initiation ====================

  /**
   * Initiates a new call to the specified user.
   *
   * Creates a `CometChat.Call` object, calls `CometChat.initiateCall()`,
   * updates the active call and outgoing call screen signals, and emits
   * `CometChatMessageEvents.ccMessageSent` with inprogress status.
   *
   * Follows the same pattern as the React `CometChatCallLogs.initiateCall`.
   *
   * @param type - The call type (CometChat.CALL_TYPE.AUDIO or CometChat.CALL_TYPE.VIDEO)
   * @param uid - The UID of the user to call
   * @see Requirement 3.1 - Initiate call of same type to Other_Party
   * @see Requirement 3.3 - Display Outgoing_Call_Overlay on successful initiation
   */
  async initiateCall(type: string, uid: string): Promise<void> {
    try {
      const receiverType = CometChatUIKitConstants.MessageReceiverType.user;
      const callType =
        type === CometChat.CALL_TYPE.VIDEO ? CometChat.CALL_TYPE.VIDEO : CometChat.CALL_TYPE.AUDIO;

      const callObj = new CometChat.Call(uid, callType, receiverType);
      const outgoingCall = await CometChat.initiateCall(callObj);

      this._activeCallObject.set(outgoingCall);
      this._showOutgoingCallScreen.set(true);

      CometChatMessageEvents.ccMessageSent.next({
        message: outgoingCall,
        status: MessageStatus.inprogress,
      });
    } catch (err: unknown) {
      this.handleError(err);
    }
  }

  /**
   * Cancels the current outgoing call.
   *
   * Rejects the call with "cancelled" status via `CometChat.rejectCall()`,
   * resets the outgoing call screen and active call signals, and emits
   * `CometChatMessageEvents.ccMessageSent` with success status.
   *
   * Follows the same pattern as the React `CometChatCallLogs.cancelOutgoingCall`.
   *
   * @see Requirement 3.4 - Reject call with cancelled status, hide overlay
   */
  async cancelOutgoingCall(): Promise<void> {
    const call = this._activeCallObject();
    if (!call) {
      return;
    }

    try {
      const sessionId = call.getSessionId();
      await CometChat.rejectCall(sessionId, CometChatUIKitConstants.calls.cancelled);

      CometChatSoundManager.pause();
      this._activeCallObject.set(null);
      this._showOutgoingCallScreen.set(false);

      CometChatMessageEvents.ccMessageSent.next({
        message: call,
        status: MessageStatus.success,
      });
    } catch (err: unknown) {
      CometChatSoundManager.pause();
      this._showOutgoingCallScreen.set(false);
      this.handleError(err);
    }
  }

  // ==================== Call Lifecycle ====================

  /**
   * Initializes call listeners and event subscriptions.
   *
   * Registers a `CometChat.CallListener` for outgoing call accepted/rejected
   * events, and subscribes to `CometChatCallEvents.ccCallEnded` to handle
   * ongoing call screen dismissal.
   *
   * Should be called once when the component initializes.
   *
   * @see Requirement 4.1 - Hide outgoing overlay, show ongoing on accepted
   * @see Requirement 4.2 - Hide outgoing overlay, reset state on rejected
   * @see Requirement 4.3 - Hide ongoing overlay on ccCallEnded
   */
  initialize(): void {
    CometChat.addCallListener(
      this.listenerId,
      new CometChat.CallListener({
        /**
         * Handle outgoing call accepted by the receiver.
         * Transition from outgoing overlay to ongoing call screen.
         *
         * @see Requirement 4.1
         */
        onOutgoingCallAccepted: (call: CometChat.Call) => {
          CometChatSoundManager.pause();
          this._showOutgoingCallScreen.set(false);
          this._sessionId.set(call.getSessionId());
          this._showOngoingCall.set(true);
        },

        /**
         * Handle outgoing call rejected by the receiver.
         * Hide outgoing overlay and reset call state.
         *
         * @see Requirement 4.2
         */
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

  /**
   * Removes the call listener and unsubscribes from all event subscriptions.
   *
   * Should be called when the component is destroyed.
   *
   * @see Requirement 4.4 - Remove all listeners and subscriptions on destroy
   */
  cleanup(): void {
    CometChat.removeCallListener(this.listenerId);

    for (const sub of this.subscriptions) {
      sub.unsubscribe();
    }
    this.subscriptions = [];
  }

  // ==================== Error Handling ====================

  /**
   * Handles errors by wrapping them in a `CometChatException` and forwarding
   * to the `onError` callback if provided, otherwise logging to console.
   *
   * Follows the same error wrapping pattern as `CallButtonsService`.
   *
   * @param err - The error to handle
   * @see Requirement 7.1, 7.2
   */
  private handleError(err: unknown): void {
    let exception: CometChat.CometChatException;

    if (err instanceof CometChat.CometChatException) {
      exception = err;
    } else if (err instanceof Error) {
      exception = new CometChat.CometChatException({
        code: 'CALL_LOGS_ERROR',
        message: err.message,
        details: err.stack || '',
      });
    } else {
      exception = new CometChat.CometChatException({
        code: 'CALL_LOGS_ERROR',
        message: String(err),
        details: '',
      });
    }

    if (this.onError) {
      this.onError(exception);
    }

    CometChatLogger.error('CometChatCallLogs', 'Error:', err);
  }
}
