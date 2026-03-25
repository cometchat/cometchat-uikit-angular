/**
 * CometChatMessageComposer Storybook Stories
 *
 * Interactive stories demonstrating the message composer component:
 * - Single-line layout
 * - Multiline layout
 *
 * Other variants are available as individual stories (linked from docs).
 *
 * @module components/cometchat-message-composer
 */

import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CommonModule } from '@angular/common';
import { CometChat } from '@cometchat/chat-sdk-javascript';

import { CometChatMessageComposerComponent } from './cometchat-message-composer.component';
import { createMockUser, MOCK_AVATARS } from '../../../../../../.storybook/utils/mock-data';
import { EnterKeyBehavior } from '../../Enums/Enums';

// ============================================
// Mock Data
// ============================================

const testUser = createMockUser({
  uid: 'user-composer-1',
  name: 'John Doe',
  avatar: MOCK_AVATARS.andrewJoseph,
  status: CometChat.USER_STATUS.ONLINE,
});

// ============================================
// Shared render helper
// ============================================

/**
 * Creates a render function that wraps the composer in a data-cometchat-container
 * and binds all controllable args to the component inputs.
 */
const composerRender = (layoutOverride?: 'single-line' | 'multiline') => {
  return (args: Record<string, unknown>) => ({
    props: {
      ...args,
      user: testUser,
    },
    template: `
      <div data-cometchat-container style="width: 500px; min-height: 550px; display: flex; flex-direction: column; justify-content: flex-end;">
        <cometchat-message-composer
          [user]="user"
          [layout]="'${layoutOverride ?? (args['layout'] as string ?? 'single-line')}'"
          [hideAttachmentButton]="hideAttachmentButton"
          [hideEmojiKeyboardButton]="hideEmojiKeyboardButton"
          [hideVoiceRecordingButton]="hideVoiceRecordingButton"
          [hideSendButton]="hideSendButton"
          [disableMentions]="disableMentions"
          [enableRichText]="enableRichText"
          [enableDragDrop]="enableDragDrop"
          [showAttachmentPreview]="showAttachmentPreview"
          [maxAttachments]="maxAttachments"
          [maxHeight]="maxHeight"
          [enterKeyBehavior]="enterKeyBehavior"
          [disableTypingEvents]="disableTypingEvents"
          [disableSoundForMessage]="disableSoundForMessage"
          (textChange)="textChange($event)"
          (sendButtonClick)="sendButtonClick($event)"
          (error)="error($event)"
          (closePreview)="closePreview($event)"
          (attachmentAdded)="attachmentAdded($event)"
          (attachmentRemoved)="attachmentRemoved($event)"
          (mentionSelected)="mentionSelected($event)">
        </cometchat-message-composer>
      </div>
    `,
  });
};

// ============================================
// Meta Configuration
// ============================================

