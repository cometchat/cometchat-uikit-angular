/**
 * Keyboard handler functions for CometChatMessageComposer.
 * Extracted to reduce component file size.
 */

import { EnterKeyBehavior } from '../../Enums/Enums';
import { MentionSuggestion } from '../../services/message-composer.service';

export interface KeyboardHandlerContext {
  enableRichText: boolean;
  enterKeyBehavior: EnterKeyBehavior;
  isMentionSuggestionsOpen: () => boolean;
  mentionSuggestions: () => MentionSuggestion[];
  focusedMentionIndex: any;
  isAnyPopupOpen: () => boolean;
  isInQuotedReplyMode: () => boolean;
  isInEditMode: () => boolean;
  isBubbleMenuVisible: () => boolean;
  isFixedToolbarManuallyToggled: () => boolean;
  isFixedToolbarShown: () => boolean;
  customRichTextEditor: any;
  richTextEditorService: any;
  handleSend: () => void;
  handleClosePreview: () => void;
  closeAllPopups: () => void;
  closeBubbleMenu: () => void;
  handleFormattingShortcuts: (event: KeyboardEvent) => boolean;
  handleToolbarBold: () => void;
  handleToolbarItalic: () => void;
  handleToolbarUnderline: () => void;
  selectMentionSuggestion: (s: MentionSuggestion) => void;
  announceFocusedMention: (name: string, pos: number, total: number) => void;
  forwardKeyEventToFormatters: (event: KeyboardEvent, type: 'keydown' | 'keyup') => void;
  updateFormatterCaretPosition: () => void;
  cdr: any;
}

export function handleKeydownImpl(ctx: KeyboardHandlerContext, event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    if (ctx.isAnyPopupOpen()) { ctx.closeAllPopups(); return; }
    if (ctx.isInQuotedReplyMode() || ctx.isInEditMode()) { event.preventDefault(); ctx.handleClosePreview(); return; }
    return;
  }
  if (ctx.enableRichText && ctx.handleFormattingShortcuts(event)) { return; }
  if (event.key === 'Tab') {
    if (ctx.isMentionSuggestionsOpen()) {
      const suggestions = ctx.mentionSuggestions();
      const currentIndex = ctx.focusedMentionIndex();
      if (suggestions.length > 0 && currentIndex >= 0 && currentIndex < suggestions.length) {
        event.preventDefault();
        ctx.selectMentionSuggestion(suggestions[currentIndex]);
      }
      return;
    }
    return;
  }
  if (ctx.isMentionSuggestionsOpen()) {
    const suggestions = ctx.mentionSuggestions();
    const currentIndex = ctx.focusedMentionIndex();
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (suggestions.length > 0) {
          const newIndex = (currentIndex + 1) % suggestions.length;
          ctx.focusedMentionIndex.set(newIndex);
          ctx.announceFocusedMention(suggestions[newIndex].name, newIndex + 1, suggestions.length);
        }
        return;
      case 'ArrowUp':
        event.preventDefault();
        if (suggestions.length > 0) {
          const newIndex = (currentIndex - 1 + suggestions.length) % suggestions.length;
          ctx.focusedMentionIndex.set(newIndex);
          ctx.announceFocusedMention(suggestions[newIndex].name, newIndex + 1, suggestions.length);
        }
        return;
      case 'Enter':
        if (suggestions.length > 0 && currentIndex >= 0 && currentIndex < suggestions.length) {
          event.preventDefault();
          ctx.selectMentionSuggestion(suggestions[currentIndex]);
        }
        return;
    }
  }
  if (event.key === 'Enter') {
    if (event.shiftKey) { return; }
    if (ctx.enterKeyBehavior === EnterKeyBehavior.SendMessage) { event.preventDefault(); ctx.handleSend(); }
  }
  ctx.forwardKeyEventToFormatters(event, 'keydown');
  ctx.updateFormatterCaretPosition();
}

export function handleKeyupImpl(ctx: KeyboardHandlerContext, event: KeyboardEvent): void {
  ctx.forwardKeyEventToFormatters(event, 'keyup');
  ctx.updateFormatterCaretPosition();
}

