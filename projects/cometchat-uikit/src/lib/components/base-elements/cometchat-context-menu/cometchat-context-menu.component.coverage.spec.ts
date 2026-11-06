/**
 * The parts of CometChatContextMenu that only run when the DOM has a geometry:
 * where the dropdown lands, which container it measures against, the portal to
 * document.body, the nested-group flyout, and the listeners that have to be
 * torn down again.
 *
 * jsdom reports every box as 0x0 and never lays anything out, so each test here
 * pins the rects it cares about and drives the private positioning methods
 * directly. The real positioning utilities are kept — only `isContextMenuDocsMode`
 * is swapped, because a Storybook docs iframe cannot be simulated by a window
 * that is its own parent.
 */

// The calls SDK reaches for JitsiMeetJS, which jsdom does not have.
vi.mock('@cometchat/calls-sdk-javascript', () => ({
  CometChatCalls: {
    init: vi.fn().mockResolvedValue(true),
    generateToken: vi.fn().mockResolvedValue({ token: 'mock-token' }),
  },
}));

import { ComponentFixture, TestBed } from '@angular/core/testing';
import type { EventEmitter, TemplateRef } from '@angular/core';
import type { Subscription } from 'rxjs';
import { CometChatContextMenuComponent } from './cometchat-context-menu.component';
import { CometChatActionsIcon, CometChatActionsView, CometChatOption } from '../../../modals';
import { Placement } from '../../../Enums/Enums';
import type { ContextMenuItem } from './cometchat-context-menu.types';

type Utils = typeof import('./cometchat-context-menu.utils');

/**
 * Docs mode is a property of the frame the menu renders in, not of the
 * component, and `onCalculate` lets a test look at the arguments handed to the
 * positioner — the synthetic parent rect built for a menu with no container is
 * otherwise invisible from the outside.
 */
const utilsHook = vi.hoisted(() => ({
  docsMode: false,
  onCalculate: null as null | ((parentRect: DOMRect | null) => void),
}));

vi.mock('./cometchat-context-menu.utils', async (importOriginal) => {
  const actual = await importOriginal<Utils>();
  return {
    ...actual,
    isContextMenuDocsMode: () => utilsHook.docsMode,
    calculateContextMenuPosition: ((...args: Parameters<Utils['calculateContextMenuPosition']>) => {
      utilsHook.onCalculate?.(args[2]);
      return actual.calculateContextMenuPosition(...args);
    }) as Utils['calculateContextMenuPosition'],
  };
});

// ---------------------------------------------------------------------------
// Reaching the private members, which is how this repo tests them.
// ---------------------------------------------------------------------------
interface Internals {
  parentViewRef: HTMLElement | null;
  originalSubMenuParent: HTMLElement | null;
  positionPreCalculated: boolean;
  instanceId: string;
  hostRef: { nativeElement: HTMLElement };
  subMenuRef?: { nativeElement: HTMLElement };
  moreButtonRef?: { nativeElement: HTMLElement };
  groupFlyoutRef?: { nativeElement: HTMLElement };
  resolveMenuWidth(): number;
  handleClickOutside(event: MouseEvent): void;
  getPopoverPositionStyle(): void;
  calculatePopoverPosition(): void;
  applyHostAnchor(style: Record<string, string>, width: number, parentRect: DOMRect | null): void;
  setMenuHeight(): void;
  focusItemAtIndex(index: number): void;
  closeSubMenu(): void;
  handleOtherMenuOpen(event: Event): void;
}

const priv = (c: CometChatContextMenuComponent) => c as unknown as Internals;

const MENU_WIDTH_VAR = '--cometchat-context-menu-menu-width';
/** Mirrors DEFAULT_MENU_WIDTH in the component. */
const DEFAULT_MENU_WIDTH = 205;

function makeRect(overrides: Partial<DOMRect>): DOMRect {
  const box = {
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: 0,
    height: 0,
    x: 0,
    y: 0,
    ...overrides,
  };
  return { ...box, toJSON: () => box } as DOMRect;
}

/** Give an element a fixed box, since jsdom measures everything as 0x0. */
function pinRect(el: HTMLElement, overrides: Partial<DOMRect>): DOMRect {
  const rect = makeRect(overrides);
  el.getBoundingClientRect = () => rect;
  return rect;
}

/** clientWidth / scrollHeight and friends are read-only getters in jsdom. */
function pinMetrics(el: HTMLElement, metrics: Record<string, number>): void {
  for (const [name, value] of Object.entries(metrics)) {
    Object.defineProperty(el, name, { value, configurable: true });
  }
}