const meta: Meta<CometChatMessageComposerComponent> = {
  title: 'Components/Messages/CometChat Message Composer',
  component: CometChatMessageComposerComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [CommonModule],
    }),
  ],
  args: {
    hideAttachmentButton: false,
    hideEmojiKeyboardButton: false,
    hideVoiceRecordingButton: false,
    hideSendButton: false,
    disableMentions: false,
    enableRichText: false,
    enableDragDrop: true,
    showAttachmentPreview: true,
    maxAttachments: 10,
    maxHeight: 200,
    enterKeyBehavior: EnterKeyBehavior.SendMessage,
    disableTypingEvents: false,
    disableSoundForMessage: false,
  },
  argTypes: {
    // Entity Configuration
    user: {
      control: false,
      description: 'CometChat.User object for 1-on-1 conversations. Mutually exclusive with group.',
      table: { type: { summary: 'CometChat.User' }, category: 'Entity Configuration' },
    },
    group: {
      control: false,
      description: 'CometChat.Group object for group conversations. Mutually exclusive with user.',
      table: { type: { summary: 'CometChat.Group' }, category: 'Entity Configuration' },
    },
    parentMessageId: {
      control: 'number',
      description: 'Parent message ID for threaded replies',
      table: { type: { summary: 'number' }, category: 'Entity Configuration' },
    },

    // Text Input Configuration
    placeholderText: {
      control: 'text',
      description: 'Placeholder text for the input area',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'message_composer_placeholder' }, category: 'Text Input' },
    },
    initialComposerText: {
      control: 'text',
      description: 'Initial text to pre-fill in the composer',
      table: { type: { summary: 'string' }, defaultValue: { summary: "''" }, category: 'Text Input' },
    },
    text: {
      control: 'text',
      description: 'Controlled text value for the composer',
      table: { type: { summary: 'string' }, defaultValue: { summary: "''" }, category: 'Text Input' },
    },
    maxHeight: {
      control: 'number',
      description: 'Maximum height for the text input area in pixels',
      table: { type: { summary: 'number' }, defaultValue: { summary: '200' }, category: 'Text Input' },
    },
    enterKeyBehavior: {
      control: 'select',
      options: [EnterKeyBehavior.SendMessage, EnterKeyBehavior.NewLine, EnterKeyBehavior.None],
      description: 'Behavior when Enter key is pressed',
      table: { type: { summary: 'EnterKeyBehavior' }, defaultValue: { summary: 'SendMessage' }, category: 'Text Input' },
    },

    // Attachment Configuration
    maxAttachments: {
      control: 'number',
      description: 'Maximum number of attachments allowed',
      table: { type: { summary: 'number' }, defaultValue: { summary: '10' }, category: 'Attachments' },
    },
    showAttachmentPreview: {
      control: 'boolean',
      description: 'Whether to show attachment preview thumbnails',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' }, category: 'Attachments' },
    },
    enableDragDrop: {
      control: 'boolean',
      description: 'Whether to enable drag and drop file uploads',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' }, category: 'Attachments' },
    },

    // Hide Options
    hideAttachmentButton: {
      control: 'boolean',
      description: 'Hide the attachment button',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' }, category: 'Hide Options' },
    },
    hideEmojiKeyboardButton: {
      control: 'boolean',
      description: 'Hide the emoji keyboard button',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' }, category: 'Hide Options' },
    },
    hideVoiceRecordingButton: {
      control: 'boolean',
      description: 'Hide the voice recording button',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' }, category: 'Hide Options' },
    },
    hideSendButton: {
      control: 'boolean',
      description: 'Hide the send button',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' }, category: 'Hide Options' },
    },

    // Mentions Configuration
    disableMentions: {
      control: 'boolean',
      description: 'Whether to disable @mentions functionality',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' }, category: 'Mentions' },
    },
    disableMentionAll: {
      control: 'boolean',
      description: 'Whether to disable @all mention option in groups',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' }, category: 'Mentions' },
    },
    mentionAllLabel: {
      control: 'text',
      description: 'Label for the @all mention option',
      table: { type: { summary: 'string' }, defaultValue: { summary: "''" }, category: 'Mentions' },
    },

    // Rich Text Configuration
    enableRichText: {
      control: 'boolean',
      description: 'Whether to enable rich text editing',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' }, category: 'Rich Text' },
    },
    hideRichTextToolbar: {
      control: 'boolean',
      description: 'Whether to hide the rich text toolbar',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' }, category: 'Rich Text' },
    },

    // Layout
    layout: {
      control: 'select',
      options: ['single-line', 'multiline'],
      description: 'Layout mode for the composer — single-line or multiline',
      table: { type: { summary: "'single-line' | 'multiline'" }, defaultValue: { summary: 'single-line' }, category: 'Layout' },
    },

    // Other Configuration
    disableTypingEvents: {
      control: 'boolean',
      description: 'Whether to disable typing indicator events',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' }, category: 'Other' },
    },
    disableSoundForMessage: {
      control: 'boolean',
      description: 'Whether to disable sound when sending messages',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' }, category: 'Other' },
    },

    // Template Inputs
    headerView: { control: false, table: { type: { summary: 'TemplateRef<unknown>' }, category: 'Template Inputs' } },
    footerView: { control: false, table: { type: { summary: 'TemplateRef<unknown>' }, category: 'Template Inputs' } },
    sendButtonView: { control: false, table: { type: { summary: 'TemplateRef<unknown>' }, category: 'Template Inputs' } },
    auxiliaryButtonView: { control: false, table: { type: { summary: 'TemplateRef<unknown>' }, category: 'Template Inputs' } },
    attachmentIconView: { control: false, table: { type: { summary: 'TemplateRef<unknown>' }, category: 'Template Inputs' } },
    emojiIconView: { control: false, table: { type: { summary: 'TemplateRef<unknown>' }, category: 'Template Inputs' } },

    // Output Events
    textChange: { action: 'textChange', table: { type: { summary: 'EventEmitter<string>' }, category: 'Events' } },
    sendButtonClick: { action: 'sendButtonClick', table: { type: { summary: 'EventEmitter<CometChat.BaseMessage>' }, category: 'Events' } },
    error: { action: 'error', table: { type: { summary: 'EventEmitter<CometChat.CometChatException>' }, category: 'Events' } },
    closePreview: { action: 'closePreview', table: { type: { summary: 'EventEmitter<void>' }, category: 'Events' } },
    attachmentAdded: { action: 'attachmentAdded', table: { type: { summary: 'EventEmitter<File>' }, category: 'Events' } },
    attachmentRemoved: { action: 'attachmentRemoved', table: { type: { summary: 'EventEmitter<File>' }, category: 'Events' } },
    mentionSelected: { action: 'mentionSelected', table: { type: { summary: 'EventEmitter<CometChat.User | CometChat.GroupMember>' }, category: 'Events' } },
  },
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'CometChatMessageComposer is a comprehensive message input component supporting text input with auto-expand, file attachments with drag-and-drop, emoji picker, voice recording, @mentions, optional rich text editing, reply/edit modes, and full keyboard and screen reader accessibility.',
      },
    },
  },
  render: composerRender(),
};

