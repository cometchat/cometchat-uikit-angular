/**
 * message-list.translation-utils Tests
 *
 * Covers: getCachedTranslationImpl, clearTranslationCacheImpl,
 *         translateMessageImpl (cache hit, not found, non-text, success, error),
 *         flagMessageImpl.
 *
 * @module services/message-list.translation-utils
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import {
  getCachedTranslationImpl,
  clearTranslationCacheImpl,
  translateMessageImpl,
  flagMessageImpl,
} from './message-list.translation-utils';
import { CometChatUIKitConstants } from '../constants';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTextMessage(id: number, text = 'Hello'): CometChat.BaseMessage {
  const msg = new CometChat.TextMessage('r1', text, CometChat.RECEIVER_TYPE.USER);
  (msg as any).id = id;
  (msg as any).getId = () => id;
  (msg as any).getType = () => CometChatUIKitConstants.MessageTypes.text;
  (msg as any).getText = () => text;
  return msg as unknown as CometChat.BaseMessage;
}

function makeImageMessage(id: number): CometChat.BaseMessage {
  const msg = new CometChat.MediaMessage('r1', {} as File, 'image', CometChat.RECEIVER_TYPE.USER);
  (msg as any).id = id;
  (msg as any).getId = () => id;
  (msg as any).getType = () => 'image';
  return msg as unknown as CometChat.BaseMessage;
}

function makeCtx(messages: CometChat.BaseMessage[] = []) {
  const messageIdMap = new Map<number, CometChat.BaseMessage>();
  messages.forEach(m => messageIdMap.set(m.getId(), m));

  return {
    translationCache: new Map<string, string>(),
    messageIdMap,
    normalizeMessageId: (id: string | number) => Number(id),
    errorCallback: null as any,
  };
}

describe('message-list.translation-utils', () => {

  // ==================== getCachedTranslationImpl ====================

  describe('getCachedTranslationImpl', () => {
    it('should return undefined when no cache entry', () => {
      const ctx = makeCtx();
      expect(getCachedTranslationImpl(ctx, 1, 'en')).toBeUndefined();
    });

    it('should return cached translation', () => {
      const ctx = makeCtx();
      ctx.translationCache.set('1_en', 'Bonjour');
      expect(getCachedTranslationImpl(ctx, 1, 'en')).toBe('Bonjour');
    });

    it('should use correct cache key format', () => {
      const ctx = makeCtx();
      ctx.translationCache.set('42_fr', 'Salut');
      expect(getCachedTranslationImpl(ctx, 42, 'fr')).toBe('Salut');
    });
  });

  // ==================== clearTranslationCacheImpl ====================

  describe('clearTranslationCacheImpl', () => {
    it('should clear all cache entries', () => {
      const ctx = makeCtx();
      ctx.translationCache.set('1_en', 'Hello');
      ctx.translationCache.set('2_fr', 'Bonjour');
      clearTranslationCacheImpl(ctx);
      expect(ctx.translationCache.size).toBe(0);
    });

    it('should not throw when cache is empty', () => {
      const ctx = makeCtx();
      expect(() => clearTranslationCacheImpl(ctx)).not.toThrow();
    });
  });

  // ==================== translateMessageImpl ====================

  describe('translateMessageImpl', () => {
    it('should return cached translation without calling SDK', async () => {
      const msg = makeTextMessage(1, 'Hello');
      const ctx = makeCtx([msg]);
      ctx.translationCache.set('1_en', 'Cached translation');
      const result = await translateMessageImpl(ctx, msg, 'en');
      expect(result).toBe('Cached translation');
      expect(CometChat.callExtension).not.toHaveBeenCalled();
    });

    it('should throw when message not found in map', async () => {
      const ctx = makeCtx([]);
      const msg = makeTextMessage(999, 'Hello');
      await expect(translateMessageImpl(ctx, msg, 'en')).rejects.toThrow();
    });

    it('should throw for non-text messages', async () => {
      const msg = makeImageMessage(1);
      const ctx = makeCtx([msg]);
      await expect(translateMessageImpl(ctx, msg, 'en')).rejects.toThrow();
    });

    it('should call CometChat.callExtension for translation', async () => {
      const msg = makeTextMessage(1, 'Hello');
      const ctx = makeCtx([msg]);
      vi.mocked(CometChat.callExtension).mockResolvedValueOnce({
        translations: [{ language_translated: 'fr', message_translated: 'Bonjour' }],
      } as any);
      const result = await translateMessageImpl(ctx, msg, 'fr');
      expect(CometChat.callExtension).toHaveBeenCalledWith(
        'message-translation', 'POST', 'v2/translate',
        expect.objectContaining({ msgId: 1, text: 'Hello', languages: ['fr'] })
      );
      expect(result).toBe('Bonjour');
    });

    it('should cache the translation result', async () => {
      const msg = makeTextMessage(1, 'Hello');
      const ctx = makeCtx([msg]);
      vi.mocked(CometChat.callExtension).mockResolvedValueOnce({
        translations: [{ language_translated: 'fr', message_translated: 'Bonjour' }],
      } as any);
      await translateMessageImpl(ctx, msg, 'fr');
      expect(ctx.translationCache.get('1_fr')).toBe('Bonjour');
    });

    it('should return empty string and call errorCallback on SDK error', async () => {
      const msg = makeTextMessage(1, 'Hello');
      const errorCb = vi.fn();
      const ctx = makeCtx([msg]);
      ctx.errorCallback = errorCb;
      vi.mocked(CometChat.callExtension).mockRejectedValueOnce(new Error('API error'));
      const result = await translateMessageImpl(ctx, msg, 'fr');
      expect(result).toBe('');
      expect(errorCb).toHaveBeenCalled();
    });

    it('should throw when translation language not found in response', async () => {
      const msg = makeTextMessage(1, 'Hello');
      const ctx = makeCtx([msg]);
      vi.mocked(CometChat.callExtension).mockResolvedValueOnce({
        translations: [{ language_translated: 'de', message_translated: 'Hallo' }],
      } as any);
      const result = await translateMessageImpl(ctx, msg, 'fr');
      // Returns '' because the error is caught
      expect(result).toBe('');
    });
  });

  // ==================== flagMessageImpl ====================

  describe('flagMessageImpl', () => {
    it('should throw when message not found', async () => {
      const ctx = makeCtx([]);
      const msg = makeTextMessage(999);
      await expect(flagMessageImpl(ctx, msg, 'spam')).rejects.toThrow();
    });

    it('should call CometChat.flagMessage with correct args', async () => {
      const msg = makeTextMessage(1);
      const ctx = makeCtx([msg]);
      const original = (CometChat as any).flagMessage;
      (CometChat as any).flagMessage = vi.fn().mockResolvedValue(undefined);
      await flagMessageImpl(ctx, msg, 'spam', 'test remark');
      expect((CometChat as any).flagMessage).toHaveBeenCalledWith('1', expect.objectContaining({ reasonId: 'spam', remark: 'test remark' }));
      (CometChat as any).flagMessage = original;
    });

    it('should not include remark when empty', async () => {
      const msg = makeTextMessage(1);
      const ctx = makeCtx([msg]);
      const original = (CometChat as any).flagMessage;
      (CometChat as any).flagMessage = vi.fn().mockResolvedValue(undefined);
      await flagMessageImpl(ctx, msg, 'spam', '');
      expect((CometChat as any).flagMessage).toHaveBeenCalledWith('1', expect.not.objectContaining({ remark: expect.anything() }));
      (CometChat as any).flagMessage = original;
    });

    it('should throw when SDK call fails', async () => {
      const msg = makeTextMessage(1);
      const ctx = makeCtx([msg]);
      const original = (CometChat as any).flagMessage;
      (CometChat as any).flagMessage = vi.fn().mockRejectedValue(new Error('flag failed'));
      await expect(flagMessageImpl(ctx, msg, 'spam')).rejects.toThrow();
      (CometChat as any).flagMessage = original;
    });
  });
});
