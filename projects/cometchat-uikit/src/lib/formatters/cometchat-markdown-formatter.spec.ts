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
      expect(formatter.format('`code`')).toContain('<code');
      expect(formatter.format('`code`')).toContain('>code</code>');
    });

    it('should convert inline code within a sentence', () => {
      const result = formatter.format('Use `npm install` to install');
      expect(result).toContain('<code');
      expect(result).toContain('>npm install</code>');
      expect(result).toContain('Use ');
      expect(result).toContain(' to install');
    });

    it('should convert multiple inline code segments', () => {
      const result = formatter.format('`one` and `two`');
      expect(result).toContain('>one</code>');
      expect(result).toContain('>two</code>');
      expect(result).toContain(' and ');
    });
  });

  describe('format - code blocks', () => {
    it('should convert ```code``` to <pre><code>code</code></pre>', () => {
      const result = formatter.format('```code block```');
      expect(result).toContain('<pre');
      expect(result).toContain('<code');
      expect(result).toContain('>code block</code>');
      expect(result).toContain('</pre>');
    });

    it('should handle multiline code blocks', () => {
      const input = '```\nline1\nline2\n```';
      const result = formatter.format(input);
      expect(result).toContain('<pre');
      expect(result).toContain('<code');
      expect(result).toContain('line1');
      expect(result).toContain('line2');
      expect(result).toContain('</code>');
      expect(result).toContain('</pre>');
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
      expect(result).toContain('<blockquote');
      expect(result).toContain('quoted text');
      expect(result).toContain('</blockquote>');
    });

    it('should group consecutive blockquote lines', () => {
      const result = formatter.format('> line1\n> line2');
      expect(result).toContain('<blockquote');
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
      expect(result).toContain('>code</code>');
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
      expect(result).toContain('>code</code>');
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

  // Regression: CI 4 property-deep counterexample (seed -1158923461, path "293:11:19:19:28:26").
  // The `__` inside the formatter's own BEM classes was matched by the `__underline__` rule.
  describe('HTML tags are not re-read as markdown', () => {
    it('keeps class attributes intact for a fenced code block', () => {
      expect(formatter.format('```x```')).toBe(
        '<pre class="cometchat-rich-text__code-block"><code class="cometchat-rich-text__code">x</code></pre>'
      );
    });

    it('does not pair the blockquote class `__` with `__` in the quoted text', () => {
      expect(formatter.format('&gt; a__b')).toBe(
        '<blockquote class="cometchat-rich-text__blockquote">a__b</blockquote>'
      );
    });

    it('leaves underscores in tags from earlier formatters (mention data-uid) untouched', () => {
      const mentions =
        '<span class="cometchat-mentions" data-uid="a_b">@A</span> <span class="cometchat-mentions" data-uid="c_d">@C</span>';
      expect(formatter.format(mentions)).toBe(mentions);
    });

    it('is idempotent for a blockquote holding whitespace-only inline code (">` ` ")', () => {
      const once = formatter.format('>` ` ');
      expect(once).toBe(
        '<blockquote class="cometchat-rich-text__blockquote"><code class="cometchat-rich-text__code"> </code></blockquote>'
      );
      expect(new CometChatMarkdownFormatter().format(once)).toBe(once);
    });
  });

  // `_` and `*` in URLs, and `_` inside words, are not markdown (#632 review).
  describe('URLs and words keep their underscores', () => {
    const link = (href: string, text: string) => `<a href="${href}" target="_blank" rel="noopener noreferrer">${text}</a>`;

    it('keeps `_` in a link URL', () => {
      expect(formatter.format('[d](https://x.com/a_b_c)')).toBe(link('https://x.com/a_b_c', 'd'));
    });

    it('keeps `*` and `__` in a link URL', () => {
      expect(formatter.format('[d](https://x.com/a*b*c/__x__)')).toBe(link('https://x.com/a*b*c/__x__', 'd'));
    });

    it('still formats the link text', () => {
      expect(formatter.format('[**bold** _it_](https://x.com/a_b)')).toBe(link('https://x.com/a_b', '<strong>bold</strong> <em>it</em>'));
    });

    it('keeps a bare URL as typed, for the URL formatter to link', () => {
      expect(formatter.format('see https://x.com/_private_/a_b and www.y.com/c_d_e')).toBe(
        'see https://x.com/_private_/a_b and www.y.com/c_d_e'
      );
    });

    it('still formats markdown around a bare URL', () => {
      expect(formatter.format('**https://x.com/a_b**')).toBe('<strong>https://x.com/a_b</strong>');
      expect(formatter.format('_see https://x.com_')).toBe('<em>see https://x.com</em>');
    });

    it('leaves `_` inside a word alone, as CommonMark does', () => {
      expect(formatter.format('snake_case_name')).toBe('snake_case_name');
      expect(formatter.format('foo__bar__baz')).toBe('foo__bar__baz');
      expect(formatter.format('café_au_lait')).toBe('café_au_lait');
    });

    it('still formats `_italic_` and `__underline__` between words', () => {
      expect(formatter.format('an _italic_ word, (__under__)!')).toBe('an <em>italic</em> word, (<u>under</u>)!');
    });
  });
});
