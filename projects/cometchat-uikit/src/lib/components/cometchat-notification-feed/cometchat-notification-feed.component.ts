import {
  Component,
  Input,
  Output,
  EventEmitter,
  TemplateRef,
  ChangeDetectionStrategy,
  OnInit,
  OnDestroy,
  signal,
  ElementRef,
  ViewChild,
  NgZone,
  ChangeDetectorRef,
  inject,
  booleanAttribute,
  AfterViewInit,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { NotificationFeedViewModel } from './cometchat-notification-feed-view-model';
import { VisibilityTracker } from './cometchat-notification-feed.utils';
import {
  NotificationFeedItem,
  NotificationFeedState,
  NotificationCategory,
  TimestampGroup,
  CometChatNotificationFeedStyle,
} from './cometchat-notification-feed.types';
import { BadgeCountPipe, CardJsonPipe, CategoryUnreadCountPipe } from './cometchat-notification-feed.pipes';
import { CometChatDateComponent } from '../base-elements/cometchat-date/cometchat-date.component';
import { TranslatePipe } from '../../resources/CometChatLocalize/translate.pipe';
import { CometChatLocalize } from '../../resources/CometChatLocalize/cometchat-localize';
import { CometChatCardViewComponent } from '@cometchat/cards-angular';
import type { CometChatCardAction, CometChatCardActionEvent } from '@cometchat/cards-angular';

/**
 * CometChatNotificationFeed — Main notification feed component.
 * Displays campaign/promotional notifications in a scrollable list with
 * card rendering, real-time updates, and engagement reporting.
 */
@Component({
  selector: 'cometchat-notification-feed',
  standalone: true,
  imports: [NgTemplateOutlet, CometChatDateComponent, TranslatePipe, CometChatCardViewComponent, BadgeCountPipe, CardJsonPipe, CategoryUnreadCountPipe],
  templateUrl: './cometchat-notification-feed.component.html',
  styleUrls: ['./cometchat-notification-feed.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CometChatNotificationFeedComponent implements OnInit, OnDestroy, AfterViewInit {
  private ngZone = inject(NgZone);
  private cdr = inject(ChangeDetectorRef);

  // --- Inputs ---

  /** Title displayed in the header. Default: localized 'notifications_title' */
  @Input() title: string = '';

  /** Whether to show the header. Default: true */
  @Input({ transform: booleanAttribute }) showHeader: boolean = true;

  /** Whether to show the back button. Default: false */
  @Input({ transform: booleanAttribute }) showBackButton: boolean = false;

  /** Whether to show filter chips. Default: true */
  @Input({ transform: booleanAttribute }) showFilterChips: boolean = true;

  /** Deep link: scroll to a specific item by ID */
  @Input() scrollToItemId: string | undefined;

  /** Custom request builder for fetching feed items */
  @Input() notificationFeedRequestBuilder: any;

  /** Custom request builder for fetching categories */
  @Input() notificationCategoriesRequestBuilder: any;

  /** Custom header template */
  @Input() headerView: TemplateRef<any> | undefined;

  /** Custom empty state template */
  @Input() emptyStateView: TemplateRef<any> | undefined;

  /** Custom error state template */
  @Input() errorStateView: TemplateRef<any> | undefined;

  /** Custom loading state template */
  @Input() loadingStateView: TemplateRef<any> | undefined;

  /** Style customization */
  @Input() style: CometChatNotificationFeedStyle | undefined;

  /** Card theme mode forwarded to @cometchat/cards-angular */
  @Input() cardThemeMode: 'auto' | 'light' | 'dark' = 'auto';

  /** Card theme override forwarded to @cometchat/cards-angular */
  @Input() cardThemeOverride: Record<string, any> | undefined;

  // --- Outputs ---

  /** Emitted when a feed item is clicked */
  @Output() itemClick = new EventEmitter<NotificationFeedItem>();

  /** Emitted when a card action button is clicked */
  @Output() actionClick = new EventEmitter<{
    item: NotificationFeedItem;
    action: CometChatCardAction;
  }>();

  /** Emitted when an error occurs */
  @Output() error = new EventEmitter<CometChat.CometChatException>();

  /** Emitted when back button is pressed */
  @Output() backClick = new EventEmitter<void>();

  // --- Internal State ---

  @ViewChild('contentRef', { static: false }) contentRef!: ElementRef<HTMLDivElement>;

  state = signal<NotificationFeedState>({
    items: [],
    groupedItems: [],
    categories: [],
    activeCategory: null,
    totalUnreadCount: 0,
    categoryUnreadCounts: new Map(),
    screenState: 'loading',
    isLoadingMore: false,
    isRefreshing: false,
    isOffline: false,
    error: null,
    hasMorePages: true,
    paginationError: false,
  });

  private viewModel: NotificationFeedViewModel | null = null;
  private visibilityTracker: VisibilityTracker | null = null;
  private observedItemIds: Set<string> = new Set();

  // --- Lifecycle ---

  ngOnInit(): void {
    this.viewModel = new NotificationFeedViewModel(
      (newState) => {
        this.ngZone.run(() => {
          this.state.set({ ...newState });
          if (newState.error) {
            this.error.emit(newState.error);
          }
          this.cdr.markForCheck();
        });
      },
      this.notificationFeedRequestBuilder,
      this.notificationCategoriesRequestBuilder
    );

    this.viewModel.init();
  }

  ngAfterViewInit(): void {
    this.initVisibilityTracker();

    // Handle scrollToItemId
    if (this.scrollToItemId) {
      this.scrollToItem(this.scrollToItemId);
    }
  }

  ngOnDestroy(): void {
    this.viewModel?.dispose();
    this.visibilityTracker?.dispose();
  }

  // --- Visibility Tracking ---

  private initVisibilityTracker(): void {
    this.visibilityTracker = new VisibilityTracker(
      (item) => this.viewModel?.reportViewed(item),
      (item) => this.viewModel?.reportRead(item)
    );

    const contentEl = this.contentRef?.nativeElement || null;
    this.visibilityTracker.init(contentEl);
  }

  /**
   * Called by the template to observe each feed item element.
   * Tracks observed items to avoid redundant IntersectionObserver.observe() calls.
   * Returns null for use in [attr.data-observe] binding.
   */
  observeItem(element: HTMLElement, item: NotificationFeedItem): null {
    const itemId = item.getId();
    if (element && this.visibilityTracker && !this.observedItemIds.has(itemId)) {
      this.observedItemIds.add(itemId);
      this.visibilityTracker.observe(element, item);
    }
    return null;
  }

  // --- Event Handlers ---

  onScroll(event: Event): void {
    const target = event.target as HTMLElement;
    const threshold = 100;
    const isNearBottom =
      target.scrollHeight - target.scrollTop - target.clientHeight < threshold;

    const currentState = this.state();
    if (isNearBottom && !currentState.isLoadingMore && currentState.hasMorePages) {
      this.viewModel?.fetchNextPage();
    }
  }

  onItemClick(item: NotificationFeedItem): void {
    this.viewModel?.reportClicked(item);
    this.itemClick.emit(item);
  }

  onCardAction(item: NotificationFeedItem, event: CometChatCardActionEvent): void {
    this.viewModel?.reportInteracted(item);
    // Unwrap the renderer event — consumers expect the bare action, matching the
    // card bubble and the ccCardActionClicked bus.
    this.actionClick.emit({ item, action: event?.action });
  }

  onChipClick(category: string | null): void {
    // Reset visibility tracker to prevent memory leak on category switch
    this.visibilityTracker?.reset();
    this.observedItemIds.clear();
    this.viewModel?.switchCategory(category);
  }

  onRetry(): void {
    this.viewModel?.refresh();
  }

  onRetryPagination(): void {
    this.viewModel?.retryPagination();
  }

  onBackClick(): void {
    this.backClick.emit();
  }

  // --- Helpers ---

  private scrollToItem(itemId: string): void {
    setTimeout(() => {
      const element = this.contentRef?.nativeElement?.querySelector(
        `[data-feed-item-id="${itemId}"]`
      );
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 500);
  }

  /**
   * TrackBy function for grouped items.
   */
  trackByGroup(index: number, group: TimestampGroup): string {
    return group.label;
  }

  /**
   * TrackBy function for feed items.
   */
  trackByItem(index: number, item: NotificationFeedItem): string {
    return item.getId();
  }

  /**
   * TrackBy function for categories.
   */
  trackByCategory(index: number, cat: NotificationCategory): string {
    return cat.id;
  }

  /**
   * Get the card content as a JSON string for the cards renderer.
   */
  getCardJson(item: NotificationFeedItem): string {
    try {
      const content = item.getContent();
      return typeof content === 'string' ? content : JSON.stringify(content);
    } catch {
      return '';
    }
  }

  /**
   * Get fallback text for card content.
   * Extracts readable text from the card JSON when @cometchat/cards-angular is not available.
   */
  getFallbackText(item: NotificationFeedItem): string {
    try {
      const content = item.getContent();
      if (!content) return CometChatLocalize.getLocalizedString('notifications_card_fallback');

      const data = typeof content === 'string' ? JSON.parse(content) : content;

      // Try to extract title/body from common card schema patterns
      if (data.title) return data.title;
      if (data.body?.text) return data.body.text;
      if (data.header?.title) return data.header.title;
      if (data.fallbackText) return data.fallbackText;

      // Try nested body array (Card_Schema format)
      if (Array.isArray(data.body)) {
        for (const block of data.body) {
          if (block.text) return block.text;
          if (block.type === 'TextBlock' && block.text) return block.text;
        }
      }

      return CometChatLocalize.getLocalizedString('notifications_card_fallback');
    } catch {
      return CometChatLocalize.getLocalizedString('notifications_card_fallback');
    }
  }

  /**
   * Get category unread count.
   */
  getCategoryUnreadCount(categoryId: string): number {
    return this.state().categoryUnreadCounts.get(categoryId) || 0;
  }

  /**
   * Format badge count with 99+ cap.
   */
  formatBadgeCount(count: number): string {
    return count > 99 ? '99+' : `${count}`;
  }
}
