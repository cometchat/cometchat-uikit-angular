import { CometChat } from '@cometchat/chat-sdk-javascript';

/**
 * Re-export the SDK's NotificationFeedItem type.
 * This provides full type safety for all SDK method calls (markFeedItemAsDelivered, etc.)
 * while giving consumers a convenient import path.
 */
export type NotificationFeedItem = CometChat.NotificationFeedItem;

/**
 * Represents a notification category for filter chips.
 */
export interface NotificationCategory {
  id: string;
  label: string;
}

/**
 * Engagement type for feed interactions.
 */
export type FeedEngagementType = 'viewed' | 'clicked' | 'interacted';

/**
 * Action triggered from a card element (from @cometchat/cards-angular).
 */
export interface CardAction {
  type: string;
  params: Record<string, any>;
  elementId?: string;
  cardJson?: string;
}

/**
 * Timestamp group for feed items grouped by date.
 */
export interface TimestampGroup {
  label: string;
  items: NotificationFeedItem[];
}

/**
 * Style customization for CometChatNotificationFeed.
 */
export interface CometChatNotificationFeedStyle {
  backgroundColor?: string;
  width?: string;
  height?: string;
  headerTitleColor?: string;
  headerTitleFont?: string;
  chipActiveBackgroundColor?: string;
  chipActiveTextColor?: string;
  chipInactiveBackgroundColor?: string;
  chipInactiveTextColor?: string;
  chipBorderColor?: string;
  badgeBackgroundColor?: string;
  badgeTextColor?: string;
  separatorColor?: string;
  timestampTextColor?: string;
  timestampFont?: string;
  cardBackgroundColor?: string;
  cardBorderColor?: string;
  cardBorderRadius?: string;
  cardBorderWidth?: string;
  unreadIndicatorColor?: string;
}

/**
 * Internal screen state for the feed.
 */
export type ScreenState = 'loading' | 'loaded' | 'empty' | 'error';

/**
 * Internal state for the NotificationFeed ViewModel.
 */
export interface NotificationFeedState {
  items: NotificationFeedItem[];
  groupedItems: TimestampGroup[];
  categories: NotificationCategory[];
  activeCategory: string | null;
  totalUnreadCount: number;
  categoryUnreadCounts: Map<string, number>;
  screenState: ScreenState;
  isLoadingMore: boolean;
  isRefreshing: boolean;
  isOffline: boolean;
  error: CometChat.CometChatException | null;
  hasMorePages: boolean;
  paginationError: boolean;
}
