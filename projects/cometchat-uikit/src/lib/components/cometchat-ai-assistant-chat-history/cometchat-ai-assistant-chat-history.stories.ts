/**
 * CometChatAIAssistantChatHistory Storybook Stories
 *
 * Renders a sidebar list of past AI conversations. Latest messages appear at
 * the top; scrolling to the bottom fetches older messages.
 *
 * Note: This component fetches messages from the CometChat SDK on init.
 * In Storybook (without SDK initialization), it will show the loading or
 * empty state. Use the static preview stories to see the populated list.
 *
 * @module components/cometchat-ai-assistant-chat-history
 */

import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CommonModule } from '@angular/common';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatAIAssistantChatHistory } from './cometchat-ai-assistant-chat-history.component';
import { createMockUser, MOCK_AVATARS } from '../../../../../../.storybook/utils/mock-data';
import { TranslatePipe } from '../../resources/CometChatLocalize/translate.pipe';

// ── Mock helpers ──────────────────────────────────────────────────────────────

const aiAgentUser = createMockUser({
  uid: 'ai-agent-uid',
  name: 'AI Assistant',
  avatar: MOCK_AVATARS.andrewJoseph,
  status: CometChat.USER_STATUS.ONLINE,
});

// ── Meta ──────────────────────────────────────────────────────────────────────

const meta: Meta<CometChatAIAssistantChatHistory> = {
  title: 'Components/AI/AI Assistant Chat History',
  component: CometChatAIAssistantChatHistory,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [CommonModule, TranslatePipe],
    }),
  ],
  args: {
    user: aiAgentUser,
    showNewChat: true,
    loadLastAgentConversation: false,
  },
  argTypes: {
    user: {
      control: false,
      description: 'The AI agent user whose conversation history to display',
      table: { type: { summary: 'CometChat.User' }, category: 'Primary Inputs' },
    },
    group: {
      control: false,
      description: 'Optional group context (alternative to user)',
      table: { type: { summary: 'CometChat.Group' }, category: 'Primary Inputs' },
    },
    showNewChat: {
      control: 'boolean',
      description: 'When true, shows the "New Chat" button at the top',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' }, category: 'Display Controls' },
    },
    loadLastAgentConversation: {
      control: 'boolean',
      description: 'When true, auto-emits the most recent conversation on first load',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' }, category: 'Behavior' },
    },
    emptyStateTemplate: {
      control: false,
      description: 'Custom template to show when there are no conversations',
      table: { category: 'Templates' },
    },
    errorStateTemplate: {
      control: false,
      description: 'Custom template to show when loading fails',
      table: { category: 'Templates' },
    },
    messageClick: { action: 'messageClick', table: { category: 'Events' } },
    newChatClick: { action: 'newChatClick', table: { category: 'Events' } },
    closeClick: { action: 'closeClick', table: { category: 'Events' } },
    empty: { action: 'empty', table: { category: 'Events' } },
  },
  parameters: {
    docs: {
      description: {
        component: `CometChatAIAssistantChatHistory renders a sidebar list of past AI conversations.

**Key behaviors:**
- Latest messages appear at the top (newest-first)
- Scrolling to the bottom fetches older messages (pagination)
- Clicking a message emits \`messageClick\` with the selected message
- The "New Chat" button emits \`newChatClick\` with null
- Messages can be deleted via the delete button on each item

In Storybook (without SDK initialization), the component will show the loading shimmer briefly then the empty state.`,
      },
    },
  },
};

export default meta;
type Story = StoryObj<CometChatAIAssistantChatHistory>;

// ── Stories ───────────────────────────────────────────────────────────────────

/**
 * Default — component with a user context.
 * Will show loading shimmer in Storybook (no SDK). See static previews for visual reference.
 */
export const Default: Story = {
  tags: ['!autodocs'],
  args: {
    user: aiAgentUser,
    showNewChat: true,
  },
};

/**
 * With New Chat button hidden.
 */
export const WithoutNewChatButton: Story = {
  tags: ['!autodocs'],
  args: {
    user: aiAgentUser,
    showNewChat: false,
  },
  parameters: {
    docs: { description: { story: 'Chat history sidebar with the "New Chat" button hidden.' } },
  },
};

/**
 * Static preview of the populated list state.
 */
