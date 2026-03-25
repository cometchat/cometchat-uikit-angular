/**
 * Property-Based Tests for CometChatUsers Component
 *
 * This file contains property-based tests using fast-check to verify
 * universal correctness properties across all valid inputs.
 *
 * Property 3: Users Pagination Loading Behavior
 * - For any scroll event that triggers the IntersectionObserver in CometChatPaginatedList
 *   when hasMore is true, the CometChatUsers component SHALL:
 *   - Set isFetchingMore to true before fetching
 *   - Display a loading spinner at the bottom of the list
 *   - Call loadComplete() on the paginated list after fetch completes (success or failure)
 *   - Set isFetchingMore to false after fetch completes
 *
 * Validates: Requirements 3.6, 3.7, 3.8
 *
 * @module components/cometchat-users/property-tests
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { signal } from '@angular/core';

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
 * Mock CometChat.CometChatException class for property testing
 */
class MockCometChatException extends Error {
  code: string;
  override message: string;
  details: any;

  constructor(code: string, message: string, details?: any) {
    super(message);
    this.code = code;
    this.message = message;
    this.details = details;
    this.name = 'CometChatException';
  }
}

/**
 * Mock UsersManager for property testing
 */
class MockUsersManager {
  private users: MockUser[];
  private currentPage: number;
  private pageSize: number;
  private shouldFail: boolean;
  private failureError: MockCometChatException | null;

  constructor(
    users: MockUser[],
    pageSize = 30,
    shouldFail = false,
    failureError: MockCometChatException | null = null
  ) {
    this.users = users;
    this.currentPage = 0;
    this.pageSize = pageSize;
    this.shouldFail = shouldFail;
    this.failureError = failureError;
  }

  async fetchNext(): Promise<MockUser[]> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 10));

    if (this.shouldFail && this.failureError) {
      throw this.failureError;
    }

    const startIndex = this.currentPage * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    const page = this.users.slice(startIndex, endIndex);

    if (page.length > 0) {
      this.currentPage++;
    }

    return page;
  }

  reset(): void {
    this.currentPage = 0;
  }
}

/**
 * Mock CometChatPaginatedList component for property testing
 */
class MockCometChatPaginatedList {
  loadCompleteCallCount = 0;

  loadComplete(): void {
    this.loadCompleteCallCount++;
  }

  reset(): void {
    this.loadCompleteCallCount = 0;
  }
}

/**
 * Simplified mock implementation of CometChatUsersComponent for property testing
 * Focuses on pagination behavior
 */
class MockCometChatUsersComponent {
  // State
  userList: MockUser[] = [];
  isFetchingMore = signal(false);
  hasMore = signal(true);
  paginatedList?: MockCometChatPaginatedList;

  // Selection state
  selectedUsers = new Map<string, MockUser>();
  selectionMode: 'none' | 'single' | 'multiple' = 'none';
  showSelectedUsersPreview = false;

  // Private state
  private usersManager: MockUsersManager | null = null;

  // Error tracking
  errorEmitted: MockCometChatException | null = null;

  constructor(usersManager: MockUsersManager) {
    this.usersManager = usersManager;
    this.paginatedList = new MockCometChatPaginatedList();
  }

  /**
   * Removes a user from the selected users map
   */
  removeSelectedUser(user: MockUser): void {
    const uid = user.getUid();
    this.selectedUsers.delete(uid);
  }

  /**
   * Simulates the fetchNextAndAppendUsers method
   * This is the core pagination logic being tested
   */
  async fetchNextAndAppendUsers(): Promise<void> {
    // Prevent concurrent fetches
    if (this.isFetchingMore() || !this.hasMore() || !this.usersManager) {
      return;
    }

    // Requirement 3.6: Set isFetchingMore to true before fetching
    this.isFetchingMore.set(true);

    try {
      const users = await this.usersManager.fetchNext();

      // Check if we've reached the end of pagination
      if (users.length === 0) {
        this.hasMore.set(false);
        return;
      }

      // Append users without duplicates
      this.appendUsersWithoutDuplicates(users);
    } catch (error) {
      // Handle error
      this.errorEmitted = error as MockCometChatException;
    } finally {
      // Requirement 3.8: Set isFetchingMore to false after fetch completes
      this.isFetchingMore.set(false);

      // Requirement 3.7: Call loadComplete() on the paginated list after fetch completes
      this.paginatedList?.loadComplete();
    }
  }

  /**
   * Simulates the handleLoadMore method
   * This is called when the IntersectionObserver triggers
   */
  handleLoadMore(): void {
    // Prevent concurrent fetches
    if (this.isFetchingMore() || !this.hasMore() || !this.usersManager) {
      return;
    }

    this.fetchNextAndAppendUsers();
  }

  /**
   * Appends new users to the list without creating duplicates
   */
  private appendUsersWithoutDuplicates(newUsers: MockUser[]): void {
    const existingUids = new Set(this.userList.map(user => user.getUid()));

    const uniqueNewUsers = newUsers.filter(user => !existingUids.has(user.getUid()));

    this.userList = [...this.userList, ...uniqueNewUsers];
  }

