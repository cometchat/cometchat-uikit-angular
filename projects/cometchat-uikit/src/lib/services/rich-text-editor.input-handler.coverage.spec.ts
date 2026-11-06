import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  handleInputImpl,
  handleBeforeInputImpl,
  cleanupZeroWidthSpacesImpl,
  scrollCursorIntoViewImpl,
} from './rich-text-editor.input-handler';

/**
 * These four functions are the editor's input pipeline, extracted from
 * RichTextEditor so each one takes the editor as a plain `ctx` object. Driving
 * them directly with a stub ctx is what makes their DOM states reachable:
 * the real editor would need a live caret parked on an arbitrary node, a
 * scrollable ancestor with real layout, and a selection whose rectangles have
 * non-zero height — none of which jsdom provides. The stub supplies exactly
 * the accessors each function touches, so a wrong turn in the pipeline shows
 * up as a missing or extra call rather than as a silent pass.
 */

const ZWS = '​';

const attached: Element[] = [];

/** A contentEditable root attached to the document, torn down after each test. */
function buildHost(html = ''): HTMLDivElement {
  const host = document.createElement('div');
  // setAttribute rather than the IDL property: jsdom does not implement the
  // contentEditable setter, and the code under test only needs node identity.
  host.setAttribute('contenteditable', 'true');
  host.innerHTML = html;
  document.body.appendChild(host);
  attached.push(host);
  return host;
}

function attach<T extends Element>(element: T): T {
  document.body.appendChild(element);
  attached.push(element);
  return element;
}

/** The first text node in the subtree — the node a caret would really sit in. */
function firstText(root: Node): Text {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  return walker.nextNode() as Text;
}

/**
 * A stand-in for a DOM Selection. `handleInputImpl` reads only `rangeCount`
 * and `anchorNode`; `cleanupZeroWidthSpacesImpl` additionally takes the range
 * and, when it removed a ZWS, re-seats it. Spying on removeAllRanges/addRange
 * is how the "only restore when something changed" rule becomes observable.
 */
function stubSelection(opts: {
  rangeCount?: number;
  anchorNode?: Node | null;
  focusNode?: Node | null;
  range?: unknown;
} = {}): any {
  return {
    rangeCount: opts.rangeCount ?? 1,
    anchorNode: opts.anchorNode ?? null,
    focusNode: opts.focusNode ?? null,
    getRangeAt: vi.fn(() => opts.range),
    removeAllRanges: vi.fn(),
    addRange: vi.fn(),
  };
}

/**
 * A stand-in for a Range used by the ZWS cleanup. A real Range is deliberately
 * avoided here: assigning to `node.data` re-seats live ranges per the DOM spec,
 * which would overwrite the very offsets the cleanup just corrected and make
 * the assertion measure jsdom's range bookkeeping instead of this code.
 */
function stubRange(startContainer: Node, startOffset: number, endContainer: Node, endOffset: number): any {
  return {
    startContainer,
    startOffset,
    endContainer,
    endOffset,
    setStart: vi.fn(),
    setEnd: vi.fn(),
  };
}

/** A rectangle with just the fields the scroll maths reads. */
function rect(top: number, bottom: number, height = bottom - top): DOMRect {
  return { top, bottom, height, left: 0, right: 0, width: 0, x: 0, y: top, toJSON: () => ({}) } as DOMRect;
}

/** The editor as the input pipeline sees it: every collaborator is a spy. */
function makeCtx(host: HTMLDivElement, overrides: Record<string, unknown> = {}): any {
  const selection = stubSelection({ anchorNode: host.firstChild ?? null });
  const ctx: any = {
    contentEditable: host,
    justAppliedFormatting: false,
    destroyed: false,
    config: { enableFormatting: true },
    selectionManager: { getSelection: vi.fn(() => selection) },
    listManager: { isInList: vi.fn(() => false) },
    formatManager: { resetPendingEmptyFormats: vi.fn() },
    isInBlockquote: vi.fn(() => false),
    getCharacterOffset: vi.fn(() => 0),
    restoreCharacterOffset: vi.fn(),
    detectAndConvertMarkdown: vi.fn(() => false),
    detectAndConvertAutoList: vi.fn(() => false),
    getText: vi.fn(() => host.textContent ?? ''),
    updateFormatState: vi.fn(),
    scheduleCustomFormatters: vi.fn(),
    pushToHistory: vi.fn(),
    emitUpdate: vi.fn(),
    findMentionAncestor: vi.fn(() => null),
  };
  return Object.assign(ctx, overrides);
}

/**
 * `scrollCursorIntoViewImpl` defers its whole body to the next frame, so every
 * assertion about it needs the frame to run on demand.
 */
let frames: FrameRequestCallback[] = [];

function flushFrames(): void {
  const pending = frames;
  frames = [];
  pending.forEach((cb) => cb(0));
}

