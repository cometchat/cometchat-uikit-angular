/**
 * CometChatNotificationFeed Storybook Stories
 *
 * The feed builds its own view model and fetches through request builders.
 * Stories pass mock `notificationFeedRequestBuilder` and
 * `notificationCategoriesRequestBuilder` inputs, so every screen state
 * (loaded, loading, empty, error) is produced by the component's real data
 * flow without SDK initialization. Engagement reporting and the real-time
 * listener are fire-and-forget and fail silently without an SDK session.
 *
 * @module components/cometchat-notification-feed
 */

import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CommonModule } from '@angular/common';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatNotificationFeedComponent } from './cometchat-notification-feed.component';
import type { NotificationCategory, NotificationFeedItem } from './cometchat-notification-feed.types';
import { MOCK_AVATARS } from '../../../../../../.storybook/utils/mock-data';
import { expect, waitFor } from 'storybook/test';

// ============================================
// Mock Data
// ============================================

const NOW = Math.floor(Date.now() / 1000);
const HOUR = 3600;
const DAY = 86400;

/** Builds a mock feed item exposing the getters the feed reads. */
function createFeedItem(opts: {
  id: string;
  category: string;
  sentAt: number;
  readAt?: number | null;
  content: Record<string, unknown>;
}): NotificationFeedItem {
  let readAt: number | null = opts.readAt ?? null;
  return {
    getId: () => opts.id,
    getCategory: () => opts.category,
    getSentAt: () => opts.sentAt,
    getReadAt: () => readAt,
    setReadAt: (value: number) => { readAt = value; },
    getContent: () => opts.content,
  } as unknown as NotificationFeedItem;
}

/** A simple promo card body in the Card Schema format. */
function promoCard(title: string, body: string, cta: string, url: string): Record<string, unknown> {
  return {
    version: '1.0',
    fallbackText: title,
    body: [
      { id: 'title', type: 'text', content: title, variant: 'heading4', fontWeight: 'bold' },
      { id: 'body', type: 'text', content: body, variant: 'body2' },
      { id: 'cta', type: 'button', label: cta, variant: 'tonal', action: { type: 'openUrl', url } },
    ],
  };
}

/** Builds a fresh set of feed items (fresh so read-state never leaks between stories). */
function createFeedItems(): NotificationFeedItem[] {
  return [
    createFeedItem({
      id: 'feed-1',
      category: 'Promotions',
      sentAt: NOW - 10 * 60,
      content: promoCard('Weekend sale: 30% off', 'Upgrade to the Pro plan before Sunday and save.', 'View offer', 'https://example.com/offer'),
    }),
    createFeedItem({
      id: 'feed-2',
      category: 'Updates',
      sentAt: NOW - 3 * HOUR,
      content: {
        version: '1.0',
        fallbackText: 'Nancy Grace mentioned you',
        body: [
          {
            id: 'row',
            type: 'row',
            gap: 8,
            items: [
              { id: 'avatar', type: 'avatar', imageUrl: MOCK_AVATARS.nancyGrace, size: 32 },
              { id: 'text', type: 'text', content: 'Nancy Grace mentioned you in #design', variant: 'body2' },
            ],
          },
        ],
      },
    }),
    createFeedItem({
      id: 'feed-3',
      category: 'Updates',
      sentAt: NOW - DAY - HOUR,
      readAt: NOW - DAY,
      content: promoCard('New: message scheduling', 'Write now, send later. Try it from the composer.', 'Learn more', 'https://example.com/scheduling'),
    }),
    createFeedItem({
      id: 'feed-4',
      category: 'Promotions',
      sentAt: NOW - 3 * DAY,
      readAt: NOW - 2 * DAY,
      content: promoCard('Invite friends, get credits', 'Earn 1 month free for every friend who joins.', 'Invite', 'https://example.com/invite'),
    }),
  ];
}

const MOCK_CATEGORIES: NotificationCategory[] = [
  { id: 'Promotions', label: 'Promotions' },
  { id: 'Updates', label: 'Updates' },
];

type FeedMode = 'loaded' | 'loading' | 'empty' | 'error';

/** Mock feed request builder: the first fetch resolves according to `mode`, later pages are empty. */
function createFeedRequestBuilder(mode: FeedMode): { fetchNext: () => Promise<NotificationFeedItem[]> } {
  const items = createFeedItems();
  let fetched = false;
  return {
    fetchNext: () => {
      switch (mode) {
        case 'loading':
          // Never settles, so the feed stays in its loading state.
          return new Promise<NotificationFeedItem[]>(() => undefined);
        case 'error':
          return Promise.reject({ code: 'ERR_NETWORK', message: 'Failed to fetch notifications' });
        case 'empty':
          return Promise.resolve([]);
        default:
          if (fetched) return Promise.resolve([]);
          fetched = true;
          return Promise.resolve(items);
      }
    },
  };
}

