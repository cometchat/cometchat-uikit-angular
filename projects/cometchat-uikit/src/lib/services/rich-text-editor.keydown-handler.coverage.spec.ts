import { describe, it, expect, vi, afterEach } from 'vitest';
import { handleKeyDownImpl } from './rich-text-editor.keydown-handler';
import type { KeyDownHandlerContext } from './rich-text-editor.keydown-handler';

/**
 * `handleKeyDownImpl` is a free function whose only contact with the editor is
 * the `ctx` object it is handed, so it is driven directly here. The real caller
 * passes the whole RichTextEditor instance; reproducing these keyboard states
 * through the rendered editor would mean a live selection plus the SDK the
 * editor's host drags in, and would still not let a test decide what
 * `isInBlockquote()` or `handleTabKey()` answer on a given keystroke.
 *
 * Two assertion habits carry most of the weight below:
 *  - `scrollCursorIntoView` is the last line of the function and fires for
 *    Enter, Backspace, Delete and the arrow keys. For those keys, asserting it
 *    was NOT called is what proves an early `return` actually happened rather
 *    than the handler merely doing no visible work.
 *  - the KeyboardEvents are real and cancelable, so `defaultPrevented` reports
 *    whether the handler swallowed the keystroke or left it to the browser.
 */

type Stubs = ReturnType<typeof makeCtx>;

function makeCtx(overrides: Record<string, unknown> = {}) {
  const base = {
    config: {} as { enableFormatting?: boolean },
    handleMentionDeletion: vi.fn().mockReturnValue(false),
    applyBold: vi.fn(),
    applyItalic: vi.fn(),
    applyUnderline: vi.fn(),
    undo: vi.fn().mockReturnValue(true),
    redo: vi.fn().mockReturnValue(true),
    isInBlockquote: vi.fn().mockReturnValue(false),
    shouldExitBlockquote: vi.fn().mockReturnValue(false),
    exitBlockquote: vi.fn(),
    pushToHistory: vi.fn(),
    emitUpdate: vi.fn(),
    isInCodeBlock: vi.fn().mockReturnValue(false),
    shouldExitCodeBlock: vi.fn().mockReturnValue(false),
    exitCodeBlock: vi.fn(),
    getCurrentListItem: vi.fn().mockReturnValue(null as HTMLElement | null),
    listManager: {
      exitList: vi.fn(),
      createNewListItem: vi.fn(),
      handleTabKey: vi.fn().mockReturnValue(false),
      handleShiftTabKey: vi.fn().mockReturnValue(false),
    },
    scrollCursorIntoView: vi.fn(),
    selectionManager: undefined as undefined | { getSelection: () => Selection | null },
  };
  // Assign rather than spread so the stub keeps its precise type instead of
  // picking up an index signature from the override map.
  return Object.assign(base, overrides) as typeof base;
}

/** Dispatch-free but cancelable, so `defaultPrevented` is meaningful. */
function press(ctx: Stubs, init: KeyboardEventInit & { key: string }): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { cancelable: true, ...init });
  handleKeyDownImpl(ctx as unknown as KeyDownHandlerContext, event);
  return event;
}

/** Asserts the handler took no action at all for this keystroke. */
function expectInert(ctx: Stubs, event: KeyboardEvent): void {
  expect(event.defaultPrevented).toBe(false);
  expect(ctx.applyBold).not.toHaveBeenCalled();
  expect(ctx.applyItalic).not.toHaveBeenCalled();
  expect(ctx.applyUnderline).not.toHaveBeenCalled();
  expect(ctx.undo).not.toHaveBeenCalled();
  expect(ctx.redo).not.toHaveBeenCalled();
  expect(ctx.pushToHistory).not.toHaveBeenCalled();
  expect(ctx.emitUpdate).not.toHaveBeenCalled();
}

const hosts: HTMLElement[] = [];

/** A contenteditable root attached to the document so Ranges are valid. */
function buildHost(html: string): HTMLDivElement {
  const host = document.createElement('div');
  // setAttribute rather than the IDL property: jsdom has no contentEditable
  // setter, and the code under test only ever walks the live DOM.
  host.setAttribute('contenteditable', 'true');
  host.innerHTML = html;
  document.body.appendChild(host);
  hosts.push(host);
  return host;
}

/**
 * Stands in for the editor's SelectionManager. A recorded `addRange` is how the
 * tests below check where the caret was left, which a real jsdom Selection
 * makes awkward to observe.
 */
