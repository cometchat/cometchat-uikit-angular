/**
 * Utility helpers for MessageHeaderService.
 * Contains error handling, retry logic, and typing-user map helpers.
 */

import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatLogger } from '../utils/CometChatLogger';
import type { ErrorCallback } from './message-header.types';

// ─── Error Helpers ────────────────────────────────────────────────────────────

export function toCometchatException(error: unknown, context: string): CometChat.CometChatException {
  if (error instanceof CometChat.CometChatException) return error;
  if (error instanceof Error) {
    return new CometChat.CometChatException({
      code: 'SERVICE_ERROR',
      message: `${context}: ${error.message}`,
      details: error.stack || '',
    });
  }
  return new CometChat.CometChatException({
    code: 'UNKNOWN_ERROR',
    message: `${context}: ${String(error)}`,
    details: '',
  });
}

export function handleServiceError(
  error: unknown,
  context: string,
  errorCallback: ErrorCallback | null
): void {
  CometChatLogger.error('MessageHeaderService', `${context}:`, error);
  if (errorCallback) {
    errorCallback(toCometchatException(error, context));
  }
}

export function isRecoverableError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  const code =
    error instanceof CometChat.CometChatException ? String(error.code || '').toLowerCase() : '';
  const patterns = [
    'network', 'timeout', 'connection', 'econnrefused',
    'enotfound', 'socket', 'websocket', 'err_network', 'err_connection',
  ] as const;
  return patterns.some(p => msg.includes(p) || code.includes(p));
}

export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  context: string,
  errorCallback: ErrorCallback | null,
  maxRetries = 3,
  retryDelayMs = 1000
): Promise<T | null> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (!isRecoverableError(error) || attempt === maxRetries) {
        handleServiceError(error, context, errorCallback);
        return null;
      }
      CometChatLogger.warn(
        'MessageHeaderService',
        `${context} failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying...`
      );
      await delay(retryDelayMs * Math.pow(2, attempt));
    }
  }
  handleServiceError(lastError, context, errorCallback);
  return null;
}

// ─── Typing Users Map Helpers ─────────────────────────────────────────────────

export interface TypingUserEntry {
  user: CometChat.User;
  timestamp: number;
}

export function addTypingUser(
  map: Map<string, TypingUserEntry>,
  userId: string,
  user: CometChat.User
): void {
  map.set(userId, { user, timestamp: Date.now() });
}

export function removeTypingUserFromMap(
  map: Map<string, TypingUserEntry>,
  userId: string
): boolean {
  return map.delete(userId);
}

export function getTypingUsersArray(map: Map<string, TypingUserEntry>): CometChat.User[] {
  return Array.from(map.values()).map(e => e.user);
}

// ─── Typing Relevance Check ───────────────────────────────────────────────────

export function isTypingEventRelevant(
  typingIndicator: CometChat.TypingIndicator,
  entityId: string,
  entityType: 'user' | 'group'
): boolean {
  const receiverId = typingIndicator.getReceiverId();
  const receiverType = typingIndicator.getReceiverType();
  const senderId = typingIndicator.getSender()?.getUid();

  if (entityType === 'user') {
    return senderId === entityId;
  }
  return receiverType === CometChat.RECEIVER_TYPE.GROUP && receiverId === entityId;
}
