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
        return typeof returnedType === 'string' && returnedType.length > 0;
      })
    );
  });

  it('createMockMessage("text") returns an object with all required BaseMessage methods', () => {
    fc.assert(
      fc.property(fc.constant('text' as const), (type) => {
        const message = createMockMessage(type);
        return (
          typeof message.getType === 'function' &&
          typeof message.getMuid === 'function' &&
          typeof message.getSentAt === 'function' &&
          typeof message.getSender === 'function' &&
          typeof message.getReceiverId === 'function' &&
          typeof message.getReceiverType === 'function'
        );
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
        return m1.getMuid() !== m2.getMuid();
      }),
      { numRuns: 20 }
    );
  });

  it('createMockMessage("text") sentAt is a positive number', () => {
    fc.assert(
      fc.property(fc.constant('text' as const), (type) => {
        const message = createMockMessage(type);
        const sentAt = message.getSentAt();
        return typeof sentAt === 'number' && sentAt > 0;
      })
    );
  });

  it('createMockMessage("text") sender has getName() returning a non-empty string', () => {
    fc.assert(
      fc.property(fc.constant('text' as const), (type) => {
        const message = createMockMessage(type);
        const sender = message.getSender();
        return typeof sender.getName() === 'string' && sender.getName().length > 0;
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
          return (
            typeof user.getName === 'function' &&
            typeof user.getUid === 'function' &&
            typeof user.getAvatar === 'function' &&
            user.getName() === name &&
            user.getUid() === uid
          );
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
          return (
            typeof group.getName === 'function' &&
            typeof group.getGuid === 'function' &&
            group.getName() === name &&
            group.getGuid() === guid
          );
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
          return (
            typeof conversation.getConversationType === 'function' &&
            typeof conversation.getConversationId === 'function' &&
            conversation.getConversationType() === type
          );
        }
      )
    );
  });
});
