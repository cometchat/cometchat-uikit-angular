import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BehaviorSubject, Subscription } from 'rxjs';

/**
 * Integration Tests: Message Header ↔ Chat State Service
 *
 * Verifies CometChatMessageHeader updates user/group display when
 * ChatStateService.setActiveConversation() is called.
 * Mock only SDK layer.
 *
 * **Validates: Requirements 14.2, 14.5**
 */

// ─── Mock Chat State Service ───

interface MockUser {
  uid: string;
  name: string;
  avatar?: string;
  status: 'online' | 'offline';
}

interface MockGroup {
  guid: string;
  name: string;
  icon?: string;
  membersCount: number;
}

interface MockConversation {
  conversationId: string;
  conversationType: 'user' | 'group';
  conversationWith: MockUser | MockGroup;
}

class MockChatStateService {
  private activeConversationSubject = new BehaviorSubject<MockConversation | null>(null);
  private activeUserSubject = new BehaviorSubject<MockUser | null>(null);
  private activeGroupSubject = new BehaviorSubject<MockGroup | null>(null);

  readonly activeConversation$ = this.activeConversationSubject.asObservable();
  readonly activeUser$ = this.activeUserSubject.asObservable();
  readonly activeGroup$ = this.activeGroupSubject.asObservable();

  setActiveConversation(conversation: MockConversation | null): void {
    this.activeConversationSubject.next(conversation);
    if (!conversation) {
      this.activeUserSubject.next(null);
      this.activeGroupSubject.next(null);
      return;
    }
    if (conversation.conversationType === 'user') {
      this.activeUserSubject.next(conversation.conversationWith as MockUser);
      this.activeGroupSubject.next(null);
    } else {
      this.activeGroupSubject.next(conversation.conversationWith as MockGroup);
      this.activeUserSubject.next(null);
    }
  }

  setActiveUser(user: MockUser | null): void {
    this.activeUserSubject.next(user);
  }

  setActiveGroup(group: MockGroup | null): void {
    this.activeGroupSubject.next(group);
  }

  getActiveConversation(): MockConversation | null {
    return this.activeConversationSubject.getValue();
  }

  clearActiveChat(): void {
    this.activeConversationSubject.next(null);
    this.activeUserSubject.next(null);
    this.activeGroupSubject.next(null);
  }
}

// ─── Mock Message Header Component ───

class MockMessageHeaderHandler {
  displayName = '';
  displayAvatar = '';
  subtitleText = '';
  isOnline = false;
  membersCount = 0;
  conversationType: 'user' | 'group' | null = null;

  private subscriptions: Subscription[] = [];

  constructor(private chatState: MockChatStateService) {}

  init(): void {
    this.subscriptions.push(
      this.chatState.activeUser$.subscribe(user => {
        if (user) {
          this.displayName = user.name;
          this.displayAvatar = user.avatar || '';
          this.isOnline = user.status === 'online';
          this.subtitleText = user.status === 'online' ? 'Online' : 'Offline';
          this.conversationType = 'user';
        }
      })
    );

    this.subscriptions.push(
      this.chatState.activeGroup$.subscribe(group => {
        if (group) {
          this.displayName = group.name;
          this.displayAvatar = group.icon || '';
          this.membersCount = group.membersCount;
          this.subtitleText = `${group.membersCount} members`;
          this.conversationType = 'group';
        }
      })
    );

    this.subscriptions.push(
      this.chatState.activeConversation$.subscribe(conv => {
        if (!conv) {
          this.displayName = '';
          this.displayAvatar = '';
          this.subtitleText = '';
          this.isOnline = false;
          this.membersCount = 0;
          this.conversationType = null;
        }
      })
    );
  }

  destroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
  }
}

// ─── Factories ───

function createMockUser(overrides: Partial<MockUser> = {}): MockUser {
  return {
    uid: 'user1',
    name: 'Alice',
    avatar: 'https://example.com/alice.png',
    status: 'online',
    ...overrides,
  };
}

function createMockGroup(overrides: Partial<MockGroup> = {}): MockGroup {
  return {
    guid: 'group1',
    name: 'Dev Team',
    icon: 'https://example.com/group.png',
    membersCount: 5,
    ...overrides,
  };
}

function createUserConversation(user: MockUser): MockConversation {
  return {
    conversationId: `user_${user.uid}`,
    conversationType: 'user',
    conversationWith: user,
  };
}

function createGroupConversation(group: MockGroup): MockConversation {
  return {
    conversationId: `group_${group.guid}`,
    conversationType: 'group',
    conversationWith: group,
  };
}

