/**
 * Typing indicator handler functions for CometChatMessageComposer.
 * Extracted to reduce component file size.
 */

import { CometChat } from '@cometchat/chat-sdk-javascript';

export interface TypingHandlerContext {
  disableTypingEvents: boolean;
  typingTimeout: ReturnType<typeof setTimeout> | undefined;
  currentUser: () => CometChat.User | null;
  currentGroup: () => CometChat.Group | null;
  messageComposerService: any;
  TYPING_TIMEOUT_MS: number;
  endTypingIndicator: () => void;
}

export function handleTypingStartImpl(ctx: TypingHandlerContext): void {
  if (ctx.disableTypingEvents) { return; }
  const receiver = getReceiverImpl(ctx);
  if (!receiver) { return; }
  if (ctx.currentUser()?.getBlockedByMe() || ctx.currentUser()?.getHasBlockedMe()) { return; }
  if (ctx.typingTimeout) {
    clearTimeout(ctx.typingTimeout);
    (ctx as any).typingTimeout = undefined;
  } else {
    startTypingImpl(ctx);
  }
  (ctx as any).typingTimeout = setTimeout(() => {
    ctx.endTypingIndicator();
    (ctx as any).typingTimeout = undefined;
  }, ctx.TYPING_TIMEOUT_MS);
}

export function startTypingImpl(ctx: TypingHandlerContext): void {
  const receiver = getReceiverImpl(ctx);
  if (receiver) { ctx.messageComposerService.startTyping(receiver); }
}

export function endTypingIndicatorImpl(ctx: TypingHandlerContext): void {
  const receiver = getReceiverImpl(ctx);
  if (receiver) { ctx.messageComposerService.endTyping(receiver); }
}

function getReceiverImpl(ctx: TypingHandlerContext): CometChat.User | CometChat.Group | undefined {
  return ctx.currentUser() ?? ctx.currentGroup() ?? undefined;
}
