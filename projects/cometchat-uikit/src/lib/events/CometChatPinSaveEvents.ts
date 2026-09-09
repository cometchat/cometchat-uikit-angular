import { DestroyRef } from '@angular/core';
import { Observable, Subject, Subscription, filter, map, merge } from 'rxjs';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { subscribeWithOptionalCleanup } from './event-utils';

/**
 * Payload of the server-truth channels. Carries the FULL updated message, so a
 * consumer swaps its copy rather than patching fields — the backend sends the
 * whole decorated object on both REST and socket, and `pinnedAt`/`savedAt` are
 * present-only-when-set, so a partial patch would leave stale values behind.
 */
export interface IPinSaveChanged {
  message: CometChat.BaseMessage;
}

/**
 * Payload of the optimistic pin channel.
 *
 * `pinned` is the state this client is *claiming*, which is what makes one
 * channel enough for both directions: an optimistic pin publishes `true`, its
 * revert-on-failure publishes `false`.
 */
export interface IPinChanged {
  message: CometChat.BaseMessage;
  pinned: boolean;
}

/** Payload of the optimistic save channel. See {@link IPinChanged}. */
export interface ISaveChanged {
  message: CometChat.BaseMessage;
  saved: boolean;
}

/**
 * Payload of the conversation server-truth channels. Carries the FULL updated
 * conversation, for the same reason the message channels do: the pin attributes
 * are present-only-when-set, so a consumer swaps its copy rather than patching.
 */
export interface IConversationPinSaveChanged {
  conversation: CometChat.Conversation;
}

/** Payload of the optimistic conversation-pin channel. See {@link IPinChanged}. */
export interface IConversationPinChanged {
  conversation: CometChat.Conversation;
  pinned: boolean;
}

/**
 * Pin and save event subjects — the channel that keeps the message bubbles, the
 * Pinned panel, the Saved view and the panel title counts in agreement without
 * a refetch.
 *
 * There are two tiers, and the split is the point:
 *
 * - **Server truth** (`ccMessagePinned` and friends) — a confirmed write or a
 *   realtime frame. Authoritative.
 * - **This client's optimism** (`ccMessagePinChanged`, `ccMessageSaveChanged`) —
 *   the flip a surface applied before the server answered, and its reversal if
 *   the write failed. Not authoritative, and never treated as such.
 *
 * A surface almost always wants *both*: the optimism for immediate feedback and
 * the truth for correctness. {@link pinned$} and its siblings merge the pair per
 * direction, so subscribing to one observable per direction cannot drift out of
 * step with the other tier — prefer those over the raw subjects.
 *
 * Pin events are **broadcast**: everyone in the conversation sees a pin change,
 * because a pin is conversation-wide. Save events are **private** and arrive
 * only on the acting user's own devices, because a save is per-user — so a save
 * event says nothing about anyone else's view of that message.
 */
export class CometChatPinSaveEvents {
  // ── Server truth ──

  /** A message was pinned — conversation-wide. */
  static ccMessagePinned = new Subject<IPinSaveChanged>();
  /** A message was unpinned — conversation-wide. */
  static ccMessageUnpinned = new Subject<IPinSaveChanged>();
  /** The logged-in user saved a message — private, multi-device. */
  static ccMessageSaved = new Subject<IPinSaveChanged>();
  /** The logged-in user unsaved a message — private, multi-device. */
  static ccMessageUnsaved = new Subject<IPinSaveChanged>();

  // ── This client's optimism ──

  /** This client's own pin flip, before the server confirms it (or its revert). */
  static ccMessagePinChanged = new Subject<IPinChanged>();
  /** This client's own save flip, before the server confirms it (or its revert). */
  static ccMessageSaveChanged = new Subject<ISaveChanged>();

  // ── Conversation pin ──
  //
  // A conversation pin is PRIVATE to the user and syncs across their own
  // devices, unlike a message pin, which is conversation-wide. An admin can also
  // pin one globally, which arrives on the same channel.

  /** A conversation was pinned — by this user elsewhere, or globally by an admin. */
  static ccConversationPinned = new Subject<IConversationPinSaveChanged>();
  /** A conversation was unpinned. */
  static ccConversationUnpinned = new Subject<IConversationPinSaveChanged>();
  /** This client's own conversation-pin flip, before the server confirms it. */
  static ccConversationPinChanged = new Subject<IConversationPinChanged>();

  // ── Merged views: what a surface should subscribe to ──

  /** Pinned, whether claimed locally or confirmed by the server. */
  static get pinned$(): Observable<IPinSaveChanged> {
    return merge(
      CometChatPinSaveEvents.ccMessagePinned,
      onlyWhen(CometChatPinSaveEvents.ccMessagePinChanged, e => e.pinned)
    );
  }

  /** Unpinned, whether claimed locally or confirmed by the server. */
  static get unpinned$(): Observable<IPinSaveChanged> {
    return merge(
      CometChatPinSaveEvents.ccMessageUnpinned,
      onlyWhen(CometChatPinSaveEvents.ccMessagePinChanged, e => !e.pinned)
    );
  }

