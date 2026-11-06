import {CometChat} from '@cometchat/chat-sdk-javascript';
import {CometChatMessageEvents, IMessages} from '../events/CometChatMessageEvents';
import {MessageStatus} from '../Enums/Enums';
import {CometChatUIKitUtility} from '../CometChatUIKitUtility';
import {CometChatLogger} from '../utils/CometChatLogger';
import {writeThreadSubscribed} from '../utils/thread-subscription-utils';

/**
 * Queue of sent-message events received while the message list was still loading.
 * Flushed once loading completes (see flushPendingSentMessages).
 *
 * Each event keeps the conversation it was checked against when it was queued. The SDK clears
 * a message's receiver ID while its send is in flight, so by the time the queue is flushed the
 * conversation check would reject the very message it accepted (ENG-39944): the queued key is
 * what the flush compares instead. It also keeps an event from landing in a different
 * conversation opened while the first one was still loading.
 */
const pendingSentMessages = new WeakMap<object, { data: IMessages; conversation: string }[]>();

/** The conversation (user or group, and thread) a list is showing now. */
function conversationKey(ctx: any): string {
  return [ctx.currentUser?.getUid?.() ?? '', ctx.currentGroup?.getGuid?.() ?? '', ctx.parentMessageId ?? ''].join('|');
}

export function setupSentMessageListenerImpl(ctx: any): void {
  ctx.ccMessageSentSubscription = CometChatMessageEvents.ccMessageSent.subscribe(
    (data: IMessages) => {
      handleSentMessageImpl(ctx, data);
    }
  );
}

export function setupEditedMessageListenerImpl(ctx: any): void {
  ctx.ccMessageEditedSubscription = CometChatMessageEvents.ccMessageEdited.subscribe(
    (data: IMessages) => {
      if (data.status === MessageStatus.success && data.message) {
        handleEditedMessageImpl(ctx, data.message);
      }
    }
  );
}

export function handleSentMessageImpl(ctx: any, data: IMessages): void {
  const { message, status } = data;
  // Sending a message subscribes its author to that message's thread server-side,
  // and a top-level message is the root of its own thread — so this applies to
  // every send, not just a reply. The send response does not carry the flag back,
  // so stamp the outgoing object here: this handler is the one point every send
  // passes through, whatever its type and whichever composer surface produced it,
  // and `ccMessageSent` only ever carries the logged-in user's own messages.
  // Runs before the thread-reply and conversation checks below, because the
  // author is subscribed regardless of which list happens to be observing.
  // A failed send created no thread, so it is left alone.
  if (status !== MessageStatus.error) {
    writeThreadSubscribed(message, true);
  }
  if (
    !ctx.parentMessageId &&
    message.getParentMessageId() &&
    status === MessageStatus.success &&
    !ctx.isAgentChatMode
  ) {
    if (ctx.isThreadReplyForCurrentConversation(message)) {
      updateSentMessageReplyCountImpl(ctx, message);
    }
    return;
  }
  // A failed send is the pending message this list already shows, but the SDK clears the
  // message's receiver ID when the send fails, so the conversation check below would reject it
  // and the failure would never reach the bubble (ENG-39942). A muid this list holds is proof
  // enough that the message belongs here.
  const failedHere = status === MessageStatus.error && isPendingInThisList(ctx, message);
  if (!failedHere && !ctx.isMessageForCurrentConversation(message)) { return; }

  // If the list is still loading (initial fetch in progress), queue the event
  // and process it after loading completes to avoid error-state race conditions.
  if (ctx.loadingStateSignal() === true) {
    let queue = pendingSentMessages.get(ctx);
    if (!queue) {
      queue = [];
      pendingSentMessages.set(ctx, queue);
    }
    queue.push({ data, conversation: conversationKey(ctx) });
    return;
  }

  switch (status) {
    case MessageStatus.inprogress:
      ctx.addMessage(message);
      break;
    case MessageStatus.success:
      confirmSentMessage(ctx, message);
      break;
    case MessageStatus.error:
      updateSentMessageByMuidImpl(ctx, failedCopy(message));
      break;
  }
}

/**
 * Swap the pending bubble for the sent message. If the list never got the pending one (its
 * in-progress event was lost, as ENG-39944 did), add the sent message instead, so a message the
 * server accepted for this conversation is never missing from it. addMessage ignores a
 * message that is already listed.
 */
function confirmSentMessage(ctx: any, message: CometChat.BaseMessage): void {
  const muid = message.getMuid?.();
  const id = message.getId?.();
  const listed =
    (!!muid && !!ctx.messageMuidMap.get(muid)) || (!!id && !!ctx.messageIdMap.get(ctx.normalizeMessageId(id)));
  if (listed) {
    updateSentMessageByMuidImpl(ctx, message);
  } else if (mayAddUnlisted(ctx, message)) {
    ctx.addMessage(message);
  }
}

