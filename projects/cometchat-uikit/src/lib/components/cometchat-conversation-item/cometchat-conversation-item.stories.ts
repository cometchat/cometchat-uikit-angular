/**
 * CometChatConversationItem Storybook Stories
 *
 * Interactive stories demonstrating the conversation item component variants:
 * - Default user conversation
 * - Conversation with unread message count
 * - Conversation with active typing indicator
 * - All variants showcase
 *
 * @module components/cometchat-conversation-item
 */

import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CommonModule } from '@angular/common';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatConversationItemComponent } from './cometchat-conversation-item.component';
import {
  createMockConversation,
  createMockUser,
  createMockGroup,
  createMockMessage,
  MOCK_AVATARS,
} from '../../../../../../.storybook/utils/mock-data';

// ============================================
// Mock Classes
// ============================================

/**
 * Creates a mock CometChat.TypingIndicator for typing stories.
 * The SDK TypingIndicator requires sender UID and receiver info.
 */
function createMockTypingIndicator(
  receiverId: string,
  receiverType: string = CometChat.RECEIVER_TYPE.USER
): CometChat.TypingIndicator {
  return new CometChat.TypingIndicator(receiverId, receiverType);
}

// ============================================
// Meta Configuration
// ============================================

const meta: Meta<CometChatConversationItemComponent> = {
  title: 'Components/Conversations/CometChat Conversation Item',
  component: CometChatConversationItemComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [CommonModule],
    }),
  ],
  args: {
    conversation: createMockConversation('user', {
      conversationWith: createMockUser({
        uid: 'user-default',
        name: 'John Doe',
        avatar: MOCK_AVATARS.andrewJoseph,
        status: CometChat.USER_STATUS.ONLINE,
      }),
      lastMessage: createMockMessage('text', {
        text: 'Hey! How are you doing today?',
        sentAt: Date.now() / 1000 - 300,
      }),
      unreadMessageCount: 0,
    }),
    isActive: false,
    isSelected: false,
    isFocused: false,
    hideReceipts: false,
    hideUserStatus: false,
    hideGroupType: false,
  },
  argTypes: {
    conversation: {
      control: false,
      description:
        'The CometChat.Conversation object to render. Primary data source for the component.',
      table: {
        type: { summary: 'CometChat.Conversation' },
        category: 'Required',
      },
    },
    isActive: {
      control: 'boolean',
      description: 'Whether this conversation is currently active/selected for viewing',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'State',
      },
    },
    isSelected: {
      control: 'boolean',
      description: 'Whether this conversation is selected in selection mode',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'State',
      },
    },
    isFocused: {
      control: 'boolean',
      description: 'Whether this conversation item has keyboard focus',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'State',
      },
    },
    typingIndicator: {
      control: false,
      description: 'Typing indicator object — when provided, displays typing animation and text',
      table: {
        type: { summary: 'CometChat.TypingIndicator | null' },
        defaultValue: { summary: 'null' },
        category: 'State',
      },
    },
    hideReceipts: {
      control: 'boolean',
      description: 'Hide message receipts (sent, delivered, read indicators)',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'Display',
      },
    },
    hideUserStatus: {
      control: 'boolean',
      description: 'Hide user online/offline status indicator',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'Display',
      },
    },
    hideGroupType: {
      control: 'boolean',
      description: 'Hide group type icon (public, private, password)',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'Display',
      },
    },
    disableDefaultContextMenu: {
      control: 'boolean',
      description: 'Disable the browser default context menu on right-click',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'true' },
        category: 'Display',
      },
    },
    itemClick: {
      action: 'itemClick',
      description: 'Emitted when the conversation item is clicked',
      table: {
        type: { summary: 'EventEmitter<CometChat.Conversation>' },
        category: 'Events',
      },
    },
    itemSelect: {
      action: 'itemSelect',
      description: 'Emitted when the conversation is selected/deselected',
      table: {
        type: {
          summary: 'EventEmitter<{ conversation: CometChat.Conversation; selected: boolean }>',
        },
        category: 'Events',
      },
    },
    avatarClick: {
      action: 'avatarClick',
      description: 'Emitted when the avatar is clicked',
      table: {
        type: { summary: 'EventEmitter<CometChat.Conversation>' },
        category: 'Events (Granular)',
      },
    },
    titleClick: {
      action: 'titleClick',
      description: 'Emitted when the title is clicked',
      table: {
        type: { summary: 'EventEmitter<CometChat.Conversation>' },
        category: 'Events (Granular)',
      },
    },
    subtitleClick: {
      action: 'subtitleClick',
      description: 'Emitted when the subtitle is clicked',
      table: {
        type: { summary: 'EventEmitter<CometChat.Conversation>' },
        category: 'Events (Granular)',
      },
    },
    timestampClick: {
      action: 'timestampClick',
      description: 'Emitted when the timestamp is clicked',
      table: {
        type: { summary: 'EventEmitter<CometChat.Conversation>' },
        category: 'Events (Granular)',
      },
    },
    badgeClick: {
      action: 'badgeClick',
      description: 'Emitted when the unread badge is clicked',
      table: {
        type: { summary: 'EventEmitter<CometChat.Conversation>' },
        category: 'Events (Granular)',
      },
    },
    contextMenuOpen: {
      action: 'contextMenuOpen',
      description: 'Emitted when the context menu is opened',
      table: {
        type: { summary: 'EventEmitter<CometChat.Conversation>' },
        category: 'Events',
      },
    },
    contextMenuOptionClick: {
      action: 'contextMenuOptionClick',
      description: 'Emitted when a context menu option is clicked',
      table: {
        type: {
          summary:
            'EventEmitter<{ option: CometChatOption; conversation: CometChat.Conversation }>',
        },
        category: 'Events',
      },
    },
  },
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'CometChatConversationItem renders a single conversation with avatar, title, subtitle (last message), timestamp, unread badge, and typing indicator. Supports active/selected/focused states, display configuration (hide receipts, status, group type), slot-based customization, and granular event emission for specific element clicks.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<CometChatConversationItemComponent>;

