/**
 * CometChatConfirmDialog Component Tests
 *
 * Comprehensive test suite for the confirm dialog component that supports
 * title, message, confirm/cancel buttons, loading/error states, keyboard
 * interaction (Escape to cancel), focus trapping, and ARIA dialog attributes.
 *
 * Categories: Initialization, Input Bindings, Output Emissions,
 *             DOM Rendering, Keyboard Accessibility, ARIA,
 *             State Management, Localized Strings, Edge Cases
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 2.4, 3.1, 3.5,
 *            10.2, 10.3, 10.5, 14.4, 14.5, 15.7
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ensureSdkReady, sdkCleanup } from '../../../testing';
import { CometChatConfirmDialogComponent } from './cometchat-confirm-dialog.component';
import { CometChatLocalize } from '../../../resources/CometChatLocalize/cometchat-localize';

describe('CometChatConfirmDialogComponent', () => {
  let fixture: ComponentFixture<CometChatConfirmDialogComponent>;
  let component: CometChatConfirmDialogComponent;
  let el: HTMLElement;

  beforeAll(async () => {
    await ensureSdkReady();
  });

  afterAll(async () => {
    await sdkCleanup();
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CometChatConfirmDialogComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CometChatConfirmDialogComponent);
    component = fixture.componentInstance;
    el = fixture.nativeElement;
  });

  afterEach(() => {
    fixture.destroy();
  });

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  function getDialog(): HTMLElement | null {
    return el.querySelector('.cometchat-confirm-dialog');
  }

  function getTitleEl(): HTMLElement | null {
    return el.querySelector('.cometchat-confirm-dialog__content-title');
  }

  function getDescriptionEl(): HTMLElement | null {
    return el.querySelector('.cometchat-confirm-dialog__content-description');
  }

  function getCancelButtonWrapper(): HTMLElement | null {
    return el.querySelector('.cometchat-confirm-dialog__button-group-cancel');
  }

  function getSubmitButtonWrapper(): HTMLElement | null {
    return el.querySelector('.cometchat-confirm-dialog__button-group-submit');
  }

  function getErrorView(): HTMLElement | null {
    return el.querySelector('.cometchat-confirm-dialog-error-view');
  }

  /** Click the inner <button> inside a cometchat-button child component */
  function clickButton(wrapper: HTMLElement | null): void {
    const btn = wrapper?.querySelector('button');
    btn?.click();
    fixture.detectChanges();
  }

  function dispatchDocumentEscape(): void {
    const event = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      cancelable: true,
    });
    document.dispatchEvent(event);
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

    it('should render the root .cometchat wrapper', () => {
      fixture.detectChanges();
      expect(el.querySelector('.cometchat')).toBeTruthy();
    });

    it('should render the dialog container', () => {
      fixture.detectChanges();
      expect(getDialog()).toBeTruthy();
    });

    it('should have isLoading as false by default', () => {
      expect(component.isLoading).toBe(false);
    });

    it('should have isError as false by default', () => {
      expect(component.isError).toBe(false);
    });

    it('should generate a unique titleId', () => {
      expect(component.titleId).toMatch(/^cometchat-confirm-dialog-title-/);
    });

    it('should generate different titleIds for different instances', () => {
      const fixture2 = TestBed.createComponent(CometChatConfirmDialogComponent);
      expect(component.titleId).not.toBe(fixture2.componentInstance.titleId);
      fixture2.destroy();
    });
  });

  // ---------------------------------------------------------------------------
  // Input Bindings
  // ---------------------------------------------------------------------------
  describe('Input Bindings', () => {
    it('should have default title from localization', () => {
      const expected = CometChatLocalize.getLocalizedString('conversation_delete_title');
      expect(component.title).toBe(expected);
    });

    it('should have default messageText from localization', () => {
      const expected = CometChatLocalize.getLocalizedString('conversation_delete_subtitle');
      expect(component.messageText).toBe(expected);
    });

    it('should have default cancelButtonText from localization', () => {
      const expected = CometChatLocalize.getLocalizedString('conversation_delete_confirm_no');
      expect(component.cancelButtonText).toBe(expected);
    });

    it('should have default confirmButtonText from localization', () => {
      const expected = CometChatLocalize.getLocalizedString('conversation_delete_confirm_yes');
      expect(component.confirmButtonText).toBe(expected);
    });

    it('should accept and render custom title', () => {
      component.title = 'Leave Group?';
      fixture.detectChanges();
      expect(getTitleEl()?.textContent?.trim()).toBe('Leave Group?');
    });

    it('should accept and render custom messageText', () => {
      component.messageText = 'Are you sure you want to leave?';
      fixture.detectChanges();
      expect(getDescriptionEl()?.textContent?.trim()).toBe('Are you sure you want to leave?');
    });

    it('should accept and render custom cancelButtonText', () => {
      component.cancelButtonText = 'No, stay';
      fixture.detectChanges();
      const cancelBtn = getCancelButtonWrapper()?.querySelector('button');
      expect(cancelBtn?.textContent?.trim()).toContain('No, stay');
    });

    it('should accept and render custom confirmButtonText', () => {
      component.confirmButtonText = 'Yes, leave';
      fixture.detectChanges();
      const submitBtn = getSubmitButtonWrapper()?.querySelector('button');
      expect(submitBtn?.textContent?.trim()).toContain('Yes, leave');
    });

    it('should update DOM when title changes', () => {
      component.title = 'First';
      fixture.detectChanges();
      expect(getTitleEl()?.textContent?.trim()).toBe('First');

      fixture.componentRef.setInput('title', 'Second');
      fixture.detectChanges();
      expect(getTitleEl()?.textContent?.trim()).toBe('Second');
    });

    it('should handle empty string for title', () => {
      component.title = '';
      fixture.detectChanges();
      expect(getTitleEl()?.textContent?.trim()).toBe('');
    });

    it('should handle empty string for messageText', () => {
      component.messageText = '';
      fixture.detectChanges();
      expect(getDescriptionEl()?.textContent?.trim()).toBe('');
    });
  });

  // ---------------------------------------------------------------------------
  // Output Emissions
  // ---------------------------------------------------------------------------
  describe('Output Emissions', () => {
    it('should emit confirmClick when confirm button is clicked', () => {
      fixture.detectChanges();
      const spy = vi.fn();
      component.confirmClick.subscribe(spy);

      clickButton(getSubmitButtonWrapper());

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should emit cancelClick when cancel button is clicked', () => {
      fixture.detectChanges();
      const spy = vi.fn();
      component.cancelClick.subscribe(spy);

      clickButton(getCancelButtonWrapper());

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should set isLoading to true when confirm is clicked', () => {
      fixture.detectChanges();
      clickButton(getSubmitButtonWrapper());
      expect(component.isLoading).toBe(true);
    });

    it('should clear isError when confirm is clicked', () => {
      component.isError = true;
      fixture.detectChanges();
      clickButton(getSubmitButtonWrapper());
      expect(component.isError).toBe(false);
    });

    it('should not set isLoading when cancel is clicked', () => {
      fixture.detectChanges();
      clickButton(getCancelButtonWrapper());
      expect(component.isLoading).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // State Management
  // ---------------------------------------------------------------------------
  describe('State Management', () => {
    it('should reset loading and error on setSuccess', () => {
      component.isLoading = true;
      component.isError = true;
      component.setSuccess();
      expect(component.isLoading).toBe(false);
      expect(component.isError).toBe(false);
    });

    it('should set isError true and isLoading false on setError', () => {
      component.isLoading = true;
      component.setError();
      expect(component.isError).toBe(true);
      expect(component.isLoading).toBe(false);
    });

    it('should return localized error message from errorMessage getter', () => {
      const expected = CometChatLocalize.getLocalizedString('conversation_delete_error');
      expect(component.errorMessage).toBe(expected);
    });

    it('should allow submit → error → submit cycle', () => {
      fixture.detectChanges();
      const spy = vi.fn();
      component.confirmClick.subscribe(spy);

      component.handleSubmitClick();
      expect(component.isLoading).toBe(true);

      component.setError();
      expect(component.isError).toBe(true);
      expect(component.isLoading).toBe(false);

      component.handleSubmitClick();
      expect(component.isLoading).toBe(true);
      expect(component.isError).toBe(false);
      expect(spy).toHaveBeenCalledTimes(2);
    });
  });

  // ---------------------------------------------------------------------------
  // DOM Rendering
  // ---------------------------------------------------------------------------
  describe('DOM Rendering', () => {
    it('should render BEM block class .cometchat-confirm-dialog', () => {
      fixture.detectChanges();
      expect(getDialog()).toBeTruthy();
    });

    it('should render the icon wrapper', () => {
      fixture.detectChanges();
      expect(el.querySelector('.cometchat-confirm-dialog__icon-wrapper')).toBeTruthy();
    });

    it('should render the icon element', () => {
      fixture.detectChanges();
      expect(el.querySelector('.cometchat-confirm-dialog__icon-wrapper-icon')).toBeTruthy();
    });

    it('should render the content section', () => {
      fixture.detectChanges();
      expect(el.querySelector('.cometchat-confirm-dialog__content')).toBeTruthy();
    });

    it('should render the button group', () => {
      fixture.detectChanges();
      expect(el.querySelector('.cometchat-confirm-dialog__button-group')).toBeTruthy();
    });

    it('should render cancel and submit button wrappers', () => {
      fixture.detectChanges();
      expect(getCancelButtonWrapper()).toBeTruthy();
      expect(getSubmitButtonWrapper()).toBeTruthy();
    });

    it('should not show error view when isError is false', () => {
      fixture.detectChanges();
      expect(getErrorView()).toBeNull();
    });

    it('should show error view when isError is true', () => {
      component.isError = true;
      fixture.detectChanges();
      const errorView = getErrorView();
      expect(errorView).toBeTruthy();
      expect(errorView?.textContent?.trim()).toBe(
        CometChatLocalize.getLocalizedString('conversation_delete_error')
      );
    });

    it('should render default localized title text', () => {
      fixture.detectChanges();
      const expected = CometChatLocalize.getLocalizedString('conversation_delete_title');
      expect(getTitleEl()?.textContent?.trim()).toBe(expected);
    });

    it('should render default localized description text', () => {
      fixture.detectChanges();
      const expected = CometChatLocalize.getLocalizedString('conversation_delete_subtitle');
      expect(getDescriptionEl()?.textContent?.trim()).toBe(expected);
    });
  });

  // ---------------------------------------------------------------------------
  // Keyboard Accessibility
  // ---------------------------------------------------------------------------
  describe('Keyboard Accessibility', () => {
    it('should emit cancelClick on Escape key via document listener', () => {
      fixture.detectChanges();
      const spy = vi.fn();
      component.cancelClick.subscribe(spy);

      dispatchDocumentEscape();

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should not respond to non-Escape keys via document listener', () => {
      fixture.detectChanges();
      const spy = vi.fn();
      component.cancelClick.subscribe(spy);

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      document.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
      fixture.detectChanges();

      expect(spy).not.toHaveBeenCalled();
    });

    it('should handle multiple Escape presses', () => {
      fixture.detectChanges();
      const spy = vi.fn();
      component.cancelClick.subscribe(spy);

      dispatchDocumentEscape();
      dispatchDocumentEscape();

      expect(spy).toHaveBeenCalledTimes(2);
    });

    it('should remove Escape listener on destroy', () => {
      fixture.detectChanges();
      const spy = vi.fn();
      component.cancelClick.subscribe(spy);

      fixture.destroy();

      document.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })
      );
      expect(spy).not.toHaveBeenCalled();

      // Re-create fixture for afterEach cleanup
      fixture = TestBed.createComponent(CometChatConfirmDialogComponent);
      component = fixture.componentInstance;
      el = fixture.nativeElement;
    });

    it('should have tabindex="-1" on dialog container for programmatic focus', () => {
      fixture.detectChanges();
      expect(getDialog()?.getAttribute('tabindex')).toBe('-1');
    });
  });

  // ---------------------------------------------------------------------------
  // ARIA
  // ---------------------------------------------------------------------------
  describe('ARIA', () => {
    it('should have role="dialog" on the dialog container', () => {
      fixture.detectChanges();
      expect(getDialog()?.getAttribute('role')).toBe('dialog');
    });

    it('should have aria-modal="true" on the dialog container', () => {
      fixture.detectChanges();
      expect(getDialog()?.getAttribute('aria-modal')).toBe('true');
    });

    it('should have aria-labelledby referencing the title element', () => {
      fixture.detectChanges();
      const dialog = getDialog();
      const titleElement = getTitleEl();
      const labelledBy = dialog?.getAttribute('aria-labelledby');

      expect(labelledBy).toBe(component.titleId);
      expect(titleElement?.getAttribute('id')).toBe(component.titleId);
    });

    it('should have matching aria-labelledby and title id', () => {
      fixture.detectChanges();
      const dialog = getDialog();
      const titleElement = getTitleEl();
      expect(dialog?.getAttribute('aria-labelledby')).toBe(titleElement?.getAttribute('id'));
    });

    it('should have focusable buttons within the dialog', () => {
      fixture.detectChanges();
      const buttons = el.querySelectorAll('button');
      expect(buttons.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ---------------------------------------------------------------------------
  // Localized Strings
  // ---------------------------------------------------------------------------
  describe('Localized Strings', () => {
    it('should use localized default title', () => {
      expect(component.title).toBe(
        CometChatLocalize.getLocalizedString('conversation_delete_title')
      );
    });

    it('should use localized default messageText', () => {
      expect(component.messageText).toBe(
        CometChatLocalize.getLocalizedString('conversation_delete_subtitle')
      );
    });

    it('should use localized default cancelButtonText', () => {
      expect(component.cancelButtonText).toBe(
        CometChatLocalize.getLocalizedString('conversation_delete_confirm_no')
      );
    });

    it('should use localized default confirmButtonText', () => {
      expect(component.confirmButtonText).toBe(
        CometChatLocalize.getLocalizedString('conversation_delete_confirm_yes')
      );
    });

    it('should use localized error message', () => {
      expect(component.errorMessage).toBe(
        CometChatLocalize.getLocalizedString('conversation_delete_error')
      );
    });

    it('should render all localized strings in the DOM', () => {
      fixture.detectChanges();

      expect(getTitleEl()?.textContent?.trim()).toBe(
        CometChatLocalize.getLocalizedString('conversation_delete_title')
      );
      expect(getDescriptionEl()?.textContent?.trim()).toBe(
        CometChatLocalize.getLocalizedString('conversation_delete_subtitle')
      );
    });
  });

  // ---------------------------------------------------------------------------
  // Edge Cases
  // ---------------------------------------------------------------------------
  describe('Edge Cases', () => {
    it('should not throw when created with no custom inputs', () => {
      expect(() => fixture.detectChanges()).not.toThrow();
    });

    it('should handle very long title without throwing', () => {
      component.title = 'A'.repeat(500);
      expect(() => fixture.detectChanges()).not.toThrow();
      expect(getTitleEl()?.textContent?.trim()).toBe('A'.repeat(500));
    });

    it('should handle very long messageText without throwing', () => {
      component.messageText = 'B'.repeat(1000);
      expect(() => fixture.detectChanges()).not.toThrow();
      expect(getDescriptionEl()?.textContent?.trim()).toBe('B'.repeat(1000));
    });

    it('should handle setSuccess when not loading', () => {
      expect(() => component.setSuccess()).not.toThrow();
      expect(component.isLoading).toBe(false);
      expect(component.isError).toBe(false);
    });

    it('should handle setError when not loading', () => {
      expect(() => component.setError()).not.toThrow();
      expect(component.isError).toBe(true);
      expect(component.isLoading).toBe(false);
    });

    it('should handle rapid confirm clicks', () => {
      fixture.detectChanges();
      const spy = vi.fn();
      component.confirmClick.subscribe(spy);

      component.handleSubmitClick();
      component.handleSubmitClick();
      component.handleSubmitClick();

      expect(spy).toHaveBeenCalledTimes(3);
    });

    it('should handle rapid cancel clicks', () => {
      fixture.detectChanges();
      const spy = vi.fn();
      component.cancelClick.subscribe(spy);

      component.handleCancelClick();
      component.handleCancelClick();
      component.handleCancelClick();

      expect(spy).toHaveBeenCalledTimes(3);
    });

    it('should toggle error view visibility based on isError state', () => {
      fixture.detectChanges();
      expect(getErrorView()).toBeNull();

      component.isError = true;
      fixture.componentRef.setInput('title', component.title + ' ');
      fixture.detectChanges();
      expect(getErrorView()).toBeTruthy();

      component.isError = false;
      fixture.componentRef.setInput('title', component.title.trim());
      fixture.detectChanges();
      expect(getErrorView()).toBeNull();
    });
  });
});
