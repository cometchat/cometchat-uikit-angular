/**
 * Accessibility Test Utilities for CometChat UIKit
 *
 * Provides helper functions for testing keyboard accessibility,
 * focus management, and ARIA attributes across components.
 *
 * **Validates: Requirements 14.1-14.5**
 */

import { expect } from 'storybook/test';

/**
 * Options for creating keyboard events
 */
export interface KeyboardEventOptions {
  /** Whether the Shift key is pressed */
  shiftKey?: boolean;
  /** Whether the Ctrl key is pressed */
  ctrlKey?: boolean;
  /** Whether the Alt key is pressed */
  altKey?: boolean;
  /** Whether the Meta key is pressed */
  metaKey?: boolean;
}

/**
 * Creates a keyboard event for testing.
 *
 * @param key - The key value (e.g., 'Enter', 'Tab', 'ArrowDown')
 * @param options - Optional modifier keys
 * @returns KeyboardEvent - A keyboard event that can be dispatched
 *
 * @example
 * ```typescript
 * const enterEvent = createKeyboardEvent('Enter');
 * const shiftTabEvent = createKeyboardEvent('Tab', { shiftKey: true });
 * element.dispatchEvent(enterEvent);
 * ```
 */
export function createKeyboardEvent(key: string, options?: KeyboardEventOptions): KeyboardEvent {
  return new KeyboardEvent('keydown', {
    key,
    bubbles: true,
    cancelable: true,
    shiftKey: options?.shiftKey ?? false,
    ctrlKey: options?.ctrlKey ?? false,
    altKey: options?.altKey ?? false,
    metaKey: options?.metaKey ?? false,
  });
}

/**
 * Creates a keyup event for testing.
 *
 * @param key - The key value
 * @param options - Optional modifier keys
 * @returns KeyboardEvent - A keyup event
 */
export function createKeyupEvent(key: string, options?: KeyboardEventOptions): KeyboardEvent {
  return new KeyboardEvent('keyup', {
    key,
    bubbles: true,
    cancelable: true,
    shiftKey: options?.shiftKey ?? false,
    ctrlKey: options?.ctrlKey ?? false,
    altKey: options?.altKey ?? false,
    metaKey: options?.metaKey ?? false,
  });
}

/**
 * Simulates a keyboard navigation sequence on an element.
 *
 * Dispatches keydown events for each key in the sequence.
 * Useful for testing multi-step keyboard interactions.
 *
 * @param element - The element to dispatch events on
 * @param keys - Array of key values to simulate
 *
 * @example
 * ```typescript
 * // Simulate navigating down twice and pressing Enter
 * simulateKeySequence(dropdown, ['ArrowDown', 'ArrowDown', 'Enter']);
 * ```
 */
export function simulateKeySequence(element: HTMLElement, keys: string[]): void {
  keys.forEach(key => {
    element.dispatchEvent(createKeyboardEvent(key));
  });
}

/**
 * Simulates a keyboard sequence with delays between keys.
 *
 * Useful for testing type-ahead functionality where timing matters.
 *
 * @param element - The element to dispatch events on
 * @param keys - Array of key values to simulate
 * @param delayMs - Delay between each key press in milliseconds
 * @returns Promise that resolves when all keys have been dispatched
 */
export async function simulateKeySequenceWithDelay(
  element: HTMLElement,
  keys: string[],
  delayMs: number
): Promise<void> {
  for (const key of keys) {
    element.dispatchEvent(createKeyboardEvent(key));
    await delay(delayMs);
  }
}

/**
 * Gets the currently focused element within a container.
 *
 * @param container - The container element to search within
 * @returns HTMLElement | null - The focused element or null if none
 *
 * @example
 * ```typescript
 * const focused = getFocusedElement(dialog);
 * expect(focused).toBe(confirmButton);
 * ```
 */
export function getFocusedElement(container: HTMLElement): HTMLElement | null {
  const active = document.activeElement;
  return container.contains(active) ? (active as HTMLElement) : null;
}

/**
 * Gets the currently focused element in the document.
 *
 * @returns HTMLElement | null - The focused element or null
 */
export function getDocumentFocusedElement(): HTMLElement | null {
  return document.activeElement as HTMLElement | null;
}

/**
 * Asserts that an element has a specific ARIA attribute value.
 *
 * @param element - The element to check
 * @param attribute - The ARIA attribute name (e.g., 'aria-expanded')
 * @param expectedValue - The expected value (string or null for absent)
 *
 * @example
 * ```typescript
 * expectAriaAttribute(button, 'aria-expanded', 'true');
 * expectAriaAttribute(input, 'aria-disabled', null); // Attribute should be absent
 * ```
 */
export function expectAriaAttribute(
  element: HTMLElement,
  attribute: string,
  expectedValue: string | null
): void {
  const actual = element.getAttribute(attribute);
  expect(actual).toBe(expectedValue);
}

/**
 * Asserts that an element has a specific role attribute.
 *
 * @param element - The element to check
 * @param expectedRole - The expected role value
 */
export function expectRole(element: HTMLElement, expectedRole: string): void {
  const actual = element.getAttribute('role');
  expect(actual).toBe(expectedRole);
}

/**
 * Asserts that an element is focusable (has tabindex >= 0 or is natively focusable).
 *
 * @param element - The element to check
 */
export function expectFocusable(element: HTMLElement): void {
  const tabindex = element.getAttribute('tabindex');
  const isNativelyFocusable = ['BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'A'].includes(
    element.tagName
  );
  const isFocusable = isNativelyFocusable || (tabindex !== null && parseInt(tabindex, 10) >= 0);
  expect(isFocusable).toBe(true);
}