export function handleFormattingShortcutsImpl(ctx: KeyboardHandlerContext, event: KeyboardEvent): boolean {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modifierKey = isMac ? event.metaKey : event.ctrlKey;
  if (!modifierKey) { return false; }
  switch (event.key.toLowerCase()) {
    case 'b':
      event.preventDefault(); event.stopPropagation();
      ctx.handleToolbarBold();
      return true;
    case 'i':
      event.preventDefault(); event.stopPropagation();
      ctx.handleToolbarItalic();
      return true;
    case 'u':
      event.preventDefault(); event.stopPropagation();
      ctx.handleToolbarUnderline();
      return true;
    default:
      return false;
  }
}

export function handleGlobalEscapeKeyImpl(ctx: KeyboardHandlerContext, event: Event): void {
  if (ctx.isBubbleMenuVisible()) {
    event.preventDefault(); event.stopPropagation();
    ctx.closeBubbleMenu();
    return;
  }
  if (ctx.isFixedToolbarManuallyToggled() && ctx.isFixedToolbarShown()) {
    event.preventDefault(); event.stopPropagation();
    // isFixedToolbarShown and isFixedToolbarManuallyToggled are writable signals on the component
    (ctx as any).isFixedToolbarShown.set(false);
    (ctx as any).isFixedToolbarManuallyToggled.set(false);
    ctx.cdr.markForCheck();
    return;
  }
  if (ctx.isAnyPopupOpen()) {
    event.preventDefault(); event.stopPropagation();
    ctx.closeAllPopups();
  }
}

export function handleRichTextKeydownImpl(ctx: KeyboardHandlerContext, event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    if (ctx.isAnyPopupOpen()) { ctx.closeAllPopups(); return; }
    if (ctx.isInQuotedReplyMode() || ctx.isInEditMode()) { event.preventDefault(); ctx.handleClosePreview(); return; }
    return;
  }
  if (ctx.enableRichText && ctx.handleFormattingShortcuts(event)) { return; }
  if (event.key === 'Tab') {
    if (ctx.isMentionSuggestionsOpen()) {
      const suggestions = ctx.mentionSuggestions();
      const currentIndex = ctx.focusedMentionIndex();
      if (suggestions.length > 0 && currentIndex >= 0 && currentIndex < suggestions.length) {
        event.preventDefault(); event.stopPropagation();
        ctx.selectMentionSuggestion(suggestions[currentIndex]);
      }
      return;
    }
    if (ctx.customRichTextEditor && ctx.richTextEditorService.isInList(ctx.customRichTextEditor)) { return; }
    event.stopPropagation();
    return;
  }
  if (ctx.isMentionSuggestionsOpen()) {
    const suggestions = ctx.mentionSuggestions();
    const currentIndex = ctx.focusedMentionIndex();
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault(); event.stopPropagation();
        if (suggestions.length > 0) {
          const newIndex = (currentIndex + 1) % suggestions.length;
          ctx.focusedMentionIndex.set(newIndex);
          ctx.announceFocusedMention(suggestions[newIndex].name, newIndex + 1, suggestions.length);
        }
        return;
      case 'ArrowUp':
        event.preventDefault(); event.stopPropagation();
        if (suggestions.length > 0) {
          const newIndex = (currentIndex - 1 + suggestions.length) % suggestions.length;
          ctx.focusedMentionIndex.set(newIndex);
          ctx.announceFocusedMention(suggestions[newIndex].name, newIndex + 1, suggestions.length);
        }
        return;
      case 'Enter':
        if (suggestions.length > 0 && currentIndex >= 0 && currentIndex < suggestions.length) {
          event.preventDefault(); event.stopPropagation();
          ctx.selectMentionSuggestion(suggestions[currentIndex]);
        }
        return;
    }
  }
  if (event.key === 'Enter' && !event.shiftKey) {
    if (ctx.enterKeyBehavior === EnterKeyBehavior.SendMessage) {
      event.preventDefault(); event.stopPropagation();
      ctx.handleSend();
    }
  }
  // Shift+Enter in a list → let the RTE's handleKeyDown create the next
  // list item (it handles both Enter and Shift+Enter for lists). We must
  // NOT consume the event here so it reaches the RTE handler.
  if (event.key === 'Enter' && event.shiftKey) {
    if (ctx.customRichTextEditor && ctx.richTextEditorService.isInList(ctx.customRichTextEditor)) {
      // Don't stop propagation — let the RTE handle list item creation.
      return;
    }
  }
}
