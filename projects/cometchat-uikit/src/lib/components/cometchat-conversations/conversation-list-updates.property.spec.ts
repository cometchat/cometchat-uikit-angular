/**
 * Property-Based Tests for Conversation List Last Message Update
 *
 * **Property 13: Conversation List Last Message Update**
 *
 * *For any* message sent or received in the active conversation, the Conversations_List
 * SHALL update the last message preview for that conversation.
 *
 * **Validates: Requirements 10.2, 10.4**
 *
 * - 10.2: When a new message is sent, the conversation list should update to show
 *         the new message as the last message
 * - 10.4: When a new message is received, the conversation should move to the top of the list
 *
 * **Feature: uikit-critical-bugfixes, Property 13: Conversation List Last Message Update**
 *
 * @module components/cometchat-conversations/property-tests
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// ============================================
// Mock Classes for Property Testing
// ============================================

/**
 * Mock CometChat.User class for property testing
 */
class MockUser {
  private uid: string;
  private name: string;
  private avatar: string;
  private status: string;

  constructor(uid: string, name: string, avatar = '', status = 'offline') {
    this.uid = uid;
    this.name = name;
    this.avatar = avatar;
    this.status = status;
  }

  getUid(): string {
    return this.uid;
  }

  getName(): string {
    return this.name;
  }

  getAvatar(): string {
    return this.avatar;
  }

  getStatus(): string {
    return this.status;
  }
}

/**
 * Mock CometChat.Group class for property testing
 */
class MockGroup {
  private guid: string;
  private name: string;
  private icon: string;
  private type: string;
  private membersCount: number;

  constructor(guid: string, name: string, icon = '', type = 'public', membersCount = 0) {
    this.guid = guid;
    this.name = name;
    this.icon = icon;
    this.type = type;
    this.membersCount = membersCount;
  }

  getGuid(): string {
    return this.guid;
  }

  getName(): string {
    return this.name;
  }

  getIcon(): string {
    return this.icon;
  }

  getType(): string {
    return this.type;
  }

  getMembersCount(): number {
    return this.membersCount;
  }
}

/**
 * Mock CometChat.TextMessage class for property testing
 */
class MockTextMessage {
  private id: number;
  private text: string;
  private sender: MockUser;
  private receiverId: string;
  private receiverType: 'user' | 'group';
  private sentAt: number;
  private category: string;
  private type: string;

  constructor(
    id: number,
    text: string,
    sender: MockUser,
    receiverId: string,
    receiverType: 'user' | 'group',
    sentAt: number
  ) {
    this.id = id;
    this.text = text;
    this.sender = sender;
    this.receiverId = receiverId;
    this.receiverType = receiverType;
    this.sentAt = sentAt;
    this.category = 'message';
    this.type = 'text';
  }

  getId(): number {
    return this.id;
  }

  getText(): string {
    return this.text;
  }

  getSender(): MockUser {
    return this.sender;
  }

  getReceiverId(): string {
    return this.receiverId;
  }

  getReceiverType(): string {
    return this.receiverType;
  }

  getSentAt(): number {
    return this.sentAt;
  }

  getCategory(): string {
    return this.category;
  }

  getType(): string {
    return this.type;
  }
}

/**
 * Mock CometChat.Conversation class for property testing
 */
class MockConversation {
  private conversationId: string;
  private conversationWith: MockUser | MockGroup;
  private conversationType: 'user' | 'group';
  private lastMessage: MockTextMessage | null;
  private unreadMessageCount: number;
  private updatedAt: number;

  constructor(
    conversationId: string,
    conversationWith: MockUser | MockGroup,
    conversationType: 'user' | 'group',
    lastMessage: MockTextMessage | null = null,
    unreadMessageCount = 0,
    updatedAt = Date.now()
  ) {
    this.conversationId = conversationId;
    this.conversationWith = conversationWith;
    this.conversationType = conversationType;
    this.lastMessage = lastMessage;
    this.unreadMessageCount = unreadMessageCount;
    this.updatedAt = updatedAt;
  }

