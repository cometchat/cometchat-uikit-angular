import {CometChat} from '@cometchat/chat-sdk-javascript';
import {CometChatUIKitConstants} from '../constants';
import {CometChatLogger} from '../utils/CometChatLogger';

export async function translateMessageImpl(ctx: any, message: CometChat.BaseMessage, language: string): Promise<string> {
  const messageId = message.getId();
  const cacheKey = `${messageId}_${language}`;
  const cachedTranslation = ctx.translationCache.get(cacheKey);
  if (cachedTranslation) { return cachedTranslation; }
  const existingMessage = ctx.messageIdMap.get(ctx.normalizeMessageId(messageId));
  if (!existingMessage) {
    const error = new Error(`[MessageListService] translateMessage: Message with ID ${messageId} not found`);
    CometChatLogger.error('MessageListService', error.message);
    throw error;
  }
  if (message.getType() !== CometChatUIKitConstants.MessageTypes.text) {
    const error = new Error(`[MessageListService] translateMessage: Only text messages can be translated`);
    CometChatLogger.error('MessageListService', error.message);
    throw error;
  }
  try {
    const textMessage = message as CometChat.TextMessage;
    const originalText = textMessage.getText();
    const response = (await CometChat.callExtension(
      'message-translation',
      'POST',
      'v2/translate',
      { msgId: messageId, text: originalText, languages: [language] }
    )) as { translations: { language_translated: string; message_translated: string }[] };
    const translations = response?.translations || [];
    const translation = translations.find(t => t.language_translated === language);
    if (!translation) { throw new Error(`Translation for language '${language}' not found in response`); }
    const translatedText = translation.message_translated;
    ctx.translationCache.set(cacheKey, translatedText);
    return translatedText;
  } catch (error) {
    CometChatLogger.error('MessageListService', 'translateMessage: Failed to translate message', error);
    if (ctx.errorCallback) { ctx.errorCallback(error as CometChat.CometChatException); }
    return '';
  }
}

export function getCachedTranslationImpl(ctx: any, messageId: number, language: string): string | undefined {
  const cacheKey = `${messageId}_${language}`;
  return ctx.translationCache.get(cacheKey);
}

export function clearTranslationCacheImpl(ctx: any): void {
  ctx.translationCache.clear();
}

export async function flagMessageImpl(
  ctx: any,
  message: CometChat.BaseMessage,
  reasonId: string,
  remark?: string
): Promise<void> {
  const messageId = message.getId();
  const existingMessage = ctx.messageIdMap.get(ctx.normalizeMessageId(messageId));
  if (!existingMessage) {
    const error = new Error(`[MessageListService] flagMessage: Message with ID ${messageId} not found`);
    CometChatLogger.error('MessageListService', error.message);
    throw error;
  }
  try {
    await CometChat.flagMessage(String(messageId), {
      reasonId,
      ...(remark && remark.trim().length > 0 ? { remark: remark.trim() } : {}),
    });
  } catch (error) {
    CometChatLogger.error('MessageListService', 'flagMessage: Failed to flag message', error);
    throw error;
  }
}
