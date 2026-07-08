/**
 * Public API for CometChatNotificationFeed component
 */

// Component
export { CometChatNotificationFeedComponent } from './cometchat-notification-feed.component';

// ViewModel
export { NotificationFeedViewModel } from './cometchat-notification-feed-view-model';

// Types
export type {
  NotificationFeedItem,
  NotificationCategory,
  NotificationFeedState,
  TimestampGroup,
  CardAction,
  CometChatNotificationFeedStyle,
  ScreenState,
  FeedEngagementType,
} from './cometchat-notification-feed.types';

// Utilities
export { VisibilityTracker, groupByTimestamp } from './cometchat-notification-feed.utils';

// Pipes
export { BadgeCountPipe, CardJsonPipe, CategoryUnreadCountPipe } from './cometchat-notification-feed.pipes';
