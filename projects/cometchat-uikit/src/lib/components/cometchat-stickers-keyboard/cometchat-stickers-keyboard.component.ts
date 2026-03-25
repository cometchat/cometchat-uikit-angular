import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  HostListener,
  signal,
  computed,
  ViewChild,
  ElementRef,
  inject, OnDestroy, ChangeDetectionStrategy} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../resources/CometChatLocalize/translate.pipe';
import { getLocalizedString } from '../../resources/CometChatLocalize/cometchat-localize';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { LiveAnnouncerService } from '../../services/live-announcer.service';
import { CometChatLogger } from '../../utils/CometChatLogger';

/**
 * Event emitted when a sticker is clicked
 */
export interface StickerClickEvent {
  /** URL of the selected sticker */
  stickerUrl: string;
  /** Name of the selected sticker */
  stickerName: string;
}

/**
 * Represents a single sticker item
 */
export interface StickerItem {
  /** URL of the sticker image */
  stickerUrl: string;
  /** Name of the sticker set this sticker belongs to */
  stickerSetName: string;
  /** Order of the sticker within its set */
  stickerOrder?: number;
}

/**
 * Represents a collection of sticker sets
 */
export type StickerSet = Record<string, StickerItem[]>;

/**
 * Component state enum for managing loading/error/empty states
 */
type ComponentState = 'loading' | 'loaded' | 'error' | 'empty';

/**
 * CometChatStickersKeyboard Component
 *
 * A component for browsing and selecting stickers from the CometChat stickers extension.
 * Displays stickers organized by category tabs with a grid layout.
 *
 * @example
 * ```html
 * <cometchat-stickers-keyboard
 *   (stickerClick)="onStickerSelect($event)"
 *   (closeKeyboard)="onCloseStickers()">
 * </cometchat-stickers-keyboard>
 * ```
 *
 * @see Requirements 8.4, 8.5, 8.6, 8.8, 8.9, 8.10
 */
@Component({
  selector: 'cometchat-stickers-keyboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './cometchat-stickers-keyboard.component.html',
  styleUrls: ['./cometchat-stickers-keyboard.component.css'],
})
export class CometChatStickersKeyboardComponent implements OnInit, OnDestroy {
  /** @internal Timer references for cleanup */
  private pendingTimers: ReturnType<typeof setTimeout>[] = [];

  /**
   * Custom text for error state
   */
  @Input() errorStateText?: string;

  /**
   * Custom text for empty state
   */
  @Input() emptyStateText?: string;

  /**
   * Whether to automatically focus the first tab on open
   */
  @Input() autoFocus = true;

  /**
   * Whether to trap focus within the keyboard
   */
  @Input() trapFocus = true;

  /**
   * Optional pre-loaded sticker data. When provided, the component
   * skips the SDK fetch and uses this data directly.
   * Useful for Storybook and testing scenarios.
   */
  @Input() stickerData?: StickerSet;

  /**
   * Optional initial state override. When set, the component renders
   * in this state immediately without fetching from the SDK.
   * Useful for Storybook and testing scenarios.
   */
  @Input() initialState?: 'loading' | 'error' | 'empty';

  /**
   * Emitted when a sticker is clicked
   */
  @Output() stickerClick = new EventEmitter<StickerClickEvent>();

  /**
   * Emitted when the keyboard should close (e.g., Escape key pressed)
   */
  @Output() closeKeyboard = new EventEmitter<void>();

  @ViewChild('tabsContainer') tabsContainer!: ElementRef<HTMLDivElement>;

  // Inject LiveAnnouncerService for accessibility announcements
  private liveAnnouncer = inject(LiveAnnouncerService);

  // Internal state using signals
  protected componentState = signal<ComponentState>('loading');
  protected stickerSets = signal<StickerSet>({});
  protected activeCategory = signal<string>('');
  protected focusedStickerIndex = signal<number>(-1);
  protected focusedTabIndex = signal<number>(0);
  protected loadedImages = signal<Set<string>>(new Set());

  // Computed values
  protected categoryNames = computed(() => Object.keys(this.stickerSets()));
  protected currentStickers = computed(() => {
    const sets = this.stickerSets();
    const category = this.activeCategory();
    return sets[category] || [];
  });

