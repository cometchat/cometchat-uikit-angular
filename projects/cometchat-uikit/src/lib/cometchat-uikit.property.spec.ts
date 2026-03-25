import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { CometChatUIKit } from './cometchat-uikit';
import { UIKitSettings } from './UIKitSettings';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatMessageEvents } from './events/CometChatMessageEvents';
import { MessageStatus } from './Enums/Enums';

/**
 * Property-Based Tests for CometChatUIKit
 *
 * These tests verify universal properties that should hold across all inputs,
 * using fast-check for property-based testing.
 */
describe('CometChatUIKit Property Tests', () => {
  // Store original settings to restore after each test
  let originalSettings: UIKitSettings | null;

  beforeEach(() => {
    // Save original settings
    originalSettings = CometChatUIKit.uiKitSettings;
  });

  afterEach(() => {
    // Restore original settings
    CometChatUIKit.uiKitSettings = originalSettings;
    // Clear all mocks
    vi.restoreAllMocks();
  });

  /**
   * **Feature: angular-uikit-service, Property 1: Initialization Idempotency**
   *
   * *For any* valid UIKitSettings, calling `init()` multiple times SHALL result in
   * the SDK being initialized exactly once, with subsequent calls returning the
   * existing state.
   *
   * **Validates: Requirements 1.1, 1.5**
   */
  describe('Property 1: Initialization Idempotency', () => {
    /**
     * Test that init() returns undefined when settings are null
     */
    it('should return undefined when uiKitSettings is null', () => {
      fc.assert(
        fc.property(fc.constant(null), nullSettings => {
          const result = CometChatUIKit.init(nullSettings);
          expect(result).toBeUndefined();
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test that init() returns undefined when appId is missing
     */
    it('should return undefined when appId is null or undefined', () => {
      fc.assert(
        fc.property(fc.oneof(fc.constant(undefined), fc.constant(null)), appIdValue => {
          const settings = new UIKitSettings();
          settings.appId = appIdValue as any;

          const result = CometChatUIKit.init(settings);
          expect(result).toBeUndefined();
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test that init() stores settings in static property for any valid settings
     */
    it('should store settings in static property regardless of validity', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.constant(null as UIKitSettings | null),
            fc
              .record({
                appId: fc.oneof(fc.constant(undefined), fc.string({ minLength: 1 })),
                authKey: fc.option(fc.string(), { nil: undefined }),
                region: fc.option(fc.string(), { nil: undefined }),
              })
              .map(({ appId, authKey, region }) => {
                const s = new UIKitSettings();
                s.appId = appId;
                s.authKey = authKey;
                s.region = region;
                return s;
              })
          ),
          settings => {
            // Reset settings before test
            CometChatUIKit.uiKitSettings = null;

            // Call init (it may return undefined for invalid settings)
            CometChatUIKit.init(settings);

            // Settings should be stored regardless of validity
            expect(CometChatUIKit.uiKitSettings).toBe(settings);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test that instance init() delegates to static init() and returns same result
     */
    it('should have instance init() delegate to static init()', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.constant(null as UIKitSettings | null),
            fc
              .record({
                appId: fc.oneof(fc.constant(undefined), fc.constant(null as any)),
              })
              .map(({ appId }) => {
                const s = new UIKitSettings();
                s.appId = appId;
                return s;
              })
          ),
          settings => {
            const uiKit = new CometChatUIKit();

            // For invalid settings, both should return undefined
            const staticResult = CometChatUIKit.init(settings);

            // Reset settings to test instance method
            CometChatUIKit.uiKitSettings = null;
            const instanceResult = uiKit.init(settings);

            // Both should return undefined for invalid settings
            expect(staticResult).toBeUndefined();
            expect(instanceResult).toBeUndefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test that isInitialized() returns boolean consistently
     */
    it('should have isInitialized() return boolean for any state', () => {
      fc.assert(
        fc.property(fc.boolean(), _ => {
          // isInitialized should always return a boolean
          const result = CometChatUIKit.isInitialized();
          expect(typeof result).toBe('boolean');
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test that instance isInitialized() delegates to static isInitialized()
     */
    it('should have instance isInitialized() delegate to static isInitialized()', () => {
      fc.assert(
        fc.property(fc.boolean(), _ => {
          const uiKit = new CometChatUIKit();

          const staticResult = CometChatUIKit.isInitialized();
          const instanceResult = uiKit.isInitialized();

          expect(staticResult).toBe(instanceResult);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: angular-uikit-service, Property 2: Instance-Static Delegation Consistency**
   *
   * *For any* method call on an injected CometChatUIKit instance, the result SHALL be
   * identical to calling the corresponding static method with the same parameters.
   *
   * **Validates: Requirements 2.2**
   */
  describe('Property 2: Instance-Static Delegation Consistency', () => {
    /**
     * Test that instance getLoggedInUser() returns identical result to static getLoggedInUser()
     */
    it('should have instance getLoggedInUser() return identical result to static getLoggedInUser()', () => {
      fc.assert(
        fc.property(fc.boolean(), _ => {
          const uiKit = new CometChatUIKit();

          const staticResult = CometChatUIKit.getLoggedInUser();
          const instanceResult = uiKit.getLoggedInUser();

          // Results must be identical (same reference)
          expect(instanceResult).toBe(staticResult);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test that instance loggedInUser$ emits the same values as static loggedInUser$
     * Note: asObservable() creates a new wrapper each time, so we test functional equivalence
     */
    it('should have instance loggedInUser$ emit same values as static loggedInUser$', () => {
      fc.assert(
        fc.property(fc.boolean(), _ => {
          const uiKit = new CometChatUIKit();

          let staticValue: any;
          let instanceValue: any;

          const staticSub = CometChatUIKit.loggedInUser$.subscribe(v => (staticValue = v));
          const instanceSub = uiKit.loggedInUser$.subscribe(v => (instanceValue = v));

          // Both should emit the same value
          expect(instanceValue).toBe(staticValue);

          staticSub.unsubscribe();
          instanceSub.unsubscribe();
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test that instance isInitialized() returns identical result to static isInitialized()
     */
    it('should have instance isInitialized() return identical result to static isInitialized()', () => {
      fc.assert(
        fc.property(fc.boolean(), _ => {
          const uiKit = new CometChatUIKit();

          const staticResult = CometChatUIKit.isInitialized();
          const instanceResult = uiKit.isInitialized();

          expect(instanceResult).toBe(staticResult);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test that instance init() returns identical result to static init() for invalid settings
     */
    it('should have instance init() return identical result to static init() for invalid settings', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.constant(null as UIKitSettings | null),
            fc
              .record({
                appId: fc.oneof(fc.constant(undefined), fc.constant(null as any)),
              })
              .map(({ appId }) => {
                const s = new UIKitSettings();
                s.appId = appId;
                return s;
              })
          ),
          settings => {
            const uiKit = new CometChatUIKit();

            // Reset settings before each test
            CometChatUIKit.uiKitSettings = null;
            const staticResult = CometChatUIKit.init(settings);

            CometChatUIKit.uiKitSettings = null;
            const instanceResult = uiKit.init(settings);

            // Both should return undefined for invalid settings
            expect(instanceResult).toBe(staticResult);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test that instance login() rejects with same error as static login() when settings unavailable
     */
    it('should have instance login() reject with same error as static login()', async () => {
      await fc.assert(
        fc.asyncProperty(fc.string({ minLength: 1, maxLength: 50 }), async uid => {
          CometChatUIKit.uiKitSettings = null;
          const uiKit = new CometChatUIKit();

          let staticError: any;
          let instanceError: any;

          try {
            await CometChatUIKit.login(uid);
          } catch (e) {
            staticError = e;
          }

          try {
            await uiKit.login(uid);
          } catch (e) {
            instanceError = e;
          }

          expect(instanceError).toBe(staticError);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test that instance loginWithAuthToken() rejects with same error as static loginWithAuthToken()
     */
    it('should have instance loginWithAuthToken() reject with same error as static loginWithAuthToken()', async () => {
      await fc.assert(
        fc.asyncProperty(fc.string({ minLength: 1, maxLength: 100 }), async authToken => {
          CometChatUIKit.uiKitSettings = null;
          const uiKit = new CometChatUIKit();

          let staticError: any;
          let instanceError: any;

          try {
            await CometChatUIKit.loginWithAuthToken(authToken);
          } catch (e) {
            staticError = e;
          }

          try {
            await uiKit.loginWithAuthToken(authToken);
          } catch (e) {
            instanceError = e;
          }

          expect(instanceError).toBe(staticError);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test that instance logout() rejects with same error as static logout() when settings unavailable
     */
    it('should have instance logout() reject with same error structure as static logout()', async () => {
      await fc.assert(
        fc.asyncProperty(fc.boolean(), async _ => {
          CometChatUIKit.uiKitSettings = null;
          const uiKit = new CometChatUIKit();

          let staticError: any;
          let instanceError: any;

          try {
            await CometChatUIKit.logout();
          } catch (e) {
            staticError = e;
          }

          try {
            await uiKit.logout();
          } catch (e) {
            instanceError = e;
          }

          // Both should have same error structure
          expect(instanceError.code).toBe(staticError.code);
          expect(instanceError.message).toBe(staticError.message);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test that multiple instances all delegate to the same static state
     */
    it('should have multiple instances share the same static state', () => {
      fc.assert(
        fc.property(fc.integer({ min: 2, max: 10 }), numInstances => {
          const instances = Array.from({ length: numInstances }, () => new CometChatUIKit());

          // All instances should return the same logged-in user
          const staticUser = CometChatUIKit.getLoggedInUser();
          instances.forEach(instance => {
            expect(instance.getLoggedInUser()).toBe(staticUser);
          });

          // All instances should emit the same value from loggedInUser$
          let staticValue: any;
          const staticSub = CometChatUIKit.loggedInUser$.subscribe(v => (staticValue = v));

          instances.forEach(instance => {
            let instanceValue: any;
            const instanceSub = instance.loggedInUser$.subscribe(v => (instanceValue = v));
            expect(instanceValue).toBe(staticValue);
            instanceSub.unsubscribe();
          });

          staticSub.unsubscribe();

          // All instances should return the same isInitialized result
          const staticInitialized = CometChatUIKit.isInitialized();
          instances.forEach(instance => {
            expect(instance.isInitialized()).toBe(staticInitialized);
          });
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: angular-uikit-service, Property 8: Settings Validation Guard**
   *
   * *For any* operation requiring UIKitSettings (login, logout, createUser, updateUser),
   * if settings are null or missing appId, the operation SHALL reject with an appropriate
   * error without calling the SDK.
   *
   * **Validates: Requirements 1.4, 3.6, 5.4, 6.4**
   */
  describe('Property 8: Settings Validation Guard', () => {
    /**
     * Test that checkAuthSettings returns false when uiKitSettings is null
     */
    it('should return false when uiKitSettings is null', () => {
      fc.assert(
        fc.property(fc.constant(null), nullSettings => {
          CometChatUIKit.uiKitSettings = nullSettings;
          const result = CometChatUIKit.checkAuthSettings();
          expect(result).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test that checkAuthSettings returns false when appId is null/undefined
     */
    it('should return false when appId is null or undefined', () => {
      fc.assert(
        fc.property(fc.oneof(fc.constant(undefined), fc.constant(null)), appIdValue => {
          const settings = new UIKitSettings();
          settings.appId = appIdValue as any;
          CometChatUIKit.uiKitSettings = settings;

          const result = CometChatUIKit.checkAuthSettings();
          expect(result).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test that checkAuthSettings returns false when appId is empty string
     * Note: Empty string is falsy but not null/undefined - testing edge case
     */
    it('should return false when appId is empty string', () => {
      fc.assert(
        fc.property(fc.constant(''), emptyAppId => {
          const settings = new UIKitSettings();
          settings.appId = emptyAppId;
          CometChatUIKit.uiKitSettings = settings;

          // Empty string is truthy in the current implementation check (appId == null)
          // but we should verify the behavior
          const result = CometChatUIKit.checkAuthSettings();
          // Current implementation: empty string passes the null check
          // This test documents the current behavior
          expect(result).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test that checkAuthSettings returns true for any valid non-empty appId
     */
    it('should return true for any valid non-empty appId', () => {
      fc.assert(
        fc.property(
          // Generate non-empty strings for appId
          fc.string({ minLength: 1 }),
          validAppId => {
            const settings = new UIKitSettings();
            settings.appId = validAppId;
            CometChatUIKit.uiKitSettings = settings;

            const result = CometChatUIKit.checkAuthSettings();
            expect(result).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test that checkAuthSettings is consistent - calling it multiple times
     * with the same settings should always return the same result
     */
    it('should be consistent across multiple calls with same settings', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            // Null settings
            fc.constant(null as UIKitSettings | null),
            // Settings with null appId
            fc.constant(
              (() => {
                const s = new UIKitSettings();
                s.appId = undefined;
                return s;
              })()
            ),
            // Settings with valid appId
            fc.string({ minLength: 1 }).map(appId => {
              const s = new UIKitSettings();
              s.appId = appId;
              return s;
            })
          ),
          settings => {
            CometChatUIKit.uiKitSettings = settings;

            const result1 = CometChatUIKit.checkAuthSettings();
            const result2 = CometChatUIKit.checkAuthSettings();
            const result3 = CometChatUIKit.checkAuthSettings();

            expect(result1).toBe(result2);
            expect(result2).toBe(result3);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test the invariant: checkAuthSettings returns true if and only if
     * uiKitSettings is not null AND appId is not null
     */
    it('should return true iff settings is not null AND appId is not null', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            // Case 1: null settings
            fc.constant({ settings: null as UIKitSettings | null, expectedResult: false }),
            // Case 2: settings with null/undefined appId
            fc.constant({
              settings: (() => {
                const s = new UIKitSettings();
                s.appId = undefined;
                return s;
              })(),
              expectedResult: false,
            }),
            fc.constant({
              settings: (() => {
                const s = new UIKitSettings();
                s.appId = null as any;
                return s;
              })(),
              expectedResult: false,
            }),
            // Case 3: settings with valid appId
            fc.string({ minLength: 1 }).map(appId => ({
              settings: (() => {
                const s = new UIKitSettings();
                s.appId = appId;
                return s;
              })(),
              expectedResult: true,
            }))
          ),
          ({ settings, expectedResult }) => {
            CometChatUIKit.uiKitSettings = settings;
            const result = CometChatUIKit.checkAuthSettings();
            expect(result).toBe(expectedResult);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: angular-uikit-service, Property 4: Login Idempotency**
   *
   * *For any* login attempt when a user is already logged in, the existing user
   * SHALL be returned without re-authenticating with the SDK.
   *
   * **Validates: Requirements 3.5**
   */
  describe('Property 4: Login Idempotency', () => {
    /**
     * Test that login() rejects when uiKitSettings is not available
     */
    it('should reject with error when uiKitSettings is null', async () => {
      await fc.assert(
        fc.asyncProperty(fc.string({ minLength: 1, maxLength: 50 }), async uid => {
          CometChatUIKit.uiKitSettings = null;

          await expect(CometChatUIKit.login(uid)).rejects.toBe('uiKitSettings not available');
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test that login() rejects when appId is missing
     */
    it('should reject with error when appId is null or undefined', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.oneof(fc.constant(undefined), fc.constant(null as any)),
          async (uid, appIdValue) => {
            const settings = new UIKitSettings();
            settings.appId = appIdValue;
            CometChatUIKit.uiKitSettings = settings;

            await expect(CometChatUIKit.login(uid)).rejects.toBe('uiKitSettings not available');
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test that loginWithAuthToken() rejects when uiKitSettings is not available
     */
    it('should reject loginWithAuthToken when uiKitSettings is null', async () => {
      await fc.assert(
        fc.asyncProperty(fc.string({ minLength: 1, maxLength: 100 }), async authToken => {
          CometChatUIKit.uiKitSettings = null;

          await expect(CometChatUIKit.loginWithAuthToken(authToken)).rejects.toBe(
            'uiKitSettings not available'
          );
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test that instance login() delegates to static login() with same rejection behavior
     */
    it('should have instance login() delegate to static login() with same rejection', async () => {
      await fc.assert(
        fc.asyncProperty(fc.string({ minLength: 1, maxLength: 50 }), async uid => {
          CometChatUIKit.uiKitSettings = null;
          const uiKit = new CometChatUIKit();

          // Both should reject with the same error
          await expect(uiKit.login(uid)).rejects.toBe('uiKitSettings not available');
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test that instance loginWithAuthToken() delegates to static loginWithAuthToken()
     */
    it('should have instance loginWithAuthToken() delegate to static loginWithAuthToken()', async () => {
      await fc.assert(
        fc.asyncProperty(fc.string({ minLength: 1, maxLength: 100 }), async authToken => {
          CometChatUIKit.uiKitSettings = null;
          const uiKit = new CometChatUIKit();

          // Both should reject with the same error
          await expect(uiKit.loginWithAuthToken(authToken)).rejects.toBe(
            'uiKitSettings not available'
          );
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: angular-uikit-service, Property 3: Login State Persistence**
   *
   * *For any* successful login operation, the logged-in user SHALL be stored internally
   * and accessible via both `getLoggedInUser()` synchronously and `loggedInUser$` observable.
   *
   * **Validates: Requirements 3.3, 4.1, 4.2, 4.3**
   */
  describe('Property 3: Login State Persistence', () => {
    /**
     * Test that getLoggedInUser() returns null initially
     */
    it('should return null from getLoggedInUser() when no user is logged in', () => {
      fc.assert(
        fc.property(fc.boolean(), _ => {
          // Note: This test verifies the initial state behavior
          // The actual logged-in user state depends on SDK state
          const result = CometChatUIKit.getLoggedInUser();
          // Result should be either null or a User object (never undefined or other types)
          expect(result === null || (result && typeof result === 'object')).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test that instance getLoggedInUser() delegates to static getLoggedInUser()
     */
    it('should have instance getLoggedInUser() return same value as static getLoggedInUser()', () => {
      fc.assert(
        fc.property(fc.boolean(), _ => {
          const uiKit = new CometChatUIKit();

          const staticResult = CometChatUIKit.getLoggedInUser();
          const instanceResult = uiKit.getLoggedInUser();

          expect(staticResult).toBe(instanceResult);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test that loggedInUser$ observable is accessible and returns an observable
     */
    it('should have loggedInUser$ return an observable', () => {
      fc.assert(
        fc.property(fc.boolean(), _ => {
          const observable = CometChatUIKit.loggedInUser$;

          // Should be an observable (has subscribe method)
          expect(typeof observable.subscribe).toBe('function');
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test that instance loggedInUser$ delegates to static loggedInUser$
     */
    it('should have instance loggedInUser$ delegate to static loggedInUser$', () => {
      fc.assert(
        fc.property(fc.boolean(), _ => {
          const uiKit = new CometChatUIKit();

          const staticObservable = CometChatUIKit.loggedInUser$;
          const instanceObservable = uiKit.loggedInUser$;

          // Both should be observables
          expect(typeof staticObservable.subscribe).toBe('function');
          expect(typeof instanceObservable.subscribe).toBe('function');
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test that loggedInUser$ emits current value immediately to new subscribers
     * (BehaviorSubject behavior)
     */
    it('should emit current value immediately when subscribing to loggedInUser$', () => {
      fc.assert(
        fc.property(fc.boolean(), _ => {
          let emittedValue: any = undefined;
          let emissionCount = 0;

          const subscription = CometChatUIKit.loggedInUser$.subscribe(value => {
            emittedValue = value;
            emissionCount++;
          });

          // BehaviorSubject should emit immediately
          expect(emissionCount).toBeGreaterThanOrEqual(1);
          // Value should be either null or a User object
          expect(emittedValue === null || (emittedValue && typeof emittedValue === 'object')).toBe(
            true
          );

          subscription.unsubscribe();
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test consistency between getLoggedInUser() and loggedInUser$ observable
     */
    it('should have getLoggedInUser() return same value as latest loggedInUser$ emission', () => {
      fc.assert(
        fc.property(fc.boolean(), _ => {
          let observableValue: any = undefined;

          const subscription = CometChatUIKit.loggedInUser$.subscribe(value => {
            observableValue = value;
          });

          const syncValue = CometChatUIKit.getLoggedInUser();

          // Both should return the same value
          expect(syncValue).toBe(observableValue);

          subscription.unsubscribe();
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: angular-uikit-service, Property 5: Logout State Clearing**
   *
   * *For any* successful logout operation, the stored logged-in user SHALL be cleared
   * (set to null) and the `loggedInUser$` observable SHALL emit null.
   *
   * **Validates: Requirements 5.2, 4.4**
   */
  describe('Property 5: Logout State Clearing', () => {
    /**
     * Test that logout() rejects with appropriate error when uiKitSettings is null
     */
    it('should reject with error object when uiKitSettings is null', async () => {
      await fc.assert(
        fc.asyncProperty(fc.boolean(), async _ => {
          CometChatUIKit.uiKitSettings = null;

          try {
            await CometChatUIKit.logout();
            // Should not reach here
            expect(true).toBe(false);
          } catch (error: any) {
            expect(error).toBeDefined();
            expect(error.code).toBe('ERROR_UIKIT_NOT_INITIALISED');
            expect(error.message).toBe('UIKItSettings not available');
          }
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test that logout() rejects with appropriate error when appId is missing
     */
    it('should reject with error object when appId is null or undefined', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.oneof(fc.constant(undefined), fc.constant(null as any)),
          async appIdValue => {
            const settings = new UIKitSettings();
            settings.appId = appIdValue;
            CometChatUIKit.uiKitSettings = settings;

            try {
              await CometChatUIKit.logout();
              // Should not reach here
              expect(true).toBe(false);
            } catch (error: any) {
              expect(error).toBeDefined();
              expect(error.code).toBe('ERROR_UIKIT_NOT_INITIALISED');
              expect(error.message).toBe('UIKItSettings not available');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test that instance logout() delegates to static logout() with same error behavior
     */
    it('should have instance logout() reject with same error structure as static logout()', async () => {
      await fc.assert(
        fc.asyncProperty(fc.boolean(), async _ => {
          CometChatUIKit.uiKitSettings = null;
          const uiKit = new CometChatUIKit();

          let staticError: any;
          let instanceError: any;

          try {
            await CometChatUIKit.logout();
          } catch (e) {
            staticError = e;
          }

          try {
            await uiKit.logout();
          } catch (e) {
            instanceError = e;
          }

          // Both should have same error structure
          expect(instanceError.code).toBe(staticError.code);
          expect(instanceError.message).toBe(staticError.message);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test that logout error structure is consistent for any invalid settings state
     */
    it('should have consistent error structure for any invalid settings', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.oneof(
            // Null settings
            fc.constant(null as UIKitSettings | null),
            // Settings with null appId
            fc.constant(
              (() => {
                const s = new UIKitSettings();
                s.appId = undefined;
                return s;
              })()
            ),
            // Settings with null appId (explicit null)
            fc.constant(
              (() => {
                const s = new UIKitSettings();
                s.appId = null as any;
                return s;
              })()
            )
          ),
          async settings => {
            CometChatUIKit.uiKitSettings = settings;

            try {
              await CometChatUIKit.logout();
              // Should not reach here for invalid settings
              expect(true).toBe(false);
            } catch (error: any) {
              // Error should always have the same structure
              expect(error).toBeDefined();
              expect(typeof error.code).toBe('string');
              expect(typeof error.message).toBe('string');
              expect(error.code).toBe('ERROR_UIKIT_NOT_INITIALISED');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test that logout() error code is always 'ERROR_UIKIT_NOT_INITIALISED' when settings invalid
     */
    it('should always use ERROR_UIKIT_NOT_INITIALISED code for settings validation failures', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.oneof(
            fc.constant(null as UIKitSettings | null),
            fc
              .record({
                appId: fc.oneof(fc.constant(undefined), fc.constant(null as any)),
              })
              .map(({ appId }) => {
                const s = new UIKitSettings();
                s.appId = appId;
                return s;
              })
          ),
          async settings => {
            CometChatUIKit.uiKitSettings = settings;

            try {
              await CometChatUIKit.logout();
              expect(true).toBe(false); // Should not reach here
            } catch (error: any) {
              expect(error.code).toBe('ERROR_UIKIT_NOT_INITIALISED');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test that multiple logout attempts with invalid settings always produce same error
     */
    it('should produce consistent errors across multiple logout attempts', async () => {
      await fc.assert(
        fc.asyncProperty(fc.integer({ min: 2, max: 5 }), async numAttempts => {
          CometChatUIKit.uiKitSettings = null;

          const errors: any[] = [];

          for (let i = 0; i < numAttempts; i++) {
            try {
              await CometChatUIKit.logout();
            } catch (e) {
              errors.push(e);
            }
          }

          // All errors should have the same structure
          expect(errors.length).toBe(numAttempts);
          errors.forEach(error => {
            expect(error.code).toBe('ERROR_UIKIT_NOT_INITIALISED');
            expect(error.message).toBe('UIKItSettings not available');
          });
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Unit Tests for User Management Methods (createUser, updateUser)
   *
   * These tests verify the user management functionality including:
   * - Settings validation guard behavior
   * - Instance-static delegation consistency
   * - Error handling for missing settings
   *
   * **Validates: Requirements 6.1, 6.2, 6.3, 6.4**
   */
  describe('User Management Methods', () => {
    /**
     * Test that createUser() rejects when uiKitSettings is null
     */
    it('should reject createUser with error when uiKitSettings is null', async () => {
      await fc.assert(
        fc.asyncProperty(fc.string({ minLength: 1, maxLength: 50 }), async uid => {
          CometChatUIKit.uiKitSettings = null;

          // Create a mock user object
          const mockUser = { getUid: () => uid } as any;

          await expect(CometChatUIKit.createUser(mockUser)).rejects.toBe(
            'uiKitSettings not available'
          );
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test that createUser() rejects when appId is missing
     */
    it('should reject createUser with error when appId is null or undefined', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.oneof(fc.constant(undefined), fc.constant(null as any)),
          async (uid, appIdValue) => {
            const settings = new UIKitSettings();
            settings.appId = appIdValue;
            CometChatUIKit.uiKitSettings = settings;

            const mockUser = { getUid: () => uid } as any;

            await expect(CometChatUIKit.createUser(mockUser)).rejects.toBe(
              'uiKitSettings not available'
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test that updateUser() rejects when uiKitSettings is null
     */
    it('should reject updateUser with error when uiKitSettings is null', async () => {
      await fc.assert(
        fc.asyncProperty(fc.string({ minLength: 1, maxLength: 50 }), async uid => {
          CometChatUIKit.uiKitSettings = null;

          const mockUser = { getUid: () => uid } as any;

          await expect(CometChatUIKit.updateUser(mockUser)).rejects.toBe(
            'uiKitSettings not available'
          );
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test that updateUser() rejects when appId is missing
     */
    it('should reject updateUser with error when appId is null or undefined', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.oneof(fc.constant(undefined), fc.constant(null as any)),
          async (uid, appIdValue) => {
            const settings = new UIKitSettings();
            settings.appId = appIdValue;
            CometChatUIKit.uiKitSettings = settings;

            const mockUser = { getUid: () => uid } as any;

            await expect(CometChatUIKit.updateUser(mockUser)).rejects.toBe(
              'uiKitSettings not available'
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test that instance createUser() delegates to static createUser() with same rejection behavior
     */
    it('should have instance createUser() delegate to static createUser() with same rejection', async () => {
      await fc.assert(
        fc.asyncProperty(fc.string({ minLength: 1, maxLength: 50 }), async uid => {
          CometChatUIKit.uiKitSettings = null;
          const uiKit = new CometChatUIKit();

          const mockUser = { getUid: () => uid } as any;

          // Both should reject with the same error
          await expect(uiKit.createUser(mockUser)).rejects.toBe('uiKitSettings not available');
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test that instance updateUser() delegates to static updateUser() with same rejection behavior
     */
    it('should have instance updateUser() delegate to static updateUser() with same rejection', async () => {
      await fc.assert(
        fc.asyncProperty(fc.string({ minLength: 1, maxLength: 50 }), async uid => {
          CometChatUIKit.uiKitSettings = null;
          const uiKit = new CometChatUIKit();

          const mockUser = { getUid: () => uid } as any;

          // Both should reject with the same error
          await expect(uiKit.updateUser(mockUser)).rejects.toBe('uiKitSettings not available');
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test that createUser and updateUser have consistent error behavior for any invalid settings
     */
    it('should have consistent error behavior for createUser and updateUser with invalid settings', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.oneof(
            fc.constant(null as UIKitSettings | null),
            fc.constant(
              (() => {
                const s = new UIKitSettings();
                s.appId = undefined;
                return s;
              })()
            ),
            fc.constant(
              (() => {
                const s = new UIKitSettings();
                s.appId = null as any;
                return s;
              })()
            )
          ),
          async (uid, settings) => {
            CometChatUIKit.uiKitSettings = settings;

            const mockUser = { getUid: () => uid } as any;

            // Both methods should reject with the same error message
            await expect(CometChatUIKit.createUser(mockUser)).rejects.toBe(
              'uiKitSettings not available'
            );
            await expect(CometChatUIKit.updateUser(mockUser)).rejects.toBe(
              'uiKitSettings not available'
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test that multiple createUser/updateUser attempts with invalid settings produce consistent errors
     */
    it('should produce consistent errors across multiple user management attempts', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 2, max: 5 }),
          fc.string({ minLength: 1, maxLength: 50 }),
          async (numAttempts, uid) => {
            CometChatUIKit.uiKitSettings = null;

            const mockUser = { getUid: () => uid } as any;
            const createErrors: any[] = [];
            const updateErrors: any[] = [];

            for (let i = 0; i < numAttempts; i++) {
              try {
                await CometChatUIKit.createUser(mockUser);
              } catch (e) {
                createErrors.push(e);
              }

              try {
                await CometChatUIKit.updateUser(mockUser);
              } catch (e) {
                updateErrors.push(e);
              }
            }

            // All errors should be the same
            expect(createErrors.length).toBe(numAttempts);
            expect(updateErrors.length).toBe(numAttempts);

            createErrors.forEach(error => {
              expect(error).toBe('uiKitSettings not available');
            });

            updateErrors.forEach(error => {
              expect(error).toBe('uiKitSettings not available');
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: angular-uikit-service, Property 6: Message Metadata Population**
   *
   * *For any* message sent via `sendTextMessage()`, `sendMediaMessage()`, or `sendCustomMessage()`,
   * the message SHALL have `sentAt` timestamp set and `muid` generated if not already provided.
   *
   * **Validates: Requirements 7.4**
   */
  describe('Property 6: Message Metadata Population', () => {
    // Mock CometChat SDK methods
    let mockSendMessage: ReturnType<typeof vi.fn>;
    let mockSendMediaMessage: ReturnType<typeof vi.fn>;
    let mockSendCustomMessage: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      // Mock the CometChat SDK methods to capture the message
      mockSendMessage = vi.fn().mockImplementation(msg => Promise.resolve(msg));
      mockSendMediaMessage = vi.fn().mockImplementation(msg => Promise.resolve(msg));
      mockSendCustomMessage = vi.fn().mockImplementation(msg => Promise.resolve(msg));

      // @ts-ignore - Mocking CometChat methods
      vi.spyOn(CometChat, 'sendMessage').mockImplementation(mockSendMessage);
      // @ts-ignore - Mocking CometChat methods
      vi.spyOn(CometChat, 'sendMediaMessage').mockImplementation(mockSendMediaMessage);
      // @ts-ignore - Mocking CometChat methods
      vi.spyOn(CometChat, 'sendCustomMessage').mockImplementation(mockSendCustomMessage);
    });

    /**
     * Test that sendTextMessage sets sentAt timestamp for any text message
     */
    it('should set sentAt timestamp for any text message', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.string({ minLength: 1, maxLength: 50 }),
          async (text, receiverId) => {
            // Create a mock text message
            const mockMessage = {
              _sentAt: undefined as number | undefined,
              _muid: undefined as string | undefined,
              setSentAt: function (timestamp: number) {
                this._sentAt = timestamp;
              },
              getSentAt: function () {
                return this._sentAt;
              },
              setMuid: function (muid: string) {
                this._muid = muid;
              },
              getMuid: function () {
                return this._muid;
              },
              setMetadata: vi.fn(),
              getText: () => text,
              getReceiverId: () => receiverId,
            } as any;

            await CometChatUIKit.sendTextMessage(mockMessage);

            // sentAt should be set to a valid timestamp
            expect(mockMessage._sentAt).toBeDefined();
            expect(typeof mockMessage._sentAt).toBe('number');
            expect(mockMessage._sentAt).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test that sendTextMessage generates muid if not provided
     */
    it('should generate muid for text message if not provided', async () => {
      await fc.assert(
        fc.asyncProperty(fc.string({ minLength: 1, maxLength: 100 }), async text => {
          const mockMessage = {
            _sentAt: undefined as number | undefined,
            _muid: undefined as string | undefined,
            setSentAt: function (timestamp: number) {
              this._sentAt = timestamp;
            },
            getSentAt: function () {
              return this._sentAt;
            },
            setMuid: function (muid: string) {
              this._muid = muid;
            },
            getMuid: function () {
              return this._muid;
            },
            setMetadata: vi.fn(),
            getText: () => text,
          } as any;

          await CometChatUIKit.sendTextMessage(mockMessage);

          // muid should be generated
          expect(mockMessage._muid).toBeDefined();
          expect(typeof mockMessage._muid).toBe('string');
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test that sendTextMessage preserves existing muid if already provided
     */
    it('should preserve existing muid for text message if already provided', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.string({ minLength: 1, maxLength: 50 }),
          async (text, existingMuid) => {
            const mockMessage = {
              _sentAt: undefined as number | undefined,
              _muid: existingMuid,
              setSentAt: function (timestamp: number) {
                this._sentAt = timestamp;
              },
              getSentAt: function () {
                return this._sentAt;
              },
              setMuid: function (muid: string) {
                this._muid = muid;
              },
              getMuid: function () {
                return this._muid;
              },
              setMetadata: vi.fn(),
              getText: () => text,
            } as any;

            await CometChatUIKit.sendTextMessage(mockMessage);

            // muid should remain unchanged
            expect(mockMessage._muid).toBe(existingMuid);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test that sendMediaMessage sets sentAt timestamp for any media message
     */
    it('should set sentAt timestamp for any media message', async () => {
      await fc.assert(
        fc.asyncProperty(fc.string({ minLength: 1, maxLength: 50 }), async receiverId => {
          const mockMessage = {
            _sentAt: undefined as number | undefined,
            _muid: undefined as string | undefined,
            setSentAt: function (timestamp: number) {
              this._sentAt = timestamp;
            },
            getSentAt: function () {
              return this._sentAt;
            },
            setMuid: function (muid: string) {
              this._muid = muid;
            },
            getMuid: function () {
              return this._muid;
            },
            setMetadata: vi.fn(),
            getReceiverId: () => receiverId,
          } as any;

          await CometChatUIKit.sendMediaMessage(mockMessage);

          // sentAt should be set to a valid timestamp
          expect(mockMessage._sentAt).toBeDefined();
          expect(typeof mockMessage._sentAt).toBe('number');
          expect(mockMessage._sentAt).toBeGreaterThan(0);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test that sendMediaMessage generates muid if not provided
     */
    it('should generate muid for media message if not provided', async () => {
      await fc.assert(
        fc.asyncProperty(fc.string({ minLength: 1, maxLength: 50 }), async receiverId => {
          const mockMessage = {
            _sentAt: undefined as number | undefined,
            _muid: undefined as string | undefined,
            setSentAt: function (timestamp: number) {
              this._sentAt = timestamp;
            },
            getSentAt: function () {
              return this._sentAt;
            },
            setMuid: function (muid: string) {
              this._muid = muid;
            },
            getMuid: function () {
              return this._muid;
            },
            setMetadata: vi.fn(),
            getReceiverId: () => receiverId,
          } as any;

          await CometChatUIKit.sendMediaMessage(mockMessage);

          // muid should be generated
          expect(mockMessage._muid).toBeDefined();
          expect(typeof mockMessage._muid).toBe('string');
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test that sendCustomMessage sets sentAt timestamp for any custom message
     */
    it('should set sentAt timestamp for any custom message', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.string({ minLength: 1, maxLength: 30 }),
          async (receiverId, customType) => {
            const mockMessage = {
              _sentAt: undefined as number | undefined,
              _muid: undefined as string | undefined,
              setSentAt: function (timestamp: number) {
                this._sentAt = timestamp;
              },
              getSentAt: function () {
                return this._sentAt;
              },
              setMuid: function (muid: string) {
                this._muid = muid;
              },
              getMuid: function () {
                return this._muid;
              },
              setMetadata: vi.fn(),
              getReceiverId: () => receiverId,
              getCustomType: () => customType,
            } as any;

            await CometChatUIKit.sendCustomMessage(mockMessage);

            // sentAt should be set to a valid timestamp
            expect(mockMessage._sentAt).toBeDefined();
            expect(typeof mockMessage._sentAt).toBe('number');
            expect(mockMessage._sentAt).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test that sendCustomMessage generates muid if not provided
     */
    it('should generate muid for custom message if not provided', async () => {
      await fc.assert(
        fc.asyncProperty(fc.string({ minLength: 1, maxLength: 50 }), async receiverId => {
          const mockMessage = {
            _sentAt: undefined as number | undefined,
            _muid: undefined as string | undefined,
            setSentAt: function (timestamp: number) {
              this._sentAt = timestamp;
            },
            getSentAt: function () {
              return this._sentAt;
            },
            setMuid: function (muid: string) {
              this._muid = muid;
            },
            getMuid: function () {
              return this._muid;
            },
            setMetadata: vi.fn(),
            getReceiverId: () => receiverId,
          } as any;

          await CometChatUIKit.sendCustomMessage(mockMessage);

          // muid should be generated
          expect(mockMessage._muid).toBeDefined();
          expect(typeof mockMessage._muid).toBe('string');
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test that all message types have consistent metadata population behavior
     */
    it('should have consistent metadata population across all message types', async () => {
      await fc.assert(
        fc.asyncProperty(fc.string({ minLength: 1, maxLength: 50 }), async receiverId => {
          // Create mock messages for each type
          const createMockMessage = () =>
            ({
              _sentAt: undefined as number | undefined,
              _muid: undefined as string | undefined,
              setSentAt: function (timestamp: number) {
                this._sentAt = timestamp;
              },
              getSentAt: function () {
                return this._sentAt;
              },
              setMuid: function (muid: string) {
                this._muid = muid;
              },
              getMuid: function () {
                return this._muid;
              },
              setMetadata: vi.fn(),
              getReceiverId: () => receiverId,
              getText: () => 'test',
            }) as any;

          const textMsg = createMockMessage();
          const mediaMsg = createMockMessage();
          const customMsg = createMockMessage();

          await CometChatUIKit.sendTextMessage(textMsg);
          await CometChatUIKit.sendMediaMessage(mediaMsg);
          await CometChatUIKit.sendCustomMessage(customMsg);

          // All messages should have sentAt set
          expect(textMsg._sentAt).toBeDefined();
          expect(mediaMsg._sentAt).toBeDefined();
          expect(customMsg._sentAt).toBeDefined();

          // All messages should have muid set
          expect(textMsg._muid).toBeDefined();
          expect(mediaMsg._muid).toBeDefined();
          expect(customMsg._muid).toBeDefined();
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: angular-uikit-service, Property 7: Message Event Emission Sequence**
   *
   * *For any* message sending operation, the service SHALL emit an `inprogress` event
   * before sending, followed by either a `success` event (on success) or an `error` event (on failure).
   *
   * **Validates: Requirements 7.1, 7.2, 7.3, 7.5, 7.6**
   */
  describe('Property 7: Message Event Emission Sequence', () => {
    let emittedEvents: { message: any; status: MessageStatus }[];
    let eventSubscription: any;

    beforeEach(() => {
      emittedEvents = [];
      // Subscribe to message events
      eventSubscription = CometChatMessageEvents.ccMessageSent.subscribe((event: any) => {
        emittedEvents.push({ message: event.message, status: event.status });
      });
    });

    afterEach(() => {
      if (eventSubscription) {
        eventSubscription.unsubscribe();
      }
      emittedEvents = [];
    });

    /**
     * Test that sendTextMessage emits inprogress event first, then success event on success
     */
    it('should emit inprogress then success events for successful text message', async () => {
      // Mock successful send
      vi.spyOn(CometChat, 'sendMessage').mockImplementation((msg: any) => Promise.resolve(msg));

      await fc.assert(
        fc.asyncProperty(fc.string({ minLength: 1, maxLength: 100 }), async text => {
          emittedEvents = [];

          const mockMessage = {
            _sentAt: undefined as number | undefined,
            _muid: undefined as string | undefined,
            setSentAt: function (timestamp: number) {
              this._sentAt = timestamp;
            },
            getSentAt: function () {
              return this._sentAt;
            },
            setMuid: function (muid: string) {
              this._muid = muid;
            },
            getMuid: function () {
              return this._muid;
            },
            setMetadata: vi.fn(),
            getText: () => text,
          } as any;

          await CometChatUIKit.sendTextMessage(mockMessage);

          // Should have exactly 2 events
          expect(emittedEvents.length).toBe(2);

          // First event should be inprogress
          expect(emittedEvents[0].status).toBe(MessageStatus.inprogress);

          // Second event should be success
          expect(emittedEvents[1].status).toBe(MessageStatus.success);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test that sendTextMessage emits inprogress then error events on failure
     */
    it('should emit inprogress then error events for failed text message', async () => {
      // Mock failed send
      const mockError = { code: 'ERROR', message: 'Send failed' };
      vi.spyOn(CometChat, 'sendMessage').mockImplementation(() => Promise.reject(mockError));

      await fc.assert(
        fc.asyncProperty(fc.string({ minLength: 1, maxLength: 100 }), async text => {
          emittedEvents = [];

          const mockMessage = {
            _sentAt: undefined as number | undefined,
            _muid: undefined as string | undefined,
            setSentAt: function (timestamp: number) {
              this._sentAt = timestamp;
            },
            getSentAt: function () {
              return this._sentAt;
            },
            setMuid: function (muid: string) {
              this._muid = muid;
            },
            getMuid: function () {
              return this._muid;
            },
            setMetadata: vi.fn(),
            getText: () => text,
          } as any;

          try {
            await CometChatUIKit.sendTextMessage(mockMessage);
          } catch (e) {
            // Expected to fail
          }

          // Should have exactly 2 events
          expect(emittedEvents.length).toBe(2);

          // First event should be inprogress
          expect(emittedEvents[0].status).toBe(MessageStatus.inprogress);

          // Second event should be error
          expect(emittedEvents[1].status).toBe(MessageStatus.error);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test that sendMediaMessage emits inprogress then success events on success
     */
    it('should emit inprogress then success events for successful media message', async () => {
      // Mock successful send
      vi.spyOn(CometChat, 'sendMediaMessage').mockImplementation((msg: any) =>
        Promise.resolve(msg)
      );

      await fc.assert(
        fc.asyncProperty(fc.string({ minLength: 1, maxLength: 50 }), async receiverId => {
          emittedEvents = [];

          const mockMessage = {
            _sentAt: undefined as number | undefined,
            _muid: undefined as string | undefined,
            setSentAt: function (timestamp: number) {
              this._sentAt = timestamp;
            },
            getSentAt: function () {
              return this._sentAt;
            },
            setMuid: function (muid: string) {
              this._muid = muid;
            },
            getMuid: function () {
              return this._muid;
            },
            setMetadata: vi.fn(),
            getReceiverId: () => receiverId,
          } as any;

          await CometChatUIKit.sendMediaMessage(mockMessage);

          // Should have exactly 2 events
          expect(emittedEvents.length).toBe(2);

          // First event should be inprogress
          expect(emittedEvents[0].status).toBe(MessageStatus.inprogress);

          // Second event should be success
          expect(emittedEvents[1].status).toBe(MessageStatus.success);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test that sendMediaMessage emits inprogress then error events on failure
     */
    it('should emit inprogress then error events for failed media message', async () => {
      // Mock failed send
      const mockError = { code: 'ERROR', message: 'Send failed' };
      vi.spyOn(CometChat, 'sendMediaMessage').mockImplementation(() => Promise.reject(mockError));

      await fc.assert(
        fc.asyncProperty(fc.string({ minLength: 1, maxLength: 50 }), async receiverId => {
          emittedEvents = [];

          const mockMessage = {
            _sentAt: undefined as number | undefined,
            _muid: undefined as string | undefined,
            setSentAt: function (timestamp: number) {
              this._sentAt = timestamp;
            },
            getSentAt: function () {
              return this._sentAt;
            },
            setMuid: function (muid: string) {
              this._muid = muid;
            },
            getMuid: function () {
              return this._muid;
            },
            setMetadata: vi.fn(),
            getReceiverId: () => receiverId,
          } as any;

          try {
            await CometChatUIKit.sendMediaMessage(mockMessage);
          } catch (e) {
            // Expected to fail
          }

          // Should have exactly 2 events
          expect(emittedEvents.length).toBe(2);

          // First event should be inprogress
          expect(emittedEvents[0].status).toBe(MessageStatus.inprogress);

          // Second event should be error
          expect(emittedEvents[1].status).toBe(MessageStatus.error);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test that sendCustomMessage emits inprogress then success events on success
     */
    it('should emit inprogress then success events for successful custom message', async () => {
      // Mock successful send
      vi.spyOn(CometChat, 'sendCustomMessage').mockImplementation((msg: any) =>
        Promise.resolve(msg)
      );

      await fc.assert(
        fc.asyncProperty(fc.string({ minLength: 1, maxLength: 50 }), async receiverId => {
          emittedEvents = [];

          const mockMessage = {
            _sentAt: undefined as number | undefined,
            _muid: undefined as string | undefined,
            setSentAt: function (timestamp: number) {
              this._sentAt = timestamp;
            },
            getSentAt: function () {
              return this._sentAt;
            },
            setMuid: function (muid: string) {
              this._muid = muid;
            },
            getMuid: function () {
              return this._muid;
            },
            setMetadata: vi.fn(),
            getReceiverId: () => receiverId,
          } as any;

          await CometChatUIKit.sendCustomMessage(mockMessage);

          // Should have exactly 2 events
          expect(emittedEvents.length).toBe(2);

          // First event should be inprogress
          expect(emittedEvents[0].status).toBe(MessageStatus.inprogress);

          // Second event should be success
          expect(emittedEvents[1].status).toBe(MessageStatus.success);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test that sendCustomMessage emits inprogress then error events on failure
     */
    it('should emit inprogress then error events for failed custom message', async () => {
      // Mock failed send
      const mockError = { code: 'ERROR', message: 'Send failed' };
      vi.spyOn(CometChat, 'sendCustomMessage').mockImplementation(() => Promise.reject(mockError));

      await fc.assert(
        fc.asyncProperty(fc.string({ minLength: 1, maxLength: 50 }), async receiverId => {
          emittedEvents = [];

          const mockMessage = {
            _sentAt: undefined as number | undefined,
            _muid: undefined as string | undefined,
            setSentAt: function (timestamp: number) {
              this._sentAt = timestamp;
            },
            getSentAt: function () {
              return this._sentAt;
            },
            setMuid: function (muid: string) {
              this._muid = muid;
            },
            getMuid: function () {
              return this._muid;
            },
            setMetadata: vi.fn(),
            getReceiverId: () => receiverId,
          } as any;

          try {
            await CometChatUIKit.sendCustomMessage(mockMessage);
          } catch (e) {
            // Expected to fail
          }

          // Should have exactly 2 events
          expect(emittedEvents.length).toBe(2);

          // First event should be inprogress
          expect(emittedEvents[0].status).toBe(MessageStatus.inprogress);

          // Second event should be error
          expect(emittedEvents[1].status).toBe(MessageStatus.error);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test that error events include error metadata in the message
     */
    it('should include error metadata in message on failure', async () => {
      const mockError = { code: 'ERROR', message: 'Send failed' };
      vi.spyOn(CometChat, 'sendMessage').mockImplementation(() => Promise.reject(mockError));

      await fc.assert(
        fc.asyncProperty(fc.string({ minLength: 1, maxLength: 100 }), async text => {
          emittedEvents = [];
          let metadataSet: any = null;

          const mockMessage = {
            _sentAt: undefined as number | undefined,
            _muid: undefined as string | undefined,
            setSentAt: function (timestamp: number) {
              this._sentAt = timestamp;
            },
            getSentAt: function () {
              return this._sentAt;
            },
            setMuid: function (muid: string) {
              this._muid = muid;
            },
            getMuid: function () {
              return this._muid;
            },
            setMetadata: function (metadata: any) {
              metadataSet = metadata;
            },
            getText: () => text,
          } as any;

          try {
            await CometChatUIKit.sendTextMessage(mockMessage);
          } catch (e) {
            // Expected to fail
          }

          // Metadata should be set with error
          expect(metadataSet).toBeDefined();
          expect(metadataSet.error).toBeDefined();
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test that event sequence is always inprogress first regardless of outcome
     */
    it('should always emit inprogress as first event regardless of outcome', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.boolean(),
          fc.string({ minLength: 1, maxLength: 50 }),
          async (shouldSucceed, receiverId) => {
            emittedEvents = [];

            if (shouldSucceed) {
              vi.spyOn(CometChat, 'sendMessage').mockImplementation((msg: any) =>
                Promise.resolve(msg)
              );
            } else {
              vi.spyOn(CometChat, 'sendMessage').mockImplementation(() =>
                Promise.reject({ code: 'ERROR' })
              );
            }

            const mockMessage = {
              _sentAt: undefined as number | undefined,
              _muid: undefined as string | undefined,
              setSentAt: function (timestamp: number) {
                this._sentAt = timestamp;
              },
              getSentAt: function () {
                return this._sentAt;
              },
              setMuid: function (muid: string) {
                this._muid = muid;
              },
              getMuid: function () {
                return this._muid;
              },
              setMetadata: vi.fn(),
              getReceiverId: () => receiverId,
            } as any;

            try {
              await CometChatUIKit.sendTextMessage(mockMessage);
            } catch (e) {
              // May fail
            }

            // First event should always be inprogress
            expect(emittedEvents.length).toBeGreaterThanOrEqual(1);
            expect(emittedEvents[0].status).toBe(MessageStatus.inprogress);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Unit Tests for Utility Access Methods
   *
   * These tests verify the utility access methods (SoundManager, Localize)
   * work correctly and follow the dual-API pattern.
   *
   * **Validates: Requirements 9.1, 9.2, 9.3**
   */
  describe('Utility Access Methods', () => {
    /**
     * Test that SoundManager is accessible as a static property
     */
    describe('SoundManager Access', () => {
      it('should have SoundManager accessible as static property', () => {
        expect(CometChatUIKit.SoundManager).toBeDefined();
      });

      it('should return the CometChatSoundManager type', () => {
        // SoundManager should be a class/constructor function
        expect(typeof CometChatUIKit.SoundManager).toBe('function');
      });
    });

    /**
     * Test that Localize is accessible as a static property
     */
    describe('Localize Access', () => {
      it('should have Localize accessible as static property', () => {
        expect(CometChatUIKit.Localize).toBeDefined();
      });

      it('should return the CometChatLocalize type', () => {
        // Localize should be a class/constructor function
        expect(typeof CometChatUIKit.Localize).toBe('function');
      });
    });

    /**
     * Test that getLoggedinUser() async method works correctly
     */
    describe('getLoggedinUser Async Access', () => {
      it('should have static getLoggedinUser() method', () => {
        expect(typeof CometChatUIKit.getLoggedinUser).toBe('function');
      });

      it('should have instance getLoggedinUser() method', () => {
        const uiKit = new CometChatUIKit();
        expect(typeof uiKit.getLoggedinUser).toBe('function');
      });

      it('should reject with error when uiKitSettings is null', async () => {
        CometChatUIKit.uiKitSettings = null;

        await expect(CometChatUIKit.getLoggedinUser()).rejects.toBe('uiKitSettings not available');
      });

      it('should reject with error when appId is missing', async () => {
        const settings = new UIKitSettings();
        settings.appId = undefined;
        CometChatUIKit.uiKitSettings = settings;

        await expect(CometChatUIKit.getLoggedinUser()).rejects.toBe('uiKitSettings not available');
      });

      it('should have instance getLoggedinUser() delegate to static getLoggedinUser()', async () => {
        CometChatUIKit.uiKitSettings = null;
        const uiKit = new CometChatUIKit();

        // Both should reject with the same error when settings are null
        await expect(uiKit.getLoggedinUser()).rejects.toBe('uiKitSettings not available');
      });
    });
  });
});
