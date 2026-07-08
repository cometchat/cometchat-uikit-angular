/**
 * message-list.error-utils Tests
 *
 * Covers: isRecoverableError, isRecoverableErrorMessage, isRetryableError,
 *         getUserFriendlyErrorMessage, getRetryDelay, delay.
 *
 * @module services/message-list.error-utils
 */

import { describe, it, expect, vi } from 'vitest';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import {
  isRecoverableError,
  isRecoverableErrorMessage,
  isRetryableError,
  getUserFriendlyErrorMessage,
  getRetryDelay,
  delay,
} from './message-list.error-utils';

describe('message-list.error-utils', () => {

  // ==================== isRecoverableError ====================

  describe('isRecoverableError', () => {
    it('should return false for null/undefined', () => {
      expect(isRecoverableError(null)).toBe(false);
      expect(isRecoverableError(undefined)).toBe(false);
    });

    it('should return true for network error codes', () => {
      expect(isRecoverableError({ code: 'ERR_INTERNET_DISCONNECTED' })).toBe(true);
      expect(isRecoverableError({ code: 'ERR_NETWORK_CHANGED' })).toBe(true);
      expect(isRecoverableError({ code: 'ERR_CONNECTION_RESET' })).toBe(true);
      expect(isRecoverableError({ code: 'ERR_CONNECTION_REFUSED' })).toBe(true);
      expect(isRecoverableError({ code: 'ERR_CONNECTION_TIMED_OUT' })).toBe(true);
      expect(isRecoverableError({ code: 'ERR_TIMED_OUT' })).toBe(true);
      expect(isRecoverableError({ code: 'NETWORK_ERROR' })).toBe(true);
      expect(isRecoverableError({ code: 'TIMEOUT' })).toBe(true);
      expect(isRecoverableError({ code: 'SERVICE_UNAVAILABLE' })).toBe(true);
      expect(isRecoverableError({ code: '503' })).toBe(true);
      expect(isRecoverableError({ code: '504' })).toBe(true);
      expect(isRecoverableError({ code: '429' })).toBe(true);
    });

    it('should return false for non-recoverable error codes', () => {
      expect(isRecoverableError({ code: '401' })).toBe(false);
      expect(isRecoverableError({ code: '403' })).toBe(false);
      expect(isRecoverableError({ code: '404' })).toBe(false);
      expect(isRecoverableError({ code: 'AUTH_ERROR' })).toBe(false);
    });

    it('should return true for Error with recoverable message', () => {
      expect(isRecoverableError(new Error('network timeout occurred'))).toBe(true);
      expect(isRecoverableError(new Error('connection refused'))).toBe(true);
      expect(isRecoverableError(new Error('request timed out'))).toBe(true);
    });

    it('should return false for Error with non-recoverable message', () => {
      expect(isRecoverableError(new Error('unauthorized access'))).toBe(false);
      expect(isRecoverableError(new Error('not found'))).toBe(false);
    });

    it('should return true for recoverable string errors', () => {
      expect(isRecoverableError('network error')).toBe(true);
      expect(isRecoverableError('connection timeout')).toBe(true);
    });

    it('should return false for non-recoverable string errors', () => {
      expect(isRecoverableError('invalid credentials')).toBe(false);
    });

    it('should return false for unknown object types', () => {
      expect(isRecoverableError(42)).toBe(false);
      expect(isRecoverableError({})).toBe(false);
    });
  });

  // ==================== isRecoverableErrorMessage ====================

  describe('isRecoverableErrorMessage', () => {
    it('should return false for empty string', () => {
      expect(isRecoverableErrorMessage('')).toBe(false);
    });

    it('should return true for messages containing recoverable patterns', () => {
      expect(isRecoverableErrorMessage('network failure')).toBe(true);
      expect(isRecoverableErrorMessage('request timeout')).toBe(true);
      expect(isRecoverableErrorMessage('timed out waiting')).toBe(true);
      expect(isRecoverableErrorMessage('connection reset')).toBe(true);
      expect(isRecoverableErrorMessage('disconnected from server')).toBe(true);
      expect(isRecoverableErrorMessage('socket closed')).toBe(true);
      expect(isRecoverableErrorMessage('service unavailable')).toBe(true);
      expect(isRecoverableErrorMessage('too many requests')).toBe(true);
      expect(isRecoverableErrorMessage('rate limit exceeded')).toBe(true);
      expect(isRecoverableErrorMessage('temporarily unavailable')).toBe(true);
      expect(isRecoverableErrorMessage('please try again')).toBe(true);
      expect(isRecoverableErrorMessage('retry after 5 seconds')).toBe(true);
    });

    it('should be case-insensitive', () => {
      expect(isRecoverableErrorMessage('NETWORK ERROR')).toBe(true);
      expect(isRecoverableErrorMessage('TIMEOUT')).toBe(true);
    });

    it('should return false for non-recoverable messages', () => {
      expect(isRecoverableErrorMessage('invalid token')).toBe(false);
      expect(isRecoverableErrorMessage('user not found')).toBe(false);
      expect(isRecoverableErrorMessage('permission denied')).toBe(false);
    });
  });

  // ==================== isRetryableError ====================

  describe('isRetryableError', () => {
    it('should return true for recoverable errors', () => {
      expect(isRetryableError({ code: 'NETWORK_ERROR' })).toBe(true);
      expect(isRetryableError(new Error('network timeout'))).toBe(true);
    });

    it('should return false for non-recoverable errors', () => {
      expect(isRetryableError({ code: '401' })).toBe(false);
      expect(isRetryableError(null)).toBe(false);
    });
  });

  // ==================== getUserFriendlyErrorMessage ====================

  describe('getUserFriendlyErrorMessage', () => {
    it('should return generic message for null error', () => {
      const msg = getUserFriendlyErrorMessage(null, 'fetching messages');
      expect(msg).toContain('fetching messages');
    });

    it('should return network message for network errors', () => {
      const msg = getUserFriendlyErrorMessage(new Error('network disconnected'), 'loading');
      expect(msg.toLowerCase()).toContain('internet');
    });

    it('should return timeout message for timeout errors', () => {
      const msg = getUserFriendlyErrorMessage(new Error('request timed out'), 'loading');
      expect(msg.toLowerCase()).toContain('timed out');
    });

    it('should return unauthorized message for auth errors', () => {
      const msg = getUserFriendlyErrorMessage(new Error('unauthorized'), 'loading');
      expect(msg.toLowerCase()).toContain('not authorized');
    });

    it('should return not found message for 404 errors', () => {
      const msg = getUserFriendlyErrorMessage(new Error('not found'), 'loading');
      expect(msg.toLowerCase()).toContain('not found');
    });

    it('should return rate limit message for 429 errors', () => {
      const msg = getUserFriendlyErrorMessage(new Error('too many requests'), 'loading');
      expect(msg.toLowerCase()).toContain('too many requests');
    });

    it('should return service unavailable message for 503 errors', () => {
      const msg = getUserFriendlyErrorMessage(new Error('service unavailable'), 'loading');
      expect(msg.toLowerCase()).toContain('unavailable');
    });

    it('should return generic message for unknown errors', () => {
      const msg = getUserFriendlyErrorMessage(new Error('something weird'), 'sending message');
      expect(msg).toContain('sending message');
    });

    it('should handle string errors', () => {
      const msg = getUserFriendlyErrorMessage('network error', 'loading');
      expect(msg.toLowerCase()).toContain('internet');
    });

    it('should handle CometChat exception objects with message field', () => {
      const err = { message: 'network failure', code: 'NET_ERR' };
      const msg = getUserFriendlyErrorMessage(err, 'loading');
      expect(msg.toLowerCase()).toContain('internet');
    });

    it('should handle objects with code field', () => {
      const err = { code: 'UNKNOWN_CODE' };
      const msg = getUserFriendlyErrorMessage(err, 'loading');
      expect(msg).toContain('loading');
    });

    it('should handle objects with details field', () => {
      const err = { details: 'timeout occurred' };
      const msg = getUserFriendlyErrorMessage(err, 'loading');
      expect(msg.toLowerCase()).toContain('timed out');
    });
  });

  // ==================== getRetryDelay ====================

  describe('getRetryDelay', () => {
    it('should return first delay for attempt 0', () => {
      expect(getRetryDelay(0)).toBe(1000);
    });

    it('should return second delay for attempt 1', () => {
      expect(getRetryDelay(1)).toBe(2000);
    });

    it('should return third delay for attempt 2', () => {
      expect(getRetryDelay(2)).toBe(4000);
    });

    it('should clamp to last delay for attempts beyond array length', () => {
      expect(getRetryDelay(3)).toBe(4000);
      expect(getRetryDelay(10)).toBe(4000);
      expect(getRetryDelay(100)).toBe(4000);
    });

    it('should use custom delays array when provided', () => {
      const customDelays = [500, 1000, 2000, 5000] as const;
      expect(getRetryDelay(0, customDelays)).toBe(500);
      expect(getRetryDelay(1, customDelays)).toBe(1000);
      expect(getRetryDelay(3, customDelays)).toBe(5000);
      expect(getRetryDelay(10, customDelays)).toBe(5000);
    });
  });

  // ==================== delay ====================

  describe('delay', () => {
    it('should resolve after the specified time', async () => {
      vi.useFakeTimers();
      const promise = delay(1000);
      vi.advanceTimersByTime(1000);
      await promise;
      vi.useRealTimers();
    });

    it('should resolve immediately for 0ms delay', async () => {
      vi.useFakeTimers();
      const promise = delay(0);
      vi.advanceTimersByTime(0);
      await promise;
      vi.useRealTimers();
    });

    it('should return a Promise', () => {
      vi.useFakeTimers();
      const result = delay(100);
      expect(result).toBeInstanceOf(Promise);
      vi.advanceTimersByTime(100);
      vi.useRealTimers();
    });
  });
});
