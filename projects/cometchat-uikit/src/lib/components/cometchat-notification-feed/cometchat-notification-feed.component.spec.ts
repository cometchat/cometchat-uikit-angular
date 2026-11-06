/**
 * CometChatNotificationFeed Component Tests
 *
 * Categories: Defaults, Lifecycle, State wiring, Scroll pagination,
 *             Interactions, Visibility tracking, TrackBy, Card JSON,
 *             Fallback text, Counts.
 *
 * The component constructs its own NotificationFeedViewModel and
 * VisibilityTracker rather than receiving them by injection, so both modules
 * are mocked here to keep the component under test and off the network.
 *
 * @module components/cometchat-notification-feed
 */

import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';

/** Shape of the NotificationFeedViewModel double (declared up front so vi.hoisted can reference it). */
interface MockViewModelType {
  init: Mock;
  dispose: Mock;
  fetchNextPage: Mock;
  refresh: Mock;
  retryPagination: Mock;
  switchCategory: Mock;
  reportViewed: Mock;
  reportRead: Mock;
  reportClicked: Mock;
  reportInteracted: Mock;
  onState: (s: unknown) => void;
  feedBuilder?: unknown;
  categoriesBuilder?: unknown;
}

/** Shape of the VisibilityTracker double. */
interface MockTrackerType {
  init: Mock;
  dispose: Mock;
  observe: Mock;
  reset: Mock;
  onViewed: (item: unknown) => void;
  onRead: (item: unknown) => void;
}

// ---------------------------------------------------------------------------
// Module mocks — declared before the component import so the class picks them up
// ---------------------------------------------------------------------------

// vi.mock factories are hoisted above ordinary declarations, so the doubles are
// built inside vi.hoisted() — otherwise the factory runs before the classes exist.
const { MockViewModel, MockTracker, viewModelInstances, trackerInstances } = vi.hoisted(() => {
  const viewModelInstances: MockViewModelType[] = [];
  const trackerInstances: MockTrackerType[] = [];

  class MockViewModel implements MockViewModelType {
    init = vi.fn();
    dispose = vi.fn();
    fetchNextPage = vi.fn();
    refresh = vi.fn();
    retryPagination = vi.fn();
    switchCategory = vi.fn();
    reportViewed = vi.fn();
    reportRead = vi.fn();
    reportClicked = vi.fn();
    reportInteracted = vi.fn();

    constructor(
      public onState: (s: unknown) => void,
      public feedBuilder?: unknown,
      public categoriesBuilder?: unknown
    ) {
      viewModelInstances.push(this);
    }
  }

  class MockTracker implements MockTrackerType {
    init = vi.fn();
    dispose = vi.fn();
    observe = vi.fn();
    reset = vi.fn();

    constructor(
      public onViewed: (item: unknown) => void,
      public onRead: (item: unknown) => void
    ) {
      trackerInstances.push(this);
    }
  }

  return { MockViewModel, MockTracker, viewModelInstances, trackerInstances };
});


vi.mock('./cometchat-notification-feed-view-model', () => ({
  NotificationFeedViewModel: MockViewModel,
}));

vi.mock('./cometchat-notification-feed.utils', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return { ...actual, VisibilityTracker: MockTracker };
});

import { Component, TemplateRef, ViewChild } from '@angular/core';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { CometChatCardViewComponent } from '@cometchat/cards-angular';
import { CometChatNotificationFeedComponent } from './cometchat-notification-feed.component';
import type {
  NotificationFeedItem,
  NotificationFeedState,
} from './cometchat-notification-feed.types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function feedItem(id: string, content: unknown = { title: 'Hello' }): NotificationFeedItem {
  return {
    getId: () => id,
    getContent: () => content,
  } as unknown as NotificationFeedItem;
}