function stubSelectionManager(range: Range | null, rangeCount = range ? 1 : 0) {
  const added: Range[] = [];
  const selection = {
    rangeCount,
    getRangeAt: vi.fn(() => range as Range),
    removeAllRanges: vi.fn(),
    addRange: vi.fn((r: Range) => {
      added.push(r);
    }),
  };
  return { manager: { getSelection: vi.fn(() => selection as unknown as Selection) }, selection, added };
}

afterEach(() => {
  while (hosts.length) {
    hosts.pop()!.remove();
  }
});

describe('handleKeyDownImpl — mention deletion', () => {
  it('stops after a Backspace is consumed by mention deletion', () => {
    const ctx = makeCtx({ handleMentionDeletion: vi.fn().mockReturnValue(true) });
    const event = press(ctx, { key: 'Backspace' });

    expect(ctx.handleMentionDeletion).toHaveBeenCalledWith(event);
    // Backspace is in the scroll list on the final line, so its absence is
    // proof the handler returned at the mention branch.
    expect(ctx.scrollCursorIntoView).not.toHaveBeenCalled();
  });

  it('continues past Delete when mention deletion declines it', () => {
    const ctx = makeCtx({ handleMentionDeletion: vi.fn().mockReturnValue(false) });
    const event = press(ctx, { key: 'Delete' });

    expect(ctx.handleMentionDeletion).toHaveBeenCalledWith(event);
    expect(ctx.scrollCursorIntoView).toHaveBeenCalledTimes(1);
  });

  it('does not consult mention deletion for other keys, and leaves them alone', () => {
    const ctx = makeCtx();
    const event = press(ctx, { key: 'a' });

    expect(ctx.handleMentionDeletion).not.toHaveBeenCalled();
    expect(ctx.scrollCursorIntoView).not.toHaveBeenCalled();
    expectInert(ctx, event);
  });
});

describe('handleKeyDownImpl — formatting shortcuts', () => {
  const cases: ReadonlyArray<[string, KeyboardEventInit & { key: string }, keyof Stubs]> = [
    ['Ctrl+b', { key: 'b', ctrlKey: true }, 'applyBold'],
    ['Cmd+B', { key: 'B', metaKey: true }, 'applyBold'],
    ['Ctrl+i', { key: 'i', ctrlKey: true }, 'applyItalic'],
    ['Cmd+I', { key: 'I', metaKey: true }, 'applyItalic'],
    ['Ctrl+u', { key: 'u', ctrlKey: true }, 'applyUnderline'],
    ['Cmd+U', { key: 'U', metaKey: true }, 'applyUnderline'],
  ];

  for (const [label, init, applied] of cases) {
    it(`${label} applies ${String(applied)} and swallows the keystroke`, () => {
      const ctx = makeCtx();
      const event = press(ctx, init);

      expect(ctx[applied]).toHaveBeenCalledTimes(1);
      expect(event.defaultPrevented).toBe(true);
      // Each shortcut returns, so no sibling formatter may also run.
      const others = (['applyBold', 'applyItalic', 'applyUnderline'] as const).filter((k) => k !== applied);
      for (const other of others) {
        expect(ctx[other]).not.toHaveBeenCalled();
      }
    });
  }

  it('ignores the shortcuts when formatting is disabled', () => {
    const ctx = makeCtx({ config: { enableFormatting: false } });
    const event = press(ctx, { key: 'b', ctrlKey: true });

    expectInert(ctx, event);
  });

  it('leaves Ctrl+Shift+B to the browser so it cannot be mistaken for bold', () => {
    const ctx = makeCtx();
    const event = press(ctx, { key: 'B', ctrlKey: true, shiftKey: true });

    expectInert(ctx, event);
  });

  it('passes an unmapped modifier combination through untouched', () => {
    const ctx = makeCtx();
    const event = press(ctx, { key: 'k', ctrlKey: true });

    expectInert(ctx, event);
  });

  it('does not treat a bare b as bold', () => {
    const ctx = makeCtx();
    const event = press(ctx, { key: 'b' });

    expectInert(ctx, event);
  });
});