/** Mock categories request builder. */
function createCategoriesRequestBuilder(): { fetchNext: () => Promise<NotificationCategory[]> } {
  return { fetchNext: () => Promise.resolve(MOCK_CATEGORIES) };
}

// ============================================
// Meta Configuration
// ============================================

const meta: Meta<CometChatNotificationFeedComponent> = {
  title: 'Components/Notifications/Notification Feed',
  component: CometChatNotificationFeedComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [CommonModule, CometChatNotificationFeedComponent],
    }),
  ],
  // The feed reports delivery/views/reads and polls the unread count through
  // SDK REST calls. With the SDK never initialised, each of those leaves an
  // unhandled rejection ("reading 'getAdminHost'") that fails the story's test,
  // so answer them locally and put the SDK back afterwards.
  beforeEach: () => {
    const original = {
      markFeedItemAsDelivered: CometChat.markFeedItemAsDelivered,
      markFeedItemAsRead: CometChat.markFeedItemAsRead,
      reportFeedEngagement: CometChat.reportFeedEngagement,
      getNotificationFeedUnreadCount: CometChat.getNotificationFeedUnreadCount,
    };
    CometChat.markFeedItemAsDelivered = () => Promise.resolve();
    CometChat.markFeedItemAsRead = () => Promise.resolve();
    CometChat.reportFeedEngagement = () => Promise.resolve();
    CometChat.getNotificationFeedUnreadCount = () => Promise.resolve({ count: 0 });
    return () => {
      Object.assign(CometChat, original);
    };
  },
  args: {
    title: '',
    showHeader: true,
    showBackButton: false,
    showFilterChips: true,
    cardThemeMode: 'auto',
  },
  argTypes: {
    // Display
    title: {
      control: 'text',
      description: "Title displayed in the header. Defaults to the localized 'notifications_title'.",
      table: { type: { summary: 'string' }, defaultValue: { summary: "''" }, category: 'Display' },
    },
    showHeader: {
      control: 'boolean',
      description: 'Whether to show the header.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' }, category: 'Display' },
    },
    showBackButton: {
      control: 'boolean',
      description: 'Whether to show the back button in the header.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' }, category: 'Display' },
    },
    showFilterChips: {
      control: 'boolean',
      description: 'Whether to show the category filter chips.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' }, category: 'Display' },
    },
    scrollToItemId: {
      control: 'text',
      description: 'Deep link: scroll to a specific feed item by ID after load.',
      table: { type: { summary: 'string | undefined' }, category: 'Display' },
    },
    // Data
    notificationFeedRequestBuilder: {
      control: false,
      description: 'Custom request builder for fetching feed items.',
      table: { type: { summary: 'NotificationFeedRequest' }, category: 'Data' },
    },
    notificationCategoriesRequestBuilder: {
      control: false,
      description: 'Custom request builder for fetching filter categories.',
      table: { type: { summary: 'NotificationCategoriesRequest' }, category: 'Data' },
    },
    // Appearance
    style: {
      control: 'object',
      description: 'Style customization (colors, fonts, card borders, unread indicator).',
      table: { type: { summary: 'CometChatNotificationFeedStyle' }, category: 'Appearance' },
    },
    cardThemeMode: {
      control: 'select',
      options: ['auto', 'light', 'dark'],
      description: 'Card theme mode forwarded to @cometchat/cards-angular.',
      table: { type: { summary: "'auto' | 'light' | 'dark'" }, defaultValue: { summary: "'auto'" }, category: 'Appearance' },
    },
    cardThemeOverride: {
      control: 'object',
      description: 'Card theme override forwarded to @cometchat/cards-angular.',
      table: { type: { summary: 'Record<string, any>' }, category: 'Appearance' },
    },
    // Templates
    headerView: { control: false, description: 'Custom header template.', table: { type: { summary: 'TemplateRef<any>' }, category: 'Templates' } },
    loadingStateView: { control: false, description: 'Custom loading state template.', table: { type: { summary: 'TemplateRef<any>' }, category: 'Templates' } },
    emptyStateView: { control: false, description: 'Custom empty state template.', table: { type: { summary: 'TemplateRef<any>' }, category: 'Templates' } },
    errorStateView: { control: false, description: 'Custom error state template.', table: { type: { summary: 'TemplateRef<any>' }, category: 'Templates' } },
    // Events
    itemClick: {
      action: 'itemClick',
      description: 'Emitted when a feed item is clicked.',
      table: { type: { summary: 'EventEmitter<NotificationFeedItem>' }, category: 'Events' },
    },
    actionClick: {
      action: 'actionClick',
      description: 'Emitted when a card action button is clicked.',
      table: { type: { summary: 'EventEmitter<{ item: NotificationFeedItem; action: CometChatCardAction }>' }, category: 'Events' },
    },
    error: {
      action: 'error',
      description: 'Emitted when an error occurs.',
      table: { type: { summary: 'EventEmitter<CometChat.CometChatException>' }, category: 'Events' },
    },
    backClick: {
      action: 'backClick',
      description: 'Emitted when the back button is pressed.',
      table: { type: { summary: 'EventEmitter<void>' }, category: 'Events' },
    },
  },
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'CometChatNotificationFeed displays campaign and promotional notifications as rendered cards, grouped by date, with category filter chips and unread counts. It handles loading, empty and error states (with retry), infinite-scroll pagination, real-time updates and engagement reporting (delivered, viewed, read, clicked, interacted).',
      },
    },
  },
};

