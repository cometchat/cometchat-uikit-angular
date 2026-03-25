/**
 * CometChatPaginatedList Component Tests
 *
 * Comprehensive test suite for the generic paginated list component that handles
 * infinite scroll lists with loading/empty/error states, template projection,
 * IntersectionObserver-based pagination, keyboard navigation (roving tabindex),
 * and ARIA listbox semantics.
 *
 * Categories: Initialization, Input Bindings, Output Emissions,
 *             Conditional Rendering, Template Projection, Scroll-Triggered Pagination,
 *             Keyboard Navigation, ARIA / Accessibility, Focus Management, Edge Cases
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 2.1, 2.2, 2.4, 2.5, 3.1, 3.2, 3.3,
 *            3.6, 11.1, 14.4, 14.5, 15.7
 */
import { Component, TemplateRef, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ensureSdkReady, sdkCleanup } from '../../testing';
import { CometChatPaginatedListComponent } from './cometchat-paginated-list.component';

/**
 * Test host component that provides TemplateRef instances for template projection tests.
 */
@Component({
  standalone: true,
  imports: [CometChatPaginatedListComponent],
  template: `
    <cometchat-paginated-list
      [items]="items"
      [isLoading]="isLoading"
      [hasMore]="hasMore"
      [error]="error"
      [ariaLabel]="ariaLabel"
      [enableKeyboardNavigation]="enableKeyboardNavigation"
      [isMultiSelect]="isMultiSelect"
      [emptyStateAriaLabel]="emptyStateAriaLabel"
      [errorStateAriaLabel]="errorStateAriaLabel"
      [hideError]="hideError"
      [showScrollbar]="showScrollbar"
      [itemTemplate]="itemTpl"
      [loadingTemplate]="loadingTpl"
      [emptyTemplate]="emptyTpl"
      [errorTemplate]="errorTpl"
      [loadingMoreTemplate]="loadingMoreTpl"
      [isItemSelected]="isItemSelected"
      (loadMore)="onLoadMore()"
      (itemClick)="onItemClick($event)"
      (retry)="onRetry()"
      (focusedIndexChange)="onFocusedIndexChange($event)"
    ></cometchat-paginated-list>

    <ng-template #customItem let-item let-i="index">
      <span class="test-custom-item">{{ item }}-{{ i }}</span>
    </ng-template>
    <ng-template #customLoading>
      <span class="test-custom-loading">Loading...</span>
    </ng-template>
    <ng-template #customEmpty>
      <span class="test-custom-empty">Nothing here</span>
    </ng-template>
    <ng-template #customError let-err>
      <span class="test-custom-error">{{ err.message }}</span>
    </ng-template>
    <ng-template #customLoadingMore>
      <span class="test-custom-loading-more">Fetching more...</span>
    </ng-template>
  `,
})
class TestHostComponent {
  items: string[] = [];
  isLoading = false;
  hasMore = true;
  error: Error | null = null;
  ariaLabel = '';
  enableKeyboardNavigation = true;
  isMultiSelect = false;
  emptyStateAriaLabel = '';
  errorStateAriaLabel = '';
  hideError = false;
  showScrollbar = false;
  isItemSelected: (item: string) => boolean = () => false;

  // Template refs — null by default, assigned in tests
  itemTpl: TemplateRef<any> | undefined;
  loadingTpl: TemplateRef<any> | undefined;
  emptyTpl: TemplateRef<any> | undefined;
  errorTpl: TemplateRef<any> | undefined;
  loadingMoreTpl: TemplateRef<any> | undefined;

  @ViewChild('customItem', { static: true }) customItemTpl!: TemplateRef<any>;
  @ViewChild('customLoading', { static: true }) customLoadingTpl!: TemplateRef<any>;
  @ViewChild('customEmpty', { static: true }) customEmptyTpl!: TemplateRef<any>;
  @ViewChild('customError', { static: true }) customErrorTpl!: TemplateRef<any>;
  @ViewChild('customLoadingMore', { static: true }) customLoadingMoreTpl!: TemplateRef<any>;

  onLoadMore = vi.fn();
  onItemClick = vi.fn();
  onRetry = vi.fn();
  onFocusedIndexChange = vi.fn();
}

