/**
 * Unit tests for the pin/save helpers.
 *
 * These encode the two rules the whole feature rests on:
 *   1. PRESENCE of `pinnedAt`/`savedAt` is the boolean — the fields are absent
 *      when unset and CLEARED on unpin/unsave, so a zero is never "unpinned".
 *   2. Ownership is read from `getOwner()`, not `getScope()` — the owner's
 *      scope arrives as `admin` on the wire, so scope alone cannot identify one.
 *
 * Both are easy to regress and neither is visible from a component test.
 */
import { describe, it, expect } from 'vitest';
import {
  carryPinSaveForward,
  snapshotPinSave,
  applyPinSave,
  applyPinSaveFrom,
  isInteractiveTarget,
  PIN_SAVE_INTERACTIVE_SELECTOR,
} from './pin-save-utils';

/** A group whose owner and scope can be set independently. */
function makeGroup(owner: string, scope: string): any {
  return { getOwner: () => owner, getScope: () => scope };
}

/**
 * A message with real backing state, so a flip is observable.
 *
 * Getter-only stubs would let applyPinSave/snapshotPinSave "pass" while doing
 * nothing, which is exactly the bug these tests exist to catch.
 */
function makeMessage(init: { pinnedAt?: number; pinnedBy?: string; savedAt?: number } = {}): any {
  const state = { ...init };
  return {
    getPinnedAt: () => state.pinnedAt,
    getPinnedBy: () => state.pinnedBy,
    getSavedAt: () => state.savedAt,
    isPinned: () => state.pinnedAt !== undefined,
    isSaved: () => state.savedAt !== undefined,
    setPinnedAt: (v?: number) => { state.pinnedAt = v; },
    setPinnedBy: (v?: string) => { state.pinnedBy = v; },
    setSavedAt: (v?: number) => { state.savedAt = v; },
  };
}

describe('applyPinSaveFrom', () => {
  /** A held row: pin/save state PLUS the things a pin/save payload never carries. */
  function makeHeldRow(init: { pinnedAt?: number; savedAt?: number } = {}): any {
    const row = makeMessage(init);
    row.quoted = { id: 41, text: 'uiui' };
    row.reactions = ['👍'];
    row.getQuotedMessage = () => row.quoted;
    row.getReactions = () => row.reactions;
    return row;
  }

  /** What the save/pin endpoint actually returns: the attributes, little else. */
  function makePayload(init: { pinnedAt?: number; pinnedBy?: string; savedAt?: number }): any {
    return makeMessage(init);
  }

  it('keeps the reply preview when a save lands', () => {
    // The bug this exists for: saving a message that quoted another one made the
    // quoted block vanish until a conversation switch forced a refetch.
    const held = makeHeldRow();
    applyPinSaveFrom(held, makePayload({ savedAt: 200 }));

    expect(held.getSavedAt()).toBe(200);
    expect(held.getQuotedMessage()).toEqual({ id: 41, text: 'uiui' });
  });

  it('keeps reactions too — the payload speaks only for pin/save', () => {
    const held = makeHeldRow();
    applyPinSaveFrom(held, makePayload({ pinnedAt: 100, pinnedBy: 'bob' }));

    expect(held.getReactions()).toEqual(['👍']);
    expect(held.getPinnedBy()).toBe('bob');
  });

  it('copies all three attributes across', () => {
    const held = makeHeldRow();
    applyPinSaveFrom(held, makePayload({ pinnedAt: 100, pinnedBy: 'bob', savedAt: 200 }));
    expect(snapshotPinSave(held)).toEqual({ pinnedAt: 100, pinnedBy: 'bob', savedAt: 200 });
  });

  it('CLEARS on unpin rather than leaving a stale marker', () => {
    // The reason every key is passed unconditionally: copying only truthy values
    // would leave the pin indicator on a message the server has just unpinned.
    const held = makeHeldRow({ pinnedAt: 100, savedAt: 200 });
    applyPinSaveFrom(held, makePayload({ savedAt: 200 }));

    expect(held.isPinned()).toBe(false);
    expect(held.isSaved()).toBe(true);
  });

  it('clears a save the same way', () => {
    const held = makeHeldRow({ pinnedAt: 100, savedAt: 200 });
    applyPinSaveFrom(held, makePayload({ pinnedAt: 100 }));

    expect(held.isSaved()).toBe(false);
    expect(held.isPinned()).toBe(true);
  });

  it('leaves the payload object untouched — it is a source, not a target', () => {
    const held = makeHeldRow({ pinnedAt: 100 });
    const payload = makePayload({ savedAt: 200 });
    applyPinSaveFrom(held, payload);
    expect(payload.getPinnedAt()).toBeUndefined();
  });

  it('is inert on a message with no setters, rather than throwing', () => {
    const held = { getPinnedAt: () => 1, getPinnedBy: () => 'x', getSavedAt: () => 2 } as any;
    expect(() => applyPinSaveFrom(held, makePayload({ savedAt: 200 }))).not.toThrow();
  });
});

