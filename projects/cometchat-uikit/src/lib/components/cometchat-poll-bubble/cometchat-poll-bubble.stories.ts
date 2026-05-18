/**
 * CometChatPollBubble Storybook Stories
 *
 * Renders poll messages with voting functionality, vote counts, progress bars,
 * and voter avatars.
 *
 * @module components/cometchat-poll-bubble
 */

import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CommonModule } from '@angular/common';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatPollBubbleComponent } from './cometchat-poll-bubble.component';
import { MessageBubbleAlignment } from '../../Enums/Enums';
import { within, expect } from '@storybook/test';
import {
  createMockPollMessage,
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

const loggedInUser = createMockUser({
  uid: 'user-logged-in',
  name: 'Andrew Joseph',
  avatar: MOCK_AVATARS.andrewJoseph,
  status: CometChat.USER_STATUS.ONLINE,
});

function makePollMsg(isOutgoing = true): CometChat.CustomMessage {
  return createMockPollMessage({
    id: Math.floor(Math.random() * 10000),
    sentAt: Date.now() / 1000,
    sender: isOutgoing ? senderUser : receiverUser,
    question: 'What is your favorite programming language?',
    options: { '1': 'TypeScript', '2': 'JavaScript', '3': 'Python', '4': 'Rust' },
    results: {
      total: 7,
      options: {
        '1': { count: 3, voters: { 'user-1': { name: 'Alice' }, 'user-2': { name: 'Bob' }, 'user-3': { name: 'Charlie' } } },
        '2': { count: 2, voters: { 'user-4': { name: 'Diana' }, 'user-5': { name: 'Eve' } } },
        '3': { count: 1, voters: { 'user-6': { name: 'Frank' } } },
        '4': { count: 1, voters: { 'user-7': { name: 'Grace' } } },
      },
    },
  });
}

function makeEmptyPollMsg(isOutgoing = true): CometChat.CustomMessage {
  return createMockPollMessage({
    id: Math.floor(Math.random() * 10000),
    sentAt: Date.now() / 1000,
    sender: isOutgoing ? senderUser : receiverUser,
    question: 'Which framework do you prefer?',
    options: { '1': 'Angular', '2': 'React', '3': 'Vue' },
    results: { total: 0, options: {} },
  });
}

// ── Meta ──────────────────────────────────────────────────────────────────────

const meta: Meta<CometChatPollBubbleComponent> = {
  title: 'Components/Bubbles/Poll Bubble',
  component: CometChatPollBubbleComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [CommonModule],
    }),
  ],
  args: {
    message: makePollMsg(),
    alignment: MessageBubbleAlignment.right,
    disableInteraction: false,
  },
  argTypes: {
    message: {
      control: false,
      description: 'CometChat.CustomMessage containing poll data in its metadata',
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
    loggedInUser: {
      control: false,
      description: 'The currently logged-in user (used to determine selected options)',
      table: { type: { summary: 'CometChat.User' }, category: 'Primary Inputs' },
    },
    disableInteraction: {
      control: 'boolean',
      description: 'When true, disables all interactive elements (voting)',
      table: { defaultValue: { summary: 'false' }, category: 'Display Controls' },
    },
    voteSubmit: { action: 'voteSubmit', table: { category: 'Events' } },
    voteError: { action: 'voteError', table: { category: 'Events' } },
    voteUpdate: { action: 'voteUpdate', table: { category: 'Events' } },
  },
  parameters: {
    docs: {
      description: {
        component:
          'CometChatPollBubble renders poll messages with voting functionality, vote counts, progress bars, and voter avatars.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<CometChatPollBubbleComponent>;

// ── Stories ───────────────────────────────────────────────────────────────────

/** Default outgoing poll with votes. */
export const Default: Story = {
  args: {
    message: makePollMsg(),
    alignment: MessageBubbleAlignment.right,
    loggedInUser,
  },
};

/** Outgoing (sender) poll bubble with votes. */
export const Outgoing: Story = {
  args: {
    message: makePollMsg(true),
    alignment: MessageBubbleAlignment.right,
    loggedInUser,
  },
  parameters: {
    docs: { description: { story: 'Outgoing poll bubble (sender / right alignment) with existing votes.' } },
  },
};

/** Incoming (receiver) poll bubble with votes. */
export const Incoming: Story = {
  args: {
    message: makePollMsg(false),
    alignment: MessageBubbleAlignment.left,
    loggedInUser,
  },
  parameters: {
    docs: { description: { story: 'Incoming poll bubble (receiver / left alignment) with existing votes.' } },
  },
};

/** Poll with no votes yet. */
export const NoVotes: Story = {
  args: {
    message: makeEmptyPollMsg(),
    alignment: MessageBubbleAlignment.right,
    loggedInUser,
  },
  parameters: {
    docs: { description: { story: 'Poll bubble with no votes yet — all options show 0%.' } },
  },
};

/** Poll with interaction disabled. */
export const InteractionDisabled: Story = {
  args: {
    message: makePollMsg(),
    alignment: MessageBubbleAlignment.right,
    loggedInUser,
    disableInteraction: true,
  },
  parameters: {
    docs: { description: { story: 'Poll bubble with voting disabled (read-only view).' } },
  },
};

/** Side-by-side outgoing and incoming preview. */
export const OutgoingAndIncoming: Story = {
  render: () => ({
    template: `
      <div style="display:flex;flex-direction:column;gap:8px;padding:16px;max-width:480px;">
        <cometchat-poll-bubble [message]="out" [alignment]="right" [loggedInUser]="user" [disableInteraction]="true"></cometchat-poll-bubble>
        <cometchat-poll-bubble [message]="inc" [alignment]="left" [loggedInUser]="user" [disableInteraction]="true"></cometchat-poll-bubble>
      </div>`,
    props: {
      right: MessageBubbleAlignment.right,
      left: MessageBubbleAlignment.left,
      out: makePollMsg(true),
      inc: makePollMsg(false),
      user: loggedInUser,
    },
  }),
  parameters: {
    docs: { description: { story: 'Outgoing and incoming poll bubbles shown together.' } },
  },
};

// ============================================
// Interaction Tests
// ============================================

/** Test: Default story renders poll bubble container */
export const TestDefaultRendersPollBubble: Story = {
  play: async ({ canvasElement }) => {
    await new Promise(r => setTimeout(r, 1000));
    const container = canvasElement.querySelector('.cometchat-poll-bubble');
    expect(container).not.toBeNull();
  },
};
