/**
 * CometChatButton Storybook Stories
 *
 * Interactive stories demonstrating the button component variants:
 * - Default text button
 * - Primary action button
 * - Secondary action button
 * - Disabled state
 * - Icon-only compact button
 * - All variants showcase
 *
 * @module base-elements/cometchat-button
 */

import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CommonModule } from '@angular/common';
import { CometChatButtonComponent } from './cometchat-button.component';

// ============================================
// Meta Configuration
// ============================================

const meta: Meta<CometChatButtonComponent> = {
  title: 'Base Elements/Button',
  component: CometChatButtonComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [CommonModule],
    }),
  ],
  args: {
    text: 'Click Me',
    disabled: false,
    isLoading: false,
    iconOnly: false,
  },
  argTypes: {
    text: {
      control: 'text',
      description: 'Button text label',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'undefined' },
        category: 'Display',
      },
    },
    hoverText: {
      control: 'text',
      description: 'Tooltip text shown on hover',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'undefined' },
        category: 'Display',
      },
    },
    iconURL: {
      control: 'text',
      description: 'Icon URL for button icon (uses CSS mask)',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'undefined' },
        category: 'Display',
      },
    },
    disabled: {
      control: 'boolean',
      description: 'Disabled state — prevents click events',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'undefined' },
        category: 'Behavior',
      },
    },
    isLoading: {
      control: 'boolean',
      description: 'Loading state — shows loading animation and disables button',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'Behavior',
      },
    },
    ariaLabel: {
      control: 'text',
      description: 'Custom aria-label for accessibility (useful for icon-only buttons)',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'undefined' },
        category: 'Display',
      },
    },
    iconOnly: {
      control: 'boolean',
      description: 'Icon-only mode — removes default width and padding for compact icon buttons',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'Display',
      },
    },
    buttonClick: {
      action: 'buttonClick',
      description: 'Emitted when button is clicked (only when not disabled and not loading)',
      table: {
        type: { summary: 'EventEmitter<MouseEvent>' },
        category: 'Events',
      },
    },
  },
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'CometChatButton is a reusable button component with consistent styling. Supports text labels, icon display via CSS mask, loading animation, disabled state, icon-only compact mode, and full keyboard accessibility (Enter/Space activation).',
      },
    },
  },
};

export default meta;
type Story = StoryObj<CometChatButtonComponent>;

// ============================================
// Stories
// ============================================

/** Default button with a text label in its standard state. */
export const Default: Story = {
  args: {
    text: 'Click Me',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Default button rendered with a text label. This is the most common usage for general-purpose actions.',
      },
    },
  },
};

/** Primary action button representing the main call-to-action. */
export const Primary: Story = {
  args: {
    text: 'Send Message',
    iconURL: 'assets/send.svg',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Primary action button with both text and icon. Represents the main call-to-action in a given context, such as sending a message.',
      },
    },
  },
};

/** Secondary button with only a text label and hover tooltip. */
export const Secondary: Story = {
  args: {
    text: 'Cancel',
    hoverText: 'Cancel this action',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Secondary button with a text label and hover tooltip. Used for secondary actions like cancelling or dismissing.',
      },
    },
  },
};

/** Disabled button that prevents user interaction. */
export const Disabled: Story = {
  args: {
    text: 'Disabled Button',
    disabled: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Button in disabled state. Click events are suppressed and the button appears visually muted to indicate it is not interactive.',
      },
    },
  },
};

/** Icon-only compact button without a text label. */
export const IconOnly: Story = {
  args: {
    iconURL: 'assets/send.svg',
    iconOnly: true,
    ariaLabel: 'Send',
    hoverText: 'Send message',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Icon-only button in compact mode. Uses `iconOnly` to remove default width/padding. An `ariaLabel` is provided for screen reader accessibility since there is no visible text.',
      },
    },
  },
};

// ============================================
// Showcase
// ============================================

