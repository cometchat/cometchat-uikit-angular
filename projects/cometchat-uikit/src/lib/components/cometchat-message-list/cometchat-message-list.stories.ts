/**
 * CometChatMessageList Storybook Stories
 *
 * Interactive stories demonstrating the message list component variants:
 * - Default message list with mixed message types
 * - Empty state when no messages exist
 * - Pin and save indicators on a message bubble
 * - Message options carrying the Organise group and the thread follow entry
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
import { PinSaveService } from '../../services/pin-save.service';
import { ThreadSubscriptionService } from '../../services/thread-subscription.service';
import { COMETCHAT_GLOBAL_CONFIG } from '../../services/global-config.service';
import { CometChatPinSaveEvents } from '../../events/CometChatPinSaveEvents';
import { CometChatThreadEvents } from '../../events/CometChatThreadEvents';
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
// Mock Data — Pin, Save & Thread Subscription
// ============================================

/** How a fixture message is marked before the list receives it. */
interface MarkedMessageSpec {
  text: string;
  /** Sent by the logged-in user rather than by the other participant. */
  own?: boolean;
  /** Pinned by a member. A pin is conversation-wide, so everyone sees it. */
  pinned?: boolean;
  /** Pinned by the app. Nobody can lift one, so Unpin is withheld on it. */
  systemPinned?: boolean;
  /** Saved by the viewer. A save is per-viewer, so only this user sees it. */
  saved?: boolean;
  /** The viewer follows this message's thread. */
  subscribed?: boolean;
}

/**
 * Builds a short conversation whose messages carry pin, save and thread-follow
 * state.
 *
 * `baseId` is a parameter because the pin/save and thread buses are static and
 * reach every list mounted on the page at once — two stories sharing a message
 * id would answer each other's events, so each story gets its own range.
 *
 * The marks go on through the SDK's own setters, so presence is what the
 * component reads back: an unmarked message leaves `pinnedAt` and `savedAt`
 * unset rather than zeroing them, which is the distinction the kit tests for.
 */
function createMarkedMessages(baseId: number, specs: MarkedMessageSpec[]): CometChat.BaseMessage[] {
  const other = createMockUser({
    uid: 'user-jane-smith',
    name: 'Jane Smith',
    avatar: 'https://assets.cometchat.io/sampleapp/v2/users/cometchat-uid-1.webp?text=JS',
  });
  const me = createMockUser({
    uid: 'user-john-doe',
    name: 'John Doe',
    avatar: 'https://assets.cometchat.io/sampleapp/v2/users/cometchat-uid-1.webp?text=JD',
  });
  const baseTime = Math.floor(Date.now() / 1000);

  return specs.map((spec, i) => {
    const message = createMockMessage('text', {
      id: baseId + i,
      text: spec.text,
      sentAt: baseTime - (specs.length - i) * 180,
      sender: spec.own ? me : other,
    });

    if (spec.pinned || spec.systemPinned) {
      message.setPinnedAt(baseTime - 120);
      message.setPinnedBy(spec.systemPinned ? 'app_system' : other.getUid());
    }
    if (spec.saved) {
      message.setSavedAt(baseTime - 60);
    }
    if (spec.subscribed) {
      message.setThreadSubscribed(true);
    }

    return message;
  });
}

/**
 * Creates a mock PinSaveService for Storybook stories.
 *
 * The real service writes to the server before anything else, so in Storybook
 * every action would fail and revert. This one applies the same optimistic
 * change locally and publishes it on the shared bus, which is what the message
 * list subscribes to — so a bubble redraws exactly as it does in an app.
 */
function createMockPinSaveService() {
  const now = (): number => Math.floor(Date.now() / 1000);

  return {
    isSupported: () => true,
    isPinEnabled: async () => true,
    isSaveEnabled: async () => true,
    isPinConversationEnabled: async () => false,
    isPinned: (message: CometChat.BaseMessage) => !!message?.getPinnedAt?.(),
    isSaved: (message: CometChat.BaseMessage) => !!message?.getSavedAt?.(),
    pinnedBy: (message: CometChat.BaseMessage) => message?.getPinnedBy?.() ?? null,
    isSystemPin: (message: CometChat.BaseMessage) => message?.getPinnedBy?.() === 'app_system',
    getConfiguredLimit: async () => null,
    run: async (action: 'pin' | 'unpin' | 'save' | 'unsave', message: CometChat.BaseMessage) => {
      switch (action) {
        case 'pin':
          message.setPinnedAt(now());
          message.setPinnedBy('user-john-doe');
          CometChatPinSaveEvents.publishMessagePinned({ message });
          break;
        case 'unpin':
          // Cleared rather than zeroed — the presence of the timestamp IS the
          // boolean, so a leftover 0 would read as pinned at the epoch.
          message.setPinnedAt(undefined);
          message.setPinnedBy(undefined);
          CometChatPinSaveEvents.publishMessageUnpinned({ message });
          break;
        case 'save':
          message.setSavedAt(now());
          CometChatPinSaveEvents.publishMessageSaved({ message });
          break;
        case 'unsave':
          message.setSavedAt(undefined);
          CometChatPinSaveEvents.publishMessageUnsaved({ message });
          break;
      }
      return message;
    },
  };
}

/**
 * Creates a mock ThreadSubscriptionService for Storybook stories.
 *
 * `toggle` publishes rather than writing the flag itself, because that is the
 * real path: the list is what stamps the messages it holds, off this same bus,
 * and the option's title is read straight back off the message afterwards.
 */
function createMockThreadSubscriptionService(options: {
  supported?: boolean;
  /** Threads whose parent has gone; keyed by id, as the real isUnavailable is. */
  unavailableThreadIds?: number[];
} = {}) {
  const gone = new Set((options.unavailableThreadIds ?? []).map(Number));

  return {
    isSupported: () => options.supported ?? true,
    isUnavailable: (parentMessageId: number) => gone.has(Number(parentMessageId)),
    isFollowing: (message: CometChat.BaseMessage | null | undefined) =>
      !!message?.isThreadSubscribed?.(),
    mirrorSubscribed: () => {},
    applyIncomingReply: () => {},
    toggle: (message: CometChat.BaseMessage) => {
      const subscribed = !message.isThreadSubscribed?.();
      CometChatThreadEvents.publishThreadSubscriptionChanged({
        // A reply resolves to its parent: there are no nested threads, so the
        // action always names the thread the user is reading.
        parentMessageId: message.getParentMessageId() || message.getId(),
        subscribed,
      });
      return subscribed;
    },
  };
}