// ============================================
// Stories
// ============================================

/** Default conversation item showing a user conversation with no unread messages. */
export const Default: Story = {
  args: {
    conversation: createMockConversation('user', {
      conversationWith: createMockUser({
        uid: 'user-1',
        name: 'John Doe',
        avatar: MOCK_AVATARS.andrewJoseph,
        status: CometChat.USER_STATUS.ONLINE,
      }),
      lastMessage: createMockMessage('text', {
        text: 'Hey! How are you doing today?',
        sentAt: Date.now() / 1000 - 300,
      }),
      unreadMessageCount: 0,
    }),
    isActive: false,
    hideReceipts: false,
    hideUserStatus: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Default conversation item rendered with a user conversation, online status indicator, and the last text message. No unread messages.',
      },
    },
  },
};

/** Conversation with unread messages showing the badge count. */
export const WithUnreadCount: Story = {
  args: {
    conversation: createMockConversation('user', {
      conversationWith: createMockUser({
        uid: 'user-2',
        name: 'Jane Smith',
        status: CometChat.USER_STATUS.ONLINE,
      }),
      lastMessage: createMockMessage('text', {
        text: 'Did you see the latest update?',
        sentAt: Date.now() / 1000 - 60,
      }),
      unreadMessageCount: 5,
    }),
    isActive: false,
    hideReceipts: false,
    hideUserStatus: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Conversation with 5 unread messages. The unread badge is displayed in the trailing section and the title/subtitle may use bolder styling to indicate unread state.',
      },
    },
  },
};

/** Conversation with an active typing indicator replacing the subtitle. */
export const WithTypingIndicator: Story = {
  args: {
    conversation: createMockConversation('user', {
      conversationWith: createMockUser({
        uid: 'user-3',
        name: 'Alice Johnson',
        avatar: MOCK_AVATARS.nancyGrace,
        status: CometChat.USER_STATUS.ONLINE,
      }),
      lastMessage: createMockMessage('text', {
        text: 'Let me check that for you...',
        sentAt: Date.now() / 1000 - 120,
      }),
      unreadMessageCount: 0,
    }),
    typingIndicator: createMockTypingIndicator('user-3', CometChat.RECEIVER_TYPE.USER),
    isActive: false,
    hideReceipts: false,
    hideUserStatus: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Conversation with an active typing indicator. The subtitle is replaced with a "typing..." animation and the avatar area shows animated typing dots.',
      },
    },
  },
};

// ============================================
// Showcase
// ============================================

