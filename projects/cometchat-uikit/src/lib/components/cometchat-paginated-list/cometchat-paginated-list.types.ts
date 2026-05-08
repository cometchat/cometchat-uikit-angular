/**
 * Types and interfaces for CometChatPaginatedList component.
 */

/**
 * Context object provided to item templates.
 */
export interface PaginatedListItemContext<T> {
  $implicit: T;
  index: number;
}

/**
 * Options for keyboard navigation in the paginated list.
 */
export interface KeyNavOptions {
  itemCount: number;
  wrap: boolean;
}
