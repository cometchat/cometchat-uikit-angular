/**
 * CometChatVideosBubble Storybook Stories
 *
 * Receive-side bubble for a (multi-)video message introduced with the
 * "Multiple Attachments in a Single Message" feature (ENG-36752). Renders the
 * video attachment(s) of a MediaMessage — single video, adaptive grid, and a
 * "+N" overflow tile with poster thumbnails and a play overlay — by delegating
 * to CometChatVideoBubble, plus a shared batch width.
 *
 * @module components/cometchat-videos-bubble
 */

import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CommonModule } from '@angular/common';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatVideosBubbleComponent } from './cometchat-videos-bubble.component';
import { MessageBubbleAlignment } from '../../Enums/Enums';
import { expect } from '@storybook/test';
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

const SAMPLE_VIDEO = '/assets/sample-video.mp4';
const POSTER_COLORS = ['1A1A2E', '16213E', '0F3460', '533483', 'E94560', '2C5F2D', '234E70', '772F1A'];
/** Distinct poster so batch tiles don't all show the same frame. */
const posterUrl = (n: number): string =>
  `https://placehold.co/600x400/${POSTER_COLORS[(n - 1) % POSTER_COLORS.length]}/FFFFFF/png?text=Video+${n}`;

/** Single-video message. */
function makeVideoMsg(isOutgoing = true): CometChat.MediaMessage {
  return createMockMessage('video', {
    id: Math.floor(Math.random() * 10000),
    url: SAMPLE_VIDEO,
    thumbnail: posterUrl(1),
    fileName: 'clip-1.mp4',
    sentAt: Date.now() / 1000,
    sender: isOutgoing ? senderUser : receiverUser,
  }) as CometChat.MediaMessage;
}

/** Message carrying several videos in a single batch (drives the grid layout). */
function makeMultiVideoMsg(count: number, isOutgoing = true): CometChat.MediaMessage {
  const message = makeVideoMsg(isOutgoing);
  message.setAttachments(
    Array.from({ length: count }, (_, i) => {
      const attachment = new CometChat.Attachment({
        extension: 'mp4',
        mimeType: 'video/mp4',
        name: `clip-${i + 1}.mp4`,
        size: 2048000,
        url: SAMPLE_VIDEO,
      });
      // The constructor ignores unknown keys, so assign the poster after construction.
      (attachment as unknown as { thumbnail: string }).thumbnail = posterUrl(i + 1);
      return attachment;
    }),
  );
  return message;
}

// ── Meta ──────────────────────────────────────────────────────────────────────

const meta: Meta<CometChatVideosBubbleComponent> = {
  title: 'Components/Bubbles/Videos Bubble (Multiple Attachments)',
  component: CometChatVideosBubbleComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [CommonModule],
    }),
  ],
  args: {
    message: makeMultiVideoMsg(4),
    alignment: MessageBubbleAlignment.right,
    disableInteraction: false,
  },
  argTypes: {
    message: {
      control: false,
      description: 'CometChat.MediaMessage containing one or more video attachments',
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
      description: 'When true, disables click-to-play / fullscreen interaction',
      table: { defaultValue: { summary: 'false' }, category: 'Display Controls' },
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          'CometChatVideosBubble renders the video attachment(s) of a MediaMessage — single video, adaptive grid, and a "+N" overflow tile with poster thumbnails, a play overlay, and a duration badge — by delegating to CometChatVideoBubble. Rendered automatically for every video message.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<CometChatVideosBubbleComponent>;

// ── Stories ───────────────────────────────────────────────────────────────────

/** Default outgoing single-video bubble. */
export const Default: Story = {
  args: {
    message: makeVideoMsg(),
    alignment: MessageBubbleAlignment.right,
  },
};

/** Outgoing (sender) single-video bubble. */
export const Outgoing: Story = {
  args: {
    message: makeVideoMsg(true),
    alignment: MessageBubbleAlignment.right,
  },
  parameters: {
    docs: { description: { story: 'Outgoing video bubble (sender / right alignment).' } },
  },
};

/** Incoming (receiver) single-video bubble. */
export const Incoming: Story = {
  args: {
    message: makeVideoMsg(false),
    alignment: MessageBubbleAlignment.left,
  },
  parameters: {
    docs: { description: { story: 'Incoming video bubble (receiver / left alignment).' } },
  },
};

/** Two videos sent together — side-by-side grid. */
export const TwoVideos: Story = {
  args: {
    message: makeMultiVideoMsg(2, true),
    alignment: MessageBubbleAlignment.right,
  },
  parameters: {
    docs: { description: { story: 'A single message carrying two videos, rendered as a side-by-side grid.' } },
  },
};

/** Four videos sent together — 2×2 grid. */
export const FourVideoGrid: Story = {
  args: {
    message: makeMultiVideoMsg(4, true),
    alignment: MessageBubbleAlignment.right,
  },
  parameters: {
    docs: { description: { story: 'Four videos in a single message, rendered as a 2×2 grid.' } },
  },
};

/** Six videos sent together — 2×2 grid with a "+N" overflow tile. */
export const OverflowGrid: Story = {
  args: {
    message: makeMultiVideoMsg(6, true),
    alignment: MessageBubbleAlignment.right,
  },
  parameters: {
    docs: {
      description: {
        story: 'Six videos in a single message — the grid caps at four tiles and the last shows a "+N" overflow overlay.',
      },
    },
  },
};

/** Side-by-side outgoing and incoming preview. */
export const OutgoingAndIncoming: Story = {
  render: () => ({
    template: `
      <div style="display:flex;flex-direction:column;gap:8px;padding:16px;max-width:480px;">
        <cometchat-videos-bubble [message]="out" [alignment]="right"></cometchat-videos-bubble>
        <cometchat-videos-bubble [message]="inc" [alignment]="left"></cometchat-videos-bubble>
      </div>`,
    props: {
      right: MessageBubbleAlignment.right,
      left: MessageBubbleAlignment.left,
      out: makeMultiVideoMsg(3, true),
      inc: makeMultiVideoMsg(3, false),
    },
  }),
  parameters: {
    docs: { description: { story: 'Outgoing and incoming video bubbles shown together.' } },
  },
};

// ============================================
// Interaction Tests
// ============================================

/** Test: Default story renders the videos-bubble and delegates to the video bubble. */
export const TestDefaultRendersVideosBubble: Story = {
  play: async ({ canvasElement }) => {
    await new Promise(r => setTimeout(r, 500));
    const host = canvasElement.querySelector('cometchat-videos-bubble');
    expect(host).not.toBeNull();
    // Delegates to the single-attachment video bubble.
    expect(canvasElement.querySelector('cometchat-video-bubble')).not.toBeNull();
  },
};
