/**
 * cometchat-message-list.scroll-utils Tests
 *
 * Covers: saveScrollPosition, restoreScrollPosition, isScrolledToBottom,
 *         scrollToBottom, findMessageElement, highlightAndScrollToElement,
 *         getStickyDateFromScroll, scrollToBottomWithRetry.
 *
 * @module components/cometchat-message-list/scroll-utils
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  saveScrollPosition,
  restoreScrollPosition,
  isScrolledToBottom,
  scrollToBottom,
  findMessageElement,
  highlightAndScrollToElement,
  getStickyDateFromScroll,
  scrollToBottomWithRetry,
} from './cometchat-message-list.scroll-utils';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeContainer(scrollTop = 0, scrollHeight = 1000, clientHeight = 500): HTMLElement {
  const el = document.createElement('div');
  Object.defineProperty(el, 'scrollTop', {
    get: () => scrollTop,
    set: (v) => { scrollTop = v; },
    configurable: true,
  });
  Object.defineProperty(el, 'scrollHeight', { get: () => scrollHeight, configurable: true });
  Object.defineProperty(el, 'clientHeight', { get: () => clientHeight, configurable: true });
  el.scrollTo = vi.fn(({ top }: ScrollToOptions) => {
    scrollTop = top ?? scrollTop;
  });
  return el;
}

describe('cometchat-message-list.scroll-utils', () => {

  // ==================== saveScrollPosition ====================

  describe('saveScrollPosition', () => {
    it('should capture scrollTop and scrollHeight', () => {
      const container = makeContainer(200, 1000, 500);
      const pos = saveScrollPosition(container);
      expect(pos.scrollTop).toBe(200);
      expect(pos.scrollHeight).toBe(1000);
    });

    it('should capture zero values correctly', () => {
      const container = makeContainer(0, 500, 500);
      const pos = saveScrollPosition(container);
      expect(pos.scrollTop).toBe(0);
      expect(pos.scrollHeight).toBe(500);
    });
  });

  // ==================== restoreScrollPosition ====================

  describe('restoreScrollPosition', () => {
    it('should adjust scrollTop by the height difference', () => {
      let scrollTop = 200;
      const container = document.createElement('div');
      Object.defineProperty(container, 'scrollTop', {
        get: () => scrollTop,
        set: (v) => { scrollTop = v; },
        configurable: true,
      });
      Object.defineProperty(container, 'scrollHeight', { get: () => 1500, configurable: true });

      const saved = { scrollTop: 200, scrollHeight: 1000 };
      restoreScrollPosition(container, saved);
      // heightDiff = 1500 - 1000 = 500; new scrollTop = 200 + 500 = 700
      expect(scrollTop).toBe(700);
    });

    it('should not change scrollTop when height is unchanged', () => {
      let scrollTop = 300;
      const container = document.createElement('div');
      Object.defineProperty(container, 'scrollTop', {
        get: () => scrollTop,
        set: (v) => { scrollTop = v; },
        configurable: true,
      });
      Object.defineProperty(container, 'scrollHeight', { get: () => 1000, configurable: true });

      const saved = { scrollTop: 300, scrollHeight: 1000 };
      restoreScrollPosition(container, saved);
      expect(scrollTop).toBe(300);
    });
  });

  // ==================== isScrolledToBottom ====================

  describe('isScrolledToBottom', () => {
    it('should return true when at the bottom (distance = 0)', () => {
      // scrollHeight=1000, scrollTop=500, clientHeight=500 → distance=0
      const container = makeContainer(500, 1000, 500);
      expect(isScrolledToBottom(container)).toBe(true);
    });

    it('should return true when within default threshold (50px)', () => {
      // distance = 1000 - 450 - 500 = 50
      const container = makeContainer(450, 1000, 500);
      expect(isScrolledToBottom(container)).toBe(true);
    });

    it('should return false when beyond default threshold', () => {
      // distance = 1000 - 400 - 500 = 100 > 50
      const container = makeContainer(400, 1000, 500);
      expect(isScrolledToBottom(container)).toBe(false);
    });

    it('should use custom threshold', () => {
      // distance = 1000 - 400 - 500 = 100; threshold=150 → true
      const container = makeContainer(400, 1000, 500);
      expect(isScrolledToBottom(container, 150)).toBe(true);
    });

    it('should return false when far from bottom', () => {
      const container = makeContainer(0, 1000, 500);
      expect(isScrolledToBottom(container)).toBe(false);
    });
  });

  // ==================== scrollToBottom ====================

  describe('scrollToBottom', () => {
    it('should call scrollTo with scrollHeight as top', () => {
      const container = makeContainer(0, 1000, 500);
      scrollToBottom(container);
      expect(container.scrollTo).toHaveBeenCalledWith({ top: 1000, behavior: 'auto' });
    });

    it('should use smooth behavior when smooth=true', () => {
      const container = makeContainer(0, 1000, 500);
      scrollToBottom(container, true);
      expect(container.scrollTo).toHaveBeenCalledWith({ top: 1000, behavior: 'smooth' });
    });

    it('should use auto behavior by default', () => {
      const container = makeContainer(0, 800, 400);
      scrollToBottom(container);
      expect(container.scrollTo).toHaveBeenCalledWith({ top: 800, behavior: 'auto' });
    });
  });

  // ==================== findMessageElement ====================

  describe('findMessageElement', () => {
    let container: HTMLElement;

    beforeEach(() => {
      container = document.createElement('div');
      const msg1 = document.createElement('div');
      msg1.setAttribute('data-message-id', '101');
      const msg2 = document.createElement('div');
      msg2.setAttribute('data-message-id', '102');
      container.appendChild(msg1);
      container.appendChild(msg2);
    });

    it('should find an element by numeric message ID', () => {
      const el = findMessageElement(container, 101);
      expect(el).not.toBeNull();
      expect(el?.getAttribute('data-message-id')).toBe('101');
    });

    it('should find an element by string message ID', () => {
      const el = findMessageElement(container, '102');
      expect(el).not.toBeNull();
      expect(el?.getAttribute('data-message-id')).toBe('102');
    });

    it('should return null when message ID does not exist', () => {
      const el = findMessageElement(container, 999);
      expect(el).toBeNull();
    });
  });

  // ==================== highlightAndScrollToElement ====================

  describe('highlightAndScrollToElement', () => {
    it('should call scrollIntoView on the element', () => {
      const el = document.createElement('div');
      el.scrollIntoView = vi.fn();
      vi.useFakeTimers();

      highlightAndScrollToElement(el);

      expect(el.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' });
      vi.useRealTimers();
    });

    it('should add the highlight class immediately', () => {
      const el = document.createElement('div');
      el.scrollIntoView = vi.fn();
      vi.useFakeTimers();

      highlightAndScrollToElement(el, 'highlight-class');
      expect(el.classList.contains('highlight-class')).toBe(true);

      vi.useRealTimers();
    });

    it('should remove the highlight class after the duration', () => {
      const el = document.createElement('div');
      el.scrollIntoView = vi.fn();
      vi.useFakeTimers();

      highlightAndScrollToElement(el, 'highlight-class', 1000);
      expect(el.classList.contains('highlight-class')).toBe(true);

      vi.advanceTimersByTime(1000);
      expect(el.classList.contains('highlight-class')).toBe(false);

      vi.useRealTimers();
    });

    it('should use default highlight class when none provided', () => {
      const el = document.createElement('div');
      el.scrollIntoView = vi.fn();
      vi.useFakeTimers();

      highlightAndScrollToElement(el);
      expect(el.classList.contains('cometchat-message-list__message--highlighted')).toBe(true);

      vi.useRealTimers();
    });
  });

  // ==================== getStickyDateFromScroll ====================

  describe('getStickyDateFromScroll', () => {
    it('should return null when no date separators exist', () => {
      const container = document.createElement('div');
      expect(getStickyDateFromScroll(container)).toBeNull();
    });

    it('should return null when no separators are above the viewport top', () => {
      const container = document.createElement('div');
      Object.defineProperty(container, 'getBoundingClientRect', {
        value: () => ({ top: 100 }),
      });

      const sep = document.createElement('div');
      sep.setAttribute('data-date-separator', '1705276800');
      Object.defineProperty(sep, 'getBoundingClientRect', {
        value: () => ({ top: 200 }), // below container top
      });
      container.appendChild(sep);

      expect(getStickyDateFromScroll(container)).toBeNull();
    });

    it('should return the timestamp of the last separator above the viewport top', () => {
      const container = document.createElement('div');
      Object.defineProperty(container, 'getBoundingClientRect', {
        value: () => ({ top: 100 }),
      });

      const sep1 = document.createElement('div');
      sep1.setAttribute('data-date-separator', '1705276800');
      Object.defineProperty(sep1, 'getBoundingClientRect', {
        value: () => ({ top: 50 }), // above container top (50 - 100 = -50 <= 0)
      });

      const sep2 = document.createElement('div');
      sep2.setAttribute('data-date-separator', '1705363200');
      Object.defineProperty(sep2, 'getBoundingClientRect', {
        value: () => ({ top: 80 }), // above container top (80 - 100 = -20 <= 0)
      });

      container.appendChild(sep1);
      container.appendChild(sep2);

      const result = getStickyDateFromScroll(container);
      expect(result).toBe(1705363200);
    });
  });

  // ==================== scrollToBottomWithRetry ====================

  describe('scrollToBottomWithRetry', () => {
    it('should call scrollTo immediately', () => {
      const container = makeContainer(0, 1000, 500);
      vi.useFakeTimers();

      scrollToBottomWithRetry(container, 0);
      expect(container.scrollTo).toHaveBeenCalledTimes(1);

      vi.useRealTimers();
    });

    it('should retry the specified number of times', () => {
      const container = makeContainer(0, 1000, 500);
      vi.useFakeTimers();

      scrollToBottomWithRetry(container, 2, 100);
      expect(container.scrollTo).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(100);
      expect(container.scrollTo).toHaveBeenCalledTimes(2);

      vi.advanceTimersByTime(100);
      expect(container.scrollTo).toHaveBeenCalledTimes(3);

      vi.useRealTimers();
    });

    it('should not retry when retries=0', () => {
      const container = makeContainer(0, 1000, 500);
      vi.useFakeTimers();

      scrollToBottomWithRetry(container, 0, 100);
      vi.advanceTimersByTime(500);
      expect(container.scrollTo).toHaveBeenCalledTimes(1);

      vi.useRealTimers();
    });

    it('should pass smooth=true to scrollTo when specified', () => {
      const container = makeContainer(0, 1000, 500);
      vi.useFakeTimers();

      scrollToBottomWithRetry(container, 0, 100, true);
      expect(container.scrollTo).toHaveBeenCalledWith({ top: 1000, behavior: 'smooth' });

      vi.useRealTimers();
    });
  });
});
