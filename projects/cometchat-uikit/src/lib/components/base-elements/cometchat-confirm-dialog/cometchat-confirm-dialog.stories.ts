/**
 * CometChatConfirmDialog Storybook Stories
 *
 * Interactive stories demonstrating the confirm dialog component variants:
 * - Default confirmation dialog
 * - Custom title and message
 * - All variants showcase
 *
 * @module components/cometchat-confirm-dialog
 */

import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CommonModule } from '@angular/common';
import { CometChatConfirmDialogComponent } from './cometchat-confirm-dialog.component';

// ============================================
// Meta Configuration
// ============================================

const meta: Meta<CometChatConfirmDialogComponent> = {
  title: 'Components/Misc/Confirm Dialog',
  component: CometChatConfirmDialogComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [CommonModule],
    }),
  ],
  args: {
    title: 'Delete Conversation?',
    messageText: 'Are you sure you want to delete this conversation? This action cannot be undone.',
    confirmButtonText: 'Delete',
    cancelButtonText: 'Cancel',
  },
  argTypes: {
    title: {
      control: 'text',
      description: 'Dialog title displayed at the top of the confirmation dialog',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'conversation_delete_title' },
      },
    },
    messageText: {
      control: 'text',
      description: 'Dialog message body describing the action to be confirmed',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'conversation_delete_subtitle' },
      },
    },
    cancelButtonText: {
      control: 'text',
      description: 'Text displayed on the cancel button',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'conversation_delete_confirm_no' },
      },
    },
    confirmButtonText: {
      control: 'text',
      description: 'Text displayed on the confirm/submit button',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'conversation_delete_confirm_yes' },
      },
    },
    iconURL: {
      control: 'text',
      description: 'Custom icon URL for the dialog icon. Overrides the default delete icon.',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: "''" },
      },
    },
    confirmClick: {
      action: 'confirmClick',
      description: 'Emitted when the confirm button is clicked',
      table: {
        type: { summary: 'EventEmitter<void>' },
        category: 'Events',
      },
    },
    cancelClick: {
      action: 'cancelClick',
      description: 'Emitted when the cancel button is clicked or Escape key is pressed',
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
          'CometChatConfirmDialog displays a modal confirmation dialog with a title, descriptive message, and confirm/cancel action buttons. Supports keyboard navigation with Escape to cancel and focus trapping within the dialog.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<CometChatConfirmDialogComponent>;

// ============================================
// Stories
// ============================================

/** Default confirmation dialog with typical delete conversation scenario. */
export const Default: Story = {
  args: {
    title: 'Delete Conversation?',
    messageText: 'Are you sure you want to delete this conversation? This action cannot be undone.',
    confirmButtonText: 'Delete',
    cancelButtonText: 'Cancel',
    iconURL: '/assets/delete.svg',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Default confirmation dialog rendered with a typical delete conversation scenario. Displays a title, descriptive message, and confirm/cancel action buttons.',
      },
    },
  },
};

/** Confirm dialog with custom title and message for a different use case. */
export const CustomTitleMessage: Story = {
  args: {
    title: 'Leave Group?',
    messageText: 'You will no longer be able to send or receive messages in this group.',
    confirmButtonText: 'Leave',
    cancelButtonText: 'Stay',
    iconURL: '/assets/logout.svg',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Confirmation dialog with a custom title and message demonstrating a leave group scenario. Shows how the dialog adapts to different confirmation contexts.',
      },
    },
  },
};

// ============================================
// Showcase
// ============================================

/** Comprehensive showcase of all confirm dialog variants in a single view. */
export const AllVariantsShowcase: Story = {
  render: () => ({
    template: `
      <div class="cometchat-confirm-dialog-showcase" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-5); padding: var(--cometchat-padding-5); max-height: 90vh; overflow-y: auto;">

        <h3 class="cometchat-confirm-dialog-showcase__title" style="margin: 0; font: var(--cometchat-font-heading3-bold); color: var(--cometchat-text-color-primary);">
          Confirm Dialog Variants
        </h3>

        <!-- Default Delete Conversation -->
        <div class="cometchat-confirm-dialog-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-confirm-dialog-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Delete Conversation
          </p>
          <cometchat-confirm-dialog
            [title]="deleteTitle"
            [messageText]="deleteMessage"
            [confirmButtonText]="deleteConfirm"
            [cancelButtonText]="deleteCancel"
            [iconURL]="deleteIcon"
          ></cometchat-confirm-dialog>
        </div>

        <!-- Leave Group -->
        <div class="cometchat-confirm-dialog-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-confirm-dialog-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Leave Group
          </p>
          <cometchat-confirm-dialog
            [title]="leaveTitle"
            [messageText]="leaveMessage"
            [confirmButtonText]="leaveConfirm"
            [cancelButtonText]="leaveCancel"
            [iconURL]="leaveIcon"
          ></cometchat-confirm-dialog>
        </div>

        <!-- Block User -->
        <div class="cometchat-confirm-dialog-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-confirm-dialog-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Block User
          </p>
          <cometchat-confirm-dialog
            [title]="blockTitle"
            [messageText]="blockMessage"
            [confirmButtonText]="blockConfirm"
            [cancelButtonText]="blockCancel"
            [iconURL]="blockIcon"
          ></cometchat-confirm-dialog>
        </div>

      </div>
    `,
    props: {
      deleteTitle: 'Delete Conversation?',
      deleteMessage:
        'Are you sure you want to delete this conversation? This action cannot be undone.',
      deleteConfirm: 'Delete',
      deleteCancel: 'Cancel',
      deleteIcon: '/assets/delete.svg',
      leaveTitle: 'Leave Group?',
      leaveMessage: 'You will no longer be able to send or receive messages in this group.',
      leaveConfirm: 'Leave',
      leaveCancel: 'Stay',
      leaveIcon: '/assets/logout.svg',
      blockTitle: 'Block User?',
      blockMessage: 'You will no longer receive messages from this user.',
      blockConfirm: 'Block',
      blockCancel: 'Cancel',
      blockIcon: '/assets/block.svg',
    },
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Comprehensive showcase displaying all confirm dialog variants — delete conversation, leave group, and block user — in a single view. All styling uses CometChat CSS variables for theme consistency.',
      },
    },
  },
};
