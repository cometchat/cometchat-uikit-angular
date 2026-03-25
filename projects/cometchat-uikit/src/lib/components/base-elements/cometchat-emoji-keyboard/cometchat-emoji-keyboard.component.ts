import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
  OnInit,
  AfterViewInit,
  OnDestroy,
  HostListener,
  QueryList,
  ViewChildren,
  NgZone,
  inject, ChangeDetectionStrategy} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CometChatSearchBarComponent } from '../cometchat-search-bar/cometchat-search-bar.component';
import { getLocalizedString } from '../../../resources/CometChatLocalize/cometchat-localize';
import { CometChatEmoji, CometChatEmojiCategory } from '../../../modals/CometChatEmoji';
import { Emojis } from './emojis';
import { GridNavigationService } from '../../../services/grid-navigation.service';
import { FocusTrapService } from '../../../services/focus-trap.service';
import { LiveAnnouncerService } from '../../../services/live-announcer.service';

@Component({
  selector: 'cometchat-emoji-keyboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, CometChatSearchBarComponent],
  templateUrl: './cometchat-emoji-keyboard.component.html',
  styleUrls: ['./cometchat-emoji-keyboard.component.css'],
})
export class CometChatEmojiKeyboardComponent implements OnInit, AfterViewInit, OnDestroy {
  /** @internal Timer references for cleanup */
  private pendingTimers: ReturnType<typeof setTimeout>[] = [];

  /** Array of emoji categories to display */
  @Input() emojiData: CometChatEmojiCategory[] = [];

  /** Custom ARIA label for the emoji picker dialog */
  @Input() ariaLabel = '';

  /** Whether to automatically focus the first tab on open */
  @Input() autoFocus = true;

  /** Whether to trap focus within the emoji keyboard */
  @Input() trapFocus = true;

  /** Emitted when an emoji is clicked - emits emoji char */
  @Output() emojiClick = new EventEmitter<string>();

  /** Emitted when Escape key is pressed to close the picker */
  @Output() closeKeyboard = new EventEmitter<void>();

  @ViewChild('scrollRef') scrollRef!: ElementRef<HTMLDivElement>;
  @ViewChild('emojiListRef') emojiListRef!: ElementRef<HTMLDivElement>;
  @ViewChildren('emojiItem') emojiItems!: QueryList<ElementRef<HTMLDivElement>>;

  // Inject accessibility services
  private gridNavigationService = inject(GridNavigationService);
  private focusTrapService = inject(FocusTrapService);
  private liveAnnouncer = inject(LiveAnnouncerService);
  private elementRef = inject(ElementRef);

  // Internal state
  emojiDataState: CometChatEmojiCategory[] = [];
  activeCategory = '';
  searchString = '';
  searchEmojiData: Record<string, CometChatEmoji> = {};
  focusedEmojiIndex = 0;
  focusedTabIndex = 0;
  focusedEmojiRow = 0;
  focusedEmojiCol = 0;
  gridColumns = 8; // Approximate columns in emoji grid
  private focusableElements: HTMLElement[] = [];
  private scrollListener: (() => void) | null = null;
  /** Whether the scroll was triggered programmatically by a category tab click */
  private isProgrammaticScroll = false;

  constructor(private ngZone: NgZone) {}

  ngOnInit(): void {
    this.loadEmojiCategories();
  }

  ngAfterViewInit(): void {
    // Attach scroll listener to the emoji list container for category tracking
    this.attachScrollListener();

    // Activate focus trap using FocusTrapService
    if (this.trapFocus) {
      this.pendingTimers.push(setTimeout(() => {
        this.focusTrapService.activate({
          container: this.elementRef.nativeElement,
          initialFocus: 'first',
          returnFocusOnDeactivate: true,
        });
      }, 0));
    } else if (this.autoFocus) {
      // Auto-focus first tab if enabled but focus trap is disabled
      this.pendingTimers.push(setTimeout(() => {
        const firstTab = this.elementRef.nativeElement.querySelector(
          '.cometchat-emoji-keyboard__tab'
        ) as HTMLElement;
        firstTab?.focus();
      }, 100));
    }
  }

