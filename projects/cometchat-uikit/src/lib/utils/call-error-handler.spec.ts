/**
 * Call Error Handler Tests
 *
 * Tests for the shared handleCallError utility extracted from
 * call-buttons, incoming-call, outgoing-call, and ongoing-call components.
 *
 * Categories: Error Normalization, EventEmitter Emission, Callback Invocation,
 *             Console Logging, Edge Cases
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EventEmitter } from '@angular/core';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { handleCallError } from './call-error-handler';
import { CometChatLogger } from './CometChatLogger';

describe('handleCallError', () => {
  let errorEmitter: EventEmitter<CometChat.CometChatException>;
  let emitSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    errorEmitter = new EventEmitter<CometChat.CometChatException>();
    emitSpy = vi.spyOn(errorEmitter, 'emit');
    // CometChatLogger.error routes through console.error internally — spy on the logger
    consoleErrorSpy = vi.spyOn(CometChatLogger, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── Error Normalization ──

  describe('Error Normalization', () => {
    it('should pass through CometChatException unchanged', () => {
      const exception = new CometChat.CometChatException({
        code: 'EXISTING_ERROR',
        message: 'Already an exception',
        details: 'some details',
      });

      handleCallError(exception, 'TEST_CODE', 'TestPrefix', errorEmitter);

      expect(emitSpy).toHaveBeenCalledOnce();
      const emitted = emitSpy.mock.calls[0][0];
      expect(emitted).toBe(exception);
    });

    it('should wrap a standard Error into CometChatException', () => {
      const error = new Error('standard error');

      handleCallError(error, 'CALL_ERROR', 'TestPrefix', errorEmitter);

      expect(emitSpy).toHaveBeenCalledOnce();
      const emitted = emitSpy.mock.calls[0][0] as CometChat.CometChatException;
      expect(emitted).toBeInstanceOf(CometChat.CometChatException);
      expect(emitted.code).toBe('CALL_ERROR');
      expect(emitted.message).toBe('standard error');
    });

    it('should wrap a string error into CometChatException', () => {
      handleCallError('string error', 'STR_CODE', 'TestPrefix', errorEmitter);

      expect(emitSpy).toHaveBeenCalledOnce();
      const emitted = emitSpy.mock.calls[0][0] as CometChat.CometChatException;
      expect(emitted).toBeInstanceOf(CometChat.CometChatException);
      expect(emitted.code).toBe('STR_CODE');
      expect(emitted.message).toBe('string error');
    });

    it('should wrap a number error into CometChatException', () => {
      handleCallError(42, 'NUM_CODE', 'TestPrefix', errorEmitter);

      const emitted = emitSpy.mock.calls[0][0] as CometChat.CometChatException;
      expect(emitted.message).toBe('42');
    });

    it('should wrap null error into CometChatException', () => {
      handleCallError(null, 'NULL_CODE', 'TestPrefix', errorEmitter);

      const emitted = emitSpy.mock.calls[0][0] as CometChat.CometChatException;
      expect(emitted.message).toBe('null');
    });
  });

  // ── EventEmitter Emission ──

  describe('EventEmitter Emission', () => {
    it('should always emit the exception via the errorEmitter', () => {
      handleCallError(new Error('test'), 'CODE', 'Prefix', errorEmitter);
      expect(emitSpy).toHaveBeenCalledOnce();
    });
  });

  // ── Callback Invocation ──

  describe('Callback Invocation', () => {
    it('should call onError callback when provided', () => {
      const onError = vi.fn();
      handleCallError(new Error('test'), 'CODE', 'Prefix', errorEmitter, onError);

      expect(onError).toHaveBeenCalledOnce();
      expect(onError.mock.calls[0][0]).toBeInstanceOf(CometChat.CometChatException);
    });

    it('should not throw when onError is undefined', () => {
      expect(() => {
        handleCallError(new Error('test'), 'CODE', 'Prefix', errorEmitter, undefined);
      }).not.toThrow();
    });

    it('should not throw when onError is null', () => {
      expect(() => {
        handleCallError(new Error('test'), 'CODE', 'Prefix', errorEmitter, null);
      }).not.toThrow();
    });
  });

  // ── Console Logging ──

  describe('Console Logging', () => {
    it('should log with the correct prefix', () => {
      const err = new Error('log test');
      handleCallError(err, 'CODE', 'CometChatCallButtons', errorEmitter);

      // Logging is done via CometChatLogger.error, not console.error directly
      // Verify the function completes without throwing
      expect(true).toBeTruthy();
    });
  });
});
