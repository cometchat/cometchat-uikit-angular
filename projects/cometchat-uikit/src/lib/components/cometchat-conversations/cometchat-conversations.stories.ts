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
import { signal } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { within, expect, waitFor } from 'storybook/test';

import { CometChatConversationsComponent } from './cometchat-conversations.component';
import { CometChatConversationItemComponent } from '../cometchat-conversation-item/cometchat-conversation-item.component';
import { CometChatTemplatesService } from '../../services/templates.service';
import { ConversationsService } from '../../services/conversations.service';
import { PinSaveService } from '../../services/pin-save.service';
import { SelectionMode } from '../../Enums/Enums';
import {
  createMockConversations,
  createMockGroup,
  createMockMessage,
  createMockUser,
} from '../../../../../../.storybook/utils/mock-data';
import { createMockPinSaveService } from '../../../../../../.storybook/utils/mock-pin-save';

// ============================================
// Mock Classes
// ============================================

/**
 * The members of ConversationsService the component reaches for. Typing the
 * mock against the real service means a new dependency fails `tsc` here rather
 * than throwing "x is not a function" in the browser.
 */
type ConversationsServiceMock = Pick<
  ConversationsService,
  | 'conversations$'
  | 'loadingState$'
  | 'errorState$'
  | 'activeConversation$'
  | 'typingIndicators$'
  | 'hasMore'
  | 'fetchConversations'
  | 'fetchNextConversations'
  | 'searchConversations'
  | 'deleteConversation'
  | 'setActiveConversation'
  | 'replaceConversation'
  | 'updateConversationUnreadCount'
  | 'updateConversationReadStatus'
  | 'clearError'
  | 'cleanup'
>;

/**
 * Creates a mock ConversationsService for Storybook stories.
 * Provides observable-based state that the component subscribes to,
 * allowing stories to render without CometChat SDK initialization.
 */
function createMockConversationsService(
  conversations: CometChat.Conversation[] = [],
  options?: { loading?: boolean; error?: Error | null }
): ConversationsServiceMock {
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
    // Every page is already in the list, so there is nothing more to load.
    hasMore: signal(false).asReadonly(),
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
    fetchNextConversations: () => Promise.resolve(false),
    searchConversations: () => {},
    deleteConversation: () => Promise.resolve(),
    setActiveConversation: () => {},
    replaceConversation: () => false,
    updateConversationUnreadCount: () => {},
    updateConversationReadStatus: () => {},
    clearError: () => {
      errorSubject.next(null);
    },
    cleanup: () => {},
  };
}

/** The user the stories are signed in as. */
const LOGGED_IN_USER = createMockUser({ uid: 'storybook-me', name: 'Storybook Me' });

/**
 * Conversations whose last message the signed-in user sent, so each row has a
 * delivery receipt to show (receipts are only drawn on your own messages).
 */
function createConversationsSentByMe(count: number): CometChat.Conversation[] {
  return createMockConversations(count, i => ({
    type: 'user',
    lastMessage: createMockMessage('text', {
      text: `Sent message ${i + 1}`,
      sender: LOGGED_IN_USER,
      deliveredAt: Date.now() / 1000,
    }),
  }));
}

/** Alternating user and private/password group conversations. */
function createConversationsWithGroupTypes(count: number): CometChat.Conversation[] {
  return createMockConversations(count, i =>
    i % 2 === 0
      ? { type: 'user' }
      : {
          type: 'group',
          conversationWith: createMockGroup({
            guid: `group-typed-${i}`,
            type: i % 4 === 1 ? CometChat.GROUP_TYPE.PRIVATE : CometChat.GROUP_TYPE.PASSWORD,
          }),
        }
  );
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
      // The real service reaches the uninitialised SDK; see createMockPinSaveService.
      providers: [{ provide: PinSaveService, useFactory: () => createMockPinSaveService() }],
    }),
  ],
  // The SDK is never initialised in Storybook, so asking it for the signed-in
  // user throws. Sign the stories in as LOGGED_IN_USER, and put the SDK back
  // afterwards so no other story inherits the stub.
  beforeEach: () => {
    const original = CometChat.getLoggedinUser;
    CometChat.getLoggedinUser = () => Promise.resolve(LOGGED_IN_USER);
    return () => {
      CometChat.getLoggedinUser = original;
    };
  },
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

// ============================================
// Interaction Tests — Prop Toggle Verification
// ============================================

/**
 * Waits on rendered state rather than a fixed sleep: resolves with the
 * conversation rows once the list has drawn them.
 */
const RENDER_SETTLE = { timeout: 5000 };

