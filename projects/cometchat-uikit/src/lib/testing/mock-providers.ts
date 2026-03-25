/**
 * Common Angular TestBed Providers for Testing
 *
 * Pre-configured provider arrays for use in TestBed.configureTestingModule().
 * These mock providers eliminate boilerplate across 100+ spec files by providing
 * ready-to-use mocks for localization, chat state, and CometChat SDK calls.
 *
 * @module testing/mock-providers
 * _Requirements: 15.5_
 *
 * @example
 * ```ts
 * import { MOCK_LOCALIZE_PROVIDERS, MOCK_CHAT_STATE_PROVIDERS } from '../../testing';
 *
 * beforeEach(async () => {
 *   await TestBed.configureTestingModule({
 *     imports: [MyComponent],
 *     providers: [...MOCK_LOCALIZE_PROVIDERS, ...MOCK_CHAT_STATE_PROVIDERS],
 *   }).compileComponents();
 * });
 * ```
 */

import { Pipe, PipeTransform, Provider, signal } from '@angular/core';
import { vi } from 'vitest';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { Observable, of } from 'rxjs';

import { MockInstance } from 'vitest';

import { TranslatePipe } from '../resources/CometChatLocalize/translate.pipe';
import { CometChatLocalize } from '../resources/CometChatLocalize/cometchat-localize';
import { ChatStateService } from '../services/chat-state.service';
import { ConversationsService } from '../services/conversations.service';
import {
  createMockUser,
  createMockGroup,
  createMockConversation,
  createMockTextMessage,
} from './mock-sdk';

// ─── Mock TranslatePipe ───

/**
 * Mock TranslatePipe that returns the key as-is (or with params appended).
 *
 * This avoids depending on the real CometChatLocalize translations in tests,
 * while still allowing assertions on which keys are used in templates.
 */
@Pipe({ name: 'translate', standalone: true, pure: false })
export class MockTranslatePipe implements PipeTransform {
  transform(key: string, params?: Record<string, string | number>): string {
    if (!key) return '';
    if (params) {
      // Append params so tests can verify interpolation usage
      const paramStr = Object.entries(params)
        .map(([k, v]) => `${k}=${v}`)
        .join(',');
      return `${key}[${paramStr}]`;
    }
    return key;
  }
}

// ─── Mock ChatStateService ───

/**
 * Creates a mock ChatStateService with controllable signals and observables.
 *
 * All state starts as null. Use the returned setters to drive state changes
 * in tests without needing the real ConversationsService dependency.
 */
export function createMockChatStateService(): MockChatStateServiceType {
  const activeUserSignal = signal<CometChat.User | null>(null);
  const activeGroupSignal = signal<CometChat.Group | null>(null);
  const activeConversationSignal = signal<CometChat.Conversation | null>(null);

  return {
    // Readonly signals (matching real service API)
    activeUser: activeUserSignal.asReadonly(),
    activeGroup: activeGroupSignal.asReadonly(),
    activeConversation: activeConversationSignal.asReadonly(),

    // Observables (simplified — emit current value via of())
    activeUser$: of(null) as Observable<CometChat.User | null>,
    activeGroup$: of(null) as Observable<CometChat.Group | null>,
    activeConversation$: of(null) as Observable<CometChat.Conversation | null>,

    // Setters
    setActiveUser: vi.fn((user: CometChat.User | null) => {
      activeUserSignal.set(user);
      activeGroupSignal.set(null);
    }),
    setActiveGroup: vi.fn((group: CometChat.Group | null) => {
      activeGroupSignal.set(group);
      activeUserSignal.set(null);
    }),
    setActiveConversation: vi.fn((conversation: CometChat.Conversation | null) => {
      activeConversationSignal.set(conversation);
    }),

    // Getters
    getActiveUser: vi.fn(() => activeUserSignal()),
    getActiveGroup: vi.fn(() => activeGroupSignal()),
    getActiveConversation: vi.fn(() => activeConversationSignal()),
    getActiveChatEntity: vi.fn(() => activeUserSignal() ?? activeGroupSignal() ?? null),

    // Clear
    clearActiveChat: vi.fn(() => {
      activeUserSignal.set(null);
      activeGroupSignal.set(null);
      activeConversationSignal.set(null);
    }),
  };
}

