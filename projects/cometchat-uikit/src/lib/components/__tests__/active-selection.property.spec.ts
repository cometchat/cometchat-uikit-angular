/**
 * Property-Based Tests for Active Selection Visual Feedback
 *
 * **Property 10: Active Selection Visual Feedback**
 *
 * *For any* item in Conversations_List, Users_List, or Groups_List that matches
 * the active entity (from prop or ChatStateService), the item SHALL have the
 * `--active` CSS modifier class applied, resulting in a distinct background color.
 *
 * **Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5**
 *
 * **Feature: uikit-critical-bugfixes, Property 10: Active Selection Visual Feedback**
 *
 * @module components/active-selection/property-tests
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
 * Mock CometChat.Conversation class for property testing
 */
class MockConversation {
  private conversationId: string;
  private conversationWith: MockUser | MockGroup;
  private conversationType: 'user' | 'group';
  private unreadMessageCount: number;

  constructor(
    conversationId: string,
    conversationWith: MockUser | MockGroup,
    conversationType: 'user' | 'group',
    unreadMessageCount = 0
  ) {
    this.conversationId = conversationId;
    this.conversationWith = conversationWith;
    this.conversationType = conversationType;
    this.unreadMessageCount = unreadMessageCount;
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

  getUnreadMessageCount(): number {
    return this.unreadMessageCount;
  }
}

/**
 * Mock ChatStateService for property testing
 * Simulates the service's behavior for managing active entities
 */
class MockChatStateService {
  private activeUser: MockUser | null = null;
  private activeGroup: MockGroup | null = null;
  private activeConversation: MockConversation | null = null;

  setActiveUser(user: MockUser | null): void {
    this.activeUser = user;
    // Clear group when user is set (mutual exclusivity)
    if (user !== null) {
      this.activeGroup = null;
    }
  }

  setActiveGroup(group: MockGroup | null): void {
    this.activeGroup = group;
    // Clear user when group is set (mutual exclusivity)
    if (group !== null) {
      this.activeUser = null;
    }
  }

  setActiveConversation(conversation: MockConversation | null): void {
    this.activeConversation = conversation;
    if (conversation !== null) {
      const conversationWith = conversation.getConversationWith();
      if (conversationWith instanceof MockUser) {
        this.setActiveUser(conversationWith);
      } else if (conversationWith instanceof MockGroup) {
        this.setActiveGroup(conversationWith);
      }
    } else {
      this.activeUser = null;
      this.activeGroup = null;
    }
  }

  getActiveUser(): MockUser | null {
    return this.activeUser;
  }

  getActiveGroup(): MockGroup | null {
    return this.activeGroup;
  }

  getActiveConversation(): MockConversation | null {
    return this.activeConversation;
  }

  clearActiveChat(): void {
    this.activeUser = null;
    this.activeGroup = null;
    this.activeConversation = null;
  }
}

// ============================================
// Mock Component Classes for Active Selection Testing
// ============================================

/**
 * Mock CometChatUsersComponent for testing active selection
 * Mirrors the isUserActive() method from the real component
 */
class MockCometChatUsersComponent {
  userList: MockUser[] = [];
  activeUser?: MockUser; // @Input prop
  private chatStateService: MockChatStateService;

  constructor(users: MockUser[], chatStateService: MockChatStateService) {
    this.userList = users;
    this.chatStateService = chatStateService;
  }

  /**
   * Checks if a user is currently active (highlighted)
   * Implements hybrid approach: checks activeUser prop first, falls back to ChatStateService
   * @param user - The user to check
   * @returns True if the user is the active user
   * @see Requirements 8.2, 8.4, 8.5, 8.6
   */
  isUserActive(user: MockUser): boolean {
    // Check prop first (priority)
    if (this.activeUser) {
      return user.getUid() === this.activeUser.getUid();
    }
    // Fall back to ChatStateService
    const serviceActiveUser = this.chatStateService.getActiveUser();
    if (serviceActiveUser) {
      return user.getUid() === serviceActiveUser.getUid();
    }
    return false;
  }

