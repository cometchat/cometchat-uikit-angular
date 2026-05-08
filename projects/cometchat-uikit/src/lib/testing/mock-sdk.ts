/**
 * CometChat SDK Mock Factories
 *
 * Centralized mock factories for CometChat SDK objects used across the test suite.
 * Re-exports from split files for backward compatibility.
 *
 * @module testing/mock-sdk
 * _Requirements: 15.5_
 */

// Re-export user/message factories
export {
  resetMockMessageIdCounter,
  createMockUser,
  createMockGroupMember,
  createMockTextMessage,
  createMockMediaMessage,
  createMockSDKError,
  mockSDKReject,
} from './mock-sdk-user';

// Re-export group/conversation/call factories
export {
  createMockGroup,
  createMockConversation,
  createMockCall,
} from './mock-sdk-group';