beforeEach(() => {
  frames = [];
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb: FrameRequestCallback) => {
    frames.push(cb);
    return frames.length;
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  frames = [];
  while (attached.length) {
    attached.pop()!.remove();
  }
  window.getSelection()?.removeAllRanges();
});

describe('handleInputImpl', () => {
  it('short-circuits the whole pipeline right after a formatting command', () => {
    const host = buildHost('<b>bold</b>');
    const ctx = makeCtx(host, { justAppliedFormatting: true });

    handleInputImpl(ctx);

    expect(ctx.justAppliedFormatting).toBe(false);
    expect(ctx.pushToHistory).toHaveBeenCalledTimes(1);
    expect(ctx.emitUpdate).toHaveBeenCalledTimes(1);
    // The flag exists so the formatter's own DOM edit is not re-analysed.
    expect(ctx.isInBlockquote).not.toHaveBeenCalled();
    expect(ctx.scheduleCustomFormatters).not.toHaveBeenCalled();
  });

  it('falls back to the document selection when the selection manager has none', () => {
    const host = buildHost('<code>ab</code>');
    const codeText = firstText(host.querySelector('code')!);
    const docSelection = window.getSelection()!;
    const live = document.createRange();
    live.setStart(codeText, 1);
    live.collapse(true);
    docSelection.removeAllRanges();
    docSelection.addRange(live);
    const ctx = makeCtx(host, { selectionManager: { getSelection: vi.fn(() => undefined) } });

    handleInputImpl(ctx);

    // Only the document selection knows the caret is inside <code>; reaching
    // the inline-code early return proves the fallback was consulted.
    expect(ctx.scheduleCustomFormatters).not.toHaveBeenCalled();
    expect(ctx.isInBlockquote).not.toHaveBeenCalled();
    expect(ctx.emitUpdate).toHaveBeenCalledTimes(1);
  });

  it('skips every DOM rewrite while the caret sits in an inline code element', () => {
    const host = buildHost('plain<code>a' + ZWS + 'b</code>');
    const code = host.querySelector('code')!;
    const ctx = makeCtx(host, {
      selectionManager: { getSelection: vi.fn(() => stubSelection({ anchorNode: firstText(code) })) },
    });

    handleInputImpl(ctx);

    expect(ctx.pushToHistory).toHaveBeenCalledTimes(1);
    expect(ctx.emitUpdate).toHaveBeenCalledTimes(1);
    expect(ctx.scheduleCustomFormatters).not.toHaveBeenCalled();
    expect(ctx.detectAndConvertMarkdown).not.toHaveBeenCalled();
    // The ZWS survives: the cleanup pass never ran.
    expect(code.textContent).toContain(ZWS);
  });

  it('treats a code element inside pre as a code block and keeps processing', () => {
    const host = buildHost('<pre><code>let x</code></pre>');
    const code = host.querySelector('code')!;
    const ctx = makeCtx(host, {
      selectionManager: { getSelection: vi.fn(() => stubSelection({ anchorNode: firstText(code) })) },
    });

    handleInputImpl(ctx);

    expect(ctx.scheduleCustomFormatters).toHaveBeenCalledTimes(1);
    expect(ctx.detectAndConvertMarkdown).toHaveBeenCalledTimes(1);
  });

  it('ignores a selection that reports no ranges', () => {
    const host = buildHost('<code>ab</code>');
    const ctx = makeCtx(host, {
      selectionManager: {
        getSelection: vi.fn(() => stubSelection({ rangeCount: 0, anchorNode: firstText(host) })),
      },
    });

    handleInputImpl(ctx);

    // No range means no caret to inspect, so the inline-code guard is skipped
    // and the full pipeline runs even though the anchor is inside <code>.
    expect(ctx.scheduleCustomFormatters).toHaveBeenCalledTimes(1);
  });

  it('stops after a markdown conversion', () => {
    const host = buildHost('**bold** ');
    const ctx = makeCtx(host, { detectAndConvertMarkdown: vi.fn(() => true) });

    handleInputImpl(ctx);

    expect(ctx.pushToHistory).toHaveBeenCalledTimes(1);
    expect(ctx.emitUpdate).toHaveBeenCalledTimes(1);
    expect(ctx.detectAndConvertAutoList).not.toHaveBeenCalled();
    expect(ctx.scheduleCustomFormatters).not.toHaveBeenCalled();
  });

  it('stops after an auto-list conversion', () => {
    const host = buildHost('1. first');
    const ctx = makeCtx(host, { detectAndConvertAutoList: vi.fn(() => true) });

    handleInputImpl(ctx);

    expect(ctx.detectAndConvertAutoList).toHaveBeenCalledTimes(1);
    expect(ctx.emitUpdate).toHaveBeenCalledTimes(1);
    expect(ctx.scheduleCustomFormatters).not.toHaveBeenCalled();
  });

  it('does not re-run auto-list detection when the caret is already in a list', () => {
    const host = buildHost('<ul><li>item</li></ul>');
    const autoList = vi.fn(() => true);
    const ctx = makeCtx(host, {
      listManager: { isInList: vi.fn(() => true) },
      detectAndConvertAutoList: autoList,
    });

    handleInputImpl(ctx);

    expect(autoList).not.toHaveBeenCalled();
    expect(ctx.scheduleCustomFormatters).toHaveBeenCalledTimes(1);
  });

  it('skips both detectors when formatting is disabled', () => {
    const host = buildHost('**bold** ');
    const ctx = makeCtx(host, { config: { enableFormatting: false } });

    handleInputImpl(ctx);

    expect(ctx.detectAndConvertMarkdown).not.toHaveBeenCalled();
    expect(ctx.listManager.isInList).not.toHaveBeenCalled();
    expect(ctx.scheduleCustomFormatters).toHaveBeenCalledTimes(1);
  });

  it('clears the editor and drops pending marks when the content is emptied', () => {
    // Whitespace-only rather than genuinely empty markup: `html` still trims to
    // '' and takes the same branch, but now the wipe is something the assertion
    // below can actually observe.
    const host = buildHost('   ');
    const ctx = makeCtx(host, { getText: vi.fn(() => '') });

    handleInputImpl(ctx);

    expect(host.innerHTML).toBe('');
    expect(ctx.formatManager.resetPendingEmptyFormats).toHaveBeenCalledTimes(1);
    expect(ctx.updateFormatState).toHaveBeenCalledTimes(1);
    expect(ctx.scheduleCustomFormatters).not.toHaveBeenCalled();
  });

  it('treats leftover line breaks as empty and wipes them', () => {
    const host = buildHost('<br><br>');
    const ctx = makeCtx(host, { getText: vi.fn(() => '') });

    handleInputImpl(ctx);

    expect(host.innerHTML).toBe('');
    expect(ctx.formatManager.resetPendingEmptyFormats).toHaveBeenCalledTimes(1);
    expect(ctx.scheduleCustomFormatters).not.toHaveBeenCalled();
  });

  it('wipes markup that renders no visible text at all', () => {
    const host = buildHost('<div><span></span></div>');
    const ctx = makeCtx(host, { getText: vi.fn(() => '') });

    handleInputImpl(ctx);

    expect(host.innerHTML).toBe('');
    expect(ctx.updateFormatState).toHaveBeenCalledTimes(1);
    expect(ctx.scheduleCustomFormatters).not.toHaveBeenCalled();
  });

  it('keeps markup that still renders visible text', () => {
    const host = buildHost('<div><span>kept</span></div>');
    // getText() excludes some nodes, so an empty getText() with visible markup
    // is a real state; the innerHTML check is the safety net that catches it.
    const ctx = makeCtx(host, { getText: vi.fn(() => '  ') });

    handleInputImpl(ctx);

    expect(host.innerHTML).toBe('<div><span>kept</span></div>');
    expect(ctx.updateFormatState).not.toHaveBeenCalled();
    expect(ctx.scheduleCustomFormatters).toHaveBeenCalledTimes(1);
  });

  it('still clears the editor when no format manager is attached', () => {
    const host = buildHost('<br>');
    const ctx = makeCtx(host, { getText: vi.fn(() => ''), formatManager: null });

    handleInputImpl(ctx);

    expect(host.innerHTML).toBe('');
    expect(ctx.updateFormatState).toHaveBeenCalledTimes(1);
    expect(ctx.emitUpdate).toHaveBeenCalledTimes(1);
  });

  it('restores the caret offset when formatting shifted it inside a blockquote', () => {
    const host = buildHost('<blockquote>quoted</blockquote>');
    const ctx = makeCtx(host, {
      isInBlockquote: vi.fn(() => true),
      getCharacterOffset: vi.fn().mockReturnValueOnce(5).mockReturnValueOnce(9),
    });

    handleInputImpl(ctx);

    expect(ctx.restoreCharacterOffset).toHaveBeenCalledWith(5);
  });

  it('leaves the caret alone when the blockquote offset did not move', () => {
    const host = buildHost('<blockquote>quoted</blockquote>');
    const ctx = makeCtx(host, {
      isInBlockquote: vi.fn(() => true),
      getCharacterOffset: vi.fn(() => 5),
    });

    handleInputImpl(ctx);

    expect(ctx.getCharacterOffset).toHaveBeenCalledTimes(2);
    expect(ctx.restoreCharacterOffset).not.toHaveBeenCalled();
  });

  it('does not probe the offset again when the blockquote offset was unknown', () => {
    const host = buildHost('<blockquote>quoted</blockquote>');
    const ctx = makeCtx(host, {
      isInBlockquote: vi.fn(() => true),
      getCharacterOffset: vi.fn(() => -1),
    });

    handleInputImpl(ctx);

    // -1 means "no offset could be computed" — re-reading it would be noise.
    expect(ctx.getCharacterOffset).toHaveBeenCalledTimes(1);
    expect(ctx.restoreCharacterOffset).not.toHaveBeenCalled();
  });

  it('never measures the caret offset outside a blockquote', () => {
    const host = buildHost('plain text');
    const ctx = makeCtx(host);

    handleInputImpl(ctx);

    expect(ctx.getCharacterOffset).not.toHaveBeenCalled();
    expect(ctx.restoreCharacterOffset).not.toHaveBeenCalled();
  });
});

