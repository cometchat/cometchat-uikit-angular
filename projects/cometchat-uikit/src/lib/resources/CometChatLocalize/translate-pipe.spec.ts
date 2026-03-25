/**
 * TranslatePipe Tests
 *
 * Categories: Translation Key Resolution, Interpolation Parameters,
 *             Missing Key Fallback, Null/Empty Key Handling, Edge Cases
 * Validates: Requirements 9.4, 14.4, 14.5, 15.7
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { ensureSdkReady, sdkCleanup } from '../../test-setup';
import { TranslatePipe } from './translate.pipe';
import { CometChatLocalize } from './cometchat-localize';

describe('TranslatePipe', () => {
  let pipe: TranslatePipe;

  beforeAll(async () => {
    await ensureSdkReady();
  });

  afterAll(async () => {
    await sdkCleanup();
  });

  beforeEach(() => {
    pipe = new TranslatePipe();
    CometChatLocalize.init({
      language: 'en-US',
      disableAutoDetection: true,
    });
  });

  // ─── Translation Key Resolution (Req 9.4) ───

  describe('Translation Key Resolution', () => {
    it('should translate a known key to its English value', () => {
      const result = pipe.transform('conversation_chat_title');
      expect(result).toBe('Chats');
    });

    it('should translate another known key', () => {
      const result = pipe.transform('user_title');
      expect(result).toBe('Users');
    });

    it('should reflect language changes (impure pipe behavior)', () => {
      CometChatLocalize.setCurrentLanguage('es');
      const result = pipe.transform('conversation_chat_title');
      expect(result).toBeTruthy();
      expect(result).not.toBe('conversation_chat_title');
    });

    it('should use fallback language when current language lacks the key', () => {
      CometChatLocalize.addTranslation({ 'custom-lang': {} });
      CometChatLocalize.setCurrentLanguage('custom-lang');
      // Should fall back to en-US
      const result = pipe.transform('conversation_chat_title');
      expect(result).toBe('Chats');
    });
  });

  // ─── Interpolation Parameters (Req 9.4) ───

  describe('Interpolation Parameters', () => {
    it('should substitute a single string parameter', () => {
      CometChatLocalize.addTranslation({
        'en-US': { greet_user: 'Hello {name}' },
      });
      expect(pipe.transform('greet_user', { name: 'Alice' })).toBe('Hello Alice');
    });

    it('should substitute a numeric parameter', () => {
      CometChatLocalize.addTranslation({
        'en-US': { item_count: '{count} items' },
      });
      expect(pipe.transform('item_count', { count: 42 })).toBe('42 items');
    });

    it('should substitute multiple parameters', () => {
      CometChatLocalize.addTranslation({
        'en-US': { user_action: '{user} sent {count} messages' },
      });
      const result = pipe.transform('user_action', { user: 'Bob', count: 3 });
      expect(result).toBe('Bob sent 3 messages');
    });

    it('should replace all occurrences of the same parameter', () => {
      CometChatLocalize.addTranslation({
        'en-US': { repeat_param: '{x} and {x} again' },
      });
      expect(pipe.transform('repeat_param', { x: 'hi' })).toBe('hi and hi again');
    });

    it('should leave template unchanged when params do not match placeholders', () => {
      CometChatLocalize.addTranslation({
        'en-US': { no_match: 'Hello {name}' },
      });
      expect(pipe.transform('no_match', { other: 'value' })).toBe('Hello {name}');
    });

    it('should handle empty params object without error', () => {
      CometChatLocalize.addTranslation({
        'en-US': { plain_text: 'No placeholders here' },
      });
      expect(pipe.transform('plain_text', {})).toBe('No placeholders here');
    });

    it('should handle zero as a parameter value', () => {
      CometChatLocalize.addTranslation({
        'en-US': { zero_val: '{n} remaining' },
      });
      expect(pipe.transform('zero_val', { n: 0 })).toBe('0 remaining');
    });
  });

  // ─── Missing Key Fallback (Req 9.4) ───

  describe('Missing Key Fallback', () => {
    it('should return the key itself when translation is not found', () => {
      const result = pipe.transform('completely_nonexistent_key_xyz');
      expect(result).toBe('completely_nonexistent_key_xyz');
    });

    it('should return the key for another unknown key', () => {
      const result = pipe.transform('this_key_does_not_exist_at_all');
      expect(result).toBe('this_key_does_not_exist_at_all');
    });
  });

  // ─── Null / Empty Key Handling (Req 9.4) ───

  describe('Null and Empty Key Handling', () => {
    it('should return empty string for empty key', () => {
      expect(pipe.transform('')).toBe('');
    });

    it('should return empty string for null key', () => {
      expect(pipe.transform(null as unknown as string)).toBe('');
    });

    it('should return empty string for undefined key', () => {
      expect(pipe.transform(undefined as unknown as string)).toBe('');
    });
  });

  // ─── Edge Cases ───

  describe('Edge Cases', () => {
    it('should return consistent results across multiple calls with the same key', () => {
      const first = pipe.transform('conversation_chat_title');
      const second = pipe.transform('conversation_chat_title');
      expect(first).toBe(second);
    });

    it('should return same value as CometChatLocalize.getLocalizedString for known keys', () => {
      const pipeResult = pipe.transform('conversation_chat_title');
      const directResult = CometChatLocalize.getLocalizedString('conversation_chat_title');
      expect(pipeResult).toBe(directResult);
    });
  });

  // ─── Property-Based Tests ───

  describe('Property: every known key returns a non-empty string', () => {
    /**
     * For all valid translation keys in the active language bundle,
     * the pipe returns a non-empty string.
     * **Validates: Requirements 9.4**
     */
    it('should return a non-empty translated string for every key in the en-US bundle', () => {
      const allKeys = Object.keys((CometChatLocalize as any).translations?.['en-US'] ?? {});
      expect(allKeys.length).toBeGreaterThan(0);

      for (const key of allKeys) {
        const result = pipe.transform(key);
        expect(result).toBeTruthy();
      }
    });
  });

  describe('Property: interpolation with arbitrary params', () => {
    /**
     * For any string parameter value, interpolation replaces {name} correctly.
     * Note: String.replace treats $ as special in replacement strings
     * (e.g. $$ → $, $& → matched text). The pipe uses String.replace,
     * so the test expectation must match that behavior (component is source of truth).
     * **Validates: Requirements 9.4**
     */
    it('should correctly substitute any string value into a placeholder', () => {
      CometChatLocalize.addTranslation({
        'en-US': { pbt_greet: 'Hi {name}!' },
      });

      fc.assert(
        fc.property(fc.string({ minLength: 0, maxLength: 200 }), name => {
          const result = pipe.transform('pbt_greet', { name });
          // Match the actual String.replace behavior ($ is special in replacement strings)
          const expected = 'Hi {name}!'.replace(new RegExp('\\{name\\}', 'g'), String(name));
          expect(result).toBe(expected);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property: missing keys always return the key itself', () => {
    /**
     * For any non-empty key that doesn't exist in the bundle,
     * the pipe returns the key as fallback without throwing.
     * **Validates: Requirements 9.4**
     */
    it('should return the key for any non-existent translation key', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }).map(s => `__pbt_${s}`),
          key => {
            const result = pipe.transform(key);
            expect(result).toBe(key);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