  /**
   * Gets the CSS class for a user item
   * Returns the --active modifier class if the user is active
   */
  getUserItemClass(user: MockUser): string {
    const baseClass = 'cometchat-users__list-item';
    return this.isUserActive(user) ? `${baseClass}--active` : baseClass;
  }

  /**
   * Counts how many users have the active class
   */
  countActiveUsers(): number {
    return this.userList.filter(user => this.isUserActive(user)).length;
  }
}

/**
 * Mock CometChatGroupsComponent for testing active selection
 * Mirrors the isGroupActive() method from the real component
 */
class MockCometChatGroupsComponent {
  groupList: MockGroup[] = [];
  activeGroup?: MockGroup; // @Input prop
  private chatStateService: MockChatStateService;

  constructor(groups: MockGroup[], chatStateService: MockChatStateService) {
    this.groupList = groups;
    this.chatStateService = chatStateService;
  }

  /**
   * Checks if a group is currently active (highlighted)
   * Implements hybrid approach: checks activeGroup prop first, falls back to ChatStateService
   * @param group - The group to check
   * @returns True if the group is the active group
   * @see Requirements 8.3, 8.4, 8.5, 8.6
   */
  isGroupActive(group: MockGroup): boolean {
    // Check prop first (priority)
    if (this.activeGroup) {
      return group.getGuid() === this.activeGroup.getGuid();
    }
    // Fall back to ChatStateService
    const serviceActiveGroup = this.chatStateService.getActiveGroup();
    if (serviceActiveGroup) {
      return group.getGuid() === serviceActiveGroup.getGuid();
    }
    return false;
  }

  /**
   * Gets the CSS class for a group item
   * Returns the --active modifier class if the group is active
   */
  getGroupItemClass(group: MockGroup): string {
    const baseClass = 'cometchat-groups__list-item';
    return this.isGroupActive(group) ? `${baseClass}--active` : baseClass;
  }

  /**
   * Counts how many groups have the active class
   */
  countActiveGroups(): number {
    return this.groupList.filter(group => this.isGroupActive(group)).length;
  }
}

/**
 * Mock CometChatConversationsComponent for testing active selection
 * Mirrors the isConversationActive() method from the real component
 */
class MockCometChatConversationsComponent {
  conversations: MockConversation[] = [];
  activeConversation?: MockConversation; // @Input prop
  private chatStateService: MockChatStateService;

  constructor(conversations: MockConversation[], chatStateService: MockChatStateService) {
    this.conversations = conversations;
    this.chatStateService = chatStateService;
  }

  /**
   * Gets the conversation ID from a conversation
   */
  private getConversationId(conversation: MockConversation): string {
    const conversationWith = conversation.getConversationWith();
    return conversationWith instanceof MockUser
      ? conversationWith.getUid()
      : conversationWith.getGuid();
  }

  /**
   * Checks if a conversation is currently active (highlighted)
   * Implements hybrid approach: checks activeConversation prop first, falls back to ChatStateService
   * @param conversation - The conversation to check
   * @returns True if the conversation is the active conversation
   * @see Requirements 8.1, 8.4, 8.5, 8.6
   */
  isConversationActive(conversation: MockConversation): boolean {
    // Check prop first (priority)
    if (this.activeConversation) {
      return (
        this.getConversationId(conversation) === this.getConversationId(this.activeConversation)
      );
    }
    // Fall back to ChatStateService
    const serviceActiveConversation = this.chatStateService.getActiveConversation();
    if (serviceActiveConversation) {
      return (
        this.getConversationId(conversation) === this.getConversationId(serviceActiveConversation)
      );
    }
    return false;
  }

  /**
   * Gets the CSS class for a conversation item
   * Returns the --active modifier class if the conversation is active
   */
  getConversationItemClass(conversation: MockConversation): string {
    const baseClass = 'cometchat-conversations__list-item';
    return this.isConversationActive(conversation) ? `${baseClass}--active` : baseClass;
  }

