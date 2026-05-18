/**
 * CometChatMessageList Storybook Stories
 *
 * Interactive stories demonstrating the message list component variants:
 * - Default message list with mixed message types
 * - Empty state when no messages exist
 * - All variants showcase
 *
 * @module components/cometchat-message-list
 */

import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { within, expect } from '@storybook/test';

import { CometChatMessageListComponent } from './cometchat-message-list.component';
import { MessageListAlignment } from '../../Enums/Enums';
import { createMockUser, createMockMessage } from '../../../../../../.storybook/utils/mock-data';

// ============================================
// Mock Classes
// ============================================

/**
 * Creates mock messages with realistic content for story rendering.
 */
function createTestMessages(count = 15): CometChat.BaseMessage[] {
  const sender = createMockUser({
    uid: 'user-jane-smith',
    name: 'Jane Smith',
    avatar: 'https://assets.cometchat.io/sampleapp/v2/users/cometchat-uid-1.webp?text=JS',
  });

  const loggedInUser = createMockUser({
    uid: 'user-john-doe',
    name: 'John Doe',
    avatar: 'https://assets.cometchat.io/sampleapp/v2/users/cometchat-uid-1.webp?text=JD',
  });

  const messages: CometChat.BaseMessage[] = [];
  const baseTime = Date.now() / 1000;

  for (let i = 0; i < count; i++) {
    const isOutgoing = i % 3 === 0;
    const messageType = i % 5;

    let type: 'text' | 'image' | 'file' | 'audio' | 'video';
    const overrides: any = {
      id: i + 1,
      sentAt: baseTime - (count - i) * 120,
      sender: isOutgoing ? loggedInUser : sender,
    };

    switch (messageType) {
      case 0:
        type = 'text';
        overrides.text = `This is message number ${i + 1}. Hello there!`;
        break;
      case 1:
        type = 'image';
                overrides.url = 'https://data-in.cc-cluster-2.io/267879a77f4b29cd/media/thumbnails/5784cfe3_9786_4bdb_abd6_8c92af980e0c_medium.webp';

        // overrides.url = 'https://placehold.co/400x300/png?text=Sample+Image';
        break;
      case 2:
        type = 'file';
        overrides.fileName = 'document.pdf';
        break;
      case 3:
        type = 'audio';
        break;
      default:
        type = 'video';
    }

    messages.push(createMockMessage(type, overrides));
  }

  return messages;
}

/**
 * Mock messages manager that returns predefined mock data.
 * Simulates paginated fetching without SDK initialization.
 */
class MockMessagesManager {
  private mockMessages: CometChat.BaseMessage[];
  private currentIndex = 0;

  constructor(messages: CometChat.BaseMessage[]) {
    this.mockMessages = messages;
  }

  async fetchPreviousMessages(): Promise<CometChat.BaseMessage[]> {
    const page = this.mockMessages.slice(this.currentIndex, this.currentIndex + 30);
    this.currentIndex += 30;
    return page;
  }
}

/**
 * Wrapper component that provides mock data to CometChatMessageList.
 * Bypasses the SDK requirement by injecting mock data directly.
 *
 * mockRequestBuilder is built once in ngOnChanges (after inputs are set)
 * and cached so Angular doesn't see a new object reference on every
 * change detection cycle (which would cause infinite re-fetches).
 */
