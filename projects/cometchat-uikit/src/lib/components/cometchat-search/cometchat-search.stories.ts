/**
 * CometChatSearch Storybook Stories
 *
 * Uses CometChatSearchStoryWrapperComponent which passes mock
 * conversationsRequestBuilder and messagesRequestBuilder via the component's
 * own @Input() props — the same clean pattern as MessageList stories.
 * No SDK patching, no DI tricks, no loaders needed.
 *
 * @module components/cometchat-search
 */

import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CometChatSearchComponent } from './cometchat-search.component';
import { CometChatSearchFilter, CometChatSearchScope } from '../../Enums/Enums';
import { expect } from '@storybook/test';
import { CometChatTemplatesService } from '../../services/templates.service';
import { CometChatSearchStoryWrapperComponent } from '../../../../../../.storybook/utils/mock-services';
import {
  createMockConversations,
  createMockMessages,
  createMockMessage,
  createMockUser,
  MOCK_AVATARS,
} from '../../../../../../.storybook/utils/mock-data';

// ── Pre-built mock data sets ───────────────────────────────────────────────

function makeMockConversations(keyword = 'hello') {
  const names = ['Andrew Joseph', 'Nancy Grace', 'George Alan', 'Design Team', 'Engineering'];
  const avatars = [MOCK_AVATARS.andrewJoseph, MOCK_AVATARS.nancyGrace, MOCK_AVATARS.georgeAlan, undefined, undefined];
  return createMockConversations(5, i => ({
    type: i >= 3 ? 'group' as const : 'user' as const,
    conversationWith: i < 3
      ? createMockUser({ uid: `user-${i}`, name: names[i], avatar: avatars[i], status: i % 2 === 0 ? 'online' : 'offline' })
      : undefined,
    lastMessage: createMockMessage('text', { text: `Hey, ${keyword} — are you free?`, sentAt: Date.now() / 1000 - i * 3600 }),
    unreadMessageCount: i === 0 ? 3 : 0,
  }));
}

function makeMockMessages(keyword = 'hello') {
  return createMockMessages(5, i => ({
    type: 'text' as const,
    sender: createMockUser({ uid: `sender-${i}`, name: ['Andrew Joseph', 'Nancy Grace', 'George Alan'][i % 3] }),
    text: `Hey, ${keyword} — are you available?`,
    sentAt: Date.now() / 1000 - i * 3600,
  }));
}

// ============================================
// Meta Configuration
// ============================================

const meta: Meta<CometChatSearchStoryWrapperComponent> = {
  title: 'Components/CometChatSearch',
  component: CometChatSearchStoryWrapperComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [CometChatSearchStoryWrapperComponent, CometChatSearchComponent],
      providers: [CometChatTemplatesService],
    }),
  ],
  args: {
    hideBackButton: false,
    hideGroupType: false,
    hideUserStatus: false,
    hideReceipts: false,
    forceState: 'loaded',
  },
  argTypes: {
    forceState: {
      control: 'select',
      options: ['loaded', 'loading', 'empty', 'error'],
      description: 'Force the search into a specific state for story demonstration',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'loaded' }, category: 'Story Control' },
    },
    hideBackButton: {
      control: 'boolean',
      description: 'Hide the back button in the search header',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' }, category: 'Display Control' },
    },
    hideGroupType: {
      control: 'boolean',
      description: 'Hide group type icon in conversation results',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' }, category: 'Display Control' },
    },
    hideUserStatus: {
      control: 'boolean',
      description: 'Hide user online/offline status indicator in conversation results',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' }, category: 'Display Control' },
    },
    hideReceipts: {
      control: 'boolean',
      description: 'Hide message receipts in conversation results',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' }, category: 'Display Control' },
    },
    defaultSearchText: {
      control: 'text',
      description: 'Pre-fill the search input and immediately trigger a search on load',
      table: { type: { summary: 'string' }, category: 'Configuration' },
    },
    searchIn: {
      control: 'object',
      description: 'Scopes to search in — Conversations, Messages, or both',
      table: { type: { summary: 'CometChatSearchScope[]' }, defaultValue: { summary: '[] (both)' }, category: 'Configuration' },
    },
    searchFilters: {
      control: 'object',
      description: 'Array of filter types to display in the filter bar',
      table: { type: { summary: 'CometChatSearchFilter[]' }, defaultValue: { summary: 'All filters' }, category: 'Configuration' },
    },
    initialSearchFilter: {
      control: 'select',
      options: [
        undefined,
        CometChatSearchFilter.Unread,
        CometChatSearchFilter.Photos,
        CometChatSearchFilter.Videos,
        CometChatSearchFilter.Documents,
        CometChatSearchFilter.Audio,
        CometChatSearchFilter.Links,
        CometChatSearchFilter.Groups,
      ],
      description: 'Filter that should be active by default when the component loads',
      table: { type: { summary: 'CometChatSearchFilter' }, category: 'Configuration' },
    },
  },
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'CometChatSearch provides unified cross-entity search across conversations and messages. Supports filter types, scoped search by user/group, template customization, and full keyboard accessibility.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<CometChatSearchStoryWrapperComponent>;

