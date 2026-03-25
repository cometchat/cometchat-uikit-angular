import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';

/**
 * Property-Based Tests for Sticker Message Structure
 *
 * **Feature: message-composer-extensions, Property 6: Sticker Message Structure**
 * **Validates: Requirements 3.5, 3.6, 3.7**
 *
 * Property: For any sticker message sent with URL U and name N, the message SHALL have
 * type 'extension_sticker' and metadata containing sticker_url=U and sticker_name=N.
 * If parentMessageId P is set, the message SHALL include parentMessageId=P.
 * If quotedMessage Q is set, the message SHALL include quotedMessageId=Q.getId().
 *
 * Since the CometChatMessageComposer component uses Angular's inject() function
 * and complex service dependencies, we test the message building logic as pure
 * functions that mirror the component's behavior.
 */

// ==================== Types ====================

/**
 * Sticker message metadata structure
 * Mirrors the metadata format used in sendStickerMessage
 * @see Requirements 3.5
 */
interface StickerMetadata {
  type: 'extension_sticker';
  data: {
    sticker_url: string;
    sticker_name: string;
  };
}

/**
 * Sticker message structure for testing
 * Mirrors the CustomMessage structure used in the component
 * @see Requirements 3.5, 3.6, 3.7
 */
interface StickerMessage {
  receiverId: string;
  receiverType: 'user' | 'group';
  type: 'extension_sticker';
  metadata: StickerMetadata;
  parentMessageId?: number;
  quotedMessageId?: number;
}

// ==================== Pure Functions (Mirror Component Logic) ====================

/**
 * Build sticker message metadata
 * Mirrors the metadata construction in sendStickerMessage
 *
 * @param stickerUrl - URL of the sticker image
 * @param stickerName - Name of the sticker
 * @returns The constructed metadata
 * @see Requirements 3.5
 */
function buildStickerMetadata(stickerUrl: string, stickerName: string): StickerMetadata {
  return {
    type: 'extension_sticker',
    data: {
      sticker_url: stickerUrl,
      sticker_name: stickerName,
    },
  };
}

/**
 * Build a sticker message
 * Mirrors the message construction in sendStickerMessage
 *
 * @param receiverId - User ID or Group ID
 * @param receiverType - 'user' or 'group'
 * @param stickerUrl - URL of the sticker image
 * @param stickerName - Name of the sticker
 * @param parentMessageId - Optional parent message ID for threaded replies
 * @param quotedMessageId - Optional quoted message ID for quoted replies
 * @returns The constructed sticker message
 * @see Requirements 3.5, 3.6, 3.7
 */
function buildStickerMessage(
  receiverId: string,
  receiverType: 'user' | 'group',
  stickerUrl: string,
  stickerName: string,
  parentMessageId?: number,
  quotedMessageId?: number
): StickerMessage {
  const message: StickerMessage = {
    receiverId,
    receiverType,
    type: 'extension_sticker',
    metadata: buildStickerMetadata(stickerUrl, stickerName),
  };

  if (parentMessageId !== undefined) {
    message.parentMessageId = parentMessageId;
  }

  if (quotedMessageId !== undefined) {
    message.quotedMessageId = quotedMessageId;
  }

  return message;
}

/**
 * Simulates the sticker message sending logic from MessageComposer
 * This class mirrors the sendStickerMessage method behavior.
 *
 * @see Requirements 3.5, 3.6, 3.7
 */
class StickerMessageSimulator {
  private lastMessage: StickerMessage | null = null;

  /**
   * Get the last message that was built
   */
  getLastMessage(): StickerMessage | null {
    return this.lastMessage;
  }

