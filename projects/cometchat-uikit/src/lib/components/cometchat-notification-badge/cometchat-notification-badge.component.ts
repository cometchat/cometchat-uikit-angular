import {
  Component,
  Input,
  ChangeDetectionStrategy,
  OnInit,
  OnDestroy,
  signal,
  computed,
  inject,
} from '@angular/core';
import { NotificationUnreadCountService } from '../../services/notification-unread-count.service';
import { NotificationBadgeStyle } from './cometchat-notification-badge.types';
import { TranslatePipe } from '../../resources/CometChatLocalize/translate.pipe';
import { Subscription } from 'rxjs';

/**
 * CometChatNotificationBadge — Displays unread notification count.
 * Subscribes to real-time updates and re-syncs on window focus.
 *
 * Usage:
 * ```html
 * <cometchat-notification-badge [max]="99"></cometchat-notification-badge>
 * ```
 */
@Component({
  selector: 'cometchat-notification-badge',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './cometchat-notification-badge.component.html',
  styleUrls: ['./cometchat-notification-badge.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CometChatNotificationBadgeComponent implements OnInit, OnDestroy {
  private unreadCountService = inject(NotificationUnreadCountService);

  /** Filter count by category */
  @Input() category: string | undefined;

  /** Maximum count to display before showing "N+". Default: 99 */
  @Input() max: number = 99;

  /** Style overrides */
  @Input() style: NotificationBadgeStyle | undefined;

  /** Internal count signal */
  count = signal<number>(0);

  private subscription: Subscription | null = null;

  ngOnInit(): void {
    // Start the unread count service if not already started
    this.unreadCountService.start({ category: this.category });

    // Subscribe to count updates
    this.subscription = this.unreadCountService.count$.subscribe((count) => {
      this.count.set(count);
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    this.unreadCountService.stop();
  }

  /**
   * Display text for the badge (computed signal for performance).
   */
  readonly displayText = computed(() => {
    const c = this.count();
    return c > this.max ? `${this.max}+` : `${c}`;
  });
}
