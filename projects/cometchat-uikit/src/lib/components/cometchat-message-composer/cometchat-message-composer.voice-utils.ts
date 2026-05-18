/**
 * Extracted voice recording logic for CometChatMessageComposerComponent.
 */
import {CometChat} from '@cometchat/chat-sdk-javascript';
import {CometChatMessageEvents} from '../../events/CometChatMessageEvents';
import {MessageStatus} from '../../Enums/Enums';
import {CometChatUIKitUtility} from '../../CometChatUIKitUtility';
import {CometChatLogger} from '../../utils/CometChatLogger';
import {MessageComposerService} from '../../services/message-composer.service';

export interface VoiceUtilsContext {
  isRecording: { (): boolean; set(v: boolean): void };
  recordingDuration: { set(v: number): void };
  contentToDisplay: { set(v: string): void };
  parentMessageId?: number;
  enableRichText: boolean;
  customRichTextEditor: any;
  messageComposerService: MessageComposerService;
  messageToReplySignal: () => CometChat.BaseMessage | null;
  getReceiver(): CometChat.User | CometChat.Group | undefined;
  exitReplyMode(): void;
  playOutgoingMessageSound(): void;
  emitError(error: unknown): void;
  focusRichTextEditor(): void;
  focusTextInput(): void;
  closeAllPopups(): void;
  syncLegacyPopoverSignals(): void;
  isMentionSuggestionsOpen: { set(v: boolean): void };
  sendButtonClick: { emit(v: CometChat.BaseMessage): void };
  announceRecordingStarted(): void;
  announceRecordingStopped(): void;
  announceMessageSent(): void;
}

export async function handleRecordingCompleteImpl(ctx: VoiceUtilsContext, audioBlob: Blob): Promise<void> {
  ctx.isRecording.set(false);
  ctx.recordingDuration.set(0);
  ctx.contentToDisplay.set('none');
  ctx.syncLegacyPopoverSignals();
  const receiver = ctx.getReceiver();
  if (!receiver) {
    CometChatLogger.warn('CometChatMessageComposer', 'No receiver (user or group) specified for audio message');
    return;
  }
  const timestamp = Date.now();
  const audioFile = new File([audioBlob], `voice_message_${timestamp}.webm`, { type: audioBlob.type || 'audio/webm' });
  const quotedMessage = ctx.messageToReplySignal() || undefined;
  const receiverId = receiver instanceof CometChat.User ? receiver.getUid() : receiver.getGuid();
  const receiverType = receiver instanceof CometChat.User ? CometChat.RECEIVER_TYPE.USER : CometChat.RECEIVER_TYPE.GROUP;
  const pendingAudioMessage = new CometChat.MediaMessage(receiverId, audioFile, CometChat.MESSAGE_TYPE.AUDIO, receiverType);
  if (ctx.parentMessageId) { pendingAudioMessage.setParentMessageId(ctx.parentMessageId); }
  if (quotedMessage) { pendingAudioMessage.setQuotedMessage(quotedMessage); pendingAudioMessage.setQuotedMessageId(quotedMessage.getId()); }
  pendingAudioMessage.setMuid(CometChatUIKitUtility.ID());
  pendingAudioMessage.setSentAt(CometChatUIKitUtility.getUnixTimestamp());
  const blobUrl = URL.createObjectURL(audioFile);
  const fileExtension = audioFile.name.split('.').pop() || '';
  const localAttachment = {
    url: blobUrl, name: audioFile.name, mimeType: audioFile.type, size: audioFile.size, extension: fileExtension,
    getUrl: () => blobUrl, getName: () => audioFile.name, getMimeType: () => audioFile.type, getSize: () => audioFile.size, getExtension: () => fileExtension,
  };
  (pendingAudioMessage as any).getAttachments = () => [localAttachment];
  CometChatMessageEvents.ccMessageSent.next({ message: pendingAudioMessage, status: MessageStatus.inprogress });
  try {
    const mediaMessage = await ctx.messageComposerService.sendMediaMessage(
      receiver, audioFile, CometChat.MESSAGE_TYPE.AUDIO, undefined, ctx.parentMessageId, quotedMessage, pendingAudioMessage
    );
    if (mediaMessage) {
      CometChatMessageEvents.ccMessageSent.next({ message: mediaMessage, status: MessageStatus.success });
      if (quotedMessage) {
        ctx.exitReplyMode();
        CometChatMessageEvents.ccReplyToMessage.next({ message: mediaMessage, status: MessageStatus.success });
      }
      ctx.sendButtonClick.emit(mediaMessage);
      ctx.playOutgoingMessageSound();
    } else {
      CometChatMessageEvents.ccMessageSent.next({ message: pendingAudioMessage, status: MessageStatus.error });
    }
  } catch (error) {
    CometChatMessageEvents.ccMessageSent.next({ message: pendingAudioMessage, status: MessageStatus.error });
    CometChatLogger.error('CometChatMessageComposer', 'Error sending audio message:', error);
    ctx.emitError(error);
  }
  // ENG-35026: Revoke the blob URL only after a delay to allow the audio bubble's
  // WaveSurfer instance to finish loading the audio from the URL. Revoking immediately
  // after send causes "failed to load" because the audio element hasn't loaded yet.
  setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
}

export function handleRecordingCancelImpl(ctx: VoiceUtilsContext): void {
  ctx.isRecording.set(false);
  ctx.recordingDuration.set(0);
  ctx.contentToDisplay.set('none');
  ctx.syncLegacyPopoverSignals();
  ctx.announceRecordingStopped();
  if (ctx.enableRichText && ctx.customRichTextEditor) { ctx.focusRichTextEditor(); } else { ctx.focusTextInput(); }
}

export function handleRecordingErrorImpl(ctx: VoiceUtilsContext, error: Error): void {
  CometChatLogger.error('CometChatMessageComposer', 'Recording error:', error);
  ctx.isRecording.set(false);
  ctx.recordingDuration.set(0);
  ctx.contentToDisplay.set('none');
  ctx.syncLegacyPopoverSignals();
  ctx.emitError(error);
  ctx.announceRecordingStopped();
  if (ctx.enableRichText && ctx.customRichTextEditor) { ctx.focusRichTextEditor(); } else { ctx.focusTextInput(); }
}

export function startInlineRecordingImpl(ctx: VoiceUtilsContext): void {
  ctx.closeAllPopups();
  ctx.isRecording.set(true);
  ctx.contentToDisplay.set('voiceRecording');
  ctx.syncLegacyPopoverSignals();
  ctx.announceRecordingStarted();
  ctx.isMentionSuggestionsOpen.set(false);
}
