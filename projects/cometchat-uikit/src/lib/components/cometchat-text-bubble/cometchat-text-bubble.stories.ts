/**
 * CometChatTextBubble Storybook Stories
 *
 * Renders text messages with rich formatting: link previews, translations,
 * mentions, URL detection, and single emoji display.
 *
 * @module components/cometchat-text-bubble
 */

import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CommonModule } from '@angular/common';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatTextBubbleComponent } from './cometchat-text-bubble.component';
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

function makeTextMsg(text: string, isOutgoing = true): CometChat.TextMessage {
  return createMockMessage('text', {
    id: Math.floor(Math.random() * 10000),
    text,
    sentAt: Date.now() / 1000,
    sender: isOutgoing ? senderUser : receiverUser,
  }) as CometChat.TextMessage;
}

// ── Meta ──────────────────────────────────────────────────────────────────────

const meta: Meta<CometChatTextBubbleComponent> = {
  title: 'Components/Bubbles/Text Bubble',
  component: CometChatTextBubbleComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [CommonModule],
    }),
  ],
  args: {
    message: makeTextMsg('Hello! This is a sample text message.'),
    alignment: MessageBubbleAlignment.right,
  },
  argTypes: {
    message: {
      control: false,
      description: 'CometChat.TextMessage object to render',
      table: { type: { summary: 'CometChat.TextMessage' }, category: 'Primary Inputs' },
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
    textFormatters: {
      control: false,
      description: 'Optional array of text formatters for mentions, links, etc.',
      table: { category: 'Formatting' },
    },
    translatedTextOverride: {
      control: 'text',
      description: 'Override translated text to display below the original',
      table: { category: 'Formatting' },
    },
    linkClick: { action: 'linkClick', table: { category: 'Events' } },
    mentionClick: { action: 'mentionClick', table: { category: 'Events' } },
  },
  parameters: {
    docs: {
      description: {
        component:
          'CometChatTextBubble renders text messages with rich formatting including link previews, translations, mentions, URL detection, and single emoji display.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<CometChatTextBubbleComponent>;

// ── Stories ───────────────────────────────────────────────────────────────────

/** Default outgoing text message. */
export const Default: Story = {
  args: {
    message: makeTextMsg('Hello! This is a sample text message.'),
    alignment: MessageBubbleAlignment.right,
  },
};

/** Outgoing (sender) text bubble. */
export const Outgoing: Story = {
  args: {
    message: makeTextMsg('Hey there! How is the project going? 🎨'),
    alignment: MessageBubbleAlignment.right,
  },
  parameters: {
    docs: { description: { story: 'Outgoing text bubble (sender / right alignment).' } },
  },
};

/** Incoming (receiver) text bubble. */
export const Incoming: Story = {
  args: {
    message: makeTextMsg('Looks great! I will review the PR this afternoon. 👍', false),
    alignment: MessageBubbleAlignment.left,
  },
  parameters: {
    docs: { description: { story: 'Incoming text bubble (receiver / left alignment).' } },
  },
};

/** Single emoji message — rendered larger. */
export const SingleEmoji: Story = {
  args: {
    message: makeTextMsg('👋'),
    alignment: MessageBubbleAlignment.right,
  },
  parameters: {
    docs: { description: { story: 'Single emoji messages are rendered at a larger size.' } },
  },
};

/** Long message that may be truncated with a "Read more" toggle. */
export const LongMessage: Story = {
  args: {
    message: makeTextMsg(
      'This is a very long message that demonstrates how the text bubble handles content truncation. ' +
      'When a message exceeds the maximum height, a "Read more" button appears to allow the user to expand the full content. ' +
      'This is useful for keeping the chat interface clean and readable while still allowing access to the full message text. ' +
      'The component automatically detects when truncation is needed based on the rendered height of the content element.'
    ),
    alignment: MessageBubbleAlignment.right,
  },
  parameters: {
    docs: { description: { story: 'Long messages may show a "Read more" toggle when content exceeds the max height.' } },
  },
};

/** Side-by-side outgoing and incoming preview. */
export const OutgoingAndIncoming: Story = {
  render: () => ({
    template: `
      <div style="display:flex;flex-direction:column;gap:8px;padding:16px;max-width:480px;">
        <cometchat-text-bubble [message]="out" [alignment]="right"></cometchat-text-bubble>
        <cometchat-text-bubble [message]="inc" [alignment]="left"></cometchat-text-bubble>
      </div>`,
    props: {
      right: MessageBubbleAlignment.right,
      left: MessageBubbleAlignment.left,
      out: makeTextMsg('Hey there! How is the project going? 🎨'),
      inc: makeTextMsg('Looks great! I will review the PR this afternoon. 👍', false),
    },
  }),
  parameters: {
    docs: { description: { story: 'Outgoing and incoming text bubbles shown together.' } },
  },
};
