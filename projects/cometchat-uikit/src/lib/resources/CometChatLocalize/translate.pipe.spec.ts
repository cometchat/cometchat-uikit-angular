/**
 * TranslatePipe Tests
 *
 * Spec for the translate pipe that provides localized string
 * lookup via CometChatLocalize with optional parameter interpolation.
 *
 * Uses mock utilities from testing/ — no inline mocks.
 *
 * Validates: Requirements 8.1, 8.2, 8.9, 9.4
 *
 * @module resources/CometChatLocalize/translate.pipe
 */
import * as fc from 'fast-check';
import { TranslatePipe } from './translate.pipe';
import { CometChatLocalize } from './cometchat-localize';
import translationENUS from './resources/en-us/translation.json';

describe('TranslatePipe', () => {
  let pipe: TranslatePipe;

  beforeEach(() => {
    pipe = new TranslatePipe();
    CometChatLocalize.init({ language: 'en-US', disableAutoDetection: true });
    CometChatLocalize.addTranslation({
      'en-US': {
        tp_spec_single: 'Add {n} Members',
        tp_spec_multi: '{name} has {count} new messages from {name}',
        tp_spec_plain: 'Plain text {untouched}',
        'tp.spec-key_with.special-chars': 'Special OK',
      },
    });
  });

  // -------------------------------------------------------------------------
  // Default Render
  // -------------------------------------------------------------------------
  describe('Default behavior', () => {
    it('should create the pipe', () => {
      expect(pipe).toBeTruthy();
    });

    it('should return a translated string for a known key', () => {
      // Built-in en-US bundle value
      expect(pipe.transform('conversation_chat_title')).toBe('Chats');
    });

    it('should return the same value as CometChatLocalize.getLocalizedString, stable across calls', () => {
      const direct = CometChatLocalize.getLocalizedString('conversation_chat_title');
      expect(pipe.transform('conversation_chat_title')).toBe(direct);
      expect(pipe.transform('conversation_chat_title')).toBe(direct);
    });
  });

  // -------------------------------------------------------------------------
  // Language switching / fallback
  // -------------------------------------------------------------------------
  describe('Language resolution', () => {
    it('should reflect a runtime language change (impure pipe)', () => {
      expect(pipe.transform('user_title')).toBe('Users');
      CometChatLocalize.setCurrentLanguage('es');
      expect(pipe.transform('user_title')).toBe('Usuarios');
    });

    it('should fall back to en-US when the current language lacks the key', () => {
      CometChatLocalize.addTranslation({ 'tp-spec-empty-lang': {} });
      CometChatLocalize.setCurrentLanguage('tp-spec-empty-lang');
      expect(CometChatLocalize.getCurrentLanguage()).toBe('tp-spec-empty-lang');
      expect(pipe.transform('user_title')).toBe('Users');
      expect(pipe.transform('conversation_chat_title')).toBe('Chats');
    });
  });

  // -------------------------------------------------------------------------
  // Empty State
  // -------------------------------------------------------------------------
  describe('Empty / null handling', () => {
    it('should return empty string for empty key', () => {
      expect(pipe.transform('')).toBe('');
    });

    it('should return empty string for null-like key', () => {
      expect(pipe.transform(null as unknown as string)).toBe('');
      expect(pipe.transform(undefined as unknown as string)).toBe('');
    });
  });

  // -------------------------------------------------------------------------
  // Error State — Missing Keys
  // -------------------------------------------------------------------------
  describe('Missing key handling', () => {
    it('should return the key itself when no translation is found', () => {
      expect(CometChatLocalize.getLocalizedString('nonexistent_key_xyz')).toBe('');
      expect(pipe.transform('nonexistent_key_xyz')).toBe('nonexistent_key_xyz');
    });
  });

  // -------------------------------------------------------------------------
  // Key Interactions — Parameter Interpolation
  // -------------------------------------------------------------------------
  describe('Parameter interpolation', () => {
    it('should replace {param} placeholders with provided values', () => {
      expect(pipe.transform('tp_spec_single', { n: 5 })).toBe('Add 5 Members');
    });

    it('should handle multiple parameters', () => {
      // Every occurrence of a repeated placeholder is replaced (global regex)
      expect(pipe.transform('tp_spec_multi', { name: 'Alice', count: 3 })).toBe(
        'Alice has 3 new messages from Alice'
      );
    });

    it('should leave text unchanged when no params provided', () => {
      expect(pipe.transform('tp_spec_plain')).toBe('Plain text {untouched}');
      expect(pipe.transform('tp_spec_single')).toBe('Add {n} Members');
    });

    it('should handle params with no matching placeholders gracefully', () => {
      expect(pipe.transform('tp_spec_plain', { other: 'x', n: 9 })).toBe('Plain text {untouched}');
      // Extra params alongside a matching one: only the matching one is applied
      expect(pipe.transform('tp_spec_single', { n: 2, extra: 'ignored' })).toBe('Add 2 Members');
    });

    it('should leave text unchanged for an empty params object', () => {
      expect(pipe.transform('tp_spec_single', {})).toBe('Add {n} Members');
    });
  });

  // -------------------------------------------------------------------------
  // Edge Cases
  // -------------------------------------------------------------------------
  describe('Edge cases', () => {
    it('should handle key with special characters', () => {
      expect(pipe.transform('tp.spec-key_with.special-chars')).toBe('Special OK');
      // An unknown key with special characters is returned verbatim
      expect(pipe.transform('no.such-key_here')).toBe('no.such-key_here');
    });

    it('should not throw for numeric param values', () => {
      expect(() => pipe.transform('tp_spec_single', { n: 0 })).not.toThrow();
      expect(pipe.transform('tp_spec_single', { n: 0 })).toBe('Add 0 Members');
      expect(pipe.transform('tp_spec_single', { n: 3.5 })).toBe('Add 3.5 Members');
      expect(pipe.transform('tp_spec_single', { n: -1 })).toBe('Add -1 Members');
    });
  });

  // -------------------------------------------------------------------------
  // Property-based
  // -------------------------------------------------------------------------
  describe('Properties', () => {
    it('should translate every key in the en-US bundle to its bundle value', () => {
      const entries = Object.entries(translationENUS);
      expect(entries.length).toBeGreaterThan(0);
      for (const [key, value] of entries) {
        expect(value).not.toBe('');
        expect(pipe.transform(key)).toBe(value);
      }
    });

    it('should substitute any string value into a placeholder', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 0, maxLength: 200 }), n => {
          // String.replace treats `$` sequences in the replacement specially;
          // the pipe uses String.replace, so the expectation mirrors that.
          const expected = 'Add {n} Members'.replace(/\{n\}/g, n);
          expect(pipe.transform('tp_spec_single', { n })).toBe(expected);
        }),
        { numRuns: 100 }
      );
    });

    it('should return any non-existent key verbatim', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }).map(s => `__pbt_${s}`),
          key => {
            expect(pipe.transform(key)).toBe(key);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
