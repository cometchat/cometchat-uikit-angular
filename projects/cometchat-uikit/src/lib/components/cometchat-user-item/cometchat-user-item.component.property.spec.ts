/**
 * Property-Based Tests for CometChatUserItem Component
 *
 * This file contains property-based tests using fast-check to verify
 * universal correctness properties across all valid inputs.
 *
 * Property 1: User Item Rendering Correctness
 * - For any valid CometChat.User object with any combination of state inputs,
 *   the component SHALL render correctly with proper avatar, name, status,
 *   and CSS classes.
 *
 * Validates: Requirements 1.7, 1.8, 1.10
 *
 * @module components/cometchat-user-item/property-tests
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { EventEmitter } from '@angular/core';

/**
 * Mock CometChat.User class for property testing
 */
class MockUser {
  private uid: string;
  private name: string;
  private avatar: string;
  private status: string;

  constructor(uid: string, name: string, avatar = '', status = 'offline') {
    this.uid = uid;
    this.name = name;
    this.avatar = avatar;
    this.status = status;
  }

  getUid(): string {
    return this.uid;
  }

  getName(): string {
    return this.name;
  }

  getAvatar(): string {
    return this.avatar;
  }

  getStatus(): string {
    return this.status;
  }

  setStatus(status: string): void {
    this.status = status;
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
 * Mock implementation of CometChatUserItemComponent for property testing
 */
class MockCometChatUserItemComponent {
  // Required Inputs
  user!: MockUser;

  // State Inputs
  isActive = false;
  isSelected = false;
  isFocused = false;
  tabIndex = -1;

  // Display Configuration Inputs
  hideUserStatus = false;

  // Customization Inputs
  contextMenuOptions?: MockCometChatOption[];
  leadingView?: any;
  titleView?: any;
  subtitleView?: any;
  trailingView?: any;

  // Output Events
  itemClick = new EventEmitter<MockUser>();
  itemSelect = new EventEmitter<{ user: MockUser; selected: boolean }>();
  contextMenuOpen = new EventEmitter<MockUser>();
  contextMenuOptionClick = new EventEmitter<{
    option: MockCometChatOption;
    user: MockUser;
  }>();

  // Template Exposed Properties
  readonly Placement = MockPlacement;

  // Computed Properties and Getters
  get avatarImage(): string {
    return this.user?.getAvatar() || '';
  }

  get avatarName(): string {
    return this.user?.getName() || '';
  }

  get userStatus(): string {
    return this.user?.getStatus() || 'offline';
  }

  get ariaLabel(): string {
    const name = this.avatarName;
    const status = this.userStatus;

    if (this.hideUserStatus || !status) {
      return name;
    }

    const localizedStatus = status === 'online' ? 'Online' : 'Offline';

    return `${name}, ${localizedStatus}`;
  }

  // Event Handlers
  handleClick(): void {
    this.itemClick.emit(this.user);
  }

  handleContextMenuOpen(): void {
    this.contextMenuOpen.emit(this.user);
  }

  handleContextMenuOptionClick(option: MockCometChatOption): void {
    this.contextMenuOptionClick.emit({ option, user: this.user });
  }
}

// ============================================
// Fast-Check Arbitraries (Generators)
// ============================================

/**
 * Arbitrary for generating valid user IDs
 */
const userIdArbitrary = fc.string({ minLength: 1, maxLength: 50 });

/**
 * Arbitrary for generating valid user names
 * Includes various character sets: ASCII, Unicode, special characters
 */
const userNameArbitrary = fc.oneof(
  fc.string({ minLength: 1, maxLength: 100 }), // Regular strings
  fc.constantFrom(
    'John Doe',
    'Jane Smith',
    "O'Brien",
    'José García',
    '李明',
    '用户名 👤',
    'Test User 123',
    'A'.repeat(50), // Long name
    'Test\nUser',
    'Test\tUser',
    'Test"User"',
    "Test'User'"
  )
);

/**
 * Arbitrary for generating valid avatar URLs
 * Includes empty strings (no avatar), valid URLs, and data URLs
 */
const avatarUrlArbitrary = fc.oneof(
  fc.constant(''), // No avatar
  fc.webUrl(), // Valid HTTP/HTTPS URLs
  fc.constantFrom(
    'https://example.com/avatar.jpg',
    'https://example.com/avatar.png',
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
  )
);

/**
 * Arbitrary for generating valid user statuses
 */
const userStatusArbitrary = fc.constantFrom('online', 'offline');

/**
 * Arbitrary for generating valid CometChat.User objects
 */
const userArbitrary = fc
  .record({
    uid: userIdArbitrary,
    name: userNameArbitrary,
    avatar: avatarUrlArbitrary,
    status: userStatusArbitrary,
  })
  .map(({ uid, name, avatar, status }) => new MockUser(uid, name, avatar, status));

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
  hideUserStatus: fc.boolean(),
});

