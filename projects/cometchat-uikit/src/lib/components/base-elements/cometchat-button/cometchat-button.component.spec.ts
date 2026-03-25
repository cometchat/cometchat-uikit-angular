/**
 * CometChatButton Component Tests
 *
 * Comprehensive test suite for the button component that supports text,
 * icon, loading state, disabled state, keyboard activation (Enter/Space),
 * and ARIA accessibility attributes.
 *
 * Categories: Initialization, Input Bindings, Output Emissions,
 *             DOM Rendering, Keyboard Accessibility, ARIA,
 *             Disabled / Loading States, Edge Cases
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 2.4, 3.1, 3.5,
 *            10.1, 10.2, 10.5, 14.4, 14.5, 15.7
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ensureSdkReady, sdkCleanup } from '../../../testing';
import { CometChatButtonComponent } from './cometchat-button.component';

describe('CometChatButtonComponent', () => {
  let fixture: ComponentFixture<CometChatButtonComponent>;
  let component: CometChatButtonComponent;
  let el: HTMLElement;

  beforeAll(async () => {
    await ensureSdkReady();
  });

  afterAll(async () => {
    await sdkCleanup();
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CometChatButtonComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CometChatButtonComponent);
    component = fixture.componentInstance;
    el = fixture.nativeElement;
  });

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  function getButton(): HTMLButtonElement | null {
    return el.querySelector('button.cometchat-button');
  }

  function dispatchKeydown(key: string, target?: HTMLElement): void {
    const event = new KeyboardEvent('keydown', {
      key,
      bubbles: true,
      cancelable: true,
    });
    (target ?? getButton()!).dispatchEvent(event);
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

    it('should have default undefined text', () => {
      expect(component.text).toBeUndefined();
    });

    it('should have default undefined iconURL', () => {
      expect(component.iconURL).toBeUndefined();
    });

    it('should have default undefined disabled', () => {
      expect(component.disabled).toBeUndefined();
    });

    it('should have default isLoading as false', () => {
      expect(component.isLoading).toBe(false);
    });

    it('should have default iconOnly as false', () => {
      expect(component.iconOnly).toBe(false);
    });

    it('should not be disabled by default', () => {
      expect(component.isDisabled).toBe(false);
    });

    it('should render the root .cometchat-button__wrapper wrapper', () => {
      fixture.detectChanges();
      expect(el.querySelector('.cometchat-button__wrapper')).toBeTruthy();
    });

    it('should render a native button element', () => {
      fixture.detectChanges();
      const btn = getButton();
      expect(btn).toBeTruthy();
      expect(btn?.tagName).toBe('BUTTON');
    });

    it('should have type="button" on the native button', () => {
      fixture.detectChanges();
      expect(getButton()?.getAttribute('type')).toBe('button');
    });
  });

  // ---------------------------------------------------------------------------
  // Input Bindings
  // ---------------------------------------------------------------------------
  describe('Input Bindings', () => {
    it('should accept and reflect text input', () => {
      component.text = 'Submit';
      fixture.detectChanges();
      expect(component.text).toBe('Submit');
    });

    it('should render text label in DOM when text is set', () => {
      component.text = 'Send';
      fixture.detectChanges();
      const label = el.querySelector('.cometchat-button__text');
      expect(label).toBeTruthy();
      expect(label?.textContent?.trim()).toBe('Send');
    });

    it('should accept and reflect iconURL input', () => {
      component.iconURL = 'https://example.com/icon.svg';
      fixture.detectChanges();
      expect(component.iconURL).toBe('https://example.com/icon.svg');
    });

    it('should render icon element when iconURL is set', () => {
      component.iconURL = 'https://example.com/icon.svg';
      fixture.detectChanges();
      expect(el.querySelector('.cometchat-button__icon')).toBeTruthy();
    });

    it('should accept disabled input as true', () => {
      component.disabled = true;
      fixture.detectChanges();
      expect(component.disabled).toBe(true);
      expect(component.isDisabled).toBe(true);
    });

    it('should accept disabled input as false', () => {
      component.disabled = false;
      fixture.detectChanges();
      expect(component.isDisabled).toBe(false);
    });

    it('should accept isLoading input', () => {
      component.isLoading = true;
      fixture.detectChanges();
      expect(component.isLoading).toBe(true);
      expect(component.isDisabled).toBe(true);
    });

    it('should accept hoverText input and set title attribute', () => {
      component.hoverText = 'Click me';
      fixture.detectChanges();
      expect(getButton()?.getAttribute('title')).toBe('Click me');
    });

    it('should accept ariaLabel input', () => {
      component.ariaLabel = 'Send message';
      fixture.detectChanges();
      expect(component.ariaLabel).toBe('Send message');
    });

    it('should update DOM when text input changes', () => {
      component.text = 'First';
      fixture.detectChanges();
      expect(el.querySelector('.cometchat-button__text')?.textContent?.trim()).toBe('First');

      fixture.componentRef.setInput('text', 'Second');
      fixture.detectChanges();
      expect(el.querySelector('.cometchat-button__text')?.textContent?.trim()).toBe('Second');
    });

    it('should handle null-like undefined for text gracefully', () => {
      component.text = undefined;
      fixture.detectChanges();
      expect(el.querySelector('.cometchat-button__text')).toBeNull();
    });

    it('should handle empty string for text', () => {
      component.text = '';
      fixture.detectChanges();
      // Empty string is falsy, so @if(text) should not render the label
      expect(el.querySelector('.cometchat-button__text')).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // Output Emissions
  // ---------------------------------------------------------------------------
  describe('Output Emissions', () => {
    it('should emit buttonClick when button is clicked', () => {
      const spy = vi.fn();
      component.buttonClick.subscribe(spy);
      fixture.detectChanges();

      getButton()!.click();

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should emit a MouseEvent on click', () => {
      const spy = vi.fn();
      component.buttonClick.subscribe(spy);
      fixture.detectChanges();

      getButton()!.click();

      expect(spy.mock.calls[0][0]).toBeInstanceOf(MouseEvent);
    });

    it('should not emit buttonClick when disabled', () => {
      component.disabled = true;
      fixture.detectChanges();
      const spy = vi.fn();
      component.buttonClick.subscribe(spy);

      getButton()!.click();

      expect(spy).not.toHaveBeenCalled();
    });

    it('should not emit buttonClick when loading', () => {
      component.isLoading = true;
      fixture.detectChanges();
      const spy = vi.fn();
      component.buttonClick.subscribe(spy);

      getButton()!.click();

      expect(spy).not.toHaveBeenCalled();
    });

    it('should not emit when both disabled and loading', () => {
      component.disabled = true;
      component.isLoading = true;
      fixture.detectChanges();
      const spy = vi.fn();
      component.buttonClick.subscribe(spy);

      getButton()!.click();

      expect(spy).not.toHaveBeenCalled();
    });

    it('should emit after re-enabling from disabled state', () => {
      component.disabled = true;
      fixture.detectChanges();
      const spy = vi.fn();
      component.buttonClick.subscribe(spy);

      getButton()!.click();
      expect(spy).not.toHaveBeenCalled();

      fixture.componentRef.setInput('disabled', false);
      fixture.detectChanges();
      getButton()!.click();
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  // ---------------------------------------------------------------------------
  // Keyboard Accessibility
  // ---------------------------------------------------------------------------
  describe('Keyboard Accessibility', () => {
    it('should emit buttonClick on Enter key', () => {
      fixture.detectChanges();
      const spy = vi.fn();
      component.buttonClick.subscribe(spy);

      dispatchKeydown('Enter');

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should emit buttonClick on Space key', () => {
      fixture.detectChanges();
      const spy = vi.fn();
      component.buttonClick.subscribe(spy);

      dispatchKeydown(' ');

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should emit a synthetic MouseEvent on keyboard activation', () => {
      fixture.detectChanges();
      const spy = vi.fn();
      component.buttonClick.subscribe(spy);

      dispatchKeydown('Enter');

      const emitted = spy.mock.calls[0][0];
      expect(emitted).toBeInstanceOf(MouseEvent);
      expect(emitted.type).toBe('click');
    });

    it('should not emit on Enter when disabled', () => {
      component.disabled = true;
      fixture.detectChanges();
      const spy = vi.fn();
      component.buttonClick.subscribe(spy);

      dispatchKeydown('Enter');

      expect(spy).not.toHaveBeenCalled();
    });

    it('should not emit on Space when disabled', () => {
      component.disabled = true;
      fixture.detectChanges();
      const spy = vi.fn();
      component.buttonClick.subscribe(spy);

      dispatchKeydown(' ');

      expect(spy).not.toHaveBeenCalled();
    });

    it('should not emit on Enter when loading', () => {
      component.isLoading = true;
      fixture.detectChanges();
      const spy = vi.fn();
      component.buttonClick.subscribe(spy);

      dispatchKeydown('Enter');

      expect(spy).not.toHaveBeenCalled();
    });

    it('should not respond to other keys like Escape', () => {
      fixture.detectChanges();
      const spy = vi.fn();
      component.buttonClick.subscribe(spy);

      dispatchKeydown('Escape');

      expect(spy).not.toHaveBeenCalled();
    });

    it('should not respond to Tab key', () => {
      fixture.detectChanges();
      const spy = vi.fn();
      component.buttonClick.subscribe(spy);

      dispatchKeydown('Tab');

      expect(spy).not.toHaveBeenCalled();
    });

    it('should have a focusable native button element', () => {
      fixture.detectChanges();
      const btn = getButton();
      expect(btn).toBeTruthy();
      // Native <button> is focusable by default
      expect(btn?.tagName).toBe('BUTTON');
    });
  });

  // ---------------------------------------------------------------------------
  // ARIA
  // ---------------------------------------------------------------------------
  describe('ARIA', () => {
    it('should set aria-disabled when disabled', () => {
      component.disabled = true;
      fixture.detectChanges();
      expect(getButton()?.getAttribute('aria-disabled')).toBe('true');
    });

    it('should not set aria-disabled when enabled', () => {
      fixture.detectChanges();
      expect(getButton()?.hasAttribute('aria-disabled')).toBe(false);
    });

    it('should set aria-disabled when loading', () => {
      component.isLoading = true;
      fixture.detectChanges();
      expect(getButton()?.getAttribute('aria-disabled')).toBe('true');
    });

    it('should set aria-label from custom ariaLabel input', () => {
      component.ariaLabel = 'Send message';
      fixture.detectChanges();
      expect(getButton()?.getAttribute('aria-label')).toBe('Send message');
    });

    it('should set aria-label from text when no custom ariaLabel', () => {
      component.text = 'Submit';
      fixture.detectChanges();
      expect(getButton()?.getAttribute('aria-label')).toBe('Submit');
    });

    it('should set aria-label from hoverText when no text or ariaLabel', () => {
      component.hoverText = 'Click me';
      fixture.detectChanges();
      expect(getButton()?.getAttribute('aria-label')).toBe('Click me');
    });

    it('should prioritize ariaLabel over text for aria-label', () => {
      component.ariaLabel = 'Custom label';
      component.text = 'Submit';
      fixture.detectChanges();
      expect(getButton()?.getAttribute('aria-label')).toBe('Custom label');
    });

    it('should prioritize text over hoverText for aria-label', () => {
      component.text = 'Submit';
      component.hoverText = 'Hover text';
      fixture.detectChanges();
      expect(getButton()?.getAttribute('aria-label')).toBe('Submit');
    });

    it('should set aria-busy when loading', () => {
      component.isLoading = true;
      fixture.detectChanges();
      expect(getButton()?.getAttribute('aria-busy')).toBe('true');
    });

    it('should not set aria-busy when not loading', () => {
      fixture.detectChanges();
      expect(getButton()?.hasAttribute('aria-busy')).toBe(false);
    });

    it('should set disabled attribute on native button when disabled', () => {
      component.disabled = true;
      fixture.detectChanges();
      expect(getButton()?.disabled).toBe(true);
    });

    it('should set title from hoverText', () => {
      component.hoverText = 'Tooltip text';
      fixture.detectChanges();
      expect(getButton()?.getAttribute('title')).toBe('Tooltip text');
    });

    it('should have aria-hidden="true" on icon element', () => {
      component.iconURL = 'https://example.com/icon.svg';
      fixture.detectChanges();
      const icon = el.querySelector('.cometchat-button__icon');
      expect(icon?.getAttribute('aria-hidden')).toBe('true');
    });
  });

  // ---------------------------------------------------------------------------
  // DOM Rendering (Conditional)
  // ---------------------------------------------------------------------------
  describe('DOM Rendering', () => {
    it('should render BEM block class .cometchat-button', () => {
      fixture.detectChanges();
      expect(getButton()).toBeTruthy();
    });

    it('should render text label when text is provided', () => {
      component.text = 'Submit';
      fixture.detectChanges();
      const label = el.querySelector('.cometchat-button__text');
      expect(label).toBeTruthy();
      expect(label?.textContent?.trim()).toBe('Submit');
    });

    it('should not render text label when text is not provided', () => {
      fixture.detectChanges();
      expect(el.querySelector('.cometchat-button__text')).toBeNull();
    });

    it('should render icon when iconURL is provided', () => {
      component.iconURL = 'https://example.com/icon.svg';
      fixture.detectChanges();
      expect(el.querySelector('.cometchat-button__icon')).toBeTruthy();
    });

    it('should not render icon when iconURL is not provided', () => {
      fixture.detectChanges();
      expect(el.querySelector('.cometchat-button__icon')).toBeNull();
    });

    it('should render both icon and text when both provided', () => {
      component.text = 'Submit';
      component.iconURL = 'https://example.com/icon.svg';
      fixture.detectChanges();
      expect(el.querySelector('.cometchat-button__text')).toBeTruthy();
      expect(el.querySelector('.cometchat-button__icon')).toBeTruthy();
    });

    it('should render loading view when isLoading is true', () => {
      component.isLoading = true;
      fixture.detectChanges();
      expect(el.querySelector('.cometchat-button__loading-view')).toBeTruthy();
    });

    it('should render sr-only loading text when loading', () => {
      component.isLoading = true;
      fixture.detectChanges();
      const srOnly = el.querySelector('.cometchat-button__sr-only');
      expect(srOnly).toBeTruthy();
      expect(srOnly?.textContent?.trim()).toBe('Loading...');
    });

    it('should not render text or icon when loading', () => {
      component.isLoading = true;
      component.text = 'Submit';
      component.iconURL = 'https://example.com/icon.svg';
      fixture.detectChanges();
      expect(el.querySelector('.cometchat-button__text')).toBeNull();
      expect(el.querySelector('.cometchat-button__icon')).toBeNull();
    });

    it('should apply icon-only class when iconOnly is true and no text', () => {
      component.iconOnly = true;
      component.iconURL = 'https://example.com/icon.svg';
      fixture.detectChanges();
      expect(getButton()?.classList.contains('cometchat-button--icon-only')).toBe(true);
    });

    it('should not apply icon-only class when text is present', () => {
      component.iconOnly = true;
      component.text = 'Submit';
      fixture.detectChanges();
      expect(getButton()?.classList.contains('cometchat-button--icon-only')).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // Disabled / Loading States
  // ---------------------------------------------------------------------------
  describe('Disabled / Loading States', () => {
    it('should disable native button when disabled is true', () => {
      component.disabled = true;
      fixture.detectChanges();
      expect(getButton()?.disabled).toBe(true);
    });

    it('should disable native button when isLoading is true', () => {
      component.isLoading = true;
      fixture.detectChanges();
      expect(getButton()?.disabled).toBe(true);
    });

    it('should enable native button when neither disabled nor loading', () => {
      fixture.detectChanges();
      expect(getButton()?.disabled).toBe(false);
    });

    it('should show loading animation image when loading', () => {
      component.isLoading = true;
      fixture.detectChanges();
      const img = el.querySelector('.cometchat-button__loading-view') as HTMLImageElement;
      expect(img).toBeTruthy();
      expect(img.src).toContain('data:image/svg+xml');
    });

    it('should hide loading animation when not loading', () => {
      fixture.detectChanges();
      expect(el.querySelector('.cometchat-button__loading-view')).toBeNull();
    });

    it('should transition from loading to enabled correctly', () => {
      component.isLoading = true;
      fixture.detectChanges();
      expect(getButton()?.disabled).toBe(true);
      expect(el.querySelector('.cometchat-button__loading-view')).toBeTruthy();

      fixture.componentRef.setInput('isLoading', false);
      fixture.detectChanges();
      expect(getButton()?.disabled).toBe(false);
      expect(el.querySelector('.cometchat-button__loading-view')).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // accessibleLabel getter
  // ---------------------------------------------------------------------------
  describe('accessibleLabel', () => {
    it('should return ariaLabel when set', () => {
      component.ariaLabel = 'Custom';
      expect(component.accessibleLabel).toBe('Custom');
    });

    it('should return text when ariaLabel is not set', () => {
      component.text = 'Submit';
      expect(component.accessibleLabel).toBe('Submit');
    });

    it('should return hoverText when neither ariaLabel nor text is set', () => {
      component.hoverText = 'Hover';
      expect(component.accessibleLabel).toBe('Hover');
    });

    it('should return undefined when nothing is set', () => {
      expect(component.accessibleLabel).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  // Edge Cases
  // ---------------------------------------------------------------------------
  describe('Edge Cases', () => {
    it('should handle undefined disabled gracefully', () => {
      component.disabled = undefined;
      fixture.detectChanges();
      expect(component.isDisabled).toBe(false);
      expect(getButton()?.disabled).toBe(false);
    });

    it('should handle rapid click events', () => {
      fixture.detectChanges();
      const spy = vi.fn();
      component.buttonClick.subscribe(spy);

      getButton()!.click();
      getButton()!.click();
      getButton()!.click();

      expect(spy).toHaveBeenCalledTimes(3);
    });

    it('should handle toggling disabled state between clicks', () => {
      fixture.detectChanges();
      const spy = vi.fn();
      component.buttonClick.subscribe(spy);

      getButton()!.click();
      expect(spy).toHaveBeenCalledTimes(1);

      fixture.componentRef.setInput('disabled', true);
      fixture.detectChanges();
      getButton()!.click();
      expect(spy).toHaveBeenCalledTimes(1);

      fixture.componentRef.setInput('disabled', false);
      fixture.detectChanges();
      getButton()!.click();
      expect(spy).toHaveBeenCalledTimes(2);
    });

    it('should handle toggling loading state between clicks', () => {
      fixture.detectChanges();
      const spy = vi.fn();
      component.buttonClick.subscribe(spy);

      getButton()!.click();
      expect(spy).toHaveBeenCalledTimes(1);

      fixture.componentRef.setInput('isLoading', true);
      fixture.detectChanges();
      getButton()!.click();
      expect(spy).toHaveBeenCalledTimes(1);

      fixture.componentRef.setInput('isLoading', false);
      fixture.detectChanges();
      getButton()!.click();
      expect(spy).toHaveBeenCalledTimes(2);
    });

    it('should not throw when created with no inputs', () => {
      expect(() => fixture.detectChanges()).not.toThrow();
    });

    it('should handle very long text without throwing', () => {
      component.text = 'A'.repeat(500);
      expect(() => fixture.detectChanges()).not.toThrow();
      const label = el.querySelector('.cometchat-button__text');
      expect(label?.textContent?.trim()).toBe('A'.repeat(500));
    });

    it('should stop propagation on mousedown and mouseup', () => {
      fixture.detectChanges();
      const btn = getButton()!;

      const mousedown = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
      const mousedownSpy = vi.fn();
      el.addEventListener('mousedown', mousedownSpy);
      btn.dispatchEvent(mousedown);
      // The component calls stopPropagation, so the event should not reach the parent
      expect(mousedownSpy).not.toHaveBeenCalled();
      el.removeEventListener('mousedown', mousedownSpy);

      const mouseup = new MouseEvent('mouseup', { bubbles: true, cancelable: true });
      const mouseupSpy = vi.fn();
      el.addEventListener('mouseup', mouseupSpy);
      btn.dispatchEvent(mouseup);
      expect(mouseupSpy).not.toHaveBeenCalled();
      el.removeEventListener('mouseup', mouseupSpy);
    });
  });
});
