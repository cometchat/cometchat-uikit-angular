/**
 * Types, interfaces, and regex constants for CometChatMentionsFormatter.
 */

import { MentionType } from '../Enums/Enums';

/**
 * Represents mention metadata extracted from text.
 */
export interface MentionData {
  /** The unique identifier of the mentioned user */
  uid: string;
  /** The display name of the mentioned user */
  name: string;
  /** The starting index of the mention in the original text */
  startIndex: number;
  /** The ending index of the mention in the original text (exclusive) */
  endIndex: number;
  /** The type of mention (self, other, or channel) */
  type?: MentionType;
}

/** Regex pattern for parsing user mentions in SDK format: `<@uid:{uid}>` */
export const USER_MENTION_REGEX = /<@uid:(.*?)>/g;

/** Regex pattern for parsing channel mentions: `<@all:{label}>` */
export const CHANNEL_MENTION_REGEX = /<@all:(.*?)>/g;
