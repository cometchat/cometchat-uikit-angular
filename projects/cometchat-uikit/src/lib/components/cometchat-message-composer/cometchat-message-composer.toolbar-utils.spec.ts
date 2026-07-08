/**
 * cometchat-message-composer.toolbar-utils Tests
 *
 * Covers: isFormatActive, getToolbarButtonClass, detectFormattingShortcut,
 *         computeLinkDialogLeft, getPopoversToClose.
 *
 * @module components/cometchat-message-composer/toolbar-utils
 */

import { describe, it, expect } from 'vitest';
import {
  isFormatActive,
  getToolbarButtonClass,
  detectFormattingShortcut,
  computeLinkDialogLeft,
  getPopoversToClose,
} from './cometchat-message-composer.toolbar-utils';
import { RichTextFormatState } from '../../services/rich-text-editor.interfaces';

function makeFormatState(overrides: Partial<RichTextFormatState> = {}): RichTextFormatState {
  return {
    bold: false, italic: false, underline: false, strikethrough: false,
    code: false, link: false, orderedList: false, bulletList: false,
    codeBlock: false, blockquote: false, ...overrides,
  };
}

function makeKeyEvent(key: string, opts: { ctrlKey?: boolean; metaKey?: boolean; shiftKey?: boolean } = {}): KeyboardEvent {
  return { key, ctrlKey: false, metaKey: false, shiftKey: false, ...opts } as KeyboardEvent;
}