describe('handleKeyDownImpl — undo and redo', () => {
  it('Ctrl+Z undoes and swallows the keystroke', () => {
    const ctx = makeCtx();
    const event = press(ctx, { key: 'z', ctrlKey: true });

    expect(ctx.undo).toHaveBeenCalledTimes(1);
    expect(ctx.redo).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(true);
  });

  it('undoes even when formatting is disabled, since history is not a formatting feature', () => {
    const ctx = makeCtx({ config: { enableFormatting: false } });
    press(ctx, { key: 'z', metaKey: true });

    expect(ctx.undo).toHaveBeenCalledTimes(1);
  });

  const redoCases: ReadonlyArray<[string, KeyboardEventInit & { key: string }]> = [
    ['Ctrl+y', { key: 'y', ctrlKey: true }],
    ['Ctrl+Y', { key: 'Y', ctrlKey: true }],
    ['Ctrl+Shift+z', { key: 'z', ctrlKey: true, shiftKey: true }],
    ['Cmd+Shift+Z', { key: 'Z', metaKey: true, shiftKey: true }],
  ];

  for (const [label, init] of redoCases) {
    it(`${label} redoes and swallows the keystroke`, () => {
      const ctx = makeCtx();
      const event = press(ctx, init);

      expect(ctx.redo).toHaveBeenCalledTimes(1);
      expect(ctx.undo).not.toHaveBeenCalled();
      expect(event.defaultPrevented).toBe(true);
    });
  }

  it('needs Shift for the capital-Z redo, so Ctrl+Z alone does nothing', () => {
    const ctx = makeCtx();
    const event = press(ctx, { key: 'Z', ctrlKey: true });

    expectInert(ctx, event);
  });

  it('needs a modifier, so a bare y does nothing', () => {
    const ctx = makeCtx();
    const event = press(ctx, { key: 'y' });

    expectInert(ctx, event);
  });
});

describe('handleKeyDownImpl — Enter inside a blockquote', () => {
  it('swallows plain Enter so the quote is neither extended nor exited', () => {
    const ctx = makeCtx({ isInBlockquote: vi.fn().mockReturnValue(true) });
    const event = press(ctx, { key: 'Enter' });

    expect(ctx.exitBlockquote).not.toHaveBeenCalled();
    expect(ctx.getCurrentListItem).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
    expect(ctx.scrollCursorIntoView).not.toHaveBeenCalled();
  });

  it('Shift+Enter at the exit boundary leaves the blockquote and records history', () => {
    const ctx = makeCtx({
      isInBlockquote: vi.fn().mockReturnValue(true),
      shouldExitBlockquote: vi.fn().mockReturnValue(true),
    });
    const event = press(ctx, { key: 'Enter', shiftKey: true });

    expect(ctx.exitBlockquote).toHaveBeenCalledTimes(1);
    expect(ctx.pushToHistory).toHaveBeenCalledTimes(1);
    expect(ctx.emitUpdate).toHaveBeenCalledTimes(1);
    expect(event.defaultPrevented).toBe(true);
    expect(ctx.scrollCursorIntoView).not.toHaveBeenCalled();
  });

  it('Shift+Enter away from the boundary is left to the browser to insert a break', () => {
    const ctx = makeCtx({
      isInBlockquote: vi.fn().mockReturnValue(true),
      shouldExitBlockquote: vi.fn().mockReturnValue(false),
    });
    const event = press(ctx, { key: 'Enter', shiftKey: true });

    expect(ctx.exitBlockquote).not.toHaveBeenCalled();
    // Not prevented: the browser's own line break is the intended behaviour.
    expect(event.defaultPrevented).toBe(false);
    expect(ctx.pushToHistory).not.toHaveBeenCalled();
    expect(ctx.scrollCursorIntoView).not.toHaveBeenCalled();
  });
});