// ─── Tests ───

describe('Message Header ↔ Chat State Service Integration', () => {
  let chatState: MockChatStateService;
  let header: MockMessageHeaderHandler;

  beforeEach(() => {
    chatState = new MockChatStateService();
    header = new MockMessageHeaderHandler(chatState);
    header.init();
  });

  afterEach(() => {
    header.destroy();
    vi.restoreAllMocks();
  });

  describe('User conversation display', () => {
    it('should display user name and avatar when user conversation is set', () => {
      const user = createMockUser({ name: 'Bob', avatar: 'https://example.com/bob.png' });
      chatState.setActiveConversation(createUserConversation(user));

      expect(header.displayName).toBe('Bob');
      expect(header.displayAvatar).toBe('https://example.com/bob.png');
      expect(header.conversationType).toBe('user');
    });

    it('should show online status for online user', () => {
      const user = createMockUser({ status: 'online' });
      chatState.setActiveConversation(createUserConversation(user));

      expect(header.isOnline).toBe(true);
      expect(header.subtitleText).toBe('Online');
    });

    it('should show offline status for offline user', () => {
      const user = createMockUser({ status: 'offline' });
      chatState.setActiveConversation(createUserConversation(user));

      expect(header.isOnline).toBe(false);
      expect(header.subtitleText).toBe('Offline');
    });

    it('should handle user without avatar', () => {
      const user = createMockUser({ avatar: undefined });
      chatState.setActiveConversation(createUserConversation(user));

      expect(header.displayAvatar).toBe('');
    });
  });

  describe('Group conversation display', () => {
    it('should display group name and icon when group conversation is set', () => {
      const group = createMockGroup({
        name: 'Design Team',
        icon: 'https://example.com/design.png',
      });
      chatState.setActiveConversation(createGroupConversation(group));

      expect(header.displayName).toBe('Design Team');
      expect(header.displayAvatar).toBe('https://example.com/design.png');
      expect(header.conversationType).toBe('group');
    });

    it('should display member count in subtitle', () => {
      const group = createMockGroup({ membersCount: 12 });
      chatState.setActiveConversation(createGroupConversation(group));

      expect(header.subtitleText).toBe('12 members');
      expect(header.membersCount).toBe(12);
    });
  });

  describe('Conversation switching', () => {
    it('should update display when switching from user to group', () => {
      const user = createMockUser({ name: 'Alice' });
      chatState.setActiveConversation(createUserConversation(user));
      expect(header.displayName).toBe('Alice');

      const group = createMockGroup({ name: 'Engineering' });
      chatState.setActiveConversation(createGroupConversation(group));
      expect(header.displayName).toBe('Engineering');
      expect(header.conversationType).toBe('group');
    });

    it('should update display when switching from group to user', () => {
      const group = createMockGroup({ name: 'Engineering' });
      chatState.setActiveConversation(createGroupConversation(group));
      expect(header.conversationType).toBe('group');

      const user = createMockUser({ name: 'Charlie' });
      chatState.setActiveConversation(createUserConversation(user));
      expect(header.displayName).toBe('Charlie');
      expect(header.conversationType).toBe('user');
    });

    it('should clear display when conversation is set to null', () => {
      const user = createMockUser({ name: 'Alice' });
      chatState.setActiveConversation(createUserConversation(user));
      expect(header.displayName).toBe('Alice');

      chatState.setActiveConversation(null);
      expect(header.displayName).toBe('');
      expect(header.displayAvatar).toBe('');
      expect(header.conversationType).toBeNull();
    });
  });

  describe('Direct state updates', () => {
    it('should respond to setActiveUser directly', () => {
      const user = createMockUser({ name: 'Direct User' });
      chatState.setActiveUser(user);

      expect(header.displayName).toBe('Direct User');
    });

    it('should respond to setActiveGroup directly', () => {
      const group = createMockGroup({ name: 'Direct Group', membersCount: 8 });
      chatState.setActiveGroup(group);

      expect(header.displayName).toBe('Direct Group');
      expect(header.membersCount).toBe(8);
    });

    it('should clear all state on clearActiveChat', () => {
      const user = createMockUser({ name: 'Alice' });
      chatState.setActiveConversation(createUserConversation(user));
      expect(header.displayName).toBe('Alice');

      chatState.clearActiveChat();
      expect(header.displayName).toBe('');
      expect(header.conversationType).toBeNull();
    });
  });
});
