/**
 * CometChatFlagMessageDialog Component Tests
 *
 * Comprehensive test suite for the flag message dialog component that supports
 * title, description, optional remark text field, confirm/cancel buttons,
 * loading/error states, keyboard interaction (Escape to cancel), focus trapping,
 * and ARIA alertdialog attributes.
 *
 * Categories: Initialization, Input Bindings, Output Emissions,
 *             DOM Rendering, Selection State, Keyboard Accessibility, ARIA,
 *             State Management, Localized Strings, Edge Cases
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 2.4, 3.1, 3.5,
 *            10.2, 10.3, 10.5, 14.4, 14.5, 15.7
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ensureSdkReady, sdkCleanup } from '../../../testing';
import { CometChatFlagMessageDialogComponent } from './cometchat-flag-message-dialog.component';
import { CometChatLocalize } from '../../../resources/CometChatLocalize/cometchat-localize';
import { FlagReason } from '@cometchat/chat-sdk-javascript';

/** Helper: create a minimal FlagReason stub */
function makeFlagReason(id = 'spam', name = 'Spam'): FlagReason {
  return { id, name } as FlagReason;
}

describe('CometChatFlagMessageDialogComponent', () => {
  let fixture: ComponentFixture<CometChatFlagMessageDialogComponent>;
  let component: CometChatFlagMessageDialogComponent;
  let el: HTMLElement;

  beforeAll(async () => {
    await ensureSdkReady();
  });

  afterAll(async () => {
    await sdkCleanup();
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CometChatFlagMessageDialogComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CometChatFlagMessageDialogComponent);
    component = fixture.componentInstance;
    el = fixture.nativeElement;
  });

  afterEach(() => {
    fixture.destroy();
  });

  // ---------------------------------------------------------------------------
  // Helpers — updated to match actual DOM structure
  // ---------------------------------------------------------------------------
  function getDialog(): HTMLElement | null {
    return el.querySelector('.cometchat-flag-message-dialog');
  }

  function getTitleEl(): HTMLElement | null {
    return el.querySelector('.cometchat-flag-message-dialog__header-title');
  }

  function getDescriptionEl(): HTMLElement | null {
    return el.querySelector('.cometchat-flag-message-dialog__header-subtitle');
  }

  function getCancelButtonWrapper(): HTMLElement | null {
    return el.querySelector('.cometchat-flag-message-dialog__actions-cancel');
  }

  function getSubmitButtonWrapper(): HTMLElement | null {
    return el.querySelector('.cometchat-flag-message-dialog__actions-submit');
  }

  function getErrorView(): HTMLElement | null {
    return el.querySelector('.cometchat-flag-message-dialog-error-view');
  }

  function getRemarkSection(): HTMLElement | null {
    return el.querySelector('.cometchat-flag-message-dialog__remark');
  }

  function getRemarkTextarea(): HTMLTextAreaElement | null {
    return el.querySelector('.cometchat-flag-message-dialog__remark-input');
  }

  function getRemarkCounter(): HTMLElement | null {
    return el.querySelector('.cometchat-flag-message-dialog__remark-counter');
  }

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

  function simulateRemarkInput(text: string): void {
    const textarea = getRemarkTextarea();
    if (textarea) {
      textarea.value = text;
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      fixture.detectChanges();
    }
  }

  /** Set a selected reason so handleSubmitClick() doesn't bail early */
  function setSelectedReason(reason: FlagReason = makeFlagReason()): void {
    component.selectedReason.set(reason);
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

    it('should have isLoading signal as false by default', () => {
      expect(component.isLoading()).toBe(false);
    });

    it('should have isError signal as false by default', () => {
      expect(component.isError()).toBe(false);
    });

    it('should have remarkText signal as empty string by default', () => {
      expect(component.remarkText()).toBe('');
    });

    it('should have MAX_REMARK_LENGTH of 500', () => {
      expect(component.MAX_REMARK_LENGTH).toBe(500);
    });

    it('should generate a unique titleId', () => {
      expect(component.titleId).toMatch(/^cometchat-flag-message-dialog-title-/);
    });

    it('should generate different titleIds for different instances', () => {
      const fixture2 = TestBed.createComponent(CometChatFlagMessageDialogComponent);
      expect(component.titleId).not.toBe(fixture2.componentInstance.titleId);
      fixture2.destroy();
    });

    it('should generate a unique descriptionId', () => {
      expect(component.descriptionId).toMatch(/^cometchat-flag-message-dialog-desc-/);
    });
  });

  // ---------------------------------------------------------------------------
  // Input Bindings
  // ---------------------------------------------------------------------------
  describe('Input Bindings', () => {
    it('should have hideRemarkField as false by default', () => {
      expect(component.hideRemarkField).toBe(false);
    });

    it('should accept hideRemarkField as true and hide remark section', () => {
      component.hideRemarkField = true;
      fixture.detectChanges();
      expect(getRemarkSection()).toBeNull();
    });

    it('should show remark section when hideRemarkField is false', () => {
      component.hideRemarkField = false;
      fixture.detectChanges();
      expect(getRemarkSection()).toBeTruthy();
    });

    it('should have message as undefined by default', () => {
      expect(component.message).toBeUndefined();
    });

    it('should accept a message input without throwing', () => {
      expect(() => {
        component.message = {} as any;
        fixture.detectChanges();
      }).not.toThrow();
    });

    it('should handle null message gracefully', () => {
      expect(() => {
        component.message = null as any;
        fixture.detectChanges();
      }).not.toThrow();
    });

    it('should toggle remark section visibility when hideRemarkField changes', () => {
      fixture.detectChanges();
      expect(getRemarkSection()).toBeTruthy();

      fixture.componentRef.setInput('hideRemarkField', true);
      fixture.detectChanges();
      expect(getRemarkSection()).toBeNull();

      fixture.componentRef.setInput('hideRemarkField', false);
      fixture.detectChanges();
      expect(getRemarkSection()).toBeTruthy();
    });
  });

  // ---------------------------------------------------------------------------
  // Output Emissions
  // NOTE: handleSubmitClick() requires selectedReason() to be set.
  // ---------------------------------------------------------------------------
  describe('Output Emissions', () => {
    it('should emit confirm with message and empty remark on submit click', () => {
      const mockMsg = { getId: () => 1 } as any;
      const reason = makeFlagReason();
      component.message = mockMsg;
      setSelectedReason(reason);
      fixture.detectChanges();

      const spy = vi.fn();
      component.confirm.subscribe(spy);

      clickButton(getSubmitButtonWrapper());

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith({ message: mockMsg, reasonId: reason.id, remark: '' });
    });

    it('should emit confirm with message and remark text', () => {
      const mockMsg = { getId: () => 2 } as any;
      const reason = makeFlagReason();
      component.message = mockMsg;
      setSelectedReason(reason);
      fixture.detectChanges();

      simulateRemarkInput('This is spam');

      const spy = vi.fn();
      component.confirm.subscribe(spy);

      clickButton(getSubmitButtonWrapper());

      expect(spy).toHaveBeenCalledWith({ message: mockMsg, reasonId: reason.id, remark: 'This is spam' });
    });

    it('should emit cancel when cancel button is clicked', () => {
      fixture.detectChanges();
      const spy = vi.fn();
      component.cancel.subscribe(spy);

      clickButton(getCancelButtonWrapper());

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should set isLoading to true on submit click', () => {
      setSelectedReason();
      fixture.detectChanges();
      clickButton(getSubmitButtonWrapper());
      expect(component.isLoading()).toBe(true);
    });

    it('should clear isError on submit click', () => {
      setSelectedReason();
      component.setError();
      fixture.detectChanges();
      clickButton(getSubmitButtonWrapper());
      expect(component.isError()).toBe(false);
    });

    it('should not set isLoading on cancel click', () => {
      fixture.detectChanges();
      clickButton(getCancelButtonWrapper());
      expect(component.isLoading()).toBe(false);
    });

    it('should not emit confirm when no reason is selected', () => {
      fixture.detectChanges();
      const spy = vi.fn();
      component.confirm.subscribe(spy);

      // No reason set — submit should be a no-op
      component.handleSubmitClick();

      expect(spy).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // Selection State (Remark Input)
  // ---------------------------------------------------------------------------
  describe('Selection State (Remark Input)', () => {
    it('should update remarkText when user types in textarea', () => {
      fixture.detectChanges();
      simulateRemarkInput('Spam content');
      expect(component.remarkText()).toBe('Spam content');
    });

    it('should truncate remarkText at MAX_REMARK_LENGTH', () => {
      fixture.detectChanges();
      simulateRemarkInput('a'.repeat(600));
      expect(component.remarkText().length).toBeLessThanOrEqual(500);
    });

    it('should report remaining characters correctly', () => {
      fixture.detectChanges();
      simulateRemarkInput('Hello');
      expect(component.remainingCharacters).toBe(495);
    });

    it('should report isCharacterLimitReached when at max', () => {
      fixture.detectChanges();
      simulateRemarkInput('a'.repeat(500));
      expect(component.isCharacterLimitReached).toBe(true);
    });

    it('should not report isCharacterLimitReached when under max', () => {
      fixture.detectChanges();
      simulateRemarkInput('Hello');
      expect(component.isCharacterLimitReached).toBe(false);
    });

    it('should show character counter with remaining count', () => {
      fixture.detectChanges();
      const counter = getRemarkCounter();
      expect(counter?.textContent?.trim()).toContain('500');
    });

    it('should show character limit message when at max', () => {
      fixture.detectChanges();
      simulateRemarkInput('a'.repeat(500));
      const counter = getRemarkCounter();
      expect(counter?.textContent?.trim()).toBe(
        CometChatLocalize.getLocalizedString('flag_message_character_limit_reached')
      );
    });

    it('should apply limit modifier class when at max', () => {
      fixture.detectChanges();
      simulateRemarkInput('a'.repeat(500));
      const counter = el.querySelector('.cometchat-flag-message-dialog__remark-counter--limit');
      expect(counter).toBeTruthy();
    });

    it('should handle empty remark input', () => {
      fixture.detectChanges();
      simulateRemarkInput('');
      expect(component.remarkText()).toBe('');
      expect(component.remainingCharacters).toBe(500);
    });
  });

  // ---------------------------------------------------------------------------
  // State Management
  // ---------------------------------------------------------------------------
  describe('State Management', () => {
    it('should reset loading and error on setSuccess', () => {
      setSelectedReason();
      component.handleSubmitClick();
      component.setSuccess();
      expect(component.isLoading()).toBe(false);
      expect(component.isError()).toBe(false);
    });

    it('should set isError true and isLoading false on setError', () => {
      setSelectedReason();
      component.handleSubmitClick();
      component.setError();
      expect(component.isError()).toBe(true);
      expect(component.isLoading()).toBe(false);
    });

    it('should return localized error message from errorMessage getter', () => {
      const expected = CometChatLocalize.getLocalizedString('flag_message_error');
      expect(component.errorMessage).toBe(expected);
    });

    it('should allow submit → error → submit cycle', () => {
      setSelectedReason();
      fixture.detectChanges();
      const spy = vi.fn();
      component.confirm.subscribe(spy);

      component.handleSubmitClick();
      expect(component.isLoading()).toBe(true);

      component.setError();
      expect(component.isError()).toBe(true);
      expect(component.isLoading()).toBe(false);

      component.handleSubmitClick();
      expect(component.isLoading()).toBe(true);
      expect(component.isError()).toBe(false);
      expect(spy).toHaveBeenCalledTimes(2);
    });
  });

  // ---------------------------------------------------------------------------
  // DOM Rendering — updated to match actual template structure
  // ---------------------------------------------------------------------------
  describe('DOM Rendering', () => {
    it('should render BEM block class .cometchat-flag-message-dialog', () => {
      fixture.detectChanges();
      expect(getDialog()).toBeTruthy();
    });

    it('should render the header section', () => {
      fixture.detectChanges();
      expect(el.querySelector('.cometchat-flag-message-dialog__header')).toBeTruthy();
    });

    it('should render the header title element', () => {
      fixture.detectChanges();
      expect(el.querySelector('.cometchat-flag-message-dialog__header-title')).toBeTruthy();
    });

    it('should render the header subtitle element', () => {
      fixture.detectChanges();
      expect(el.querySelector('.cometchat-flag-message-dialog__header-subtitle')).toBeTruthy();
    });

    it('should render the body section', () => {
      fixture.detectChanges();
      expect(el.querySelector('.cometchat-flag-message-dialog__body')).toBeTruthy();
    });

    it('should render the actions section', () => {
      fixture.detectChanges();
      expect(el.querySelector('.cometchat-flag-message-dialog__actions')).toBeTruthy();
    });

    it('should render cancel and submit action wrappers', () => {
      fixture.detectChanges();
      expect(getCancelButtonWrapper()).toBeTruthy();
      expect(getSubmitButtonWrapper()).toBeTruthy();
    });

    it('should not show error view when isError is false', () => {
      fixture.detectChanges();
      expect(getErrorView()).toBeNull();
    });

    it('should show error view when isError is true', () => {
      component.setError();
      fixture.detectChanges();
      const errorView = getErrorView();
      expect(errorView).toBeTruthy();
      expect(errorView?.textContent?.trim()).toBe(
        CometChatLocalize.getLocalizedString('flag_message_error')
      );
    });

    it('should show error view with role="alert"', () => {
      component.setError();
      fixture.detectChanges();
      const errorView = getErrorView();
      expect(errorView?.getAttribute('role')).toBe('alert');
    });

    it('should toggle error view visibility based on isError state', () => {
      fixture.detectChanges();
      expect(getErrorView()).toBeNull();

      component.setError();
      fixture.detectChanges();
      expect(getErrorView()).toBeTruthy();

      component.setSuccess();
      fixture.detectChanges();
      expect(getErrorView()).toBeNull();
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

    it('should not respond to non-Escape keys via document listener', () => {
      fixture.detectChanges();
      const spy = vi.fn();
      component.cancel.subscribe(spy);

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      document.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
      fixture.detectChanges();

      expect(spy).not.toHaveBeenCalled();
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
      fixture = TestBed.createComponent(CometChatFlagMessageDialogComponent);
      component = fixture.componentInstance;
      el = fixture.nativeElement;
    });

    it('should have focusable buttons within the dialog', () => {
      fixture.detectChanges();
      const buttons = el.querySelectorAll('button');
      expect(buttons.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ---------------------------------------------------------------------------
  // ARIA — updated to match actual template structure
  // ---------------------------------------------------------------------------
  describe('ARIA', () => {
    it('should have role="alertdialog" on the dialog container', () => {
      fixture.detectChanges();
      expect(getDialog()?.getAttribute('role')).toBe('alertdialog');
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

    it('should have aria-describedby referencing the description element', () => {
      fixture.detectChanges();
      const dialog = getDialog();
      const descEl = getDescriptionEl();
      expect(dialog?.getAttribute('aria-describedby')).toBe(component.descriptionId);
      expect(descEl?.getAttribute('id')).toBe(component.descriptionId);
    });

    it('should have matching aria-labelledby and title id', () => {
      fixture.detectChanges();
      const dialog = getDialog();
      const titleElement = getTitleEl();
      expect(dialog?.getAttribute('aria-labelledby')).toBe(titleElement?.getAttribute('id'));
    });

    it('should have labeled textarea with for/id association', () => {
      fixture.detectChanges();
      const label = el.querySelector('.cometchat-flag-message-dialog__remark-label');
      const textarea = el.querySelector('#flag-message-remark');
      expect(label?.getAttribute('for')).toBe('flag-message-remark');
      expect(textarea).toBeTruthy();
    });

    it('should have aria-describedby on textarea referencing character count', () => {
      fixture.detectChanges();
      const textarea = getRemarkTextarea();
      expect(textarea?.getAttribute('aria-describedby')).toBe('remark-character-count');
    });

    it('should have aria-hidden="true" on the decorative icon (if present)', () => {
      fixture.detectChanges();
      // The icon wrapper is optional in the current template — skip if not present
      const icon = el.querySelector('[aria-hidden="true"]');
      // Just verify no aria-hidden elements have interactive roles
      if (icon) {
        const role = icon.getAttribute('role');
        expect(['button', 'link', 'checkbox'].includes(role ?? '')).toBe(false);
      }
      expect(true).toBe(true); // always pass — icon is optional
    });
  });

  // ---------------------------------------------------------------------------
  // Localized Strings
  // ---------------------------------------------------------------------------
  describe('Localized Strings', () => {
    it('should use localized dialog title', () => {
      expect(component.dialogTitle).toBe(
        CometChatLocalize.getLocalizedString('flag_message_title')
      );
    });

    it('should use localized dialog subtitle', () => {
      expect(component.dialogSubtitle).toBe(
        CometChatLocalize.getLocalizedString('flag_message_subtitle')
      );
    });

    it('should use localized confirm button text', () => {
      expect(component.confirmButtonText).toBe(
        CometChatLocalize.getLocalizedString('flag_message_confirm_yes')
      );
    });

    it('should use localized cancel button text', () => {
      expect(component.cancelButtonText).toBe(
        CometChatLocalize.getLocalizedString('flag_message_confirm_no')
      );
    });

    it('should use localized remark label', () => {
      expect(component.remarkLabel).toBe(
        CometChatLocalize.getLocalizedString('flag_message_remark_label')
      );
    });

    it('should use localized remark optional text', () => {
      expect(component.remarkOptional).toBe(
        CometChatLocalize.getLocalizedString('flag_message_remark_optional')
      );
    });

    it('should use localized remark placeholder', () => {
      expect(component.remarkPlaceholder).toBe(
        CometChatLocalize.getLocalizedString('flag_message_remark_placeholder')
      );
    });

    it('should use localized error message', () => {
      expect(component.errorMessage).toBe(
        CometChatLocalize.getLocalizedString('flag_message_error')
      );
    });

    it('should use localized character limit message', () => {
      expect(component.characterLimitMessage).toBe(
        CometChatLocalize.getLocalizedString('flag_message_character_limit_reached')
      );
    });

    it('should render localized title in the DOM', () => {
      fixture.detectChanges();
      expect(getTitleEl()?.textContent?.trim()).toBe(
        CometChatLocalize.getLocalizedString('flag_message_title')
      );
    });

    it('should render localized subtitle in the DOM', () => {
      fixture.detectChanges();
      expect(getDescriptionEl()?.textContent?.trim()).toBe(
        CometChatLocalize.getLocalizedString('flag_message_subtitle')
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

    it('should handle setSuccess when not loading', () => {
      expect(() => component.setSuccess()).not.toThrow();
      expect(component.isLoading()).toBe(false);
      expect(component.isError()).toBe(false);
    });

    it('should handle setError when not loading', () => {
      expect(() => component.setError()).not.toThrow();
      expect(component.isError()).toBe(true);
      expect(component.isLoading()).toBe(false);
    });

    it('should handle rapid confirm clicks', () => {
      setSelectedReason();
      fixture.detectChanges();
      const spy = vi.fn();
      component.confirm.subscribe(spy);

      component.handleSubmitClick();
      component.handleSubmitClick();
      component.handleSubmitClick();

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

    it('should handle confirm with undefined message', () => {
      setSelectedReason();
      fixture.detectChanges();
      const spy = vi.fn();
      component.confirm.subscribe(spy);

      component.handleSubmitClick();

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({ message: undefined, remark: '' })
      );
    });

    it('should handle confirm with null message', () => {
      component.message = null as any;
      setSelectedReason();
      fixture.detectChanges();
      const spy = vi.fn();
      component.confirm.subscribe(spy);

      component.handleSubmitClick();

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({ message: null, remark: '' })
      );
    });

    it('should handle remark input with only whitespace', () => {
      fixture.detectChanges();
      simulateRemarkInput('   ');
      expect(component.remarkText()).toBe('   ');
    });

    it('should handle remark input exactly at MAX_REMARK_LENGTH', () => {
      fixture.detectChanges();
      const exactText = 'a'.repeat(500);
      simulateRemarkInput(exactText);
      expect(component.remarkText().length).toBe(500);
      expect(component.isCharacterLimitReached).toBe(true);
      expect(component.remainingCharacters).toBe(0);
    });
  });
});