/** Type for the mock ChatStateService */
export interface MockChatStateServiceType {
  activeUser: ReturnType<typeof signal<CometChat.User | null>>['asReadonly'] extends () => infer R
    ? R
    : never;
  activeGroup: ReturnType<typeof signal<CometChat.Group | null>>['asReadonly'] extends () => infer R
    ? R
    : never;
  activeConversation: ReturnType<
    typeof signal<CometChat.Conversation | null>
  >['asReadonly'] extends () => infer R
    ? R
    : never;
  activeUser$: Observable<CometChat.User | null>;
  activeGroup$: Observable<CometChat.Group | null>;
  activeConversation$: Observable<CometChat.Conversation | null>;
  setActiveUser: ReturnType<typeof vi.fn>;
  setActiveGroup: ReturnType<typeof vi.fn>;
  setActiveConversation: ReturnType<typeof vi.fn>;
  getActiveUser: ReturnType<typeof vi.fn>;
  getActiveGroup: ReturnType<typeof vi.fn>;
  getActiveConversation: ReturnType<typeof vi.fn>;
  getActiveChatEntity: ReturnType<typeof vi.fn>;
  clearActiveChat: ReturnType<typeof vi.fn>;
}

// ─── Mock ConversationsService ───

/**
 * Creates a minimal mock ConversationsService.
 *
 * ChatStateService depends on ConversationsService via inject(),
 * so this must be provided when using MOCK_CHAT_STATE_PROVIDERS.
 */
export function createMockConversationsService(): Record<string, any> {
  return {
    setActiveConversation: vi.fn(),
    getConversations: vi.fn(() => []),
    fetchConversations: vi.fn(() => Promise.resolve()),
    fetchNextConversations: vi.fn(() => Promise.resolve(false)),
    deleteConversation: vi.fn(() => Promise.resolve()),
    searchConversations: vi.fn(),
    updateConversationList: vi.fn(),
    removeConversation: vi.fn(),
    findConversation: vi.fn(() => null),
    replaceConversation: vi.fn(() => false),
    moveConversationToTop: vi.fn(() => false),
    insertConversationAt: vi.fn(),
    getConversationIndex: vi.fn(() => -1),
    updateConversationUnreadCount: vi.fn(),
    updateConversationReadStatus: vi.fn(),
    cleanup: vi.fn(),
    removeListeners: vi.fn(),
    clearError: vi.fn(),
    setConversationsRequestBuilder: vi.fn(),
  };
}

// ─── Listener Registry ───

/**
 * Internal storage for captured SDK listener callbacks.
 * Maps listener type → (listener name → callback object).
 */
const listenerRegistry = new Map<string, Map<string, any>>();

/** Returns (or creates) the inner Map for a given listener type. */
function getOrCreateRegistry(type: string): Map<string, any> {
  if (!listenerRegistry.has(type)) {
    listenerRegistry.set(type, new Map());
  }
  return listenerRegistry.get(type)!;
}

/**
 * Retrieves a previously registered SDK listener callback.
 *
 * Use this in tests to simulate real-time events by invoking handler methods
 * on the returned callback object.
 *
 * @param type - The listener type
 * @param name - The listener name used during registration
 * @returns The callback object, or `undefined` if not registered
 *
 * @example
 * ```ts
 * const listener = getRegisteredListener('message', 'conversations_message_listener');
 * listener.onTextMessageReceived(createMockTextMessage({ text: 'Hello' }));
 * ```
 */
export function getRegisteredListener(
  type: 'message' | 'call' | 'user' | 'group' | 'connection' | 'login',
  name: string
): any | undefined {
  return listenerRegistry.get(type)?.get(name);
}

