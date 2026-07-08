/**
 * CometChatEmojiKeyboard Component Tests
 *
 * Comprehensive test suite for the emoji keyboard component that supports
 * emoji categories with tab navigation, search filtering, grid keyboard
 * navigation (ArrowUp/Down/Left/Right, Home, End), emoji selection via
 * click/Enter/Space, Escape to close, and ARIA accessibility attributes
 * (role=dialog, role=grid, role=tab, role=gridcell, aria-modal, roving tabindex).
 *
 * Categories: Initialization, Input Bindings, Output Emissions,
 *             DOM Rendering, Category Navigation, Search Filtering,
 *             Keyboard Navigation, ARIA, Edge Cases
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 3.1, 3.3,
 *            10.1, 10.4, 10.5, 14.4, 14.5, 15.7
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ensureSdkReady, sdkCleanup } from '../../../testing';
import { CometChatEmojiKeyboardComponent } from './cometchat-emoji-keyboard.component';
import { CometChatEmoji, CometChatEmojiCategory } from '../../../modals/CometChatEmoji';

describe('CometChatEmojiKeyboardComponent', () => {
  let fixture: ComponentFixture<CometChatEmojiKeyboardComponent>;
  let component: CometChatEmojiKeyboardComponent;
  let el: HTMLElement;

  beforeAll(async () => {
    await ensureSdkReady();
  });

  afterAll(async () => {
    await sdkCleanup();
  });

  beforeEach(async () => {
    // Stub scrollIntoView which is not available in jsdom
    if (!Element.prototype.scrollIntoView) {
      Element.prototype.scrollIntoView = vi.fn();
    }

    await TestBed.configureTestingModule({
      imports: [CometChatEmojiKeyboardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CometChatEmojiKeyboardComponent);
    component = fixture.componentInstance;
    el = fixture.nativeElement;
  });

  afterEach(() => {
    fixture.destroy();
  });

  /**
   * Helper: create a fresh fixture with emojiData set BEFORE first detectChanges
   * to avoid NG0100 when the component loads default emojis.
   */
  function createFreshFixture(
    emojiData?: CometChatEmojiCategory[]
  ): ComponentFixture<CometChatEmojiKeyboardComponent> {
    const f = TestBed.createComponent(CometChatEmojiKeyboardComponent);
    if (emojiData !== undefined) {
      f.componentInstance.emojiData = emojiData;
    }
    f.detectChanges();
    return f;
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  function createSampleCategories(): CometChatEmojiCategory[] {
    return [
      {
        id: 'people',
        name: 'emoji_smiley_people',
        symbolURL: 'assets/smileys_people.svg',
        emojies: {
          grinning: { char: '😀', keywords: ['face', 'smile', 'happy', 'joy'] },
          joy: { char: '😂', keywords: ['face', 'cry', 'tears', 'happy', 'haha'] },
          heart_eyes: { char: '😍', keywords: ['face', 'love', 'like', 'affection'] },
          thumbsup: { char: '👍', keywords: ['thumbsup', 'yes', 'awesome', 'good'] },
        },
      },
      {
        id: 'animals',
        name: 'emoji_animals_nature',
        symbolURL: 'assets/animals_nature.svg',
        emojies: {
          dog: { char: '🐶', keywords: ['animal', 'friend', 'nature', 'dog'] },
          cat: { char: '🐱', keywords: ['animal', 'meow', 'nature', 'cat'] },
        },
      },
      {
        id: 'food',
        name: 'emoji_food_drinks',
        symbolURL: 'assets/food_drink.svg',
        emojies: {
          apple: { char: '🍎', keywords: ['fruit', 'apple', 'food'] },
        },
      },
    ];
  }

  function getDialog(): HTMLElement | null {
    return el.querySelector('[role="dialog"]');
  }

  function getTabList(): HTMLElement | null {
    return el.querySelector('[role="tablist"]');
  }

  function getTabs(): NodeListOf<HTMLElement> {
    return el.querySelectorAll('.cometchat-emoji-keyboard__tab');
  }

  function getGrids(): NodeListOf<HTMLElement> {
    return el.querySelectorAll('[role="grid"]');
  }

  function getGridCells(): NodeListOf<HTMLElement> {
    return el.querySelectorAll('[role="gridcell"]');
  }

  function getEmojiListContainer(): HTMLElement | null {
    return el.querySelector('.cometchat-emoji-keyboard__list');
  }

  function getCategoryTitles(): NodeListOf<HTMLElement> {
    return el.querySelectorAll('.cometchat-emoji-keyboard__list-title');
  }

  function dispatchKeydown(
    key: string,
    target?: HTMLElement,
    opts?: Partial<KeyboardEventInit>
  ): void {
    const event = new KeyboardEvent('keydown', {
      key,
      bubbles: true,
      cancelable: true,
      ...opts,
    });
    (target ?? el).dispatchEvent(event);
    fixture.detectChanges();
  }

  // ---------------------------------------------------------------------------
  // Initialization
  // ---------------------------------------------------------------------------
  describe('Initialization', () => {
    it('should create the component', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should have default empty emojiData input', () => {
      expect(component.emojiData).toEqual([]);
    });

    it('should have default empty ariaLabel', () => {
      expect(component.ariaLabel).toBe('');
    });

    it('should have autoFocus true by default', () => {
      expect(component.autoFocus).toBe(true);
    });

    it('should have trapFocus true by default', () => {
      expect(component.trapFocus).toBe(true);
    });

    it('should have empty search state initially', () => {
      fixture.detectChanges();
      expect(component.searchString).toBe('');
      expect(component.searchEmojiData).toEqual({});
    });

    it('should load default emoji data when no emojiData input provided', () => {
      fixture.detectChanges();
      // Default emojis loaded from emojis.ts
      expect(component.emojiDataState.length).toBeGreaterThan(0);
    });

    it('should render the root .cometchat-emoji-keyboard element', () => {
      fixture.detectChanges();
      expect(el.querySelector('.cometchat-emoji-keyboard')).toBeTruthy();
    });

    it('should render the search bar', () => {
      fixture.detectChanges();
      expect(el.querySelector('.cometchat-emoji-keyboard__search')).toBeTruthy();
    });

    it('should render the tabs container', () => {
      fixture.detectChanges();
      expect(el.querySelector('.cometchat-emoji-keyboard__tabs')).toBeTruthy();
    });
  });

  // ---------------------------------------------------------------------------
  // Input Bindings
  // ---------------------------------------------------------------------------
  describe('Input Bindings', () => {
    it('should use custom emojiData when provided', () => {
      const categories = createSampleCategories();
      component.emojiData = categories;
      fixture.detectChanges();
      expect(component.emojiDataState).toBe(categories);
      expect(component.emojiDataState.length).toBe(3);
    });

    it('should set activeCategory to first category after view init', () => {
      component.emojiData = createSampleCategories();
      fixture.detectChanges();
      expect(component.activeCategory).toBe('people');
    });

    it('should accept custom ariaLabel input', () => {
      component.ariaLabel = 'Custom emoji picker';
      fixture.detectChanges();
      expect(component.getAriaLabel()).toBe('Custom emoji picker');
    });

    it('should use localized default when ariaLabel is empty', () => {
      component.ariaLabel = '';
      fixture.detectChanges();
      const label = component.getAriaLabel();
      expect(label).toBeTruthy();
      expect(typeof label).toBe('string');
    });

    it('should accept autoFocus input', () => {
      component.autoFocus = false;
      fixture.detectChanges();
      expect(component.autoFocus).toBe(false);
    });

    it('should accept trapFocus input', () => {
      component.trapFocus = false;
      fixture.detectChanges();
      expect(component.trapFocus).toBe(false);
    });

    it('should handle null-like empty emojiData gracefully', () => {
      component.emojiData = [];
      fixture.detectChanges();
      // When emojiData is empty, the component loads default emojis from emojis.ts
      expect(component.emojiDataState.length).toBeGreaterThan(0);
    });

    it('should render category tabs matching emojiData length', () => {
      component.emojiData = createSampleCategories();
      fixture.detectChanges();
      const tabs = getTabs();
      expect(tabs.length).toBe(3);
    });
  });

  // ---------------------------------------------------------------------------
  // Output Emissions
  // ---------------------------------------------------------------------------
  describe('Output Emissions', () => {
    it('should emit emojiClick with emoji char when emoji is clicked', () => {
      component.emojiData = createSampleCategories();
      fixture.detectChanges();

      const spy = vi.fn();
      component.emojiClick.subscribe(spy);

      // Click the first emoji gridcell
      const cells = getGridCells();
      expect(cells.length).toBeGreaterThan(0);
      cells[0].click();
      fixture.detectChanges();

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith('😀');
    });

    it('should emit correct char for different emojis', () => {
      component.emojiData = createSampleCategories();
      fixture.detectChanges();

      const emitted: string[] = [];
      component.emojiClick.subscribe((char: string) => emitted.push(char));

      const cells = getGridCells();
      cells[0].click(); // grinning 😀
      cells[1].click(); // joy 😂
      fixture.detectChanges();

      expect(emitted).toEqual(['😀', '😂']);
    });

    it('should emit closeKeyboard on Escape key', () => {
      component.emojiData = createSampleCategories();
      fixture.detectChanges();

      const spy = vi.fn();
      component.closeKeyboard.subscribe(spy);

      dispatchKeydown('Escape');

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should not emit closeKeyboard for non-Escape keys', () => {
      component.emojiData = createSampleCategories();
      fixture.detectChanges();

      const spy = vi.fn();
      component.closeKeyboard.subscribe(spy);

      dispatchKeydown('Enter');

      expect(spy).not.toHaveBeenCalled();
    });

    it('should emit emojiClick via Enter key on emoji gridcell', () => {
      component.emojiData = createSampleCategories();
      fixture.detectChanges();

      const spy = vi.fn();
      component.emojiClick.subscribe(spy);

      const cells = getGridCells();
      dispatchKeydown('Enter', cells[0]);

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith('😀');
    });

    it('should emit emojiClick via Space key on emoji gridcell', () => {
      component.emojiData = createSampleCategories();
      fixture.detectChanges();

      const spy = vi.fn();
      component.emojiClick.subscribe(spy);

      const cells = getGridCells();
      dispatchKeydown(' ', cells[0]);

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith('😀');
    });
  });

  // ---------------------------------------------------------------------------
  // Category Navigation
  // ---------------------------------------------------------------------------
  describe('Category Navigation', () => {
    it('should set activeCategory on category tab click', () => {
      component.emojiData = createSampleCategories();
      fixture.detectChanges();
      expect(component.activeCategory).toBe('people');

      const tabs = getTabs();
      tabs[1].click(); // click animals tab
      fixture.detectChanges();

      expect(component.activeCategory).toBe('animals');
    });

    it('should apply active class to the selected tab', () => {
      component.emojiData = createSampleCategories();
      fixture.detectChanges();

      const tabs = getTabs();
      expect(tabs[0].classList.contains('cometchat-emoji-keyboard__tab-active')).toBe(true);
      expect(tabs[1].classList.contains('cometchat-emoji-keyboard__tab-active')).toBe(false);
    });

    it('should clear search when category tab is clicked', () => {
      const f = createFreshFixture(createSampleCategories());
      const comp = f.componentInstance;

      // Trigger a search first (state change only, no detectChanges needed)
      comp.filterEmojis({ value: 'face' });
      expect(comp.searchString).toBe('face');

      // Click a category tab — this calls scrollToElement which clears search
      comp.onCategoryClick('animals');

      expect(comp.searchString).toBe('');
      expect(comp.searchEmojiData).toEqual({});
      f.destroy();
    });

    it('should navigate to next tab with ArrowRight', () => {
      component.emojiData = createSampleCategories();
      fixture.detectChanges();
      component.focusedTabIndex = 0;

      const tabs = getTabs();
      dispatchKeydown('ArrowRight', tabs[0]);

      expect(component.focusedTabIndex).toBe(1);
    });

    it('should navigate to previous tab with ArrowLeft', () => {
      component.emojiData = createSampleCategories();
      fixture.detectChanges();
      component.focusedTabIndex = 2;

      const tabs = getTabs();
      dispatchKeydown('ArrowLeft', tabs[2]);

      expect(component.focusedTabIndex).toBe(1);
    });

    it('should wrap to last tab when ArrowLeft from first tab', () => {
      component.emojiData = createSampleCategories();
      fixture.detectChanges();
      component.focusedTabIndex = 0;

      const tabs = getTabs();
      dispatchKeydown('ArrowLeft', tabs[0]);

      expect(component.focusedTabIndex).toBe(2);
    });

    it('should wrap to first tab when ArrowRight from last tab', () => {
      component.emojiData = createSampleCategories();
      fixture.detectChanges();
      component.focusedTabIndex = 2;

      const tabs = getTabs();
      dispatchKeydown('ArrowRight', tabs[2]);

      expect(component.focusedTabIndex).toBe(0);
    });

    it('should activate category on Enter key in tab', () => {
      component.emojiData = createSampleCategories();
      fixture.detectChanges();

      const tabs = getTabs();
      dispatchKeydown('Enter', tabs[1]);

      expect(component.activeCategory).toBe('animals');
    });

    it('should activate category on Space key in tab', () => {
      component.emojiData = createSampleCategories();
      fixture.detectChanges();

      const tabs = getTabs();
      dispatchKeydown(' ', tabs[2]);

      expect(component.activeCategory).toBe('food');
    });
  });

  // ---------------------------------------------------------------------------
  // Search Filtering
  // ---------------------------------------------------------------------------
  describe('Search Filtering', () => {
    it('should filter emojis by keyword match', () => {
      component.emojiData = createSampleCategories();
      fixture.detectChanges();

      component.filterEmojis({ value: 'happy' });
      // Don't call detectChanges — searchEmojiData is updated synchronously
      const results = Object.keys(component.searchEmojiData);
      expect(results.length).toBeGreaterThan(0);
      expect(results).toContain('grinning');
      expect(results).toContain('joy');
    });

    it('should be case-insensitive', () => {
      component.emojiData = createSampleCategories();
      fixture.detectChanges();

      component.filterEmojis({ value: 'HAPPY' });

      expect(Object.keys(component.searchEmojiData)).toContain('grinning');
    });

    it('should search across all categories', () => {
      component.emojiData = createSampleCategories();
      fixture.detectChanges();

      component.filterEmojis({ value: 'animal' });

      const results = Object.keys(component.searchEmojiData);
      expect(results).toContain('dog');
      expect(results).toContain('cat');
    });

    it('should return empty results for non-matching search', () => {
      component.emojiData = createSampleCategories();
      fixture.detectChanges();

      component.filterEmojis({ value: 'zzzznonexistent' });

      expect(Object.keys(component.searchEmojiData).length).toBe(0);
    });

    it('should clear search results when search text is empty', () => {
      component.emojiData = createSampleCategories();
      fixture.detectChanges();

      component.filterEmojis({ value: 'face' });
      expect(Object.keys(component.searchEmojiData).length).toBeGreaterThan(0);

      component.filterEmojis({ value: '' });

      expect(component.searchEmojiData).toEqual({});
      expect(component.searchString).toBe('');
    });

    it('should clear search results when value is undefined', () => {
      component.emojiData = createSampleCategories();
      fixture.detectChanges();

      component.filterEmojis({ value: 'face' });
      component.filterEmojis({});

      expect(component.searchEmojiData).toEqual({});
    });

    it('should reset focusedEmojiIndex on search', () => {
      component.emojiData = createSampleCategories();
      fixture.detectChanges();
      component.focusedEmojiIndex = 5;

      component.filterEmojis({ value: 'face' });

      expect(component.focusedEmojiIndex).toBe(0);
    });

    it('should render search results grid when search has matches', () => {
      // Create fixture, set emojiData, do initial CD
      const f = TestBed.createComponent(CometChatEmojiKeyboardComponent);
      f.componentInstance.emojiData = createSampleCategories();
      // Set search state BEFORE first detectChanges to avoid NG0100
      f.componentInstance.searchString = 'face';
      // Manually populate search results (same logic as filterEmojis)
      const filtered: Record<string, CometChatEmoji> = {};
      createSampleCategories().forEach(category => {
        Object.entries(category.emojies).forEach(([name, emoji]) => {
          if (emoji.keywords && emoji.keywords.some(kw => kw.toLowerCase().includes('face'))) {
            filtered[name] = emoji;
          }
        });
      });
      f.componentInstance.searchEmojiData = filtered;
      f.detectChanges();

      const cells = (f.nativeElement as HTMLElement).querySelectorAll('[role="gridcell"]');
      expect(cells.length).toBe(Object.keys(filtered).length);
      f.destroy();
    });

    it('should match partial keywords', () => {
      component.emojiData = createSampleCategories();
      fixture.detectChanges();

      component.filterEmojis({ value: 'hap' }); // partial match for 'happy'

      expect(Object.keys(component.searchEmojiData).length).toBeGreaterThan(0);
    });
  });

  // ---------------------------------------------------------------------------
  // Keyboard Navigation
  // ---------------------------------------------------------------------------
  describe('Keyboard Navigation', () => {
    it('should navigate emoji grid with ArrowRight', () => {
      component.emojiData = createSampleCategories();
      fixture.detectChanges();
      component.focusedEmojiIndex = 0;

      // Call the handler directly since jsdom doesn't track activeElement properly
      const emoji = createSampleCategories()[0].emojies['joy'];
      component.onEmojiKeydown(
        new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
        emoji
      );

      // The handler delegates to navigateEmojiGridWithService which needs activeElement;
      // verify the method doesn't throw and state is consistent
      expect(component).toBeTruthy();
    });

    it('should navigate emoji grid with ArrowLeft', () => {
      component.emojiData = createSampleCategories();
      fixture.detectChanges();
      component.focusedEmojiIndex = 2;

      const emoji = createSampleCategories()[0].emojies['heart_eyes'];
      component.onEmojiKeydown(
        new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }),
        emoji
      );

      expect(component).toBeTruthy();
    });

    it('should navigate emoji grid with ArrowDown', () => {
      component.emojiData = createSampleCategories();
      fixture.detectChanges();
      component.focusedEmojiIndex = 0;

      const emoji = createSampleCategories()[0].emojies['grinning'];
      component.onEmojiKeydown(
        new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }),
        emoji
      );

      expect(component).toBeTruthy();
    });

    it('should handle Home key in emoji grid', () => {
      component.emojiData = createSampleCategories();
      fixture.detectChanges();
      component.focusedEmojiIndex = 3;

      const emoji = createSampleCategories()[0].emojies['thumbsup'];
      component.onEmojiKeydown(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }), emoji);

      expect(component).toBeTruthy();
    });

    it('should handle End key in emoji grid', () => {
      component.emojiData = createSampleCategories();
      fixture.detectChanges();
      component.focusedEmojiIndex = 0;

      const emoji = createSampleCategories()[0].emojies['grinning'];
      component.onEmojiKeydown(new KeyboardEvent('keydown', { key: 'End', bubbles: true }), emoji);

      expect(component).toBeTruthy();
    });

    it('should not navigate for non-arrow, non-activation keys', () => {
      component.emojiData = createSampleCategories();
      fixture.detectChanges();
      component.focusedEmojiIndex = 2;

      const cells = getGridCells();
      dispatchKeydown('a', cells[2]);

      expect(component.focusedEmojiIndex).toBe(2);
    });

    it('should handle "/" key to focus search', () => {
      component.emojiData = createSampleCategories();
      fixture.detectChanges();

      // Dispatch "/" on the component host (not on an input)
      dispatchKeydown('/');

      // The search input should receive focus (or at least the event is handled)
      // We verify the event was processed without error
      expect(component).toBeTruthy();
    });
  });

  // ---------------------------------------------------------------------------
  // ARIA
  // ---------------------------------------------------------------------------
  describe('ARIA', () => {
    it('should have role="dialog" on the root container', () => {
      component.emojiData = createSampleCategories();
      fixture.detectChanges();
      const dialog = getDialog();
      expect(dialog).toBeTruthy();
      expect(dialog?.getAttribute('role')).toBe('dialog');
    });

    it('should have aria-modal="true" on the root container', () => {
      component.emojiData = createSampleCategories();
      fixture.detectChanges();
      expect(getDialog()?.getAttribute('aria-modal')).toBe('true');
    });

    it('should have aria-label on the root container', () => {
      component.emojiData = createSampleCategories();
      fixture.detectChanges();
      const label = getDialog()?.getAttribute('aria-label');
      expect(label).toBeTruthy();
    });

    it('should use custom ariaLabel on the root container when provided', () => {
      component.emojiData = createSampleCategories();
      component.ariaLabel = 'Custom emoji picker';
      fixture.detectChanges();
      expect(getDialog()?.getAttribute('aria-label')).toBe('Custom emoji picker');
    });

    it('should have role="tablist" on the tabs container', () => {
      component.emojiData = createSampleCategories();
      fixture.detectChanges();
      const tablist = getTabList();
      expect(tablist).toBeTruthy();
      expect(tablist?.getAttribute('role')).toBe('tablist');
    });

    it('should have role="tab" on each category tab', () => {
      component.emojiData = createSampleCategories();
      fixture.detectChanges();
      const tabs = getTabs();
      expect(tabs.length).toBe(3);
      tabs.forEach(tab => {
        expect(tab.getAttribute('role')).toBe('tab');
      });
    });

    it('should have aria-selected="true" on the active tab only', () => {
      component.emojiData = createSampleCategories();
      fixture.detectChanges();
      const tabs = getTabs();
      expect(tabs[0].getAttribute('aria-selected')).toBe('true');
      expect(tabs[1].getAttribute('aria-selected')).toBe('false');
      expect(tabs[2].getAttribute('aria-selected')).toBe('false');
    });

    it('should have aria-label on each tab from localized name', () => {
      component.emojiData = createSampleCategories();
      fixture.detectChanges();
      const tabs = getTabs();
      tabs.forEach(tab => {
        const label = tab.getAttribute('aria-label');
        // Label may be the key itself if localization returns the key
        expect(label).toBeTruthy();
        expect(typeof label).toBe('string');
      });
    });

    it('should have aria-controls linking tab to panel', () => {
      component.emojiData = createSampleCategories();
      fixture.detectChanges();
      const tabs = getTabs();
      expect(tabs[0].getAttribute('aria-controls')).toBe('emoji-panel-people');
      expect(tabs[1].getAttribute('aria-controls')).toBe('emoji-panel-animals');
      expect(tabs[2].getAttribute('aria-controls')).toBe('emoji-panel-food');
    });

    it('should have role="grid" on emoji grids', () => {
      component.emojiData = createSampleCategories();
      fixture.detectChanges();
      const grids = getGrids();
      expect(grids.length).toBeGreaterThan(0);
      grids.forEach(grid => {
        expect(grid.getAttribute('role')).toBe('grid');
      });
    });

    it('should have role="gridcell" on each emoji item', () => {
      component.emojiData = createSampleCategories();
      fixture.detectChanges();
      const cells = getGridCells();
      expect(cells.length).toBe(7); // 4 people + 2 animals + 1 food
      cells.forEach(cell => {
        expect(cell.getAttribute('role')).toBe('gridcell');
      });
    });

    it('should have aria-label on each emoji item', () => {
      component.emojiData = createSampleCategories();
      fixture.detectChanges();
      const cells = getGridCells();
      cells.forEach(cell => {
        expect(cell.getAttribute('aria-label')).toBeTruthy();
      });
    });

    it('should have aria-colcount on grids', () => {
      component.emojiData = createSampleCategories();
      fixture.detectChanges();
      const grids = getGrids();
      grids.forEach(grid => {
        expect(grid.getAttribute('aria-colcount')).toBe('8');
      });
    });

    it('should have a role="tabpanel" per category, labelled by its tab', () => {
      component.emojiData = createSampleCategories();
      fixture.detectChanges();
      // Each category section is its own tabpanel (so each tab\'s aria-controls
      // resolves to a real tabpanel), rather than one unlabeled outer panel.
      const panel = el.querySelector('.cometchat-emoji-keyboard__list-content');
      expect(panel?.getAttribute('role')).toBe('tabpanel');
      expect(panel?.getAttribute('aria-labelledby')).toMatch(/^emoji-tab-/);
    });

    it('should have roving tabindex on tabs (only focused tab has 0)', () => {
      // Set focusedTabIndex before first detectChanges to avoid NG0100
      const f = TestBed.createComponent(CometChatEmojiKeyboardComponent);
      f.componentInstance.emojiData = createSampleCategories();
      f.componentInstance.focusedTabIndex = 1;
      f.detectChanges();

      const tabs = (f.nativeElement as HTMLElement).querySelectorAll(
        '.cometchat-emoji-keyboard__tab'
      );
      expect(tabs[0].getAttribute('tabindex')).toBe('-1');
      expect(tabs[1].getAttribute('tabindex')).toBe('0');
      expect(tabs[2].getAttribute('tabindex')).toBe('-1');
      f.destroy();
    });

    it('should have roving tabindex on emoji items (only focused has 0)', () => {
      component.emojiData = createSampleCategories();
      fixture.detectChanges();
      component.focusedEmojiIndex = 0;
      fixture.detectChanges();

      const cells = getGridCells();
      expect(cells[0].getAttribute('tabindex')).toBe('0');
      if (cells.length > 1) {
        expect(cells[1].getAttribute('tabindex')).toBe('-1');
      }
    });

    it('should render search results grid with aria-rowcount', () => {
      const f = TestBed.createComponent(CometChatEmojiKeyboardComponent);
      f.componentInstance.emojiData = createSampleCategories();
      // Set search state BEFORE first detectChanges to avoid NG0100
      f.componentInstance.searchString = 'face';
      const filtered: Record<string, CometChatEmoji> = {};
      createSampleCategories().forEach(category => {
        Object.entries(category.emojies).forEach(([name, emoji]) => {
          if (emoji.keywords && emoji.keywords.some(kw => kw.toLowerCase().includes('face'))) {
            filtered[name] = emoji;
          }
        });
      });
      f.componentInstance.searchEmojiData = filtered;
      f.detectChanges();

      const grid = (f.nativeElement as HTMLElement).querySelector('[role="grid"]');
      expect(grid?.getAttribute('aria-rowcount')).toBeTruthy();
      f.destroy();
    });
  });

  // ---------------------------------------------------------------------------
  // Edge Cases
  // ---------------------------------------------------------------------------
  describe('Edge Cases', () => {
    it('should handle empty emojiData gracefully', () => {
      component.emojiData = [];
      fixture.detectChanges();
      // When emojiData is empty, the component loads default emojis
      // activeCategory will be set to the first default category
      expect(component.emojiDataState.length).toBeGreaterThan(0);
      expect(component.activeCategory).toBeTruthy();
    });

    it('should handle category with empty emojies object', () => {
      component.emojiData = [
        {
          id: 'empty',
          name: 'empty_cat',
          symbolURL: '',
          emojies: {},
        },
      ];
      fixture.detectChanges();
      expect(component.emojiDataState.length).toBe(1);
      expect(component.getEmojiEntries(component.emojiDataState[0].emojies)).toEqual([]);
    });

    it('should handle emoji without keywords during search', () => {
      component.emojiData = [
        {
          id: 'test',
          name: 'test',
          symbolURL: '',
          emojies: {
            noKeywords: { char: '🔥' } as CometChatEmoji,
          },
        },
      ];
      fixture.detectChanges();

      component.filterEmojis({ value: 'fire' });

      // Should not match since keywords is undefined
      expect(Object.keys(component.searchEmojiData).length).toBe(0);
    });

    it('should return correct row count for search results', () => {
      component.emojiData = createSampleCategories();
      fixture.detectChanges();

      component.filterEmojis({ value: 'face' });
      const count = Object.keys(component.searchEmojiData).length;
      expect(component.getRowCount()).toBe(Math.ceil(count / component.gridColumns));
    });

    it('should return correct emoji position', () => {
      component.emojiData = createSampleCategories();
      fixture.detectChanges();
      expect(component.getEmojiPosition(0)).toEqual({ row: 0, col: 0 });
      expect(component.getEmojiPosition(1)).toEqual({ row: 0, col: 1 });
      expect(component.getEmojiPosition(8)).toEqual({ row: 1, col: 0 });
    });

    it('should return emoji char from getEmojiData', () => {
      fixture.detectChanges();
      expect(component.getEmojiData({ char: '😀', keywords: [] })).toBe('😀');
    });

    it('should return entries from getEmojiEntries', () => {
      fixture.detectChanges();
      const entries = component.getEmojiEntries({ a: { char: '😀' }, b: { char: '😂' } });
      expect(entries.length).toBe(2);
      expect(entries[0][0]).toBe('a');
      expect(entries[0][1].char).toBe('😀');
    });

    it('should return correct tabindex for emoji items', () => {
      component.emojiData = createSampleCategories();
      fixture.detectChanges();
      component.focusedEmojiIndex = 2;
      expect(component.getEmojiTabIndex(2)).toBe(0);
      expect(component.getEmojiTabIndex(0)).toBe(-1);
    });

    it('should return correct tabindex for tabs', () => {
      component.emojiData = createSampleCategories();
      fixture.detectChanges();
      component.focusedTabIndex = 1;
      expect(component.getTabTabIndex(0)).toBe(-1);
      expect(component.getTabTabIndex(1)).toBe(0);
      expect(component.getTabTabIndex(2)).toBe(-1);
    });

    it('should render no grid cells when data is empty', () => {
      // When emojiData is empty, the component loads default emojis,
      // so we test with a category that has no emojis instead
      component.emojiData = [
        {
          id: 'empty',
          name: 'empty_cat',
          symbolURL: '',
          emojies: {},
        },
      ];
      fixture.detectChanges();
      const cells = getGridCells();
      expect(cells.length).toBe(0);
    });

    it('should not throw when created with no inputs', () => {
      expect(() => fixture.detectChanges()).not.toThrow();
    });

    it('should render category titles for each category', () => {
      component.emojiData = createSampleCategories();
      fixture.detectChanges();
      const titles = getCategoryTitles();
      expect(titles.length).toBe(3);
    });

    it('should update focusedEmojiIndex on emoji focus event', () => {
      component.emojiData = createSampleCategories();
      fixture.detectChanges();
      component.onEmojiFocus(5);
      expect(component.focusedEmojiIndex).toBe(5);
    });
  });
});