/** A feed item with everything the template reads, for rendered-list tests. */
function renderableItem(id: string, readAt: number | null = null): NotificationFeedItem {
  return {
    getId: () => id,
    getContent: () => ({ version: '1.0', body: [{ type: 'text', id: 'greeting', content: 'Hello' }] }),
    getReadAt: () => readAt,
    getCategory: () => 'promos',
    getSentAt: () => 1_700_000_000,
  } as unknown as NotificationFeedItem;
}

/** Loaded state showing the given items in one group. */
function loadedWith(...items: NotificationFeedItem[]): NotificationFeedState {
  return state({ screenState: 'loaded', items, groupedItems: [{ label: 'Today', items }] as never });
}

/** A feed item whose getContent() throws. */
function brokenItem(id = 'broken'): NotificationFeedItem {
  return {
    getId: () => id,
    getContent: () => {
      throw new Error('no content');
    },
  } as unknown as NotificationFeedItem;
}

function state(over: Partial<NotificationFeedState> = {}): NotificationFeedState {
  return {
    items: [],
    groupedItems: [],
    categories: [],
    activeCategory: null,
    totalUnreadCount: 0,
    categoryUnreadCounts: new Map(),
    screenState: 'loaded',
    isLoadingMore: false,
    isRefreshing: false,
    isOffline: false,
    error: null,
    hasMorePages: true,
    paginationError: false,
    ...over,
  } as NotificationFeedState;
}

/** A scroll event whose target reports the given geometry. */
function scrollEvent(scrollTop: number, scrollHeight = 1000, clientHeight = 400): Event {
  return {
    target: { scrollTop, scrollHeight, clientHeight },
  } as unknown as Event;
}

