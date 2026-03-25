/**
 * CometChatCheckbox Storybook Stories
 *
 * Interactive stories demonstrating the checkbox component variants:
 * - Default checkbox with label
 * - Checked state
 * - Unchecked state
 * - Indeterminate state (partial selection)
 * - All variants showcase
 *
 * @module components/cometchat-checkbox
 */

import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CommonModule } from '@angular/common';
import { CometChatCheckboxComponent } from './cometchat-checkbox.component';

// ============================================
// Meta Configuration
// ============================================

const meta: Meta<CometChatCheckboxComponent> = {
  title: 'Base Elements/Checkbox',
  component: CometChatCheckboxComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [CommonModule],
    }),
  ],
  args: {
    checked: false,
    labelText: 'Accept terms and conditions',
    disabled: false,
    indeterminate: false,
  },
  argTypes: {
    checked: {
      control: 'boolean',
      description: 'Checked state of the checkbox',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'Behavior',
      },
    },
    labelText: {
      control: 'text',
      description: 'Label text displayed next to the checkbox',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: "''" },
        category: 'Display',
      },
    },
    disabled: {
      control: 'boolean',
      description: 'Disabled state — prevents user interaction',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'Behavior',
      },
    },
    indeterminate: {
      control: 'boolean',
      description:
        'Indeterminate state for partial selection (e.g., "select all" with some items selected)',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'Behavior',
      },
    },
    ariaLabel: {
      control: 'text',
      description: 'Custom aria-label that overrides labelText for accessibility',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'undefined' },
        category: 'Display',
      },
    },
    checkboxChanged: {
      action: 'checkboxChanged',
      description: 'Emitted when the checkbox value changes',
      table: {
        type: { summary: 'EventEmitter<{ checked: boolean; labelText: string }>' },
        category: 'Events',
      },
    },
  },
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'CometChatCheckbox is a reusable checkbox input component supporting checked, unchecked, disabled, and indeterminate states. It implements ControlValueAccessor for Angular forms integration and provides full keyboard accessibility.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<CometChatCheckboxComponent>;

// ============================================
// Stories
// ============================================

/** Default checkbox with a label in unchecked state. */
export const Default: Story = {
  args: {
    labelText: 'Accept terms and conditions',
    checked: false,
    disabled: false,
    indeterminate: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Default checkbox rendered with a label in the unchecked state. This is the most common usage.',
      },
    },
  },
};

/** Checkbox in the checked state. */
export const Checked: Story = {
  args: {
    labelText: 'I agree to the terms',
    checked: true,
    disabled: false,
    indeterminate: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Checkbox rendered in the checked (selected) state.',
      },
    },
  },
};

/** Checkbox in the unchecked state. */
export const Unchecked: Story = {
  args: {
    labelText: 'Subscribe to newsletter',
    checked: false,
    disabled: false,
    indeterminate: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Checkbox rendered in the unchecked (deselected) state.',
      },
    },
  },
};

/** Checkbox in the indeterminate state for partial selection. */
export const Indeterminate: Story = {
  args: {
    labelText: 'Select all items',
    checked: false,
    indeterminate: true,
    disabled: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Checkbox rendered in the indeterminate state, typically used for "select all" controls when only some child items are selected.',
      },
    },
  },
};

// ============================================
// Showcase
// ============================================

/** Comprehensive showcase of all checkbox variants in a single view. */
export const AllVariantsShowcase: Story = {
  render: () => ({
    template: `
      <div class="cometchat-checkbox-showcase" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-5); padding: var(--cometchat-padding-5);">

        <h3 class="cometchat-checkbox-showcase__title" style="margin: 0; font: var(--cometchat-font-heading3-bold); color: var(--cometchat-text-color-primary);">
          Checkbox Variants
        </h3>

        <!-- Basic States -->
        <div class="cometchat-checkbox-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-3);">
          <p class="cometchat-checkbox-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Basic States
          </p>
          <div class="cometchat-checkbox-showcase__group" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-3); padding-left: var(--cometchat-padding-2);">
            <cometchat-checkbox [labelText]="'Unchecked'" [checked]="false"></cometchat-checkbox>
            <cometchat-checkbox [labelText]="'Checked'" [checked]="true"></cometchat-checkbox>
            <cometchat-checkbox [labelText]="'Indeterminate'" [indeterminate]="true"></cometchat-checkbox>
          </div>
        </div>

        <!-- Disabled States -->
        <div class="cometchat-checkbox-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-3);">
          <p class="cometchat-checkbox-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Disabled States
          </p>
          <div class="cometchat-checkbox-showcase__group" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-3); padding-left: var(--cometchat-padding-2);">
            <cometchat-checkbox [labelText]="'Disabled Unchecked'" [checked]="false" [disabled]="true"></cometchat-checkbox>
            <cometchat-checkbox [labelText]="'Disabled Checked'" [checked]="true" [disabled]="true"></cometchat-checkbox>
          </div>
        </div>

        <!-- Group Usage -->
        <div class="cometchat-checkbox-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-3);">
          <p class="cometchat-checkbox-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Checkbox Group
          </p>
          <div class="cometchat-checkbox-showcase__group" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-3); padding-left: var(--cometchat-padding-2);">
            <cometchat-checkbox [labelText]="'Option A'" [checked]="true"></cometchat-checkbox>
            <cometchat-checkbox [labelText]="'Option B'" [checked]="false"></cometchat-checkbox>
            <cometchat-checkbox [labelText]="'Option C'" [checked]="true"></cometchat-checkbox>
            <cometchat-checkbox [labelText]="'Option D (Disabled)'" [checked]="false" [disabled]="true"></cometchat-checkbox>
          </div>
        </div>

      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Comprehensive showcase displaying all checkbox variants — unchecked, checked, indeterminate, disabled, and group usage — in a single view. All styling uses CometChat CSS variables for theme consistency.',
      },
    },
  },
};
