import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { TranslatePipe } from '@cometchat/chat-uikit-angular';

interface SampleUser {
  uid: string;
  name: string;
  avatar: string;
}

const FALLBACK_USERS: SampleUser[] = [
  { uid: 'cometchat-uid-1', name: 'Andrew Joseph', avatar: 'https://assets.cometchat.io/sampleapp/v2/users/cometchat-uid-1.webp' },
  { uid: 'cometchat-uid-2', name: 'George Alan', avatar: 'https://assets.cometchat.io/sampleapp/v2/users/cometchat-uid-2.webp' },
  { uid: 'cometchat-uid-3', name: 'Nancy Grace', avatar: 'https://assets.cometchat.io/sampleapp/v2/users/cometchat-uid-3.webp' },
  { uid: 'cometchat-uid-4', name: 'Susan Marie', avatar: 'https://assets.cometchat.io/sampleapp/v2/users/cometchat-uid-4.webp' },
  { uid: 'cometchat-uid-5', name: 'John Paul', avatar: 'https://assets.cometchat.io/sampleapp/v2/users/cometchat-uid-5.webp' },
];

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [FormsModule, TranslatePipe],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.css',
})
export class LoginPageComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  sampleUsers = signal<SampleUser[]>(FALLBACK_USERS);
  selectedUid = signal('');
  loggingIn = signal(false);
  errorMessage = signal('');
  customUid = '';

  async ngOnInit(): Promise<void> {
    try {
      const response = await fetch('https://assets.cc-cluster-2.io/sampleapp/v2/sampledata.json');
      const data = await response.json();
      if (data?.users?.length) {
        this.sampleUsers.set(data.users);
      }
    } catch (error) {
      console.log('Fetching default users failed, using fallback data', error);
    }
  }

  async loginWithUser(uid: string): Promise<void> {
    if (this.loggingIn()) return;
    this.selectedUid.set(uid);
    this.errorMessage.set('');
    this.loggingIn.set(true);
    try {
      await this.authService.login(uid);
    } catch (error: unknown) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Login failed. Please try again.');
    }
 finally {
      this.loggingIn.set(false);
    }
  }

  async loginWithCustomUid(): Promise<void> {
    const uid = this.customUid.trim();
    if (!uid) {
      this.errorMessage.set('Please enter a UID.');
      return;
    }
    await this.loginWithUser(uid);
  }

  changeCredentials(): void {
    localStorage.removeItem('cometchat-credentials');
    this.router.navigate(['/credentials']);
  }
}
