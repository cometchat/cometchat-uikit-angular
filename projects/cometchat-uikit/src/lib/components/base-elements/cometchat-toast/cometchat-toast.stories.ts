/**
 * CometChatToast Storybook Stories
 *
 * Interactive stories demonstrating the toast notification component variants:
 * - Default info toast
 * - Success notification
 * - Error notification
 * - Warning notification
 * - Info notification
 * - All variants showcase
 *
 * @module components/cometchat-toast
 */

import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CommonModule } from '@angular/common';
import { CometChatToastComponent, ToastType } from './cometchat-toast.component';

// ============================================
// Shared wrapper style to contain fixed-position toast within story block
// ============================================

const toastWrapperStyle = `
  display: flex;
  align-items: center;
  justify-content: center;
`;

const toastOverrideStyle = `
  <style>
    .cometchat-toast-story-wrapper .cometchat-toast {
      position: relative !important;
      bottom: auto !important;
      left: auto !important;
      transform: none !important;
    }
  </style>
`;

// ============================================
// Meta Configuration
// ============================================

const meta: Meta<CometChatToastComponent> = {
  title: 'Base Elements/Toast',
  component: CometChatToastComponent,
  tags: ['!autodocs', '!dev'],
  decorators: [
    moduleMetadata({
      imports: [CommonModule],
    }),
  ],
  args: {
    text: 'This is an informational message',
    type: ToastType.info,
    duration: 0,
    showCloseButton: true,
    dismissOnEscape: true,
  },
  argTypes: {
    text: {
      control: 'text',
      description: 'Toast message text',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: "''" },
        category: 'Display',
      },
    },
    type: {
      control: { type: 'select' },
      options: Object.values(ToastType),
      description: 'Toast type for styling and icon — determines color scheme and icon',
      table: {
        type: { summary: 'ToastType' },
        defaultValue: { summary: "'info'" },
        category: 'Display',
      },
    },
    duration: {
      control: 'number',
      description: 'Duration in milliseconds before auto-dismiss (0 = no auto-dismiss)',
      table: {
        type: { summary: 'number' },
        defaultValue: { summary: '3000' },
        category: 'Behavior',
      },
    },
    showCloseButton: {
      control: 'boolean',
      description: 'Show close button for manual dismissal',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'true' },
        category: 'Display',
      },
    },
    dismissOnEscape: {
      control: 'boolean',
      description: 'Enable Escape key to dismiss the toast',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'true' },
        category: 'Behavior',
      },
    },
    toastClosed: {
      action: 'toastClosed',
      description: 'Emitted when the toast is closed (auto-dismiss or manual close)',
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
          'CometChatToast is a notification component for displaying temporary feedback messages. It supports different types (success, error, warning, info) with auto-dismiss, manual close, and full keyboard accessibility including Escape key dismissal.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<CometChatToastComponent>;

// ============================================
// Stories
// ============================================

/** Default info toast with a standard informational message. */
export const Default: Story = {
  render: args => ({
    props: args,
    template: `
      ${toastOverrideStyle}
      <div class="cometchat-toast-story-wrapper" style="${toastWrapperStyle}">
        <cometchat-toast [text]="text" [type]="type" [duration]="duration" [showCloseButton]="showCloseButton" [dismissOnEscape]="dismissOnEscape"></cometchat-toast>
      </div>
    `,
  }),
  args: {
    text: 'This is an informational message',
    type: ToastType.info,
    duration: 0,
    showCloseButton: true,
    dismissOnEscape: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Default toast rendered with the info type. This is the most common usage for general notifications.',
      },
    },
  },
};

/** Success toast indicating a completed operation. */
export const Success: Story = {
  render: args => ({
    props: args,
    template: `
      ${toastOverrideStyle}
      <div class="cometchat-toast-story-wrapper" style="${toastWrapperStyle}">
        <cometchat-toast [text]="text" [type]="type" [duration]="duration" [showCloseButton]="showCloseButton"></cometchat-toast>
      </div>
    `,
  }),
  args: {
    text: 'Operation completed successfully!',
    type: ToastType.success,
    duration: 0,
    showCloseButton: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Toast rendered with the success type, used to confirm that an action completed without errors.',
      },
    },
  },
};

