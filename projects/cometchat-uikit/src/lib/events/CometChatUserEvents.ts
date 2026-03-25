import { DestroyRef } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { subscribeWithOptionalCleanup } from './event-utils';

/**
 * Class to handle user-related events such as blocking and unblocking users
 */
export class CometChatUserEvents {
  static ccUserBlocked: Subject<CometChat.User> = new Subject<CometChat.User>();
  static ccUserUnblocked: Subject<CometChat.User> = new Subject<CometChat.User>();

  // ── Deprecated generic method ──

  /** @deprecated Use typed publish methods instead (e.g., publishUserBlocked). */
  static publishEvent(event: Subject<CometChat.User>, item: CometChat.User) {
    event.next(item);
  }

  // ── Typed Publish Methods ──

  static publishUserBlocked(user: CometChat.User): void {
    CometChatUserEvents.ccUserBlocked.next(user);
  }

  static publishUserUnblocked(user: CometChat.User): void {
    CometChatUserEvents.ccUserUnblocked.next(user);
  }

  // ── Typed Subscribe Helpers ──

  static onUserBlocked(cb: (user: CometChat.User) => void, destroyRef?: DestroyRef): Subscription {
    return subscribeWithOptionalCleanup(CometChatUserEvents.ccUserBlocked, cb, destroyRef);
  }

  static onUserUnblocked(
    cb: (user: CometChat.User) => void,
    destroyRef?: DestroyRef
  ): Subscription {
    return subscribeWithOptionalCleanup(CometChatUserEvents.ccUserUnblocked, cb, destroyRef);
  }
}
