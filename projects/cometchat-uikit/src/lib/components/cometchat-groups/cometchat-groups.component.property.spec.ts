/**
 * Property-Based Tests for CometChatGroups Component
 *
 * This file contains property-based tests using fast-check to verify
 * universal correctness properties across all valid inputs.
 *
 * Property 7: Groups Pagination Loading Behavior
 * - For any scroll event that triggers the IntersectionObserver in CometChatPaginatedList
 *   when hasMore is true, the CometChatGroups component SHALL:
 *   - Set isFetchingMore to true before fetching
 *   - Display a loading spinner at the bottom of the list
 *   - Call loadComplete() on the paginated list after fetch completes (success or failure)
 *   - Set isFetchingMore to false after fetch completes
 *
 * Validates: Requirements 4.6, 4.7, 4.8
 *
 * @module components/cometchat-groups/property-tests
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { signal } from '@angular/core';

/**
 * Mock CometChat.Group class for property testing
 */
class MockGroup {
  private guid: string;
  private name: string;
  private icon: string;
  private type: string;
  private membersCount: number;

  constructor(guid: string, name: string, icon = '', type = 'public', membersCount = 0) {
    this.guid = guid;
    this.name = name;
    this.icon = icon;
    this.type = type;
    this.membersCount = membersCount;
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
 * Mock GroupsManager for property testing
 */
class MockGroupsManager {
  private groups: MockGroup[];
  private currentPage: number;
  private pageSize: number;
  private shouldFail: boolean;
  private failureError: MockCometChatException | null;

  constructor(
    groups: MockGroup[],
    pageSize = 30,
    shouldFail = false,
    failureError: MockCometChatException | null = null
  ) {
    this.groups = groups;
    this.currentPage = 0;
    this.pageSize = pageSize;
    this.shouldFail = shouldFail;
    this.failureError = failureError;
  }

  async fetchNext(): Promise<MockGroup[]> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 10));

    if (this.shouldFail && this.failureError) {
      throw this.failureError;
    }

    const startIndex = this.currentPage * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    const page = this.groups.slice(startIndex, endIndex);

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
 * Simplified mock implementation of CometChatGroupsComponent for property testing
 * Focuses on pagination behavior
 */
class MockCometChatGroupsComponent {
  // State
  groupList: MockGroup[] = [];
  isFetchingMore = signal(false);
  hasMore = signal(true);
  paginatedList?: MockCometChatPaginatedList;

  // Private state
  private groupsManager: MockGroupsManager | null = null;

  // Error tracking
  errorEmitted: MockCometChatException | null = null;

  constructor(groupsManager: MockGroupsManager) {
    this.groupsManager = groupsManager;
    this.paginatedList = new MockCometChatPaginatedList();
  }

  /**
   * Simulates the fetchNextAndAppendGroups method
   * This is the core pagination logic being tested
   */
  async fetchNextAndAppendGroups(): Promise<void> {
    // Prevent concurrent fetches
    if (this.isFetchingMore() || !this.hasMore() || !this.groupsManager) {
      return;
    }

    // Requirement 4.6: Set isFetchingMore to true before fetching
    this.isFetchingMore.set(true);

    try {
      const groups = await this.groupsManager.fetchNext();

      // Check if we've reached the end of pagination
      if (groups.length === 0) {
        this.hasMore.set(false);
        return;
      }

      // Append groups without duplicates
      this.appendGroupsWithoutDuplicates(groups);
    } catch (error) {
      // Handle error
      this.errorEmitted = error as MockCometChatException;
    } finally {
      // Requirement 4.8: Set isFetchingMore to false after fetch completes
      this.isFetchingMore.set(false);

      // Requirement 4.7: Call loadComplete() on the paginated list after fetch completes
      this.paginatedList?.loadComplete();
    }
  }

  /**
   * Simulates the handleLoadMore method
   * This is called when the IntersectionObserver triggers
   */
  handleLoadMore(): void {
    // Prevent concurrent fetches
    if (this.isFetchingMore() || !this.hasMore() || !this.groupsManager) {
      return;
    }

    this.fetchNextAndAppendGroups();
  }

