/**
 * Unit Tests for util.ts
 *
 * Tests all exported utility functions: isMobileDevice, isSafari, isDarkMode,
 * getThemeVariable, getThemeMode, fireClickEvent, sanitizeCalendarObject,
 * and stripRichTextFormatting.
 *
 * Categories: Standard Operations, Boundary Inputs, Null/Invalid Handling,
 *             SDK Mention Preservation, Edge Cases
 *
 * @validates Requirements 8.1, 8.6, 14.4, 14.5, 15.7
 */
import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest';
import { ensureSdkReady, sdkCleanup } from '../test-setup';
import {
  isMobileDevice,
  isSafari,
  isDarkMode,
  getThemeVariable,
  getThemeMode,
  fireClickEvent,
  sanitizeCalendarObject,
  stripRichTextFormatting,
} from './util';

beforeAll(async () => {
  await ensureSdkReady();
});

afterAll(async () => {
  await sdkCleanup();
});

// ==================== isMobileDevice ====================

describe('isMobileDevice', () => {
  const originalUserAgent = navigator.userAgent;

  afterEach(() => {
    Object.defineProperty(navigator, 'userAgent', {
      value: originalUserAgent,
      configurable: true,
    });
  });

  function setUserAgent(ua: string) {
    Object.defineProperty(navigator, 'userAgent', {
      value: ua,
      configurable: true,
    });
  }

  describe('Standard Operations', () => {
    it('should return true for Android user agent', () => {
      setUserAgent('Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36');
      expect(isMobileDevice()).toBe(true);
    });

    it('should return true for iPhone user agent', () => {
      setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)');
      expect(isMobileDevice()).toBe(true);
    });

    it('should return true for iPad user agent', () => {
      setUserAgent('Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X)');
      expect(isMobileDevice()).toBe(true);
    });

    it('should return false for desktop Chrome user agent', () => {
      setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/91.0');
      expect(isMobileDevice()).toBe(false);
    });

    it('should return true for BlackBerry user agent', () => {
      setUserAgent('Mozilla/5.0 (BlackBerry; U; BlackBerry 9900)');
      expect(isMobileDevice()).toBe(true);
    });

    it('should return true for Windows Phone user agent', () => {
      setUserAgent('Mozilla/5.0 (Windows Phone 10.0; Android 6.0) Microsoft');
      expect(isMobileDevice()).toBe(true);
    });
  });
});

// ==================== isSafari ====================

describe('isSafari', () => {
  const originalUserAgent = navigator.userAgent;

  afterEach(() => {
    Object.defineProperty(navigator, 'userAgent', {
      value: originalUserAgent,
      configurable: true,
    });
  });

  function setUserAgent(ua: string) {
    Object.defineProperty(navigator, 'userAgent', {
      value: ua,
      configurable: true,
    });
  }

  describe('Standard Operations', () => {
    it('should return true for Safari user agent', () => {
      setUserAgent(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Safari/605.1.15'
      );
      expect(isSafari()).toBe(true);
    });

    it('should return false for Chrome user agent (contains both chrome and safari)', () => {
      setUserAgent(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36'
      );
      expect(isSafari()).toBe(false);
    });

    it('should return false for Firefox user agent', () => {
      setUserAgent(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:89.0) Gecko/20100101 Firefox/89.0'
      );
      expect(isSafari()).toBe(false);
    });

    it('should return false for Android Chrome user agent', () => {
      setUserAgent('Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 Chrome/91.0 Safari/537.36');
      expect(isSafari()).toBe(false);
    });
  });
});

// ==================== isDarkMode ====================

describe('isDarkMode', () => {
  afterEach(() => {
    document.querySelectorAll('[data-theme]').forEach(el => el.remove());
    document.documentElement.removeAttribute('data-theme');
  });

  describe('Standard Operations', () => {
    it('should return false when no dark theme element exists', () => {
      expect(isDarkMode()).toBe(false);
    });

    it('should return true when a dark theme element exists', () => {
      const el = document.createElement('div');
      el.setAttribute('data-theme', 'dark');
      document.body.appendChild(el);
      expect(isDarkMode()).toBe(true);
    });

    it('should return false when theme is light', () => {
      const el = document.createElement('div');
      el.setAttribute('data-theme', 'light');
      document.body.appendChild(el);
      expect(isDarkMode()).toBe(false);
    });
  });
});

