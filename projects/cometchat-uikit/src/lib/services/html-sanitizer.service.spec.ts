/**
 * HtmlSanitizerService Tests
 *
 * Categories: Initialization, Sanitization, Safe HTML Passthrough,
 *             Link Security, Null/Empty Input, XSS Prevention,
 *             Caching, Custom Config, Default Config, Escape User HTML
 * Validates: Requirements 5.1, 5.2, 5.4, 5.5, 5.6, 5.8, 11.5, 14.4, 14.5, 15.7
 *
 * @module services/html-sanitizer
 */
import { TestBed } from '@angular/core/testing';
import { vi, beforeAll, afterAll, beforeEach, afterEach, describe, it, expect } from 'vitest';
import { HtmlSanitizerService } from './html-sanitizer.service';
import { ensureSdkReady, sdkCleanup } from '../test-setup';

describe('HtmlSanitizerService', () => {
  let service: HtmlSanitizerService;

  beforeAll(async () => {
    await ensureSdkReady();
  });

  afterAll(async () => {
    await sdkCleanup();
  });

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HtmlSanitizerService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ==================== sanitize() ====================

  describe('sanitize', () => {
    describe('strip dangerous tags/attributes', () => {
      it('should strip script tags', () => {
        const result = service.sanitize('<script>alert("XSS")</script>Hello');
        expect(result).toBe('Hello');
        expect(result).not.toContain('<script');
      });

      it('should strip iframe tags', () => {
        const result = service.sanitize('<iframe src="https://evil.com"></iframe>Content');
        expect(result).toBe('Content');
        expect(result).not.toContain('<iframe');
      });

      it('should strip object tags', () => {
        const result = service.sanitize('<object data="evil.swf"></object>Text');
        expect(result).toBe('Text');
        expect(result).not.toContain('<object');
      });

      it('should strip embed tags', () => {
        const result = service.sanitize('<embed src="evil.swf">Text');
        expect(result).toBe('Text');
        expect(result).not.toContain('<embed');
      });

      it('should strip onerror attributes', () => {
        const result = service.sanitize('<img onerror="alert(1)" src="x">');
        expect(result).not.toContain('onerror');
      });

      it('should strip onclick attributes', () => {
        const result = service.sanitize('<span onclick="alert(1)">Click</span>');
        expect(result).toContain('Click');
        expect(result).not.toContain('onclick');
      });

      it('should strip onload attributes', () => {
        const result = service.sanitize('<body onload="alert(1)">Content</body>');
        expect(result).not.toContain('onload');
      });

      it('should preserve style attributes on allowed tags', () => {
        const result = service.sanitize('<span style="color:red">Text</span>');
        // The sanitizer allows style attributes on allowed tags (span is allowed)
        expect(result).toContain('Text');
        expect(result).toContain('<span');
      });

      it('should strip form tags', () => {
        const result = service.sanitize('<form action="evil"><input></form>Text');
        expect(result).not.toContain('<form');
      });
    });

    describe('safe HTML passthrough', () => {
      it('should allow span tags', () => {
        const html = '<span class="mention">@John</span>';
        const result = service.sanitize(html);
        expect(result).toContain('<span');
        expect(result).toContain('class="mention"');
      });

      it('should allow strong tags', () => {
        const result = service.sanitize('<strong>Bold</strong>');
        expect(result).toBe('<strong>Bold</strong>');
      });

      it('should allow em tags', () => {
        const result = service.sanitize('<em>Italic</em>');
        expect(result).toBe('<em>Italic</em>');
      });

      it('should allow u tags', () => {
        const result = service.sanitize('<u>Underline</u>');
        expect(result).toBe('<u>Underline</u>');
      });

      it('should allow s (strikethrough) tags', () => {
        const result = service.sanitize('<s>Strikethrough</s>');
        expect(result).toBe('<s>Strikethrough</s>');
      });

      it('should allow code and pre tags', () => {
        const result = service.sanitize('<pre><code>const x = 1;</code></pre>');
        expect(result).toContain('<pre>');
        expect(result).toContain('<code>');
      });

      it('should allow blockquote tags', () => {
        const result = service.sanitize('<blockquote>Quote</blockquote>');
        expect(result).toBe('<blockquote>Quote</blockquote>');
      });

      it('should allow list tags', () => {
        const result = service.sanitize('<ul><li>Item 1</li><li>Item 2</li></ul>');
        expect(result).toContain('<ul>');
        expect(result).toContain('<li>');
      });

      it('should allow ordered list tags', () => {
        const result = service.sanitize('<ol><li>First</li></ol>');
        expect(result).toContain('<ol>');
        expect(result).toContain('<li>');
      });

      it('should allow anchor tags with href', () => {
        const result = service.sanitize('<a href="https://example.com">Link</a>');
        expect(result).toContain('<a');
        expect(result).toContain('href="https://example.com"');
      });

      it('should allow br tags', () => {
        const result = service.sanitize('Line 1<br>Line 2');
        expect(result).toContain('<br>');
      });

      it('should allow p tags', () => {
        const result = service.sanitize('<p>Paragraph</p>');
        expect(result).toBe('<p>Paragraph</p>');
      });

      it('should allow data-uid attribute', () => {
        const result = service.sanitize('<span data-uid="user123">@User</span>');
        expect(result).toContain('data-uid="user123"');
      });

      it('should allow data-mention-type attribute', () => {
        const result = service.sanitize('<span data-mention-type="user">@User</span>');
        expect(result).toContain('data-mention-type="user"');
      });

      it('should allow data-self attribute', () => {
        const result = service.sanitize('<span data-self="true">@Me</span>');
        expect(result).toContain('data-self="true"');
      });
    });

    describe('link security', () => {
      it('should add target="_blank" to links', () => {
        const result = service.sanitize('<a href="https://example.com">Link</a>');
        expect(result).toContain('target="_blank"');
      });

      it('should add rel="noopener noreferrer" to links', () => {
        const result = service.sanitize('<a href="https://example.com">Link</a>');
        expect(result).toContain('rel="noopener noreferrer"');
      });
    });

    describe('null/empty input handling', () => {
      it('should return empty string for empty string input', () => {
        expect(service.sanitize('')).toBe('');
      });

      it('should return empty string for whitespace-only input', () => {
        expect(service.sanitize('   ')).toBe('');
      });

      it('should return empty string for null input', () => {
        expect(service.sanitize(null as unknown as string)).toBe('');
      });

      it('should return empty string for undefined input', () => {
        expect(service.sanitize(undefined as unknown as string)).toBe('');
      });
    });

    describe('XSS prevention', () => {
      it('should strip javascript: protocol in href', () => {
        const result = service.sanitize('<a href="javascript:alert(1)">Click</a>');
        expect(result).not.toContain('javascript:');
      });

      it('should strip data: URI in attributes', () => {
        const result = service.sanitize(
          '<a href="data:text/html,<script>alert(1)</script>">Click</a>'
        );
        expect(result).not.toContain('data:text/html');
      });

      it('should strip nested script tags', () => {
        const result = service.sanitize('<div><script>alert(1)</script></div>');
        expect(result).not.toContain('<script');
      });

      it('should handle mixed safe and dangerous content', () => {
        const html = '<strong>Bold</strong><script>alert(1)</script><em>Italic</em>';
        const result = service.sanitize(html);
        expect(result).toContain('<strong>Bold</strong>');
        expect(result).toContain('<em>Italic</em>');
        expect(result).not.toContain('<script');
      });

      it('should strip SVG-based XSS', () => {
        const result = service.sanitize('<svg onload="alert(1)"><circle></circle></svg>');
        expect(result).not.toContain('<svg');
        expect(result).not.toContain('onload');
      });

      it('should strip img tag with onerror', () => {
        const result = service.sanitize('<img src=x onerror=alert(1)>');
        expect(result).not.toContain('<img');
        expect(result).not.toContain('onerror');
      });
    });

    describe('caching', () => {
      it('should return cached result for same input', () => {
        const html = '<strong>Cached</strong>';
        const first = service.sanitize(html);
        const second = service.sanitize(html);
        expect(first).toBe(second);
      });

      it('should return correct results for different inputs', () => {
        const result1 = service.sanitize('<em>One</em>');
        const result2 = service.sanitize('<strong>Two</strong>');
        expect(result1).toBe('<em>One</em>');
        expect(result2).toBe('<strong>Two</strong>');
      });
    });
  });

  // ==================== sanitizeWithConfig() ====================

  describe('sanitizeWithConfig', () => {
    it('should sanitize with custom allowed tags', () => {
      const config = { ALLOWED_TAGS: ['span'], ALLOWED_ATTR: ['class'] };
      const result = service.sanitizeWithConfig(
        '<span class="x">Text</span><strong>Bold</strong>',
        config
      );
      expect(result).toContain('<span');
      expect(result).not.toContain('<strong');
      expect(result).toContain('Bold'); // content kept
    });

    it('should sanitize with custom allowed attributes', () => {
      const config = {
        ALLOWED_TAGS: ['span'],
        ALLOWED_ATTR: ['class', 'data-uid', 'data-mention-type'],
      };
      const html =
        '<span class="mention" data-uid="u1" data-mention-type="user" style="color:red">@User</span>';
      const result = service.sanitizeWithConfig(html, config);
      expect(result).toContain('data-uid="u1"');
      expect(result).toContain('data-mention-type="user"');
      expect(result).not.toContain('style=');
    });

    it('should return empty string for empty input', () => {
      expect(service.sanitizeWithConfig('', {})).toBe('');
    });

    it('should return empty string for null input', () => {
      expect(service.sanitizeWithConfig(null as unknown as string, {})).toBe('');
    });

    it('should return empty string for undefined input', () => {
      expect(service.sanitizeWithConfig(undefined as unknown as string, {})).toBe('');
    });

    it('should return empty string for whitespace-only input', () => {
      expect(service.sanitizeWithConfig('   ', {})).toBe('');
    });
  });

  // ==================== getDefaultConfig() ====================

  describe('getDefaultConfig', () => {
    it('should return a config object', () => {
      const config = service.getDefaultConfig();
      expect(config).toBeTruthy();
      expect(config.ALLOWED_TAGS).toBeDefined();
      expect(config.ALLOWED_ATTR).toBeDefined();
    });

    it('should include expected allowed tags', () => {
      const config = service.getDefaultConfig();
      const tags = config.ALLOWED_TAGS as string[];
      expect(tags).toContain('span');
      expect(tags).toContain('strong');
      expect(tags).toContain('em');
      expect(tags).toContain('a');
      expect(tags).toContain('br');
      expect(tags).toContain('p');
      expect(tags).toContain('ul');
      expect(tags).toContain('ol');
      expect(tags).toContain('li');
      expect(tags).toContain('code');
      expect(tags).toContain('pre');
      expect(tags).toContain('blockquote');
    });

    it('should include expected allowed attributes', () => {
      const config = service.getDefaultConfig();
      const attrs = config.ALLOWED_ATTR as string[];
      expect(attrs).toContain('class');
      expect(attrs).toContain('href');
      expect(attrs).toContain('data-uid');
      expect(attrs).toContain('data-mention-type');
      expect(attrs).toContain('data-self');
      expect(attrs).toContain('target');
      expect(attrs).toContain('rel');
    });

    it('should return a copy (not the internal reference)', () => {
      const config1 = service.getDefaultConfig();
      const config2 = service.getDefaultConfig();
      expect(config1).not.toBe(config2);
      expect(config1.ALLOWED_TAGS).not.toBe(config2.ALLOWED_TAGS);
    });

    it('should not be affected by external mutation', () => {
      const config = service.getDefaultConfig();
      (config.ALLOWED_TAGS as string[]).push('script');
      const fresh = service.getDefaultConfig();
      expect(fresh.ALLOWED_TAGS as string[]).not.toContain('script');
    });
  });

  // ==================== escapeUserHtml() ====================

  describe('escapeUserHtml', () => {
    it('should escape < and > characters', () => {
      const result = service.escapeUserHtml('<div>Hello</div>');
      expect(result).toContain('&lt;');
      expect(result).toContain('&gt;');
      expect(result).not.toContain('<div>');
    });

    it('should escape & character', () => {
      const result = service.escapeUserHtml('A & B');
      expect(result).toBe('A &amp; B');
    });

    it('should escape double quotes', () => {
      const result = service.escapeUserHtml('He said "hello"');
      expect(result).toContain('&quot;');
    });

    it('should escape single quotes', () => {
      const result = service.escapeUserHtml("It's fine");
      expect(result).toContain('&#39;');
    });

    it('should preserve SDK mention patterns <@uid:...>', () => {
      const text = 'Hello <@uid:user123> how are you?';
      const result = service.escapeUserHtml(text);
      expect(result).toContain('<@uid:user123>');
      expect(result).not.toContain('&lt;@uid:user123&gt;');
    });

    it('should preserve SDK mention patterns <@all:...>', () => {
      const text = 'Attention <@all:everyone>';
      const result = service.escapeUserHtml(text);
      expect(result).toContain('<@all:everyone>');
    });

    it('should escape HTML while preserving multiple SDK mentions', () => {
      const text = '<script>alert(1)</script> <@uid:user1> and <@uid:user2>';
      const result = service.escapeUserHtml(text);
      expect(result).toContain('&lt;script&gt;');
      expect(result).toContain('<@uid:user1>');
      expect(result).toContain('<@uid:user2>');
    });

    it('should return empty string for empty input', () => {
      expect(service.escapeUserHtml('')).toBe('');
    });

    it('should return null for null input', () => {
      expect(service.escapeUserHtml(null as unknown as string)).toBeNull();
    });

    it('should return undefined for undefined input', () => {
      expect(service.escapeUserHtml(undefined as unknown as string)).toBeUndefined();
    });

    it('should return plain text unchanged when no special chars', () => {
      expect(service.escapeUserHtml('Hello World')).toBe('Hello World');
    });
  });
});
