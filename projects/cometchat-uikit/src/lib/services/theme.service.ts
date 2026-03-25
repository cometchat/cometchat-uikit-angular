import { Injectable, OnDestroy, inject, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';

/**
 * ThemeService
 *
 * Manages light/dark theme for the CometChat Angular UIKit.
 *
 * ## Features
 * - Respects `prefers-color-scheme` OS preference on first load
 * - Persists user choice to `localStorage`
 * - Applies `data-theme` attribute to `<html>` via Angular's `DOCUMENT` token (SSR-safe)
 * - Exposes a reactive `currentTheme` signal for template bindings
 * - Cleans up the `matchMedia` listener on destroy
 *
 * ## Usage
 *
 * ### Inject and toggle
 * ```typescript
 * export class AppComponent {
 *   themeService = inject(ThemeService);
 *
 *   toggle() {
 *     const next = this.themeService.currentTheme() === 'dark' ? 'light' : 'dark';
 *     this.themeService.setTheme(next);
 *   }
 * }
 * ```
 *
 * ### Template binding
 * ```html
 * <button (click)="toggle()">
 *   {{ themeService.currentTheme() === 'dark' ? 'Light mode' : 'Dark mode' }}
 * </button>
 * ```
 *
 * ### Initialize from preference on app start
 * ```typescript
 * // app.component.ts
 * export class AppComponent {
 *   constructor() {
 *     inject(ThemeService).initFromPreference();
 *   }
 * }
 * ```
 *
 * @Injectable providedIn: 'root'

 */
@Injectable({ providedIn: 'root' })
export class ThemeService implements OnDestroy {
  private readonly doc = inject(DOCUMENT);

  /** Reactive signal reflecting the currently applied theme. */
  readonly currentTheme = signal<'light' | 'dark'>('light');

  private mediaQuery: MediaQueryList | null = null;
  private readonly onSystemChange = (e: MediaQueryListEvent): void => {
    // Only follow system changes if the user has not set a manual preference
      this.applyTheme(e.matches ? 'dark' : 'light');
    
  };

  constructor() {
    this.initFromPreference();
    // Wire up system preference listener (SSR guard: window may not exist)
    if (typeof window !== 'undefined') {
      this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      this.mediaQuery.addEventListener('change', this.onSystemChange);
    }
  }

  ngOnDestroy(): void {
    this.mediaQuery?.removeEventListener('change', this.onSystemChange);
  }

  /**
   * Resolves and applies the theme on startup.
   *
   * Priority:
   * 1. Stored user preference (`localStorage`)
   * 2. OS `prefers-color-scheme`
   * 3. Fallback: `'light'`
   */
  initFromPreference(): void {
    const prefersDark =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.applyTheme(prefersDark ? 'dark' : 'light');
  }

  /**
   * Explicitly sets the theme and persists the choice to `localStorage`.
   *
   * @param theme - `'light'` or `'dark'`
   */
  setTheme(theme: 'light' | 'dark'): void {
    this.applyTheme(theme);
  }

  /**
   * Toggles between light and dark, persisting the result.
   */
  toggleTheme(): void {
    this.setTheme(this.currentTheme() === 'dark' ? 'light' : 'dark');
  }

 

  // ── Private helpers ──

  private applyTheme(theme: 'light' | 'dark'): void {
    this.currentTheme.set(theme);
    // DOCUMENT injection is SSR-safe; documentElement is always available
    this.doc.documentElement.setAttribute('data-theme', theme);
  }

}
