import { Injectable, signal } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { CometChat } from '@cometchat/chat-sdk-javascript';

/**
 * Mock CometChat service for Storybook stories.
 * 
 * This service provides mock implementations of CometChat SDK methods,
 * allowing components to be rendered in Storybook without requiring
 * actual CometChat SDK initialization or authentication.
 * 
 * The mock service returns realistic test data with appropriate delays
 * to simulate network requests.
 */
@Injectable()
export class MockCometChatService {
  /**
   * Mock login method.
   * Returns a mock user without requiring actual authentication.
   * 
   * @param uid - User ID to login
   * @returns Promise resolving to a mock CometChat.User
   */
  async login(uid: string): Promise<CometChat.User> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const user = new CometChat.User(uid);
    user.setName(`Mock User ${uid}`);
    user.setStatus(CometChat.USER_STATUS.ONLINE);
    
    return user;
  }

  /**
   * Mock login with auth token method.
   * Returns a mock user without requiring actual authentication.
   * 
   * @param authToken - Authentication token
   * @returns Promise resolving to a mock CometChat.User
   */
  async loginWithAuthToken(authToken: string): Promise<CometChat.User> {
    return this.login('mock-user');
  }

  /**
   * Mock logout method.
   * Returns a success message without performing actual logout.
   * 
   * @returns Promise resolving to a success object
   */
  async logout(): Promise<object> {
    await new Promise(resolve => setTimeout(resolve, 200));
    return { message: 'Logged out successfully' };
  }

  /**
   * Mock get logged in user method.
   * Returns a mock user representing the currently logged in user.
   * 
   * @returns Promise resolving to a mock CometChat.User
   */
  async getLoggedInUser(): Promise<CometChat.User> {
    const user = new CometChat.User('mock-logged-in-user');
    user.setName('Mock Logged In User');
    user.setStatus(CometChat.USER_STATUS.ONLINE);
    
    return user;
  }

  /**
   * Mock send message method.
   * Returns the message with a sent timestamp without actually sending it.
   * 
   * @param message - Message to send
   * @returns Promise resolving to the sent message
   */
  async sendMessage(message: CometChat.BaseMessage): Promise<CometChat.BaseMessage> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    message.setSentAt(Date.now() / 1000);
    message.setMuid(Math.random().toString(36).substring(7));
    
    return message;
  }

  /**
   * Mock get users method.
   * Returns an observable of mock users.
   * 
   * @param limit - Number of users to return
   * @returns Observable of CometChat.User array
   */
  getUsers(limit: number = 30): Observable<CometChat.User[]> {
    const users: CometChat.User[] = [];
    
    for (let i = 0; i < limit; i++) {
      const user = new CometChat.User(`user-${i}`);
      user.setName(`User ${i + 1}`);
      user.setStatus(
        i % 2 === 0 
          ? CometChat.USER_STATUS.ONLINE 
          : CometChat.USER_STATUS.OFFLINE
      );
      users.push(user);
    }
    
    return of(users).pipe(delay(500));
  }

  /**
   * Mock get conversations method.
   * Returns an observable of mock conversations.
   * 
   * @param limit - Number of conversations to return
   * @returns Observable of CometChat.Conversation array
   */
  getConversations(limit: number = 30): Observable<CometChat.Conversation[]> {
    // Return empty array to avoid type issues
    // Stories should use createMockConversation() from mock-data.ts instead
    return of([]).pipe(delay(500));
  }

  /**
   * Mock get groups method.
   * Returns an observable of mock groups.
   * 
   * @param limit - Number of groups to return
   * @returns Observable of CometChat.Group array
   */
  getGroups(limit: number = 30): Observable<CometChat.Group[]> {
    // Return empty array to avoid type issues
    // Stories should use createMockGroup() from mock-data.ts instead
    return of([]).pipe(delay(500));
  }

  /**
   * Mock get messages method.
   * Returns an observable of mock messages.
   * 
   * @param limit - Number of messages to return
   * @returns Observable of CometChat.BaseMessage array
   */
  getMessages(limit: number = 30): Observable<CometChat.BaseMessage[]> {
    // Return empty array to avoid type issues
    // Stories should use createMockMessage() from mock-data.ts instead
    return of([]).pipe(delay(500));
  }
}