  // Grid configuration
  protected readonly gridColumns = 4;
  protected readonly shimmerTabs = Array.from({ length: 6 });
  protected readonly shimmerStickers = Array.from({ length: 12 });

  ngOnInit(): void {
    if (this.initialState) {
      this.componentState.set(this.initialState);
      return;
    }
    if (this.stickerData && Object.keys(this.stickerData).length > 0) {
      this.loadStickerData(this.stickerData);
    } else {
      this.fetchStickers();
    }
  }

  /**
   * Loads pre-provided sticker data directly (bypasses SDK fetch).
   */
  private loadStickerData(data: StickerSet): void {
    this.stickerSets.set(data);
    const categories = Object.keys(data);
    if (categories.length > 0) {
      this.activeCategory.set(categories[0]);
    }
    this.componentState.set('loaded');
  }

  /**
   * Fetches stickers from the CometChat stickers extension
   * @see Requirements 8.4, 8.14, 8.15
   */
  async fetchStickers(): Promise<void> {
    this.componentState.set('loading');

    // Announce loading state for screen readers (Requirement 8.14)
    this.liveAnnouncer.announce(getLocalizedString('accessibility_loading_stickers'), 'polite');

    try {
      const response = await CometChat.callExtension('stickers', 'GET', 'v1/fetch', undefined);

      if (response && typeof response === 'object') {
        const stickerData = this.parseStickersResponse(response);

        if (Object.keys(stickerData).length === 0) {
          this.componentState.set('empty');
          return;
        }

        this.stickerSets.set(stickerData);

        // Set first category as active
        const categories = Object.keys(stickerData);
        if (categories.length > 0) {
          this.activeCategory.set(categories[0]);
        }

        this.componentState.set('loaded');

        // Announce loaded state with category count for screen readers (Requirement 8.15)
        const categoryCount = categories.length;
        this.liveAnnouncer.announce(
          getLocalizedString('accessibility_sticker_categories_loaded').replace(
            '{count}',
            categoryCount.toString()
          ),
          'polite'
        );

        // Auto-focus first tab if enabled
        if (this.autoFocus) {
          this.pendingTimers.push(setTimeout(() => {
            const firstTab = document.querySelector(
              '.cometchat-stickers-keyboard__tab'
            ) as HTMLElement;
            firstTab?.focus();
          }, 100));
        }
      } else {
        this.componentState.set('empty');
      }
    } catch (error) {
      CometChatLogger.error('CometChatStickersKeyboard', 'Error fetching stickers:', error);
      this.componentState.set('error');
    }
  }

  /**
   * Parses the stickers response from the extension API
   */
  /**
   * Parses the stickers response from the extension API.
   *
   * The CometChat stickers extension returns a response shaped like:
   * ```
   * { data: { defaultStickers: StickerObj[], customStickers: StickerObj[] } }
   * ```
   * where each StickerObj is a flat object:
   * ```
   * { stickerName, stickerSetName, stickerUrl, stickerOrder, stickerSetOrder }
   * ```
   * This method groups the flat sticker objects by `stickerSetName`.
   */
  private parseStickersResponse(response: unknown): StickerSet {
    const stickerSets: StickerSet = {};

    try {
      const raw = response as Record<string, unknown>;

      // Unwrap nested `data` envelope if present
      const data = (raw['data'] as Record<string, unknown>) ?? raw;

      const defaultStickers = data['defaultStickers'] as Record<string, unknown>[] | undefined;
      const customStickers = data['customStickers'] as Record<string, unknown>[] | undefined;

      // Helper: process a flat array of sticker objects and group by stickerSetName
      const processStickers = (stickers: Record<string, unknown>[], fallbackSet: string) => {
        for (const sticker of stickers) {
          const setName = (sticker['stickerSetName'] as string) || fallbackSet;
          const url = (sticker['stickerUrl'] as string) || '';
          if (!url) continue;

          if (!stickerSets[setName]) {
            stickerSets[setName] = [];
          }

          stickerSets[setName].push({
            stickerUrl: url,
            stickerSetName: setName,
            stickerOrder: Number(sticker['stickerOrder']) || 0,
          });
        }
      };

      if (Array.isArray(defaultStickers)) {
        processStickers(defaultStickers, 'Default');
      }

      if (Array.isArray(customStickers)) {
        processStickers(customStickers, 'Custom');
      }

      // Sort stickers within each set by order
      for (const setName of Object.keys(stickerSets)) {
        stickerSets[setName].sort((a, b) => (a.stickerOrder || 0) - (b.stickerOrder || 0));
      }
    } catch (error) {
      CometChatLogger.error('CometChatStickersKeyboard', 'Error parsing stickers response:', error);
    }

    return stickerSets;
  }

