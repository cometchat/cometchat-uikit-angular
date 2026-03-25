/**
 * URL Formatter Anchor Wrapping — Property-Based Tests
 *
 * Categories: Property-Based URL Wrapping Invariants, SDK URL Formatting
 * Validates: Requirements 6.8
 *
 * Property 24: URL Formatter Anchor Wrapping
 * For text with HTTP/HTTPS URLs, format() wraps each URL in `<a>` tag with matching href.
 *
 * @module formatters/url-formatter-anchor-wrapping.property
 */
vi.mock('@cometchat/calls-sdk-javascript', () => ({ default: {} }));

import { vi, beforeAll, afterAll, describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { ensureSdkReady, sdkCleanup } from '../test-setup';
import { CometChatUrlFormatter } from './cometchat-url-formatter';

// ==================== Helpers ====================

/**
 * Count occurrences of a substring in a string.
 */
function countOccurrences(str: string, sub: string): number {
  let count = 0;
  let pos = 0;
  while ((pos = str.indexOf(sub, pos)) !== -1) {
    count++;
    pos += sub.length;
  }
  return count;
}

/**
 * Extract all href values from anchor tags in an HTML string.
 */
function extractHrefs(html: string): string[] {
  const hrefs: string[] = [];
  const regex = /href="([^"]*)"/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html)) !== null) {
    hrefs.push(match[1]);
  }
  return hrefs;
}

// ==================== Arbitraries ====================

/** Arbitrary domain name (e.g., example.com, foo-bar.org). */
const arbDomain = fc
  .tuple(
    fc.stringMatching(/^[a-z]{3,10}$/),
    fc.constantFrom('.com', '.org', '.net', '.io', '.dev', '.co')
  )
  .map(([name, tld]) => `${name}${tld}`);

/** Arbitrary URL path segment. */
const arbPath = fc
  .array(fc.stringMatching(/^[a-z0-9]{1,8}$/), { minLength: 0, maxLength: 3 })
  .map(segments => (segments.length > 0 ? '/' + segments.join('/') : ''));

/** Arbitrary query string (simple key=value). */
const arbQuery = fc
  .array(fc.tuple(fc.stringMatching(/^[a-z]{2,6}$/), fc.stringMatching(/^[a-z0-9]{1,8}$/)), {
    minLength: 0,
    maxLength: 2,
  })
  .map(pairs => (pairs.length > 0 ? '?' + pairs.map(([k, v]) => `${k}=${v}`).join('&') : ''));

/** Arbitrary HTTP URL (http://domain/path?query). */
const arbHttpUrl = fc
  .tuple(arbDomain, arbPath, arbQuery)
  .map(([domain, path, query]) => `http://${domain}${path}${query}`);

/** Arbitrary HTTPS URL (https://domain/path?query). */
const arbHttpsUrl = fc
  .tuple(arbDomain, arbPath, arbQuery)
  .map(([domain, path, query]) => `https://${domain}${path}${query}`);

/** Arbitrary URL — either http or https. */
const arbUrl = fc.oneof(arbHttpUrl, arbHttpsUrl);

