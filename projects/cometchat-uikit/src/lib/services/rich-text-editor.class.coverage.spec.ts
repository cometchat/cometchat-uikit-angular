/**
 * RichTextEditor — coverage for the paths the main spec leaves untouched.
 *
 * The existing `rich-text-editor.class.spec.ts` boots a real SDK session and
 * exercises the happy path through the public API. What it never reaches is the
 * wiring layer: the DOM event listeners the constructor attaches, the thin
 * delegates that forward into the `rich-text-editor.*` helper modules, the
 * debounced custom-formatter pipeline, and the timer bookkeeping in `destroy`.
 *
 * `RichTextEditor` is a plain class, so every test here constructs it directly
 * against a host element attached to the document — no TestBed, no SDK session.
 * Each test asserts the observable DOM/selection/callback effect rather than
 * merely that a delegate was entered, so a deleted guard or a dropped forward
 * call fails the test.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RichTextEditor } from './rich-text-editor.class';
import { RichTextEditorConfig } from './rich-text-editor.interfaces';
import { HistoryManager } from './history-manager.class';
import { CometChatTextFormatter } from '../formatters/cometchat-text-formatter';
import { CometChatMentionsFormatter } from '../formatters/cometchat-mentions-formatter';
import { CometChatLocalize } from '../resources/CometChatLocalize/cometchat-localize';

// ===================================================================
// Test doubles
// ===================================================================

/**
 * A real `CometChatTextFormatter` subclass. `setCustomFormatters` and
 * `applyCustomFormatters` both branch on concrete class identity and on
 * `getRegex()` / `format()`, so a duck-typed object would not do.
 */
class HashTagFormatter extends CometChatTextFormatter {
  readonly id: string;
  private readonly pattern: RegExp;

  constructor(id = 'hashtag-formatter', pattern = /#\w+/g) {
    super();
    this.id = id;
    this.pattern = pattern;
  }

  getRegex(): RegExp {
    return this.pattern;
  }

  format(text: string): string {
    return `<span class="cometchat-hashtag" style="color: rgb(1, 2, 3);" data-tag="${text.slice(
      1
    )}">${text}</span>`;
  }
}

/** A formatter whose `getRegex()` returns null — the skip arm of the pipeline. */
class NoRegexFormatter extends CometChatTextFormatter {
  readonly id = 'no-regex-formatter';
  getRegex(): RegExp {
    return null as unknown as RegExp;
  }
  format(text: string): string {
    return text;
  }
}

const MENTION_CHIP = 'cometchat-mention-chip';

