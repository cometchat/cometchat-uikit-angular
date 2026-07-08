import {
  Component, Input, Output, EventEmitter, TemplateRef, ViewChild, ElementRef,
  ChangeDetectionStrategy, ChangeDetectorRef, OnInit, OnDestroy,
  inject, HostListener, signal, computed, booleanAttribute, DestroyRef,
} from '@angular/core';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatGroupEvents } from '../../events/CometChatGroupEvents';
import { CometChatPaginatedListComponent } from '../cometchat-paginated-list/cometchat-paginated-list.component';
import { CometChatGroupItemComponent } from '../cometchat-group-item/cometchat-group-item.component';
import { CometChatCheckboxComponent } from '../base-elements/cometchat-checkbox/cometchat-checkbox.component';
import { CometChatRadioButtonComponent } from '../base-elements/cometchat-radio-button/cometchat-radio-button.component';
import { CometChatSearchBarComponent } from '../base-elements/cometchat-search-bar/cometchat-search-bar.component';
import { CometChatErrorBoundaryComponent } from '../base-elements/cometchat-error-boundary/cometchat-error-boundary.component';
import { TranslatePipe } from '../../resources/CometChatLocalize/translate.pipe';
import { SelectionMode, States } from '../../Enums/Enums';
import { CometChatUIKitConstants } from '../../constants';
import { CometChatOption } from '../../modals/CometChatOption';
import { SelectionState } from '../../modals/SelectionState';
import { GroupsService } from '../../services/groups.service';
import { ChatStateService } from '../../services/chat-state.service';
import { CometChatTemplatesService } from '../../services/templates.service';
import { COMETCHAT_GLOBAL_CONFIG, GlobalConfig } from '../../services/global-config.service';
import { TypeAheadService } from '../../services/type-ahead.service';
import { LiveAnnouncerService } from '../../services/live-announcer.service';
import { CometChatLocalize } from '../../resources/CometChatLocalize/cometchat-localize';
import { handleListKeyDown, ListKeyboardHost } from '../../utils/list-keyboard-handler';
import { focusNextGroupItem, focusPreviousGroupItem, scrollGroupItemIntoView, focusGroupItemAtIndex } from './cometchat-groups.keyboard';
import { emitGroupSelectionChange, selectGroupRange, selectAllGroups, clearGroupSelection } from './cometchat-groups.selection';

