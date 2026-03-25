/**
 * Text Formatters Module
 *
 * This module provides text formatting utilities for the CometChat UIKit.
 * Formatters detect patterns in text and apply transformations such as
 * highlighting mentions, converting URLs to links, emoji shortcodes, and more.
 *
 * @module formatters
 */

export { CometChatTextFormatter } from './cometchat-text-formatter';
export type { TextFormatterContext } from './cometchat-text-formatter';
export { CometChatMentionsFormatter } from './cometchat-mentions-formatter';
export { CometChatUrlFormatter } from './cometchat-url-formatter';
export { CometChatEmojiFormatter } from './cometchat-emoji-formatter';
export { CometChatMarkdownFormatter } from './cometchat-markdown-formatter';
export type { MentionData } from './cometchat-mentions-formatter';
export { applyFormatters, formatText } from './formatter-pipeline';
export type { FormatterPipelineResult } from './formatter-pipeline';
