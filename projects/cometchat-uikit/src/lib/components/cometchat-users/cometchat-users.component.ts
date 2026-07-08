import {
  Component, Input, Output, EventEmitter, TemplateRef, ViewChild, ElementRef,
  ChangeDetectionStrategy, ChangeDetectorRef, OnInit, OnDestroy,
  inject, HostListener, signal, computed, DestroyRef, booleanAttribute,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatUserEvents } from '../../events/CometChatUserEvents';
import { CometChatPaginatedListComponent } from '../cometchat-paginated-list/cometchat-paginated-list.component';
import { CometChatUserItemComponent } from '../cometchat-user-item/cometchat-user-item.component';
import { CometChatAvatarComponent } from '../base-elements/cometchat-avatar/cometchat-avatar.component';
import { CometChatCheckboxComponent } from '../base-elements/cometchat-checkbox/cometchat-checkbox.component';
import { CometChatRadioButtonComponent } from '../base-elements/cometchat-radio-button/cometchat-radio-button.component';
import { CometChatSearchBarComponent } from '../base-elements/cometchat-search-bar/cometchat-search-bar.component';
import { CometChatErrorBoundaryComponent } from '../base-elements/cometchat-error-boundary/cometchat-error-boundary.component';
import { TranslatePipe } from '../../resources/CometChatLocalize/translate.pipe';
import { SelectionMode, States } from '../../Enums/Enums';
import { CometChatUIKitConstants } from '../../constants';
import { CometChatOption } from '../../modals/CometChatOption';
import { SelectionState } from '../../modals/SelectionState';
import { UsersService } from '../../services/users.service';
import { ChatStateService } from '../../services/chat-state.service';
import { CometChatTemplatesService } from '../../services/templates.service';
import { COMETCHAT_GLOBAL_CONFIG, GlobalConfig } from '../../services/global-config.service';
import { TypeAheadService } from '../../services/type-ahead.service';
import { LiveAnnouncerService } from '../../services/live-announcer.service';
import { CometChatLogger } from '../../utils/CometChatLogger';
import { CometChatLocalize } from '../../resources/CometChatLocalize/cometchat-localize';
import { handleListKeyDown, ListKeyboardHost } from '../../utils/list-keyboard-handler';
import { focusNextUserItem, focusPreviousUserItem, scrollUserItemIntoView, focusUserItemAtIndex } from './cometchat-users.keyboard';
import { emitUserSelectionChange, selectUserRange, selectAllUsers, clearUserSelection } from './cometchat-users.selection';

