import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  isInBlockquoteImpl,
  shouldExitBlockquoteImpl,
  exitBlockquoteImpl,
  isInCodeBlockImpl,
  shouldExitCodeBlockImpl,
  exitCodeBlockImpl,
  shouldExitListImpl,
  getCurrentListItemImpl,
} from './rich-text-editor.block-exit';

/**
 * These helpers are standalone functions whose only contact with the editor is
 * the `ctx` they are handed: a `selectionManager.getSelection()` and the
 * `contentEditable` root that bounds every ancestor walk. Driving them directly
 * with a stub selection is what makes the DOM states below reachable — a real
 * `window.getSelection()` in jsdom cannot be parked on an arbitrary orphaned
 * node, and rendering the editor would pull in the whole SDK for nothing.
 */

const attached: Element[] = [];

/** A contentEditable root attached to the document, torn down after each test. */
function buildHost(html: string): HTMLDivElement {
  const host = document.createElement('div');
  // setAttribute rather than the IDL property: jsdom does not implement the
  // contentEditable setter, and the code under test only needs the node identity.
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

afterEach(() => {
  while (attached.length) {
    attached.pop()!.remove();
  }
});

/** A collapsed range, which is what a caret is. */
function caretAt(node: Node, offset: number): Range {
  const range = document.createRange();
  range.setStart(node, offset);
  range.collapse(true);
  return range;
}

/**
 * Omitting `range` is deliberate in tests that expect an early `return true`:
 * if the code ever falls through to the caret fallback, this throws instead of
 * quietly handing back a stand-in, so the assertion cannot pass by accident.
 */
function stubSelection(anchorNode: Node | null, range?: Range) {
  return {
    rangeCount: 1,
    anchorNode,
    getRangeAt: vi.fn((index: number) => {
      if (!range) {
        throw new Error(`getRangeAt(${index}) reached, but this test expected an earlier return`);
      }
      return range;
    }),
    removeAllRanges: vi.fn(() => undefined),
    addRange: vi.fn((_range: Range) => undefined),
  };
}

/** A selection object that exists but holds no range — e.g. after a blur. */
function rangelessSelection(anchorNode: Node | null) {
  const selection = stubSelection(anchorNode);
  selection.rangeCount = 0;
  return selection;
}

function ctxFor(contentEditable: Node, selection: unknown) {
  return { contentEditable, selectionManager: { getSelection: () => selection } };
}

/** The range the implementation handed to `addRange`. */
function placedRange(selection: ReturnType<typeof stubSelection>): Range {
  expect(selection.addRange).toHaveBeenCalledTimes(1);
  return selection.addRange.mock.calls[0][0];
}

describe('rich-text-editor.block-exit', () => {
  describe('isInBlockquoteImpl', () => {
    it('reports false when the selection manager has no selection at all', () => {
      const host = buildHost('<blockquote>quoted</blockquote>');

      expect(isInBlockquoteImpl(ctxFor(host, null))).toBe(false);
    });

    it('reports false when a selection exists but holds no range', () => {
      const host = buildHost('<blockquote>quoted</blockquote>');
      const quote = host.querySelector('blockquote')!;

      // The anchor is inside the blockquote, so only the rangeCount guard can
      // produce false here.
      expect(isInBlockquoteImpl(ctxFor(host, rangelessSelection(quote.firstChild)))).toBe(false);
    });

    it('reports true when the caret sits in a text node inside a blockquote', () => {
      const host = buildHost('<blockquote>quoted</blockquote>');
      const quote = host.querySelector('blockquote')!;

      expect(isInBlockquoteImpl(ctxFor(host, stubSelection(quote.firstChild)))).toBe(true);
    });

    it('reports true when the anchor is the blockquote element itself', () => {
      const host = buildHost('<blockquote>quoted</blockquote>');

      expect(isInBlockquoteImpl(ctxFor(host, stubSelection(host.querySelector('blockquote'))))).toBe(true);
    });

    it('reports true from deep inside nested inline markup', () => {
      const host = buildHost('<blockquote><p><strong>deep</strong></p></blockquote>');
      const deepText = host.querySelector('strong')!.firstChild!;

      expect(isInBlockquoteImpl(ctxFor(host, stubSelection(deepText)))).toBe(true);
    });

    it('reports false when the walk reaches the editor root without meeting a blockquote', () => {
      const host = buildHost('<p>plain <em>text</em></p>');
      const text = host.querySelector('em')!.firstChild!;

      expect(isInBlockquoteImpl(ctxFor(host, stubSelection(text)))).toBe(false);
    });

    it('reports false when the anchor is detached, so the walk runs off the top', () => {
      const host = buildHost('<p>plain</p>');
      // Never attached and never under `host`, and holding no blockquote of its
      // own, so the walk ends at a null parent rather than at the editor root.
      const orphan = document.createElement('div');
      orphan.innerHTML = '<p>stale</p>';
      const staleText = orphan.querySelector('p')!.firstChild!;

      expect(isInBlockquoteImpl(ctxFor(host, stubSelection(staleText)))).toBe(false);
    });

    it('ignores a blockquote that wraps the editor root rather than editor content', () => {
      const outer = attach(document.createElement('blockquote'));
      const editorRoot = document.createElement('div');
      editorRoot.innerHTML = '<p>text</p>';
      outer.appendChild(editorRoot);
      const text = editorRoot.querySelector('p')!.firstChild!;

      // Page markup around the editor must not count as editor formatting.
      expect(isInBlockquoteImpl(ctxFor(editorRoot, stubSelection(text)))).toBe(false);
    });
  });

  describe('shouldExitBlockquoteImpl', () => {
    it('reports false when there is no selection', () => {
      const host = buildHost('<blockquote>quoted<br><br></blockquote>');

      expect(shouldExitBlockquoteImpl(ctxFor(host, null))).toBe(false);
    });

    it('reports false when the selection holds no range', () => {
      const host = buildHost('<blockquote>quoted<br><br></blockquote>');
      const quote = host.querySelector('blockquote')!;

      // Two trailing <br> would otherwise say "exit"; the guard wins.
      expect(shouldExitBlockquoteImpl(ctxFor(host, rangelessSelection(quote.firstChild)))).toBe(false);
    });

    it('reports false when the caret is not inside any blockquote', () => {
      const host = buildHost('<p>plain</p>');
      const text = host.querySelector('p')!.firstChild!;

      expect(shouldExitBlockquoteImpl(ctxFor(host, stubSelection(text)))).toBe(false);
    });

    it('reports false when the anchor is detached from the editor root', () => {
      const host = buildHost('<p>plain</p>');
      const orphan = document.createElement('span');
      orphan.textContent = 'stale';

      expect(shouldExitBlockquoteImpl(ctxFor(host, stubSelection(orphan.firstChild)))).toBe(false);
    });

    it('reports true on two trailing <br> elements', () => {
      const host = buildHost('<blockquote>quoted<br><br></blockquote>');
      const quote = host.querySelector('blockquote')!;

      expect(shouldExitBlockquoteImpl(ctxFor(host, stubSelection(quote.firstChild)))).toBe(true);
    });

    it('reports true when the anchor is the blockquote element itself', () => {
      const host = buildHost('<blockquote>quoted<br><br></blockquote>');

      expect(shouldExitBlockquoteImpl(ctxFor(host, stubSelection(host.querySelector('blockquote'))))).toBe(true);
    });

    it('does not exit on a single trailing <br>', () => {
      const host = buildHost('<blockquote>quoted<br></blockquote>');
      const quote = host.querySelector('blockquote')!;
      const selection = stubSelection(quote.firstChild, caretAt(quote, 0));

      expect(shouldExitBlockquoteImpl(ctxFor(host, selection))).toBe(false);
    });

    it('counts an empty <p> as a blank line alongside a <br>', () => {
      const host = buildHost('<blockquote>quoted<p></p><br></blockquote>');
      const quote = host.querySelector('blockquote')!;

      expect(shouldExitBlockquoteImpl(ctxFor(host, stubSelection(quote.firstChild)))).toBe(true);
    });

    it('counts two empty <div> elements as two blank lines', () => {
      const host = buildHost('<blockquote>quoted<div></div><div></div></blockquote>');
      const quote = host.querySelector('blockquote')!;

      expect(shouldExitBlockquoteImpl(ctxFor(host, stubSelection(quote.firstChild)))).toBe(true);
    });

    it('stops counting at a trailing element that is neither <br> nor a blank block', () => {
      const host = buildHost('<blockquote>quoted<br><span>tail</span></blockquote>');
      const quote = host.querySelector('blockquote')!;
      const selection = stubSelection(quote.firstChild, caretAt(quote, 0));

      // The <span> ends the scan, so the one <br> behind it is never reached.
      expect(shouldExitBlockquoteImpl(ctxFor(host, selection))).toBe(false);
    });

    it('stops counting at a trailing <p> that still holds text', () => {
      const host = buildHost('<blockquote><br><br><p>tail</p></blockquote>');
      const quote = host.querySelector('blockquote')!;
      const selection = stubSelection(quote, caretAt(quote, 0));

      // A non-blank <p> ends the scan even though two <br> sit behind it.
      expect(shouldExitBlockquoteImpl(ctxFor(host, selection))).toBe(false);
    });

    it('handles an entirely empty blockquote, which has no last child to scan', () => {
      const host = buildHost('<blockquote></blockquote>');
      const quote = host.querySelector('blockquote')!;
      const selection = stubSelection(quote, caretAt(quote, 0));

      expect(shouldExitBlockquoteImpl(ctxFor(host, selection))).toBe(false);
    });

    it('reports true on two trailing newlines inside the text itself', () => {
      const host = buildHost('<blockquote></blockquote>');
      const quote = host.querySelector('blockquote')!;
      const text = document.createTextNode('quoted\n\n');
      quote.appendChild(text);

      expect(shouldExitBlockquoteImpl(ctxFor(host, stubSelection(text)))).toBe(true);
    });

    it('does not exit on a single trailing newline in the text', () => {
      const host = buildHost('<blockquote></blockquote>');
      const quote = host.querySelector('blockquote')!;
      const text = document.createTextNode('quoted\n');
      quote.appendChild(text);
      const selection = stubSelection(text, caretAt(quote, 0));

      expect(shouldExitBlockquoteImpl(ctxFor(host, selection))).toBe(false);
    });

    it('stops counting at trailing text that ends in a normal character', () => {
      const host = buildHost('<blockquote><br><br>quoted</blockquote>');
      const quote = host.querySelector('blockquote')!;
      const selection = stubSelection(quote, caretAt(quote, 0));

      // The text ends the scan, so the two <br> behind it are never reached.
      expect(shouldExitBlockquoteImpl(ctxFor(host, selection))).toBe(false);
    });

    it('skips a blank trailing text node and keeps counting the <br> behind it', () => {
      const host = buildHost('<blockquote>quoted<br><br></blockquote>');
      const quote = host.querySelector('blockquote')!;
      quote.appendChild(document.createTextNode('   '));

      expect(shouldExitBlockquoteImpl(ctxFor(host, stubSelection(quote.firstChild)))).toBe(true);
    });

    it('falls back to an empty string when a trailing text node reports empty textContent', () => {
      const host = buildHost('<blockquote>quoted<br><br></blockquote>');
      const quote = host.querySelector('blockquote')!;
      // textContent is '' — falsy, so the scan takes the `|| ''` fallback
      // rather than the node's own value — then trims to blank and is skipped.
      quote.appendChild(document.createTextNode(''));

      expect(shouldExitBlockquoteImpl(ctxFor(host, stubSelection(quote.firstChild)))).toBe(true);
    });

    it('treats a whitespace-only newline text node as blank rather than as two line breaks', () => {
      const host = buildHost('<blockquote></blockquote>');
      const quote = host.querySelector('blockquote')!;
      quote.appendChild(document.createTextNode('quoted'));
      quote.appendChild(document.createElement('br'));
      quote.appendChild(document.createTextNode('\n\n'));
      const selection = stubSelection(quote, caretAt(quote, 0));

      // The "\n\n" node trims to empty, so it is skipped outright and its two
      // newlines are not counted — only the single <br> behind it is.
      expect(shouldExitBlockquoteImpl(ctxFor(host, selection))).toBe(false);
    });

    it('stops counting at a trailing comment node', () => {
      const host = buildHost('<blockquote><br><br>quoted</blockquote>');
      const quote = host.querySelector('blockquote')!;
      quote.appendChild(document.createComment('marker'));
      const selection = stubSelection(quote, caretAt(quote, 0));

      expect(shouldExitBlockquoteImpl(ctxFor(host, selection))).toBe(false);
    });

    it('reports true when the caret sits directly after a newline', () => {
      const host = buildHost('<blockquote></blockquote>');
      const quote = host.querySelector('blockquote')!;
      const text = document.createTextNode('line1\nline2');
      quote.appendChild(text);
      const selection = stubSelection(text, caretAt(text, 6));

      expect(shouldExitBlockquoteImpl(ctxFor(host, selection))).toBe(true);
    });

    it('reports false when the caret sits at the very start of the text', () => {
      const host = buildHost('<blockquote></blockquote>');
      const quote = host.querySelector('blockquote')!;
      const text = document.createTextNode('\nline2');
      quote.appendChild(text);
      const selection = stubSelection(text, caretAt(text, 0));

      // There is no character before the caret to inspect.
      expect(shouldExitBlockquoteImpl(ctxFor(host, selection))).toBe(false);
    });

    it('reports false when the character before the caret is not a newline', () => {
      const host = buildHost('<blockquote></blockquote>');
      const quote = host.querySelector('blockquote')!;
      const text = document.createTextNode('line1\nline2');
      quote.appendChild(text);
      const selection = stubSelection(text, caretAt(text, 3));

      expect(shouldExitBlockquoteImpl(ctxFor(host, selection))).toBe(false);
    });

    it('falls back to an empty string when the caret text node reports empty textContent', () => {
      const host = buildHost('<blockquote>quoted</blockquote>');
      const quote = host.querySelector('blockquote')!;
      const empty = document.createTextNode('');
      quote.appendChild(empty);
      // The range starts in a text node whose textContent is '' — falsy, so the
      // caret check reads the `|| ''` fallback instead.
      const selection = stubSelection(quote.firstChild, caretAt(empty, 0));

      expect(shouldExitBlockquoteImpl(ctxFor(host, selection))).toBe(false);
    });

    it('reports false when the range starts on an element instead of a text node', () => {
      const host = buildHost('<blockquote>quoted</blockquote>');
      const quote = host.querySelector('blockquote')!;
      const selection = stubSelection(quote.firstChild, caretAt(quote, 1));

      expect(shouldExitBlockquoteImpl(ctxFor(host, selection))).toBe(false);
    });
  });

  describe('exitBlockquoteImpl', () => {
    it('does nothing when there is no selection', () => {
      const host = buildHost('<blockquote>quoted</blockquote>');

      exitBlockquoteImpl(ctxFor(host, null));

      expect(host.querySelector('br')).toBeNull();
      expect(host.innerHTML).toBe('<blockquote>quoted</blockquote>');
    });

    it('does nothing when the selection holds no range', () => {
      const host = buildHost('<blockquote>quoted</blockquote>');
      const quote = host.querySelector('blockquote')!;
      const selection = rangelessSelection(quote.firstChild);

      exitBlockquoteImpl(ctxFor(host, selection));

      expect(host.querySelector('br')).toBeNull();
      expect(selection.removeAllRanges).not.toHaveBeenCalled();
    });

    it('does nothing when the caret is not inside a blockquote', () => {
      const host = buildHost('<p>plain</p>');
      const text = host.querySelector('p')!.firstChild!;
      const selection = stubSelection(text);

      exitBlockquoteImpl(ctxFor(host, selection));

      expect(host.querySelector('br')).toBeNull();
      expect(selection.addRange).not.toHaveBeenCalled();
    });

    it('does nothing when the anchor is detached from the editor root', () => {
      const host = buildHost('<p>plain</p>');
      const orphan = document.createElement('span');
      orphan.textContent = 'stale';
      const selection = stubSelection(orphan.firstChild);

      exitBlockquoteImpl(ctxFor(host, selection));

      expect(host.querySelector('br')).toBeNull();
      expect(selection.addRange).not.toHaveBeenCalled();
    });

    it('inserts the escape <br> between the blockquote and what follows it', () => {
      const host = buildHost('<p>before</p><blockquote>quoted</blockquote><span>after</span>');
      const quote = host.querySelector('blockquote')!;
      const after = host.querySelector('span')!;
      const selection = stubSelection(quote.firstChild);

      exitBlockquoteImpl(ctxFor(host, selection));

      const br = host.querySelector('br')!;
      expect(br.parentNode).toBe(host);
      expect(quote.nextSibling).toBe(br);
      expect(br.nextSibling).toBe(after);
      expect(quote.querySelector('br')).toBeNull();

      const range = placedRange(selection);
      expect(selection.removeAllRanges).toHaveBeenCalledTimes(1);
      expect(range.startContainer).toBe(host);
      expect(range.startOffset).toBe(2);
      expect(range.collapsed).toBe(true);
    });

    it('appends the escape <br> when the blockquote is the last child', () => {
      const host = buildHost('<blockquote>quoted</blockquote>');
      const quote = host.querySelector('blockquote')!;
      const selection = stubSelection(quote.firstChild);

      exitBlockquoteImpl(ctxFor(host, selection));

      const br = host.querySelector('br')!;
      expect(host.lastChild).toBe(br);
      expect(br.parentNode).toBe(host);
      expect(quote.querySelector('br')).toBeNull();

      const range = placedRange(selection);
      expect(range.startContainer).toBe(host);
      expect(range.startOffset).toBe(1);
      expect(range.collapsed).toBe(true);
    });

    it('works when the anchor is the blockquote element itself', () => {
      const host = buildHost('<blockquote>quoted</blockquote>');
      const quote = host.querySelector('blockquote')!;
      const selection = stubSelection(quote);

      exitBlockquoteImpl(ctxFor(host, selection));

      expect(quote.nextSibling).toBe(host.querySelector('br'));
      expect(placedRange(selection).startOffset).toBe(1);
    });

    it('escapes only the innermost blockquote when they are nested', () => {
      const host = buildHost('<blockquote id="outer">outer<blockquote id="inner">inner</blockquote></blockquote>');
      const outer = host.querySelector('#outer')!;
      const inner = host.querySelector('#inner')!;
      const selection = stubSelection(inner.firstChild);

      exitBlockquoteImpl(ctxFor(host, selection));

      const br = host.querySelector('br')!;
      // The caret lands in the outer quote, still quoted one level deep.
      expect(br.parentNode).toBe(outer);
      expect(inner.nextSibling).toBe(br);

      const range = placedRange(selection);
      expect(range.startContainer).toBe(outer);
      expect(range.startOffset).toBe(2);
    });

    it('throws and leaves the selection alone when the blockquote has no parent', () => {
      const host = buildHost('');
      const orphan = document.createElement('blockquote');
      orphan.textContent = 'quoted';
      const selection = stubSelection(orphan.firstChild);

      // The optional-chained insert silently no-ops on a null parent, then the
      // non-null assertion on the new <br>'s parent dereferences null.
      expect(() => exitBlockquoteImpl(ctxFor(host, selection))).toThrow(TypeError);
      expect(selection.removeAllRanges).not.toHaveBeenCalled();
      expect(selection.addRange).not.toHaveBeenCalled();
    });
  });

  describe('isInCodeBlockImpl', () => {
    it('reports false when the selection manager has no selection at all', () => {
      const host = buildHost('<pre>code</pre>');

      expect(isInCodeBlockImpl(ctxFor(host, null))).toBe(false);
    });

    it('reports false when a selection exists but holds no range', () => {
      const host = buildHost('<pre>code</pre>');
      const pre = host.querySelector('pre')!;

      expect(isInCodeBlockImpl(ctxFor(host, rangelessSelection(pre.firstChild)))).toBe(false);
    });

    it('reports true when the caret sits in a text node inside a <pre>', () => {
      const host = buildHost('<pre>code</pre>');
      const pre = host.querySelector('pre')!;

      expect(isInCodeBlockImpl(ctxFor(host, stubSelection(pre.firstChild)))).toBe(true);
    });

    it('reports true when the anchor is the <pre> element itself', () => {
      const host = buildHost('<pre>code</pre>');

      expect(isInCodeBlockImpl(ctxFor(host, stubSelection(host.querySelector('pre'))))).toBe(true);
    });

    it('reports true from inside a nested <code> element', () => {
      const host = buildHost('<pre><code>deep</code></pre>');
      const deepText = host.querySelector('code')!.firstChild!;

      expect(isInCodeBlockImpl(ctxFor(host, stubSelection(deepText)))).toBe(true);
    });

    it('reports false when the walk reaches the editor root without meeting a <pre>', () => {
      const host = buildHost('<p>plain <code>inline</code></p>');
      const text = host.querySelector('code')!.firstChild!;

      // Inline <code> outside a <pre> is not a code block.
      expect(isInCodeBlockImpl(ctxFor(host, stubSelection(text)))).toBe(false);
    });

    it('reports false when the anchor is detached, so the walk runs off the top', () => {
      const host = buildHost('<p>plain</p>');
      // No <pre> above the anchor, so the walk ends at a null parent.
      const orphan = document.createElement('div');
      orphan.textContent = 'stale';

      expect(isInCodeBlockImpl(ctxFor(host, stubSelection(orphan.firstChild)))).toBe(false);
    });

    it('ignores a <pre> that wraps the editor root rather than editor content', () => {
      const outer = attach(document.createElement('pre'));
      const editorRoot = document.createElement('div');
      editorRoot.innerHTML = '<p>text</p>';
      outer.appendChild(editorRoot);
      const text = editorRoot.querySelector('p')!.firstChild!;

      expect(isInCodeBlockImpl(ctxFor(editorRoot, stubSelection(text)))).toBe(false);
    });
  });

  describe('shouldExitCodeBlockImpl', () => {
    it('reports false when there is no selection', () => {
      const host = buildHost('<pre></pre>');
      host.querySelector('pre')!.textContent = 'code\n\n';

      expect(shouldExitCodeBlockImpl(ctxFor(host, null))).toBe(false);
    });

    it('reports false when the selection holds no range', () => {
      const host = buildHost('<pre></pre>');
      const pre = host.querySelector('pre')!;
      pre.textContent = 'code\n\n';

      // Two trailing newlines would otherwise say "exit"; the guard wins.
      expect(shouldExitCodeBlockImpl(ctxFor(host, rangelessSelection(pre.firstChild)))).toBe(false);
    });

    it('reports false when the caret is not inside any code block', () => {
      const host = buildHost('<p>plain</p>');
      const text = host.querySelector('p')!.firstChild!;

      expect(shouldExitCodeBlockImpl(ctxFor(host, stubSelection(text)))).toBe(false);
    });

    it('reports false when the anchor is detached from the editor root', () => {
      const host = buildHost('<p>plain</p>');
      const orphan = document.createElement('span');
      orphan.textContent = 'stale';

      expect(shouldExitCodeBlockImpl(ctxFor(host, stubSelection(orphan.firstChild)))).toBe(false);
    });

    it('reports true on two trailing newlines', () => {
      const host = buildHost('<pre></pre>');
      const pre = host.querySelector('pre')!;
      pre.textContent = 'code\n\n';

      expect(shouldExitCodeBlockImpl(ctxFor(host, stubSelection(pre.firstChild)))).toBe(true);
    });

    it('reports true when the anchor is the <pre> element itself', () => {
      const host = buildHost('<pre></pre>');
      const pre = host.querySelector('pre')!;
      pre.textContent = 'code\n\n';

      expect(shouldExitCodeBlockImpl(ctxFor(host, stubSelection(pre)))).toBe(true);
    });

    it('counts trailing whitespace of any kind, not only newlines', () => {
      const host = buildHost('<pre></pre>');
      const pre = host.querySelector('pre')!;
      pre.textContent = 'code  ';

      // trimEnd() strips spaces too, so two trailing spaces read as two breaks.
      expect(shouldExitCodeBlockImpl(ctxFor(host, stubSelection(pre.firstChild)))).toBe(true);
    });

    it('does not exit on a single trailing newline', () => {
      const host = buildHost('<pre></pre>');
      const pre = host.querySelector('pre')!;
      pre.textContent = 'code\n';
      const selection = stubSelection(pre.firstChild, caretAt(pre, 0));

      expect(shouldExitCodeBlockImpl(ctxFor(host, selection))).toBe(false);
    });

    it('does not exit for an entirely empty code block', () => {
      const host = buildHost('<pre></pre>');
      const pre = host.querySelector('pre')!;
      const selection = stubSelection(pre, caretAt(pre, 0));

      expect(shouldExitCodeBlockImpl(ctxFor(host, selection))).toBe(false);
    });

    it('reports true when the caret sits directly after a newline', () => {
      const host = buildHost('<pre></pre>');
      const pre = host.querySelector('pre')!;
      const text = document.createTextNode('line1\nline2');
      pre.appendChild(text);
      const selection = stubSelection(text, caretAt(text, 6));

      expect(shouldExitCodeBlockImpl(ctxFor(host, selection))).toBe(true);
    });

    it('reports false when the caret sits at the very start of the text', () => {
      const host = buildHost('<pre></pre>');
      const pre = host.querySelector('pre')!;
      const text = document.createTextNode('\nline2');
      pre.appendChild(text);
      const selection = stubSelection(text, caretAt(text, 0));

      expect(shouldExitCodeBlockImpl(ctxFor(host, selection))).toBe(false);
    });

    it('reports false when the character before the caret is not a newline', () => {
      const host = buildHost('<pre></pre>');
      const pre = host.querySelector('pre')!;
      const text = document.createTextNode('line1\nline2');
      pre.appendChild(text);
      const selection = stubSelection(text, caretAt(text, 3));

      expect(shouldExitCodeBlockImpl(ctxFor(host, selection))).toBe(false);
    });

    it('falls back to an empty string when the caret text node reports empty textContent', () => {
      const host = buildHost('<pre></pre>');
      const pre = host.querySelector('pre')!;
      pre.textContent = 'code';
      const empty = document.createTextNode('');
      pre.appendChild(empty);
      // textContent '' is falsy, so the caret check reads the `|| ''` fallback.
      const selection = stubSelection(pre.firstChild, caretAt(empty, 0));

      expect(shouldExitCodeBlockImpl(ctxFor(host, selection))).toBe(false);
    });

    it('reports false when the range starts on an element instead of a text node', () => {
      const host = buildHost('<pre></pre>');
      const pre = host.querySelector('pre')!;
      pre.textContent = 'code';
      const selection = stubSelection(pre.firstChild, caretAt(pre, 1));

      expect(shouldExitCodeBlockImpl(ctxFor(host, selection))).toBe(false);
    });
  });

  describe('exitCodeBlockImpl', () => {
    it('does nothing when there is no selection', () => {
      const host = buildHost('<pre>code</pre>');

      exitCodeBlockImpl(ctxFor(host, null));

      expect(host.querySelector('br')).toBeNull();
      expect(host.innerHTML).toBe('<pre>code</pre>');
    });

    it('does nothing when the selection holds no range', () => {
      const host = buildHost('<pre>code</pre>');
      const pre = host.querySelector('pre')!;
      const selection = rangelessSelection(pre.firstChild);

      exitCodeBlockImpl(ctxFor(host, selection));

      expect(host.querySelector('br')).toBeNull();
      expect(selection.removeAllRanges).not.toHaveBeenCalled();
    });

    it('does nothing when the caret is not inside a code block', () => {
      const host = buildHost('<p>plain</p>');
      const text = host.querySelector('p')!.firstChild!;
      const selection = stubSelection(text);

      exitCodeBlockImpl(ctxFor(host, selection));

      expect(host.querySelector('br')).toBeNull();
      expect(selection.addRange).not.toHaveBeenCalled();
    });

    it('does nothing when the anchor is detached from the editor root', () => {
      const host = buildHost('<p>plain</p>');
      const orphan = document.createElement('span');
      orphan.textContent = 'stale';
      const selection = stubSelection(orphan.firstChild);

      exitCodeBlockImpl(ctxFor(host, selection));

      expect(host.querySelector('br')).toBeNull();
      expect(selection.addRange).not.toHaveBeenCalled();
    });

    it('inserts the escape <br> between the code block and what follows it', () => {
      const host = buildHost('<p>before</p><pre>code</pre><span>after</span>');
      const pre = host.querySelector('pre')!;
      const after = host.querySelector('span')!;
      const selection = stubSelection(pre.firstChild);

      exitCodeBlockImpl(ctxFor(host, selection));

      const br = host.querySelector('br')!;
      expect(br.parentNode).toBe(host);
      expect(pre.nextSibling).toBe(br);
      expect(br.nextSibling).toBe(after);
      expect(pre.querySelector('br')).toBeNull();

      const range = placedRange(selection);
      expect(selection.removeAllRanges).toHaveBeenCalledTimes(1);
      expect(range.startContainer).toBe(host);
      expect(range.startOffset).toBe(2);
      expect(range.collapsed).toBe(true);
    });

    it('appends the escape <br> when the code block is the last child', () => {
      const host = buildHost('<pre>code</pre>');
      const pre = host.querySelector('pre')!;
      const selection = stubSelection(pre.firstChild);

      exitCodeBlockImpl(ctxFor(host, selection));

      const br = host.querySelector('br')!;
      expect(host.lastChild).toBe(br);
      expect(br.parentNode).toBe(host);
      expect(pre.querySelector('br')).toBeNull();

      const range = placedRange(selection);
      expect(range.startContainer).toBe(host);
      expect(range.startOffset).toBe(1);
      expect(range.collapsed).toBe(true);
    });

    it('works when the anchor is the <pre> element itself', () => {
      const host = buildHost('<pre>code</pre>');
      const pre = host.querySelector('pre')!;
      const selection = stubSelection(pre);

      exitCodeBlockImpl(ctxFor(host, selection));

      expect(pre.nextSibling).toBe(host.querySelector('br'));
      expect(placedRange(selection).startOffset).toBe(1);
    });

    it('escapes to the <pre> parent when the caret is inside a nested <code>', () => {
      const host = buildHost('<div id="wrap"><pre><code>code</code></pre></div>');
      const wrap = host.querySelector('#wrap')!;
      const pre = host.querySelector('pre')!;
      const selection = stubSelection(host.querySelector('code')!.firstChild);

      exitCodeBlockImpl(ctxFor(host, selection));

      const br = host.querySelector('br')!;
      expect(br.parentNode).toBe(wrap);
      expect(pre.nextSibling).toBe(br);
      expect(pre.querySelector('br')).toBeNull();

      const range = placedRange(selection);
      expect(range.startContainer).toBe(wrap);
      expect(range.startOffset).toBe(1);
    });

    it('throws and leaves the selection alone when the code block has no parent', () => {
      const host = buildHost('');
      const orphan = document.createElement('pre');
      orphan.textContent = 'code';
      const selection = stubSelection(orphan.firstChild);

      expect(() => exitCodeBlockImpl(ctxFor(host, selection))).toThrow(TypeError);
      expect(selection.removeAllRanges).not.toHaveBeenCalled();
      expect(selection.addRange).not.toHaveBeenCalled();
    });
  });

  describe('getCurrentListItemImpl', () => {
    it('returns null when the selection manager has no selection at all', () => {
      const host = buildHost('<ul><li>item</li></ul>');

      expect(getCurrentListItemImpl(ctxFor(host, null))).toBeNull();
    });

    it('returns null when a selection exists but holds no range', () => {
      const host = buildHost('<ul><li>item</li></ul>');
      const item = host.querySelector('li')!;

      expect(getCurrentListItemImpl(ctxFor(host, rangelessSelection(item.firstChild)))).toBeNull();
    });

    it('returns the list item holding the caret', () => {
      const host = buildHost('<ul><li>first</li><li>second</li></ul>');
      const second = host.querySelectorAll('li')[1];

      expect(getCurrentListItemImpl(ctxFor(host, stubSelection(second.firstChild)))).toBe(second);
    });

    it('returns the list item when the anchor is the <li> element itself', () => {
      const host = buildHost('<ul><li>item</li></ul>');
      const item = host.querySelector('li')!;

      expect(getCurrentListItemImpl(ctxFor(host, stubSelection(item)))).toBe(item);
    });

    it('returns the item through intervening inline markup', () => {
      const host = buildHost('<ol><li><strong>bold</strong> item</li></ol>');
      const item = host.querySelector('li')!;
      const boldText = host.querySelector('strong')!.firstChild!;

      expect(getCurrentListItemImpl(ctxFor(host, stubSelection(boldText)))).toBe(item);
    });

    it('returns the innermost list item when lists are nested', () => {
      const host = buildHost('<ul><li id="outer">outer<ul><li id="inner">inner</li></ul></li></ul>');
      const inner = host.querySelector('#inner')!;

      expect(getCurrentListItemImpl(ctxFor(host, stubSelection(inner.firstChild)))).toBe(inner);
    });

    it('returns null when the walk reaches the editor root without meeting an <li>', () => {
      const host = buildHost('<p>plain <em>text</em></p>');
      const text = host.querySelector('em')!.firstChild!;

      expect(getCurrentListItemImpl(ctxFor(host, stubSelection(text)))).toBeNull();
    });

    it('returns null when the anchor is detached, so the walk runs off the top', () => {
      const host = buildHost('<p>plain</p>');
      // No <li> above the anchor, so the walk ends at a null parent.
      const orphan = document.createElement('div');
      orphan.textContent = 'stale';

      expect(getCurrentListItemImpl(ctxFor(host, stubSelection(orphan.firstChild)))).toBeNull();
    });

    it('ignores an <li> that wraps the editor root rather than editor content', () => {
      const outer = attach(document.createElement('li'));
      const editorRoot = document.createElement('div');
      editorRoot.innerHTML = '<p>text</p>';
      outer.appendChild(editorRoot);
      const text = editorRoot.querySelector('p')!.firstChild!;

      expect(getCurrentListItemImpl(ctxFor(editorRoot, stubSelection(text)))).toBeNull();
    });
  });

  describe('shouldExitListImpl', () => {
    it('reports false when the caret is not in a list at all', () => {
      const host = buildHost('<p>plain</p>');
      const text = host.querySelector('p')!.firstChild!;

      expect(shouldExitListImpl(ctxFor(host, stubSelection(text)))).toBe(false);
    });

    it('reports true for a list item holding only a <br>', () => {
      const host = buildHost('<ul><li>first</li><li><br></li></ul>');
      const blank = host.querySelectorAll('li')[1];

      expect(shouldExitListImpl(ctxFor(host, stubSelection(blank)))).toBe(true);
    });

    it('reports true for a completely empty list item', () => {
      const host = buildHost('<ul><li>first</li><li></li></ul>');
      const blank = host.querySelectorAll('li')[1];

      expect(shouldExitListImpl(ctxFor(host, stubSelection(blank)))).toBe(true);
    });

    it('reports true for a list item holding only whitespace', () => {
      const host = buildHost('<ul><li>   </li></ul>');
      const blank = host.querySelector('li')!;

      expect(shouldExitListImpl(ctxFor(host, stubSelection(blank.firstChild)))).toBe(true);
    });

    it('reports false for a list item that still has text', () => {
      const host = buildHost('<ul><li>item</li></ul>');
      const item = host.querySelector('li')!;

      expect(shouldExitListImpl(ctxFor(host, stubSelection(item.firstChild)))).toBe(false);
    });

    it('reports false for a list item whose text sits inside inline markup', () => {
      const host = buildHost('<ul><li><strong>bold</strong></li></ul>');
      const item = host.querySelector('li')!;
      const boldText = host.querySelector('strong')!.firstChild!;

      expect(shouldExitListImpl(ctxFor(host, stubSelection(boldText)))).toBe(false);
      expect(item.innerHTML).toBe('<strong>bold</strong>');
    });

    it('reports true for an item whose only content is an empty inline element', () => {
      const host = buildHost('<ul><li><strong></strong></li></ul>');
      const item = host.querySelector('li')!;

      // The markup is not blank, but the rendered text is — the text check wins.
      expect(item.innerHTML).toBe('<strong></strong>');
      expect(shouldExitListImpl(ctxFor(host, stubSelection(item)))).toBe(true);
    });

    it('reports false for an outer item that still has text when the caret is in it', () => {
      const host = buildHost('<ul><li id="outer">outer<ul><li id="inner"><br></li></ul></li></ul>');
      const outer = host.querySelector('#outer')!;

      expect(shouldExitListImpl(ctxFor(host, stubSelection(outer.firstChild)))).toBe(false);
    });

    it('reports true for an empty nested item even when its parent item has text', () => {
      const host = buildHost('<ul><li id="outer">outer<ul><li id="inner"><br></li></ul></li></ul>');
      const inner = host.querySelector('#inner')!;

      expect(shouldExitListImpl(ctxFor(host, stubSelection(inner)))).toBe(true);
    });
  });
});
