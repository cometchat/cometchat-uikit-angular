/**
 * CometChatUsers Component
 *
 * A comprehensive component that displays a real-time list of users
 * with support for search, selection modes, and extensive customization.
 * This component follows Angular v21 best practices with a service-based
 * architecture where SDK interactions are handled by UsersService.
 *
 * Features:
 * - Real-time user status updates (online/offline)
 * - Multiple selection modes (none, single, multiple)
 * - Shift-click range selection in multiple mode
 * - Selected users preview with chips
 * - Alphabetical section headers
 * - Search functionality with debounce
 * - Custom template support for all sections
 * - Keyboard navigation and accessibility
 *
 * @module components/cometchat-users
 * @see Requirements 1.1, 1.2, 1.5, 1.6
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
  DestroyRef,
  booleanAttribute,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CometChat } from '@cometchat/chat-sdk-javascript';

// Event imports
import { CometChatUserEvents } from '../../events/CometChatUserEvents';

// Component imports
import { CometChatPaginatedListComponent } from '../cometchat-paginated-list/cometchat-paginated-list.component';
import { CometChatUserItemComponent } from '../cometchat-user-item/cometchat-user-item.component';
import { CometChatAvatarComponent } from '../base-elements/cometchat-avatar/cometchat-avatar.component';
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
import { UsersService } from '../../services/users.service';
import { ChatStateService } from '../../services/chat-state.service';
import { CometChatTemplatesService } from '../../services/templates.service';
import { COMETCHAT_GLOBAL_CONFIG, GlobalConfig } from '../../services/global-config.service';
import { TypeAheadService } from '../../services/type-ahead.service';
import { LiveAnnouncerService } from '../../services/live-announcer.service';
import { CometChatLocalize } from '../../resources/CometChatLocalize/cometchat-localize';
import { handleListKeyDown, ListKeyboardHost } from '../../utils/list-keyboard-handler';

/**
 * CometChatUsers displays a scrollable, searchable list of users with
 * real-time status updates and extensive customization options.
 *
 * @example
 * ```html
 * <!-- Basic usage -->
 * <cometchat-users
 *   (itemClick)="onUserClick($event)"
 *   (error)="onError($event)">
 * </cometchat-users>
 *
 * <!-- With selection mode -->
 * <cometchat-users
 *   [selectionMode]="SelectionMode.multiple"
 *   [showSelectedUsersPreview]="true"
 *   (select)="onUserSelect($event)">
 * </cometchat-users>
 *
 * <!-- With custom templates -->
 * <cometchat-users
 *   [subtitleView]="customSubtitle"
 *   [trailingView]="customTrailing">
 *   <ng-template #customSubtitle let-user>
 *     <span>{{ user.getStatus() }}</span>
 *   </ng-template>
 * </cometchat-users>
 * ```
 *
 * @see Requirements 1.1, 1.2, 1.5, 1.6
 */
