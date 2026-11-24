import { Injectable, OnDestroy } from '@angular/core';
import { signal } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatLogger } from '../utils/CometChatLogger';
import { sdkConnected } from '../utils/offline/offline-gate';

/**
 * ConnectionStateService
 *
 * A single, root-level service that owns exactly ONE CometChat ConnectionListener
 * for the entire application. All components and services that need to react to
 * WebSocket connect/disconnect events should inject this service instead of
 * registering their own listeners.
 *
 * Why one listener?
 * - The SDK fires the same event to every registered listener simultaneously.
 *   Having N listeners (one per list component) causes N parallel refetches on
 *   reconnect, which is wasteful and can cause race conditions.
 * - A single shared signal/observable lets any part of the UI (e.g. a
 *   "reconnecting…" banner) read connection state without extra wiring.
 *
 * Three streams, and they answer different questions:
 * - {@link connected} (signal) and a `toObservable` of it: "what is the state, and when does it
 *   change?" Use it to paint.
 * - {@link reconnected$}: "did the connection come back after it was reported down?" Use it to
 *   refetch a list that already holds server content.
 * - {@link connects$}: "is the connection up now?", on every connect, change or not. Use it where
 *   nothing has loaded yet and the connect is the only chance to load, because the two streams
 *   above can both stay silent across a real outage - see {@link connects$}.
 *
 * Usage in services:
 * ```typescript
 * private connectionState = inject(ConnectionStateService);
 *
 * constructor() {
 *   this.connectionState.reconnected$
 *     .pipe(takeUntilDestroyed(this.destroyRef))
 *     .subscribe(() => this.refresh());
 * }
 * ```
 *
 * Usage in templates:
 * ```html
 * @if (connectionState.connected() === false) {
 *   <div class="reconnecting-banner">Reconnecting…</div>
 * }
 * ```
 */
@Injectable({ providedIn: 'root' })
export class ConnectionStateService implements OnDestroy {
  // null  = unknown (before first SDK event)
  // true  = connected
  // false = disconnected
  private readonly _connected = signal<boolean | null>(null);

  /** Current connection state as a read-only signal. */
  readonly connected = this._connected.asReadonly();

  /**
   * Observable that emits `true` every time the WebSocket reconnects.
   * Skips the initial `null → true` transition that happens at app startup
   * (that is not a reconnect, it is the first connect).
   */
  readonly reconnected$: Observable<boolean>;

  /**
   * Every connect the SDK reports, whether or not a disconnect was reported before it and
   * whether or not it changes {@link connected}.
   *
   * Both of the streams above answer "did the state change?", and across one real outage
   * neither does. The SDK fires `onDisconnected` only when the socket closes while its status
   * is neither DISCONNECTED nor CONNECTING (`CometChat.ts`, WS ready-state CLOSED), so a drop
   * inside a connect window - the launch connect, or a reconnect attempt - is never reported.
   * The signal then still holds the `true` of the connect before it, the connect that follows
   * sets `true` over `true` (no change, so a `toObservable` of it emits nothing) and
   * `disconnectedSinceConnect` is still false (so `reconnected$` emits nothing either). A screen
   * waiting on the connection to load for the first time saw neither and stayed on its offline
   * error until it was reopened (ENG-57333).
   *
   * Android reloads from `onConnected`, once per connection, for the same reason
   * (`MessageListOfflineSync.kt:60-73`).
   */
  readonly connects$: Observable<void>;

  private readonly listenerId = `global_conn_${Date.now()}`;

  /**
   * A reconnect is a connect that follows a disconnect, taken straight from the SDK events.
   * It is not read back from the signal: a disconnect and a reconnect delivered back to back
   * (a laptop waking, a throttled tab) reach a signal-based observable as one unchanged value,
   * and the reconnect would be lost.
   */
  private readonly reconnects = new Subject<boolean>();
  private readonly connects = new Subject<void>();
  private disconnectedSinceConnect = false;

  constructor() {
    this.reconnected$ = this.reconnects.asObservable();
    this.connects$ = this.connects.asObservable();

    try {
      CometChat.addConnectionListener(
        this.listenerId,
        new CometChat.ConnectionListener({
          onConnected: () => {
            CometChatLogger.info('ConnectionStateService', 'WebSocket connected');
            this.reportConnected();
          },
          onDisconnected: () => {
            CometChatLogger.info('ConnectionStateService', 'WebSocket disconnected');
            this._connected.set(false);
            this.disconnectedSinceConnect = true;
          },
        })
      );
    } catch (error) {
      CometChatLogger.error('ConnectionStateService', 'Error attaching connection listener:', error);
    }

    this.watchBrowserConnectivity();
  }

  ngOnDestroy(): void {
    if (!this.browserListenersAttached) return;
    window.removeEventListener('online', this.onBrowserOnline);
    window.removeEventListener('offline', this.onBrowserOffline);
    this.browserListenersAttached = false;
  }

  /** Record a connect: the state, the reconnect bookkeeping, and {@link connects$}. */
  private reportConnected(): void {
    this._connected.set(true);
    if (this.disconnectedSinceConnect) {
      this.disconnectedSinceConnect = false;
      this.reconnects.next(true);
    }
    this.connects.next();
  }

  private browserListenersAttached = false;

  /**
   * The browser's own connectivity events, as a backstop under the SDK's.
   *
   * The SDK stays silent about a socket that closes while it is still connecting (see
   * {@link connects$}), and the browser does not: it reports the interface going down and coming
   * back either way. Neither handler invents state - each one checks the SDK's own status first -
   * so a browser event that disagrees with a live socket changes nothing.
   */
  private watchBrowserConnectivity(): void {
    if (typeof window === 'undefined' || typeof window.addEventListener !== 'function') return;
    window.addEventListener('online', this.onBrowserOnline);
    window.addEventListener('offline', this.onBrowserOffline);
    this.browserListenersAttached = true;
  }

  /**
   * The interface went down. When the SDK is not connected either, this is the disconnect it
   * will not report, so it is recorded here: without it the connect that follows looks like
   * "no change" to every consumer of the state.
   */
  private readonly onBrowserOffline = (): void => {
    if (sdkConnected()) return;
    // Nothing has connected yet (the login screen): there is no connection to lose, so this is
    // not the missing disconnect. Recording one would make the sign-in connect a "reconnect" and
    // every root list refetch once at login, which `reconnected$` promises not to do.
    if (this._connected() === null) return;
    if (this._connected() === false && this.disconnectedSinceConnect) return;
    CometChatLogger.info('ConnectionStateService', 'Browser reported offline');
    this._connected.set(false);
    this.disconnectedSinceConnect = true;
  };

  /**
   * The interface came back. When the SDK's socket is already up, the SDK has nothing left to
   * report and no `onConnected` will arrive, so the connect is recorded here instead. When it is
   * not up, nothing is done: the SDK reconnects on its own and its `onConnected` is the signal.
   */
  private readonly onBrowserOnline = (): void => {
    if (!sdkConnected()) return;
    CometChatLogger.info('ConnectionStateService', 'Browser reported online, socket already up');
    this.reportConnected();
  };

}
