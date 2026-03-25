/**
 * Conversation Slots Interface
 *
 * Defines fine-grained customization points for individual UI elements
 * within a conversation item. This enables slot-based customization where
 * developers can override specific elements without affecting others.
 *
 * @module interfaces/conversation-slots
 * @see Requirements 5.1 - Slot-Based Granular Customization
 */

import { TemplateRef } from '@angular/core';
import { CometChat } from '@cometchat/chat-sdk-javascript';

/**
 * Context object passed to all slot templates.
 *
 * Contains the conversation object and relevant state information
 * that templates can use for rendering decisions.
 *
 * @example
 * ```html
 * <ng-template #customAvatar let-conversation let-isActive="isActive">
 *   <div [class.active]="isActive">
 *     <img [src]="conversation.getConversationWith().getAvatar()" />
 *   </div>
 * </ng-template>
 * ```
 */
export interface ConversationSlotContext {
  /**
   * The conversation object (implicit context variable).
   * Available as `let-conversation` in templates.
   */
  $implicit: CometChat.Conversation;

  /**
   * The conversation object (explicit named variable).
   * Available as `let-conv="conversation"` in templates.
   */
  conversation: CometChat.Conversation;

  /**
   * Whether this conversation is currently active/selected for viewing.
   */
  isActive: boolean;

  /**
   * Whether this conversation is selected in selection mode.
   */
  isSelected: boolean;

  /**
   * The number of unread messages in this conversation.
   */
  unreadCount: number;

  /**
   * Whether someone is currently typing in this conversation.
   */
  isTyping: boolean;
}

/**
 * Interface defining all available slots for conversation item customization.
 *
 * Each slot corresponds to a specific UI element within the conversation item.
 * Providing a template for a slot will override only that element while
 * keeping default rendering for all other elements.
 *
 * The slots are organized into three sections:
 * - **Leading section**: avatar, statusIndicator, groupTypeIcon, typingIndicator
 * - **Body section**: title, subtitle, subtitleReceipt
 * - **Trailing section**: timestamp, unreadBadge, receipt, contextMenuTrigger
 *
 * @example
 * ```typescript
 * // Define custom slots
 * const customSlots: Partial<ConversationSlots> = {
 *   avatar: myCustomAvatarTemplate,
 *   unreadBadge: myCustomBadgeTemplate,
 * };
 *
 * // Use in component
 * <cometchat-conversation-item [slots]="customSlots" />
 * ```
 *
 * @see Requirements 5.1 - THE ConversationSlots interface SHALL define slots for:
 * avatar, statusIndicator, groupTypeIcon, typingIndicator, title, subtitle,
 * subtitleReceipt, timestamp, unreadBadge, receipt, contextMenuTrigger
 */
export interface ConversationSlots {
  // ============================================
  // Leading Section Slots
  // ============================================

  /**
   * Custom template for the avatar element.
   *
   * Receives the base ConversationSlotContext.
   *
   * @example
   * ```html
   * <ng-template #avatarSlot let-conversation>
   *   <img [src]="conversation.getConversationWith().getAvatar()"
   *        class="custom-avatar" />
   * </ng-template>
   * ```
   */
  avatar?: TemplateRef<ConversationSlotContext>;

  /**
   * Custom template for the user status indicator (online/offline).
   *
   * Receives ConversationSlotContext extended with the current status string.
   *
   * @example
   * ```html
   * <ng-template #statusSlot let-status="status">
   *   <span class="status-dot" [class.online]="status === 'online'"></span>
   * </ng-template>
   * ```
   */
  statusIndicator?: TemplateRef<ConversationSlotContext & { status: string }>;

  /**
   * Custom template for the group type icon (public/private/password).
   *
   * Receives ConversationSlotContext extended with the group type string.
   *
   * @example
   * ```html
   * <ng-template #groupTypeSlot let-groupType="groupType">
   *   <cometchat-icon [name]="groupType === 'private' ? 'lock' : 'globe'" />
   * </ng-template>
   * ```
   */
  groupTypeIcon?: TemplateRef<ConversationSlotContext & { groupType: string }>;

