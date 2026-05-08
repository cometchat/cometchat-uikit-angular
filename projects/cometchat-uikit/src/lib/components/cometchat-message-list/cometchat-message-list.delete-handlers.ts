/**
 * Delete/flag handler functions for CometChatMessageList.
 * Extracted to reduce component file size.
 */

import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatLocalize } from '../../resources/CometChatLocalize/cometchat-localize';
import { CometChatLogger } from '../../utils/CometChatLogger';
import { CometChatMessageEvents } from '../../events/CometChatMessageEvents';
import { ToastType } from '../base-elements/cometchat-toast/cometchat-toast.component';

export interface DeleteHandlerContext {
  messageToDelete: any;
  showDeleteConfirmDialog: any;
  isDeleting: any;
  messageToFlag: any;
  showFlagMessageDialog: any;
  isFlagging: any;
  messageListService: any;
  error: any;
  showInlineToast: (text: string, type?: ToastType, duration?: number) => void;
  announceMessageDeleted: () => void;
}

export function showDeleteConfirmationImpl(ctx: DeleteHandlerContext, message: CometChat.BaseMessage): void {
  ctx.messageToDelete.set(message);
  ctx.showDeleteConfirmDialog.set(true);
}

export async function handleDeleteConfirmImpl(ctx: DeleteHandlerContext): Promise<void> {
  const message = ctx.messageToDelete();
  if (!message) { return; }
  ctx.isDeleting.set(true);
  const messageId = message.getId();
  try {
    await CometChat.deleteMessage(String(messageId));
    ctx.messageListService.deleteMessage(messageId);
    const deletedMessage = Object.create(
      Object.getPrototypeOf(message),
      Object.getOwnPropertyDescriptors(message)
    ) as CometChat.BaseMessage;
    deletedMessage.setDeletedAt(Math.floor(Date.now() / 1000));
    CometChatMessageEvents.ccMessageDeleted.next(deletedMessage);
    ctx.announceMessageDeleted();
    ctx.showInlineToast(CometChatLocalize.getLocalizedString('message_list_message_deleted'));
    ctx.showDeleteConfirmDialog.set(false);
    ctx.messageToDelete.set(null);
  } catch (error) {
    CometChatLogger.error('CometChatMessageList', 'Error deleting message:', error);
    ctx.error.emit(error as CometChat.CometChatException);
  } finally {
    ctx.isDeleting.set(false);
  }
}

export function handleDeleteCancelImpl(ctx: DeleteHandlerContext): void {
  ctx.showDeleteConfirmDialog.set(false);
  ctx.messageToDelete.set(null);
}

export function getDeleteDialogTitleImpl(): string { return CometChatLocalize.getLocalizedString('message_delete_title'); }
export function getDeleteDialogSubtitleImpl(): string { return CometChatLocalize.getLocalizedString('message_delete_subtitle'); }
export function getDeleteDialogConfirmTextImpl(): string { return CometChatLocalize.getLocalizedString('message_delete_confirm_yes'); }
export function getDeleteDialogCancelTextImpl(): string { return CometChatLocalize.getLocalizedString('message_delete_confirm_no'); }

export function showFlagConfirmationImpl(ctx: DeleteHandlerContext, message: CometChat.BaseMessage): void {
  ctx.messageToFlag.set(message);
  ctx.showFlagMessageDialog.set(true);
}

export async function handleFlagConfirmImpl(ctx: DeleteHandlerContext, event: { message: CometChat.BaseMessage; reasonId: string; remark: string }): Promise<void> {
  const { message, reasonId, remark } = event;
  ctx.isFlagging.set(true);
  try {
    await ctx.messageListService.flagMessage(message, reasonId, remark);
    ctx.showInlineToast(CometChatLocalize.getLocalizedString('flag_message_reported'));
    ctx.showFlagMessageDialog.set(false);
    ctx.messageToFlag.set(null);
  } catch (error) {
    CometChatLogger.error('CometChatMessageList', 'Error flagging message:', error);
    ctx.error.emit(error as CometChat.CometChatException);
    ctx.showInlineToast(CometChatLocalize.getLocalizedString('flag_message_error'), ToastType.error, 3000);
  } finally {
    ctx.isFlagging.set(false);
  }
}

export function handleFlagCancelImpl(ctx: DeleteHandlerContext): void {
  ctx.showFlagMessageDialog.set(false);
  ctx.messageToFlag.set(null);
}