describe('snapshotPinSave / applyPinSave', () => {
  it('round-trips the three attributes', () => {
    const message = makeMessage({ pinnedAt: 100, pinnedBy: 'bob', savedAt: 200 });
    expect(snapshotPinSave(message)).toEqual({ pinnedAt: 100, pinnedBy: 'bob', savedAt: 200 });
  });

  it('applies a pin', () => {
    const message = makeMessage();
    applyPinSave(message, { pinnedAt: 500, pinnedBy: 'alice' });
    expect(message.isPinned()).toBe(true);
    expect(message.getPinnedBy()).toBe('alice');
  });

  it('CLEARS rather than zeroes when given undefined', () => {
    // A stale 0 would read as "pinned at the epoch", so unpinning must remove
    // the field entirely.
    const message = makeMessage({ pinnedAt: 100, pinnedBy: 'bob' });
    applyPinSave(message, { pinnedAt: undefined, pinnedBy: undefined });
    expect(message.getPinnedAt()).toBeUndefined();
    expect(message.isPinned()).toBe(false);
  });

  it('leaves attributes the caller did not mention alone', () => {
    const message = makeMessage({ pinnedAt: 100, savedAt: 200 });
    applyPinSave(message, { savedAt: undefined });
    expect(message.getPinnedAt()).toBe(100);
    expect(message.isSaved()).toBe(false);
  });

  it('restores a snapshot exactly, for revert-on-failure', () => {
    const message = makeMessage({ pinnedAt: 100, pinnedBy: 'bob', savedAt: 200 });
    const before = snapshotPinSave(message);
    applyPinSave(message, { pinnedAt: undefined, pinnedBy: undefined, savedAt: undefined });
    applyPinSave(message, before);
    expect(snapshotPinSave(message)).toEqual(before);
  });

  it('ignores a message without setters instead of throwing', () => {
    expect(() => applyPinSave({ } as any, { pinnedAt: 1 })).not.toThrow();
  });
});

describe('carryPinSaveForward', () => {
  it('fills a gap the replacement did not assert', () => {
    // An edit or reaction payload describes THAT change and carries no promise
    // of also carrying pin/save; swapping it in wholesale would erase the very
    // reason a row is in the pinned panel.
    const previous = makeMessage({ pinnedAt: 100, pinnedBy: 'bob', savedAt: 200 });
    const next = makeMessage();
    carryPinSaveForward(previous, next);
    expect(next.getPinnedAt()).toBe(100);
    expect(next.getPinnedBy()).toBe('bob');
    expect(next.getSavedAt()).toBe(200);
  });

  it('does not overwrite state the replacement does assert', () => {
    const previous = makeMessage({ pinnedAt: 100 });
    const next = makeMessage({ pinnedAt: 999 });
    carryPinSaveForward(previous, next);
    expect(next.getPinnedAt()).toBe(999);
  });

  it('carries nothing when the previous message had nothing', () => {
    const next = makeMessage();
    carryPinSaveForward(makeMessage(), next);
    expect(next.isPinned()).toBe(false);
    expect(next.isSaved()).toBe(false);
  });

  it('carries pin and save independently', () => {
    const previous = makeMessage({ pinnedAt: 100, savedAt: 200 });
    const next = makeMessage({ savedAt: 300 });
    carryPinSaveForward(previous, next);
    expect(next.getPinnedAt()).toBe(100);
    expect(next.getSavedAt()).toBe(300);
  });
});

