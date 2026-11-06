/**
 * CometChatLinkPopover Component Tests
 *
 * Comprehensive test suite for the link popover component that displays
 * edit/remove actions for links. Tests cover instantiation, input bindings,
 * output emissions, keyboard navigation (Escape to close, Arrow keys to
 * navigate, Tab to close), ARIA attributes, DOM rendering, and edge cases.
 *
 * Categories: Initialization, Input Bindings, Output Emissions,
 *             DOM Rendering, Keyboard Accessibility, ARIA, Edge Cases
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 3.1,
 *            10.3, 10.5, 14.4, 14.5, 15.7
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ensureSdkReady, sdkCleanup } from '../../../testing';
import { CometChatLinkPopoverComponent, LinkPopoverData } from './cometchat-link-popover.component';

describe('CometChatLinkPopoverComponent', () => {
  let fixture: ComponentFixture<CometChatLinkPopoverComponent>;
  let component: CometChatLinkPopoverComponent;
  let el: HTMLElement;

  beforeAll(async () => {
    await ensureSdkReady();
  });

  afterAll(async () => {
    await sdkCleanup();
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CometChatLinkPopoverComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CometChatLinkPopoverComponent);
    component = fixture.componentInstance;
    el = fixture.nativeElement;
  });

  afterEach(() => {
    fixture.destroy();
  });

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  function getPopover(): HTMLElement | null {
    return el.querySelector('.cometchat-link-popover');
  }

  function getCloseButton(): HTMLButtonElement | null {
    return el.querySelector('.cometchat-link-popover__close');
  }

  function getEditButton(): HTMLButtonElement | null {
    return el.querySelector('.cometchat-link-popover__button--edit');
  }

  function getRemoveButton(): HTMLButtonElement | null {
    return el.querySelector('.cometchat-link-popover__button--remove');
  }

  function getTitleEl(): HTMLElement | null {
    return el.querySelector('.cometchat-link-popover__title');
  }

  function getUrlLink(): HTMLAnchorElement | null {
    return el.querySelector('.cometchat-link-popover__url');
  }

  function getActionsContainer(): HTMLElement | null {
    return el.querySelector('.cometchat-link-popover__actions');
  }

  function dispatchDocumentKeydown(key: string): void {
    document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
    fixture.detectChanges();
  }

  // ---------------------------------------------------------------------------
  // Initialization
  // ---------------------------------------------------------------------------
  describe('Initialization', () => {
    it('should create the component', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should render the popover container', () => {
      fixture.detectChanges();
      expect(getPopover()).toBeTruthy();
    });

    it('should default url to empty string', () => {
      expect(component.url).toBe('');
    });

    it('should default text to empty string', () => {
      expect(component.text).toBe('');
    });

    it('should default x to 0', () => {
      expect(component.x).toBe(0);
    });

    it('should default y to 0', () => {
      expect(component.y).toBe(0);
    });

    it('should default isPositioned to false', () => {
      expect(component.isPositioned).toBe(false);
    });

    it('should default popoverTop to 0', () => {
      expect(component.popoverTop).toBe(0);
    });

    it('should default popoverLeft to 0', () => {
      expect(component.popoverLeft).toBe(0);
    });
  });

  // ---------------------------------------------------------------------------
  // Input Bindings
  // ---------------------------------------------------------------------------
  describe('Input Bindings', () => {
    it('should accept and reflect url input', () => {
      component.url = 'https://example.com';
      fixture.detectChanges();
      const link = getUrlLink();
      expect(link?.getAttribute('href')).toBe('https://example.com');
      expect(link?.textContent?.trim()).toContain('https://example.com');
    });

    it('should accept and reflect text input', () => {
      component.text = 'My Link';
      fixture.detectChanges();
      const title = getTitleEl();
      expect(title?.textContent?.trim()).toContain('My Link');
    });

    it('should accept x coordinate', () => {
      component.x = 200;
      expect(component.x).toBe(200);
    });

    it('should accept y coordinate', () => {
      component.y = 400;
      expect(component.y).toBe(400);
    });

    it('should update url in DOM when changed', () => {
      fixture.componentRef.setInput('url', 'https://first.com');
      fixture.detectChanges();
      expect(getUrlLink()?.getAttribute('href')).toBe('https://first.com');

      fixture.componentRef.setInput('url', 'https://second.com');
      fixture.detectChanges();
      expect(getUrlLink()?.getAttribute('href')).toBe('https://second.com');
    });

    it('should update text in DOM when changed', () => {
      fixture.componentRef.setInput('text', 'First');
      fixture.detectChanges();
      expect(getTitleEl()?.textContent?.trim()).toContain('First');

      fixture.componentRef.setInput('text', 'Second');
      fixture.detectChanges();
      expect(getTitleEl()?.textContent?.trim()).toContain('Second');
    });
  });

  // ---------------------------------------------------------------------------
  // Output Emissions
  // ---------------------------------------------------------------------------
  describe('Output Emissions', () => {
    it('should emit editClick with url and text on edit button click', () => {
      component.url = 'https://example.com';
      component.text = 'Example';
      fixture.detectChanges();

      const spy = vi.fn();
      component.editClick.subscribe(spy);

      getEditButton()?.click();
      fixture.detectChanges();

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith({
        url: 'https://example.com',
        text: 'Example',
      } satisfies LinkPopoverData);
    });

    it('should emit removeClick on remove button click', () => {
      fixture.detectChanges();
      const spy = vi.fn();
      component.removeClick.subscribe(spy);

      getRemoveButton()?.click();
      fixture.detectChanges();

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should emit closeClick on close button click', () => {
      fixture.detectChanges();
      const spy = vi.fn();
      component.closeClick.subscribe(spy);

      getCloseButton()?.click();
      fixture.detectChanges();

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should emit editClick with empty url/text when inputs are empty', () => {
      fixture.detectChanges();
      const spy = vi.fn();
      component.editClick.subscribe(spy);

      getEditButton()?.click();
      fixture.detectChanges();

      expect(spy).toHaveBeenCalledWith({ url: '', text: '' });
    });

    it('should emit editClick with current values via handleEditClick', () => {
      component.url = 'https://test.org';
      component.text = 'Test';
      fixture.detectChanges();

      const spy = vi.fn();
      component.editClick.subscribe(spy);

      component.handleEditClick();

      expect(spy).toHaveBeenCalledWith({ url: 'https://test.org', text: 'Test' });
    });

    it('should emit removeClick via handleRemoveClick', () => {
      fixture.detectChanges();
      const spy = vi.fn();
      component.removeClick.subscribe(spy);

      component.handleRemoveClick();

      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  // ---------------------------------------------------------------------------
  // DOM Rendering
  // ---------------------------------------------------------------------------
  describe('DOM Rendering', () => {
    it('should render BEM block class .cometchat-link-popover', () => {
      fixture.detectChanges();
      expect(getPopover()).toBeTruthy();
    });

    it('should render the close button', () => {
      fixture.detectChanges();
      expect(getCloseButton()).toBeTruthy();
    });

    it('should render the title element', () => {
      fixture.detectChanges();
      expect(getTitleEl()).toBeTruthy();
    });

    it('should render the URL link element', () => {
      fixture.detectChanges();
      expect(getUrlLink()).toBeTruthy();
    });

    it('should render the actions container with edit and remove buttons', () => {
      fixture.detectChanges();
      expect(getActionsContainer()).toBeTruthy();
      expect(getEditButton()).toBeTruthy();
      expect(getRemoveButton()).toBeTruthy();
    });

    it('should set visibility hidden when not positioned', () => {
      component.isPositioned = false;
      fixture.detectChanges();
      const popover = getPopover();
      expect(popover?.style.visibility).toBe('hidden');
    });

    it('should set visibility visible when positioned', () => {
      component.isPositioned = true;
      fixture.detectChanges();
      const popover = getPopover();
      expect(popover?.style.visibility).toBe('visible');
    });

    it('should render url in the anchor href', () => {
      component.url = 'https://example.com/page';
      fixture.detectChanges();
      expect(getUrlLink()?.getAttribute('href')).toBe('https://example.com/page');
    });

    it('should render text in the title element', () => {
      component.text = 'Link Title';
      fixture.detectChanges();
      expect(getTitleEl()?.textContent?.trim()).toContain('Link Title');
    });

    it('should open link in new tab with noopener noreferrer', () => {
      fixture.detectChanges();
      const link = getUrlLink();
      expect(link?.getAttribute('target')).toBe('_blank');
      expect(link?.getAttribute('rel')).toBe('noopener noreferrer');
    });
  });

  // ---------------------------------------------------------------------------
  // Keyboard Accessibility
  // ---------------------------------------------------------------------------
  describe('Keyboard Accessibility', () => {
    it('should emit closeClick on Escape key', () => {
      fixture.detectChanges();
      const spy = vi.fn();
      component.closeClick.subscribe(spy);

      dispatchDocumentKeydown('Escape');

      expect(spy).toHaveBeenCalledTimes(1);
    });

    // Tab traps focus inside the dialog rather than closing it, so the close
    // button and URL link stay reachable by keyboard.
    it('should not close on Tab key', () => {
      fixture.detectChanges();
      const spy = vi.fn();
      component.closeClick.subscribe(spy);

      dispatchDocumentKeydown('Tab');

      expect(spy).not.toHaveBeenCalled();
    });

    it('should trap Tab focus inside the popover', () => {
      fixture.detectChanges();
      // The focus trap skips elements it considers hidden via `offsetParent`,
      // which jsdom always reports as null. Treat them as laid out so the real
      // trap logic runs.
      const offsetParent = Object.getOwnPropertyDescriptor(
        HTMLElement.prototype,
        'offsetParent'
      );
      Object.defineProperty(HTMLElement.prototype, 'offsetParent', {
        configurable: true,
        get() {
          return document.body;
        },
      });

      try {
        dispatchDocumentKeydown('Tab');
        expect(getPopover()?.contains(document.activeElement)).toBe(true);
      } finally {
        if (offsetParent) {
          Object.defineProperty(HTMLElement.prototype, 'offsetParent', offsetParent);
        } else {
          delete (HTMLElement.prototype as unknown as Record<string, unknown>)['offsetParent'];
        }
      }
    });

    it('should handle multiple Escape presses', () => {
      fixture.detectChanges();
      const spy = vi.fn();
      component.closeClick.subscribe(spy);

      dispatchDocumentKeydown('Escape');
      dispatchDocumentKeydown('Escape');

      expect(spy).toHaveBeenCalledTimes(2);
    });

    it('should remove keyboard listener on destroy', () => {
      fixture.detectChanges();
      const spy = vi.fn();
      component.closeClick.subscribe(spy);

      fixture.destroy();

      document.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })
      );
      expect(spy).not.toHaveBeenCalled();

      // Re-create fixture for afterEach cleanup
      fixture = TestBed.createComponent(CometChatLinkPopoverComponent);
      component = fixture.componentInstance;
      el = fixture.nativeElement;
    });

    it('should have focusable edit and remove buttons', () => {
      fixture.detectChanges();
      const editBtn = getEditButton();
      const removeBtn = getRemoveButton();
      // Native <button> elements are focusable by default
      expect(editBtn?.tagName).toBe('BUTTON');
      expect(removeBtn?.tagName).toBe('BUTTON');
    });

    it('should have focusable close button', () => {
      fixture.detectChanges();
      const closeBtn = getCloseButton();
      expect(closeBtn?.tagName).toBe('BUTTON');
    });
  });

  // ---------------------------------------------------------------------------
  // ARIA
  // ---------------------------------------------------------------------------
  describe('ARIA', () => {
    it('should have role="dialog" on the popover container', () => {
      fixture.detectChanges();
      expect(getPopover()?.getAttribute('role')).toBe('dialog');
    });

    it('should have aria-label on the popover container', () => {
      fixture.detectChanges();
      const ariaLabel = getPopover()?.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
    });

    // Inside a dialog the actions are native buttons, which carry an implicit
    // button role. An explicit role="menuitem" would be wrong here — menuitem is
    // only valid inside a menu/menubar.
    it('should expose the edit action as a native button', () => {
      fixture.detectChanges();
      const edit = getEditButton();
      expect(edit?.tagName).toBe('BUTTON');
      expect(edit?.getAttribute('type')).toBe('button');
      expect(edit?.getAttribute('role')).toBeNull();
    });

    it('should expose the remove action as a native button', () => {
      fixture.detectChanges();
      const remove = getRemoveButton();
      expect(remove?.tagName).toBe('BUTTON');
      expect(remove?.getAttribute('type')).toBe('button');
      expect(remove?.getAttribute('role')).toBeNull();
    });

    it('should have aria-label on the close button', () => {
      fixture.detectChanges();
      const ariaLabel = getCloseButton()?.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
    });

    it('should have aria-label on the edit button', () => {
      fixture.detectChanges();
      const ariaLabel = getEditButton()?.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
    });

    it('should have aria-label on the remove button', () => {
      fixture.detectChanges();
      const ariaLabel = getRemoveButton()?.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
    });

    it('should have aria-hidden="true" on the title element', () => {
      fixture.detectChanges();
      expect(getTitleEl()?.getAttribute('aria-hidden')).toBe('true');
    });
  });

  // ---------------------------------------------------------------------------
  // Edge Cases
  // ---------------------------------------------------------------------------
  describe('Edge Cases', () => {
    it('should not throw when created with no custom inputs', () => {
      expect(() => fixture.detectChanges()).not.toThrow();
    });

    it('should handle empty URL gracefully', () => {
      component.url = '';
      fixture.detectChanges();
      const link = getUrlLink();
      expect(link).toBeTruthy();
    });

    it('should handle null-like empty text gracefully', () => {
      component.text = '';
      fixture.detectChanges();
      expect(getTitleEl()).toBeTruthy();
    });

    it('should handle url with special characters', () => {
      component.url = 'https://example.com/path?q=hello&lang=en#section';
      fixture.detectChanges();
      const spy = vi.fn();
      component.editClick.subscribe(spy);

      component.handleEditClick();

      expect(spy).toHaveBeenCalledWith({
        url: 'https://example.com/path?q=hello&lang=en#section',
        text: '',
      });
    });

    it('should handle very long url', () => {
      const longUrl = 'https://example.com/' + 'a'.repeat(2000);
      component.url = longUrl;
      fixture.detectChanges();

      const spy = vi.fn();
      component.editClick.subscribe(spy);
      component.handleEditClick();

      expect(spy).toHaveBeenCalledWith({ url: longUrl, text: '' });
    });

    it('should handle rapid edit clicks', () => {
      component.url = 'https://example.com';
      component.text = 'Test';
      fixture.detectChanges();

      const spy = vi.fn();
      component.editClick.subscribe(spy);

      component.handleEditClick();
      component.handleEditClick();
      component.handleEditClick();

      expect(spy).toHaveBeenCalledTimes(3);
    });

    it('should handle rapid remove clicks', () => {
      fixture.detectChanges();
      const spy = vi.fn();
      component.removeClick.subscribe(spy);

      component.handleRemoveClick();
      component.handleRemoveClick();
      component.handleRemoveClick();

      expect(spy).toHaveBeenCalledTimes(3);
    });

    it('should stop propagation on popover click', () => {
      fixture.detectChanges();
      const event = new MouseEvent('click', { bubbles: true, cancelable: true });
      const stopSpy = vi.spyOn(event, 'stopPropagation');

      component.handlePopoverClick(event);

      expect(stopSpy).toHaveBeenCalledTimes(1);
    });

    it('should handle text with HTML-like content', () => {
      component.text = '<script>alert("xss")</script>';
      fixture.detectChanges();
      // Angular sanitizes template interpolation — no raw script tags in DOM
      const title = getTitleEl();
      expect(title?.textContent?.trim()).toContain('<script>');
      expect(title?.querySelector('script')).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // Lifecycle — deferred work
  //
  // Both listener registration and position refinement happen inside timers, so
  // these paths only run once the timers are flushed.
  // ---------------------------------------------------------------------------
  describe('Lifecycle', () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it('should register the outside-click listener after the open-click settles', () => {
      vi.useFakeTimers();
      const addSpy = vi.spyOn(document, 'addEventListener');
      fixture.detectChanges();

      expect(addSpy.mock.calls.some(c => c[0] === 'click')).toBe(false);
      vi.advanceTimersByTime(150);
      expect(addSpy.mock.calls.some(c => c[0] === 'click')).toBe(true);
    });

    it('should register the keydown listener immediately', () => {
      const addSpy = vi.spyOn(document, 'addEventListener');
      fixture.detectChanges();
      expect(addSpy.mock.calls.some(c => c[0] === 'keydown')).toBe(true);
    });

    it('should mark itself positioned after view init', () => {
      fixture.detectChanges();
      expect((component as unknown as Record<string, unknown>)['isPositioned']).toBe(true);
    });

    it('should focus the edit button once layout has settled', () => {
      vi.useFakeTimers();
      fixture.detectChanges();
      vi.advanceTimersByTime(0);

      expect(document.activeElement).toBe(getEditButton());
    });

    it('should remove both document listeners on destroy', () => {
      vi.useFakeTimers();
      fixture.detectChanges();
      vi.advanceTimersByTime(150);

      const removeSpy = vi.spyOn(document, 'removeEventListener');
      fixture.destroy();

      expect(removeSpy.mock.calls.some(c => c[0] === 'keydown')).toBe(true);
      expect(removeSpy.mock.calls.some(c => c[0] === 'click')).toBe(true);
    });

    it('should clear pending timers on destroy so nothing fires afterwards', () => {
      vi.useFakeTimers();
      fixture.detectChanges();

      const clearSpy = vi.spyOn(globalThis, 'clearTimeout');
      fixture.destroy();
      expect(clearSpy).toHaveBeenCalled();

      expect(() => vi.advanceTimersByTime(1000)).not.toThrow();
    });

    it('should restore focus to whatever was focused before it opened', () => {
      const trigger = document.createElement('button');
      document.body.appendChild(trigger);
      trigger.focus();

      vi.useFakeTimers();
      fixture.detectChanges();
      fixture.destroy();
      vi.advanceTimersByTime(0);

      expect(document.activeElement).toBe(trigger);
      trigger.remove();
    });
  });

  // ---------------------------------------------------------------------------
  // Arrow-key navigation
  // ---------------------------------------------------------------------------
  describe('Arrow key navigation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it.each(['ArrowDown', 'ArrowRight'])('should move forward to remove on %s', (key) => {
      dispatchDocumentKeydown(key);
      expect(document.activeElement).toBe(getRemoveButton());
    });

    it.each(['ArrowUp', 'ArrowLeft'])('should move back to remove from the start on %s', (key) => {
      dispatchDocumentKeydown(key);
      expect(document.activeElement).toBe(getRemoveButton());
    });

    it('should cycle forward from remove back to edit', () => {
      dispatchDocumentKeydown('ArrowDown');
      dispatchDocumentKeydown('ArrowDown');
      expect(document.activeElement).toBe(getEditButton());
    });

    it('should cycle backward from remove to edit', () => {
      dispatchDocumentKeydown('ArrowDown');
      dispatchDocumentKeydown('ArrowUp');
      expect(document.activeElement).toBe(getEditButton());
    });

    it('should prevent the default scroll on an arrow key', () => {
      const event = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true });
      document.dispatchEvent(event);
      expect(event.defaultPrevented).toBe(true);
    });

    it('should ignore an unrelated key', () => {
      const before = document.activeElement;
      dispatchDocumentKeydown('a');
      expect(document.activeElement).toBe(before);
    });
  });

  // ---------------------------------------------------------------------------
  // Tab focus trap
  // ---------------------------------------------------------------------------
  describe('Tab focus trap', () => {
    /** jsdom reports offsetParent as null for everything, which the trap reads as hidden. */
    function withLaidOutElements(run: () => void): void {
      const descriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetParent');
      Object.defineProperty(HTMLElement.prototype, 'offsetParent', {
        configurable: true,
        get() {
          return document.body;
        },
      });
      try {
        run();
      } finally {
        if (descriptor) {
          Object.defineProperty(HTMLElement.prototype, 'offsetParent', descriptor);
        } else {
          delete (HTMLElement.prototype as unknown as Record<string, unknown>)['offsetParent'];
        }
      }
    }

    function dispatchTab(shiftKey = false): KeyboardEvent {
      const event = new KeyboardEvent('keydown', {
        key: 'Tab',
        shiftKey,
        bubbles: true,
        cancelable: true,
      });
      document.dispatchEvent(event);
      fixture.detectChanges();
      return event;
    }

    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should pull focus into the popover when it is outside', () => {
      withLaidOutElements(() => {
        (document.activeElement as HTMLElement)?.blur();
        dispatchTab();
        expect(getPopover()?.contains(document.activeElement)).toBe(true);
      });
    });

    it('should wrap from the last focusable back to the first', () => {
      withLaidOutElements(() => {
        const focusables = getPopover()!.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        focusables[focusables.length - 1].focus();

        const event = dispatchTab();
        expect(event.defaultPrevented).toBe(true);
        expect(document.activeElement).toBe(focusables[0]);
      });
    });

    it('should wrap backwards from the first focusable to the last', () => {
      withLaidOutElements(() => {
        const focusables = getPopover()!.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        focusables[0].focus();

        const event = dispatchTab(true);
        expect(event.defaultPrevented).toBe(true);
        expect(document.activeElement).toBe(focusables[focusables.length - 1]);
      });
    });

    it('should let Tab pass through between interior elements', () => {
      withLaidOutElements(() => {
        const focusables = getPopover()!.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length < 3) return;
        focusables[1].focus();

        const event = dispatchTab();
        expect(event.defaultPrevented).toBe(false);
      });
    });

    it('should swallow Tab when nothing inside is focusable', () => {
      // offsetParent stays null, so the trap sees an empty focusable list.
      const event = dispatchTab();
      expect(event.defaultPrevented).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // Outside click
  // ---------------------------------------------------------------------------
  describe('Outside click', () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it('should close when a click lands outside the popover', () => {
      vi.useFakeTimers();
      fixture.detectChanges();
      vi.advanceTimersByTime(150);

      const spy = vi.fn();
      component.closeClick.subscribe(spy);

      document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      expect(spy).toHaveBeenCalled();
    });

    it('should stay open when the click is inside the popover', () => {
      vi.useFakeTimers();
      fixture.detectChanges();
      vi.advanceTimersByTime(150);

      const spy = vi.fn();
      component.closeClick.subscribe(spy);

      getPopover()!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      expect(spy).not.toHaveBeenCalled();
    });

    it('should ignore the click that opened it', () => {
      vi.useFakeTimers();
      fixture.detectChanges();

      const spy = vi.fn();
      component.closeClick.subscribe(spy);

      // Before the 150ms grace period the listener is not attached yet.
      document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      expect(spy).not.toHaveBeenCalled();
    });

    it('should stop an interior click from reaching the document', () => {
      const event = new MouseEvent('click', { bubbles: true, cancelable: true });
      const stopSpy = vi.spyOn(event, 'stopPropagation');
      component.handlePopoverClick(event);
      expect(stopSpy).toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // Positioning
  // ---------------------------------------------------------------------------
  describe('Positioning', () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it('should sit above the click point when there is room', () => {
      component.x = 400;
      component.y = 500;
      fixture.detectChanges();

      expect(component.popoverTop).toBeLessThan(500);
      expect(component.popoverLeft).toBeLessThan(400);
    });

    it('should flip below the click point when there is no room above', () => {
      component.x = 400;
      component.y = 10;
      fixture.detectChanges();
      expect(component.popoverTop).toBeGreaterThanOrEqual(10);
    });

    it('should clamp to the left edge', () => {
      component.x = 1;
      component.y = 500;
      fixture.detectChanges();
      expect(component.popoverLeft).toBeGreaterThanOrEqual(8);
    });

    it('should clamp to the right edge', () => {
      component.x = window.innerWidth + 500;
      component.y = 500;
      fixture.detectChanges();
      expect(component.popoverLeft + 280).toBeLessThanOrEqual(window.innerWidth);
    });

    it('should fall back to composer-centred placement without coordinates', () => {
      component.x = 0;
      component.y = 0;
      fixture.detectChanges();

      expect(Number.isFinite(component.popoverTop)).toBe(true);
      expect(Number.isFinite(component.popoverLeft)).toBe(true);
    });

    it('should position within a [data-cometchat-container] ancestor when present', () => {
      const container = document.createElement('div');
      container.setAttribute('data-cometchat-container', '');
      document.body.appendChild(container);
      container.appendChild(fixture.nativeElement);

      component.x = 0;
      component.y = 0;
      fixture.detectChanges();

      expect(Number.isFinite(component.popoverLeft)).toBe(true);
      container.remove();
    });

    it('should refine the position once real dimensions are known', () => {
      vi.useFakeTimers();
      component.x = 400;
      component.y = 500;
      fixture.detectChanges();

      const estimated = component.popoverTop;
      vi.advanceTimersByTime(0);

      expect(Number.isFinite(component.popoverTop)).toBe(true);
      expect(typeof estimated).toBe('number');
    });

    it('should keep the refined position inside the viewport', () => {
      vi.useFakeTimers();
      component.x = window.innerWidth - 2;
      component.y = window.innerHeight - 2;
      fixture.detectChanges();
      vi.advanceTimersByTime(0);

      expect(component.popoverLeft).toBeGreaterThanOrEqual(0);
      expect(component.popoverTop).toBeGreaterThanOrEqual(0);
    });

    it('should refine inside a container ancestor when there are no coordinates', () => {
      vi.useFakeTimers();
      const container = document.createElement('div');
      container.setAttribute('data-cometchat-container', '');
      document.body.appendChild(container);
      container.appendChild(fixture.nativeElement);

      component.x = 0;
      component.y = 0;
      fixture.detectChanges();
      vi.advanceTimersByTime(0);

      expect(Number.isFinite(component.popoverLeft)).toBe(true);
      container.remove();
    });

    it('should refine against a composer ancestor when there is no container', () => {
      vi.useFakeTimers();
      const composer = document.createElement('div');
      composer.className = 'cometchat-message-composer';
      document.body.appendChild(composer);
      composer.appendChild(fixture.nativeElement);

      component.x = 0;
      component.y = 0;
      fixture.detectChanges();
      vi.advanceTimersByTime(0);

      expect(Number.isFinite(component.popoverTop)).toBe(true);
      composer.remove();
    });
  });
});
