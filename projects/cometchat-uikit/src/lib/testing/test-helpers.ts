/**
 * Shared Test Utilities
 *
 * Common helper functions used across 100+ spec files for handling
 * async operations, simulating user input, and dispatching keyboard events.
 * All helpers work with real SDK objects — no mock factories.
 *
 * @module testing/test-helpers
 * _Requirements: 14.3_
 *
 * @example
 * ```ts
 * import { flushPromises, triggerInput, triggerKeydown, waitForAsync } from '../../testing';
 *
 * it('should handle async operation', async () => {
 *   component.loadData();
 *   await flushPromises();
 *   expect(component.items.length).toBeGreaterThan(0);
 * });
 *
 * it('should respond to input', () => {
 *   const input = el.querySelector('input')!;
 *   triggerInput(input, 'search term');
 *   expect(component.searchText).toBe('search term');
 * });
 * ```
 */

/**
 * Options for keyboard event modifiers.
 *
 * Aligns with the `KeyboardEventOptions` interface in `accessibility-test-utils.ts`
 * for consistency across the testing module.
 */
export interface KeyboardEventModifiers {
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
 * Flushes the microtask queue by awaiting a resolved promise.
 *
 * Use this after triggering async operations (e.g., SDK calls that return
 * Promises) to allow pending microtasks to complete before assertions.
 *
 * @returns A promise that resolves after all pending microtasks have executed
 *
 * @example
 * ```ts
 * component.fetchUsers();
 * await flushPromises();
 * expect(component.users.length).toBe(5);
 * ```
 */
export function flushPromises(): Promise<void> {
  return Promise.resolve();
}

/**
 * Sets the value of an HTMLInputElement and dispatches an `input` event.
 *
 * Simulates a user typing into an input field. Sets the `.value` property
 * directly, then dispatches a bubbling `input` event so Angular's event
 * bindings and reactive forms pick up the change.
 *
 * @param el - The input element to update
 * @param value - The string value to set
 *
 * @example
 * ```ts
 * const input = fixture.nativeElement.querySelector('input');
 * triggerInput(input, 'hello');
 * fixture.detectChanges();
 * expect(component.searchText).toBe('hello');
 * ```
 */
export function triggerInput(el: HTMLInputElement, value: string): void {
  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
}

/**
 * Dispatches a `keydown` KeyboardEvent on the given element.
 *
 * Creates and dispatches a bubbling, cancelable `keydown` event with the
 * specified key and optional modifier keys. Complements the
 * `createKeyboardEvent` helper in `accessibility-test-utils.ts` by
 * combining event creation and dispatch into a single call.
 *
 * @param el - The element to dispatch the event on
 * @param key - The key value (e.g., 'Enter', 'Escape', 'ArrowDown')
 * @param modifiers - Optional modifier keys (shiftKey, ctrlKey, altKey, metaKey)
 *
 * @example
 * ```ts
 * const listItem = fixture.nativeElement.querySelector('[role="listitem"]');
 * triggerKeydown(listItem, 'ArrowDown');
 * triggerKeydown(listItem, 'Tab', { shiftKey: true });
 * ```
 */
export function triggerKeydown(
  el: HTMLElement,
  key: string,
  modifiers?: KeyboardEventModifiers
): void {
  const event = new KeyboardEvent('keydown', {
    key,
    bubbles: true,
    cancelable: true,
    shiftKey: modifiers?.shiftKey ?? false,
    ctrlKey: modifiers?.ctrlKey ?? false,
    altKey: modifiers?.altKey ?? false,
    metaKey: modifiers?.metaKey ?? false,
  });
  el.dispatchEvent(event);
}

/**
 * Wraps an async callback with an optional timeout guard.
 *
 * Executes the provided async function and flushes promises afterward.
 * If a `timeout` (in milliseconds) is specified and the function does not
 * resolve within that window, the returned promise rejects with a
 * timeout error.
 *
 * @param fn - An async function to execute
 * @param timeout - Optional maximum time in ms before the call is considered failed
 * @returns A promise that resolves after the function and all resulting microtasks complete
 *
 * @example
 * ```ts
 * await waitForAsync(async () => {
 *   component.sendMessage('hello');
 *   fixture.detectChanges();
 * });
 *
 * // With a 5-second timeout
 * await waitForAsync(async () => {
 *   await service.fetchData();
 * }, 5000);
 * ```
 */
export async function waitForAsync(fn: () => Promise<void>, timeout?: number): Promise<void> {
  if (timeout != null && timeout > 0) {
    const timer = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`waitForAsync timed out after ${timeout}ms`)), timeout);
    });
    await Promise.race([fn(), timer]);
  } else {
    await fn();
  }
  await flushPromises();
}
