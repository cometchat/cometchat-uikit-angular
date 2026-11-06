/**
 * cometchat-context-menu.utils Tests
 *
 * Covers: isContextMenuDocsMode, getContextMenuTopElement,
 *         getContextMenuPlacement, calculateContextMenuPosition — including
 *         its static, parent, centered and viewport positioning strategies.
 *
 * @module components/base-elements/cometchat-context-menu/utils
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { Placement } from '../../../Enums/Enums';
import * as util from '../../../utils/util';
import {
  isContextMenuDocsMode,
  getContextMenuTopElement,
  getContextMenuPlacement,
  calculateContextMenuPosition,
} from './cometchat-context-menu.utils';

/** A DOMRect-shaped literal; the utils only read the geometry fields. */
function rect(
  over: Partial<Record<'top' | 'left' | 'bottom' | 'right' | 'width' | 'height', number>> = {}
): DOMRect {
  const top = over.top ?? 100;
  const left = over.left ?? 100;
  const width = over.width ?? 50;
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

/** Parses a `"123px"` style value back to a number. */
const px = (v: string | undefined): number => parseFloat(v ?? 'NaN');

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  document.body.innerHTML = '';
});

// ---------------------------------------------------------------------------
// isContextMenuDocsMode
// ---------------------------------------------------------------------------

