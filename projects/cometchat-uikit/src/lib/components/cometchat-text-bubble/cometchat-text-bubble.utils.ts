/**
 * Utility helpers for CometChatTextBubble component.
 * Contains text processing, extraction, and detection helpers.
 */

import { CometChat } from '@cometchat/chat-sdk-javascript';
import type { LinkPreviewData } from './cometchat-text-bubble.types';

// ── Message Extraction ────────────────────────────────────────────────────

/**
 * Extracts the text content from a CometChat.TextMessage.
 */
export function extractMessageText(message: CometChat.TextMessage | null | undefined): string {
  if (!message) return '';
  return message.getText?.() || '';
}

/**
 * Extracts link preview data from message metadata.
 * Path: metadata["@injected"]["extensions"]["link-preview"]["links"]
 */
export function extractLinkPreviews(
  message: CometChat.TextMessage | null | undefined
): LinkPreviewData[] {
  if (!message) return [];
  try {
    const metadata = message.getMetadata?.();
    if (!metadata || typeof metadata !== 'object') return [];
    const injected = (metadata as Record<string, unknown>)['@injected'];
    if (!injected || typeof injected !== 'object') return [];
    const extensions = (injected as Record<string, unknown>)['extensions'];
    if (!extensions || typeof extensions !== 'object') return [];
    const linkPreview = (extensions as Record<string, unknown>)['link-preview'];
    if (!linkPreview || typeof linkPreview !== 'object') return [];
    const links = (linkPreview as Record<string, unknown>)['links'];
    if (!Array.isArray(links)) return [];
    return links
      .filter(
        (link): link is Record<string, unknown> =>
          link !== null &&
          typeof link === 'object' &&
          typeof (link as Record<string, unknown>)['url'] === 'string'
      )
      .map(link => ({
        url: link['url'] as string,
        title: typeof link['title'] === 'string' ? link['title'] : undefined,
        description: typeof link['description'] === 'string' ? link['description'] : undefined,
        image: typeof link['image'] === 'string' ? link['image'] : undefined,
        favicon: typeof link['favicon'] === 'string' ? link['favicon'] : undefined,
      }));
  } catch {
    return [];
  }
}

/**
 * Extracts translation text from message metadata.
 * Path: metadata["translated_message"]
 * If translatedTextOverride is provided, it takes precedence.
 */
export function extractTranslation(
  message: CometChat.TextMessage | null | undefined,
  translatedTextOverride?: string
): string {
  if (translatedTextOverride && typeof translatedTextOverride === 'string') {
    return translatedTextOverride;
  }
  if (!message) return '';
  try {
    const metadata = message.getMetadata?.();
    if (!metadata || typeof metadata !== 'object') return '';
    const translatedMessage = (metadata as Record<string, unknown>)['translated_message'];
    return typeof translatedMessage === 'string' ? translatedMessage : '';
  } catch {
    return '';
  }
}

/**
 * Extracts mentioned users from a CometChat.TextMessage.
 */
export function extractMentionedUsers(
  message: CometChat.TextMessage | null | undefined
): CometChat.User[] {
  if (!message) return [];
  try {
    const mentionedUsers = message.getMentionedUsers?.();
    return Array.isArray(mentionedUsers) ? mentionedUsers : [];
  } catch {
    return [];
  }
}

/**
 * Extracts rich text HTML from message metadata.
 * Path: metadata.richText.html (when metadata.richText.hasFormatting is true)
 */
export function extractRichTextHtml(
  message: CometChat.TextMessage | null | undefined
): string {
  if (!message) return '';
  try {
    const metadata = message.getMetadata?.();
    if (!metadata || typeof metadata !== 'object') return '';
    const richText = (metadata as Record<string, unknown>)['richText'];
    if (!richText || typeof richText !== 'object') return '';
    const richTextObj = richText as Record<string, unknown>;
    if (richTextObj['hasFormatting'] !== true) return '';
    const html = richTextObj['html'];
    return typeof html === 'string' && html.trim() !== '' ? html : '';
  } catch {
    return '';
  }
}

// ── Emoji Detection ───────────────────────────────────────────────────────

/**
 * Detects if the message text is a single emoji (including complex sequences).
 */
export function detectSingleEmoji(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  const trimmedText = text.trim();
  if (trimmedText.length === 0) return false;

  const emojiRegex =
    /^(?:\p{Extended_Pictographic}(?:\p{Emoji_Modifier}|\uFE0F|\u200D\p{Extended_Pictographic})*|\p{Regional_Indicator}{2}|[0-9#*]\uFE0F?\u20E3)$/u;
  if (emojiRegex.test(trimmedText)) return true;

  if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    try {
      const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });
      const segments = Array.from(segmenter.segment(trimmedText));
      if (segments.length !== 1) return false;
      const segment = segments[0].segment;
      return (
        /^\p{Extended_Pictographic}/u.test(segment) ||
        /^\p{Regional_Indicator}{2}$/u.test(segment) ||
        /^[0-9#*]\uFE0F?\u20E3$/u.test(segment)
      );
    } catch { /* fall through */ }
  }

  const complexEmojiRegex =
    /^(?:(?:\p{Extended_Pictographic}|\p{Regional_Indicator}{2})(?:\p{Emoji_Modifier}|\uFE0F)?(?:\u200D(?:\p{Extended_Pictographic}|\p{Regional_Indicator}{2})(?:\p{Emoji_Modifier}|\uFE0F)?)*|[0-9#*]\uFE0F?\u20E3)$/u;
  return complexEmojiRegex.test(trimmedText);
}

/**
 * Detects single emoji in rich text content (strips wrapping <p> tags first).
 */
export function detectSingleEmojiInRichText(html: string): boolean {
  if (!html) return false;
  const stripped = html.replace(/^<p>(.*)<\/p>$/s, '$1').trim();
  if (stripped === html || /<[^>]+>/.test(stripped)) return false;
  return detectSingleEmoji(stripped);
}

// ── Text Processing ───────────────────────────────────────────────────────

/**
 * Strips invalid mention formats from text.
 * Removes <@{name}:{display}> patterns that are not valid SDK format.
 */
export function stripInvalidMentionFormats(text: string): string {
  if (!text || typeof text !== 'string') return '';
  const invalidMentionRegex = /<@(?!uid:|all:)[^>]+>/g;
  return text.replace(invalidMentionRegex, '');
}

/**
 * Extracts the domain from a URL.
 */
export function getDomainFromUrl(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}
