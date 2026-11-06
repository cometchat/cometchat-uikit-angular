/**
 * Property-Based Tests for Rich Text Editor Formatting Scope
 *
 * **Validates: Requirements 10.4**
 *
 * These tests verify that block-level formatting commands (blockquote, lists, code blocks)
 * only apply to the current block/line when no text is selected, and only to selected
 * content when text is selected, without affecting the entire document.
 *
 * The editor was originally built on TipTap; it is now the native contenteditable
 * RichTextEditor created by RichTextEditorService. The tests drive the same service
 * API (`toggleBlockquote`, `toggleBulletList`, `toggleOrderedList`, `toggleCodeBlock`)
 * against the real editor DOM, using a real DOM Selection to place the cursor.
 *
 * Note: jsdom has no `document.execCommand`, so list toggles exercise the editor's
 * manual list-creation fallback. The scope property — sibling blocks are untouched —
 * is what is asserted for every command.
 *
 * @see .kiro/specs/uikit-critical-bugfixes/requirements.md - Requirement 10
 */

import { describe, it, expect, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { RichTextEditorService } from './rich-text-editor.service';
import { RichTextEditor } from './rich-text-editor.class';

type BlockToggle = 'toggleBlockquote' | 'toggleBulletList' | 'toggleOrderedList' | 'toggleCodeBlock';

interface Harness {
  service: RichTextEditorService;
  editor: RichTextEditor;
  host: HTMLElement;
  content: HTMLElement;
}

const liveHarnesses: Harness[] = [];

/** Non-blank line text (arbitrary characters, inserted as text — never parsed as HTML). */
const lineArb = fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0);

/** Creates a fresh editor attached to the document with the given blocks as content. */
function createHarness(blocks: { tag: string; text: string }[]): Harness {
  const service = new RichTextEditorService();
  const host = document.createElement('div');
  document.body.appendChild(host);
  const editor = service.createEditor({ placeholder: 'Test' }, host);
  const content = host.querySelector('.cometchat-rich-text-editor__content') as HTMLElement;

  content.innerHTML = '';
  for (const block of blocks) {
    const el = document.createElement(block.tag);
    if (block.tag === 'blockquote') {
      const p = document.createElement('p');
      p.textContent = block.text;
      el.appendChild(p);
    } else {
      el.textContent = block.text;
    }
    content.appendChild(el);
  }

  const harness = { service, editor, host, content };
  liveHarnesses.push(harness);
  return harness;
}

function destroyHarness(harness: Harness): void {
  const idx = liveHarnesses.indexOf(harness);
  if (idx >= 0) liveHarnesses.splice(idx, 1);
  harness.service.destroyEditor(harness.editor);
  harness.host.remove();
  window.getSelection()?.removeAllRanges();
}

/** Places a collapsed cursor at `offset` inside the text of `block`. */
function placeCursor(block: Element, offset = 0): void {
  const textNode = block.firstChild as Text;
  const range = document.createRange();
  range.setStart(textNode, Math.min(offset, textNode.length));
  range.collapse(true);
  const selection = window.getSelection()!;
  selection.removeAllRanges();
  selection.addRange(range);
}

/** Selects the whole text of `block`. */
function selectBlockText(block: Element): void {
  const textNode = block.firstChild as Text;
  const range = document.createRange();
  range.setStart(textNode, 0);
  range.setEnd(textNode, textNode.length);
  const selection = window.getSelection()!;
  selection.removeAllRanges();
  selection.addRange(range);
}

/** Tag names of the editor's top-level blocks, in order. */
function topLevelTags(content: HTMLElement): string[] {
  return Array.from(content.children).map(el => el.tagName.toLowerCase());
}

/**
 * Applies `toggle` to the middle of three paragraphs and asserts only that block changed.
 * Returns the resulting top-level middle element for command-specific assertions.
 */
