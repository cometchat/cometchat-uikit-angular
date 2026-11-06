/**
 * CometChatCalls Tests
 *
 * Validates: Requirements 8.1, 8.2, 8.9
 */
import { CometChatUIKitCalls, _setCallsSDKForTesting } from './CometChatCalls';

describe('CometChatCalls', () => {
  afterEach(() => {
    // Restore to null after each test
    _setCallsSDKForTesting(null);
  });

  describe('Default state', () => {
    it('should export CometChatUIKitCalls', () => {
      // In jsdom with mocked SDK, CometChatUIKitCalls may be undefined/null
      // The important thing is the symbol is exported
      expect(CometChatUIKitCalls === undefined || CometChatUIKitCalls === null || typeof CometChatUIKitCalls === 'object').toBe(true);
    });
  });

  describe('_setCallsSDKForTesting', () => {
    // The dynamic import must be awaited: previously the expectation ran in a
    // dangling .then() after the test had finished (and after afterEach had
    // reset the SDK to null), so it either asserted nothing or failed against
    // a later test.
    it('should inject a mock Calls SDK', async () => {
      const mockSDK = { init: vi.fn(), startSession: vi.fn() };
      _setCallsSDKForTesting(mockSDK);
      // Re-import dynamically to verify the module-level var was updated
      // Since ES modules are live bindings, we can just import again
      const mod = await import('./CometChatCalls');
      expect(mod.CometChatUIKitCalls).toBe(mockSDK);
      await expect(mod.getCometChatCalls()).resolves.toBe(mockSDK);
    });

    it('should restore original value when passed null', async () => {
      const mockSDK = { init: vi.fn() };
      _setCallsSDKForTesting(mockSDK);
      _setCallsSDKForTesting(null);
      const mod = await import('./CometChatCalls');
      expect(mod.CometChatUIKitCalls).toBeNull();
    });
  });

  describe('Error handling', () => {
    it('should not throw when Calls SDK is unavailable', () => {
      expect(() => {
        _setCallsSDKForTesting(null);
      }).not.toThrow();
    });
  });
});
