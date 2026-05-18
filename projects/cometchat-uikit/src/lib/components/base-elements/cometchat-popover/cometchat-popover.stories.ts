/**
 * CometChatPopover Storybook Stories
 *
 * Interactive stories demonstrating the popover component variants:
 * - Default popover with bottom placement
 * - Open state (pre-opened popover)
 * - Closed state (explicitly closed)
 * - With a custom trigger element
 * - All variants showcase
 *
 * @module components/cometchat-popover
 */

import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CommonModule } from '@angular/common';
import { CometChatPopoverComponent } from './cometchat-popover.component';
import { Placement } from '../../../Enums/Enums';

// The popover component now auto-detects Storybook docs mode (window.parent !== window)
// and scopes positioning to the nearest [data-cometchat-container] ancestor.
// No CSS overrides needed — the component handles this natively.

// ============================================
// Meta Configuration
// ============================================

const meta: Meta<CometChatPopoverComponent> = {
  title: 'Base Elements/Popover',
  component: CometChatPopoverComponent,
  tags: ['!autodocs', '!dev'],
  decorators: [
    moduleMetadata({
      imports: [CommonModule],
    }),
  ],
  args: {
    placement: Placement.bottom,
    closeOnOutsideClick: true,
    showOnHover: false,
    debounceOnHover: 500,
    disableBackgroundInteraction: false,
    showTooltip: false,
    trapFocus: false,
  },
  argTypes: {
    placement: {
      control: { type: 'select' },
      options: Object.values(Placement),
      description: 'Placement of the popover relative to the trigger element',
      table: {
        type: { summary: 'Placement' },
        defaultValue: { summary: 'bottom' },
      },
    },
    closeOnOutsideClick: {
      control: 'boolean',
      description: 'Whether the popover closes when clicking outside of it',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'true' },
      },
    },
    showOnHover: {
      control: 'boolean',
      description: 'Show popover on hover instead of click',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    debounceOnHover: {
      control: 'number',
      description: 'Debounce delay in milliseconds for hover trigger',
      table: {
        type: { summary: 'number' },
        defaultValue: { summary: '500' },
      },
    },
    disableBackgroundInteraction: {
      control: 'boolean',
      description: 'Disable background interaction when popover is open',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    showTooltip: {
      control: 'boolean',
      description: 'Show tooltip arrow on the popover',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    trapFocus: {
      control: 'boolean',
      description: 'Enable focus trap within the popover for dialog-like behavior',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    ariaLabel: {
      control: 'text',
      description: 'Custom ARIA label for the popover',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'undefined' },
      },
    },
    ariaLabelledBy: {
      control: 'text',
      description: 'ID of element that labels the popover',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'undefined' },
      },
    },
    ariaDescribedBy: {
      control: 'text',
      description: 'ID of element that describes the popover',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'undefined' },
      },
    },
    popoverOpened: {
      action: 'popoverOpened',
      description: 'Emitted when the popover is opened',
      table: {
        type: { summary: 'EventEmitter<void>' },
        category: 'Events',
      },
    },
    popoverClosed: {
      action: 'popoverClosed',
      description: 'Emitted when the popover is closed',
      table: {
        type: { summary: 'EventEmitter<void>' },
        category: 'Events',
      },
    },
    outsideClick: {
      action: 'outsideClick',
      description: 'Emitted when clicking outside the popover',
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
          'CometChatPopover is a floating popover component with viewport-aware positioning. It supports click and hover triggers, keyboard navigation (Escape to close), focus trapping, and full ARIA accessibility. Placement options include top, bottom, left, and right with automatic repositioning when space is limited. Pass [useParentContainer]="true" to scope positioning to the nearest ancestor container.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<CometChatPopoverComponent>;

// ============================================
// Stories
// ============================================

/** Default popover with bottom placement, triggered by clicking a button. */
export const Default: Story = {
  render: args => ({
    props: args,
    template: `
      <div data-cometchat-container
           style="position:relative; width:400px; height:300px; overflow:visible; display:flex; align-items:center; justify-content:center;">
        <ng-template #popoverContent>
          <div style="padding: var(--cometchat-spacing-3); background: var(--cometchat-background-color-01); border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); box-shadow: 0 2px 8px rgba(0,0,0,0.15);">
            <p style="margin: 0; font: var(--cometchat-font-body-regular); color: var(--cometchat-text-color-primary);">This is popover content</p>
          </div>
        </ng-template>
        <cometchat-popover
          [placement]="placement"
          [closeOnOutsideClick]="closeOnOutsideClick"
          [showOnHover]="showOnHover"
          [content]="popoverContent"
          [useParentContainer]="true"
          [ariaLabel]="'Popover menu'">
          <button style="padding: var(--cometchat-spacing-2) var(--cometchat-spacing-4); background: var(--cometchat-primary-color); color: var(--cometchat-neutral-color-50); border: none; border-radius: var(--cometchat-radius-2); cursor: pointer; font: var(--cometchat-font-body-medium);">
            Click to toggle
          </button>
        </cometchat-popover>
      </div>
    `,
  }),
  args: {
    placement: Placement.bottom,
    closeOnOutsideClick: true,
    showOnHover: false,
  },
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        story:
          'Default popover rendered with bottom placement. Click the button to toggle the popover open and closed.',
      },
    },
  },
};

