import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatTextFormatter } from './cometchat-text-formatter';
import { MentionType, MessageBubbleAlignment } from '../Enums/Enums';
import type { MentionData } from './cometchat-mentions-formatter.types';
import { USER_MENTION_REGEX, CHANNEL_MENTION_REGEX } from './cometchat-mentions-formatter.types';

// Re-export for backward compatibility
export type { MentionData } from './cometchat-mentions-formatter.types';
export { USER_MENTION_REGEX, CHANNEL_MENTION_REGEX } from './cometchat-mentions-formatter.types';

/** Escapes special HTML characters to prevent XSS. */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/**
 * Formatter for @mentions in text.
 *
 * Detects @username patterns and SDK format mentions (`<@uid:{uid}>`, `<@all:{label}>`)
 * and renders them as styled spans with BEM CSS classes.
 */
export class CometChatMentionsFormatter extends CometChatTextFormatter {
  readonly id = 'mentions-formatter';
  override priority = 20;

  private mentions: MentionData[] = [];
  private users = new Map<string, CometChat.User | CometChat.GroupMember>();
  private enableAllMention = true;
  private allMentionLabel = 'all';
  private loggedInUser: CometChat.User | null = null;
  private messageBubbleAlignment: MessageBubbleAlignment | undefined;

  // ── Configuration ─────────────────────────────────────────────────────────

  setLoggedInUser(user: CometChat.User | null): void { this.loggedInUser = user; }
  getLoggedInUser(): CometChat.User | null { return this.loggedInUser; }

  setMessageBubbleAlignment(alignment: MessageBubbleAlignment | undefined): void {
    this.messageBubbleAlignment = alignment;
  }
  getMessageBubbleAlignment(): MessageBubbleAlignment | undefined { return this.messageBubbleAlignment; }

  setUsers(users: (CometChat.User | CometChat.GroupMember)[]): void {
    this.users.clear();
    users.forEach(user => this.users.set(user.getName().toLowerCase(), user));
  }

  setAllMentionConfig(enabled: boolean, label = 'all'): void {
    this.enableAllMention = enabled;
    this.allMentionLabel = label;
  }

  // ── Regex ─────────────────────────────────────────────────────────────────

  getRegex(): RegExp { return /@(\w+)/g; }
  getUserMentionRegex(): RegExp { return new RegExp(USER_MENTION_REGEX.source, 'g'); }
  getChannelMentionRegex(): RegExp { return new RegExp(CHANNEL_MENTION_REGEX.source, 'g'); }

  // ── Format (plain text @mentions) ────────────────────────────────────────

  format(text: string): string {
    if (text == null) { this.originalText = ''; this.formattedText = ''; this.metadata = { mentions: [] }; return ''; }
    this.originalText = text;
    this.mentions = [];
    let lastIndex = 0;
    let result = '';
    const regex = this.getRegex();
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      const fullMatch = match[0];
      const username = match[1];
      const start = match.index;
      const end = start + fullMatch.length;
      result += text.slice(lastIndex, start);

      if (this.enableAllMention && username.toLowerCase() === this.allMentionLabel.toLowerCase()) {
        this.mentions.push({ uid: 'all', name: this.allMentionLabel, startIndex: start, endIndex: end, type: MentionType.channel });
        const css = this.buildMentionCssClasses(MentionType.channel);
        result += `<span class="${css}" data-uid="all" data-mention-type="channel" data-self="true">@${escapeHtml(this.allMentionLabel)}</span>`;
      } else {
        const user = this.users.get(username.toLowerCase());
        if (user) {
          const uid = user.getUid();
          const displayName = user.getName();
          const mentionType = this.getMentionType(uid);
          this.mentions.push({ uid, name: displayName, startIndex: start, endIndex: end, type: mentionType });
          const css = this.buildMentionCssClasses(mentionType);
          const isSelf = mentionType === MentionType.self;
          result += `<span class="${css}" data-uid="${escapeHtml(uid)}" data-mention-type="${mentionType}" data-self="${isSelf}">@${escapeHtml(displayName)}</span>`;
        } else {
          result += fullMatch;
        }
      }
      lastIndex = end;
    }

