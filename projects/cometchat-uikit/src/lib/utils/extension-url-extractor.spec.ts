/**
 * Extension URL Extractor Tests
 *
 * Tests for the shared extractExtensionUrl utility extracted from
 * collaborative-document-bubble and collaborative-whiteboard-bubble.
 *
 * Categories: Successful Extraction, Missing/Invalid Metadata, Null/Undefined Input,
 *             Error Handling, Edge Cases
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { extractExtensionUrl } from './extension-url-extractor';
import { CometChat } from '@cometchat/chat-sdk-javascript';

function createMockCustomMessage(metadata: any): CometChat.CustomMessage {
  return {
    getMetadata: () => metadata,
  } as unknown as CometChat.CustomMessage;
}

describe('extractExtensionUrl', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── Successful Extraction ──

  describe('Successful Extraction', () => {
    it('should extract document URL from valid metadata', () => {
      const msg = createMockCustomMessage({
        '@injected': {
          extensions: {
            document: { document_url: 'https://example.com/doc' },
          },
        },
      });

      const url = extractExtensionUrl(msg, 'document', 'document_url', 'Test');
      expect(url).toBe('https://example.com/doc');
    });

    it('should extract whiteboard URL from valid metadata', () => {
      const msg = createMockCustomMessage({
        '@injected': {
          extensions: {
            whiteboard: { board_url: 'https://example.com/board' },
          },
        },
      });

      const url = extractExtensionUrl(msg, 'whiteboard', 'board_url', 'Test');
      expect(url).toBe('https://example.com/board');
    });
  });

  // ── Null/Undefined Input ──

  describe('Null/Undefined Input', () => {
    it('should return empty string for null message', () => {
      expect(extractExtensionUrl(null, 'doc', 'url', 'Test')).toBe('');
      expect(warnSpy).toHaveBeenCalled();
    });

    it('should return empty string for undefined message', () => {
      expect(extractExtensionUrl(undefined, 'doc', 'url', 'Test')).toBe('');
    });
  });

  // ── Missing/Invalid Metadata ──

  describe('Missing/Invalid Metadata', () => {
    it('should return empty string when getMetadata returns null', () => {
      const msg = createMockCustomMessage(null);
      expect(extractExtensionUrl(msg, 'doc', 'url', 'Test')).toBe('');
    });

    it('should return empty string when @injected is missing', () => {
      const msg = createMockCustomMessage({ other: 'data' });
      expect(extractExtensionUrl(msg, 'doc', 'url', 'Test')).toBe('');
    });

    it('should return empty string when extensions is missing', () => {
      const msg = createMockCustomMessage({ '@injected': { other: 'data' } });
      expect(extractExtensionUrl(msg, 'doc', 'url', 'Test')).toBe('');
    });

    it('should return empty string when extension key is missing', () => {
      const msg = createMockCustomMessage({
        '@injected': { extensions: { other: {} } },
      });
      expect(extractExtensionUrl(msg, 'document', 'document_url', 'Test')).toBe('');
    });

    it('should return empty string when URL key is missing', () => {
      const msg = createMockCustomMessage({
        '@injected': { extensions: { document: { other: 'value' } } },
      });
      expect(extractExtensionUrl(msg, 'document', 'document_url', 'Test')).toBe('');
    });

    it('should return empty string when URL value is not a string', () => {
      const msg = createMockCustomMessage({
        '@injected': { extensions: { document: { document_url: 123 } } },
      });
      expect(extractExtensionUrl(msg, 'document', 'document_url', 'Test')).toBe('');
    });
  });

  // ── Error Handling ──

  describe('Error Handling', () => {
    it('should return empty string and log error when getMetadata throws', () => {
      const msg = {
        getMetadata: () => { throw new Error('metadata error'); },
      } as unknown as CometChat.CustomMessage;

      expect(extractExtensionUrl(msg, 'doc', 'url', 'Test')).toBe('');
      expect(errorSpy).toHaveBeenCalled();
    });
  });
});
