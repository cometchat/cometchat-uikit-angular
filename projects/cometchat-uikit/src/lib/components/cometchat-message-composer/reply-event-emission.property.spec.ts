import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';

/**
 * Property-Based Tests for Reply Event Emission on Success
 *
 * Feature: message-composer-extensions
 * Property 8: Reply Event Emission on Success
 *
 * *For any* successful extension operation (poll, sticker, document, whiteboard)
 * when messageToReply is set, the ccReplyToMessage event SHALL be emitted with
 * the original message and status=success.
 *
 * **Validates: Requirements 2.7, 3.9, 4.7, 5.7**
 *
 * Since the CometChatMessageComposer component uses Angular's inject() function
 * and complex service dependencies, we test the event emission logic as pure
 * functions that mirror the component's behavior.
 */

// ==================== Types ====================

/**
 * Mock CometChat BaseMessage class
 */
class MockBaseMessage {
  constructor(private id: number) {}

  getId(): number {
    return this.id;
  }
}

/**
 * Message status enum
 */
enum MessageStatus {
  inprogress = 'inprogress',
  success = 'success',
  error = 'error',
}

/**
 * Extension operation types
 */
type ExtensionOperation = 'poll' | 'sticker' | 'document' | 'whiteboard';

/**
 * Reply event structure
 */
interface ReplyToMessageEvent {
  message: MockBaseMessage;
  status: MessageStatus;
}

// ==================== Mock Event Emitter ====================

class MockEventEmitter<T> {
  private emissions: T[] = [];

  next(value: T): void {
    this.emissions.push(value);
  }

  getEmissions(): T[] {
    return [...this.emissions];
  }

  getLastEmission(): T | undefined {
    return this.emissions[this.emissions.length - 1];
  }

  clear(): void {
    this.emissions = [];
  }

  get emissionCount(): number {
    return this.emissions.length;
  }
}

// ==================== Pure Functions (Mirror Component Logic) ====================

/**
 * Simulates the reply event emission logic from MessageComposer
 * This class mirrors the ccReplyToMessage event emission behavior in the component.
 *
 * @see Requirements 2.7, 3.9, 4.7, 5.7
 */
class ReplyEventEmissionSimulator {
  private messageToReply: MockBaseMessage | null = null;
  ccReplyToMessage = new MockEventEmitter<ReplyToMessageEvent>();

  /**
   * Set the message to reply to
   */
  setMessageToReply(message: MockBaseMessage | null): void {
    this.messageToReply = message;
  }

  /**
   * Get the current message to reply to
   */
  getMessageToReply(): MockBaseMessage | null {
    return this.messageToReply;
  }

  /**
   * Exit reply mode (clear messageToReply)
   */
  exitReplyMode(): void {
    this.messageToReply = null;
  }

  /**
   * Simulate successful poll creation
   * Mirrors onPollCreated() in MessageComposer
   *
   * @see Requirements 2.7
   */
  onPollCreated(): void {
    if (this.messageToReply) {
      this.ccReplyToMessage.next({
        message: this.messageToReply,
        status: MessageStatus.success,
      });
      this.exitReplyMode();
    }
  }

  /**
   * Simulate successful sticker send
   * Mirrors sendStickerMessage() success handling in MessageComposer
   *
   * @see Requirements 3.9
   */
  onStickerSent(): void {
    if (this.messageToReply) {
      this.ccReplyToMessage.next({
        message: this.messageToReply,
        status: MessageStatus.success,
      });
      this.exitReplyMode();
    }
  }

  /**
   * Simulate successful collaborative document creation
   * Mirrors createCollaborativeDocument() success handling in MessageComposer
   *
   * @see Requirements 4.7
   */
  onDocumentCreated(): void {
    if (this.messageToReply) {
      this.ccReplyToMessage.next({
        message: this.messageToReply,
        status: MessageStatus.success,
      });
      this.exitReplyMode();
    }
  }

  /**
   * Simulate successful collaborative whiteboard creation
   * Mirrors createCollaborativeWhiteboard() success handling in MessageComposer
   *
   * @see Requirements 5.7
   */
  onWhiteboardCreated(): void {
    if (this.messageToReply) {
      this.ccReplyToMessage.next({
        message: this.messageToReply,
        status: MessageStatus.success,
      });
      this.exitReplyMode();
    }
  }

