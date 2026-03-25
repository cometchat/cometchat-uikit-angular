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

    it('should emit closeClick on Tab key', () => {
      fixture.detectChanges();
      const spy = vi.fn();
      component.closeClick.subscribe(spy);

      dispatchDocumentKeydown('Tab');

      expect(spy).toHaveBeenCalledTimes(1);
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
    it('should have role="menu" on the popover container', () => {
      fixture.detectChanges();
      expect(getPopover()?.getAttribute('role')).toBe('menu');
    });

    it('should have aria-label on the popover container', () => {
      fixture.detectChanges();
      const ariaLabel = getPopover()?.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
    });

    it('should have role="menuitem" on the edit button', () => {
      fixture.detectChanges();
      expect(getEditButton()?.getAttribute('role')).toBe('menuitem');
    });

    it('should have role="menuitem" on the remove button', () => {
      fixture.detectChanges();
      expect(getRemoveButton()?.getAttribute('role')).toBe('menuitem');
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
});
