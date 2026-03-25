import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';

/**
 * Property-Based Tests for Reply Mode Message Metadata
 *
 * Feature: message-composer-react-parity
 * Property 2: Reply Mode Message Metadata
 *
 * *For any* message sent while messageToReply is set, the sent message should include
 * quotedMessage reference, quotedMessageId matching the reply message's ID, and the
 * reply mode should be cleared after sending.
 *
 * **Validates: Requirements 2.5, 2.6, 2.7**
 *
 * Since the CometChatMessageComposer component uses Angular's inject() function
 * and complex service dependencies, we test the component logic as pure functions
 * that mirror the component's behavior.
 */

// ==================== Types ====================

/**
 * Simulated message interface for testing
 * Mirrors the essential properties of CometChat.BaseMessage
 */
interface MockMessage {
  id: number;
  text: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  receiverType: 'user' | 'group';
  type: 'text' | 'image' | 'video' | 'audio' | 'file';
  quotedMessage?: MockMessage;
  quotedMessageId?: number;
  parentMessageId?: number;
}

/**
 * Simulated sender interface
 */
interface MockSender {
  uid: string;
  name: string;
}

// ==================== Pure Functions (Mirror Component/Service Logic) ====================

/**
 * Simulates the reply mode state management from the component.
 * This class mirrors the signal-based state management in CometChatMessageComposerComponent.
 *
 * The component uses `messageToReplySignal` to track the message being replied to.
 * When a message is sent, the quoted message metadata is added and reply mode is cleared.
 *
 * @see Requirements 2.1, 2.5, 2.6, 2.7
 */
class ReplyModeStateManager {
  private messageToReply: MockMessage | null = null;
  private composerText = '';

  /**
   * Get the current message being replied to
   */
  getMessageToReply(): MockMessage | null {
    return this.messageToReply;
  }

  /**
   * Get the current composer text
   */
  getComposerText(): string {
    return this.composerText;
  }

  /**
   * Enter reply mode with a specific message
   * Mirrors the enterReplyMode() method in the component
   *
   * @param message - The message to reply to
   * @see Requirements 2.1
   */
  enterReplyMode(message: MockMessage): void {
    this.messageToReply = message;
  }

  /**
   * Exit reply mode
   * Mirrors the exitReplyMode() method in the component
   *
   * @see Requirements 2.7
   */
  exitReplyMode(): void {
    this.messageToReply = null;
  }

  /**
   * Set the composer text
   *
   * @param text - The text to set
   */
  setComposerText(text: string): void {
    this.composerText = text;
  }

  /**
   * Clear the composer text
   */
  clearComposerText(): void {
    this.composerText = '';
  }

  /**
   * Check if in reply mode
   */
  isInReplyMode(): boolean {
    return this.messageToReply !== null;
  }

  /**
   * Reset all state
   */
  reset(): void {
    this.messageToReply = null;
    this.composerText = '';
  }
}

/**
 * Simulates the message sending logic from MessageComposerService.
 * This class mirrors the sendTextMessage method behavior.
 *
 * @see Requirements 2.5, 2.6
 */
class MessageSendingSimulator {
  private lastSentMessage: MockMessage | null = null;
  private messageIdCounter = 1000;

  /**
   * Get the last sent message
   */
  getLastSentMessage(): MockMessage | null {
    return this.lastSentMessage;
  }

  /**
   * Simulate sending a text message
   * Mirrors the sendTextMessage method in MessageComposerService
   *
   * @param receiverId - The receiver ID
   * @param receiverType - The receiver type (user or group)
   * @param text - The message text
   * @param parentMessageId - Optional parent message ID for threaded replies
   * @param quotedMessage - Optional message to quote (for quoted replies)
   * @returns The sent message with metadata
   * @see Requirements 2.5, 2.6
   */
  sendTextMessage(
    receiverId: string,
    receiverType: 'user' | 'group',
    text: string,
    parentMessageId?: number,
    quotedMessage?: MockMessage
  ): MockMessage {
    const message: MockMessage = {
      id: this.messageIdCounter++,
      text,
      senderId: 'current-user',
      senderName: 'Current User',
      receiverId,
      receiverType,
      type: 'text',
    };

    // Set parent message ID for threaded replies
    if (parentMessageId !== undefined) {
      message.parentMessageId = parentMessageId;
    }

    // Set quoted message for quoted replies
    // @see Requirements 2.5, 2.6
    if (quotedMessage) {
      message.quotedMessage = quotedMessage;
      message.quotedMessageId = quotedMessage.id;
    }

    this.lastSentMessage = message;
    return message;
  }

