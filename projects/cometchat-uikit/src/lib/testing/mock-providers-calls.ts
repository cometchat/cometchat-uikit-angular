/**
 * Mock SDK Call Providers for Testing
 *
 * Provides installSDKMocks() and related utilities for mocking CometChat SDK
 * static methods in tests.
 *
 * @module testing/mock-providers-calls
 * _Requirements: 15.5_
 */

import { Provider } from '@angular/core';
import { vi } from 'vitest';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { MockInstance } from 'vitest';

import {
  createMockUser,
  createMockGroup,
  createMockConversation,
  createMockTextMessage,
} from './mock-sdk';

// ─── Listener Registry ───

/**
 * Internal storage for captured SDK listener callbacks.
 */
const listenerRegistry = new Map<string, Map<string, any>>();

function getOrCreateRegistry(type: string): Map<string, any> {
  if (!listenerRegistry.has(type)) {
    listenerRegistry.set(type, new Map());
  }
  return listenerRegistry.get(type)!;
}

/**
 * Retrieves a previously registered SDK listener callback.
 */
export function getRegisteredListener(
  type: 'message' | 'call' | 'user' | 'group' | 'connection' | 'login',
  name: string
): any | undefined {
  return listenerRegistry.get(type)?.get(name);
}

/**
 * Clears all captured listener registrations.
 */
export function clearListenerRegistry(): void {
  listenerRegistry.clear();
}

// ─── SDKMockSpies Interface ───

/**
 * TypeScript interface for the return type of `installSDKMocks()`.
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
 */
export function installSDKMocks(): SDKMockSpies {
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
 * Mock providers for CometChat SDK static method calls.
 */
export const MOCK_SDK_PROVIDERS: Provider[] = [
  {
    provide: 'COMETCHAT_SDK_MOCKS',
    useFactory: () => installSDKMocks(),
  },
];