  /**
   * Handles category tab click
   * @see Requirements 8.5
   */
  onCategoryClick(categoryName: string): void {
    this.activeCategory.set(categoryName);
    this.focusedStickerIndex.set(-1);
  }

  /**
   * Handles sticker click - emits the sticker selection event
   * @see Requirements 8.7
   */
  handleStickerClick(sticker: StickerItem): void {
    this.stickerClick.emit({
      stickerUrl: sticker.stickerUrl,
      stickerName: sticker.stickerSetName,
    });
  }

  /**
   * Handles retry button click in error state
   */
  handleRetry(): void {
    this.fetchStickers();
  }

  /**
   * Tracks loaded sticker images to swap shimmer placeholders for the real image.
   */
  onImageLoaded(url: string): void {
    this.loadedImages.update(prev => {
      const next = new Set(prev);
      next.add(url);
      return next;
    });
  }

  /**
   * Gets the error state text
   * @see Requirements 8.10
   */
  getErrorText(): string {
    return this.errorStateText || getLocalizedString('sticker_error');
  }

  /**
   * Gets the empty state text
   * @see Requirements 8.9
   */
  getEmptyText(): string {
    return this.emptyStateText || getLocalizedString('sticker_empty');
  }

  /**
   * Handles keyboard navigation for sticker grid
   * @see Requirements 8.12
   */
  onStickerKeydown(event: KeyboardEvent, sticker: StickerItem, index: number): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.handleStickerClick(sticker);
    } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
      event.preventDefault();
      this.navigateStickerGrid(event.key, index);
    }
  }

  /**
   * Navigates within the sticker grid using arrow keys
   * Handles wrapping at grid boundaries and accounts for incomplete last rows
   * @see Requirements 8.12
   */
  private navigateStickerGrid(key: string, currentIndex: number): void {
    const stickers = this.currentStickers();
    if (stickers.length === 0) return;

    let newIndex = currentIndex;
    const currentRow = Math.floor(currentIndex / this.gridColumns);
    const currentCol = currentIndex % this.gridColumns;
    const totalRows = Math.ceil(stickers.length / this.gridColumns);
    const lastRowStartIndex = (totalRows - 1) * this.gridColumns;

    switch (key) {
      case 'ArrowLeft':
        if (currentCol === 0) {
          // At left edge - wrap to end of current row or last item in row
          const rowEndIndex = Math.min(
            currentRow * this.gridColumns + this.gridColumns - 1,
            stickers.length - 1
          );
          newIndex = rowEndIndex;
        } else {
          newIndex = currentIndex - 1;
        }
        break;

      case 'ArrowRight':
        const isLastItemInRow = currentCol === this.gridColumns - 1;
        const isLastItem = currentIndex === stickers.length - 1;
        if (isLastItemInRow || isLastItem) {
          // At right edge or last item - wrap to start of current row
          newIndex = currentRow * this.gridColumns;
        } else {
          newIndex = currentIndex + 1;
        }
        break;

      case 'ArrowUp':
        if (currentRow === 0) {
          // At top row - wrap to bottom row, same column if possible
          const targetIndex = lastRowStartIndex + currentCol;
          newIndex = targetIndex < stickers.length ? targetIndex : stickers.length - 1;
        } else {
          newIndex = currentIndex - this.gridColumns;
        }
        break;

      case 'ArrowDown':
        if (currentRow === totalRows - 1) {
          // At bottom row - wrap to top row, same column
          newIndex = currentCol;
        } else {
          const targetIndex = currentIndex + this.gridColumns;
          // Handle case where next row has fewer items
          newIndex = targetIndex < stickers.length ? targetIndex : stickers.length - 1;
        }
        break;
    }

    // Ensure newIndex is within bounds
    newIndex = Math.max(0, Math.min(newIndex, stickers.length - 1));

    this.focusedStickerIndex.set(newIndex);

    // Use setTimeout to ensure DOM is updated before focusing
    this.pendingTimers.push(setTimeout(() => {
      const stickerElements = document.querySelectorAll(
        '.cometchat-stickers-keyboard__sticker-item'
      );
      const targetElement = stickerElements[newIndex] as HTMLElement;
      if (targetElement) {
        targetElement.focus();
        // Scroll into view if needed
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 0));
  }

  /**
   * Handles keyboard navigation for category tabs
   */
  onTabKeydown(event: KeyboardEvent, categoryName: string, index: number): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.onCategoryClick(categoryName);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.focusPreviousTab(index);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.focusNextTab(index);
    }
  }

  /**
   * Focuses the previous tab with wrapping
   */
  private focusPreviousTab(currentIndex: number): void {
    const categories = this.categoryNames();
    const newIndex = currentIndex > 0 ? currentIndex - 1 : categories.length - 1;
    this.focusedTabIndex.set(newIndex);
    const tabs = document.querySelectorAll('.cometchat-stickers-keyboard__tab');
    (tabs[newIndex] as HTMLElement)?.focus();
  }

  /**
   * Focuses the next tab with wrapping
   */
  private focusNextTab(currentIndex: number): void {
    const categories = this.categoryNames();
    const newIndex = currentIndex < categories.length - 1 ? currentIndex + 1 : 0;
    this.focusedTabIndex.set(newIndex);
    const tabs = document.querySelectorAll('.cometchat-stickers-keyboard__tab');
    (tabs[newIndex] as HTMLElement)?.focus();
  }

  /**
   * Handles horizontal scroll for category tabs
   */
  onWheel(event: WheelEvent): void {
    const container = this.tabsContainer?.nativeElement;
    if (container) {
      let scrollAmount = event.deltaY * 0.5;

      // Handle hyper scroll or fast-scrolling devices
      if (event.deltaMode === 1 || event.deltaY > 100) {
        scrollAmount = event.deltaY * 0.2;
      }

      container.scrollTo({
        top: 0,
        left: container.scrollLeft + scrollAmount,
        behavior: 'auto',
      });
    }
  }

  /**
   * Handles global keyboard events for focus trap and shortcuts
   */
  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    // Escape key to close
    if (event.key === 'Escape') {
      event.preventDefault();
      this.closeKeyboard.emit();
      return;
    }

    // Focus trap implementation
    if (this.trapFocus && event.key === 'Tab') {
      this.handleFocusTrap(event);
    }
  }

  /**
   * Implements focus trap - cycles focus within component
   */
  private handleFocusTrap(event: KeyboardEvent): void {
    const focusableSelectors = [
      '.cometchat-stickers-keyboard__tab',
      '.cometchat-stickers-keyboard__sticker-item',
      '.cometchat-stickers-keyboard__retry-button',
    ];

    const focusableElements = Array.from(
      document.querySelectorAll(focusableSelectors.join(','))
    ) as HTMLElement[];

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    const activeElement = document.activeElement as HTMLElement;

    if (event.shiftKey) {
      // Shift+Tab - moving backwards
      if (activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    } else {
      // Tab - moving forwards
      if (activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  }

  /**
   * Track by function for category list
   */
  trackByCategoryName(_index: number, categoryName: string): string {
    return categoryName;
  }

  /**
   * Track by function for sticker list
   */
  trackByStickerUrl(_index: number, sticker: StickerItem): string {
    return sticker.stickerUrl;
  }

  /**
   * Gets the first sticker URL from a category to use as tab icon
   */
  getCategoryIcon(categoryName: string): string {
    const sets = this.stickerSets();
    const stickers = sets[categoryName];
    return stickers && stickers.length > 0 ? stickers[0].stickerUrl : '';
  }

  /**
   * Gets the row index (1-based) for ARIA grid navigation
   * @param index The flat index of the sticker
   * @returns The 1-based row index
   */
  getRowIndex(index: number): number {
    return Math.floor(index / this.gridColumns) + 1;
  }

  /**
   * Gets the column index (1-based) for ARIA grid navigation
   * @param index The flat index of the sticker
   * @returns The 1-based column index
   */
  getColIndex(index: number): number {
    return (index % this.gridColumns) + 1;
  }
  ngOnDestroy(): void {
    this.pendingTimers.forEach(t => clearTimeout(t));
    this.pendingTimers = [];
  }
  
}
