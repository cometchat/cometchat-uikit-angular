/**
 * CometChatAIAssistantChat Storybook Stories
 *
 * Top-level orchestrator component for the AI assistant chat experience.
 * Wires together MessageHeader, MessageList, MessageComposer, and the
 * ChatHistory sidebar.
 *
 * Note: This component requires a fully initialized CometChat SDK and a
 * valid logged-in user to function. In Storybook (without SDK initialization),
 * it will render the shell layout. Use the static preview stories to see
 * the visual design.
 *
 * @module components/cometchat-ai-assistant-chat
 */

import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CommonModule } from '@angular/common';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatAIAssistantChat } from './cometchat-ai-assistant-chat.component';
import { createMockUser, MOCK_AVATARS } from '../../../../../../.storybook/utils/mock-data';
import { TranslatePipe } from '../../resources/CometChatLocalize/translate.pipe';
import { within, expect } from '@storybook/test';

// ── Mock helpers ──────────────────────────────────────────────────────────────

const aiAgentUser = createMockUser({
  uid: 'ai-agent-uid',
  name: 'AI Assistant',
  avatar: MOCK_AVATARS.andrewJoseph,
  status: CometChat.USER_STATUS.ONLINE,
  metadata: {
    greetingMessage: 'Hello! I\'m your AI assistant.',
    introductoryMessage: 'I can help you with questions about CometChat, coding, and more. What would you like to know?',
    suggestedMessages: [
      'How do I send a message?',
      'What message types are supported?',
      'How do I customize the UI?',
    ],
  },
});

// ── Meta ──────────────────────────────────────────────────────────────────────