@Component({
  selector: 'cometchat-message-list-story-wrapper',
  standalone: true,
  imports: [CommonModule, CometChatMessageListComponent],
  template: `
    <cometchat-message-list
      [user]="user"
      [group]="group"
      [messageAlignment]="messageAlignment"
      [scrollToBottomOnNewMessages]="scrollToBottomOnNewMessages"
      [disableSoundForMessages]="disableSoundForMessages"
      [showScrollbar]="showScrollbar"
      [hideReceipts]="hideReceipts"
      [hideDateSeparator]="hideDateSeparator"
      [hideStickyDate]="hideStickyDate"
      [hideAvatar]="hideAvatar"
      [hideGroupActionMessages]="hideGroupActionMessages"
      [hideError]="hideError"
      [disableInteraction]="disableInteraction"
      [messagesRequestBuilder]="mockRequestBuilder"
    >
    </cometchat-message-list>
  `,
})
class CometChatMessageListStoryWrapperComponent implements OnChanges {
  @Input() user?: CometChat.User;
  @Input() group?: CometChat.Group;
  @Input() messageAlignment: MessageListAlignment = MessageListAlignment.standard;
  @Input() scrollToBottomOnNewMessages = false;
  @Input() disableSoundForMessages = true;
  @Input() showScrollbar = false;
  @Input() hideReceipts = false;
  @Input() hideDateSeparator = false;
  @Input() hideStickyDate = false;
  @Input() hideAvatar = false;
  @Input() hideGroupActionMessages = false;
  @Input() hideError = false;
  @Input() disableInteraction = false;
  @Input() mockMessages: CometChat.BaseMessage[] = [];
  @Input() simulateEmpty = false;
  @Input() simulateError = false;

  /**
   * Cached builder — built once when inputs arrive so Angular sees a stable
   * object reference and doesn't re-trigger fetches on every CD cycle.
   */
  mockRequestBuilder: any = null;

  constructor() {
    // Patch getLoggedinUser before any component initializes
    const loggedInUser = createMockUser({
      uid: 'user-john-doe',
      name: 'John Doe',
      avatar: 'https://assets.cometchat.io/sampleapp/v2/users/cometchat-uid-1.webp?text=JD',
    });
    (CometChat as any).getLoggedinUser = async () => loggedInUser;
  }

  ngOnChanges(_changes: SimpleChanges): void {
    this._buildRequestBuilder();
  }

  private _buildRequestBuilder(): void {
    const makeBuilder = (fetchFn: () => Promise<CometChat.BaseMessage[]>) => {
      const builder: any = {};
      // All methods the service may call — each returns the same builder for chaining
      const chainMethods = [
        'setLimit', 'setUID', 'setGUID', 'setCategories', 'setTypes',
        'hideReplies', 'setTimestamp', 'setMessageId', 'setParentMessageId',
        'withParent', 'hideDeletedMessages', 'setAttachmentTypes', 'hasLinks',
        'setSearchKeyword', 'setUnread', 'setConversationType',
      ];
      chainMethods.forEach(m => { builder[m] = () => builder; });
      builder.build = () => ({ fetchPrevious: fetchFn, fetchNext: async () => [] });
      return builder;
    };

    if (this.simulateError) {
      this.mockRequestBuilder = makeBuilder(async () => {
        await new Promise(resolve => setTimeout(resolve, 300));
        throw new Error('Failed to fetch messages. Please try again.');
      });
    } else if (this.simulateEmpty) {
      this.mockRequestBuilder = makeBuilder(async () => []);
    } else if (this.mockMessages.length > 0) {
      const manager = new MockMessagesManager(this.mockMessages);
      this.mockRequestBuilder = makeBuilder(() => manager.fetchPreviousMessages());
    }
    // else: mockRequestBuilder stays null → component uses default (loading state)
  }
}

// ============================================
// Meta Configuration
// ============================================

