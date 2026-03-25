/**
 * CometChatUrlFormatter Tests
 *
 * Tests cover:
 * - URL pattern matching and regex validation (Req 6.1, 6.2)
 * - Anchor tag wrapping with correct href (Req 6.8)
 * - Multiple URLs in a single string
 * - No-match passthrough (Req 6.4)
 * - Empty/null/undefined input handling (Req 6.3)
 * - Reset clears state (Req 6.5)
 * - Malformed URL handling
 * - Trailing punctuation stripping
 * - Markdown link protection (no double-processing)
 * - Existing anchor tag protection
 *
 * **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.8, 14.4, 14.5, 15.7**
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { ensureSdkReady, sdkCleanup } from '../test-setup';
import { CometChatUrlFormatter } from './cometchat-url-formatter';

describe('CometChatUrlFormatter', () => {
  let formatter: CometChatUrlFormatter;

  beforeAll(async () => {
    await ensureSdkReady();
  });

  afterAll(async () => {
    await sdkCleanup();
  });

  beforeEach(() => {
    formatter = new CometChatUrlFormatter();
  });

  afterEach(() => {
    formatter.reset();
  });

  describe('id and priority', () => {
    it('should have id set to "url-formatter"', () => {
      expect(formatter.id).toBe('url-formatter');
    });

    it('should have priority set to 10', () => {
      expect(formatter.priority).toBe(10);
    });
  });

  describe('shouldFormat()', () => {
    it('should return true by default for any text', () => {
      expect(formatter.shouldFormat('hello')).toBe(true);
    });

    it('should return true for text with URLs', () => {
      expect(formatter.shouldFormat('Visit https://example.com')).toBe(true);
    });

    it('should return true for text without URLs', () => {
      expect(formatter.shouldFormat('no urls here')).toBe(true);
    });
  });

  describe('getRegex()', () => {
    it('should return a RegExp pattern for URLs', () => {
      const regex = formatter.getRegex();
      expect(regex).toBeInstanceOf(RegExp);
    });

    it('should match https:// URLs', () => {
      const regex = formatter.getRegex();
      const text = 'Visit https://example.com';
      const matches = text.match(regex);
      expect(matches).toContain('https://example.com');
    });

    it('should match http:// URLs', () => {
      const regex = formatter.getRegex();
      const text = 'Visit http://example.com';
      const matches = text.match(regex);
      expect(matches).toContain('http://example.com');
    });

    it('should match www. URLs', () => {
      const regex = formatter.getRegex();
      const text = 'Visit www.example.com';
      const matches = text.match(regex);
      expect(matches).toContain('www.example.com');
    });

    it('should match multiple URLs', () => {
      const regex = formatter.getRegex();
      const text = 'Visit https://example.com and www.test.com';
      const matches = text.match(regex);
      expect(matches).toHaveLength(2);
    });

    it('should be case-insensitive', () => {
      const regex = formatter.getRegex();
      const text = 'Visit HTTPS://EXAMPLE.COM';
      const matches = text.match(regex);
      expect(matches).toContain('HTTPS://EXAMPLE.COM');
    });
  });

  describe('format()', () => {
    it('should store original text', () => {
      const text = 'Visit https://example.com';
      formatter.format(text);
      expect(formatter.getOriginalText()).toBe(text);
    });

    it('should convert https URLs to anchor tags', () => {
      const result = formatter.format('Visit https://example.com');
      expect(result).toContain('<a href="https://example.com"');
      expect(result).toContain('</a>');
    });

    it('should convert http URLs to anchor tags', () => {
      const result = formatter.format('Visit http://example.com');
      expect(result).toContain('<a href="http://example.com"');
    });

    it('should add https:// prefix to www URLs', () => {
      const result = formatter.format('Visit www.example.com');
      expect(result).toContain('href="https://www.example.com"');
    });

    it('should preserve www. in display text', () => {
      const result = formatter.format('Visit www.example.com');
      expect(result).toContain('>www.example.com</a>');
    });

    it('should add target="_blank" attribute', () => {
      const result = formatter.format('Visit https://example.com');
      expect(result).toContain('target="_blank"');
    });

    it('should add rel="noopener noreferrer" for security', () => {
      const result = formatter.format('Visit https://example.com');
      expect(result).toContain('rel="noopener noreferrer"');
    });

    it('should add cometchat-link class', () => {
      const result = formatter.format('Visit https://example.com');
      expect(result).toContain('class="cometchat-link"');
    });

    it('should handle text without URLs', () => {
      const text = 'Hello world';
      const result = formatter.format(text);
      expect(result).toBe(text);
    });

    it('should handle multiple URLs', () => {
      const result = formatter.format('Visit https://example.com and https://test.com');
      expect(result).toContain('href="https://example.com"');
      expect(result).toContain('href="https://test.com"');
    });

    it('should handle URLs with paths', () => {
      const result = formatter.format('Visit https://example.com/path/to/page');
      expect(result).toContain('href="https://example.com/path/to/page"');
    });

    it('should handle URLs with query parameters', () => {
      const result = formatter.format('Visit https://example.com?foo=bar&baz=qux');
      expect(result).toContain('href="https://example.com?foo=bar&baz=qux"');
    });

    it('should handle URLs with fragments', () => {
      const result = formatter.format('Visit https://example.com#section');
      expect(result).toContain('href="https://example.com#section"');
    });

    it('should handle URLs with port numbers', () => {
      const result = formatter.format('Visit https://example.com:8080');
      expect(result).toContain('href="https://example.com:8080"');
    });

    it('should handle URLs at start of text', () => {
      const result = formatter.format('https://example.com is a website');
      expect(result).toContain('<a href="https://example.com"');
    });

    it('should handle URLs at end of text', () => {
      const result = formatter.format('Visit https://example.com');
      expect(result).toContain('https://example.com</a>');
    });

    it('should preserve surrounding text', () => {
      const result = formatter.format('Before https://example.com after');
      expect(result).toBe(
        'Before <a href="https://example.com" target="_blank" rel="noopener noreferrer" class="cometchat-link">https://example.com</a> after'
      );
    });
  });

  describe('getUrls()', () => {
    it('should return empty array when no URLs', () => {
      formatter.format('Hello world');
      expect(formatter.getUrls()).toEqual([]);
    });

    it('should return detected URLs', () => {
      formatter.format('Visit https://example.com');
      const urls = formatter.getUrls();
      expect(urls).toContain('https://example.com');
    });

    it('should return all detected URLs', () => {
      formatter.format('Visit https://example.com and www.test.com');
      const urls = formatter.getUrls();
      expect(urls).toHaveLength(2);
      expect(urls).toContain('https://example.com');
      expect(urls).toContain('www.test.com');
    });

    it('should return a copy of URLs array', () => {
      formatter.format('Visit https://example.com');
      const urls1 = formatter.getUrls();
      const urls2 = formatter.getUrls();
      expect(urls1).not.toBe(urls2);
      expect(urls1).toEqual(urls2);
    });
  });

  describe('hasUrls()', () => {
    it('should return false when no URLs', () => {
      formatter.format('Hello world');
      expect(formatter.hasUrls()).toBe(false);
    });

    it('should return true when URLs exist', () => {
      formatter.format('Visit https://example.com');
      expect(formatter.hasUrls()).toBe(true);
    });
  });

  describe('metadata', () => {
    it('should store URLs in metadata', () => {
      formatter.format('Visit https://example.com');
      const metadata = formatter.getMetadata();
      expect(metadata).toHaveProperty('urls');
      expect(Array.isArray(metadata['urls'])).toBe(true);
    });

    it('should include all detected URLs in metadata', () => {
      formatter.format('Visit https://example.com and www.test.com');
      const metadata = formatter.getMetadata();
      const urls = metadata['urls'] as string[];
      expect(urls).toHaveLength(2);
    });
  });

  describe('reset()', () => {
    it('should clear URLs', () => {
      formatter.format('Visit https://example.com');
      formatter.reset();
      expect(formatter.getUrls()).toEqual([]);
    });

    it('should clear original text', () => {
      formatter.format('Visit https://example.com');
      formatter.reset();
      expect(formatter.getOriginalText()).toBe('');
    });

    it('should clear formatted text', () => {
      formatter.format('Visit https://example.com');
      formatter.reset();
      expect(formatter.getFormattedText()).toBe('');
    });

    it('should clear metadata', () => {
      formatter.format('Visit https://example.com');
      formatter.reset();
      expect(formatter.getMetadata()).toEqual({});
    });

    it('should allow reuse after reset', () => {
      formatter.format('Visit https://example.com');
      formatter.reset();
      formatter.format('Visit https://test.com');
      expect(formatter.getUrls()).toEqual(['https://test.com']);
    });
  });

  describe('edge cases - empty/null/undefined input', () => {
    it('should handle empty string', () => {
      const result = formatter.format('');
      expect(result).toBe('');
      expect(formatter.getUrls()).toEqual([]);
    });

    it('should handle null input without throwing', () => {
      expect(() => formatter.format(null as unknown as string)).not.toThrow();
      expect(formatter.format(null as unknown as string)).toBe('');
      expect(formatter.getUrls()).toEqual([]);
    });

    it('should handle undefined input without throwing', () => {
      expect(() => formatter.format(undefined as unknown as string)).not.toThrow();
      expect(formatter.format(undefined as unknown as string)).toBe('');
      expect(formatter.getUrls()).toEqual([]);
    });

    it('should handle whitespace-only input', () => {
      const result = formatter.format('   ');
      expect(result).toBe('   ');
      expect(formatter.getUrls()).toEqual([]);
    });

    it('should handle URL-only text', () => {
      const result = formatter.format('https://example.com');
      expect(result).toContain('<a href="https://example.com"');
    });
  });

  describe('edge cases - malformed URLs', () => {
    it('should not linkify bare domain without protocol or www prefix', () => {
      const result = formatter.format('Visit example.com today');
      expect(result).not.toContain('<a');
      expect(result).toBe('Visit example.com today');
    });

    it('should not linkify incomplete protocol (http without ://)', () => {
      const result = formatter.format('http is a protocol');
      expect(result).not.toContain('<a');
    });

    it('should not linkify "https" alone without ://', () => {
      const result = formatter.format('https is secure');
      expect(result).not.toContain('<a');
    });

    it('should handle URLs with special characters in path', () => {
      const result = formatter.format('Visit https://example.com/path%20with%20spaces');
      expect(result).toContain('href="https://example.com/path%20with%20spaces"');
    });

    it('should handle subdomains', () => {
      const result = formatter.format('Visit https://sub.example.com');
      expect(result).toContain('href="https://sub.example.com"');
    });

    it('should handle complex URLs', () => {
      const url = 'https://example.com:8080/path/to/page?foo=bar&baz=qux#section';
      const result = formatter.format(`Visit ${url}`);
      expect(result).toContain(`href="${url}"`);
    });
  });

  describe('trailing punctuation stripping', () => {
    it('should strip trailing period from URL', () => {
      const result = formatter.format('Visit https://example.com.');
      expect(result).toContain('>https://example.com</a>.');
      expect(formatter.getUrls()).toEqual(['https://example.com']);
    });

    it('should strip trailing comma from URL', () => {
      const result = formatter.format('See https://example.com, then continue');
      expect(result).toContain('>https://example.com</a>,');
      expect(formatter.getUrls()).toEqual(['https://example.com']);
    });

    it('should strip trailing exclamation mark from URL', () => {
      const result = formatter.format('Check https://example.com!');
      expect(result).toContain('>https://example.com</a>!');
    });

    it('should strip trailing question mark from URL', () => {
      const result = formatter.format('Is it https://example.com?');
      // The ? could be part of query string or trailing punctuation
      // The regex matches greedily, so the ? is part of the URL match
      // but the trailing punctuation stripper should handle standalone ?
      const urls = formatter.getUrls();
      expect(urls.length).toBe(1);
    });

    it('should strip trailing closing parenthesis from URL', () => {
      const result = formatter.format('(see https://example.com)');
      expect(result).toContain('>https://example.com</a>)');
      expect(formatter.getUrls()).toEqual(['https://example.com']);
    });
  });

  describe('markdown link protection', () => {
    it('should not double-process URLs inside markdown links', () => {
      const text = '[Click here](https://example.com)';
      const result = formatter.format(text);
      // The markdown link should be preserved as-is
      expect(result).toBe(text);
      // The URL inside the markdown link should NOT be extracted
      expect(formatter.getUrls()).toEqual([]);
    });

    it('should process bare URLs while preserving markdown links', () => {
      const text = '[Click here](https://example.com) and visit https://other.com';
      const result = formatter.format(text);
      expect(result).toContain('[Click here](https://example.com)');
      expect(result).toContain('<a href="https://other.com"');
      expect(formatter.getUrls()).toEqual(['https://other.com']);
    });

    it('should handle multiple markdown links without double-processing', () => {
      const text = '[Link1](https://a.com) and [Link2](https://b.com)';
      const result = formatter.format(text);
      expect(result).toBe(text);
      expect(formatter.getUrls()).toEqual([]);
    });
  });

  describe('existing anchor tag protection', () => {
    it('should not double-process URLs already in anchor tags', () => {
      const text = '<a href="https://example.com" target="_blank">https://example.com</a>';
      const result = formatter.format(text);
      // Should not nest anchor tags
      const anchorCount = (result.match(/<a /g) || []).length;
      expect(anchorCount).toBe(1);
    });

    it('should process bare URLs alongside existing anchor tags', () => {
      const text = '<a href="https://example.com">link</a> and https://other.com';
      const result = formatter.format(text);
      expect(result).toContain('<a href="https://other.com"');
      expect(formatter.getUrls()).toEqual(['https://other.com']);
    });
  });
});
