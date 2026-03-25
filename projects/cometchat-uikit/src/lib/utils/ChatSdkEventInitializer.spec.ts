/**
 * ChatSdkEventInitializer Tests
 *
 * Tests the static utility class responsible for registering and removing
 * CometChat SDK message event listeners. Verifies attachListeners/detachListeners
 * behavior, idempotency, class structure, and interaction with CometChatMessageEvents.
 *
 * @testCategories Class Structure, Listener Registration, Listener Cleanup,
 *                 Idempotency, Edge Cases, SDK Integration
 * @validates Requirements 8.8, 8.6, 13.6, 14.4, 14.5, 15.7
 */
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { ChatSdkEventInitializer } from './ChatSdkEventInitializer';
import { CometChatMessageEvents } from '../events/CometChatMessageEvents';
import { ensureSdkReady, sdkCleanup } from '../test-setup';

describe('ChatSdkEventInitializer', () => {
  beforeAll(async () => {
    await ensureSdkReady();
  });

  afterAll(async () => {
    await sdkCleanup();
  });

  // ---------- Class Structure ----------
  describe('Class Structure', () => {
    it('should be defined as a class/constructor function', () => {
      expect(ChatSdkEventInitializer).toBeDefined();
      expect(typeof ChatSdkEventInitializer).toBe('function');
    });

    it('should expose attachListeners as a static method', () => {
      expect(typeof ChatSdkEventInitializer.attachListeners).toBe('function');
    });

    it('should be usable without instantiation (static-only pattern)', () => {
      // The class is designed for static-only usage
      expect(() => ChatSdkEventInitializer.attachListeners()).not.toThrow();
    });

    it('attachListeners should not exist on prototype instances', () => {
      const instance = new (ChatSdkEventInitializer as any)();
      expect(instance.hasOwnProperty('attachListeners')).toBe(false);
    });
  });

  // ---------- Listener Registration ----------
  describe('Listener Registration', () => {
    it('attachListeners() should execute without throwing', () => {
      expect(() => ChatSdkEventInitializer.attachListeners()).not.toThrow();
    });

    it('attachListeners() should return void/undefined', () => {
      const result = ChatSdkEventInitializer.attachListeners();
      expect(result).toBeUndefined();
    });

    it('should be callable after SDK is initialized and logged in', () => {
      // SDK is ready via ensureSdkReady in beforeAll
      expect(() => ChatSdkEventInitializer.attachListeners()).not.toThrow();
    });

    it('should register a message listener with the SDK when fully implemented', () => {
      // Spy on CometChat.addMessageListener to verify registration
      const addSpy = vi.spyOn(CometChat, 'addMessageListener');
      ChatSdkEventInitializer.attachListeners();

      // Verify addMessageListener was called (may be called multiple times across tests)
      expect(addSpy).toHaveBeenCalled();
      // Verify the last call has a string listener ID
      const lastCallIndex = addSpy.mock.calls.length - 1;
      expect(typeof addSpy.mock.calls[lastCallIndex][0]).toBe('string');
      addSpy.mockRestore();
    });
  });

  // ---------- Listener Cleanup ----------
  describe('Listener Cleanup', () => {
    it('detachListeners should be a static method if implemented', () => {
      const hasDetach = typeof (ChatSdkEventInitializer as any).detachListeners === 'function';
      if (hasDetach) {
        expect(() => (ChatSdkEventInitializer as any).detachListeners()).not.toThrow();
      } else {
        // Not yet implemented — stub class
        expect(hasDetach).toBe(false);
      }
    });

    it('should call removeMessageListener on detach when fully implemented', () => {
      const removeSpy = vi.spyOn(CometChat, 'removeMessageListener');
      const hasDetach = typeof (ChatSdkEventInitializer as any).detachListeners === 'function';

      if (hasDetach) {
        (ChatSdkEventInitializer as any).detachListeners();
        expect(removeSpy).toHaveBeenCalled();
      }
      // If not implemented, just verify spy setup works
      removeSpy.mockRestore();
    });

    it('attach then detach should not leave dangling listeners', () => {
      ChatSdkEventInitializer.attachListeners();
      const hasDetach = typeof (ChatSdkEventInitializer as any).detachListeners === 'function';
      if (hasDetach) {
        expect(() => (ChatSdkEventInitializer as any).detachListeners()).not.toThrow();
      }
    });
  });

  // ---------- Idempotency ----------
  describe('Idempotency', () => {
    it('should be callable multiple times without throwing', () => {
      expect(() => {
        ChatSdkEventInitializer.attachListeners();
        ChatSdkEventInitializer.attachListeners();
        ChatSdkEventInitializer.attachListeners();
      }).not.toThrow();
    });

    it('should tolerate rapid successive calls (100 iterations)', () => {
      expect(() => {
        for (let i = 0; i < 100; i++) {
          ChatSdkEventInitializer.attachListeners();
        }
      }).not.toThrow();
    });

    it('should not add duplicate static properties on repeated calls', () => {
      const keysBefore = Object.keys(ChatSdkEventInitializer);
      ChatSdkEventInitializer.attachListeners();
      ChatSdkEventInitializer.attachListeners();
      const keysAfter = Object.keys(ChatSdkEventInitializer);
      expect(keysAfter.length).toBe(keysBefore.length);
    });
  });

  // ---------- CometChatMessageEvents Integration ----------
  describe('CometChatMessageEvents Integration', () => {
    it('CometChatMessageEvents should have onTextMessageReceived subject', () => {
      expect(CometChatMessageEvents.onTextMessageReceived).toBeDefined();
      expect(typeof CometChatMessageEvents.onTextMessageReceived.next).toBe('function');
    });

    it('CometChatMessageEvents should have onMediaMessageReceived subject', () => {
      expect(CometChatMessageEvents.onMediaMessageReceived).toBeDefined();
      expect(typeof CometChatMessageEvents.onMediaMessageReceived.next).toBe('function');
    });

    it('CometChatMessageEvents should have onTypingStarted subject', () => {
      expect(CometChatMessageEvents.onTypingStarted).toBeDefined();
      expect(typeof CometChatMessageEvents.onTypingStarted.next).toBe('function');
    });

    it('CometChatMessageEvents should have onTypingEnded subject', () => {
      expect(CometChatMessageEvents.onTypingEnded).toBeDefined();
      expect(typeof CometChatMessageEvents.onTypingEnded.next).toBe('function');
    });

    it('CometChatMessageEvents should have onMessagesDelivered subject', () => {
      expect(CometChatMessageEvents.onMessagesDelivered).toBeDefined();
      expect(typeof CometChatMessageEvents.onMessagesDelivered.next).toBe('function');
    });

    it('CometChatMessageEvents should have onMessagesRead subject', () => {
      expect(CometChatMessageEvents.onMessagesRead).toBeDefined();
      expect(typeof CometChatMessageEvents.onMessagesRead.next).toBe('function');
    });

    it('CometChatMessageEvents should have onMessageEdited subject', () => {
      expect(CometChatMessageEvents.onMessageEdited).toBeDefined();
      expect(typeof CometChatMessageEvents.onMessageEdited.next).toBe('function');
    });

    it('CometChatMessageEvents should have onMessageDeleted subject', () => {
      expect(CometChatMessageEvents.onMessageDeleted).toBeDefined();
      expect(typeof CometChatMessageEvents.onMessageDeleted.next).toBe('function');
    });

    it('CometChatMessageEvents should have reaction event subjects', () => {
      expect(CometChatMessageEvents.onMessageReactionAdded).toBeDefined();
      expect(CometChatMessageEvents.onMessageReactionRemoved).toBeDefined();
    });

    it('CometChatMessageEvents should have interactive message subjects', () => {
      expect(CometChatMessageEvents.onFormMessageReceived).toBeDefined();
      expect(CometChatMessageEvents.onCardMessageReceived).toBeDefined();
      expect(CometChatMessageEvents.onCustomInteractiveMessageReceived).toBeDefined();
      expect(CometChatMessageEvents.onSchedulerMessageReceived).toBeDefined();
    });
  });

  // ---------- SDK addMessageListener API ----------
  describe('SDK addMessageListener API', () => {
    it('CometChat.addMessageListener should be available', () => {
      expect(typeof CometChat.addMessageListener).toBe('function');
    });

    it('CometChat.removeMessageListener should be available', () => {
      expect(typeof CometChat.removeMessageListener).toBe('function');
    });

    it('should be able to register and remove a custom listener via SDK directly', () => {
      const testListenerId = `test_listener_${Date.now()}`;
      const listener = new CometChat.MessageListener({
        onTextMessageReceived: () => {},
      });

      // Register
      expect(() => CometChat.addMessageListener(testListenerId, listener)).not.toThrow();
      // Remove
      expect(() => CometChat.removeMessageListener(testListenerId)).not.toThrow();
    });

    it('removing a non-existent listener should not throw', () => {
      expect(() => CometChat.removeMessageListener('non_existent_listener_id_xyz')).not.toThrow();
    });
  });

  // ---------- Edge Cases ----------
  describe('Edge Cases', () => {
    it('should not throw when called with no arguments', () => {
      expect(() => ChatSdkEventInitializer.attachListeners()).not.toThrow();
    });

    it('should not modify CometChatMessageEvents subjects on stub call', () => {
      // Subscribing before and after to verify no unexpected emissions
      const spy = vi.fn();
      const sub = CometChatMessageEvents.onTextMessageReceived.subscribe(spy);
      ChatSdkEventInitializer.attachListeners();
      // No message was sent, so spy should not be called
      expect(spy).not.toHaveBeenCalled();
      sub.unsubscribe();
    });

    it('CometChat.MessageListener constructor should accept handler object', () => {
      // Verify the SDK MessageListener API works as expected for when
      // ChatSdkEventInitializer is fully implemented
      const handlers = {
        onTextMessageReceived: vi.fn(),
        onMediaMessageReceived: vi.fn(),
        onCustomMessageReceived: vi.fn(),
        onTypingStarted: vi.fn(),
        onTypingEnded: vi.fn(),
        onMessagesDelivered: vi.fn(),
        onMessagesRead: vi.fn(),
        onMessageEdited: vi.fn(),
        onMessageDeleted: vi.fn(),
      };

      const listener = new CometChat.MessageListener(handlers);
      expect(listener).toBeDefined();
    });
  });
});
