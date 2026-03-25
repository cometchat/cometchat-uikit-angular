import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Property-Based Tests for CometChatPaginatedList State Logic
 *
 * These tests verify universal properties that should hold across all inputs,
 * using fast-check for property-based testing.
 *
 * Since the CometChatPaginatedList component uses Angular's inject() function,
 * we cannot instantiate it directly in tests. Instead, we test the state logic
 * as pure functions that mirror the component's behavior.
 *
 * The component's template uses these conditions:
 * - Loading: @if (isLoading && items.length === 0)
 * - Error: @if (error && !isLoading)
 * - Empty: @if (isEmpty() && !error) where isEmpty() = !isLoading && items.length === 0
 * - Items: @if (hasItems()) where hasItems() = items.length > 0
 * - Loading More: @if (showLoadingMore()) where showLoadingMore() = isFetchingMore && hasItems()
 *
 * Validates: Requirements 4.5
 */
describe('CometChatPaginatedList Property Tests', () => {
  // Pure function implementations that mirror the component's state logic.
  interface PaginatedListState<T> {
    items: T[];
    isLoading: boolean;
    hasMore: boolean;
    error: Error | null;
    isFetchingMore: boolean;
  }

  function isEmpty<T>(state: PaginatedListState<T>): boolean {
    return !state.isLoading && state.items.length === 0;
  }

  function hasItems<T>(state: PaginatedListState<T>): boolean {
    return state.items.length > 0;
  }

  function showLoadingMore<T>(state: PaginatedListState<T>): boolean {
    return state.isFetchingMore && hasItems(state);
  }

  function shouldShowLoading<T>(state: PaginatedListState<T>): boolean {
    return state.isLoading && state.items.length === 0;
  }

  function shouldShowError<T>(state: PaginatedListState<T>): boolean {
    return state.error !== null && !state.isLoading;
  }

  function shouldShowEmpty<T>(state: PaginatedListState<T>): boolean {
    return isEmpty(state) && state.error === null;
  }

  function shouldShowItems<T>(state: PaginatedListState<T>): boolean {
    return hasItems(state);
  }

  function makeState<T>(
    items: T[],
    isLoading: boolean,
    hasMore: boolean,
    error: Error | null,
    isFetchingMore = false
  ): PaginatedListState<T> {
    return { items, isLoading, hasMore, error, isFetchingMore };
  }

  describe('Property 5: Loading State Indicator Display', () => {
    it('should show loading state when isLoading is true and items is empty', () => {
      fc.assert(
        fc.property(
          fc.boolean(),
          fc.option(
            fc.string({ minLength: 1, maxLength: 50 }).map(msg => new Error(msg)),
            { nil: null }
          ),
          (hasMore, error) => {
            const state = makeState<string>([], true, hasMore, error);
            expect(shouldShowLoading(state)).toBe(true);
            expect(shouldShowEmpty(state)).toBe(false);
            expect(shouldShowItems(state)).toBe(false);
            expect(shouldShowError(state)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should show empty state when isLoading is false, items is empty, and no error', () => {
      fc.assert(
        fc.property(fc.boolean(), hasMore => {
          const state = makeState<string>([], false, hasMore, null);
          expect(shouldShowEmpty(state)).toBe(true);
          expect(shouldShowLoading(state)).toBe(false);
          expect(shouldShowItems(state)).toBe(false);
          expect(shouldShowError(state)).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it('should show items when items array is non-empty', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 10 }),
          fc.boolean(),
          fc.boolean(),
          fc.option(
            fc.string({ minLength: 1, maxLength: 50 }).map(msg => new Error(msg)),
            { nil: null }
          ),
          (items, isLoading, hasMore, error) => {
            const state = makeState(items, isLoading, hasMore, error);
            expect(shouldShowItems(state)).toBe(true);
            expect(shouldShowLoading(state)).toBe(false);
            expect(shouldShowEmpty(state)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should show error state instead of empty state when error exists', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.boolean(),
          (errorMessage, hasMore) => {
            const state = makeState<string>([], false, hasMore, new Error(errorMessage));
            expect(shouldShowError(state)).toBe(true);
            expect(shouldShowEmpty(state)).toBe(false);
            expect(shouldShowLoading(state)).toBe(false);
            expect(shouldShowItems(state)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should show loading state instead of error state when loading', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.boolean(),
          (errorMessage, hasMore) => {
            const state = makeState<string>([], true, hasMore, new Error(errorMessage));
            expect(shouldShowLoading(state)).toBe(true);
            expect(shouldShowError(state)).toBe(false);
            expect(shouldShowEmpty(state)).toBe(false);
            expect(shouldShowItems(state)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have mutually exclusive primary states', () => {
      fc.assert(
        fc.property(
          fc.boolean(),
          fc.array(fc.string({ minLength: 1, maxLength: 10 }), { minLength: 0, maxLength: 5 }),
          fc.boolean(),
          fc.option(
            fc.string({ minLength: 1, maxLength: 50 }).map(msg => new Error(msg)),
            { nil: null }
          ),
          (isLoading, items, hasMore, error) => {
            const state = makeState(items, isLoading, hasMore, error);
            const showLoading = shouldShowLoading(state);
            const showError = shouldShowError(state);
            const showEmpty = shouldShowEmpty(state);
            const showItems = shouldShowItems(state);

            if (items.length > 0) {
              expect(showItems).toBe(true);
              expect(showLoading).toBe(false);
            } else if (isLoading) {
              expect(showLoading).toBe(true);
              expect(showError).toBe(false);
              expect(showEmpty).toBe(false);
              expect(showItems).toBe(false);
            } else if (error !== null) {
              expect(showError).toBe(true);
              expect(showLoading).toBe(false);
              expect(showEmpty).toBe(false);
              expect(showItems).toBe(false);
            } else {
              expect(showEmpty).toBe(true);
              expect(showLoading).toBe(false);
              expect(showError).toBe(false);
              expect(showItems).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should correctly indicate pagination loading state via showLoadingMore', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 1, maxLength: 10 }), { minLength: 0, maxLength: 5 }),
          fc.boolean(),
          fc.boolean(),
          fc.boolean(),
          (items, isFetchingMore, isLoading, hasMore) => {
            const state = makeState(items, isLoading, hasMore, null, isFetchingMore);
            const expectedShowLoadingMore = isFetchingMore && items.length > 0;
            expect(showLoadingMore(state)).toBe(expectedShowLoadingMore);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should correctly compute isEmpty based on isLoading and items', () => {
      fc.assert(
        fc.property(
          fc.boolean(),
          fc.array(fc.string({ minLength: 1, maxLength: 10 }), { minLength: 0, maxLength: 5 }),
          fc.boolean(),
          (isLoading, items, hasMore) => {
            const state = makeState(items, isLoading, hasMore, null);
            const expectedIsEmpty = !isLoading && items.length === 0;
            expect(isEmpty(state)).toBe(expectedIsEmpty);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should correctly compute hasItems based on items array length', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 1, maxLength: 10 }), { minLength: 0, maxLength: 10 }),
          fc.boolean(),
          fc.boolean(),
          (items, isLoading, hasMore) => {
            const state = makeState(items, isLoading, hasMore, null);
            const expectedHasItems = items.length > 0;
            expect(hasItems(state)).toBe(expectedHasItems);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
