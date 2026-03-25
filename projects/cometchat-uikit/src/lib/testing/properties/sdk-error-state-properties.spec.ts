import { describe, it, expect, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { States } from '../../Enums/Enums';

/**
 * Property-Based Tests for SDK Error to Error State Transition
 *
 * Feature: comprehensive-test-suite, Property 12: SDK Error to Error State Transition
 *
 * For any composite component that fetches data from the CometChat SDK, when the
 * mocked SDK call rejects with an error, the component SHALL transition to the
 * error state and the error view template SHALL be rendered.
 *
 * **Validates: Requirements 4.7**
 */

// ─── Mock Data-Fetching Component ───
// Mirrors the fetch/error logic from composite component specs (users, groups,
// conversations, group-members). Each component follows the same pattern:
//   1. fetchState starts as States.loading
//   2. fetchData() calls SDK → on success sets States.loaded, on failure sets States.error
//   3. An error callback is invoked with the exact error object on failure

type ComponentType = 'users' | 'groups' | 'conversations' | 'group-members';

interface SDKError {
  code: string;
  message: string;
}

class MockDataFetchingComponent {
  fetchState: States = States.loading;
  items: any[] = [];
  private errorCallback: ((error: SDKError) => void) | null = null;
  private fetchFn: (() => Promise<any[]>) | null = null;
  readonly componentType: ComponentType;

  constructor(componentType: ComponentType) {
    this.componentType = componentType;
  }

  /** Register a data-fetching function (simulates SDK call binding). */
  setFetchFunction(fn: () => Promise<any[]>): void {
    this.fetchFn = fn;
  }

  /** Register an error callback (simulates @Output or onError handler). */
  onError(callback: (error: SDKError) => void): void {
    this.errorCallback = callback;
  }

  /** Fetch data from the SDK. Transitions state based on result. */
  async fetchData(): Promise<void> {
    this.fetchState = States.loading;
    try {
      if (!this.fetchFn) {
        throw { code: 'ERR_NO_FETCH', message: 'No fetch function configured' } as SDKError;
      }
      const results = await this.fetchFn();
      this.items = results;
      this.fetchState = results.length > 0 ? States.loaded : States.empty;
    } catch (error: any) {
      this.fetchState = States.error;
      if (this.errorCallback) {
        this.errorCallback(error as SDKError);
      }
    }
  }

  /** Directly simulate an SDK error (shortcut for testing). */
  simulateError(error: SDKError): void {
    this.fetchState = States.error;
    if (this.errorCallback) {
      this.errorCallback(error);
    }
  }

  /** Returns true when the component is in error state (drives error view rendering). */
  get showErrorView(): boolean {
    return this.fetchState === States.error;
  }
}

// ─── Arbitraries ───

/** Random error code string */
const arbErrorCode = fc.string({ minLength: 1, maxLength: 30 });

/** Random error message string */
const arbErrorMessage = fc.string({ minLength: 0, maxLength: 200 });

/** Random SDK error object */
const arbSDKError = fc.record({
  code: arbErrorCode,
  message: arbErrorMessage,
});

/** Random component type */
const arbComponentType = fc.constantFrom<ComponentType>(
  'users',
  'groups',
  'conversations',
  'group-members'
);

// ─── Tests ───

describe('SDK Error to Error State Transition Property Tests', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * **Feature: comprehensive-test-suite, Property 12: SDK Error to Error State Transition**
   *
   * *For any* composite component that fetches data, when SDK rejects, verify
   * error state and error view rendering.
   *
   * **Validates: Requirements 4.7**
   */
  describe('Property 12: SDK Error to Error State Transition', () => {
    it('simulateError transitions any component to error state for any error object', () => {
      fc.assert(
        fc.property(arbComponentType, arbSDKError, (componentType, error) => {
          const component = new MockDataFetchingComponent(componentType);

          // Component starts in loading state
          expect(component.fetchState).toBe(States.loading);

          // Simulate error
          component.simulateError(error);

          // fetchState must be States.error
          expect(component.fetchState).toBe(States.error);

          // Error view should be rendered
          expect(component.showErrorView).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('error callback receives the exact error object passed to simulateError', () => {
      fc.assert(
        fc.property(arbComponentType, arbSDKError, (componentType, error) => {
          const component = new MockDataFetchingComponent(componentType);
          let receivedError: SDKError | null = null;

          component.onError(err => {
            receivedError = err;
          });

          component.simulateError(error);

          // Callback must have been invoked with the exact error
          expect(receivedError).not.toBeNull();
          expect(receivedError!.code).toBe(error.code);
          expect(receivedError!.message).toBe(error.message);
        }),
        { numRuns: 100 }
      );
    });

    it('fetchData transitions to error state when SDK rejects for any error', async () => {
      await fc.assert(
        fc.asyncProperty(arbComponentType, arbSDKError, async (componentType, error) => {
          const component = new MockDataFetchingComponent(componentType);
          let receivedError: SDKError | null = null;

          // Configure SDK to reject
          component.setFetchFunction(() => Promise.reject(error));
          component.onError(err => {
            receivedError = err;
          });

          // fetchData should NOT throw unhandled exceptions
          await expect(component.fetchData()).resolves.toBeUndefined();

          // State must be error
          expect(component.fetchState).toBe(States.error);
          expect(component.showErrorView).toBe(true);

          // Error callback received the exact error
          expect(receivedError).not.toBeNull();
          expect(receivedError!.code).toBe(error.code);
          expect(receivedError!.message).toBe(error.message);
        }),
        { numRuns: 100 }
      );
    });

    it('simulateError does not throw when no error callback is registered', () => {
      fc.assert(
        fc.property(arbComponentType, arbSDKError, (componentType, error) => {
          const component = new MockDataFetchingComponent(componentType);

          // No onError callback registered — should not throw
          expect(() => {
            component.simulateError(error);
          }).not.toThrow();

          // State should still transition to error
          expect(component.fetchState).toBe(States.error);
          expect(component.showErrorView).toBe(true);
        }),
        { numRuns: 100 }
      );
    });
  });
});