export default meta;
type Story = StoryObj<CometChatNotificationFeedComponent>;

/** Shared render: a fixed-size panel with mock builders for the given screen state. */
const renderFeed = (mode: FeedMode): Story['render'] => (args) => ({
  props: {
    ...args,
    feedBuilder: createFeedRequestBuilder(mode),
    categoriesBuilder: createCategoriesRequestBuilder(),
  },
  template: `
    <div style="width: 400px; height: 600px; overflow: hidden; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2);">
      <cometchat-notification-feed
        [title]="title"
        [showHeader]="showHeader"
        [showBackButton]="showBackButton"
        [showFilterChips]="showFilterChips"
        [style]="style"
        [cardThemeMode]="cardThemeMode"
        [cardThemeOverride]="cardThemeOverride"
        [notificationFeedRequestBuilder]="feedBuilder"
        [notificationCategoriesRequestBuilder]="categoriesBuilder"
        (itemClick)="itemClick($event)"
        (actionClick)="actionClick($event)"
        (error)="error($event)"
        (backClick)="backClick($event)">
      </cometchat-notification-feed>
    </div>
  `,
});

// ============================================
// Stories
// ============================================

/** Default feed with notifications across two categories and several days. */
export const Default: Story = {
  render: renderFeed('loaded'),
  parameters: {
    docs: {
      description: {
        story:
          'Feed with four notifications grouped by date (today, yesterday, earlier this week), unread indicators on new items, and Promotions / Updates filter chips.',
      },
    },
  },
};

/** Loading state while the first page is being fetched. */
export const LoadingState: Story = {
  render: renderFeed('loading'),
  parameters: {
    docs: {
      description: {
        story: 'Loading state: the feed request never settles, so the built-in loading spinner stays visible.',
      },
    },
  },
};

/** Empty state when there are no notifications. */
export const EmptyState: Story = {
  render: renderFeed('empty'),
  parameters: {
    docs: {
      description: {
        story: 'Empty state shown when the first fetch returns no notifications.',
      },
    },
  },
};

/** Error state with a retry button. */
export const ErrorState: Story = {
  render: renderFeed('error'),
  parameters: {
    docs: {
      description: {
        story:
          'Error state shown when fetching notifications fails. The retry button re-runs the fetch (which fails again in this story). The `error` output is logged in the Actions panel.',
      },
    },
  },
};

/** Feed with a back button and a custom title. */
export const WithBackButton: Story = {
  args: { showBackButton: true, title: 'Inbox' },
  render: renderFeed('loaded'),
  parameters: {
    docs: {
      description: { story: 'Header with a back button and a custom "Inbox" title.' },
    },
  },
};

/** Feed without the filter chips row. */
export const WithoutFilterChips: Story = {
  args: { showFilterChips: false },
  render: renderFeed('loaded'),
  parameters: {
    docs: {
      description: { story: 'Feed with the category filter chips hidden.' },
    },
  },
};

// ============================================
// Interaction Tests
// ============================================

/** Test: loaded feed renders one item per mock notification. */
export const TestDefaultRendersItems: Story = {
  render: renderFeed('loaded'),
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      expect(canvasElement.querySelectorAll('.cometchat-notification-feed__item')).toHaveLength(4);
    });
  },
};

/** Test: a failed fetch renders the error state with a retry button. */
export const TestErrorStateShowsRetry: Story = {
  render: renderFeed('error'),
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      expect(canvasElement.querySelector('.cometchat-notification-feed__error')).not.toBeNull();
    });
    expect(canvasElement.querySelector('.cometchat-notification-feed__error-retry-button')).not.toBeNull();
    expect(canvasElement.querySelectorAll('.cometchat-notification-feed__item')).toHaveLength(0);
  },
};