/** Error toast indicating a failure or problem. */
export const Error: Story = {
  render: args => ({
    props: args,
    template: `
      ${toastOverrideStyle}
      <div class="cometchat-toast-story-wrapper" style="${toastWrapperStyle}">
        <cometchat-toast [text]="text" [type]="type" [duration]="duration" [showCloseButton]="showCloseButton"></cometchat-toast>
      </div>
    `,
  }),
  args: {
    text: 'An error occurred. Please try again.',
    type: ToastType.error,
    duration: 0,
    showCloseButton: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Toast rendered with the error type, used to alert the user about failures or critical issues.',
      },
    },
  },
};

/** Warning toast indicating a cautionary message. */
export const Warning: Story = {
  render: args => ({
    props: args,
    template: `
      ${toastOverrideStyle}
      <div class="cometchat-toast-story-wrapper" style="${toastWrapperStyle}">
        <cometchat-toast [text]="text" [type]="type" [duration]="duration" [showCloseButton]="showCloseButton"></cometchat-toast>
      </div>
    `,
  }),
  args: {
    text: 'Warning: This action cannot be undone.',
    type: ToastType.warning,
    duration: 0,
    showCloseButton: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Toast rendered with the warning type, used to caution the user about potentially destructive or irreversible actions.',
      },
    },
  },
};

/** Info toast for general informational messages. */
export const Info: Story = {
  render: args => ({
    props: args,
    template: `
      ${toastOverrideStyle}
      <div class="cometchat-toast-story-wrapper" style="${toastWrapperStyle}">
        <cometchat-toast [text]="text" [type]="type" [duration]="duration" [showCloseButton]="showCloseButton"></cometchat-toast>
      </div>
    `,
  }),
  args: {
    text: 'New features are available. Check the changelog.',
    type: ToastType.info,
    duration: 0,
    showCloseButton: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Toast rendered with the info type, used for non-critical informational messages and updates.',
      },
    },
  },
};

// ============================================
// Showcase
// ============================================

