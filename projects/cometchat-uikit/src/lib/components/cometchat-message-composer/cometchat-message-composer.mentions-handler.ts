/**
 * Mention-related handler functions for CometChatMessageComposer.
 * Extracted to reduce component file size.
 */

import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatLocalize } from '../../resources/CometChatLocalize/cometchat-localize';
import { CometChatLogger } from '../../utils/CometChatLogger';
import { MentionSuggestion } from '../../services/message-composer.service';
import { MENTIONS_LIMIT } from './cometchat-message-composer.component';

/** Minimal interface for the parts of the component this handler needs */
export interface MentionsHandlerContext {
  disableMentions: boolean;
  disableMentionAll: boolean;
  mentionAllLabel: string;
  mentionsUsersRequestBuilder?: CometChat.UsersRequestBuilder;
  mentionsGroupMembersRequestBuilder?: CometChat.GroupMembersRequestBuilder;
  enableRichText: boolean;
  customRichTextEditor: any;
  richTextEditorService: any;
  messageComposerService: any;
  mentionSearchText: any;
  isMentionSuggestionsOpen: any;
  focusedMentionIndex: any;
  uniqueMentionCount: any;
  showMentionsCountWarning: any;
  composerText: any;
  cursorPosition: any;
  mentionedUsersMap: Map<string, CometChat.User>;
  plainTextMentionUids: Set<string>;
  skipNextMentionCheck: boolean;
  currentGroup: () => CometChat.Group | null;
  textChange: any;
  mentionSelected: any;
  liveAnnouncerService: any;
  cdr: any;
  focusRichTextEditor: () => void;
  focusTextInput: () => void;
  updateMentionsCount: () => void;
  announceMentionInserted: (name: string) => void;
  announceFocusedMention: (name: string, pos: number, total: number) => void;
}

export function checkForMentionTriggerImpl(ctx: MentionsHandlerContext, text: string, cursorPos: number): void {
  if (ctx.skipNextMentionCheck) { return; }
  if (ctx.uniqueMentionCount() >= MENTIONS_LIMIT) { closeMentionSuggestionsImpl(ctx); return; }
  if (ctx.enableRichText && ctx.customRichTextEditor) {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      let node: Node | null = sel.anchorNode;
      while (node) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const tagName = (node as HTMLElement).tagName?.toLowerCase();
          if (tagName === 'pre' || tagName === 'code') { closeMentionSuggestionsImpl(ctx); return; }
        }
        node = node.parentNode;
      }
    }
  }
  if (ctx.customRichTextEditor) {
    const plainText = ctx.richTextEditorService.getText(ctx.customRichTextEditor);
    const html = ctx.richTextEditorService.getHTML(ctx.customRichTextEditor);
    const mentionMatches = html.match(/data-uid="[^"]*"/g);
    const mentionCount = mentionMatches ? mentionMatches.length : 0;
    const atMatches = plainText.match(/@/g);
    const atCount = atMatches ? atMatches.length : 0;
    if (atCount === 0) { closeMentionSuggestionsImpl(ctx); return; }
    if (atCount <= mentionCount) { closeMentionSuggestionsImpl(ctx); return; }
    const lastAtIndex = plainText.lastIndexOf('@');
    const textAfterAt = plainText.substring(lastAtIndex + 1);
    const hasSpace = textAfterAt.includes(' ');
    const hasNbsp = textAfterAt.includes('\u00A0');
    const hasNewline = textAfterAt.includes('\n');
    if (hasSpace || hasNbsp || hasNewline) { closeMentionSuggestionsImpl(ctx); return; }
    const newSearchText = textAfterAt;
    const previousSearchText = ctx.mentionSearchText();
    ctx.mentionSearchText.set(newSearchText);
    if (newSearchText !== previousSearchText) { ctx.focusedMentionIndex.set(0); }
    ctx.isMentionSuggestionsOpen.set(true);
    if (newSearchText === previousSearchText && !ctx.disableMentions) {
      ctx.messageComposerService.searchMentions(
        newSearchText,
        ctx.currentGroup() ?? undefined,
        ctx.mentionsUsersRequestBuilder,
        ctx.mentionsGroupMembersRequestBuilder,
        ctx.disableMentionAll,
        ctx.mentionAllLabel
      );
    }
    return;
  }
  const textBeforeCursor = text.substring(0, cursorPos);
  const lastAtIndex = textBeforeCursor.lastIndexOf('@');
  if (lastAtIndex === -1) { closeMentionSuggestionsImpl(ctx); return; }
  const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
  if (textAfterAt.includes(' ')) { closeMentionSuggestionsImpl(ctx); return; }
  const newSearchText = textAfterAt;
  const previousSearchText = ctx.mentionSearchText();
  if (newSearchText !== previousSearchText) { ctx.mentionSearchText.set(newSearchText); ctx.focusedMentionIndex.set(0); }
  ctx.isMentionSuggestionsOpen.set(true);
}

export async function fetchMoreMentionsImpl(ctx: MentionsHandlerContext): Promise<void> {
  const isGroupContext = !!ctx.currentGroup();
  await ctx.messageComposerService.fetchMoreMentions(isGroupContext);
  ctx.cdr.markForCheck();
}

export function handleMentionsScrollImpl(ctx: MentionsHandlerContext, event: Event): void {
  const element = event.target as HTMLElement;
  const scrollTop = element.scrollTop;
  const scrollHeight = element.scrollHeight;
  const clientHeight = element.clientHeight;
  if (scrollTop + clientHeight >= scrollHeight - 50) { fetchMoreMentionsImpl(ctx); }
}