  /**
   * Simulate sending a media message
   * Mirrors the sendMediaMessage method in MessageComposerService
   *
   * @param receiverId - The receiver ID
   * @param receiverType - The receiver type (user or group)
   * @param mediaType - The media type
   * @param parentMessageId - Optional parent message ID for threaded replies
   * @param quotedMessage - Optional message to quote (for quoted replies)
   * @returns The sent message with metadata
   * @see Requirements 12.7
   */
  sendMediaMessage(
    receiverId: string,
    receiverType: 'user' | 'group',
    mediaType: 'image' | 'video' | 'audio' | 'file',
    parentMessageId?: number,
    quotedMessage?: MockMessage
  ): MockMessage {
    const message: MockMessage = {
      id: this.messageIdCounter++,
      text: '',
      senderId: 'current-user',
      senderName: 'Current User',
      receiverId,
      receiverType,
      type: mediaType,
    };

    // Set parent message ID for threaded replies
    if (parentMessageId !== undefined) {
      message.parentMessageId = parentMessageId;
    }

    // Set quoted message for quoted replies
    // @see Requirements 12.7
    if (quotedMessage) {
      message.quotedMessage = quotedMessage;
      message.quotedMessageId = quotedMessage.id;
    }

    this.lastSentMessage = message;
    return message;
  }

  /**
   * Reset the simulator state
   */
  reset(): void {
    this.lastSentMessage = null;
    this.messageIdCounter = 1000;
  }
}

/**
 * Simulates the complete send flow from the component.
 * Combines state management and message sending.
 *
 * @see Requirements 2.5, 2.6, 2.7
 */
class MessageComposerSimulator {
  private stateManager: ReplyModeStateManager;
  private sendingSimulator: MessageSendingSimulator;
  private receiverId = 'receiver-1';
  private receiverType: 'user' | 'group' = 'user';
  private parentMessageId?: number;

  constructor() {
    this.stateManager = new ReplyModeStateManager();
    this.sendingSimulator = new MessageSendingSimulator();
  }

  /**
   * Set the receiver for messages
   */
  setReceiver(receiverId: string, receiverType: 'user' | 'group'): void {
    this.receiverId = receiverId;
    this.receiverType = receiverType;
  }

  /**
   * Set the parent message ID for threaded replies
   */
  setParentMessageId(parentMessageId?: number): void {
    this.parentMessageId = parentMessageId;
  }

  /**
   * Enter reply mode
   */
  enterReplyMode(message: MockMessage): void {
    this.stateManager.enterReplyMode(message);
  }

  /**
   * Exit reply mode
   */
  exitReplyMode(): void {
    this.stateManager.exitReplyMode();
  }

  /**
   * Set composer text
   */
  setComposerText(text: string): void {
    this.stateManager.setComposerText(text);
  }

  /**
   * Get the message being replied to
   */
  getMessageToReply(): MockMessage | null {
    return this.stateManager.getMessageToReply();
  }

  /**
   * Check if in reply mode
   */
  isInReplyMode(): boolean {
    return this.stateManager.isInReplyMode();
  }

  /**
   * Send a text message
   * Mirrors the handleSendNewMessage flow in the component
   *
   * @returns The sent message
   * @see Requirements 2.5, 2.6, 2.7
   */
  sendTextMessage(): MockMessage {
    const text = this.stateManager.getComposerText();
    const quotedMessage = this.stateManager.getMessageToReply() || undefined;

    // Send the message with quoted message metadata
    const sentMessage = this.sendingSimulator.sendTextMessage(
      this.receiverId,
      this.receiverType,
      text,
      this.parentMessageId,
      quotedMessage
    );

    // Clear composer text after sending
    this.stateManager.clearComposerText();

    // Clear reply mode after successful send
    // @see Requirements 2.7
    if (quotedMessage) {
      this.stateManager.exitReplyMode();
    }

    return sentMessage;
  }

  /**
   * Send a media message
   * Mirrors the handleSendNewMessage flow for media in the component
   *
   * @param mediaType - The type of media
   * @returns The sent message
   * @see Requirements 12.7
   */
  sendMediaMessage(mediaType: 'image' | 'video' | 'audio' | 'file'): MockMessage {
    const quotedMessage = this.stateManager.getMessageToReply() || undefined;

    // Send the message with quoted message metadata
    const sentMessage = this.sendingSimulator.sendMediaMessage(
      this.receiverId,
      this.receiverType,
      mediaType,
      this.parentMessageId,
      quotedMessage
    );

    // Clear reply mode after successful send
    // @see Requirements 2.7
    if (quotedMessage) {
      this.stateManager.exitReplyMode();
    }

    return sentMessage;
  }

