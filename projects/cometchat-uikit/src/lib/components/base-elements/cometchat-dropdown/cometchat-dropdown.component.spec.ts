/**
 * CometChatDropDown Component Tests
 *
 * Comprehensive test suite for the dropdown component that supports
 * option selection, keyboard navigation (ArrowUp/Down, Enter, Escape,
 * Home, End), type-ahead search, and full ARIA listbox semantics.
 *
 * Categories: Initialization, Input Bindings, Output Emissions,
 *             DOM Rendering, Keyboard Accessibility, ARIA, Edge Cases
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4,
 *            3.1, 3.3, 10.1, 10.2, 10.4, 10.5, 14.4, 14.5, 15.7
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ensureSdkReady, sdkCleanup } from '../../../testing';
import { CometChatDropDownComponent } from './cometchat-dropdown.component';

describe('CometChatDropDownComponent', () => {
  let fixture: ComponentFixture<CometChatDropDownComponent>;
  let component: CometChatDropDownComponent;
  let el: HTMLElement;

  const TEST_OPTIONS = ['Admin', 'Moderator', 'Participant'];

  beforeAll(async () => {
    await ensureSdkReady();
  });

  afterAll(async () => {
    await sdkCleanup();
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CometChatDropDownComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CometChatDropDownComponent);
    component = fixture.componentInstance;
    el = fixture.nativeElement;
  });

  // ---------------------------------------------------------------------------
  // Helper: open the dropdown and run detectChanges
  // ---------------------------------------------------------------------------
  function openDropdown(): void {
    const button = el.querySelector('.cometchat-dropdown__button') as HTMLElement;
    button.click();
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

    it('should have empty options array by default', () => {
      expect(component.options).toEqual([]);
    });

    it('should have empty selectedOption by default', () => {
      expect(component.selectedOption).toBe('');
    });

    it('should have empty placeholder by default', () => {
      expect(component.placeholder).toBe('');
    });

    it('should have dropdownVisible false by default', () => {
      expect(component.dropdownVisible).toBe(false);
    });

    it('should have focusedIndex -1 by default', () => {
      expect(component.focusedIndex).toBe(-1);
    });

    it('should generate a unique listboxId', () => {
      const fixture2 = TestBed.createComponent(CometChatDropDownComponent);
      const component2 = fixture2.componentInstance;
      expect(component.listboxId).toMatch(/^cometchat-dropdown-listbox-/);
      expect(component.listboxId).not.toBe(component2.listboxId);
    });

    it('should select first option as selectedOptionState when no selectedOption provided', () => {
      component.options = TEST_OPTIONS;
      fixture.detectChanges();
      expect(component.selectedOptionState).toBe('Admin');
    });
  });

  // ---------------------------------------------------------------------------
  // Input Bindings
  // ---------------------------------------------------------------------------
  describe('Input Bindings', () => {
    it('should reflect options input', () => {
      component.options = TEST_OPTIONS;
      fixture.detectChanges();
      expect(component.options).toEqual(TEST_OPTIONS);
    });

    it('should reflect selectedOption in selectedOptionState after init', () => {
      component.options = TEST_OPTIONS;
      component.selectedOption = 'Moderator';
      fixture.detectChanges();
      expect(component.selectedOptionState).toBe('Moderator');
    });

    it('should reflect placeholder input', () => {
      component.placeholder = 'Choose a role';
      fixture.detectChanges();
      expect(component.placeholder).toBe('Choose a role');
    });

    it('should reflect ariaLabel input', () => {
      component.ariaLabel = 'Select scope';
      fixture.detectChanges();
      expect(component.ariaLabel).toBe('Select scope');
    });

    it('should update selectedOptionState when selectedOption changes via ngOnChanges', () => {
      fixture.componentRef.setInput('options', TEST_OPTIONS);
      fixture.componentRef.setInput('selectedOption', 'Admin');
      fixture.detectChanges();
      expect(component.selectedOptionState).toBe('Admin');

      fixture.componentRef.setInput('selectedOption', 'Participant');
      fixture.detectChanges();
      expect(component.selectedOptionState).toBe('Participant');
    });

    it('should handle null options gracefully', () => {
      fixture.componentRef.setInput('options', null as any);
      expect(() => fixture.detectChanges()).not.toThrow();
    });

    it('should handle undefined selectedOption gracefully', () => {
      component.selectedOption = undefined as any;
      expect(() => fixture.detectChanges()).not.toThrow();
    });
  });

  // ---------------------------------------------------------------------------
  // Output Emissions
  // ---------------------------------------------------------------------------
  describe('Output Emissions', () => {
    it('should emit optionsChanged when an option is clicked', () => {
      const spy = vi.fn();
      component.optionsChanged.subscribe(spy);
      component.options = TEST_OPTIONS;
      fixture.detectChanges();

      openDropdown();

      const optionEls = el.querySelectorAll('.cometchat-dropdown__option');
      (optionEls[1] as HTMLElement).click();
      fixture.detectChanges();

      expect(spy).toHaveBeenCalledWith({ value: 'Moderator' });
    });

    it('should emit optionsChanged for each selection', () => {
      const spy = vi.fn();
      component.optionsChanged.subscribe(spy);
      component.options = TEST_OPTIONS;
      fixture.detectChanges();

      openDropdown();
      (el.querySelectorAll('.cometchat-dropdown__option')[0] as HTMLElement).click();
      fixture.detectChanges();

      openDropdown();
      (el.querySelectorAll('.cometchat-dropdown__option')[2] as HTMLElement).click();
      fixture.detectChanges();

      expect(spy).toHaveBeenCalledTimes(2);
      expect(spy).toHaveBeenNthCalledWith(1, { value: 'Admin' });
      expect(spy).toHaveBeenNthCalledWith(2, { value: 'Participant' });
    });

    it('should emit when selecting the same option again', () => {
      const spy = vi.fn();
      component.optionsChanged.subscribe(spy);
      component.options = TEST_OPTIONS;
      fixture.detectChanges();

      openDropdown();
      (el.querySelectorAll('.cometchat-dropdown__option')[0] as HTMLElement).click();
      fixture.detectChanges();

      openDropdown();
      (el.querySelectorAll('.cometchat-dropdown__option')[0] as HTMLElement).click();
      fixture.detectChanges();

      expect(spy).toHaveBeenCalledTimes(2);
    });
  });

  // ---------------------------------------------------------------------------
  // DOM Rendering
  // ---------------------------------------------------------------------------
  describe('DOM Rendering', () => {
    it('should render the root BEM block element', () => {
      fixture.detectChanges();
      expect(el.querySelector('.cometchat-dropdown')).toBeTruthy();
    });

    it('should render the dropdown button', () => {
      fixture.detectChanges();
      const button = el.querySelector('.cometchat-dropdown__button');
      expect(button).toBeTruthy();
      expect(button?.getAttribute('type')).toBe('button');
    });

    it('should display selectedOptionState in button text', () => {
      component.options = TEST_OPTIONS;
      component.selectedOption = 'Moderator';
      fixture.detectChanges();

      const text = el.querySelector('.cometchat-dropdown__button-text');
      expect(text?.textContent?.trim()).toBe('Moderator');
    });

    it('should display placeholder when no option is selected', () => {
      component.options = [];
      component.placeholder = 'Choose one';
      fixture.detectChanges();

      const text = el.querySelector('.cometchat-dropdown__button-text');
      expect(text?.textContent?.trim()).toBe('Choose one');
    });

    it('should not render the menu when dropdown is closed', () => {
      component.options = TEST_OPTIONS;
      fixture.detectChanges();

      expect(el.querySelector('.cometchat-dropdown__menu')).toBeFalsy();
    });

    it('should render the menu with correct number of options when open', () => {
      component.options = TEST_OPTIONS;
      fixture.detectChanges();
      openDropdown();

      const optionEls = el.querySelectorAll('.cometchat-dropdown__option');
      expect(optionEls.length).toBe(3);
    });

    it('should apply --selected modifier to the selected option', () => {
      component.options = TEST_OPTIONS;
      component.selectedOption = 'Moderator';
      fixture.detectChanges();
      openDropdown();

      const optionEls = el.querySelectorAll('.cometchat-dropdown__option');
      expect(optionEls[1].classList.contains('cometchat-dropdown__option--selected')).toBe(true);
      expect(optionEls[0].classList.contains('cometchat-dropdown__option--selected')).toBe(false);
    });

    it('should apply --focused modifier to the focused option', () => {
      component.options = TEST_OPTIONS;
      component.selectedOption = 'Admin';
      fixture.detectChanges();
      openDropdown();

      // After opening, focusedIndex should be on the selected option (index 0)
      const optionEls = el.querySelectorAll('.cometchat-dropdown__option');
      expect(optionEls[0].classList.contains('cometchat-dropdown__option--focused')).toBe(true);
    });

    it('should apply --open modifier to button when dropdown is open', () => {
      component.options = TEST_OPTIONS;
      fixture.detectChanges();
      openDropdown();

      const button = el.querySelector('.cometchat-dropdown__button');
      expect(button?.classList.contains('cometchat-dropdown__button--open')).toBe(true);
    });

    it('should close dropdown after selecting an option', () => {
      component.options = TEST_OPTIONS;
      fixture.detectChanges();
      openDropdown();

      (el.querySelectorAll('.cometchat-dropdown__option')[1] as HTMLElement).click();
      fixture.detectChanges();

      expect(el.querySelector('.cometchat-dropdown__menu')).toBeFalsy();
    });

    it('should render the icon with aria-hidden', () => {
      fixture.detectChanges();
      const icon = el.querySelector('.cometchat-dropdown__button-icon');
      expect(icon).toBeTruthy();
      expect(icon?.getAttribute('aria-hidden')).toBe('true');
    });
  });

  // ---------------------------------------------------------------------------
  // Keyboard Accessibility
  // ---------------------------------------------------------------------------
  describe('Keyboard Accessibility', () => {
    beforeEach(() => {
      component.options = TEST_OPTIONS;
      component.selectedOption = 'Admin';
      fixture.detectChanges();
    });

    function dispatchKeydown(key: string, target?: HTMLElement): void {
      const event = new KeyboardEvent('keydown', {
        key,
        bubbles: true,
        cancelable: true,
      });
      (target ?? el).dispatchEvent(event);
      fixture.detectChanges();
    }

    it('should open dropdown on Enter key', () => {
      dispatchKeydown('Enter');
      expect(component.dropdownVisible).toBe(true);
    });

    it('should open dropdown on Space key', () => {
      dispatchKeydown(' ');
      expect(component.dropdownVisible).toBe(true);
    });

    it('should close dropdown on Escape key', () => {
      openDropdown();
      expect(component.dropdownVisible).toBe(true);

      dispatchKeydown('Escape');
      expect(component.dropdownVisible).toBe(false);
    });

    it('should navigate down with ArrowDown', () => {
      openDropdown();
      const initialIndex = component.focusedIndex;

      dispatchKeydown('ArrowDown');
      expect(component.focusedIndex).toBe(initialIndex + 1);
    });

    it('should navigate up with ArrowUp', () => {
      openDropdown();
      // Move down first so we can go up
      dispatchKeydown('ArrowDown');
      const afterDown = component.focusedIndex;

      dispatchKeydown('ArrowUp');
      expect(component.focusedIndex).toBe(afterDown - 1);
    });

    it('should wrap from last to first on ArrowDown', () => {
      openDropdown();
      // Navigate to last item via repeated ArrowDown
      for (let i = 0; i < TEST_OPTIONS.length - 1; i++) {
        dispatchKeydown('ArrowDown');
      }
      expect(component.focusedIndex).toBe(TEST_OPTIONS.length - 1);

      dispatchKeydown('ArrowDown');
      expect(component.focusedIndex).toBe(0);
    });

    it('should wrap from first to last on ArrowUp', () => {
      openDropdown();
      // focusedIndex should be 0 after opening (selected = 'Admin' = index 0)
      expect(component.focusedIndex).toBe(0);

      dispatchKeydown('ArrowUp');
      expect(component.focusedIndex).toBe(TEST_OPTIONS.length - 1);
    });

    it('should select focused option on Enter when open', () => {
      const spy = vi.fn();
      component.optionsChanged.subscribe(spy);

      openDropdown();
      // Navigate to index 2 (Participant) via ArrowDown
      dispatchKeydown('ArrowDown');
      dispatchKeydown('ArrowDown');
      expect(component.focusedIndex).toBe(2);

      dispatchKeydown('Enter');
      expect(spy).toHaveBeenCalledWith({ value: 'Participant' });
      expect(component.dropdownVisible).toBe(false);
    });

    it('should select focused option on Space when open', () => {
      const spy = vi.fn();
      component.optionsChanged.subscribe(spy);

      openDropdown();
      // Navigate to index 1 (Moderator) via ArrowDown from index 0
      dispatchKeydown('ArrowDown');
      expect(component.focusedIndex).toBe(1);

      dispatchKeydown(' ');
      expect(spy).toHaveBeenCalledWith({ value: 'Moderator' });
      expect(component.dropdownVisible).toBe(false);
    });

    it('should jump to first option on Home key', () => {
      openDropdown();
      // Navigate to index 2 via ArrowDown twice
      dispatchKeydown('ArrowDown');
      dispatchKeydown('ArrowDown');
      expect(component.focusedIndex).toBe(2);

      dispatchKeydown('Home');
      expect(component.focusedIndex).toBe(0);
    });

    it('should jump to last option on End key', () => {
      openDropdown();
      // focusedIndex should be 0 after opening (selected = 'Admin' = index 0)
      expect(component.focusedIndex).toBe(0);

      dispatchKeydown('End');
      expect(component.focusedIndex).toBe(TEST_OPTIONS.length - 1);
    });

    it('should not navigate when dropdown is closed', () => {
      const initialIndex = component.focusedIndex;
      dispatchKeydown('ArrowDown');
      // Dropdown opens on ArrowDown only if it's Enter/Space; ArrowDown when closed does nothing
      // Actually the component only opens on activation keys (Enter/Space)
      // ArrowDown when closed should not change focusedIndex
      expect(component.focusedIndex).toBe(initialIndex);
    });
  });

  // ---------------------------------------------------------------------------
  // Type-Ahead Search
  // ---------------------------------------------------------------------------
  describe('Type-Ahead Search', () => {
    beforeEach(() => {
      component.options = ['Apple', 'Banana', 'Cherry', 'Date'];
      fixture.detectChanges();
      openDropdown();
    });

    function dispatchCharKey(char: string): void {
      const event = new KeyboardEvent('keydown', {
        key: char,
        bubbles: true,
        cancelable: true,
      });
      el.dispatchEvent(event);
      fixture.detectChanges();
    }

    it('should focus option starting with typed character', () => {
      dispatchCharKey('b');
      expect(component.focusedIndex).toBe(1); // Banana
    });

    it('should be case-insensitive', () => {
      dispatchCharKey('C');
      expect(component.focusedIndex).toBe(2); // Cherry
    });

    it('should not change focus when no match found', () => {
      const before = component.focusedIndex;
      dispatchCharKey('z');
      expect(component.focusedIndex).toBe(before);
    });
  });

  // ---------------------------------------------------------------------------
  // ARIA
  // ---------------------------------------------------------------------------
  describe('ARIA', () => {
    it('should have aria-expanded="false" when closed', () => {
      component.options = TEST_OPTIONS;
      fixture.detectChanges();

      const button = el.querySelector('.cometchat-dropdown__button');
      expect(button?.getAttribute('aria-expanded')).toBe('false');
    });

    it('should have aria-expanded="true" when open', () => {
      component.options = TEST_OPTIONS;
      fixture.detectChanges();
      openDropdown();

      const button = el.querySelector('.cometchat-dropdown__button');
      expect(button?.getAttribute('aria-expanded')).toBe('true');
    });

    it('should have aria-haspopup="listbox" on button', () => {
      fixture.detectChanges();
      const button = el.querySelector('.cometchat-dropdown__button');
      expect(button?.getAttribute('aria-haspopup')).toBe('listbox');
    });

    it('should have aria-controls pointing to listbox id', () => {
      fixture.detectChanges();
      const button = el.querySelector('.cometchat-dropdown__button');
      expect(button?.getAttribute('aria-controls')).toBe(component.listboxId);
    });

    it('should render listbox with role="listbox" when open', () => {
      component.options = TEST_OPTIONS;
      fixture.detectChanges();
      openDropdown();

      const listbox = el.querySelector('[role="listbox"]');
      expect(listbox).toBeTruthy();
      expect(listbox?.id).toBe(component.listboxId);
    });

    it('should not render listbox when closed', () => {
      component.options = TEST_OPTIONS;
      fixture.detectChanges();

      expect(el.querySelector('[role="listbox"]')).toBeFalsy();
    });

    it('should have role="option" on each option element', () => {
      component.options = TEST_OPTIONS;
      fixture.detectChanges();
      openDropdown();

      const options = el.querySelectorAll('[role="option"]');
      expect(options.length).toBe(3);
    });

    it('should have aria-selected="true" on the selected option', () => {
      component.options = TEST_OPTIONS;
      component.selectedOption = 'Moderator';
      fixture.detectChanges();
      openDropdown();

      const options = el.querySelectorAll('[role="option"]');
      expect(options[0].getAttribute('aria-selected')).toBe('false');
      expect(options[1].getAttribute('aria-selected')).toBe('true');
      expect(options[2].getAttribute('aria-selected')).toBe('false');
    });

    it('should set aria-activedescendant on button when option is focused', () => {
      component.options = TEST_OPTIONS;
      component.selectedOption = 'Admin';
      fixture.detectChanges();
      openDropdown();

      // After opening, focusedIndex is on selected option (index 0)
      const button = el.querySelector('.cometchat-dropdown__button');
      expect(button?.getAttribute('aria-activedescendant')).toBe(component.getOptionId(0));
    });

    it('should use custom ariaLabel on button when provided', () => {
      component.ariaLabel = 'Select scope';
      fixture.detectChanges();

      const button = el.querySelector('.cometchat-dropdown__button');
      expect(button?.getAttribute('aria-label')).toBe('Select scope');
    });

    it('should fall back to displayValue for aria-label when no ariaLabel', () => {
      component.options = TEST_OPTIONS;
      component.selectedOption = 'Admin';
      fixture.detectChanges();

      const button = el.querySelector('.cometchat-dropdown__button');
      expect(button?.getAttribute('aria-label')).toBe('Admin');
    });

    it('should have unique IDs on each option element', () => {
      component.options = TEST_OPTIONS;
      fixture.detectChanges();
      openDropdown();

      const options = el.querySelectorAll('[role="option"]');
      const ids = Array.from(options).map(o => o.id);
      expect(new Set(ids).size).toBe(3);
      ids.forEach((id, i) => {
        expect(id).toBe(component.getOptionId(i));
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Edge Cases
  // ---------------------------------------------------------------------------
  describe('Edge Cases', () => {
    it('should handle empty options array', () => {
      component.options = [];
      fixture.detectChanges();
      expect(component.selectedOptionState).toBe('');
    });

    it('should handle single option', () => {
      component.options = ['Only'];
      fixture.detectChanges();
      expect(component.selectedOptionState).toBe('Only');
    });

    it('should handle rapid open/close toggling', () => {
      component.options = TEST_OPTIONS;
      fixture.detectChanges();

      const button = el.querySelector('.cometchat-dropdown__button') as HTMLElement;
      button.click();
      fixture.detectChanges();
      button.click();
      fixture.detectChanges();
      button.click();
      fixture.detectChanges();

      expect(component.dropdownVisible).toBe(true);
    });

    it('should not change selectedOptionState when ngOnChanges has no selectedOption', () => {
      component.options = TEST_OPTIONS;
      component.selectedOption = 'Admin';
      fixture.detectChanges();

      component.ngOnChanges({
        options: {
          currentValue: ['X', 'Y'],
          previousValue: TEST_OPTIONS,
          firstChange: false,
          isFirstChange: () => false,
        },
      });
      expect(component.selectedOptionState).toBe('Admin');
    });

    it('should close dropdown on outside click', () => {
      component.options = TEST_OPTIONS;
      fixture.detectChanges();
      openDropdown();
      expect(component.dropdownVisible).toBe(true);

      // Simulate a click outside the component
      const outsideEvent = new MouseEvent('click', { bubbles: true });
      document.dispatchEvent(outsideEvent);
      fixture.detectChanges();

      expect(component.dropdownVisible).toBe(false);
    });

    it('should not close dropdown on inside click', () => {
      component.options = TEST_OPTIONS;
      fixture.detectChanges();
      openDropdown();

      // Click inside the component element
      const insideEvent = new MouseEvent('click', { bubbles: true });
      el.dispatchEvent(insideEvent);
      fixture.detectChanges();

      // Dropdown should still be open (the button click toggles, but the HostListener
      // checks contains — clicking on the host element itself is "inside")
      // The dropdown may close due to button toggle, so we check the menu is still present
      // Actually, clicking on el (not the button) should keep it open via HostListener
      expect(component.dropdownVisible).toBe(true);
    });

    it('should set focusedIndex to 0 when opening with no selected option', () => {
      component.options = TEST_OPTIONS;
      component.selectedOption = '';
      fixture.detectChanges();
      // Reset selectedOptionState to empty to simulate no selection
      component.selectedOptionState = '';

      openDropdown();
      expect(component.focusedIndex).toBe(0);
    });

    it('should handle displayValue with empty selectedOptionState', () => {
      component.placeholder = 'Pick one';
      fixture.detectChanges();
      expect(component.displayValue).toBe('Pick one');
    });

    it('should return null activeDescendantId when dropdown is closed', () => {
      component.options = TEST_OPTIONS;
      fixture.detectChanges();
      expect(component.activeDescendantId).toBeNull();
    });

    it('should return null activeDescendantId when focusedIndex is -1', () => {
      component.options = TEST_OPTIONS;
      fixture.detectChanges();
      component.dropdownVisible = true;
      component.focusedIndex = -1;
      expect(component.activeDescendantId).toBeNull();
    });
  });
});