describe('handleInputImpl link href syncing', () => {
  function linkAt(host: HTMLDivElement): HTMLAnchorElement {
    return host.querySelector('a')!;
  }

  it('rewrites a stale href when the visible text is a bare www URL', () => {
    const host = buildHost(
      '<a class="cometchat-rich-text__link" href="https://www.google.com">www.facebook.com</a>',
    );
    handleInputImpl(makeCtx(host));

    expect(linkAt(host).getAttribute('href')).toBe('https://www.facebook.com');
  });

  it('rewrites a stale href verbatim when the visible text carries a scheme', () => {
    const host = buildHost(
      '<a class="cometchat-rich-text__link" href="https://old.example.com/a">http://new.example.com/b</a>',
    );
    handleInputImpl(makeCtx(host));

    // Text that already has a scheme is used as-is — no https:// prefixing.
    expect(linkAt(host).getAttribute('href')).toBe('http://new.example.com/b');
  });

  it('does not touch the href when it already matches the visible text', () => {
    const host = buildHost(
      '<a class="cometchat-rich-text__link" href="https://example.com/a">https://example.com/a</a>',
    );
    const link = linkAt(host);
    const hrefSetter = vi.fn();
    Object.defineProperty(link, 'href', {
      get: () => 'https://example.com/a',
      set: hrefSetter,
      configurable: true,
    });

    handleInputImpl(makeCtx(host));

    expect(hrefSetter).not.toHaveBeenCalled();
  });

  it('skips an emptied link but keeps syncing the ones after it', () => {
    // An empty-texted link leaves its own href alone either way, so that alone
    // proves nothing. A second, syncable link behind it is what distinguishes
    // the `continue` from a `break` that would strand the rest of the list.
    const host = buildHost(
      '<a class="cometchat-rich-text__link" href="https://keep.example.com"></a>' +
        '<a class="cometchat-rich-text__link" href="https://stale.example.com">www.fresh.example.com</a>',
    );
    handleInputImpl(makeCtx(host, { getText: vi.fn(() => 'other text') }));

    const links = host.querySelectorAll('a');
    expect(links[0].getAttribute('href')).toBe('https://keep.example.com');
    expect(links[1].getAttribute('href')).toBe('https://www.fresh.example.com');
  });

  it('skips a link whose visible text is ordinary prose', () => {
    const host = buildHost(
      '<a class="cometchat-rich-text__link" href="https://keep.example.com">click here</a>',
    );
    handleInputImpl(makeCtx(host));

    expect(linkAt(host).getAttribute('href')).toBe('https://keep.example.com');
  });

  it('leaves links that the editor did not create', () => {
    const host = buildHost('<a href="https://www.google.com">www.facebook.com</a>');
    handleInputImpl(makeCtx(host));

    // Only links carrying the editor's own class are managed.
    expect(linkAt(host).getAttribute('href')).toBe('https://www.google.com');
  });
});

