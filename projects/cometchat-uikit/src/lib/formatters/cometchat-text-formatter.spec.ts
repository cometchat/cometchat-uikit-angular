import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { ensureSdkReady, sdkCleanup } from '../test-setup';
import { CometChatTextFormatter } from './cometchat-text-formatter';

/**
 * Unit Tests for CometChatTextFormatter (Base Class)
 *
 * Tests cover:
 * - Abstract class structure and interface contract
 * - format(), getRegex(), reset() methods
 * - Default passthrough behavior (no-match returns input unchanged)
 * - State management (originalText, formattedText, metadata)
 * - Empty/null/undefined input handling
 * - shouldFormat() default behavior
 *
 * **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 14.4, 14.5, 15.7**
 */

/**
 * Concrete implementation of CometChatTextFormatter for testing.
 * Replaces occurrences of "test" with "[TEST]" — used to verify
 * the abstract class contract and state management.
 */
class TestFormatter extends CometChatTextFormatter {
  readonly id = 'test-formatter';

  getRegex(): RegExp {
    return /test/gi;
  }

  format(text: string): string {
    this.originalText = text;
    this.formattedText = text.replace(this.getRegex(), '[TEST]');
    this.metadata = { matches: (text.match(this.getRegex()) || []).length };
    return this.formattedText;
  }
}

/**
 * Passthrough formatter — never transforms text.
 * Used to verify that the base class supports formatters that
 * return input unchanged when no patterns match.
 */
class PassthroughFormatter extends CometChatTextFormatter {
  readonly id = 'passthrough-formatter';

  getRegex(): RegExp {
    return /(?!)/g; // never matches
  }

  format(text: string): string {
    this.originalText = text ?? '';
    this.formattedText = text ?? '';
    this.metadata = {};
    return this.formattedText;
  }
}

