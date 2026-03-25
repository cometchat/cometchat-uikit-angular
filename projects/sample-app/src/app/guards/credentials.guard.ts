import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

/**
 * Checks localStorage for stored CometChat credentials.
 * Redirects to /credentials if no credentials are found.
 */
export const credentialsGuard: CanActivateFn = () => {
  const router = inject(Router);
  const stored = localStorage.getItem('cometchat-credentials');

  if (!stored) {
    return router.createUrlTree(['/credentials']);
  }

  try {
    const credentials = JSON.parse(stored);
    if (!credentials.appId || !credentials.region || !credentials.authKey) {
      return router.createUrlTree(['/credentials']);
    }
  } catch {
    return router.createUrlTree(['/credentials']);
  }

  return true;
};
