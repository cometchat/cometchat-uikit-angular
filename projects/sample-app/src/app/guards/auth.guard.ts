import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { CometChat } from '@cometchat/chat-sdk-javascript';

/**
 * Checks if the user is logged in via CometChat SDK.
 * Redirects to /login if not logged in.
 */
export const authGuard: CanActivateFn = async () => {
  const router = inject(Router);

  try {
    const user = await CometChat.getLoggedinUser();
    if (user) {
      return true;
    }
    return router.createUrlTree(['/login']);
  } catch {
    return router.createUrlTree(['/login']);
  }
};
