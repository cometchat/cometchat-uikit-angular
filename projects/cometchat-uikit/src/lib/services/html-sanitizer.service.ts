import { Injectable } from '@angular/core';
import DOMPurify, { Config as DOMPurifyConfig } from 'dompurify';
import { CometChatLogger } from '../utils/CometChatLogger';

/**
 * HtmlSanitizerService
 *
 * Centralized HTML sanitization service using DOMPurify.
 * Allows only safe HTML tags/attributes, prevents XSS attacks.
 * Caches up to 1000 sanitized strings (LRU eviction).
 * Ensures links have target="_blank" and rel="noopener noreferrer".
 *
 * @Injectable providedIn: 'root'
 * @see Requirements 13.1-13.6
 */
@Injectable({
  providedIn: 'root',
})
export class HtmlSanitizerService {
  private sanitizationCache = new Map<string, string>();
  private readonly MAX_CACHE_SIZE = 1000;
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
    this.configureDOMPurifyHooks();
  }

  /** Sanitize HTML with default configuration. Results are cached. @see Requirements 13.1-13.6 */
  sanitize(html: string): string {
    if (!html || html.trim() === '') return '';

    const cached = this.sanitizationCache.get(html);
    if (cached !== undefined) return cached;

    try {
      const sanitized = DOMPurify.sanitize(html, this.DEFAULT_CONFIG) as string;
      this.cacheResult(html, sanitized);
      return sanitized;
    } catch (error) {
      CometChatLogger.error('HtmlSanitizerService', 'Sanitization failed:', error);
      return '';
    }
  }

  /** Sanitize HTML with custom configuration. Results are NOT cached. @see Requirements 13.1 */
  sanitizeWithConfig(html: string, config: DOMPurifyConfig): string {
    if (!html || html.trim() === '') return '';

    try {
      return DOMPurify.sanitize(html, config) as string;
    } catch (error) {
      CometChatLogger.error('HtmlSanitizerService', 'Sanitization with custom config failed:', error);
      return '';
    }
  }


  getDefaultConfig(): DOMPurifyConfig {
    return {
      ...this.DEFAULT_CONFIG,
      ALLOWED_TAGS: Array.isArray(this.DEFAULT_CONFIG.ALLOWED_TAGS) ? [...this.DEFAULT_CONFIG.ALLOWED_TAGS] : this.DEFAULT_CONFIG.ALLOWED_TAGS,
      ALLOWED_ATTR: Array.isArray(this.DEFAULT_CONFIG.ALLOWED_ATTR) ? [...this.DEFAULT_CONFIG.ALLOWED_ATTR] : this.DEFAULT_CONFIG.ALLOWED_ATTR,
      ADD_ATTR: Array.isArray(this.DEFAULT_CONFIG.ADD_ATTR) ? [...this.DEFAULT_CONFIG.ADD_ATTR] : this.DEFAULT_CONFIG.ADD_ATTR,
    };
  }

  /**
   * Escape HTML entities in raw user text before formatter processing.
   * Preserves SDK mention patterns (`<@uid:...>` and `<@all:...>`).
   */
  escapeUserHtml(text: string): string {
    if (!text) return text;

    const sdkMentionRegex = /<@(uid|all):[^>]*>/g;
    const placeholders: string[] = [];
    let escaped = text.replace(sdkMentionRegex, match => {
      const idx = placeholders.length;
      placeholders.push(match);
      return `\x00SDKMENTION${idx}\x00`;
    });

    escaped = escaped
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

    return escaped.replace(/\x00SDKMENTION(\d+)\x00/g, (_, idx) => placeholders[parseInt(idx, 10)]);
  }

  private cacheResult(original: string, sanitized: string): void {
    if (this.sanitizationCache.size >= this.MAX_CACHE_SIZE) {
      const firstKey = this.sanitizationCache.keys().next().value;
      if (firstKey !== undefined) this.sanitizationCache.delete(firstKey);
    }
    this.sanitizationCache.set(original, sanitized);
  }

  /** Configure DOMPurify hooks for link security. @see Requirements 13.6 */
  private configureDOMPurifyHooks(): void {
    DOMPurify.addHook('afterSanitizeAttributes', (node: Element) => {
      if (node.tagName === 'A') {
        if (!node.hasAttribute('target')) node.setAttribute('target', '_blank');
        const rel = node.getAttribute('rel');
        if (!rel || !rel.includes('noopener') || !rel.includes('noreferrer')) {
          node.setAttribute('rel', 'noopener noreferrer');
        }
      }
    });
  }
}
