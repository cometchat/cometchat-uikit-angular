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
  effect,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatSearchFilter, States } from '../../../Enums/Enums';
import { SearchMessagesService } from '../../../services/search-messages.service';
import { CometChatUIKitConstants } from '../../../constants';
import { CalendarObject } from '../../../resources/CometChatLocalize/localization.interfaces';
import { CometChatTextFormatter } from '../../../formatters/cometchat-text-formatter';
import { TranslatePipe } from '../../../resources/CometChatLocalize/translate.pipe';
import { CometChatUIKit } from '../../../cometchat-uikit';
import { CometChatLocalize } from '../../../resources/CometChatLocalize';
import { FILE_TYPE_ICONS } from '../../cometchat-file-bubble/cometchat-file-bubble.types';
import { CometChatPaginatedListComponent } from '../../cometchat-paginated-list/cometchat-paginated-list.component';

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

  private loggedInUser: CometChat.User | null = null;

  constructor() {
    effect(() => {
      this.stateChange.emit(this.service.fetchState() as States);
   },{allowSignalWrites:true});
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

  getMessageSubtitle(message: CometChat.BaseMessage): string {
    const type = message.getType();
    let text = '';

    if (type === CometChatUIKitConstants.MessageTypes.text) {
      text = (message as CometChat.TextMessage).getText() ?? '';
      // Strip markdown links [text](url) → text
      text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
      // Convert SDK mention tags <@uid:xxx> → @DisplayName (or @uid fallback)
      const mentionedUsers = (message as CometChat.TextMessage).getMentionedUsers?.() ?? [];
      text = this.formatPlainMentions(text, mentionedUsers);
    } else if (
      type === CometChatUIKitConstants.MessageTypes.image ||
      type === CometChatUIKitConstants.MessageTypes.video ||
      type === CometChatUIKitConstants.MessageTypes.audio ||
      type === CometChatUIKitConstants.MessageTypes.file
    ) {
      const media = message as CometChat.MediaMessage;
      const attachments = media.getAttachments();
      text = attachments?.[0]?.getName() ?? type;
    } else {
      text = type;
    }

    // Prepend sender name for non-scoped search
    if (!this.uid && !this.guid) {
      const sender = message.getSender();
      const isMe = sender?.getUid() === this.loggedInUser?.getUid();
      const senderName = isMe
        ? CometChatLocalize.getLocalizedString('search_message_subtitle_you')
        : (sender?.getName() ?? '');
      if (senderName) {
        text = `${senderName}: ${text}`;
      }
    }

    return text;
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

  /** Get file type icon path for document messages */
  getFileTypeIcon(message: CometChat.BaseMessage): string {
    const media = message as CometChat.MediaMessage;
    const attachments = media.getAttachments();
    if (!attachments?.length) return FILE_TYPE_ICONS['default'];
    const name = attachments[0].getName() || '';
    const ext = name.split('.').pop()?.toLowerCase() || '';
    return FILE_TYPE_ICONS[ext] || FILE_TYPE_ICONS['default'];
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
