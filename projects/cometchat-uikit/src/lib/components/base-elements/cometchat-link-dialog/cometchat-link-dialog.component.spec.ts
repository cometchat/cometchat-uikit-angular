/**
 * CometChatLinkDialog Component Tests
 *
 * Comprehensive test suite for the link dialog component that supports
 * add/edit modes, text/URL inputs, form validation, save/cancel/remove
 * outputs, keyboard interaction (Enter to submit, Escape to cancel),
 * focus trapping, and ARIA dialog attributes.
 *
 * Categories: Initialization, Input Bindings, Output Emissions,
 *             Form Validation, DOM Rendering, Keyboard Accessibility,
 *             ARIA, Edge Cases
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 2.4, 3.1,
 *            10.2, 10.3, 10.5, 14.4, 14.5, 15.7
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ensureSdkReady, sdkCleanup } from '../../../testing';
import { CometChatLinkDialogComponent, LinkData } from './cometchat-link-dialog.component';

describe('CometChatLinkDialogComponent', () => {
  let fixture: ComponentFixture<CometChatLinkDialogComponent>;
  let component: CometChatLinkDialogComponent;
  let el: HTMLElement;

  beforeAll(async () => {
    await ensureSdkReady();
  });

  afterAll(async () => {
    await sdkCleanup();
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CometChatLinkDialogComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CometChatLinkDialogComponent);
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
    return el.querySelector('.cometchat-link-dialog');
  }

  function getTitleEl(): HTMLElement | null {
    return el.querySelector('.cometchat-link-dialog__title');
  }

  function getTextInput(): HTMLInputElement | null {
    return el.querySelector('#link-text-input');
  }

  function getUrlInput(): HTMLInputElement | null {
    return el.querySelector('#link-url-input');
  }

  function getErrorEl(): HTMLElement | null {
    return el.querySelector('.cometchat-link-dialog__error');
  }

  function getCancelButtonWrapper(): HTMLElement | null {
    return el.querySelector('.cometchat-link-dialog__button-group-cancel');
  }

  function getSaveButtonWrapper(): HTMLElement | null {
    return el.querySelector('.cometchat-link-dialog__button-group-save');
  }

  function clickButton(wrapper: HTMLElement | null): void {
    const btn = wrapper?.querySelector('button');
    btn?.click();
    fixture.detectChanges();
  }

  /** Sets an input value and dispatches the input event so the component picks it up */
  function setInputValue(input: HTMLInputElement | null, value: string): void {
    if (!input) return;
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
    fixture.detectChanges();
  }

  function dispatchDocumentEscape(): void {
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })
    );
    fixture.detectChanges();
  }

  function dispatchEnterOnInput(input: HTMLInputElement): void {
    input.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })
    );
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

    it('should default mode to "add"', () => {
      expect(component.mode).toBe('add');
    });

    it('should default initialText to empty string', () => {
      expect(component.initialText).toBe('');
    });

    it('should default initialUrl to empty string', () => {
      expect(component.initialUrl).toBe('');
    });

    it('should default selectedText to empty string', () => {
      expect(component.selectedText).toBe('');
    });

    it('should generate a unique titleId', () => {
      expect(component.titleId).toMatch(/^cometchat-link-dialog-title-/);
    });

    it('should generate different titleIds for different instances', () => {
      const fixture2 = TestBed.createComponent(CometChatLinkDialogComponent);
      expect(component.titleId).not.toBe(fixture2.componentInstance.titleId);
      fixture2.destroy();
    });

    it('should generate a unique errorId', () => {
      expect(component.errorId).toMatch(/^cometchat-link-dialog-error-/);
    });
  });

  // ---------------------------------------------------------------------------
  // Input Bindings
  // ---------------------------------------------------------------------------
  describe('Input Bindings', () => {
    it('should accept mode "edit"', () => {
      component.mode = 'edit';
      expect(component.mode).toBe('edit');
    });

    it('should initialize linkText from selectedText in add mode', () => {
      component.selectedText = 'Click here';
      fixture.detectChanges();
      expect(component.linkText()).toBe('Click here');
    });

    it('should initialize linkText from initialText when no selectedText in add mode', () => {
      component.initialText = 'Fallback text';
      fixture.detectChanges();
      expect(component.linkText()).toBe('Fallback text');
    });

    it('should prefer selectedText over initialText in add mode', () => {
      component.selectedText = 'Selected';
      component.initialText = 'Initial';
      fixture.detectChanges();
      expect(component.linkText()).toBe('Selected');
    });

    it('should initialize linkText from initialText in edit mode', () => {
      component.mode = 'edit';
      component.initialText = 'Edit text';
      component.initialUrl = 'https://example.com';
      fixture.detectChanges();
      expect(component.linkText()).toBe('Edit text');
    });

    it('should initialize linkUrl from initialUrl in edit mode', () => {
      component.mode = 'edit';
      component.initialUrl = 'https://example.com';
      fixture.detectChanges();
      expect(component.linkUrl()).toBe('https://example.com');
    });

    it('should initialize linkUrl from initialUrl in add mode', () => {
      component.initialUrl = 'https://test.com';
      fixture.detectChanges();
      expect(component.linkUrl()).toBe('https://test.com');
    });

    it('should render text input value from linkText', () => {
      component.selectedText = 'Hello';
      fixture.detectChanges();
      const textInput = getTextInput();
      expect(textInput?.value).toBe('Hello');
    });

    it('should render URL input value from linkUrl', () => {
      component.initialUrl = 'https://example.com';
      fixture.detectChanges();
      const urlInput = getUrlInput();
      expect(urlInput?.value).toBe('https://example.com');
    });
  });

  // ---------------------------------------------------------------------------
  // Output Emissions
  // ---------------------------------------------------------------------------
  describe('Output Emissions', () => {
    it('should emit save with link data on valid save', () => {
      fixture.detectChanges();
      const spy = vi.fn();
      component.save.subscribe(spy);

      setInputValue(getTextInput(), 'Example');
      setInputValue(getUrlInput(), 'https://example.com');
      clickButton(getSaveButtonWrapper());

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith({
        text: 'Example',
        url: 'https://example.com',
      } satisfies LinkData);
    });

    it('should emit cancel when cancel button is clicked', () => {
      fixture.detectChanges();
      const spy = vi.fn();
      component.cancel.subscribe(spy);

      clickButton(getCancelButtonWrapper());

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should emit remove when handleRemoveClick is called', () => {
      component.mode = 'edit';
      fixture.detectChanges();
      const spy = vi.fn();
      component.remove.subscribe(spy);

      component.handleRemoveClick();

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should normalize URL without protocol on save', () => {
      fixture.detectChanges();
      const spy = vi.fn();
      component.save.subscribe(spy);

      setInputValue(getTextInput(), 'Example');
      setInputValue(getUrlInput(), 'example.com');
      clickButton(getSaveButtonWrapper());

      expect(spy).toHaveBeenCalledWith({
        text: 'Example',
        url: 'https://example.com',
      });
    });

    it('should preserve existing http protocol on save', () => {
      fixture.detectChanges();
      const spy = vi.fn();
      component.save.subscribe(spy);

      setInputValue(getTextInput(), 'Example');
      setInputValue(getUrlInput(), 'http://example.com');
      clickButton(getSaveButtonWrapper());

      expect(spy).toHaveBeenCalledWith({
        text: 'Example',
        url: 'http://example.com',
      });
    });

    it('should use URL as text when text is empty in edit mode', () => {
      component.mode = 'edit';
      fixture.detectChanges();
      const spy = vi.fn();
      component.save.subscribe(spy);

      setInputValue(getUrlInput(), 'https://example.com');
      clickButton(getSaveButtonWrapper());

      expect(spy).toHaveBeenCalledWith({
        text: 'https://example.com',
        url: 'https://example.com',
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Form Validation
  // ---------------------------------------------------------------------------
  describe('Form Validation', () => {
    it('should set error when text is empty in add mode', () => {
      fixture.detectChanges();
      const spy = vi.fn();
      component.save.subscribe(spy);

      setInputValue(getUrlInput(), 'https://example.com');
      clickButton(getSaveButtonWrapper());

      expect(component.errorMessage()).toBe('message_composer_link_text_required');
      expect(spy).not.toHaveBeenCalled();
    });

    it('should set error when URL is empty', () => {
      fixture.detectChanges();
      const spy = vi.fn();
      component.save.subscribe(spy);

      setInputValue(getTextInput(), 'Example');
      clickButton(getSaveButtonWrapper());

      expect(component.errorMessage()).toBe('message_composer_link_url_required');
      expect(spy).not.toHaveBeenCalled();
    });

    it('should accept any non-empty URL string (no strict validation)', () => {
      fixture.detectChanges();
      const spy = vi.fn();
      component.save.subscribe(spy);

      setInputValue(getTextInput(), 'Example');
      setInputValue(getUrlInput(), 'not a url');
      clickButton(getSaveButtonWrapper());

      // Component accepts any non-empty URL per Req 2.20
      expect(component.errorMessage()).toBe('');
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should not require text in edit mode', () => {
      component.mode = 'edit';
      fixture.detectChanges();
      const spy = vi.fn();
      component.save.subscribe(spy);

      setInputValue(getUrlInput(), 'https://example.com');
      clickButton(getSaveButtonWrapper());

      expect(component.errorMessage()).toBe('');
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should clear error when text changes', () => {
      fixture.detectChanges();
      // Trigger text required error
      clickButton(getSaveButtonWrapper());
      expect(component.errorMessage()).toBeTruthy();

      setInputValue(getTextInput(), 'New text');
      expect(component.errorMessage()).toBe('');
    });

    it('should clear error when URL changes', () => {
      fixture.detectChanges();
      setInputValue(getTextInput(), 'Example');
      clickButton(getSaveButtonWrapper()); // triggers URL required error
      expect(component.errorMessage()).toBeTruthy();

      setInputValue(getUrlInput(), 'https://example.com');
      expect(component.errorMessage()).toBe('');
    });

    it('should clear previous error before re-validating on save', () => {
      fixture.detectChanges();
      clickButton(getSaveButtonWrapper()); // text required
      expect(component.errorMessage()).toBe('message_composer_link_text_required');

      setInputValue(getTextInput(), 'Example');
      clickButton(getSaveButtonWrapper()); // now URL required
      expect(component.errorMessage()).toBe('message_composer_link_url_required');
    });

    it('should trim whitespace from text and URL before validation', () => {
      fixture.detectChanges();
      const spy = vi.fn();
      component.save.subscribe(spy);

      setInputValue(getTextInput(), '  Example  ');
      setInputValue(getUrlInput(), '  https://example.com  ');
      clickButton(getSaveButtonWrapper());

      expect(spy).toHaveBeenCalledWith({
        text: 'Example',
        url: 'https://example.com',
      });
    });

    it('should reject whitespace-only text in add mode', () => {
      fixture.detectChanges();
      setInputValue(getTextInput(), '   ');
      setInputValue(getUrlInput(), 'https://example.com');
      clickButton(getSaveButtonWrapper());

      expect(component.errorMessage()).toBe('message_composer_link_text_required');
    });

    it('should reject whitespace-only URL', () => {
      fixture.detectChanges();
      setInputValue(getTextInput(), 'Example');
      setInputValue(getUrlInput(), '   ');
      clickButton(getSaveButtonWrapper());

      expect(component.errorMessage()).toBe('message_composer_link_url_required');
    });

    it('should render error element in DOM when validation fails', () => {
      fixture.detectChanges();
      expect(getErrorEl()).toBeNull();

      clickButton(getSaveButtonWrapper()); // triggers error
      fixture.detectChanges();

      expect(getErrorEl()).toBeTruthy();
    });
  });

  // ---------------------------------------------------------------------------
  // DOM Rendering
  // ---------------------------------------------------------------------------
  describe('DOM Rendering', () => {
    it('should render BEM block class .cometchat-link-dialog', () => {
      fixture.detectChanges();
      expect(getDialog()).toBeTruthy();
    });

    it('should render the title element', () => {
      fixture.detectChanges();
      expect(getTitleEl()).toBeTruthy();
    });

    it('should render the inputs container', () => {
      fixture.detectChanges();
      expect(el.querySelector('.cometchat-link-dialog__inputs')).toBeTruthy();
    });

    it('should render two input groups', () => {
      fixture.detectChanges();
      const groups = el.querySelectorAll('.cometchat-link-dialog__input-group');
      expect(groups.length).toBe(2);
    });

    it('should render labels for both inputs', () => {
      fixture.detectChanges();
      const labels = el.querySelectorAll('.cometchat-link-dialog__label');
      expect(labels.length).toBe(2);
    });

    it('should render the button group', () => {
      fixture.detectChanges();
      expect(el.querySelector('.cometchat-link-dialog__button-group')).toBeTruthy();
    });

    it('should render cancel and save button wrappers', () => {
      fixture.detectChanges();
      expect(getCancelButtonWrapper()).toBeTruthy();
      expect(getSaveButtonWrapper()).toBeTruthy();
    });

    it('should not show error element when no error', () => {
      fixture.detectChanges();
      expect(getErrorEl()).toBeNull();
    });

    it('should show error element when validation fails', () => {
      fixture.detectChanges();
      clickButton(getSaveButtonWrapper());
      fixture.detectChanges();
      expect(getErrorEl()).toBeTruthy();
    });
  });

  // ---------------------------------------------------------------------------
  // Keyboard Accessibility
  // ---------------------------------------------------------------------------
  describe('Keyboard Accessibility', () => {
    it('should emit cancel on Escape key via document listener', () => {
      fixture.detectChanges();
      const spy = vi.fn();
      component.cancel.subscribe(spy);

      dispatchDocumentEscape();

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should trigger save on Enter key from URL input', () => {
      fixture.detectChanges();
      const spy = vi.fn();
      component.save.subscribe(spy);

      setInputValue(getTextInput(), 'Example');
      setInputValue(getUrlInput(), 'https://example.com');
      dispatchEnterOnInput(getUrlInput()!);

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should trigger save on Enter key from text input', () => {
      fixture.detectChanges();
      const spy = vi.fn();
      component.save.subscribe(spy);

      setInputValue(getTextInput(), 'Example');
      setInputValue(getUrlInput(), 'https://example.com');
      dispatchEnterOnInput(getTextInput()!);

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should show validation error on Enter with invalid form', () => {
      fixture.detectChanges();
      // No text or URL set — Enter on input should trigger validation
      const textInput = getTextInput()!;
      dispatchEnterOnInput(textInput);

      expect(component.errorMessage()).toBeTruthy();
    });

    it('should handle multiple Escape presses', () => {
      fixture.detectChanges();
      const spy = vi.fn();
      component.cancel.subscribe(spy);

      dispatchDocumentEscape();
      dispatchDocumentEscape();

      expect(spy).toHaveBeenCalledTimes(2);
    });

    it('should remove Escape listener on destroy', () => {
      fixture.detectChanges();
      const spy = vi.fn();
      component.cancel.subscribe(spy);

      fixture.destroy();

      document.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })
      );
      expect(spy).not.toHaveBeenCalled();

      // Re-create fixture for afterEach cleanup
      fixture = TestBed.createComponent(CometChatLinkDialogComponent);
      component = fixture.componentInstance;
      el = fixture.nativeElement;
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
      expect(dialog?.getAttribute('aria-labelledby')).toBe(component.titleId);
      expect(titleElement?.getAttribute('id')).toBe(component.titleId);
    });

    it('should have aria-required="true" on text input in add mode', () => {
      fixture.detectChanges();
      expect(getTextInput()?.getAttribute('aria-required')).toBe('true');
    });

    it('should have aria-required="false" on text input in edit mode', () => {
      component.mode = 'edit';
      fixture.detectChanges();
      expect(getTextInput()?.getAttribute('aria-required')).toBe('false');
    });

    it('should have aria-required="true" on URL input', () => {
      fixture.detectChanges();
      expect(getUrlInput()?.getAttribute('aria-required')).toBe('true');
    });

    it('should have aria-invalid="false" when no error', () => {
      fixture.detectChanges();
      expect(getTextInput()?.getAttribute('aria-invalid')).toBe('false');
      expect(getUrlInput()?.getAttribute('aria-invalid')).toBe('false');
    });

    it('should have aria-invalid="true" when error is present', () => {
      fixture.detectChanges();
      clickButton(getSaveButtonWrapper()); // triggers error
      fixture.detectChanges();
      expect(getTextInput()?.getAttribute('aria-invalid')).toBe('true');
    });

    it('should show error with role="alert" and aria-live="polite"', () => {
      fixture.detectChanges();
      clickButton(getSaveButtonWrapper()); // triggers error
      fixture.detectChanges();
      const errorEl = getErrorEl();
      expect(errorEl).toBeTruthy();
      expect(errorEl?.getAttribute('role')).toBe('alert');
      expect(errorEl?.getAttribute('aria-live')).toBe('polite');
    });

    it('should not render error element when no error', () => {
      fixture.detectChanges();
      expect(getErrorEl()).toBeNull();
    });

    it('should have aria-describedby referencing error when error is present', () => {
      fixture.detectChanges();
      clickButton(getSaveButtonWrapper()); // triggers error
      fixture.detectChanges();
      const dialog = getDialog();
      expect(dialog?.getAttribute('aria-describedby')).toBe(component.errorId);
    });

    it('should not have aria-describedby when no error', () => {
      fixture.detectChanges();
      const dialog = getDialog();
      expect(dialog?.getAttribute('aria-describedby')).toBeNull();
    });

    it('should have labeled inputs with for/id association', () => {
      fixture.detectChanges();
      const labels = el.querySelectorAll('.cometchat-link-dialog__label');
      expect(labels[0]?.getAttribute('for')).toBe('link-text-input');
      expect(labels[1]?.getAttribute('for')).toBe('link-url-input');
    });

    it('should have aria-label on both inputs', () => {
      fixture.detectChanges();
      expect(getTextInput()?.hasAttribute('aria-label')).toBe(true);
      expect(getUrlInput()?.hasAttribute('aria-label')).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // Edge Cases
  // ---------------------------------------------------------------------------
  describe('Edge Cases', () => {
    it('should not throw when created with no custom inputs', () => {
      expect(() => fixture.detectChanges()).not.toThrow();
    });

    it('should handle empty URL on save', () => {
      fixture.detectChanges();
      const spy = vi.fn();
      component.save.subscribe(spy);

      setInputValue(getTextInput(), 'Example');
      clickButton(getSaveButtonWrapper());

      expect(component.errorMessage()).toBe('message_composer_link_url_required');
      expect(spy).not.toHaveBeenCalled();
    });

    it('should handle rapid save clicks', () => {
      fixture.detectChanges();
      const spy = vi.fn();
      component.save.subscribe(spy);

      setInputValue(getTextInput(), 'Example');
      setInputValue(getUrlInput(), 'https://example.com');

      component.handleSaveClick();
      component.handleSaveClick();
      component.handleSaveClick();

      expect(spy).toHaveBeenCalledTimes(3);
    });

    it('should handle rapid cancel clicks', () => {
      fixture.detectChanges();
      const spy = vi.fn();
      component.cancel.subscribe(spy);

      component.handleCancelClick();
      component.handleCancelClick();
      component.handleCancelClick();

      expect(spy).toHaveBeenCalledTimes(3);
    });

    it('should handle onTextChange with empty string', () => {
      fixture.detectChanges();
      component.onTextChange('');
      expect(component.linkText()).toBe('');
    });

    it('should handle onUrlChange with empty string', () => {
      fixture.detectChanges();
      component.onUrlChange('');
      expect(component.linkUrl()).toBe('');
    });

    it('should handle init with all empty inputs', () => {
      fixture.detectChanges();
      expect(component.linkText()).toBe('');
      expect(component.linkUrl()).toBe('');
      expect(component.errorMessage()).toBe('');
    });

    it('should validate various URL formats correctly', () => {
      fixture.detectChanges();
      const validUrls = [
        'https://example.com',
        'http://test.org',
        'example.com',
        'sub.domain.co.uk',
      ];

      for (const url of validUrls) {
        const spy = vi.fn();
        component.save.subscribe(spy);
        setInputValue(getTextInput(), 'Test');
        setInputValue(getUrlInput(), url);
        component.handleSaveClick();
        expect(spy).toHaveBeenCalledTimes(1);
        spy.mockClear();
      }
    });

    it('should handle very long text without throwing', () => {
      fixture.detectChanges();
      const longText = 'A'.repeat(500);
      expect(() => {
        setInputValue(getTextInput(), longText);
      }).not.toThrow();
      expect(component.linkText()).toBe(longText);
    });

    it('should handle very long URL without throwing', () => {
      fixture.detectChanges();
      const longUrl = 'https://example.com/' + 'a'.repeat(500);
      expect(() => {
        setInputValue(getUrlInput(), longUrl);
      }).not.toThrow();
      expect(component.linkUrl()).toBe(longUrl);
    });
  });
});
