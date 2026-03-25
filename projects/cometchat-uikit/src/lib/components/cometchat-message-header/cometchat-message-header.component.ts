/**
 * CometChatMessageHeader Component
 *
 * A feature-rich Angular component that displays the header section of a chat conversation.
 * It shows information about the user or group being chatted with, including real-time
 * status updates, typing indicators, and provides action buttons for calls, search,
 * and AI-powered conversation summary.
 *
 * The design implements a Hybrid Approach where developers can configure behavior
 * either globally through the service or per-instance through component @Input properties,
 * with @Input taking priority when both are provided.
 *
 * @module components/cometchat-message-header
 * @see Requirements 15.1, 15.2
 */
import {
  Component,
  Input,
  Output,
  EventEmitter,
  TemplateRef,
  ContentChild,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  Signal,
  computed,
  signal,
  inject,
  Injector,
  HostListener,
  ViewChild,
  effect,
  booleanAttribute,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, Subscription } from 'rxjs';
import { CometChat } from '@cometchat/chat-sdk-javascript';

// Event imports
import { CometChatUIEvents } from '../../events/CometChatUIEvents';
import {
  CometChatGroupEvents,
  IGroupMemberAdded,
  IGroupMemberKickedBanned,
  IGroupMemberJoined,
  IOwnershipChanged,
  IGroupLeft,
} from '../../events/CometChatGroupEvents';
import { CometChatUIKit } from '../../cometchat-uikit';
import { PanelAlignment } from '../../Enums/Enums';

// Component imports
import { CometChatAvatarComponent } from '../base-elements/cometchat-avatar/cometchat-avatar.component';
import { CometChatDateComponent } from '../base-elements/cometchat-date/cometchat-date.component';
import {
  CometChatContextMenuComponent,
  ContextMenuItem,
} from '../base-elements/cometchat-context-menu/cometchat-context-menu.component';

import { MessageHeaderService } from '../../services/message-header.service';
import { ChatStateService } from '../../services/chat-state.service';
import { COMETCHAT_GLOBAL_CONFIG, GlobalConfig } from '../../services/global-config.service';

// Resource imports
import { TranslatePipe } from '../../resources/CometChatLocalize/translate.pipe';
import { CometChatLocalize } from '../../resources/CometChatLocalize/cometchat-localize';

// Type imports
import { CalendarObject } from '../../resources/CometChatLocalize/localization.interfaces';

// Modal imports
import { CometChatOption } from '../../modals';
import { CometChatCallButtonsComponent } from '../cometchat-call-buttons/cometchat-call-buttons.component';
import { CometChatUIKitCalls } from '../../CometChatCalls';

/**
 * CometChatMessageHeader displays the header section of a chat conversation.
 * It shows user/group information, real-time status, typing indicators,
 * and action buttons for calls and other features.
 *
 * @example
 * ```html
 * <!-- Basic usage with user -->
 * <cometchat-message-header
 *   [user]="selectedUser"
 *   (backClick)="handleBack()"
 *   (itemClick)="showUserDetails($event)">
 * </cometchat-message-header>
 *
 * <!-- Usage with group -->
 * <cometchat-message-header
 *   [group]="selectedGroup"
 *   [showBackButton]="true"
 *   (backClick)="handleBack()"
 *   (itemClick)="showGroupDetails($event)">
 * </cometchat-message-header>
 *
 * <!-- Advanced usage with custom templates -->
 * <cometchat-message-header
 *   [user]="selectedUser"
 *   [showSearchOption]="true"
 *   [showConversationSummaryButton]="true"
 *   [subtitleView]="customSubtitle"
 *   (searchClick)="openSearch()">
 * </cometchat-message-header>
 * ```
 */