describe('CometChatContextMenuComponent — positioning, portalling and teardown', () => {
  let fixture: ComponentFixture<CometChatContextMenuComponent> | null = null;
  let component: CometChatContextMenuComponent;
  let subs: Subscription[] = [];
  let rafQueue: FrameRequestCallback[] = [];
  let originalInnerWidth: number;
  let originalInnerHeight: number;
  /**
   * Window globals are restored by hand rather than with a spy: restoring a
   * spy on one of them deletes the property outright, and every later test in
   * the file then finds it missing.
   */
  let windowPatches: Array<() => void> = [];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CometChatContextMenuComponent],
    }).compileComponents();

    utilsHook.docsMode = false;
    utilsHook.onCalculate = null;
    subs = [];
    rafQueue = [];
    windowPatches = [];
    originalInnerWidth = window.innerWidth;
    originalInnerHeight = window.innerHeight;

    // The portal and the initial focus both happen in a rAF callback. Holding
    // the callbacks lets a test decide whether the frame ever arrives, and run
    // the same callback twice to exercise the "already portaled" path.
    patchWindow('requestAnimationFrame', ((cb: FrameRequestCallback) => {
      rafQueue.push(cb);
      return rafQueue.length;
    }) as typeof window.requestAnimationFrame);
  });

  afterEach(() => {
    subs.forEach(s => s.unsubscribe());
    destroyFixture();
    vi.restoreAllMocks();
    vi.useRealTimers();
    windowPatches.reverse().forEach(undo => undo());
    setWindowSize(originalInnerWidth, originalInnerHeight);
    document.getElementById('subMenuContext')?.remove();
  });

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  function patchWindow<K extends keyof typeof window>(key: K, value: (typeof window)[K]): void {
    const original = window[key];
    windowPatches.push(() => {
      window[key] = original;
    });
    window[key] = value;
  }

  /** Stand in for the computed custom properties jsdom does not resolve. */
  function stubCustomProperty(target: Element, property: string, value: string): void {
    patchWindow('getComputedStyle', ((el: Element) =>
      ({
        getPropertyValue: (prop: string) => (el === target && prop === property ? value : ''),
      }) as unknown as CSSStyleDeclaration) as typeof window.getComputedStyle);
  }

  function setWindowSize(width: number, height: number): void {
    Object.defineProperty(window, 'innerWidth', { value: width, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: height, configurable: true });
  }

  function destroyFixture(): void {
    fixture?.destroy();
    fixture = null;
  }

  function actions(count = 5): CometChatActionsIcon[] {
    return Array.from({ length: count }, (_, i) =>
      new CometChatActionsIcon({
        id: `action-${i}`,
        title: `Action ${i}`,
        iconURL: `action-${i}.svg`,
        onClick: vi.fn(),
      })
    );
  }

  function group(children: CometChatActionsIcon[]): CometChatActionsIcon {
    return new CometChatActionsIcon({
      id: 'organise',
      title: 'Organise',
      iconURL: 'organise.svg',
      onClick: vi.fn(),
      children,
    });
  }

  /**
   * @param inputs - set before the first change detection, so the view-children
   *                 and the lifecycle hooks see their final values.
   * @param render - false leaves the view unrendered, which is the only way to
   *                 reach the component with no view children at all.
   */
  function build(
    inputs: Partial<CometChatContextMenuComponent> = {},
    render = true
  ): CometChatContextMenuComponent {
    fixture = TestBed.createComponent(CometChatContextMenuComponent);
    component = fixture.componentInstance;
    Object.assign(component, inputs);
    if (render) fixture.detectChanges();
    return component;
  }

  /** Marks the TestBed root as the menu's container, above the component. */
  function markContainer(): HTMLElement {
    const root = fixture!.nativeElement.parentElement as HTMLElement;
    root.setAttribute('data-cometchat-container', '');
    return root;
  }

  function moreButton(): HTMLElement {
    return priv(component).moreButtonRef!.nativeElement;
  }

  function subMenu(): HTMLElement {
    return priv(component).subMenuRef!.nativeElement;
  }

  function flushRaf(): void {
    const queued = rafQueue;
    rafQueue = [];
    queued.forEach(cb => cb(0));
  }

  function collect<T>(emitter: EventEmitter<T>): T[] {
    const seen: T[] = [];
    subs.push(emitter.subscribe((value: T) => seen.push(value)));
    return seen;
  }

  function keydown(key: string, target?: HTMLElement): KeyboardEvent {
    const event = new KeyboardEvent('keydown', { key, bubbles: true });
    if (target) Object.defineProperty(event, 'target', { value: target });
    vi.spyOn(event, 'preventDefault');
    vi.spyOn(event, 'stopPropagation');
    return event;
  }

  // -------------------------------------------------------------------------
  // Lifecycle wiring
  // -------------------------------------------------------------------------

  describe('container resolution on ngAfterViewInit', () => {
    it('adopts the nearest marked container when useParentContainer is set', () => {
      fixture = TestBed.createComponent(CometChatContextMenuComponent);
      component = fixture.componentInstance;
      component.data = actions(4);
      component.useParentContainer = true;
      const container = markContainer();

      fixture.detectChanges();

      expect(priv(component).parentViewRef).toBe(container);
    });

    it('leaves the container unresolved when useParentContainer is false', () => {
      build({ data: actions(4) });

      expect(priv(component).parentViewRef).toBeNull();
    });

    it('resolves to null when there is no more-button to walk up from', () => {
      // Every item fits in the top menu, so the "…" trigger is never rendered.
      build({ data: actions(2), topMenuSize: 3, useParentContainer: true });

      expect(priv(component).moreButtonRef).toBeUndefined();
      expect(priv(component).parentViewRef).toBeNull();
    });
  });

  describe('closing when another menu opens', () => {
    it('closes on an open event from a different instance', () => {
      build({ data: actions(4) });
      const opens = collect(component.openChange);
      component.handleMenuClick();
      expect(component.showSubMenu).toBe(true);

      document.dispatchEvent(
        new CustomEvent('cometchat-context-menu-open', { detail: { instanceId: 'some-other-menu' } })
      );

      expect(component.showSubMenu).toBe(false);
      expect(opens).toEqual([true, false]);
    });

    it('ignores its own open event', () => {
      build({ data: actions(4) });
      component.handleMenuClick();

      document.dispatchEvent(
        new CustomEvent('cometchat-context-menu-open', {
          detail: { instanceId: priv(component).instanceId },
        })
      );

      expect(component.showSubMenu).toBe(true);
    });

    it('ignores an open event while it is already closed', () => {
      build({ data: actions(4) });
      const opens = collect(component.openChange);

      // No detail at all — an event from outside the component's own protocol.
      priv(component).handleOtherMenuOpen(new Event('cometchat-context-menu-open'));

      expect(component.showSubMenu).toBe(false);
      expect(opens).toEqual([]);
    });

    it('stops listening once destroyed', () => {
      build({ data: actions(4) });
      component.handleMenuClick();
      destroyFixture();

      document.dispatchEvent(
        new CustomEvent('cometchat-context-menu-open', { detail: { instanceId: 'another' } })
      );

      // Still true: a destroyed menu must not keep reacting to the document.
      expect(component.showSubMenu).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // Keyboard
  // -------------------------------------------------------------------------

  describe('keyboard handling while the dropdown is closed', () => {
    it('opens the dropdown when the more-button itself is activated', () => {
      build({ data: actions(4) });
      const event = keydown('Enter', moreButton());

      component.handleKeydown(event);

      expect(component.showSubMenu).toBe(true);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('ignores activation keys aimed at anything else', () => {
      build({ data: actions(4) });
      const event = keydown('Enter', fixture!.nativeElement.querySelector('.cometchat-menu-list')!);

      component.handleKeydown(event);

      expect(component.showSubMenu).toBe(false);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('ignores a non-activation key on the more-button', () => {
      build({ data: actions(4) });
      const event = keydown('a', moreButton());

      component.handleKeydown(event);

      expect(component.showSubMenu).toBe(false);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });
  });

  describe('keyboard navigation inside the dropdown', () => {
    it('steps down from the DOM-focused item, not from the tracked index', () => {
      build({ data: actions(5) });
      component.handleMenuClick();
      fixture!.detectChanges();
      const items = component.menuItemRefs.toArray();
      items[2].nativeElement.focus();
      // Stale tracked index: the DOM focus is what should win.
      component.focusedItemIndex = 0;

      component.handleKeydown(keydown('ArrowDown'));

      expect(component.focusedItemIndex).toBe(3);
      expect(document.activeElement).toBe(items[3].nativeElement);
    });

    it('falls back to the tracked index when focus is outside the list', () => {
      build({ data: actions(5) });
      component.handleMenuClick();
      fixture!.detectChanges();
      const items = component.menuItemRefs.toArray();
      (document.activeElement as HTMLElement | null)?.blur();
      component.focusedItemIndex = 1;

      component.handleKeydown(keydown('ArrowUp'));

      expect(component.focusedItemIndex).toBe(0);
      expect(document.activeElement).toBe(items[0].nativeElement);
    });

    it('does nothing when the dropdown has no items to move between', () => {
      // Two items with room for both: the sub-menu list renders empty.
      build({ data: actions(2), topMenuSize: 3 });
      component.showSubMenu = true;
      component.focusedItemIndex = 4;

      const event = keydown('ArrowDown');
      component.handleKeydown(event);

      expect(component.menuItemRefs.length).toBe(0);
      expect(component.focusedItemIndex).toBe(4);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('activates the DOM-focused item on Enter', () => {
      const data = actions(5);
      build({ data });
      const clicks = collect(component.optionClick);
      component.handleMenuClick();
      fixture!.detectChanges();
      component.menuItemRefs.toArray()[2].nativeElement.focus();
      component.focusedItemIndex = 0;

      component.handleKeydown(keydown('Enter'));

      // subMenu starts at data[1] when topMenuSize is 2, so index 2 is data[3].
      expect(clicks).toEqual([data[3]]);
      expect(component.showSubMenu).toBe(false);
    });

    it('ignores Enter when the tracked index is past the end of the list', () => {
      build({ data: actions(5) });
      const clicks = collect(component.optionClick);
      component.handleMenuClick();
      fixture!.detectChanges();
      (document.activeElement as HTMLElement | null)?.blur();
      component.focusedItemIndex = 99;

      component.handleKeydown(keydown('Enter'));

      expect(clicks).toEqual([]);
      expect(component.showSubMenu).toBe(true);
    });

    it('restores focus to the more-button on Escape', () => {
      build({ data: actions(5) });
      component.handleMenuClick();
      fixture!.detectChanges();
      component.menuItemRefs.toArray()[1].nativeElement.focus();

      component.handleKeydown(keydown('Escape'));

      expect(component.showSubMenu).toBe(false);
      expect(document.activeElement).toBe(moreButton());
    });

    it('closes the dropdown on Tab so focus can move on past it', () => {
      build({ data: actions(5) });
      component.handleMenuClick();
      fixture!.detectChanges();
      const event = keydown('Tab');

      component.handleKeydown(event);

      expect(component.showSubMenu).toBe(false);
      // Tab is not swallowed: the browser still moves focus.
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('leaves a key it does not handle alone', () => {
      build({ data: actions(5) });
      const clicks = collect(component.optionClick);
      component.handleMenuClick();
      fixture!.detectChanges();
      component.menuItemRefs.toArray()[0].nativeElement.focus();
      const event = keydown('a');

      component.handleKeydown(event);

      expect(component.showSubMenu).toBe(true);
      expect(clicks).toEqual([]);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('leaves focus alone when asked to focus an index that does not exist', () => {
      build({ data: actions(5) });
      component.handleMenuClick();
      fixture!.detectChanges();
      const anchor = component.menuItemRefs.toArray()[0].nativeElement;
      anchor.focus();

      priv(component).focusItemAtIndex(99);

      expect(document.activeElement).toBe(anchor);
    });
  });

  // -------------------------------------------------------------------------
  // The document.body portal
  // -------------------------------------------------------------------------

  describe('portalling the dropdown to document.body', () => {
    it('moves the dropdown to the body and focuses its first item', () => {
      build({ data: actions(5) });
      const originalParent = subMenu().parentElement;
      component.handleMenuClick();

      flushRaf();

      expect(subMenu().parentElement).toBe(document.body);
      expect(priv(component).originalSubMenuParent).toBe(originalParent);
      expect(document.activeElement).toBe(component.menuItemRefs.toArray()[0].nativeElement);
    });

    it('does not re-record the parent when the dropdown is already portaled', () => {
      build({ data: actions(5) });
      const originalParent = subMenu().parentElement;
      component.handleMenuClick();
      const frames = [...rafQueue];

      frames.forEach(cb => cb(0));
      frames.forEach(cb => cb(0));

      // A second run must not record document.body as the place to put it back.
      expect(priv(component).originalSubMenuParent).toBe(originalParent);
      expect(subMenu().parentElement).toBe(document.body);
    });

    it('skips the portal when there is no dropdown element', () => {
      build({ data: actions(5) });
      component.handleMenuClick();
      priv(component).subMenuRef = undefined;

      flushRaf();

      expect(priv(component).originalSubMenuParent).toBeNull();
    });

    it('returns the dropdown to its original parent when closed', () => {
      build({ data: actions(5) });
      const originalParent = subMenu().parentElement;
      component.handleMenuClick();
      flushRaf();
      component.openGroupId = 'organise';
      component.positionStyle = { top: '1px' };
      component.focusedItemIndex = 3;

      component.handleMenuClick();

      expect(subMenu().parentElement).toBe(originalParent);
      expect(priv(component).originalSubMenuParent).toBeNull();
      expect(component.openGroupId).toBeNull();
      expect(component.positionStyle).toEqual({});
      expect(component.focusedItemIndex).toBe(-1);
    });

    it('removes a still-portaled dropdown on destroy', () => {
      build({ data: actions(5) });
      component.handleMenuClick();
      flushRaf();
      const portaled = subMenu();
      expect(portaled.parentElement).toBe(document.body);

      destroyFixture();

      expect(portaled.parentElement).toBeNull();
      expect(document.getElementById('subMenuContext')).toBeNull();
    });

    it('leaves a dropdown that was never portaled where Angular put it', () => {
      build({ data: actions(5) });
      component.handleMenuClick();
      const inPlace = subMenu();
      const parent = inPlace.parentElement;

      // No frame ever arrives, so the portal never runs.
      destroyFixture();

      expect(inPlace.parentElement).toBe(parent);
    });

    it('stops the propagation of the click that toggles it', () => {
      build({ data: actions(5) });
      const event = new MouseEvent('click');
      vi.spyOn(event, 'stopPropagation');

      component.handleMenuClick(event);

      expect(event.stopPropagation).toHaveBeenCalled();
      expect(component.showSubMenu).toBe(true);
    });

    it('closes from the backdrop without letting the click through', () => {
      build({ data: actions(5), disableBackgroundInteraction: true });
      component.handleMenuClick();
      const event = new MouseEvent('click');
      vi.spyOn(event, 'stopPropagation');

      component.onOverlayClick(event);

      expect(event.stopPropagation).toHaveBeenCalled();
      expect(component.showSubMenu).toBe(false);
    });
  });

  describe('position pre-calculated on hover', () => {
    it('computes the position on mouse-enter', () => {
      setWindowSize(1000, 768);
      build({ data: actions(5) });
      pinRect(moreButton(), { left: 500, right: 520, top: 300, bottom: 320, width: 20, height: 20 });

      component.onMoreButtonMouseEnter();

      // The geometry itself is asserted in "positioning against the viewport";
      // what matters here is that hovering did the work and said so.
      expect(priv(component).positionPreCalculated).toBe(true);
      expect(component.positionStyle['left']).toBeDefined();
    });

    it('does not recompute on the click that follows the hover', () => {
      build({ data: actions(5) });
      component.onMoreButtonMouseEnter();
      const recompute = vi.spyOn(priv(component), 'getPopoverPositionStyle');

      component.handleMenuClick();

      expect(recompute).not.toHaveBeenCalled();
    });

    it('computes the position on a click that was not preceded by a hover', () => {
      build({ data: actions(5) });
      const recompute = vi.spyOn(priv(component), 'getPopoverPositionStyle');

      component.handleMenuClick();

      expect(recompute).toHaveBeenCalledTimes(1);
    });
  });

  // -------------------------------------------------------------------------
  // Outside click
  // -------------------------------------------------------------------------

  describe('closing on an outside click', () => {
    it('closes when the click lands outside the more-button', () => {
      build({ data: actions(5), closeOnOutsideClick: true });
      const opens = collect(component.openChange);
      component.handleMenuClick();

      document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      expect(component.showSubMenu).toBe(false);
      expect(opens).toEqual([true, false]);
    });

    it('stays open when the click is inside the more-button', () => {
      build({ data: actions(5), closeOnOutsideClick: true });
      component.handleMenuClick();

      priv(component).handleClickOutside({
        target: moreButton().querySelector('.cometchat-menu-list__sub-menu-icon'),
      } as unknown as MouseEvent);

      expect(component.showSubMenu).toBe(true);
    });

    it('does nothing when there is no more-button to compare against', () => {
      build({ data: actions(2), topMenuSize: 3, closeOnOutsideClick: true });
      component.showSubMenu = true;

      document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      expect(component.showSubMenu).toBe(true);
    });

    it('ignores outside clicks when closeOnOutsideClick is off', () => {
      build({ data: actions(5) });
      component.handleMenuClick();

      document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      expect(component.showSubMenu).toBe(true);
    });

    it('stops listening to the document once destroyed', () => {
      build({ data: actions(5), closeOnOutsideClick: true });
      component.handleMenuClick();
      destroyFixture();

      document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      expect(component.showSubMenu).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // Resize
  // -------------------------------------------------------------------------

  describe('repositioning on window resize', () => {
    function openInsideContainer(inputs: Partial<CometChatContextMenuComponent> = {}) {
      build({ data: actions(5), useParentContainer: true, ...inputs });
      component.handleMenuClick();
      vi.useFakeTimers();
      return vi.spyOn(priv(component), 'getPopoverPositionStyle');
    }

    it('repositions after the debounce window', () => {
      const recompute = openInsideContainer();

      window.dispatchEvent(new Event('resize'));
      vi.advanceTimersByTime(99);
      expect(recompute).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1);
      expect(recompute).toHaveBeenCalledTimes(1);
    });

    it('coalesces a burst of resizes into one reposition', () => {
      const recompute = openInsideContainer();

      window.dispatchEvent(new Event('resize'));
      vi.advanceTimersByTime(50);
      window.dispatchEvent(new Event('resize'));
      vi.advanceTimersByTime(60);
      expect(recompute).not.toHaveBeenCalled();

      vi.advanceTimersByTime(40);
      expect(recompute).toHaveBeenCalledTimes(1);
    });

    it('does not reposition a dropdown that closed before the debounce fired', () => {
      const recompute = openInsideContainer();
      window.dispatchEvent(new Event('resize'));

      priv(component).closeSubMenu();
      vi.advanceTimersByTime(200);

      expect(recompute).not.toHaveBeenCalled();
    });

    it('cancels a pending reposition on destroy', () => {
      const recompute = openInsideContainer();
      window.dispatchEvent(new Event('resize'));

      destroyFixture();
      vi.advanceTimersByTime(200);

      expect(recompute).not.toHaveBeenCalled();
    });

    it('does not listen for resize when the menu takes its height from the parent', () => {
      const recompute = openInsideContainer({ useParentHeight: true });

      window.dispatchEvent(new Event('resize'));
      vi.advanceTimersByTime(200);

      expect(recompute).not.toHaveBeenCalled();
    });

    it('does not listen for resize when there is no parent container', () => {
      build({ data: actions(5) });
      component.handleMenuClick();
      vi.useFakeTimers();
      const recompute = vi.spyOn(priv(component), 'getPopoverPositionStyle');

      window.dispatchEvent(new Event('resize'));
      vi.advanceTimersByTime(200);

      expect(recompute).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // Nested groups
  // -------------------------------------------------------------------------

  describe('nested groups', () => {
    const children = () => [
      new CometChatActionsIcon({ id: 'pin', title: 'Pin', iconURL: 'pin.svg', onClick: vi.fn() }),
      new CometChatActionsIcon({ id: 'save', title: 'Save', iconURL: 'save.svg', onClick: vi.fn() }),
    ];

    function openWithGroup(windowWidth = 1000): CometChatActionsIcon {
      setWindowSize(windowWidth, 768);
      const organise = group(children());
      build({ data: [...actions(2), organise] });
      component.handleMenuClick();
      fixture!.detectChanges();
      return organise;
    }

    it('reports which items are groups', () => {
      const organise = group(children());
      const plain = actions(1)[0];
      build({ data: [plain, organise] });

      expect(component.hasChildren(organise)).toBe(true);
      expect(component.hasChildren(plain)).toBe(false);
      expect(component.childrenOf(organise).map(c => c.id)).toEqual(['pin', 'save']);
      expect(component.childrenOf(plain)).toEqual([]);
    });

    it('treats a group with an empty children array as a plain item', () => {
      const empty = new CometChatActionsIcon({
        id: 'empty',
        title: 'Empty',
        iconURL: 'empty.svg',
        onClick: vi.fn(),
        children: [],
      });
      build({ data: [empty] });

      expect(component.hasChildren(empty)).toBe(false);
      expect(component.childrenOf(empty)).toEqual([]);
    });

    it('opens the flyout instead of acting when a group is clicked', () => {
      const organise = openWithGroup();
      const clicks = collect(component.optionClick);

      component.onMenuItemClick(organise);

      expect(component.openGroupId).toBe('organise');
      expect(component.showSubMenu).toBe(true);
      expect(clicks).toEqual([]);
      expect(organise.onClick).not.toHaveBeenCalled();
    });

    it('keeps the flyout on the default side when there is room', () => {
      const organise = openWithGroup(1000);
      pinRect(document.getElementById('organise')!, { left: 100, right: 300, width: 200 });

      component.openGroup(organise);

      expect(component.openGroupId).toBe('organise');
      expect(component.groupFlyoutFlipped).toBe(false);
      expect(component.groupFlyoutShift).toBeNull();
      const flyout = priv(component).groupFlyoutRef!.nativeElement;
      expect(flyout.classList.contains('cometchat-menu-list__group-flyout--flip')).toBe(false);
      expect(flyout.style.left).toBe('');
    });

    it('flips the flyout when only the left side has room', () => {
      const organise = openWithGroup(300);
      pinRect(document.getElementById('organise')!, { left: 250, right: 290, width: 40 });

      component.openGroup(organise);

      expect(component.groupFlyoutFlipped).toBe(true);
      expect(component.groupFlyoutShift).toBeNull();
      expect(
        priv(component).groupFlyoutRef!.nativeElement.classList.contains(
          'cometchat-menu-list__group-flyout--flip'
        )
      ).toBe(true);
    });

    it('shifts the flyout by hand when neither side has room', () => {
      const organise = openWithGroup(300);
      pinRect(document.getElementById('organise')!, { left: 100, right: 200, width: 100 });

      component.openGroup(organise);

      // Pulled back until its right edge clears the window: 300 - 8 - 180 = 112.
      expect(component.groupFlyoutShift).toBe(12);
      expect(component.groupFlyoutFlipped).toBe(false);
      expect(priv(component).groupFlyoutRef!.nativeElement.style.left).toBe('12px');
    });

    it('re-measures from the default side when a flipped flyout is reopened', () => {
      const organise = openWithGroup(1000);
      component.groupFlyoutFlipped = true;
      component.groupFlyoutShift = 40;

      component.openGroup(organise);

      expect(component.groupFlyoutFlipped).toBe(false);
      expect(component.groupFlyoutShift).toBeNull();
    });

    it('closes the flyout and clears its placement', () => {
      const organise = openWithGroup(300);
      pinRect(document.getElementById('organise')!, { left: 250, right: 290, width: 40 });
      component.openGroup(organise);
      expect(component.groupFlyoutFlipped).toBe(true);

      component.closeGroup();

      expect(component.openGroupId).toBeNull();
      expect(component.groupFlyoutFlipped).toBe(false);
      expect(component.groupFlyoutShift).toBeNull();
    });

    it('does nothing when closing a flyout that is not open', () => {
      openWithGroup();
      component.groupFlyoutFlipped = true;

      component.closeGroup();

      // The early return leaves the (stale) placement untouched.
      expect(component.groupFlyoutFlipped).toBe(true);
    });

    it('closes the whole menu when a flyout child is chosen', () => {
      const organise = openWithGroup();
      component.openGroup(organise);
      const child = component.childrenOf(organise)[0];
      const clicks = collect(component.optionClick);

      component.onMenuItemClick(child);

      expect(clicks).toEqual([child]);
      expect(child.onClick).toHaveBeenCalledWith(0);
      expect(component.showSubMenu).toBe(false);
      expect(component.openGroupId).toBeNull();
    });

    it('activates a flyout child with Enter', () => {
      const organise = openWithGroup();
      component.openGroup(organise);
      const child = component.childrenOf(organise)[1];
      const clicks = collect(component.optionClick);
      const event = keydown('Enter');

      component.onGroupChildKeydown(event, child);

      expect(clicks).toEqual([child]);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('activates a flyout child with Space', () => {
      const organise = openWithGroup();
      component.openGroup(organise);
      const child = component.childrenOf(organise)[0];
      const clicks = collect(component.optionClick);

      component.onGroupChildKeydown(keydown(' '), child);

      expect(clicks).toEqual([child]);
    });

    it('returns to the parent list on Escape without closing the menu', () => {
      const organise = openWithGroup();
      component.openGroup(organise);
      const clicks = collect(component.optionClick);
      const event = keydown('Escape');

      component.onGroupChildKeydown(event, component.childrenOf(organise)[0]);

      expect(component.openGroupId).toBeNull();
      expect(component.showSubMenu).toBe(true);
      expect(clicks).toEqual([]);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopPropagation).toHaveBeenCalled();
    });

    it('ignores other keys on a flyout child', () => {
      const organise = openWithGroup();
      component.openGroup(organise);
      const clicks = collect(component.optionClick);
      const event = keydown('a');

      component.onGroupChildKeydown(event, component.childrenOf(organise)[0]);

      expect(component.openGroupId).toBe('organise');
      expect(clicks).toEqual([]);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('opens a group reached by hovering the row', () => {
      const organise = openWithGroup();
      const row = document.getElementById('organise')!;

      row.dispatchEvent(new MouseEvent('mouseenter'));

      expect(component.openGroupId).toBe('organise');
    });

    it('closes an open flyout when the pointer moves to a plain row', () => {
      const organise = openWithGroup();
      component.openGroup(organise);
      const plainRow = document.getElementById('action-1')!;

      plainRow.dispatchEvent(new MouseEvent('mouseenter'));

      expect(component.openGroupId).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // Menu width
  // -------------------------------------------------------------------------

  describe('resolving the pre-layout menu width', () => {
    it('falls back to the built-in width when there is nothing to measure', () => {
      build({ data: actions(5) }, false);

      expect(priv(component).resolveMenuWidth()).toBe(DEFAULT_MENU_WIDTH);
    });

    it('reads the width from the dropdown custom property', () => {
      build({ data: actions(5) });
      stubCustomProperty(subMenu(), MENU_WIDTH_VAR, '300px');

      expect(priv(component).resolveMenuWidth()).toBe(300);
    });

    it('falls back to the more-button when the dropdown is gone', () => {
      build({ data: actions(5) });
      // Only the more-button carries the property, so a width of 260 can only
      // have come from falling back to it.
      stubCustomProperty(moreButton(), MENU_WIDTH_VAR, '260px');
      priv(component).subMenuRef = undefined;

      expect(priv(component).resolveMenuWidth()).toBe(260);
    });

    it('ignores a custom property that resolves to nothing', () => {
      build({ data: actions(5) });
      stubCustomProperty(subMenu(), MENU_WIDTH_VAR, '');

      expect(priv(component).resolveMenuWidth()).toBe(DEFAULT_MENU_WIDTH);
    });

    it('ignores a zero width', () => {
      build({ data: actions(5) });
      stubCustomProperty(subMenu(), MENU_WIDTH_VAR, '0px');

      expect(priv(component).resolveMenuWidth()).toBe(DEFAULT_MENU_WIDTH);
    });

    it('falls back when the computed style cannot be read at all', () => {
      build({ data: actions(5) });
      patchWindow('getComputedStyle', (() => {
        throw new Error('detached document');
      }) as typeof window.getComputedStyle);

      expect(priv(component).resolveMenuWidth()).toBe(DEFAULT_MENU_WIDTH);
    });
  });

  // -------------------------------------------------------------------------
  // Viewport positioning
  // -------------------------------------------------------------------------

  describe('positioning against the viewport', () => {
    it('does nothing when there is no more-button to measure against', () => {
      // Every item fits in the top menu, so the "…" trigger is never rendered
      // and there is no box to anchor the dropdown to.
      build({ data: actions(2), topMenuSize: 3 });
      // A sentinel, so passing cannot mean "wrote an empty style object".
      component.positionStyle = { top: 'untouched' };

      priv(component).getPopoverPositionStyle();

      expect(component.positionStyle).toEqual({ top: 'untouched' });
    });

    it('positions to the left of the trigger with the fallback dimensions', () => {
      setWindowSize(1000, 768);
      build({ data: actions(5) });
      pinRect(moreButton(), { left: 500, right: 520, top: 300, bottom: 320, width: 20, height: 20 });

      priv(component).getPopoverPositionStyle();

      expect(component.positionStyle).toEqual({ left: '285px', top: '290px' });
    });

    it('uses the measured dropdown box once it has one', () => {
      setWindowSize(1000, 768);
      build({ data: actions(5) });
      pinRect(moreButton(), { left: 500, right: 520, top: 300, bottom: 320, width: 20, height: 20 });
      pinMetrics(subMenu(), { clientWidth: 400, clientHeight: 500 });

      priv(component).getPopoverPositionStyle();

      // 500 - 400 - 10 = 90, and the taller menu is pulled up to clear the fold.
      expect(component.positionStyle).toEqual({ left: '90px', top: '258px' });
    });
  });

  // -------------------------------------------------------------------------
  // Parent-container positioning
  // -------------------------------------------------------------------------

  describe('positioning inside a parent container', () => {
    function buildInContainer(inputs: Partial<CometChatContextMenuComponent> = {}) {
      fixture = TestBed.createComponent(CometChatContextMenuComponent);
      component = fixture.componentInstance;
      Object.assign(component, { data: actions(5), useParentContainer: true }, inputs);
      const container = markContainer();
      fixture.detectChanges();
      pinRect(container, { left: 0, top: 0, right: 1000, bottom: 800, width: 1000, height: 800 });
      pinRect(moreButton(), { left: 500, right: 520, top: 300, bottom: 320, width: 20, height: 20 });
      return container;
    }

    it('drops below the trigger when the container has room', () => {
      buildInContainer();

      priv(component).getPopoverPositionStyle();

      expect(component.positionStyle).toEqual({ top: '330px', left: '500px' });
    });

    it('opens sideways when the container has room neither above nor below', () => {
      buildInContainer();
      pinMetrics(subMenu(), { clientWidth: 300, clientHeight: 600 });

      priv(component).getPopoverPositionStyle();

      expect(component.positionStyle).toEqual({ left: '190px', top: '300px' });
    });

    it('resolves the container lazily when it was not resolved on view init', () => {
      // Docs mode positions against the container without the input being set,
      // so ngAfterViewInit never looked the container up.
      utilsHook.docsMode = true;
      fixture = TestBed.createComponent(CometChatContextMenuComponent);
      component = fixture.componentInstance;
      component.data = actions(5);
      const container = markContainer();
      fixture.detectChanges();
      expect(priv(component).parentViewRef).toBeNull();
      pinRect(container, { left: 50, top: 100, right: 1050, bottom: 900, width: 1000, height: 800 });
      pinRect(moreButton(), { left: 500, right: 520, top: 300, bottom: 320, width: 20, height: 20 });

      priv(component).getPopoverPositionStyle();

      expect(priv(component).parentViewRef).toBe(container);
      // Docs mode re-states the offsets relative to the container and switches
      // to absolute positioning.
      expect(component.positionStyle).toEqual({ top: '200px', left: '235px', position: 'absolute' });
    });

    it('leaves the offsets alone when they do not resolve to numbers', () => {
      utilsHook.docsMode = true;
      const container = buildInContainer({ useParentContainer: false });
      pinRect(container, { left: 50, top: 100, right: 1050, bottom: 900 });
      pinRect(moreButton(), { left: NaN, right: NaN, top: NaN, bottom: NaN });

      priv(component).getPopoverPositionStyle();

      expect(component.positionStyle['top']).toBe('NaNpx');
      expect(component.positionStyle['position']).toBeUndefined();
    });

    it('does nothing without a more-button to anchor to', () => {
      build({ data: actions(5), useParentContainer: true });
      priv(component).parentViewRef = document.body;
      priv(component).moreButtonRef = undefined;
      component.positionStyle = { top: 'untouched' };

      priv(component).calculatePopoverPosition();

      expect(component.positionStyle).toEqual({ top: 'untouched' });
    });

    it('does nothing without a container to position inside', () => {
      build({ data: actions(5), useParentContainer: true });
      priv(component).parentViewRef = null;
      component.positionStyle = { top: 'untouched' };

      priv(component).calculatePopoverPosition();

      expect(component.positionStyle).toEqual({ top: 'untouched' });
    });

    it('does nothing when the trigger reports no box', () => {
      const container = buildInContainer();
      moreButton().getBoundingClientRect = () => undefined as unknown as DOMRect;
      pinRect(container, { left: 0, top: 0, right: 1000, bottom: 800 });
      component.positionStyle = { top: 'untouched' };

      priv(component).calculatePopoverPosition();

      expect(component.positionStyle).toEqual({ top: 'untouched' });
    });

    it('does nothing when the container reports no box', () => {
      const container = buildInContainer();
      container.getBoundingClientRect = () => undefined as unknown as DOMRect;
      component.positionStyle = { top: 'untouched' };

      priv(component).calculatePopoverPosition();

      expect(component.positionStyle).toEqual({ top: 'untouched' });
    });
  });

  // -------------------------------------------------------------------------
  // Anchoring to the host box
  // -------------------------------------------------------------------------

  describe('anchoring to the host box', () => {
    function hostRect(overrides: Partial<DOMRect>): void {
      pinRect(priv(component).hostRef.nativeElement, overrides);
    }

    it('leaves the computed offset alone when anchorToHost is off', () => {
      build({ data: actions(5) });
      const style: Record<string, string> = { left: '285px' };

      priv(component).applyHostAnchor(style, 205, null);

      expect(style['left']).toBe('285px');
    });

    it('anchors a left-opening menu to the host right edge', () => {
      setWindowSize(1000, 768);
      build({ data: actions(5), anchorToHost: true });
      hostRect({ left: 860, right: 900, width: 40 });
      const style: Record<string, string> = { left: '285px' };

      priv(component).applyHostAnchor(style, 205, null);

      expect(style['left']).toBe('695px');
    });

    it('anchors a right-opening menu to the host left edge', () => {
      setWindowSize(1000, 768);
      build({ data: actions(5), anchorToHost: true, placement: Placement.right });
      hostRect({ left: 700, right: 740, width: 40 });
      const style: Record<string, string> = {};

      priv(component).applyHostAnchor(style, 205, null);

      expect(style['left']).toBe('700px');
    });

    it('keeps the menu inside the viewport right edge', () => {
      setWindowSize(1000, 768);
      build({ data: actions(5), anchorToHost: true });
      hostRect({ left: 1360, right: 1400, width: 40 });
      const style: Record<string, string> = {};

      priv(component).applyHostAnchor(style, 205, null);

      expect(style['left']).toBe('785px');
    });

    it('keeps the menu inside the viewport left edge', () => {
      setWindowSize(1000, 768);
      build({ data: actions(5), anchorToHost: true });
      hostRect({ left: -500, right: -200, width: 300 });
      const style: Record<string, string> = {};

      priv(component).applyHostAnchor(style, 205, null);

      expect(style['left']).toBe('10px');
    });

    it('clamps to the container edges when positioning inside one', () => {
      build({ data: actions(5), anchorToHost: true });
      hostRect({ left: 50, right: 80, width: 30 });
      const style: Record<string, string> = {};

      priv(component).applyHostAnchor(style, 205, makeRect({ left: 100, right: 600, width: 500 }));

      expect(style['left']).toBe('110px');
    });

    it('does nothing when the host has no box', () => {
      build({ data: actions(5), anchorToHost: true });
      priv(component).hostRef.nativeElement.getBoundingClientRect = () =>
        undefined as unknown as DOMRect;
      const style: Record<string, string> = { left: '285px' };

      priv(component).applyHostAnchor(style, 205, null);

      expect(style['left']).toBe('285px');
    });

    it('overrides the viewport offset when the dropdown is positioned', () => {
      setWindowSize(1000, 768);
      build({ data: actions(5), anchorToHost: true });
      pinRect(moreButton(), { left: 500, right: 520, top: 300, bottom: 320, width: 20, height: 20 });
      hostRect({ left: 860, right: 900, top: 300, bottom: 320, width: 40, height: 20 });

      priv(component).getPopoverPositionStyle();

      // The vertical offset is untouched; only the sideways one is re-anchored.
      expect(component.positionStyle).toEqual({ left: '695px', top: '290px' });
    });

    it('overrides the container offset too', () => {
      fixture = TestBed.createComponent(CometChatContextMenuComponent);
      component = fixture.componentInstance;
      Object.assign(component, { data: actions(5), useParentContainer: true, anchorToHost: true });
      const container = markContainer();
      fixture.detectChanges();
      pinRect(container, { left: 0, top: 0, right: 1000, bottom: 800, width: 1000, height: 800 });
      pinRect(moreButton(), { left: 500, right: 520, top: 300, bottom: 320, width: 20, height: 20 });
      hostRect({ left: 460, right: 520, top: 300, bottom: 320, width: 60, height: 20 });

      priv(component).getPopoverPositionStyle();

      expect(component.positionStyle).toEqual({ top: '330px', left: '315px' });
    });
  });

  // -------------------------------------------------------------------------
  // Taking the height from the parent
  // -------------------------------------------------------------------------

  describe('sizing the dropdown from the parent', () => {
    function buildForHeight(inputs: Partial<CometChatContextMenuComponent> = {}) {
      setWindowSize(1000, 768);
      build({ data: actions(5), useParentHeight: true, ...inputs });
      pinRect(moreButton(), { left: 400, right: 440, top: 200, bottom: 230, width: 40, height: 30 });
      pinMetrics(subMenu(), { scrollWidth: 200, scrollHeight: 300 });
    }

    it('centres the dropdown on the trigger across the viewport', () => {
      buildForHeight();

      priv(component).getPopoverPositionStyle();

      // 400 + 40/2 - 200/2
      expect(component.positionStyle).toEqual({ left: '320px' });
    });

    it('places it above the trigger when the placement asks for it', () => {
      buildForHeight({ placement: Placement.top });

      priv(component).getPopoverPositionStyle();

      expect(component.positionStyle).toEqual({ top: '-110px', left: '320px' });
    });

    it('keeps it inside the container when one is resolved', () => {
      buildForHeight();
      const container = document.createElement('div');
      pinRect(container, { left: 500, right: 900, top: 0, bottom: 800, width: 400, height: 800 });
      priv(component).parentViewRef = container;

      priv(component).setMenuHeight();

      expect(component.positionStyle).toEqual({ left: '510px' });
    });

    it('stands in for a missing container with a full viewport-sized rect', () => {
      buildForHeight();
      let handed: DOMRect | null = null;
      utilsHook.onCalculate = parentRect => {
        handed = parentRect;
      };

      priv(component).setMenuHeight();

      expect(handed).not.toBeNull();
      const rect = handed as unknown as DOMRect;
      expect(rect.left).toBe(0);
      expect(rect.top).toBe(0);
      expect(rect.right).toBe(1000);
      expect(rect.bottom).toBe(768);
      expect(rect.width).toBe(1000);
      expect(rect.height).toBe(768);
      // The stand-in has to satisfy the whole DOMRect contract, serialisation
      // included, because it is handed to code that only knows DOMRect.
      expect(rect.toJSON()).toEqual({});
    });

    it('does nothing without a dropdown to measure', () => {
      buildForHeight();
      priv(component).subMenuRef = undefined;
      component.positionStyle = { top: 'untouched' };

      priv(component).setMenuHeight();

      expect(component.positionStyle).toEqual({ top: 'untouched' });
    });

    it('does nothing without a trigger to centre on', () => {
      build({ data: actions(2), topMenuSize: 3, useParentHeight: true });
      component.positionStyle = { top: 'untouched' };

      priv(component).setMenuHeight();

      expect(component.positionStyle).toEqual({ top: 'untouched' });
    });
  });

  // -------------------------------------------------------------------------
  // Small helpers used by the template
  // -------------------------------------------------------------------------

  describe('template helpers', () => {
    it('reports the index of an item within the dropdown list', () => {
      const data = actions(5);
      build({ data });

      expect(component.getSubMenuItemIndex(data[1])).toBe(0);
      expect(component.getSubMenuItemIndex(data[4])).toBe(3);
      // A top-menu item is not part of the dropdown list.
      expect(component.getSubMenuItemIndex(data[0])).toBe(-1);
    });

    it('acts on a plain option that carries no click handler', () => {
      const option = new CometChatOption({ id: 'mute', title: 'Mute' });
      build({ data: [...actions(1), option] as ContextMenuItem[] });
      const clicks = collect(component.optionClick);
      component.handleMenuClick();

      component.onMenuItemClick(option);

      expect(clicks).toEqual([option]);
      expect(component.showSubMenu).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // Splitting the data into the two lists
  // -------------------------------------------------------------------------

  describe('splitting data between the row and the dropdown', () => {
    it('puts every item in the dropdown when no room is given to the row', () => {
      const data = actions(3);
      build({ data, topMenuSize: 0 });

      expect(component.topMenu).toEqual([]);
      expect(component.subMenu).toEqual(data);
      expect(component.shouldShowMoreButton).toBe(true);
      expect(fixture!.nativeElement.querySelectorAll('.cometchat-menu-list__main-menu-item').length)
        .toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // Items the template renders specially
  // -------------------------------------------------------------------------

  describe('custom-view items', () => {
    /** A stand-in for the template an app would hand over; only its presence is read. */
    const stubTemplate = () => ({ createEmbeddedView: () => null }) as unknown as TemplateRef<unknown>;

    it('recognises an actions-view that brings its own template', () => {
      const view = new CometChatActionsView({
        id: 'poll',
        title: 'Poll',
        customView: stubTemplate(),
      });
      build({ data: [view] as ContextMenuItem[] });

      expect(component.isActionsView(view)).toBe(true);
    });

    it('does not treat an actions-view with no template as a custom view', () => {
      const view = new CometChatActionsView({ id: 'poll', title: 'Poll' });
      build({ data: [view] as ContextMenuItem[] });

      expect(component.isActionsView(view)).toBe(false);
    });

    it('does not treat an ordinary action as a custom view', () => {
      const plain = actions(1)[0];
      build({ data: [plain] });

      expect(component.isActionsView(plain)).toBe(false);
    });
  });

  describe('rendering an item that leaves its fields empty', () => {
    /** id, title and iconURL all default to '' on CometChatOption. */
    const bare = () => new CometChatOption({});

    it('asks for no icon mask when the item has no icon', () => {
      const item = bare();
      build({ data: [item] as ContextMenuItem[], topMenuSize: 0 });

      expect(component.getIconStyle(item)).toEqual({});
    });

    it('builds a mask from the icon URL when the item has one', () => {
      const item = actions(1)[0];
      build({ data: [item], topMenuSize: 0 });

      expect(component.getIconStyle(item)).toEqual({
        '-webkit-mask': 'url(action-0.svg) center center no-repeat',
        '-webkit-mask-size': 'contain',
        display: 'flex',
      });
    });

    it('renders an empty id and title rather than "undefined"', () => {
      const item = new CometChatOption({ id: undefined, title: undefined });
      build({ data: [item] as ContextMenuItem[], topMenuSize: 0 });

      expect(component.getItemId(item)).toBe('');
      expect(component.getItemTitle(item)).toBe('');
      const row = fixture!.nativeElement.querySelector('.cometchat-menu-list__sub-menu-list-item');
      expect(row.getAttribute('id')).toBe('');
      expect(row.getAttribute('aria-label')).toBe('');
    });

    it('falls back to the title to track an item with no id', () => {
      const item = new CometChatOption({ title: 'Mute' });

      build({ data: [item] as ContextMenuItem[] });

      expect(component.trackByItem(0, item)).toBe('Mute');
    });

    it('falls back to the position to track an item with neither', () => {
      const item = bare();

      build({ data: [item] as ContextMenuItem[] });

      expect(component.trackByItem(4, item)).toBe('4');
    });

    it('tracks by id when the item has one', () => {
      const item = actions(1)[0];

      build({ data: [item] });

      expect(component.trackByItem(0, item)).toBe('action-0');
    });
  });

  describe('aligning a flyout that is not on screen', () => {
    it('leaves the placement alone when the group has no flyout rendered', () => {
      // openGroup is public and takes any item: a childless one sets the open id
      // but renders no flyout, so there is nothing to measure.
      const plain = actions(1)[0];
      build({ data: actions(3) });
      component.handleMenuClick();
      fixture!.detectChanges();
      component.groupFlyoutShift = 99;

      component.openGroup(plain);

      expect(component.openGroupId).toBe('action-0');
      expect(priv(component).groupFlyoutRef).toBeUndefined();
      // Reset by openGroup, then left untouched because there was no flyout.
      expect(component.groupFlyoutShift).toBeNull();
      expect(component.groupFlyoutFlipped).toBe(false);
    });
  });
});
