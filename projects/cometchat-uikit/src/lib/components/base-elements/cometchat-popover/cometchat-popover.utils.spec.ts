/**
 * cometchat-popover.utils Tests
 *
 * Covers: isDocsMode, getTopMostCometChatElement, getAvailablePlacement,
 *         calculateViewportPosition, calculateParentPosition,
 *         calculateNoParentHeightPosition, getFocusableElements.
 *
 * @module components/base-elements/cometchat-popover/utils
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { Placement } from '../../../Enums/Enums';
import {
  isDocsMode,
  getTopMostCometChatElement,
  getAvailablePlacement,
  calculateViewportPosition,
  calculateParentPosition,
  calculateNoParentHeightPosition,
  getFocusableElements,
} from './cometchat-popover.utils';

/** A DOMRect-shaped literal; these utils only read geometry. */
function rect(
  over: Partial<Record<'top' | 'left' | 'bottom' | 'right' | 'width' | 'height', number>> = {}
): DOMRect {
  const top = over.top ?? 200;
  const left = over.left ?? 200;
  const width = over.width ?? 40;
  const height = over.height ?? 20;
  return {
    top,
    left,
    width,
    height,
    bottom: over.bottom ?? top + height,
    right: over.right ?? left + width,
    x: left,
    y: top,
    toJSON: () => ({}),
  } as DOMRect;
}

/** An element that reports the given rect. */
function elWithRect(r: DOMRect): HTMLElement {
  return { getBoundingClientRect: () => r } as unknown as HTMLElement;
}

const px = (v: string | undefined): number => parseFloat(v ?? 'NaN');

/**
 * A placement string outside the `Placement` enum (e.g. a mistyped template
 * attribute). The cast is deliberate: it reproduces a runtime value the type
 * system forbids so the fall-through branch is exercised.
 */
const UNHANDLED_PLACEMENT = 'center' as unknown as Placement;

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  document.body.innerHTML = '';
});

// ---------------------------------------------------------------------------
// isDocsMode
// ---------------------------------------------------------------------------