/** Comprehensive showcase of all toast variants in a single view. */
export const AllVariantsShowcase: Story = {
  render: () => ({
    template: `
      ${toastOverrideStyle}
      <div class="cometchat-toast-showcase" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-5); padding: var(--cometchat-padding-5);">

        <h3 class="cometchat-toast-showcase__title" style="margin: 0; font: var(--cometchat-font-heading3-bold); color: var(--cometchat-text-color-primary);">
          Toast Variants
        </h3>

        <!-- Toast Types -->
        <div class="cometchat-toast-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-3);">
          <p class="cometchat-toast-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Toast Types
          </p>
          <div class="cometchat-toast-showcase__group" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-5); padding-left: var(--cometchat-padding-2); max-width: 400px;">
            <div class="cometchat-toast-story-wrapper" style="${toastWrapperStyle}">
              <cometchat-toast [text]="'Success: Your changes have been saved'" [type]="'success'" [duration]="0"></cometchat-toast>
            </div>
            <div class="cometchat-toast-story-wrapper" style="${toastWrapperStyle}">
              <cometchat-toast [text]="'Error: Failed to connect to server'" [type]="'error'" [duration]="0"></cometchat-toast>
            </div>
            <div class="cometchat-toast-story-wrapper" style="${toastWrapperStyle}">
              <cometchat-toast [text]="'Warning: Your session will expire soon'" [type]="'warning'" [duration]="0"></cometchat-toast>
            </div>
            <div class="cometchat-toast-story-wrapper" style="${toastWrapperStyle}">
              <cometchat-toast [text]="'Info: New features are available'" [type]="'info'" [duration]="0"></cometchat-toast>
            </div>
          </div>
        </div>

        <!-- Close Button Variants -->
        <div class="cometchat-toast-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-3);">
          <p class="cometchat-toast-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Close Button Variants
          </p>
          <div class="cometchat-toast-showcase__group" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-5); padding-left: var(--cometchat-padding-2); max-width: 400px;">
            <div class="cometchat-toast-story-wrapper" style="${toastWrapperStyle}">
              <cometchat-toast [text]="'With close button'" [type]="'info'" [duration]="0" [showCloseButton]="true"></cometchat-toast>
            </div>
            <div class="cometchat-toast-story-wrapper" style="${toastWrapperStyle}">
              <cometchat-toast [text]="'Without close button'" [type]="'info'" [duration]="0" [showCloseButton]="false"></cometchat-toast>
            </div>
          </div>
        </div>

      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Comprehensive showcase displaying all toast variants — success, error, warning, info, and close button options — in a single view. All styling uses CometChat CSS variables for theme consistency.',
      },
    },
  },
};

// ============================================
// Interaction Tests — Prop Verification
// ============================================

import { expect } from '@storybook/test';

/** Verifies toast renders with text content. */
export const TestTextRenders: Story = {
  args: { text: 'Message sent successfully', type: ToastType.success },
  play: async ({ canvasElement }) => {
    await new Promise(r => setTimeout(r, 500));
    const toast = canvasElement.querySelector('.cometchat-toast, [class*="toast"]');
    expect(toast).not.toBeNull();
    expect(toast!.textContent!.trim()).toContain('Message sent successfully');
  },
};

/** Verifies type=success applies success styling. */
export const TestSuccessType: Story = {
  args: { text: 'Success!', type: ToastType.success },
  play: async ({ canvasElement }) => {
    await new Promise(r => setTimeout(r, 500));
    const toast = canvasElement.querySelector('.cometchat-toast, [class*="toast"]');
    expect(toast).not.toBeNull();
    const hasSuccess = toast!.classList.contains('cometchat-toast--success') || toast!.querySelector('[class*="success"]') !== null;
    expect(hasSuccess).toBe(true);
  },
};

/** Verifies type=error applies error styling. */
export const TestErrorType: Story = {
  args: { text: 'Something went wrong', type: ToastType.error },
  play: async ({ canvasElement }) => {
    await new Promise(r => setTimeout(r, 500));
    const toast = canvasElement.querySelector('.cometchat-toast, [class*="toast"]');
    expect(toast).not.toBeNull();
    const hasError = toast!.classList.contains('cometchat-toast--error') || toast!.querySelector('[class*="error"]') !== null;
    expect(hasError).toBe(true);
  },
};

/** Verifies type=warning applies warning styling. */
export const TestWarningType: Story = {
  args: { text: 'Be careful', type: ToastType.warning },
  play: async ({ canvasElement }) => {
    await new Promise(r => setTimeout(r, 500));
    const toast = canvasElement.querySelector('.cometchat-toast, [class*="toast"]');
    expect(toast).not.toBeNull();
    const hasWarning = toast!.classList.contains('cometchat-toast--warning') || toast!.querySelector('[class*="warning"]') !== null;
    expect(hasWarning).toBe(true);
  },
};

/** Verifies showCloseButton=true renders close button. */
export const TestShowCloseButton: Story = {
  args: { text: 'Closeable toast', type: ToastType.info, showCloseButton: true },
  play: async ({ canvasElement }) => {
    await new Promise(r => setTimeout(r, 500));
    const closeBtn = canvasElement.querySelector('.cometchat-toast__close, [class*="toast"] [class*="close"], [class*="toast"] button');
    expect(closeBtn).not.toBeNull();
  },
};

/** Verifies showCloseButton=false hides close button. */
export const TestHideCloseButton: Story = {
  args: { text: 'No close button', type: ToastType.info, showCloseButton: false },
  play: async ({ canvasElement }) => {
    await new Promise(r => setTimeout(r, 500));
    const closeBtn = canvasElement.querySelector('.cometchat-toast__close, [class*="toast"] button[class*="close"]');
    expect(closeBtn).toBeNull();
  },
};
