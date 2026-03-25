/**
 * CometChatConversations Storybook Stories
 *
 * Interactive stories demonstrating the conversations list component variants:
 * - Default conversation list with mock data
 * - Empty state when no conversations exist
 * - Loading state with shimmer/skeleton UI
 * - All variants showcase
 *
 * @module components/cometchat-conversations
 */

import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CommonModule } from '@angular/common';
import { BehaviorSubject } from 'rxjs';
import { CometChat } from '@cometchat/chat-sdk-javascript';

import { CometChatConversationsComponent } from './cometchat-conversations.component';
import { CometChatConversationItemComponent } from '../cometchat-conversation-item/cometchat-conversation-item.component';
import { CometChatTemplatesService } from '../../services/templates.service';
import { ConversationsService } from '../../services/conversations.service';
import { SelectionMode } from '../../Enums/Enums';
import { createMockConversations } from '../../../../../../.storybook/utils/mock-data';

// ============================================
// Mock Classes
// ============================================

/**
 * Creates a mock ConversationsService for Storybook stories.
 * Provides observable-based state that the component subscribes to,
 * allowing stories to render without CometChat SDK initialization.
 */
function createMockConversationsService(
  conversations: CometChat.Conversation[] = [],
  options?: { loading?: boolean; error?: Error | null }
) {
  const conversationsSubject = new BehaviorSubject<CometChat.Conversation[]>(conversations);
  const loadingSubject = new BehaviorSubject<boolean>(options?.loading ?? false);
  const errorSubject = new BehaviorSubject<Error | null>(options?.error ?? null);
  const activeConversationSubject = new BehaviorSubject<CometChat.Conversation | null>(null);
  const typingIndicatorsSubject = new BehaviorSubject<Map<string, CometChat.TypingIndicator>>(
    new Map()
  );

  return {
    conversations$: conversationsSubject.asObservable(),
    loadingState$: loadingSubject.asObservable(),
    errorState$: errorSubject.asObservable(),
    activeConversation$: activeConversationSubject.asObservable(),
    typingIndicators$: typingIndicatorsSubject.asObservable(),
    fetchConversations: () => {
      if (options?.error) {
        // On retry, show loading for 300ms then error again
        loadingSubject.next(true);
        errorSubject.next(null);
        setTimeout(() => {
          loadingSubject.next(false);
          errorSubject.next(options.error ?? null);
        }, 300);
      }
      return Promise.resolve();
    },
    fetchNextConversations: () => Promise.resolve(),
    searchConversations: () => {},
    deleteConversation: () => Promise.resolve(),
    setActiveConversation: () => {},
    clearError: () => {
      errorSubject.next(null);
    },
    cleanup: () => {},
  };
}

// ============================================
// Meta Configuration
// ============================================

