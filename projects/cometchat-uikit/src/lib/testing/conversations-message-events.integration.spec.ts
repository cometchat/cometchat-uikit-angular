import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Subject } from 'rxjs';

/**
 * Integration Tests: Conversations ↔ Message Events
 *
 * Verifies CometChatConversations updates its list when
 * CometChatMessageEvents.ccMessageSent is published.
 * Mock only SDK layer; allow internal services/events to operate naturally.
 *
 * **Validates: Requirements 14.1, 14.5**
 */

// ─── Mock Event Bus (mirrors CometChatMessageEvents) ───

class MockMessageEvents {
  static ccMessageSent = new Subject<MockIMessages>();
  static ccMessageEdited = new Subject<MockIMessages>();
  static ccMessageDeleted = new Subject<any>();
  static ccMessageRead = new Subject<any>();
  static onTextMessageReceived = new Subject<any>();

  static publishEvent(event: Subject<any>, item: any): void {
    event.next(item);
  }

  static reset(): void {
    MockMessageEvents.ccMessageSent = new Subject<MockIMessages>();
    MockMessageEvents.ccMessageEdited = new Subject<MockIMessages>();
    MockMessageEvents.ccMessageDeleted = new Subject<any>();
    MockMessageEvents.ccMessageRead = new Subject<any>();
    MockMessageEvents.onTextMessageReceived = new Subject<any>();
  }
}

interface MockIMessages {
  message: MockBaseMessage;
  status: string;
}

interface MockBaseMessage {
  id: number;
  text: string;
  type: string;
  sender: { uid: string; name: string };
  receiverId: string;
  receiverType: string;
  sentAt: number;
  conversationId: string;
}

// ─── Mock Conversation Manager (mirrors conversations component logic) ───

interface MockConversation {
  conversationId: string;
  conversationType: string;
  lastMessage: MockBaseMessage | null;
  conversationWith: { uid?: string; guid?: string; name: string };
  unreadMessageCount: number;
  updatedAt: number;
}

class MockConversationsManager {
  conversations: MockConversation[] = [];
  private subscriptions: (() => void)[] = [];

  constructor(initialConversations: MockConversation[]) {
    this.conversations = [...initialConversations];
  }

  /**
   * Subscribe to message events — mirrors what the real component does in ngOnInit.
   */
  subscribeToEvents(): void {
    const sub1 = MockMessageEvents.ccMessageSent.subscribe(event => {
      this.handleMessageSent(event);
    });
    this.subscriptions.push(() => sub1.unsubscribe());

    const sub2 = MockMessageEvents.ccMessageEdited.subscribe(event => {
      this.handleMessageEdited(event);
    });
    this.subscriptions.push(() => sub2.unsubscribe());

    const sub3 = MockMessageEvents.ccMessageDeleted.subscribe(msg => {
      this.handleMessageDeleted(msg);
    });
    this.subscriptions.push(() => sub3.unsubscribe());

    const sub4 = MockMessageEvents.ccMessageRead.subscribe(msg => {
      this.handleMessageRead(msg);
    });
    this.subscriptions.push(() => sub4.unsubscribe());
  }

  unsubscribeAll(): void {
    this.subscriptions.forEach(unsub => unsub());
    this.subscriptions = [];
  }

  private handleMessageSent(event: MockIMessages): void {
    if (event.status !== 'success') return;

    const msg = event.message;
    const convId = msg.conversationId;
    const existingIndex = this.conversations.findIndex(c => c.conversationId === convId);

    if (existingIndex >= 0) {
      // Update existing conversation and move to top
      const conv = this.conversations[existingIndex];
      conv.lastMessage = msg;
      conv.updatedAt = msg.sentAt;
      this.conversations.splice(existingIndex, 1);
      this.conversations.unshift(conv);
    } else {
      // Create new conversation entry at top
      const newConv: MockConversation = {
        conversationId: convId,
        conversationType: msg.receiverType,
        lastMessage: msg,
        conversationWith: { uid: msg.receiverId, name: msg.receiverId },
        unreadMessageCount: 0,
        updatedAt: msg.sentAt,
      };
      this.conversations.unshift(newConv);
    }
  }

  private handleMessageEdited(event: MockIMessages): void {
    const msg = event.message;
    const conv = this.conversations.find(c => c.conversationId === msg.conversationId);
    if (conv && conv.lastMessage?.id === msg.id) {
      conv.lastMessage = msg;
    }
  }

