import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  createKeyboardEvent,
  createKeyupEvent,
  simulateKeySequence,
  simulateKeySequenceWithDelay,
  getFocusedElement,
  getDocumentFocusedElement,
  expectAriaAttribute,
  expectRole,
  expectFocusable,
  expectNotFocusable,
  delay,
  waitForChangeDetection,
  simulateFocus,
  simulateBlur,
  simulateClick,
  getElementsWithRole,
  getAriaLabelledByElement,
  getAriaControlsElement,
  createMockElement,
  createFocusTrapTestContainer,
} from './accessibility-test-utils';

/**
 * Unit Tests for Accessibility Test Utilities
 *
 * These tests verify that the test utilities work correctly
 * for testing keyboard accessibility and ARIA attributes.
 *
 * **Validates: Requirements 14.1-14.5**
 */
describe('Accessibility Test Utilities', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  describe('createKeyboardEvent', () => {
    it('should create a keydown event with the specified key', () => {
      const event = createKeyboardEvent('Enter');

      expect(event.type).toBe('keydown');
      expect(event.key).toBe('Enter');
      expect(event.bubbles).toBe(true);
      expect(event.cancelable).toBe(true);
    });

    it('should create event with shiftKey modifier', () => {
      const event = createKeyboardEvent('Tab', { shiftKey: true });

      expect(event.key).toBe('Tab');
      expect(event.shiftKey).toBe(true);
      expect(event.ctrlKey).toBe(false);
    });

    it('should create event with ctrlKey modifier', () => {
      const event = createKeyboardEvent('A', { ctrlKey: true });

      expect(event.key).toBe('A');
      expect(event.ctrlKey).toBe(true);
      expect(event.shiftKey).toBe(false);
    });

    it('should create event with multiple modifiers', () => {
      const event = createKeyboardEvent('S', {
        shiftKey: true,
        ctrlKey: true,
        altKey: true,
        metaKey: true,
      });

      expect(event.shiftKey).toBe(true);
      expect(event.ctrlKey).toBe(true);
      expect(event.altKey).toBe(true);
      expect(event.metaKey).toBe(true);
    });

    it('should default all modifiers to false when not specified', () => {
      const event = createKeyboardEvent('Escape');

      expect(event.shiftKey).toBe(false);
      expect(event.ctrlKey).toBe(false);
      expect(event.altKey).toBe(false);
      expect(event.metaKey).toBe(false);
    });

    it('should create events for arrow keys', () => {
      const arrowKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];

      arrowKeys.forEach(key => {
        const event = createKeyboardEvent(key);
        expect(event.key).toBe(key);
      });
    });

    it('should create events for special keys', () => {
      const specialKeys = ['Enter', ' ', 'Escape', 'Tab', 'Home', 'End'];

      specialKeys.forEach(key => {
        const event = createKeyboardEvent(key);
        expect(event.key).toBe(key);
      });
    });
  });

  describe('createKeyupEvent', () => {
    it('should create a keyup event with the specified key', () => {
      const event = createKeyupEvent('Enter');

      expect(event.type).toBe('keyup');
      expect(event.key).toBe('Enter');
      expect(event.bubbles).toBe(true);
    });

    it('should support modifier keys', () => {
      const event = createKeyupEvent('Tab', { shiftKey: true });

      expect(event.type).toBe('keyup');
      expect(event.shiftKey).toBe(true);
    });
  });

  describe('simulateKeySequence', () => {
    it('should dispatch keydown events for each key in sequence', () => {
      const button = document.createElement('button');
      container.appendChild(button);

      const receivedKeys: string[] = [];
      button.addEventListener('keydown', (e: KeyboardEvent) => {
        receivedKeys.push(e.key);
      });

      simulateKeySequence(button, ['ArrowDown', 'ArrowDown', 'Enter']);

      expect(receivedKeys).toEqual(['ArrowDown', 'ArrowDown', 'Enter']);
    });

    it('should handle empty key sequence', () => {
      const button = document.createElement('button');
      container.appendChild(button);

      const receivedKeys: string[] = [];
      button.addEventListener('keydown', (e: KeyboardEvent) => {
        receivedKeys.push(e.key);
      });

      simulateKeySequence(button, []);

      expect(receivedKeys).toEqual([]);
    });

    it('should handle single key sequence', () => {
      const button = document.createElement('button');
      container.appendChild(button);

      const receivedKeys: string[] = [];
      button.addEventListener('keydown', (e: KeyboardEvent) => {
        receivedKeys.push(e.key);
      });

      simulateKeySequence(button, ['Escape']);

      expect(receivedKeys).toEqual(['Escape']);
    });
  });

  describe('simulateKeySequenceWithDelay', () => {
    it('should dispatch keys with delay between them', async () => {
      const button = document.createElement('button');
      container.appendChild(button);

      const timestamps: number[] = [];
      button.addEventListener('keydown', () => {
        timestamps.push(Date.now());
      });

      const startTime = Date.now();
      await simulateKeySequenceWithDelay(button, ['a', 'b', 'c'], 50);

      expect(timestamps.length).toBe(3);
      // Each key should be at least 50ms apart (with some tolerance)
      expect(timestamps[1] - timestamps[0]).toBeGreaterThanOrEqual(45);
      expect(timestamps[2] - timestamps[1]).toBeGreaterThanOrEqual(45);
    });
  });

  describe('getFocusedElement', () => {
    it('should return the focused element within container', () => {
      const button = document.createElement('button');
      container.appendChild(button);
      button.focus();

      const focused = getFocusedElement(container);

      expect(focused).toBe(button);
    });

    it('should return null when no element is focused within container', () => {
      const button = document.createElement('button');
      container.appendChild(button);
      // Don't focus the button

      const focused = getFocusedElement(container);

      expect(focused).toBeNull();
    });

    it('should return null when focused element is outside container', () => {
      const outsideButton = document.createElement('button');
      document.body.appendChild(outsideButton);
      outsideButton.focus();

      const focused = getFocusedElement(container);

      expect(focused).toBeNull();

      document.body.removeChild(outsideButton);
    });
  });

  describe('getDocumentFocusedElement', () => {
    it('should return the currently focused element in document', () => {
      const button = document.createElement('button');
      container.appendChild(button);
      button.focus();

      const focused = getDocumentFocusedElement();

      expect(focused).toBe(button);
    });
  });

  describe('expectAriaAttribute', () => {
    it('should pass when attribute matches expected value', () => {
      const button = document.createElement('button');
      button.setAttribute('aria-expanded', 'true');

      // Should not throw
      expectAriaAttribute(button, 'aria-expanded', 'true');
    });

    it('should pass when attribute is absent and expected null', () => {
      const button = document.createElement('button');

      // Should not throw
      expectAriaAttribute(button, 'aria-expanded', null);
    });

    it('should work with various ARIA attributes', () => {
      const element = document.createElement('div');
      element.setAttribute('aria-modal', 'true');
      element.setAttribute('aria-labelledby', 'title-id');
      element.setAttribute('aria-disabled', 'false');

      expectAriaAttribute(element, 'aria-modal', 'true');
      expectAriaAttribute(element, 'aria-labelledby', 'title-id');
      expectAriaAttribute(element, 'aria-disabled', 'false');
    });
  });

  describe('expectRole', () => {
    it('should pass when role matches expected value', () => {
      const element = document.createElement('div');
      element.setAttribute('role', 'dialog');

      // Should not throw
      expectRole(element, 'dialog');
    });

    it('should work with various roles', () => {
      const roles = ['menu', 'menuitem', 'listbox', 'option', 'button', 'alert'];

      roles.forEach(role => {
        const element = document.createElement('div');
        element.setAttribute('role', role);
        expectRole(element, role);
      });
    });
  });

  describe('expectFocusable', () => {
    it('should pass for button elements', () => {
      const button = document.createElement('button');

      // Should not throw
      expectFocusable(button);
    });

    it('should pass for input elements', () => {
      const input = document.createElement('input');

      expectFocusable(input);
    });

    it('should pass for elements with tabindex="0"', () => {
      const div = document.createElement('div');
      div.setAttribute('tabindex', '0');

      expectFocusable(div);
    });

    it('should pass for elements with positive tabindex', () => {
      const div = document.createElement('div');
      div.setAttribute('tabindex', '1');

      expectFocusable(div);
    });

    it('should pass for anchor elements', () => {
      const anchor = document.createElement('a');

      expectFocusable(anchor);
    });
  });

  describe('expectNotFocusable', () => {
    it('should pass for elements with tabindex="-1"', () => {
      const div = document.createElement('div');
      div.setAttribute('tabindex', '-1');

      // Should not throw
      expectNotFocusable(div);
    });

    it('should pass for disabled elements', () => {
      const button = document.createElement('button');
      button.setAttribute('disabled', '');

      expectNotFocusable(button);
    });
  });

  describe('delay', () => {
    it('should wait for specified milliseconds', async () => {
      const startTime = Date.now();
      await delay(50);
      const elapsed = Date.now() - startTime;

      expect(elapsed).toBeGreaterThanOrEqual(45);
    });
  });

  describe('waitForChangeDetection', () => {
    it('should resolve after a microtask', async () => {
      let resolved = false;

      const promise = waitForChangeDetection().then(() => {
        resolved = true;
      });

      // Should not be resolved synchronously
      expect(resolved).toBe(false);

      await promise;
      expect(resolved).toBe(true);
    });
  });

  describe('simulateFocus', () => {
    it('should focus the element and dispatch focus event', () => {
      const button = document.createElement('button');
      container.appendChild(button);

      let focusEventReceived = false;
      button.addEventListener('focus', () => {
        focusEventReceived = true;
      });

      simulateFocus(button);

      expect(document.activeElement).toBe(button);
      expect(focusEventReceived).toBe(true);
    });
  });

  describe('simulateBlur', () => {
    it('should blur the element and dispatch blur event', () => {
      const button = document.createElement('button');
      container.appendChild(button);
      button.focus();

      let blurEventReceived = false;
      button.addEventListener('blur', () => {
        blurEventReceived = true;
      });

      simulateBlur(button);

      expect(blurEventReceived).toBe(true);
    });
  });

  describe('simulateClick', () => {
    it('should dispatch click event on element', () => {
      const button = document.createElement('button');
      container.appendChild(button);

      let clicked = false;
      button.addEventListener('click', () => {
        clicked = true;
      });

      simulateClick(button);

      expect(clicked).toBe(true);
    });
  });

  describe('getElementsWithRole', () => {
    it('should return all elements with specified role', () => {
      container.innerHTML = `
        <div role="menuitem">Item 1</div>
        <div role="menuitem">Item 2</div>
        <div role="menu">Menu</div>
        <div role="menuitem">Item 3</div>
      `;

      const menuItems = getElementsWithRole(container, 'menuitem');

      expect(menuItems.length).toBe(3);
    });

    it('should return empty array when no elements match', () => {
      container.innerHTML = `<div>No roles here</div>`;

      const menuItems = getElementsWithRole(container, 'menuitem');

      expect(menuItems).toEqual([]);
    });
  });

  describe('getAriaLabelledByElement', () => {
    it('should return the element referenced by aria-labelledby', () => {
      const title = document.createElement('h2');
      title.id = 'dialog-title';
      title.textContent = 'Dialog Title';
      container.appendChild(title);

      const dialog = document.createElement('div');
      dialog.setAttribute('aria-labelledby', 'dialog-title');
      container.appendChild(dialog);

      const labelElement = getAriaLabelledByElement(dialog);

      expect(labelElement).toBe(title);
    });

    it('should return null when aria-labelledby is not set', () => {
      const dialog = document.createElement('div');
      container.appendChild(dialog);

      const labelElement = getAriaLabelledByElement(dialog);

      expect(labelElement).toBeNull();
    });

    it('should return null when referenced element does not exist', () => {
      const dialog = document.createElement('div');
      dialog.setAttribute('aria-labelledby', 'non-existent-id');
      container.appendChild(dialog);

      const labelElement = getAriaLabelledByElement(dialog);

      expect(labelElement).toBeNull();
    });
  });

  describe('getAriaControlsElement', () => {
    it('should return the element referenced by aria-controls', () => {
      const listbox = document.createElement('ul');
      listbox.id = 'dropdown-listbox';
      container.appendChild(listbox);

      const button = document.createElement('button');
      button.setAttribute('aria-controls', 'dropdown-listbox');
      container.appendChild(button);

      const controlledElement = getAriaControlsElement(button);

      expect(controlledElement).toBe(listbox);
    });

    it('should return null when aria-controls is not set', () => {
      const button = document.createElement('button');
      container.appendChild(button);

      const controlledElement = getAriaControlsElement(button);

      expect(controlledElement).toBeNull();
    });
  });

  describe('createMockElement', () => {
    it('should create element with specified tag name', () => {
      const element = createMockElement('button');

      expect(element.tagName.toLowerCase()).toBe('button');
    });

    it('should set attributes when provided', () => {
      const element = createMockElement('div', {
        role: 'dialog',
        'aria-modal': 'true',
        id: 'test-dialog',
      });

      expect(element.getAttribute('role')).toBe('dialog');
      expect(element.getAttribute('aria-modal')).toBe('true');
      expect(element.getAttribute('id')).toBe('test-dialog');
    });

    it('should create element without attributes when not provided', () => {
      const element = createMockElement('span');

      expect(element.attributes.length).toBe(0);
    });
  });

  describe('createFocusTrapTestContainer', () => {
    it('should create container with specified number of buttons', () => {
      const { container: testContainer, buttons } = createFocusTrapTestContainer(5);

      expect(buttons.length).toBe(5);
      expect(testContainer.children.length).toBe(5);
    });

    it('should default to 3 buttons', () => {
      const { buttons } = createFocusTrapTestContainer();

      expect(buttons.length).toBe(3);
    });

    it('should set tabindex="-1" on container', () => {
      const { container: testContainer } = createFocusTrapTestContainer();

      expect(testContainer.getAttribute('tabindex')).toBe('-1');
    });

    it('should set data-testid on each button', () => {
      const { buttons } = createFocusTrapTestContainer(3);

      expect(buttons[0].getAttribute('data-testid')).toBe('button-0');
      expect(buttons[1].getAttribute('data-testid')).toBe('button-1');
      expect(buttons[2].getAttribute('data-testid')).toBe('button-2');
    });

    it('should set button text content', () => {
      const { buttons } = createFocusTrapTestContainer(2);

      expect(buttons[0].textContent).toBe('Button 1');
      expect(buttons[1].textContent).toBe('Button 2');
    });
  });
});