describe('handleBeforeInputImpl', () => {
  function inputEvent(): InputEvent {
    return { preventDefault: vi.fn() } as unknown as InputEvent;
  }

  it('does nothing when there is no selection', () => {
    const host = buildHost('text');
    const ctx = makeCtx(host, { selectionManager: { getSelection: vi.fn(() => null) } });
    const event = inputEvent();

    handleBeforeInputImpl(ctx, event);

    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(ctx.findMentionAncestor).not.toHaveBeenCalled();
  });

  it('does nothing when the selection reports no ranges', () => {
    const host = buildHost('text');
    const ctx = makeCtx(host, {
      selectionManager: { getSelection: vi.fn(() => stubSelection({ rangeCount: 0 })) },
    });
    const event = inputEvent();

    handleBeforeInputImpl(ctx, event);

    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(ctx.findMentionAncestor).not.toHaveBeenCalled();
  });

  it('blocks typing inside a mention', () => {
    const host = buildHost('<span class="mention">@amy</span>');
    const mention = host.firstElementChild!;
    // No collapsed/expanded set-up: returning at the mention check is exactly
    // what stops `range.collapsed` from ever being read.
    const range = document.createRange();
    range.selectNodeContents(mention);
    const ctx = makeCtx(host, {
      selectionManager: { getSelection: vi.fn(() => stubSelection({ range })) },
      findMentionAncestor: vi.fn(() => mention),
    });
    const event = inputEvent();

    handleBeforeInputImpl(ctx, event);

    expect(event.preventDefault).toHaveBeenCalledTimes(1);
    expect(ctx.findMentionAncestor).toHaveBeenCalledTimes(1);
  });

  it('allows typing at a collapsed caret outside any mention', () => {
    const host = buildHost('plain');
    const range = document.createRange();
    range.setStart(firstText(host), 3);
    range.collapse(true);
    const ctx = makeCtx(host, {
      selectionManager: { getSelection: vi.fn(() => stubSelection({ range })) },
    });
    const event = inputEvent();

    handleBeforeInputImpl(ctx, event);

    expect(event.preventDefault).not.toHaveBeenCalled();
    // A collapsed range has one end, so the far-end check is never needed.
    expect(ctx.findMentionAncestor).toHaveBeenCalledTimes(1);
  });

  it('blocks a replacement whose far end lands in a mention', () => {
    const host = buildHost('hi <span class="mention">@amy</span>');
    const mention = host.querySelector('span')!;
    const range = document.createRange();
    range.setStart(host.firstChild!, 0);
    range.setEnd(firstText(mention), 2);
    const ctx = makeCtx(host, {
      selectionManager: { getSelection: vi.fn(() => stubSelection({ range })) },
      findMentionAncestor: vi.fn((node: Node) => (node === host.firstChild ? null : mention)),
    });
    const event = inputEvent();

    handleBeforeInputImpl(ctx, event);

    expect(event.preventDefault).toHaveBeenCalledTimes(1);
    expect(ctx.findMentionAncestor).toHaveBeenNthCalledWith(2, range.endContainer);
  });

  it('allows a replacement that spans only plain text', () => {
    const host = buildHost('<span>one</span><span>two</span>');
    const range = document.createRange();
    range.setStart(firstText(host.children[0]), 0);
    range.setEnd(firstText(host.children[1]), 3);
    const ctx = makeCtx(host, {
      selectionManager: { getSelection: vi.fn(() => stubSelection({ range })) },
    });
    const event = inputEvent();

    handleBeforeInputImpl(ctx, event);

    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(ctx.findMentionAncestor).toHaveBeenCalledTimes(2);
  });
});