/**
 * Wrapper for the pin, save and thread-subscription stories.
 *
 * Separate from the wrapper above because every affordance these stories cover
 * lives inside the options menu, and the existing stories deliberately render
 * with interaction switched off.
 */
@Component({
  selector: 'cometchat-message-list-markers-story-wrapper',
  standalone: true,
  imports: [CommonModule, CometChatMessageListComponent],
  template: `
    <cometchat-message-list
      [user]="user"
      [quickOptionsCount]="quickOptionsCount"
      [disableInteraction]="disableInteraction"
      [disableSoundForMessages]="true"
      [hidePinMessageOption]="hidePinMessageOption"
      [hideUnpinMessageOption]="hideUnpinMessageOption"
      [hideSaveMessageOption]="hideSaveMessageOption"
      [hideUnsaveMessageOption]="hideUnsaveMessageOption"
      [hideThreadSubscriptionOption]="hideThreadSubscriptionOption"
      [messagesRequestBuilder]="mockRequestBuilder"
    >
    </cometchat-message-list>
  `,
})
class CometChatMessageListMarkersStoryWrapperComponent implements OnChanges {
  @Input() user?: CometChat.User;
  @Input() quickOptionsCount = 3;
  @Input() disableInteraction = false;
  @Input() hidePinMessageOption = false;
  @Input() hideUnpinMessageOption = false;
  @Input() hideSaveMessageOption = false;
  @Input() hideUnsaveMessageOption = false;
  @Input() hideThreadSubscriptionOption = false;
  @Input() mockMessages: CometChat.BaseMessage[] = [];

  /**
   * Built once, for the same reason as the wrapper above: a fresh object on
   * every change detection cycle re-triggers the fetch.
   */
  mockRequestBuilder: any = null;

  constructor() {
    // Patch getLoggedinUser before any component initializes — without it the
    // list has no idea which messages are the user's own, and the options that
    // depend on authorship never appear.
    const loggedInUser = createMockUser({
      uid: 'user-john-doe',
      name: 'John Doe',
      avatar: 'https://assets.cometchat.io/sampleapp/v2/users/cometchat-uid-1.webp?text=JD',
    });
    (CometChat as any).getLoggedinUser = async () => loggedInUser;
  }

  ngOnChanges(_changes: SimpleChanges): void {
    if (this.mockRequestBuilder || this.mockMessages.length === 0) { return; }

    const manager = new MockMessagesManager(this.mockMessages);
    const builder: any = {};
    // All methods the service may call — each returns the same builder for chaining
    const chainMethods = [
      'setLimit', 'setUID', 'setGUID', 'setCategories', 'setTypes',
      'hideReplies', 'setTimestamp', 'setMessageId', 'setParentMessageId',
      'withParent', 'hideDeletedMessages', 'setAttachmentTypes', 'hasLinks',
      'setSearchKeyword', 'setUnread', 'setConversationType',
    ];
    chainMethods.forEach(m => { builder[m] = () => builder; });
    builder.build = () => ({
      fetchPrevious: () => manager.fetchPreviousMessages(),
      fetchNext: async () => [],
    });
    this.mockRequestBuilder = builder;
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
      imports: [
        CommonModule,
        CometChatMessageListStoryWrapperComponent,
        CometChatMessageListMarkersStoryWrapperComponent,
      ],
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
    quickOptionsCount: {
      control: 'number',
      description: 'How many options stay as bare icons on the bubble before the rest fold into the overflow menu',
      table: {
        type: { summary: 'number' },
        defaultValue: { summary: '3' },
        category: 'Message Options',
      },
    },
    hidePinMessageOption: {
      control: 'boolean',
      description: 'Hide "Pin message" from the Organise group',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'Message Options',
      },
    },
    hideUnpinMessageOption: {
      control: 'boolean',
      description: 'Hide "Unpin message" from the Organise group',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'Message Options',
      },
    },
    hideSaveMessageOption: {
      control: 'boolean',
      description: 'Hide "Save message" from the Organise group',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'Message Options',
      },
    },
    hideUnsaveMessageOption: {
      control: 'boolean',
      description: 'Hide "Unsave message" from the Organise group',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'Message Options',
      },
    },
    hideThreadSubscriptionOption: {
      control: 'boolean',
      description: 'Hide the thread subscribe/unsubscribe option without turning the feature off',
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
    threadSubscriptionChange: {
      action: 'threadSubscriptionChange',
      description:
        'Emitted whenever a thread subscription changes, whoever caused it — this list, the thread header, or the server auto-subscribing the user',
      table: {
        type: { summary: 'EventEmitter<IThreadSubscriptionChanged>' },
        category: 'Events',
      },
    },
  },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'CometChatMessageList displays a real-time, scrollable list of messages for the active conversation. Supports infinite scrolling, date separators, message alignment (standard/left), read receipts, AI features (smart replies, conversation starters), thread replies, thread subscription, pin and save indicators with the Organise options group, reactions, and full keyboard/ARIA accessibility.',
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