    result += text.slice(lastIndex);
    this.formattedText = result;
    this.metadata = { mentions: this.mentions };
    return this.formattedText;
  }

  // ── Format SDK mentions ───────────────────────────────────────────────────

  formatSdkMentions(
    text: string,
    mentionedUsers: (CometChat.User | CometChat.GroupMember)[] = []
  ): string {
    this.originalText = text;
    this.mentions = [];
    const userMap = new Map<string, CometChat.User | CometChat.GroupMember>();
    mentionedUsers.forEach(user => userMap.set(user.getUid(), user));

    let result = text;

    // Process channel mentions first
    result = result.replace(this.getChannelMentionRegex(), (fullMatch, label, offset) => {
      this.mentions.push({ uid: 'all', name: label || this.allMentionLabel, startIndex: offset, endIndex: offset + fullMatch.length, type: MentionType.channel });
      const css = this.buildMentionCssClasses(MentionType.channel);
      const displayLabel = label || this.allMentionLabel;
      return `<span class="${css}" data-uid="all" data-mention-type="channel" data-self="true" contenteditable="false">@${escapeHtml(displayLabel)}</span>`;
    });

    // Process user mentions
    result = result.replace(this.getUserMentionRegex(), (fullMatch, uid, offset) => {
      if (!uid || uid.trim() === '') return '';
      const user = userMap.get(uid);
      const displayName = user ? user.getName() : uid;
      if (!displayName || displayName.trim() === '') return '';
      const mentionType = this.getMentionType(uid);
      this.mentions.push({ uid, name: displayName, startIndex: offset, endIndex: offset + fullMatch.length, type: mentionType });
      const css = this.buildMentionCssClasses(mentionType);
      const isSelf = mentionType === MentionType.self;
      return `<span class="${css}" data-uid="${escapeHtml(uid)}" data-mention-type="${mentionType}" data-self="${isSelf}" contenteditable="false">@${escapeHtml(displayName)}</span>`;
    });

    this.formattedText = result;
    this.metadata = { mentions: this.mentions };
    return this.formattedText;
  }

  // ── Extraction Helpers ────────────────────────────────────────────────────

  extractUserUids(text: string): string[] {
    const uids: string[] = [];
    const regex = this.getUserMentionRegex();
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
      const uid = match[1];
      if (uid && !uids.includes(uid)) { uids.push(uid); }
    }
    return uids;
  }

  extractChannelLabels(text: string): string[] {
    const labels: string[] = [];
    const regex = this.getChannelMentionRegex();
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
      const label = match[1];
      if (label && !labels.includes(label)) { labels.push(label); }
    }
    return labels;
  }

  hasSdkMentions(text: string): boolean {
    return this.getUserMentionRegex().test(text) || this.getChannelMentionRegex().test(text);
  }

  getMentions(): MentionData[] { return [...this.mentions]; }
  hasMentions(): boolean { return this.mentions.length > 0; }
  hasAllMention(): boolean { return this.mentions.some(m => m.uid === 'all'); }

  override reset(): void { super.reset(); this.mentions = []; }

  // ── Private Helpers ───────────────────────────────────────────────────────

  private getMentionType(uid: string): MentionType {
    return this.loggedInUser && this.loggedInUser.getUid() === uid
      ? MentionType.self
      : MentionType.other;
  }

  private buildMentionCssClasses(mentionType: MentionType): string {
    const classes = ['cometchat-mentions'];
    classes.push(mentionType === MentionType.self || mentionType === MentionType.channel
      ? 'cometchat-mentions-you'
      : 'cometchat-mentions-other');
    if (this.messageBubbleAlignment === MessageBubbleAlignment.left) { classes.push('cometchat-mentions-incoming'); }
    else if (this.messageBubbleAlignment === MessageBubbleAlignment.right) { classes.push('cometchat-mentions-outgoing'); }
    return classes.join(' ');
  }
}
