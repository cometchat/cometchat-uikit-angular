/**
 * CometChatStickerBubble Storybook Stories
 *
 * Renders sticker messages by extracting the sticker image URL from the
 * message's metadata or custom data using a priority-based fallback chain.
 *
 * @module components/cometchat-sticker-bubble
 */

import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CommonModule } from '@angular/common';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatStickerBubbleComponent } from './cometchat-sticker-bubble.component';
import { MessageBubbleAlignment } from '../../Enums/Enums';
import { within, expect } from '@storybook/test';
import {
  createMockStickerMessage,
  createMockUser,
  MOCK_AVATARS,
} from '../../../../../../.storybook/utils/mock-data';

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

function makeStickerMsg(isOutgoing = true, stickerUrl?: string): CometChat.CustomMessage {
  return createMockStickerMessage({
    id: Math.floor(Math.random() * 10000),
    stickerUrl: stickerUrl ?? 'https://data-in.cc-cluster-2.io/stickers/bear/bear_6.png',
    stickerName: 'Bear Sticker',
    sentAt: Date.now() / 1000,
    sender: isOutgoing ? senderUser : receiverUser,
  });
}

// ── Meta ──────────────────────────────────────────────────────────────────────

const meta: Meta<CometChatStickerBubbleComponent> = {
  title: 'Components/Bubbles/Sticker Bubble',
  component: CometChatStickerBubbleComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [CommonModule],
    }),
  ],
  args: {
    message: makeStickerMsg(),
    alignment: MessageBubbleAlignment.right,
  },
  argTypes: {
    message: {
      control: false,
      description: 'CometChat.CustomMessage of type extension_sticker containing the sticker URL',
      table: { type: { summary: 'CometChat.CustomMessage | null' }, category: 'Primary Inputs' },
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
  },
  parameters: {
    docs: {
      description: {
        component:
          'CometChatStickerBubble renders sticker messages. The sticker URL is extracted from the message using a priority chain: metadata.data.sticker_url → metadata.sticker_url → customData.sticker_url.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<CometChatStickerBubbleComponent>;

// ── Stories ───────────────────────────────────────────────────────────────────

/** Default outgoing sticker bubble. */
export const Default: Story = {
  args: {
    message: makeStickerMsg(),
    alignment: MessageBubbleAlignment.right,
  },
};

/** Outgoing (sender) sticker bubble. */
export const Outgoing: Story = {
  args: {
    message: makeStickerMsg(true),
    alignment: MessageBubbleAlignment.right,
  },
  parameters: {
    docs: { description: { story: 'Outgoing sticker bubble (sender / right alignment).' } },
  },
};

/** Incoming (receiver) sticker bubble. */
export const Incoming: Story = {
  args: {
    message: makeStickerMsg(false),
    alignment: MessageBubbleAlignment.left,
  },
  parameters: {
    docs: { description: { story: 'Incoming sticker bubble (receiver / left alignment).' } },
  },
};

/** Sticker with a different image URL. */
export const AlternateSticker: Story = {
  args: {
    message: makeStickerMsg(true, 'https://data-in.cc-cluster-2.io/stickers/bear/bear_1.png'),
    alignment: MessageBubbleAlignment.right,
  },
  parameters: {
    docs: { description: { story: 'Sticker bubble with an alternate sticker image.' } },
  },
};

/** Null message — renders nothing. */
export const NullMessage: Story = {
  args: {
    message: null,
    alignment: MessageBubbleAlignment.right,
  },
  parameters: {
    docs: { description: { story: 'When message is null, the component renders nothing gracefully.' } },
  },
};

/** Side-by-side outgoing and incoming preview. */
export const OutgoingAndIncoming: Story = {
  render: () => ({
    template: `
      <div style="display:flex;flex-direction:column;gap:8px;padding:16px;max-width:480px;">
        <div style="display:flex;justify-content:flex-end;">
          <cometchat-sticker-bubble [message]="out" [alignment]="right"></cometchat-sticker-bubble>
        </div>
        <div style="display:flex;justify-content:flex-start;">
          <cometchat-sticker-bubble [message]="inc" [alignment]="left"></cometchat-sticker-bubble>
        </div>
      </div>`,
    props: {
      right: MessageBubbleAlignment.right,
      left: MessageBubbleAlignment.left,
      out: makeStickerMsg(true),
      inc: makeStickerMsg(false),
    },
  }),
  parameters: {
    docs: { description: { story: 'Outgoing and incoming sticker bubbles shown together.' } },
  },
};

// ============================================
// Interaction Tests
// ============================================

/** Test: Default story renders sticker bubble container */
export const TestDefaultRendersStickerBubble: Story = {
  play: async ({ canvasElement }) => {
    await new Promise(r => setTimeout(r, 1000));
    const container = canvasElement.querySelector('.cometchat-sticker-bubble');
    expect(container).not.toBeNull();
  },
};
