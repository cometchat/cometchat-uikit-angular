/**
 * CometChatAudioBubble Storybook Stories
 *
 * Renders audio attachments with waveform visualization, playback controls,
 * download functionality, and support for multiple audio attachments.
 *
 * @module components/cometchat-audio-bubble
 */

import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CommonModule } from '@angular/common';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatAudioBubbleComponent } from './cometchat-audio-bubble.component';
import { MessageBubbleAlignment } from '../../Enums/Enums';
import { createMockMessage, createMockUser, MOCK_AVATARS } from '../../../../../../.storybook/utils/mock-data';

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

function makeAudioMsg(isOutgoing = true): CometChat.MediaMessage {
  return createMockMessage('audio', {
    id: Math.floor(Math.random() * 10000),
    url: '/audio/sample-audio.mp3',
    fileName: 'voice-note.mp3',
    sentAt: Date.now() / 1000,
    sender: isOutgoing ? senderUser : receiverUser,
  }) as CometChat.MediaMessage;
}

// ── Meta ──────────────────────────────────────────────────────────────────────

const meta: Meta<CometChatAudioBubbleComponent> = {
  title: 'Components/Bubbles/Audio Bubble',
  component: CometChatAudioBubbleComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [CommonModule],
    }),
  ],
  args: {
    message: makeAudioMsg(),
    alignment: MessageBubbleAlignment.right,
  },
  argTypes: {
    message: {
      control: false,
      description: 'CometChat.MediaMessage object containing audio attachment(s)',
      table: { type: { summary: 'CometChat.MediaMessage' }, category: 'Primary Inputs' },
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
    playStateChange: { action: 'playStateChange', table: { category: 'Events' } },
    downloadStart: { action: 'downloadStart', table: { category: 'Events' } },
    downloadComplete: { action: 'downloadComplete', table: { category: 'Events' } },
    downloadError: { action: 'downloadError', table: { category: 'Events' } },
    expandChange: { action: 'expandChange', table: { category: 'Events' } },
  },
  parameters: {
    docs: {
      description: {
        component:
          'CometChatAudioBubble renders audio attachments with waveform visualization, playback controls, download functionality, and support for multiple audio attachments.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<CometChatAudioBubbleComponent>;

// ── Stories ───────────────────────────────────────────────────────────────────

/** Default outgoing audio bubble. */
export const Default: Story = {
  args: {
    message: makeAudioMsg(),
    alignment: MessageBubbleAlignment.right,
  },
};

/** Outgoing (sender) audio bubble. */
export const Outgoing: Story = {
  args: {
    message: makeAudioMsg(true),
    alignment: MessageBubbleAlignment.right,
  },
  parameters: {
    docs: { description: { story: 'Outgoing audio bubble (sender / right alignment) with waveform and playback controls.' } },
  },
};

/** Incoming (receiver) audio bubble. */
export const Incoming: Story = {
  args: {
    message: makeAudioMsg(false),
    alignment: MessageBubbleAlignment.left,
  },
  parameters: {
    docs: { description: { story: 'Incoming audio bubble (receiver / left alignment) with waveform and playback controls.' } },
  },
};

/** Side-by-side outgoing and incoming preview. */
export const OutgoingAndIncoming: Story = {
  render: () => ({
    template: `
      <div style="display:flex;flex-direction:column;gap:8px;padding:16px;max-width:480px;">
        <cometchat-audio-bubble [message]="out" [alignment]="right"></cometchat-audio-bubble>
        <cometchat-audio-bubble [message]="inc" [alignment]="left"></cometchat-audio-bubble>
      </div>`,
    props: {
      right: MessageBubbleAlignment.right,
      left: MessageBubbleAlignment.left,
      out: makeAudioMsg(true),
      inc: makeAudioMsg(false),
    },
  }),
  parameters: {
    docs: { description: { story: 'Outgoing and incoming audio bubbles shown together.' } },
  },
};
