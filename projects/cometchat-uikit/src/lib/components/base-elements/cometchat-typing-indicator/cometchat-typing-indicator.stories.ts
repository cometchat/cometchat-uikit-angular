/**
 * CometChatTypingIndicator Storybook Stories
 *
 * Interactive stories demonstrating the typing indicator component variants:
 * - Default typing in a 1-on-1 chat
 * - Single user typing in a group chat
 * - Multiple users typing in a group chat
 * - All variants showcase
 *
 * @module components/cometchat-typing-indicator
 */

import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CommonModule } from '@angular/common';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatTypingIndicatorComponent } from './cometchat-typing-indicator.component';
import { TranslatePipe } from '../../../resources/CometChatLocalize/translate.pipe';
import { createMockUser } from '../../../../../../../.storybook/utils/mock-data';

// ============================================
// Mock Helpers
// ============================================

/**
 * Creates a mock TypingIndicator object matching the CometChat SDK interface.
 * Uses plain objects with getter methods since the SDK constructor requires
 * initialization.
 */
function createMockTypingIndicator(
  receiverId: string,
  receiverType: string,
  senderName: string
): CometChat.TypingIndicator {
  const sender = createMockUser({ name: senderName });
  return {
    getReceiverType: () => receiverType,
    getReceiverId: () => receiverId,
    getSender: () => sender,
    getTypingMetadata: () => ({}),
  } as unknown as CometChat.TypingIndicator;
}

// ============================================
// Meta Configuration
// ============================================

const meta: Meta<CometChatTypingIndicatorComponent> = {
  title: 'Components/Messages/Typing Indicator',
  component: CometChatTypingIndicatorComponent,
  tags: ['!dev', '!autodocs'],
  decorators: [
    moduleMetadata({
      imports: [CommonModule, TranslatePipe],
    }),
  ],
  args: {
    typingUsers: [createMockTypingIndicator('user-1', CometChat.RECEIVER_TYPE.USER, 'Alice')],
    isGroupChat: false,
  },
  argTypes: {
    typingUsers: {
      control: false,
      description: 'Array of CometChat.TypingIndicator objects representing users currently typing',
      table: {
        type: { summary: 'CometChat.TypingIndicator[]' },
        defaultValue: { summary: '[]' },
      },
    },
    isGroupChat: {
      control: 'boolean',
      description:
        'Whether the conversation is a group chat — affects how the typing text is displayed',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
  },
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'CometChatTypingIndicator displays animated typing status when users are composing messages. Shows context-aware text: "typing..." for 1-on-1 chats, "{name} is typing..." for a single user in group chats, and "Multiple people are typing..." when three or more users are typing simultaneously.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<CometChatTypingIndicatorComponent>;

// ============================================
// Stories
// ============================================

/** Default typing indicator for a 1-on-1 chat with one user typing. */
export const Default: Story = {
  args: {
    typingUsers: [createMockTypingIndicator('user-1', CometChat.RECEIVER_TYPE.USER, 'Alice')],
    isGroupChat: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Default typing indicator in a 1-on-1 chat showing "typing..." with animated dots.',
      },
    },
  },
};

/** Single user typing in a group chat — shows "{name} is typing...". */
export const SingleUserTyping: Story = {
  args: {
    typingUsers: [createMockTypingIndicator('group-1', CometChat.RECEIVER_TYPE.GROUP, 'Bob')],
    isGroupChat: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Single user typing in a group chat. Displays "{name} is typing..." with animated dots.',
      },
    },
  },
};

/** Multiple users typing in a group chat — shows "Multiple people are typing...". */
export const MultipleUsersTyping: Story = {
  args: {
    typingUsers: [
      createMockTypingIndicator('group-1', CometChat.RECEIVER_TYPE.GROUP, 'Alice'),
      createMockTypingIndicator('group-1', CometChat.RECEIVER_TYPE.GROUP, 'Bob'),
      createMockTypingIndicator('group-1', CometChat.RECEIVER_TYPE.GROUP, 'Charlie'),
    ],
    isGroupChat: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Three users typing in a group chat. Displays "Multiple people are typing..." with animated dots.',
      },
    },
  },
};

// ============================================
// Showcase
// ============================================

/** Comprehensive showcase of all typing indicator variants in a single view. */
export const AllVariantsShowcase: Story = {
  render: () => ({
    template: `
      <div class="cometchat-typing-indicator-showcase" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-5); padding: var(--cometchat-padding-5);">

        <h3 class="cometchat-typing-indicator-showcase__title" style="margin: 0; font: var(--cometchat-font-heading3-bold); color: var(--cometchat-text-color-primary);">
          Typing Indicator Variants
        </h3>

        <!-- 1-on-1 Chat -->
        <div class="cometchat-typing-indicator-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-typing-indicator-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            1-on-1 Chat (typing...)
          </p>
          <cometchat-typing-indicator [typingUsers]="oneOnOneTyping" [isGroupChat]="false"></cometchat-typing-indicator>
        </div>

        <!-- Group Chat: Single User -->
        <div class="cometchat-typing-indicator-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-typing-indicator-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Group Chat — Single User Typing
          </p>
          <cometchat-typing-indicator [typingUsers]="singleGroupTyping" [isGroupChat]="true"></cometchat-typing-indicator>
        </div>

        <!-- Group Chat: Two Users -->
        <div class="cometchat-typing-indicator-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-typing-indicator-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Group Chat — Two Users Typing
          </p>
          <cometchat-typing-indicator [typingUsers]="twoGroupTyping" [isGroupChat]="true"></cometchat-typing-indicator>
        </div>

        <!-- Group Chat: Multiple Users (3+) -->
        <div class="cometchat-typing-indicator-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-typing-indicator-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Group Chat — Multiple Users Typing (3+)
          </p>
          <cometchat-typing-indicator [typingUsers]="multipleGroupTyping" [isGroupChat]="true"></cometchat-typing-indicator>
        </div>

      </div>
    `,
    props: {
      oneOnOneTyping: [createMockTypingIndicator('user-1', CometChat.RECEIVER_TYPE.USER, 'Alice')],
      singleGroupTyping: [
        createMockTypingIndicator('group-1', CometChat.RECEIVER_TYPE.GROUP, 'Bob'),
      ],
      twoGroupTyping: [
        createMockTypingIndicator('group-1', CometChat.RECEIVER_TYPE.GROUP, 'Alice'),
        createMockTypingIndicator('group-1', CometChat.RECEIVER_TYPE.GROUP, 'Bob'),
      ],
      multipleGroupTyping: [
        createMockTypingIndicator('group-1', CometChat.RECEIVER_TYPE.GROUP, 'Alice'),
        createMockTypingIndicator('group-1', CometChat.RECEIVER_TYPE.GROUP, 'Bob'),
        createMockTypingIndicator('group-1', CometChat.RECEIVER_TYPE.GROUP, 'Charlie'),
      ],
    },
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Comprehensive showcase displaying all typing indicator variants — 1-on-1 chat, single user in group, two users in group, and multiple users (3+) in group — in a single view. All styling uses CometChat CSS variables for theme consistency.',
      },
    },
  },
};
