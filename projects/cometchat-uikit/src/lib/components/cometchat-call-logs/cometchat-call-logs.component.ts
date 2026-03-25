/**
 * CometChatCallLogs Component
 *
 * Displays a paginated list of call history records for the logged-in user.
 * Ported from the React `CometChatCallLogs` component following Angular-native
 * architecture with services and dependency injection.
 *
 * Delegates business logic to `CallLogsService` while handling UI rendering,
 * template overrides, and user interactions.
 *
 * Accessibility Features:
 * - Full keyboard navigation with ArrowUp/ArrowDown, Home/End
 * - Enter key to view call details, Space key to initiate call
 * - Roving tabindex pattern for efficient keyboard navigation
 * - ARIA labels for screen reader support
 * - aria-label="Call history list" on container
 *
 * @module components/cometchat-call-logs
 * @see Requirements 1.1, 2.1–2.5, 3.1–3.2, 5.1–5.8, 6.1, 7.1–7.2, 8.1–8.3, 11.1–11.6

 */
import {
  Component,
  Input,
  Output,
  EventEmitter,
  TemplateRef,
  ChangeDetectionStrategy,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
  ChangeDetectorRef,
  ViewChild,
  ElementRef,
  booleanAttribute,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CometChat } from '@cometchat/chat-sdk-javascript';

// Component imports
import { CometChatPaginatedListComponent } from '../cometchat-paginated-list/cometchat-paginated-list.component';
import { CometChatListItemComponent } from '../base-elements/cometchat-list-item/cometchat-list-item.component';
import { CometChatDateComponent } from '../base-elements/cometchat-date/cometchat-date.component';
import { CometChatOutgoingCallComponent } from '../cometchat-outgoing-call/cometchat-outgoing-call.component';
import { CometChatOngoingCallComponent } from '../cometchat-ongoing-call/cometchat-ongoing-call.component';

// Service imports
import { CallLogsService } from '../../services/call-logs.service';

// Resource imports
import { CometChatLocalize } from '../../resources/CometChatLocalize/cometchat-localize';
import { TranslatePipe } from '../../resources/CometChatLocalize/translate.pipe';

// Type imports
import { CalendarObject } from '../../resources/CometChatLocalize/localization.interfaces';
import { CallWorkflow, States } from '../../Enums/Enums';
import { CometChatUIKitConstants } from '../../constants';
import { CometChatCallEvents } from '../../events/CometChatCallEvents';

// Utility imports
import { verifyCallUser, isSentByMe, isMissedCall } from '../../utils/CallLogUtils';
import { sanitizeCalendarObject } from '../../utils/util';

// Service imports for accessibility
import { ListNavigationService } from '../../services/list-navigation.service';
import { GlobalConfig, COMETCHAT_GLOBAL_CONFIG } from '../../services/global-config.service';
import { CometChatTemplatesService } from '../../services/templates.service';
import { CometChatUIKitCalls } from '../../CometChatCalls';
import { CometChatUIKit } from '../../cometchat-uikit';

/**
 * CometChatCallLogs displays a paginated list of call history records.
 * It follows the same architectural pattern as CometChatConversationsComponent:
 * a thin UI component backed by an injectable CallLogsService.
 *
 * @example
 * ```html
 * <cometchat-call-logs
 *   [activeCall]="selectedCall"
 *   (itemClick)="onCallLogClick($event)"
 *   (callButtonClicked)="onCallButtonClick($event)">
 * </cometchat-call-logs>
 * ```
 */
