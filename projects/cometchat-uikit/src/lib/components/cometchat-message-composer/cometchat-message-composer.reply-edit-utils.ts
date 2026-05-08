import {CometChat} from '@cometchat/chat-sdk-javascript';
import {CometChatLocalize} from '../../resources/CometChatLocalize/cometchat-localize';
import {CometChatMessageEvents} from '../../events/CometChatMessageEvents';
import {MessageStatus} from '../../Enums/Enums';

export function getReplyPreviewTitleImpl(self: any): string {
  const message = self.messageToReplySignal();
  if (!message) { return ''; }
  return message.getSender()?.getName() || CometChatLocalize.getLocalizedString('unknown');
}

export function getReplyPreviewSubtitleImpl(self: any): string {
  const message = self.messageToReplySignal();
  if (!message) { return ''; }
  const messageType = message.getType();
  if (messageType === CometChat.MESSAGE_TYPE.TEXT) {
    const textMessage = message as CometChat.TextMessage;
    return self.formatReplyPreviewText(textMessage);
  } else if (messageType === CometChat.MESSAGE_TYPE.IMAGE) {
    return CometChatLocalize.getLocalizedString('conversation_subtitle_image');
  } else if (messageType === CometChat.MESSAGE_TYPE.VIDEO) {
    return CometChatLocalize.getLocalizedString('conversation_subtitle_video');
  } else if (messageType === CometChat.MESSAGE_TYPE.AUDIO) {
    return CometChatLocalize.getLocalizedString('conversation_subtitle_audio');
  } else if (messageType === CometChat.MESSAGE_TYPE.FILE) {
    return CometChatLocalize.getLocalizedString('conversation_subtitle_file');
  } else {
    return CometChatLocalize.getLocalizedString('message');
  }
}

export function getEditPreviewTitleImpl(): string {
  return CometChatLocalize.getLocalizedString('message_composer_edit_message');
}

export function getEditPreviewSubtitleImpl(self: any): string {
  const editMessage = self.getCurrentEditMessage();
  if (!editMessage) { return ''; }
  if (editMessage.getType() === CometChat.MESSAGE_TYPE.TEXT) {
    const textMessage = editMessage as CometChat.TextMessage;
    return self.formatEditPreviewText(textMessage);
  }
  const textMessage = editMessage as CometChat.TextMessage;
  const rawText = textMessage.getText?.() || '';
  return self.htmlSanitizerService.escapeUserHtml(rawText);
}

export function enterReplyModeImpl(self: any, message: CometChat.BaseMessage): void {
  if (self.messageToEdit) { self.exitEditMode(); }
  self.messageToReplySignal.set(message);
  const senderName = message.getSender()?.getName() || CometChatLocalize.getLocalizedString('unknown');
  const replyTemplate = CometChatLocalize.getLocalizedString('message_composer_replying_to');
  self.announcePolite(replyTemplate.replace('{sender}', senderName));
  if (self.customRichTextEditor) { self.focusRichTextEditor(); } else {
    self.focusTextInput();
  }
}

export function exitReplyModeImpl(self: any): void {
  self.messageToReplySignal.set(null);
}

export function onReplyPreviewCloseImpl(self: any): void {
  if (self.messageToReplySignal()) {
    CometChatMessageEvents.ccReplyToMessage.next({
      message: self.messageToReplySignal()!,
      status: MessageStatus.cancelled,
    });
  }
  self.exitReplyMode();
  self.closePreview.emit();
}

export function onEditPreviewCloseImpl(self: any): void {
  self.cancelEdit();
}

export function openPollModalImpl(self: any): void {
  self.isPollModalOpen.set(true);
}

export function closePollModalImpl(self: any): void {
  self.isPollModalOpen.set(false);
}

export function onPollCreatedImpl(self: any): void {
  self.closePollModal();
  if (self.messageToReplySignal()) {
    CometChatMessageEvents.ccReplyToMessage.next({
      message: self.messageToReplySignal()!,
      status: MessageStatus.success,
    });
    self.exitReplyMode();
  }
}

export function resetComposerStateImpl(self: any): void {
  self.composerText.set('');
  self.attachments.set([]);
  self.messageToReplySignal.set(null);
  if (self.isEditMode() || self.textMessageToEdit() || self.messageToEdit) {
    self.textMessageToEdit.set(null);
    self.isEditMode.set(false);
    self.originalTextBeforeEdit = '';
    self.closePreview.emit();
  }
  self.contentToDisplay.set('none');
  self.syncLegacyPopoverSignals();
  self.isMentionSuggestionsOpen.set(false);
  self.uniqueMentionCount.set(0);
  self.showMentionsCountWarning.set(false);
  self.plainTextMentionUids.clear();
  self.mentionedUsersMap.clear();
  if (self.customRichTextEditor && self.enableRichText) { self.richTextEditorService.clearContent(self.customRichTextEditor); }
  if (!self.disableTypingEvents) {
    if (self.typingTimeout) {
      clearTimeout(self.typingTimeout);
      self.typingTimeout = undefined;
    }
    self.endTypingIndicator();
  }
  self.textChange.emit('');
}
