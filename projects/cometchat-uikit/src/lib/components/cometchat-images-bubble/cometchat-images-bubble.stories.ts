/**
 * CometChatImagesBubble Storybook Stories
 *
 * Receive-side bubble for a (multi-)image message introduced with the
 * "Multiple Attachments in a Single Message" feature (ENG-36752). Renders the
 * image attachment(s) of a MediaMessage — single image, adaptive grid, and a
 * "+N" overflow tile — by delegating to CometChatImageBubble, plus a shared
 * batch width so every message in a batch lines up.
 *
 * @module components/cometchat-images-bubble
 */

import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CommonModule } from '@angular/common';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatImagesBubbleComponent } from './cometchat-images-bubble.component';
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

/** Distinct placeholder image so batch tiles don't all show the same picture. */
const PHOTO_COLORS = ['6852D6', '09C26F', 'FFAB00', 'FF3B30', '0B7DDA', 'AA00FF', '00B8D9', 'FF6B00'];
const photoUrl = (n: number): string =>
  `https://placehold.co/600x400/${PHOTO_COLORS[(n - 1) % PHOTO_COLORS.length]}/FFFFFF/png?text=Photo+${n}`;

/** Single-image message. */
function makeImageMsg(isOutgoing = true): CometChat.MediaMessage {
  return createMockMessage('image', {
    id: Math.floor(Math.random() * 10000),
    url: photoUrl(1),
    fileName: 'photo-1.jpg',
    sentAt: Date.now() / 1000,
    sender: isOutgoing ? senderUser : receiverUser,
  }) as CometChat.MediaMessage;
}

/** Message carrying several images in a single batch (drives the grid layout). */
function makeMultiImageMsg(count: number, isOutgoing = true): CometChat.MediaMessage {
  const message = makeImageMsg(isOutgoing);
  message.setAttachments(
    Array.from(
      { length: count },
      (_, i) =>
        new CometChat.Attachment({
          extension: 'jpg',
          mimeType: 'image/jpeg',
          name: `photo-${i + 1}.jpg`,
          size: 102400,
          url: photoUrl(i + 1),
        }),
    ),
  );
  return message;
}

// ── Meta ──────────────────────────────────────────────────────────────────────

const meta: Meta<CometChatImagesBubbleComponent> = {
  title: 'Components/Bubbles/Images Bubble (Multiple Attachments)',
  component: CometChatImagesBubbleComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [CommonModule],
    }),
  ],
  args: {
    message: makeMultiImageMsg(4),
    alignment: MessageBubbleAlignment.right,
    disableInteraction: false,
  },
  argTypes: {
    message: {
      control: false,
      description: 'CometChat.MediaMessage containing one or more image attachments',
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
  },
  parameters: {
    docs: {
      description: {
        component:
          'CometChatImagesBubble renders the image attachment(s) of a MediaMessage — single image, adaptive grid, and a "+N" overflow tile — by delegating to CometChatImageBubble. Rendered automatically for every image message.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<CometChatImagesBubbleComponent>;

// ── Stories ───────────────────────────────────────────────────────────────────

/** Default outgoing single-image bubble. */
export const Default: Story = {
  args: {
    message: makeImageMsg(),
    alignment: MessageBubbleAlignment.right,
  },
};

/** Outgoing (sender) single-image bubble. */
export const Outgoing: Story = {
  args: {
    message: makeImageMsg(true),
    alignment: MessageBubbleAlignment.right,
  },
  parameters: {
    docs: { description: { story: 'Outgoing image bubble (sender / right alignment).' } },
  },
};

/** Incoming (receiver) single-image bubble. */
export const Incoming: Story = {
  args: {
    message: makeImageMsg(false),
    alignment: MessageBubbleAlignment.left,
  },
  parameters: {
    docs: { description: { story: 'Incoming image bubble (receiver / left alignment).' } },
  },
};

/** Two images sent together — side-by-side grid. */
export const TwoImages: Story = {
  args: {
    message: makeMultiImageMsg(2, true),
    alignment: MessageBubbleAlignment.right,
  },
  parameters: {
    docs: { description: { story: 'A single message carrying two images, rendered as a side-by-side grid.' } },
  },
};

/** Four images sent together — 2×2 grid. */
export const FourImageGrid: Story = {
  args: {
    message: makeMultiImageMsg(4, true),
    alignment: MessageBubbleAlignment.right,
  },
  parameters: {
    docs: { description: { story: 'Four images in a single message, rendered as a 2×2 grid.' } },
  },
};

/** Six images sent together — 2×2 grid with a "+N" overflow tile. */
export const OverflowGrid: Story = {
  args: {
    message: makeMultiImageMsg(6, true),
    alignment: MessageBubbleAlignment.right,
  },
  parameters: {
    docs: {
      description: {
        story: 'Six images in a single message — the grid caps at four tiles and the last shows a "+N" overflow overlay.',
      },
    },
  },
};

/** Side-by-side outgoing and incoming preview. */
export const OutgoingAndIncoming: Story = {
  render: () => ({
    template: `
      <div style="display:flex;flex-direction:column;gap:8px;padding:16px;max-width:480px;">
        <cometchat-images-bubble [message]="out" [alignment]="right"></cometchat-images-bubble>
        <cometchat-images-bubble [message]="inc" [alignment]="left"></cometchat-images-bubble>
      </div>`,
    props: {
      right: MessageBubbleAlignment.right,
      left: MessageBubbleAlignment.left,
      out: makeMultiImageMsg(3, true),
      inc: makeMultiImageMsg(3, false),
    },
  }),
  parameters: {
    docs: { description: { story: 'Outgoing and incoming image bubbles shown together.' } },
  },
};

// ============================================
// Interaction Tests
// ============================================

/** Test: Default story renders the images-bubble and delegates to the image bubble. */
export const TestDefaultRendersImagesBubble: Story = {
  play: async ({ canvasElement }) => {
    await new Promise(r => setTimeout(r, 500));
    const host = canvasElement.querySelector('cometchat-images-bubble');
    expect(host).not.toBeNull();
    // Delegates to the single-attachment image bubble.
    expect(canvasElement.querySelector('cometchat-image-bubble')).not.toBeNull();
  },
};
