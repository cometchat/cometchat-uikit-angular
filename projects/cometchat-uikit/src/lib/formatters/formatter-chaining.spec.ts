import { describe, it, expect, beforeEach } from 'vitest';
import { CometChatTextFormatter } from './cometchat-text-formatter';
import { CometChatMentionsFormatter } from './cometchat-mentions-formatter';
import { CometChatUrlFormatter } from './cometchat-url-formatter';

/**
 * Unit Tests for Formatter Chaining
 *
 * Tests cover:
 * - Chaining multiple formatters together
 * - Order of formatter application
 * - Combined metadata from multiple formatters
 *
 * **Validates: Requirements 20.1-20.7, 21.6**
 */

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

/**
 * Helper function to chain formatters
 * Applies formatters in sequence, passing output of one to input of next
 */
function chainFormatters(
  text: string,
  formatters: CometChatTextFormatter[]
): { result: string; metadata: Record<string, unknown> } {
  let currentText = text;
  const combinedMetadata: Record<string, unknown> = {};

  for (const formatter of formatters) {
    formatter.reset();
    currentText = formatter.format(currentText);
    Object.assign(combinedMetadata, formatter.getMetadata());
  }

  return { result: currentText, metadata: combinedMetadata };
}

describe('Formatter Chaining', () => {
  let mentionsFormatter: CometChatMentionsFormatter;
  let urlFormatter: CometChatUrlFormatter;

  beforeEach(() => {
    mentionsFormatter = new CometChatMentionsFormatter();
    urlFormatter = new CometChatUrlFormatter();

    // Set up users for mentions formatter
    const users = [new MockUser('user1', 'John'), new MockUser('user2', 'Jane')];
    mentionsFormatter.setUsers(users as any);
  });

  describe('basic chaining', () => {
    it('should apply multiple formatters in sequence', () => {
      const text = 'Hello @john, check out https://example.com';
      const { result } = chainFormatters(text, [mentionsFormatter, urlFormatter]);

      // Both mentions and URLs should be formatted
      // Uses React UIKit class structure: cometchat-mentions
      expect(result).toContain('cometchat-mentions');
      expect(result).toContain('cometchat-link');
    });

    it('should combine metadata from all formatters', () => {
      const text = 'Hello @john, check out https://example.com';
      const { metadata } = chainFormatters(text, [mentionsFormatter, urlFormatter]);

      expect(metadata).toHaveProperty('mentions');
      expect(metadata).toHaveProperty('urls');
    });

    it('should work with single formatter', () => {
      const text = 'Hello @john';
      const { result, metadata } = chainFormatters(text, [mentionsFormatter]);

      // Uses React UIKit class structure: cometchat-mentions
      expect(result).toContain('cometchat-mentions');
      expect(metadata).toHaveProperty('mentions');
    });

    it('should work with empty formatter array', () => {
      const text = 'Hello world';
      const { result, metadata } = chainFormatters(text, []);

      expect(result).toBe(text);
      expect(metadata).toEqual({});
    });
  });

  describe('order of application', () => {
    it('should apply formatters in provided order', () => {
      const text = 'Hello @john';

      // Apply mentions first
      const { result: result1 } = chainFormatters(text, [mentionsFormatter]);
      expect(result1).toContain('@John</span>');

      // Apply URL formatter to already formatted text
      const { result: result2 } = chainFormatters(result1, [urlFormatter]);
      // URL formatter should not affect mention spans
      expect(result2).toContain('@John</span>');
    });

    it('should handle URL formatter before mentions formatter', () => {
      const text = 'Visit https://example.com and @john';
      const { result } = chainFormatters(text, [urlFormatter, mentionsFormatter]);

      // Both should be formatted
      // Uses React UIKit class structure: cometchat-mentions
      expect(result).toContain('cometchat-link');
      expect(result).toContain('cometchat-mentions');
    });
  });

  describe('text with both mentions and URLs', () => {
    it('should format text with mentions and URLs', () => {
      const text = '@john check https://example.com';
      const { result, metadata } = chainFormatters(text, [mentionsFormatter, urlFormatter]);

      // Uses React UIKit class structure: cometchat-mentions
      expect(result).toContain('cometchat-mentions');
      expect(result).toContain('cometchat-link');
      expect((metadata['mentions'] as any[]).length).toBe(1);
      expect((metadata['urls'] as string[]).length).toBe(1);
    });

    it('should handle multiple mentions and URLs', () => {
      const text = '@john and @jane visit https://example.com and https://test.com';
      const { result, metadata } = chainFormatters(text, [mentionsFormatter, urlFormatter]);

      expect((metadata['mentions'] as any[]).length).toBe(2);
      expect((metadata['urls'] as string[]).length).toBe(2);
    });

    it('should handle adjacent mentions and URLs', () => {
      const text = '@john https://example.com';
      const { result } = chainFormatters(text, [mentionsFormatter, urlFormatter]);

      // Uses React UIKit class structure: cometchat-mentions
      expect(result).toContain('cometchat-mentions');
      expect(result).toContain('cometchat-link');
    });
  });

  describe('formatter independence', () => {
    it('should not affect other formatters state', () => {
      const text1 = 'Hello @john';
      const text2 = 'Visit https://example.com';

      mentionsFormatter.format(text1);
      urlFormatter.format(text2);

      // Each formatter should have its own state
      expect(mentionsFormatter.getMentions().length).toBe(1);
      expect(urlFormatter.getUrls().length).toBe(1);
    });

    it('should reset properly between chains', () => {
      const text1 = '@john https://example.com';
      const text2 = '@jane https://test.com';

      chainFormatters(text1, [mentionsFormatter, urlFormatter]);
      const { metadata } = chainFormatters(text2, [mentionsFormatter, urlFormatter]);

      // Should only have data from second chain
      const mentions = metadata['mentions'] as any[];
      const urls = metadata['urls'] as string[];
      expect(mentions.length).toBe(1);
      expect(mentions[0].name).toBe('Jane');
      expect(urls.length).toBe(1);
      expect(urls[0]).toBe('https://test.com');
    });
  });

  describe('edge cases', () => {
    it('should handle empty text', () => {
      const { result, metadata } = chainFormatters('', [mentionsFormatter, urlFormatter]);

      expect(result).toBe('');
      expect(metadata['mentions']).toEqual([]);
      expect(metadata['urls']).toEqual([]);
    });

    it('should handle text with no patterns', () => {
      const text = 'Hello world';
      const { result, metadata } = chainFormatters(text, [mentionsFormatter, urlFormatter]);

      expect(result).toBe(text);
      expect((metadata['mentions'] as any[]).length).toBe(0);
      expect((metadata['urls'] as string[]).length).toBe(0);
    });

    it('should handle text with only unmatched mentions', () => {
      const text = 'Hello @unknown';
      const { result, metadata } = chainFormatters(text, [mentionsFormatter, urlFormatter]);

      expect(result).toBe(text);
      expect((metadata['mentions'] as any[]).length).toBe(0);
    });

    it('should handle special characters', () => {
      const text = '@john says: "Check https://example.com!" & more';
      const { result } = chainFormatters(text, [mentionsFormatter, urlFormatter]);

      // Uses React UIKit class structure: cometchat-mentions
      expect(result).toContain('cometchat-mentions');
      expect(result).toContain('cometchat-link');
    });
  });
});