export async function selectMentionSuggestionImpl(ctx: MentionsHandlerContext, suggestion: MentionSuggestion): Promise<void> {
  if (!suggestion.uid || suggestion.uid.trim() === '') { CometChatLogger.warn('CometChatMessageComposer', 'Cannot select mention with empty UID'); closeMentionSuggestionsImpl(ctx); return; }
  if (!suggestion.name || suggestion.name.trim() === '') { CometChatLogger.warn('CometChatMessageComposer', 'Cannot select mention with empty name'); closeMentionSuggestionsImpl(ctx); return; }
  if (!ctx.disableMentions) {
    const currentCount = ctx.uniqueMentionCount();
    if (currentCount >= MENTIONS_LIMIT) {
      let alreadyMentioned = false;
      if (ctx.customRichTextEditor) {
        const existingUids = ctx.richTextEditorService.getUniqueMentionUids(ctx.customRichTextEditor);
        alreadyMentioned = existingUids.has(suggestion.uid);
      } else {
        alreadyMentioned = ctx.plainTextMentionUids.has(suggestion.uid);
      }
      if (!alreadyMentioned) { closeMentionSuggestionsImpl(ctx); return; }
    }
  }
  const searchText = ctx.mentionSearchText();
  const charsToDelete = searchText.length + 1;
  const mentionName = suggestion.name;
  const mentionId = suggestion.uid;
  const isSelf = await ctx.messageComposerService.checkIfSelfMention(mentionId);
  if (suggestion.entity) {
    if (suggestion.entity instanceof CometChat.User) { ctx.mentionedUsersMap.set(mentionId, suggestion.entity); } else if ((suggestion.entity as unknown) instanceof CometChat.GroupMember) {
      const user = new CometChat.User({ uid: (suggestion.entity as CometChat.GroupMember).getUid(), name: (suggestion.entity as CometChat.GroupMember).getName() });
      ctx.mentionedUsersMap.set(mentionId, user);
    }
  }
  closeMentionSuggestionsImpl(ctx);
  ctx.skipNextMentionCheck = true;
  if (ctx.customRichTextEditor) {
    ctx.richTextEditorService.insertMention(ctx.customRichTextEditor, mentionId, mentionName, charsToDelete, isSelf);
    ctx.composerText.set(ctx.customRichTextEditor.getText());
    ctx.textChange.emit(ctx.customRichTextEditor.getText());
    setTimeout(() => {
      ctx.focusRichTextEditor();
      setTimeout(() => { ctx.skipNextMentionCheck = false; }, 100);
    }, 0);
  } else {
    const mentionText = `@${mentionName} `;
    const currentText = ctx.composerText();
    const cursorPos = ctx.cursorPosition();
    const textBeforeCursor = currentText.substring(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    if (lastAtIndex === -1) { ctx.skipNextMentionCheck = false; return; }
    ctx.plainTextMentionUids.add(mentionId);
    const textBefore = currentText.substring(0, lastAtIndex);
    const textAfter = currentText.substring(cursorPos);
    const newText = `${textBefore}${mentionText}${textAfter}`;
    ctx.composerText.set(newText);
    const newCursorPos = lastAtIndex + mentionText.length;
    ctx.cursorPosition.set(newCursorPos);
    ctx.textChange.emit(newText);
    ctx.focusTextInput();
    setTimeout(() => { ctx.skipNextMentionCheck = false; }, 300);
  }
  ctx.announceMentionInserted(mentionName);
  ctx.updateMentionsCount();
  if (suggestion.entity) { ctx.mentionSelected.emit(suggestion.entity); }
}

export function scrollMentionIntoViewImpl(_ctx: MentionsHandlerContext, index: number): void {
  const element = document.getElementById(`mention-option-${index}`);
  if (element) { element.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
}

export function closeMentionSuggestionsImpl(ctx: MentionsHandlerContext): void {
  ctx.isMentionSuggestionsOpen.set(false);
  ctx.mentionSearchText.set('');
  ctx.focusedMentionIndex.set(0);
  ctx.messageComposerService.clearMentionSuggestions();
  ctx.messageComposerService.stopMentionSearch();
}

export function updateMentionsCountImpl(ctx: MentionsHandlerContext): void {
  if (ctx.disableMentions) { ctx.uniqueMentionCount.set(0); ctx.showMentionsCountWarning.set(false); return; }
  let count = 0;
  if (ctx.customRichTextEditor) { const uids = ctx.richTextEditorService.getUniqueMentionUids(ctx.customRichTextEditor); count = uids.size; } else { count = ctx.plainTextMentionUids.size; }
  ctx.uniqueMentionCount.set(count);
  ctx.showMentionsCountWarning.set(count >= MENTIONS_LIMIT);
}

export function initializeMentionsRequestBuilderImpl(ctx: MentionsHandlerContext, searchText: string): void {
  const group = ctx.currentGroup();
  ctx.messageComposerService.initializeMentionsPagination(
    searchText,
    group ?? undefined,
    ctx.mentionsUsersRequestBuilder ?? undefined,
    ctx.mentionsGroupMembersRequestBuilder ?? undefined
  );
}

export async function checkIfSelfMentionImpl(ctx: MentionsHandlerContext, userId: string): Promise<boolean> {
  return ctx.messageComposerService.checkIfSelfMention(userId);
}
