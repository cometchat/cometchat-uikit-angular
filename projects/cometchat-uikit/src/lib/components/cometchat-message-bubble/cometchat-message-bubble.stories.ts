/**
 * CometChatMessageBubble Storybook Stories
 *
 * All message types rendered inside the message bubble wrapper,
 * showing both sender (outgoing / right) and receiver (incoming / left) variants.
 *
 * @module components/cometchat-message-bubble
 */

import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CommonModule } from '@angular/common';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatMessageBubbleComponent } from './cometchat-message-bubble.component';
import { CometChatUIKit } from '../../cometchat-uikit';
import { MessageBubbleAlignment } from '../../Enums/Enums';
import {
  createMockUser,
  createMockGroup,
  createMockMessage,
  createMockCall,
  createMockActionMessage,
  createMockStickerMessage,
  createMockPollMessage,
  createMockDocumentMessage,
  createMockWhiteboardMessage,
  createMockDeletedMessage,
  MOCK_AVATARS,
} from '../../../../../../.storybook/utils/mock-data';

// ============================================
// Mock Helpers
// ============================================

const senderUser = createMockUser({
  uid: 'user-john-doe',
  name: 'John Doe',
  avatar: MOCK_AVATARS.andrewJoseph,
  status: CometChat.USER_STATUS.ONLINE,
});

const receiverUser = createMockUser({
  uid: 'user-jane-smith',
  name: 'Jane Smith',
  status: CometChat.USER_STATUS.ONLINE,
});

// Mock CometChatUIKit.getLoggedInUser() so the component's isOutgoing check works.
// Without this, loggedInUser is null and ALL calls appear as incoming.
CometChatUIKit.getLoggedInUser = () => senderUser;

const mockGroup = createMockGroup({
  guid: 'group-design-team',
  name: 'Design Team',
  membersCount: 12,
  type: CometChat.GROUP_TYPE.PUBLIC,
});

// --- Message factory helpers ---

function createTextMsg(text: string, isOutgoing = true): CometChat.BaseMessage {
  return createMockMessage('text', {
    id: Math.floor(Math.random() * 10000),
    text,
    sentAt: Date.now() / 1000,
    sender: isOutgoing ? senderUser : receiverUser,
    deliveredAt: Date.now() / 1000,
    readAt: isOutgoing ? Date.now() / 1000 : undefined,
  });
}

function createImageMsg(isOutgoing = true): CometChat.BaseMessage {
  return createMockMessage('image', {
    id: Math.floor(Math.random() * 10000),
    url: 'https://assets.cometchat.io/sampleapp/v2/users/cometchat-uid-2.webp',
    fileName: 'sample-image.jpg',
    sentAt: Date.now() / 1000,
    sender: isOutgoing ? senderUser : receiverUser,
    deliveredAt: Date.now() / 1000,
  });
}

function createFileMsg(isOutgoing = true): CometChat.BaseMessage {
  return createMockMessage('file', {
    id: Math.floor(Math.random() * 10000),
    url: 'https://example.com/document.pdf',
    fileName: 'project-report.pdf',
    fileExtension: 'pdf',
    fileSize: 2048000,
    fileMimeType: 'application/pdf',
    sentAt: Date.now() / 1000,
    sender: isOutgoing ? senderUser : receiverUser,
    deliveredAt: Date.now() / 1000,
  });
}

function createAudioMsg(isOutgoing = true): CometChat.BaseMessage {
  return createMockMessage('audio', {
    id: Math.floor(Math.random() * 10000),
    url: '/assets/sample-audio.wav',
    fileName: 'voice-note.mp3',
    sentAt: Date.now() / 1000,
    sender: isOutgoing ? senderUser : receiverUser,
    deliveredAt: Date.now() / 1000,
  });
}

function createVideoMsg(isOutgoing = true): CometChat.BaseMessage {
  const msg = createMockMessage('video', {
    id: Math.floor(Math.random() * 10000),
    url: '/assets/sample-video.mp4',
    fileName: 'recording.mp4',
    sentAt: Date.now() / 1000,
    sender: isOutgoing ? senderUser : receiverUser,
    deliveredAt: Date.now() / 1000,
  });
  // Set thumbnail on the attachment so the video bubble shows a proper poster
  const attachments = (msg as any).getAttachments?.();
  if (attachments?.[0]) {
    (attachments[0] as any).thumbnail = '/assets/sample-video-thumbnail.svg';
  }
  return msg;
}