  /**
   * Load default emoji data if not provided via emojiData input
   */
  loadEmojiCategories(): void {
    if (this.emojiData && this.emojiData.length > 0) {
      this.emojiDataState = this.emojiData;
    } else {
      // Load default emoji data from emojis.ts
      this.emojiDataState = Emojis.map(el => {
        const vals = Object.values(el)[0];
        return {
          id: vals.id,
          name: vals.name,
          symbolURL: vals.symbol,
          emojies: vals.emojis,
        } as CometChatEmojiCategory;
      });
    }

    // Set activeCategory early (before first CD check) to avoid NG0100
    if (this.emojiDataState.length > 0 && !this.activeCategory) {
      this.activeCategory = this.emojiDataState[0].id;
    }
  }

  ngOnDestroy(): void {
    this.pendingTimers.forEach(t => clearTimeout(t));
    this.pendingTimers = [];
    this.detachScrollListener();
    // Deactivate focus trap
    if (this.trapFocus) {
      this.focusTrapService.deactivate(this.elementRef.nativeElement);
    }
  }

  /**
   * Attach a scroll event listener to the emoji list container.
   * Runs outside Angular zone for performance since scroll fires frequently,
   * and only re-enters the zone when activeCategory actually changes.
   */
  private attachScrollListener(): void {
    const listEl = this.emojiListRef?.nativeElement;
    if (!listEl) {
      return;
    }

    this.ngZone.runOutsideAngular(() => {
      this.scrollListener = () => this.onEmojiListScroll();
      listEl.addEventListener('scroll', this.scrollListener, { passive: true });
    });
  }

  /**
   * Detach the scroll event listener from the emoji list container.
   */
  private detachScrollListener(): void {
    if (this.scrollListener && this.emojiListRef?.nativeElement) {
      this.emojiListRef.nativeElement.removeEventListener('scroll', this.scrollListener);
      this.scrollListener = null;
    }
  }

  /**
   * Handle scroll events on the emoji list container.
   * Determines which category header is closest to the top of the visible scroll area
   * and updates activeCategory accordingly.
   */
  private onEmojiListScroll(): void {
    // Skip scroll tracking during programmatic scrolls (category tab clicks)
    if (this.isProgrammaticScroll) {
      return;
    }

    // Skip if we're in search mode
    if (this.searchString) {
      return;
    }

    const listEl = this.emojiListRef?.nativeElement;
    if (!listEl || this.emojiDataState.length === 0) {
      return;
    }

    const containerTop = listEl.getBoundingClientRect().top;
    let activeCategoryId = this.emojiDataState[0].id;

    // Iterate through categories and find the last one whose header is at or above
    // the top of the scroll container (with a small tolerance).
    // This gives us the category the user is currently scrolled into.
    for (const category of this.emojiDataState) {
      const headerEl = listEl.querySelector(`#${CSS.escape(category.id)}`) as HTMLElement;
      if (!headerEl) {
        continue;
      }

      const headerTop = headerEl.getBoundingClientRect().top;
      // If the header is at or above the container top (with 10px tolerance),
      // this category is the current one. Keep updating as we find later categories
      // that are also at/above the top — the last one wins.
      if (headerTop - containerTop <= 10) {
        activeCategoryId = category.id;
      }
    }

    if (activeCategoryId !== this.activeCategory) {
      this.ngZone.run(() => {
        this.activeCategory = activeCategoryId;
      });
    }
  }

  /**
   * Handle category tab click - scroll to that category section
   */
  onCategoryClick(categoryId: string): void {
    this.scrollToElement(categoryId);
  }

  /**
   * Handle emoji click - emit the emoji character
   */
  handleEmojiClick(emoji: CometChatEmoji): void {
    this.emojiClick.emit(emoji.char);
  }

