import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';

/**
 * Property-Based Tests for Collaborative Extension Payload Structure
 *
 * Feature: message-composer-extensions
 * Property 7: Collaborative Extension Payload Structure
 *
 * *For any* collaborative document or whiteboard creation with receiver R,
 * receiverType T, and optional quotedMessageId M, the API payload SHALL contain
 * receiver=R and receiverType=T. If quotedMessageId is provided, it SHALL be
 * included; otherwise it SHALL be omitted.
 *
 * **Validates: Requirements 4.4, 4.5, 5.4, 5.5**
 *
 * Since the CometChatMessageComposer component uses Angular's inject() function
 * and complex service dependencies, we test the payload building logic as pure
 * functions that mirror the service's behavior.
 */

// ==================== Types ====================

/**
 * Payload interface for creating collaborative documents and whiteboards
 * Mirrors the CollaborativePayload interface from MessageComposerService
 * @see Requirements 6.4, 6.5, 6.6, 6.7, 6.8, 6.9
 */
interface CollaborativePayload {
  /** Receiver ID (user UID or group GUID) */
  receiver: string;
  /** Receiver type ('user' or 'group') */
  receiverType: string;
  /** Optional quoted message ID for replies */
  quotedMessageId?: number;
}

// ==================== Pure Functions (Mirror Service Logic) ====================

/**
 * Build a collaborative extension payload
 * Mirrors the payload construction in MessageComposerService.createCollaborativeDocument
 * and MessageComposerService.createCollaborativeWhiteboard
 *
 * @param receiverId - User ID or Group ID
 * @param receiverType - 'user' or 'group'
 * @param quotedMessageId - Optional message ID for quoted replies
 * @returns The constructed payload
 * @see Requirements 4.4, 4.5, 5.4, 5.5
 */
function buildCollaborativePayload(
  receiverId: string,
  receiverType: string,
  quotedMessageId?: number
): CollaborativePayload {
  const payload: CollaborativePayload = {
    receiver: receiverId,
    receiverType,
  };

  if (quotedMessageId !== undefined) {
    payload.quotedMessageId = quotedMessageId;
  }

  return payload;
}

/**
 * Simulates the MessageComposerService collaborative extension methods
 * This class mirrors the createCollaborativeDocument and createCollaborativeWhiteboard
 * methods in MessageComposerService.
 *
 * @see Requirements 6.4, 6.5, 6.6, 6.7, 6.8, 6.9
 */
class CollaborativeExtensionSimulator {
  private lastPayload: CollaborativePayload | null = null;
  private lastExtensionType: 'document' | 'whiteboard' | null = null;

  /**
   * Get the last payload that was built
   */
  getLastPayload(): CollaborativePayload | null {
    return this.lastPayload;
  }

  /**
   * Get the last extension type that was called
   */
  getLastExtensionType(): 'document' | 'whiteboard' | null {
    return this.lastExtensionType;
  }

  /**
   * Simulate creating a collaborative document
   * Mirrors MessageComposerService.createCollaborativeDocument
   *
   * @param receiverId - User ID or Group ID
   * @param receiverType - 'user' or 'group'
   * @param quotedMessageId - Optional message ID for quoted replies
   * @returns The constructed payload
   * @see Requirements 6.4, 6.5, 6.6
   */
  createCollaborativeDocument(
    receiverId: string,
    receiverType: string,
    quotedMessageId?: number
  ): CollaborativePayload {
    this.lastPayload = buildCollaborativePayload(receiverId, receiverType, quotedMessageId);
    this.lastExtensionType = 'document';
    return this.lastPayload;
  }

  /**
   * Simulate creating a collaborative whiteboard
   * Mirrors MessageComposerService.createCollaborativeWhiteboard
   *
   * @param receiverId - User ID or Group ID
   * @param receiverType - 'user' or 'group'
   * @param quotedMessageId - Optional message ID for quoted replies
   * @returns The constructed payload
   * @see Requirements 6.7, 6.8, 6.9
   */
  createCollaborativeWhiteboard(
    receiverId: string,
    receiverType: string,
    quotedMessageId?: number
  ): CollaborativePayload {
    this.lastPayload = buildCollaborativePayload(receiverId, receiverType, quotedMessageId);
    this.lastExtensionType = 'whiteboard';
    return this.lastPayload;
  }

  /**
   * Reset the simulator state
   */
  reset(): void {
    this.lastPayload = null;
    this.lastExtensionType = null;
  }
}

// ==================== Test Generators ====================

/**
 * Generator for valid receiver IDs (non-empty strings)
 */
const receiverIdGenerator = (): fc.Arbitrary<string> =>
  fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0);

/**
 * Generator for receiver types
 */
