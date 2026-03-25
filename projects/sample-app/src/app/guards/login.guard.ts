import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { CometChat } from '@cometchat/chat-sdk-javascript';

/**
 * Prevents accessing the login page when already logged in.
 * Redirects to /home if user is already authenticated.
 */
export const loginGuard: CanActivateFn = async () => {
  const router = inject(Router);

  try {
    const user = await CometChat.getLoggedinUser();
    if (user) {
      return router.createUrlTree(['/home']);
    }
    return true;
  } catch {
    return true;
  }
};