  /**
   * Custom template for the typing indicator animation.
   *
   * Receives the base ConversationSlotContext.
   *
   * @example
   * ```html
   * <ng-template #typingSlot let-isTyping="isTyping">
   *   <div *ngIf="isTyping" class="custom-typing-animation">
   *     <span class="dot"></span>
   *     <span class="dot"></span>
   *     <span class="dot"></span>
   *   </div>
   * </ng-template>
   * ```
   */
  typingIndicator?: TemplateRef<ConversationSlotContext>;

  // ============================================
  // Body Section Slots
  // ============================================

  /**
   * Custom template for the conversation title (user/group name).
   *
   * Receives ConversationSlotContext extended with the title string.
   *
   * @example
   * ```html
   * <ng-template #titleSlot let-title="title" let-isActive="isActive">
   *   <h3 [class.active]="isActive">{{ title }}</h3>
   * </ng-template>
   * ```
   */
  title?: TemplateRef<ConversationSlotContext & { title: string }>;

  /**
   * Custom template for the conversation subtitle (last message preview).
   *
   * Receives ConversationSlotContext extended with the subtitle string.
   *
   * @example
   * ```html
   * <ng-template #subtitleSlot let-subtitle="subtitle" let-isTyping="isTyping">
   *   <p *ngIf="!isTyping">{{ subtitle }}</p>
   *   <p *ngIf="isTyping" class="typing">typing...</p>
   * </ng-template>
   * ```
   */
  subtitle?: TemplateRef<ConversationSlotContext & { subtitle: string }>;

  /**
   * Custom template for the receipt indicator in the subtitle area.
   *
   * Receives ConversationSlotContext extended with the receipt status string.
   * Receipt status can be: 'sent', 'delivered', 'read', 'wait', 'error'.
   *
   * @example
   * ```html
   * <ng-template #subtitleReceiptSlot let-receiptStatus="receiptStatus">
   *   <cometchat-icon [name]="'receipt-' + receiptStatus" />
   * </ng-template>
   * ```
   */
  subtitleReceipt?: TemplateRef<ConversationSlotContext & { receiptStatus: string }>;

  // ============================================
  // Trailing Section Slots
  // ============================================

  /**
   * Custom template for the timestamp display.
   *
   * Receives ConversationSlotContext extended with the timestamp number.
   *
   * @example
   * ```html
   * <ng-template #timestampSlot let-timestamp="timestamp">
   *   <span class="custom-time">{{ timestamp | date:'shortTime' }}</span>
   * </ng-template>
   * ```
   */
  timestamp?: TemplateRef<ConversationSlotContext & { timestamp: number }>;

  /**
   * Custom template for the unread message count badge.
   *
   * Receives ConversationSlotContext extended with the count number.
   *
   * @example
   * ```html
   * <ng-template #badgeSlot let-count="count">
   *   <span *ngIf="count > 0" class="custom-badge">
   *     {{ count > 99 ? '99+' : count }}
   *   </span>
   * </ng-template>
   * ```
   */
  unreadBadge?: TemplateRef<ConversationSlotContext & { count: number }>;

  /**
   * Custom template for the message receipt indicator in the trailing section.
   *
   * Receives ConversationSlotContext extended with the receipt status string.
   * Receipt status can be: 'sent', 'delivered', 'read', 'wait', 'error'.
   *
   * @example
   * ```html
   * <ng-template #receiptSlot let-receiptStatus="receiptStatus">
   *   <div class="receipt-icon" [attr.data-status]="receiptStatus">
   *     <cometchat-icon [name]="'check-' + receiptStatus" />
   *   </div>
   * </ng-template>
   * ```
   */
  receipt?: TemplateRef<ConversationSlotContext & { receiptStatus: string }>;

  /**
   * Custom template for the context menu trigger button.
   *
   * Receives the base ConversationSlotContext.
   *
   * @example
   * ```html
   * <ng-template #contextMenuTriggerSlot let-conversation>
   *   <button class="custom-menu-trigger" aria-label="More options">
   *     <cometchat-icon name="more-vertical" />
   *   </button>
   * </ng-template>
   * ```
   */
  contextMenuTrigger?: TemplateRef<ConversationSlotContext>;
}