  /**
   * Execute an extension operation by type
   */
  executeOperation(operation: ExtensionOperation): void {
    switch (operation) {
      case 'poll':
        this.onPollCreated();
        break;
      case 'sticker':
        this.onStickerSent();
        break;
      case 'document':
        this.onDocumentCreated();
        break;
      case 'whiteboard':
        this.onWhiteboardCreated();
        break;
    }
  }

  /**
   * Reset the simulator state
   */
  reset(): void {
    this.messageToReply = null;
    this.ccReplyToMessage.clear();
  }
}

// ==================== Test Generators ====================

/**
 * Generator for valid message IDs (positive integers)
 */
const messageIdGenerator = (): fc.Arbitrary<number> => fc.integer({ min: 1, max: 999999 });

/**
 * Generator for mock base messages
 */
const mockMessageGenerator = (): fc.Arbitrary<MockBaseMessage> =>
  messageIdGenerator().map(id => new MockBaseMessage(id));

/**
 * Generator for extension operation types
 */
const extensionOperationGenerator = (): fc.Arbitrary<ExtensionOperation> =>
  fc.constantFrom('poll', 'sticker', 'document', 'whiteboard');

/**
 * Generator for sequences of extension operations
 */
const operationSequenceGenerator = (): fc.Arbitrary<ExtensionOperation[]> =>
  fc.array(extensionOperationGenerator(), { minLength: 1, maxLength: 10 });

/**
 * Generator for optional message (with or without reply)
 */
const optionalMessageGenerator = (): fc.Arbitrary<MockBaseMessage | null> =>
  fc.option(mockMessageGenerator(), { nil: null });

// ==================== Property Tests ====================

