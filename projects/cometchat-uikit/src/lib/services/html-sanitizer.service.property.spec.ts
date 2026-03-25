/**
 * HtmlSanitizerService Property-Based Tests
 *
 * Categories: Property-Based Safety Invariants, XSS Prevention, Sanitization Guarantees
 * Validates: Requirements 12.1, 11.5
 *
 * Property 1: HTML Sanitizer Safety Invariant
 * For any arbitrary HTML string, sanitized output never contains <script>, <iframe>,
 * onclick, onerror, or javascript: patterns.
 *
 * @module services/html-sanitizer.property
 */
vi.mock('@cometchat/calls-sdk-javascript', () => ({ default: {} }));

import { TestBed } from '@angular/core/testing';
import { vi, beforeAll, afterAll, beforeEach, describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { HtmlSanitizerService } from './html-sanitizer.service';
import { ensureSdkReady, sdkCleanup } from '../test-setup';

/**
 * Dangerous patterns that must NEVER appear in sanitized output.
 * Checked case-insensitively.
 */
const DANGEROUS_PATTERNS = [
  /<script[\s>]/i,
  /<\/script>/i,
  /<iframe[\s>]/i,
  /<\/iframe>/i,
  /\bonclick\s*=/i,
  /\bonerror\s*=/i,
  /\bonload\s*=/i,
  /\bonmouseover\s*=/i,
  /\bonfocus\s*=/i,
  /javascript\s*:/i,
];

/**
 * Asserts that none of the dangerous patterns are present in the given string.
 */
function assertNoDangerousPatterns(output: string): void {
  for (const pattern of DANGEROUS_PATTERNS) {
    expect(output).not.toMatch(pattern);
  }
}

describe('HtmlSanitizerService — Property-Based Tests', () => {
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

  // ---------- Property 1: HTML Sanitizer Safety Invariant ----------

  describe('Property 1: HTML Sanitizer Safety Invariant', () => {
    /**
     * **Validates: Requirements 12.1, 11.5**
     *
     * For any arbitrary string, sanitize() output never contains dangerous patterns.
     */
    it('should never produce dangerous patterns for arbitrary strings (fc.string)', () => {
      fc.assert(
        fc.property(fc.string(), input => {
          const result = service.sanitize(input);
          assertNoDangerousPatterns(result);
        }),
        { numRuns: 200 }
      );
    });

    /**
     * **Validates: Requirements 12.1, 11.5**
     *
     * For any arbitrary unicode string (including special chars), sanitize() is safe.
     */
    it('should never produce dangerous patterns for unicode strings', () => {
      fc.assert(
        fc.property(
          fc.string({ unit: 'grapheme', minLength: 0, maxLength: 200 }),
          (input: string) => {
            const result = service.sanitize(input);
            assertNoDangerousPatterns(result);
          }
        ),
        { numRuns: 150 }
      );
    });

    /**
     * **Validates: Requirements 12.1, 11.5**
     *
     * For strings that deliberately contain HTML-like fragments, sanitize() strips danger.
     */
    it('should never produce dangerous patterns for HTML-like fragments', () => {
      const htmlFragment = fc.oneof(
        fc.constant('<script>alert("xss")</script>'),
        fc.constant('<iframe src="evil.com"></iframe>'),
        fc.constant('<img onerror="alert(1)" src=x>'),
        fc.constant('<div onclick="steal()">click</div>'),
        fc.constant('<a href="javascript:void(0)">link</a>'),
        fc.constant('<svg onload="alert(1)">'),
        fc.constant('<body onload="alert(1)">'),
        fc.constant('<input onfocus="alert(1)">'),
        fc.constant('<marquee onstart="alert(1)">'),
        fc.constant('<details ontoggle="alert(1)">')
      );

      const arbitraryWithHtml = fc
        .tuple(fc.string(), htmlFragment, fc.string())
        .map(([before, dangerous, after]) => `${before}${dangerous}${after}`);

      fc.assert(
        fc.property(arbitraryWithHtml, input => {
          const result = service.sanitize(input);
          assertNoDangerousPatterns(result);
        }),
        { numRuns: 200 }
      );
    });

    /**
     * **Validates: Requirements 12.1, 11.5**
     *
     * For strings with randomized tag names and event handler attributes, sanitize() is safe.
     */
    it('should never produce dangerous patterns for random tag + event handler combos', () => {
      const tagName = fc.stringMatching(/^[a-z]{1,10}$/);
      const eventHandler = fc.oneof(
        fc.constant('onclick'),
        fc.constant('onerror'),
        fc.constant('onload'),
        fc.constant('onmouseover'),
        fc.constant('onfocus')
      );
      const payload = fc.string({ minLength: 0, maxLength: 50 });

      const maliciousHtml = fc
        .tuple(tagName, eventHandler, payload)
        .map(([tag, handler, val]) => `<${tag} ${handler}="${val}">content</${tag}>`);

      fc.assert(
        fc.property(maliciousHtml, input => {
          const result = service.sanitize(input);
          assertNoDangerousPatterns(result);
        }),
        { numRuns: 200 }
      );
    });

    /**
     * **Validates: Requirements 12.1, 11.5**
     *
     * For strings with javascript: protocol variations, sanitize() strips them.
     */
    it('should never produce dangerous patterns for javascript: protocol variations', () => {
      const jsProtocol = fc.oneof(
        fc.constant('javascript:alert(1)'),
        fc.constant('JAVASCRIPT:alert(1)'),
        fc.constant('JavaScript:void(0)'),
        fc.constant('java\tscript:alert(1)'),
        fc.constant('java\nscript:alert(1)'),
        fc.constant(' javascript:alert(1)')
      );

      const hrefPayload = fc
        .tuple(jsProtocol, fc.string())
        .map(([proto, text]) => `<a href="${proto}">${text}</a>`);

      fc.assert(
        fc.property(hrefPayload, input => {
          const result = service.sanitize(input);
          assertNoDangerousPatterns(result);
        }),
        { numRuns: 150 }
      );
    });

    /**
     * **Validates: Requirements 12.1, 11.5**
     *
     * sanitizeWithConfig() also never produces dangerous patterns with restrictive config.
     */
    it('should never produce dangerous patterns via sanitizeWithConfig with restrictive config', () => {
      const restrictiveConfig = {
        ALLOWED_TAGS: ['span', 'strong', 'em'],
        ALLOWED_ATTR: ['class'],
      };

      fc.assert(
        fc.property(fc.string(), input => {
          const result = service.sanitizeWithConfig(input, restrictiveConfig);
          assertNoDangerousPatterns(result);
        }),
        { numRuns: 150 }
      );
    });

    /**
     * **Validates: Requirements 12.1, 11.5**
     *
     * Nested/recursive dangerous tags are fully stripped.
     */
    it('should strip nested dangerous tags at any depth', () => {
      const depth = fc.integer({ min: 1, max: 5 });
      const nestedScript = depth.map(d => {
        let html = 'payload';
        for (let i = 0; i < d; i++) {
          html = `<script>${html}</script>`;
        }
        return html;
      });

      fc.assert(
        fc.property(nestedScript, input => {
          const result = service.sanitize(input);
          assertNoDangerousPatterns(result);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * **Validates: Requirements 12.1, 11.5**
     *
     * Sanitized output is always a string (never null/undefined/throws).
     */
    it('should always return a string for any input', () => {
      fc.assert(
        fc.property(fc.string(), input => {
          const result = service.sanitize(input);
          expect(typeof result).toBe('string');
        }),
        { numRuns: 100 }
      );
    });

    /**
     * **Validates: Requirements 12.1, 11.5**
     *
     * Idempotency: sanitizing already-sanitized output produces the same result.
     */
    it('should be idempotent — sanitize(sanitize(x)) === sanitize(x)', () => {
      fc.assert(
        fc.property(fc.string(), input => {
          const once = service.sanitize(input);
          const twice = service.sanitize(once);
          expect(twice).toBe(once);
        }),
        { numRuns: 150 }
      );
    });

    /**
     * **Validates: Requirements 12.1, 11.5**
     *
     * Mixed safe + dangerous content: safe parts survive, dangerous parts are stripped.
     */
    it('should preserve safe content while stripping dangerous content', () => {
      const safeText = fc.string({ minLength: 1, maxLength: 30 }).filter(s => !/[<>&"']/.test(s));
      const dangerousTag = fc.oneof(
        fc.constant('<script>evil()</script>'),
        fc.constant('<iframe src="x"></iframe>'),
        fc.constant('<img onerror="x" src=x>')
      );

      fc.assert(
        fc.property(fc.tuple(safeText, dangerousTag, safeText), ([before, danger, after]) => {
          const input = `${before}${danger}${after}`;
          const result = service.sanitize(input);
          assertNoDangerousPatterns(result);
          // Safe text should survive
          expect(result).toContain(before);
          expect(result).toContain(after);
        }),
        { numRuns: 100 }
      );
    });
  });
});
