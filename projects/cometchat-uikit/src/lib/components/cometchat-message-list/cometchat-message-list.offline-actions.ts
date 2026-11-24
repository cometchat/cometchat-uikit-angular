/**
 * Retry and Delete on an own unsent message (offline support only; SDK rules
 * BEH-SEND-37 as rewritten by ruling R162 / S73 on 2026-11-03, and BEH-SEND-36).
 * Both are offered on every own PENDING, SENDING and FAILED row; on one whose
 * send is under way the SDK answers `ERROR_OFFLINE_MESSAGE_IN_FLIGHT` and the
 * kit shows the "Sending... try again in a moment" notice.
 *
 * - Retry: `retryMessage(localMessageId)` for an outbox row, a fresh send for a
 *   failed (direct) row; taps while one is in flight are ignored.
 * - Delete: `discardLocalMessage(localMessageId)`; a failed (direct) row is
 *   removed from the screen only. When the SDK answers that it no longer holds
 *   the message, a row that was never sent is removed at once, online or
 *   offline, as on Android; a sent row (one with a server id) is deleted on the
 *   server through today's delete path.
 *
 * Nothing here runs with offline off.
 */
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatLocalize } from '../../resources/CometChatLocalize/cometchat-localize';
import { ToastType } from '../base-elements/cometchat-toast/cometchat-toast.component';
import { findRowIndex } from '../../utils/offline/reconcile';
import { localIdOf, serverIdOf } from '../../utils/offline/identity';
import { OfflineHub } from '../../utils/offline/offline-hub';
import {
  discardUnsentMessage,
  removeUnheld,
  retryFailedMessage,
  sendKindOf,
} from '../../utils/offline/send';

export interface OfflineActionsContext {
  messageListService: { allMessages(): CometChat.BaseMessage[]; checkKillSwitch?(): void };
  messageToDelete: { set(message: CometChat.BaseMessage | null): void };
  showDeleteConfirmDialog: { set(value: boolean): void };
  error: { emit(error: CometChat.CometChatException): void };
  showInlineToast(text: string, type?: ToastType, duration?: number): void;
  handleDeleteConfirm(): Promise<void>;
}

export async function retryOfflineMessageImpl(
  ctx: OfflineActionsContext,
  message: CometChat.BaseMessage
): Promise<void> {
  const outcome = await retryFailedMessage(message, sendKindOf(message));
  if (outcome === 'disabled') ctx.messageListService.checkKillSwitch?.();
}

/** The sent copy of `message`: the row the list shows for it, or the message itself, with a server id. */
function sentCopyOf(
  ctx: OfflineActionsContext,
  message: CometChat.BaseMessage
): CometChat.BaseMessage | null {
  const rows = ctx.messageListService.allMessages();
  const listed = rows[findRowIndex(rows, message)];
  if (listed && serverIdOf(listed) > 0) return listed;
  return serverIdOf(message) > 0 ? message : null;
}

/** Delete an own unsent message; the user already confirmed in today's dialog. */
export async function discardOfflineMessageImpl(
  ctx: OfflineActionsContext,
  message: CometChat.BaseMessage
): Promise<void> {
  const outcome = await discardUnsentMessage(message);
  switch (outcome) {
    case 'removed':
      removedFromScreen(ctx);
      return;
    case 'disabled':
      // Kill switch: the other un-acked rows of this chat turn failed (direct) too.
      closeDialog(ctx);
      ctx.messageListService.checkKillSwitch?.();
      return;
    case 'not-found':
      await deleteSentCopy(ctx, message);
      return;
    case 'in-flight':
      // Its send already started: nothing changes, and the "Sending... try
      // again in a moment" notice is up (R162), not the delete-failed toast.
      closeDialog(ctx);
      return;
    case 'error':
    default:
      // The store was busy: nothing changes.
      closeDialog(ctx);
      ctx.showInlineToast(
        CometChatLocalize.getLocalizedString('message_list_option_delete_failed'),
        ToastType.error,
        3000
      );
      return;
  }
}

/**
 * The SDK no longer holds it (it was sent, or purged with its chat). A row on
 * screen with a server id is a sent message: it is deleted on the server
 * through today's delete path, which offline ends in today's not-connected
 * error. Any other row is removed at once, online or offline, as on Android,
 * and if its sent copy still arrives it is deleted on the server then.
 */
async function deleteSentCopy(
  ctx: OfflineActionsContext,
  message: CometChat.BaseMessage
): Promise<void> {
  const sent = sentCopyOf(ctx, message);
  if (sent) {
    ctx.messageToDelete.set(sent);
    await ctx.handleDeleteConfirm();
    return;
  }
  if (removeUnheld(message)) OfflineHub.getInstance().deleteWhenSent(localIdOf(message));
  removedFromScreen(ctx);
}

function removedFromScreen(ctx: OfflineActionsContext): void {
  closeDialog(ctx);
  ctx.showInlineToast(CometChatLocalize.getLocalizedString('message_list_message_deleted'));
}

function closeDialog(ctx: OfflineActionsContext): void {
  ctx.showDeleteConfirmDialog.set(false);
  ctx.messageToDelete.set(null);
}