/** A pinned message, showing the conversation-wide pin marker on its bubble. */
export const PinnedMessage: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        { provide: PinSaveService, useFactory: () => createMockPinSaveService() },
        {
          provide: ThreadSubscriptionService,
          useFactory: () => createMockThreadSubscriptionService(),
        },
        {
          provide: COMETCHAT_GLOBAL_CONFIG,
          useValue: {
            enablePinMessage: true,
            enableSaveMessage: true,
            enableThreadSubscription: true,
          },
        },
      ],
    }),
  ],
  render: args => ({
    props: {
      ...args,
      user: createMockUser({
        uid: 'user-jane-smith',
        name: 'Jane Smith',
        avatar: 'https://assets.cometchat.io/sampleapp/v2/users/cometchat-uid-1.webp?text=JS',
        status: CometChat.USER_STATUS.ONLINE,
      }),
      mockMessages: createMarkedMessages(7101, [
        { text: 'Sprint review has moved to Thursday.' },
        { text: 'Agenda and the demo order are both in here.', pinned: true },
        { text: 'Got it, added to my calendar.', own: true },
        { text: 'See you all there.' },
      ]),
    },
    template: `
      <div class="cometchat-message-list-story__container" style="width: 100%; max-width: 100%; height: 100vh; margin: 0 auto; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
        <cometchat-message-list-markers-story-wrapper
          [user]="user"
          [mockMessages]="mockMessages"
          [disableInteraction]="true">
        </cometchat-message-list-markers-story-wrapper>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'A conversation where the second message carries a pin. The marker sits in the status row just before the timestamp, and every member of the conversation sees it — a pin is conversation-wide.',
      },
    },
  },
};

/** A saved message, showing the private bookmark marker on its bubble. */
export const SavedMessage: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        { provide: PinSaveService, useFactory: () => createMockPinSaveService() },
        {
          provide: ThreadSubscriptionService,
          useFactory: () => createMockThreadSubscriptionService(),
        },
        {
          provide: COMETCHAT_GLOBAL_CONFIG,
          useValue: {
            enablePinMessage: true,
            enableSaveMessage: true,
            enableThreadSubscription: true,
          },
        },
      ],
    }),
  ],
  render: args => ({
    props: {
      ...args,
      user: createMockUser({
        uid: 'user-jane-smith',
        name: 'Jane Smith',
        avatar: 'https://assets.cometchat.io/sampleapp/v2/users/cometchat-uid-1.webp?text=JS',
        status: CometChat.USER_STATUS.ONLINE,
      }),
      mockMessages: createMarkedMessages(7201, [
        { text: 'Sending over the office door code.' },
        { text: 'The code is 4417, valid until the end of the month.', saved: true },
        { text: 'Thanks, keeping that one handy.', own: true },
      ]),
    },
    template: `
      <div class="cometchat-message-list-story__container" style="width: 100%; max-width: 100%; height: 100vh; margin: 0 auto; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
        <cometchat-message-list-markers-story-wrapper
          [user]="user"
          [mockMessages]="mockMessages"
          [disableInteraction]="true">
        </cometchat-message-list-markers-story-wrapper>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'The same status row carrying a save instead of a pin. A save is private to the viewer, so this marker appears only on the copy belonging to the user who saved the message and never on anyone else in the conversation.',
      },
    },
  },
};

/** A message that is both pinned and saved, showing the order of the two markers. */
export const PinnedAndSavedMessage: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        { provide: PinSaveService, useFactory: () => createMockPinSaveService() },
        {
          provide: ThreadSubscriptionService,
          useFactory: () => createMockThreadSubscriptionService(),
        },
        {
          provide: COMETCHAT_GLOBAL_CONFIG,
          useValue: {
            enablePinMessage: true,
            enableSaveMessage: true,
            enableThreadSubscription: true,
          },
        },
      ],
    }),
  ],
  render: args => ({
    props: {
      ...args,
      user: createMockUser({
        uid: 'user-jane-smith',
        name: 'Jane Smith',
        avatar: 'https://assets.cometchat.io/sampleapp/v2/users/cometchat-uid-1.webp?text=JS',
        status: CometChat.USER_STATUS.ONLINE,
      }),
      mockMessages: createMarkedMessages(7301, [
        { text: 'Release checklist for tomorrow, in order.' },
        { text: 'Freeze at 09:00, smoke tests at 10:00, ship at 11:00.', pinned: true, saved: true },
        { text: 'Pinned it for the team and saved a copy for myself.', own: true },
      ]),
    },
    template: `
      <div class="cometchat-message-list-story__container" style="width: 100%; max-width: 100%; height: 100vh; margin: 0 auto; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
        <cometchat-message-list-markers-story-wrapper
          [user]="user"
          [mockMessages]="mockMessages"
          [disableInteraction]="true">
        </cometchat-message-list-markers-story-wrapper>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Both markers on one bubble, reading saved, then pinned, then the time. The private state leads and the shared one sits nearer the timestamp it qualifies; each dot only renders with content on both sides of it, so it can never dangle.',
      },
    },
  },
};

/** Message options with the Organise group, which holds Pin and Save. */
export const OrganiseMessageOptions: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        { provide: PinSaveService, useFactory: () => createMockPinSaveService() },
        {
          provide: ThreadSubscriptionService,
          useFactory: () => createMockThreadSubscriptionService(),
        },
        {
          provide: COMETCHAT_GLOBAL_CONFIG,
          useValue: {
            enablePinMessage: true,
            enableSaveMessage: true,
            enableThreadSubscription: true,
          },
        },
      ],
    }),
  ],
  render: args => ({
    props: {
      ...args,
      user: createMockUser({
        uid: 'user-jane-smith',
        name: 'Jane Smith',
        avatar: 'https://assets.cometchat.io/sampleapp/v2/users/cometchat-uid-1.webp?text=JS',
        status: CometChat.USER_STATUS.ONLINE,
      }),
      mockMessages: createMarkedMessages(7401, [
        { text: 'Anyone got the link to the design review?' },
        { text: 'Here it is, along with the notes from last week.' },
        { text: 'Perfect, thanks.', own: true },
      ]),
    },
    template: `
      <div class="cometchat-message-list-story__container" style="width: 100%; max-width: 100%; height: 100vh; margin: 0 auto; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
        <cometchat-message-list-markers-story-wrapper
          [user]="user"
          [mockMessages]="mockMessages">
        </cometchat-message-list-markers-story-wrapper>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    await new Promise(r => setTimeout(r, 2000));
    // Options only appear on hover, so a static render would show none of them.
    const body = canvasElement.querySelector('[data-message-id="7402"] .cometchat-message-bubble__body') as HTMLElement;
    if (body) {
      body.dispatchEvent(new MouseEvent('mouseenter'));
      await new Promise(r => setTimeout(r, 300));
    }
    // Held before the click: opening portals the menu to document.body, out of
    // this story's canvas, and every closed menu on the page carries the same
    // id — so a query by id afterwards could just as easily find another one.
    const subMenu = canvasElement.querySelector('[data-message-id="7402"] #subMenuContext') as HTMLElement;

    const moreButton = canvasElement.querySelector('[data-message-id="7402"] .cometchat-menu-list__sub-menu') as HTMLElement;
    if (moreButton) {
      moreButton.click();
      await new Promise(r => setTimeout(r, 500));
    }
    const group = subMenu?.querySelector('#organise') as HTMLElement | null;
    if (group) {
      group.click();
      await new Promise(r => setTimeout(r, 500));
    }
  },
  parameters: {
    docs: {
      description: {
        story:
          'The overflow menu on an unmarked message, with the Organise row activated so its flyout is open. Organise gathers Pin and Save into one row of an already long menu, and the group itself never acts — clicking it only opens the flyout.',
      },
    },
  },
};

