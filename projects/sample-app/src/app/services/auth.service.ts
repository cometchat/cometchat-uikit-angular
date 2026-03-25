import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatUIKit } from '@cometchat/chat-uikit-angular';
import { AppStateService } from './app-state.service';
import { NavigationService } from './navigation.service';

interface SampleUserData {
  uid: string;
  name: string;
  avatar?: string;
  status?: string;
}

const CREDENTIALS_KEY = 'cometchat-credentials';

const FALLBACK_USERS: SampleUserData[] = [
  { uid: 'superhero1', name: 'Iron Man', avatar: 'https://data-us.cometchat.io/assets/images/avatars/ironman.png' },
  { uid: 'superhero2', name: 'Captain America', avatar: 'https://data-us.cometchat.io/assets/images/avatars/captainamerica.png' },
  { uid: 'superhero3', name: 'Spiderman', avatar: 'https://data-us.cometchat.io/assets/images/avatars/spiderman.png' },
  { uid: 'superhero4', name: 'Wolverine', avatar: 'https://data-us.cometchat.io/assets/images/avatars/wolverine.png' },
  { uid: 'superhero5', name: 'Cyclops', avatar: 'https://data-us.cometchat.io/assets/images/avatars/cyclops.png' },
];

@Injectable({ providedIn: 'root' })
export class AuthService {
  private router = inject(Router);
  private appStateService = inject(AppStateService);
  private navigationService = inject(NavigationService);

  isLoggedIn = signal(false);
  loggedInUser = signal<CometChat.User | null>(null);

  async login(uid: string): Promise<CometChat.User> {
    const user = await CometChatUIKit.login(uid);
    this.loggedInUser.set(user);
    this.isLoggedIn.set(true);
    this.router.navigate(['/home']);
    return user;
  }

  async logout(): Promise<void> {
    await CometChatUIKit.logout();
    this.loggedInUser.set(null);
    this.isLoggedIn.set(false);
    this.appStateService.reset();
    this.navigationService.reset();
    this.router.navigate(['/login']);
  }

  async fetchSampleUsers(): Promise<CometChat.User[]> {
    try {
      const raw = localStorage.getItem(CREDENTIALS_KEY);
      if (!raw) {
        return this.getFallbackUsers();
      }

      const credentials = JSON.parse(raw);
      const { appId, region, authKey } = credentials;

      if (!appId || !region || !authKey) {
        return this.getFallbackUsers();
      }

      const url = `https://${appId}.api-${region}.cometchat.io/v3/users?perPage=25`;
      const response = await fetch(url, {
        headers: {
          appId,
          apiKey: authKey,
        },
      });

      if (!response.ok) {
        return this.getFallbackUsers();
      }

      const json = await response.json();
      const usersData: SampleUserData[] = json.data ?? [];

      return usersData.map((userData) => {
        const user = new CometChat.User(userData.uid);
        user.setName(userData.name);
        if (userData.avatar) {
          user.setAvatar(userData.avatar);
        }
        if (userData.status) {
          user.setStatus(userData.status);
        }
        return user;
      });
    } catch {
      return this.getFallbackUsers();
    }
  }

  private getFallbackUsers(): CometChat.User[] {
    return FALLBACK_USERS.map((data) => {
      const user = new CometChat.User(data.uid);
      user.setName(data.name);
      if (data.avatar) {
        user.setAvatar(data.avatar);
      }
      return user;
    });
  }
}