@Component({
  selector: 'cometchat-message-header',
  standalone: true,
  imports: [
    CommonModule,
    CometChatAvatarComponent,
    CometChatDateComponent,
    CometChatContextMenuComponent,
    TranslatePipe,
    CometChatCallButtonsComponent,
  ],
  providers: [MessageHeaderService],
  templateUrl: './cometchat-message-header.component.html',
  styleUrls: ['./cometchat-message-header.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CometChatMessageHeaderComponent implements OnInit, OnDestroy, OnChanges {
  /** @internal Timer references for cleanup */
  private pendingTimers: ReturnType<typeof setTimeout>[] = [];

  // ==================== Service Injection ====================
  private messageHeaderService = inject(MessageHeaderService);
  private chatStateService = inject(ChatStateService);
  private cdr = inject(ChangeDetectorRef);
  private injector = inject(Injector);
  private globalConfig: Partial<GlobalConfig> | null = inject(COMETCHAT_GLOBAL_CONFIG, {
    optional: true,
  });

  // ==================== ExplicitlySet Flags & Backing Fields (GlobalConfig Priority System) ====================
  private hideUserStatusExplicitlySet = signal(false);
  private hideVoiceCallButtonExplicitlySet = signal(false);
  private hideVideoCallButtonExplicitlySet = signal(false);

  private _hideUserStatus = signal(false);
  private _hideVoiceCallButton = signal(false);
  private _hideVideoCallButton = signal(false);

  // ==================== Entity Configuration Inputs ====================

  /**
   * The user to display in the header (for 1-on-1 conversations)
   * Mutually exclusive with group input
   */
  @Input() user?: CometChat.User;

  /**
   * The group to display in the header (for group conversations)
   * Mutually exclusive with user input
   */
  @Input() group?: CometChat.Group;

  // ==================== Display Control Inputs ====================

  /**
   * Whether to hide the user's online/offline status
   * @default false
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
   * Whether to show the back button
   * @default false
   */
  @Input() showBackButton = false;

  /**
   * Whether to hide the voice call button.
   * Defaults to `true` (hidden). When calling is enabled via
   * `UIKitSettingsBuilder.setCallingEnabled(true)`, the resolved default
   * becomes `false` (visible). Pass `true` explicitly to hide it even
   * when calling is enabled.
   * @default true
   */
  @Input({ transform: booleanAttribute })
  set hideVoiceCallButton(value: boolean) {
    this._hideVoiceCallButton.set(value);
    this.hideVoiceCallButtonExplicitlySet.set(true);
  }
  get hideVoiceCallButton(): boolean {
    return this._hideVoiceCallButton();
  }

  /**
   * Whether to hide the video call button.
   * Defaults to `true` (hidden). When calling is enabled via
   * `UIKitSettingsBuilder.setCallingEnabled(true)`, the resolved default
   * becomes `false` (visible). Pass `true` explicitly to hide it even
   * when calling is enabled.
   * @default true
   */
  @Input({ transform: booleanAttribute })
  set hideVideoCallButton(value: boolean) {
    this._hideVideoCallButton.set(value);
    this.hideVideoCallButtonExplicitlySet.set(true);
  }
  get hideVideoCallButton(): boolean {
    return this._hideVideoCallButton();
  }

  /**
   * Whether to show the search option in the header
   * @default false
   */
  @Input() showSearchOption = false;

  /**
   * Whether to show the AI conversation summary button
   * @default false
   */
  @Input() showConversationSummaryButton = false;

  /**
   * Custom CallSettingsBuilder to override the default call settings.
   * Forwarded to CometChatCallButtons → CometChatOngoingCall.
   * Priority: @Input > GlobalConfig > default (built internally by OngoingCallService).
   */
  @Input() callSettingsBuilder: typeof CometChatUIKitCalls.CallSettingsBuilder = undefined;

  // ==================== AI Configuration Inputs ====================

  /**
   * Number of messages to use for AI summary generation
   * @default 1000
   */
  @Input() summaryGenerationMessageCount = 1000;

  /**
   * Whether to automatically generate conversation summary on component init
   * @default false
   */
  @Input() enableAutoSummaryGeneration = false;

  // ==================== Date/Time Configuration ====================

  /**
   * Custom date/time format for the last active timestamp
   * Uses CalendarObject format from localization
   */
  @Input() lastActiveAtDateTimeFormat?: CalendarObject;

  // ==================== Template Inputs ====================

  /**
   * Custom template for the entire header (replaces all default content)
   */
  @Input() headerView?: TemplateRef<any>;

  /**
   * Custom template for the item section (replaces avatar, title, subtitle)
   * Context: { user?: CometChat.User; group?: CometChat.Group }
   */
  @Input() itemView?: TemplateRef<{ user?: CometChat.User; group?: CometChat.Group }>;

  /**
   * Custom template for the leading section (avatar area)
   * Context: { user?: CometChat.User; group?: CometChat.Group }
   */
  @Input() leadingView?: TemplateRef<{ user?: CometChat.User; group?: CometChat.Group }>;

  /**
   * Custom template for the title section (name)
   * Context: { user?: CometChat.User; group?: CometChat.Group }
   */
  @Input() titleView?: TemplateRef<{ user?: CometChat.User; group?: CometChat.Group }>;

  /**
   * Custom template for the subtitle section (status/typing/member count)
   * Context: { user?: CometChat.User; group?: CometChat.Group }
   */
  @Input() subtitleView?: TemplateRef<{ user?: CometChat.User; group?: CometChat.Group }>;

  /**
   * Custom template for the trailing section (action buttons)
   * Context: { user?: CometChat.User; group?: CometChat.Group }
   */
  @Input() trailingView?: TemplateRef<{ user?: CometChat.User; group?: CometChat.Group }>;

  /**
   * Custom template for the back button
   */
  @Input() backButtonView?: TemplateRef<any>;

  /**
   * Custom template for auxiliary buttons in the trailing section
   * Context: { user?: CometChat.User; group?: CometChat.Group }
   */
  @Input() auxiliaryButtonView?: TemplateRef<{ user?: CometChat.User; group?: CometChat.Group }>;

  // ==================== Standardised Template Slot Inputs (Property 6 / Req 3.2) ====================
  /** Custom template for each list item. Alias for `itemView`. */
  @Input() listItemTemplate: TemplateRef<any> | null = null;
  /** Custom template for the empty state. */
  @Input() emptyStateTemplate: TemplateRef<any> | null = null;
  /** Custom template for the error state. */
  @Input() errorStateTemplate: TemplateRef<any> | null = null;
  /** Custom template for the loading state. */
  @Input() loadingStateTemplate: TemplateRef<any> | null = null;

  // ==================== ContentChild Template References ====================

  /**
   * Content projection for header view template
   */
  @ContentChild('headerView') headerViewContent?: TemplateRef<any>;

  /**
   * Content projection for item view template
   */
  @ContentChild('itemView') itemViewContent?: TemplateRef<{
    user?: CometChat.User;
    group?: CometChat.Group;
  }>;

  /**
   * Content projection for leading view template
   */
  @ContentChild('leadingView') leadingViewContent?: TemplateRef<{
    user?: CometChat.User;
    group?: CometChat.Group;
  }>;

  /**
   * Content projection for title view template
   */
  @ContentChild('titleView') titleViewContent?: TemplateRef<{
    user?: CometChat.User;
    group?: CometChat.Group;
  }>;

  /**
   * Content projection for subtitle view template
   */
  @ContentChild('subtitleView') subtitleViewContent?: TemplateRef<{
    user?: CometChat.User;
    group?: CometChat.Group;
  }>;

  /**
   * Content projection for trailing view template
   */
  @ContentChild('trailingView') trailingViewContent?: TemplateRef<{
    user?: CometChat.User;
    group?: CometChat.Group;
  }>;

  /**
   * Content projection for back button view template
   */
  @ContentChild('backButtonView') backButtonViewContent?: TemplateRef<any>;

  /**
   * Content projection for auxiliary button view template
   */
  @ContentChild('auxiliaryButtonView') auxiliaryButtonViewContent?: TemplateRef<{
    user?: CometChat.User;
    group?: CometChat.Group;
  }>;

  // ==================== Output Events ====================

  /**
   * Emitted when the back button is clicked
   */
  @Output() backClick = new EventEmitter<void>();

  /**
   * Emitted when the header item (avatar/name area) is clicked
   * Emits the current user or group object
   */
  @Output() itemClick = new EventEmitter<CometChat.User | CometChat.Group>();

  /**
   * Emitted when the search option is clicked
   */
  @Output() searchClick = new EventEmitter<void>();

  /**
   * Emitted when the conversation summary button is clicked or auto-generation is triggered
   * Includes the configured message count for summary generation
   * @see Requirements 7.2, 7.3, 7.4, 7.5
   */
  @Output() conversationSummaryClick = new EventEmitter<{ messageCount: number }>();

  /**
   * Emitted when an error occurs in the component or service
   */
  @Output() error = new EventEmitter<CometChat.CometChatException>();

  /**
   * Emitted when the voice call button is clicked
   * @see Requirements 6.1, 6.2, 6.4
   */
  @Output() voiceCallClick = new EventEmitter<CometChat.User | CometChat.Group>();

  /**
   * Emitted when the video call button is clicked
   * @see Requirements 6.1, 6.3, 6.4
   */
  @Output() videoCallClick = new EventEmitter<CometChat.User | CometChat.Group>();

  // ==================== Signal-Based State from Service ====================

  /**
   * Internal signal for current user (from props or service)
   * This signal is used internally to track the effective user
   */
  protected currentUser = signal<CometChat.User | null>(null);

  /**
   * Internal signal for current group (from props or service)
   * This signal is used internally to track the effective group
   */
  protected currentGroup = signal<CometChat.Group | null>(null);

  /**
   * Signal tracking whether props were provided (for hybrid approach)
   * Set to true in ngOnInit if user or group props are provided
   * Used by effect to determine whether to use service state
   */
  private propsProvided = signal<boolean>(false);

  /**
   * Signal for current user from service
   */
  userSignal!: Signal<CometChat.User | null>;

  /**
   * Signal for current group from service
   */
  groupSignal!: Signal<CometChat.Group | null>;

  /**
   * Signal for user online/offline status
   */
  userStatusSignal!: Signal<string>;

  /**
   * Signal for typing indicator
   */
  typingIndicatorSignal!: Signal<CometChat.TypingIndicator | null>;

  /**
   * Signal for multiple typing users in groups
   */
  typingUsersSignal!: Signal<CometChat.User[]>;

  /**
   * Signal for group member count
   */
  groupMemberCountSignal!: Signal<number>;

  /**
   * Signal for last active timestamp
   */
  lastActiveAtSignal!: Signal<number | null>;

  // ==================== Computed Signals ====================

  /**
   * Whether this is a user conversation
   */
  isUserConversation = computed(() => this.userSignal() !== null);

  /**
   * Whether this is a group conversation
   */
  isGroupConversation = computed(() => this.groupSignal() !== null);

  /**
   * Whether someone is currently typing
   */
  isTyping = computed(() => this.typingIndicatorSignal() !== null);

  /**
   * Whether the back button should be visible
   */
  shouldShowBackButton = computed(() => this.showBackButton);

  /**
   * Whether to show the overflow menu (when both search and summary are enabled)
   */
  shouldShowOverflowMenu = computed(
    () => this.showSearchOption && this.showConversationSummaryButton
  );

  // ==================== Effective Values (GlobalConfig Priority System) ====================
  /**
   * Resolved hideUserStatus value using 3-tier priority:
   * 1. Explicitly set @Input value
   * 2. GlobalConfig value (if defined)
   * 3. Component default (false)
   */
  effectiveHideUserStatus = computed(() => {
    if (this.hideUserStatusExplicitlySet()) return this._hideUserStatus();
    if (this.globalConfig?.hideUserStatus !== undefined) return this.globalConfig.hideUserStatus;
    return false;
  });

  /**
   * Resolved hideVoiceCallButton value using 4-tier priority:
   * 1. Explicitly set @Input value
   * 2. GlobalConfig value (if defined)
   * 3. `true` when calling is not enabled via `CometChatUIKit.isCallingEnabled()`
   * 4. Component default (`false` — visible when calling is enabled)
   */
  effectiveHideVoiceCallButton = computed(() => {
    if (this.hideVoiceCallButtonExplicitlySet()) return this._hideVoiceCallButton();
    return !CometChatUIKit.isCallingEnabled();
  });

  /**
   * Resolved hideVideoCallButton value using 4-tier priority:
   * 1. Explicitly set @Input value
   * 2. GlobalConfig value (if defined)
   * 3. `true` when calling is not enabled via `CometChatUIKit.isCallingEnabled()`
   * 4. Component default (`false` — visible when calling is enabled)
   */
  effectiveHideVideoCallButton = computed(() => {
    if (this.hideVideoCallButtonExplicitlySet()) return this._hideVideoCallButton();
    return !CometChatUIKit.isCallingEnabled();
  });

  // ==================== Private State ====================

  /**
   * Subject for component destruction cleanup
   */
  private destroy$ = new Subject<void>();

  /**
   * Track whether the overflow menu is open for Escape key handling
   * @see Requirements 12.3
   */
  isOverflowMenuOpen = false;

  /**
   * Reference to the context menu component for programmatic control
   */
  @ViewChild(CometChatContextMenuComponent) contextMenu?: CometChatContextMenuComponent;

  /**
   * Previous user status for screen reader announcements
   * Used to detect status changes and announce them
   * @see Requirements 12.5
   */
  private previousUserStatus: string | null = null;

  /**
   * Tracks the unread message count from the active chat changed event.
   * Used by handleAutoSummaryGeneration to check the ≥15 threshold.
   * @see Requirements 2.3
   */
  private unreadMessageCount = 0;

  /**
   * Subscription for ccActiveChatChanged events to track unread count.
   */
  private activeChatSubscription?: Subscription;

  /**
   * Subscriptions for CometChatGroupEvents (member added/banned/joined/kicked, ownership changed, group left).
   * @see Requirements 5.1–5.6
   */
  private groupEventSubscriptions: Subscription[] = [];

  /**
   * Flag to ensure auto-summary generation only fires once
   * when using the service-based (no props) path.
   */
  private autoSummaryTriggered = false;

  // ==================== Template Resolution ====================

  /**
   * Get the effective header view template (Input > ContentChild)
   */
  get effectiveHeaderView(): TemplateRef<any> | undefined {
    return this.headerView || this.headerViewContent;
  }

  /**
   * Get the effective item view template (Input > ContentChild)
   */
  get effectiveItemView():
    | TemplateRef<{ user?: CometChat.User; group?: CometChat.Group }>
    | undefined {
    return this.listItemTemplate || this.itemView || this.itemViewContent;
  }

  /**
   * Get the effective leading view template (Input > ContentChild)
   */
  get effectiveLeadingView():
    | TemplateRef<{ user?: CometChat.User; group?: CometChat.Group }>
    | undefined {
    return this.leadingView || this.leadingViewContent;
  }

  /**
   * Get the effective title view template (Input > ContentChild)
   */
  get effectiveTitleView():
    | TemplateRef<{ user?: CometChat.User; group?: CometChat.Group }>
    | undefined {
    return this.titleView || this.titleViewContent;
  }

  /**
   * Get the effective subtitle view template (Input > ContentChild)
   */
  get effectiveSubtitleView():
    | TemplateRef<{ user?: CometChat.User; group?: CometChat.Group }>
    | undefined {
    return this.subtitleView || this.subtitleViewContent;
  }

  /**
   * Get the effective trailing view template (Input > ContentChild)
   */
  get effectiveTrailingView():
    | TemplateRef<{ user?: CometChat.User; group?: CometChat.Group }>
    | undefined {
    return this.trailingView || this.trailingViewContent;
  }

  /**
   * Get the effective back button view template (Input > ContentChild)
   */
  get effectiveBackButtonView(): TemplateRef<any> | undefined {
    return this.backButtonView || this.backButtonViewContent;
  }

  /**
   * Get the effective auxiliary button view template (Input > ContentChild)
   */
  get effectiveAuxiliaryButtonView():
    | TemplateRef<{ user?: CometChat.User; group?: CometChat.Group }>
    | undefined {
    return this.auxiliaryButtonView || this.auxiliaryButtonViewContent;
  }

  /**
   * Get the template context for custom templates
   */
  get templateContext(): { user?: CometChat.User; group?: CometChat.Group } {
    return {
      user: this.currentUser() ?? undefined,
      group: this.currentGroup() ?? undefined,
    };
  }

  // ==================== Constructor ====================

  /**
   * Constructor
   * Initializes signals and sets up effects within injection context
   */
  constructor() {
    // Initialize signal references first to ensure they're available
    this.initializeSignals();

    // Effect 1: Status change announcements for screen reader
    // @see Requirements 12.5
    effect(() => {
      const currentStatus = this.userStatusSignal();

      // Only announce if we have a previous status (not initial load) and status changed
      if (
        this.previousUserStatus !== null &&
        this.previousUserStatus !== currentStatus &&
        this.user
      ) {
        this.announceStatusChange(currentStatus);
      }

      // Update previous status
      this.previousUserStatus = currentStatus;
    });

    // Effect 2: Service signal fallback (hybrid approach)
    // Reacts to service state changes when no props are provided
    effect(
      () => {
        const serviceUser = this.chatStateService.activeUser();
        const serviceGroup = this.chatStateService.activeGroup();
        const usingProps = this.propsProvided();

        // Only update from service if no props were provided
        if (!usingProps) {
          // Update internal signals from service
          this.currentUser.set(serviceUser);
          this.currentGroup.set(serviceGroup);

          // Update message header service when service state changes
          if (serviceUser) {
            this.messageHeaderService.setUser(serviceUser);
            const userId = serviceUser.getUid?.();
            if (userId) {
              this.messageHeaderService.setupListeners(userId, 'user');
            }
          } else if (serviceGroup) {
            this.messageHeaderService.setGroup(serviceGroup);
            const groupId = serviceGroup.getGuid?.();
            if (groupId) {
              this.messageHeaderService.setupListeners(groupId, 'group');
            }
          } else {
            // Both are null, cleanup
            this.messageHeaderService.cleanup();
            this.setupErrorCallback(); // Re-setup error callback after cleanup
          }

          // Trigger change detection since we're using OnPush
          this.cdr.markForCheck();
        }
      },
      { allowSignalWrites: true }
    );
  }

  // ==================== Lifecycle Hooks ====================

  // ==================== Host Listeners ====================

  /**
   * Handle Escape key press to close overflow menu
   * @see Requirements 12.3
   */
  @HostListener('document:keydown.escape', ['$event'])
  handleEscapeKey(event: Event): void {
    if (this.isOverflowMenuOpen) {
      event.preventDefault();
      this.closeOverflowMenu();
    }
  }

  /**
   * Initialize the component
   * Sets up service with user/group and handles auto-generation of conversation summary
   *
   * Implements hybrid approach:
   * - Priority 1: Use @Input props if provided (backward compatible)
   * - Priority 2: Fall back to ChatStateService signals if no props (handled by effect in constructor)
   *
   * @see Requirements 1.1, 1.2, 7.3, 7.5, 11.2
   */
  ngOnInit(): void {
    try {
      // Set up error callback to receive errors from service
      this.setupErrorCallback();

      // Implement hybrid approach: props take priority over service
      if (this.user) {
        // Props provided: use them (backward compatible)
        this.propsProvided.set(true);
        this.currentUser.set(this.user);
        this.currentGroup.set(null);
        // Initialize the service with the prop value
        this.initializeService();
      } else if (this.group) {
        // Props provided: use them (backward compatible)
        this.propsProvided.set(true);
        this.currentUser.set(null);
        this.currentGroup.set(this.group);
        // Initialize the service with the prop value
        this.initializeService();
      } else {
        // No props provided - effect in constructor will handle service-based initialization
        this.propsProvided.set(false);
      }
      // Service-based initialization is handled by effect in constructor

      // Handle auto-generation of conversation summary if enabled
      // @see Requirements 7.3, 7.5
      this.handleAutoSummaryGeneration();

      // Subscribe to group events for member count and group metadata updates
      // @see Requirements 5.1–5.6
      this.subscribeToGroupEvents();
    } catch (error) {
      this.handleLifecycleError(error, 'ngOnInit');
    }
  }

  /**
   * Handle input changes
   * Updates service when user or group changes
   * Properly handles switching between user and group conversations
   *
   * @param changes - SimpleChanges object containing changed inputs
   * @see Requirements 1.1, 1.2, 14.1
   */
  ngOnChanges(changes: SimpleChanges): void {
    try {
      // Handle user input change
      if (changes['user'] && !changes['user'].firstChange) {
        this.handleUserChange(changes['user'].previousValue);
      }

      // Handle group input change
      if (changes['group'] && !changes['group'].firstChange) {
        this.handleGroupChange(changes['group'].previousValue);
      }
    } catch (error) {
      // Log and continue with previous state — don't set error state for ngOnChanges
      // @see Requirement 2.3 (Error Boundaries spec)
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('[CometChatMessageHeader] Error in ngOnChanges:', err);
    }
  }

  /**
   * Clean up the component
   * Removes listeners and resets service state
   *
   * @see Requirements 9.5, 11.3, 14.4
   */
  ngOnDestroy(): void {
    this.pendingTimers.forEach(t => clearTimeout(t));
    this.pendingTimers = [];
    try {
      // Complete the destroy subject to clean up any subscriptions
      this.destroy$.next();
      this.destroy$.complete();

      // Clean up the active chat subscription
      this.activeChatSubscription?.unsubscribe();

      // Clean up group event subscriptions
      this.unsubscribeFromGroupEvents();

      // Clean up the service (removes listeners, resets state, clears error callback)
      this.messageHeaderService.cleanup();
    } catch (error) {
      // Log without propagating — component is being destroyed
      // @see Requirement 2.4 (Error Boundaries spec)
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('[CometChatMessageHeader] Error in ngOnDestroy:', err);
    }
  }

  // ==================== Initialization Methods ====================

  /**
   * Set up error callback to receive errors from service
   * Errors from service will be propagated to component's error output
   *
   * @private
   * @see Requirements 14.2
   */
  private setupErrorCallback(): void {
    this.messageHeaderService.setErrorCallback((error: CometChat.CometChatException) => {
      this.error.emit(error);
    });
  }

  /**
   * Initialize the service with user or group
   * Validates input and sets up appropriate listeners
   *
   * @private
   * @throws Error if both user and group are provided
   * @see Requirements 14.1, 14.4
   */
  private initializeService(): void {
    // Validate that only one of user or group is provided
    if (this.user && this.group) {
      console.warn('[CometChatMessageHeader] Both user and group provided. Using user.');
    }

    if (this.user) {
      // Validate user has required properties
      const userId = this.user.getUid?.();
      if (!userId) {
        throw new Error('Invalid user: missing UID');
      }

      // Set user in service and set up listeners
      this.messageHeaderService.setUser(this.user);
      this.messageHeaderService.setupListeners(userId, 'user');
    } else if (this.group) {
      // Validate group has required properties
      const groupId = this.group.getGuid?.();
      if (!groupId) {
        throw new Error('Invalid group: missing GUID');
      }

      // Set group in service and set up listeners
      this.messageHeaderService.setGroup(this.group);
      this.messageHeaderService.setupListeners(groupId, 'group');
    }
    // If neither user nor group is provided, component will render empty state
  }

  /**
   * Initialize signal references from service
   * Creates local references to service signals for template binding
   *
   * @private
   */
  private initializeSignals(): void {
    this.userSignal = this.messageHeaderService.user;
    this.groupSignal = this.messageHeaderService.group;
    this.userStatusSignal = this.messageHeaderService.userStatus;
    this.typingIndicatorSignal = this.messageHeaderService.typingIndicator;
    this.typingUsersSignal = this.messageHeaderService.typingUsers;
    this.groupMemberCountSignal = this.messageHeaderService.groupMemberCount;
    this.lastActiveAtSignal = this.messageHeaderService.lastActiveAt;
  }

  // ==================== Change Handlers ====================

  /**
   * Handle user input change
   * Cleans up previous user listeners and sets up new ones
   *
   * @param previousUser - The previous user value (if any)
   * @private
   * @see Requirements 14.1
   */
  private handleUserChange(previousUser?: CometChat.User): void {
    // If user is cleared, clean up
    if (!this.user) {
      // Only cleanup if there was a previous user
      if (previousUser) {
        this.messageHeaderService.cleanup();
        // Re-setup error callback after cleanup
        this.setupErrorCallback();
        // Clear the signal
        this.currentUser.set(null);
      }
      return;
    }

    // Validate user has required properties
    const userId = this.user.getUid?.();
    if (!userId) {
      console.error('[CometChatMessageHeader] Invalid user: missing UID');
      this.emitError(new Error('Invalid user: missing UID'));
      return;
    }

    // Check if user actually changed (not just reference)
    const previousUserId = previousUser?.getUid?.();
    if (previousUserId === userId) {
      // Same user, just update the reference
      this.messageHeaderService.setUser(this.user);
      this.currentUser.set(this.user);
      this.cdr.markForCheck();
      return;
    }

    // Different user - set up new user and listeners
    this.messageHeaderService.setUser(this.user);
    this.messageHeaderService.setupListeners(userId, 'user');
    // Update the signal to trigger UI update
    this.currentUser.set(this.user);
    this.currentGroup.set(null);
    this.cdr.markForCheck();
  }

  /**
   * Handle group input change
   * Cleans up previous group listeners and sets up new ones
   *
   * @param previousGroup - The previous group value (if any)
   * @private
   * @see Requirements 14.1
   */
  private handleGroupChange(previousGroup?: CometChat.Group): void {
    // If group is cleared, clean up
    if (!this.group) {
      // Only cleanup if there was a previous group
      if (previousGroup) {
        this.messageHeaderService.cleanup();
        // Re-setup error callback after cleanup
        this.setupErrorCallback();
        // Clear the signal
        this.currentGroup.set(null);
      }
      return;
    }

    // Validate group has required properties
    const groupId = this.group.getGuid?.();
    if (!groupId) {
      console.error('[CometChatMessageHeader] Invalid group: missing GUID');
      this.emitError(new Error('Invalid group: missing GUID'));
      return;
    }

    // Check if group actually changed (not just reference)
    const previousGroupId = previousGroup?.getGuid?.();
    if (previousGroupId === groupId) {
      // Same group, just update the reference
      this.messageHeaderService.setGroup(this.group);
      this.currentGroup.set(this.group);
      this.cdr.markForCheck();
      return;
    }

    // Different group - set up new group and listeners
    this.messageHeaderService.setGroup(this.group);
    this.messageHeaderService.setupListeners(groupId, 'group');
    // Update the signal to trigger UI update
    this.currentUser.set(null);
    this.currentGroup.set(this.group);
    this.cdr.markForCheck();
  }

  // ==================== Error Handling ====================

  /**
   * Emit error through error output
   * Converts unknown errors to CometChatException format
   * Logs errors to console for debugging
   *
   * @param error - The error to emit
   * @private
   * @see Requirements 14.2, 14.3
   */
  private emitError(error: unknown): void {
    // Log error to console for debugging
    console.error('[CometChatMessageHeader] Error:', error);

    if (error instanceof CometChat.CometChatException) {
      this.error.emit(error);
    } else if (error instanceof Error) {
      // Convert standard Error to CometChatException-like object
      const exception = new CometChat.CometChatException({
        code: 'COMPONENT_ERROR',
        message: error.message,
        details: error.stack || '',
      });
      this.error.emit(exception);
    } else {
      // Handle unknown error types
      const exception = new CometChat.CometChatException({
        code: 'UNKNOWN_ERROR',
        message: String(error),
        details: '',
      });
      this.error.emit(exception);
    }
  }

  /**
   * Handle lifecycle hook errors consistently.
   * Normalizes the error, logs with component-name prefix, and emits via error output.
   *
   * @param error - The error that occurred
   * @param hook - The lifecycle hook name where the error occurred
   * @private
   * @see Requirements 2.1, 2.3, 2.4 (Error Boundaries spec)
   */
  private handleLifecycleError(error: unknown, hook: string): void {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error(`[CometChatMessageHeader] Error in ${hook}:`, err);
    this.error.emit(err as CometChat.CometChatException);
  }

  // ==================== Event Handlers ====================

  /**
   * Handle back button click
   */
  handleBackClick(): void {
    this.backClick.emit();
  }

  /**
   * Handle back button keyboard activation
   */
  handleBackKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.handleBackClick();
    }
  }

  /**
   * Handle item click (avatar/name area)
   */
  handleItemClick(): void {
    const user = this.currentUser();
    const group = this.currentGroup();

    if (user) {
      this.itemClick.emit(user);
    } else if (group) {
      this.itemClick.emit(group);
    }
  }

  /**
   * Handle item keyboard activation
   * Supports both Enter and Space keys for accessibility
   * @see Requirements 12.2
   */
  handleItemKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.handleItemClick();
    }
  }

  /**
   * Handle search option click
   */
  handleSearchClick(): void {
    this.searchClick.emit();
  }

  /**
   * Handle conversation summary button click
   * Emits the onConversationSummaryClick event with configured message count for AI summary generation
   * @see Requirements 7.1, 7.2, 7.4, 8.1, 8.2, 8.3, 8.4
   */
  handleSummaryClick(): void {
    try {
      this.triggerSummaryGeneration();
    } catch (error) {
      console.error('[CometChatMessageHeader] Error triggering summary generation:', error);
      this.emitError(error);
    }
  }

  /**
   * Trigger summary generation with configured message count
   * Called by both manual click and auto-generation
   * Emits ccShowPanel with configuration for the summary panel and
   * maintains backward compatibility by also emitting conversationSummaryClick
   * @see Requirements 2.1, 2.2, 2.4, 2.5
   */
  private triggerSummaryGeneration(): void {
    const user = this.currentUser();
    const group = this.currentGroup();

    // Validate that we have a user or group to generate summary for
    if (!user && !group) {
      const error = new Error('Cannot generate summary: No user or group configured');
      console.warn('[CometChatMessageHeader]', error.message);
      this.emitError(error);
      return;
    }

    const receiverId = user ? user.getUid() : group!.getGuid();
    const receiverType = user ? 'user' : 'group';

    // Emit ccShowPanel with configuration for the summary panel
    CometChatUIEvents.ccShowPanel.next({
      configuration: {
        getConversationSummary: () =>
          CometChat.getConversationSummary(receiverId, receiverType, {
            lastNMessages: this.summaryGenerationMessageCount,
          }),
        closeCallback: () => CometChatUIEvents.ccHidePanel.next(PanelAlignment.messageListFooter),
      },
      position: PanelAlignment.messageListFooter,
    });

    // Also emit the existing output for backward compatibility
    this.conversationSummaryClick.emit({
      messageCount: this.summaryGenerationMessageCount,
    });
  }

  /**
   * Handle auto-generation of conversation summary on component init
   * Only triggers if enableAutoSummaryGeneration is true, user/group is configured,
   * and the active chat has ≥15 unread messages
   * @see Requirements 2.3
   */
  private handleAutoSummaryGeneration(): void {
    if (!this.enableAutoSummaryGeneration) {
      return;
    }

    // Subscribe to active chat changes to track unread count
    this.activeChatSubscription = CometChatUIEvents.ccActiveChatChanged.subscribe(event => {
      this.unreadMessageCount = event.unreadMessageCount ?? 0;

      // Auto-trigger summary when active chat changes with ≥15 unread messages
      if (this.unreadMessageCount >= 15) {
        const user = this.currentUser();
        const group = this.currentGroup();

        if (!user && !group) {
          return;
        }

        this.pendingTimers.push(setTimeout(() => {
          try {
            this.triggerSummaryGeneration();
          } catch (error) {
            console.error('[CometChatMessageHeader] Error during auto-summary generation:', error);
            this.emitError(error);
          }
        }, 0));
      }
    });

    const user = this.currentUser();
    const group = this.currentGroup();

    // If user/group is already available (props path), trigger immediately
    if (user || group) {
      this.pendingTimers.push(setTimeout(() => {
        try {
          this.triggerSummaryGeneration();
        } catch (error) {
          console.error('[CometChatMessageHeader] Error during auto-summary generation:', error);
          this.emitError(error);
        }
      }, 0));
    } else {
      // Service-based path: user/group not yet available.
      // Use an effect to watch for when they become available and trigger once.
      this.autoSummaryTriggered = false;
      effect(
        () => {
          const u = this.currentUser();
          const g = this.currentGroup();

          if ((u || g) && !this.autoSummaryTriggered) {
            this.autoSummaryTriggered = true;
            this.pendingTimers.push(setTimeout(() => {
              try {
                this.triggerSummaryGeneration();
              } catch (error) {
                console.error(
                  '[CometChatMessageHeader] Error during auto-summary generation:',
                  error
                );
                this.emitError(error);
              }
            }, 0));
          }
        },
        { injector: this.injector }
      );
    }
  }

  /**
   * Subscribe to CometChatGroupEvents for the current group.
   * Matches the React UIKit's subscribeToEvents pattern in CometChatMessageHeader.
   * Updates member count and group metadata when group membership events occur.
   * @see Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6
   */
  private subscribeToGroupEvents(): void {
    // Clean up any existing subscriptions first
    this.unsubscribeFromGroupEvents();

    const loggedInUser = CometChatUIKit.getLoggedInUser();

    // 8.1 — ccGroupMemberAdded: update member count
    this.groupEventSubscriptions.push(
      CometChatGroupEvents.ccGroupMemberAdded.subscribe((item: IGroupMemberAdded) => {
        const group = this.currentGroup();
        if (group && group.getGuid() === item.userAddedIn?.getGuid()) {
          if (item.usersAdded?.length > 0) {
            item.usersAdded.forEach((userAdded: CometChat.User) => {
              if (userAdded.getUid() === loggedInUser?.getUid()) {
                group.setHasJoined(true);
              }
            });
          }
          group.setMembersCount(item.userAddedIn.getMembersCount());
          this.messageHeaderService.updateGroupMemberCount(item.userAddedIn.getMembersCount());
          this.cdr.markForCheck();
        }
      })
    );

    // 8.2 — ccGroupMemberBanned: update member count
    this.groupEventSubscriptions.push(
      CometChatGroupEvents.ccGroupMemberBanned.subscribe((item: IGroupMemberKickedBanned) => {
        const group = this.currentGroup();
        if (group && group.getGuid() === item.kickedFrom?.getGuid()) {
          if (loggedInUser?.getUid() === item.kickedUser?.getUid()) {
            group.setHasJoined(false);
          }
          group.setMembersCount(item.kickedFrom.getMembersCount());
          this.messageHeaderService.updateGroupMemberCount(item.kickedFrom.getMembersCount());
          this.cdr.markForCheck();
        }
      })
    );

    // 8.3 — ccGroupMemberJoined: update member count
    this.groupEventSubscriptions.push(
      CometChatGroupEvents.ccGroupMemberJoined.subscribe((item: IGroupMemberJoined) => {
        const group = this.currentGroup();
        if (group && group.getGuid() === item.joinedGroup?.getGuid()) {
          if (loggedInUser?.getUid() === item.joinedUser?.getUid()) {
            group.setHasJoined(true);
          }
          group.setMembersCount(item.joinedGroup.getMembersCount());
          this.messageHeaderService.updateGroupMemberCount(item.joinedGroup.getMembersCount());
          this.cdr.markForCheck();
        }
      })
    );

    // 8.4 — ccGroupMemberKicked: update member count
    this.groupEventSubscriptions.push(
      CometChatGroupEvents.ccGroupMemberKicked.subscribe((item: IGroupMemberKickedBanned) => {
        const group = this.currentGroup();
        if (group && group.getGuid() === item.kickedFrom?.getGuid()) {
          if (loggedInUser?.getUid() === item.kickedUser?.getUid()) {
            group.setHasJoined(false);
          }
          group.setMembersCount(item.kickedFrom.getMembersCount());
          this.messageHeaderService.updateGroupMemberCount(item.kickedFrom.getMembersCount());
          this.cdr.markForCheck();
        }
      })
    );

    // 8.5 — ccOwnershipChanged: update group
    this.groupEventSubscriptions.push(
      CometChatGroupEvents.ccOwnershipChanged.subscribe((item: IOwnershipChanged) => {
        const group = this.currentGroup();
        if (group && group.getGuid() === item.group?.getGuid()) {
          group.setOwner(item.group.getOwner());
          this.cdr.markForCheck();
        }
      })
    );

    // 8.6 — ccGroupLeft: handle current user leaving
    this.groupEventSubscriptions.push(
      CometChatGroupEvents.ccGroupLeft.subscribe((item: IGroupLeft) => {
        const group = this.currentGroup();
        if (group && group.getGuid() === item.leftGroup?.getGuid()) {
          if (loggedInUser?.getUid() === item.userLeft?.getUid()) {
            group.setHasJoined(false);
          }
          group.setMembersCount(item.leftGroup.getMembersCount());
          this.messageHeaderService.updateGroupMemberCount(item.leftGroup.getMembersCount());
          this.cdr.markForCheck();
        }
      })
    );
  }

  /**
   * Unsubscribe from all group event subscriptions.
   */
  private unsubscribeFromGroupEvents(): void {
    this.groupEventSubscriptions.forEach(sub => sub.unsubscribe());
    this.groupEventSubscriptions = [];
  }

  /**
   * Get the overflow menu options for the context menu
   * Returns an array of CometChatOption items for search and summary
   * @see Requirements 7.1, 7.2, 8.1, 8.2, 8.3, 8.4
   */
  getOverflowMenuOptions(): CometChatOption[] {
    const options: CometChatOption[] = [];

    if (this.showSearchOption) {
      options.push(
        new CometChatOption({
          id: 'search',
          title: CometChatLocalize.getLocalizedString('search_title'),
          iconURL: 'assets/search.svg',
          onClick: () => this.handleSearchClick(),
        })
      );
    }

    if (this.showConversationSummaryButton) {
      options.push(
        new CometChatOption({
          id: 'summary',
          title: CometChatLocalize.getLocalizedString('ai_conversation_summary_title'),
          iconURL: 'assets/ai_conversation_summary.svg',
          onClick: () => this.handleSummaryClick(),
        })
      );
    }

    return options;
  }

  /**
   * Handle overflow menu option click
   * Called when an option is selected from the context menu
   * @param option - The selected menu option (ContextMenuItem type from context menu)
   * @see Requirements 7.1, 8.1, 8.2, 8.3, 8.4
   */
  handleOverflowMenuOptionClick(option: ContextMenuItem): void {
    // We use CometChatOption for our menu items which has onClick?: () => void
    // Check if it's a CometChatOption with onClick handler
    if (option instanceof CometChatOption && option.onClick) {
      option.onClick();
    }
  }

  /**
   * Handle voice call button click
   * Emits the current user or group object
   * @see Requirements 6.1, 6.2, 6.4
   */
  handleVoiceCallClick(): void {
    const user = this.currentUser();
    const group = this.currentGroup();

    if (user) {
      this.voiceCallClick.emit(user);
    } else if (group) {
      this.voiceCallClick.emit(group);
    }
  }

  /**
   * Handle video call button click
   * Emits the current user or group object
   * @see Requirements 6.1, 6.3, 6.4
   */
  handleVideoCallClick(): void {
    const user = this.currentUser();
    const group = this.currentGroup();

    if (user) {
      this.videoCallClick.emit(user);
    } else if (group) {
      this.videoCallClick.emit(group);
    }
  }

  /**
   * Handle error from service or component
   */
  handleError(error: CometChat.CometChatException): void {
    this.error.emit(error);
  }

  // ==================== Avatar Helper Methods ====================

  /**
   * Get the avatar image URL for the current user or group
   * Returns user.getAvatar() for user conversations or group.getIcon() for group conversations
   *
   * @returns The avatar image URL or empty string if not available
   * @see Requirements 1.4, 2.1
   */
  getAvatarImage(): string {
    const user = this.currentUser();
    const group = this.currentGroup();

    if (user) {
      return user.getAvatar?.() || '';
    }
    if (group) {
      return group.getIcon?.() || '';
    }
    return '';
  }

  /**
   * Get the name for the avatar (used for initials fallback)
   * Returns user.getName() for user conversations or group.getName() for group conversations
   *
   * @returns The name or empty string if not available
   * @see Requirements 2.1, 2.3
   */
  getAvatarName(): string {
    const user = this.currentUser();
    const group = this.currentGroup();

    if (user) {
      return user.getName?.() || '';
    }
    if (group) {
      return group.getName?.() || '';
    }
    return '';
  }

  // ==================== Title Helper Methods ====================

  /**
   * Get the display name for the header title
   * Returns user.getName() for user conversations or group.getName() for group conversations
   *
   * @returns The display name or empty string if not available
   * @see Requirements 1.1, 1.2, 10.4
   */
  getDisplayName(): string {
    const user = this.currentUser();
    const group = this.currentGroup();

    if (user) {
      return user.getName?.() || '';
    }
    if (group) {
      return group.getName?.() || '';
    }
    return '';
  }

  // ==================== Subtitle Helper Methods ====================

  /**
   * Get the typing indicator text for the subtitle
   * For user conversations: returns localization key for "Typing..."
   * For group conversations: returns formatted text based on number of typing users
   *   - Single user: "{name} is typing..."
   *   - Two users: "{name1} and {name2} are typing..."
   *   - Multiple users: "{name} and X others are typing..."
   *
   * @returns The typing indicator text or empty string if not typing
   * @see Requirements 2.6, 2.7, 3.1, 3.2, 3.3, 3.4, 3.5
   */
  getTypingText(): string {
    const typingIndicator = this.typingIndicatorSignal();
    if (!typingIndicator) {
      return '';
    }

    const user = this.currentUser();
    const group = this.currentGroup();

    // For user conversations, just show "Typing..."
    if (user) {
      return CometChatLocalize.getLocalizedString('message_header_typing');
    }

    // For group conversations, show who is typing
    if (group) {
      const typingUsers = this.typingUsersSignal();

      if (typingUsers.length === 0) {
        // Fallback to single typing indicator
        const sender = typingIndicator.getSender();
        if (sender) {
          const senderName = sender.getName() || '';
          return `${senderName} ${CometChatLocalize.getLocalizedString('message_header_is_typing')}`;
        }
        return CometChatLocalize.getLocalizedString('message_header_typing');
      }

      if (typingUsers.length === 1) {
        // Single user typing: "John is typing..."
        const userName = typingUsers[0].getName() || '';
        return `${userName} ${CometChatLocalize.getLocalizedString('message_header_is_typing')}`;
      }

      if (typingUsers.length === 2) {
        // Two users typing: "John and Jane are typing..."
        const name1 = typingUsers[0].getName() || '';
        const name2 = typingUsers[1].getName() || '';
        return `${name1} ${CometChatLocalize.getLocalizedString('message_header_and')} ${name2} ${CometChatLocalize.getLocalizedString('message_header_are_typing')}`;
      }

      // Multiple users typing: "John and 2 others are typing..."
      const firstName = typingUsers[0].getName() || '';
      const othersCount = typingUsers.length - 1;
      return `${firstName} ${CometChatLocalize.getLocalizedString('message_header_and')} ${othersCount} ${CometChatLocalize.getLocalizedString('message_header_others_typing')}`;
    }

    return CometChatLocalize.getLocalizedString('message_header_typing');
  }

  /**
   * Get the number of users currently typing in a group
   *
   * @returns The number of typing users
   * @see Requirements 3.3
   */
  getTypingUsersCount(): number {
    return this.typingUsersSignal().length;
  }

  /**
   * Get the member count text for group conversations
   * Returns formatted string like "X Members" or "1 Member"
   *
   * @returns The member count text or empty string if not a group
   * @see Requirements 3.4, 4.1
   */
  getMemberCountText(): string {
    const group = this.currentGroup();
    if (!group) {
      return '';
    }

    const count = this.groupMemberCountSignal();
    // Return the count - the template will handle the localization
    return count.toString();
  }

  /**
   * Get the member count for group conversations
   *
   * @returns The member count or 0 if not a group
   * @see Requirements 3.4, 4.1
   */
  getMemberCount(): number {
    const group = this.currentGroup();
    if (!group) {
      return 0;
    }
    return this.groupMemberCountSignal();
  }

  /**
   * Check if user is online
   *
   * @returns true if user is online, false otherwise
   * @see Requirements 2.4, 2.5
   */
  isUserOnline(): boolean {
    return this.userStatusSignal() === 'online';
  }

  /**
   * Get the last active timestamp for offline users
   *
   * @returns The last active timestamp or null if not available
   * @see Requirements 2.5
   */
  getLastActiveTimestamp(): number | null {
    return this.lastActiveAtSignal();
  }

  /**
   * Get the default calendar object for last active date formatting
   * Uses lastActiveAtDateTimeFormat if provided, otherwise uses default format
   *
   * @returns CalendarObject for date formatting
   * @see Requirements 2.5
   */
  getLastActiveDateFormat(): CalendarObject {
    if (this.lastActiveAtDateTimeFormat) {
      return this.lastActiveAtDateTimeFormat;
    }

    // Default format for last active timestamp
    return {
      today: 'h:mm A',
      yesterday: '[Yesterday]',
      lastWeek: 'dddd',
      otherDays: 'DD/MM/YYYY',
      relativeTime: {
        minute: '1 min ago',
        minutes: '%d mins ago',
        hour: '1 hour ago',
        hours: '%d hours ago',
      },
    };
  }

  // ==================== Accessibility Methods ====================

  /**
   * Get the ARIA label for the header container
   * Includes user/group name and current status for screen readers
   *
   * @returns The ARIA label string
   * @see Requirements 12.4, 12.5
   */
  getHeaderAriaLabel(): string {
    const name = this.getDisplayName();
    const user = this.currentUser();
    const group = this.currentGroup();

    if (user) {
      const status = this.userStatusSignal();
      const statusText =
        status === 'online'
          ? CometChatLocalize.getLocalizedString('message_header_status_online')
          : CometChatLocalize.getLocalizedString('message_header_status_offline');
      return `${name}, ${statusText}`;
    }

    if (group) {
      const memberCount = this.getMemberCount();
      const membersText =
        memberCount === 1
          ? CometChatLocalize.getLocalizedString('message_header_member')
          : CometChatLocalize.getLocalizedString('message_header_members');
      return `${name}, ${memberCount} ${membersText}`;
    }

    return CometChatLocalize.getLocalizedString('message_header_back');
  }

  /**
   * Get the ARIA label for the clickable item section
   * Provides context about what clicking the item will do
   *
   * @returns The ARIA label string
   * @see Requirements 12.4
   */
  getItemAriaLabel(): string {
    const name = this.getDisplayName();
    const user = this.currentUser();
    const group = this.currentGroup();

    if (user) {
      const status = this.userStatusSignal();
      const statusText =
        status === 'online'
          ? CometChatLocalize.getLocalizedString('message_header_status_online')
          : CometChatLocalize.getLocalizedString('message_header_status_offline');
      return `${name}, ${statusText}. ${CometChatLocalize.getLocalizedString('message_header_click_for_details')}`;
    }

    if (group) {
      const memberCount = this.getMemberCount();
      const membersText =
        memberCount === 1
          ? CometChatLocalize.getLocalizedString('message_header_member')
          : CometChatLocalize.getLocalizedString('message_header_members');
      return `${name}, ${memberCount} ${membersText}. ${CometChatLocalize.getLocalizedString('message_header_click_for_details')}`;
    }

    return '';
  }

  /**
   * Close the overflow menu programmatically
   * Called when Escape key is pressed
   *
   * @see Requirements 12.3
   */
  closeOverflowMenu(): void {
    this.isOverflowMenuOpen = false;
    // The context menu component handles its own closing
    // This flag is used to track state for Escape key handling
  }

  /**
   * Handle overflow menu open state change
   * Called when the context menu opens or closes
   *
   * @param isOpen - Whether the menu is open
   * @see Requirements 12.3
   */
  handleOverflowMenuStateChange(isOpen: boolean): void {
    this.isOverflowMenuOpen = isOpen;
  }

  /**
   * Announce status change to screen readers
   * Creates a temporary aria-live region to announce the change
   *
   * @param status - The new status ('online' or 'offline')
   * @see Requirements 12.5
   */
  private announceStatusChange(status: string): void {
    const user = this.currentUser();
    const userName = user?.getName?.() || '';
    const statusText =
      status === 'online'
        ? CometChatLocalize.getLocalizedString('message_header_user_now_online')
        : CometChatLocalize.getLocalizedString('message_header_user_now_offline');

    const announcement = `${userName} ${statusText}`;

    // Create a temporary element for screen reader announcement
    const announcementElement = document.createElement('div');
    announcementElement.setAttribute('role', 'status');
    announcementElement.setAttribute('aria-live', 'polite');
    announcementElement.setAttribute('aria-atomic', 'true');
    announcementElement.className = 'cometchat-sr-only';
    announcementElement.textContent = announcement;

    // Add to DOM
    document.body.appendChild(announcementElement);

    // Remove after announcement is made (1 second delay)
    this.pendingTimers.push(setTimeout(() => {
      if (document.body.contains(announcementElement)) {
        document.body.removeChild(announcementElement);
      }
    }, 1000));
  }
}