  /**
   * Get the last sent message
   */
  getLastSentMessage(): MockMessage | null {
    return this.sendingSimulator.getLastSentMessage();
  }

  /**
   * Reset all state
   */
  reset(): void {
    this.stateManager.reset();
    this.sendingSimulator.reset();
    this.receiverId = 'receiver-1';
    this.receiverType = 'user';
    this.parentMessageId = undefined;
  }
}

// ==================== Test Generators ====================

/**
 * Generator for valid message IDs (positive integers)
 */
const messageIdGenerator = (): fc.Arbitrary<number> => fc.integer({ min: 1, max: 1000000 });

/**
 * Generator for valid user IDs (non-empty strings)
 */
const userIdGenerator = (): fc.Arbitrary<string> =>
  fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0);

/**
 * Generator for valid user names (non-empty strings)
 */
const userNameGenerator = (): fc.Arbitrary<string> =>
  fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0);

/**
 * Generator for valid message text (non-empty strings)
 */
const messageTextGenerator = (): fc.Arbitrary<string> =>
  fc.string({ minLength: 1, maxLength: 1000 }).filter(s => s.trim().length > 0);

/**
 * Generator for receiver types
 */
const receiverTypeGenerator = (): fc.Arbitrary<'user' | 'group'> =>
  fc.constantFrom('user', 'group');

/**
 * Generator for media types
 */
const mediaTypeGenerator = (): fc.Arbitrary<'image' | 'video' | 'audio' | 'file'> =>
  fc.constantFrom('image', 'video', 'audio', 'file');

/**
 * Generator for mock sender
 */
const mockSenderGenerator = (): fc.Arbitrary<MockSender> =>
  fc.record({
    uid: userIdGenerator(),
    name: userNameGenerator(),
  });

/**
 * Generator for mock messages (to be replied to)
 */
const mockMessageGenerator = (): fc.Arbitrary<MockMessage> =>
  fc.record({
    id: messageIdGenerator(),
    text: messageTextGenerator(),
    senderId: userIdGenerator(),
    senderName: userNameGenerator(),
    receiverId: userIdGenerator(),
    receiverType: receiverTypeGenerator(),
    type: fc.constant('text' as const),
  });

/**
 * Generator for optional parent message ID
 */
const optionalParentMessageIdGenerator = (): fc.Arbitrary<number | undefined> =>
  fc.option(messageIdGenerator(), { nil: undefined });

// ==================== Property Tests ====================

