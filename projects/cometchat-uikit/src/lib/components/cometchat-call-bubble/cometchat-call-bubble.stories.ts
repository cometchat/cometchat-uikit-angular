/**
 * CometChatCallBubble Storybook Stories
 *
 * Renders call messages with call type icon, title, subtitle (duration/status),
 * and an optional action button. Supports sender/receiver styling variants.
 *
 * @module components/cometchat-call-bubble
 */

import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CommonModule } from '@angular/common';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatCallBubbleComponent } from './cometchat-call-bubble.component';
import { createMockCall, createMockUser, MOCK_AVATARS } from '../../../../../../.storybook/utils/mock-data';

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

function makeCall(
  type: string = CometChat.CALL_TYPE.AUDIO,
  status = 'ended',
  duration = 185,
  isOutgoing = true
): CometChat.Call {
  return createMockCall({
    type,
    status,
    duration,
    callInitiator: isOutgoing ? senderUser : receiverUser,
    callReceiver: isOutgoing ? receiverUser : senderUser,
    sentAt: Date.now() / 1000,
  });
}

// ── Meta ──────────────────────────────────────────────────────────────────────

const meta: Meta<CometChatCallBubbleComponent> = {
  title: 'Components/Bubbles/Call Bubble',
  component: CometChatCallBubbleComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [CommonModule],
    }),
  ],
  args: {
    message: makeCall(),
    alignment: 'right',
    disableInteraction: false,
  },
  argTypes: {
    message: {
      control: false,
      description: 'CometChat.Call message object',
      table: { type: { summary: 'CometChat.Call' }, category: 'Primary Inputs' },
    },
    alignment: {
      control: 'select',
      options: ['left', 'right'],
      description: 'Bubble alignment — left (incoming) or right (outgoing)',
      table: {
        type: { summary: "'left' | 'right'" },
        defaultValue: { summary: 'left' },
        category: 'Primary Inputs',
      },
    },
    iconUrl: {
      control: 'text',
      description: 'Optional custom icon URL override',
      table: { category: 'Overrides' },
    },
    title: {
      control: 'text',
      description: 'Optional custom title override',
      table: { category: 'Overrides' },
    },
    subtitle: {
      control: 'text',
      description: 'Optional custom subtitle override',
      table: { category: 'Overrides' },
    },
    buttonText: {
      control: 'text',
      description: 'Optional button text — when provided, the action button is shown',
      table: { category: 'Overrides' },
    },
    disableInteraction: {
      control: 'boolean',
      description: 'When true, disables all interactive elements',
      table: { defaultValue: { summary: 'false' }, category: 'Display Controls' },
    },
    buttonClick: { action: 'buttonClick', table: { category: 'Events' } },
  },
  parameters: {
    docs: {
      description: {
        component:
          'CometChatCallBubble renders call messages with call type icon, title, subtitle (duration/status), and an optional action button.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<CometChatCallBubbleComponent>;

// ── Stories ───────────────────────────────────────────────────────────────────

/** Default audio call — ended, outgoing. */
export const Default: Story = {
  args: {
    message: makeCall(CometChat.CALL_TYPE.AUDIO, 'ended', 185, true),
    alignment: 'right',
  },
};

/** Audio call — ended, outgoing. */
export const AudioCallEnded: Story = {
  args: {
    message: makeCall(CometChat.CALL_TYPE.AUDIO, 'ended', 185, true),
    alignment: 'right',
  },
  parameters: {
    docs: { description: { story: 'Outgoing audio call that ended after 3 minutes 5 seconds.' } },
  },
};

/** Video call — ended, outgoing. */
export const VideoCallEnded: Story = {
  args: {
    message: makeCall(CometChat.CALL_TYPE.VIDEO, 'ended', 320, true),
    alignment: 'right',
  },
  parameters: {
    docs: { description: { story: 'Outgoing video call that ended after 5 minutes 20 seconds.' } },
  },
};

/** Audio call — missed (unanswered), incoming. */
export const AudioCallMissed: Story = {
  args: {
    message: makeCall(CometChat.CALL_TYPE.AUDIO, 'unanswered', 0, false),
    alignment: 'left',
  },
  parameters: {
    docs: { description: { story: 'Incoming audio call that was missed (unanswered).' } },
  },
};

/** Video call — missed (unanswered), incoming. */
export const VideoCallMissed: Story = {
  args: {
    message: makeCall(CometChat.CALL_TYPE.VIDEO, 'unanswered', 0, false),
    alignment: 'left',
  },
  parameters: {
    docs: { description: { story: 'Incoming video call that was missed (unanswered).' } },
  },
};

/** Audio call — cancelled, outgoing. */
export const AudioCallCancelled: Story = {
  args: {
    message: makeCall(CometChat.CALL_TYPE.AUDIO, 'cancelled', 0, true),
    alignment: 'right',
  },
  parameters: {
    docs: { description: { story: 'Outgoing audio call that was cancelled before being answered.' } },
  },
};

/** Audio call — rejected, incoming. */
export const AudioCallRejected: Story = {
  args: {
    message: makeCall(CometChat.CALL_TYPE.AUDIO, 'rejected', 0, false),
    alignment: 'left',
  },
  parameters: {
    docs: { description: { story: 'Incoming audio call that was rejected.' } },
  },
};

/** Audio call with "Call Back" action button. */
export const WithCallBackButton: Story = {
  args: {
    message: makeCall(CometChat.CALL_TYPE.AUDIO, 'ended', 185, false),
    alignment: 'left',
    buttonText: 'Call Back',
  },
  parameters: {
    docs: { description: { story: 'Call bubble with an optional "Call Back" action button.' } },
  },
};

/** All call variants in one view. */
export const AllVariants: Story = {
  render: () => ({
    template: `
      <div style="display:flex;flex-direction:column;gap:8px;padding:16px;max-width:480px;">
        <p style="margin:0;font-size:12px;color:#888;">Audio — Ended (outgoing)</p>
        <cometchat-call-bubble [message]="audioEnded" alignment="right"></cometchat-call-bubble>
        <p style="margin:0;font-size:12px;color:#888;">Video — Ended (outgoing)</p>
        <cometchat-call-bubble [message]="videoEnded" alignment="right"></cometchat-call-bubble>
        <p style="margin:0;font-size:12px;color:#888;">Audio — Missed (incoming)</p>
        <cometchat-call-bubble [message]="audioMissed" alignment="left"></cometchat-call-bubble>
        <p style="margin:0;font-size:12px;color:#888;">Video — Missed (incoming)</p>
        <cometchat-call-bubble [message]="videoMissed" alignment="left"></cometchat-call-bubble>
        <p style="margin:0;font-size:12px;color:#888;">Audio — Cancelled (outgoing)</p>
        <cometchat-call-bubble [message]="audioCancelled" alignment="right"></cometchat-call-bubble>
      </div>`,
    props: {
      audioEnded: makeCall(CometChat.CALL_TYPE.AUDIO, 'ended', 185, true),
      videoEnded: makeCall(CometChat.CALL_TYPE.VIDEO, 'ended', 320, true),
      audioMissed: makeCall(CometChat.CALL_TYPE.AUDIO, 'unanswered', 0, false),
      videoMissed: makeCall(CometChat.CALL_TYPE.VIDEO, 'unanswered', 0, false),
      audioCancelled: makeCall(CometChat.CALL_TYPE.AUDIO, 'cancelled', 0, true),
    },
  }),
  parameters: {
    docs: { description: { story: 'All call bubble variants shown together.' } },
  },
};
