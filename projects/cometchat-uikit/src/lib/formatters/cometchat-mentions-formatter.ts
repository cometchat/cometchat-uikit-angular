import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatTextFormatter } from './cometchat-text-formatter';
import { MentionType, MessageBubbleAlignment } from '../Enums/Enums';

/**
 * Interface representing mention metadata extracted from text.
 *
 * Contains information about a detected @mention including the user's
 * unique identifier, display name, and position within the text.
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

/**
 * Regex pattern for parsing user mentions in SDK format.
 * Matches `<@uid:{uid}>` where uid is captured in group 1.
 * @see Requirements 1.3
 */
export const USER_MENTION_REGEX = /<@uid:(.*?)>/g;

/**
 * Regex pattern for parsing channel mentions (e.g., @all).
 * Matches `<@all:{label}>` where label is captured in group 1.
 */
export const CHANNEL_MENTION_REGEX = /<@all:(.*?)>/g;

/**
 * Formatter for @mentions in text.
 *
 * Detects @username patterns in text and extracts mention metadata.
 * This formatter can match mentions against a list of available users
 * and supports @all mentions for group contexts.
 *
 * @example
 * ```typescript
 * const formatter = new CometChatMentionsFormatter();
 *
 * // Set available users for matching
 * formatter.setUsers([user1, user2, user3]);
 *
 * // Set the logged-in user for self-mention detection
 * formatter.setLoggedInUser(currentUser);
 *
 * // Format text with mentions
 * const formatted = formatter.format('Hello @john, how are you?');
 *
 * // Get detected mentions
 * const mentions = formatter.getMentions();
 * // [{ uid: 'john123', name: 'John', startIndex: 6, endIndex: 11, type: 'other' }]
 * ```
 *
 * @see Requirements 5.1, 5.2, 5.3, 5.4, 5.5
 */
