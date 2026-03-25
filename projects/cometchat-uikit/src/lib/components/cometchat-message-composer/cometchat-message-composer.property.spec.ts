import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Property-Based Tests for CometChatMessageComposer Component
 *
 * These tests verify universal properties that should hold across all inputs,
 * using fast-check for property-based testing.
 *
 * Since the CometChatMessageComposer component uses Angular's inject() function
 * and complex service dependencies, we test the component logic as pure functions
 * that mirror the component's behavior.
 *
 * Properties tested:
 * - Property 1: Message Recipient Correctness (Requirements 2.3, 2.4)
 * - Property 4: Send Button State Consistency (Requirements 4.9)
 * - Property 7: Attachment Count Limit Enforcement (Requirements 6.3)
 * - Property 10: File Size Validation (Requirements 9.4)
 * - Property 11: Emoji Insertion at Cursor (Requirements 10.3)
 * - Property 16: URL Pattern Detection (Requirements 23.2)
 * - Property 17: Mention Pattern Detection (Requirements 22.2)
 */

// ==================== Mock Types ====================

/**
 * Mock CometChat User class
 */
class MockUser {
  constructor(
    private uid: string,
    private name = 'Test User'
  ) {}

  getUid(): string {
    return this.uid;
  }

  getName(): string {
    return this.name;
  }
}

/**
 * Mock CometChat Group class
 */
class MockGroup {
  constructor(
    private guid: string,
    private name = 'Test Group'
  ) {}

  getGuid(): string {
    return this.guid;
  }

  getName(): string {
    return this.name;
  }
}

/**
 * Mock CometChat GroupMember class
 */
class MockGroupMember {
  constructor(
    private uid: string,
    private name = 'Test Member'
  ) {}

  getUid(): string {
    return this.uid;
  }

  getName(): string {
    return this.name;
  }
}

/**
 * Interface representing mention metadata extracted from text.
 * Mirrors the MentionData interface from CometChatMentionsFormatter.
 */
interface MockMentionData {
  /** The unique identifier of the mentioned user */
  uid: string;
  /** The display name of the mentioned user */
  name: string;
  /** The starting index of the mention in the original text */
  startIndex: number;
  /** The ending index of the mention in the original text (exclusive) */
  endIndex: number;
}

/**
 * Mock message interface for mention metadata testing.
 * Simulates a message with mentionedUsers array in metadata.
 */
interface MockMentionMessage {
  getText: () => string;
  getMentionedUsers: () => { uid: string; name: string }[];
  setMentionedUsers: (users: { uid: string; name: string }[]) => void;
}

/**
 * Mock message interface for formatter pipeline testing
 * Simulates a message with getText/setText methods
 */
interface MockFormatterMessage {
  getText: () => string;
  setText: (text: string) => void;
}

/**
 * Creates a mock message for formatter testing
 */
function createMockFormatterMessage(initialText: string): MockFormatterMessage {
  let text = initialText;
  return {
    getText: () => text,
    setText: (newText: string) => {
      text = newText;
    },
  };
}

/**
 * Mock text formatter for testing pipeline
 * Each formatter applies a transformation function to the message text
 */
class MockTextFormatter {
  private transformFn: (text: string) => string;
  private callCount = 0;
  private lastInputText = '';

  constructor(transformFn: (text: string) => string) {
    this.transformFn = transformFn;
  }

  formatMessageForSending<T extends MockFormatterMessage>(message: T): T {
    this.lastInputText = message.getText();
    this.callCount++;
    const currentText = message.getText();
    message.setText(this.transformFn(currentText));
    return message;
  }

  getCallCount(): number {
    return this.callCount;
  }

  getLastInputText(): string {
    return this.lastInputText;
  }

  reset(): void {
    this.callCount = 0;
    this.lastInputText = '';
  }
}

/**
 * Mock attachment file interface
 */
interface MockAttachmentFile {
  id: string;
  file: File;
  type: 'image' | 'video' | 'audio' | 'file';
  name: string;
  size: number;
  uploadProgress: number;
  status: 'pending' | 'uploading' | 'uploaded' | 'error';
}

/**
 * Mock CometChat TextMessage class for edit mode testing
 */
class MockTextMessage {
  constructor(
    private id: number,
    private text: string,
    private senderId = 'sender-123'
  ) {}

  getId(): number {
    return this.id;
  }

  getText(): string {
    return this.text;
  }

  getSender(): { getUid: () => string; getName: () => string } {
    return {
      getUid: () => this.senderId,
      getName: () => 'Test Sender',
    };
  }
}

/**
 * Edit mode exit status types
 */
type EditModeExitStatus = 'success' | 'cancelled' | 'error';

/**
 * Edit mode state interface for testing
 */
interface EditModeState {
  messageToEdit: MockTextMessage | null;
  editorContent: string;
  originalTextBeforeEdit: string;
}

// ==================== Pure Functions (Mirror Component Logic) ====================

/**
 * Determines the receiver ID from a user or group.
 * Mirrors the component's logic for extracting receiver ID.
 *
 * @param receiver - User or Group object
 * @returns The receiver ID (uid for users, guid for groups)
 */
function getReceiverId(receiver: MockUser | MockGroup): string {
  if (receiver instanceof MockUser) {
    return receiver.getUid();
  }
  return receiver.getGuid();
}

/**
 * Determines the receiver type from a user or group.
 * Mirrors the component's logic for determining receiver type.
 *
 * @param receiver - User or Group object
 * @returns 'user' or 'group'
 */
function getReceiverType(receiver: MockUser | MockGroup): 'user' | 'group' {
  return receiver instanceof MockUser ? 'user' : 'group';
}

/**
 * Determines if the send button should be enabled.
 * Mirrors the component's canSend computed property.
 *
 * **Property 4: Send Button State Consistency**
 * **Validates: Requirements 4.9**
 *
 * @param text - The composer text
 * @param attachments - Array of attachments
 * @returns true if send button should be enabled
 */
function canSend(text: string, attachments: MockAttachmentFile[]): boolean {
  return text.trim().length > 0 || attachments.length > 0;
}

/**
 * Determines if more attachments can be added.
 * Mirrors the component's canAddMoreAttachments computed property.
 *
 * **Property 7: Attachment Count Limit Enforcement**
 * **Validates: Requirements 6.3**
 *
 * @param currentCount - Current number of attachments
 * @param maxAttachments - Maximum allowed attachments
 * @returns true if more attachments can be added
 */
function canAddMoreAttachments(currentCount: number, maxAttachments: number): boolean {
  return currentCount < maxAttachments;
}

/**
 * Validates file size against maximum allowed size.
 * Mirrors the component's file size validation logic.
 *
 * **Property 10: File Size Validation**
 * **Validates: Requirements 9.4**
 *
 * @param fileSize - Size of the file in bytes
 * @param maxFileSize - Maximum allowed file size in bytes (undefined means no limit)
 * @returns true if file size is valid
 */
function isFileSizeValid(fileSize: number, maxFileSize: number | undefined): boolean {
  if (maxFileSize === undefined) {
    return true;
  }
  return fileSize <= maxFileSize;
}

/**
 * Inserts text at a specific cursor position.
 * Mirrors the component's insertTextAtCursor method.
 *
 * **Property 11: Emoji Insertion at Cursor**
 * **Validates: Requirements 10.3**
 *
 * @param currentText - The current text
 * @param textToInsert - Text to insert (e.g., emoji)
 * @param cursorPosition - Position to insert at
 * @returns Object with new text and new cursor position
 */
function insertTextAtCursor(
  currentText: string,
  textToInsert: string,
  cursorPosition: number
): { newText: string; newCursorPosition: number } {
  // Clamp cursor position to valid range
  const safePosition = Math.min(Math.max(0, cursorPosition), currentText.length);

  const textBefore = currentText.substring(0, safePosition);
  const textAfter = currentText.substring(safePosition);
  const newText = textBefore + textToInsert + textAfter;

  return {
    newText,
    newCursorPosition: safePosition + textToInsert.length,
  };
}

/**
 * Detects URLs in text using the URL formatter regex.
 * Mirrors the CometChatUrlFormatter's detection logic.
 *
 * **Property 16: URL Pattern Detection**
 * **Validates: Requirements 23.2**
 *
 * @param text - Text to search for URLs
 * @returns Array of detected URLs
 */
function detectUrls(text: string): string[] {
  const regex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/gi;
  const urls: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    urls.push(match[0]);
  }

  return urls;
}

/**
 * Detects @mentions in text using the mentions formatter regex.
 * Mirrors the CometChatMentionsFormatter's detection logic.
 *
 * **Property 17: Mention Pattern Detection**
 * **Validates: Requirements 22.2**
 *
 * @param text - Text to search for mentions
 * @returns Array of detected mention usernames (without @)
 */
function detectMentions(text: string): string[] {
  const regex = /@(\w+)/g;
  const mentions: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    mentions.push(match[1]); // Capture group 1 (username without @)
  }

  return mentions;
}

/**
 * Extracts mention metadata from text given a set of available users.
 * Mirrors the CometChatMentionsFormatter's format() method logic.
 *
 * **Property 6: Mention Metadata Extraction**
 * **Validates: Requirements 4.5, 4.6, 4.7**
 *
 * For any message containing @mentions that is sent, the sent message should
 * include a mentionedUsers array in metadata containing all mentioned users
 * with their uid and name.
 *
 * @param text - Text to search for mentions
 * @param availableUsers - Map of lowercase username to user object
 * @param enableAllMention - Whether @all mentions are enabled
 * @param allMentionLabel - Label for @all mention (default: 'all')
 * @returns Array of MentionData objects containing mention metadata
 */
function extractMentionMetadata(
  text: string,
  availableUsers: Map<string, { uid: string; name: string }>,
  enableAllMention = true,
  allMentionLabel = 'all'
): MockMentionData[] {
  const mentions: MockMentionData[] = [];
  const regex = /@(\w+)/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const fullMatch = match[0]; // e.g., "@john"
    const username = match[1]; // e.g., "john"
    const matchStartIndex = match.index;
    const matchEndIndex = matchStartIndex + fullMatch.length;

    // Check if this is an @all mention
    if (enableAllMention && username.toLowerCase() === allMentionLabel.toLowerCase()) {
      mentions.push({
        uid: 'all',
        name: allMentionLabel,
        startIndex: matchStartIndex,
        endIndex: matchEndIndex,
      });
    } else {
      // Try to match against available users
      const user = availableUsers.get(username.toLowerCase());

      if (user) {
        mentions.push({
          uid: user.uid,
          name: user.name,
          startIndex: matchStartIndex,
          endIndex: matchEndIndex,
        });
      }
    }
  }

  return mentions;
}

/**
 * Creates a mock message with mention metadata for testing.
 * Simulates how the component builds message metadata with mentions.
 *
 * @param text - The message text
 * @param mentions - Array of mention metadata to include
 * @returns Mock message object with mentionedUsers
 */
function createMockMentionMessage(text: string, mentions: MockMentionData[]): MockMentionMessage {
  let mentionedUsers: { uid: string; name: string }[] = mentions.map(m => ({
    uid: m.uid,
    name: m.name,
  }));

  return {
    getText: () => text,
    getMentionedUsers: () => mentionedUsers,
    setMentionedUsers: (users: { uid: string; name: string }[]) => {
      mentionedUsers = users;
    },
  };
}

/**
 * Validates that mention metadata correctly represents all mentions in text.
 * Used to verify the mention extraction invariant.
 *
 * @param text - The original text with mentions
 * @param mentionedUsers - The extracted mention metadata
 * @param availableUsers - Map of available users for matching
 * @param enableAllMention - Whether @all mentions are enabled
 * @param allMentionLabel - Label for @all mention
 * @returns true if all matched mentions are correctly represented
 */
function validateMentionMetadata(
  text: string,
  mentionedUsers: { uid: string; name: string }[],
  availableUsers: Map<string, { uid: string; name: string }>,
  enableAllMention: boolean,
  allMentionLabel: string
): boolean {
  const expectedMentions = extractMentionMetadata(
    text,
    availableUsers,
    enableAllMention,
    allMentionLabel
  );

  // Check count matches
  if (mentionedUsers.length !== expectedMentions.length) {
    return false;
  }

  // Check each expected mention is present in mentionedUsers
  for (const expected of expectedMentions) {
    const found = mentionedUsers.some(m => m.uid === expected.uid && m.name === expected.name);
    if (!found) {
      return false;
    }
  }

  return true;
}

/**
 * Enters edit mode with a message.
 * Mirrors the component's enterEditMode method.
 *
 * @param state - Current edit mode state
 * @param message - The message to edit
 * @returns New edit mode state after entering edit mode
 */
function enterEditMode(state: EditModeState, message: MockTextMessage): EditModeState {
  return {
    messageToEdit: message,
    editorContent: message.getText(),
    originalTextBeforeEdit: state.editorContent,
  };
}

/**
 * Exits edit mode and cleans up state.
 * Mirrors the component's exitEditMode/exitEditModeWithoutEvent/cancelEdit methods.
 *
 * **Property 5: Edit Mode Cleanup**
 * **Validates: Requirements 3.10**
 *
 * For any exit from edit mode (success, cancel, or error), the editor should be
 * cleared and the messageToEdit state should be reset to null.
 *
 * @param state - Current edit mode state
 * @param exitStatus - The reason for exiting edit mode
 * @returns New edit mode state after cleanup
 */
function exitEditMode(state: EditModeState, exitStatus: EditModeExitStatus): EditModeState {
  // On cancel, restore original text; on success/error, clear the editor
  const newEditorContent = exitStatus === 'cancelled' ? state.originalTextBeforeEdit : '';

  return {
    messageToEdit: null,
    editorContent: newEditorContent,
    originalTextBeforeEdit: '',
  };
}

/**
 * Checks if edit mode state is properly cleaned up.
 * Used to verify the cleanup invariant.
 *
 * @param state - Edit mode state to check
 * @returns true if state is properly cleaned up
 */
function isEditModeCleanedUp(state: EditModeState): boolean {
  return state.messageToEdit === null && state.originalTextBeforeEdit === '';
}

/**
 * Applies text formatters to a message in pipeline order.
 * Mirrors the component's applyTextFormatters method.
 *
 * **Property 8: Text Formatter Pipeline Application**
 * **Validates: Requirements 5.2, 5.10**
 *
 * For any message being sent with a non-empty textFormatters array, each formatter's
 * formatMessageForSending method should be called in order, with the output of one
 * formatter being the input to the next.
 *
 * @param message - The message to format
 * @param formatters - Array of text formatters to apply
 * @returns The formatted message after all formatters have been applied
 */
function applyTextFormatters<T extends MockFormatterMessage>(
  message: T,
  formatters: MockTextFormatter[]
): T {
  let formattedMessage = message;

  for (const formatter of formatters) {
    // Apply formatMessageForSending if the method exists
    if (typeof formatter.formatMessageForSending === 'function') {
      formattedMessage = formatter.formatMessageForSending(formattedMessage);
    }
  }

  return formattedMessage;
}

// ==================== Test Generators ====================

/**
 * Generator for random user objects with valid UIDs
 */
const userGenerator = (): fc.Arbitrary<MockUser> =>
  fc
    .record({
      uid: fc
        .string({ minLength: 1, maxLength: 50 })
        .filter(s => s.trim().length > 0 && /^[\w-]+$/.test(s)),
      name: fc.string({ minLength: 1, maxLength: 100 }),
    })
    .map(({ uid, name }) => new MockUser(uid, name));

/**
 * Generator for random group objects with valid GUIDs
 */
const groupGenerator = (): fc.Arbitrary<MockGroup> =>
  fc
    .record({
      guid: fc
        .string({ minLength: 1, maxLength: 50 })
        .filter(s => s.trim().length > 0 && /^[\w-]+$/.test(s)),
      name: fc.string({ minLength: 1, maxLength: 100 }),
    })
    .map(({ guid, name }) => new MockGroup(guid, name));

/**
 * Generator for random text content (may be empty or whitespace)
 */
const textGenerator = (): fc.Arbitrary<string> => fc.string({ minLength: 0, maxLength: 500 });

/**
 * Generator for non-empty text content
 */
const nonEmptyTextGenerator = (): fc.Arbitrary<string> =>
  fc.string({ minLength: 1, maxLength: 500 }).filter(s => s.trim().length > 0);

/**
 * Generator for whitespace-only text
 */
const whitespaceTextGenerator = (): fc.Arbitrary<string> =>
  fc
    .array(fc.constantFrom(' ', '\t', '\n', '\r'), { minLength: 0, maxLength: 20 })
    .map(chars => chars.join(''));

/**
 * Generator for mock attachment files
 */
const attachmentGenerator = (): fc.Arbitrary<MockAttachmentFile> =>
  fc
    .record({
      id: fc.uuid(),
      name: fc.string({ minLength: 1, maxLength: 50 }),
      size: fc.integer({ min: 1, max: 100000000 }),
      type: fc.constantFrom('image', 'video', 'audio', 'file') as fc.Arbitrary<
        'image' | 'video' | 'audio' | 'file'
      >,
    })
    .map(({ id, name, size, type }) => ({
      id,
      file: new File(['test'], name, { type: 'application/octet-stream' }),
      type,
      name,
      size,
      uploadProgress: 0,
      status: 'pending' as const,
    }));

/**
 * Generator for emoji characters
 */
const emojiGenerator = (): fc.Arbitrary<string> =>
  fc.constantFrom(
    '😀',
    '😂',
    '❤️',
    '👍',
    '🎉',
    '🔥',
    '✨',
    '🙏',
    '💯',
    '🤔',
    '😊',
    '🥳',
    '👏',
    '💪',
    '🌟'
  );

/**
 * Generator for valid URLs
 */
const urlGenerator = (): fc.Arbitrary<string> =>
  fc.oneof(
    fc.webUrl(),
    fc.string({ minLength: 3, maxLength: 30 }).map(s => `www.${s.replace(/[^a-zA-Z0-9]/g, '')}.com`)
  );

/**
 * Generator for valid mention usernames (word characters only)
 */
const mentionUsernameGenerator = (): fc.Arbitrary<string> =>
  fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^\w+$/.test(s));

/**
 * Generator for mock user objects with uid and name for mention testing
 */
const mentionUserGenerator = (): fc.Arbitrary<{ uid: string; name: string }> =>
  fc
    .record({
      uid: fc
        .string({ minLength: 1, maxLength: 30 })
        .filter(s => s.trim().length > 0 && /^[\w-]+$/.test(s)),
      name: mentionUsernameGenerator(),
    })
    .map(({ uid, name }) => ({ uid, name }));

/**
 * Generator for arrays of mention users with unique names
 */
const mentionUsersArrayGenerator = (
  minLength = 1,
  maxLength = 5
): fc.Arbitrary<{ uid: string; name: string }[]> =>
  fc
    .array(mentionUserGenerator(), { minLength, maxLength })
    .map(users => {
      // Ensure unique names (case-insensitive)
      const seen = new Set<string>();
      return users.filter(user => {
        const lowerName = user.name.toLowerCase();
        if (seen.has(lowerName)) {
          return false;
        }
        seen.add(lowerName);
        return true;
      });
    })
    .filter(users => users.length >= minLength);

/**
 * Generator for text containing @mentions of specific users
 */
const textWithMentionsGenerator = (
  users: { uid: string; name: string }[]
): fc.Arbitrary<string> => {
  if (users.length === 0) {
    return fc.string({ minLength: 0, maxLength: 100 }).filter(s => !s.includes('@'));
  }

  return fc
    .array(fc.integer({ min: 0, max: users.length - 1 }), { minLength: 1, maxLength: users.length })
    .chain(indices => {
      // Get unique indices to avoid duplicate mentions
      const uniqueIndices = [...new Set(indices)];
      const mentionedUsers = uniqueIndices.map(i => users[i]);

      return fc
        .array(
          fc.string({ minLength: 0, maxLength: 20 }).filter(s => !s.includes('@')),
          {
            minLength: mentionedUsers.length + 1,
            maxLength: mentionedUsers.length + 1,
          }
        )
        .map(textParts => {
          // Interleave text parts with mentions
          let result = textParts[0];
          for (let i = 0; i < mentionedUsers.length; i++) {
            result += ` @${mentionedUsers[i].name} ${textParts[i + 1]}`;
          }
          return result.trim();
        });
    });
};

/**
 * Generator for @all mention label
 */
const allMentionLabelGenerator = (): fc.Arbitrary<string> =>
  fc.constantFrom('all', 'everyone', 'channel', 'here');

/**
 * Generator for mock TextMessage objects
 */
const textMessageGenerator = (): fc.Arbitrary<MockTextMessage> =>
  fc
    .record({
      id: fc.integer({ min: 1, max: 1000000 }),
      text: fc.string({ minLength: 1, maxLength: 500 }),
      senderId: fc
        .string({ minLength: 1, maxLength: 50 })
        .filter(s => s.trim().length > 0 && /^[\w-]+$/.test(s)),
    })
    .map(({ id, text, senderId }) => new MockTextMessage(id, text, senderId));

/**
 * Generator for edit mode exit status
 */