/**
 * Clears all captured listener registrations.
 * Call in `afterEach` to ensure clean state between tests.
 */
export function clearListenerRegistry(): void {
  listenerRegistry.clear();
}

// ─── SDKMockSpies Interface ───

/**
 * TypeScript interface for the return type of `installSDKMocks()`.
 * Every property is a Vitest `MockInstance` spy reference.
 */
export interface SDKMockSpies {
  // Auth & Init
  getLoggedinUser: MockInstance;
  getLoggedInUser: MockInstance;

  // Listener registration
  addMessageListener: MockInstance;
  addCallListener: MockInstance;
  addUserListener: MockInstance;
  addGroupListener: MockInstance;
  addConnectionListener: MockInstance;
  addLoginListener: MockInstance;

  // Listener removal
  removeMessageListener: MockInstance;
  removeCallListener: MockInstance;
  removeUserListener: MockInstance;
  removeGroupListener: MockInstance;
  removeConnectionListener: MockInstance;
  removeLoginListener: MockInstance;

  // Messaging
  sendMessage: MockInstance;
  sendMediaMessage: MockInstance;
  sendCustomMessage: MockInstance;
  sendInteractiveMessage: MockInstance;
  editMessage: MockInstance;
  deleteMessage: MockInstance;
  markAsRead: MockInstance;
  markAsDelivered: MockInstance;
  markConversationAsRead: MockInstance;
  markConversationAsDelivered: MockInstance;
  startTyping: MockInstance;
  endTyping: MockInstance;

  // Calls
  initiateCall: MockInstance;
  acceptCall: MockInstance;
  rejectCall: MockInstance;
  endCall: MockInstance;
  clearActiveCall: MockInstance;

  // Users
  getUser: MockInstance;
  blockUsers: MockInstance;
  unblockUsers: MockInstance;

  // Groups
  getGroup: MockInstance;
  joinGroup: MockInstance;
  leaveGroup: MockInstance;
  kickGroupMember: MockInstance;
  banGroupMember: MockInstance;
  unbanGroupMember: MockInstance;
  updateGroupMemberScope: MockInstance;
  transferGroupOwnership: MockInstance;
  createGroup: MockInstance;
  updateGroup: MockInstance;
  deleteGroup: MockInstance;

  // Conversations
  getConversation: MockInstance;
  deleteConversation: MockInstance;
  tagConversation: MockInstance;

  // Reactions
  addReaction: MockInstance;
  removeReaction: MockInstance;

  // AI Features
  getConversationStarter: MockInstance;
  getSmartReplies: MockInstance;
  getConversationSummary: MockInstance;
  askBot: MockInstance;
  isAIFeatureEnabled: MockInstance;
  isExtensionEnabled: MockInstance;
  callExtension: MockInstance;

  // Connection & Settings
  getConnectionStatus: MockInstance;
  getAppSettings: MockInstance;
  isFeatureEnabled: MockInstance;
  connect: MockInstance;
  disconnect: MockInstance;
  setSource: MockInstance;
  setDemoMetaInfo: MockInstance;
}

// ─── SDK Mock Setup ───

/**
 * Installs vi.spyOn mocks on commonly used CometChat static methods.
 *
 * Returns an object with references to each spy for assertions.
 * Call this in `beforeEach` and pair with `vi.restoreAllMocks()` in `afterEach`.
 */