/**
 * Whether a sent message this list doesn't show may be added to it. Outside agent chat, the
 * conversation check has settled that. In agent chat the check lets threaded messages through
 * (the agent answers in a thread under the user's message), so a reply sent in the previous
 * agent conversation and confirmed after New Chat would pass it and land in the new chat. There,
 * a message is added only when its thread is this list's: its parent is the list's parent or a
 * message the list shows.
 */
function mayAddUnlisted(
  ctx: {
    isAgentChatMode: boolean;
    parentMessageId: number | string | null;
    messageIdMap: Map<string, CometChat.BaseMessage>;
    normalizeMessageId: (id: string | number) => string;
  },
  message: CometChat.BaseMessage
): boolean {
  if (!ctx.isAgentChatMode) return true;
  const parent = message.getParentMessageId?.();
  if (!parent) return false;
  if (ctx.parentMessageId != null && String(parent) === String(ctx.parentMessageId)) return true;
  return !!ctx.messageIdMap.get(ctx.normalizeMessageId(parent));
}

/** Whether this list holds the pending message (by muid) that a sent event refers to. */
function isPendingInThisList(ctx: any, message: CometChat.BaseMessage): boolean {
  const muid = message.getMuid?.();
  return !!muid && !!ctx.messageMuidMap.get(muid);
}

/**
 * A failed send arrives as the same object the list already shows as pending (the composer marks
 * `error` on it in place). The list and the bubble are OnPush, so swapping in the identical
 * reference never re-renders the bubble and its error tick never appears. Hand the list a copy
 * with the same prototype and fields (as deleteMessageImpl does for a deletion), so the bubble
 * sees a new input.
 */
function failedCopy(message: CometChat.BaseMessage): CometChat.BaseMessage {
  return Object.create(Object.getPrototypeOf(message), Object.getOwnPropertyDescriptors(message)) as CometChat.BaseMessage;
}

/**
 * Flush any sent-message events that were queued while loading.
 * Called by the service after fetchPreviousMessages / fetchNextMessages completes.
 *
 * Skips `inprogress` messages whose final `success` version is already present
 * in the fetched list (matched by MUID or message ID) to avoid duplicates.
 */
export function flushPendingSentMessages(ctx: any): void {
  const queue = pendingSentMessages.get(ctx);
  if (!queue || queue.length === 0) return;
  pendingSentMessages.delete(ctx);
  const current = conversationKey(ctx);
  for (const { data, conversation } of queue) {
    const { message, status } = data;
    // Checked against the conversation when queued; the message's own fields may have been
    // cleared by the SDK since.
    if (conversation !== current) continue;
    switch (status) {
      case MessageStatus.inprogress: {
        // Skip if the message already exists in the list (fetched from server)
        const muid = message.getMuid?.();
        const alreadyByMuid = muid ? ctx.messageMuidMap.get(muid) : undefined;
        const messageId = message.getId();
        const alreadyById = messageId ? ctx.messageIdMap.get(ctx.normalizeMessageId(messageId)) : undefined;
        if (!alreadyByMuid && !alreadyById) {
          ctx.addMessage(message);
        }
        break;
      }
      case MessageStatus.success:
        confirmSentMessage(ctx, message);
        break;
      case MessageStatus.error:
        updateSentMessageByMuidImpl(ctx, failedCopy(message));
        break;
    }
  }
}

export function updateSentMessageByMuidImpl(ctx: any, message: CometChat.BaseMessage): void {
  const muid = message.getMuid?.();
  if (!muid) {
    const messageId = message.getId();
    if (messageId) { ctx.updateMessageById(messageId, message); }
    return;
  }
  const existingMessage = ctx.messageMuidMap.get(muid);
  if (existingMessage) {
    ctx.updateMessageByMuid(muid, message);
  } else {
    const messageId = message.getId();
    if (messageId) { ctx.updateMessageById(messageId, message); }
  }
}

export function updateSentMessageReplyCountImpl(ctx: any, message: CometChat.BaseMessage): void {
  const parentId = message.getParentMessageId();
  if (!parentId) { return; }
  const parentMessage = ctx.messageIdMap.get(ctx.normalizeMessageId(parentId));
  if (!parentMessage) { return; }
  const clonedParent = CometChatUIKitUtility.clone(parentMessage);
  const currentCount = clonedParent.getReplyCount() || 0;
  clonedParent.setReplyCount(currentCount + 1);
  ctx.updateMessageById(parentId, clonedParent);
}

export function handleEditedMessageImpl(ctx: any, message: CometChat.BaseMessage): void {
  if (!ctx.isMessageForCurrentConversation(message)) { return; }
  ctx.updateMessageById(message.getId(), message);
  CometChatMessageEvents.onMessageEdited.next(message);
}