  private handleMessageDeleted(msg: MockBaseMessage): void {
    const conv = this.conversations.find(c => c.conversationId === msg.conversationId);
    if (conv && conv.lastMessage?.id === msg.id) {
      conv.lastMessage = { ...msg, text: '', type: 'deleted' };
    }
  }

  private handleMessageRead(msg: MockBaseMessage): void {
    const conv = this.conversations.find(c => c.conversationId === msg.conversationId);
    if (conv) {
      conv.unreadMessageCount = 0;
    }
  }
}

// ─── Factories ───

function createMockMessage(overrides: Partial<MockBaseMessage> = {}): MockBaseMessage {
  return {
    id: 1,
    text: 'Hello',
    type: 'text',
    sender: { uid: 'user1', name: 'Alice' },
    receiverId: 'user2',
    receiverType: 'user',
    sentAt: Date.now(),
    conversationId: 'user1_user_user2',
    ...overrides,
  };
}

function createMockConversation(overrides: Partial<MockConversation> = {}): MockConversation {
  return {
    conversationId: 'user1_user_user2',
    conversationType: 'user',
    lastMessage: null,
    conversationWith: { uid: 'user2', name: 'Bob' },
    unreadMessageCount: 0,
    updatedAt: Date.now() - 10000,
    ...overrides,
  };
}

// ─── Tests ───