describe('cleanupZeroWidthSpacesImpl', () => {
  it('strips the ZWS and pulls both range ends back by the characters removed', () => {
    const host = buildHost('<code>a' + ZWS + 'b</code>');
    const text = firstText(host.querySelector('code')!);
    const range = stubRange(text, 3, text, 3);
    const selection = stubSelection({ range });
    const ctx = makeCtx(host, { selectionManager: { getSelection: vi.fn(() => selection) } });

    cleanupZeroWidthSpacesImpl(ctx);

    expect(text.data).toBe('ab');
    expect(range.setStart).toHaveBeenCalledWith(text, 2);
    expect(range.setEnd).toHaveBeenCalledWith(text, 2);
    expect(selection.removeAllRanges).toHaveBeenCalledTimes(1);
    expect(selection.addRange).toHaveBeenCalledWith(range);
  });

  it('leaves the range offsets alone when no ZWS precedes the caret', () => {
    const host = buildHost('<code>' + ZWS + 'ab</code>');
    const text = firstText(host.querySelector('code')!);
    const range = stubRange(text, 0, text, 0);
    const selection = stubSelection({ range });
    const ctx = makeCtx(host, { selectionManager: { getSelection: vi.fn(() => selection) } });

    cleanupZeroWidthSpacesImpl(ctx);

    expect(text.data).toBe('ab');
    expect(range.setStart).not.toHaveBeenCalled();
    expect(range.setEnd).not.toHaveBeenCalled();
    expect(selection.addRange).toHaveBeenCalledWith(range);
  });

  it('does not re-seat the selection when there was no ZWS to remove', () => {
    const host = buildHost('<code>ab</code>');
    const text = firstText(host.querySelector('code')!);
    const range = stubRange(text, 1, text, 1);
    const selection = stubSelection({ range });
    const ctx = makeCtx(host, { selectionManager: { getSelection: vi.fn(() => selection) } });

    cleanupZeroWidthSpacesImpl(ctx);

    expect(text.data).toBe('ab');
    // Re-seating an unchanged range is what used to throw the caret back to
    // the start of the code span on the second keystroke.
    expect(selection.removeAllRanges).not.toHaveBeenCalled();
    expect(selection.addRange).not.toHaveBeenCalled();
  });

  it('keeps the ZWS while the code span still holds a single real character', () => {
    const host = buildHost('<code>a' + ZWS + '</code>');
    const text = firstText(host.querySelector('code')!);
    const range = stubRange(text, 2, text, 2);
    const selection = stubSelection({ range });
    const ctx = makeCtx(host, { selectionManager: { getSelection: vi.fn(() => selection) } });

    cleanupZeroWidthSpacesImpl(ctx);

    // The placeholder has to survive keystroke one so the text node stays
    // stable until keystroke two.
    expect(text.data).toBe('a' + ZWS);
    expect(selection.removeAllRanges).not.toHaveBeenCalled();
  });

  it('steps over an empty code span and still cleans the next one', () => {
    // An empty span is the only way to reach the `textContent || ''` fallback.
    // Pairing it with a dirty span behind it is what makes the skip observable:
    // asserting an already-empty span is still empty would prove nothing.
    const host = buildHost('<code></code><code>a' + ZWS + 'b</code>');
    const [empty, dirty] = Array.from(host.querySelectorAll('code'));
    const text = firstText(dirty);
    const range = stubRange(text, 3, text, 3);
    const selection = stubSelection({ range });
    const ctx = makeCtx(host, { selectionManager: { getSelection: vi.fn(() => selection) } });

    cleanupZeroWidthSpacesImpl(ctx);

    expect(empty.childNodes.length).toBe(0);
    expect(text.data).toBe('ab');
    expect(selection.addRange).toHaveBeenCalledWith(range);
  });

  it('cleans a nested text node without disturbing a caret parked elsewhere', () => {
    const host = buildHost('<code>ab<i>' + ZWS + 'c</i></code>');
    const outer = host.querySelector('code')!.firstChild as Text;
    const inner = firstText(host.querySelector('i')!);
    const range = stubRange(outer, 1, outer, 1);
    const selection = stubSelection({ range });
    const ctx = makeCtx(host, { selectionManager: { getSelection: vi.fn(() => selection) } });

    cleanupZeroWidthSpacesImpl(ctx);

    expect(inner.data).toBe('c');
    expect(outer.data).toBe('ab');
    expect(range.setStart).not.toHaveBeenCalled();
    expect(range.setEnd).not.toHaveBeenCalled();
    expect(selection.addRange).toHaveBeenCalledWith(range);
  });

  it('still strips the ZWS from every text node when there is no selection', () => {
    const host = buildHost('<code>a' + ZWS + 'b<i>c' + ZWS + 'd</i></code>');
    const outer = host.querySelector('code')!.firstChild as Text;
    const inner = firstText(host.querySelector('i')!);
    const ctx = makeCtx(host, { selectionManager: { getSelection: vi.fn(() => null) } });

    cleanupZeroWidthSpacesImpl(ctx);

    // A null selection must not cut the walk short part-way through the span.
    expect(outer.data).toBe('ab');
    expect(inner.data).toBe('cd');
  });

  it('still strips the ZWS when the selection holds no range', () => {
    const host = buildHost('<code>a' + ZWS + 'b</code>');
    const text = firstText(host.querySelector('code')!);
    const selection = stubSelection({ rangeCount: 0 });
    const ctx = makeCtx(host, { selectionManager: { getSelection: vi.fn(() => selection) } });

    cleanupZeroWidthSpacesImpl(ctx);

    expect(text.data).toBe('ab');
    expect(selection.addRange).not.toHaveBeenCalled();
  });
});

