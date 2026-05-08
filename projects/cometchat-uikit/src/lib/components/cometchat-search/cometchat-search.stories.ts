/**
 * CometChatSearch Storybook Stories
 *
 * Interactive stories demonstrating the unified search component variants:
 * - Default search with populated results (keyword-aware mock data)
 * - Empty / Loading / Error states
 * - Scoped search (conversations only, messages only)
 * - With initial filter pre-selected
 * - Limited filters, no back button
 * - All variants showcase
 *
 * @module components/cometchat-search
 */

import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CommonModule } from '@angular/common';
import { CometChatSearchComponent } from './cometchat-search.component';
import { CometChatSearchFilter, CometChatSearchScope } from '../../Enums/Enums';
import { SearchConversationsService } from '../../services/search-conversations.service';
import { SearchMessagesService } from '../../services/search-messages.service';
import { CometChatTemplatesService } from '../../services/templates.service';
import {
  createMockSearchConversationsService,
  createMockSearchMessagesService,
} from '../../../../../../.storybook/utils/mock-services';

// ============================================
// Meta Configuration
// ============================================

const meta: Meta<CometChatSearchComponent> = {
  title: 'Components/CometChatSearch',
  component: CometChatSearchComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [CommonModule, CometChatSearchComponent],
      providers: [CometChatTemplatesService],
    }),
  ],
  args: {
    hideBackButton: false,
    hideGroupType: false,
    hideUserStatus: false,
    hideReceipts: false,
  },
  argTypes: {
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
    uid: {
      control: 'text',
      description: 'Scope search to messages with a specific user (by UID)',
      table: { type: { summary: 'string' }, category: 'Scoping' },
    },
    guid: {
      control: 'text',
      description: 'Scope search to messages within a specific group (by GUID)',
      table: { type: { summary: 'string' }, category: 'Scoping' },
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
    backClick: { action: 'backClick', table: { category: 'Events' } },
    conversationClick: { action: 'conversationClick', table: { category: 'Events' } },
    messageClick: { action: 'messageClick', table: { category: 'Events' } },
    searchError: { action: 'searchError', table: { category: 'Events' } },
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
type Story = StoryObj<CometChatSearchComponent>;

const CONTAINER = 'width: 400px; height: 600px; border: 1px solid var(--cometchat-border-color-light, #e0e0e0); border-radius: var(--cometchat-radius-2, 8px); overflow: hidden;';

/** Shared provider decorator — dynamic mock services that generate keyword-aware data. */
const withDynamicMocks = moduleMetadata({
  providers: [
    { provide: SearchConversationsService, useFactory: () => createMockSearchConversationsService() },
    { provide: SearchMessagesService, useFactory: () => createMockSearchMessagesService() },
  ],
});

// ============================================
// Stories
// ============================================

/** Default search with pre-filled keyword. Both conversation and message results are shown with the keyword embedded in content. */
export const Default: Story = {
  decorators: [withDynamicMocks],
  args: {
    defaultSearchText: 'hello',
    hideBackButton: false,
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="${CONTAINER}">
        <cometchat-search
          [defaultSearchText]="defaultSearchText"
          [hideBackButton]="hideBackButton"
          [hideGroupType]="hideGroupType"
          [hideUserStatus]="hideUserStatus"
          [hideReceipts]="hideReceipts">
        </cometchat-search>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story: 'Default search pre-filled with "hello". Both conversation and message results contain the keyword. Change the search text in the controls to see results update dynamically.',
      },
    },
  },
};

