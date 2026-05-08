/**
 * Reaction handling utilities for MessageListService.
 *
 * Extracted from message-list.service.ts to isolate
 * reaction event processing and reaction count update logic.
 */

import { CometChat } from '@cometchat/chat-sdk-javascript';

// ==================== Reaction Count Helpers ====================

/**
 * Applies a reaction event to an existing reactions array.
 * Returns a new array with the updated reaction counts.
 *
 * @param reactions - Current reactions on the message
 * @param emoji - The emoji being reacted with
 * @param action - Whether the reaction was added or removed
 * @param reactedBy - The user who reacted
 */
export function applyReactionEvent(
  reactions: CometChat.ReactionCount[],
  emoji: string,
  action: 'added' | 'removed',
  reactedBy: CometChat.User
): CometChat.ReactionCount[] {
  const existing = reactions.find(r => r.getReaction() === emoji);

  if (action === 'added') {
    if (existing) {
      // Increment count
      const updated = reactions.map(r => {
        if (r.getReaction() !== emoji) return r;
        const newReaction = new CometChat.ReactionCount(
          r.getReaction(),
          r.getCount() + 1,
          r.getReactedByMe()
        );
        return newReaction;
      });
      return updated;
    } else {
      // Add new reaction
      const newReaction = new CometChat.ReactionCount(emoji, 1, false);
      return [...reactions, newReaction];
    }
  } else {
    // removed
    if (!existing) return reactions;

    const newCount = existing.getCount() - 1;
    if (newCount <= 0) {
      return reactions.filter(r => r.getReaction() !== emoji);
    }
    return reactions.map(r => {
      if (r.getReaction() !== emoji) return r;
      return new CometChat.ReactionCount(r.getReaction(), newCount, r.getReactedByMe());
    });
  }
}

/**
 * Checks whether a reaction event belongs to the current conversation.
 *
 * @param reactionEvent - The reaction event from the SDK
 * @param currentUser - Active user (for 1-on-1 chats)
 * @param currentGroup - Active group (for group chats)
 * @param loggedInUid - UID of the currently logged-in user
 */
export function isReactionForCurrentConversation(
  reactionEvent: CometChat.ReactionEvent,
  currentUser: CometChat.User | null,
  currentGroup: CometChat.Group | null,
  loggedInUid: string
): boolean {
  const receiverId = reactionEvent.getReceiverId?.() || '';
  const receiverType = reactionEvent.getReceiverType?.() || '';

  if (currentUser) {
    return (
      receiverType === CometChat.RECEIVER_TYPE.USER &&
      (receiverId === currentUser.getUid() || receiverId === loggedInUid)
    );
  }

  if (currentGroup) {
    return (
      receiverType === CometChat.RECEIVER_TYPE.GROUP &&
      receiverId === currentGroup.getGuid()
    );
  }

  return false;
}

// ==================== Receipt Update Helpers ====================

/**
 * Checks whether a receipt event belongs to the current conversation.
 *
 * @param receipt - The message receipt from the SDK
 * @param currentUser - Active user (for 1-on-1 chats)
 * @param currentGroup - Active group (for group chats)
 */
export function isReceiptForCurrentConversation(
  receipt: CometChat.MessageReceipt,
  currentUser: CometChat.User | null,
  currentGroup: CometChat.Group | null
): boolean {
  const senderId = receipt.getSender()?.getUid() || '';
  const receiverId = (receipt.getReceiver() as any)?.getUid?.() || '';
  const receiverType = receipt.getReceiverType() || '';

  if (currentUser) {
    return (
      receiverType === CometChat.RECEIVER_TYPE.USER &&
      senderId === currentUser.getUid()
    );
  }

  if (currentGroup) {
    return (
      receiverType === CometChat.RECEIVER_TYPE.GROUP &&
      receiverId === currentGroup.getGuid()
    );
  }

  return false;
}

/**
 * Applies a read receipt to a message, returning the updated message.
 * Returns null if the message doesn't need updating.
 *
 * @param message - The message to update
 * @param receipt - The read receipt
 */
export function applyReadReceipt(
  message: CometChat.BaseMessage,
  receipt: CometChat.MessageReceipt
): boolean {
  const messageId = message.getId();
  const receiptMessageId = Number(receipt.getMessageId());

  if (!messageId || messageId > receiptMessageId) return false;
  if (message.getReadAt()) return false; // Already marked as read

  return true;
}

/**
 * Applies a delivery receipt to a message.
 * Returns true if the message should be updated.
 */
export function applyDeliveryReceipt(
  message: CometChat.BaseMessage,
  receipt: CometChat.MessageReceipt
): boolean {
  const messageId = message.getId();
  const receiptMessageId = Number(receipt.getMessageId());

  if (!messageId || messageId > receiptMessageId) return false;
  if (message.getDeliveredAt()) return false; // Already marked as delivered

  return true;
}