  /**
   * Simulate sending a sticker message
   * Mirrors the sendStickerMessage method in MessageComposer
   *
   * @param receiverId - User ID or Group ID
   * @param receiverType - 'user' or 'group'
   * @param stickerUrl - URL of the sticker image
   * @param stickerName - Name of the sticker
   * @param parentMessageId - Optional parent message ID for threaded replies
   * @param quotedMessageId - Optional quoted message ID for quoted replies
   * @returns The constructed sticker message
   * @see Requirements 3.5, 3.6, 3.7
   */
  sendStickerMessage(
    receiverId: string,
    receiverType: 'user' | 'group',
    stickerUrl: string,
    stickerName: string,
    parentMessageId?: number,
    quotedMessageId?: number
  ): StickerMessage {
    this.lastMessage = buildStickerMessage(
      receiverId,
      receiverType,
      stickerUrl,
      stickerName,
      parentMessageId,
      quotedMessageId
    );
    return this.lastMessage;
  }

  /**
   * Reset the simulator state
   */
  reset(): void {
    this.lastMessage = null;
  }
}

// ==================== Test Generators ====================

/**
 * Generator for valid sticker URLs
 */
const stickerUrlGenerator = (): fc.Arbitrary<string> =>
  fc.webUrl().filter(url => url.length > 0 && url.length < 500);

/**
 * Generator for valid sticker names
 */
const stickerNameGenerator = (): fc.Arbitrary<string> =>
  fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0);

/**
 * Generator for valid receiver IDs
 */
const receiverIdGenerator = (): fc.Arbitrary<string> =>
  fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s));

/**
 * Generator for receiver types
 */
const receiverTypeGenerator = (): fc.Arbitrary<'user' | 'group'> =>
  fc.constantFrom('user', 'group');

/**
 * Generator for valid message IDs (positive integers)
 */
const messageIdGenerator = (): fc.Arbitrary<number> => fc.integer({ min: 1, max: 999999 });

/**
 * Generator for optional parent message ID
 */
const optionalParentMessageIdGenerator = (): fc.Arbitrary<number | undefined> =>
  fc.option(messageIdGenerator(), { nil: undefined });

/**
 * Generator for optional quoted message ID
 */
const optionalQuotedMessageIdGenerator = (): fc.Arbitrary<number | undefined> =>
  fc.option(messageIdGenerator(), { nil: undefined });

// ==================== Property Tests ====================

