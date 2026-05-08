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

  /** Attach a scroll event listener to the emoji list container. */
  private attachScrollListener(): void {
    const listEl = this.emojiListRef?.nativeElement;
    if (!listEl) return;

    this.ngZone.runOutsideAngular(() => {
      this.scrollListener = () => this.onEmojiListScroll();
      listEl.addEventListener('scroll', this.scrollListener, { passive: true });
    });
  }

  /** Detach the scroll event listener from the emoji list container. */
  private detachScrollListener(): void {
    if (this.scrollListener && this.emojiListRef?.nativeElement) {
      this.emojiListRef.nativeElement.removeEventListener('scroll', this.scrollListener);
      this.scrollListener = null;
    }
  }

  /** Handle scroll events on the emoji list container. Updates activeCategory based on scroll position. */
  private onEmojiListScroll(): void {
    if (this.isProgrammaticScroll || this.searchString) return;

    const listEl = this.emojiListRef?.nativeElement;
    if (!listEl || this.emojiDataState.length === 0) return;

    const containerTop = listEl.getBoundingClientRect().top;
    let activeCategoryId = this.emojiDataState[0].id;

    for (const category of this.emojiDataState) {
      const headerEl = listEl.querySelector(`#${CSS.escape(category.id)}`) as HTMLElement;
      if (!headerEl) continue;
      if (headerEl.getBoundingClientRect().top - containerTop <= 10) {
        activeCategoryId = category.id;
      }
    }

    if (activeCategoryId !== this.activeCategory) {
      this.ngZone.run(() => { this.activeCategory = activeCategoryId; });
    }
  }

  /** Handle category tab click - scroll to that category section. */
  onCategoryClick(categoryId: string): void { this.scrollToElement(categoryId); }

  /** Handle emoji click - emit the emoji character. */
  handleEmojiClick(emoji: CometChatEmoji): void { this.emojiClick.emit(emoji.char); }

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

  /** Scroll to a specific category section. */
  scrollToElement(categoryId: string): void {
    this.activeCategory = categoryId;
    this.searchString = '';
    this.searchEmojiData = {};
    this.isProgrammaticScroll = true;
    const listEl = this.emojiListRef?.nativeElement;
    const headerEl = listEl?.querySelector(`#${CSS.escape(categoryId)}`) as HTMLElement;
    if (listEl && headerEl) {
      listEl.scrollTo({ top: headerEl.offsetTop - listEl.offsetTop, behavior: 'smooth' });
    }
    this.pendingTimers.push(setTimeout(() => { this.isProgrammaticScroll = false; }, 500));
  }

  /** Handle horizontal scroll for category tabs with hyper scroll handling. */
  onWheel(event: WheelEvent): void {
    const container = this.scrollRef?.nativeElement;
    if (container) {
      let scrollAmount = event.deltaY * 0.5;
      if (event.deltaMode === 1 || event.deltaY > 100) scrollAmount = event.deltaY * 0.2;
      container.scrollTo({ top: 0, left: container.scrollLeft + scrollAmount, behavior: 'auto' });
    }
  }

  getLocalizedCategoryName(name: string): string { return getLocalizedString(name); }
  getEmojiData(emoji: CometChatEmoji): string { return emoji.char; }
  getEmojiEntries(emojies: Record<string, CometChatEmoji>): [string, CometChatEmoji][] { return Object.entries(emojies); }
  trackByEmojiName(_index: number, item: [string, CometChatEmoji]): string { return item[0]; }
  trackByCategoryId(_index: number, category: CometChatEmojiCategory): string { return category.id; }

  /** Handle keyboard navigation for emoji grid. */
  onEmojiKeydown(event: KeyboardEvent, emoji: CometChatEmoji): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault(); event.stopPropagation(); this.handleEmojiClick(emoji);
    } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
      event.preventDefault(); event.stopPropagation(); this.navigateEmojiGridWithService(event);
    }
  }

  /** Navigate within emoji grid using GridNavigationService. */
  navigateEmojiGridWithService(event: KeyboardEvent): void {
    const emojiElements = Array.from(this.elementRef.nativeElement.querySelectorAll('.cometchat-emoji-keyboard__list-item')) as HTMLElement[];
    if (emojiElements.length === 0) return;
    const currentIndex = emojiElements.findIndex(el => el === document.activeElement);
    if (currentIndex === -1) return;
    const rowCount = Math.ceil(emojiElements.length / this.gridColumns);
    const newIndex = this.gridNavigationService.handleKeyNavigation(event, currentIndex, { rowCount, columnCount: this.gridColumns, totalItems: emojiElements.length, wrap: true });
    if (newIndex !== -1 && newIndex !== currentIndex) { this.focusedEmojiIndex = newIndex; emojiElements[newIndex]?.focus(); }
  }

  /** Handle keyboard navigation for category tabs. */
  onTabKeydown(event: KeyboardEvent, categoryId: string, index: number): void {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); event.stopPropagation(); this.onCategoryClick(categoryId); }
    else if (event.key === 'ArrowLeft') { event.preventDefault(); event.stopPropagation(); this.focusPreviousTab(index); }
    else if (event.key === 'ArrowRight') { event.preventDefault(); event.stopPropagation(); this.focusNextTab(index); }
  }

  focusPreviousTab(currentIndex: number): void {
    this.focusedTabIndex = currentIndex > 0 ? currentIndex - 1 : this.emojiDataState.length - 1;
    const tabs = this.elementRef.nativeElement.querySelectorAll('.cometchat-emoji-keyboard__tab');
    (tabs[this.focusedTabIndex] as HTMLElement)?.focus();
  }

  focusNextTab(currentIndex: number): void {
    this.focusedTabIndex = currentIndex < this.emojiDataState.length - 1 ? currentIndex + 1 : 0;
    const tabs = this.elementRef.nativeElement.querySelectorAll('.cometchat-emoji-keyboard__tab');
    (tabs[this.focusedTabIndex] as HTMLElement)?.focus();
  }

  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); this.closeKeyboard.emit(); return; }
    if (event.key === '/' && document.activeElement?.tagName !== 'INPUT') {
      event.preventDefault(); event.stopPropagation();
      const searchInput = this.elementRef.nativeElement.querySelector('.cometchat-search-bar__input') as HTMLElement;
      searchInput?.focus();
    }
  }

  getEmojiTabIndex(index: number): number { return this.gridNavigationService.getItemTabIndex(index, this.focusedEmojiIndex); }
  getTabTabIndex(index: number): number { return index === this.focusedTabIndex ? 0 : -1; }

  getRowCount(): number {
    const totalEmojis = this.searchString ? Object.keys(this.searchEmojiData).length : this.getTotalEmojiCount();
    return Math.ceil(totalEmojis / this.gridColumns);
  }

  private getTotalEmojiCount(): number {
    return this.emojiDataState.reduce((total, category) => total + Object.keys(category.emojies).length, 0);
  }

  getEmojiPosition(index: number): { row: number; col: number } { return this.gridNavigationService.getRowCol(index, this.gridColumns); }
  onEmojiFocus(index: number): void { this.focusedEmojiIndex = index; }
  getFirstEmoji(category: CometChatEmojiCategory): string { const entries = Object.values(category.emojies); return entries.length > 0 ? entries[0].char : '⬜'; }
  getAriaLabel(): string { return this.ariaLabel || getLocalizedString('accessibility_emoji_picker'); }
}
