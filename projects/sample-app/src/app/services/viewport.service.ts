import { Injectable, signal, OnDestroy } from '@angular/core';

/**
 * ViewportService
 *
 * Tracks the visual viewport height using the VisualViewport API.
 * On mobile browsers (especially Chrome on Android), the keyboard
 * doesn't resize `position: fixed` elements or change `dvh` units.
 * This service provides the actual visible height so the layout
 * can shrink to fit above the keyboard.
 */
@Injectable({ providedIn: 'root' })
export class ViewportService implements OnDestroy {
  /** The current visual viewport height in pixels */
  viewportHeight = signal<number>(window.visualViewport?.height ?? window.innerHeight);

  private onResize = () => {
    const height = window.visualViewport?.height ?? window.innerHeight;
    this.viewportHeight.set(height);
  };

  constructor() {
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', this.onResize);
    }
  }

  ngOnDestroy(): void {
    if (window.visualViewport) {
      window.visualViewport.removeEventListener('resize', this.onResize);
    }
  }
}
