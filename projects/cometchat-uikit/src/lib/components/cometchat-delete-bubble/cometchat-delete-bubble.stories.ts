/**
 * CometChatDeleteBubble Storybook Stories
 *
 * Renders deleted message placeholders with sender/receiver styling variants.
 *
 * @module components/cometchat-delete-bubble
 */

import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CommonModule } from '@angular/common';
import { CometChatDeleteBubbleComponent } from './cometchat-delete-bubble.component';
import { within, expect } from '@storybook/test';

const meta: Meta<CometChatDeleteBubbleComponent> = {
  title: 'Components/Bubbles/Delete Bubble',
  component: CometChatDeleteBubbleComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [CommonModule],
    }),
  ],
  args: {
    isSentByMe: false,
    text: undefined,
  },
  argTypes: {
    isSentByMe: {
      control: 'boolean',
      description:
        'When true, applies sender (outgoing/primary color) styling. When false, applies receiver (incoming/neutral) styling.',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'Primary Inputs',
      },
    },
    text: {
      control: 'text',
      description:
        'Optional custom text to display instead of the default localized "This message was deleted" text.',
      table: {
        type: { summary: 'string | undefined' },
        defaultValue: { summary: 'undefined' },
        category: 'Primary Inputs',
      },
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          'CometChatDeleteBubble renders a deleted message placeholder with a delete icon and localized text. It is a purely presentational component — it does not accept a CometChat message object.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<CometChatDeleteBubbleComponent>;

// ── Stories ───────────────────────────────────────────────────────────────────

/** Default incoming (receiver) deleted message. */
export const Default: Story = {
  args: {
    isSentByMe: false,
  },
};

/** Incoming (receiver) deleted message — neutral styling. */
export const Incoming: Story = {
  args: {
    isSentByMe: false,
  },
  parameters: {
    docs: { description: { story: 'Deleted message placeholder for an incoming message (receiver / neutral styling).' } },
  },
};

/** Outgoing (sender) deleted message — primary color styling. */
export const Outgoing: Story = {
  args: {
    isSentByMe: true,
  },
  parameters: {
    docs: { description: { story: 'Deleted message placeholder for an outgoing message (sender / primary color styling).' } },
  },
};

/** Custom text override. */
export const CustomText: Story = {
  args: {
    isSentByMe: false,
    text: 'Message removed by admin',
  },
  parameters: {
    docs: { description: { story: 'Delete bubble with a custom text override instead of the default localized string.' } },
  },
};

/** Side-by-side sender and receiver variants. */
export const SenderAndReceiver: Story = {
  render: () => ({
    template: `
      <div style="display:flex;flex-direction:column;gap:8px;padding:16px;max-width:480px;">
        <div style="display:flex;justify-content:flex-end;">
          <cometchat-delete-bubble [isSentByMe]="true"></cometchat-delete-bubble>
        </div>
        <div style="display:flex;justify-content:flex-start;">
          <cometchat-delete-bubble [isSentByMe]="false"></cometchat-delete-bubble>
        </div>
      </div>`,
    props: {},
  }),
  parameters: {
    docs: { description: { story: 'Sender (outgoing) and receiver (incoming) delete bubbles shown side by side.' } },
  },
};

// ============================================
// Interaction Tests
// ============================================

/** Test: Default story renders delete bubble container */
export const TestDefaultRendersDeleteBubble: Story = {
  play: async ({ canvasElement }) => {
    await new Promise(r => setTimeout(r, 1000));
    const container = canvasElement.querySelector('.cometchat-delete-bubble');
    expect(container).not.toBeNull();
  },
};