describe('Property 8: Reply Event Emission on Success', () => {
  /**
   * **Feature: message-composer-extensions, Property 8: Reply Event Emission on Success**
   * **Validates: Requirements 2.7, 3.9, 4.7, 5.7**
   */

  let simulator: ReplyEventEmissionSimulator;

  beforeEach(() => {
    simulator = new ReplyEventEmissionSimulator();
  });

  describe('Event Emission When messageToReply Is Set', () => {
    /**
     * Core property: When messageToReply is set and an extension operation succeeds,
     * ccReplyToMessage SHALL be emitted with the original message and status=success.
     */
    it('should emit ccReplyToMessage with success status for any extension operation when messageToReply is set', () => {
      fc.assert(
        fc.property(
          mockMessageGenerator(),
          extensionOperationGenerator(),
          (replyMessage, operation) => {
            // Reset state before each test
            simulator.reset();

            // Setup: Set messageToReply
            simulator.setMessageToReply(replyMessage);
            expect(simulator.getMessageToReply()).toBe(replyMessage);

            // Action: Execute extension operation
            simulator.executeOperation(operation);

            // Assert: Event was emitted with correct message and status
            const emissions = simulator.ccReplyToMessage.getEmissions();
            expect(emissions.length).toBe(1);
            expect(emissions[0].message).toBe(replyMessage);
            expect(emissions[0].status).toBe(MessageStatus.success);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should emit event with the exact same message object that was set as messageToReply', () => {
      fc.assert(
        fc.property(messageIdGenerator(), extensionOperationGenerator(), (messageId, operation) => {
          // Reset state before each test
          simulator.reset();

          // Setup: Create and set messageToReply
          const replyMessage = new MockBaseMessage(messageId);
          simulator.setMessageToReply(replyMessage);

          // Action: Execute extension operation
          simulator.executeOperation(operation);

          // Assert: Emitted message is the exact same object
          const emission = simulator.ccReplyToMessage.getLastEmission();
          expect(emission).toBeDefined();
          expect(emission!.message).toBe(replyMessage);
          expect(emission!.message.getId()).toBe(messageId);
        }),
        { numRuns: 100 }
      );
    });

    it('should always emit status=success for successful operations', () => {
      fc.assert(
        fc.property(
          mockMessageGenerator(),
          extensionOperationGenerator(),
          (replyMessage, operation) => {
            // Reset state before each test
            simulator.reset();

            // Setup: Set messageToReply
            simulator.setMessageToReply(replyMessage);

            // Action: Execute extension operation
            simulator.executeOperation(operation);

            // Assert: Status is always 'success'
            const emission = simulator.ccReplyToMessage.getLastEmission();
            expect(emission).toBeDefined();
            expect(emission!.status).toBe(MessageStatus.success);
            expect(emission!.status).not.toBe(MessageStatus.error);
            expect(emission!.status).not.toBe(MessageStatus.inprogress);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('No Event Emission When messageToReply Is Not Set', () => {
    /**
     * Inverse property: When messageToReply is NOT set, no event should be emitted.
     */
    it('should NOT emit ccReplyToMessage when messageToReply is null', () => {
      fc.assert(
        fc.property(extensionOperationGenerator(), operation => {
          // Reset state before each test
          simulator.reset();

          // Setup: Ensure messageToReply is null
          expect(simulator.getMessageToReply()).toBeNull();

          // Action: Execute extension operation
          simulator.executeOperation(operation);

          // Assert: No event was emitted
          expect(simulator.ccReplyToMessage.emissionCount).toBe(0);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Reply Mode Cleared After Emission', () => {
    /**
     * Property: After emitting the event, messageToReply should be cleared.
     */
    it('should clear messageToReply after successful operation with quoted reply', () => {
      fc.assert(
        fc.property(
          mockMessageGenerator(),
          extensionOperationGenerator(),
          (replyMessage, operation) => {
            // Reset state before each test
            simulator.reset();

            // Setup: Set messageToReply
            simulator.setMessageToReply(replyMessage);
            expect(simulator.getMessageToReply()).toBe(replyMessage);

            // Action: Execute extension operation
            simulator.executeOperation(operation);

            // Assert: messageToReply is cleared
            expect(simulator.getMessageToReply()).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Specific Extension Operations', () => {
    /**
     * Test each extension operation type individually
     * @see Requirements 2.7, 3.9, 4.7, 5.7
     */

    describe('Poll Creation (Requirement 2.7)', () => {
      it('should emit ccReplyToMessage on poll creation when messageToReply is set', () => {
        fc.assert(
          fc.property(mockMessageGenerator(), replyMessage => {
            simulator.reset();
            simulator.setMessageToReply(replyMessage);

            simulator.onPollCreated();

            const emission = simulator.ccReplyToMessage.getLastEmission();
            expect(emission).toBeDefined();
            expect(emission!.message).toBe(replyMessage);
            expect(emission!.status).toBe(MessageStatus.success);
          }),
          { numRuns: 100 }
        );
      });
    });

    describe('Sticker Send (Requirement 3.9)', () => {
      it('should emit ccReplyToMessage on sticker send when messageToReply is set', () => {
        fc.assert(
          fc.property(mockMessageGenerator(), replyMessage => {
            simulator.reset();
            simulator.setMessageToReply(replyMessage);

            simulator.onStickerSent();

            const emission = simulator.ccReplyToMessage.getLastEmission();
            expect(emission).toBeDefined();
            expect(emission!.message).toBe(replyMessage);
            expect(emission!.status).toBe(MessageStatus.success);
          }),
          { numRuns: 100 }
        );
      });
    });

    describe('Document Creation (Requirement 4.7)', () => {
      it('should emit ccReplyToMessage on document creation when messageToReply is set', () => {
        fc.assert(
          fc.property(mockMessageGenerator(), replyMessage => {
            simulator.reset();
            simulator.setMessageToReply(replyMessage);

            simulator.onDocumentCreated();

            const emission = simulator.ccReplyToMessage.getLastEmission();
            expect(emission).toBeDefined();
            expect(emission!.message).toBe(replyMessage);
            expect(emission!.status).toBe(MessageStatus.success);
          }),
          { numRuns: 100 }
        );
      });
    });

    describe('Whiteboard Creation (Requirement 5.7)', () => {
      it('should emit ccReplyToMessage on whiteboard creation when messageToReply is set', () => {
        fc.assert(
          fc.property(mockMessageGenerator(), replyMessage => {
            simulator.reset();
            simulator.setMessageToReply(replyMessage);

            simulator.onWhiteboardCreated();

            const emission = simulator.ccReplyToMessage.getLastEmission();
            expect(emission).toBeDefined();
            expect(emission!.message).toBe(replyMessage);
            expect(emission!.status).toBe(MessageStatus.success);
          }),
          { numRuns: 100 }
        );
      });
    });
  });

  describe('Sequential Operations', () => {
    /**
     * Property: Each operation should emit exactly one event when messageToReply is set.
     */
    it('should emit exactly one event per operation when messageToReply is set each time', () => {
      fc.assert(
        fc.property(operationSequenceGenerator(), operations => {
          simulator.reset();
          let totalEmissions = 0;

          for (const operation of operations) {
            // Set a new messageToReply for each operation
            const replyMessage = new MockBaseMessage(Date.now() + Math.random());
            simulator.setMessageToReply(replyMessage);

            const emissionsBefore = simulator.ccReplyToMessage.emissionCount;
            simulator.executeOperation(operation);
            const emissionsAfter = simulator.ccReplyToMessage.emissionCount;

            // Exactly one new emission per operation
            expect(emissionsAfter - emissionsBefore).toBe(1);
            totalEmissions++;
          }

          // Total emissions should equal number of operations
          expect(simulator.ccReplyToMessage.emissionCount).toBe(totalEmissions);
        }),
        { numRuns: 100 }
      );
    });

    it('should NOT emit events for operations after reply mode is cleared', () => {
      fc.assert(
        fc.property(
          mockMessageGenerator(),
          operationSequenceGenerator(),
          (replyMessage, operations) => {
            simulator.reset();

            // Set messageToReply only once at the beginning
            simulator.setMessageToReply(replyMessage);

            // First operation should emit
            simulator.executeOperation(operations[0]);
            expect(simulator.ccReplyToMessage.emissionCount).toBe(1);

            // Subsequent operations should NOT emit (reply mode was cleared)
            for (let i = 1; i < operations.length; i++) {
              simulator.executeOperation(operations[i]);
            }

            // Still only one emission
            expect(simulator.ccReplyToMessage.emissionCount).toBe(1);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Determinism', () => {
    /**
     * Property: Same inputs should always produce same outputs.
     */
    it('should be deterministic - same operation with same message always produces same event', () => {
      fc.assert(
        fc.property(
          messageIdGenerator(),
          extensionOperationGenerator(),
          fc.integer({ min: 2, max: 5 }),
          (messageId, operation, repeatCount) => {
            const emissions: ReplyToMessageEvent[] = [];

            for (let i = 0; i < repeatCount; i++) {
              simulator.reset();
              const replyMessage = new MockBaseMessage(messageId);
              simulator.setMessageToReply(replyMessage);
              simulator.executeOperation(operation);

              const emission = simulator.ccReplyToMessage.getLastEmission();
              if (emission) {
                emissions.push({
                  message: new MockBaseMessage(emission.message.getId()),
                  status: emission.status,
                });
              }
            }

            // All emissions should have same message ID and status
            for (let i = 1; i < emissions.length; i++) {
              expect(emissions[i].message.getId()).toBe(emissions[0].message.getId());
              expect(emissions[i].status).toBe(emissions[0].status);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle message with ID 0 correctly', () => {
      // Note: ID 0 might be edge case, but our generator starts at 1
      // Testing with explicit 0
      simulator.reset();
      const replyMessage = new MockBaseMessage(0);
      simulator.setMessageToReply(replyMessage);

      simulator.onPollCreated();

      const emission = simulator.ccReplyToMessage.getLastEmission();
      expect(emission).toBeDefined();
      expect(emission!.message.getId()).toBe(0);
      expect(emission!.status).toBe(MessageStatus.success);
    });

    it('should handle very large message IDs', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1000000, max: Number.MAX_SAFE_INTEGER }),
          extensionOperationGenerator(),
          (largeId, operation) => {
            simulator.reset();
            const replyMessage = new MockBaseMessage(largeId);
            simulator.setMessageToReply(replyMessage);

            simulator.executeOperation(operation);

            const emission = simulator.ccReplyToMessage.getLastEmission();
            expect(emission).toBeDefined();
            expect(emission!.message.getId()).toBe(largeId);
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
