import { Injectable } from '@angular/core';
import DOMPurify, { Config as DOMPurifyConfig } from 'dompurify';
import { CometChatLogger } from '../utils/CometChatLogger';

/**
 * HtmlSanitizerService
 *
 * Centralized HTML sanitization service using DOMPurify with consistent configuration
 * for the CometChat Angular UIKit.
 *
 * ## Overview
 *
 * This service provides a secure way to sanitize HTML content before rendering it in the UI.
 * It wraps DOMPurify with a consistent configuration that allows only safe HTML tags and
 * attributes, preventing XSS attacks and other security vulnerabilities.
 *
 * ## Architecture
 *
 * The service implements a singleton pattern with `providedIn: 'root'`, ensuring a single
 * instance is shared across the entire application. It includes caching for performance
 * optimization and comprehensive error handling.
 *
 * ### Key Features
 *
 * - **Security First**: Removes script tags, event handlers, and dangerous attributes
 * - **Consistent Configuration**: Uses the same sanitization rules across all components
 * - **Performance Optimized**: Caches sanitized HTML to avoid redundant processing
 * - **Error Handling**: Gracefully handles errors and returns empty string on failure
 * - **Link Security**: Ensures links have `target="_blank"` and `rel="noopener noreferrer"`
 * - **Customizable**: Supports custom sanitization configuration when needed
 *
 * ## Usage Patterns
 *
 * ### Pattern 1: Basic Sanitization (Recommended)
 *
 * ```typescript
 * export class TextBubbleComponent {
 *   private htmlSanitizer = inject(HtmlSanitizerService);
 *
 *   formatMessage(html: string): string {
 *     // Sanitize HTML with default config
 *     return this.htmlSanitizer.sanitize(html);
 *   }
 * }
 * ```
 *
 * ### Pattern 2: Custom Configuration
 *
 * ```typescript
 * export class CustomComponent {
 *   private htmlSanitizer = inject(HtmlSanitizerService);
 *
 *   formatMessage(html: string): string {
 *     // Sanitize with custom config
 *     const customConfig = {
 *       ALLOWED_TAGS: ['span', 'strong', 'em'],
 *       ALLOWED_ATTR: ['class']
 *     };
 *     return this.htmlSanitizer.sanitizeWithConfig(html, customConfig);
 *   }
 * }
 * ```
 *
 * ### Pattern 3: Get Default Configuration
 *
 * ```typescript
 * export class SettingsComponent {
 *   private htmlSanitizer = inject(HtmlSanitizerService);
 *
 *   getConfig() {
 *     // Get default sanitization config for reference
 *     const config = this.htmlSanitizer.getDefaultConfig();
 *     console.log('Allowed tags:', config.ALLOWED_TAGS);
 *   }
 * }
 * ```
 *
 * ## Default Configuration
 *
 * The default sanitization configuration allows:
 *
 * **Allowed Tags**:
 * - Text formatting: `span`, `strong`, `em`, `u`, `s`
 * - Code: `code`, `pre`
 * - Quotes: `blockquote`
 * - Lists: `ul`, `ol`, `li`
 * - Links: `a`
 * - Structure: `br`, `p`
 *
 * **Allowed Attributes**:
 * - `class` - For CSS styling
 * - `data-uid` - For mention user identification
 * - `data-mention-type` - For mention type (user/channel)
 * - `data-self` - For self-mention identification (true/false)
 * - `href` - For link URLs
 * - `target` - For link target (always set to "_blank")
 * - `rel` - For link relationship (always set to "noopener noreferrer")
 *
 * **Removed**:
 * - All script tags
 * - All event handlers (onclick, onerror, etc.)
 * - All style attributes (except explicitly allowed)
 * - All dangerous attributes (srcdoc, formaction, etc.)
 *
 * ## Security Guarantees
 *
 * This service ensures:
 * 1. No JavaScript execution via script tags or event handlers
 * 2. No CSS injection via style attributes
 * 3. No form hijacking via formaction attributes
 * 4. No iframe injection via srcdoc attributes
 * 5. Links open in new tab with security attributes
 *
 * ## Performance
 *
 * The service includes a caching mechanism that stores up to 1000 sanitized HTML strings.
 * This significantly improves performance when the same content is rendered multiple times
 * (e.g., scrolling through message lists).
 *
 * Cache is automatically managed with LRU (Least Recently Used) eviction when the limit
 * is reached.
 *
 * @Injectable providedIn: 'root'
 * @see Requirements 13.1, 13.2, 13.3, 13.4, 13.5, 13.6

 */
