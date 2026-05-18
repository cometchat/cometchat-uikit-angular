/**
 * Mention insertion/extraction methods for RichTextEditor.
 * Extracted to reduce class file size.
 */

import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatLogger } from '../utils/CometChatLogger';
import { markdownToHtml as markdownToHtmlUtil } from './rich-text-editor.markdown-utils';

export interface MentionOpsContext {
  contentEditable: HTMLDivElement;
  selectionManager: any;
  mentionsFormatter: any;
  pushToHistory: () => void;
  emitUpdate: () => void;
  announceToScreenReader: (msg: string) => void;
  getHTML: () => string;
  setHTML: (html: string) => void;
  getText: () => string;
  initializeMentionsFormatter: (formatter?: any) => void;
  convertInlineMarkdown: (text: string) => string;
  escapeUserHtmlForEditor: (text: string) => string;
  htmlToMarkdown: (element: HTMLElement) => string;
}

export function insertMentionImpl(ctx: MentionOpsContext, id: string, label: string, charsToDelete: number, isSelf = false): void {
  if (!id || id.trim() === '') { CometChatLogger.warn('RichTextEditor', 'Cannot insert mention with empty ID'); return; }
  if (!label || label.trim() === '') { CometChatLogger.warn('RichTextEditor', 'Cannot insert mention with empty label'); return; }
  const currentMentions = getUniqueMentionUidsImpl(ctx);
  if (currentMentions.size >= 10 && !currentMentions.has(id)) { CometChatLogger.warn('RichTextEditor', 'Cannot add more than 10 unique mentions'); return; }
  const selection = ctx.selectionManager.getSelection();
  if (!selection || selection.rangeCount === 0) { return; }
  const range = selection.getRangeAt(0);
  if (charsToDelete > 0) { range.setStart(range.startContainer, Math.max(0, range.startOffset - charsToDelete)); range.deleteContents(); }
  const isChannelMention = id === 'all';
  let mentionType: string;
  let cssClass: string;
  if (isChannelMention) { mentionType = 'channel'; cssClass = 'cometchat-mentions cometchat-mentions-you'; } else if (isSelf) {
    mentionType = 'self'; cssClass = 'cometchat-mentions cometchat-mentions-you';
  } else {
    mentionType = 'other'; cssClass = 'cometchat-mentions cometchat-mentions-other';
  }
  const mentionSpan = document.createElement('span');
  mentionSpan.className = cssClass;
  mentionSpan.setAttribute('data-uid', id);
  mentionSpan.setAttribute('data-mention-type', mentionType);
  mentionSpan.setAttribute('contenteditable', 'false');
  mentionSpan.textContent = `@${label}`;
  range.insertNode(mentionSpan);
  const spaceNode = document.createTextNode('\u00A0');
  range.setStartAfter(mentionSpan);
  range.insertNode(spaceNode);
  range.setStartAfter(spaceNode);
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);
  ctx.pushToHistory();
  ctx.emitUpdate();
  ctx.announceToScreenReader(`Mentioned ${label}`);
}

export function getUniqueMentionUidsImpl(ctx: MentionOpsContext): Set<string> {
  const uids = new Set<string>();
  const mentionSpans = ctx.contentEditable.querySelectorAll('span[data-uid]');
  mentionSpans.forEach(span => {
    const uid = span.getAttribute('data-uid');
    if (uid && uid !== 'all') { uids.add(uid); }
  });
  return uids;
}

export function getTextWithMentionFormatImpl(ctx: MentionOpsContext): string {
  const html = ctx.getHTML();
  const temp = document.createElement('div');
  temp.innerHTML = html;
  const mentionSpans = temp.querySelectorAll('span[data-uid]');
  mentionSpans.forEach(span => {
    const uid = span.getAttribute('data-uid');
    const mentionType = span.getAttribute('data-mention-type');
    if (uid === 'all' && mentionType === 'channel') {
      const label = span.textContent?.replace('@', '') || 'all';
      const textNode = document.createTextNode(`<@all:${label}>`);
      span.parentNode?.replaceChild(textNode, span);
    } else if (uid && uid.trim() !== '') {
      const textNode = document.createTextNode(`<@uid:${uid}>`);
      span.parentNode?.replaceChild(textNode, span);
    } else {
      const textContent = span.textContent || '';
      const textNode = document.createTextNode(textContent);
      span.parentNode?.replaceChild(textNode, span);
    }
  });
  return ctx.htmlToMarkdown(temp);
}

export function setContentWithMentionsImpl(ctx: MentionOpsContext, text: string, mentionedUsers: (CometChat.User | CometChat.GroupMember)[]): void {
  if (!ctx.mentionsFormatter) { ctx.initializeMentionsFormatter(); }
  // ENG-35077: Use the full markdownToHtml conversion (not just inline markdown)
  // so that block-level formatting like blockquotes (>) and lists (-) are properly
  // rendered in the editor when editing a formatted message.
  // Protect SDK mention tags (<@uid:xxx>, <@all:label>) from being processed.
  const sdkMentionRegex = /<@(uid|all):[^>]*>/g;
  const mentionPlaceholders: string[] = [];
  const textWithPlaceholders = text.replace(sdkMentionRegex, (match: string) => {
    const idx = mentionPlaceholders.length;
    mentionPlaceholders.push(match);
    return `\x00SDKMENTION${idx}\x00`;
  });
  // Use full markdown-to-HTML conversion (handles blockquotes, lists, inline formatting)
  let formattedHtml = markdownToHtmlUtil(textWithPlaceholders);
  // Restore SDK mention placeholders
  formattedHtml = formattedHtml.replace(/\x00SDKMENTION(\d+)\x00/g, (_: string, idx: string) => {
    return mentionPlaceholders[parseInt(idx, 10)];
  });
  const finalHtml = ctx.mentionsFormatter!.formatSdkMentions(formattedHtml, mentionedUsers);
  ctx.setHTML(finalHtml);
}

export function escapeUserHtmlForEditorImpl(_ctx: MentionOpsContext, text: string): string {
  if (!text) { return text; }
  const sdkMentionRegex = /<@(uid|all):[^>]*>/g;
  const placeholders: string[] = [];
  let escaped = text.replace(sdkMentionRegex, (match: string) => {
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
  escaped = escaped.replace(/\x00SDKMENTION(\d+)\x00/g, (_: string, idx: string) => {
    return placeholders[parseInt(idx, 10)];
  });
  return escaped;
}