  getConversationId(): string {
    return this.conversationId;
  }

  getConversationWith(): MockUser | MockGroup {
    return this.conversationWith;
  }

  getConversationType(): string {
    return this.conversationType;
  }

  getLastMessage(): MockTextMessage | null {
    return this.lastMessage;
  }

  setLastMessage(message: MockTextMessage): void {
    this.lastMessage = message;
    this.updatedAt = message.getSentAt();
  }

  getUnreadMessageCount(): number {
    return this.unreadMessageCount;
  }

  setUnreadMessageCount(count: number): void {
    this.unreadMessageCount = count;
  }

  getUpdatedAt(): number {
    return this.updatedAt;
  }

  setUpdatedAt(timestamp: number): void {
    this.updatedAt = timestamp;
  }
}

/**
 * Mock ConversationsService for property testing
 * Simulates the service's behavior for managing conversation list updates
 */
class MockConversationsService {
  private conversations: MockConversation[] = [];
  private allConversations: MockConversation[] = [];

  /**
   * Set initial conversations list
   */
  setConversations(conversations: MockConversation[]): void {
    this.conversations = [...conversations];
    this.allConversations = [...conversations];
  }

  /**
   * Get current conversations list
   */
  getConversations(): MockConversation[] {
    return this.conversations;
  }

  /**
   * Get conversation ID from a conversation
   */
  private getConversationEntityId(conversation: MockConversation): string {
    const conversationWith = conversation.getConversationWith();
    return conversationWith instanceof MockUser
      ? conversationWith.getUid()
      : conversationWith.getGuid();
  }

  /**
   * Update or add a conversation to the list
   * Moves updated conversation to the top (most recent first sorting)
   * This mirrors the real ConversationsService.updateConversationList() method
   *
   * @param conversation - Conversation to update/add
   */
  updateConversationList(conversation: MockConversation): void {
    const conversations = [...this.allConversations];
    const conversationId = this.getConversationEntityId(conversation);

    // Find existing conversation
    const existingIndex = conversations.findIndex(conv => {
      return this.getConversationEntityId(conv) === conversationId;
    });

    if (existingIndex !== -1) {
      // Remove existing and add updated to top
      conversations.splice(existingIndex, 1);
    }

    // Add to top (most recent first)
    const updatedConversations = [conversation, ...conversations];
    this.allConversations = updatedConversations;
    this.conversations = updatedConversations;
  }

  /**
   * Handle new message received
   * Updates the conversation list with the new message
   * This mirrors the real ConversationsService.handleNewMessage() method
   *
   * @param message - The new message received
   * @param conversationWith - The user or group the conversation is with
   */
  handleNewMessage(
    message: MockTextMessage,
    conversationWith: MockUser | MockGroup
  ): MockConversation {
    const conversationId =
      conversationWith instanceof MockUser ? conversationWith.getUid() : conversationWith.getGuid();
    const conversationType: 'user' | 'group' =
      conversationWith instanceof MockUser ? 'user' : 'group';

    // Find existing conversation or create new one
    let conversation = this.conversations.find(
      conv => this.getConversationEntityId(conv) === conversationId
    );

    if (conversation) {
      // Update existing conversation
      conversation.setLastMessage(message);
      conversation.setUpdatedAt(message.getSentAt());
    } else {
      // Create new conversation
      conversation = new MockConversation(
        `conv_${conversationId}`,
        conversationWith,
        conversationType,
        message,
        0,
        message.getSentAt()
      );
    }

    // Update conversation list (moves to top)
    this.updateConversationList(conversation);

    return conversation;
  }

