import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { ensureSdkReady, sdkCleanup } from '../test-setup';
import { applyFormatters, formatText } from './formatter-pipeline';
import { CometChatTextFormatter } from './cometchat-text-formatter';
import { CometChatUrlFormatter } from './cometchat-url-formatter';
import { CometChatMentionsFormatter } from './cometchat-mentions-formatter';
import { CometChatEmojiFormatter } from './cometchat-emoji-formatter';
import { CometChatLogger } from '../utils/CometChatLogger';

/**
 * Unit Tests for Formatter Pipeline
 *
 * Tests cover:
 * - Sorting formatters by priority
 * - Applying formatters in sequence (chaining output → input)
 * - Error handling and graceful continuation
 * - Metadata collection from all formatters
 * - Edge cases (empty inputs, no formatters, null/undefined)
 * - shouldFormat gating and reset behavior
 * - Integration with real built-in formatters
 *
 * **Validates: Requirements 6.6, 14.4, 14.5, 15.7**
 */

/**
 * Mock formatter for testing
 */
class MockFormatter extends CometChatTextFormatter {
  readonly id: string;
  private formatFn: (text: string) => string;
  private shouldThrow: boolean;

  constructor(
    id: string,
    priority: number,
    formatFn: (text: string) => string = t => t,
    shouldThrow = false
  ) {
    super();
    this.id = id;
    this.priority = priority;
    this.formatFn = formatFn;
    this.shouldThrow = shouldThrow;
  }

  getRegex(): RegExp {
    return /./g;
  }

  format(text: string): string {
    if (this.shouldThrow) {
      throw new Error(`Formatter ${this.id} error`);
    }
    this.originalText = text;
    this.formattedText = this.formatFn(text);
    this.metadata = { formatterId: this.id };
    return this.formattedText;
  }
}

/**
 * Mock CometChat User class for testing
 */
class MockUser {
  constructor(
    private uid: string,
    private name: string
  ) {}

  getUid(): string {
    return this.uid;
  }

  getName(): string {
    return this.name;
  }
}

