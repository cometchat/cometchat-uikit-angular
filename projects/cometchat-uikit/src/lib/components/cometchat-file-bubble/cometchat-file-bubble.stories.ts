/**
 * CometChatFileBubble Storybook Stories
 *
 * Renders file attachments with file type icons, human-readable sizes,
 * inline expand/collapse for multiple files, and caption support.
 *
 * @module components/cometchat-file-bubble
 */

import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CommonModule } from '@angular/common';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatFileBubbleComponent } from './cometchat-file-bubble.component';
import { MessageBubbleAlignment } from '../../Enums/Enums';
import { within, expect } from '@storybook/test';
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

function makeFileMsg(
  isOutgoing = true,
  opts: { fileName?: string; fileExtension?: string; fileMimeType?: string; fileSize?: number } = {}
): CometChat.MediaMessage {
  return createMockMessage('file', {
    id: Math.floor(Math.random() * 10000),
    url: 'https://example.com/document.pdf',
    fileName: opts.fileName ?? 'project-report.pdf',
    fileExtension: opts.fileExtension ?? 'pdf',
    fileMimeType: opts.fileMimeType ?? 'application/pdf',
    fileSize: opts.fileSize ?? 2048000,
    sentAt: Date.now() / 1000,
    sender: isOutgoing ? senderUser : receiverUser,
  }) as CometChat.MediaMessage;
}

// ── Meta ──────────────────────────────────────────────────────────────────────

const meta: Meta<CometChatFileBubbleComponent> = {
  title: 'Components/Bubbles/File Bubble',
  component: CometChatFileBubbleComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [CommonModule],
    }),
  ],
  args: {
    message: makeFileMsg(),
    alignment: MessageBubbleAlignment.right,
  },
  argTypes: {
    message: {
      control: false,
      description: 'CometChat.MediaMessage object containing file attachment(s)',
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
          'CometChatFileBubble renders file attachments with file type icons, human-readable sizes, inline expand/collapse for multiple files, and caption support.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<CometChatFileBubbleComponent>;

// ── Stories ───────────────────────────────────────────────────────────────────

/** Default outgoing PDF file bubble. */
export const Default: Story = {
  args: {
    message: makeFileMsg(),
    alignment: MessageBubbleAlignment.right,
  },
};

/** Outgoing (sender) file bubble. */
export const Outgoing: Story = {
  args: {
    message: makeFileMsg(true),
    alignment: MessageBubbleAlignment.right,
  },
  parameters: {
    docs: { description: { story: 'Outgoing file bubble (sender / right alignment).' } },
  },
};

/** Incoming (receiver) file bubble. */
export const Incoming: Story = {
  args: {
    message: makeFileMsg(false),
    alignment: MessageBubbleAlignment.left,
  },
  parameters: {
    docs: { description: { story: 'Incoming file bubble (receiver / left alignment).' } },
  },
};

/** Image file type. */
export const ImageFile: Story = {
  args: {
    message: makeFileMsg(true, {
      fileName: 'screenshot.png',
      fileExtension: 'png',
      fileMimeType: 'image/png',
      fileSize: 512000,
    }),
    alignment: MessageBubbleAlignment.right,
  },
  parameters: {
    docs: { description: { story: 'File bubble showing an image file type with appropriate icon.' } },
  },
};

/** Spreadsheet file type. */
export const SpreadsheetFile: Story = {
  args: {
    message: makeFileMsg(true, {
      fileName: 'data-export.xlsx',
      fileExtension: 'xlsx',
      fileMimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      fileSize: 1024000,
    }),
    alignment: MessageBubbleAlignment.right,
  },
  parameters: {
    docs: { description: { story: 'File bubble showing a spreadsheet file type.' } },
  },
};

/** Side-by-side outgoing and incoming preview. */
export const OutgoingAndIncoming: Story = {
  render: () => ({
    template: `
      <div style="display:flex;flex-direction:column;gap:8px;padding:16px;max-width:480px;">
        <cometchat-file-bubble [message]="out" [alignment]="right"></cometchat-file-bubble>
        <cometchat-file-bubble [message]="inc" [alignment]="left"></cometchat-file-bubble>
      </div>`,
    props: {
      right: MessageBubbleAlignment.right,
      left: MessageBubbleAlignment.left,
      out: makeFileMsg(true),
      inc: makeFileMsg(false),
    },
  }),
  parameters: {
    docs: { description: { story: 'Outgoing and incoming file bubbles shown together.' } },
  },
};

// ============================================
// Interaction Tests
// ============================================

/** Test: Default story renders file bubble container */
export const TestDefaultRendersFileBubble: Story = {
  play: async ({ canvasElement }) => {
    await new Promise(r => setTimeout(r, 1000));
    const container = canvasElement.querySelector('.cometchat-file-bubble');
    expect(container).not.toBeNull();
  },
};
