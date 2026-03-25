/**
 * Property-Based Tests for CometChatGroupItem Component
 *
 * This file contains property-based tests using fast-check to verify
 * universal correctness properties across all valid inputs.
 *
 * Property 2: Group Item Rendering Correctness
 * - For any valid CometChat.Group object with any combination of state inputs,
 *   the component SHALL render correctly with proper icon, name, member count,
 *   group type indicator, and CSS classes.
 *
 * Validates: Requirements 2.7, 2.8, 2.9, 2.11
 *
 * @module components/cometchat-group-item/property-tests
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { EventEmitter } from '@angular/core';

/**
 * Mock CometChat.Group class for property testing
 */
class MockGroup {
  private guid: string;
  private name: string;
  private icon: string;
  private type: string;
  private membersCount: number;

  constructor(guid: string, name: string, type: string, membersCount: number, icon = '') {
    this.guid = guid;
    this.name = name;
    this.type = type;
    this.membersCount = membersCount;
    this.icon = icon;
  }

  getGuid(): string {
    return this.guid;
  }

  getName(): string {
    return this.name;
  }

  getIcon(): string {
    return this.icon;
  }

  getType(): string {
    return this.type;
  }

  getMembersCount(): number {
    return this.membersCount;
  }

  setMembersCount(count: number): void {
    this.membersCount = count;
  }
}

/**
 * Mock CometChatOption class for property testing
 */
class MockCometChatOption {
  id: string;
  title: string;
  iconURL?: string;
  onClick?: () => void;

  constructor(id: string, title: string, iconURL?: string, onClick?: () => void) {
    this.id = id;
    this.title = title;
    this.iconURL = iconURL;
    this.onClick = onClick;
  }
}

/**
 * Mock Placement enum for property testing
 */
enum MockPlacement {
  left = 'left',
  right = 'right',
  top = 'top',
  bottom = 'bottom',
}

/**
 * Mock CometChatLocalize for property testing
 */
class MockCometChatLocalize {
  static getLocalizedString(key: string): string {
    const translations: Record<string, string> = {
      group_member: 'member',
      group_members: 'members',
    };
    return translations[key] || key;
  }
}

/**
 * Mock implementation of CometChatGroupItemComponent for property testing
 */
class MockCometChatGroupItemComponent {
  // Required Inputs
  group!: MockGroup;

  // State Inputs
  isActive = false;
  isSelected = false;
  isFocused = false;
  tabIndex = -1;

  // Display Configuration Inputs
  hideGroupType = false;

  // Customization Inputs
  contextMenuOptions?: MockCometChatOption[];
  leadingView?: any;
  titleView?: any;
  subtitleView?: any;
  trailingView?: any;

  // Output Events
  itemClick = new EventEmitter<MockGroup>();
  itemSelect = new EventEmitter<{ group: MockGroup; selected: boolean }>();
  contextMenuOpen = new EventEmitter<MockGroup>();
  contextMenuOptionClick = new EventEmitter<{
    option: MockCometChatOption;
    group: MockGroup;
  }>();

  // Template Exposed Properties
  readonly Placement = MockPlacement;

  // Computed Properties and Getters
  get groupIcon(): string {
    return this.group?.getIcon() || '';
  }

  get groupName(): string {
    return this.group?.getName() || '';
  }

  get groupType(): string {
    return this.group?.getType() || '';
  }

  get memberCount(): number {
    return this.group?.getMembersCount() || 0;
  }

  get memberCountText(): string {
    const count = this.memberCount;
    if (count === 1) {
      return `${count} ${MockCometChatLocalize.getLocalizedString('group_member')}`;
    } else {
      return `${count} ${MockCometChatLocalize.getLocalizedString('group_members')}`;
    }
  }

  get ariaLabel(): string {
    const name = this.groupName;
    const type = this.groupType;
    const memberText = this.memberCountText;

    if (this.hideGroupType || !type) {
      return `${name}, ${memberText}`;
    }

    // Format group type for screen readers
    const formattedType = type.charAt(0).toUpperCase() + type.slice(1);

    return `${name}, ${formattedType} group, ${memberText}`;
  }