/** Empty state when search returns no results. */
export const EmptyState: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        { provide: SearchConversationsService, useFactory: () => createMockSearchConversationsService({ forceState: 'empty' }) },
        { provide: SearchMessagesService, useFactory: () => createMockSearchMessagesService({ forceState: 'empty' }) },
      ],
    }),
  ],
  args: {
    defaultSearchText: 'xyznonexistent',
    hideBackButton: true,
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="${CONTAINER}">
        <cometchat-search
          [defaultSearchText]="defaultSearchText"
          [hideBackButton]="hideBackButton">
        </cometchat-search>
      </div>
    `,
  }),
  parameters: {
    docs: { description: { story: 'Empty state shown when a search query returns no matching results.' } },
  },
};

/** Loading state with shimmer placeholders. */
export const LoadingState: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        { provide: SearchConversationsService, useFactory: () => createMockSearchConversationsService({ forceState: 'loading' }) },
        { provide: SearchMessagesService, useFactory: () => createMockSearchMessagesService({ forceState: 'loading' }) },
      ],
    }),
  ],
  args: {
    defaultSearchText: 'loading',
    hideBackButton: true,
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="${CONTAINER}">
        <cometchat-search
          [defaultSearchText]="defaultSearchText"
          [hideBackButton]="hideBackButton">
        </cometchat-search>
      </div>
    `,
  }),
  parameters: {
    docs: { description: { story: 'Loading state shown while search results are being fetched. Displays shimmer/skeleton placeholders.' } },
  },
};

/** Error state when fetching fails. */
export const ErrorState: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        { provide: SearchConversationsService, useFactory: () => createMockSearchConversationsService({ forceState: 'error' }) },
        { provide: SearchMessagesService, useFactory: () => createMockSearchMessagesService({ forceState: 'error' }) },
      ],
    }),
  ],
  args: {
    defaultSearchText: 'error',
    hideBackButton: true,
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="${CONTAINER}">
        <cometchat-search
          [defaultSearchText]="defaultSearchText"
          [hideBackButton]="hideBackButton">
        </cometchat-search>
      </div>
    `,
  }),
  parameters: {
    docs: { description: { story: 'Error state shown when a search operation fails.' } },
  },
};

/** Search scoped to conversations only. */
export const ConversationsOnly: Story = {
  decorators: [withDynamicMocks],
  args: {
    defaultSearchText: 'meeting',
    searchIn: [CometChatSearchScope.Conversations],
    hideBackButton: true,
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="${CONTAINER}">
        <cometchat-search
          [defaultSearchText]="defaultSearchText"
          [searchIn]="searchIn"
          [hideBackButton]="hideBackButton">
        </cometchat-search>
      </div>
    `,
  }),
  parameters: {
    docs: { description: { story: 'Search scoped to conversations only. Message results are hidden.' } },
  },
};

/** Search scoped to messages only. */
export const MessagesOnly: Story = {
  decorators: [withDynamicMocks],
  args: {
    defaultSearchText: 'design',
    searchIn: [CometChatSearchScope.Messages],
    hideBackButton: true,
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="${CONTAINER}">
        <cometchat-search
          [defaultSearchText]="defaultSearchText"
          [searchIn]="searchIn"
          [hideBackButton]="hideBackButton">
        </cometchat-search>
      </div>
    `,
  }),
  parameters: {
    docs: { description: { story: 'Search scoped to messages only. Conversation results are hidden.' } },
  },
};

/** Search with the Unread filter pre-selected on load. */
export const WithInitialFilter: Story = {
  decorators: [withDynamicMocks],
  args: {
    initialSearchFilter: CometChatSearchFilter.Unread,
    hideBackButton: true,
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="${CONTAINER}">
        <cometchat-search
          [initialSearchFilter]="initialSearchFilter"
          [hideBackButton]="hideBackButton">
        </cometchat-search>
      </div>
    `,
  }),
  parameters: {
    docs: { description: { story: 'Search with the Unread filter pre-selected. Conversation results are shown immediately.' } },
  },
};