/**
 * Asserts that an element is not focusable (has tabindex=-1 or is disabled).
 *
 * @param element - The element to check
 */
export function expectNotFocusable(element: HTMLElement): void {
  const tabindex = element.getAttribute('tabindex');
  const isDisabled = element.hasAttribute('disabled');
  const isNotFocusable = isDisabled || tabindex === '-1';
  expect(isNotFocusable).toBe(true);
}

/**
 * Waits for a specified number of milliseconds.
 *
 * @param ms - Milliseconds to wait
 * @returns Promise that resolves after the delay
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Waits for the next animation frame.
 *
 * @returns Promise that resolves on the next animation frame
 */
export function waitForAnimationFrame(): Promise<void> {
  return new Promise(resolve => requestAnimationFrame(() => resolve()));
}

/**
 * Waits for Angular change detection to complete.
 * Use this after triggering events that cause state changes.
 *
 * @returns Promise that resolves after a microtask
 */
export function waitForChangeDetection(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 0));
}

/**
 * Simulates a focus event on an element.
 *
 * @param element - The element to focus
 */
export function simulateFocus(element: HTMLElement): void {
  element.focus();
  element.dispatchEvent(new FocusEvent('focus', { bubbles: true }));
}

/**
 * Simulates a blur event on an element.
 *
 * @param element - The element to blur
 */
export function simulateBlur(element: HTMLElement): void {
  element.blur();
  element.dispatchEvent(new FocusEvent('blur', { bubbles: true }));
}

/**
 * Simulates a click event on an element.
 *
 * @param element - The element to click
 */
export function simulateClick(element: HTMLElement): void {
  element.click();
}

/**
 * Gets all elements with a specific role within a container.
 *
 * @param container - The container to search within
 * @param role - The role to search for
 * @returns Array of elements with the specified role
 */
export function getElementsWithRole(container: HTMLElement, role: string): HTMLElement[] {
  return Array.from(container.querySelectorAll(`[role="${role}"]`)) as HTMLElement[];
}

/**
 * Gets the element referenced by aria-labelledby.
 *
 * @param element - The element with aria-labelledby
 * @returns The referenced element or null
 */
export function getAriaLabelledByElement(element: HTMLElement): HTMLElement | null {
  const labelledById = element.getAttribute('aria-labelledby');
  if (!labelledById) {
    return null;
  }
  return document.getElementById(labelledById);
}

/**
 * Gets the element referenced by aria-controls.
 *
 * @param element - The element with aria-controls
 * @returns The referenced element or null
 */
export function getAriaControlsElement(element: HTMLElement): HTMLElement | null {
  const controlsId = element.getAttribute('aria-controls');
  if (!controlsId) {
    return null;
  }
  return document.getElementById(controlsId);
}

/**
 * Checks if an element has visible focus indicator.
 * Note: This is a basic check - actual visual verification requires manual testing.
 *
 * @param element - The element to check
 * @returns boolean - true if the element appears to have focus styles
 */
export function hasFocusIndicator(element: HTMLElement): boolean {
  const styles = window.getComputedStyle(element);
  const hasOutline = styles.outline !== 'none' && styles.outlineWidth !== '0px';
  const hasBoxShadow = styles.boxShadow !== 'none';
  return hasOutline || hasBoxShadow;
}

/**
 * Creates a mock element for testing focus management.
 *
 * @param tagName - The tag name for the element
 * @param attributes - Optional attributes to set
 * @returns HTMLElement - The created element
 */
export function createMockElement(
  tagName: string,
  attributes?: Record<string, string>
): HTMLElement {
  const element = document.createElement(tagName);
  if (attributes) {
    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });
  }
  return element;
}

/**
 * Creates a container with focusable elements for testing focus trap.
 *
 * @param numButtons - Number of buttons to create
 * @returns Object with container and button references
 */
export function createFocusTrapTestContainer(numButtons = 3): {
  container: HTMLElement;
  buttons: HTMLButtonElement[];
} {
  const container = document.createElement('div');
  container.setAttribute('tabindex', '-1');
  const buttons: HTMLButtonElement[] = [];

  for (let i = 0; i < numButtons; i++) {
    const button = document.createElement('button');
    button.textContent = `Button ${i + 1}`;
    button.setAttribute('data-testid', `button-${i}`);
    container.appendChild(button);
    buttons.push(button);
  }

  return { container, buttons };
}

/**
 * Asserts that focus is trapped within a container.
 * Simulates Tab and Shift+Tab to verify cycling behavior.
 *
 * @param container - The container with focus trap
 * @param firstFocusable - The first focusable element
 * @param lastFocusable - The last focusable element
 */
export async function assertFocusTrap(
  container: HTMLElement,
  firstFocusable: HTMLElement,
  lastFocusable: HTMLElement
): Promise<void> {
  // Focus the last element
  lastFocusable.focus();
  expect(document.activeElement).toBe(lastFocusable);

  // Tab should cycle to first
  container.dispatchEvent(createKeyboardEvent('Tab'));
  await waitForChangeDetection();

  // Focus the first element
  firstFocusable.focus();
  expect(document.activeElement).toBe(firstFocusable);

  // Shift+Tab should cycle to last
  container.dispatchEvent(createKeyboardEvent('Tab', { shiftKey: true }));
  await waitForChangeDetection();
}
