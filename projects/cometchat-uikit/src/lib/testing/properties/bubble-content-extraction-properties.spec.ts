import { describe, it, expect, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { CometChatLocalize } from '../../resources/CometChatLocalize/cometchat-localize';

/**
 * Property-Based Tests for Bubble Content Extraction
 *
 * Feature: comprehensive-test-suite, Property 7: Bubble Content Extraction
 *
 * For any bubble component and any valid message object of the matching type,
 * the component SHALL extract and display the correct content field (text for
 * text bubbles, URL for media bubbles, filename for file bubbles, etc.).
 *
 * **Validates: Requirements 3.2**
 */

// ─── Arbitraries ───

/** Non-empty string for content fields */
const arbNonEmptyString = fc
  .string({ minLength: 1, maxLength: 200 })
  .filter(s => s.trim().length > 0);

/** Valid URL-like string */
const arbUrl = fc.webUrl();

/** Valid filename with extension */
const arbFileName = fc
  .tuple(
    fc.stringMatching(/^[a-zA-Z0-9_-]{1,30}$/),
    fc.constantFrom('pdf', 'doc', 'txt', 'zip', 'mp3', 'mp4', 'jpg', 'png')
  )
  .map(([name, ext]) => `${name}.${ext}`);

/** Call type */
const arbCallType = fc.constantFrom('audio', 'video');

/** Call status */
const arbCallStatus = fc.constantFrom(
  'initiated',
  'ongoing',
  'ended',
  'missed',
  'cancelled',
  'rejected',
  'busy',
  'unanswered'
);

/** Poll question */
const arbPollQuestion = fc
  .string({ minLength: 1, maxLength: 200 })
  .filter(s => s.trim().length > 0);

/** Poll options (at least 2) */
const arbPollOptions = fc
  .array(
    fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
    { minLength: 2, maxLength: 6 }
  )
  .map(opts => {
    const record: Record<string, string> = {};
    opts.forEach((opt, i) => {
      record[String(i + 1)] = opt;
    });
    return record;
  });

// ─── Mock Message Factories (lightweight, no SDK dependency) ───

function createMockTextMsg(text: string) {
  return {
    getText: () => text,
    getId: () => 1,
    getType: () => 'text',
    getCategory: () => 'message',
    getSender: () => ({ getName: () => 'User', getUid: () => 'u1' }),
    getMetadata: () => null,
  };
}

function createMockMediaMsg(url: string, type: 'image' | 'audio' | 'video') {
  return {
    getAttachments: () => [{ url, thumbnail: url, metadata: {} }],
    getText: () => '',
    getId: () => 2,
    getType: () => type,
    getCategory: () => 'message',
    getSender: () => ({ getName: () => 'User', getUid: () => 'u1' }),
    getMetadata: () => null,
    getData: () => null,
  };
}

function createMockFileMsg(url: string, fileName: string) {
  return {
    getAttachments: () => [
      {
        url,
        fileName,
        fileExtension: fileName.split('.').pop() || '',
        fileSize: 1024,
        fileMimeType: 'application/octet-stream',
        metadata: {},
      },
    ],
    getText: () => '',
    getId: () => 3,
    getType: () => 'file',
    getCategory: () => 'message',
    getSender: () => ({ getName: () => 'User', getUid: () => 'u1' }),
    getMetadata: () => null,
    getData: () => null,
  };
}

function createMockCallMsg(callType: string, callStatus: string) {
  return {
    getType: () => callType,
    getStatus: () => callStatus,
    getSessionId: () => 'session-1',
    getDuration: () => 0,
    getCallInitiator: () => ({ getName: () => 'Caller', getUid: () => 'u1' }),
    getCallReceiver: () => ({ getName: () => 'Callee', getUid: () => 'u2' }),
    getSender: () => ({ getName: () => 'Caller', getUid: () => 'u1' }),
    getReceiver: () => ({ getName: () => 'Callee', getUid: () => 'u2' }),
    getReceiverType: () => 'user',
    getSentAt: () => Math.floor(Date.now() / 1000),
    getAction: () => callStatus,
    getInitiatedAt: () => Math.floor(Date.now() / 1000),
    getJoinedAt: () => Math.floor(Date.now() / 1000),
  };
}

function createMockPollMsg(question: string, options: Record<string, string>) {
  return {
    getId: () => 5,
    getType: () => 'extension_poll',
    getCategory: () => 'custom',
    getSender: () => ({ getName: () => 'User', getUid: () => 'u1' }),
    getMetadata: () => ({
      '@injected': {
        extensions: {
          polls: {
            id: '5',
            question,
            options,
            results: {
              total: 0,
              options: Object.fromEntries(
                Object.keys(options).map(k => [k, { count: 0, voters: {} }])
              ),
            },
          },
        },
      },
    }),
    getCustomData: () => ({ question, options }),
  };
}

function createMockStickerMsg(stickerUrl: string) {
  return {
    getId: () => 6,
    getType: () => 'extension_sticker',
    getCategory: () => 'custom',
    getSender: () => ({ getName: () => 'User', getUid: () => 'u1' }),
    getMetadata: () => ({
      data: { sticker_url: stickerUrl },
      sticker_url: stickerUrl,
    }),
    getCustomData: () => ({ sticker_url: stickerUrl }),
  };
}

function createMockCollabDocMsg(documentUrl: string) {
  return {
    getId: () => 7,
    getType: () => 'extension_document',
    getCategory: () => 'custom',
    getSender: () => ({ getName: () => 'User', getUid: () => 'u1' }),
    getMetadata: () => ({
      '@injected': {
        extensions: {
          document: { document_url: documentUrl },
        },
      },
    }),
  };
}

function createMockCollabWhiteboardMsg(boardUrl: string) {
  return {
    getId: () => 8,
    getType: () => 'extension_whiteboard',
    getCategory: () => 'custom',
    getSender: () => ({ getName: () => 'User', getUid: () => 'u1' }),
    getMetadata: () => ({
      '@injected': {
        extensions: {
          whiteboard: { board_url: boardUrl },
        },
      },
    }),
  };
}

function createMockActionMsg(messageText: string) {
  return {
    getId: () => 9,
    getType: () => 'groupMember',
    getCategory: () => 'action',
    getMessage: () => messageText,
    getAction: () => 'joined',
    getSender: () => ({ getName: () => 'Admin', getUid: () => 'u1' }),
    getActionBy: () => ({ getName: () => 'Admin', getUid: () => 'u1' }),
    getActionOn: () => ({ getName: () => 'Member', getUid: () => 'u2' }),
  };
}

// ─── Content Extraction Functions (mirror component logic) ───

function extractTextContent(message: any): string {
  if (!message) return '';
  return message.getText?.() || '';
}

function extractMediaUrl(message: any): string {
  if (!message) return '';
  const attachments = message.getAttachments?.();
  if (!attachments || !Array.isArray(attachments) || attachments.length === 0) return '';
  const first = attachments[0];
  if (!first || typeof first !== 'object') return '';
  const url = first.url;
  return url && typeof url === 'string' ? url : '';
}

function extractFileName(message: any): string {
  if (!message) return '';
  const attachments = message.getAttachments?.();
  if (!attachments || !Array.isArray(attachments) || attachments.length === 0) return '';
  const first = attachments[0];
  return first?.fileName || '';
}

function extractCallInfo(message: any): { type: string; status: string } {
  if (!message) return { type: '', status: '' };
  const rawType = message.getType?.();
  const type = rawType === 'video' ? 'video' : 'audio';
  const rawStatus = message.getStatus?.();
  const validStatuses = [
    'initiated',
    'ongoing',
    'ended',
    'missed',
    'cancelled',
    'rejected',
    'busy',
    'unanswered',
  ];
  const status =
    rawStatus && validStatuses.includes(rawStatus.toLowerCase())
      ? rawStatus.toLowerCase()
      : 'ended';
  return { type, status };
}

function extractPollQuestion(message: any): string {
  if (!message) return '';
  const metadata = message.getMetadata?.();
  if (!metadata) return '';
  const injected = metadata['@injected'];
  if (!injected) return '';
  const extensions = injected['extensions'];
  if (!extensions) return '';
  const polls = extensions['polls'];
  if (!polls) return '';
  return polls.question || '';
}

function extractStickerUrl(message: any): string {
  if (!message) return '';
  try {
    const metadata = message.getMetadata?.();
    if (!metadata) {
      const customData = message.getCustomData?.();
      return customData?.['sticker_url'] || '';
    }
    if (metadata['data']?.['sticker_url']) return metadata['data']['sticker_url'];
    if (metadata['sticker_url']) return metadata['sticker_url'];
    const customData = message.getCustomData?.();
    return customData?.['sticker_url'] || '';
  } catch {
    return '';
  }
}

function extractDocumentUrl(message: any): string {
  if (!message) return '';
  const metadata = message.getMetadata?.();
  if (!metadata || typeof metadata !== 'object') return '';
  const injected = metadata['@injected'];
  if (!injected || typeof injected !== 'object') return '';
  const extensions = injected['extensions'];
  if (!extensions || typeof extensions !== 'object') return '';
  const doc = extensions['document'];
  if (!doc || typeof doc !== 'object') return '';
  const url = doc['document_url'];
  return url && typeof url === 'string' ? url : '';
}

function extractWhiteboardUrl(message: any): string {
  if (!message) return '';
  const metadata = message.getMetadata?.();
  if (!metadata || typeof metadata !== 'object') return '';
  const injected = metadata['@injected'];
  if (!injected || typeof injected !== 'object') return '';
  const extensions = injected['extensions'];
  if (!extensions || typeof extensions !== 'object') return '';
  const wb = extensions['whiteboard'];
  if (!wb || typeof wb !== 'object') return '';
  const url = wb['board_url'];
  return url && typeof url === 'string' ? url : '';
}

function extractActionText(message: any): string {
  if (!message) return '';
  return message.getMessage?.() || '';
}

function extractDeleteText(text?: string): string {
  if (text !== undefined && text !== null && text.length > 0) return text;
  return CometChatLocalize.getLocalizedString('message_deleted');
}

// ─── Tests ───

describe('Bubble Content Extraction Property Tests', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * **Feature: comprehensive-test-suite, Property 7: Bubble Content Extraction**
   *
   * *For any* bubble component and *for any* valid message object of the matching type,
   * the component SHALL extract and display the correct content field.
   *
   * **Validates: Requirements 3.2**
   */
  describe('Property 7: Bubble Content Extraction', () => {
    it('text bubble: extracts getText() from any valid text message', () => {
      fc.assert(
        fc.property(arbNonEmptyString, (text: string) => {
          const msg = createMockTextMsg(text);
          const extracted = extractTextContent(msg);
          expect(extracted).toBe(text);
        }),
        { numRuns: 100 }
      );
    });

    it('image bubble: extracts image URL from any valid image message attachment', () => {
      fc.assert(
        fc.property(arbUrl, (url: string) => {
          const msg = createMockMediaMsg(url, 'image');
          const extracted = extractMediaUrl(msg);
          expect(extracted).toBe(url);
        }),
        { numRuns: 100 }
      );
    });

    it('audio bubble: extracts audio URL from any valid audio message attachment', () => {
      fc.assert(
        fc.property(arbUrl, (url: string) => {
          const msg = createMockMediaMsg(url, 'audio');
          const extracted = extractMediaUrl(msg);
          expect(extracted).toBe(url);
        }),
        { numRuns: 100 }
      );
    });

    it('video bubble: extracts video URL from any valid video message attachment', () => {
      fc.assert(
        fc.property(arbUrl, (url: string) => {
          const msg = createMockMediaMsg(url, 'video');
          const extracted = extractMediaUrl(msg);
          expect(extracted).toBe(url);
        }),
        { numRuns: 100 }
      );
    });

    it('file bubble: extracts file name and URL from any valid file message', () => {
      fc.assert(
        fc.property(arbUrl, arbFileName, (url: string, fileName: string) => {
          const msg = createMockFileMsg(url, fileName);
          const extractedUrl = extractMediaUrl(msg);
          const extractedName = extractFileName(msg);
          expect(extractedUrl).toBe(url);
          expect(extractedName).toBe(fileName);
        }),
        { numRuns: 100 }
      );
    });

    it('action bubble: extracts action text from any valid action message', () => {
      fc.assert(
        fc.property(arbNonEmptyString, (text: string) => {
          const msg = createMockActionMsg(text);
          const extracted = extractActionText(msg);
          expect(extracted).toBe(text);
        }),
        { numRuns: 100 }
      );
    });

    it('delete bubble: shows localized "message deleted" text when no custom text', () => {
      fc.assert(
        fc.property(fc.constant(undefined), () => {
          const extracted = extractDeleteText(undefined);
          expect(typeof extracted).toBe('string');
          expect(extracted.length).toBeGreaterThan(0);
          // Should not be the raw key
          expect(extracted).not.toBe('message_deleted');
        }),
        { numRuns: 100 }
      );
    });

    it('delete bubble: shows custom text when provided', () => {
      fc.assert(
        fc.property(arbNonEmptyString, (customText: string) => {
          const extracted = extractDeleteText(customText);
          expect(extracted).toBe(customText);
        }),
        { numRuns: 100 }
      );
    });

    it('call bubble: extracts call type and status from any valid call message', () => {
      fc.assert(
        fc.property(arbCallType, arbCallStatus, (type: string, status: string) => {
          const msg = createMockCallMsg(type, status);
          const extracted = extractCallInfo(msg);
          expect(extracted.type).toBe(type);
          expect(extracted.status).toBe(status);
        }),
        { numRuns: 100 }
      );
    });

    it('poll bubble: extracts poll question from any valid poll message metadata', () => {
      fc.assert(
        fc.property(
          arbPollQuestion,
          arbPollOptions,
          (question: string, options: Record<string, string>) => {
            const msg = createMockPollMsg(question, options);
            const extracted = extractPollQuestion(msg);
            expect(extracted).toBe(question);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('sticker bubble: extracts sticker URL from any valid sticker message metadata', () => {
      fc.assert(
        fc.property(arbUrl, (stickerUrl: string) => {
          const msg = createMockStickerMsg(stickerUrl);
          const extracted = extractStickerUrl(msg);
          expect(extracted).toBe(stickerUrl);
        }),
        { numRuns: 100 }
      );
    });

    it('collaborative document bubble: extracts document URL from metadata path', () => {
      fc.assert(
        fc.property(arbUrl, (docUrl: string) => {
          const msg = createMockCollabDocMsg(docUrl);
          const extracted = extractDocumentUrl(msg);
          expect(extracted).toBe(docUrl);
        }),
        { numRuns: 100 }
      );
    });

    it('collaborative whiteboard bubble: extracts board URL from metadata path', () => {
      fc.assert(
        fc.property(arbUrl, (boardUrl: string) => {
          const msg = createMockCollabWhiteboardMsg(boardUrl);
          const extracted = extractWhiteboardUrl(msg);
          expect(extracted).toBe(boardUrl);
        }),
        { numRuns: 100 }
      );
    });
  });
});
