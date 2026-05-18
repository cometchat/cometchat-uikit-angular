/**
 * CometChatSearchBar Storybook Stories
 *
 * Interactive stories demonstrating the search bar component variants:
 * - Default search bar with standard placeholder
 * - Empty search bar (no text)
 * - Search bar with a pre-filled value
 * - Custom placeholder text
 * - All variants showcase
 *
 * @module components/cometchat-search-bar
 */

import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CometChatSearchBarComponent } from './cometchat-search-bar.component';

// ============================================
// Meta Configuration
// ============================================

const meta: Meta<CometChatSearchBarComponent> = {
  title: 'Base Elements/Search Bar',
  component: CometChatSearchBarComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [CommonModule, FormsModule],
    }),
  ],
  args: {
    searchText: '',
    placeholderText: 'Search...',
    debounceDelay: 300,
  },
  argTypes: {
    searchText: {
      control: 'text',
      description: 'Initial/controlled search text value',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: "''" },
        category: 'Data',
      },
    },
    placeholderText: {
      control: 'text',
      description: 'Placeholder text displayed when the input is empty',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: "'Search...'" },
        category: 'Display',
      },
    },
    debounceDelay: {
      control: 'number',
      description: 'Debounce delay in milliseconds before emitting searchChanged',
      table: {
        type: { summary: 'number' },
        defaultValue: { summary: '300' },
        category: 'Behavior',
      },
    },
    ariaLabel: {
      control: 'text',
      description: 'Custom aria-label for the search input (overrides placeholderText)',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'undefined' },
        category: 'Display',
      },
    },
    searchChanged: {
      action: 'searchChanged',
      description: 'Emitted when search text changes (debounced)',
      table: {
        type: { summary: 'EventEmitter<{ value: string }>' },
        category: 'Events',
      },
    },
    clearClick: {
      action: 'clearClick',
      description: 'Emitted when the clear button is clicked',
      table: {
        type: { summary: 'EventEmitter<void>' },
        category: 'Events',
      },
    },
    focusFirstListItem: {
      action: 'focusFirstListItem',
      description: 'Emitted when ArrowDown is pressed to move focus to the first list item',
      table: {
        type: { summary: 'EventEmitter<void>' },
        category: 'Events',
      },
    },
  },
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'CometChatSearchBar is a fully accessible search input component with debounced search, a clear button, and keyboard support (Escape to clear, ArrowDown to focus list). It integrates with Angular forms via FormsModule.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<CometChatSearchBarComponent>;

// ============================================
// Stories
// ============================================

/** Default search bar with standard placeholder and empty input. */
export const Default: Story = {
  args: {
    searchText: '',
    placeholderText: 'Search...',
    debounceDelay: 300,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Default search bar rendered with the standard placeholder text and an empty input. This is the most common initial state.',
      },
    },
  },
};

/** Empty search bar with no text and no placeholder override. */
export const Empty: Story = {
  args: {
    searchText: '',
    placeholderText: 'Search...',
    debounceDelay: 300,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Search bar in the empty state with no user input. The clear button is hidden since there is no text to clear.',
      },
    },
  },
};

/** Search bar pre-filled with a search value. */
export const WithValue: Story = {
  args: {
    searchText: 'John Doe',
    placeholderText: 'Search users...',
    debounceDelay: 300,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Search bar pre-filled with an initial value. The clear button is visible, allowing the user to reset the input.',
      },
    },
  },
};

/** Search bar with a custom placeholder describing the search context. */
export const CustomPlaceholder: Story = {
  args: {
    searchText: '',
    placeholderText: 'Search conversations...',
    debounceDelay: 300,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Search bar with a custom placeholder that provides context about what the user can search for.',
      },
    },
  },
};

// ============================================
// Showcase
// ============================================

