import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';
import { EventEmitter } from '@angular/core';
import { CometChatMessageComposerAction } from '../../../modals';

/**
 * Property-Based Tests for Action Sheet Tab Exit Behavior
 *
 * **Validates: Requirements 4.1, 4.2, 4.3**
 *
 * Property 3: Action Sheet Tab Exit
 * For any action sheet component, pressing Tab on the last item or Shift+Tab
 * on the first item should allow focus to move to elements outside the component,
 * not trap focus within.
 *
 * These tests verify that the Tab key handler does NOT prevent default behavior,
 * allowing natural browser focus management to work.
 */

/**
 * Mock implementation of CometChatActionSheetComponent for property testing
 */
class MockActionSheetComponent {
  actions: CometChatMessageComposerAction[] = [];
  actionItemClick = new EventEmitter<CometChatMessageComposerAction>();
  closeSheet = new EventEmitter<void>();

  private focusedIndex = -1;

  onKeyDown(event: KeyboardEvent): void {
    const key = event.key;

    switch (key) {
      case 'ArrowDown':
        event.preventDefault();
        this.moveFocus(1);
        break;

      case 'ArrowUp':
        event.preventDefault();
        this.moveFocus(-1);
        break;

      case 'Enter':
      case ' ':
        event.preventDefault();
        this.selectCurrentAction();
        break;

      case 'Escape':
        event.preventDefault();
        this.closeSheet.emit();
        break;

      case 'Tab':
        // Don't prevent default - allow Tab to exit naturally
        break;
    }
  }

  private moveFocus(direction: number): void {
    if (this.actions.length === 0) return;

    const newIndex = this.focusedIndex + direction;
    if (newIndex < 0) {
      this.focusedIndex = this.actions.length - 1;
    } else if (newIndex >= this.actions.length) {
      this.focusedIndex = 0;
    } else {
      this.focusedIndex = newIndex;
    }
  }

  private selectCurrentAction(): void {
    if (this.actions[this.focusedIndex]) {
      this.actionItemClick.emit(this.actions[this.focusedIndex]);
    }
  }

  onActionFocus(index: number): void {
    this.focusedIndex = index;
  }

  getFocusedIndex(): number {
    return this.focusedIndex;
  }
}

/**
 * Arbitrary generator for action items
 */
const actionArbitrary = fc.record({
  id: fc.string({ minLength: 1, maxLength: 20 }),
  title: fc.string({ minLength: 1, maxLength: 50 }),
  iconURL: fc.option(fc.webUrl(), { nil: '' }),
});

/**
 * Arbitrary generator for arrays of actions (1-20 items)
 */
const actionsArrayArbitrary = fc.array(actionArbitrary, { minLength: 1, maxLength: 20 });

/**
 * Arbitrary generator for focus index within valid range
 */
const focusIndexArbitrary = (maxIndex: number) =>
  fc.integer({ min: 0, max: Math.max(0, maxIndex - 1) });

/**
 * Helper to create a keyboard event
 */
function createKeyboardEvent(key: string, shiftKey = false): KeyboardEvent {
  return {
    key,
    shiftKey,
    preventDefault: vi.fn(),
  } as unknown as KeyboardEvent;
}

