import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  OnInit,
  OnDestroy,
  SimpleChanges,
  TemplateRef,
  ViewChild,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { safeEffect } from '../../../utils/safe-effect';
import { CommonModule, DatePipe } from '@angular/common';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatSearchFilter, States } from '../../../Enums/Enums';
import { SearchMessagesService } from '../../../services/search-messages.service';
import { CometChatUIKitConstants } from '../../../constants';
import { CalendarObject } from '../../../resources/CometChatLocalize/localization.interfaces';
import { CometChatTextFormatter } from '../../../formatters/cometchat-text-formatter';
import { CometChatMentionsFormatter } from '../../../formatters/cometchat-mentions-formatter';
import { TranslatePipe } from '../../../resources/CometChatLocalize/translate.pipe';
import { CometChatUIKit } from '../../../cometchat-uikit';
import { CometChatLocalize } from '../../../resources/CometChatLocalize';
import { CometChatPaginatedListComponent } from '../../cometchat-paginated-list/cometchat-paginated-list.component';
import { getMediaPreview, isMediaPreviewType, getAttachmentCount, MediaPreviewType } from '../../../utils/message-preview-utils';
import { HtmlSanitizerService } from '../../../services/html-sanitizer.service';
import { FormatterConfigService } from '../../../services/formatter-config.service';
import { stripRichTextFormatting } from '../../../utils/util';

/**
 * Renders message search results with type-specific views,
 * date separators, and pagination.
 *
 * Uses CometChatPaginatedList for scroll-based pagination when
 * alwaysShowSeeMore is false
 */