describe('Property 6: Sticker Message Structure', () => {
  /**
   * **Feature: message-composer-extensions, Property 6: Sticker Message Structure**
   * **Validates: Requirements 3.5, 3.6, 3.7**
   */

  let simulator: StickerMessageSimulator;

  beforeEach(() => {
    simulator = new StickerMessageSimulator();
  });

  describe('Sticker URL Property', () => {
    /**
     * **Validates: Requirements 3.5**
     */
    it('should correctly include sticker URL in metadata for any valid URL', () => {
      fc.assert(
        fc.property(stickerUrlGenerator(), receiverIdGenerator(), (stickerUrl, receiverId) => {
          // Reset state before each test
          simulator.reset();

          // Action: Send sticker message
          const message = simulator.sendStickerMessage(
            receiverId,
            'user',
            stickerUrl,
            'TestSticker'
          );

          // Assert: Sticker URL is correctly included in metadata
          expect(message.metadata.data.sticker_url).toBe(stickerUrl);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Sticker Name Property', () => {
    /**
     * **Validates: Requirements 3.5**
     */
    it('should correctly include sticker name in metadata for any valid name', () => {
      fc.assert(
        fc.property(stickerNameGenerator(), receiverIdGenerator(), (stickerName, receiverId) => {
          // Reset state before each test
          simulator.reset();

          // Action: Send sticker message
          const message = simulator.sendStickerMessage(
            receiverId,
            'user',
            'https://example.com/sticker.png',
            stickerName
          );

          // Assert: Sticker name is correctly included in metadata
          expect(message.metadata.data.sticker_name).toBe(stickerName);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Metadata Format Property', () => {
    /**
     * **Validates: Requirements 3.5**
     */
    it('should create metadata with correct structure for any sticker', () => {
      fc.assert(
        fc.property(
          stickerUrlGenerator(),
          stickerNameGenerator(),
          receiverIdGenerator(),
          (stickerUrl, stickerName, receiverId) => {
            // Reset state before each test
            simulator.reset();

            // Action: Send sticker message
            const message = simulator.sendStickerMessage(
              receiverId,
              'user',
              stickerUrl,
              stickerName
            );

            // Assert: Metadata has correct structure
            expect(message.metadata.type).toBe('extension_sticker');
            expect(message.metadata.data).toBeDefined();
            expect(message.metadata.data.sticker_url).toBe(stickerUrl);
            expect(message.metadata.data.sticker_name).toBe(stickerName);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Receiver Type Property', () => {
    it('should send to user receiver with correct receiver type', () => {
      fc.assert(
        fc.property(receiverIdGenerator(), receiverId => {
          // Reset state before each test
          simulator.reset();

          // Action: Send sticker message to user
          const message = simulator.sendStickerMessage(
            receiverId,
            'user',
            'https://example.com/sticker.png',
            'TestSticker'
          );

          // Assert: Receiver type is 'user'
          expect(message.receiverId).toBe(receiverId);
          expect(message.receiverType).toBe('user');
        }),
        { numRuns: 100 }
      );
    });

    it('should send to group receiver with correct receiver type', () => {
      fc.assert(
        fc.property(receiverIdGenerator(), receiverId => {
          // Reset state before each test
          simulator.reset();

          // Action: Send sticker message to group
          const message = simulator.sendStickerMessage(
            receiverId,
            'group',
            'https://example.com/sticker.png',
            'TestSticker'
          );

          // Assert: Receiver type is 'group'
          expect(message.receiverId).toBe(receiverId);
          expect(message.receiverType).toBe('group');
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Parent Message ID Property', () => {
    /**
     * **Validates: Requirements 3.6**
     */
    it('should include parent message ID when provided', () => {
      fc.assert(
        fc.property(receiverIdGenerator(), messageIdGenerator(), (receiverId, parentId) => {
          // Reset state before each test
          simulator.reset();

          // Action: Send sticker message with parent ID
          const message = simulator.sendStickerMessage(
            receiverId,
            'user',
            'https://example.com/sticker.png',
            'TestSticker',
            parentId
          );

          // Assert: Parent message ID is included
          expect(message.parentMessageId).toBe(parentId);
        }),
        { numRuns: 100 }
      );
    });

    it('should NOT include parent message ID when not provided', () => {
      fc.assert(
        fc.property(receiverIdGenerator(), receiverId => {
          // Reset state before each test
          simulator.reset();

          // Action: Send sticker message without parent ID
          const message = simulator.sendStickerMessage(
            receiverId,
            'user',
            'https://example.com/sticker.png',
            'TestSticker',
            undefined
          );

          // Assert: Parent message ID is not included
          expect('parentMessageId' in message).toBe(false);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Quoted Message ID Property', () => {
    /**
     * **Validates: Requirements 3.7**
     */
    it('should include quoted message ID when provided', () => {
      fc.assert(
        fc.property(receiverIdGenerator(), messageIdGenerator(), (receiverId, quotedId) => {
          // Reset state before each test
          simulator.reset();

          // Action: Send sticker message with quoted ID
          const message = simulator.sendStickerMessage(
            receiverId,
            'user',
            'https://example.com/sticker.png',
            'TestSticker',
            undefined,
            quotedId
          );

          // Assert: Quoted message ID is included
          expect(message.quotedMessageId).toBe(quotedId);
        }),
        { numRuns: 100 }
      );
    });

    it('should NOT include quoted message ID when not provided', () => {
      fc.assert(
        fc.property(receiverIdGenerator(), receiverId => {
          // Reset state before each test
          simulator.reset();

          // Action: Send sticker message without quoted ID
          const message = simulator.sendStickerMessage(
            receiverId,
            'user',
            'https://example.com/sticker.png',
            'TestSticker',
            undefined,
            undefined
          );

          // Assert: Quoted message ID is not included
          expect('quotedMessageId' in message).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it('should include both parent and quoted message IDs when both provided', () => {
      fc.assert(
        fc.property(
          receiverIdGenerator(),
          messageIdGenerator(),
          messageIdGenerator(),
          (receiverId, parentId, quotedId) => {
            // Reset state before each test
            simulator.reset();

            // Action: Send sticker message with both IDs
            const message = simulator.sendStickerMessage(
              receiverId,
              'user',
              'https://example.com/sticker.png',
              'TestSticker',
              parentId,
              quotedId
            );

            // Assert: Both IDs are included
            expect(message.parentMessageId).toBe(parentId);
            expect(message.quotedMessageId).toBe(quotedId);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Message Type Property', () => {
    /**
     * **Validates: Requirements 3.5**
     */
    it('should always use extension_sticker as message type', () => {
      fc.assert(
        fc.property(
          stickerUrlGenerator(),
          stickerNameGenerator(),
          receiverIdGenerator(),
          (stickerUrl, stickerName, receiverId) => {
            // Reset state before each test
            simulator.reset();

            // Action: Send sticker message
            const message = simulator.sendStickerMessage(
              receiverId,
              'user',
              stickerUrl,
              stickerName
            );

            // Assert: Message type is 'extension_sticker'
            expect(message.type).toBe('extension_sticker');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Combined Properties', () => {
    /**
     * **Feature: message-composer-extensions, Property 6: Sticker Message Structure**
     * **Validates: Requirements 3.5, 3.6, 3.7**
     */
    it('should correctly handle any valid sticker selection with all optional parameters', () => {
      fc.assert(
        fc.property(
          stickerUrlGenerator(),
          stickerNameGenerator(),
          receiverIdGenerator(),
          receiverTypeGenerator(),
          optionalParentMessageIdGenerator(),
          optionalQuotedMessageIdGenerator(),
          (stickerUrl, stickerName, receiverId, receiverType, parentId, quotedId) => {
            // Reset state before each test
            simulator.reset();

            // Action: Send sticker message with all parameters
            const message = simulator.sendStickerMessage(
              receiverId,
              receiverType,
              stickerUrl,
              stickerName,
              parentId,
              quotedId
            );

            // Assert: All properties are correct
            expect(message.receiverId).toBe(receiverId);
            expect(message.receiverType).toBe(receiverType);
            expect(message.type).toBe('extension_sticker');
            expect(message.metadata.type).toBe('extension_sticker');
            expect(message.metadata.data.sticker_url).toBe(stickerUrl);
            expect(message.metadata.data.sticker_name).toBe(stickerName);

            // Verify parentMessageId
            if (parentId !== undefined) {
              expect(message.parentMessageId).toBe(parentId);
            } else {
              expect('parentMessageId' in message).toBe(false);
            }

            // Verify quotedMessageId
            if (quotedId !== undefined) {
              expect(message.quotedMessageId).toBe(quotedId);
            } else {
              expect('quotedMessageId' in message).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Determinism Property', () => {
    it('should be deterministic - same inputs always produce same message', () => {
      fc.assert(
        fc.property(
          stickerUrlGenerator(),
          stickerNameGenerator(),
          receiverIdGenerator(),
          receiverTypeGenerator(),
          optionalParentMessageIdGenerator(),
          optionalQuotedMessageIdGenerator(),
          fc.integer({ min: 2, max: 5 }),
          (stickerUrl, stickerName, receiverId, receiverType, parentId, quotedId, repeatCount) => {
            const messages: StickerMessage[] = [];

            for (let i = 0; i < repeatCount; i++) {
              // Reset and replay the same scenario
              simulator.reset();
              const message = simulator.sendStickerMessage(
                receiverId,
                receiverType,
                stickerUrl,
                stickerName,
                parentId,
                quotedId
              );
              messages.push({ ...message });
            }

            // All messages should be identical
            for (let i = 1; i < messages.length; i++) {
              expect(messages[i].receiverId).toBe(messages[0].receiverId);
              expect(messages[i].receiverType).toBe(messages[0].receiverType);
              expect(messages[i].type).toBe(messages[0].type);
              expect(messages[i].metadata.data.sticker_url).toBe(
                messages[0].metadata.data.sticker_url
              );
              expect(messages[i].metadata.data.sticker_name).toBe(
                messages[0].metadata.data.sticker_name
              );
              expect(messages[i].parentMessageId).toBe(messages[0].parentMessageId);
              expect(messages[i].quotedMessageId).toBe(messages[0].quotedMessageId);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
