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
import { CommonModule } from '@angular/common';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatSearchFilter, States } from '../../../Enums/Enums';
import { SearchConversationsService } from '../../../services/search-conversations.service';
import { CometChatOption } from '../../../modals';
import { CalendarObject } from '../../../resources/CometChatLocalize/localization.interfaces';
import { CometChatTextFormatter } from '../../../formatters/cometchat-text-formatter';
import { TranslatePipe } from '../../../resources/CometChatLocalize/translate.pipe';
import { CometChatUIKit } from '../../../cometchat-uikit';
import { CometChatConversationItemComponent } from '../../cometchat-conversation-item/cometchat-conversation-item.component';
import { CometChatPaginatedListComponent } from '../../cometchat-paginated-list/cometchat-paginated-list.component';

/**
 * Renders conversation search results using CometChatConversationItem
 * for proper avatar, receipts, badges, and date display.
 *
 * Uses CometChatPaginatedList for scroll-based pagination when
 * useScrollPagination is true.
 */
@Component({
  selector: 'cometchat-search-conversations-list',
  standalone: true,
  imports: [
    CommonModule,
    TranslatePipe,
    CometChatConversationItemComponent,
    CometChatPaginatedListComponent,
  ],
  templateUrl: './cometchat-search-conversations-list.component.html',
  styleUrls: ['./cometchat-search-conversations-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CometChatSearchConversationsListComponent implements OnInit, OnChanges, OnDestroy {
  @Input() searchKeyword = '';
  @Input() activeFilters: CometChatSearchFilter[] = [];
  @Input() useScrollPagination = false;
  @Input() conversationsRequestBuilder?: CometChat.ConversationsRequestBuilder;
  @Input() hideUserStatus = false;
  @Input() hideGroupType = false;
  @Input() hideReceipts = false;
  @Input() textFormatters: CometChatTextFormatter[] = [];
  @Input() lastMessageDateTimeFormat?: CalendarObject;
  @Input()
  conversationOptions?: (conversation: CometChat.Conversation) => CometChatOption[];

  // Template customization
  @Input() itemTemplate?: TemplateRef<{ $implicit: CometChat.Conversation }>;
  @Input() leadingView?: TemplateRef<{ $implicit: CometChat.Conversation }>;
  @Input() titleView?: TemplateRef<{ $implicit: CometChat.Conversation }>;
  @Input() subtitleView?: TemplateRef<{ $implicit: CometChat.Conversation }>;
  @Input() trailingView?: TemplateRef<{ $implicit: CometChat.Conversation }>;
  @Input() loadingView?: TemplateRef<void>;
  @Input() emptyView?: TemplateRef<void>;
  @Input() errorView?: TemplateRef<void>;

  @Output() itemClick = new EventEmitter<{
    conversation: CometChat.Conversation;
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
  paginatedList?: CometChatPaginatedListComponent<CometChat.Conversation>;

  readonly service = inject(SearchConversationsService);
  readonly States = States;

  loggedInUser: CometChat.User | null = null;

  constructor() {
    safeEffect(() => {
      this.stateChange.emit(this.service.fetchState() as States);
    });
  }

  /** Get typing indicator for a conversation */
  getTypingIndicator(conversation: CometChat.Conversation): CometChat.TypingIndicator | null {
    const convWith = conversation.getConversationWith();
    const id =
      convWith instanceof CometChat.User
        ? convWith.getUid()
        : (convWith as CometChat.Group).getGuid();
    return this.service.typingIndicatorMap().get(id) ?? null;
  }

  /** Default date format for search conversation results: DD/MM/YYYY */
  readonly searchDateFormat: CalendarObject = {
    today: 'DD/MM/YYYY',
    yesterday: 'DD/MM/YYYY',
    otherDays: 'DD/MM/YYYY',
  };

  /** Effective date format — use input if provided, otherwise search default */
  get effectiveDateFormat(): CalendarObject {
    return this.lastMessageDateTimeFormat ?? this.searchDateFormat;
  }

  /** Whether the paginated list is in loading state (initial load only) */
  get isLoading(): boolean {
    return this.service.fetchState() === States.loading;
  }

  /** Error object for the paginated list (null when no error) */
  get listError(): Error | null {
    return this.service.fetchState() === States.error ? new Error('search_error') : null;
  }

  async ngOnInit(): Promise<void> {
    try {
      this.loggedInUser = await CometChat.getLoggedinUser();
      if (this.loggedInUser) {
        this.service.attachListeners(this.loggedInUser);
      }
    } catch {
      // Fallback: try UIKit cached user
      this.loggedInUser = CometChatUIKit.getLoggedInUser() ?? null;
      if (this.loggedInUser) {
        this.service.attachListeners(this.loggedInUser);
      }
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['searchKeyword'] || changes['activeFilters']) {
      this.triggerSearch();
    }
  }

  ngOnDestroy(): void {
    this.service.reset();
  }

  handleItemClick(conversation: CometChat.Conversation): void {
    this.itemClick.emit({ conversation, searchKeyword: this.searchKeyword });
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

  getConversationName(conversation: CometChat.Conversation): string {
    const convWith = conversation.getConversationWith();
    return convWith?.getName?.() ?? '';
  }

  getLastMessageText(conversation: CometChat.Conversation): string {
    const lastMsg = conversation.getLastMessage();
    if (!lastMsg) return '';
    if (lastMsg.getType() === 'text') {
      return (lastMsg as CometChat.TextMessage).getText() ?? '';
    }
    return lastMsg.getType() ?? '';
  }

  getUnreadCount(conversation: CometChat.Conversation): number {
    return conversation.getUnreadMessageCount() ?? 0;
  }

  trackByConversation(_index: number, conversation: CometChat.Conversation): string {
    return conversation.getConversationId();
  }

  private triggerSearch(): void {
    this.service
      .search(this.searchKeyword, this.activeFilters, this.conversationsRequestBuilder)
      .catch(err => this.searchError.emit(err));
  }
}
