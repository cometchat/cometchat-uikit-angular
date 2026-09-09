/**
 * Where the Organise flyout (Pin / Save) opens.
 *
 * It defaults to the right of the menu and flips left when the right has no
 * room. Two things broke that: the flyout lives inside a submenu that is
 * `display: none` until it opens, so the first measurement reports a width of
 * 0 and every overflow test passes trivially; and when neither side could hold
 * it, the old rule left it on the right, clipped against the window edge.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { CometChatContextMenuComponent } from './cometchat-context-menu.component';

const FLYOUT_WIDTH = 205;

let component: CometChatContextMenuComponent;
let originalWidth: number;

/**
 * Place the anchor and give the flyout a width, then run the alignment the way
 * openGroup() does.
 *
 * @param left - anchor's left edge
 * @param right - anchor's right edge, where a right-opening flyout starts
 * @param measuredWidth - what offsetWidth reports; 0 means "not laid out yet"
 */
function align(left: number, right: number, measuredWidth: number): { flipped: boolean; shift: number | null } {
  const flyout = document.createElement('div');
  const anchor = document.createElement('div');
  anchor.appendChild(flyout);
  document.body.appendChild(anchor);

  Object.defineProperty(flyout, 'offsetWidth', { value: measuredWidth, configurable: true });
  anchor.getBoundingClientRect = () =>
    ({ left, right, top: 0, bottom: 0, width: right - left, height: 0, x: left, y: 0, toJSON: () => ({}) }) as DOMRect;

  (component as unknown as { groupFlyoutRef: unknown }).groupFlyoutRef = { nativeElement: flyout };
  (component as unknown as { alignGroupFlyout(): void }).alignGroupFlyout();
  return { flipped: component.groupFlyoutFlipped, shift: component.groupFlyoutShift };
}

describe('CometChatContextMenu — Organise flyout placement', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [CometChatContextMenuComponent] }).compileComponents();
    component = TestBed.createComponent(CometChatContextMenuComponent).componentInstance;
    originalWidth = window.innerWidth;
    Object.defineProperty(window, 'innerWidth', { value: 435, configurable: true });
  });

  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', { value: originalWidth, configurable: true });
    document.body.innerHTML = '';
  });

  it('stays on the right when there is room', () => {
    // Menu on the left of a 435px window: 205px fits to its right.
    expect(align(10, 150, FLYOUT_WIDTH)).toEqual({ flipped: false, shift: null });
  });

  it('flips left when the right edge has no room', () => {
    // The reported case: menu at 117–320, so a 205px flyout would end at 525.
    // 435px window, menu 117–320: neither side holds 205px, so it is placed by
    // hand at 222 (spanning 222–427) rather than clipped against either edge.
    expect(align(117, 320, FLYOUT_WIDTH)).toEqual({ flipped: false, shift: 105 });
  });

  it('flips even when the flyout has not been laid out yet', () => {
    // offsetWidth is 0 while the submenu is still display:none. Measuring a
    // zero used to mean "it fits", which is what left it clipped.
    expect(align(117, 320, 0)).toEqual({ flipped: false, shift: 130 });
  });

  it('flips left when the left side can hold it', () => {
    // Wide window, menu near the right edge — the classic flip.
    Object.defineProperty(window, 'innerWidth', { value: 1280, configurable: true });
    expect(align(900, 1100, FLYOUT_WIDTH)).toEqual({ flipped: true, shift: null });
  });

  it('pulls the flyout back on screen when neither side can hold it', () => {
    // Menu 150–300 in a 435px window leaves 142px left and 127px right — under
    // a 205px flyout either way, so neither flipping nor staying put helps.
    const { flipped, shift } = align(150, 300, FLYOUT_WIDTH);
    expect(flipped).toBe(false);
    expect(shift).not.toBeNull();
    // Its right edge now lands inside the window rather than past it.
    expect(150 + (shift as number) + FLYOUT_WIDTH).toBeLessThanOrEqual(435);
  });

  it('stays right when the left is the tighter side', () => {
    expect(align(20, 60, FLYOUT_WIDTH).flipped).toBe(false);
  });

  it('does nothing without a flyout to measure', () => {
    (component as unknown as { groupFlyoutRef: unknown }).groupFlyoutRef = undefined;
    expect(() =>
      (component as unknown as { alignGroupFlyout(): void }).alignGroupFlyout()
    ).not.toThrow();
  });
});
