import { DestroyRef } from '@angular/core';
import { Observable, Subscription } from 'rxjs';

/**
 * Subscribe to an observable with an optional DestroyRef for automatic cleanup.
 * If destroyRef is provided, the subscription is unsubscribed when the
 * component/service is destroyed.
 *
 * Typed to `Observable` rather than `Subject` — only `subscribe` is used, and
 * some channels are a merged view of several subjects rather than one of them.
 * Every existing caller passing a Subject still type-checks.
 */
export function subscribeWithOptionalCleanup<T>(
  source: Observable<T>,
  callback: (data: T) => void,
  destroyRef?: DestroyRef
): Subscription {
  const subscription = source.subscribe(callback);
  if (destroyRef) {
    destroyRef.onDestroy(() => {
      if (!subscription.closed) {
        subscription.unsubscribe();
      }
    });
  }
  return subscription;
}
