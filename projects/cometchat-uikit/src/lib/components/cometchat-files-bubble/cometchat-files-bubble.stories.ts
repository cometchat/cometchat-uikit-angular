/**
 * CometChatFilesBubble Storybook Stories
 *
 * Receive-side bubble for a (multi-)file message introduced with the
 * "Multiple Attachments in a Single Message" feature (ENG-36752). Renders the
 * generic file attachment(s) of a MediaMessage as a collapsible list of file
 * cards (name, size, download) by delegating to CometChatFileBubble, plus a
 * shared batch width.
 *
 * @module components/cometchat-files-bubble
 */

import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CommonModule } from '@angular/common';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatFilesBubbleComponent } from './cometchat-files-bubble.component';
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

/** A spread of file types so the file-type icons are exercised. */
const SAMPLE_FILES: ReadonlyArray<{ name: string; extension: string; mimeType: string; size: number }> = [
  { name: 'project-proposal.pdf', extension: 'pdf', mimeType: 'application/pdf', size: 512000 },
  { name: 'meeting-notes.docx', extension: 'docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', size: 204800 },
  { name: 'budget-2026.xlsx', extension: 'xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', size: 153600 },
  { name: 'assets.zip', extension: 'zip', mimeType: 'application/zip', size: 4096000 },
  { name: 'roadmap.pptx', extension: 'pptx', mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', size: 1048576 },
  { name: 'readme.txt', extension: 'txt', mimeType: 'text/plain', size: 8192 },
];

/** Single-file message. */
function makeFileMsg(isOutgoing = true): CometChat.MediaMessage {
  return createMockMessage('file', {
    id: Math.floor(Math.random() * 10000),
    url: 'https://example.com/project-proposal.pdf',
    fileName: SAMPLE_FILES[0].name,
    sentAt: Date.now() / 1000,
    sender: isOutgoing ? senderUser : receiverUser,
  }) as CometChat.MediaMessage;
}

/** Message carrying several files in a single batch. */
function makeMultiFileMsg(count: number, isOutgoing = true): CometChat.MediaMessage {
  const message = makeFileMsg(isOutgoing);
  message.setAttachments(
    Array.from({ length: count }, (_, i) => {
      const file = SAMPLE_FILES[i % SAMPLE_FILES.length];
      return new CometChat.Attachment({
        extension: file.extension,
        mimeType: file.mimeType,
        name: file.name,
        size: file.size,
        url: `https://example.com/${file.name}`,
      });
    }),
  );
  return message;
}

// ── Meta ──────────────────────────────────────────────────────────────────────

const meta: Meta<CometChatFilesBubbleComponent> = {
  title: 'Components/Bubbles/Files Bubble (Multiple Attachments)',
  component: CometChatFilesBubbleComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [CommonModule],
    }),
  ],
  args: {
    message: makeMultiFileMsg(3),
    alignment: MessageBubbleAlignment.right,
    disableInteraction: false,
  },
  argTypes: {
    message: {
      control: false,
      description: 'CometChat.MediaMessage containing one or more file attachments',
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
    disableInteraction: {
      control: 'boolean',
      description: 'Accepted for parity with the other media batch bubbles; the file bubble has no interaction toggle, so it has no visible effect',
      table: { defaultValue: { summary: 'false' }, category: 'Display Controls' },
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          'CometChatFilesBubble renders the file attachment(s) of a MediaMessage as a collapsible list of file cards (name, size, download) by delegating to CometChatFileBubble. Rendered automatically for every file message.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<CometChatFilesBubbleComponent>;

// ── Stories ───────────────────────────────────────────────────────────────────

/** Default outgoing single-file bubble. */
export const Default: Story = {
  args: {
    message: makeFileMsg(),
    alignment: MessageBubbleAlignment.right,
  },
};

/** Outgoing (sender) single-file bubble. */
export const Outgoing: Story = {
  args: {
    message: makeFileMsg(true),
    alignment: MessageBubbleAlignment.right,
  },
  parameters: {
    docs: { description: { story: 'Outgoing file bubble (sender / right alignment).' } },
  },
};

/** Incoming (receiver) single-file bubble. */
export const Incoming: Story = {
  args: {
    message: makeFileMsg(false),
    alignment: MessageBubbleAlignment.left,
  },
  parameters: {
    docs: { description: { story: 'Incoming file bubble (receiver / left alignment).' } },
  },
};

/** Several files of different types sent together. */
export const MultipleFiles: Story = {
  args: {
    message: makeMultiFileMsg(3, true),
    alignment: MessageBubbleAlignment.right,
  },
  parameters: {
    docs: {
      description: {
        story: 'A single message carrying multiple files — each file renders as its own card with a type-specific icon.',
      },
    },
  },
};

/** Many files sent together — the list collapses behind an expand control. */
export const ManyFilesCollapse: Story = {
  args: {
    message: makeMultiFileMsg(6, true),
    alignment: MessageBubbleAlignment.right,
  },
  parameters: {
    docs: {
      description: {
        story: 'Six files in a single message — the list collapses and offers an expand/collapse control.',
      },
    },
  },
};

/** Side-by-side outgoing and incoming preview. */
export const OutgoingAndIncoming: Story = {
  render: () => ({
    template: `
      <div style="display:flex;flex-direction:column;gap:8px;padding:16px;max-width:480px;">
        <cometchat-files-bubble [message]="out" [alignment]="right"></cometchat-files-bubble>
        <cometchat-files-bubble [message]="inc" [alignment]="left"></cometchat-files-bubble>
      </div>`,
    props: {
      right: MessageBubbleAlignment.right,
      left: MessageBubbleAlignment.left,
      out: makeMultiFileMsg(2, true),
      inc: makeMultiFileMsg(2, false),
    },
  }),
  parameters: {
    docs: { description: { story: 'Outgoing and incoming file bubbles shown together.' } },
  },
};

// ============================================
// Interaction Tests
// ============================================

/** Test: Default story renders the files-bubble and delegates to the file bubble. */
export const TestDefaultRendersFilesBubble: Story = {
  play: async ({ canvasElement }) => {
    await new Promise(r => setTimeout(r, 500));
    const host = canvasElement.querySelector('cometchat-files-bubble');
    expect(host).not.toBeNull();
    // Delegates to the single-attachment file bubble.
    expect(canvasElement.querySelector('cometchat-file-bubble')).not.toBeNull();
  },
};