export const PopulatedListPreview: Story = {
  render: () => ({
    template: `
      <div style="
        width: 420px;
        height: 400px;
        border: 1px solid var(--cometchat-border-color-light, #e8e8e8);
        border-radius: var(--cometchat-radius-3, 12px);
        overflow: hidden;
        display: flex;
        flex-direction: column;
        background: var(--cometchat-background-color-01, #fff);
        font-family: var(--cometchat-font-family, sans-serif);
      ">
        <!-- Header -->
        <div style="
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px;
          border-bottom: 1px solid var(--cometchat-border-color-light, #e8e8e8);
        ">
          <span style="font: var(--cometchat-font-heading3-bold, bold 16px sans-serif); color: var(--cometchat-text-color-primary, #141414);">Chat History</span>
          <div style="display: flex; align-items: center; gap: 8px;">
            <button style="
              background: none;
              border: none;
              color: var(--cometchat-text-color-secondary, #727272);
              cursor: pointer;
              font-size: 18px;
              padding: 4px;
            ">✕</button>
          </div>
        </div>
        <!-- New Chat button -->
        <div style="
          padding: 12px 16px;
          border-bottom: 1px solid var(--cometchat-border-color-light, #e8e8e8);
        ">
          <button style="
            display: flex;
            align-items: center;
            gap: 8px;
            background: none;
            border: none;
            cursor: pointer;
            font: var(--cometchat-font-body-medium, 500 14px sans-serif);
            color: var(--cometchat-text-color-primary, #141414);
            padding: 8px 0;
          ">
            <span style="font-size: 18px; color: var(--cometchat-primary-color, #6852D6);">+</span>
            New Chat
          </button>
        </div>
        <!-- Message list -->
        <div style="flex: 1; overflow-y: auto; padding: 8px;">
          <div *ngFor="let item of items" style="
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            padding: 12px;
            border-radius: var(--cometchat-radius-2, 8px);
            cursor: pointer;
            margin-bottom: 4px;
          " [style.background]="item.active ? 'var(--cometchat-primary-color-light, #EDE8FF)' : 'transparent'">
            <div style="flex: 1; min-width: 0;">
              <div style="
                font: var(--cometchat-font-body-medium, 500 14px sans-serif);
                color: var(--cometchat-text-color-primary, #141414);
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
              ">{{ item.text }}</div>
              <div style="
                font: var(--cometchat-font-caption-regular, 12px sans-serif);
                color: var(--cometchat-text-color-secondary, #727272);
                margin-top: 2px;
              ">{{ item.date }}</div>
            </div>
          </div>
        </div>
      </div>`,
    props: {
      items: [
        { text: 'How do I integrate CometChat in Angular?', date: 'Today', active: true },
        { text: 'What message types are supported?', date: 'Today', active: false },
        { text: 'How to customize the UI theme?', date: 'Yesterday', active: false },
        { text: 'Setting up push notifications', date: 'Dec 15', active: false },
        { text: 'Group chat implementation guide', date: 'Dec 14', active: false },
        { text: 'Authentication with Auth Tokens', date: 'Dec 13', active: false },
      ],
    },
  }),
  parameters: {
    docs: { description: { story: 'Static preview of the chat history sidebar with a populated conversation list.' } },
  },
};

/**
 * Static preview of the empty state.
 */
export const EmptyStatePreview: Story = {
  render: () => ({
    template: `
      <div style="
        width: 420px;
        height: 300px;
        border: 1px solid var(--cometchat-border-color-light, #e8e8e8);
        border-radius: var(--cometchat-radius-3, 12px);
        overflow: hidden;
        display: flex;
        flex-direction: column;
        background: var(--cometchat-background-color-01, #fff);
        font-family: var(--cometchat-font-family, sans-serif);
      ">
        <!-- Header -->
        <div style="
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px;
          border-bottom: 1px solid var(--cometchat-border-color-light, #e8e8e8);
        ">
          <span style="font: var(--cometchat-font-heading3-bold, bold 16px sans-serif); color: var(--cometchat-text-color-primary, #141414);">Chat History</span>
          <button style="
            background: none;
            border: none;
            color: var(--cometchat-text-color-secondary, #727272);
            cursor: pointer;
            font-size: 18px;
            padding: 4px;
          ">✕</button>
        </div>
        <!-- Empty content -->
        <div style="
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 24px;
        ">
          <div style="font-size: 40px;">💬</div>
          <div style="
            font: var(--cometchat-font-body-medium, 500 14px sans-serif);
            color: var(--cometchat-text-color-secondary, #727272);
            text-align: center;
          ">No conversations yet. Start a new chat to get help from the AI assistant.</div>
        </div>
      </div>`,
    props: {},
  }),
  parameters: {
    docs: { description: { story: 'Static preview of the empty state when no conversations exist.' } },
  },
};
