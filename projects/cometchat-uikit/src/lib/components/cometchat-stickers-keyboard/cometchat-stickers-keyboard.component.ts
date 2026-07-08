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

export type { StickerClickEvent, StickerItem, StickerSet, ComponentState } from './cometchat-stickers-keyboard.types';
import type { StickerClickEvent, StickerItem, StickerSet, ComponentState } from './cometchat-stickers-keyboard.types';
import { parseStickersResponse, navigateStickerGridIndex, STICKERS_FOCUSABLE_SELECTORS } from './cometchat-stickers-keyboard.utils';

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

  /** Custom text for error state */
  @Input() errorStateText?: string;

  /** Custom text for empty state */
  @Input() emptyStateText?: string;

  /** Whether to automatically focus the first tab on open */
  @Input() autoFocus = true;

  /** Whether to trap focus within the keyboard */
  @Input() trapFocus = true;

  /** Emitted when a sticker is clicked */
  @Output() stickerClick = new EventEmitter<StickerClickEvent>();

  /** Emitted when the keyboard should close (e.g., Escape key pressed) */
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
    this.fetchStickers();
  }

  /**
   * Loads pre-provided sticker data directly (bypasses SDK fetch).
   *
   * Intended for Storybook/testing scenarios — called by the story wrapper
   * component to seed sticker data without hitting the SDK.
   */
  public loadStickerData(data: StickerSet): void {
    this.stickerSets.set(data);
    const categories = Object.keys(data);
    if (categories.length > 0) {
      this.activeCategory.set(categories[0]);
    }
    this.componentState.set('loaded');
  }

  /**
   * Overrides the component state directly.
   *
   * Intended for Storybook/testing scenarios — called by the story wrapper
   * to render loading/error/empty states without triggering the SDK fetch.
   */
  public setComponentState(state: ComponentState): void {
    this.componentState.set(state);
  }

  /**
   * Fetches stickers from the CometChat stickers extension.
   * Retries once if the first attempt fails (handles SDK not ready after page refresh).
   * @see Requirements 8.4, 8.14, 8.15
   */
  async fetchStickers(): Promise<void> {
    this.componentState.set('loading');
    this.liveAnnouncer.announce(getLocalizedString('accessibility_loading_stickers'), 'polite');

    // Check if user is logged in before attempting extension call
    let loggedInUser: CometChat.User | null = null;
    try {
      loggedInUser = await CometChat.getLoggedinUser();
    } catch {
      // SDK not ready
    }

    if (!loggedInUser) {
      // SDK not ready yet — retry after a short delay
      await new Promise(resolve => {
        const timer = setTimeout(resolve, 1500);
        this.pendingTimers.push(timer);
      });
      try {
        loggedInUser = await CometChat.getLoggedinUser();
      } catch {
        // Still not ready
      }
      if (!loggedInUser) {
        this.componentState.set('error');
        return;
      }
    }

    try {
      const response = await CometChat.callExtension('stickers', 'GET', 'v1/fetch', undefined);
      if (response && typeof response === 'object') {
        this.applyFetchedStickers(this.parseStickersResponse(response));
      } else {
        this.componentState.set('empty');
      }
    } catch (error) {
      CometChatLogger.error('CometChatStickersKeyboard', 'Error fetching stickers:', error);
      this.componentState.set('error');
    }
  }

  /** Applies parsed sticker data to component state after a successful fetch. */
  private applyFetchedStickers(stickerData: StickerSet): void {
    if (Object.keys(stickerData).length === 0) {
      this.componentState.set('empty');
      return;
    }
    this.stickerSets.set(stickerData);
    const categories = Object.keys(stickerData);
    if (categories.length > 0) {
      this.activeCategory.set(categories[0]);
    }
    this.componentState.set('loaded');
    this.liveAnnouncer.announce(
      getLocalizedString('accessibility_sticker_categories_loaded').replace(
        '{count}',
        categories.length.toString()
      ),
      'polite'
    );
    if (this.autoFocus) {
      this.pendingTimers.push(setTimeout(() => {
        const firstTab = document.querySelector('.cometchat-stickers-keyboard__tab') as HTMLElement;
        firstTab?.focus();
      }, 100));
    }
  }

  /**
   * Parses the stickers response from the extension API.
   * Delegates to the pure utility function in cometchat-stickers-keyboard.utils.ts.
   */
  private parseStickersResponse(response: unknown): StickerSet {
    return parseStickersResponse(response);
  }

  /**
   * Handles category tab click
   * @see Requirements 8.5
   */
  onCategoryClick(categoryName: string): void {
    this.activeCategory.set(categoryName);
    this.focusedStickerIndex.set(-1);
    // Keep the roving tab anchor on the selected category.
    this.focusedTabIndex.set(this.categoryNames().indexOf(categoryName));
  }

  /**
   * Handles sticker click - emits the sticker selection event and closes the keyboard
   * @see Requirements 8.7
   */
  handleStickerClick(sticker: StickerItem): void {
    this.stickerClick.emit({
      stickerUrl: sticker.stickerUrl,
      stickerName: sticker.stickerSetName,
    });
    // Close the keyboard after sending a sticker
    this.closeKeyboard.emit();
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
   * Navigates within the sticker grid using arrow keys.
   * Delegates index calculation to the pure utility function.
   * @see Requirements 8.12
   */
  private navigateStickerGrid(key: string, currentIndex: number): void {
    const stickers = this.currentStickers();
    if (stickers.length === 0) return;

    const newIndex = navigateStickerGridIndex(key, currentIndex, stickers.length, this.gridColumns);
    this.focusedStickerIndex.set(newIndex);

    // Use setTimeout to ensure DOM is updated before focusing
    this.pendingTimers.push(setTimeout(() => {
      const stickerElements = document.querySelectorAll(
        '.cometchat-stickers-keyboard__sticker-item'
      );
      const targetElement = stickerElements[newIndex] as HTMLElement;
      if (targetElement) {
        targetElement.focus();
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
      this.focusTab(index > 0 ? index - 1 : this.categoryNames().length - 1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.focusTab(index < this.categoryNames().length - 1 ? index + 1 : 0);
    }
  }

  /** Focuses a tab by index */
  private focusTab(newIndex: number): void {
    this.focusedTabIndex.set(newIndex);
    const tabs = document.querySelectorAll('.cometchat-stickers-keyboard__tab');
    (tabs[newIndex] as HTMLElement)?.focus();
  }

  /** Handles horizontal scroll for category tabs */
  onWheel(event: WheelEvent): void {
    const container = this.tabsContainer?.nativeElement;
    if (container) {
      const scrollAmount = (event.deltaMode === 1 || event.deltaY > 100)
        ? event.deltaY * 0.2
        : event.deltaY * 0.5;
      container.scrollTo({ top: 0, left: container.scrollLeft + scrollAmount, behavior: 'auto' });
    }
  }

  /** Handles global keyboard events for focus trap and Escape shortcut */
  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.closeKeyboard.emit();
      return;
    }
    if (this.trapFocus && event.key === 'Tab') {
      this.handleFocusTrap(event);
    }
  }

  /** Implements focus trap - cycles focus within component */
  private handleFocusTrap(event: KeyboardEvent): void {
    const focusableElements = Array.from(
      document.querySelectorAll(STICKERS_FOCUSABLE_SELECTORS.join(','))
    ) as HTMLElement[];
    if (focusableElements.length === 0) return;
    const first = focusableElements[0];
    const last = focusableElements[focusableElements.length - 1];
    const active = document.activeElement as HTMLElement;
    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  /** TrackBy for category list */
  trackByCategoryName(_index: number, categoryName: string): string {
    return categoryName;
  }

  /** TrackBy for sticker list */
  trackByStickerUrl(_index: number, sticker: StickerItem): string {
    return sticker.stickerUrl;
  }

  /** Gets the first sticker URL from a category to use as tab icon */
  getCategoryIcon(categoryName: string): string {
    const stickers = this.stickerSets()[categoryName];
    return stickers?.length > 0 ? stickers[0].stickerUrl : '';
  }

  /** Gets the 1-based row index for ARIA grid navigation */
  getRowIndex(index: number): number {
    return Math.floor(index / this.gridColumns) + 1;
  }

  /** Gets the 1-based column index for ARIA grid navigation */
  getColIndex(index: number): number {
    return (index % this.gridColumns) + 1;
  }

  /** Total number of grid rows for the current category (aria-rowcount). */
  getRowCount(): number {
    return Math.ceil(this.currentStickers().length / this.gridColumns);
  }

  /** Roving tabindex for category tabs: only the focused tab is in tab order. */
  getTabTabIndex(index: number): number {
    return index === this.focusedTabIndex() ? 0 : -1;
  }

  /** Roving tabindex for sticker cells: focused cell (or first when none) is tabbable. */
  getStickerTabIndex(index: number): number {
    const focused = this.focusedStickerIndex();
    return focused === -1 ? (index === 0 ? 0 : -1) : (index === focused ? 0 : -1);
  }

  /** Keeps the roving anchor in sync when a sticker cell receives focus. */
  onStickerFocus(index: number): void {
    this.focusedStickerIndex.set(index);
  }

  ngOnDestroy(): void {
    this.pendingTimers.forEach(t => clearTimeout(t));
    this.pendingTimers = [];
  }
}
