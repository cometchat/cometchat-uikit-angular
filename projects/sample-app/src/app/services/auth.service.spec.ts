import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatUIKit } from '@cometchat/chat-uikit-angular';
import { AuthService } from './auth.service';
import { AppStateService } from './app-state.service';
import { NavigationService } from './navigation.service';
import { ToastService } from './toast.service';

/**
 * ENG-57327: offline, the SDK signs out locally (session and stored user cleared) and then rejects
 * logout. The sample goes to sign-in whenever the SDK no longer has a user, as Android's sample does.
 */
describe('AuthService.logout', () => {
  let router: { navigate: ReturnType<typeof vi.fn> };
  let appState: { reset: ReturnType<typeof vi.fn> };
  let navigation: { reset: ReturnType<typeof vi.fn> };
  let auth: AuthService;
  let toasts: ToastService;
  let logout: ReturnType<typeof vi.spyOn>;
  let loggedInUser: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    router = { navigate: vi.fn() };
    appState = { reset: vi.fn() };
    navigation = { reset: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: router },
        { provide: AppStateService, useValue: appState },
        { provide: NavigationService, useValue: navigation },
      ],
    });
    auth = TestBed.inject(AuthService);
    toasts = TestBed.inject(ToastService);
    auth.isLoggedIn.set(true);
    auth.loggedInUser.set({ getUid: () => 'alice' } as unknown as CometChat.User);
    logout = vi.spyOn(CometChatUIKit, 'logout');
    loggedInUser = vi.spyOn(CometChat, 'getLoggedinUser');
  });
  afterEach(() => {
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  const wentToSignIn = () => {
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
    expect(auth.isLoggedIn()).toBe(false);
    expect(auth.loggedInUser()).toBeNull();
    expect(appState.reset).toHaveBeenCalledOnce();
    expect(navigation.reset).toHaveBeenCalledOnce();
    expect(toasts.toasts()).toEqual([]);
  };

  it('online: a successful logout goes to sign-in, as before', async () => {
    logout.mockResolvedValue({ message: 'Logout successful' });
    await auth.logout();
    wentToSignIn();
    expect(loggedInUser).not.toHaveBeenCalled();
  });

  it('offline: a rejected logout after the SDK signed out goes to sign-in and does not reject', async () => {
    logout.mockRejectedValue({ code: 'FAILED_TO_FETCH' });
    loggedInUser.mockResolvedValue(null);
    await expect(auth.logout()).resolves.toBeUndefined();
    wentToSignIn();
  });

  it('a rejected logout with the user still signed in stays and shows an error toast', async () => {
    logout.mockRejectedValue({ code: 'ERR_X' });
    loggedInUser.mockResolvedValue({ getUid: () => 'alice' } as unknown as CometChat.User);
    await expect(auth.logout()).resolves.toBeUndefined();
    expect(router.navigate).not.toHaveBeenCalled();
    expect(auth.isLoggedIn()).toBe(true);
    expect(auth.loggedInUser()).not.toBeNull();
    expect(appState.reset).not.toHaveBeenCalled();
    expect(toasts.toasts()).toHaveLength(1);
    expect(toasts.toasts()[0].type).toBe('error');
  });

  it('when the "still signed in?" check itself throws, it goes to sign-in', async () => {
    logout.mockRejectedValue({ code: 'FAILED_TO_FETCH' });
    loggedInUser.mockRejectedValue(new Error('storage unavailable'));
    await expect(auth.logout()).resolves.toBeUndefined();
    wentToSignIn();
  });

  it('a second tap while a logout is running is ignored', async () => {
    let settle!: () => void;
    logout.mockReturnValue(new Promise(resolve => { settle = () => resolve({ message: 'ok' }); }));
    const first = auth.logout();
    const second = auth.logout();
    settle();
    await Promise.all([first, second]);
    expect(logout).toHaveBeenCalledOnce();
    expect(router.navigate).toHaveBeenCalledOnce();
  });
});