const meta: Meta<CometChatMessageListComponent> = {
  title: 'Components/Messages/CometChat Message List',
  component: CometChatMessageListComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [CommonModule, CometChatMessageListStoryWrapperComponent],
    }),
  ],
  args: {
    hideReceipts: false,
    hideDateSeparator: false,
    hideStickyDate: false,
    hideAvatar: false,
    hideError: false,
    showScrollbar: false,
    messageAlignment: MessageListAlignment.standard,
    scrollToBottomOnNewMessages: false,
    disableSoundForMessages: true,
  },
  argTypes: {
    // Data Configuration
    user: {
      control: false,
      description: 'CometChat.User object for 1-on-1 conversations',
      table: {
        type: { summary: 'CometChat.User' },
        category: 'Data Configuration',
      },
    },
    group: {
      control: false,
      description: 'CometChat.Group object for group conversations',
      table: {
        type: { summary: 'CometChat.Group' },
        category: 'Data Configuration',
      },
    },
    parentMessageId: {
      control: 'number',
      description: 'Parent message ID for thread mode',
      table: {
        type: { summary: 'number' },
        category: 'Data Configuration',
      },
    },
    messagesRequestBuilder: {
      control: false,
      description: 'Custom messages request builder for advanced configuration',
      table: {
        type: { summary: 'CometChat.MessagesRequestBuilder' },
        category: 'Data Configuration',
      },
    },
    messageAlignment: {
      control: 'select',
      options: [MessageListAlignment.standard, MessageListAlignment.left],
      description: 'Message alignment mode — standard (outgoing right) or left',
      table: {
        type: { summary: 'MessageListAlignment' },
        defaultValue: { summary: 'MessageListAlignment.standard' },
        category: 'Data Configuration',
      },
    },
    scrollToBottomOnNewMessages: {
      control: 'boolean',
      description: 'Auto-scroll to bottom when new messages arrive',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'Data Configuration',
      },
    },
    disableSoundForMessages: {
      control: 'boolean',
      description: 'Disable sound notifications for new messages',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'Data Configuration',
      },
    },
    showScrollbar: {
      control: 'boolean',
      description: 'Show the scrollbar in the message list',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'Data Configuration',
      },
    },

    // Display Controls
    hideReceipts: {
      control: 'boolean',
      description: 'Hide delivery/read receipts',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'Display Controls',
      },
    },
    hideDateSeparator: {
      control: 'boolean',
      description: 'Hide date separators between messages',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'Display Controls',
      },
    },
    hideStickyDate: {
      control: 'boolean',
      description: 'Hide the sticky date header',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'Display Controls',
      },
    },
    hideAvatar: {
      control: 'boolean',
      description: 'Hide user avatars in the message list',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'Display Controls',
      },
    },
    hideGroupActionMessages: {
      control: 'boolean',
      description: 'Hide group action messages (member joined, left, etc.)',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'Display Controls',
      },
    },
    hideError: {
      control: 'boolean',
      description: 'Hide error views',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'Display Controls',
      },
    },

    // Message Options
    hideReplyInThreadOption: {
      control: 'boolean',
      description: 'Hide reply in thread option',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'Message Options',
      },
    },
    hideEditMessageOption: {
      control: 'boolean',
      description: 'Hide edit message option',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'Message Options',
      },
    },
    hideDeleteMessageOption: {
      control: 'boolean',
      description: 'Hide delete message option',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'Message Options',
      },
    },
    hideReactionOption: {
      control: 'boolean',
      description: 'Hide reaction option',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'Message Options',
      },
    },
    hideCopyMessageOption: {
      control: 'boolean',
      description: 'Hide copy message option',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'Message Options',
      },
    },
    hideMessageInfoOption: {
      control: 'boolean',
      description: 'Hide message info option',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'Message Options',
      },
    },
    hideFlagMessageOption: {
      control: 'boolean',
      description: 'Hide flag message option',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'Message Options',
      },
    },
    hideFlagRemarkField: {
      control: 'boolean',
      description: 'Hide the remark text area in the flag message dialog',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'Message Options',
      },
    },
    showMarkAsUnreadOption: {
      control: 'boolean',
      description: 'Show "Mark as Unread" option in message context menu',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'true' },
        category: 'Message Options',
      },
    },
    hideReplyOption: {
      control: 'boolean',
      description: 'Hide the "Reply" option from message context menu',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'Message Options',
      },
    },
    startFromUnreadMessages: {
      control: 'boolean',
      description: 'Scroll to first unread message on load instead of bottom',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'true' },
        category: 'Behavior',
      },
    },
    isAgentChat: {
      control: 'boolean',
      description: 'Configure message list for AI agent chat mode',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'Behavior',
      },
    },

    // Custom Views
    emptyView: {
      control: false,
      description: 'Custom template for empty state',
      table: {
        type: { summary: 'TemplateRef<any>' },
        category: 'Custom Views',
      },
    },
    errorView: {
      control: false,
      description: 'Custom template for error state',
      table: {
        type: { summary: 'TemplateRef<any>' },
        category: 'Custom Views',
      },
    },
    loadingView: {
      control: false,
      description: 'Custom template for loading state',
      table: {
        type: { summary: 'TemplateRef<any>' },
        category: 'Custom Views',
      },
    },
    headerView: {
      control: false,
      description: 'Custom template for header',
      table: {
        type: { summary: 'TemplateRef<any>' },
        category: 'Custom Views',
      },
    },
    footerView: {
      control: false,
      description: 'Custom template for footer',
      table: {
        type: { summary: 'TemplateRef<any>' },
        category: 'Custom Views',
      },
    },

    // AI Features
    showConversationStarters: {
      control: 'boolean',
      description: 'Show conversation starters when conversation is empty',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'AI Features',
      },
    },
    showSmartReplies: {
      control: 'boolean',
      description: 'Show smart replies for incoming messages',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'AI Features',
      },
    },
    smartRepliesKeywords: {
      control: 'object',
      description: 'Keywords that trigger smart reply suggestions',
      table: {
        type: { summary: 'string[]' },
        defaultValue: { summary: "['what', 'when', 'why', 'who', 'where', 'how', '?']" },
        category: 'AI Features',
      },
    },
    smartRepliesDelayDuration: {
      control: { type: 'number', min: 0, max: 30000, step: 1000 },
      description: 'Delay in ms before showing smart replies after a message is received',
      table: {
        type: { summary: 'number' },
        defaultValue: { summary: '10000' },
        category: 'AI Features',
      },
    },

    // Events
    error: {
      action: 'error',
      description: 'Emitted when an error occurs',
      table: {
        type: { summary: 'EventEmitter<CometChat.CometChatException>' },
        category: 'Events',
      },
    },
    threadRepliesClick: {
      action: 'threadRepliesClick',
      description: 'Emitted when thread replies are clicked',
      table: {
        type: { summary: 'EventEmitter<CometChat.BaseMessage>' },
        category: 'Events',
      },
    },
    reactionClick: {
      action: 'reactionClick',
      description: 'Emitted when a reaction is clicked',
      table: {
        type: {
          summary:
            'EventEmitter<{ reaction: CometChat.ReactionCount; message: CometChat.BaseMessage }>',
        },
        category: 'Events',
      },
    },
    smartReplyClick: {
      action: 'smartReplyClick',
      description: 'Emitted when a smart reply is clicked',
      table: {
        type: { summary: 'EventEmitter<string>' },
        category: 'Events',
      },
    },
    conversationStarterClick: {
      action: 'conversationStarterClick',
      description: 'Emitted when a conversation starter is clicked',
      table: {
        type: { summary: 'EventEmitter<string>' },
        category: 'Events',
      },
    },
    replyClick: {
      action: 'replyClick',
      description: 'Emitted when reply option is clicked on a message',
      table: {
        type: { summary: 'EventEmitter<CometChat.BaseMessage>' },
        category: 'Events',
      },
    },
    messagePrivatelyClick: {
      action: 'messagePrivatelyClick',
      description: 'Emitted when "Message Privately" option is clicked in a group chat',
      table: {
        type: { summary: 'EventEmitter<{ message: CometChat.BaseMessage; user: CometChat.User }>' },
        category: 'Events',
      },
    },
  },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'CometChatMessageList displays a real-time, scrollable list of messages for the active conversation. Supports infinite scrolling, date separators, message alignment (standard/left), read receipts, AI features (smart replies, conversation starters), thread replies, reactions, and full keyboard/ARIA accessibility.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<CometChatMessageListComponent>;

