/**
 * CometChatPaginatedList Storybook Stories
 *
 * Interactive stories demonstrating the generic paginated list component:
 * - Default with populated items
 * - Default list with scrollbar visible
 * - Empty list with no items
 * - All variants showcase
 *
 * @module components/cometchat-paginated-list
 */

import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CommonModule } from '@angular/common';
import { CometChatPaginatedListComponent } from './cometchat-paginated-list.component';

// ============================================
// Mock Data
// ============================================

/** Sample string items for populated list stories. */
const sampleItems: string[] = Array.from({ length: 20 }, (_, i) => `Item ${i + 1}`);

/** Shorter item set for showcase sections. */
const shortItems: string[] = Array.from({ length: 5 }, (_, i) => `Entry ${i + 1}`);

// ============================================
// Meta Configuration
// ============================================

const meta: Meta<CometChatPaginatedListComponent<string>> = {
  title: 'Components/Misc/Paginated List',
  component: CometChatPaginatedListComponent,
  tags: ['!autodocs', '!dev'],
  decorators: [
    moduleMetadata({
      imports: [CommonModule],
    }),
  ],
  args: {
    items: sampleItems,
    isLoading: false,
    hasMore: true,
    error: null,
    showScrollbar: true,
    ariaLabel: 'Sample paginated list',
    hideError: false,
    enableKeyboardNavigation: true,
    isMultiSelect: false,
    loadingThreshold: 100,
  },
  argTypes: {
    items: {
      control: false,
      description: 'Array of items to display in the list',
      table: {
        type: { summary: 'T[]' },
        defaultValue: { summary: '[]' },
      },
    },
    isLoading: {
      control: 'boolean',
      description: 'Whether the list is currently loading initial data',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    hasMore: {
      control: 'boolean',
      description: 'Whether there are more items to load via infinite scroll',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'true' },
      },
    },
    error: {
      control: false,
      description: 'Error object to display in the error state',
      table: {
        type: { summary: 'Error | null' },
        defaultValue: { summary: 'null' },
      },
    },
    showScrollbar: {
      control: 'boolean',
      description: 'Whether to show the scrollbar on the list container',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    loadingThreshold: {
      control: 'number',
      description: 'Distance from bottom (in pixels) to trigger load more',
      table: {
        type: { summary: 'number' },
        defaultValue: { summary: '100' },
      },
    },
    ariaLabel: {
      control: 'text',
      description: 'ARIA label for the list container',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: "''" },
      },
    },
    enableKeyboardNavigation: {
      control: 'boolean',
      description: 'Whether keyboard navigation (ArrowUp/ArrowDown) is enabled',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'true' },
      },
    },
    isMultiSelect: {
      control: 'boolean',
      description: 'Whether the list supports multiple selection',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    hideError: {
      control: 'boolean',
      description: 'Whether to hide the error state display',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    emptyStateAriaLabel: {
      control: 'text',
      description: 'ARIA label for the empty state container',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: "''" },
      },
    },
    errorStateAriaLabel: {
      control: 'text',
      description: 'ARIA label for the error state container',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: "''" },
      },
    },
    itemTemplate: {
      control: false,
      description: 'Template for rendering each item in the list',
      table: {
        type: { summary: 'TemplateRef<{ $implicit: T; index: number }>' },
      },
    },
    loadingTemplate: {
      control: false,
      description: 'Template for the initial loading state',
      table: {
        type: { summary: 'TemplateRef<void>' },
      },
    },
    emptyTemplate: {
      control: false,
      description: 'Template for the empty state (no items)',
      table: {
        type: { summary: 'TemplateRef<void>' },
      },
    },
    errorTemplate: {
      control: false,
      description: 'Template for the error state',
      table: {
        type: { summary: 'TemplateRef<{ $implicit: Error }>' },
      },
    },
    loadingMoreTemplate: {
      control: false,
      description: 'Template for the loading-more indicator during pagination',
      table: {
        type: { summary: 'TemplateRef<void>' },
      },
    },
    loadMore: {
      action: 'loadMore',
      description: 'Emitted when more items should be loaded (infinite scroll trigger)',
      table: {
        type: { summary: 'EventEmitter<void>' },
        category: 'Events',
      },
    },
    scrollToTop: {
      action: 'scrollToTop',
      description: 'Emitted when the list is scrolled to the top',
      table: {
        type: { summary: 'EventEmitter<void>' },
        category: 'Events',
      },
    },
    scrollToBottom: {
      action: 'scrollToBottom',
      description: 'Emitted when the list is scrolled to the bottom',
      table: {
        type: { summary: 'EventEmitter<void>' },
        category: 'Events',
      },
    },
    itemClick: {
      action: 'itemClick',
      description: 'Emitted when an item is clicked',
      table: {
        type: { summary: 'EventEmitter<{ item: T; index: number }>' },
        category: 'Events',
      },
    },
    focusedIndexChange: {
      action: 'focusedIndexChange',
      description: 'Emitted when the focused index changes via keyboard navigation',
      table: {
        type: { summary: 'EventEmitter<number>' },
        category: 'Events',
      },
    },
    retry: {
      action: 'retry',
      description: 'Emitted when retry is triggered from the error state',
      table: {
        type: { summary: 'EventEmitter<void>' },
        category: 'Events',
      },
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          'CometChatPaginatedList is a generic, reusable component for infinite scroll lists. It handles pagination via IntersectionObserver, loading states, empty states, error states with retry, keyboard navigation (ArrowUp/ArrowDown, Home/End), and roving tabindex for accessibility.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<CometChatPaginatedListComponent<string>>;

// ============================================
// Stories
// ============================================

/** Default paginated list with populated items and scrollbar visible. */
export const Default: Story = {
  args: {
    items: sampleItems,
    isLoading: false,
    hasMore: true,
    error: null,
    showScrollbar: true,
    ariaLabel: 'Sample paginated list',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Default paginated list with 20 string items. Scrolling to the bottom triggers the loadMore event for infinite scroll pagination.',
      },
    },
  },
};