const meta: Meta<CometChatConversationsComponent> = {
  title: 'Components/Conversations/CometChat Conversations',
  component: CometChatConversationsComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [CommonModule, CometChatConversationItemComponent],
    }),
  ],
  args: {
    hideReceipts: false,
    hideError: false,
    hideDeleteConversation: false,
    hideUserStatus: false,
    hideGroupType: false,
    showScrollbar: false,
    showSearchBar: false,
    disableSoundForMessages: true,
    selectionMode: SelectionMode.none,
  },
  argTypes: {
    hideReceipts: {
      control: 'boolean',
      description: 'Hide message receipts (sent, delivered, read indicators)',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'Display Control',
      },
    },
    hideError: {
      control: 'boolean',
      description: 'Hide error state display when fetching conversations fails',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'Display Control',
      },
    },
    hideDeleteConversation: {
      control: 'boolean',
      description: 'Hide delete conversation option in context menu',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'Display Control',
      },
    },
    hideUserStatus: {
      control: 'boolean',
      description: 'Hide user online/offline status indicator',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'Display Control',
      },
    },
    hideGroupType: {
      control: 'boolean',
      description: 'Hide group type icon (public, private, password)',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'Display Control',
      },
    },
    showScrollbar: {
      control: 'boolean',
      description: 'Show scrollbar in the conversation list',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'Display Control',
      },
    },
    showSearchBar: {
      control: 'boolean',
      description: 'Show search bar in the header area',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'Display Control',
      },
    },
    selectionMode: {
      control: 'select',
      options: [SelectionMode.none, SelectionMode.single, SelectionMode.multiple],
      description: 'Selection mode for conversations — none, single, or multiple',
      table: {
        type: { summary: 'SelectionMode' },
        defaultValue: { summary: 'SelectionMode.none' },
        category: 'Selection',
      },
    },
    disableSoundForMessages: {
      control: 'boolean',
      description: 'Disable sound notifications for new messages',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'Sound',
      },
    },
    disableDefaultContextMenu: {
      control: 'boolean',
      description: 'Disable the browser default context menu on right-click',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'true' },
        category: 'Display Control',
      },
    },
    itemClick: {
      action: 'itemClick',
      description: 'Emitted when a conversation item is clicked',
      table: {
        type: { summary: 'EventEmitter<CometChat.Conversation>' },
        category: 'Events',
      },
    },
    select: {
      action: 'select',
      description: 'Emitted when a conversation is selected or deselected',
      table: {
        type: {
          summary: 'EventEmitter<{ conversation: CometChat.Conversation; selected: boolean }>',
        },
        category: 'Events',
      },
    },
    error: {
      action: 'error',
      description: 'Emitted when an error occurs during data fetching',
      table: {
        type: { summary: 'EventEmitter<CometChat.CometChatException>' },
        category: 'Events',
      },
    },
    contextMenuOpen: {
      action: 'contextMenuOpen',
      description: 'Emitted when the context menu is opened on a conversation',
      table: {
        type: { summary: 'EventEmitter<CometChat.Conversation>' },
        category: 'Events',
      },
    },
    scrollToTop: {
      action: 'scrollToTop',
      description: 'Emitted when the list is scrolled to the top',
      table: {
        type: { summary: 'EventEmitter<void>' },
        category: 'Events',
      },
    },
    scrollToBottom: {
      action: 'scrollToBottom',
      description: 'Emitted when the list is scrolled to the bottom',
      table: {
        type: { summary: 'EventEmitter<void>' },
        category: 'Events',
      },
    },
    selectionChange: {
      action: 'selectionChange',
      description: 'Emitted when the selection state changes',
      table: {
        type: { summary: 'EventEmitter<SelectionState>' },
        category: 'Events',
      },
    },
  },
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'CometChatConversations displays a real-time list of conversations with support for search, selection modes (none, single, multiple), CSS variable theming, keyboard navigation, typing indicators, sound notifications, and slot-based template customization.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<CometChatConversationsComponent>;

// ============================================
// Stories
// ============================================

/** Default conversation list with a mix of user and group conversations. */
export const Default: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        {
          provide: ConversationsService,
          useFactory: () => createMockConversationsService(createMockConversations(10)),
        },
        CometChatTemplatesService,
      ],
    }),
  ],
  args: {
    showSearchBar: false,
    disableSoundForMessages: true,
  },
  render: args => ({
    props: {
      ...args,
    },
    template: `
      <div class="cometchat-conversations-story__container" style="width: 400px; height: 600px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
        <cometchat-conversations
          [hideReceipts]="hideReceipts"
          [hideUserStatus]="hideUserStatus"
          [hideGroupType]="hideGroupType"
          [showScrollbar]="showScrollbar"
          [showSearchBar]="showSearchBar"
          [selectionMode]="selectionMode"
          [disableSoundForMessages]="disableSoundForMessages">
        </cometchat-conversations>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Default conversation list rendered with 10 mock conversations (mix of user and group types). Shows the component with search bar enabled and default display settings.',
      },
    },
  },
};

/** Empty state when no conversations exist for the logged-in user. */
export const EmptyState: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        {
          provide: ConversationsService,
          useFactory: () => createMockConversationsService([]),
        },
        CometChatTemplatesService,
      ],
    }),
  ],
  args: {
    showSearchBar: false,
    disableSoundForMessages: true,
  },
  render: args => ({
    props: args,
    template: `
      <div class="cometchat-conversations-story__container" style="width: 400px; height: 600px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
        <cometchat-conversations
          [showSearchBar]="showSearchBar"
          [disableSoundForMessages]="disableSoundForMessages">
        </cometchat-conversations>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Empty state displayed when the user has no conversations. Shows the default empty state UI with search bar visible.',
      },
    },
  },
};