function applyToMiddleParagraph(
  toggle: BlockToggle,
  lines: [string, string, string],
  mode: 'cursor' | 'selection'
): { harness: Harness; middle: Element } {
  const harness = createHarness(lines.map(text => ({ tag: 'p', text })));
  const [first, middle, last] = Array.from(harness.content.children);

  if (mode === 'cursor') {
    placeCursor(middle, Math.floor(lines[1].length / 2));
  } else {
    selectBlockText(middle);
  }

  harness.service[toggle](harness.editor);

  const children = Array.from(harness.content.children);
  // The document still has three top-level blocks: the formatting did not spread
  // into, merge, or swallow the sibling paragraphs.
  expect(children.length).toBe(3);

  // First and last paragraphs are untouched — same element, same tag, same text.
  expect(children[0]).toBe(first);
  expect(children[2]).toBe(last);
  expect(children[0].tagName.toLowerCase()).toBe('p');
  expect(children[2].tagName.toLowerCase()).toBe('p');
  expect(children[0].textContent).toBe(lines[0]);
  expect(children[2].textContent).toBe(lines[2]);
  expect(children[0].querySelector('blockquote, pre, ol, ul')).toBeNull();
  expect(children[2].querySelector('blockquote, pre, ol, ul')).toBeNull();

  return { harness, middle: children[1] };
}

afterEach(() => {
  while (liveHarnesses.length > 0) {
    destroyHarness(liveHarnesses[0]);
  }
});