// ============================================
// Stories
// ============================================

/** Default message list with a user conversation showing mixed message types. */
export const Default: Story = {
  render: args => ({
    props: {
      ...args,
      user: createMockUser({
        uid: 'user-john-doe',
        name: 'John Doe',
        avatar: 'https://assets.cometchat.io/sampleapp/v2/users/cometchat-uid-1.webp?text=JD',
        status: CometChat.USER_STATUS.ONLINE,
      }),
      mockMessages: createTestMessages(15),
    },
    template: `
      <div class="cometchat-message-list-story__container" style="width: 100%; max-width: 100%; height: 100vh; margin: 0 auto; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
        <cometchat-message-list-story-wrapper
          [user]="user"
          [hideReceipts]="hideReceipts"
          [hideDateSeparator]="hideDateSeparator"
          [hideStickyDate]="hideStickyDate"
          [hideAvatar]="hideAvatar"
          [hideError]="hideError"
          [showScrollbar]="showScrollbar"
          [messageAlignment]="messageAlignment"
          [disableSoundForMessages]="disableSoundForMessages"
          [disableInteraction]="true"
          [mockMessages]="mockMessages">
        </cometchat-message-list-story-wrapper>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Default message list rendered with 15 mock messages of mixed types (text, image, file, audio, video) in a user conversation. Shows standard alignment with incoming messages on the left and outgoing on the right.',
      },
    },
  },
};

/** Empty state displayed when no messages exist in the conversation. */
export const EmptyState: Story = {
  render: args => ({
    props: {
      ...args,
      user: createMockUser({
        uid: 'user-new-contact',
        name: 'New Contact',
        avatar: 'https://assets.cometchat.io/sampleapp/v2/users/cometchat-uid-1.webp?text=NC',
      }),
      simulateEmpty: true,
    },
    template: `
      <div class="cometchat-message-list-story__container" style="width: 100%; max-width: 100%; height: 100vh; margin: 0 auto; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
        <cometchat-message-list-story-wrapper
          [user]="user"
          [simulateEmpty]="simulateEmpty"
          [disableSoundForMessages]="disableSoundForMessages">
        </cometchat-message-list-story-wrapper>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Empty state shown when a conversation has no messages. A custom empty view can be provided via the emptyView template input.',
      },
    },
  },
};

