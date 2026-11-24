/**
 * Session lifecycle of a list that ran the offline (ON) read path (UIK-LIFE-01/02):
 * a logout or user switch clears it so nothing of the old session stays on
 * screen, and an offline cache reset reloads it from the rebuilt cache. Lists
 * that never ran the offline path are untouched (offline off = today).
 *
 * The hub emits `session$` and then `cacheReset$` for a reset, so the clear
 * remembers that the list had run offline until the reset (or the end of that
 * hub call) has been seen.
 *
 * @internal
 */
import { DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { OfflineHubService } from '../../services/offline-hub.service';

export class OfflineListSession {
  private ran = false;
  private reloadPending = false;
  private epochValue = 0;

  /** Call when a read takes the offline path. */
  markRan(): void {
    this.ran = true;
  }

  get ranOffline(): boolean {
    return this.ran;
  }

  /** Capture at the start of a read; late callbacks of an ended session compare it. */
  get epoch(): number {
    return this.epochValue;
  }

  isStale(epoch: number): boolean {
    return epoch !== this.epochValue;
  }

  /**
   * A new request (a new search, a re-initialisation) replaces the one in
   * flight: any read that captured the old epoch is stale, with offline on or
   * off. Unlike {@link end} it neither reloads nor changes `ranOffline`.
   */
  supersede(): void {
    this.epochValue++;
  }

  /** The session ended (logout, user switch or cache reset). */
  end(): void {
    this.epochValue++;
    this.reloadPending = this.ran;
    this.ran = false;
    queueMicrotask(() => {
      this.reloadPending = false;
    });
  }

  /** Whether a cache reset that follows the end of the session should reload this list. */
  takeReload(): boolean {
    const pending = this.reloadPending;
    this.reloadPending = false;
    return pending;
  }
}

/** Wire `session` to the hub for the life of `destroyRef`. */
export function watchOfflineSession(
  hub: OfflineHubService,
  destroyRef: DestroyRef,
  session: OfflineListSession,
  handlers: { clear(): void; reload(): void }
): void {
  hub.session$.pipe(takeUntilDestroyed(destroyRef)).subscribe(() => {
    const wasOffline = session.ranOffline;
    session.end();
    if (wasOffline) handlers.clear();
  });
  hub.cacheReset$.pipe(takeUntilDestroyed(destroyRef)).subscribe(() => {
    if (session.takeReload()) handlers.reload();
  });
}