/** The Organise group on an already pinned and saved message, offering the reverse actions. */
export const OrganiseOptionsOnAMarkedMessage: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        { provide: PinSaveService, useFactory: () => createMockPinSaveService() },
        {
          provide: ThreadSubscriptionService,
          useFactory: () => createMockThreadSubscriptionService(),
        },
        {
          provide: COMETCHAT_GLOBAL_CONFIG,
          useValue: {
            enablePinMessage: true,
            enableSaveMessage: true,
            enableThreadSubscription: true,
          },
        },
      ],
    }),
  ],
  render: args => ({
    props: {
      ...args,
      user: createMockUser({
        uid: 'user-jane-smith',
        name: 'Jane Smith',
        avatar: 'https://assets.cometchat.io/sampleapp/v2/users/cometchat-uid-1.webp?text=JS',
        status: CometChat.USER_STATUS.ONLINE,
      }),
      mockMessages: createMarkedMessages(7501, [
        { text: 'Parking is on level 3 this week.' },
        { text: 'Badge readers are on the north stairwell only.', pinned: true, saved: true },
        { text: 'Noted.', own: true },
      ]),
    },
    template: `
      <div class="cometchat-message-list-story__container" style="width: 100%; max-width: 100%; height: 100vh; margin: 0 auto; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
        <cometchat-message-list-markers-story-wrapper
          [user]="user"
          [mockMessages]="mockMessages">
        </cometchat-message-list-markers-story-wrapper>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    await new Promise(r => setTimeout(r, 2000));
    const body = canvasElement.querySelector('[data-message-id="7502"] .cometchat-message-bubble__body') as HTMLElement;
    if (body) {
      body.dispatchEvent(new MouseEvent('mouseenter'));
      await new Promise(r => setTimeout(r, 300));
    }
    // Held before the click: opening portals the menu to document.body, out of
    // this story's canvas, and every closed menu on the page carries the same
    // id — so a query by id afterwards could just as easily find another one.
    const subMenu = canvasElement.querySelector('[data-message-id="7502"] #subMenuContext') as HTMLElement;

    const moreButton = canvasElement.querySelector('[data-message-id="7502"] .cometchat-menu-list__sub-menu') as HTMLElement;
    if (moreButton) {
      moreButton.click();
      await new Promise(r => setTimeout(r, 500));
    }
    const group = subMenu?.querySelector('#organise') as HTMLElement | null;
    if (group) {
      group.click();
      await new Promise(r => setTimeout(r, 500));
    }
  },
  parameters: {
    docs: {
      description: {
        story:
          'The same flyout on a message that is already pinned and saved, now offering Unpin and Unsave. Each action appears in one direction only — the presence of the timestamp is the state, so there is never a pair to choose between and no third unknown state to draw.',
      },
    },
  },
};

/** A pin placed by the app, where Unpin is withheld because nobody can lift it. */
export const SystemPinnedMessage: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        { provide: PinSaveService, useFactory: () => createMockPinSaveService() },
        {
          provide: ThreadSubscriptionService,
          useFactory: () => createMockThreadSubscriptionService(),
        },
        {
          provide: COMETCHAT_GLOBAL_CONFIG,
          useValue: {
            enablePinMessage: true,
            enableSaveMessage: true,
            enableThreadSubscription: true,
          },
        },
      ],
    }),
  ],
  render: args => ({
    props: {
      ...args,
      user: createMockUser({
        uid: 'user-jane-smith',
        name: 'Jane Smith',
        avatar: 'https://assets.cometchat.io/sampleapp/v2/users/cometchat-uid-1.webp?text=JS',
        status: CometChat.USER_STATUS.ONLINE,
      }),
      mockMessages: createMarkedMessages(7601, [
        { text: 'Morning all.' },
        { text: 'Support hours are 09:00 to 18:00, Monday to Friday.', systemPinned: true },
        { text: 'Good to know.', own: true },
      ]),
    },
    template: `
      <div class="cometchat-message-list-story__container" style="width: 100%; max-width: 100%; height: 100vh; margin: 0 auto; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
        <cometchat-message-list-markers-story-wrapper
          [user]="user"
          [mockMessages]="mockMessages">
        </cometchat-message-list-markers-story-wrapper>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    await new Promise(r => setTimeout(r, 2000));
    const body = canvasElement.querySelector('[data-message-id="7602"] .cometchat-message-bubble__body') as HTMLElement;
    if (body) {
      body.dispatchEvent(new MouseEvent('mouseenter'));
      await new Promise(r => setTimeout(r, 300));
    }
    // Held before the click: opening portals the menu to document.body, out of
    // this story's canvas, and every closed menu on the page carries the same
    // id — so a query by id afterwards could just as easily find another one.
    const subMenu = canvasElement.querySelector('[data-message-id="7602"] #subMenuContext') as HTMLElement;

    const moreButton = canvasElement.querySelector('[data-message-id="7602"] .cometchat-menu-list__sub-menu') as HTMLElement;
    if (moreButton) {
      moreButton.click();
      await new Promise(r => setTimeout(r, 500));
    }
    const group = subMenu?.querySelector('#organise') as HTMLElement | null;
    if (group) {
      group.click();
      await new Promise(r => setTimeout(r, 500));
    }
  },
  parameters: {
    docs: {
      description: {
        story:
          'A pin the app placed rather than a member. The bubble shows the same marker, but the flyout offers Save alone: the server refuses to lift a system pin for anyone, so offering Unpin would only produce an error.',
      },
    },
  },
};