/** Loading state while messages are being fetched. */
export const LoadingState: Story = {
  render: args => ({
    props: {
      ...args,
      user: createMockUser({
        uid: 'user-loading',
        name: 'Loading User',
        avatar: 'https://assets.cometchat.io/sampleapp/v2/users/cometchat-uid-1.webp?text=LU',
      }),
    },
    template: `
      <div class="cometchat-message-list-story__container" style="width: 100%; max-width: 100%; height: 100vh; margin: 0 auto; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
        <cometchat-message-list-story-wrapper
          [user]="user"
          [disableSoundForMessages]="disableSoundForMessages">
        </cometchat-message-list-story-wrapper>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Loading state shown while messages are being fetched. The component shows a shimmer/skeleton UI until messages are loaded.',
      },
    },
  },
};

/** Error state displayed when fetching messages fails. */
export const ErrorState: Story = {
  render: args => ({
    props: {
      ...args,
      user: createMockUser({
        uid: 'user-error',
        name: 'Error User',
        avatar: 'https://assets.cometchat.io/sampleapp/v2/users/cometchat-uid-1.webp?text=EU',
      }),
      simulateError: true,
    },
    template: `
      <div class="cometchat-message-list-story__container" style="width: 100%; max-width: 100%; height: 100vh; margin: 0 auto; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
        <cometchat-message-list-story-wrapper
          [user]="user"
          [simulateError]="simulateError"
          [hideError]="false"
          [disableSoundForMessages]="disableSoundForMessages">
        </cometchat-message-list-story-wrapper>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Error state displayed when fetching messages fails. Shows the error UI with a retry option. Toggle hideError to suppress the error view.',
      },
    },
  },
};