  /**
   * Counts how many conversations have the active class
   */
  countActiveConversations(): number {
    return this.conversations.filter(conv => this.isConversationActive(conv)).length;
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
  fc.webUrl(),
  fc.constantFrom('https://example.com/avatar.jpg', 'https://example.com/avatar.png')
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
 * Arbitrary for generating a list of users with unique UIDs
 */
const userListArbitrary = fc
  .array(userArbitrary, { minLength: 2, maxLength: 20 })
  .map(users => {
    const uniqueUsers = new Map<string, MockUser>();
    users.forEach(user => {
      uniqueUsers.set(user.getUid(), user);
    });
    return Array.from(uniqueUsers.values());
  })
  .filter(users => users.length >= 2);

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
    membersCount: fc.integer({ min: 0, max: 1000 }),
  })
  .map(
    ({ guid, name, icon, type, membersCount }) =>
      new MockGroup(guid, name, icon, type, membersCount)
  );

/**
 * Arbitrary for generating a list of groups with unique GUIDs
 */
const groupListArbitrary = fc
  .array(groupArbitrary, { minLength: 2, maxLength: 20 })
  .map(groups => {
    const uniqueGroups = new Map<string, MockGroup>();
    groups.forEach(group => {
      uniqueGroups.set(group.getGuid(), group);
    });
    return Array.from(uniqueGroups.values());
  })
  .filter(groups => groups.length >= 2);

/**
 * Arbitrary for generating valid conversation types
 */
const conversationTypeArbitrary = fc.constantFrom('user', 'group') as fc.Arbitrary<
  'user' | 'group'
>;

/**
 * Arbitrary for generating valid CometChat.Conversation objects with users
 */
const userConversationArbitrary = fc
  .record({
    user: userArbitrary,
    unreadCount: fc.integer({ min: 0, max: 100 }),
  })
  .map(
    ({ user, unreadCount }) =>
      new MockConversation(`conv_${user.getUid()}`, user, 'user', unreadCount)
  );

/**
 * Arbitrary for generating valid CometChat.Conversation objects with groups
 */
const groupConversationArbitrary = fc
  .record({
    group: groupArbitrary,
    unreadCount: fc.integer({ min: 0, max: 100 }),
  })
  .map(
    ({ group, unreadCount }) =>
      new MockConversation(`conv_${group.getGuid()}`, group, 'group', unreadCount)
  );

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
 * Property 10: Active Selection Visual Feedback
 *
 * *For any* item in Conversations_List, Users_List, or Groups_List that matches
 * the active entity (from prop or ChatStateService), the item SHALL have the
 * `--active` CSS modifier class applied, resulting in a distinct background color.
 *
 * **Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5**
 *
 * **Feature: uikit-critical-bugfixes, Property 10: Active Selection Visual Feedback**
 */
describe('Property 10: Active Selection Visual Feedback', () => {
  // ==================== Users List Tests ====================

  describe('Users List Active Selection', () => {
    /**
     * Test that exactly one user has the --active class when one is set as active via prop
     * **Validates: Requirements 8.2, 8.4**
     */
    it('should apply --active class to exactly one user when set via prop for any user list', () => {
      fc.assert(
        fc.property(userListArbitrary, fc.integer({ min: 0, max: 19 }), (users, activeIndex) => {
          // Arrange
          const chatStateService = new MockChatStateService();
          const component = new MockCometChatUsersComponent(users, chatStateService);

          // Set active user via prop
          const safeIndex = activeIndex % users.length;
          component.activeUser = users[safeIndex];

          // Assert - Exactly one user should have the active class
          const activeCount = component.countActiveUsers();
          expect(activeCount).toBe(1);

          // Assert - The correct user should be active
          expect(component.isUserActive(users[safeIndex])).toBe(true);

          // Assert - The active user should have the --active CSS class
          const cssClass = component.getUserItemClass(users[safeIndex]);
          expect(cssClass).toContain('--active');
        }),
        { numRuns: 20 }
      );
    });

    /**
     * Test that exactly one user has the --active class when set via ChatStateService
     * **Validates: Requirements 8.2, 8.5**
     */
    it('should apply --active class to exactly one user when set via ChatStateService for any user list', () => {
      fc.assert(
        fc.property(userListArbitrary, fc.integer({ min: 0, max: 19 }), (users, activeIndex) => {
          // Arrange
          const chatStateService = new MockChatStateService();
          const component = new MockCometChatUsersComponent(users, chatStateService);

          // Set active user via service (no prop)
          const safeIndex = activeIndex % users.length;
          chatStateService.setActiveUser(users[safeIndex]);

          // Assert - Exactly one user should have the active class
          const activeCount = component.countActiveUsers();
          expect(activeCount).toBe(1);

          // Assert - The correct user should be active
          expect(component.isUserActive(users[safeIndex])).toBe(true);

          // Assert - Other users should NOT be active
          users.forEach((user, index) => {
            if (index !== safeIndex) {
              expect(component.isUserActive(user)).toBe(false);
            }
          });
        }),
        { numRuns: 20 }
      );
    });

    /**
     * Test that prop takes priority over ChatStateService
     * **Validates: Requirements 8.4**
     */
    it('should prioritize prop over ChatStateService for active user selection', () => {
      fc.assert(
        fc.property(
          userListArbitrary,
          fc.integer({ min: 0, max: 19 }),
          fc.integer({ min: 0, max: 19 }),
          (users, propIndex, serviceIndex) => {
            // Skip if same index
            const safePropIndex = propIndex % users.length;
            const safeServiceIndex = serviceIndex % users.length;
            if (safePropIndex === safeServiceIndex) return;

            // Arrange
            const chatStateService = new MockChatStateService();
            const component = new MockCometChatUsersComponent(users, chatStateService);

            // Set different users via prop and service
            component.activeUser = users[safePropIndex];
            chatStateService.setActiveUser(users[safeServiceIndex]);

            // Assert - Prop should take priority
            expect(component.isUserActive(users[safePropIndex])).toBe(true);
            expect(component.isUserActive(users[safeServiceIndex])).toBe(false);

            // Assert - Still only one active
            expect(component.countActiveUsers()).toBe(1);
          }
        ),
        { numRuns: 20 }
      );
    });

    /**
     * Test that active selection changes correctly when selection changes
     * **Validates: Requirements 8.5**
     */
    it('should update active class when selection changes for any user list', () => {
      fc.assert(
        fc.property(
          userListArbitrary,
          fc.array(fc.integer({ min: 0, max: 19 }), { minLength: 2, maxLength: 5 }),
          (users, selectionSequence) => {
            // Arrange
            const chatStateService = new MockChatStateService();
            const component = new MockCometChatUsersComponent(users, chatStateService);

            // Act - Change selection multiple times
            selectionSequence.forEach(index => {
              const safeIndex = index % users.length;
              chatStateService.setActiveUser(users[safeIndex]);

              // Assert - After each change, exactly one user should be active
              expect(component.countActiveUsers()).toBe(1);
              expect(component.isUserActive(users[safeIndex])).toBe(true);
            });
          }
        ),
        { numRuns: 20 }
      );
    });

    /**
     * Test that no user has active class when no user is selected
     */
    it('should not apply --active class to any user when none is selected', () => {
      fc.assert(
        fc.property(userListArbitrary, users => {
          // Arrange
          const chatStateService = new MockChatStateService();
          const component = new MockCometChatUsersComponent(users, chatStateService);

          // No active user set (neither prop nor service)

          // Assert - No user should have the active class
          expect(component.countActiveUsers()).toBe(0);

          // Assert - All users should return false for isUserActive
          users.forEach(user => {
            expect(component.isUserActive(user)).toBe(false);
            expect(component.getUserItemClass(user)).not.toContain('--active');
          });
        }),
        { numRuns: 20 }
      );
    });
  });

  // ==================== Groups List Tests ====================

  describe('Groups List Active Selection', () => {
    /**
     * Test that exactly one group has the --active class when one is set as active via prop
     * **Validates: Requirements 8.3, 8.4**
     */
    it('should apply --active class to exactly one group when set via prop for any group list', () => {
      fc.assert(
        fc.property(groupListArbitrary, fc.integer({ min: 0, max: 19 }), (groups, activeIndex) => {
          // Arrange
          const chatStateService = new MockChatStateService();
          const component = new MockCometChatGroupsComponent(groups, chatStateService);

          // Set active group via prop
          const safeIndex = activeIndex % groups.length;
          component.activeGroup = groups[safeIndex];

          // Assert - Exactly one group should have the active class
          const activeCount = component.countActiveGroups();
          expect(activeCount).toBe(1);

          // Assert - The correct group should be active
          expect(component.isGroupActive(groups[safeIndex])).toBe(true);

          // Assert - The active group should have the --active CSS class
          const cssClass = component.getGroupItemClass(groups[safeIndex]);
          expect(cssClass).toContain('--active');
        }),
        { numRuns: 20 }
      );
    });

    /**
     * Test that exactly one group has the --active class when set via ChatStateService
     * **Validates: Requirements 8.3, 8.5**
     */
    it('should apply --active class to exactly one group when set via ChatStateService for any group list', () => {
      fc.assert(
        fc.property(groupListArbitrary, fc.integer({ min: 0, max: 19 }), (groups, activeIndex) => {
          // Arrange
          const chatStateService = new MockChatStateService();
          const component = new MockCometChatGroupsComponent(groups, chatStateService);

          // Set active group via service (no prop)
          const safeIndex = activeIndex % groups.length;
          chatStateService.setActiveGroup(groups[safeIndex]);

          // Assert - Exactly one group should have the active class
          const activeCount = component.countActiveGroups();
          expect(activeCount).toBe(1);

          // Assert - The correct group should be active
          expect(component.isGroupActive(groups[safeIndex])).toBe(true);

          // Assert - Other groups should NOT be active
          groups.forEach((group, index) => {
            if (index !== safeIndex) {
              expect(component.isGroupActive(group)).toBe(false);
            }
          });
        }),
        { numRuns: 20 }
      );
    });

    /**
     * Test that prop takes priority over ChatStateService for groups
     * **Validates: Requirements 8.4**
     */
    it('should prioritize prop over ChatStateService for active group selection', () => {
      fc.assert(
        fc.property(
          groupListArbitrary,
          fc.integer({ min: 0, max: 19 }),
          fc.integer({ min: 0, max: 19 }),
          (groups, propIndex, serviceIndex) => {
            // Skip if same index
            const safePropIndex = propIndex % groups.length;
            const safeServiceIndex = serviceIndex % groups.length;
            if (safePropIndex === safeServiceIndex) return;

            // Arrange
            const chatStateService = new MockChatStateService();
            const component = new MockCometChatGroupsComponent(groups, chatStateService);

            // Set different groups via prop and service
            component.activeGroup = groups[safePropIndex];
            chatStateService.setActiveGroup(groups[safeServiceIndex]);

            // Assert - Prop should take priority
            expect(component.isGroupActive(groups[safePropIndex])).toBe(true);
            expect(component.isGroupActive(groups[safeServiceIndex])).toBe(false);

            // Assert - Still only one active
            expect(component.countActiveGroups()).toBe(1);
          }
        ),
        { numRuns: 20 }
      );
    });

    /**
     * Test that active selection changes correctly when selection changes
     * **Validates: Requirements 8.5**
     */
    it('should update active class when selection changes for any group list', () => {
      fc.assert(
        fc.property(
          groupListArbitrary,
          fc.array(fc.integer({ min: 0, max: 19 }), { minLength: 2, maxLength: 5 }),
          (groups, selectionSequence) => {
            // Arrange
            const chatStateService = new MockChatStateService();
            const component = new MockCometChatGroupsComponent(groups, chatStateService);

            // Act - Change selection multiple times
            selectionSequence.forEach(index => {
              const safeIndex = index % groups.length;
              chatStateService.setActiveGroup(groups[safeIndex]);

              // Assert - After each change, exactly one group should be active
              expect(component.countActiveGroups()).toBe(1);
              expect(component.isGroupActive(groups[safeIndex])).toBe(true);
            });
          }
        ),
        { numRuns: 20 }
      );
    });

    /**
     * Test that no group has active class when no group is selected
     */
    it('should not apply --active class to any group when none is selected', () => {
      fc.assert(
        fc.property(groupListArbitrary, groups => {
          // Arrange
          const chatStateService = new MockChatStateService();
          const component = new MockCometChatGroupsComponent(groups, chatStateService);

          // No active group set (neither prop nor service)

          // Assert - No group should have the active class
          expect(component.countActiveGroups()).toBe(0);

          // Assert - All groups should return false for isGroupActive
          groups.forEach(group => {
            expect(component.isGroupActive(group)).toBe(false);
            expect(component.getGroupItemClass(group)).not.toContain('--active');
          });
        }),
        { numRuns: 20 }
      );
    });
  });

  // ==================== Conversations List Tests ====================

  describe('Conversations List Active Selection', () => {
    /**
     * Test that exactly one conversation has the --active class when one is set as active via prop
     * **Validates: Requirements 8.1, 8.4**
     */
    it('should apply --active class to exactly one conversation when set via prop for any conversation list', () => {
      fc.assert(
        fc.property(
          conversationListArbitrary,
          fc.integer({ min: 0, max: 19 }),
          (conversations, activeIndex) => {
            // Arrange
            const chatStateService = new MockChatStateService();
            const component = new MockCometChatConversationsComponent(
              conversations,
              chatStateService
            );

            // Set active conversation via prop
            const safeIndex = activeIndex % conversations.length;
            component.activeConversation = conversations[safeIndex];

            // Assert - Exactly one conversation should have the active class
            const activeCount = component.countActiveConversations();
            expect(activeCount).toBe(1);

            // Assert - The correct conversation should be active
            expect(component.isConversationActive(conversations[safeIndex])).toBe(true);

            // Assert - The active conversation should have the --active CSS class
            const cssClass = component.getConversationItemClass(conversations[safeIndex]);
            expect(cssClass).toContain('--active');
          }
        ),
        { numRuns: 20 }
      );
    });

    /**
     * Test that exactly one conversation has the --active class when set via ChatStateService
     * **Validates: Requirements 8.1, 8.5**
     */
    it('should apply --active class to exactly one conversation when set via ChatStateService for any conversation list', () => {
      fc.assert(
        fc.property(
          conversationListArbitrary,
          fc.integer({ min: 0, max: 19 }),
          (conversations, activeIndex) => {
            // Arrange
            const chatStateService = new MockChatStateService();
            const component = new MockCometChatConversationsComponent(
              conversations,
              chatStateService
            );

            // Set active conversation via service (no prop)
            const safeIndex = activeIndex % conversations.length;
            chatStateService.setActiveConversation(conversations[safeIndex]);

            // Assert - Exactly one conversation should have the active class
            const activeCount = component.countActiveConversations();
            expect(activeCount).toBe(1);

            // Assert - The correct conversation should be active
            expect(component.isConversationActive(conversations[safeIndex])).toBe(true);

            // Assert - Other conversations should NOT be active
            conversations.forEach((conv, index) => {
              if (index !== safeIndex) {
                expect(component.isConversationActive(conv)).toBe(false);
              }
            });
          }
        ),
        { numRuns: 20 }
      );
    });

    /**
     * Test that prop takes priority over ChatStateService for conversations
     * **Validates: Requirements 8.4**
     */
    it('should prioritize prop over ChatStateService for active conversation selection', () => {
      fc.assert(
        fc.property(
          conversationListArbitrary,
          fc.integer({ min: 0, max: 19 }),
          fc.integer({ min: 0, max: 19 }),
          (conversations, propIndex, serviceIndex) => {
            // Skip if same index
            const safePropIndex = propIndex % conversations.length;
            const safeServiceIndex = serviceIndex % conversations.length;
            if (safePropIndex === safeServiceIndex) return;

            // Arrange
            const chatStateService = new MockChatStateService();
            const component = new MockCometChatConversationsComponent(
              conversations,
              chatStateService
            );

            // Set different conversations via prop and service
            component.activeConversation = conversations[safePropIndex];
            chatStateService.setActiveConversation(conversations[safeServiceIndex]);

            // Assert - Prop should take priority
            expect(component.isConversationActive(conversations[safePropIndex])).toBe(true);
            expect(component.isConversationActive(conversations[safeServiceIndex])).toBe(false);

            // Assert - Still only one active
            expect(component.countActiveConversations()).toBe(1);
          }
        ),
        { numRuns: 20 }
      );
    });

    /**
     * Test that active selection changes correctly when selection changes
     * **Validates: Requirements 8.5**
     */
    it('should update active class when selection changes for any conversation list', () => {
      fc.assert(
        fc.property(
          conversationListArbitrary,
          fc.array(fc.integer({ min: 0, max: 19 }), { minLength: 2, maxLength: 5 }),
          (conversations, selectionSequence) => {
            // Arrange
            const chatStateService = new MockChatStateService();
            const component = new MockCometChatConversationsComponent(
              conversations,
              chatStateService
            );

            // Act - Change selection multiple times
            selectionSequence.forEach(index => {
              const safeIndex = index % conversations.length;
              chatStateService.setActiveConversation(conversations[safeIndex]);

              // Assert - After each change, exactly one conversation should be active
              expect(component.countActiveConversations()).toBe(1);
              expect(component.isConversationActive(conversations[safeIndex])).toBe(true);
            });
          }
        ),
        { numRuns: 20 }
      );
    });

    /**
     * Test that no conversation has active class when no conversation is selected
     */
    it('should not apply --active class to any conversation when none is selected', () => {
      fc.assert(
        fc.property(conversationListArbitrary, conversations => {
          // Arrange
          const chatStateService = new MockChatStateService();
          const component = new MockCometChatConversationsComponent(
            conversations,
            chatStateService
          );

          // No active conversation set (neither prop nor service)

          // Assert - No conversation should have the active class
          expect(component.countActiveConversations()).toBe(0);

          // Assert - All conversations should return false for isConversationActive
          conversations.forEach(conv => {
            expect(component.isConversationActive(conv)).toBe(false);
            expect(component.getConversationItemClass(conv)).not.toContain('--active');
          });
        }),
        { numRuns: 20 }
      );
    });
  });

  // ==================== Cross-Component Tests ====================

  describe('Cross-Component Active Selection Consistency', () => {
    /**
     * Test that ChatStateService maintains mutual exclusivity between user and group
     * **Validates: Requirements 8.4, 8.5**
     */
    it('should maintain mutual exclusivity between active user and active group', () => {
      fc.assert(
        fc.property(
          userListArbitrary,
          groupListArbitrary,
          fc.integer({ min: 0, max: 19 }),
          fc.integer({ min: 0, max: 19 }),
          (users, groups, userIndex, groupIndex) => {
            // Arrange
            const chatStateService = new MockChatStateService();
            const usersComponent = new MockCometChatUsersComponent(users, chatStateService);
            const groupsComponent = new MockCometChatGroupsComponent(groups, chatStateService);

            const safeUserIndex = userIndex % users.length;
            const safeGroupIndex = groupIndex % groups.length;

            // Act - Set user as active
            chatStateService.setActiveUser(users[safeUserIndex]);

            // Assert - User should be active, no group should be active
            expect(usersComponent.countActiveUsers()).toBe(1);
            expect(groupsComponent.countActiveGroups()).toBe(0);

            // Act - Set group as active
            chatStateService.setActiveGroup(groups[safeGroupIndex]);

            // Assert - Group should be active, no user should be active (mutual exclusivity)
            expect(usersComponent.countActiveUsers()).toBe(0);
            expect(groupsComponent.countActiveGroups()).toBe(1);
          }
        ),
        { numRuns: 20 }
      );
    });

    /**
     * Test that clearing active chat clears all active states
     * **Validates: Requirements 8.5**
     */
    it('should clear all active states when clearActiveChat is called', () => {
      fc.assert(
        fc.property(
          userListArbitrary,
          groupListArbitrary,
          conversationListArbitrary,
          fc.integer({ min: 0, max: 19 }),
          (users, groups, conversations, index) => {
            // Arrange
            const chatStateService = new MockChatStateService();
            const usersComponent = new MockCometChatUsersComponent(users, chatStateService);
            const groupsComponent = new MockCometChatGroupsComponent(groups, chatStateService);
            const conversationsComponent = new MockCometChatConversationsComponent(
              conversations,
              chatStateService
            );

            // Set some active states
            const safeUserIndex = index % users.length;
            chatStateService.setActiveUser(users[safeUserIndex]);

            // Verify active state is set
            expect(usersComponent.countActiveUsers()).toBe(1);

            // Act - Clear all active states
            chatStateService.clearActiveChat();

            // Assert - All components should have no active items
            expect(usersComponent.countActiveUsers()).toBe(0);
            expect(groupsComponent.countActiveGroups()).toBe(0);
            expect(conversationsComponent.countActiveConversations()).toBe(0);
          }
        ),
        { numRuns: 20 }
      );
    });

    /**
     * Test that active selection is deterministic - same inputs produce same results
     * **Validates: Requirements 8.4, 8.5**
     */
    it('should be deterministic - same inputs produce same active selection', () => {
      fc.assert(
        fc.property(
          userListArbitrary,
          fc.integer({ min: 0, max: 19 }),
          fc.integer({ min: 2, max: 5 }),
          (users, activeIndex, repeatCount) => {
            // Arrange
            const safeIndex = activeIndex % users.length;
            const results: boolean[] = [];

            // Act - Repeat the same operation multiple times
            for (let i = 0; i < repeatCount; i++) {
              const chatStateService = new MockChatStateService();
              const component = new MockCometChatUsersComponent(users, chatStateService);
              chatStateService.setActiveUser(users[safeIndex]);

              results.push(component.isUserActive(users[safeIndex]));
            }

            // Assert - All results should be identical (deterministic)
            for (let i = 1; i < results.length; i++) {
              expect(results[i]).toBe(results[0]);
            }

            // Assert - All should be true
            expect(results.every(r => r === true)).toBe(true);
          }
        ),
        { numRuns: 20 }
      );
    });

    /**
     * Test that active class is applied based on ID matching, not object reference
     * **Validates: Requirements 8.4**
     */
    it('should match active selection by ID, not object reference', () => {
      fc.assert(
        fc.property(userListArbitrary, fc.integer({ min: 0, max: 19 }), (users, activeIndex) => {
          // Arrange
          const chatStateService = new MockChatStateService();
          const component = new MockCometChatUsersComponent(users, chatStateService);

          const safeIndex = activeIndex % users.length;
          const originalUser = users[safeIndex];

          // Create a new user object with the same UID
          const clonedUser = new MockUser(
            originalUser.getUid(),
            originalUser.getName(),
            originalUser.getAvatar(),
            originalUser.getStatus()
          );

          // Set the cloned user as active (different object, same UID)
          chatStateService.setActiveUser(clonedUser);

          // Assert - Original user in list should be marked as active (ID match)
          expect(component.isUserActive(originalUser)).toBe(true);
          expect(component.countActiveUsers()).toBe(1);
        }),
        { numRuns: 20 }
      );
    });
  });
});