/** Loading state with shimmer/skeleton placeholders while fetching conversations. */
export const LoadingState: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        {
          provide: ConversationsService,
          useFactory: () => createMockConversationsService([], { loading: true }),
        },
        CometChatTemplatesService,
      ],
    }),
  ],
  args: {
    showSearchBar: false,
    disableSoundForMessages: true,
  },
  render: args => ({
    props: args,
    template: `
      <div class="cometchat-conversations-story__container" style="width: 400px; height: 600px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
        <cometchat-conversations
          [showSearchBar]="showSearchBar"
          [disableSoundForMessages]="disableSoundForMessages">
        </cometchat-conversations>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Loading state shown while conversations are being fetched from the server. Displays shimmer/skeleton placeholder items to indicate progress.',
      },
    },
  },
};

/** Error state when fetching conversations fails. */
export const ErrorState: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        {
          provide: ConversationsService,
          useFactory: () =>
            createMockConversationsService([], { error: new Error('Network error') }),
        },
        CometChatTemplatesService,
      ],
    }),
  ],
  args: {
    showSearchBar: false,
    disableSoundForMessages: true,
    hideError: false,
  },
  render: args => ({
    props: args,
    template: `
      <div class="cometchat-conversations-story__container" style="width: 400px; height: 600px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
        <cometchat-conversations
          [showSearchBar]="showSearchBar"
          [disableSoundForMessages]="disableSoundForMessages"
          [hideError]="hideError">
        </cometchat-conversations>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Error state displayed when fetching conversations fails. Shows the error UI with a retry option. Clicking retry shows shimmer for 300ms then returns to error state.',
      },
    },
  },
};

/** Conversations with unread message badges. */
export const WithUnreadBadge: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        {
          provide: ConversationsService,
          useFactory: () =>
            createMockConversationsService(
              createMockConversations(10, i => ({
                unreadMessageCount: i % 3 === 0 ? i + 1 : 0,
              }))
            ),
        },
        CometChatTemplatesService,
      ],
    }),
  ],
  args: {
    showSearchBar: false,
    disableSoundForMessages: true,
  },
  render: args => ({
    props: args,
    template: `
      <div class="cometchat-conversations-story__container" style="width: 400px; height: 600px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
        <cometchat-conversations
          [showSearchBar]="showSearchBar"
          [disableSoundForMessages]="disableSoundForMessages">
        </cometchat-conversations>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Conversations with unread message badges. Some conversations show a numeric badge indicating unread message count.',
      },
    },
  },
};

// ============================================
// Showcase
// ============================================

/** Comprehensive showcase of all conversation list variants in a single view. */
export const AllVariantsShowcase: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        {
          provide: ConversationsService,
          useFactory: () => createMockConversationsService(createMockConversations(5)),
        },
        CometChatTemplatesService,
      ],
    }),
  ],
  render: () => ({
    template: `
      <div class="cometchat-conversations-showcase" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-5); padding: var(--cometchat-spacing-5);">

        <h3 class="cometchat-conversations-showcase__title" style="margin: 0; font: var(--cometchat-font-heading3-bold); color: var(--cometchat-text-color-primary);">
          Conversations Variants
        </h3>

        <!-- Default List -->
        <div class="cometchat-conversations-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-conversations-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Default List
          </p>
          <div class="cometchat-conversations-showcase__panel" style="width: 400px; height: 350px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
            <cometchat-conversations [disableSoundForMessages]="true"></cometchat-conversations>
          </div>
        </div>

        <!-- With Search Bar -->
        <div class="cometchat-conversations-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-conversations-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            With Search Bar
          </p>
          <div class="cometchat-conversations-showcase__panel" style="width: 400px; height: 350px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
            <cometchat-conversations [showSearchBar]="true" [disableSoundForMessages]="true"></cometchat-conversations>
          </div>
        </div>

        <!-- Single Selection Mode -->
        <div class="cometchat-conversations-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-conversations-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Single Selection Mode
          </p>
          <div class="cometchat-conversations-showcase__panel" style="width: 400px; height: 350px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
            <cometchat-conversations [selectionMode]="singleSelection" [disableSoundForMessages]="true"></cometchat-conversations>
          </div>
        </div>

        <!-- Multiple Selection Mode -->
        <div class="cometchat-conversations-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-conversations-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Multiple Selection Mode
          </p>
          <div class="cometchat-conversations-showcase__panel" style="width: 400px; height: 350px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
            <cometchat-conversations [selectionMode]="multipleSelection" [disableSoundForMessages]="true"></cometchat-conversations>
          </div>
        </div>

      </div>
    `,
    props: {
      singleSelection: SelectionMode.single,
      multipleSelection: SelectionMode.multiple,
    },
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Comprehensive showcase displaying all conversation list variants — default, with search bar, single selection, and multiple selection — in a single view. All styling uses CometChat CSS variables for theme consistency.',
      },
    },
  },
};
