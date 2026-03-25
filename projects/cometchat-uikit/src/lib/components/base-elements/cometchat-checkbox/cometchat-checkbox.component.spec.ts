/**
 * CometChatCheckbox Component Tests
 *
 * Comprehensive test suite for the checkbox component that supports
 * checked, unchecked, indeterminate, and disabled states with full
 * keyboard accessibility and ControlValueAccessor integration.
 *
 * Categories: Initialization, Input Bindings, Output Emissions,
 *             DOM Rendering, Keyboard Accessibility, ARIA, Edge Cases
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4,
 *            3.1, 10.1, 10.2, 10.5, 14.4, 14.5, 15.7
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ensureSdkReady, sdkCleanup } from '../../../testing';
import { CometChatCheckboxComponent } from './cometchat-checkbox.component';

describe('CometChatCheckboxComponent', () => {
  let fixture: ComponentFixture<CometChatCheckboxComponent>;
  let component: CometChatCheckboxComponent;
  let el: HTMLElement;

  beforeAll(async () => {
    await ensureSdkReady();
  });

  afterAll(async () => {
    await sdkCleanup();
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CometChatCheckboxComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CometChatCheckboxComponent);
    component = fixture.componentInstance;
    el = fixture.nativeElement;
  });

  // ---------------------------------------------------------------------------
  // Initialization
  // ---------------------------------------------------------------------------
  describe('Initialization', () => {
    it('should create the component', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should have checked default to false', () => {
      expect(component.checked).toBe(false);
    });

    it('should have labelText default to empty string', () => {
      expect(component.labelText).toBe('');
    });

    it('should have disabled default to false', () => {
      expect(component.disabled).toBe(false);
    });

    it('should have indeterminate default to false', () => {
      expect(component.indeterminate).toBe(false);
    });

    it('should have isChecked default to false', () => {
      expect(component.isChecked).toBe(false);
    });

    it('should generate a unique checkboxId', () => {
      const fixture2 = TestBed.createComponent(CometChatCheckboxComponent);
      const component2 = fixture2.componentInstance;
      expect(component.checkboxId).toMatch(/^cometchat-checkbox-/);
      expect(component.checkboxId).not.toBe(component2.checkboxId);
    });

    it('should initialize isChecked from checked input on ngOnInit', () => {
      component.checked = true;
      fixture.detectChanges();
      expect(component.isChecked).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // Input Bindings
  // ---------------------------------------------------------------------------
  describe('Input Bindings', () => {
    it('should reflect checked=true in internal state after detectChanges', () => {
      component.checked = true;
      fixture.detectChanges();
      expect(component.isChecked).toBe(true);
    });

    it('should reflect labelText in the DOM', () => {
      component.labelText = 'Accept terms';
      fixture.detectChanges();

      const textSpan = el.querySelector('.cometchat-checkbox__text');
      expect(textSpan).toBeTruthy();
      expect(textSpan?.textContent).toContain('Accept terms');
    });

    it('should not render label text span when labelText is empty', () => {
      component.labelText = '';
      fixture.detectChanges();

      const textSpan = el.querySelector('.cometchat-checkbox__text');
      expect(textSpan).toBeFalsy();
    });

    it('should apply disabled attribute to the input element', () => {
      component.disabled = true;
      fixture.detectChanges();

      const input = el.querySelector('.cometchat-checkbox__input') as HTMLInputElement;
      expect(input.disabled).toBe(true);
    });

    it('should handle null checked input gracefully', () => {
      component.checked = null as any;
      expect(() => fixture.detectChanges()).not.toThrow();
    });

    it('should handle undefined labelText gracefully', () => {
      component.labelText = undefined as any;
      expect(() => fixture.detectChanges()).not.toThrow();
    });

    it('should update isChecked when checked input changes via ngOnChanges', () => {
      fixture.componentRef.setInput('checked', false);
      fixture.detectChanges();
      expect(component.isChecked).toBe(false);

      fixture.componentRef.setInput('checked', true);
      fixture.detectChanges();
      expect(component.isChecked).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // Output Emissions
  // ---------------------------------------------------------------------------
  describe('Output Emissions', () => {
    it('should emit checkboxChanged when toggled to checked', () => {
      const spy = vi.fn();
      component.checkboxChanged.subscribe(spy);
      component.labelText = 'Test';
      fixture.detectChanges();

      const input = el.querySelector('.cometchat-checkbox__input') as HTMLInputElement;
      input.checked = true;
      input.dispatchEvent(new Event('change', { bubbles: true }));

      expect(spy).toHaveBeenCalledWith({ checked: true, labelText: 'Test' });
    });

    it('should emit checkboxChanged when toggled to unchecked', () => {
      const spy = vi.fn();
      component.checked = true;
      component.labelText = 'Test';
      fixture.detectChanges();

      component.checkboxChanged.subscribe(spy);

      const input = el.querySelector('.cometchat-checkbox__input') as HTMLInputElement;
      input.checked = false;
      input.dispatchEvent(new Event('change', { bubbles: true }));

      expect(spy).toHaveBeenCalledWith({ checked: false, labelText: 'Test' });
    });

    it('should emit with empty labelText when none set', () => {
      const spy = vi.fn();
      component.checkboxChanged.subscribe(spy);
      fixture.detectChanges();

      const input = el.querySelector('.cometchat-checkbox__input') as HTMLInputElement;
      input.checked = true;
      input.dispatchEvent(new Event('change', { bubbles: true }));

      expect(spy).toHaveBeenCalledWith({ checked: true, labelText: '' });
    });

    it('should emit on each toggle in rapid succession', () => {
      const spy = vi.fn();
      component.checkboxChanged.subscribe(spy);
      fixture.detectChanges();

      const input = el.querySelector('.cometchat-checkbox__input') as HTMLInputElement;

      input.checked = true;
      input.dispatchEvent(new Event('change', { bubbles: true }));
      input.checked = false;
      input.dispatchEvent(new Event('change', { bubbles: true }));
      input.checked = true;
      input.dispatchEvent(new Event('change', { bubbles: true }));

      expect(spy).toHaveBeenCalledTimes(3);
    });
  });

  // ---------------------------------------------------------------------------
  // DOM Rendering
  // ---------------------------------------------------------------------------
  describe('DOM Rendering', () => {
    it('should render the root BEM block element', () => {
      fixture.detectChanges();
      expect(el.querySelector('.cometchat-checkbox')).toBeTruthy();
    });

    it('should render the checkbox input element', () => {
      fixture.detectChanges();
      const input = el.querySelector('.cometchat-checkbox__input');
      expect(input).toBeTruthy();
      expect(input?.getAttribute('type')).toBe('checkbox');
    });

    it('should render the label element', () => {
      fixture.detectChanges();
      expect(el.querySelector('.cometchat-checkbox__label')).toBeTruthy();
    });

    it('should render the checkmark span', () => {
      fixture.detectChanges();
      expect(el.querySelector('.cometchat-checkbox__checkmark')).toBeTruthy();
    });

    it('should associate label with input via for/id', () => {
      fixture.detectChanges();
      const input = el.querySelector('.cometchat-checkbox__input');
      const label = el.querySelector('.cometchat-checkbox__label');
      expect(label?.getAttribute('for')).toBe(input?.getAttribute('id'));
    });

    it('should conditionally render label text span', () => {
      fixture.componentRef.setInput('labelText', '');
      fixture.detectChanges();
      expect(el.querySelector('.cometchat-checkbox__text')).toBeFalsy();

      fixture.componentRef.setInput('labelText', 'My Label');
      fixture.detectChanges();
      expect(el.querySelector('.cometchat-checkbox__text')).toBeTruthy();
      expect(el.querySelector('.cometchat-checkbox__text')?.textContent).toContain('My Label');
    });
  });

  // ---------------------------------------------------------------------------
  // Keyboard Accessibility
  // ---------------------------------------------------------------------------
  describe('Keyboard Accessibility', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should have a focusable checkbox input (native input element)', () => {
      const input = el.querySelector('.cometchat-checkbox__input') as HTMLInputElement;
      expect(input).toBeTruthy();
      expect(input.tagName).toBe('INPUT');
    });

    it('should stop propagation on Space key', () => {
      const input = el.querySelector('.cometchat-checkbox__input') as HTMLInputElement;
      const event = new KeyboardEvent('keydown', {
        key: ' ',
        bubbles: true,
        cancelable: true,
      });
      const stopSpy = vi.spyOn(event, 'stopPropagation');

      input.dispatchEvent(event);

      expect(stopSpy).toHaveBeenCalled();
    });

    it('should not stop propagation on Enter key', () => {
      const input = el.querySelector('.cometchat-checkbox__input') as HTMLInputElement;
      const event = new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
        cancelable: true,
      });
      const stopSpy = vi.spyOn(event, 'stopPropagation');

      input.dispatchEvent(event);

      expect(stopSpy).not.toHaveBeenCalled();
    });

    it('should not stop propagation on Tab key', () => {
      const input = el.querySelector('.cometchat-checkbox__input') as HTMLInputElement;
      const event = new KeyboardEvent('keydown', {
        key: 'Tab',
        bubbles: true,
        cancelable: true,
      });
      const stopSpy = vi.spyOn(event, 'stopPropagation');

      input.dispatchEvent(event);

      expect(stopSpy).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // ARIA
  // ---------------------------------------------------------------------------
  describe('ARIA', () => {
    it('should have aria-checked="false" when unchecked', () => {
      fixture.detectChanges();
      const input = el.querySelector('.cometchat-checkbox__input');
      expect(input?.getAttribute('aria-checked')).toBe('false');
    });

    it('should have aria-checked="true" when checked', () => {
      component.checked = true;
      fixture.detectChanges();
      const input = el.querySelector('.cometchat-checkbox__input');
      expect(input?.getAttribute('aria-checked')).toBe('true');
    });

    it('should have aria-checked="mixed" when indeterminate', () => {
      component.indeterminate = true;
      fixture.detectChanges();
      const input = el.querySelector('.cometchat-checkbox__input');
      expect(input?.getAttribute('aria-checked')).toBe('mixed');
    });

    it('should have aria-disabled when disabled', () => {
      component.disabled = true;
      fixture.detectChanges();
      const input = el.querySelector('.cometchat-checkbox__input');
      expect(input?.getAttribute('aria-disabled')).toBe('true');
    });

    it('should not have aria-disabled when enabled', () => {
      component.disabled = false;
      fixture.detectChanges();
      const input = el.querySelector('.cometchat-checkbox__input');
      // The template uses `disabled || null` so aria-disabled should be absent
      expect(input?.getAttribute('aria-disabled')).toBeNull();
    });

    it('should have aria-label from labelText by default', () => {
      component.labelText = 'Accept terms';
      fixture.detectChanges();
      const input = el.querySelector('.cometchat-checkbox__input');
      expect(input?.getAttribute('aria-label')).toBe('Accept terms');
    });

    it('should prefer ariaLabel over labelText for aria-label', () => {
      component.labelText = 'Accept';
      component.ariaLabel = 'Accept terms and conditions';
      fixture.detectChanges();
      const input = el.querySelector('.cometchat-checkbox__input');
      expect(input?.getAttribute('aria-label')).toBe('Accept terms and conditions');
    });

    it('should have a fallback aria-label when no label provided', () => {
      fixture.detectChanges();
      const input = el.querySelector('.cometchat-checkbox__input');
      const ariaLabel = input?.getAttribute('aria-label');
      // Should have some accessible label (either localized or fallback)
      expect(ariaLabel).toBeTruthy();
      expect(typeof ariaLabel).toBe('string');
    });
  });

  // ---------------------------------------------------------------------------
  // ControlValueAccessor
  // ---------------------------------------------------------------------------
  describe('ControlValueAccessor', () => {
    it('should update isChecked via writeValue', () => {
      component.writeValue(true);
      expect(component.isChecked).toBe(true);

      component.writeValue(false);
      expect(component.isChecked).toBe(false);
    });

    it('should call registered onChange callback on toggle', () => {
      const onChangeFn = vi.fn();
      component.registerOnChange(onChangeFn);
      fixture.detectChanges();

      const input = el.querySelector('.cometchat-checkbox__input') as HTMLInputElement;
      input.checked = true;
      input.dispatchEvent(new Event('change', { bubbles: true }));

      expect(onChangeFn).toHaveBeenCalledWith(true);
    });

    it('should call registered onTouched callback on toggle', () => {
      const onTouchedFn = vi.fn();
      component.registerOnTouched(onTouchedFn);
      fixture.detectChanges();

      const input = el.querySelector('.cometchat-checkbox__input') as HTMLInputElement;
      input.checked = true;
      input.dispatchEvent(new Event('change', { bubbles: true }));

      expect(onTouchedFn).toHaveBeenCalled();
    });

    it('should update disabled state via setDisabledState', () => {
      component.setDisabledState(true);
      expect(component.disabled).toBe(true);

      component.setDisabledState(false);
      expect(component.disabled).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // Edge Cases
  // ---------------------------------------------------------------------------
  describe('Edge Cases', () => {
    it('should clear indeterminate state when checkbox is toggled', () => {
      component.indeterminate = true;
      fixture.detectChanges();

      const input = el.querySelector('.cometchat-checkbox__input') as HTMLInputElement;
      input.checked = true;
      input.dispatchEvent(new Event('change', { bubbles: true }));

      expect(component.indeterminate).toBe(false);
      expect(component.isChecked).toBe(true);
    });

    it('should handle complete toggle flow: unchecked → checked → unchecked', () => {
      const spy = vi.fn();
      component.checkboxChanged.subscribe(spy);
      fixture.detectChanges();

      expect(component.isChecked).toBe(false);

      const input = el.querySelector('.cometchat-checkbox__input') as HTMLInputElement;

      input.checked = true;
      input.dispatchEvent(new Event('change', { bubbles: true }));
      expect(component.isChecked).toBe(true);

      input.checked = false;
      input.dispatchEvent(new Event('change', { bubbles: true }));
      expect(component.isChecked).toBe(false);

      expect(spy).toHaveBeenCalledTimes(2);
    });

    it('should handle accessibleLabel priority: ariaLabel > labelText > default', () => {
      // Default fallback
      const defaultLabel = component.accessibleLabel;
      expect(defaultLabel).toBeTruthy();

      // labelText takes priority over default
      component.labelText = 'Label';
      expect(component.accessibleLabel).toBe('Label');

      // ariaLabel takes priority over labelText
      component.ariaLabel = 'Custom ARIA';
      expect(component.accessibleLabel).toBe('Custom ARIA');
    });

    it('should handle ngOnChanges with checked going from true to false', () => {
      fixture.componentRef.setInput('checked', true);
      fixture.detectChanges();
      expect(component.isChecked).toBe(true);

      fixture.componentRef.setInput('checked', false);
      fixture.detectChanges();
      expect(component.isChecked).toBe(false);
    });

    it('should not change isChecked when ngOnChanges has no checked property', () => {
      component.checked = true;
      fixture.detectChanges();

      component.ngOnChanges({
        labelText: {
          currentValue: 'New',
          previousValue: '',
          firstChange: false,
          isFirstChange: () => false,
        },
      });
      expect(component.isChecked).toBe(true);
    });
  });
});