@Component({
  selector: 'cometchat-users',
  standalone: true,
  imports: [
    CommonModule,
    CometChatPaginatedListComponent,
    CometChatUserItemComponent,
    CometChatAvatarComponent,
    CometChatCheckboxComponent,
    CometChatRadioButtonComponent,
    CometChatSearchBarComponent,
    TranslatePipe,
  ],
  templateUrl: './cometchat-users.component.html',
  styleUrls: ['./cometchat-users.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [UsersService],
})
export class CometChatUsersComponent implements OnInit, OnDestroy {
  /** @internal Timer references for cleanup */
  private pendingTimers: ReturnType<typeof setTimeout>[] = [];

  // ==================== Shared Constants ====================
  readonly shimmerList = CometChatUIKitConstants.shimmerList;

  // ==================== Service Injection ====================
  private cdr = inject(ChangeDetectorRef);
  private usersService = inject(UsersService);
  private chatStateService = inject(ChatStateService);
  private templatesService = inject(CometChatTemplatesService);
  private destroyRef = inject(DestroyRef);
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
   * @see Requirements 3.1, 3.7
   */
  @ViewChild('paginatedList') paginatedList?: CometChatPaginatedListComponent<CometChat.User>;

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
   * - Attribute syntax: <cometchat-users hideSearch>
   * - Property binding: <cometchat-users [hideSearch]="true">
   * @see Requirements 7.1, 7.2, 7.4
   */

  // Track if @Input was explicitly set (for global config priority system)
  private hideUserStatusExplicitlySet = signal(false);
  private showScrollbarExplicitlySet = signal(false);
  private hideErrorExplicitlySet = signal(false);

  // Private backing fields for tracked @Input properties
  private _hideUserStatus = signal(false);
  private _showScrollbar = signal(false);
  private _hideError = signal(false);

  /**
   * Whether to hide the search bar
   * @default false
   * @see Requirements 6.1
   */
  @Input({ transform: booleanAttribute }) hideSearch = false;

  /**
   * Whether to show alphabetical section headers
   * @default true
   * @see Requirements 2.5
   */
  @Input({ transform: booleanAttribute }) showSectionHeader = true;

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
   * Whether to disable the loading state (useful for maintaining list during search)
   * @default false
   * @see Requirements 15.4
   */
  @Input({ transform: booleanAttribute }) disableLoadingState = false;

  /**
   * Whether to hide user online/offline status indicator
   * @default false
   * @see Requirements 2.4, 8.1
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
   * Whether to show the selected users preview section (chips) in multiple selection mode
   * @default false
   * @see Requirements 5.1
   */
  @Input({ transform: booleanAttribute }) showSelectedUsersPreview = false;

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
   * @see Requirements 8.1, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8
   */
  effectiveHideUserStatus = computed(() => {
    if (this.hideUserStatusExplicitlySet()) {
      return this._hideUserStatus();
    }
    if (this.globalConfig?.hideUserStatus !== undefined) {
      return this.globalConfig.hideUserStatus;
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
   * Custom request builder for fetching users
   * Allows customization of user query parameters
   * @see Requirements 3.3
   */
  @Input() usersRequestBuilder?: CometChat.UsersRequestBuilder;

  /**
   * Custom request builder specifically for search queries
   * If not provided, usersRequestBuilder will be used for search
   * @see Requirements 3.4
   */
  @Input() searchRequestBuilder?: CometChat.UsersRequestBuilder;

  /**
   * Initial search keyword to filter users
   * @default ''
   * @see Requirements 6.4
   */
  @Input() searchKeyword = '';

  /**
   * Key to extract section header value from user object
   * Used for alphabetical grouping when showSectionHeader is true
   * @default 'getName'
   * @see Requirements 2.6
   */
  @Input() sectionHeaderKey: keyof CometChat.User = 'getName';

  /**
   * Currently active/highlighted user
   * @see Requirements 4.6
   */
  @Input() activeUser?: CometChat.User;

  /**
   * Selection mode for the user list
   * - none: No selection (default)
   * - single: Single selection with radio buttons
   * - multiple: Multiple selection with checkboxes
   * @default SelectionMode.none
   * @see Requirements 4.1
   */
  @Input() selectionMode: SelectionMode = SelectionMode.none;

  // ==================== Customization Inputs ====================

  /**
   * Function that returns context menu options for a user
   * @param user - The user to get options for
   * @returns Array of CometChatOption items
   * @see Requirements 17.1
   */
  @Input() options?: (user: CometChat.User) => CometChatOption[];

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
   * Custom template for rendering each user item
   * Receives user object as implicit context
   * @see Requirements 16.1
   */
  @Input() itemView?: TemplateRef<{ $implicit: CometChat.User }>;

  /**
   * Custom template for the leading section (avatar area)
   * Receives user object as implicit context
   * @see Requirements 16.2
   */
  @Input() leadingView?: TemplateRef<{ $implicit: CometChat.User }>;

  /**
   * Custom template for the title section
   * Receives user object as implicit context
   * @see Requirements 16.3
   */
  @Input() titleView?: TemplateRef<{ $implicit: CometChat.User }>;

  /**
   * Custom template for the subtitle section
   * Receives user object as implicit context
   * @see Requirements 16.4
   */
  @Input() subtitleView?: TemplateRef<{ $implicit: CometChat.User }>;

  /**
   * Custom template for the trailing section (selection controls area)
   * Receives user object as implicit context
   * @see Requirements 16.5
   */
  @Input() trailingView?: TemplateRef<{ $implicit: CometChat.User }>;

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
      this.templatesService.getUserTemplates().itemView
    );
  }
  get effectiveLeadingView(): TemplateRef<any> | undefined {
    return this.leadingView || this.templatesService.getUserTemplates().leadingView;
  }
  get effectiveTitleView(): TemplateRef<any> | undefined {
    return this.titleView || this.templatesService.getUserTemplates().titleView;
  }
  get effectiveSubtitleView(): TemplateRef<any> | undefined {
    return this.subtitleView || this.templatesService.getUserTemplates().subtitleView;
  }
  get effectiveTrailingView(): TemplateRef<any> | undefined {
    return this.trailingView || this.templatesService.getUserTemplates().trailingView;
  }
  get effectiveLoadingView(): TemplateRef<any> | undefined {
    return (
      this.loadingStateTemplate ||
      this.loadingView ||
      this.templatesService.resolveTemplate(this.templatesService.getUserTemplates(), 'loadingView')
    );
  }
  get effectiveEmptyView(): TemplateRef<any> | undefined {
    return (
      this.emptyStateTemplate ||
      this.emptyView ||
      this.templatesService.resolveTemplate(this.templatesService.getUserTemplates(), 'emptyView')
    );
  }
  get effectiveErrorView(): TemplateRef<any> | undefined {
    return (
      this.errorStateTemplate ||
      this.errorView ||
      this.templatesService.resolveTemplate(this.templatesService.getUserTemplates(), 'errorView')
    );
  }

  // ==================== Output Events ====================

  /**
   * Emitted when a user item is clicked
   * @see Requirements 4.4
   */
  @Output() itemClick = new EventEmitter<CometChat.User>();

  /**
   * Emitted when a user is selected or deselected
   * @see Requirements 4.5
   */
  @Output() select = new EventEmitter<{ user: CometChat.User; selected: boolean }>();

  /**
   * Emitted when an error occurs during data fetching
   * @see Requirements 14.4
   */
  @Output() error = new EventEmitter<CometChat.CometChatException>();

  /**
   * Emitted when the user list is empty after initial fetch
   * @see Requirements 14.7
   */
  @Output() empty = new EventEmitter<void>();

  /**
   * Emitted when selection state changes via any method (click, keyboard, range selection)
   * Provides comprehensive selection state including mode, selected IDs, and last selected ID
   * @see Requirements 9.1, 9.2
   */
  @Output() selectionChange = new EventEmitter<SelectionState>();

  // ==================== Component State ====================

  /**
   * List of users to display
   */
  userList: CometChat.User[] = [];

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
   * Set of selected user UIDs (for tracking selection)
   */
  selectedUsers = new Set<string>();

  /**
   * Map of selected users by UID (for preserving user objects across search)
   * @see Requirements 5.6
   */
  selectedUsersMap = new Map<string, CometChat.User>();

  /**
   * Index of the currently focused item for keyboard navigation
   */
  focusedIndex = -1;

  /**
   * Index of the last clicked item (anchor point for shift-click selection)
   * @see Requirements 4.8
   */
  lastClickedIndex: number | null = null;

  /**
   * UID of the last clicked user (anchor point for shift-click selection)
   * @see Requirements 4.8
   */
  lastClickedUserUid: string | null = null;

  // ==================== Signal-Based State for Pagination ====================

  /**
   * Signal indicating whether more users are currently being fetched
   * Used to show loading spinner at bottom during pagination
   * @see Requirements 3.6, 3.8
   */
  isFetchingMore = signal(false);

  /**
   * Signal indicating whether more users are available for pagination
   * Used to determine if loadMore should trigger additional fetches
   * @see Requirements 3.4, 3.7
   */
  hasMore = signal(true);

  // ==================== Private State ====================

  /**
   * Subject for component destruction cleanup
   * Kept for backward compatibility with existing subscriptions
   */
  private destroy$ = new Subject<void>();

  /**
   * Subject for search input debouncing
   * Uses takeUntilDestroyed for automatic cleanup
   * @see Requirements 6.3
   */
  private searchSubject$ = new Subject<string>();

  /**
   * Flag to track if this is the first fetch (for empty state detection)
   */
  private isFirstFetch = true;

  /**
   * Flag to track if initial load is complete (to skip scroll on first render)
   * Prevents page-level scroll jumps in Storybook docs mode
   */
  private initialLoadComplete = false;

  /**
   * Unique listener ID for SDK UserListener
   * @see Requirements 7.1
   */
  private userListenerId = `users_component_${Date.now()}`;

  /**
   * Subscription for ccUserBlocked event
   * @see Requirements 7.4
   */
  private userBlockedSubscription?: Subscription;

  /**
   * Subscription for ccUserUnblocked event
   * @see Requirements 7.5
   */
  private userUnblockedSubscription?: Subscription;

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
   * Sets up UsersService and triggers initial data fetch
   * @see Requirements 3.6
   */
  ngOnInit(): void {
    this.usersService.setErrorCallback((error) => {
      this.lastError = error as unknown as Error;
      this.error.emit(error);
    });
    this.initializeUsersManager();
    this.setupSearchDebouncing();
    this.setupUserListener();
    this.setupUserEventSubscriptions();
    this.setupConnectionListener();
    this.fetchNextAndAppendUsers();
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

    // Remove SDK user listener
    this.removeUserListener();

    // Cleanup service (detaches connection listener, resets state)
    this.usersService.cleanup();

    // Unsubscribe from user events
    this.removeUserEventSubscriptions();
  }

  // ==================== Initialization Methods ====================

  /**
   * Initialize the UsersService with appropriate request builders
   * @private
   * @see Requirements 3.6
   */
  private initializeUsersManager(): void {
    // Get the pre-configured search text from usersRequestBuilder if any
    const usersSearchText = this.searchKeyword || '';

    this.usersService.initialize({
      searchText: this.searchText || usersSearchText,
      usersRequestBuilder: this.usersRequestBuilder || null,
      searchRequestBuilder: this.searchRequestBuilder || null,
      usersSearchText: usersSearchText,
    });

    // Reset component-level state for new initialization
    this.userList = [];
    this.fetchState = States.loading;
    this.isFirstFetch = true;
    this.hasMore.set(true);
  }

  /**
   * Setup search input debouncing
   * Uses takeUntilDestroyed for automatic cleanup
   * @private
   * @see Requirements 6.3, 5.1, 5.2
   */
  private setupSearchDebouncing(): void {
    this.searchSubject$
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(searchText => {
        this.handleSearchTextChange(searchText);
      });
  }

  // ==================== Real-time Listener Methods ====================

  /**
   * Set up SDK UserListener for online/offline status updates
   * Listens for onUserOnline and onUserOffline events and updates the user in the list
   * @private
   * @see Requirements 7.1, 7.2, 7.3
   */
  private setupUserListener(): void {
    try {
      CometChat.addUserListener(
        this.userListenerId,
        new CometChat.UserListener({
          onUserOnline: (user: CometChat.User) => {
            this.updateUser(user);
          },
          onUserOffline: (user: CometChat.User) => {
            this.updateUser(user);
          },
        })
      );
    } catch (error) {
      console.error('[CometChatUsers] Error setting up user listener:', error);
    }
  }

  /**
   * Remove SDK UserListener
   * @private
   * @see Requirements 24.5
   */
  private removeUserListener(): void {
    try {
      CometChat.removeUserListener(this.userListenerId);
    } catch (error) {
      console.error('[CometChatUsers] Error removing user listener:', error);
    }
  }

  /**
   * Subscribe to CometChatUserEvents for blocked/unblocked events
   * @private
   * @see Requirements 7.4, 7.5, 7.6
   */
  private setupUserEventSubscriptions(): void {
    // Subscribe to user blocked event
    this.userBlockedSubscription = CometChatUserEvents.ccUserBlocked.subscribe(
      (user: CometChat.User) => {
        this.updateUser(user);
      }
    );

    // Subscribe to user unblocked event
    this.userUnblockedSubscription = CometChatUserEvents.ccUserUnblocked.subscribe(
      (user: CometChat.User) => {
        this.updateUser(user);
      }
    );
  }

  /**
   * Unsubscribe from CometChatUserEvents
   * @private
   * @see Requirements 24.5
   */
  private removeUserEventSubscriptions(): void {
    if (this.userBlockedSubscription) {
      this.userBlockedSubscription.unsubscribe();
      this.userBlockedSubscription = undefined;
    }

    if (this.userUnblockedSubscription) {
      this.userUnblockedSubscription.unsubscribe();
      this.userUnblockedSubscription = undefined;
    }
  }

  /**
   * Set up connection listener for reconnection handling
   * On reconnection, refreshes the user list
   * @private
   * @see Requirements 7.7, 7.8
   */
  private setupConnectionListener(): void {
    this.usersService.attachConnectionListener(() => {
      // On reconnection, refresh the user list
      this.refreshUserList();
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
   * Update a user in the list when their status changes
   * Finds the user by UID and replaces with the updated user object
   * @param user - The updated user object
   * @private
   * @see Requirements 7.2, 7.3, 7.5
   */
  private updateUser(user: CometChat.User): void {
    this.usersService.updateUser(user);
    this.syncStateFromService();
  }

  /**
   * Refresh the user list after reconnection
   * Resets the list and fetches fresh data
   * @private
   * @see Requirements 7.8
   */
  private refreshUserList(): void {
    // Reset the user list
    this.userList = [];

    // Reinitialize the service to reset pagination
    this.initializeUsersManager();

    // Fetch fresh data
    this.fetchNextAndAppendUsers();
  }

  // ==================== Data Fetching Methods ====================

  /**
   * Fetches the next page of users and appends them to the list
   * Handles loading states and emits empty event when appropriate
   * @see Requirements 3.7, 3.8, 3.9, 14.7
   */
  fetchNextAndAppendUsers(): void {
    if (this.isFetchingMore() || !this.hasMore()) {
      return;
    }

    this.isFetchingMore.set(true);

    const isFirstFetch = this.isFirstFetch;

    if (isFirstFetch && !this.disableLoadingState) {
      this.fetchState = States.loading;
      this.cdr.markForCheck();
    }

    this.usersService
      .fetchNext()
      .then(() => {
        this.isFetchingMore.set(false);
        this.syncStateFromService();

        // Emit empty event if first fetch returned no results
        if (isFirstFetch && this.usersService.fetchState() === States.empty) {
          this.empty.emit();
        }

        this.isFirstFetch = false;

        // Mark initial load as complete after first successful fetch
        // This enables scroll-into-view behavior for subsequent navigation
        if (!this.initialLoadComplete) {
          // Use setTimeout to ensure DOM is fully rendered before enabling scroll
          this.pendingTimers.push(setTimeout(() => {
            this.initialLoadComplete = true;
          }, 100));
        }

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
   * Handles loadMore event from CometChatPaginatedList
   * Triggers fetch of next page of users and notifies paginated list when complete
   * @see Requirements 3.6, 3.7
   */
  handleLoadMore(): void {
    // Prevent concurrent fetches
    if (this.isFetchingMore() || !this.hasMore()) {
      return;
    }

    this.fetchNextAndAppendUsers();
  }

  /**
   * Syncs component-level state from the service's Signals.
   * This bridges the service's Signal-based state to the component's
   * properties that the template binds to.
   * @private
   */
  private syncStateFromService(): void {
    this.userList = this.usersService.users();
    this.fetchState = this.usersService.fetchState();
    this.hasMore.set(this.usersService.hasMore());
    // Clear lastError on successful fetch (non-error state)
    if (this.fetchState !== States.error) {
      this.lastError = null;
    }
    this.cdr.markForCheck();
  }

  // ==================== Search Methods ====================

  /**
   * Handles search input from the search bar
   * Triggers debounced search
   * @param searchText - The search text entered by user
   * @see Requirements 6.2
   */
  onSearch(searchText: string): void {
    this.searchSubject$.next(searchText);
  }

  /**
   * Handles the debounced search text change
   * Creates a new UsersService search and fetches users
   * @param searchText - The debounced search text
   * @private
   * @see Requirements 6.3, 6.5, 6.6
   */
  private handleSearchTextChange(searchText: string): void {
    this.searchText = searchText;
    this.userList = [];

    this.usersService.search(searchText, {
      usersRequestBuilder: this.usersRequestBuilder || null,
      searchRequestBuilder: this.searchRequestBuilder || null,
      usersSearchText: this.searchKeyword || '',
    });

    this.isFirstFetch = true;
    this.hasMore.set(true);
    this.fetchNextAndAppendUsers();
  }

  // ==================== Utility Methods ====================

  /**
   * TrackBy function for ngFor optimization
   * @param _index - Item index (unused)
   * @param user - User object
   * @returns User UID for tracking
   */
  trackByUser(_index: number, user: CometChat.User): string {
    return user.getUid();
  }

  // ==================== Section Header Methods ====================

  /**
   * Determines if a section header should be shown before the user at the given index
   * @param index - The index of the user in the list
   * @returns True if a section header should be shown
   * @see Requirements 2.5, 2.6
   */
  shouldShowSectionHeader(index: number): boolean {
    if (!this.showSectionHeader || this.userList.length === 0) {
      return false;
    }

    const currentUser = this.userList[index];
    const currentHeader = this.getSectionHeaderValue(currentUser);

    // Show header for first item
    if (index === 0) {
      return true;
    }

    // Show header if different from previous user's header
    const previousUser = this.userList[index - 1];
    const previousHeader = this.getSectionHeaderValue(previousUser);

    return currentHeader !== previousHeader;
  }

  /**
   * Gets the section header value for a user
   * Extracts the first character of the value from sectionHeaderKey
   * @param user - The user object
   * @returns The section header character (uppercase)
   * @see Requirements 2.6
   */
  getSectionHeaderValue(user: CometChat.User): string {
    try {
      // Default to getName method
      const name = user.getName();
      if (name && typeof name === 'string') {
        return name.charAt(0).toUpperCase();
      }
      return '#';
    } catch {
      return '#';
    }
  }

  // ==================== Selection Methods ====================

  /**
   * Handles user item click
   * Implements hybrid approach: checks for itemClick prop first, falls back to service
   * Emits itemClick event if prop is provided, otherwise updates ChatStateService
   * @param user - The clicked user
   * @see Requirements 4.4, AC 3.1, 3.2, 3.3
   */
  handleUserClick(user: CometChat.User): void {
    // Priority: Use prop if provided (backward compatibility)
    if (this.itemClick.observed) {
      this.itemClick.emit(user);
    } else {
      // Fall back to service if no prop provided
      this.chatStateService.setActiveUser(user);
    }
  }

  /**
   * Handles selection change for a user
   * Updates selection state and emits select event
   * Supports shift-click range selection in multiple mode
   * @param user - The user being selected/deselected
   * @param event - Optional event object (for shift-click detection)
   * @see Requirements 4.2, 4.3, 4.5, 4.7, 4.8, 4.9, 9.1, 9.2
   */
  handleSelectionChange(user: CometChat.User, event?: Event): void {
    const uid = user.getUid();
    const currentIndex = this.userList.findIndex(u => u.getUid() === uid);
    const isCurrentlySelected = this.selectedUsers.has(uid);

    if (this.selectionMode === SelectionMode.single) {
      // Single selection: clear all and select new (Requirements 4.2)
      this.selectedUsers.clear();
      this.selectedUsersMap.clear();

      if (!isCurrentlySelected) {
        this.selectedUsers.add(uid);
        this.selectedUsersMap.set(uid, user);
      }

      // Emit select event
      this.select.emit({
        user,
        selected: !isCurrentlySelected,
      });

      // Emit selection change event
      this.emitSelectionChange(uid);
    } else if (this.selectionMode === SelectionMode.multiple) {
      // Check for shift-click range selection (Requirements 4.7, 4.8, 4.9)
      const isShiftClick = event instanceof MouseEvent && event.shiftKey;

      if (isShiftClick && this.lastClickedIndex !== null && this.lastClickedUserUid !== null) {
        // Shift-click: select/deselect range
        this.handleShiftClickSelection(currentIndex, isCurrentlySelected);
        // Note: emitSelectionChange is called inside handleShiftClickSelection
      } else {
        // Normal click: toggle single selection (Requirements 4.3)
        if (isCurrentlySelected) {
          this.selectedUsers.delete(uid);
          this.selectedUsersMap.delete(uid);
        } else {
          this.selectedUsers.add(uid);
          this.selectedUsersMap.set(uid, user);
        }

        // Emit select event for single item
        this.select.emit({
          user,
          selected: !isCurrentlySelected,
        });

        // Update anchor point for next potential shift-click (Requirements 4.8)
        this.lastClickedIndex = currentIndex;
        this.lastClickedUserUid = uid;

        // Emit selection change event
        this.emitSelectionChange(uid);
      }
    }

    this.cdr.markForCheck();
  }

  /**
   * Handles shift-click range selection
   * Selects or deselects all users between anchor point and clicked item
   * The action (select/deselect) is determined by the clicked item's current state:
   * - If clicked item is selected → deselect all in range
   * - If clicked item is not selected → select all in range
   * @param clickedIndex - Index of the clicked user
   * @param shouldDeselect - Whether to deselect (true) or select (false) the range
   * @private
   * @see Requirements 4.7, 4.8, 4.9, 9.1, 9.2
   */
  private handleShiftClickSelection(clickedIndex: number, shouldDeselect: boolean): void {
    if (this.lastClickedIndex === null) {
      return;
    }

    // Determine range bounds
    const startIndex = Math.min(this.lastClickedIndex, clickedIndex);
    const endIndex = Math.max(this.lastClickedIndex, clickedIndex);

    // Get the clicked user's UID for the selectionChange event
    const clickedUser = this.userList[clickedIndex];
    const clickedUid = clickedUser ? clickedUser.getUid() : null;

    // Select or deselect all users in range based on clicked item's state
    for (let i = startIndex; i <= endIndex; i++) {
      const userInRange = this.userList[i];
      if (userInRange) {
        const userUid = userInRange.getUid();

        if (shouldDeselect) {
          // Deselect: only process users that are currently selected
          if (this.selectedUsers.has(userUid)) {
            this.selectedUsers.delete(userUid);
            this.selectedUsersMap.delete(userUid);
            this.select.emit({
              user: userInRange,
              selected: false,
            });
          }
        } else {
          // Select: only process users that are not currently selected
          if (!this.selectedUsers.has(userUid)) {
            this.selectedUsers.add(userUid);
            this.selectedUsersMap.set(userUid, userInRange);
            this.select.emit({
              user: userInRange,
              selected: true,
            });
          }
        }
      }
    }

    // Emit single selectionChange event after all range selections
    this.emitSelectionChange(clickedUid);

    // Update anchor point after range selection
    this.lastClickedIndex = clickedIndex;
    this.lastClickedUserUid = clickedUid;
  }

  /**
   * Handles checkbox/radio change event from the selection controls
   * Wrapper method that extracts the native event for shift-click detection
   * @param user - The user being selected/deselected
   * @param changeEvent - The change event from checkbox/radio
   * @see Requirements 4.5
   */
  handleSelectionControlChange(user: CometChat.User, changeEvent: Event): void {
    // Pass the event to handleSelectionChange for shift-click detection
    this.handleSelectionChange(user, changeEvent);
  }

  /**
   * Removes a user from selection (used by chip close button)
   * @param user - The user to deselect
   * @see Requirements 5.5
   */
  removeSelectedUser(user: CometChat.User): void {
    const uid = user.getUid();
    this.selectedUsers.delete(uid);
    this.selectedUsersMap.delete(uid);

    // Emit select event with selected: false
    this.select.emit({
      user,
      selected: false,
    });

    // Emit selection change event
    this.emitSelectionChange(uid);

    this.cdr.markForCheck();
  }

  /**
   * Emits the selectionChange event with current selection state
   * Called after any selection change (click, keyboard, range selection)
   * @param lastSelectedId - The UID of the last selected/deselected user, or null
   * @private
   * @see Requirements 9.1, 9.2
   */
  private emitSelectionChange(lastSelectedId: string | null): void {
    this.selectionChange.emit({
      mode: this.selectionMode,
      selectedIds: new Set(this.selectedUsers),
      lastSelectedId,
    });
  }

  /**
   * Selects all users in the list.
   * Only works in multiple selection mode.
   * Emits individual select events for each newly selected user,
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

    // Iterate through all users and select those not already selected
    this.userList.forEach(user => {
      const uid = user.getUid();

      // Only emit select event for newly selected users
      if (!this.selectedUsers.has(uid)) {
        this.selectedUsers.add(uid);
        this.selectedUsersMap.set(uid, user);

        // Emit individual select event for each newly selected user
        this.select.emit({
          user,
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
   * Emits individual select events for each deselected user,
   * then emits a single selectionChange event after all deselections.
   * Resets the lastClickedIndex anchor point.
   * @see Requirements 4.1, 4.2, 4.3, 6.1, 9.4
   */
  clearSelection(): void {
    // Iterate through selectedUsersMap to get actual User objects
    // and emit select event with selected: false for each
    this.selectedUsersMap.forEach((user, _uid) => {
      this.select.emit({
        user,
        selected: false,
      });
    });

    // Clear selection state
    this.selectedUsers.clear();
    this.selectedUsersMap.clear();

    // Reset anchor point for shift-click selection
    this.lastClickedIndex = null;
    this.lastClickedUserUid = null;

    // Emit single selectionChange event after all deselections
    this.emitSelectionChange(null);

    this.cdr.markForCheck();
  }

  /**
   * Checks if a user is currently selected
   * Uses selectedUsers Set for O(1) lookup
   * Selection persists across search operations via selectedUsersMap
   * @param user - The user to check
   * @returns True if the user is selected
   * @see Requirements 5.6
   */
  isUserSelected(user: CometChat.User): boolean {
    return this.selectedUsers.has(user.getUid());
  }

  /**
   * Checks if a user is currently active (highlighted)
   * Implements hybrid approach: checks activeUser prop first, falls back to ChatStateService
   * @param user - The user to check
   * @returns True if the user is the active user
   * @see Requirements 8.2, 8.4, 8.5, 8.6
   */
  isUserActive(user: CometChat.User): boolean {
    // Check prop first (priority)
    if (this.activeUser) {
      return user.getUid() === this.activeUser.getUid();
    }
    // Fall back to ChatStateService
    const serviceActiveUser = this.chatStateService.getActiveUser();
    if (serviceActiveUser) {
      return user.getUid() === serviceActiveUser.getUid();
    }
    return false;
  }

  /**
   * Gets the array of selected users from the map
   * Used for displaying selected users preview
   * @returns Array of selected User objects
   * @see Requirements 5.3
   */
  getSelectedUsersArray(): CometChat.User[] {
    return Array.from(this.selectedUsersMap.values());
  }

  // ==================== Context Menu Methods ====================

  /**
   * Gets context menu options for a user
   * @param user - The user to get options for
   * @returns Array of CometChatOption items or empty array
   * @see Requirements 17.1, 17.2
   */
  getOptionsForUser(user: CometChat.User): CometChatOption[] {
    if (this.options) {
      return this.options(user);
    }
    return [];
  }

  /**
   * Handles context menu option click
   * @param option - The clicked option
   * @param user - The user the option was clicked for
   * @see Requirements 17.4
   */
  handleOptionClick(option: CometChatOption, user: CometChat.User): void {
    if (option.onClick) {
      option.onClick();
    }
  }

  // ==================== Accessibility Methods ====================

  /**
   * Gets the ARIA label for a user item
   * Includes user name and status for screen readers
   * @param user - The user object
   * @returns Accessible label string
   * @see Requirements 19.2, 19.3
   */
  getUserAriaLabel(user: CometChat.User): string {
    const name = user.getName() || '';
    const status = user.getStatus();

    if (this.hideUserStatus || !status) {
      return name;
    }

    return `${name}, ${status}`;
  }

  /**
   * TrackBy function for selected users preview
   * @param _index - Item index (unused)
   * @param entry - KeyValue entry
   * @returns User UID for tracking
   */
  trackBySelectedUser(_index: number, entry: { key: string; value: CometChat.User }): string {
    return entry.key;
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
    if (this.focusedIndex === -1 && this.userList.length > 0) {
      this.focusedIndex = 0;
      this.cdr.markForCheck();
      this.scrollFocusedItemIntoView();
    }
  }

  /**
   * Handles keyboard events for navigation and selection
   * Implements arrow key navigation, Enter for selection, Space for checkbox toggle,
   * type-ahead search, and Escape to clear search
   * @param event - The keyboard event
   * @see Requirements 5.1-5.6, 18.1, 18.2, 18.4, 18.6
   */
  @HostListener('keydown', ['$event'])
  handleKeydown(event: KeyboardEvent): void {
    // Delegate to onUsersKeyDown for accessibility-enhanced keyboard handling
    this.onUsersKeyDown(event);
  }

  /**
   * Handles keyboard events for the users list with type-ahead search support.
   * Implements:
   * - Type-ahead search for character-based navigation (Req 5.4)
   * - Selection shortcuts (Space, Shift+Space, Shift+Arrow, Ctrl+A, Escape) (Req 5.3)
   * - Arrow key navigation (Req 5.1)
   * - Enter for item activation (Req 5.2)
   *
   * @param event - The keyboard event
   * @see Requirements 5.1-5.6
   */
  onUsersKeyDown(event: KeyboardEvent): void {
    const host: ListKeyboardHost<CometChat.User> = {
      itemList: this.userList,
      fetchState: this.fetchState,
      selectionMode: this.selectionMode,
      focusedIndex: this.focusedIndex,
      componentClass: 'cometchat-users',
      searchBarClass: 'cometchat-users__search-bar',
      selectedCount: this.selectedUsers.size,
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
        this.typeAheadService.handleCharacter(key, this.userList, focusedIdx, {
          getSearchText: (user: CometChat.User) => user.getName() || '',
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
   * @see Requirements 5.3, 3.3-3.7
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
   * @see Requirements 3.4, 3.5
   */
  private extendSelectionTo(index: number): void {
    if (index < 0 || index >= this.userList.length) return;

    const user = this.userList[index];
    const uid = user.getUid();

    // Add to selection without toggling
    if (!this.selectedUsers.has(uid)) {
      this.selectedUsers.add(uid);
      this.selectedUsersMap.set(uid, user);

      this.select.emit({ user, selected: true });
    }

    // Update anchor point
    this.lastClickedIndex = index;
    this.lastClickedUserUid = uid;

    this.emitSelectionChange(uid);
    this.cdr.markForCheck();
  }

  /**
   * Selects all items between the anchor index and current index.
   * Used for Shift+Space range selection.
   *
   * @param currentIndex - The current focused index
   * @see Requirements 13.4
   */
  private selectRangeFromAnchor(currentIndex: number): void {
    const anchorIndex = this.lastClickedIndex ?? currentIndex;
    const start = Math.min(anchorIndex, currentIndex);
    const end = Math.max(anchorIndex, currentIndex);

    for (let i = start; i <= end; i++) {
      if (i >= 0 && i < this.userList.length) {
        const user = this.userList[i];
        const uid = user.getUid();

        if (!this.selectedUsers.has(uid)) {
          this.selectedUsers.add(uid);
          this.selectedUsersMap.set(uid, user);
          this.select.emit({ user, selected: true });
        }
      }
    }

    // Update last clicked to current
    if (currentIndex >= 0 && currentIndex < this.userList.length) {
      const currentUser = this.userList[currentIndex];
      this.emitSelectionChange(currentUser.getUid());
    }

    this.cdr.markForCheck();
  }

  /**
   * Announces the current selection count via screen reader.
   * @see Requirements 13.6
   */
  private announceSelectionCount(): void {
    const count = this.selectedUsers.size;
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
    const message = CometChatLocalize.getLocalizedString('accessibility_selection_cleared');
    this.liveAnnouncer.announce(message, 'polite');
  }

  /**
   * Moves focus to the next item in the list
   * Wraps around to the first item when at the end
   * Skips section headers during navigation
   * @private
   * @see Requirements 18.1, 18.5, 2.2, 2.3
   */
  private focusNextItem(): void {
    const navigableIndices = this.getNavigableUserIndices();
    if (navigableIndices.length === 0) {
      return;
    }

    if (this.focusedIndex === -1) {
      // No item focused yet, start at first item
      this.focusedIndex = navigableIndices[0];
    } else {
      // Find current position in navigable indices
      const currentPosition = navigableIndices.indexOf(this.focusedIndex);
      if (currentPosition === -1 || currentPosition === navigableIndices.length - 1) {
        // Wrap to first item
        this.focusedIndex = navigableIndices[0];
      } else {
        // Move to next item
        this.focusedIndex = navigableIndices[currentPosition + 1];
      }
    }

    this.cdr.markForCheck();
    this.scrollFocusedItemIntoView();
  }

  /**
   * Moves focus to the previous item in the list
   * Wraps around to the last item when at the beginning
   * Skips section headers during navigation
   * @private
   * @see Requirements 18.1, 18.5, 2.2, 2.4
   */
  private focusPreviousItem(): void {
    const navigableIndices = this.getNavigableUserIndices();
    if (navigableIndices.length === 0) {
      return;
    }

    if (this.focusedIndex === -1) {
      // No item focused yet, start at last item
      this.focusedIndex = navigableIndices[navigableIndices.length - 1];
    } else {
      // Find current position in navigable indices
      const currentPosition = navigableIndices.indexOf(this.focusedIndex);
      if (currentPosition === -1 || currentPosition === 0) {
        // Wrap to last item
        this.focusedIndex = navigableIndices[navigableIndices.length - 1];
      } else {
        // Move to previous item
        this.focusedIndex = navigableIndices[currentPosition - 1];
      }
    }

    this.cdr.markForCheck();
    this.scrollFocusedItemIntoView();
  }

  /**
   * Scrolls the focused item into view with smooth behavior
   * Uses data-index attribute to find the correct element
   * @private
   * @see Requirements 2.2, 2.3, 2.4, 2.5
   */
  private scrollFocusedItemIntoView(): void {
    // Skip scrolling on initial load to prevent page-level scroll jumps
    // (e.g., in Storybook docs mode where multiple stories render on one page)
    if (!this.initialLoadComplete) {
      return;
    }

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
   * Gets the indices of all navigable user items (excluding section headers)
   * @returns Array of indices for user items
   * @private
   * @see Requirements 18.5
   */
  private getNavigableUserIndices(): number[] {
    // All user items are navigable (section headers are separate elements)
    return this.userList.map((_, index) => index);
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
    if (this.focusedIndex >= 0 && this.focusedIndex < this.userList.length) {
      const user = this.userList[this.focusedIndex];
      if (this.selectionMode !== SelectionMode.none) {
        this.handleSelectionChange(user);
      } else {
        this.handleUserClick(user);
      }
    }
  }

  /**
   * Toggles selection of the currently focused item (for multiple selection mode)
   * @private
   * @see Requirements 18.4
   */
  private toggleFocusedItemSelection(): void {
    if (this.focusedIndex >= 0 && this.focusedIndex < this.userList.length) {
      const user = this.userList[this.focusedIndex];
      this.handleSelectionChange(user);
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
    if (this.selectionMode !== SelectionMode.none && this.selectedUsers.size > 0) {
      this.clearSelection();
    }

    // Reset focus (Requirement 6.2)
    this.focusedIndex = -1;

    // Blur any focused element (Requirement 6.3)
    (document.activeElement as HTMLElement)?.blur();

    this.cdr.markForCheck();
  }

  /**
   * Focuses the user item at the given index
   * Finds the focusable element and calls focus() on it
   * @param index - The index of the item to focus
   * @private
   * @see Requirements 18.7
   */
  private focusItemAtIndex(index: number): void {
    // Use setTimeout to ensure the DOM has updated with the new focused index
    this.pendingTimers.push(setTimeout(() => {
      const listContainer = document.querySelector('.cometchat-users__list');
      if (!listContainer) {
        return;
      }

      const listItems = listContainer.querySelectorAll('.cometchat-users__list-item-wrapper');
      if (index < 0 || index >= listItems.length) {
        return;
      }

      const targetWrapper = listItems[index] as HTMLElement;
      if (targetWrapper) {
        // Find the focusable child element (cometchat-user-item)
        const focusableChild = targetWrapper.querySelector('[tabindex]') as HTMLElement;
        if (focusableChild) {
          focusableChild.focus({ preventScroll: true });
        }
        // Only scroll into view after initial load is complete
        if (this.initialLoadComplete) {
          targetWrapper.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }
    }, 0));
  }

  /**
   * Gets the tabindex for a user item based on focus state
   * Implements roving tabindex pattern for keyboard navigation
   * @param index - The index of the user item
   * @returns 0 if focused or first item with no focus, -1 otherwise
   * @see Requirements 18.7, 18.8
   */
  getTabIndex(index: number): number {
    // If this item is focused, it should be tabbable
    if (this.focusedIndex === index) {
      return 0;
    }
    // If no item is focused and this is the first item, make it tabbable
    if (this.focusedIndex === -1 && index === 0) {
      return 0;
    }
    // Otherwise, not tabbable (but still focusable via arrow keys)
    return -1;
  }

  /**
   * Handles focus events within the users list
   * Syncs the focusedIndex when an item receives focus via Tab or click
   * @param event - The focus event
   * @param index - The index of the focused item
   * @see Requirements 18.7
   */
  handleFocusIn(event: FocusEvent): void {
    const target = event.target as HTMLElement;
    if (!target) return;

    // Check if the focused element is the inner div with class 'cometchat-user-item'
    // or is within a user item
    const userItemDiv = target.classList.contains('cometchat-user-item')
      ? target
      : target.closest('.cometchat-user-item');
    if (!userItemDiv) return;

    // Find the wrapper - go up to find cometchat-users__list-item-wrapper
    const wrapper = userItemDiv.closest('.cometchat-users__list-item-wrapper');
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
    // Check if click is outside of user items
    const isOnItem = target.closest('.cometchat-user-item') !== null;
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
   * Handles retry button click in error state.
   * Shows loading state, then re-fetches users.
   */
  handleRetryClick(): void {
    this.lastError = null;
    this.fetchState = States.loading;
    this.cdr.markForCheck();
    this.initializeUsersManager();
    this.fetchNextAndAppendUsers();
  }
}
