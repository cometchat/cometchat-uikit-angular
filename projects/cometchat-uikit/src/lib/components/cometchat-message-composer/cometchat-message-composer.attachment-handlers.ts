import {CometChat} from '@cometchat/chat-sdk-javascript';
import {AttachmentFile} from './cometchat-message-composer.component';
import { CometChatLogger } from '../../utils/CometChatLogger';
import {CometChatUIKitConstants} from '../../constants';

export function handleAttachmentOptionClickImpl(self: any, optionId: string): void {
  self.contentToDisplay.set('none');
  self.syncLegacyPopoverSignals();
  const fileInput = self.fileInputRef?.nativeElement;
  if (!fileInput) { CometChatLogger.warn('CometChatMessageComposer', 'File input element not found'); return; }
  // Remember which picker opened the dialog. The chosen option — not the file's MIME type —
  // decides the staged kind, so a video picked via "File" sends as a file message. The change
  // handler consumes and clears it; drag-drop / paste never set it and stay MIME-derived.
  switch (optionId) {
    case CometChatUIKitConstants.ComposerAttachmentOption.image:
      self.pendingPickerKind = 'image';
      fileInput.accept = 'image/*';
      fileInput.click();
      break;
    case CometChatUIKitConstants.ComposerAttachmentOption.video:
      self.pendingPickerKind = 'video';
      fileInput.accept = 'video/*';
      fileInput.click();
      break;
    case CometChatUIKitConstants.ComposerAttachmentOption.audio:
      self.pendingPickerKind = 'audio';
      fileInput.accept = 'audio/*';
      fileInput.click();
      break;
    case CometChatUIKitConstants.ComposerAttachmentOption.file:
      self.pendingPickerKind = 'file';
      fileInput.accept = '*/*';
      fileInput.click();
      break;
    case CometChatUIKitConstants.ComposerAttachmentOption.poll: self.openPollModal(); break;
    case CometChatUIKitConstants.ComposerAttachmentOption.collaborativeDocument: self.createCollaborativeDocument(); break;
    case CometChatUIKitConstants.ComposerAttachmentOption.collaborativeWhiteboard: self.createCollaborativeWhiteboard(); break;
    default:
      break;
  }
}

export function handleAttachmentClickImpl(self: any, attachment: AttachmentFile, index: number): void {
  if (attachment.type === 'image' || attachment.type === 'video') {
    self.fullscreenViewerIndex.set(index);
    self.isFullscreenViewerOpen.set(true);
  }
}

export function handleFullscreenViewerCloseImpl(self: any): void {
  self.isFullscreenViewerOpen.set(false);
}

export function handleFullscreenViewerPreviousImpl(self: any): void {
  const currentIndex = self.fullscreenViewerIndex();
  const attachmentsList = self.attachments();
  if (currentIndex > 0) { self.fullscreenViewerIndex.set(currentIndex - 1); } else {
    self.fullscreenViewerIndex.set(attachmentsList.length - 1);
  }
}

export function handleFullscreenViewerNextImpl(self: any): void {
  const currentIndex = self.fullscreenViewerIndex();
  const attachmentsList = self.attachments();
  if (currentIndex < attachmentsList.length - 1) { self.fullscreenViewerIndex.set(currentIndex + 1); } else {
    self.fullscreenViewerIndex.set(0);
  }
}

export function getCurrentFullscreenAttachmentImpl(self: any): AttachmentFile | undefined {
  const attachmentsList = self.attachments();
  const index = self.fullscreenViewerIndex();
  return attachmentsList[index];
}

export function handleRemoveAttachmentImpl(self: any, attachment: AttachmentFile): void {
  if (attachment.thumbnailUrl) { URL.revokeObjectURL(attachment.thumbnailUrl); }
  self.attachments.update((attachments: AttachmentFile[]) => attachments.filter((a: AttachmentFile) => a.id !== attachment.id));
  self.attachmentRemoved.emit(attachment.file);
  self.announceAttachmentRemoved(attachment.name);
}

export function handleAttachmentButtonClickImpl(self: any): void {
  self.toggleAttachmentMenu();
}
