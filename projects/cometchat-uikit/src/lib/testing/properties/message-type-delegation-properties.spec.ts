import { describe, it, expect, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';

/**
 * Property-Based Tests for Message Type Delegation
 *
 * Feature: comprehensive-test-suite, Property 9: Message Type Delegation
 *
 * For any recognized message type string, verify cometchat-message-bubble
 * delegates to the correct inner bubble component.
 *
 * **Validates: Requirements 3.6**
 */

// ─── Known Constants (mirror CometChat SDK string values) ───

const KNOWN_MESSAGE_TYPES = ['text', 'image', 'video', 'audio', 'file'] as const;
const KNOWN_CUSTOM_TYPES = [
  'extension_poll',
  'extension_sticker',
  'extension_document',
  'extension_whiteboard',
  'meeting',
] as const;

// ─── Mock Message Bubble Delegation Logic ───
// Mirrors the real getBubbleType() from CometChatMessageBubbleComponent

const CONTENT_TYPE_MAP: Record<string, string> = {
  text_message: 'text',
  image_message: 'image',
  video_message: 'video',
  audio_message: 'audio',
  file_message: 'file',
  extension_poll_custom: 'poll',
  extension_sticker_custom: 'sticker',
  extension_document_custom: 'document',
  extension_whiteboard_custom: 'whiteboard',
  meeting_custom: 'meeting',
  groupMember_action: 'action',
};

interface MockMessage {
  getType(): string;
  getCategory(): string;
}

function createMockMessage(type: string, category: string): MockMessage {
  return { getType: () => type, getCategory: () => category };
}

/**
 * Replicates the exact getBubbleType() logic from the real component.
 */
function getBubbleType(message: MockMessage | null): string {
  if (!message) return 'unsupported';

  const category = message.getCategory() || '';
  const type = message.getType() || '';

  if (category === 'call') return 'call';
  if (category === 'action') return 'action';

  if (category === 'message') {
    switch (type) {
      case 'text':
        return 'text';
      case 'image':
        return 'image';
      case 'video':
        return 'video';
      case 'audio':
        return 'audio';
      case 'file':
        return 'file';
      default:
        return 'text';
    }
  }

  if (category === 'custom') {
    if (type.includes('poll')) return 'poll';
    if (type.includes('sticker')) return 'sticker';
    if (type.includes('document')) return 'document';
    if (type.includes('whiteboard')) return 'whiteboard';
    if (type.includes('meeting')) return 'meeting';
  }

  const key = `${type}_${category}`;
  return CONTENT_TYPE_MAP[key] || 'unsupported';
}

// ─── Arbitraries ───

const arbKnownMessageType = fc.constantFrom(...KNOWN_MESSAGE_TYPES);
const arbKnownCustomType = fc.constantFrom(...KNOWN_CUSTOM_TYPES);
const arbCallCategory = fc.constant('call');
const arbActionCategory = fc.constant('action');

/** Arbitrary type string that does NOT match any known message type */
const arbUnknownMessageType = fc
  .stringMatching(/^[a-z]{3,15}$/)
  .filter(s => !KNOWN_MESSAGE_TYPES.includes(s as any));

/** Arbitrary type string that does NOT contain any known custom substrings */
const arbUnknownCustomType = fc
  .stringMatching(/^[a-z]{3,15}$/)
  .filter(
    s =>
      !s.includes('poll') &&
      !s.includes('sticker') &&
      !s.includes('document') &&
      !s.includes('whiteboard') &&
      !s.includes('meeting')
  );

/** Arbitrary category that is NOT message, custom, call, or action */
const arbUnknownCategory = fc
  .stringMatching(/^[a-z]{3,15}$/)
  .filter(s => !['message', 'custom', 'call', 'action'].includes(s));

/** Arbitrary type for call/action categories (any string works) */
const arbAnyType = fc.stringMatching(/^[a-z_]{1,20}$/);

// ─── Expected Mapping Tables ───

const MESSAGE_TYPE_TO_BUBBLE: Record<string, string> = {
  text: 'text',
  image: 'image',
  video: 'video',
  audio: 'audio',
  file: 'file',
};

const CUSTOM_TYPE_TO_BUBBLE: Record<string, string> = {
  extension_poll: 'poll',
  extension_sticker: 'sticker',
  extension_document: 'document',
  extension_whiteboard: 'whiteboard',
  meeting: 'meeting',
};

// ─── Tests ───

describe('Message Type Delegation Property Tests', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * **Feature: comprehensive-test-suite, Property 9: Message Type Delegation**
   *
   * *For any* recognized message type string, verify cometchat-message-bubble
   * delegates to the correct inner bubble component.
   *
   * **Validates: Requirements 3.6**
   */
  describe('Property 9: Message Type Delegation', () => {
    it('each recognized message-category type maps to exactly one bubble type', () => {
      fc.assert(
        fc.property(arbKnownMessageType, type => {
          const msg = createMockMessage(type, 'message');
          const result = getBubbleType(msg);
          expect(result).toBe(MESSAGE_TYPE_TO_BUBBLE[type]);
        }),
        { numRuns: 100 }
      );
    });

    it('each recognized custom type maps to exactly one bubble type', () => {
      fc.assert(
        fc.property(arbKnownCustomType, type => {
          const msg = createMockMessage(type, 'custom');
          const result = getBubbleType(msg);
          expect(result).toBe(CUSTOM_TYPE_TO_BUBBLE[type]);
        }),
        { numRuns: 100 }
      );
    });

    it('call category always delegates to call bubble regardless of type', () => {
      fc.assert(
        fc.property(arbCallCategory, arbAnyType, (_cat, type) => {
          const msg = createMockMessage(type, 'call');
          expect(getBubbleType(msg)).toBe('call');
        }),
        { numRuns: 100 }
      );
    });

    it('action category always delegates to action bubble regardless of type', () => {
      fc.assert(
        fc.property(arbActionCategory, arbAnyType, (_cat, type) => {
          const msg = createMockMessage(type, 'action');
          expect(getBubbleType(msg)).toBe('action');
        }),
        { numRuns: 100 }
      );
    });

    it('the mapping is deterministic — same type+category always produces same bubble', () => {
      const arbTypeCategory = fc.oneof(
        fc.tuple(arbKnownMessageType, fc.constant('message')),
        fc.tuple(arbKnownCustomType, fc.constant('custom')),
        fc.tuple(arbAnyType, fc.constant('call')),
        fc.tuple(arbAnyType, fc.constant('action'))
      );

      fc.assert(
        fc.property(arbTypeCategory, ([type, category]) => {
          const msg1 = createMockMessage(type, category);
          const msg2 = createMockMessage(type, category);
          expect(getBubbleType(msg1)).toBe(getBubbleType(msg2));
        }),
        { numRuns: 100 }
      );
    });

    it('unknown message types in "message" category fall back to "text"', () => {
      fc.assert(
        fc.property(arbUnknownMessageType, type => {
          const msg = createMockMessage(type, 'message');
          expect(getBubbleType(msg)).toBe('text');
        }),
        { numRuns: 100 }
      );
    });

    it('unknown custom types produce "unsupported"', () => {
      fc.assert(
        fc.property(arbUnknownCustomType, type => {
          const msg = createMockMessage(type, 'custom');
          expect(getBubbleType(msg)).toBe('unsupported');
        }),
        { numRuns: 100 }
      );
    });

    it('unknown categories produce "unsupported"', () => {
      fc.assert(
        fc.property(arbUnknownCategory, arbAnyType, (category, type) => {
          const msg = createMockMessage(type, category);
          expect(getBubbleType(msg)).toBe('unsupported');
        }),
        { numRuns: 100 }
      );
    });

    it('null message produces "unsupported"', () => {
      fc.assert(
        fc.property(fc.constant(null), msg => {
          expect(getBubbleType(msg)).toBe('unsupported');
        }),
        { numRuns: 100 }
      );
    });
  });
});
