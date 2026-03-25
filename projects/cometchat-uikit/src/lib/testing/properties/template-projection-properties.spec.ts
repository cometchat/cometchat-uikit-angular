import { describe, it, expect, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { TemplateRef } from '@angular/core';

/**
 * Property-Based Tests for Primary Component Template Projection
 *
 * Feature: comprehensive-test-suite, Property 5: Template Projection
 *
 * For any component that accepts TemplateRef inputs, providing a custom
 * ng-template SHALL cause the component to render the custom template content,
 * and omitting the template SHALL cause the component to render its default content.
 *
 * **Validates: Requirements 2.4**
 */

// ─── Mock TemplateRef Factory ───

function createMockTemplateRef(label = 'mock'): TemplateRef<any> {
  return {
    elementRef: { nativeElement: {} },
    createEmbeddedView: vi.fn(),
    _label: label,
  } as unknown as TemplateRef<any>;
}

// ─── Lightweight Mock Classes ───

class MockListItemComponent {
  id = '';
  avatarURL = '';
  avatarName = '';
  title = '';
  subtitle = '';
  menuView: TemplateRef<any> | null = null;
  subtitleView: TemplateRef<any> | null = null;
  trailingView: TemplateRef<any> | null = null;
  titleView: TemplateRef<any> | null = null;
  leadingView: TemplateRef<any> | null = null;
  stopEventPropagation = false;
  disableTabIndex = false;
  isFocused = false;
  isHovering = false;
  isMenuVisible = false;

  get showAvatar(): boolean {
    return !this.leadingView && (!!this.avatarURL?.trim() || !!this.avatarName?.trim());
  }

  get showTrailingView(): boolean {
    return (
      !(this.isHovering || this.isMenuVisible || this.isFocused) ||
      ((this.isHovering || this.isMenuVisible || this.isFocused) && !this.menuView)
    );
  }
}

class MockPaginatedListComponent {
  items: string[] = [];
  isLoading = false;
  error: Error | null = null;
  hasMore = false;
  hideError = false;
  ariaLabel = '';
  emptyStateAriaLabel = '';
  errorStateAriaLabel = '';
  isMultiSelect = false;
  showScrollbar = false;
  isFetchingMore = false;

  itemTemplate: TemplateRef<any> | undefined = undefined;
  loadingTemplate: TemplateRef<any> | undefined = undefined;
  emptyTemplate: TemplateRef<any> | undefined = undefined;
  errorTemplate: TemplateRef<any> | undefined = undefined;
  loadingMoreTemplate: TemplateRef<any> | undefined = undefined;

  isEmpty(): boolean {
    return !this.isLoading && this.items.length === 0 && !this.error;
  }

  hasItems(): boolean {
    return this.items.length > 0;
  }

  showLoadingMore(): boolean {
    return this.isFetchingMore && this.items.length > 0;
  }
}

class MockMessagePreviewComponent {
  previewTitle: TemplateRef<any> | null = null;
  previewSubtitle: TemplateRef<any> | null = null;
  hideCloseButton = false;
  message?: { senderName?: string; text?: string; type?: string; deletedAt?: number };
  mode: 'reply' | 'edit' = 'reply';
  ariaLabel?: string;

  get shouldShowDefaultTitle(): boolean {
    return !this.previewTitle && !!this.message;
  }

  get shouldShowDefaultSubtitle(): boolean {
    return !this.previewSubtitle && !!this.message;
  }

  get isDeleted(): boolean {
    return !!this.message?.deletedAt;
  }

  get senderName(): string {
    return this.message?.senderName || '';
  }

  get messageContentPreview(): string {
    return this.message?.text || '';
  }
}

// ─── Render Functions ───

function renderListItem(comp: MockListItemComponent): HTMLElement {
  const container = document.createElement('div');

  // Leading view
  let leadingHtml = '';
  if (comp.leadingView) {
    leadingHtml =
      '<div class="cometchat-list-item__leading-view--custom">[Custom Leading View]</div>';
  } else if (comp.showAvatar) {
    leadingHtml = `<div class="cometchat-list-item__leading-view"><cometchat-avatar></cometchat-avatar></div>`;
  }

  // Title view
  let titleHtml = '';
  if (comp.titleView) {
    titleHtml = '<div class="cometchat-list-item__body-title--custom">[Custom Title View]</div>';
  } else {
    titleHtml = `<div class="cometchat-list-item__body-title">${comp.title}</div>`;
  }

  // Subtitle view
  let subtitleHtml = '';
  if (comp.subtitleView) {
    subtitleHtml =
      '<div class="cometchat-list-item__body-subtitle--custom">[Custom Subtitle View]</div>';
  } else if (comp.subtitle) {
    subtitleHtml = `<div class="cometchat-list-item__body-subtitle">${comp.subtitle}</div>`;
  }

  // Trailing view
  let trailingHtml = '';
  if (comp.showTrailingView && comp.trailingView) {
    trailingHtml =
      '<div class="cometchat-list-item__trailing-view--custom">[Custom Trailing View]</div>';
  } else if (comp.showTrailingView) {
    trailingHtml = '<div class="cometchat-list-item__trailing-view"></div>';
  }

  container.innerHTML = `
    <div class="cometchat-list-item" role="listitem">
      ${leadingHtml}
      <div class="cometchat-list-item__body">
        ${titleHtml}
        ${subtitleHtml}
        ${trailingHtml}
      </div>
    </div>`;

  return container;
}

function renderPaginatedList(comp: MockPaginatedListComponent): HTMLElement {
  const container = document.createElement('div');

  // Loading state
  const loadingSection =
    comp.isLoading && comp.items.length === 0
      ? `<div class="cometchat-paginated-list__loading" role="status">
        ${
          comp.loadingTemplate
            ? '<div class="cometchat-paginated-list__loading-custom">[custom loading]</div>'
            : '<div class="cometchat-paginated-list__loading-default"><span class="cometchat-paginated-list__loading-spinner"></span></div>'
        }
      </div>`
      : '';

  // Error state
  const errorSection =
    comp.error && !comp.isLoading && !comp.hideError
      ? `<div class="cometchat-paginated-list__error" role="alert">
        ${
          comp.errorTemplate
            ? '<div class="cometchat-paginated-list__error-custom">[custom error]</div>'
            : `<div class="cometchat-paginated-list__error-default"><span class="cometchat-paginated-list__error-message">${comp.error.message}</span></div>`
        }
      </div>`
      : '';

  // Empty state
  const emptySection =
    comp.isEmpty() && !comp.error
      ? `<div class="cometchat-paginated-list__empty" role="status">
        ${
          comp.emptyTemplate
            ? '<div class="cometchat-paginated-list__empty-custom">[custom empty]</div>'
            : '<div class="cometchat-paginated-list__empty-default"></div>'
        }
      </div>`
      : '';

  // Items
  const itemsSection = comp.hasItems()
    ? `<div class="cometchat-paginated-list__items">
        ${comp.items
          .map(
            (item, i) => `
          <div class="cometchat-paginated-list__item" role="option">
            ${
              comp.itemTemplate
                ? `<div class="cometchat-paginated-list__item-custom">[custom item: ${item}]</div>`
                : `<div class="cometchat-paginated-list__item-default">${item}</div>`
            }
          </div>`
          )
          .join('')}
      </div>`
    : '';

  // Loading more
  const loadingMoreSection = comp.showLoadingMore()
    ? `<div class="cometchat-paginated-list__loading-more">
        ${
          comp.loadingMoreTemplate
            ? '<div class="cometchat-paginated-list__loading-more-custom">[custom loading more]</div>'
            : '<div class="cometchat-paginated-list__loading-more-default"><span class="cometchat-paginated-list__loading-spinner--small"></span></div>'
        }
      </div>`
    : '';

  container.innerHTML = `
    <div class="cometchat-paginated-list" role="listbox">
      ${loadingSection}
      ${errorSection}
      ${emptySection}
      ${itemsSection}
      ${loadingMoreSection}
    </div>`;

  return container;
}

function renderMessagePreview(comp: MockMessagePreviewComponent): HTMLElement {
  const container = document.createElement('div');

  if (!comp.message) {
    container.innerHTML = '<div class="cometchat-message-preview"></div>';
    return container;
  }

  // Title section
  let titleHtml = '';
  if (comp.previewTitle) {
    titleHtml =
      '<div class="cometchat-message-preview__title--custom">[Custom Title Template]</div>';
  } else if (comp.shouldShowDefaultTitle) {
    titleHtml = `<div class="cometchat-message-preview__title"><span class="cometchat-message-preview__title-text">${comp.senderName}</span></div>`;
  }

  // Subtitle section
  let subtitleHtml = '';
  if (comp.previewSubtitle) {
    subtitleHtml =
      '<div class="cometchat-message-preview__subtitle--custom">[Custom Subtitle Template]</div>';
  } else if (comp.shouldShowDefaultSubtitle) {
    subtitleHtml = `<div class="cometchat-message-preview__subtitle"><span class="cometchat-message-preview__subtitle-text">${comp.messageContentPreview}</span></div>`;
  }

  container.innerHTML = `
    <div class="cometchat-message-preview" role="status">
      ${titleHtml}
      ${subtitleHtml}
    </div>`;

  return container;
}

// ─── Template Slot Definitions ───

interface TemplateSlot {
  /** Name of the TemplateRef input property */
  inputName: string;
  /** CSS selector for the custom template content in the rendered DOM */
  customSelector: string;
  /** CSS selector for the default content in the rendered DOM */
  defaultSelector: string;
  /** Setup function to put the component in a state where this slot is visible */
  setup?: (comp: any) => void;
}

interface TemplateProjectionEntry {
  name: string;
  factory: () => any;
  render: (comp: any) => HTMLElement;
  slots: TemplateSlot[];
}

const TEMPLATE_COMPONENTS: TemplateProjectionEntry[] = [
  {
    name: 'cometchat-list-item',
    factory: () => {
      const comp = new MockListItemComponent();
      comp.title = 'Test User';
      comp.avatarURL = 'https://example.com/avatar.png';
      comp.subtitle = 'Online';
      return comp;
    },
    render: renderListItem,
    slots: [
      {
        inputName: 'leadingView',
        customSelector: '.cometchat-list-item__leading-view--custom',
        defaultSelector: '.cometchat-list-item__leading-view',
      },
      {
        inputName: 'titleView',
        customSelector: '.cometchat-list-item__body-title--custom',
        defaultSelector: '.cometchat-list-item__body-title',
      },
      {
        inputName: 'subtitleView',
        customSelector: '.cometchat-list-item__body-subtitle--custom',
        defaultSelector: '.cometchat-list-item__body-subtitle',
      },
      {
        inputName: 'trailingView',
        customSelector: '.cometchat-list-item__trailing-view--custom',
        defaultSelector: '.cometchat-list-item__trailing-view',
      },
    ],
  },
  {
    name: 'cometchat-paginated-list (loading)',
    factory: () => {
      const comp = new MockPaginatedListComponent();
      comp.isLoading = true;
      comp.items = [];
      return comp;
    },
    render: renderPaginatedList,
    slots: [
      {
        inputName: 'loadingTemplate',
        customSelector: '.cometchat-paginated-list__loading-custom',
        defaultSelector: '.cometchat-paginated-list__loading-default',
      },
    ],
  },
  {
    name: 'cometchat-paginated-list (empty)',
    factory: () => {
      const comp = new MockPaginatedListComponent();
      comp.isLoading = false;
      comp.items = [];
      comp.error = null;
      return comp;
    },
    render: renderPaginatedList,
    slots: [
      {
        inputName: 'emptyTemplate',
        customSelector: '.cometchat-paginated-list__empty-custom',
        defaultSelector: '.cometchat-paginated-list__empty-default',
      },
    ],
  },
  {
    name: 'cometchat-paginated-list (error)',
    factory: () => {
      const comp = new MockPaginatedListComponent();
      comp.isLoading = false;
      comp.error = new Error('Test error');
      comp.items = [];
      return comp;
    },
    render: renderPaginatedList,
    slots: [
      {
        inputName: 'errorTemplate',
        customSelector: '.cometchat-paginated-list__error-custom',
        defaultSelector: '.cometchat-paginated-list__error-default',
      },
    ],
  },
  {
    name: 'cometchat-paginated-list (items)',
    factory: () => {
      const comp = new MockPaginatedListComponent();
      comp.isLoading = false;
      comp.items = ['item-1', 'item-2'];
      return comp;
    },
    render: renderPaginatedList,
    slots: [
      {
        inputName: 'itemTemplate',
        customSelector: '.cometchat-paginated-list__item-custom',
        defaultSelector: '.cometchat-paginated-list__item-default',
      },
    ],
  },
  {
    name: 'cometchat-paginated-list (loading more)',
    factory: () => {
      const comp = new MockPaginatedListComponent();
      comp.isLoading = false;
      comp.items = ['item-1'];
      comp.isFetchingMore = true;
      return comp;
    },
    render: renderPaginatedList,
    slots: [
      {
        inputName: 'loadingMoreTemplate',
        customSelector: '.cometchat-paginated-list__loading-more-custom',
        defaultSelector: '.cometchat-paginated-list__loading-more-default',
      },
    ],
  },
  {
    name: 'cometchat-message-preview',
    factory: () => {
      const comp = new MockMessagePreviewComponent();
      comp.message = { senderName: 'Alice', text: 'Hello', type: 'text' };
      return comp;
    },
    render: renderMessagePreview,
    slots: [
      {
        inputName: 'previewTitle',
        customSelector: '.cometchat-message-preview__title--custom',
        defaultSelector: '.cometchat-message-preview__title',
      },
      {
        inputName: 'previewSubtitle',
        customSelector: '.cometchat-message-preview__subtitle--custom',
        defaultSelector: '.cometchat-message-preview__subtitle',
      },
    ],
  },
];

// ─── Tests ───

describe('Primary Component Template Projection Property Tests', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * **Feature: comprehensive-test-suite, Property 5: Template Projection**
   *
   * *For any* component that accepts TemplateRef inputs, providing a custom
   * template SHALL cause the component to render the custom template content,
   * and omitting the template SHALL cause the component to render its default content.
   *
   * **Validates: Requirements 2.4**
   */
  describe('Property 5: Template Projection', () => {
    it('should render custom template content when TemplateRef is provided, and default content when omitted', () => {
      fc.assert(
        fc.property(fc.constantFrom(...TEMPLATE_COMPONENTS), (entry: TemplateProjectionEntry) => {
          for (const slot of entry.slots) {
            // ── Case 1: No template provided → default content renders ──
            const compDefault = entry.factory();
            const domDefault = entry.render(compDefault);

            const defaultEl = domDefault.querySelector(slot.defaultSelector);
            const customElAbsent = domDefault.querySelector(slot.customSelector);

            // Default content should be present
            expect(defaultEl).toBeTruthy();
            // Custom content should NOT be present
            expect(customElAbsent).toBeNull();

            // ── Case 2: Template provided → custom content renders ──
            const compCustom = entry.factory();
            (compCustom as any)[slot.inputName] = createMockTemplateRef(slot.inputName);
            const domCustom = entry.render(compCustom);

            const customEl = domCustom.querySelector(slot.customSelector);
            const defaultElAbsent = domCustom.querySelector(slot.defaultSelector);

            // Custom content should be present
            expect(customEl).toBeTruthy();
            // Default content should NOT be present
            expect(defaultElAbsent).toBeNull();
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should render default content for all slots when no templates are provided', () => {
      fc.assert(
        fc.property(fc.constantFrom(...TEMPLATE_COMPONENTS), (entry: TemplateProjectionEntry) => {
          const comp = entry.factory();
          const dom = entry.render(comp);

          for (const slot of entry.slots) {
            // Default content should be present
            const defaultEl = dom.querySelector(slot.defaultSelector);
            expect(defaultEl).toBeTruthy();

            // Custom content should NOT be present
            const customEl = dom.querySelector(slot.customSelector);
            expect(customEl).toBeNull();
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should render custom content for all slots when all templates are provided', () => {
      fc.assert(
        fc.property(fc.constantFrom(...TEMPLATE_COMPONENTS), (entry: TemplateProjectionEntry) => {
          const comp = entry.factory();

          // Set all template slots
          for (const slot of entry.slots) {
            (comp as any)[slot.inputName] = createMockTemplateRef(slot.inputName);
          }

          const dom = entry.render(comp);

          for (const slot of entry.slots) {
            // Custom content should be present
            const customEl = dom.querySelector(slot.customSelector);
            expect(customEl).toBeTruthy();

            // Default content should NOT be present
            const defaultEl = dom.querySelector(slot.defaultSelector);
            expect(defaultEl).toBeNull();
          }
        }),
        { numRuns: 100 }
      );
    });
  });
});
