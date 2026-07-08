/**
 * cometchat-message-composer.keyboard-handler Tests
 *
 * Covers: handleKeydownImpl (Enter-to-send, Escape, ArrowUp/Down in mentions,
 *         Tab for mention selection, formatting shortcuts),
 *         handleKeyupImpl, handleFormattingShortcutsImpl,
 *         handleGlobalEscapeKeyImpl, handleRichTextKeydownImpl.
 *
 * @module components/cometchat-message-composer/keyboard-handler
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  handleKeydownImpl,
  handleKeyupImpl,
  handleFormattingShortcutsImpl,
  handleGlobalEscapeKeyImpl,
  handleRichTextKeydownImpl,
  KeyboardHandlerContext,
} from '../../components/cometchat-message-composer/cometchat-message-composer.keyboard-handler';
import { EnterKeyBehavior } from '../../Enums/Enums';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeKeyEvent(key: string, opts: {
  shiftKey?: boolean; ctrlKey?: boolean; metaKey?: boolean;
  preventDefault?: () => void; stopPropagation?: () => void;
} = {}): KeyboardEvent {
  return {
    key,
    shiftKey: false,
    ctrlKey: false,
    metaKey: false,
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
    ...opts,
  } as unknown as KeyboardEvent;
}

function makeSuggestion(uid: string, name: string) {
  return { uid, name, entity: null };
}

function makeBaseCtx(overrides: Partial<KeyboardHandlerContext> = {}): KeyboardHandlerContext {
  const focusedMentionIndex = { value: 0, set: vi.fn((v: number) => { focusedMentionIndex.value = v; }) };

  return {
    enableRichText: false,
    enterKeyBehavior: EnterKeyBehavior.SendMessage,
    isMentionSuggestionsOpen: vi.fn().mockReturnValue(false),
    mentionSuggestions: vi.fn().mockReturnValue([]),
    focusedMentionIndex: Object.assign(() => focusedMentionIndex.value, focusedMentionIndex),
    isAnyPopupOpen: vi.fn().mockReturnValue(false),
    isInQuotedReplyMode: vi.fn().mockReturnValue(false),
    isInEditMode: vi.fn().mockReturnValue(false),
    isBubbleMenuVisible: vi.fn().mockReturnValue(false),
    isFixedToolbarManuallyToggled: vi.fn().mockReturnValue(false),
    isFixedToolbarShown: vi.fn().mockReturnValue(false),
    customRichTextEditor: null,
    richTextEditorService: { isInList: vi.fn().mockReturnValue(false) },
    handleSend: vi.fn(),
    handleClosePreview: vi.fn(),
    closeAllPopups: vi.fn(),
    closeBubbleMenu: vi.fn(),
    handleFormattingShortcuts: vi.fn().mockReturnValue(false),
    handleToolbarBold: vi.fn(),
    handleToolbarItalic: vi.fn(),
    handleToolbarUnderline: vi.fn(),
    selectMentionSuggestion: vi.fn(),
    announceFocusedMention: vi.fn(),
    forwardKeyEventToFormatters: vi.fn(),
    updateFormatterCaretPosition: vi.fn(),
    cdr: { markForCheck: vi.fn() },
    ...overrides,
  };
}

describe('cometchat-message-composer.keyboard-handler', () => {

  // ==================== handleKeydownImpl ====================

  describe('handleKeydownImpl', () => {
    describe('Escape key', () => {
      it('should close all popups when any popup is open', () => {
        const ctx = makeBaseCtx({ isAnyPopupOpen: vi.fn().mockReturnValue(true) });
        handleKeydownImpl(ctx, makeKeyEvent('Escape'));
        expect(ctx.closeAllPopups).toHaveBeenCalled();
      });

      it('should call handleClosePreview when in reply mode', () => {
        const ctx = makeBaseCtx({ isInQuotedReplyMode: vi.fn().mockReturnValue(true) });
        const event = makeKeyEvent('Escape');
        handleKeydownImpl(ctx, event);
        expect(ctx.handleClosePreview).toHaveBeenCalled();
        expect(event.preventDefault).toHaveBeenCalled();
      });

      it('should call handleClosePreview when in edit mode', () => {
        const ctx = makeBaseCtx({ isInEditMode: vi.fn().mockReturnValue(true) });
        const event = makeKeyEvent('Escape');
        handleKeydownImpl(ctx, event);
        expect(ctx.handleClosePreview).toHaveBeenCalled();
      });
    });

    describe('Enter key', () => {
      it('should call handleSend when Enter is pressed with SendMessage behavior', () => {
        const ctx = makeBaseCtx({ enterKeyBehavior: EnterKeyBehavior.SendMessage });
        const event = makeKeyEvent('Enter');
        handleKeydownImpl(ctx, event);
        expect(ctx.handleSend).toHaveBeenCalled();
        expect(event.preventDefault).toHaveBeenCalled();
      });

      it('should not call handleSend when Shift+Enter is pressed', () => {
        const ctx = makeBaseCtx({ enterKeyBehavior: EnterKeyBehavior.SendMessage });
        handleKeydownImpl(ctx, makeKeyEvent('Enter', { shiftKey: true }));
        expect(ctx.handleSend).not.toHaveBeenCalled();
      });

      it('should not call handleSend when enterKeyBehavior is NewLine', () => {
        const ctx = makeBaseCtx({ enterKeyBehavior: EnterKeyBehavior.NewLine });
        handleKeydownImpl(ctx, makeKeyEvent('Enter'));
        expect(ctx.handleSend).not.toHaveBeenCalled();
      });

      it('should select mention suggestion when Enter pressed with open suggestions', () => {
        const suggestions = [makeSuggestion('u1', 'Alice'), makeSuggestion('u2', 'Bob')];
        const focusedMentionIndex = { value: 1, set: vi.fn() };
        const ctx = makeBaseCtx({
          isMentionSuggestionsOpen: vi.fn().mockReturnValue(true),
          mentionSuggestions: vi.fn().mockReturnValue(suggestions),
          focusedMentionIndex: Object.assign(() => focusedMentionIndex.value, focusedMentionIndex),
        });
        const event = makeKeyEvent('Enter');
        handleKeydownImpl(ctx, event);
        expect(ctx.selectMentionSuggestion).toHaveBeenCalledWith(suggestions[1]);
        expect(event.preventDefault).toHaveBeenCalled();
      });
    });

    describe('ArrowDown in mention suggestions', () => {
      it('should move focus to next suggestion', () => {
        const suggestions = [makeSuggestion('u1', 'Alice'), makeSuggestion('u2', 'Bob')];
        const focusedMentionIndex = { value: 0, set: vi.fn((v: number) => { focusedMentionIndex.value = v; }) };
        const ctx = makeBaseCtx({
          isMentionSuggestionsOpen: vi.fn().mockReturnValue(true),
          mentionSuggestions: vi.fn().mockReturnValue(suggestions),
          focusedMentionIndex: Object.assign(() => focusedMentionIndex.value, focusedMentionIndex),
        });
        const event = makeKeyEvent('ArrowDown');
        handleKeydownImpl(ctx, event);
        expect(focusedMentionIndex.set).toHaveBeenCalledWith(1);
        expect(event.preventDefault).toHaveBeenCalled();
      });

      it('should wrap around to first suggestion from last', () => {
        const suggestions = [makeSuggestion('u1', 'Alice'), makeSuggestion('u2', 'Bob')];
        const focusedMentionIndex = { value: 1, set: vi.fn((v: number) => { focusedMentionIndex.value = v; }) };
        const ctx = makeBaseCtx({
          isMentionSuggestionsOpen: vi.fn().mockReturnValue(true),
          mentionSuggestions: vi.fn().mockReturnValue(suggestions),
          focusedMentionIndex: Object.assign(() => focusedMentionIndex.value, focusedMentionIndex),
        });
        handleKeydownImpl(ctx, makeKeyEvent('ArrowDown'));
        expect(focusedMentionIndex.set).toHaveBeenCalledWith(0);
      });
    });

    describe('ArrowUp in mention suggestions', () => {
      it('should move focus to previous suggestion', () => {
        const suggestions = [makeSuggestion('u1', 'Alice'), makeSuggestion('u2', 'Bob')];
        const focusedMentionIndex = { value: 1, set: vi.fn((v: number) => { focusedMentionIndex.value = v; }) };
        const ctx = makeBaseCtx({
          isMentionSuggestionsOpen: vi.fn().mockReturnValue(true),
          mentionSuggestions: vi.fn().mockReturnValue(suggestions),
          focusedMentionIndex: Object.assign(() => focusedMentionIndex.value, focusedMentionIndex),
        });
        const event = makeKeyEvent('ArrowUp');
        handleKeydownImpl(ctx, event);
        expect(focusedMentionIndex.set).toHaveBeenCalledWith(0);
        expect(event.preventDefault).toHaveBeenCalled();
      });

      it('should wrap around to last suggestion from first', () => {
        const suggestions = [makeSuggestion('u1', 'Alice'), makeSuggestion('u2', 'Bob')];
        const focusedMentionIndex = { value: 0, set: vi.fn((v: number) => { focusedMentionIndex.value = v; }) };
        const ctx = makeBaseCtx({
          isMentionSuggestionsOpen: vi.fn().mockReturnValue(true),
          mentionSuggestions: vi.fn().mockReturnValue(suggestions),
          focusedMentionIndex: Object.assign(() => focusedMentionIndex.value, focusedMentionIndex),
        });
        handleKeydownImpl(ctx, makeKeyEvent('ArrowUp'));
        expect(focusedMentionIndex.set).toHaveBeenCalledWith(1);
      });
    });

    describe('Tab key', () => {
      it('should select focused mention suggestion on Tab', () => {
        const suggestions = [makeSuggestion('u1', 'Alice')];
        const focusedMentionIndex = { value: 0, set: vi.fn() };
        const ctx = makeBaseCtx({
          isMentionSuggestionsOpen: vi.fn().mockReturnValue(true),
          mentionSuggestions: vi.fn().mockReturnValue(suggestions),
          focusedMentionIndex: Object.assign(() => focusedMentionIndex.value, focusedMentionIndex),
        });
        const event = makeKeyEvent('Tab');
        handleKeydownImpl(ctx, event);
        expect(ctx.selectMentionSuggestion).toHaveBeenCalledWith(suggestions[0]);
        expect(event.preventDefault).toHaveBeenCalled();
      });
    });

    describe('Formatting shortcuts', () => {
      it('should call handleFormattingShortcuts when enableRichText=true', () => {
        const ctx = makeBaseCtx({
          enableRichText: true,
          handleFormattingShortcuts: vi.fn().mockReturnValue(true),
        });
        handleKeydownImpl(ctx, makeKeyEvent('b', { ctrlKey: true }));
        expect(ctx.handleFormattingShortcuts).toHaveBeenCalled();
      });

      it('should not call handleFormattingShortcuts when enableRichText=false', () => {
        const ctx = makeBaseCtx({ enableRichText: false });
        handleKeydownImpl(ctx, makeKeyEvent('b', { ctrlKey: true }));
        expect(ctx.handleFormattingShortcuts).not.toHaveBeenCalled();
      });
    });

    it('should forward key event to formatters', () => {
      const ctx = makeBaseCtx();
      const event = makeKeyEvent('a');
      handleKeydownImpl(ctx, event);
      expect(ctx.forwardKeyEventToFormatters).toHaveBeenCalledWith(event, 'keydown');
    });
  });

  // ==================== handleKeyupImpl ====================

  describe('handleKeyupImpl', () => {
    it('should forward key event to formatters', () => {
      const ctx = makeBaseCtx();
      const event = makeKeyEvent('a');
      handleKeyupImpl(ctx, event);
      expect(ctx.forwardKeyEventToFormatters).toHaveBeenCalledWith(event, 'keyup');
    });

    it('should call updateFormatterCaretPosition', () => {
      const ctx = makeBaseCtx();
      handleKeyupImpl(ctx, makeKeyEvent('a'));
      expect(ctx.updateFormatterCaretPosition).toHaveBeenCalled();
    });
  });

  // ==================== handleFormattingShortcutsImpl ====================

  describe('handleFormattingShortcutsImpl', () => {
    it('should return false when no modifier key', () => {
      const ctx = makeBaseCtx();
      expect(handleFormattingShortcutsImpl(ctx, makeKeyEvent('b'))).toBe(false);
    });

    it('should call handleToolbarBold and return true for Ctrl+B', () => {
      const ctx = makeBaseCtx();
      const event = makeKeyEvent('b', { ctrlKey: true });
      const result = handleFormattingShortcutsImpl(ctx, event);
      expect(ctx.handleToolbarBold).toHaveBeenCalled();
      expect(result).toBe(true);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should call handleToolbarItalic and return true for Ctrl+I', () => {
      const ctx = makeBaseCtx();
      const event = makeKeyEvent('i', { ctrlKey: true });
      const result = handleFormattingShortcutsImpl(ctx, event);
      expect(ctx.handleToolbarItalic).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should call handleToolbarUnderline and return true for Ctrl+U', () => {
      const ctx = makeBaseCtx();
      const event = makeKeyEvent('u', { ctrlKey: true });
      const result = handleFormattingShortcutsImpl(ctx, event);
      expect(ctx.handleToolbarUnderline).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should return false for unrecognized shortcut', () => {
      const ctx = makeBaseCtx();
      expect(handleFormattingShortcutsImpl(ctx, makeKeyEvent('z', { ctrlKey: true }))).toBe(false);
    });
  });

  // ==================== handleGlobalEscapeKeyImpl ====================

  describe('handleGlobalEscapeKeyImpl', () => {
    it('should close bubble menu when visible', () => {
      const ctx = makeBaseCtx({ isBubbleMenuVisible: vi.fn().mockReturnValue(true) });
      const event = makeKeyEvent('Escape');
      handleGlobalEscapeKeyImpl(ctx, event);
      expect(ctx.closeBubbleMenu).toHaveBeenCalled();
    });

    it('should close all popups when any popup is open', () => {
      const ctx = makeBaseCtx({ isAnyPopupOpen: vi.fn().mockReturnValue(true) });
      const event = makeKeyEvent('Escape');
      handleGlobalEscapeKeyImpl(ctx, event);
      expect(ctx.closeAllPopups).toHaveBeenCalled();
    });

    it('should not throw when nothing is open', () => {
      const ctx = makeBaseCtx();
      expect(() => handleGlobalEscapeKeyImpl(ctx, makeKeyEvent('Escape'))).not.toThrow();
    });
  });

  // ==================== handleRichTextKeydownImpl ====================

  describe('handleRichTextKeydownImpl', () => {
    it('should call handleSend on Enter without Shift when SendMessage behavior', () => {
      const ctx = makeBaseCtx({ enterKeyBehavior: EnterKeyBehavior.SendMessage });
      const event = makeKeyEvent('Enter');
      handleRichTextKeydownImpl(ctx, event);
      expect(ctx.handleSend).toHaveBeenCalled();
    });

    it('should not call handleSend on Shift+Enter', () => {
      const ctx = makeBaseCtx({ enterKeyBehavior: EnterKeyBehavior.SendMessage });
      handleRichTextKeydownImpl(ctx, makeKeyEvent('Enter', { shiftKey: true }));
      expect(ctx.handleSend).not.toHaveBeenCalled();
    });

    it('should close all popups on Escape when popup is open', () => {
      const ctx = makeBaseCtx({ isAnyPopupOpen: vi.fn().mockReturnValue(true) });
      handleRichTextKeydownImpl(ctx, makeKeyEvent('Escape'));
      expect(ctx.closeAllPopups).toHaveBeenCalled();
    });

    it('should navigate mention suggestions with ArrowDown', () => {
      const suggestions = [makeSuggestion('u1', 'Alice'), makeSuggestion('u2', 'Bob')];
      const focusedMentionIndex = { value: 0, set: vi.fn((v: number) => { focusedMentionIndex.value = v; }) };
      const ctx = makeBaseCtx({
        isMentionSuggestionsOpen: vi.fn().mockReturnValue(true),
        mentionSuggestions: vi.fn().mockReturnValue(suggestions),
        focusedMentionIndex: Object.assign(() => focusedMentionIndex.value, focusedMentionIndex),
      });
      const event = makeKeyEvent('ArrowDown');
      handleRichTextKeydownImpl(ctx, event);
      expect(focusedMentionIndex.set).toHaveBeenCalledWith(1);
    });
  });
});