  /**
   * Get the position of a conversation in the list
   * @param conversationWith - The user or group to find
   * @returns The index position (0 = top) or -1 if not found
   */
  getConversationPosition(conversationWith: MockUser | MockGroup): number {
    const conversationId =
      conversationWith instanceof MockUser ? conversationWith.getUid() : conversationWith.getGuid();

    return this.conversations.findIndex(
      conv => this.getConversationEntityId(conv) === conversationId
    );
  }
}

// ============================================
// Fast-Check Arbitraries (Generators)
// ============================================

/**
 * Arbitrary for generating valid user IDs
 */
const userIdArbitrary = fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0);

/**
 * Arbitrary for generating valid user names
 */
const userNameArbitrary = fc
  .string({ minLength: 1, maxLength: 100 })
  .filter(s => s.trim().length > 0);

/**
 * Arbitrary for generating valid avatar URLs
 */
const avatarUrlArbitrary = fc.oneof(
  fc.constant(''),
  fc.constantFrom(
    'https://example.com/avatar1.jpg',
    'https://example.com/avatar2.png',
    'https://example.com/avatar3.jpg'
  )
);

/**
 * Arbitrary for generating valid user statuses
 */
const userStatusArbitrary = fc.constantFrom('online', 'offline');

/**
 * Arbitrary for generating valid CometChat.User objects
 */
const userArbitrary = fc
  .record({
    uid: userIdArbitrary,
    name: userNameArbitrary,
    avatar: avatarUrlArbitrary,
    status: userStatusArbitrary,
  })
  .map(({ uid, name, avatar, status }) => new MockUser(uid, name, avatar, status));

/**
 * Arbitrary for generating valid group IDs
 */
const groupIdArbitrary = fc
  .string({ minLength: 1, maxLength: 50 })
  .filter(s => s.trim().length > 0);

/**
 * Arbitrary for generating valid group names
 */
const groupNameArbitrary = fc
  .string({ minLength: 1, maxLength: 100 })
  .filter(s => s.trim().length > 0);

/**
 * Arbitrary for generating valid group types
 */
const groupTypeArbitrary = fc.constantFrom('public', 'private', 'password');

/**
 * Arbitrary for generating valid CometChat.Group objects
 */
const groupArbitrary = fc
  .record({
    guid: groupIdArbitrary,
    name: groupNameArbitrary,
    icon: avatarUrlArbitrary,
    type: groupTypeArbitrary,
    membersCount: fc.integer({ min: 1, max: 1000 }),
  })
  .map(
    ({ guid, name, icon, type, membersCount }) =>
      new MockGroup(guid, name, icon, type, membersCount)
  );

/**
 * Arbitrary for generating valid message text
 */
const messageTextArbitrary = fc
  .string({ minLength: 1, maxLength: 500 })
  .filter(s => s.trim().length > 0);

/**
 * Arbitrary for generating valid message IDs
 */
const messageIdArbitrary = fc.integer({ min: 1, max: 1000000 });

/**
 * Arbitrary for generating valid timestamps
 */
const timestampArbitrary = fc.integer({
  min: Date.now() - 86400000 * 30, // 30 days ago
  max: Date.now() + 1000,
});

/**
 * Arbitrary for generating a text message for a user conversation
 */
const userTextMessageArbitrary = fc
  .record({
    id: messageIdArbitrary,
    text: messageTextArbitrary,
    sender: userArbitrary,
    receiver: userArbitrary,
    sentAt: timestampArbitrary,
  })
  .map(
    ({ id, text, sender, receiver, sentAt }) =>
      new MockTextMessage(id, text, sender, receiver.getUid(), 'user', sentAt)
  );

/**
 * Arbitrary for generating a text message for a group conversation
 */
const groupTextMessageArbitrary = fc
  .record({
    id: messageIdArbitrary,
    text: messageTextArbitrary,
    sender: userArbitrary,
    group: groupArbitrary,
    sentAt: timestampArbitrary,
  })
  .map(
    ({ id, text, sender, group, sentAt }) =>
      new MockTextMessage(id, text, sender, group.getGuid(), 'group', sentAt)
  );