const meta: Meta<CometChatAIAssistantChat> = {
  title: 'Components/AI/AI Assistant Chat',
  component: CometChatAIAssistantChat,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [CommonModule, TranslatePipe],
    }),
  ],
  argTypes: {
    user: {
      control: false,
      description: 'Required. The AI agent user to chat with.',
      table: { type: { summary: 'CometChat.User' }, category: 'Primary Inputs' },
    },
    streamingSpeed: {
      control: { type: 'number', min: 5, max: 200, step: 5 },
      description: 'Character streaming speed in milliseconds per character',
      table: { type: { summary: 'number' }, defaultValue: { summary: '30' }, category: 'Behavior' },
    },
    loadLastAgentConversation: {
      control: 'boolean',
      description: 'When true, automatically loads the most recent conversation on mount',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' }, category: 'Behavior' },
    },
    showSuggestedMessages: {
      control: 'boolean',
      description: 'When true, shows suggestion pills before the first message is sent',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' }, category: 'Display Controls' },
    },
    suggestedMessages: {
      control: false,
      description: 'Explicit list of suggestion pill texts (overrides user metadata.suggestedMessages)',
      table: { type: { summary: 'string[]' }, category: 'Display Controls' },
    },
    aiAssistantTools: {
      control: false,
      description: 'Optional AI assistant tools configuration',
      table: { category: 'Advanced' },
    },
    greetingTemplate: {
      control: false,
      description: 'Optional custom greeting template (receives user as $implicit context)',
      table: { category: 'Templates' },
    },
  },
  parameters: {
    docs: {
      description: {
        component: `CometChatAIAssistantChat is the top-level orchestrator for the AI assistant chat experience.

**Features:**
- Full message thread with AI agent
- Streaming response display with thinking indicator
- Suggestion pills (from user metadata or explicit input)
- Chat history sidebar with past conversations
- New chat button to start fresh
- Stop streaming button during active generation

**Requirements:**
- CometChat SDK must be initialized
- A valid logged-in user must exist
- The \`user\` input must be a valid AI agent user

In Storybook (without SDK initialization), the component renders the shell layout but cannot fetch messages or send/receive them.`,
      },
    },
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<CometChatAIAssistantChat>;

// ── Stories ───────────────────────────────────────────────────────────────────

/**
 * Default — component with AI agent user.
 * Renders the shell; requires SDK for full functionality.
 */
export const Default: Story = {
  args: {
    user: aiAgentUser,
    streamingSpeed: 30,
    showSuggestedMessages: true,
    loadLastAgentConversation: false,
  },
};

/**
 * With explicit suggestion pills.
 */
export const WithSuggestions: Story = {
  args: {
    user: aiAgentUser,
    showSuggestedMessages: true,
    suggestedMessages: [
      'How do I send a message?',
      'What message types are supported?',
      'How do I customize the UI theme?',
      'How to set up push notifications?',
    ],
  },
  parameters: {
    docs: { description: { story: 'AI assistant chat with explicit suggestion pills provided via input.' } },
  },
};

/**
 * Without suggestion pills.
 */
export const WithoutSuggestions: Story = {
  args: {
    user: aiAgentUser,
    showSuggestedMessages: false,
  },
  parameters: {
    docs: { description: { story: 'AI assistant chat with suggestion pills hidden.' } },
  },
};

/**
 * Faster streaming speed.
 */
export const FastStreaming: Story = {
  args: {
    user: aiAgentUser,
    streamingSpeed: 10,
    showSuggestedMessages: true,
  },
  parameters: {
    docs: { description: { story: 'AI assistant chat configured with faster streaming speed (10ms per character).' } },
  },
};

/**
 * Static layout preview — shows the visual design without SDK.
 */
export const LayoutPreview: Story = {
  tags: ['!autodocs', '!dev'],
  render: () => ({
    template: `
      <div style="
        display: flex;
        height: 560px;
        width: 100%;
        max-width: 900px;
        border: 1px solid var(--cometchat-border-color-light, #e8e8e8);
        border-radius: var(--cometchat-radius-3, 12px);
        overflow: hidden;
        font-family: var(--cometchat-font-family, sans-serif);
        background: var(--cometchat-background-color-02, #f5f5f5);
      ">
        <!-- Main chat area -->
        <div style="flex: 1; display: flex; flex-direction: column; min-width: 0;">
          <!-- Header (matches cometchat-message-header with auxiliary buttons) -->
          <div style="
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 16px;
            background: var(--cometchat-background-color-01, #fff);
            border-bottom: 1px solid var(--cometchat-border-color-light, #e8e8e8);
          ">
            <div style="
              width: 36px; height: 36px;
              border-radius: 50%;
              background: var(--cometchat-primary-color, #6852D6);
              display: flex; align-items: center; justify-content: center;
              color: #fff; font-weight: bold; font-size: 14px;
            ">AI</div>
            <div style="flex: 1;">
              <div style="font: var(--cometchat-font-heading4-medium, 500 16px sans-serif); color: var(--cometchat-text-color-primary, #141414);">AI Assistant</div>
              <div style="font: var(--cometchat-font-caption1-regular, 12px sans-serif); color: var(--cometchat-success-color, #22c55e);">Online</div>
            </div>
            <!-- Auxiliary buttons: New Chat + History -->
            <div style="display: flex; align-items: center; gap: 4px;">
              <button style="
                width: 36px; height: 36px;
                background: none; border: none;
                border-radius: var(--cometchat-radius-1, 4px);
                cursor: pointer;
                display: flex; align-items: center; justify-content: center;
              " title="New Chat">
                <span style="font-size: 18px; color: var(--cometchat-icon-color-secondary, #a1a1a1);">✎</span>
              </button>
              <button style="
                width: 36px; height: 36px;
                background: none; border: none;
                border-radius: var(--cometchat-radius-1, 4px);
                cursor: pointer;
                display: flex; align-items: center; justify-content: center;
              " title="Chat History">
                <span style="font-size: 18px; color: var(--cometchat-icon-color-secondary, #a1a1a1);">☰</span>
              </button>
            </div>
          </div>
          <!-- Greeting area (empty state) -->
          <div style="
            flex: 1; display: flex; flex-direction: column;
            align-items: center; justify-content: center;
            padding: 24px; gap: 12px;
          ">
            <div style="
              width: 56px; height: 56px;
              border-radius: 50%;
              background: var(--cometchat-background-color-03, #eee);
              display: flex; align-items: center; justify-content: center;
              overflow: hidden;
            ">
              <span style="font-size: 28px;">🤖</span>
            </div>
            <div style="
              font: var(--cometchat-font-heading3-bold, bold 18px sans-serif);
              color: var(--cometchat-text-color-primary, #141414);
              text-align: center;
            ">Hello! I'm your AI assistant.</div>
            <div style="
              font: var(--cometchat-font-body-regular, 14px sans-serif);
              color: var(--cometchat-text-color-secondary, #727272);
              text-align: center; max-width: 360px;
            ">I can help you with questions about CometChat, coding, and more. What would you like to know?</div>
            <!-- Suggestion pills -->
            <div style="display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin-top: 12px;">
              <button *ngFor="let s of suggestions" style="
                background: var(--cometchat-background-color-01, #fff);
                border: 1px solid var(--cometchat-border-color-light, #e8e8e8);
                border-radius: var(--cometchat-radius-max, 1000px);
                padding: 8px 16px;
                font: var(--cometchat-font-caption1-medium, 500 12px sans-serif);
                cursor: pointer;
                color: var(--cometchat-text-color-primary, #141414);
                display: flex; align-items: center; gap: 6px;
              ">{{ s }} <span style="color: var(--cometchat-icon-color-secondary, #a1a1a1);">↗</span></button>
            </div>
          </div>
          <!-- Composer (minimal: just input + send button, no attachments/emoji/voice) -->
          <div style="
            padding: 12px 16px;
            background: var(--cometchat-background-color-01, #fff);
            border-top: 1px solid var(--cometchat-border-color-light, #e8e8e8);
            display: flex; gap: 8px; align-items: center;
          ">
            <div style="
              flex: 1;
              border: 1px solid var(--cometchat-border-color-light, #e8e8e8);
              border-radius: var(--cometchat-radius-max, 1000px);
              padding: 10px 16px;
              font: var(--cometchat-font-body-regular, 14px sans-serif);
              color: var(--cometchat-text-color-tertiary, #a1a1a1);
              background: var(--cometchat-background-color-01, #fff);
            ">Ask me anything...</div>
            <div style="
              width: 36px; height: 36px;
              border-radius: 50%;
              background: var(--cometchat-neutral-color-300, #dcdcdc);
              display: flex; align-items: center; justify-content: center;
            ">
              <span style="color: var(--cometchat-neutral-color-600, #999); font-size: 16px;">▲</span>
            </div>
          </div>
        </div>
      </div>`,
    props: {
      suggestions: [
        'How do I send a message?',
        'What message types are supported?',
        'How do I customize the UI?',
      ],
    },
  }),
  parameters: {
    docs: { description: { story: 'Static layout preview showing the AI assistant chat design with message header, greeting, suggestion pills, and minimal composer.' } },
    layout: 'centered',
  },
};

// ============================================
// Interaction Tests
// ============================================

/** Test: Default story renders AI assistant chat container */
export const TestDefaultRendersChat: Story = {
  args: {
    user: aiAgentUser,
    streamingSpeed: 30,
    showSuggestedMessages: true,
    loadLastAgentConversation: false,
  },
  play: async ({ canvasElement }) => {
    await new Promise(r => setTimeout(r, 1000));
    const container = canvasElement.querySelector('.cometchat-ai-assistant-chat');
    expect(container).not.toBeNull();
  },
};
