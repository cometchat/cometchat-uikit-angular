import {
  Component, Input, Output, EventEmitter, TemplateRef, ViewChild, ElementRef,
  ChangeDetectionStrategy, ChangeDetectorRef, OnInit, OnDestroy,
  inject, HostListener, signal, computed, DestroyRef, booleanAttribute,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatGroupEvents, IGroupMemberKickedBanned, IGroupMemberScopeChanged, IGroupMemberAdded } from '../../events/CometChatGroupEvents';
import { CometChatPaginatedListComponent } from '../cometchat-paginated-list/cometchat-paginated-list.component';
import { CometChatGroupMemberItemComponent } from '../cometchat-group-member-item/cometchat-group-member-item.component';
import { CometChatChangeScopeComponent } from '../base-elements/cometchat-change-scope/cometchat-change-scope.component';
import { CometChatCheckboxComponent } from '../base-elements/cometchat-checkbox/cometchat-checkbox.component';
import { CometChatRadioButtonComponent } from '../base-elements/cometchat-radio-button/cometchat-radio-button.component';
import { CometChatSearchBarComponent } from '../base-elements/cometchat-search-bar/cometchat-search-bar.component';
import { CometChatErrorBoundaryComponent } from '../base-elements/cometchat-error-boundary/cometchat-error-boundary.component';
import { TranslatePipe } from '../../resources/CometChatLocalize/translate.pipe';
import { CometChatLocalize } from '../../resources/CometChatLocalize/cometchat-localize';
import { SelectionMode, States } from '../../Enums/Enums';
import { CometChatLogger } from '../../utils/CometChatLogger';
import { CometChatOption } from '../../modals/CometChatOption';
import { SelectionState } from '../../modals/SelectionState';
import { GroupMembersService } from '../../services/group-members.service';
import { CometChatTemplatesService } from '../../services/templates.service';
import { COMETCHAT_GLOBAL_CONFIG, GlobalConfig } from '../../services/global-config.service';
import { GroupMemberUtils } from '../../utils/GroupMemberUtils';
import { emitMemberSelectionChange, selectMemberRange, focusNextMemberItem, focusPreviousMemberItem, scrollMemberItemIntoView } from './cometchat-group-members.utils';
import { CometChatUIKitConstants } from '../../constants';