describe('handleKeyDownImpl — Enter inside a code block', () => {
  it('lets plain Enter fall through to the browser newline', () => {
    const ctx = makeCtx({ isInCodeBlock: vi.fn().mockReturnValue(true) });
    const event = press(ctx, { key: 'Enter' });

    expect(ctx.exitCodeBlock).not.toHaveBeenCalled();
    expect(ctx.getCurrentListItem).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
    expect(ctx.scrollCursorIntoView).not.toHaveBeenCalled();
  });

  it('Shift+Enter at the exit boundary leaves the code block and records history', () => {
    const ctx = makeCtx({
      isInCodeBlock: vi.fn().mockReturnValue(true),
      shouldExitCodeBlock: vi.fn().mockReturnValue(true),
    });
    const event = press(ctx, { key: 'Enter', shiftKey: true });

    expect(ctx.exitCodeBlock).toHaveBeenCalledTimes(1);
    expect(ctx.pushToHistory).toHaveBeenCalledTimes(1);
    expect(ctx.emitUpdate).toHaveBeenCalledTimes(1);
    expect(event.defaultPrevented).toBe(true);
    expect(ctx.scrollCursorIntoView).not.toHaveBeenCalled();
  });

  it('Shift+Enter away from the boundary is left to the browser', () => {
    const ctx = makeCtx({
      isInCodeBlock: vi.fn().mockReturnValue(true),
      shouldExitCodeBlock: vi.fn().mockReturnValue(false),
    });
    const event = press(ctx, { key: 'Enter', shiftKey: true });

    expect(ctx.exitCodeBlock).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
    expect(ctx.pushToHistory).not.toHaveBeenCalled();
    expect(ctx.scrollCursorIntoView).not.toHaveBeenCalled();
  });

  it('checks the blockquote first, so a blockquote wins over a code block', () => {
    const ctx = makeCtx({
      isInBlockquote: vi.fn().mockReturnValue(true),
      isInCodeBlock: vi.fn().mockReturnValue(true),
      shouldExitCodeBlock: vi.fn().mockReturnValue(true),
    });
    press(ctx, { key: 'Enter', shiftKey: true });

    expect(ctx.isInCodeBlock).not.toHaveBeenCalled();
    expect(ctx.exitCodeBlock).not.toHaveBeenCalled();
  });
});

describe('handleKeyDownImpl — Enter inside a list', () => {
  function listItem(html: string): HTMLElement {
    const host = buildHost(`<ul><li>${html}</li></ul>`);
    return host.querySelector('li') as HTMLElement;
  }

  it('creates the next item when the current one has text', () => {
    const ctx = makeCtx({ getCurrentListItem: vi.fn().mockReturnValue(listItem('hello')) });
    const event = press(ctx, { key: 'Enter' });

    expect(ctx.listManager.createNewListItem).toHaveBeenCalledTimes(1);
    expect(ctx.listManager.exitList).not.toHaveBeenCalled();
    expect(ctx.pushToHistory).toHaveBeenCalledTimes(1);
    expect(ctx.emitUpdate).toHaveBeenCalledTimes(1);
    expect(event.defaultPrevented).toBe(true);
    expect(ctx.scrollCursorIntoView).not.toHaveBeenCalled();
  });

  it('creates the next item on Shift+Enter too, instead of inserting a break', () => {
    const manager = { getSelection: vi.fn(() => null) };
    const ctx = makeCtx({
      getCurrentListItem: vi.fn().mockReturnValue(listItem('hello')),
      selectionManager: manager,
    });
    const event = press(ctx, { key: 'Enter', shiftKey: true });

    expect(ctx.listManager.createNewListItem).toHaveBeenCalledTimes(1);
    // The list branch returns before the <br>-inserting branch, so the
    // selection is never read: that is what makes this different from a
    // Shift+Enter in plain text.
    expect(manager.getSelection).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(true);
  });

  it('exits the list from an empty item', () => {
    const ctx = makeCtx({ getCurrentListItem: vi.fn().mockReturnValue(listItem('')) });
    const event = press(ctx, { key: 'Enter' });

    expect(ctx.listManager.exitList).toHaveBeenCalledTimes(1);
    expect(ctx.listManager.createNewListItem).not.toHaveBeenCalled();
    expect(ctx.pushToHistory).toHaveBeenCalledTimes(1);
    expect(ctx.emitUpdate).toHaveBeenCalledTimes(1);
    expect(event.defaultPrevented).toBe(true);
  });

  it('exits the list from an item holding only the placeholder break', () => {
    const ctx = makeCtx({ getCurrentListItem: vi.fn().mockReturnValue(listItem('<br>')) });
    press(ctx, { key: 'Enter' });

    expect(ctx.listManager.exitList).toHaveBeenCalledTimes(1);
  });

  it('exits the list from an item whose markup is only a break, whatever its text reads', () => {
    // A stub, not an element: no real node can report non-blank textContent
    // while its innerHTML is nothing but a <br>, yet the markup check is a
    // separate arm of the guard and has to be exercised on its own.
    const detached = { textContent: 'ghost text', innerHTML: ' <br> ' } as unknown as HTMLElement;
    const ctx = makeCtx({ getCurrentListItem: vi.fn().mockReturnValue(detached) });
    press(ctx, { key: 'Enter' });

    expect(ctx.listManager.exitList).toHaveBeenCalledTimes(1);
    expect(ctx.listManager.createNewListItem).not.toHaveBeenCalled();
  });

  it('treats a null textContent as not-empty rather than crashing', () => {
    const detached = { textContent: null, innerHTML: 'typed' } as unknown as HTMLElement;
    const ctx = makeCtx({ getCurrentListItem: vi.fn().mockReturnValue(detached) });
    press(ctx, { key: 'Enter' });

    expect(ctx.listManager.createNewListItem).toHaveBeenCalledTimes(1);
    expect(ctx.listManager.exitList).not.toHaveBeenCalled();
  });
});