/** The thread subscription option, on a message the user does not follow. */
export const ThreadSubscriptionOption: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        { provide: PinSaveService, useFactory: () => createMockPinSaveService() },
        {
          provide: ThreadSubscriptionService,
          useFactory: () => createMockThreadSubscriptionService(),
        },
        {
          provide: COMETCHAT_GLOBAL_CONFIG,
          useValue: {
            enablePinMessage: true,
            enableSaveMessage: true,
            enableThreadSubscription: true,
          },
        },
      ],
    }),
  ],
  render: args => ({
    props: {
      ...args,
      user: createMockUser({
        uid: 'user-jane-smith',
        name: 'Jane Smith',
        avatar: 'https://assets.cometchat.io/sampleapp/v2/users/cometchat-uid-1.webp?text=JS',
        status: CometChat.USER_STATUS.ONLINE,
      }),
      mockMessages: createMarkedMessages(7701, [
        { text: 'Kicking off the migration plan here.' },
        { text: 'Replies to this one, please, so it all stays in one place.' },
        { text: 'Will do.', own: true },
      ]),
    },
    template: `
      <div class="cometchat-message-list-story__container" style="width: 100%; max-width: 100%; height: 100vh; margin: 0 auto; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
        <cometchat-message-list-markers-story-wrapper
          [user]="user"
          [mockMessages]="mockMessages">
        </cometchat-message-list-markers-story-wrapper>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    await new Promise(r => setTimeout(r, 2000));
    const body = canvasElement.querySelector('[data-message-id="7702"] .cometchat-message-bubble__body') as HTMLElement;
    if (body) {
      body.dispatchEvent(new MouseEvent('mouseenter'));
      await new Promise(r => setTimeout(r, 300));
    }
    const moreButton = canvasElement.querySelector('[data-message-id="7702"] .cometchat-menu-list__sub-menu') as HTMLElement;
    if (moreButton) {
      moreButton.click();
      await new Promise(r => setTimeout(r, 500));
    }
  },
  parameters: {
    docs: {
      description: {
        story:
          'The menu open on a message nobody has replied to yet, showing "Subscribe to thread" directly under "Reply in thread". Following a message with no replies is the point of the option — it is how a user asks to hear about the first answer.',
      },
    },
  },
};

/** The same option on a followed thread, where the title names the reverse action. */
export const ThreadSubscriptionFollowing: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        { provide: PinSaveService, useFactory: () => createMockPinSaveService() },
        {
          provide: ThreadSubscriptionService,
          useFactory: () => createMockThreadSubscriptionService(),
        },
        {
          provide: COMETCHAT_GLOBAL_CONFIG,
          useValue: {
            enablePinMessage: true,
            enableSaveMessage: true,
            enableThreadSubscription: true,
          },
        },
      ],
    }),
  ],
  render: args => ({
    props: {
      ...args,
      user: createMockUser({
        uid: 'user-jane-smith',
        name: 'Jane Smith',
        avatar: 'https://assets.cometchat.io/sampleapp/v2/users/cometchat-uid-1.webp?text=JS',
        status: CometChat.USER_STATUS.ONLINE,
      }),
      mockMessages: createMarkedMessages(7801, [
        { text: 'Migration plan, continued.' },
        { text: 'Rollback steps are in the replies to this message.', subscribed: true },
        { text: 'Following that one.', own: true },
      ]),
    },
    template: `
      <div class="cometchat-message-list-story__container" style="width: 100%; max-width: 100%; height: 100vh; margin: 0 auto; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
        <cometchat-message-list-markers-story-wrapper
          [user]="user"
          [mockMessages]="mockMessages">
        </cometchat-message-list-markers-story-wrapper>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    await new Promise(r => setTimeout(r, 2000));
    const body = canvasElement.querySelector('[data-message-id="7802"] .cometchat-message-bubble__body') as HTMLElement;
    if (body) {
      body.dispatchEvent(new MouseEvent('mouseenter'));
      await new Promise(r => setTimeout(r, 300));
    }
    const moreButton = canvasElement.querySelector('[data-message-id="7802"] .cometchat-menu-list__sub-menu') as HTMLElement;
    if (moreButton) {
      moreButton.click();
      await new Promise(r => setTimeout(r, 500));
    }
  },
  parameters: {
    docs: {
      description: {
        story:
          'The same entry reading "Unsubscribe from thread", because the server has stamped this message as followed. One option id carries both states and its title flips on that flag; there is no pending or disabled variant, since the toggle is optimistic and flips the moment it is tapped.',
      },
    },
  },
};

