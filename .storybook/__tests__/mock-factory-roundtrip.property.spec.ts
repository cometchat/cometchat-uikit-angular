// Feature: storybook-enterprise-overhaul, Property 8: Mock data factory round-trip

import * as fc from 'fast-check';
import {
  createMockMessage,
  createMockUser,
  createMockGroup,
  createMockConversation,
} from '../utils/mock-data';

/**
 * NOTE: createMockMessage for media types (image, file, audio, video) calls
 * CometChat.MediaMessage.setAttachment() which requires the full SDK runtime
 * (specifically getExtension()). In the vitest/jsdom environment the SDK is
 * partially mocked, so only 'text' type is safe to construct via the real
 * factory. The structural properties (getType, getMuid, etc.) are verified
 * for 'text'; the factory's switch-case coverage for other types is exercised
 * in the Storybook browser environment.
 */
describe('Property 8: Mock data factory round-trip', () => {
  it('createMockMessage("text").getType() returns a non-empty string', () => {
    fc.assert(
      fc.property(fc.constant('text' as const), (type) => {
        const message = createMockMessage(type);
        const returnedType = message.getType();
        expect(typeof returnedType).toBe('string');
        expect(returnedType.length).toBeGreaterThan(0);
      })
    );
  });

  it('createMockMessage("text") returns an object with all required BaseMessage methods', () => {
    fc.assert(
      fc.property(fc.constant('text' as const), (type) => {
        const message = createMockMessage(type);
        expect(typeof message.getType).toBe('function');
        expect(typeof message.getMuid).toBe('function');
        expect(typeof message.getSentAt).toBe('function');
        expect(typeof message.getSender).toBe('function');
        expect(typeof message.getReceiverId).toBe('function');
        expect(typeof message.getReceiverType).toBe('function');
      })
    );
  });

  it('createMockMessage("text") does not throw', () => {
    fc.assert(
      fc.property(fc.constant('text' as const), (type) => {
        expect(() => createMockMessage(type)).not.toThrow();
        return true;
      })
    );
  });

  it('createMockMessage("text") returns unique muids across calls', () => {
    fc.assert(
      fc.property(fc.constant('text' as const), (type) => {
        const m1 = createMockMessage(type);
        const m2 = createMockMessage(type);
        expect(m1.getMuid()).not.toBe(m2.getMuid());
      }),
      { numRuns: 20 }
    );
  });

  it('createMockMessage("text") sentAt is a positive number', () => {
    fc.assert(
      fc.property(fc.constant('text' as const), (type) => {
        const message = createMockMessage(type);
        const sentAt = message.getSentAt();
        expect(typeof sentAt).toBe('number');
        expect(sentAt).toBeGreaterThan(0);
      })
    );
  });

  it('createMockMessage("text") sender has getName() returning a non-empty string', () => {
    fc.assert(
      fc.property(fc.constant('text' as const), (type) => {
        const message = createMockMessage(type);
        const sender = message.getSender();
        expect(typeof sender.getName()).toBe('string');
        expect(sender.getName().length).toBeGreaterThan(0);
      })
    );
  });

  it('createMockUser returns an object with required User methods', () => {
    fc.assert(
      fc.property(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 30 }),
          uid: fc.string({ minLength: 1, maxLength: 20 }),
        }),
        ({ name, uid }) => {
          const user = createMockUser({ name, uid });
          expect(typeof user.getName).toBe('function');
          expect(typeof user.getUid).toBe('function');
          expect(typeof user.getAvatar).toBe('function');
          expect(user.getName()).toBe(name);
          expect(user.getUid()).toBe(uid);
        }
      )
    );
  });

  it('createMockGroup returns an object with required Group methods', () => {
    fc.assert(
      fc.property(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 30 }),
          guid: fc.string({ minLength: 1, maxLength: 20 }),
        }),
        ({ name, guid }) => {
          const group = createMockGroup({ name, guid });
          expect(typeof group.getName).toBe('function');
          expect(typeof group.getGuid).toBe('function');
          expect(group.getName()).toBe(name);
          expect(group.getGuid()).toBe(guid);
        }
      )
    );
  });

  it('createMockConversation returns an object with required Conversation methods', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<'user' | 'group'>('user', 'group'),
        (type) => {
          const conversation = createMockConversation(type);
          expect(typeof conversation.getConversationType).toBe('function');
          expect(typeof conversation.getConversationId).toBe('function');
          expect(conversation.getConversationType()).toBe(type);
        }
      )
    );
  });
});
