/**
 * CometChatRadioButton Component Tests
 *
 * Comprehensive test suite for the radio button component that supports
 * checked/unchecked states, grouping via name, keyboard navigation,
 * disabled state, and full accessibility with ControlValueAccessor integration.
 *
 * Categories: Initialization, Input Bindings, Output Emissions,
 *             DOM Rendering, Keyboard Accessibility, ARIA, Edge Cases
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4,
 *            3.1, 10.1, 10.2, 10.5, 14.4, 14.5, 15.7
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ensureSdkReady, sdkCleanup } from '../../../testing';
import { CometChatRadioButtonComponent } from './cometchat-radio-button.component';

describe('CometChatRadioButtonComponent', () => {
  let fixture: ComponentFixture<CometChatRadioButtonComponent>;
  let component: CometChatRadioButtonComponent;
  let el: HTMLElement;

  beforeAll(async () => {
    await ensureSdkReady();
  });

  afterAll(async () => {
    await sdkCleanup();
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CometChatRadioButtonComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CometChatRadioButtonComponent);
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

    it('should have name default to "radio-group"', () => {
      expect(component.name).toBe('radio-group');
    });

    it('should have labelText default to empty string', () => {
      expect(component.labelText).toBe('');
    });

    it('should have disabled default to false', () => {
      expect(component.disabled).toBe(false);
    });

    it('should have value default to empty string', () => {
      expect(component.value).toBe('');
    });

    it('should have isChecked default to false', () => {
      expect(component.isChecked).toBe(false);
    });

    it('should generate a unique id on ngOnInit when id is empty', () => {
      fixture.detectChanges();
      expect(component.id).toMatch(/^radio-/);
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
      component.labelText = 'Option A';
      fixture.detectChanges();

      const textSpan = el.querySelector('.cometchat-radio-button__text');
      expect(textSpan).toBeTruthy();
      expect(textSpan?.textContent).toContain('Option A');
    });

    it('should not render label text span when labelText is empty', () => {
      component.labelText = '';
      fixture.detectChanges();

      const textSpan = el.querySelector('.cometchat-radio-button__text');
      expect(textSpan).toBeFalsy();
    });

    it('should apply disabled attribute to the input element', () => {
      component.disabled = true;
      fixture.detectChanges();

      const input = el.querySelector('.cometchat-radio-button__input') as HTMLInputElement;
      expect(input.disabled).toBe(true);
    });

    it('should set the name attribute on the input element', () => {
      component.name = 'color-group';
      fixture.detectChanges();

      const input = el.querySelector('.cometchat-radio-button__input') as HTMLInputElement;
      expect(input.getAttribute('name')).toBe('color-group');
    });

    it('should handle null checked input gracefully', () => {
      component.checked = null as any;
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

    it('should preserve provided id on ngOnInit', () => {
      component.id = 'my-radio';
      fixture.detectChanges();
      expect(component.id).toBe('my-radio');
    });
  });

  // ---------------------------------------------------------------------------
  // Output Emissions
  // ---------------------------------------------------------------------------
  describe('Output Emissions', () => {
    it('should emit radioChanged when radio is selected', () => {
      const spy = vi.fn();
      component.radioChanged.subscribe(spy);
      component.labelText = 'Option A';
      component.id = 'r1';
      fixture.detectChanges();

      const input = el.querySelector('.cometchat-radio-button__input') as HTMLInputElement;
      input.checked = true;
      input.dispatchEvent(new Event('change', { bubbles: true }));

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({ checked: true, labelText: 'Option A', id: 'r1' })
      );
    });

    it('should emit radioChanged when radio is deselected', () => {
      const spy = vi.fn();
      component.checked = true;
      component.labelText = 'Option B';
      component.id = 'r2';
      fixture.detectChanges();

      component.radioChanged.subscribe(spy);

      const input = el.querySelector('.cometchat-radio-button__input') as HTMLInputElement;
      input.checked = false;
      input.dispatchEvent(new Event('change', { bubbles: true }));

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({ checked: false, labelText: 'Option B', id: 'r2' })
      );
    });

    it('should emit with empty labelText when none set', () => {
      const spy = vi.fn();
      component.radioChanged.subscribe(spy);
      component.id = 'r3';
      fixture.detectChanges();

      const input = el.querySelector('.cometchat-radio-button__input') as HTMLInputElement;
      input.checked = true;
      input.dispatchEvent(new Event('change', { bubbles: true }));

      expect(spy).toHaveBeenCalledWith(expect.objectContaining({ checked: true, labelText: '' }));
    });

    it('should emit on each change in rapid succession', () => {
      const spy = vi.fn();
      component.radioChanged.subscribe(spy);
      component.id = 'r4';
      fixture.detectChanges();

      const input = el.querySelector('.cometchat-radio-button__input') as HTMLInputElement;

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
      expect(el.querySelector('.cometchat-radio-button')).toBeTruthy();
    });

    it('should render the radio input element', () => {
      fixture.detectChanges();
      const input = el.querySelector('.cometchat-radio-button__input');
      expect(input).toBeTruthy();
      expect(input?.getAttribute('type')).toBe('radio');
    });

    it('should render the label element', () => {
      fixture.detectChanges();
      expect(el.querySelector('.cometchat-radio-button__label')).toBeTruthy();
    });

    it('should render the custom radio span', () => {
      fixture.detectChanges();
      expect(el.querySelector('.cometchat-radio-button__custom')).toBeTruthy();
    });

    it('should conditionally render label text span', () => {
      fixture.componentRef.setInput('labelText', '');
      fixture.detectChanges();
      expect(el.querySelector('.cometchat-radio-button__text')).toBeFalsy();

      fixture.componentRef.setInput('labelText', 'My Option');
      fixture.detectChanges();
      expect(el.querySelector('.cometchat-radio-button__text')).toBeTruthy();
      expect(el.querySelector('.cometchat-radio-button__text')?.textContent).toContain('My Option');
    });

    it('should reflect checked state on the input element', () => {
      component.checked = true;
      fixture.detectChanges();

      const input = el.querySelector('.cometchat-radio-button__input') as HTMLInputElement;
      expect(input.checked).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // Keyboard Accessibility
  // ---------------------------------------------------------------------------
  describe('Keyboard Accessibility', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should have a focusable radio input (native input element)', () => {
      const input = el.querySelector('.cometchat-radio-button__input') as HTMLInputElement;
      expect(input).toBeTruthy();
      expect(input.tagName).toBe('INPUT');
    });

    it('should select radio button on Space key when unchecked', () => {
      const spy = vi.fn();
      component.radioChanged.subscribe(spy);
      component.id = 'k1';

      const event = new KeyboardEvent('keydown', {
        key: ' ',
        bubbles: true,
        cancelable: true,
      });

      // Dispatch on the host element (HostListener)
      el.dispatchEvent(event);

      expect(component.isChecked).toBe(true);
      expect(spy).toHaveBeenCalled();
    });

    it('should not re-select on Space key when already checked', () => {
      fixture.componentRef.setInput('checked', true);
      fixture.detectChanges();

      const spy = vi.fn();
      component.radioChanged.subscribe(spy);

      const event = new KeyboardEvent('keydown', {
        key: ' ',
        bubbles: true,
        cancelable: true,
      });
      el.dispatchEvent(event);

      expect(spy).not.toHaveBeenCalled();
    });

    it('should not respond to keyboard when disabled', () => {
      fixture.componentRef.setInput('disabled', true);
      fixture.detectChanges();

      const spy = vi.fn();
      component.radioChanged.subscribe(spy);

      const event = new KeyboardEvent('keydown', {
        key: ' ',
        bubbles: true,
        cancelable: true,
      });
      el.dispatchEvent(event);

      expect(spy).not.toHaveBeenCalled();
      expect(component.isChecked).toBe(false);
    });

    it('should not respond to Tab key', () => {
      const spy = vi.fn();
      component.radioChanged.subscribe(spy);

      const event = new KeyboardEvent('keydown', {
        key: 'Tab',
        bubbles: true,
        cancelable: true,
      });
      el.dispatchEvent(event);

      expect(spy).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // ARIA
  // ---------------------------------------------------------------------------
  describe('ARIA', () => {
    it('should have aria-checked="false" when unchecked', () => {
      fixture.detectChanges();
      const input = el.querySelector('.cometchat-radio-button__input');
      expect(input?.getAttribute('aria-checked')).toBe('false');
    });

    it('should have aria-checked="true" when checked', () => {
      component.checked = true;
      fixture.detectChanges();
      const input = el.querySelector('.cometchat-radio-button__input');
      expect(input?.getAttribute('aria-checked')).toBe('true');
    });

    it('should have aria-disabled="true" when disabled', () => {
      component.disabled = true;
      fixture.detectChanges();
      const input = el.querySelector('.cometchat-radio-button__input');
      expect(input?.getAttribute('aria-disabled')).toBe('true');
    });

    it('should not have aria-disabled when enabled', () => {
      component.disabled = false;
      fixture.detectChanges();
      const input = el.querySelector('.cometchat-radio-button__input');
      expect(input?.getAttribute('aria-disabled')).toBeNull();
    });

    it('should have aria-label from labelText', () => {
      component.labelText = 'Option A';
      fixture.detectChanges();
      const input = el.querySelector('.cometchat-radio-button__input');
      expect(input?.getAttribute('aria-label')).toBe('Option A');
    });

    it('should prefer ariaLabel over labelText for aria-label', () => {
      component.labelText = 'Option A';
      component.ariaLabel = 'Custom label';
      fixture.detectChanges();
      const input = el.querySelector('.cometchat-radio-button__input');
      expect(input?.getAttribute('aria-label')).toBe('Custom label');
    });

    it('should not have aria-label when no label provided', () => {
      fixture.detectChanges();
      const input = el.querySelector('.cometchat-radio-button__input');
      // accessibleLabel returns undefined when no label, so attr should be null
      expect(input?.getAttribute('aria-label')).toBeNull();
    });

    it('should have correct name attribute for grouping', () => {
      component.name = 'color-group';
      fixture.detectChanges();
      const input = el.querySelector('.cometchat-radio-button__input');
      expect(input?.getAttribute('name')).toBe('color-group');
    });
  });

  // ---------------------------------------------------------------------------
  // ControlValueAccessor
  // ---------------------------------------------------------------------------
  describe('ControlValueAccessor', () => {
    it('should update isChecked via writeValue when value matches', () => {
      component.value = 'optA';
      component.writeValue('optA');
      expect(component.isChecked).toBe(true);
    });

    it('should set isChecked to false via writeValue when value does not match', () => {
      component.value = 'optA';
      component.writeValue('optB');
      expect(component.isChecked).toBe(false);
    });

    it('should call registered onChange callback on radio change', () => {
      const onChangeFn = vi.fn();
      component.registerOnChange(onChangeFn);
      component.value = 'optA';
      fixture.detectChanges();

      const input = el.querySelector('.cometchat-radio-button__input') as HTMLInputElement;
      input.checked = true;
      input.dispatchEvent(new Event('change', { bubbles: true }));

      expect(onChangeFn).toHaveBeenCalledWith('optA');
    });

    it('should call registered onTouched callback on radio change', () => {
      const onTouchedFn = vi.fn();
      component.registerOnTouched(onTouchedFn);
      fixture.detectChanges();

      const input = el.querySelector('.cometchat-radio-button__input') as HTMLInputElement;
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
  // Group Behavior
  // ---------------------------------------------------------------------------
  describe('Group Behavior', () => {
    it('should share the same name attribute for grouped radio buttons', () => {
      const fixture2 = TestBed.createComponent(CometChatRadioButtonComponent);
      const component2 = fixture2.componentInstance;

      component.name = 'my-group';
      component2.name = 'my-group';
      fixture.detectChanges();
      fixture2.detectChanges();

      const input1 = el.querySelector('.cometchat-radio-button__input');
      const input2 = fixture2.nativeElement.querySelector('.cometchat-radio-button__input');

      expect(input1?.getAttribute('name')).toBe('my-group');
      expect(input2?.getAttribute('name')).toBe('my-group');
    });

    it('should have different name attributes for different groups', () => {
      const fixture2 = TestBed.createComponent(CometChatRadioButtonComponent);
      const component2 = fixture2.componentInstance;

      component.name = 'group-a';
      component2.name = 'group-b';
      fixture.detectChanges();
      fixture2.detectChanges();

      const input1 = el.querySelector('.cometchat-radio-button__input');
      const input2 = fixture2.nativeElement.querySelector('.cometchat-radio-button__input');

      expect(input1?.getAttribute('name')).toBe('group-a');
      expect(input2?.getAttribute('name')).toBe('group-b');
    });
  });

  // ---------------------------------------------------------------------------
  // Edge Cases
  // ---------------------------------------------------------------------------
  describe('Edge Cases', () => {
    it('should handle writeValue with null gracefully', () => {
      component.value = 'optA';
      expect(() => component.writeValue(null)).not.toThrow();
      expect(component.isChecked).toBe(false);
    });

    it('should handle writeValue with undefined gracefully', () => {
      component.value = 'optA';
      expect(() => component.writeValue(undefined)).not.toThrow();
      expect(component.isChecked).toBe(false);
    });

    it('should handle accessibleLabel priority: ariaLabel > labelText > undefined', () => {
      expect(component.accessibleLabel).toBeUndefined();

      component.labelText = 'Label';
      expect(component.accessibleLabel).toBe('Label');

      component.ariaLabel = 'Custom ARIA';
      expect(component.accessibleLabel).toBe('Custom ARIA');
    });

    it('should handle ariaCheckedValue for checked/unchecked states', () => {
      component.isChecked = false;
      expect(component.ariaCheckedValue).toBe('false');

      component.isChecked = true;
      expect(component.ariaCheckedValue).toBe('true');
    });

    it('should handle ariaDisabledValue for enabled/disabled states', () => {
      component.disabled = false;
      expect(component.ariaDisabledValue).toBeNull();

      component.disabled = true;
      expect(component.ariaDisabledValue).toBe('true');
    });

    it('should handle complete selection flow: unchecked → checked', () => {
      const spy = vi.fn();
      component.radioChanged.subscribe(spy);
      component.id = 'e1';
      component.labelText = 'Test';
      fixture.detectChanges();

      expect(component.isChecked).toBe(false);

      const input = el.querySelector('.cometchat-radio-button__input') as HTMLInputElement;
      input.checked = true;
      input.dispatchEvent(new Event('change', { bubbles: true }));

      expect(component.isChecked).toBe(true);
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({ checked: true, labelText: 'Test', id: 'e1' })
      );
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

    it('should handle undefined labelText gracefully', () => {
      component.labelText = undefined as any;
      expect(() => fixture.detectChanges()).not.toThrow();
    });
  });
});
