import {CometChat} from '@cometchat/chat-sdk-javascript';
import {CometChatMentionsFormatter} from '../../formatters/cometchat-mentions-formatter';
import {CometChatSoundManager} from '../../resources/CometChatSoundManager/CometChatSoundManager';
import {CometChatLogger} from '../../utils/CometChatLogger';

export function initializeTextFormattersImpl(self: any): void {
  const formatters: any[] = [];
  const effectiveFormatters = self.effectiveTextFormatters();
  if (effectiveFormatters && effectiveFormatters.length > 0) { formatters.push(...effectiveFormatters); }
  const hasMentionsFormatter = formatters.some((f: any) => f instanceof CometChatMentionsFormatter);
  if (!hasMentionsFormatter && !self.disableMentions) {
    const mentionsFormatter = new CometChatMentionsFormatter();
    mentionsFormatter.setAllMentionConfig(!self.disableMentionAll, self.mentionAllLabel);
    formatters.push(mentionsFormatter);
    self.mentionsFormatter.set(mentionsFormatter);
  } else if (hasMentionsFormatter) {
    const existingFormatter = formatters.find((f: any) => f instanceof CometChatMentionsFormatter);
    if (existingFormatter) {
      self.mentionsFormatter.set(existingFormatter as CometChatMentionsFormatter);
    }
  }
  self.textFormatterArray.set(formatters);
}

export function configureTextFormattersImpl(self: any): void {
  const composerId = self.getComposerId();
  for (const formatter of self.textFormatterArray()) {
    const formatterWithConfig = formatter as unknown as {
      setComposerConfig?: (
        user: CometChat.User | undefined,
        group: CometChat.Group | undefined,
        composerId: { user: string | null; group: string | null; parentMessageId: number | null }
      ) => void;
    };
    if (typeof formatterWithConfig.setComposerConfig === 'function') {
      formatterWithConfig.setComposerConfig(
        self.currentUser() ?? undefined,
        self.currentGroup() ?? undefined,
        composerId
      );
    }
    if (self.customRichTextEditor) {
      const editorElement = self.richTextEditorContainerRef?.nativeElement;
      if (editorElement) {
        const formatterWithRef = formatter as unknown as {
          setInputElementReference?: (element: HTMLElement) => void;
        };
        if (typeof formatterWithRef.setInputElementReference === 'function') { formatterWithRef.setInputElementReference(editorElement); }
      }
    }
  }
  if (self.customRichTextEditor) { self.customRichTextEditor.setCustomFormatters(self.textFormatterArray()); }
}

export function forwardKeyEventToFormattersImpl(self: any, event: KeyboardEvent, eventType: 'keydown' | 'keyup'): void {
  for (const formatter of self.textFormatterArray()) {
    const formatterWithMethod = formatter as unknown as {
      onKeyDown?: (event: KeyboardEvent) => void;
      onKeyUp?: (event: KeyboardEvent) => void;
    };
    if (eventType === 'keydown' && typeof formatterWithMethod.onKeyDown === 'function') {
      formatterWithMethod.onKeyDown(event);
    } else if (eventType === 'keyup' && typeof formatterWithMethod.onKeyUp === 'function') {
      formatterWithMethod.onKeyUp(event);
    }
  }
}

export function updateFormatterCaretPositionImpl(self: any): void {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) { return; }
  const range = selection.getRangeAt(0);
  for (const formatter of self.textFormatterArray()) {
    const formatterWithMethod = formatter as unknown as {
      setCaretPositionAndRange?: (selection: Selection, range: Range) => void;
    };
    if (typeof formatterWithMethod.setCaretPositionAndRange === 'function') {
      formatterWithMethod.setCaretPositionAndRange(selection, range);
    }
  }
}

export function playOutgoingMessageSoundImpl(self: any): void {
  if (self.effectiveDisableSoundForMessage()) { return; }
  try {
    CometChatSoundManager.play(
      CometChatSoundManager.Sound.outgoingMessage!,
      self.effectiveCustomSoundForMessage() || null
    );
  } catch (error) {
    CometChatLogger.error('CometChatMessageComposer', 'Error playing outgoing message sound:', error);
  }
}

export function getMediaMessageTypeImpl(fileType: 'image' | 'video' | 'audio' | 'file'): string {
  switch (fileType) {
    case 'image': return CometChat.MESSAGE_TYPE.IMAGE;
    case 'video': return CometChat.MESSAGE_TYPE.VIDEO;
    case 'audio': return CometChat.MESSAGE_TYPE.AUDIO;
    case 'file':
    default: return CometChat.MESSAGE_TYPE.FILE;
  }
}

export function handleRichTextUpdateImpl(self: any, html: string, text: string): void {
  // Defer composerText signal update to the next microtask to prevent
  // Angular change detection from running synchronously during a
  // contenteditable input event. Synchronous signal updates cause
  // layout shifts (send/voice button show/hide) which reset the cursor
  // position in inline <code> elements on the 2nd character typed.
  Promise.resolve().then(() => {
    self.composerText.set(text);
    self.textChange.emit(text);
  });
  self.updateMentionsCount();
  if (!self.disableTypingEvents) { self.handleTypingStart(); }
  if (!self.disableMentions && self.customRichTextEditor) { self.checkForMentionTrigger(text, 0); }
}

export function onEmojiPopoverOpenedImpl(self: any): void {
  self.contentToDisplay.set('emojiKeyboard');
  self.syncLegacyPopoverSignals();
}

export function onEmojiPopoverClosedImpl(self: any): void {
  self.contentToDisplay.set('none');
  self.syncLegacyPopoverSignals();
  self.focusEmojiButton();
}

export function onAttachmentPopoverOpenedImpl(self: any): void {
  self.contentToDisplay.set('attachments');
  self.syncLegacyPopoverSignals();
}

export function onAttachmentPopoverClosedImpl(self: any): void {
  self.contentToDisplay.set('none');
  self.syncLegacyPopoverSignals();
  self.focusAttachmentButton();
}

export function onVoiceRecorderPopoverOpenedImpl(self: any): void {
  self.contentToDisplay.set('voiceRecording');
  self.isRecording.set(true);
  self.syncLegacyPopoverSignals();
}

export function onVoiceRecorderPopoverClosedImpl(self: any): void {
  if (self.isRecording()) {
    self.isRecording.set(false);
    self.recordingDuration.set(0);
    self.announceRecordingStopped();
  }
  self.contentToDisplay.set('none');
  self.syncLegacyPopoverSignals();
}

export function onStickersPopoverOpenedImpl(self: any): void {
  self.contentToDisplay.set('stickers');
  self.syncLegacyPopoverSignals();
}

export function onStickersPopoverClosedImpl(self: any): void {
  self.contentToDisplay.set('none');
  self.syncLegacyPopoverSignals();
  self.focusStickersButton();
}