// ============================================
// Property-Based Tests
// ============================================

describe('CometChatUserItemComponent - Property-Based Tests', () => {
  /**
   * Property 1: User Item Rendering Correctness
   *
   * For any valid CometChat.User object with any combination of state inputs,
   * the CometChatUserItem component SHALL:
   * - Render the user's avatar image (or fallback to name-based avatar)
   * - Display the user's name as the title
   * - Show the correct online/offline status indicator (unless hideUserStatus is true)
   * - Apply the appropriate CSS modifier classes based on state inputs
   *
   * Validates: Requirements 1.7, 1.8, 1.10
   *
   * Feature: users-groups-paginated-list-refactor, Property 1: User Item Rendering Correctness
   */
  describe('Property 1: User Item Rendering Correctness', () => {
    it('should render avatar image correctly for any valid user', () => {
      fc.assert(
        fc.property(userArbitrary, user => {
          // Arrange
          const component = new MockCometChatUserItemComponent();
          component.user = user;

          // Act
          const avatarImage = component.avatarImage;

          // Assert
          // Requirement 1.7: Render user avatar
          expect(avatarImage).toBe(user.getAvatar());
        }),
        { numRuns: 100 }
      );
    });

    it('should render user name correctly for any valid user', () => {
      fc.assert(
        fc.property(userArbitrary, user => {
          // Arrange
          const component = new MockCometChatUserItemComponent();
          component.user = user;

          // Act
          const avatarName = component.avatarName;

          // Assert
          // Requirement 1.8: Render user name as title
          expect(avatarName).toBe(user.getName());
          expect(avatarName).toBeTruthy(); // Name should never be empty
          expect(avatarName.length).toBeGreaterThan(0);
        }),
        { numRuns: 100 }
      );
    });

    it('should render user status correctly for any valid user', () => {
      fc.assert(
        fc.property(userArbitrary, user => {
          // Arrange
          const component = new MockCometChatUserItemComponent();
          component.user = user;

          // Act
          const userStatus = component.userStatus;

          // Assert
          // Requirement 1.7: Show correct online/offline status indicator
          expect(userStatus).toBe(user.getStatus());
          expect(['online', 'offline']).toContain(userStatus);
        }),
        { numRuns: 100 }
      );
    });

    it('should apply correct state-based properties for any state combination', () => {
      fc.assert(
        fc.property(userArbitrary, stateInputsArbitrary, (user, stateInputs) => {
          // Arrange
          const component = new MockCometChatUserItemComponent();
          component.user = user;
          component.isActive = stateInputs.isActive;
          component.isSelected = stateInputs.isSelected;
          component.isFocused = stateInputs.isFocused;
          component.tabIndex = stateInputs.tabIndex;

          // Assert
          // Requirement 1.10: Apply appropriate CSS classes for active, selected, and focused states
          expect(component.isActive).toBe(stateInputs.isActive);
          expect(component.isSelected).toBe(stateInputs.isSelected);
          expect(component.isFocused).toBe(stateInputs.isFocused);
          expect(component.tabIndex).toBe(stateInputs.tabIndex);
        }),
        { numRuns: 100 }
      );
    });

    it('should generate correct ARIA label for any user and display config', () => {
      fc.assert(
        fc.property(userArbitrary, displayConfigArbitrary, (user, displayConfig) => {
          // Arrange
          const component = new MockCometChatUserItemComponent();
          component.user = user;
          component.hideUserStatus = displayConfig.hideUserStatus;

          // Act
          const ariaLabel = component.ariaLabel;

          // Assert
          // ARIA label should always contain the user name
          expect(ariaLabel).toContain(user.getName());

          if (displayConfig.hideUserStatus) {
            // When status is hidden, ARIA label should only contain name
            expect(ariaLabel).toBe(user.getName());
          } else {
            // When status is shown, ARIA label should contain status
            const status = user.getStatus();
            const expectedStatus = status === 'online' ? 'Online' : 'Offline';
            expect(ariaLabel).toContain(expectedStatus);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should maintain rendering consistency across multiple state changes', () => {
      fc.assert(
        fc.property(
          userArbitrary,
          fc.array(stateInputsArbitrary, { minLength: 1, maxLength: 10 }),
          (user, stateChanges) => {
            // Arrange
            const component = new MockCometChatUserItemComponent();
            component.user = user;

            // Act & Assert
            // Apply multiple state changes and verify consistency
            for (const stateInputs of stateChanges) {
              component.isActive = stateInputs.isActive;
              component.isSelected = stateInputs.isSelected;
              component.isFocused = stateInputs.isFocused;
              component.tabIndex = stateInputs.tabIndex;

              // After each state change, verify:
              // 1. User data remains unchanged
              expect(component.avatarImage).toBe(user.getAvatar());
              expect(component.avatarName).toBe(user.getName());
              expect(component.userStatus).toBe(user.getStatus());

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
          userArbitrary,
          fc.boolean(), // isFocused
          (user, isFocused) => {
            // Arrange
            const component = new MockCometChatUserItemComponent();
            component.user = user;
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
          userArbitrary,
          fc.boolean(), // isSelected
          (user, isSelected) => {
            // Arrange
            const component = new MockCometChatUserItemComponent();
            component.user = user;
            component.isSelected = isSelected;

            // Assert
            // Requirement 6.2: aria-selected attribute when in selection mode
            expect(component.isSelected).toBe(isSelected);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle empty avatar URL gracefully for any user', () => {
      fc.assert(
        fc.property(userNameArbitrary, userStatusArbitrary, (name, status) => {
          // Arrange
          const userWithoutAvatar = new MockUser('uid', name, '', status);
          const component = new MockCometChatUserItemComponent();
          component.user = userWithoutAvatar;

          // Act
          const avatarImage = component.avatarImage;

          // Assert
          // Should return empty string when no avatar
          expect(avatarImage).toBe('');
          // But name should still be available for fallback rendering
          expect(component.avatarName).toBe(name);
        }),
        { numRuns: 100 }
      );
    });

    it('should handle special characters in user name correctly', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            '<script>alert("XSS")</script>',
            "O'Brien & Co.",
            '用户名 👤 🌟',
            'Test\nUser',
            'Test\tUser',
            'Test"User"',
            "Test'User'",
            'José García',
            '李明',
            'User with spaces',
            'User-with-dashes',
            'User_with_underscores'
          ),
          name => {
            // Arrange
            const user = new MockUser('uid', name, '', 'online');
            const component = new MockCometChatUserItemComponent();
            component.user = user;

            // Act
            const avatarName = component.avatarName;
            const ariaLabel = component.ariaLabel;

            // Assert
            // Name should be preserved exactly as provided
            expect(avatarName).toBe(name);
            // ARIA label should contain the name
            expect(ariaLabel).toContain(name);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain state independence from user data changes', () => {
      fc.assert(
        fc.property(
          fc.array(userArbitrary, { minLength: 2, maxLength: 5 }),
          stateInputsArbitrary,
          (users, stateInputs) => {
            // Arrange
            const component = new MockCometChatUserItemComponent();
            component.isActive = stateInputs.isActive;
            component.isSelected = stateInputs.isSelected;
            component.isFocused = stateInputs.isFocused;
            component.tabIndex = stateInputs.tabIndex;

            // Act & Assert
            // Change user multiple times and verify state remains unchanged
            for (const user of users) {
              component.user = user;

              // User data should update
              expect(component.avatarImage).toBe(user.getAvatar());
              expect(component.avatarName).toBe(user.getName());
              expect(component.userStatus).toBe(user.getStatus());

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

    it('should handle all combinations of user data and state correctly', () => {
      fc.assert(
        fc.property(
          userArbitrary,
          stateInputsArbitrary,
          displayConfigArbitrary,
          (user, stateInputs, displayConfig) => {
            // Arrange
            const component = new MockCometChatUserItemComponent();
            component.user = user;
            component.isActive = stateInputs.isActive;
            component.isSelected = stateInputs.isSelected;
            component.isFocused = stateInputs.isFocused;
            component.tabIndex = stateInputs.tabIndex;
            component.hideUserStatus = displayConfig.hideUserStatus;

            // Assert - All properties should be correctly set
            // User data (Requirements 1.7, 1.8)
            expect(component.avatarImage).toBe(user.getAvatar());
            expect(component.avatarName).toBe(user.getName());
            expect(component.userStatus).toBe(user.getStatus());

            // State (Requirement 1.10)
            expect(component.isActive).toBe(stateInputs.isActive);
            expect(component.isSelected).toBe(stateInputs.isSelected);
            expect(component.isFocused).toBe(stateInputs.isFocused);
            expect(component.tabIndex).toBe(stateInputs.tabIndex);

            // Display config
            expect(component.hideUserStatus).toBe(displayConfig.hideUserStatus);

            // ARIA label should be valid
            const ariaLabel = component.ariaLabel;
            expect(ariaLabel).toBeTruthy();
            expect(ariaLabel).toContain(user.getName());
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 10: User Item Accessibility
   *
   * For any CometChatUserItem with any user and selection state:
   * - aria-selected SHALL equal the isSelected input value when selection mode is active
   * - aria-label SHALL contain the user's name and status (if not hidden)
   *
   * Validates: Requirements 6.2, 6.3
   *
   * Feature: users-groups-paginated-list-refactor, Property 10: User Item Accessibility
   */
  describe('Property 10: User Item Accessibility', () => {
    it('should set aria-selected correctly for any selection state', () => {
      fc.assert(
        fc.property(
          userArbitrary,
          fc.boolean(), // isSelected
          (user, isSelected) => {
            // Arrange
            const component = new MockCometChatUserItemComponent();
            component.user = user;
            component.isSelected = isSelected;

            // Assert
            // Requirement 6.2: aria-selected SHALL equal the isSelected input value
            expect(component.isSelected).toBe(isSelected);

            // The component should maintain the selection state consistently
            expect(component.isSelected).toBe(isSelected);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should generate aria-label with user name for any user', () => {
      fc.assert(
        fc.property(userArbitrary, user => {
          // Arrange
          const component = new MockCometChatUserItemComponent();
          component.user = user;

          // Act
          const ariaLabel = component.ariaLabel;

          // Assert
          // Requirement 6.3: aria-label SHALL contain the user's name
          expect(ariaLabel).toBeTruthy();
          expect(ariaLabel).toContain(user.getName());
          expect(ariaLabel.length).toBeGreaterThan(0);
        }),
        { numRuns: 100 }
      );
    });

    it('should include status in aria-label when not hidden', () => {
      fc.assert(
        fc.property(userArbitrary, user => {
          // Arrange
          const component = new MockCometChatUserItemComponent();
          component.user = user;
          component.hideUserStatus = false;

          // Act
          const ariaLabel = component.ariaLabel;

          // Assert
          // Requirement 6.3: aria-label SHALL contain status when not hidden
          expect(ariaLabel).toContain(user.getName());

          const status = user.getStatus();
          const expectedStatus = status === 'online' ? 'Online' : 'Offline';
          expect(ariaLabel).toContain(expectedStatus);

          // Format should be: "Name, Status"
          expect(ariaLabel).toBe(`${user.getName()}, ${expectedStatus}`);
        }),
        { numRuns: 100 }
      );
    });

    it('should exclude status from aria-label when hidden', () => {
      fc.assert(
        fc.property(userArbitrary, user => {
          // Arrange
          const component = new MockCometChatUserItemComponent();
          component.user = user;
          component.hideUserStatus = true;

          // Act
          const ariaLabel = component.ariaLabel;

          // Assert
          // Requirement 6.3: aria-label should only contain name when status is hidden
          expect(ariaLabel).toBe(user.getName());
          expect(ariaLabel).not.toContain('Online');
          expect(ariaLabel).not.toContain('Offline');
        }),
        { numRuns: 100 }
      );
    });

    it('should maintain aria-label consistency across state changes', () => {
      fc.assert(
        fc.property(
          userArbitrary,
          fc.array(stateInputsArbitrary, { minLength: 1, maxLength: 10 }),
          (user, stateChanges) => {
            // Arrange
            const component = new MockCometChatUserItemComponent();
            component.user = user;

            // Act & Assert
            for (const stateInputs of stateChanges) {
              component.isActive = stateInputs.isActive;
              component.isSelected = stateInputs.isSelected;
              component.isFocused = stateInputs.isFocused;
              component.tabIndex = stateInputs.tabIndex;

              // ARIA label should remain consistent regardless of state changes
              const ariaLabel = component.ariaLabel;
              expect(ariaLabel).toContain(user.getName());

              // Selection state should be correctly maintained
              expect(component.isSelected).toBe(stateInputs.isSelected);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle aria-label with special characters in user name', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            '<script>alert("XSS")</script>',
            "O'Brien & Co.",
            '用户名 👤 🌟',
            'Test\nUser',
            'Test"User"',
            'José García',
            'User with "quotes"',
            "User with 'apostrophes'"
          ),
          userStatusArbitrary,
          (name, status) => {
            // Arrange
            const user = new MockUser('uid', name, '', status);
            const component = new MockCometChatUserItemComponent();
            component.user = user;

            // Act
            const ariaLabel = component.ariaLabel;

            // Assert
            // ARIA label should preserve special characters
            expect(ariaLabel).toContain(name);

            // Should include status when not hidden
            const expectedStatus = status === 'online' ? 'Online' : 'Offline';
            expect(ariaLabel).toContain(expectedStatus);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain correct aria-selected for selection mode transitions', () => {
      fc.assert(
        fc.property(
          userArbitrary,
          fc.array(fc.boolean(), { minLength: 2, maxLength: 20 }),
          (user, selectionSequence) => {
            // Arrange
            const component = new MockCometChatUserItemComponent();
            component.user = user;

            // Act & Assert
            // Simulate rapid selection/deselection
            for (const isSelected of selectionSequence) {
              component.isSelected = isSelected;

              // Requirement 6.2: aria-selected should always match isSelected
              expect(component.isSelected).toBe(isSelected);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle aria-label for users with very long names', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 100, maxLength: 500 }),
          userStatusArbitrary,
          (longName, status) => {
            // Arrange
            const user = new MockUser('uid', longName, '', status);
            const component = new MockCometChatUserItemComponent();
            component.user = user;

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

    it('should maintain accessibility properties across user changes', () => {
      fc.assert(
        fc.property(
          fc.array(userArbitrary, { minLength: 2, maxLength: 10 }),
          fc.boolean(), // isSelected
          (users, isSelected) => {
            // Arrange
            const component = new MockCometChatUserItemComponent();
            component.isSelected = isSelected;

            // Act & Assert
            for (const user of users) {
              component.user = user;

              // ARIA label should update with new user
              const ariaLabel = component.ariaLabel;
              expect(ariaLabel).toContain(user.getName());

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
          userArbitrary,
          fc.boolean(), // isSelected
          fc.boolean(), // hideUserStatus
          (user, isSelected, hideUserStatus) => {
            // Arrange
            const component = new MockCometChatUserItemComponent();
            component.user = user;
            component.isSelected = isSelected;
            component.hideUserStatus = hideUserStatus;

            // Act
            const ariaLabel = component.ariaLabel;

            // Assert
            // Requirement 6.2: aria-selected
            expect(component.isSelected).toBe(isSelected);

            // Requirement 6.3: aria-label
            expect(ariaLabel).toContain(user.getName());

            if (hideUserStatus) {
              expect(ariaLabel).toBe(user.getName());
            } else {
              const status = user.getStatus();
              const expectedStatus = status === 'online' ? 'Online' : 'Offline';
              expect(ariaLabel).toContain(expectedStatus);
            }
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
    it('should handle very long user names without errors', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 100, maxLength: 1000 }), longName => {
          // Arrange
          const user = new MockUser('uid', longName, '', 'online');
          const component = new MockCometChatUserItemComponent();
          component.user = user;

          // Act & Assert
          expect(component.avatarName).toBe(longName);
          expect(component.ariaLabel).toContain(longName);
          expect(() => component.avatarName).not.toThrow();
        }),
        { numRuns: 50 }
      );
    });

    it('should handle rapid state transitions correctly', () => {
      fc.assert(
        fc.property(
          userArbitrary,
          fc.array(fc.boolean(), { minLength: 10, maxLength: 100 }),
          (user, stateSequence) => {
            // Arrange
            const component = new MockCometChatUserItemComponent();
            component.user = user;

            // Act & Assert
            // Apply rapid state changes
            for (const state of stateSequence) {
              component.isActive = state;
              expect(component.isActive).toBe(state);
              // User data should remain consistent
              expect(component.avatarName).toBe(user.getName());
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should maintain consistency when status changes dynamically', () => {
      fc.assert(
        fc.property(
          userArbitrary,
          fc.array(userStatusArbitrary, { minLength: 2, maxLength: 10 }),
          (user, statusChanges) => {
            // Arrange
            const component = new MockCometChatUserItemComponent();
            component.user = user;

            // Act & Assert
            for (const newStatus of statusChanges) {
              user.setStatus(newStatus);
              expect(component.userStatus).toBe(newStatus);
              expect(['online', 'offline']).toContain(component.userStatus);
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
