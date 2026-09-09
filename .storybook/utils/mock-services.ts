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


// ── Search service mocks (signal-based) ────────────────────────────────────

import {
  createMockConversation,
  createMockConversations,
  createMockMessage,
  createMockMessages,
  createMockUser,
  MOCK_AVATARS,
} from './mock-data';

/** Sender pool reused across mock search results */
const MOCK_SENDERS = [
  { uid: 'sender-0', name: 'Andrew Joseph', avatar: MOCK_AVATARS.andrewJoseph },
  { uid: 'sender-1', name: 'Nancy Grace', avatar: MOCK_AVATARS.nancyGrace },
  { uid: 'sender-2', name: 'George Alan', avatar: MOCK_AVATARS.georgeAlan },
];

/** Receiver pool for message results (shown as title in non-scoped search) */
const MOCK_RECEIVERS = [
  { uid: 'recv-0', name: 'Andrew Joseph', avatar: MOCK_AVATARS.andrewJoseph },
  { uid: 'recv-1', name: 'Nancy Grace', avatar: MOCK_AVATARS.nancyGrace },
  { uid: 'recv-2', name: 'George Alan', avatar: MOCK_AVATARS.georgeAlan },
  { uid: 'recv-3', name: 'Design Team' },
  { uid: 'recv-4', name: 'Engineering' },
];

/**
 * Mock SearchConversationsService for Storybook stories.
 *
 * The `search()` method dynamically generates conversations whose last
 * message text contains the search keyword, and respects active filters
 * (Groups → only group conversations, Unread → only unread conversations).
 */
@Injectable()
export class MockSearchConversationsService {
  readonly conversations = signal<CometChat.Conversation[]>([]);
  readonly fetchState = signal<number>(3); // States.loaded = 3
  readonly hasMoreResults = signal<boolean>(false);
  readonly typingIndicatorMap = signal<Map<string, CometChat.TypingIndicator>>(new Map());

  /** Override in factory to force a specific state (loading / error / empty). */
  private _forceState: 'loading' | 'error' | 'empty' | null = null;

  search = (keyword: string, filters?: any[]): Promise<void> => {
    if (this._forceState === 'loading') {
      this.fetchState.set(0);
      return Promise.resolve();
    }
    if (this._forceState === 'error') {
      this.fetchState.set(2);
      return Promise.resolve();
    }
    if (this._forceState === 'empty') {
      this.conversations.set([]);
      this.fetchState.set(1);
      return Promise.resolve();
    }

    const kw = keyword || 'hello';
    const activeFilters: string[] = (filters || []) as string[];
    const groupsOnly = activeFilters.includes('groups');
    const unreadOnly = activeFilters.includes('unread');

    const templates = [
      `Hey, ${kw} — are you free for a call?`,
      `I was just thinking about ${kw}`,
      `Did you see the ${kw} update?`,
      `Re: ${kw} — looks good to me`,
      `Quick question about ${kw}`,
    ];
    const names = ['Andrew Joseph', 'Nancy Grace', 'George Alan', 'Design Team', 'Engineering'];
    const avatars = [MOCK_AVATARS.andrewJoseph, MOCK_AVATARS.nancyGrace, MOCK_AVATARS.georgeAlan, undefined, undefined];

    const convs = createMockConversations(5, i => {
      const isGroup = groupsOnly ? true : i >= 3;
      const unread = unreadOnly ? (i + 1) * 2 : (i === 0 ? 3 : i === 2 ? 1 : 0);
      return {
        type: isGroup ? 'group' as const : 'user' as const,
        conversationWith: isGroup
          ? undefined
          : createMockUser({ uid: `user-${i}`, name: names[i], avatar: avatars[i], status: i % 2 === 0 ? 'online' : 'offline' }),
        lastMessage: createMockMessage('text', { text: templates[i], sentAt: (Date.now() / 1000) - (i * 3600) }),
        unreadMessageCount: unread,
      };
    });

    this.conversations.set(convs);
    this.fetchState.set(3);
    return Promise.resolve();
  };

  loadMore = (): Promise<void> => Promise.resolve();
  attachListeners = (): void => {};
  detachListeners = (): void => {};
  reset = (): void => {};
}

/**
 * Mock SearchMessagesService for Storybook stories.
 *
 * The `search()` method dynamically generates messages that embed the
 * search keyword in text content and respects active filters
 * (Photos → only images, Videos → only videos, etc.).
 */