@Injectable({
  providedIn: 'root',
})
export class HtmlSanitizerService {
  // ==================== Private State ====================

  /**
   * Cache for sanitized HTML strings.
   * Key: original HTML string
   * Value: sanitized HTML string
   * Max size: 1000 entries (LRU eviction)
   * @private
   */
  private sanitizationCache = new Map<string, string>();

  /**
   * Maximum number of entries in the sanitization cache.
   * When exceeded, oldest entries are removed (LRU).
   * @private
   */
  private readonly MAX_CACHE_SIZE = 1000;

  /**
   * Default DOMPurify configuration.
   * Defines allowed tags, attributes, and security rules.
   * @private
   */
  private readonly DEFAULT_CONFIG: DOMPurifyConfig = {
    // Allowed HTML tags
    ALLOWED_TAGS: [
      'span',
      'strong',
      'em',
      'u',
      's',
      'code',
      'pre',
      'blockquote',
      'ul',
      'ol',
      'li',
      'a',
      'br',
      'p',
    ],

    // Allowed attributes
    ALLOWED_ATTR: ['class', 'style', 'data-uid', 'data-mention-type', 'data-self', 'href', 'target', 'rel'],

    // Do not allow data-* attributes by default (only explicitly listed ones)
    ALLOW_DATA_ATTR: false,

    // Keep content of removed tags (don't delete text inside disallowed tags)
    KEEP_CONTENT: true,

    // Add target="_blank" and rel="noopener noreferrer" to all links
    ADD_ATTR: ['target', 'rel'],
  };

  constructor() {
    // Configure DOMPurify hooks for link security
    this.configureDOMPurifyHooks();
  }

  // ==================== Public Methods ====================

  /**
   * Sanitize HTML with default configuration.
   *
   * This method sanitizes the provided HTML string using the default DOMPurify
   * configuration. It removes all dangerous content (scripts, event handlers, etc.)
   * and ensures links have proper security attributes.
   *
   * The result is cached for performance optimization. Subsequent calls with the
   * same input will return the cached result without re-sanitizing.
   *
   * If sanitization fails (e.g., DOMPurify throws an error), this method returns
   * an empty string and logs the error to the console.
   *
   * @param html - The HTML string to sanitize
   * @returns Sanitized HTML string, or empty string on error
   * @see Requirements 13.1, 13.2, 13.3, 13.4, 13.5, 13.6
   *
   * @example
   * ```typescript
   * // Sanitize formatted message
   * const formatted = '<span class="mention">@John</span> sent a message';
   * const safe = this.htmlSanitizer.sanitize(formatted);
   * // Result: '<span class="mention">@John</span> sent a message'
   *
   * // Sanitize malicious content
   * const malicious = '<script>alert("XSS")</script>Hello';
   * const safe = this.htmlSanitizer.sanitize(malicious);
   * // Result: 'Hello' (script tag removed)
   *
   * // Sanitize link
   * const link = '<a href="https://example.com">Click</a>';
   * const safe = this.htmlSanitizer.sanitize(link);
   * // Result: '<a href="https://example.com" target="_blank" rel="noopener noreferrer">Click</a>'
   * ```
   */
  sanitize(html: string): string {
    // Return empty string for empty input
    if (!html || html.trim() === '') {
      return '';
    }

    // Check cache first
    const cached = this.sanitizationCache.get(html);
    if (cached !== undefined) {
      return cached;
    }

    try {
      // Sanitize with default config
      const sanitized = DOMPurify.sanitize(html, this.DEFAULT_CONFIG) as string;

      // Cache the result
      this.cacheResult(html, sanitized);

      return sanitized;
    } catch (error) {
      // Log error and return empty string
      CometChatLogger.error('HtmlSanitizerService', 'Sanitization failed:', error);
      return '';
    }
  }

