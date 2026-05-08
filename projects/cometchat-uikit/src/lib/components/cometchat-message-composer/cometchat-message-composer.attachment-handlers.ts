import {CometChat} from '@cometchat/chat-sdk-javascript';
import {AttachmentFile} from './cometchat-message-composer.component';

export function handleAttachmentOptionClickImpl(self: any, optionId: string): void {
  self.contentToDisplay.set('none');
  self.syncLegacyPopoverSignals();
  const fileInput = self.fileInputRef?.nativeElement;
  if (!fileInput) { console.warn('[CometChatMessageComposer] File input element not found'); return; }
  switch (optionId) {
    case 'image':
      fileInput.accept = 'image/*';
      fileInput.click();
      break;
    case 'video':
      fileInput.accept = 'video/*';
      fileInput.click();
      break;
    case 'audio':
      fileInput.accept = 'audio/*';
      fileInput.click();
      break;
    case 'file':
      fileInput.accept = '*/*';
      fileInput.click();
      break;
    case 'polls': self.openPollModal(); break;
    case 'collaborative-document': self.createCollaborativeDocument(); break;
    case 'collaborative-whiteboard': self.createCollaborativeWhiteboard(); break;
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
