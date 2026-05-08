/**
 * Mock Message Object Factories
 *
 * Centralized factories for creating mock message objects of every type used
 * across the CometChat Angular V5 UIKit. Re-exports from split files for
 * backward compatibility.
 *
 * @module testing/mock-messages
 * _Requirements: 15.5, 3.1_
 */

// Re-export text/action/delete message factories
export {
  createMockTextMessage,
  createMockCall,
  CUSTOM_MESSAGE_TYPES,
  resetCustomMessageIdCounter,
  createMockPollMessage,
  createMockActionMessage,
  createMockDeletedMessage,
  createMockCallMessage,
} from './mock-messages-text';

// Re-export media message factories
export {
  createMockMediaMessage,
  createMockFileMessage,
  createMockAudioMessage,
  createMockVideoMessage,
  createMockImageMessage,
  createMockStickerMessage,
  createMockCollaborativeDocumentMessage,
  createMockCollaborativeWhiteboardMessage,
} from './mock-messages-media';