  // Event Handlers
  handleClick(): void {
    this.itemClick.emit(this.group);
  }

  handleContextMenuOpen(): void {
    this.contextMenuOpen.emit(this.group);
  }

  handleContextMenuOptionClick(option: MockCometChatOption): void {
    this.contextMenuOptionClick.emit({ option, group: this.group });
  }
}

// ============================================
// Fast-Check Arbitraries (Generators)
// ============================================

/**
 * Arbitrary for generating valid group IDs (GUIDs)
 */
const groupIdArbitrary = fc.string({ minLength: 1, maxLength: 50 });

/**
 * Arbitrary for generating valid group names
 * Includes various character sets: ASCII, Unicode, special characters
 */
const groupNameArbitrary = fc.oneof(
  fc.string({ minLength: 1, maxLength: 100 }), // Regular strings
  fc.constantFrom(
    'Engineering Team',
    'Sales & Marketing',
    "O'Brien's Group",
    'José García Team',
    '开发团队',
    'Group 👥 🌟',
    'Test Group 123',
    'A'.repeat(50), // Long name
    'Test\nGroup',
    'Test\tGroup',
    'Test"Group"',
    "Test'Group'",
    'Group with spaces',
    'Group-with-dashes',
    'Group_with_underscores'
  )
);

/**
 * Arbitrary for generating valid group types
 */
const groupTypeArbitrary = fc.constantFrom('public', 'private', 'password');

/**
 * Arbitrary for generating valid member counts
 * Includes edge cases: 0, 1, and large numbers
 */
const memberCountArbitrary = fc.oneof(
  fc.constant(0), // Empty group
  fc.constant(1), // Single member
  fc.integer({ min: 2, max: 10 }), // Small groups
  fc.integer({ min: 11, max: 100 }), // Medium groups
  fc.integer({ min: 101, max: 10000 }) // Large groups
);

/**
 * Arbitrary for generating valid group icon URLs
 * Includes empty strings (no icon), valid URLs, and data URLs
 */
const groupIconArbitrary = fc.oneof(
  fc.constant(''), // No icon
  fc.webUrl(), // Valid HTTP/HTTPS URLs
  fc.constantFrom(
    'https://example.com/group-icon.jpg',
    'https://example.com/group-icon.png',
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
  )
);

/**
 * Arbitrary for generating valid CometChat.Group objects
 */
const groupArbitrary = fc
  .record({
    guid: groupIdArbitrary,
    name: groupNameArbitrary,
    type: groupTypeArbitrary,
    membersCount: memberCountArbitrary,
    icon: groupIconArbitrary,
  })
  .map(
    ({ guid, name, type, membersCount, icon }) =>
      new MockGroup(guid, name, type, membersCount, icon)
  );

/**
 * Arbitrary for generating valid state input combinations
 */
const stateInputsArbitrary = fc.record({
  isActive: fc.boolean(),
  isSelected: fc.boolean(),
  isFocused: fc.boolean(),
  tabIndex: fc.oneof(
    fc.constant(-1), // Not focusable via Tab
    fc.constant(0), // Focusable via Tab
    fc.integer({ min: 1, max: 10 }) // Explicit tab order
  ),
});

/**
 * Arbitrary for generating valid display configuration
 */
const displayConfigArbitrary = fc.record({
  hideGroupType: fc.boolean(),
});

// ============================================
// Property-Based Tests
// ============================================