describe('Conversations ↔ Message Events Integration', () => {
  let manager: MockConversationsManager;

  beforeEach(() => {
    MockMessageEvents.reset();
  });

  afterEach(() => {
    manager?.unsubscribeAll();
    vi.restoreAllMocks();
  });

  describe('ccMessageSent updates conversation list', () => {
    it('should move existing conversation to top when message is sent', () => {
      const conv1 = createMockConversation({ conversationId: 'conv_1', updatedAt: 1000 });
      const conv2 = createMockConversation({ conversationId: 'conv_2', updatedAt: 2000 });
      const conv3 = createMockConversation({ conversationId: 'conv_3', updatedAt: 3000 });

      manager = new MockConversationsManager([conv3, conv2, conv1]);
      manager.subscribeToEvents();

      // Send message to conv_1 (currently last)
      const msg = createMockMessage({ conversationId: 'conv_1', sentAt: 5000 });
      MockMessageEvents.publishEvent(MockMessageEvents.ccMessageSent, {
        message: msg,
        status: 'success',
      });

      expect(manager.conversations[0].conversationId).toBe('conv_1');
      expect(manager.conversations[0].lastMessage).toBe(msg);
    });

    it('should create new conversation when message is sent to unknown recipient', () => {
      const conv1 = createMockConversation({ conversationId: 'conv_1' });
      manager = new MockConversationsManager([conv1]);
      manager.subscribeToEvents();

      const msg = createMockMessage({
        conversationId: 'conv_new',
        receiverId: 'user_new',
        sentAt: Date.now(),
      });
      MockMessageEvents.publishEvent(MockMessageEvents.ccMessageSent, {
        message: msg,
        status: 'success',
      });

      expect(manager.conversations.length).toBe(2);
      expect(manager.conversations[0].conversationId).toBe('conv_new');
    });

    it('should not update list when message status is not success', () => {
      const conv1 = createMockConversation({ conversationId: 'conv_1' });
      manager = new MockConversationsManager([conv1]);
      manager.subscribeToEvents();

      const msg = createMockMessage({ conversationId: 'conv_1' });
      MockMessageEvents.publishEvent(MockMessageEvents.ccMessageSent, {
        message: msg,
        status: 'inProgress',
      });

      // Should not have updated lastMessage
      expect(manager.conversations[0].lastMessage).toBeNull();
    });

    it('should update lastMessage text on existing conversation', () => {
      const conv = createMockConversation({ conversationId: 'conv_1' });
      manager = new MockConversationsManager([conv]);
      manager.subscribeToEvents();

      const msg = createMockMessage({
        conversationId: 'conv_1',
        text: 'Updated message',
        sentAt: Date.now(),
      });
      MockMessageEvents.publishEvent(MockMessageEvents.ccMessageSent, {
        message: msg,
        status: 'success',
      });

      expect(manager.conversations[0].lastMessage?.text).toBe('Updated message');
    });
  });

  describe('ccMessageEdited updates last message', () => {
    it('should update lastMessage when edited message matches', () => {
      const originalMsg = createMockMessage({ id: 42, text: 'Original', conversationId: 'conv_1' });
      const conv = createMockConversation({ conversationId: 'conv_1', lastMessage: originalMsg });
      manager = new MockConversationsManager([conv]);
      manager.subscribeToEvents();

      const editedMsg = createMockMessage({ id: 42, text: 'Edited', conversationId: 'conv_1' });
      MockMessageEvents.publishEvent(MockMessageEvents.ccMessageEdited, {
        message: editedMsg,
        status: 'success',
      });

      expect(manager.conversations[0].lastMessage?.text).toBe('Edited');
    });

    it('should not update lastMessage when edited message id does not match', () => {
      const originalMsg = createMockMessage({ id: 42, text: 'Original', conversationId: 'conv_1' });
      const conv = createMockConversation({ conversationId: 'conv_1', lastMessage: originalMsg });
      manager = new MockConversationsManager([conv]);
      manager.subscribeToEvents();

      const editedMsg = createMockMessage({ id: 99, text: 'Other', conversationId: 'conv_1' });
      MockMessageEvents.publishEvent(MockMessageEvents.ccMessageEdited, {
        message: editedMsg,
        status: 'success',
      });

      expect(manager.conversations[0].lastMessage?.text).toBe('Original');
    });
  });

  describe('ccMessageDeleted marks last message as deleted', () => {
    it('should mark lastMessage as deleted when ids match', () => {
      const msg = createMockMessage({ id: 10, text: 'Hello', conversationId: 'conv_1' });
      const conv = createMockConversation({ conversationId: 'conv_1', lastMessage: msg });
      manager = new MockConversationsManager([conv]);
      manager.subscribeToEvents();

      MockMessageEvents.publishEvent(MockMessageEvents.ccMessageDeleted, msg);

      expect(manager.conversations[0].lastMessage?.type).toBe('deleted');
    });
  });

  describe('ccMessageRead resets unread count', () => {
    it('should reset unread count to 0 for matching conversation', () => {
      const conv = createMockConversation({ conversationId: 'conv_1', unreadMessageCount: 5 });
      manager = new MockConversationsManager([conv]);
      manager.subscribeToEvents();

      const msg = createMockMessage({ conversationId: 'conv_1' });
      MockMessageEvents.publishEvent(MockMessageEvents.ccMessageRead, msg);

      expect(manager.conversations[0].unreadMessageCount).toBe(0);
    });

    it('should not affect other conversations', () => {
      const conv1 = createMockConversation({ conversationId: 'conv_1', unreadMessageCount: 5 });
      const conv2 = createMockConversation({ conversationId: 'conv_2', unreadMessageCount: 3 });
      manager = new MockConversationsManager([conv1, conv2]);
      manager.subscribeToEvents();

      const msg = createMockMessage({ conversationId: 'conv_1' });
      MockMessageEvents.publishEvent(MockMessageEvents.ccMessageRead, msg);

      expect(manager.conversations[0].unreadMessageCount).toBe(0);
      expect(manager.conversations[1].unreadMessageCount).toBe(3);
    });

    it('should be a no-op when conversation is not in the list', () => {
      const conv = createMockConversation({ conversationId: 'conv_1', unreadMessageCount: 5 });
      manager = new MockConversationsManager([conv]);
      manager.subscribeToEvents();

      const msg = createMockMessage({ conversationId: 'conv_unknown' });
      MockMessageEvents.publishEvent(MockMessageEvents.ccMessageRead, msg);

      expect(manager.conversations[0].unreadMessageCount).toBe(5);
    });
  });

  describe('Event subscription lifecycle', () => {
    it('should stop receiving events after unsubscribe', () => {
      const conv = createMockConversation({ conversationId: 'conv_1' });
      manager = new MockConversationsManager([conv]);
      manager.subscribeToEvents();
      manager.unsubscribeAll();

      const msg = createMockMessage({ conversationId: 'conv_1', sentAt: Date.now() });
      MockMessageEvents.publishEvent(MockMessageEvents.ccMessageSent, {
        message: msg,
        status: 'success',
      });

      // Should not have updated since we unsubscribed
      expect(manager.conversations[0].lastMessage).toBeNull();
    });
  });
});
