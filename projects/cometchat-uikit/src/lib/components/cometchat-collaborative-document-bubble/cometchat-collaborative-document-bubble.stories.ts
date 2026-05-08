/**
 * CometChatCollaborativeDocumentBubble Storybook Stories
 *
 * Renders collaborative document messages with a banner image, title, subtitle,
 * and an action button to open the document.
 *
 * @module components/cometchat-collaborative-document-bubble
 */

import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CommonModule } from '@angular/common';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatCollaborativeDocumentBubbleComponent } from './cometchat-collaborative-document-bubble.component';
import { MessageBubbleAlignment } from '../../Enums/Enums';
import {
  createMockDocumentMessage,
  createMockUser,
  MOCK_AVATARS,
} from '../../../../../../.storybook/utils/mock-data';

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

function makeDocumentMsg(isOutgoing = true): CometChat.CustomMessage {
  return createMockDocumentMessage({
    id: Math.floor(Math.random() * 10000),
    sentAt: Date.now() / 1000,
    sender: isOutgoing ? senderUser : receiverUser,
    documentUrl: 'https://example.com/collaborative-document',
  });
}

// ── Meta ──────────────────────────────────────────────────────────────────────

const meta: Meta<CometChatCollaborativeDocumentBubbleComponent> = {
  title: 'Components/Bubbles/Collaborative Document Bubble',
  component: CometChatCollaborativeDocumentBubbleComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [CommonModule],
    }),
  ],
  args: {
    message: makeDocumentMsg(),
    alignment: MessageBubbleAlignment.right,
    disableInteraction: false,
  },
  argTypes: {
    message: {
      control: false,
      description: 'CometChat.CustomMessage of type extension_document containing the document URL in metadata',
      table: { type: { summary: 'CometChat.CustomMessage' }, category: 'Primary Inputs' },
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
      description: 'When true, disables the action button',
      table: { defaultValue: { summary: 'false' }, category: 'Display Controls' },
    },
    buttonClick: { action: 'buttonClick', table: { category: 'Events' } },
  },
  parameters: {
    docs: {
      description: {
        component:
          'CometChatCollaborativeDocumentBubble renders collaborative document messages with a theme-aware banner image, localized title/subtitle, and an action button to open the document URL.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<CometChatCollaborativeDocumentBubbleComponent>;

// ── Stories ───────────────────────────────────────────────────────────────────

/** Default outgoing collaborative document bubble. */
export const Default: Story = {
  args: {
    message: makeDocumentMsg(),
    alignment: MessageBubbleAlignment.right,
  },
};

/** Outgoing (sender) collaborative document bubble. */
export const Outgoing: Story = {
  args: {
    message: makeDocumentMsg(true),
    alignment: MessageBubbleAlignment.right,
  },
  parameters: {
    docs: { description: { story: 'Outgoing collaborative document bubble (sender / right alignment).' } },
  },
};

/** Incoming (receiver) collaborative document bubble. */
export const Incoming: Story = {
  args: {
    message: makeDocumentMsg(false),
    alignment: MessageBubbleAlignment.left,
  },
  parameters: {
    docs: { description: { story: 'Incoming collaborative document bubble (receiver / left alignment).' } },
  },
};

/** Document bubble with interaction disabled. */
export const InteractionDisabled: Story = {
  args: {
    message: makeDocumentMsg(),
    alignment: MessageBubbleAlignment.right,
    disableInteraction: true,
  },
  parameters: {
    docs: { description: { story: 'Collaborative document bubble with the action button disabled.' } },
  },
};

/** Side-by-side outgoing and incoming preview. */
export const OutgoingAndIncoming: Story = {
  render: () => ({
    template: `
      <div style="display:flex;flex-direction:column;gap:8px;padding:16px;max-width:480px;">
        <cometchat-collaborative-document-bubble [message]="out" [alignment]="right" [disableInteraction]="true"></cometchat-collaborative-document-bubble>
        <cometchat-collaborative-document-bubble [message]="inc" [alignment]="left" [disableInteraction]="true"></cometchat-collaborative-document-bubble>
      </div>`,
    props: {
      right: MessageBubbleAlignment.right,
      left: MessageBubbleAlignment.left,
      out: makeDocumentMsg(true),
      inc: makeDocumentMsg(false),
    },
  }),
  parameters: {
    docs: { description: { story: 'Outgoing and incoming collaborative document bubbles shown together.' } },
  },
};