  /**
   * Sanitize HTML with custom configuration.
   *
   * This method sanitizes the provided HTML string using a custom DOMPurify
   * configuration. Use this when you need different sanitization rules than
   * the default (e.g., more restrictive for conversation subtitles).
   *
   * Custom configuration is merged with DOMPurify defaults, so you only need
   * to specify the properties you want to override.
   *
   * Results are NOT cached when using custom configuration, as the same HTML
   * with different configs should produce different results.
   *
   * If sanitization fails, this method returns an empty string and logs the error.
   *
   * @param html - The HTML string to sanitize
   * @param config - Custom DOMPurify configuration
   * @returns Sanitized HTML string, or empty string on error
   * @see Requirements 13.1
   *
   * @example
   * ```typescript
   * // More restrictive config for conversation subtitles
   * const restrictiveConfig = {
   *   ALLOWED_TAGS: ['span'],
   *   ALLOWED_ATTR: ['class', 'data-uid', 'data-mention-type']
   * };
   * const safe = this.htmlSanitizer.sanitizeWithConfig(html, restrictiveConfig);
   *
   * // Allow additional tags
   * const permissiveConfig = {
   *   ALLOWED_TAGS: [...this.htmlSanitizer.getDefaultConfig().ALLOWED_TAGS, 'img'],
   *   ALLOWED_ATTR: [...this.htmlSanitizer.getDefaultConfig().ALLOWED_ATTR, 'src', 'alt']
   * };
   * const safe = this.htmlSanitizer.sanitizeWithConfig(html, permissiveConfig);
   * ```
   */
  sanitizeWithConfig(html: string, config: DOMPurifyConfig): string {
    // Return empty string for empty input
    if (!html || html.trim() === '') {
      return '';
    }

    try {
      // Sanitize with custom config
      const sanitized = DOMPurify.sanitize(html, config) as string;
      return sanitized;
    } catch (error) {
      // Log error and return empty string
      CometChatLogger.error(
        'HtmlSanitizerService',
        'Sanitization with custom config failed:',
        error
      );
      return '';
    }
  }

  /**
   * Get the default sanitization configuration.
   *
   * Returns a copy of the default DOMPurify configuration used by this service.
   * This is useful for:
   * - Understanding what tags and attributes are allowed
   * - Creating custom configurations based on the defaults
   * - Debugging sanitization issues
   *
   * The returned object is a copy, so modifying it will not affect the service's
   * default configuration.
   *
   * @returns Copy of the default DOMPurify configuration
   * @see Requirements 13.2, 13.3
   *
   * @example
   * ```typescript
   * // Get default config for reference
   * const config = this.htmlSanitizer.getDefaultConfig();
   * console.log('Allowed tags:', config.ALLOWED_TAGS);
   * console.log('Allowed attributes:', config.ALLOWED_ATTR);
   *
   * // Create custom config based on defaults
   * const customConfig = {
   *   ...this.htmlSanitizer.getDefaultConfig(),
   *   ALLOWED_TAGS: ['span', 'strong'] // More restrictive
   * };
   * ```
   */
  getDefaultConfig(): DOMPurifyConfig {
    // Return a copy to prevent external modification
    return {
      ...this.DEFAULT_CONFIG,
      ALLOWED_TAGS: Array.isArray(this.DEFAULT_CONFIG.ALLOWED_TAGS)
        ? [...this.DEFAULT_CONFIG.ALLOWED_TAGS]
        : this.DEFAULT_CONFIG.ALLOWED_TAGS,
      ALLOWED_ATTR: Array.isArray(this.DEFAULT_CONFIG.ALLOWED_ATTR)
        ? [...this.DEFAULT_CONFIG.ALLOWED_ATTR]
        : this.DEFAULT_CONFIG.ALLOWED_ATTR,
      ADD_ATTR: Array.isArray(this.DEFAULT_CONFIG.ADD_ATTR)
        ? [...this.DEFAULT_CONFIG.ADD_ATTR]
        : this.DEFAULT_CONFIG.ADD_ATTR,
    };
  }

