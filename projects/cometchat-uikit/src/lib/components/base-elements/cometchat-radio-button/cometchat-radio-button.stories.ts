/**
 * CometChatRadioButton Storybook Stories
 *
 * Interactive stories demonstrating the radio button component variants:
 * - Default radio button with label
 * - Selected state
 * - Unselected state
 * - All variants showcase
 *
 * @module components/cometchat-radio-button
 */

import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CommonModule } from '@angular/common';
import { CometChatRadioButtonComponent } from './cometchat-radio-button.component';

// ============================================
// Meta Configuration
// ============================================

const meta: Meta<CometChatRadioButtonComponent> = {
  title: 'Base Elements/Radio Button',
  component: CometChatRadioButtonComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [CommonModule],
    }),
  ],
  args: {
    checked: false,
    labelText: 'Option 1',
    name: 'radio-group',
    disabled: false,
    value: 'option1',
  },
  argTypes: {
    checked: {
      control: 'boolean',
      description: 'Checked state of the radio button',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'Behavior',
      },
    },
    labelText: {
      control: 'text',
      description: 'Label text displayed next to the radio button',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: "''" },
        category: 'Display',
      },
    },
    name: {
      control: 'text',
      description: 'Name for grouping radio buttons — only one in a group can be selected',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: "'radio-group'" },
        category: 'Behavior',
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
    id: {
      control: 'text',
      description: 'Unique identifier for the radio button',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: "''" },
        category: 'Behavior',
      },
    },
    value: {
      control: 'text',
      description: 'Value of the radio button submitted with the form',
      table: {
        type: { summary: 'any' },
        defaultValue: { summary: "''" },
        category: 'Data',
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
    radioChanged: {
      action: 'radioChanged',
      description: 'Emitted when the radio button value changes',
      table: {
        type: { summary: 'EventEmitter<{ checked: boolean; labelText: string; id: string }>' },
        category: 'Events',
      },
    },
  },
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'CometChatRadioButton is a reusable radio button input component supporting selected, unselected, and disabled states. It implements ControlValueAccessor for Angular forms integration, supports grouping via the name attribute, and provides full keyboard accessibility with arrow key navigation.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<CometChatRadioButtonComponent>;

// ============================================
// Stories
// ============================================

/** Default radio button with a label in unselected state. */
export const Default: Story = {
  args: {
    labelText: 'Option 1',
    name: 'default-group',
    value: 'option1',
    checked: false,
    disabled: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Default radio button rendered with a label in the unselected state. This is the most common usage.',
      },
    },
  },
};

/** Radio button in the selected state. */
export const Selected: Story = {
  args: {
    labelText: 'Selected option',
    name: 'selected-group',
    value: 'selected',
    checked: true,
    disabled: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Radio button rendered in the selected (checked) state.',
      },
    },
  },
};

/** Radio button in the unselected state. */
export const Unselected: Story = {
  args: {
    labelText: 'Unselected option',
    name: 'unselected-group',
    value: 'unselected',
    checked: false,
    disabled: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Radio button rendered in the unselected (unchecked) state.',
      },
    },
  },
};

// ============================================
// Showcase
// ============================================

/** Comprehensive showcase of all radio button variants in a single view. */
export const AllVariantsShowcase: Story = {
  render: () => ({
    template: `
      <div class="cometchat-radio-button-showcase" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-5); padding: var(--cometchat-padding-5);">

        <h3 class="cometchat-radio-button-showcase__title" style="margin: 0; font: var(--cometchat-font-heading3-bold); color: var(--cometchat-text-color-primary);">
          Radio Button Variants
        </h3>

        <!-- Basic States -->
        <div class="cometchat-radio-button-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-3);">
          <p class="cometchat-radio-button-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Basic States
          </p>
          <div class="cometchat-radio-button-showcase__group" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-3); padding-left: var(--cometchat-padding-2);">
            <cometchat-radio-button [labelText]="'Unselected'" [name]="'basic-states'" [value]="'unselected'" [checked]="false"></cometchat-radio-button>
            <cometchat-radio-button [labelText]="'Selected'" [name]="'basic-states-2'" [value]="'selected'" [checked]="true"></cometchat-radio-button>
          </div>
        </div>

        <!-- Disabled States -->
        <div class="cometchat-radio-button-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-3);">
          <p class="cometchat-radio-button-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Disabled States
          </p>
          <div class="cometchat-radio-button-showcase__group" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-3); padding-left: var(--cometchat-padding-2);">
            <cometchat-radio-button [labelText]="'Disabled Unselected'" [name]="'disabled-states'" [value]="'disabled-unselected'" [checked]="false" [disabled]="true"></cometchat-radio-button>
            <cometchat-radio-button [labelText]="'Disabled Selected'" [name]="'disabled-states-2'" [value]="'disabled-selected'" [checked]="true" [disabled]="true"></cometchat-radio-button>
          </div>
        </div>

        <!-- Group Usage -->
        <div class="cometchat-radio-button-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-3);">
          <p class="cometchat-radio-button-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Radio Button Group
          </p>
          <div class="cometchat-radio-button-showcase__group" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-3); padding-left: var(--cometchat-padding-2);">
            <cometchat-radio-button [labelText]="'Option A'" [name]="'showcase-group'" [value]="'a'" [checked]="true"></cometchat-radio-button>
            <cometchat-radio-button [labelText]="'Option B'" [name]="'showcase-group'" [value]="'b'" [checked]="false"></cometchat-radio-button>
            <cometchat-radio-button [labelText]="'Option C'" [name]="'showcase-group'" [value]="'c'" [checked]="false"></cometchat-radio-button>
            <cometchat-radio-button [labelText]="'Option D (Disabled)'" [name]="'showcase-group'" [value]="'d'" [checked]="false" [disabled]="true"></cometchat-radio-button>
          </div>
        </div>

      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Comprehensive showcase displaying all radio button variants — unselected, selected, disabled, and group usage — in a single view. All styling uses CometChat CSS variables for theme consistency.',
      },
    },
  },
};
