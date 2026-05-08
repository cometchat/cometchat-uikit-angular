import {CometChatMessageEvents} from '../../events/CometChatMessageEvents';
import {MessageStatus} from '../../Enums/Enums';

export async function createCollaborativeDocumentImpl(self: any): Promise<void> {
  const receiver = self.currentUser() || self.currentGroup();
  if (!receiver) { console.warn('[CometChatMessageComposer] No receiver set for collaborative document'); return; }
  self.isExtensionLoading.set(true);
  try {
    const receiverId = self.currentUser()
      ? self.currentUser()!.getUid()
      : self.currentGroup()!.getGuid();
    const receiverType = self.currentUser() ? 'user' : 'group';
    const quotedMessageId = self.messageToReplySignal()?.getId();
    await self.messageComposerService.createCollaborativeDocument(
      receiverId,
      receiverType,
      quotedMessageId
    );
    self.contentToDisplay.set('none');
    self.syncLegacyPopoverSignals();
    if (self.messageToReplySignal()) {
      CometChatMessageEvents.ccReplyToMessage.next({
        message: self.messageToReplySignal()!,
        status: MessageStatus.success,
      });
      self.exitReplyMode();
    }
  } catch (error) {
    self.emitError(error);
  } finally {
    self.isExtensionLoading.set(false);
  }
}

export async function createCollaborativeWhiteboardImpl(self: any): Promise<void> {
  const receiver = self.currentUser() || self.currentGroup();
  if (!receiver) { console.warn('[CometChatMessageComposer] No receiver set for collaborative whiteboard'); return; }
  self.isExtensionLoading.set(true);
  try {
    const receiverId = self.currentUser()
      ? self.currentUser()!.getUid()
      : self.currentGroup()!.getGuid();
    const receiverType = self.currentUser() ? 'user' : 'group';
    const quotedMessageId = self.messageToReplySignal()?.getId();
    await self.messageComposerService.createCollaborativeWhiteboard(
      receiverId,
      receiverType,
      quotedMessageId
    );
    self.contentToDisplay.set('none');
    self.syncLegacyPopoverSignals();
    if (self.messageToReplySignal()) {
      CometChatMessageEvents.ccReplyToMessage.next({
        message: self.messageToReplySignal()!,
        status: MessageStatus.success,
      });
      self.exitReplyMode();
    }
  } catch (error) {
    self.emitError(error);
  } finally {
    self.isExtensionLoading.set(false);
  }
}