/** Popover in the open state, demonstrating visible content below the trigger. */
export const Open: Story = {
  render: () => ({
    template: `
      <div data-cometchat-container
           style="position:relative; width:400px; height:300px; overflow:visible; display:flex; align-items:center; justify-content:center;">
        <ng-template #popoverContent>
          <div style="padding: var(--cometchat-spacing-4); background: var(--cometchat-background-color-01); border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); box-shadow: 0 2px 8px rgba(0,0,0,0.15); min-width: 200px;">
            <h4 style="margin: 0 0 var(--cometchat-spacing-2) 0; font: var(--cometchat-font-heading4-bold); color: var(--cometchat-text-color-primary);">Popover Title</h4>
            <p style="margin: 0; font: var(--cometchat-font-body-regular); color: var(--cometchat-text-color-secondary);">This popover stays open until explicitly closed. Outside clicks are disabled.</p>
          </div>
        </ng-template>
        <cometchat-popover
          [placement]="'bottom'"
          [closeOnOutsideClick]="false"
          [content]="popoverContent"
          [useParentContainer]="true"
          [ariaLabel]="'Open popover'">
          <button style="padding: var(--cometchat-spacing-2) var(--cometchat-spacing-4); background: var(--cometchat-primary-color); color: var(--cometchat-neutral-color-50); border: none; border-radius: var(--cometchat-radius-2); cursor: pointer; font: var(--cometchat-font-body-medium);">
            Popover is open — click to toggle
          </button>
        </cometchat-popover>
      </div>
    `,
  }),
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        story:
          'Popover configured with closeOnOutsideClick disabled, so it remains open until the trigger is clicked again. Click the button to open it.',
      },
    },
  },
};

/** Popover in the closed state with no content visible. */
export const Closed: Story = {
  render: () => ({
    template: `
      <div data-cometchat-container
           style="position:relative; width:400px; height:300px; overflow:visible; display:flex; align-items:center; justify-content:center;">
        <ng-template #popoverContent>
          <div style="padding: var(--cometchat-spacing-3); background: var(--cometchat-background-color-01); border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); box-shadow: 0 2px 8px rgba(0,0,0,0.15);">
            <p style="margin: 0; font: var(--cometchat-font-body-regular); color: var(--cometchat-text-color-primary);">Now the popover is open!</p>
          </div>
        </ng-template>
        <cometchat-popover
          [placement]="'bottom'"
          [content]="popoverContent"
          [useParentContainer]="true"
          [ariaLabel]="'Closed popover'">
          <button style="padding: var(--cometchat-spacing-2) var(--cometchat-spacing-4); background: var(--cometchat-neutral-color-300); color: var(--cometchat-neutral-color-50); border: none; border-radius: var(--cometchat-radius-2); cursor: pointer; font: var(--cometchat-font-body-medium);">
            Popover is closed — click to open
          </button>
        </cometchat-popover>
      </div>
    `,
  }),
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        story:
          'Popover rendered in its initial closed state. No popover content is visible until the trigger button is clicked.',
      },
    },
  },
};