describe('isContextMenuDocsMode', () => {
  it('reports false when not framed', () => {
    expect(isContextMenuDocsMode()).toBe(false);
  });

  it('reports true when the window is inside another window', () => {
    vi.stubGlobal('window', { ...window, parent: {} });
    expect(isContextMenuDocsMode()).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// getContextMenuTopElement
// ---------------------------------------------------------------------------

describe('getContextMenuTopElement', () => {
  it('returns null for a null start element', () => {
    expect(getContextMenuTopElement(null)).toBeNull();
  });

  it('prefers the nearest [data-cometchat-container] ancestor', () => {
    const container = document.createElement('div');
    container.setAttribute('data-cometchat-container', '');
    const mid = document.createElement('div');
    const leaf = document.createElement('div');
    container.appendChild(mid);
    mid.appendChild(leaf);
    document.body.appendChild(container);

    expect(getContextMenuTopElement(leaf)).toBe(container);
  });

  it('returns the start element when it is itself the container', () => {
    const el = document.createElement('div');
    el.setAttribute('data-cometchat-container', '');
    document.body.appendChild(el);

    expect(getContextMenuTopElement(el)).toBe(el);
  });

  it('picks the nearest container when several are nested', () => {
    const outer = document.createElement('div');
    outer.setAttribute('data-cometchat-container', '');
    const inner = document.createElement('div');
    inner.setAttribute('data-cometchat-container', '');
    const leaf = document.createElement('div');
    outer.appendChild(inner);
    inner.appendChild(leaf);
    document.body.appendChild(outer);

    expect(getContextMenuTopElement(leaf)).toBe(inner);
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

    expect(getContextMenuTopElement(leaf)).toBe(top);
  });

  it('returns null when neither a container nor a .cometchat ancestor exists', () => {
    const leaf = document.createElement('div');
    document.body.appendChild(leaf);

    expect(getContextMenuTopElement(leaf)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// getContextMenuPlacement
// ---------------------------------------------------------------------------

describe('getContextMenuPlacement', () => {
  function parentRef(bottom: number): HTMLElement {
    return {
      getBoundingClientRect: () => rect({ top: 0, bottom, left: 0, right: 500 }),
    } as unknown as HTMLElement;
  }

  it('honours the requested placement when static placement is forced', () => {
    const result = getContextMenuPlacement(rect(), 100, Placement.left, true, true, parentRef(900));
    expect(result).toBe(Placement.left);
  });

  describe('without a parent container', () => {
    it('returns the requested placement on desktop', () => {
      vi.spyOn(util, 'isMobileDevice').mockReturnValue(false);
      expect(getContextMenuPlacement(rect(), 100, Placement.right, false, false, null)).toBe(
        Placement.right
      );
    });

    it('prefers below on mobile when there is room', () => {
      vi.spyOn(util, 'isMobileDevice').mockReturnValue(true);
      const result = getContextMenuPlacement(
        rect({ bottom: 100 }),
        50,
        Placement.left,
        false,
        false,
        parentRef(900)
      );
      expect(result).toBe(Placement.bottom);
    });

    it('flips above on mobile when there is no room below', () => {
      vi.spyOn(util, 'isMobileDevice').mockReturnValue(true);
      const result = getContextMenuPlacement(
        rect({ bottom: 880 }),
        100,
        Placement.left,
        false,
        false,
        parentRef(900)
      );
      expect(result).toBe(Placement.top);
    });

    it('treats a missing parent as no space below on mobile', () => {
      vi.spyOn(util, 'isMobileDevice').mockReturnValue(true);
      expect(getContextMenuPlacement(rect(), 100, Placement.left, false, false, null)).toBe(
        Placement.top
      );
    });
  });

  describe('with a parent container', () => {
    it('falls back to the requested placement when the parent has no rect', () => {
      expect(getContextMenuPlacement(rect(), 100, Placement.right, true, false, null)).toBe(
        Placement.right
      );
    });

    it('opens below when the parent has room below', () => {
      const result = getContextMenuPlacement(
        rect({ top: 100, bottom: 120 }),
        50,
        Placement.left,
        true,
        false,
        parentRef(900)
      );
      expect(result).toBe(Placement.bottom);
    });

    it('opens above when there is no room below but room above', () => {
      const result = getContextMenuPlacement(
        rect({ top: 500, bottom: 520 }),
        100,
        Placement.left,
        true,
        false,
        parentRef(560)
      );
      expect(result).toBe(Placement.top);
    });

    it('keeps the requested placement when neither side has room', () => {
      const result = getContextMenuPlacement(
        rect({ top: 20, bottom: 40 }),
        100,
        Placement.right,
        true,
        false,
        parentRef(60)
      );
      expect(result).toBe(Placement.right);
    });
  });
});

// ---------------------------------------------------------------------------
// calculateContextMenuPosition — static strategy
// ---------------------------------------------------------------------------

describe('calculateContextMenuPosition — forced static placement', () => {
  const dims = { width: 100, height: 60 };

  function staticPos(placement: Placement, r = rect({ top: 300, left: 300 })) {
    return calculateContextMenuPosition(r, dims, null, placement, 'viewport', true, false);
  }

  it('places above for top', () => {
    const pos = staticPos(Placement.top);
    expect(px(pos['top'])).toBe(300 - 60 - 10);
    expect(px(pos['left'])).toBe(300);
  });

  it('places below for bottom', () => {
    const r = rect({ top: 300, left: 300 });
    const pos = staticPos(Placement.bottom, r);
    expect(px(pos['top'])).toBe(r.bottom + 10);
  });

  it('places to the left for left', () => {
    const pos = staticPos(Placement.left);
    expect(px(pos['left'])).toBe(300 - 100 - 10);
    expect(px(pos['top'])).toBe(300);
  });

  it('places to the right for right', () => {
    const r = rect({ top: 300, left: 300 });
    const pos = staticPos(Placement.right, r);
    expect(px(pos['left'])).toBe(r.right + 10);
  });

  it('clamps to the left edge', () => {
    const pos = staticPos(Placement.left, rect({ top: 300, left: 5 }));
    expect(px(pos['left'])).toBe(10);
  });

  it('clamps to the right edge', () => {
    const pos = staticPos(Placement.right, rect({ top: 300, left: window.innerWidth - 20 }));
    expect(px(pos['left']) + dims.width).toBeLessThanOrEqual(window.innerWidth - 10);
  });

  it('clamps to the top edge', () => {
    const pos = staticPos(Placement.top, rect({ top: 5, left: 300 }));
    expect(px(pos['top'])).toBe(10);
  });

  it('clamps to the bottom edge', () => {
    const pos = staticPos(Placement.bottom, rect({ top: window.innerHeight - 5, left: 300 }));
    expect(px(pos['top']) + dims.height).toBeLessThanOrEqual(window.innerHeight - 10);
  });

  it('always returns both coordinates as px strings', () => {
    const pos = staticPos(Placement.top);
    expect(pos['top']).toMatch(/px$/);
    expect(pos['left']).toMatch(/px$/);
  });
});

// ---------------------------------------------------------------------------
// calculateContextMenuPosition — parent strategy
// ---------------------------------------------------------------------------

describe('calculateContextMenuPosition — parent strategy', () => {
  const dims = { width: 100, height: 60 };
  const parent = rect({ top: 0, left: 0, bottom: 600, right: 500 });

  function parentPos(placement: Placement, useParentHeight: boolean, r = rect({ top: 200, left: 200 })) {
    return calculateContextMenuPosition(r, dims, parent, placement, 'parent', false, useParentHeight);
  }

  it('opens below the trigger', () => {
    const r = rect({ top: 200, left: 200 });
    const pos = parentPos(Placement.bottom, false, r);
    expect(px(pos['top'])).toBe(r.bottom + 10);
  });

  it('opens above the trigger', () => {
    const pos = parentPos(Placement.top, false);
    expect(px(pos['top'])).toBe(200 - 60 - 10);
  });

  it('keeps a bottom-placed menu inside the parent when using parent height', () => {
    const r = rect({ top: 560, left: 200, bottom: 580 });
    const pos = parentPos(Placement.bottom, true, r);
    expect(px(pos['top'])).toBeLessThanOrEqual(parent.bottom - dims.height);
  });

  it('keeps a top-placed menu inside the parent when using parent height', () => {
    const r = rect({ top: 5, left: 200 });
    const pos = parentPos(Placement.top, true, r);
    expect(px(pos['top'])).toBeGreaterThanOrEqual(parent.top);
  });

  it('clamps horizontally to the parent right edge', () => {
    const pos = parentPos(Placement.bottom, false, rect({ top: 200, left: 480 }));
    expect(px(pos['left'])).toBeLessThanOrEqual(parent.right - dims.width - 10);
  });

  it('clamps horizontally to the parent left edge', () => {
    const pos = parentPos(Placement.bottom, false, rect({ top: 200, left: -50 }));
    expect(px(pos['left'])).toBeGreaterThanOrEqual(parent.left - dims.width);
  });

  it('opens to the left within the parent', () => {
    const pos = parentPos(Placement.left, false);
    expect(px(pos['left'])).toBe(Math.max(parent.left, 200 - 100 - 10));
  });

  it('opens to the right within the parent', () => {
    const r = rect({ top: 200, left: 200 });
    const pos = parentPos(Placement.right, false, r);
    expect(px(pos['left'])).toBe(Math.min(parent.right - 100, r.right + 10));
  });

  it('uses the trigger top for side placements without parent height', () => {
    const pos = parentPos(Placement.left, false);
    expect(px(pos['top'])).toBe(200);
  });

  it('clamps the top for side placements when using parent height', () => {
    const pos = parentPos(Placement.right, true, rect({ top: 590, left: 200 }));
    expect(px(pos['top'])).toBeLessThanOrEqual(parent.bottom - dims.height - 10);
  });
});

// ---------------------------------------------------------------------------
// calculateContextMenuPosition — centered strategy
// ---------------------------------------------------------------------------

describe('calculateContextMenuPosition — centered strategy', () => {
  const dims = { width: 100, height: 60 };
  const parent = rect({ top: 0, left: 0, bottom: 600, right: 500 });

  function centeredPos(placement: Placement, r = rect({ top: 200, left: 200, width: 50 })) {
    return calculateContextMenuPosition(r, dims, parent, placement, 'centered', false, false);
  }

  it('places above for top', () => {
    const pos = centeredPos(Placement.top);
    expect(px(pos['top'])).toBe(200 - 60 - 10);
  });

  it('places below for bottom', () => {
    const r = rect({ top: 200, left: 200, width: 50 });
    const pos = centeredPos(Placement.bottom, r);
    expect(px(pos['top'])).toBe(r.bottom + 10);
  });

  it('centres the menu on the trigger', () => {
    const r = rect({ top: 200, left: 200, width: 50 });
    const pos = centeredPos(Placement.bottom, r);
    expect(px(pos['left'])).toBe(r.left + r.width / 2 - dims.width / 2);
  });

  it('clamps to the parent left edge', () => {
    const pos = centeredPos(Placement.bottom, rect({ top: 200, left: 0, width: 10 }));
    expect(px(pos['left'])).toBe(parent.left + 10);
  });

  it('clamps to the parent right edge', () => {
    const pos = centeredPos(Placement.bottom, rect({ top: 200, left: 490, width: 10 }));
    expect(px(pos['left'])).toBe(parent.right - dims.width - 10);
  });

  it('omits top for a side placement', () => {
    const pos = centeredPos(Placement.left);
    expect(pos['top']).toBeUndefined();
    expect(pos['left']).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// calculateContextMenuPosition — viewport strategy (the default)
// ---------------------------------------------------------------------------

describe('calculateContextMenuPosition — viewport strategy', () => {
  const dims = { width: 100, height: 60 };

  function viewportPos(placement: Placement, r = rect({ top: 300, left: 300 })) {
    return calculateContextMenuPosition(r, dims, null, placement, 'viewport', false, false);
  }

  it('is used when the strategy is parent but no parent rect is given', () => {
    const pos = calculateContextMenuPosition(
      rect({ top: 300, left: 300 }),
      dims,
      null,
      Placement.bottom,
      'parent',
      false,
      false
    );
    expect(pos['top']).toBeDefined();
    expect(pos['left']).toBeDefined();
  });

  it('is used when the strategy is centered but no parent rect is given', () => {
    const pos = calculateContextMenuPosition(
      rect({ top: 300, left: 300 }),
      dims,
      null,
      Placement.bottom,
      'centered',
      false,
      false
    );
    expect(pos['left']).toBeDefined();
  });

  it('opens below when there is room', () => {
    const r = rect({ top: 100, left: 300 });
    const pos = viewportPos(Placement.bottom, r);
    expect(px(pos['top'])).toBe(r.bottom + 10);
  });

  it('flips above when there is no room below', () => {
    const r = rect({ top: window.innerHeight - 30, left: 300 });
    const pos = viewportPos(Placement.bottom, r);
    expect(px(pos['top'])).toBe(r.top - dims.height - 10);
  });

  it('opens above when there is room', () => {
    const pos = viewportPos(Placement.top, rect({ top: 300, left: 300 }));
    expect(px(pos['top'])).toBe(300 - 60 - 10);
  });

  it('flips below when there is no room above', () => {
    const r = rect({ top: 5, left: 300 });
    const pos = viewportPos(Placement.top, r);
    expect(px(pos['top'])).toBe(r.bottom + 10);
  });

  it('clamps horizontally for vertical placements', () => {
    const pos = viewportPos(Placement.bottom, rect({ top: 100, left: window.innerWidth - 20 }));
    expect(px(pos['left'])).toBe(window.innerWidth - dims.width - 10);
  });

  it('opens to the left when there is room', () => {
    const pos = viewportPos(Placement.left, rect({ top: 300, left: 300 }));
    expect(px(pos['left'])).toBe(300 - 100 - 10);
  });

  it('flips right when there is no room to the left', () => {
    const r = rect({ top: 300, left: 5 });
    const pos = viewportPos(Placement.left, r);
    expect(px(pos['left'])).toBe(r.right + 10);
  });

  it('opens to the right when there is room', () => {
    const r = rect({ top: 300, left: 300 });
    const pos = viewportPos(Placement.right, r);
    expect(px(pos['left'])).toBe(r.right + 10);
  });

  it('flips left when there is no room to the right', () => {
    const r = rect({ top: 300, left: window.innerWidth - 60 });
    const pos = viewportPos(Placement.right, r);
    expect(px(pos['left'])).toBe(r.left - dims.width - 10);
  });

  it('clamps vertically for side placements', () => {
    const pos = viewportPos(Placement.left, rect({ top: window.innerHeight - 20, left: 300 }));
    expect(px(pos['top'])).toBe(window.innerHeight - dims.height - 10);
  });

  it('always returns both coordinates', () => {
    for (const p of [Placement.top, Placement.bottom, Placement.left, Placement.right]) {
      const pos = viewportPos(p);
      expect(pos['top']).toMatch(/px$/);
      expect(pos['left']).toMatch(/px$/);
    }
  });
});