export default meta;
type Story = StoryObj<CometChatMessageComposerComponent>;

// ============================================
// Primary Stories (with preview)
// ============================================

/** Message composer in single-line layout mode. */
export const SingleLineLayout: Story = {
  args: {
    layout: 'single-line' as 'single-line' | 'multiline',
  },
  render: composerRender('single-line'),
  parameters: {
    docs: {
      description: {
        story:
          'Message composer in single-line layout mode. The input area stays on a single line and does not auto-expand. Suitable for compact UIs or inline reply bars.',
      },
    },
  },
};

/** Message composer in multiline layout mode (default). */
export const MultilineLayout: Story = {
  args: {
    layout: 'multiline' as 'single-line' | 'multiline',
  },
  render: composerRender('multiline'),
  parameters: {
    docs: {
      description: {
        story:
          'Message composer in multiline layout mode (default). The input area auto-expands vertically as the user types, up to the configured maxHeight.',
      },
    },
  },
};


// ============================================
// Other Variants (no inline preview in docs)
// ============================================

/** Default message composer with a text input for a 1-on-1 user conversation. */
export const Default: Story = {
  tags: ['!autodocs'],
  render: composerRender(),
  parameters: {
    docs: {
      description: {
        story: 'Default message composer rendered for a 1-on-1 user conversation.',
      },
    },
  },
};

/** Loading state — composer rendered while conversation data is still loading. */
export const LoadingState: Story = {
  tags: ['!autodocs', '!dev'],
  render: args => ({
    props: { ...args },
    template: `
      <div style="width: 500px; opacity: 0.5; pointer-events: none;">
        <cometchat-message-composer
          [hideAttachmentButton]="hideAttachmentButton"
          [hideEmojiKeyboardButton]="hideEmojiKeyboardButton"
          [hideVoiceRecordingButton]="hideVoiceRecordingButton"
          [hideSendButton]="hideSendButton">
        </cometchat-message-composer>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: { story: 'Loading state shown while the conversation context is being resolved.' },
    },
  },
};

/** Empty state — composer with no active conversation context. */
export const EmptyState: Story = {
  tags: ['!autodocs', '!dev'],
  render: args => ({
    props: { ...args },
    template: `
      <div style="width: 500px;">
        <cometchat-message-composer
          [hideAttachmentButton]="hideAttachmentButton"
          [hideEmojiKeyboardButton]="hideEmojiKeyboardButton"
          [hideVoiceRecordingButton]="hideVoiceRecordingButton"
          [hideSendButton]="hideSendButton">
        </cometchat-message-composer>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: { story: 'Empty state when no user or group is set.' },
    },
  },
};