/** Arbitrary surrounding text that won't contain URL patterns. */
const arbSurroundText = fc
  .stringMatching(/^[a-zA-Z0-9 ,.\-!?;'"()+=]{1,30}$/)
  .filter(s => !s.match(/https?:\/\//i) && !s.match(/www\./i));

/** Arbitrary plain text with no URL patterns at all. */
const arbPlainText = fc
  .stringMatching(/^[a-zA-Z0-9 ,.\-!?;'"()+=]{0,100}$/)
  .filter(s => !s.match(/https?:\/\//i) && !s.match(/www\./i));

/** Arbitrary text with exactly one URL embedded. */
const arbTextWithOneUrl = fc
  .tuple(arbSurroundText, arbUrl, arbSurroundText)
  .map(([before, url, after]) => ({
    text: `${before} ${url} ${after}`,
    urls: [url],
  }));

/** Arbitrary text with 2–4 distinct URLs embedded. */
const arbTextWithMultipleUrls = fc
  .tuple(
    fc.array(fc.tuple(arbUrl, arbSurroundText), { minLength: 2, maxLength: 4 }),
    arbSurroundText
  )
  .map(([entries, trailing]) => {
    const urls = entries.map(([url]) => url);
    const text = entries.map(([url, surround]) => `${surround} ${url}`).join(' ') + ` ${trailing}`;
    return { text, urls };
  });

// ==================== Tests ====================

describe('Property 24: URL Formatter Anchor Wrapping', () => {
  beforeAll(async () => {
    await ensureSdkReady();
  }, 30000);

  afterAll(async () => {
    await sdkCleanup();
  });

  // ---------- 1. Single URL wrapping ----------

  describe('Single URL wrapping', () => {
    /**
     * **Validates: Requirements 6.8**
     *
     * For text with one HTTP/HTTPS URL, format() wraps the URL in an <a> tag.
     */
    it('wraps a single URL in an anchor tag', () => {
      fc.assert(
        fc.property(arbTextWithOneUrl, ({ text, urls }) => {
          const formatter = new CometChatUrlFormatter();
          const result = formatter.format(text);

          for (const url of urls) {
            expect(result).toContain(`<a `);
            expect(result).toContain(`href="`);
            expect(result).toContain(`</a>`);
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  // ---------- 2. href matches original URL ----------

  describe('href matches original URL', () => {
    /**
     * **Validates: Requirements 6.8**
     *
     * The href attribute in the anchor tag matches the original URL.
     */
    it('anchor href attribute matches the original URL', () => {
      fc.assert(
        fc.property(arbTextWithOneUrl, ({ text, urls }) => {
          const formatter = new CometChatUrlFormatter();
          const result = formatter.format(text);
          const hrefs = extractHrefs(result);

          for (const url of urls) {
            expect(hrefs).toContain(url);
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  // ---------- 3. URL count preservation ----------

  describe('URL count preservation', () => {
    /**
     * **Validates: Requirements 6.8**
     *
     * The number of <a> tags in the output equals the number of URLs in the input.
     */
    it('output contains exactly N anchor tags for N URLs', () => {
      fc.assert(
        fc.property(arbTextWithMultipleUrls, ({ text, urls }) => {
          const formatter = new CometChatUrlFormatter();
          const result = formatter.format(text);

          const anchorCount = countOccurrences(result, '</a>');
          expect(anchorCount).toBe(urls.length);
        }),
        { numRuns: 100 }
      );
    });
  });

  // ---------- 4. No URLs — identity property ----------

  describe('No URLs identity', () => {
    /**
     * **Validates: Requirements 6.8**
     *
     * For text with no URL patterns, format() returns the text unchanged.
     */
    it('returns text unchanged when no URLs are present', () => {
      fc.assert(
        fc.property(arbPlainText, text => {
          const formatter = new CometChatUrlFormatter();
          const result = formatter.format(text);
          expect(result).toBe(text);
        }),
        { numRuns: 100 }
      );
    });
  });

  // ---------- 5. Multiple URLs each get their own anchor ----------

  describe('Multiple URLs each wrapped', () => {
    /**
     * **Validates: Requirements 6.8**
     *
     * For text with multiple URLs, each URL is wrapped in its own <a> tag
     * with matching href.
     */
    it('wraps each URL in its own anchor tag with correct href', () => {
      fc.assert(
        fc.property(arbTextWithMultipleUrls, ({ text, urls }) => {
          const formatter = new CometChatUrlFormatter();
          const result = formatter.format(text);
          const hrefs = extractHrefs(result);

          for (const url of urls) {
            expect(hrefs).toContain(url);
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  // ---------- 6. Surrounding text preserved ----------

  describe('Surrounding text preserved', () => {
    /**
     * **Validates: Requirements 6.8**
     *
     * Text before and after URLs is preserved in the output.
     */
    it('preserves surrounding text around URLs', () => {
      fc.assert(
        fc.property(arbSurroundText, arbUrl, arbSurroundText, (before, url, after) => {
          const formatter = new CometChatUrlFormatter();
          const text = `${before} ${url} ${after}`;
          const result = formatter.format(text);

          expect(result).toContain(before);
          expect(result).toContain(after);
        }),
        { numRuns: 100 }
      );
    });
  });

  // ---------- 7. Anchor has target="_blank" ----------

  describe('Anchor target attribute', () => {
    /**
     * **Validates: Requirements 6.8**
     *
     * Each anchor tag includes target="_blank" for opening in new tab.
     */
    it('anchor tags include target="_blank"', () => {
      fc.assert(
        fc.property(arbTextWithOneUrl, ({ text }) => {
          const formatter = new CometChatUrlFormatter();
          const result = formatter.format(text);

          expect(result).toContain('target="_blank"');
        }),
        { numRuns: 100 }
      );
    });
  });

  // ---------- 8. Anchor has rel="noopener noreferrer" ----------

  describe('Anchor rel attribute', () => {
    /**
     * **Validates: Requirements 6.8**
     *
     * Each anchor tag includes rel="noopener noreferrer" for security.
     */
    it('anchor tags include rel="noopener noreferrer"', () => {
      fc.assert(
        fc.property(arbTextWithOneUrl, ({ text }) => {
          const formatter = new CometChatUrlFormatter();
          const result = formatter.format(text);

          expect(result).toContain('rel="noopener noreferrer"');
        }),
        { numRuns: 100 }
      );
    });
  });

  // ---------- 9. Anchor has cometchat-link CSS class ----------

  describe('Anchor CSS class', () => {
    /**
     * **Validates: Requirements 6.8**
     *
     * Each anchor tag includes the cometchat-link CSS class.
     */
    it('anchor tags include class="cometchat-link"', () => {
      fc.assert(
        fc.property(arbTextWithOneUrl, ({ text }) => {
          const formatter = new CometChatUrlFormatter();
          const result = formatter.format(text);

          expect(result).toContain('class="cometchat-link"');
        }),
        { numRuns: 100 }
      );
    });
  });

  // ---------- 10. URL at start of text ----------

  describe('URL at start of text', () => {
    /**
     * **Validates: Requirements 6.8**
     *
     * When a URL appears at the very start of the text, it is still wrapped.
     */
    it('wraps URL at the beginning of text', () => {
      fc.assert(
        fc.property(arbUrl, arbSurroundText, (url, after) => {
          const formatter = new CometChatUrlFormatter();
          const text = `${url} ${after}`;
          const result = formatter.format(text);

          expect(result).toContain(`<a `);
          expect(result).toContain(`</a>`);
          const hrefs = extractHrefs(result);
          expect(hrefs).toContain(url);
        }),
        { numRuns: 100 }
      );
    });
  });

  // ---------- 11. URL at end of text ----------

  describe('URL at end of text', () => {
    /**
     * **Validates: Requirements 6.8**
     *
     * When a URL appears at the very end of the text, it is still wrapped.
     */
    it('wraps URL at the end of text', () => {
      fc.assert(
        fc.property(arbSurroundText, arbUrl, (before, url) => {
          const formatter = new CometChatUrlFormatter();
          const text = `${before} ${url}`;
          const result = formatter.format(text);

          expect(result).toContain(`</a>`);
          const hrefs = extractHrefs(result);
          expect(hrefs).toContain(url);
        }),
        { numRuns: 100 }
      );
    });
  });

  // ---------- 12. getUrls() returns detected URLs ----------

  describe('getUrls() returns detected URLs', () => {
    /**
     * **Validates: Requirements 6.8**
     *
     * After format(), getUrls() returns an array containing the detected URLs.
     */
    it('getUrls() contains each URL from the input', () => {
      fc.assert(
        fc.property(arbTextWithMultipleUrls, ({ text, urls }) => {
          const formatter = new CometChatUrlFormatter();
          formatter.format(text);

          const detected = formatter.getUrls();
          for (const url of urls) {
            expect(detected).toContain(url);
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  // ---------- 13. hasUrls() returns true after formatting URLs ----------

  describe('hasUrls() after formatting', () => {
    /**
     * **Validates: Requirements 6.8**
     *
     * After format() with text containing URLs, hasUrls() returns true.
     */
    it('hasUrls() returns true after formatting text with URLs', () => {
      fc.assert(
        fc.property(arbTextWithOneUrl, ({ text }) => {
          const formatter = new CometChatUrlFormatter();
          formatter.format(text);

          expect(formatter.hasUrls()).toBe(true);
        }),
        { numRuns: 100 }
      );
    });
  });

  // ---------- 14. hasUrls() returns false for plain text ----------

  describe('hasUrls() for plain text', () => {
    /**
     * **Validates: Requirements 6.8**
     *
     * After format() with text containing no URLs, hasUrls() returns false.
     */
    it('hasUrls() returns false after formatting text without URLs', () => {
      fc.assert(
        fc.property(arbPlainText, text => {
          const formatter = new CometChatUrlFormatter();
          formatter.format(text);

          expect(formatter.hasUrls()).toBe(false);
        }),
        { numRuns: 100 }
      );
    });
  });

  // ---------- 15. URL display text matches original URL ----------

  describe('URL display text in anchor', () => {
    /**
     * **Validates: Requirements 6.8**
     *
     * The visible text inside the <a> tag matches the original URL.
     */
    it('anchor display text matches the original URL', () => {
      fc.assert(
        fc.property(arbSurroundText, arbUrl, arbSurroundText, (before, url, after) => {
          const formatter = new CometChatUrlFormatter();
          const text = `${before} ${url} ${after}`;
          const result = formatter.format(text);

          // The anchor should contain the URL as display text: >URL</a>
          expect(result).toContain(`>${url}</a>`);
        }),
        { numRuns: 100 }
      );
    });
  });

  // ---------- 16. HTTP and HTTPS both handled ----------

  describe('HTTP and HTTPS both handled', () => {
    /**
     * **Validates: Requirements 6.8**
     *
     * Both http:// and https:// URLs are wrapped in anchor tags.
     */
    it('wraps both http and https URLs', () => {
      fc.assert(
        fc.property(arbDomain, arbPath, (domain, path) => {
          const formatter = new CometChatUrlFormatter();
          const httpUrl = `http://${domain}${path}`;
          const httpsUrl = `https://${domain}${path}`;
          const text = `Visit ${httpUrl} or ${httpsUrl} for info`;
          const result = formatter.format(text);

          const hrefs = extractHrefs(result);
          expect(hrefs).toContain(httpUrl);
          expect(hrefs).toContain(httpsUrl);
          expect(countOccurrences(result, '</a>')).toBe(2);
        }),
        { numRuns: 100 }
      );
    });
  });
});
