import { Injectable, signal } from '@angular/core';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CallWorkflow } from '../Enums/Enums';
import { CometChatCallEvents } from '../events/CometChatCallEvents';
import { CometChatUIKit } from '../cometchat-uikit';
import { CometChatLogger } from '../utils/CometChatLogger';
import { CometChatUIKitCalls } from '../CometChatCalls';

/**
 * OngoingCallService
 *
 * Injectable service managing ongoing call session state and configuration.
 *
 * ## Overview
 *
 * This service provides a single source of truth for ongoing call state.
 * It manages session ID, call workflow type, call activity status, and
 * optional call settings builder configuration via reactive signals.
 *
 * Call lifecycle methods (`startCall`, `endSession`, `endCall`) manage
 * the full call session lifecycle. The `getCallSettings()` method builds
 * call settings with an attached OngoingCallListener.
 *
 * ## Architecture
 *
 * - **Signals**: Provide synchronous, fine-grained reactivity for call state
 * - **Setters**: Public methods for external configuration of service state
 *
 * ## Usage
 *
 * ```typescript
 * export class MyComponent {
 *   private ongoingCallService = inject(OngoingCallService);
 *
 *   setup(sessionId: string) {
 *     this.ongoingCallService.setSessionID(sessionId);
 *     this.ongoingCallService.setCallWorkflow(CallWorkflow.defaultCalling);
 *   }
 * }
 * ```
 *
 * @Injectable providedIn: 'root'

 */
@Injectable({ providedIn: 'root' })
export class OngoingCallService {
  // ==================== State Signals ====================

  /**
   * The current call session identifier.
   * Set when an ongoing call is initiated.
   * Cleared when the call session ends.
   *
   * @see Requirement 1.1 - Expose sessionID as a writable signal
   */
  private _sessionID = signal<string>('');
  readonly sessionID = this._sessionID.asReadonly();

  /**
   * The call workflow type: defaultCalling or directCalling.
   * Determines how call-end events are handled.
   *
   * @see Requirement 1.1 - Expose callWorkflow as a writable signal
   */
  private _callWorkflow = signal<CallWorkflow>(CallWorkflow.defaultCalling);
  readonly callWorkflow = this._callWorkflow.asReadonly();

  /**
   * Whether a call session is currently active.
   * Set to true when a session starts, false when it ends.
   *
   * @see Requirement 1.1 - Expose isCallActive as a writable signal
   */
  private _isCallActive = signal<boolean>(false);
  readonly isCallActive = this._isCallActive.asReadonly();

  /**
   * Optional custom call settings builder.
   * When null, a default builder is created in `getCallSettings()`.
   *
   * @see Requirement 1.1 - Expose callSettingsBuilder as a writable signal
   */
  private _callSettingsBuilder = signal<typeof CometChatUIKitCalls.CallSettingsBuilder>(null);
  readonly callSettingsBuilder = this._callSettingsBuilder.asReadonly();

  /**
   * Whether the current call is audio-only.
   * Used to set the correct `setIsAudioOnlyCall` flag on the CallSettingsBuilder.
   * Defaults to false (video call).
   */
  private _isAudioOnly = signal<boolean>(false);
  readonly isAudioOnly = this._isAudioOnly.asReadonly();

  // ==================== Public Setters ====================

  /**
   * Sets the current call session ID.
   * @param sessionID - The session identifier string
   *
   * @see Requirement 1.6 - Provide setSessionID() for external configuration
   */
  setSessionID(sessionID: string): void {
    this._sessionID.set(sessionID);
  }

  /**
   * Sets the call workflow type.
   * @param workflow - The CallWorkflow enum value
   *
   * @see Requirement 1.6 - Provide setCallWorkflow() for external configuration
   */
  setCallWorkflow(workflow: CallWorkflow): void {
    this._callWorkflow.set(workflow);
  }

  /**
   * Sets a custom call settings builder.
   * @param builder - The call settings builder object, or null for default
   *
   * @see Requirement 1.6 - Provide setCallSettingsBuilder() for external configuration
   */
  setCallSettingsBuilder(builder: typeof CometChatUIKitCalls.CallSettingsBuilder): void {
    this._callSettingsBuilder.set(builder);
  }