const CONTAINER = 'width: 400px; height: 600px; border: 1px solid var(--cometchat-border-color-light, #e0e0e0); border-radius: var(--cometchat-radius-2, 8px); overflow: hidden;';

// ============================================
// Stories
// ============================================

/** Default search with pre-filled keyword showing both conversation and message results. */
export const Default: Story = {
  args: {
    defaultSearchText: 'hello',
    hideBackButton: false,
    forceState: 'loaded',
    mockConversations: makeMockConversations('hello'),
    mockMessages: makeMockMessages('hello'),
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="${CONTAINER}">
        <cometchat-search-story-wrapper
          [defaultSearchText]="defaultSearchText"
          [hideBackButton]="hideBackButton"
          [hideGroupType]="hideGroupType"
          [hideUserStatus]="hideUserStatus"
          [hideReceipts]="hideReceipts"
          [forceState]="forceState"
          [mockConversations]="mockConversations"
          [mockMessages]="mockMessages">
        </cometchat-search-story-wrapper>
      </div>
    `,
  }),
  parameters: {
    docs: { description: { story: 'Default search pre-filled with "hello". Both conversation and message results contain the keyword.' } },
  },
};

/** Empty state when search returns no results. */
export const EmptyState: Story = {
  args: {
    defaultSearchText: 'xyznonexistent',
    hideBackButton: true,
    searchIn: [CometChatSearchScope.Messages],
    forceState: 'empty',
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="${CONTAINER}">
        <cometchat-search-story-wrapper
          [defaultSearchText]="defaultSearchText"
          [hideBackButton]="hideBackButton"
          [searchIn]="searchIn"
          [forceState]="forceState">
        </cometchat-search-story-wrapper>
      </div>
    `,
  }),
  parameters: {
    docs: { description: { story: 'Empty state shown when a search query returns no matching results.' } },
  },
};

/** Loading state with shimmer placeholders. */
export const LoadingState: Story = {
  args: {
    defaultSearchText: 'loading',
    hideBackButton: true,
    searchIn: [CometChatSearchScope.Messages],
    forceState: 'loading',
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="${CONTAINER}">
        <cometchat-search-story-wrapper
          [defaultSearchText]="defaultSearchText"
          [hideBackButton]="hideBackButton"
          [searchIn]="searchIn"
          [forceState]="forceState">
        </cometchat-search-story-wrapper>
      </div>
    `,
  }),
  parameters: {
    docs: { description: { story: 'Loading state shown while search results are being fetched. Displays shimmer/skeleton placeholders.' } },
  },
};

/** Error state when fetching fails. */
export const ErrorState: Story = {
  args: {
    defaultSearchText: 'error',
    hideBackButton: true,
    searchIn: [CometChatSearchScope.Messages],
    forceState: 'error',
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="${CONTAINER}">
        <cometchat-search-story-wrapper
          [defaultSearchText]="defaultSearchText"
          [hideBackButton]="hideBackButton"
          [searchIn]="searchIn"
          [forceState]="forceState">
        </cometchat-search-story-wrapper>
      </div>
    `,
  }),
  parameters: {
    docs: { description: { story: 'Error state shown when a search operation fails.' } },
  },
};

