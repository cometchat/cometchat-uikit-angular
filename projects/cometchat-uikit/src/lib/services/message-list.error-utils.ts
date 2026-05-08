/**
 * Error handling utilities for MessageListService.
 *
 * Extracted from message-list.service.ts to keep error classification,
 * user-friendly message generation, and retry logic in a focused module.
 */

import { CometChat } from '@cometchat/chat-sdk-javascript';

// ==================== Error Classification ====================

/**
 * Determines whether an error is recoverable (worth retrying).
 *
 * Recoverable errors are transient network/server issues that may resolve
 * on their own. Non-recoverable errors are permanent failures (auth, not found, etc.)
 * that should not be retried.
 */
export function isRecoverableError(error: unknown): boolean {
  if (!error) return false;

  // CometChat SDK errors
  if (error instanceof Object && 'code' in error) {
    const code = String((error as { code: unknown }).code);
    return isRecoverableErrorCode(code);
  }

  // Standard JS errors — check message
  if (error instanceof Error) {
    return isRecoverableErrorMessage(error.message);
  }

  // String errors
  if (typeof error === 'string') {
    return isRecoverableErrorMessage(error);
  }

  return false;
}

/**
 * Checks if a CometChat error code indicates a recoverable error.
 */
function isRecoverableErrorCode(code: string): boolean {
  const recoverableCodes = new Set([
    'ERR_INTERNET_DISCONNECTED',
    'ERR_NETWORK_CHANGED',
    'ERR_CONNECTION_RESET',
    'ERR_CONNECTION_REFUSED',
    'ERR_CONNECTION_TIMED_OUT',
    'ERR_TIMED_OUT',
    'ERR_SOCKET_NOT_CONNECTED',
    'NETWORK_ERROR',
    'TIMEOUT',
    'SERVICE_UNAVAILABLE',
    '503',
    '504',
    '429', // Rate limiting — retry after backoff
  ]);
  return recoverableCodes.has(code);
}

/**
 * Checks if an error message string indicates a recoverable error.
 */
export function isRecoverableErrorMessage(message: string): boolean {
  if (!message) return false;
  const lower = message.toLowerCase();
  const recoverablePatterns = [
    'network',
    'timeout',
    'timed out',
    'connection',
    'disconnected',
    'socket',
    'service unavailable',
    'too many requests',
    'rate limit',
    'temporarily unavailable',
    'try again',
    'retry',
  ];
  return recoverablePatterns.some(pattern => lower.includes(pattern));
}

/**
 * Checks if an error is retryable (subset of recoverable — used for receipt operations).
 */
export function isRetryableError(error: unknown): boolean {
  return isRecoverableError(error);
}

// ==================== User-Friendly Error Messages ====================

/**
 * Converts a raw error into a user-friendly message string.
 *
 * @param error - The error to convert
 * @param context - Human-readable context (e.g., "fetching messages")
 */
export function getUserFriendlyErrorMessage(error: unknown, context: string): string {
  if (!error) return `An error occurred while ${context}.`;

  const errorString = extractErrorString(error);
  return getMessageFromErrorString(errorString, context);
}

/**
 * Extracts a string representation from any error type.
 */
function extractErrorString(error: unknown): string {
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;
  if (error instanceof Object) {
    if ('message' in error) return String((error as { message: unknown }).message);
    if ('details' in error) return String((error as { details: unknown }).details);
    if ('code' in error) return String((error as { code: unknown }).code);
  }
  return String(error);
}

/**
 * Maps an error string to a user-friendly message.
 */
function getMessageFromErrorString(errorString: string, context: string): string {
  const lower = errorString.toLowerCase();

  if (lower.includes('network') || lower.includes('internet') || lower.includes('disconnected')) {
    return 'No internet connection. Please check your network and try again.';
  }
  if (lower.includes('timeout') || lower.includes('timed out')) {
    return 'The request timed out. Please try again.';
  }
  if (lower.includes('unauthorized') || lower.includes('auth') || lower.includes('403')) {
    return 'You are not authorized to perform this action.';
  }
  if (lower.includes('not found') || lower.includes('404')) {
    return 'The requested resource was not found.';
  }
  if (lower.includes('rate limit') || lower.includes('too many requests') || lower.includes('429')) {
    return 'Too many requests. Please wait a moment and try again.';
  }
  if (lower.includes('service unavailable') || lower.includes('503')) {
    return 'The service is temporarily unavailable. Please try again later.';
  }

  return `An error occurred while ${context}. Please try again.`;
}

// ==================== Retry Delay Utilities ====================

/**
 * Returns the retry delay for a given attempt index using exponential backoff.
 *
 * @param attempt - Zero-based attempt index
 * @param delays - Array of delay values in ms (defaults to [1000, 2000, 4000])
 */
export function getRetryDelay(
  attempt: number,
  delays: readonly number[] = [1000, 2000, 4000]
): number {
  return delays[Math.min(attempt, delays.length - 1)];
}

/**
 * Creates a promise that resolves after the specified delay.
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
