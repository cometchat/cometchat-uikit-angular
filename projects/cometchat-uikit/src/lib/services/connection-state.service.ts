import { Injectable } from '@angular/core';
import { signal } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatLogger } from '../utils/CometChatLogger';

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
export class ConnectionStateService {
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

  private readonly listenerId = `global_conn_${Date.now()}`;

  /**
   * A reconnect is a connect that follows a disconnect, taken straight from the SDK events.
   * It is not read back from the signal: a disconnect and a reconnect delivered back to back
   * (a laptop waking, a throttled tab) reach a signal-based observable as one unchanged value,
   * and the reconnect would be lost.
   */
  private readonly reconnects = new Subject<boolean>();
  private disconnectedSinceConnect = false;

  constructor() {
    this.reconnected$ = this.reconnects.asObservable();

    try {
      CometChat.addConnectionListener(
        this.listenerId,
        new CometChat.ConnectionListener({
          onConnected: () => {
            CometChatLogger.info('ConnectionStateService', 'WebSocket connected');
            this._connected.set(true);
            if (this.disconnectedSinceConnect) {
              this.disconnectedSinceConnect = false;
              this.reconnects.next(true);
            }
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
  }
}
