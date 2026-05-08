/**
 * CometChatStreamMessageBubble Storybook Stories
 *
 * Renders a live-streaming AI response with thinking indicator, tool execution
 * state, and incremental markdown content.
 *
 * Note: This component subscribes to CometChatAIStreamingService internally.
 * In Storybook, the streaming service won't emit events, so the component
 * renders in its initial "thinking" state. Use the static preview stories
 * to see the different visual states.
 *
 * @module components/cometchat-stream-message-bubble
 */

import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { CometChatStreamMessageBubble } from './cometchat-stream-message-bubble.component';
import { CometChatMarkdownRenderer } from '../cometchat-markdown-renderer/cometchat-markdown-renderer.component';
import { TranslatePipe } from '../../resources/CometChatLocalize/translate.pipe';

// ── Static preview wrappers ───────────────────────────────────────────────────
// Since the stream bubble relies on a live streaming service, we create
// static HTML previews to illustrate the different visual states.

@Component({
  selector: 'story-thinking-state',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="cometchat-stream-message-bubble">
      <div class="cometchat-stream-message-bubble__thinking">
        <span class="cometchat-stream-message-bubble__thinking-dot"></span>
        <span class="cometchat-stream-message-bubble__thinking-dot"></span>
        <span class="cometchat-stream-message-bubble__thinking-dot"></span>
      </div>
    </div>
  `,
})
class ThinkingStatePreview {}

// ── Meta ──────────────────────────────────────────────────────────────────────

const meta: Meta<CometChatStreamMessageBubble> = {
  title: 'Components/AI/Stream Message Bubble',
  component: CometChatStreamMessageBubble,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [CommonModule, CometChatMarkdownRenderer, TranslatePipe],
    }),
  ],
  argTypes: {
    chatId: {
      control: 'text',
      description: 'The chat ID used to scope streaming events to this specific chat session',
      table: { type: { summary: 'string' }, category: 'Primary Inputs' },
    },
  },
  parameters: {
    docs: {
      description: {
        component: `CometChatStreamMessageBubble renders a live-streaming AI response.

It subscribes to \`CometChatAIStreamingService.messageStream$\` and handles these event types:
- \`run_started\` — shows thinking indicator (animated dots)
- \`tool_call_start\` — shows tool execution text
- \`tool_call_end\` — hides tool execution indicator
- \`text_message_content\` — accumulates and renders streamed markdown text
- \`run_finished\` — component is removed by the parent

In Storybook, the streaming service won't emit events, so the component renders in its initial "thinking" state.`,
      },
    },
  },
};

export default meta;
type Story = StoryObj<CometChatStreamMessageBubble>;

// ── Stories ───────────────────────────────────────────────────────────────────

/**
 * Default — component mounted with a chat ID.
 * Shows the initial "thinking" state since no stream events are emitted in Storybook.
 */
export const Default: Story = {
  args: {
    chatId: 'ai-agent-uid',
  },
  parameters: {
    docs: {
      description: {
        story: 'Component mounted with a chatId. Shows the initial thinking state (animated dots) since no stream events are emitted in Storybook.',
      },
    },
  },
};

/**
 * Thinking state preview — static HTML showing the animated dots indicator.
 */
export const ThinkingState: Story = {
  render: () => ({
    template: `
      <div style="padding:16px;max-width:480px;">
        <p style="margin:0 0 8px;font-size:12px;color:#888;">Thinking state (animated dots):</p>
        <div style="
          display:inline-flex;
          align-items:center;
          gap:4px;
          padding:12px 16px;
          background:var(--cometchat-background-color-02, #f5f5f5);
          border-radius:var(--cometchat-radius-3, 12px);
        ">
          <span style="width:8px;height:8px;border-radius:50%;background:var(--cometchat-primary-color,#6852D6);animation:pulse 1s infinite 0s;display:inline-block;"></span>
          <span style="width:8px;height:8px;border-radius:50%;background:var(--cometchat-primary-color,#6852D6);animation:pulse 1s infinite 0.2s;display:inline-block;"></span>
          <span style="width:8px;height:8px;border-radius:50%;background:var(--cometchat-primary-color,#6852D6);animation:pulse 1s infinite 0.4s;display:inline-block;"></span>
        </div>
        <style>
          @keyframes pulse {
            0%, 100% { opacity: 0.3; transform: scale(0.8); }
            50% { opacity: 1; transform: scale(1); }
          }
        </style>
      </div>`,
    props: {},
  }),
  parameters: {
    docs: { description: { story: 'Static preview of the thinking state with animated pulsing dots.' } },
  },
};

/**
 * Streaming content preview — static HTML showing partial markdown being rendered.
 */
export const StreamingContent: Story = {
  render: () => ({
    template: `
      <div style="padding:16px;max-width:480px;">
        <p style="margin:0 0 8px;font-size:12px;color:#888;">Streaming content state:</p>
        <cometchat-markdown-renderer
          [text]="text"
          [streaming]="true">
        </cometchat-markdown-renderer>
      </div>`,
    props: {
      text: 'Here is how to get started with CometChat:\n\n1. Install the SDK\n2. Initialize with your App ID\n3. Login a user\n\n```typescript\nawait CometChat.init(appId, settings);\n```\n\nMore details coming...',
    },
  }),
  parameters: {
    docs: { description: { story: 'Static preview showing partial markdown content as it would appear mid-stream.' } },
  },
};

/**
 * Tool execution state preview.
 */
export const ToolExecutionState: Story = {
  render: () => ({
    template: `
      <div style="padding:16px;max-width:480px;">
        <p style="margin:0 0 8px;font-size:12px;color:#888;">Tool execution state:</p>
        <div style="
          display:flex;
          align-items:center;
          gap:8px;
          padding:12px 16px;
          background:var(--cometchat-background-color-02, #f5f5f5);
          border-radius:var(--cometchat-radius-3, 12px);
          font:var(--cometchat-font-body-regular, 14px/1.5 sans-serif);
          color:var(--cometchat-text-color-secondary, #666);
        ">
          <span>🔧</span>
          <span>Searching knowledge base...</span>
        </div>
      </div>`,
    props: {},
  }),
  parameters: {
    docs: { description: { story: 'Static preview of the tool execution state shown while the AI runs a tool.' } },
  },
};