  /**
   * Sets whether the current call is audio-only.
   * @param isAudioOnly - true for voice calls, false for video calls
   */
  setIsAudioOnly(isAudioOnly: boolean): void {
    this._isAudioOnly.set(isAudioOnly);
  }

  // ==================== Call Settings ====================

  /**
   * Builds and returns call settings with the OngoingCallListener attached.
   *
   * When no custom `callSettingsBuilder` is set, creates a default builder
   * with `enableDefaultLayout(true)` and `setIsAudioOnlyCall(false)`.
   * When a custom builder is set via `setCallSettingsBuilder()`, uses it instead.
   *
   * Attaches an `OngoingCallListener` with `onCallEnded`, `onCallEndButtonPressed`,
   * and `onError` callbacks:
   *
   * - `onCallEnded` (defaultCalling): ends session, clears active call, emits ccCallEnded
   * - `onCallEndButtonPressed` (defaultCalling): calls CometChat.endCall(), ends session, emits ccCallEnded
   * - `onCallEndButtonPressed` (directCalling): emits ccCallEnded, ends session
   * - `onError`: wraps error in CometChatException and forwards to error handler
   *
   * @param sessionID - The call session identifier
   * @param onError - Optional error callback
   * @returns The built call settings object
   *
   * @see Requirement 2.1 - onCallEnded: endSession, clearActiveCall, emit ccCallEnded
   * @see Requirement 2.2 - onCallEndButtonPressed (defaultCalling): endCall, endSession, emit ccCallEnded
   * @see Requirement 2.3 - onCallEndButtonPressed (directCalling): emit ccCallEnded, endSession
   * @see Requirement 2.4 - onError: forward to error handler
   * @see Requirement 3.1 - Default builder with enableDefaultLayout(true) and setIsAudioOnlyCall(false)
   * @see Requirement 3.2 - Use custom builder when provided
   * @see Requirement 3.3 - Attach OngoingCallListener before building
   */
  getCallSettings(sessionID: string, onError?: Function): any {
    const customBuilder = this._callSettingsBuilder();

    const callBuilder =
      customBuilder ??
      new CometChatUIKitCalls.CallSettingsBuilder().enableDefaultLayout(true).setIsAudioOnlyCall(this._isAudioOnly());

    callBuilder.setCallListener(
      new CometChatUIKitCalls.OngoingCallListener({
        onCallEnded: () => {
          if (this._callWorkflow() === CallWorkflow.defaultCalling) {
            CometChatUIKitCalls.endSession();
            CometChat.clearActiveCall();
            CometChatCallEvents.ccCallEnded.next(null as any);
          }
          this._isCallActive.set(false);
        },
        onCallEndButtonPressed: () => {
          if (this._callWorkflow() === CallWorkflow.defaultCalling) {
            CometChat.endCall(sessionID)
              .then((call: CometChat.Call) => {
                CometChatUIKitCalls.endSession();
                CometChatCallEvents.ccCallEnded.next(call);
                this._isCallActive.set(false);
              })
              .catch((err: CometChat.CometChatException) => {
                const exception = this.toCometchatException(err, 'onCallEndButtonPressed');
                CometChatLogger.error('OngoingCallService', 'onCallEndButtonPressed:', err);
                if (onError) {
                  onError(exception);
                }
              });
          } else {
            CometChatCallEvents.ccCallEnded.next(null as any);
            CometChatUIKitCalls.endSession();
            this._isCallActive.set(false);
          }
        },
        onError: (error: any) => {
          const exception = this.toCometchatException(error, 'onError');
          CometChatLogger.error('OngoingCallService', 'onError:', error);
          if (onError) {
            onError(exception);
          }
        },
      })
    );

    return callBuilder.build();
  }

  // ==================== Call Lifecycle ====================