  /** Saved, whether claimed locally or confirmed by the server. */
  static get saved$(): Observable<IPinSaveChanged> {
    return merge(
      CometChatPinSaveEvents.ccMessageSaved,
      onlyWhen(CometChatPinSaveEvents.ccMessageSaveChanged, e => e.saved)
    );
  }

  /** Unsaved, whether claimed locally or confirmed by the server. */
  static get unsaved$(): Observable<IPinSaveChanged> {
    return merge(
      CometChatPinSaveEvents.ccMessageUnsaved,
      onlyWhen(CometChatPinSaveEvents.ccMessageSaveChanged, e => !e.saved)
    );
  }

  /** A conversation pinned, whether claimed locally or confirmed by the server. */
  static get conversationPinned$(): Observable<IConversationPinSaveChanged> {
    return merge(
      CometChatPinSaveEvents.ccConversationPinned,
      onlyWhenConversation(CometChatPinSaveEvents.ccConversationPinChanged, e => e.pinned)
    );
  }

  /** A conversation unpinned, whether claimed locally or confirmed by the server. */
  static get conversationUnpinned$(): Observable<IConversationPinSaveChanged> {
    return merge(
      CometChatPinSaveEvents.ccConversationUnpinned,
      onlyWhenConversation(CometChatPinSaveEvents.ccConversationPinChanged, e => !e.pinned)
    );
  }

  // ── Typed Publish Methods ──

  static publishMessagePinned(data: IPinSaveChanged): void {
    CometChatPinSaveEvents.ccMessagePinned.next(data);
  }

  static publishMessageUnpinned(data: IPinSaveChanged): void {
    CometChatPinSaveEvents.ccMessageUnpinned.next(data);
  }

  static publishMessageSaved(data: IPinSaveChanged): void {
    CometChatPinSaveEvents.ccMessageSaved.next(data);
  }

  static publishMessageUnsaved(data: IPinSaveChanged): void {
    CometChatPinSaveEvents.ccMessageUnsaved.next(data);
  }

  static publishMessagePinChanged(data: IPinChanged): void {
    CometChatPinSaveEvents.ccMessagePinChanged.next(data);
  }

  static publishMessageSaveChanged(data: ISaveChanged): void {
    CometChatPinSaveEvents.ccMessageSaveChanged.next(data);
  }

  static publishConversationPinned(data: IConversationPinSaveChanged): void {
    CometChatPinSaveEvents.ccConversationPinned.next(data);
  }

  static publishConversationUnpinned(data: IConversationPinSaveChanged): void {
    CometChatPinSaveEvents.ccConversationUnpinned.next(data);
  }

  static publishConversationPinChanged(data: IConversationPinChanged): void {
    CometChatPinSaveEvents.ccConversationPinChanged.next(data);
  }

  // ── Typed Subscribe Helpers ──

  static onMessagePinned(
    cb: (data: IPinSaveChanged) => void,
    destroyRef?: DestroyRef
  ): Subscription {
    return subscribeWithOptionalCleanup(CometChatPinSaveEvents.pinned$, cb, destroyRef);
  }

  static onMessageUnpinned(
    cb: (data: IPinSaveChanged) => void,
    destroyRef?: DestroyRef
  ): Subscription {
    return subscribeWithOptionalCleanup(CometChatPinSaveEvents.unpinned$, cb, destroyRef);
  }

  static onMessageSaved(
    cb: (data: IPinSaveChanged) => void,
    destroyRef?: DestroyRef
  ): Subscription {
    return subscribeWithOptionalCleanup(CometChatPinSaveEvents.saved$, cb, destroyRef);
  }

  static onMessageUnsaved(
    cb: (data: IPinSaveChanged) => void,
    destroyRef?: DestroyRef
  ): Subscription {
    return subscribeWithOptionalCleanup(CometChatPinSaveEvents.unsaved$, cb, destroyRef);
  }

  static onConversationPinned(
    cb: (data: IConversationPinSaveChanged) => void,
    destroyRef?: DestroyRef
  ): Subscription {
    return subscribeWithOptionalCleanup(
      CometChatPinSaveEvents.conversationPinned$,
      cb,
      destroyRef
    );
  }

  static onConversationUnpinned(
    cb: (data: IConversationPinSaveChanged) => void,
    destroyRef?: DestroyRef
  ): Subscription {
    return subscribeWithOptionalCleanup(
      CometChatPinSaveEvents.conversationUnpinned$,
      cb,
      destroyRef
    );
  }
}

/**
 * Narrow an optimistic channel to one direction and drop the boolean, so both
 * tiers reach a subscriber in the same shape.
 */
function onlyWhen<T extends { message: CometChat.BaseMessage }>(
  source: Subject<T>,
  predicate: (event: T) => boolean
): Observable<IPinSaveChanged> {
  return source.pipe(
    filter(predicate),
    map(({ message }) => ({ message }))
  );
}

/** {@link onlyWhen} for the conversation channel. */
function onlyWhenConversation<T extends { conversation: CometChat.Conversation }>(
  source: Subject<T>,
  predicate: (event: T) => boolean
): Observable<IConversationPinSaveChanged> {
  return source.pipe(
    filter(predicate),
    map(({ conversation }) => ({ conversation }))
  );
}