/**
 * Mock CallButtonsService for Storybook stories.
 *
 * Provides no-op implementations of the CallButtonsService methods
 * and idle signal values, allowing call-related components (call-buttons,
 * incoming-call, outgoing-call, ongoing-call) to render in Storybook
 * without requiring CometChat SDK initialization.
 */
@Injectable()
export class MockCallService {
  /** Idle call state signals (all null/false/empty). */
  readonly activeCall = signal<CometChat.Call | null>(null);
  readonly sessionId = signal<string>('');
  readonly buttonsDisabled = signal<boolean>(false);
  readonly showOutgoingCallScreen = signal<boolean>(false);
  readonly showOngoingCall = signal<boolean>(false);
  readonly loggedInUser = signal<CometChat.User | null>(null);
  readonly activeUser = signal<CometChat.User | null>(null);
  readonly activeGroup = signal<CometChat.Group | null>(null);
  readonly isGroupAudioCall = signal<boolean>(false);

  /** No-op initialization. */
  initialize(): void {}

  /** Sets the active user signal. */
  setActiveUser(user: CometChat.User | null): void {
    this.activeUser.set(user);
  }

  /** Sets the active group signal. */
  setActiveGroup(group: CometChat.Group | null): void {
    this.activeGroup.set(group);
  }

  /** Simulates initiating an audio call (no-op). */
  async initiateAudioCall(): Promise<void> {}

  /** Simulates initiating a video call (no-op). */
  async initiateVideoCall(): Promise<void> {}

  /** Simulates cancelling an outgoing call (no-op). */
  async cancelOutgoingCall(): Promise<void> {}

  /** Resets all call state signals to idle. */
  resetCallState(): void {
    this.activeCall.set(null);
    this.sessionId.set('');
    this.buttonsDisabled.set(false);
    this.showOutgoingCallScreen.set(false);
    this.showOngoingCall.set(false);
  }

  ngOnDestroy(): void {}
}

/**
 * Mock AI service for Storybook stories.
 *
 * Provides mock implementations of CometChat AI extension methods
 * (smart replies, conversation starters) so that AI-related components
 * can render in Storybook without live SDK calls.
 *
 * Stories can use this service via `moduleMetadata` providers to override
 * the real SDK calls that components make internally.
 */
@Injectable()
export class MockAIService {
  /** Default mock smart reply suggestions. */
  private smartReplies: string[] = [
    'Sounds good!',
    'Let me check and get back to you.',
    'Thanks for letting me know.',
  ];

  /** Default mock conversation starters. */
  private conversationStarters: string[] = [
    'Hey! How are you doing?',
    'What are you working on today?',
    'Did you see the latest update?',
  ];

  /**
   * Returns mock smart reply suggestions.
   *
   * @param _receiverId - Ignored in mock
   * @param _receiverType - Ignored in mock
   * @returns Promise resolving to a record of reply strings
   */
  async getSmartReplies(
    _receiverId?: string,
    _receiverType?: string
  ): Promise<Record<string, string>> {
    await new Promise(resolve => setTimeout(resolve, 300));
    const result: Record<string, string> = {};
    this.smartReplies.forEach((reply, i) => {
      result[`reply_${i + 1}`] = reply;
    });
    return result;
  }

  /**
   * Returns mock conversation starter suggestions.
   *
   * @param _receiverId - Ignored in mock
   * @param _receiverType - Ignored in mock
   * @returns Promise resolving to an array of starter strings
   */
  async getConversationStarters(
    _receiverId?: string,
    _receiverType?: string
  ): Promise<string[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return [...this.conversationStarters];
  }

  /**
   * Sets custom smart reply suggestions for a specific story.
   *
   * @param replies - Array of reply strings
   */
  setSmartReplies(replies: string[]): void {
    this.smartReplies = replies;
  }