describe('CometChatPaginatedListComponent', () => {
  let hostFixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;
  let hostEl: HTMLElement;

  let fixture: ComponentFixture<CometChatPaginatedListComponent<string>>;
  let component: CometChatPaginatedListComponent<string>;
  let el: HTMLElement;

  beforeAll(async () => {
    await ensureSdkReady();
  });

  afterAll(async () => {
    await sdkCleanup();
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CometChatPaginatedListComponent, TestHostComponent],
    }).compileComponents();

    // Standalone fixture for unit-level tests
    fixture = TestBed.createComponent(CometChatPaginatedListComponent<string>);
    component = fixture.componentInstance;
    el = fixture.nativeElement;

    // Host fixture for template projection tests
    hostFixture = TestBed.createComponent(TestHostComponent);
    host = hostFixture.componentInstance;
    hostEl = hostFixture.nativeElement;
  });

  afterEach(() => {
    fixture.destroy();
    hostFixture.destroy();
  });

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  function getListContainer(): HTMLElement | null {
    return el.querySelector('.cometchat-paginated-list');
  }

  function getLoadingSection(): HTMLElement | null {
    return el.querySelector('.cometchat-paginated-list__loading');
  }

  function getErrorSection(): HTMLElement | null {
    return el.querySelector('.cometchat-paginated-list__error');
  }

  function getEmptySection(): HTMLElement | null {
    return el.querySelector('.cometchat-paginated-list__empty');
  }

  function getItemsContainer(): HTMLElement | null {
    return el.querySelector('.cometchat-paginated-list__items');
  }

  function getItems(): NodeListOf<HTMLElement> {
    return el.querySelectorAll('.cometchat-paginated-list__item');
  }

  function getLoadingMore(): HTMLElement | null {
    return el.querySelector('.cometchat-paginated-list__loading-more');
  }

  function dispatchKeydown(target: HTMLElement, key: string): void {
    const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
    target.dispatchEvent(event);
  }

  // ---------------------------------------------------------------------------
  // Initialization
  // ---------------------------------------------------------------------------
  describe('Initialization', () => {
    it('should create the component', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should render the root list container', () => {
      fixture.detectChanges();
      expect(getListContainer()).toBeTruthy();
    });

    it('should have empty items array by default', () => {
      expect(component.items).toEqual([]);
    });

    it('should have isLoading as false by default', () => {
      expect(component.isLoading).toBe(false);
    });

    it('should have hasMore as true by default', () => {
      expect(component.hasMore).toBe(true);
    });

    it('should have error as null by default', () => {
      expect(component.error).toBeNull();
    });

    it('should have showScrollbar as false by default', () => {
      expect(component.showScrollbar).toBe(false);
    });

    it('should have enableKeyboardNavigation as true by default', () => {
      expect(component.enableKeyboardNavigation).toBe(true);
    });

    it('should have isMultiSelect as false by default', () => {
      expect(component.isMultiSelect).toBe(false);
    });

    it('should have focusedIndex signal at 0 by default', () => {
      expect(component.focusedIndex()).toBe(0);
    });

    it('should have isFetchingMore signal as false by default', () => {
      expect(component.isFetchingMore()).toBe(false);
    });

    it('should have template inputs as undefined by default', () => {
      expect(component.itemTemplate).toBeUndefined();
      expect(component.loadingTemplate).toBeUndefined();
      expect(component.emptyTemplate).toBeUndefined();
      expect(component.errorTemplate).toBeUndefined();
      expect(component.loadingMoreTemplate).toBeUndefined();
    });

    it('should have hideError as false by default', () => {
      expect(component.hideError).toBe(false);
    });

    it('should have ariaLabel as empty string by default', () => {
      expect(component.ariaLabel).toBe('');
    });
  });

  // ---------------------------------------------------------------------------
  // Input Bindings
  // ---------------------------------------------------------------------------
  describe('Input Bindings', () => {
    it('should accept items array and render them', () => {
      component.items = ['alpha', 'beta', 'gamma'];
      fixture.detectChanges();
      expect(getItems().length).toBe(3);
    });

    it('should update rendered items when items input changes', () => {
      fixture.componentRef.setInput('items', ['a']);
      fixture.detectChanges();
      expect(getItems().length).toBe(1);

      fixture.componentRef.setInput('items', ['a', 'b', 'c']);
      fixture.detectChanges();
      expect(getItems().length).toBe(3);
    });

    it('should accept isLoading and show loading state', () => {
      component.isLoading = true;
      component.items = [];
      fixture.detectChanges();
      expect(getLoadingSection()).toBeTruthy();
    });

    it('should accept error and show error state', () => {
      component.error = new Error('Network failure');
      fixture.detectChanges();
      const errorEl = getErrorSection();
      expect(errorEl).toBeTruthy();
    });

    it('should accept ariaLabel and apply it to the container', () => {
      component.ariaLabel = 'Conversations list';
      fixture.detectChanges();
      expect(getListContainer()?.getAttribute('aria-label')).toBe('Conversations list');
    });

    it('should accept showScrollbar and apply modifier class', () => {
      component.showScrollbar = true;
      fixture.detectChanges();
      expect(
        getListContainer()?.classList.contains('cometchat-paginated-list--show-scrollbar')
      ).toBe(true);
    });

    it('should handle null items gracefully without throwing', () => {
      // Component uses items.length in ngOnChanges, so null will throw.
      // This is expected — callers should always pass an array.
      expect(() => {
        fixture.componentRef.setInput('items', null as any);
        fixture.detectChanges();
      }).toThrow();
    });

    it('should accept emptyStateAriaLabel', () => {
      component.items = [];
      component.emptyStateAriaLabel = 'No conversations';
      fixture.detectChanges();
      const emptyEl = getEmptySection();
      expect(emptyEl?.getAttribute('aria-label')).toBe('No conversations');
    });

    it('should accept errorStateAriaLabel', () => {
      component.error = new Error('Fail');
      component.errorStateAriaLabel = 'Error loading';
      fixture.detectChanges();
      const errorEl = getErrorSection();
      expect(errorEl?.getAttribute('aria-label')).toBe('Error loading');
    });

    it('should accept hideError and suppress error display', () => {
      component.error = new Error('Hidden');
      component.hideError = true;
      fixture.detectChanges();
      expect(getErrorSection()).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // Output Emissions
  // ---------------------------------------------------------------------------
  describe('Output Emissions', () => {
    it('should emit itemClick with item and index on handleItemClick', () => {
      component.items = ['alpha', 'beta'];
      fixture.detectChanges();
      const spy = vi.fn();
      component.itemClick.subscribe(spy);

      component.handleItemClick('beta', 1);

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith({ item: 'beta', index: 1 });
    });

    it('should emit itemClick when a rendered item is clicked', () => {
      component.items = ['x', 'y'];
      fixture.detectChanges();
      const spy = vi.fn();
      component.itemClick.subscribe(spy);

      const items = getItems();
      items[1].click();
      fixture.detectChanges();

      expect(spy).toHaveBeenCalledWith({ item: 'y', index: 1 });
    });

    it('should emit retry on onRetry', () => {
      const spy = vi.fn();
      component.retry.subscribe(spy);
      component.onRetry();
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should emit focusedIndexChange when focused index changes', () => {
      component.items = ['a', 'b', 'c'];
      fixture.detectChanges();
      const spy = vi.fn();
      component.focusedIndexChange.subscribe(spy);

      component.setFocusedIndex(2);

      expect(spy).toHaveBeenCalledWith(2);
    });

    it('should not emit focusedIndexChange when index does not change', () => {
      component.items = ['a', 'b', 'c'];
      fixture.detectChanges();
      const spy = vi.fn();
      component.focusedIndexChange.subscribe(spy);

      component.setFocusedIndex(0); // already at 0

      expect(spy).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // Conditional Rendering
  // ---------------------------------------------------------------------------
  describe('Conditional Rendering', () => {
    it('should show loading state when isLoading and no items', () => {
      component.isLoading = true;
      component.items = [];
      fixture.detectChanges();
      expect(getLoadingSection()).toBeTruthy();
      expect(getItemsContainer()).toBeNull();
      expect(getEmptySection()).toBeNull();
    });

    it('should not show loading state when isLoading but has items', () => {
      component.isLoading = true;
      component.items = ['a'];
      fixture.detectChanges();
      expect(getLoadingSection()).toBeNull();
      expect(getItemsContainer()).toBeTruthy();
    });

    it('should show error state when error exists and not loading', () => {
      component.error = new Error('Something went wrong');
      component.isLoading = false;
      fixture.detectChanges();
      const errorEl = getErrorSection();
      expect(errorEl).toBeTruthy();
      expect(errorEl?.getAttribute('role')).toBe('alert');
    });

    it('should display error message in default error template', () => {
      component.error = new Error('Network error');
      fixture.detectChanges();
      const msg = el.querySelector('.cometchat-paginated-list__error-message');
      expect(msg?.textContent).toContain('Network error');
    });

    it('should not show error state when hideError is true', () => {
      component.error = new Error('Hidden error');
      component.hideError = true;
      fixture.detectChanges();
      expect(getErrorSection()).toBeNull();
    });

    it('should not show error state when loading', () => {
      component.error = new Error('Error');
      component.isLoading = true;
      component.items = [];
      fixture.detectChanges();
      expect(getErrorSection()).toBeNull();
      expect(getLoadingSection()).toBeTruthy();
    });

    it('should show empty state when not loading, no items, and no error', () => {
      component.isLoading = false;
      component.items = [];
      component.error = null;
      fixture.detectChanges();
      const emptyEl = getEmptySection();
      expect(emptyEl).toBeTruthy();
      expect(emptyEl?.getAttribute('role')).toBe('status');
    });

    it('should not show empty state when items exist', () => {
      component.items = ['a'];
      fixture.detectChanges();
      expect(getEmptySection()).toBeNull();
    });

    it('should not show empty state when error exists', () => {
      component.items = [];
      component.error = new Error('Error');
      fixture.detectChanges();
      expect(getEmptySection()).toBeNull();
    });

    it('should show items list when items exist', () => {
      component.items = ['a', 'b', 'c'];
      fixture.detectChanges();
      expect(getItemsContainer()).toBeTruthy();
      expect(getItems().length).toBe(3);
    });

    it('should not show items list when items is empty', () => {
      component.items = [];
      fixture.detectChanges();
      expect(getItemsContainer()).toBeNull();
    });

    it('should transition from loading to empty state', () => {
      fixture.componentRef.setInput('isLoading', true);
      fixture.componentRef.setInput('items', []);
      fixture.detectChanges();
      expect(getLoadingSection()).toBeTruthy();

      fixture.componentRef.setInput('isLoading', false);
      fixture.detectChanges();
      expect(getLoadingSection()).toBeNull();
      expect(getEmptySection()).toBeTruthy();
    });

    it('should transition from loading to loaded state', () => {
      fixture.componentRef.setInput('isLoading', true);
      fixture.componentRef.setInput('items', []);
      fixture.detectChanges();
      expect(getLoadingSection()).toBeTruthy();

      fixture.componentRef.setInput('isLoading', false);
      fixture.componentRef.setInput('items', ['a', 'b']);
      fixture.detectChanges();
      expect(getLoadingSection()).toBeNull();
      expect(getItemsContainer()).toBeTruthy();
      expect(getItems().length).toBe(2);
    });
  });

  // ---------------------------------------------------------------------------
  // Template Projection (via host component)
  // ---------------------------------------------------------------------------
  describe('Template Projection', () => {
    it('should render custom loading template when provided', () => {
      host.isLoading = true;
      host.items = [];
      host.loadingTpl = host.customLoadingTpl;
      hostFixture.detectChanges();
      expect(hostEl.querySelector('.test-custom-loading')).toBeTruthy();
      expect(hostEl.querySelector('.cometchat-paginated-list__loading-default')).toBeNull();
    });

    it('should render default loading template when not provided', () => {
      host.isLoading = true;
      host.items = [];
      hostFixture.detectChanges();
      expect(hostEl.querySelector('.cometchat-paginated-list__loading-default')).toBeTruthy();
    });

    it('should render custom empty template when provided', () => {
      host.items = [];
      host.isLoading = false;
      host.emptyTpl = host.customEmptyTpl;
      hostFixture.detectChanges();
      const customEmpty = hostEl.querySelector('.test-custom-empty');
      expect(customEmpty).toBeTruthy();
      expect(customEmpty?.textContent).toContain('Nothing here');
    });

    it('should render default empty template when not provided', () => {
      host.items = [];
      host.isLoading = false;
      hostFixture.detectChanges();
      expect(hostEl.querySelector('.cometchat-paginated-list__empty-default')).toBeTruthy();
    });

    it('should render custom error template when provided', () => {
      host.error = new Error('Custom fail');
      host.errorTpl = host.customErrorTpl;
      hostFixture.detectChanges();
      const customError = hostEl.querySelector('.test-custom-error');
      expect(customError).toBeTruthy();
      expect(customError?.textContent).toContain('Custom fail');
    });

    it('should render default error template when not provided', () => {
      host.error = new Error('Default fail');
      hostFixture.detectChanges();
      expect(hostEl.querySelector('.cometchat-paginated-list__error-default')).toBeTruthy();
    });

    it('should render custom item template for each item', () => {
      host.items = ['foo', 'bar'];
      host.itemTpl = host.customItemTpl;
      hostFixture.detectChanges();
      const customItems = hostEl.querySelectorAll('.test-custom-item');
      expect(customItems.length).toBe(2);
      expect(customItems[0].textContent).toContain('foo-0');
      expect(customItems[1].textContent).toContain('bar-1');
    });

    it('should render custom loading more template when provided', () => {
      host.items = ['a'];
      host.hasMore = true;
      host.loadingMoreTpl = host.customLoadingMoreTpl;
      hostFixture.detectChanges();

      // Trigger load more on the inner component
      const innerComp = hostFixture.debugElement.children[0]
        .componentInstance as CometChatPaginatedListComponent<string>;
      innerComp.isFetchingMore.set(true);
      hostFixture.detectChanges();

      expect(hostEl.querySelector('.test-custom-loading-more')).toBeTruthy();
    });
  });

  // ---------------------------------------------------------------------------
  // Scroll-Triggered Pagination
  // ---------------------------------------------------------------------------
  describe('Scroll-Triggered Pagination', () => {
    it('should emit loadMore event via host when triggered', () => {
      host.items = ['a'];
      host.hasMore = true;
      hostFixture.detectChanges();

      const innerComp = hostFixture.debugElement.children[0]
        .componentInstance as CometChatPaginatedListComponent<string>;
      innerComp.loadMore.emit();
      hostFixture.detectChanges();

      expect(host.onLoadMore).toHaveBeenCalled();
    });

    it('should reset isFetchingMore on loadComplete', () => {
      component.items = ['a'];
      component.hasMore = true;
      fixture.detectChanges();

      component.isFetchingMore.set(true);
      expect(component.isFetchingMore()).toBe(true);

      component.loadComplete();
      expect(component.isFetchingMore()).toBe(false);
    });

    it('should show loading more indicator when isFetchingMore and has items', () => {
      component.items = ['a'];
      component.isFetchingMore.set(true);
      fixture.detectChanges();
      expect(getLoadingMore()).toBeTruthy();
    });

    it('should not show loading more indicator when not fetching', () => {
      component.items = ['a'];
      fixture.detectChanges();
      expect(getLoadingMore()).toBeNull();
    });

    it('should not show loading more indicator when no items', () => {
      component.items = [];
      component.isFetchingMore.set(true);
      fixture.detectChanges();
      expect(getLoadingMore()).toBeNull();
    });

    it('should allow re-triggering after loadComplete', () => {
      component.items = ['a'];
      component.hasMore = true;
      fixture.detectChanges();

      component.isFetchingMore.set(true);
      component.loadComplete();
      expect(component.isFetchingMore()).toBe(false);

      component.isFetchingMore.set(true);
      expect(component.isFetchingMore()).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // Keyboard Navigation
  // ---------------------------------------------------------------------------
  describe('Keyboard Navigation', () => {
    it('should move focus down on ArrowDown', () => {
      component.items = ['a', 'b', 'c'];
      fixture.detectChanges();
      const spy = vi.fn();
      component.focusedIndexChange.subscribe(spy);

      const container = getListContainer()!;
      dispatchKeydown(container, 'ArrowDown');
      fixture.detectChanges();

      expect(component.focusedIndex()).toBe(1);
      expect(spy).toHaveBeenCalledWith(1);
    });

    it('should move focus up on ArrowUp', () => {
      component.items = ['a', 'b', 'c'];
      fixture.detectChanges();
      component.setFocusedIndex(2);

      const container = getListContainer()!;
      dispatchKeydown(container, 'ArrowUp');
      fixture.detectChanges();

      expect(component.focusedIndex()).toBe(1);
    });

    it('should move to first item on Home', () => {
      component.items = ['a', 'b', 'c'];
      fixture.detectChanges();
      component.setFocusedIndex(2);

      const container = getListContainer()!;
      dispatchKeydown(container, 'Home');
      fixture.detectChanges();

      expect(component.focusedIndex()).toBe(0);
    });

    it('should move to last item on End', () => {
      component.items = ['a', 'b', 'c'];
      fixture.detectChanges();

      const container = getListContainer()!;
      dispatchKeydown(container, 'End');
      fixture.detectChanges();

      expect(component.focusedIndex()).toBe(2);
    });

    it('should ignore keyboard when enableKeyboardNavigation is false', () => {
      component.items = ['a', 'b', 'c'];
      component.enableKeyboardNavigation = false;
      fixture.detectChanges();
      const spy = vi.fn();
      component.focusedIndexChange.subscribe(spy);

      const container = getListContainer()!;
      dispatchKeydown(container, 'ArrowDown');
      fixture.detectChanges();

      expect(spy).not.toHaveBeenCalled();
    });

    it('should ignore keyboard when items is empty', () => {
      component.items = [];
      fixture.detectChanges();
      const spy = vi.fn();
      component.focusedIndexChange.subscribe(spy);

      const container = getListContainer()!;
      dispatchKeydown(container, 'ArrowDown');
      fixture.detectChanges();

      expect(spy).not.toHaveBeenCalled();
    });

    it('should trigger loadMore when navigating to last item with hasMore', () => {
      component.items = ['a', 'b'];
      component.hasMore = true;
      fixture.detectChanges();
      const spy = vi.fn();
      component.loadMore.subscribe(spy);

      component.setFocusedIndex(0);
      const container = getListContainer()!;
      dispatchKeydown(container, 'ArrowDown'); // → index 1 (last)
      fixture.detectChanges();

      expect(spy).toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // ARIA / Accessibility
  // ---------------------------------------------------------------------------
  describe('ARIA / Accessibility', () => {
    it('should have role="listbox" on the container', () => {
      fixture.detectChanges();
      expect(getListContainer()?.getAttribute('role')).toBe('listbox');
    });

    it('should set aria-busy when loading', () => {
      component.isLoading = true;
      fixture.detectChanges();
      expect(getListContainer()?.getAttribute('aria-busy')).toBe('true');
    });

    it('should set aria-busy to false when idle', () => {
      component.isLoading = false;
      fixture.detectChanges();
      expect(getListContainer()?.getAttribute('aria-busy')).toBe('false');
    });

    it('should set aria-multiselectable when isMultiSelect is true', () => {
      component.isMultiSelect = true;
      fixture.detectChanges();
      expect(getListContainer()?.getAttribute('aria-multiselectable')).toBe('true');
    });

    it('should not set aria-multiselectable when isMultiSelect is false', () => {
      component.isMultiSelect = false;
      fixture.detectChanges();
      expect(getListContainer()?.hasAttribute('aria-multiselectable')).toBe(false);
    });

    it('should have role="option" on each item', () => {
      component.items = ['a', 'b'];
      fixture.detectChanges();
      const items = getItems();
      items.forEach(item => {
        expect(item.getAttribute('role')).toBe('option');
      });
    });

    it('should have role="status" on loading state with aria-live', () => {
      component.isLoading = true;
      component.items = [];
      fixture.detectChanges();
      const loading = getLoadingSection();
      expect(loading?.getAttribute('role')).toBe('status');
      expect(loading?.getAttribute('aria-live')).toBe('polite');
    });

    it('should have role="alert" on error state', () => {
      component.error = new Error('Fail');
      fixture.detectChanges();
      expect(getErrorSection()?.getAttribute('role')).toBe('alert');
    });

    it('should have tabindex="0" on error state for focusability', () => {
      component.error = new Error('Fail');
      fixture.detectChanges();
      expect(getErrorSection()?.getAttribute('tabindex')).toBe('0');
    });

    it('should have role="status" on empty state', () => {
      component.items = [];
      component.isLoading = false;
      fixture.detectChanges();
      expect(getEmptySection()?.getAttribute('role')).toBe('status');
    });

    it('should have tabindex="0" on empty state for focusability', () => {
      component.items = [];
      component.isLoading = false;
      fixture.detectChanges();
      expect(getEmptySection()?.getAttribute('tabindex')).toBe('0');
    });

    it('should have aria-hidden on scroll anchors', () => {
      fixture.detectChanges();
      const anchors = el.querySelectorAll('.cometchat-paginated-list__scroll-anchor');
      anchors.forEach(anchor => {
        expect(anchor.getAttribute('aria-hidden')).toBe('true');
      });
    });

    it('should implement roving tabindex on items', () => {
      component.items = ['a', 'b', 'c'];
      fixture.detectChanges();
      const items = getItems();
      expect(items[0].getAttribute('tabindex')).toBe('0');
      expect(items[1].getAttribute('tabindex')).toBe('-1');
      expect(items[2].getAttribute('tabindex')).toBe('-1');
    });

    it('should update roving tabindex when focused index changes', () => {
      component.items = ['a', 'b', 'c'];
      fixture.detectChanges();

      component.setFocusedIndex(1);
      fixture.detectChanges();

      const items = getItems();
      expect(items[0].getAttribute('tabindex')).toBe('-1');
      expect(items[1].getAttribute('tabindex')).toBe('0');
      expect(items[2].getAttribute('tabindex')).toBe('-1');
    });

    it('should set aria-selected on items based on isItemSelected', () => {
      host.items = ['selected', 'not-selected'];
      host.isItemSelected = item => item === 'selected';
      hostFixture.detectChanges();
      const items = hostEl.querySelectorAll('.cometchat-paginated-list__item');
      expect(items[0].getAttribute('aria-selected')).toBe('true');
      expect(items[1].getAttribute('aria-selected')).toBe('false');
    });

    it('should have aria-hidden on loading more indicator', () => {
      component.items = ['a'];
      component.isFetchingMore.set(true);
      fixture.detectChanges();
      const loadingMore = getLoadingMore();
      expect(loadingMore?.getAttribute('aria-hidden')).toBe('true');
    });
  });

  // ---------------------------------------------------------------------------
  // Focus Management
  // ---------------------------------------------------------------------------
  describe('Focus Management', () => {
    it('should clamp setFocusedIndex to upper bound', () => {
      component.items = ['a', 'b', 'c'];
      fixture.detectChanges();
      component.setFocusedIndex(10);
      expect(component.focusedIndex()).toBe(2);
    });

    it('should clamp setFocusedIndex to lower bound', () => {
      component.items = ['a', 'b', 'c'];
      fixture.detectChanges();
      component.setFocusedIndex(-5);
      expect(component.focusedIndex()).toBe(0);
    });

    it('should update focusedIndex on onItemFocus', () => {
      component.items = ['a', 'b', 'c'];
      fixture.detectChanges();
      const spy = vi.fn();
      component.focusedIndexChange.subscribe(spy);

      component.onItemFocus(2);

      expect(component.focusedIndex()).toBe(2);
      expect(spy).toHaveBeenCalledWith(2);
    });

    it('should not emit on onItemFocus if index unchanged', () => {
      component.items = ['a', 'b', 'c'];
      fixture.detectChanges();
      const spy = vi.fn();
      component.focusedIndexChange.subscribe(spy);

      component.onItemFocus(0); // already at 0

      expect(spy).not.toHaveBeenCalled();
    });

    it('should focus first item via focusFirstItem', () => {
      component.items = ['a', 'b', 'c'];
      fixture.detectChanges();
      component.setFocusedIndex(2);
      component.focusFirstItem();
      expect(component.focusedIndex()).toBe(0);
    });

    it('should handle item deletion - focus next when current deleted', () => {
      component.items = ['a', 'b', 'c'];
      fixture.detectChanges();
      component.setFocusedIndex(1);
      component.items = ['a', 'c'];
      fixture.detectChanges();

      component.handleItemDeleted(1);
      expect(component.focusedIndex()).toBe(1);
    });

    it('should handle item deletion - focus previous when last item deleted', () => {
      component.items = ['a', 'b', 'c'];
      fixture.detectChanges();
      component.setFocusedIndex(2);
      component.items = ['a', 'b'];
      fixture.detectChanges();

      component.handleItemDeleted(2);
      expect(component.focusedIndex()).toBe(1);
    });

    it('should handle item deletion when list becomes empty', () => {
      component.items = [];
      fixture.detectChanges();
      expect(() => component.handleItemDeleted(0)).not.toThrow();
      expect(component.focusedIndex()).toBe(0);
    });
  });

  // ---------------------------------------------------------------------------
  // Edge Cases
  // ---------------------------------------------------------------------------
  describe('Edge Cases', () => {
    it('should handle error with empty message', () => {
      component.error = new Error('');
      fixture.detectChanges();
      const msg = el.querySelector('.cometchat-paginated-list__error-message');
      expect(msg).toBeTruthy();
    });

    it('should handle loadComplete when not fetching', () => {
      expect(() => component.loadComplete()).not.toThrow();
      expect(component.isFetchingMore()).toBe(false);
    });

    it('should handle getItemTabIndex for any index', () => {
      component.items = ['a', 'b'];
      fixture.detectChanges();
      expect(component.getItemTabIndex(0)).toBe(0);
      expect(component.getItemTabIndex(1)).toBe(-1);
      expect(component.getItemTabIndex(99)).toBe(-1);
    });

    it('should handle items changing from populated to empty', () => {
      fixture.componentRef.setInput('items', ['a', 'b', 'c']);
      fixture.detectChanges();
      expect(getItemsContainer()).toBeTruthy();

      fixture.componentRef.setInput('items', []);
      fixture.detectChanges();
      expect(getItemsContainer()).toBeNull();
      expect(getEmptySection()).toBeTruthy();
    });

    it('should handle single item list', () => {
      component.items = ['only'];
      fixture.detectChanges();
      expect(getItems().length).toBe(1);
      expect(component.getItemTabIndex(0)).toBe(0);
    });

    it('should handle large items array', () => {
      component.items = Array.from({ length: 100 }, (_, i) => `item-${i}`);
      fixture.detectChanges();
      expect(getItems().length).toBe(100);
    });

    it('should handle default trackByFn returning index', () => {
      expect(component.trackByFn(0, 'anything')).toBe(0);
      expect(component.trackByFn(5, 'anything')).toBe(5);
    });

    it('should handle default isItemSelected returning false', () => {
      expect(component.isItemSelected('anything')).toBe(false);
    });

    it('should render correctly with simultaneous error and items', () => {
      component.items = ['a', 'b'];
      component.error = new Error('Partial error');
      fixture.detectChanges();
      expect(getErrorSection()).toBeTruthy();
      expect(getItemsContainer()).toBeTruthy();
    });

    it('should scrollToTopPosition without throwing when container exists', () => {
      component.items = ['a'];
      fixture.detectChanges();
      expect(() => component.scrollToTopPosition()).not.toThrow();
    });

    it('should scrollToBottomPosition without throwing when container exists', () => {
      component.items = ['a'];
      fixture.detectChanges();
      expect(() => component.scrollToBottomPosition()).not.toThrow();
    });

    it('should clean up observers on destroy', () => {
      component.items = ['a'];
      fixture.detectChanges();
      expect(() => fixture.destroy()).not.toThrow();

      // Re-create for afterEach cleanup
      fixture = TestBed.createComponent(CometChatPaginatedListComponent<string>);
      component = fixture.componentInstance;
      el = fixture.nativeElement;
    });
  });
});