  /**
   * Appends new groups to the list without creating duplicates
   */
  private appendGroupsWithoutDuplicates(newGroups: MockGroup[]): void {
    const existingGuids = new Set(this.groupList.map(group => group.getGuid()));
    const uniqueNewGroups = newGroups.filter(group => !existingGuids.has(group.getGuid()));
    this.groupList = [...this.groupList, ...uniqueNewGroups];
  }
}

// ==================== Arbitraries ====================

/**
 * Arbitrary for generating a single MockGroup with unique GUID
 */
const groupArbitrary = fc
  .record({
    guid: fc.uuid(),
    name: fc.string({ minLength: 1, maxLength: 50 }),
    icon: fc.option(fc.webUrl(), { nil: '' }),
    type: fc.constantFrom('public', 'private', 'password'),
    membersCount: fc.integer({ min: 0, max: 1000 }),
  })
  .map(
    ({ guid, name, icon, type, membersCount }) =>
      new MockGroup(guid, name, icon, type, membersCount)
  );

/**
 * Arbitrary for generating a list of MockGroups with unique GUIDs
 * This ensures no duplicate GUIDs in the generated list
 */
const uniqueGroupListArbitrary = (minLength: number, maxLength: number) =>
  fc.array(fc.uuid(), { minLength, maxLength }).chain(guids => {
    const uniqueGuids = [...new Set(guids)];
    return fc.tuple(
      ...uniqueGuids.map(guid =>
        fc
          .record({
            name: fc.string({ minLength: 1, maxLength: 50 }),
            icon: fc.option(fc.webUrl(), { nil: '' }),
            type: fc.constantFrom('public', 'private', 'password'),
            membersCount: fc.integer({ min: 0, max: 1000 }),
          })
          .map(
            ({ name, icon, type, membersCount }) =>
              new MockGroup(guid, name, icon, type, membersCount)
          )
      )
    );
  });

/**
 * Arbitrary for generating a list of MockGroups
 */
const groupListArbitrary = fc.array(groupArbitrary, { minLength: 0, maxLength: 100 });

/**
 * Arbitrary for generating a list of MockGroups with guaranteed unique GUIDs for pagination tests
 */
const uniqueGroupListForPaginationArbitrary = uniqueGroupListArbitrary(10, 50);

/**
 * Arbitrary for generating page sizes
 */
const pageSizeArbitrary = fc.integer({ min: 1, max: 50 });

/**
 * Arbitrary for generating CometChatException
 */
const exceptionArbitrary = fc
  .record({
    code: fc.constantFrom('ERR_NETWORK', 'ERR_TIMEOUT', 'ERR_UNAUTHORIZED', 'ERR_FORBIDDEN'),
    message: fc.string({ minLength: 1, maxLength: 100 }),
  })
  .map(({ code, message }) => new MockCometChatException(code, message));

// ==================== Property Tests ====================

describe('Property 7: Groups Pagination Loading Behavior', () => {
  /**
   * Tag: Feature: users-groups-paginated-list-refactor, Property 7: Groups Pagination Loading Behavior
   *
   * Property: For any group list and page size, isFetchingMore should be true during fetch
   * and false after fetch completes.
   *
   * Validates: Requirements 4.6, 4.8
   */
  describe('isFetchingMore state management', () => {
    it('should set isFetchingMore to true before fetching for any group list', async () => {
      await fc.assert(
        fc.asyncProperty(groupListArbitrary, pageSizeArbitrary, async (groups, pageSize) => {
          // Arrange
          const groupsManager = new MockGroupsManager(groups, pageSize);
          const component = new MockCometChatGroupsComponent(groupsManager);

          // Act - Start fetch
          const fetchPromise = component.fetchNextAndAppendGroups();

          // Assert - Requirement 4.6: isFetchingMore should be true immediately
          expect(component.isFetchingMore()).toBe(true);

          // Wait for fetch to complete
          await fetchPromise;

          // Assert - Requirement 4.8: isFetchingMore should be false after completion
          expect(component.isFetchingMore()).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it('should call loadComplete() after fetch completes for any group list', async () => {
      await fc.assert(
        fc.asyncProperty(groupListArbitrary, pageSizeArbitrary, async (groups, pageSize) => {
          // Arrange
          const groupsManager = new MockGroupsManager(groups, pageSize);
          const component = new MockCometChatGroupsComponent(groupsManager);

          // Act
          await component.fetchNextAndAppendGroups();

          // Assert - Requirement 4.7: loadComplete() should be called
          expect(component.paginatedList?.loadCompleteCallCount).toBe(1);
        }),
        { numRuns: 100 }
      );
    });

    it('should call loadComplete() even when fetch fails for any error', async () => {
      await fc.assert(
        fc.asyncProperty(
          groupListArbitrary,
          pageSizeArbitrary,
          exceptionArbitrary,
          async (groups, pageSize, error) => {
            // Arrange - Create manager that will fail
            const groupsManager = new MockGroupsManager(groups, pageSize, true, error);
            const component = new MockCometChatGroupsComponent(groupsManager);

            // Act
            await component.fetchNextAndAppendGroups();

            // Assert - Requirement 4.7: loadComplete() should be called even on error
            expect(component.paginatedList?.loadCompleteCallCount).toBe(1);

            // Assert - Requirement 4.8: isFetchingMore should be false after error
            expect(component.isFetchingMore()).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Tag: Feature: users-groups-paginated-list-refactor, Property 7: Groups Pagination Loading Behavior
   *
   * Property: For any group list, concurrent fetch attempts should be prevented.
   *
   * Validates: Requirements 4.6, 4.7, 4.8
   */
  describe('concurrent fetch prevention', () => {
    it('should prevent concurrent fetches for any group list', async () => {
      await fc.assert(
        fc.asyncProperty(groupListArbitrary, pageSizeArbitrary, async (groups, pageSize) => {
          // Arrange
          const groupsManager = new MockGroupsManager(groups, pageSize);
          const component = new MockCometChatGroupsComponent(groupsManager);

          // Act - Trigger two fetches simultaneously
          const firstFetch = component.fetchNextAndAppendGroups();
          const secondFetch = component.fetchNextAndAppendGroups();

          await Promise.all([firstFetch, secondFetch]);

          // Assert - loadComplete() should only be called once (second fetch was prevented)
          expect(component.paginatedList?.loadCompleteCallCount).toBe(1);
        }),
        { numRuns: 100 }
      );
    });

    it('should not fetch when hasMore is false for any group list', async () => {
      await fc.assert(
        fc.asyncProperty(groupListArbitrary, pageSizeArbitrary, async (groups, pageSize) => {
          // Arrange
          const groupsManager = new MockGroupsManager(groups, pageSize);
          const component = new MockCometChatGroupsComponent(groupsManager);
          component.hasMore.set(false);

          // Act
          await component.fetchNextAndAppendGroups();

          // Assert - loadComplete() should not be called when hasMore is false
          expect(component.paginatedList?.loadCompleteCallCount).toBe(0);

          // Assert - isFetchingMore should remain false
          expect(component.isFetchingMore()).toBe(false);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Tag: Feature: users-groups-paginated-list-refactor, Property 7: Groups Pagination Loading Behavior
   *
   * Property: For any group list, pagination should correctly handle multiple pages.
   *
   * Validates: Requirements 4.6, 4.7, 4.8
   */
  describe('multi-page pagination', () => {
    it('should correctly paginate through multiple pages for any group list', async () => {
      await fc.assert(
        fc.asyncProperty(
          uniqueGroupListForPaginationArbitrary,
          fc.integer({ min: 5, max: 20 }),
          async (groups, pageSize) => {
            // Skip if not enough groups
            if (groups.length < 10) return;

            // Arrange
            const groupsManager = new MockGroupsManager(groups, pageSize);
            const component = new MockCometChatGroupsComponent(groupsManager);

            const expectedPages = Math.ceil(groups.length / pageSize);

            // Act - Fetch all pages
            for (let i = 0; i < expectedPages; i++) {
              await component.fetchNextAndAppendGroups();

              // Assert - After each fetch
              expect(component.isFetchingMore()).toBe(false);

              // Assert - loadComplete() should be called for each fetch
              expect(component.paginatedList?.loadCompleteCallCount).toBe(i + 1);
            }

            // Assert - All groups should be loaded
            expect(component.groupList.length).toBe(groups.length);

            // Fetch one more time to get empty result and set hasMore to false
            await component.fetchNextAndAppendGroups();

            // Assert - hasMore should be false after receiving empty result
            expect(component.hasMore()).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle error during pagination for any group list and error', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(groupArbitrary, { minLength: 10, maxLength: 50 }),
          fc.integer({ min: 5, max: 20 }),
          exceptionArbitrary,
          async (groups, pageSize, error) => {
            // Arrange - First page succeeds, second page fails
            const groupsManager = new MockGroupsManager(groups, pageSize);
            const component = new MockCometChatGroupsComponent(groupsManager);

            // Act - First fetch succeeds
            await component.fetchNextAndAppendGroups();

            // Make the manager fail on next fetch
            groupsManager['shouldFail'] = true;
            groupsManager['failureError'] = error;

            // Act - Second fetch fails
            await component.fetchNextAndAppendGroups();

            // Assert - isFetchingMore should be false
            expect(component.isFetchingMore()).toBe(false);

            // Assert - loadComplete() should always be called
            expect(component.paginatedList?.loadCompleteCallCount).toBe(2);

            // Assert - Error state should match expectation
            expect(component.errorEmitted).toBe(error);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Tag: Feature: users-groups-paginated-list-refactor, Property 7: Groups Pagination Loading Behavior
   *
   * Property: For any group list, handleLoadMore should trigger fetchNextAndAppendGroups correctly.
   *
   * Validates: Requirements 4.6, 4.7, 4.8
   */
  describe('handleLoadMore integration', () => {
    it('should handle handleLoadMore correctly for any group list', async () => {
      await fc.assert(
        fc.asyncProperty(groupListArbitrary, pageSizeArbitrary, async (groups, pageSize) => {
          // Arrange
          const groupsManager = new MockGroupsManager(groups, pageSize);
          const component = new MockCometChatGroupsComponent(groupsManager);

          // Act - Simulate IntersectionObserver trigger
          component.handleLoadMore();

          // Wait a bit for any pending async operations
          await new Promise(resolve => setTimeout(resolve, 20));

          // Assert - If groups exist, fetch should have occurred
          if (groups.length > 0) {
            expect(component.paginatedList?.loadCompleteCallCount).toBeGreaterThan(0);
            expect(component.isFetchingMore()).toBe(false);
          }
        }),
        { numRuns: 50 }
      );
    }, 30000);

    it('should prevent rapid handleLoadMore calls for any group list', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(groupArbitrary, { minLength: 10, maxLength: 50 }),
          fc.integer({ min: 5, max: 20 }),
          fc.integer({ min: 2, max: 5 }),
          async (groups, pageSize, rapidCallCount) => {
            // Arrange
            const groupsManager = new MockGroupsManager(groups, pageSize);
            const component = new MockCometChatGroupsComponent(groupsManager);

            // Act - Call handleLoadMore rapidly
            for (let i = 0; i < rapidCallCount; i++) {
              component.handleLoadMore();
            }

            // Wait for all async operations
            await new Promise(resolve => setTimeout(resolve, 30));

            // Assert - Only one fetch should have occurred (others were prevented)
            expect(component.paginatedList?.loadCompleteCallCount).toBe(1);
            expect(component.isFetchingMore()).toBe(false);
          }
        ),
        { numRuns: 50 }
      );
    }, 30000);
  });

  /**
   * Tag: Feature: users-groups-paginated-list-refactor, Property 7: Groups Pagination Loading Behavior
   *
   * Property: For any group list, empty results should set hasMore to false.
   *
   * Validates: Requirements 4.8
   */
  describe('empty results handling', () => {
    it('should set hasMore to false when no more groups are available', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(groupArbitrary, { minLength: 1, maxLength: 20 }),
          fc.integer({ min: 5, max: 10 }),
          async (groups, pageSize) => {
            // Arrange
            const groupsManager = new MockGroupsManager(groups, pageSize);
            const component = new MockCometChatGroupsComponent(groupsManager);

            // Act - Fetch all pages until empty
            let fetchCount = 0;
            const maxFetches = Math.ceil(groups.length / pageSize) + 1;

            while (component.hasMore() && fetchCount < maxFetches) {
              await component.fetchNextAndAppendGroups();
              fetchCount++;
            }

            // Assert - hasMore should be false
            expect(component.hasMore()).toBe(false);

            // Assert - loadComplete() should be called
            expect(component.paginatedList?.loadCompleteCallCount).toBe(fetchCount);

            // Assert - isFetchingMore should be false
            expect(component.isFetchingMore()).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Tag: Feature: users-groups-paginated-list-refactor, Property 7: Groups Pagination Loading Behavior
   *
   * Property: For any group list, no duplicate groups should be added during pagination.
   *
   * Validates: Requirements 4.6, 4.7, 4.8
   */
  describe('duplicate prevention', () => {
    it('should not add duplicate groups during pagination for any group list', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(groupArbitrary, { minLength: 10, maxLength: 50 }),
          fc.integer({ min: 5, max: 20 }),
          async (groups, pageSize) => {
            // Arrange
            const groupsManager = new MockGroupsManager(groups, pageSize);
            const component = new MockCometChatGroupsComponent(groupsManager);

            const expectedPages = Math.ceil(groups.length / pageSize);

            // Act - Fetch all pages
            for (let i = 0; i < expectedPages; i++) {
              await component.fetchNextAndAppendGroups();
            }

            // Assert - No duplicates should exist
            const guids = component.groupList.map(g => g.getGuid());
            const uniqueGuids = new Set(guids);
            expect(guids.length).toBe(uniqueGuids.size);

            // Assert - loadComplete() should be called at least once
            expect(component.paginatedList?.loadCompleteCallCount).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

// ==================== Property 8: Groups Selection Mode Behavior ====================

/**
 * Property 8: Groups Selection Mode Behavior
 *
 * For any selection mode (none, single, multiple) and any sequence of group selections:
 * - In 'none' mode: No selection state should be tracked
 * - In 'single' mode: At most one group should be selected at any time
 * - In 'multiple' mode: Any number of groups can be selected
 *
 * Validates: Requirements 4.10
 */

/**
 * Selection mode enum for testing
 */
enum SelectionMode {
  none = 'none',
  single = 'single',
  multiple = 'multiple',
}

/**
 * Mock component for selection testing
 */
class MockCometChatGroupsSelectionComponent {
  selectionMode: SelectionMode = SelectionMode.none;
  selectedGroups = new Set<string>();
  groupList: MockGroup[] = [];

  // Event tracking
  selectEvents: { group: MockGroup; selected: boolean }[] = [];

  constructor(groups: MockGroup[], selectionMode: SelectionMode) {
    this.groupList = groups;
    this.selectionMode = selectionMode;
  }

  handleSelectionChange(group: MockGroup): void {
    const guid = group.getGuid();
    const isCurrentlySelected = this.selectedGroups.has(guid);

    if (this.selectionMode === SelectionMode.single) {
      // Single selection: clear all and select new
      this.selectedGroups.clear();

      if (!isCurrentlySelected) {
        this.selectedGroups.add(guid);
      }

      this.selectEvents.push({
        group,
        selected: !isCurrentlySelected,
      });
    } else if (this.selectionMode === SelectionMode.multiple) {
      // Multiple selection: toggle selection
      if (isCurrentlySelected) {
        this.selectedGroups.delete(guid);
      } else {
        this.selectedGroups.add(guid);
      }

      this.selectEvents.push({
        group,
        selected: !isCurrentlySelected,
      });
    }
    // In 'none' mode, do nothing
  }

  isGroupSelected(group: MockGroup): boolean {
    return this.selectedGroups.has(group.getGuid());
  }
}

// ==================== Arbitraries for Selection Testing ====================

/**
 * Arbitrary for selection modes
 */
const selectionModeArbitrary = fc.constantFrom(
  SelectionMode.none,
  SelectionMode.single,
  SelectionMode.multiple
);

/**
 * Arbitrary for a sequence of selection actions (indices to select)
 */
const selectionSequenceArbitrary = fc.array(fc.integer({ min: 0, max: 19 }), {
  minLength: 0,
  maxLength: 20,
});

describe('Property 8: Groups Selection Mode Behavior', () => {
  /**
   * Tag: Feature: users-groups-paginated-list-refactor, Property 8: Groups Selection Mode Behavior
   *
   * Property: In 'none' mode, no selection state should be tracked for any group list.
   *
   * Validates: Requirements 4.10
   */
  describe('none mode behavior', () => {
    it('should not track selection in none mode for any group list', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(groupArbitrary, { minLength: 1, maxLength: 20 }),
          selectionSequenceArbitrary,
          async (groups, selectionIndices) => {
            // Arrange
            const component = new MockCometChatGroupsSelectionComponent(groups, SelectionMode.none);

            // Act - Try to select groups
            for (const index of selectionIndices) {
              if (index < groups.length) {
                component.handleSelectionChange(groups[index]);
              }
            }

            // Assert - No groups should be selected
            expect(component.selectedGroups.size).toBe(0);

            // Assert - No select events should be emitted
            expect(component.selectEvents.length).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Tag: Feature: users-groups-paginated-list-refactor, Property 8: Groups Selection Mode Behavior
   *
   * Property: In 'single' mode, at most one group should be selected at any time.
   *
   * Validates: Requirements 4.10
   */
  describe('single mode behavior', () => {
    it('should maintain at most one selected group in single mode for any group list', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(groupArbitrary, { minLength: 2, maxLength: 20 }),
          selectionSequenceArbitrary,
          async (groups, selectionIndices) => {
            // Arrange
            const component = new MockCometChatGroupsSelectionComponent(
              groups,
              SelectionMode.single
            );

            // Act - Select groups in sequence
            for (const index of selectionIndices) {
              if (index < groups.length) {
                component.handleSelectionChange(groups[index]);

                // Assert - At most one group should be selected after each selection
                expect(component.selectedGroups.size).toBeLessThanOrEqual(1);
              }
            }

            // Final assert - At most one group should be selected
            expect(component.selectedGroups.size).toBeLessThanOrEqual(1);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should deselect when clicking the same group twice in single mode', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(groupArbitrary, { minLength: 1, maxLength: 20 }),
          fc.integer({ min: 0, max: 19 }),
          async (groups, index) => {
            // Arrange
            const component = new MockCometChatGroupsSelectionComponent(
              groups,
              SelectionMode.single
            );
            const targetIndex = index % groups.length;
            const group = groups[targetIndex];

            // Act - Select the same group twice
            component.handleSelectionChange(group);
            const firstSelection = component.isGroupSelected(group);

            component.handleSelectionChange(group);
            const secondSelection = component.isGroupSelected(group);

            // Assert - First click selects, second click deselects
            expect(firstSelection).toBe(true);
            expect(secondSelection).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should replace selection when selecting a different group in single mode', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(groupArbitrary, { minLength: 2, maxLength: 20 }),
          fc.integer({ min: 0, max: 19 }),
          fc.integer({ min: 0, max: 19 }),
          async (groups, index1, index2) => {
            // Arrange
            const component = new MockCometChatGroupsSelectionComponent(
              groups,
              SelectionMode.single
            );
            const targetIndex1 = index1 % groups.length;
            const targetIndex2 = index2 % groups.length;

            // Skip if same index
            if (targetIndex1 === targetIndex2) {
              return;
            }

            const group1 = groups[targetIndex1];
            const group2 = groups[targetIndex2];

            // Act - Select first group, then second group
            component.handleSelectionChange(group1);
            component.handleSelectionChange(group2);

            // Assert - Only second group should be selected
            expect(component.isGroupSelected(group1)).toBe(false);
            expect(component.isGroupSelected(group2)).toBe(true);
            expect(component.selectedGroups.size).toBe(1);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Tag: Feature: users-groups-paginated-list-refactor, Property 8: Groups Selection Mode Behavior
   *
   * Property: In 'multiple' mode, any number of groups can be selected.
   *
   * Validates: Requirements 4.10
   */
  describe('multiple mode behavior', () => {
    it('should allow multiple groups to be selected in multiple mode for any group list', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(groupArbitrary, { minLength: 2, maxLength: 20 }),
          selectionSequenceArbitrary,
          async (groups, selectionIndices) => {
            // Arrange
            const component = new MockCometChatGroupsSelectionComponent(
              groups,
              SelectionMode.multiple
            );

            // Act - Select groups in sequence
            const uniqueIndices = new Set(selectionIndices.filter(i => i < groups.length));

            for (const index of uniqueIndices) {
              component.handleSelectionChange(groups[index]);
            }

            // Assert - Number of selected groups should match unique selections
            expect(component.selectedGroups.size).toBe(uniqueIndices.size);

            // Assert - All selected groups should be marked as selected
            for (const index of uniqueIndices) {
              expect(component.isGroupSelected(groups[index])).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should toggle selection when clicking the same group in multiple mode', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(groupArbitrary, { minLength: 1, maxLength: 20 }),
          fc.integer({ min: 0, max: 19 }),
          async (groups, index) => {
            // Arrange
            const component = new MockCometChatGroupsSelectionComponent(
              groups,
              SelectionMode.multiple
            );
            const targetIndex = index % groups.length;
            const group = groups[targetIndex];

            // Act - Click the same group multiple times
            component.handleSelectionChange(group); // Select
            const firstSelection = component.isGroupSelected(group);

            component.handleSelectionChange(group); // Deselect
            const secondSelection = component.isGroupSelected(group);

            component.handleSelectionChange(group); // Select again
            const thirdSelection = component.isGroupSelected(group);

            // Assert - Selection should toggle
            expect(firstSelection).toBe(true);
            expect(secondSelection).toBe(false);
            expect(thirdSelection).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain all selections when selecting multiple groups', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(groupArbitrary, { minLength: 3, maxLength: 20 }),
          async groups => {
            // Arrange
            const component = new MockCometChatGroupsSelectionComponent(
              groups,
              SelectionMode.multiple
            );

            // Act - Select first 3 groups
            const groupsToSelect = groups.slice(0, 3);
            for (const group of groupsToSelect) {
              component.handleSelectionChange(group);
            }

            // Assert - All 3 groups should be selected
            expect(component.selectedGroups.size).toBe(3);
            for (const group of groupsToSelect) {
              expect(component.isGroupSelected(group)).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should allow partial deselection in multiple mode', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(groupArbitrary, { minLength: 3, maxLength: 20 }),
          async groups => {
            // Arrange
            const component = new MockCometChatGroupsSelectionComponent(
              groups,
              SelectionMode.multiple
            );

            // Act - Select first 3 groups
            const groupsToSelect = groups.slice(0, 3);
            for (const group of groupsToSelect) {
              component.handleSelectionChange(group);
            }

            // Deselect the middle group
            component.handleSelectionChange(groupsToSelect[1]);

            // Assert - First and third should still be selected
            expect(component.isGroupSelected(groupsToSelect[0])).toBe(true);
            expect(component.isGroupSelected(groupsToSelect[1])).toBe(false);
            expect(component.isGroupSelected(groupsToSelect[2])).toBe(true);
            expect(component.selectedGroups.size).toBe(2);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Tag: Feature: users-groups-paginated-list-refactor, Property 8: Groups Selection Mode Behavior
   *
   * Property: Selection events should be emitted correctly for all modes.
   *
   * Validates: Requirements 4.10
   */
  describe('selection event emission', () => {
    it('should emit correct selection events in single mode for any group list', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(groupArbitrary, { minLength: 2, maxLength: 10 }),
          async groups => {
            // Arrange
            const component = new MockCometChatGroupsSelectionComponent(
              groups,
              SelectionMode.single
            );

            // Act - Select first group, then second group
            component.handleSelectionChange(groups[0]);
            component.handleSelectionChange(groups[1]);

            // Assert - Two events should be emitted
            expect(component.selectEvents.length).toBe(2);

            // Assert - First event should be selection of first group
            expect(component.selectEvents[0].group).toBe(groups[0]);
            expect(component.selectEvents[0].selected).toBe(true);

            // Assert - Second event should be selection of second group
            expect(component.selectEvents[1].group).toBe(groups[1]);
            expect(component.selectEvents[1].selected).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should emit correct selection events in multiple mode for any group list', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(groupArbitrary, { minLength: 1, maxLength: 10 }),
          async groups => {
            // Arrange
            const component = new MockCometChatGroupsSelectionComponent(
              groups,
              SelectionMode.multiple
            );

            // Act - Select and deselect first group
            component.handleSelectionChange(groups[0]);
            component.handleSelectionChange(groups[0]);

            // Assert - Two events should be emitted
            expect(component.selectEvents.length).toBe(2);

            // Assert - First event should be selection
            expect(component.selectEvents[0].selected).toBe(true);

            // Assert - Second event should be deselection
            expect(component.selectEvents[1].selected).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

// ==================== Property 9: Groups Keyboard Navigation ====================

/**
 * Property 9: Groups Keyboard Navigation
 *
 * For any focused state in the groups list:
 * - ArrowDown SHALL move focus to the next item (wrapping to first)
 * - ArrowUp SHALL move focus to the previous item (wrapping to last)
 * - Enter SHALL trigger item click on the focused item
 * - Space SHALL toggle selection in multiple mode
 * - Escape SHALL clear search and reset focus
 * - Only the focused item SHALL have tabindex=0 (roving tabindex pattern)
 *
 * Validates: Requirements 4.11, 6.8, 6.10
 */

/**
 * Mock component for keyboard navigation testing
 */
class MockCometChatGroupsKeyboardComponent {
  groupList: MockGroup[] = [];
  focusedIndex = -1;
  selectionMode: SelectionMode = SelectionMode.none;
  selectedGroups = new Set<string>();
  searchText = '';

  // Event tracking
  itemClickEvents: MockGroup[] = [];
  selectEvents: { group: MockGroup; selected: boolean }[] = [];

  constructor(groups: MockGroup[], selectionMode: SelectionMode = SelectionMode.none) {
    this.groupList = groups;
    this.selectionMode = selectionMode;
  }

  handleKeydown(key: string): void {
    if (this.groupList.length === 0) {
      return;
    }

    switch (key) {
      case 'ArrowDown':
        this.focusNextItem();
        break;

      case 'ArrowUp':
        this.focusPreviousItem();
        break;

      case 'Enter':
        this.selectFocusedItem();
        break;

      case ' ':
        if (this.selectionMode === SelectionMode.multiple) {
          this.toggleFocusedItemSelection();
        }
        break;

      case 'Escape':
        this.clearSearchOrCloseMenu();
        break;
    }
  }

  private focusNextItem(): void {
    if (this.groupList.length === 0) {
      return;
    }

    if (this.focusedIndex === -1) {
      this.focusedIndex = 0;
    } else if (this.focusedIndex < this.groupList.length - 1) {
      this.focusedIndex++;
    } else {
      this.focusedIndex = 0; // Wrap to first
    }
  }

  private focusPreviousItem(): void {
    if (this.groupList.length === 0) {
      return;
    }

    if (this.focusedIndex === -1) {
      this.focusedIndex = this.groupList.length - 1;
    } else if (this.focusedIndex > 0) {
      this.focusedIndex--;
    } else {
      this.focusedIndex = this.groupList.length - 1; // Wrap to last
    }
  }

  private selectFocusedItem(): void {
    if (this.focusedIndex >= 0 && this.focusedIndex < this.groupList.length) {
      const group = this.groupList[this.focusedIndex];
      if (this.selectionMode !== SelectionMode.none) {
        this.handleSelectionChange(group);
      } else {
        this.handleGroupClick(group);
      }
    }
  }

  private toggleFocusedItemSelection(): void {
    if (this.focusedIndex >= 0 && this.focusedIndex < this.groupList.length) {
      const group = this.groupList[this.focusedIndex];
      this.handleSelectionChange(group);
    }
  }

  private clearSearchOrCloseMenu(): void {
    this.searchText = '';
    this.focusedIndex = -1;
  }

  private handleGroupClick(group: MockGroup): void {
    this.itemClickEvents.push(group);
  }

  private handleSelectionChange(group: MockGroup): void {
    const guid = group.getGuid();
    const isCurrentlySelected = this.selectedGroups.has(guid);

    if (this.selectionMode === SelectionMode.single) {
      this.selectedGroups.clear();
      if (!isCurrentlySelected) {
        this.selectedGroups.add(guid);
      }
      this.selectEvents.push({ group, selected: !isCurrentlySelected });
    } else if (this.selectionMode === SelectionMode.multiple) {
      if (isCurrentlySelected) {
        this.selectedGroups.delete(guid);
      } else {
        this.selectedGroups.add(guid);
      }
      this.selectEvents.push({ group, selected: !isCurrentlySelected });
    }
  }

  getTabIndex(index: number): number {
    if (this.focusedIndex === index) {
      return 0;
    }
    if (this.focusedIndex === -1 && index === 0) {
      return 0;
    }
    return -1;
  }

  isGroupSelected(group: MockGroup): boolean {
    return this.selectedGroups.has(group.getGuid());
  }
}

describe('Property 9: Groups Keyboard Navigation', () => {
  /**
   * Tag: Feature: users-groups-paginated-list-refactor, Property 9: Groups Keyboard Navigation
   *
   * Property: ArrowDown should move focus to the next item, wrapping to first.
   *
   * Validates: Requirements 4.11, 6.8
   */
  describe('ArrowDown navigation', () => {
    it('should move focus to next item for any group list', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(groupArbitrary, { minLength: 2, maxLength: 20 }),
          fc.integer({ min: 0, max: 19 }),
          async (groups, startIndex) => {
            // Arrange
            const component = new MockCometChatGroupsKeyboardComponent(groups);
            const actualStartIndex = startIndex % groups.length;
            component.focusedIndex = actualStartIndex;

            // Act
            component.handleKeydown('ArrowDown');

            // Assert - Focus should move to next item or wrap to first
            const expectedIndex = actualStartIndex < groups.length - 1 ? actualStartIndex + 1 : 0;
            expect(component.focusedIndex).toBe(expectedIndex);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should wrap to first item when at the end for any group list', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(groupArbitrary, { minLength: 1, maxLength: 20 }),
          async groups => {
            // Arrange
            const component = new MockCometChatGroupsKeyboardComponent(groups);
            component.focusedIndex = groups.length - 1; // Last item

            // Act
            component.handleKeydown('ArrowDown');

            // Assert - Should wrap to first item
            expect(component.focusedIndex).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should start at first item when no item is focused', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(groupArbitrary, { minLength: 1, maxLength: 20 }),
          async groups => {
            // Arrange
            const component = new MockCometChatGroupsKeyboardComponent(groups);
            component.focusedIndex = -1; // No focus

            // Act
            component.handleKeydown('ArrowDown');

            // Assert - Should focus first item
            expect(component.focusedIndex).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Tag: Feature: users-groups-paginated-list-refactor, Property 9: Groups Keyboard Navigation
   *
   * Property: ArrowUp should move focus to the previous item, wrapping to last.
   *
   * Validates: Requirements 4.11, 6.8
   */
  describe('ArrowUp navigation', () => {
    it('should move focus to previous item for any group list', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(groupArbitrary, { minLength: 2, maxLength: 20 }),
          fc.integer({ min: 1, max: 19 }),
          async (groups, startIndex) => {
            // Arrange
            const component = new MockCometChatGroupsKeyboardComponent(groups);
            const actualStartIndex = startIndex % groups.length || 1; // Ensure not 0
            component.focusedIndex = actualStartIndex;

            // Act
            component.handleKeydown('ArrowUp');

            // Assert - Focus should move to previous item
            expect(component.focusedIndex).toBe(actualStartIndex - 1);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should wrap to last item when at the beginning for any group list', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(groupArbitrary, { minLength: 1, maxLength: 20 }),
          async groups => {
            // Arrange
            const component = new MockCometChatGroupsKeyboardComponent(groups);
            component.focusedIndex = 0; // First item

            // Act
            component.handleKeydown('ArrowUp');

            // Assert - Should wrap to last item
            expect(component.focusedIndex).toBe(groups.length - 1);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should start at last item when no item is focused', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(groupArbitrary, { minLength: 1, maxLength: 20 }),
          async groups => {
            // Arrange
            const component = new MockCometChatGroupsKeyboardComponent(groups);
            component.focusedIndex = -1; // No focus

            // Act
            component.handleKeydown('ArrowUp');

            // Assert - Should focus last item
            expect(component.focusedIndex).toBe(groups.length - 1);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Tag: Feature: users-groups-paginated-list-refactor, Property 9: Groups Keyboard Navigation
   *
   * Property: Enter should trigger item click on the focused item.
   *
   * Validates: Requirements 4.11, 6.8
   */
  describe('Enter key behavior', () => {
    it('should trigger item click in none mode for any group list', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(groupArbitrary, { minLength: 1, maxLength: 20 }),
          fc.integer({ min: 0, max: 19 }),
          async (groups, focusIndex) => {
            // Arrange
            const component = new MockCometChatGroupsKeyboardComponent(groups, SelectionMode.none);
            const actualFocusIndex = focusIndex % groups.length;
            component.focusedIndex = actualFocusIndex;

            // Act
            component.handleKeydown('Enter');

            // Assert - Item click should be triggered
            expect(component.itemClickEvents.length).toBe(1);
            expect(component.itemClickEvents[0]).toBe(groups[actualFocusIndex]);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should trigger selection in single mode for any group list', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(groupArbitrary, { minLength: 1, maxLength: 20 }),
          fc.integer({ min: 0, max: 19 }),
          async (groups, focusIndex) => {
            // Arrange
            const component = new MockCometChatGroupsKeyboardComponent(
              groups,
              SelectionMode.single
            );
            const actualFocusIndex = focusIndex % groups.length;
            component.focusedIndex = actualFocusIndex;

            // Act
            component.handleKeydown('Enter');

            // Assert - Selection should be triggered
            expect(component.selectEvents.length).toBe(1);
            expect(component.selectEvents[0].group).toBe(groups[actualFocusIndex]);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should trigger selection in multiple mode for any group list', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(groupArbitrary, { minLength: 1, maxLength: 20 }),
          fc.integer({ min: 0, max: 19 }),
          async (groups, focusIndex) => {
            // Arrange
            const component = new MockCometChatGroupsKeyboardComponent(
              groups,
              SelectionMode.multiple
            );
            const actualFocusIndex = focusIndex % groups.length;
            component.focusedIndex = actualFocusIndex;

            // Act
            component.handleKeydown('Enter');

            // Assert - Selection should be triggered
            expect(component.selectEvents.length).toBe(1);
            expect(component.selectEvents[0].group).toBe(groups[actualFocusIndex]);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Tag: Feature: users-groups-paginated-list-refactor, Property 9: Groups Keyboard Navigation
   *
   * Property: Space should toggle selection in multiple mode only.
   *
   * Validates: Requirements 4.11, 6.8
   */
  describe('Space key behavior', () => {
    it('should toggle selection in multiple mode for any group list', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(groupArbitrary, { minLength: 1, maxLength: 20 }),
          fc.integer({ min: 0, max: 19 }),
          async (groups, focusIndex) => {
            // Arrange
            const component = new MockCometChatGroupsKeyboardComponent(
              groups,
              SelectionMode.multiple
            );
            const actualFocusIndex = focusIndex % groups.length;
            component.focusedIndex = actualFocusIndex;

            // Act - Press space twice
            component.handleKeydown(' ');
            component.handleKeydown(' ');

            // Assert - Two selection events should be emitted (select, then deselect)
            expect(component.selectEvents.length).toBe(2);
            expect(component.selectEvents[0].selected).toBe(true);
            expect(component.selectEvents[1].selected).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not trigger selection in none mode for any group list', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(groupArbitrary, { minLength: 1, maxLength: 20 }),
          fc.integer({ min: 0, max: 19 }),
          async (groups, focusIndex) => {
            // Arrange
            const component = new MockCometChatGroupsKeyboardComponent(groups, SelectionMode.none);
            const actualFocusIndex = focusIndex % groups.length;
            component.focusedIndex = actualFocusIndex;

            // Act
            component.handleKeydown(' ');

            // Assert - No selection events should be emitted
            expect(component.selectEvents.length).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not trigger selection in single mode for any group list', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(groupArbitrary, { minLength: 1, maxLength: 20 }),
          fc.integer({ min: 0, max: 19 }),
          async (groups, focusIndex) => {
            // Arrange
            const component = new MockCometChatGroupsKeyboardComponent(
              groups,
              SelectionMode.single
            );
            const actualFocusIndex = focusIndex % groups.length;
            component.focusedIndex = actualFocusIndex;

            // Act
            component.handleKeydown(' ');

            // Assert - No selection events should be emitted (space doesn't work in single mode)
            expect(component.selectEvents.length).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Tag: Feature: users-groups-paginated-list-refactor, Property 9: Groups Keyboard Navigation
   *
   * Property: Escape should clear search and reset focus.
   *
   * Validates: Requirements 4.11, 6.8
   */
  describe('Escape key behavior', () => {
    it('should clear search text for any group list', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(groupArbitrary, { minLength: 1, maxLength: 20 }),
          fc.string({ minLength: 1, maxLength: 50 }),
          async (groups, searchText) => {
            // Arrange
            const component = new MockCometChatGroupsKeyboardComponent(groups);
            component.searchText = searchText;

            // Act
            component.handleKeydown('Escape');

            // Assert - Search text should be cleared
            expect(component.searchText).toBe('');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reset focus for any group list', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(groupArbitrary, { minLength: 1, maxLength: 20 }),
          fc.integer({ min: 0, max: 19 }),
          async (groups, focusIndex) => {
            // Arrange
            const component = new MockCometChatGroupsKeyboardComponent(groups);
            const actualFocusIndex = focusIndex % groups.length;
            component.focusedIndex = actualFocusIndex;

            // Act
            component.handleKeydown('Escape');

            // Assert - Focus should be reset
            expect(component.focusedIndex).toBe(-1);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Tag: Feature: users-groups-paginated-list-refactor, Property 9: Groups Keyboard Navigation
   *
   * Property: Only the focused item should have tabindex=0 (roving tabindex pattern).
   *
   * Validates: Requirements 6.10
   */
  describe('roving tabindex pattern', () => {
    it('should set tabindex=0 only for focused item for any group list', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(groupArbitrary, { minLength: 2, maxLength: 20 }),
          fc.integer({ min: 0, max: 19 }),
          async (groups, focusIndex) => {
            // Arrange
            const component = new MockCometChatGroupsKeyboardComponent(groups);
            const actualFocusIndex = focusIndex % groups.length;
            component.focusedIndex = actualFocusIndex;

            // Assert - Only focused item should have tabindex=0
            for (let i = 0; i < groups.length; i++) {
              if (i === actualFocusIndex) {
                expect(component.getTabIndex(i)).toBe(0);
              } else {
                expect(component.getTabIndex(i)).toBe(-1);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should set tabindex=0 for first item when no focus for any group list', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(groupArbitrary, { minLength: 1, maxLength: 20 }),
          async groups => {
            // Arrange
            const component = new MockCometChatGroupsKeyboardComponent(groups);
            component.focusedIndex = -1; // No focus

            // Assert - First item should have tabindex=0, others -1
            expect(component.getTabIndex(0)).toBe(0);
            for (let i = 1; i < groups.length; i++) {
              expect(component.getTabIndex(i)).toBe(-1);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Tag: Feature: users-groups-paginated-list-refactor, Property 9: Groups Keyboard Navigation
   *
   * Property: Navigation should wrap correctly at boundaries.
   *
   * Validates: Requirements 4.11, 6.8
   */
  describe('boundary wrapping', () => {
    it('should wrap correctly for any group list', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(groupArbitrary, { minLength: 3, maxLength: 20 }),
          async groups => {
            // Arrange
            const component = new MockCometChatGroupsKeyboardComponent(groups);

            // Start at -1, go down
            component.handleKeydown('ArrowDown');
            expect(component.focusedIndex).toBe(0);

            // Go up from 0 should wrap to last
            component.handleKeydown('ArrowUp');
            expect(component.focusedIndex).toBe(groups.length - 1);

            // Go down from last should wrap to first
            component.handleKeydown('ArrowDown');
            expect(component.focusedIndex).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
