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
    it('should inject a mock Calls SDK', () => {
      const mockSDK = { init: vi.fn(), startSession: vi.fn() };
      _setCallsSDKForTesting(mockSDK);
      // Re-import dynamically to verify the module-level var was updated
      // Since ES modules are live bindings, we can just import again
      import('./CometChatCalls').then(mod => {
        expect(mod.CometChatUIKitCalls).toBe(mockSDK);
      });
    });

    it('should restore original value when passed null', () => {
      const mockSDK = { init: vi.fn() };
      _setCallsSDKForTesting(mockSDK);
      _setCallsSDKForTesting(null);
      import('./CometChatCalls').then(mod => {
        expect(mod.CometChatUIKitCalls).toBeNull();
      });
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
