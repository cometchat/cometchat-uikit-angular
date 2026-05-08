import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  TemplateRef,
  signal,
  computed,
  WritableSignal,
  Signal,
  ChangeDetectionStrategy,
  ElementRef,
  ViewChild,
  inject,
  DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatSearchFilter, CometChatSearchScope, States } from '../../Enums/Enums';
import { CometChatOption } from '../../modals';
import { CalendarObject } from '../../resources/CometChatLocalize/localization.interfaces';
import { CometChatTextFormatter } from '../../formatters/cometchat-text-formatter';
import { TranslatePipe } from '../../resources/CometChatLocalize/translate.pipe';
import {
  getAvailableFilters,
  getVisibleFilters,
  toggleFilter,
  shouldRenderConversations,
  shouldRenderMessages,
} from './search-filter.utils';
import { CometChatSearchConversationsListComponent } from './cometchat-search-conversations-list/cometchat-search-conversations-list.component';
import { CometChatSearchMessagesListComponent } from './cometchat-search-messages-list/cometchat-search-messages-list.component';
import { CometChatLocalize } from '../../resources/CometChatLocalize';
import { CometChatTemplatesService } from '../../services/templates.service';
import { FormatterConfigService } from '../../services/formatter-config.service';
import { CometChatUIKit } from '../../cometchat-uikit';

export interface SearchConversationClickEvent {
  conversation: CometChat.Conversation;
  searchKeyword: string;
}

export interface SearchMessageClickEvent {
  message: CometChat.BaseMessage;
  searchKeyword: string;
}

const DEFAULT_FILTERS: CometChatSearchFilter[] = [
  CometChatSearchFilter.Audio,
  CometChatSearchFilter.Documents,
  CometChatSearchFilter.Groups,
  CometChatSearchFilter.Photos,
  CometChatSearchFilter.Videos,
  CometChatSearchFilter.Links,
  CometChatSearchFilter.Unread,
];

/* Template inputs use broad context types for consumer flexibility */
// eslint-disable-next-line @typescript-eslint/no-explicit-any

/**
 * Main search container component.
 * Provides search input, filter bar, and orchestrates child result components.
 */
