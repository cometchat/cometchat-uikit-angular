/**
 * CometChatAudiosBubble Storybook Stories
 *
 * Receive-side bubble for a (multi-)audio-file message introduced with the
 * "Multiple Attachments in a Single Message" feature (ENG-36752). Renders one
 * WhatsApp-style row per audio attachment: audio icon, play/pause button, a flat
 * position slider, current/total duration, and the file name. Voice notes are
 * handled separately by CometChatVoiceNoteBubble.
 *
 * @module components/cometchat-audios-bubble
 */

import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CommonModule } from '@angular/common';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatAudiosBubbleComponent } from './cometchat-audios-bubble.component';
import { MessageBubbleAlignment } from '../../Enums/Enums';
import { expect } from '@storybook/test';
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

/** Single audio-file message. */
function makeAudioMsg(isOutgoing = true, fileName = 'meeting-recording.mp3'): CometChat.MediaMessage {
  return createMockMessage('audio', {
    id: Math.floor(Math.random() * 10000),
    url: '/audio/sample-audio.mp3',
    fileName,
    sentAt: Date.now() / 1000,
    sender: isOutgoing ? senderUser : receiverUser,
  }) as CometChat.MediaMessage;
}

/** Message carrying several audio files in a single batch. */
function makeMultiAudioMsg(isOutgoing = true): CometChat.MediaMessage {
  const message = makeAudioMsg(isOutgoing);
  const names = ['intro.mp3', 'chapter-1.mp3', 'chapter-2.mp3'];
  message.setAttachments(
    names.map(
      name =>
        new CometChat.Attachment({
          extension: 'mp3',
          mimeType: 'audio/mpeg',
          name,
          size: 512000,
          url: '/audio/sample-audio.mp3',
        }),
    ),
  );
  return message;
}

// ── Meta ──────────────────────────────────────────────────────────────────────

const meta: Meta<CometChatAudiosBubbleComponent> = {
  title: 'Components/Bubbles/Audios Bubble (Multiple Attachments)',
  component: CometChatAudiosBubbleComponent,
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
      description: 'CometChat.MediaMessage containing one or more audio-file attachments',
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
  },
  parameters: {
    docs: {
      description: {
        component:
          'CometChatAudiosBubble renders audio-file attachments (one row each) with a play/pause button, a flat position slider, duration, and the file name. Rendered automatically for audio messages that are not tagged as a voice note (metadata.audioType === "voiceNote").',
      },
    },
  },
};

export default meta;
type Story = StoryObj<CometChatAudiosBubbleComponent>;

// ── Stories ───────────────────────────────────────────────────────────────────

/** Default outgoing single-audio bubble. */
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
    docs: { description: { story: 'Outgoing audio-file bubble (sender / right alignment).' } },
  },
};

/** Incoming (receiver) audio bubble. */
export const Incoming: Story = {
  args: {
    message: makeAudioMsg(false),
    alignment: MessageBubbleAlignment.left,
  },
  parameters: {
    docs: { description: { story: 'Incoming audio-file bubble (receiver / left alignment).' } },
  },
};

/** Several audio files sent in a single batch (one row each). */
export const MultipleAudios: Story = {
  args: {
    message: makeMultiAudioMsg(true),
    alignment: MessageBubbleAlignment.right,
  },
  parameters: {
    docs: {
      description: {
        story: 'A single message carrying multiple audio files — each file renders as its own row within the bubble.',
      },
    },
  },
};

/** Side-by-side outgoing and incoming preview. */
export const OutgoingAndIncoming: Story = {
  render: () => ({
    template: `
      <div style="display:flex;flex-direction:column;gap:8px;padding:16px;max-width:480px;">
        <cometchat-audios-bubble [message]="out" [alignment]="right"></cometchat-audios-bubble>
        <cometchat-audios-bubble [message]="inc" [alignment]="left"></cometchat-audios-bubble>
      </div>`,
    props: {
      right: MessageBubbleAlignment.right,
      left: MessageBubbleAlignment.left,
      out: makeAudioMsg(true),
      inc: makeAudioMsg(false),
    },
  }),
  parameters: {
    docs: { description: { story: 'Outgoing and incoming audio-file bubbles shown together.' } },
  },
};

// ============================================
// Interaction Tests
// ============================================

/** Test: Default story renders the audios-bubble container. */
export const TestDefaultRendersAudiosBubble: Story = {
  play: async ({ canvasElement }) => {
    await new Promise(r => setTimeout(r, 500));
    const container = canvasElement.querySelector('.cometchat-audios-bubble');
    expect(container).not.toBeNull();
  },
};