  /**
   * Starts an ongoing call session.
   *
   * Retrieves the logged-in user's auth token, generates a call token via
   * `CometChatUIKitCalls.generateToken()`, builds call settings, and starts
   * the session via `CometChatUIKitCalls.startSession()`.
   *
   * Sets `isCallActive` to true on success. On failure, wraps the error
   * in a `CometChatException` and forwards it to the error handler.
   *
   * @param callScreenFrame - The HTML element into which the Calls SDK renders the call UI
   * @param onError - Optional error callback
   * @throws CometChat.CometChatException on SDK error (wrapped and forwarded)
   *
   * @see Requirement 1.2 - Retrieve auth token, generate call token, start session
   * @see Requirement 11.1 - Wrap token generation errors
   * @see Requirement 11.2 - Wrap session start errors
   */
  async startCall(callScreenFrame: HTMLElement, onError?: Function): Promise<void> {
    try {
      // Ensure the Calls SDK is fully initialized before proceeding
      await CometChatUIKit.callingReady;

      const user = await CometChat.getLoggedinUser();
      if (!user) {
        throw new Error('No logged-in user found');
      }

      const authToken = user.getAuthToken();
      const sessionID = this._sessionID();

      const tokenResponse = await CometChatUIKitCalls.generateToken(sessionID, authToken);
      const callToken = tokenResponse.token;

      const callSettings = this.getCallSettings(sessionID, onError);

      CometChatUIKitCalls.startSession(callToken, callSettings, callScreenFrame);

      this._isCallActive.set(true);
    } catch (error) {
      const exception = this.toCometchatException(error, 'startCall');
      CometChatLogger.error('OngoingCallService', 'startCall:', error);
      if (onError) {
        onError(exception);
      }
      throw exception;
    }
  }

  // ==================== Session End ====================

  /**
   * Ends the current call session.
   *
   * Calls `CometChatUIKitCalls.endSession()` to tear down the Calls SDK session,
   * sets `isCallActive` to false, and resets the `sessionID` signal.
   *
   * This is a synchronous cleanup method — it does NOT call `CometChat.endCall()`
   * or emit any events. Use `endCall()` for full call termination with events.
   *
   * @see Requirement 1.3 - Call endSession(), set isCallActive to false
   */
  endSession(): void {
    CometChatUIKitCalls.endSession();
    this._isCallActive.set(false);
    this._sessionID.set('');
  }

  /**
   * Ends the current call and cleans up the session.
   *
   * Behavior depends on the current `callWorkflow`:
   *
   * - **defaultCalling**: Calls `CometChat.endCall(sessionID)` to end the call
   *   on the server, then calls `endSession()` for local cleanup, then emits
   *   `CometChatCallEvents.ccCallEnded` with the ended call object.
   *
   * - **directCalling**: Emits `CometChatCallEvents.ccCallEnded` first, then
   *   calls `endSession()` for local cleanup. No server-side `endCall()` is needed.
   *
   * Errors from `CometChat.endCall()` are wrapped in `CometChatException` and
   * forwarded to the optional error handler.
   *
   * @param onError - Optional error callback
   * @throws CometChat.CometChatException on SDK error (wrapped and forwarded)
   *
   * @see Requirement 1.4 - defaultCalling: endCall → endSession → emit ccCallEnded
   * @see Requirement 1.5 - directCalling: emit ccCallEnded → endSession
   * @see Requirement 11.3 - Wrap and forward CometChat.endCall() errors
   */
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
        if (onError) {
          onError(exception);
        }
        throw exception;
      }
    } else {
      CometChatCallEvents.ccCallEnded.next({} as CometChat.Call);
      this.endSession();
    }
  }

  // ==================== Error Handling ====================

  /**
   * Converts an unknown error to a CometChatException.
   *
   * If the error is already a CometChatException, returns it as-is.
   * Otherwise wraps it with the `ONGOING_CALL_ERROR` code.
   *
   * @param error - The error to convert
   * @param context - Context string describing where the error occurred
   * @returns CometChat.CometChatException
   * @private
   */
  private toCometchatException(error: unknown, context: string): CometChat.CometChatException {
    if (error instanceof CometChat.CometChatException) {
      return error;
    }

    if (error instanceof Error) {
      return new CometChat.CometChatException({
        code: 'ONGOING_CALL_ERROR',
        message: `${context}: ${error.message}`,
        details: error.stack || '',
      });
    }

    let errorMessage: string;
    try {
      errorMessage = String(error);
    } catch {
      errorMessage = '[non-stringifiable error]';
    }

    return new CometChat.CometChatException({
      code: 'ONGOING_CALL_ERROR',
      message: `${context}: ${errorMessage}`,
      details: '',
    });
  }
}