/** Every pin, save and thread option hidden, with the markers left in place. */
export const PinSaveAndThreadOptionsHidden: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        { provide: PinSaveService, useFactory: () => createMockPinSaveService() },
        {
          provide: ThreadSubscriptionService,
          useFactory: () => createMockThreadSubscriptionService(),
        },
        {
          provide: COMETCHAT_GLOBAL_CONFIG,
          useValue: {
            enablePinMessage: true,
            enableSaveMessage: true,
            enableThreadSubscription: true,
          },
        },
      ],
    }),
  ],
  render: args => ({
    props: {
      ...args,
      user: createMockUser({
        uid: 'user-jane-smith',
        name: 'Jane Smith',
        avatar: 'https://assets.cometchat.io/sampleapp/v2/users/cometchat-uid-1.webp?text=JS',
        status: CometChat.USER_STATUS.ONLINE,
      }),
      mockMessages: createMarkedMessages(7901, [
        { text: 'Read-only archive of the launch channel.' },
        { text: 'Everything below is kept for reference.', pinned: true, saved: true },
        { text: 'Understood.', own: true },
      ]),
    },
    template: `
      <div class="cometchat-message-list-story__container" style="width: 100%; max-width: 100%; height: 100vh; margin: 0 auto; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
        <cometchat-message-list-markers-story-wrapper
          [user]="user"
          [mockMessages]="mockMessages"
          [hidePinMessageOption]="true"
          [hideUnpinMessageOption]="true"
          [hideSaveMessageOption]="true"
          [hideUnsaveMessageOption]="true"
          [hideThreadSubscriptionOption]="true">
        </cometchat-message-list-markers-story-wrapper>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    await new Promise(r => setTimeout(r, 2000));
    const body = canvasElement.querySelector('[data-message-id="7902"] .cometchat-message-bubble__body') as HTMLElement;
    if (body) {
      body.dispatchEvent(new MouseEvent('mouseenter'));
      await new Promise(r => setTimeout(r, 300));
    }
    const moreButton = canvasElement.querySelector('[data-message-id="7902"] .cometchat-menu-list__sub-menu') as HTMLElement;
    if (moreButton) {
      moreButton.click();
      await new Promise(r => setTimeout(r, 500));
    }
  },
  parameters: {
    docs: {
      description: {
        story:
          'The four Organise flags and the thread flag all set, for an app that offers these actions elsewhere. Organise disappears rather than opening onto an empty flyout, while the pin and save markers stay — hiding the actions unpins and unsaves nothing.',
      },
    },
  },
};

/** The unpin confirmation, the one half of each pair that asks before acting. */
export const UnpinConfirmation: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        { provide: PinSaveService, useFactory: () => createMockPinSaveService() },
        {
          provide: ThreadSubscriptionService,
          useFactory: () => createMockThreadSubscriptionService(),
        },
        {
          provide: COMETCHAT_GLOBAL_CONFIG,
          useValue: {
            enablePinMessage: true,
            enableSaveMessage: true,
            enableThreadSubscription: true,
          },
        },
      ],
    }),
  ],
  render: args => ({
    props: {
      ...args,
      user: createMockUser({
        uid: 'user-jane-smith',
        name: 'Jane Smith',
        avatar: 'https://assets.cometchat.io/sampleapp/v2/users/cometchat-uid-1.webp?text=JS',
        status: CometChat.USER_STATUS.ONLINE,
      }),
      mockMessages: createMarkedMessages(7011, [
        { text: 'Old venue details, no longer current.' },
        { text: 'We are back in the main building from Monday.', pinned: true },
        { text: 'Time to take the old one down.', own: true },
      ]),
    },
    template: `
      <div class="cometchat-message-list-story__container" style="width: 100%; max-width: 100%; height: 100vh; margin: 0 auto; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
        <cometchat-message-list-markers-story-wrapper
          [user]="user"
          [mockMessages]="mockMessages">
        </cometchat-message-list-markers-story-wrapper>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    await new Promise(r => setTimeout(r, 2000));
    const body = canvasElement.querySelector('[data-message-id="7012"] .cometchat-message-bubble__body') as HTMLElement;
    if (body) {
      body.dispatchEvent(new MouseEvent('mouseenter'));
      await new Promise(r => setTimeout(r, 300));
    }
    // Held before the click: opening portals the menu to document.body, out of
    // this story's canvas, and every closed menu on the page carries the same
    // id — so a query by id afterwards could just as easily find another one.
    const subMenu = canvasElement.querySelector('[data-message-id="7012"] #subMenuContext') as HTMLElement;

    const moreButton = canvasElement.querySelector('[data-message-id="7012"] .cometchat-menu-list__sub-menu') as HTMLElement;
    if (moreButton) {
      moreButton.click();
      await new Promise(r => setTimeout(r, 500));
    }
    const group = subMenu?.querySelector('#organise') as HTMLElement | null;
    if (group) {
      group.click();
      await new Promise(r => setTimeout(r, 500));
    }
    const unpin = subMenu?.querySelector('.cometchat-menu-list__group-flyout #unpinMessage') as HTMLElement | null;
    if (unpin) {
      unpin.click();
      await new Promise(r => setTimeout(r, 500));
    }
  },
  parameters: {
    docs: {
      description: {
        story:
          'Choosing Unpin opens a confirmation over the list instead of acting straight away. Only the removing half of each pair asks: pinning and saving run immediately because the same menu undoes them in one click, while an unpin takes the marker away for everyone in the conversation.',
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

/** Showcase of the pin and save markers — pinned, saved, and both on one bubble. */
export const MessageMarkersShowcase: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        { provide: PinSaveService, useFactory: () => createMockPinSaveService() },
        {
          provide: ThreadSubscriptionService,
          useFactory: () => createMockThreadSubscriptionService(),
        },
        {
          provide: COMETCHAT_GLOBAL_CONFIG,
          useValue: {
            enablePinMessage: true,
            enableSaveMessage: true,
            enableThreadSubscription: true,
          },
        },
      ],
    }),
  ],
  render: () => ({
    props: {
      markerUser: createMockUser({
        uid: 'user-jane-smith',
        name: 'Jane Smith',
        avatar: 'https://assets.cometchat.io/sampleapp/v2/users/cometchat-uid-1.webp?text=JS',
        status: CometChat.USER_STATUS.ONLINE,
      }),
      pinnedMessages: createMarkedMessages(7021, [
        { text: 'Agenda and the demo order are both in here.', pinned: true },
      ]),
      savedMessages: createMarkedMessages(7031, [
        { text: 'The code is 4417, valid until the end of the month.', saved: true },
      ]),
      bothMessages: createMarkedMessages(7041, [
        { text: 'Freeze at 09:00, smoke tests at 10:00, ship at 11:00.', pinned: true, saved: true },
      ]),
    },
    template: `
      <div class="cometchat-message-list-showcase" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-5); padding: var(--cometchat-spacing-5);">

        <h3 class="cometchat-message-list-showcase__title" style="margin: 0; font: var(--cometchat-font-heading3-bold); color: var(--cometchat-text-color-primary);">
          Pin &amp; Save Markers
        </h3>

        <!-- Pinned only -->
        <div class="cometchat-message-list-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2); align-items: center;">
          <p class="cometchat-message-list-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Pinned — everyone in the conversation sees this
          </p>
          <div class="cometchat-message-list-showcase__panel" style="width: 100%; max-width: 100%; height: 350px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
            <cometchat-message-list-markers-story-wrapper
              [user]="markerUser"
              [mockMessages]="pinnedMessages"
              [disableInteraction]="true">
            </cometchat-message-list-markers-story-wrapper>
          </div>
        </div>

        <!-- Saved only -->
        <div class="cometchat-message-list-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2); align-items: center;">
          <p class="cometchat-message-list-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Saved — private to the viewer
          </p>
          <div class="cometchat-message-list-showcase__panel" style="width: 100%; max-width: 100%; height: 350px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
            <cometchat-message-list-markers-story-wrapper
              [user]="markerUser"
              [mockMessages]="savedMessages"
              [disableInteraction]="true">
            </cometchat-message-list-markers-story-wrapper>
          </div>
        </div>

        <!-- Both markers -->
        <div class="cometchat-message-list-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2); align-items: center;">
          <p class="cometchat-message-list-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Both — saved, pinned, then the time
          </p>
          <div class="cometchat-message-list-showcase__panel" style="width: 100%; max-width: 100%; height: 350px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
            <cometchat-message-list-markers-story-wrapper
              [user]="markerUser"
              [mockMessages]="bothMessages"
              [disableInteraction]="true">
            </cometchat-message-list-markers-story-wrapper>
          </div>
        </div>

      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'The three marker combinations a bubble can carry — pinned, saved, and both — in a single view. All styling uses CometChat CSS variables for theme consistency.',
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

/** Verifies a pinned message renders the pin indicator on its bubble. */
export const TestPinnedIndicatorRenders: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        { provide: PinSaveService, useFactory: () => createMockPinSaveService() },
        {
          provide: ThreadSubscriptionService,
          useFactory: () => createMockThreadSubscriptionService(),
        },
        {
          provide: COMETCHAT_GLOBAL_CONFIG,
          useValue: {
            enablePinMessage: true,
            enableSaveMessage: true,
            enableThreadSubscription: true,
          },
        },
      ],
    }),
  ],
  render: args => ({
    props: {
      ...args,
      user: createMockUser({ uid: 'user-jane-smith', name: 'Jane Smith' }),
      mockMessages: createMarkedMessages(8101, [
        { text: 'Unmarked message.' },
        { text: 'Pinned message.', pinned: true },
      ]),
    },
    template: `
      <div style="width: 100%; height: 100vh; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
        <cometchat-message-list-markers-story-wrapper
          [user]="user"
          [mockMessages]="mockMessages"
          [disableInteraction]="true">
        </cometchat-message-list-markers-story-wrapper>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    await new Promise(r => setTimeout(r, 2000));
    const pinned = canvasElement.querySelectorAll('.cometchat-message-bubble__pinned-indicator');
    expect(pinned.length).toBe(1);

    const marked = canvasElement.querySelector('[data-message-id="8102"] .cometchat-message-bubble__pinned-indicator');
    expect(marked).not.toBeNull();
  },
};