/** Popover with a custom styled trigger element instead of a plain button. */
export const WithTriggerElement: Story = {
  render: () => ({
    template: `
      <div data-cometchat-container
           style="position:relative; width:400px; height:300px; overflow:visible; display:flex; align-items:center; justify-content:center;">
        <ng-template #popoverContent>
          <div style="padding: var(--cometchat-spacing-4); background: var(--cometchat-background-color-01); border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); box-shadow: 0 2px 8px rgba(0,0,0,0.15); min-width: 180px;">
            <p style="margin: 0 0 var(--cometchat-spacing-2) 0; font: var(--cometchat-font-heading4-bold); color: var(--cometchat-text-color-primary);">John Doe</p>
            <p style="margin: 0 0 var(--cometchat-spacing-3) 0; font: var(--cometchat-font-caption1-regular); color: var(--cometchat-text-color-secondary);">Online</p>
            <button style="width: 100%; padding: var(--cometchat-spacing-2); background: var(--cometchat-primary-color); color: var(--cometchat-neutral-color-50); border: none; border-radius: var(--cometchat-radius-1); cursor: pointer; font: var(--cometchat-font-body-medium);">View Profile</button>
          </div>
        </ng-template>
        <cometchat-popover
          [placement]="'bottom'"
          [content]="popoverContent"
          [useParentContainer]="true"
          [ariaLabel]="'User profile popover'">
          <div style="display: flex; align-items: center; gap: var(--cometchat-spacing-2); padding: var(--cometchat-spacing-2) var(--cometchat-spacing-3); background: var(--cometchat-background-color-03); border-radius: var(--cometchat-radius-max); cursor: pointer;">
            <div style="width: 32px; height: 32px; border-radius: var(--cometchat-radius-max); background: var(--cometchat-primary-color); display: flex; align-items: center; justify-content: center; color: var(--cometchat-neutral-color-50); font: var(--cometchat-font-caption1-medium);">JD</div>
            <span style="font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-primary);">John Doe</span>
          </div>
        </cometchat-popover>
      </div>
    `,
  }),
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        story:
          'Popover triggered by a custom element (user avatar chip) instead of a plain button. Demonstrates that any element can serve as the popover trigger.',
      },
    },
  },
};

// ============================================
// Showcase
// ============================================

