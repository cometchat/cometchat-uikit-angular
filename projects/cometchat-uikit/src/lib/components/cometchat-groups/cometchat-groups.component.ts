/**
 * CometChatGroups Component
 *
 * A comprehensive component that displays a real-time list of groups
 * with support for search, selection modes, and extensive customization.
 * This component follows Angular v21 best practices with a service-based
 * architecture where SDK interactions are handled by GroupsService.
 *
 * Features:
 * - Real-time group updates (member join/leave/kick/ban)
 * - Multiple selection modes (none, single, multiple)
 * - Group type indicators (public, private, password)
 * - Search functionality with debounce
 * - Custom template support for all sections
 * - Keyboard navigation and accessibility
 *
 * @module components/cometchat-groups
 * @see Requirements 8.1, 8.2, 8.5, 8.6
 */
import {
  Component,
  Input,
  Output,
  EventEmitter,
  TemplateRef,
  ViewChild,
  ElementRef,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnInit,
  OnDestroy,
  inject,
  HostListener,
  signal,
  computed,
  booleanAttribute,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { CometChat } from '@cometchat/chat-sdk-javascript';

// Event imports
import { CometChatGroupEvents } from '../../events/CometChatGroupEvents';

// Component imports
import { CometChatPaginatedListComponent } from '../cometchat-paginated-list/cometchat-paginated-list.component';
import { CometChatGroupItemComponent } from '../cometchat-group-item/cometchat-group-item.component';
import { CometChatCheckboxComponent } from '../base-elements/cometchat-checkbox/cometchat-checkbox.component';
import { CometChatRadioButtonComponent } from '../base-elements/cometchat-radio-button/cometchat-radio-button.component';
import { CometChatSearchBarComponent } from '../base-elements/cometchat-search-bar/cometchat-search-bar.component';

// Resource imports
import { TranslatePipe } from '../../resources/CometChatLocalize/translate.pipe';

// Type imports
import { SelectionMode, States } from '../../Enums/Enums';
import { CometChatUIKitConstants } from '../../constants';
import { CometChatOption } from '../../modals/CometChatOption';
import { SelectionState } from '../../modals/SelectionState';

// Service imports
import { GroupsService } from '../../services/groups.service';
import { ChatStateService } from '../../services/chat-state.service';
import { CometChatTemplatesService } from '../../services/templates.service';
import { COMETCHAT_GLOBAL_CONFIG, GlobalConfig } from '../../services/global-config.service';
import { TypeAheadService } from '../../services/type-ahead.service';
import { LiveAnnouncerService } from '../../services/live-announcer.service';
import { CometChatLocalize } from '../../resources/CometChatLocalize/cometchat-localize';
import { handleListKeyDown, ListKeyboardHost } from '../../utils/list-keyboard-handler';

/**
 * CometChatGroups displays a scrollable, searchable list of groups with
 * real-time updates and extensive customization options.
 *
 * @example
 * ```html
 * <!-- Basic usage -->
 * <cometchat-groups
 *   (itemClick)="onGroupClick($event)"
 *   (error)="onError($event)">
 * </cometchat-groups>
 *
 * <!-- With selection mode -->
 * <cometchat-groups
 *   [selectionMode]="SelectionMode.multiple"
 *   (select)="onGroupSelect($event)">
 * </cometchat-groups>
 *
 * <!-- With custom templates -->
 * <cometchat-groups
 *   [subtitleView]="customSubtitle"
 *   [trailingView]="customTrailing">
 *   <ng-template #customSubtitle let-group>
 *     <span>{{ group.getMembersCount() }} members</span>
 *   </ng-template>
 * </cometchat-groups>
 * ```
 *
 * @see Requirements 8.1, 8.2, 8.5, 8.6
 */
@Component({
  selector: 'cometchat-groups',
  standalone: true,
  imports: [
    CommonModule,
    CometChatPaginatedListComponent,
    CometChatGroupItemComponent,
    CometChatCheckboxComponent,
    CometChatRadioButtonComponent,
    CometChatSearchBarComponent,
    TranslatePipe,
  ],
  templateUrl: './cometchat-groups.component.html',
  styleUrls: ['./cometchat-groups.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [GroupsService],
})
export class CometChatGroupsComponent implements OnInit, OnDestroy {
  /** @internal Timer references for cleanup */
  private pendingTimers: ReturnType<typeof setTimeout>[] = [];

  // ==================== Shared Constants ====================
  readonly shimmerList = CometChatUIKitConstants.shimmerList;

  // ==================== Service Injection ====================
  private cdr = inject(ChangeDetectorRef);
  private groupsService = inject(GroupsService);
  private chatStateService = inject(ChatStateService);
  private templatesService = inject(CometChatTemplatesService);
  private typeAheadService = inject(TypeAheadService);
  private liveAnnouncer = inject(LiveAnnouncerService);

  // Global config injected via token (static configuration)
  private globalConfig: Partial<GlobalConfig> | null = inject(COMETCHAT_GLOBAL_CONFIG, {
    optional: true,
  });

  // ==================== ViewChild References ====================

  /**
   * Reference to the CometChatPaginatedList component
   * Used to call loadComplete() after pagination fetch completes
   * @see Requirements 4.1, 4.7
   */
  @ViewChild('paginatedList') paginatedList?: CometChatPaginatedListComponent<CometChat.Group>;

  /**
   * Reference to the list container element
   * Used for scrolling focused items into view
   * @see Requirements 2.2, 2.3, 2.4, 2.5
   */
  @ViewChild('listContainer') listContainer?: ElementRef<HTMLElement>;

  // ==================== Display Control Inputs ====================

  /**
   * Boolean inputs use booleanAttribute transform for intuitive template usage.
   * This allows both syntaxes:
   * - Attribute syntax: <cometchat-groups hideSearch>
   * - Property binding: <cometchat-groups [hideSearch]="true">
   * @see Requirements 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8
   */

  // Track if @Input was explicitly set (for global config priority system)
  private hideGroupTypeExplicitlySet = signal(false);
  private showScrollbarExplicitlySet = signal(false);
  private hideErrorExplicitlySet = signal(false);

  // Private backing fields for tracked @Input properties
  private _hideGroupType = signal(false);
  private _showScrollbar = signal(false);
  private _hideError = signal(false);

  /**
   * Whether to hide the search bar
   * @default false
   * @see Requirements 12.1
   */
  @Input({ transform: booleanAttribute }) hideSearch = false;

  /**
   * Whether to hide the error state view
   * @default false
   * @see Requirements 14.6, 8.4
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
   * Whether to hide the group type icon (public/private/password)
   * @default false
   * @see Requirements 9.5, 8.2
   */
  @Input({ transform: booleanAttribute })
  set hideGroupType(value: boolean) {
    this._hideGroupType.set(value);
    this.hideGroupTypeExplicitlySet.set(true);
  }
  get hideGroupType(): boolean {
    return this._hideGroupType();
  }

  /**
   * Whether to show the scrollbar
   * @default false
   * @see Requirements 20.1, 8.3
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
   * @see Requirements 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8
   */
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

  effectiveHideError = computed(() => {
    if (this.hideErrorExplicitlySet()) {
      return this._hideError();
    }
    if (this.globalConfig?.hideError !== undefined) {
      return this.globalConfig.hideError;
    }
    return false;
  });

  // ==================== Data Configuration Inputs ====================

  /**
   * Custom request builder for fetching groups
   * Allows customization of group query parameters
   * @see Requirements 10.3
   */
  @Input() groupsRequestBuilder?: CometChat.GroupsRequestBuilder;

  /**
   * Custom request builder specifically for search queries
   * If not provided, groupsRequestBuilder will be used for search
   * @see Requirements 10.4
   */
  @Input() searchRequestBuilder?: CometChat.GroupsRequestBuilder;

  /**
   * Currently active/highlighted group
   * @see Requirements 11.6
   */
  @Input() activeGroup?: CometChat.Group;

  /**
   * Selection mode for the group list
   * - none: No selection (default)
   * - single: Single selection with radio buttons
   * - multiple: Multiple selection with checkboxes
   * @default SelectionMode.none
   * @see Requirements 11.1
   */
  @Input() selectionMode: SelectionMode = SelectionMode.none;

  // ==================== Customization Inputs ====================

  /**
   * Function that returns context menu options for a group
   * @param group - The group to get options for
   * @returns Array of CometChatOption items
   * @see Requirements 17.1
   */
  @Input() options?: (group: CometChat.Group) => CometChatOption[];

  // ==================== Template Inputs ====================

  /**
   * Custom template for the header section
   * @see Requirements 16.6
   */
  @Input() headerView?: TemplateRef<any>;

  /**
   * Custom template for the menu area (right side of header title).
   * Use this to add a 3-dot menu or action buttons without overriding the entire header.
   */
  @Input() menuView?: TemplateRef<any>;

  /**
   * Custom template for the loading state
   * @see Requirements 15.3
   */
  @Input() loadingView?: TemplateRef<any>;

  /**
   * Custom template for the empty state
   * @see Requirements 14.3
   */
  @Input() emptyView?: TemplateRef<any>;

  /**
   * Custom template for the error state
   * @see Requirements 14.5
   */
  @Input() errorView?: TemplateRef<any>;

  /**
   * Custom template for rendering each group item
   * Receives group object as implicit context
   * @see Requirements 16.1
   */
  @Input() itemView?: TemplateRef<{ $implicit: CometChat.Group }>;

  /**
   * Custom template for the leading section (avatar area)
   * Receives group object as implicit context
   * @see Requirements 16.2
   */
  @Input() leadingView?: TemplateRef<{ $implicit: CometChat.Group }>;

  /**
   * Custom template for the title section
   * Receives group object as implicit context
   * @see Requirements 16.3
   */
  @Input() titleView?: TemplateRef<{ $implicit: CometChat.Group }>;

  /**
   * Custom template for the subtitle section
   * Receives group object as implicit context
   * @see Requirements 16.4
   */
  @Input() subtitleView?: TemplateRef<{ $implicit: CometChat.Group }>;

  /**
   * Custom template for the trailing section (selection controls area)
   * Receives group object as implicit context
   * @see Requirements 16.5
   */
  @Input() trailingView?: TemplateRef<{ $implicit: CometChat.Group }>;

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
      this.templatesService.getGroupTemplates().itemView
    );
  }
  get effectiveLeadingView(): TemplateRef<any> | undefined {
    return this.leadingView || this.templatesService.getGroupTemplates().leadingView;
  }
  get effectiveTitleView(): TemplateRef<any> | undefined {
    return this.titleView || this.templatesService.getGroupTemplates().titleView;
  }
  get effectiveSubtitleView(): TemplateRef<any> | undefined {
    return this.subtitleView || this.templatesService.getGroupTemplates().subtitleView;
  }
  get effectiveTrailingView(): TemplateRef<any> | undefined {
    return this.trailingView || this.templatesService.getGroupTemplates().trailingView;
  }
  get effectiveLoadingView(): TemplateRef<any> | undefined {
    return (
      this.loadingStateTemplate ||
      this.loadingView ||
      this.templatesService.resolveTemplate(this.templatesService.getGroupTemplates(), 'loadingView')
    );
  }
  get effectiveEmptyView(): TemplateRef<any> | undefined {
    return (
      this.emptyStateTemplate ||
      this.emptyView ||
      this.templatesService.resolveTemplate(this.templatesService.getGroupTemplates(), 'emptyView')
    );
  }
  get effectiveErrorView(): TemplateRef<any> | undefined {
    return (
      this.errorStateTemplate ||
      this.errorView ||
      this.templatesService.resolveTemplate(this.templatesService.getGroupTemplates(), 'errorView')
    );
  }

  // ==================== Output Events ====================

  /**
   * Emitted when a group item is clicked
   * @see Requirements 11.4
   */
  @Output() itemClick = new EventEmitter<CometChat.Group>();

  /**
   * Emitted when a group is selected or deselected
   * @see Requirements 11.5
   */
  @Output() select = new EventEmitter<{ group: CometChat.Group; selected: boolean }>();

  /**
   * Emitted when an error occurs during data fetching
   * @see Requirements 14.4
   */
  @Output() error = new EventEmitter<CometChat.CometChatException>();

  /**
   * Emitted when selection state changes via any method (click, keyboard, range selection)
   * Provides comprehensive selection state including mode, selected IDs, and last selected ID
   * @see Requirements 9.1, 9.2
   */
  @Output() selectionChange = new EventEmitter<SelectionState>();

  // ==================== Component State ====================

  /**
   * List of groups to display
   */
  groupList: CometChat.Group[] = [];

  /**
   * Current fetch state of the component
   */
  fetchState: States = States.loading;

  /**
   * Last error that occurred during fetch
   */
  lastError: Error | null = null;

  /**
   * Current search text
   */
  searchText = '';

  /**
   * Set of selected group GUIDs (for tracking selection)
   */
  selectedGroups = new Set<string>();

  /**
   * Index of the currently focused item for keyboard navigation
   */
  focusedIndex = -1;

  /**
   * Signal-based state for tracking the last selected index (anchor point for shift-click range selection)
   * @see Requirements 5.5, 5.6
   */
  lastSelectedIndex = signal(-1);

  /**
   * Signal-based state for tracking if more groups are being fetched
   * @see Requirements 4.4, 4.7
   */
  isFetchingMore = signal(false);

  /**
   * Signal-based state for tracking if more groups are available
   * @see Requirements 4.4, 4.8
   */
  hasMore = signal(true);

  // ==================== Private State ====================

  /**
   * Subject for component destruction cleanup
   */
  private destroy$ = new Subject<void>();

  /**
   * Subject for search input debouncing
   * @see Requirements 12.3
   */
  private searchSubject$ = new Subject<string>();

  /**
   * Flag to track if this is the first fetch (for empty state detection)
   */
  private isFirstFetch = true;

  /**
   * Subscription for ccGroupCreated event
   */
  private groupCreatedSubscription?: Subscription;

  /**
   * Subscription for ccGroupDeleted event
   */
  private groupDeletedSubscription?: Subscription;

  /**
   * Subscription for ccGroupLeft event
   */
  private groupLeftSubscription?: Subscription;

  /**
   * Subscription for ccGroupMemberJoined event
   */
  private groupMemberJoinedSubscription?: Subscription;

  /**
   * Subscription for ccGroupMemberKicked event
   */
  private groupMemberKickedSubscription?: Subscription;

  /**
   * Subscription for ccGroupMemberBanned event
   */
  private groupMemberBannedSubscription?: Subscription;

  /**
   * Subscription for ccGroupMemberAdded event
   */
  private groupMemberAddedSubscription?: Subscription;

  /**
   * Subscription for ccOwnershipChanged event
   */
  private ownershipChangedSubscription?: Subscription;

  // ==================== Exposed Enums ====================

  /**
   * Expose SelectionMode enum to template
   */
  readonly SelectionMode = SelectionMode;

  /**
   * Expose States enum to template
   */
  readonly States = States;

  // ==================== Lifecycle Hooks ====================

  /**
   * Initialize the component
   * Sets up GroupsService and triggers initial data fetch
   * @see Requirements 10.6
   */
  ngOnInit(): void {
    this.groupsService.setErrorCallback((error) => {
      this.lastError = error as unknown as Error;
      this.error.emit(error);
    });
    this.initializeGroupsManager();
    this.setupSearchDebouncing();
    this.setupGroupListeners();
    this.setupGroupEventSubscriptions();
    this.setupConnectionListener();
    this.fetchNextAndAppendGroups();
  }

  /**
   * Cleanup on component destruction
   * Removes SDK listeners and completes subjects
   * @see Requirements 24.5
   */
  ngOnDestroy(): void {
    this.pendingTimers.forEach(t => clearTimeout(t));
    this.pendingTimers = [];
    // Complete subjects
    this.destroy$.next();
    this.destroy$.complete();

    // Cleanup service (detaches SDK listeners, resets state)
    this.groupsService.cleanup();

    // Unsubscribe from group events
    this.removeGroupEventSubscriptions();
  }

  // ==================== Initialization Methods ====================

  /**
   * Initialize the GroupsService with appropriate request builders
   * @private
   * @see Requirements 10.6
   */
  private initializeGroupsManager(): void {
    this.groupsService.initialize({
      searchText: this.searchText,
      groupsRequestBuilder: this.groupsRequestBuilder || null,
      searchRequestBuilder: this.searchRequestBuilder || null,
      groupsSearchText: '',
    });

    // Reset component-level state for new initialization
    this.groupList = [];
    this.fetchState = States.loading;
    this.isFirstFetch = true;
    this.hasMore.set(true);
  }

  /**
   * Setup search input debouncing
   * @private
   * @see Requirements 12.3
   */
  private setupSearchDebouncing(): void {
    this.searchSubject$
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(searchText => {
        this.handleSearchTextChange(searchText);
      });
  }

  // ==================== Real-time Listener Methods ====================

  /**
   * Set up SDK GroupListener for real-time group events
   * @private
   * @see Requirements 13.1
   */
  private setupGroupListeners(): void {
    this.groupsService.attachListeners();
  }

  /**
   * Remove SDK GroupListener — handled by service cleanup
   * @private
   * @see Requirements 24.5
   */
  private removeGroupListeners(): void {
    // No-op: service manages its own listener lifecycle via cleanup()
  }

  /**
   * Handle actions from real-time SDK group events.
   * The service handles SDK events internally and updates its Signals.
   * This method is kept for UI event subscriptions that call updateGroup/removeGroup/prependGroup.
   * @private
   */

  /**
   * Subscribe to CometChatGroupEvents for UI events
   * @private
   * @see Requirements 13.8, 13.9, 13.10, 13.11
   */
  private setupGroupEventSubscriptions(): void {
    // Subscribe to group created event
    this.groupCreatedSubscription = CometChatGroupEvents.ccGroupCreated.subscribe(
      (group: CometChat.Group) => {
        this.groupsService.prependGroup(group);
        this.syncStateFromService();
      }
    );

    // Subscribe to group deleted event
    this.groupDeletedSubscription = CometChatGroupEvents.ccGroupDeleted.subscribe(
      (group: CometChat.Group) => {
        this.groupsService.removeGroup(group.getGuid());
        this.syncStateFromService();
        // Also remove from selection if selected
        this.selectedGroups.delete(group.getGuid());
      }
    );

    // Subscribe to group left event
    this.groupLeftSubscription = CometChatGroupEvents.ccGroupLeft.subscribe(
      (data: {
        userLeft: CometChat.User;
        leftGroup: CometChat.Group;
        message: CometChat.Action;
      }) => {
        // If private group, remove from list; otherwise update
        if (data.leftGroup.getType() === 'private') {
          this.groupsService.removeGroup(data.leftGroup.getGuid());
          this.selectedGroups.delete(data.leftGroup.getGuid());
        } else {
          this.groupsService.updateGroup(data.leftGroup);
        }
        this.syncStateFromService();
      }
    );

    // Subscribe to group member joined event
    this.groupMemberJoinedSubscription = CometChatGroupEvents.ccGroupMemberJoined.subscribe(
      (data: { joinedUser: CometChat.User; joinedGroup: CometChat.Group }) => {
        this.groupsService.updateGroup(data.joinedGroup);
        this.syncStateFromService();
      }
    );

    // Subscribe to group member kicked event
    this.groupMemberKickedSubscription = CometChatGroupEvents.ccGroupMemberKicked.subscribe(
      (data: {
        kickedUser: CometChat.User;
        kickedBy: CometChat.User;
        kickedFrom: CometChat.Group;
        message: CometChat.Action;
      }) => {
        this.groupsService.updateGroup(data.kickedFrom);
        this.syncStateFromService();
      }
    );

    // Subscribe to group member banned event
    this.groupMemberBannedSubscription = CometChatGroupEvents.ccGroupMemberBanned.subscribe(
      (data: {
        kickedUser: CometChat.User;
        kickedBy: CometChat.User;
        kickedFrom: CometChat.Group;
        message: CometChat.Action;
      }) => {
        this.groupsService.updateGroup(data.kickedFrom);
        this.syncStateFromService();
      }
    );

    // Subscribe to group member added event
    this.groupMemberAddedSubscription = CometChatGroupEvents.ccGroupMemberAdded.subscribe(
      (data: {
        messages: CometChat.Action[];
        usersAdded: CometChat.User[];
        userAddedIn: CometChat.Group;
        userAddedBy: CometChat.User;
      }) => {
        this.groupsService.updateGroup(data.userAddedIn);
        this.syncStateFromService();
      }
    );

    // Subscribe to ownership changed event
    this.ownershipChangedSubscription = CometChatGroupEvents.ccOwnershipChanged.subscribe(
      (data: { group: CometChat.Group; newOwner: CometChat.GroupMember }) => {
        this.groupsService.updateGroup(data.group);
        this.syncStateFromService();
      }
    );
  }

  /**
   * Unsubscribe from CometChatGroupEvents
   * @private
   * @see Requirements 24.5
   */
  private removeGroupEventSubscriptions(): void {
    this.groupCreatedSubscription?.unsubscribe();
    this.groupDeletedSubscription?.unsubscribe();
    this.groupLeftSubscription?.unsubscribe();
    this.groupMemberJoinedSubscription?.unsubscribe();
    this.groupMemberKickedSubscription?.unsubscribe();
    this.groupMemberBannedSubscription?.unsubscribe();
    this.groupMemberAddedSubscription?.unsubscribe();
    this.ownershipChangedSubscription?.unsubscribe();
  }

  /**
   * Set up connection listener for reconnection handling
   * @private
   * @see Requirements 13.12
   */
  private setupConnectionListener(): void {
    this.groupsService.attachConnectionListener(() => {
      this.refreshGroupList();
    });
  }

  /**
   * Remove connection listener — handled by service cleanup
   * @private
   * @see Requirements 24.5
   */
  private removeConnectionListener(): void {
    // No-op: service manages its own listener lifecycle via cleanup()
  }

  /**
   * Update a group in the list via the service
   * @param group - The updated group object
   * @private
   */
  private updateGroup(group: CometChat.Group): void {
    this.groupsService.updateGroup(group);
    this.syncStateFromService();
  }

  /**
   * Remove a group from the list via the service
   * @param guid - The GUID of the group to remove
   * @private
   */
  private removeGroupFromList(guid: string): void {
    this.groupsService.removeGroup(guid);

    // Also remove from selection if selected
    this.selectedGroups.delete(guid);

    this.syncStateFromService();
  }

  /**
   * Prepend a group to the list via the service
   * @param group - The group to prepend
   * @private
   */
  private prependGroup(group: CometChat.Group): void {
    this.groupsService.prependGroup(group);
    this.syncStateFromService();
  }

  /**
   * Refresh the group list after reconnection
   * @private
   * @see Requirements 13.12
   */
  private refreshGroupList(): void {
    this.groupList = [];
    this.initializeGroupsManager();
    this.fetchNextAndAppendGroups();
  }

  // ==================== Paginated List Event Handlers ====================

  /**
   * Handles loadMore event from CometChatPaginatedList
   * Triggers fetch of next page of groups and notifies paginated list when complete
   * @see Requirements 4.6, 4.7
   */
  handleLoadMore(): void {
    // Prevent concurrent fetches
    if (this.isFetchingMore() || !this.hasMore()) {
      return;
    }

    this.fetchNextAndAppendGroups();
  }

  // ==================== Data Fetching Methods ====================

  /**
   * Fetches the next page of groups and appends them to the list
   * @see Requirements 10.7, 10.8
   */
  fetchNextAndAppendGroups(): void {
    if (this.isFetchingMore() || !this.hasMore()) {
      return;
    }

    this.isFetchingMore.set(true);

    const isFirstFetch = this.isFirstFetch;

    if (isFirstFetch) {
      this.fetchState = States.loading;
      this.cdr.markForCheck();
    }

    this.groupsService
      .fetchNext()
      .then(() => {
        this.isFetchingMore.set(false);
        this.syncStateFromService();
        this.isFirstFetch = false;

        // Notify paginated list that loading is complete
        this.paginatedList?.loadComplete();
      })
      .catch(() => {
        // Service handles error state internally; sync it
        this.isFetchingMore.set(false);
        this.syncStateFromService();

        // Notify paginated list that loading is complete even on error
        this.paginatedList?.loadComplete();
      });
  }

  /**
   * Syncs component-level state from the service's Signals.
   * This bridges the service's Signal-based state to the component's
   * properties that the template binds to.
   * @private
   */
  private syncStateFromService(): void {
    this.groupList = this.groupsService.groups();
    this.fetchState = this.groupsService.fetchState();
    this.hasMore.set(this.groupsService.hasMore());
    // Clear lastError on successful fetch (non-error state)
    if (this.fetchState !== States.error) {
      this.lastError = null;
    }
    this.cdr.markForCheck();
  }

  // ==================== Search Methods ====================

  /**
   * Handles search input from the search bar
   * @param searchText - The search text entered by user
   * @see Requirements 12.2
   */
  onSearch(searchText: string): void {
    this.searchSubject$.next(searchText);
  }

  /**
   * Handles the debounced search text change
   * @param searchText - The debounced search text
   * @private
   * @see Requirements 12.3, 12.4, 12.5
   */
  private handleSearchTextChange(searchText: string): void {
    this.searchText = searchText;
    this.groupList = [];

    this.groupsService.search(searchText, {
      groupsRequestBuilder: this.groupsRequestBuilder || null,
      searchRequestBuilder: this.searchRequestBuilder || null,
    });

    this.isFirstFetch = true;
    this.hasMore.set(true);
    this.fetchNextAndAppendGroups();
  }

  // ==================== Utility Methods ====================

  /**
   * TrackBy function for ngFor optimization
   * @param _index - Item index (unused)
   * @param group - Group object
   * @returns Group GUID for tracking
   */
  trackByGroup(_index: number, group: CometChat.Group): string {
    return group.getGuid();
  }

  /**
   * Gets the member count text for a group
   * @param group - The group object
   * @returns Localized member count string
   * @see Requirements 9.4, 9.6
   */
  getMemberCountText(group: CometChat.Group): string {
    const count = group.getMembersCount();
    return count === 1 ? 'group_member' : 'group_members';
  }

  /**
   * Gets the group type for display
   * @param group - The group object
   * @returns Group type string
   * @see Requirements 9.5
   */
  getGroupType(group: CometChat.Group): string {
    return group.getType();
  }

  // ==================== Selection Methods ====================

  /**
   * Handles group item click
   * Implements hybrid approach: checks for itemClick prop first, falls back to service
   * Emits itemClick event if prop is provided, otherwise updates ChatStateService
   * @param group - The clicked group
   * @see Requirements 11.4, AC 3.1, 3.2, 3.3
   */
  handleGroupClick(group: CometChat.Group): void {
    // Priority: Use prop if provided (backward compatibility)
    if (this.itemClick.observed) {
      this.itemClick.emit(group);
    } else {
      // Fall back to service if no prop provided
      this.chatStateService.setActiveGroup(group);
    }
  }

  /**
   * Handles selection change for a group
   * Updates selection state and emits select event
   * Supports shift-click range selection in multiple mode
   * @param group - The group being selected/deselected
   * @param event - Optional event object (for shift-click detection)
   * @see Requirements 11.2, 11.3, 11.5, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6
   */
  handleSelectionChange(group: CometChat.Group, event?: Event): void {
    const guid = group.getGuid();
    const currentIndex = this.groupList.findIndex(g => g.getGuid() === guid);
    const isCurrentlySelected = this.selectedGroups.has(guid);

    if (this.selectionMode === SelectionMode.single) {
      // Single selection: clear all and select new
      this.selectedGroups.clear();

      if (!isCurrentlySelected) {
        this.selectedGroups.add(guid);
      }

      this.select.emit({
        group,
        selected: !isCurrentlySelected,
      });

      // Emit selection change event
      this.emitSelectionChange(guid);
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
        if (isCurrentlySelected) {
          this.selectedGroups.delete(guid);
        } else {
          this.selectedGroups.add(guid);
        }

        this.select.emit({
          group,
          selected: !isCurrentlySelected,
        });

        // Update anchor point for next potential shift-click (Requirements 5.5)
        this.lastSelectedIndex.set(currentIndex);

        // Emit selection change event
        this.emitSelectionChange(guid);
      }
    }

    this.cdr.markForCheck();
  }

  /**
   * Handles shift+click range selection.
   * Selects or deselects all groups between the anchor point and clicked item.
   * The action (select/deselect) is determined by the clicked item's current state:
   * - If clicked item is selected → deselect all in range
   * - If clicked item is not selected → select all in range
   * @param startIndex - Starting index of the range (anchor point)
   * @param endIndex - Ending index of the range (currently clicked)
   * @private
   * @see Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6
   */
  private selectRange(startIndex: number, endIndex: number): void {
    const groups = this.groupList;
    const minIndex = Math.min(startIndex, endIndex);
    const maxIndex = Math.max(startIndex, endIndex);

    // Determine action based on clicked item's current state (Requirements 5.2, 5.3)
    const clickedGroup = groups[endIndex];
    const clickedId = clickedGroup.getGuid();
    const shouldDeselect = this.selectedGroups.has(clickedId);

    // Process all groups in range based on clicked item's state
    for (let i = minIndex; i <= maxIndex; i++) {
      const group = groups[i];
      const id = group.getGuid();

      if (shouldDeselect) {
        // Deselect: only process groups that are currently selected
        if (this.selectedGroups.has(id)) {
          this.selectedGroups.delete(id);
          this.select.emit({ group, selected: false });
        }
      } else {
        // Select: only process groups that are not currently selected
        if (!this.selectedGroups.has(id)) {
          this.selectedGroups.add(id);
          this.select.emit({ group, selected: true });
        }
      }
    }

    // Update lastSelectedIndex after range selection (Requirements 5.5)
    this.lastSelectedIndex.set(endIndex);

    // Emit single selectionChange event after all range selections
    this.emitSelectionChange(clickedId);
  }

  /**
   * Handles checkbox/radio change event from the selection controls
   * Wrapper method that extracts the native event for shift-click detection
   * @param group - The group being selected/deselected
   * @param changeEvent - The change event from checkbox/radio
   * @see Requirements 5.1
   */
  handleSelectionControlChange(group: CometChat.Group, changeEvent: Event): void {
    // Pass the event to handleSelectionChange for shift-click detection
    this.handleSelectionChange(group, changeEvent);
  }

  /**
   * Emits the selectionChange event with current selection state
   * Called after any selection change (click, keyboard, range selection)
   * @param lastSelectedId - The GUID of the last selected/deselected group, or null
   * @private
   * @see Requirements 9.1, 9.2
   */
  private emitSelectionChange(lastSelectedId: string | null): void {
    this.selectionChange.emit({
      mode: this.selectionMode,
      selectedIds: new Set(this.selectedGroups),
      lastSelectedId,
    });
  }

  /**
   * Selects all groups in the list.
   * Only works in multiple selection mode.
   * Emits individual select events for each newly selected group,
   * then emits a single selectionChange event after all selections.
   * Resets focusedIndex to avoid showing focus outline on first item.
   * @see Requirements 3.1, 3.2, 3.3, 9.3
   */
  selectAll(): void {
    if (this.selectionMode !== SelectionMode.multiple) {
      return;
    }

    // Reset focus state to avoid showing focus outline
    this.focusedIndex = -1;

    // Iterate through all groups and select those not already selected
    this.groupList.forEach(group => {
      const guid = group.getGuid();

      // Only emit select event for newly selected groups
      if (!this.selectedGroups.has(guid)) {
        this.selectedGroups.add(guid);

        // Emit individual select event for each newly selected group
        this.select.emit({
          group,
          selected: true,
        });
      }
    });

    // Emit single selectionChange event after all selections
    this.emitSelectionChange(null);

    this.cdr.markForCheck();
  }

  /**
   * Clears all selections.
   * Emits individual select events with selected=false for each previously selected group,
   * then emits a single selectionChange event after all deselections.
   * Resets the lastSelectedIndex anchor point for shift-click selection.
   * @see Requirements 4.1, 4.2, 4.3, 6.1, 9.4
   */
  clearSelection(): void {
    // Iterate through all groups to emit select events for those that were selected
    this.groupList.forEach(group => {
      const guid = group.getGuid();

      // Only emit select event for groups that were selected
      if (this.selectedGroups.has(guid)) {
        this.select.emit({
          group,
          selected: false,
        });
      }
    });

    // Clear selection state
    this.selectedGroups.clear();

    // Reset anchor point for shift-click selection
    this.lastSelectedIndex.set(-1);

    // Emit single selectionChange event after all deselections
    this.emitSelectionChange(null);

    this.cdr.markForCheck();
  }

  /**
   * Checks if a group is currently selected
   * @param group - The group to check
   * @returns True if the group is selected
   */
  isGroupSelected(group: CometChat.Group): boolean {
    return this.selectedGroups.has(group.getGuid());
  }

  /**
   * Checks if a group is currently active (highlighted)
   * Implements hybrid approach: checks activeGroup prop first, falls back to ChatStateService
   * @param group - The group to check
   * @returns True if the group is the active group
   * @see Requirements 8.3, 8.4, 8.5, 8.6
   */
  isGroupActive(group: CometChat.Group): boolean {
    // Check prop first (priority)
    if (this.activeGroup) {
      return group.getGuid() === this.activeGroup.getGuid();
    }
    // Fall back to ChatStateService
    const serviceActiveGroup = this.chatStateService.getActiveGroup();
    if (serviceActiveGroup) {
      return group.getGuid() === serviceActiveGroup.getGuid();
    }
    return false;
  }

  // ==================== Context Menu Methods ====================

  /**
   * Gets context menu options for a group
   * @param group - The group to get options for
   * @returns Array of CometChatOption items or empty array
   * @see Requirements 17.1, 17.2
   */
  getOptionsForGroup(group: CometChat.Group): CometChatOption[] {
    if (this.options) {
      return this.options(group);
    }
    return [];
  }

  /**
   * Handles context menu option click
   * @param option - The clicked option
   * @param group - The group the option was clicked for
   * @see Requirements 17.4
   */
  handleOptionClick(option: CometChatOption, group: CometChat.Group): void {
    if (option.onClick) {
      option.onClick();
    }
  }

  // ==================== Scroll Methods ====================
  // ==================== Accessibility Methods ====================

  /**
   * Gets the ARIA label for a group item
   * Includes group name, type, and member count for screen readers
   * @param group - The group object
   * @returns Accessible label string
   * @see Requirements 19.2, 19.4, 19.5
   */
  getGroupAriaLabel(group: CometChat.Group): string {
    const name = group.getName() || '';
    const type = group.getType();
    const count = group.getMembersCount();
    const memberText = count === 1 ? 'member' : 'members';
    return `${name}, ${type} group, ${count} ${memberText}`;
  }

  // ==================== Keyboard Navigation Methods ====================

  /**
   * Handles focus event on the list container
   * When the list receives focus via Tab key, highlights the first item
   * @see Requirements 2.1
   */
  @HostListener('focus')
  handleListFocus(): void {
    // Only highlight first item if no item is currently focused and list has items
    if (this.focusedIndex === -1 && this.groupList.length > 0) {
      this.focusedIndex = 0;
      this.cdr.markForCheck();
      this.scrollFocusedItemIntoView();
    }
  }

  /**
   * Handles keyboard events for navigation and selection
   * Implements arrow key navigation, Enter for selection, Space for checkbox toggle,
   * Cmd+A for select all, Cmd+Shift+A for deselect all, and Escape to clear search/selections
   * @param event - The keyboard event
   * @see Requirements 18.1, 18.2, 18.4, 18.6, 3.4, 3.5, 4.4, 4.5, 6.3, 6.4, 7.1-7.6
   */
  @HostListener('keydown', ['$event'])
  handleKeydown(event: KeyboardEvent): void {
    // Delegate to onGroupsKeyDown for accessibility-enhanced keyboard handling
    this.onGroupsKeyDown(event);
  }

  /**
   * Handles keyboard events for the groups list with type-ahead search support.
   * Implements:
   * - Type-ahead search for character-based navigation (Req 7.4)
   * - Selection shortcuts (Space, Shift+Space, Shift+Arrow, Ctrl+A, Escape) (Req 7.3)
   * - Arrow key navigation (Req 7.1)
   * - Enter for item activation (Req 7.2)
   *
   * @param event - The keyboard event
   * @see Requirements 7.1-7.6
   */
  onGroupsKeyDown(event: KeyboardEvent): void {
    const host: ListKeyboardHost<CometChat.Group> = {
      itemList: this.groupList,
      fetchState: this.fetchState,
      selectionMode: this.selectionMode,
      focusedIndex: this.focusedIndex,
      componentClass: 'cometchat-groups',
      searchBarClass: 'cometchat-groups__search-bar',
      selectedCount: this.selectedGroups.size,
      cdr: this.cdr,
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
      handleTypeAhead: (key, focusedIdx) =>
        this.typeAheadService.handleCharacter(key, this.groupList, focusedIdx, {
          getSearchText: (group: CometChat.Group) => group.getName() || '',
        }),
    };

    handleListKeyDown(event, host);

    // Sync back focusedIndex if it changed
    if (host.focusedIndex !== this.focusedIndex) {
      this.focusedIndex = host.focusedIndex;
    }
  }

  /**
   * Handles selection-related keyboard shortcuts.
   * Implements Space for toggle, Shift+Space for range, Shift+Arrow for extend.
   *
   * @param event - The keyboard event
   * @param isInSearchBar - Whether focus is in the search bar
   * @returns True if the event was handled, false otherwise
   * @see Requirements 7.3, 13.3-13.7
   */
  /**
   * Selection keyboard handling is now delegated to the shared
   * handleSelectionKeyboard utility via handleListKeyDown.
   * This method is kept as a no-op for any remaining direct callers.
   */

  /**
   * Extends selection to include the item at the given index.
   * Used for Shift+Arrow selection extension.
   *
   * @param index - The index of the item to extend selection to
   * @see Requirements 13.4, 13.5
   */
  private extendSelectionTo(index: number): void {
    if (index < 0 || index >= this.groupList.length) return;

    const group = this.groupList[index];
    const guid = group.getGuid();

    // Add to selection without toggling
    if (!this.selectedGroups.has(guid)) {
      this.selectedGroups.add(guid);
      this.select.emit({ group, selected: true });
      this.emitSelectionChange(guid);
    }
  }

  /**
   * Selects range from anchor point to current index.
   * Used for Shift+Space range selection.
   *
   * @param currentIndex - The current focused index
   * @see Requirements 13.4
   */
  private selectRangeFromAnchor(currentIndex: number): void {
    const anchorIndex = this.lastSelectedIndex();
    if (anchorIndex === -1) {
      // No anchor, just select current item
      if (currentIndex >= 0 && currentIndex < this.groupList.length) {
        this.handleSelectionChange(this.groupList[currentIndex]);
      }
      return;
    }

    this.selectRange(anchorIndex, currentIndex);
  }

  /**
   * Focuses the item at the given index by finding and focusing the DOM element.
   *
   * @param index - The index of the item to focus
   */
  private focusItemAtIndex(index: number): void {
    this.pendingTimers.push(setTimeout(() => {
      if (!this.listContainer) return;

      const focusedElement = this.listContainer.nativeElement.querySelector(
        `[data-index="${index}"] cometchat-group-item`
      );

      if (focusedElement) {
        const focusableElement = focusedElement.querySelector('[tabindex="0"]') as HTMLElement;
        if (focusableElement) {
          focusableElement.focus();
        }
      }
    }, 0));
  }

  /**
   * Announces the current selection count to screen readers.
   * @see Requirements 13.6
   */
  private announceSelectionCount(): void {
    const count = this.selectedGroups.size;
    const message = CometChatLocalize.getLocalizedString('accessibility_items_selected').replace(
      '{count}',
      count.toString()
    );
    this.liveAnnouncer.announce(message, 'polite');
  }

  /**
   * Announces that selection has been cleared to screen readers.
   * @see Requirements 13.7
   */
  private announceSelectionCleared(): void {
    const message = CometChatLocalize.getLocalizedString('accessibility_selection_cleared');
    this.liveAnnouncer.announce(message, 'polite');
  }

  /**
   * Moves focus to the next item in the list
   * Wraps around to the first item when at the end
   * @private
   * @see Requirements 18.1, 2.2, 2.3
   */
  private focusNextItem(): void {
    if (this.groupList.length === 0) {
      return;
    }

    if (this.focusedIndex === -1) {
      this.focusedIndex = 0;
    } else if (this.focusedIndex < this.groupList.length - 1) {
      this.focusedIndex++;
    } else {
      this.focusedIndex = 0; // Wrap to first
    }

    this.cdr.markForCheck();
    this.scrollFocusedItemIntoView();
  }

  /**
   * Moves focus to the previous item in the list
   * Wraps around to the last item when at the beginning
   * @private
   * @see Requirements 18.1, 2.2, 2.4
   */
  private focusPreviousItem(): void {
    if (this.groupList.length === 0) {
      return;
    }

    if (this.focusedIndex === -1) {
      this.focusedIndex = this.groupList.length - 1;
    } else if (this.focusedIndex > 0) {
      this.focusedIndex--;
    } else {
      this.focusedIndex = this.groupList.length - 1; // Wrap to last
    }

    this.cdr.markForCheck();
    this.scrollFocusedItemIntoView();
  }

  /**
   * Handles when an item receives focus (via Tab key)
   * Syncs focusedIndex with browser focus state
   * @param index - The index of the item that received focus
   * @private
   */
  handleItemFocus(index: number): void {
    this.focusedIndex = index;
    this.cdr.markForCheck();
  }

  /**
   * Triggers item click on the currently focused item
   * @private
   * @see Requirements 18.2
   */
  private selectFocusedItem(): void {
    if (this.focusedIndex >= 0 && this.focusedIndex < this.groupList.length) {
      const group = this.groupList[this.focusedIndex];
      if (this.selectionMode !== SelectionMode.none) {
        this.handleSelectionChange(group);
      } else {
        this.handleGroupClick(group);
      }
    }
  }

  /**
   * Toggles selection of the currently focused item
   * @private
   * @see Requirements 18.4
   */
  private toggleFocusedItemSelection(): void {
    if (this.focusedIndex >= 0 && this.focusedIndex < this.groupList.length) {
      const group = this.groupList[this.focusedIndex];
      this.handleSelectionChange(group);
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
    if (this.searchText) {
      this.searchText = '';
      this.searchSubject$.next('');
      this.cdr.markForCheck();
      return;
    }

    // Priority 2: Clear selections if any exist (Requirement 6.1)
    if (this.selectionMode !== SelectionMode.none && this.selectedGroups.size > 0) {
      this.clearSelection();
    }

    // Reset focus (Requirement 6.2)
    this.focusedIndex = -1;

    // Blur any focused element (Requirement 6.3)
    (document.activeElement as HTMLElement)?.blur();

    this.cdr.markForCheck();
  }

  /**
   * Scrolls the focused item into view with smooth behavior
   * Uses data-index attribute to find the correct element
   * @private
   * @see Requirements 2.2, 2.3, 2.4, 2.5
   */
  private scrollFocusedItemIntoView(): void {
    // Use setTimeout to ensure DOM has updated with new focusedIndex
    this.pendingTimers.push(setTimeout(() => {
      if (!this.listContainer) {
        return;
      }

      const focusedElement = this.listContainer.nativeElement.querySelector(
        `[data-index="${this.focusedIndex}"]`
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
   * Gets the tabindex for a group item based on focus state
   * @param index - The index of the group item
   * @returns 0 if focused or first item with no focus, -1 otherwise
   * @see Requirements 18.7, 18.8
   */
  getTabIndex(index: number): number {
    if (this.focusedIndex === index) {
      return 0;
    }
    if (this.focusedIndex === -1 && index === 0) {
      return 0;
    }
    return -1;
  }

  /**
   * Handles focus events within the groups list
   * @param event - The focus event
   * @param index - The index of the focused item
   * @see Requirements 18.7
   */
  handleFocusIn(event: FocusEvent, index: number): void {
    if (this.focusedIndex !== index) {
      this.focusedIndex = index;
      this.cdr.markForCheck();
    }
  }

  /**
   * Handles mousedown event to prevent focus on mouse click.
   * This ensures focus ring only appears for keyboard navigation, not mouse clicks.
   * @param event - The DOM mousedown event
   */
  handleMouseDown(event: MouseEvent): void {
    // Prevent the element from receiving focus on mouse click
    // This ensures focus ring only appears for keyboard navigation
    event.preventDefault();
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
    // Check if click is outside of group items
    const isOnItem = target.closest('.cometchat-group-item') !== null;
    const isOnSelectionControl =
      target.closest('cometchat-checkbox') !== null ||
      target.closest('cometchat-radio-button') !== null;
    const isOnSearchBar = target.closest('cometchat-search-bar') !== null;

    if (!isOnItem && !isOnSelectionControl && !isOnSearchBar) {
      this.focusedIndex = -1;
      (document.activeElement as HTMLElement)?.blur();
      this.cdr.markForCheck();
    }
  }

  /**
   * Handles focus events within the groups list
   * Syncs the focusedIndex when an item receives focus via Tab or click
   * @param event - The focus event
   * @see Requirements 18.7
   */
  handleFocusInEvent(event: FocusEvent): void {
    const target = event.target as HTMLElement;
    if (!target) return;

    // Check if the focused element is the inner div with class 'cometchat-group-item'
    // or is within a group item
    const groupItemDiv = target.classList.contains('cometchat-group-item')
      ? target
      : target.closest('.cometchat-group-item');
    if (!groupItemDiv) return;

    // Find the wrapper - go up to find cometchat-groups__list-item-wrapper
    const wrapper = groupItemDiv.closest('.cometchat-groups__list-item-wrapper');
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

    if (index !== -1 && this.focusedIndex !== index) {
      this.focusedIndex = index;
      this.cdr.markForCheck();
    }
  }

  /**
   * Handles retry button click in error state.
   * Shows loading state, then re-fetches groups.
   */
  handleRetryClick(): void {
    this.lastError = null;
    this.fetchState = States.loading;
    this.cdr.markForCheck();
    this.initializeGroupsManager();
    this.fetchNextAndAppendGroups();
  }
}
