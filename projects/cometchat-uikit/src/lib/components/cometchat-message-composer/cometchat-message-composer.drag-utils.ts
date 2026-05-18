/**
 * Extracted drag/drop/paste/file handling logic for CometChatMessageComposerComponent.
 */
import {CometChat} from '@cometchat/chat-sdk-javascript';
import {CometChatMessageEvents} from '../../events/CometChatMessageEvents';
import {MessageStatus} from '../../Enums/Enums';
import {CometChatUIKitUtility} from '../../CometChatUIKitUtility';
import {CometChatLogger} from '../../utils/CometChatLogger';
import {CometChatLocalize} from '../../resources/CometChatLocalize/cometchat-localize';
import {MessageComposerService} from '../../services/message-composer.service';

export interface DragUtilsContext {
  isDraggingOver: { set(v: boolean): void };
  dragCounter: number;
  parentMessageId?: number;
  allowedFileTypes?: string[];
  maxFileSize?: number;
  fileSizeError: { set(v: any): void };
  messageComposerService: MessageComposerService;
  messageToReplySignal: () => CometChat.BaseMessage | null;
  getReceiver(): CometChat.User | CometChat.Group | undefined;
  getMediaMessageType(fileType: 'image' | 'video' | 'audio' | 'file'): string;
  getFileType(file: File): 'image' | 'video' | 'audio' | 'file';
  getFileTypeLabel(mimeType: string): string;
  exitReplyMode(): void;
  playOutgoingMessageSound(): void;
  emitError(error: unknown): void;
  sendButtonClick: { emit(v: CometChat.BaseMessage): void };
  announceMessageSent(): void;
}

export function handleDragEnterImpl(ctx: DragUtilsContext, event: DragEvent): void {
  event.preventDefault();
  event.stopPropagation();
  ctx.dragCounter++;
  ctx.isDraggingOver.set(true);
}

export function handleDragLeaveImpl(ctx: DragUtilsContext, event: DragEvent): void {
  event.preventDefault();
  event.stopPropagation();
  ctx.dragCounter--;
  if (ctx.dragCounter === 0) { ctx.isDraggingOver.set(false); }
}

export function handleDragOverImpl(_ctx: DragUtilsContext, event: DragEvent): void {
  event.preventDefault();
  event.stopPropagation();
}

export function handleDropImpl(ctx: DragUtilsContext, event: DragEvent): void {
  event.preventDefault();
  event.stopPropagation();
  ctx.dragCounter = 0;
  ctx.isDraggingOver.set(false);
  // Files should only be sent via the attachment button
}

export function handlePasteImpl(ctx: DragUtilsContext, event: ClipboardEvent): void {
  const clipboardData = event.clipboardData;
  if (!clipboardData) { return; }
  const items = clipboardData.items;
  for (let i = 0; i < items.length; i++) {
    if (items[i].kind === 'file') {
      event.preventDefault();
      return;
    }
  }
}

export function handleFileInputChangeImpl(ctx: DragUtilsContext, event: Event): void {
  const target = event.target as HTMLInputElement;
  const files = target.files;
  if (files && files.length > 0) { processFilesImpl(ctx, Array.from(files)); }
  target.value = '';
}

export function processFilesImpl(ctx: DragUtilsContext, files: File[]): void {
  const oversizedFiles: File[] = [];
  const invalidTypeFiles: File[] = [];
  const validFiles: File[] = [];
  for (const file of files) {
    if (ctx.allowedFileTypes && ctx.allowedFileTypes.length > 0) {
      if (!ctx.allowedFileTypes.includes(file.type)) { CometChatLogger.warn('CometChatMessageComposer', 'File type not allowed:', file.type); invalidTypeFiles.push(file); continue; }
    }
    const maxSize = ctx.maxFileSize || 100 * 1024 * 1024;
    if (file.size > maxSize) { CometChatLogger.warn('CometChatMessageComposer', 'File size exceeds limit:', file.size); oversizedFiles.push(file); continue; }
    validFiles.push(file);
  }
  if (invalidTypeFiles.length > 0) {
    const errorMessage = CometChatLocalize.getLocalizedString('message_composer_file_type_error') || `${invalidTypeFiles.length} file(s) have unsupported file type`;
    ctx.emitError(new Error(errorMessage));
  }
  if (oversizedFiles.length > 0) {
    const fileType = ctx.getFileTypeLabel(oversizedFiles[0].type);
    const maxSize = ctx.maxFileSize || 100 * 1024 * 1024;
    ctx.fileSizeError.set({ count: oversizedFiles.length, fileType, limitMB: Math.round(maxSize / (1024 * 1024)), timestamp: Date.now() });
    const errorMessage = CometChatLocalize.getLocalizedString('message_composer_file_size_error') || `${oversizedFiles.length} ${fileType}(s) exceeded the ${Math.round(maxSize / (1024 * 1024))}MB limit`;
    ctx.emitError(new Error(errorMessage));
  }
  if (validFiles.length > 0) { sendFilesDirectlyImpl(ctx, validFiles); }
}

export async function sendFilesDirectlyImpl(ctx: DragUtilsContext, files: File[]): Promise<void> {
  const receiver = ctx.getReceiver();
  if (!receiver) { CometChatLogger.warn('CometChatMessageComposer', 'No receiver (user or group) specified'); return; }
  const quotedMessage = ctx.messageToReplySignal() || undefined;
  let lastSentMessage: CometChat.BaseMessage | null = null;
  for (const file of files) {
    const fileType = ctx.getFileType(file);
    const mediaType = ctx.getMediaMessageType(fileType);
    const receiverId = receiver instanceof CometChat.User ? receiver.getUid() : receiver.getGuid();
    const receiverType = receiver instanceof CometChat.User ? CometChat.RECEIVER_TYPE.USER : CometChat.RECEIVER_TYPE.GROUP;
    const pendingMediaMessage = new CometChat.MediaMessage(receiverId, file, mediaType, receiverType);
    if (ctx.parentMessageId) { pendingMediaMessage.setParentMessageId(ctx.parentMessageId); }
    if (quotedMessage) { pendingMediaMessage.setQuotedMessage(quotedMessage); pendingMediaMessage.setQuotedMessageId(quotedMessage.getId()); }
    pendingMediaMessage.setMuid(CometChatUIKitUtility.ID());
    pendingMediaMessage.setSentAt(CometChatUIKitUtility.getUnixTimestamp());
    const blobUrl = URL.createObjectURL(file);
    const fileExtension = file.name.split('.').pop() || '';
    const localAttachment = {
      url: blobUrl, name: file.name, mimeType: file.type, size: file.size, extension: fileExtension,
      getUrl: () => blobUrl, getName: () => file.name, getMimeType: () => file.type, getSize: () => file.size, getExtension: () => fileExtension,
    };
    (pendingMediaMessage as any).getAttachments = () => [localAttachment];
    CometChatMessageEvents.ccMessageSent.next({ message: pendingMediaMessage, status: MessageStatus.inprogress });
    try {
      const mediaMessage = await ctx.messageComposerService.sendMediaMessage(receiver, file, mediaType, undefined, ctx.parentMessageId, quotedMessage, pendingMediaMessage);
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
    URL.revokeObjectURL(blobUrl);
  }
  if (quotedMessage && lastSentMessage) {
    ctx.exitReplyMode();
    CometChatMessageEvents.ccReplyToMessage.next({ message: lastSentMessage, status: MessageStatus.success });
  }
  if (lastSentMessage) { ctx.sendButtonClick.emit(lastSentMessage); ctx.announceMessageSent(); }
  ctx.playOutgoingMessageSound();
}
