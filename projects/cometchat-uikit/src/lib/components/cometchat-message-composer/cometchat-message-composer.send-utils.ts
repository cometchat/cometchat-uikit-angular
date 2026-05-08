/**
 * Extracted message sending logic for CometChatMessageComposerComponent.
 */
import {CometChat} from '@cometchat/chat-sdk-javascript';
import {CometChatMessageEvents} from '../../events/CometChatMessageEvents';
import {MessageStatus} from '../../Enums/Enums';
import {CometChatUIKitUtility} from '../../CometChatUIKitUtility';
import {CometChatLogger} from '../../utils/CometChatLogger';
import {CometChatTextFormatter} from '../../formatters/cometchat-text-formatter';
import {MessageComposerService} from '../../services/message-composer.service';
import {AttachmentFile} from './cometchat-message-composer.component';

export interface SendUtilsContext {
  parentMessageId?: number;
  disableMentions: boolean;
  mentionedUsersMap: Map<string, CometChat.User>;
  mentionSuggestions: () => Array<{ uid: string; entity?: CometChat.User | CometChat.Group }>;
  customRichTextEditor: any;
  richTextEditorService: { getUniqueMentionUids(editor: any): Set<string> };
  plainTextMentionUids: Set<string>;
  composerText: () => string;
  messageToReplySignal: () => CometChat.BaseMessage | null;
  messageToEdit: CometChat.BaseMessage | null;
  textMessageToEdit: () => CometChat.BaseMessage | null;
  isInEditMode: () => boolean;
  isEditMode: { set(v: boolean): void };
  textFormatterArray: () => CometChatTextFormatter[];
  messageComposerService: MessageComposerService;
  clearComposer(): void;
  resetMentionsFormatter(): void;
  exitReplyMode(): void;
  playOutgoingMessageSound(): void;
  emitError(error: unknown): void;
  getMediaMessageType(fileType: 'image' | 'video' | 'audio' | 'file'): string;
  sendButtonClick: { emit(v: CometChat.BaseMessage): void };
  announceMessageSent(): void;
  closePreview: { emit(): void };
  textChange: { emit(v: string): void };
}

export function buildMessageMetadataImpl(_ctx: SendUtilsContext): Record<string, unknown> | undefined {
  return undefined;
}

export function extractMentionedUsersImpl(ctx: SendUtilsContext): CometChat.User[] {
  if (ctx.disableMentions) { return []; }
  const mentionedUsers: CometChat.User[] = [];
  const addedUids = new Set<string>();
  const userMap = new Map<string, CometChat.User>();
  ctx.mentionedUsersMap.forEach((user, uid) => { userMap.set(uid, user); });
  const suggestions = ctx.mentionSuggestions();
  suggestions.forEach(suggestion => {
    if (suggestion.entity && suggestion.entity instanceof CometChat.User) { userMap.set(suggestion.uid, suggestion.entity); }
  });
  const uids = new Set<string>();
  if (ctx.customRichTextEditor) { const editorUids = ctx.richTextEditorService.getUniqueMentionUids(ctx.customRichTextEditor); editorUids.forEach((uid: string) => uids.add(uid)); } else {
    ctx.plainTextMentionUids.forEach(uid => uids.add(uid));
  }
  const text = ctx.composerText();
  const sdkMentionRegex = /<@uid:([^>]+)>/g;
  let match;
  while ((match = sdkMentionRegex.exec(text)) !== null) { uids.add(match[1]); }
  uids.forEach(uid => {
    if (!addedUids.has(uid)) {
      const user = userMap.get(uid);
      if (user) {
        const minimalUser = new CometChat.User({ uid: user.getUid(), name: user.getName() });
        mentionedUsers.push(minimalUser);
        addedUids.add(uid);
      }
    }
  });
  return mentionedUsers;
}

export function applyTextFormattersImpl<T extends CometChat.TextMessage>(ctx: SendUtilsContext, message: T): T {
  let formattedMessage = message;
  for (const formatter of ctx.textFormatterArray()) {
    const formatterWithMethod = formatter as unknown as { formatMessageForSending?: <M extends CometChat.TextMessage>(msg: M) => M };
    if (typeof formatterWithMethod.formatMessageForSending === 'function') {
      formattedMessage = formatterWithMethod.formatMessageForSending(formattedMessage);
    }
  }
  return formattedMessage;
}

export async function handleEditMessageImpl(
  ctx: SendUtilsContext,
  newText: string,
  messageToEdit: CometChat.BaseMessage
): Promise<void> {
  if (!messageToEdit) { return; }
  (ctx as any).textMessageToEdit.set ? (ctx as any).textMessageToEdit.set(null) : null;
  ctx.isEditMode.set(false);
  (ctx as any).composerText.set ? (ctx as any).composerText.set('') : null;
  ctx.textChange.emit('');
  if (ctx.customRichTextEditor) { (ctx as any).richTextEditorService.clearContent(ctx.customRichTextEditor); }
  (ctx as any).originalTextBeforeEdit = '';
  ctx.closePreview.emit();
  try {
    const editedMessage = await ctx.messageComposerService.editMessage(messageToEdit, newText);
    if (editedMessage) {
      CometChatMessageEvents.ccMessageEdited.next({ message: editedMessage, status: MessageStatus.success, parentMessageId: ctx.parentMessageId ?? null });
      ctx.sendButtonClick.emit(editedMessage);
      ctx.announceMessageSent();
      ctx.playOutgoingMessageSound();
    }
  } catch (error) {
    CometChatMessageEvents.ccMessageEdited.next({ message: messageToEdit, status: MessageStatus.error, parentMessageId: ctx.parentMessageId ?? null });
    ctx.emitError(error);
    CometChatLogger.error('CometChatMessageComposer', 'Error editing message:', error);
  }
}