/** Verifies a saved message renders the save indicator on its bubble. */
export const TestSavedIndicatorRenders: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        { provide: PinSaveService, useFactory: () => createMockPinSaveService() },
        {
          provide: ThreadSubscriptionService,
          useFactory: () => createMockThreadSubscriptionService(),
        },
        {
          provide: COMETCHAT_GLOBAL_CONFIG,
          useValue: {
            enablePinMessage: true,
            enableSaveMessage: true,
            enableThreadSubscription: true,
          },
        },
      ],
    }),
  ],
  render: args => ({
    props: {
      ...args,
      user: createMockUser({ uid: 'user-jane-smith', name: 'Jane Smith' }),
      mockMessages: createMarkedMessages(8201, [
        { text: 'Unmarked message.' },
        { text: 'Saved message.', saved: true },
      ]),
    },
    template: `
      <div style="width: 100%; height: 100vh; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
        <cometchat-message-list-markers-story-wrapper
          [user]="user"
          [mockMessages]="mockMessages"
          [disableInteraction]="true">
        </cometchat-message-list-markers-story-wrapper>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    await new Promise(r => setTimeout(r, 2000));
    const saved = canvasElement.querySelectorAll('.cometchat-message-bubble__saved-indicator');
    expect(saved.length).toBe(1);

    const marked = canvasElement.querySelector('[data-message-id="8202"] .cometchat-message-bubble__saved-indicator');
    expect(marked).not.toBeNull();
  },
};

/** Verifies the Organise group offers Pin and Save on an unmarked message. */
export const TestOrganiseGroupOffersPinAndSave: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        { provide: PinSaveService, useFactory: () => createMockPinSaveService() },
        {
          provide: ThreadSubscriptionService,
          useFactory: () => createMockThreadSubscriptionService(),
        },
        {
          provide: COMETCHAT_GLOBAL_CONFIG,
          useValue: {
            enablePinMessage: true,
            enableSaveMessage: true,
            enableThreadSubscription: true,
          },
        },
      ],
    }),
  ],
  render: args => ({
    props: {
      ...args,
      user: createMockUser({ uid: 'user-jane-smith', name: 'Jane Smith' }),
      mockMessages: createMarkedMessages(8301, [{ text: 'An unmarked message.' }]),
    },
    template: `
      <div style="width: 100%; height: 100vh; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
        <cometchat-message-list-markers-story-wrapper
          [user]="user"
          [mockMessages]="mockMessages">
        </cometchat-message-list-markers-story-wrapper>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    await new Promise(r => setTimeout(r, 2000));
    const body = canvasElement.querySelector('[data-message-id="8301"] .cometchat-message-bubble__body') as HTMLElement;
    expect(body).not.toBeNull();

    // Options only appear on hover.
    body.dispatchEvent(new MouseEvent('mouseenter'));
    await new Promise(r => setTimeout(r, 300));

    // Held before the click: opening portals the menu to document.body, out of
    // this story's canvas, and every closed menu on the page carries the same
    // id — so a query by id afterwards could just as easily find another one.
    const subMenu = canvasElement.querySelector('[data-message-id="8301"] #subMenuContext') as HTMLElement;
    expect(subMenu).not.toBeNull();

    const moreButton = canvasElement.querySelector('[data-message-id="8301"] .cometchat-menu-list__sub-menu') as HTMLElement;
    expect(moreButton).not.toBeNull();

    moreButton.click();
    await new Promise(r => setTimeout(r, 500));

    expect(subMenu.getAttribute('data-visible')).toBe('true');

    const group = subMenu.querySelector('#organise') as HTMLElement;
    expect(group).not.toBeNull();

    group.click();
    await new Promise(r => setTimeout(r, 500));

    const flyout = subMenu.querySelector('.cometchat-menu-list__group-flyout') as HTMLElement;
    expect(flyout).not.toBeNull();
    expect(flyout.querySelectorAll('[role="menuitem"]').length).toBe(2);
    expect(flyout.textContent!.trim()).toContain('Pin message');
    expect(flyout.textContent!.trim()).toContain('Save message');
  },
};

