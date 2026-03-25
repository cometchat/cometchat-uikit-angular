/**
 * CometChatLinkPopover Storybook Stories
 *
 * Interactive stories demonstrating the link action popover:
 * - Default popover with sample link data
 * - Popover display with a long URL
 * - All variants showcase
 *
 * This small popover appears when clicking on a link in the rich text
 * editor, offering quick Edit and Remove actions with full keyboard
 * navigation (Arrow keys, Escape-to-close).
 *
 * @module components/cometchat-link-popover
 */

import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CommonModule } from '@angular/common';
import { CometChatLinkPopoverComponent } from './cometchat-link-popover.component';

// ============================================
// Meta Configuration
// ============================================

const meta: Meta<CometChatLinkPopoverComponent> = {
  title: 'Components/Misc/Link Popover',
  component: CometChatLinkPopoverComponent,
  tags: ['!autodocs', '!dev'],
  decorators: [
    moduleMetadata({
      imports: [CommonModule],
    }),
  ],
  args: {
    url: 'https://example.com',
    text: 'Example Link',
    x: 200,
    y: 250,
  },
  argTypes: {
    url: {
      control: 'text',
      description: 'The link URL displayed in the popover and emitted on edit',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: "''" },
      },
    },
    text: {
      control: 'text',
      description: 'The link display text shown as the popover title',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: "''" },
      },
    },
    x: {
      control: 'number',
      description: 'X coordinate (viewport-relative) used for fallback positioning',
      table: {
        type: { summary: 'number' },
        defaultValue: { summary: '0' },
      },
    },
    y: {
      control: 'number',
      description: 'Y coordinate (viewport-relative) used for fallback positioning',
      table: {
        type: { summary: 'number' },
        defaultValue: { summary: '0' },
      },
    },
    editClick: {
      action: 'editClick',
      description: 'Emitted when the Edit button is clicked, with `{ url, text }` payload',
      table: {
        type: { summary: 'EventEmitter<LinkPopoverData>' },
        category: 'Events',
      },
    },
    removeClick: {
      action: 'removeClick',
      description: 'Emitted when the Remove button is clicked',
      table: {
        type: { summary: 'EventEmitter<void>' },
        category: 'Events',
      },
    },
    closeClick: {
      action: 'closeClick',
      description:
        'Emitted when the popover should be closed (close button, Escape, or outside click)',
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
          'CometChatLinkPopover is a floating popover that appears when clicking a link in the rich text editor. It displays the link title and URL, with Edit and Remove action buttons. Supports keyboard navigation via Arrow keys and Escape-to-close. Wrap in a [data-cometchat-container] element to scope positioning to the story canvas.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<CometChatLinkPopoverComponent>;

// ============================================
// Stories
// ============================================

/** Default link popover with a sample URL and link text. */
export const Default: Story = {
  args: {
    url: 'https://example.com',
    text: 'Example Link',
    x: 200,
    y: 250,
  },
  render: args => ({
    props: args,
    template: `
      <div data-cometchat-container
           style="position:relative; width:400px; height:300px; overflow:visible; display:flex; align-items:center; justify-content:center;">
        <cometchat-link-popover
          [url]="url"
          [text]="text"
          [x]="x"
          [y]="y">
        </cometchat-link-popover>
      </div>
    `,
  }),
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        story:
          'Default link popover showing the link title, clickable URL, and Edit/Remove action buttons. Positioned relative to the story container.',
      },
    },
  },
};

/** Popover displaying a long URL to demonstrate truncation behavior. */
export const PopoverDisplay: Story = {
  args: {
    url: 'https://www.cometchat.com/docs/angular-v5/getting-started/quickstart',
    text: 'CometChat Documentation — Getting Started Guide',
    x: 200,
    y: 250,
  },
  render: args => ({
    props: args,
    template: `
      <div data-cometchat-container
           style="position:relative; width:400px; height:300px; overflow:visible; display:flex; align-items:center; justify-content:center;">
        <cometchat-link-popover
          [url]="url"
          [text]="text"
          [x]="x"
          [y]="y">
        </cometchat-link-popover>
      </div>
    `,
  }),
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        story:
          'Link popover with a longer URL and descriptive link text. Demonstrates how the popover handles text overflow and URL truncation.',
      },
    },
  },
};

// ============================================
// Showcase
// ============================================

/** Comprehensive showcase of all link popover variants in a single view. */
export const AllVariantsShowcase: Story = {
  render: () => ({
    template: `
      <div data-cometchat-container
           style="position:relative; width:500px; min-height:400px; overflow:visible; padding: var(--cometchat-spacing-5);">
        <div class="cometchat-link-popover-showcase" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-5);">

          <h3 class="cometchat-link-popover-showcase__title" style="margin: 0; font: var(--cometchat-font-heading3-bold); color: var(--cometchat-text-color-primary);">
            Link Popover Variants
          </h3>

          <!-- Default Link -->
          <div class="cometchat-link-popover-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
            <p class="cometchat-link-popover-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
              Default Link
            </p>
            <cometchat-link-popover
              [url]="defaultUrl"
              [text]="defaultText"
              [x]="200"
              [y]="250"
            ></cometchat-link-popover>
          </div>

          <!-- Long URL -->
          <div class="cometchat-link-popover-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
            <p class="cometchat-link-popover-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
              Long URL with Descriptive Text
            </p>
            <cometchat-link-popover
              [url]="longUrl"
              [text]="longText"
              [x]="200"
              [y]="500"
            ></cometchat-link-popover>
          </div>

        </div>
      </div>
    `,
    props: {
      defaultUrl: 'https://example.com',
      defaultText: 'Example Link',
      longUrl: 'https://www.cometchat.com/docs/angular-v5/getting-started/quickstart',
      longText: 'CometChat Documentation — Getting Started Guide',
    },
  }),
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        story:
          'Comprehensive showcase displaying link popover variants — default link and long URL with descriptive text — in a single view. All styling uses CometChat CSS variables for theme consistency.',
      },
    },
  },
};