/** Search scoped to conversations only. */
export const ConversationsOnly: Story = {
  args: {
    defaultSearchText: 'meeting',
    searchIn: [CometChatSearchScope.Conversations],
    hideBackButton: true,
    forceState: 'loaded',
    mockConversations: makeMockConversations('meeting'),
    mockMessages: [],
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="${CONTAINER}">
        <cometchat-search-story-wrapper
          [defaultSearchText]="defaultSearchText"
          [searchIn]="searchIn"
          [hideBackButton]="hideBackButton"
          [forceState]="forceState"
          [mockConversations]="mockConversations"
          [mockMessages]="mockMessages">
        </cometchat-search-story-wrapper>
      </div>
    `,
  }),
  parameters: {
    docs: { description: { story: 'Search scoped to conversations only. Message results are hidden.' } },
  },
};

/** Search scoped to messages only. */
export const MessagesOnly: Story = {
  args: {
    defaultSearchText: 'design',
    searchIn: [CometChatSearchScope.Messages],
    hideBackButton: true,
    forceState: 'loaded',
    mockConversations: [],
    mockMessages: makeMockMessages('design'),
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="${CONTAINER}">
        <cometchat-search-story-wrapper
          [defaultSearchText]="defaultSearchText"
          [searchIn]="searchIn"
          [hideBackButton]="hideBackButton"
          [forceState]="forceState"
          [mockConversations]="mockConversations"
          [mockMessages]="mockMessages">
        </cometchat-search-story-wrapper>
      </div>
    `,
  }),
  parameters: {
    docs: { description: { story: 'Search scoped to messages only. Conversation results are hidden.' } },
  },
};

/** Search with the Unread filter pre-selected on load. */
export const WithInitialFilter: Story = {
  args: {
    initialSearchFilter: CometChatSearchFilter.Unread,
    hideBackButton: true,
    forceState: 'loaded',
    mockConversations: makeMockConversations('unread'),
    mockMessages: [],
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="${CONTAINER}">
        <cometchat-search-story-wrapper
          [initialSearchFilter]="initialSearchFilter"
          [hideBackButton]="hideBackButton"
          [forceState]="forceState"
          [mockConversations]="mockConversations"
          [mockMessages]="mockMessages">
        </cometchat-search-story-wrapper>
      </div>
    `,
  }),
  parameters: {
    docs: { description: { story: 'Search with the Unread filter pre-selected. Conversation results are shown immediately.' } },
  },
};

/** Search with a subset of filters (Photos, Videos, Documents only). */
export const LimitedFilters: Story = {
  args: {
    defaultSearchText: 'project',
    searchFilters: [CometChatSearchFilter.Photos, CometChatSearchFilter.Videos, CometChatSearchFilter.Documents],
    hideBackButton: true,
    forceState: 'loaded',
    mockConversations: [],
    mockMessages: makeMockMessages('project'),
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="${CONTAINER}">
        <cometchat-search-story-wrapper
          [defaultSearchText]="defaultSearchText"
          [searchFilters]="searchFilters"
          [hideBackButton]="hideBackButton"
          [forceState]="forceState"
          [mockConversations]="mockConversations"
          [mockMessages]="mockMessages">
        </cometchat-search-story-wrapper>
      </div>
    `,
  }),
  parameters: {
    docs: { description: { story: 'Search with a limited set of filters — only Photos, Videos, and Documents.' } },
  },
};

