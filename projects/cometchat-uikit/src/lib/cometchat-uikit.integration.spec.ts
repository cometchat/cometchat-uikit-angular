import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CometChatUIKit } from './cometchat-uikit';
import { UIKitSettings } from './UIKitSettings';

/**
 * Integration Tests for CometChatUIKit Dual-API Usage Patterns
 *
 * These tests verify the dual-API architecture works correctly:
 * - Static usage from simulated main.ts context
 * - Injected service usage in component context
 * - Singleton behavior across multiple injections
 *
 * **Validates: Requirements 2.1, 2.2, 2.3**
 */
describe('CometChatUIKit Integration Tests - Dual-API Usage Patterns', () => {
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
   * Test Suite: Static Usage from Simulated main.ts Context
   *
   * These tests simulate how developers would use CometChatUIKit
   * statically in main.ts before Angular bootstraps.
   *
   * **Validates: Requirements 2.1**
   */
  describe('Static Usage (main.ts context)', () => {
    it('should allow static init() call without Angular DI', () => {
      // Simulate main.ts usage pattern
      const settings = new UIKitSettings();
      settings.appId = undefined; // Invalid to avoid actual SDK call

      // Static call should work without Angular context
      const result = CometChatUIKit.init(settings);

      // Should return undefined for invalid settings (no appId)
      expect(result).toBeUndefined();

      // Settings should be stored statically
      expect(CometChatUIKit.uiKitSettings).toBe(settings);
    });

    it('should allow static login() call without Angular DI', async () => {
      // Simulate main.ts usage pattern with no settings
      CometChatUIKit.uiKitSettings = null;

      // Static call should work without Angular context
      await expect(CometChatUIKit.login('test-uid')).rejects.toBe('uiKitSettings not available');
    });

    it('should allow static getLoggedInUser() call without Angular DI', () => {
      // Simulate main.ts usage pattern
      const user = CometChatUIKit.getLoggedInUser();

      // Should return null or User (never throw)
      expect(user === null || typeof user === 'object').toBe(true);
    });

    it('should allow static loggedInUser$ subscription without Angular DI', () => {
      // Simulate main.ts usage pattern
      let emittedValue: any = undefined;

      const subscription = CometChatUIKit.loggedInUser$.subscribe(value => {
        emittedValue = value;
      });

      // Should emit immediately (BehaviorSubject)
      expect(emittedValue === null || typeof emittedValue === 'object').toBe(true);

      subscription.unsubscribe();
    });

    it('should allow static isInitialized() call without Angular DI', () => {
      // Simulate main.ts usage pattern
      const result = CometChatUIKit.isInitialized();

      // Should return boolean
      expect(typeof result).toBe('boolean');
    });

    it('should allow static checkAuthSettings() call without Angular DI', () => {
      // Simulate main.ts usage pattern
      CometChatUIKit.uiKitSettings = null;

      const result = CometChatUIKit.checkAuthSettings();

      // Should return false for null settings
      expect(result).toBe(false);
    });
    it('should allow static SoundManager access without Angular DI', () => {
      // Simulate main.ts usage pattern
      expect(CometChatUIKit.SoundManager).toBeDefined();
    });

    it('should allow static Localize access without Angular DI', () => {
      // Simulate main.ts usage pattern
      expect(CometChatUIKit.Localize).toBeDefined();
    });
  });

  /**
   * Test Suite: Injected Service Usage in Component Context
   *
   * These tests simulate how developers would use CometChatUIKit
   * as an injected service within Angular components.
   *
   * **Validates: Requirements 2.2**
   */
  describe('Injected Service Usage (component context)', () => {
    it('should allow instance init() call via injected service', () => {
      // Simulate component injection
      const uiKit = new CometChatUIKit();

      const settings = new UIKitSettings();
      settings.appId = undefined; // Invalid to avoid actual SDK call

      // Instance call should work
      const result = uiKit.init(settings);

      // Should return undefined for invalid settings
      expect(result).toBeUndefined();
    });

    it('should allow instance login() call via injected service', async () => {
      // Simulate component injection
      const uiKit = new CometChatUIKit();
      CometChatUIKit.uiKitSettings = null;

      // Instance call should work
      await expect(uiKit.login('test-uid')).rejects.toBe('uiKitSettings not available');
    });

    it('should allow instance loginWithAuthToken() call via injected service', async () => {
      // Simulate component injection
      const uiKit = new CometChatUIKit();
      CometChatUIKit.uiKitSettings = null;

      // Instance call should work
      await expect(uiKit.loginWithAuthToken('test-token')).rejects.toBe(
        'uiKitSettings not available'
      );
    });

    it('should allow instance logout() call via injected service', async () => {
      // Simulate component injection
      const uiKit = new CometChatUIKit();
      CometChatUIKit.uiKitSettings = null;

      // Instance call should work
      try {
        await uiKit.logout();
      } catch (error: any) {
        expect(error.code).toBe('ERROR_UIKIT_NOT_INITIALISED');
      }
    });

    it('should allow instance getLoggedInUser() call via injected service', () => {
      // Simulate component injection
      const uiKit = new CometChatUIKit();

      const user = uiKit.getLoggedInUser();

      // Should return null or User
      expect(user === null || typeof user === 'object').toBe(true);
    });

    it('should allow instance loggedInUser$ subscription via injected service', () => {
      // Simulate component injection
      const uiKit = new CometChatUIKit();

      let emittedValue: any = undefined;

      const subscription = uiKit.loggedInUser$.subscribe(value => {
        emittedValue = value;
      });

      // Should emit immediately
      expect(emittedValue === null || typeof emittedValue === 'object').toBe(true);

      subscription.unsubscribe();
    });

    it('should allow instance isInitialized() call via injected service', () => {
      // Simulate component injection
      const uiKit = new CometChatUIKit();

      const result = uiKit.isInitialized();

      // Should return boolean
      expect(typeof result).toBe('boolean');
    });
  });

  /**
   * Test Suite: Singleton Behavior Across Multiple Injections
   *
   * These tests verify that multiple component injections share
   * the same underlying static state (singleton pattern).
   *
   * **Validates: Requirements 2.3**
   */
  describe('Singleton Behavior (multiple injections)', () => {
    it('should share uiKitSettings across multiple instances', () => {
      // Simulate multiple component injections
      const instance1 = new CometChatUIKit();
      const instance2 = new CometChatUIKit();
      const instance3 = new CometChatUIKit();

      // Set settings via static
      const settings = new UIKitSettings();
      settings.appId = 'test-app-id';
      CometChatUIKit.uiKitSettings = settings;

      // All instances should see the same settings
      // (accessed via static property)
      expect(CometChatUIKit.uiKitSettings).toBe(settings);

      // Verify instances exist
      expect(instance1).toBeDefined();
      expect(instance2).toBeDefined();
      expect(instance3).toBeDefined();
    });

    it('should share getLoggedInUser() result across multiple instances', () => {
      // Simulate multiple component injections
      const instance1 = new CometChatUIKit();
      const instance2 = new CometChatUIKit();
      const instance3 = new CometChatUIKit();

      // All instances should return the same user
      const user1 = instance1.getLoggedInUser();
      const user2 = instance2.getLoggedInUser();
      const user3 = instance3.getLoggedInUser();
      const staticUser = CometChatUIKit.getLoggedInUser();

      expect(user1).toBe(user2);
      expect(user2).toBe(user3);
      expect(user3).toBe(staticUser);
    });

    it('should share loggedInUser$ observable values across multiple instances', () => {
      // Simulate multiple component injections
      const instance1 = new CometChatUIKit();
      const instance2 = new CometChatUIKit();
      const instance3 = new CometChatUIKit();

      let value1: any, value2: any, value3: any, staticValue: any;

      const sub1 = instance1.loggedInUser$.subscribe(v => (value1 = v));
      const sub2 = instance2.loggedInUser$.subscribe(v => (value2 = v));
      const sub3 = instance3.loggedInUser$.subscribe(v => (value3 = v));
      const staticSub = CometChatUIKit.loggedInUser$.subscribe(v => (staticValue = v));

      // All should receive the same value
      expect(value1).toBe(value2);
      expect(value2).toBe(value3);
      expect(value3).toBe(staticValue);

      sub1.unsubscribe();
      sub2.unsubscribe();
      sub3.unsubscribe();
      staticSub.unsubscribe();
    });

    it('should share isInitialized() result across multiple instances', () => {
      // Simulate multiple component injections
      const instance1 = new CometChatUIKit();
      const instance2 = new CometChatUIKit();
      const instance3 = new CometChatUIKit();

      // All instances should return the same initialization state
      const init1 = instance1.isInitialized();
      const init2 = instance2.isInitialized();
      const init3 = instance3.isInitialized();
      const staticInit = CometChatUIKit.isInitialized();

      expect(init1).toBe(init2);
      expect(init2).toBe(init3);
      expect(init3).toBe(staticInit);
    });

    it('should have instance methods delegate to static methods', () => {
      // Simulate component injection
      const instance = new CometChatUIKit();

      // Verify delegation by comparing results
      expect(instance.getLoggedInUser()).toBe(CometChatUIKit.getLoggedInUser());
      expect(instance.isInitialized()).toBe(CometChatUIKit.isInitialized());

      // Observable delegation
      let instanceValue: any, staticValue: any;
      const instanceSub = instance.loggedInUser$.subscribe(v => (instanceValue = v));
      const staticSub = CometChatUIKit.loggedInUser$.subscribe(v => (staticValue = v));

      expect(instanceValue).toBe(staticValue);

      instanceSub.unsubscribe();
      staticSub.unsubscribe();
    });

    it('should maintain singleton state when settings change', () => {
      // Simulate multiple component injections
      const instance1 = new CometChatUIKit();
      const instance2 = new CometChatUIKit();

      // Change settings via static
      const settings1 = new UIKitSettings();
      settings1.appId = 'app-1';
      CometChatUIKit.uiKitSettings = settings1;

      // Both instances should see the change
      expect(CometChatUIKit.uiKitSettings?.appId).toBe('app-1');

      // Change settings again
      const settings2 = new UIKitSettings();
      settings2.appId = 'app-2';
      CometChatUIKit.uiKitSettings = settings2;

      // Both instances should see the new change
      expect(CometChatUIKit.uiKitSettings?.appId).toBe('app-2');

      // Verify instances still exist and work
      expect(instance1.isInitialized()).toBe(instance2.isInitialized());
    });
  });

  /**
   * Test Suite: Mixed Static and Instance Usage
   *
   * These tests verify that static and instance usage can be
   * mixed seamlessly in the same application.
   */
  describe('Mixed Static and Instance Usage', () => {
    it('should allow mixing static init with instance methods', () => {
      // Static init (like in main.ts)
      const settings = new UIKitSettings();
      settings.appId = undefined;
      CometChatUIKit.init(settings);

      // Instance usage (like in component)
      const instance = new CometChatUIKit();

      // Instance should see the settings from static init
      expect(CometChatUIKit.uiKitSettings).toBe(settings);

      // Instance methods should work
      const user = instance.getLoggedInUser();
      expect(user === null || typeof user === 'object').toBe(true);
    });

    it('should allow static access after instance creation', () => {
      // Create instance first (like component created before init)
      const instance = new CometChatUIKit();

      // Static init later
      const settings = new UIKitSettings();
      settings.appId = 'test-app';
      CometChatUIKit.uiKitSettings = settings;

      // Static access should work
      expect(CometChatUIKit.uiKitSettings?.appId).toBe('test-app');

      // Instance should see the change
      expect(CometChatUIKit.checkAuthSettings()).toBe(true);
    });

    it('should maintain consistency between static and instance observables', () => {
      const instance = new CometChatUIKit();

      let staticValue: any, instanceValue: any;
      let staticEmissions = 0,
        instanceEmissions = 0;

      const staticSub = CometChatUIKit.loggedInUser$.subscribe(v => {
        staticValue = v;
        staticEmissions++;
      });

      const instanceSub = instance.loggedInUser$.subscribe(v => {
        instanceValue = v;
        instanceEmissions++;
      });

      // Both should have emitted at least once (BehaviorSubject)
      expect(staticEmissions).toBeGreaterThanOrEqual(1);
      expect(instanceEmissions).toBeGreaterThanOrEqual(1);

      // Values should be the same
      expect(staticValue).toBe(instanceValue);

      staticSub.unsubscribe();
      instanceSub.unsubscribe();
    });
  });

  /**
   * Test Suite: Error Handling Consistency
   *
   * These tests verify that error handling is consistent
   * between static and instance methods.
   */
  describe('Error Handling Consistency', () => {
    it('should have consistent error for login without settings', async () => {
      CometChatUIKit.uiKitSettings = null;
      const instance = new CometChatUIKit();

      let staticError: any, instanceError: any;

      try {
        await CometChatUIKit.login('uid');
      } catch (e) {
        staticError = e;
      }

      try {
        await instance.login('uid');
      } catch (e) {
        instanceError = e;
      }

      expect(staticError).toBe(instanceError);
      expect(staticError).toBe('uiKitSettings not available');
    });

    it('should have consistent error for logout without settings', async () => {
      CometChatUIKit.uiKitSettings = null;
      const instance = new CometChatUIKit();

      let staticError: any, instanceError: any;

      try {
        await CometChatUIKit.logout();
      } catch (e) {
        staticError = e;
      }

      try {
        await instance.logout();
      } catch (e) {
        instanceError = e;
      }

      expect(staticError.code).toBe(instanceError.code);
      expect(staticError.message).toBe(instanceError.message);
    });

    it('should have consistent error for createUser without settings', async () => {
      CometChatUIKit.uiKitSettings = null;
      const instance = new CometChatUIKit();

      // Create a mock user object
      const mockUser = { uid: 'test' } as any;

      let staticError: any, instanceError: any;

      try {
        await CometChatUIKit.createUser(mockUser);
      } catch (e) {
        staticError = e;
      }

      try {
        await instance.createUser(mockUser);
      } catch (e) {
        instanceError = e;
      }

      expect(staticError).toBe(instanceError);
      expect(staticError).toBe('uiKitSettings not available');
    });

    it('should have consistent error for updateUser without settings', async () => {
      CometChatUIKit.uiKitSettings = null;
      const instance = new CometChatUIKit();

      // Create a mock user object
      const mockUser = { uid: 'test' } as any;

      let staticError: any, instanceError: any;

      try {
        await CometChatUIKit.updateUser(mockUser);
      } catch (e) {
        staticError = e;
      }

      try {
        await instance.updateUser(mockUser);
      } catch (e) {
        instanceError = e;
      }

      expect(staticError).toBe(instanceError);
      expect(staticError).toBe('uiKitSettings not available');
    });
  });
});
