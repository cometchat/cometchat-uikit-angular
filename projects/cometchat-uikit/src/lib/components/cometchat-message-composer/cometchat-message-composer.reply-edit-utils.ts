import {CometChat} from '@cometchat/chat-sdk-javascript';
import {CometChatLocalize} from '../../resources/CometChatLocalize/cometchat-localize';
import {CometChatMessageEvents} from '../../events/CometChatMessageEvents';
import {MessageStatus} from '../../Enums/Enums';
import {CometChatUIKit} from '../../cometchat-uikit';
import {getMediaCaption} from '../../utils/message-metadata-utils';
import {
  getAttachmentCount,
  getMediaTypeLabel,
  isMediaPreviewType,
  MediaPreviewType,
} from '../../utils/message-preview-utils';
import {formatEditPreviewTextImpl, formatReplyPreviewTextImpl} from './cometchat-message-composer.edit-mode';

/** Type glyph shown before the media label in the edit / reply preview banners. */
const MEDIA_PREVIEW_ICONS: Record<MediaPreviewType, string> = {
  image: 'assets/conversations_image-message.svg',
  video: 'assets/conversations_video-message.svg',
  audio: 'assets/conversations_audio-message.svg',
  file: 'assets/conversations_file-message.svg',
};

/** The pieces of a media preview banner: `[icon] label · caption`. */
export interface MediaPreviewParts {
  iconUrl: string;
  /** "Image" for one attachment, "3 Images" for several. */
  label: string;
  /** Sanitized HTML for the caption, or '' when there is none. */
  captionHtml: string;
}

/**
 * Summary for a media message being edited or replied to: the type glyph, a counted label, and the
 * formatted caption. `null` for text and every other type, which keep their existing subtitle.
 *
 * NOTE: unlike the conversation list, a voice note is NOT special-cased here — it previews as
 * "Audio", matching the React kit's edit and reply banners.
 */
export function getMediaPreviewPartsImpl(
  self: any,
  message: CometChat.BaseMessage | null | undefined,
  mode: 'edit' | 'reply',
): MediaPreviewParts | null {
  if (!message) { return null; }
  const type = message.getType();
  if (!isMediaPreviewType(type)) { return null; }

  const caption = getMediaCaption(message).trim();
  const captionHtml = caption
    ? (mode === 'edit'
        ? formatEditPreviewTextImpl(self, message as CometChat.TextMessage, caption)
        : formatReplyPreviewTextImpl(self, message as CometChat.TextMessage, caption))
    : '';

  return {
    iconUrl: MEDIA_PREVIEW_ICONS[type],
    label: getMediaTypeLabel(type, getAttachmentCount(message)),
    captionHtml,
  };
}
import {CometChatUIKitConstants} from '../../constants';

export function getReplyPreviewTitleImpl(self: any): string {
  const message = self.messageToReplySignal();
  if (!message) { return ''; }
  const sender = message.getSender();
  if (!sender) { return CometChatLocalize.getLocalizedString('unknown'); }
  // ENG-35080: Show "You" when the sender is the logged-in user
  const loggedInUser = CometChatUIKit.getLoggedInUser();
  if (loggedInUser && sender.getUid() === loggedInUser.getUid()) {
    return CometChatLocalize.getLocalizedString('conversation_subtitle_you_message');
  }
  return sender.getName() || CometChatLocalize.getLocalizedString('unknown');
}

export function getReplyPreviewSubtitleImpl(self: any): string {
  const message = self.messageToReplySignal();
  if (!message) { return ''; }
  if (message.getDeletedAt()) {
    return CometChatLocalize.getLocalizedString('conversation_subtitle_deleted_message');
  }
  const messageType = message.getType();
  const messageCategory = message.getCategory();
  // Handle by category first
  if (messageCategory === 'action') {
    return CometChatLocalize.getLocalizedString('message');
  }
  if (messageCategory === 'call') {
    return CometChatLocalize.getLocalizedString('conversation_subtitle_voice_call');
  }
  if (messageCategory === 'custom' && messageType === 'meeting') {
    return CometChatLocalize.getLocalizedString('conversation_subtitle_voice_call');
  }
  // Handle by message type — mirrors conversation item subtitleText
  switch (messageType) {
    case CometChat.MESSAGE_TYPE.TEXT: {
      const textMessage = message as CometChat.TextMessage;
      return self.formatReplyPreviewText(textMessage);
    }
    case CometChat.MESSAGE_TYPE.IMAGE:
      return CometChatLocalize.getLocalizedString('conversation_subtitle_image');
    case CometChat.MESSAGE_TYPE.VIDEO:
      return CometChatLocalize.getLocalizedString('conversation_subtitle_video');
    case CometChat.MESSAGE_TYPE.AUDIO:
      return CometChatLocalize.getLocalizedString('conversation_subtitle_audio');
    case CometChat.MESSAGE_TYPE.FILE:
      return CometChatLocalize.getLocalizedString('conversation_subtitle_file');
    case CometChatUIKitConstants.ExtensionTypes.poll:
      return CometChatLocalize.getLocalizedString('conversation_subtitle_poll');
    case CometChatUIKitConstants.ExtensionTypes.sticker:
      return CometChatLocalize.getLocalizedString('conversation_subtitle_sticker');
    case CometChatUIKitConstants.ExtensionTypes.document:
      return CometChatLocalize.getLocalizedString('conversation_subtitle_collaborative_document');
    case CometChatUIKitConstants.ExtensionTypes.whiteboard:
      return CometChatLocalize.getLocalizedString('conversation_subtitle_collaborative_whiteboard');
    default:
      // For unknown custom message types, show the type name as fallback
      // (matches conversation item behavior: getCustomMessageText() || messageType)
      if (messageCategory === 'custom') {
        try {
          const customData = (message as CometChat.CustomMessage).getCustomData?.();
          if (customData && typeof customData === 'object' && 'text' in customData) {
            return String((customData as Record<string, unknown>)['text']) || messageType;
          }
        } catch { /* ignore */ }
        return messageType;
      }
      return CometChatLocalize.getLocalizedString('message');
  }
}

export function getEditPreviewTitleImpl(): string {
  return CometChatLocalize.getLocalizedString('message_composer_edit_message');
}

/**
 * Subtitle for the edit banner. Media messages are rendered from {@link getMediaPreviewPartsImpl}
 * by the template instead, so this only ever handles text.
 *
 * It used to fall through to `escapeUserHtml(getText())` for everything non-text — and a
 * MediaMessage has no `getText()`, so editing a captioned image showed an EMPTY subtitle.
 */
export function getEditPreviewSubtitleImpl(self: any): string {
  const editMessage = self.getCurrentEditMessage();
  if (!editMessage) { return ''; }
  if (editMessage.getType() === CometChat.MESSAGE_TYPE.TEXT) {
    return self.formatEditPreviewText(editMessage as CometChat.TextMessage);
  }
  return '';
}

export function enterReplyModeImpl(self: any, message: CometChat.BaseMessage): void {
  if (self.messageToEdit) { self.exitEditMode(); }
  self.messageToReplySignal.set(message);
  const sender = message.getSender();
  const loggedInUser = CometChatUIKit.getLoggedInUser();
  const senderName = (loggedInUser && sender?.getUid() === loggedInUser.getUid())
    ? CometChatLocalize.getLocalizedString('conversation_subtitle_you_message')
    : (sender?.getName() || CometChatLocalize.getLocalizedString('unknown'));
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