  /**
   * Sets custom conversation starters for a specific story.
   *
   * @param starters - Array of starter strings
   */
  setConversationStarters(starters: string[]): void {
    this.conversationStarters = starters;
  }
}

/**
 * No-op CallAnnouncerService stub for Storybook rendering.
 *
 * Provides empty implementations of all CallAnnouncerService methods,
 * allowing call-related components to render in Storybook without
 * triggering real call announcement logic.
 *
 * Used by: call-buttons, incoming-call, outgoing-call, ongoing-call stories.
 */
export const mockCallAnnouncer = {
  announceCallInitiation: () => {},
  announceIncomingCall: () => {},
  announceOutgoingCall: () => {},
  announceCallEnded: () => {},
};

/**
 * No-op DialogFocusManager stub for Storybook rendering.
 *
 * Provides empty implementations of focus trap management methods,
 * allowing dialog-based call components to render without real
 * focus trap logic.
 *
 * Used by: incoming-call, outgoing-call stories.
 */
export class MockDialogFocusManager {
  openDialog(_opts: any): void {}
  closeDialog(_el: HTMLElement): void {}
}

import { BehaviorSubject } from 'rxjs';

/**
 * Mock ConversationsService for Storybook stories.
 *
 * Provides BehaviorSubject-based observable streams and no-op methods
 * so that Conversations component stories render without SDK initialization.
 */
@Injectable()
export class MockConversationsService {
  private _conversations$ = new BehaviorSubject<CometChat.Conversation[]>([]);
  private _loadingState$ = new BehaviorSubject<boolean>(false);
  private _errorState$ = new BehaviorSubject<Error | null>(null);

  conversations$ = this._conversations$.asObservable();
  loadingState$ = this._loadingState$.asObservable();
  errorState$ = this._errorState$.asObservable();

  fetchConversations = (): Promise<void> => Promise.resolve();
  fetchNextConversations = (): Promise<void> => Promise.resolve();
  searchConversations = (_q: string): void => {};
  deleteConversation = (_id: string): Promise<void> => Promise.resolve();
  setActiveConversation = (_c: CometChat.Conversation | null): void => {};
  cleanup = (): void => {};
}

/**
 * Mock UsersService for Storybook stories.
 */
@Injectable()
export class MockUsersService {
  private _users$ = new BehaviorSubject<CometChat.User[]>([]);
  private _loadingState$ = new BehaviorSubject<boolean>(false);
  private _errorState$ = new BehaviorSubject<Error | null>(null);

  users$ = this._users$.asObservable();
  loadingState$ = this._loadingState$.asObservable();
  errorState$ = this._errorState$.asObservable();

  fetchUsers = (): Promise<void> => Promise.resolve();
  searchUsers = (_q: string): void => {};
  cleanup = (): void => {};
}

/**
 * Mock GroupsService for Storybook stories.
 */
@Injectable()
export class MockGroupsService {
  private _groups$ = new BehaviorSubject<CometChat.Group[]>([]);
  private _loadingState$ = new BehaviorSubject<boolean>(false);
  private _errorState$ = new BehaviorSubject<Error | null>(null);

  groups$ = this._groups$.asObservable();
  loadingState$ = this._loadingState$.asObservable();
  errorState$ = this._errorState$.asObservable();

  fetchGroups = (): Promise<void> => Promise.resolve();
  searchGroups = (_q: string): void => {};
  cleanup = (): void => {};
}

/**
 * Mock GroupMembersService for Storybook stories.
 */
@Injectable()
export class MockGroupMembersService {
  private _members$ = new BehaviorSubject<CometChat.GroupMember[]>([]);
  private _loadingState$ = new BehaviorSubject<boolean>(false);

  members$ = this._members$.asObservable();
  loadingState$ = this._loadingState$.asObservable();

  fetchMembers = (_guid: string): Promise<void> => Promise.resolve();
  cleanup = (): void => {};
}

/**
 * Mock MessageListService for Storybook stories.
 */
@Injectable()
export class MockMessageListService {
  private _messages$ = new BehaviorSubject<CometChat.BaseMessage[]>([]);
  private _loadingState$ = new BehaviorSubject<boolean>(false);