describe('CometChatTextFormatter', () => {
  let formatter: TestFormatter;

  beforeAll(async () => {
    await ensureSdkReady();
  });

  afterAll(async () => {
    await sdkCleanup();
  });

  beforeEach(() => {
    formatter = new TestFormatter();
  });

  afterEach(() => {
    formatter.reset();
  });

  describe('id property', () => {
    it('should have a unique identifier', () => {
      expect(formatter.id).toBe('test-formatter');
    });

    it('should be readonly and non-empty', () => {
      expect(typeof formatter.id).toBe('string');
      expect(formatter.id.length).toBeGreaterThan(0);
    });
  });

  describe('priority property', () => {
    it('should have default priority of 100', () => {
      expect(formatter.priority).toBe(100);
    });

    it('should allow priority to be changed', () => {
      formatter.priority = 50;
      expect(formatter.priority).toBe(50);
    });
  });

  describe('shouldFormat()', () => {
    it('should return true by default', () => {
      expect(formatter.shouldFormat('any text')).toBe(true);
    });

    it('should return true for empty text by default', () => {
      expect(formatter.shouldFormat('')).toBe(true);
    });

    it('should accept optional message parameter', () => {
      expect(formatter.shouldFormat('text', undefined)).toBe(true);
    });
  });

  describe('initial state', () => {
    it('should have empty originalText initially', () => {
      expect(formatter.getOriginalText()).toBe('');
    });

    it('should have empty formattedText initially', () => {
      expect(formatter.getFormattedText()).toBe('');
    });

    it('should have empty metadata initially', () => {
      expect(formatter.getMetadata()).toEqual({});
    });
  });

  describe('getRegex()', () => {
    it('should return a RegExp pattern', () => {
      const regex = formatter.getRegex();
      expect(regex).toBeInstanceOf(RegExp);
    });
  });

  describe('format()', () => {
    it('should store original text', () => {
      const text = 'This is a test string';
      formatter.format(text);
      expect(formatter.getOriginalText()).toBe(text);
    });

    it('should store formatted text', () => {
      const text = 'This is a test string';
      const result = formatter.format(text);
      expect(formatter.getFormattedText()).toBe(result);
    });

    it('should return formatted text', () => {
      const text = 'This is a test string';
      const result = formatter.format(text);
      expect(result).toBe('This is a [TEST] string');
    });

    it('should store metadata', () => {
      const text = 'test test test';
      formatter.format(text);
      expect(formatter.getMetadata()).toEqual({ matches: 3 });
    });
  });

  describe('getOriginalText()', () => {
    it('should return the original text after formatting', () => {
      const text = 'Original test text';
      formatter.format(text);
      expect(formatter.getOriginalText()).toBe(text);
    });
  });

  describe('getFormattedText()', () => {
    it('should return the formatted text after formatting', () => {
      const text = 'test';
      formatter.format(text);
      expect(formatter.getFormattedText()).toBe('[TEST]');
    });
  });

  describe('getMetadata()', () => {
    it('should return metadata after formatting', () => {
      formatter.format('test test');
      const metadata = formatter.getMetadata();
      expect(metadata).toHaveProperty('matches');
      expect(metadata['matches']).toBe(2);
    });
  });

  describe('reset()', () => {
    it('should clear originalText', () => {
      formatter.format('test text');
      formatter.reset();
      expect(formatter.getOriginalText()).toBe('');
    });

    it('should clear formattedText', () => {
      formatter.format('test text');
      formatter.reset();
      expect(formatter.getFormattedText()).toBe('');
    });

    it('should clear metadata', () => {
      formatter.format('test text');
      formatter.reset();
      expect(formatter.getMetadata()).toEqual({});
    });

    it('should allow reuse after reset', () => {
      formatter.format('first test');
      formatter.reset();
      formatter.format('second test');
      expect(formatter.getOriginalText()).toBe('second test');
      expect(formatter.getFormattedText()).toBe('second [TEST]');
    });
  });

  describe('Default Passthrough Behavior', () => {
    let passthrough: PassthroughFormatter;

    beforeEach(() => {
      passthrough = new PassthroughFormatter();
    });

    afterEach(() => {
      passthrough.reset();
    });

    it('should return input unchanged when no patterns match', () => {
      const text = 'Hello world, no patterns here!';
      const result = passthrough.format(text);
      expect(result).toBe(text);
    });

    it('should store original and formatted text identically on passthrough', () => {
      const text = 'Some plain text';
      passthrough.format(text);
      expect(passthrough.getOriginalText()).toBe(text);
      expect(passthrough.getFormattedText()).toBe(text);
    });

    it('should return empty metadata on passthrough', () => {
      passthrough.format('No matches here');
      expect(passthrough.getMetadata()).toEqual({});
    });

    it('should pass through text with special characters unchanged', () => {
      const text = '<div>HTML & "quotes" \'single\' `backticks`</div>';
      const result = passthrough.format(text);
      expect(result).toBe(text);
    });

    it('should pass through multiline text unchanged', () => {
      const text = 'Line 1\nLine 2\nLine 3';
      const result = passthrough.format(text);
      expect(result).toBe(text);
    });

    it('should pass through unicode text unchanged', () => {
      const text = '你好世界 🌍 مرحبا';
      const result = passthrough.format(text);
      expect(result).toBe(text);
    });

    it('should return text unchanged when TestFormatter has no matches', () => {
      const text = 'No matching patterns here';
      const result = formatter.format(text);
      expect(result).toBe(text);
      expect(formatter.getMetadata()).toEqual({ matches: 0 });
    });
  });

  describe('Empty/Null Input Handling', () => {
    it('should handle empty string input', () => {
      const result = formatter.format('');
      expect(result).toBe('');
      expect(formatter.getOriginalText()).toBe('');
      expect(formatter.getFormattedText()).toBe('');
      expect(formatter.getMetadata()).toEqual({ matches: 0 });
    });

    it('should handle whitespace-only input', () => {
      const result = formatter.format('   ');
      expect(result).toBe('   ');
      expect(formatter.getOriginalText()).toBe('   ');
    });

    it('should handle null input to shouldFormat without throwing', () => {
      expect(() => formatter.shouldFormat(null as unknown as string)).not.toThrow();
      expect(formatter.shouldFormat(null as unknown as string)).toBe(true);
    });

    it('should handle undefined input to shouldFormat without throwing', () => {
      expect(() => formatter.shouldFormat(undefined as unknown as string)).not.toThrow();
      expect(formatter.shouldFormat(undefined as unknown as string)).toBe(true);
    });

    it('should return empty string from getOriginalText before any format call', () => {
      expect(formatter.getOriginalText()).toBe('');
    });

    it('should return empty string from getFormattedText before any format call', () => {
      expect(formatter.getFormattedText()).toBe('');
    });

    it('should return empty object from getMetadata before any format call', () => {
      expect(formatter.getMetadata()).toEqual({});
    });

    it('should handle reset on a fresh (never-formatted) instance', () => {
      expect(() => formatter.reset()).not.toThrow();
      expect(formatter.getOriginalText()).toBe('');
      expect(formatter.getFormattedText()).toBe('');
      expect(formatter.getMetadata()).toEqual({});
    });

    it('should handle passthrough formatter with empty string', () => {
      const passthrough = new PassthroughFormatter();
      const result = passthrough.format('');
      expect(result).toBe('');
      expect(passthrough.getOriginalText()).toBe('');
      expect(passthrough.getFormattedText()).toBe('');
    });

    it('should handle passthrough formatter with null input gracefully', () => {
      const passthrough = new PassthroughFormatter();
      const result = passthrough.format(null as unknown as string);
      expect(result).toBe('');
    });

    it('should handle passthrough formatter with undefined input gracefully', () => {
      const passthrough = new PassthroughFormatter();
      const result = passthrough.format(undefined as unknown as string);
      expect(result).toBe('');
    });
  });
});