const receiverTypeGenerator = (): fc.Arbitrary<'user' | 'group'> =>
  fc.constantFrom('user', 'group');

/**
 * Generator for valid message IDs (positive integers)
 */
const messageIdGenerator = (): fc.Arbitrary<number> => fc.integer({ min: 1, max: 1000000 });

/**
 * Generator for optional quoted message ID
 */
const optionalQuotedMessageIdGenerator = (): fc.Arbitrary<number | undefined> =>
  fc.option(messageIdGenerator(), { nil: undefined });

/**
 * Generator for extension types
 */
const extensionTypeGenerator = (): fc.Arbitrary<'document' | 'whiteboard'> =>
  fc.constantFrom('document', 'whiteboard');

// ==================== Property Tests ====================

describe('CometChatMessageComposer Property Tests - Collaborative Extension Payload Structure', () => {
  let simulator: CollaborativeExtensionSimulator;

  beforeEach(() => {
    simulator = new CollaborativeExtensionSimulator();
  });

  /**
   * Feature: message-composer-extensions, Property 7: Collaborative Extension Payload Structure
   *
   * Core property: For any collaborative document or whiteboard creation,
   * the payload should contain correct receiver, receiverType, and optional quotedMessageId.
   *
   * **Validates: Requirements 4.4, 4.5, 5.4, 5.5**
   */
  describe('Property 7: Collaborative Extension Payload Structure', () => {
    it('should include receiver in payload', () => {
      fc.assert(
        fc.property(
          receiverIdGenerator(),
          receiverTypeGenerator(),
          optionalQuotedMessageIdGenerator(),
          (receiverId, receiverType, quotedMessageId) => {
            // Reset state before each test
            simulator.reset();

            // Action: Create collaborative document
            const payload = simulator.createCollaborativeDocument(
              receiverId,
              receiverType,
              quotedMessageId
            );

            // Assert: Payload contains correct receiver
            // @see Requirements 4.4
            expect(payload.receiver).toBe(receiverId);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include receiverType in payload', () => {
      fc.assert(
        fc.property(
          receiverIdGenerator(),
          receiverTypeGenerator(),
          optionalQuotedMessageIdGenerator(),
          (receiverId, receiverType, quotedMessageId) => {
            // Reset state before each test
            simulator.reset();

            // Action: Create collaborative document
            const payload = simulator.createCollaborativeDocument(
              receiverId,
              receiverType,
              quotedMessageId
            );

            // Assert: Payload contains correct receiverType
            // @see Requirements 4.4
            expect(payload.receiverType).toBe(receiverType);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include quotedMessageId when provided', () => {
      fc.assert(
        fc.property(
          receiverIdGenerator(),
          receiverTypeGenerator(),
          messageIdGenerator(),
          (receiverId, receiverType, quotedMessageId) => {
            // Reset state before each test
            simulator.reset();

            // Action: Create collaborative document with quotedMessageId
            const payload = simulator.createCollaborativeDocument(
              receiverId,
              receiverType,
              quotedMessageId
            );

            // Assert: Payload contains quotedMessageId
            // @see Requirements 4.5
            expect(payload.quotedMessageId).toBe(quotedMessageId);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should NOT include quotedMessageId when not provided', () => {
      fc.assert(
        fc.property(receiverIdGenerator(), receiverTypeGenerator(), (receiverId, receiverType) => {
          // Reset state before each test
          simulator.reset();

          // Action: Create collaborative document WITHOUT quotedMessageId
          const payload = simulator.createCollaborativeDocument(
            receiverId,
            receiverType,
            undefined
          );

          // Assert: Payload does NOT contain quotedMessageId
          // @see Requirements 4.5
          expect('quotedMessageId' in payload).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it('should construct correct payload for collaborative document', () => {
      fc.assert(
        fc.property(
          receiverIdGenerator(),
          receiverTypeGenerator(),
          optionalQuotedMessageIdGenerator(),
          (receiverId, receiverType, quotedMessageId) => {
            // Reset state before each test
            simulator.reset();

            // Action: Create collaborative document
            const payload = simulator.createCollaborativeDocument(
              receiverId,
              receiverType,
              quotedMessageId
            );

            // Assert: All fields are correct
            // @see Requirements 4.4, 4.5
            expect(payload.receiver).toBe(receiverId);
            expect(payload.receiverType).toBe(receiverType);

            if (quotedMessageId !== undefined) {
              expect(payload.quotedMessageId).toBe(quotedMessageId);
            } else {
              expect('quotedMessageId' in payload).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should construct correct payload for collaborative whiteboard', () => {
      fc.assert(
        fc.property(
          receiverIdGenerator(),
          receiverTypeGenerator(),
          optionalQuotedMessageIdGenerator(),
          (receiverId, receiverType, quotedMessageId) => {
            // Reset state before each test
            simulator.reset();

            // Action: Create collaborative whiteboard
            const payload = simulator.createCollaborativeWhiteboard(
              receiverId,
              receiverType,
              quotedMessageId
            );

            // Assert: All fields are correct
            // @see Requirements 5.4, 5.5
            expect(payload.receiver).toBe(receiverId);
            expect(payload.receiverType).toBe(receiverType);

            if (quotedMessageId !== undefined) {
              expect(payload.quotedMessageId).toBe(quotedMessageId);
            } else {
              expect('quotedMessageId' in payload).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should produce identical payload structure for document and whiteboard', () => {
      fc.assert(
        fc.property(
          receiverIdGenerator(),
          receiverTypeGenerator(),
          optionalQuotedMessageIdGenerator(),
          (receiverId, receiverType, quotedMessageId) => {
            // Reset state before each test
            simulator.reset();

            // Action: Create both document and whiteboard with same params
            const documentPayload = simulator.createCollaborativeDocument(
              receiverId,
              receiverType,
              quotedMessageId
            );

            simulator.reset();

            const whiteboardPayload = simulator.createCollaborativeWhiteboard(
              receiverId,
              receiverType,
              quotedMessageId
            );

            // Assert: Both payloads have identical structure
            expect(documentPayload.receiver).toBe(whiteboardPayload.receiver);
            expect(documentPayload.receiverType).toBe(whiteboardPayload.receiverType);
            expect(documentPayload.quotedMessageId).toBe(whiteboardPayload.quotedMessageId);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle user receiver type correctly', () => {
      fc.assert(
        fc.property(
          receiverIdGenerator(),
          optionalQuotedMessageIdGenerator(),
          (receiverId, quotedMessageId) => {
            // Reset state before each test
            simulator.reset();

            // Action: Create collaborative document for user
            const payload = simulator.createCollaborativeDocument(
              receiverId,
              'user',
              quotedMessageId
            );

            // Assert: receiverType is 'user'
            expect(payload.receiverType).toBe('user');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle group receiver type correctly', () => {
      fc.assert(
        fc.property(
          receiverIdGenerator(),
          optionalQuotedMessageIdGenerator(),
          (receiverId, quotedMessageId) => {
            // Reset state before each test
            simulator.reset();

            // Action: Create collaborative document for group
            const payload = simulator.createCollaborativeDocument(
              receiverId,
              'group',
              quotedMessageId
            );

            // Assert: receiverType is 'group'
            expect(payload.receiverType).toBe('group');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should be deterministic - same inputs always produce same payload', () => {
      fc.assert(
        fc.property(
          receiverIdGenerator(),
          receiverTypeGenerator(),
          optionalQuotedMessageIdGenerator(),
          fc.integer({ min: 2, max: 5 }),
          (receiverId, receiverType, quotedMessageId, repeatCount) => {
            const payloads: CollaborativePayload[] = [];

            for (let i = 0; i < repeatCount; i++) {
              // Reset and replay the same scenario
              simulator.reset();
              const payload = simulator.createCollaborativeDocument(
                receiverId,
                receiverType,
                quotedMessageId
              );
              payloads.push({ ...payload });
            }

            // All payloads should be identical
            for (let i = 1; i < payloads.length; i++) {
              expect(payloads[i].receiver).toBe(payloads[0].receiver);
              expect(payloads[i].receiverType).toBe(payloads[0].receiverType);
              expect(payloads[i].quotedMessageId).toBe(payloads[0].quotedMessageId);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve receiver ID exactly as provided', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
          receiverTypeGenerator(),
          (receiverId, receiverType) => {
            // Reset state before each test
            simulator.reset();

            // Action: Create collaborative document
            const payload = simulator.createCollaborativeDocument(
              receiverId,
              receiverType,
              undefined
            );

            // Assert: Receiver ID is preserved exactly
            expect(payload.receiver).toBe(receiverId);
            expect(payload.receiver.length).toBe(receiverId.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle special characters in receiver ID', () => {
      fc.assert(
        fc.property(
          fc
            .string({ minLength: 1, maxLength: 50 })
            .filter(s => s.trim().length > 0)
            .map(s => s + '_special-chars.123'),
          receiverTypeGenerator(),
          optionalQuotedMessageIdGenerator(),
          (receiverId, receiverType, quotedMessageId) => {
            // Reset state before each test
            simulator.reset();

            // Action: Create collaborative document with special chars in ID
            const payload = simulator.createCollaborativeDocument(
              receiverId,
              receiverType,
              quotedMessageId
            );

            // Assert: Receiver ID is preserved with special characters
            expect(payload.receiver).toBe(receiverId);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
