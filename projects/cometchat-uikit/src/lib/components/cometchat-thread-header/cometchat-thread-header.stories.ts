/**
 * CometChatThreadHeader Storybook Stories
 *
 * Interactive stories demonstrating the thread header component:
 * - Default thread header with text parent message
 * - Image parent message
 * - Single reply (singular form)
 * - Zero replies
 *
 * All variants render centered in both docs preview and fullscreen story pages.
 *
 * @module components/cometchat-thread-header
 */

import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CommonModule } from '@angular/common';
import { CometChatThreadHeaderComponent } from './cometchat-thread-header.component';
import { createMockMessage, createMockUser } from '../../../../../../.storybook/utils/mock-data';
import { within, expect } from '@storybook/test';

// ============================================
// Full-screen centered wrapper style
// ============================================

const fullScreenCenterStyle = `
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  min-height: 80px;
  box-sizing: border-box;
  padding: 16px;
`;

const cardStyle = `
  width: 500px;
  border: 1px solid var(--cometchat-border-color-light, #eee);
  border-radius: var(--cometchat-radius-2, 8px);
  overflow: hidden;
`;

// ============================================
// Shared render helper
// ============================================

const threadRender = (args: Record<string, unknown>) => ({
  props: args,
  template: `
    <div style="${fullScreenCenterStyle}">
      <div style="${cardStyle}">
        <cometchat-thread-header
          [parentMessage]="parentMessage"
          [replyCount]="replyCount"
          (closeClick)="closeClick($event)"
          (backClick)="backClick($event)">
        </cometchat-thread-header>
      </div>
    </div>
  `,
});

// ============================================
// Meta Configuration
// ============================================

const meta: Meta<CometChatThreadHeaderComponent> = {
  title: 'Components/Messages/Thread Header',
  component: CometChatThreadHeaderComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [CommonModule],
    }),
  ],
  args: {
    parentMessage: createMockMessage('text', {
      id: 400,
      text: 'This is the parent message that started the thread.',
      sentAt: Date.now() / 1000 - 7200,
      sender: createMockUser({ uid: 'user-1', name: 'Alice' }),
    }),
    replyCount: 3,
  },
  argTypes: {
    parentMessage: {
      control: false,
      description:
        'The parent message of the thread. Determines the message preview text and media icon displayed in the header.',
      table: { type: { summary: 'CometChat.BaseMessage' } },
    },
    replyCount: {
      control: 'number',
      description:
        'The initial number of replies in the thread. Updates in real-time as new replies arrive.',
      table: { type: { summary: 'number' }, defaultValue: { summary: '0' } },
    },
    closeClick: {
      action: 'closeClick',
      description: 'Emitted when the close button is clicked or Escape is pressed',
      table: { type: { summary: 'EventEmitter<void>' }, category: 'Events' },
    },
    backClick: {
      action: 'backClick',
      description: 'Deprecated — use closeClick instead. Kept for backward compatibility.',
      table: { type: { summary: 'EventEmitter<void>' }, category: 'Events' },
    },
  },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'CometChatThreadHeader displays the header for threaded message views, including a truncated parent message preview, reply count with real-time updates, sender name, media type icon for non-text messages, and a close button to return to the main chat.',
      },
    },
  },
  render: threadRender,
};

export default meta;
type Story = StoryObj<CometChatThreadHeaderComponent>;

// ============================================
// Stories
// ============================================

/** Default thread header with a text parent message and reply count. */
export const Default: Story = {
  args: {
    parentMessage: createMockMessage('text', {
      id: 401,
      text: 'This is the parent message that started the thread discussion.',
      sentAt: Date.now() / 1000 - 7200,
      sender: createMockUser({ uid: 'user-1', name: 'Alice' }),
    }),
    replyCount: 5,
  },
  render: threadRender,
  parameters: {
    docs: {
      description: {
        story: 'Default thread header showing a text parent message preview with 5 replies.',
      },
    },
  },
};

/** Thread header displaying an image parent message with a higher reply count. */
export const ImageParentMessage: Story = {
  args: {
    parentMessage: createMockMessage('image', {
      id: 402,
      sentAt: Date.now() / 1000 - 3600,
      sender: createMockUser({ uid: 'user-2', name: 'Bob' }),
    }),
    replyCount: 12,
  },
  render: threadRender,
  parameters: {
    docs: {
      description: {
        story: 'Thread header for a media (image) parent message with 12 replies. Shows a localized media description and media type icon.',
      },
    },
  },
};

/** Thread header with a single reply (singular form). */
export const SingleReply: Story = {
  args: {
    parentMessage: createMockMessage('text', {
      id: 403,
      text: 'Quick question about the API changes.',
      sentAt: Date.now() / 1000 - 1800,
      sender: createMockUser({ uid: 'user-3', name: 'Charlie' }),
    }),
    replyCount: 1,
  },
  render: threadRender,
  parameters: {
    docs: {
      description: {
        story: 'Thread header with a single reply, showing the singular form of the reply count label.',
      },
    },
  },
};

/** Thread header with zero replies. */
export const ZeroReplies: Story = {
  args: {
    parentMessage: createMockMessage('text', {
      id: 404,
      text: 'Has anyone looked into this issue yet?',
      sentAt: Date.now() / 1000 - 600,
      sender: createMockUser({ uid: 'user-4', name: 'Diana' }),
    }),
    replyCount: 0,
  },
  render: threadRender,
  parameters: {
    docs: {
      description: {
        story: 'Thread header with zero replies, showing the initial state before any thread responses.',
      },
    },
  },
};

// ============================================
// Interaction Tests
// ============================================

/** Test: Default story renders thread header container */
export const TestDefaultRendersThreadHeader: Story = {
  play: async ({ canvasElement }) => {
    await new Promise(r => setTimeout(r, 1000));
    const container = canvasElement.querySelector('.cometchat-thread-header');
    expect(container).not.toBeNull();
  },
};