/**
 * Escape special HTML characters to prevent XSS and rendering issues.
 * Handles usernames/UIDs containing <, >, &, ", ' characters.
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export class CometChatMentionsFormatter extends CometChatTextFormatter {
  /**
   * Unique identifier for this formatter.
   * @see Requirements 5.1
   */
  readonly id = 'mentions-formatter';

  /**
   * Formatter priority (lower = earlier in pipeline).
   * Mentions are processed with priority 20.
   * @see Requirements 5.5
   */
  override priority = 20;

  /**
   * Array of detected mentions from the last format() call
   * @private
   */
  private mentions: MentionData[] = [];

  /**
   * Map of available users for mention matching.
   * Key is the lowercase username, value is the user/member object.
   * @private
   */
  private users = new Map<string, CometChat.User | CometChat.GroupMember>();

  /**
   * Flag to enable @all mentions for groups
   * @private
   */
  private enableAllMention = true;

  /**
   * Label for the @all mention (default: 'all')
   * @private
   */
  private allMentionLabel = 'all';

  /**
   * The logged-in user for self-mention detection
   * @private
   */
  private loggedInUser: CometChat.User | null = null;

  /**
   * The message bubble alignment for determining incoming/outgoing direction.
   * - `left` → incoming (message from another user)
   * - `right` → outgoing (message from the logged-in user)
   * - `undefined` → no direction class applied (e.g., composer, conversation subtitle)
   *
   * @private
   * @see Requirements 5.2, 8.4
   */
  private messageBubbleAlignment: MessageBubbleAlignment | undefined;

  /**
   * Set the logged-in user for self-mention detection.
   *
   * When a mention matches the logged-in user's UID, it will be styled
   * with the self-mention CSS class.
   *
   * @param user - The logged-in CometChat.User object
   * @see Requirements 5.2
   */
  setLoggedInUser(user: CometChat.User | null): void {
    this.loggedInUser = user;
  }

  /**
   * Get the logged-in user.
   *
   * @returns The logged-in user or null if not set
   */
  getLoggedInUser(): CometChat.User | null {
    return this.loggedInUser;
  }

  /**
   * Set the message bubble alignment for determining incoming/outgoing direction.
   *
   * When set, the formatter will apply direction CSS classes:
   * - `left` → `cometchat-mentions-incoming`
   * - `right` → `cometchat-mentions-outgoing`
   * - `undefined` → no direction class (for composer, conversation subtitle)
   *
   * @param alignment - The message bubble alignment, or undefined to clear
   * @see Requirements 5.2, 8.4
   */
  setMessageBubbleAlignment(alignment: MessageBubbleAlignment | undefined): void {
    this.messageBubbleAlignment = alignment;
  }

  /**
   * Get the current message bubble alignment.
   *
   * @returns The message bubble alignment, or undefined if not set
   */
  getMessageBubbleAlignment(): MessageBubbleAlignment | undefined {
    return this.messageBubbleAlignment;
  }

  /**
   * Set available users for mention matching.
   *
   * Users are indexed by their lowercase name for case-insensitive matching.
   * Call this method before format() to enable user matching.
   *
   * @param users - Array of User or GroupMember objects to match against
   */
  setUsers(users: (CometChat.User | CometChat.GroupMember)[]): void {
    this.users.clear();
    users.forEach(user => {
      const name = user.getName().toLowerCase();
      this.users.set(name, user);
    });
  }

  /**
   * Configure @all mention support.
   *
   * @param enabled - Whether to enable @all mentions
   * @param label - The label for @all mentions (default: 'all')
   */
  setAllMentionConfig(enabled: boolean, label = 'all'): void {
    this.enableAllMention = enabled;
    this.allMentionLabel = label;
  }

  /**
   * Get the regex pattern for detecting @mentions in plain text.
   *
   * Matches @ followed by one or more word characters (letters, numbers, underscore).
   * The pattern uses the global flag to find all matches in the text.
   * This is used for detecting mentions as the user types in the composer.
   *
   * @returns RegExp pattern for @mention detection in plain text
   */
  getRegex(): RegExp {
    return /@(\w+)/g;
  }

  /**
   * Get the regex pattern for parsing user mentions in SDK format.
   * Matches `<@uid:{uid}>` where uid is captured in group 1.
   *
   * @returns RegExp pattern for SDK format user mention parsing
   * @see Requirements 1.3
   */
  getUserMentionRegex(): RegExp {
    return new RegExp(USER_MENTION_REGEX.source, 'g');
  }

  /**
   * Get the regex pattern for parsing channel mentions in SDK format.
   * Matches `<@all:{label}>` where label is captured in group 1.
   *
   * @returns RegExp pattern for SDK format channel mention parsing
   */
  getChannelMentionRegex(): RegExp {
    return new RegExp(CHANNEL_MENTION_REGEX.source, 'g');
  }

  /**
   * Format the input text by detecting and highlighting @mentions.
   *
   * This method:
   * 1. Stores the original text
   * 2. Detects all @mention patterns
   * 3. Matches mentions against available users
   * 4. Determines mention type (self, other, or channel)
   * 5. Stores mention metadata (uid, name, startIndex, endIndex, type)
   * 6. Returns formatted text with highlighted mentions using BEM CSS classes
   *
   * Mentions are wrapped in a span with the appropriate CSS class:
   * - Self-mention: `cometchat-mentions cometchat-mentions-you`
   * - Other-user mention: `cometchat-mentions cometchat-mentions-other`
   * - Channel mention (@all): `cometchat-mentions cometchat-mentions-you`
   * - Incoming direction: adds `cometchat-mentions-incoming`
   * - Outgoing direction: adds `cometchat-mentions-outgoing`
   *
   * @param text - The text to format
   * @returns The formatted text with highlighted mentions
   * @see Requirements 5.1, 5.2, 5.3, 5.4
   */
  format(text: string): string {
    if (text == null) {
      this.originalText = '';
      this.formattedText = '';
      this.metadata = { mentions: [] };
      return '';
    }

    this.originalText = text;
    this.mentions = [];

    let lastIndex = 0;
    let result = '';

    const regex = this.getRegex();
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      const fullMatch = match[0]; // e.g., "@john"
      const username = match[1]; // e.g., "john"
      const matchStartIndex = match.index;
      const matchEndIndex = matchStartIndex + fullMatch.length;

      // Add text before this match
      result += text.slice(lastIndex, matchStartIndex);

      // Check if this is an @all mention
      if (this.enableAllMention && username.toLowerCase() === this.allMentionLabel.toLowerCase()) {
        // Store @all mention metadata with channel type
        this.mentions.push({
          uid: 'all',
          name: this.allMentionLabel,
          startIndex: matchStartIndex,
          endIndex: matchEndIndex,
          type: MentionType.channel,
        });

        // Build CSS classes matching React UIKit structure
        // Channel mentions (@all) use "cometchat-mentions-you" class
        // @see Requirements 5.1, 5.2
        const cssClasses = this.buildMentionCssClasses(MentionType.channel);
        const formattedMention = `<span class="${cssClasses}" data-uid="all" data-mention-type="channel" data-self="true">@${escapeHtml(this.allMentionLabel)}</span>`;
        result += formattedMention;
      } else {
        // Try to match against available users
        const user = this.users.get(username.toLowerCase());

        if (user) {
          // Get user ID - works for both User and GroupMember
          const uid = this.getUserId(user);
          const displayName = user.getName();

          // Determine mention type based on logged-in user
          const mentionType = this.getMentionType(uid);

          // Store mention metadata with type
          this.mentions.push({
            uid,
            name: displayName,
            startIndex: matchStartIndex,
            endIndex: matchEndIndex,
            type: mentionType,
          });

          // Build CSS classes matching React UIKit structure
          // @see Requirements 5.1, 5.2, 8.1
          const cssClasses = this.buildMentionCssClasses(mentionType);
          const isSelf = mentionType === MentionType.self;
          const formattedMention = `<span class="${cssClasses}" data-uid="${escapeHtml(uid)}" data-mention-type="${mentionType}" data-self="${isSelf}">@${escapeHtml(displayName)}</span>`;
          result += formattedMention;
        } else {
          // No matching user found, keep original text
          result += fullMatch;
        }
      }

      lastIndex = matchEndIndex;
    }

    // Add remaining text after last match
    result += text.slice(lastIndex);

    this.formattedText = result;
    this.metadata = { mentions: this.mentions };

    return this.formattedText;
  }

  /**
   * Determine the mention type based on the mentioned user's UID.
   *
   * @param uid - The UID of the mentioned user
   * @returns The mention type (self or other)
   * @private
   */
  private getMentionType(uid: string): MentionType {
    // Check if the mentioned user is the logged-in user
    if (this.loggedInUser && this.loggedInUser.getUid() === uid) {
      return MentionType.self;
    }
    return MentionType.other;
  }

  /**
   * Build the CSS class string for a mention span.
   *
   * Produces classes matching the React UIKit structure:
   * - `cometchat-mentions` — always present
   * - `cometchat-mentions-you` — self mention (uid matches loggedInUser) or channel mention (@all)
   * - `cometchat-mentions-other` — other user mention
   * - `cometchat-mentions-incoming` — when messageBubbleAlignment is left
   * - `cometchat-mentions-outgoing` — when messageBubbleAlignment is right
   *
   * When messageBubbleAlignment is undefined (composer, conversation subtitle),
   * no direction class is applied.
   *
   * @param mentionType - The type of mention (self, other, or channel)
   * @returns The CSS class string for the mention span
   * @private
   * @see Requirements 5.1, 5.2, 8.1
   */
  private buildMentionCssClasses(mentionType: MentionType): string {
    const classes: string[] = ['cometchat-mentions'];

    // Self/channel mentions get "you", other mentions get "other"
    if (mentionType === MentionType.self || mentionType === MentionType.channel) {
      classes.push('cometchat-mentions-you');
    } else {
      classes.push('cometchat-mentions-other');
    }
    // Direction class based on messageBubbleAlignment
    if (this.messageBubbleAlignment === MessageBubbleAlignment.left) {
      classes.push('cometchat-mentions-incoming');
    } else if (this.messageBubbleAlignment === MessageBubbleAlignment.right) {
      classes.push('cometchat-mentions-outgoing');
    }
    // When messageBubbleAlignment is undefined (composer, conversation subtitle), no direction class

    return classes.join(' ');
  }

  /**
   * Get the array of detected mentions from the last format() call.
   *
   * @returns Array of MentionData objects containing mention metadata
   */
  getMentions(): MentionData[] {
    return [...this.mentions];
  }

  /**
   * Check if the text contains any mentions.
   *
   * @returns true if mentions were detected, false otherwise
   */
  hasMentions(): boolean {
    return this.mentions.length > 0;
  }

  /**
   * Check if the text contains an @all mention.
   *
   * @returns true if @all mention was detected, false otherwise
   */
  hasAllMention(): boolean {
    return this.mentions.some(mention => mention.uid === 'all');
  }

  /**
   * Parse and format mentions in SDK format from text.
   *
   * This method handles text containing mentions in the SDK format:
   * - User mentions: `<@uid:{uid}>` - parsed using USER_MENTION_REGEX
   * - Channel mentions: `<@all:{label}>` - parsed using CHANNEL_MENTION_REGEX
   *
   * The method replaces SDK format mentions with styled spans and extracts
   * mention metadata. It uses the mentionedUsers array to look up display names.
   *
   * @param text - The text containing SDK format mentions
   * @param mentionedUsers - Array of mentioned users from the message for name lookup
   * @returns The formatted text with highlighted mentions
   * @see Requirements 1.2, 1.3, 1.4
   */
  formatSdkMentions(
    text: string,
    mentionedUsers: (CometChat.User | CometChat.GroupMember)[] = []
  ): string {
    this.originalText = text;
    this.mentions = [];

    // Build a map of UID to user for quick lookup
    const userMap = new Map<string, CometChat.User | CometChat.GroupMember>();
    mentionedUsers.forEach(user => {
      userMap.set(user.getUid(), user);
    });

    let result = text;

    // First, process channel mentions (<@all:{label}>)
    const channelRegex = this.getChannelMentionRegex();
    result = result.replace(channelRegex, (fullMatch, label, offset) => {
      // Store channel mention metadata
      this.mentions.push({
        uid: 'all',
        name: label || this.allMentionLabel,
        startIndex: offset,
        endIndex: offset + fullMatch.length,
        type: MentionType.channel,
      });

      // Build CSS classes matching React UIKit structure
      // Channel mentions (@all) use "cometchat-mentions-you" class
      // @see Requirements 5.1, 5.2
      const cssClasses = this.buildMentionCssClasses(MentionType.channel);
      const displayLabel = label || this.allMentionLabel;
      return `<span class="${cssClasses}" data-uid="all" data-mention-type="channel" data-self="true" contenteditable="false">@${escapeHtml(displayLabel)}</span>`;
    });

    // Then, process user mentions (<@uid:{uid}>)
    const userRegex = this.getUserMentionRegex();
    result = result.replace(userRegex, (fullMatch, uid, offset) => {
      // Skip empty or whitespace-only UIDs - remove the malformed mention entirely
      // This prevents displaying just "@" with no name
      if (!uid || uid.trim() === '') {
        return '';
      }

      // Look up the user to get display name
      const user = userMap.get(uid);
      // If user not found, use UID as fallback display name
      // But if UID is also empty/invalid, skip this mention
      const displayName = user ? user.getName() : uid;

      // Double-check displayName is valid
      if (!displayName || displayName.trim() === '') {
        return '';
      }

      // Determine mention type based on logged-in user
      const mentionType = this.getMentionType(uid);

      // Store mention metadata
      this.mentions.push({
        uid,
        name: displayName,
        startIndex: offset,
        endIndex: offset + fullMatch.length,
        type: mentionType,
      });

      // Build CSS classes matching React UIKit structure
      // @see Requirements 5.1, 5.2, 8.1
      const cssClasses = this.buildMentionCssClasses(mentionType);
      const isSelf = mentionType === MentionType.self;
      return `<span class="${cssClasses}" data-uid="${escapeHtml(uid)}" data-mention-type="${mentionType}" data-self="${isSelf}" contenteditable="false">@${escapeHtml(displayName)}</span>`;
    });

    this.formattedText = result;
    this.metadata = { mentions: this.mentions };

    return this.formattedText;
  }

  /**
   * Extract user UIDs from text containing SDK format mentions.
   *
   * Parses the text using the `<@uid:(.*?)>` regex pattern and returns
   * an array of extracted UIDs.
   *
   * @param text - The text containing SDK format mentions
   * @returns Array of user UIDs found in the text
   * @see Requirements 1.3
   */
  extractUserUids(text: string): string[] {
    const uids: string[] = [];
    const regex = this.getUserMentionRegex();
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      const uid = match[1];
      if (uid && !uids.includes(uid)) {
        uids.push(uid);
      }
    }

    return uids;
  }

  /**
   * Extract channel mention labels from text containing SDK format mentions.
   *
   * Parses the text using the `<@all:(.*?)>` regex pattern and returns
   * an array of extracted labels.
   *
   * @param text - The text containing SDK format channel mentions
   * @returns Array of channel labels found in the text
   */
  extractChannelLabels(text: string): string[] {
    const labels: string[] = [];
    const regex = this.getChannelMentionRegex();
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      const label = match[1];
      if (label && !labels.includes(label)) {
        labels.push(label);
      }
    }

    return labels;
  }

  /**
   * Check if text contains SDK format mentions.
   *
   * Tests if the text contains either user mentions (`<@uid:...>`)
   * or channel mentions (`<@all:...>`).
   *
   * @param text - The text to check
   * @returns true if SDK format mentions are found, false otherwise
   * @see Requirements 1.3
   */
  hasSdkMentions(text: string): boolean {
    const userRegex = this.getUserMentionRegex();
    const channelRegex = this.getChannelMentionRegex();
    const hasUser = userRegex.test(text);
    const hasChannel = channelRegex.test(text);
    return hasUser || hasChannel;
  }

  /**
   * Reset the formatter state to initial values.
   *
   * Clears original text, formatted text, metadata, and detected mentions.
   * Does not clear the users map - call setUsers([]) to clear users.
   */
  override reset(): void {
    super.reset();
    this.mentions = [];
  }

  /**
   * Get the user ID from a User or GroupMember object.
   *
   * @param user - The User or GroupMember object
   * @returns The user's unique identifier
   * @private
   */
  private getUserId(user: CometChat.User | CometChat.GroupMember): string {
    // Both User and GroupMember have getUid() method
    return user.getUid();
  }
}