describe('Formatter Pipeline', () => {
  beforeAll(async () => {
    await ensureSdkReady();
  });

  afterAll(async () => {
    await sdkCleanup();
  });

  describe('applyFormatters', () => {
    describe('sorting by priority', () => {
      it('should apply formatters in priority order (lower priority first)', () => {
        const executionOrder: string[] = [];

        const formatter1 = new MockFormatter('high-priority', 10, t => {
          executionOrder.push('high-priority');
          return t + '[10]';
        });
        const formatter2 = new MockFormatter('low-priority', 30, t => {
          executionOrder.push('low-priority');
          return t + '[30]';
        });
        const formatter3 = new MockFormatter('medium-priority', 20, t => {
          executionOrder.push('medium-priority');
          return t + '[20]';
        });

        // Pass formatters in random order
        const result = applyFormatters([formatter2, formatter1, formatter3], 'test');

        // Should be executed in priority order
        expect(executionOrder).toEqual(['high-priority', 'medium-priority', 'low-priority']);
        expect(result.text).toBe('test[10][20][30]');
      });

      it('should handle formatters with same priority', () => {
        const formatter1 = new MockFormatter('first', 10, t => t + '[1]');
        const formatter2 = new MockFormatter('second', 10, t => t + '[2]');

        const result = applyFormatters([formatter1, formatter2], 'test');

        // Both should be applied (order may vary for same priority)
        expect(result.text).toContain('[1]');
        expect(result.text).toContain('[2]');
        expect(result.appliedFormatters).toHaveLength(2);
      });

      it('should not mutate the original formatters array', () => {
        const formatter1 = new MockFormatter('a', 30, t => t);
        const formatter2 = new MockFormatter('b', 10, t => t);
        const formatter3 = new MockFormatter('c', 20, t => t);

        const originalArray = [formatter1, formatter2, formatter3];
        const originalOrder = [...originalArray];

        applyFormatters(originalArray, 'test');

        // Original array should be unchanged
        expect(originalArray).toEqual(originalOrder);
      });
    });

    describe('sequential application', () => {
      it('should pass output of one formatter to the next', () => {
        const formatter1 = new MockFormatter('first', 10, t => t.toUpperCase());
        const formatter2 = new MockFormatter('second', 20, t => `[${t}]`);

        const result = applyFormatters([formatter1, formatter2], 'hello');

        expect(result.text).toBe('[HELLO]');
      });

      it('should combine metadata from all formatters', () => {
        const formatter1 = new MockFormatter('first', 10, t => t);
        const formatter2 = new MockFormatter('second', 20, t => t);

        const result = applyFormatters([formatter1, formatter2], 'test');

        // Each formatter adds its id to metadata
        expect(result.metadata).toHaveProperty('formatterId');
        expect(result.appliedFormatters).toContain('first');
        expect(result.appliedFormatters).toContain('second');
      });

      it('should track applied formatters', () => {
        const formatter1 = new MockFormatter('url', 10, t => t);
        const formatter2 = new MockFormatter('mention', 20, t => t);
        const formatter3 = new MockFormatter('emoji', 30, t => t);

        const result = applyFormatters([formatter1, formatter2, formatter3], 'test');

        expect(result.appliedFormatters).toEqual(['url', 'mention', 'emoji']);
      });
    });

    describe('error handling', () => {
      it('should catch errors and continue with next formatter', () => {
        const formatter1 = new MockFormatter('first', 10, t => t + '[1]');
        const formatter2 = new MockFormatter('failing', 20, t => t, true); // throws error
        const formatter3 = new MockFormatter('third', 30, t => t + '[3]');

        const result = applyFormatters([formatter1, formatter2, formatter3], 'test');

        // First and third should be applied, second should fail
        expect(result.text).toBe('test[1][3]');
        expect(result.appliedFormatters).toEqual(['first', 'third']);
        expect(result.failedFormatters).toEqual(['failing']);
      });

      it('should preserve text from previous formatter when error occurs', () => {
        const loggerWarnSpy = vi.spyOn(CometChatLogger, 'warn').mockImplementation(() => {});

        const formatter1 = new MockFormatter('first', 10, t => 'MODIFIED');
        const formatter2 = new MockFormatter('failing', 20, t => t, true);
        const formatter3 = new MockFormatter('third', 30, t => t + '!');

        const result = applyFormatters([formatter1, formatter2, formatter3], 'original');

        // Text from formatter1 should be preserved through formatter2's failure
        expect(result.text).toBe('MODIFIED!');

        loggerWarnSpy.mockRestore();
      });

      it('should handle all formatters failing', () => {
        const loggerWarnSpy = vi.spyOn(CometChatLogger, 'warn').mockImplementation(() => {});

        const formatter1 = new MockFormatter('fail1', 10, t => t, true);
        const formatter2 = new MockFormatter('fail2', 20, t => t, true);

        const result = applyFormatters([formatter1, formatter2], 'original');

        // Original text should be preserved
        expect(result.text).toBe('original');
        expect(result.appliedFormatters).toEqual([]);
        expect(result.failedFormatters).toEqual(['fail1', 'fail2']);

        loggerWarnSpy.mockRestore();
      });
    });

    describe('edge cases', () => {
      it('should handle empty formatters array', () => {
        const result = applyFormatters([], 'test');

        expect(result.text).toBe('test');
        expect(result.metadata).toEqual({});
        expect(result.appliedFormatters).toEqual([]);
        expect(result.failedFormatters).toEqual([]);
      });

      it('should handle null formatters array', () => {
        const result = applyFormatters(null as any, 'test');

        expect(result.text).toBe('test');
        expect(result.metadata).toEqual({});
      });

      it('should handle undefined formatters array', () => {
        const result = applyFormatters(undefined as any, 'test');

        expect(result.text).toBe('test');
        expect(result.metadata).toEqual({});
      });

      it('should handle empty text', () => {
        const formatter = new MockFormatter('test', 10, t => t + '!');
        const result = applyFormatters([formatter], '');

        expect(result.text).toBe('');
        expect(result.appliedFormatters).toEqual([]);
      });

      it('should handle null text', () => {
        const formatter = new MockFormatter('test', 10, t => t + '!');
        const result = applyFormatters([formatter], null as any);

        expect(result.text).toBe('');
      });

      it('should handle undefined text', () => {
        const formatter = new MockFormatter('test', 10, t => t + '!');
        const result = applyFormatters([formatter], undefined as any);

        expect(result.text).toBe('');
      });

      it('should handle single formatter', () => {
        const formatter = new MockFormatter('single', 10, t => t.toUpperCase());
        const result = applyFormatters([formatter], 'hello');

        expect(result.text).toBe('HELLO');
        expect(result.appliedFormatters).toEqual(['single']);
      });
    });

    describe('shouldFormat check', () => {
      it('should skip formatters that return false from shouldFormat', () => {
        const formatter1 = new MockFormatter('first', 10, t => t + '[1]');
        formatter1.shouldFormat = () => true;

        const formatter2 = new MockFormatter('skipped', 20, t => t + '[2]');
        formatter2.shouldFormat = () => false;

        const formatter3 = new MockFormatter('third', 30, t => t + '[3]');
        formatter3.shouldFormat = () => true;

        const result = applyFormatters([formatter1, formatter2, formatter3], 'test');

        expect(result.text).toBe('test[1][3]');
        expect(result.appliedFormatters).toEqual(['first', 'third']);
        expect(result.failedFormatters).toEqual([]);
      });
    });

    describe('reset behavior', () => {
      it('should reset each formatter before applying', () => {
        const formatter = new MockFormatter('test', 10, t => t + '!');
        const resetSpy = vi.spyOn(formatter, 'reset');

        applyFormatters([formatter], 'test');

        expect(resetSpy).toHaveBeenCalled();
      });
    });
  });

  describe('formatText', () => {
    it('should return only the formatted text string', () => {
      const formatter = new MockFormatter('test', 10, t => t.toUpperCase());
      const result = formatText([formatter], 'hello');

      expect(result).toBe('HELLO');
      expect(typeof result).toBe('string');
    });

    it('should handle empty formatters', () => {
      const result = formatText([], 'test');
      expect(result).toBe('test');
    });
  });

  describe('integration with real formatters', () => {
    let urlFormatter: CometChatUrlFormatter;
    let mentionsFormatter: CometChatMentionsFormatter;
    let emojiFormatter: CometChatEmojiFormatter;

    beforeEach(() => {
      urlFormatter = new CometChatUrlFormatter();
      mentionsFormatter = new CometChatMentionsFormatter();
      emojiFormatter = new CometChatEmojiFormatter();

      // Set up users for mentions formatter
      const users = [new MockUser('user1', 'John'), new MockUser('user2', 'Jane')];
      mentionsFormatter.setUsers(users as any);
    });

    it('should apply all built-in formatters correctly', () => {
      const text = 'Hello @john :smile: check https://example.com';
      const result = applyFormatters([urlFormatter, mentionsFormatter, emojiFormatter], text);

      // URL should be converted to link
      expect(result.text).toContain('cometchat-link');
      expect(result.text).toContain('https://example.com');

      // Mention should be highlighted
      expect(result.text).toContain('cometchat-mentions');
      expect(result.text).toContain('@John');

      // Emoji shortcode should be converted
      expect(result.text).toContain('😊');

      // Metadata should contain all formatter data
      expect(result.metadata).toHaveProperty('urls');
      expect(result.metadata).toHaveProperty('mentions');
      expect(result.metadata).toHaveProperty('shortcodes');
    });

    it('should respect formatter priorities', () => {
      // URL: 10, Mentions: 20, Emoji: 30
      expect(urlFormatter.priority).toBe(10);
      expect(mentionsFormatter.priority).toBe(20);
      expect(emojiFormatter.priority).toBe(30);

      const result = applyFormatters(
        [emojiFormatter, urlFormatter, mentionsFormatter], // random order
        'test'
      );

      // Should be applied in priority order
      expect(result.appliedFormatters).toEqual([
        'url-formatter',
        'mentions-formatter',
        'emoji-formatter',
      ]);
    });

    it('should handle text with no patterns', () => {
      const text = 'Hello world';
      const result = applyFormatters([urlFormatter, mentionsFormatter, emojiFormatter], text);

      expect(result.text).toBe('Hello world');
      expect((result.metadata['urls'] as string[]).length).toBe(0);
      expect((result.metadata['mentions'] as any[]).length).toBe(0);
      expect((result.metadata['shortcodes'] as string[]).length).toBe(0);
    });
  });
});