describe('handleKeyDownImpl — Shift+Enter outside any block', () => {
  function caretIn(node: Node, offset: number): Range {
    const range = document.createRange();
    range.setStart(node, offset);
    range.collapse(true);
    return range;
  }

  it('inserts a doubled break at the end of the content and parks the caret between them', () => {
    const host = buildHost('hello');
    const { manager, selection, added } = stubSelectionManager(caretIn(host.firstChild!, 5));
    const ctx = makeCtx({ selectionManager: manager });

    const event = press(ctx, { key: 'Enter', shiftKey: true });

    // Two breaks: a lone trailing <br> is collapsed by the browser and would
    // leave the caret on the old line.
    expect(host.innerHTML).toBe('hello<br><br>');
    expect(event.defaultPrevented).toBe(true);
    expect(selection.removeAllRanges).toHaveBeenCalledTimes(1);
    expect(added).toHaveLength(1);
    const caret = added[0];
    expect(caret.collapsed).toBe(true);
    expect(caret.startContainer).toBe(host);
    expect(caret.startContainer.childNodes[caret.startOffset - 1]).toBe(host.querySelector('br'));
    expect(ctx.pushToHistory).toHaveBeenCalledTimes(1);
    expect(ctx.emitUpdate).toHaveBeenCalledTimes(1);
  });

  it('doubles the break when the caret sits at the very end of an empty editor', () => {
    const host = buildHost('');
    const { manager } = stubSelectionManager(caretIn(host, 0));
    const ctx = makeCtx({ selectionManager: manager });

    press(ctx, { key: 'Enter', shiftKey: true });

    expect(host.innerHTML).toBe('<br><br>');
  });

  it('doubles the break when the next node is itself a break', () => {
    const host = buildHost('ab<br>');
    const { manager } = stubSelectionManager(caretIn(host, 1));
    const ctx = makeCtx({ selectionManager: manager });

    press(ctx, { key: 'Enter', shiftKey: true });

    expect(host.innerHTML).toBe('ab<br><br><br>');
  });

  it('inserts a single break when visible content follows the caret', () => {
    const host = buildHost('ab<span>x</span>');
    const { manager } = stubSelectionManager(caretIn(host, 1));
    const ctx = makeCtx({ selectionManager: manager });

    press(ctx, { key: 'Enter', shiftKey: true });

    // No padding break here: the span after the caret already keeps the new
    // line visible.
    expect(host.innerHTML).toBe('ab<br><span>x</span>');
  });

  it('replaces the selected text with the break', () => {
    const host = buildHost('hello world');
    const range = document.createRange();
    range.setStart(host.firstChild!, 5);
    range.setEnd(host.firstChild!, 11);
    const { manager } = stubSelectionManager(range);
    const ctx = makeCtx({ selectionManager: manager });

    press(ctx, { key: 'Enter', shiftKey: true });

    expect(host.textContent).toBe('hello');
    expect(host.innerHTML).toBe('hello<br><br>');
  });

  it('swallows the keystroke but changes nothing when there is no selection', () => {
    const manager = { getSelection: vi.fn(() => null) };
    const ctx = makeCtx({ selectionManager: manager });

    const event = press(ctx, { key: 'Enter', shiftKey: true });

    expect(manager.getSelection).toHaveBeenCalledTimes(1);
    expect(event.defaultPrevented).toBe(true);
    expect(ctx.pushToHistory).not.toHaveBeenCalled();
    expect(ctx.emitUpdate).not.toHaveBeenCalled();
    expect(ctx.scrollCursorIntoView).not.toHaveBeenCalled();
  });

  it('changes nothing when the selection holds no range', () => {
    const { manager, selection } = stubSelectionManager(null, 0);
    const ctx = makeCtx({ selectionManager: manager });

    const event = press(ctx, { key: 'Enter', shiftKey: true });

    expect(selection.getRangeAt).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(true);
    expect(ctx.emitUpdate).not.toHaveBeenCalled();
  });

  it('survives a context whose selection manager is missing', () => {
    const ctx = makeCtx();

    const event = press(ctx, { key: 'Enter', shiftKey: true });

    expect(event.defaultPrevented).toBe(true);
    expect(ctx.pushToHistory).not.toHaveBeenCalled();
    expect(ctx.emitUpdate).not.toHaveBeenCalled();
  });

  it('leaves plain Enter outside every block to the composer, only scrolling the caret', () => {
    const ctx = makeCtx();
    const event = press(ctx, { key: 'Enter' });

    expect(event.defaultPrevented).toBe(false);
    expect(ctx.pushToHistory).not.toHaveBeenCalled();
    expect(ctx.listManager.handleTabKey).not.toHaveBeenCalled();
    expect(ctx.scrollCursorIntoView).toHaveBeenCalledTimes(1);
  });
});