/** Populated list demonstrating a typical data-driven usage with visible scrollbar. */
export const DefaultList: Story = {
  args: {
    items: sampleItems,
    isLoading: false,
    hasMore: false,
    error: null,
    showScrollbar: true,
    ariaLabel: 'Default list with all items loaded',
  },
  parameters: {
    docs: {
      description: {
        story:
          'A fully loaded list with hasMore set to false, indicating all items have been fetched. No further pagination triggers will fire.',
      },
    },
  },
};

/** Empty list with no items after loading completes. */
export const EmptyList: Story = {
  args: {
    items: [],
    isLoading: false,
    hasMore: false,
    error: null,
    ariaLabel: 'Empty list',
    emptyStateAriaLabel: 'No items available',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Paginated list in its empty state after loading completes with no results. The component renders the empty state container with an optional custom template.',
      },
    },
  },
};

// ============================================
// Showcase
// ============================================

/** Comprehensive showcase of all paginated list states in a single view. */
export const AllVariantsShowcase: Story = {
  render: () => ({
    template: `
      <div class="cometchat-paginated-list-showcase" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-5); padding: var(--cometchat-padding-5);">

        <h3 class="cometchat-paginated-list-showcase__title" style="margin: 0; font: var(--cometchat-font-heading3-bold); color: var(--cometchat-text-color-primary);">
          Paginated List Variants
        </h3>

        <!-- Populated List -->
        <div class="cometchat-paginated-list-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-paginated-list-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Populated List (hasMore = true)
          </p>
          <div style="height: 200px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
            <cometchat-paginated-list
              [items]="populatedItems"
              [isLoading]="false"
              [hasMore]="true"
              [showScrollbar]="true"
              ariaLabel="Populated list showcase">
            </cometchat-paginated-list>
          </div>
        </div>

        <!-- Fully Loaded List -->
        <div class="cometchat-paginated-list-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-paginated-list-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Fully Loaded List (hasMore = false)
          </p>
          <div style="height: 200px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
            <cometchat-paginated-list
              [items]="shortItems"
              [isLoading]="false"
              [hasMore]="false"
              [showScrollbar]="true"
              ariaLabel="Fully loaded list showcase">
            </cometchat-paginated-list>
          </div>
        </div>

        <!-- Empty State -->
        <div class="cometchat-paginated-list-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-paginated-list-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Empty State
          </p>
          <div style="height: 200px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
            <cometchat-paginated-list
              [items]="emptyItems"
              [isLoading]="false"
              [hasMore]="false"
              ariaLabel="Empty list showcase"
              emptyStateAriaLabel="No items available">
            </cometchat-paginated-list>
          </div>
        </div>

        <!-- Loading State -->
        <div class="cometchat-paginated-list-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-paginated-list-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Loading State
          </p>
          <div style="height: 200px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
            <cometchat-paginated-list
              [items]="emptyItems"
              [isLoading]="true"
              [hasMore]="true"
              ariaLabel="Loading list showcase">
            </cometchat-paginated-list>
          </div>
        </div>

        <!-- Error State -->
        <div class="cometchat-paginated-list-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-paginated-list-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Error State
          </p>
          <div style="height: 200px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
            <cometchat-paginated-list
              [items]="emptyItems"
              [isLoading]="false"
              [hasMore]="false"
              [error]="sampleError"
              ariaLabel="Error list showcase"
              errorStateAriaLabel="An error occurred">
            </cometchat-paginated-list>
          </div>
        </div>

      </div>
    `,
    props: {
      populatedItems: sampleItems,
      shortItems: shortItems,
      emptyItems: [] as string[],
      sampleError: new Error('Failed to load items. Please try again.'),
    },
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Comprehensive showcase displaying all paginated list states — populated list with pagination, fully loaded list, empty state, loading state, and error state — in a single view. All styling uses CometChat CSS variables for theme consistency.',
      },
    },
  },
};
