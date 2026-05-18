import { Injectable, inject, OnDestroy, effect } from '@angular/core';
import { ThemeService as UIKitThemeService } from '@cometchat/chat-uikit-angular';
import { CometChatUIKit } from '@cometchat/chat-uikit-angular';

/**
 * ThemeService (Sample App)
 *
 * Thin wrapper around the UIKit's ThemeService that additionally syncs
 * the resolved theme to `CometChatUIKit.themeMode` so the SDK-level
 * theming stays in sync with the DOM.
 *
 * Consumers should inject this service (not the UIKit one directly) within
 * the sample app so the SDK sync side-effect is always applied.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService implements OnDestroy {
  /** Delegate to the UIKit service for all theme logic */
  private uiKitTheme = inject(UIKitThemeService);

  /** Expose the signal so templates can bind to it */
  readonly currentTheme = this.uiKitTheme.currentTheme;

  private syncEffect = effect(() => {
    CometChatUIKit.themeMode = this.uiKitTheme.currentTheme();
  },{ allowSignalWrites: true});

  ngOnDestroy(): void {
    this.syncEffect.destroy();
  }

  setTheme(theme: 'light' | 'dark'): void {
    this.uiKitTheme.setTheme(theme);
  }

  toggleTheme(): void {
    this.uiKitTheme.toggleTheme();
  }
}