function createPollMsg(isOutgoing = true): CometChat.BaseMessage {
  return createMockPollMessage({
    id: Math.floor(Math.random() * 10000),
    sentAt: Date.now() / 1000,
    sender: isOutgoing ? senderUser : receiverUser,
  }) as unknown as CometChat.BaseMessage;
}

function createStickerMsg(isOutgoing = true): CometChat.BaseMessage {
  return createMockStickerMessage({
    id: Math.floor(Math.random() * 10000),
    stickerUrl: 'https://data-in.cc-cluster-2.io/stickers/bear/bear_6.png',
    stickerName: 'Bear Sticker',
    sentAt: Date.now() / 1000,
    sender: isOutgoing ? senderUser : receiverUser,
  }) as unknown as CometChat.BaseMessage;
}

function createDocumentMsg(isOutgoing = true): CometChat.BaseMessage {
  return createMockDocumentMessage({
    id: Math.floor(Math.random() * 10000),
    sentAt: Date.now() / 1000,
    sender: isOutgoing ? senderUser : receiverUser,
  }) as unknown as CometChat.BaseMessage;
}

function createWhiteboardMsg(isOutgoing = true): CometChat.BaseMessage {
  return createMockWhiteboardMessage({
    id: Math.floor(Math.random() * 10000),
    sentAt: Date.now() / 1000,
    sender: isOutgoing ? senderUser : receiverUser,
  }) as unknown as CometChat.BaseMessage;
}

function createActionMsg(): CometChat.BaseMessage {
  return createMockActionMessage({
    id: Math.floor(Math.random() * 10000),
    message: 'Jane Smith joined the group',
    sender: receiverUser,
    sentAt: Date.now() / 1000,
  }) as unknown as CometChat.BaseMessage;
}

function createDeletedMsg(isOutgoing = true): CometChat.BaseMessage {
  return createMockDeletedMessage({
    id: Math.floor(Math.random() * 10000),
    sentAt: Date.now() / 1000,
    sender: isOutgoing ? senderUser : receiverUser,
  });
}

function createCallMsg(
  type: string = CometChat.CALL_TYPE.AUDIO,
  status = 'ended',
  duration = 185,
  isOutgoing = true,
): CometChat.BaseMessage {
  return createMockCall({
    type,
    status,
    duration,
    callInitiator: isOutgoing ? senderUser : receiverUser,
    callReceiver: isOutgoing ? receiverUser : senderUser,
    sentAt: Date.now() / 1000,
  }) as unknown as CometChat.BaseMessage;
}

// ============================================
// Meta Configuration
// ============================================

