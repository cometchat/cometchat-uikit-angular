import { TemplateRef } from '@angular/core';

// ============================================
// Shared Templates (cross-cutting, all lists)
// ============================================

/**
 * Templates that apply to ALL list components as a fallback.
 * Component-specific templates take priority over shared templates.
 */
export interface SharedListTemplates {
  /** Custom loading state template for all lists */
  loadingView?: TemplateRef<void>;
  /** Custom empty state template for all lists */
  emptyView?: TemplateRef<void>;
  /** Custom error state template for all lists */
  errorView?: TemplateRef<{ $implicit: Error }>;
}

// ============================================
// Component-Specific Template Interfaces
// ============================================

/**
 * Templates for CometChatConversations.
 * Includes item-level slots (leading, title, subtitle, trailing) plus state slots.
 */
export interface ConversationTemplates {
  /** Custom template for the entire conversation item */
  itemView?: TemplateRef<any>;
  /** Custom template for the leading section (avatar, status indicator) */
  leadingView?: TemplateRef<any>;
  /** Custom template for the title section */
  titleView?: TemplateRef<any>;
  /** Custom template for the subtitle section */
  subtitleView?: TemplateRef<any>;
  /** Custom template for the trailing section (timestamp, badge) */
  trailingView?: TemplateRef<any>;
  /** Custom template for the loading state */
  loadingView?: TemplateRef<void>;
  /** Custom template for the empty state */
  emptyView?: TemplateRef<void>;
  /** Custom template for the error state */
  errorView?: TemplateRef<{ $implicit: Error }>;
}

/**
 * Templates for CometChatUsers.
 */
export interface UserTemplates {
  /** Custom template for the entire user item */
  itemView?: TemplateRef<any>;
  /** Custom template for the leading section (avatar) */
  leadingView?: TemplateRef<any>;
  /** Custom template for the title section */
  titleView?: TemplateRef<any>;
  /** Custom template for the subtitle section */
  subtitleView?: TemplateRef<any>;
  /** Custom template for the trailing section */
  trailingView?: TemplateRef<any>;
  /** Custom template for the loading state */
  loadingView?: TemplateRef<void>;
  /** Custom template for the empty state */
  emptyView?: TemplateRef<void>;
  /** Custom template for the error state */
  errorView?: TemplateRef<{ $implicit: Error }>;
}

/**
 * Templates for CometChatGroups.
 */
export interface GroupTemplates {
  /** Custom template for the entire group item */
  itemView?: TemplateRef<any>;
  /** Custom template for the leading section (avatar) */
  leadingView?: TemplateRef<any>;
  /** Custom template for the title section */
  titleView?: TemplateRef<any>;
  /** Custom template for the subtitle section */
  subtitleView?: TemplateRef<any>;
  /** Custom template for the trailing section */
  trailingView?: TemplateRef<any>;
  /** Custom template for the loading state */
  loadingView?: TemplateRef<void>;
  /** Custom template for the empty state */
  emptyView?: TemplateRef<void>;
  /** Custom template for the error state */
  errorView?: TemplateRef<{ $implicit: Error }>;
}

/**
 * Templates for CometChatGroupMembers.
 */
export interface GroupMemberTemplates {
  /** Custom template for the entire member item */
  itemView?: TemplateRef<any>;
  /** Custom template for the leading section (avatar) */
  leadingView?: TemplateRef<any>;
  /** Custom template for the title section */
  titleView?: TemplateRef<any>;
  /** Custom template for the subtitle section */
  subtitleView?: TemplateRef<any>;
  /** Custom template for the trailing section */
  trailingView?: TemplateRef<any>;
  /** Custom template for the loading state */
  loadingView?: TemplateRef<void>;
  /** Custom template for the empty state */
  emptyView?: TemplateRef<void>;
  /** Custom template for the error state */
  errorView?: TemplateRef<{ $implicit: Error }>;
}

/**
 * Templates for CometChatCallLogs.
 */
export interface CallLogTemplates {
  /** Custom template for the entire call log item */
  itemView?: TemplateRef<any>;
  /** Custom template for the leading section */
  leadingView?: TemplateRef<any>;
  /** Custom template for the title section */
  titleView?: TemplateRef<any>;
  /** Custom template for the subtitle section */
  subtitleView?: TemplateRef<any>;
  /** Custom template for the trailing section */
  trailingView?: TemplateRef<any>;
  /** Custom template for the loading state */
  loadingView?: TemplateRef<void>;
  /** Custom template for the empty state */
  emptyView?: TemplateRef<void>;
  /** Custom template for the error state */
  errorView?: TemplateRef<{ $implicit: Error }>;
}

/**
 * Templates for CometChatMessageList.
 * Message list has header/footer instead of leading/title/subtitle/trailing.
 */
export interface MessageListTemplates {
  /** Custom template for the loading state */
  loadingView?: TemplateRef<void>;
  /** Custom template for the empty state */
  emptyView?: TemplateRef<void>;
  /** Custom template for the error state */
  errorView?: TemplateRef<{ $implicit: Error }>;
  /** Custom template for the header section */
  headerView?: TemplateRef<any>;
  /** Custom template for the footer section */
  footerView?: TemplateRef<any>;
}

/**
 * Templates for CometChatSearch.
 * Search has two result sections (conversations + messages), each with their own
 * item/leading/title/subtitle/trailing slots, plus shared state views.
 */
export interface SearchTemplates {
  // Conversation result templates
  /** Custom template for the entire conversation item in search results */
  conversationItemView?: TemplateRef<any>;
  /** Custom template for the leading section of conversation items */
  conversationLeadingView?: TemplateRef<any>;
  /** Custom template for the title section of conversation items */
  conversationTitleView?: TemplateRef<any>;
  /** Custom template for the subtitle section of conversation items */
  conversationSubtitleView?: TemplateRef<any>;
  /** Custom template for the trailing section of conversation items */
  conversationTrailingView?: TemplateRef<any>;

  // Message result templates
  /** Custom template for the entire message item in search results */
  messageItemView?: TemplateRef<any>;
  /** Custom template for the leading section of message items */
  messageLeadingView?: TemplateRef<any>;
  /** Custom template for the title section of message items */
  messageTitleView?: TemplateRef<any>;
  /** Custom template for the subtitle section of message items */
  messageSubtitleView?: TemplateRef<any>;
  /** Custom template for the trailing section of message items */
  messageTrailingView?: TemplateRef<any>;

  // State views
  /** Custom template for the initial state (before user searches) */
  initialView?: TemplateRef<any>;
  /** Custom template for the loading state */
  loadingView?: TemplateRef<void>;
  /** Custom template for the empty state */
  emptyView?: TemplateRef<void>;
  /** Custom template for the error state */
  errorView?: TemplateRef<{ $implicit: Error }>;
}

/**
 * Legacy generic interface kept for backward compatibility.
 * Prefer the typed interfaces above for new code.
 */
export interface ListTemplates<T> {
  itemTemplate?: TemplateRef<{ $implicit: T; index: number }>;
  loadingTemplate?: TemplateRef<void>;
  emptyTemplate?: TemplateRef<void>;
  errorTemplate?: TemplateRef<{ $implicit: Error }>;
  headerTemplate?: TemplateRef<void>;
  footerTemplate?: TemplateRef<void>;
}