/** Error state — composer in an error condition (e.g., send failure). */
export const ErrorState: Story = {
  tags: ['!autodocs', '!dev'],
  render: args => ({
    props: { ...args, user: testUser },
    template: `
      <div data-cometchat-container style="display: flex; flex-direction: column; width: 500px; min-height: 550px; justify-content: flex-end;">
        <div style="padding: var(--cometchat-spacing-2); background: var(--cometchat-error-color, #F44336); color: #fff; font: var(--cometchat-font-caption1-regular); text-align: center;">
          Failed to send message. Tap to retry.
        </div>
        <cometchat-message-composer [user]="user" (sendButtonClick)="sendButtonClick($event)">
        </cometchat-message-composer>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: { story: 'Error state shown when a message fails to send.' },
    },
  },
};

/** Message composer with attachment support enabled and visible. */
export const WithAttachmentsEnabled: Story = {
  tags: ['!autodocs'],
  args: { hideAttachmentButton: false, showAttachmentPreview: true, enableDragDrop: true, maxAttachments: 5 },
  render: composerRender(),
  parameters: {
    docs: {
      description: { story: 'Message composer with attachment support fully enabled.' },
    },
  },
};

/** Message composer with a reply preview shown above the input. */
export const WithReplyPreview: Story = {
  tags: ['!autodocs'],
  render: args => ({
    props: { ...args, user: testUser },
    template: `
      <div data-cometchat-container style="width: 500px; min-height: 550px; display: flex; flex-direction: column; justify-content: flex-end;">
        <div style="padding: var(--cometchat-spacing-2); background: var(--cometchat-background-color-02); border-bottom: 1px solid var(--cometchat-border-color-light); font: var(--cometchat-font-caption1-regular); color: var(--cometchat-text-color-secondary);">
          ↩ Replying to: "Hey! How are you doing today?"
        </div>
        <cometchat-message-composer [user]="user" [hideAttachmentButton]="false" (sendButtonClick)="sendButtonClick($event)">
        </cometchat-message-composer>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: { story: 'Message composer with a reply preview banner shown above the input.' },
    },
  },
};

/** Message composer with attachment preview thumbnails visible. */
export const WithAttachmentPreview: Story = {
  tags: ['!autodocs'],
  args: { hideAttachmentButton: false, showAttachmentPreview: true, enableDragDrop: true },
  render: composerRender(),
  parameters: {
    docs: {
      description: { story: 'Message composer with attachment preview enabled.' },
    },
  },
};

/** Disabled message composer — all inputs and buttons are non-interactive. */
export const Disabled: Story = {
  tags: ['!autodocs'],
  render: args => ({
    props: { ...args, user: testUser },
    template: `
      <div data-cometchat-container style="width: 500px; min-height: 550px; display: flex; flex-direction: column; justify-content: flex-end; opacity: 0.6; pointer-events: none;">
        <cometchat-message-composer [user]="user" [hideAttachmentButton]="false" [hideSendButton]="false">
        </cometchat-message-composer>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: { story: 'Message composer in a visually disabled state.' },
    },
  },
};

/** Message composer pre-filled with a short text message. */
export const WithShortText: Story = {
  tags: ['!autodocs'],
  args: { initialComposerText: 'Hey, are you free for a quick call?' },
  render: composerRender(),
  parameters: {
    docs: {
      description: { story: 'Message composer pre-filled with a short text message.' },
    },
  },
};

/** Message composer pre-filled with a long text message that triggers auto-expand. */
export const WithLongText: Story = {
  tags: ['!autodocs'],
  args: {
    initialComposerText:
      'Hey team, I wanted to share some thoughts on the upcoming release. We need to finalize the design review by Friday and make sure all the accessibility improvements are tested across different screen readers. Also, the performance benchmarks from last sprint showed some regression in the message list scrolling — can someone take a look at that? Let me know if you have any questions or need help with anything.',
  },
  render: composerRender(),
  parameters: {
    docs: {
      description: { story: 'Message composer pre-filled with a long text message that triggers auto-expand.' },
    },
  },
};

/** Message composer without rich text editing — plain text input only. */
export const WithoutRichText: Story = {
  tags: ['!autodocs'],
  args: { enableRichText: false, initialComposerText: 'Plain text mode — no formatting toolbar or rich text features.' },
  render: composerRender(),
  parameters: {
    docs: {
      description: { story: 'Message composer with rich text editing disabled.' },
    },
  },
};

/** Message composer with rich text editing enabled — includes formatting toolbar. */
export const WithRichText: Story = {
  tags: ['!autodocs'],
  args: { enableRichText: true, initialComposerText: 'Rich text mode — formatting toolbar with bold, italic, underline, links, lists, and code blocks.' },
  render: composerRender(),
  parameters: {
    docs: {
      description: { story: 'Message composer with rich text editing enabled.' },
    },
  },
};
