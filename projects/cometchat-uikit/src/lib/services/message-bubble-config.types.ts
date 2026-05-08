/**
 * Types for MessageBubbleConfigService.
 */

import { TemplateRef } from '@angular/core';

/**
 * Type representing the different parts of a message bubble that can be customized.
 */
export type BubblePart =
  | 'bubbleView'
  | 'contentView'
  | 'bottomView'
  | 'footerView'
  | 'leadingView'
  | 'headerView'
  | 'statusInfoView'
  | 'replyView'
  | 'threadView';

/**
 * Type for message type key combining type and category.
 * Format: "{type}_{category}" e.g., "text_message", "image_message"
 */
export type MessageTypeKey = string;

/**
 * Map of bubble parts to their view templates.
 */
export interface BubblePartMap {
  bubbleView?: TemplateRef<any> | null;
  contentView?: TemplateRef<any> | null;
  bottomView?: TemplateRef<any> | null;
  footerView?: TemplateRef<any> | null;
  leadingView?: TemplateRef<any> | null;
  headerView?: TemplateRef<any> | null;
  statusInfoView?: TemplateRef<any> | null;
  replyView?: TemplateRef<any> | null;
  threadView?: TemplateRef<any> | null;
}