/** Comprehensive showcase of all conversation item variants in a single view. */
export const AllVariantsShowcase: Story = {
  render: () => ({
    template: `
      <div class="cometchat-conversation-item-showcase" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-5); padding: var(--cometchat-padding-5); max-width: 480px;">

        <h3 class="cometchat-conversation-item-showcase__title" style="margin: 0; font: var(--cometchat-font-heading3-bold); color: var(--cometchat-text-color-primary);">
          Conversation Item Variants
        </h3>

        <!-- Default User Conversation -->
        <div class="cometchat-conversation-item-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-conversation-item-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Default (User Conversation)
          </p>
          <div class="cometchat-conversation-item-showcase__item" style="border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
            <cometchat-conversation-item [conversation]="defaultConversation"></cometchat-conversation-item>
          </div>
        </div>

        <!-- With Unread Count -->
        <div class="cometchat-conversation-item-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-conversation-item-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            With Unread Messages (5)
          </p>
          <div class="cometchat-conversation-item-showcase__item" style="border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
            <cometchat-conversation-item [conversation]="unreadConversation"></cometchat-conversation-item>
          </div>
        </div>

        <!-- With Typing Indicator -->
        <div class="cometchat-conversation-item-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-conversation-item-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            With Typing Indicator
          </p>
          <div class="cometchat-conversation-item-showcase__item" style="border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
            <cometchat-conversation-item [conversation]="typingConversation" [typingIndicator]="typingIndicator"></cometchat-conversation-item>
          </div>
        </div>

        <!-- Group Conversation -->
        <div class="cometchat-conversation-item-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-conversation-item-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Group Conversation (Private)
          </p>
          <div class="cometchat-conversation-item-showcase__item" style="border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
            <cometchat-conversation-item [conversation]="groupConversation"></cometchat-conversation-item>
          </div>
        </div>

        <!-- Active State -->
        <div class="cometchat-conversation-item-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-conversation-item-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Active State
          </p>
          <div class="cometchat-conversation-item-showcase__item" style="border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
            <cometchat-conversation-item [conversation]="activeConversation" [isActive]="true"></cometchat-conversation-item>
          </div>
        </div>

      </div>
    `,
    props: {
      defaultConversation: createMockConversation('user', {
        conversationWith: createMockUser({
          uid: 'showcase-user-1',
          name: 'John Doe',
          avatar: MOCK_AVATARS.andrewJoseph,
          status: CometChat.USER_STATUS.ONLINE,
        }),
        lastMessage: createMockMessage('text', {
          text: 'Hey! How are you doing today?',
          sentAt: Date.now() / 1000 - 300,
        }),
        unreadMessageCount: 0,
      }),
      unreadConversation: createMockConversation('user', {
        conversationWith: createMockUser({
          uid: 'showcase-user-2',
          name: 'Jane Smith',
          status: CometChat.USER_STATUS.ONLINE,
        }),
        lastMessage: createMockMessage('text', {
          text: 'Did you see the latest update?',
          sentAt: Date.now() / 1000 - 60,
        }),
        unreadMessageCount: 5,
      }),
      typingConversation: createMockConversation('user', {
        conversationWith: createMockUser({
          uid: 'showcase-user-3',
          name: 'Alice Johnson',
          avatar: MOCK_AVATARS.nancyGrace,
          status: CometChat.USER_STATUS.ONLINE,
        }),
        lastMessage: createMockMessage('text', {
          text: 'Let me check that for you...',
          sentAt: Date.now() / 1000 - 120,
        }),
        unreadMessageCount: 0,
      }),
      typingIndicator: createMockTypingIndicator('showcase-user-3', CometChat.RECEIVER_TYPE.USER),
      groupConversation: createMockConversation('group', {
        conversationWith: createMockGroup({
          guid: 'showcase-group-1',
          name: 'Design Team',
          type: CometChat.GROUP_TYPE.PRIVATE,
          membersCount: 8,
        }),
        lastMessage: createMockMessage('text', {
          text: 'Meeting at 3pm today',
          sentAt: Date.now() / 1000 - 600,
        }),
        unreadMessageCount: 3,
      }),
      activeConversation: createMockConversation('user', {
        conversationWith: createMockUser({
          uid: 'showcase-user-4',
          name: 'Bob Wilson',
          status: CometChat.USER_STATUS.OFFLINE,
        }),
        lastMessage: createMockMessage('text', {
          text: 'Thanks for the help!',
          sentAt: Date.now() / 1000 - 1800,
        }),
        unreadMessageCount: 0,
      }),
    },
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Comprehensive showcase displaying all conversation item variants — default user conversation, unread messages, typing indicator, group conversation, and active state — in a single view. All styling uses CometChat CSS variables for theme consistency.',
      },
    },
  },
};
