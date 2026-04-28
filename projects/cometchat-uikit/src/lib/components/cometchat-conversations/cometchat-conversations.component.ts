/**
 * CometChatConversations Component (Refactored)
 *
 * A comprehensive component that displays a real-time list of conversations
 * for the logged-in user. This refactored version delegates rendering to
 * sub-components (CometChatPaginatedList, CometChatConversationItem) while
 * maintaining full backward compatibility.
 *
 * @module components/cometchat-conversations
 * @see Requirements 8.1, 8.2, 8.3, 8.6, 8.7, 10.1, 10.2
 */
import {
  Component,
  Input,
  Output,
  EventEmitter,
  TemplateRef,
  ViewChild,
  ContentChild,
  ChangeDetectionStrategy,
  OnInit,
  OnDestroy,
  signal,
  computed,
  effect,
  Signal,
  inject,
  ElementRef,
  booleanAttribute,
  Optional,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { Subject, Subscription } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { CometChat } from '@cometchat/chat-sdk-javascript';

// Component imports
import { CometChatPaginatedListComponent } from '../cometchat-paginated-list/cometchat-paginated-list.component';
import { CometChatConversationItemComponent } from '../cometchat-conversation-item/cometchat-conversation-item.component';
import { CometChatSearchBarComponent } from '../base-elements/cometchat-search-bar/cometchat-search-bar.component';
import { CometChatConfirmDialogComponent } from '../base-elements/cometchat-confirm-dialog/cometchat-confirm-dialog.component';
import { CometChatCheckboxComponent } from '../base-elements/cometchat-checkbox/cometchat-checkbox.component';
import { CometChatRadioButtonComponent } from '../base-elements/cometchat-radio-button/cometchat-radio-button.component';

// Service imports
import { ConversationsService } from '../../services/conversations.service';
import { CometChatTemplatesService } from '../../services/templates.service';
import { ChatStateService } from '../../services/chat-state.service';
import { FormatterConfigService } from '../../services/formatter-config.service';
import { COMETCHAT_GLOBAL_CONFIG, GlobalConfig } from '../../services/global-config.service';
import { LiveAnnouncerService } from '../../services/live-announcer.service';

// Event imports
import { CometChatMessageEvents } from '../../events/CometChatMessageEvents';

// Resource imports
import { CometChatSoundManager } from '../../resources/CometChatSoundManager/CometChatSoundManager';
import { CometChatLocalize } from '../../resources/CometChatLocalize/cometchat-localize';
import { TranslatePipe } from '../../resources/CometChatLocalize/translate.pipe';
import { CometChatLogger } from '../../utils/CometChatLogger';
import { CometChatTextFormatter } from '../../formatters/cometchat-text-formatter';

// Constants
import { CometChatUIKitConstants } from '../../constants';

// Type imports
import { SelectionMode, Placement } from '../../Enums/Enums';
import { CometChatOption } from '../../modals/CometChatOption';
import { CalendarObject } from '../../resources/CometChatLocalize/localization.interfaces';
import { ConversationSlots } from '../../interfaces/conversation-slots.interface';
import { SelectionState } from '../../modals/SelectionState';

// Re-export SelectionState from shared location for backward compatibility
export type { SelectionState } from '../../modals/SelectionState';

/**
 * CometChatConversations is a thin orchestrator component that coordinates
 * sub-components for rendering a conversation list. It maintains full backward
 * compatibility while delegating rendering to CometChatPaginatedList and
 * CometChatConversationItem.
 *
 * @example
 * ```html
 * <cometchat-conversations
 *   [title]="'My Chats'"
 *   [showSearchBar]="true"
 *   (itemClick)="handleConversationClick($event)">
 * </cometchat-conversations>
 * ```
 */
@Component({
  selector: 'cometchat-conversations',
  standalone: true,
  imports: [
    CommonModule,
    CometChatPaginatedListComponent,
    CometChatConversationItemComponent,
    CometChatSearchBarComponent,
    CometChatConfirmDialogComponent,
    CometChatCheckboxComponent,
    CometChatRadioButtonComponent,
    TranslatePipe,
  ],
  templateUrl: './cometchat-conversations.component.html',
  styleUrls: ['./cometchat-conversations.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CometChatConversationsComponent implements OnInit, OnDestroy {
  // ==================== Shared Constants ====================
  readonly shimmerList = CometChatUIKitConstants.shimmerList;

  // ==================== Service Injection ====================
  private conversationsService = inject(ConversationsService);
  private templatesService = inject(CometChatTemplatesService);
  private chatStateService = inject(ChatStateService);
  private formatterConfigService = inject(FormatterConfigService);
  private liveAnnouncer = inject(LiveAnnouncerService);

  // Global config injected via token (static configuration)
  private globalConfig: Partial<GlobalConfig> | null = inject(COMETCHAT_GLOBAL_CONFIG, {
    optional: true,
  });

  // ==================== Display Control Inputs ====================
  /**
   * Boolean inputs use booleanAttribute transform for intuitive template usage.
   * This allows both syntaxes:
   * - Attribute syntax: <cometchat-conversations showSearchBar>
   * - Property binding: <cometchat-conversations [showSearchBar]="true">
   *
   * @see Requirements 7.1, 7.2, 7.3
   */

  // Track if @Input was explicitly set (for global config priority system)
  private hideReceiptsExplicitlySet = signal(false);
  private hideErrorExplicitlySet = signal(false);
  private hideUserStatusExplicitlySet = signal(false);
  private hideGroupTypeExplicitlySet = signal(false);
  private showScrollbarExplicitlySet = signal(false);
  private showSearchBarExplicitlySet = signal(false);
  private disableSoundForMessagesExplicitlySet = signal(false);
  private textFormattersExplicitlySet = signal(false);
  private disableDefaultContextMenuExplicitlySet = signal(false);
  private customSoundForMessagesExplicitlySet = signal(false);

  // Private backing fields for tracked @Input properties
  private _hideReceipts = signal(false);
  private _hideError = signal(false);
  private _hideUserStatus = signal(false);
  private _hideGroupType = signal(false);
  private _showScrollbar = signal(false);
  private _showSearchBar = signal(false);
  private _disableSoundForMessages = signal(false);
  private _textFormatters = signal<any[]>([]);
  private _disableDefaultContextMenu = signal(true);
  private _customSoundForMessages = signal('');

  @Input({ transform: booleanAttribute })
  set hideReceipts(value: boolean) {
    this._hideReceipts.set(value);
    this.hideReceiptsExplicitlySet.set(true);
  }
  get hideReceipts(): boolean {
    return this._hideReceipts();
  }

  @Input({ transform: booleanAttribute })
  set hideError(value: boolean) {
    this._hideError.set(value);
    this.hideErrorExplicitlySet.set(true);
  }
  get hideError(): boolean {
    return this._hideError();
  }

  @Input({ transform: booleanAttribute }) hideDeleteConversation = false;

  @Input({ transform: booleanAttribute })
  set hideUserStatus(value: boolean) {
    this._hideUserStatus.set(value);
    this.hideUserStatusExplicitlySet.set(true);
  }
  get hideUserStatus(): boolean {
    return this._hideUserStatus();
  }

  @Input({ transform: booleanAttribute })
  set hideGroupType(value: boolean) {
    this._hideGroupType.set(value);
    this.hideGroupTypeExplicitlySet.set(true);
  }
  get hideGroupType(): boolean {
    return this._hideGroupType();
  }

  /**
   * Whether to disable the browser's default context menu (tooltip) on long press/right-click.
   * When true (default), the browser's context menu is disabled to show only the custom menu.
   * Set to false to allow the browser's default context menu behavior.
   *
   * @default true
   */
  @Input({ transform: booleanAttribute })
  set disableDefaultContextMenu(value: boolean) {
    this._disableDefaultContextMenu.set(value);
    this.disableDefaultContextMenuExplicitlySet.set(true);
  }
  get disableDefaultContextMenu(): boolean {
    return this._disableDefaultContextMenu();
  }

  @Input({ transform: booleanAttribute })
  set showScrollbar(value: boolean) {
    this._showScrollbar.set(value);
    this.showScrollbarExplicitlySet.set(true);
  }
  get showScrollbar(): boolean {
    return this._showScrollbar();
  }

  @Input({ transform: booleanAttribute })
  set showSearchBar(value: boolean) {
    this._showSearchBar.set(value);
    this.showSearchBarExplicitlySet.set(true);
  }
  get showSearchBar(): boolean {
    return this._showSearchBar();
  }

  // ==================== Data Configuration Inputs ====================
  @Input() conversationsRequestBuilder?: CometChat.ConversationsRequestBuilder;
  @Input() activeConversation?: CometChat.Conversation;

  @Input()
  set textFormatters(value: CometChatTextFormatter[]) {
    this._textFormatters.set(value);
    this.textFormattersExplicitlySet.set(true);
  }
  get textFormatters(): CometChatTextFormatter[] {
    return this._textFormatters();
  }

  @Input() selectionMode: SelectionMode = SelectionMode.none;
  @Input() lastMessageDateTimeFormat?: CalendarObject;
  @Input() options?: (conversation: CometChat.Conversation) => CometChatOption[];

  // ==================== Sound Configuration Inputs ====================
  @Input({ transform: booleanAttribute })
  set disableSoundForMessages(value: boolean) {
    this._disableSoundForMessages.set(value);
    this.disableSoundForMessagesExplicitlySet.set(true);
  }
  get disableSoundForMessages(): boolean {
    return this._disableSoundForMessages();
  }

  @Input()
  set customSoundForMessages(value: string) {
    this._customSoundForMessages.set(value);
    this.customSoundForMessagesExplicitlySet.set(true);
  }
  get customSoundForMessages(): string {
    return this._customSoundForMessages();
  }

  // ==================== Slot-Based Customization (NEW) ====================
  @Input() slots?: Partial<ConversationSlots>;

  // ==================== Template Inputs (Backward Compatibility) ====================
  @Input() headerView?: TemplateRef<any>;
  @Input() menuView?: TemplateRef<any>;
  @Input() loadingView?: TemplateRef<any>;
  @Input() emptyView?: TemplateRef<any>;
  @Input() errorView?: TemplateRef<any>;
  @Input() searchView?: TemplateRef<any>;
  @Input() itemView?: TemplateRef<{ $implicit: CometChat.Conversation }>;
  @Input() leadingView?: TemplateRef<{ $implicit: CometChat.Conversation }>;
  @Input() titleView?: TemplateRef<{ $implicit: CometChat.Conversation }>;
  @Input() subtitleView?: TemplateRef<{ $implicit: CometChat.Conversation }>;
  @Input() trailingView?: TemplateRef<{ $implicit: CometChat.Conversation }>;

  // ==================== Standardised Template Slot Inputs (Property 6 / Req 3.2) ====================
  /** Custom template for each list item. Alias for `itemView`. */
  @Input() listItemTemplate: TemplateRef<any> | null = null;
  /** Custom template for the empty state. Alias for `emptyView`. */
  @Input() emptyStateTemplate: TemplateRef<any> | null = null;
  /** Custom template for the error state. Alias for `errorView`. */
  @Input() errorStateTemplate: TemplateRef<any> | null = null;
  /** Custom template for the loading state. Alias for `loadingView`. */
  @Input() loadingStateTemplate: TemplateRef<any> | null = null;

  // ==================== ContentChild Template References ====================
  @ContentChild('headerView') headerViewContent?: TemplateRef<any>;
  @ContentChild('menuView') menuViewContent?: TemplateRef<any>;
  @ContentChild('loadingView') loadingViewContent?: TemplateRef<any>;
  @ContentChild('emptyView') emptyViewContent?: TemplateRef<any>;
  @ContentChild('errorView') errorViewContent?: TemplateRef<any>;
  @ContentChild('searchView') searchViewContent?: TemplateRef<any>;
  @ContentChild('itemView') itemViewContent?: TemplateRef<{ $implicit: CometChat.Conversation }>;
  @ContentChild('leadingView') leadingViewContent?: TemplateRef<{
    $implicit: CometChat.Conversation;
  }>;
  @ContentChild('titleView') titleViewContent?: TemplateRef<{ $implicit: CometChat.Conversation }>;
  @ContentChild('subtitleView') subtitleViewContent?: TemplateRef<{
    $implicit: CometChat.Conversation;
  }>;
  @ContentChild('trailingView') trailingViewContent?: TemplateRef<{
    $implicit: CometChat.Conversation;
  }>;

  // ==================== ViewChild References ====================
  @ViewChild('paginatedList')
  paginatedList?: CometChatPaginatedListComponent<CometChat.Conversation>;
  @ViewChild('searchBar') searchBar?: CometChatSearchBarComponent;
  @ViewChild('dialogOverlay') dialogOverlay?: ElementRef<HTMLDivElement>;
  @ViewChild('selectionControlTemplate') selectionControlTemplate?: TemplateRef<any>;

  // ==================== Output Events ====================
  /**
   * Output events follow Angular naming conventions (no 'on' prefix).
   * Template bindings use 'on' prefix: (itemClick)="handleClick($event)"
   * @see Requirements 8.1-8.9
   */
  @Output() itemClick = new EventEmitter<CometChat.Conversation>();
  @Output() select = new EventEmitter<{
    conversation: CometChat.Conversation;
    selected: boolean;
  }>();
  @Output() error = new EventEmitter<CometChat.CometChatException>();
  @Output() searchBarClick = new EventEmitter<void>();
  @Output() contextMenuOpen = new EventEmitter<CometChat.Conversation>();
  @Output() contextMenuClose = new EventEmitter<CometChat.Conversation>();
  @Output() scrollToTop = new EventEmitter<void>();
  @Output() scrollToBottom = new EventEmitter<void>();
  @Output() selectionChange = new EventEmitter<SelectionState>();

  // ==================== Signal-Based State from Service ====================
  conversations!: Signal<CometChat.Conversation[]>;
  loadingState!: Signal<boolean>;
  errorState!: Signal<Error | null>;
  activeConversationSignal!: Signal<CometChat.Conversation | null>;
  typingIndicators!: Signal<Map<string, CometChat.TypingIndicator>>;

  // ==================== Component State (Signals) ====================
  selectedConversations = signal(new Set<string>());
  focusedIndex = signal(-1);
  showDeleteConfirmDialog = signal(false);
  conversationToDelete = signal<CometChat.Conversation | null>(null);
  isFetchingMore = signal(false);
  hasMore = signal(true);

  // ==================== Computed Signals ====================
  hasSelection = computed(() => this.selectedConversations().size > 0);
  selectedCount = computed(() => this.selectedConversations().size);
  isSelectionModeActive = computed(() => this.selectionMode !== SelectionMode.none);
  shouldShowDeleteDialog = computed(
    () => this.showDeleteConfirmDialog() && this.conversationToDelete() !== null
  );
  hasConversations = computed(() => this.conversations().length > 0);
  isLoading = computed(() => this.loadingState());
  hasError = computed(() => this.errorState() !== null);

  // ==================== Effective Value Computed Signals (Priority System) ====================
  /**
   * Computed effective values implementing the priority system:
   * 1. If @Input was explicitly set → use @Input value
   * 2. Else if global config is set (not undefined) → use global config value
   * 3. Else → use internal default value
   * @see Requirements 5.1, 5.2, 5.3, 6.2
   */
  effectiveHideReceipts = computed(() => {
    if (this.hideReceiptsExplicitlySet()) {
      return this._hideReceipts();
    }
    if (this.globalConfig?.hideReceipts !== undefined) {
      return this.globalConfig.hideReceipts;
    }
    return false;
  });

  effectiveHideError = computed(() => {
    if (this.hideErrorExplicitlySet()) {
      return this._hideError();
    }
    if (this.globalConfig?.hideError !== undefined) {
      return this.globalConfig.hideError;
    }
    return false;
  });

  effectiveHideUserStatus = computed(() => {
    if (this.hideUserStatusExplicitlySet()) {
      return this._hideUserStatus();
    }
    if (this.globalConfig?.hideUserStatus !== undefined) {
      return this.globalConfig.hideUserStatus;
    }
    return false;
  });

  effectiveHideGroupType = computed(() => {
    if (this.hideGroupTypeExplicitlySet()) {
      return this._hideGroupType();
    }
    if (this.globalConfig?.hideGroupType !== undefined) {
      return this.globalConfig.hideGroupType;
    }
    return false;
  });

  effectiveShowScrollbar = computed(() => {
    if (this.showScrollbarExplicitlySet()) {
      return this._showScrollbar();
    }
    if (this.globalConfig?.showScrollbar !== undefined) {
      return this.globalConfig.showScrollbar;
    }
    return false;
  });

  effectiveShowSearchBar = computed(() => {
    if (this.showSearchBarExplicitlySet()) {
      return this._showSearchBar();
    }
    if (this.globalConfig?.showSearchBar !== undefined) {
      return this.globalConfig.showSearchBar;
    }
    return false;
  });

  effectiveDisableSoundForMessages = computed(() => {
    if (this.disableSoundForMessagesExplicitlySet()) {
      return this._disableSoundForMessages();
    }
    if (this.globalConfig?.disableSoundForMessages !== undefined) {
      return this.globalConfig.disableSoundForMessages;
    }
    return false;
  });

  effectiveTextFormatters = computed(() => {
    if (this.textFormattersExplicitlySet()) {
      return this._textFormatters();
    }
    if (this.globalConfig?.textFormatters !== undefined) {
      return this.globalConfig.textFormatters;
    }
    return [];
  });

  effectiveDisableDefaultContextMenu = computed(() => {
    if (this.disableDefaultContextMenuExplicitlySet()) {
      return this._disableDefaultContextMenu();
    }
    if (this.globalConfig?.disableDefaultContextMenu !== undefined) {
      return this.globalConfig.disableDefaultContextMenu;
    }
    return true;
  });

  effectiveCustomSoundForMessages = computed(() => {
    if (this.customSoundForMessagesExplicitlySet()) {
      return this._customSoundForMessages();
    }
    if (this.globalConfig?.customSoundForMessages !== undefined) {
      return this.globalConfig.customSoundForMessages;
    }
    return '';
  });

  // ==================== Template Resolution (@Input > Component Service > Shared Service > Default) ====================
  get effectiveItemView(): TemplateRef<any> | undefined {
    return (
      this.listItemTemplate ||
      this.itemView ||
      this.itemViewContent ||
      this.templatesService.getConversationTemplates().itemView
    );
  }
  get effectiveLeadingView(): TemplateRef<any> | undefined {
    return (
      this.leadingView ||
      this.leadingViewContent ||
      this.templatesService.getConversationTemplates().leadingView
    );
  }
  get effectiveTitleView(): TemplateRef<any> | undefined {
    return (
      this.titleView ||
      this.titleViewContent ||
      this.templatesService.getConversationTemplates().titleView
    );
  }
  get effectiveSubtitleView(): TemplateRef<any> | undefined {
    return (
      this.subtitleView ||
      this.subtitleViewContent ||
      this.templatesService.getConversationTemplates().subtitleView
    );
  }
  get effectiveTrailingView(): TemplateRef<any> | undefined {
    return (
      this.trailingView ||
      this.trailingViewContent ||
      this.templatesService.getConversationTemplates().trailingView
    );
  }
  get effectiveLoadingView(): TemplateRef<any> | undefined {
    return (
      this.loadingStateTemplate ||
      this.loadingView ||
      this.loadingViewContent ||
      this.templatesService.resolveTemplate(
        this.templatesService.getConversationTemplates(),
        'loadingView'
      )
    );
  }
  get effectiveEmptyView(): TemplateRef<any> | undefined {
    return (
      this.emptyStateTemplate ||
      this.emptyView ||
      this.emptyViewContent ||
      this.templatesService.resolveTemplate(
        this.templatesService.getConversationTemplates(),
        'emptyView'
      )
    );
  }
  get effectiveErrorView(): TemplateRef<any> | undefined {
    return (
      this.errorStateTemplate ||
      this.errorView ||
      this.errorViewContent ||
      this.templatesService.resolveTemplate(
        this.templatesService.getConversationTemplates(),
        'errorView'
      )
    );
  }

  // ==================== Private State ====================
  public loggedInUser: CometChat.User | null = null;
  private destroy$ = new Subject<void>();
  private searchSubject$ = new Subject<string>();
  public currentSearchText = '';
  private lastSoundPlayedAt = 0;
  private readonly SOUND_THROTTLE_INTERVAL = 2000;
  private previousConversations: CometChat.Conversation[] = [];
  private lastSelectedIndex = -1; // Track last selected index for shift-select
  public activeFormatters: CometChatTextFormatter[] = [];

  // ==================== Typing Announcement State ====================
  /**
   * Timeout for debouncing typing announcements.
   * Prevents repetitive announcements when typing indicator updates frequently.
   * @see Requirements 18.5
   */
  private typingAnnouncementTimeout: ReturnType<typeof setTimeout> | null = null;

  /**
   * Tracks the last announced typing user to avoid duplicate announcements.
   * @see Requirements 18.5
   */
  private lastAnnouncedTypingUser: string | null = null;

  // ==================== Event Subscriptions ====================
  /**
   * Subscription for messages read events from message list.
   * Handles unread count reset when messages are read (matching React pattern).
   * @see Requirement 4.13
   */
  private messagesReadSubscription: Subscription | null = null;

  // ==================== Exposed Enums ====================
  readonly SelectionMode = SelectionMode;
  readonly Placement = Placement;

  constructor() {
    // Initialize signals from service observables
    this.conversations = toSignal(this.conversationsService.conversations$, {
      initialValue: [] as CometChat.Conversation[],
    });
    this.loadingState = toSignal(this.conversationsService.loadingState$, { initialValue: false });
    this.errorState = toSignal(this.conversationsService.errorState$, {
      initialValue: null as Error | null,
    });
    this.activeConversationSignal = toSignal(this.conversationsService.activeConversation$, {
      initialValue: null as CometChat.Conversation | null,
    });
    this.typingIndicators = toSignal(this.conversationsService.typingIndicators$, {
      initialValue: new Map<string, CometChat.TypingIndicator>(),
    });

    // Effects registered in constructor - no runInInjectionContext needed
    // Sound notification effect
    effect(() => {
      const conversations = this.conversations();
      // Detect new conversation at top of list (Requirement 18.1)
      this.detectAndAnnounceNewConversation(conversations, this.previousConversations);

      this.previousConversations = [...conversations];
    }, { allowSignalWrites: true });

    // Typing indicator announcement effect (Requirement 18.5)
    effect(() => {
      const typingIndicators = this.typingIndicators();
      if (typingIndicators && typingIndicators.size > 0) {
        // Get the first typing indicator and announce it
        const firstEntry = typingIndicators.entries().next().value;
        if (firstEntry) {
          const typingIndicator = firstEntry[1] as CometChat.TypingIndicator;
          const sender = typingIndicator.getSender();
          if (sender) {
            this.announceTyping(sender.getName());
          }
        }
      }
    }, { allowSignalWrites: true });

    // Error handling effect
    effect(() => {
      const error = this.errorState();
      if (error && !this.effectiveHideError()) {
        this.error.emit(error as CometChat.CometChatException);
      }
    }, { allowSignalWrites: true });

    // Dialog focus management effect
    effect(() => {
      if (this.showDeleteConfirmDialog() && this.dialogOverlay?.nativeElement) {
        // Use setTimeout to ensure the DOM is updated before focusing
        setTimeout(() => {
          this.dialogOverlay?.nativeElement?.focus();
        }, 0);
      }
    }, { allowSignalWrites: true });
  }

  // ==================== Lifecycle Hooks ====================
  ngOnInit(): void {
    try {
      this.initializeLoggedInUser();
      this.initializeFormatters();
      this.initializeService();
      this.setupSearchDebouncing();

      // Subscribe to message read events — resets unread count (matching React pattern)
      this.subscribeToMessagesReadEvents();
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      CometChatLogger.error('CometChatConversations', 'Error in ngOnInit:', err);
      this.error.emit(err as CometChat.CometChatException);
    }
  }

  ngOnDestroy(): void {
    try {
      this.destroy$.next();
      this.destroy$.complete();

      // Do NOT call conversationsService.cleanup() here.
      // The ConversationsService is a singleton — its SDK listeners and state
      // should persist across component destroy/recreate cycles (e.g., tab switching).
      // Service cleanup should only happen on explicit actions like logout.

      // Unsubscribe from message read events
      this.messagesReadSubscription?.unsubscribe();

      // Clear typing announcement timeout (Task 5.2)
      if (this.typingAnnouncementTimeout) {
        clearTimeout(this.typingAnnouncementTimeout);
        this.typingAnnouncementTimeout = null;
      }
    } catch (error) {
      CometChatLogger.error('CometChatConversations', 'Error in ngOnDestroy:', error);
    }
  }

  // ==================== Initialization Methods ====================
  private async initializeLoggedInUser(): Promise<void> {
    try {
      this.loggedInUser = await CometChat.getLoggedinUser();
    } catch (error) {
      CometChatLogger.error('CometChatConversations', 'Error getting logged-in user:', error);
    }
  }

  /**
   * Initialize text formatters for conversation items.
   * Uses formatters from effective value (input or global config) if provided, otherwise gets defaults from FormatterConfigService.
   * Configures mentions formatter with logged-in user for self-mention detection.
   * Does NOT set alignment (no direction classes in conversation list view).
   * @private
   * @see Requirements 6.1, 6.2, 6.3, 6.4
   */
  private initializeFormatters(): void {
    // Use formatters from effective value (input or global config) or get defaults from service
    const effectiveFormatters = this.effectiveTextFormatters();
    if (effectiveFormatters && effectiveFormatters.length > 0) {
      this.activeFormatters = [...effectiveFormatters];
    } else {
      this.activeFormatters = this.formatterConfigService.getDefaultFormatters();
    }

    // Configure formatters with logged-in user (no alignment for conversation list)
    this.configureFormattersWithUser();
  }

  /**
   * Configure formatters with logged-in user for self-mention detection.
   * Does NOT set alignment - conversation list items should not have direction CSS classes.
   * @private
   */
  private configureFormattersWithUser(): void {
    if (!this.loggedInUser) return;

    // Use getFormattersWithContext without alignment parameter
    // This ensures mentions formatter gets logged-in user but no direction classes
    this.activeFormatters = this.formatterConfigService.getFormattersWithContext(
      this.loggedInUser,
      undefined // No alignment for conversation list
    );
  }

  private initializeService(): void {
    if (this.conversationsRequestBuilder) {
      this.conversationsService.fetchConversations(this.conversationsRequestBuilder);
    } else {
      this.conversationsService.fetchConversations();
    }
    if (this.activeConversation) {
      this.conversationsService.setActiveConversation(this.activeConversation);
    }
  }

  // ==================== Paginated List Event Handlers ====================
  handleLoadMore(): void {
    if (this.isFetchingMore()) return;
    this.isFetchingMore.set(true);

    const startTime = Date.now();
    const MIN_LOADING_TIME = 500; // Minimum 500ms to show loading indicator

    this.conversationsService
      .fetchNextConversations()
      .then(hasMoreItems => {
        // Ensure loading indicator is visible for at least MIN_LOADING_TIME
        const elapsed = Date.now() - startTime;
        const remainingTime = Math.max(0, MIN_LOADING_TIME - elapsed);

        setTimeout(() => {
          this.isFetchingMore.set(false);
          this.hasMore.set(hasMoreItems);
          this.paginatedList?.loadComplete();
        }, remainingTime);
      })
      .catch(error => {
        CometChatLogger.error('CometChatConversations', 'fetchNextConversations error:', error);
        this.isFetchingMore.set(false);
        this.paginatedList?.loadComplete();
      });
  }

  handleScrollToTop(): void {
    this.scrollToTop.emit();
  }

  handleScrollToBottom(): void {
    this.scrollToBottom.emit();
  }

  // ==================== Conversation Item Event Handlers ====================
  /**
   * Handles conversation item click
   * Implements hybrid approach: checks for itemClick prop first, falls back to service
   * Emits itemClick event if prop is provided, otherwise updates ChatStateService
   * @param conversation - The clicked conversation
   * @see Requirements AC 3.3, 3.6
   */
  handleConversationClick(conversation: CometChat.Conversation): void {
    // When selection mode is active, only handle selection - don't set active conversation
    if (this.selectionMode !== SelectionMode.none) {
      this.handleSelection(conversation);
      return;
    }

    // Normal mode: update active state and emit events
    this.conversationsService.setActiveConversation(conversation);

    // Priority: Use prop if provided (backward compatibility)
    if (this.itemClick.observed) {
      this.itemClick.emit(conversation);
    } else {
      // Fall back to service if no prop provided
      this.chatStateService.setActiveConversation(conversation);
    }
  }

  handleConversationSelect(event: {
    conversation: CometChat.Conversation;
    selected: boolean;
  }): void {
    this.select.emit(event);
  }

  handleContextMenuOpen(conversation: CometChat.Conversation): void {
    this.contextMenuOpen.emit(conversation);
  }

  handleContextMenuOptionClick(event: {
    option: CometChatOption;
    conversation: CometChat.Conversation;
  }): void {
    if (event.option.id === 'delete') {
      this.handleDeleteConversationClick(event.conversation);
    }
    if (event.option.onClick) {
      event.option.onClick();
    }
  }

  // ==================== Selection Methods ====================

  /**
   * Handles selection with support for shift-click range selection.
   * @param conversation - The conversation to select/deselect
   * @param event - Optional mouse event to detect shift key for range selection
   */
  handleSelection(conversation: CometChat.Conversation, event?: MouseEvent): void {
    const conversationId = this.getConversationId(conversation);
    const conversations = this.conversations();
    const currentIndex = conversations.findIndex(c => this.getConversationId(c) === conversationId);

    if (this.selectionMode === SelectionMode.single) {
      const currentSelection = this.selectedConversations();
      const wasSelected = currentSelection.has(conversationId);
      const newSelection = new Set<string>();

      if (!wasSelected) {
        newSelection.add(conversationId);
        this.selectedConversations.set(newSelection);
        this.select.emit({ conversation, selected: true });
      } else {
        this.selectedConversations.set(newSelection);
        this.select.emit({ conversation, selected: false });
      }
      this.lastSelectedIndex = currentIndex;
    } else if (this.selectionMode === SelectionMode.multiple) {
      // Handle shift+click for range selection
      if (event?.shiftKey && this.lastSelectedIndex !== -1 && currentIndex !== -1) {
        this.selectRange(this.lastSelectedIndex, currentIndex);
      } else {
        // Normal toggle selection
        this.selectedConversations.update(currentSelection => {
          const newSelection = new Set(currentSelection);
          if (newSelection.has(conversationId)) {
            newSelection.delete(conversationId);
            this.select.emit({ conversation, selected: false });
          } else {
            newSelection.add(conversationId);
            this.select.emit({ conversation, selected: true });
          }
          return newSelection;
        });
        this.lastSelectedIndex = currentIndex;
      }
    }

    // Emit selection change event
    this.selectionChange.emit({
      mode: this.selectionMode,
      selectedIds: this.selectedConversations(),
      lastSelectedId: conversationId,
    });
  }

  /**
   * Selects all conversations (only works in multiple selection mode).
   * Triggered by Ctrl/Cmd+A keyboard shortcut.
   */
  selectAll(): void {
    if (this.selectionMode !== SelectionMode.multiple) return;

    const conversations = this.conversations();
    const newSelection = new Set<string>();

    conversations.forEach(conversation => {
      const id = this.getConversationId(conversation);
      newSelection.add(id);
      this.select.emit({ conversation, selected: true });
    });

    this.selectedConversations.set(newSelection);
    this.lastSelectedIndex = conversations.length - 1;

    this.selectionChange.emit({
      mode: this.selectionMode,
      selectedIds: newSelection,
      lastSelectedId: null,
    });
  }

  /**
   * Clears all selections.
   * Triggered by Escape key.
   */
  clearSelection(): void {
    const conversations = this.conversations();
    const currentSelection = this.selectedConversations();

    // Emit deselect events for all currently selected conversations
    conversations.forEach(conversation => {
      const id = this.getConversationId(conversation);
      if (currentSelection.has(id)) {
        this.select.emit({ conversation, selected: false });
      }
    });

    this.selectedConversations.set(new Set<string>());
    this.lastSelectedIndex = -1;

    this.selectionChange.emit({
      mode: this.selectionMode,
      selectedIds: new Set<string>(),
      lastSelectedId: null,
    });
  }

  /**
   * Toggles selection for a range of conversations between two indices (inclusive).
   * The action (select/deselect) is determined by the state of the clicked item (endIndex).
   * If clicked item is selected → deselect the range. If not selected → select the range.
   * Used for shift+click range selection.
   * @param startIndex - Starting index of the range (last selected)
   * @param endIndex - Ending index of the range (currently clicked)
   */
  private selectRange(startIndex: number, endIndex: number): void {
    const conversations = this.conversations();
    const minIndex = Math.min(startIndex, endIndex);
    const maxIndex = Math.max(startIndex, endIndex);

    // Determine action based on the clicked item's current state
    const clickedConversation = conversations[endIndex];
    if (!clickedConversation) return;

    const clickedId = this.getConversationId(clickedConversation);
    const currentSelection = this.selectedConversations();
    const shouldDeselect = currentSelection.has(clickedId);

    this.selectedConversations.update(selection => {
      const newSelection = new Set(selection);

      for (let i = minIndex; i <= maxIndex; i++) {
        const conversation = conversations[i];
        if (conversation) {
          const id = this.getConversationId(conversation);
          if (shouldDeselect) {
            // Deselect all in range
            if (newSelection.has(id)) {
              newSelection.delete(id);
              this.select.emit({ conversation, selected: false });
            }
          } else {
            // Select all in range
            if (!newSelection.has(id)) {
              newSelection.add(id);
              this.select.emit({ conversation, selected: true });
            }
          }
        }
      }

      return newSelection;
    });

    // Update last selected index to the end of the range
    this.lastSelectedIndex = endIndex;
  }

  /**
   * Handles click on selection control (checkbox/radio button).
   * Captures the mouse event for shift-click range selection.
   * @param event - The mouse click event
   * @param conversation - The conversation being selected
   */
  handleSelectionClick(eventOrConversation: MouseEvent | CometChat.Conversation, conversation?: CometChat.Conversation): void {
    // Support both old signature (event, conversation) and new signature (conversation)
    let event: MouseEvent | undefined;
    let conv: CometChat.Conversation;
    if (eventOrConversation instanceof MouseEvent) {
      event = eventOrConversation;
      conv = conversation!;
      event.stopPropagation();
    } else {
      conv = eventOrConversation;
    }
    this.handleSelection(conv, event);

    // Remove focus outline after shift+click to prevent lingering focus state
    if (event?.shiftKey) {
      this.focusedIndex.set(-1);
      (document.activeElement as HTMLElement)?.blur();
    }
  }

  /**
   * Handles click on the container to blur focus when clicking outside list items.
   * @param event - The mouse click event
   */
  handleContainerClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    // Check if click is outside of conversation items
    const isOnItem = target.closest('.cometchat-conversation-item') !== null;
    const isOnSelectionControl =
      target.closest('.cometchat-conversations__selection-control') !== null;
    const isOnSearchBar = target.closest('cometchat-search-bar') !== null;

    if (!isOnItem && !isOnSelectionControl && !isOnSearchBar) {
      this.focusedIndex.set(-1);
      (document.activeElement as HTMLElement)?.blur();
    }
  }

  isConversationSelected(conversation: CometChat.Conversation): boolean {
    return this.selectedConversations().has(this.getConversationId(conversation));
  }

  isConversationActive(conversation: CometChat.Conversation): boolean {
    if (this.activeConversation) {
      return (
        this.getConversationId(conversation) === this.getConversationId(this.activeConversation)
      );
    }
    const serviceActiveConversation = this.activeConversationSignal();
    if (serviceActiveConversation) {
      return (
        this.getConversationId(conversation) === this.getConversationId(serviceActiveConversation)
      );
    }
    return false;
  }

  // ==================== Delete Conversation Methods ====================
  handleDeleteConversationClick(conversation: CometChat.Conversation): void {
    this.conversationToDelete.set(conversation);
    this.showDeleteConfirmDialog.set(true);
  }

  async handleDeleteConfirm(): Promise<void> {
    const conversationToDelete = this.conversationToDelete();
    if (!conversationToDelete) return;

    try {
      const conversationWith = conversationToDelete.getConversationWith();
      const conversationId =
        conversationWith instanceof CometChat.User
          ? conversationWith.getUid()
          : conversationWith.getGuid();
      const conversationType = conversationWith instanceof CometChat.User ? 'user' : 'group';
      await this.conversationsService.deleteConversation(conversationId, conversationType);

      // Announce conversation deletion for screen readers (Requirement 18.3)
      this.announceConversationDeleted();
    } catch (error) {
      this.error.emit(error as CometChat.CometChatException);
    } finally {
      this.showDeleteConfirmDialog.set(false);
      this.conversationToDelete.set(null);
    }
  }

  handleDeleteCancel(): void {
    this.showDeleteConfirmDialog.set(false);
    this.conversationToDelete.set(null);
  }

  /**
   * Handles keyboard events within the delete confirmation dialog.
   * Allows Escape to close the dialog while stopping other events from bubbling.
   */
  handleDialogKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.handleDeleteCancel();
    }
    // Stop all keyboard events from bubbling to prevent parent handlers
    event.stopPropagation();
  }

  // ==================== Search Methods ====================
  private setupSearchDebouncing(): void {
    this.searchSubject$
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(searchText => {
        this.conversationsService.searchConversations(searchText);

        // Announce search results count after search completes
        // Use setTimeout to ensure the conversations signal has updated
        if (searchText && searchText.trim() !== '') {
          setTimeout(() => {
            this.announceSearchResults(this.conversations().length);
          }, 50);
        }
      });
  }

  handleSearchBarClick(): void {
    this.searchBarClick.emit();
  }

  // ==================== Keyboard Navigation ====================

  /**
   * Handles keyboard events for the conversations list.
   * Implements comprehensive keyboard navigation and selection handling.
   *
   * Keyboard shortcuts:
   * - ArrowDown/ArrowUp: Navigate between items
   * - Enter: Activate/select conversation (emit itemClick)
   * - Space: Toggle selection in selection mode
   * - Shift+Space: Range selection in multiple selection mode
   * - Shift+ArrowDown/Up: Extend selection to next/previous item
   * - Ctrl/Cmd+A: Select all conversations
   * - Ctrl/Cmd+Shift+A: Deselect all conversations
   * - Escape: Clear selection
   * - Delete/Backspace: Open delete confirmation dialog
   * - Shift+F10 or ContextMenu: Open context menu
   *
   * @param event - The keyboard event
   * @see Requirements 3.1-3.9
   */
  handleKeydown(event: KeyboardEvent): void {
    const conversations = this.conversations();
    if (conversations.length === 0) return;

    // Skip keyboard handling if confirm dialog is open (let dialog handle its own events)
    if (this.showDeleteConfirmDialog()) {
      return;
    }

    // Only handle arrow keys if the event target is within the list
    const target = event.target as HTMLElement;
    const isWithinList = target.closest('.cometchat-conversations') !== null;
    if (!isWithinList) return;

    // Handle Ctrl/Cmd+Shift+A for deselect all (only in multiple selection mode)
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'a') {
      if (this.selectionMode === SelectionMode.multiple) {
        event.preventDefault();
        event.stopPropagation();
        this.clearSelection();
        this.announceSelectionCleared();
        return;
      }
    }

    // Handle Ctrl/Cmd+A for select all (only in multiple selection mode)
    // Requirement 3.6: Ctrl/Cmd+A selects all conversations
    if ((event.ctrlKey || event.metaKey) && event.key === 'a') {
      if (this.selectionMode === SelectionMode.multiple) {
        event.preventDefault();
        event.stopPropagation();
        this.selectAll();
        this.announceSelectionCount();
        return;
      }
    }

    // Handle Shift+F10 or ContextMenu key for context menu
    // Requirement 3.9 (context menu via keyboard)
    if ((event.key === 'F10' && event.shiftKey) || event.key === 'ContextMenu') {
      event.preventDefault();
      event.stopPropagation();
      this.openContextMenuForFocused();
      return;
    }

    // Handle Delete/Backspace for delete confirmation dialog
    // Requirement 3.8: Delete/Backspace opens delete confirmation dialog
    if ((event.key === 'Delete' || event.key === 'Backspace') && !this.hideDeleteConversation) {
      const focusedConversation = this.getFocusedConversation();
      if (focusedConversation) {
        event.preventDefault();
        event.stopPropagation();
        this.handleDeleteConversationClick(focusedConversation);
        return;
      }
    }

    // Handle selection mode keyboard shortcuts
    if (this.selectionMode !== SelectionMode.none) {
      const handled = this.handleSelectionKeyboard(event);
      if (handled) return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        event.stopPropagation();
        // If no item is focused yet, start at 0, otherwise move to next
        if (this.focusedIndex() === -1) {
          this.focusedIndex.set(0);
        } else {
          this.focusedIndex.set((this.focusedIndex() + 1) % conversations.length);
        }
        this.focusItemAtIndex(this.focusedIndex());
        break;
      case 'ArrowUp':
        event.preventDefault();
        event.stopPropagation();
        // If no item is focused yet, start at last item, otherwise move to previous
        if (this.focusedIndex() === -1) {
          this.focusedIndex.set(conversations.length - 1);
        } else {
          this.focusedIndex.set(
            this.focusedIndex() <= 0 ? conversations.length - 1 : this.focusedIndex() - 1
          );
        }
        this.focusItemAtIndex(this.focusedIndex());
        break;
      case 'Enter':
        // Requirement 3.2: Enter on focused conversation emits itemClick and sets active
        event.preventDefault();
        if (this.focusedIndex() >= 0 && this.focusedIndex() < conversations.length) {
          this.handleConversationClick(conversations[this.focusedIndex()]);
        }
        break;
      case ' ':
        // Space without shift in non-selection mode activates the item
        // In selection mode, this is handled by handleSelectionKeyboard
        if (this.selectionMode === SelectionMode.none) {
          event.preventDefault();
          if (this.focusedIndex() >= 0 && this.focusedIndex() < conversations.length) {
            this.handleConversationClick(conversations[this.focusedIndex()]);
          }
        }
        break;
      case 'Escape':
        event.preventDefault();
        // Requirement 3.7: Escape clears all selections
        if (this.selectionMode !== SelectionMode.none && this.hasSelection()) {
          this.clearSelection();
          this.announceSelectionCleared();
        }
        this.focusedIndex.set(-1);
        // Blur any focused element
        (document.activeElement as HTMLElement)?.blur();
        break;
    }
  }

  /**
   * Handles selection-related keyboard shortcuts.
   *
   * @param event - The keyboard event
   * @returns True if the event was handled, false otherwise
   * @see Requirements 3.3-3.7
   */
  private handleSelectionKeyboard(event: KeyboardEvent): boolean {
    const focusedIndex = this.focusedIndex();
    const conversations = this.conversations();

    // Requirement 3.3: Space toggles selection in selection mode
    if (event.key === ' ' && !event.shiftKey) {
      event.preventDefault();
      event.stopPropagation();
      if (focusedIndex >= 0 && focusedIndex < conversations.length) {
        this.handleSelection(conversations[focusedIndex]);
        this.announceSelectionCount();
      }
      return true;
    }

    // Requirement 13.4: Shift+Space for range selection
    if (event.key === ' ' && event.shiftKey && this.selectionMode === SelectionMode.multiple) {
      event.preventDefault();
      event.stopPropagation();
      if (focusedIndex >= 0 && focusedIndex < conversations.length) {
        this.selectRange(this.lastSelectedIndex, focusedIndex);
        this.announceSelectionCount();
      }
      return true;
    }

    // Requirement 3.4: Shift+ArrowDown extends selection to next item
    if (
      event.key === 'ArrowDown' &&
      event.shiftKey &&
      this.selectionMode === SelectionMode.multiple
    ) {
      event.preventDefault();
      event.stopPropagation();
      const nextIndex = focusedIndex + 1;
      if (nextIndex < conversations.length) {
        this.extendSelectionTo(nextIndex);
        this.focusedIndex.set(nextIndex);
        this.focusItemAtIndex(nextIndex);
        this.announceSelectionCount();
      }
      return true;
    }

    // Requirement 3.5: Shift+ArrowUp extends selection to previous item
    if (
      event.key === 'ArrowUp' &&
      event.shiftKey &&
      this.selectionMode === SelectionMode.multiple
    ) {
      event.preventDefault();
      event.stopPropagation();
      const prevIndex = focusedIndex - 1;
      if (prevIndex >= 0) {
        this.extendSelectionTo(prevIndex);
        this.focusedIndex.set(prevIndex);
        this.focusItemAtIndex(prevIndex);
        this.announceSelectionCount();
      }
      return true;
    }

    return false;
  }

  /**
   * Extends selection to include the item at the given index.
   * Used for Shift+Arrow selection extension.
   *
   * @param index - The index of the item to extend selection to
   * @see Requirements 3.4, 3.5
   */
  private extendSelectionTo(index: number): void {
    const conversations = this.conversations();
    if (index < 0 || index >= conversations.length) return;

    const conversation = conversations[index];
    const conversationId = this.getConversationId(conversation);

    this.selectedConversations.update(currentSelection => {
      const newSelection = new Set(currentSelection);
      newSelection.add(conversationId);
      return newSelection;
    });

    this.select.emit({ conversation, selected: true });
    this.lastSelectedIndex = index;

    this.selectionChange.emit({
      mode: this.selectionMode,
      selectedIds: this.selectedConversations(),
      lastSelectedId: conversationId,
    });
  }

  /**
   * Gets the currently focused conversation.
   *
   * @returns The focused conversation, or null if none is focused
   */
  private getFocusedConversation(): CometChat.Conversation | null {
    const focusedIndex = this.focusedIndex();
    const conversations = this.conversations();
    if (focusedIndex >= 0 && focusedIndex < conversations.length) {
      return conversations[focusedIndex];
    }
    return null;
  }

  /**
   * Opens the context menu for the currently focused conversation.
   * Used for Shift+F10 keyboard shortcut.
   */
  private openContextMenuForFocused(): void {
    const focusedConversation = this.getFocusedConversation();
    if (focusedConversation) {
      this.handleContextMenuOpen(focusedConversation);
    }
  }

  /**
   * Announces the current selection count via screen reader.
   * @see Requirements 13.6
   */
  private announceSelectionCount(): void {
    const count = this.selectedCount();
    if (count > 0) {
      const message = CometChatLocalize.getLocalizedString('accessibility_items_selected').replace(
        '{count}',
        count.toString()
      );
      this.liveAnnouncer.announce(message, 'polite');
    }
  }

  /**
   * Announces that selection has been cleared via screen reader.
   * @see Requirements 3.7
   */
  private announceSelectionCleared(): void {
    this.liveAnnouncer.announce(
      CometChatLocalize.getLocalizedString('accessibility_selection_cleared'),
      'polite'
    );
  }

  // ==================== Live Announcements for Conversations (Task 5.2) ====================

  /**
   * Announces the number of search results to screen readers.
   * Announces "No results found" when search returns no results.
   * @param count - The number of search results
   * @see Requirements 12.5, 12.6
   */
  announceSearchResults(count: number): void {
    if (count === 0) {
      this.liveAnnouncer.announce(
        CometChatLocalize.getLocalizedString('accessibility_no_results'),
        'polite'
      );
    } else {
      const message = CometChatLocalize.getLocalizedString('accessibility_results_found').replace(
        '{count}',
        count.toString()
      );
      this.liveAnnouncer.announce(message, 'polite');
    }
  }

  /**
   * Announces when a new conversation appears at the top of the list.
   * @param name - The name of the user/group in the new conversation
   * @see Requirements 18.1
   */
  announceNewConversation(name: string): void {
    const message = CometChatLocalize.getLocalizedString('accessibility_new_conversation').replace(
      '{name}',
      name
    );
    this.liveAnnouncer.announce(message, 'polite');
  }

  /**
   * Announces typing indicator with debouncing to avoid repetitive announcements.
   * Only announces if the typing user is different from the last announced user,
   * or if sufficient time has passed since the last announcement.
   * @param name - The name of the user who is typing
   * @see Requirements 18.5
   */
  announceTyping(name: string): void {
    // Skip if same user was just announced
    if (this.lastAnnouncedTypingUser === name) {
      return;
    }

    // Clear any pending announcement
    if (this.typingAnnouncementTimeout) {
      clearTimeout(this.typingAnnouncementTimeout);
    }

    // Debounce typing announcements (1 second delay)
    this.typingAnnouncementTimeout = setTimeout(() => {
      const message = CometChatLocalize.getLocalizedString('accessibility_user_typing').replace(
        '{name}',
        name
      );
      this.liveAnnouncer.announce(message, 'polite');
      this.lastAnnouncedTypingUser = name;

      // Reset the last announced user after 5 seconds to allow re-announcement
      setTimeout(() => {
        if (this.lastAnnouncedTypingUser === name) {
          this.lastAnnouncedTypingUser = null;
        }
      }, 5000);
    }, 1000);
  }

  /**
   * Announces when a conversation is deleted.
   * @see Requirements 18.3
   */
  announceConversationDeleted(): void {
    this.liveAnnouncer.announce(
      CometChatLocalize.getLocalizedString('accessibility_conversation_deleted'),
      'polite'
    );
  }

  /**
   * Detects if a new conversation has appeared at the top of the list and announces it.
   * A conversation is considered "new" if it wasn't in the previous list at all.
   * @param currentConversations - Current list of conversations
   * @param previousConversations - Previous list of conversations
   * @see Requirements 18.1
   * @private
   */
  private detectAndAnnounceNewConversation(
    currentConversations: CometChat.Conversation[],
    previousConversations: CometChat.Conversation[]
  ): void {
    // Skip if no conversations or this is the initial load
    if (currentConversations.length === 0 || previousConversations.length === 0) {
      return;
    }

    // Get the first conversation (top of list)
    const firstConversation = currentConversations[0];
    const firstConversationId = this.getConversationId(firstConversation);

    // Check if this conversation existed in the previous list
    const existedBefore = previousConversations.some(
      conv => this.getConversationId(conv) === firstConversationId
    );

    // If it's a truly new conversation (not just moved to top), announce it
    if (!existedBefore) {
      const conversationWith = firstConversation.getConversationWith();
      const name = conversationWith.getName();
      if (name) {
        this.announceNewConversation(name);
      }
    }
  }

  /**
   * Focuses the conversation item at the given index.
   * Finds the focusable element (inner div with tabindex) and calls focus() on it.
   * @param index - The index of the item to focus
   * @private
   */
  private focusItemAtIndex(index: number): void {
    // Use setTimeout to ensure the DOM has updated with the new focused index
    setTimeout(() => {
      const itemsContainer = document.querySelector('.cometchat-paginated-list__items');
      if (!itemsContainer) return;

      const paginatedListItems = itemsContainer.querySelectorAll('.cometchat-paginated-list__item');
      if (index < 0 || index >= paginatedListItems.length) return;

      const targetItem = paginatedListItems[index];
      // Find the focusable element - the inner div with class 'cometchat-conversation-item'
      const focusableElement = targetItem.querySelector(
        '.cometchat-conversation-item[tabindex]'
      ) as HTMLElement;

      if (focusableElement) {
        focusableElement.focus();
        focusableElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 0);
  }

  /**
   * Handles focus events within the conversations list.
   * Syncs the focusedIndex when an item receives focus via Tab or click.
   * @param event - The focus event
   */
  handleFocusIn(event: FocusEvent): void {
    const target = event.target as HTMLElement;
    if (!target) return;

    // Check if the focused element is the inner div with class 'cometchat-conversation-item'
    // or is within a conversation item
    const conversationItemDiv = target.classList.contains('cometchat-conversation-item')
      ? target
      : target.closest('.cometchat-conversation-item');
    if (!conversationItemDiv) return;

    // Find the wrapper - go up to find cometchat-conversations__list-item-wrapper
    const wrapper = conversationItemDiv.closest('.cometchat-conversations__list-item-wrapper');
    if (!wrapper) return;

    // Find the paginated list item container (parent of wrapper)
    const paginatedListItem = wrapper.closest('.cometchat-paginated-list__item');
    if (!paginatedListItem) return;

    // Find the items container
    const itemsContainer = paginatedListItem.parentElement;
    if (!itemsContainer || !itemsContainer.classList.contains('cometchat-paginated-list__items'))
      return;

    // Get all paginated list items and find the index
    const allItems = Array.from(itemsContainer.children);
    const index = allItems.indexOf(paginatedListItem);

    if (index !== -1 && this.focusedIndex() !== index) {
      this.focusedIndex.set(index);
    }
  }

  // ==================== Context Menu Methods ====================
  getContextMenuOptions(conversation: CometChat.Conversation): CometChatOption[] {
    if (this.options) {
      return this.options(conversation);
    }
    const options: CometChatOption[] = [];
    if (!this.hideDeleteConversation) {
      options.push(
        new CometChatOption({
          id: 'delete',
          title: CometChatLocalize.getLocalizedString('conversation_delete_icon_hover'),
          iconURL: 'assets/delete.svg',
          onClick: () => this.handleDeleteConversationClick(conversation),
        })
      );
    }
    return options;
  }

  // ==================== Sound Notification Methods ====================
  private handleSoundNotification(
    currentConversations: CometChat.Conversation[],
    previousConversations: CometChat.Conversation[]
  ): void {
    if (this.effectiveDisableSoundForMessages() || currentConversations.length === 0) return;

    const firstConversation = currentConversations[0];
    const lastMessage = firstConversation.getLastMessage();
    if (!lastMessage || !this.shouldPlaySound()) return;

    const isNewMessage = this.isNewMessage(firstConversation, previousConversations);
    if (!isNewMessage || this.isConversationActive(firstConversation)) return;
    if (this.isMessageFromLoggedInUser(lastMessage)) return;

    this.playMessageSound();
  }

  private shouldPlaySound(): boolean {
    return Date.now() - this.lastSoundPlayedAt >= this.SOUND_THROTTLE_INTERVAL;
  }

  private isNewMessage(
    conversation: CometChat.Conversation,
    previousConversations: CometChat.Conversation[]
  ): boolean {
    const conversationId = this.getConversationId(conversation);
    const lastMessage = conversation.getLastMessage();
    if (!lastMessage) return false;

    const previousConversation = previousConversations.find(
      conv => this.getConversationId(conv) === conversationId
    );
    if (!previousConversation) return true;

    const previousLastMessage = previousConversation.getLastMessage();
    if (!previousLastMessage) return true;

    return lastMessage.getId() !== previousLastMessage.getId();
  }

  private isMessageFromLoggedInUser(message: CometChat.BaseMessage): boolean {
    if (!this.loggedInUser) return false;
    const sender = message.getSender();
    return sender?.getUid() === this.loggedInUser.getUid();
  }

  private playMessageSound(): void {
    try {
      this.lastSoundPlayedAt = Date.now();
      CometChatSoundManager.play('incomingMessage', this.effectiveCustomSoundForMessages() || null);
    } catch (error) {
      CometChatLogger.error('CometChatConversations', 'Error playing sound:', error);
    }
  }

  // ==================== Utility Methods ====================
  getConversationId(conversation: CometChat.Conversation): string {
    const conversationWith = conversation.getConversationWith();
    return conversationWith instanceof CometChat.User
      ? conversationWith.getUid()
      : conversationWith.getGuid();
  }

  getTypingIndicator(conversation: CometChat.Conversation): CometChat.TypingIndicator | null {
    const typingIndicators = this.typingIndicators();
    if (!typingIndicators) return null;
    const conversationWith = conversation.getConversationWith();
    const conversationId =
      conversationWith instanceof CometChat.User
        ? conversationWith.getUid()
        : conversationWith.getGuid();
    return typingIndicators.get(conversationId) || null;
  }

  getDefaultDateTimeFormat(): CalendarObject {
    return {
      today: `hh:mm A`,
      yesterday: `[${CometChatLocalize.getLocalizedString('yesterday')}]`,
      otherDays: 'DD/MM/YYYY',
    };
  }

  trackByConversation(_index: number, conversation: CometChat.Conversation): string {
    return this.getConversationId(conversation);
  }

  /**
   * Subscribe to message read events from message list.
   * Resets unread count to 0 for the matching conversation when messages are read,
   * matching the React UIKit pattern (Requirement 4.13, Property 6).
   * Also updates read receipt status on the last message.
   * @see Requirements 4.13, 1.4
   */
  private subscribeToMessagesReadEvents(): void {
    this.messagesReadSubscription = CometChatMessageEvents.ccMessageRead
      .pipe(takeUntil(this.destroy$))
      .subscribe((message: CometChat.BaseMessage) => {
        try {
          // Get conversation ID from message
          const receiver = message.getReceiver();
          const conversationId =
            receiver instanceof CometChat.User
              ? receiver.getUid()
              : (receiver as CometChat.Group).getGuid();

          // Update conversation read status via service (Requirement 9.3, 9.4)
          this.conversationsService.updateConversationReadStatus(conversationId, message);
        } catch (error) {
          CometChatLogger.error(
            'CometChatConversations',
            'Error handling message read event:',
            error
          );
        }
      });
  }

  handleRetryClick(): void {
    this.conversationsService.clearError();
    if (this.conversationsRequestBuilder) {
      this.conversationsService.fetchConversations(this.conversationsRequestBuilder);
    } else {
      this.conversationsService.fetchConversations();
    }
  }
}