@Component({
  selector: 'cometchat-groups',
  standalone: true,
  imports: [CommonModule, CometChatPaginatedListComponent, CometChatGroupItemComponent, CometChatCheckboxComponent, CometChatRadioButtonComponent, CometChatSearchBarComponent, CometChatErrorBoundaryComponent, TranslatePipe],
  templateUrl: './cometchat-groups.component.html',
  styleUrls: ['./cometchat-groups.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [GroupsService],
})
export class CometChatGroupsComponent implements OnInit, OnDestroy {
  private pendingTimers: ReturnType<typeof setTimeout>[] = [];
  readonly shimmerList = CometChatUIKitConstants.shimmerList;
  private cdr = inject(ChangeDetectorRef);
  private groupsService = inject(GroupsService);
  private chatStateService = inject(ChatStateService);
  private templatesService = inject(CometChatTemplatesService);
  private destroyRef = inject(DestroyRef);
  private typeAheadService = inject(TypeAheadService);
  private liveAnnouncer = inject(LiveAnnouncerService);
  private globalConfig: Partial<GlobalConfig> | null = inject(COMETCHAT_GLOBAL_CONFIG, { optional: true });

  @ViewChild('paginatedList') paginatedList?: CometChatPaginatedListComponent<CometChat.Group>;
  @ViewChild('listContainer') listContainer?: ElementRef<HTMLElement>;

  private hideGroupTypeExplicitlySet = signal(false);
  private showScrollbarExplicitlySet = signal(false);
  private hideErrorExplicitlySet = signal(false);
  private _hideGroupType = signal(false);
  private _showScrollbar = signal(false);
  private _hideError = signal(false);

  @Input({ transform: booleanAttribute }) hideSearch = false;
  @Input({ transform: booleanAttribute })
  set hideError(value: boolean) { this._hideError.set(value); this.hideErrorExplicitlySet.set(true); }
  get hideError(): boolean { return this._hideError(); }
  @Input({ transform: booleanAttribute })
  set hideGroupType(value: boolean) { this._hideGroupType.set(value); this.hideGroupTypeExplicitlySet.set(true); }
  get hideGroupType(): boolean { return this._hideGroupType(); }
  @Input({ transform: booleanAttribute })
  set showScrollbar(value: boolean) { this._showScrollbar.set(value); this.showScrollbarExplicitlySet.set(true); }
  get showScrollbar(): boolean { return this._showScrollbar(); }
  @Input({ transform: booleanAttribute }) disableDefaultContextMenu = true;

  effectiveHideGroupType = computed(() => {
    if (this.hideGroupTypeExplicitlySet()) return this._hideGroupType();
    return this.globalConfig?.hideGroupType ?? false;
  });
  effectiveShowScrollbar = computed(() => {
    if (this.showScrollbarExplicitlySet()) return this._showScrollbar();
    return this.globalConfig?.showScrollbar ?? false;
  });
  effectiveHideError = computed(() => {
    if (this.hideErrorExplicitlySet()) return this._hideError();
    return this.globalConfig?.hideError ?? false;
  });

  @Input() groupsRequestBuilder?: CometChat.GroupsRequestBuilder;
  @Input() searchRequestBuilder?: CometChat.GroupsRequestBuilder;
  @Input() activeGroup?: CometChat.Group;
  @Input() selectionMode: SelectionMode = SelectionMode.none;
  @Input() options?: (group: CometChat.Group) => CometChatOption[];
  @Input() headerView?: TemplateRef<any>;
  @Input() menuView?: TemplateRef<any>;
  @Input() loadingView?: TemplateRef<any>;
  @Input() emptyView?: TemplateRef<any>;
  @Input() errorView?: TemplateRef<any>;
  @Input() itemView?: TemplateRef<{ $implicit: CometChat.Group }>;
  @Input() leadingView?: TemplateRef<{ $implicit: CometChat.Group }>;
  @Input() titleView?: TemplateRef<{ $implicit: CometChat.Group }>;
  @Input() subtitleView?: TemplateRef<{ $implicit: CometChat.Group }>;
  @Input() trailingView?: TemplateRef<{ $implicit: CometChat.Group }>;
  @Input() listItemTemplate: TemplateRef<any> | null = null;
  @Input() emptyStateTemplate: TemplateRef<any> | null = null;
  @Input() errorStateTemplate: TemplateRef<any> | null = null;
  @Input() loadingStateTemplate: TemplateRef<any> | null = null;

  private get _gt() { return this.templatesService.getGroupTemplates(); }
  get effectiveItemView(): TemplateRef<any> | undefined { return this.listItemTemplate || this.itemView || this._gt.itemView; }
  get effectiveLeadingView(): TemplateRef<any> | undefined { return this.leadingView || this._gt.leadingView; }
  get effectiveTitleView(): TemplateRef<any> | undefined { return this.titleView || this._gt.titleView; }
  get effectiveSubtitleView(): TemplateRef<any> | undefined { return this.subtitleView || this._gt.subtitleView; }
  get effectiveTrailingView(): TemplateRef<any> | undefined { return this.trailingView || this._gt.trailingView; }
  get effectiveLoadingView(): TemplateRef<any> | undefined { return this.loadingStateTemplate || this.loadingView || this.templatesService.resolveTemplate(this._gt, 'loadingView'); }
  get effectiveEmptyView(): TemplateRef<any> | undefined { return this.emptyStateTemplate || this.emptyView || this.templatesService.resolveTemplate(this._gt, 'emptyView'); }
  get effectiveErrorView(): TemplateRef<any> | undefined { return this.errorStateTemplate || this.errorView || this.templatesService.resolveTemplate(this._gt, 'errorView'); }

  @Output() itemClick = new EventEmitter<CometChat.Group>();
  @Output() select = new EventEmitter<{ group: CometChat.Group; selected: boolean }>();
  @Output() error = new EventEmitter<CometChat.CometChatException>();
  @Output() selectionChange = new EventEmitter<SelectionState>();

  groupList: CometChat.Group[] = [];
  fetchState: States = States.loading;
  lastError: Error | null = null;
  searchText = '';
  selectedGroups = new Set<string>();
  focusedIndex = -1;
  lastSelectedIndex = -1;
  private initialLoadComplete = false;
  isFetchingMore = signal(false);
  hasMore = signal(true);
  readonly SelectionMode = SelectionMode;
  readonly States = States;
  private searchSubject$ = new Subject<string>();
  private isFirstFetch = true;

  constructor() {
    // Sync hasMore from service signal — picks up reconnect resets automatically.
    // Must be in constructor to ensure injection context for toObservable.
    toObservable(this.groupsService.hasMore)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(v => this.hasMore.set(v));
  }

  ngOnInit(): void {
    this.groupsService.setErrorCallback((error) => { this.lastError = error as unknown as Error; this.error.emit(error); });
    this.initializeGroupsManager();
    this.setupSearchDebouncing();
    this.setupGroupListeners();
    this.setupGroupEventSubscriptions();
    this.fetchNextAndAppendGroups();
  }

  ngOnDestroy(): void {
    this.pendingTimers.forEach(t => clearTimeout(t));
    this.pendingTimers = [];
    this.groupsService.cleanup();
  }

  private initializeGroupsManager(): void {
    this.groupsService.initialize({ searchText: this.searchText, groupsRequestBuilder: this.groupsRequestBuilder || null, searchRequestBuilder: this.searchRequestBuilder || null, groupsSearchText: '' });
    this.groupList = []; this.fetchState = States.loading; this.isFirstFetch = true; this.hasMore.set(true);
  }

  private setupSearchDebouncing(): void {
    this.searchSubject$.pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(searchText => this.handleSearchTextChange(searchText));
  }

  private setupGroupListeners(): void { this.groupsService.attachListeners(); }

  private setupGroupEventSubscriptions(): void {
    const d = this.destroyRef;
    CometChatGroupEvents.ccGroupCreated.pipe(takeUntilDestroyed(d)).subscribe((group: CometChat.Group) => { this.groupsService.prependGroup(group); this.syncStateFromService(); });
    CometChatGroupEvents.ccGroupDeleted.pipe(takeUntilDestroyed(d)).subscribe((group: CometChat.Group) => { this.groupsService.removeGroup(group.getGuid()); this.selectedGroups.delete(group.getGuid()); this.syncStateFromService(); });
    CometChatGroupEvents.ccGroupLeft.pipe(takeUntilDestroyed(d)).subscribe((data: { userLeft: CometChat.User; leftGroup: CometChat.Group; message: CometChat.Action }) => {
      if (data.leftGroup.getType() === 'private') { this.groupsService.removeGroup(data.leftGroup.getGuid()); this.selectedGroups.delete(data.leftGroup.getGuid()); }
      else { this.groupsService.updateGroup(data.leftGroup); }
      this.syncStateFromService();
    });
    CometChatGroupEvents.ccGroupMemberJoined.pipe(takeUntilDestroyed(d)).subscribe((data: { joinedUser: CometChat.User; joinedGroup: CometChat.Group }) => { this.groupsService.updateGroup(data.joinedGroup); this.syncStateFromService(); });
    CometChatGroupEvents.ccGroupMemberKicked.pipe(takeUntilDestroyed(d)).subscribe((data: { kickedUser: CometChat.User; kickedBy: CometChat.User; kickedFrom: CometChat.Group; message: CometChat.Action }) => { this.groupsService.updateGroup(data.kickedFrom); this.syncStateFromService(); });
    CometChatGroupEvents.ccGroupMemberBanned.pipe(takeUntilDestroyed(d)).subscribe((data: { kickedUser: CometChat.User; kickedBy: CometChat.User; kickedFrom: CometChat.Group; message: CometChat.Action }) => { this.groupsService.updateGroup(data.kickedFrom); this.syncStateFromService(); });
    CometChatGroupEvents.ccGroupMemberAdded.pipe(takeUntilDestroyed(d)).subscribe((data: { messages: CometChat.Action[]; usersAdded: CometChat.User[]; userAddedIn: CometChat.Group; userAddedBy: CometChat.User }) => { this.groupsService.updateGroup(data.userAddedIn); this.syncStateFromService(); });
    CometChatGroupEvents.ccOwnershipChanged.pipe(takeUntilDestroyed(d)).subscribe((data: { group: CometChat.Group; newOwner: CometChat.GroupMember }) => { this.groupsService.updateGroup(data.group); this.syncStateFromService(); });
  }

  private refreshGroupList(): void { this.groupList = []; this.initializeGroupsManager(); this.fetchNextAndAppendGroups(); }

  handleLoadMore(): void { if (this.isFetchingMore() || !this.hasMore()) return; this.fetchNextAndAppendGroups(); }

  fetchNextAndAppendGroups(): void {
    if (this.isFetchingMore() || !this.hasMore()) return;
    this.isFetchingMore.set(true);
    if (this.isFirstFetch) { this.fetchState = States.loading; this.cdr.detectChanges(); }
    this.groupsService.fetchNext()
      .then(() => { this.isFetchingMore.set(false); this.syncStateFromService(); this.isFirstFetch = false; if (!this.initialLoadComplete) { this.pendingTimers.push(setTimeout(() => { this.initialLoadComplete = true; }, 100)); } this.paginatedList?.loadComplete(); })
      .catch(() => { this.isFetchingMore.set(false); this.syncStateFromService(); this.paginatedList?.loadComplete(); });
  }

  private syncStateFromService(): void {
    this.groupList = this.groupsService.groups();
    this.fetchState = this.groupsService.fetchState();
    this.hasMore.set(this.groupsService.hasMore());
    if (this.fetchState !== States.error) this.lastError = null;
    this.cdr.markForCheck();
  }

  onSearch(searchText: string): void { this.searchSubject$.next(searchText); }

  private handleSearchTextChange(searchText: string): void {
    this.searchText = searchText; this.groupList = [];
    this.groupsService.search(searchText, { groupsRequestBuilder: this.groupsRequestBuilder || null, searchRequestBuilder: this.searchRequestBuilder || null });
    this.isFirstFetch = true; this.hasMore.set(true); this.fetchNextAndAppendGroups();
  }

  trackByGroup(_index: number, group: CometChat.Group): string { return group.getGuid(); }
  getMemberCountText(group: CometChat.Group): string { return group.getMembersCount() === 1 ? 'group_member' : 'group_members'; }
  getGroupType(group: CometChat.Group): string { return group.getType(); }

  handleGroupClick(group: CometChat.Group): void {
    if (this.itemClick.observed) { this.itemClick.emit(group); } else { this.chatStateService.setActiveGroup(group); }
  }

  handleSelectionChange(group: CometChat.Group, event?: Event): void {
    const guid = group.getGuid();
    const currentIndex = this.groupList.findIndex(g => g.getGuid() === guid);
    const isCurrentlySelected = this.selectedGroups.has(guid);
    if (this.selectionMode === SelectionMode.single) {
      this.selectedGroups.clear();
      if (!isCurrentlySelected) this.selectedGroups.add(guid);
      this.select.emit({ group, selected: !isCurrentlySelected });
      this.emitSelectionChange(guid);
    } else if (this.selectionMode === SelectionMode.multiple) {
      const isShiftClick = event instanceof MouseEvent && event.shiftKey;
      const lastIndex = this.lastSelectedIndex;
      if (isShiftClick && lastIndex >= 0 && currentIndex !== -1) {
        this.selectRange(lastIndex, currentIndex);
      } else {
        if (isCurrentlySelected) { this.selectedGroups.delete(guid); } else { this.selectedGroups.add(guid); }
        this.select.emit({ group, selected: !isCurrentlySelected });
        this.lastSelectedIndex = currentIndex;
        this.emitSelectionChange(guid);
      }
    }
    this.cdr.markForCheck();
  }

  private selectRange(startIndex: number, endIndex: number): void {
    this.lastSelectedIndex = selectGroupRange(this.groupList, startIndex, endIndex, this.selectedGroups, this.select, this.selectionChange, this.selectionMode);
  }

  handleSelectionControlChange(group: CometChat.Group, changeEvent: Event): void { this.handleSelectionChange(group, changeEvent); }

  private emitSelectionChange(lastSelectedId: string | null): void {
    emitGroupSelectionChange(this.selectionMode, this.selectedGroups, lastSelectedId, this.selectionChange);
  }

  selectAll(): void {
    if (this.selectionMode !== SelectionMode.multiple) return;
    this.focusedIndex = -1;
    selectAllGroups(this.groupList, this.selectedGroups, this.select, this.selectionChange, this.selectionMode);
    this.cdr.markForCheck();
  }

  clearSelection(): void {
    clearGroupSelection(this.groupList, this.selectedGroups, this.select, this.selectionChange, this.selectionMode);
    this.lastSelectedIndex = -1; this.cdr.markForCheck();
  }

  isGroupSelected(group: CometChat.Group): boolean { return this.selectedGroups.has(group.getGuid()); }

  isGroupActive(group: CometChat.Group): boolean {
    if (this.activeGroup) return group.getGuid() === this.activeGroup.getGuid();
    const serviceActiveGroup = this.chatStateService.getActiveGroup();
    return serviceActiveGroup ? group.getGuid() === serviceActiveGroup.getGuid() : false;
  }

  getOptionsForGroup(group: CometChat.Group): CometChatOption[] { return this.options ? this.options(group) : []; }
  handleOptionClick(option: CometChatOption, group: CometChat.Group): void { if (option.onClick) option.onClick(); }
  getGroupAriaLabel(group: CometChat.Group): string {
    const count = group.getMembersCount();
    return `${group.getName() || ''}, ${group.getType()} group, ${count} ${count === 1 ? 'member' : 'members'}`;
  }

  @HostListener('focus')
  handleListFocus(): void {
    if (this.focusedIndex === -1 && this.groupList.length > 0) { this.focusedIndex = 0; this.cdr.markForCheck(); this.scrollFocusedItemIntoView(); }
  }

  @HostListener('keydown', ['$event'])
  handleKeydown(event: KeyboardEvent): void { this.onGroupsKeyDown(event); }

  onGroupsKeyDown(event: KeyboardEvent): void {
    const host: ListKeyboardHost<CometChat.Group> = {
      itemList: this.groupList, fetchState: this.fetchState, selectionMode: this.selectionMode,
      focusedIndex: this.focusedIndex, componentClass: 'cometchat-groups', searchBarClass: 'cometchat-groups__search-bar',
      selectedCount: this.selectedGroups.size, cdr: this.cdr,
      clearSelection: () => this.clearSelection(),
      selectAll: () => this.selectAll(),
      handleSelectionChange: item => this.handleSelectionChange(item),
      selectRangeFromAnchor: index => this.selectRangeFromAnchor(index),
      extendSelectionTo: index => this.extendSelectionTo(index),
      focusNextItem: () => this.focusNextItem(),
      focusPreviousItem: () => this.focusPreviousItem(),
      selectFocusedItem: () => this.selectFocusedItem(),
      scrollFocusedItemIntoView: () => this.scrollFocusedItemIntoView(),
      focusItemAtIndex: index => this.focusItemAtIndex(index),
      handleEscapeKey: () => this.handleEscapeKey(),
      announceSelectionCount: () => this.announceSelectionCount(),
      announceSelectionCleared: () => this.announceSelectionCleared(),
      handleTypeAhead: (key, focusedIdx) => this.typeAheadService.handleCharacter(key, this.groupList, focusedIdx, { getSearchText: (group: CometChat.Group) => group.getName() || '' }),
    };
    handleListKeyDown(event, host);
    if (host.focusedIndex !== this.focusedIndex) this.focusedIndex = host.focusedIndex;
  }

  private extendSelectionTo(index: number): void {
    if (index < 0 || index >= this.groupList.length) return;
    const group = this.groupList[index]; const guid = group.getGuid();
    if (!this.selectedGroups.has(guid)) { this.selectedGroups.add(guid); this.select.emit({ group, selected: true }); this.emitSelectionChange(guid); }
  }

  private selectRangeFromAnchor(currentIndex: number): void {
    const anchorIndex = this.lastSelectedIndex;
    if (anchorIndex === -1) { if (currentIndex >= 0 && currentIndex < this.groupList.length) this.handleSelectionChange(this.groupList[currentIndex]); return; }
    this.selectRange(anchorIndex, currentIndex);
  }

  private focusItemAtIndex(index: number): void { focusGroupItemAtIndex(this.listContainer?.nativeElement, index, this.pendingTimers); }

  private announceSelectionCount(): void {
    const message = CometChatLocalize.getLocalizedString('accessibility_items_selected').replace('{count}', this.selectedGroups.size.toString());
    this.liveAnnouncer.announce(message, 'polite');
  }

  private announceSelectionCleared(): void {
    this.liveAnnouncer.announce(CometChatLocalize.getLocalizedString('accessibility_selection_cleared'), 'polite');
  }

  private focusNextItem(): void {
    this.focusedIndex = focusNextGroupItem(this.groupList, this.focusedIndex, this.cdr, () => this.scrollFocusedItemIntoView());
  }
  private focusPreviousItem(): void {
    this.focusedIndex = focusPreviousGroupItem(this.groupList, this.focusedIndex, this.cdr, () => this.scrollFocusedItemIntoView());
  }

  handleItemFocus(index: number): void { this.focusedIndex = index; this.cdr.markForCheck(); }

  private selectFocusedItem(): void {
    if (this.focusedIndex >= 0 && this.focusedIndex < this.groupList.length) {
      const group = this.groupList[this.focusedIndex];
      if (this.selectionMode !== SelectionMode.none) { this.handleSelectionChange(group); } else { this.handleGroupClick(group); }
    }
  }

  private handleEscapeKey(): void {
    if (this.searchText) { this.searchText = ''; this.searchSubject$.next(''); this.cdr.markForCheck(); return; }
    if (this.selectionMode !== SelectionMode.none && this.selectedGroups.size > 0) this.clearSelection();
    this.focusedIndex = -1; (document.activeElement as HTMLElement)?.blur(); this.cdr.markForCheck();
  }

  private scrollFocusedItemIntoView(): void {
    if (!this.initialLoadComplete) return;
    scrollGroupItemIntoView(this.listContainer?.nativeElement, this.focusedIndex, this.pendingTimers);
  }

  getTabIndex(index: number): number {
    if (this.focusedIndex === index) return 0;
    if (this.focusedIndex === -1 && index === 0) return 0;
    return -1;
  }

  handleFocusIn(event: FocusEvent, index: number): void {
    if (this.focusedIndex !== index) { this.focusedIndex = index; this.cdr.markForCheck(); }
  }

  handleMouseDown(event: MouseEvent): void { event.preventDefault(); }

  handleContainerClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const isOnItem = target.closest('.cometchat-group-item') !== null;
    const isOnSelectionControl = target.closest('cometchat-checkbox') !== null || target.closest('cometchat-radio-button') !== null;
    const isOnSearchBar = target.closest('cometchat-search-bar') !== null;
    if (!isOnItem && !isOnSelectionControl && !isOnSearchBar) { this.focusedIndex = -1; (document.activeElement as HTMLElement)?.blur(); this.cdr.markForCheck(); }
  }

  handleFocusInEvent(event: FocusEvent): void {
    const target = event.target as HTMLElement;
    if (!target) return;
    const groupItemDiv = target.classList.contains('cometchat-group-item') ? target : target.closest('.cometchat-group-item');
    if (!groupItemDiv) return;
    const wrapper = groupItemDiv.closest('.cometchat-groups__list-item-wrapper');
    if (!wrapper) return;
    const paginatedListItem = wrapper.closest('.cometchat-paginated-list__item');
    if (!paginatedListItem) return;
    const itemsContainer = paginatedListItem.parentElement;
    if (!itemsContainer || !itemsContainer.classList.contains('cometchat-paginated-list__items')) return;
    const index = Array.from(itemsContainer.children).indexOf(paginatedListItem);
    if (index !== -1 && this.focusedIndex !== index) { this.focusedIndex = index; this.cdr.markForCheck(); }
  }

  handleRetryClick(): void {
    this.lastError = null; this.fetchState = States.loading; this.cdr.markForCheck();
    this.initializeGroupsManager(); this.fetchNextAndAppendGroups();
  }
}