@Injectable()
export class MockSearchMessagesService {
  readonly messages = signal<CometChat.BaseMessage[]>([]);
  readonly fetchState = signal<number>(3); // States.loaded = 3
  readonly hasMoreResults = signal<boolean>(false);

  /** Override in factory to force a specific state (loading / error / empty). */
  private _forceState: 'loading' | 'error' | 'empty' | null = null;

  search = (keyword: string, filters?: any[]): Promise<void> => {
    if (this._forceState === 'loading') {
      this.fetchState.set(0);
      return Promise.resolve();
    }
    if (this._forceState === 'error') {
      this.fetchState.set(2);
      return Promise.resolve();
    }
    if (this._forceState === 'empty') {
      this.messages.set([]);
      this.fetchState.set(1);
      return Promise.resolve();
    }

    const kw = keyword || 'hello';
    const activeFilters: string[] = (filters || []) as string[];

    // Determine which message type to generate based on active filter
    // No filter / plain keyword → text only (realistic search behavior)
    // Specific media filter → that type only
    // 'messages' filter → mixed types
    // 'links' filter → text messages containing URLs
    let msgType: 'text' | 'image' | 'file' | 'audio' | 'video' | 'link' | 'mixed' = 'text';
    if (activeFilters.includes('messages')) msgType = 'mixed';
    else if (activeFilters.includes('photos')) msgType = 'image';
    else if (activeFilters.includes('videos')) msgType = 'video';
    else if (activeFilters.includes('files')) msgType = 'file';
    else if (activeFilters.includes('audio')) msgType = 'audio';
    else if (activeFilters.includes('links')) msgType = 'link';

    const count = msgType === 'mixed' ? 8 : 5;
    const mixedTypes: Array<'text' | 'image' | 'file' | 'audio' | 'video'> = [
      'text', 'text', 'image', 'text', 'file', 'audio', 'text', 'video',
    ];
    const textTemplates = [
      `Hey, ${kw} — are you available for a quick call?`,
      `I just pushed the ${kw} changes to the repo`,
      `${kw} screenshot attached`,
      `Let me know when you review the ${kw} PR`,
      `${kw} document shared`,
      `${kw} voice note`,
      `The ${kw} design looks great, shipping it tomorrow`,
      `${kw} recording`,
    ];
    const linkTemplates = [
      `Check out this ${kw} link: https://example.com/${kw}`,
      `Here's the ${kw} docs: https://docs.example.com/${kw}`,
      `Found this about ${kw}: https://blog.example.com/${kw}-guide`,
      `${kw} reference: https://wiki.example.com/${kw}`,
      `See https://example.com/${kw}-overview for details`,
    ];

    const msgs = createMockMessages(count, i => {
      const type = msgType === 'mixed' ? mixedTypes[i]
        : msgType === 'link' ? 'text' as const
        : msgType;
      const sender = createMockUser(MOCK_SENDERS[i % MOCK_SENDERS.length]);
      const receiver = createMockUser(MOCK_RECEIVERS[(i + 1) % MOCK_RECEIVERS.length]);
      const base: any = {
        type,
        sender,
        sentAt: (Date.now() / 1000) - (i * 3600),
        receiverId: receiver.getUid(),
      };
      if (type === 'text') {
        base.text = msgType === 'link'
          ? linkTemplates[i % linkTemplates.length]
          : textTemplates[i % textTemplates.length];
      }
      return base;
    });

    // Set receiver on each message so getMessageTitle() works
    msgs.forEach((msg, i) => {
      const recv = createMockUser(MOCK_RECEIVERS[(i + 1) % MOCK_RECEIVERS.length]);
      try { (msg as any).setReceiver(recv); } catch { /* some SDK versions may not support this */ }
    });

    this.messages.set(msgs);
    this.fetchState.set(3);
    this.hasMoreResults.set(true);
    return Promise.resolve();
  };

  loadMore = (): Promise<void> => Promise.resolve();
  reset = (): void => {};
}

/**
 * Creates a MockSearchConversationsService.
 * Pass `forceState` to lock it into loading / error / empty regardless of search().
 */
export function createMockSearchConversationsService(
  opts?: { forceState?: 'loading' | 'error' | 'empty' }
): MockSearchConversationsService {
  const svc = new MockSearchConversationsService();
  if (opts?.forceState) {
    (svc as any)._forceState = opts.forceState;
    // Set initial signal state so it renders correctly before search() is called
    if (opts.forceState === 'loading') svc.fetchState.set(0);
    else if (opts.forceState === 'error') svc.fetchState.set(2);
    else if (opts.forceState === 'empty') svc.fetchState.set(1);
  }
  return svc;
}