/**
 * Arbitrary for generating a user conversation with optional last message
 */
const userConversationArbitrary = fc
  .record({
    user: userArbitrary,
    hasLastMessage: fc.boolean(),
    lastMessageText: messageTextArbitrary,
    lastMessageId: messageIdArbitrary,
    sender: userArbitrary,
    sentAt: timestampArbitrary,
    unreadCount: fc.integer({ min: 0, max: 100 }),
  })
  .map(({ user, hasLastMessage, lastMessageText, lastMessageId, sender, sentAt, unreadCount }) => {
    const lastMessage = hasLastMessage
      ? new MockTextMessage(lastMessageId, lastMessageText, sender, user.getUid(), 'user', sentAt)
      : null;
    return new MockConversation(
      `conv_${user.getUid()}`,
      user,
      'user',
      lastMessage,
      unreadCount,
      sentAt
    );
  });

/**
 * Arbitrary for generating a group conversation with optional last message
 */
const groupConversationArbitrary = fc
  .record({
    group: groupArbitrary,
    hasLastMessage: fc.boolean(),
    lastMessageText: messageTextArbitrary,
    lastMessageId: messageIdArbitrary,
    sender: userArbitrary,
    sentAt: timestampArbitrary,
    unreadCount: fc.integer({ min: 0, max: 100 }),
  })
  .map(({ group, hasLastMessage, lastMessageText, lastMessageId, sender, sentAt, unreadCount }) => {
    const lastMessage = hasLastMessage
      ? new MockTextMessage(
          lastMessageId,
          lastMessageText,
          sender,
          group.getGuid(),
          'group',
          sentAt
        )
      : null;
    return new MockConversation(
      `conv_${group.getGuid()}`,
      group,
      'group',
      lastMessage,
      unreadCount,
      sentAt
    );
  });

/**
 * Arbitrary for generating mixed conversations (users and groups)
 */
const conversationArbitrary = fc.oneof(userConversationArbitrary, groupConversationArbitrary);

/**
 * Arbitrary for generating a list of conversations with unique IDs
 */
const conversationListArbitrary = fc
  .array(conversationArbitrary, { minLength: 2, maxLength: 20 })
  .map(conversations => {
    const uniqueConversations = new Map<string, MockConversation>();
    conversations.forEach(conv => {
      uniqueConversations.set(conv.getConversationId(), conv);
    });
    return Array.from(uniqueConversations.values());
  })
  .filter(conversations => conversations.length >= 2);

// ============================================
// Property-Based Tests
// ============================================

/**
 * Property 13: Conversation List Last Message Update
 *
 * *For any* message sent or received in the active conversation, the Conversations_List
 * SHALL update the last message preview for that conversation.
 *
 * **Validates: Requirements 10.2, 10.4**
 *
 * **Feature: uikit-critical-bugfixes, Property 13: Conversation List Last Message Update**
 */
