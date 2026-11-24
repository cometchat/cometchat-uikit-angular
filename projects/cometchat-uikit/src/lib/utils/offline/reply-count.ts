/**
 * Thread header reply count on the offline path (README §3.9, BEH-MUT-10).
 *
 * The header shows the parent's `replyCount` as the SDK last delivered it,
 * plus one for each own reply from the moment it is pending (keyed by its local
 * id, so its ack never counts it again), minus one when it is discarded. A
 * fresher parent from the SDK already includes own unsent replies, so it
 * replaces the shown value — but the record of which replies are counted is
 * kept, because they are counted in that value too. Only moving to another
 * thread resets it ({@link OfflineReplyCount.reset}).
 *
 * @internal
 */
import { CometChat } from '@cometchat/chat-sdk-javascript';
import type { SendStateEvent } from './offline-hub';
import { localIdOf } from './identity';

export class OfflineReplyCount {
  private readonly counted = new Set<string>();

  /** The change a send-state event makes to the count shown for `parentId`. */
  apply(event: SendStateEvent, parentId: number): number {
    const id = event.localMessageId;
    const parent = Number(event.message?.getParentMessageId?.() ?? 0);
    if (!id || !parentId || parent !== parentId) return 0;
    if (event.state === 'sending') {
      if (this.counted.has(id)) return 0;
      this.counted.add(id);
      return 1;
    }
    if (event.state === 'discarded') return this.counted.delete(id) ? -1 : 0;
    // Sent and failed replies keep their place in the count.
    return 0;
  }

  /** Whether this own reply was already counted at pending. */
  wasCounted(message: CometChat.BaseMessage): boolean {
    const id = localIdOf(message);
    return id !== '' && this.counted.has(id);
  }

  /**
   * Forget every counted reply. Only for moving to another thread: a fresher
   * parent must not reset this, because its count already includes the own
   * replies recorded here. Clearing it there made an ack count a pending reply
   * a second time, and a discard drop no longer give its -1.
   */
  reset(): void {
    this.counted.clear();
  }
}