describe('RichTextEditor — wiring, delegates and teardown', () => {
  const editors: RichTextEditor[] = [];
  const hosts: HTMLElement[] = [];

  /**
   * Build an editor over a host element that is attached to the document.
   * Attachment matters: `scheduleCustomFormatters` gates on
   * `contentEditable.isConnected`, and selection/focus assertions need a live tree.
   */
  function makeEditor(config: Partial<RichTextEditorConfig> = {}): RichTextEditor {
    const host = document.createElement('div');
    document.body.appendChild(host);
    hosts.push(host);
    const editor = new RichTextEditor({ editable: true, ...config }, host);
    editors.push(editor);
    return editor;
  }

  /**
   * jsdom does not treat a `contenteditable` div as a focusable area, so
   * `focus()` alone would leave `document.activeElement` on `<body>` and every
   * `activeElement` guard in the class would short-circuit. A tabindex makes the
   * node focusable in jsdom without changing the behaviour under test.
   */
  function makeFocusable(editor: RichTextEditor): HTMLDivElement {
    const ce = editor.getContentEditable();
    ce.setAttribute('tabindex', '0');
    return ce;
  }

  /** Replace the editor content without going through the sanitizer. */
  function setRawContent(editor: RichTextEditor, html: string): HTMLDivElement {
    const ce = editor.getContentEditable();
    ce.innerHTML = html;
    return ce;
  }

  function selection(): Selection {
    return window.getSelection()!;
  }

  function setCaret(node: Node, offset: number): Range {
    const range = document.createRange();
    range.setStart(node, offset);
    range.collapse(true);
    const sel = selection();
    sel.removeAllRanges();
    sel.addRange(range);
    return range;
  }

  function setSelectionRange(
    startNode: Node,
    startOffset: number,
    endNode: Node,
    endOffset: number
  ): Range {
    const range = document.createRange();
    range.setStart(startNode, startOffset);
    range.setEnd(endNode, endOffset);
    const sel = selection();
    sel.removeAllRanges();
    sel.addRange(range);
    return range;
  }

  /** A fixed DOMRect-shaped object; jsdom returns all-zero rects otherwise. */
  function rect(top: number, bottom: number, left = 0, right = 0): DOMRect {
    return {
      top,
      bottom,
      left,
      right,
      width: right - left,
      height: bottom - top,
      x: left,
      y: top,
      toJSON: () => ({}),
    } as DOMRect;
  }

  /**
   * jsdom does not implement `Range.prototype.getBoundingClientRect` at all, so
   * any code that measures a range throws. Install a resolver for the duration
   * of a test and return the undo function.
   */
  function stubRangeRects(resolve: (range: Range) => DOMRect): () => void {
    const proto = Range.prototype as unknown as Record<string, unknown>;
    const had = 'getBoundingClientRect' in proto;
    const original = proto['getBoundingClientRect'];
    proto['getBoundingClientRect'] = function (this: Range) {
      return resolve(this);
    };
    return () => {
      if (had) {
        proto['getBoundingClientRect'] = original;
      } else {
        delete proto['getBoundingClientRect'];
      }
    };
  }

  beforeEach(() => {
    selection().removeAllRanges();
  });

  afterEach(() => {
    // Timers first: a pending autofocus or custom-formatter callback from this
    // test must not fire against the next test's DOM.
    vi.useRealTimers();
    for (const editor of editors.splice(0)) {
      editor.destroy();
    }
    for (const host of hosts.splice(0)) {
      host.remove();
    }
    selection().removeAllRanges();
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  // =================================================================
  // Construction
  // =================================================================

  describe('construction without a host element', () => {
    it('builds its own host and hangs the editor and live region off it', () => {
      const editor = new RichTextEditor({ editable: true, placeholder: 'Say something' });
      editors.push(editor);
      const host = editor.getElement();

      expect(host.className).toBe('cometchat-rich-text-editor');
      expect(host.parentNode).toBeNull();
      expect(host.firstElementChild).toBe(editor.getContentEditable());
      expect(host.children.length).toBe(2);
      const live = host.lastElementChild as HTMLElement;
      expect(live.className).toBe('cometchat-rich-text-editor__aria-live');
      expect(live.getAttribute('aria-live')).toBe('polite');
      expect(live.getAttribute('role')).toBe('status');
      expect(editor.getContentEditable().getAttribute('data-placeholder')).toBe('Say something');
    });

    it('prefers a configured aria-label over the localized default', () => {
      vi.spyOn(CometChatLocalize, 'getLocalizedString').mockImplementation(
        (key: string) => `localized:${key}`
      );
      const labelled = new RichTextEditor({ editable: true, ariaLabel: 'Message input' });
      editors.push(labelled);
      const defaulted = new RichTextEditor({ editable: true });
      editors.push(defaulted);

      expect(labelled.getContentEditable().getAttribute('aria-label')).toBe('Message input');
      expect(defaulted.getContentEditable().getAttribute('aria-label')).toBe(
        'localized:accessibility_rich_text_editor'
      );
    });
  });

  // =================================================================
  // focus()
  // =================================================================

  describe('focus', () => {
    function focusFixture(): { editor: RichTextEditor; ce: HTMLDivElement } {
      const editor = makeEditor();
      const ce = makeFocusable(editor);
      setRawContent(editor, 'Hello');
      selection().removeAllRanges();
      return { editor, ce };
    }

    it('selects everything for the "all" position', () => {
      const { editor, ce } = focusFixture();

      editor.focus('all');

      expect(document.activeElement).toBe(ce);
      expect(selection().toString()).toBe('Hello');
    });

    it('parks the caret at a numeric character offset', () => {
      const { editor, ce } = focusFixture();

      editor.focus(2);

      const sel = selection();
      expect(sel.anchorNode).toBe(ce.firstChild);
      expect(sel.anchorOffset).toBe(2);
      expect(sel.isCollapsed).toBe(true);
    });

    it('parks the caret at the end for the "end" position', () => {
      const { editor, ce } = focusFixture();

      editor.focus('end');

      const sel = selection();
      expect(sel.anchorNode).toBe(ce);
      expect(sel.anchorOffset).toBe(ce.childNodes.length);
    });

    it('only takes focus when no position is given', () => {
      const { editor, ce } = focusFixture();
      const selectionManager = (editor as any).selectionManager;
      const setCursorPosition = vi.spyOn(selectionManager, 'setCursorPosition');
      const selectAll = vi.spyOn(selectionManager, 'selectAll');

      editor.focus();

      // jsdom installs a default selection on focus, so the absence of any
      // positioning call is what distinguishes this arm from the others.
      expect(document.activeElement).toBe(ce);
      expect(setCursorPosition).not.toHaveBeenCalled();
      expect(selectAll).not.toHaveBeenCalled();
    });

    it('gives focus up again on blur', () => {
      const { editor, ce } = focusFixture();
      editor.focus('end');

      editor.blur();

      expect(document.activeElement).not.toBe(ce);
    });
  });

  // =================================================================
  // Constructor: autofocus timer
  // =================================================================

  describe('autofocus', () => {
    it('focuses the editor and parks the caret at the end on the next tick', () => {
      vi.useFakeTimers();
      const editor = makeEditor({ autofocus: true, content: 'Hello' });
      const ce = makeFocusable(editor);

      // Nothing has happened yet — autofocus is deferred to a macrotask.
      expect(document.activeElement).not.toBe(ce);
      expect((editor as any).autofocusTimer).not.toBeNull();

      vi.advanceTimersByTime(0);

      expect(document.activeElement).toBe(ce);
      expect((editor as any).autofocusTimer).toBeNull();
      const sel = selection();
      expect(sel.anchorNode).toBe(ce);
      expect(sel.anchorOffset).toBe(ce.childNodes.length);
    });

    it('honours a positional autofocus value instead of always jumping to the end', () => {
      vi.useFakeTimers();
      const editor = makeEditor({ autofocus: 'start', content: 'Hello' });
      makeFocusable(editor);

      vi.advanceTimersByTime(0);

      const sel = selection();
      // 'start' resolves to character offset 0, which lands inside the first
      // text node rather than on the contenteditable host itself.
      expect(sel.anchorNode).toBe(editor.getContentEditable().firstChild);
      expect(sel.anchorOffset).toBe(0);
    });

    it('does not focus a destroyed editor when the deferred callback runs', () => {
      vi.useFakeTimers();
      const editor = makeEditor({ autofocus: true, content: 'Hello' });
      const ce = makeFocusable(editor);
      // `destroy()` clears the timer outright, so the only way the guard inside
      // the callback is observable is a destroyed flag raised from elsewhere.
      (editor as any).destroyed = true;

      vi.advanceTimersByTime(0);

      expect(document.activeElement).not.toBe(ce);
      expect(selection().rangeCount).toBe(0);
    });

    it('schedules no autofocus timer when the config omits autofocus', () => {
      vi.useFakeTimers();
      const editor = makeEditor({ content: 'Hello' });

      expect((editor as any).autofocusTimer).toBeNull();
      expect(vi.getTimerCount()).toBe(0);
      expect(document.activeElement).not.toBe(editor.getContentEditable());
    });
  });

  // =================================================================
  // Screen-reader announcements
  // =================================================================

  describe('announceToScreenReader', () => {
    it('schedules nothing when the live region is gone', () => {
      vi.useFakeTimers();
      const editor = makeEditor();
      (editor as any).ariaLiveRegion = null;

      (editor as any).announceToScreenReader('ignored');

      expect(vi.getTimerCount()).toBe(0);
    });

    it('writes the message into the live region after the clearing delay', () => {
      vi.useFakeTimers();
      const editor = makeEditor();
      const region: HTMLElement = (editor as any).ariaLiveRegion;
      region.textContent = 'stale';

      (editor as any).announceToScreenReader('saved');

      // Cleared immediately so assistive tech re-reads an identical message.
      expect(region.textContent).toBe('');
      vi.advanceTimersByTime(100);
      expect(region.textContent).toBe('saved');
    });

    it('does not write into a live region that was dropped before the delay elapsed', () => {
      vi.useFakeTimers();
      const editor = makeEditor();
      const region: HTMLElement = (editor as any).ariaLiveRegion;

      (editor as any).announceToScreenReader('saved');
      (editor as any).ariaLiveRegion = null;
      vi.advanceTimersByTime(100);

      expect(region.textContent).toBe('');
    });
  });

  // =================================================================
  // Event listener wiring
  // =================================================================

  describe('attached DOM listeners', () => {
    it('blocks a beforeinput that would type inside a mention chip', () => {
      const editor = makeEditor();
      const ce = setRawContent(
        editor,
        `<span class="${MENTION_CHIP}" data-uid="alice">@Alice</span>`
      );
      const chip = ce.querySelector(`.${MENTION_CHIP}`)!;
      setCaret(chip.firstChild!, 2);

      const event = new InputEvent('beforeinput', {
        bubbles: true,
        cancelable: true,
        inputType: 'insertText',
        data: 'x',
      });
      ce.dispatchEvent(event);

      expect(event.defaultPrevented).toBe(true);
    });

    it('lets a beforeinput through when the caret is outside any mention', () => {
      const editor = makeEditor();
      const ce = setRawContent(editor, 'plain text');
      setCaret(ce.firstChild!, 3);

      const event = new InputEvent('beforeinput', {
        bubbles: true,
        cancelable: true,
        inputType: 'insertText',
        data: 'x',
      });
      ce.dispatchEvent(event);

      expect(event.defaultPrevented).toBe(false);
    });

    it('blocks a beforeinput whose selection ends inside a mention chip', () => {
      const editor = makeEditor();
      const ce = setRawContent(
        editor,
        `pre<span class="${MENTION_CHIP}" data-uid="bob">@Bob</span>`
      );
      const chip = ce.querySelector(`.${MENTION_CHIP}`)!;
      setSelectionRange(ce.firstChild!, 1, chip.firstChild!, 2);

      const event = new InputEvent('beforeinput', {
        bubbles: true,
        cancelable: true,
        inputType: 'deleteContentBackward',
      });
      ce.dispatchEvent(event);

      expect(event.defaultPrevented).toBe(true);
    });

    it('recomputes the format state when the document selection changes', () => {
      const onSelectionUpdate = vi.fn();
      const editor = makeEditor({ onSelectionUpdate });
      const ce = makeFocusable(editor);
      setRawContent(editor, '<strong>bold</strong>');
      ce.focus();
      setCaret(ce.querySelector('strong')!.firstChild!, 2);
      onSelectionUpdate.mockClear();

      document.dispatchEvent(new Event('selectionchange'));

      expect(onSelectionUpdate).toHaveBeenCalledTimes(1);
      expect(onSelectionUpdate.mock.calls[0][0]).toMatchObject({ link: false, code: false });
    });

    it('inserts dropped HTML at the drop point and reports the update', () => {
      const onUpdate = vi.fn();
      const editor = makeEditor({ onUpdate });
      const ce = setRawContent(editor, 'tail');
      const dropRange = document.createRange();
      dropRange.setStart(ce.firstChild!, 0);
      dropRange.collapse(true);
      // jsdom has no caretRangeFromPoint; the handler bails without it.
      (document as any).caretRangeFromPoint = vi.fn(() => dropRange);

      const event = new Event('drop', { bubbles: true, cancelable: true });
      Object.defineProperty(event, 'dataTransfer', {
        value: { getData: (type: string) => (type === 'text/html' ? '<b>dropped</b>' : '') },
      });
      ce.dispatchEvent(event);
      delete (document as any).caretRangeFromPoint;

      expect(event.defaultPrevented).toBe(true);
      expect(ce.innerHTML).toBe('<b>dropped</b>tail');
      expect(onUpdate).toHaveBeenCalledTimes(1);
      expect(onUpdate.mock.calls[0][0]).toBe('<b>dropped</b>tail');
    });

    it('falls back to the plain-text flavour of a drop', () => {
      const onUpdate = vi.fn();
      const editor = makeEditor({ onUpdate });
      const ce = setRawContent(editor, 'tail');
      const dropRange = document.createRange();
      dropRange.setStart(ce.firstChild!, 0);
      dropRange.collapse(true);
      (document as any).caretRangeFromPoint = vi.fn(() => dropRange);

      const event = new Event('drop', { bubbles: true, cancelable: true });
      Object.defineProperty(event, 'dataTransfer', {
        value: { getData: (type: string) => (type === 'text/plain' ? 'pasted words' : '') },
      });
      ce.dispatchEvent(event);
      delete (document as any).caretRangeFromPoint;

      expect(ce.textContent).toBe('pasted wordstail');
      expect(onUpdate).toHaveBeenCalledTimes(1);
    });

    it('ignores a drop that carries no dataTransfer', () => {
      const onUpdate = vi.fn();
      const editor = makeEditor({ onUpdate });
      const ce = setRawContent(editor, 'tail');

      const event = new Event('drop', { bubbles: true, cancelable: true });
      ce.dispatchEvent(event);

      expect(event.defaultPrevented).toBe(true);
      expect(ce.innerHTML).toBe('tail');
      expect(onUpdate).not.toHaveBeenCalled();
    });
  });

  // =================================================================
  // Link clicks
  // =================================================================

  describe('handleClick', () => {
    function withLink(editor: RichTextEditor, html: string): HTMLAnchorElement {
      const ce = setRawContent(editor, html);
      return ce.querySelector('a')!;
    }

    it('reports the link, its text and the centre-top of its box', () => {
      const onLinkClick = vi.fn();
      const editor = makeEditor({ onLinkClick });
      const anchor = withLink(editor, '<a href="https://example.com/docs">Example</a>');
      // The handler deliberately uses the element's own rect rather than the
      // pointer coordinates, so the rect is what has to be stubbed.
      anchor.getBoundingClientRect = () => rect(40, 60, 10, 50);
      (editor as any)._pendingLinkClick = { url: 'stale', text: 'stale', x: 0, y: 0 };

      const event = new MouseEvent('click', { bubbles: true, cancelable: true });
      anchor.dispatchEvent(event);

      expect(event.defaultPrevented).toBe(true);
      expect((editor as any)._pendingLinkClick).toBeNull();
      expect(onLinkClick).toHaveBeenCalledWith('https://example.com/docs', 'Example', 30, 40);
    });

    it('reports an empty string for a link with no text', () => {
      const onLinkClick = vi.fn();
      const editor = makeEditor({ onLinkClick });
      const anchor = withLink(editor, '<a href="https://example.com/"></a>');
      anchor.getBoundingClientRect = () => rect(0, 0, 0, 0);

      anchor.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

      expect(onLinkClick).toHaveBeenCalledWith('https://example.com/', '', 0, 0);
    });

    it('resolves the link from a click on a node nested inside it', () => {
      const onLinkClick = vi.fn();
      const editor = makeEditor({ onLinkClick });
      const anchor = withLink(
        editor,
        '<a href="https://example.com/nested"><strong>deep</strong></a>'
      );
      anchor.getBoundingClientRect = () => rect(5, 25, 0, 20);

      anchor
        .querySelector('strong')!
        .dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

      expect(onLinkClick).toHaveBeenCalledWith('https://example.com/nested', 'deep', 10, 5);
    });

    it('does nothing when the click lands outside any link', () => {
      const onLinkClick = vi.fn();
      const editor = makeEditor({ onLinkClick });
      const ce = setRawContent(editor, '<p>no links here</p>');

      const event = new MouseEvent('click', { bubbles: true, cancelable: true });
      ce.querySelector('p')!.dispatchEvent(event);

      expect(onLinkClick).not.toHaveBeenCalled();
      expect(event.defaultPrevented).toBe(false);
    });

    it('ignores a link that lives outside the editor', () => {
      const onLinkClick = vi.fn();
      const editor = makeEditor({ onLinkClick });
      const outside = document.createElement('a');
      outside.href = 'https://elsewhere.test/';
      outside.textContent = 'Elsewhere';
      document.body.appendChild(outside);

      // Dispatching on a node outside the editor would never reach the
      // listener, so the handler is driven with that node as the event target.
      const preventDefault = vi.fn();
      (editor as any).handleClick({
        target: outside,
        preventDefault,
        stopPropagation: vi.fn(),
      });

      expect(onLinkClick).not.toHaveBeenCalled();
      expect(preventDefault).not.toHaveBeenCalled();
      outside.remove();
    });

    it('leaves a link click alone when no onLinkClick handler is configured', () => {
      const editor = makeEditor();
      // A fragment href: without a handler the click is not prevented, and a
      // cross-document href would make jsdom log an unimplemented navigation.
      const anchor = withLink(editor, '<a href="#unhandled">Example</a>');

      const event = new MouseEvent('click', { bubbles: true, cancelable: true });
      anchor.dispatchEvent(event);

      expect(event.defaultPrevented).toBe(false);
    });

    it('does not fire the link callback on mousedown — only on click', () => {
      const onLinkClick = vi.fn();
      const editor = makeEditor({ onLinkClick });
      const anchor = withLink(editor, '<a href="https://example.com/">Example</a>');

      const event = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
      anchor.dispatchEvent(event);

      expect(onLinkClick).not.toHaveBeenCalled();
      expect(event.defaultPrevented).toBe(false);
      expect((editor as any)._pendingLinkClick).toBeNull();
    });
  });

  // =================================================================
  // handleSelectionChange
  // =================================================================

  describe('handleSelectionChange', () => {
    it('does nothing while the editor does not hold focus', () => {
      const onSelectionUpdate = vi.fn();
      const editor = makeEditor({ onSelectionUpdate });
      const ce = setRawContent(editor, 'hello');
      setCaret(ce.firstChild!, 2);

      (editor as any).handleSelectionChange();

      expect(onSelectionUpdate).not.toHaveBeenCalled();
    });

    it('still refreshes the format state when there is no range at all', () => {
      const onSelectionUpdate = vi.fn();
      const editor = makeEditor({ onSelectionUpdate });
      const ce = makeFocusable(editor);
      setRawContent(editor, 'hello');
      ce.focus();
      selection().removeAllRanges();
      onSelectionUpdate.mockClear();

      (editor as any).handleSelectionChange();

      expect(onSelectionUpdate).toHaveBeenCalledTimes(1);
    });

    it('pushes a caret that landed inside a mention out to its boundary', () => {
      // The chip occupies 100..200; the caret sits at 110, i.e. in its left half.
      const restoreRects = stubRangeRects(range =>
        range.collapsed ? rect(0, 10, 110, 110) : rect(0, 10, 100, 200)
      );
      const onSelectionUpdate = vi.fn();
      const editor = makeEditor({ onSelectionUpdate });
      const ce = makeFocusable(editor);
      setRawContent(
        editor,
        `pre<span class="${MENTION_CHIP}" data-uid="alice">@Alice</span>post`
      );
      ce.focus();
      const chip = ce.querySelector(`.${MENTION_CHIP}`)!;
      setCaret(chip.firstChild!, 3);
      onSelectionUpdate.mockClear();

      (editor as any).handleSelectionChange();
      restoreRects();

      const sel = selection();
      expect(sel.anchorNode).toBe(ce);
      expect(sel.anchorOffset).toBe(Array.from(ce.childNodes).indexOf(chip));
      expect(sel.isCollapsed).toBe(true);
      expect(onSelectionUpdate).toHaveBeenCalledTimes(1);
    });

    it('leaves a collapsed caret in ordinary text where it is', () => {
      const onSelectionUpdate = vi.fn();
      const editor = makeEditor({ onSelectionUpdate });
      const ce = makeFocusable(editor);
      setRawContent(editor, 'plain words');
      ce.focus();
      const textNode = ce.firstChild!;
      setCaret(textNode, 4);
      onSelectionUpdate.mockClear();

      (editor as any).handleSelectionChange();

      const sel = selection();
      expect(sel.anchorNode).toBe(textNode);
      expect(sel.anchorOffset).toBe(4);
      expect(onSelectionUpdate).toHaveBeenCalledTimes(1);
    });

    it('grows a selection that only clips a mention to cover the whole chip', () => {
      const editor = makeEditor();
      const ce = makeFocusable(editor);
      setRawContent(
        editor,
        `pre<span class="${MENTION_CHIP}" data-uid="bob">@Bob</span>post`
      );
      ce.focus();
      const chip = ce.querySelector(`.${MENTION_CHIP}`)!;
      const chipIndex = Array.from(ce.childNodes).indexOf(chip);
      const range = setSelectionRange(chip.firstChild!, 2, ce.lastChild!, 2);

      (editor as any).handleSelectionChange();

      expect(range.startContainer).toBe(ce);
      expect(range.startOffset).toBe(chipIndex);
    });

    it('leaves a selection that contains no mention untouched', () => {
      const editor = makeEditor();
      const ce = makeFocusable(editor);
      setRawContent(editor, 'some plain words');
      ce.focus();
      const textNode = ce.firstChild!;
      const range = setSelectionRange(textNode, 2, textNode, 6);

      (editor as any).handleSelectionChange();

      expect(range.startContainer).toBe(textNode);
      expect(range.startOffset).toBe(2);
      expect(range.endOffset).toBe(6);
    });
  });

  // =================================================================
  // Mention helpers exposed on the class
  // =================================================================

  describe('mention helpers', () => {
    function mentionFixture(editor: RichTextEditor) {
      const ce = setRawContent(
        editor,
        `pre<span class="${MENTION_CHIP}" data-uid="carol">@Carol</span>post`
      );
      return {
        ce,
        chip: ce.querySelector(`.${MENTION_CHIP}`) as HTMLElement,
        pre: ce.firstChild as Text,
        post: ce.lastChild as Text,
      };
    }

    it('recognises a mention chip and rejects everything else', () => {
      const editor = makeEditor();
      const { chip, pre } = mentionFixture(editor);

      expect((editor as any).isMentionNode(chip)).toBe(true);
      expect((editor as any).isMentionNode(pre)).toBe(false);
      expect((editor as any).isMentionNode(chip.firstChild)).toBe(false);
    });

    it('walks up from a descendant to the enclosing chip', () => {
      const editor = makeEditor();
      const { chip, pre } = mentionFixture(editor);

      expect((editor as any).findMentionAncestor(chip.firstChild)).toBe(chip);
      expect((editor as any).findMentionAncestor(chip)).toBe(chip);
      expect((editor as any).findMentionAncestor(pre)).toBeNull();
    });

    it('moves a caret in the right half of a chip to just after it', () => {
      const restoreRects = stubRangeRects(range =>
        range.collapsed ? rect(0, 10, 190, 190) : rect(0, 10, 100, 200)
      );
      const editor = makeEditor();
      const { ce, chip } = mentionFixture(editor);
      const range = setCaret(chip.firstChild!, 3);

      (editor as any).moveCursorToMentionBoundary(chip, range);
      restoreRects();

      expect(range.startContainer).toBe(ce);
      expect(range.startOffset).toBe(Array.from(ce.childNodes).indexOf(chip) + 1);
      expect(range.collapsed).toBe(true);
    });

    it('collects only the chips a range actually spans', () => {
      const editor = makeEditor();
      const { chip, pre, post } = mentionFixture(editor);
      const spanning = document.createRange();
      spanning.setStart(pre, 1);
      spanning.setEnd(post, 2);

      expect((editor as any).getMentionsInRange(spanning)).toEqual([chip]);

      const afterChip = document.createRange();
      afterChip.setStart(post, 1);
      afterChip.setEnd(post, 3);

      expect((editor as any).getMentionsInRange(afterChip)).toEqual([]);

      // The intersection primitive the collection is built on must agree with it.
      expect((editor as any).doesRangeIntersectNode(spanning, chip)).toBe(true);
      expect((editor as any).doesRangeIntersectNode(afterChip, chip)).toBe(false);
    });

    it('extends a range forwards over a chip whose end was clipped', () => {
      const editor = makeEditor();
      const { ce, chip, pre } = mentionFixture(editor);
      const range = document.createRange();
      range.setStart(pre, 1);
      range.setEnd(chip.firstChild!, 2);

      (editor as any).extendSelectionToIncludeMentions(range, [chip]);

      expect(range.endContainer).toBe(ce);
      expect(range.endOffset).toBe(Array.from(ce.childNodes).indexOf(chip) + 1);
    });

    it('deletes the chip and its trailing space on backspace', () => {
      const onUpdate = vi.fn();
      const editor = makeEditor({ onUpdate });
      const ce = setRawContent(
        editor,
        `<span class="${MENTION_CHIP}" data-uid="dave">@Dave</span> `
      );
      const trailing = ce.lastChild as Text;
      setCaret(trailing, 1);
      const event = new KeyboardEvent('keydown', { key: 'Backspace', cancelable: true });

      const handled = (editor as any).handleMentionDeletion(event);

      expect(handled).toBe(true);
      expect(event.defaultPrevented).toBe(true);
      expect(ce.querySelector(`.${MENTION_CHIP}`)).toBeNull();
      expect(ce.textContent).toBe('');
      expect(onUpdate).toHaveBeenCalledTimes(1);
    });

    it('leaves ordinary backspaces to the browser', () => {
      const onUpdate = vi.fn();
      const editor = makeEditor({ onUpdate });
      const ce = setRawContent(editor, 'word');
      setCaret(ce.firstChild!, 3);
      const event = new KeyboardEvent('keydown', { key: 'Backspace', cancelable: true });

      const handled = (editor as any).handleMentionDeletion(event);

      expect(handled).toBe(false);
      expect(event.defaultPrevented).toBe(false);
      expect(ce.textContent).toBe('word');
      expect(onUpdate).not.toHaveBeenCalled();
    });

    it('flattens chips to their visible label text', () => {
      const editor = makeEditor();
      const container = document.createElement('div');
      container.innerHTML =
        `hi <span class="${MENTION_CHIP}" data-uid="erin">@Erin</span> and ` +
        `<span class="${MENTION_CHIP}" data-uid="finn">@Finn</span>`;

      (editor as any).convertMentionsToPlainText(container);

      expect(container.querySelectorAll('[data-uid]').length).toBe(0);
      expect(container.innerHTML).toBe('hi @Erin and @Finn');
    });

    it('unwraps inline formatting from around and inside a mention chip', () => {
      const editor = makeEditor();
      setRawContent(
        editor,
        `<strong><span class="${MENTION_CHIP}" data-uid="gail">` +
          `<em>@Gail</em></span></strong>tail`
      );
      const ce = editor.getContentEditable();
      const chip = ce.querySelector(`.${MENTION_CHIP}`)!;

      (editor as any).protectMentionsFromFormatting();

      // The chip must survive with its uid — that is what the SDK sends — while
      // the <strong> around it and the <em> inside it are stripped.
      expect(ce.querySelector(`.${MENTION_CHIP}`)).toBe(chip);
      expect(chip.getAttribute('data-uid')).toBe('gail');
      expect(chip.innerHTML).toBe('@Gail');
      expect(ce.querySelector('strong')).toBeNull();
      expect(ce.querySelector('em')).toBeNull();
      expect(ce.textContent).toBe('@Gailtail');
    });

    it('escapes user markup while leaving SDK mention tokens intact', () => {
      const editor = makeEditor();

      const escaped = (editor as any).escapeUserHtmlForEditor(
        `<img src=x onerror="go()"> & 'quoted' <@uid:harry> <@all:everyone>`
      );

      expect(escaped).toBe(
        `&lt;img src=x onerror=&quot;go()&quot;&gt; &amp; &#39;quoted&#39; <@uid:harry> <@all:everyone>`
      );
    });

    it('returns a falsy input unchanged rather than escaping it', () => {
      const editor = makeEditor();

      expect((editor as any).escapeUserHtmlForEditor('')).toBe('');
    });
  });

  // =================================================================
  // Mention insertion and extraction
  // =================================================================

  describe('mention insertion', () => {
    it('replaces the typed query with a chip and a trailing space', () => {
      const onUpdate = vi.fn();
      const editor = makeEditor({ onUpdate });
      const ce = setRawContent(editor, 'hi @bo');
      setCaret(ce.firstChild!, 6);

      editor.insertMention('bob', 'Bob', 3);

      const chip = ce.querySelector('span[data-uid="bob"]')!;
      expect(chip.textContent).toBe('@Bob');
      expect(chip.getAttribute('data-mention-type')).toBe('other');
      expect(chip.className).toBe('cometchat-mentions cometchat-mentions-other');
      expect(chip.getAttribute('contenteditable')).toBe('false');
      expect(ce.textContent).toBe('hi @Bob ');
      expect(onUpdate).toHaveBeenCalledTimes(1);
    });

    it('marks a self mention apart from a mention of someone else', () => {
      const editor = makeEditor();
      const ce = setRawContent(editor, 'x');
      setCaret(ce.firstChild!, 1);

      editor.insertMention('me', 'Me', 0, true);

      const chip = ce.querySelector('span[data-uid="me"]')!;
      expect(chip.getAttribute('data-mention-type')).toBe('self');
      expect(chip.className).toBe('cometchat-mentions cometchat-mentions-you');
    });

    it('treats an "all" mention as a channel mention', () => {
      const editor = makeEditor();
      const ce = setRawContent(editor, 'x');
      setCaret(ce.firstChild!, 1);

      editor.insertMention('all', 'all', 0);

      const chip = ce.querySelector('span[data-uid="all"]')!;
      expect(chip.getAttribute('data-mention-type')).toBe('channel');
      expect(chip.className).toBe('cometchat-mentions cometchat-mentions-you');
    });

    it('refuses a mention with a blank id or a blank label', () => {
      const onUpdate = vi.fn();
      const editor = makeEditor({ onUpdate });
      const ce = setRawContent(editor, 'x');
      setCaret(ce.firstChild!, 1);

      editor.insertMention('   ', 'Bob', 0);
      editor.insertMention('bob', '   ', 0);

      expect(ce.querySelectorAll('span[data-uid]').length).toBe(0);
      expect(onUpdate).not.toHaveBeenCalled();
    });

    it('stops at ten distinct mentions but still allows a repeat of an existing one', () => {
      const onUpdate = vi.fn();
      const editor = makeEditor({ onUpdate });
      const existing = Array.from(
        { length: 10 },
        (_, i) => `<span data-uid="u${i}" data-mention-type="other">@U${i}</span>`
      ).join('');
      const ce = setRawContent(editor, `${existing}tail`);
      setCaret(ce.lastChild!, 4);

      editor.insertMention('u10', 'U10', 0);

      expect(ce.querySelector('span[data-uid="u10"]')).toBeNull();
      expect(onUpdate).not.toHaveBeenCalled();

      editor.insertMention('u3', 'U3 again', 0);

      expect(ce.querySelectorAll('span[data-uid="u3"]').length).toBe(2);
      expect(onUpdate).toHaveBeenCalledTimes(1);
    });

    it('collects unique uids and leaves the channel mention out', () => {
      const editor = makeEditor();
      setRawContent(
        editor,
        '<span data-uid="bob">@Bob</span><span data-uid="bob">@Bob</span>' +
          '<span data-uid="cara">@Cara</span><span data-uid="all">@all</span>'
      );

      expect([...editor.getUniqueMentionUids()].sort()).toEqual(['bob', 'cara']);
    });

    it('renders chips back into the SDK token form', () => {
      const editor = makeEditor();
      setRawContent(
        editor,
        'hi <span data-uid="bob" data-mention-type="other">@Bob</span> and ' +
          '<span data-uid="all" data-mention-type="channel">@all</span>'
      );

      expect(editor.getTextWithMentionFormat()).toBe('hi <@uid:bob> and <@all:all>');
    });

    it('keeps the visible text of a chip that carries no uid', () => {
      const editor = makeEditor();
      setRawContent(editor, 'hi <span data-uid="">@Ghost</span>');

      expect(editor.getTextWithMentionFormat()).toBe('hi @Ghost');
    });

    it('creates a default mentions formatter when none is supplied', () => {
      const editor = makeEditor();

      expect((editor as any).mentionsFormatter).toBeNull();

      editor.initializeMentionsFormatter();

      expect((editor as any).mentionsFormatter).toBeInstanceOf(CometChatMentionsFormatter);
    });

    it('keeps a mentions formatter that was supplied by the host', () => {
      const editor = makeEditor();
      const supplied = new CometChatMentionsFormatter();

      editor.initializeMentionsFormatter(supplied);

      expect((editor as any).mentionsFormatter).toBe(supplied);
    });

    it('renders markdown into the editor and lazily builds the mentions formatter', () => {
      const editor = makeEditor();

      editor.setContentWithMentions('**bold** and <@uid:bob>', []);

      expect(editor.getHTML()).toContain('<strong>bold</strong>');
      expect((editor as any).mentionsFormatter).toBeInstanceOf(CometChatMentionsFormatter);
    });
  });

  // =================================================================
  // Block structure exits
  // =================================================================

  describe('block exits', () => {
    it('signals a blockquote exit after two trailing breaks', () => {
      const editor = makeEditor();
      const ce = setRawContent(editor, '<blockquote>quoted<br><br></blockquote>');
      const quote = ce.querySelector('blockquote')!;
      setCaret(quote, quote.childNodes.length);

      expect((editor as any).isInBlockquote()).toBe(true);
      expect((editor as any).shouldExitBlockquote()).toBe(true);
    });

    it('does not signal a blockquote exit from ordinary text', () => {
      const editor = makeEditor();
      const ce = setRawContent(editor, 'just text');
      setCaret(ce.firstChild!, 4);

      expect((editor as any).isInBlockquote()).toBe(false);
      expect((editor as any).shouldExitBlockquote()).toBe(false);
    });

    it('inserts a break after the blockquote and parks the caret there', () => {
      const editor = makeEditor();
      const ce = setRawContent(editor, '<blockquote>quoted</blockquote>');
      const quote = ce.querySelector('blockquote')!;
      setCaret(quote.firstChild!, 3);

      (editor as any).exitBlockquote();

      expect(ce.lastChild).toBeInstanceOf(HTMLBRElement);
      expect(quote.nextSibling).toBe(ce.lastChild);
      const sel = selection();
      expect(sel.anchorNode).toBe(ce);
      expect(sel.anchorOffset).toBe(Array.from(ce.childNodes).indexOf(ce.lastChild as ChildNode));
    });

    it('does not touch the DOM when asked to exit a blockquote from outside one', () => {
      const editor = makeEditor();
      const ce = setRawContent(editor, '<p>free text</p>');
      setCaret(ce.querySelector('p')!.firstChild!, 2);

      (editor as any).exitBlockquote();

      expect(ce.innerHTML).toBe('<p>free text</p>');
    });

    it('signals a code-block exit after two trailing newlines', () => {
      const editor = makeEditor();
      const ce = setRawContent(editor, '<pre>const a = 1;\n\n</pre>');
      const pre = ce.querySelector('pre')!;
      setCaret(pre.firstChild!, 5);

      expect((editor as any).isInCodeBlock()).toBe(true);
      expect((editor as any).shouldExitCodeBlock()).toBe(true);
    });

    it('does not signal a code-block exit from a still-growing block', () => {
      const editor = makeEditor();
      const ce = setRawContent(editor, '<pre>const a = 1;</pre>');
      const pre = ce.querySelector('pre')!;
      setCaret(pre.firstChild!, 5);

      expect((editor as any).shouldExitCodeBlock()).toBe(false);
    });

    it('inserts a break after the code block and parks the caret there', () => {
      const editor = makeEditor();
      const ce = setRawContent(editor, '<pre>code</pre>');
      const pre = ce.querySelector('pre')!;
      setCaret(pre.firstChild!, 2);

      (editor as any).exitCodeBlock();

      expect(ce.lastChild).toBeInstanceOf(HTMLBRElement);
      expect(pre.nextSibling).toBe(ce.lastChild);
      expect(selection().anchorNode).toBe(ce);
    });

    it('does not touch the DOM when asked to exit a code block from outside one', () => {
      const editor = makeEditor();
      const ce = setRawContent(editor, '<p>free text</p>');
      setCaret(ce.querySelector('p')!.firstChild!, 2);

      (editor as any).exitCodeBlock();

      expect(ce.innerHTML).toBe('<p>free text</p>');
    });

    it('signals a list exit from an empty list item', () => {
      const editor = makeEditor();
      const ce = setRawContent(editor, '<ul><li>first</li><li><br></li></ul>');
      const emptyItem = ce.querySelectorAll('li')[1];
      setCaret(emptyItem, 0);

      expect((editor as any).getCurrentListItem()).toBe(emptyItem);
      expect((editor as any).shouldExitList()).toBe(true);
    });

    it('does not signal a list exit from an item that still has text', () => {
      const editor = makeEditor();
      const ce = setRawContent(editor, '<ul><li>first</li></ul>');
      const item = ce.querySelector('li')!;
      setCaret(item.firstChild!, 2);

      expect((editor as any).shouldExitList()).toBe(false);
    });

    it('reports list membership through isInList', () => {
      const editor = makeEditor();
      const ce = setRawContent(editor, '<ul><li>bullet</li></ul>outside');
      setCaret(ce.querySelector('li')!.firstChild!, 3);

      expect(editor.isInList()).toBe(true);

      setCaret(ce.lastChild!, 3);

      expect(editor.isInList()).toBe(false);
    });
  });

  // =================================================================
  // Markdown shortcuts
  // =================================================================

  describe('markdown formatting', () => {
    it('replaces the matched markers with the formatted element and a caret escape', () => {
      const onSelectionUpdate = vi.fn();
      const editor = makeEditor({ onSelectionUpdate });
      const ce = setRawContent(editor, '**bold**');
      const textNode = ce.firstChild as Text;
      const range = setCaret(textNode, textNode.data.length);
      const match = '**bold**'.match(/\*\*([^*]+)\*\*/)!;

      (editor as any).applyMarkdownFormat(textNode, range, match, 'bold', 2);

      const strong = ce.querySelector('strong');
      expect(strong).not.toBeNull();
      expect(strong!.textContent).toBe('bold');
      expect(ce.textContent).toBe('bold​');
      // A zero-width space is left after the element so the next keystroke
      // lands outside the new formatting instead of inheriting it.
      expect((editor as any).justAppliedFormatting).toBe(true);
      expect(onSelectionUpdate).toHaveBeenCalled();
    });

    it('builds the right element for each supported marker', () => {
      const editor = makeEditor();
      const cases: Array<[string, 'italic' | 'underline' | 'strikethrough' | 'code', string]> = [
        ['_it_', 'italic', 'EM'],
        ['__un__', 'underline', 'U'],
        ['~~st~~', 'strikethrough', 'S'],
        ['`cd`', 'code', 'CODE'],
      ];

      for (const [source, format, tag] of cases) {
        const ce = setRawContent(editor, source);
        const textNode = ce.firstChild as Text;
        const range = setCaret(textNode, textNode.data.length);
        const inner = source.replace(/^[_~`]+|[_~`]+$/g, '');
        const match = [source, inner] as unknown as RegExpMatchArray;

        (editor as any).applyMarkdownFormat(textNode, range, match, format, 1);

        expect(ce.firstElementChild!.tagName).toBe(tag);
        expect(ce.firstElementChild!.textContent).toBe(inner);
      }
    });

    it('converts markdown to HTML through the shared markdown helper', () => {
      const editor = makeEditor();

      expect((editor as any).markdownToHtml('**bold** and *slanted*')).toBe(
        '<p><strong>bold</strong> and <em>slanted</em></p>'
      );
    });

    it('turns editor markup back into markdown', () => {
      const editor = makeEditor();
      const source = document.createElement('div');
      source.innerHTML = '<strong>bold</strong> and <em>slanted</em>';

      expect((editor as any).htmlToMarkdown(source)).toBe('**bold** and _slanted_');
    });

    it('converts inline markdown with its own private rules', () => {
      const editor = makeEditor();

      const html = (editor as any).convertInlineMarkdown(
        '**b** *s* __u__ _i_ ~~x~~ `c` [label](https://example.com/)'
      );

      // Note: this private copy maps a single `*` to <strong>, unlike the
      // shared markdown helper which maps it to <em>.
      expect(html).toBe(
        '<strong>b</strong> <strong>s</strong> <u>u</u> <em>i</em> <s>x</s> <code>c</code> ' +
          '<a href="https://example.com/" class="cometchat-rich-text__link" ' +
          'target="_blank" rel="noopener noreferrer">label</a>'
      );
    });

    it('detects and converts a markdown run typed into the editor', () => {
      const editor = makeEditor();
      const ce = makeFocusable(editor);
      setRawContent(editor, '**bold**');
      ce.focus();
      const textNode = ce.firstChild as Text;
      setCaret(textNode, textNode.data.length);

      expect((editor as any).detectAndConvertMarkdown()).toBe(true);
      expect(ce.querySelector('strong')!.textContent).toBe('bold');
    });

    it('reports no conversion when nothing markdown-ish precedes the caret', () => {
      const editor = makeEditor();
      const ce = makeFocusable(editor);
      setRawContent(editor, 'plain words');
      ce.focus();
      setCaret(ce.firstChild!, 5);

      expect((editor as any).detectAndConvertMarkdown()).toBe(false);
      expect(ce.innerHTML).toBe('plain words');
    });

    it('converts a typed list marker into a real list', () => {
      const editor = makeEditor();
      const ce = makeFocusable(editor);
      setRawContent(editor, '- ');
      ce.focus();
      const textNode = ce.firstChild as Text;
      setCaret(textNode, textNode.data.length);

      const converted = (editor as any).detectAndConvertAutoList();

      expect(converted).toBe(true);
      expect(ce.querySelector('ul li')).not.toBeNull();
    });

    it('reports no auto-list when the text is not a list marker', () => {
      const editor = makeEditor();
      const ce = makeFocusable(editor);
      setRawContent(editor, 'hello ');
      ce.focus();
      setCaret(ce.firstChild!, 6);

      expect((editor as any).detectAndConvertAutoList()).toBe(false);
      expect(ce.querySelector('ul')).toBeNull();
    });
  });

  // =================================================================
  // Zero-width-space cleanup and scroll follow
  // =================================================================

  describe('zero-width space cleanup', () => {
    it('strips zero-width spaces from inline code once it holds real characters', () => {
      const editor = makeEditor();
      const ce = setRawContent(editor, '<code>a​bc</code>');
      const codeText = ce.querySelector('code')!.firstChild as Text;
      setCaret(codeText, 4);

      (editor as any).cleanupZeroWidthSpaces();

      expect(codeText.data).toBe('abc');
      const sel = selection();
      expect(sel.anchorNode).toBe(codeText);
      // The handler recomputes the offset as 3 before rewriting the node, but
      // assigning `node.data` replaces the whole run, and the DOM spec collapses
      // any live range boundary inside a replaced run to the run's start. The
      // caret therefore ends up at 0, not at the character it was on.
      expect(sel.anchorOffset).toBe(0);
    });

    it('keeps the marker while inline code still has a single character', () => {
      const editor = makeEditor();
      const ce = setRawContent(editor, '<code>​a</code>');
      const codeText = ce.querySelector('code')!.firstChild as Text;
      setCaret(codeText, 2);

      (editor as any).cleanupZeroWidthSpaces();

      expect(codeText.data).toBe('​a');
    });

    it('leaves content without inline code alone', () => {
      const editor = makeEditor();
      const ce = setRawContent(editor, 'plain​text');

      (editor as any).cleanupZeroWidthSpaces();

      expect(ce.textContent).toBe('plain​text');
    });
  });

  describe('scrollCursorIntoView', () => {
    let originalRaf: typeof globalThis.requestAnimationFrame;
    let restoreRects: () => void;

    beforeEach(() => {
      originalRaf = globalThis.requestAnimationFrame;
      // Run the frame callback synchronously; jsdom's rAF is asynchronous and
      // the code under test does all its work inside it.
      (globalThis as any).requestAnimationFrame = (cb: FrameRequestCallback) => {
        cb(0);
        return 1;
      };
      // A zero-height caret rect is what a collapsed range reports in a real
      // browser too, which is why the handler falls back to the focus node's box.
      restoreRects = stubRangeRects(() => rect(0, 0));
    });

    afterEach(() => {
      restoreRects();
      (globalThis as any).requestAnimationFrame = originalRaf;
    });

    /** A scrollable host; jsdom reports 0 for every layout metric otherwise. */
    function makeScrollableEditor(): { editor: RichTextEditor; host: HTMLElement } {
      const editor = makeEditor();
      const host = editor.getElement();
      host.style.overflowY = 'auto';
      Object.defineProperty(host, 'scrollHeight', { value: 400, configurable: true });
      Object.defineProperty(host, 'clientHeight', { value: 100, configurable: true });
      Object.defineProperty(host, 'scrollTop', { value: 0, writable: true, configurable: true });
      host.getBoundingClientRect = () => rect(0, 100);
      return { editor, host };
    }

    it('scrolls a caret that sits below the visible area back into view', () => {
      const { editor, host } = makeScrollableEditor();
      const ce = setRawContent(editor, '<p>line</p>');
      const para = ce.querySelector('p')!;
      para.getBoundingClientRect = () => rect(150, 170);
      setCaret(para.firstChild!, 2);

      (editor as any).scrollCursorIntoView();

      // 170 (caret bottom) - 100 (container bottom) + 4 (padding)
      expect(host.scrollTop).toBe(74);
    });

    it('scrolls a caret that sits above the visible area back into view', () => {
      const { editor, host } = makeScrollableEditor();
      (host as any).scrollTop = 200;
      const ce = setRawContent(editor, '<p>line</p>');
      const para = ce.querySelector('p')!;
      para.getBoundingClientRect = () => rect(-40, -20);
      setCaret(para.firstChild!, 2);

      (editor as any).scrollCursorIntoView();

      // 200 - (0 - (-40) + 4)
      expect(host.scrollTop).toBe(156);
    });

    it('uses the caret rect directly when the range reports a real box', () => {
      restoreRects();
      restoreRects = stubRangeRects(() => rect(150, 170));
      const { editor, host } = makeScrollableEditor();
      const ce = setRawContent(editor, '<p>line</p>');
      const para = ce.querySelector('p')!;
      // The focus node's own box is deliberately elsewhere: had the handler
      // fallen back to it, no scroll would have been needed at all.
      para.getBoundingClientRect = () => rect(0, 10);
      setCaret(para.firstChild!, 2);

      (editor as any).scrollCursorIntoView();

      expect(host.scrollTop).toBe(74);
    });

    it('does not scroll while the caret is inside inline code', () => {
      const { editor, host } = makeScrollableEditor();
      const ce = setRawContent(editor, '<code>snippet</code>');
      const code = ce.querySelector('code')!;
      code.getBoundingClientRect = () => rect(150, 170);
      setCaret(code.firstChild!, 2);

      (editor as any).scrollCursorIntoView();

      expect(host.scrollTop).toBe(0);
    });

    it('does not scroll a container that is not overflowing', () => {
      const { editor, host } = makeScrollableEditor();
      Object.defineProperty(host, 'scrollHeight', { value: 100, configurable: true });
      const ce = setRawContent(editor, '<p>line</p>');
      const para = ce.querySelector('p')!;
      // Deliberately below the fold: with content this short there is nowhere
      // to scroll to, so the caret being out of view must not move anything.
      para.getBoundingClientRect = () => rect(150, 170);
      setCaret(para.firstChild!, 2);

      (editor as any).scrollCursorIntoView();

      expect(host.scrollTop).toBe(0);
    });

    it('does nothing once the editor has been destroyed', () => {
      const { editor, host } = makeScrollableEditor();
      const ce = setRawContent(editor, '<p>line</p>');
      const para = ce.querySelector('p')!;
      para.getBoundingClientRect = () => rect(150, 170);
      setCaret(para.firstChild!, 2);
      editor.destroy();

      (editor as any).scrollCursorIntoView();

      expect(host.scrollTop).toBe(0);
    });
  });

  // =================================================================
  // Character offsets
  // =================================================================

  describe('character offsets', () => {
    it('counts the characters before the caret across element boundaries', () => {
      const editor = makeEditor();
      const ce = setRawContent(editor, 'ab<strong>cd</strong>ef');
      setCaret(ce.querySelector('strong')!.firstChild!, 1);

      expect((editor as any).getCharacterOffset()).toBe(3);
    });

    it('reports zero when there is no selection to measure', () => {
      const editor = makeEditor();
      setRawContent(editor, 'abcdef');
      selection().removeAllRanges();

      expect((editor as any).getCharacterOffset()).toBe(0);
    });

    it('puts the caret back at a character offset inside the right text node', () => {
      const editor = makeEditor();
      const ce = setRawContent(editor, 'ab<strong>cd</strong>ef');
      setCaret(ce.firstChild!, 0);

      (editor as any).restoreCharacterOffset(3);

      const sel = selection();
      expect(sel.anchorNode).toBe(ce.querySelector('strong')!.firstChild);
      expect(sel.anchorOffset).toBe(1);
      expect((editor as any).getCharacterOffset()).toBe(3);
    });

    it('falls back to the end of the content when the offset overshoots', () => {
      const editor = makeEditor();
      const ce = setRawContent(editor, 'abc');
      setCaret(ce.firstChild!, 0);

      (editor as any).restoreCharacterOffset(99);

      const sel = selection();
      expect(sel.anchorNode).toBe(ce);
      expect(sel.anchorOffset).toBe(ce.childNodes.length);
    });
  });

  // =================================================================
  // History
  // =================================================================

  describe('undo and redo', () => {
    /** Seed two history steps far enough apart that they are not grouped. */
    function seedHistory(editor: RichTextEditor): void {
      const history = (editor as any).historyManager as HistoryManager;
      history.push({ html: '<p>first</p>', cursorPosition: 5, timestamp: 1_000 });
      history.push({ html: '<p>second</p>', cursorPosition: 6, timestamp: 9_000 });
      editor.setHTML('<p>second</p>');
    }

    it('restores the previous snapshot, re-emits it and announces the undo', () => {
      vi.spyOn(CometChatLocalize, 'getLocalizedString').mockImplementation(
        (key: string) => `localized:${key}`
      );
      vi.useFakeTimers();
      const onUpdate = vi.fn();
      const onSelectionUpdate = vi.fn();
      const editor = makeEditor({ onUpdate, onSelectionUpdate });
      seedHistory(editor);
      onUpdate.mockClear();
      onSelectionUpdate.mockClear();

      expect(editor.undo()).toBe(true);

      expect(editor.getHTML()).toBe('<p>first</p>');
      expect(onUpdate).toHaveBeenCalledTimes(1);
      expect(onUpdate.mock.calls[0][0]).toBe('<p>first</p>');
      expect(onUpdate.mock.calls[0][1]).toContain('first');
      expect(onSelectionUpdate).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(100);
      expect((editor as any).ariaLiveRegion.textContent).toBe('localized:accessibility_undo');
    });

    it('re-applies the undone snapshot and announces the redo', () => {
      vi.spyOn(CometChatLocalize, 'getLocalizedString').mockImplementation(
        (key: string) => `localized:${key}`
      );
      vi.useFakeTimers();
      const onUpdate = vi.fn();
      const editor = makeEditor({ onUpdate });
      seedHistory(editor);
      editor.undo();
      onUpdate.mockClear();

      expect(editor.redo()).toBe(true);

      expect(editor.getHTML()).toBe('<p>second</p>');
      expect(onUpdate).toHaveBeenCalledTimes(1);
      expect(onUpdate.mock.calls[0][0]).toBe('<p>second</p>');

      vi.advanceTimersByTime(100);
      expect((editor as any).ariaLiveRegion.textContent).toBe('localized:accessibility_redo');
    });

    it('reports no undo and leaves the content alone when history is empty', () => {
      const onUpdate = vi.fn();
      const editor = makeEditor({ onUpdate });
      editor.setHTML('<p>only</p>');
      onUpdate.mockClear();

      expect(editor.undo()).toBe(false);
      expect(editor.getHTML()).toBe('<p>only</p>');
      expect(onUpdate).not.toHaveBeenCalled();
    });

    it('reports no redo while nothing has been undone', () => {
      const onUpdate = vi.fn();
      const editor = makeEditor({ onUpdate });
      seedHistory(editor);
      onUpdate.mockClear();

      expect(editor.redo()).toBe(false);
      expect(editor.getHTML()).toBe('<p>second</p>');
      expect(onUpdate).not.toHaveBeenCalled();
    });

    it('tracks undo and redo availability alongside the stacks', () => {
      const editor = makeEditor();

      expect(editor.canUndo()).toBe(false);
      expect(editor.canRedo()).toBe(false);

      seedHistory(editor);

      expect(editor.canUndo()).toBe(true);
      expect(editor.canRedo()).toBe(false);

      editor.undo();

      expect(editor.canRedo()).toBe(true);
    });
  });

  // =================================================================
  // Custom formatters
  // =================================================================

  describe('custom formatters', () => {
    it('drops mention, url and tiptap formatters and keeps the rest', () => {
      const editor = makeEditor();
      const keeper = new HashTagFormatter('hashtag-formatter');
      const url = new HashTagFormatter('url-formatter');
      const tiptap = new HashTagFormatter('tiptap-formatter');
      const mentions = new CometChatMentionsFormatter();

      editor.setCustomFormatters([keeper, url, tiptap, mentions]);

      expect((editor as any).customFormatters).toEqual([keeper]);
    });

    it('wraps every match in a span that carries the formatter output', () => {
      const editor = makeEditor();
      setRawContent(editor, 'hello #world and #again');
      editor.setCustomFormatters([new HashTagFormatter()]);
      selection().removeAllRanges();

      (editor as any).applyCustomFormatters();

      const spans = editor
        .getContentEditable()
        .querySelectorAll<HTMLElement>('span[data-custom-format]');
      expect(Array.from(spans).map(s => s.textContent)).toEqual(['#world', '#again']);
      expect(spans[0].getAttribute('data-custom-format')).toBe('hashtag-formatter');
      expect(spans[0].className).toBe('cometchat-hashtag');
      expect(spans[0].getAttribute('data-tag')).toBe('world');
      expect(spans[0].getAttribute('style')).toContain('rgb(1, 2, 3)');
      expect(editor.getContentEditable().textContent).toBe('hello #world and #again');
    });

    it('leaves the content untouched when no formatter matches', () => {
      const editor = makeEditor();
      setRawContent(editor, 'nothing tagged here');
      editor.setCustomFormatters([new HashTagFormatter()]);

      (editor as any).applyCustomFormatters();

      expect(editor.getContentEditable().innerHTML).toBe('nothing tagged here');
    });

    it('skips a formatter that supplies no pattern', () => {
      const editor = makeEditor();
      setRawContent(editor, 'hello #world');
      editor.setCustomFormatters([new NoRegexFormatter(), new HashTagFormatter()]);
      selection().removeAllRanges();

      (editor as any).applyCustomFormatters();

      const spans = editor.getContentEditable().querySelectorAll('span[data-custom-format]');
      expect(spans.length).toBe(1);
      expect(spans[0].getAttribute('data-custom-format')).toBe('hashtag-formatter');
    });

    it('does nothing at all without any custom formatters', () => {
      const editor = makeEditor();
      setRawContent(editor, 'hello #world');

      (editor as any).applyCustomFormatters();

      expect(editor.getContentEditable().innerHTML).toBe('hello #world');
    });

    it('debounces repeated scheduling into a single pass', () => {
      vi.useFakeTimers();
      const editor = makeEditor();
      setRawContent(editor, 'hello #world');
      editor.setCustomFormatters([new HashTagFormatter()]);
      selection().removeAllRanges();
      const applySpy = vi.spyOn(editor as any, 'applyCustomFormatters');

      (editor as any).scheduleCustomFormatters();
      const firstTimer = (editor as any).customFormatterTimer;
      (editor as any).scheduleCustomFormatters();
      const secondTimer = (editor as any).customFormatterTimer;

      expect(firstTimer).not.toBeNull();
      expect(secondTimer).not.toBe(firstTimer);

      vi.advanceTimersByTime(150);

      expect(applySpy).toHaveBeenCalledTimes(1);
      expect((editor as any).customFormatterTimer).toBeNull();
      expect(
        editor.getContentEditable().querySelectorAll('span[data-custom-format]').length
      ).toBe(1);
    });

    it('schedules nothing when there are no custom formatters', () => {
      vi.useFakeTimers();
      const editor = makeEditor();
      setRawContent(editor, 'hello #world');

      (editor as any).scheduleCustomFormatters();

      expect((editor as any).customFormatterTimer).toBeNull();
      expect(vi.getTimerCount()).toBe(0);
    });

    it('abandons the pass when the editor left the document before the timer fired', () => {
      vi.useFakeTimers();
      const editor = makeEditor();
      setRawContent(editor, 'hello #world');
      editor.setCustomFormatters([new HashTagFormatter()]);
      const applySpy = vi.spyOn(editor as any, 'applyCustomFormatters');

      (editor as any).scheduleCustomFormatters();
      editor.getElement().remove();
      vi.advanceTimersByTime(150);

      expect(applySpy).not.toHaveBeenCalled();
      expect((editor as any).customFormatterTimer).toBeNull();
      expect(
        editor.getContentEditable().querySelectorAll('span[data-custom-format]').length
      ).toBe(0);
    });
  });

  // =================================================================
  // Content and selection API
  // =================================================================

  describe('content and selection API', () => {
    it('empties the editor and drops any pending inline marks', () => {
      const onSelectionUpdate = vi.fn();
      const editor = makeEditor({ onSelectionUpdate });
      setRawContent(editor, '<p>something</p>');
      (editor as any).justAppliedFormatting = true;
      expect(editor.isEmpty()).toBe(false);
      onSelectionUpdate.mockClear();

      editor.clear();

      expect(editor.getHTML()).toBe('');
      expect(editor.isEmpty()).toBe(true);
      expect((editor as any).justAppliedFormatting).toBe(false);
      expect(onSelectionUpdate).toHaveBeenCalledTimes(1);
      expect(onSelectionUpdate.mock.calls[0][0].bold).toBe(false);
    });

    it('moves the caret to each kind of position', () => {
      const editor = makeEditor();
      const ce = makeFocusable(editor);
      setRawContent(editor, 'abcdef');

      editor.setCursorPosition('start');
      expect(selection().anchorNode).toBe(ce);
      expect(selection().anchorOffset).toBe(0);

      editor.setCursorPosition(3);
      expect(selection().anchorNode).toBe(ce.firstChild);
      expect(selection().anchorOffset).toBe(3);

      editor.setCursorPosition('end');
      expect(selection().anchorNode).toBe(ce);
      expect(selection().anchorOffset).toBe(ce.childNodes.length);
    });

    it('selects the whole content and reports the selected text', () => {
      const editor = makeEditor();
      setRawContent(editor, 'abc def');

      editor.selectAll();

      expect(editor.getSelection()!.toString()).toBe('abc def');
      expect(editor.getSelectedText()).toBe('abc def');
    });

    it('round-trips a saved selection', () => {
      const editor = makeEditor();
      const ce = setRawContent(editor, 'abcdef');
      setSelectionRange(ce.firstChild!, 1, ce.firstChild!, 4);
      const saved = editor.saveSelection();
      setCaret(ce.firstChild!, 0);
      expect(selection().toString()).toBe('');

      editor.restoreSelection(saved);

      expect(selection().toString()).toBe('bcd');
    });

    it('exposes the format state captured by the last selection update', () => {
      const editor = makeEditor();
      const ce = makeFocusable(editor);
      setRawContent(editor, '<code>snippet</code>');
      ce.focus();
      setCaret(ce.querySelector('code')!.firstChild!, 2);

      (editor as any).updateFormatState();

      expect(editor.getFormatState()).toMatchObject({ code: true, blockquote: false });
    });

    it('inserts text at the caret and reports the update', () => {
      const onUpdate = vi.fn();
      const editor = makeEditor({ onUpdate });
      const ce = makeFocusable(editor);
      setRawContent(editor, 'ab');
      ce.focus();
      setCaret(ce.firstChild!, 1);
      onUpdate.mockClear();

      editor.insertText('XY');

      expect(ce.textContent).toBe('aXYb');
      expect((editor as any).lastSavedRange).toBeNull();
      expect(onUpdate).toHaveBeenCalledTimes(1);
      expect(onUpdate.mock.calls[0][1]).toContain('aXYb');
    });

    it('deletes a character range and reports the update', () => {
      const onUpdate = vi.fn();
      const editor = makeEditor({ onUpdate });
      const ce = setRawContent(editor, 'abcdef');
      onUpdate.mockClear();

      editor.deleteRange(1, 4);

      expect(ce.textContent).toBe('aef');
      expect(onUpdate).toHaveBeenCalledTimes(1);
    });

    it('refuses a negative or inverted delete range', () => {
      const onUpdate = vi.fn();
      const editor = makeEditor({ onUpdate });
      const ce = setRawContent(editor, 'abcdef');
      onUpdate.mockClear();

      editor.deleteRange(4, 1);
      editor.deleteRange(-1, 2);

      expect(ce.textContent).toBe('abcdef');
      expect(onUpdate).not.toHaveBeenCalled();
    });
  });

  // =================================================================
  // Formatting commands
  // =================================================================

  describe('formatting commands', () => {
    /**
     * Echo the localization keys so the announcement pins down which command
     * ran. The templates keep their `{format}` slot so the substitution in
     * `formatAnnouncement` still happens.
     */
    function echoLocalization(): void {
      vi.spyOn(CometChatLocalize, 'getLocalizedString').mockImplementation((key: string) =>
        key.startsWith('accessibility_formatting_') ? `{format}|${key}` : `L[${key}]`
      );
    }

    /**
     * `announces` is spelled out per command rather than read back from
     * `getFormatState()`. The announcement is built from the same state object,
     * so deriving the expected word from it would let the assertion pass
     * whichever word the code chose.
     *
     * That 'applied' / 'removed' split is a jsdom gap, not a product rule:
     * FormatManager resolves bold, italic, strikethrough and the two list
     * states through `document.queryCommandState`, which jsdom does not
     * implement and which therefore reports false even though the command ran.
     * `selector` is asserted on the same editor to prove it did run. The other
     * four states are resolved by walking the ancestor chain for a real
     * element, which jsdom handles, so those announce 'applied'.
     */
    const commands = [
      {
        method: 'applyBold',
        key: 'message_composer_bold',
        selector: 'strong',
        announces: 'removed',
        pending: false,
      },
      {
        method: 'applyItalic',
        key: 'message_composer_italic',
        selector: 'em',
        announces: 'removed',
        pending: false,
      },
      {
        method: 'applyUnderline',
        key: 'message_composer_underline',
        selector: 'u',
        announces: 'applied',
        pending: false,
      },
      {
        method: 'applyStrikethrough',
        key: 'message_composer_strikethrough',
        selector: 's',
        announces: 'removed',
        pending: false,
      },
      {
        method: 'applyInlineCode',
        key: 'message_composer_inline_code',
        selector: 'code',
        announces: 'applied',
        pending: true,
      },
      {
        method: 'applyCodeBlock',
        key: 'message_composer_code_block',
        selector: 'pre',
        announces: 'applied',
        pending: true,
      },
      {
        method: 'applyBlockquote',
        key: 'message_composer_blockquote',
        selector: 'blockquote',
        announces: 'applied',
        pending: true,
      },
      {
        method: 'applyOrderedList',
        key: 'message_composer_ordered_list',
        selector: 'ol li',
        announces: 'removed',
        pending: true,
      },
      {
        method: 'applyBulletList',
        key: 'message_composer_bullet_list',
        selector: 'ul li',
        announces: 'removed',
        pending: true,
      },
    ];

    for (const { method, key, selector, announces, pending } of commands) {
      it(`${method} rewrites the selection, re-emits it and announces the result`, () => {
        echoLocalization();
        vi.useFakeTimers();
        const onUpdate = vi.fn();
        const editor = makeEditor({ onUpdate });
        const ce = makeFocusable(editor);
        setRawContent(editor, 'format me');
        ce.focus();
        setSelectionRange(ce.firstChild!, 0, ce.firstChild!, 9);
        onUpdate.mockClear();

        (editor as any)[method]();

        expect(ce.querySelector(selector)!.textContent).toBe('format me');
        expect(onUpdate).toHaveBeenCalled();
        // The block commands leave a caret escape behind; the inline marks do not.
        expect((editor as any).justAppliedFormatting).toBe(pending);

        vi.advanceTimersByTime(100);
        expect((editor as any).ariaLiveRegion.textContent).toBe(
          `L[${key}]|accessibility_formatting_${announces}`
        );
      });
    }
  });

  // =================================================================
  // Links
  // =================================================================

  describe('link commands', () => {
    it('inserts a link over the selection and reports it back', () => {
      const onUpdate = vi.fn();
      const editor = makeEditor({ onUpdate });
      const ce = makeFocusable(editor);
      setRawContent(editor, 'click here');
      ce.focus();
      setSelectionRange(ce.firstChild!, 0, ce.firstChild!, 10);
      onUpdate.mockClear();

      editor.setLink('https://example.com/docs', 'click here');

      const anchor = ce.querySelector('a')!;
      expect(anchor.getAttribute('href')).toBe('https://example.com/docs');
      expect(anchor.textContent).toBe('click here');
      expect(onUpdate).toHaveBeenCalledTimes(1);

      setCaret(anchor.firstChild!, 3);
      expect(editor.isLinkActive()).toBe(true);
      expect(editor.getCurrentLink()).toBe('https://example.com/docs');
      expect(editor.getCurrentLinkText()).toBe('click here');
    });

    it('updates the href of a link the caret is already inside', () => {
      const editor = makeEditor();
      const ce = makeFocusable(editor);
      setRawContent(editor, '<a href="https://old.test/">link</a>');
      ce.focus();
      setCaret(ce.querySelector('a')!.firstChild!, 2);

      editor.setLink('https://new.test/', 'link');

      expect(ce.querySelectorAll('a').length).toBe(1);
      expect(ce.querySelector('a')!.getAttribute('href')).toBe('https://new.test/');
    });

    it('removes the link when the url is null', () => {
      const editor = makeEditor();
      const ce = makeFocusable(editor);
      setRawContent(editor, 'before <a href="https://old.test/">link</a> after');
      ce.focus();
      setCaret(ce.querySelector('a')!.firstChild!, 2);

      editor.setLink(null);

      expect(ce.querySelector('a')).toBeNull();
      expect(ce.textContent).toBe('before link after');
    });

    it('reports no active link from ordinary text', () => {
      const editor = makeEditor();
      const ce = makeFocusable(editor);
      setRawContent(editor, 'no links');
      ce.focus();
      setCaret(ce.firstChild!, 3);

      expect(editor.isLinkActive()).toBe(false);
      expect(editor.getCurrentLink()).toBeNull();
      expect(editor.getCurrentLinkText()).toBeNull();
    });
  });

  // =================================================================
  // Input, keyboard, paste and copy listeners
  // =================================================================

  describe('input, keyboard and clipboard listeners', () => {
    it('re-emits the content when the editor fires input', () => {
      const onUpdate = vi.fn();
      const editor = makeEditor({ onUpdate });
      const ce = makeFocusable(editor);
      setRawContent(editor, '<p>typed</p>');
      ce.focus();
      setCaret(ce.querySelector('p')!.firstChild!, 5);
      onUpdate.mockClear();

      ce.dispatchEvent(new Event('input', { bubbles: true }));

      expect(onUpdate).toHaveBeenCalledTimes(1);
      expect(onUpdate.mock.calls[0][0]).toBe('<p>typed</p>');
    });

    it('applies bold for the ctrl+b shortcut', () => {
      vi.spyOn(CometChatLocalize, 'getLocalizedString').mockImplementation((key: string) =>
        key.startsWith('accessibility_formatting_') ? `{format}|${key}` : `L[${key}]`
      );
      vi.useFakeTimers();
      const editor = makeEditor();
      const ce = makeFocusable(editor);
      setRawContent(editor, 'bold me');
      ce.focus();
      setSelectionRange(ce.firstChild!, 0, ce.firstChild!, 7);

      const event = new KeyboardEvent('keydown', {
        key: 'b',
        ctrlKey: true,
        bubbles: true,
        cancelable: true,
      });
      ce.dispatchEvent(event);

      expect(event.defaultPrevented).toBe(true);
      vi.advanceTimersByTime(100);
      expect((editor as any).ariaLiveRegion.textContent).toContain('L[message_composer_bold]');
    });

    it('ignores the ctrl+b shortcut when formatting is disabled', () => {
      const editor = makeEditor({ enableFormatting: false });
      const ce = makeFocusable(editor);
      setRawContent(editor, 'bold me');
      ce.focus();
      setSelectionRange(ce.firstChild!, 0, ce.firstChild!, 7);

      const event = new KeyboardEvent('keydown', {
        key: 'b',
        ctrlKey: true,
        bubbles: true,
        cancelable: true,
      });
      ce.dispatchEvent(event);

      expect(event.defaultPrevented).toBe(false);
      expect(ce.querySelector('strong')).toBeNull();
    });

    it('removes a mention chip through a backspace keydown', () => {
      const editor = makeEditor();
      const ce = setRawContent(
        editor,
        `<span class="${MENTION_CHIP}" data-uid="ivy">@Ivy</span> `
      );
      setCaret(ce.lastChild!, 1);

      const event = new KeyboardEvent('keydown', {
        key: 'Backspace',
        bubbles: true,
        cancelable: true,
      });
      ce.dispatchEvent(event);

      expect(event.defaultPrevented).toBe(true);
      expect(ce.querySelector(`.${MENTION_CHIP}`)).toBeNull();
    });

    it('pastes plain text at the caret when formatting is disabled', () => {
      const onUpdate = vi.fn();
      const editor = makeEditor({ enableFormatting: false, onUpdate });
      const ce = makeFocusable(editor);
      setRawContent(editor, 'ab');
      ce.focus();
      setCaret(ce.firstChild!, 1);
      onUpdate.mockClear();

      const event = new Event('paste', { bubbles: true, cancelable: true });
      Object.defineProperty(event, 'clipboardData', {
        value: { getData: (type: string) => (type === 'text/plain' ? 'ZZ' : '') },
      });
      ce.dispatchEvent(event);

      expect(event.defaultPrevented).toBe(true);
      expect(ce.textContent).toBe('aZZb');
      expect(onUpdate).toHaveBeenCalledTimes(1);
    });

    it('ignores a paste that carries no clipboard data', () => {
      const onUpdate = vi.fn();
      const editor = makeEditor({ onUpdate });
      const ce = setRawContent(editor, 'ab');
      onUpdate.mockClear();

      const event = new Event('paste', { bubbles: true, cancelable: true });
      ce.dispatchEvent(event);

      expect(event.defaultPrevented).toBe(false);
      expect(ce.textContent).toBe('ab');
      expect(onUpdate).not.toHaveBeenCalled();
    });

    it('puts both HTML and markdown flavours of the selection on the clipboard', () => {
      const editor = makeEditor();
      const ce = makeFocusable(editor);
      setRawContent(editor, '<strong>bold</strong> tail');
      ce.focus();
      selection().removeAllRanges();
      const range = document.createRange();
      range.selectNodeContents(ce);
      selection().addRange(range);
      const setData = vi.fn();

      const event = new Event('copy', { bubbles: true, cancelable: true });
      Object.defineProperty(event, 'clipboardData', { value: { setData } });
      ce.dispatchEvent(event);

      expect(event.defaultPrevented).toBe(true);
      expect(setData).toHaveBeenCalledWith('text/html', '<strong>bold</strong> tail');
      expect(setData).toHaveBeenCalledWith('text/plain', '**bold** tail');
    });

    it('leaves the clipboard alone when the selection is collapsed', () => {
      const editor = makeEditor();
      const ce = makeFocusable(editor);
      setRawContent(editor, 'nothing selected');
      ce.focus();
      setCaret(ce.firstChild!, 3);
      const setData = vi.fn();

      const event = new Event('copy', { bubbles: true, cancelable: true });
      Object.defineProperty(event, 'clipboardData', { value: { setData } });
      ce.dispatchEvent(event);

      expect(setData).not.toHaveBeenCalled();
      expect(event.defaultPrevented).toBe(false);
    });
  });

  // =================================================================
  // Teardown
  // =================================================================

  describe('destroy', () => {
    it('cancels a pending autofocus so a torn-down editor never steals focus', () => {
      vi.useFakeTimers();
      const editor = makeEditor({ autofocus: true, content: 'Hello' });
      const ce = makeFocusable(editor);

      editor.destroy();

      expect((editor as any).autofocusTimer).toBeNull();
      expect(vi.getTimerCount()).toBe(0);
      vi.advanceTimersByTime(0);
      expect(document.activeElement).not.toBe(ce);
      expect(editor.isDestroyed()).toBe(true);
    });

    it('cancels a pending custom-formatter pass', () => {
      vi.useFakeTimers();
      const editor = makeEditor();
      setRawContent(editor, 'hello #world');
      editor.setCustomFormatters([new HashTagFormatter()]);
      (editor as any).scheduleCustomFormatters();
      expect(vi.getTimerCount()).toBe(1);

      editor.destroy();

      expect((editor as any).customFormatterTimer).toBeNull();
      expect(vi.getTimerCount()).toBe(0);
    });

    it('detaches every listener it attached and empties the editor', () => {
      const onUpdate = vi.fn();
      const onSelectionUpdate = vi.fn();
      const editor = makeEditor({ onUpdate, onSelectionUpdate });
      const ce = setRawContent(editor, '<p>content</p>');
      const host = editor.getElement();

      editor.destroy();

      expect(ce.innerHTML).toBe('');
      expect(host.parentNode).toBeNull();
      expect((editor as any).eventListeners).toEqual([]);
      expect((editor as any).lastSavedRange).toBeNull();

      // The document-level selectionchange listener must be gone too.
      document.dispatchEvent(new Event('selectionchange'));
      ce.dispatchEvent(new Event('input', { bubbles: true }));

      expect(onSelectionUpdate).not.toHaveBeenCalled();
      expect(onUpdate).not.toHaveBeenCalled();
    });

    it('is safe to call twice', () => {
      const editor = makeEditor();
      const host = editor.getElement();
      editor.destroy();
      const listenersAfterFirst = (editor as any).eventListeners;

      editor.destroy();

      expect(editor.isDestroyed()).toBe(true);
      expect((editor as any).eventListeners).toBe(listenersAfterFirst);
      expect(host.parentNode).toBeNull();
    });
  });

  // =================================================================
  // Focus / blur bookkeeping
  // =================================================================

  describe('focus and blur', () => {
    it('marks the host focused and notifies the host component', () => {
      const onFocus = vi.fn();
      const editor = makeEditor({ onFocus });
      const ce = makeFocusable(editor);

      ce.focus();

      expect(editor.getElement().classList.contains('cometchat-rich-text-editor--focused')).toBe(
        true
      );
      expect(onFocus).toHaveBeenCalledTimes(1);
    });

    it('remembers the last range and clears the focused class on blur', () => {
      const onBlur = vi.fn();
      const editor = makeEditor({ onBlur });
      const ce = makeFocusable(editor);
      setRawContent(editor, 'remember me');
      ce.focus();
      setCaret(ce.firstChild!, 4);

      ce.blur();

      expect(onBlur).toHaveBeenCalledTimes(1);
      expect(editor.getElement().classList.contains('cometchat-rich-text-editor--focused')).toBe(
        false
      );
      const saved: Range = (editor as any).lastSavedRange;
      expect(saved.startContainer).toBe(ce.firstChild);
      expect(saved.startOffset).toBe(4);
    });

    it('saves no range on blur when there was no selection', () => {
      const editor = makeEditor();
      const ce = makeFocusable(editor);
      ce.focus();
      selection().removeAllRanges();

      ce.blur();

      expect((editor as any).lastSavedRange).toBeNull();
    });
  });
});
