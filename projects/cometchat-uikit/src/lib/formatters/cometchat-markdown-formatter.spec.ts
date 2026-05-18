import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { ensureSdkReady, sdkCleanup } from '../test-setup';
import { CometChatMarkdownFormatter } from './cometchat-markdown-formatter';

/**
 * Unit Tests for CometChatMarkdownFormatter
 *
 * Tests cover:
 * - Markdown syntax conversion (bold, italic, code, strikethrough) to HTML tags
 * - Underline, code blocks, links, blockquotes, ordered/unordered lists
 * - Empty input handling
 * - No-match passthrough (plain text returned unchanged)
 * - Reset clears state (originalText, formattedText, metadata)
 * - Nested/combined formatting
 * - shouldFormat() detection
 *
 * **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.9, 14.4, 14.5, 15.7**
 */

describe('CometChatMarkdownFormatter', () => {
  let formatter: CometChatMarkdownFormatter;

  beforeAll(async () => {
    await ensureSdkReady();
  });

  afterAll(async () => {
    await sdkCleanup();
  });

  beforeEach(() => {
    formatter = new CometChatMarkdownFormatter();
  });

  afterEach(() => {
    formatter.reset();
  });

  describe('id property', () => {
    it('should have id set to "markdown-formatter"', () => {
      expect(formatter.id).toBe('markdown-formatter');
    });
  });

  describe('priority property', () => {
    it('should have priority set to 30', () => {
      expect(formatter.priority).toBe(30);
    });
  });

  describe('getRegex', () => {
    it('should match bold syntax **text**', () => {
      expect(formatter.getRegex().test('**bold**')).toBe(true);
    });

    it('should match underline syntax __text__', () => {
      expect(formatter.getRegex().test('__underline__')).toBe(true);
    });

    it('should match strikethrough syntax ~~text~~', () => {
      expect(formatter.getRegex().test('~~strike~~')).toBe(true);
    });

    it('should match inline code syntax `code`', () => {
      expect(formatter.getRegex().test('`code`')).toBe(true);
    });

    it('should match link syntax [text](url)', () => {
      expect(formatter.getRegex().test('[link](http://example.com)')).toBe(true);
    });

    it('should not match plain text without markdown', () => {
      expect(formatter.getRegex().test('hello world')).toBe(false);
    });
  });

  describe('format - bold', () => {
    it('should convert **text** to <strong>text</strong>', () => {
      expect(formatter.format('**bold**')).toBe('<strong>bold</strong>');
    });

    it('should convert bold within a sentence', () => {
      expect(formatter.format('Hello **world** today')).toBe('Hello <strong>world</strong> today');
    });

    it('should convert multiple bold segments', () => {
      expect(formatter.format('**one** and **two**')).toBe(
        '<strong>one</strong> and <strong>two</strong>'
      );
    });
  });

  describe('format - italic', () => {
    it('should convert *text* to <em>text</em>', () => {
      expect(formatter.format('*italic*')).toBe('<em>italic</em>');
    });

    it('should convert italic within a sentence', () => {
      expect(formatter.format('Hello *world* today')).toBe('Hello <em>world</em> today');
    });

    it('should convert multiple italic segments', () => {
      expect(formatter.format('*one* and *two*')).toBe('<em>one</em> and <em>two</em>');
    });
  });

  describe('format - strikethrough', () => {
    it('should convert ~~text~~ to <s>text</s>', () => {
      expect(formatter.format('~~strike~~')).toBe('<s>strike</s>');
    });

    it('should convert strikethrough within a sentence', () => {
      expect(formatter.format('Hello ~~world~~ today')).toBe('Hello <s>world</s> today');
    });

    it('should convert multiple strikethrough segments', () => {
      expect(formatter.format('~~one~~ and ~~two~~')).toBe('<s>one</s> and <s>two</s>');
    });
  });

  describe('format - underline', () => {
    it('should convert __text__ to <u>text</u>', () => {
      expect(formatter.format('__underline__')).toBe('<u>underline</u>');
    });

    it('should convert underline within a sentence', () => {
      expect(formatter.format('Hello __world__ today')).toBe('Hello <u>world</u> today');
    });
  });

  describe('format - inline code', () => {
    it('should convert `code` to <code>code</code>', () => {
      expect(formatter.format('`code`')).toBe('<code>code</code>');
    });

    it('should convert inline code within a sentence', () => {
      expect(formatter.format('Use `npm install` to install')).toBe(
        'Use <code>npm install</code> to install'
      );
    });

    it('should convert multiple inline code segments', () => {
      expect(formatter.format('`one` and `two`')).toBe('<code>one</code> and <code>two</code>');
    });
  });

  describe('format - code blocks', () => {
    it('should convert ```code``` to <pre><code>code</code></pre>', () => {
      expect(formatter.format('```code block```')).toBe('<pre><code>code block</code></pre>');
    });

    it('should handle multiline code blocks', () => {
      const input = '```\nline1\nline2\n```';
      const result = formatter.format(input);
      expect(result).toContain('<pre><code>');
      expect(result).toContain('line1');
      expect(result).toContain('line2');
      expect(result).toContain('</code></pre>');
    });
  });

  describe('format - links', () => {
    it('should convert [text](url) to an anchor tag', () => {
      const result = formatter.format('[Click here](https://example.com)');
      expect(result).toBe(
        '<a href="https://example.com" target="_blank" rel="noopener noreferrer">Click here</a>'
      );
    });

    it('should convert links within a sentence', () => {
      const result = formatter.format('Visit [Google](https://google.com) now');
      expect(result).toContain('<a href="https://google.com"');
      expect(result).toContain('>Google</a>');
    });

    it('should convert multiple links', () => {
      const result = formatter.format('[A](https://a.com) and [B](https://b.com)');
      expect(result).toContain('<a href="https://a.com"');
      expect(result).toContain('<a href="https://b.com"');
    });
  });

  describe('format - blockquotes', () => {
    it('should convert > text to <blockquote>text</blockquote>', () => {
      const result = formatter.format('> quoted text');
      expect(result).toContain('<blockquote>');
      expect(result).toContain('quoted text');
      expect(result).toContain('</blockquote>');
    });

    it('should group consecutive blockquote lines', () => {
      const result = formatter.format('> line1\n> line2');
      expect(result).toContain('<blockquote>');
      expect(result).toContain('line1');
      expect(result).toContain('line2');
    });
  });

  describe('format - ordered lists', () => {
    it('should convert numbered items to <ol><li>', () => {
      const result = formatter.format('1. First\n2. Second');
      expect(result).toContain('<ol');
      expect(result).toContain('<li>First</li>');
      expect(result).toContain('<li>Second</li>');
      expect(result).toContain('</ol>');
    });
  });

  describe('format - unordered lists', () => {
    it('should convert dash items to <ul><li>', () => {
      const result = formatter.format('- Item A\n- Item B');
      expect(result).toContain('<ul');
      expect(result).toContain('<li>Item A</li>');
      expect(result).toContain('<li>Item B</li>');
      expect(result).toContain('</ul>');
    });

    it('should convert asterisk items to <ul><li>', () => {
      const result = formatter.format('* Item A\n* Item B');
      expect(result).toContain('<ul');
      expect(result).toContain('<li>Item A</li>');
      expect(result).toContain('<li>Item B</li>');
      expect(result).toContain('</ul>');
    });
  });

  describe('format - nested/combined formatting', () => {
    it('should handle bold inside italic context', () => {
      const result = formatter.format('**bold** and *italic*');
      expect(result).toContain('<strong>bold</strong>');
      expect(result).toContain('<em>italic</em>');
    });

    it('should handle strikethrough with bold', () => {
      const result = formatter.format('~~strike~~ and **bold**');
      expect(result).toContain('<s>strike</s>');
      expect(result).toContain('<strong>bold</strong>');
    });

    it('should handle code with other formatting', () => {
      const result = formatter.format('**bold** and `code`');
      expect(result).toContain('<strong>bold</strong>');
      expect(result).toContain('<code>code</code>');
    });

    it('should handle link with other formatting', () => {
      const result = formatter.format('**bold** and [link](https://example.com)');
      expect(result).toContain('<strong>bold</strong>');
      expect(result).toContain('<a href="https://example.com"');
    });

    it('should handle all inline formats in one string', () => {
      const result = formatter.format('**bold** *italic* ~~strike~~ `code` [link](https://x.com)');
      expect(result).toContain('<strong>bold</strong>');
      expect(result).toContain('<em>italic</em>');
      expect(result).toContain('<s>strike</s>');
      expect(result).toContain('<code>code</code>');
      expect(result).toContain('<a href="https://x.com"');
    });
  });

  describe('No-match passthrough', () => {
    it('should return plain text unchanged', () => {
      expect(formatter.format('Hello World')).toBe('Hello World');
    });

    it('should return text with no markdown patterns unchanged', () => {
      expect(formatter.format('Just a normal sentence.')).toBe('Just a normal sentence.');
    });

    it('should return numbers unchanged', () => {
      expect(formatter.format('12345')).toBe('12345');
    });

    it('should return special characters unchanged when not markdown', () => {
      expect(formatter.format('Hello & goodbye < world >')).toBe('Hello & goodbye < world >');
    });
  });

  describe('Empty/Null input handling', () => {
    it('should handle empty string input', () => {
      const result = formatter.format('');
      expect(result).toBe('');
    });

    it('should handle whitespace-only input', () => {
      const result = formatter.format('   ');
      expect(result).toBe('   ');
    });

    it('should return empty string on null input', () => {
      const result = formatter.format(null as unknown as string);
      expect(result).toBe('');
    });

    it('should return empty string on undefined input', () => {
      const result = formatter.format(undefined as unknown as string);
      expect(result).toBe('');
    });
  });

  describe('shouldFormat', () => {
    it('should return true for text with bold markdown', () => {
      expect(formatter.shouldFormat('**bold**')).toBe(true);
    });

    it('should return true for text with italic markdown', () => {
      // The regex detects * as a potential markdown marker
      expect(formatter.shouldFormat('*italic*')).toBe(true);
    });

    it('should return true for text with strikethrough', () => {
      expect(formatter.shouldFormat('~~strike~~')).toBe(true);
    });

    it('should return true for text with inline code', () => {
      expect(formatter.shouldFormat('`code`')).toBe(true);
    });

    it('should return true for text with links', () => {
      expect(formatter.shouldFormat('[text](url)')).toBe(true);
    });

    it('should return false for plain text', () => {
      expect(formatter.shouldFormat('Hello World')).toBe(false);
    });
  });

  describe('state management', () => {
    it('should store original text after format', () => {
      formatter.format('**bold**');
      expect(formatter.getOriginalText()).toBe('**bold**');
    });

    it('should store formatted text after format', () => {
      formatter.format('**bold**');
      expect(formatter.getFormattedText()).toBe('<strong>bold</strong>');
    });

    it('should clear state on reset', () => {
      formatter.format('**bold**');
      formatter.reset();
      expect(formatter.getOriginalText()).toBe('');
      expect(formatter.getFormattedText()).toBe('');
    });
  });
});