describe('scrollCursorIntoViewImpl', () => {
  /**
   * A scrollable ancestor with the layout jsdom will not compute: overflow is
   * declared inline (which getComputedStyle does report) while scrollHeight,
   * clientHeight and scrollTop are installed as real accessors so the maths
   * has something to read and write.
   */
  function buildScrollContainer(opts: {
    overflowY?: string;
    scrollHeight?: number;
    clientHeight?: number;
    scrollTop?: number;
    containerRect?: DOMRect;
  } = {}) {
    const container = attach(document.createElement('div'));
    container.style.overflowY = opts.overflowY ?? 'auto';
    let scrollTop = opts.scrollTop ?? 50;
    Object.defineProperty(container, 'scrollHeight', { get: () => opts.scrollHeight ?? 600, configurable: true });
    Object.defineProperty(container, 'clientHeight', { get: () => opts.clientHeight ?? 200, configurable: true });
    Object.defineProperty(container, 'scrollTop', {
      get: () => scrollTop,
      set: (v: number) => { scrollTop = v; },
      configurable: true,
    });
    const containerRect = vi.fn(() => opts.containerRect ?? rect(100, 300));
    container.getBoundingClientRect = containerRect as unknown as () => DOMRect;
    return { container, containerRect, scrolled: () => scrollTop };
  }

  /** The editor content node, nested inside the given ancestor. */
  function nestInside(parent: HTMLElement, html = 'line of text'): HTMLDivElement {
    const host = document.createElement('div');
    host.innerHTML = html;
    parent.appendChild(host);
    return host;
  }

  function selectionWith(opts: {
    anchorNode?: Node | null;
    focusNode?: Node | null;
    cursorRect?: DOMRect;
    rangeCount?: number;
  }) {
    const collapse = vi.fn();
    const cloned = {
      collapse,
      getBoundingClientRect: vi.fn(() => opts.cursorRect ?? rect(0, 0, 0)),
    };
    return {
      rangeCount: opts.rangeCount ?? 1,
      anchorNode: opts.anchorNode ?? null,
      focusNode: opts.focusNode ?? null,
      getRangeAt: vi.fn(() => ({ cloneRange: vi.fn(() => cloned) })),
      collapse,
    };
  }

  it('does not look at the selection once the editor is destroyed', () => {
    const { container } = buildScrollContainer();
    const host = nestInside(container);
    const getSelection = vi.spyOn(window, 'getSelection');
    const ctx = makeCtx(host, { destroyed: true, contentEditable: host });

    scrollCursorIntoViewImpl(ctx);
    flushFrames();

    expect(getSelection).not.toHaveBeenCalled();
  });

  it('gives up when there is no selection', () => {
    const { container, containerRect } = buildScrollContainer();
    const host = nestInside(container);
    vi.spyOn(window, 'getSelection').mockReturnValue(null);

    scrollCursorIntoViewImpl(makeCtx(host, { contentEditable: host }));
    flushFrames();

    expect(containerRect).not.toHaveBeenCalled();
  });

  it('gives up when the selection holds no range', () => {
    const { container, containerRect } = buildScrollContainer();
    const host = nestInside(container);
    vi.spyOn(window, 'getSelection').mockReturnValue(
      selectionWith({ rangeCount: 0, anchorNode: firstText(host) }) as unknown as Selection,
    );

    scrollCursorIntoViewImpl(makeCtx(host, { contentEditable: host }));
    flushFrames();

    expect(containerRect).not.toHaveBeenCalled();
  });

  it('leaves the scroll position alone while the caret is inside a code element', () => {
    const { container, containerRect, scrolled } = buildScrollContainer();
    const host = nestInside(container, '<code>short</code>');
    const code = host.querySelector('code')!;
    vi.spyOn(window, 'getSelection').mockReturnValue(
      selectionWith({ anchorNode: firstText(code), cursorRect: rect(290, 310) }) as unknown as Selection,
    );

    scrollCursorIntoViewImpl(makeCtx(host, { contentEditable: host }));
    flushFrames();

    // Measuring rectangles around inline code is what destabilises the caret,
    // so the container is never even measured.
    expect(containerRect).not.toHaveBeenCalled();
    expect(scrolled()).toBe(50);
  });

  it('walks out of nested markup that is not a code element', () => {
    const { container, containerRect, scrolled } = buildScrollContainer();
    const host = nestInside(container, '<b><i>deep</i></b>');
    vi.spyOn(window, 'getSelection').mockReturnValue(
      selectionWith({
        anchorNode: firstText(host.querySelector('i')!),
        cursorRect: rect(290, 310),
      }) as unknown as Selection,
    );

    scrollCursorIntoViewImpl(makeCtx(host, { contentEditable: host }));
    flushFrames();

    expect(containerRect).toHaveBeenCalledTimes(1);
    expect(scrolled()).toBe(64);
  });

  it('survives a caret that is not inside the editor at all', () => {
    const { container, containerRect } = buildScrollContainer();
    const host = nestInside(container);
    const orphan = document.createTextNode('detached');
    vi.spyOn(window, 'getSelection').mockReturnValue(
      selectionWith({ anchorNode: orphan, cursorRect: rect(150, 170) }) as unknown as Selection,
    );

    scrollCursorIntoViewImpl(makeCtx(host, { contentEditable: host }));
    flushFrames();

    // The ancestor walk runs out of parents instead of hitting the editor root,
    // and the scroll check still happens.
    expect(containerRect).toHaveBeenCalledTimes(1);
  });

  it('does nothing when no ancestor scrolls', () => {
    const plain = attach(document.createElement('div'));
    const plainRect = vi.fn(() => rect(100, 300));
    plain.getBoundingClientRect = plainRect as unknown as () => DOMRect;
    const host = nestInside(plain);
    vi.spyOn(window, 'getSelection').mockReturnValue(
      selectionWith({ anchorNode: firstText(host), cursorRect: rect(290, 310) }) as unknown as Selection,
    );

    scrollCursorIntoViewImpl(makeCtx(host, { contentEditable: host }));
    flushFrames();

    expect(plainRect).not.toHaveBeenCalled();
  });

  it('does nothing when the scroll container is not actually overflowing', () => {
    const { container, containerRect } = buildScrollContainer({ scrollHeight: 200, clientHeight: 200 });
    const host = nestInside(container);
    vi.spyOn(window, 'getSelection').mockReturnValue(
      selectionWith({ anchorNode: firstText(host), cursorRect: rect(290, 310) }) as unknown as Selection,
    );

    scrollCursorIntoViewImpl(makeCtx(host, { contentEditable: host }));
    flushFrames();

    expect(containerRect).not.toHaveBeenCalled();
  });

  it('skips past a non-scrolling ancestor to find the scroller', () => {
    const { container, containerRect, scrolled } = buildScrollContainer({ overflowY: 'scroll' });
    const middle = document.createElement('div');
    middle.style.overflowY = 'visible';
    container.appendChild(middle);
    const host = nestInside(middle);
    vi.spyOn(window, 'getSelection').mockReturnValue(
      selectionWith({ anchorNode: firstText(host), cursorRect: rect(290, 310) }) as unknown as Selection,
    );

    scrollCursorIntoViewImpl(makeCtx(host, { contentEditable: host }));
    flushFrames();

    expect(containerRect).toHaveBeenCalledTimes(1);
    expect(scrolled()).toBe(64);
  });

  it('scrolls down by the overshoot plus padding when the caret is below the fold', () => {
    const { container, scrolled } = buildScrollContainer({ scrollTop: 50 });
    const host = nestInside(container);
    vi.spyOn(window, 'getSelection').mockReturnValue(
      selectionWith({ anchorNode: firstText(host), cursorRect: rect(290, 310) }) as unknown as Selection,
    );

    scrollCursorIntoViewImpl(makeCtx(host, { contentEditable: host }));
    flushFrames();

    // 310 - 300 + 4 of padding.
    expect(scrolled()).toBe(64);
  });

  it('scrolls up by the shortfall plus padding when the caret is above the fold', () => {
    const { container, scrolled } = buildScrollContainer({ scrollTop: 50 });
    const host = nestInside(container);
    vi.spyOn(window, 'getSelection').mockReturnValue(
      selectionWith({ anchorNode: firstText(host), cursorRect: rect(90, 110) }) as unknown as Selection,
    );

    scrollCursorIntoViewImpl(makeCtx(host, { contentEditable: host }));
    flushFrames();

    // 100 - 90 + 4 of padding, subtracted.
    expect(scrolled()).toBe(36);
  });

  it('holds the scroll position when the caret is already comfortably in view', () => {
    const { container, scrolled } = buildScrollContainer({ scrollTop: 50 });
    const host = nestInside(container);
    vi.spyOn(window, 'getSelection').mockReturnValue(
      selectionWith({ anchorNode: firstText(host), cursorRect: rect(150, 170) }) as unknown as Selection,
    );

    scrollCursorIntoViewImpl(makeCtx(host, { contentEditable: host }));
    flushFrames();

    expect(scrolled()).toBe(50);
  });

  it('measures the focused element when the caret rectangle has no height', () => {
    const { container, scrolled } = buildScrollContainer({ scrollTop: 50 });
    const host = nestInside(container, '<span>line</span>');
    const span = host.querySelector('span')!;
    span.getBoundingClientRect = vi.fn(() => rect(290, 310)) as unknown as () => DOMRect;
    vi.spyOn(window, 'getSelection').mockReturnValue(
      selectionWith({
        anchorNode: firstText(span),
        focusNode: span,
        cursorRect: rect(0, 0, 0),
      }) as unknown as Selection,
    );

    scrollCursorIntoViewImpl(makeCtx(host, { contentEditable: host }));
    flushFrames();

    // A zero-height rect at the origin would have scrolled up by 104 instead.
    expect(scrolled()).toBe(64);
  });

  it('measures the parent element when the caret sits in a text node', () => {
    const { container, scrolled } = buildScrollContainer({ scrollTop: 50 });
    const host = nestInside(container, '<span>line</span>');
    const span = host.querySelector('span')!;
    span.getBoundingClientRect = vi.fn(() => rect(90, 110)) as unknown as () => DOMRect;
    const caretText = firstText(span);
    vi.spyOn(window, 'getSelection').mockReturnValue(
      selectionWith({
        anchorNode: caretText,
        focusNode: caretText,
        cursorRect: rect(0, 0, 0),
      }) as unknown as Selection,
    );

    scrollCursorIntoViewImpl(makeCtx(host, { contentEditable: host }));
    flushFrames();

    expect(scrolled()).toBe(36);
  });

  it('falls back to the empty caret rectangle when there is no focus node', () => {
    const { container, scrolled } = buildScrollContainer({ scrollTop: 150 });
    const host = nestInside(container);
    vi.spyOn(window, 'getSelection').mockReturnValue(
      selectionWith({
        anchorNode: firstText(host),
        focusNode: null,
        cursorRect: rect(0, 0, 0),
      }) as unknown as Selection,
    );

    scrollCursorIntoViewImpl(makeCtx(host, { contentEditable: host }));
    flushFrames();

    // Nothing to measure, so the zero rect stands: it reads as above the
    // container top and scrolls up by 100 + 4.
    expect(scrolled()).toBe(46);
  });
});
