/**
 * Which failures count as "you hit the pin/save cap".
 *
 * Quoting the cap for every failure is worse than saying nothing: the user is
 * told to unpin a message to make room when the pin actually failed for an
 * unrelated reason, so the advice cannot work and the real cause is buried.
 */
import { describe, it, expect } from 'vitest';
import { isLimitError } from './pin-save-utils';

const withMessage = (message: string) => ({ code: 'ERR_SOMETHING', message });

describe('isLimitError', () => {
  describe('recognises a cap', () => {
    it('by error code', () => {
      expect(isLimitError({ code: 'ERR_PIN_LIMIT_REACHED' })).toBe(true);
      expect(isLimitError({ code: 'ERR_MAX_PINNED_MESSAGES' })).toBe(true);
      expect(isLimitError({ code: 'ERR_LIMIT_EXCEEDED' })).toBe(true);
    });

    it('by the wording the server sends', () => {
      expect(isLimitError(withMessage('You can only pin 10 messages. Unpin one to pin another.'))).toBe(true);
      expect(isLimitError(withMessage('This conversation has reached the allowed limit of 5.'))).toBe(true);
      expect(isLimitError(withMessage('You may save a maximum of 25 messages.'))).toBe(true);
      expect(isLimitError(withMessage('Pin limit exceeded'))).toBe(true);
    });

    it('by devMessage when message says nothing', () => {
      expect(isLimitError({ code: 'X', devMessage: 'pinned message limit reached' })).toBe(true);
    });
  });

  describe('refuses everything else', () => {
    it('a missing message', () => {
      expect(isLimitError(withMessage('Message not found: 76019'))).toBe(false);
    });

    it('a network failure', () => {
      expect(isLimitError(withMessage('Network request failed'))).toBe(false);
    });

    it('an internal error with no useful text', () => {
      expect(isLimitError({ code: 'ERR_INTERNAL_SERVER_ERROR' })).toBe(false);
    });

    it('nothing at all', () => {
      expect(isLimitError(null)).toBe(false);
      expect(isLimitError(undefined)).toBe(false);
      expect(isLimitError({})).toBe(false);
    });
  });
});