@Component({
  selector: 'cometchat-users',
  standalone: true,
  imports: [CommonModule, CometChatPaginatedListComponent, CometChatUserItemComponent, CometChatAvatarComponent, CometChatCheckboxComponent, CometChatRadioButtonComponent, CometChatSearchBarComponent, CometChatErrorBoundaryComponent, TranslatePipe],
  templateUrl: './cometchat-users.component.html',
  styleUrls: ['./cometchat-users.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [UsersService],
})
export class CometChatUsersComponent implements OnInit, OnDestroy {
  private pendingTimers: ReturnType<typeof setTimeout>[] = [];
  readonly shimmerList = CometChatUIKitConstants.shimmerList;
  private cdr = inject(ChangeDetectorRef);
  private usersService = inject(UsersService);
  private chatStateService = inject(ChatStateService);
  private templatesService = inject(CometChatTemplatesService);
  private destroyRef = inject(DestroyRef);
  private typeAheadService = inject(TypeAheadService);
  private liveAnnouncer = inject(LiveAnnouncerService);
  private globalConfig: Partial<GlobalConfig> | null = inject(COMETCHAT_GLOBAL_CONFIG, { optional: true });

  @ViewChild('paginatedList') paginatedList?: CometChatPaginatedListComponent<CometChat.User>;
  @ViewChild('listContainer') listContainer?: ElementRef<HTMLElement>;

  private hideUserStatusExplicitlySet = signal(false);
  private showScrollbarExplicitlySet = signal(false);
  private hideErrorExplicitlySet = signal(false);
  private _hideUserStatus = signal(false);
  private _showScrollbar = signal(false);
  private _hideError = signal(false);

  @Input({ transform: booleanAttribute }) hideSearch = false;
  @Input({ transform: booleanAttribute }) showSectionHeader = true;
  @Input({ transform: booleanAttribute })
  set hideError(value: boolean) { this._hideError.set(value); this.hideErrorExplicitlySet.set(true); }
  get hideError(): boolean { return this._hideError(); }
  @Input({ transform: booleanAttribute }) disableLoadingState = false;
  @Input({ transform: booleanAttribute })
  set hideUserStatus(value: boolean) { this._hideUserStatus.set(value); this.hideUserStatusExplicitlySet.set(true); }
  get hideUserStatus(): boolean { return this._hideUserStatus(); }
  @Input({ transform: booleanAttribute })
  set showScrollbar(value: boolean) { this._showScrollbar.set(value); this.showScrollbarExplicitlySet.set(true); }
  get showScrollbar(): boolean { return this._showScrollbar(); }
  @Input({ transform: booleanAttribute }) showSelectedUsersPreview = false;
  @Input({ transform: booleanAttribute }) disableDefaultContextMenu = true;

  effectiveHideUserStatus = computed(() => {
    if (this.hideUserStatusExplicitlySet()) return this._hideUserStatus();
    return this.globalConfig?.hideUserStatus ?? false;
  });
  effectiveShowScrollbar = computed(() => {
    if (this.showScrollbarExplicitlySet()) return this._showScrollbar();
    return this.globalConfig?.showScrollbar ?? false;
  });
  effectiveHideError = computed(() => {
    if (this.hideErrorExplicitlySet()) return this._hideError();
    return this.globalConfig?.hideError ?? false;
  });

  @Input() usersRequestBuilder?: CometChat.UsersRequestBuilder;
  @Input() searchRequestBuilder?: CometChat.UsersRequestBuilder;
  @Input() searchKeyword = '';
  @Input() sectionHeaderKey: keyof CometChat.User = 'getName';
  @Input() activeUser?: CometChat.User;
  @Input() selectionMode: SelectionMode = SelectionMode.none;
  @Input() options?: (user: CometChat.User) => CometChatOption[];
  @Input() headerView?: TemplateRef<any>;
  @Input() menuView?: TemplateRef<any>;
  @Input() loadingView?: TemplateRef<any>;
  @Input() emptyView?: TemplateRef<any>;
  @Input() errorView?: TemplateRef<any>;
  @Input() itemView?: TemplateRef<{ $implicit: CometChat.User }>;
  @Input() leadingView?: TemplateRef<{ $implicit: CometChat.User }>;
  @Input() titleView?: TemplateRef<{ $implicit: CometChat.User }>;
  @Input() subtitleView?: TemplateRef<{ $implicit: CometChat.User }>;
  @Input() trailingView?: TemplateRef<{ $implicit: CometChat.User }>;
  @Input() listItemTemplate: TemplateRef<any> | null = null;
  @Input() emptyStateTemplate: TemplateRef<any> | null = null;
  @Input() errorStateTemplate: TemplateRef<any> | null = null;
  @Input() loadingStateTemplate: TemplateRef<any> | null = null;

  private get _ut() { return this.templatesService.getUserTemplates(); }
  get effectiveItemView(): TemplateRef<any> | undefined { return this.listItemTemplate || this.itemView || this._ut.itemView; }
  get effectiveLeadingView(): TemplateRef<any> | undefined { return this.leadingView || this._ut.leadingView; }
  get effectiveTitleView(): TemplateRef<any> | undefined { return this.titleView || this._ut.titleView; }
  get effectiveSubtitleView(): TemplateRef<any> | undefined { return this.subtitleView || this._ut.subtitleView; }
  get effectiveTrailingView(): TemplateRef<any> | undefined { return this.trailingView || this._ut.trailingView; }
  get effectiveLoadingView(): TemplateRef<any> | undefined { return this.loadingStateTemplate || this.loadingView || this.templatesService.resolveTemplate(this._ut, 'loadingView'); }
  get effectiveEmptyView(): TemplateRef<any> | undefined { return this.emptyStateTemplate || this.emptyView || this.templatesService.resolveTemplate(this._ut, 'emptyView'); }
  get effectiveErrorView(): TemplateRef<any> | undefined { return this.errorStateTemplate || this.errorView || this.templatesService.resolveTemplate(this._ut, 'errorView'); }

  @Output() itemClick = new EventEmitter<CometChat.User>();
  @Output() select = new EventEmitter<{ user: CometChat.User; selected: boolean }>();
  @Output() error = new EventEmitter<CometChat.CometChatException>();
  @Output() empty = new EventEmitter<void>();
  @Output() selectionChange = new EventEmitter<SelectionState>();

  userList: CometChat.User[] = [];
  fetchState: States = States.loading;
  lastError: Error | null = null;
  searchText = '';
  selectedUsers = new Set<string>();
  selectedUsersMap = new Map<string, CometChat.User>();
  focusedIndex = -1;
  lastClickedIndex: number | null = null;
  lastClickedUserUid: string | null = null;
  isFetchingMore = signal(false);
  hasMore = signal(true);
  readonly SelectionMode = SelectionMode;
  readonly States = States;
  private searchSubject$ = new Subject<string>();
  private isFirstFetch = true;
  private initialLoadComplete = false;
  private userListenerId = `users_component_${Date.now()}`;

  constructor() {
    // Sync hasMore from service signal — picks up reconnect resets automatically.
    // Must be in constructor to ensure injection context for toObservable.
    toObservable(this.usersService.hasMore)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(v => this.hasMore.set(v));
  }

  ngOnInit(): void {
    this.usersService.setErrorCallback((error) => { this.lastError = error as unknown as Error; this.error.emit(error); });
    this.initializeUsersManager(); this.setupSearchDebouncing(); this.setupUserListener();
    this.setupUserEventSubscriptions(); this.fetchNextAndAppendUsers();
  }
  ngOnDestroy(): void { this.pendingTimers.forEach(t => clearTimeout(t)); this.pendingTimers = []; this.removeUserListener(); this.usersService.cleanup(); }

  private initializeUsersManager(): void {
    const usersSearchText = this.searchKeyword || '';
    this.usersService.initialize({ searchText: this.searchText || usersSearchText, usersRequestBuilder: this.usersRequestBuilder || null, searchRequestBuilder: this.searchRequestBuilder || null, usersSearchText });
    this.userList = []; this.fetchState = States.loading; this.isFirstFetch = true; this.hasMore.set(true);
  }

  private setupSearchDebouncing(): void {
    this.searchSubject$.pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(searchText => this.handleSearchTextChange(searchText));
  }

  private setupUserListener(): void {
    try { CometChat.addUserListener(this.userListenerId, new CometChat.UserListener({ onUserOnline: (u: CometChat.User) => this.updateUser(u), onUserOffline: (u: CometChat.User) => this.updateUser(u) })); }
    catch (error) { CometChatLogger.error('CometChatUsers', 'Error setting up user listener:', error); }
  }
  private removeUserListener(): void {
    try { CometChat.removeUserListener(this.userListenerId); } catch (error) { CometChatLogger.error('CometChatUsers', 'Error removing user listener:', error); }
  }

  private setupUserEventSubscriptions(): void {
    CometChatUserEvents.ccUserBlocked.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((user: CometChat.User) => this.updateUser(user));
    CometChatUserEvents.ccUserUnblocked.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((user: CometChat.User) => this.updateUser(user));
  }

  private updateUser(user: CometChat.User): void { this.usersService.updateUser(user); this.syncStateFromService(); }
  private refreshUserList(): void { this.userList = []; this.initializeUsersManager(); this.fetchNextAndAppendUsers(); }

  fetchNextAndAppendUsers(): void {
    if (this.isFetchingMore() || !this.hasMore()) return;
    this.isFetchingMore.set(true);
    const isFirstFetch = this.isFirstFetch;
    if (isFirstFetch && !this.disableLoadingState) { this.fetchState = States.loading; this.cdr.detectChanges(); }
    this.usersService.fetchNext()
      .then(() => {
        this.isFetchingMore.set(false); this.syncStateFromService();
        if (isFirstFetch && this.usersService.fetchState() === States.empty) this.empty.emit();
        this.isFirstFetch = false;
        if (!this.initialLoadComplete) this.pendingTimers.push(setTimeout(() => { this.initialLoadComplete = true; }, 100));
        this.paginatedList?.loadComplete();
      })
      .catch(() => { this.isFetchingMore.set(false); this.syncStateFromService(); this.paginatedList?.loadComplete(); });
  }

  handleLoadMore(): void { if (this.isFetchingMore() || !this.hasMore()) return; this.fetchNextAndAppendUsers(); }

  private syncStateFromService(): void {
    this.userList = this.usersService.users(); this.fetchState = this.usersService.fetchState();
    this.hasMore.set(this.usersService.hasMore());
    if (this.fetchState !== States.error) this.lastError = null;
    this.cdr.markForCheck();
  }

  onSearch(searchText: string): void { this.searchSubject$.next(searchText); }

  private handleSearchTextChange(searchText: string): void {
    this.searchText = searchText; this.userList = [];
    this.usersService.search(searchText, { usersRequestBuilder: this.usersRequestBuilder || null, searchRequestBuilder: this.searchRequestBuilder || null, usersSearchText: this.searchKeyword || '' });
    this.isFirstFetch = true; this.hasMore.set(true); this.fetchNextAndAppendUsers();
  }

  trackByUser(_index: number, user: CometChat.User): string { return user.getUid(); }

  shouldShowSectionHeader(index: number): boolean {
    if (!this.showSectionHeader || !this.userList.length) return false;
    return index === 0 || this.getSectionHeaderValue(this.userList[index]) !== this.getSectionHeaderValue(this.userList[index - 1]);
  }
  getSectionHeaderValue(user: CometChat.User): string {
    try {
      let value: unknown;
      const key = this.sectionHeaderKey;
      if (key && key in user && typeof (user as any)[key] === 'function') {
        value = (user as any)[key]();
      } else {
        value = user.getName();
      }
      return (value && typeof value === 'string') ? value.charAt(0).toUpperCase() : '#';
    } catch { return '#'; }
  }

  handleUserClick(user: CometChat.User): void {
    if (this.itemClick.observed) { this.itemClick.emit(user); } else { this.chatStateService.setActiveUser(user); }
  }

  handleSelectionChange(user: CometChat.User, event?: Event): void {
    const uid = user.getUid();
    const currentIndex = this.userList.findIndex(u => u.getUid() === uid);
    const isCurrentlySelected = this.selectedUsers.has(uid);
    if (this.selectionMode === SelectionMode.single) {
      this.selectedUsers.clear(); this.selectedUsersMap.clear();
      if (!isCurrentlySelected) { this.selectedUsers.add(uid); this.selectedUsersMap.set(uid, user); }
      this.select.emit({ user, selected: !isCurrentlySelected }); this.emitSelectionChange(uid);
    } else if (this.selectionMode === SelectionMode.multiple) {
      if (event instanceof MouseEvent && event.shiftKey && this.lastClickedIndex !== null && this.lastClickedUserUid !== null) {
        this.handleShiftClickSelection(currentIndex, isCurrentlySelected);
      } else {
        if (isCurrentlySelected) { this.selectedUsers.delete(uid); this.selectedUsersMap.delete(uid); }
        else { this.selectedUsers.add(uid); this.selectedUsersMap.set(uid, user); }
        this.select.emit({ user, selected: !isCurrentlySelected });
        this.lastClickedIndex = currentIndex; this.lastClickedUserUid = uid; this.emitSelectionChange(uid);
      }
    }
    this.cdr.markForCheck();
  }

  private handleShiftClickSelection(clickedIndex: number, shouldDeselect: boolean): void {
    if (this.lastClickedIndex === null) return;
    const [start, end] = [Math.min(this.lastClickedIndex, clickedIndex), Math.max(this.lastClickedIndex, clickedIndex)];
    const clickedUser = this.userList[clickedIndex]; const clickedUid = clickedUser?.getUid() ?? null;
    for (let i = start; i <= end; i++) {
      const u = this.userList[i]; if (!u) continue; const uUid = u.getUid();
      if (shouldDeselect && this.selectedUsers.has(uUid)) { this.selectedUsers.delete(uUid); this.selectedUsersMap.delete(uUid); this.select.emit({ user: u, selected: false }); }
      else if (!shouldDeselect && !this.selectedUsers.has(uUid)) { this.selectedUsers.add(uUid); this.selectedUsersMap.set(uUid, u); this.select.emit({ user: u, selected: true }); }
    }
    this.emitSelectionChange(clickedUid); this.lastClickedIndex = clickedIndex; this.lastClickedUserUid = clickedUid;
  }

  handleSelectionControlChange(user: CometChat.User, changeEvent: Event): void { this.handleSelectionChange(user, changeEvent); }

  removeSelectedUser(user: CometChat.User): void {
    const uid = user.getUid();
    this.selectedUsers.delete(uid); this.selectedUsersMap.delete(uid);
    this.select.emit({ user, selected: false }); this.emitSelectionChange(uid); this.cdr.markForCheck();
  }

  private emitSelectionChange(lastSelectedId: string | null): void {
    emitUserSelectionChange(this.selectionMode, this.selectedUsers, lastSelectedId, this.selectionChange);
  }

  selectAll(): void {
    if (this.selectionMode !== SelectionMode.multiple) return;
    this.focusedIndex = -1;
    this.userList.forEach(user => { const uid = user.getUid(); if (!this.selectedUsers.has(uid)) { this.selectedUsers.add(uid); this.selectedUsersMap.set(uid, user); this.select.emit({ user, selected: true }); } });
    this.emitSelectionChange(null); this.cdr.markForCheck();
  }

  clearSelection(): void {
    this.selectedUsersMap.forEach((user) => this.select.emit({ user, selected: false }));
    this.selectedUsers.clear(); this.selectedUsersMap.clear(); this.lastClickedIndex = null; this.lastClickedUserUid = null;
    this.emitSelectionChange(null); this.cdr.markForCheck();
  }

  isUserSelected(user: CometChat.User): boolean { return this.selectedUsers.has(user.getUid()); }
  isUserActive(user: CometChat.User): boolean {
    if (this.activeUser) return user.getUid() === this.activeUser.getUid();
    const s = this.chatStateService.getActiveUser(); return s ? user.getUid() === s.getUid() : false;
  }
  getSelectedUsersArray(): CometChat.User[] { return Array.from(this.selectedUsersMap.values()); }
  getOptionsForUser(user: CometChat.User): CometChatOption[] { return this.options ? this.options(user) : []; }
  handleOptionClick(option: CometChatOption, _user: CometChat.User): void { if (option.onClick) option.onClick(); }
  getUserAriaLabel(user: CometChat.User): string { const n = user.getName() || ''; const s = user.getStatus(); return (this.hideUserStatus || !s) ? n : `${n}, ${s}`; }
  trackBySelectedUser(_index: number, entry: { key: string; value: CometChat.User }): string { return entry.key; }

  @HostListener('focus')
  handleListFocus(): void {
    if (this.focusedIndex === -1 && this.userList.length > 0) { this.focusedIndex = 0; this.cdr.markForCheck(); this.scrollFocusedItemIntoView(); }
  }

  @HostListener('keydown', ['$event'])
  handleKeydown(event: KeyboardEvent): void { this.onUsersKeyDown(event); }

  onUsersKeyDown(event: KeyboardEvent): void {
    const host: ListKeyboardHost<CometChat.User> = {
      itemList: this.userList, fetchState: this.fetchState, selectionMode: this.selectionMode,
      focusedIndex: this.focusedIndex, componentClass: 'cometchat-users', searchBarClass: 'cometchat-users__search-bar',
      selectedCount: this.selectedUsers.size, cdr: this.cdr,
      clearSelection: () => this.clearSelection(), selectAll: () => this.selectAll(),
      handleSelectionChange: item => this.handleSelectionChange(item),
      selectRangeFromAnchor: index => this.selectRangeFromAnchor(index),
      extendSelectionTo: index => this.extendSelectionTo(index),
      focusNextItem: () => this.focusNextItem(), focusPreviousItem: () => this.focusPreviousItem(),
      selectFocusedItem: () => this.selectFocusedItem(), scrollFocusedItemIntoView: () => this.scrollFocusedItemIntoView(),
      focusItemAtIndex: index => this.focusItemAtIndex(index), handleEscapeKey: () => this.handleEscapeKey(),
      announceSelectionCount: () => this.announceSelectionCount(), announceSelectionCleared: () => this.announceSelectionCleared(),
      handleTypeAhead: (key, focusedIdx) => this.typeAheadService.handleCharacter(key, this.userList, focusedIdx, { getSearchText: (user: CometChat.User) => user.getName() || '' }),
    };
    handleListKeyDown(event, host);
    if (host.focusedIndex !== this.focusedIndex) this.focusedIndex = host.focusedIndex;
  }

  private extendSelectionTo(index: number): void {
    if (index < 0 || index >= this.userList.length) return;
    const user = this.userList[index]; const uid = user.getUid();
    if (!this.selectedUsers.has(uid)) { this.selectedUsers.add(uid); this.selectedUsersMap.set(uid, user); this.select.emit({ user, selected: true }); }
    this.lastClickedIndex = index; this.lastClickedUserUid = uid; this.emitSelectionChange(uid); this.cdr.markForCheck();
  }

  private selectRangeFromAnchor(currentIndex: number): void {
    const start = Math.min(this.lastClickedIndex ?? currentIndex, currentIndex);
    const end = Math.max(this.lastClickedIndex ?? currentIndex, currentIndex);
    for (let i = start; i <= end; i++) { if (i >= 0 && i < this.userList.length) { const user = this.userList[i]; const uid = user.getUid(); if (!this.selectedUsers.has(uid)) { this.selectedUsers.add(uid); this.selectedUsersMap.set(uid, user); this.select.emit({ user, selected: true }); } } }
    if (currentIndex >= 0 && currentIndex < this.userList.length) this.emitSelectionChange(this.userList[currentIndex].getUid());
    this.cdr.markForCheck();
  }

  private announceSelectionCount(): void { const c = this.selectedUsers.size; if (c > 0) this.liveAnnouncer.announce(CometChatLocalize.getLocalizedString('accessibility_items_selected').replace('{count}', c.toString()), 'polite'); }
  private announceSelectionCleared(): void { this.liveAnnouncer.announce(CometChatLocalize.getLocalizedString('accessibility_selection_cleared'), 'polite'); }

  private focusNextItem(): void {
    if (!this.userList.length) return;
    const n = this.userList.length;
    this.focusedIndex = this.focusedIndex === -1 ? 0 : (this.focusedIndex + 1) % n;
    this.cdr.markForCheck(); this.scrollFocusedItemIntoView();
  }

  private focusPreviousItem(): void {
    if (!this.userList.length) return;
    const n = this.userList.length;
    this.focusedIndex = this.focusedIndex === -1 ? n - 1 : (this.focusedIndex - 1 + n) % n;
    this.cdr.markForCheck(); this.scrollFocusedItemIntoView();
  }

  private scrollFocusedItemIntoView(): void {
    if (!this.initialLoadComplete) return;
    scrollUserItemIntoView(this.listContainer?.nativeElement, this.focusedIndex, this.pendingTimers);
  }

  handleItemFocus(index: number): void { this.focusedIndex = index; this.cdr.markForCheck(); }
  private selectFocusedItem(): void {
    if (this.focusedIndex >= 0 && this.focusedIndex < this.userList.length) {
      const user = this.userList[this.focusedIndex];
      if (this.selectionMode !== SelectionMode.none) { this.handleSelectionChange(user); } else { this.handleUserClick(user); }
    }
  }
  private handleEscapeKey(): void {
    if (this.searchText) { this.searchText = ''; this.searchSubject$.next(''); this.cdr.markForCheck(); return; }
    if (this.selectionMode !== SelectionMode.none && this.selectedUsers.size > 0) this.clearSelection();
    this.focusedIndex = -1; (document.activeElement as HTMLElement)?.blur(); this.cdr.markForCheck();
  }
  private focusItemAtIndex(index: number): void { focusUserItemAtIndex(this.listContainer?.nativeElement, index, this.pendingTimers); }
  getTabIndex(index: number): number { return this.focusedIndex === index ? 0 : (this.focusedIndex === -1 && index === 0 ? 0 : -1); }
  handleMouseDown(event: MouseEvent): void { event.preventDefault(); }
  handleContainerClick(event: MouseEvent): void {
    const t = event.target as HTMLElement;
    if (!t.closest('.cometchat-user-item') && !t.closest('cometchat-checkbox') && !t.closest('cometchat-radio-button') && !t.closest('cometchat-search-bar')) {
      this.focusedIndex = -1; (document.activeElement as HTMLElement)?.blur(); this.cdr.markForCheck();
    }
  }
  handleRetryClick(): void { this.lastError = null; this.fetchState = States.loading; this.cdr.markForCheck(); this.initializeUsersManager(); this.fetchNextAndAppendUsers(); }
  handleFocusIn(event: FocusEvent): void {
    const target = event.target as HTMLElement; if (!target) return;
    const itemDiv = target.classList.contains('cometchat-user-item') ? target : target.closest('.cometchat-user-item'); if (!itemDiv) return;
    const paginatedListItem = itemDiv.closest('.cometchat-users__list-item-wrapper')?.closest('.cometchat-paginated-list__item'); if (!paginatedListItem) return;
    // O(1) lookup via data-index attribute instead of Array.from().indexOf()
    const indexAttr = (paginatedListItem as HTMLElement).dataset['index'];
    const index = indexAttr !== undefined ? parseInt(indexAttr, 10) : -1;
    if (index !== -1 && this.focusedIndex !== index) { this.focusedIndex = index; this.cdr.markForCheck(); }
  }
}