/** Comprehensive showcase of all search bar variants in a single view. */
export const AllVariantsShowcase: Story = {
  render: () => ({
    template: `
      <div class="cometchat-search-bar-showcase" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-5); padding: var(--cometchat-padding-5);">

        <h3 class="cometchat-search-bar-showcase__title" style="margin: 0; font: var(--cometchat-font-heading3-bold); color: var(--cometchat-text-color-primary);">
          Search Bar Variants
        </h3>

        <!-- Empty State -->
        <div class="cometchat-search-bar-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-3);">
          <p class="cometchat-search-bar-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Empty (Default Placeholder)
          </p>
          <div class="cometchat-search-bar-showcase__group" style="padding-left: var(--cometchat-padding-2);">
            <cometchat-search-bar [placeholderText]="'Search...'"></cometchat-search-bar>
          </div>
        </div>

        <!-- With Value -->
        <div class="cometchat-search-bar-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-3);">
          <p class="cometchat-search-bar-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            With Pre-filled Value
          </p>
          <div class="cometchat-search-bar-showcase__group" style="padding-left: var(--cometchat-padding-2);">
            <cometchat-search-bar [searchText]="'John Doe'" [placeholderText]="'Search users...'"></cometchat-search-bar>
          </div>
        </div>

        <!-- Custom Placeholders -->
        <div class="cometchat-search-bar-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-3);">
          <p class="cometchat-search-bar-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Custom Placeholders
          </p>
          <div class="cometchat-search-bar-showcase__group" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-3); padding-left: var(--cometchat-padding-2);">
            <cometchat-search-bar [placeholderText]="'Search conversations...'"></cometchat-search-bar>
            <cometchat-search-bar [placeholderText]="'Search groups...'"></cometchat-search-bar>
            <cometchat-search-bar [placeholderText]="'Search in messages...'"></cometchat-search-bar>
          </div>
        </div>

      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Comprehensive showcase displaying all search bar variants — empty, with value, and custom placeholders — in a single view. All styling uses CometChat CSS variables for theme consistency.',
      },
    },
  },
};

// ============================================
// Interaction Tests — Prop Verification
// ============================================

import { expect } from '@storybook/test';

/** Verifies search bar renders with placeholder text. */
export const TestPlaceholderText: Story = {
  args: { placeholderText: 'Search users...' },
  play: async ({ canvasElement }) => {
    await new Promise(r => setTimeout(r, 500));
    const input = canvasElement.querySelector('input') as HTMLInputElement;
    expect(input).not.toBeNull();
    expect(input.placeholder).toContain('Search users');
  },
};

/** Verifies searchText prop pre-fills the input. */
export const TestSearchTextPrefill: Story = {
  args: { searchText: 'hello', placeholderText: 'Search...' },
  play: async ({ canvasElement }) => {
    await new Promise(r => setTimeout(r, 500));
    const input = canvasElement.querySelector('input') as HTMLInputElement;
    expect(input).not.toBeNull();
    expect(input.value).toBe('hello');
  },
};

/** Verifies empty searchText shows empty input. */
export const TestEmptySearchText: Story = {
  args: { searchText: '', placeholderText: 'Search...' },
  play: async ({ canvasElement }) => {
    await new Promise(r => setTimeout(r, 500));
    const input = canvasElement.querySelector('input') as HTMLInputElement;
    expect(input).not.toBeNull();
    expect(input.value).toBe('');
  },
};

/** Verifies search bar has accessible aria-label. */
export const TestAriaLabel: Story = {
  args: { ariaLabel: 'Search conversations', placeholderText: 'Search...' },
  play: async ({ canvasElement }) => {
    await new Promise(r => setTimeout(r, 500));
    const input = canvasElement.querySelector('input') as HTMLInputElement;
    expect(input).not.toBeNull();
    const label = input.getAttribute('aria-label') || input.closest('[aria-label]')?.getAttribute('aria-label');
    expect(label).toBeTruthy();
  },
};

/** Verifies search icon is present. */
export const TestSearchIconPresent: Story = {
  args: { placeholderText: 'Search...' },
  play: async ({ canvasElement }) => {
    await new Promise(r => setTimeout(r, 500));
    const icon = canvasElement.querySelector('.cometchat-search-bar__icon, [class*="search-bar"] svg, [class*="search-bar"] img');
    expect(icon).not.toBeNull();
  },
};