/** Search with back button hidden. */
export const NoBackButton: Story = {
  args: {
    defaultSearchText: 'hello',
    hideBackButton: true,
    forceState: 'loaded',
    mockConversations: makeMockConversations('hello'),
    mockMessages: makeMockMessages('hello'),
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="${CONTAINER}">
        <cometchat-search-story-wrapper
          [defaultSearchText]="defaultSearchText"
          [hideBackButton]="hideBackButton"
          [forceState]="forceState"
          [mockConversations]="mockConversations"
          [mockMessages]="mockMessages">
        </cometchat-search-story-wrapper>
      </div>
    `,
  }),
  parameters: {
    docs: { description: { story: 'Search component with the back button hidden.' } },
  },
};

// ============================================
// Showcase
// ============================================

export const AllVariantsShowcase: Story = {
  render: () => ({
    props: {
      convs: makeMockConversations('hello'),
      msgs: makeMockMessages('hello'),
      convsMeeting: makeMockConversations('meeting'),
      msgsDesign: makeMockMessages('design'),
      scopeConversations: [CometChatSearchScope.Conversations],
      scopeMessages: [CometChatSearchScope.Messages],
      filterUnread: CometChatSearchFilter.Unread,
    },
    template: `
      <div style="display:flex;flex-direction:column;gap:20px;padding:20px;">
        <h3 style="margin:0;font-weight:bold;font-size:18px;">Search Variants</h3>

        <div style="display:flex;flex-direction:column;gap:8px;">
          <p style="margin:0;font-size:14px;color:#727272;">Default (pre-filled "hello")</p>
          <div style="width:400px;height:400px;border:1px solid #e0e0e0;border-radius:8px;overflow:hidden;">
            <cometchat-search-story-wrapper [hideBackButton]="true" defaultSearchText="hello" forceState="loaded" [mockConversations]="convs" [mockMessages]="msgs"></cometchat-search-story-wrapper>
          </div>
        </div>

        <div style="display:flex;flex-direction:column;gap:8px;">
          <p style="margin:0;font-size:14px;color:#727272;">Conversations Only</p>
          <div style="width:400px;height:400px;border:1px solid #e0e0e0;border-radius:8px;overflow:hidden;">
            <cometchat-search-story-wrapper [hideBackButton]="true" [searchIn]="scopeConversations" defaultSearchText="meeting" forceState="loaded" [mockConversations]="convsMeeting" [mockMessages]="[]"></cometchat-search-story-wrapper>
          </div>
        </div>

        <div style="display:flex;flex-direction:column;gap:8px;">
          <p style="margin:0;font-size:14px;color:#727272;">Messages Only</p>
          <div style="width:400px;height:400px;border:1px solid #e0e0e0;border-radius:8px;overflow:hidden;">
            <cometchat-search-story-wrapper [hideBackButton]="true" [searchIn]="scopeMessages" defaultSearchText="design" forceState="loaded" [mockConversations]="[]" [mockMessages]="msgsDesign"></cometchat-search-story-wrapper>
          </div>
        </div>

        <div style="display:flex;flex-direction:column;gap:8px;">
          <p style="margin:0;font-size:14px;color:#727272;">Empty State</p>
          <div style="width:400px;height:400px;border:1px solid #e0e0e0;border-radius:8px;overflow:hidden;">
            <cometchat-search-story-wrapper [hideBackButton]="true" [searchIn]="scopeMessages" defaultSearchText="noresults" forceState="empty"></cometchat-search-story-wrapper>
          </div>
        </div>

        <div style="display:flex;flex-direction:column;gap:8px;">
          <p style="margin:0;font-size:14px;color:#727272;">Loading State</p>
          <div style="width:400px;height:400px;border:1px solid #e0e0e0;border-radius:8px;overflow:hidden;">
            <cometchat-search-story-wrapper [hideBackButton]="true" [searchIn]="scopeMessages" defaultSearchText="loading" forceState="loading"></cometchat-search-story-wrapper>
          </div>
        </div>

        <div style="display:flex;flex-direction:column;gap:8px;">
          <p style="margin:0;font-size:14px;color:#727272;">Error State</p>
          <div style="width:400px;height:400px;border:1px solid #e0e0e0;border-radius:8px;overflow:hidden;">
            <cometchat-search-story-wrapper [hideBackButton]="true" [searchIn]="scopeMessages" defaultSearchText="error" forceState="error"></cometchat-search-story-wrapper>
          </div>
        </div>
      </div>
    `,
  }),
  parameters: {
    docs: { description: { story: 'Comprehensive showcase displaying all search component variants in a single view.' } },
  },
};

// ============================================
// Interaction Tests
// ============================================

export const TestDefaultRendersSearch: Story = {
  args: {
    defaultSearchText: 'hello',
    hideBackButton: false,
    forceState: 'loaded',
    mockConversations: makeMockConversations('hello'),
    mockMessages: makeMockMessages('hello'),
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="${CONTAINER}">
        <cometchat-search-story-wrapper
          [defaultSearchText]="defaultSearchText"
          [hideBackButton]="hideBackButton"
          [forceState]="forceState"
          [mockConversations]="mockConversations"
          [mockMessages]="mockMessages">
        </cometchat-search-story-wrapper>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    await new Promise(r => setTimeout(r, 500));
    const container = canvasElement.querySelector('.cometchat-search');
    expect(container).not.toBeNull();
    const input = canvasElement.querySelector('input');
    expect(input).not.toBeNull();
  },
};

export const TestHideBackButton: Story = {
  args: {
    defaultSearchText: 'hello',
    hideBackButton: true,
    forceState: 'loaded',
    mockConversations: makeMockConversations('hello'),
    mockMessages: makeMockMessages('hello'),
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="${CONTAINER}">
        <cometchat-search-story-wrapper
          [defaultSearchText]="defaultSearchText"
          [hideBackButton]="hideBackButton"
          [forceState]="forceState"
          [mockConversations]="mockConversations"
          [mockMessages]="mockMessages">
        </cometchat-search-story-wrapper>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    await new Promise(r => setTimeout(r, 500));
    const backButton = canvasElement.querySelector('.cometchat-search__back-button');
    expect(backButton).toBeNull();
  },
};