/**
 * Creates a MockSearchMessagesService.
 * Pass `forceState` to lock it into loading / error / empty regardless of search().
 */
export function createMockSearchMessagesService(
  opts?: { forceState?: 'loading' | 'error' | 'empty' }
): MockSearchMessagesService {
  const svc = new MockSearchMessagesService();
  if (opts?.forceState) {
    (svc as any)._forceState = opts.forceState;
    if (opts.forceState === 'loading') svc.fetchState.set(0);
    else if (opts.forceState === 'error') svc.fetchState.set(2);
    else if (opts.forceState === 'empty') svc.fetchState.set(1);
  }
  return svc;
}


// ── CometChat SDK-level search mock ───────────────────────────────────────

/**
 * Patches `CometChat.ConversationsRequestBuilder` and
 * `CometChat.MessagesRequestBuilder` so that the real
 * `SearchConversationsService` and `SearchMessagesService` (which are
 * provided at the component level and cannot be overridden via
 * `moduleMetadata`) return mock data instead of making live SDK calls.
 *
 * Call `installSearchSDKMock(conversations, messages)` in a story's
 * `render` function or `play` hook before the component initialises.
 * Call `uninstallSearchSDKMock()` in `play` cleanup if needed.
 *
 * @param conversations - Conversations to return from fetchNext()
 * @param messages      - Messages to return from fetchPrevious()
 * @param opts.forceState - 'loading' | 'error' | 'empty' to simulate those states
 */
export function installSearchSDKMock(
  conversations: CometChat.Conversation[],
  messages: CometChat.BaseMessage[],
  opts?: { forceState?: 'loading' | 'error' | 'empty' }
): void {
  const forceState = opts?.forceState;

  // --- ConversationsRequestBuilder mock ---
  const origConvBuilder = (CometChat as any).ConversationsRequestBuilder;

  function MockConvBuilder(this: any) {
    this._limit = 30;
    this._keyword = '';
    this._type = '';
    this._unread = false;
  }
  MockConvBuilder.prototype.setLimit = function (n: number) { this._limit = n; return this; };
  MockConvBuilder.prototype.setSearchKeyword = function (k: string) { this._keyword = k; return this; };
  MockConvBuilder.prototype.setConversationType = function (t: string) { this._type = t; return this; };
  MockConvBuilder.prototype.setUnread = function (u: boolean) { this._unread = u; return this; };
  MockConvBuilder.prototype.build = function () {
    return {
      fetchNext: () => {
        if (forceState === 'loading') return new Promise(() => {}); // never resolves
        if (forceState === 'error') return Promise.reject(new Error('mock error'));
        if (forceState === 'empty') return Promise.resolve([]);
        return Promise.resolve(conversations);
      },
    };
  };
  (CometChat as any).ConversationsRequestBuilder = MockConvBuilder;
  (CometChat as any)._origConvBuilder = origConvBuilder;

  // --- MessagesRequestBuilder mock ---
  const origMsgBuilder = (CometChat as any).MessagesRequestBuilder;

  function MockMsgBuilder(this: any) {}
  MockMsgBuilder.prototype.setLimit = function () { return this; };
  MockMsgBuilder.prototype.setSearchKeyword = function () { return this; };
  MockMsgBuilder.prototype.setUID = function () { return this; };
  MockMsgBuilder.prototype.setGUID = function () { return this; };
  MockMsgBuilder.prototype.hideDeletedMessages = function () { return this; };
  MockMsgBuilder.prototype.hasLinks = function () { return this; };
  MockMsgBuilder.prototype.setAttachmentTypes = function () { return this; };
  MockMsgBuilder.prototype.build = function () {
    return {
      fetchPrevious: () => {
        if (forceState === 'loading') return new Promise(() => {});
        if (forceState === 'error') return Promise.reject(new Error('mock error'));
        if (forceState === 'empty') return Promise.resolve([]);
        return Promise.resolve([...messages].reverse());
      },
    };
  };
  (CometChat as any).MessagesRequestBuilder = MockMsgBuilder;
  (CometChat as any)._origMsgBuilder = origMsgBuilder;

  // Also stub getLoggedinUser so the child components don't throw
  if (!(CometChat as any)._origGetLoggedinUser) {
    (CometChat as any)._origGetLoggedinUser = CometChat.getLoggedinUser;
    (CometChat as any).getLoggedinUser = () =>
      Promise.resolve(createMockUser({ uid: 'storybook-user', name: 'Storybook User' }));
  }
}