const editModeExitStatusGenerator = (): fc.Arbitrary<EditModeExitStatus> =>
  fc.constantFrom('success', 'cancelled', 'error');

/**
 * Generator for initial edit mode state (before entering edit mode)
 */
const initialEditModeStateGenerator = (): fc.Arbitrary<EditModeState> =>
  fc
    .record({
      editorContent: fc.string({ minLength: 0, maxLength: 200 }),
    })
    .map(({ editorContent }) => ({
      messageToEdit: null,
      editorContent,
      originalTextBeforeEdit: '',
    }));

/**
 * Generator for text transformation functions
 * Creates simple, deterministic transformations for testing
 */
const textTransformGenerator = (): fc.Arbitrary<(text: string) => string> =>
  fc.constantFrom(
    (text: string) => text.toUpperCase(),
    (text: string) => text.toLowerCase(),
    (text: string) => `[${text}]`,
    (text: string) => `${text}!`,
    (text: string) => text.trim(),
    (text: string) => `prefix_${text}`,
    (text: string) => `${text}_suffix`,
    (text: string) => text.replace(/\s+/g, '_'),
    (text: string) => `<${text}>`,
    (text: string) => `(${text})`
  );

/**
 * Generator for mock text formatters with tracking
 */
const mockTextFormatterGenerator = (): fc.Arbitrary<MockTextFormatter> =>
  textTransformGenerator().map(transformFn => new MockTextFormatter(transformFn));

/**
 * Generator for arrays of mock text formatters
 */
const formatterArrayGenerator = (minLength = 0, maxLength = 5): fc.Arbitrary<MockTextFormatter[]> =>
  fc.array(mockTextFormatterGenerator(), { minLength, maxLength });

// ==================== Property Tests ====================

