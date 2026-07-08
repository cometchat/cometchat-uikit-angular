/**
 * rich-text-editor.custom-formatters Tests
 *
 * Covers: scheduleCustomFormattersImpl (debounce, no-op when empty),
 *         applyCustomFormattersImpl (text node wrapping, span creation,
 *         no-op when no matches, cursor marker handling).
 *
 * @module services/rich-text-editor.custom-formatters
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  scheduleCustomFormattersImpl,
  applyCustomFormattersImpl,
  CustomFormattersContext,
} from './rich-text-editor.custom-formatters';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeFormatter(id: string, pattern: string, formatFn?: (text: string) => string) {
  return {
    id,
    getRegex: () => new RegExp(pattern, 'g'),
    format: formatFn ?? ((text: string) => `<span data-custom-format="${id}">${text}</span>`),
  };
}

function makeCtx(overrides: Partial<CustomFormattersContext> = {}): CustomFormattersContext {
  const div = document.createElement('div');
  div.setAttribute('contenteditable', 'true');
  Object.defineProperty(div, 'isConnected', { get: () => true, configurable: true });

  return {
    customFormatters: [],
    contentEditable: div,
    isInBlockquote: vi.fn().mockReturnValue(false),
    getCharacterOffset: vi.fn().mockReturnValue(0),
    restoreCharacterOffset: vi.fn(),
    selectionManager: { getSelection: vi.fn().mockReturnValue(null) },
    ...overrides,
  };
}

describe('rich-text-editor.custom-formatters', () => {

  // ==================== scheduleCustomFormattersImpl ====================

  describe('scheduleCustomFormattersImpl', () => {
    it('should not schedule when customFormatters is empty', () => {
      vi.useFakeTimers();
      const ctx = makeCtx({ customFormatters: [] });
      const timerRef = { value: null };
      const applyFn = vi.fn();
      scheduleCustomFormattersImpl(ctx, timerRef, applyFn);
      vi.advanceTimersByTime(200);
      expect(applyFn).not.toHaveBeenCalled();
      vi.useRealTimers();
    });

    it('should schedule applyFn after 150ms when formatters exist', () => {
      vi.useFakeTimers();
      const ctx = makeCtx({ customFormatters: [makeFormatter('bold', '\\*\\*(.+?)\\*\\*') as any] });
      const timerRef = { value: null };
      const applyFn = vi.fn();
      scheduleCustomFormattersImpl(ctx, timerRef, applyFn);
      expect(applyFn).not.toHaveBeenCalled();
      vi.advanceTimersByTime(150);
      expect(applyFn).toHaveBeenCalledTimes(1);
      vi.useRealTimers();
    });

    it('should debounce — cancel previous timer when called again', () => {
      vi.useFakeTimers();
      const ctx = makeCtx({ customFormatters: [makeFormatter('bold', '\\*\\*(.+?)\\*\\*') as any] });
      const timerRef = { value: null };
      const applyFn = vi.fn();
      scheduleCustomFormattersImpl(ctx, timerRef, applyFn);
      vi.advanceTimersByTime(50);
      scheduleCustomFormattersImpl(ctx, timerRef, applyFn);
      vi.advanceTimersByTime(150);
      expect(applyFn).toHaveBeenCalledTimes(1);
      vi.useRealTimers();
    });

    it('should not call applyFn when contentEditable is disconnected', () => {
      vi.useFakeTimers();
      const div = document.createElement('div');
      Object.defineProperty(div, 'isConnected', { get: () => false, configurable: true });
      const ctx = makeCtx({
        customFormatters: [makeFormatter('bold', '\\*\\*(.+?)\\*\\*') as any],
        contentEditable: div,
      });
      const timerRef = { value: null };
      const applyFn = vi.fn();
      scheduleCustomFormattersImpl(ctx, timerRef, applyFn);
      vi.advanceTimersByTime(200);
      expect(applyFn).not.toHaveBeenCalled();
      vi.useRealTimers();
    });

    it('should set timerRef.value to null after execution', () => {
      vi.useFakeTimers();
      const ctx = makeCtx({ customFormatters: [makeFormatter('bold', '\\*\\*(.+?)\\*\\*') as any] });
      const timerRef = { value: null as any };
      scheduleCustomFormattersImpl(ctx, timerRef, vi.fn());
      vi.advanceTimersByTime(200);
      expect(timerRef.value).toBeNull();
      vi.useRealTimers();
    });
  });

  // ==================== applyCustomFormattersImpl ====================

  describe('applyCustomFormattersImpl', () => {
    it('should do nothing when customFormatters is empty', () => {
      const ctx = makeCtx({ customFormatters: [] });
      ctx.contentEditable.textContent = 'Hello **world**';
      applyCustomFormattersImpl(ctx);
      // No spans should be created
      expect(ctx.contentEditable.querySelectorAll('span[data-custom-format]').length).toBe(0);
    });

    it('should do nothing when text has no matches', () => {
      const ctx = makeCtx({
        customFormatters: [makeFormatter('bold', '\\*\\*(.+?)\\*\\*') as any],
      });
      ctx.contentEditable.textContent = 'Hello world no bold here';
      applyCustomFormattersImpl(ctx);
      expect(ctx.contentEditable.querySelectorAll('span[data-custom-format]').length).toBe(0);
    });

    it('should wrap matching text in a span with data-custom-format', () => {
      const formatter = makeFormatter('hashtag', '#\\w+');
      const ctx = makeCtx({ customFormatters: [formatter as any] });
      ctx.contentEditable.textContent = 'Hello #world today';
      applyCustomFormattersImpl(ctx);
      const spans = ctx.contentEditable.querySelectorAll('span[data-custom-format="hashtag"]');
      expect(spans.length).toBe(1);
      expect(spans[0].textContent).toBe('#world');
    });

    it('should handle multiple matches in the same text node', () => {
      const formatter = makeFormatter('hashtag', '#\\w+');
      const ctx = makeCtx({ customFormatters: [formatter as any] });
      ctx.contentEditable.textContent = '#hello and #world';
      applyCustomFormattersImpl(ctx);
      const spans = ctx.contentEditable.querySelectorAll('span[data-custom-format="hashtag"]');
      expect(spans.length).toBe(2);
    });

    it('should preserve non-matching text around matches', () => {
      const formatter = makeFormatter('hashtag', '#\\w+');
      const ctx = makeCtx({ customFormatters: [formatter as any] });
      ctx.contentEditable.textContent = 'before #tag after';
      applyCustomFormattersImpl(ctx);
      expect(ctx.contentEditable.textContent).toContain('before');
      expect(ctx.contentEditable.textContent).toContain('after');
      expect(ctx.contentEditable.textContent).toContain('#tag');
    });

    it('should remove existing custom format spans before re-applying', () => {
      const formatter = makeFormatter('hashtag', '#\\w+');
      const ctx = makeCtx({ customFormatters: [formatter as any] });
      ctx.contentEditable.textContent = '#hello';
      applyCustomFormattersImpl(ctx);
      // Apply again — should not double-wrap
      applyCustomFormattersImpl(ctx);
      const spans = ctx.contentEditable.querySelectorAll('span[data-custom-format="hashtag"]');
      expect(spans.length).toBe(1);
    });

    it('should skip mention chip elements (data-uid)', () => {
      const formatter = makeFormatter('hashtag', '#\\w+');
      const ctx = makeCtx({ customFormatters: [formatter as any] });
      const mentionChip = document.createElement('span');
      mentionChip.setAttribute('data-uid', 'uid1');
      mentionChip.textContent = '#alice'; // looks like a hashtag but inside mention
      ctx.contentEditable.appendChild(mentionChip);
      applyCustomFormattersImpl(ctx);
      // The mention chip text should not be wrapped
      expect(mentionChip.querySelector('span[data-custom-format]')).toBeNull();
    });

    it('should handle multiple formatters', () => {
      const hashFormatter = makeFormatter('hashtag', '#\\w+');
      const mentionFormatter = makeFormatter('mention', '@\\w+');
      const ctx = makeCtx({ customFormatters: [hashFormatter as any, mentionFormatter as any] });
      ctx.contentEditable.textContent = '#hello @world';
      applyCustomFormattersImpl(ctx);
      const hashSpans = ctx.contentEditable.querySelectorAll('span[data-custom-format="hashtag"]');
      const mentionSpans = ctx.contentEditable.querySelectorAll('span[data-custom-format="mention"]');
      expect(hashSpans.length).toBe(1);
      expect(mentionSpans.length).toBe(1);
    });
  });
});
