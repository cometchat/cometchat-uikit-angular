/**
 * CometChat UIKit Testing Utilities
 *
 * Barrel export for mock SDK infrastructure, test helpers,
 * and accessibility utilities used across the UIKit test suite.
 *
 * @example
 * ```typescript
 * import {
 *   createMockUser,
 *   createMockGroup,
 *   createMockTextMessage,
 *   installSDKMocks,
 *   ALL_MOCK_PROVIDERS,
 *   getRegisteredListener,
 *   clearListenerRegistry,
 *   flushPromises,
 * } from '../../testing';
 * ```
 */

// Core mock factories (User, Group, Conversation, TextMessage, MediaMessage, Call, GroupMember, SDKError)
export * from './mock-sdk';

// Specialized message factories (file, audio, video, image, poll, sticker, collab doc/whiteboard, action, deleted, call)
export * from './mock-messages';

// List factories (UserList, GroupList, ConversationList, GroupMemberList)
export * from './mock-users-groups';

// Request builder mocks (Conversations, Users, Groups, Messages, GroupMembers, Reactions)
export * from './mock-builders';

// SDK mock installation, listener registry, provider arrays, MockTranslatePipe, ChatStateService mock
export * from './mock-providers';

// DOM interaction utilities (flushPromises, triggerInput, triggerKeydown, waitForAsync)
export * from './test-helpers';

// Accessibility testing helpers
export * from './accessibility-test-utils';

// Mock-only SDK session management (ensureSdkReady, sdkCleanup, fetchTestUser, etc.)
export * from '../test-setup';