describe('CometChatMessageComposer Property Tests', () => {
  /**
   * **Property 1: Message Recipient Correctness**
   *
   * *For any* valid user or group provided as input, when a message is sent,
   * the message SHALL be addressed to that exact recipient (matching UID for users,
   * GUID for groups).
   *
   * **Validates: Requirements 2.3, 2.4**
   */
  describe('Property 1: Message Recipient Correctness', () => {
    it('should correctly extract receiver ID from any valid user', () => {
      fc.assert(
        fc.property(userGenerator(), user => {
          const receiverId = getReceiverId(user);
          const receiverType = getReceiverType(user);

          // Receiver ID should match user's UID
          expect(receiverId).toBe(user.getUid());
          // Receiver type should be 'user'
          expect(receiverType).toBe('user');
        }),
        { numRuns: 100 }
      );
    });

    it('should correctly extract receiver ID from any valid group', () => {
      fc.assert(
        fc.property(groupGenerator(), group => {
          const receiverId = getReceiverId(group);
          const receiverType = getReceiverType(group);

          // Receiver ID should match group's GUID
          expect(receiverId).toBe(group.getGuid());
          // Receiver type should be 'group'
          expect(receiverType).toBe('group');
        }),
        { numRuns: 100 }
      );
    });

    it('should distinguish between users and groups correctly', () => {
      fc.assert(
        fc.property(userGenerator(), groupGenerator(), (user, group) => {
          const userReceiverId = getReceiverId(user);
          const userReceiverType = getReceiverType(user);
          const groupReceiverId = getReceiverId(group);
          const groupReceiverType = getReceiverType(group);

          // User should have 'user' type
          expect(userReceiverType).toBe('user');
          // Group should have 'group' type
          expect(groupReceiverType).toBe('group');
          // IDs should come from correct sources
          expect(userReceiverId).toBe(user.getUid());
          expect(groupReceiverId).toBe(group.getGuid());
        }),
        { numRuns: 100 }
      );
    });

    it('should be deterministic - same receiver always produces same ID', () => {
      fc.assert(
        fc.property(
          fc.oneof(userGenerator(), groupGenerator()),
          fc.integer({ min: 2, max: 5 }),
          (receiver, repeatCount) => {
            const results: string[] = [];
            for (let i = 0; i < repeatCount; i++) {
              results.push(getReceiverId(receiver));
            }

            // All results should be identical
            for (let i = 1; i < results.length; i++) {
              expect(results[i]).toBe(results[0]);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Property 4: Send Button State Consistency**
   *
   * *For any* composer state, the send button SHALL be disabled if and only if
   * the text is empty (or whitespace only) AND there are no attachments.
   *
   * **Validates: Requirements 4.9**
   */
  describe('Property 4: Send Button State Consistency', () => {
    it('should enable send when text is non-empty (regardless of attachments)', () => {
      fc.assert(
        fc.property(
          nonEmptyTextGenerator(),
          fc.array(attachmentGenerator(), { minLength: 0, maxLength: 5 }),
          (text, attachments) => {
            const result = canSend(text, attachments);
            expect(result).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should enable send when attachments exist (regardless of text)', () => {
      fc.assert(
        fc.property(
          textGenerator(),
          fc.array(attachmentGenerator(), { minLength: 1, maxLength: 10 }),
          (text, attachments) => {
            const result = canSend(text, attachments);
            expect(result).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should disable send when text is empty/whitespace and no attachments', () => {
      fc.assert(
        fc.property(whitespaceTextGenerator(), text => {
          const result = canSend(text, []);
          expect(result).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it('should correctly determine canSend for any text and attachment combination', () => {
      fc.assert(
        fc.property(
          textGenerator(),
          fc.array(attachmentGenerator(), { minLength: 0, maxLength: 10 }),
          (text, attachments) => {
            const result = canSend(text, attachments);
            const hasNonEmptyText = text.trim().length > 0;
            const hasAttachments = attachments.length > 0;
            const expected = hasNonEmptyText || hasAttachments;

            expect(result).toBe(expected);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should be symmetric - order of checks should not matter', () => {
      fc.assert(
        fc.property(
          textGenerator(),
          fc.array(attachmentGenerator(), { minLength: 0, maxLength: 5 }),
          (text, attachments) => {
            // Check text first, then attachments
            const textFirst = text.trim().length > 0 || attachments.length > 0;
            // Check attachments first, then text
            const attachmentsFirst = attachments.length > 0 || text.trim().length > 0;
            // Both should equal canSend result
            const result = canSend(text, attachments);

            expect(result).toBe(textFirst);
            expect(result).toBe(attachmentsFirst);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Property 7: Attachment Count Limit Enforcement**
   *
   * *For any* maxAttachments value N, the composer SHALL prevent adding more than
   * N attachments, and attempting to add attachment N+1 SHALL fail without modifying
   * the attachment list.
   *
   * **Validates: Requirements 6.3**
   */
  describe('Property 7: Attachment Count Limit Enforcement', () => {
    it('should allow adding attachments when under limit', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          fc.integer({ min: 0, max: 99 }),
          (maxAttachments, currentCount) => {
            // Ensure currentCount is less than maxAttachments
            const safeCurrentCount = Math.min(currentCount, maxAttachments - 1);
            const result = canAddMoreAttachments(safeCurrentCount, maxAttachments);
            expect(result).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should prevent adding attachments when at limit', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 100 }), maxAttachments => {
          const result = canAddMoreAttachments(maxAttachments, maxAttachments);
          expect(result).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it('should prevent adding attachments when over limit', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          fc.integer({ min: 1, max: 50 }),
          (maxAttachments, excess) => {
            const currentCount = maxAttachments + excess;
            const result = canAddMoreAttachments(currentCount, maxAttachments);
            expect(result).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should correctly enforce limit for any valid maxAttachments and currentCount', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          fc.integer({ min: 0, max: 150 }),
          (maxAttachments, currentCount) => {
            const result = canAddMoreAttachments(currentCount, maxAttachments);
            const expected = currentCount < maxAttachments;
            expect(result).toBe(expected);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle edge case of maxAttachments = 1', () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 5 }), currentCount => {
          const maxAttachments = 1;
          const result = canAddMoreAttachments(currentCount, maxAttachments);
          expect(result).toBe(currentCount < 1);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Property 10: File Size Validation**
   *
   * *For any* maxFileSize configuration, files with size exceeding maxFileSize
   * SHALL be rejected and not added to attachments.
   *
   * **Validates: Requirements 9.4**
   */
  describe('Property 10: File Size Validation', () => {
    it('should accept files smaller than maxFileSize', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100000000 }),
          fc.integer({ min: 1, max: 100000000 }),
          (maxFileSize, fileSize) => {
            // Ensure fileSize is smaller than maxFileSize
            const safeFileSize = Math.min(fileSize, maxFileSize - 1);
            const result = isFileSizeValid(safeFileSize, maxFileSize);
            expect(result).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should accept files equal to maxFileSize', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 100000000 }), maxFileSize => {
          const result = isFileSizeValid(maxFileSize, maxFileSize);
          expect(result).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should reject files larger than maxFileSize', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100000000 }),
          fc.integer({ min: 1, max: 100000000 }),
          (maxFileSize, excess) => {
            const fileSize = maxFileSize + excess;
            const result = isFileSizeValid(fileSize, maxFileSize);
            expect(result).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should accept any file size when maxFileSize is undefined', () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 1000000000 }), fileSize => {
          const result = isFileSizeValid(fileSize, undefined);
          expect(result).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should correctly validate for any fileSize and maxFileSize combination', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 100000000 }),
          fc.option(fc.integer({ min: 1, max: 100000000 }), { nil: undefined }),
          (fileSize, maxFileSize) => {
            const result = isFileSizeValid(fileSize, maxFileSize);
            const expected = maxFileSize === undefined || fileSize <= maxFileSize;
            expect(result).toBe(expected);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Property 11: Emoji Insertion at Cursor**
   *
   * *For any* emoji selected and any cursor position P in text of length L
   * (where 0 ≤ P ≤ L), the emoji SHALL be inserted at position P, resulting
   * in text with the emoji at that exact position.
   *
   * **Validates: Requirements 10.3**
   */
  describe('Property 11: Emoji Insertion at Cursor', () => {
    it('should insert emoji at the specified cursor position', () => {
      fc.assert(
        fc.property(
          textGenerator(),
          emojiGenerator(),
          fc.integer({ min: 0, max: 500 }),
          (text, emoji, cursorPosition) => {
            // Clamp cursor position to valid range
            const safeCursorPos = Math.min(Math.max(0, cursorPosition), text.length);

            const { newText, newCursorPosition } = insertTextAtCursor(text, emoji, safeCursorPos);

            // Verify emoji is at the correct position
            const textBefore = text.substring(0, safeCursorPos);
            const textAfter = text.substring(safeCursorPos);
            const expectedText = textBefore + emoji + textAfter;

            expect(newText).toBe(expectedText);
            expect(newCursorPosition).toBe(safeCursorPos + emoji.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should insert at beginning when cursor is at position 0', () => {
      fc.assert(
        fc.property(textGenerator(), emojiGenerator(), (text, emoji) => {
          const { newText, newCursorPosition } = insertTextAtCursor(text, emoji, 0);

          expect(newText).toBe(emoji + text);
          expect(newCursorPosition).toBe(emoji.length);
        }),
        { numRuns: 100 }
      );
    });

    it('should insert at end when cursor is at text length', () => {
      fc.assert(
        fc.property(textGenerator(), emojiGenerator(), (text, emoji) => {
          const { newText, newCursorPosition } = insertTextAtCursor(text, emoji, text.length);

          expect(newText).toBe(text + emoji);
          expect(newCursorPosition).toBe(text.length + emoji.length);
        }),
        { numRuns: 100 }
      );
    });

    it('should handle negative cursor positions by clamping to 0', () => {
      fc.assert(
        fc.property(
          textGenerator(),
          emojiGenerator(),
          fc.integer({ min: -1000, max: -1 }),
          (text, emoji, negativeCursor) => {
            const { newText, newCursorPosition } = insertTextAtCursor(text, emoji, negativeCursor);

            // Should insert at beginning
            expect(newText).toBe(emoji + text);
            expect(newCursorPosition).toBe(emoji.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle cursor positions beyond text length by clamping', () => {
      fc.assert(
        fc.property(
          textGenerator(),
          emojiGenerator(),
          fc.integer({ min: 1, max: 1000 }),
          (text, emoji, excess) => {
            const cursorBeyondEnd = text.length + excess;
            const { newText, newCursorPosition } = insertTextAtCursor(text, emoji, cursorBeyondEnd);

            // Should insert at end
            expect(newText).toBe(text + emoji);
            expect(newCursorPosition).toBe(text.length + emoji.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve text length relationship: newLength = oldLength + emojiLength', () => {
      fc.assert(
        fc.property(
          textGenerator(),
          emojiGenerator(),
          fc.integer({ min: 0, max: 500 }),
          (text, emoji, cursorPosition) => {
            const { newText } = insertTextAtCursor(text, emoji, cursorPosition);

            expect(newText.length).toBe(text.length + emoji.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should be idempotent for cursor position calculation', () => {
      fc.assert(
        fc.property(
          textGenerator(),
          emojiGenerator(),
          fc.integer({ min: 0, max: 500 }),
          fc.integer({ min: 2, max: 5 }),
          (text, emoji, cursorPosition, repeatCount) => {
            const safeCursorPos = Math.min(Math.max(0, cursorPosition), text.length);
            const results: { newText: string; newCursorPosition: number }[] = [];

            for (let i = 0; i < repeatCount; i++) {
              results.push(insertTextAtCursor(text, emoji, safeCursorPos));
            }

            // All results should be identical
            for (let i = 1; i < results.length; i++) {
              expect(results[i].newText).toBe(results[0].newText);
              expect(results[i].newCursorPosition).toBe(results[0].newCursorPosition);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Property 16: URL Pattern Detection**
   *
   * *For any* text containing URLs (http://, https://, or www.), the
   * CometChatUrlFormatter SHALL detect and return all URLs in the text.
   *
   * **Validates: Requirements 23.2**
   */
  describe('Property 16: URL Pattern Detection', () => {
    it('should detect http:// URLs', () => {
      fc.assert(
        fc.property(
          fc
            .string({ minLength: 3, maxLength: 30 })
            .filter(s => /^[a-zA-Z0-9.-]+$/.test(s) && s.length > 0),
          domain => {
            const url = `http://${domain}.com`;
            const text = `Check out ${url} for more info`;
            const urls = detectUrls(text);

            expect(urls.length).toBeGreaterThanOrEqual(1);
            expect(urls).toContain(url);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should detect https:// URLs', () => {
      fc.assert(
        fc.property(
          fc
            .string({ minLength: 3, maxLength: 30 })
            .filter(s => /^[a-zA-Z0-9.-]+$/.test(s) && s.length > 0),
          domain => {
            const url = `https://${domain}.com`;
            const text = `Visit ${url} today`;
            const urls = detectUrls(text);

            expect(urls.length).toBeGreaterThanOrEqual(1);
            expect(urls).toContain(url);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should detect www. URLs', () => {
      fc.assert(
        fc.property(
          fc
            .string({ minLength: 3, maxLength: 30 })
            .filter(s => /^[a-zA-Z0-9.-]+$/.test(s) && s.length > 0),
          domain => {
            const url = `www.${domain}.com`;
            const text = `Go to ${url} now`;
            const urls = detectUrls(text);

            expect(urls.length).toBeGreaterThanOrEqual(1);
            expect(urls).toContain(url);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should detect multiple URLs in the same text', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc
              .string({ minLength: 3, maxLength: 20 })
              .filter(s => /^[a-zA-Z0-9]+$/.test(s) && s.length > 0),
            { minLength: 2, maxLength: 5 }
          ),
          domains => {
            const uniqueDomains = [...new Set(domains)];
            if (uniqueDomains.length < 2) return; // Skip if not enough unique domains

            const urls = uniqueDomains.map(d => `https://${d}.com`);
            const text = urls.join(' and ');
            const detectedUrls = detectUrls(text);

            expect(detectedUrls.length).toBe(urls.length);
            for (const url of urls) {
              expect(detectedUrls).toContain(url);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return empty array for text without URLs', () => {
      fc.assert(
        fc.property(
          fc
            .string({ minLength: 0, maxLength: 200 })
            .filter(s => !s.includes('http://') && !s.includes('https://') && !s.includes('www.')),
          text => {
            const urls = detectUrls(text);
            expect(urls).toEqual([]);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should be case-insensitive for protocol detection', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('http', 'HTTP', 'Http', 'https', 'HTTPS', 'Https'),
          fc
            .string({ minLength: 3, maxLength: 20 })
            .filter(s => /^[a-zA-Z0-9]+$/.test(s) && s.length > 0),
          (protocol, domain) => {
            const url = `${protocol}://${domain}.com`;
            const text = `Link: ${url}`;
            const urls = detectUrls(text);

            expect(urls.length).toBeGreaterThanOrEqual(1);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Property 17: Mention Pattern Detection**
   *
   * *For any* text containing @mentions, the CometChatMentionsFormatter
   * SHALL detect all mentions in the text.
   *
   * **Validates: Requirements 22.2**
   */
  describe('Property 17: Mention Pattern Detection', () => {
    it('should detect single @mention', () => {
      fc.assert(
        fc.property(mentionUsernameGenerator(), username => {
          const text = `Hello @${username}, how are you?`;
          const mentions = detectMentions(text);

          expect(mentions.length).toBe(1);
          expect(mentions[0]).toBe(username);
        }),
        { numRuns: 100 }
      );
    });

    it('should detect multiple @mentions', () => {
      fc.assert(
        fc.property(
          fc.array(mentionUsernameGenerator(), { minLength: 2, maxLength: 5 }),
          usernames => {
            const uniqueUsernames = [...new Set(usernames)];
            if (uniqueUsernames.length < 2) return; // Skip if not enough unique usernames

            const text = uniqueUsernames.map(u => `@${u}`).join(' and ');
            const mentions = detectMentions(text);

            expect(mentions.length).toBe(uniqueUsernames.length);
            for (const username of uniqueUsernames) {
              expect(mentions).toContain(username);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return empty array for text without @mentions', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 0, maxLength: 200 }).filter(s => !s.includes('@')),
          text => {
            const mentions = detectMentions(text);
            expect(mentions).toEqual([]);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should detect @mention at beginning of text', () => {
      fc.assert(
        fc.property(mentionUsernameGenerator(), textGenerator(), (username, suffix) => {
          const text = `@${username} ${suffix}`;
          const mentions = detectMentions(text);

          expect(mentions.length).toBeGreaterThanOrEqual(1);
          expect(mentions[0]).toBe(username);
        }),
        { numRuns: 100 }
      );
    });

    it('should detect @mention at end of text', () => {
      fc.assert(
        fc.property(textGenerator(), mentionUsernameGenerator(), (prefix, username) => {
          // Ensure prefix doesn't end with @ or word character
          const safePrefix = prefix.replace(/@\w*$/, '');
          const text = `${safePrefix} @${username}`;
          const mentions = detectMentions(text);

          expect(mentions).toContain(username);
        }),
        { numRuns: 100 }
      );
    });

    it('should only match word characters after @', () => {
      fc.assert(
        fc.property(mentionUsernameGenerator(), username => {
          // Add special characters that should not be part of the mention
          const text = `@${username}! and @${username}?`;
          const mentions = detectMentions(text);

          // Should detect the username twice (special chars are not part of mention)
          expect(mentions.length).toBe(2);
          expect(mentions[0]).toBe(username);
          expect(mentions[1]).toBe(username);
        }),
        { numRuns: 100 }
      );
    });

    it('should not match @ followed by non-word characters', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('@!', '@ ', '@#', '@$', '@%', '@^', '@&', '@*'),
          invalidMention => {
            const text = `This ${invalidMention} is not a mention`;
            const mentions = detectMentions(text);

            // Should not detect any mentions
            expect(mentions).toEqual([]);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should be deterministic - same text always produces same mentions', () => {
      fc.assert(
        fc.property(
          fc.array(mentionUsernameGenerator(), { minLength: 1, maxLength: 5 }),
          fc.integer({ min: 2, max: 5 }),
          (usernames, repeatCount) => {
            const text = usernames.map(u => `@${u}`).join(' ');
            const results: string[][] = [];

            for (let i = 0; i < repeatCount; i++) {
              results.push(detectMentions(text));
            }

            // All results should be identical
            for (let i = 1; i < results.length; i++) {
              expect(results[i]).toEqual(results[0]);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Property 5: Edit Mode Cleanup**
   *
   * *For any* exit from edit mode (success, cancel, or error), the editor should be
   * cleared and the messageToEdit state should be reset to null.
   *
   * **Validates: Requirements 3.10**
   */
  describe('Property 5: Edit Mode Cleanup', () => {
    it('should reset messageToEdit to null on any exit status', () => {
      fc.assert(
        fc.property(
          initialEditModeStateGenerator(),
          textMessageGenerator(),
          editModeExitStatusGenerator(),
          (initialState, message, exitStatus) => {
            // Enter edit mode
            const editingState = enterEditMode(initialState, message);

            // Verify we're in edit mode
            expect(editingState.messageToEdit).not.toBeNull();

            // Exit edit mode with any status
            const finalState = exitEditMode(editingState, exitStatus);

            // messageToEdit should be null after exit
            expect(finalState.messageToEdit).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should clear originalTextBeforeEdit on any exit status', () => {
      fc.assert(
        fc.property(
          initialEditModeStateGenerator(),
          textMessageGenerator(),
          editModeExitStatusGenerator(),
          (initialState, message, exitStatus) => {
            // Enter edit mode
            const editingState = enterEditMode(initialState, message);

            // Exit edit mode with any status
            const finalState = exitEditMode(editingState, exitStatus);

            // originalTextBeforeEdit should be cleared
            expect(finalState.originalTextBeforeEdit).toBe('');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should restore original text on cancel', () => {
      fc.assert(
        fc.property(
          initialEditModeStateGenerator(),
          textMessageGenerator(),
          (initialState, message) => {
            const originalContent = initialState.editorContent;

            // Enter edit mode
            const editingState = enterEditMode(initialState, message);

            // Exit with cancelled status
            const finalState = exitEditMode(editingState, 'cancelled');

            // Editor content should be restored to original
            expect(finalState.editorContent).toBe(originalContent);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should clear editor content on success', () => {
      fc.assert(
        fc.property(
          initialEditModeStateGenerator(),
          textMessageGenerator(),
          (initialState, message) => {
            // Enter edit mode
            const editingState = enterEditMode(initialState, message);

            // Exit with success status
            const finalState = exitEditMode(editingState, 'success');

            // Editor content should be cleared
            expect(finalState.editorContent).toBe('');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should clear editor content on error', () => {
      fc.assert(
        fc.property(
          initialEditModeStateGenerator(),
          textMessageGenerator(),
          (initialState, message) => {
            // Enter edit mode
            const editingState = enterEditMode(initialState, message);

            // Exit with error status
            const finalState = exitEditMode(editingState, 'error');

            // Editor content should be cleared
            expect(finalState.editorContent).toBe('');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should pass cleanup check for any exit status', () => {
      fc.assert(
        fc.property(
          initialEditModeStateGenerator(),
          textMessageGenerator(),
          editModeExitStatusGenerator(),
          (initialState, message, exitStatus) => {
            // Enter edit mode
            const editingState = enterEditMode(initialState, message);

            // Exit edit mode
            const finalState = exitEditMode(editingState, exitStatus);

            // State should pass cleanup check
            expect(isEditModeCleanedUp(finalState)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle multiple enter/exit cycles correctly', () => {
      fc.assert(
        fc.property(
          initialEditModeStateGenerator(),
          fc.array(textMessageGenerator(), { minLength: 2, maxLength: 5 }),
          fc.array(editModeExitStatusGenerator(), { minLength: 2, maxLength: 5 }),
          (initialState, messages, exitStatuses) => {
            let currentState = initialState;

            // Perform multiple enter/exit cycles
            const cycleCount = Math.min(messages.length, exitStatuses.length);
            for (let i = 0; i < cycleCount; i++) {
              // Enter edit mode
              currentState = enterEditMode(currentState, messages[i]);
              expect(currentState.messageToEdit).not.toBeNull();

              // Exit edit mode
              currentState = exitEditMode(currentState, exitStatuses[i]);
              expect(isEditModeCleanedUp(currentState)).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should be idempotent - exiting already exited state should maintain cleanup', () => {
      fc.assert(
        fc.property(
          initialEditModeStateGenerator(),
          textMessageGenerator(),
          editModeExitStatusGenerator(),
          editModeExitStatusGenerator(),
          (initialState, message, firstExitStatus, secondExitStatus) => {
            // Enter edit mode
            const editingState = enterEditMode(initialState, message);

            // Exit edit mode first time
            const afterFirstExit = exitEditMode(editingState, firstExitStatus);
            expect(isEditModeCleanedUp(afterFirstExit)).toBe(true);

            // Exit again (should maintain cleanup state)
            const afterSecondExit = exitEditMode(afterFirstExit, secondExitStatus);
            expect(isEditModeCleanedUp(afterSecondExit)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve message text in editor when entering edit mode', () => {
      fc.assert(
        fc.property(
          initialEditModeStateGenerator(),
          textMessageGenerator(),
          (initialState, message) => {
            // Enter edit mode
            const editingState = enterEditMode(initialState, message);

            // Editor should contain the message text
            expect(editingState.editorContent).toBe(message.getText());
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should store original text when entering edit mode', () => {
      fc.assert(
        fc.property(
          initialEditModeStateGenerator(),
          textMessageGenerator(),
          (initialState, message) => {
            const originalContent = initialState.editorContent;

            // Enter edit mode
            const editingState = enterEditMode(initialState, message);

            // Original text should be stored
            expect(editingState.originalTextBeforeEdit).toBe(originalContent);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Property 8: Text Formatter Pipeline Application**
   *
   * *For any* message being sent with a non-empty textFormatters array, each formatter's
   * formatMessageForSending method should be called in order, with the output of one
   * formatter being the input to the next.
   *
   * **Validates: Requirements 5.2, 5.10**
   */
  describe('Property 8: Text Formatter Pipeline Application', () => {
    it('should call each formatter in order', () => {
      fc.assert(
        fc.property(
          nonEmptyTextGenerator(),
          formatterArrayGenerator(1, 5),
          (initialText, formatters) => {
            // Reset all formatters before test
            formatters.forEach(f => f.reset());

            const message = createMockFormatterMessage(initialText);

            // Apply formatters
            applyTextFormatters(message, formatters);

            // Each formatter should have been called exactly once
            for (const formatter of formatters) {
              expect(formatter.getCallCount()).toBe(1);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should chain formatter outputs - output of one is input to next', () => {
      fc.assert(
        fc.property(nonEmptyTextGenerator(), initialText => {
          // Create formatters with known transformations
          const formatter1 = new MockTextFormatter(text => `[${text}]`);
          const formatter2 = new MockTextFormatter(text => text.toUpperCase());
          const formatter3 = new MockTextFormatter(text => `${text}!`);

          const formatters = [formatter1, formatter2, formatter3];
          const message = createMockFormatterMessage(initialText);

          // Apply formatters
          applyTextFormatters(message, formatters);

          // Verify chaining: formatter2 should have received output of formatter1
          expect(formatter2.getLastInputText()).toBe(`[${initialText}]`);

          // Verify chaining: formatter3 should have received output of formatter2
          expect(formatter3.getLastInputText()).toBe(`[${initialText}]`.toUpperCase());

          // Final result should be all transformations applied in order
          const expectedFinal = `[${initialText}]`.toUpperCase() + '!';
          expect(message.getText()).toBe(expectedFinal);
        }),
        { numRuns: 100 }
      );
    });

    it('should return unchanged message when formatter array is empty', () => {
      fc.assert(
        fc.property(nonEmptyTextGenerator(), initialText => {
          const message = createMockFormatterMessage(initialText);
          const emptyFormatters: MockTextFormatter[] = [];

          // Apply empty formatter array
          applyTextFormatters(message, emptyFormatters);

          // Message should be unchanged
          expect(message.getText()).toBe(initialText);
        }),
        { numRuns: 100 }
      );
    });

    it('should apply single formatter correctly', () => {
      fc.assert(
        fc.property(
          nonEmptyTextGenerator(),
          mockTextFormatterGenerator(),
          (initialText, formatter) => {
            formatter.reset();
            const message = createMockFormatterMessage(initialText);

            // Apply single formatter
            applyTextFormatters(message, [formatter]);

            // Formatter should have been called once
            expect(formatter.getCallCount()).toBe(1);

            // Formatter should have received the initial text
            expect(formatter.getLastInputText()).toBe(initialText);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve formatter order - first formatter processes original text', () => {
      fc.assert(
        fc.property(
          nonEmptyTextGenerator(),
          formatterArrayGenerator(2, 5),
          (initialText, formatters) => {
            // Reset all formatters
            formatters.forEach(f => f.reset());

            const message = createMockFormatterMessage(initialText);

            // Apply formatters
            applyTextFormatters(message, formatters);

            // First formatter should have received the original text
            expect(formatters[0].getLastInputText()).toBe(initialText);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should be deterministic - same formatters produce same result', () => {
      fc.assert(
        fc.property(
          nonEmptyTextGenerator(),
          fc.integer({ min: 2, max: 5 }),
          (initialText, repeatCount) => {
            // Use fixed transformations for determinism
            const createFormatters = () => [
              new MockTextFormatter(text => `[${text}]`),
              new MockTextFormatter(text => text.toUpperCase()),
            ];

            const results: string[] = [];

            for (let i = 0; i < repeatCount; i++) {
              const message = createMockFormatterMessage(initialText);
              const formatters = createFormatters();
              applyTextFormatters(message, formatters);
              results.push(message.getText());
            }

            // All results should be identical
            for (let i = 1; i < results.length; i++) {
              expect(results[i]).toBe(results[0]);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle formatters that do not modify text', () => {
      fc.assert(
        fc.property(nonEmptyTextGenerator(), initialText => {
          // Create a formatter that returns text unchanged (identity function)
          const identityFormatter = new MockTextFormatter(text => text);
          const message = createMockFormatterMessage(initialText);

          // Apply identity formatter
          applyTextFormatters(message, [identityFormatter]);

          // Text should remain unchanged
          expect(message.getText()).toBe(initialText);
          expect(identityFormatter.getCallCount()).toBe(1);
        }),
        { numRuns: 100 }
      );
    });

    it('should correctly apply transformations in sequence for any number of formatters', () => {
      fc.assert(
        fc.property(
          nonEmptyTextGenerator(),
          fc.integer({ min: 1, max: 5 }),
          (initialText, formatterCount) => {
            // Create formatters that wrap text with numbered brackets
            const formatters: MockTextFormatter[] = [];
            for (let i = 0; i < formatterCount; i++) {
              const index = i + 1;
              formatters.push(new MockTextFormatter(text => `[${index}:${text}]`));
            }

            const message = createMockFormatterMessage(initialText);

            // Apply formatters
            applyTextFormatters(message, formatters);

            // Verify the final text has all wrappers applied in order
            let expectedText = initialText;
            for (let i = 0; i < formatterCount; i++) {
              expectedText = `[${i + 1}:${expectedText}]`;
            }

            expect(message.getText()).toBe(expectedText);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return the same message object (not a copy)', () => {
      fc.assert(
        fc.property(
          nonEmptyTextGenerator(),
          formatterArrayGenerator(1, 3),
          (initialText, formatters) => {
            formatters.forEach(f => f.reset());
            const message = createMockFormatterMessage(initialText);

            // Apply formatters and capture returned message
            const returnedMessage = applyTextFormatters(message, formatters);

            // Should return the same object reference
            expect(returnedMessage).toBe(message);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle whitespace-only text correctly', () => {
      fc.assert(
        fc.property(
          whitespaceTextGenerator(),
          formatterArrayGenerator(1, 3),
          (whitespaceText, formatters) => {
            formatters.forEach(f => f.reset());
            const message = createMockFormatterMessage(whitespaceText);

            // Apply formatters - should not throw
            applyTextFormatters(message, formatters);

            // All formatters should have been called
            for (const formatter of formatters) {
              expect(formatter.getCallCount()).toBe(1);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Property 6: Mention Metadata Extraction**
   *
   * *For any* message containing @mentions that is sent, the sent message should
   * include a mentionedUsers array in metadata containing all mentioned users
   * with their uid and name.
   *
   * **Validates: Requirements 4.5, 4.6, 4.7**
   */
  describe('Property 6: Mention Metadata Extraction', () => {
    it('should extract uid for each mentioned user', () => {
      fc.assert(
        fc.property(mentionUsersArrayGenerator(1, 5), users => {
          // Build available users map
          const availableUsers = new Map<string, { uid: string; name: string }>();
          users.forEach(user => {
            availableUsers.set(user.name.toLowerCase(), user);
          });

          // Create text with mentions of all users
          const text = users.map(u => `Hello @${u.name}`).join(' ');

          // Extract mention metadata
          const mentions = extractMentionMetadata(text, availableUsers, false, 'all');

          // Each mentioned user's uid should be in the metadata
          for (const user of users) {
            const found = mentions.some(m => m.uid === user.uid);
            expect(found).toBe(true);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should extract name for each mentioned user', () => {
      fc.assert(
        fc.property(mentionUsersArrayGenerator(1, 5), users => {
          // Build available users map
          const availableUsers = new Map<string, { uid: string; name: string }>();
          users.forEach(user => {
            availableUsers.set(user.name.toLowerCase(), user);
          });

          // Create text with mentions of all users
          const text = users.map(u => `Hi @${u.name}!`).join(' ');

          // Extract mention metadata
          const mentions = extractMentionMetadata(text, availableUsers, false, 'all');

          // Each mentioned user's name should be in the metadata
          for (const user of users) {
            const found = mentions.some(m => m.name === user.name);
            expect(found).toBe(true);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should match mention count to @mentions in text for matched users', () => {
      fc.assert(
        fc.property(mentionUsersArrayGenerator(1, 5), users => {
          // Build available users map
          const availableUsers = new Map<string, { uid: string; name: string }>();
          users.forEach(user => {
            availableUsers.set(user.name.toLowerCase(), user);
          });

          // Create text with mentions of all users
          const text = users.map(u => `@${u.name}`).join(' and ');

          // Extract mention metadata
          const mentions = extractMentionMetadata(text, availableUsers, false, 'all');

          // Number of mentions should match number of users
          expect(mentions.length).toBe(users.length);
        }),
        { numRuns: 100 }
      );
    });

    it('should handle @all mention with uid "all"', () => {
      fc.assert(
        fc.property(allMentionLabelGenerator(), textGenerator(), (allLabel, prefix) => {
          // Ensure prefix doesn't contain @ to avoid interference
          const safePrefix = prefix.replace(/@/g, '');
          const text = `${safePrefix} @${allLabel} everyone`;

          // Extract with @all enabled
          const availableUsers = new Map<string, { uid: string; name: string }>();
          const mentions = extractMentionMetadata(text, availableUsers, true, allLabel);

          // Should have exactly one @all mention
          const allMentions = mentions.filter(m => m.uid === 'all');
          expect(allMentions.length).toBe(1);
          expect(allMentions[0].name).toBe(allLabel);
        }),
        { numRuns: 100 }
      );
    });

    it('should not extract @all when disabled', () => {
      fc.assert(
        fc.property(allMentionLabelGenerator(), allLabel => {
          const text = `Hello @${allLabel} everyone`;

          // Extract with @all disabled
          const availableUsers = new Map<string, { uid: string; name: string }>();
          const mentions = extractMentionMetadata(text, availableUsers, false, allLabel);

          // Should have no @all mention
          const allMentions = mentions.filter(m => m.uid === 'all');
          expect(allMentions.length).toBe(0);
        }),
        { numRuns: 100 }
      );
    });

    it('should include both uid and name for each mention', () => {
      fc.assert(
        fc.property(mentionUsersArrayGenerator(1, 5), users => {
          // Build available users map
          const availableUsers = new Map<string, { uid: string; name: string }>();
          users.forEach(user => {
            availableUsers.set(user.name.toLowerCase(), user);
          });

          // Create text with mentions
          const text = users.map(u => `@${u.name}`).join(' ');

          // Extract mention metadata
          const mentions = extractMentionMetadata(text, availableUsers, false, 'all');

          // Each mention should have both uid and name
          for (const mention of mentions) {
            expect(mention.uid).toBeDefined();
            expect(mention.uid.length).toBeGreaterThan(0);
            expect(mention.name).toBeDefined();
            expect(mention.name.length).toBeGreaterThan(0);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should not include unmatched @mentions in metadata', () => {
      fc.assert(
        fc.property(
          mentionUsersArrayGenerator(1, 3),
          mentionUsernameGenerator(),
          (users, unknownUsername) => {
            // Ensure unknown username is not in users list
            const isKnown = users.some(u => u.name.toLowerCase() === unknownUsername.toLowerCase());
            if (isKnown) return; // Skip this case

            // Build available users map
            const availableUsers = new Map<string, { uid: string; name: string }>();
            users.forEach(user => {
              availableUsers.set(user.name.toLowerCase(), user);
            });

            // Create text with known and unknown mentions
            const text = `@${unknownUsername} and @${users[0].name}`;

            // Extract mention metadata
            const mentions = extractMentionMetadata(text, availableUsers, false, 'all');

            // Should only have the known user
            expect(mentions.length).toBe(1);
            expect(mentions[0].name).toBe(users[0].name);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle mixed @all and user mentions', () => {
      fc.assert(
        fc.property(
          mentionUsersArrayGenerator(1, 3),
          allMentionLabelGenerator(),
          (users, allLabel) => {
            // Ensure no user has the same name as allLabel
            const hasConflict = users.some(u => u.name.toLowerCase() === allLabel.toLowerCase());
            if (hasConflict) return; // Skip this case

            // Build available users map
            const availableUsers = new Map<string, { uid: string; name: string }>();
            users.forEach(user => {
              availableUsers.set(user.name.toLowerCase(), user);
            });

            // Create text with @all and user mentions
            const text = `@${allLabel} and @${users[0].name}`;

            // Extract mention metadata with @all enabled
            const mentions = extractMentionMetadata(text, availableUsers, true, allLabel);

            // Should have @all mention and user mention
            expect(mentions.length).toBe(2);

            const allMention = mentions.find(m => m.uid === 'all');
            const userMention = mentions.find(m => m.uid === users[0].uid);

            expect(allMention).toBeDefined();
            expect(userMention).toBeDefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should validate mention metadata matches text mentions', () => {
      fc.assert(
        fc.property(
          mentionUsersArrayGenerator(1, 5),
          fc.boolean(),
          allMentionLabelGenerator(),
          (users, enableAll, allLabel) => {
            // Ensure no user has the same name as allLabel
            const filteredUsers = users.filter(
              u => u.name.toLowerCase() !== allLabel.toLowerCase()
            );
            if (filteredUsers.length === 0) return; // Skip if all filtered out

            // Build available users map
            const availableUsers = new Map<string, { uid: string; name: string }>();
            filteredUsers.forEach(user => {
              availableUsers.set(user.name.toLowerCase(), user);
            });

            // Create text with mentions
            let text = filteredUsers.map(u => `@${u.name}`).join(' ');
            if (enableAll) {
              text = `@${allLabel} ${text}`;
            }

            // Extract mention metadata
            const mentions = extractMentionMetadata(text, availableUsers, enableAll, allLabel);

            // Create mock message with extracted mentions
            const message = createMockMentionMessage(text, mentions);

            // Validate the metadata
            const isValid = validateMentionMetadata(
              text,
              message.getMentionedUsers(),
              availableUsers,
              enableAll,
              allLabel
            );

            expect(isValid).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return empty array for text without @mentions', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 0, maxLength: 200 }).filter(s => !s.includes('@')),
          mentionUsersArrayGenerator(1, 3),
          (text, users) => {
            // Build available users map
            const availableUsers = new Map<string, { uid: string; name: string }>();
            users.forEach(user => {
              availableUsers.set(user.name.toLowerCase(), user);
            });

            // Extract mention metadata
            const mentions = extractMentionMetadata(text, availableUsers, true, 'all');

            // Should have no mentions
            expect(mentions).toEqual([]);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should be deterministic - same text always produces same mentions', () => {
      fc.assert(
        fc.property(
          mentionUsersArrayGenerator(1, 3),
          fc.integer({ min: 2, max: 5 }),
          (users, repeatCount) => {
            // Build available users map
            const availableUsers = new Map<string, { uid: string; name: string }>();
            users.forEach(user => {
              availableUsers.set(user.name.toLowerCase(), user);
            });

            // Create text with mentions
            const text = users.map(u => `@${u.name}`).join(' ');

            const results: MockMentionData[][] = [];

            for (let i = 0; i < repeatCount; i++) {
              results.push(extractMentionMetadata(text, availableUsers, true, 'all'));
            }

            // All results should be identical
            for (let i = 1; i < results.length; i++) {
              expect(results[i].length).toBe(results[0].length);
              for (let j = 0; j < results[0].length; j++) {
                expect(results[i][j].uid).toBe(results[0][j].uid);
                expect(results[i][j].name).toBe(results[0][j].name);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle case-insensitive username matching', () => {
      fc.assert(
        fc.property(
          mentionUsersArrayGenerator(1, 3),
          fc.constantFrom('lower', 'upper', 'mixed'),
          (users, caseType) => {
            // Build available users map with original case
            const availableUsers = new Map<string, { uid: string; name: string }>();
            users.forEach(user => {
              availableUsers.set(user.name.toLowerCase(), user);
            });

            // Create text with different case mentions
            const text = users
              .map(u => {
                let mentionName = u.name;
                if (caseType === 'upper') {
                  mentionName = u.name.toUpperCase();
                } else if (caseType === 'mixed') {
                  mentionName = u.name
                    .split('')
                    .map((c, i) => (i % 2 === 0 ? c.toUpperCase() : c.toLowerCase()))
                    .join('');
                }
                return `@${mentionName}`;
              })
              .join(' ');

            // Extract mention metadata
            const mentions = extractMentionMetadata(text, availableUsers, false, 'all');

            // Should match all users regardless of case
            expect(mentions.length).toBe(users.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve mention order from text', () => {
      fc.assert(
        fc.property(mentionUsersArrayGenerator(2, 5), users => {
          // Build available users map
          const availableUsers = new Map<string, { uid: string; name: string }>();
          users.forEach(user => {
            availableUsers.set(user.name.toLowerCase(), user);
          });

          // Create text with mentions in specific order
          const text = users.map(u => `@${u.name}`).join(' then ');

          // Extract mention metadata
          const mentions = extractMentionMetadata(text, availableUsers, false, 'all');

          // Mentions should be in the same order as they appear in text
          for (let i = 0; i < users.length; i++) {
            expect(mentions[i].uid).toBe(users[i].uid);
            expect(mentions[i].name).toBe(users[i].name);
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Property 10: Text Change Event Emission**
   *
   * *For any* change to the text content in the editor, the textChange output
   * should emit with the new text value.
   *
   * **Validates: Requirements 6.1**
   *
   * Feature: message-composer-react-parity, Property 10: Text Change Event Emission
   */
  describe('Property 10: Text Change Event Emission', () => {
    /**
     * Mock text change handler that tracks all emitted values.
     * Mirrors the component's textChange EventEmitter behavior.
     */
    class MockTextChangeHandler {
      private emittedValues: string[] = [];

      /**
       * Handles a text change event by recording the emitted value.
       * @param newText - The new text value emitted
       */
      handleTextChange(newText: string): void {
        this.emittedValues.push(newText);
      }

      /**
       * Gets all emitted values in order.
       */
      getEmittedValues(): string[] {
        return [...this.emittedValues];
      }

      /**
       * Gets the last emitted value.
       */
      getLastEmittedValue(): string | undefined {
        return this.emittedValues[this.emittedValues.length - 1];
      }

      /**
       * Gets the count of emissions.
       */
      getEmissionCount(): number {
        return this.emittedValues.length;
      }

      /**
       * Resets the handler state.
       */
      reset(): void {
        this.emittedValues = [];
      }
    }

    /**
     * Simulates text change in the editor and emits the textChange event.
     * Mirrors the component's text change handling logic.
     *
     * @param currentText - The current text in the editor
     * @param newText - The new text to set
     * @param handler - The text change handler to emit to
     * @returns Object with the new text and whether an emission occurred
     */
    function simulateTextChange(
      currentText: string,
      newText: string,
      handler: MockTextChangeHandler
    ): { resultText: string; emitted: boolean } {
      // Only emit if text actually changed
      if (currentText !== newText) {
        handler.handleTextChange(newText);
        return { resultText: newText, emitted: true };
      }
      return { resultText: currentText, emitted: false };
    }

    /**
     * Simulates multiple consecutive text changes.
     * @param initialText - Starting text
     * @param textChanges - Array of new text values to apply
     * @param handler - The text change handler
     * @returns Array of results for each change
     */
    function simulateMultipleTextChanges(
      initialText: string,
      textChanges: string[],
      handler: MockTextChangeHandler
    ): { resultText: string; emitted: boolean }[] {
      const results: { resultText: string; emitted: boolean }[] = [];
      let currentText = initialText;

      for (const newText of textChanges) {
        const result = simulateTextChange(currentText, newText, handler);
        results.push(result);
        currentText = result.resultText;
      }

      return results;
    }

    /**
     * Generator for text with special characters and emojis
     */
    const specialTextGenerator = (): fc.Arbitrary<string> =>
      fc.oneof(
        fc.string({ minLength: 0, maxLength: 200 }),
        fc.constantFrom(
          '😀 Hello World! 🎉',
          'Special chars: @#$%^&*()',
          'Unicode: 你好世界',
          'Mixed: Hello 👋 World 🌍!',
          'Newlines:\nLine1\nLine2',
          'Tabs:\tTab1\tTab2',
          '<script>alert("xss")</script>',
          '   spaces   around   ',
          ''
        )
      );

    it('should emit textChange when text changes from empty to non-empty', () => {
      fc.assert(
        fc.property(nonEmptyTextGenerator(), newText => {
          const handler = new MockTextChangeHandler();
          const initialText = '';

          const result = simulateTextChange(initialText, newText, handler);

          // Should emit with the new text value
          expect(result.emitted).toBe(true);
          expect(handler.getLastEmittedValue()).toBe(newText);
          expect(handler.getEmissionCount()).toBe(1);
        }),
        { numRuns: 100 }
      );
    });

    it('should emit textChange when text changes from non-empty to different non-empty', () => {
      fc.assert(
        fc.property(nonEmptyTextGenerator(), nonEmptyTextGenerator(), (initialText, newText) => {
          // Skip if texts are the same
          if (initialText === newText) return;

          const handler = new MockTextChangeHandler();

          const result = simulateTextChange(initialText, newText, handler);

          // Should emit with the new text value
          expect(result.emitted).toBe(true);
          expect(handler.getLastEmittedValue()).toBe(newText);
          expect(handler.getEmissionCount()).toBe(1);
        }),
        { numRuns: 100 }
      );
    });

    it('should emit textChange when text changes from non-empty to empty', () => {
      fc.assert(
        fc.property(nonEmptyTextGenerator(), initialText => {
          const handler = new MockTextChangeHandler();
          const newText = '';

          const result = simulateTextChange(initialText, newText, handler);

          // Should emit with empty string
          expect(result.emitted).toBe(true);
          expect(handler.getLastEmittedValue()).toBe('');
          expect(handler.getEmissionCount()).toBe(1);
        }),
        { numRuns: 100 }
      );
    });

    it('should emit textChange for each consecutive text change', () => {
      fc.assert(
        fc.property(
          textGenerator(),
          fc.array(textGenerator(), { minLength: 2, maxLength: 10 }),
          (initialText, textChanges) => {
            const handler = new MockTextChangeHandler();

            // Filter to only include actual changes
            const uniqueChanges: string[] = [];
            let currentText = initialText;
            for (const change of textChanges) {
              if (change !== currentText) {
                uniqueChanges.push(change);
                currentText = change;
              }
            }

            // Simulate all changes
            simulateMultipleTextChanges(initialText, textChanges, handler);

            // Should have emitted for each actual change
            expect(handler.getEmissionCount()).toBe(uniqueChanges.length);

            // Each emitted value should match the corresponding change
            const emittedValues = handler.getEmittedValues();
            for (let i = 0; i < uniqueChanges.length; i++) {
              expect(emittedValues[i]).toBe(uniqueChanges[i]);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should emit textChange with special characters and emojis', () => {
      fc.assert(
        fc.property(specialTextGenerator(), specialTextGenerator(), (initialText, newText) => {
          // Skip if texts are the same
          if (initialText === newText) return;

          const handler = new MockTextChangeHandler();

          const result = simulateTextChange(initialText, newText, handler);

          // Should emit with the exact new text including special chars
          expect(result.emitted).toBe(true);
          expect(handler.getLastEmittedValue()).toBe(newText);
        }),
        { numRuns: 100 }
      );
    });

    it('should NOT emit textChange when text remains the same', () => {
      fc.assert(
        fc.property(textGenerator(), text => {
          const handler = new MockTextChangeHandler();

          // Simulate "change" to the same text
          const result = simulateTextChange(text, text, handler);

          // Should NOT emit
          expect(result.emitted).toBe(false);
          expect(handler.getEmissionCount()).toBe(0);
        }),
        { numRuns: 100 }
      );
    });

    it('should emit the exact new text value (not modified)', () => {
      fc.assert(
        fc.property(textGenerator(), textGenerator(), (initialText, newText) => {
          // Skip if texts are the same
          if (initialText === newText) return;

          const handler = new MockTextChangeHandler();

          simulateTextChange(initialText, newText, handler);

          // Emitted value should be exactly the new text
          const emittedValue = handler.getLastEmittedValue();
          expect(emittedValue).toBe(newText);
          expect(emittedValue?.length).toBe(newText.length);
        }),
        { numRuns: 100 }
      );
    });

    it('should handle whitespace-only text changes correctly', () => {
      fc.assert(
        fc.property(
          whitespaceTextGenerator(),
          whitespaceTextGenerator(),
          (initialWhitespace, newWhitespace) => {
            // Skip if texts are the same
            if (initialWhitespace === newWhitespace) return;

            const handler = new MockTextChangeHandler();

            const result = simulateTextChange(initialWhitespace, newWhitespace, handler);

            // Should emit even for whitespace-only changes
            expect(result.emitted).toBe(true);
            expect(handler.getLastEmittedValue()).toBe(newWhitespace);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should be deterministic - same change always produces same emission', () => {
      fc.assert(
        fc.property(
          textGenerator(),
          textGenerator(),
          fc.integer({ min: 2, max: 5 }),
          (initialText, newText, repeatCount) => {
            // Skip if texts are the same
            if (initialText === newText) return;

            const results: { emitted: boolean; value: string | undefined }[] = [];

            for (let i = 0; i < repeatCount; i++) {
              const handler = new MockTextChangeHandler();
              const result = simulateTextChange(initialText, newText, handler);
              results.push({
                emitted: result.emitted,
                value: handler.getLastEmittedValue(),
              });
            }

            // All results should be identical
            for (let i = 1; i < results.length; i++) {
              expect(results[i].emitted).toBe(results[0].emitted);
              expect(results[i].value).toBe(results[0].value);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should track emission order correctly for multiple changes', () => {
      fc.assert(
        fc.property(
          fc.array(nonEmptyTextGenerator(), { minLength: 3, maxLength: 8 }),
          textSequence => {
            // Ensure all texts are unique
            const uniqueTexts = [...new Set(textSequence)];
            if (uniqueTexts.length < 3) return;

            const handler = new MockTextChangeHandler();
            const initialText = '';

            // Simulate changes through the sequence
            simulateMultipleTextChanges(initialText, uniqueTexts, handler);

            // Emitted values should be in the same order as changes
            const emittedValues = handler.getEmittedValues();
            expect(emittedValues.length).toBe(uniqueTexts.length);

            for (let i = 0; i < uniqueTexts.length; i++) {
              expect(emittedValues[i]).toBe(uniqueTexts[i]);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle rapid consecutive changes correctly', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 5, maxLength: 20 }),
          rapidChanges => {
            const handler = new MockTextChangeHandler();
            let currentText = '';

            // Simulate rapid changes
            for (const change of rapidChanges) {
              simulateTextChange(currentText, change, handler);
              currentText = change;
            }

            // Count actual changes (where text was different)
            let expectedEmissions = 0;
            let prevText = '';
            for (const change of rapidChanges) {
              if (change !== prevText) {
                expectedEmissions++;
                prevText = change;
              }
            }

            expect(handler.getEmissionCount()).toBe(expectedEmissions);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should emit plain text value (not HTML)', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            '<p>Hello</p>',
            '<strong>Bold</strong>',
            '<em>Italic</em>',
            '<a href="test">Link</a>',
            'Plain text without HTML'
          ),
          textWithPossibleHtml => {
            const handler = new MockTextChangeHandler();
            const initialText = '';

            simulateTextChange(initialText, textWithPossibleHtml, handler);

            // The emitted value should be exactly what was set
            // (In real component, this would be plain text extracted from editor)
            expect(handler.getLastEmittedValue()).toBe(textWithPossibleHtml);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle empty string to empty string (no change)', () => {
      const handler = new MockTextChangeHandler();

      const result = simulateTextChange('', '', handler);

      expect(result.emitted).toBe(false);
      expect(handler.getEmissionCount()).toBe(0);
    });

    it('should preserve text with newlines and formatting', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            'Line1\nLine2\nLine3',
            'Tab\tSeparated\tValues',
            'Carriage\rReturn',
            'Mixed\n\t\rFormatting',
            '   Leading and trailing spaces   '
          ),
          formattedText => {
            const handler = new MockTextChangeHandler();

            simulateTextChange('', formattedText, handler);

            // Should preserve all formatting characters
            expect(handler.getLastEmittedValue()).toBe(formattedText);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Property 11: Sound Playback on Message Send**
   *
   * *For any* successfully sent message (text, sticker, or media) where disableSoundForMessage
   * is false, the CometChatSoundManager should play the outgoing message sound (or custom sound
   * if provided).
   *
   * **Validates: Requirements 7.1, 7.3, 7.5, 7.6**
   *
   * Feature: message-composer-react-parity, Property 11: Sound Playback on Message Send
   */
  describe('Property 11: Sound Playback on Message Send', () => {
    /**
     * Message types that can be sent from the composer
     */
    type MessageType = 'text' | 'media' | 'sticker';

    /**
     * Sound configuration for the composer
     */
    interface SoundConfig {
      /** Whether sound is disabled */
      disableSoundForMessage: boolean;
      /** Custom sound URL (undefined means use default) */
      customSoundForMessage: string | undefined;
    }

    /**
     * Result of a sound playback decision
     */
    interface SoundPlaybackResult {
      /** Whether sound should be played */
      shouldPlaySound: boolean;
      /** The sound URL to play (null for default, string for custom) */
      soundUrl: string | null;
    }

    /**
     * Mock sound manager that tracks play calls
     */
    class MockSoundManager {
      private playCalls: { soundType: string; customUrl: string | null }[] = [];
      private shouldThrowError = false;

      /**
       * Simulates playing a sound
       * @param soundType - The type of sound to play
       * @param customUrl - Custom sound URL or null for default
       */
      play(soundType: string, customUrl: string | null): void {
        if (this.shouldThrowError) {
          throw new Error('Sound playback failed');
        }
        this.playCalls.push({ soundType, customUrl });
      }

      /**
       * Gets all play calls made
       */
      getPlayCalls(): { soundType: string; customUrl: string | null }[] {
        return [...this.playCalls];
      }

      /**
       * Gets the count of play calls
       */
      getPlayCount(): number {
        return this.playCalls.length;
      }

      /**
       * Gets the last play call
       */
      getLastPlayCall(): { soundType: string; customUrl: string | null } | undefined {
        return this.playCalls[this.playCalls.length - 1];
      }

      /**
       * Sets whether the next play call should throw an error
       */
      setThrowError(shouldThrow: boolean): void {
        this.shouldThrowError = shouldThrow;
      }

      /**
       * Resets the mock state
       */
      reset(): void {
        this.playCalls = [];
        this.shouldThrowError = false;
      }
    }

    /**
     * Determines whether sound should be played and what sound to use.
     * Mirrors the component's playOutgoingMessageSound method logic.
     *
     * @param config - Sound configuration
     * @returns Sound playback decision result
     */
    function determineSoundPlayback(config: SoundConfig): SoundPlaybackResult {
      // If sound is disabled, don't play
      if (config.disableSoundForMessage) {
        return {
          shouldPlaySound: false,
          soundUrl: null,
        };
      }

      // Sound should be played
      // Use custom sound if provided, otherwise use default (null)
      return {
        shouldPlaySound: true,
        soundUrl: config.customSoundForMessage || null,
      };
    }

    /**
     * Simulates playing outgoing message sound.
     * Mirrors the component's playOutgoingMessageSound method.
     *
     * @param config - Sound configuration
     * @param soundManager - Mock sound manager
     * @returns Whether sound was played successfully
     */
    function playOutgoingMessageSound(
      config: SoundConfig,
      soundManager: MockSoundManager
    ): boolean {
      // Check if sound is disabled
      if (config.disableSoundForMessage) {
        return false;
      }

      try {
        // Play outgoing message sound
        // Uses customSoundForMessage if provided, otherwise plays default sound
        soundManager.play('outgoingMessage', config.customSoundForMessage || null);
        return true;
      } catch (error) {
        // Log but don't propagate - sound is non-critical
        console.error('[MockSoundManager] Error playing sound:', error);
        return false;
      }
    }

    /**
     * Simulates sending a message and playing sound.
     * Mirrors the component's message send flow.
     *
     * @param messageType - Type of message being sent
     * @param config - Sound configuration
     * @param soundManager - Mock sound manager
     * @returns Object with send result and sound playback info
     */
    function simulateMessageSendWithSound(
      messageType: MessageType,
      config: SoundConfig,
      soundManager: MockSoundManager
    ): { messageSent: boolean; soundPlayed: boolean } {
      // Simulate successful message send
      const messageSent = true;

      // Play sound after successful send (for all message types)
      const soundPlayed = playOutgoingMessageSound(config, soundManager);

      return { messageSent, soundPlayed };
    }

    // ==================== Generators ====================

    /**
     * Generator for message types
     */
    const messageTypeGenerator = (): fc.Arbitrary<MessageType> =>
      fc.constantFrom('text', 'media', 'sticker');

    /**
     * Generator for custom sound URLs
     */
    const customSoundUrlGenerator = (): fc.Arbitrary<string> =>
      fc.oneof(
        fc.constant('assets/sounds/custom-send.mp3'),
        fc.constant('https://example.com/sounds/notification.wav'),
        fc.constant('/sounds/message-sent.ogg'),
        fc
          .string({ minLength: 5, maxLength: 100 })
          .map(s => `sounds/${s.replace(/[^a-zA-Z0-9]/g, '')}.mp3`),
        fc.webUrl().map(url => `${url}/sound.mp3`)
      );

    /**
     * Generator for sound configuration
     */
    const soundConfigGenerator = (): fc.Arbitrary<SoundConfig> =>
      fc.record({
        disableSoundForMessage: fc.boolean(),
        customSoundForMessage: fc.option(customSoundUrlGenerator(), { nil: undefined }),
      });

    /**
     * Generator for sound configuration with sound enabled
     */
    const soundEnabledConfigGenerator = (): fc.Arbitrary<SoundConfig> =>
      fc.record({
        disableSoundForMessage: fc.constant(false),
        customSoundForMessage: fc.option(customSoundUrlGenerator(), { nil: undefined }),
      });

    /**
     * Generator for sound configuration with sound disabled
     */
    const soundDisabledConfigGenerator = (): fc.Arbitrary<SoundConfig> =>
      fc.record({
        disableSoundForMessage: fc.constant(true),
        customSoundForMessage: fc.option(customSoundUrlGenerator(), { nil: undefined }),
      });

    // ==================== Property Tests ====================

    it('should play sound when disableSoundForMessage is false', () => {
      fc.assert(
        fc.property(
          messageTypeGenerator(),
          soundEnabledConfigGenerator(),
          (messageType, config) => {
            const soundManager = new MockSoundManager();

            const result = simulateMessageSendWithSound(messageType, config, soundManager);

            // Sound should be played
            expect(result.soundPlayed).toBe(true);
            expect(soundManager.getPlayCount()).toBe(1);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should NOT play sound when disableSoundForMessage is true', () => {
      fc.assert(
        fc.property(
          messageTypeGenerator(),
          soundDisabledConfigGenerator(),
          (messageType, config) => {
            const soundManager = new MockSoundManager();

            const result = simulateMessageSendWithSound(messageType, config, soundManager);

            // Sound should NOT be played
            expect(result.soundPlayed).toBe(false);
            expect(soundManager.getPlayCount()).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should use custom sound URL when customSoundForMessage is provided', () => {
      fc.assert(
        fc.property(
          messageTypeGenerator(),
          customSoundUrlGenerator(),
          (messageType, customSoundUrl) => {
            const config: SoundConfig = {
              disableSoundForMessage: false,
              customSoundForMessage: customSoundUrl,
            };
            const soundManager = new MockSoundManager();

            simulateMessageSendWithSound(messageType, config, soundManager);

            // Should use custom sound URL
            const lastCall = soundManager.getLastPlayCall();
            expect(lastCall).toBeDefined();
            expect(lastCall?.customUrl).toBe(customSoundUrl);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should use default sound (null) when customSoundForMessage is not provided', () => {
      fc.assert(
        fc.property(messageTypeGenerator(), messageType => {
          const config: SoundConfig = {
            disableSoundForMessage: false,
            customSoundForMessage: undefined,
          };
          const soundManager = new MockSoundManager();

          simulateMessageSendWithSound(messageType, config, soundManager);

          // Should use default sound (null)
          const lastCall = soundManager.getLastPlayCall();
          expect(lastCall).toBeDefined();
          expect(lastCall?.customUrl).toBeNull();
        }),
        { numRuns: 100 }
      );
    });

    it('should play sound for text messages when sound is enabled', () => {
      fc.assert(
        fc.property(soundEnabledConfigGenerator(), config => {
          const soundManager = new MockSoundManager();

          const result = simulateMessageSendWithSound('text', config, soundManager);

          // Sound should be played for text messages
          expect(result.soundPlayed).toBe(true);
          expect(soundManager.getPlayCount()).toBe(1);
          expect(soundManager.getLastPlayCall()?.soundType).toBe('outgoingMessage');
        }),
        { numRuns: 100 }
      );
    });

    it('should play sound for media messages when sound is enabled', () => {
      fc.assert(
        fc.property(soundEnabledConfigGenerator(), config => {
          const soundManager = new MockSoundManager();

          const result = simulateMessageSendWithSound('media', config, soundManager);

          // Sound should be played for media messages
          expect(result.soundPlayed).toBe(true);
          expect(soundManager.getPlayCount()).toBe(1);
          expect(soundManager.getLastPlayCall()?.soundType).toBe('outgoingMessage');
        }),
        { numRuns: 100 }
      );
    });

    it('should play sound for sticker messages when sound is enabled', () => {
      fc.assert(
        fc.property(soundEnabledConfigGenerator(), config => {
          const soundManager = new MockSoundManager();

          const result = simulateMessageSendWithSound('sticker', config, soundManager);

          // Sound should be played for sticker messages
          expect(result.soundPlayed).toBe(true);
          expect(soundManager.getPlayCount()).toBe(1);
          expect(soundManager.getLastPlayCall()?.soundType).toBe('outgoingMessage');
        }),
        { numRuns: 100 }
      );
    });

    it('should play same sound type for all message types', () => {
      fc.assert(
        fc.property(soundEnabledConfigGenerator(), config => {
          const textSoundManager = new MockSoundManager();
          const mediaSoundManager = new MockSoundManager();
          const stickerSoundManager = new MockSoundManager();

          simulateMessageSendWithSound('text', config, textSoundManager);
          simulateMessageSendWithSound('media', config, mediaSoundManager);
          simulateMessageSendWithSound('sticker', config, stickerSoundManager);

          // All should use the same sound type
          expect(textSoundManager.getLastPlayCall()?.soundType).toBe('outgoingMessage');
          expect(mediaSoundManager.getLastPlayCall()?.soundType).toBe('outgoingMessage');
          expect(stickerSoundManager.getLastPlayCall()?.soundType).toBe('outgoingMessage');

          // All should use the same custom URL (or null for default)
          // When customSoundForMessage is undefined or empty, null is passed to play()
          const expectedUrl = config.customSoundForMessage || null;
          expect(textSoundManager.getLastPlayCall()?.customUrl).toBe(expectedUrl);
          expect(mediaSoundManager.getLastPlayCall()?.customUrl).toBe(expectedUrl);
          expect(stickerSoundManager.getLastPlayCall()?.customUrl).toBe(expectedUrl);
        }),
        { numRuns: 100 }
      );
    });

    it('should handle sound playback errors gracefully', () => {
      fc.assert(
        fc.property(
          messageTypeGenerator(),
          soundEnabledConfigGenerator(),
          (messageType, config) => {
            const soundManager = new MockSoundManager();
            soundManager.setThrowError(true);

            // Should not throw, just return false
            const result = simulateMessageSendWithSound(messageType, config, soundManager);

            // Sound playback failed but message was still sent
            expect(result.messageSent).toBe(true);
            expect(result.soundPlayed).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should correctly determine sound playback for any configuration', () => {
      fc.assert(
        fc.property(soundConfigGenerator(), config => {
          const decision = determineSoundPlayback(config);

          if (config.disableSoundForMessage) {
            // Sound should not be played when disabled
            expect(decision.shouldPlaySound).toBe(false);
          } else {
            // Sound should be played when enabled
            expect(decision.shouldPlaySound).toBe(true);
            // Should use custom URL if provided, otherwise null
            expect(decision.soundUrl).toBe(config.customSoundForMessage || null);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should be deterministic - same config always produces same result', () => {
      fc.assert(
        fc.property(
          soundConfigGenerator(),
          fc.integer({ min: 2, max: 5 }),
          (config, repeatCount) => {
            const results: SoundPlaybackResult[] = [];

            for (let i = 0; i < repeatCount; i++) {
              results.push(determineSoundPlayback(config));
            }

            // All results should be identical
            for (let i = 1; i < results.length; i++) {
              expect(results[i].shouldPlaySound).toBe(results[0].shouldPlaySound);
              expect(results[i].soundUrl).toBe(results[0].soundUrl);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should ignore customSoundForMessage when sound is disabled', () => {
      fc.assert(
        fc.property(
          messageTypeGenerator(),
          customSoundUrlGenerator(),
          (messageType, customSoundUrl) => {
            const config: SoundConfig = {
              disableSoundForMessage: true,
              customSoundForMessage: customSoundUrl,
            };
            const soundManager = new MockSoundManager();

            const result = simulateMessageSendWithSound(messageType, config, soundManager);

            // Sound should NOT be played even with custom URL
            expect(result.soundPlayed).toBe(false);
            expect(soundManager.getPlayCount()).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should play sound exactly once per message send', () => {
      fc.assert(
        fc.property(
          messageTypeGenerator(),
          soundEnabledConfigGenerator(),
          (messageType, config) => {
            const soundManager = new MockSoundManager();

            simulateMessageSendWithSound(messageType, config, soundManager);

            // Should play exactly once
            expect(soundManager.getPlayCount()).toBe(1);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle multiple consecutive message sends correctly', () => {
      fc.assert(
        fc.property(
          fc.array(messageTypeGenerator(), { minLength: 2, maxLength: 10 }),
          soundEnabledConfigGenerator(),
          (messageTypes, config) => {
            const soundManager = new MockSoundManager();

            // Send multiple messages
            for (const messageType of messageTypes) {
              simulateMessageSendWithSound(messageType, config, soundManager);
            }

            // Should have played sound for each message
            expect(soundManager.getPlayCount()).toBe(messageTypes.length);

            // All play calls should use the same configuration
            const expectedUrl = config.customSoundForMessage || null;
            for (const call of soundManager.getPlayCalls()) {
              expect(call.soundType).toBe('outgoingMessage');
              expect(call.customUrl).toBe(expectedUrl);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle empty string customSoundForMessage as falsy (use default)', () => {
      fc.assert(
        fc.property(messageTypeGenerator(), messageType => {
          const config: SoundConfig = {
            disableSoundForMessage: false,
            customSoundForMessage: '',
          };
          const soundManager = new MockSoundManager();

          simulateMessageSendWithSound(messageType, config, soundManager);

          // Empty string should be treated as falsy, use default (null)
          const lastCall = soundManager.getLastPlayCall();
          expect(lastCall).toBeDefined();
          expect(lastCall?.customUrl).toBeNull();
        }),
        { numRuns: 100 }
      );
    });

    it('should preserve message send success regardless of sound playback result', () => {
      fc.assert(
        fc.property(
          messageTypeGenerator(),
          soundConfigGenerator(),
          fc.boolean(),
          (messageType, config, shouldThrowError) => {
            const soundManager = new MockSoundManager();
            soundManager.setThrowError(shouldThrowError);

            const result = simulateMessageSendWithSound(messageType, config, soundManager);

            // Message should always be sent successfully
            expect(result.messageSent).toBe(true);

            // Sound playback depends on config and error state
            if (config.disableSoundForMessage || shouldThrowError) {
              expect(result.soundPlayed).toBe(false);
            } else {
              expect(result.soundPlayed).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should use outgoingMessage sound type consistently', () => {
      fc.assert(
        fc.property(
          messageTypeGenerator(),
          soundEnabledConfigGenerator(),
          (messageType, config) => {
            const soundManager = new MockSoundManager();

            simulateMessageSendWithSound(messageType, config, soundManager);

            // Should always use outgoingMessage sound type
            const lastCall = soundManager.getLastPlayCall();
            expect(lastCall?.soundType).toBe('outgoingMessage');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Property 14: Typing Indicator Lifecycle**
   *
   * *For any* typing activity in the editor where disableTypingEvents is false and the user
   * is not blocked, startTyping should be called on first keystroke, and endTyping should be
   * called after 500ms of inactivity or when a message is sent.
   *
   * **Validates: Requirements 11.1, 11.2, 11.6, 11.8**
   *
   * Feature: message-composer-react-parity, Property 14: Typing Indicator Lifecycle
   */
  describe('Property 14: Typing Indicator Lifecycle', () => {
    /**
     * Typing indicator configuration
     */
    interface TypingConfig {
      /** Whether typing events are disabled */
      disableTypingEvents: boolean;
      /** Whether the user is blocked by me */
      blockedByMe: boolean;
      /** Whether the user has blocked me */
      hasBlockedMe: boolean;
    }

    /**
     * Typing indicator state
     */
    interface TypingState {
      /** Whether typing indicator is currently active */
      isTyping: boolean;
      /** The timeout handle for ending typing */
      typingTimeout: ReturnType<typeof setTimeout> | undefined;
      /** Number of startTyping calls made */
      startTypingCallCount: number;
      /** Number of endTyping calls made */
      endTypingCallCount: number;
    }

    /**
     * Mock typing indicator manager that tracks start/end calls
     */
    class MockTypingIndicatorManager {
      private startCalls: number[] = [];
      private endCalls: number[] = [];
      private currentTime = 0;

      /**
       * Records a startTyping call
       */
      startTyping(): void {
        this.startCalls.push(this.currentTime);
      }

      /**
       * Records an endTyping call
       */
      endTyping(): void {
        this.endCalls.push(this.currentTime);
      }

      /**
       * Gets the count of startTyping calls
       */
      getStartTypingCount(): number {
        return this.startCalls.length;
      }

      /**
       * Gets the count of endTyping calls
       */
      getEndTypingCount(): number {
        return this.endCalls.length;
      }

      /**
       * Gets all startTyping call timestamps
       */
      getStartTypingCalls(): number[] {
        return [...this.startCalls];
      }

      /**
       * Gets all endTyping call timestamps
       */
      getEndTypingCalls(): number[] {
        return [...this.endCalls];
      }

      /**
       * Advances the current time
       */
      advanceTime(ms: number): void {
        this.currentTime += ms;
      }

      /**
       * Gets the current time
       */
      getCurrentTime(): number {
        return this.currentTime;
      }

      /**
       * Resets the mock state
       */
      reset(): void {
        this.startCalls = [];
        this.endCalls = [];
        this.currentTime = 0;
      }
    }

    /**
     * Typing timeout constant (500ms as per requirements)
     */
    const TYPING_TIMEOUT_MS = 500;

    /**
     * Determines if typing indicators should be sent based on configuration.
     * Mirrors the component's typing indicator suppression logic.
     *
     * @param config - Typing configuration
     * @returns Whether typing indicators should be sent
     */
    function shouldSendTypingIndicators(config: TypingConfig): boolean {
      // Typing indicators are suppressed when:
      // - disableTypingEvents is true
      // - The user is blocked (either blocked by me or has blocked me)
      if (config.disableTypingEvents) {
        return false;
      }
      if (config.blockedByMe || config.hasBlockedMe) {
        return false;
      }
      return true;
    }

    /**
     * Creates initial typing state
     */
    function createInitialTypingState(): TypingState {
      return {
        isTyping: false,
        typingTimeout: undefined,
        startTypingCallCount: 0,
        endTypingCallCount: 0,
      };
    }

    /**
     * Simulates handling a keystroke for typing indicator.
     * Mirrors the component's handleTypingStart method.
     *
     * @param state - Current typing state
     * @param config - Typing configuration
     * @param manager - Mock typing indicator manager
     * @param pendingTimeouts - Array to track pending timeouts for cleanup
     * @returns Updated typing state
     */
    function handleTypingStart(
      state: TypingState,
      config: TypingConfig,
      manager: MockTypingIndicatorManager,
      pendingTimeouts: ReturnType<typeof setTimeout>[]
    ): TypingState {
      // Check if typing events are disabled
      if (config.disableTypingEvents) {
        return state;
      }

      // Check if user is blocked
      if (config.blockedByMe || config.hasBlockedMe) {
        return state;
      }

      // Clear existing timeout if any
      if (state.typingTimeout) {
        clearTimeout(state.typingTimeout);
        // Remove from pending timeouts
        const index = pendingTimeouts.indexOf(state.typingTimeout);
        if (index > -1) {
          pendingTimeouts.splice(index, 1);
        }
      } else {
        // No existing timeout means this is the first keystroke
        // Call startTyping only on first keystroke
        manager.startTyping();
        state.startTypingCallCount++;
      }

      // Set timeout to end typing after 500ms of inactivity
      const newTimeout = setTimeout(() => {
        manager.endTyping();
        state.endTypingCallCount++;
        state.isTyping = false;
        state.typingTimeout = undefined;
      }, TYPING_TIMEOUT_MS);

      pendingTimeouts.push(newTimeout);

      return {
        ...state,
        isTyping: true,
        typingTimeout: newTimeout,
      };
    }

    /**
     * Simulates ending typing indicator when message is sent.
     * Mirrors the component's behavior in sendTextMessage.
     *
     * @param state - Current typing state
     * @param config - Typing configuration
     * @param manager - Mock typing indicator manager
     * @param pendingTimeouts - Array to track pending timeouts for cleanup
     * @returns Updated typing state
     */
    function handleMessageSent(
      state: TypingState,
      config: TypingConfig,
      manager: MockTypingIndicatorManager,
      pendingTimeouts: ReturnType<typeof setTimeout>[]
    ): TypingState {
      // Only handle if typing events are enabled
      if (config.disableTypingEvents) {
        return state;
      }

      // Clear the typing timeout to prevent double endTyping calls
      if (state.typingTimeout) {
        clearTimeout(state.typingTimeout);
        // Remove from pending timeouts
        const index = pendingTimeouts.indexOf(state.typingTimeout);
        if (index > -1) {
          pendingTimeouts.splice(index, 1);
        }
      }

      // End typing indicator
      manager.endTyping();

      return {
        ...state,
        isTyping: false,
        typingTimeout: undefined,
        endTypingCallCount: state.endTypingCallCount + 1,
      };
    }

    /**
     * Simulates a sequence of keystrokes with timing.
     * Returns the final state and call counts.
     *
     * @param keystrokeCount - Number of keystrokes to simulate
     * @param keystrokeIntervalMs - Interval between keystrokes in ms
     * @param config - Typing configuration
     * @param manager - Mock typing indicator manager
     * @param pendingTimeouts - Array to track pending timeouts for cleanup
     * @returns Final typing state
     */
    function simulateKeystrokes(
      keystrokeCount: number,
      keystrokeIntervalMs: number,
      config: TypingConfig,
      manager: MockTypingIndicatorManager,
      pendingTimeouts: ReturnType<typeof setTimeout>[]
    ): TypingState {
      let state = createInitialTypingState();

      for (let i = 0; i < keystrokeCount; i++) {
        state = handleTypingStart(state, config, manager, pendingTimeouts);
        manager.advanceTime(keystrokeIntervalMs);
      }

      return state;
    }

    /**
     * Cleans up all pending timeouts
     */
    function cleanupTimeouts(pendingTimeouts: ReturnType<typeof setTimeout>[]): void {
      for (const timeout of pendingTimeouts) {
        clearTimeout(timeout);
      }
      pendingTimeouts.length = 0;
    }

    // ==================== Generators ====================

    /**
     * Generator for typing configuration with typing enabled and user not blocked
     */
    const typingEnabledConfigGenerator = (): fc.Arbitrary<TypingConfig> =>
      fc.constant({
        disableTypingEvents: false,
        blockedByMe: false,
        hasBlockedMe: false,
      });

    /**
     * Generator for typing configuration with typing disabled
     */
    const typingDisabledConfigGenerator = (): fc.Arbitrary<TypingConfig> =>
      fc.record({
        disableTypingEvents: fc.constant(true),
        blockedByMe: fc.boolean(),
        hasBlockedMe: fc.boolean(),
      });

    /**
     * Generator for typing configuration with user blocked
     */
    const userBlockedConfigGenerator = (): fc.Arbitrary<TypingConfig> =>
      fc
        .record({
          disableTypingEvents: fc.constant(false),
          blockedByMe: fc.boolean(),
          hasBlockedMe: fc.boolean(),
        })
        .filter(config => config.blockedByMe || config.hasBlockedMe);

    /**
     * Generator for any typing configuration
     */
    const typingConfigGenerator = (): fc.Arbitrary<TypingConfig> =>
      fc.record({
        disableTypingEvents: fc.boolean(),
        blockedByMe: fc.boolean(),
        hasBlockedMe: fc.boolean(),
      });

    /**
     * Generator for keystroke count (reasonable range for testing)
     */
    const keystrokeCountGenerator = (): fc.Arbitrary<number> => fc.integer({ min: 1, max: 20 });

    /**
     * Generator for keystroke interval in ms (less than timeout to keep typing active)
     */
    const fastKeystrokeIntervalGenerator = (): fc.Arbitrary<number> =>
      fc.integer({ min: 50, max: 400 });

    /**
     * Generator for keystroke interval that would trigger timeout
     */
    const slowKeystrokeIntervalGenerator = (): fc.Arbitrary<number> =>
      fc.integer({ min: 501, max: 1000 });

    // ==================== Property Tests ====================

    it('should call startTyping on first keystroke when typing is enabled', () => {
      fc.assert(
        fc.property(typingEnabledConfigGenerator(), config => {
          const manager = new MockTypingIndicatorManager();
          const pendingTimeouts: ReturnType<typeof setTimeout>[] = [];

          try {
            let state = createInitialTypingState();

            // First keystroke
            state = handleTypingStart(state, config, manager, pendingTimeouts);

            // startTyping should be called exactly once
            expect(manager.getStartTypingCount()).toBe(1);
          } finally {
            cleanupTimeouts(pendingTimeouts);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should NOT call startTyping on subsequent keystrokes (only timeout reset)', () => {
      fc.assert(
        fc.property(
          typingEnabledConfigGenerator(),
          keystrokeCountGenerator(),
          (config, keystrokeCount) => {
            const manager = new MockTypingIndicatorManager();
            const pendingTimeouts: ReturnType<typeof setTimeout>[] = [];

            try {
              // Simulate multiple keystrokes with short intervals (no timeout triggers)
              simulateKeystrokes(keystrokeCount, 100, config, manager, pendingTimeouts);

              // startTyping should be called exactly once (on first keystroke only)
              expect(manager.getStartTypingCount()).toBe(1);
            } finally {
              cleanupTimeouts(pendingTimeouts);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should NOT send typing indicators when disableTypingEvents is true', () => {
      fc.assert(
        fc.property(
          typingDisabledConfigGenerator(),
          keystrokeCountGenerator(),
          (config, keystrokeCount) => {
            const manager = new MockTypingIndicatorManager();
            const pendingTimeouts: ReturnType<typeof setTimeout>[] = [];

            try {
              // Simulate keystrokes with typing disabled
              simulateKeystrokes(keystrokeCount, 100, config, manager, pendingTimeouts);

              // No typing indicators should be sent
              expect(manager.getStartTypingCount()).toBe(0);
              expect(manager.getEndTypingCount()).toBe(0);
            } finally {
              cleanupTimeouts(pendingTimeouts);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should NOT send typing indicators when user is blocked', () => {
      fc.assert(
        fc.property(
          userBlockedConfigGenerator(),
          keystrokeCountGenerator(),
          (config, keystrokeCount) => {
            const manager = new MockTypingIndicatorManager();
            const pendingTimeouts: ReturnType<typeof setTimeout>[] = [];

            try {
              // Simulate keystrokes with user blocked
              simulateKeystrokes(keystrokeCount, 100, config, manager, pendingTimeouts);

              // No typing indicators should be sent
              expect(manager.getStartTypingCount()).toBe(0);
              expect(manager.getEndTypingCount()).toBe(0);
            } finally {
              cleanupTimeouts(pendingTimeouts);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should call endTyping when message is sent', () => {
      fc.assert(
        fc.property(
          typingEnabledConfigGenerator(),
          keystrokeCountGenerator(),
          (config, keystrokeCount) => {
            const manager = new MockTypingIndicatorManager();
            const pendingTimeouts: ReturnType<typeof setTimeout>[] = [];

            try {
              // Simulate keystrokes
              let state = simulateKeystrokes(keystrokeCount, 100, config, manager, pendingTimeouts);

              // Send message
              state = handleMessageSent(state, config, manager, pendingTimeouts);

              // endTyping should be called when message is sent
              expect(manager.getEndTypingCount()).toBe(1);
              // Typing state should be cleared
              expect(state.isTyping).toBe(false);
              expect(state.typingTimeout).toBeUndefined();
            } finally {
              cleanupTimeouts(pendingTimeouts);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should correctly determine if typing indicators should be sent', () => {
      fc.assert(
        fc.property(typingConfigGenerator(), config => {
          const shouldSend = shouldSendTypingIndicators(config);

          if (config.disableTypingEvents) {
            expect(shouldSend).toBe(false);
          } else if (config.blockedByMe || config.hasBlockedMe) {
            expect(shouldSend).toBe(false);
          } else {
            expect(shouldSend).toBe(true);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should reset timeout on each keystroke', () => {
      fc.assert(
        fc.property(
          typingEnabledConfigGenerator(),
          fc.integer({ min: 2, max: 10 }),
          (config, keystrokeCount) => {
            const manager = new MockTypingIndicatorManager();
            const pendingTimeouts: ReturnType<typeof setTimeout>[] = [];

            try {
              let state = createInitialTypingState();
              let previousTimeout: ReturnType<typeof setTimeout> | undefined;

              for (let i = 0; i < keystrokeCount; i++) {
                previousTimeout = state.typingTimeout;
                state = handleTypingStart(state, config, manager, pendingTimeouts);

                // Each keystroke should create a new timeout
                expect(state.typingTimeout).toBeDefined();

                // After first keystroke, timeout should be different from previous
                if (i > 0 && previousTimeout !== undefined) {
                  // The timeout reference should change (new timeout created)
                  // Note: We can't directly compare timeout handles, but we can verify
                  // that the state is properly updated
                  expect(state.isTyping).toBe(true);
                }
              }

              // Only one startTyping call despite multiple keystrokes
              expect(manager.getStartTypingCount()).toBe(1);
            } finally {
              cleanupTimeouts(pendingTimeouts);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle rapid keystrokes without multiple startTyping calls', () => {
      fc.assert(
        fc.property(
          typingEnabledConfigGenerator(),
          fc.integer({ min: 5, max: 50 }),
          fastKeystrokeIntervalGenerator(),
          (config, keystrokeCount, interval) => {
            const manager = new MockTypingIndicatorManager();
            const pendingTimeouts: ReturnType<typeof setTimeout>[] = [];

            try {
              // Simulate rapid keystrokes
              simulateKeystrokes(keystrokeCount, interval, config, manager, pendingTimeouts);

              // Should only call startTyping once regardless of keystroke count
              expect(manager.getStartTypingCount()).toBe(1);
            } finally {
              cleanupTimeouts(pendingTimeouts);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should be deterministic - same inputs produce same typing indicator calls', () => {
      fc.assert(
        fc.property(
          typingConfigGenerator(),
          keystrokeCountGenerator(),
          fc.integer({ min: 2, max: 5 }),
          (config, keystrokeCount, repeatCount) => {
            const results: { startCount: number; shouldSend: boolean }[] = [];

            for (let i = 0; i < repeatCount; i++) {
              const manager = new MockTypingIndicatorManager();
              const pendingTimeouts: ReturnType<typeof setTimeout>[] = [];

              try {
                simulateKeystrokes(keystrokeCount, 100, config, manager, pendingTimeouts);
                results.push({
                  startCount: manager.getStartTypingCount(),
                  shouldSend: shouldSendTypingIndicators(config),
                });
              } finally {
                cleanupTimeouts(pendingTimeouts);
              }
            }

            // All results should be identical
            for (let i = 1; i < results.length; i++) {
              expect(results[i].startCount).toBe(results[0].startCount);
              expect(results[i].shouldSend).toBe(results[0].shouldSend);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should clear typing state when message is sent', () => {
      fc.assert(
        fc.property(typingEnabledConfigGenerator(), config => {
          const manager = new MockTypingIndicatorManager();
          const pendingTimeouts: ReturnType<typeof setTimeout>[] = [];

          try {
            // Start typing
            let state = createInitialTypingState();
            state = handleTypingStart(state, config, manager, pendingTimeouts);

            // Verify typing is active
            expect(state.isTyping).toBe(true);
            expect(state.typingTimeout).toBeDefined();

            // Send message
            state = handleMessageSent(state, config, manager, pendingTimeouts);

            // Typing state should be cleared
            expect(state.isTyping).toBe(false);
            expect(state.typingTimeout).toBeUndefined();
          } finally {
            cleanupTimeouts(pendingTimeouts);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should handle message sent without prior typing gracefully', () => {
      fc.assert(
        fc.property(typingEnabledConfigGenerator(), config => {
          const manager = new MockTypingIndicatorManager();
          const pendingTimeouts: ReturnType<typeof setTimeout>[] = [];

          try {
            // Send message without typing first
            let state = createInitialTypingState();
            state = handleMessageSent(state, config, manager, pendingTimeouts);

            // Should still call endTyping (component behavior)
            expect(manager.getEndTypingCount()).toBe(1);
            // State should remain cleared
            expect(state.isTyping).toBe(false);
          } finally {
            cleanupTimeouts(pendingTimeouts);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should not call endTyping on message send when typing is disabled', () => {
      fc.assert(
        fc.property(typingDisabledConfigGenerator(), config => {
          const manager = new MockTypingIndicatorManager();
          const pendingTimeouts: ReturnType<typeof setTimeout>[] = [];

          try {
            // Try to type (should be ignored)
            let state = createInitialTypingState();
            state = handleTypingStart(state, config, manager, pendingTimeouts);

            // Send message
            state = handleMessageSent(state, config, manager, pendingTimeouts);

            // No typing indicators should be sent
            expect(manager.getStartTypingCount()).toBe(0);
            expect(manager.getEndTypingCount()).toBe(0);
          } finally {
            cleanupTimeouts(pendingTimeouts);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should handle multiple message sends correctly', () => {
      fc.assert(
        fc.property(
          typingEnabledConfigGenerator(),
          fc.integer({ min: 2, max: 5 }),
          (config, messageCount) => {
            const manager = new MockTypingIndicatorManager();
            const pendingTimeouts: ReturnType<typeof setTimeout>[] = [];

            try {
              let state = createInitialTypingState();

              for (let i = 0; i < messageCount; i++) {
                // Type something
                state = handleTypingStart(state, config, manager, pendingTimeouts);
                // Send message
                state = handleMessageSent(state, config, manager, pendingTimeouts);
              }

              // Should have called startTyping for each typing session
              expect(manager.getStartTypingCount()).toBe(messageCount);
              // Should have called endTyping for each message send
              expect(manager.getEndTypingCount()).toBe(messageCount);
            } finally {
              cleanupTimeouts(pendingTimeouts);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should use 500ms timeout constant', () => {
      // Verify the timeout constant matches requirements
      expect(TYPING_TIMEOUT_MS).toBe(500);
    });

    it('should handle blockedByMe flag correctly', () => {
      fc.assert(
        fc.property(
          fc.constant({
            disableTypingEvents: false,
            blockedByMe: true,
            hasBlockedMe: false,
          }),
          keystrokeCountGenerator(),
          (config, keystrokeCount) => {
            const manager = new MockTypingIndicatorManager();
            const pendingTimeouts: ReturnType<typeof setTimeout>[] = [];

            try {
              simulateKeystrokes(keystrokeCount, 100, config, manager, pendingTimeouts);

              // No typing indicators when blocked by me
              expect(manager.getStartTypingCount()).toBe(0);
              expect(shouldSendTypingIndicators(config)).toBe(false);
            } finally {
              cleanupTimeouts(pendingTimeouts);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle hasBlockedMe flag correctly', () => {
      fc.assert(
        fc.property(
          fc.constant({
            disableTypingEvents: false,
            blockedByMe: false,
            hasBlockedMe: true,
          }),
          keystrokeCountGenerator(),
          (config, keystrokeCount) => {
            const manager = new MockTypingIndicatorManager();
            const pendingTimeouts: ReturnType<typeof setTimeout>[] = [];

            try {
              simulateKeystrokes(keystrokeCount, 100, config, manager, pendingTimeouts);

              // No typing indicators when user has blocked me
              expect(manager.getStartTypingCount()).toBe(0);
              expect(shouldSendTypingIndicators(config)).toBe(false);
            } finally {
              cleanupTimeouts(pendingTimeouts);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle both blocked flags correctly', () => {
      fc.assert(
        fc.property(
          fc.constant({
            disableTypingEvents: false,
            blockedByMe: true,
            hasBlockedMe: true,
          }),
          keystrokeCountGenerator(),
          (config, keystrokeCount) => {
            const manager = new MockTypingIndicatorManager();
            const pendingTimeouts: ReturnType<typeof setTimeout>[] = [];

            try {
              simulateKeystrokes(keystrokeCount, 100, config, manager, pendingTimeouts);

              // No typing indicators when both blocked
              expect(manager.getStartTypingCount()).toBe(0);
              expect(shouldSendTypingIndicators(config)).toBe(false);
            } finally {
              cleanupTimeouts(pendingTimeouts);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Property 16: Conversation Context Reset**
   *
   * *For any* change to the user or group input, the composer should clear text content,
   * attachments, edit mode, reply mode, and close all popovers.
   *
   * **Validates: Requirements 14.1, 14.2, 14.3, 14.4, 14.5, 14.6**
   *
   * Feature: message-composer-react-parity, Property 16: Conversation Context Reset
   */
  describe('Property 16: Conversation Context Reset', () => {
    /**
     * Content display type matching the component's contentToDisplay signal
     */
    type ContentToDisplay =
      | 'attachments'
      | 'emojiKeyboard'
      | 'voiceRecording'
      | 'stickers'
      | 'ai'
      | 'none';

    /**
     * Composer state interface for context reset testing
     */
    interface ComposerState {
      /** Current text content in the composer */
      composerText: string;
      /** Array of attachment files */
      attachments: MockAttachmentFile[];
      /** Message being replied to (quoted reply) */
      messageToReply: MockTextMessage | null;
      /** Message being edited */
      messageToEdit: MockTextMessage | null;
      /** Currently displayed popover content */
      contentToDisplay: ContentToDisplay;
      /** Current user for 1-on-1 conversations */
      user: MockUser | null;
      /** Current group for group conversations */
      group: MockGroup | null;
    }

    /**
     * Creates an initial composer state with default values
     */
    function createInitialComposerState(): ComposerState {
      return {
        composerText: '',
        attachments: [],
        messageToReply: null,
        messageToEdit: null,
        contentToDisplay: 'none',
        user: null,
        group: null,
      };
    }

    /**
     * Creates a composer state with active content (text, attachments, modes, popovers)
     */
    function createActiveComposerState(
      text: string,
      attachments: MockAttachmentFile[],
      messageToReply: MockTextMessage | null,
      messageToEdit: MockTextMessage | null,
      contentToDisplay: ContentToDisplay,
      user: MockUser | null,
      group: MockGroup | null
    ): ComposerState {
      return {
        composerText: text,
        attachments,
        messageToReply,
        messageToEdit,
        contentToDisplay,
        user,
        group,
      };
    }

    /**
     * Handles context change when user or group changes.
     * Mirrors the component's ngOnChanges behavior for user/group changes.
     *
     * @param currentState - Current composer state
     * @param newUser - New user (or null)
     * @param newGroup - New group (or null)
     * @returns New composer state after context reset
     */
    function handleContextChange(
      currentState: ComposerState,
      newUser: MockUser | null,
      newGroup: MockGroup | null
    ): ComposerState {
      // Check if context actually changed
      const userChanged = currentState.user?.getUid() !== newUser?.getUid();
      const groupChanged = currentState.group?.getGuid() !== newGroup?.getGuid();

      if (!userChanged && !groupChanged) {
        // No context change, return state unchanged
        return {
          ...currentState,
          user: newUser,
          group: newGroup,
        };
      }

      // Context changed - reset all state
      return {
        composerText: '', // Clear text content (Requirement 14.1, 14.2)
        attachments: [], // Clear attachments (Requirement 14.3)
        messageToReply: null, // Clear reply mode (Requirement 14.6)
        messageToEdit: null, // Clear edit mode (Requirement 14.5)
        contentToDisplay: 'none', // Close all popovers (Requirement 14.4)
        user: newUser,
        group: newGroup,
      };
    }

    /**
     * Checks if the composer state is properly reset (all content cleared)
     */
    function isComposerStateReset(state: ComposerState): boolean {
      return (
        state.composerText === '' &&
        state.attachments.length === 0 &&
        state.messageToReply === null &&
        state.messageToEdit === null &&
        state.contentToDisplay === 'none'
      );
    }

    /**
     * Checks if the composer has any active content
     */
    function hasActiveContent(state: ComposerState): boolean {
      return (
        state.composerText.trim().length > 0 ||
        state.attachments.length > 0 ||
        state.messageToReply !== null ||
        state.messageToEdit !== null ||
        state.contentToDisplay !== 'none'
      );
    }

    // ==================== Generators ====================

    /**
     * Generator for content display types
     */
    const contentToDisplayGenerator = (): fc.Arbitrary<ContentToDisplay> =>
      fc.constantFrom('attachments', 'emojiKeyboard', 'voiceRecording', 'stickers', 'ai', 'none');

    /**
     * Generator for non-none content display types (active popovers)
     */
    const activeContentToDisplayGenerator = (): fc.Arbitrary<ContentToDisplay> =>
      fc.constantFrom('attachments', 'emojiKeyboard', 'voiceRecording', 'stickers', 'ai');

    /**
     * Generator for composer state with active content
     */
    const activeComposerStateGenerator = (): fc.Arbitrary<ComposerState> =>
      fc
        .record({
          composerText: nonEmptyTextGenerator(),
          attachments: fc.array(attachmentGenerator(), { minLength: 1, maxLength: 5 }),
          messageToReply: fc.option(textMessageGenerator(), { nil: null }),
          messageToEdit: fc.option(textMessageGenerator(), { nil: null }),
          contentToDisplay: activeContentToDisplayGenerator(),
          user: fc.option(userGenerator(), { nil: null }),
          group: fc.option(groupGenerator(), { nil: null }),
        })
        .filter(state => state.user !== null || state.group !== null);

    /**
     * Generator for composer state with text content only
     */
    const composerStateWithTextGenerator = (): fc.Arbitrary<ComposerState> =>
      fc
        .record({
          composerText: nonEmptyTextGenerator(),
          user: fc.option(userGenerator(), { nil: null }),
          group: fc.option(groupGenerator(), { nil: null }),
        })
        .filter(state => state.user !== null || state.group !== null)
        .map(partial => ({
          ...partial,
          attachments: [],
          messageToReply: null,
          messageToEdit: null,
          contentToDisplay: 'none' as ContentToDisplay,
        }));

    /**
     * Generator for composer state with attachments only
     */
    const composerStateWithAttachmentsGenerator = (): fc.Arbitrary<ComposerState> =>
      fc
        .record({
          attachments: fc.array(attachmentGenerator(), { minLength: 1, maxLength: 5 }),
          user: fc.option(userGenerator(), { nil: null }),
          group: fc.option(groupGenerator(), { nil: null }),
        })
        .filter(state => state.user !== null || state.group !== null)
        .map(partial => ({
          ...partial,
          composerText: '',
          messageToReply: null,
          messageToEdit: null,
          contentToDisplay: 'none' as ContentToDisplay,
        }));

    /**
     * Generator for composer state with reply mode active
     */
    const composerStateWithReplyModeGenerator = (): fc.Arbitrary<ComposerState> =>
      fc
        .record({
          messageToReply: textMessageGenerator(),
          user: fc.option(userGenerator(), { nil: null }),
          group: fc.option(groupGenerator(), { nil: null }),
        })
        .filter(state => state.user !== null || state.group !== null)
        .map(partial => ({
          ...partial,
          composerText: '',
          attachments: [],
          messageToEdit: null,
          contentToDisplay: 'none' as ContentToDisplay,
        }));

    /**
     * Generator for composer state with edit mode active
     */
    const composerStateWithEditModeGenerator = (): fc.Arbitrary<ComposerState> =>
      fc
        .record({
          messageToEdit: textMessageGenerator(),
          user: fc.option(userGenerator(), { nil: null }),
          group: fc.option(groupGenerator(), { nil: null }),
        })
        .filter(state => state.user !== null || state.group !== null)
        .map(partial => ({
          ...partial,
          composerText: partial.messageToEdit.getText(),
          attachments: [],
          messageToReply: null,
          contentToDisplay: 'none' as ContentToDisplay,
        }));

    /**
     * Generator for composer state with open popover
     */
    const composerStateWithPopoverGenerator = (): fc.Arbitrary<ComposerState> =>
      fc
        .record({
          contentToDisplay: activeContentToDisplayGenerator(),
          user: fc.option(userGenerator(), { nil: null }),
          group: fc.option(groupGenerator(), { nil: null }),
        })
        .filter(state => state.user !== null || state.group !== null)
        .map(partial => ({
          ...partial,
          composerText: '',
          attachments: [],
          messageToReply: null,
          messageToEdit: null,
        }));

    /**
     * Generator for a different user than the current one
     */
    const differentUserGenerator = (currentUser: MockUser | null): fc.Arbitrary<MockUser> =>
      userGenerator().filter(newUser => newUser.getUid() !== currentUser?.getUid());

    /**
     * Generator for a different group than the current one
     */
    const differentGroupGenerator = (currentGroup: MockGroup | null): fc.Arbitrary<MockGroup> =>
      groupGenerator().filter(newGroup => newGroup.getGuid() !== currentGroup?.getGuid());

    // ==================== Property Tests ====================

    it('should clear composerText when user changes', () => {
      fc.assert(
        fc.property(composerStateWithTextGenerator(), userGenerator(), (initialState, newUser) => {
          // Ensure user actually changes
          if (initialState.user?.getUid() === newUser.getUid()) {
            return; // Skip if same user
          }

          const newState = handleContextChange(initialState, newUser, null);

          // Text should be cleared
          expect(newState.composerText).toBe('');
        }),
        { numRuns: 100 }
      );
    });

    it('should clear composerText when group changes', () => {
      fc.assert(
        fc.property(
          composerStateWithTextGenerator(),
          groupGenerator(),
          (initialState, newGroup) => {
            // Ensure group actually changes
            if (initialState.group?.getGuid() === newGroup.getGuid()) {
              return; // Skip if same group
            }

            const newState = handleContextChange(initialState, null, newGroup);

            // Text should be cleared
            expect(newState.composerText).toBe('');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should clear attachments when user changes', () => {
      fc.assert(
        fc.property(
          composerStateWithAttachmentsGenerator(),
          userGenerator(),
          (initialState, newUser) => {
            // Ensure user actually changes
            if (initialState.user?.getUid() === newUser.getUid()) {
              return; // Skip if same user
            }

            // Verify we have attachments before change
            expect(initialState.attachments.length).toBeGreaterThan(0);

            const newState = handleContextChange(initialState, newUser, null);

            // Attachments should be cleared
            expect(newState.attachments).toEqual([]);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should clear attachments when group changes', () => {
      fc.assert(
        fc.property(
          composerStateWithAttachmentsGenerator(),
          groupGenerator(),
          (initialState, newGroup) => {
            // Ensure group actually changes
            if (initialState.group?.getGuid() === newGroup.getGuid()) {
              return; // Skip if same group
            }

            // Verify we have attachments before change
            expect(initialState.attachments.length).toBeGreaterThan(0);

            const newState = handleContextChange(initialState, null, newGroup);

            // Attachments should be cleared
            expect(newState.attachments).toEqual([]);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should clear messageToReply when user changes', () => {
      fc.assert(
        fc.property(
          composerStateWithReplyModeGenerator(),
          userGenerator(),
          (initialState, newUser) => {
            // Ensure user actually changes
            if (initialState.user?.getUid() === newUser.getUid()) {
              return; // Skip if same user
            }

            // Verify we have reply mode active before change
            expect(initialState.messageToReply).not.toBeNull();

            const newState = handleContextChange(initialState, newUser, null);

            // Reply mode should be cleared
            expect(newState.messageToReply).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should clear messageToReply when group changes', () => {
      fc.assert(
        fc.property(
          composerStateWithReplyModeGenerator(),
          groupGenerator(),
          (initialState, newGroup) => {
            // Ensure group actually changes
            if (initialState.group?.getGuid() === newGroup.getGuid()) {
              return; // Skip if same group
            }

            // Verify we have reply mode active before change
            expect(initialState.messageToReply).not.toBeNull();

            const newState = handleContextChange(initialState, null, newGroup);

            // Reply mode should be cleared
            expect(newState.messageToReply).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should clear messageToEdit when user changes', () => {
      fc.assert(
        fc.property(
          composerStateWithEditModeGenerator(),
          userGenerator(),
          (initialState, newUser) => {
            // Ensure user actually changes
            if (initialState.user?.getUid() === newUser.getUid()) {
              return; // Skip if same user
            }

            // Verify we have edit mode active before change
            expect(initialState.messageToEdit).not.toBeNull();

            const newState = handleContextChange(initialState, newUser, null);

            // Edit mode should be cleared
            expect(newState.messageToEdit).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should clear messageToEdit when group changes', () => {
      fc.assert(
        fc.property(
          composerStateWithEditModeGenerator(),
          groupGenerator(),
          (initialState, newGroup) => {
            // Ensure group actually changes
            if (initialState.group?.getGuid() === newGroup.getGuid()) {
              return; // Skip if same group
            }

            // Verify we have edit mode active before change
            expect(initialState.messageToEdit).not.toBeNull();

            const newState = handleContextChange(initialState, null, newGroup);

            // Edit mode should be cleared
            expect(newState.messageToEdit).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should close all popovers (set contentToDisplay to none) when user changes', () => {
      fc.assert(
        fc.property(
          composerStateWithPopoverGenerator(),
          userGenerator(),
          (initialState, newUser) => {
            // Ensure user actually changes
            if (initialState.user?.getUid() === newUser.getUid()) {
              return; // Skip if same user
            }

            // Verify we have an open popover before change
            expect(initialState.contentToDisplay).not.toBe('none');

            const newState = handleContextChange(initialState, newUser, null);

            // Popover should be closed
            expect(newState.contentToDisplay).toBe('none');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should close all popovers (set contentToDisplay to none) when group changes', () => {
      fc.assert(
        fc.property(
          composerStateWithPopoverGenerator(),
          groupGenerator(),
          (initialState, newGroup) => {
            // Ensure group actually changes
            if (initialState.group?.getGuid() === newGroup.getGuid()) {
              return; // Skip if same group
            }

            // Verify we have an open popover before change
            expect(initialState.contentToDisplay).not.toBe('none');

            const newState = handleContextChange(initialState, null, newGroup);

            // Popover should be closed
            expect(newState.contentToDisplay).toBe('none');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reset all state when switching from user to group', () => {
      fc.assert(
        fc.property(
          activeComposerStateGenerator().filter(s => s.user !== null && s.group === null),
          groupGenerator(),
          (initialState, newGroup) => {
            // Verify we have active content before change
            expect(hasActiveContent(initialState)).toBe(true);

            const newState = handleContextChange(initialState, null, newGroup);

            // All state should be reset
            expect(isComposerStateReset(newState)).toBe(true);
            // New group should be set
            expect(newState.group?.getGuid()).toBe(newGroup.getGuid());
            expect(newState.user).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reset all state when switching from group to user', () => {
      fc.assert(
        fc.property(
          activeComposerStateGenerator().filter(s => s.group !== null && s.user === null),
          userGenerator(),
          (initialState, newUser) => {
            // Verify we have active content before change
            expect(hasActiveContent(initialState)).toBe(true);

            const newState = handleContextChange(initialState, newUser, null);

            // All state should be reset
            expect(isComposerStateReset(newState)).toBe(true);
            // New user should be set
            expect(newState.user?.getUid()).toBe(newUser.getUid());
            expect(newState.group).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should NOT reset state when user/group remains the same', () => {
      fc.assert(
        fc.property(activeComposerStateGenerator(), initialState => {
          // Keep the same user and group
          const newState = handleContextChange(initialState, initialState.user, initialState.group);

          // State should remain unchanged (except user/group references)
          expect(newState.composerText).toBe(initialState.composerText);
          expect(newState.attachments).toEqual(initialState.attachments);
          expect(newState.messageToReply).toBe(initialState.messageToReply);
          expect(newState.messageToEdit).toBe(initialState.messageToEdit);
          expect(newState.contentToDisplay).toBe(initialState.contentToDisplay);
        }),
        { numRuns: 100 }
      );
    });

    it('should reset all fields simultaneously on context change', () => {
      fc.assert(
        fc.property(
          activeComposerStateGenerator(),
          userGenerator(),
          groupGenerator(),
          fc.boolean(),
          (initialState, newUser, newGroup, useUser) => {
            // Determine new context (either user or group)
            const targetUser = useUser ? newUser : null;
            const targetGroup = useUser ? null : newGroup;

            // Ensure context actually changes
            const userChanged = initialState.user?.getUid() !== targetUser?.getUid();
            const groupChanged = initialState.group?.getGuid() !== targetGroup?.getGuid();

            if (!userChanged && !groupChanged) {
              return; // Skip if no change
            }

            const newState = handleContextChange(initialState, targetUser, targetGroup);

            // All fields should be reset simultaneously
            expect(newState.composerText).toBe('');
            expect(newState.attachments).toEqual([]);
            expect(newState.messageToReply).toBeNull();
            expect(newState.messageToEdit).toBeNull();
            expect(newState.contentToDisplay).toBe('none');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should be deterministic - same context change always produces same result', () => {
      fc.assert(
        fc.property(
          activeComposerStateGenerator(),
          userGenerator(),
          fc.integer({ min: 2, max: 5 }),
          (initialState, newUser, repeatCount) => {
            const results: ComposerState[] = [];

            for (let i = 0; i < repeatCount; i++) {
              // Create a fresh copy of initial state for each iteration
              const stateCopy = { ...initialState };
              results.push(handleContextChange(stateCopy, newUser, null));
            }

            // All results should be identical
            for (let i = 1; i < results.length; i++) {
              expect(results[i].composerText).toBe(results[0].composerText);
              expect(results[i].attachments).toEqual(results[0].attachments);
              expect(results[i].messageToReply).toBe(results[0].messageToReply);
              expect(results[i].messageToEdit).toBe(results[0].messageToEdit);
              expect(results[i].contentToDisplay).toBe(results[0].contentToDisplay);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle multiple consecutive context changes correctly', () => {
      fc.assert(
        fc.property(
          fc
            .array(userGenerator(), { minLength: 2, maxLength: 5 })
            .map(users => {
              // Ensure unique UIDs by filtering duplicates
              const seen = new Set<string>();
              return users.filter(user => {
                const uid = user.getUid();
                if (seen.has(uid)) {
                  return false;
                }
                seen.add(uid);
                return true;
              });
            })
            .filter(users => users.length >= 2), // Ensure at least 2 unique users
          nonEmptyTextGenerator(),
          (users, initialText) => {
            let state: ComposerState = {
              composerText: initialText,
              attachments: [],
              messageToReply: null,
              messageToEdit: null,
              contentToDisplay: 'none',
              user: users[0],
              group: null,
            };

            // Perform multiple context changes
            for (let i = 1; i < users.length; i++) {
              // Add some content before each change
              state = {
                ...state,
                composerText: `Text for user ${i}`,
              };

              // Change context
              state = handleContextChange(state, users[i], null);

              // After each change, state should be reset
              expect(isComposerStateReset(state)).toBe(true);
              expect(state.user?.getUid()).toBe(users[i].getUid());
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should pass isComposerStateReset check after any context change', () => {
      fc.assert(
        fc.property(
          activeComposerStateGenerator(),
          fc.oneof(userGenerator(), groupGenerator()),
          (initialState, newEntity) => {
            const isUser = newEntity instanceof MockUser;
            const newUser = isUser ? (newEntity as MockUser) : null;
            const newGroup = isUser ? null : (newEntity as MockGroup);

            // Ensure context actually changes
            const userChanged = initialState.user?.getUid() !== newUser?.getUid();
            const groupChanged = initialState.group?.getGuid() !== newGroup?.getGuid();

            if (!userChanged && !groupChanged) {
              return; // Skip if no change
            }

            const newState = handleContextChange(initialState, newUser, newGroup);

            // State should pass the reset check
            expect(isComposerStateReset(newState)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should update user/group reference after context change', () => {
      fc.assert(
        fc.property(activeComposerStateGenerator(), userGenerator(), (initialState, newUser) => {
          const newState = handleContextChange(initialState, newUser, null);

          // User should be updated
          expect(newState.user?.getUid()).toBe(newUser.getUid());
          // Group should be null when switching to user
          expect(newState.group).toBeNull();
        }),
        { numRuns: 100 }
      );
    });

    it('should handle empty initial state correctly', () => {
      fc.assert(
        fc.property(
          userGenerator(),
          groupGenerator(),
          fc.boolean(),
          (newUser, newGroup, useUser) => {
            const initialState = createInitialComposerState();
            const targetUser = useUser ? newUser : null;
            const targetGroup = useUser ? null : newGroup;

            const newState = handleContextChange(initialState, targetUser, targetGroup);

            // State should still be reset (already was reset)
            expect(isComposerStateReset(newState)).toBe(true);
            // New context should be set
            if (useUser) {
              expect(newState.user?.getUid()).toBe(newUser.getUid());
            } else {
              expect(newState.group?.getGuid()).toBe(newGroup.getGuid());
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Property 13: Sticker Message Structure**
   *
   * *For any* sticker sent from the stickers keyboard, the resulting message should
   * have type "extension_sticker" and include metadata with stickerUrl and stickerName
   * properties.
   *
   * **Validates: Requirements 8.4, 8.5, 8.6**
   *
   * Feature: message-composer-react-parity, Property 13: Sticker Message Structure
   */
  describe('Property 13: Sticker Message Structure', () => {
    /**
     * Sticker data interface representing a sticker from the stickers keyboard
     */
    interface StickerData {
      /** URL of the sticker image */
      stickerUrl: string;
      /** Name/identifier of the sticker */
      stickerName: string;
    }

    /**
     * Sticker message metadata structure following CometChat sticker extension format
     */
    interface StickerMessageMetadata {
      /** Type identifier for sticker extension */
      type: string;
      /** Data object containing sticker details */
      data: {
        /** URL of the sticker image */
        sticker_url: string;
        /** Name/identifier of the sticker */
        sticker_name: string;
      };
    }

    /**
     * Mock sticker message interface
     */
    interface MockStickerMessage {
      /** Gets the message type */
      getType: () => string;
      /** Gets the message metadata */
      getMetadata: () => StickerMessageMetadata;
      /** Gets the receiver ID */
      getReceiverId: () => string;
      /** Gets the receiver type */
      getReceiverType: () => string;
    }

    /**
     * The expected message type for sticker messages
     */
    const STICKER_MESSAGE_TYPE = 'extension_sticker';

    /**
     * Creates sticker message metadata following CometChat sticker extension format.
     * Mirrors the component's sticker metadata creation logic.
     *
     * @param stickerUrl - URL of the sticker image
     * @param stickerName - Name/identifier of the sticker
     * @returns Sticker message metadata object
     */
    function createStickerMetadata(
      stickerUrl: string,
      stickerName: string
    ): StickerMessageMetadata {
      return {
        type: STICKER_MESSAGE_TYPE,
        data: {
          sticker_url: stickerUrl,
          sticker_name: stickerName,
        },
      };
    }

    /**
     * Creates a mock sticker message.
     * Mirrors the component's sticker message creation logic.
     *
     * @param receiverId - ID of the receiver (user UID or group GUID)
     * @param receiverType - Type of receiver ('user' or 'group')
     * @param stickerUrl - URL of the sticker image
     * @param stickerName - Name/identifier of the sticker
     * @returns Mock sticker message object
     */
    function createStickerMessage(
      receiverId: string,
      receiverType: 'user' | 'group',
      stickerUrl: string,
      stickerName: string
    ): MockStickerMessage {
      const metadata = createStickerMetadata(stickerUrl, stickerName);

      return {
        getType: () => STICKER_MESSAGE_TYPE,
        getMetadata: () => metadata,
        getReceiverId: () => receiverId,
        getReceiverType: () => receiverType,
      };
    }

    /**
     * Validates that a sticker message has the correct structure.
     *
     * @param message - The sticker message to validate
     * @param expectedStickerUrl - Expected sticker URL
     * @param expectedStickerName - Expected sticker name
     * @returns Object with validation results
     */
    function validateStickerMessageStructure(
      message: MockStickerMessage,
      expectedStickerUrl: string,
      expectedStickerName: string
    ): {
      hasCorrectType: boolean;
      hasMetadata: boolean;
      hasMetadataType: boolean;
      hasDataObject: boolean;
      hasStickerUrl: boolean;
      hasStickerName: boolean;
      stickerUrlMatches: boolean;
      stickerNameMatches: boolean;
    } {
      const metadata = message.getMetadata();

      return {
        hasCorrectType: message.getType() === STICKER_MESSAGE_TYPE,
        hasMetadata: metadata !== null && metadata !== undefined,
        hasMetadataType: metadata?.type === STICKER_MESSAGE_TYPE,
        hasDataObject: metadata?.data !== null && metadata?.data !== undefined,
        hasStickerUrl: metadata?.data?.sticker_url !== undefined,
        hasStickerName: metadata?.data?.sticker_name !== undefined,
        stickerUrlMatches: metadata?.data?.sticker_url === expectedStickerUrl,
        stickerNameMatches: metadata?.data?.sticker_name === expectedStickerName,
      };
    }

    // ==================== Generators ====================

    /**
     * Generator for valid sticker URLs
     */
    const stickerUrlGenerator = (): fc.Arbitrary<string> =>
      fc.oneof(
        fc.webUrl().map(url => `${url}/sticker.png`),
        fc
          .string({ minLength: 5, maxLength: 50 })
          .filter(s => /^[a-zA-Z0-9_-]+$/.test(s))
          .map(s => `https://stickers.example.com/${s}.png`),
        fc.constantFrom(
          'https://cdn.cometchat.com/stickers/happy.png',
          'https://cdn.cometchat.com/stickers/sad.gif',
          'https://cdn.cometchat.com/stickers/laugh.webp',
          'https://example.com/stickers/thumbsup.png',
          'https://media.giphy.com/stickers/wave.gif'
        )
      );

    /**
     * Generator for valid sticker names
     */
    const stickerNameGenerator = (): fc.Arbitrary<string> =>
      fc.oneof(
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
        fc.constantFrom(
          'happy_face',
          'thumbs_up',
          'heart_eyes',
          'laughing',
          'waving_hand',
          'party_popper',
          'fire',
          'star',
          'clapping_hands',
          'thinking_face'
        )
      );

    /**
     * Generator for sticker data
     */
    const stickerDataGenerator = (): fc.Arbitrary<StickerData> =>
      fc.record({
        stickerUrl: stickerUrlGenerator(),
        stickerName: stickerNameGenerator(),
      });

    /**
     * Generator for receiver type
     */
    const receiverTypeGenerator = (): fc.Arbitrary<'user' | 'group'> =>
      fc.constantFrom('user', 'group');

    /**
     * Generator for receiver ID
     */
    const receiverIdGenerator = (): fc.Arbitrary<string> =>
      fc
        .string({ minLength: 1, maxLength: 50 })
        .filter(s => s.trim().length > 0 && /^[\w-]+$/.test(s));

    // ==================== Property Tests ====================

    it('should have message type "extension_sticker"', () => {
      fc.assert(
        fc.property(
          receiverIdGenerator(),
          receiverTypeGenerator(),
          stickerDataGenerator(),
          (receiverId, receiverType, stickerData) => {
            const message = createStickerMessage(
              receiverId,
              receiverType,
              stickerData.stickerUrl,
              stickerData.stickerName
            );

            // Message type should be "extension_sticker"
            expect(message.getType()).toBe(STICKER_MESSAGE_TYPE);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include metadata with type "extension_sticker"', () => {
      fc.assert(
        fc.property(
          receiverIdGenerator(),
          receiverTypeGenerator(),
          stickerDataGenerator(),
          (receiverId, receiverType, stickerData) => {
            const message = createStickerMessage(
              receiverId,
              receiverType,
              stickerData.stickerUrl,
              stickerData.stickerName
            );

            const metadata = message.getMetadata();

            // Metadata should exist and have correct type
            expect(metadata).toBeDefined();
            expect(metadata.type).toBe(STICKER_MESSAGE_TYPE);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include sticker_url in metadata data object', () => {
      fc.assert(
        fc.property(
          receiverIdGenerator(),
          receiverTypeGenerator(),
          stickerDataGenerator(),
          (receiverId, receiverType, stickerData) => {
            const message = createStickerMessage(
              receiverId,
              receiverType,
              stickerData.stickerUrl,
              stickerData.stickerName
            );

            const metadata = message.getMetadata();

            // Metadata should have data object with sticker_url
            expect(metadata.data).toBeDefined();
            expect(metadata.data.sticker_url).toBeDefined();
            expect(metadata.data.sticker_url).toBe(stickerData.stickerUrl);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include sticker_name in metadata data object', () => {
      fc.assert(
        fc.property(
          receiverIdGenerator(),
          receiverTypeGenerator(),
          stickerDataGenerator(),
          (receiverId, receiverType, stickerData) => {
            const message = createStickerMessage(
              receiverId,
              receiverType,
              stickerData.stickerUrl,
              stickerData.stickerName
            );

            const metadata = message.getMetadata();

            // Metadata should have data object with sticker_name
            expect(metadata.data).toBeDefined();
            expect(metadata.data.sticker_name).toBeDefined();
            expect(metadata.data.sticker_name).toBe(stickerData.stickerName);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should correctly pass through sticker URL', () => {
      fc.assert(
        fc.property(
          receiverIdGenerator(),
          receiverTypeGenerator(),
          stickerUrlGenerator(),
          stickerNameGenerator(),
          (receiverId, receiverType, stickerUrl, stickerName) => {
            const message = createStickerMessage(receiverId, receiverType, stickerUrl, stickerName);

            const metadata = message.getMetadata();

            // Sticker URL should be exactly as provided
            expect(metadata.data.sticker_url).toBe(stickerUrl);
            expect(metadata.data.sticker_url.length).toBe(stickerUrl.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should correctly pass through sticker name', () => {
      fc.assert(
        fc.property(
          receiverIdGenerator(),
          receiverTypeGenerator(),
          stickerUrlGenerator(),
          stickerNameGenerator(),
          (receiverId, receiverType, stickerUrl, stickerName) => {
            const message = createStickerMessage(receiverId, receiverType, stickerUrl, stickerName);

            const metadata = message.getMetadata();

            // Sticker name should be exactly as provided
            expect(metadata.data.sticker_name).toBe(stickerName);
            expect(metadata.data.sticker_name.length).toBe(stickerName.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have correct metadata structure with all required properties', () => {
      fc.assert(
        fc.property(
          receiverIdGenerator(),
          receiverTypeGenerator(),
          stickerDataGenerator(),
          (receiverId, receiverType, stickerData) => {
            const message = createStickerMessage(
              receiverId,
              receiverType,
              stickerData.stickerUrl,
              stickerData.stickerName
            );

            const validation = validateStickerMessageStructure(
              message,
              stickerData.stickerUrl,
              stickerData.stickerName
            );

            // All validation checks should pass
            expect(validation.hasCorrectType).toBe(true);
            expect(validation.hasMetadata).toBe(true);
            expect(validation.hasMetadataType).toBe(true);
            expect(validation.hasDataObject).toBe(true);
            expect(validation.hasStickerUrl).toBe(true);
            expect(validation.hasStickerName).toBe(true);
            expect(validation.stickerUrlMatches).toBe(true);
            expect(validation.stickerNameMatches).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should be deterministic - same sticker data always produces same message structure', () => {
      fc.assert(
        fc.property(
          receiverIdGenerator(),
          receiverTypeGenerator(),
          stickerDataGenerator(),
          fc.integer({ min: 2, max: 5 }),
          (receiverId, receiverType, stickerData, repeatCount) => {
            const messages: MockStickerMessage[] = [];

            for (let i = 0; i < repeatCount; i++) {
              messages.push(
                createStickerMessage(
                  receiverId,
                  receiverType,
                  stickerData.stickerUrl,
                  stickerData.stickerName
                )
              );
            }

            // All messages should have identical structure
            for (let i = 1; i < messages.length; i++) {
              expect(messages[i].getType()).toBe(messages[0].getType());
              expect(messages[i].getMetadata().type).toBe(messages[0].getMetadata().type);
              expect(messages[i].getMetadata().data.sticker_url).toBe(
                messages[0].getMetadata().data.sticker_url
              );
              expect(messages[i].getMetadata().data.sticker_name).toBe(
                messages[0].getMetadata().data.sticker_name
              );
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should work with both user and group receivers', () => {
      fc.assert(
        fc.property(receiverIdGenerator(), stickerDataGenerator(), (receiverId, stickerData) => {
          // Create message for user receiver
          const userMessage = createStickerMessage(
            receiverId,
            'user',
            stickerData.stickerUrl,
            stickerData.stickerName
          );

          // Create message for group receiver
          const groupMessage = createStickerMessage(
            receiverId,
            'group',
            stickerData.stickerUrl,
            stickerData.stickerName
          );

          // Both should have the same sticker message structure
          expect(userMessage.getType()).toBe(STICKER_MESSAGE_TYPE);
          expect(groupMessage.getType()).toBe(STICKER_MESSAGE_TYPE);

          expect(userMessage.getMetadata().type).toBe(STICKER_MESSAGE_TYPE);
          expect(groupMessage.getMetadata().type).toBe(STICKER_MESSAGE_TYPE);

          expect(userMessage.getMetadata().data.sticker_url).toBe(stickerData.stickerUrl);
          expect(groupMessage.getMetadata().data.sticker_url).toBe(stickerData.stickerUrl);

          expect(userMessage.getMetadata().data.sticker_name).toBe(stickerData.stickerName);
          expect(groupMessage.getMetadata().data.sticker_name).toBe(stickerData.stickerName);

          // Receiver type should be different
          expect(userMessage.getReceiverType()).toBe('user');
          expect(groupMessage.getReceiverType()).toBe('group');
        }),
        { numRuns: 100 }
      );
    });

    it('should handle special characters in sticker name', () => {
      fc.assert(
        fc.property(
          receiverIdGenerator(),
          receiverTypeGenerator(),
          stickerUrlGenerator(),
          fc.constantFrom(
            'happy_face_😀',
            'thumbs-up-👍',
            'heart ❤️ eyes',
            'sticker with spaces',
            'sticker_with_underscores',
            'sticker-with-dashes',
            'UPPERCASE_STICKER',
            'MixedCase_Sticker-Name'
          ),
          (receiverId, receiverType, stickerUrl, stickerName) => {
            const message = createStickerMessage(receiverId, receiverType, stickerUrl, stickerName);

            const metadata = message.getMetadata();

            // Sticker name should be preserved exactly including special characters
            expect(metadata.data.sticker_name).toBe(stickerName);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle various URL formats', () => {
      fc.assert(
        fc.property(
          receiverIdGenerator(),
          receiverTypeGenerator(),
          fc.constantFrom(
            'https://cdn.example.com/stickers/happy.png',
            'https://cdn.example.com/stickers/animated.gif',
            'https://cdn.example.com/stickers/vector.webp',
            'https://media.giphy.com/media/abc123/giphy.gif',
            'https://stickers.cometchat.com/pack1/sticker1.png',
            'https://example.com/path/to/deep/nested/sticker.png',
            'https://cdn.example.com/stickers/sticker-with-dashes.png',
            'https://cdn.example.com/stickers/sticker_with_underscores.png'
          ),
          stickerNameGenerator(),
          (receiverId, receiverType, stickerUrl, stickerName) => {
            const message = createStickerMessage(receiverId, receiverType, stickerUrl, stickerName);

            const metadata = message.getMetadata();

            // Sticker URL should be preserved exactly
            expect(metadata.data.sticker_url).toBe(stickerUrl);
            expect(message.getType()).toBe(STICKER_MESSAGE_TYPE);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should create independent metadata for each sticker message', () => {
      fc.assert(
        fc.property(
          receiverIdGenerator(),
          receiverTypeGenerator(),
          stickerDataGenerator(),
          stickerDataGenerator(),
          (receiverId, receiverType, stickerData1, stickerData2) => {
            // Skip if sticker data is the same
            if (
              stickerData1.stickerUrl === stickerData2.stickerUrl &&
              stickerData1.stickerName === stickerData2.stickerName
            ) {
              return;
            }

            const message1 = createStickerMessage(
              receiverId,
              receiverType,
              stickerData1.stickerUrl,
              stickerData1.stickerName
            );

            const message2 = createStickerMessage(
              receiverId,
              receiverType,
              stickerData2.stickerUrl,
              stickerData2.stickerName
            );

            // Each message should have its own metadata
            expect(message1.getMetadata().data.sticker_url).toBe(stickerData1.stickerUrl);
            expect(message1.getMetadata().data.sticker_name).toBe(stickerData1.stickerName);

            expect(message2.getMetadata().data.sticker_url).toBe(stickerData2.stickerUrl);
            expect(message2.getMetadata().data.sticker_name).toBe(stickerData2.stickerName);

            // Metadata should be different (unless data happens to be the same)
            if (stickerData1.stickerUrl !== stickerData2.stickerUrl) {
              expect(message1.getMetadata().data.sticker_url).not.toBe(
                message2.getMetadata().data.sticker_url
              );
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // ==================== Property 18: Accessibility Announcements ====================

  /**
   * Announcement type enum for testing
   */
  type AnnouncementType = 'polite' | 'assertive';

  /**
   * Mode change types that trigger announcements
   */
  type ModeChangeType =
    | 'enterReplyMode'
    | 'enterEditMode'
    | 'messageSent'
    | 'recordingStarted'
    | 'recordingStopped'
    | 'errorOccurred'
    | 'attachmentAdded'
    | 'attachmentRemoved';

  /**
   * Interface for tracking announcement state
   */
  interface AnnouncementState {
    politeText: string;
    assertiveText: string;
    announcementHistory: {
      type: AnnouncementType;
      message: string;
      timestamp: number;
    }[];
  }

  /**
   * Configuration for mode change announcements
   * Maps each mode change type to its expected announcement type and message pattern
   */
  const ANNOUNCEMENT_CONFIG: Record<
    ModeChangeType,
    { type: AnnouncementType; messagePattern: string }
  > = {
    enterReplyMode: { type: 'polite', messagePattern: 'reply_mode_activated' },
    enterEditMode: { type: 'polite', messagePattern: 'edit_mode_activated' },
    messageSent: { type: 'polite', messagePattern: 'message_sent' },
    recordingStarted: { type: 'assertive', messagePattern: 'recording_started' },
    recordingStopped: { type: 'assertive', messagePattern: 'recording_stopped' },
    errorOccurred: { type: 'assertive', messagePattern: 'error_occurred' },
    attachmentAdded: { type: 'polite', messagePattern: 'attachment_added' },
    attachmentRemoved: { type: 'polite', messagePattern: 'attachment_removed' },
  };

  /**
   * Creates an initial announcement state
   */
  function createInitialAnnouncementState(): AnnouncementState {
    return {
      politeText: '',
      assertiveText: '',
      announcementHistory: [],
    };
  }

  /**
   * Simulates a polite announcement (non-urgent, won't interrupt user)
   * Mirrors the component's announcePolite method behavior
   *
   * @param state - Current announcement state
   * @param message - The message to announce
   * @returns New announcement state after the announcement
   */
  function announcePolite(state: AnnouncementState, message: string): AnnouncementState {
    return {
      politeText: message,
      assertiveText: state.assertiveText,
      announcementHistory: [
        ...state.announcementHistory,
        { type: 'polite', message, timestamp: Date.now() },
      ],
    };
  }

  /**
   * Simulates an assertive announcement (urgent, will interrupt user)
   * Mirrors the component's announceAssertive method behavior
   *
   * @param state - Current announcement state
   * @param message - The message to announce
   * @returns New announcement state after the announcement
   */
  function announceAssertive(state: AnnouncementState, message: string): AnnouncementState {
    return {
      politeText: state.politeText,
      assertiveText: message,
      announcementHistory: [
        ...state.announcementHistory,
        { type: 'assertive', message, timestamp: Date.now() },
      ],
    };
  }

  /**
   * Determines the expected announcement type for a mode change
   *
   * @param modeChange - The type of mode change
   * @returns The expected announcement type ('polite' or 'assertive')
   */
  function getExpectedAnnouncementType(modeChange: ModeChangeType): AnnouncementType {
    return ANNOUNCEMENT_CONFIG[modeChange].type;
  }

  /**
   * Simulates a mode change and returns the resulting announcement state
   * Mirrors the component's behavior for each mode change type
   *
   * @param state - Current announcement state
   * @param modeChange - The type of mode change
   * @param context - Optional context for the announcement (e.g., sender name, file name)
   * @returns New announcement state after the mode change
   */
  function handleModeChange(
    state: AnnouncementState,
    modeChange: ModeChangeType,
    context?: string
  ): AnnouncementState {
    const config = ANNOUNCEMENT_CONFIG[modeChange];
    let message = config.messagePattern;

    // Add context to message if provided
    if (context) {
      message = `${message}: ${context}`;
    }

    if (config.type === 'polite') {
      return announcePolite(state, message);
    } else {
      return announceAssertive(state, message);
    }
  }

  /**
   * Validates that an announcement was made with the correct type
   *
   * @param state - The announcement state to check
   * @param expectedType - The expected announcement type
   * @returns true if the last announcement matches the expected type
   */
  function validateAnnouncementType(
    state: AnnouncementState,
    expectedType: AnnouncementType
  ): boolean {
    if (state.announcementHistory.length === 0) {
      return false;
    }

    const lastAnnouncement = state.announcementHistory[state.announcementHistory.length - 1];
    return lastAnnouncement.type === expectedType;
  }

  /**
   * Validates that an announcement was made (non-empty message)
   *
   * @param state - The announcement state to check
   * @param type - The announcement type to check
   * @returns true if the announcement text is non-empty
   */
  function hasAnnouncement(state: AnnouncementState, type: AnnouncementType): boolean {
    if (type === 'polite') {
      return state.politeText.length > 0;
    } else {
      return state.assertiveText.length > 0;
    }
  }

  /**
   * Gets the last announcement of a specific type from history
   *
   * @param state - The announcement state
   * @param type - The announcement type to find
   * @returns The last announcement of the specified type, or undefined
   */
  function getLastAnnouncementOfType(
    state: AnnouncementState,
    type: AnnouncementType
  ): { type: AnnouncementType; message: string; timestamp: number } | undefined {
    for (let i = state.announcementHistory.length - 1; i >= 0; i--) {
      if (state.announcementHistory[i].type === type) {
        return state.announcementHistory[i];
      }
    }
    return undefined;
  }

  // ==================== Property 18 Generators ====================

  /**
   * Generator for mode change types
   */
  const modeChangeTypeGenerator = (): fc.Arbitrary<ModeChangeType> =>
    fc.constantFrom(
      'enterReplyMode',
      'enterEditMode',
      'messageSent',
      'recordingStarted',
      'recordingStopped',
      'errorOccurred',
      'attachmentAdded',
      'attachmentRemoved'
    );

  /**
   * Generator for polite mode changes (non-urgent)
   */
  const politeModeChangeGenerator = (): fc.Arbitrary<ModeChangeType> =>
    fc.constantFrom(
      'enterReplyMode',
      'enterEditMode',
      'messageSent',
      'attachmentAdded',
      'attachmentRemoved'
    );

  /**
   * Generator for assertive mode changes (urgent)
   */
  const assertiveModeChangeGenerator = (): fc.Arbitrary<ModeChangeType> =>
    fc.constantFrom('recordingStarted', 'recordingStopped', 'errorOccurred');

  /**
   * Generator for sender names (for reply mode context)
   */
  const senderNameGenerator = (): fc.Arbitrary<string> =>
    fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0);

  /**
   * Generator for file names (for attachment context)
   */
  const fileNameGenerator = (): fc.Arbitrary<string> =>
    fc
      .record({
        name: fc.string({ minLength: 1, maxLength: 30 }).filter(s => /^[\w-]+$/.test(s)),
        extension: fc.constantFrom('jpg', 'png', 'pdf', 'doc', 'mp4', 'mp3', 'txt'),
      })
      .map(({ name, extension }) => `${name}.${extension}`);

  /**
   * Generator for error messages
   */
  const errorMessageGenerator = (): fc.Arbitrary<string> =>
    fc.constantFrom(
      'Network error',
      'File too large',
      'Permission denied',
      'Invalid format',
      'Upload failed',
      'Connection timeout'
    );

  /**
   * Generator for sequences of mode changes
   */
  const modeChangeSequenceGenerator = (
    minLength = 1,
    maxLength = 10
  ): fc.Arbitrary<ModeChangeType[]> =>
    fc.array(modeChangeTypeGenerator(), { minLength, maxLength });

  /**
   * **Property 18: Accessibility Announcements**
   *
   * *For any* mode change (entering reply mode, entering edit mode, sending message),
   * the appropriate announcement should be made to screen readers via aria-live regions.
   *
   * **Validates: Requirements 2.9, 3.8, 15.3, 15.4**
   */
  describe('Property 18: Accessibility Announcements', () => {
    it('should make polite announcement when entering reply mode', () => {
      fc.assert(
        fc.property(senderNameGenerator(), senderName => {
          const initialState = createInitialAnnouncementState();

          // Enter reply mode
          const newState = handleModeChange(initialState, 'enterReplyMode', senderName);

          // Should have made a polite announcement
          expect(hasAnnouncement(newState, 'polite')).toBe(true);
          expect(validateAnnouncementType(newState, 'polite')).toBe(true);

          // Announcement should contain context
          expect(newState.politeText).toContain(senderName);
        }),
        { numRuns: 100 }
      );
    });

    it('should make polite announcement when entering edit mode', () => {
      fc.assert(
        fc.property(fc.boolean(), () => {
          const initialState = createInitialAnnouncementState();

          // Enter edit mode
          const newState = handleModeChange(initialState, 'enterEditMode');

          // Should have made a polite announcement
          expect(hasAnnouncement(newState, 'polite')).toBe(true);
          expect(validateAnnouncementType(newState, 'polite')).toBe(true);

          // Announcement should contain edit mode pattern
          expect(newState.politeText).toContain('edit_mode_activated');
        }),
        { numRuns: 100 }
      );
    });

    it('should make polite announcement when message is sent', () => {
      fc.assert(
        fc.property(fc.boolean(), () => {
          const initialState = createInitialAnnouncementState();

          // Send message
          const newState = handleModeChange(initialState, 'messageSent');

          // Should have made a polite announcement
          expect(hasAnnouncement(newState, 'polite')).toBe(true);
          expect(validateAnnouncementType(newState, 'polite')).toBe(true);

          // Announcement should contain message sent pattern
          expect(newState.politeText).toContain('message_sent');
        }),
        { numRuns: 100 }
      );
    });

    it('should make assertive announcement when recording starts', () => {
      fc.assert(
        fc.property(fc.boolean(), () => {
          const initialState = createInitialAnnouncementState();

          // Start recording
          const newState = handleModeChange(initialState, 'recordingStarted');

          // Should have made an assertive announcement
          expect(hasAnnouncement(newState, 'assertive')).toBe(true);
          expect(validateAnnouncementType(newState, 'assertive')).toBe(true);

          // Announcement should contain recording started pattern
          expect(newState.assertiveText).toContain('recording_started');
        }),
        { numRuns: 100 }
      );
    });

    it('should make assertive announcement when recording stops', () => {
      fc.assert(
        fc.property(fc.boolean(), () => {
          const initialState = createInitialAnnouncementState();

          // Stop recording
          const newState = handleModeChange(initialState, 'recordingStopped');

          // Should have made an assertive announcement
          expect(hasAnnouncement(newState, 'assertive')).toBe(true);
          expect(validateAnnouncementType(newState, 'assertive')).toBe(true);

          // Announcement should contain recording stopped pattern
          expect(newState.assertiveText).toContain('recording_stopped');
        }),
        { numRuns: 100 }
      );
    });

    it('should make assertive announcement when error occurs', () => {
      fc.assert(
        fc.property(errorMessageGenerator(), errorMessage => {
          const initialState = createInitialAnnouncementState();

          // Error occurs
          const newState = handleModeChange(initialState, 'errorOccurred', errorMessage);

          // Should have made an assertive announcement
          expect(hasAnnouncement(newState, 'assertive')).toBe(true);
          expect(validateAnnouncementType(newState, 'assertive')).toBe(true);

          // Announcement should contain error context
          expect(newState.assertiveText).toContain(errorMessage);
        }),
        { numRuns: 100 }
      );
    });

    it('should make polite announcement when attachment is added', () => {
      fc.assert(
        fc.property(fileNameGenerator(), fileName => {
          const initialState = createInitialAnnouncementState();

          // Add attachment
          const newState = handleModeChange(initialState, 'attachmentAdded', fileName);

          // Should have made a polite announcement
          expect(hasAnnouncement(newState, 'polite')).toBe(true);
          expect(validateAnnouncementType(newState, 'polite')).toBe(true);

          // Announcement should contain file name
          expect(newState.politeText).toContain(fileName);
        }),
        { numRuns: 100 }
      );
    });

    it('should make polite announcement when attachment is removed', () => {
      fc.assert(
        fc.property(fileNameGenerator(), fileName => {
          const initialState = createInitialAnnouncementState();

          // Remove attachment
          const newState = handleModeChange(initialState, 'attachmentRemoved', fileName);

          // Should have made a polite announcement
          expect(hasAnnouncement(newState, 'polite')).toBe(true);
          expect(validateAnnouncementType(newState, 'polite')).toBe(true);

          // Announcement should contain file name
          expect(newState.politeText).toContain(fileName);
        }),
        { numRuns: 100 }
      );
    });

    it('should use correct announcement type for any mode change', () => {
      fc.assert(
        fc.property(modeChangeTypeGenerator(), modeChange => {
          const initialState = createInitialAnnouncementState();
          const expectedType = getExpectedAnnouncementType(modeChange);

          // Handle mode change
          const newState = handleModeChange(initialState, modeChange);

          // Should have made an announcement of the correct type
          expect(hasAnnouncement(newState, expectedType)).toBe(true);
          expect(validateAnnouncementType(newState, expectedType)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should use polite announcements for non-urgent mode changes', () => {
      fc.assert(
        fc.property(politeModeChangeGenerator(), modeChange => {
          const initialState = createInitialAnnouncementState();

          // Handle polite mode change
          const newState = handleModeChange(initialState, modeChange);

          // Should have made a polite announcement
          expect(validateAnnouncementType(newState, 'polite')).toBe(true);

          // Assertive text should remain unchanged
          expect(newState.assertiveText).toBe(initialState.assertiveText);
        }),
        { numRuns: 100 }
      );
    });

    it('should use assertive announcements for urgent mode changes', () => {
      fc.assert(
        fc.property(assertiveModeChangeGenerator(), modeChange => {
          const initialState = createInitialAnnouncementState();

          // Handle assertive mode change
          const newState = handleModeChange(initialState, modeChange);

          // Should have made an assertive announcement
          expect(validateAnnouncementType(newState, 'assertive')).toBe(true);

          // Polite text should remain unchanged
          expect(newState.politeText).toBe(initialState.politeText);
        }),
        { numRuns: 100 }
      );
    });

    it('should track announcement history for sequences of mode changes', () => {
      fc.assert(
        fc.property(modeChangeSequenceGenerator(2, 8), modeChanges => {
          let state = createInitialAnnouncementState();

          // Apply all mode changes
          for (const modeChange of modeChanges) {
            state = handleModeChange(state, modeChange);
          }

          // History should contain all announcements
          expect(state.announcementHistory.length).toBe(modeChanges.length);

          // Each announcement should have the correct type
          for (let i = 0; i < modeChanges.length; i++) {
            const expectedType = getExpectedAnnouncementType(modeChanges[i]);
            expect(state.announcementHistory[i].type).toBe(expectedType);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should preserve announcement order in history', () => {
      fc.assert(
        fc.property(modeChangeSequenceGenerator(3, 10), modeChanges => {
          let state = createInitialAnnouncementState();
          const timestamps: number[] = [];

          // Apply all mode changes and track timestamps
          for (const modeChange of modeChanges) {
            state = handleModeChange(state, modeChange);
            timestamps.push(
              state.announcementHistory[state.announcementHistory.length - 1].timestamp
            );
          }

          // Timestamps should be in non-decreasing order
          for (let i = 1; i < timestamps.length; i++) {
            expect(timestamps[i]).toBeGreaterThanOrEqual(timestamps[i - 1]);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should be deterministic - same mode change produces same announcement type', () => {
      fc.assert(
        fc.property(
          modeChangeTypeGenerator(),
          fc.integer({ min: 2, max: 5 }),
          (modeChange, repeatCount) => {
            const results: AnnouncementType[] = [];

            for (let i = 0; i < repeatCount; i++) {
              const state = createInitialAnnouncementState();
              const newState = handleModeChange(state, modeChange);
              const lastAnnouncement = newState.announcementHistory[0];
              results.push(lastAnnouncement.type);
            }

            // All results should be identical
            for (let i = 1; i < results.length; i++) {
              expect(results[i]).toBe(results[0]);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include context in announcement message when provided', () => {
      fc.assert(
        fc.property(
          modeChangeTypeGenerator(),
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          (modeChange, context) => {
            const initialState = createInitialAnnouncementState();

            // Handle mode change with context
            const newState = handleModeChange(initialState, modeChange, context);

            // Get the last announcement
            const lastAnnouncement =
              newState.announcementHistory[newState.announcementHistory.length - 1];

            // Announcement should contain the context
            expect(lastAnnouncement.message).toContain(context);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle rapid successive announcements correctly', () => {
      fc.assert(
        fc.property(
          fc.array(modeChangeTypeGenerator(), { minLength: 5, maxLength: 20 }),
          modeChanges => {
            let state = createInitialAnnouncementState();

            // Rapidly apply all mode changes
            for (const modeChange of modeChanges) {
              state = handleModeChange(state, modeChange);
            }

            // All announcements should be recorded
            expect(state.announcementHistory.length).toBe(modeChanges.length);

            // The current polite/assertive text should reflect the last announcement of each type
            const lastPolite = getLastAnnouncementOfType(state, 'polite');
            const lastAssertive = getLastAnnouncementOfType(state, 'assertive');

            if (lastPolite) {
              expect(state.politeText).toBe(lastPolite.message);
            }
            if (lastAssertive) {
              expect(state.assertiveText).toBe(lastAssertive.message);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not modify assertive text when making polite announcement', () => {
      fc.assert(
        fc.property(
          politeModeChangeGenerator(),
          fc.string({ minLength: 1, maxLength: 50 }),
          (modeChange, existingAssertiveText) => {
            // Start with existing assertive text
            const initialState: AnnouncementState = {
              politeText: '',
              assertiveText: existingAssertiveText,
              announcementHistory: [],
            };

            // Make polite announcement
            const newState = handleModeChange(initialState, modeChange);

            // Assertive text should be unchanged
            expect(newState.assertiveText).toBe(existingAssertiveText);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not modify polite text when making assertive announcement', () => {
      fc.assert(
        fc.property(
          assertiveModeChangeGenerator(),
          fc.string({ minLength: 1, maxLength: 50 }),
          (modeChange, existingPoliteText) => {
            // Start with existing polite text
            const initialState: AnnouncementState = {
              politeText: existingPoliteText,
              assertiveText: '',
              announcementHistory: [],
            };

            // Make assertive announcement
            const newState = handleModeChange(initialState, modeChange);

            // Polite text should be unchanged
            expect(newState.politeText).toBe(existingPoliteText);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should always produce non-empty announcement message', () => {
      fc.assert(
        fc.property(modeChangeTypeGenerator(), modeChange => {
          const initialState = createInitialAnnouncementState();

          // Handle mode change
          const newState = handleModeChange(initialState, modeChange);

          // Get the last announcement
          const lastAnnouncement =
            newState.announcementHistory[newState.announcementHistory.length - 1];

          // Message should be non-empty
          expect(lastAnnouncement.message.length).toBeGreaterThan(0);
        }),
        { numRuns: 100 }
      );
    });
  });
});