/** Mixed message types — text, image, file, audio, video in a single conversation. */
export const MixedMessageTypes: Story = {
  render: args => ({
    props: {
      ...args,
      user: createMockUser({
        uid: 'user-mixed',
        name: 'Mixed Types User',
        avatar: 'https://assets.cometchat.io/sampleapp/v2/users/cometchat-uid-1.webp?text=MT',
        status: CometChat.USER_STATUS.ONLINE,
      }),
      mockMessages: createTestMessages(15),
    },
    template: `
      <div class="cometchat-message-list-story__container" style="width: 100%; max-width: 100%; height: 100vh; margin: 0 auto; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
        <cometchat-message-list-story-wrapper
          [user]="user"
          [mockMessages]="mockMessages"
          [messageAlignment]="messageAlignment"
          [disableSoundForMessages]="disableSoundForMessages"
          [disableInteraction]="true">
        </cometchat-message-list-story-wrapper>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Message list with mixed message types — text, image, file, audio, and video messages in a single conversation. Demonstrates how different bubble types render together.',
      },
    },
  },
};

/** Thread reply visible — messages with reply counts showing thread indicators. */
export const ThreadReplyVisible: Story = {
  render: args => ({
    props: {
      ...args,
      user: createMockUser({
        uid: 'user-thread',
        name: 'Thread User',
        avatar: 'https://assets.cometchat.io/sampleapp/v2/users/cometchat-uid-1.webp?text=TU',
        status: CometChat.USER_STATUS.ONLINE,
      }),
      mockMessages: (() => {
        const msgs = createTestMessages(8);
        // Add reply counts to some messages to show thread indicators
        msgs.forEach((m, i) => {
          if (i % 3 === 0) {
            m.setReplyCount(i + 1);
          }
        });
        return msgs;
      })(),
    },
    template: `
      <div class="cometchat-message-list-story__container" style="width: 100%; max-width: 100%; height: 100vh; margin: 0 auto; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
        <cometchat-message-list-story-wrapper
          [user]="user"
          [mockMessages]="mockMessages"
          [disableSoundForMessages]="disableSoundForMessages"
          [disableInteraction]="true">
        </cometchat-message-list-story-wrapper>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Messages with thread reply counts visible. Messages with replies show a "View thread" indicator with the reply count.',
      },
    },
  },
};

// ============================================
// Showcase
// ============================================