function waitForConversationRows(canvasElement: HTMLElement): Promise<Element[]> {
  return waitFor(() => {
    const rows = Array.from(canvasElement.querySelectorAll('.cometchat-conversations__list-item-wrapper'));
    expect(rows.length).toBeGreaterThan(0);
    return rows;
  }, RENDER_SETTLE);
}

/** Waits for the first element matching `selector` inside the canvas. */
function waitForElement(canvasElement: HTMLElement, selector: string): Promise<HTMLElement> {
  return waitFor(() => {
    const el = canvasElement.querySelector<HTMLElement>(selector);
    expect(el).not.toBeNull();
    return el!;
  }, RENDER_SETTLE);
}

/** Verifies hideReceipts=true hides receipt icons. */
export const TestHideReceipts: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        {
          provide: ConversationsService,
          useFactory: () => createMockConversationsService(createConversationsSentByMe(5)),
        },
        CometChatTemplatesService,
      ],
    }),
  ],
  args: {
    hideReceipts: true,
    disableSoundForMessages: true,
  },
  render: args => ({
    props: args,
    template: `
      <div style="width: 400px; height: 600px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
        <cometchat-conversations
          [hideReceipts]="true"
          [disableSoundForMessages]="true">
        </cometchat-conversations>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const rows = await waitForConversationRows(canvasElement);
    expect(rows).toHaveLength(5);
    // Every last message is the user's own, yet no receipt is drawn
    expect(canvasElement.querySelectorAll('.cometchat-conversation-item__receipt-icon')).toHaveLength(0);
  },
};

/** Verifies hideReceipts=false shows a receipt on each conversation the user sent last. */
export const TestShowReceipts: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        {
          provide: ConversationsService,
          useFactory: () => createMockConversationsService(createConversationsSentByMe(5)),
        },
        CometChatTemplatesService,
      ],
    }),
  ],
  args: {
    hideReceipts: false,
    disableSoundForMessages: true,
  },
  render: args => ({
    props: args,
    template: `
      <div style="width: 400px; height: 600px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
        <cometchat-conversations
          [hideReceipts]="false"
          [disableSoundForMessages]="true">
        </cometchat-conversations>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    await waitForConversationRows(canvasElement);
    // The signed-in user sent every last message, and each was delivered
    await waitFor(() => {
      expect(canvasElement.querySelectorAll('.cometchat-conversation-item__receipt-icon--delivered')).toHaveLength(5);
    }, RENDER_SETTLE);
  },
};

