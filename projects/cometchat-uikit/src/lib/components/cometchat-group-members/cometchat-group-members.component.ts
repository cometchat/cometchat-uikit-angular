/**
 * CometChatGroupMembers Component
 *
 * Displays a paginated, searchable list of group members with real-time updates
 * and role-based action management. Supports kick, ban, and scope change operations.
 *
 * Features:
 * - Real-time member status and group event updates
 * - Permission-based context menus (kick, ban, change scope)
 * - Search with debounce
 * - Selection modes (none, single, multiple)
 * - Custom template projections for all sections
 * - Keyboard navigation and ARIA accessibility
 *
 * @module components/cometchat-group-members
 * @see Requirements 1.1-1.6, 2.1-2.4, 3.1-3.5, 5.1-5.8, 6.1-6.4, 7.1-7.4,
 *      8.1-8.7, 9.1-9.9, 11.1-11.4, 12.1-12.4, 13.1-13.3
 */
import {
  Component,
  Input,
  Output,
  EventEmitter,
  TemplateRef,
  ViewChild,
  ViewEncapsulation,
  ElementRef,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnInit,
  OnDestroy,
  inject,
  HostListener,
  signal,
  computed,
  DestroyRef,
  booleanAttribute,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { CometChat } from '@cometchat/chat-sdk-javascript';

// Event imports
import {
  CometChatGroupEvents,
  IGroupMemberKickedBanned,
  IGroupMemberScopeChanged,
  IGroupMemberAdded,
} from '../../events/CometChatGroupEvents';

// Component imports
import { CometChatPaginatedListComponent } from '../cometchat-paginated-list/cometchat-paginated-list.component';
import { CometChatGroupMemberItemComponent } from '../cometchat-group-member-item/cometchat-group-member-item.component';
import { CometChatChangeScopeComponent } from '../base-elements/cometchat-change-scope/cometchat-change-scope.component';
import { CometChatCheckboxComponent } from '../base-elements/cometchat-checkbox/cometchat-checkbox.component';
import { CometChatRadioButtonComponent } from '../base-elements/cometchat-radio-button/cometchat-radio-button.component';
import { CometChatSearchBarComponent } from '../base-elements/cometchat-search-bar/cometchat-search-bar.component';

// Resource imports
import { TranslatePipe } from '../../resources/CometChatLocalize/translate.pipe';
import { CometChatLocalize } from '../../resources/CometChatLocalize/cometchat-localize';

// Type imports
import { SelectionMode, States } from '../../Enums/Enums';
import { CometChatLogger } from '../../utils/CometChatLogger';
import { CometChatOption } from '../../modals/CometChatOption';
import { SelectionState } from '../../modals/SelectionState';

// Service import
import { GroupMembersService } from '../../services/group-members.service';
import { CometChatTemplatesService } from '../../services/templates.service';
import { COMETCHAT_GLOBAL_CONFIG, GlobalConfig } from '../../services/global-config.service';

// Utility imports
import { GroupMemberUtils } from '../../utils/GroupMemberUtils';

// Constants
import { CometChatUIKitConstants } from '../../constants';

/**
 * CometChatGroupMembers displays a scrollable, searchable list of group members
 * with real-time updates, permission-based actions, and extensive customization.
 *
 * @example
 * ```html
 * <!-- Basic usage -->
 * <cometchat-group-members
 *   [group]="activeGroup"
 *   (itemClick)="onMemberClick($event)"
 *   (error)="onError($event)">
 * </cometchat-group-members>
 *
 * <!-- With selection mode -->
 * <cometchat-group-members
 *   [group]="activeGroup"
 *   [selectionMode]="SelectionMode.multiple"
 *   (selectionChange)="onSelectionChange($event)">
 * </cometchat-group-members>
 * ```
 */
@Component({
  selector: 'cometchat-group-members',
  standalone: true,
  imports: [
    CommonModule,
    CometChatPaginatedListComponent,
    CometChatGroupMemberItemComponent,
    CometChatChangeScopeComponent,
    CometChatCheckboxComponent,
    CometChatRadioButtonComponent,
    CometChatSearchBarComponent,
    TranslatePipe,
  ],
  providers: [GroupMembersService],
  templateUrl: './cometchat-group-members.component.html',
  styleUrls: ['./cometchat-group-members.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CometChatGroupMembersComponent implements OnInit, OnDestroy {
  /** @internal Timer references for cleanup */
  private pendingTimers: ReturnType<typeof setTimeout>[] = [];

  // ==================== Shared Constants ====================
  readonly shimmerList = CometChatUIKitConstants.shimmerList;

  // ==================== Service Injection ====================
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);
  protected groupMembersService = inject(GroupMembersService);
  private templatesService = inject(CometChatTemplatesService);

  // Global config injected via token (static configuration)
  private globalConfig: Partial<GlobalConfig> | null = inject(COMETCHAT_GLOBAL_CONFIG, {
    optional: true,
  });

  // ==================== ViewChild References ====================

  @ViewChild('paginatedList')
  paginatedList?: CometChatPaginatedListComponent<CometChat.GroupMember>;

  @ViewChild('listContainer') listContainer?: ElementRef<HTMLElement>;

  @ViewChild('changeScopeRef') changeScopeRef?: CometChatChangeScopeComponent;

  // ==================== Display Control Inputs ====================

  // Track if @Input was explicitly set (for global config priority system)
  private showScrollbarExplicitlySet = signal(false);
  private hideErrorExplicitlySet = signal(false);
  private hideUserStatusExplicitlySet = signal(false);

  // Private backing fields for tracked @Input properties
  private _showScrollbar = signal(false);
  private _hideError = signal(false);
  private _hideUserStatus = signal(false);

  /**
   * The group whose members to display.
   * @see Requirement 1.1
   */
  @Input() group!: CometChat.Group;

  /**
   * Whether to hide the search bar.
   * @default false
   * @see Requirement 3.4
   */
  @Input({ transform: booleanAttribute }) hideSearch = false;

  /**
   * Whether to hide the error state view.
   * @default false
   * @see Requirements 1.5, 8.4
   */
  @Input({ transform: booleanAttribute })
  set hideError(value: boolean) {
    this._hideError.set(value);
    this.hideErrorExplicitlySet.set(true);
  }
  get hideError(): boolean {
    return this._hideError();
  }

  /**
   * Whether to hide online/offline status indicators.
   * @default false
   * @see Requirement 9.1
   */
  @Input({ transform: booleanAttribute })
  set hideUserStatus(value: boolean) {
    this._hideUserStatus.set(value);
    this.hideUserStatusExplicitlySet.set(true);
  }
  get hideUserStatus(): boolean {
    return this._hideUserStatus();
  }

  /**
   * Whether to hide the kick option from context menus.
   * @default false
   * @see Requirement 5.5
   */
  @Input({ transform: booleanAttribute }) hideKickMemberOption = false;

  /**
   * Whether to hide the ban option from context menus.
   * @default false
   * @see Requirement 5.6
   */
  @Input({ transform: booleanAttribute }) hideBanMemberOption = false;

  /**
   * Whether to hide the scope change option from context menus.
   * @default false
   * @see Requirement 5.7
   */
  @Input({ transform: booleanAttribute }) hideScopeChangeOption = false;

  /**
   * Whether to disable the shimmer loading state.
   * @default false
   * @see Requirement 1.3
   */
  @Input({ transform: booleanAttribute }) disableLoadingState = false;

  /**
   * Whether to show the scrollbar.
   * @default false
   * @see Requirements 8.3
   */
  @Input({ transform: booleanAttribute })
  set showScrollbar(value: boolean) {
    this._showScrollbar.set(value);
    this.showScrollbarExplicitlySet.set(true);
  }
  get showScrollbar(): boolean {
    return this._showScrollbar();
  }

  /**
   * Whether to disable the browser's default context menu (tooltip) on long press/right-click.
   * When true (default), the browser's context menu is disabled to show only the custom menu.
   * Set to false to allow the browser's default context menu behavior.
   *
   * @default true
   */
  @Input({ transform: booleanAttribute }) disableDefaultContextMenu = true;

  // ==================== Effective Value Computed Signals (Priority System) ====================
  /**
   * Computed effective values implementing the priority system:
   * 1. If @Input was explicitly set → use @Input value
   * 2. Else if global config is set (not undefined) → use global config value
   * 3. Else → use internal default value
   * @see Requirements 8.3, 8.4, 8.5, 8.6, 8.7, 8.8
   */
  effectiveShowScrollbar = computed(() => {
    if (this.showScrollbarExplicitlySet()) {
      return this._showScrollbar();
    }
    if (this.globalConfig?.showScrollbar !== undefined) {
      return this.globalConfig.showScrollbar;
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

  // ==================== Data Configuration Inputs ====================

  /**
   * Selection mode for the member list.
   * @default SelectionMode.none
   * @see Requirements 11.1-11.4
   */
  @Input() selectionMode: SelectionMode = SelectionMode.none;

  /**
   * Custom request builder for fetching group members.
   * @see Requirement 1.6
   */
  @Input() groupMemberRequestBuilder?: CometChat.GroupMembersRequestBuilder;

  /**
   * Custom request builder for search queries.
   * @see Requirement 3.5
   */
  @Input() searchRequestBuilder?: CometChat.GroupMembersRequestBuilder;

  /**
   * Initial search keyword.
   * @default ''
   */
  @Input() searchKeyword = '';

  /**
   * Custom function to compute options for each member.
   * Overrides the default permission-based options.
   * @see Requirement 5.8
   */
  @Input() options?: (group: CometChat.Group, member: CometChat.GroupMember) => CometChatOption[];

  // ==================== Template Inputs ====================

  /** Custom header template. @see Requirement 10.1 */
  @Input() headerView?: TemplateRef<void>;

  /**
   * Custom template for the menu area (right side of header title).
   * Use this to add a 3-dot menu or action buttons without overriding the entire header.
   */
  @Input() menuView?: TemplateRef<any>;

  /** Custom loading state template. @see Requirement 10.1 */
  @Input() loadingView?: TemplateRef<void>;

  /** Custom error state template. @see Requirement 10.1 */
  @Input() errorView?: TemplateRef<void>;

  /** Custom empty state template. @see Requirement 10.1 */
  @Input() emptyView?: TemplateRef<void>;

  /** Custom item template. Receives member as $implicit context. @see Requirement 10.2 */
  @Input() itemView?: TemplateRef<{ $implicit: CometChat.GroupMember }>;

  /** Custom subtitle template. Receives member as $implicit context. */
  @Input() subtitleView?: TemplateRef<{ $implicit: CometChat.GroupMember }>;

  /** Custom trailing view template. Receives member as $implicit context. @see Requirement 10.3 */
  @Input() trailingView?: TemplateRef<{ $implicit: CometChat.GroupMember }>;

  /** Custom leading view template. Receives member as $implicit context. @see Requirement 10.4 */
  @Input() leadingView?: TemplateRef<{ $implicit: CometChat.GroupMember }>;

  /** Custom title template. Receives member as $implicit context. */
  @Input() titleView?: TemplateRef<{ $implicit: CometChat.GroupMember }>;

  // ==================== Standardised Template Slot Inputs (Property 6 / Req 3.2) ====================
  /** Custom template for each list item. Alias for `itemView`. */
  @Input() listItemTemplate: TemplateRef<any> | null = null;
  /** Custom template for the empty state. Alias for `emptyView`. */
  @Input() emptyStateTemplate: TemplateRef<any> | null = null;
  /** Custom template for the error state. Alias for `errorView`. */
  @Input() errorStateTemplate: TemplateRef<any> | null = null;
  /** Custom template for the loading state. Alias for `loadingView`. */
  @Input() loadingStateTemplate: TemplateRef<any> | null = null;

  // ==================== Template Resolution (@Input > Component Service > Shared Service > Default) ====================
  get effectiveItemView(): TemplateRef<any> | undefined {
    return (
      this.listItemTemplate ||
      this.itemView ||
      this.templatesService.getGroupMemberTemplates().itemView
    );
  }
  get effectiveLeadingView(): TemplateRef<any> | undefined {
    return this.leadingView || this.templatesService.getGroupMemberTemplates().leadingView;
  }
  get effectiveTitleView(): TemplateRef<any> | undefined {
    return this.titleView || this.templatesService.getGroupMemberTemplates().titleView;
  }
  get effectiveSubtitleView(): TemplateRef<any> | undefined {
    return this.subtitleView || this.templatesService.getGroupMemberTemplates().subtitleView;
  }
  get effectiveTrailingView(): TemplateRef<any> | undefined {
    return this.trailingView || this.templatesService.getGroupMemberTemplates().trailingView;
  }
  get effectiveLoadingView(): TemplateRef<any> | undefined {
    return (
      this.loadingStateTemplate ||
      this.loadingView ||
      this.templatesService.resolveTemplate(this.templatesService.getGroupMemberTemplates(), 'loadingView')
    );
  }
  get effectiveEmptyView(): TemplateRef<any> | undefined {
    return (
      this.emptyStateTemplate ||
      this.emptyView ||
      this.templatesService.resolveTemplate(this.templatesService.getGroupMemberTemplates(), 'emptyView')
    );
  }
  get effectiveErrorView(): TemplateRef<any> | undefined {
    return (
      this.errorStateTemplate ||
      this.errorView ||
      this.templatesService.resolveTemplate(this.templatesService.getGroupMemberTemplates(), 'errorView')
    );
  }

  // ==================== Output Events ====================

  /**
   * Emitted when an error occurs.
   * @see Requirement 1.5
   */
  @Output() error = new EventEmitter<CometChat.CometChatException>();

  /**
   * Emitted when a member item is clicked.
   * @see Requirement 11.1
   */
  @Output() itemClick = new EventEmitter<CometChat.GroupMember>();

  /**
   * Emitted when selection changes (single/multiple mode).
   * Provides comprehensive selection state including mode, selected IDs, and last selected ID.
   * @see Requirements 9.1, 9.2, 11.3
   */
  @Output() selectionChange = new EventEmitter<SelectionState>();

  /**
   * Emitted when the member list is empty after initial fetch.
   * @see Requirement 1.4
   */
  @Output() empty = new EventEmitter<void>();

  // ==================== Internal State (Signals) ====================

  /** The member currently being targeted for a scope change dialog. */
  memberToChangeScope = signal<CometChat.GroupMember | null>(null);

  /** Current search text. */
  searchText = signal<string>('');

  /** Index of the currently focused item for keyboard navigation. */
  focusedIndex = signal<number>(-1);

  /** The logged-in CometChat user. */
  loggedInUser = signal<CometChat.User | null>(null);

  /** Last error that occurred during fetch - used to distinguish error state from empty state */
  lastError: Error | null = null;

  // ==================== Exposed Enums ====================

  readonly SelectionMode = SelectionMode;
  readonly States = States;

  // ==================== Private State ====================

  private searchSubject$ = new Subject<string>();
  private isFirstFetch = true;

  /** Subscriptions for CometChatGroupEvents UI events. */
  private memberKickedSub?: Subscription;
  private memberBannedSub?: Subscription;
  private memberScopeChangedSub?: Subscription;
  private memberAddedSub?: Subscription;

  /** Set of selected member UIDs for tracking selection. */
  private selectedMembers = new Set<string>();

  /** Index of the last selected item for shift-click range selection anchor point. */
  private lastSelectedIndex = signal<number>(-1);

  // ==================== Lifecycle Hooks ====================

  /**
   * Initialize the component: get logged-in user, set up service, listeners, and event subscriptions.
   * @see Requirements 1.1, 9.1-9.9, 13.1
   */
  ngOnInit(): void {
    this.fetchLoggedInUser();
    this.initializeService();
    this.setupSearchDebouncing();
    this.setupGroupEventSubscriptions();
  }

  /**
   * Cleanup: service, event subscriptions, debounce subject.
   * @see Requirements 13.1-13.3
   */
  ngOnDestroy(): void {
    this.pendingTimers.forEach(t => clearTimeout(t));
    this.pendingTimers = [];
    this.groupMembersService.cleanup();
    this.removeGroupEventSubscriptions();
    this.searchSubject$.complete();
  }

  // ==================== Initialization Methods ====================

  /**
   * Fetch the logged-in user from the SDK and store in signal.
   */
  private fetchLoggedInUser(): void {
    CometChat.getLoggedinUser()
      .then((user: CometChat.User | null) => {
        if (user) {
          this.loggedInUser.set(user);
          this.cdr.markForCheck();
        }
      })
      .catch((err: unknown) => {
        CometChatLogger.error('CometChatGroupMembers', 'Error fetching logged-in user:', err);
      });
  }

  /**
   * Initialize the GroupMembersService with the group and attach SDK listeners.
   * @see Requirements 1.1, 9.1-9.9
   */
  private initializeService(): void {
    if (!this.group) {
      console.warn('[CometChatGroupMembers] No group input provided.');
      return;
    }

    // Set error callback to propagate errors to the component output
    this.groupMembersService.setErrorCallback((err: CometChat.CometChatException) => {
      this.lastError = err as unknown as Error;
      this.error.emit(err);
      this.cdr.markForCheck();
    });

    this.groupMembersService.initialize(this.group, this.groupMemberRequestBuilder);
    this.groupMembersService.attachListeners(this.group.getGuid(), this.hideUserStatus);
  }

  /**
   * Set up search input debouncing using RxJS Subject + debounceTime.
   * @see Requirement 3.1
   */
  private setupSearchDebouncing(): void {
    this.searchSubject$
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((keyword: string) => {
        this.handleSearchTextChange(keyword);
      });
  }

  // ==================== CometChatGroupEvents Subscriptions ====================

  /**
   * Subscribe to CometChatGroupEvents for UI events triggered by the local user's own actions.
   * These events are emitted by the service after successful SDK operations.
   * @see Requirement 9.9
   */
  private setupGroupEventSubscriptions(): void {
    this.memberKickedSub = CometChatGroupEvents.ccGroupMemberKicked.subscribe(
      (event: IGroupMemberKickedBanned) => {
        if (event.kickedFrom?.getGuid() !== this.group?.getGuid()) {
          return;
        }
        this.groupMembersService.removeMember(event.kickedUser.getUid());
        this.checkEmptyState();
        this.cdr.markForCheck();
      }
    );

    this.memberBannedSub = CometChatGroupEvents.ccGroupMemberBanned.subscribe(
      (event: IGroupMemberKickedBanned) => {
        if (event.kickedFrom?.getGuid() !== this.group?.getGuid()) {
          return;
        }
        this.groupMembersService.removeMember(event.kickedUser.getUid());
        this.checkEmptyState();
        this.cdr.markForCheck();
      }
    );

    this.memberScopeChangedSub = CometChatGroupEvents.ccGroupMemberScopeChanged.subscribe(
      (event: IGroupMemberScopeChanged) => {
        if (event.group?.getGuid() !== this.group?.getGuid()) {
          return;
        }
        this.groupMembersService.updateMemberScopeInList(
          event.updatedUser.getUid(),
          event.scopeChangedTo as CometChat.GroupMemberScope
        );
        this.cdr.markForCheck();
      }
    );

    this.memberAddedSub = CometChatGroupEvents.ccGroupMemberAdded.subscribe(
      (event: IGroupMemberAdded) => {
        if (event.userAddedIn?.getGuid() !== this.group?.getGuid()) {
          return;
        }
        for (const user of event.usersAdded) {
          const newMember = GroupMemberUtils.createParticipantGroupMember(user, event.userAddedIn);
          this.groupMembersService.appendMember(newMember);
        }
        this.cdr.markForCheck();
      }
    );
  }

  /**
   * Unsubscribe from all CometChatGroupEvents.
   * @see Requirement 13.2
   */
  private removeGroupEventSubscriptions(): void {
    this.memberKickedSub?.unsubscribe();
    this.memberBannedSub?.unsubscribe();
    this.memberScopeChangedSub?.unsubscribe();
    this.memberAddedSub?.unsubscribe();
  }

  // ==================== Data Fetching / Search ====================

  /**
   * Handle loadMore event from CometChatPaginatedList.
   * Delegates to the service to fetch the next page.
   * @see Requirements 2.1-2.4
   */
  onLoadMore(): void {
    this.groupMembersService
      .fetchNext()
      .then(() => {
        this.paginatedList?.loadComplete();

        // Check for empty state on first fetch
        if (this.isFirstFetch) {
          this.isFirstFetch = false;
          this.checkEmptyState();
        }

        this.cdr.markForCheck();
      })
      .catch(() => {
        this.paginatedList?.loadComplete();
        this.cdr.markForCheck();
      });
  }

  /**
   * Handle search input from the search bar.
   * Pushes the value into the debounce subject.
   * @param text - The search text entered by the user
   * @see Requirement 3.1
   */
  onSearch(text: string): void {
    this.searchSubject$.next(text);
  }

  /**
   * Handle the debounced search text change.
   * Resets the list and fetches members matching the keyword.
   * @param keyword - The debounced search keyword
   * @see Requirements 3.1-3.3
   */
  private handleSearchTextChange(keyword: string): void {
    this.searchText.set(keyword);
    this.isFirstFetch = true;

    if (keyword) {
      this.groupMembersService.search(keyword, this.searchRequestBuilder);
    } else {
      // Search cleared — reset to full list
      this.groupMembersService.search('', this.searchRequestBuilder);
    }

    this.cdr.markForCheck();
  }

  // ==================== Item Interaction ====================

  /**
   * Handle member item click.
   * @param member - The clicked member
   * @see Requirement 11.1
   */
  onItemClick(member: CometChat.GroupMember): void {
    if (this.selectionMode !== SelectionMode.none) {
      this.handleSelectionChange(member);
    } else {
      this.itemClick.emit(member);
    }
  }

  /**
   * Handles the browser's native context menu event (right-click / long-press).
   * Prevents the default browser context menu when disableDefaultContextMenu is true.
   *
   * @param event - The DOM contextmenu event
   */
  handleContextMenu(event: MouseEvent): void {
    if (this.disableDefaultContextMenu) {
      event.preventDefault();
    }
  }

  /**
   * Handle selection change for a member (single/multiple mode).
   * Supports shift-click range selection in multiple mode.
   * @param member - The member being selected/deselected
   * @param event - Optional event object (for shift-click detection)
   * @see Requirements 11.1-11.4, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6
   */
  handleSelectionChange(member: CometChat.GroupMember, event?: Event): void {
    const uid = member.getUid();
    const members = this.groupMembersService.members();
    const currentIndex = members.findIndex(m => m.getUid() === uid);

    if (this.selectionMode === SelectionMode.single) {
      // Single mode: clear previous, select new
      const wasSelected = this.selectedMembers.has(uid);
      this.selectedMembers.clear();

      if (!wasSelected) {
        this.selectedMembers.add(uid);
      }

      // Emit selection change event with SelectionState
      this.emitSelectionChange(!wasSelected ? uid : null);
    } else if (this.selectionMode === SelectionMode.multiple) {
      // Check for shift-click range selection (Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6)
      const isShiftClick = event instanceof MouseEvent && event.shiftKey;
      const lastIndex = this.lastSelectedIndex();

      if (isShiftClick && lastIndex >= 0 && currentIndex !== -1) {
        // Shift-click: select/deselect range
        this.selectRange(lastIndex, currentIndex);
        // Note: emitSelectionChange is called inside selectRange
      } else {
        // Normal click: toggle single selection
        const isSelected = this.selectedMembers.has(uid);

        if (isSelected) {
          this.selectedMembers.delete(uid);
        } else {
          this.selectedMembers.add(uid);
        }

        // Update anchor point for next potential shift-click (Requirements 5.5)
        this.lastSelectedIndex.set(currentIndex);

        // Emit selection change event with SelectionState
        this.emitSelectionChange(!isSelected ? uid : null);
      }
    }

    this.cdr.markForCheck();
  }

  /**
   * Handles shift+click range selection.
   * Selects or deselects all members between the anchor point and clicked item.
   * The selection action (select or deselect) is determined by the clicked item's current state.
   * @param startIndex - Starting index of the range (anchor point)
   * @param endIndex - Ending index of the range (currently clicked)
   * @private
   * @see Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6
   */
  private selectRange(startIndex: number, endIndex: number): void {
    const members = this.groupMembersService.members();
    const minIndex = Math.min(startIndex, endIndex);
    const maxIndex = Math.max(startIndex, endIndex);

    // Determine action based on clicked item's current state (Requirements 5.2, 5.3)
    const clickedMember = members[endIndex];
    const clickedId = clickedMember.getUid();
    const shouldDeselect = this.selectedMembers.has(clickedId);

    // Process all members in range
    for (let i = minIndex; i <= maxIndex; i++) {
      const member = members[i];
      const uid = member.getUid();

      if (shouldDeselect) {
        // Deselect: only process members that were selected
        if (this.selectedMembers.has(uid)) {
          this.selectedMembers.delete(uid);
        }
      } else {
        // Select: only process members that were not selected
        if (!this.selectedMembers.has(uid)) {
          this.selectedMembers.add(uid);
        }
      }
    }

    // Update lastSelectedIndex after range selection (Requirements 5.5)
    this.lastSelectedIndex.set(endIndex);

    // Emit single selectionChange event after all range selections
    this.emitSelectionChange(clickedId);
  }

  /**
   * Emits the selectionChange event with current selection state.
   * Called after any selection change (click, keyboard, range selection).
   * @param lastSelectedId - The UID of the last selected/deselected member, or null
   * @private
   * @see Requirements 9.1, 9.2
   */
  private emitSelectionChange(lastSelectedId: string | null): void {
    this.selectionChange.emit({
      mode: this.selectionMode,
      selectedIds: new Set(this.selectedMembers),
      lastSelectedId,
    });
  }

  /**
   * Handle selection control change (checkbox/radio button events).
   * Wrapper method that extracts the native event for shift-click detection.
   * @param member - The member
   * @param event - The DOM event (passed for shift-click detection)
   * @see Requirements 5.1
   */
  handleSelectionControlChange(member: CometChat.GroupMember, event?: Event): void {
    event?.stopPropagation();
    // Pass the event to handleSelectionChange for shift-click detection
    this.handleSelectionChange(member, event);
  }

  /**
   * Check if a member is currently selected.
   * @param member - The member to check
   */
  isMemberSelected(member: CometChat.GroupMember): boolean {
    return this.selectedMembers.has(member.getUid());
  }

  /**
   * Selects all members in the list.
   * Only works in multiple selection mode.
   * Emits a single selectionChange event after all selections.
   * @see Requirements 3.1, 3.2, 3.3, 9.3
   */
  selectAll(): void {
    if (this.selectionMode !== SelectionMode.multiple) {
      return;
    }

    const members = this.groupMembersService.members();

    // Iterate through all members and select those not already selected
    members.forEach(member => {
      const uid = member.getUid();

      if (!this.selectedMembers.has(uid)) {
        this.selectedMembers.add(uid);
      }
    });

    // Emit single selectionChange event after all selections
    this.emitSelectionChange(null);

    this.cdr.markForCheck();
  }

  /**
   * Clears all selections.
   * Emits a single selectionChange event after all deselections.
   * Resets the lastSelectedIndex anchor point for shift-click selection.
   * @see Requirements 4.1, 4.2, 4.3, 6.1, 9.4
   */
  clearSelection(): void {
    // Clear selection state
    this.selectedMembers.clear();

    // Reset anchor point for shift-click selection
    this.lastSelectedIndex.set(-1);

    // Emit single selectionChange event after all deselections
    this.emitSelectionChange(null);

    this.cdr.markForCheck();
  }

  // ==================== Action Handling ====================

  /**
   * Route a member action (kick, ban, changeScope) from the context menu.
   * @param option - The selected option
   * @param member - The target member
   * @see Requirements 6.1, 7.1, 8.1
   */
  handleActionOnGroupMember(option: CometChatOption, member: CometChat.GroupMember): void {
    switch (option.id) {
      case CometChatUIKitConstants.GroupMemberOptions.kick:
        this.groupMembersService.kickMember(this.group, member).then(() => {
          this.checkEmptyState();
          this.cdr.markForCheck();
        });
        break;

      case CometChatUIKitConstants.GroupMemberOptions.ban:
        this.groupMembersService.banMember(this.group, member).then(() => {
          this.checkEmptyState();
          this.cdr.markForCheck();
        });
        break;

      case CometChatUIKitConstants.GroupMemberOptions.changeScope:
        this.memberToChangeScope.set(member);
        this.cdr.markForCheck();
        break;

      default:
        // Custom option — invoke its onClick if available
        if (option.onClick) {
          option.onClick();
        }
        break;
    }
  }

  /**
   * Handle context menu option click.
   * Bridges the ContextMenu's optionClick event to handleActionOnGroupMember.
   * @param option - The clicked option (ContextMenuItem)
   * @param member - The target member
   */
  onOptionClick(option: CometChatOption, member: CometChat.GroupMember): void {
    if (option instanceof CometChatOption || (option as CometChatOption).id) {
      this.handleActionOnGroupMember(option as CometChatOption, member);
    }
  }

  // ==================== Options / Permissions ====================

  /**
   * Get the options (context menu items) for a member.
   * Uses the custom `options` function if provided, otherwise delegates to GroupMemberUtils.
   * @param member - The target member
   * @returns Array of CometChatOption or a scope string (for badge-only display)
   * @see Requirements 5.1-5.8
   */
  getOptionsForMember(member: CometChat.GroupMember): CometChatOption[] | string {
    const user = this.loggedInUser();
    if (!user) {
      return member.getScope();
    }

    if (this.options) {
      try {
        return this.options(this.group, member);
      } catch (err) {
        CometChatLogger.error('CometChatGroupMembers', 'Custom options function error:', err);
        this.error.emit(
          new CometChat.CometChatException({
            code: 'CUSTOM_OPTIONS_ERROR',
            message: CometChatLocalize.getLocalizedString('group_members_custom_options_error'),
            details: String(err),
          })
        );
        // Fall back to default options
      }
    }

    return GroupMemberUtils.getViewMemberOptions(member, this.group, user.getUid(), {
      hideKickMemberOption: this.hideKickMemberOption,
      hideBanMemberOption: this.hideBanMemberOption,
      hideScopeChangeOption: this.hideScopeChangeOption,
    });
  }

  /**
   * Check if the options result is an array (has action options) vs a string (scope badge only).
   * Used in the template to determine whether to show context menu or badge.
   */
  hasActionOptions(optionsResult: CometChatOption[] | string): optionsResult is CometChatOption[] {
    return Array.isArray(optionsResult);
  }

  // ==================== Scope Change Dialog ====================

  /**
   * Get the allowed scopes for the member currently targeted for scope change.
   * @param member - The member whose scope is being changed
   * @returns Array of allowed scope strings
   * @see Requirement 8.2
   */
  getAllowedScopes(member: CometChat.GroupMember): string[] {
    return GroupMemberUtils.allowScopeChange(this.group, member);
  }

  /**
   * Handle scope change confirmation from the CometChatChangeScope dialog.
   * @param newScope - The new scope selected by the user
   * @see Requirements 8.3-8.5
   */
  onScopeChanged(newScope: string): void {
    const member = this.memberToChangeScope();
    if (!member) {
      return;
    }

    this.groupMembersService
      .updateMemberScope(this.group, member, newScope)
      .then(() => {
        this.changeScopeRef?.setSuccess();
        this.memberToChangeScope.set(null);
        this.cdr.markForCheck();
      })
      .catch(() => {
        this.changeScopeRef?.setError();
        this.cdr.markForCheck();
      });
  }

  /**
   * Handle close/cancel of the scope change dialog.
   * @see Requirement 8.6
   */
  onChangeScopeClose(): void {
    this.memberToChangeScope.set(null);
    this.cdr.markForCheck();
  }

  // ==================== Keyboard Navigation ====================

  /**
   * Handle focus on the list container — highlight first item.
   * @see Requirement 12.1
   */
  @HostListener('focus')
  handleListFocus(): void {
    const members = this.groupMembersService.members();
    if (this.focusedIndex() === -1 && members.length > 0) {
      this.focusedIndex.set(0);
      this.cdr.markForCheck();
      this.scrollFocusedItemIntoView();
    }
  }

  /**
   * Handle keyboard events for navigation and selection.
   * Implements Arrow keys, Enter, Space, Escape, Cmd+A (select all), and Cmd+Shift+A (deselect all).
   * @param event - The keyboard event
   * @see Requirements 12.1-12.4, 3.4, 3.5, 4.4, 4.5, 6.3, 6.4, 6.5
   */
  @HostListener('keydown', ['$event'])
  handleKeydown(event: KeyboardEvent): void {
    const members = this.groupMembersService.members();

    // Skip if empty or not loaded
    if (members.length === 0 || this.groupMembersService.fetchState() !== States.loaded) {
      return;
    }

    // Only handle events within the component
    const target = event.target as HTMLElement;
    const isWithinComponent = target.closest('.cometchat-group-members') !== null;
    if (!isWithinComponent) {
      return;
    }

    // Don't handle keyboard events when focus is in the search bar (except for Escape and selection shortcuts)
    const isInSearchBar =
      target.closest('.cometchat-group-members__search-bar') !== null || target.tagName === 'INPUT';

    // If the change scope dialog is open, let it handle its own keyboard events (Requirement 6.5)
    if (this.memberToChangeScope()) {
      if (event.key === 'Escape') {
        event.preventDefault();
        this.onChangeScopeClose();
      }
      return;
    }

    // Handle Ctrl/Cmd+Shift+A for deselect all (check BEFORE Ctrl/Cmd+A)
    // Requirements: 4.1, 4.3, 4.4, 4.5
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'a') {
      if (this.selectionMode === SelectionMode.multiple) {
        event.preventDefault();
        this.clearSelection();
        return;
      }
    }

    // Handle Ctrl/Cmd+A for select all
    // Requirements: 3.1, 3.3, 3.4, 3.5
    if ((event.ctrlKey || event.metaKey) && !event.shiftKey && event.key.toLowerCase() === 'a') {
      if (this.selectionMode === SelectionMode.multiple) {
        event.preventDefault();
        this.selectAll();
        return;
      }
    }

    switch (event.key) {
      case 'ArrowDown':
        if (!isInSearchBar) {
          event.preventDefault();
          event.stopPropagation();
          this.focusNextItem();
        }
        break;

      case 'ArrowUp':
        if (!isInSearchBar) {
          event.preventDefault();
          event.stopPropagation();
          this.focusPreviousItem();
        }
        break;

      case 'Enter':
        if (!isInSearchBar) {
          event.preventDefault();
          this.selectFocusedItem();
        }
        break;

      case ' ':
        if (!isInSearchBar && this.selectionMode === SelectionMode.multiple) {
          event.preventDefault();
          this.toggleFocusedItemSelection();
        }
        break;

      case 'Escape':
        event.preventDefault();
        this.handleEscapeKey();
        break;
    }
  }

  /**
   * Move focus to the next item in the list. Wraps around.
   * @see Requirement 12.1
   */
  private focusNextItem(): void {
    const members = this.groupMembersService.members();
    if (members.length === 0) {
      return;
    }

    const current = this.focusedIndex();
    if (current === -1 || current >= members.length - 1) {
      this.focusedIndex.set(0);
    } else {
      this.focusedIndex.set(current + 1);
    }

    this.cdr.markForCheck();
    this.scrollFocusedItemIntoView();
  }

  /**
   * Move focus to the previous item in the list. Wraps around.
   * @see Requirement 12.1
   */
  private focusPreviousItem(): void {
    const members = this.groupMembersService.members();
    if (members.length === 0) {
      return;
    }

    const current = this.focusedIndex();
    if (current <= 0) {
      this.focusedIndex.set(members.length - 1);
    } else {
      this.focusedIndex.set(current - 1);
    }

    this.cdr.markForCheck();
    this.scrollFocusedItemIntoView();
  }

  /**
   * Scroll the focused item into view.
   */
  private scrollFocusedItemIntoView(): void {
    this.pendingTimers.push(setTimeout(() => {
      if (!this.listContainer) {
        return;
      }

      const focusedElement = this.listContainer.nativeElement.querySelector(
        `[data-index="${this.focusedIndex()}"]`
      );

      if (focusedElement) {
        focusedElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'nearest',
        });
      }
    }, 0));
  }

  /**
   * Trigger item click on the currently focused item.
   * @see Requirement 12.1
   */
  private selectFocusedItem(): void {
    const members = this.groupMembersService.members();
    const idx = this.focusedIndex();

    if (idx >= 0 && idx < members.length) {
      const member = members[idx];
      if (this.selectionMode !== SelectionMode.none) {
        this.handleSelectionChange(member);
      } else {
        this.itemClick.emit(member);
      }
    }
  }

  /**
   * Toggle selection of the currently focused item (multiple mode).
   * @see Requirement 12.1
   */
  private toggleFocusedItemSelection(): void {
    const members = this.groupMembersService.members();
    const idx = this.focusedIndex();

    if (idx >= 0 && idx < members.length) {
      this.handleSelectionChange(members[idx]);
    }
  }

  /**
   * Handles Escape key press with proper priority:
   * 1. If search text is present, clear it first
   * 2. Otherwise, clear selections and blur focus
   * @private
   * @see Requirements 6.3, 6.4
   */
  private handleEscapeKey(): void {
    // Priority 1: Clear search text first if present (Requirement 6.4)
    if (this.searchText()) {
      this.searchText.set('');
      this.searchSubject$.next('');
      this.cdr.markForCheck();
      return;
    }

    // Priority 2: Clear selections if any exist (Requirement 6.1)
    if (this.selectionMode !== SelectionMode.none && this.selectedMembers.size > 0) {
      this.clearSelection();
    }

    // Reset focus (Requirement 6.2)
    this.focusedIndex.set(-1);

    // Blur any focused element (Requirement 6.3)
    (document.activeElement as HTMLElement)?.blur();

    this.cdr.markForCheck();
  }

  /**
   * Handle when an item receives focus (via Tab key).
   * @param index - The index of the focused item
   */
  handleItemFocus(index: number): void {
    this.focusedIndex.set(index);
    this.cdr.markForCheck();
  }

  /**
   * Handle when an item loses focus.
   */
  handleItemBlur(): void {
    // Don't reset focusedIndex on blur - let keyboard navigation manage it
    // This prevents losing focus state when clicking elsewhere
    this.cdr.markForCheck();
  }

  /**
   * Handle keyboard events on individual list items.
   * Allows Tab to move to menu options within the item.
   * @param event - The keyboard event
   * @param member - The member associated with the item
   * @param index - The index of the item
   */
  handleItemKeydown(event: KeyboardEvent, member: CometChat.GroupMember, index: number): void {
    const target = event.target as HTMLElement;

    // Handle Enter key to select/click the item
    if (event.key === 'Enter') {
      // Check if we're on the list item wrapper itself (not a nested element)
      if (target.classList.contains('cometchat-group-members__list-item-wrapper')) {
        event.preventDefault();
        this.onItemClick(member);
      }
    }

    // Handle Space key for selection in multiple mode
    if (event.key === ' ' && this.selectionMode === SelectionMode.multiple) {
      if (target.classList.contains('cometchat-group-members__list-item-wrapper')) {
        event.preventDefault();
        this.handleSelectionChange(member);
      }
    }
  }

  /**
   * Get the tabindex for a member item (roving tabindex pattern).
   * @param index - The index of the member item
   */
  getTabIndex(index: number): number {
    if (this.focusedIndex() === index) {
      return 0;
    }
    if (this.focusedIndex() === -1 && index === 0) {
      return 0;
    }
    return -1;
  }

  // ==================== Utility Methods ====================

  /**
   * TrackBy function for ngFor optimization.
   * @param _index - Item index
   * @param member - GroupMember object
   * @returns Member UID
   */
  trackByMember(_index: number, member: CometChat.GroupMember): string {
    return member.getUid();
  }

  /**
   * Get the member's ARIA label for screen readers.
   * @param member - The group member
   */
  getMemberAriaLabel(member: CometChat.GroupMember): string {
    const name = member.getName() || '';
    const scope = member.getScope() || '';
    return `${name}, ${scope}`;
  }

  /**
   * Check if the member list is empty and emit the empty event.
   */
  private checkEmptyState(): void {
    if (this.groupMembersService.members().length === 0) {
      this.empty.emit();
    }
  }

  /**
   * Handles click on the container to blur focus when clicking outside list items.
   * Resets focusedIndex to -1 and blurs the active element when clicking outside
   * of list items or selection controls.
   * @param event - The mouse click event
   * @see Requirements 7.1, 7.2, 7.3, 7.4
   */
  handleContainerClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    // Check if click is outside of group member items
    const isOnItem = target.closest('.cometchat-group-members__list-item-wrapper') !== null;
    const isOnSelectionControl =
      target.closest('cometchat-checkbox') !== null ||
      target.closest('cometchat-radio-button') !== null;
    // Don't blur if clicking on the search bar
    const isOnSearchBar =
      target.closest('cometchat-search-bar') !== null ||
      target.closest('.cometchat-group-members__search-bar') !== null;

    if (!isOnItem && !isOnSelectionControl && !isOnSearchBar) {
      this.focusedIndex.set(-1);
      (document.activeElement as HTMLElement)?.blur();
      this.cdr.markForCheck();
    }
  }

  /**
   * Handles retry button click in error state.
   * Shows loading state, then re-fetches group members.
   */
  handleRetryClick(): void {
    if (!this.group) return;
    this.lastError = null;
    this.initializeService();
    this.groupMembersService.fetchNext();
  }
}
