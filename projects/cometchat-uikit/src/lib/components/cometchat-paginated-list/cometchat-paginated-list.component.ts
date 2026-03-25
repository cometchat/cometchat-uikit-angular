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
  ViewChildren, ChangeDetectionStrategy} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ListNavigationService } from '../../services/list-navigation.service';
import { LiveAnnouncerService } from '../../services/live-announcer.service';
import { CometChatLocalize } from '../../resources/CometChatLocalize/cometchat-localize';

/**
 * CometChatPaginatedList is a generic, reusable component for infinite scroll lists.
 * It handles pagination, loading states, empty states, and error states.
 * Uses IntersectionObserver for efficient scroll detection.
 *
 * @example
 * ```html
 * <cometchat-paginated-list
 *   [items]="conversations"
 *   [trackByFn]="trackByConversationId"
 *   [isLoading]="isLoading"
 *   [hasMore]="hasMore"
 *   [itemTemplate]="itemTemplate"
 *   (loadMore)="onLoadMore()">
 * </cometchat-paginated-list>
 * ```
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
  /** @internal Timer references for cleanup */
  private pendingTimers: ReturnType<typeof setTimeout>[] = [];

  // ============================================
  // Injected Services
  // ============================================
  private cdr = inject(ChangeDetectorRef);
  private listNavigationService = inject(ListNavigationService);
  private liveAnnouncer = inject(LiveAnnouncerService);

  // ============================================
  // Data Inputs
  // ============================================

  /** Array of items to display in the list */
  @Input() items: T[] = [];

  /** Function to track items for efficient rendering */
  @Input() trackByFn: (index: number, item: T) => any = index => index;

  // ============================================
  // State Inputs
  // ============================================

  /** Whether the list is currently loading initial data */
  @Input() isLoading = false;

  /** Whether there are more items to load */
  @Input() hasMore = true;

  /** Error object if an error occurred */
  @Input() error: Error | null = null;

  // ============================================
  // Display Inputs
  // ============================================

  /** Whether to show the scrollbar */
  @Input() showScrollbar = false;

  /** Distance from bottom (in pixels) to trigger load more */
  @Input() loadingThreshold = 100;

  // ============================================
  // Accessibility Inputs
  // ============================================

  /** ARIA label for the list container */
  @Input() ariaLabel = '';

  /** Whether keyboard navigation is enabled */
  @Input() enableKeyboardNavigation = true;

  /** Whether the list supports multiple selection */
  @Input() isMultiSelect = false;

  /** ARIA label for empty state */
  @Input() emptyStateAriaLabel = '';

  /** ARIA label for error state */
  @Input() errorStateAriaLabel = '';

  /** Whether to hide the error state */
  @Input() hideError = false;

  /** Function to check if an item is selected */
  @Input() isItemSelected: (item: T) => boolean = () => false;

  // ============================================
  // Template Inputs
  // ============================================

  /** Template for rendering each item */
  @Input() itemTemplate?: TemplateRef<{ $implicit: T; index: number }>;

  /** Template for initial loading state */
  @Input() loadingTemplate?: TemplateRef<void>;

  /** Template for empty state (no items) */
  @Input() emptyTemplate?: TemplateRef<void>;

  /** Template for error state */
  @Input() errorTemplate?: TemplateRef<{ $implicit: Error }>;

  /** Template for loading more indicator */
  @Input() loadingMoreTemplate?: TemplateRef<void>;

  // ============================================
  // Events
  // ============================================

  /** Emitted when more items should be loaded */
  @Output() loadMore = new EventEmitter<void>();

  /** Emitted when the list is scrolled to the top */
  @Output() scrollToTop = new EventEmitter<void>();

  /** Emitted when the list is scrolled to the bottom */
  @Output() scrollToBottom = new EventEmitter<void>();

  /** Emitted when an item is clicked */
  @Output() itemClick = new EventEmitter<{ item: T; index: number }>();

  /** Emitted when the focused index changes */
  @Output() focusedIndexChange = new EventEmitter<number>();

  /** Emitted when retry is triggered from error state */
  @Output() retry = new EventEmitter<void>();

  // ============================================
  // View References
  // ============================================

  /** Reference to the list container element */
  @ViewChild('listContainer') listContainer?: ElementRef<HTMLElement>;

  /** Reference to the scroll top anchor element */
  @ViewChild('scrollTopAnchor') scrollTopAnchor?: ElementRef<HTMLElement>;

  /** Reference to the scroll bottom anchor element */
  @ViewChild('scrollBottomAnchor') scrollBottomAnchor?: ElementRef<HTMLElement>;

  /** Reference to list item elements for focus management */
  @ViewChildren('listItem') listItemElements?: QueryList<ElementRef<HTMLElement>>;

  /** Reference to empty state container for focus management */
  @ViewChild('emptyStateContainer') emptyStateContainer?: ElementRef<HTMLElement>;

  /** Reference to error state container for focus management */
  @ViewChild('errorStateContainer') errorStateContainer?: ElementRef<HTMLElement>;

  // ============================================
  // Internal State (Signals)
  // ============================================

  /** Whether the component is currently fetching more items */
  isFetchingMore = signal(false);

  /** Currently focused item index for roving tabindex pattern */
  focusedIndex = signal(0);

  // ============================================
  // Computed State
  // ============================================

  /** Whether the list is empty (not loading and no items) */
  isEmpty(): boolean {
    return !this.isLoading && this.items.length === 0;
  }

  /** Whether the list has items */
  hasItems(): boolean {
    return this.items.length > 0;
  }

  /** Whether to show the loading more indicator */
  showLoadingMore(): boolean {
    return this.isFetchingMore() && this.hasItems();
  }

  // ============================================
  // Private Properties
  // ============================================

  /** IntersectionObserver for detecting scroll to top */
  private scrollTopObserver?: IntersectionObserver;

  /** IntersectionObserver for detecting scroll to bottom */
  private scrollBottomObserver?: IntersectionObserver;

  /** Previous loading state for detecting loading → loaded transition */
  private previousIsLoading = false;

  /** Previous items length for detecting empty → populated transition */
  private previousItemsLength = 0;

  /** Previous error state for detecting error state changes */
  private previousError: Error | null = null;

  /** Flag to track if initial focus has been set */
  private initialFocusSet = false;

  // ============================================
  // Lifecycle Hooks
  // ============================================

  ngOnInit(): void {
    // Component initialization - observers are set up in ngAfterViewInit
    // when ViewChild references are available
    // Initialize previous state tracking
    this.previousIsLoading = this.isLoading;
    this.previousItemsLength = this.items.length;
    this.previousError = this.error;
  }

  /**
   * Handles input changes to manage focus during state transitions.
   * Implements Requirements 2.1-2.5 for focus management.
   *
   * @param changes - The changes object containing previous and current values
   */
  ngOnChanges(changes: SimpleChanges): void {
    // Handle loading → loaded transition (Requirement 2.3)
    if (changes['isLoading']) {
      const wasLoading = this.previousIsLoading;
      const isNowLoading = this.isLoading;

      // Transition from loading to loaded
      if (wasLoading && !isNowLoading && !this.initialFocusSet) {
        this.handleLoadingToLoadedTransition();
      }

      this.previousIsLoading = isNowLoading;
    }

    // Handle items changes for focus management
    if (changes['items']) {
      const previousLength = this.previousItemsLength;
      const currentLength = this.items.length;

      // Requirement 2.1: Maintain focus on currently focused item during infinite scroll
      // When items are added (not replaced), maintain the current focus
      if (currentLength > previousLength && previousLength > 0) {
        // Items were added via infinite scroll - focus is maintained automatically
        // since we're using index-based focus and items are appended
        this.handleInfiniteScrollLoad(currentLength - previousLength);
      }

      // Requirement 2.4: Focus empty state when list becomes empty
      if (currentLength === 0 && previousLength > 0 && !this.error) {
        this.focusEmptyState();
      }

      // Requirement 2.6 (partial): Focus first item when list transitions from empty to populated
      // Skip scrolling on initial load to prevent page-level scroll jumps in Storybook
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

    // Handle error state changes (Requirement 2.5)
    if (changes['error']) {
      const hadError = this.previousError !== null;
      const hasError = this.error !== null;

      // Transition to error state
      if (!hadError && hasError) {
        this.focusErrorState();
      }

      // Transition from error to populated (Requirement 2.6 partial)
      if (hadError && !hasError && this.items.length > 0) {
        this.focusFirstItem();
      }

      this.previousError = this.error;
    }
  }

  ngAfterViewInit(): void {
    // Set up IntersectionObservers after view is initialized
    // This ensures ViewChild references are available
    this.setupIntersectionObservers();
  }

  ngOnDestroy(): void {
    this.pendingTimers.forEach(t => clearTimeout(t));
    this.pendingTimers = [];
    // Clean up observers to prevent memory leaks
    this.disconnectObservers();
  }

  // ============================================
  // Private Methods - IntersectionObserver
  // ============================================

  /**
   * Sets up IntersectionObservers for scroll detection.
   * Uses IntersectionObserver API for efficient scroll detection
   * instead of scroll event listeners (per Requirement 12.5).
   *
   * - Bottom observer: Triggers pagination when scrolled near bottom
   * - Top observer: Emits scrollToTop event when scrolled to top
   */
  private setupIntersectionObservers(): void {
    // Setup scroll bottom observer for pagination
    if (this.scrollBottomAnchor?.nativeElement) {
      this.scrollBottomObserver = new IntersectionObserver(
        entries => {
          // Only trigger load more when:
          // 1. The bottom anchor is intersecting (visible)
          // 2. There are more items to load (hasMore is true)
          // 3. We're not already fetching more items
          if (entries[0].isIntersecting && this.hasMore && !this.isFetchingMore()) {
            this.handleLoadMore();
          }
        },
        {
          root: this.listContainer?.nativeElement,
          threshold: 0.1,
        }
      );
      this.scrollBottomObserver.observe(this.scrollBottomAnchor.nativeElement);
    }

    // Setup scroll top observer for scroll-to-top detection
    if (this.scrollTopAnchor?.nativeElement) {
      this.scrollTopObserver = new IntersectionObserver(
        entries => {
          // Emit scrollToTop event when the top anchor becomes visible
          if (entries[0].isIntersecting) {
            this.scrollToTop.emit();
          }
        },
        {
          root: this.listContainer?.nativeElement,
          threshold: 0.1,
        }
      );
      this.scrollTopObserver.observe(this.scrollTopAnchor.nativeElement);
    }
  }

  /**
   * Handles the load more action when user scrolls near the bottom.
   * Sets the fetching state to true, announces loading state, and emits the loadMore event.
   * The parent component should call loadComplete() when done loading.
   *
   * Implements Requirement 14.1: Announce "Loading more items" when infinite scroll triggers.
   */
  private handleLoadMore(): void {
    this.isFetchingMore.set(true);
    // Announce loading state for screen readers (Requirement 14.1)
    this.announceLoadingMore();
    // Trigger change detection since IntersectionObserver runs outside Angular zone
    this.cdr.detectChanges();
    this.loadMore.emit();
  }

  /**
   * Disconnects all IntersectionObservers to prevent memory leaks.
   * Called during component destruction.
   */
  private disconnectObservers(): void {
    this.scrollTopObserver?.disconnect();
    this.scrollBottomObserver?.disconnect();
  }

  // ============================================
  // Public Methods
  // ============================================

  /**
   * Handles item click events.
   * Emits the itemClick event with the clicked item and its index.
   * @param item The clicked item
   * @param index The index of the clicked item
   */
  handleItemClick(item: T, index: number): void {
    this.itemClick.emit({ item, index });
  }

  /**
   * Called by parent component when load operation completes.
   * Resets the fetching state.
   */
  loadComplete(): void {
    this.isFetchingMore.set(false);
    // Trigger change detection to update the view
    this.cdr.detectChanges();
  }

  /**
   * Scrolls the list to the top.
   */
  scrollToTopPosition(): void {
    if (this.listContainer?.nativeElement) {
      this.listContainer.nativeElement.scrollTop = 0;
    }
  }

  /**
   * Scrolls the list to the bottom.
   */
  scrollToBottomPosition(): void {
    if (this.listContainer?.nativeElement) {
      const container = this.listContainer.nativeElement;
      container.scrollTop = container.scrollHeight;
    }
  }

  // ============================================
  // Keyboard Navigation Methods
  // ============================================

  /**
   * Handles keyboard events for list navigation.
   * Implements roving tabindex pattern with ArrowUp/ArrowDown, Home/End keys.
   * Triggers load more when navigating to the last item.
   *
   * @param event - The keyboard event to handle
   */
  onListKeyDown(event: KeyboardEvent): void {
    if (!this.enableKeyboardNavigation || !this.hasItems()) {
      return;
    }

    const newIndex = this.listNavigationService.handleKeyNavigation(event, this.focusedIndex(), {
      itemCount: this.items.length,
      wrap: false, // Don't wrap - trigger load more at end instead
    });

    if (newIndex !== -1 && newIndex !== this.focusedIndex()) {
      this.setFocusedIndex(newIndex);

      // Check if we're at the last item and should load more
      if (newIndex === this.items.length - 1 && this.hasMore && !this.isFetchingMore()) {
        this.handleLoadMore();
      }
    }
  }

  /**
   * Sets the focused index and scrolls the item into view.
   * Emits focusedIndexChange event when the index changes.
   *
   * @param index - The index to focus
   */
  setFocusedIndex(index: number): void {
    // Clamp index to valid range
    const clampedIndex = Math.max(0, Math.min(index, this.items.length - 1));

    if (clampedIndex !== this.focusedIndex()) {
      this.focusedIndex.set(clampedIndex);
      this.focusedIndexChange.emit(clampedIndex);
    }

    // Scroll item into view and focus it
    this.scrollItemIntoView(clampedIndex);
  }

  /**
   * Gets the tabindex for an item based on roving tabindex pattern.
   * Only the focused item has tabindex="0", all others have tabindex="-1".
   *
   * @param index - The item's index
   * @returns 0 if focused, -1 otherwise
   */
  getItemTabIndex(index: number): number {
    return this.listNavigationService.getItemTabIndex(index, this.focusedIndex());
  }

  /**
   * Handles focus event on a list item.
   * Updates the focused index when an item receives focus.
   *
   * @param index - The index of the focused item
   */
  onItemFocus(index: number): void {
    if (index !== this.focusedIndex()) {
      this.focusedIndex.set(index);
      this.focusedIndexChange.emit(index);
    }
  }

  /**
   * Handles retry action from error state.
   * Triggered when user presses Enter on the error state container.
   */
  onRetry(): void {
    this.retry.emit();
  }

  // ============================================
  // Focus Management Methods
  // ============================================

  /**
   * Handles focus management when an item is deleted from the list.
   * Moves focus to the next item, or previous if the last item was deleted.
   *
   * @param deletedIndex - The index of the deleted item
   */
  handleItemDeleted(deletedIndex: number): void {
    const currentFocused = this.focusedIndex();

    if (this.items.length === 0) {
      // List is now empty, focus will go to empty state
      this.focusedIndex.set(0);
      return;
    }

    if (deletedIndex === currentFocused) {
      // Focus next item, or previous if last item was deleted
      const newIndex = deletedIndex < this.items.length ? deletedIndex : deletedIndex - 1;
      if (newIndex >= 0) {
        this.setFocusedIndex(newIndex);
      }
    } else if (deletedIndex < currentFocused) {
      // Adjust focused index since an item before it was removed
      this.focusedIndex.set(currentFocused - 1);
    }
  }

  /**
   * Handles the transition from loading to loaded state.
   * Focuses the first item if items are available, otherwise focuses empty/error state.
   * Implements Requirement 2.3.
   */
  private handleLoadingToLoadedTransition(): void {
    // Use setTimeout to ensure DOM is updated
    this.pendingTimers.push(setTimeout(() => {
      if (this.error) {
        this.focusErrorState();
      } else if (this.items.length === 0) {
        this.focusEmptyState();
      } else {
        // Focus first item without scrolling on initial load
        this.focusFirstItemWithoutScroll();
      }
      this.initialFocusSet = true;
    }, 0));
  }

  /**
   * Handles focus management during infinite scroll load.
   * Maintains focus on the currently focused item.
   * Implements Requirement 2.1.
   *
   * @param newItemsCount - The number of new items loaded
   */
  private handleInfiniteScrollLoad(newItemsCount: number): void {
    // Focus is maintained automatically since we use index-based focus
    // and items are appended to the end of the list.
    // The focusedIndex signal value remains valid.

    // Announce the new items loaded
    if (newItemsCount > 0) {
      this.announceItemsLoaded(newItemsCount);
    }
  }

  /**
   * Focuses the first item in the list.
   * Implements Requirement 2.3 and 2.6 (partial).
   */
  focusFirstItem(): void {
    if (this.items.length > 0) {
      this.setFocusedIndex(0);
    }
  }

  /**
   * Focuses the first item in the list without triggering scrollIntoView.
   * Used during initial load to prevent page-level scroll jumps.
   * Skips focus steal if user is actively typing in a search input.
   * @private
   */
  private focusFirstItemWithoutScroll(): void {
    if (this.items.length > 0) {
      // Update focused index without calling setFocusedIndex (which triggers scroll)
      this.focusedIndex.set(0);
      this.focusedIndexChange.emit(0);

      // Focus the element without scrolling, but only if user isn't in a search input
      this.pendingTimers.push(setTimeout(() => {
        if (this.isUserInSearchInput()) {
          return;
        }
        const itemElements = this.listItemElements?.toArray();
        if (itemElements && itemElements[0]) {
          itemElements[0].nativeElement.focus({ preventScroll: true });
        }
      }, 0));
    }
  }

  /**
   * Focuses the empty state container.
   * Skips focus steal if user is actively typing in a search input.
   * Implements Requirement 2.4.
   */
  focusEmptyState(): void {
    // Use setTimeout to ensure DOM is updated
    this.pendingTimers.push(setTimeout(() => {
      if (this.isUserInSearchInput()) {
        this.focusedIndexChange.emit(-1);
        return;
      }
      if (this.emptyStateContainer?.nativeElement) {
        this.emptyStateContainer.nativeElement.focus({ preventScroll: true });
        this.focusedIndexChange.emit(-1); // -1 indicates no item is focused
      }
    }, 0));
  }

  /**
   * Focuses the error state container.
   * Skips focus steal if user is actively typing in a search input.
   * Implements Requirement 2.5.
   */
  focusErrorState(): void {
    // Use setTimeout to ensure DOM is updated
    this.pendingTimers.push(setTimeout(() => {
      if (this.isUserInSearchInput()) {
        this.focusedIndexChange.emit(-1);
        return;
      }
      if (this.errorStateContainer?.nativeElement) {
        this.errorStateContainer.nativeElement.focus({ preventScroll: true });
        this.focusedIndexChange.emit(-1); // -1 indicates no item is focused
      }
    }, 0));
  }

  /**
   * Scrolls a list item into view.
   * Uses scrollIntoView with 'nearest' block to minimize scrolling.
   * Skips focus steal if user is actively typing in a search input.
   *
   * @param index - The index of the item to scroll into view
   */
  private scrollItemIntoView(index: number): void {
    // Use setTimeout to ensure DOM is updated before scrolling
    this.pendingTimers.push(setTimeout(() => {
      if (this.isUserInSearchInput()) {
        return;
      }
      const itemElements = this.listItemElements?.toArray();
      if (itemElements && itemElements[index]) {
        const element = itemElements[index].nativeElement;
        // Skip scrollIntoView on initial load to prevent page-level scroll jumps
        // (e.g., in Storybook docs mode where multiple stories render on one page)
        if (this.initialFocusSet) {
          element.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
        element.focus({ preventScroll: true });
      }
    }, 0));
  }

  // ============================================
  // Focus Guard Methods
  // ============================================

  /**
   * Checks if the user is currently focused on a search input or text input.
   * Used to prevent focus stealing from the search bar when results are fetched.
   * @returns True if the active element is an input, textarea, or contenteditable element
   * @private
   */
  private isUserInSearchInput(): boolean {
    const activeElement = document.activeElement;
    if (!activeElement) {
      return false;
    }
    const tagName = activeElement.tagName.toLowerCase();
    if (tagName === 'input' || tagName === 'textarea') {
      return true;
    }
    if (activeElement.getAttribute('contenteditable') === 'true') {
      return true;
    }
    return false;
  }

  // ============================================
  // Live Announcement Methods
  // ============================================

  /**
   * Announces loading state via live region.
   * Called when infinite scroll triggers loading more items.
   */
  private announceLoadingMore(): void {
    this.liveAnnouncer.announce(
      CometChatLocalize.getLocalizedString('accessibility_loading_more_items'),
      'polite'
    );
  }

  /**
   * Announces when new items are loaded.
   * Should be called by parent component after items are loaded.
   *
   * @param count - The number of new items loaded
   */
  announceItemsLoaded(count: number): void {
    const message = CometChatLocalize.getLocalizedString('accessibility_items_loaded').replace(
      '{count}',
      count.toString()
    );
    this.liveAnnouncer.announce(message, 'polite');
  }

  /**
   * Announces when all items have been loaded.
   * Should be called by parent component when hasMore becomes false.
   */
  announceAllItemsLoaded(): void {
    this.liveAnnouncer.announce(
      CometChatLocalize.getLocalizedString('accessibility_all_items_loaded'),
      'polite'
    );
  }

  /**
   * Announces loading error.
   * Should be called by parent component when loading fails.
   */
  announceLoadError(): void {
    this.liveAnnouncer.announceError(
      CometChatLocalize.getLocalizedString('accessibility_load_failed')
    );
  }
}