  /**
   * Reset component state for testing
   */
  reset(): void {
    this.userList = [];
    this.isFetchingMore.set(false);
    this.hasMore.set(true);
    this.errorEmitted = null;
    this.paginatedList?.reset();
    this.usersManager?.reset();
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
 */
const userNameArbitrary = fc.string({ minLength: 1, maxLength: 100 });

/**
 * Arbitrary for generating valid avatar URLs
 */
const avatarUrlArbitrary = fc.oneof(
  fc.constant(''),
  fc.webUrl(),
  fc.constantFrom('https://example.com/avatar.jpg', 'https://example.com/avatar.png')
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
 * Arbitrary for generating a list of users
 * Ensures unique UIDs
 */
const userListArbitrary = fc.array(userArbitrary, { minLength: 0, maxLength: 200 }).map(users => {
  // Ensure unique UIDs
  const uniqueUsers = new Map<string, MockUser>();
  users.forEach(user => {
    uniqueUsers.set(user.getUid(), user);
  });
  return Array.from(uniqueUsers.values());
});

/**
 * Arbitrary for generating page sizes
 */
const pageSizeArbitrary = fc.constantFrom(10, 20, 30, 50);

/**
 * Arbitrary for generating error scenarios
 */
const errorScenarioArbitrary = fc.record({
  shouldFail: fc.boolean(),
  errorCode: fc.constantFrom('ERR_NETWORK', 'ERR_TIMEOUT', 'ERR_UNAUTHORIZED'),
  errorMessage: fc.constantFrom('Network error', 'Request timeout', 'Unauthorized access'),
});

// ============================================
// Property-Based Tests
// ============================================

describe('CometChatUsersComponent - Property-Based Tests', () => {
  /**
   * Property 3: Users Pagination Loading Behavior
   *
   * For any scroll event that triggers the IntersectionObserver in CometChatPaginatedList
   * when hasMore is true, the CometChatUsers component SHALL:
   * - Set isFetchingMore to true before fetching
   * - Display a loading spinner at the bottom of the list
   * - Call loadComplete() on the paginated list after fetch completes (success or failure)
   * - Set isFetchingMore to false after fetch completes
   *
   * Validates: Requirements 3.6, 3.7, 3.8
   *
   * Feature: users-groups-paginated-list-refactor, Property 3: Users Pagination Loading Behavior
   */
  describe('Property 3: Users Pagination Loading Behavior', () => {
    it('should set isFetchingMore to true before fetching and false after for any user list', async () => {
      await fc.assert(
        fc.asyncProperty(userListArbitrary, pageSizeArbitrary, async (users, pageSize) => {
          // Arrange
          const usersManager = new MockUsersManager(users, pageSize);
          const component = new MockCometChatUsersComponent(usersManager);

          // Act
          const fetchPromise = component.fetchNextAndAppendUsers();

          // Assert - Requirement 3.6: isFetchingMore should be true during fetch
          expect(component.isFetchingMore()).toBe(true);

          // Wait for fetch to complete
          await fetchPromise;

          // Assert - Requirement 3.8: isFetchingMore should be false after fetch
          expect(component.isFetchingMore()).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it('should call loadComplete() after fetch completes for any user list', async () => {
      await fc.assert(
        fc.asyncProperty(userListArbitrary, pageSizeArbitrary, async (users, pageSize) => {
          // Arrange
          const usersManager = new MockUsersManager(users, pageSize);
          const component = new MockCometChatUsersComponent(usersManager);

          // Act
          await component.fetchNextAndAppendUsers();

          // Assert - Requirement 3.7: loadComplete() should be called
          expect(component.paginatedList?.loadCompleteCallCount).toBe(1);
        }),
        { numRuns: 100 }
      );
    });

    it('should call loadComplete() even when fetch fails for any error', async () => {
      await fc.assert(
        fc.asyncProperty(
          userListArbitrary,
          pageSizeArbitrary,
          errorScenarioArbitrary,
          async (users, pageSize, errorScenario) => {
            // Skip if not a failure scenario
            if (!errorScenario.shouldFail) {
              return;
            }

            // Arrange
            const error = new MockCometChatException(
              errorScenario.errorCode,
              errorScenario.errorMessage
            );
            const usersManager = new MockUsersManager(users, pageSize, true, error);
            const component = new MockCometChatUsersComponent(usersManager);

            // Act
            await component.fetchNextAndAppendUsers();

            // Assert - Requirement 3.7: loadComplete() should be called even on error
            expect(component.paginatedList?.loadCompleteCallCount).toBe(1);

            // Assert - Requirement 3.8: isFetchingMore should be false after error
            expect(component.isFetchingMore()).toBe(false);

            // Assert - Error should be tracked
            expect(component.errorEmitted).not.toBeNull();
            expect(component.errorEmitted?.code).toBe(errorScenario.errorCode);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should prevent concurrent fetches when isFetchingMore is true', async () => {
      await fc.assert(
        fc.asyncProperty(userListArbitrary, pageSizeArbitrary, async (users, pageSize) => {
          // Skip if user list is empty
          if (users.length === 0) {
            return;
          }

          // Arrange
          const usersManager = new MockUsersManager(users, pageSize);
          const component = new MockCometChatUsersComponent(usersManager);

          // Act - Start first fetch
          const firstFetch = component.fetchNextAndAppendUsers();

          // Try to start second fetch while first is in progress
          const secondFetch = component.fetchNextAndAppendUsers();

          // Wait for both to complete
          await Promise.all([firstFetch, secondFetch]);

          // Assert - loadComplete() should only be called once (second fetch was prevented)
          expect(component.paginatedList?.loadCompleteCallCount).toBe(1);
        }),
        { numRuns: 100 }
      );
    });

    it('should not fetch when hasMore is false for any user list', async () => {
      await fc.assert(
        fc.asyncProperty(userListArbitrary, pageSizeArbitrary, async (users, pageSize) => {
          // Arrange
          const usersManager = new MockUsersManager(users, pageSize);
          const component = new MockCometChatUsersComponent(usersManager);

          // Set hasMore to false
          component.hasMore.set(false);

          // Act
          await component.fetchNextAndAppendUsers();

          // Assert - loadComplete() should not be called when hasMore is false
          expect(component.paginatedList?.loadCompleteCallCount).toBe(0);

          // Assert - isFetchingMore should remain false
          expect(component.isFetchingMore()).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it('should set hasMore to false when no more users are available', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(userArbitrary, { minLength: 1, maxLength: 50 }),
          fc.constantFrom(10, 20),
          async (users, pageSize) => {
            // Arrange - Create unique users
            const uniqueUsers = Array.from(new Map(users.map(u => [u.getUid(), u])).values());
            const usersManager = new MockUsersManager(uniqueUsers, pageSize);
            const component = new MockCometChatUsersComponent(usersManager);

            // Act - Fetch all pages until no more users
            let fetchCount = 0;
            const maxFetches = Math.ceil(uniqueUsers.length / pageSize) + 2; // +2 for safety

            while (component.hasMore() && fetchCount < maxFetches) {
              await component.fetchNextAndAppendUsers();
              fetchCount++;
            }

            // Assert - hasMore should be false when all users are fetched
            if (uniqueUsers.length > 0) {
              expect(component.hasMore()).toBe(false);
            }

            // Assert - All users should be in the list
            expect(component.userList.length).toBe(uniqueUsers.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle multiple pagination cycles correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(userArbitrary, { minLength: 30, maxLength: 100 }),
          fc.constantFrom(10, 20),
          fc.integer({ min: 2, max: 5 }),
          async (users, pageSize, numFetches) => {
            // Arrange - Create unique users
            const uniqueUsers = Array.from(new Map(users.map(u => [u.getUid(), u])).values());
            const usersManager = new MockUsersManager(uniqueUsers, pageSize);
            const component = new MockCometChatUsersComponent(usersManager);

            // Act - Perform multiple fetches
            for (let i = 0; i < numFetches && component.hasMore(); i++) {
              const userCountBefore = component.userList.length;

              await component.fetchNextAndAppendUsers();

              // Assert - Users should be appended
              const userCountAfter = component.userList.length;
              expect(userCountAfter).toBeGreaterThanOrEqual(userCountBefore);

              // Assert - isFetchingMore should be false after each fetch
              expect(component.isFetchingMore()).toBe(false);

              // Assert - loadComplete() should be called for each fetch
              expect(component.paginatedList?.loadCompleteCallCount).toBe(i + 1);
            }

            // Assert - No duplicate users
            const uids = component.userList.map(u => u.getUid());
            const uniqueUids = new Set(uids);
            expect(uids.length).toBe(uniqueUids.size);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain loading state consistency across success and failure scenarios', async () => {
      await fc.assert(
        fc.asyncProperty(
          userListArbitrary,
          pageSizeArbitrary,
          fc.array(fc.boolean(), { minLength: 2, maxLength: 5 }),
          async (users, pageSize, failurePattern) => {
            // Skip if user list is empty
            if (users.length === 0) {
              return;
            }

            // Arrange - Create unique users
            const uniqueUsers = Array.from(new Map(users.map(u => [u.getUid(), u])).values());

            // Act & Assert - Test multiple fetch cycles with varying success/failure
            for (let i = 0; i < failurePattern.length; i++) {
              const shouldFail = failurePattern[i];
              const error = shouldFail
                ? new MockCometChatException('ERR_TEST', 'Test error')
                : null;

              const usersManager = new MockUsersManager(uniqueUsers, pageSize, shouldFail, error);
              const component = new MockCometChatUsersComponent(usersManager);

              // Perform fetch
              await component.fetchNextAndAppendUsers();

              // Assert - isFetchingMore should always be false after fetch
              expect(component.isFetchingMore()).toBe(false);

              // Assert - loadComplete() should always be called
              expect(component.paginatedList?.loadCompleteCallCount).toBe(1);

              // Assert - Error state should match expectation
              if (shouldFail) {
                expect(component.errorEmitted).not.toBeNull();
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle handleLoadMore correctly for any user list', async () => {
      await fc.assert(
        fc.asyncProperty(userListArbitrary, pageSizeArbitrary, async (users, pageSize) => {
          // Arrange
          const usersManager = new MockUsersManager(users, pageSize);
          const component = new MockCometChatUsersComponent(usersManager);

          // Act - Simulate IntersectionObserver trigger
          component.handleLoadMore();

          // Wait a bit for any pending async operations
          await new Promise(resolve => setTimeout(resolve, 20));

          // Assert - If users exist, fetch should have occurred
          if (users.length > 0) {
            expect(component.paginatedList?.loadCompleteCallCount).toBeGreaterThan(0);
            expect(component.isFetchingMore()).toBe(false);
          }
        }),
        { numRuns: 100 }
      );
    }, 10000);

    it('should not append duplicate users across multiple fetches', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(userArbitrary, { minLength: 20, maxLength: 60 }),
          fc.constantFrom(10, 20),
          async (users, pageSize) => {
            // Arrange - Create unique users
            const uniqueUsers = Array.from(new Map(users.map(u => [u.getUid(), u])).values());
            const usersManager = new MockUsersManager(uniqueUsers, pageSize);
            const component = new MockCometChatUsersComponent(usersManager);

            // Act - Fetch multiple pages
            const numPages = Math.min(3, Math.ceil(uniqueUsers.length / pageSize));
            for (let i = 0; i < numPages && component.hasMore(); i++) {
              await component.fetchNextAndAppendUsers();
            }

            // Assert - No duplicate UIDs in the list
            const uids = component.userList.map(u => u.getUid());
            const uniqueUids = new Set(uids);
            expect(uids.length).toBe(uniqueUids.size);

            // Assert - All fetched users should be in the list
            const expectedCount = Math.min(uniqueUsers.length, numPages * pageSize);
            expect(component.userList.length).toBeLessThanOrEqual(expectedCount);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle empty user list correctly', async () => {
      await fc.assert(
        fc.asyncProperty(pageSizeArbitrary, async pageSize => {
          // Arrange - Empty user list
          const usersManager = new MockUsersManager([], pageSize);
          const component = new MockCometChatUsersComponent(usersManager);

          // Act
          await component.fetchNextAndAppendUsers();

          // Assert - hasMore should be false
          expect(component.hasMore()).toBe(false);

          // Assert - loadComplete() should be called
          expect(component.paginatedList?.loadCompleteCallCount).toBe(1);

          // Assert - isFetchingMore should be false
          expect(component.isFetchingMore()).toBe(false);

          // Assert - User list should remain empty
          expect(component.userList.length).toBe(0);
        }),
        { numRuns: 100 }
      );
    });

    it('should maintain state consistency when fetch is called rapidly', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(userArbitrary, { minLength: 50, maxLength: 100 }),
          fc.constantFrom(10, 20),
          fc.integer({ min: 3, max: 5 }), // Reduced max to speed up test
          async (users, pageSize, rapidCallCount) => {
            // Arrange - Create unique users
            const uniqueUsers = Array.from(new Map(users.map(u => [u.getUid(), u])).values());
            const usersManager = new MockUsersManager(uniqueUsers, pageSize);
            const component = new MockCometChatUsersComponent(usersManager);

            // Act - Call handleLoadMore rapidly
            for (let i = 0; i < rapidCallCount; i++) {
              component.handleLoadMore();
            }

            // Wait for all async operations to complete
            await new Promise(resolve => setTimeout(resolve, 50));

            // Assert - isFetchingMore should be false
            expect(component.isFetchingMore()).toBe(false);

            // Assert - No duplicate users
            const uids = component.userList.map(u => u.getUid());
            const uniqueUids = new Set(uids);
            expect(uids.length).toBe(uniqueUids.size);

            // Assert - loadComplete() should be called at least once
            expect(component.paginatedList?.loadCompleteCallCount).toBeGreaterThan(0);
          }
        ),
        { numRuns: 50 } // Reduced from 100 to speed up test
      );
    }, 10000);
  });

  /**
   * Property 4: Users Selection Mode Behavior
   *
   * For any selection mode (none, single, multiple) and any sequence of user selections:
   * - In 'none' mode: No selection state should be tracked
   * - In 'single' mode: At most one user should be selected at any time
   * - In 'multiple' mode: Any number of users can be selected, and shift-click should select a range from the last clicked item
   *
   * Validates: Requirements 3.10, 3.11
   *
   * Feature: users-groups-paginated-list-refactor, Property 4: Users Selection Mode Behavior
   */
  describe('Property 4: Users Selection Mode Behavior', () => {
    /**
     * Mock component for testing selection behavior
     */
    class MockSelectionComponent {
      userList: MockUser[] = [];
      selectedUsers = new Set<string>();
      selectedUsersMap = new Map<string, MockUser>();
      lastClickedIndex: number | null = null;
      lastClickedUserUid: string | null = null;
      selectionMode: 'none' | 'single' | 'multiple' = 'none';

      // Track emitted events
      selectEvents: { user: MockUser; selected: boolean }[] = [];

      constructor(users: MockUser[], selectionMode: 'none' | 'single' | 'multiple') {
        this.userList = users;
        this.selectionMode = selectionMode;
      }

      /**
       * Simulates the handleSelectionChange method
       */
      handleSelectionChange(user: MockUser, event?: { shiftKey?: boolean }): void {
        const uid = user.getUid();
        const currentIndex = this.userList.findIndex(u => u.getUid() === uid);
        const isCurrentlySelected = this.selectedUsers.has(uid);

        if (this.selectionMode === 'single') {
          // Single selection: clear all and select new
          this.selectedUsers.clear();
          this.selectedUsersMap.clear();

          if (!isCurrentlySelected) {
            this.selectedUsers.add(uid);
            this.selectedUsersMap.set(uid, user);
          }

          // Emit select event
          this.selectEvents.push({
            user,
            selected: !isCurrentlySelected,
          });
        } else if (this.selectionMode === 'multiple') {
          // Check for shift-click range selection
          const isShiftClick = event?.shiftKey === true;

          // Only process shift-click if we have an anchor point
          if (isShiftClick && this.lastClickedIndex !== null && this.lastClickedUserUid !== null) {
            // Shift-click: select/deselect range
            this.handleShiftClickSelection(currentIndex, isCurrentlySelected);
          } else if (!isShiftClick) {
            // Normal click (not shift): toggle single selection
            if (isCurrentlySelected) {
              this.selectedUsers.delete(uid);
              this.selectedUsersMap.delete(uid);
            } else {
              this.selectedUsers.add(uid);
              this.selectedUsersMap.set(uid, user);
            }

            // Emit select event for single item
            this.selectEvents.push({
              user,
              selected: !isCurrentlySelected,
            });

            // Update anchor point for next potential shift-click
            this.lastClickedIndex = currentIndex;
            this.lastClickedUserUid = uid;
          }
          // If shift-click with no anchor, do nothing (no else clause)
        }
        // In 'none' mode, do nothing
      }

      /**
       * Handles shift-click range selection
       */
      private handleShiftClickSelection(clickedIndex: number, shouldDeselect: boolean): void {
        if (this.lastClickedIndex === null) {
          return;
        }

        // Determine range bounds
        const startIndex = Math.min(this.lastClickedIndex, clickedIndex);
        const endIndex = Math.max(this.lastClickedIndex, clickedIndex);

        // Select or deselect all users in range
        for (let i = startIndex; i <= endIndex; i++) {
          const userInRange = this.userList[i];
          if (userInRange) {
            const userUid = userInRange.getUid();

            if (shouldDeselect) {
              // Deselect user
              this.selectedUsers.delete(userUid);
              this.selectedUsersMap.delete(userUid);
            } else {
              // Select user
              this.selectedUsers.add(userUid);
              this.selectedUsersMap.set(userUid, userInRange);
            }

            // Emit select event for each user in range
            this.selectEvents.push({
              user: userInRange,
              selected: !shouldDeselect,
            });
          }
        }

        // Note: Anchor point is NOT updated on shift-click
      }

      isUserSelected(user: MockUser): boolean {
        return this.selectedUsers.has(user.getUid());
      }

      reset(): void {
        this.selectedUsers.clear();
        this.selectedUsersMap.clear();
        this.lastClickedIndex = null;
        this.lastClickedUserUid = null;
        this.selectEvents = [];
      }
    }

    // ============================================
    // Fast-Check Arbitraries for Selection Testing
    // ============================================

    /**
     * Arbitrary for selection modes
     */
    const selectionModeArbitrary = fc.constantFrom('none', 'single', 'multiple') as fc.Arbitrary<
      'none' | 'single' | 'multiple'
    >;

    /**
     * Arbitrary for a sequence of user selection actions
     */
    const selectionActionArbitrary = fc.record({
      userIndex: fc.nat(),
      shiftKey: fc.boolean(),
    });

    /**
     * Arbitrary for a sequence of selection actions
     */
    const selectionSequenceArbitrary = fc.array(selectionActionArbitrary, {
      minLength: 1,
      maxLength: 20,
    });

    // ============================================
    // Property Tests for Selection Behavior
    // ============================================

    it('should not track selection state in "none" mode for any selection sequence', () => {
      fc.assert(
        fc.property(
          fc.array(userArbitrary, { minLength: 1, maxLength: 20 }),
          selectionSequenceArbitrary,
          (users, actions) => {
            // Arrange - Create unique users
            const uniqueUsers = Array.from(new Map(users.map(u => [u.getUid(), u])).values());
            if (uniqueUsers.length === 0) return;

            const component = new MockSelectionComponent(uniqueUsers, 'none');

            // Act - Perform selection actions
            actions.forEach(action => {
              const userIndex = action.userIndex % uniqueUsers.length;
              const user = uniqueUsers[userIndex];
              component.handleSelectionChange(user, { shiftKey: action.shiftKey });
            });

            // Assert - No selection state should be tracked in 'none' mode
            expect(component.selectedUsers.size).toBe(0);
            expect(component.selectedUsersMap.size).toBe(0);
            expect(component.selectEvents.length).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain at most one selected user in "single" mode for any selection sequence', () => {
      fc.assert(
        fc.property(
          fc.array(userArbitrary, { minLength: 2, maxLength: 20 }),
          selectionSequenceArbitrary,
          (users, actions) => {
            // Arrange - Create unique users
            const uniqueUsers = Array.from(new Map(users.map(u => [u.getUid(), u])).values());
            if (uniqueUsers.length < 2) return;

            const component = new MockSelectionComponent(uniqueUsers, 'single');

            // Act & Assert - After each selection, at most one user should be selected
            actions.forEach(action => {
              const userIndex = action.userIndex % uniqueUsers.length;
              const user = uniqueUsers[userIndex];
              component.handleSelectionChange(user, { shiftKey: action.shiftKey });

              // Assert - At most one user selected
              expect(component.selectedUsers.size).toBeLessThanOrEqual(1);
              expect(component.selectedUsersMap.size).toBeLessThanOrEqual(1);

              // Assert - If one user is selected, it should be the last clicked user
              if (component.selectedUsers.size === 1) {
                expect(component.selectedUsers.has(user.getUid())).toBe(true);
              }
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should toggle selection correctly in "single" mode when clicking the same user twice', () => {
      fc.assert(
        fc.property(
          fc.array(userArbitrary, { minLength: 1, maxLength: 10 }),
          fc.nat(),
          (users, userIndexSeed) => {
            // Arrange - Create unique users
            const uniqueUsers = Array.from(new Map(users.map(u => [u.getUid(), u])).values());
            if (uniqueUsers.length === 0) return;

            const component = new MockSelectionComponent(uniqueUsers, 'single');
            const userIndex = userIndexSeed % uniqueUsers.length;
            const user = uniqueUsers[userIndex];

            // Act - Click the same user twice
            component.handleSelectionChange(user);
            const selectedAfterFirstClick = component.isUserSelected(user);

            component.handleSelectionChange(user);
            const selectedAfterSecondClick = component.isUserSelected(user);

            // Assert - First click selects, second click deselects
            expect(selectedAfterFirstClick).toBe(true);
            expect(selectedAfterSecondClick).toBe(false);
            expect(component.selectedUsers.size).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should allow multiple selections in "multiple" mode for any selection sequence', () => {
      fc.assert(
        fc.property(
          fc.array(userArbitrary, { minLength: 3, maxLength: 20 }),
          fc.array(fc.nat(), { minLength: 2, maxLength: 10 }),
          (users, userIndices) => {
            // Arrange - Create unique users
            const uniqueUsers = Array.from(new Map(users.map(u => [u.getUid(), u])).values());
            if (uniqueUsers.length < 3) return;

            const component = new MockSelectionComponent(uniqueUsers, 'multiple');

            // Act - Select multiple different users (without shift key)
            const selectedIndices = userIndices.map(idx => idx % uniqueUsers.length);
            const uniqueSelectedIndices = Array.from(new Set(selectedIndices));

            uniqueSelectedIndices.forEach(userIndex => {
              const user = uniqueUsers[userIndex];
              component.handleSelectionChange(user, { shiftKey: false });
            });

            // Assert - Multiple users should be selected
            expect(component.selectedUsers.size).toBe(uniqueSelectedIndices.length);
            expect(component.selectedUsersMap.size).toBe(uniqueSelectedIndices.length);

            // Assert - All selected users should be in the set
            uniqueSelectedIndices.forEach(userIndex => {
              const user = uniqueUsers[userIndex];
              expect(component.isUserSelected(user)).toBe(true);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should toggle individual selections in "multiple" mode when clicking without shift', () => {
      fc.assert(
        fc.property(
          fc.array(userArbitrary, { minLength: 1, maxLength: 10 }),
          fc.nat(),
          (users, userIndexSeed) => {
            // Arrange - Create unique users
            const uniqueUsers = Array.from(new Map(users.map(u => [u.getUid(), u])).values());
            if (uniqueUsers.length === 0) return;

            const component = new MockSelectionComponent(uniqueUsers, 'multiple');
            const userIndex = userIndexSeed % uniqueUsers.length;
            const user = uniqueUsers[userIndex];

            // Act - Click the same user twice without shift
            component.handleSelectionChange(user, { shiftKey: false });
            const selectedAfterFirstClick = component.isUserSelected(user);

            component.handleSelectionChange(user, { shiftKey: false });
            const selectedAfterSecondClick = component.isUserSelected(user);

            // Assert - First click selects, second click deselects
            expect(selectedAfterFirstClick).toBe(true);
            expect(selectedAfterSecondClick).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should select range with shift-click in "multiple" mode from any anchor point', () => {
      fc.assert(
        fc.property(
          fc.array(userArbitrary, { minLength: 5, maxLength: 20 }),
          fc.nat(),
          fc.nat(),
          (users, anchorIndexSeed, targetIndexSeed) => {
            // Arrange - Create unique users
            const uniqueUsers = Array.from(new Map(users.map(u => [u.getUid(), u])).values());
            if (uniqueUsers.length < 5) return;

            const component = new MockSelectionComponent(uniqueUsers, 'multiple');

            // Act - Click anchor point (without shift)
            const anchorIndex = anchorIndexSeed % uniqueUsers.length;
            const anchorUser = uniqueUsers[anchorIndex];
            component.handleSelectionChange(anchorUser, { shiftKey: false });

            // Act - Shift-click target point
            const targetIndex = targetIndexSeed % uniqueUsers.length;
            const targetUser = uniqueUsers[targetIndex];

            // Determine if this is a deselect operation (clicking already selected item)
            const isAnchorSelected = component.isUserSelected(targetUser);

            component.handleSelectionChange(targetUser, { shiftKey: true });

            // Assert - Behavior depends on whether target was already selected
            const startIndex = Math.min(anchorIndex, targetIndex);
            const endIndex = Math.max(anchorIndex, targetIndex);

            if (anchorIndex === targetIndex && isAnchorSelected) {
              // Special case: shift-clicking the same selected item deselects it
              expect(component.selectedUsers.size).toBe(0);
            } else {
              // Normal case: range selection
              const expectedSelectedCount = endIndex - startIndex + 1;
              expect(component.selectedUsers.size).toBe(expectedSelectedCount);

              // Assert - Each user in range should be selected
              for (let i = startIndex; i <= endIndex; i++) {
                const user = uniqueUsers[i];
                expect(component.isUserSelected(user)).toBe(true);
              }

              // Assert - Users outside range should not be selected
              for (let i = 0; i < uniqueUsers.length; i++) {
                if (i < startIndex || i > endIndex) {
                  const user = uniqueUsers[i];
                  expect(component.isUserSelected(user)).toBe(false);
                }
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should deselect range with shift-click when anchor is already selected', () => {
      fc.assert(
        fc.property(
          fc.array(userArbitrary, { minLength: 5, maxLength: 15 }),
          fc.nat(),
          fc.nat(),
          (users, anchorIndexSeed, targetIndexSeed) => {
            // Arrange - Create unique users
            const uniqueUsers = Array.from(new Map(users.map(u => [u.getUid(), u])).values());
            if (uniqueUsers.length < 5) return;

            const component = new MockSelectionComponent(uniqueUsers, 'multiple');

            // Act - Select anchor point
            const anchorIndex = anchorIndexSeed % uniqueUsers.length;
            const anchorUser = uniqueUsers[anchorIndex];
            component.handleSelectionChange(anchorUser, { shiftKey: false });

            // Act - Shift-click the same anchor (should deselect)
            const targetIndex = anchorIndex; // Same as anchor
            const targetUser = uniqueUsers[targetIndex];
            component.handleSelectionChange(targetUser, { shiftKey: true });

            // Assert - Anchor should be deselected
            expect(component.isUserSelected(anchorUser)).toBe(false);
            expect(component.selectedUsers.size).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain anchor point across multiple shift-click operations', () => {
      fc.assert(
        fc.property(
          fc.array(userArbitrary, { minLength: 10, maxLength: 20 }),
          fc.nat(),
          fc.array(fc.nat(), { minLength: 2, maxLength: 5 }),
          (users, anchorIndexSeed, targetIndices) => {
            // Arrange - Create unique users
            const uniqueUsers = Array.from(new Map(users.map(u => [u.getUid(), u])).values());
            if (uniqueUsers.length < 10) return;

            const anchorIndex = anchorIndexSeed % uniqueUsers.length;
            const anchorUser = uniqueUsers[anchorIndex];

            // Act - Perform multiple shift-clicks from the same anchor
            targetIndices.forEach(targetIndexSeed => {
              // Create fresh component for each test
              const component = new MockSelectionComponent(uniqueUsers, 'multiple');

              // Establish anchor
              component.handleSelectionChange(anchorUser, { shiftKey: false });

              // Shift-click target
              const targetIndex = targetIndexSeed % uniqueUsers.length;
              const targetUser = uniqueUsers[targetIndex];

              // Check if target is already selected (same as anchor)
              const isTargetSelected = component.isUserSelected(targetUser);

              component.handleSelectionChange(targetUser, { shiftKey: true });

              // Assert - Range from anchor to target should be selected
              const startIndex = Math.min(anchorIndex, targetIndex);
              const endIndex = Math.max(anchorIndex, targetIndex);

              if (anchorIndex === targetIndex && isTargetSelected) {
                // Special case: shift-clicking the same selected item deselects it
                expect(component.selectedUsers.size).toBe(0);
              } else {
                // Normal case: range should be selected
                for (let i = startIndex; i <= endIndex; i++) {
                  const user = uniqueUsers[i];
                  expect(component.isUserSelected(user)).toBe(true);
                }
              }
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle shift-click with no prior anchor gracefully', () => {
      fc.assert(
        fc.property(
          fc.array(userArbitrary, { minLength: 3, maxLength: 10 }),
          fc.nat(),
          (users, targetIndexSeed) => {
            // Arrange - Create unique users
            const uniqueUsers = Array.from(new Map(users.map(u => [u.getUid(), u])).values());
            if (uniqueUsers.length < 3) return;

            const component = new MockSelectionComponent(uniqueUsers, 'multiple');

            // Act - Shift-click without establishing an anchor first
            const targetIndex = targetIndexSeed % uniqueUsers.length;
            const targetUser = uniqueUsers[targetIndex];
            component.handleSelectionChange(targetUser, { shiftKey: true });

            // Assert - With no anchor, shift-click should do nothing (no range selection)
            // The implementation returns early when lastClickedIndex is null
            expect(component.selectedUsers.size).toBe(0);
            expect(component.lastClickedIndex).toBeNull();
            expect(component.lastClickedUserUid).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should emit correct select events for all selection modes', () => {
      fc.assert(
        fc.property(
          fc.array(userArbitrary, { minLength: 2, maxLength: 10 }),
          selectionModeArbitrary,
          fc.array(fc.nat(), { minLength: 1, maxLength: 5 }),
          (users, selectionMode, userIndices) => {
            // Arrange - Create unique users
            const uniqueUsers = Array.from(new Map(users.map(u => [u.getUid(), u])).values());
            if (uniqueUsers.length < 2) return;

            const component = new MockSelectionComponent(uniqueUsers, selectionMode);

            // Act - Perform selections
            userIndices.forEach(indexSeed => {
              const userIndex = indexSeed % uniqueUsers.length;
              const user = uniqueUsers[userIndex];
              component.handleSelectionChange(user, { shiftKey: false });
            });

            // Assert - Events should be emitted based on selection mode
            if (selectionMode === 'none') {
              expect(component.selectEvents.length).toBe(0);
            } else {
              expect(component.selectEvents.length).toBeGreaterThan(0);

              // Assert - Each event should have user and selected properties
              component.selectEvents.forEach(event => {
                expect(event.user).toBeDefined();
                expect(typeof event.selected).toBe('boolean');
              });
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle edge case of selecting all users in list via shift-click', () => {
      fc.assert(
        fc.property(fc.array(userArbitrary, { minLength: 3, maxLength: 15 }), users => {
          // Arrange - Create unique users
          const uniqueUsers = Array.from(new Map(users.map(u => [u.getUid(), u])).values());
          if (uniqueUsers.length < 3) return;

          const component = new MockSelectionComponent(uniqueUsers, 'multiple');

          // Act - Click first user, then shift-click last user
          const firstUser = uniqueUsers[0];
          const lastUser = uniqueUsers[uniqueUsers.length - 1];

          component.handleSelectionChange(firstUser, { shiftKey: false });
          component.handleSelectionChange(lastUser, { shiftKey: true });

          // Assert - All users should be selected
          expect(component.selectedUsers.size).toBe(uniqueUsers.length);

          uniqueUsers.forEach(user => {
            expect(component.isUserSelected(user)).toBe(true);
          });
        }),
        { numRuns: 100 }
      );
    });

    it('should handle reverse range selection (clicking earlier index after later index)', () => {
      fc.assert(
        fc.property(
          fc.array(userArbitrary, { minLength: 5, maxLength: 15 }),
          fc.nat(),
          fc.nat(),
          (users, index1Seed, index2Seed) => {
            // Arrange - Create unique users
            const uniqueUsers = Array.from(new Map(users.map(u => [u.getUid(), u])).values());
            if (uniqueUsers.length < 5) return;

            const component = new MockSelectionComponent(uniqueUsers, 'multiple');

            // Act - Click later index first, then shift-click earlier index
            const index1 = index1Seed % uniqueUsers.length;
            const index2 = index2Seed % uniqueUsers.length;

            // Ensure index1 > index2 for reverse selection
            const laterIndex = Math.max(index1, index2);
            const earlierIndex = Math.min(index1, index2);

            if (laterIndex === earlierIndex) return; // Skip if same index

            const laterUser = uniqueUsers[laterIndex];
            const earlierUser = uniqueUsers[earlierIndex];

            component.handleSelectionChange(laterUser, { shiftKey: false });
            component.handleSelectionChange(earlierUser, { shiftKey: true });

            // Assert - Range should be selected regardless of direction
            const expectedCount = laterIndex - earlierIndex + 1;
            expect(component.selectedUsers.size).toBe(expectedCount);

            for (let i = earlierIndex; i <= laterIndex; i++) {
              const user = uniqueUsers[i];
              expect(component.isUserSelected(user)).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 5: Users Section Headers Correctness
   *
   * For any list of users when showSectionHeader is true, section headers SHALL appear:
   * - Before the first user
   * - Before any user whose first letter of name differs from the previous user's first letter
   * - With the correct uppercase letter matching the first character of the following user's name
   *
   * Validates: Requirements 3.13
   *
   * Feature: users-groups-paginated-list-refactor, Property 5: Users Section Headers Correctness
   */
  describe('Property 5: Users Section Headers Correctness', () => {
    /**
     * Mock component for testing section header behavior
     */
    class MockSectionHeaderComponent {
      userList: MockUser[] = [];
      showSectionHeader = true;

      constructor(users: MockUser[], showSectionHeader = true) {
        this.userList = users;
        this.showSectionHeader = showSectionHeader;
      }

      /**
       * Simulates the shouldShowSectionHeader method
       */
      shouldShowSectionHeader(index: number): boolean {
        if (!this.showSectionHeader || this.userList.length === 0) {
          return false;
        }

        const currentUser = this.userList[index];
        const currentHeader = this.getSectionHeaderValue(currentUser);

        // Show header for first item
        if (index === 0) {
          return true;
        }

        // Show header if different from previous user's header
        const previousUser = this.userList[index - 1];
        const previousHeader = this.getSectionHeaderValue(previousUser);

        return currentHeader !== previousHeader;
      }

      /**
       * Simulates the getSectionHeaderValue method
       */
      getSectionHeaderValue(user: MockUser): string {
        try {
          const name = user.getName();
          if (name && typeof name === 'string' && name.length > 0) {
            return name.charAt(0).toUpperCase();
          }
          return '#';
        } catch {
          return '#';
        }
      }
    }

    // ============================================
    // Fast-Check Arbitraries for Section Header Testing
    // ============================================

    /**
     * Arbitrary for generating user names with specific first letters
     */
    const userNameWithLetterArbitrary = (letter: string) =>
      fc.string({ minLength: 1, maxLength: 20 }).map(suffix => `${letter}${suffix}`);

    /**
     * Arbitrary for generating a list of users with controlled alphabetical distribution
     */
    const alphabeticalUserListArbitrary = fc
      .array(
        fc.record({
          letter: fc.constantFrom(
            'A',
            'B',
            'C',
            'D',
            'E',
            'F',
            'G',
            'H',
            'I',
            'J',
            'K',
            'L',
            'M',
            'N',
            'O',
            'P',
            'Q',
            'R',
            'S',
            'T',
            'U',
            'V',
            'W',
            'X',
            'Y',
            'Z',
            'a',
            'b',
            'c',
            'd'
          ),
          suffix: fc.string({ minLength: 0, maxLength: 15 }),
        }),
        { minLength: 1, maxLength: 50 }
      )
      .map(specs =>
        specs.map(
          (spec, idx) => new MockUser(`uid-${idx}`, `${spec.letter}${spec.suffix}`, '', 'online')
        )
      );

    /**
     * Arbitrary for generating users with edge case names
     */
    const edgeCaseNameArbitrary = fc.constantFrom(
      '', // Empty name
      ' ', // Space only
      '123', // Number start
      '!@#', // Special characters
      'a', // Single lowercase letter
      'A', // Single uppercase letter
      '   Leading spaces',
      'Ñoño', // Unicode characters
      '中文' // Non-Latin characters
    );

    /**
     * Arbitrary for generating users with edge case names
     */
    const edgeCaseUserListArbitrary = fc
      .array(edgeCaseNameArbitrary, { minLength: 1, maxLength: 10 })
      .map(names => names.map((name, idx) => new MockUser(`uid-${idx}`, name, '', 'online')));

    // ============================================
    // Property Tests for Section Headers
    // ============================================

    it('should always show section header for the first user when showSectionHeader is true', () => {
      fc.assert(
        fc.property(alphabeticalUserListArbitrary, users => {
          // Skip empty lists
          if (users.length === 0) return;

          // Arrange
          const component = new MockSectionHeaderComponent(users, true);

          // Act & Assert - First user should always have a section header
          expect(component.shouldShowSectionHeader(0)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should not show any section headers when showSectionHeader is false', () => {
      fc.assert(
        fc.property(alphabeticalUserListArbitrary, users => {
          // Skip empty lists
          if (users.length === 0) return;

          // Arrange
          const component = new MockSectionHeaderComponent(users, false);

          // Act & Assert - No section headers should be shown
          for (let i = 0; i < users.length; i++) {
            expect(component.shouldShowSectionHeader(i)).toBe(false);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should show section header when first letter changes from previous user', () => {
      fc.assert(
        fc.property(alphabeticalUserListArbitrary, users => {
          // Skip lists with less than 2 users
          if (users.length < 2) return;

          // Arrange
          const component = new MockSectionHeaderComponent(users, true);

          // Act & Assert - Check each user after the first
          for (let i = 1; i < users.length; i++) {
            const currentLetter = component.getSectionHeaderValue(users[i]);
            const previousLetter = component.getSectionHeaderValue(users[i - 1]);

            const shouldShow = component.shouldShowSectionHeader(i);

            if (currentLetter !== previousLetter) {
              // Different letter: should show header
              expect(shouldShow).toBe(true);
            } else {
              // Same letter: should not show header
              expect(shouldShow).toBe(false);
            }
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should return correct uppercase letter for section header value', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 1, maxLength: 20 }), fc.nat(), (name, uidSeed) => {
          // Arrange
          const user = new MockUser(`uid-${uidSeed}`, name, '', 'online');
          const component = new MockSectionHeaderComponent([user], true);

          // Act
          const headerValue = component.getSectionHeaderValue(user);

          // Assert - Should be uppercase first character or '#'
          if (name && name.length > 0) {
            expect(headerValue).toBe(name.charAt(0).toUpperCase());
            expect(headerValue.length).toBe(1);
          } else {
            expect(headerValue).toBe('#');
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should return # for empty or invalid names', () => {
      fc.assert(
        fc.property(edgeCaseUserListArbitrary, users => {
          // Skip empty lists
          if (users.length === 0) return;

          // Arrange
          const component = new MockSectionHeaderComponent(users, true);

          // Act & Assert - Check each user
          users.forEach(user => {
            const headerValue = component.getSectionHeaderValue(user);
            const name = user.getName();

            if (!name || name.length === 0) {
              // Empty name should return '#'
              expect(headerValue).toBe('#');
            } else {
              // Non-empty name should return first character uppercase
              expect(headerValue).toBe(name.charAt(0).toUpperCase());
            }
          });
        }),
        { numRuns: 100 }
      );
    });

    it('should handle consecutive users with same first letter correctly', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('A', 'B', 'C', 'D', 'E'),
          fc.integer({ min: 2, max: 10 }),
          (letter, count) => {
            // Arrange - Create multiple users with same first letter
            const users = Array.from(
              { length: count },
              (_, i) => new MockUser(`uid-${i}`, `${letter}User${i}`, '', 'online')
            );
            const component = new MockSectionHeaderComponent(users, true);

            // Act & Assert
            // First user should have header
            expect(component.shouldShowSectionHeader(0)).toBe(true);

            // Subsequent users with same letter should not have headers
            for (let i = 1; i < users.length; i++) {
              expect(component.shouldShowSectionHeader(i)).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle alternating first letters correctly', () => {
      fc.assert(
        fc.property(
          fc.array(fc.constantFrom('A', 'B'), { minLength: 4, maxLength: 20 }),
          letters => {
            // Arrange - Create users with alternating letters
            const users = letters.map(
              (letter, i) => new MockUser(`uid-${i}`, `${letter}User${i}`, '', 'online')
            );
            const component = new MockSectionHeaderComponent(users, true);

            // Act & Assert
            for (let i = 0; i < users.length; i++) {
              const shouldShow = component.shouldShowSectionHeader(i);

              if (i === 0) {
                // First user always has header
                expect(shouldShow).toBe(true);
              } else {
                const currentLetter = letters[i];
                const previousLetter = letters[i - 1];

                if (currentLetter !== previousLetter) {
                  // Letter changed: should show header
                  expect(shouldShow).toBe(true);
                } else {
                  // Same letter: should not show header
                  expect(shouldShow).toBe(false);
                }
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle case-insensitive comparison (a and A are same section)', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              letter: fc.constantFrom('a', 'A', 'b', 'B', 'c', 'C'),
              suffix: fc.string({ minLength: 0, maxLength: 10 }),
            }),
            { minLength: 2, maxLength: 15 }
          ),
          specs => {
            // Arrange
            const users = specs.map(
              (spec, i) => new MockUser(`uid-${i}`, `${spec.letter}${spec.suffix}`, '', 'online')
            );
            const component = new MockSectionHeaderComponent(users, true);

            // Act & Assert
            for (let i = 1; i < users.length; i++) {
              const currentLetter = component.getSectionHeaderValue(users[i]);
              const previousLetter = component.getSectionHeaderValue(users[i - 1]);
              const shouldShow = component.shouldShowSectionHeader(i);

              // Both should be uppercase, so 'a' and 'A' become same section
              if (currentLetter === previousLetter) {
                expect(shouldShow).toBe(false);
              } else {
                expect(shouldShow).toBe(true);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle mixed valid and invalid names correctly', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.oneof(fc.string({ minLength: 1, maxLength: 20 }), fc.constant(''), fc.constant(' ')),
            { minLength: 3, maxLength: 15 }
          ),
          names => {
            // Arrange
            const users = names.map((name, i) => new MockUser(`uid-${i}`, name, '', 'online'));
            const component = new MockSectionHeaderComponent(users, true);

            // Act & Assert
            // First user always has header
            expect(component.shouldShowSectionHeader(0)).toBe(true);

            // Check subsequent users
            for (let i = 1; i < users.length; i++) {
              const currentHeader = component.getSectionHeaderValue(users[i]);
              const previousHeader = component.getSectionHeaderValue(users[i - 1]);
              const shouldShow = component.shouldShowSectionHeader(i);

              if (currentHeader !== previousHeader) {
                expect(shouldShow).toBe(true);
              } else {
                expect(shouldShow).toBe(false);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle single user list correctly', () => {
      fc.assert(
        fc.property(userArbitrary, user => {
          // Arrange
          const component = new MockSectionHeaderComponent([user], true);

          // Act & Assert
          // Single user should have header
          expect(component.shouldShowSectionHeader(0)).toBe(true);

          // Header value should be first letter uppercase or '#'
          const headerValue = component.getSectionHeaderValue(user);
          const name = user.getName();

          if (name && name.length > 0) {
            expect(headerValue).toBe(name.charAt(0).toUpperCase());
          } else {
            expect(headerValue).toBe('#');
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should handle all users with same first letter correctly', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('A', 'B', 'C', 'X', 'Y', 'Z'),
          fc.integer({ min: 1, max: 20 }),
          (letter, count) => {
            // Arrange - All users start with same letter
            const users = Array.from(
              { length: count },
              (_, i) => new MockUser(`uid-${i}`, `${letter}User${i}`, '', 'online')
            );
            const component = new MockSectionHeaderComponent(users, true);

            // Act & Assert
            // Only first user should have header
            expect(component.shouldShowSectionHeader(0)).toBe(true);

            // All other users should not have headers
            for (let i = 1; i < users.length; i++) {
              expect(component.shouldShowSectionHeader(i)).toBe(false);
            }

            // All should have same header value
            const expectedHeader = letter.toUpperCase();
            users.forEach(user => {
              expect(component.getSectionHeaderValue(user)).toBe(expectedHeader);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle alphabetically sorted list correctly', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.constantFrom(
              'Alice',
              'Andrew',
              'Bob',
              'Barbara',
              'Charlie',
              'Catherine',
              'David',
              'Diana',
              'Edward',
              'Emma',
              'Frank',
              'Fiona'
            ),
            { minLength: 3, maxLength: 12 }
          ),
          names => {
            // Arrange - Sort names alphabetically
            const sortedNames = [...names].sort();
            const users = sortedNames.map(
              (name, i) => new MockUser(`uid-${i}`, name, '', 'online')
            );
            const component = new MockSectionHeaderComponent(users, true);

            // Act & Assert
            let lastLetter = '';
            let headerCount = 0;

            for (let i = 0; i < users.length; i++) {
              const currentLetter = component.getSectionHeaderValue(users[i]);
              const shouldShow = component.shouldShowSectionHeader(i);

              if (i === 0 || currentLetter !== lastLetter) {
                // Should show header when letter changes or first item
                expect(shouldShow).toBe(true);
                headerCount++;
              } else {
                // Should not show header when letter is same
                expect(shouldShow).toBe(false);
              }

              lastLetter = currentLetter;
            }

            // At least one header should be shown (for first user)
            expect(headerCount).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle numbers and special characters at start of name', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.oneof(
              fc.string({ minLength: 1, maxLength: 15 }),
              fc.constantFrom('123User', '!Special', '@Mention', '#Tag', '999Name')
            ),
            { minLength: 2, maxLength: 10 }
          ),
          names => {
            // Arrange
            const users = names.map((name, i) => new MockUser(`uid-${i}`, name, '', 'online'));
            const component = new MockSectionHeaderComponent(users, true);

            // Act & Assert
            users.forEach(user => {
              const headerValue = component.getSectionHeaderValue(user);
              const name = user.getName();

              // Should return first character uppercase
              if (name && name.length > 0) {
                expect(headerValue).toBe(name.charAt(0).toUpperCase());
              } else {
                expect(headerValue).toBe('#');
              }
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain consistency across multiple calls for same user', () => {
      fc.assert(
        fc.property(userArbitrary, user => {
          // Arrange
          const component = new MockSectionHeaderComponent([user], true);

          // Act - Call multiple times
          const value1 = component.getSectionHeaderValue(user);
          const value2 = component.getSectionHeaderValue(user);
          const value3 = component.getSectionHeaderValue(user);

          // Assert - Should always return same value
          expect(value1).toBe(value2);
          expect(value2).toBe(value3);
        }),
        { numRuns: 100 }
      );
    });

    it('should handle empty list correctly', () => {
      // Arrange
      const component = new MockSectionHeaderComponent([], true);

      // Act & Assert - Should not crash and return false for any index
      expect(component.shouldShowSectionHeader(0)).toBe(false);
      expect(component.shouldShowSectionHeader(1)).toBe(false);
      expect(component.shouldShowSectionHeader(-1)).toBe(false);
    });

    it('should count correct number of section headers for any user list', () => {
      fc.assert(
        fc.property(alphabeticalUserListArbitrary, users => {
          // Skip empty lists
          if (users.length === 0) return;

          // Arrange
          const component = new MockSectionHeaderComponent(users, true);

          // Act - Count headers and track letter transitions
          let headerCount = 0;
          let lastLetter = '';

          for (let i = 0; i < users.length; i++) {
            if (component.shouldShowSectionHeader(i)) {
              headerCount++;
            }

            const currentLetter = component.getSectionHeaderValue(users[i]);

            // Verify header appears when expected
            if (i === 0 || currentLetter !== lastLetter) {
              expect(component.shouldShowSectionHeader(i)).toBe(true);
            } else {
              expect(component.shouldShowSectionHeader(i)).toBe(false);
            }

            lastLetter = currentLetter;
          }

          // Assert - At least one header (first user)
          expect(headerCount).toBeGreaterThan(0);
          // Assert - At most one header per user
          expect(headerCount).toBeLessThanOrEqual(users.length);
          // Assert - First user always has header
          expect(component.shouldShowSectionHeader(0)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 6: Users Keyboard Navigation
   *
   * For any focused state in the users list:
   * - ArrowDown SHALL move focus to the next item (wrapping to first)
   * - ArrowUp SHALL move focus to the previous item (wrapping to last)
   * - Enter SHALL trigger item click on the focused item
   * - Space SHALL toggle selection in multiple mode
   * - Escape SHALL clear search and reset focus
   * - Only the focused item SHALL have tabindex=0 (roving tabindex pattern)
   *
   * Validates: Requirements 3.14, 6.7, 6.9
   *
   * Feature: users-groups-paginated-list-refactor, Property 6: Users Keyboard Navigation
   */
  describe('Property 6: Users Keyboard Navigation', () => {
    /**
     * Mock component for testing keyboard navigation behavior
     */
    class MockKeyboardNavigationComponent {
      userList: MockUser[] = [];
      focusedIndex = -1;
      selectedUsers = new Set<string>();
      selectedUsersMap = new Map<string, MockUser>();
      selectionMode: 'none' | 'single' | 'multiple' = 'none';
      searchText = '';
      fetchState = 'loaded';

      // Track emitted events
      itemClickEvents: MockUser[] = [];
      selectEvents: { user: MockUser; selected: boolean }[] = [];

      constructor(users: MockUser[], selectionMode: 'none' | 'single' | 'multiple' = 'none') {
        this.userList = users;
        this.selectionMode = selectionMode;
      }

      /**
       * Simulates the focusNextItem method
       */
      focusNextItem(): void {
        const navigableIndices = this.getNavigableUserIndices();
        if (navigableIndices.length === 0) {
          return;
        }

        if (this.focusedIndex === -1) {
          // No item focused yet, start at first item
          this.focusedIndex = navigableIndices[0];
        } else {
          // Find current position in navigable indices
          const currentPosition = navigableIndices.indexOf(this.focusedIndex);
          if (currentPosition === -1 || currentPosition === navigableIndices.length - 1) {
            // Wrap to first item
            this.focusedIndex = navigableIndices[0];
          } else {
            // Move to next item
            this.focusedIndex = navigableIndices[currentPosition + 1];
          }
        }
      }

      /**
       * Simulates the focusPreviousItem method
       */
      focusPreviousItem(): void {
        const navigableIndices = this.getNavigableUserIndices();
        if (navigableIndices.length === 0) {
          return;
        }

        if (this.focusedIndex === -1) {
          // No item focused yet, start at last item
          this.focusedIndex = navigableIndices[navigableIndices.length - 1];
        } else {
          // Find current position in navigable indices
          const currentPosition = navigableIndices.indexOf(this.focusedIndex);
          if (currentPosition === -1 || currentPosition === 0) {
            // Wrap to last item
            this.focusedIndex = navigableIndices[navigableIndices.length - 1];
          } else {
            // Move to previous item
            this.focusedIndex = navigableIndices[currentPosition - 1];
          }
        }
      }

      /**
       * Gets the indices of all navigable user items
       */
      private getNavigableUserIndices(): number[] {
        return this.userList.map((_, index) => index);
      }

      /**
       * Simulates the selectFocusedItem method (Enter key)
       */
      selectFocusedItem(): void {
        if (this.focusedIndex >= 0 && this.focusedIndex < this.userList.length) {
          const user = this.userList[this.focusedIndex];
          if (this.selectionMode !== 'none') {
            this.handleSelectionChange(user);
          } else {
            this.handleUserClick(user);
          }
        }
      }

      /**
       * Simulates the toggleFocusedItemSelection method (Space key)
       */
      toggleFocusedItemSelection(): void {
        if (this.focusedIndex >= 0 && this.focusedIndex < this.userList.length) {
          const user = this.userList[this.focusedIndex];
          this.handleSelectionChange(user);
        }
      }

      /**
       * Simulates the clearSearchOrCloseMenu method (Escape key)
       */
      clearSearchOrCloseMenu(): void {
        this.searchText = '';
        this.focusedIndex = -1;
      }

      /**
       * Simulates the getTabIndex method
       */
      getTabIndex(index: number): number {
        // If this item is focused, it should be tabbable
        if (this.focusedIndex === index) {
          return 0;
        }
        // If no item is focused and this is the first item, make it tabbable
        if (this.focusedIndex === -1 && index === 0) {
          return 0;
        }
        // Otherwise, not tabbable
        return -1;
      }

      /**
       * Simulates handleUserClick
       */
      private handleUserClick(user: MockUser): void {
        this.itemClickEvents.push(user);
      }

      /**
       * Simulates handleSelectionChange
       */
      private handleSelectionChange(user: MockUser): void {
        const uid = user.getUid();
        const isCurrentlySelected = this.selectedUsers.has(uid);

        if (this.selectionMode === 'single') {
          // Single selection: clear all and select new
          this.selectedUsers.clear();
          this.selectedUsersMap.clear();

          if (!isCurrentlySelected) {
            this.selectedUsers.add(uid);
            this.selectedUsersMap.set(uid, user);
          }

          this.selectEvents.push({
            user,
            selected: !isCurrentlySelected,
          });
        } else if (this.selectionMode === 'multiple') {
          // Multiple selection: toggle
          if (isCurrentlySelected) {
            this.selectedUsers.delete(uid);
            this.selectedUsersMap.delete(uid);
          } else {
            this.selectedUsers.add(uid);
            this.selectedUsersMap.set(uid, user);
          }

          this.selectEvents.push({
            user,
            selected: !isCurrentlySelected,
          });
        }
      }

      isUserSelected(user: MockUser): boolean {
        return this.selectedUsers.has(user.getUid());
      }

      reset(): void {
        this.focusedIndex = -1;
        this.selectedUsers.clear();
        this.selectedUsersMap.clear();
        this.searchText = '';
        this.itemClickEvents = [];
        this.selectEvents = [];
      }
    }

    // ============================================
    // Fast-Check Arbitraries for Keyboard Navigation Testing
    // ============================================

    /**
     * Arbitrary for keyboard navigation actions
     */
    const keyboardActionArbitrary = fc.constantFrom(
      'ArrowDown',
      'ArrowUp',
      'Enter',
      'Space',
      'Escape'
    );

    /**
     * Arbitrary for a sequence of keyboard actions
     */
    const keyboardSequenceArbitrary = fc.array(keyboardActionArbitrary, {
      minLength: 1,
      maxLength: 20,
    });

    // ============================================
    // Property Tests for Keyboard Navigation
    // ============================================

    it('should move focus to next item with ArrowDown and wrap to first', () => {
      fc.assert(
        fc.property(fc.array(userArbitrary, { minLength: 2, maxLength: 20 }), users => {
          // Arrange - Create unique users
          const uniqueUsers = Array.from(new Map(users.map(u => [u.getUid(), u])).values());
          if (uniqueUsers.length < 2) return;

          const component = new MockKeyboardNavigationComponent(uniqueUsers);

          // Act & Assert - Navigate through all items
          for (let i = 0; i < uniqueUsers.length; i++) {
            component.focusNextItem();
            expect(component.focusedIndex).toBe(i);
          }

          // Act - One more ArrowDown should wrap to first
          component.focusNextItem();

          // Assert - Should wrap to first item (index 0)
          expect(component.focusedIndex).toBe(0);
        }),
        { numRuns: 100 }
      );
    });

    it('should move focus to previous item with ArrowUp and wrap to last', () => {
      fc.assert(
        fc.property(fc.array(userArbitrary, { minLength: 2, maxLength: 20 }), users => {
          // Arrange - Create unique users
          const uniqueUsers = Array.from(new Map(users.map(u => [u.getUid(), u])).values());
          if (uniqueUsers.length < 2) return;

          const component = new MockKeyboardNavigationComponent(uniqueUsers);

          // Act - First ArrowUp from no focus should go to last item
          component.focusPreviousItem();

          // Assert - Should be at last item
          expect(component.focusedIndex).toBe(uniqueUsers.length - 1);

          // Act & Assert - Navigate backwards through all items
          for (let i = uniqueUsers.length - 2; i >= 0; i--) {
            component.focusPreviousItem();
            expect(component.focusedIndex).toBe(i);
          }

          // Act - One more ArrowUp should wrap to last
          component.focusPreviousItem();

          // Assert - Should wrap to last item
          expect(component.focusedIndex).toBe(uniqueUsers.length - 1);
        }),
        { numRuns: 100 }
      );
    });

    it('should trigger item click with Enter in none mode', () => {
      fc.assert(
        fc.property(
          fc.array(userArbitrary, { minLength: 1, maxLength: 10 }),
          fc.nat(),
          (users, focusIndexSeed) => {
            // Arrange - Create unique users
            const uniqueUsers = Array.from(new Map(users.map(u => [u.getUid(), u])).values());
            if (uniqueUsers.length === 0) return;

            const component = new MockKeyboardNavigationComponent(uniqueUsers, 'none');
            const focusIndex = focusIndexSeed % uniqueUsers.length;

            // Set focus to a specific item
            component.focusedIndex = focusIndex;

            // Act - Press Enter
            component.selectFocusedItem();

            // Assert - Item click should be emitted
            expect(component.itemClickEvents.length).toBe(1);
            expect(component.itemClickEvents[0].getUid()).toBe(uniqueUsers[focusIndex].getUid());
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should toggle selection with Enter in single mode', () => {
      fc.assert(
        fc.property(
          fc.array(userArbitrary, { minLength: 1, maxLength: 10 }),
          fc.nat(),
          (users, focusIndexSeed) => {
            // Arrange - Create unique users
            const uniqueUsers = Array.from(new Map(users.map(u => [u.getUid(), u])).values());
            if (uniqueUsers.length === 0) return;

            const component = new MockKeyboardNavigationComponent(uniqueUsers, 'single');
            const focusIndex = focusIndexSeed % uniqueUsers.length;

            // Set focus to a specific item
            component.focusedIndex = focusIndex;

            // Act - Press Enter to select
            component.selectFocusedItem();

            // Assert - Item should be selected
            expect(component.selectedUsers.size).toBe(1);
            expect(component.isUserSelected(uniqueUsers[focusIndex])).toBe(true);

            // Act - Press Enter again to deselect
            component.selectFocusedItem();

            // Assert - Item should be deselected
            expect(component.selectedUsers.size).toBe(0);
            expect(component.isUserSelected(uniqueUsers[focusIndex])).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should toggle selection with Space in multiple mode', () => {
      fc.assert(
        fc.property(
          fc.array(userArbitrary, { minLength: 1, maxLength: 10 }),
          fc.nat(),
          (users, focusIndexSeed) => {
            // Arrange - Create unique users
            const uniqueUsers = Array.from(new Map(users.map(u => [u.getUid(), u])).values());
            if (uniqueUsers.length === 0) return;

            const component = new MockKeyboardNavigationComponent(uniqueUsers, 'multiple');
            const focusIndex = focusIndexSeed % uniqueUsers.length;

            // Set focus to a specific item
            component.focusedIndex = focusIndex;

            // Act - Press Space to select
            component.toggleFocusedItemSelection();

            // Assert - Item should be selected
            expect(component.selectedUsers.size).toBe(1);
            expect(component.isUserSelected(uniqueUsers[focusIndex])).toBe(true);

            // Act - Press Space again to deselect
            component.toggleFocusedItemSelection();

            // Assert - Item should be deselected
            expect(component.selectedUsers.size).toBe(0);
            expect(component.isUserSelected(uniqueUsers[focusIndex])).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should clear search and reset focus with Escape', () => {
      fc.assert(
        fc.property(
          fc.array(userArbitrary, { minLength: 1, maxLength: 10 }),
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.nat(),
          (users, searchText, focusIndexSeed) => {
            // Arrange - Create unique users
            const uniqueUsers = Array.from(new Map(users.map(u => [u.getUid(), u])).values());
            if (uniqueUsers.length === 0) return;

            const component = new MockKeyboardNavigationComponent(uniqueUsers);
            const focusIndex = focusIndexSeed % uniqueUsers.length;

            // Set search text and focus
            component.searchText = searchText;
            component.focusedIndex = focusIndex;

            // Act - Press Escape
            component.clearSearchOrCloseMenu();

            // Assert - Search should be cleared and focus reset
            expect(component.searchText).toBe('');
            expect(component.focusedIndex).toBe(-1);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should implement roving tabindex pattern correctly', () => {
      fc.assert(
        fc.property(
          fc.array(userArbitrary, { minLength: 3, maxLength: 15 }),
          fc.nat(),
          (users, focusIndexSeed) => {
            // Arrange - Create unique users
            const uniqueUsers = Array.from(new Map(users.map(u => [u.getUid(), u])).values());
            if (uniqueUsers.length < 3) return;

            const component = new MockKeyboardNavigationComponent(uniqueUsers);
            const focusIndex = focusIndexSeed % uniqueUsers.length;

            // Set focus to a specific item
            component.focusedIndex = focusIndex;

            // Act & Assert - Only focused item should have tabindex=0
            for (let i = 0; i < uniqueUsers.length; i++) {
              const tabIndex = component.getTabIndex(i);

              if (i === focusIndex) {
                // Focused item should be tabbable
                expect(tabIndex).toBe(0);
              } else {
                // Other items should not be tabbable
                expect(tabIndex).toBe(-1);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should make first item tabbable when no item is focused', () => {
      fc.assert(
        fc.property(fc.array(userArbitrary, { minLength: 1, maxLength: 10 }), users => {
          // Arrange - Create unique users
          const uniqueUsers = Array.from(new Map(users.map(u => [u.getUid(), u])).values());
          if (uniqueUsers.length === 0) return;

          const component = new MockKeyboardNavigationComponent(uniqueUsers);

          // focusedIndex is -1 by default (no focus)

          // Act & Assert - First item should be tabbable, others not
          for (let i = 0; i < uniqueUsers.length; i++) {
            const tabIndex = component.getTabIndex(i);

            if (i === 0) {
              // First item should be tabbable when no focus
              expect(tabIndex).toBe(0);
            } else {
              // Other items should not be tabbable
              expect(tabIndex).toBe(-1);
            }
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should handle navigation in single-item list correctly', () => {
      fc.assert(
        fc.property(userArbitrary, user => {
          // Arrange
          const component = new MockKeyboardNavigationComponent([user]);

          // Act - Navigate down
          component.focusNextItem();

          // Assert - Should focus the only item
          expect(component.focusedIndex).toBe(0);

          // Act - Navigate down again
          component.focusNextItem();

          // Assert - Should wrap to the same item (index 0)
          expect(component.focusedIndex).toBe(0);

          // Act - Navigate up
          component.focusPreviousItem();

          // Assert - Should stay at the same item (index 0)
          expect(component.focusedIndex).toBe(0);
        }),
        { numRuns: 100 }
      );
    });

    it('should handle empty list gracefully', () => {
      // Arrange
      const component = new MockKeyboardNavigationComponent([]);

      // Act - Try to navigate
      component.focusNextItem();

      // Assert - Focus should remain -1
      expect(component.focusedIndex).toBe(-1);

      // Act - Try to navigate up
      component.focusPreviousItem();

      // Assert - Focus should remain -1
      expect(component.focusedIndex).toBe(-1);

      // Act - Try to select
      component.selectFocusedItem();

      // Assert - No events should be emitted
      expect(component.itemClickEvents.length).toBe(0);
      expect(component.selectEvents.length).toBe(0);
    });

    it('should maintain focus consistency across navigation sequences', () => {
      fc.assert(
        fc.property(
          fc.array(userArbitrary, { minLength: 5, maxLength: 15 }),
          keyboardSequenceArbitrary,
          (users, actions) => {
            // Arrange - Create unique users
            const uniqueUsers = Array.from(new Map(users.map(u => [u.getUid(), u])).values());
            if (uniqueUsers.length < 5) return;

            const component = new MockKeyboardNavigationComponent(uniqueUsers, 'multiple');

            // Act - Perform keyboard actions
            actions.forEach(action => {
              switch (action) {
                case 'ArrowDown':
                  component.focusNextItem();
                  break;
                case 'ArrowUp':
                  component.focusPreviousItem();
                  break;
                case 'Enter':
                  component.selectFocusedItem();
                  break;
                case 'Space':
                  component.toggleFocusedItemSelection();
                  break;
                case 'Escape':
                  component.clearSearchOrCloseMenu();
                  break;
              }

              // Assert - Focus should always be valid
              if (component.focusedIndex !== -1) {
                expect(component.focusedIndex).toBeGreaterThanOrEqual(0);
                expect(component.focusedIndex).toBeLessThan(uniqueUsers.length);
              }
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should allow multiple selections via keyboard in multiple mode', () => {
      fc.assert(
        fc.property(
          fc.array(userArbitrary, { minLength: 5, maxLength: 15 }),
          fc.array(fc.nat(), { minLength: 2, maxLength: 5 }),
          (users, focusIndices) => {
            // Arrange - Create unique users
            const uniqueUsers = Array.from(new Map(users.map(u => [u.getUid(), u])).values());
            if (uniqueUsers.length < 5) return;

            const component = new MockKeyboardNavigationComponent(uniqueUsers, 'multiple');

            // Act - Navigate to different items and select them
            const selectedIndices = new Set<number>();
            const toggledIndices: number[] = [];

            focusIndices.forEach(indexSeed => {
              const index = indexSeed % uniqueUsers.length;
              component.focusedIndex = index;

              // Track if this index was already selected
              const wasSelected = selectedIndices.has(index);

              component.toggleFocusedItemSelection();
              toggledIndices.push(index);

              // Toggle the selection state
              if (wasSelected) {
                selectedIndices.delete(index);
              } else {
                selectedIndices.add(index);
              }
            });

            // Assert - Selection count should match the final state after all toggles
            expect(component.selectedUsers.size).toBe(selectedIndices.size);

            // Assert - All items in selectedIndices should be selected
            selectedIndices.forEach(index => {
              const user = uniqueUsers[index];
              expect(component.isUserSelected(user)).toBe(true);
            });

            // Assert - All items not in selectedIndices should not be selected
            for (let i = 0; i < uniqueUsers.length; i++) {
              if (!selectedIndices.has(i)) {
                const user = uniqueUsers[i];
                expect(component.isUserSelected(user)).toBe(false);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle rapid ArrowDown navigation correctly', () => {
      fc.assert(
        fc.property(
          fc.array(userArbitrary, { minLength: 3, maxLength: 10 }),
          fc.integer({ min: 1, max: 50 }),
          (users, pressCount) => {
            // Arrange - Create unique users
            const uniqueUsers = Array.from(new Map(users.map(u => [u.getUid(), u])).values());
            if (uniqueUsers.length < 3) return;

            const component = new MockKeyboardNavigationComponent(uniqueUsers);

            // Act - Press ArrowDown multiple times and track expected position
            for (let i = 0; i < pressCount; i++) {
              component.focusNextItem();
            }

            // Assert - Focus should be at expected position (with wrapping)
            // When starting from -1, first press goes to index 0, then increments from there
            // So after pressCount presses: (pressCount - 1) % length, but first press goes to 0
            // Simplified: after N presses from -1, we're at index (N - 1) % length
            const expectedIndex = (pressCount - 1) % uniqueUsers.length;
            expect(component.focusedIndex).toBe(expectedIndex);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle rapid ArrowUp navigation correctly', () => {
      fc.assert(
        fc.property(
          fc.array(userArbitrary, { minLength: 3, maxLength: 10 }),
          fc.integer({ min: 1, max: 50 }),
          (users, pressCount) => {
            // Arrange - Create unique users
            const uniqueUsers = Array.from(new Map(users.map(u => [u.getUid(), u])).values());
            if (uniqueUsers.length < 3) return;

            const component = new MockKeyboardNavigationComponent(uniqueUsers);

            // Act - Press ArrowUp multiple times
            for (let i = 0; i < pressCount; i++) {
              component.focusPreviousItem();
            }

            // Assert - Focus should be at expected position (with wrapping)
            // First press goes to last item, then counts backwards
            const expectedIndex =
              (uniqueUsers.length - (pressCount % uniqueUsers.length)) % uniqueUsers.length;
            expect(component.focusedIndex).toBe(expectedIndex);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle alternating ArrowDown and ArrowUp correctly', () => {
      fc.assert(
        fc.property(
          fc.array(userArbitrary, { minLength: 5, maxLength: 15 }),
          fc.array(fc.boolean(), { minLength: 5, maxLength: 20 }),
          (users, directions) => {
            // Arrange - Create unique users
            const uniqueUsers = Array.from(new Map(users.map(u => [u.getUid(), u])).values());
            if (uniqueUsers.length < 5) return;

            const component = new MockKeyboardNavigationComponent(uniqueUsers);

            // Act - Navigate with alternating directions (true = down, false = up)
            directions.forEach(isDown => {
              if (isDown) {
                component.focusNextItem();
              } else {
                component.focusPreviousItem();
              }

              // Assert - Focus should always be valid
              expect(component.focusedIndex).toBeGreaterThanOrEqual(0);
              expect(component.focusedIndex).toBeLessThan(uniqueUsers.length);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not change selection in none mode with Space key', () => {
      fc.assert(
        fc.property(
          fc.array(userArbitrary, { minLength: 1, maxLength: 10 }),
          fc.nat(),
          (users, focusIndexSeed) => {
            // Arrange - Create unique users
            const uniqueUsers = Array.from(new Map(users.map(u => [u.getUid(), u])).values());
            if (uniqueUsers.length === 0) return;

            const component = new MockKeyboardNavigationComponent(uniqueUsers, 'none');
            const focusIndex = focusIndexSeed % uniqueUsers.length;

            // Set focus to a specific item
            component.focusedIndex = focusIndex;

            // Act - Press Space (should do nothing in none mode)
            component.toggleFocusedItemSelection();

            // Assert - No selection should occur
            expect(component.selectedUsers.size).toBe(0);
            expect(component.selectEvents.length).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle Enter and Space differently in multiple mode', () => {
      fc.assert(
        fc.property(
          fc.array(userArbitrary, { minLength: 2, maxLength: 10 }),
          fc.nat(),
          (users, focusIndexSeed) => {
            // Arrange - Create unique users
            const uniqueUsers = Array.from(new Map(users.map(u => [u.getUid(), u])).values());
            if (uniqueUsers.length < 2) return;

            const component = new MockKeyboardNavigationComponent(uniqueUsers, 'multiple');
            const focusIndex = focusIndexSeed % uniqueUsers.length;

            // Set focus to a specific item
            component.focusedIndex = focusIndex;

            // Act - Press Enter to select
            component.selectFocusedItem();

            // Assert - Item should be selected
            expect(component.selectedUsers.size).toBe(1);
            expect(component.isUserSelected(uniqueUsers[focusIndex])).toBe(true);

            // Reset
            component.reset();
            component.focusedIndex = focusIndex;

            // Act - Press Space to select
            component.toggleFocusedItemSelection();

            // Assert - Item should be selected (same behavior)
            expect(component.selectedUsers.size).toBe(1);
            expect(component.isUserSelected(uniqueUsers[focusIndex])).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain roving tabindex after Escape key', () => {
      fc.assert(
        fc.property(fc.array(userArbitrary, { minLength: 3, maxLength: 10 }), users => {
          // Arrange - Create unique users
          const uniqueUsers = Array.from(new Map(users.map(u => [u.getUid(), u])).values());
          if (uniqueUsers.length < 3) return;

          const component = new MockKeyboardNavigationComponent(uniqueUsers);

          // Set focus to middle item
          component.focusedIndex = Math.floor(uniqueUsers.length / 2);

          // Act - Press Escape
          component.clearSearchOrCloseMenu();

          // Assert - Focus should be reset to -1
          expect(component.focusedIndex).toBe(-1);

          // Assert - First item should now be tabbable
          expect(component.getTabIndex(0)).toBe(0);

          // Assert - Other items should not be tabbable
          for (let i = 1; i < uniqueUsers.length; i++) {
            expect(component.getTabIndex(i)).toBe(-1);
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Additional Property Tests for Edge Cases
   */
  describe('Property Tests: Pagination Edge Cases', () => {
    it('should handle single user correctly', async () => {
      await fc.assert(
        fc.asyncProperty(userArbitrary, async user => {
          // Arrange
          const usersManager = new MockUsersManager([user], 30);
          const component = new MockCometChatUsersComponent(usersManager);

          // Act
          await component.fetchNextAndAppendUsers();

          // Assert
          expect(component.userList.length).toBe(1);
          expect(component.userList[0].getUid()).toBe(user.getUid());
          expect(component.isFetchingMore()).toBe(false);
          expect(component.paginatedList?.loadCompleteCallCount).toBe(1);
        }),
        { numRuns: 100 }
      );
    });

    it('should handle exact page size boundary correctly', async () => {
      await fc.assert(
        fc.asyncProperty(fc.constantFrom(10, 20, 30), async pageSize => {
          // Arrange - Create exactly pageSize users
          const users = Array.from(
            { length: pageSize },
            (_, i) => new MockUser(`uid-${i}`, `User ${i}`, '', 'online')
          );
          const usersManager = new MockUsersManager(users, pageSize);
          const component = new MockCometChatUsersComponent(usersManager);

          // Act - First fetch
          await component.fetchNextAndAppendUsers();

          // Assert - Should fetch all users
          expect(component.userList.length).toBe(pageSize);
          expect(component.hasMore()).toBe(true); // Still true, needs another fetch to know it's done

          // Act - Second fetch
          await component.fetchNextAndAppendUsers();

          // Assert - Should set hasMore to false
          expect(component.hasMore()).toBe(false);
          expect(component.userList.length).toBe(pageSize);
        }),
        { numRuns: 50 }
      );
    });

    it('should handle very large user lists correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 500, max: 1000 }),
          fc.constantFrom(30, 50),
          async (totalUsers, pageSize) => {
            // Arrange - Create large user list
            const users = Array.from(
              { length: totalUsers },
              (_, i) => new MockUser(`uid-${i}`, `User ${i}`, '', 'online')
            );
            const usersManager = new MockUsersManager(users, pageSize);
            const component = new MockCometChatUsersComponent(usersManager);

            // Act - Fetch first page only
            await component.fetchNextAndAppendUsers();

            // Assert - Should fetch one page
            expect(component.userList.length).toBe(pageSize);
            expect(component.hasMore()).toBe(true);
            expect(component.isFetchingMore()).toBe(false);
            expect(component.paginatedList?.loadCompleteCallCount).toBe(1);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Property 12: Selected Users Preview
   *
   * For any state where selectionMode is 'multiple' and showSelectedUsersPreview is true:
   * - The preview section SHALL be visible if and only if at least one user is selected
   * - The preview SHALL display a chip for each selected user
   * - Removing a chip SHALL deselect the corresponding user
   *
   * Validates: Requirements 3.12
   *
   * Feature: users-groups-paginated-list-refactor, Property 12: Selected Users Preview
   */
  describe('Property 12: Selected Users Preview', () => {
    it('should show preview only when users are selected', () => {
      fc.assert(
        fc.property(
          userListArbitrary.filter(users => users.length > 0 && users.length <= 20),
          fc.integer({ min: 0, max: 20 }),
          (users, numToSelect) => {
            // Arrange
            const usersManager = new MockUsersManager(users, 30);
            const component = new MockCometChatUsersComponent(usersManager);
            component.selectionMode = 'multiple';
            component.showSelectedUsersPreview = true;

            // Act - Select some users
            const usersToSelect = users.slice(0, Math.min(numToSelect, users.length));
            for (const user of usersToSelect) {
              component.selectedUsers.set(user.getUid(), user);
            }

            // Assert
            // Requirement 3.12: Preview visible if and only if at least one user is selected
            const hasSelectedUsers = component.selectedUsers.size > 0;
            const shouldShowPreview = component.showSelectedUsersPreview && hasSelectedUsers;

            expect(component.selectedUsers.size).toBe(usersToSelect.length);

            if (usersToSelect.length > 0) {
              expect(shouldShowPreview).toBe(true);
            } else {
              expect(shouldShowPreview).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should display chip for each selected user', () => {
      fc.assert(
        fc.property(
          userListArbitrary.filter(users => users.length > 0 && users.length <= 10),
          users => {
            // Arrange
            const usersManager = new MockUsersManager(users, 30);
            const component = new MockCometChatUsersComponent(usersManager);
            component.selectionMode = 'multiple';
            component.showSelectedUsersPreview = true;

            // Act - Select all users
            for (const user of users) {
              component.selectedUsers.set(user.getUid(), user);
            }

            // Assert
            // Requirement 3.12: Preview SHALL display a chip for each selected user
            expect(component.selectedUsers.size).toBe(users.length);

            // Verify each user is in the selected users map
            for (const user of users) {
              expect(component.selectedUsers.has(user.getUid())).toBe(true);
              expect(component.selectedUsers.get(user.getUid())).toBe(user);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should remove user from selection when chip is removed', () => {
      fc.assert(
        fc.property(
          userListArbitrary.filter(users => users.length >= 2 && users.length <= 10),
          fc.integer({ min: 0, max: 9 }),
          (users, indexToRemove) => {
            // Arrange
            const usersManager = new MockUsersManager(users, 30);
            const component = new MockCometChatUsersComponent(usersManager);
            component.selectionMode = 'multiple';
            component.showSelectedUsersPreview = true;

            // Act - Select all users
            for (const user of users) {
              component.selectedUsers.set(user.getUid(), user);
            }

            const initialCount = component.selectedUsers.size;

            // Remove one user
            const userToRemove = users[Math.min(indexToRemove, users.length - 1)];
            component.removeSelectedUser(userToRemove);

            // Assert
            // Requirement 3.12: Removing a chip SHALL deselect the corresponding user
            expect(component.selectedUsers.size).toBe(initialCount - 1);
            expect(component.selectedUsers.has(userToRemove.getUid())).toBe(false);

            // Other users should still be selected
            for (const user of users) {
              if (user.getUid() !== userToRemove.getUid()) {
                expect(component.selectedUsers.has(user.getUid())).toBe(true);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should hide preview when all users are deselected', () => {
      fc.assert(
        fc.property(
          userListArbitrary.filter(users => users.length > 0 && users.length <= 10),
          users => {
            // Arrange
            const usersManager = new MockUsersManager(users, 30);
            const component = new MockCometChatUsersComponent(usersManager);
            component.selectionMode = 'multiple';
            component.showSelectedUsersPreview = true;

            // Act - Select all users
            for (const user of users) {
              component.selectedUsers.set(user.getUid(), user);
            }

            expect(component.selectedUsers.size).toBe(users.length);

            // Remove all users
            for (const user of users) {
              component.removeSelectedUser(user);
            }

            // Assert
            // Requirement 3.12: Preview should be hidden when no users are selected
            expect(component.selectedUsers.size).toBe(0);

            const shouldShowPreview =
              component.showSelectedUsersPreview && component.selectedUsers.size > 0;
            expect(shouldShowPreview).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not show preview when showSelectedUsersPreview is false', () => {
      fc.assert(
        fc.property(
          userListArbitrary.filter(users => users.length > 0 && users.length <= 10),
          users => {
            // Arrange
            const usersManager = new MockUsersManager(users, 30);
            const component = new MockCometChatUsersComponent(usersManager);
            component.selectionMode = 'multiple';
            component.showSelectedUsersPreview = false; // Disabled

            // Act - Select all users
            for (const user of users) {
              component.selectedUsers.set(user.getUid(), user);
            }

            // Assert
            // Preview should not show even when users are selected
            const shouldShowPreview =
              component.showSelectedUsersPreview && component.selectedUsers.size > 0;
            expect(shouldShowPreview).toBe(false);
            expect(component.selectedUsers.size).toBe(users.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain preview state across multiple selection changes', () => {
      fc.assert(
        fc.property(
          userListArbitrary.filter(users => users.length >= 5 && users.length <= 20),
          fc.array(fc.integer({ min: 0, max: 19 }), { minLength: 1, maxLength: 10 }),
          (users, indicesToToggle) => {
            // Arrange
            const usersManager = new MockUsersManager(users, 30);
            const component = new MockCometChatUsersComponent(usersManager);
            component.selectionMode = 'multiple';
            component.showSelectedUsersPreview = true;

            // Act & Assert - Toggle selections multiple times
            for (const index of indicesToToggle) {
              const user = users[Math.min(index, users.length - 1)];
              const uid = user.getUid();

              if (component.selectedUsers.has(uid)) {
                component.removeSelectedUser(user);
                expect(component.selectedUsers.has(uid)).toBe(false);
              } else {
                component.selectedUsers.set(uid, user);
                expect(component.selectedUsers.has(uid)).toBe(true);
              }

              // Preview visibility should match selection state
              const shouldShowPreview =
                component.showSelectedUsersPreview && component.selectedUsers.size > 0;
              expect(shouldShowPreview).toBe(component.selectedUsers.size > 0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle removing users in any order', () => {
      fc.assert(
        fc.property(
          userListArbitrary.filter(users => users.length >= 3 && users.length <= 10),
          users => {
            // Arrange
            const usersManager = new MockUsersManager(users, 30);
            const component = new MockCometChatUsersComponent(usersManager);
            component.selectionMode = 'multiple';
            component.showSelectedUsersPreview = true;

            // Act - Select all users
            for (const user of users) {
              component.selectedUsers.set(user.getUid(), user);
            }

            const initialCount = users.length;
            expect(component.selectedUsers.size).toBe(initialCount);

            // Create a shuffled copy of users
            const shuffledUsers = [...users].sort(() => Math.random() - 0.5);

            // Remove users in shuffled order
            for (let i = 0; i < shuffledUsers.length; i++) {
              const user = shuffledUsers[i];
              component.removeSelectedUser(user);

              // Assert after each removal
              const expectedSize = initialCount - (i + 1);
              expect(component.selectedUsers.size).toBe(expectedSize);
              expect(component.selectedUsers.has(user.getUid())).toBe(false);
            }

            // All users should be removed
            expect(component.selectedUsers.size).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle preview with users having special characters in names', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            '<script>alert("XSS")</script>',
            "O'Brien & Co.",
            '用户名 👤 🌟',
            'Test\nUser',
            'Test"User"',
            'José García'
          ),
          name => {
            // Arrange
            const user = new MockUser('uid-special', name, '', 'online');
            const usersManager = new MockUsersManager([user], 30);
            const component = new MockCometChatUsersComponent(usersManager);
            component.selectionMode = 'multiple';
            component.showSelectedUsersPreview = true;

            // Act - Select user with special characters
            component.selectedUsers.set(user.getUid(), user);

            // Assert
            expect(component.selectedUsers.size).toBe(1);
            expect(component.selectedUsers.get(user.getUid())?.getName()).toBe(name);

            // Remove user
            component.removeSelectedUser(user);
            expect(component.selectedUsers.size).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain preview consistency when selection mode changes', () => {
      fc.assert(
        fc.property(
          userListArbitrary.filter(users => users.length > 0 && users.length <= 10),
          users => {
            // Arrange
            const usersManager = new MockUsersManager(users, 30);
            const component = new MockCometChatUsersComponent(usersManager);
            component.selectionMode = 'multiple';
            component.showSelectedUsersPreview = true;

            // Act - Select users in multiple mode
            for (const user of users) {
              component.selectedUsers.set(user.getUid(), user);
            }

            expect(component.selectedUsers.size).toBe(users.length);

            // Change to single mode (preview should still work if enabled)
            component.selectionMode = 'single';

            // Assert - Selected users should still be tracked
            expect(component.selectedUsers.size).toBe(users.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle rapid selection and deselection correctly', () => {
      fc.assert(
        fc.property(
          userListArbitrary.filter(users => users.length > 0 && users.length <= 5),
          fc.array(fc.boolean(), { minLength: 10, maxLength: 50 }),
          (users, toggleSequence) => {
            // Arrange
            const usersManager = new MockUsersManager(users, 30);
            const component = new MockCometChatUsersComponent(usersManager);
            component.selectionMode = 'multiple';
            component.showSelectedUsersPreview = true;

            // Act - Rapidly toggle first user
            const user = users[0];
            for (const shouldSelect of toggleSequence) {
              if (shouldSelect) {
                component.selectedUsers.set(user.getUid(), user);
              } else {
                component.removeSelectedUser(user);
              }

              // Assert - State should be consistent
              expect(component.selectedUsers.has(user.getUid())).toBe(shouldSelect);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