  /**
   * Filter emojis based on search text by matching against each emoji's keywords array (case-insensitive).
   * When search is cleared, restores the full emoji category list view.
   * Announces result count via LiveAnnouncerService for screen readers.
   */
  filterEmojis(input: { value?: string }): void {
    const searchText = input.value || '';
    this.searchString = searchText;

    if (!searchText) {
      this.searchEmojiData = {};
      return;
    }

    const lowerSearch = searchText.toLowerCase();
    const filtered: Record<string, CometChatEmoji> = {};
    this.emojiDataState.forEach(category => {
      Object.entries(category.emojies).forEach(([name, emoji]) => {
        const keywords = emoji.keywords;
        if (keywords && keywords.some(kw => kw.toLowerCase().includes(lowerSearch))) {
          filtered[name] = emoji;
        }
      });
    });
    this.searchEmojiData = filtered;

    // Announce search results count for screen readers
    const count = Object.keys(filtered).length;
    if (count > 0) {
      const message = getLocalizedString('accessibility_emoji_results').replace(
        '{count}',
        count.toString()
      );
      this.liveAnnouncer.announce(message, 'polite');
      // Reset focus to first emoji in search results
      this.focusedEmojiIndex = 0;
    } else {
      this.liveAnnouncer.announce(getLocalizedString('accessibility_emoji_no_results'), 'polite');
    }
  }

  /**
   * Scroll to a specific category section.
   * Sets isProgrammaticScroll flag to prevent scroll tracking from overriding
   * the active category during the smooth scroll animation.
   */
  scrollToElement(categoryId: string): void {
    this.activeCategory = categoryId;
    this.searchString = '';
    this.searchEmojiData = {};

    this.isProgrammaticScroll = true;
    const listEl = this.emojiListRef?.nativeElement;
    const headerEl = listEl?.querySelector(`#${CSS.escape(categoryId)}`) as HTMLElement;
    if (listEl && headerEl) {
      listEl.scrollTo({
        top: headerEl.offsetTop - listEl.offsetTop,
        behavior: 'smooth',
      });
    }

    // Re-enable scroll tracking after the smooth scroll animation completes.
    // 500ms is a reasonable duration for smooth scroll to finish.
    this.pendingTimers.push(setTimeout(() => {
      this.isProgrammaticScroll = false;
    }, 500));
  }

  /**
   * Handle horizontal scroll for category tabs with hyper scroll handling
   */
  onWheel(event: WheelEvent): void {
    const container = this.scrollRef?.nativeElement;
    if (container) {
      let scrollAmount = event.deltaY * 0.5; // Default for normal mice

      // Handle hyper scroll or fast-scrolling devices
      if (event.deltaMode === 1 || event.deltaY > 100) {
        scrollAmount = event.deltaY * 0.2; // Slow down for hyper scroll
      }

      container.scrollTo({
        top: 0,
        left: container.scrollLeft + scrollAmount,
        behavior: 'auto', // Use 'auto' to avoid jitter on hyper scroll
      });
    }
  }

  /**
   * Get localized category name
   */
  getLocalizedCategoryName(name: string): string {
    return getLocalizedString(name);
  }

  /**
   * Get emoji data as character
   */
  getEmojiData(emoji: CometChatEmoji): string {
    return emoji.char;
  }

  /**
   * Get emoji entries from object map
   */
  getEmojiEntries(emojies: Record<string, CometChatEmoji>): [string, CometChatEmoji][] {
    return Object.entries(emojies);
  }

  /**
   * Track by function for emoji list
   */
  trackByEmojiName(_index: number, item: [string, CometChatEmoji]): string {
    return item[0];
  }

  /**
   * Track by function for category list
   */
  trackByCategoryId(_index: number, category: CometChatEmojiCategory): string {
    return category.id;
  }