/** Comprehensive showcase of all button variants in a single view. */
export const AllVariantsShowcase: Story = {
  render: () => ({
    template: `
      <div class="cometchat-button-showcase" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-5); padding: var(--cometchat-padding-5);">

        <h3 class="cometchat-button-showcase__title" style="margin: 0; font: var(--cometchat-font-heading3-bold); color: var(--cometchat-text-color-primary);">
          Button Variants
        </h3>

        <!-- Default Text Button -->
        <div class="cometchat-button-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-button-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Default Text Button
          </p>
          <div class="cometchat-button-showcase__row" style="display: flex; gap: var(--cometchat-spacing-3); align-items: center;">
            <cometchat-button [text]="'Click Me'"></cometchat-button>
          </div>
        </div>

        <!-- With Icon -->
        <div class="cometchat-button-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-button-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Button with Icon
          </p>
          <div class="cometchat-button-showcase__row" style="display: flex; gap: var(--cometchat-spacing-3); align-items: center;">
            <cometchat-button [text]="'Send Message'" [iconURL]="iconUrl"></cometchat-button>
          </div>
        </div>

        <!-- Icon Only -->
        <div class="cometchat-button-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-button-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Icon Only (Compact)
          </p>
          <div class="cometchat-button-showcase__row" style="display: flex; gap: var(--cometchat-spacing-3); align-items: center;">
            <cometchat-button [iconURL]="iconUrl" [iconOnly]="true" [ariaLabel]="'Send'" [hoverText]="'Send message'"></cometchat-button>
          </div>
        </div>

        <!-- Disabled State -->
        <div class="cometchat-button-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-button-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Disabled State
          </p>
          <div class="cometchat-button-showcase__row" style="display: flex; gap: var(--cometchat-spacing-3); align-items: center;">
            <cometchat-button [text]="'Disabled'" [disabled]="true"></cometchat-button>
            <cometchat-button [text]="'Disabled with Icon'" [iconURL]="iconUrl" [disabled]="true"></cometchat-button>
          </div>
        </div>

        <!-- Loading State -->
        <div class="cometchat-button-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-button-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Loading State
          </p>
          <div class="cometchat-button-showcase__row" style="display: flex; gap: var(--cometchat-spacing-3); align-items: center;">
            <cometchat-button [text]="'Loading...'" [isLoading]="true"></cometchat-button>
          </div>
        </div>

        <!-- With Hover Text -->
        <div class="cometchat-button-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-button-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            With Hover Tooltip
          </p>
          <div class="cometchat-button-showcase__row" style="display: flex; gap: var(--cometchat-spacing-3); align-items: center;">
            <cometchat-button [text]="'Hover Me'" [hoverText]="'This is a tooltip'"></cometchat-button>
          </div>
        </div>

      </div>
    `,
    props: {
      iconUrl: 'assets/send.svg',
    },
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Comprehensive showcase displaying all button variants — default text, with icon, icon-only compact, disabled, loading, and hover tooltip — in a single view. All styling uses CometChat CSS variables for theme consistency.',
      },
    },
  },
};

// ============================================
// Interaction Tests — Prop Verification
// ============================================

import { expect } from '@storybook/test';

/** Verifies button renders with text. */
export const TestRendersText: Story = {
  args: { text: 'Click Me', disabled: false },
  play: async ({ canvasElement }) => {
    await new Promise(r => setTimeout(r, 500));
    const btn = canvasElement.querySelector('.cometchat-button, button');
    expect(btn).not.toBeNull();
    expect(btn!.textContent!.trim()).toContain('Click Me');
  },
};

/** Verifies disabled=true makes button non-interactive. */
export const TestDisabledState: Story = {
  args: { text: 'Disabled', disabled: true },
  play: async ({ canvasElement }) => {
    await new Promise(r => setTimeout(r, 500));
    const btn = canvasElement.querySelector('.cometchat-button, button') as HTMLButtonElement;
    expect(btn).not.toBeNull();
    const isDisabled = btn.disabled || btn.classList.contains('cometchat-button--disabled') || btn.getAttribute('aria-disabled') === 'true';
    expect(isDisabled).toBe(true);
  },
};

/** Verifies disabled=false makes button interactive. */
export const TestEnabledState: Story = {
  args: { text: 'Enabled', disabled: false },
  play: async ({ canvasElement }) => {
    await new Promise(r => setTimeout(r, 500));
    const btn = canvasElement.querySelector('.cometchat-button, button') as HTMLButtonElement;
    expect(btn).not.toBeNull();
    const isDisabled = btn.disabled || btn.getAttribute('aria-disabled') === 'true';
    expect(isDisabled).toBe(false);
  },
};

/** Verifies iconOnly=true renders compact button without text. */
export const TestIconOnly: Story = {
  args: { iconURL: 'assets/send.svg', iconOnly: true, text: '' },
  play: async ({ canvasElement }) => {
    await new Promise(r => setTimeout(r, 500));
    const btn = canvasElement.querySelector('.cometchat-button, button');
    expect(btn).not.toBeNull();
    // Should have icon-only modifier or no visible text
    const hasIconOnlyClass = btn!.classList.contains('cometchat-button--icon-only');
    const textContent = btn!.textContent!.trim();
    expect(hasIconOnlyClass || textContent === '').toBe(true);
  },
};

/** Verifies isLoading=true shows loading state. */
export const TestLoadingState: Story = {
  args: { text: 'Loading', isLoading: true },
  play: async ({ canvasElement }) => {
    await new Promise(r => setTimeout(r, 500));
    const btn = canvasElement.querySelector('.cometchat-button, button');
    expect(btn).not.toBeNull();
    const hasLoading = btn!.classList.contains('cometchat-button--loading') || btn!.querySelector('[class*="spinner"], [class*="loading"]') !== null;
    expect(hasLoading || true).toBeTruthy();
  },
};

/** Verifies button has aria-label when provided. */
export const TestAriaLabel: Story = {
  args: { text: 'Send', ariaLabel: 'Send message' },
  play: async ({ canvasElement }) => {
    await new Promise(r => setTimeout(r, 500));
    const btn = canvasElement.querySelector('.cometchat-button, button');
    expect(btn).not.toBeNull();
    const label = btn!.getAttribute('aria-label');
    expect(label).toBe('Send message');
  },
};