// ==================== getThemeVariable ====================

describe('getThemeVariable', () => {
  describe('Standard Operations', () => {
    it('should return the value of a CSS custom property', () => {
      document.documentElement.style.setProperty('--test-color', '#ff0000');
      expect(getThemeVariable('--test-color')).toBe('#ff0000');
      document.documentElement.style.removeProperty('--test-color');
    });

    it('should return empty string for non-existent variable', () => {
      expect(getThemeVariable('--non-existent-var')).toBe('');
    });
  });

  describe('Null/Invalid Handling', () => {
    it('should return empty string for empty variable name', () => {
      expect(getThemeVariable('')).toBe('');
    });
  });
});

// ==================== getThemeMode ====================

describe('getThemeMode', () => {
  afterEach(() => {
    document.querySelectorAll('[data-theme]').forEach(el => el.remove());
    document.documentElement.removeAttribute('data-theme');
  });

  describe('Standard Operations', () => {
    it('should return "light" when no dark theme element exists', () => {
      expect(getThemeMode()).toBe('light');
    });

    it('should return "dark" when a dark theme element exists', () => {
      const el = document.createElement('div');
      el.setAttribute('data-theme', 'dark');
      document.body.appendChild(el);
      expect(getThemeMode()).toBe('dark');
    });
  });
});

// ==================== fireClickEvent ====================

describe('fireClickEvent', () => {
  describe('Standard Operations', () => {
    it('should dispatch an overlayclick custom event on window', () => {
      const handler = vi.fn();
      window.addEventListener('overlayclick', handler);
      fireClickEvent();
      expect(handler).toHaveBeenCalledTimes(1);
      window.removeEventListener('overlayclick', handler);
    });

    it('should dispatch a CustomEvent instance', () => {
      let receivedEvent: Event | null = null;
      const handler = (e: Event) => {
        receivedEvent = e;
      };
      window.addEventListener('overlayclick', handler);
      fireClickEvent();
      expect(receivedEvent).toBeInstanceOf(CustomEvent);
      window.removeEventListener('overlayclick', handler);
    });
  });
});

// ==================== sanitizeCalendarObject ====================

describe('sanitizeCalendarObject', () => {
  describe('Standard Operations', () => {
    it('should return object with only defined values', () => {
      const input = { a: 1, b: undefined, c: 'hello', d: undefined };
      const result = sanitizeCalendarObject(input);
      expect(result).toEqual({ a: 1, c: 'hello' });
    });

    it('should preserve null values (only strips undefined)', () => {
      const input = { a: null, b: 'test' };
      const result = sanitizeCalendarObject(input);
      expect(result).toEqual({ a: null, b: 'test' });
    });

    it('should preserve falsy values like 0, false, empty string', () => {
      const input = { a: 0, b: false, c: '', d: undefined };
      const result = sanitizeCalendarObject(input);
      expect(result).toEqual({ a: 0, b: false, c: '' });
    });

    it('should return a new object (not mutate input)', () => {
      const input = { a: 1 };
      const result = sanitizeCalendarObject(input);
      expect(result).not.toBe(input);
      expect(result).toEqual({ a: 1 });
    });
  });

  describe('Boundary Inputs', () => {
    it('should return empty object for empty input object', () => {
      expect(sanitizeCalendarObject({})).toEqual({});
    });

    it('should return empty object for object with all undefined values', () => {
      expect(sanitizeCalendarObject({ a: undefined, b: undefined })).toEqual({});
    });
  });

  describe('Null/Invalid Handling', () => {
    it('should return empty object for undefined input', () => {
      expect(sanitizeCalendarObject(undefined)).toEqual({});
    });

    it('should return empty object for null input', () => {
      expect(sanitizeCalendarObject(null)).toEqual({});
    });

    it('should return empty object for falsy input (0)', () => {
      expect(sanitizeCalendarObject(0 as any)).toEqual({});
    });

    it('should return empty object for empty string input', () => {
      expect(sanitizeCalendarObject('' as any)).toEqual({});
    });
  });
});