  messages$ = this._messages$.asObservable();
  loadingState$ = this._loadingState$.asObservable();

  fetchMessages = (): Promise<void> => Promise.resolve();
  sendMessage = (m: CometChat.BaseMessage): Promise<CometChat.BaseMessage> => Promise.resolve(m);
  cleanup = (): void => {};
}

// ── Factory helpers ────────────────────────────────────────────────────────

/**
 * Creates a MockConversationsService pre-populated with the given conversations.
 */
export function createMockConversationsServiceWith(
  conversations: CometChat.Conversation[],
  opts?: { loading?: boolean; error?: Error }
): MockConversationsService {
  const svc = new MockConversationsService();
  (svc as any)._conversations$ = new BehaviorSubject(conversations);
  (svc as any).conversations$ = (svc as any)._conversations$.asObservable();
  if (opts?.loading) {
    (svc as any)._loadingState$ = new BehaviorSubject(true);
    (svc as any).loadingState$ = (svc as any)._loadingState$.asObservable();
  }
  if (opts?.error) {
    (svc as any)._errorState$ = new BehaviorSubject(opts.error);
    (svc as any).errorState$ = (svc as any)._errorState$.asObservable();
  }
  return svc;
}

/**
 * Creates a MockUsersService pre-populated with the given users.
 */
export function createMockUsersServiceWith(
  users: CometChat.User[],
  opts?: { loading?: boolean; error?: Error }
): MockUsersService {
  const svc = new MockUsersService();
  (svc as any)._users$ = new BehaviorSubject(users);
  (svc as any).users$ = (svc as any)._users$.asObservable();
  if (opts?.loading) {
    (svc as any)._loadingState$ = new BehaviorSubject(true);
    (svc as any).loadingState$ = (svc as any)._loadingState$.asObservable();
  }
  if (opts?.error) {
    (svc as any)._errorState$ = new BehaviorSubject(opts.error);
    (svc as any).errorState$ = (svc as any)._errorState$.asObservable();
  }
  return svc;
}

/**
 * Creates a MockGroupsService pre-populated with the given groups.
 */
export function createMockGroupsServiceWith(
  groups: CometChat.Group[],
  opts?: { loading?: boolean; error?: Error }
): MockGroupsService {
  const svc = new MockGroupsService();
  (svc as any)._groups$ = new BehaviorSubject(groups);
  (svc as any).groups$ = (svc as any)._groups$.asObservable();
  if (opts?.loading) {
    (svc as any)._loadingState$ = new BehaviorSubject(true);
    (svc as any).loadingState$ = (svc as any)._loadingState$.asObservable();
  }
  if (opts?.error) {
    (svc as any)._errorState$ = new BehaviorSubject(opts.error);
    (svc as any).errorState$ = (svc as any)._errorState$.asObservable();
  }
  return svc;
}

/**
 * Creates a MockGroupMembersService pre-populated with the given members.
 */
export function createMockGroupMembersServiceWith(
  members: CometChat.GroupMember[],
  opts?: { loading?: boolean }
): MockGroupMembersService {
  const svc = new MockGroupMembersService();
  (svc as any)._members$ = new BehaviorSubject(members);
  (svc as any).members$ = (svc as any)._members$.asObservable();
  if (opts?.loading) {
    (svc as any)._loadingState$ = new BehaviorSubject(true);
    (svc as any).loadingState$ = (svc as any)._loadingState$.asObservable();
  }
  return svc;
}

/**
 * Creates a MockMessageListService pre-populated with the given messages.
 */
export function createMockMessageListServiceWith(
  messages: CometChat.BaseMessage[],
  opts?: { loading?: boolean }
): MockMessageListService {
  const svc = new MockMessageListService();
  (svc as any)._messages$ = new BehaviorSubject(messages);
  (svc as any).messages$ = (svc as any)._messages$.asObservable();
  if (opts?.loading) {
    (svc as any)._loadingState$ = new BehaviorSubject(true);
    (svc as any).loadingState$ = (svc as any)._loadingState$.asObservable();
  }
  return svc;
}