describe('cometchat-message-composer.toolbar-utils', () => {

  // ==================== isFormatActive ====================

  describe('isFormatActive', () => {
    it('should return false when formatState is null', () => {
      expect(isFormatActive(null, 'bold')).toBe(false);
    });

    it('should return true when the format is active', () => {
      expect(isFormatActive(makeFormatState({ bold: true }), 'bold')).toBe(true);
    });

    it('should return false when the format is inactive', () => {
      expect(isFormatActive(makeFormatState({ bold: false }), 'bold')).toBe(false);
    });

    it('should check each format key independently', () => {
      const state = makeFormatState({ italic: true, bold: false });
      expect(isFormatActive(state, 'italic')).toBe(true);
      expect(isFormatActive(state, 'bold')).toBe(false);
    });

    it('should handle all format keys', () => {
      const keys: (keyof RichTextFormatState)[] = [
        'bold', 'italic', 'underline', 'strikethrough', 'code',
        'link', 'orderedList', 'bulletList', 'codeBlock', 'blockquote',
      ];
      for (const key of keys) {
        const state = makeFormatState({ [key]: true });
        expect(isFormatActive(state, key)).toBe(true);
      }
    });
  });

  // ==================== getToolbarButtonClass ====================

  describe('getToolbarButtonClass', () => {
    it('should return base class when inactive', () => {
      expect(getToolbarButtonClass(false)).toBe('cometchat-message-composer__toolbar-btn');
    });

    it('should return base + active modifier when active', () => {
      expect(getToolbarButtonClass(true)).toBe(
        'cometchat-message-composer__toolbar-btn cometchat-message-composer__toolbar-btn--active'
      );
    });
  });

  // ==================== detectFormattingShortcut ====================

  describe('detectFormattingShortcut', () => {
    it('should return null when no modifier key', () => {
      expect(detectFormattingShortcut(makeKeyEvent('b'))).toBeNull();
    });

    it('should detect bold (Ctrl+B)', () => {
      expect(detectFormattingShortcut(makeKeyEvent('b', { ctrlKey: true }))).toBe('bold');
    });

    it('should detect bold (Cmd+B)', () => {
      expect(detectFormattingShortcut(makeKeyEvent('b', { metaKey: true }))).toBe('bold');
    });

    it('should detect italic (Ctrl+I)', () => {
      expect(detectFormattingShortcut(makeKeyEvent('i', { ctrlKey: true }))).toBe('italic');
    });

    it('should detect underline (Ctrl+U)', () => {
      expect(detectFormattingShortcut(makeKeyEvent('u', { ctrlKey: true }))).toBe('underline');
    });

    it('should detect strikethrough (Ctrl+Shift+S)', () => {
      expect(detectFormattingShortcut(makeKeyEvent('s', { ctrlKey: true, shiftKey: true }))).toBe('strikethrough');
    });

    it('should return null for Ctrl+S without Shift', () => {
      expect(detectFormattingShortcut(makeKeyEvent('s', { ctrlKey: true }))).toBeNull();
    });

    it('should detect inline code (Ctrl+E)', () => {
      expect(detectFormattingShortcut(makeKeyEvent('e', { ctrlKey: true }))).toBe('inlineCode');
    });

    it('should detect link (Ctrl+K)', () => {
      expect(detectFormattingShortcut(makeKeyEvent('k', { ctrlKey: true }))).toBe('link');
    });

    it('should detect ordered list (Ctrl+Shift+7)', () => {
      expect(detectFormattingShortcut(makeKeyEvent('7', { ctrlKey: true, shiftKey: true }))).toBe('orderedList');
    });

    it('should return null for Ctrl+7 without Shift', () => {
      expect(detectFormattingShortcut(makeKeyEvent('7', { ctrlKey: true }))).toBeNull();
    });

    it('should detect bullet list (Ctrl+Shift+8)', () => {
      expect(detectFormattingShortcut(makeKeyEvent('8', { ctrlKey: true, shiftKey: true }))).toBe('bulletList');
    });

    it('should return null for unknown key', () => {
      expect(detectFormattingShortcut(makeKeyEvent('z', { ctrlKey: true }))).toBeNull();
    });

    it('should be case-insensitive for key detection', () => {
      expect(detectFormattingShortcut(makeKeyEvent('B', { ctrlKey: true }))).toBe('bold');
    });
  });

  // ==================== computeLinkDialogLeft ====================

  describe('computeLinkDialogLeft', () => {
    it('should return viewportX when it fits within viewport', () => {
      // viewportX=100, dialogWidth=320, viewportWidth=1024
      // maxLeft = 1024 - 320 - 8 = 696; result = max(8, min(100, 696)) = 100
      expect(computeLinkDialogLeft(100, 320, 1024)).toBe(100);
    });

    it('should clamp to margin when viewportX is too small', () => {
      // viewportX=0 → max(8, min(0, 696)) = 8
      expect(computeLinkDialogLeft(0, 320, 1024)).toBe(8);
    });

    it('should clamp to maxLeft when viewportX is too large', () => {
      // viewportX=900, maxLeft=696 → max(8, min(900, 696)) = 696
      expect(computeLinkDialogLeft(900, 320, 1024)).toBe(696);
    });

    it('should handle narrow viewport', () => {
      // viewportX=200, dialogWidth=320, viewportWidth=400
      // maxLeft = 400 - 320 - 8 = 72; result = max(8, min(200, 72)) = 72
      expect(computeLinkDialogLeft(200, 320, 400)).toBe(72);
    });

    it('should use default dialog width of 320', () => {
      const result = computeLinkDialogLeft(100, undefined, 1024);
      expect(result).toBe(100);
    });
  });

  // ==================== getPopoversToClose ====================

  describe('getPopoversToClose', () => {
    it('should return all popovers except the one opening', () => {
      const result = getPopoversToClose('emoji');
      expect(result).not.toContain('emoji');
      expect(result).toContain('attachment');
      expect(result).toContain('voice');
      expect(result).toContain('stickers');
      expect(result).toContain('ai');
    });

    it('should return 4 items when one is excluded', () => {
      expect(getPopoversToClose('emoji').length).toBe(4);
      expect(getPopoversToClose('attachment').length).toBe(4);
    });

    it('should exclude the correct popover for each name', () => {
      const names = ['emoji', 'attachment', 'voice', 'stickers', 'ai'] as const;
      for (const name of names) {
        const result = getPopoversToClose(name);
        expect(result).not.toContain(name);
        expect(result.length).toBe(4);
      }
    });
  });
});