@Component({
  selector: 'cometchat-search-messages-list',
  standalone: true,
  imports: [CommonModule, TranslatePipe, DatePipe, CometChatPaginatedListComponent],
  templateUrl: './cometchat-search-messages-list.component.html',
  styleUrls: ['./cometchat-search-messages-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CometChatSearchMessagesListComponent implements OnInit, OnChanges, OnDestroy {
  @Input() searchKeyword = '';
  @Input() activeFilters: CometChatSearchFilter[] = [];
  @Input() uid?: string;
  @Input() guid?: string;
  @Input() alwaysShowSeeMore = false;
  @Input() messagesRequestBuilder?: CometChat.MessagesRequestBuilder;
  @Input() textFormatters: CometChatTextFormatter[] = [];
  @Input() messageDateTimeFormat?: CalendarObject;

  // Template customization
  @Input() itemTemplate?: TemplateRef<{ $implicit: CometChat.BaseMessage }>;
  @Input() leadingView?: TemplateRef<{ $implicit: CometChat.BaseMessage }>;
  @Input() titleView?: TemplateRef<{ $implicit: CometChat.BaseMessage }>;
  @Input() subtitleView?: TemplateRef<{ $implicit: CometChat.BaseMessage }>;
  @Input() trailingView?: TemplateRef<{ $implicit: CometChat.BaseMessage }>;
  @Input() loadingView?: TemplateRef<void>;
  @Input() emptyView?: TemplateRef<void>;
  @Input() errorView?: TemplateRef<void>;

  @Output() itemClick = new EventEmitter<{
    message: CometChat.BaseMessage;
    searchKeyword: string;
  }>();
  @Output() searchError = new EventEmitter<CometChat.CometChatException>();
  @Output() stateChange = new EventEmitter<States>();

  /** When true, the component hides itself entirely (including header). */
  @Input() hideSection = false;

  /** When true, the component suppresses its own empty/error views (parent handles them). */
  @Input() suppressEmptyErrorView = false;

  /** Reference to the paginated list for calling loadComplete() */
  @ViewChild('paginatedList')
  paginatedList?: CometChatPaginatedListComponent<CometChat.BaseMessage>;

  readonly service = inject(SearchMessagesService);
  readonly States = States;
  readonly MessageTypes = CometChatUIKitConstants.MessageTypes;

  private readonly htmlSanitizer = inject(HtmlSanitizerService);
  private readonly formatterConfig = inject(FormatterConfigService);
  private loggedInUser: CometChat.User | null = null;

  constructor() {
    safeEffect(() => {
      this.stateChange.emit(this.service.fetchState() as States);
    });
  }

  /** Whether the paginated list is in loading state (initial load only) */
  get isLoading(): boolean {
    return this.service.fetchState() === States.loading;
  }

  /** Error object for the paginated list (null when no error) */
  get listError(): Error | null {
    return this.service.fetchState() === States.error ? new Error('search_error') : null;
  }

  /** Whether to use scroll-based pagination (inverse of alwaysShowSeeMore) */
  get useScrollPagination(): boolean {
    return !this.alwaysShowSeeMore;
  }

  async ngOnInit(): Promise<void> {
    try {
      this.loggedInUser = await CometChat.getLoggedinUser();
    } catch {
      this.loggedInUser = CometChatUIKit.getLoggedInUser() ?? null;
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['searchKeyword'] || changes['activeFilters'] || changes['uid'] || changes['guid']) {
      this.triggerSearch();
    }
  }

  ngOnDestroy(): void {
    this.service.reset();
  }

  handleItemClick(message: CometChat.BaseMessage): void {
    this.itemClick.emit({ message, searchKeyword: this.searchKeyword });
  }

  /** Called by CometChatPaginatedList when user scrolls to bottom */
  handleLoadMore(): void {
    this.service
      .loadMore()
      .then(() => {
        this.paginatedList?.loadComplete();
      })
      .catch(err => {
        this.paginatedList?.loadComplete();
        this.searchError.emit(err);
      });
  }

  /** Called by the "See More" button in non-scroll mode */
  handleSeeMore(): void {
    this.service.loadMore().catch(err => this.searchError.emit(err));
  }

  getMessageTitle(message: CometChat.BaseMessage): string {
    if (this.uid || this.guid) {
      return message.getSender()?.getName() ?? '';
    }
    const receiver = message.getReceiver();
    return (receiver as CometChat.User | CometChat.Group)?.getName?.() ?? '';
  }

  shouldShowDateSeparator(index: number): boolean {
    if (index === 0) return true;
    const messages = this.service.messages();
    const current = messages[index]?.getSentAt();
    const previous = messages[index - 1]?.getSentAt();
    if (!current || !previous) return false;
    const d1 = new Date(current * 1000);
    const d2 = new Date(previous * 1000);
    return d1.getMonth() !== d2.getMonth() || d1.getFullYear() !== d2.getFullYear();
  }

  /**
   * The full subtitle as one string: `"You: test-video.mov"`. Kept for the `subtitleView` override
   * and for callers that want plain text. The template renders the pieces separately so the media
   * glyph can sit between the sender prefix and the text, as in the React kit.
   */
  getMessageSubtitle(message: CometChat.BaseMessage): string {
    const prefix = this.getSubtitleSenderPrefix(message);
    const content = this.getMessageSubtitleContent(message);
    return prefix ? `${prefix} ${content}` : content;
  }

  /** `"You:"` / `"Alice:"`, or `''` when the search is already scoped to one conversation. */
  getSubtitleSenderPrefix(message: CometChat.BaseMessage): string {
    if (this.uid || this.guid) {
      return '';
    }
    const sender = message.getSender();
    const isMe = sender?.getUid() === this.loggedInUser?.getUid();
    const senderName = isMe
      ? CometChatLocalize.getLocalizedString('search_message_subtitle_you')
      : (sender?.getName() ?? '');
    return senderName ? `${senderName}:` : '';
  }

  /**
   * The media type whose glyph precedes the subtitle text, or `null` for everything else.
   * Note this is independent of the LEADING view: images and videos have no leading icon, but they
   * do get this inline one.
   */
  getSubtitleIconType(message: CometChat.BaseMessage): MediaPreviewType | null {
    const type = message.getType();
    return isMediaPreviewType(type) ? type : null;
  }

  /** Whether the message is a thread reply, which prefixes the subtitle with a thread glyph. */
  hasThreadReply(message: CometChat.BaseMessage): boolean {
    return !!message.getParentMessageId?.();
  }

  /** The subtitle text, WITHOUT the sender prefix. */
  getMessageSubtitleContent(message: CometChat.BaseMessage): string {
    const type = message.getType();

    if (type === CometChatUIKitConstants.MessageTypes.text) {
      let text = (message as CometChat.TextMessage).getText() ?? '';
      // Strip markdown links [text](url) → text
      text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
      // Convert SDK mention tags <@uid:xxx> → @DisplayName (or @uid fallback)
      const mentionedUsers = (message as CometChat.TextMessage).getMentionedUsers?.() ?? [];
      return this.formatPlainMentions(text, mentionedUsers);
    }

    if (isMediaPreviewType(type)) {
      // Filename when there is nothing better to say; otherwise the caption, or a count such as
      // "3 Images". See getMediaPreview for the full table. Search renders plain text, so the
      // caption is stripped of markdown rather than turned into HTML.
      return getMediaPreview(message, 'search', {
        formatCaption: (raw) => {
          if (!raw.trim()) return '';
          const mentionedUsers = (message as CometChat.TextMessage).getMentionedUsers?.() ?? [];
          const plain = stripRichTextFormatting(raw).replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
          return this.formatPlainMentions(plain, mentionedUsers).replace(/\s+/g, ' ').trim();
        },
      });
    }

    return type;
  }

  /**
   * Returns true when the subtitle for a text message should be rendered as HTML
   * (i.e. it contains markdown, rich text metadata, or SDK mention tags).
   * Mirrors CometChatConversationItem.subtitleHasHtml.
   */
  subtitleHasHtml(message: CometChat.BaseMessage): boolean {
    if (message.getType() !== CometChatUIKitConstants.MessageTypes.text) return false;
    if (message.getCategory() !== 'message') return false;
    const textMessage = message as CometChat.TextMessage;
    const rawText = textMessage.getText() || '';

    if (!rawText) {
      // Fallback: no text — check metadata
      try {
        const metadata = textMessage.getMetadata?.() as Record<string, unknown> | undefined;
        const richText = metadata?.['richText'] as { html?: string; hasFormatting?: boolean } | undefined;
        if (richText?.html && richText?.hasFormatting) return true;
      } catch { /* ignore */ }
      return false;
    }

    // Plain URL or markdown link — render as plain text
    if (this.isURL(rawText) || /\[([^\]]+)\]\([^)]+\)/.test(rawText)) return false;

    // Markdown syntax
    if (/(\*\*|(?<!\*)\*(?!\*|\s)|__|~~|`|_(?=[^\s_])|^>\s|^&gt;\s?|^ *[-*]\s|^ *\d+\.\s)/m.test(rawText)) return true;

    // SDK mention tags
    const hasSdkMentions = /<@uid:[^>]+>/.test(rawText) || /<@all:[^>]+>/.test(rawText);
    const formatters = this.getFormattersForSubtitle();
    const hasMentionsFormatter = formatters.some(f => f instanceof CometChatMentionsFormatter);
    const hasCustomFormatters = formatters.some(f => !(f instanceof CometChatMentionsFormatter) && f.id !== 'tiptap-formatter');
    return (hasSdkMentions && hasMentionsFormatter) || hasCustomFormatters;
  }

  /**
   * Returns sanitized HTML for the subtitle when subtitleHasHtml() is true.
   * Mirrors CometChatConversationItem.formatLastMessageSubtitle.
   */
  getMessageSubtitleHtml(message: CometChat.BaseMessage): string {
    const textMessage = message as CometChat.TextMessage;
    const rawText = textMessage.getText() || '';
    const mentionedUsers = textMessage.getMentionedUsers?.() ?? [];

    if (!rawText) {
      // Fallback: no text — try metadata as last resort
      try {
        const metadata = textMessage.getMetadata?.() as Record<string, unknown> | undefined;
        const richText = metadata?.['richText'] as { html?: string; hasFormatting?: boolean } | undefined;
        if (richText?.html && richText?.hasFormatting) {
          const sanitized = this.sanitizeSubtitleHtml(richText.html);
          if (sanitized) return this.prependSenderHtml(sanitized, message);
        }
      } catch { /* ignore */ }
      return '';
    }

    const formatters = this.getFormattersForSubtitle();
    const hasSdkMentions = /<@uid:[^>]+>/.test(rawText) || /<@all:[^>]+>/.test(rawText);

    // 2. Markdown path
    if (/(\*\*|(?<!\*)\*(?!\*|\s)|__|~~|`|_(?=[^\s_])|^>\s|^&gt;\s?|^ *[-*]\s|^ *\d+\.\s)/m.test(rawText)) {
      const escaped = this.htmlSanitizer.escapeUserHtml(rawText);
      let formattedText = escaped;
      for (const formatter of formatters) {
        try {
          if (formatter instanceof CometChatMentionsFormatter) {
            if (hasSdkMentions && formatter.shouldFormat(formattedText, message)) {
              formattedText = (formatter as CometChatMentionsFormatter).formatSdkMentions(formattedText, mentionedUsers);
            }
          } else if (formatter.id !== 'tiptap-formatter') {
            if (formatter.shouldFormat(formattedText, message)) {
              formattedText = formatter.format(formattedText);
            }
          }
        } catch { /* ignore formatter errors */ }
      }
      return this.prependSenderHtml(this.sanitizeSubtitleHtml(formattedText), message);
    }

    // 3. Plain text path with mention formatting
    const plainText = stripRichTextFormatting(rawText);
    if (!formatters || formatters.length === 0) {
      return this.prependSenderHtml(this.formatPlainMentions(plainText, mentionedUsers), message);
    }
    const hasCustomFormatters = formatters.some(f => !(f instanceof CometChatMentionsFormatter) && f.id !== 'tiptap-formatter');
    const hasMentionsFormatter = formatters.some(f => f instanceof CometChatMentionsFormatter);
    if (!hasSdkMentions && !hasCustomFormatters) {
      return this.prependSenderHtml(plainText, message);
    }
    if (!hasMentionsFormatter && !hasCustomFormatters) {
      return this.prependSenderHtml(this.formatPlainMentions(plainText, mentionedUsers), message);
    }
    const escapedText = this.htmlSanitizer.escapeUserHtml(plainText);
    let formattedText = escapedText;
    for (const formatter of formatters) {
      try {
        if (formatter instanceof CometChatMentionsFormatter) {
          if (hasSdkMentions && formatter.shouldFormat(formattedText, message)) {
            formattedText = (formatter as CometChatMentionsFormatter).formatSdkMentions(formattedText, mentionedUsers);
          }
        } else if (formatter.id !== 'tiptap-formatter') {
          if (formatter.shouldFormat(formattedText, message)) {
            formattedText = formatter.format(formattedText);
          }
        }
      } catch { /* ignore formatter errors */ }
    }
    return this.prependSenderHtml(this.sanitizeSubtitleHtml(formattedText), message);
  }

  /** Prepend "You: " or "SenderName: " as plain text before the HTML subtitle. */
  private prependSenderHtml(html: string, message: CometChat.BaseMessage): string {
    if (this.uid || this.guid) return html;
    const sender = message.getSender();
    const isMe = sender?.getUid() === this.loggedInUser?.getUid();
    const senderName = isMe
      ? CometChatLocalize.getLocalizedString('search_message_subtitle_you')
      : (sender?.getName() ?? '');
    if (!senderName) return html;
    const escapedName = this.htmlSanitizer.escapeUserHtml(senderName);
    return `${escapedName}: ${html}`;
  }

  /** Get the active text formatters — explicit input takes priority over global config. */
  private getFormattersForSubtitle(): CometChatTextFormatter[] {
    if (this.textFormatters?.length > 0) return this.textFormatters;
    return this.formatterConfig.getDefaultFormatters();
  }

  /** Sanitize HTML to safe inline tags only for search subtitle — single line, truncated. */
  private sanitizeSubtitleHtml(html: string): string {
    // Inject list markers as plain text before stripping list tags,
    // so "1. item1 2. item2" appears inline instead of "item1 item2".
    let processed = html;

    // Ordered lists: replace <li> with counter prefix "N. "
    processed = processed.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (_match, inner) => {
      let counter = 0;
      return inner.replace(/<li[^>]*>/gi, () => {
        counter++;
        return `${counter}. `;
      });
    });

    // Unordered lists: replace <li> with bullet "• "
    processed = processed.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (_match, inner) => {
      return inner.replace(/<li[^>]*>/gi, () => '• ');
    });

    // Collapse remaining block-level elements to spaces
    processed = processed
      .replace(/<\/li>/gi, ' ')
      .replace(/<\/p>/gi, ' ')
      .replace(/<\/blockquote>/gi, ' ')
      .replace(/<\/h[1-6]>/gi, ' ');

    let s = this.htmlSanitizer.sanitizeWithConfig(processed, {
      ALLOWED_TAGS: ['span', 'strong', 'em', 'b', 'i', 'u', 's', 'code', 'a'],
      ALLOWED_ATTR: ['class', 'data-uid', 'data-mention-type', 'data-hashtag', 'href', 'target', 'rel', 'style'],
    });
    return String(s).replace(/\n/g, ' ').replace(/\s{2,}/g, ' ').trim();
  }

  /**
   * Convert SDK mention tags into plain-text `@DisplayName`.
   * Falls back to the UID when a mentioned user is not hydrated on the message.
   */
  private formatPlainMentions(
    text: string,
    mentionedUsers: CometChat.User[]
  ): string {
    if (!text) return '';
    const userMap = new Map<string, string>();
    mentionedUsers.forEach(u => userMap.set(u.getUid(), u.getName()));
    let result = text.replace(/<@uid:(.*?)>/g, (_m, uid) => `@${userMap.get(uid) || uid}`);
    result = result.replace(/<@all:(.*?)>/g, (_m, label) => `@${label}`);
    return result;
  }

  trackByMessage(_index: number, message: CometChat.BaseMessage): number {
    return message.getId();
  }

  /** Get the index of a message in the service's messages array (fallback for date separator) */
  getMessageIndex(message: CometChat.BaseMessage): number {
    return this.service.messages().findIndex(m => m.getId() === message.getId());
  }

  // ── Leading / trailing view helpers ──

  /** Determine leading view type for a message */
  getLeadingViewType(message: CometChat.BaseMessage): 'audio' | 'file' | 'link' | 'none' {
    const type = message.getType();
    if (type === CometChatUIKitConstants.MessageTypes.audio) return 'audio';
    if (type === CometChatUIKitConstants.MessageTypes.file) return 'file';
    if (type === CometChatUIKitConstants.MessageTypes.text) {
      const metadata = (message as CometChat.TextMessage).getMetadata();
      if (
        this.hasLinkPreview(metadata) ||
        this.isURL((message as CometChat.TextMessage).getText())
      ) {
        return 'link';
      }
    }
    return 'none';
  }

  /**
   * Leading-view glyph for a file result: one stacked-sheets illustration for EVERY file, matching
   * the React kit. Deliberately not the per-extension icon used in the message bubble and composer
   * tray — a search result may carry several attachments of different types, and picking the first
   * one's icon would misrepresent the rest.
   */
  getFileTypeIcon(_message?: CometChat.BaseMessage): string {
    return 'assets/document-file-icon.svg';
  }

  /** Get link favicon URL from message metadata */
  getLinkFavicon(message: CometChat.BaseMessage): string | null {
    try {
      const metadata = (message as CometChat.TextMessage).getMetadata();
      const links = this.extractLinkPreviewLinks(metadata);
      if (links?.[0] && (links[0] as Record<string, string>)['favicon']) {
        return (links[0] as Record<string, string>)['favicon'];
      }
    } catch {
      // metadata may not be present
    }
    return null;
  }

  /** Determine trailing view type */
  getTrailingViewType(message: CometChat.BaseMessage): 'image' | 'video' | 'date' {
    const type = message.getType();
    if (type === CometChatUIKitConstants.MessageTypes.image) return 'image';
    if (type === CometChatUIKitConstants.MessageTypes.video) return 'video';
    return 'date';
  }

  /**
   * Attachments hidden behind the single thumbnail, shown as a "+N" badge. The thumbnail already
   * accounts for one of them, hence `count - 1`.
   */
  getAttachmentOverflow(message: CometChat.BaseMessage): number {
    return Math.max(0, getAttachmentCount(message) - 1);
  }

  /**
   * Backend-generated video poster, when the thumbnail-generation extension supplied one. Without
   * it the `<video>` element paints its own first frame, which costs a media fetch.
   */
  getVideoPosterUrl(message: CometChat.BaseMessage): string | null {
    try {
      const metadata = (message as CometChat.MediaMessage).getMetadata?.() as
        | Record<string, any>
        | null;
      const url = metadata?.['@injected']?.['extensions']?.['thumbnail-generation']?.['url_medium'];
      return typeof url === 'string' && url.length > 0 ? url : null;
    } catch {
      return null;
    }
  }

  /** Get attachment URL for image/video thumbnails */
  getAttachmentUrl(message: CometChat.BaseMessage): string {
    const media = message as CometChat.MediaMessage;
    const attachments = media.getAttachments();
    return attachments?.[0]?.getUrl() || '';
  }

  /** Format date for trailing view using Angular DatePipe for locale-aware formatting */
  getFormattedDate(message: CometChat.BaseMessage): string {
    const sentAt = message.getSentAt();
    if (!sentAt) return '';
    const date = new Date(sentAt * 1000);
    // Use Angular DatePipe for locale-aware month abbreviation
    const datePipe = new DatePipe('en-US');
    return datePipe.transform(date, 'd MMM, hh:mm a') ?? '';
  }

  /** Check if metadata has link preview */
  private hasLinkPreview(metadata: unknown): boolean {
    try {
      return !!this.extractLinkPreviewLinks(metadata)?.length;
    } catch {
      return false;
    }
  }

  /** Extract link-preview links array from message metadata */
  private extractLinkPreviewLinks(metadata: unknown): unknown[] | undefined {
    const meta = metadata as Record<string, unknown> | undefined;
    const injected = meta?.['@injected'] as Record<string, unknown> | undefined;
    const ext = injected?.['extensions'] as Record<string, unknown> | undefined;
    const lp = ext?.['link-preview'] as Record<string, unknown> | undefined;
    return lp?.['links'] as unknown[] | undefined;
  }

  /** Simple URL check */
  private isURL(text: string): boolean {
    if (!text) return false;
    return /^https?:\/\//.test(text.trim()) || /\bhttps?:\/\/\S+/i.test(text);
  }

  private triggerSearch(): void {
    this.service
      .search(
        this.searchKeyword,
        this.activeFilters,
        this.uid,
        this.guid,
        this.messagesRequestBuilder,
        this.alwaysShowSeeMore
      )
      .catch(err => this.searchError.emit(err));
  }
}
