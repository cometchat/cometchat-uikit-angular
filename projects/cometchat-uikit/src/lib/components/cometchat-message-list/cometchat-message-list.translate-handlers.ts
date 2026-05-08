/**
 * Translation handler functions for CometChatMessageList.
 * Extracted to reduce component file size.
 */

import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatLocalize } from '../../resources/CometChatLocalize/cometchat-localize';
import { CometChatLogger } from '../../utils/CometChatLogger';
import { CometChatUIKitConstants } from '../../constants';
import { ToastType } from '../base-elements/cometchat-toast/cometchat-toast.component';

export interface TranslateHandlerContext {
  translatedMessages: any;
  translatingMessages: any;
  preferredTranslationLanguage: () => string;
  messageListService: any;
  showInlineToast: (text: string, type?: ToastType, duration?: number) => void;
}

export async function translateMessageImpl(ctx: TranslateHandlerContext, message: CometChat.BaseMessage): Promise<void> {
  if (message.getType() !== CometChatUIKitConstants.MessageTypes.text) { return; }
  const messageId = message.getId();
  const language = ctx.preferredTranslationLanguage();
  if (ctx.translatedMessages().has(messageId)) {
    ctx.translatedMessages.update((map: Map<number, string>) => {
      const newMap = new Map(map);
      newMap.delete(messageId);
      return newMap;
    });
    return;
  }
  if (ctx.translatingMessages().has(messageId)) { return; }
  ctx.translatingMessages.update((set: Set<number>) => {
    const newSet = new Set(set);
    newSet.add(messageId);
    return newSet;
  });
  try {
    const translatedText = await ctx.messageListService.translateMessage(message, language);
    ctx.translatedMessages.update((map: Map<number, string>) => {
      const newMap = new Map(map);
      newMap.set(messageId, translatedText);
      return newMap;
    });
    ctx.showInlineToast(CometChatLocalize.getLocalizedString('message_list_message_translated'));
  } catch (error) {
    CometChatLogger.error('CometChatMessageList', 'Error translating message:', error);
    ctx.showInlineToast(CometChatLocalize.getLocalizedString('message_translate_error'), ToastType.error, 3000);
  } finally {
    ctx.translatingMessages.update((set: Set<number>) => {
      const newSet = new Set(set);
      newSet.delete(messageId);
      return newSet;
    });
  }
}

export function getTranslatedTextImpl(ctx: TranslateHandlerContext, messageId: number): string | undefined {
  return ctx.translatedMessages().get(messageId);
}

export function isMessageTranslatingImpl(ctx: TranslateHandlerContext, messageId: number): boolean {
  return ctx.translatingMessages().has(messageId);
}

export function isMessageTranslatedImpl(ctx: TranslateHandlerContext, messageId: number): boolean {
  return ctx.translatedMessages().has(messageId);
}

export function getDefaultTranslationLanguageImpl(): string {
  const browserLang = navigator.language?.split('-')[0] || 'en';
  return browserLang;
}

export function setPreferredTranslationLanguageImpl(ctx: TranslateHandlerContext, language: string): void {
  (ctx as any).preferredTranslationLanguage.set(language);
}
