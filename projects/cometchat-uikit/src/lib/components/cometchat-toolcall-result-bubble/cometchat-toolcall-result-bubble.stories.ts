/**
 * CometChatToolCallResultBubble Storybook Stories
 *
 * Displays the result returned by a tool call as formatted JSON
 * (pretty-printed when valid, raw otherwise). Renders nothing when result is empty.
 *
 * @module components/cometchat-toolcall-result-bubble
 */

import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CommonModule } from '@angular/common';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatToolCallResultBubble } from './cometchat-toolcall-result-bubble.component';
import { MOCK_AVATARS } from '../../../../../../.storybook/utils/mock-data';

// ── Mock helpers ──────────────────────────────────────────────────────────────

function makeToolResultMessage(resultText: string): CometChat.AIToolResultMessage {
  const data = new CometChat.AIToolResultMessageData(
    `run-${Math.random().toString(36).substr(2, 9)}`,
    `thread-${Math.random().toString(36).substr(2, 9)}`,
    resultText,
    `call-${Math.random().toString(36).substr(2, 9)}`
  );
  const msg = new CometChat.AIToolResultMessage('receiver-123', CometChat.RECEIVER_TYPE.USER);
  msg.setToolResultMessageData(data);
  return msg;
}

// ── Meta ──────────────────────────────────────────────────────────────────────

const meta: Meta<CometChatToolCallResultBubble> = {
  title: 'Components/AI/Tool Call Result Bubble',
  component: CometChatToolCallResultBubble,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [CommonModule],
    }),
  ],
  args: {
    message: makeToolResultMessage(
      JSON.stringify({ success: true, results: [{ id: '1', title: 'Getting Started', relevance: 0.95 }] })
    ),
  },
  argTypes: {
    message: {
      control: false,
      description: 'CometChat.AIToolResultMessage containing the tool result data',
      table: { type: { summary: 'CometChat.AIToolResultMessage' }, category: 'Primary Inputs' },
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          'CometChatToolCallResultBubble displays the result returned by a tool call as formatted JSON. Valid JSON is pretty-printed with 2-space indentation; invalid JSON is passed through raw. Renders nothing when the result is empty or null.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<CometChatToolCallResultBubble>;

// ── Stories ───────────────────────────────────────────────────────────────────

/** Default tool result with JSON response. */
export const Default: Story = {
  args: {
    message: makeToolResultMessage(
      JSON.stringify({ success: true, results: [{ id: '1', title: 'Getting Started', relevance: 0.95 }] })
    ),
  },
};

/** Search results response. */
export const SearchResults: Story = {
  args: {
    message: makeToolResultMessage(
      JSON.stringify({
        success: true,
        total: 3,
        results: [
          { id: 'doc-1', title: 'CometChat Angular Integration Guide', relevance: 0.98, url: 'https://docs.cometchat.com/angular' },
          { id: 'doc-2', title: 'Message Types Overview', relevance: 0.87, url: 'https://docs.cometchat.com/messages' },
          { id: 'doc-3', title: 'Authentication with Auth Tokens', relevance: 0.75, url: 'https://docs.cometchat.com/auth' },
        ],
      })
    ),
  },
  parameters: {
    docs: { description: { story: 'Tool result showing search results with relevance scores.' } },
  },
};

/** User data response. */
export const UserDataResult: Story = {
  args: {
    message: makeToolResultMessage(
      JSON.stringify({
        uid: 'user-abc123',
        name: 'Alice Johnson',
        email: 'alice@example.com',
        status: 'online',
        avatar: 'https://example.com/avatar.jpg',
        metadata: { role: 'admin', department: 'Engineering' },
      })
    ),
  },
  parameters: {
    docs: { description: { story: 'Tool result containing user data from an API call.' } },
  },
};

/** Error response. */
export const ErrorResult: Story = {
  args: {
    message: makeToolResultMessage(
      JSON.stringify({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'The requested resource could not be found.',
          details: { resourceId: 'doc-999', resourceType: 'document' },
        },
      })
    ),
  },
  parameters: {
    docs: { description: { story: 'Tool result showing an error response from the tool.' } },
  },
};

/** Plain text result (non-JSON). */
export const PlainTextResult: Story = {
  args: {
    message: makeToolResultMessage(
      'The weather in San Francisco today is 68°F (20°C) with partly cloudy skies. Wind: 12 mph from the west.'
    ),
  },
  parameters: {
    docs: { description: { story: 'Tool result with plain text (non-JSON) content — passed through as-is.' } },
  },
};

/** Empty result — renders nothing. */
export const EmptyResult: Story = {
  args: {
    message: makeToolResultMessage(''),
  },
  parameters: {
    docs: { description: { story: 'When the result text is empty, the component renders nothing.' } },
  },
};