/** Restores the original CometChat SDK builder classes. */
export function uninstallSearchSDKMock(): void {
  if ((CometChat as any)._origConvBuilder) {
    (CometChat as any).ConversationsRequestBuilder = (CometChat as any)._origConvBuilder;
    delete (CometChat as any)._origConvBuilder;
  }
  if ((CometChat as any)._origMsgBuilder) {
    (CometChat as any).MessagesRequestBuilder = (CometChat as any)._origMsgBuilder;
    delete (CometChat as any)._origMsgBuilder;
  }
  if ((CometChat as any)._origGetLoggedinUser) {
    (CometChat as any).getLoggedinUser = (CometChat as any)._origGetLoggedinUser;
    delete (CometChat as any)._origGetLoggedinUser;
  }
}


// ── Search wrapper component for Storybook ────────────────────────────────

import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { SearchConversationsService } from '../../projects/cometchat-uikit/src/lib/services/search-conversations.service';
import { SearchMessagesService } from '../../projects/cometchat-uikit/src/lib/services/search-messages.service';
import {
  CometChatSearchComponent,
  type SearchConversationClickEvent,
  type SearchMessageClickEvent,
} from '../../projects/cometchat-uikit/src/lib/components/cometchat-search/cometchat-search.component';
import { CometChatSearchFilter, CometChatSearchScope, States } from '../../projects/cometchat-uikit/src/lib/Enums/Enums';

/**
 * Storybook-only wrapper for CometChatSearch.
 *
 * Passes mock conversationsRequestBuilder and messagesRequestBuilder via
 * the component's own @Input() props — the same pattern as MessageList.
 * This bypasses the SDK entirely without any DI tricks or global patching.
 *
 * The builders are built once in ngOnChanges (after inputs are set) and
 * cached so Angular sees a stable object reference across CD cycles.
 */
@Component({
  selector: 'cometchat-search-story-wrapper',
  standalone: true,
  imports: [CometChatSearchComponent],
  template: `
    <cometchat-search
      [defaultSearchText]="defaultSearchText"
      [hideBackButton]="hideBackButton"
      [searchIn]="searchIn"
      [searchFilters]="searchFilters ?? defaultFilters"
      [initialSearchFilter]="initialSearchFilter"
      [hideGroupType]="hideGroupType"
      [hideUserStatus]="hideUserStatus"
      [hideReceipts]="hideReceipts"
      [conversationsRequestBuilder]="mockConvBuilder"
      [messagesRequestBuilder]="mockMsgBuilder"
      (backClick)="backClick.emit()"
      (conversationClick)="conversationClick.emit($event)"
      (messageClick)="messageClick.emit($event)"
      (searchError)="searchError.emit($event)">
    </cometchat-search>
  `,
})
export class CometChatSearchStoryWrapperComponent implements OnChanges {
  @Input() defaultSearchText?: string;
  @Input() hideBackButton = false;
  @Input() searchIn: CometChatSearchScope[] = [];
  @Input() searchFilters?: CometChatSearchFilter[];
  @Input() initialSearchFilter?: CometChatSearchFilter;
  @Input() hideGroupType = false;
  @Input() hideUserStatus = false;
  @Input() hideReceipts = false;
  @Input() forceState: 'loaded' | 'loading' | 'empty' | 'error' = 'loaded';
  @Input() mockConversations: CometChat.Conversation[] = [];
  @Input() mockMessages: CometChat.BaseMessage[] = [];

  // Forwarded so the story's argTypes describe events that exist on the type
  // Storybook checks — the wrapper, not the component it renders.
  @Output() backClick = new EventEmitter<void>();
  @Output() conversationClick = new EventEmitter<SearchConversationClickEvent>();
  @Output() messageClick = new EventEmitter<SearchMessageClickEvent>();
  @Output() searchError = new EventEmitter<CometChat.CometChatException>();

  readonly defaultFilters = [
    CometChatSearchFilter.Audio,
    CometChatSearchFilter.Documents,
    CometChatSearchFilter.Groups,
    CometChatSearchFilter.Photos,
    CometChatSearchFilter.Videos,
    CometChatSearchFilter.Links,
    CometChatSearchFilter.Unread,
  ];

  mockConvBuilder: any = null;
  mockMsgBuilder: any = null;

  ngOnChanges(_changes: SimpleChanges): void {
    this._buildMocks();
  }

