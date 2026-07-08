import { Pipe, PipeTransform } from '@angular/core';
import { NotificationFeedItem } from './cometchat-notification-feed.types';

/**
 * Pure pipe to format badge count with 99+ cap.
 * Replaces method call in template to avoid re-evaluation on every CD cycle.
 */
@Pipe({
  name: 'badgeCount',
  standalone: true,
  pure: true,
})
export class BadgeCountPipe implements PipeTransform {
  transform(count: number, max: number = 99): string {
    return count > max ? `${max}+` : `${count}`;
  }
}

/**
 * Pure pipe to extract card JSON string from a NotificationFeedItem.
 * Replaces method call in template to avoid JSON.stringify on every CD cycle.
 */
@Pipe({
  name: 'cardJson',
  standalone: true,
  pure: true,
})
export class CardJsonPipe implements PipeTransform {
  transform(item: NotificationFeedItem): string {
    try {
      const content = item.getContent();
      return typeof content === 'string' ? content : JSON.stringify(content);
    } catch {
      return '';
    }
  }
}

/**
 * Pure pipe to get category unread count from the Map.
 * Replaces method call in template to avoid re-evaluation on every CD cycle.
 */
@Pipe({
  name: 'categoryUnreadCount',
  standalone: true,
  pure: true,
})
export class CategoryUnreadCountPipe implements PipeTransform {
  transform(categoryId: string, categoryUnreadCounts: Map<string, number>): number {
    return categoryUnreadCounts.get(categoryId) || 0;
  }
}
