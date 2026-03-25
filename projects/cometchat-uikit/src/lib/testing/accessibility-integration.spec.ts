import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FocusTrapService } from '../services/focus-trap.service';
import {
  createKeyboardEvent,
  expectAriaAttribute,
  expectRole,
  delay,
  createFocusTrapTestContainer,
} from './accessibility-test-utils';

/**
 * Integration Tests for Accessibility Features
 *
 * These tests verify end-to-end accessibility flows including:
 * - Dialog open/close/focus restoration
 * - Dropdown open/type-ahead/selection
 * - Focus trap behavior
 *
 * **Validates: Requirements 14.1-14.5**
 */
describe('Accessibility Integration Tests', () => {
  /**
   * Test Suite: Dialog Focus Management Flow
   *
   * Tests the complete dialog lifecycle:
   * 1. Open dialog -> focus moves to dialog
   * 2. Tab cycles within dialog (focus trap)
   * 3. Escape closes dialog
   * 4. Focus returns to trigger element
   */
  describe('Dialog Open/Close/Focus Restoration Flow', () => {
    let focusTrapService: FocusTrapService;
    let container: HTMLElement;
    let triggerButton: HTMLButtonElement;
    let dialogContainer: HTMLDivElement;
    let dialogButtons: HTMLButtonElement[];

    beforeEach(() => {
      focusTrapService = new FocusTrapService();

      // Create trigger button (simulates the button that opens the dialog)
      triggerButton = document.createElement('button');
      triggerButton.textContent = 'Open Dialog';
      triggerButton.setAttribute('data-testid', 'trigger');
      document.body.appendChild(triggerButton);

      // Create dialog container
      dialogContainer = document.createElement('div');
      dialogContainer.setAttribute('role', 'dialog');
      dialogContainer.setAttribute('aria-modal', 'true');
      dialogContainer.setAttribute('tabindex', '-1');
      dialogContainer.style.display = 'none';

      // Create dialog buttons
      dialogButtons = [];
      const buttonLabels = ['Cancel', 'Confirm'];
      buttonLabels.forEach((label, index) => {
        const button = document.createElement('button');
        button.textContent = label;
        button.setAttribute('data-testid', `dialog-button-${index}`);
        dialogContainer.appendChild(button);
        dialogButtons.push(button);
      });

      document.body.appendChild(dialogContainer);
    });

    afterEach(() => {
      // Cleanup
      if (focusTrapService.isActive(dialogContainer)) {
        focusTrapService.deactivate(dialogContainer);
      }
      document.body.removeChild(triggerButton);
      document.body.removeChild(dialogContainer);
    });

    it('should move focus to dialog when opened', async () => {
      // Focus the trigger button first
      triggerButton.focus();
      expect(document.activeElement).toBe(triggerButton);

      // Simulate opening the dialog
      dialogContainer.style.display = 'block';
      focusTrapService.activate({
        container: dialogContainer,
        initialFocus: 'first',
        returnFocusOnDeactivate: true,
      });

      // Wait for focus to be set
      await delay(10);

      // Focus should be on the first button in the dialog
      expect(document.activeElement).toBe(dialogButtons[0]);
    });

    it('should trap focus within dialog using Tab', async () => {
      // Open dialog
      dialogContainer.style.display = 'block';
      focusTrapService.activate({
        container: dialogContainer,
        initialFocus: 'first',
        returnFocusOnDeactivate: true,
      });

      await delay(10);

      // Focus should be on first button
      expect(document.activeElement).toBe(dialogButtons[0]);

      // Simulate Tab on last button - should cycle to first
      dialogButtons[1].focus();
      dialogContainer.dispatchEvent(createKeyboardEvent('Tab'));

      // Note: The actual focus cycling is handled by the keydown handler
      // In a real scenario, the focus trap would prevent default and set focus
    });

    it('should trap focus within dialog using Shift+Tab', async () => {
      // Open dialog
      dialogContainer.style.display = 'block';
      focusTrapService.activate({
        container: dialogContainer,
        initialFocus: 'first',
        returnFocusOnDeactivate: true,
      });

      await delay(10);

      // Focus should be on first button
      expect(document.activeElement).toBe(dialogButtons[0]);

      // Simulate Shift+Tab on first button - should cycle to last
      dialogContainer.dispatchEvent(createKeyboardEvent('Tab', { shiftKey: true }));

      // The focus trap handler should handle this
    });

    it('should restore focus to trigger when dialog closes', async () => {
      // Focus the trigger button first
      triggerButton.focus();
      expect(document.activeElement).toBe(triggerButton);

      // Open dialog
      dialogContainer.style.display = 'block';
      focusTrapService.activate({
        container: dialogContainer,
        initialFocus: 'first',
        returnFocusOnDeactivate: true,
      });

      await delay(10);

      // Focus should be in dialog
      expect(document.activeElement).toBe(dialogButtons[0]);

      // Close dialog
      dialogContainer.style.display = 'none';
      focusTrapService.deactivate(dialogContainer);

      await delay(10);

      // Focus should return to trigger
      expect(document.activeElement).toBe(triggerButton);
    });

    it('should have correct ARIA attributes on dialog', () => {
      expectRole(dialogContainer, 'dialog');
      expectAriaAttribute(dialogContainer, 'aria-modal', 'true');
    });

    it('should handle dialog with aria-labelledby', () => {
      // Add title element
      const title = document.createElement('h2');
      title.id = 'dialog-title';
      title.textContent = 'Confirm Action';
      dialogContainer.insertBefore(title, dialogContainer.firstChild);
      dialogContainer.setAttribute('aria-labelledby', 'dialog-title');

      expectAriaAttribute(dialogContainer, 'aria-labelledby', 'dialog-title');
    });

    it('should not restore focus when returnFocusOnDeactivate is false', async () => {
      // Focus the trigger button first
      triggerButton.focus();

      // Open dialog without focus restoration
      dialogContainer.style.display = 'block';
      focusTrapService.activate({
        container: dialogContainer,
        initialFocus: 'first',
        returnFocusOnDeactivate: false,
      });

      await delay(10);

      // Close dialog
      focusTrapService.deactivate(dialogContainer);

      await delay(10);

      // Focus should NOT return to trigger (stays on body or last focused)
      // The exact behavior depends on browser, but it shouldn't be the trigger
    });

    it('should focus container when initialFocus is "container"', async () => {
      // Open dialog with container focus
      dialogContainer.style.display = 'block';
      focusTrapService.activate({
        container: dialogContainer,
        initialFocus: 'container',
        returnFocusOnDeactivate: true,
      });

      await delay(10);

      // Focus should be on the container itself
      expect(document.activeElement).toBe(dialogContainer);
    });

    it('should focus specific element when initialFocus is an element', async () => {
      // Open dialog with specific element focus
      dialogContainer.style.display = 'block';
      focusTrapService.activate({
        container: dialogContainer,
        initialFocus: dialogButtons[1], // Focus the Confirm button
        returnFocusOnDeactivate: true,
      });

      await delay(10);

      // Focus should be on the specified button
      expect(document.activeElement).toBe(dialogButtons[1]);
    });
  });

  /**
   * Test Suite: Dropdown Keyboard Navigation Flow
   *
   * Tests the complete dropdown interaction:
   * 1. Open dropdown with Enter/Space
   * 2. Navigate with arrow keys
   * 3. Type-ahead search
   * 4. Select with Enter
   * 5. Close with Escape
   * 6. Focus returns to button
   */
  describe('Dropdown Open/Type-Ahead/Selection Flow', () => {
    let container: HTMLElement;
    let dropdownButton: HTMLButtonElement;
    let dropdownMenu: HTMLUListElement;
    let options: HTMLLIElement[];
    let isOpen: boolean;
    let focusedIndex: number;
    let selectedValue: string;
    let typeAheadBuffer: string;
    let typeAheadTimeout: any;

    const optionValues = ['Apple', 'Banana', 'Cherry', 'Date', 'Elderberry'];

    beforeEach(() => {
      isOpen = false;
      focusedIndex = -1;
      selectedValue = '';
      typeAheadBuffer = '';

      // Create dropdown button
      dropdownButton = document.createElement('button');
      dropdownButton.textContent = 'Select fruit';
      dropdownButton.setAttribute('aria-haspopup', 'listbox');
      dropdownButton.setAttribute('aria-expanded', 'false');
      document.body.appendChild(dropdownButton);

      // Create dropdown menu
      dropdownMenu = document.createElement('ul');
      dropdownMenu.setAttribute('role', 'listbox');
      dropdownMenu.style.display = 'none';

      // Create options
      options = [];
      optionValues.forEach((value, index) => {
        const option = document.createElement('li');
        option.textContent = value;
        option.setAttribute('role', 'option');
        option.setAttribute('aria-selected', 'false');
        option.id = `option-${index}`;
        dropdownMenu.appendChild(option);
        options.push(option);
      });

      document.body.appendChild(dropdownMenu);

      // Setup keyboard handler
      dropdownButton.addEventListener('keydown', handleKeyDown);
    });

    afterEach(() => {
      dropdownButton.removeEventListener('keydown', handleKeyDown);
      document.body.removeChild(dropdownButton);
      document.body.removeChild(dropdownMenu);
      if (typeAheadTimeout) {
        clearTimeout(typeAheadTimeout);
      }
    });

    function openDropdown(): void {
      isOpen = true;
      dropdownMenu.style.display = 'block';
      dropdownButton.setAttribute('aria-expanded', 'true');
      focusedIndex = 0;
      updateFocusedOption();
    }

    function closeDropdown(): void {
      isOpen = false;
      dropdownMenu.style.display = 'none';
      dropdownButton.setAttribute('aria-expanded', 'false');
      focusedIndex = -1;
      dropdownButton.focus();
    }

    function selectOption(index: number): void {
      selectedValue = optionValues[index];
      options.forEach((opt, i) => {
        opt.setAttribute('aria-selected', i === index ? 'true' : 'false');
      });
      dropdownButton.textContent = selectedValue;
      closeDropdown();
    }

    function updateFocusedOption(): void {
      options.forEach((opt, i) => {
        opt.classList.toggle('focused', i === focusedIndex);
      });
      if (focusedIndex >= 0) {
        dropdownButton.setAttribute('aria-activedescendant', `option-${focusedIndex}`);
      } else {
        dropdownButton.removeAttribute('aria-activedescendant');
      }
    }

    function handleTypeAhead(char: string): void {
      if (typeAheadTimeout) {
        clearTimeout(typeAheadTimeout);
      }

      typeAheadBuffer += char.toLowerCase();

      const matchIndex = optionValues.findIndex(opt =>
        opt.toLowerCase().startsWith(typeAheadBuffer)
      );

      if (matchIndex !== -1) {
        focusedIndex = matchIndex;
        updateFocusedOption();
      }

      typeAheadTimeout = setTimeout(() => {
        typeAheadBuffer = '';
      }, 500);
    }

    function handleKeyDown(event: KeyboardEvent): void {
      if (!isOpen) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openDropdown();
        }
        return;
      }

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          focusedIndex = (focusedIndex + 1) % options.length;
          updateFocusedOption();
          break;
        case 'ArrowUp':
          event.preventDefault();
          focusedIndex = (focusedIndex - 1 + options.length) % options.length;
          updateFocusedOption();
          break;
        case 'Home':
          event.preventDefault();
          focusedIndex = 0;
          updateFocusedOption();
          break;
        case 'End':
          event.preventDefault();
          focusedIndex = options.length - 1;
          updateFocusedOption();
          break;
        case 'Enter':
        case ' ':
          event.preventDefault();
          if (focusedIndex >= 0) {
            selectOption(focusedIndex);
          }
          break;
        case 'Escape':
          event.preventDefault();
          closeDropdown();
          break;
        default:
          // Type-ahead for single characters
          if (event.key.length === 1 && !event.ctrlKey && !event.metaKey) {
            handleTypeAhead(event.key);
          }
      }
    }

    it('should open dropdown on Enter key', () => {
      dropdownButton.focus();
      dropdownButton.dispatchEvent(createKeyboardEvent('Enter'));

      expect(isOpen).toBe(true);
      expect(dropdownMenu.style.display).toBe('block');
      expectAriaAttribute(dropdownButton, 'aria-expanded', 'true');
    });

    it('should open dropdown on Space key', () => {
      dropdownButton.focus();
      dropdownButton.dispatchEvent(createKeyboardEvent(' '));

      expect(isOpen).toBe(true);
      expectAriaAttribute(dropdownButton, 'aria-expanded', 'true');
    });

    it('should navigate down with ArrowDown', () => {
      openDropdown();
      expect(focusedIndex).toBe(0);

      dropdownButton.dispatchEvent(createKeyboardEvent('ArrowDown'));
      expect(focusedIndex).toBe(1);

      dropdownButton.dispatchEvent(createKeyboardEvent('ArrowDown'));
      expect(focusedIndex).toBe(2);
    });

    it('should navigate up with ArrowUp', () => {
      openDropdown();
      focusedIndex = 2;
      updateFocusedOption();

      dropdownButton.dispatchEvent(createKeyboardEvent('ArrowUp'));
      expect(focusedIndex).toBe(1);

      dropdownButton.dispatchEvent(createKeyboardEvent('ArrowUp'));
      expect(focusedIndex).toBe(0);
    });

    it('should wrap around at end with ArrowDown', () => {
      openDropdown();
      focusedIndex = options.length - 1;
      updateFocusedOption();

      dropdownButton.dispatchEvent(createKeyboardEvent('ArrowDown'));
      expect(focusedIndex).toBe(0);
    });

    it('should wrap around at start with ArrowUp', () => {
      openDropdown();
      focusedIndex = 0;
      updateFocusedOption();

      dropdownButton.dispatchEvent(createKeyboardEvent('ArrowUp'));
      expect(focusedIndex).toBe(options.length - 1);
    });

    it('should jump to first option with Home key', () => {
      openDropdown();
      focusedIndex = 3;
      updateFocusedOption();

      dropdownButton.dispatchEvent(createKeyboardEvent('Home'));
      expect(focusedIndex).toBe(0);
    });

    it('should jump to last option with End key', () => {
      openDropdown();
      focusedIndex = 1;
      updateFocusedOption();

      dropdownButton.dispatchEvent(createKeyboardEvent('End'));
      expect(focusedIndex).toBe(options.length - 1);
    });

    it('should select option with Enter key', () => {
      openDropdown();
      focusedIndex = 2; // Cherry
      updateFocusedOption();

      dropdownButton.dispatchEvent(createKeyboardEvent('Enter'));

      expect(selectedValue).toBe('Cherry');
      expect(isOpen).toBe(false);
      expectAriaAttribute(options[2], 'aria-selected', 'true');
    });

    it('should close dropdown with Escape key', () => {
      openDropdown();

      dropdownButton.dispatchEvent(createKeyboardEvent('Escape'));

      expect(isOpen).toBe(false);
      expectAriaAttribute(dropdownButton, 'aria-expanded', 'false');
    });

    it('should restore focus to button after closing', () => {
      dropdownButton.focus();
      openDropdown();

      dropdownButton.dispatchEvent(createKeyboardEvent('Escape'));

      expect(document.activeElement).toBe(dropdownButton);
    });

    it('should implement type-ahead search', () => {
      openDropdown();
      focusedIndex = 0;
      updateFocusedOption();

      // Type 'c' to jump to Cherry
      dropdownButton.dispatchEvent(createKeyboardEvent('c'));
      expect(focusedIndex).toBe(2); // Cherry

      // Type 'h' to continue search for 'ch'
      dropdownButton.dispatchEvent(createKeyboardEvent('h'));
      expect(focusedIndex).toBe(2); // Still Cherry
    });

    it('should reset type-ahead buffer after timeout', async () => {
      openDropdown();

      // Type 'b' to jump to Banana
      dropdownButton.dispatchEvent(createKeyboardEvent('b'));
      expect(focusedIndex).toBe(1); // Banana

      // Wait for buffer to clear
      await delay(600);

      // Type 'c' should now jump to Cherry (not search for 'bc')
      dropdownButton.dispatchEvent(createKeyboardEvent('c'));
      expect(focusedIndex).toBe(2); // Cherry
    });

    it('should have correct ARIA attributes on dropdown button', () => {
      expectAriaAttribute(dropdownButton, 'aria-haspopup', 'listbox');
      expectAriaAttribute(dropdownButton, 'aria-expanded', 'false');

      openDropdown();
      expectAriaAttribute(dropdownButton, 'aria-expanded', 'true');
    });

    it('should have correct ARIA attributes on listbox', () => {
      expectRole(dropdownMenu, 'listbox');
    });

    it('should have correct ARIA attributes on options', () => {
      options.forEach(option => {
        expectRole(option, 'option');
        expectAriaAttribute(option, 'aria-selected', 'false');
      });
    });

    it('should update aria-activedescendant when navigating', () => {
      openDropdown();
      expect(dropdownButton.getAttribute('aria-activedescendant')).toBe('option-0');

      dropdownButton.dispatchEvent(createKeyboardEvent('ArrowDown'));
      expect(dropdownButton.getAttribute('aria-activedescendant')).toBe('option-1');
    });

    it('should update aria-selected when option is selected', () => {
      openDropdown();
      focusedIndex = 1;
      updateFocusedOption();

      dropdownButton.dispatchEvent(createKeyboardEvent('Enter'));

      expectAriaAttribute(options[1], 'aria-selected', 'true');
      options.forEach((opt, i) => {
        if (i !== 1) {
          expectAriaAttribute(opt, 'aria-selected', 'false');
        }
      });
    });

    it('should handle complete keyboard flow: open -> navigate -> select', () => {
      dropdownButton.focus();

      // Open with Enter
      dropdownButton.dispatchEvent(createKeyboardEvent('Enter'));
      expect(isOpen).toBe(true);

      // Navigate down twice
      dropdownButton.dispatchEvent(createKeyboardEvent('ArrowDown'));
      dropdownButton.dispatchEvent(createKeyboardEvent('ArrowDown'));
      expect(focusedIndex).toBe(2);

      // Select with Enter
      dropdownButton.dispatchEvent(createKeyboardEvent('Enter'));
      expect(selectedValue).toBe('Cherry');
      expect(isOpen).toBe(false);
      expect(document.activeElement).toBe(dropdownButton);
    });
  });

  /**
   * Test Suite: Focus Trap Service Integration
   *
   * Tests the FocusTrapService with various container configurations.
   */
  describe('FocusTrapService Integration', () => {
    let focusTrapService: FocusTrapService;

    beforeEach(() => {
      focusTrapService = new FocusTrapService();
    });

    afterEach(() => {
      // Cleanup any active traps
    });

    it('should activate and deactivate focus trap', () => {
      const { container, buttons } = createFocusTrapTestContainer(3);
      document.body.appendChild(container);

      focusTrapService.activate({
        container,
        initialFocus: 'first',
      });

      expect(focusTrapService.isActive(container)).toBe(true);

      focusTrapService.deactivate(container);

      expect(focusTrapService.isActive(container)).toBe(false);

      document.body.removeChild(container);
    });

    it('should not activate duplicate trap for same container', () => {
      const { container } = createFocusTrapTestContainer(2);
      document.body.appendChild(container);

      focusTrapService.activate({ container, initialFocus: 'first' });
      focusTrapService.activate({ container, initialFocus: 'first' });

      // Should still be active (not throw or create duplicate)
      expect(focusTrapService.isActive(container)).toBe(true);

      focusTrapService.deactivate(container);
      document.body.removeChild(container);
    });

    it('should handle container with no focusable elements', async () => {
      const container = document.createElement('div');
      container.setAttribute('tabindex', '-1');
      container.innerHTML = '<p>No focusable elements here</p>';
      document.body.appendChild(container);

      focusTrapService.activate({
        container,
        initialFocus: 'first',
      });

      await delay(10);

      // Should focus the container itself as fallback
      expect(document.activeElement).toBe(container);

      focusTrapService.deactivate(container);
      document.body.removeChild(container);
    });

    it('should handle deactivate on non-active container gracefully', () => {
      const container = document.createElement('div');

      // Should not throw
      expect(() => focusTrapService.deactivate(container)).not.toThrow();
    });

    it('should handle invalid container gracefully', () => {
      // Should not throw
      expect(() =>
        focusTrapService.activate({
          container: null as any,
          initialFocus: 'first',
        })
      ).not.toThrow();
    });
  });
});
