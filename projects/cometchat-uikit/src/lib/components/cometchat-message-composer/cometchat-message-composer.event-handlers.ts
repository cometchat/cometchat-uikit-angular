import {CometChat} from '@cometchat/chat-sdk-javascript';
import {CometChatLocalize} from '../../resources/CometChatLocalize/cometchat-localize';
import {CometChatLogger} from '../../utils/CometChatLogger';
import {StickerClickEvent} from '../cometchat-stickers-keyboard/cometchat-stickers-keyboard.component';
import {CometChatMessageComposerAction, CometChatActionsView} from '../../modals';

export function handleEmojiSelectImpl(self: any, emoji: string): void {
  if (self.customRichTextEditor) {
    self.insertTextIntoRichTextEditor(emoji);
    // ENG-35093: Close the emoji popover properly via closeAllPopups so the
    // CometChatPopoverComponent's internal isOpen state is explicitly closed.
    self.closeAllPopups();
    return;
  }
  const newCursorPosition = self.insertTextAtCursor(emoji);
  self.cursorPosition.set(newCursorPosition);
  self.textChange.emit(self.composerText());
  // ENG-35093: Same fix for plain text mode.
  self.closeAllPopups();
}

export function handleEmojiKeyboardCloseImpl(self: any): void {
  self.isEmojiKeyboardOpen.set(false);
  self.contentToDisplay.set('none');
  self.syncLegacyPopoverSignals();
  if (self.customRichTextEditor) { self.focusRichTextEditor(); } else {
    self.focusTextInput();
  }
}

export function handleActionSheetItemClickImpl(self: any, action: CometChatMessageComposerAction | CometChatActionsView): void {
  const attachmentButton = self.attachmentButtonRef?.nativeElement;
  if (attachmentButton) { attachmentButton.click(); }
  if ('onClick' in action && action.onClick) { action.onClick(); }
}

export function handleActionSheetCloseImpl(self: any): void {
  self.contentToDisplay.set('none');
  self.syncLegacyPopoverSignals();
}

export async function handleStickerSelectImpl(self: any, event: StickerClickEvent): Promise<void> {
  // ENG-35031: Use closeAllPopups to properly close the sticker keyboard popover.
  // Setting contentToDisplay alone only updates the signal — the CometChatPopoverComponent's
  // internal isOpen state must be explicitly closed via closeAllPopoverInstances().
  self.closeAllPopups();
  const receiver = self.getReceiver();
  if (!receiver) {
    CometChatLogger.warn('CometChatMessageComposer', 'No receiver (user or group) specified for sticker message');
    return;
  }
  try {
    await self.sendStickerMessage(receiver, event.stickerUrl, event.stickerName);
  } catch (error) {
    CometChatLogger.error('CometChatMessageComposer', 'Error sending sticker message:', error);
    self.emitError(error);
  }
}

export function handleStickersKeyboardCloseImpl(self: any): void {
  self.contentToDisplay.set('none');
  self.syncLegacyPopoverSignals();
  if (self.customRichTextEditor) { self.focusRichTextEditor(); } else {
    self.focusTextInput();
  }
}

export function handleVoiceRecordingClickImpl(self: any): void {
  const newRecordingState = !self.isRecording();
  self.isRecording.set(newRecordingState);
  if (newRecordingState) { self.announceRecordingStarted(); } else {
    self.announceRecordingStopped();
  }
  if (newRecordingState) { self.closeAllPopups(); }
  if (!newRecordingState) { self.recordingDuration.set(0); }
}

export function toggleFixedToolbarImpl(self: any): void {
  const newState = !self.isFixedToolbarShown();
  self.isFixedToolbarShown.set(newState);
  self.isFixedToolbarManuallyToggled.set(newState);
  if (newState) {
    self.isBubbleMenuVisible.set(false);
    self.textSelection.set(null);
    self.bubbleMenuPosition.set(null);
  }
  self.focusRichTextEditor();
  self.cdr.markForCheck();
}

export function closeAllPopupsImpl(self: any): void {
  self.contentToDisplay.set('none');
  self.closeAllPopoverInstances();
  self.isEmojiKeyboardOpen.set(false);
  self.isStickersKeyboardOpen.set(false);
  self.isAttachmentMenuOpen.set(false);
  self.isMentionSuggestionsOpen.set(false);
  self.messageComposerService.clearMentionSuggestions();
  if (self.isRecording()) { self.isRecording.set(false); self.recordingDuration.set(0); }
  if (self.isFullscreenViewerOpen()) { self.isFullscreenViewerOpen.set(false); }
  if (self.enableRichText && self.customRichTextEditor) { self.customRichTextEditor.getContentEditable().focus(); } else if (self.textInputRef?.nativeElement) {
    self.textInputRef.nativeElement.focus();
  }
}

export function emitErrorImpl(self: any, error: unknown): void {
  CometChatLogger.error('CometChatMessageComposer', 'Error:', error);
  let exception: CometChat.CometChatException;
  if (error instanceof CometChat.CometChatException) { exception = error; } else if (error instanceof Error) {
    exception = new CometChat.CometChatException({
      code: 'COMPONENT_ERROR',
      message: error.message,
      details: error.stack || '',
    });
  } else {
    exception = new CometChat.CometChatException({
      code: 'UNKNOWN_ERROR',
      message: String(error),
      details: '',
    });
  }
  self.announceAssertive(
    CometChatLocalize.getLocalizedString('message_composer_error_occurred') +
      ': ' +
      exception.message
  );
  self.error.emit(exception);
}

export async function handleSendImpl(self: any): Promise<void> {
  self.closeBubbleMenu();
  if (self.isRecording() && self.mediaRecorderRef) { self.mediaRecorderRef.handleInlineSend(); return; }
  if (self.customRichTextEditor) { const freshText = self.richTextEditorService.getText(self.customRichTextEditor); self.composerText.set(freshText); }
  if (!self.canSend()) { return; }
  const receiver = self.getReceiver();
  if (!receiver) { CometChatLogger.warn('CometChatMessageComposer', 'No receiver (user or group) specified'); return; }
  try {
    if (!self.disableTypingEvents) { if (self.typingTimeout) { clearTimeout(self.typingTimeout); self.typingTimeout = undefined; } self.endTypingIndicator(); }
    const text = self.customRichTextEditor ? self.richTextEditorService.getTextWithMentionFormat(self.customRichTextEditor).trim() : self.composerText().trim();
    const currentAttachments = self.attachments();
    const editMessage = self.messageToEdit || self.textMessageToEdit();
    if (self.isInEditMode() && editMessage) { await self.handleEditMessage(text, editMessage); } else {
      await self.handleSendNewMessage(receiver, text, currentAttachments);
    }
  } catch (error) {
    CometChatLogger.error('CometChatMessageComposer', 'Error during send:', error);
    self.emitError(error);
  }
}

export function focusRichTextEditorImpl(self: any): void {
  if (self.customRichTextEditor) {
    setTimeout(() => {
      const editor = self.customRichTextEditor;
      if (editor) {
        const contentEditable = editor.getContentEditable();
        contentEditable.focus();
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(contentEditable);
        range.collapse(false);
        if (selection) {
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }
    }, 50);
  }
}

export function getFileSizeErrorMessageImpl(self: any): string {
  const error = self.fileSizeError();
  if (!error) { return ''; }
  const count = error.count;
  const fileType = count === 1 ? error.fileType : self.getPluralFileType(error.fileType);
  const verb = count === 1 ? 'is' : 'are';
  const limit = `${error.limitMB} MB`;
  return `${count} ${fileType} you tried adding ${verb} larger than the ${limit} limit`;
}
