/**
 * Shared Test Setup — Mock-Only SDK Session Management
 *
 * Provides mock SDK initialization, login/logout, and helper functions
 * that return mock SDK objects for use across all spec files.
 * NO real SDK calls are made — everything uses mock factories.
 *
 * @module test-setup
 *
 * Usage:
 * ```ts
 * import { ensureSdkReady, sdkCleanup, fetchTestUser } from '../../test-setup';
 *
 * beforeAll(async () => { await ensureSdkReady(); });
 * afterAll(async () => { await sdkCleanup(); });
 * ```
 */

import { CometChat } from '@cometchat/chat-sdk-javascript';

// ---------------------------------------------------------------------------
// Module-level state
// ---------------------------------------------------------------------------

let loggedInUser: CometChat.User | null = null;

// ---------------------------------------------------------------------------
// Cache — avoids redundant object creation across tests
// ---------------------------------------------------------------------------

const userCache = new Map<string, CometChat.User>();
const groupCache = new Map<string, CometChat.Group>();
let conversationCache: CometChat.Conversation[] | null = null;

// ---------------------------------------------------------------------------
// Mock factories — create real SDK class instances with mock data
// ---------------------------------------------------------------------------

function createMockUser(uid: string): CometChat.User {
  const user = new CometChat.User(uid);
  user.setName(`MockUser_${uid}`);
  user.setAvatar(`https://example.com/avatar-${uid}.png`);
  user.setStatus(CometChat.USER_STATUS.ONLINE);
  user.setRole('default');
  user.setStatusMessage('');
  return user;
}

function createMockGroup(guid: string): CometChat.Group {
  const group = new CometChat.Group(guid, `MockGroup_${guid}`, CometChat.GROUP_TYPE.PUBLIC);
  group.setIcon(`https://example.com/group-${guid}.png`);
  group.setDescription('');
  group.setOwner('superhero1');
  group.setMembersCount(5);
  group.setScope(CometChat.GROUP_MEMBER_SCOPE.ADMIN);
  group.setHasJoined(true);
  group.setCreatedAt(Math.floor(Date.now() / 1000));
  group.setUpdatedAt(Math.floor(Date.now() / 1000));
  return group;
}

function createMockConversation(): CometChat.Conversation {
  const conversationWith = createMockUser('superhero2');
  const lastMessage = new CometChat.TextMessage(
    'superhero2',
    'Hello',
    CometChat.RECEIVER_TYPE.USER
  );
  lastMessage.setId(1);
  lastMessage.setSender(createMockUser('superhero1'));
  lastMessage.setSentAt(Math.floor(Date.now() / 1000));

  const conversation = new CometChat.Conversation(
    'superhero2',
    CometChat.RECEIVER_TYPE.USER,
    lastMessage,
    conversationWith as any,
    0,
    [],
    0,
    '',
    ''
  );

  return conversation as unknown as CometChat.Conversation;
}

// ---------------------------------------------------------------------------
// SDK Session Management (Mock-Only)
// ---------------------------------------------------------------------------

/**
 * Mock SDK initialization. No real SDK calls are made.
 * Returns a mock logged-in user immediately.
 *
 * @returns The mock CometChat.User for the test session
 */
export async function ensureSdkReady(): Promise<CometChat.User> {
  if (loggedInUser) {
    return loggedInUser;
  }

  loggedInUser = createMockUser('superhero1');
  return loggedInUser;
}

/**
 * Always returns true — we are always in "offline" (mock) mode.
 */
export function isOfflineMode(): boolean {
  return true;
}

/**
 * Clears mock session state. No real SDK logout is performed.
 */
export async function sdkCleanup(): Promise<void> {
  loggedInUser = null;
  userCache.clear();
  groupCache.clear();
  conversationCache = null;
}

// ---------------------------------------------------------------------------
// Accessor
// ---------------------------------------------------------------------------

/**
 * Returns the currently logged-in mock user, or null if not yet set.
 */
export function getLoggedInUser(): CometChat.User | null {
  return loggedInUser;
}

// ---------------------------------------------------------------------------
// Data Helpers (mock-only, with caching)
// ---------------------------------------------------------------------------

/**
 * Returns a mock CometChat.User by UID. Results are cached per UID.
 */
export async function fetchTestUser(uid: string): Promise<CometChat.User> {
  const cached = userCache.get(uid);
  if (cached) {
    return cached;
  }

  const user = createMockUser(uid);
  userCache.set(uid, user);
  return user;
}

/**
 * Returns a mock CometChat.Group by GUID. Results are cached per GUID.
 */
export async function fetchTestGroup(guid: string): Promise<CometChat.Group> {
  const cached = groupCache.get(guid);
  if (cached) {
    return cached;
  }

  const group = createMockGroup(guid);
  groupCache.set(guid, group);
  return group;
}

/**
 * Returns a list of mock conversations.
 */
export async function fetchTestConversation(): Promise<CometChat.Conversation[]> {
  if (conversationCache) {
    return conversationCache;
  }

  conversationCache = [createMockConversation()];
  return conversationCache;
}

// ---------------------------------------------------------------------------
// Cache utilities
// ---------------------------------------------------------------------------

/** Clears only the in-memory caches without affecting the session state. */
export function clearTestCaches(): void {
  userCache.clear();
  groupCache.clear();
  conversationCache = null;
}