@Component({
  selector: 'cometchat-search',
  standalone: true,
  imports: [
    CommonModule,
    TranslatePipe,
    CometChatSearchConversationsListComponent,
    CometChatSearchMessagesListComponent,
  ],
  templateUrl: './cometchat-search.component.html',
  styleUrls: ['./cometchat-search.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CometChatSearchComponent implements OnInit, OnDestroy {
  @Input() searchIn: CometChatSearchScope[] = [];
  @Input() searchFilters: CometChatSearchFilter[] = DEFAULT_FILTERS;
  @Input() initialSearchFilter?: CometChatSearchFilter;
  @Input() hideBackButton = false;
  @Input() defaultSearchText?: string;
  @Input() uid?: string;
  @Input() guid?: string;
  @Input() hideGroupType = false;
  @Input() hideUserStatus = false;
  @Input() hideReceipts = false;
  @Input() textFormatters: CometChatTextFormatter[] = [];
  @Input() messageSentAtDateTimeFormat?: CalendarObject;
  @Input() conversationsRequestBuilder?: CometChat.ConversationsRequestBuilder;
  @Input() messagesRequestBuilder?: CometChat.MessagesRequestBuilder;
  @Input() conversationOptions?: (conv: CometChat.Conversation) => CometChatOption[];

  // Conversation templates
  @Input() conversationItemView?: TemplateRef<any>;
  @Input() conversationLeadingView?: TemplateRef<any>;
  @Input() conversationTitleView?: TemplateRef<any>;
  @Input() conversationSubtitleView?: TemplateRef<any>;
  @Input() conversationTrailingView?: TemplateRef<any>;

  // Message templates
  @Input() messageItemView?: TemplateRef<any>;
  @Input() messageLeadingView?: TemplateRef<any>;
  @Input() messageTitleView?: TemplateRef<any>;
  @Input() messageSubtitleView?: TemplateRef<any>;
  @Input() messageTrailingView?: TemplateRef<any>;

  // State view templates
  @Input() initialView?: TemplateRef<any>;
  @Input() loadingView?: TemplateRef<any>;
  @Input() emptyView?: TemplateRef<any>;
  @Input() errorView?: TemplateRef<any>;

  @Output() backClick = new EventEmitter<void>();
  @Output() conversationClick = new EventEmitter<SearchConversationClickEvent>();
  @Output() messageClick = new EventEmitter<SearchMessageClickEvent>();
  @Output() searchError = new EventEmitter<CometChat.CometChatException>();

  // ==================== Service Injection ====================
  private templatesService = inject(CometChatTemplatesService);
  private formatterConfig = inject(FormatterConfigService);

  // ==================== Effective Text Formatters ====================

  /**
   * Resolves the effective text formatters to pass to child lists.
   *
   * If the consumer provided `textFormatters`, use those. Otherwise, fall back
   * to the default formatters from `FormatterConfigService` with the logged-in
   * user set on the mentions formatter so SDK mentions render as `@DisplayName`
   * instead of the raw `<@uid:xxx>` tag.
   */
  get effectiveTextFormatters(): CometChatTextFormatter[] {
    if (this.textFormatters && this.textFormatters.length > 0) {
      return this.textFormatters;
    }
    const loggedInUser = CometChatUIKit.getLoggedInUser() ?? undefined;
    return this.formatterConfig.getFormattersWithContext(loggedInUser);
  }

  // ==================== Template Resolution (@Input > Service Template > Shared > undefined) ====================

  // Conversation result templates
  get effectiveConversationItemView(): TemplateRef<any> | undefined {
    return this.conversationItemView || this.templatesService.getSearchTemplates().conversationItemView;
  }
  get effectiveConversationLeadingView(): TemplateRef<any> | undefined {
    return this.conversationLeadingView || this.templatesService.getSearchTemplates().conversationLeadingView;
  }
  get effectiveConversationTitleView(): TemplateRef<any> | undefined {
    return this.conversationTitleView || this.templatesService.getSearchTemplates().conversationTitleView;
  }
  get effectiveConversationSubtitleView(): TemplateRef<any> | undefined {
    return this.conversationSubtitleView || this.templatesService.getSearchTemplates().conversationSubtitleView;
  }
  get effectiveConversationTrailingView(): TemplateRef<any> | undefined {
    return this.conversationTrailingView || this.templatesService.getSearchTemplates().conversationTrailingView;
  }

  // Message result templates
  get effectiveMessageItemView(): TemplateRef<any> | undefined {
    return this.messageItemView || this.templatesService.getSearchTemplates().messageItemView;
  }
  get effectiveMessageLeadingView(): TemplateRef<any> | undefined {
    return this.messageLeadingView || this.templatesService.getSearchTemplates().messageLeadingView;
  }
  get effectiveMessageTitleView(): TemplateRef<any> | undefined {
    return this.messageTitleView || this.templatesService.getSearchTemplates().messageTitleView;
  }
  get effectiveMessageSubtitleView(): TemplateRef<any> | undefined {
    return this.messageSubtitleView || this.templatesService.getSearchTemplates().messageSubtitleView;
  }
  get effectiveMessageTrailingView(): TemplateRef<any> | undefined {
    return this.messageTrailingView || this.templatesService.getSearchTemplates().messageTrailingView;
  }

  // State view templates (@Input > Search service > Shared service > undefined)
  get effectiveInitialView(): TemplateRef<any> | undefined {
    return this.initialView || this.templatesService.getSearchTemplates().initialView;
  }
  get effectiveLoadingView(): TemplateRef<any> | undefined {
    return this.loadingView
      || this.templatesService.getSearchTemplates().loadingView
      || this.templatesService.getSharedTemplates().loadingView;
  }
  get effectiveEmptyView(): TemplateRef<any> | undefined {
    return this.emptyView
      || this.templatesService.getSearchTemplates().emptyView
      || this.templatesService.getSharedTemplates().emptyView;
  }
  get effectiveErrorView(): TemplateRef<any> | undefined {
    return this.errorView
      || this.templatesService.getSearchTemplates().errorView
      || this.templatesService.getSharedTemplates().errorView;
  }

  @ViewChild('searchInput') searchInputRef!: ElementRef<HTMLInputElement>;

  readonly searchValue: WritableSignal<string> = signal<string>('');
  readonly searchText: WritableSignal<string> = signal<string>('');
  readonly activeFilters: WritableSignal<CometChatSearchFilter[]> = signal<CometChatSearchFilter[]>(
    []
  );

  private readonly searchSubject = new Subject<string>();
  private readonly destroyRef = inject(DestroyRef);

  readonly visibleFilters: Signal<CometChatSearchFilter[]> = computed(() =>
    getVisibleFilters(
      getAvailableFilters(this.searchIn, this.searchFilters),
      this.activeFilters(),
      this.uid,
      this.guid,
      this.searchIn
    )
  );

  readonly showConversations: Signal<boolean> = computed(() =>
    shouldRenderConversations(
      this.searchText(),
      this.activeFilters(),
      this.searchIn,
      this.uid,
      this.guid
    )
  );

  readonly showMessages: Signal<boolean> = computed(() =>
    shouldRenderMessages(
      this.searchText(),
      this.activeFilters(),
      this.searchIn,
      this.uid,
      this.guid
    )
  );

  readonly showInitialView: Signal<boolean> = computed(
    () => this.searchText().trim() === '' && this.activeFilters().length === 0
  );

  // ==================== Unified empty/error state ====================
  readonly conversationsState: WritableSignal<States> = signal<States>(States.loaded);
  readonly messagesState: WritableSignal<States> = signal<States>(States.loaded);

  /** True when both scopes are active (so we coordinate a unified empty/error view). */
  readonly bothScopesActive: Signal<boolean> = computed(
    () => this.showConversations() && this.showMessages()
  );

  /**
   * Hide the conversations section entirely when:
   * - Both scopes active AND conversations is empty AND messages has data
   * - Both scopes active AND both empty (unified empty shown by parent, no headers)
   * - Both scopes active AND both error (unified error shown by parent, no headers)
   */
  readonly hideConversationsSection: Signal<boolean> = computed(() => {
    if (!this.bothScopesActive()) return false;
    const cs = this.conversationsState();
    const ms = this.messagesState();
    // Both empty → parent shows unified empty, hide both sections
    if (cs === States.empty && ms === States.empty) return true;
    // Both error → parent shows unified error, hide both sections
    if (cs === States.error && ms === States.error) return true;
    // Conversations empty but messages has data → hide conversations entirely
    if (cs === States.empty && ms === States.loaded) return true;
    return false;
  });

  /**
   * Hide the messages section entirely when:
   * - Both scopes active AND messages is empty AND conversations has data
   * - Both scopes active AND both empty (unified empty shown by parent)
   * - Both scopes active AND both error (unified error shown by parent)
   */
  readonly hideMessagesSection: Signal<boolean> = computed(() => {
    if (!this.bothScopesActive()) return false;
    const cs = this.conversationsState();
    const ms = this.messagesState();
    if (cs === States.empty && ms === States.empty) return true;
    if (cs === States.error && ms === States.error) return true;
    if (ms === States.empty && cs === States.loaded) return true;
    return false;
  });

  /** Show a single unified empty view when both child lists report empty. */
  readonly showUnifiedEmpty: Signal<boolean> = computed(() => {
    if (!this.bothScopesActive()) return false;
    return this.conversationsState() === States.empty && this.messagesState() === States.empty;
  });

  /** Show a single unified error view when both child lists report error. */
  readonly showUnifiedError: Signal<boolean> = computed(() => {
    if (!this.bothScopesActive()) return false;
    return this.conversationsState() === States.error && this.messagesState() === States.error;
  });

  handleConversationsStateChange(state: States): void {
    this.conversationsState.set(state);
  }

  handleMessagesStateChange(state: States): void {
    this.messagesState.set(state);
  }

  ngOnInit(): void {
    this.searchSubject.pipe(debounceTime(500), takeUntilDestroyed(this.destroyRef)).subscribe(text => {
      this.searchText.set(text);
    });

    if (this.initialSearchFilter && this.activeFilters().length === 0) {
      this.activeFilters.set([this.initialSearchFilter]);
    }

    if (this.defaultSearchText) {
      this.searchValue.set(this.defaultSearchText);
      this.searchText.set(this.defaultSearchText);
    }

    setTimeout(() => this.searchInputRef?.nativeElement?.focus(), 100);
  }

  ngOnDestroy(): void {
    // Subscriptions are cleaned up automatically via takeUntilDestroyed(this.destroyRef)
  }

  handleSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchValue.set(value);
    this.searchSubject.next(value.trim());
  }

  handleClearSearch(): void {
    this.searchValue.set('');
    this.searchText.set('');
    this.activeFilters.set([]);
    this.searchInputRef?.nativeElement?.focus();
  }

  handleBackClick(): void {
    this.backClick.emit();
  }

  handleFilterToggle(filterId: CometChatSearchFilter): void {
    this.activeFilters.update(current => toggleFilter(current, filterId));
  }

  isFilterActive(filterId: CometChatSearchFilter): boolean {
    return this.activeFilters().includes(filterId);
  }

  handleConversationClick(event: SearchConversationClickEvent): void {
    this.conversationClick.emit(event);
  }

  handleMessageClick(event: SearchMessageClickEvent): void {
    this.messageClick.emit(event);
  }

  getFilterLabel(filterId: CometChatSearchFilter): string {
    const keyMap: Record<string, string> = {
      [CometChatSearchFilter.Audio]: 'search_filter_audio',
      [CometChatSearchFilter.Conversations]: 'search_filter_conversations',
      [CometChatSearchFilter.Documents]: 'search_filter_documents',
      [CometChatSearchFilter.Groups]: 'search_filter_groups',
      [CometChatSearchFilter.Links]: 'search_filter_links',
      [CometChatSearchFilter.Messages]: 'search_filter_messages',
      [CometChatSearchFilter.Photos]: 'search_filter_photos',
      [CometChatSearchFilter.Unread]: 'search_filter_unread',
      [CometChatSearchFilter.Videos]: 'search_filter_videos',
    };
    return CometChatLocalize.getLocalizedString(keyMap[filterId] ?? '');
  }
}
