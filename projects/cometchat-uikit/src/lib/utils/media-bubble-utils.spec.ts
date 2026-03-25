/**
 * Media Bubble Utilities Tests
 *
 * Tests for shared utilities extracted from cometchat-image-bubble
 * and cometchat-video-bubble: extractMediaAttachments, extractMediaCaption,
 * extractSenderInfo, determineMediaLayout.
 *
 * Categories: Attachment Extraction, Caption Extraction, Sender Info,
 *             Layout Determination, Null/Invalid Input, Error Handling
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import {
  extractMediaAttachments,
  extractMediaCaption,
  extractSenderInfo,
  determineMediaLayout,
} from './media-bubble-utils';

function createMockMediaMessage(overrides: Record<string, any> = {}): CometChat.MediaMessage {
  return {
    getAttachments: () => overrides.attachments ?? null,
    getText: () => overrides.text ?? null,
    getData: () => overrides.data ?? null,
    getSender: () => overrides.sender ?? null,
    ...overrides,
  } as unknown as CometChat.MediaMessage;
}

describe('extractMediaAttachments', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return empty array for null message', () => {
    expect(extractMediaAttachments(null, 'image', 'Test')).toEqual([]);
  });

  it('should return empty array for undefined message', () => {
    expect(extractMediaAttachments(undefined, 'image', 'Test')).toEqual([]);
  });

  it('should return empty array when attachments is null', () => {
    const msg = createMockMediaMessage({ attachments: null });
    expect(extractMediaAttachments(msg, 'image', 'Test')).toEqual([]);
  });

  it('should extract valid image attachments', () => {
    const msg = createMockMediaMessage({
      attachments: [
        { url: 'https://example.com/img.jpg', thumbnail: 'https://example.com/thumb.jpg', metadata: { width: 800, height: 600 } },
      ],
    });

    const result = extractMediaAttachments(msg, 'image', 'Test');
    expect(result).toHaveLength(1);
    expect(result[0].url).toBe('https://example.com/img.jpg');
    expect(result[0].type).toBe('image');
    expect(result[0].width).toBe(800);
    expect(result[0].height).toBe(600);
  });

  it('should add duration for video attachments', () => {
    const msg = createMockMediaMessage({
      attachments: [
        { url: 'https://example.com/vid.mp4', metadata: { duration: 120 } },
      ],
    });

    const result = extractMediaAttachments(msg, 'video', 'Test');
    expect(result[0].duration).toBe(120);
  });

  it('should skip attachments without URL', () => {
    const msg = createMockMediaMessage({
      attachments: [
        { url: 'https://example.com/img.jpg', metadata: {} },
        { metadata: {} }, // no url
      ],
    });

    const result = extractMediaAttachments(msg, 'image', 'Test');
    expect(result).toHaveLength(1);
  });

  it('should handle getAttachments throwing', () => {
    const msg = {
      getAttachments: () => { throw new Error('fail'); },
    } as unknown as CometChat.MediaMessage;

    expect(extractMediaAttachments(msg, 'image', 'Test')).toEqual([]);
    expect(errorSpy).toHaveBeenCalled();
  });
});

describe('extractMediaCaption', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return empty string for null message', () => {
    expect(extractMediaCaption(null, 'Test')).toBe('');
  });

  it('should extract caption from getText()', () => {
    const msg = createMockMediaMessage({ text: 'Hello caption' });
    expect(extractMediaCaption(msg, 'Test')).toBe('Hello caption');
  });

  it('should fall back to getData().text', () => {
    const msg = createMockMediaMessage({ text: null, data: { text: 'Data caption' } });
    expect(extractMediaCaption(msg, 'Test')).toBe('Data caption');
  });

  it('should return empty string when no caption found', () => {
    const msg = createMockMediaMessage({ text: null, data: null });
    expect(extractMediaCaption(msg, 'Test')).toBe('');
  });

  it('should return empty string for whitespace-only text', () => {
    const msg = createMockMediaMessage({ text: '   ' });
    expect(extractMediaCaption(msg, 'Test')).toBe('');
  });
});

describe('extractSenderInfo', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return empty strings for null message', () => {
    expect(extractSenderInfo(null, 'Test')).toEqual({ senderName: '', senderAvatarUrl: '' });
  });

  it('should extract sender name and avatar', () => {
    const msg = createMockMediaMessage({
      sender: {
        getName: () => 'John',
        getAvatar: () => 'https://example.com/avatar.jpg',
      },
    });

    const result = extractSenderInfo(msg, 'Test');
    expect(result.senderName).toBe('John');
    expect(result.senderAvatarUrl).toBe('https://example.com/avatar.jpg');
  });

  it('should fall back to direct properties', () => {
    const msg = createMockMediaMessage({
      sender: { name: 'Jane', avatar: 'https://example.com/jane.jpg' },
    });

    const result = extractSenderInfo(msg, 'Test');
    expect(result.senderName).toBe('Jane');
    expect(result.senderAvatarUrl).toBe('https://example.com/jane.jpg');
  });

  it('should return empty strings when sender is null', () => {
    const msg = createMockMediaMessage({ sender: null });
    expect(extractSenderInfo(msg, 'Test')).toEqual({ senderName: '', senderAvatarUrl: '' });
  });
});

describe('determineMediaLayout', () => {
  it('should return single for 1 attachment', () => {
    expect(determineMediaLayout(1)).toEqual({ layoutType: 'single', overflowCount: 0 });
  });

  it('should return grid for 2-3 attachments', () => {
    expect(determineMediaLayout(2)).toEqual({ layoutType: 'grid', overflowCount: 0 });
    expect(determineMediaLayout(3)).toEqual({ layoutType: 'grid', overflowCount: 0 });
  });

  it('should return grid-2x2 for 4 attachments', () => {
    expect(determineMediaLayout(4)).toEqual({ layoutType: 'grid-2x2', overflowCount: 0 });
  });

  it('should return overflow for 5+ attachments', () => {
    expect(determineMediaLayout(5)).toEqual({ layoutType: 'overflow', overflowCount: 1 });
    expect(determineMediaLayout(10)).toEqual({ layoutType: 'overflow', overflowCount: 6 });
  });

  it('should return single for 0 attachments', () => {
    expect(determineMediaLayout(0)).toEqual({ layoutType: 'single', overflowCount: 0 });
  });
});
