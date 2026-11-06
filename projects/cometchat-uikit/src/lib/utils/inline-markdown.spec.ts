/**
 * Inline markdown → HTML Tests
 *
 * Covers: each inline marker, the single- vs double-marker disambiguation,
 * link scheme filtering, combined markers, and markers inside link URLs.
 *
 * @module utils/inline-markdown
 */

import { describe, it, expect } from 'vitest';
import { convertInlineMarkdownToHtml } from './inline-markdown';

describe('convertInlineMarkdownToHtml', () => {
  describe('empty input', () => {
    it('returns an empty string for an empty string', () => {
      expect(convertInlineMarkdownToHtml('')).toBe('');
    });

    it('returns an empty string for null/undefined passed through untyped callers', () => {
      expect(convertInlineMarkdownToHtml(null as unknown as string)).toBe('');
      expect(convertInlineMarkdownToHtml(undefined as unknown as string)).toBe('');
    });

    it('returns plain text unchanged', () => {
      expect(convertInlineMarkdownToHtml('hello world')).toBe('hello world');
    });
  });

  describe('single markers', () => {
    it('wraps backtick spans in <code>', () => {
      expect(convertInlineMarkdownToHtml('run `npm test` now')).toBe('run <code>npm test</code> now');
    });

    it('wraps **double asterisks** in <strong>', () => {
      expect(convertInlineMarkdownToHtml('a **bold** word')).toBe('a <strong>bold</strong> word');
    });

    it('wraps *single asterisks* in <strong> as well', () => {
      expect(convertInlineMarkdownToHtml('a *bold* word')).toBe('a <strong>bold</strong> word');
    });

    it('wraps __double underscores__ in <u>', () => {
      expect(convertInlineMarkdownToHtml('an __underlined__ word')).toBe('an <u>underlined</u> word');
    });

    it('wraps _single underscores_ in <em>', () => {
      expect(convertInlineMarkdownToHtml('an _italic_ word')).toBe('an <em>italic</em> word');
    });

    it('wraps ~~tildes~~ in <s>', () => {
      expect(convertInlineMarkdownToHtml('a ~~struck~~ word')).toBe('a <s>struck</s> word');
    });
  });

  describe('unbalanced / empty markers', () => {
    it('leaves a lone asterisk alone', () => {
      expect(convertInlineMarkdownToHtml('5 * 3')).toBe('5 * 3');
    });

    it('leaves empty double markers alone', () => {
      expect(convertInlineMarkdownToHtml('****')).toBe('****');
      expect(convertInlineMarkdownToHtml('~~~~')).toBe('~~~~');
    });

    it('leaves an unclosed backtick alone', () => {
      expect(convertInlineMarkdownToHtml('a `b c')).toBe('a `b c');
    });

    it('leaves a single tilde pair alone (strike needs two)', () => {
      expect(convertInlineMarkdownToHtml('~x~')).toBe('~x~');
    });
  });

  describe('links', () => {
    it('converts an https link into an anchor that opens in a new tab', () => {
      expect(convertInlineMarkdownToHtml('[site](https://example.com)')).toBe(
        '<a href="https://example.com" target="_blank" rel="noopener noreferrer">site</a>'
      );
    });

    it('converts an http link', () => {
      expect(convertInlineMarkdownToHtml('[x](http://a.b/c)')).toBe(
        '<a href="http://a.b/c" target="_blank" rel="noopener noreferrer">x</a>'
      );
    });

    it('does not linkify a javascript: URL', () => {
      expect(convertInlineMarkdownToHtml('[click](javascript:alert1)')).toBe('[click](javascript:alert1)');
    });

    it('does not linkify a scheme-less URL', () => {
      expect(convertInlineMarkdownToHtml('[x](example.com)')).toBe('[x](example.com)');
    });

    it('keeps underscores inside a link URL intact', () => {
      // The block-level converter (rich-text-editor.markdown-utils) protects links
      // with placeholders for exactly this reason; a URL is not emphasis.
      expect(convertInlineMarkdownToHtml('[docs](https://example.com/a_b_c)')).toBe(
        '<a href="https://example.com/a_b_c" target="_blank" rel="noopener noreferrer">docs</a>'
      );
    });
  });

  describe('combinations', () => {
    it('converts several markers in one line', () => {
      expect(convertInlineMarkdownToHtml('**b** _i_ ~~s~~ `c`')).toBe(
        '<strong>b</strong> <em>i</em> <s>s</s> <code>c</code>'
      );
    });

    it('converts every occurrence, not just the first', () => {
      expect(convertInlineMarkdownToHtml('**a** and **b**')).toBe('<strong>a</strong> and <strong>b</strong>');
    });

    it('formats a link label', () => {
      expect(convertInlineMarkdownToHtml('[**bold**](https://x.io)')).toBe(
        '<a href="https://x.io" target="_blank" rel="noopener noreferrer"><strong>bold</strong></a>'
      );
    });

    it('does not re-escape already-escaped entities', () => {
      expect(convertInlineMarkdownToHtml('&lt;b&gt; **x**')).toBe('&lt;b&gt; <strong>x</strong>');
    });
  });
});