export function installSDKMocks(): SDKMockSpies {
  // Clear listener registry for clean state
  clearListenerRegistry();

  const loggedInUser = createMockUser({ uid: 'logged-in-user', name: 'Logged In User' });

  return {
    // ── Auth & Init ──
    getLoggedinUser: vi.spyOn(CometChat as any, 'getLoggedinUser').mockResolvedValue(loggedInUser),
    getLoggedInUser: vi.spyOn(CometChat as any, 'getLoggedInUser').mockResolvedValue(loggedInUser),

    // ── Listener registration (capture callbacks) ──
    addMessageListener: vi
      .spyOn(CometChat as any, 'addMessageListener')
      .mockImplementation((...args: any[]) => {
        getOrCreateRegistry('message').set(args[0], args[1]);
      }),
    addCallListener: vi
      .spyOn(CometChat as any, 'addCallListener')
      .mockImplementation((...args: any[]) => {
        getOrCreateRegistry('call').set(args[0], args[1]);
      }),
    addUserListener: vi
      .spyOn(CometChat as any, 'addUserListener')
      .mockImplementation((...args: any[]) => {
        getOrCreateRegistry('user').set(args[0], args[1]);
      }),
    addGroupListener: vi
      .spyOn(CometChat as any, 'addGroupListener')
      .mockImplementation((...args: any[]) => {
        getOrCreateRegistry('group').set(args[0], args[1]);
      }),
    addConnectionListener: vi
      .spyOn(CometChat as any, 'addConnectionListener')
      .mockImplementation((...args: any[]) => {
        getOrCreateRegistry('connection').set(args[0], args[1]);
      }),
    addLoginListener: vi
      .spyOn(CometChat as any, 'addLoginListener')
      .mockImplementation((...args: any[]) => {
        getOrCreateRegistry('login').set(args[0], args[1]);
      }),

    // ── Listener removal (no-op spies) ──
    removeMessageListener: vi
      .spyOn(CometChat as any, 'removeMessageListener')
      .mockImplementation(() => {}),
    removeCallListener: vi
      .spyOn(CometChat as any, 'removeCallListener')
      .mockImplementation(() => {}),
    removeUserListener: vi
      .spyOn(CometChat as any, 'removeUserListener')
      .mockImplementation(() => {}),
    removeGroupListener: vi
      .spyOn(CometChat as any, 'removeGroupListener')
      .mockImplementation(() => {}),
    removeConnectionListener: vi
      .spyOn(CometChat as any, 'removeConnectionListener')
      .mockImplementation(() => {}),
    removeLoginListener: vi
      .spyOn(CometChat as any, 'removeLoginListener')
      .mockImplementation(() => {}),

    // ── Messaging ──
    sendMessage: vi
      .spyOn(CometChat as any, 'sendMessage')
      .mockImplementation(async (msg: any) => msg),
    sendMediaMessage: vi
      .spyOn(CometChat as any, 'sendMediaMessage')
      .mockImplementation(async (msg: any) => msg),
    sendCustomMessage: vi
      .spyOn(CometChat as any, 'sendCustomMessage')
      .mockImplementation(async (msg: any) => msg),
    sendInteractiveMessage: vi
      .spyOn(CometChat as any, 'sendInteractiveMessage')
      .mockImplementation(async (msg: any) => msg),
    editMessage: vi
      .spyOn(CometChat as any, 'editMessage')
      .mockResolvedValue(createMockTextMessage()),
    deleteMessage: vi
      .spyOn(CometChat as any, 'deleteMessage')
      .mockResolvedValue(createMockTextMessage()),
    markAsRead: vi.spyOn(CometChat as any, 'markAsRead').mockResolvedValue(undefined),
    markAsDelivered: vi.spyOn(CometChat as any, 'markAsDelivered').mockResolvedValue(undefined),
    markConversationAsRead: vi
      .spyOn(CometChat as any, 'markConversationAsRead')
      .mockResolvedValue(undefined),
    markConversationAsDelivered: vi
      .spyOn(CometChat as any, 'markConversationAsDelivered')
      .mockResolvedValue(undefined),
    startTyping: vi.spyOn(CometChat as any, 'startTyping').mockImplementation(() => {}),
    endTyping: vi.spyOn(CometChat as any, 'endTyping').mockImplementation(() => {}),

    // ── Calls ──
    initiateCall: vi
      .spyOn(CometChat as any, 'initiateCall')
      .mockImplementation(async (call: any) => call),
    acceptCall: vi.spyOn(CometChat as any, 'acceptCall').mockImplementation(async () => ({})),
    rejectCall: vi.spyOn(CometChat as any, 'rejectCall').mockImplementation(async () => ({})),
    endCall: vi.spyOn(CometChat as any, 'endCall').mockImplementation(async () => ({})),
    clearActiveCall: vi.spyOn(CometChat as any, 'clearActiveCall').mockImplementation(() => {}),

    // ── Users ──
    getUser: vi.spyOn(CometChat as any, 'getUser').mockResolvedValue(createMockUser()),
    blockUsers: vi.spyOn(CometChat as any, 'blockUsers').mockResolvedValue([]),
    unblockUsers: vi.spyOn(CometChat as any, 'unblockUsers').mockResolvedValue([]),

    // ── Groups ──
    getGroup: vi.spyOn(CometChat as any, 'getGroup').mockResolvedValue(createMockGroup()),
    joinGroup: vi.spyOn(CometChat as any, 'joinGroup').mockResolvedValue(createMockGroup()),
    leaveGroup: vi.spyOn(CometChat as any, 'leaveGroup').mockResolvedValue(true),
    kickGroupMember: vi.spyOn(CometChat as any, 'kickGroupMember').mockResolvedValue(true),
    banGroupMember: vi.spyOn(CometChat as any, 'banGroupMember').mockResolvedValue(true),
    unbanGroupMember: vi.spyOn(CometChat as any, 'unbanGroupMember').mockResolvedValue(true),
    updateGroupMemberScope: vi
      .spyOn(CometChat as any, 'updateGroupMemberScope')
      .mockResolvedValue(true),
    transferGroupOwnership: vi
      .spyOn(CometChat as any, 'transferGroupOwnership')
      .mockResolvedValue('success'),
    createGroup: vi.spyOn(CometChat as any, 'createGroup').mockResolvedValue(createMockGroup()),
    updateGroup: vi.spyOn(CometChat as any, 'updateGroup').mockResolvedValue(createMockGroup()),
    deleteGroup: vi.spyOn(CometChat as any, 'deleteGroup').mockResolvedValue(true),

    // ── Conversations ──
    getConversation: vi
      .spyOn(CometChat as any, 'getConversation')
      .mockResolvedValue(createMockConversation()),
    deleteConversation: vi
      .spyOn(CometChat as any, 'deleteConversation')
      .mockResolvedValue(undefined),
    tagConversation: vi.spyOn(CometChat as any, 'tagConversation').mockResolvedValue(undefined),

    // ── Reactions ──
    addReaction: vi
      .spyOn(CometChat as any, 'addReaction')
      .mockResolvedValue(createMockTextMessage()),
    removeReaction: vi
      .spyOn(CometChat as any, 'removeReaction')
      .mockResolvedValue(createMockTextMessage()),

    // ── AI Features ──
    getConversationStarter: vi
      .spyOn(CometChat as any, 'getConversationStarter')
      .mockResolvedValue([]),
    getSmartReplies: vi.spyOn(CometChat as any, 'getSmartReplies').mockResolvedValue({}),
    getConversationSummary: vi
      .spyOn(CometChat as any, 'getConversationSummary')
      .mockResolvedValue(''),
    askBot: vi.spyOn(CometChat as any, 'askBot').mockResolvedValue(''),
    isAIFeatureEnabled: vi.spyOn(CometChat as any, 'isAIFeatureEnabled').mockResolvedValue(false),
    isExtensionEnabled: vi.spyOn(CometChat as any, 'isExtensionEnabled').mockResolvedValue(false),
    callExtension: vi.spyOn(CometChat as any, 'callExtension').mockResolvedValue({}),

    // ── Connection & Settings ──
    getConnectionStatus: vi
      .spyOn(CometChat as any, 'getConnectionStatus')
      .mockReturnValue('connected'),
    getAppSettings: vi.spyOn(CometChat as any, 'getAppSettings').mockResolvedValue({}),
    isFeatureEnabled: vi.spyOn(CometChat as any, 'isFeatureEnabled').mockResolvedValue(true),
    connect: vi.spyOn(CometChat as any, 'connect').mockImplementation(() => {}),
    disconnect: vi.spyOn(CometChat as any, 'disconnect').mockImplementation(() => {}),
    setSource: vi.spyOn(CometChat as any, 'setSource').mockImplementation(() => {}),
    setDemoMetaInfo: vi.spyOn(CometChat as any, 'setDemoMetaInfo').mockImplementation(() => {}),
  };
}