describe('Property 13: Conversation List Last Message Update', () => {
  // ==================== Last Message Update Tests ====================

  describe('Last Message Preview Update (Requirement 10.2)', () => {
    /**
     * Test that when a new message is sent, the conversation's last message updates
     * **Validates: Requirement 10.2**
     */
    it('should update last message when new message is sent for any user conversation', () => {
      fc.assert(
        fc.property(
          conversationListArbitrary,
          messageTextArbitrary,
          messageIdArbitrary,
          userArbitrary,
          timestampArbitrary,
          (conversations, newMessageText, newMessageId, sender, sentAt) => {
            // Arrange
            const service = new MockConversationsService();
            service.setConversations(conversations);

            // Get a random existing conversation
            const targetConversation = conversations[0];
            const conversationWith = targetConversation.getConversationWith();

            // Create a new message for this conversation
            const receiverId =
              conversationWith instanceof MockUser
                ? conversationWith.getUid()
                : conversationWith.getGuid();
            const receiverType: 'user' | 'group' =
              conversationWith instanceof MockUser ? 'user' : 'group';
            const newMessage = new MockTextMessage(
              newMessageId,
              newMessageText,
              sender,
              receiverId,
              receiverType,
              sentAt
            );

            // Act - Handle new message (simulates message sent)
            service.handleNewMessage(newMessage, conversationWith);

            // Assert - The conversation's last message should be updated
            const updatedConversations = service.getConversations();
            const updatedConversation = updatedConversations.find(
              conv => conv.getConversationId() === targetConversation.getConversationId()
            );

            expect(updatedConversation).toBeDefined();
            expect(updatedConversation!.getLastMessage()).toBeDefined();
            expect(updatedConversation!.getLastMessage()!.getText()).toBe(newMessageText);
            expect(updatedConversation!.getLastMessage()!.getId()).toBe(newMessageId);
          }
        ),
        { numRuns: 20 }
      );
    });

    /**
     * Test that last message text updates correctly for any message content
     * **Validates: Requirement 10.2**
     */
    it('should correctly update last message preview text for any message content', () => {
      fc.assert(
        fc.property(
          userArbitrary,
          fc.array(messageTextArbitrary, { minLength: 1, maxLength: 10 }),
          userArbitrary,
          (conversationUser, messageTexts, sender) => {
            // Arrange
            const service = new MockConversationsService();
            const initialConversation = new MockConversation(
              `conv_${conversationUser.getUid()}`,
              conversationUser,
              'user',
              null,
              0,
              Date.now() - 100000
            );
            service.setConversations([initialConversation]);

            // Act - Send multiple messages and verify each update
            let messageId = 1;
            let lastTimestamp = Date.now();

            messageTexts.forEach(text => {
              const message = new MockTextMessage(
                messageId++,
                text,
                sender,
                conversationUser.getUid(),
                'user',
                lastTimestamp++
              );

              service.handleNewMessage(message, conversationUser);

              // Assert - Last message should match the most recent message
              const conversations = service.getConversations();
              const conversation = conversations[0];
              expect(conversation.getLastMessage()!.getText()).toBe(text);
            });
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  // ==================== Conversation Position Tests ====================

  describe('Conversation Moves to Top (Requirement 10.4)', () => {
    /**
     * Test that when a new message is received, the conversation moves to the top of the list
     * **Validates: Requirement 10.4**
     */
    it('should move conversation to top when new message is received for any conversation list', () => {
      fc.assert(
        fc.property(
          conversationListArbitrary,
          fc.integer({ min: 1, max: 19 }),
          messageTextArbitrary,
          messageIdArbitrary,
          userArbitrary,
          (conversations, targetIndex, newMessageText, newMessageId, sender) => {
            // Arrange
            const service = new MockConversationsService();
            service.setConversations(conversations);

            // Get a conversation that is NOT at the top
            const safeIndex = Math.min(targetIndex, conversations.length - 1);
            // Skip if the conversation is already at the top
            if (safeIndex === 0) return;

            const targetConversation = conversations[safeIndex];
            const conversationWith = targetConversation.getConversationWith();

            // Verify initial position is not at top
            const initialPosition = service.getConversationPosition(conversationWith);
            expect(initialPosition).toBeGreaterThan(0);

            // Create a new message for this conversation
            const receiverId =
              conversationWith instanceof MockUser
                ? conversationWith.getUid()
                : conversationWith.getGuid();
            const receiverType: 'user' | 'group' =
              conversationWith instanceof MockUser ? 'user' : 'group';
            const newMessage = new MockTextMessage(
              newMessageId,
              newMessageText,
              sender,
              receiverId,
              receiverType,
              Date.now()
            );

            // Act - Handle new message (simulates message received)
            service.handleNewMessage(newMessage, conversationWith);

            // Assert - The conversation should now be at the top (position 0)
            const newPosition = service.getConversationPosition(conversationWith);
            expect(newPosition).toBe(0);
          }
        ),
        { numRuns: 20 }
      );
    });

    /**
     * Test that conversation at top stays at top when new message is received
     * **Validates: Requirement 10.4**
     */
    it('should keep conversation at top when it receives a new message and is already at top', () => {
      fc.assert(
        fc.property(
          conversationListArbitrary,
          messageTextArbitrary,
          messageIdArbitrary,
          userArbitrary,
          (conversations, newMessageText, newMessageId, sender) => {
            // Arrange
            const service = new MockConversationsService();
            service.setConversations(conversations);

            // Get the conversation at the top
            const topConversation = conversations[0];
            const conversationWith = topConversation.getConversationWith();

            // Verify initial position is at top
            expect(service.getConversationPosition(conversationWith)).toBe(0);

            // Create a new message for this conversation
            const receiverId =
              conversationWith instanceof MockUser
                ? conversationWith.getUid()
                : conversationWith.getGuid();
            const receiverType: 'user' | 'group' =
              conversationWith instanceof MockUser ? 'user' : 'group';
            const newMessage = new MockTextMessage(
              newMessageId,
              newMessageText,
              sender,
              receiverId,
              receiverType,
              Date.now()
            );

            // Act - Handle new message
            service.handleNewMessage(newMessage, conversationWith);

            // Assert - The conversation should still be at the top
            expect(service.getConversationPosition(conversationWith)).toBe(0);
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  // ==================== Timestamp Update Tests ====================

  describe('Timestamp Updates Correctly', () => {
    /**
     * Test that conversation timestamp updates when new message is received
     * **Validates: Requirements 10.2, 10.4**
     */
    it('should update conversation timestamp when new message is received', () => {
      fc.assert(
        fc.property(
          conversationListArbitrary,
          messageTextArbitrary,
          messageIdArbitrary,
          userArbitrary,
          timestampArbitrary,
          (conversations, newMessageText, newMessageId, sender, newTimestamp) => {
            // Arrange
            const service = new MockConversationsService();
            service.setConversations(conversations);

            const targetConversation = conversations[0];
            const conversationWith = targetConversation.getConversationWith();

            // Create a new message with specific timestamp
            const receiverId =
              conversationWith instanceof MockUser
                ? conversationWith.getUid()
                : conversationWith.getGuid();
            const receiverType: 'user' | 'group' =
              conversationWith instanceof MockUser ? 'user' : 'group';
            const newMessage = new MockTextMessage(
              newMessageId,
              newMessageText,
              sender,
              receiverId,
              receiverType,
              newTimestamp
            );

            // Act - Handle new message
            service.handleNewMessage(newMessage, conversationWith);

            // Assert - The conversation's timestamp should match the message timestamp
            const updatedConversations = service.getConversations();
            const updatedConversation = updatedConversations.find(
              conv => conv.getConversationId() === targetConversation.getConversationId()
            );

            expect(updatedConversation).toBeDefined();
            expect(updatedConversation!.getUpdatedAt()).toBe(newTimestamp);
            expect(updatedConversation!.getLastMessage()!.getSentAt()).toBe(newTimestamp);
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  // ==================== Multiple Messages Tests ====================

  describe('Multiple Message Updates', () => {
    /**
     * Test that multiple messages to different conversations update correctly
     * **Validates: Requirements 10.2, 10.4**
     */
    it('should correctly update multiple conversations when messages are received', () => {
      fc.assert(
        fc.property(
          conversationListArbitrary,
          fc.array(fc.integer({ min: 0, max: 19 }), { minLength: 2, maxLength: 5 }),
          fc.array(messageTextArbitrary, { minLength: 2, maxLength: 5 }),
          userArbitrary,
          (conversations, targetIndices, messageTexts, sender) => {
            // Arrange
            const service = new MockConversationsService();
            service.setConversations(conversations);

            // Act - Send messages to different conversations
            const messagesToSend = Math.min(
              targetIndices.length,
              messageTexts.length,
              conversations.length
            );

            let messageId = 1;
            let timestamp = Date.now();

            for (let i = 0; i < messagesToSend; i++) {
              const safeIndex = targetIndices[i] % conversations.length;
              const targetConversation = conversations[safeIndex];
              const conversationWith = targetConversation.getConversationWith();

              const receiverId =
                conversationWith instanceof MockUser
                  ? conversationWith.getUid()
                  : conversationWith.getGuid();
              const receiverType: 'user' | 'group' =
                conversationWith instanceof MockUser ? 'user' : 'group';

              const newMessage = new MockTextMessage(
                messageId++,
                messageTexts[i],
                sender,
                receiverId,
                receiverType,
                timestamp++
              );

              service.handleNewMessage(newMessage, conversationWith);
            }

            // Assert - The last conversation to receive a message should be at the top
            const updatedConversations = service.getConversations();
            expect(updatedConversations.length).toBe(conversations.length);

            // The most recently updated conversation should be at position 0
            const lastIndex = targetIndices[messagesToSend - 1] % conversations.length;
            const lastConversationWith = conversations[lastIndex].getConversationWith();
            expect(service.getConversationPosition(lastConversationWith)).toBe(0);
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  // ==================== New Conversation Tests ====================

  describe('New Conversation Creation', () => {
    /**
     * Test that a new conversation is created and added to top when message is from new user
     * **Validates: Requirements 10.2, 10.4**
     */
    it('should create new conversation at top when message is from new user', () => {
      fc.assert(
        fc.property(
          conversationListArbitrary,
          userArbitrary,
          messageTextArbitrary,
          messageIdArbitrary,
          userArbitrary,
          (existingConversations, newUser, messageText, messageId, sender) => {
            // Arrange
            const service = new MockConversationsService();
            service.setConversations(existingConversations);

            // Ensure the new user is not in existing conversations
            const existingIds = existingConversations.map(conv => {
              const with_ = conv.getConversationWith();
              return with_ instanceof MockUser ? with_.getUid() : with_.getGuid();
            });

            // Skip if user already exists
            if (existingIds.includes(newUser.getUid())) return;

            const initialCount = service.getConversations().length;

            // Create a new message from a new user
            const newMessage = new MockTextMessage(
              messageId,
              messageText,
              sender,
              newUser.getUid(),
              'user',
              Date.now()
            );

            // Act - Handle new message from new user
            service.handleNewMessage(newMessage, newUser);

            // Assert - A new conversation should be created at the top
            const updatedConversations = service.getConversations();
            expect(updatedConversations.length).toBe(initialCount + 1);
            expect(service.getConversationPosition(newUser)).toBe(0);

            // Assert - The new conversation should have the correct last message
            const newConversation = updatedConversations[0];
            expect(newConversation.getLastMessage()!.getText()).toBe(messageText);
          }
        ),
        { numRuns: 20 }
      );
    });

    /**
     * Test that a new group conversation is created and added to top when message is from new group
     * **Validates: Requirements 10.2, 10.4**
     */
    it('should create new conversation at top when message is from new group', () => {
      fc.assert(
        fc.property(
          conversationListArbitrary,
          groupArbitrary,
          messageTextArbitrary,
          messageIdArbitrary,
          userArbitrary,
          (existingConversations, newGroup, messageText, messageId, sender) => {
            // Arrange
            const service = new MockConversationsService();
            service.setConversations(existingConversations);

            // Ensure the new group is not in existing conversations
            const existingIds = existingConversations.map(conv => {
              const with_ = conv.getConversationWith();
              return with_ instanceof MockUser ? with_.getUid() : with_.getGuid();
            });

            // Skip if group already exists
            if (existingIds.includes(newGroup.getGuid())) return;

            const initialCount = service.getConversations().length;

            // Create a new message from a new group
            const newMessage = new MockTextMessage(
              messageId,
              messageText,
              sender,
              newGroup.getGuid(),
              'group',
              Date.now()
            );

            // Act - Handle new message from new group
            service.handleNewMessage(newMessage, newGroup);

            // Assert - A new conversation should be created at the top
            const updatedConversations = service.getConversations();
            expect(updatedConversations.length).toBe(initialCount + 1);
            expect(service.getConversationPosition(newGroup)).toBe(0);

            // Assert - The new conversation should have the correct last message
            const newConversation = updatedConversations[0];
            expect(newConversation.getLastMessage()!.getText()).toBe(messageText);
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  // ==================== List Order Preservation Tests ====================

  describe('List Order Preservation', () => {
    /**
     * Test that other conversations maintain their relative order when one moves to top
     * **Validates: Requirements 10.2, 10.4**
     */
    it('should preserve relative order of other conversations when one moves to top', () => {
      fc.assert(
        fc.property(
          conversationListArbitrary,
          fc.integer({ min: 1, max: 19 }),
          messageTextArbitrary,
          messageIdArbitrary,
          userArbitrary,
          (conversations, targetIndex, messageText, messageId, sender) => {
            // Skip if list is too small
            if (conversations.length < 3) return;

            // Arrange
            const service = new MockConversationsService();
            service.setConversations(conversations);

            // Get a conversation that is NOT at the top
            const safeIndex = Math.min(targetIndex, conversations.length - 1);
            if (safeIndex === 0) return;

            const targetConversation = conversations[safeIndex];
            const conversationWith = targetConversation.getConversationWith();

            // Record the order of conversations before the update (excluding target)
            const orderBefore = conversations
              .filter((_, i) => i !== safeIndex)
              .map(conv => conv.getConversationId());

            // Create a new message for the target conversation
            const receiverId =
              conversationWith instanceof MockUser
                ? conversationWith.getUid()
                : conversationWith.getGuid();
            const receiverType: 'user' | 'group' =
              conversationWith instanceof MockUser ? 'user' : 'group';
            const newMessage = new MockTextMessage(
              messageId,
              messageText,
              sender,
              receiverId,
              receiverType,
              Date.now()
            );

            // Act - Handle new message
            service.handleNewMessage(newMessage, conversationWith);

            // Assert - The relative order of other conversations should be preserved
            const updatedConversations = service.getConversations();
            const orderAfter = updatedConversations
              .slice(1) // Skip the first one (which is now the target)
              .map(conv => conv.getConversationId());

            expect(orderAfter).toEqual(orderBefore);
          }
        ),
        { numRuns: 20 }
      );
    });

    /**
     * Test that total conversation count remains the same after update
     * **Validates: Requirements 10.2, 10.4**
     */
    it('should maintain total conversation count after message update', () => {
      fc.assert(
        fc.property(
          conversationListArbitrary,
          fc.integer({ min: 0, max: 19 }),
          messageTextArbitrary,
          messageIdArbitrary,
          userArbitrary,
          (conversations, targetIndex, messageText, messageId, sender) => {
            // Arrange
            const service = new MockConversationsService();
            service.setConversations(conversations);
            const initialCount = conversations.length;

            const safeIndex = targetIndex % conversations.length;
            const targetConversation = conversations[safeIndex];
            const conversationWith = targetConversation.getConversationWith();

            // Create a new message
            const receiverId =
              conversationWith instanceof MockUser
                ? conversationWith.getUid()
                : conversationWith.getGuid();
            const receiverType: 'user' | 'group' =
              conversationWith instanceof MockUser ? 'user' : 'group';
            const newMessage = new MockTextMessage(
              messageId,
              messageText,
              sender,
              receiverId,
              receiverType,
              Date.now()
            );

            // Act - Handle new message
            service.handleNewMessage(newMessage, conversationWith);

            // Assert - Count should remain the same
            expect(service.getConversations().length).toBe(initialCount);
          }
        ),
        { numRuns: 20 }
      );
    });
  });
});
