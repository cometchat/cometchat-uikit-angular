import { DestroyRef, Injectable, Injector, NgZone, Signal, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { ConnectionStateService } from './connection-state.service';
import { isOfflineOn, sdkConnected } from '../utils/offline/offline-gate';
import { Observable, MonoTypeOperatorFunction } from 'rxjs';
import {
  CacheResetEvent,
  ConversationSyncEvent,
  MediaReadyEvent,
  MessageSyncEvent,
  MessagesUpdatedEvent,
  OfflineHub,
  OfflineNotice,
  OfflineNoticeKind,
  SendStateEvent,
  SyncFailedEvent,
} from '../utils/offline/offline-hub';

/**
 * How long the short "Sending... try again in a moment" notice stays (R162). It
 * answers one tap, so it goes by itself; a newer one replaces it.
 */
export const SEND_IN_FLIGHT_NOTICE_MS = 4000;

/**
 * Notice kinds the list shows one of at a time, newest wins. Each of these renders a fixed
 * sentence with nothing in it to tell two of them apart, so a second one is only a second row
 * to dismiss. The kinds that carry their own detail — the removed message behind
 * `unsent_message_removed`, the count in `messages_not_sent` — are left alone.
 */
const COLLAPSED_NOTICE_KINDS: ReadonlySet<OfflineNoticeKind> = new Set<OfflineNoticeKind>([
  'send_in_flight',
  'queue_full',
  'file_too_large_offline',
]);

/**
 * The list a notice belongs to — its chat and its thread level — so a collapse replaces only the
 * notice of the list that raised it. The store is one signal shared by every mounted list
 * (`providedIn: 'root'`), and each list renders the subset that is its own
 * (`CometChatMessageList.visibleOfflineNotices`); without this, a refusal in a thread panel would
 * silently drop the main list's banner. A notice with nothing to place it (no message, no
 * conversation) scopes to '' and collapses against the others like it.
 */
function noticeScopeOf(notice: OfflineNotice): string {
  const about = notice.message ?? notice.scopeMessage;
  if (!about) return notice.conversationId ?? '';
  const level = Number((about as any).getParentMessageId?.() ?? 0) || 0;
  const chat =
    notice.conversationId ??
    `${(about as any).getReceiverType?.() ?? ''}:${(about as any).getReceiverId?.() ?? ''}`;
  return `${chat}#${level}`;
}

/**
 * Re-enter Angular's zone for each emission. SDK callbacks arrive outside it;
 * in a zone app that would leave OnPush views stale. In a zoneless app
 * `NgZone.run` is a pass-through and the signal writes the screens make drive
 * change detection on their own.
 */
function inZone<T>(zone: NgZone): MonoTypeOperatorFunction<T> {
  return source =>
    new Observable<T>(subscriber =>
      source.subscribe({
        next: value => zone.run(() => subscriber.next(value)),
        error: error => zone.run(() => subscriber.error(error)),
        complete: () => zone.run(() => subscriber.complete()),
      })
    );
}

/**
 * Adapts the process-wide {@link OfflineHub} to Angular for the kit's
 * services and components. It only adapts: it never registers, starts or
 * stops SDK listeners (the hub does that once, at kit init).
 *
 * @internal
 */
@Injectable({ providedIn: 'root' })
export class OfflineHubService {
  private readonly zone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private readonly hub = OfflineHub.getInstance();
  private connectionChangedStream: Observable<boolean | null> | null = null;

  /**
   * The SDK's realtime connection going down or up (from the kit's root
   * `ConnectionStateService`). Created on first use, which only the offline
   * path makes, so an offline-off app instantiates nothing new.
   */
  get connectionChanged$(): Observable<boolean | null> {
    if (!this.connectionChangedStream) {
      const connection = this.injector.get(ConnectionStateService);
      this.connectionChangedStream = toObservable(connection.connected, {
        injector: this.injector,
      });
    }
    return this.connectionChangedStream;
  }

  /**
   * The SDK's realtime connection coming back after it was down, taken from the SDK's connect
   * events (`ConnectionStateService.reconnected$`), so a disconnect and a reconnect delivered back
   * to back still emit. Read on first use, which only the offline path makes, so an offline-off
   * app instantiates nothing new.
   */
  get reconnected$(): Observable<boolean> {
    return this.injector.get(ConnectionStateService).reconnected$;
  }

  /**
   * Every connect the SDK reports, change or not
   * (`ConnectionStateService.connects$`). What a screen that has loaded nothing yet has to
   * follow: a drop the SDK never reported leaves both {@link connectionChanged$} and
   * {@link reconnected$} silent on the connect that ends it. Read on first use, which only the
   * offline path makes, so an offline-off app instantiates nothing new.
   */
  get connects$(): Observable<void> {
    return this.injector.get(ConnectionStateService).connects$;
  }

  readonly sendState$: Observable<SendStateEvent> = this.hub.sendState$.pipe(inZone(this.zone));
  readonly messageSync$: Observable<MessageSyncEvent> = this.hub.messageSync$.pipe(
    inZone(this.zone)
  );
  readonly syncFailed$: Observable<SyncFailedEvent> = this.hub.syncFailed$.pipe(inZone(this.zone));
  readonly conversationSync$: Observable<ConversationSyncEvent> = this.hub.conversationSync$.pipe(
    inZone(this.zone)
  );
  readonly messagesUpdated$: Observable<MessagesUpdatedEvent> = this.hub.messagesUpdated$.pipe(
    inZone(this.zone)
  );
  readonly cacheReset$: Observable<CacheResetEvent> = this.hub.cacheReset$.pipe(inZone(this.zone));
  readonly mediaReady$: Observable<MediaReadyEvent> = this.hub.mediaReady$.pipe(inZone(this.zone));
  readonly session$: Observable<number> = this.hub.session$.pipe(inZone(this.zone));

  /** Bumped on every sign-in and session change so {@link presenceHidden} re-reads the offline gate. */
  private readonly sessionTick = signal(0);
  /**
   * True while offline support is on and the SDK is not connected: the kit then
   * shows no presence (online dots, "Online", "Last seen"), because what it
   * holds is the last thing heard, not the truth. Always false with offline off.
   *
   * Re-evaluates on every connect/disconnect and on every sign-in. The sign-in
   * matters on its own: the gate cannot answer before the SDK has a session,
   * so a first read taken before login cached `false`, and a run that signs in
   * with no connection - the app opened offline on a cached session - changed
   * nothing else to re-read it, leaving the last-heard presence on screen as
   * though it were current.
   */
  readonly presenceHidden: Signal<boolean> = computed(() => {
    this.sessionTick();
    if (!isOfflineOn()) return false;
    this.injector.get(ConnectionStateService).connected();
    return !sdkConnected();
  });

  private readonly noticesSignal = signal<OfflineNotice[]>([]);
  /** Notices raised this session that no screen has dismissed yet, oldest first. */
  readonly notices = this.noticesSignal.asReadonly();
  /** The timer that dismisses the one "Sending..." notice by itself. */
  private inFlightTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    // The public events (`ccMessageSent`, `ccMessageSendStateChanged`) reach app code inside the zone.
    this.hub.setPublicRunner(emit => this.zone.run(emit));
    this.noticesSignal.set(this.hub.claimNotices());
    this.hub.notice$.pipe(inZone(this.zone), takeUntilDestroyed(this.destroyRef)).subscribe(notice => {
      this.noticesSignal.update(list => {
        // One notice at a time for every kind whose text is a fixed sentence with nothing in it
        // to tell two of them apart: "Sending... try again" (a newer tap replaces it), and the
        // two refusals, "Too many messages waiting to send" and "File too large to send
        // offline". Each of those is raised once per refused send, so without this a user who
        // tapped Send three times against a full queue got three identical banners to dismiss,
        // one after another, covering the chat. Android raises one notice at a time too: its
        // relay emits them singly to a transient surface (`OfflineNoticeRelay`), never as a
        // stack of persistent rows. `unsent_message_removed` is deliberately not collapsed —
        // each one names its own message and offers Copy for it.
        // Only within the list that raised it: see `noticeScopeOf`.
        const scope = noticeScopeOf(notice);
        const kept = COLLAPSED_NOTICE_KINDS.has(notice.kind)
          ? list.filter(n => n.kind !== notice.kind || noticeScopeOf(n) !== scope)
          : list;
        return [...kept.slice(-9), notice];
      });
      if (notice.kind === 'send_in_flight') this.autoDismissInFlight(notice);
    });
    this.hub.session$.pipe(inZone(this.zone), takeUntilDestroyed(this.destroyRef)).subscribe(gen => {
      this.sessionTick.update(n => n + 1);
      this.noticesSignal.update(list => list.filter(n => n.gen === gen));
    });
    // A sign-in changes what the gate answers without ending any session.
    this.hub.login$.pipe(inZone(this.zone), takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.sessionTick.update(n => n + 1);
    });
  }

  /** The short notice answers one tap, so it goes by itself ({@link SEND_IN_FLIGHT_NOTICE_MS}). */
  private autoDismissInFlight(notice: OfflineNotice): void {
    if (this.inFlightTimer !== null) clearTimeout(this.inFlightTimer);
    this.inFlightTimer = setTimeout(() => {
      this.inFlightTimer = null;
      this.zone.run(() => this.dismissNotice(notice));
    }, SEND_IN_FLIGHT_NOTICE_MS);
  }

  get gen(): number {
    return this.hub.gen;
  }

  /** Mounted conversation lists; while one is mounted it owns the cache-reset notices. */
  private conversationListsMounted = 0;
  conversationListMounted(): () => void {
    this.conversationListsMounted++;
    let done = false;
    return () => {
      if (!done) {
        done = true;
        this.conversationListsMounted--;
      }
    };
  }
  get hasConversationList(): boolean {
    return this.conversationListsMounted > 0;
  }

  dismissNotice(notice: OfflineNotice): void {
    this.noticesSignal.update(list => list.filter(n => n !== notice));
  }

  directFailureOf(message: Parameters<OfflineHub['directFailureOf']>[0]): string | undefined {
    return this.hub.directFailureOf(message);
  }

  rememberReadWhileOffline(receiverId: string, receiverType: string): void {
    this.hub.rememberReadWhileOffline(receiverId, receiverType);
  }

  /** Read on this device while offline, with the server not known to agree yet (D3). */
  wasReadLocally(entityId: string, conversationType: string): boolean {
    return this.hub.wasReadLocally(entityId, conversationType);
  }

  /** A new message has made the chat unread again: stop pinning it to zero. */
  forgetLocalRead(entityId: string, conversationType: string): void {
    this.hub.forgetLocalRead(entityId, conversationType);
  }

  /**
   * Whether this group action was replayed by a catch-up sweep rather than
   * delivered live. A screen uses it to keep the group snapshot the
   * conversation sync just delivered, instead of the older one the action
   * carries. Always false with offline off (nothing is ever swept).
   */
  wasSweptAction(message: CometChat.BaseMessage | null | undefined): boolean {
    return this.hub.wasSwept(message);
  }
}
