/**
 * CometChatDropDown Storybook Stories
 *
 * Interactive stories demonstrating the dropdown component variants:
 * - Default dropdown with placeholder
 * - Dropdown with options populated
 * - Empty options state
 * - All variants showcase
 *
 * @module components/cometchat-dropdown
 */

import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CommonModule } from '@angular/common';
import { CometChatDropDownComponent } from './cometchat-dropdown.component';

// ============================================
// Meta Configuration
// ============================================

const meta: Meta<CometChatDropDownComponent> = {
  title: 'Base Elements/Dropdown',
  component: CometChatDropDownComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [CommonModule],
    }),
  ],
  args: {
    options: ['Option 1', 'Option 2', 'Option 3'],
    selectedOption: '',
    placeholder: 'Select an option',
  },
  argTypes: {
    options: {
      control: 'object',
      description: 'List of string options displayed in the dropdown menu',
      table: {
        type: { summary: 'string[]' },
        defaultValue: { summary: '[]' },
        category: 'Data',
      },
    },
    selectedOption: {
      control: 'text',
      description: 'Currently selected option value',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: "''" },
        category: 'Data',
      },
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text shown when no option is selected',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: "''" },
        category: 'Display',
      },
    },
    ariaLabel: {
      control: 'text',
      description: 'Custom ARIA label for the dropdown button, overriding the default',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'undefined' },
        category: 'Display',
      },
    },
    optionsChanged: {
      action: 'optionsChanged',
      description: 'Emitted when the user selects an option from the dropdown',
      table: {
        type: { summary: 'EventEmitter<{ value: string }>' },
        category: 'Events',
      },
    },
  },
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'CometChatDropDown is a fully accessible dropdown select component with keyboard navigation (arrow keys, type-ahead search, Home/End keys), screen reader support via ARIA attributes, and click-outside-to-close behavior.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<CometChatDropDownComponent>;

// ============================================
// Stories
// ============================================

/** Default dropdown with a placeholder and basic options. */
export const Default: Story = {
  args: {
    options: ['Option 1', 'Option 2', 'Option 3'],
    selectedOption: '',
    placeholder: 'Select an option',
  },
  render: args => ({
    props: args,
    template: `
      <div data-cometchat-container
           style="position:relative; width:400px; height:300px; overflow:visible; display:flex; align-items:center; justify-content:center;">
        <cometchat-dropdown
          [options]="options"
          [selectedOption]="selectedOption"
          [placeholder]="placeholder">
        </cometchat-dropdown>
      </div>
    `,
  }),
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        story:
          'Default dropdown rendered with a placeholder and a basic set of options. This is the most common usage.',
      },
    },
  },
};

/** Dropdown populated with options and a pre-selected value. */
export const WithOptions: Story = {
  args: {
    options: ['Small', 'Medium', 'Large', 'Extra Large'],
    selectedOption: 'Medium',
    placeholder: 'Select size',
  },
  render: args => ({
    props: args,
    template: `
      <div data-cometchat-container
           style="position:relative; width:400px; height:300px; overflow:visible; display:flex; align-items:center; justify-content:center;">
        <cometchat-dropdown
          [options]="options"
          [selectedOption]="selectedOption"
          [placeholder]="placeholder">
        </cometchat-dropdown>
      </div>
    `,
  }),
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        story: 'Dropdown with a list of size options and a pre-selected value of "Medium".',
      },
    },
  },
};

/** Dropdown with an empty options array showing only the placeholder. */
export const EmptyOptions: Story = {
  args: {
    options: [],
    selectedOption: '',
    placeholder: 'No options available',
  },
  render: args => ({
    props: args,
    template: `
      <div data-cometchat-container
           style="position:relative; width:400px; height:300px; overflow:visible; display:flex; align-items:center; justify-content:center;">
        <cometchat-dropdown
          [options]="options"
          [selectedOption]="selectedOption"
          [placeholder]="placeholder">
        </cometchat-dropdown>
      </div>
    `,
  }),
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        story:
          'Dropdown rendered with an empty options array. Only the placeholder text is visible, demonstrating the empty state.',
      },
    },
  },
};

// ============================================
// Showcase
// ============================================

/** Comprehensive showcase of all dropdown variants in a single view. */
export const AllVariantsShowcase: Story = {
  render: () => ({
    template: `
      <div data-cometchat-container
           style="position:relative; width:500px; min-height:400px; overflow:visible; padding: var(--cometchat-spacing-5);">
        <div class="cometchat-dropdown-showcase" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-5);">

          <h3 class="cometchat-dropdown-showcase__title" style="margin: 0; font: var(--cometchat-font-heading3-bold); color: var(--cometchat-text-color-primary);">
            Dropdown Variants
          </h3>

          <!-- Default State -->
          <div class="cometchat-dropdown-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-3);">
            <p class="cometchat-dropdown-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
              Default (with placeholder)
            </p>
            <cometchat-dropdown
              [options]="defaultOptions"
              [placeholder]="'Select an option'">
            </cometchat-dropdown>
          </div>

          <!-- Pre-selected Option -->
          <div class="cometchat-dropdown-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-3);">
            <p class="cometchat-dropdown-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
              Pre-selected Option
            </p>
            <cometchat-dropdown
              [options]="sizeOptions"
              [selectedOption]="'Medium'"
              [placeholder]="'Select size'">
            </cometchat-dropdown>
          </div>

          <!-- Empty Options -->
          <div class="cometchat-dropdown-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-3);">
            <p class="cometchat-dropdown-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
              Empty Options
            </p>
            <cometchat-dropdown
              [options]="emptyOptions"
              [placeholder]="'No options available'">
            </cometchat-dropdown>
          </div>

          <!-- Many Options (scrollable) -->
          <div class="cometchat-dropdown-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-3);">
            <p class="cometchat-dropdown-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
              Many Options (scrollable)
            </p>
            <cometchat-dropdown
              [options]="monthOptions"
              [selectedOption]="'January'"
              [placeholder]="'Select month'">
            </cometchat-dropdown>
          </div>

        </div>
      </div>
    `,
    props: {
      defaultOptions: ['Option 1', 'Option 2', 'Option 3'],
      sizeOptions: ['Small', 'Medium', 'Large', 'Extra Large'],
      emptyOptions: [] as string[],
      monthOptions: [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
      ],
    },
  }),
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        story:
          'Comprehensive showcase displaying all dropdown variants — default with placeholder, pre-selected option, empty options, and many options — in a single view. All styling uses CometChat CSS variables for theme consistency.',
      },
    },
  },
};
