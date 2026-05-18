
import { Component, Input, Output, EventEmitter, TemplateRef, ViewChild, ContentChild, ChangeDetectionStrategy, OnInit, OnDestroy, signal, computed, effect, Signal, inject, ElementRef, booleanAttribute, Optional, DestroyRef } from '@angular/core';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatPaginatedListComponent } from '../cometchat-paginated-list/cometchat-paginated-list.component';
import { CometChatConversationItemComponent } from '../cometchat-conversation-item/cometchat-conversation-item.component';
import { CometChatSearchBarComponent } from '../base-elements/cometchat-search-bar/cometchat-search-bar.component';
import { CometChatConfirmDialogComponent } from '../base-elements/cometchat-confirm-dialog/cometchat-confirm-dialog.component';
import { CometChatCheckboxComponent } from '../base-elements/cometchat-checkbox/cometchat-checkbox.component';
import { CometChatRadioButtonComponent } from '../base-elements/cometchat-radio-button/cometchat-radio-button.component';
import { CometChatErrorBoundaryComponent } from '../base-elements/cometchat-error-boundary/cometchat-error-boundary.component';
import { ConversationsService } from '../../services/conversations.service';
import { CometChatTemplatesService } from '../../services/templates.service';
import { ChatStateService } from '../../services/chat-state.service';
import { FormatterConfigService } from '../../services/formatter-config.service';
import { COMETCHAT_GLOBAL_CONFIG, GlobalConfig } from '../../services/global-config.service';
import { LiveAnnouncerService } from '../../services/live-announcer.service';
import { CometChatMessageEvents } from '../../events/CometChatMessageEvents';
import { CometChatConversationEvents } from '../../events/CometChatConversationEvents';
import { CometChatSoundManager } from '../../resources/CometChatSoundManager/CometChatSoundManager';
import { CometChatLocalize } from '../../resources/CometChatLocalize/cometchat-localize';
import { TranslatePipe } from '../../resources/CometChatLocalize/translate.pipe';
import { CometChatLogger } from '../../utils/CometChatLogger';
import { CometChatTextFormatter } from '../../formatters/cometchat-text-formatter';
import { CometChatUIKitConstants } from '../../constants';
import { SelectionMode, Placement } from '../../Enums/Enums';
import { CometChatOption } from '../../modals/CometChatOption';
import { CalendarObject } from '../../resources/CometChatLocalize/localization.interfaces';
import { ConversationSlots } from '../../interfaces/conversation-slots.interface';
import { SelectionState } from '../../modals/SelectionState';
export type { SelectionState } from '../../modals/SelectionState';

