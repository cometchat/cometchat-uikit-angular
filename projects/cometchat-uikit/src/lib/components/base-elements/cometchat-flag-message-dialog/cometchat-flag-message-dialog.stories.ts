/**
 * CometChatFlagMessageDialog Storybook Stories
 *
 * Interactive stories demonstrating the flag/report message dialog:
 * - Default dialog with remark field
 * - Dialog display with hidden remark field
 * - All variants showcase
 *
 * @module components/cometchat-flag-message-dialog
 */

import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CometChatFlagMessageDialogComponent } from './cometchat-flag-message-dialog.component';
import { createMockMessage, createMockUser } from '../../../../../../../.storybook/utils/mock-data';

// ============================================
// Meta Configuration
// ============================================

const meta: Meta<CometChatFlagMessageDialogComponent> = {
  title: 'Components/Misc/Flag Message Dialog',
  component: CometChatFlagMessageDialogComponent,
  tags: ['!autodocs', '!dev'],
  decorators: [
    moduleMetadata({
      imports: [CommonModule, FormsModule],
    }),
  ],
  args: {
    message: createMockMessage('text', {
      id: 500,
      text: 'This is an inappropriate message that should be flagged.',
      sender: createMockUser({ uid: 'bad-actor', name: 'Bad Actor' }),
    }),
    hideRemarkField: false,
  },
  argTypes: {
    message: {
      control: false,
      description: 'The CometChat message object to flag/report',
      table: {
        type: { summary: 'CometChat.BaseMessage' },
      },
    },
    hideRemarkField: {
      control: 'boolean',
      description:
        'Whether to hide the optional remark text field. When false, users can provide additional context about why they are flagging the message.',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    confirm: {
      action: 'confirm',
      description:
        'Emitted when the flag is confirmed, containing the message and optional remark text',
      table: {
        type: { summary: 'EventEmitter<{ message: BaseMessage; remark: string }>' },
        category: 'Events',
      },
    },
    cancel: {
      action: 'cancel',
      description: 'Emitted when the dialog is cancelled',
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
          'CometChatFlagMessageDialog provides a confirmation dialog for flagging/reporting inappropriate messages. It includes a warning icon, title, description, an optional remark text field with a 500-character limit, and confirm/cancel action buttons. The dialog supports full keyboard accessibility with focus trapping and Escape key dismissal.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<CometChatFlagMessageDialogComponent>;

// ============================================
// Stories
// ============================================

/** Default flag message dialog with the remark field visible. */
export const Default: Story = {
  args: {
    message: createMockMessage('text', {
      id: 500,
      text: 'This is an inappropriate message that should be flagged.',
      sender: createMockUser({ uid: 'bad-actor', name: 'Bad Actor' }),
    }),
    hideRemarkField: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Default flag message dialog showing the remark text field for additional context. Users can type up to 500 characters explaining why they are flagging the message.',
      },
    },
  },
};

/** Dialog with the remark field hidden, showing only the confirmation prompt. */
export const DialogDisplay: Story = {
  args: {
    message: createMockMessage('text', {
      id: 501,
      text: 'Another message to report.',
      sender: createMockUser({ uid: 'user-2', name: 'Jane Smith' }),
    }),
    hideRemarkField: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Flag message dialog with the remark field hidden. Shows only the warning icon, title, description, and confirm/cancel buttons — useful when no additional context is needed.',
      },
    },
  },
};

// ============================================
// Showcase
// ============================================

/** Comprehensive showcase of all flag message dialog variants in a single view. */
export const AllVariantsShowcase: Story = {
  render: () => ({
    template: `
      <div class="cometchat-flag-message-dialog-showcase" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-5); padding: var(--cometchat-padding-5);">

        <h3 class="cometchat-flag-message-dialog-showcase__title" style="margin: 0; font: var(--cometchat-font-heading3-bold); color: var(--cometchat-text-color-primary);">
          Flag Message Dialog Variants
        </h3>

        <!-- With Remark Field -->
        <div class="cometchat-flag-message-dialog-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-flag-message-dialog-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            With Remark Field
          </p>
          <cometchat-flag-message-dialog
            [message]="messageWithRemark"
            [hideRemarkField]="false"
          ></cometchat-flag-message-dialog>
        </div>

        <!-- Without Remark Field -->
        <div class="cometchat-flag-message-dialog-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-flag-message-dialog-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Without Remark Field
          </p>
          <cometchat-flag-message-dialog
            [message]="messageWithoutRemark"
            [hideRemarkField]="true"
          ></cometchat-flag-message-dialog>
        </div>

      </div>
    `,
    props: {
      messageWithRemark: createMockMessage('text', {
        id: 600,
        text: 'Inappropriate content to flag.',
        sender: createMockUser({ uid: 'bad-actor', name: 'Bad Actor' }),
      }),
      messageWithoutRemark: createMockMessage('text', {
        id: 601,
        text: 'Another inappropriate message.',
        sender: createMockUser({ uid: 'user-3', name: 'Spammer' }),
      }),
    },
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Comprehensive showcase displaying both flag message dialog variants — with and without the remark text field — in a single view. All styling uses CometChat CSS variables for theme consistency.',
      },
    },
  },
};