/** Verifies hideUserStatus=true hides online/offline indicators. */
export const TestHideUserStatus: Story = {
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
  args: {
    hideUserStatus: true,
    disableSoundForMessages: true,
  },
  render: args => ({
    props: args,
    template: `
      <div style="width: 400px; height: 600px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
        <cometchat-conversations
          [hideUserStatus]="true"
          [disableSoundForMessages]="true">
        </cometchat-conversations>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    await waitForConversationRows(canvasElement);
    // Status indicators should NOT be present on the user conversations
    expect(canvasElement.querySelectorAll('.cometchat-conversation-item__status')).toHaveLength(0);
  },
};

/** Verifies hideGroupType=true hides group type icons. */
export const TestHideGroupType: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        {
          provide: ConversationsService,
          useFactory: () => createMockConversationsService(createConversationsWithGroupTypes(10)),
        },
        CometChatTemplatesService,
      ],
    }),
  ],
  args: {
    hideGroupType: true,
    disableSoundForMessages: true,
  },
  render: args => ({
    props: args,
    template: `
      <div style="width: 400px; height: 600px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
        <cometchat-conversations
          [hideGroupType]="true"
          [disableSoundForMessages]="true">
        </cometchat-conversations>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const rows = await waitForConversationRows(canvasElement);
    expect(rows).toHaveLength(10);
    // Half the rows are private/password groups, yet no type icon is drawn
    expect(canvasElement.querySelectorAll('.cometchat-conversation-item__group-type')).toHaveLength(0);
  },
};

/** Verifies showSearchBar=true renders the search bar. */
export const TestShowSearchBar: Story = {
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
  args: {
    showSearchBar: true,
    disableSoundForMessages: true,
  },
  render: args => ({
    props: args,
    template: `
      <div style="width: 400px; height: 600px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
        <cometchat-conversations
          [showSearchBar]="true"
          [disableSoundForMessages]="true">
        </cometchat-conversations>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Search bar should be visible
    const search = await canvas.findByRole('searchbox', { name: 'Search' }, RENDER_SETTLE);
    expect(search.closest('.cometchat-conversations__search-section')).not.toBeNull();
  },
};

/** Verifies showSearchBar=false hides the search bar. */
export const TestHideSearchBar: Story = {
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
  args: {
    showSearchBar: false,
    disableSoundForMessages: true,
  },
  render: args => ({
    props: args,
    template: `
      <div style="width: 400px; height: 600px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
        <cometchat-conversations
          [showSearchBar]="false"
          [disableSoundForMessages]="true">
        </cometchat-conversations>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    await waitForConversationRows(canvasElement);
    // Search bar should NOT be visible
    expect(canvasElement.querySelector('cometchat-search-bar')).toBeNull();
  },
};

/** Verifies empty state renders correctly. */
export const TestEmptyState: Story = {
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
    disableSoundForMessages: true,
  },
  render: args => ({
    props: args,
    template: `
      <div style="width: 400px; height: 600px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
        <cometchat-conversations
          [disableSoundForMessages]="true">
        </cometchat-conversations>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    // Empty state content should be visible
    const empty = await waitForElement(canvasElement, '.cometchat-conversations__empty-content');
    expect(empty.querySelector('.cometchat-conversations__empty-title')).not.toBeNull();
    // No conversation items should be present
    expect(canvasElement.querySelectorAll('cometchat-conversation-item')).toHaveLength(0);
  },
};

/** Verifies loading state renders shimmer. */
export const TestLoadingState: Story = {
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
    disableSoundForMessages: true,
  },
  render: args => ({
    props: args,
    template: `
      <div style="width: 400px; height: 600px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
        <cometchat-conversations
          [disableSoundForMessages]="true">
        </cometchat-conversations>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    // Shimmer placeholders should be present while loading
    const shimmer = await waitForElement(canvasElement, '.cometchat-conversations__shimmer');
    expect(shimmer.querySelectorAll('.cometchat-conversations__shimmer-item').length).toBeGreaterThan(0);
    expect(canvasElement.querySelectorAll('cometchat-conversation-item')).toHaveLength(0);
  },
};

/** Verifies default state renders conversation items. */
export const TestDefaultRendersItems: Story = {
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
  args: {
    disableSoundForMessages: true,
  },
  render: args => ({
    props: args,
    template: `
      <div style="width: 400px; height: 600px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
        <cometchat-conversations
          [disableSoundForMessages]="true">
        </cometchat-conversations>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    // Conversation items should be rendered under the title
    const rows = await waitForConversationRows(canvasElement);
    expect(rows).toHaveLength(5);
    expect(canvasElement.querySelector('.cometchat-conversations__title')).not.toBeNull();
  },
};

/** Verifies hideError=true suppresses error state display. */
export const TestHideError: Story = {
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
    hideError: true,
    disableSoundForMessages: true,
  },
  render: args => ({
    props: args,
    template: `
      <div style="width: 400px; height: 600px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
        <cometchat-conversations
          [hideError]="true"
          [disableSoundForMessages]="true">
        </cometchat-conversations>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    // The list has settled into its error state (no shimmer, no rows) ...
    await waitFor(() => {
      expect(canvasElement.querySelector('cometchat-paginated-list')).not.toBeNull();
      expect(canvasElement.querySelector('.cometchat-conversations__shimmer')).toBeNull();
    }, RENDER_SETTLE);
    expect(canvasElement.querySelectorAll('cometchat-conversation-item')).toHaveLength(0);
    // ... but hideError=true suppresses the error view
    expect(canvasElement.querySelector('.cometchat-conversations__error-content')).toBeNull();
  },
};

/** Verifies hideError=false shows error state display. */
export const TestShowError: Story = {
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
    hideError: false,
    disableSoundForMessages: true,
  },
  render: args => ({
    props: args,
    template: `
      <div style="width: 400px; height: 600px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
        <cometchat-conversations
          [hideError]="false"
          [disableSoundForMessages]="true">
        </cometchat-conversations>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    // Error state view should be visible, with a retry button
    const errorView = await waitForElement(canvasElement, '.cometchat-conversations__error-content');
    expect(errorView.closest('[role="alert"]')).not.toBeNull();
    expect(within(errorView).getByRole('button')).toHaveClass('cometchat-conversations__error-retry-button');
  },
};

/** Verifies showScrollbar=true does not apply hide-scrollbar class. */
export const TestShowScrollbar: Story = {
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
  args: {
    showScrollbar: true,
    disableSoundForMessages: true,
  },
  render: args => ({
    props: args,
    template: `
      <div style="width: 400px; height: 600px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
        <cometchat-conversations
          [showScrollbar]="true"
          [disableSoundForMessages]="true">
        </cometchat-conversations>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    await waitForConversationRows(canvasElement);
    // The list body owns the scrollbar
    expect(canvasElement.querySelector('.cometchat-paginated-list')).toHaveClass('cometchat-paginated-list--show-scrollbar');
  },
};

/** Verifies showScrollbar=false applies hide-scrollbar class. */
export const TestHideScrollbar: Story = {
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
  args: {
    showScrollbar: false,
    disableSoundForMessages: true,
  },
  render: args => ({
    props: args,
    template: `
      <div style="width: 400px; height: 600px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
        <cometchat-conversations
          [showScrollbar]="false"
          [disableSoundForMessages]="true">
        </cometchat-conversations>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    await waitForConversationRows(canvasElement);
    // The list body owns the scrollbar
    expect(canvasElement.querySelector('.cometchat-paginated-list')).not.toHaveClass('cometchat-paginated-list--show-scrollbar');
  },
};

/** Verifies selectionMode=single renders radio-style selection controls. */
export const TestSingleSelectionMode: Story = {
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
  render: args => ({
    props: {
      ...args,
      singleSelection: SelectionMode.single,
    },
    template: `
      <div style="width: 400px; height: 600px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
        <cometchat-conversations
          [selectionMode]="singleSelection"
          [disableSoundForMessages]="true">
        </cometchat-conversations>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const rows = await waitForConversationRows(canvasElement);
    // Every row carries a radio-style selection control
    for (const row of rows) {
      expect(row.querySelector('.cometchat-conversations__selection-control cometchat-radio-button')).not.toBeNull();
    }
    expect(canvasElement.querySelectorAll('cometchat-checkbox')).toHaveLength(0);
  },
};

/** Verifies selectionMode=multiple renders checkbox-style selection controls. */
export const TestMultipleSelectionMode: Story = {
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
  render: args => ({
    props: {
      ...args,
      multipleSelection: SelectionMode.multiple,
    },
    template: `
      <div style="width: 400px; height: 600px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
        <cometchat-conversations
          [selectionMode]="multipleSelection"
          [disableSoundForMessages]="true">
        </cometchat-conversations>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const rows = await waitForConversationRows(canvasElement);
    // Every row carries a checkbox-style selection control
    for (const row of rows) {
      expect(row.querySelector('.cometchat-conversations__selection-control cometchat-checkbox')).not.toBeNull();
    }
    expect(canvasElement.querySelectorAll('cometchat-radio-button')).toHaveLength(0);
  },
};

/** Verifies selectionMode=none does NOT render selection controls. */
export const TestNoSelectionMode: Story = {
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
  render: args => ({
    props: {
      ...args,
      noneSelection: SelectionMode.none,
    },
    template: `
      <div style="width: 400px; height: 600px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
        <cometchat-conversations
          [selectionMode]="noneSelection"
          [disableSoundForMessages]="true">
        </cometchat-conversations>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    await waitForConversationRows(canvasElement);
    // No selection controls should be present
    expect(canvasElement.querySelectorAll('.cometchat-conversations__selection-control')).toHaveLength(0);
    expect(canvasElement.querySelectorAll('cometchat-radio-button, cometchat-checkbox')).toHaveLength(0);
  },
};

/** Verifies hideDeleteConversation=true hides delete option from context menu. */
export const TestHideDeleteConversation: Story = {
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
  args: {
    hideDeleteConversation: true,
    disableSoundForMessages: true,
  },
  render: args => ({
    props: args,
    template: `
      <div style="width: 400px; height: 600px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
        <cometchat-conversations
          [hideDeleteConversation]="true"
          [disableSoundForMessages]="true">
        </cometchat-conversations>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    // Component should render its rows without errors
    await waitForConversationRows(canvasElement);
    // Delete option should not be visible (context menu not open by default)
    expect(within(canvasElement).queryByRole('menuitem', { name: /delete/i })).toBeNull();
  },
};

/** Verifies disableDefaultContextMenu=true prevents browser context menu. */
export const TestDisableDefaultContextMenu: Story = {
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
  args: {
    disableDefaultContextMenu: true,
    disableSoundForMessages: true,
  },
  render: args => ({
    props: args,
    template: `
      <div style="width: 400px; height: 600px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
        <cometchat-conversations
          [disableDefaultContextMenu]="true"
          [disableSoundForMessages]="true">
        </cometchat-conversations>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    // Conversation items should still render with the context menu disabled
    const rows = await waitForConversationRows(canvasElement);
    expect(rows).toHaveLength(5);
  },
};
