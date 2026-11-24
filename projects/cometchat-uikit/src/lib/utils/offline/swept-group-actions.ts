/**
 * Swept group actions (README §3.7, UIK-SYNC-03, UIT-SYNC-13).
 *
 * On the offline path, group-member actions that happened while the device was
 * away come only in the SDK's message-sync result (BEH-SYNC-25), never on the
 * realtime GroupListener. So each kit service that reacts to the live events
 * replays the swept ones through the very handlers it gave its live
 * GroupListener, with the same arguments the SDK passes
 * (`WSConnectionHelper.publishActionMessage`). Nothing here runs with offline
 * off: the hub's sync stream never emits then.
 *
 * @internal
 */
import { CometChat } from '@cometchat/chat-sdk-javascript';
import type { Observable, Subscription } from 'rxjs';
import type { MessageSyncEvent } from './offline-hub';
import type { OfflineCallback } from './offline-gate';

/** The GroupListener callbacks a kit service registers (any subset). */
export interface GroupActionHandlers {
  onGroupMemberJoined?: (message: CometChat.Action, joinedUser: any, group: any) => void;
  onGroupMemberLeft?: (message: CometChat.Action, leavingUser: any, group: any) => void;
  onGroupMemberKicked?: (
    message: CometChat.Action,
    kickedUser: any,
    kickedBy: any,
    group: any
  ) => void;
  onGroupMemberBanned?: (
    message: CometChat.Action,
    bannedUser: any,
    bannedBy: any,
    group: any
  ) => void;
  onGroupMemberUnbanned?: (
    message: CometChat.Action,
    unbannedUser: any,
    unbannedBy: any,
    group: any
  ) => void;
  onGroupMemberScopeChanged?: (
    message: CometChat.Action,
    changedUser: any,
    newScope: any,
    oldScope: any,
    group: any
  ) => void;
  onMemberAddedToGroup?: (
    message: CometChat.Action,
    userAdded: any,
    addedBy: any,
    group: any
  ) => void;
}

/** Whether `message` is a group-member action (the only kind replayed). */
export function isGroupMemberAction(
  message: CometChat.BaseMessage | null | undefined
): message is CometChat.Action {
  return (
    !!message &&
    (message as any).getCategory?.() === 'action' &&
    (message as any).getType?.() === 'groupMember'
  );
}

function call(fn: OfflineCallback | undefined, args: unknown[]): boolean {
  if (typeof fn !== 'function') return false;
  fn(...args);
  return true;
}

/**
 * Run the live handler matching one swept action, with the SDK's live
 * arguments. Returns whether a handler ran.
 */
export function replayGroupAction(
  message: CometChat.BaseMessage,
  handlers: GroupActionHandlers
): boolean {
  if (!isGroupMemberAction(message)) return false;
  const m = message as any;
  const on = m.getActionOn?.();
  const by = m.getActionBy?.();
  const group = m.getActionFor?.();
  if (!group || typeof group.getGuid !== 'function') return false;
  switch (m.getAction?.()) {
    case 'joined':
    case 'invited':
      return call(handlers.onGroupMemberJoined, [message, by, group]);
    case 'left':
      return call(handlers.onGroupMemberLeft, [message, by, group]);
    case 'kicked':
      return call(handlers.onGroupMemberKicked, [message, on, by, group]);
    case 'banned':
      return call(handlers.onGroupMemberBanned, [message, on, by, group]);
    case 'unbanned':
      return call(handlers.onGroupMemberUnbanned, [message, on, by, group]);
    case 'scopeChanged':
      return call(handlers.onGroupMemberScopeChanged, [
        message,
        on,
        m.getNewScope?.(),
        m.getOldScope?.(),
        group,
      ]);
    case 'added':
      return call(handlers.onMemberAddedToGroup ?? (handlers as any).onGroupMemberAddedToGroup, [
        message,
        on,
        by,
        group,
      ]);
    default:
      return false;
  }
}

/**
 * Replay every swept group action of each message-sync result through
 * `handlers`, for as long as the returned subscription lives. Events of an
 * older session (`gen`) are dropped.
 */
export function replaySweptGroupActions(
  messageSync$: Observable<MessageSyncEvent>,
  currentGen: () => number,
  handlers: GroupActionHandlers | (() => GroupActionHandlers | null)
): Subscription {
  return messageSync$.subscribe(event => {
    if (event.gen !== currentGen()) return;
    const target = typeof handlers === 'function' ? handlers() : handlers;
    if (!target) return;
    for (const message of event.messages) {
      try {
        replayGroupAction(message, target);
      } catch {
        /* one bad action never stops the rest */
      }
    }
  });
}
