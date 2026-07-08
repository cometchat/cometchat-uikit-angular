import { Injectable } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { signal } from '@angular/core';
import { Observable } from 'rxjs';
import { filter, skip } from 'rxjs/operators';
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

  constructor() {
    // Skip the very first emission (null → true at startup) so subscribers
    // only fire on genuine reconnects after a disconnect.
    this.reconnected$ = toObservable(this._connected).pipe(
      skip(1),
      filter((v): v is true => v === true)
    );

    try {
      CometChat.addConnectionListener(
        this.listenerId,
        new CometChat.ConnectionListener({
          onConnected: () => {
            CometChatLogger.info('ConnectionStateService', 'WebSocket connected');
            this._connected.set(true);
          },
          onDisconnected: () => {
            CometChatLogger.info('ConnectionStateService', 'WebSocket disconnected');
            this._connected.set(false);
          },
        })
      );
    } catch (error) {
      CometChatLogger.error('ConnectionStateService', 'Error attaching connection listener:', error);
    }
  }
}
