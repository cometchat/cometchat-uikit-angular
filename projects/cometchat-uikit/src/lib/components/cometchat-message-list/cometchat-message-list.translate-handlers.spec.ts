/**
 * cometchat-message-list.translate-handlers Tests
 *
 * Covers: getTranslatedTextImpl, isMessageTranslatingImpl,
 *         isMessageTranslatedImpl, getDefaultTranslationLanguageImpl,
 *         translateMessageImpl (toggle, skip non-text, skip in-progress,
 *         success, error).
 *
 * @module components/cometchat-message-list/translate-handlers
 */

import { describe, it, expect, vi } from 'vitest';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import {
  getTranslatedTextImpl,
  isMessageTranslatingImpl,
  isMessageTranslatedImpl,
  getDefaultTranslationLanguageImpl,
  translateMessageImpl,
  TranslateHandlerContext,
} from './cometchat-message-list.translate-handlers';
import { CometChatUIKitConstants } from '../../constants';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTextMessage(id: number): CometChat.BaseMessage {
  const msg = new CometChat.TextMessage('r1', 'Hello', CometChat.RECEIVER_TYPE.USER);
  (msg as any).id = id;
  (msg as any).getId = () => id;
  (msg as any).getType = () => CometChatUIKitConstants.MessageTypes.text;
  return msg as unknown as CometChat.BaseMessage;
}

function makeImageMessage(id: number): CometChat.BaseMessage {
  const msg = new CometChat.MediaMessage('r1', {} as File, 'image', CometChat.RECEIVER_TYPE.USER);
  (msg as any).id = id;
  (msg as any).getId = () => id;
  (msg as any).getType = () => 'image';
  return msg as unknown as CometChat.BaseMessage;
}

function makeCtx(overrides: Partial<TranslateHandlerContext> = {}): TranslateHandlerContext {
  let _translated = new Map<number, string>();
  let _translating = new Set<number>();

  return {
    translatedMessages: Object.assign(() => _translated, {
      update: vi.fn((fn: (m: Map<number, string>) => Map<number, string>) => { _translated = fn(_translated); }),
    }),
    translatingMessages: Object.assign(() => _translating, {
      update: vi.fn((fn: (s: Set<number>) => Set<number>) => { _translating = fn(_translating); }),
    }),
    preferredTranslationLanguage: vi.fn().mockReturnValue('en'),
    messageListService: {
      translateMessage: vi.fn().mockResolvedValue('Translated text'),
    },
    showInlineToast: vi.fn(),
    ...overrides,
  };
}

describe('cometchat-message-list.translate-handlers', () => {

  // ==================== getTranslatedTextImpl ====================

  describe('getTranslatedTextImpl', () => {
    it('should return undefined when no translation', () => {
      const ctx = makeCtx();
      expect(getTranslatedTextImpl(ctx, 1)).toBeUndefined();
    });

    it('should return translated text when available', () => {
      const ctx = makeCtx();
      ctx.translatedMessages().set(1, 'Bonjour');
      expect(getTranslatedTextImpl(ctx, 1)).toBe('Bonjour');
    });
  });

  // ==================== isMessageTranslatingImpl ====================

  describe('isMessageTranslatingImpl', () => {
    it('should return false when not translating', () => {
      const ctx = makeCtx();
      expect(isMessageTranslatingImpl(ctx, 1)).toBe(false);
    });

    it('should return true when translating', () => {
      const ctx = makeCtx();
      ctx.translatingMessages().add(1);
      expect(isMessageTranslatingImpl(ctx, 1)).toBe(true);
    });
  });

  // ==================== isMessageTranslatedImpl ====================

  describe('isMessageTranslatedImpl', () => {
    it('should return false when not translated', () => {
      const ctx = makeCtx();
      expect(isMessageTranslatedImpl(ctx, 1)).toBe(false);
    });

    it('should return true when translated', () => {
      const ctx = makeCtx();
      ctx.translatedMessages().set(1, 'Bonjour');
      expect(isMessageTranslatedImpl(ctx, 1)).toBe(true);
    });
  });

  // ==================== getDefaultTranslationLanguageImpl ====================

  describe('getDefaultTranslationLanguageImpl', () => {
    it('should return a non-empty string', () => {
      const lang = getDefaultTranslationLanguageImpl();
      expect(typeof lang).toBe('string');
      expect(lang.length).toBeGreaterThan(0);
    });
  });

  // ==================== translateMessageImpl ====================

  describe('translateMessageImpl', () => {
    it('should return early for non-text messages', async () => {
      const ctx = makeCtx();
      const msg = makeImageMessage(1);
      await translateMessageImpl(ctx, msg);
      expect(ctx.messageListService.translateMessage).not.toHaveBeenCalled();
    });

    it('should toggle off translation when already translated', async () => {
      const ctx = makeCtx();
      const msg = makeTextMessage(1);
      ctx.translatedMessages().set(1, 'Bonjour');
      await translateMessageImpl(ctx, msg);
      // Should remove from translated map
      expect(ctx.translatedMessages.update).toHaveBeenCalled();
      expect(ctx.messageListService.translateMessage).not.toHaveBeenCalled();
    });

    it('should return early when already translating', async () => {
      const ctx = makeCtx();
      const msg = makeTextMessage(1);
      ctx.translatingMessages().add(1);
      await translateMessageImpl(ctx, msg);
      expect(ctx.messageListService.translateMessage).not.toHaveBeenCalled();
    });

    it('should call messageListService.translateMessage', async () => {
      const ctx = makeCtx();
      const msg = makeTextMessage(1);
      await translateMessageImpl(ctx, msg);
      expect(ctx.messageListService.translateMessage).toHaveBeenCalledWith(msg, 'en');
    });

    it('should add message to translatedMessages on success', async () => {
      const ctx = makeCtx();
      const msg = makeTextMessage(1);
      await translateMessageImpl(ctx, msg);
      expect(ctx.translatedMessages.update).toHaveBeenCalled();
    });

    it('should show inline toast on success', async () => {
      const ctx = makeCtx();
      const msg = makeTextMessage(1);
      await translateMessageImpl(ctx, msg);
      expect(ctx.showInlineToast).toHaveBeenCalled();
    });

    it('should show error toast on failure', async () => {
      const ctx = makeCtx({
        messageListService: {
          translateMessage: vi.fn().mockRejectedValue(new Error('translate failed')),
        },
      });
      const msg = makeTextMessage(1);
      await translateMessageImpl(ctx, msg);
      expect(ctx.showInlineToast).toHaveBeenCalled();
    });

    it('should remove from translatingMessages in finally block', async () => {
      const ctx = makeCtx();
      const msg = makeTextMessage(1);
      await translateMessageImpl(ctx, msg);
      // translatingMessages.update should be called at least twice (add + remove)
      expect(ctx.translatingMessages.update).toHaveBeenCalledTimes(2);
    });

    it('should remove from translatingMessages even on error', async () => {
      const ctx = makeCtx({
        messageListService: {
          translateMessage: vi.fn().mockRejectedValue(new Error('fail')),
        },
      });
      const msg = makeTextMessage(1);
      await translateMessageImpl(ctx, msg);
      expect(ctx.translatingMessages.update).toHaveBeenCalledTimes(2);
    });
  });
});