// ─── Provider Arrays ───

/**
 * Mock providers for localization (TranslatePipe + CometChatLocalize).
 *
 * Overrides the real TranslatePipe with MockTranslatePipe and spies on
 * CometChatLocalize.getLocalizedString to return the key as-is.
 *
 * @example
 * ```ts
 * TestBed.configureTestingModule({
 *   imports: [MyComponent],
 *   providers: [...MOCK_LOCALIZE_PROVIDERS],
 * });
 * ```
 */
export const MOCK_LOCALIZE_PROVIDERS: Provider[] = [
  { provide: TranslatePipe, useClass: MockTranslatePipe },
];

/**
 * Mock providers for ChatStateService and its ConversationsService dependency.
 *
 * Provides a fully controllable mock ChatStateService with signal-based state
 * and vi.fn() spies on all methods.
 *
 * @example
 * ```ts
 * TestBed.configureTestingModule({
 *   providers: [...MOCK_CHAT_STATE_PROVIDERS],
 * });
 * const chatState = TestBed.inject(ChatStateService) as unknown as MockChatStateServiceType;
 * chatState.setActiveUser(createMockUser());
 * ```
 */
export const MOCK_CHAT_STATE_PROVIDERS: Provider[] = [
  { provide: ConversationsService, useFactory: createMockConversationsService },
  { provide: ChatStateService, useFactory: createMockChatStateService },
];