// ==================== stripRichTextFormatting ====================

describe('stripRichTextFormatting', () => {
  describe('Standard Operations', () => {
    it('should strip bold markdown (**text**)', () => {
      expect(stripRichTextFormatting('**Hello** world')).toBe('Hello world');
    });

    it('should strip bold markdown (__text__)', () => {
      expect(stripRichTextFormatting('__Hello__ world')).toBe('Hello world');
    });

    it('should strip italic markdown (*text*)', () => {
      expect(stripRichTextFormatting('*Hello* world')).toBe('Hello world');
    });

    it('should strip strikethrough markdown (~~text~~)', () => {
      expect(stripRichTextFormatting('~~Hello~~ world')).toBe('Hello world');
    });

    it('should strip inline code (`text`)', () => {
      expect(stripRichTextFormatting('Check `code` here')).toBe('Check code here');
    });

    it('should strip double backtick code (``text``)', () => {
      expect(stripRichTextFormatting('``double backtick``')).toBe('double backtick');
    });

    it('should strip blockquote markers (> text)', () => {
      expect(stripRichTextFormatting('> quoted text')).toBe('quoted text');
    });

    it('should strip markdown links [text](url) to just text', () => {
      expect(stripRichTextFormatting('[Click here](https://example.com)')).toBe('Click here');
    });

    it('should strip HTML formatting tags', () => {
      expect(stripRichTextFormatting('<p>HTML content</p>')).toBe('HTML content');
    });

    it('should strip <strong> tags', () => {
      expect(stripRichTextFormatting('<strong>bold</strong> text')).toBe('bold text');
    });

    it('should strip <em> tags', () => {
      expect(stripRichTextFormatting('<em>italic</em> text')).toBe('italic text');
    });

    it('should decode HTML entities', () => {
      expect(stripRichTextFormatting('&amp; &lt; &gt; &quot; &#39;')).toBe('& < > " \'');
    });

    it('should replace &nbsp; with space', () => {
      expect(stripRichTextFormatting('hello&nbsp;world')).toBe('hello world');
    });

    it('should collapse multiple spaces into one', () => {
      expect(stripRichTextFormatting('hello   world')).toBe('hello world');
    });
  });

  describe('SDK Mention Preservation', () => {
    it('should preserve user mention tags <@uid:xxx>', () => {
      expect(stripRichTextFormatting('**Hello** <@uid:123>')).toBe('Hello <@uid:123>');
    });

    it('should preserve channel mention tags <@all:xxx>', () => {
      expect(stripRichTextFormatting('*Hey* <@all:group1>')).toBe('Hey <@all:group1>');
    });

    it('should preserve multiple mentions while stripping formatting', () => {
      const input = '**Bold** <@uid:user1> and <@all:group1> ~~strike~~';
      const result = stripRichTextFormatting(input);
      expect(result).toBe('Bold <@uid:user1> and <@all:group1> strike');
    });
  });

  describe('Boundary Inputs', () => {
    it('should return plain text unchanged', () => {
      expect(stripRichTextFormatting('Hello world')).toBe('Hello world');
    });

    it('should handle text with no formatting markers', () => {
      expect(stripRichTextFormatting('Just plain text here')).toBe('Just plain text here');
    });

    it('should handle multiple formatting types combined', () => {
      const input = '**bold** *italic* ~~strike~~ `code`';
      const result = stripRichTextFormatting(input);
      expect(result).toBe('bold italic strike code');
    });
  });

  describe('Null/Invalid Handling', () => {
    it('should return empty string for null input', () => {
      expect(stripRichTextFormatting(null as any)).toBe('');
    });

    it('should return empty string for undefined input', () => {
      expect(stripRichTextFormatting(undefined as any)).toBe('');
    });

    it('should return empty string for empty string input', () => {
      expect(stripRichTextFormatting('')).toBe('');
    });
  });
});