  private _makeBuilder(fetchNextFn: () => Promise<any[]>): any {
    const builder: any = {};
    const chain = [
      'setLimit', 'setSearchKeyword', 'setConversationType', 'setUnread',
      'setUID', 'setGUID', 'setCategories', 'setTypes', 'hideReplies',
      'setTimestamp', 'setMessageId', 'setParentMessageId', 'withParent',
      'hideDeletedMessages', 'setAttachmentTypes', 'hasLinks',
    ];
    chain.forEach(m => { builder[m] = () => builder; });
    builder.build = () => ({ fetchNext: fetchNextFn, fetchPrevious: fetchNextFn });
    return builder;
  }

  private _buildMocks(): void {
    switch (this.forceState) {
      case 'loading':
        // Never-resolving promise keeps the service in loading state
        this.mockConvBuilder = this._makeBuilder(() => new Promise(() => {}));
        this.mockMsgBuilder = this._makeBuilder(() => new Promise(() => {}));
        break;
      case 'empty':
        this.mockConvBuilder = this._makeBuilder(async () => []);
        this.mockMsgBuilder = this._makeBuilder(async () => []);
        break;
      case 'error':
        this.mockConvBuilder = this._makeBuilder(async () => { throw new Error('mock error'); });
        this.mockMsgBuilder = this._makeBuilder(async () => { throw new Error('mock error'); });
        break;
      case 'loaded':
      default: {
        const convs = this.mockConversations;
        const msgs = this.mockMessages;
        this.mockConvBuilder = this._makeBuilder(async () => convs);
        this.mockMsgBuilder = this._makeBuilder(async () => [...msgs].reverse());
        break;
      }
    }
  }
}

/**
 * Patches the SearchConversationsService and SearchMessagesService instances
 * that live inside the rendered CometChatSearch component tree.
 *
 * Call this from a story's `play` function after a short delay to allow
 * Angular's @defer blocks to mount the child list components:
 *
 * ```ts
 * play: async ({ canvasElement }) => {
 *   await patchSearchServices(canvasElement, 'empty');
 * }
 * ```
 */
export async function patchSearchServices(
  canvasElement: HTMLElement,
  forceState: 'loaded' | 'loading' | 'empty' | 'error',
  mockConversations: CometChat.Conversation[] = [],
  mockMessages: CometChat.BaseMessage[] = [],
): Promise<void> {
  const { ɵgetDirectives } = await import('@angular/core');

  // Wait for @defer (on idle) to mount the child list components
  await new Promise(r => setTimeout(r, 400));

  const convListEl = canvasElement.querySelector('cometchat-search-conversations-list');
  const msgListEl = canvasElement.querySelector('cometchat-search-messages-list');

  function applyToConvService(svc: SearchConversationsService): void {
    switch (forceState) {
      case 'loading':
        svc.search = async () => { svc.fetchState.set(States.loading); svc.conversations.set([]); };
        break;
      case 'empty':
        svc.search = async () => { svc.fetchState.set(States.empty); svc.conversations.set([]); };
        break;
      case 'error':
        svc.search = async () => { svc.fetchState.set(States.error); svc.conversations.set([]); };
        break;
      default:
        svc.search = async () => {
          svc.conversations.set(mockConversations);
          svc.fetchState.set(mockConversations.length > 0 ? States.loaded : States.empty);
        };
    }
    // Re-trigger with current state immediately
    svc.search('', []);
  }

  function applyToMsgService(svc: SearchMessagesService): void {
    switch (forceState) {
      case 'loading':
        svc.search = async () => { svc.fetchState.set(States.loading); svc.messages.set([]); };
        break;
      case 'empty':
        svc.search = async () => { svc.fetchState.set(States.empty); svc.messages.set([]); };
        break;
      case 'error':
        svc.search = async () => { svc.fetchState.set(States.error); svc.messages.set([]); };
        break;
      default:
        svc.search = async () => {
          svc.messages.set(mockMessages);
          svc.fetchState.set(mockMessages.length > 0 ? States.loaded : States.empty);
        };
    }
    svc.search('', []);
  }

  if (convListEl) {
    try {
      const directives = ɵgetDirectives(convListEl);
      const comp = directives.find((d: any) => d.service instanceof SearchConversationsService) as any;
      if (comp?.service) applyToConvService(comp.service);
    } catch { /* not yet mounted */ }
  }

  if (msgListEl) {
    try {
      const directives = ɵgetDirectives(msgListEl);
      const comp = directives.find((d: any) => d.service instanceof SearchMessagesService) as any;
      if (comp?.service) applyToMsgService(comp.service);
    } catch { /* not yet mounted */ }
  }
}
