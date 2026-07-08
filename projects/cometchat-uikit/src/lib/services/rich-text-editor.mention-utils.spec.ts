/**
 * rich-text-editor.mention-utils Tests
 *
 * Covers: isMentionNode, findMentionAncestor, getMentionsInRange,
 *         doesRangeIntersectNode, extendSelectionToIncludeMentions,
 *         getUniqueMentionUids, convertMentionsToPlainText,
 *         MENTION_CHIP_CLASS constant.
 *
 * @module services/rich-text-editor.mention-utils
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  MENTION_CHIP_CLASS,
  isMentionNode,
  findMentionAncestor,
  getMentionsInRange,
  doesRangeIntersectNode,
  extendSelectionToIncludeMentions,
  getUniqueMentionUids,
  convertMentionsToPlainText,
} from './rich-text-editor.mention-utils';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeMentionChip(uid: string, name: string): HTMLElement {
  const span = document.createElement('span');
  span.classList.add(MENTION_CHIP_CLASS);
  span.setAttribute('data-uid', uid);
  span.textContent = `@${name}`;
  return span;
}

function makeContainer(...children: HTMLElement[]): HTMLElement {
  const div = document.createElement('div');
  div.setAttribute('contenteditable', 'true');
  children.forEach(c => div.appendChild(c));
  return div;
}

describe('rich-text-editor.mention-utils', () => {

  // ==================== MENTION_CHIP_CLASS ====================

  describe('MENTION_CHIP_CLASS', () => {
    it('should be a non-empty string', () => {
      expect(typeof MENTION_CHIP_CLASS).toBe('string');
      expect(MENTION_CHIP_CLASS.length).toBeGreaterThan(0);
    });
  });

  // ==================== isMentionNode ====================

  describe('isMentionNode', () => {
    it('should return true for element with mention chip class', () => {
      const el = makeMentionChip('u1', 'Alice');
      expect(isMentionNode(el)).toBe(true);
    });

    it('should return false for element without mention chip class', () => {
      const el = document.createElement('span');
      expect(isMentionNode(el)).toBe(false);
    });

    it('should return false for text node', () => {
      const textNode = document.createTextNode('Hello');
      expect(isMentionNode(textNode)).toBe(false);
    });

    it('should return false for div element', () => {
      const div = document.createElement('div');
      expect(isMentionNode(div)).toBe(false);
    });
  });

  // ==================== findMentionAncestor ====================

  describe('findMentionAncestor', () => {
    it('should return the mention node itself when it is a mention', () => {
      const chip = makeMentionChip('u1', 'Alice');
      expect(findMentionAncestor(chip)).toBe(chip);
    });

    it('should return the mention ancestor for a child node', () => {
      const chip = makeMentionChip('u1', 'Alice');
      const textNode = document.createTextNode('@Alice');
      chip.appendChild(textNode);
      expect(findMentionAncestor(textNode)).toBe(chip);
    });

    it('should return null when no mention ancestor exists', () => {
      const div = document.createElement('div');
      const span = document.createElement('span');
      div.appendChild(span);
      expect(findMentionAncestor(span)).toBeNull();
    });

    it('should return null for a top-level non-mention element', () => {
      const div = document.createElement('div');
      expect(findMentionAncestor(div)).toBeNull();
    });
  });

  // ==================== getUniqueMentionUids ====================

  describe('getUniqueMentionUids', () => {
    it('should return empty set for container with no mentions', () => {
      const container = makeContainer();
      container.textContent = 'Hello world';
      const uids = getUniqueMentionUids(container);
      expect(uids.size).toBe(0);
    });

    it('should return UIDs of all mention chips', () => {
      const chip1 = makeMentionChip('uid1', 'Alice');
      const chip2 = makeMentionChip('uid2', 'Bob');
      const container = makeContainer(chip1, chip2);
      const uids = getUniqueMentionUids(container);
      expect(uids.has('uid1')).toBe(true);
      expect(uids.has('uid2')).toBe(true);
      expect(uids.size).toBe(2);
    });

    it('should deduplicate repeated mentions of the same user', () => {
      const chip1 = makeMentionChip('uid1', 'Alice');
      const chip2 = makeMentionChip('uid1', 'Alice'); // same UID
      const container = makeContainer(chip1, chip2);
      const uids = getUniqueMentionUids(container);
      expect(uids.size).toBe(1);
      expect(uids.has('uid1')).toBe(true);
    });

    it('should skip chips without data-uid attribute', () => {
      const chip = document.createElement('span');
      chip.classList.add(MENTION_CHIP_CLASS);
      // No data-uid set
      const container = makeContainer(chip);
      const uids = getUniqueMentionUids(container);
      expect(uids.size).toBe(0);
    });
  });

  // ==================== convertMentionsToPlainText ====================

  describe('convertMentionsToPlainText', () => {
    it('should replace mention chips with @uid text nodes', () => {
      const chip = makeMentionChip('uid1', 'Alice');
      const container = makeContainer(chip);
      convertMentionsToPlainText(container);
      expect(container.querySelector(`.${MENTION_CHIP_CLASS}`)).toBeNull();
      expect(container.textContent).toContain('@uid1');
    });

    it('should handle container with no mentions', () => {
      const container = makeContainer();
      container.textContent = 'Hello world';
      expect(() => convertMentionsToPlainText(container)).not.toThrow();
      expect(container.textContent).toBe('Hello world');
    });

    it('should replace multiple mention chips', () => {
      const chip1 = makeMentionChip('uid1', 'Alice');
      const chip2 = makeMentionChip('uid2', 'Bob');
      const container = makeContainer(chip1, chip2);
      convertMentionsToPlainText(container);
      expect(container.textContent).toContain('@uid1');
      expect(container.textContent).toContain('@uid2');
    });
  });

  // ==================== doesRangeIntersectNode ====================

  describe('doesRangeIntersectNode', () => {
    it('should return true when range contains the node', () => {
      const container = document.createElement('div');
      document.body.appendChild(container);
      const text1 = document.createTextNode('before ');
      const span = document.createElement('span');
      span.textContent = 'target';
      const text2 = document.createTextNode(' after');
      container.appendChild(text1);
      container.appendChild(span);
      container.appendChild(text2);

      const range = document.createRange();
      range.selectNodeContents(container);

      expect(doesRangeIntersectNode(range, span)).toBe(true);
      document.body.removeChild(container);
    });

    it('should return false when range does not include the node', () => {
      const container = document.createElement('div');
      document.body.appendChild(container);
      const text1 = document.createTextNode('before');
      const span = document.createElement('span');
      span.textContent = 'target';
      container.appendChild(text1);
      container.appendChild(span);

      const range = document.createRange();
      range.selectNode(text1);

      expect(doesRangeIntersectNode(range, span)).toBe(false);
      document.body.removeChild(container);
    });
  });

  // ==================== getMentionsInRange ====================

  describe('getMentionsInRange', () => {
    it('should return empty array when no mentions in container', () => {
      const container = document.createElement('div');
      document.body.appendChild(container);
      container.textContent = 'Hello world';
      const range = document.createRange();
      range.selectNodeContents(container);
      expect(getMentionsInRange(range, container)).toEqual([]);
      document.body.removeChild(container);
    });

    it('should return mentions that intersect the range', () => {
      const container = document.createElement('div');
      document.body.appendChild(container);
      const chip = makeMentionChip('uid1', 'Alice');
      container.appendChild(chip);

      const range = document.createRange();
      range.selectNodeContents(container);

      const result = getMentionsInRange(range, container);
      expect(result.length).toBe(1);
      expect(result[0]).toBe(chip);
      document.body.removeChild(container);
    });
  });

  // ==================== extendSelectionToIncludeMentions ====================

  describe('extendSelectionToIncludeMentions', () => {
    it('should not throw when mentions array is empty', () => {
      const container = document.createElement('div');
      document.body.appendChild(container);
      container.textContent = 'Hello';
      const range = document.createRange();
      range.selectNodeContents(container);
      expect(() => extendSelectionToIncludeMentions(range, [])).not.toThrow();
      document.body.removeChild(container);
    });
  });
});