  /**
   * Handle keyboard navigation for emoji grid using GridNavigationService
   */
  onEmojiKeydown(event: KeyboardEvent, emoji: CometChatEmoji): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      event.stopPropagation();
      this.handleEmojiClick(emoji);
    } else if (
      ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)
    ) {
      event.preventDefault();
      event.stopPropagation();
      this.navigateEmojiGridWithService(event);
    }
  }

  /**
   * Navigate within emoji grid using GridNavigationService for 2D navigation
   */
  navigateEmojiGridWithService(event: KeyboardEvent): void {
    const emojiElements = Array.from(
      this.elementRef.nativeElement.querySelectorAll('.cometchat-emoji-keyboard__list-item')
    ) as HTMLElement[];

    if (emojiElements.length === 0) return;

    const currentIndex = emojiElements.findIndex(el => el === document.activeElement);
    if (currentIndex === -1) return;

    const rowCount = Math.ceil(emojiElements.length / this.gridColumns);

    const newIndex = this.gridNavigationService.handleKeyNavigation(event, currentIndex, {
      rowCount,
      columnCount: this.gridColumns,
      totalItems: emojiElements.length,
      wrap: true,
    });

    if (newIndex !== -1 && newIndex !== currentIndex) {
      this.focusedEmojiIndex = newIndex;
      emojiElements[newIndex]?.focus();
    }
  }

  /**
   * Handle keyboard navigation for category tabs
   */
  onTabKeydown(event: KeyboardEvent, categoryId: string, index: number): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      event.stopPropagation();
      this.onCategoryClick(categoryId);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      event.stopPropagation();
      this.focusPreviousTab(index);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      event.stopPropagation();
      this.focusNextTab(index);
    }
  }

  /**
   * Focus previous tab with wrapping
   */
  focusPreviousTab(currentIndex: number): void {
    const newIndex = currentIndex > 0 ? currentIndex - 1 : this.emojiDataState.length - 1;
    this.focusedTabIndex = newIndex;
    const tabs = this.elementRef.nativeElement.querySelectorAll('.cometchat-emoji-keyboard__tab');
    (tabs[this.focusedTabIndex] as HTMLElement)?.focus();
  }

  /**
   * Focus next tab with wrapping
   */
  focusNextTab(currentIndex: number): void {
    const newIndex = currentIndex < this.emojiDataState.length - 1 ? currentIndex + 1 : 0;
    this.focusedTabIndex = newIndex;
    const tabs = this.elementRef.nativeElement.querySelectorAll('.cometchat-emoji-keyboard__tab');
    (tabs[this.focusedTabIndex] as HTMLElement)?.focus();
  }

  /**
   * Handle global keyboard events for shortcuts
   * Note: Focus trap is now handled by FocusTrapService
   */
  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    // Escape key to close
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.closeKeyboard.emit();
      return;
    }

    // '/' key to focus search (if not already in search)
    if (event.key === '/' && document.activeElement?.tagName !== 'INPUT') {
      event.preventDefault();
      event.stopPropagation();
      const searchInput = this.elementRef.nativeElement.querySelector(
        '.cometchat-search-bar__input'
      ) as HTMLElement;
      searchInput?.focus();
      return;
    }
  }

  /**
   * Gets tabindex for an emoji based on roving tabindex pattern
   * @param index - The emoji's index in the current view
   * @returns 0 if focused, -1 otherwise
   */
  getEmojiTabIndex(index: number): number {
    return this.gridNavigationService.getItemTabIndex(index, this.focusedEmojiIndex);
  }

  /**
   * Gets tabindex for a category tab based on roving tabindex pattern
   * @param index - The tab's index
   * @returns 0 if focused/active, -1 otherwise
   */
  getTabTabIndex(index: number): number {
    return index === this.focusedTabIndex ? 0 : -1;
  }

  /**
   * Gets the row count for the current emoji grid
   * @returns Number of rows in the grid
   */
  getRowCount(): number {
    const totalEmojis = this.searchString
      ? Object.keys(this.searchEmojiData).length
      : this.getTotalEmojiCount();
    return Math.ceil(totalEmojis / this.gridColumns);
  }

  /**
   * Gets total emoji count across all categories
   */
  private getTotalEmojiCount(): number {
    return this.emojiDataState.reduce((total, category) => {
      return total + Object.keys(category.emojies).length;
    }, 0);
  }

  /**
   * Gets the row and column position for an emoji
   * @param index - The emoji's index
   * @returns Object with row and col properties
   */
  getEmojiPosition(index: number): { row: number; col: number } {
    return this.gridNavigationService.getRowCol(index, this.gridColumns);
  }

  /**
   * Handles emoji focus event to update focused index
   * @param index - The index of the focused emoji
   */
  onEmojiFocus(index: number): void {
    this.focusedEmojiIndex = index;
  }

  /**
   * Get the first emoji character from a category to use as a tab icon fallback
   * when no symbolURL is provided.
   */
  getFirstEmoji(category: CometChatEmojiCategory): string {
    const entries = Object.values(category.emojies);
    return entries.length > 0 ? entries[0].char : '⬜';
  }

  /**
   * Gets the localized ARIA label for the emoji picker
   */
  getAriaLabel(): string {
    return this.ariaLabel || getLocalizedString('accessibility_emoji_picker');
  }
}