describe('isInteractiveTarget', () => {
  function clickOn(html: string, selector: string): Event {
    document.body.innerHTML = html;
    const target = document.querySelector(selector)!;
    return { target } as unknown as Event;
  }

  it('claims a click on a button', () => {
    expect(isInteractiveTarget(clickOn('<div><button id="b">x</button></div>', '#b'))).toBe(true);
  });

  it('claims a click inside an interactive ancestor', () => {
    // The row makes its whole area a hit target, so a click on the label inside
    // a control still belongs to that control.
    expect(
      isInteractiveTarget(clickOn('<button><span id="s">x</span></button>', '#s'))
    ).toBe(true);
  });

  it.each(['audio', 'video', 'a'])('claims a click on %s', tag => {
    expect(isInteractiveTarget(clickOn(`<${tag} id="t"></${tag}>`, '#t'))).toBe(true);
  });

  it('leaves a plain click to the row', () => {
    expect(isInteractiveTarget(clickOn('<div><p id="p">text</p></div>', '#p'))).toBe(false);
  });

  describe('bounded by the row the handler is bound to', () => {
    /** The real shape: a row that is itself role="button", with content inside. */
    function row(): { row: HTMLElement; body: HTMLElement; unsave: HTMLElement } {
      document.body.innerHTML = `
        <div id="row" role="button" tabindex="0">
          <span id="body">a saved message</span>
          <button id="unsave">unsave</button>
        </div>`;
      return {
        row: document.getElementById('row')!,
        body: document.getElementById('body')!,
        unsave: document.getElementById('unsave')!,
      };
    }

    function clickInRow(target: HTMLElement, currentTarget: HTMLElement): Event {
      return { target, currentTarget } as unknown as Event;
    }

    it('does NOT claim a click on the row body', () => {
      // The row is role="button" and so matches the selector itself. Left
      // unbounded, closest() finds the row and every click is swallowed —
      // which made both panels look dead.
      const { row: r, body } = row();
      expect(isInteractiveTarget(clickInRow(body, r))).toBe(false);
    });

    it('does NOT claim a click on the row element itself', () => {
      const { row: r } = row();
      expect(isInteractiveTarget(clickInRow(r, r))).toBe(false);
    });

    it('DOES claim a click on a control inside the row', () => {
      const { row: r, unsave } = row();
      expect(isInteractiveTarget(clickInRow(unsave, r))).toBe(true);
    });

    it('does not claim a match that sits outside the row', () => {
      document.body.innerHTML = `
        <button id="outer"><div id="row2" role="button"><span id="inner">x</span></div></button>`;
      const r = document.getElementById('row2')!;
      const inner = document.getElementById('inner')!;
      expect(isInteractiveTarget(clickInRow(inner, r))).toBe(false);
    });
  });

  it('does not throw when the event has no element target', () => {
    expect(isInteractiveTarget({ target: null } as unknown as Event)).toBe(false);
  });

  it('lists the selectors it guards', () => {
    expect(PIN_SAVE_INTERACTIVE_SELECTOR).toContain('button');
    expect(PIN_SAVE_INTERACTIVE_SELECTOR).toContain('[role="menuitem"]');
  });
});