/**
 * Mock providers for CometChat SDK static method calls.
 *
 * Unlike the other provider arrays, SDK mocks work via vi.spyOn on the
 * CometChat static class. This provider array installs the spies and
 * provides a token to access them.
 *
 * Since CometChat SDK methods are static (not injectable), this array
 * provides a factory that installs spies. Use `installSDKMocks()` directly
 * in `beforeEach` for more control, or spread this array for convenience.
 *
 * @example
 * ```ts
 * // Option 1: Use the provider array (auto-installs mocks)
 * TestBed.configureTestingModule({
 *   providers: [...MOCK_SDK_PROVIDERS],
 * });
 *
 * // Option 2: Use installSDKMocks() directly for spy references
 * let sdkMocks: ReturnType<typeof installSDKMocks>;
 * beforeEach(() => { sdkMocks = installSDKMocks(); });
 * afterEach(() => { vi.restoreAllMocks(); });
 * ```
 */
export const MOCK_SDK_PROVIDERS: Provider[] = [
  {
    provide: 'COMETCHAT_SDK_MOCKS',
    useFactory: () => installSDKMocks(),
  },
];

/**
 * Convenience: all mock providers combined.
 *
 * Includes localization, chat state, and SDK mocks.
 */
export const ALL_MOCK_PROVIDERS: Provider[] = [
  ...MOCK_LOCALIZE_PROVIDERS,
  ...MOCK_CHAT_STATE_PROVIDERS,
  ...MOCK_SDK_PROVIDERS,
];

/**
 * Sets up CometChatLocalize.getLocalizedString to return the key as-is.
 *
 * Call this in `beforeEach` when testing components that use
 * CometChatLocalize directly (not via the TranslatePipe).
 *
 * @returns A spy on CometChatLocalize.getLocalizedString
 */
export function mockCometChatLocalize() {
  return vi.spyOn(CometChatLocalize, 'getLocalizedString').mockImplementation((key: string) => key);
}
