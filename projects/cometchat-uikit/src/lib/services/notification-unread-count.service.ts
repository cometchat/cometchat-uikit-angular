import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CometChat } from '@cometchat/chat-sdk-javascript';

export interface NotificationUnreadCountOptions {
  /** Filter count by category */
  category?: string;
  /** Polling interval in ms. Default: 30000 */
  pollingInterval?: number;
}

/**
 * NotificationUnreadCountService
 *
 * Injectable Angular service for consuming notification feed unread count.
 * Provides real-time updates via BehaviorSubject, polling, and WebSocket listener.
 *
 * Angular equivalent of React's useNotificationUnreadCount hook.
 *
 * NOTE: When used alongside CometChatNotificationFeedComponent, both register
 * separate NotificationFeedListeners. The ViewModel handles feed item insertion,
 * while this service handles badge count. Both optimistically update on
 * onFeedItemReceived — the badge may briefly over-count by 1 until the next
 * polling re-fetch corrects it (within 1 second). This is by design to avoid
 * tight coupling between the badge and the feed component.
 *
 * @Injectable providedIn: 'root'
 */
@Injectable({
  providedIn: 'root',
})
export class NotificationUnreadCountService implements OnDestroy {
  /** Current unread count */
  readonly count$ = new BehaviorSubject<number>(0);

  /** Whether the initial fetch is in progress */
  readonly isLoading$ = new BehaviorSubject<boolean>(true);

  private pollingInterval: ReturnType<typeof setInterval> | null = null;
  private listenerId: string = `unread_count_service_${Date.now()}`;
  private isFetching = false;
  private isStarted = false;
  private focusHandler: (() => void) | null = null;

  /**
   * Start tracking unread count.
   * Fetches initial count, registers WebSocket listener, and starts polling.
   */
  start(options?: NotificationUnreadCountOptions): void {
    if (this.isStarted) return;
    this.isStarted = true;

    // Initial fetch
    this.fetchCount();

    // Start polling
    const intervalMs = options?.pollingInterval ?? 30000;
    this.pollingInterval = setInterval(() => {
      this.fetchCount();
    }, intervalMs);

    // Register real-time listener
    this.registerListener();

    // Listen for window focus to re-sync
    this.focusHandler = () => this.fetchCount();
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', this.focusHandler);
    }
  }

  /**
   * Stop tracking unread count.
   * Removes listener, clears polling, removes focus handler.
   */
  stop(): void {
    if (!this.isStarted) return;
    this.isStarted = false;

    this.stopPolling();
    this.removeListener();

    if (this.focusHandler && typeof window !== 'undefined') {
      window.removeEventListener('focus', this.focusHandler);
      this.focusHandler = null;
    }
  }

  /**
   * Manually refresh the unread count.
   */
  async refresh(): Promise<void> {
    await this.fetchCount();
  }

  ngOnDestroy(): void {
    this.stop();
  }

  // --- Private ---

  private async fetchCount(): Promise<void> {
    if (this.isFetching) return;
    this.isFetching = true;

    try {
      const result = await CometChat.getNotificationFeedUnreadCount();
      const newCount = typeof result === 'number' ? result : result?.count ?? 0;
      this.count$.next(newCount);
      this.isLoading$.next(false);
    } catch (error: any) {
      if (error?.code !== 'ERR_BAD_REQUEST') {
        console.warn('[NotificationUnreadCountService] Failed to fetch count:', error);
      }
    } finally {
      this.isFetching = false;
    }
  }

  private registerListener(): void {
    try {
      CometChat.addNotificationFeedListener(this.listenerId, {
        onFeedItemReceived: () => {
          // Optimistically increment
          this.count$.next(this.count$.value + 1);
          // Re-fetch for accuracy after short debounce
          setTimeout(() => this.fetchCount(), 1000);
        },
      });
    } catch (error) {
      console.warn('[NotificationUnreadCountService] Failed to register listener:', error);
    }
  }

  private removeListener(): void {
    try {
      CometChat.removeNotificationFeedListener(this.listenerId);
    } catch (error) {
      // Ignore cleanup errors
    }
  }

  private stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }
}
