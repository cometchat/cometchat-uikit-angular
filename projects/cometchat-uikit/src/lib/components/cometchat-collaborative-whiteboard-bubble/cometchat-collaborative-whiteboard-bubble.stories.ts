/**
 * CometChatCollaborativeWhiteboardBubble Storybook Stories
 *
 * Renders collaborative whiteboard messages with a banner image, title, subtitle,
 * and an action button to open the whiteboard.
 *
 * @module components/cometchat-collaborative-whiteboard-bubble
 */

import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CommonModule } from '@angular/common';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatCollaborativeWhiteboardBubbleComponent } from './cometchat-collaborative-whiteboard-bubble.component';
import { MessageBubbleAlignment } from '../../Enums/Enums';
import { within, expect } from '@storybook/test';
import {
  createMockWhiteboardMessage,
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

function makeWhiteboardMsg(isOutgoing = true): CometChat.CustomMessage {
  return createMockWhiteboardMessage({
    id: Math.floor(Math.random() * 10000),
    sentAt: Date.now() / 1000,
    sender: isOutgoing ? senderUser : receiverUser,
    boardUrl: 'https://example.com/collaborative-whiteboard',
  });
}

// ── Meta ──────────────────────────────────────────────────────────────────────

const meta: Meta<CometChatCollaborativeWhiteboardBubbleComponent> = {
  title: 'Components/Bubbles/Collaborative Whiteboard Bubble',
  component: CometChatCollaborativeWhiteboardBubbleComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [CommonModule],
    }),
  ],
  args: {
    message: makeWhiteboardMsg(),
    alignment: MessageBubbleAlignment.right,
    disableInteraction: false,
  },
  argTypes: {
    message: {
      control: false,
      description: 'CometChat.CustomMessage of type extension_whiteboard containing the board URL in metadata',
      table: { type: { summary: 'CometChat.CustomMessage' }, category: 'Primary Inputs' },
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
      description: 'When true, disables the action button',
      table: { defaultValue: { summary: 'false' }, category: 'Display Controls' },
    },
    buttonClick: { action: 'buttonClick', table: { category: 'Events' } },
  },
  parameters: {
    docs: {
      description: {
        component:
          'CometChatCollaborativeWhiteboardBubble renders collaborative whiteboard messages with a theme-aware banner image, localized title/subtitle, and an action button to open the whiteboard URL.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<CometChatCollaborativeWhiteboardBubbleComponent>;

// ── Stories ───────────────────────────────────────────────────────────────────

/** Default outgoing collaborative whiteboard bubble. */
export const Default: Story = {
  args: {
    message: makeWhiteboardMsg(),
    alignment: MessageBubbleAlignment.right,
  },
};

/** Outgoing (sender) collaborative whiteboard bubble. */
export const Outgoing: Story = {
  args: {
    message: makeWhiteboardMsg(true),
    alignment: MessageBubbleAlignment.right,
  },
  parameters: {
    docs: { description: { story: 'Outgoing collaborative whiteboard bubble (sender / right alignment).' } },
  },
};

/** Incoming (receiver) collaborative whiteboard bubble. */
export const Incoming: Story = {
  args: {
    message: makeWhiteboardMsg(false),
    alignment: MessageBubbleAlignment.left,
  },
  parameters: {
    docs: { description: { story: 'Incoming collaborative whiteboard bubble (receiver / left alignment).' } },
  },
};

/** Whiteboard bubble with interaction disabled. */
export const InteractionDisabled: Story = {
  args: {
    message: makeWhiteboardMsg(),
    alignment: MessageBubbleAlignment.right,
    disableInteraction: true,
  },
  parameters: {
    docs: { description: { story: 'Collaborative whiteboard bubble with the action button disabled.' } },
  },
};

/** Side-by-side outgoing and incoming preview. */
export const OutgoingAndIncoming: Story = {
  render: () => ({
    template: `
      <div style="display:flex;flex-direction:column;gap:8px;padding:16px;max-width:480px;">
        <cometchat-collaborative-whiteboard-bubble [message]="out" [alignment]="right" [disableInteraction]="true"></cometchat-collaborative-whiteboard-bubble>
        <cometchat-collaborative-whiteboard-bubble [message]="inc" [alignment]="left" [disableInteraction]="true"></cometchat-collaborative-whiteboard-bubble>
      </div>`,
    props: {
      right: MessageBubbleAlignment.right,
      left: MessageBubbleAlignment.left,
      out: makeWhiteboardMsg(true),
      inc: makeWhiteboardMsg(false),
    },
  }),
  parameters: {
    docs: { description: { story: 'Outgoing and incoming collaborative whiteboard bubbles shown together.' } },
  },
};

// ============================================
// Interaction Tests
// ============================================

/** Test: Default story renders collaborative whiteboard bubble container */
export const TestDefaultRendersWhiteboardBubble: Story = {
  play: async ({ canvasElement }) => {
    await new Promise(r => setTimeout(r, 1000));
    const container = canvasElement.querySelector('.cometchat-collaborative-whiteboard-bubble');
    expect(container).not.toBeNull();
  },
};
