import {
  Component,
  Input,
  Output,
  EventEmitter,
  TemplateRef,
  ViewChild,
  ElementRef,
  OnInit,
  OnDestroy,
  AfterViewInit,
  OnChanges,
  SimpleChanges,
  signal,
  ChangeDetectorRef,
  inject,
  QueryList,
  ViewChildren,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ListNavigationService } from '../../services/list-navigation.service';
import { LiveAnnouncerService } from '../../services/live-announcer.service';
import { CometChatLocalize } from '../../resources/CometChatLocalize/cometchat-localize';
import {
  isUserInSearchInput,
  focusListItem,
  focusStateContainer,
} from './cometchat-paginated-list.utils';

/**
 * CometChatPaginatedList is a generic, reusable component for infinite scroll lists.
 * Handles pagination, loading states, empty states, and error states.
 * Uses IntersectionObserver for efficient scroll detection.
 */
@Component({
  selector: 'cometchat-paginated-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './cometchat-paginated-list.component.html',
  styleUrls: ['./cometchat-paginated-list.component.css'],
})
export class CometChatPaginatedListComponent<T>
  implements OnInit, OnDestroy, AfterViewInit, OnChanges
{
  private pendingTimers: ReturnType<typeof setTimeout>[] = [];

  private cdr = inject(ChangeDetectorRef);
  private listNavigationService = inject(ListNavigationService);
  private liveAnnouncer = inject(LiveAnnouncerService);

  // ── Data Inputs ──────────────────────────────────────────────────────────
  @Input() items: T[] = [];
  @Input() trackByFn: (index: number, item: T) => any = index => index;

  // ── State Inputs ─────────────────────────────────────────────────────────
  @Input() isLoading = false;
  @Input() hasMore = true;
  @Input() error: Error | null = null;

  // ── Display Inputs ───────────────────────────────────────────────────────
  @Input() showScrollbar = false;
  @Input() loadingThreshold = 100;
  /**
   * When true, uses the viewport as the IntersectionObserver root instead of
   * the list container. Useful when a parent container handles scrolling.
   */
  @Input() observeScrollFromViewport = false;

  // ── Accessibility Inputs ─────────────────────────────────────────────────
  @Input() ariaLabel = '';
  @Input() enableKeyboardNavigation = true;
  @Input() isMultiSelect = false;
  @Input() emptyStateAriaLabel = '';
  @Input() errorStateAriaLabel = '';
  @Input() hideError = false;
  @Input() isItemSelected: (item: T) => boolean = () => false;

  // ── Template Inputs ──────────────────────────────────────────────────────
  @Input() itemTemplate?: TemplateRef<{ $implicit: T; index: number }>;
  @Input() loadingTemplate?: TemplateRef<void>;
  @Input() emptyTemplate?: TemplateRef<void>;
  @Input() errorTemplate?: TemplateRef<{ $implicit: Error }>;
  @Input() loadingMoreTemplate?: TemplateRef<void>;

  // ── Events ───────────────────────────────────────────────────────────────
  @Output() loadMore = new EventEmitter<void>();
  @Output() scrollToTop = new EventEmitter<void>();
  @Output() scrollToBottom = new EventEmitter<void>();
  @Output() itemClick = new EventEmitter<{ item: T; index: number }>();
  @Output() focusedIndexChange = new EventEmitter<number>();
  @Output() retry = new EventEmitter<void>();

  // ── View References ──────────────────────────────────────────────────────
  @ViewChild('listContainer') listContainer?: ElementRef<HTMLElement>;
  @ViewChild('scrollTopAnchor') scrollTopAnchor?: ElementRef<HTMLElement>;
  @ViewChild('scrollBottomAnchor') scrollBottomAnchor?: ElementRef<HTMLElement>;
  @ViewChildren('listItem') listItemElements?: QueryList<ElementRef<HTMLElement>>;
  @ViewChild('emptyStateContainer') emptyStateContainer?: ElementRef<HTMLElement>;
  @ViewChild('errorStateContainer') errorStateContainer?: ElementRef<HTMLElement>;

  // ── Internal State ───────────────────────────────────────────────────────
  isFetchingMore = signal(false);
  focusedIndex = signal(0);

  // ── Computed State ───────────────────────────────────────────────────────
  isEmpty(): boolean { return !this.isLoading && this.items.length === 0; }
  hasItems(): boolean { return this.items.length > 0; }
  showLoadingMore(): boolean { return this.isFetchingMore() && this.hasItems(); }

  // ── Private Properties ───────────────────────────────────────────────────
  private scrollTopObserver?: IntersectionObserver;
  private scrollBottomObserver?: IntersectionObserver;
  private previousIsLoading = false;
  private previousItemsLength = 0;
  private previousError: Error | null = null;
  private initialFocusSet = false;

  // ── Lifecycle ────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.previousIsLoading = this.isLoading;
    this.previousItemsLength = this.items.length;
    this.previousError = this.error;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isLoading']) {
      const wasLoading = this.previousIsLoading;
      const isNowLoading = this.isLoading;
      if (wasLoading && !isNowLoading && !this.initialFocusSet) {
        this.handleLoadingToLoadedTransition();
      }
      this.previousIsLoading = isNowLoading;
    }

    if (changes['items']) {
      const previousLength = this.previousItemsLength;
      const currentLength = this.items.length;

      if (currentLength > previousLength && previousLength > 0) {
        this.handleInfiniteScrollLoad(currentLength - previousLength);
      }
      if (currentLength === 0 && previousLength > 0 && !this.error) {
        this.focusEmptyState();
      }
      if (currentLength > 0 && previousLength === 0 && !this.isLoading) {
        if (this.initialFocusSet) {
          this.focusFirstItem();
        } else {
          this.focusFirstItemWithoutScroll();
          this.initialFocusSet = true;
        }
      }
      this.previousItemsLength = currentLength;
    }

    if (changes['error']) {
      const hadError = this.previousError !== null;
      const hasError = this.error !== null;
      if (!hadError && hasError) { this.focusErrorState(); }
      if (hadError && !hasError && this.items.length > 0) { this.focusFirstItem(); }
      this.previousError = this.error;
    }
  }

  ngAfterViewInit(): void {
    this.setupIntersectionObservers();
  }

  ngOnDestroy(): void {
    this.pendingTimers.forEach(t => clearTimeout(t));
    this.pendingTimers = [];
    this.disconnectObservers();
  }

  // ── IntersectionObserver ─────────────────────────────────────────────────

  private setupIntersectionObservers(): void {
    if (this.scrollBottomAnchor?.nativeElement) {
      this.scrollBottomObserver = new IntersectionObserver(
        entries => {
          if (entries[0].isIntersecting && this.hasMore && !this.isFetchingMore()) {
            if (
              !this.observeScrollFromViewport &&
              this.listContainer?.nativeElement &&
              this.listContainer.nativeElement.scrollHeight <=
                this.listContainer.nativeElement.clientHeight
            ) {
              return;
            }
            this.handleLoadMore();
          }
        },
        {
          root: this.observeScrollFromViewport ? null : this.listContainer?.nativeElement,
          threshold: 0.1,
        }
      );
      this.scrollBottomObserver.observe(this.scrollBottomAnchor.nativeElement);
    }

    if (this.scrollTopAnchor?.nativeElement) {
      this.scrollTopObserver = new IntersectionObserver(
        entries => {
          if (entries[0].isIntersecting) { this.scrollToTop.emit(); }
        },
        {
          root: this.observeScrollFromViewport ? null : this.listContainer?.nativeElement,
          threshold: 0.1,
        }
      );
      this.scrollTopObserver.observe(this.scrollTopAnchor.nativeElement);
    }
  }

  private handleLoadMore(): void {
    this.isFetchingMore.set(true);
    this.announceLoadingMore();
    this.cdr.detectChanges();
    this.loadMore.emit();
  }

  private disconnectObservers(): void {
    this.scrollTopObserver?.disconnect();
    this.scrollBottomObserver?.disconnect();
  }

  // ── Public Methods ───────────────────────────────────────────────────────

  handleItemClick(item: T, index: number): void {
    this.itemClick.emit({ item, index });
  }

  loadComplete(): void {
    this.isFetchingMore.set(false);
    this.cdr.detectChanges();
  }

  scrollToTopPosition(): void {
    if (this.listContainer?.nativeElement) {
      this.listContainer.nativeElement.scrollTop = 0;
    }
  }

  scrollToBottomPosition(): void {
    if (this.listContainer?.nativeElement) {
      const container = this.listContainer.nativeElement;
      container.scrollTop = container.scrollHeight;
    }
  }

  // ── Keyboard Navigation ──────────────────────────────────────────────────

  onListKeyDown(event: KeyboardEvent): void {
    if (!this.enableKeyboardNavigation || !this.hasItems()) return;

    const newIndex = this.listNavigationService.handleKeyNavigation(event, this.focusedIndex(), {
      itemCount: this.items.length,
      wrap: false,
    });

    if (newIndex !== -1 && newIndex !== this.focusedIndex()) {
      this.setFocusedIndex(newIndex);
      if (newIndex === this.items.length - 1 && this.hasMore && !this.isFetchingMore()) {
        this.handleLoadMore();
      }
    }
  }

  setFocusedIndex(index: number): void {
    const clampedIndex = Math.max(0, Math.min(index, this.items.length - 1));
    if (clampedIndex !== this.focusedIndex()) {
      this.focusedIndex.set(clampedIndex);
      this.focusedIndexChange.emit(clampedIndex);
    }
    this.scrollItemIntoView(clampedIndex);
  }

  getItemTabIndex(index: number): number {
    return this.listNavigationService.getItemTabIndex(index, this.focusedIndex());
  }

  onItemFocus(index: number): void {
    if (index !== this.focusedIndex()) {
      this.focusedIndex.set(index);
      this.focusedIndexChange.emit(index);
    }
  }

  onRetry(): void {
    this.retry.emit();
  }

  // ── Focus Management ─────────────────────────────────────────────────────

  handleItemDeleted(deletedIndex: number): void {
    const currentFocused = this.focusedIndex();
    if (this.items.length === 0) { this.focusedIndex.set(0); return; }
    if (deletedIndex === currentFocused) {
      const newIndex = deletedIndex < this.items.length ? deletedIndex : deletedIndex - 1;
      if (newIndex >= 0) { this.setFocusedIndex(newIndex); }
    } else if (deletedIndex < currentFocused) {
      this.focusedIndex.set(currentFocused - 1);
    }
  }

  private handleLoadingToLoadedTransition(): void {
    this.pendingTimers.push(setTimeout(() => {
      if (this.error) {
        this.focusErrorState();
      } else if (this.items.length === 0) {
        this.focusEmptyState();
      } else {
        this.focusFirstItemWithoutScroll();
      }
      this.initialFocusSet = true;
    }, 0));
  }

  private handleInfiniteScrollLoad(newItemsCount: number): void {
    if (newItemsCount > 0) { this.announceItemsLoaded(newItemsCount); }
  }

  focusFirstItem(): void {
    if (this.items.length > 0) { this.setFocusedIndex(0); }
  }

  private focusFirstItemWithoutScroll(): void {
    if (this.items.length > 0) {
      this.focusedIndex.set(0);
      this.focusedIndexChange.emit(0);
      this.pendingTimers.push(setTimeout(() => {
        if (isUserInSearchInput()) return;
        focusListItem(0, this.listItemElements, false, this.initialFocusSet);
      }, 0));
    }
  }

  focusEmptyState(): void {
    this.pendingTimers.push(setTimeout(() => {
      if (isUserInSearchInput()) { this.focusedIndexChange.emit(-1); return; }
      focusStateContainer(this.emptyStateContainer);
      this.focusedIndexChange.emit(-1);
    }, 0));
  }

  focusErrorState(): void {
    this.pendingTimers.push(setTimeout(() => {
      if (isUserInSearchInput()) { this.focusedIndexChange.emit(-1); return; }
      focusStateContainer(this.errorStateContainer);
      this.focusedIndexChange.emit(-1);
    }, 0));
  }

  private scrollItemIntoView(index: number): void {
    this.pendingTimers.push(setTimeout(() => {
      if (isUserInSearchInput()) return;
      focusListItem(index, this.listItemElements, true, this.initialFocusSet);
    }, 0));
  }

  // ── Live Announcements ───────────────────────────────────────────────────

  private announceLoadingMore(): void {
    this.liveAnnouncer.announce(
      CometChatLocalize.getLocalizedString('accessibility_loading_more_items'),
      'polite'
    );
  }

  announceItemsLoaded(count: number): void {
    const message = CometChatLocalize.getLocalizedString('accessibility_items_loaded').replace(
      '{count}',
      count.toString()
    );
    this.liveAnnouncer.announce(message, 'polite');
  }

  announceAllItemsLoaded(): void {
    this.liveAnnouncer.announce(
      CometChatLocalize.getLocalizedString('accessibility_all_items_loaded'),
      'polite'
    );
  }

  announceLoadError(): void {
    this.liveAnnouncer.announceError(
      CometChatLocalize.getLocalizedString('accessibility_load_failed')
    );
  }
}
