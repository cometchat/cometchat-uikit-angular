/**
 * CometChatVoiceNoteBubble Storybook Stories
 *
 * Receive-side bubble for a recorded voice note, introduced with the
 * "Multiple Attachments in a Single Message" feature (ENG-36752). An audio
 * message tagged `metadata.audioType === 'voice_note'` is routed here instead of
 * to CometChatAudiosBubble; this component delegates to CometChatAudioBubble
 * (the waveform player). Voice notes are always standalone — never batched.
 *
 * @module components/cometchat-voice-note-bubble
 */

import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CommonModule } from '@angular/common';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatVoiceNoteBubbleComponent } from './cometchat-voice-note-bubble.component';
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

/**
 * Voice-note message: an audio message tagged with the canonical
 * `audioType: 'voice_note'` (CometChatUIKitConstants.AudioType.voiceNote), which
 * is what the composer's recorder stamps and what routes a message to this bubble.
 */
function makeVoiceNoteMsg(isOutgoing = true): CometChat.MediaMessage {
  const message = createMockMessage('audio', {
    id: Math.floor(Math.random() * 10000),
    url: '/audio/sample-audio.mp3',
    fileName: 'voice_message_1700000000.webm',
    fileExtension: 'webm',
    fileMimeType: 'audio/webm',
    sentAt: Date.now() / 1000,
    sender: isOutgoing ? senderUser : receiverUser,
  }) as CometChat.MediaMessage;
  message.setMetadata({ audioType: 'voice_note' });
  return message;
}

// ── Meta ──────────────────────────────────────────────────────────────────────

const meta: Meta<CometChatVoiceNoteBubbleComponent> = {
  title: 'Components/Bubbles/Voice Note Bubble',
  component: CometChatVoiceNoteBubbleComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [CommonModule],
    }),
  ],
  args: {
    message: makeVoiceNoteMsg(),
    alignment: MessageBubbleAlignment.right,
  },
  argTypes: {
    message: {
      control: false,
      description: 'CometChat.MediaMessage (audio) tagged with metadata.audioType === "voice_note"',
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
          'CometChatVoiceNoteBubble renders a recorded voice note by delegating to CometChatAudioBubble (the waveform player). It is chosen over CometChatAudiosBubble when an audio message carries `metadata.audioType === "voice_note"` (legacy value `"voiceNote"` also accepted). Voice notes are always standalone — never batched.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<CometChatVoiceNoteBubbleComponent>;

// ── Stories ───────────────────────────────────────────────────────────────────

/** Default outgoing voice note. */
export const Default: Story = {
  args: {
    message: makeVoiceNoteMsg(),
    alignment: MessageBubbleAlignment.right,
  },
};

/** Outgoing (sender) voice note. */
export const Outgoing: Story = {
  args: {
    message: makeVoiceNoteMsg(true),
    alignment: MessageBubbleAlignment.right,
  },
  parameters: {
    docs: { description: { story: 'Outgoing voice note (sender / right alignment).' } },
  },
};

/** Incoming (receiver) voice note. */
export const Incoming: Story = {
  args: {
    message: makeVoiceNoteMsg(false),
    alignment: MessageBubbleAlignment.left,
  },
  parameters: {
    docs: { description: { story: 'Incoming voice note (receiver / left alignment).' } },
  },
};

/** Side-by-side outgoing and incoming preview. */
export const OutgoingAndIncoming: Story = {
  render: () => ({
    template: `
      <div style="display:flex;flex-direction:column;gap:8px;padding:16px;max-width:480px;">
        <cometchat-voice-note-bubble [message]="out" [alignment]="right"></cometchat-voice-note-bubble>
        <cometchat-voice-note-bubble [message]="inc" [alignment]="left"></cometchat-voice-note-bubble>
      </div>`,
    props: {
      right: MessageBubbleAlignment.right,
      left: MessageBubbleAlignment.left,
      out: makeVoiceNoteMsg(true),
      inc: makeVoiceNoteMsg(false),
    },
  }),
  parameters: {
    docs: { description: { story: 'Outgoing and incoming voice notes shown together.' } },
  },
};

// ============================================
// Interaction Tests
// ============================================

/** Test: Default story renders the voice-note-bubble and delegates to the audio bubble. */
export const TestDefaultRendersVoiceNoteBubble: Story = {
  play: async ({ canvasElement }) => {
    await new Promise(r => setTimeout(r, 500));
    const host = canvasElement.querySelector('cometchat-voice-note-bubble');
    expect(host).not.toBeNull();
    // Delegates to the audio bubble (waveform player).
    expect(canvasElement.querySelector('cometchat-audio-bubble')).not.toBeNull();
  },
};
