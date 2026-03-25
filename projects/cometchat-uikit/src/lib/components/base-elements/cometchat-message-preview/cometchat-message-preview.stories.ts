/**
 * CometChatMessagePreview Storybook Stories
 *
 * Interactive stories demonstrating the message preview component variants:
 * - Default reply preview with sender name and message content
 * - All variants showcase (reply, edit, deleted)
 *
 * @module components/cometchat-message-preview
 */

import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CommonModule } from '@angular/common';
import { CometChatMessagePreviewComponent } from './cometchat-message-preview.component';

// ============================================
// Mock Helpers
// ============================================

/**
 * Creates a mock message object matching the CometChat.BaseMessage shape
 * used by the message preview component.
 */
function createMockMessage(
  text: string,
  options: { sender?: string; deleted?: boolean; type?: string } = {}
): any {
  return {
    getText: () => text,
    getDeletedAt: () => (options.deleted ? Date.now() / 1000 : null),
    getSender: () => ({
      getName: () => options.sender ?? 'John Doe',
      getUid: () => 'user-1',
      getAvatar: () => '',
    }),
    getId: () => Math.floor(Math.random() * 100000),
    getType: () => options.type ?? 'text',
    getCategory: () => 'message',
    getData: () => ({}),
    getMetadata: () => null,
  };
}

// ============================================
// Meta Configuration
// ============================================

const meta: Meta<CometChatMessagePreviewComponent> = {
  title: 'Components/Misc/Message Preview',
  component: CometChatMessagePreviewComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [CommonModule],
    }),
  ],
  args: {
    message: createMockMessage('This is a sample message'),
    hideCloseButton: false,
    isMessageModerated: false,
    mode: 'reply',
  },
  argTypes: {
    previewTitle: {
      control: false,
      description:
        'Custom title template for the preview header. When not provided, the sender name is displayed.',
      table: {
        type: { summary: 'TemplateRef<any> | null' },
        defaultValue: { summary: 'null' },
        category: 'Templates',
      },
    },
    previewSubtitle: {
      control: false,
      description:
        'Custom subtitle template for the preview body. When not provided, the message content is displayed.',
      table: {
        type: { summary: 'TemplateRef<any> | null' },
        defaultValue: { summary: 'null' },
        category: 'Templates',
      },
    },
    hideCloseButton: {
      control: 'boolean',
      description: 'Whether to hide the close button in the preview',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'Display',
      },
    },
    message: {
      control: false,
      description: 'CometChat message object being replied to or edited',
      table: {
        type: { summary: 'CometChat.BaseMessage' },
        category: 'Data',
      },
    },
    isMessageModerated: {
      control: 'boolean',
      description: 'Whether the message has been moderated',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'Display',
      },
    },
    textFormatters: {
      control: false,
      description:
        'Text formatters for message content rendering. Follows 3-tier priority: @Input > GlobalConfig > default.',
      table: {
        type: { summary: 'CometChatTextFormatter[]' },
        defaultValue: { summary: '[]' },
        category: 'Behavior',
      },
    },
    ariaLabel: {
      control: 'text',
      description: 'Custom ARIA label for the preview container',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'undefined' },
        category: 'Display',
      },
    },
    mode: {
      control: 'select',
      options: ['reply', 'edit'],
      description: 'Preview mode — determines ARIA labels for accessibility',
      table: {
        type: { summary: "'reply' | 'edit'" },
        defaultValue: { summary: "'reply'" },
        category: 'Behavior',
      },
    },
    closeClick: {
      action: 'closeClick',
      description: 'Emitted when the close button is clicked',
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
          'CometChatMessagePreview displays a compact preview of a message being replied to or edited. It shows the sender name as a title, message content as a subtitle with text truncation, media type icons for non-text messages, and an optional close button. Supports custom title/subtitle templates, deleted message display, and accessible keyboard navigation.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<CometChatMessagePreviewComponent>;

// ============================================
// Stories
// ============================================

/** Default message preview showing a reply context with sender name and message text. */
export const Default: Story = {
  render: (args) => ({
    props: args,
    template: `
      <div style="width: 400px;">
        <cometchat-message-preview
          [message]="message"
          [hideCloseButton]="hideCloseButton"
          [mode]="mode"
          (closeClick)="closeClick($event)">
        </cometchat-message-preview>
      </div>
    `,
  }),
  args: {
    message: createMockMessage('This is a sample message'),
    hideCloseButton: false,
    mode: 'reply',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Default message preview in reply mode. Displays the sender name as the title and the message text as the subtitle, with a close button to dismiss the preview.',
      },
    },
  },
};

// ============================================
// Showcase
// ============================================

/** Showcase of key message preview variants: reply, edit, and deleted. */
export const AllVariantsShowcase: Story = {
  render: () => ({
    template: `
      <div class="cometchat-message-preview-showcase" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-5); padding: var(--cometchat-padding-5); max-width: 400px;">

        <h3 class="cometchat-message-preview-showcase__title" style="margin: 0; font: var(--cometchat-font-heading3-bold); color: var(--cometchat-text-color-primary);">
          Message Preview Variants
        </h3>

        <!-- Reply Mode -->
        <div class="cometchat-message-preview-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-message-preview-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Reply Mode
          </p>
          <cometchat-message-preview
            [message]="replyMessage"
            [hideCloseButton]="false"
            mode="reply">
          </cometchat-message-preview>
        </div>

        <!-- Edit Mode -->
        <div class="cometchat-message-preview-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-message-preview-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Edit Mode
          </p>
          <cometchat-message-preview
            [message]="editMessage"
            [hideCloseButton]="false"
            mode="edit">
          </cometchat-message-preview>
        </div>

        <!-- Deleted Message -->
        <div class="cometchat-message-preview-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-message-preview-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Deleted Message
          </p>
          <cometchat-message-preview
            [message]="deletedMessage"
            [hideCloseButton]="false"
            mode="reply">
          </cometchat-message-preview>
        </div>

      </div>
    `,
    props: {
      replyMessage: createMockMessage('Hey, check out this new feature!', { sender: 'Alice' }),
      editMessage: createMockMessage('A message being edited by the user', { sender: 'You' }),
      deletedMessage: createMockMessage('This message was deleted', {
        sender: 'Dave',
        deleted: true,
      }),
    },
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Showcase of key message preview variants — reply mode, edit mode, and deleted message — in a single view.',
      },
    },
  },
};
