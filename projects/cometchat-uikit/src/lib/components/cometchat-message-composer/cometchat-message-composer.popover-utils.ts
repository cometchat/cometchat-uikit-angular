import {CometChat} from '@cometchat/chat-sdk-javascript';
import {CometChatUIEvents} from '../../events/CometChatUIEvents';
import {CometChatMessageEvents} from '../../events/CometChatMessageEvents';
import {MessageStatus} from '../../Enums/Enums';
import {CometChatUIKitUtility} from '../../CometChatUIKitUtility';

export function syncLegacyPopoverSignalsImpl(ctx: any): void {
  const content = ctx.contentToDisplay();
  ctx.isEmojiKeyboardOpen.set(content === 'emojiKeyboard');
  ctx.isAttachmentMenuOpen.set(content === 'attachments');
  ctx.isRecording.set(content === 'voiceRecording');
  ctx.isStickersKeyboardOpen.set(content === 'stickers');
}

export function toggleEmojiKeyboardImpl(ctx: any): void {
  if (ctx.contentToDisplay() === 'emojiKeyboard') {
    ctx.contentToDisplay.set('none');
  } else {
    ctx.contentToDisplay.set('emojiKeyboard');
    CometChatUIEvents.ccActivePopover.next('emojiKeyboard');
  }
  syncLegacyPopoverSignalsImpl(ctx);
  ctx.isMentionSuggestionsOpen.set(false);
}

export function toggleAttachmentMenuImpl(ctx: any): void {
  if (ctx.contentToDisplay() === 'attachments') {
    ctx.contentToDisplay.set('none');
  } else {
    ctx.contentToDisplay.set('attachments');
    CometChatUIEvents.ccActivePopover.next('attachments');
  }
  syncLegacyPopoverSignalsImpl(ctx);
  ctx.isMentionSuggestionsOpen.set(false);
}

export function toggleVoiceRecordingImpl(ctx: any): void {
  if (ctx.contentToDisplay() === 'voiceRecording') {
    if (ctx.isRecording()) {
      ctx.isRecording.set(false);
      ctx.recordingDuration.set(0);
      ctx.announceRecordingStopped();
    }
    ctx.contentToDisplay.set('none');
  } else {
    ctx.contentToDisplay.set('voiceRecording');
    ctx.isRecording.set(true);
    ctx.announceRecordingStarted();
    CometChatUIEvents.ccActivePopover.next('voiceRecording');
  }
  syncLegacyPopoverSignalsImpl(ctx);
  ctx.isMentionSuggestionsOpen.set(false);
}

export function toggleStickersKeyboardImpl(ctx: any): void {
  if (ctx.contentToDisplay() === 'stickers') {
    ctx.contentToDisplay.set('none');
  } else {
    ctx.contentToDisplay.set('stickers');
    CometChatUIEvents.ccActivePopover.next('stickers');
  }
  syncLegacyPopoverSignalsImpl(ctx);
  ctx.isMentionSuggestionsOpen.set(false);
}

export function toggleAIImpl(ctx: any): void {
  if (ctx.contentToDisplay() === 'ai') {
    ctx.contentToDisplay.set('none');
  } else {
    ctx.contentToDisplay.set('ai');
    CometChatUIEvents.ccActivePopover.next('ai');
  }
  syncLegacyPopoverSignalsImpl(ctx);
  ctx.isMentionSuggestionsOpen.set(false);
}

export async function sendStickerMessageImpl(
  ctx: any,
  receiver: CometChat.User | CometChat.Group,
  stickerUrl: string,
  stickerName: string
): Promise<void> {
  const quotedMessage = ctx.messageToReplySignal() || undefined;
  const receiverId = receiver instanceof CometChat.User ? receiver.getUid() : receiver.getGuid();
  const receiverType =
    receiver instanceof CometChat.User
      ? CometChat.RECEIVER_TYPE.USER
      : CometChat.RECEIVER_TYPE.GROUP;
  const customData = { sticker_url: stickerUrl, sticker_name: stickerName };
  const pendingStickerMessage = new CometChat.CustomMessage(
    receiverId,
    receiverType,
    'extension_sticker',
    customData
  );
  pendingStickerMessage.setMuid(CometChatUIKitUtility.ID());
  pendingStickerMessage.setSentAt(CometChatUIKitUtility.getUnixTimestamp());
  if (ctx.parentMessageId) { pendingStickerMessage.setParentMessageId(ctx.parentMessageId); }
  if (quotedMessage) {
    pendingStickerMessage.setQuotedMessage(quotedMessage);
    pendingStickerMessage.setQuotedMessageId(quotedMessage.getId());
  }
  CometChatMessageEvents.ccMessageSent.next({
    message: pendingStickerMessage,
    status: MessageStatus.inprogress,
  });
  try {
    const sentMessage = await ctx.messageComposerService.sendStickerMessage(
      receiver,
      stickerUrl,
      stickerName,
      ctx.parentMessageId,
      quotedMessage,
      pendingStickerMessage
    );
    if (sentMessage) {
      CometChatMessageEvents.ccMessageSent.next({
        message: sentMessage,
        status: MessageStatus.success,
      });
      if (quotedMessage) {
        ctx.exitReplyMode();
        CometChatMessageEvents.ccReplyToMessage.next({
          message: sentMessage,
          status: MessageStatus.success,
        });
      }
      ctx.sendButtonClick.emit(sentMessage);
      ctx.announceMessageSent();
      ctx.playOutgoingMessageSound();
    } else {
      CometChatMessageEvents.ccMessageSent.next({
        message: pendingStickerMessage,
        status: MessageStatus.error,
      });
    }
  } catch (error) {
    CometChatMessageEvents.ccMessageSent.next({
      message: pendingStickerMessage,
      status: MessageStatus.error,
    });
    ctx.emitError(error);
    throw error;
  }
}
