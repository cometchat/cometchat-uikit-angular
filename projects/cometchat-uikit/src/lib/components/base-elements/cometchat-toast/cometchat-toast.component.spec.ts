/**
 * CometChatToast Component Tests
 *
 * Comprehensive test suite for the toast notification component that supports
 * success, error, warning, and info types with auto-dismiss timing,
 * keyboard accessibility, and ARIA live regions.
 *
 * Categories: Initialization, Input Bindings, Output Emissions,
 *             Auto-Dismiss Timing, DOM Rendering, Keyboard Accessibility,
 *             ARIA, Edge Cases
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4,
 *            3.1, 3.5, 10.5, 14.4, 14.5, 15.7
 */
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ensureSdkReady, sdkCleanup } from '../../../testing';
import { CometChatToastComponent, ToastType } from './cometchat-toast.component';

describe('CometChatToastComponent', () => {
  let fixture: ComponentFixture<CometChatToastComponent>;
  let component: CometChatToastComponent;
  let el: HTMLElement;

  beforeAll(async () => {
    await ensureSdkReady();
  });

  afterAll(async () => {
    await sdkCleanup();
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CometChatToastComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CometChatToastComponent);
    component = fixture.componentInstance;
    el = fixture.nativeElement;
  });

  afterEach(() => {
    // Ensure component is destroyed to clear any pending timeouts
    fixture.destroy();
  });

  // ---------------------------------------------------------------------------
  // Initialization
  // ---------------------------------------------------------------------------
  describe('Initialization', () => {
    it('should create the component', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should have text default to empty string', () => {
      expect(component.text).toBe('');
    });

    it('should have type default to info', () => {
      expect(component.type).toBe(ToastType.info);
    });

    it('should have duration default to 3000', () => {
      expect(component.duration).toBe(3000);
    });

    it('should have showCloseButton default to true', () => {
      expect(component.showCloseButton).toBe(true);
    });

    it('should have dismissOnEscape default to true', () => {
      expect(component.dismissOnEscape).toBe(true);
    });

    it('should have isVisible default to true', () => {
      expect(component.isVisible).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // Input Bindings
  // ---------------------------------------------------------------------------
  describe('Input Bindings', () => {
    it('should reflect text input in the DOM', () => {
      component.text = 'Operation successful';
      fixture.detectChanges();

      const textEl = el.querySelector('.cometchat-toast__text');
      expect(textEl).toBeTruthy();
      expect(textEl?.textContent).toContain('Operation successful');
    });

    it('should apply the correct BEM modifier class for success type', () => {
      component.text = 'Done';
      component.type = ToastType.success;
      fixture.detectChanges();

      const toast = el.querySelector('.cometchat-toast');
      expect(toast?.classList.contains('cometchat-toast--success')).toBe(true);
    });

    it('should apply the correct BEM modifier class for error type', () => {
      component.text = 'Failed';
      component.type = ToastType.error;
      fixture.detectChanges();

      const toast = el.querySelector('.cometchat-toast');
      expect(toast?.classList.contains('cometchat-toast--error')).toBe(true);
    });

    it('should apply the correct BEM modifier class for warning type', () => {
      component.text = 'Caution';
      component.type = ToastType.warning;
      fixture.detectChanges();

      const toast = el.querySelector('.cometchat-toast');
      expect(toast?.classList.contains('cometchat-toast--warning')).toBe(true);
    });

    it('should apply the correct BEM modifier class for info type', () => {
      component.text = 'FYI';
      component.type = ToastType.info;
      fixture.detectChanges();

      const toast = el.querySelector('.cometchat-toast');
      expect(toast?.classList.contains('cometchat-toast--info')).toBe(true);
    });

    it('should compute correct iconClass for each type', () => {
      component.type = ToastType.success;
      expect(component.iconClass).toBe('cometchat-toast__icon--success');

      component.type = ToastType.error;
      expect(component.iconClass).toBe('cometchat-toast__icon--error');

      component.type = ToastType.warning;
      expect(component.iconClass).toBe('cometchat-toast__icon--warning');

      component.type = ToastType.info;
      expect(component.iconClass).toBe('cometchat-toast__icon--info');
    });

    it('should compute correct iconSvg for each type', () => {
      component.type = ToastType.success;
      expect(component.iconSvg).toBe('check_circle');

      component.type = ToastType.error;
      expect(component.iconSvg).toBe('error');

      component.type = ToastType.warning;
      expect(component.iconSvg).toBe('warning');

      component.type = ToastType.info;
      expect(component.iconSvg).toBe('info_icon');
    });

    it('should handle null text input gracefully', () => {
      component.text = null as any;
      expect(() => fixture.detectChanges()).not.toThrow();
    });

    it('should handle undefined type input gracefully', () => {
      component.text = 'Test';
      component.type = undefined as any;
      expect(() => fixture.detectChanges()).not.toThrow();
    });

    it('should not render close button when showCloseButton is false', () => {
      component.text = 'Test';
      component.showCloseButton = false;
      fixture.detectChanges();

      const closeBtn = el.querySelector('.cometchat-toast__close');
      expect(closeBtn).toBeFalsy();
    });

    it('should render close button when showCloseButton is true', () => {
      component.text = 'Test';
      component.showCloseButton = true;
      fixture.detectChanges();

      const closeBtn = el.querySelector('.cometchat-toast__close');
      expect(closeBtn).toBeTruthy();
    });
  });

  // ---------------------------------------------------------------------------
  // Output Emissions
  // ---------------------------------------------------------------------------
  describe('Output Emissions', () => {
    it('should emit toastClosed when close() is called', () => {
      const spy = vi.fn();
      component.toastClosed.subscribe(spy);
      component.text = 'Test';
      fixture.detectChanges();

      component.close();

      expect(spy).toHaveBeenCalledOnce();
    });

    it('should emit toastClosed when close button is clicked', () => {
      const spy = vi.fn();
      component.toastClosed.subscribe(spy);
      component.text = 'Test';
      fixture.detectChanges();

      const closeBtn = el.querySelector('.cometchat-toast__close') as HTMLButtonElement;
      closeBtn.click();

      expect(spy).toHaveBeenCalledOnce();
    });

    it('should set isVisible to false after close', () => {
      component.text = 'Test';
      fixture.detectChanges();

      expect(component.isVisible).toBe(true);
      component.close();
      expect(component.isVisible).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // Auto-Dismiss Timing
  // ---------------------------------------------------------------------------
  describe('Auto-Dismiss Timing', () => {
    it('should auto-dismiss after default duration', fakeAsync(() => {
      const spy = vi.fn();
      component.toastClosed.subscribe(spy);
      component.text = 'Test';
      fixture.detectChanges(); // triggers ngOnInit

      expect(component.isVisible).toBe(true);
      tick(3000);

      expect(spy).toHaveBeenCalledOnce();
      expect(component.isVisible).toBe(false);
    }));

    it('should not auto-dismiss before duration elapses', fakeAsync(() => {
      const spy = vi.fn();
      component.toastClosed.subscribe(spy);
      component.text = 'Test';
      component.duration = 5000;
      fixture.detectChanges();

      tick(4999);
      expect(spy).not.toHaveBeenCalled();
      expect(component.isVisible).toBe(true);

      tick(1);
      expect(spy).toHaveBeenCalledOnce();
    }));

    it('should not auto-dismiss when duration is 0', fakeAsync(() => {
      const spy = vi.fn();
      component.toastClosed.subscribe(spy);
      component.text = 'Test';
      component.duration = 0;
      fixture.detectChanges();

      tick(10000);
      expect(spy).not.toHaveBeenCalled();
      expect(component.isVisible).toBe(true);
    }));

    it('should clear auto-dismiss timeout on manual close', fakeAsync(() => {
      const spy = vi.fn();
      component.toastClosed.subscribe(spy);
      component.text = 'Test';
      component.duration = 3000;
      fixture.detectChanges();

      component.onCloseClick();
      expect(spy).toHaveBeenCalledOnce();

      // Advancing past original duration should not emit again
      tick(3000);
      expect(spy).toHaveBeenCalledOnce();
    }));

    it('should clear timeout on ngOnDestroy', fakeAsync(() => {
      const spy = vi.fn();
      component.toastClosed.subscribe(spy);
      component.text = 'Test';
      component.duration = 3000;
      fixture.detectChanges();

      component.ngOnDestroy();
      tick(3000);
      expect(spy).not.toHaveBeenCalled();
    }));

    it('should auto-dismiss after custom duration', fakeAsync(() => {
      const spy = vi.fn();
      component.toastClosed.subscribe(spy);
      component.text = 'Test';
      component.duration = 1000;
      fixture.detectChanges();

      tick(1000);
      expect(spy).toHaveBeenCalledOnce();
      expect(component.isVisible).toBe(false);
    }));
  });

  // ---------------------------------------------------------------------------
  // DOM Rendering
  // ---------------------------------------------------------------------------
  describe('DOM Rendering', () => {
    it('should render the toast container when text is provided', () => {
      component.text = 'Hello';
      fixture.detectChanges();

      expect(el.querySelector('.cometchat-toast')).toBeTruthy();
    });

    it('should not render the toast when text is empty', () => {
      component.text = '';
      fixture.detectChanges();

      expect(el.querySelector('.cometchat-toast')).toBeFalsy();
    });

    it('should not render the toast when isVisible is false', () => {
      // Use a fresh fixture where isVisible starts as false to avoid NG0100
      const freshFixture = TestBed.createComponent(CometChatToastComponent);
      const freshEl = freshFixture.nativeElement;
      // Don't set text — component won't render when text is empty
      // Instead, verify close() behavior by checking component state
      const freshComponent = freshFixture.componentInstance;
      freshComponent.text = 'Test';
      freshComponent.close(); // sets isVisible = false before first render
      freshFixture.detectChanges();

      expect(freshEl.querySelector('.cometchat-toast')).toBeFalsy();
    });

    it('should render the icon element with aria-hidden', () => {
      component.text = 'Test';
      fixture.detectChanges();

      const icon = el.querySelector('.cometchat-toast__icon');
      expect(icon).toBeTruthy();
      expect(icon?.getAttribute('aria-hidden')).toBe('true');
    });

    it('should render the text content in the toast', () => {
      component.text = 'File uploaded successfully';
      fixture.detectChanges();

      const textEl = el.querySelector('.cometchat-toast__text');
      expect(textEl?.textContent).toContain('File uploaded successfully');
    });

    it('should render the cometchat wrapper div', () => {
      component.text = 'Test';
      fixture.detectChanges();

      expect(el.querySelector('.cometchat')).toBeTruthy();
    });
  });

  // ---------------------------------------------------------------------------
  // Keyboard Accessibility
  // ---------------------------------------------------------------------------
  describe('Keyboard Accessibility', () => {
    beforeEach(() => {
      component.text = 'Test';
      fixture.detectChanges();
    });

    it('should close on Enter key via close button keydown', () => {
      const spy = vi.fn();
      component.toastClosed.subscribe(spy);

      const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
      const preventSpy = vi.spyOn(event, 'preventDefault');

      component.onCloseKeyDown(event);

      expect(preventSpy).toHaveBeenCalled();
      expect(spy).toHaveBeenCalledOnce();
      expect(component.isVisible).toBe(false);
    });

    it('should close on Space key via close button keydown', () => {
      const spy = vi.fn();
      component.toastClosed.subscribe(spy);

      const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
      component.onCloseKeyDown(event);

      expect(spy).toHaveBeenCalledOnce();
      expect(component.isVisible).toBe(false);
    });

    it('should not close on Tab key via close button keydown', () => {
      const spy = vi.fn();
      component.toastClosed.subscribe(spy);

      const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
      component.onCloseKeyDown(event);

      expect(spy).not.toHaveBeenCalled();
      expect(component.isVisible).toBe(true);
    });

    it('should close on Escape key when dismissOnEscape is true', () => {
      const spy = vi.fn();
      component.toastClosed.subscribe(spy);
      component.dismissOnEscape = true;

      const event = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true,
      });
      component.onEscapeKey(event);

      expect(spy).toHaveBeenCalledOnce();
      expect(component.isVisible).toBe(false);
    });

    it('should not close on Escape key when dismissOnEscape is false', () => {
      const spy = vi.fn();
      component.toastClosed.subscribe(spy);
      component.dismissOnEscape = false;

      const event = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true,
      });
      component.onEscapeKey(event);

      expect(spy).not.toHaveBeenCalled();
      expect(component.isVisible).toBe(true);
    });

    it('should not close on Escape key when toast is already hidden', () => {
      const spy = vi.fn();
      component.toastClosed.subscribe(spy);
      component.isVisible = false;

      const event = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true,
      });
      component.onEscapeKey(event);

      expect(spy).not.toHaveBeenCalled();
    });

    it('should have close button with tabindex=0 for keyboard focus', () => {
      const closeBtn = el.querySelector('.cometchat-toast__close');
      expect(closeBtn?.getAttribute('tabindex')).toBe('0');
    });

    it('should clear auto-dismiss timeout when closed via Escape', fakeAsync(() => {
      const spy = vi.fn();
      component.toastClosed.subscribe(spy);
      component.duration = 3000;
      component.dismissOnEscape = true;

      // Re-create to trigger ngOnInit with the new duration
      fixture.destroy();
      fixture = TestBed.createComponent(CometChatToastComponent);
      component = fixture.componentInstance;
      el = fixture.nativeElement;
      component.text = 'Test';
      component.duration = 3000;
      component.dismissOnEscape = true;
      component.toastClosed.subscribe(spy);
      fixture.detectChanges();

      const event = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true,
      });
      component.onEscapeKey(event);
      expect(spy).toHaveBeenCalledOnce();

      tick(3000);
      expect(spy).toHaveBeenCalledOnce(); // no second emit
    }));
  });

  // ---------------------------------------------------------------------------
  // ARIA
  // ---------------------------------------------------------------------------
  describe('ARIA', () => {
    it('should have role="status" for info type', () => {
      component.text = 'Info message';
      component.type = ToastType.info;
      fixture.detectChanges();

      const toast = el.querySelector('.cometchat-toast');
      expect(toast?.getAttribute('role')).toBe('status');
    });

    it('should have role="status" for success type', () => {
      component.text = 'Success message';
      component.type = ToastType.success;
      fixture.detectChanges();

      const toast = el.querySelector('.cometchat-toast');
      expect(toast?.getAttribute('role')).toBe('status');
    });

    it('should have role="alert" for error type', () => {
      component.text = 'Error message';
      component.type = ToastType.error;
      fixture.detectChanges();

      const toast = el.querySelector('.cometchat-toast');
      expect(toast?.getAttribute('role')).toBe('alert');
    });

    it('should have role="alert" for warning type', () => {
      component.text = 'Warning message';
      component.type = ToastType.warning;
      fixture.detectChanges();

      const toast = el.querySelector('.cometchat-toast');
      expect(toast?.getAttribute('role')).toBe('alert');
    });

    it('should have aria-live="polite" for info type', () => {
      component.text = 'Info message';
      component.type = ToastType.info;
      fixture.detectChanges();

      const toast = el.querySelector('.cometchat-toast');
      expect(toast?.getAttribute('aria-live')).toBe('polite');
    });

    it('should have aria-live="polite" for success type', () => {
      component.text = 'Success message';
      component.type = ToastType.success;
      fixture.detectChanges();

      const toast = el.querySelector('.cometchat-toast');
      expect(toast?.getAttribute('aria-live')).toBe('polite');
    });

    it('should have aria-live="assertive" for error type', () => {
      component.text = 'Error message';
      component.type = ToastType.error;
      fixture.detectChanges();

      const toast = el.querySelector('.cometchat-toast');
      expect(toast?.getAttribute('aria-live')).toBe('assertive');
    });

    it('should have aria-live="assertive" for warning type', () => {
      component.text = 'Warning message';
      component.type = ToastType.warning;
      fixture.detectChanges();

      const toast = el.querySelector('.cometchat-toast');
      expect(toast?.getAttribute('aria-live')).toBe('assertive');
    });

    it('should have aria-label set to the text content', () => {
      component.text = 'File uploaded successfully';
      fixture.detectChanges();

      const toast = el.querySelector('.cometchat-toast');
      expect(toast?.getAttribute('aria-label')).toBe('File uploaded successfully');
    });

    it('should render close button with aria-label', () => {
      component.text = 'Test';
      component.showCloseButton = true;
      fixture.detectChanges();

      const closeBtn = el.querySelector('.cometchat-toast__close');
      expect(closeBtn?.getAttribute('aria-label')).toBeTruthy();
    });
  });

  // ---------------------------------------------------------------------------
  // Edge Cases
  // ---------------------------------------------------------------------------
  describe('Edge Cases', () => {
    it('should handle ngOnDestroy without active timeout gracefully', () => {
      component.text = 'Test';
      component.duration = 0;
      fixture.detectChanges();

      expect(() => component.ngOnDestroy()).not.toThrow();
    });

    it('should handle multiple close calls without error', () => {
      component.text = 'Test';
      fixture.detectChanges();
      const spy = vi.fn();
      component.toastClosed.subscribe(spy);

      component.close();
      component.close();

      expect(spy).toHaveBeenCalledTimes(2);
      expect(component.isVisible).toBe(false);
    });

    it('should handle onCloseClick when no timeout was set', () => {
      component.text = 'Test';
      component.duration = 0;
      fixture.detectChanges();
      const spy = vi.fn();
      component.toastClosed.subscribe(spy);

      expect(() => component.onCloseClick()).not.toThrow();
      expect(spy).toHaveBeenCalledOnce();
    });

    it('should apply correct BEM modifier class for each toast type in DOM', () => {
      for (const toastType of [
        ToastType.success,
        ToastType.error,
        ToastType.warning,
        ToastType.info,
      ]) {
        // Create a fresh fixture for each type to avoid ExpressionChanged errors
        const f = TestBed.createComponent(CometChatToastComponent);
        f.componentRef.setInput('text', 'Test');
        f.componentRef.setInput('type', toastType);
        f.detectChanges();

        const toast = f.nativeElement.querySelector('.cometchat-toast');
        expect(toast?.classList.contains(`cometchat-toast--${toastType}`)).toBe(true);
        f.destroy();
      }
    });

    it('should apply correct icon modifier class in DOM', () => {
      for (const toastType of [
        ToastType.success,
        ToastType.error,
        ToastType.warning,
        ToastType.info,
      ]) {
        const f = TestBed.createComponent(CometChatToastComponent);
        f.componentRef.setInput('text', 'Test');
        f.componentRef.setInput('type', toastType);
        f.detectChanges();

        const icon = f.nativeElement.querySelector('.cometchat-toast__icon');
        expect(icon?.classList.contains(`cometchat-toast__icon--${toastType}`)).toBe(true);
        f.destroy();
      }
    });

    it('should handle very long text without throwing', () => {
      component.text = 'A'.repeat(10000);
      expect(() => fixture.detectChanges()).not.toThrow();

      const textEl = el.querySelector('.cometchat-toast__text');
      expect(textEl?.textContent).toContain('A'.repeat(100));
    });
  });
});