@Component({
  selector: 'cometchat-conversations',
  standalone: true,
  imports: [CommonModule, CometChatPaginatedListComponent, CometChatConversationItemComponent, CometChatSearchBarComponent, CometChatConfirmDialogComponent, CometChatCheckboxComponent, CometChatRadioButtonComponent, CometChatErrorBoundaryComponent, TranslatePipe],
  templateUrl: './cometchat-conversations.component.html',
  styleUrls: ['./cometchat-conversations.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CometChatConversationsComponent implements OnInit, OnDestroy {
  readonly shimmerList = CometChatUIKitConstants.shimmerList;

  private conversationsService = inject(ConversationsService);
  private templatesService = inject(CometChatTemplatesService);
  private chatStateService = inject(ChatStateService);
  private formatterConfigService = inject(FormatterConfigService);
  private liveAnnouncer = inject(LiveAnnouncerService);

  private globalConfig: Partial<GlobalConfig> | null = inject(COMETCHAT_GLOBAL_CONFIG, { optional: true });

  private hideReceiptsExplicitlySet = signal(false); private hideErrorExplicitlySet = signal(false); private hideUserStatusExplicitlySet = signal(false);
  private hideGroupTypeExplicitlySet = signal(false); private showScrollbarExplicitlySet = signal(false); private showSearchBarExplicitlySet = signal(false);
  private disableSoundForMessagesExplicitlySet = signal(false); private textFormattersExplicitlySet = signal(false);
  private disableDefaultContextMenuExplicitlySet = signal(false); private customSoundForMessagesExplicitlySet = signal(false);

  private _hideReceipts = signal(false); private _hideError = signal(false); private _hideUserStatus = signal(false);
  private _hideGroupType = signal(false); private _showScrollbar = signal(false); private _showSearchBar = signal(false);
  private _disableSoundForMessages = signal(false); private _textFormatters = signal<any[]>([]); private _disableDefaultContextMenu = signal(true); private _customSoundForMessages = signal('');
  @Input({ transform: booleanAttribute })
  set hideReceipts(value: boolean) { this._hideReceipts.set(value); this.hideReceiptsExplicitlySet.set(true); }
  get hideReceipts(): boolean { return this._hideReceipts(); }
  @Input({ transform: booleanAttribute })
  set hideError(value: boolean) { this._hideError.set(value); this.hideErrorExplicitlySet.set(true); }
  get hideError(): boolean { return this._hideError(); }
  @Input({ transform: booleanAttribute }) hideDeleteConversation = false;
  @Input({ transform: booleanAttribute })
  set hideUserStatus(value: boolean) { this._hideUserStatus.set(value); this.hideUserStatusExplicitlySet.set(true); }
  get hideUserStatus(): boolean { return this._hideUserStatus(); }
  @Input({ transform: booleanAttribute })
  set hideGroupType(value: boolean) { this._hideGroupType.set(value); this.hideGroupTypeExplicitlySet.set(true); }
  get hideGroupType(): boolean { return this._hideGroupType(); }
  @Input({ transform: booleanAttribute })
  set disableDefaultContextMenu(value: boolean) { this._disableDefaultContextMenu.set(value); this.disableDefaultContextMenuExplicitlySet.set(true); }
  get disableDefaultContextMenu(): boolean { return this._disableDefaultContextMenu(); }
  @Input({ transform: booleanAttribute })
  set showScrollbar(value: boolean) { this._showScrollbar.set(value); this.showScrollbarExplicitlySet.set(true); }
  get showScrollbar(): boolean { return this._showScrollbar(); }
  @Input({ transform: booleanAttribute })
  set showSearchBar(value: boolean) { this._showSearchBar.set(value); this.showSearchBarExplicitlySet.set(true); }
  get showSearchBar(): boolean { return this._showSearchBar(); }
  @Input() conversationsRequestBuilder?: CometChat.ConversationsRequestBuilder;
  @Input() activeConversation?: CometChat.Conversation;
  @Input()
  set textFormatters(value: CometChatTextFormatter[]) { this._textFormatters.set(value); this.textFormattersExplicitlySet.set(true); }
  get textFormatters(): CometChatTextFormatter[] { return this._textFormatters(); }
  @Input() selectionMode: SelectionMode = SelectionMode.none;
  @Input() lastMessageDateTimeFormat?: CalendarObject;
  @Input() options?: (conversation: CometChat.Conversation) => CometChatOption[];
  @Input({ transform: booleanAttribute })
  set disableSoundForMessages(value: boolean) { this._disableSoundForMessages.set(value); this.disableSoundForMessagesExplicitlySet.set(true); }
  get disableSoundForMessages(): boolean { return this._disableSoundForMessages(); }
  @Input()
  set customSoundForMessages(value: string) { this._customSoundForMessages.set(value); this.customSoundForMessagesExplicitlySet.set(true); }
  get customSoundForMessages(): string { return this._customSoundForMessages(); }
  @Input() slots?: Partial<ConversationSlots>;
  @Input() headerView?: TemplateRef<any>; @Input() menuView?: TemplateRef<any>; @Input() loadingView?: TemplateRef<any>;
  @Input() emptyView?: TemplateRef<any>; @Input() errorView?: TemplateRef<any>; @Input() searchView?: TemplateRef<any>;
  @Input() itemView?: TemplateRef<{ $implicit: CometChat.Conversation }>; @Input() leadingView?: TemplateRef<{ $implicit: CometChat.Conversation }>;
  @Input() titleView?: TemplateRef<{ $implicit: CometChat.Conversation }>; @Input() subtitleView?: TemplateRef<{ $implicit: CometChat.Conversation }>; @Input() trailingView?: TemplateRef<{ $implicit: CometChat.Conversation }>;

  @Input() listItemTemplate: TemplateRef<any> | null = null; @Input() emptyStateTemplate: TemplateRef<any> | null = null;
  @Input() errorStateTemplate: TemplateRef<any> | null = null; @Input() loadingStateTemplate: TemplateRef<any> | null = null;
  @ContentChild('headerView') headerViewContent?: TemplateRef<any>; @ContentChild('menuView') menuViewContent?: TemplateRef<any>; @ContentChild('loadingView') loadingViewContent?: TemplateRef<any>;
  @ContentChild('emptyView') emptyViewContent?: TemplateRef<any>; @ContentChild('errorView') errorViewContent?: TemplateRef<any>; @ContentChild('searchView') searchViewContent?: TemplateRef<any>;
  @ContentChild('itemView') itemViewContent?: TemplateRef<{ $implicit: CometChat.Conversation }>;
  @ContentChild('leadingView') leadingViewContent?: TemplateRef<{ $implicit: CometChat.Conversation }>;
  @ContentChild('titleView') titleViewContent?: TemplateRef<{ $implicit: CometChat.Conversation }>;
  @ContentChild('subtitleView') subtitleViewContent?: TemplateRef<{ $implicit: CometChat.Conversation }>;
  @ContentChild('trailingView') trailingViewContent?: TemplateRef<{ $implicit: CometChat.Conversation }>;
  @ViewChild('paginatedList') paginatedList?: CometChatPaginatedListComponent<CometChat.Conversation>;
  @ViewChild('searchBar') searchBar?: CometChatSearchBarComponent;
  @ViewChild('dialogOverlay') dialogOverlay?: ElementRef<HTMLDivElement>;
  @ViewChild('selectionControlTemplate') selectionControlTemplate?: TemplateRef<any>;

  @Output() itemClick = new EventEmitter<CometChat.Conversation>();
  @Output() select = new EventEmitter<{ conversation: CometChat.Conversation; selected: boolean }>();
  @Output() error = new EventEmitter<CometChat.CometChatException>();
  @Output() searchBarClick = new EventEmitter<void>();
  @Output() contextMenuOpen = new EventEmitter<CometChat.Conversation>();
  @Output() contextMenuClose = new EventEmitter<CometChat.Conversation>();
  @Output() scrollToTop = new EventEmitter<void>(); @Output() scrollToBottom = new EventEmitter<void>();
  @Output() selectionChange = new EventEmitter<SelectionState>();

  conversations!: Signal<CometChat.Conversation[]>; loadingState!: Signal<boolean>; errorState!: Signal<Error | null>;
  activeConversationSignal!: Signal<CometChat.Conversation | null>; typingIndicators!: Signal<Map<string, CometChat.TypingIndicator>>;

  selectedConversations = signal(new Set<string>()); focusedIndex = signal(-1); showDeleteConfirmDialog = signal(false);
  conversationToDelete = signal<CometChat.Conversation | null>(null); isFetchingMore = signal(false); hasMore = signal(true);

  hasSelection = computed(() => this.selectedConversations().size > 0);
  selectedCount = computed(() => this.selectedConversations().size);
  isSelectionModeActive = computed(() => this.selectionMode !== SelectionMode.none);
  shouldShowDeleteDialog = computed(() => this.showDeleteConfirmDialog() && this.conversationToDelete() !== null);
  hasConversations = computed(() => this.conversations().length > 0);
  isLoading = computed(() => this.loadingState()); hasError = computed(() => this.errorState() !== null);

  effectiveHideReceipts = computed(() => { if (this.hideReceiptsExplicitlySet()) return this._hideReceipts(); if (this.globalConfig?.hideReceipts !== undefined) return this.globalConfig.hideReceipts; return false; });
  effectiveHideError = computed(() => { if (this.hideErrorExplicitlySet()) return this._hideError(); if (this.globalConfig?.hideError !== undefined) return this.globalConfig.hideError; return false; });
  effectiveHideUserStatus = computed(() => { if (this.hideUserStatusExplicitlySet()) return this._hideUserStatus(); if (this.globalConfig?.hideUserStatus !== undefined) return this.globalConfig.hideUserStatus; return false; });
  effectiveHideGroupType = computed(() => { if (this.hideGroupTypeExplicitlySet()) return this._hideGroupType(); if (this.globalConfig?.hideGroupType !== undefined) return this.globalConfig.hideGroupType; return false; });
  effectiveShowScrollbar = computed(() => { if (this.showScrollbarExplicitlySet()) return this._showScrollbar(); if (this.globalConfig?.showScrollbar !== undefined) return this.globalConfig.showScrollbar; return false; });
  effectiveShowSearchBar = computed(() => { if (this.showSearchBarExplicitlySet()) return this._showSearchBar(); if (this.globalConfig?.showSearchBar !== undefined) return this.globalConfig.showSearchBar; return false; });
  effectiveDisableSoundForMessages = computed(() => { if (this.disableSoundForMessagesExplicitlySet()) return this._disableSoundForMessages(); if (this.globalConfig?.disableSoundForMessages !== undefined) return this.globalConfig.disableSoundForMessages; return false; });
  effectiveTextFormatters = computed(() => { if (this.textFormattersExplicitlySet()) return this._textFormatters(); if (this.globalConfig?.textFormatters !== undefined) return this.globalConfig.textFormatters; return []; });
  effectiveDisableDefaultContextMenu = computed(() => { if (this.disableDefaultContextMenuExplicitlySet()) return this._disableDefaultContextMenu(); if (this.globalConfig?.disableDefaultContextMenu !== undefined) return this.globalConfig.disableDefaultContextMenu; return true; });
  effectiveCustomSoundForMessages = computed(() => { if (this.customSoundForMessagesExplicitlySet()) return this._customSoundForMessages(); if (this.globalConfig?.customSoundForMessages !== undefined) return this.globalConfig.customSoundForMessages; return ''; });

  private get _ct() { return this.templatesService.getConversationTemplates(); }
  get effectiveItemView(): TemplateRef<any> | undefined { return this.listItemTemplate || this.itemView || this.itemViewContent || this._ct.itemView; }
  get effectiveLeadingView(): TemplateRef<any> | undefined { return this.leadingView || this.leadingViewContent || this._ct.leadingView; }
  get effectiveTitleView(): TemplateRef<any> | undefined { return this.titleView || this.titleViewContent || this._ct.titleView; }
  get effectiveSubtitleView(): TemplateRef<any> | undefined { return this.subtitleView || this.subtitleViewContent || this._ct.subtitleView; }
  get effectiveTrailingView(): TemplateRef<any> | undefined { return this.trailingView || this.trailingViewContent || this._ct.trailingView; }
  get effectiveLoadingView(): TemplateRef<any> | undefined { return this.loadingStateTemplate || this.loadingView || this.loadingViewContent || this.templatesService.resolveTemplate(this._ct, 'loadingView'); }
  get effectiveEmptyView(): TemplateRef<any> | undefined { return this.emptyStateTemplate || this.emptyView || this.emptyViewContent || this.templatesService.resolveTemplate(this._ct, 'emptyView'); }
  get effectiveErrorView(): TemplateRef<any> | undefined { return this.errorStateTemplate || this.errorView || this.errorViewContent || this.templatesService.resolveTemplate(this._ct, 'errorView'); }
  public loggedInUser: CometChat.User | null = null; private searchSubject$ = new Subject<string>(); public currentSearchText = '';
  private lastSoundPlayedAt = 0; private readonly SOUND_THROTTLE_INTERVAL = 2000; private previousConversations: CometChat.Conversation[] = [];
  private lastSelectedIndex = -1; public activeFormatters: CometChatTextFormatter[] = [];
  private typingAnnouncementTimeout: ReturnType<typeof setTimeout> | null = null; private lastAnnouncedTypingUser: string | null = null;
  private previousTypingSize = 0;
  private readonly destroyRef = inject(DestroyRef);
  readonly SelectionMode = SelectionMode; readonly Placement = Placement;

  constructor() {
    this.conversations = toSignal(this.conversationsService.conversations$, { initialValue: [] as CometChat.Conversation[] });
    this.loadingState = toSignal(this.conversationsService.loadingState$, { initialValue: false });
    this.errorState = toSignal(this.conversationsService.errorState$, { initialValue: null as Error | null });
    this.activeConversationSignal = toSignal(this.conversationsService.activeConversation$, { initialValue: null as CometChat.Conversation | null });
    this.typingIndicators = toSignal(this.conversationsService.typingIndicators$, { initialValue: new Map<string, CometChat.TypingIndicator>() });

    effect(() => { const c = this.conversations(); this.detectAndAnnounceNewConversation(c, this.previousConversations); this.previousConversations = [...c]; }, { allowSignalWrites: true });

    effect(() => { const ti = this.typingIndicators(); const currentSize = ti?.size ?? 0; if (currentSize > this.previousTypingSize && currentSize > 0) { const e = ti.entries().next().value; if (e) { const s = (e[1] as CometChat.TypingIndicator).getSender(); if (s) this.announceTyping(s.getName()); } } this.previousTypingSize = currentSize; }, { allowSignalWrites: true });

    effect(() => { const e = this.errorState(); if (e && !this.effectiveHideError()) this.error.emit(e as CometChat.CometChatException); }, { allowSignalWrites: true });

    effect(() => { if (this.showDeleteConfirmDialog() && this.dialogOverlay?.nativeElement) setTimeout(() => this.dialogOverlay?.nativeElement?.focus(), 0); }, { allowSignalWrites: true });
  }
  ngOnInit(): void {
    try {
      this.initializeLoggedInUser().then(() => {
        // Reconfigure formatters with the now-resolved logged-in user
        this.configureFormattersWithUser();
      }).catch(() => { /* ignore — formatters work without user context */ });
      this.initializeFormatters();
      this.initializeService();
      this.setupSearchDebouncing();
      this.subscribeToMessagesReadEvents();
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      CometChatLogger.error('CometChatConversations', 'Error in ngOnInit:', err);
      this.error.emit(err as CometChat.CometChatException);
    }
  }
  ngOnDestroy(): void {
    try {
      if (this.typingAnnouncementTimeout) {
        clearTimeout(this.typingAnnouncementTimeout);
        this.typingAnnouncementTimeout = null;
      }
    } catch (error) {
      CometChatLogger.error('CometChatConversations', 'Error in ngOnDestroy:', error);
    }
  }
  private async initializeLoggedInUser(): Promise<void> { try { this.loggedInUser = await CometChat.getLoggedinUser(); } catch (error) { CometChatLogger.error('CometChatConversations', 'Error getting logged-in user:', error); } }
  private initializeFormatters(): void { const ef = this.effectiveTextFormatters(); this.activeFormatters = (ef?.length > 0) ? [...ef] : this.formatterConfigService.getDefaultFormatters(); this.configureFormattersWithUser(); }
  private configureFormattersWithUser(): void { if (!this.loggedInUser) return; this.activeFormatters = this.formatterConfigService.getFormattersWithContext(this.loggedInUser, undefined); }
  private initializeService(): void { this.conversationsService.fetchConversations(this.conversationsRequestBuilder); if (this.activeConversation) this.conversationsService.setActiveConversation(this.activeConversation); }
  handleLoadMore(): void {
    if (this.isFetchingMore()) return;
    this.isFetchingMore.set(true); const start = Date.now();
    this.conversationsService.fetchNextConversations().then(h => { const rem = Math.max(0, 500 - (Date.now() - start)); setTimeout(() => { this.isFetchingMore.set(false); this.hasMore.set(h); this.paginatedList?.loadComplete(); }, rem); }).catch(e => { CometChatLogger.error('CometChatConversations', 'fetchNextConversations error:', e); this.isFetchingMore.set(false); this.paginatedList?.loadComplete(); });
  }
  handleScrollToTop(): void { this.scrollToTop.emit(); }
  handleScrollToBottom(): void { this.scrollToBottom.emit(); }
  handleConversationClick(conversation: CometChat.Conversation): void {
    if (this.selectionMode !== SelectionMode.none) { this.handleSelection(conversation); return; }
    // ENG-35029: Guard against clicks while the conversation list is still loading.
    // Clicking during load can result in a "Something went wrong" error because the
    // conversation object may be incomplete or the message list service isn't ready.
    if (this.loadingState()) { return; }
    this.conversationsService.setActiveConversation(conversation);
    if (this.itemClick.observed) { this.itemClick.emit(conversation); } else { this.chatStateService.setActiveConversation(conversation); }
  }
  handleConversationSelect(event: { conversation: CometChat.Conversation; selected: boolean }): void { this.select.emit(event); }
  handleContextMenuOpen(conversation: CometChat.Conversation): void { this.contextMenuOpen.emit(conversation); }
  handleContextMenuOptionClick(event: { option: CometChatOption; conversation: CometChat.Conversation }): void { if (event.option.id === 'delete') this.handleDeleteConversationClick(event.conversation); if (event.option.onClick) event.option.onClick(); }
  handleSelection(conversation: CometChat.Conversation, event?: MouseEvent): void {
    const id = this.getConversationId(conversation); const convs = this.conversations();
    const idx = convs.findIndex(c => this.getConversationId(c) === id);
    if (this.selectionMode === SelectionMode.single) {
      const wasSelected = this.selectedConversations().has(id);
      this.selectedConversations.set(wasSelected ? new Set() : new Set([id]));
      this.select.emit({ conversation, selected: !wasSelected }); this.lastSelectedIndex = idx;
    } else if (this.selectionMode === SelectionMode.multiple) {
      if (event?.shiftKey && this.lastSelectedIndex !== -1 && idx !== -1) { this.selectRange(this.lastSelectedIndex, idx); }
      else { this.selectedConversations.update(sel => { const ns = new Set(sel); if (ns.has(id)) { ns.delete(id); this.select.emit({ conversation, selected: false }); } else { ns.add(id); this.select.emit({ conversation, selected: true }); } return ns; }); this.lastSelectedIndex = idx; }
    }
    this.selectionChange.emit({ mode: this.selectionMode, selectedIds: this.selectedConversations(), lastSelectedId: id });
  }
  selectAll(): void {
    if (this.selectionMode !== SelectionMode.multiple) return;
    const convs = this.conversations(); const ns = new Set<string>(); convs.forEach(c => { const id = this.getConversationId(c); ns.add(id); this.select.emit({ conversation: c, selected: true }); });
    this.selectedConversations.set(ns); this.lastSelectedIndex = convs.length - 1;
    this.selectionChange.emit({ mode: this.selectionMode, selectedIds: ns, lastSelectedId: null });
  }
  clearSelection(): void {
    const sel = this.selectedConversations(); this.conversations().forEach(c => { if (sel.has(this.getConversationId(c))) this.select.emit({ conversation: c, selected: false }); });
    this.selectedConversations.set(new Set()); this.lastSelectedIndex = -1;
    this.selectionChange.emit({ mode: this.selectionMode, selectedIds: new Set(), lastSelectedId: null });
  }
  private selectRange(startIndex: number, endIndex: number): void {
    const convs = this.conversations(); const [min, max] = [Math.min(startIndex, endIndex), Math.max(startIndex, endIndex)];
    const clicked = convs[endIndex]; if (!clicked) return;
    const clickedId = this.getConversationId(clicked); const deselect = this.selectedConversations().has(clickedId);
    this.selectedConversations.update(sel => { const ns = new Set(sel); for (let i = min; i <= max; i++) { const c = convs[i]; if (!c) continue; const id = this.getConversationId(c); if (deselect && ns.has(id)) { ns.delete(id); this.select.emit({ conversation: c, selected: false }); } else if (!deselect && !ns.has(id)) { ns.add(id); this.select.emit({ conversation: c, selected: true }); } } return ns; });
    this.lastSelectedIndex = endIndex;
  }
  handleSelectionClick(eventOrConversation: MouseEvent | CometChat.Conversation, conversation?: CometChat.Conversation): void {
    let event: MouseEvent | undefined; let conv: CometChat.Conversation;
    if (eventOrConversation instanceof MouseEvent) { event = eventOrConversation; conv = conversation!; event.stopPropagation(); } else { conv = eventOrConversation; }
    this.handleSelection(conv, event);
    if (event?.shiftKey) { this.focusedIndex.set(-1); (document.activeElement as HTMLElement)?.blur(); }
  }
  handleContainerClick(event: MouseEvent): void { const t = event.target as HTMLElement; if (!t.closest('.cometchat-conversation-item') && !t.closest('.cometchat-conversations__selection-control') && !t.closest('cometchat-search-bar')) { this.focusedIndex.set(-1); (document.activeElement as HTMLElement)?.blur(); } }
  isConversationSelected(conversation: CometChat.Conversation): boolean { return this.selectedConversations().has(this.getConversationId(conversation)); }
  isConversationActive(conversation: CometChat.Conversation): boolean { const id = this.getConversationId(conversation); if (this.activeConversation) return id === this.getConversationId(this.activeConversation); const s = this.activeConversationSignal(); return s ? id === this.getConversationId(s) : false; }
  handleDeleteConversationClick(conversation: CometChat.Conversation): void { this.conversationToDelete.set(conversation); this.showDeleteConfirmDialog.set(true); }
  async handleDeleteConfirm(): Promise<void> {
    const conv = this.conversationToDelete(); if (!conv) return;
    try { const cw = conv.getConversationWith(); const id = cw instanceof CometChat.User ? cw.getUid() : cw.getGuid(); const type = cw instanceof CometChat.User ? 'user' : 'group'; await this.conversationsService.deleteConversation(id, type); this.announceConversationDeleted(); }
    catch (error) { this.error.emit(error as CometChat.CometChatException); } finally { this.showDeleteConfirmDialog.set(false); this.conversationToDelete.set(null); }
  }
  handleDeleteCancel(): void { this.showDeleteConfirmDialog.set(false); this.conversationToDelete.set(null); }
  handleDialogKeydown(event: KeyboardEvent): void { if (event.key === 'Escape') this.handleDeleteCancel(); event.stopPropagation(); }
  private setupSearchDebouncing(): void {
    this.searchSubject$
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(searchText => {
        this.conversationsService.searchConversations(searchText);

        if (searchText && searchText.trim() !== '') {
          setTimeout(() => {
            this.announceSearchResults(this.conversations().length);
          }, 50);
        }
      });
  }
  handleSearchBarClick(): void { this.searchBarClick.emit(); }
  handleKeydown(event: KeyboardEvent): void {
    const conversations = this.conversations();
    if (!conversations.length || this.showDeleteConfirmDialog()) return;
    if (!(event.target as HTMLElement).closest('.cometchat-conversations')) return;

    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'a' && this.selectionMode === SelectionMode.multiple) { event.preventDefault(); event.stopPropagation(); this.clearSelection(); this.announceSelectionCleared(); return; }
    if ((event.ctrlKey || event.metaKey) && event.key === 'a' && this.selectionMode === SelectionMode.multiple) { event.preventDefault(); event.stopPropagation(); this.selectAll(); this.announceSelectionCount(); return; }
    if ((event.key === 'F10' && event.shiftKey) || event.key === 'ContextMenu') { event.preventDefault(); event.stopPropagation(); this.openContextMenuForFocused(); return; }
    if ((event.key === 'Delete' || event.key === 'Backspace') && !this.hideDeleteConversation) { const fc = this.getFocusedConversation(); if (fc) { event.preventDefault(); event.stopPropagation(); this.handleDeleteConversationClick(fc); return; } }
    if (this.selectionMode !== SelectionMode.none) { const handled = this.handleSelectionKeyboard(event); if (handled) return; }
    switch (event.key) {
      case 'ArrowDown': event.preventDefault(); event.stopPropagation(); this.focusedIndex.set(this.focusedIndex() === -1 ? 0 : (this.focusedIndex() + 1) % conversations.length); this.focusItemAtIndex(this.focusedIndex()); break;
      case 'ArrowUp': event.preventDefault(); event.stopPropagation(); this.focusedIndex.set(this.focusedIndex() <= 0 ? conversations.length - 1 : this.focusedIndex() - 1); this.focusItemAtIndex(this.focusedIndex()); break;
      case 'Enter': event.preventDefault(); if (this.focusedIndex() >= 0 && this.focusedIndex() < conversations.length) this.handleConversationClick(conversations[this.focusedIndex()]); break;
      case ' ': if (this.selectionMode === SelectionMode.none) { event.preventDefault(); if (this.focusedIndex() >= 0 && this.focusedIndex() < conversations.length) this.handleConversationClick(conversations[this.focusedIndex()]); } break;
      case 'Escape': event.preventDefault(); if (this.selectionMode !== SelectionMode.none && this.hasSelection()) { this.clearSelection(); this.announceSelectionCleared(); } this.focusedIndex.set(-1); (document.activeElement as HTMLElement)?.blur(); break;
    }
  }
  private handleSelectionKeyboard(event: KeyboardEvent): boolean {
    const fi = this.focusedIndex(); const convs = this.conversations();

    if (event.key === ' ' && !event.shiftKey) { event.preventDefault(); event.stopPropagation(); if (fi >= 0 && fi < convs.length) { this.handleSelection(convs[fi]); this.announceSelectionCount(); } return true; }
    if (event.key === ' ' && event.shiftKey && this.selectionMode === SelectionMode.multiple) { event.preventDefault(); event.stopPropagation(); if (fi >= 0 && fi < convs.length) { this.selectRange(this.lastSelectedIndex, fi); this.announceSelectionCount(); } return true; }
    if (event.key === 'ArrowDown' && event.shiftKey && this.selectionMode === SelectionMode.multiple) { event.preventDefault(); event.stopPropagation(); const ni = fi + 1; if (ni < convs.length) { this.extendSelectionTo(ni); this.focusedIndex.set(ni); this.focusItemAtIndex(ni); this.announceSelectionCount(); } return true; }
    if (event.key === 'ArrowUp' && event.shiftKey && this.selectionMode === SelectionMode.multiple) { event.preventDefault(); event.stopPropagation(); const pi = fi - 1; if (pi >= 0) { this.extendSelectionTo(pi); this.focusedIndex.set(pi); this.focusItemAtIndex(pi); this.announceSelectionCount(); } return true; }
    return false;
  }
  private extendSelectionTo(index: number): void { const convs = this.conversations(); if (index < 0 || index >= convs.length) return; const c = convs[index]; const id = this.getConversationId(c); this.selectedConversations.update(sel => { const ns = new Set(sel); ns.add(id); return ns; }); this.select.emit({ conversation: c, selected: true }); this.lastSelectedIndex = index; this.selectionChange.emit({ mode: this.selectionMode, selectedIds: this.selectedConversations(), lastSelectedId: id }); }
  private getFocusedConversation(): CometChat.Conversation | null { const i = this.focusedIndex(); const c = this.conversations(); return (i >= 0 && i < c.length) ? c[i] : null; }
  private openContextMenuForFocused(): void { const c = this.getFocusedConversation(); if (c) this.handleContextMenuOpen(c); }
  private announceSelectionCount(): void { const c = this.selectedCount(); if (c > 0) this.liveAnnouncer.announce(CometChatLocalize.getLocalizedString('accessibility_items_selected').replace('{count}', c.toString()), 'polite'); }
  private announceSelectionCleared(): void { this.liveAnnouncer.announce(CometChatLocalize.getLocalizedString('accessibility_selection_cleared'), 'polite'); }
  announceSearchResults(count: number): void {
    if (count === 0) { this.liveAnnouncer.announce(CometChatLocalize.getLocalizedString('accessibility_no_results'), 'polite'); }
    else { this.liveAnnouncer.announce(CometChatLocalize.getLocalizedString('accessibility_results_found').replace('{count}', count.toString()), 'polite'); }
  }
  announceNewConversation(name: string): void { this.liveAnnouncer.announce(CometChatLocalize.getLocalizedString('accessibility_new_conversation').replace('{name}', name), 'polite'); }
  announceTyping(name: string): void {
    if (this.lastAnnouncedTypingUser === name) return;
    if (this.typingAnnouncementTimeout) clearTimeout(this.typingAnnouncementTimeout);
    this.typingAnnouncementTimeout = setTimeout(() => {
      this.liveAnnouncer.announce(CometChatLocalize.getLocalizedString('accessibility_user_typing').replace('{name}', name), 'polite');
      this.lastAnnouncedTypingUser = name;
      setTimeout(() => { if (this.lastAnnouncedTypingUser === name) this.lastAnnouncedTypingUser = null; }, 5000);
    }, 1000);
  }
  announceConversationDeleted(): void { this.liveAnnouncer.announce(CometChatLocalize.getLocalizedString('accessibility_conversation_deleted'), 'polite'); }
  private detectAndAnnounceNewConversation(current: CometChat.Conversation[], previous: CometChat.Conversation[]): void {
    if (!current.length || !previous.length) return;
    const first = current[0]; const firstId = this.getConversationId(first);
    if (!previous.some(c => this.getConversationId(c) === firstId)) { const name = first.getConversationWith().getName(); if (name) this.announceNewConversation(name); }
  }
  private focusItemAtIndex(index: number): void {
    setTimeout(() => {
      const items = document.querySelector('.cometchat-paginated-list__items')?.querySelectorAll('.cometchat-paginated-list__item');
      if (!items || index < 0 || index >= items.length) return;
      const el = items[index].querySelector('.cometchat-conversation-item[tabindex]') as HTMLElement;
      if (el) { el.focus(); el.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
    }, 0);
  }
  handleFocusIn(event: FocusEvent): void {
    const target = event.target as HTMLElement; if (!target) return;
    const itemDiv = target.classList.contains('cometchat-conversation-item') ? target : target.closest('.cometchat-conversation-item'); if (!itemDiv) return;
    const paginatedListItem = itemDiv.closest('.cometchat-conversations__list-item-wrapper')?.closest('.cometchat-paginated-list__item'); if (!paginatedListItem) return;
    const itemsContainer = paginatedListItem.parentElement; if (!itemsContainer?.classList.contains('cometchat-paginated-list__items')) return;
    const index = Array.from(itemsContainer.children).indexOf(paginatedListItem);
    if (index !== -1 && this.focusedIndex() !== index) this.focusedIndex.set(index);
  }
  getContextMenuOptions(conversation: CometChat.Conversation): CometChatOption[] {
    if (this.options) return this.options(conversation);
    const opts: CometChatOption[] = [];
    if (!this.hideDeleteConversation) opts.push(new CometChatOption({ id: 'delete', title: CometChatLocalize.getLocalizedString('conversation_delete_icon_hover'), iconURL: 'assets/delete.svg', onClick: () => this.handleDeleteConversationClick(conversation) }));
    return opts;
  }
  private handleSoundNotification(current: CometChat.Conversation[], previous: CometChat.Conversation[]): void {
    if (this.effectiveDisableSoundForMessages() || !current.length) return;
    const first = current[0]; const msg = first.getLastMessage();
    if (!msg || !this.shouldPlaySound() || !this.isNewMessage(first, previous) || this.isConversationActive(first) || this.isMessageFromLoggedInUser(msg)) return;
    this.playMessageSound();
  }
  private shouldPlaySound(): boolean { return Date.now() - this.lastSoundPlayedAt >= this.SOUND_THROTTLE_INTERVAL; }
  private isNewMessage(conversation: CometChat.Conversation, previous: CometChat.Conversation[]): boolean {
    const id = this.getConversationId(conversation); const msg = conversation.getLastMessage(); if (!msg) return false;
    const prev = previous.find(c => this.getConversationId(c) === id); if (!prev) return true;
    const prevMsg = prev.getLastMessage(); return !prevMsg || msg.getId() !== prevMsg.getId();
  }
  private isMessageFromLoggedInUser(message: CometChat.BaseMessage): boolean { if (!this.loggedInUser) return false; const s = message.getSender(); return s?.getUid() === this.loggedInUser.getUid(); }
  private playMessageSound(): void { try { this.lastSoundPlayedAt = Date.now(); CometChatSoundManager.play('incomingMessage', this.effectiveCustomSoundForMessages() || null); } catch (error) { CometChatLogger.error('CometChatConversations', 'Error playing sound:', error); } }

  getConversationId(conversation: CometChat.Conversation): string {
    const cw = conversation.getConversationWith(); return cw instanceof CometChat.User ? cw.getUid() : cw.getGuid(); }

  getTypingIndicator(conversation: CometChat.Conversation): CometChat.TypingIndicator | null { const ti = this.typingIndicators(); if (!ti) return null; const cw = conversation.getConversationWith(); const id = cw instanceof CometChat.User ? cw.getUid() : cw.getGuid(); return ti.get(id) || null; }
  getDefaultDateTimeFormat(): CalendarObject {
    return {
      today: `hh:mm A`,
      yesterday: `[${CometChatLocalize.getLocalizedString('yesterday')}]`,
      otherDays: 'DD/MM/YYYY',
    };
  }
  trackByConversation(_index: number, conversation: CometChat.Conversation): string { return this.getConversationId(conversation); }
  private subscribeToMessagesReadEvents(): void {
    CometChatMessageEvents.ccMessageRead.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((msg: CometChat.BaseMessage) => {
      try { const r = msg.getReceiver(); const id = r instanceof CometChat.User ? r.getUid() : (r as CometChat.Group).getGuid(); this.conversationsService.updateConversationReadStatus(id, msg); }
      catch (e) { CometChatLogger.error('CometChatConversations', 'Error handling message read event:', e); }
    });
    CometChatConversationEvents.ccUpdateConversation.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((conv: CometChat.Conversation) => {
      try { const cw = conv.getConversationWith(); const id = cw instanceof CometChat.User ? cw.getUid() : (cw as CometChat.Group).getGuid(); this.conversationsService.updateConversationUnreadCount(id, conv.getUnreadMessageCount() ?? 0); }
      catch (e) { CometChatLogger.error('CometChatConversations', 'Error handling ccUpdateConversation event:', e); }
    });
  }
  handleRetryClick(): void { this.conversationsService.clearError(); this.conversationsService.fetchConversations(this.conversationsRequestBuilder); }
}