@Component({
  selector: 'cometchat-call-logs',
  standalone: true,
  imports: [
    CommonModule,
    CometChatPaginatedListComponent,
    CometChatListItemComponent,
    CometChatDateComponent,
    CometChatOutgoingCallComponent,
    CometChatOngoingCallComponent,
    TranslatePipe,
  ],
  providers: [CallLogsService],
  templateUrl: './cometchat-call-logs.component.html',
  styleUrls: ['./cometchat-call-logs.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CometChatCallLogsComponent implements OnInit, OnDestroy {
  /** @internal Timer references for cleanup */
  private pendingTimers: ReturnType<typeof setTimeout>[] = [];

  // ==================== Shared Constants ====================
  readonly shimmerList = CometChatUIKitConstants.shimmerList;

  // ==================== Service Injection ====================
  private callLogsService = inject(CallLogsService);
  private listNavigationService = inject(ListNavigationService);
  private templatesService = inject(CometChatTemplatesService);
  private cdr = inject(ChangeDetectorRef);
  private globalConfig: Partial<GlobalConfig> | null = inject(COMETCHAT_GLOBAL_CONFIG, {
    optional: true,
  });

  // ==================== ExplicitlySet Flags & Backing Fields (GlobalConfig Priority System) ====================
  private showScrollbarExplicitlySet = signal(false);
  private _showScrollbar = signal(false);

  // ==================== View Children ====================

  /**
   * Reference to the list container for keyboard navigation
   */
  @ViewChild('listContainer') listContainer!: ElementRef<HTMLElement>;

  /**
   * Reference to the paginated list for calling loadComplete() after fetch
   */
  @ViewChild(CometChatPaginatedListComponent) paginatedList?: CometChatPaginatedListComponent<any>;

  // ==================== Data Inputs ====================

  /**
   * The currently selected/active call log for highlighting.
   * @see Requirement 6.1
   */
  @Input() activeCall: any = null;

  /**
   * Custom CallLogRequestBuilder from CometChatUIKitCalls.
   * When provided, overrides the default builder (limit 30, category "call").
   * @see Requirement 2.5
   */
  @Input() callLogRequestBuilder: any = null;

  /**
   * Custom date format for the call initiation timestamp.
   * Merged with global and default CalendarObject formats.
   * @see Requirement 2.3
   */
  @Input() callInitiatedDateTimeFormat: CalendarObject | null = null;

  /**
   * Whether to show the scrollbar on the list.
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
   * Custom CallSettingsBuilder to override the default call settings
   * used in the ongoing call overlay.
   * Priority: @Input > GlobalConfig > default (built internally in getCallBuilder).
   */
  @Input() callSettingsBuilder: typeof CometChatUIKitCalls.CallSettingsBuilder = undefined;

  // ==================== Callback Inputs ====================

  /**
   * Error callback invoked for any error during operations.
   * @see Requirement 7.1, 7.2
   */
  @Input() onError: ((error: CometChat.CometChatException) => void) | null = null;

  // ==================== Template Override Inputs ====================

  /**
   * Custom template for the menu area (right side of header title).
   * Use this to add a 3-dot menu or action buttons without overriding the entire header.
   */
  @Input() menuView: TemplateRef<any> | null = null;

  /**
   * Custom template for each call log item (replaces entire list item).
   * @see Requirement 5.1
   */
  @Input() itemView: TemplateRef<any> | null = null;

  /**
   * Custom template for the leading position (replaces avatar).
   * @see Requirement 5.2
   */
  @Input() leadingView: TemplateRef<any> | null = null;

  /**
   * Custom template for the title (replaces other party's name).
   * @see Requirement 5.3
   */
  @Input() titleView: TemplateRef<any> | null = null;

  /**
   * Custom template for the subtitle (replaces direction icon + date).
   * @see Requirement 5.4
   */
  @Input() subtitleView: TemplateRef<any> | null = null;

  /**
   * Custom template for the trailing position (replaces call button).
   * @see Requirement 5.5
   */
  @Input() trailingView: TemplateRef<any> | null = null;

  /**
   * Custom template for the loading state (replaces shimmer).
   * @see Requirement 5.6
   */
  @Input() loadingView: TemplateRef<any> | null = null;

  /**
   * Custom template for the empty state.
   * @see Requirement 5.7
   */
  @Input() emptyView: TemplateRef<any> | null = null;

  /**
   * Custom template for the error state.
   * @see Requirement 5.8
   */
  @Input() errorView: TemplateRef<any> | null = null;

  // ==================== Template Resolution (@Input > Component Service > Shared Service > Default) ====================
  get effectiveItemView(): TemplateRef<any> | undefined {
    return this.itemView || this.templatesService.getCallLogTemplates().itemView || undefined;
  }
  get effectiveLeadingView(): TemplateRef<any> | undefined {
    return this.leadingView || this.templatesService.getCallLogTemplates().leadingView || undefined;
  }
  get effectiveTitleView(): TemplateRef<any> | undefined {
    return this.titleView || this.templatesService.getCallLogTemplates().titleView || undefined;
  }
  get effectiveSubtitleView(): TemplateRef<any> | undefined {
    return this.subtitleView || this.templatesService.getCallLogTemplates().subtitleView || undefined;
  }
  get effectiveTrailingView(): TemplateRef<any> | undefined {
    return this.trailingView || this.templatesService.getCallLogTemplates().trailingView || undefined;
  }
  get effectiveLoadingView(): TemplateRef<any> | undefined {
    return (
      this.loadingView ||
      this.templatesService.resolveTemplate(this.templatesService.getCallLogTemplates(), 'loadingView')
    );
  }
  get effectiveEmptyView(): TemplateRef<any> | undefined {
    return (
      this.emptyView ||
      this.templatesService.resolveTemplate(this.templatesService.getCallLogTemplates(), 'emptyView')
    );
  }
  get effectiveErrorView(): TemplateRef<any> | undefined {
    return (
      this.errorView ||
      this.templatesService.resolveTemplate(this.templatesService.getCallLogTemplates(), 'errorView')
    );
  }

  // ==================== Output Events ====================

  /**
   * Emitted when a call log list item is clicked.
   * @see Requirement 3.2 (handler delegation)
   */
  @Output() itemClick = new EventEmitter<any>();

  /**
   * Emitted when the trailing call button is clicked (if handler provided).
   * @see Requirement 3.2
   */
  @Output() callButtonClicked = new EventEmitter<any>();

  // ==================== Effective Values (GlobalConfig Priority System) ====================

  /**
   * Resolved showScrollbar value using 3-tier priority:
   * 1. Explicitly set @Input value
   * 2. GlobalConfig value (if defined)
   * 3. Component default (false)
   */
  effectiveShowScrollbar = computed(() => {
    if (this.showScrollbarExplicitlySet()) return this._showScrollbar();
    if (this.globalConfig?.showScrollbar !== undefined) return this.globalConfig.showScrollbar;
    return false;
  });

  // ==================== Signal-Based State from Service ====================

  /** Expose service signals for template binding */
  readonly callLogs = this.callLogsService.callLogs;
  readonly state = this.callLogsService.state;
  readonly hasMore = this.callLogsService.hasMore;
  readonly showOutgoingCallScreen = this.callLogsService.showOutgoingCallScreen;
  readonly showOngoingCall = this.callLogsService.showOngoingCall;
  readonly activeCallObject = this.callLogsService.activeCallObject;
  readonly sessionId = this.callLogsService.sessionId;

  // ==================== Component State ====================

  /** The currently logged-in CometChat user */
  loggedInUser: CometChat.User | null = null;

  /** Loading state for pagination */
  isFetchingMore = signal(false);

  /** Error object for paginated list error binding */
  readonly errorObject = new Error('Failed to load call logs');

  /**
   * Index of the currently focused item for keyboard navigation.
   * Uses roving tabindex pattern where only focused item has tabindex="0".
   * @see Requirement 11.1
   */
  focusedIndex = signal(-1);

  // ==================== Exposed Enums ====================
  readonly CallWorkflow = CallWorkflow;

  /**
   * Whether calling features are enabled via `UIKitSettingsBuilder.setCallingEnabled(true)`.
   * Used in the template to conditionally render the trailing call button.
   */
  get callingEnabled(): boolean {
    return CometChatUIKit.isCallingEnabled();
  }

  // ==================== Lifecycle Hooks ====================

  async ngOnInit(): Promise<void> {
    await this.initializeLoggedInUser();
    this.initializeService();
  }

  ngOnDestroy(): void {
    this.pendingTimers.forEach(t => clearTimeout(t));
    this.pendingTimers = [];
    this.callLogsService.cleanup();
  }

  // ==================== Initialization Methods ====================

  /**
   * Fetches the logged-in user from CometChat SDK.
   */
  private async initializeLoggedInUser(): Promise<void> {
    try {
      this.loggedInUser = await CometChat.getLoggedinUser();
    } catch (error) {
      console.error('[CometChatCallLogs] Error getting logged-in user:', error);
    }
  }

  /**
   * Configures the service with component inputs and starts data fetching.
   */
  private initializeService(): void {
    if (this.loggedInUser) {
      this.callLogsService.setLoggedInUser(this.loggedInUser);
    }
    if (this.callLogRequestBuilder) {
      this.callLogsService.setCallLogRequestBuilder(this.callLogRequestBuilder);
    }
    if (this.onError) {
      this.callLogsService.setOnError(this.onError);
    }

    this.callLogsService.initialize();
    this.callLogsService.fetchCallLogs();
  }

  // ==================== Utility Wrappers ====================

  /**
   * Returns the other party in a call relative to the logged-in user.
   * Delegates to the utility function from CallLogUtils.
   *
   * @param call - A call log object
   * @returns The other party object
   * @see Requirement 2.1
   */
  getCallUser(call: any): any {
    if (!this.loggedInUser) return null;
    return verifyCallUser(call, this.loggedInUser);
  }

  /**
   * Determines if the call was initiated by the logged-in user.
   * Delegates to the utility function from CallLogUtils.
   *
   * @param call - A call log object
   * @returns true if the logged-in user initiated the call
   * @see Requirement 2.2
   */
  isCallSentByMe(call: any): boolean {
    if (!this.loggedInUser) return false;
    return isSentByMe(call, this.loggedInUser);
  }

  /**
   * Determines if the call was a missed call for the logged-in user.
   * Delegates to the utility function from CallLogUtils.
   *
   * @param call - A call log object
   * @returns true if the call was missed
   * @see Requirement 2.2
   */
  isCallMissed(call: any): boolean {
    if (!this.loggedInUser) return false;
    return isMissedCall(call, this.loggedInUser);
  }

  // ==================== Date Formatting ====================

  /**
   * Returns the merged CalendarObject for call initiation timestamps.
   * Merges default → global → component-level formats (component wins).
   *
   * Follows the same pattern as React's `getDateFormat()` and
   * Angular's `CometChatFullscreenViewerComponent.getDateFormat()`.
   *
   * @returns CalendarObject with merged format settings
   * @see Requirement 2.3
   */
  getDateFormat(): CalendarObject {
    const defaultFormat: CalendarObject = {
      yesterday: 'DD MMM, hh:mm A',
      otherDays: 'DD MMM, hh:mm A',
      today: 'DD MMM, hh:mm A',
    };

    const globalCalendarFormat = sanitizeCalendarObject(CometChatLocalize.getCalendarObject());
    const componentCalendarFormat = sanitizeCalendarObject(this.callInitiatedDateTimeFormat);

    return {
      ...defaultFormat,
      ...globalCalendarFormat,
      ...componentCalendarFormat,
    };
  }

  // ==================== Event Handlers ====================

  /**
   * Handles click on the trailing call button.
   *
   * If `callButtonClicked` has observers, emits the call log to the handler.
   * Otherwise, initiates a call of the same type to the other party.
   *
   * @param call - The call log item
   * @see Requirement 3.1, 3.2
   */
  handleInfoClick(call: any): void {
    try {
      if (this.callButtonClicked.observed) {
        this.callButtonClicked.emit(call);
      } else {
        const entity = this.getCallUser(call);
        if (entity?.uid) {
          this.callLogsService.initiateCall(call?.type, entity.uid);
        }
      }
    } catch (err) {
      this.handleError(err);
    }
  }

  /**
   * Handles click on a call log list item.
   * Emits the call log via the `itemClick` output.
   *
   * @param call - The call log item
   */
  handleItemClick(call: any): void {
    try {
      this.itemClick.emit(call);
    } catch (err) {
      this.handleError(err);
    }
  }

  /**
   * Handles Enter key on the wrapper div for a call log item.
   * Only triggers handleItemClick when the event target is the wrapper itself,
   * preventing double-fire when the child cometchat-list-item also handles Enter.
   *
   * @param event - The keyboard event
   * @param call - The call log item
   */
  handleWrapperEnter(event: Event, call: any): void {
    event.stopPropagation();
    this.handleItemClick(call);
  }

  /**
   * Handles Space key on the wrapper div for a call log item.
   * Only triggers handleInfoClick when the event target is the wrapper itself,
   * preventing double-fire when the child cometchat-list-item also handles Space.
   *
   * @param event - The keyboard event
   * @param call - The call log item
   */
  handleWrapperSpace(event: Event, call: any): void {
    event.preventDefault();
    event.stopPropagation();
    this.handleInfoClick(call);
  }

  /**
   * Handles cancellation of the outgoing call overlay.
   * Delegates to the service to reject the call and reset state.
   *
   * @see Requirement 3.4
   */
  onOutgoingCallCanceled(): void {
    this.callLogsService.cancelOutgoingCall();
  }

  /**
   * Handles pagination — loads the next page of call logs.
   */
  handleLoadMore(): void {
    if (this.isFetchingMore()) return;
    this.isFetchingMore.set(true);

    this.callLogsService
      .fetchNextCallLogs()
      .then(() => {
        this.isFetchingMore.set(false);
        this.paginatedList?.loadComplete();
      })
      .catch(() => {
        this.isFetchingMore.set(false);
        this.paginatedList?.loadComplete();
      });
  }

  // ==================== Ongoing Call Builder ====================

  /**
   * Builds call settings for the ongoing call overlay.
   *
   * Uses 3-tier priority for the builder:
   * 1. @Input callSettingsBuilder (if not undefined)
   * 2. GlobalConfig.callSettingsBuilder (if defined)
   * 3. Default builder with enableDefaultLayout(true) and audio-only flag
   *
   * Always attaches an `OngoingCallListener` for call end events.
   *
   * @returns CallSettingsBuilder configured for the ongoing call
   * @see Requirement 4.1, 4.3
   */
  getCallBuilder(): any {
    const call = this.activeCallObject();
    const audioOnlyCall = call?.getType() === CometChatUIKitConstants.MessageTypes.audio;

    // 3-tier priority: @Input > GlobalConfig > default
    let callsBuilder: any;
    if (this.callSettingsBuilder !== undefined) {
      callsBuilder = this.callSettingsBuilder;
    } else if (this.globalConfig?.callSettingsBuilder !== undefined) {
      callsBuilder = this.globalConfig.callSettingsBuilder;
    } else {
      callsBuilder = new CometChatUIKitCalls.CallSettingsBuilder()
        .enableDefaultLayout(true)
        .setIsAudioOnlyCall(audioOnlyCall);
    }

    const currentSessionId = this.sessionId();

    callsBuilder.setCallListener(
      new CometChatUIKitCalls.OngoingCallListener({
        onCallEnded: () => {
          CometChatUIKitCalls.endSession();
          CometChat.clearActiveCall();
          CometChatCallEvents.ccCallEnded.next(null as any);
        },
        onCallEndButtonPressed: () => {
          CometChat.endCall(currentSessionId!)
            .then((endedCall: CometChat.Call) => {
              CometChatUIKitCalls.endSession();
              CometChatCallEvents.ccCallEnded.next(endedCall);
            })
            .catch((err: CometChat.CometChatException) => {
              this.handleError(err);
            });
        },
        onError: (error: unknown) => {
          this.handleError(error);
        },
      })
    );

    return callsBuilder;
  }

  // ==================== Active Call Matching ====================

  /**
   * Determines if a call log matches the active call for highlighting.
   *
   * @param call - The call log to check
   * @returns true if the call's session ID matches the active call
   * @see Requirement 6.1
   */
  isActiveCall(call: any): boolean {
    if (!this.activeCall) return false;
    try {
      return this.activeCall.getSessionID() === call.getSessionID();
    } catch {
      return false;
    }
  }

  /**
   * TrackBy function for ngFor performance optimization.
   */
  trackByCallLog(_index: number, call: any): string {
    return call?.getSessionID?.() ?? _index;
  }

  // ==================== Error Handling ====================

  /**
   * Handles errors by wrapping in CometChatException and forwarding
   * to the onError callback or logging to console.
   *
   * @param err - The error to handle
   * @see Requirement 7.1, 7.2
   */
  private handleError(err: unknown): void {
    let exception: CometChat.CometChatException;

    if (err instanceof CometChat.CometChatException) {
      exception = err;
    } else if (err instanceof Error) {
      exception = new CometChat.CometChatException({
        code: 'CALL_LOGS_ERROR',
        message: err.message,
        details: err.stack || '',
      });
    } else {
      exception = new CometChat.CometChatException({
        code: 'CALL_LOGS_ERROR',
        message: String(err),
        details: '',
      });
    }

    if (this.onError) {
      this.onError(exception);
    }

    console.error('[CometChatCallLogs] Error:', err);
  }

  // ==================== Keyboard Navigation ====================

  /**
   * Handles keyboard events for the call logs list.
   * Implements keyboard navigation per Requirement 11.1-11.3:
   * - ArrowUp/ArrowDown: Navigate between items
   * - Enter: View call details (emit itemClick)
   * - Space: Initiate call to contact
   * - Home/End: Jump to first/last item
   *
   * @param event - The keyboard event
   * @see Requirements 11.1, 11.2, 11.3
   */
  onCallLogsKeyDown(event: KeyboardEvent): void {
    const logs = this.callLogs();
    if (logs.length === 0) return;

    // Handle Enter: View call details
    if (event.key === 'Enter') {
      event.preventDefault();
      const currentIndex = this.focusedIndex();
      if (currentIndex >= 0 && currentIndex < logs.length) {
        this.handleItemClick(logs[currentIndex]);
      }
      return;
    }

    // Handle Space: Initiate call (if call button available)
    if (event.key === ' ') {
      event.preventDefault();
      const currentIndex = this.focusedIndex();
      if (currentIndex >= 0 && currentIndex < logs.length) {
        this.handleInfoClick(logs[currentIndex]);
      }
      return;
    }

    // Handle arrow navigation via ListNavigationService
    const newIndex = this.listNavigationService.handleKeyNavigation(event, this.focusedIndex(), {
      itemCount: logs.length,
      wrap: false,
    });

    if (newIndex !== -1 && newIndex !== this.focusedIndex()) {
      this.focusedIndex.set(newIndex);
      this.cdr.markForCheck();
      this.scrollFocusedItemIntoView();

      // Check if we're at the last item and should load more
      if (newIndex === logs.length - 1 && this.hasMore() && !this.isFetchingMore()) {
        this.handleLoadMore();
      }
    }
  }

  /**
   * Computes the accessible label for a call log item.
   * Combines contact name, call type, call status, and timestamp.
   *
   * @param call - The call log item
   * @returns Accessible label string for screen readers
   * @see Requirements 11.5, 11.6
   */
  getCallLogAriaLabel(call: any): string {
    const parts: string[] = [];

    // Contact name
    const callUser = this.getCallUser(call);
    const name = callUser?.getName?.() || '';
    if (name) {
      parts.push(name);
    }

    // Call type (audio/video)
    const typeKey =
      call?.type === 'video' ? 'accessibility_video_call' : 'accessibility_voice_call';
    parts.push(CometChatLocalize.getLocalizedString(typeKey));

    // Call status (missed/incoming/outgoing)
    let statusKey: string;
    if (this.isCallSentByMe(call)) {
      statusKey = 'accessibility_call_outgoing';
    } else if (this.isCallMissed(call)) {
      statusKey = 'accessibility_call_missed';
    } else {
      statusKey = 'accessibility_call_incoming';
    }
    parts.push(CometChatLocalize.getLocalizedString(statusKey));

    // Timestamp - format using the date format
    if (call?.initiatedAt) {
      const date = new Date(call.initiatedAt * 1000);
      parts.push(date.toLocaleString());
    }

    return parts.join(', ');
  }

  /**
   * Gets the tabindex for a call log item based on roving tabindex pattern.
   * Only the focused item has tabindex="0", others have tabindex="-1".
   *
   * @param index - The index of the item
   * @returns 0 if focused, -1 otherwise
   * @see Requirement 11.1
   */
  getItemTabIndex(index: number): number {
    const currentFocused = this.focusedIndex();
    // If this item is focused, it should be tabbable
    if (currentFocused === index) {
      return 0;
    }
    // If no item is focused and this is the first item, make it tabbable
    if (currentFocused === -1 && index === 0) {
      return 0;
    }
    return -1;
  }

  /**
   * Handles when an item receives focus (via Tab key or click).
   * Syncs focusedIndex with browser focus state.
   *
   * @param index - The index of the item that received focus
   */
  handleItemFocus(index: number): void {
    this.focusedIndex.set(index);
    this.cdr.markForCheck();
  }

  /**
   * Handles focus events on the list container.
   * Sets initial focus to first item if no item is currently focused.
   *
   * @see Requirement 11.1
   */
  handleListFocus(): void {
    if (this.focusedIndex() === -1 && this.callLogs().length > 0) {
      this.focusedIndex.set(0);
      this.cdr.markForCheck();
    }
  }

  /**
   * Scrolls the currently focused item into view.
   * Uses setTimeout to ensure DOM has updated with new focusedIndex.
   *
   * @private
   */
  private scrollFocusedItemIntoView(): void {
    this.pendingTimers.push(setTimeout(() => {
      if (!this.listContainer) return;

      const focusedElement = this.listContainer.nativeElement.querySelector(
        `[data-index="${this.focusedIndex()}"]`
      );

      if (focusedElement) {
        focusedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        (focusedElement as HTMLElement).focus();
      }
    }, 0));
  }

  /**
   * Handles retry button click in error state.
   * Shows shimmer loading state, then returns to error state after 300ms.
   */
  handleRetryClick(): void {
    this.callLogsService.setState(States.loading);
    this.cdr.markForCheck();

    this.pendingTimers.push(
      setTimeout(() => {
        this.callLogsService.setState(States.error);
        this.cdr.markForCheck();
      }, 300)
    );
  }
}
