import { DestroyRef } from '@angular/core';
import { Subject, Subscription } from 'rxjs';

/**
 * Subscribe to a Subject with an optional DestroyRef for automatic cleanup.
 * If destroyRef is provided, the subscription is unsubscribed when the
 * component/service is destroyed.
 */
export function subscribeWithOptionalCleanup<T>(
  subject: Subject<T>,
  callback: (data: T) => void,
  destroyRef?: DestroyRef
): Subscription {
  const subscription = subject.subscribe(callback);
  if (destroyRef) {
    destroyRef.onDestroy(() => {
      if (!subscription.closed) {
        subscription.unsubscribe();
      }
    });
  }
  return subscription;
}