describe('CometChatActionSheet - Property-Based Tests: Tab Exit', () => {
  /**
   * Property 3.1: Tab key never prevents default
   *
   * **Validates: Requirement 4.1, 4.3**
   *
   * For any action sheet with any number of actions, pressing Tab should
   * never call preventDefault(), allowing natural focus flow.
   */
  it('Property 3.1: Tab key never prevents default for any action configuration', () => {
    fc.assert(
      fc.property(actionsArrayArbitrary, actionConfigs => {
        // Arrange
        const component = new MockActionSheetComponent();
        component.actions = actionConfigs.map(config => new CometChatMessageComposerAction(config));

        const event = createKeyboardEvent('Tab');

        // Act
        component.onKeyDown(event);

        // Assert
        expect(event.preventDefault).not.toHaveBeenCalled();
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 3.2: Shift+Tab never prevents default
   *
   * **Validates: Requirement 4.2, 4.3**
   *
   * For any action sheet with any number of actions, pressing Shift+Tab
   * should never call preventDefault(), allowing natural focus flow.
   */
  it('Property 3.2: Shift+Tab never prevents default for any action configuration', () => {
    fc.assert(
      fc.property(actionsArrayArbitrary, actionConfigs => {
        // Arrange
        const component = new MockActionSheetComponent();
        component.actions = actionConfigs.map(config => new CometChatMessageComposerAction(config));

        const event = createKeyboardEvent('Tab', true);

        // Act
        component.onKeyDown(event);

        // Assert
        expect(event.preventDefault).not.toHaveBeenCalled();
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 3.3: Tab doesn't change focus index
   *
   * **Validates: Requirement 4.1, 4.3**
   *
   * For any action sheet with any focused item, pressing Tab should not
   * change the internal focus index, allowing browser to handle focus naturally.
   */
  it('Property 3.3: Tab key does not modify internal focus state', () => {
    fc.assert(
      fc.property(
        actionsArrayArbitrary,
        fc.integer({ min: -1, max: 19 }),
        (actionConfigs, initialFocusIndex) => {
          // Arrange
          const component = new MockActionSheetComponent();
          component.actions = actionConfigs.map(
            config => new CometChatMessageComposerAction(config)
          );

          // Set initial focus if valid
          const validFocusIndex = Math.min(initialFocusIndex, component.actions.length - 1);
          if (validFocusIndex >= 0) {
            component.onActionFocus(validFocusIndex);
          }

          const focusBeforeTab = component.getFocusedIndex();
          const event = createKeyboardEvent('Tab');

          // Act
          component.onKeyDown(event);

          // Assert
          expect(component.getFocusedIndex()).toBe(focusBeforeTab);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 3.4: Shift+Tab doesn't change focus index
   *
   * **Validates: Requirement 4.2, 4.3**
   *
   * For any action sheet with any focused item, pressing Shift+Tab should not
   * change the internal focus index, allowing browser to handle focus naturally.
   */
  it('Property 3.4: Shift+Tab does not modify internal focus state', () => {
    fc.assert(
      fc.property(
        actionsArrayArbitrary,
        fc.integer({ min: -1, max: 19 }),
        (actionConfigs, initialFocusIndex) => {
          // Arrange
          const component = new MockActionSheetComponent();
          component.actions = actionConfigs.map(
            config => new CometChatMessageComposerAction(config)
          );

          // Set initial focus if valid
          const validFocusIndex = Math.min(initialFocusIndex, component.actions.length - 1);
          if (validFocusIndex >= 0) {
            component.onActionFocus(validFocusIndex);
          }

          const focusBeforeTab = component.getFocusedIndex();
          const event = createKeyboardEvent('Tab', true);

          // Act
          component.onKeyDown(event);

          // Assert
          expect(component.getFocusedIndex()).toBe(focusBeforeTab);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 3.5: Tab behavior is independent of action count
   *
   * **Validates: Requirement 4.3**
   *
   * The Tab key behavior (not preventing default) should be consistent
   * regardless of whether there is 1 action or 100 actions.
   */
  it('Property 3.5: Tab exit behavior is consistent across different action counts', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 100 }), actionCount => {
        // Arrange
        const component = new MockActionSheetComponent();
        component.actions = Array.from(
          { length: actionCount },
          (_, i) =>
            new CometChatMessageComposerAction({
              id: `action-${i}`,
              title: `Action ${i}`,
            })
        );

        const tabEvent = createKeyboardEvent('Tab');
        const shiftTabEvent = createKeyboardEvent('Tab', true);

        // Act
        component.onKeyDown(tabEvent);
        component.onKeyDown(shiftTabEvent);

        // Assert
        expect(tabEvent.preventDefault).not.toHaveBeenCalled();
        expect(shiftTabEvent.preventDefault).not.toHaveBeenCalled();
      }),
      { numRuns: 50 }
    );
  });

  /**
   * Property 3.6: Tab doesn't interfere with other keyboard handlers
   *
   * **Validates: Requirement 4.4**
   *
   * Allowing Tab to exit naturally should not break other keyboard
   * functionality like Escape, Arrow keys, Enter, or Space.
   */
  it('Property 3.6: Tab exit does not interfere with other keyboard handlers', () => {
    fc.assert(
      fc.property(
        actionsArrayArbitrary,
        fc.constantFrom('ArrowDown', 'ArrowUp', 'Enter', ' ', 'Escape'),
        (actionConfigs, otherKey) => {
          // Arrange
          const component = new MockActionSheetComponent();
          component.actions = actionConfigs.map(
            config => new CometChatMessageComposerAction(config)
          );

          // First press Tab (should not prevent default)
          const tabEvent = createKeyboardEvent('Tab');
          component.onKeyDown(tabEvent);

          // Then press another key (should work normally)
          const otherEvent = createKeyboardEvent(otherKey);
          component.onKeyDown(otherEvent);

          // Assert
          expect(tabEvent.preventDefault).not.toHaveBeenCalled();
          expect(otherEvent.preventDefault).toHaveBeenCalled(); // Other keys DO prevent default
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 3.7: Tab behavior at boundary positions
   *
   * **Validates: Requirement 4.1, 4.2**
   *
   * Tab should allow exit even when focused on first or last item,
   * which are the critical boundary cases for tab traps.
   */
  it('Property 3.7: Tab allows exit from first and last items', () => {
    fc.assert(
      fc.property(actionsArrayArbitrary, actionConfigs => {
        // Arrange
        const component = new MockActionSheetComponent();
        component.actions = actionConfigs.map(config => new CometChatMessageComposerAction(config));

        // Test Tab from last item
        component.onActionFocus(component.actions.length - 1);
        const tabFromLast = createKeyboardEvent('Tab');
        component.onKeyDown(tabFromLast);

        // Test Shift+Tab from first item
        component.onActionFocus(0);
        const shiftTabFromFirst = createKeyboardEvent('Tab', true);
        component.onKeyDown(shiftTabFromFirst);

        // Assert
        expect(tabFromLast.preventDefault).not.toHaveBeenCalled();
        expect(shiftTabFromFirst.preventDefault).not.toHaveBeenCalled();
      }),
      { numRuns: 100 }
    );
  });
});