@Component({
  selector: 'cometchat-group-members',
  standalone: true,
  imports: [CommonModule, CometChatPaginatedListComponent, CometChatGroupMemberItemComponent, CometChatChangeScopeComponent, CometChatCheckboxComponent, CometChatRadioButtonComponent, CometChatSearchBarComponent, CometChatErrorBoundaryComponent, TranslatePipe],
  providers: [GroupMembersService],
  templateUrl: './cometchat-group-members.component.html',
  styleUrls: ['./cometchat-group-members.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CometChatGroupMembersComponent implements OnInit, OnDestroy {
  private pendingTimers: ReturnType<typeof setTimeout>[] = [];
  readonly shimmerList = CometChatUIKitConstants.shimmerList;
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);
  protected groupMembersService = inject(GroupMembersService);
  private templatesService = inject(CometChatTemplatesService);
  private globalConfig: Partial<GlobalConfig> | null = inject(COMETCHAT_GLOBAL_CONFIG, { optional: true });
  @ViewChild('paginatedList') paginatedList?: CometChatPaginatedListComponent<CometChat.GroupMember>;
  @ViewChild('listContainer') listContainer?: ElementRef<HTMLElement>;
  @ViewChild('changeScopeRef') changeScopeRef?: CometChatChangeScopeComponent;

  private showScrollbarExplicitlySet = signal(false);
  private hideErrorExplicitlySet = signal(false);
  private hideUserStatusExplicitlySet = signal(false);
  private _showScrollbar = signal(false);
  private _hideError = signal(false);
  private _hideUserStatus = signal(false);

  @Input() group!: CometChat.Group;

  @Input({ transform: booleanAttribute }) hideSearch = false;
  @Input({ transform: booleanAttribute })
  set hideError(value: boolean) { this._hideError.set(value); this.hideErrorExplicitlySet.set(true); }
  get hideError(): boolean { return this._hideError(); }
  @Input({ transform: booleanAttribute })
  set hideUserStatus(value: boolean) { this._hideUserStatus.set(value); this.hideUserStatusExplicitlySet.set(true); }
  get hideUserStatus(): boolean { return this._hideUserStatus(); }
  @Input({ transform: booleanAttribute }) hideKickMemberOption = false;
  @Input({ transform: booleanAttribute }) hideBanMemberOption = false;
  @Input({ transform: booleanAttribute }) hideScopeChangeOption = false;
  @Input({ transform: booleanAttribute }) disableLoadingState = false;
  @Input({ transform: booleanAttribute })
  set showScrollbar(value: boolean) { this._showScrollbar.set(value); this.showScrollbarExplicitlySet.set(true); }
  get showScrollbar(): boolean { return this._showScrollbar(); }
  @Input({ transform: booleanAttribute }) disableDefaultContextMenu = true;

  effectiveShowScrollbar = computed(() => {
    if (this.showScrollbarExplicitlySet()) return this._showScrollbar();
    return this.globalConfig?.showScrollbar ?? false;
  });
  effectiveHideError = computed(() => {
    if (this.hideErrorExplicitlySet()) return this._hideError();
    return this.globalConfig?.hideError ?? false;
  });
  effectiveHideUserStatus = computed(() => {
    if (this.hideUserStatusExplicitlySet()) return this._hideUserStatus();
    return this.globalConfig?.hideUserStatus ?? false;
  });

  @Input() selectionMode: SelectionMode = SelectionMode.none;
  @Input() groupMemberRequestBuilder?: CometChat.GroupMembersRequestBuilder;
  @Input() searchRequestBuilder?: CometChat.GroupMembersRequestBuilder;
  @Input() searchKeyword = '';
  @Input() options?: (group: CometChat.Group, member: CometChat.GroupMember) => CometChatOption[];
  @Input() headerView?: TemplateRef<void>;
  @Input() menuView?: TemplateRef<any>;
  @Input() loadingView?: TemplateRef<void>;
  @Input() errorView?: TemplateRef<void>;
  @Input() emptyView?: TemplateRef<void>;
  @Input() itemView?: TemplateRef<{ $implicit: CometChat.GroupMember }>;
  @Input() subtitleView?: TemplateRef<{ $implicit: CometChat.GroupMember }>;
  @Input() trailingView?: TemplateRef<{ $implicit: CometChat.GroupMember }>;
  @Input() leadingView?: TemplateRef<{ $implicit: CometChat.GroupMember }>;
  @Input() titleView?: TemplateRef<{ $implicit: CometChat.GroupMember }>;
  @Input() listItemTemplate: TemplateRef<any> | null = null;
  @Input() emptyStateTemplate: TemplateRef<any> | null = null;
  @Input() errorStateTemplate: TemplateRef<any> | null = null;
  @Input() loadingStateTemplate: TemplateRef<any> | null = null;

  private get _gmt() { return this.templatesService.getGroupMemberTemplates(); }
  get effectiveItemView(): TemplateRef<any> | undefined { return this.listItemTemplate || this.itemView || this._gmt.itemView; }
  get effectiveLeadingView(): TemplateRef<any> | undefined { return this.leadingView || this._gmt.leadingView; }
  get effectiveTitleView(): TemplateRef<any> | undefined { return this.titleView || this._gmt.titleView; }
  get effectiveSubtitleView(): TemplateRef<any> | undefined { return this.subtitleView || this._gmt.subtitleView; }
  get effectiveTrailingView(): TemplateRef<any> | undefined { return this.trailingView || this._gmt.trailingView; }
  get effectiveLoadingView(): TemplateRef<any> | undefined { return this.loadingStateTemplate || this.loadingView || this.templatesService.resolveTemplate(this._gmt, 'loadingView'); }
  get effectiveEmptyView(): TemplateRef<any> | undefined { return this.emptyStateTemplate || this.emptyView || this.templatesService.resolveTemplate(this._gmt, 'emptyView'); }
  get effectiveErrorView(): TemplateRef<any> | undefined { return this.errorStateTemplate || this.errorView || this.templatesService.resolveTemplate(this._gmt, 'errorView'); }

  @Output() error = new EventEmitter<CometChat.CometChatException>();
  @Output() itemClick = new EventEmitter<CometChat.GroupMember>();
  @Output() selectionChange = new EventEmitter<SelectionState>();
  @Output() empty = new EventEmitter<void>();

  memberToChangeScope = signal<CometChat.GroupMember | null>(null);
  searchText = signal<string>('');
  focusedIndex = signal<number>(-1);
  loggedInUser = signal<CometChat.User | null>(null);
  lastError: Error | null = null;
  readonly SelectionMode = SelectionMode;
  readonly States = States;
  private searchSubject$ = new Subject<string>();
  private isFirstFetch = true;
  private selectedMembers = new Set<string>();
  private lastSelectedIndex = signal<number>(-1);

  ngOnInit(): void {
    this.fetchLoggedInUser();
    this.initializeService();
    this.setupSearchDebouncing();
    this.setupGroupEventSubscriptions();
  }

  ngOnDestroy(): void {
    this.pendingTimers.forEach(t => clearTimeout(t));
    this.pendingTimers = [];
    this.groupMembersService.cleanup();
    this.searchSubject$.complete();
  }

  private fetchLoggedInUser(): void {
    CometChat.getLoggedinUser()
      .then((user: CometChat.User | null) => { if (user) { this.loggedInUser.set(user); this.cdr.markForCheck(); } })
      .catch((err: unknown) => CometChatLogger.error('CometChatGroupMembers', 'Error fetching logged-in user:', err));
  }

  private initializeService(): void {
    if (!this.group) { CometChatLogger.warn('CometChatGroupMembers', 'No group input provided.'); return; }
    this.groupMembersService.cleanup();
    this.groupMembersService.setErrorCallback((err: CometChat.CometChatException) => {
      this.lastError = err as unknown as Error; this.error.emit(err); this.cdr.markForCheck();
    });
    this.groupMembersService.initialize(this.group, this.groupMemberRequestBuilder);
    this.groupMembersService.attachListeners(this.group.getGuid(), this.hideUserStatus);
  }

  private setupSearchDebouncing(): void {
    this.searchSubject$.pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((keyword: string) => this.handleSearchTextChange(keyword));
  }


  private setupGroupEventSubscriptions(): void {
    CometChatGroupEvents.ccGroupMemberKicked.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((event: IGroupMemberKickedBanned) => {
      if (event.kickedFrom?.getGuid() !== this.group?.getGuid()) return;
      this.groupMembersService.removeMember(event.kickedUser.getUid()); this.checkEmptyState(); this.cdr.markForCheck();
    });
    CometChatGroupEvents.ccGroupMemberBanned.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((event: IGroupMemberKickedBanned) => {
      if (event.kickedFrom?.getGuid() !== this.group?.getGuid()) return;
      this.groupMembersService.removeMember(event.kickedUser.getUid()); this.checkEmptyState(); this.cdr.markForCheck();
    });
    CometChatGroupEvents.ccGroupMemberScopeChanged.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((event: IGroupMemberScopeChanged) => {
      if (event.group?.getGuid() !== this.group?.getGuid()) return;
      this.groupMembersService.updateMemberScopeInList(event.updatedUser.getUid(), event.scopeChangedTo as CometChat.GroupMemberScope);
      this.cdr.markForCheck();
    });
    CometChatGroupEvents.ccGroupMemberAdded.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((event: IGroupMemberAdded) => {
      if (event.userAddedIn?.getGuid() !== this.group?.getGuid()) return;
      for (const user of event.usersAdded) {
        this.groupMembersService.appendMember(GroupMemberUtils.createParticipantGroupMember(user, event.userAddedIn));
      }
      this.cdr.markForCheck();
    });
  }

  onLoadMore(): void {
    this.groupMembersService.fetchNext()
      .then(() => {
        this.paginatedList?.loadComplete();
        if (this.isFirstFetch) { this.isFirstFetch = false; this.checkEmptyState(); }
        this.cdr.markForCheck();
      })
      .catch(() => { this.paginatedList?.loadComplete(); this.cdr.markForCheck(); });
  }

  onSearch(text: string): void { this.searchSubject$.next(text); }

  private handleSearchTextChange(keyword: string): void {
    this.searchText.set(keyword); this.isFirstFetch = true;
    this.groupMembersService.search(keyword, this.searchRequestBuilder); this.cdr.markForCheck();
  }

  onItemClick(member: CometChat.GroupMember): void {
    if (this.selectionMode !== SelectionMode.none) { this.handleSelectionChange(member); } else { this.itemClick.emit(member); }
  }

  handleContextMenu(event: MouseEvent): void { if (this.disableDefaultContextMenu) event.preventDefault(); }

  handleSelectionChange(member: CometChat.GroupMember, event?: Event): void {
    const uid = member.getUid();
    const currentIndex = this.groupMembersService.members().findIndex(m => m.getUid() === uid);
    if (this.selectionMode === SelectionMode.single) {
      const wasSelected = this.selectedMembers.has(uid);
      this.selectedMembers.clear();
      if (!wasSelected) this.selectedMembers.add(uid);
      this.emitSelectionChange(!wasSelected ? uid : null);
    } else if (this.selectionMode === SelectionMode.multiple) {
      const isShiftClick = event instanceof MouseEvent && event.shiftKey;
      const lastIndex = this.lastSelectedIndex();
      if (isShiftClick && lastIndex >= 0 && currentIndex !== -1) {
        this.selectRange(lastIndex, currentIndex);
      } else {
        const isSelected = this.selectedMembers.has(uid);
        if (isSelected) { this.selectedMembers.delete(uid); } else { this.selectedMembers.add(uid); }
        this.lastSelectedIndex.set(currentIndex);
        this.emitSelectionChange(!isSelected ? uid : null);
      }
    }
    this.cdr.markForCheck();
  }

  private selectRange(startIndex: number, endIndex: number): void {
    this.lastSelectedIndex.set(selectMemberRange(this.groupMembersService.members(), startIndex, endIndex, this.selectedMembers, this.selectionChange, this.selectionMode));
  }

  private emitSelectionChange(lastSelectedId: string | null): void {
    emitMemberSelectionChange(this.selectionMode, this.selectedMembers, lastSelectedId, this.selectionChange);
  }

  handleSelectionControlChange(member: CometChat.GroupMember, event?: Event): void {
    event?.stopPropagation(); this.handleSelectionChange(member, event);
  }

  isMemberSelected(member: CometChat.GroupMember): boolean { return this.selectedMembers.has(member.getUid()); }

  selectAll(): void {
    if (this.selectionMode !== SelectionMode.multiple) return;
    this.groupMembersService.members().forEach(member => this.selectedMembers.add(member.getUid()));
    this.emitSelectionChange(null); this.cdr.markForCheck();
  }

  clearSelection(): void {
    this.selectedMembers.clear(); this.lastSelectedIndex.set(-1); this.emitSelectionChange(null); this.cdr.markForCheck();
  }

  handleActionOnGroupMember(option: CometChatOption, member: CometChat.GroupMember): void {
    if (!this.group) return;
    switch (option.id) {
      case CometChatUIKitConstants.GroupMemberOptions.kick:
        this.groupMembersService.kickMember(this.group, member).then(() => { this.checkEmptyState(); this.cdr.markForCheck(); }); break;
      case CometChatUIKitConstants.GroupMemberOptions.ban:
        this.groupMembersService.banMember(this.group, member).then(() => { this.checkEmptyState(); this.cdr.markForCheck(); }); break;
      case CometChatUIKitConstants.GroupMemberOptions.changeScope:
        this.memberToChangeScope.set(member); this.cdr.markForCheck(); break;
      default:
        if (option.onClick) option.onClick(); break;
    }
  }

  onOptionClick(option: CometChatOption, member: CometChat.GroupMember): void {
    if (option instanceof CometChatOption || (option as CometChatOption).id) this.handleActionOnGroupMember(option as CometChatOption, member);
  }

  getOptionsForMember(member: CometChat.GroupMember): CometChatOption[] | string {
    const user = this.loggedInUser();
    if (!user || !this.group) return member.getScope();
    if (this.options) {
      try { return this.options(this.group, member); } catch (err) {
        CometChatLogger.error('CometChatGroupMembers', 'Custom options function error:', err);
        this.error.emit(new CometChat.CometChatException({ code: 'CUSTOM_OPTIONS_ERROR', message: CometChatLocalize.getLocalizedString('group_members_custom_options_error'), details: String(err) }));
      }
    }
    return GroupMemberUtils.getViewMemberOptions(member, this.group, user.getUid(), { hideKickMemberOption: this.hideKickMemberOption, hideBanMemberOption: this.hideBanMemberOption, hideScopeChangeOption: this.hideScopeChangeOption });
  }

  hasActionOptions(optionsResult: CometChatOption[] | string): optionsResult is CometChatOption[] { return Array.isArray(optionsResult); }
  getAllowedScopes(member: CometChat.GroupMember): string[] {
    return this.group ? GroupMemberUtils.allowScopeChange(this.group, member) : [];
  }

  onScopeChanged(newScope: string): void {
    const member = this.memberToChangeScope();
    if (!member || !this.group) return;
    this.groupMembersService.updateMemberScope(this.group, member, newScope)
      .then(() => { this.changeScopeRef?.setSuccess(); this.memberToChangeScope.set(null); this.cdr.markForCheck(); })
      .catch(() => { this.changeScopeRef?.setError(); this.cdr.markForCheck(); });
  }

  onChangeScopeClose(): void { this.memberToChangeScope.set(null); this.cdr.markForCheck(); }

  @HostListener('focus')
  handleListFocus(): void {
    const members = this.groupMembersService.members();
    if (this.focusedIndex() === -1 && members.length > 0) { this.focusedIndex.set(0); this.cdr.markForCheck(); this.scrollFocusedItemIntoView(); }
  }

  @HostListener('keydown', ['$event'])
  handleKeydown(event: KeyboardEvent): void {
    const members = this.groupMembersService.members();
    if (members.length === 0 || this.groupMembersService.fetchState() !== States.loaded) return;
    const target = event.target as HTMLElement;
    if (!target.closest('.cometchat-group-members')) return;
    const isInSearchBar = target.closest('.cometchat-group-members__search-bar') !== null || target.tagName === 'INPUT';
    if (this.memberToChangeScope()) { if (event.key === 'Escape') { event.preventDefault(); this.onChangeScopeClose(); } return; }
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'a') {
      if (this.selectionMode === SelectionMode.multiple) { event.preventDefault(); this.clearSelection(); return; }
    }
    if ((event.ctrlKey || event.metaKey) && !event.shiftKey && event.key.toLowerCase() === 'a') {
      if (this.selectionMode === SelectionMode.multiple) { event.preventDefault(); this.selectAll(); return; }
    }
    switch (event.key) {
      case 'ArrowDown': if (!isInSearchBar) { event.preventDefault(); event.stopPropagation(); this.focusNextItem(); } break;
      case 'ArrowUp': if (!isInSearchBar) { event.preventDefault(); event.stopPropagation(); this.focusPreviousItem(); } break;
      case 'Enter': if (!isInSearchBar) { event.preventDefault(); this.selectFocusedItem(); } break;
      case ' ': if (!isInSearchBar && this.selectionMode === SelectionMode.multiple) { event.preventDefault(); this.toggleFocusedItemSelection(); } break;
      case 'Escape': event.preventDefault(); this.handleEscapeKey(); break;
    }
  }

  private focusNextItem(): void { focusNextMemberItem(this.groupMembersService.members().length, this.focusedIndex, this.cdr, () => this.scrollFocusedItemIntoView()); }
  private focusPreviousItem(): void { focusPreviousMemberItem(this.groupMembersService.members().length, this.focusedIndex, this.cdr, () => this.scrollFocusedItemIntoView()); }
  private scrollFocusedItemIntoView(): void { scrollMemberItemIntoView(this.listContainer?.nativeElement, this.focusedIndex(), this.pendingTimers); }

  private selectFocusedItem(): void {
    const members = this.groupMembersService.members();
    const idx = this.focusedIndex();
    if (idx >= 0 && idx < members.length) {
      if (this.selectionMode !== SelectionMode.none) { this.handleSelectionChange(members[idx]); } else { this.itemClick.emit(members[idx]); }
    }
  }

  private toggleFocusedItemSelection(): void {
    const members = this.groupMembersService.members(); const idx = this.focusedIndex();
    if (idx >= 0 && idx < members.length) this.handleSelectionChange(members[idx]);
  }

  private handleEscapeKey(): void {
    if (this.searchText()) { this.searchText.set(''); this.searchSubject$.next(''); this.cdr.markForCheck(); return; }
    if (this.selectionMode !== SelectionMode.none && this.selectedMembers.size > 0) this.clearSelection();
    this.focusedIndex.set(-1); (document.activeElement as HTMLElement)?.blur(); this.cdr.markForCheck();
  }

  handleItemFocus(index: number): void { this.focusedIndex.set(index); this.cdr.markForCheck(); }
  handleItemBlur(): void { this.cdr.markForCheck(); }

  handleItemKeydown(event: KeyboardEvent, member: CometChat.GroupMember, index: number): void {
    const target = event.target as HTMLElement;
    if (event.key === 'Enter' && target.classList.contains('cometchat-group-members__list-item-wrapper')) { event.preventDefault(); this.onItemClick(member); }
    if (event.key === ' ' && this.selectionMode === SelectionMode.multiple && target.classList.contains('cometchat-group-members__list-item-wrapper')) { event.preventDefault(); this.handleSelectionChange(member); }
  }

  getTabIndex(index: number): number {
    if (this.focusedIndex() === index) return 0;
    if (this.focusedIndex() === -1 && index === 0) return 0;
    return -1;
  }

  trackByMember(_index: number, member: CometChat.GroupMember): string { return member.getUid(); }
  getMemberAriaLabel(member: CometChat.GroupMember): string { return `${member.getName() || ''}, ${member.getScope() || ''}`; }
  private checkEmptyState(): void { if (this.groupMembersService.members().length === 0) this.empty.emit(); }

  handleContainerClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const isOnItem = target.closest('.cometchat-group-members__list-item-wrapper') !== null;
    const isOnSelectionControl = target.closest('cometchat-checkbox') !== null || target.closest('cometchat-radio-button') !== null;
    const isOnSearchBar = target.closest('cometchat-search-bar') !== null || target.closest('.cometchat-group-members__search-bar') !== null;
    if (!isOnItem && !isOnSelectionControl && !isOnSearchBar) { this.focusedIndex.set(-1); (document.activeElement as HTMLElement)?.blur(); this.cdr.markForCheck(); }
  }

  handleRetryClick(): void {
    if (!this.group) return;
    this.lastError = null; this.initializeService(); this.groupMembersService.fetchNext();
  }
}