/** Search with a subset of filters (Photos, Videos, Documents only). */
export const LimitedFilters: Story = {
  decorators: [withDynamicMocks],
  args: {
    defaultSearchText: 'project',
    searchFilters: [CometChatSearchFilter.Photos, CometChatSearchFilter.Videos, CometChatSearchFilter.Documents],
    hideBackButton: true,
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="${CONTAINER}">
        <cometchat-search
          [defaultSearchText]="defaultSearchText"
          [searchFilters]="searchFilters"
          [hideBackButton]="hideBackButton">
        </cometchat-search>
      </div>
    `,
  }),
  parameters: {
    docs: { description: { story: 'Search with a limited set of filters — only Photos, Videos, and Documents.' } },
  },
};

/** Search with back button hidden. */
export const NoBackButton: Story = {
  decorators: [withDynamicMocks],
  args: {
    defaultSearchText: 'hello',
    hideBackButton: true,
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="${CONTAINER}">
        <cometchat-search
          [defaultSearchText]="defaultSearchText"
          [hideBackButton]="hideBackButton">
        </cometchat-search>
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

/** Comprehensive showcase of all search component variants in a single view. */
export const AllVariantsShowcase: Story = {
  decorators: [withDynamicMocks],
  render: () => ({
    props: {
      scopeConversations: [CometChatSearchScope.Conversations],
      scopeMessages: [CometChatSearchScope.Messages],
      filterUnread: CometChatSearchFilter.Unread,
      limitedFilters: [CometChatSearchFilter.Photos, CometChatSearchFilter.Videos, CometChatSearchFilter.Documents],
    },
    template: `
      <div style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-5, 20px); padding: var(--cometchat-spacing-5, 20px);">

        <h3 style="margin: 0; font: var(--cometchat-font-heading3-bold, bold 18px sans-serif); color: var(--cometchat-text-color-primary, #141414);">
          Search Variants
        </h3>

        <div style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2, 8px);">
          <p style="margin: 0; font: var(--cometchat-font-body-medium, 500 14px sans-serif); color: var(--cometchat-text-color-secondary, #727272);">Default (pre-filled "hello")</p>
          <div style="width: 400px; height: 400px; border: 1px solid var(--cometchat-border-color-light, #e0e0e0); border-radius: var(--cometchat-radius-2, 8px); overflow: hidden;">
            <cometchat-search [hideBackButton]="true" defaultSearchText="hello"></cometchat-search>
          </div>
        </div>

        <div style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2, 8px);">
          <p style="margin: 0; font: var(--cometchat-font-body-medium, 500 14px sans-serif); color: var(--cometchat-text-color-secondary, #727272);">Conversations Only</p>
          <div style="width: 400px; height: 400px; border: 1px solid var(--cometchat-border-color-light, #e0e0e0); border-radius: var(--cometchat-radius-2, 8px); overflow: hidden;">
            <cometchat-search [hideBackButton]="true" [searchIn]="scopeConversations" defaultSearchText="meeting"></cometchat-search>
          </div>
        </div>

        <div style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2, 8px);">
          <p style="margin: 0; font: var(--cometchat-font-body-medium, 500 14px sans-serif); color: var(--cometchat-text-color-secondary, #727272);">Messages Only</p>
          <div style="width: 400px; height: 400px; border: 1px solid var(--cometchat-border-color-light, #e0e0e0); border-radius: var(--cometchat-radius-2, 8px); overflow: hidden;">
            <cometchat-search [hideBackButton]="true" [searchIn]="scopeMessages" defaultSearchText="design"></cometchat-search>
          </div>
        </div>

        <div style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2, 8px);">
          <p style="margin: 0; font: var(--cometchat-font-body-medium, 500 14px sans-serif); color: var(--cometchat-text-color-secondary, #727272);">With Unread Filter Pre-selected</p>
          <div style="width: 400px; height: 400px; border: 1px solid var(--cometchat-border-color-light, #e0e0e0); border-radius: var(--cometchat-radius-2, 8px); overflow: hidden;">
            <cometchat-search [hideBackButton]="true" [initialSearchFilter]="filterUnread"></cometchat-search>
          </div>
        </div>

        <div style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2, 8px);">
          <p style="margin: 0; font: var(--cometchat-font-body-medium, 500 14px sans-serif); color: var(--cometchat-text-color-secondary, #727272);">With Back Button</p>
          <div style="width: 400px; height: 400px; border: 1px solid var(--cometchat-border-color-light, #e0e0e0); border-radius: var(--cometchat-radius-2, 8px); overflow: hidden;">
            <cometchat-search [hideBackButton]="false" defaultSearchText="hello"></cometchat-search>
          </div>
        </div>

      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story: 'Comprehensive showcase displaying all search component variants in a single view.',
      },
    },
  },
};