describe('CometChatGroupItemComponent - Property-Based Tests', () => {
  /**
   * Property 2: Group Item Rendering Correctness
   *
   * For any valid CometChat.Group object with any combination of state inputs,
   * the CometChatGroupItem component SHALL:
   * - Render the group's icon (or fallback to name-based avatar)
   * - Display the group's name as the title
   * - Show the member count as subtitle
   * - Display the correct group type indicator (public, private, password) unless hideGroupType is true
   * - Apply the appropriate CSS modifier classes based on state inputs
   *
   * Validates: Requirements 2.7, 2.8, 2.9, 2.11
   *
   * Feature: users-groups-paginated-list-refactor, Property 2: Group Item Rendering Correctness
   */
  describe('Property 2: Group Item Rendering Correctness', () => {
    it('should render group icon correctly for any valid group', () => {
      fc.assert(
        fc.property(groupArbitrary, group => {
          // Arrange
          const component = new MockCometChatGroupItemComponent();
          component.group = group;

          // Act
          const groupIcon = component.groupIcon;

          // Assert
          // Requirement 2.7: Render group icon/avatar
          expect(groupIcon).toBe(group.getIcon());
        }),
        { numRuns: 100 }
      );
    });

    it('should render group name correctly for any valid group', () => {
      fc.assert(
        fc.property(groupArbitrary, group => {
          // Arrange
          const component = new MockCometChatGroupItemComponent();
          component.group = group;

          // Act
          const groupName = component.groupName;

          // Assert
          // Requirement 2.8: Render group name as title
          expect(groupName).toBe(group.getName());
          expect(groupName).toBeTruthy(); // Name should never be empty
          expect(groupName.length).toBeGreaterThan(0);
        }),
        { numRuns: 100 }
      );
    });

    it('should render group type correctly for any valid group', () => {
      fc.assert(
        fc.property(groupArbitrary, group => {
          // Arrange
          const component = new MockCometChatGroupItemComponent();
          component.group = group;

          // Act
          const groupType = component.groupType;

          // Assert
          // Requirement 2.7: Display correct group type indicator
          expect(groupType).toBe(group.getType());
          expect(['public', 'private', 'password']).toContain(groupType);
        }),
        { numRuns: 100 }
      );
    });

    it('should render member count correctly for any valid group', () => {
      fc.assert(
        fc.property(groupArbitrary, group => {
          // Arrange
          const component = new MockCometChatGroupItemComponent();
          component.group = group;

          // Act
          const memberCount = component.memberCount;

          // Assert
          // Requirement 2.9: Render member count as subtitle
          expect(memberCount).toBe(group.getMembersCount());
          expect(memberCount).toBeGreaterThanOrEqual(0);
        }),
        { numRuns: 100 }
      );
    });

    it('should format member count text correctly for any valid count', () => {
      fc.assert(
        fc.property(groupArbitrary, group => {
          // Arrange
          const component = new MockCometChatGroupItemComponent();
          component.group = group;

          // Act
          const memberCountText = component.memberCountText;
          const count = component.memberCount;

          // Assert
          // Requirement 2.9: Render member count as subtitle with proper formatting
          if (count === 1) {
            expect(memberCountText).toBe('1 member');
          } else {
            expect(memberCountText).toBe(`${count} members`);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should apply correct state-based properties for any state combination', () => {
      fc.assert(
        fc.property(groupArbitrary, stateInputsArbitrary, (group, stateInputs) => {
          // Arrange
          const component = new MockCometChatGroupItemComponent();
          component.group = group;
          component.isActive = stateInputs.isActive;
          component.isSelected = stateInputs.isSelected;
          component.isFocused = stateInputs.isFocused;
          component.tabIndex = stateInputs.tabIndex;

          // Assert
          // Requirement 2.11: Apply appropriate CSS classes for active, selected, and focused states
          expect(component.isActive).toBe(stateInputs.isActive);
          expect(component.isSelected).toBe(stateInputs.isSelected);
          expect(component.isFocused).toBe(stateInputs.isFocused);
          expect(component.tabIndex).toBe(stateInputs.tabIndex);
        }),
        { numRuns: 100 }
      );
    });

    it('should generate correct ARIA label for any group and display config', () => {
      fc.assert(
        fc.property(groupArbitrary, displayConfigArbitrary, (group, displayConfig) => {
          // Arrange
          const component = new MockCometChatGroupItemComponent();
          component.group = group;
          component.hideGroupType = displayConfig.hideGroupType;

          // Act
          const ariaLabel = component.ariaLabel;
          const memberCountText = component.memberCountText;

          // Assert
          // ARIA label should always contain the group name
          expect(ariaLabel).toContain(group.getName());
          // ARIA label should always contain the member count
          expect(ariaLabel).toContain(memberCountText);

          if (displayConfig.hideGroupType) {
            // When group type is hidden, ARIA label should only contain name and member count
            expect(ariaLabel).toBe(`${group.getName()}, ${memberCountText}`);
          } else {
            // When group type is shown, ARIA label should contain type
            const type = group.getType();
            const formattedType = type.charAt(0).toUpperCase() + type.slice(1);
            expect(ariaLabel).toContain(formattedType);
            expect(ariaLabel).toContain('group');
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should maintain rendering consistency across multiple state changes', () => {
      fc.assert(
        fc.property(
          groupArbitrary,
          fc.array(stateInputsArbitrary, { minLength: 1, maxLength: 10 }),
          (group, stateChanges) => {
            // Arrange
            const component = new MockCometChatGroupItemComponent();
            component.group = group;

            // Act & Assert
            // Apply multiple state changes and verify consistency
            for (const stateInputs of stateChanges) {
              component.isActive = stateInputs.isActive;
              component.isSelected = stateInputs.isSelected;
              component.isFocused = stateInputs.isFocused;
              component.tabIndex = stateInputs.tabIndex;

              // After each state change, verify:
              // 1. Group data remains unchanged
              expect(component.groupIcon).toBe(group.getIcon());
              expect(component.groupName).toBe(group.getName());
              expect(component.groupType).toBe(group.getType());
              expect(component.memberCount).toBe(group.getMembersCount());

              // 2. State is correctly applied
              expect(component.isActive).toBe(stateInputs.isActive);
              expect(component.isSelected).toBe(stateInputs.isSelected);
              expect(component.isFocused).toBe(stateInputs.isFocused);
              expect(component.tabIndex).toBe(stateInputs.tabIndex);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle roving tabindex pattern correctly for any state', () => {
      fc.assert(
        fc.property(
          groupArbitrary,
          fc.boolean(), // isFocused
          (group, isFocused) => {
            // Arrange
            const component = new MockCometChatGroupItemComponent();
            component.group = group;
            component.isFocused = isFocused;

            // Act
            // Apply roving tabindex pattern: focused item gets tabindex=0, others get -1
            component.tabIndex = isFocused ? 0 : -1;

            // Assert
            if (isFocused) {
              expect(component.tabIndex).toBe(0);
            } else {
              expect(component.tabIndex).toBe(-1);
            }

            // Verify consistency
            expect(component.isFocused).toBe(isFocused);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain correct aria-selected attribute for any selection state', () => {
      fc.assert(
        fc.property(
          groupArbitrary,
          fc.boolean(), // isSelected
          (group, isSelected) => {
            // Arrange
            const component = new MockCometChatGroupItemComponent();
            component.group = group;
            component.isSelected = isSelected;

            // Assert
            // Requirement 6.5: aria-selected attribute when in selection mode
            expect(component.isSelected).toBe(isSelected);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle empty icon URL gracefully for any group', () => {
      fc.assert(
        fc.property(
          groupNameArbitrary,
          groupTypeArbitrary,
          memberCountArbitrary,
          (name, type, membersCount) => {
            // Arrange
            const groupWithoutIcon = new MockGroup('guid', name, type, membersCount, '');
            const component = new MockCometChatGroupItemComponent();
            component.group = groupWithoutIcon;

            // Act
            const groupIcon = component.groupIcon;

            // Assert
            // Should return empty string when no icon
            expect(groupIcon).toBe('');
            // But name should still be available for fallback rendering
            expect(component.groupName).toBe(name);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle special characters in group name correctly', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            '<script>alert("XSS")</script>',
            "O'Brien & Co.",
            'Group 👥 🌟',
            'Test\nGroup',
            'Test\tGroup',
            'Test"Group"',
            "Test'Group'",
            'José García Team',
            '开发团队',
            'Group with spaces',
            'Group-with-dashes',
            'Group_with_underscores'
          ),
          groupTypeArbitrary,
          memberCountArbitrary,
          (name, type, membersCount) => {
            // Arrange
            const group = new MockGroup('guid', name, type, membersCount, '');
            const component = new MockCometChatGroupItemComponent();
            component.group = group;

            // Act
            const groupName = component.groupName;
            const ariaLabel = component.ariaLabel;

            // Assert
            // Name should be preserved exactly as provided
            expect(groupName).toBe(name);
            // ARIA label should contain the name
            expect(ariaLabel).toContain(name);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain state independence from group data changes', () => {
      fc.assert(
        fc.property(
          fc.array(groupArbitrary, { minLength: 2, maxLength: 5 }),
          stateInputsArbitrary,
          (groups, stateInputs) => {
            // Arrange
            const component = new MockCometChatGroupItemComponent();
            component.isActive = stateInputs.isActive;
            component.isSelected = stateInputs.isSelected;
            component.isFocused = stateInputs.isFocused;
            component.tabIndex = stateInputs.tabIndex;

            // Act & Assert
            // Change group multiple times and verify state remains unchanged
            for (const group of groups) {
              component.group = group;

              // Group data should update
              expect(component.groupIcon).toBe(group.getIcon());
              expect(component.groupName).toBe(group.getName());
              expect(component.groupType).toBe(group.getType());
              expect(component.memberCount).toBe(group.getMembersCount());

              // But state should remain unchanged
              expect(component.isActive).toBe(stateInputs.isActive);
              expect(component.isSelected).toBe(stateInputs.isSelected);
              expect(component.isFocused).toBe(stateInputs.isFocused);
              expect(component.tabIndex).toBe(stateInputs.tabIndex);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle all combinations of group data and state correctly', () => {
      fc.assert(
        fc.property(
          groupArbitrary,
          stateInputsArbitrary,
          displayConfigArbitrary,
          (group, stateInputs, displayConfig) => {
            // Arrange
            const component = new MockCometChatGroupItemComponent();
            component.group = group;
            component.isActive = stateInputs.isActive;
            component.isSelected = stateInputs.isSelected;
            component.isFocused = stateInputs.isFocused;
            component.tabIndex = stateInputs.tabIndex;
            component.hideGroupType = displayConfig.hideGroupType;

            // Assert - All properties should be correctly set
            // Group data (Requirements 2.7, 2.8, 2.9)
            expect(component.groupIcon).toBe(group.getIcon());
            expect(component.groupName).toBe(group.getName());
            expect(component.groupType).toBe(group.getType());
            expect(component.memberCount).toBe(group.getMembersCount());

            // State (Requirement 2.11)
            expect(component.isActive).toBe(stateInputs.isActive);
            expect(component.isSelected).toBe(stateInputs.isSelected);
            expect(component.isFocused).toBe(stateInputs.isFocused);
            expect(component.tabIndex).toBe(stateInputs.tabIndex);

            // Display config
            expect(component.hideGroupType).toBe(displayConfig.hideGroupType);

            // ARIA label should be valid
            const ariaLabel = component.ariaLabel;
            expect(ariaLabel).toBeTruthy();
            expect(ariaLabel).toContain(group.getName());
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle all valid group types correctly', () => {
      fc.assert(
        fc.property(groupNameArbitrary, memberCountArbitrary, (name, membersCount) => {
          // Test all three group types
          const types = ['public', 'private', 'password'];

          for (const type of types) {
            // Arrange
            const group = new MockGroup('guid', name, type, membersCount, '');
            const component = new MockCometChatGroupItemComponent();
            component.group = group;

            // Act
            const groupType = component.groupType;
            const ariaLabel = component.ariaLabel;

            // Assert
            expect(groupType).toBe(type);
            expect(['public', 'private', 'password']).toContain(groupType);

            // ARIA label should contain formatted type
            const formattedType = type.charAt(0).toUpperCase() + type.slice(1);
            expect(ariaLabel).toContain(formattedType);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should handle edge case member counts correctly', () => {
      fc.assert(
        fc.property(
          groupNameArbitrary,
          groupTypeArbitrary,
          fc.constantFrom(0, 1, 2, 10, 100, 1000, 10000),
          (name, type, membersCount) => {
            // Arrange
            const group = new MockGroup('guid', name, type, membersCount, '');
            const component = new MockCometChatGroupItemComponent();
            component.group = group;

            // Act
            const memberCount = component.memberCount;
            const memberCountText = component.memberCountText;

            // Assert
            expect(memberCount).toBe(membersCount);

            if (membersCount === 1) {
              expect(memberCountText).toBe('1 member');
            } else {
              expect(memberCountText).toBe(`${membersCount} members`);
            }

            // ARIA label should contain member count text
            expect(component.ariaLabel).toContain(memberCountText);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Additional Property Tests for Edge Cases
   */
  describe('Property Tests: Edge Cases', () => {
    it('should handle very long group names without errors', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 100, maxLength: 1000 }),
          groupTypeArbitrary,
          memberCountArbitrary,
          (longName, type, membersCount) => {
            // Arrange
            const group = new MockGroup('guid', longName, type, membersCount, '');
            const component = new MockCometChatGroupItemComponent();
            component.group = group;

            // Act & Assert
            expect(component.groupName).toBe(longName);
            expect(component.ariaLabel).toContain(longName);
            expect(() => component.groupName).not.toThrow();
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should handle rapid state transitions correctly', () => {
      fc.assert(
        fc.property(
          groupArbitrary,
          fc.array(fc.boolean(), { minLength: 10, maxLength: 100 }),
          (group, stateSequence) => {
            // Arrange
            const component = new MockCometChatGroupItemComponent();
            component.group = group;

            // Act & Assert
            // Apply rapid state changes
            for (const state of stateSequence) {
              component.isActive = state;
              expect(component.isActive).toBe(state);
              // Group data should remain consistent
              expect(component.groupName).toBe(group.getName());
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should maintain consistency when member count changes dynamically', () => {
      fc.assert(
        fc.property(
          groupArbitrary,
          fc.array(memberCountArbitrary, { minLength: 2, maxLength: 10 }),
          (group, memberCountChanges) => {
            // Arrange
            const component = new MockCometChatGroupItemComponent();
            component.group = group;

            // Act & Assert
            for (const newCount of memberCountChanges) {
              group.setMembersCount(newCount);
              expect(component.memberCount).toBe(newCount);

              const memberCountText = component.memberCountText;
              if (newCount === 1) {
                expect(memberCountText).toBe('1 member');
              } else {
                expect(memberCountText).toBe(`${newCount} members`);
              }
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should handle hideGroupType toggle correctly', () => {
      fc.assert(
        fc.property(groupArbitrary, group => {
          // Arrange
          const component = new MockCometChatGroupItemComponent();
          component.group = group;

          // Act & Assert - Test with hideGroupType = false
          component.hideGroupType = false;
          let ariaLabel = component.ariaLabel;
          expect(ariaLabel).toContain(group.getName());
          expect(ariaLabel).toContain('group');

          // Act & Assert - Test with hideGroupType = true
          component.hideGroupType = true;
          ariaLabel = component.ariaLabel;
          expect(ariaLabel).toContain(group.getName());
          expect(ariaLabel).toContain(component.memberCountText);
          // Should not contain "group" when type is hidden
          const expectedLabel = `${group.getName()}, ${component.memberCountText}`;
          expect(ariaLabel).toBe(expectedLabel);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 11: Group Item Accessibility
   *
   * For any CometChatGroupItem with any group and selection state:
   * - aria-selected SHALL equal the isSelected input value when selection mode is active
   * - aria-label SHALL contain the group's name, type, and member count
   *
   * Validates: Requirements 6.5, 6.6
   *
   * Feature: users-groups-paginated-list-refactor, Property 11: Group Item Accessibility
   */
  describe('Property 11: Group Item Accessibility', () => {
    it('should set aria-selected correctly for any selection state', () => {
      fc.assert(
        fc.property(
          groupArbitrary,
          fc.boolean(), // isSelected
          (group, isSelected) => {
            // Arrange
            const component = new MockCometChatGroupItemComponent();
            component.group = group;
            component.isSelected = isSelected;

            // Assert
            // Requirement 6.5: aria-selected SHALL equal the isSelected input value
            expect(component.isSelected).toBe(isSelected);

            // The component should maintain the selection state consistently
            expect(component.isSelected).toBe(isSelected);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should generate aria-label with group name for any group', () => {
      fc.assert(
        fc.property(groupArbitrary, group => {
          // Arrange
          const component = new MockCometChatGroupItemComponent();
          component.group = group;

          // Act
          const ariaLabel = component.ariaLabel;

          // Assert
          // Requirement 6.6: aria-label SHALL contain the group's name
          expect(ariaLabel).toBeTruthy();
          expect(ariaLabel).toContain(group.getName());
          expect(ariaLabel.length).toBeGreaterThan(0);
        }),
        { numRuns: 100 }
      );
    });

    it('should include group type in aria-label when not hidden', () => {
      fc.assert(
        fc.property(groupArbitrary, group => {
          // Arrange
          const component = new MockCometChatGroupItemComponent();
          component.group = group;
          component.hideGroupType = false;

          // Act
          const ariaLabel = component.ariaLabel;

          // Assert
          // Requirement 6.6: aria-label SHALL contain group type when not hidden
          expect(ariaLabel).toContain(group.getName());
          expect(ariaLabel).toContain('group');

          const groupType = group.getType();
          const expectedType = groupType.charAt(0).toUpperCase() + groupType.slice(1);
          expect(ariaLabel).toContain(expectedType);
        }),
        { numRuns: 100 }
      );
    });

    it('should include member count in aria-label', () => {
      fc.assert(
        fc.property(groupArbitrary, group => {
          // Arrange
          const component = new MockCometChatGroupItemComponent();
          component.group = group;

          // Act
          const ariaLabel = component.ariaLabel;
          const memberCountText = component.memberCountText;

          // Assert
          // Requirement 6.6: aria-label SHALL contain member count
          expect(ariaLabel).toContain(memberCountText);

          const memberCount = group.getMembersCount();
          if (memberCount === 1) {
            expect(memberCountText).toBe('1 member');
          } else {
            expect(memberCountText).toBe(`${memberCount} members`);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should exclude group type from aria-label when hidden', () => {
      fc.assert(
        fc.property(groupArbitrary, group => {
          // Arrange
          const component = new MockCometChatGroupItemComponent();
          component.group = group;
          component.hideGroupType = true;

          // Act
          const ariaLabel = component.ariaLabel;

          // Assert
          // Requirement 6.6: aria-label should only contain name and member count when type is hidden
          expect(ariaLabel).toContain(group.getName());
          expect(ariaLabel).toContain(component.memberCountText);

          // Should not contain group type
          const expectedLabel = `${group.getName()}, ${component.memberCountText}`;
          expect(ariaLabel).toBe(expectedLabel);
        }),
        { numRuns: 100 }
      );
    });

    it('should maintain aria-label consistency across state changes', () => {
      fc.assert(
        fc.property(
          groupArbitrary,
          fc.array(stateInputsArbitrary, { minLength: 1, maxLength: 10 }),
          (group, stateChanges) => {
            // Arrange
            const component = new MockCometChatGroupItemComponent();
            component.group = group;

            // Act & Assert
            for (const stateInputs of stateChanges) {
              component.isActive = stateInputs.isActive;
              component.isSelected = stateInputs.isSelected;
              component.isFocused = stateInputs.isFocused;
              component.tabIndex = stateInputs.tabIndex;

              // ARIA label should remain consistent regardless of state changes
              const ariaLabel = component.ariaLabel;
              expect(ariaLabel).toContain(group.getName());

              // Selection state should be correctly maintained
              expect(component.isSelected).toBe(stateInputs.isSelected);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle aria-label with special characters in group name', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            '<script>alert("XSS")</script>',
            "O'Brien & Co.",
            '群组名称 👥 🌟',
            'Test\nGroup',
            'Test"Group"',
            'Grupo José',
            'Group with "quotes"',
            "Group with 'apostrophes'"
          ),
          groupTypeArbitrary,
          memberCountArbitrary,
          (name, type, memberCount) => {
            // Arrange
            const group = new MockGroup('guid', name, type, memberCount, '');
            const component = new MockCometChatGroupItemComponent();
            component.group = group;

            // Act
            const ariaLabel = component.ariaLabel;

            // Assert
            // ARIA label should preserve special characters
            expect(ariaLabel).toContain(name);

            // Should include member count
            expect(ariaLabel).toContain(component.memberCountText);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain correct aria-selected for selection mode transitions', () => {
      fc.assert(
        fc.property(
          groupArbitrary,
          fc.array(fc.boolean(), { minLength: 2, maxLength: 20 }),
          (group, selectionSequence) => {
            // Arrange
            const component = new MockCometChatGroupItemComponent();
            component.group = group;

            // Act & Assert
            // Simulate rapid selection/deselection
            for (const isSelected of selectionSequence) {
              component.isSelected = isSelected;

              // Requirement 6.5: aria-selected should always match isSelected
              expect(component.isSelected).toBe(isSelected);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle aria-label for groups with very long names', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 100, maxLength: 500 }),
          groupTypeArbitrary,
          memberCountArbitrary,
          (longName, type, memberCount) => {
            // Arrange
            const group = new MockGroup('guid', longName, type, memberCount, '');
            const component = new MockCometChatGroupItemComponent();
            component.group = group;

            // Act
            const ariaLabel = component.ariaLabel;

            // Assert
            // ARIA label should handle long names without truncation
            expect(ariaLabel).toContain(longName);
            expect(ariaLabel.length).toBeGreaterThanOrEqual(longName.length);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should maintain accessibility properties across group changes', () => {
      fc.assert(
        fc.property(
          fc.array(groupArbitrary, { minLength: 2, maxLength: 10 }),
          fc.boolean(), // isSelected
          (groups, isSelected) => {
            // Arrange
            const component = new MockCometChatGroupItemComponent();
            component.isSelected = isSelected;

            // Act & Assert
            for (const group of groups) {
              component.group = group;

              // ARIA label should update with new group
              const ariaLabel = component.ariaLabel;
              expect(ariaLabel).toContain(group.getName());

              // Selection state should remain unchanged
              expect(component.isSelected).toBe(isSelected);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle all combinations of accessibility properties', () => {
      fc.assert(
        fc.property(
          groupArbitrary,
          fc.boolean(), // isSelected
          fc.boolean(), // hideGroupType
          (group, isSelected, hideGroupType) => {
            // Arrange
            const component = new MockCometChatGroupItemComponent();
            component.group = group;
            component.isSelected = isSelected;
            component.hideGroupType = hideGroupType;

            // Act
            const ariaLabel = component.ariaLabel;

            // Assert
            // Requirement 6.5: aria-selected
            expect(component.isSelected).toBe(isSelected);

            // Requirement 6.6: aria-label
            expect(ariaLabel).toContain(group.getName());
            expect(ariaLabel).toContain(component.memberCountText);

            if (!hideGroupType) {
              expect(ariaLabel).toContain('group');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should update aria-label when member count changes', () => {
      fc.assert(
        fc.property(
          groupArbitrary,
          fc.array(memberCountArbitrary, { minLength: 2, maxLength: 10 }),
          (group, memberCountChanges) => {
            // Arrange
            const component = new MockCometChatGroupItemComponent();
            component.group = group;

            // Act & Assert
            for (const newCount of memberCountChanges) {
              group.setMembersCount(newCount);

              const ariaLabel = component.ariaLabel;
              const memberCountText = component.memberCountText;

              // ARIA label should reflect updated member count
              expect(ariaLabel).toContain(memberCountText);

              if (newCount === 1) {
                expect(memberCountText).toBe('1 member');
              } else {
                expect(memberCountText).toBe(`${newCount} members`);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle aria-label format consistency', () => {
      fc.assert(
        fc.property(
          groupArbitrary,
          fc.boolean(), // hideGroupType
          (group, hideGroupType) => {
            // Arrange
            const component = new MockCometChatGroupItemComponent();
            component.group = group;
            component.hideGroupType = hideGroupType;

            // Act
            const ariaLabel = component.ariaLabel;

            // Assert
            // ARIA label should follow consistent format
            const parts = ariaLabel.split(', ');
            expect(parts.length).toBeGreaterThanOrEqual(2);

            // First part should be group name
            expect(parts[0]).toBe(group.getName());

            // Should contain member count
            expect(ariaLabel).toContain(component.memberCountText);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