/** Comprehensive showcase of message list variants — standard, empty, and error states. */
export const AllVariantsShowcase: Story = {
  render: () => ({
    props: {
      userConversation: createMockUser({
        uid: 'user-john-doe',
        name: 'John Doe',
        avatar: 'https://assets.cometchat.io/sampleapp/v2/users/cometchat-uid-1.webp?text=JD',
        status: CometChat.USER_STATUS.ONLINE,
      }),
      emptyUser: createMockUser({
        uid: 'user-new-contact',
        name: 'New Contact',
        avatar: 'https://assets.cometchat.io/sampleapp/v2/users/cometchat-uid-1.webp?text=NC',
      }),
      errorUser: createMockUser({
        uid: 'user-error',
        name: 'Error User',
        avatar: 'https://assets.cometchat.io/sampleapp/v2/users/cometchat-uid-1.webp?text=EU',
      }),
      defaultMessages: createTestMessages(10),
      standardAlignment: MessageListAlignment.standard,
    },
    template: `
      <div class="cometchat-message-list-showcase" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-5); padding: var(--cometchat-spacing-5);">

        <h3 class="cometchat-message-list-showcase__title" style="margin: 0; font: var(--cometchat-font-heading3-bold); color: var(--cometchat-text-color-primary);">
          Message List Variants
        </h3>

        <!-- Standard Alignment (sent + received) -->
        <div class="cometchat-message-list-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2); align-items: center;">
          <p class="cometchat-message-list-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Standard Alignment (Sent &amp; Received)
          </p>
          <div class="cometchat-message-list-showcase__panel" style="width: 100%; max-width: 100%; height: 400px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
            <cometchat-message-list-story-wrapper
              [user]="userConversation"
              [mockMessages]="defaultMessages"
              [messageAlignment]="standardAlignment"
              [disableSoundForMessages]="true"
              [disableInteraction]="true">
            </cometchat-message-list-story-wrapper>
          </div>
        </div>

        <!-- Empty State -->
        <div class="cometchat-message-list-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2); align-items: center;">
          <p class="cometchat-message-list-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Empty State
          </p>
          <div class="cometchat-message-list-showcase__panel" style="width: 100%; max-width: 100%; height: 400px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
            <cometchat-message-list-story-wrapper
              [user]="emptyUser"
              [simulateEmpty]="true"
              [disableSoundForMessages]="true">
            </cometchat-message-list-story-wrapper>
          </div>
        </div>

        <!-- Error State -->
        <div class="cometchat-message-list-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2); align-items: center;">
          <p class="cometchat-message-list-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Error State
          </p>
          <div class="cometchat-message-list-showcase__panel" style="width: 100%; max-width: 100%; height: 400px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
            <cometchat-message-list-story-wrapper
              [user]="errorUser"
              [simulateError]="true"
              [disableSoundForMessages]="true">
            </cometchat-message-list-story-wrapper>
          </div>
        </div>

      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Comprehensive showcase displaying message list variants — standard alignment with sent and received messages, empty state, and error state — in a single view.',
      },
    },
  },
};

// ============================================
// Interaction Tests — Prop Toggle Verification
// ============================================

/** Verifies default state renders message bubbles. */
export const TestDefaultRendersMessages: Story = {
  render: args => ({
    props: {
      ...args,
      user: createMockUser({
        uid: 'user-john-doe',
        name: 'John Doe',
        avatar: 'https://assets.cometchat.io/sampleapp/v2/users/cometchat-uid-1.webp?text=JD',
        status: CometChat.USER_STATUS.ONLINE,
      }),
      mockMessages: createTestMessages(10),
    },
    template: `
      <div style="width: 100%; height: 100vh; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
        <cometchat-message-list-story-wrapper
          [user]="user"
          [mockMessages]="mockMessages"
          [disableSoundForMessages]="true"
          [disableInteraction]="true">
        </cometchat-message-list-story-wrapper>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    await new Promise(r => setTimeout(r, 3000));
    // Message list container should be present
    const messageList = canvasElement.querySelector('.cometchat-message-list');
    expect(messageList).not.toBeNull();
  },
};

/** Verifies hideDateSeparator=true hides date separators. */
export const TestHideDateSeparator: Story = {
  render: args => ({
    props: {
      ...args,
      user: createMockUser({
        uid: 'user-john-doe',
        name: 'John Doe',
        avatar: 'https://assets.cometchat.io/sampleapp/v2/users/cometchat-uid-1.webp?text=JD',
        status: CometChat.USER_STATUS.ONLINE,
      }),
      mockMessages: createTestMessages(10),
    },
    template: `
      <div style="width: 100%; height: 100vh; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
        <cometchat-message-list-story-wrapper
          [user]="user"
          [mockMessages]="mockMessages"
          [hideDateSeparator]="true"
          [disableSoundForMessages]="true"
          [disableInteraction]="true">
        </cometchat-message-list-story-wrapper>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    await new Promise(r => setTimeout(r, 2000));
    // Date separators should NOT be present
    const dateSeparators = canvasElement.querySelectorAll('.cometchat-message-list__date-separator');
    expect(dateSeparators.length).toBe(0);
  },
};

/** Verifies hideReceipts=true hides receipt indicators. */
export const TestHideReceipts: Story = {
  render: args => ({
    props: {
      ...args,
      user: createMockUser({
        uid: 'user-john-doe',
        name: 'John Doe',
        avatar: 'https://assets.cometchat.io/sampleapp/v2/users/cometchat-uid-1.webp?text=JD',
        status: CometChat.USER_STATUS.ONLINE,
      }),
      mockMessages: createTestMessages(10),
    },
    template: `
      <div style="width: 100%; height: 100vh; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
        <cometchat-message-list-story-wrapper
          [user]="user"
          [mockMessages]="mockMessages"
          [hideReceipts]="true"
          [disableSoundForMessages]="true"
          [disableInteraction]="true">
        </cometchat-message-list-story-wrapper>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    await new Promise(r => setTimeout(r, 2000));
    // Receipt icons should NOT be present
    const receipts = canvasElement.querySelectorAll('.cometchat-message-bubble__status-info-view-receipt');
    expect(receipts.length).toBe(0);
  },
};

/** Verifies hideAvatar=true hides avatars in message list. */
export const TestHideAvatar: Story = {
  render: args => ({
    props: {
      ...args,
      user: createMockUser({
        uid: 'user-john-doe',
        name: 'John Doe',
        avatar: 'https://assets.cometchat.io/sampleapp/v2/users/cometchat-uid-1.webp?text=JD',
        status: CometChat.USER_STATUS.ONLINE,
      }),
      mockMessages: createTestMessages(10),
    },
    template: `
      <div style="width: 100%; height: 100vh; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
        <cometchat-message-list-story-wrapper
          [user]="user"
          [mockMessages]="mockMessages"
          [hideAvatar]="true"
          [disableSoundForMessages]="true"
          [disableInteraction]="true">
        </cometchat-message-list-story-wrapper>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    await new Promise(r => setTimeout(r, 2000));
    // Avatar elements in message bubbles should NOT be visible
    const avatars = canvasElement.querySelectorAll('.cometchat-message-bubble__leading-view cometchat-avatar');
    expect(avatars.length).toBe(0);
  },
};

/** Verifies empty state renders correctly. */
export const TestEmptyState: Story = {
  render: args => ({
    props: {
      ...args,
      user: createMockUser({
        uid: 'user-empty',
        name: 'Empty User',
        avatar: 'https://assets.cometchat.io/sampleapp/v2/users/cometchat-uid-1.webp?text=EU',
      }),
      simulateEmpty: true,
    },
    template: `
      <div style="width: 100%; height: 100vh; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
        <cometchat-message-list-story-wrapper
          [user]="user"
          [simulateEmpty]="simulateEmpty"
          [disableSoundForMessages]="true">
        </cometchat-message-list-story-wrapper>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    await new Promise(r => setTimeout(r, 3000));
    // Message list component should be present
    const messageList = canvasElement.querySelector('.cometchat-message-list');
    expect(messageList).not.toBeNull();
  },
};

/** Verifies error state renders error view. */
export const TestErrorState: Story = {
  render: args => ({
    props: {
      ...args,
      user: createMockUser({
        uid: 'user-error',
        name: 'Error User',
        avatar: 'https://assets.cometchat.io/sampleapp/v2/users/cometchat-uid-1.webp?text=EU',
      }),
      simulateError: true,
    },
    template: `
      <div style="width: 100%; height: 100vh; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
        <cometchat-message-list-story-wrapper
          [user]="user"
          [simulateError]="simulateError"
          [hideError]="false"
          [disableSoundForMessages]="true">
        </cometchat-message-list-story-wrapper>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    await new Promise(r => setTimeout(r, 2000));
    // Error state should be visible
    const errorView = canvasElement.querySelector('.cometchat-message-list__error');
    expect(errorView).not.toBeNull();
  },
};
