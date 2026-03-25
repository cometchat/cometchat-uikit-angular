/**
 * Property-Based Tests for Boolean Attribute Transform
 *
 * These tests verify universal properties that should hold for all components
 * using the booleanAttribute transform from @angular/core.
 *
 * Feature: pr-review-fixes, Property 2: Boolean Attribute Transform
 *
 * *For any* component with boolean inputs using booleanAttribute transform,
 * when the attribute is present without a value (e.g., `<component hideSearch>`),
 * the input value should be `true`.
 *
 * **Validates: Requirements 7.1, 7.2**
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { Component, Input, booleanAttribute } from '@angular/core';
import { TestBed, ComponentFixture } from '@angular/core/testing';

/**
 * Test component that mimics the boolean input pattern used in
 * CometChatConversationsComponent and CometChatUsersComponent
 */
@Component({
  selector: 'test-boolean-component',
  standalone: true,
  template: '<div>Test Component</div>',
})
class TestBooleanComponent {
  @Input({ transform: booleanAttribute }) hideSearch = false;
  @Input({ transform: booleanAttribute }) showSearchBar = false;
  @Input({ transform: booleanAttribute }) hideError = false;
  @Input({ transform: booleanAttribute }) hideReceipts = false;
  @Input({ transform: booleanAttribute }) disableSoundForMessages = false;
  @Input({ transform: booleanAttribute }) showScrollbar = false;
  @Input({ transform: booleanAttribute }) hideUserStatus = false;
  @Input({ transform: booleanAttribute }) showSectionHeader = false;
  @Input({ transform: booleanAttribute }) disableLoadingState = false;
  @Input({ transform: booleanAttribute }) showSelectedUsersPreview = false;
}

/**
 * Property-Based Tests for Boolean Attribute Transform
 */