describe('CometChatNotificationFeedComponent', () => {
  let fixture: ComponentFixture<CometChatNotificationFeedComponent>;
  let component: CometChatNotificationFeedComponent;

  /** The view model the component built for this fixture. */
  const vm = (): MockViewModelType => viewModelInstances[viewModelInstances.length - 1];
  const tracker = (): MockTrackerType => trackerInstances[trackerInstances.length - 1];

  beforeEach(async () => {
    viewModelInstances.length = 0;
    trackerInstances.length = 0;

    await TestBed.configureTestingModule({
      imports: [CometChatNotificationFeedComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CometChatNotificationFeedComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // -------------------------------------------------------------------------
  // Defaults
  // -------------------------------------------------------------------------

  describe('Defaults', () => {
    it('should create the component', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should default title to an empty string', () => {
      expect(component.title).toBe('');
    });

    it('should show the header by default', () => {
      expect(component.showHeader).toBe(true);
    });

    it('should hide the back button by default', () => {
      expect(component.showBackButton).toBe(false);
    });

    it('should show filter chips by default', () => {
      expect(component.showFilterChips).toBe(true);
    });

    it('should default cardThemeMode to auto', () => {
      expect(component.cardThemeMode).toBe('auto');
    });

    it('should start in the loading screen state', () => {
      expect(component.state().screenState).toBe('loading');
    });

    it('should start with no items', () => {
      expect(component.state().items).toEqual([]);
    });
  });

  // -------------------------------------------------------------------------
  // Lifecycle
  // -------------------------------------------------------------------------

  describe('Lifecycle', () => {
    it('should build and initialise a view model on init', () => {
      fixture.detectChanges();
      expect(viewModelInstances).toHaveLength(1);
      expect(vm().init).toHaveBeenCalledTimes(1);
    });

    it('should pass both request builders to the view model', () => {
      const feedBuilder = { kind: 'feed' };
      const categoriesBuilder = { kind: 'categories' };
      component.notificationFeedRequestBuilder = feedBuilder;
      component.notificationCategoriesRequestBuilder = categoriesBuilder;

      fixture.detectChanges();

      expect(vm().feedBuilder).toBe(feedBuilder);
      expect(vm().categoriesBuilder).toBe(categoriesBuilder);
    });

    it('should create and initialise a visibility tracker after view init', () => {
      fixture.detectChanges();
      expect(trackerInstances).toHaveLength(1);
      expect(tracker().init).toHaveBeenCalled();
    });

    it('should dispose the view model and tracker on destroy', () => {
      fixture.detectChanges();
      const model = vm();
      const track = tracker();

      fixture.destroy();

      expect(model.dispose).toHaveBeenCalledTimes(1);
      expect(track.dispose).toHaveBeenCalledTimes(1);
    });

    it('should not throw when destroyed before init', () => {
      expect(() => fixture.destroy()).not.toThrow();
    });
  });

  // -------------------------------------------------------------------------
  // State wiring
  // -------------------------------------------------------------------------

  describe('State wiring', () => {
    it('should adopt state pushed by the view model', () => {
      fixture.detectChanges();
      vm().onState(state({ screenState: 'loaded', totalUnreadCount: 4 }));

      expect(component.state().screenState).toBe('loaded');
      expect(component.state().totalUnreadCount).toBe(4);
    });

    it('should copy the state rather than hold the view model object', () => {
      fixture.detectChanges();
      const pushed = state({ totalUnreadCount: 1 });
      vm().onState(pushed);

      expect(component.state()).not.toBe(pushed);
    });

    it('should emit the error output when the state carries an error', () => {
      fixture.detectChanges();
      const spy = vi.fn();
      component.error.subscribe(spy);

      const err = { code: 'ERR' } as unknown as CometChat.CometChatException;
      vm().onState(state({ error: err }));

      expect(spy).toHaveBeenCalledWith(err);
    });

    it('should not emit error for a clean state', () => {
      fixture.detectChanges();
      const spy = vi.fn();
      component.error.subscribe(spy);

      vm().onState(state());
      expect(spy).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // Scroll pagination
  // -------------------------------------------------------------------------

  describe('Scroll pagination', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should fetch the next page near the bottom', () => {
      vm().onState(state({ hasMorePages: true, isLoadingMore: false }));
      component.onScroll(scrollEvent(550));
      expect(vm().fetchNextPage).toHaveBeenCalled();
    });

    it('should not fetch while far from the bottom', () => {
      vm().onState(state({ hasMorePages: true }));
      component.onScroll(scrollEvent(0));
      expect(vm().fetchNextPage).not.toHaveBeenCalled();
    });

    it('should not fetch while a page is already loading', () => {
      vm().onState(state({ hasMorePages: true, isLoadingMore: true }));
      component.onScroll(scrollEvent(550));
      expect(vm().fetchNextPage).not.toHaveBeenCalled();
    });

    it('should not fetch when there are no more pages', () => {
      vm().onState(state({ hasMorePages: false }));
      component.onScroll(scrollEvent(550));
      expect(vm().fetchNextPage).not.toHaveBeenCalled();
    });

    it('should treat the exact threshold as not yet at the bottom', () => {
      vm().onState(state({ hasMorePages: true }));
      // scrollHeight - scrollTop - clientHeight === 100, the threshold itself
      component.onScroll(scrollEvent(500));
      expect(vm().fetchNextPage).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // Interactions
  // -------------------------------------------------------------------------

  describe('Interactions', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should report and emit an item click', () => {
      const spy = vi.fn();
      component.itemClick.subscribe(spy);
      const item = feedItem('a');

      component.onItemClick(item);

      expect(vm().reportClicked).toHaveBeenCalledWith(item);
      expect(spy).toHaveBeenCalledWith(item);
    });

    it('should report and emit a card action, unwrapping the renderer event', () => {
      const spy = vi.fn();
      component.actionClick.subscribe(spy);
      const item = feedItem('a');
      const action = { type: 'openUrl' };

      component.onCardAction(item, { action } as never);

      expect(vm().reportInteracted).toHaveBeenCalledWith(item);
      expect(spy).toHaveBeenCalledWith({ item, action });
    });

    it('should tolerate a card action event with no action', () => {
      const spy = vi.fn();
      component.actionClick.subscribe(spy);
      const item = feedItem('a');

      component.onCardAction(item, undefined as never);
      expect(spy).toHaveBeenCalledWith({ item, action: undefined });
    });

    it('should switch category on a chip click', () => {
      component.onChipClick('mentions');
      expect(vm().switchCategory).toHaveBeenCalledWith('mentions');
    });

    it('should switch back to all categories', () => {
      component.onChipClick(null);
      expect(vm().switchCategory).toHaveBeenCalledWith(null);
    });

    it('should reset the visibility tracker when switching category', () => {
      component.onChipClick('mentions');
      expect(tracker().reset).toHaveBeenCalled();
    });

    it('should refresh on retry', () => {
      component.onRetry();
      expect(vm().refresh).toHaveBeenCalled();
    });

    it('should retry pagination separately', () => {
      component.onRetryPagination();
      expect(vm().retryPagination).toHaveBeenCalled();
    });

    it('should emit backClick', () => {
      const spy = vi.fn();
      component.backClick.subscribe(spy);

      component.onBackClick();
      expect(spy).toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // Visibility tracking
  // -------------------------------------------------------------------------

  describe('Visibility tracking', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should observe an item element', () => {
      const el = document.createElement('div');
      const item = feedItem('a');

      component.observeItem(el, item);
      expect(tracker().observe).toHaveBeenCalledWith(el, item);
    });

    it('should return null so it can be used in an attribute binding', () => {
      expect(component.observeItem(document.createElement('div'), feedItem('a'))).toBeNull();
    });

    it('should observe each item only once', () => {
      const el = document.createElement('div');
      const item = feedItem('a');

      component.observeItem(el, item);
      component.observeItem(el, item);
      component.observeItem(el, item);

      expect(tracker().observe).toHaveBeenCalledTimes(1);
    });

    it('should observe distinct items separately', () => {
      component.observeItem(document.createElement('div'), feedItem('a'));
      component.observeItem(document.createElement('div'), feedItem('b'));
      expect(tracker().observe).toHaveBeenCalledTimes(2);
    });

    it('should re-observe an item after a category switch clears the set', () => {
      const el = document.createElement('div');
      const item = feedItem('a');

      component.observeItem(el, item);
      component.onChipClick('mentions');
      component.observeItem(el, item);

      expect(tracker().observe).toHaveBeenCalledTimes(2);
    });

    it('should ignore a null element', () => {
      component.observeItem(null as unknown as HTMLElement, feedItem('a'));
      expect(tracker().observe).not.toHaveBeenCalled();
    });

    it('should forward viewed and read reports to the view model', () => {
      const item = feedItem('a');
      tracker().onViewed(item);
      tracker().onRead(item);

      expect(vm().reportViewed).toHaveBeenCalledWith(item);
      expect(vm().reportRead).toHaveBeenCalledWith(item);
    });
  });

  // -------------------------------------------------------------------------
  // TrackBy functions
  // -------------------------------------------------------------------------

  describe('TrackBy functions', () => {
    it('should track a group by its label', () => {
      expect(component.trackByGroup(0, { label: 'Today', items: [] } as never)).toBe('Today');
    });

    it('should track an item by its id', () => {
      expect(component.trackByItem(0, feedItem('item-7'))).toBe('item-7');
    });

    it('should track a category by its id', () => {
      expect(component.trackByCategory(0, { id: 'cat-1', name: 'Promos' } as never)).toBe('cat-1');
    });
  });

  // -------------------------------------------------------------------------
  // Card JSON
  // -------------------------------------------------------------------------

  describe('getCardJson', () => {
    it('passes a string through unchanged', () => {
      expect(component.getCardJson(feedItem('a', '{"x":1}'))).toBe('{"x":1}');
    });

    it('serialises an object', () => {
      expect(component.getCardJson(feedItem('a', { x: 1 }))).toBe('{"x":1}');
    });

    it('returns an empty string when getContent throws', () => {
      expect(component.getCardJson(brokenItem())).toBe('');
    });

    it('returns an empty string for unserialisable content', () => {
      const circular: Record<string, unknown> = {};
      circular['self'] = circular;
      expect(component.getCardJson(feedItem('a', circular))).toBe('');
    });
  });

  // -------------------------------------------------------------------------
  // Fallback text
  // -------------------------------------------------------------------------

  describe('getFallbackText', () => {
    it('prefers a top-level title', () => {
      expect(component.getFallbackText(feedItem('a', { title: 'Sale' }))).toBe('Sale');
    });

    it('falls back to body.text', () => {
      expect(component.getFallbackText(feedItem('a', { body: { text: 'Body copy' } }))).toBe(
        'Body copy'
      );
    });

    it('falls back to header.title', () => {
      expect(component.getFallbackText(feedItem('a', { header: { title: 'Head' } }))).toBe('Head');
    });

    it('falls back to an explicit fallbackText', () => {
      expect(component.getFallbackText(feedItem('a', { fallbackText: 'Plain' }))).toBe('Plain');
    });

    it('reads the first text block from a body array', () => {
      const content = { body: [{ type: 'Image' }, { type: 'TextBlock', text: 'Block copy' }] };
      expect(component.getFallbackText(feedItem('a', content))).toBe('Block copy');
    });

    it('parses stringified card content', () => {
      expect(component.getFallbackText(feedItem('a', JSON.stringify({ title: 'Parsed' })))).toBe(
        'Parsed'
      );
    });

    it('returns the localized fallback for empty content', () => {
      expect(component.getFallbackText(feedItem('a', null))).toBeTruthy();
    });

    it('returns the localized fallback for unrecognised content', () => {
      expect(component.getFallbackText(feedItem('a', { unknown: true }))).toBeTruthy();
    });

    it('returns the localized fallback for malformed JSON', () => {
      expect(component.getFallbackText(feedItem('a', '{not json'))).toBeTruthy();
    });

    it('returns the localized fallback when getContent throws', () => {
      expect(component.getFallbackText(brokenItem())).toBeTruthy();
    });

    it('prefers title over every later candidate', () => {
      const content = { title: 'First', body: { text: 'Second' }, fallbackText: 'Third' };
      expect(component.getFallbackText(feedItem('a', content))).toBe('First');
    });
  });

  // -------------------------------------------------------------------------
  // Counts
  // -------------------------------------------------------------------------

  describe('Counts', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('reads a category unread count from state', () => {
      vm().onState(state({ categoryUnreadCounts: new Map([['promos', 5]]) }));
      expect(component.getCategoryUnreadCount('promos')).toBe(5);
    });

    it('returns zero for an unknown category', () => {
      vm().onState(state({ categoryUnreadCounts: new Map() }));
      expect(component.getCategoryUnreadCount('missing')).toBe(0);
    });

    it.each([
      [0, '0'],
      [50, '50'],
      [99, '99'],
      [100, '99+'],
      [1000, '99+'],
    ])('formats a badge count of %i as "%s"', (count, expected) => {
      expect(component.formatBadgeCount(count)).toBe(expected);
    });
  });

  // -------------------------------------------------------------------------
  // Date format
  // -------------------------------------------------------------------------

  describe('feedDateFormat', () => {
    it('supplies today, yesterday and other-day patterns', () => {
      const format = component.feedDateFormat;
      expect(format.today).toBeTruthy();
      expect(format.yesterday).toBeTruthy();
      expect(format.otherDays).toBeTruthy();
    });

    it('wraps the yesterday label in brackets so it stays literal', () => {
      expect(component.feedDateFormat.yesterday).toMatch(/^\[.*\]$/);
    });

    it('is cached per language rather than rebuilt each read', () => {
      expect(component.feedDateFormat).toBe(component.feedDateFormat);
    });
  });

  // -------------------------------------------------------------------------
  // Inputs — each one set and checked against what renders
  // -------------------------------------------------------------------------

  describe('Inputs', () => {
    const q = (selector: string): HTMLElement | null =>
      fixture.nativeElement.querySelector(selector);

    /** Push a state from the view model and re-render. */
    const push = (s: NotificationFeedState): void => {
      vm().onState(s);
      fixture.detectChanges();
    };

    it('title replaces the localized default in the header', () => {
      fixture.detectChanges();
      const defaultTitle = q('.cometchat-notification-feed__header-title')!.textContent!.trim();

      fixture.componentRef.setInput('title', 'Promotions');
      fixture.detectChanges();

      expect(q('.cometchat-notification-feed__header-title')!.textContent!.trim()).toBe('Promotions');
      expect(defaultTitle).not.toBe('Promotions');
      expect(defaultTitle).not.toBe('');
    });

    it('showHeader=false removes the header', () => {
      fixture.detectChanges();
      expect(q('.cometchat-notification-feed__header')).not.toBeNull();

      fixture.componentRef.setInput('showHeader', false);
      fixture.detectChanges();

      expect(q('.cometchat-notification-feed__header')).toBeNull();
    });

    it('showBackButton=true renders a back button that emits backClick', () => {
      fixture.detectChanges();
      expect(q('.cometchat-notification-feed__header-back')).toBeNull();

      fixture.componentRef.setInput('showBackButton', true);
      fixture.detectChanges();
      const spy = vi.fn();
      component.backClick.subscribe(spy);
      q('.cometchat-notification-feed__header-back')!.click();

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('showFilterChips=false removes the filter chips', () => {
      fixture.detectChanges();
      expect(q('.cometchat-notification-feed__chips')).not.toBeNull();

      fixture.componentRef.setInput('showFilterChips', false);
      fixture.detectChanges();

      expect(q('.cometchat-notification-feed__chips')).toBeNull();
    });

    it('style colours the container, header, active chip, unread dot and card', () => {
      fixture.componentRef.setInput('style', {
        backgroundColor: 'rgb(1, 2, 3)',
        width: '320px',
        height: '480px',
        headerTitleColor: 'rgb(4, 5, 6)',
        chipActiveBackgroundColor: 'rgb(7, 8, 9)',
        unreadIndicatorColor: 'rgb(10, 11, 12)',
        cardBackgroundColor: 'rgb(13, 14, 15)',
        cardBorderWidth: '2px',
      });
      fixture.detectChanges();
      push(loadedWith(renderableItem('a', null)));

      const root = q('.cometchat-notification-feed')!;
      expect(root.style.backgroundColor).toBe('rgb(1, 2, 3)');
      expect(root.style.width).toBe('320px');
      expect(root.style.height).toBe('480px');
      expect(q('.cometchat-notification-feed__header-title')!.style.color).toBe('rgb(4, 5, 6)');
      expect(q('.cometchat-notification-feed__chip--active')!.style.backgroundColor).toBe('rgb(7, 8, 9)');
      expect(q('.cometchat-notification-feed__unread-indicator')!.style.background).toContain('rgb(10, 11, 12)');
      const card = q('.cometchat-notification-feed__card-container')!;
      expect(card.style.backgroundColor).toBe('rgb(13, 14, 15)');
      expect(card.style.borderWidth).toBe('2px');
      expect(card.style.borderStyle).toBe('solid');
    });

    it('cardThemeMode and cardThemeOverride are forwarded to the card renderer', () => {
      const override = { primaryColor: '#123456' };
      fixture.componentRef.setInput('cardThemeMode', 'dark');
      fixture.componentRef.setInput('cardThemeOverride', override);
      fixture.detectChanges();
      push(loadedWith(renderableItem('a')));

      const card = fixture.debugElement.query(By.directive(CometChatCardViewComponent))
        .componentInstance as CometChatCardViewComponent;
      expect(card.themeMode).toBe('dark');
      expect(card.themeOverride).toBe(override);
    });

    describe('scrollToItemId', () => {
      let scrolled: HTMLElement[];

      beforeEach(() => {
        vi.useFakeTimers();
        scrolled = [];
        // jsdom has no layout, so scrollIntoView does not exist; record the call instead.
        Element.prototype.scrollIntoView = function (this: HTMLElement) {
          scrolled.push(this);
        };
      });

      afterEach(() => {
        vi.useRealTimers();
        delete (Element.prototype as Partial<Element>).scrollIntoView;
      });

      it('scrolls the matching item into view once the feed has rendered', () => {
        fixture.componentRef.setInput('scrollToItemId', 'b');
        fixture.detectChanges();
        push(loadedWith(renderableItem('a'), renderableItem('b'), renderableItem('c')));

        vi.advanceTimersByTime(500);

        expect(scrolled.map((el) => el.getAttribute('data-feed-item-id'))).toEqual(['b']);
      });

      it('does not scroll when no item has that id', () => {
        fixture.componentRef.setInput('scrollToItemId', 'missing');
        fixture.detectChanges();
        push(loadedWith(renderableItem('a')));

        vi.advanceTimersByTime(500);

        expect(scrolled).toEqual([]);
      });
    });
  });

  // -------------------------------------------------------------------------
  // Custom views — templates supplied by a host replace the built-in markup
  // -------------------------------------------------------------------------

  describe('Custom views', () => {
    @Component({
      standalone: true,
      imports: [CometChatNotificationFeedComponent],
      template: `
        <cometchat-notification-feed
          [headerView]="withViews ? header : undefined"
          [loadingStateView]="withViews ? loading : undefined"
          [emptyStateView]="withViews ? empty : undefined"
          [errorStateView]="withViews ? failed : undefined"
        ></cometchat-notification-feed>
        <ng-template #header><div class="custom-header">My header</div></ng-template>
        <ng-template #loading><div class="custom-loading">Fetching…</div></ng-template>
        <ng-template #empty><div class="custom-empty">Nothing yet</div></ng-template>
        <ng-template #failed><div class="custom-error">Broken</div></ng-template>
      `,
    })
    class HostComponent {
      withViews = true;
      @ViewChild('header') header!: TemplateRef<unknown>;
      @ViewChild('loading') loading!: TemplateRef<unknown>;
      @ViewChild('empty') empty!: TemplateRef<unknown>;
      @ViewChild('failed') failed!: TemplateRef<unknown>;
    }

    let host: ComponentFixture<HostComponent>;
    const q = (selector: string): HTMLElement | null => host.nativeElement.querySelector(selector);
    const push = (s: NotificationFeedState): void => {
      vm().onState(s);
      host.detectChanges();
    };

    beforeEach(() => {
      host = TestBed.createComponent(HostComponent);
      host.detectChanges();
      // The templates resolve on the first pass; render again so the feed receives them.
      host.detectChanges();
    });

    it('headerView replaces the built-in header', () => {
      expect(q('.custom-header')?.textContent).toBe('My header');
      expect(q('.cometchat-notification-feed__header')).toBeNull();
    });

    it('loadingStateView replaces the built-in loading state', () => {
      expect(q('.custom-loading')?.textContent).toBe('Fetching…');
      expect(q('.cometchat-notification-feed__loading')).toBeNull();
    });

    it('emptyStateView replaces the built-in empty state', () => {
      push(state({ screenState: 'empty' }));
      expect(q('.custom-empty')?.textContent).toBe('Nothing yet');
      expect(q('.cometchat-notification-feed__empty')).toBeNull();
    });

    it('errorStateView replaces the built-in error state', () => {
      push(state({ screenState: 'error' }));
      expect(q('.custom-error')?.textContent).toBe('Broken');
      expect(q('.cometchat-notification-feed__error')).toBeNull();
    });

    it('falls back to the built-in states when no views are given', () => {
      host.componentInstance.withViews = false;
      host.changeDetectorRef.markForCheck();
      host.detectChanges();
      expect(q('.cometchat-notification-feed__header')).not.toBeNull();
      expect(q('.cometchat-notification-feed__loading')).not.toBeNull();

      push(state({ screenState: 'error' }));
      expect(q('.cometchat-notification-feed__error')).not.toBeNull();
      expect(q('.custom-error')).toBeNull();
    });
  });
});