const meta: Meta<CometChatMessageBubbleComponent> = {
  title: 'Components/Bubbles/Message Bubble',
  component: CometChatMessageBubbleComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [CommonModule],
    }),
  ],
  args: {
    message: createTextMsg('Hello! This is a sample text message.'),
    alignment: MessageBubbleAlignment.right,
    disableInteraction: true,
  },
  argTypes: {
    message: {
      control: false,
      description: 'CometChat message object — determines the bubble content type',
      table: { type: { summary: 'CometChat.BaseMessage' }, category: 'Primary Inputs' },
    },
    alignment: {
      control: 'select',
      options: ['left', 'right', 'center'],
      mapping: {
        left: MessageBubbleAlignment.left,
        right: MessageBubbleAlignment.right,
        center: MessageBubbleAlignment.center,
      },
      description: 'Bubble alignment — left (incoming), right (outgoing), center (action)',
      table: {
        type: { summary: 'MessageBubbleAlignment' },
        defaultValue: { summary: 'right' },
        category: 'Primary Inputs',
      },
    },
    group: {
      control: false,
      description: 'Group context — enables avatar and sender name for group conversations',
      table: { type: { summary: 'CometChat.Group | null' }, defaultValue: { summary: 'null' }, category: 'Primary Inputs' },
    },
    disableInteraction: { control: 'boolean', table: { category: 'Display Controls' } },
    hideAvatar: { control: 'boolean', table: { category: 'Display Controls' } },
    hideSenderName: { control: 'boolean', table: { category: 'Display Controls' } },
    hideReceipts: { control: 'boolean', table: { category: 'Display Controls' } },
    hideTimestamp: { control: 'boolean', table: { category: 'Display Controls' } },
    showError: { control: 'boolean', table: { category: 'Display Controls' } },
    optionClick: { action: 'optionClick', table: { category: 'Events' } },
    replyPreviewClick: { action: 'replyPreviewClick', table: { category: 'Events' } },
    avatarClick: { action: 'avatarClick', table: { category: 'Events' } },
    threadRepliesClick: { action: 'threadRepliesClick', table: { category: 'Events' } },
    reactionClick: { action: 'reactionClick', table: { category: 'Events' } },
  },
  parameters: {
    docs: {
      description: {
        component:
          'CometChatMessageBubble renders all message types (text, image, file, audio, video, poll, sticker, document, whiteboard, action, deleted, call) with sender/receiver alignment, context menu, status indicators, reactions, and thread views.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<CometChatMessageBubbleComponent>;


// ============================================
// Shared template helpers for sender/receiver pair
// ============================================

const LABEL_STYLE = 'margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);';
const BUBBLE_STYLE = 'display:block;width:100%;';

// ============================================
// Individual Stories — each type, sender + receiver
// ============================================

/** Default text message bubble (outgoing). */
export const Default: Story = {
  args: {
    message: createTextMsg('Hello! This is a sample text message.'),
    alignment: MessageBubbleAlignment.right,
  },
};

// --- Text ---

/** Text message — sender & receiver in one preview. */
export const Text: Story = {
  render: () => ({
    template: `
      <div style="display:flex;flex-direction:column;gap:var(--cometchat-spacing-1);background:transparent;border-radius:var(--cometchat-radius-3);padding:var(--cometchat-spacing-3);width:580px;">
        <cometchat-message-bubble style="${BUBBLE_STYLE}" [disableInteraction]="true" [message]="out" [alignment]="right"></cometchat-message-bubble>
        <cometchat-message-bubble style="${BUBBLE_STYLE}" [disableInteraction]="true" [message]="inc" [alignment]="left" [group]="group"></cometchat-message-bubble>
      </div>`,
    props: {
      right: MessageBubbleAlignment.right, left: MessageBubbleAlignment.left, group: mockGroup,
      out: createTextMsg('Hey there! How is the project going? 🎨'),
      inc: createTextMsg('Looks great! I will review the PR this afternoon. 👍', false),
    },
  }),
  parameters: { docs: { description: { story: 'Text bubble — outgoing (sender) and incoming (receiver) in one view.' } } },
};

// --- Image ---

/** Image message — sender & receiver in one preview. */
export const Image: Story = {
  render: () => ({
    template: `
      <div style="display:flex;flex-direction:column;gap:var(--cometchat-spacing-1);background:transparent;border-radius:var(--cometchat-radius-3);padding:var(--cometchat-spacing-3);width:580px;">
        <cometchat-message-bubble style="${BUBBLE_STYLE}" [disableInteraction]="true" [message]="out" [alignment]="right"></cometchat-message-bubble>
        <cometchat-message-bubble style="${BUBBLE_STYLE}" [disableInteraction]="true" [message]="inc" [alignment]="left" [group]="group"></cometchat-message-bubble>
      </div>`,
    props: {
      right: MessageBubbleAlignment.right, left: MessageBubbleAlignment.left, group: mockGroup,
      out: createImageMsg(true), inc: createImageMsg(false),
    },
  }),
  parameters: { docs: { description: { story: 'Image bubble — outgoing and incoming in one view.' } } },
};

// --- File ---

/** File message — sender & receiver in one preview. */
export const File: Story = {
  render: () => ({
    template: `
      <div style="display:flex;flex-direction:column;gap:var(--cometchat-spacing-1);background:transparent;border-radius:var(--cometchat-radius-3);padding:var(--cometchat-spacing-3);width:580px;">
        <cometchat-message-bubble style="${BUBBLE_STYLE}" [disableInteraction]="true" [message]="out" [alignment]="right"></cometchat-message-bubble>
        <cometchat-message-bubble style="${BUBBLE_STYLE}" [disableInteraction]="true" [message]="inc" [alignment]="left" [group]="group"></cometchat-message-bubble>
      </div>`,
    props: {
      right: MessageBubbleAlignment.right, left: MessageBubbleAlignment.left, group: mockGroup,
      out: createFileMsg(true), inc: createFileMsg(false),
    },
  }),
  parameters: { docs: { description: { story: 'File bubble — outgoing and incoming in one view.' } } },
};

// --- Audio ---

/** Audio message — sender & receiver in one preview. */
export const Audio: Story = {
  render: () => ({
    template: `
      <div style="display:flex;flex-direction:column;gap:var(--cometchat-spacing-1);background:transparent;border-radius:var(--cometchat-radius-3);padding:var(--cometchat-spacing-3);width:580px;">
        <cometchat-message-bubble style="${BUBBLE_STYLE}" [disableInteraction]="true" [message]="out" [alignment]="right"></cometchat-message-bubble>
        <cometchat-message-bubble style="${BUBBLE_STYLE}" [disableInteraction]="true" [message]="inc" [alignment]="left" [group]="group"></cometchat-message-bubble>
      </div>`,
    props: {
      right: MessageBubbleAlignment.right, left: MessageBubbleAlignment.left, group: mockGroup,
      out: createAudioMsg(true), inc: createAudioMsg(false),
    },
  }),
  parameters: { docs: { description: { story: 'Audio bubble — outgoing and incoming in one view.' } } },
};

// --- Video ---

/** Video message — sender & receiver in one preview. */
export const Video: Story = {
  render: () => ({
    template: `
      <div style="display:flex;flex-direction:column;gap:var(--cometchat-spacing-1);background:transparent;border-radius:var(--cometchat-radius-3);padding:var(--cometchat-spacing-3);width:580px;">
        <cometchat-message-bubble style="${BUBBLE_STYLE}" [disableInteraction]="true" [message]="out" [alignment]="right"></cometchat-message-bubble>
        <cometchat-message-bubble style="${BUBBLE_STYLE}" [disableInteraction]="true" [message]="inc" [alignment]="left" [group]="group"></cometchat-message-bubble>
      </div>`,
    props: {
      right: MessageBubbleAlignment.right, left: MessageBubbleAlignment.left, group: mockGroup,
      out: createVideoMsg(true), inc: createVideoMsg(false),
    },
  }),
  parameters: { docs: { description: { story: 'Video bubble — outgoing and incoming in one view.' } } },
};

// --- Poll ---

/** Poll message — sender & receiver in one preview. */
export const Poll: Story = {
  render: () => ({
    template: `
      <div style="display:flex;flex-direction:column;gap:var(--cometchat-spacing-1);background:transparent;border-radius:var(--cometchat-radius-3);padding:var(--cometchat-spacing-3);width:580px;">
        <cometchat-message-bubble style="${BUBBLE_STYLE}" [disableInteraction]="true" [message]="out" [alignment]="right"></cometchat-message-bubble>
        <cometchat-message-bubble style="${BUBBLE_STYLE}" [disableInteraction]="true" [message]="inc" [alignment]="left" [group]="group"></cometchat-message-bubble>
      </div>`,
    props: {
      right: MessageBubbleAlignment.right, left: MessageBubbleAlignment.left, group: mockGroup,
      out: createPollMsg(true), inc: createPollMsg(false),
    },
  }),
  parameters: { docs: { description: { story: 'Poll bubble — outgoing and incoming in one view.' } } },
};

// --- Sticker ---

/** Sticker message — sender & receiver in one preview. */
export const Sticker: Story = {
  render: () => ({
    template: `
      <div style="display:flex;flex-direction:column;gap:var(--cometchat-spacing-1);background:transparent;border-radius:var(--cometchat-radius-3);padding:var(--cometchat-spacing-3);width:580px;">
        <cometchat-message-bubble style="${BUBBLE_STYLE}" [disableInteraction]="true" [message]="out" [alignment]="right"></cometchat-message-bubble>
        <cometchat-message-bubble style="${BUBBLE_STYLE}" [disableInteraction]="true" [message]="inc" [alignment]="left" [group]="group"></cometchat-message-bubble>
      </div>`,
    props: {
      right: MessageBubbleAlignment.right, left: MessageBubbleAlignment.left, group: mockGroup,
      out: createStickerMsg(true), inc: createStickerMsg(false),
    },
  }),
  parameters: { docs: { description: { story: 'Sticker bubble — outgoing and incoming in one view.' } } },
};

// --- Collaborative Document ---

/** Collaborative document — sender & receiver in one preview. */
export const CollaborativeDocument: Story = {
  render: () => ({
    template: `
      <div style="display:flex;flex-direction:column;gap:var(--cometchat-spacing-1);background:transparent;border-radius:var(--cometchat-radius-3);padding:var(--cometchat-spacing-3);width:580px;">
        <cometchat-message-bubble style="${BUBBLE_STYLE}" [disableInteraction]="true" [message]="out" [alignment]="right"></cometchat-message-bubble>
        <cometchat-message-bubble style="${BUBBLE_STYLE}" [disableInteraction]="true" [message]="inc" [alignment]="left" [group]="group"></cometchat-message-bubble>
      </div>`,
    props: {
      right: MessageBubbleAlignment.right, left: MessageBubbleAlignment.left, group: mockGroup,
      out: createDocumentMsg(true), inc: createDocumentMsg(false),
    },
  }),
  parameters: { docs: { description: { story: 'Collaborative document bubble — outgoing and incoming in one view.' } } },
};

// --- Collaborative Whiteboard ---

/** Collaborative whiteboard — sender & receiver in one preview. */
export const CollaborativeWhiteboard: Story = {
  render: () => ({
    template: `
      <div style="display:flex;flex-direction:column;gap:var(--cometchat-spacing-1);background:transparent;border-radius:var(--cometchat-radius-3);padding:var(--cometchat-spacing-3);width:580px;">
        <cometchat-message-bubble style="${BUBBLE_STYLE}" [disableInteraction]="true" [message]="out" [alignment]="right"></cometchat-message-bubble>
        <cometchat-message-bubble style="${BUBBLE_STYLE}" [disableInteraction]="true" [message]="inc" [alignment]="left" [group]="group"></cometchat-message-bubble>
      </div>`,
    props: {
      right: MessageBubbleAlignment.right, left: MessageBubbleAlignment.left, group: mockGroup,
      out: createWhiteboardMsg(true), inc: createWhiteboardMsg(false),
    },
  }),
  parameters: { docs: { description: { story: 'Collaborative whiteboard bubble — outgoing and incoming in one view.' } } },
};

// --- Deleted ---

/** Deleted message — sender & receiver in one preview. */
export const Deleted: Story = {
  render: () => ({
    template: `
      <div style="display:flex;flex-direction:column;gap:var(--cometchat-spacing-1);background:transparent;border-radius:var(--cometchat-radius-3);padding:var(--cometchat-spacing-3);width:580px;">
        <cometchat-message-bubble style="${BUBBLE_STYLE}" [disableInteraction]="true" [message]="out" [alignment]="right"></cometchat-message-bubble>
        <cometchat-message-bubble style="${BUBBLE_STYLE}" [disableInteraction]="true" [message]="inc" [alignment]="left" [group]="group"></cometchat-message-bubble>
      </div>`,
    props: {
      right: MessageBubbleAlignment.right, left: MessageBubbleAlignment.left, group: mockGroup,
      out: createDeletedMsg(true), inc: createDeletedMsg(false),
    },
  }),
  parameters: { docs: { description: { story: 'Deleted bubble — outgoing and incoming in one view.' } } },
};

// --- Action ---

/** Action message (e.g. member joined) — always centered. */
export const ActionMessage: Story = {
  args: { message: createActionMsg(), alignment: MessageBubbleAlignment.center },
};

// --- Call variants ---

/** Audio call — ended (outgoing). */
export const CallAudioEnded: Story = {
  args: { message: createCallMsg(CometChat.CALL_TYPE.AUDIO, 'ended', 185, true), alignment: MessageBubbleAlignment.center },
};

/** Video call — ended (outgoing). */
export const CallVideoEnded: Story = {
  args: { message: createCallMsg(CometChat.CALL_TYPE.VIDEO, 'ended', 320, true), alignment: MessageBubbleAlignment.center },
};

/** Audio call — missed (incoming unanswered). */
export const CallAudioMissed: Story = {
  args: { message: createCallMsg(CometChat.CALL_TYPE.AUDIO, 'unanswered', 0, false), alignment: MessageBubbleAlignment.center },
};

/** Video call — missed (incoming unanswered). */
export const CallVideoMissed: Story = {
  args: { message: createCallMsg(CometChat.CALL_TYPE.VIDEO, 'unanswered', 0, false), alignment: MessageBubbleAlignment.center },
};

/** Audio call — cancelled (outgoing). */
export const CallAudioCancelled: Story = {
  args: { message: createCallMsg(CometChat.CALL_TYPE.AUDIO, 'cancelled', 0, true), alignment: MessageBubbleAlignment.center },
};

/** Video call — rejected (outgoing). */
export const CallVideoRejected: Story = {
  args: { message: createCallMsg(CometChat.CALL_TYPE.VIDEO, 'rejected', 0, true), alignment: MessageBubbleAlignment.center },
};

/** Audio call — busy (outgoing). */
export const CallAudioBusy: Story = {
  args: { message: createCallMsg(CometChat.CALL_TYPE.AUDIO, 'busy', 0, true), alignment: MessageBubbleAlignment.center },
};

/** Audio call — initiated (outgoing, ringing). */
export const CallAudioInitiated: Story = {
  args: { message: createCallMsg(CometChat.CALL_TYPE.AUDIO, 'initiated', 0, true), alignment: MessageBubbleAlignment.center },
};


// ============================================
// Showcase — all variants in one view
// ============================================

/** Comprehensive showcase — every message type with sender + receiver in a single preview block per type. */
export const AllVariantsShowcase: Story = {
  render: () => ({
    template: `
      <div style="display:flex;flex-direction:column;gap:var(--cometchat-spacing-5);padding:var(--cometchat-spacing-5);max-width:560px;margin:0 auto;">

        <h3 style="margin:0;font:var(--cometchat-font-heading3-bold);color:var(--cometchat-text-color-primary);">All Message Bubble Variants</h3>

        <!-- Text -->
        <div style="display:flex;flex-direction:column;gap:var(--cometchat-spacing-2);">
          <p style="${LABEL_STYLE}">Text</p>
          <div style="display:flex;flex-direction:column;gap:var(--cometchat-spacing-1);background:transparent;border-radius:var(--cometchat-radius-3);padding:var(--cometchat-spacing-3);">
            <cometchat-message-bubble style="${BUBBLE_STYLE}" [disableInteraction]="true" [message]="textOut" [alignment]="right"></cometchat-message-bubble>
            <cometchat-message-bubble style="${BUBBLE_STYLE}" [disableInteraction]="true" [message]="textIn" [alignment]="left" [group]="group"></cometchat-message-bubble>
          </div>
        </div>

        <!-- Image -->
        <div style="display:flex;flex-direction:column;gap:var(--cometchat-spacing-2);">
          <p style="${LABEL_STYLE}">Image</p>
          <div style="display:flex;flex-direction:column;gap:var(--cometchat-spacing-1);background:transparent;border-radius:var(--cometchat-radius-3);padding:var(--cometchat-spacing-3);">
            <cometchat-message-bubble style="${BUBBLE_STYLE}" [disableInteraction]="true" [message]="imgOut" [alignment]="right"></cometchat-message-bubble>
            <cometchat-message-bubble style="${BUBBLE_STYLE}" [disableInteraction]="true" [message]="imgIn" [alignment]="left" [group]="group"></cometchat-message-bubble>
          </div>
        </div>

        <!-- File -->
        <div style="display:flex;flex-direction:column;gap:var(--cometchat-spacing-2);">
          <p style="${LABEL_STYLE}">File</p>
          <div style="display:flex;flex-direction:column;gap:var(--cometchat-spacing-1);background:transparent;border-radius:var(--cometchat-radius-3);padding:var(--cometchat-spacing-3);">
            <cometchat-message-bubble style="${BUBBLE_STYLE}" [disableInteraction]="true" [message]="fileOut" [alignment]="right"></cometchat-message-bubble>
            <cometchat-message-bubble style="${BUBBLE_STYLE}" [disableInteraction]="true" [message]="fileIn" [alignment]="left" [group]="group"></cometchat-message-bubble>
          </div>
        </div>

        <!-- Audio -->
        <div style="display:flex;flex-direction:column;gap:var(--cometchat-spacing-2);">
          <p style="${LABEL_STYLE}">Audio</p>
          <div style="display:flex;flex-direction:column;gap:var(--cometchat-spacing-1);background:transparent;border-radius:var(--cometchat-radius-3);padding:var(--cometchat-spacing-3);">
            <cometchat-message-bubble style="${BUBBLE_STYLE}" [disableInteraction]="true" [message]="audioOut" [alignment]="right"></cometchat-message-bubble>
            <cometchat-message-bubble style="${BUBBLE_STYLE}" [disableInteraction]="true" [message]="audioIn" [alignment]="left" [group]="group"></cometchat-message-bubble>
          </div>
        </div>

        <!-- Video -->
        <div style="display:flex;flex-direction:column;gap:var(--cometchat-spacing-2);">
          <p style="${LABEL_STYLE}">Video</p>
          <div style="display:flex;flex-direction:column;gap:var(--cometchat-spacing-1);background:transparent;border-radius:var(--cometchat-radius-3);padding:var(--cometchat-spacing-3);">
            <cometchat-message-bubble style="${BUBBLE_STYLE}" [disableInteraction]="true" [message]="videoOut" [alignment]="right"></cometchat-message-bubble>
            <cometchat-message-bubble style="${BUBBLE_STYLE}" [disableInteraction]="true" [message]="videoIn" [alignment]="left" [group]="group"></cometchat-message-bubble>
          </div>
        </div>

        <!-- Poll -->
        <div style="display:flex;flex-direction:column;gap:var(--cometchat-spacing-2);">
          <p style="${LABEL_STYLE}">Poll</p>
          <div style="display:flex;flex-direction:column;gap:var(--cometchat-spacing-1);background:transparent;border-radius:var(--cometchat-radius-3);padding:var(--cometchat-spacing-3);">
            <cometchat-message-bubble style="${BUBBLE_STYLE}" [disableInteraction]="true" [message]="pollOut" [alignment]="right"></cometchat-message-bubble>
            <cometchat-message-bubble style="${BUBBLE_STYLE}" [disableInteraction]="true" [message]="pollIn" [alignment]="left" [group]="group"></cometchat-message-bubble>
          </div>
        </div>

        <!-- Sticker -->
        <div style="display:flex;flex-direction:column;gap:var(--cometchat-spacing-2);">
          <p style="${LABEL_STYLE}">Sticker</p>
          <div style="display:flex;flex-direction:column;gap:var(--cometchat-spacing-1);background:transparent;border-radius:var(--cometchat-radius-3);padding:var(--cometchat-spacing-3);">
            <cometchat-message-bubble style="${BUBBLE_STYLE}" [disableInteraction]="true" [message]="stickerOut" [alignment]="right"></cometchat-message-bubble>
            <cometchat-message-bubble style="${BUBBLE_STYLE}" [disableInteraction]="true" [message]="stickerIn" [alignment]="left" [group]="group"></cometchat-message-bubble>
          </div>
        </div>

        <!-- Collaborative Document -->
        <div style="display:flex;flex-direction:column;gap:var(--cometchat-spacing-2);">
          <p style="${LABEL_STYLE}">Collaborative Document</p>
          <div style="display:flex;flex-direction:column;gap:var(--cometchat-spacing-1);background:transparent;border-radius:var(--cometchat-radius-3);padding:var(--cometchat-spacing-3);">
            <cometchat-message-bubble style="${BUBBLE_STYLE}" [disableInteraction]="true" [message]="docOut" [alignment]="right"></cometchat-message-bubble>
            <cometchat-message-bubble style="${BUBBLE_STYLE}" [disableInteraction]="true" [message]="docIn" [alignment]="left" [group]="group"></cometchat-message-bubble>
          </div>
        </div>

        <!-- Collaborative Whiteboard -->
        <div style="display:flex;flex-direction:column;gap:var(--cometchat-spacing-2);">
          <p style="${LABEL_STYLE}">Collaborative Whiteboard</p>
          <div style="display:flex;flex-direction:column;gap:var(--cometchat-spacing-1);background:transparent;border-radius:var(--cometchat-radius-3);padding:var(--cometchat-spacing-3);">
            <cometchat-message-bubble style="${BUBBLE_STYLE}" [disableInteraction]="true" [message]="wbOut" [alignment]="right"></cometchat-message-bubble>
            <cometchat-message-bubble style="${BUBBLE_STYLE}" [disableInteraction]="true" [message]="wbIn" [alignment]="left" [group]="group"></cometchat-message-bubble>
          </div>
        </div>

        <!-- Deleted -->
        <div style="display:flex;flex-direction:column;gap:var(--cometchat-spacing-2);">
          <p style="${LABEL_STYLE}">Deleted</p>
          <div style="display:flex;flex-direction:column;gap:var(--cometchat-spacing-1);background:transparent;border-radius:var(--cometchat-radius-3);padding:var(--cometchat-spacing-3);">
            <cometchat-message-bubble style="${BUBBLE_STYLE}" [disableInteraction]="true" [message]="delOut" [alignment]="right"></cometchat-message-bubble>
            <cometchat-message-bubble style="${BUBBLE_STYLE}" [disableInteraction]="true" [message]="delIn" [alignment]="left" [group]="group"></cometchat-message-bubble>
          </div>
        </div>

        <!-- Action -->
        <div style="display:flex;flex-direction:column;gap:var(--cometchat-spacing-2);">
          <p style="${LABEL_STYLE}">Action</p>
          <div style="background:transparent;border-radius:var(--cometchat-radius-3);padding:var(--cometchat-spacing-3);">
            <cometchat-message-bubble [disableInteraction]="true" [message]="actionMsg" [alignment]="center"></cometchat-message-bubble>
          </div>
        </div>

        <!-- Call Variants -->
        <h3 style="margin:var(--cometchat-spacing-3) 0 0;font:var(--cometchat-font-heading3-bold);color:var(--cometchat-text-color-primary);">Call Variants</h3>

        <div style="display:flex;flex-direction:column;gap:var(--cometchat-spacing-2);">
          <p style="${LABEL_STYLE}">Audio Call — Ended / Missed</p>
          <div style="display:flex;flex-direction:column;gap:var(--cometchat-spacing-1);background:transparent;border-radius:var(--cometchat-radius-3);padding:var(--cometchat-spacing-3);">
            <cometchat-message-bubble [disableInteraction]="true" [message]="callAudioEnded" [alignment]="center"></cometchat-message-bubble>
            <cometchat-message-bubble [disableInteraction]="true" [message]="callMissed" [alignment]="center"></cometchat-message-bubble>
          </div>
        </div>

        <div style="display:flex;flex-direction:column;gap:var(--cometchat-spacing-2);">
          <p style="${LABEL_STYLE}">Video Call — Ended / Missed</p>
          <div style="display:flex;flex-direction:column;gap:var(--cometchat-spacing-1);background:transparent;border-radius:var(--cometchat-radius-3);padding:var(--cometchat-spacing-3);">
            <cometchat-message-bubble [disableInteraction]="true" [message]="callVideoEnded" [alignment]="center"></cometchat-message-bubble>
            <cometchat-message-bubble [disableInteraction]="true" [message]="callVideoMissed" [alignment]="center"></cometchat-message-bubble>
          </div>
        </div>

        <div style="display:flex;flex-direction:column;gap:var(--cometchat-spacing-2);">
          <p style="${LABEL_STYLE}">Audio Call — Cancelled / Busy / Initiated</p>
          <div style="display:flex;flex-direction:column;gap:var(--cometchat-spacing-1);background:transparent;border-radius:var(--cometchat-radius-3);padding:var(--cometchat-spacing-3);">
            <cometchat-message-bubble [disableInteraction]="true" [message]="callCancelled" [alignment]="center"></cometchat-message-bubble>
            <cometchat-message-bubble [disableInteraction]="true" [message]="callBusy" [alignment]="center"></cometchat-message-bubble>
            <cometchat-message-bubble [disableInteraction]="true" [message]="callInitiated" [alignment]="center"></cometchat-message-bubble>
          </div>
        </div>

        <div style="display:flex;flex-direction:column;gap:var(--cometchat-spacing-2);">
          <p style="${LABEL_STYLE}">Video Call — Rejected</p>
          <div style="background:transparent;border-radius:var(--cometchat-radius-3);padding:var(--cometchat-spacing-3);">
            <cometchat-message-bubble [disableInteraction]="true" [message]="callRejected" [alignment]="center"></cometchat-message-bubble>
          </div>
        </div>

      </div>
    `,
    props: {
      left: MessageBubbleAlignment.left,
      right: MessageBubbleAlignment.right,
      center: MessageBubbleAlignment.center,
      group: mockGroup,

      textOut: createTextMsg('Hello! This is a sample text message. 👋'),
      textIn: createTextMsg('Looks great! I will review the PR this afternoon. 👍', false),

      imgOut: createImageMsg(true),
      imgIn: createImageMsg(false),

      fileOut: createFileMsg(true),
      fileIn: createFileMsg(false),

      audioOut: createAudioMsg(true),
      audioIn: createAudioMsg(false),

      videoOut: createVideoMsg(true),
      videoIn: createVideoMsg(false),

      pollOut: createPollMsg(true),
      pollIn: createPollMsg(false),

      stickerOut: createStickerMsg(true),
      stickerIn: createStickerMsg(false),

      docOut: createDocumentMsg(true),
      docIn: createDocumentMsg(false),

      wbOut: createWhiteboardMsg(true),
      wbIn: createWhiteboardMsg(false),

      delOut: createDeletedMsg(true),
      delIn: createDeletedMsg(false),

      actionMsg: createActionMsg(),

      callAudioEnded: createCallMsg(CometChat.CALL_TYPE.AUDIO, 'ended', 185, true),
      callVideoEnded: createCallMsg(CometChat.CALL_TYPE.VIDEO, 'ended', 320, true),
      callMissed: createCallMsg(CometChat.CALL_TYPE.AUDIO, 'unanswered', 0, false),
      callVideoMissed: createCallMsg(CometChat.CALL_TYPE.VIDEO, 'unanswered', 0, false),
      callCancelled: createCallMsg(CometChat.CALL_TYPE.AUDIO, 'cancelled', 0, true),
      callRejected: createCallMsg(CometChat.CALL_TYPE.VIDEO, 'rejected', 0, true),
      callBusy: createCallMsg(CometChat.CALL_TYPE.AUDIO, 'busy', 0, true),
      callInitiated: createCallMsg(CometChat.CALL_TYPE.AUDIO, 'initiated', 0, true),
    },
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Comprehensive showcase of every message bubble variant. Each message type shows sender (outgoing) and receiver (incoming) bubbles together in a single chat-thread-style preview block.',
      },
    },
  },
};
