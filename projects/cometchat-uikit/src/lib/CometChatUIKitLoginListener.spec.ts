/**
 * CometChatUIKitLoginListener Tests
 *
 * Spec for the login listener shim. In the Angular kit its static methods are
 * intentionally no-ops; logged-in state lives on CometChatUIKit.
 *
 * Uses mock utilities from testing/ — no inline mocks.
 *
 * Validates: Requirements 8.1, 8.2, 8.9
 *
 * @module CometChatUIKitLoginListener
 */
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatUIKitLoginListener } from './CometChatUIKitLoginListener';
import { createMockUser } from './testing';

describe('CometChatUIKitLoginListener', () => {
  // -------------------------------------------------------------------------
  // Default Render / Instantiation
  // -------------------------------------------------------------------------
  describe('Class structure', () => {
    it('should be defined', () => {
      expect(CometChatUIKitLoginListener).toBeDefined();
    });
  });

  // -------------------------------------------------------------------------
  // The Angular kit tracks the logged-in user on CometChatUIKit itself
  // (CometChatUIKit._loggedInUser); this class is a compatibility shim whose
  // methods are intentionally no-ops. These tests pin that contract so a
  // future change that adds side effects is noticed.
  // -------------------------------------------------------------------------
  describe('setLoggedInUser', () => {
    it('should accept a User object without throwing, returning undefined and leaving the user unmodified', () => {
      const mockUser = createMockUser({ uid: 'login-listener-user', name: 'Login User' });
      const ownKeysBefore = Object.keys(mockUser).sort();

      let result: unknown = 'not-called';
      expect(() => {
        result = CometChatUIKitLoginListener.setLoggedInUser(mockUser);
      }).not.toThrow();

      expect(result).toBeUndefined();
      expect(Object.keys(mockUser).sort()).toEqual(ownKeysBefore);
      expect(mockUser.getUid()).toBe('login-listener-user');
      expect(mockUser.getName()).toBe('Login User');
    });
  });

  describe('removeLoggedInUser', () => {
    it('should execute without throwing and return undefined', () => {
      CometChatUIKitLoginListener.setLoggedInUser(createMockUser());
      let result: unknown = 'not-called';
      expect(() => {
        result = CometChatUIKitLoginListener.removeLoggedInUser();
      }).not.toThrow();
      expect(result).toBeUndefined();
      // No user getter exists on the shim — state lives on CometChatUIKit.
      expect((CometChatUIKitLoginListener as unknown as Record<string, unknown>)['getLoggedInUser']).toBeUndefined();
    });
  });

  describe('attachListener', () => {
    it('should execute without throwing and not register an SDK login listener (no-op shim)', () => {
      const addLoginListener = vi.fn();
      const original = (CometChat as unknown as Record<string, unknown>)['addLoginListener'];
      (CometChat as unknown as Record<string, unknown>)['addLoginListener'] = addLoginListener;
      try {
        let result: unknown = 'not-called';
        expect(() => {
          result = CometChatUIKitLoginListener.attachListener();
        }).not.toThrow();
        expect(result).toBeUndefined();
        expect(addLoginListener).not.toHaveBeenCalled();
      } finally {
        (CometChat as unknown as Record<string, unknown>)['addLoginListener'] = original;
      }
    });
  });

  describe('Error handling', () => {
    it('should handle null user gracefully in setLoggedInUser', () => {
      let result: unknown = 'not-called';
      expect(() => {
        result = CometChatUIKitLoginListener.setLoggedInUser(null as unknown as CometChat.User);
      }).not.toThrow();
      expect(result).toBeUndefined();
      expect(() =>
        CometChatUIKitLoginListener.setLoggedInUser(undefined as unknown as CometChat.User)
      ).not.toThrow();
    });
  });
});
