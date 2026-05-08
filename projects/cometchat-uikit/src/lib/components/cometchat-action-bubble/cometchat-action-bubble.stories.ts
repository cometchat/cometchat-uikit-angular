/**
 * CometChatActionBubble Storybook Stories
 *
 * Renders action/system messages like "User joined the group" with a centered,
 * pill-shaped appearance. Optionally shows an icon for call status messages.
 *
 * @module components/cometchat-action-bubble
 */

import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CommonModule } from '@angular/common';
import { CometChatActionBubbleComponent } from './cometchat-action-bubble.component';

const meta: Meta<CometChatActionBubbleComponent> = {
  title: 'Components/Bubbles/Action Bubble',
  component: CometChatActionBubbleComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [CommonModule],
    }),
  ],
  args: {
    messageText: 'Jane Smith joined the group',
    iconUrl: '',
    iconErrorColor: false,
  },
  argTypes: {
    messageText: {
      control: 'text',
      description: 'The action/system message text to display. Empty or whitespace renders nothing.',
      table: { type: { summary: 'string' }, defaultValue: { summary: '' }, category: 'Primary Inputs' },
    },
    iconUrl: {
      control: 'text',
      description: 'Optional icon URL displayed before the message text (used for call status messages)',
      table: { type: { summary: 'string' }, defaultValue: { summary: '' }, category: 'Primary Inputs' },
    },
    iconErrorColor: {
      control: 'boolean',
      description: 'When true, renders the icon in error/red color (used for missed calls)',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' }, category: 'Primary Inputs' },
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          'CometChatActionBubble renders action/system messages (e.g. "User joined the group") with a centered, pill-shaped appearance. It is a purely presentational component that accepts plain text — not a CometChat message object.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<CometChatActionBubbleComponent>;

// ── Stories ───────────────────────────────────────────────────────────────────

/** Default action message. */
export const Default: Story = {
  args: {
    messageText: 'Jane Smith joined the group',
  },
};

/** Member joined action. */
export const MemberJoined: Story = {
  args: {
    messageText: 'Alice joined the group',
  },
  parameters: {
    docs: { description: { story: 'System message shown when a member joins a group.' } },
  },
};

/** Member left action. */
export const MemberLeft: Story = {
  args: {
    messageText: 'Bob left the group',
  },
  parameters: {
    docs: { description: { story: 'System message shown when a member leaves a group.' } },
  },
};

/** Group name changed action. */
export const GroupNameChanged: Story = {
  args: {
    messageText: 'Alice changed the group name to "Design Team"',
  },
  parameters: {
    docs: { description: { story: 'System message shown when the group name is changed.' } },
  },
};

/** Call status — outgoing audio call with icon. */
export const OutgoingAudioCall: Story = {
  args: {
    messageText: 'Outgoing Voice Call',
    iconUrl: 'assets/conversations_outgoing-voice-call.svg',
    iconErrorColor: false,
  },
  parameters: {
    docs: { description: { story: 'Action bubble with an icon for outgoing audio call status.' } },
  },
};

/** Call status — missed call with error icon color. */
export const MissedCall: Story = {
  args: {
    messageText: 'Missed Voice Call',
    iconUrl: 'assets/conversations_incoming-voice-call.svg',
    iconErrorColor: true,
  },
  parameters: {
    docs: { description: { story: 'Action bubble with error-colored icon for missed call status.' } },
  },
};

/** Empty message — renders nothing. */
export const EmptyMessage: Story = {
  args: {
    messageText: '',
  },
  parameters: {
    docs: { description: { story: 'When messageText is empty or whitespace, the component renders nothing.' } },
  },
};

/** Multiple action messages stacked. */
export const MultipleActions: Story = {
  render: () => ({
    template: `
      <div style="display:flex;flex-direction:column;gap:8px;padding:16px;align-items:center;">
        <cometchat-action-bubble [messageText]="msg1"></cometchat-action-bubble>
        <cometchat-action-bubble [messageText]="msg2"></cometchat-action-bubble>
        <cometchat-action-bubble [messageText]="msg3"></cometchat-action-bubble>
      </div>`,
    props: {
      msg1: 'Alice created the group',
      msg2: 'Bob joined the group',
      msg3: 'Alice changed the group name to "Project Alpha"',
    },
  }),
  parameters: {
    docs: { description: { story: 'Multiple action messages stacked vertically as they appear in a chat.' } },
  },
};