describe('isDocsMode', () => {
  it('is false for a normal URL', () => {
    expect(isDocsMode()).toBe(false);
  });

  it('is true when the query string marks docs mode', () => {
    vi.stubGlobal('window', { ...window, location: { search: '?id=x&viewMode=docs' } });
    expect(isDocsMode()).toBe(true);
  });

  it('is false for a different viewMode', () => {
    vi.stubGlobal('window', { ...window, location: { search: '?viewMode=story' } });
    expect(isDocsMode()).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// getTopMostCometChatElement
// ---------------------------------------------------------------------------

describe('getTopMostCometChatElement', () => {
  it('prefers the nearest [data-cometchat-container] ancestor', () => {
    const container = document.createElement('div');
    container.setAttribute('data-cometchat-container', '');
    const leaf = document.createElement('div');
    container.appendChild(leaf);
    document.body.appendChild(container);

    expect(getTopMostCometChatElement(leaf)).toBe(container);
  });

  it('returns the start element when it is itself the container', () => {
    const el = document.createElement('div');
    el.setAttribute('data-cometchat-container', '');
    document.body.appendChild(el);

    expect(getTopMostCometChatElement(el)).toBe(el);
  });

  it('picks the nearest of several nested containers', () => {
    const outer = document.createElement('div');
    outer.setAttribute('data-cometchat-container', '');
    const inner = document.createElement('div');
    inner.setAttribute('data-cometchat-container', '');
    const leaf = document.createElement('div');
    outer.appendChild(inner);
    inner.appendChild(leaf);
    document.body.appendChild(outer);

    expect(getTopMostCometChatElement(leaf)).toBe(inner);
  });

  it('falls back to the topmost .cometchat ancestor', () => {
    const top = document.createElement('div');
    top.className = 'cometchat';
    const mid = document.createElement('div');
    mid.className = 'cometchat';
    const leaf = document.createElement('div');
    top.appendChild(mid);
    mid.appendChild(leaf);
    document.body.appendChild(top);

    expect(getTopMostCometChatElement(leaf)).toBe(top);
  });

  it('returns undefined when neither is present', () => {
    const leaf = document.createElement('div');
    document.body.appendChild(leaf);
    expect(getTopMostCometChatElement(leaf)).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// getAvailablePlacement
// ---------------------------------------------------------------------------

describe('getAvailablePlacement', () => {
  const H = 50;

  describe('against the viewport', () => {
    it('keeps the requested placement when it fits above', () => {
      const r = rect({ top: 400, bottom: 420 });
      expect(getAvailablePlacement(r, H, Placement.top, false, undefined)).toBe(Placement.top);
    });

    it('keeps the requested placement when it fits below', () => {
      const r = rect({ top: 10, bottom: 30 });
      expect(getAvailablePlacement(r, H, Placement.bottom, false, undefined)).toBe(Placement.bottom);
    });

    it('keeps the requested placement when it fits to the left', () => {
      const r = rect({ left: 400, right: 440 });
      expect(getAvailablePlacement(r, H, Placement.left, false, undefined)).toBe(Placement.left);
    });

    it('keeps the requested placement when it fits to the right', () => {
      const r = rect({ left: 10, right: 50 });
      expect(getAvailablePlacement(r, H, Placement.right, false, undefined)).toBe(Placement.right);
    });

    it('falls back to another side when the requested one does not fit', () => {
      // No room above; there is room below.
      const r = rect({ top: 5, bottom: 25 });
      expect(getAvailablePlacement(r, H, Placement.top, false, undefined)).toBe(Placement.bottom);
    });

    it('returns the requested placement when nothing fits', () => {
      const huge = Math.max(window.innerWidth, window.innerHeight) * 2;
      const r = rect({ top: 10, bottom: 20, left: 10, right: 20 });
      expect(getAvailablePlacement(r, huge, Placement.right, false, undefined)).toBe(Placement.right);
    });
  });

  describe('against a parent container', () => {
    const parent = elWithRect(rect({ top: 0, left: 0, bottom: 600, right: 600 }));

    it('keeps top when the parent has room above', () => {
      const r = rect({ top: 300, bottom: 320 });
      expect(getAvailablePlacement(r, H, Placement.top, true, parent)).toBe(Placement.top);
    });

    it('keeps bottom when the parent has room below', () => {
      const r = rect({ top: 100, bottom: 120 });
      expect(getAvailablePlacement(r, H, Placement.bottom, true, parent)).toBe(Placement.bottom);
    });

    it('keeps left when the parent has room to the left', () => {
      const r = rect({ left: 300, right: 340 });
      expect(getAvailablePlacement(r, H, Placement.left, true, parent)).toBe(Placement.left);
    });

    it('keeps right when the parent has room to the right', () => {
      const r = rect({ left: 100, right: 140 });
      expect(getAvailablePlacement(r, H, Placement.right, true, parent)).toBe(Placement.right);
    });

    it('falls back within the parent when the requested side does not fit', () => {
      const tight = elWithRect(rect({ top: 0, left: 0, bottom: 600, right: 600 }));
      const r = rect({ top: 5, bottom: 25, left: 300, right: 340 });
      expect(getAvailablePlacement(r, H, Placement.top, true, tight)).toBe(Placement.bottom);
    });

    it('ignores the parent when none is supplied', () => {
      const r = rect({ top: 400, bottom: 420 });
      expect(getAvailablePlacement(r, H, Placement.top, true, undefined)).toBe(Placement.top);
    });
  });
});

// ---------------------------------------------------------------------------
// calculateViewportPosition
// ---------------------------------------------------------------------------

describe('calculateViewportPosition', () => {
  const H = 60;
  const W = 100;

  it('places above and centres horizontally for top', () => {
    const r = rect({ top: 300, left: 300, width: 40 });
    const pos = calculateViewportPosition(r, H, W, Placement.top);

    expect(px(pos['top'])).toBe(300 - H - 10);
    expect(px(pos['left'])).toBe(r.left + r.width / 2 - W / 2);
  });

  it('never returns a negative top, which Safari will not render', () => {
    const r = rect({ top: 5, left: 300 });
    const pos = calculateViewportPosition(r, H, W, Placement.top);
    expect(px(pos['top'])).toBe(10);
  });

  it('places below for bottom', () => {
    const r = rect({ top: 100, left: 300 });
    const pos = calculateViewportPosition(r, H, W, Placement.bottom);
    expect(px(pos['top'])).toBe(r.bottom + 10);
  });

  it('clamps to the left edge', () => {
    const pos = calculateViewportPosition(rect({ top: 300, left: 0, width: 10 }), H, W, Placement.bottom);
    expect(px(pos['left'])).toBe(10);
  });

  it('clamps to the right edge', () => {
    const pos = calculateViewportPosition(
      rect({ top: 300, left: window.innerWidth - 10, width: 10 }),
      H,
      W,
      Placement.bottom
    );
    expect(px(pos['left'])).toBe(window.innerWidth - W - 10);
  });

  it('places to the left and centres vertically', () => {
    const r = rect({ top: 300, left: 300, height: 20 });
    const pos = calculateViewportPosition(r, H, W, Placement.left);

    expect(px(pos['left'])).toBe(300 - W - 10);
    expect(px(pos['top'])).toBe(r.top + r.height / 2 - H / 2);
  });

  it('places to the right', () => {
    const r = rect({ top: 300, left: 300 });
    const pos = calculateViewportPosition(r, H, W, Placement.right);
    expect(px(pos['left'])).toBe(r.right + 10);
  });

  it('clamps vertically for side placements', () => {
    const pos = calculateViewportPosition(
      rect({ top: window.innerHeight - 5, left: 300 }),
      H,
      W,
      Placement.right
    );
    expect(px(pos['top'])).toBe(window.innerHeight - H - 10);
  });

  it('honours a custom offset', () => {
    const r = rect({ top: 300, left: 300 });
    const pos = calculateViewportPosition(r, H, W, Placement.bottom, 25);
    expect(px(pos['top'])).toBe(r.bottom + 25);
  });

  it('returns an empty style for an unhandled placement', () => {
    expect(calculateViewportPosition(rect(), H, W, UNHANDLED_PLACEMENT)).toEqual({});
  });
});

// ---------------------------------------------------------------------------
// calculateParentPosition
// ---------------------------------------------------------------------------

describe('calculateParentPosition', () => {
  const H = 60;
  const W = 100;
  const parent = rect({ top: 0, left: 0, bottom: 600, right: 600 });

  describe('in docs mode', () => {
    const host = rect({ top: 50, left: 50 });

    function docsPos(placement: Placement, r = rect({ top: 300, left: 300 })) {
      return calculateParentPosition(r, H, W, parent, placement, true, host, false);
    }

    it('positions absolutely relative to the host', () => {
      const pos = docsPos(Placement.top);
      expect(pos['position']).toBe('absolute');
      expect(px(pos['top'])).toBe(300 - H - 10 - host.top);
    });

    it('offsets below by the host origin', () => {
      const r = rect({ top: 300, left: 300 });
      const pos = docsPos(Placement.bottom, r);
      expect(px(pos['top'])).toBe(r.bottom + 10 - host.top);
    });

    it('offsets left placements by the host origin', () => {
      const pos = docsPos(Placement.left);
      expect(px(pos['left'])).toBe(300 - W - 10 - host.left);
    });

    it('offsets right placements by the host origin', () => {
      const r = rect({ top: 300, left: 300 });
      const pos = docsPos(Placement.right, r);
      expect(px(pos['left'])).toBe(r.right + 10 - host.left);
    });

    it('still clamps within the parent before offsetting', () => {
      const pos = docsPos(Placement.bottom, rect({ top: 300, left: 580, width: 10 }));
      expect(px(pos['left'])).toBeLessThanOrEqual(parent.right - W - 10 - host.left);
    });
  });

  describe('outside docs mode', () => {
    function pos(
      placement: Placement,
      opts: { constrainH?: boolean; constrainV?: boolean; tooltip?: boolean } = {},
      r = rect({ top: 300, left: 300 })
    ) {
      return calculateParentPosition(
        r,
        H,
        W,
        parent,
        placement,
        false,
        null,
        opts.tooltip ?? false,
        opts.constrainH ?? false,
        opts.constrainV ?? false
      );
    }

    it('uses a 10px offset for a popover', () => {
      expect(px(pos(Placement.top)['top'])).toBe(300 - H - 10);
    });

    it('uses a tighter 5px offset for a tooltip', () => {
      expect(px(pos(Placement.top, { tooltip: true })['top'])).toBe(300 - H - 5);
    });

    it('clamps the top to the parent when vertically constrained', () => {
      const result = pos(Placement.top, { constrainV: true }, rect({ top: 5, left: 300 }));
      expect(px(result['top'])).toBe(parent.top);
    });

    it('leaves the top unclamped when not vertically constrained', () => {
      const result = pos(Placement.top, { constrainV: false }, rect({ top: 5, left: 300 }));
      expect(px(result['top'])).toBe(5 - H - 10);
    });

    it('clamps a bottom placement inside the parent when constrained', () => {
      const result = pos(Placement.bottom, { constrainV: true }, rect({ top: 580, left: 300 }));
      expect(px(result['top'])).toBeLessThanOrEqual(parent.bottom - H);
    });

    it('clamps horizontally to the parent when constrained', () => {
      const result = pos(Placement.bottom, { constrainH: true }, rect({ top: 300, left: 590, width: 10 }));
      expect(px(result['left'])).toBe(parent.right - W - 10);
    });

    it('clamps horizontally to the viewport when not constrained', () => {
      const result = pos(
        Placement.bottom,
        { constrainH: false },
        rect({ top: 300, left: window.innerWidth, width: 10 })
      );
      expect(px(result['left'])).toBe(window.innerWidth - W - 10);
    });

    it('clamps a left placement to the parent when horizontally constrained', () => {
      const result = pos(Placement.left, { constrainH: true }, rect({ top: 300, left: 5 }));
      expect(px(result['left'])).toBe(parent.left);
    });

    it('clamps a right placement to the parent when horizontally constrained', () => {
      const result = pos(Placement.right, { constrainH: true }, rect({ top: 300, left: 590 }));
      expect(px(result['left'])).toBeLessThanOrEqual(parent.right - W);
    });

    it('clamps the top of a side placement to the parent when vertically constrained', () => {
      const result = pos(Placement.left, { constrainV: true }, rect({ top: 590, left: 300 }));
      expect(px(result['top'])).toBeLessThanOrEqual(parent.bottom - H - 10);
    });

    it('clamps the top of a side placement to the viewport otherwise', () => {
      const result = pos(Placement.right, { constrainV: false }, rect({ top: window.innerHeight, left: 300 }));
      expect(px(result['top'])).toBe(window.innerHeight - H - 10);
    });

    it('returns an empty style for an unhandled placement', () => {
      expect(pos(UNHANDLED_PLACEMENT)).toEqual({});
    });
  });
});

// ---------------------------------------------------------------------------
// calculateNoParentHeightPosition
// ---------------------------------------------------------------------------

describe('calculateNoParentHeightPosition', () => {
  const W = 100;
  const H = 60;
  const parent = { left: 0, right: 600 };

  it('places above for top', () => {
    const pos = calculateNoParentHeightPosition(rect({ top: 300, left: 300 }), W, H, parent, Placement.top);
    expect(px(pos['top'])).toBe(300 - H - 10);
  });

  it('places below for bottom', () => {
    const r = rect({ top: 300, left: 300 });
    const pos = calculateNoParentHeightPosition(r, W, H, parent, Placement.bottom);
    expect(px(pos['top'])).toBe(r.bottom + 10);
  });

  it('centres horizontally on the trigger', () => {
    const r = rect({ top: 300, left: 300, width: 40 });
    const pos = calculateNoParentHeightPosition(r, W, H, parent, Placement.bottom);
    expect(px(pos['left'])).toBe(r.left + r.width / 2 - W / 2);
  });

  it('clamps to the parent left edge', () => {
    const pos = calculateNoParentHeightPosition(
      rect({ top: 300, left: 0, width: 10 }),
      W,
      H,
      parent,
      Placement.bottom
    );
    expect(px(pos['left'])).toBe(parent.left + 10);
  });

  it('clamps to the parent right edge', () => {
    const pos = calculateNoParentHeightPosition(
      rect({ top: 300, left: 595, width: 10 }),
      W,
      H,
      parent,
      Placement.bottom
    );
    expect(px(pos['left'])).toBe(parent.right - W - 10);
  });

  it('omits top for a side placement but still sets left', () => {
    const pos = calculateNoParentHeightPosition(rect(), W, H, parent, Placement.left);
    expect(pos['top']).toBeUndefined();
    expect(pos['left']).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// getFocusableElements
// ---------------------------------------------------------------------------

describe('getFocusableElements', () => {
  function container(html: string): HTMLElement {
    const el = document.createElement('div');
    el.innerHTML = html;
    document.body.appendChild(el);
    return el;
  }

  it('returns an empty list when there is nothing focusable', () => {
    expect(getFocusableElements(container('<p>text</p>'))).toEqual([]);
  });

  it('finds buttons, links, inputs, selects and textareas', () => {
    const el = container(`
      <button>b</button>
      <a href="#">a</a>
      <input />
      <select></select>
      <textarea></textarea>
    `);
    expect(getFocusableElements(el)).toHaveLength(5);
  });

  it('skips disabled controls', () => {
    const el = container(`
      <button disabled>b</button>
      <input disabled />
      <select disabled></select>
      <textarea disabled></textarea>
    `);
    expect(getFocusableElements(el)).toHaveLength(0);
  });

  it('includes a positive tabindex', () => {
    expect(getFocusableElements(container('<div tabindex="0">x</div>'))).toHaveLength(1);
  });

  it('skips tabindex="-1"', () => {
    expect(getFocusableElements(container('<div tabindex="-1">x</div>'))).toHaveLength(0);
  });

  it('returns elements in document order', () => {
    const el = container('<button id="one">1</button><a href="#" id="two">2</a>');
    expect(getFocusableElements(el).map(e => e.id)).toEqual(['one', 'two']);
  });

  it('finds nested focusables', () => {
    const el = container('<div><span><button>deep</button></span></div>');
    expect(getFocusableElements(el)).toHaveLength(1);
  });
});
