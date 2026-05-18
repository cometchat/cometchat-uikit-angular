/**
 * CometChatVideoBubble Storybook Stories
 *
 * Renders video messages with single/grid/overflow layouts and fullscreen player integration.
 *
 * @module components/cometchat-video-bubble
 */

import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CommonModule } from '@angular/common';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatVideoBubbleComponent } from './cometchat-video-bubble.component';
import { MessageBubbleAlignment } from '../../Enums/Enums';
import { within, expect } from '@storybook/test';
import { createMockMessage, createMockUser, MOCK_AVATARS } from '../../../../../../.storybook/utils/mock-data';

// ── Mock helpers ──────────────────────────────────────────────────────────────

const senderUser = createMockUser({
  uid: 'user-sender',
  name: 'George Alan',
  avatar: MOCK_AVATARS.georgeAlan,
  status: CometChat.USER_STATUS.ONLINE,
});

const receiverUser = createMockUser({
  uid: 'user-receiver',
  name: 'Nancy Grace',
  status: CometChat.USER_STATUS.ONLINE,
});

function makeVideoMsg(isOutgoing = true): CometChat.MediaMessage {
  return createMockMessage('video', {
    id: Math.floor(Math.random() * 10000),
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    fileName: 'sample-video.mp4',
    thumbnail: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg',
    sentAt: Date.now() / 1000,
    sender: isOutgoing ? senderUser : receiverUser,
  }) as CometChat.MediaMessage;
}

// ── Meta ──────────────────────────────────────────────────────────────────────

const meta: Meta<CometChatVideoBubbleComponent> = {
  title: 'Components/Bubbles/Video Bubble',
  component: CometChatVideoBubbleComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [CommonModule],
    }),
  ],
  args: {
    message: makeVideoMsg(),
    alignment: MessageBubbleAlignment.right,
    disableInteraction: false,
  },
  argTypes: {
    message: {
      control: false,
      description: 'CometChat.MediaMessage object containing video attachment(s)',
      table: { type: { summary: 'CometChat.MediaMessage' }, category: 'Primary Inputs' },
    },
    alignment: {
      control: 'select',
      options: ['left', 'right'],
      mapping: { left: MessageBubbleAlignment.left, right: MessageBubbleAlignment.right },
      description: 'Bubble alignment — left (incoming) or right (outgoing)',
      table: {
        type: { summary: 'MessageBubbleAlignment' },
        defaultValue: { summary: 'left' },
        category: 'Primary Inputs',
      },
    },
    disableInteraction: {
      control: 'boolean',
      description: 'When true, disables click-to-open fullscreen player',
      table: { defaultValue: { summary: 'false' }, category: 'Display Controls' },
    },
    videoClick: { action: 'videoClick', table: { category: 'Events' } },
    playerOpen: { action: 'playerOpen', table: { category: 'Events' } },
    playerClose: { action: 'playerClose', table: { category: 'Events' } },
  },
  parameters: {
    docs: {
      description: {
        component:
          'CometChatVideoBubble renders video messages with single/grid/overflow layouts and fullscreen player integration.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<CometChatVideoBubbleComponent>;

// ── Stories ───────────────────────────────────────────────────────────────────

/** Default outgoing video bubble. */
export const Default: Story = {
  args: {
    message: makeVideoMsg(),
    alignment: MessageBubbleAlignment.right,
  },
};

/** Outgoing (sender) video bubble. */
export const Outgoing: Story = {
  args: {
    message: makeVideoMsg(true),
    alignment: MessageBubbleAlignment.right,
  },
  parameters: {
    docs: { description: { story: 'Outgoing video bubble (sender / right alignment) with thumbnail and play button.' } },
  },
};

/** Incoming (receiver) video bubble. */
export const Incoming: Story = {
  args: {
    message: makeVideoMsg(false),
    alignment: MessageBubbleAlignment.left,
  },
  parameters: {
    docs: { description: { story: 'Incoming video bubble (receiver / left alignment) with thumbnail and play button.' } },
  },
};

/** Video bubble with interaction disabled. */
export const InteractionDisabled: Story = {
  args: {
    message: makeVideoMsg(),
    alignment: MessageBubbleAlignment.right,
    disableInteraction: true,
  },
  parameters: {
    docs: { description: { story: 'Video bubble with click-to-fullscreen disabled.' } },
  },
};

/** Side-by-side outgoing and incoming preview. */
export const OutgoingAndIncoming: Story = {
  render: () => ({
    template: `
      <div style="display:flex;flex-direction:column;gap:8px;padding:16px;max-width:480px;">
        <cometchat-video-bubble [message]="out" [alignment]="right" [disableInteraction]="true"></cometchat-video-bubble>
        <cometchat-video-bubble [message]="inc" [alignment]="left" [disableInteraction]="true"></cometchat-video-bubble>
      </div>`,
    props: {
      right: MessageBubbleAlignment.right,
      left: MessageBubbleAlignment.left,
      out: makeVideoMsg(true),
      inc: makeVideoMsg(false),
    },
  }),
  parameters: {
    docs: { description: { story: 'Outgoing and incoming video bubbles shown together.' } },
  },
};

// ============================================
// Interaction Tests
// ============================================

/** Test: Default story renders video bubble container */
export const TestDefaultRendersVideoBubble: Story = {
  play: async ({ canvasElement }) => {
    await new Promise(r => setTimeout(r, 1000));
    const container = canvasElement.querySelector('.cometchat-video-bubble');
    expect(container).not.toBeNull();
  },
};