describe('handleKeyDownImpl — Tab indentation', () => {
  it('records history when the list manager consumes Tab', () => {
    const ctx = makeCtx();
    ctx.listManager.handleTabKey.mockReturnValue(true);
    const event = press(ctx, { key: 'Tab' });

    expect(ctx.listManager.handleTabKey).toHaveBeenCalledWith(event);
    expect(ctx.listManager.handleShiftTabKey).not.toHaveBeenCalled();
    expect(ctx.pushToHistory).toHaveBeenCalledTimes(1);
    expect(ctx.emitUpdate).toHaveBeenCalledTimes(1);
  });

  it('records nothing when the list manager declines Tab', () => {
    const ctx = makeCtx();
    ctx.listManager.handleTabKey.mockReturnValue(false);
    press(ctx, { key: 'Tab' });

    expect(ctx.listManager.handleTabKey).toHaveBeenCalledTimes(1);
    expect(ctx.pushToHistory).not.toHaveBeenCalled();
    expect(ctx.emitUpdate).not.toHaveBeenCalled();
    expect(ctx.scrollCursorIntoView).not.toHaveBeenCalled();
  });

  it('records history when the list manager consumes Shift+Tab', () => {
    const ctx = makeCtx();
    ctx.listManager.handleShiftTabKey.mockReturnValue(true);
    const event = press(ctx, { key: 'Tab', shiftKey: true });

    expect(ctx.listManager.handleShiftTabKey).toHaveBeenCalledWith(event);
    expect(ctx.listManager.handleTabKey).not.toHaveBeenCalled();
    expect(ctx.pushToHistory).toHaveBeenCalledTimes(1);
    expect(ctx.emitUpdate).toHaveBeenCalledTimes(1);
  });

  it('records nothing when the list manager declines Shift+Tab', () => {
    const ctx = makeCtx();
    ctx.listManager.handleShiftTabKey.mockReturnValue(false);
    press(ctx, { key: 'Tab', shiftKey: true });

    expect(ctx.listManager.handleShiftTabKey).toHaveBeenCalledTimes(1);
    expect(ctx.pushToHistory).not.toHaveBeenCalled();
    expect(ctx.emitUpdate).not.toHaveBeenCalled();
  });
});

/**
 * Only the arrow keys live here. Enter, Backspace and Delete also reach the
 * final scroll line, but their scroll outcome is asserted in the sections that
 * own those keys, and 'a' and Tab are covered by the inert/declined cases
 * above — repeating them here would only re-prove the same two arms.
 */
describe('handleKeyDownImpl — caret scrolling', () => {
  for (const key of ['ArrowUp', 'ArrowDown']) {
    it(`scrolls the caret into view after ${key}`, () => {
      const ctx = makeCtx();
      const event = press(ctx, { key });

      expect(ctx.scrollCursorIntoView).toHaveBeenCalledTimes(1);
      // An arrow key is a navigation key: the handler must not claim it.
      expectInert(ctx, event);
    });
  }

  for (const key of ['ArrowLeft', 'ArrowRight']) {
    it(`does not scroll the caret after ${key}`, () => {
      const ctx = makeCtx();
      const event = press(ctx, { key });

      expect(ctx.scrollCursorIntoView).not.toHaveBeenCalled();
      expectInert(ctx, event);
    });
  }
});
