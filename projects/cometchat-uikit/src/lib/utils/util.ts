/**
 * Utility functions for CometChat UIKit
 */

/**
 * Checks if the current device is a mobile device.
 * @returns boolean - true if the device is mobile, false otherwise
 */
export function isMobileDevice(): boolean {
  return /Mobi|Android|iPhone|iPad|iPod|BlackBerry|Windows Phone/i.test(navigator.userAgent);
}

/**
 * Checks if the current browser is Safari.
 * @returns boolean - true if the browser is Safari, false otherwise
 */
export function isSafari(): boolean {
  const userAgent = navigator.userAgent;
  return /^((?!chrome|android).)*safari/i.test(userAgent);
}

/**
 * Checks if the current theme is dark mode.
 * @returns boolean - true if dark mode is enabled, false otherwise
 */
export function isDarkMode(): boolean {
  return document.querySelector('[data-theme="dark"]') ? true : false;
}

/**
 * Gets the value of a CSS custom property (CSS variable).
 * @param name - The name of the CSS variable (e.g., '--cometchat-primary-color')
 * @returns string - The value of the CSS variable
 */
export function getThemeVariable(name: string): string {
  const root = document.documentElement;
  return getComputedStyle(root).getPropertyValue(name).trim();
}

/**
 * Gets the current theme mode.
 * @returns 'dark' | 'light' - The current theme mode
 */
export function getThemeMode(): 'dark' | 'light' {
  const isDark = document.querySelector('[data-theme="dark"]') ? true : false;
  return isDark ? 'dark' : 'light';
}

/**
 * Fires a custom click event on the window.
 * Used for overlay click handling.
 */
export function fireClickEvent(): void {
  if (window) {
    window.dispatchEvent(new CustomEvent('overlayclick'));
  }
}

/**
 * Sanitizes a CalendarObject by removing undefined values.
 * @param calendarObject - The calendar object to sanitize
 * @returns object - The sanitized calendar object
 */
export function sanitizeCalendarObject<T extends object>(calendarObject?: T | null): Partial<T> {
  if (!calendarObject) {
    return {} as Partial<T>;
  }
  const sanitized: Record<string, unknown> = {};
  Object.keys(calendarObject).forEach(key => {
    if ((calendarObject as Record<string, unknown>)[key] !== undefined) {
      sanitized[key] = (calendarObject as Record<string, unknown>)[key];
    }
  });
  return sanitized as Partial<T>;
}

/**
 * Strips rich text formatting markers from text, converting it to plain text.
 * Removes markdown-style formatting like **bold**, *italic*, __underline__, ~~strikethrough~~,
 * `code`, and HTML tags, leaving only the text content.
 *
 * IMPORTANT: Preserves SDK mention tags (<@uid:xxx> and <@all:xxx>) so they can be
 * formatted by the mentions formatter later.
 *
 * This is useful for displaying message previews in conversation lists where
 * formatting markers would be distracting.
 *
 * @param text - The text with rich text formatting markers
 * @returns string - The plain text without formatting markers (but with SDK mentions preserved)
 *
 * @example
 * ```typescript
 * stripRichTextFormatting('**Hello** *world*') // Returns: 'Hello world'
 * stripRichTextFormatting('Check out `code` here') // Returns: 'Check out code here'
 * stripRichTextFormatting('``double backtick``') // Returns: 'double backtick'
 * stripRichTextFormatting('> quoted text') // Returns: 'quoted text'
 * stripRichTextFormatting('<p>HTML content</p>') // Returns: 'HTML content'
 * stripRichTextFormatting('**Hello** <@uid:123>') // Returns: 'Hello <@uid:123>' (mention preserved)
 * ```
 */
export function stripRichTextFormatting(text: string): string {
  if (!text) {
    return '';
  }

  let result = text;

  // IMPORTANT: Preserve SDK mention tags before stripping HTML
  // Temporarily replace SDK mentions with placeholders
  // Use zero-width characters that won't be affected by HTML/markdown stripping
  const mentionPlaceholders: { placeholder: string; original: string }[] = [];
  let mentionIndex = 0;

  // Preserve user mentions: <@uid:xxx>
  result = result.replace(/<@uid:([^>]+)>/g, match => {
    // Use a unique placeholder with zero-width characters and a unique ID
    const placeholder = `\u200B\u200CSDKMENTION${mentionIndex}\u200C\u200B`;
    mentionPlaceholders.push({ placeholder, original: match });
    mentionIndex++;
    return placeholder;
  });

  // Preserve channel mentions: <@all:xxx>
  result = result.replace(/<@all:([^>]+)>/g, match => {
    const placeholder = `\u200B\u200CSDKMENTION${mentionIndex}\u200C\u200B`;
    mentionPlaceholders.push({ placeholder, original: match });
    mentionIndex++;
    return placeholder;
  });

  // Strip known rich text HTML tags (but preserve the content inside)
  // Only strip tags that are used for formatting (from rich text editors).
  // Unknown tags like <img>, <script>, etc. are left as-is so they can be:
  // - Auto-escaped by Angular's {{ }} interpolation (non-HTML path)
  // - Sanitized by DOMPurify when rendered via [innerHTML] (HTML path)
  const knownFormattingTags =
    /(<\/?(p|br|strong|em|u|s|code|pre|blockquote|ul|ol|li|a|span|div|h[1-6])\b[^>]*>)/gi;
  result = result.replace(knownFormattingTags, '');

  // Strip markdown formatting markers
  // Bold: **text** or __text__
  result = result.replace(/\*\*([^*]+)\*\*/g, '$1');
  result = result.replace(/__([^_]+)__/g, '$1');

  // Italic: *text* or _text_ (but not if it's part of __ or **)
  result = result.replace(/(?<!\*)\*(?!\*)([^*]+)\*(?!\*)/g, '$1');
  result = result.replace(/(?<!_)_(?!_)([^_]+)_(?!_)/g, '$1');

  // Strikethrough: ~~text~~
  result = result.replace(/~~([^~]+)~~/g, '$1');

  // Code blocks: ```text``` (must be before inline code)
  result = result.replace(/```[\s\S]*?```/g, match => {
    // Extract content between triple backticks, remove language identifier if present
    const content = match
      .slice(3, -3)
      .replace(/^\w*\n?/, '')
      .trim();
    return content;
  });

  // Double backtick code: ``text``
  result = result.replace(/``([^`]+)``/g, '$1');

  // Inline code: `text`
  result = result.replace(/`([^`]+)`/g, '$1');

  // Blockquotes: > text (at start of line or after newline)
  result = result.replace(/(?:^|\n)>\s*/g, '\n');

  // Links: [text](url) -> text
  result = result.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

  // Clean up any remaining HTML entities
  result = result.replace(/&nbsp;/g, ' ');
  result = result.replace(/&lt;/g, '<');
  result = result.replace(/&gt;/g, '>');
  result = result.replace(/&amp;/g, '&');
  result = result.replace(/&quot;/g, '"');
  result = result.replace(/&#39;/g, "'");

  // Clean up multiple spaces
  result = result.replace(/\s+/g, ' ').trim();

  // Restore SDK mention tags
  // Using replaceAll for more reliable replacement
  mentionPlaceholders.forEach(({ placeholder, original }) => {
    // Use a while loop to ensure all instances are replaced
    while (result.includes(placeholder)) {
      result = result.replace(placeholder, original);
    }
  });

  return result;
}