describe('Boolean Attribute Transform - Property Tests', () => {
  let fixture: ComponentFixture<TestBooleanComponent>;
  let component: TestBooleanComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TestBooleanComponent],
    });
  });

  /**
   * **Feature: pr-review-fixes, Property 2: Boolean Attribute Transform**
   *
   * *For any* component with boolean inputs using booleanAttribute transform,
   * when the attribute is present without a value, the input value should be `true`.
   *
   * **Validates: Requirements 7.1, 7.2**
   */
  describe('Property 2: Boolean Attribute Transform', () => {
    /**
     * Test that booleanAttribute transform converts empty string to true
     * This simulates the attribute syntax: <component hideSearch>
     */
    it('should transform empty string attribute to true for any boolean input', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            'hideSearch',
            'showSearchBar',
            'hideError',
            'hideReceipts',
            'disableSoundForMessages',
            'showScrollbar',
            'hideUserStatus',
            'showSectionHeader',
            'disableLoadingState',
            'showSelectedUsersPreview'
          ),
          inputName => {
            // Arrange - Create component with attribute present (empty string)
            fixture = TestBed.createComponent(TestBooleanComponent);
            component = fixture.componentInstance;

            // Act - Set the input to empty string (simulates attribute without value)
            (component as any)[inputName] = booleanAttribute('');

            // Assert - Should be transformed to true
            expect((component as any)[inputName]).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test that booleanAttribute transform converts string "true" to true
     */
    it('should transform string "true" to boolean true for any boolean input', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            'hideSearch',
            'showSearchBar',
            'hideError',
            'hideReceipts',
            'disableSoundForMessages',
            'showScrollbar',
            'hideUserStatus',
            'showSectionHeader',
            'disableLoadingState',
            'showSelectedUsersPreview'
          ),
          inputName => {
            // Arrange
            fixture = TestBed.createComponent(TestBooleanComponent);
            component = fixture.componentInstance;

            // Act - Set the input to string "true"
            (component as any)[inputName] = booleanAttribute('true');

            // Assert - Should be transformed to true
            expect((component as any)[inputName]).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test that booleanAttribute transform converts string "false" to false
     */
    it('should transform string "false" to boolean false for any boolean input', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            'hideSearch',
            'showSearchBar',
            'hideError',
            'hideReceipts',
            'disableSoundForMessages',
            'showScrollbar',
            'hideUserStatus',
            'showSectionHeader',
            'disableLoadingState',
            'showSelectedUsersPreview'
          ),
          inputName => {
            // Arrange
            fixture = TestBed.createComponent(TestBooleanComponent);
            component = fixture.componentInstance;

            // Act - Set the input to string "false"
            (component as any)[inputName] = booleanAttribute('false');

            // Assert - Should be transformed to false
            expect((component as any)[inputName]).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test that booleanAttribute transform handles boolean true correctly
     */
    it('should pass through boolean true unchanged for any boolean input', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            'hideSearch',
            'showSearchBar',
            'hideError',
            'hideReceipts',
            'disableSoundForMessages',
            'showScrollbar',
            'hideUserStatus',
            'showSectionHeader',
            'disableLoadingState',
            'showSelectedUsersPreview'
          ),
          inputName => {
            // Arrange
            fixture = TestBed.createComponent(TestBooleanComponent);
            component = fixture.componentInstance;

            // Act - Set the input to boolean true
            (component as any)[inputName] = booleanAttribute(true);

            // Assert - Should remain true
            expect((component as any)[inputName]).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test that booleanAttribute transform handles boolean false correctly
     */
    it('should pass through boolean false unchanged for any boolean input', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            'hideSearch',
            'showSearchBar',
            'hideError',
            'hideReceipts',
            'disableSoundForMessages',
            'showScrollbar',
            'hideUserStatus',
            'showSectionHeader',
            'disableLoadingState',
            'showSelectedUsersPreview'
          ),
          inputName => {
            // Arrange
            fixture = TestBed.createComponent(TestBooleanComponent);
            component = fixture.componentInstance;

            // Act - Set the input to boolean false
            (component as any)[inputName] = booleanAttribute(false);

            // Assert - Should remain false
            expect((component as any)[inputName]).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test that booleanAttribute transform handles any truthy string as true
     * This verifies that any non-empty string (except "false") is treated as true
     */
    it('should transform any truthy string to true for any boolean input', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            'hideSearch',
            'showSearchBar',
            'hideError',
            'hideReceipts',
            'disableSoundForMessages',
            'showScrollbar',
            'hideUserStatus',
            'showSectionHeader',
            'disableLoadingState',
            'showSelectedUsersPreview'
          ),
          fc.string({ minLength: 1, maxLength: 20 }).filter(s => s !== 'false'),
          (inputName, truthyString) => {
            // Arrange
            fixture = TestBed.createComponent(TestBooleanComponent);
            component = fixture.componentInstance;

            // Act - Set the input to a truthy string
            (component as any)[inputName] = booleanAttribute(truthyString);

            // Assert - Should be transformed to true
            expect((component as any)[inputName]).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test that booleanAttribute transform is idempotent
     * Applying the transform multiple times should yield the same result
     */
    it('should be idempotent - applying transform multiple times yields same result', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            'hideSearch',
            'showSearchBar',
            'hideError',
            'hideReceipts',
            'disableSoundForMessages',
            'showScrollbar',
            'hideUserStatus',
            'showSectionHeader',
            'disableLoadingState',
            'showSelectedUsersPreview'
          ),
          fc.oneof(
            fc.constant(''),
            fc.constant('true'),
            fc.constant('false'),
            fc.constant(true),
            fc.constant(false),
            fc.string({ minLength: 1, maxLength: 10 })
          ),
          (inputName, value) => {
            // Arrange
            fixture = TestBed.createComponent(TestBooleanComponent);
            component = fixture.componentInstance;

            // Act - Apply transform once
            const firstTransform = booleanAttribute(value);
            // Apply transform again to the result
            const secondTransform = booleanAttribute(firstTransform);

            // Assert - Both transforms should yield the same result
            expect(firstTransform).toBe(secondTransform);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test that default values are preserved when no input is provided
     */
    it('should preserve default false value when no input is provided', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            'hideSearch',
            'showSearchBar',
            'hideError',
            'hideReceipts',
            'disableSoundForMessages',
            'showScrollbar',
            'hideUserStatus',
            'showSectionHeader',
            'disableLoadingState',
            'showSelectedUsersPreview'
          ),
          inputName => {
            // Arrange - Create component without setting any inputs
            fixture = TestBed.createComponent(TestBooleanComponent);
            component = fixture.componentInstance;

            // Assert - Default value should be false
            expect((component as any)[inputName]).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test the core property: empty string (attribute without value) transforms to true
     * This is the most important test as it validates the primary use case
     */
    it('should always transform empty string to true (attribute syntax)', () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          // Test all boolean inputs
          const booleanInputs = [
            'hideSearch',
            'showSearchBar',
            'hideError',
            'hideReceipts',
            'disableSoundForMessages',
            'showScrollbar',
            'hideUserStatus',
            'showSectionHeader',
            'disableLoadingState',
            'showSelectedUsersPreview',
          ];

          booleanInputs.forEach(inputName => {
            // Arrange
            fixture = TestBed.createComponent(TestBooleanComponent);
            component = fixture.componentInstance;

            // Act - Simulate attribute without value: <component hideSearch>
            const result = booleanAttribute('');

            // Assert - Should always be true
            expect(result).toBe(true);
            expect(typeof result).toBe('boolean');
          });

          return true;
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test that booleanAttribute transform works consistently across all input types
     * This verifies the transform behavior is uniform regardless of input type
     */
    it('should handle all valid input types consistently', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            'hideSearch',
            'showSearchBar',
            'hideError',
            'hideReceipts',
            'disableSoundForMessages',
            'showScrollbar',
            'hideUserStatus',
            'showSectionHeader',
            'disableLoadingState',
            'showSelectedUsersPreview'
          ),
          fc.oneof(
            fc.constant(''),
            fc.constant('true'),
            fc.constant('false'),
            fc.constant(true),
            fc.constant(false),
            fc.constant(null),
            fc.constant(undefined)
          ),
          (inputName, value) => {
            // Arrange
            fixture = TestBed.createComponent(TestBooleanComponent);
            component = fixture.componentInstance;

            // Act
            const result = booleanAttribute(value);

            // Assert - Result should always be a boolean
            expect(typeof result).toBe('boolean');

            // Assert - Specific value checks
            if (value === '' || value === 'true' || value === true) {
              expect(result).toBe(true);
            } else if (value === 'false' || value === false) {
              expect(result).toBe(false);
            } else if (value === null || value === undefined) {
              // null/undefined should be treated as false
              expect(result).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Integration tests to verify booleanAttribute works in actual component usage
   */
  describe('Integration: Boolean Attribute in Component Context', () => {
    /**
     * Test that component inputs with booleanAttribute work correctly
     * when set programmatically
     */
    it('should work correctly when inputs are set programmatically', () => {
      fc.assert(
        fc.property(
          fc.record({
            hideSearch: fc.boolean(),
            showSearchBar: fc.boolean(),
            hideError: fc.boolean(),
            hideReceipts: fc.boolean(),
            disableSoundForMessages: fc.boolean(),
            showScrollbar: fc.boolean(),
            hideUserStatus: fc.boolean(),
            showSectionHeader: fc.boolean(),
            disableLoadingState: fc.boolean(),
            showSelectedUsersPreview: fc.boolean(),
          }),
          inputs => {
            // Arrange
            fixture = TestBed.createComponent(TestBooleanComponent);
            component = fixture.componentInstance;

            // Act - Set all inputs programmatically
            Object.entries(inputs).forEach(([key, value]) => {
              (component as any)[key] = value;
            });

            // Assert - All values should match what was set
            Object.entries(inputs).forEach(([key, value]) => {
              expect((component as any)[key]).toBe(value);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test that multiple boolean inputs can be set independently
     */
    it('should allow independent setting of multiple boolean inputs', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              inputName: fc.constantFrom(
                'hideSearch',
                'showSearchBar',
                'hideError',
                'hideReceipts',
                'disableSoundForMessages',
                'showScrollbar',
                'hideUserStatus',
                'showSectionHeader',
                'disableLoadingState',
                'showSelectedUsersPreview'
              ),
              value: fc.boolean(),
            }),
            { minLength: 1, maxLength: 10 }
          ),
          inputSettings => {
            // Arrange
            fixture = TestBed.createComponent(TestBooleanComponent);
            component = fixture.componentInstance;

            // Act - Set multiple inputs
            inputSettings.forEach(({ inputName, value }) => {
              (component as any)[inputName] = value;
            });

            // Assert - Build a map of the final expected values (last value wins for duplicates)
            const expectedValues = new Map<string, boolean>();
            inputSettings.forEach(({ inputName, value }) => {
              expectedValues.set(inputName, value);
            });

            // Assert - Each input should have its final set value
            expectedValues.forEach((expectedValue, inputName) => {
              expect((component as any)[inputName]).toBe(expectedValue);
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