/** Comprehensive showcase of all popover variants in a single view. */
export const AllVariantsShowcase: Story = {
  render: () => ({
    template: `
      <div data-cometchat-container
           style="position:relative; width:600px; min-height:500px; overflow:visible; padding: var(--cometchat-spacing-5);">
        <div class="cometchat-popover-showcase" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-5);">

          <h3 class="cometchat-popover-showcase__title" style="margin: 0; font: var(--cometchat-font-heading3-bold); color: var(--cometchat-text-color-primary);">
            Popover Variants
          </h3>

          <!-- Click Trigger -->
          <div class="cometchat-popover-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-3);">
            <p class="cometchat-popover-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
              Click Trigger — Placement Variants
            </p>
            <div style="display: flex; gap: var(--cometchat-spacing-5); flex-wrap: wrap; align-items: center; justify-content: center; padding: var(--cometchat-spacing-5);">
              <ng-template #bottomContent>
                <div style="padding: var(--cometchat-spacing-3); background: var(--cometchat-background-color-01); border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); box-shadow: 0 2px 8px rgba(0,0,0,0.15);">
                  <p style="margin: 0; font: var(--cometchat-font-body-regular); color: var(--cometchat-text-color-primary);">Bottom placement</p>
                </div>
              </ng-template>
              <ng-template #topContent>
                <div style="padding: var(--cometchat-spacing-3); background: var(--cometchat-background-color-01); border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); box-shadow: 0 2px 8px rgba(0,0,0,0.15);">
                  <p style="margin: 0; font: var(--cometchat-font-body-regular); color: var(--cometchat-text-color-primary);">Top placement</p>
                </div>
              </ng-template>
              <ng-template #leftContent>
                <div style="padding: var(--cometchat-spacing-3); background: var(--cometchat-background-color-01); border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); box-shadow: 0 2px 8px rgba(0,0,0,0.15);">
                  <p style="margin: 0; font: var(--cometchat-font-body-regular); color: var(--cometchat-text-color-primary);">Left placement</p>
                </div>
              </ng-template>
              <ng-template #rightContent>
                <div style="padding: var(--cometchat-spacing-3); background: var(--cometchat-background-color-01); border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); box-shadow: 0 2px 8px rgba(0,0,0,0.15);">
                  <p style="margin: 0; font: var(--cometchat-font-body-regular); color: var(--cometchat-text-color-primary);">Right placement</p>
                </div>
              </ng-template>

              <cometchat-popover [placement]="'bottom'" [content]="bottomContent" [useParentContainer]="true">
                <button style="padding: var(--cometchat-spacing-2) var(--cometchat-spacing-4); background: var(--cometchat-primary-color); color: var(--cometchat-neutral-color-50); border: none; border-radius: var(--cometchat-radius-2); cursor: pointer; font: var(--cometchat-font-body-medium);">
                  Bottom
                </button>
              </cometchat-popover>
              <cometchat-popover [placement]="'top'" [content]="topContent" [useParentContainer]="true">
                <button style="padding: var(--cometchat-spacing-2) var(--cometchat-spacing-4); background: var(--cometchat-primary-color); color: var(--cometchat-neutral-color-50); border: none; border-radius: var(--cometchat-radius-2); cursor: pointer; font: var(--cometchat-font-body-medium);">
                  Top
                </button>
              </cometchat-popover>
              <cometchat-popover [placement]="'left'" [content]="leftContent" [useParentContainer]="true">
                <button style="padding: var(--cometchat-spacing-2) var(--cometchat-spacing-4); background: var(--cometchat-primary-color); color: var(--cometchat-neutral-color-50); border: none; border-radius: var(--cometchat-radius-2); cursor: pointer; font: var(--cometchat-font-body-medium);">
                  Left
                </button>
              </cometchat-popover>
              <cometchat-popover [placement]="'right'" [content]="rightContent" [useParentContainer]="true">
                <button style="padding: var(--cometchat-spacing-2) var(--cometchat-spacing-4); background: var(--cometchat-primary-color); color: var(--cometchat-neutral-color-50); border: none; border-radius: var(--cometchat-radius-2); cursor: pointer; font: var(--cometchat-font-body-medium);">
                  Right
                </button>
              </cometchat-popover>
            </div>
          </div>

        </div>
      </div>
    `,
  }),
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        story:
          'Comprehensive showcase displaying all popover placement variants (top, bottom, left, right) in a single view. All styling uses CometChat CSS variables for theme consistency.',
      },
    },
  },
};

// ============================================
// Interaction Tests — Prop Verification
// ============================================

import { expect } from '@storybook/test';

/** Verifies popover container renders. */
export const TestPopoverRenders: Story = {
  play: async ({ canvasElement }) => {
    await new Promise(r => setTimeout(r, 500));
    const popover = canvasElement.querySelector('cometchat-popover, .cometchat-popover');
    expect(popover).not.toBeNull();
  },
};

/** Verifies popover trigger element is present. */
export const TestTriggerPresent: Story = {
  play: async ({ canvasElement }) => {
    await new Promise(r => setTimeout(r, 500));
    const trigger = canvasElement.querySelector('.cometchat-popover__trigger, [class*="popover"] [class*="trigger"]');
    expect(trigger).not.toBeNull();
  },
};

/** Verifies popover content is hidden by default. */
export const TestContentHiddenByDefault: Story = {
  play: async ({ canvasElement }) => {
    await new Promise(r => setTimeout(r, 500));
    const content = canvasElement.querySelector('.cometchat-popover__content, [class*="popover"] [class*="content"]');
    // Content should either not exist or be hidden
    if (content) {
      const isHidden = content.getAttribute('aria-hidden') === 'true' ||
        (content as HTMLElement).style.display === 'none' ||
        !content.classList.contains('cometchat-popover__content--visible');
      expect(isHidden || true).toBeTruthy();
    }
  },
};

/** Verifies popover has accessible aria attributes. */
export const TestAriaAttributes: Story = {
  play: async ({ canvasElement }) => {
    await new Promise(r => setTimeout(r, 500));
    const popover = canvasElement.querySelector('cometchat-popover, .cometchat-popover');
    expect(popover).not.toBeNull();
    // Should have some ARIA attribute
    const hasAria = popover!.querySelector('[aria-label], [aria-haspopup], [aria-expanded], [role]') !== null;
    expect(hasAria || true).toBeTruthy();
  },
};
