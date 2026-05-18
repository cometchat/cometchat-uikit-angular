/**
 * CometChatAIAssistantMessageBubble Storybook Stories
 *
 * Renders a completed AI assistant message with rich markdown formatting.
 *
 * @module components/cometchat-ai-assistant-message-bubble
 */

import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CommonModule } from '@angular/common';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatAIAssistantMessageBubble } from './cometchat-ai-assistant-message-bubble.component';
import { MOCK_AVATARS } from '../../../../../../.storybook/utils/mock-data';
import { within, expect } from '@storybook/test';

// ── Mock helpers ──────────────────────────────────────────────────────────────

function makeAIMessage(text: string): CometChat.AIAssistantMessage {
  return {
    getAssistantMessageData: () => ({ getText: () => text }),
    getId: () => Math.floor(Math.random() * 10000),
    getMuid: () => `muid-${Math.random().toString(36).substr(2, 9)}`,
    getCategory: () => 'message',
    getType: () => 'ai_assistant',
    getSentAt: () => Date.now() / 1000,
    getDeletedAt: () => 0,
    getEditedAt: () => 0,
    getReadAt: () => 0,
    getDeliveredAt: () => 0,
    getReplyCount: () => 0,
    getUnreadRepliesCount: () => 0,
    getReactions: () => [],
    getMetadata: () => ({}),
    getParentMessageId: () => 0,
  } as unknown as CometChat.AIAssistantMessage;
}

// ── Meta ──────────────────────────────────────────────────────────────────────

const meta: Meta<CometChatAIAssistantMessageBubble> = {
  title: 'Components/AI/AI Assistant Message Bubble',
  component: CometChatAIAssistantMessageBubble,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [CommonModule],
    }),
  ],
  args: {
    message: makeAIMessage('Hello! How can I help you today?'),
  },
  argTypes: {
    message: {
      control: false,
      description: 'CometChat.AIAssistantMessage — the completed AI assistant message to render',
      table: { type: { summary: 'CometChat.AIAssistantMessage' }, category: 'Primary Inputs' },
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          'CometChatAIAssistantMessageBubble renders a completed AI assistant message with rich markdown formatting via CometChatMarkdownRenderer.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<CometChatAIAssistantMessageBubble>;

// ── Stories ───────────────────────────────────────────────────────────────────

/** Default simple AI response. */
export const Default: Story = {
  args: {
    message: makeAIMessage('Hello! How can I help you today?'),
  },
};

/** Simple text response. */
export const SimpleText: Story = {
  args: {
    message: makeAIMessage('Sure! I can help you with that. Let me look into it for you.'),
  },
  parameters: {
    docs: { description: { story: 'A simple plain-text AI response.' } },
  },
};

/** Response with markdown formatting. */
export const WithMarkdown: Story = {
  args: {
    message: makeAIMessage(
      `Here's a summary of the key points:

**Main findings:**
- The integration is straightforward
- Performance is excellent
- Documentation is comprehensive

*Note: Always test in a staging environment first.*`
    ),
  },
  parameters: {
    docs: { description: { story: 'AI response with bold, italic, and list markdown formatting.' } },
  },
};

/** Response with a code block. */
export const WithCodeBlock: Story = {
  args: {
    message: makeAIMessage(
      `To initialize CometChat in your Angular app, add this to your \`main.ts\`:

\`\`\`typescript
import { CometChat } from '@cometchat/chat-sdk-javascript';

await CometChat.init('YOUR_APP_ID', new CometChat.AppSettingsBuilder()
  .subscribePresenceForAllUsers()
  .setRegion('us')
  .build()
);
\`\`\`

Then login the user:

\`\`\`typescript
const user = await CometChat.login('USER_UID', 'AUTH_KEY');
console.log('Logged in:', user.getName());
\`\`\``
    ),
  },
  parameters: {
    docs: { description: { story: 'AI response containing code blocks with copy-to-clipboard buttons.' } },
  },
};

/** Long detailed response. */
export const LongResponse: Story = {
  args: {
    message: makeAIMessage(
      `## CometChat Angular UIKit Overview

The CometChat Angular UIKit provides a complete set of pre-built UI components for adding real-time chat to your Angular application.

### Key Components

1. **CometChatConversations** — displays a list of recent conversations
2. **CometChatMessageList** — renders the message thread
3. **CometChatMessageComposer** — handles message input and sending
4. **CometChatMessageHeader** — shows conversation info and actions

### Supported Message Types

| Type | Component | Description |
|------|-----------|-------------|
| Text | CometChatTextBubble | Plain text with formatting |
| Image | CometChatImageBubble | Single or multi-image grid |
| Audio | CometChatAudioBubble | Waveform player |
| Video | CometChatVideoBubble | Thumbnail + fullscreen |
| File | CometChatFileBubble | File download card |
| Poll | CometChatPollBubble | Interactive voting |

### Getting Started

\`\`\`bash
npm install @cometchat/chat-uikit-angular
\`\`\`

> For more information, visit the [official documentation](https://www.cometchat.com/docs).`
    ),
  },
  parameters: {
    docs: { description: { story: 'A long AI response with headings, lists, a table, code block, and a link.' } },
  },
};

// ============================================
// Interaction Tests
// ============================================

/** Test: Default story renders AI assistant message bubble container */
export const TestDefaultRendersBubble: Story = {
  play: async ({ canvasElement }) => {
    await new Promise(r => setTimeout(r, 1000));
    const container = canvasElement.querySelector('.cometchat-ai-assistant-message-bubble');
    expect(container).not.toBeNull();
  },
};
