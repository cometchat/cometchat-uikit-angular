/**
 * CometChatToolCallArgumentBubble Storybook Stories
 *
 * Displays the arguments passed to a tool call as formatted JSON
 * (pretty-printed when valid, raw otherwise).
 *
 * @module components/cometchat-toolcall-argument-bubble
 */

import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CommonModule } from '@angular/common';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatToolCallArgumentBubble } from './cometchat-toolcall-argument-bubble.component';
import { MOCK_AVATARS } from '../../../../../../.storybook/utils/mock-data';

// ── Mock helpers ──────────────────────────────────────────────────────────────

function makeToolCall(
  name: string,
  args: Record<string, unknown>
): CometChat.AIToolCall {
  return new CometChat.AIToolCall(
    `call-${Math.random().toString(36).substr(2, 9)}`,
    'function',
    new CometChat.AIToolCallFunction(name, JSON.stringify(args))
  );
}

function makeToolArgumentMessage(
  toolCalls: CometChat.AIToolCall[]
): CometChat.AIToolArgumentMessage {
  const data = new CometChat.AIToolArgumentMessageData(
    `run-${Math.random().toString(36).substr(2, 9)}`,
    `thread-${Math.random().toString(36).substr(2, 9)}`,
    toolCalls
  );
  const msg = new CometChat.AIToolArgumentMessage('receiver-123', CometChat.RECEIVER_TYPE.USER);
  msg.setToolArgumentMessageData(data);
  return msg;
}

// ── Meta ──────────────────────────────────────────────────────────────────────

const meta: Meta<CometChatToolCallArgumentBubble> = {
  title: 'Components/AI/Tool Call Argument Bubble',
  component: CometChatToolCallArgumentBubble,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [CommonModule],
    }),
  ],
  args: {
    message: makeToolArgumentMessage([
      makeToolCall('search_knowledge_base', { query: 'CometChat Angular integration', limit: 5 }),
    ]),
  },
  argTypes: {
    message: {
      control: false,
      description: 'CometChat.AIToolArgumentMessage containing the tool calls with their arguments',
      table: { type: { summary: 'CometChat.AIToolArgumentMessage' }, category: 'Primary Inputs' },
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          'CometChatToolCallArgumentBubble displays the arguments passed to a tool call as formatted JSON. Valid JSON is pretty-printed with 2-space indentation; invalid JSON is passed through raw.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<CometChatToolCallArgumentBubble>;

// ── Stories ───────────────────────────────────────────────────────────────────

/** Default single tool call with simple arguments. */
export const Default: Story = {
  args: {
    message: makeToolArgumentMessage([
      makeToolCall('search_knowledge_base', { query: 'CometChat Angular integration', limit: 5 }),
    ]),
  },
};

/** Single tool call — search function. */
export const SearchToolCall: Story = {
  args: {
    message: makeToolArgumentMessage([
      makeToolCall('search_knowledge_base', {
        query: 'how to send a message',
        limit: 10,
        filters: { category: 'messaging', language: 'typescript' },
      }),
    ]),
  },
  parameters: {
    docs: { description: { story: 'A search tool call with nested filter arguments.' } },
  },
};

/** Single tool call — API call function. */
export const ApiToolCall: Story = {
  args: {
    message: makeToolArgumentMessage([
      makeToolCall('fetch_user_data', {
        userId: 'user-abc123',
        fields: ['name', 'email', 'avatar', 'status'],
        includeMetadata: true,
      }),
    ]),
  },
  parameters: {
    docs: { description: { story: 'An API tool call fetching user data with specific fields.' } },
  },
};

/** Multiple tool calls in one message. */
export const MultipleToolCalls: Story = {
  args: {
    message: makeToolArgumentMessage([
      makeToolCall('search_knowledge_base', { query: 'authentication', limit: 3 }),
      makeToolCall('get_code_example', { topic: 'login', language: 'typescript' }),
    ]),
  },
  parameters: {
    docs: { description: { story: 'Multiple tool calls in a single message, each displayed separately.' } },
  },
};

/** Tool call with complex nested arguments. */
export const ComplexArguments: Story = {
  args: {
    message: makeToolArgumentMessage([
      makeToolCall('create_message', {
        receiverId: 'user-xyz',
        receiverType: 'user',
        messageType: 'text',
        data: {
          text: 'Hello from the AI assistant!',
          metadata: {
            source: 'ai_assistant',
            confidence: 0.95,
            tags: ['greeting', 'automated'],
          },
        },
      }),
    ]),
  },
  parameters: {
    docs: { description: { story: 'Tool call with deeply nested JSON arguments.' } },
  },
};