/** Verifies the Organise group offers Unpin and Unsave on a marked message. */
export const TestOrganiseGroupOffersUnpinAndUnsave: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        { provide: PinSaveService, useFactory: () => createMockPinSaveService() },
        {
          provide: ThreadSubscriptionService,
          useFactory: () => createMockThreadSubscriptionService(),
        },
        {
          provide: COMETCHAT_GLOBAL_CONFIG,
          useValue: {
            enablePinMessage: true,
            enableSaveMessage: true,
            enableThreadSubscription: true,
          },
        },
      ],
    }),
  ],
  render: args => ({
    props: {
      ...args,
      user: createMockUser({ uid: 'user-jane-smith', name: 'Jane Smith' }),
      mockMessages: createMarkedMessages(8401, [
        { text: 'A pinned and saved message.', pinned: true, saved: true },
      ]),
    },
    template: `
      <div style="width: 100%; height: 100vh; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
        <cometchat-message-list-markers-story-wrapper
          [user]="user"
          [mockMessages]="mockMessages">
        </cometchat-message-list-markers-story-wrapper>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    await new Promise(r => setTimeout(r, 2000));
    const body = canvasElement.querySelector('[data-message-id="8401"] .cometchat-message-bubble__body') as HTMLElement;
    expect(body).not.toBeNull();

    body.dispatchEvent(new MouseEvent('mouseenter'));
    await new Promise(r => setTimeout(r, 300));

    // Held before the click: opening portals the menu to document.body, out of
    // this story's canvas, and every closed menu on the page carries the same
    // id — so a query by id afterwards could just as easily find another one.
    const subMenu = canvasElement.querySelector('[data-message-id="8401"] #subMenuContext') as HTMLElement;
    expect(subMenu).not.toBeNull();

    const moreButton = canvasElement.querySelector('[data-message-id="8401"] .cometchat-menu-list__sub-menu') as HTMLElement;
    expect(moreButton).not.toBeNull();

    moreButton.click();
    await new Promise(r => setTimeout(r, 500));

    expect(subMenu.getAttribute('data-visible')).toBe('true');

    const group = subMenu.querySelector('#organise') as HTMLElement;
    expect(group).not.toBeNull();

    group.click();
    await new Promise(r => setTimeout(r, 500));

    const flyout = subMenu.querySelector('.cometchat-menu-list__group-flyout') as HTMLElement;
    expect(flyout).not.toBeNull();
    expect(flyout.textContent!.trim()).toContain('Unpin message');
    expect(flyout.textContent!.trim()).toContain('Unsave message');
  },
};

/** Verifies the thread option's title names the reverse action on a followed thread. */
export const TestThreadSubscriptionOptionTitleFlips: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        { provide: PinSaveService, useFactory: () => createMockPinSaveService() },
        {
          provide: ThreadSubscriptionService,
          useFactory: () => createMockThreadSubscriptionService(),
        },
        {
          provide: COMETCHAT_GLOBAL_CONFIG,
          useValue: {
            enablePinMessage: true,
            enableSaveMessage: true,
            enableThreadSubscription: true,
          },
        },
      ],
    }),
  ],
  render: args => ({
    props: {
      ...args,
      user: createMockUser({ uid: 'user-jane-smith', name: 'Jane Smith' }),
      mockMessages: createMarkedMessages(8501, [{ text: 'A followed thread.', subscribed: true }]),
    },
    template: `
      <div style="width: 100%; height: 100vh; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
        <cometchat-message-list-markers-story-wrapper
          [user]="user"
          [mockMessages]="mockMessages">
        </cometchat-message-list-markers-story-wrapper>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    await new Promise(r => setTimeout(r, 2000));
    const body = canvasElement.querySelector('[data-message-id="8501"] .cometchat-message-bubble__body') as HTMLElement;
    expect(body).not.toBeNull();

    body.dispatchEvent(new MouseEvent('mouseenter'));
    await new Promise(r => setTimeout(r, 300));

    // Held before the click: opening portals the menu to document.body, out of
    // this story's canvas, and every closed menu on the page carries the same
    // id — so a query by id afterwards could just as easily find another one.
    const subMenu = canvasElement.querySelector('[data-message-id="8501"] #subMenuContext') as HTMLElement;
    expect(subMenu).not.toBeNull();

    const moreButton = canvasElement.querySelector('[data-message-id="8501"] .cometchat-menu-list__sub-menu') as HTMLElement;
    expect(moreButton).not.toBeNull();

    moreButton.click();
    await new Promise(r => setTimeout(r, 500));

    expect(subMenu.getAttribute('data-visible')).toBe('true');

    const option = subMenu.querySelector('#threadSubscription') as HTMLElement;
    expect(option).not.toBeNull();
    expect(option.textContent!.trim()).toContain('Unsubscribe from thread');
  },
};

/** Verifies the hide flags remove Organise and the thread option from the menu. */
export const TestPinSaveAndThreadOptionsHidden: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        { provide: PinSaveService, useFactory: () => createMockPinSaveService() },
        {
          provide: ThreadSubscriptionService,
          useFactory: () => createMockThreadSubscriptionService(),
        },
        {
          provide: COMETCHAT_GLOBAL_CONFIG,
          useValue: {
            enablePinMessage: true,
            enableSaveMessage: true,
            enableThreadSubscription: true,
          },
        },
      ],
    }),
  ],
  render: args => ({
    props: {
      ...args,
      user: createMockUser({ uid: 'user-jane-smith', name: 'Jane Smith' }),
      mockMessages: createMarkedMessages(8601, [
        { text: 'A pinned and saved message.', pinned: true, saved: true },
      ]),
    },
    template: `
      <div style="width: 100%; height: 100vh; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
        <cometchat-message-list-markers-story-wrapper
          [user]="user"
          [mockMessages]="mockMessages"
          [hidePinMessageOption]="true"
          [hideUnpinMessageOption]="true"
          [hideSaveMessageOption]="true"
          [hideUnsaveMessageOption]="true"
          [hideThreadSubscriptionOption]="true">
        </cometchat-message-list-markers-story-wrapper>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    await new Promise(r => setTimeout(r, 2000));
    const body = canvasElement.querySelector('[data-message-id="8601"] .cometchat-message-bubble__body') as HTMLElement;
    expect(body).not.toBeNull();

    body.dispatchEvent(new MouseEvent('mouseenter'));
    await new Promise(r => setTimeout(r, 300));

    // Held before the click: opening portals the menu to document.body, out of
    // this story's canvas, and every closed menu on the page carries the same
    // id — so a query by id afterwards could just as easily find another one.
    const subMenu = canvasElement.querySelector('[data-message-id="8601"] #subMenuContext') as HTMLElement;
    expect(subMenu).not.toBeNull();

    const moreButton = canvasElement.querySelector('[data-message-id="8601"] .cometchat-menu-list__sub-menu') as HTMLElement;
    expect(moreButton).not.toBeNull();

    moreButton.click();
    await new Promise(r => setTimeout(r, 500));

    expect(subMenu.getAttribute('data-visible')).toBe('true');
    expect(subMenu.querySelector('#organise')).toBeNull();
    expect(subMenu.querySelector('#threadSubscription')).toBeNull();

    // Hiding the actions must not remove the markers they act on.
    const pinned = canvasElement.querySelector('[data-message-id="8601"] .cometchat-message-bubble__pinned-indicator');
    expect(pinned).not.toBeNull();
  },
};