describe('Rich Text Editor - Formatting Scope Respect (Property-Based)', () => {
  /**
   * Property 7: Formatting Scope Respect
   *
   * For any block-level formatting command (blockquote, list, code block) applied
   * when text is selected, the formatting should only affect the selected text blocks,
   * not the entire document.
   *
   * **Validates: Requirements 10.4**
   */
  describe('Property 7: Formatting Scope Respect', () => {
    describe('Blockquote formatting', () => {
      it('should only affect current block when no selection', () => {
        fc.assert(
          fc.property(lineArb, lineArb, lineArb, (line1, line2, line3) => {
            const { harness, middle } = applyToMiddleParagraph('toggleBlockquote', [line1, line2, line3], 'cursor');

            expect(middle.tagName.toLowerCase()).toBe('blockquote');
            expect(middle.textContent).toBe(line2);
            expect(harness.content.querySelectorAll('blockquote').length).toBe(1);
            destroyHarness(harness);
          }),
          { numRuns: 50 }
        );
      });

      it('should only affect selected content when text is selected', () => {
        fc.assert(
          fc.property(lineArb, lineArb, lineArb, (line1, line2, line3) => {
            const { harness, middle } = applyToMiddleParagraph('toggleBlockquote', [line1, line2, line3], 'selection');

            expect(middle.tagName.toLowerCase()).toBe('blockquote');
            expect(middle.textContent).toBe(line2);
            expect(topLevelTags(harness.content)).toEqual(['p', 'blockquote', 'p']);
            destroyHarness(harness);
          }),
          { numRuns: 50 }
        );
      });
    });

    describe('Bullet list formatting', () => {
      it('should only affect current block when no selection', () => {
        fc.assert(
          fc.property(lineArb, lineArb, lineArb, (line1, line2, line3) => {
            const { harness, middle } = applyToMiddleParagraph('toggleBulletList', [line1, line2, line3], 'cursor');

            // The list is created inside the block holding the cursor, and nowhere else.
            expect(harness.content.querySelectorAll('ul').length).toBe(1);
            expect(middle.querySelector('ul')).not.toBeNull();
            expect(harness.content.querySelectorAll('ol').length).toBe(0);
            destroyHarness(harness);
          }),
          { numRuns: 50 }
        );
      });

      it('should only affect selected content when text is selected', () => {
        fc.assert(
          fc.property(lineArb, lineArb, lineArb, (line1, line2, line3) => {
            const { harness, middle } = applyToMiddleParagraph('toggleBulletList', [line1, line2, line3], 'selection');

            const lists = harness.content.querySelectorAll('ul');
            expect(lists.length).toBe(1);
            expect(middle.contains(lists[0])).toBe(true);
            // Only the selected text became the list item.
            const items = lists[0].querySelectorAll('li');
            expect(items.length).toBe(1);
            expect(items[0].textContent).toBe(line2);
            destroyHarness(harness);
          }),
          { numRuns: 50 }
        );
      });
    });

    describe('Ordered list formatting', () => {
      it('should only affect current block when no selection', () => {
        fc.assert(
          fc.property(lineArb, lineArb, lineArb, (line1, line2, line3) => {
            const { harness, middle } = applyToMiddleParagraph('toggleOrderedList', [line1, line2, line3], 'cursor');

            expect(harness.content.querySelectorAll('ol').length).toBe(1);
            expect(middle.querySelector('ol')).not.toBeNull();
            expect(harness.content.querySelectorAll('ul').length).toBe(0);
            destroyHarness(harness);
          }),
          { numRuns: 50 }
        );
      });

      it('should only affect selected content when text is selected', () => {
        fc.assert(
          fc.property(lineArb, lineArb, lineArb, (line1, line2, line3) => {
            const { harness, middle } = applyToMiddleParagraph('toggleOrderedList', [line1, line2, line3], 'selection');

            const lists = harness.content.querySelectorAll('ol');
            expect(lists.length).toBe(1);
            expect(middle.contains(lists[0])).toBe(true);
            const items = lists[0].querySelectorAll('li');
            expect(items.length).toBe(1);
            expect(items[0].textContent).toBe(line2);
            destroyHarness(harness);
          }),
          { numRuns: 50 }
        );
      });
    });

    describe('Code block formatting', () => {
      it('should only affect current block when no selection', () => {
        fc.assert(
          fc.property(lineArb, lineArb, lineArb, (line1, line2, line3) => {
            const { harness, middle } = applyToMiddleParagraph('toggleCodeBlock', [line1, line2, line3], 'cursor');

            expect(middle.tagName.toLowerCase()).toBe('pre');
            expect(middle.textContent).toBe(line2);
            expect(harness.content.querySelectorAll('pre').length).toBe(1);
            destroyHarness(harness);
          }),
          { numRuns: 50 }
        );
      });

      it('should only affect selected content when text is selected', () => {
        fc.assert(
          fc.property(lineArb, lineArb, lineArb, (line1, line2, line3) => {
            const { harness, middle } = applyToMiddleParagraph('toggleCodeBlock', [line1, line2, line3], 'selection');

            expect(middle.tagName.toLowerCase()).toBe('pre');
            expect(middle.textContent).toBe(line2);
            expect(topLevelTags(harness.content)).toEqual(['p', 'pre', 'p']);
            destroyHarness(harness);
          }),
          { numRuns: 50 }
        );
      });
    });

    describe('Edge cases', () => {
      it('should handle content with non-whitespace text correctly', () => {
        const { harness, middle } = applyToMiddleParagraph(
          'toggleBlockquote',
          ['First line', 'Second line', 'Third line'],
          'cursor'
        );

        expect(topLevelTags(harness.content)).toEqual(['p', 'blockquote', 'p']);
        expect(middle.textContent).toBe('Second line');
      });

      it('should not affect other blocks when toggling off formatting', () => {
        fc.assert(
          fc.property(lineArb, lineArb, (line1, line2) => {
            const harness = createHarness([
              { tag: 'blockquote', text: line1 },
              { tag: 'p', text: line2 },
            ]);
            const quote = harness.content.querySelector('blockquote')!;
            const paragraph = harness.content.querySelector(':scope > p')!;

            // Cursor inside the blockquote's paragraph
            placeCursor(quote.querySelector('p')!, 0);

            // Toggle blockquote off
            harness.service.toggleBlockquote(harness.editor);

            // The blockquote is gone and its text is kept as plain content...
            expect(harness.content.querySelectorAll('blockquote').length).toBe(0);
            expect(harness.content.textContent).toBe(line1 + line2);

            // ...while the following paragraph is the same, untouched element.
            const paragraphs = harness.content.querySelectorAll(':scope > p');
            expect(paragraphs.length).toBe(1);
            expect(paragraphs[0]).toBe(paragraph);
            expect(paragraphs[0].textContent).toBe(line2);
            expect(harness.content.lastElementChild).toBe(paragraph);
            destroyHarness(harness);
          }),
          { numRuns: 50 }
        );
      });
    });
  });
});
