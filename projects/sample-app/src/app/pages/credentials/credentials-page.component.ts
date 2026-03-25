import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@cometchat/chat-uikit-angular';

const CREDENTIALS_KEY = 'cometchat-credentials';

@Component({
  selector: 'app-credentials-page',
  standalone: true,
  imports: [FormsModule, TranslatePipe],
  templateUrl: './credentials-page.component.html',
  styleUrl: './credentials-page.component.css',
})
export class CredentialsPageComponent implements OnInit {
  appId = '';
  region = 'us';
  authKey = '';
  errorMessage = signal('');

  readonly regions = [
    { value: 'us', label: 'US', flag: '🇺🇸' },
    { value: 'eu', label: 'EU', flag: '🇪🇺' },
    { value: 'in', label: 'IN', flag: '🇮🇳' },
  ];

  ngOnInit(): void {
    this.loadExistingCredentials();
  }

  private loadExistingCredentials(): void {
    try {
      const raw = localStorage.getItem(CREDENTIALS_KEY);
      if (raw) {
        const credentials = JSON.parse(raw);
        this.appId = credentials.appId || '';
        this.region = credentials.region || 'us';
        this.authKey = credentials.authKey || '';
      } else {
        this.appId = '';
        this.region = 'us';
        this.authKey = '';
      }
    } catch {
      this.appId = '';
      this.region = 'us';
      this.authKey = '';
    }
  }

  saveCredentials(): void {
    this.errorMessage.set('');

    if (!this.appId.trim() || !this.region.trim() || !this.authKey.trim()) {
      this.errorMessage.set('All fields are required.');
      return;
    }

    const credentials = {
      appId: this.appId.trim(),
      region: this.region.trim(),
      authKey: this.authKey.trim(),
    };

    localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(credentials));

    // Full page reload to root — main.ts will re-initialize SDK with new credentials,
    // then route guards handle navigation. Avoids stale SDK session issues.
    window.location.href = '/';
  }

  clearCredentials(): void {
    localStorage.removeItem(CREDENTIALS_KEY);
    this.appId = '';
    this.region = 'us';
    this.authKey = '';
    this.errorMessage.set('');
  }
}