export async function handleSendNewMessageImpl(
  ctx: SendUtilsContext,
  receiver: CometChat.User | CometChat.Group,
  text: string,
  attachments: AttachmentFile[]
): Promise<void> {
  let lastSentMessage: CometChat.BaseMessage | null = null;
  const metadata = buildMessageMetadataImpl(ctx);
  const mentionedUsers = extractMentionedUsersImpl(ctx);
  const quotedMessage = ctx.messageToReplySignal() || undefined;
  if (text.length > 0) {
    const receiverId = receiver instanceof CometChat.User ? receiver.getUid() : receiver.getGuid();
    const receiverType = receiver instanceof CometChat.User ? CometChat.RECEIVER_TYPE.USER : CometChat.RECEIVER_TYPE.GROUP;
    const pendingTextMessage = new CometChat.TextMessage(receiverId, text, receiverType);
    if (metadata) { pendingTextMessage.setMetadata(metadata); }
    if (ctx.parentMessageId) { pendingTextMessage.setParentMessageId(ctx.parentMessageId); }
    if (quotedMessage) { pendingTextMessage.setQuotedMessage(quotedMessage); pendingTextMessage.setQuotedMessageId(quotedMessage.getId()); }
    if (mentionedUsers.length > 0) { pendingTextMessage.setMentionedUsers(mentionedUsers); }
    pendingTextMessage.setMuid(CometChatUIKitUtility.ID());
    pendingTextMessage.setSentAt(CometChatUIKitUtility.getUnixTimestamp());
    CometChatMessageEvents.ccMessageSent.next({ message: pendingTextMessage, status: MessageStatus.inprogress });
    ctx.clearComposer();
    ctx.resetMentionsFormatter();
    try {
      const textMessage = await ctx.messageComposerService.sendTextMessage(receiver, text, metadata, ctx.parentMessageId, quotedMessage, pendingTextMessage);
      if (textMessage) {
        applyTextFormattersImpl(ctx, textMessage);
        lastSentMessage = textMessage;
        CometChatMessageEvents.ccMessageSent.next({ message: textMessage, status: MessageStatus.success });
      } else {
        CometChatMessageEvents.ccMessageSent.next({ message: pendingTextMessage, status: MessageStatus.error });
      }
    } catch (error) {
      CometChatMessageEvents.ccMessageSent.next({ message: pendingTextMessage, status: MessageStatus.error });
      ctx.emitError(error);
      throw error;
    }
  }
  let composerClearedForMedia = false;
  for (const attachment of attachments) {
    const mediaType = ctx.getMediaMessageType(attachment.type);
    const receiverId = receiver instanceof CometChat.User ? receiver.getUid() : receiver.getGuid();
    const receiverType = receiver instanceof CometChat.User ? CometChat.RECEIVER_TYPE.USER : CometChat.RECEIVER_TYPE.GROUP;
    const pendingMediaMessage = new CometChat.MediaMessage(receiverId, attachment.file, mediaType, receiverType);
    if (ctx.parentMessageId) { pendingMediaMessage.setParentMessageId(ctx.parentMessageId); }
    if (quotedMessage) { pendingMediaMessage.setQuotedMessage(quotedMessage); pendingMediaMessage.setQuotedMessageId(quotedMessage.getId()); }
    pendingMediaMessage.setMuid(CometChatUIKitUtility.ID());
    pendingMediaMessage.setSentAt(CometChatUIKitUtility.getUnixTimestamp());
    CometChatMessageEvents.ccMessageSent.next({ message: pendingMediaMessage, status: MessageStatus.inprogress });
    if (text.length === 0 && !composerClearedForMedia) { ctx.clearComposer(); ctx.resetMentionsFormatter(); composerClearedForMedia = true; }
    try {
      const mediaMessage = await ctx.messageComposerService.sendMediaMessage(receiver, attachment.file, mediaType, undefined, ctx.parentMessageId, quotedMessage, pendingMediaMessage);
      if (mediaMessage) {
        lastSentMessage = mediaMessage;
        CometChatMessageEvents.ccMessageSent.next({ message: mediaMessage, status: MessageStatus.success });
      } else {
        CometChatMessageEvents.ccMessageSent.next({ message: pendingMediaMessage, status: MessageStatus.error });
      }
    } catch (error) {
      CometChatMessageEvents.ccMessageSent.next({ message: pendingMediaMessage, status: MessageStatus.error });
      ctx.emitError(error);
      CometChatLogger.error('CometChatMessageComposer', 'Error sending media message:', error);
    }
    if (attachment.thumbnailUrl) { URL.revokeObjectURL(attachment.thumbnailUrl); }
  }
  if (quotedMessage && lastSentMessage) {
    CometChatMessageEvents.ccReplyToMessage.next({ message: lastSentMessage, status: MessageStatus.success });
  }
  if (lastSentMessage) { ctx.sendButtonClick.emit(lastSentMessage); ctx.announceMessageSent(); }
  ctx.playOutgoingMessageSound();
}