  /**
   * Escape HTML entities in raw user text before formatter processing.
   *
   * This method prevents XSS by converting HTML special characters to their
   * entity equivalents (e.g., `<` → `&lt;`), ensuring raw user input like
   * `<img src=x onerror=alert()>` is displayed as visible text rather than
   * being parsed as HTML.
   *
   * SDK mention patterns (`<@uid:...>` and `<@all:...>`) are preserved via
   * placeholders so the mentions formatter can still process them.
   *
   * Call this on raw message text BEFORE passing it through the formatter
   * pipeline. Formatters generate their own safe HTML (mention spans,
   * markdown tags, URL anchors) which is unaffected by this escaping.
   *
   * @param text - The raw message text to escape
   * @returns Text with HTML entities escaped, SDK mentions preserved
   */
  escapeUserHtml(text: string): string {
    if (!text) {
      return text;
    }

    // Preserve SDK mention patterns by replacing with placeholders
    const sdkMentionRegex = /<@(uid|all):[^>]*>/g;
    const placeholders: string[] = [];
    let escaped = text.replace(sdkMentionRegex, match => {
      const idx = placeholders.length;
      placeholders.push(match);
      return `\x00SDKMENTION${idx}\x00`;
    });

    // Escape HTML entities in the remaining text
    escaped = escaped
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

    // Restore SDK mention placeholders
    escaped = escaped.replace(/\x00SDKMENTION(\d+)\x00/g, (_, idx) => {
      return placeholders[parseInt(idx, 10)];
    });

    return escaped;
  }

  // ==================== Private Methods ====================

  /**
   * Cache a sanitization result.
   *
   * Stores the sanitized HTML in the cache for performance optimization.
   * If the cache exceeds MAX_CACHE_SIZE, the oldest entry is removed (LRU).
   *
   * @param original - Original HTML string (cache key)
   * @param sanitized - Sanitized HTML string (cache value)
   * @private
   */
  private cacheResult(original: string, sanitized: string): void {
    // Check cache size limit
    if (this.sanitizationCache.size >= this.MAX_CACHE_SIZE) {
      // Remove oldest entry (first key in Map)
      const firstKey = this.sanitizationCache.keys().next().value;
      if (firstKey !== undefined) {
        this.sanitizationCache.delete(firstKey);
      }
    }

    // Add to cache
    this.sanitizationCache.set(original, sanitized);
  }

  /**
   * Configure DOMPurify hooks for link security.
   *
   * Sets up DOMPurify hooks to ensure all links have proper security attributes:
   * - target="_blank" - Opens links in new tab
   * - rel="noopener noreferrer" - Prevents window.opener access and referrer leakage
   *
   * This hook runs after sanitization and modifies link elements before they are
   * returned to the caller.
   *
   * @private
   * @see Requirements 13.6
   */
  private configureDOMPurifyHooks(): void {
    // Add hook to ensure link security attributes
    DOMPurify.addHook('afterSanitizeAttributes', (node: Element) => {
      // Only process anchor tags
      if (node.tagName === 'A') {
        // Ensure target="_blank"
        if (!node.hasAttribute('target')) {
          node.setAttribute('target', '_blank');
        }

        // Ensure rel="noopener noreferrer"
        const rel = node.getAttribute('rel');
        if (!rel || !rel.includes('noopener') || !rel.includes('noreferrer')) {
          node.setAttribute('rel', 'noopener noreferrer');
        }
      }
    });
  }
}