describe('CometChatMessageComposer Property Tests - Reply Mode Message Metadata', () => {
  let composer: MessageComposerSimulator;

  beforeEach(() => {
    composer = new MessageComposerSimulator();
  });

  /**
   * Feature: message-composer-react-parity, Property 2: Reply Mode Message Metadata
   *
   * Core property: When a message is sent in reply mode, it should include
   * quotedMessage and quotedMessageId, and reply mode should be cleared.
   *
   * **Validates: Requirements 2.5, 2.6, 2.7**
   */
  describe('Property 2: Reply Mode Message Metadata', () => {
    it('should include quotedMessage when sending in reply mode', () => {
      fc.assert(
        fc.property(
          mockMessageGenerator(),
          messageTextGenerator(),
          (replyToMessage, textContent) => {
            // Reset state before each test
            composer.reset();

            // Setup: Enter reply mode and set text
            composer.enterReplyMode(replyToMessage);
            composer.setComposerText(textContent);

            // Verify we are in reply mode
            expect(composer.isInReplyMode()).toBe(true);
            expect(composer.getMessageToReply()).toEqual(replyToMessage);

            // Action: Send message
            const sentMessage = composer.sendTextMessage();

            // Assert: Sent message includes quotedMessage
            // @see Requirements 2.5
            expect(sentMessage.quotedMessage).toBeDefined();
            expect(sentMessage.quotedMessage).toEqual(replyToMessage);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include quotedMessageId matching the reply message ID', () => {
      fc.assert(
        fc.property(
          mockMessageGenerator(),
          messageTextGenerator(),
          (replyToMessage, textContent) => {
            // Reset state before each test
            composer.reset();

            // Setup: Enter reply mode and set text
            composer.enterReplyMode(replyToMessage);
            composer.setComposerText(textContent);

            // Action: Send message
            const sentMessage = composer.sendTextMessage();

            // Assert: quotedMessageId matches the reply message's ID
            // @see Requirements 2.6
            expect(sentMessage.quotedMessageId).toBeDefined();
            expect(sentMessage.quotedMessageId).toBe(replyToMessage.id);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should clear reply mode after sending message', () => {
      fc.assert(
        fc.property(
          mockMessageGenerator(),
          messageTextGenerator(),
          (replyToMessage, textContent) => {
            // Reset state before each test
            composer.reset();

            // Setup: Enter reply mode and set text
            composer.enterReplyMode(replyToMessage);
            composer.setComposerText(textContent);

            // Verify we are in reply mode before sending
            expect(composer.isInReplyMode()).toBe(true);

            // Action: Send message
            composer.sendTextMessage();

            // Assert: Reply mode is cleared after sending
            // @see Requirements 2.7
            expect(composer.isInReplyMode()).toBe(false);
            expect(composer.getMessageToReply()).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include all three properties together when sending in reply mode', () => {
      fc.assert(
        fc.property(
          mockMessageGenerator(),
          messageTextGenerator(),
          (replyToMessage, textContent) => {
            // Reset state before each test
            composer.reset();

            // Setup: Enter reply mode and set text
            composer.enterReplyMode(replyToMessage);
            composer.setComposerText(textContent);

            // Action: Send message
            const sentMessage = composer.sendTextMessage();

            // Assert: All three requirements are satisfied together
            // @see Requirements 2.5, 2.6, 2.7
            expect(sentMessage.quotedMessage).toEqual(replyToMessage);
            expect(sentMessage.quotedMessageId).toBe(replyToMessage.id);
            expect(composer.isInReplyMode()).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should NOT include quotedMessage when NOT in reply mode', () => {
      fc.assert(
        fc.property(messageTextGenerator(), textContent => {
          // Reset state before each test
          composer.reset();

          // Setup: Set text but do NOT enter reply mode
          composer.setComposerText(textContent);

          // Verify we are NOT in reply mode
          expect(composer.isInReplyMode()).toBe(false);

          // Action: Send message
          const sentMessage = composer.sendTextMessage();

          // Assert: Sent message does NOT include quotedMessage
          expect(sentMessage.quotedMessage).toBeUndefined();
          expect(sentMessage.quotedMessageId).toBeUndefined();
        }),
        { numRuns: 100 }
      );
    });

    it('should support both parentMessageId and quotedMessage simultaneously', () => {
      fc.assert(
        fc.property(
          mockMessageGenerator(),
          messageTextGenerator(),
          messageIdGenerator(),
          (replyToMessage, textContent, parentMessageId) => {
            // Reset state before each test
            composer.reset();

            // Setup: Set parent message ID (threaded reply) AND enter reply mode (quoted reply)
            composer.setParentMessageId(parentMessageId);
            composer.enterReplyMode(replyToMessage);
            composer.setComposerText(textContent);

            // Action: Send message
            const sentMessage = composer.sendTextMessage();

            // Assert: Both parentMessageId and quotedMessage are set
            // @see Requirements 2.8
            expect(sentMessage.parentMessageId).toBe(parentMessageId);
            expect(sentMessage.quotedMessage).toEqual(replyToMessage);
            expect(sentMessage.quotedMessageId).toBe(replyToMessage.id);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include quotedMessage in media messages when in reply mode', () => {
      fc.assert(
        fc.property(mockMessageGenerator(), mediaTypeGenerator(), (replyToMessage, mediaType) => {
          // Reset state before each test
          composer.reset();

          // Setup: Enter reply mode
          composer.enterReplyMode(replyToMessage);

          // Action: Send media message
          const sentMessage = composer.sendMediaMessage(mediaType);

          // Assert: Media message includes quotedMessage
          // @see Requirements 12.7
          expect(sentMessage.quotedMessage).toEqual(replyToMessage);
          expect(sentMessage.quotedMessageId).toBe(replyToMessage.id);
          expect(sentMessage.type).toBe(mediaType);
        }),
        { numRuns: 100 }
      );
    });

    it('should clear reply mode after sending media message', () => {
      fc.assert(
        fc.property(mockMessageGenerator(), mediaTypeGenerator(), (replyToMessage, mediaType) => {
          // Reset state before each test
          composer.reset();

          // Setup: Enter reply mode
          composer.enterReplyMode(replyToMessage);

          // Verify we are in reply mode before sending
          expect(composer.isInReplyMode()).toBe(true);

          // Action: Send media message
          composer.sendMediaMessage(mediaType);

          // Assert: Reply mode is cleared after sending
          // @see Requirements 2.7
          expect(composer.isInReplyMode()).toBe(false);
          expect(composer.getMessageToReply()).toBeNull();
        }),
        { numRuns: 100 }
      );
    });

    it('should preserve quotedMessageId across different message types', () => {
      fc.assert(
        fc.property(
          mockMessageGenerator(),
          messageTextGenerator(),
          mediaTypeGenerator(),
          (replyToMessage, textContent, mediaType) => {
            // Reset state before each test
            composer.reset();

            // Test 1: Text message
            composer.enterReplyMode(replyToMessage);
            composer.setComposerText(textContent);
            const textMessage = composer.sendTextMessage();
            expect(textMessage.quotedMessageId).toBe(replyToMessage.id);

            // Reset for next test
            composer.reset();

            // Test 2: Media message
            composer.enterReplyMode(replyToMessage);
            const mediaMessage = composer.sendMediaMessage(mediaType);
            expect(mediaMessage.quotedMessageId).toBe(replyToMessage.id);

            // Both should have the same quotedMessageId
            expect(textMessage.quotedMessageId).toBe(mediaMessage.quotedMessageId);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle entering and exiting reply mode multiple times', () => {
      fc.assert(
        fc.property(
          fc.array(mockMessageGenerator(), { minLength: 2, maxLength: 10 }),
          messageTextGenerator(),
          (messages, textContent) => {
            // Reset state before each test
            composer.reset();

            // Enter and exit reply mode multiple times
            for (const message of messages) {
              // Enter reply mode
              composer.enterReplyMode(message);
              expect(composer.isInReplyMode()).toBe(true);
              expect(composer.getMessageToReply()).toEqual(message);

              // Exit reply mode
              composer.exitReplyMode();
              expect(composer.isInReplyMode()).toBe(false);
              expect(composer.getMessageToReply()).toBeNull();
            }

            // Final test: enter reply mode and send
            const lastMessage = messages[messages.length - 1];
            composer.enterReplyMode(lastMessage);
            composer.setComposerText(textContent);
            const sentMessage = composer.sendTextMessage();

            // Verify the sent message has correct metadata
            expect(sentMessage.quotedMessage).toEqual(lastMessage);
            expect(sentMessage.quotedMessageId).toBe(lastMessage.id);
            expect(composer.isInReplyMode()).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle different receiver types correctly', () => {
      fc.assert(
        fc.property(
          mockMessageGenerator(),
          messageTextGenerator(),
          userIdGenerator(),
          receiverTypeGenerator(),
          (replyToMessage, textContent, receiverId, receiverType) => {
            // Reset state before each test
            composer.reset();

            // Setup: Set receiver and enter reply mode
            composer.setReceiver(receiverId, receiverType);
            composer.enterReplyMode(replyToMessage);
            composer.setComposerText(textContent);

            // Action: Send message
            const sentMessage = composer.sendTextMessage();

            // Assert: Message has correct receiver and quoted message
            expect(sentMessage.receiverId).toBe(receiverId);
            expect(sentMessage.receiverType).toBe(receiverType);
            expect(sentMessage.quotedMessage).toEqual(replyToMessage);
            expect(sentMessage.quotedMessageId).toBe(replyToMessage.id);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should be deterministic - same inputs always produce same metadata', () => {
      fc.assert(
        fc.property(
          mockMessageGenerator(),
          messageTextGenerator(),
          fc.integer({ min: 2, max: 5 }),
          (replyToMessage, textContent, repeatCount) => {
            const results: { quotedMessageId: number | undefined }[] = [];

            for (let i = 0; i < repeatCount; i++) {
              // Reset and replay the same scenario
              composer.reset();
              composer.enterReplyMode(replyToMessage);
              composer.setComposerText(textContent);
              const sentMessage = composer.sendTextMessage();
              results.push({ quotedMessageId: sentMessage.quotedMessageId });
            }

            // All results should have the same quotedMessageId
            for (let i = 1; i < results.length; i++) {
              expect(results[i].quotedMessageId).toBe(results[0].quotedMessageId);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
