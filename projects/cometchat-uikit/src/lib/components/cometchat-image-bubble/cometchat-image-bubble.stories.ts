/**
 * CometChatImageBubble Storybook Stories
 *
 * Renders image messages with single/multi-image layouts, overflow handling,
 * fullscreen gallery, and keyboard accessibility.
 *
 * @module components/cometchat-image-bubble
 */

import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CommonModule } from '@angular/common';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatImageBubbleComponent } from './cometchat-image-bubble.component';
import { MessageBubbleAlignment } from '../../Enums/Enums';
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

function makeImageMsg(isOutgoing = true): CometChat.MediaMessage {
  return createMockMessage('image', {
    id: Math.floor(Math.random() * 10000),
    url: 'https://placehold.co/400x300/6852D6/FFFFFF/png?text=Image',
    fileName: 'sample-image.jpg',
    sentAt: Date.now() / 1000,
    sender: isOutgoing ? senderUser : receiverUser,
  }) as CometChat.MediaMessage;
}

// ── Meta ──────────────────────────────────────────────────────────────────────

const meta: Meta<CometChatImageBubbleComponent> = {
  title: 'Components/Bubbles/Image Bubble',
  component: CometChatImageBubbleComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [CommonModule],
    }),
  ],
  args: {
    message: makeImageMsg(),
    alignment: MessageBubbleAlignment.right,
    disableInteraction: false,
  },
  argTypes: {
    message: {
      control: false,
      description: 'CometChat.MediaMessage object containing image attachment(s)',
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
      description: 'When true, disables click-to-open fullscreen viewer',
      table: { defaultValue: { summary: 'false' }, category: 'Display Controls' },
    },
    imageClick: { action: 'imageClick', table: { category: 'Events' } },
    viewerOpen: { action: 'viewerOpen', table: { category: 'Events' } },
    viewerClose: { action: 'viewerClose', table: { category: 'Events' } },
  },
  parameters: {
    docs: {
      description: {
        component:
          'CometChatImageBubble renders image messages with single/multi-image layouts, overflow handling, fullscreen gallery, and keyboard accessibility.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<CometChatImageBubbleComponent>;

// ── Stories ───────────────────────────────────────────────────────────────────

/** Default outgoing image bubble. */
export const Default: Story = {
  args: {
    message: makeImageMsg(),
    alignment: MessageBubbleAlignment.right,
  },
};

/** Outgoing (sender) image bubble. */
export const Outgoing: Story = {
  args: {
    message: makeImageMsg(true),
    alignment: MessageBubbleAlignment.right,
  },
  parameters: {
    docs: { description: { story: 'Outgoing image bubble (sender / right alignment).' } },
  },
};

/** Incoming (receiver) image bubble. */
export const Incoming: Story = {
  args: {
    message: makeImageMsg(false),
    alignment: MessageBubbleAlignment.left,
  },
  parameters: {
    docs: { description: { story: 'Incoming image bubble (receiver / left alignment).' } },
  },
};

/** Image bubble with interaction disabled (no fullscreen viewer on click). */
export const InteractionDisabled: Story = {
  args: {
    message: makeImageMsg(),
    alignment: MessageBubbleAlignment.right,
    disableInteraction: true,
  },
  parameters: {
    docs: { description: { story: 'Image bubble with click-to-fullscreen disabled.' } },
  },
};

/** Side-by-side outgoing and incoming preview. */
export const OutgoingAndIncoming: Story = {
  render: () => ({
    template: `
      <div style="display:flex;flex-direction:column;gap:8px;padding:16px;max-width:480px;">
        <cometchat-image-bubble [message]="out" [alignment]="right" [disableInteraction]="true"></cometchat-image-bubble>
        <cometchat-image-bubble [message]="inc" [alignment]="left" [disableInteraction]="true"></cometchat-image-bubble>
      </div>`,
    props: {
      right: MessageBubbleAlignment.right,
      left: MessageBubbleAlignment.left,
      out: makeImageMsg(true),
      inc: makeImageMsg(false),
    },
  }),
  parameters: {
    docs: { description: { story: 'Outgoing and incoming image bubbles shown together.' } },
  },
};
