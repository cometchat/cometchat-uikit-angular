/**
 * Shared Call Error Handler
 *
 * Extracted from cometchat-call-buttons, cometchat-incoming-call,
 * cometchat-outgoing-call, and cometchat-ongoing-call to consolidate
 * duplicate error handling logic (~21-23 shared lines per component).
 *
 * All four components follow the same pattern:
 * 1. Normalize the error to CometChatException
 * 2. Emit via EventEmitter
 * 3. Call onError callback if provided
 * 4. Log the error
 */

import { EventEmitter } from '@angular/core';
import { CometChat } from '@cometchat/chat-sdk-javascript';

/**
 * Normalizes an unknown error into a CometChat.CometChatException,
 * emits it via the provided EventEmitter, calls the optional onError callback,
 * and logs the error.
 *
 * @param err - The unknown error to handle
 * @param errorCode - Component-specific error code (e.g. 'CALL_BUTTONS_ERROR')
 * @param logPrefix - Prefix for console error messages (e.g. 'CometChatCallButtons')
 * @param errorEmitter - The component's error EventEmitter
 * @param onError - Optional error callback from component input
 */
export function handleCallError(
  err: unknown,
  errorCode: string,
  logPrefix: string,
  errorEmitter: EventEmitter<CometChat.CometChatException>,
  onError?: ((error: CometChat.CometChatException) => void) | null
): void {
  let exception: CometChat.CometChatException;

  if (err instanceof CometChat.CometChatException) {
    exception = err;
  } else if (err instanceof Error) {
    exception = new CometChat.CometChatException({
      code: errorCode,
      message: err.message,
      details: err.stack || '',
    });
  } else {
    exception = new CometChat.CometChatException({
      code: errorCode,
      message: String(err),
      details: '',
    });
  }

  errorEmitter.emit(exception);

  if (onError) {
    onError(exception);
  }

  console.error(`[${logPrefix}] Error:`, err);
}
