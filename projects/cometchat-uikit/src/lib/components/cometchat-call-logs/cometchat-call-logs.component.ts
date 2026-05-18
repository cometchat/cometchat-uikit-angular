/**
 * CometChatCallLogs Component
 *
 * Displays a paginated list of call history records for the logged-in user.
 * Delegates business logic to `CallLogsService` while handling UI rendering,
 * template overrides, and user interactions.
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

import { CometChatPaginatedListComponent } from '../cometchat-paginated-list/cometchat-paginated-list.component';
import { CometChatListItemComponent } from '../base-elements/cometchat-list-item/cometchat-list-item.component';
import { CometChatDateComponent } from '../base-elements/cometchat-date/cometchat-date.component';
import { CometChatOutgoingCallComponent } from '../cometchat-outgoing-call/cometchat-outgoing-call.component';
import { CometChatOngoingCallComponent } from '../cometchat-ongoing-call/cometchat-ongoing-call.component';

import { CallLogsService } from '../../services/call-logs.service';
import { TranslatePipe } from '../../resources/CometChatLocalize/translate.pipe';
import { CalendarObject } from '../../resources/CometChatLocalize/localization.interfaces';
import { CallWorkflow, States } from '../../Enums/Enums';
import { CometChatUIKitConstants } from '../../constants';
import { CometChatCallEvents } from '../../events/CometChatCallEvents';
import { verifyCallUser, isSentByMe, isMissedCall } from '../../utils/CallLogUtils';
import { ListNavigationService } from '../../services/list-navigation.service';
import { GlobalConfig, COMETCHAT_GLOBAL_CONFIG } from '../../services/global-config.service';
import { CometChatTemplatesService } from '../../services/templates.service';
import { CometChatUIKitCalls } from '../../CometChatCalls';
import { CometChatUIKit } from '../../cometchat-uikit';
import { buildCallLogDateFormat, wrapCallLogsError, buildCallLogAriaLabel } from './cometchat-call-logs.utils';
import { CometChatLogger } from '../../utils/CometChatLogger';
import { CometChatErrorBoundaryComponent } from '../base-elements/cometchat-error-boundary/cometchat-error-boundary.component';

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
    CometChatErrorBoundaryComponent,
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

  readonly shimmerList = CometChatUIKitConstants.shimmerList;

  private callLogsService = inject(CallLogsService);
  private listNavigationService = inject(ListNavigationService);
  private templatesService = inject(CometChatTemplatesService);
  private cdr = inject(ChangeDetectorRef);
  private globalConfig: Partial<GlobalConfig> | null = inject(COMETCHAT_GLOBAL_CONFIG, { optional: true });

  private showScrollbarExplicitlySet = signal(false);
  private _showScrollbar = signal(false);

  @ViewChild('listContainer') listContainer!: ElementRef<HTMLElement>;
  @ViewChild(CometChatPaginatedListComponent) paginatedList?: CometChatPaginatedListComponent<any>;

  // ==================== Data Inputs ====================

  @Input() activeCall: any = null;
  @Input() callLogRequestBuilder: any = null;
  @Input() callInitiatedDateTimeFormat: CalendarObject | null = null;

  @Input({ transform: booleanAttribute })
  set showScrollbar(value: boolean) {
    this._showScrollbar.set(value);
    this.showScrollbarExplicitlySet.set(true);
  }
  get showScrollbar(): boolean { return this._showScrollbar(); }

  @Input() callSettingsBuilder: typeof CometChatUIKitCalls.CallSettingsBuilder = undefined;
  @Input() onError: ((error: CometChat.CometChatException) => void) | null = null;

  // ==================== Template Override Inputs ====================

  @Input() menuView: TemplateRef<any> | null = null;
  @Input() itemView: TemplateRef<any> | null = null;
  @Input() leadingView: TemplateRef<any> | null = null;
  @Input() titleView: TemplateRef<any> | null = null;
  @Input() subtitleView: TemplateRef<any> | null = null;
  @Input() trailingView: TemplateRef<any> | null = null;
  @Input() loadingView: TemplateRef<any> | null = null;
  @Input() emptyView: TemplateRef<any> | null = null;
  @Input() errorView: TemplateRef<any> | null = null;

  // ==================== Template Resolution ====================

  get effectiveItemView() { return this.itemView || this.templatesService.getCallLogTemplates().itemView || undefined; }
  get effectiveLeadingView() { return this.leadingView || this.templatesService.getCallLogTemplates().leadingView || undefined; }
  get effectiveTitleView() { return this.titleView || this.templatesService.getCallLogTemplates().titleView || undefined; }
  get effectiveSubtitleView() { return this.subtitleView || this.templatesService.getCallLogTemplates().subtitleView || undefined; }
  get effectiveTrailingView() { return this.trailingView || this.templatesService.getCallLogTemplates().trailingView || undefined; }
  get effectiveLoadingView() { return this.loadingView || this.templatesService.resolveTemplate(this.templatesService.getCallLogTemplates(), 'loadingView'); }
  get effectiveEmptyView() { return this.emptyView || this.templatesService.resolveTemplate(this.templatesService.getCallLogTemplates(), 'emptyView'); }
  get effectiveErrorView() { return this.errorView || this.templatesService.resolveTemplate(this.templatesService.getCallLogTemplates(), 'errorView'); }

  // ==================== Output Events ====================

  @Output() itemClick = new EventEmitter<any>();
  @Output() callButtonClicked = new EventEmitter<any>();

  // ==================== Effective Values ====================

  effectiveShowScrollbar = computed(() => {
    if (this.showScrollbarExplicitlySet()) return this._showScrollbar();
    if (this.globalConfig?.showScrollbar !== undefined) return this.globalConfig.showScrollbar;
    return false;
  });

  // ==================== Signal-Based State from Service ====================

  readonly callLogs = this.callLogsService.callLogs;
  readonly state = this.callLogsService.state;
  readonly hasMore = this.callLogsService.hasMore;
  readonly showOutgoingCallScreen = this.callLogsService.showOutgoingCallScreen;
  readonly showOngoingCall = this.callLogsService.showOngoingCall;
  readonly activeCallObject = this.callLogsService.activeCallObject;
  readonly sessionId = this.callLogsService.sessionId;

  loggedInUser: CometChat.User | null = null;
  isFetchingMore = signal(false);
  readonly errorObject = new Error('Failed to load call logs');
  focusedIndex = signal(-1);
  readonly CallWorkflow = CallWorkflow;

  get callingEnabled(): boolean { return CometChatUIKit.isCallingEnabled(); }

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

  private async initializeLoggedInUser(): Promise<void> {
    try {
      this.loggedInUser = await CometChat.getLoggedinUser();
      this.cdr.markForCheck();
    } catch (error) {
      CometChatLogger.error('CometChatCallLogs', 'Error getting logged-in user:', error);
    }
  }

  private initializeService(): void {
    if (this.loggedInUser) this.callLogsService.setLoggedInUser(this.loggedInUser);
    if (this.callLogRequestBuilder) this.callLogsService.setCallLogRequestBuilder(this.callLogRequestBuilder);
    if (this.onError) this.callLogsService.setOnError(this.onError);
    this.callLogsService.initialize();
    this.callLogsService.fetchCallLogs();
  }

  // ==================== Utility Wrappers ====================

  getCallUser(call: any): any {
    if (!this.loggedInUser) return null;
    return verifyCallUser(call, this.loggedInUser);
  }

  isCallSentByMe(call: any): boolean {
    if (!this.loggedInUser) return false;
    return isSentByMe(call, this.loggedInUser);
  }

  isCallMissed(call: any): boolean {
    if (!this.loggedInUser) return false;
    return isMissedCall(call, this.loggedInUser);
  }

  getDateFormat(): CalendarObject {
    return buildCallLogDateFormat(this.callInitiatedDateTimeFormat);
  }

  // ==================== Event Handlers ====================

  handleInfoClick(call: any): void {
    try {
      if (this.callButtonClicked.observed) {
        this.callButtonClicked.emit(call);
      } else {
        const entity = this.getCallUser(call);
        if (entity?.uid) this.callLogsService.initiateCall(call?.type, entity.uid);
      }
    } catch (err) { this.handleError(err); }
  }

  handleItemClick(call: any): void {
    try { this.itemClick.emit(call); } catch (err) { this.handleError(err); }
  }

  handleWrapperEnter(event: Event, call: any): void {
    event.stopPropagation();
    this.handleItemClick(call);
  }

  handleWrapperSpace(event: Event, call: any): void {
    event.preventDefault();
    event.stopPropagation();
    this.handleInfoClick(call);
  }

  onOutgoingCallCanceled(): void { this.callLogsService.cancelOutgoingCall(); }

  handleLoadMore(): void {
    if (this.isFetchingMore()) return;
    this.isFetchingMore.set(true);
    this.callLogsService.fetchNextCallLogs()
      .then(() => { this.isFetchingMore.set(false); this.paginatedList?.loadComplete(); })
      .catch(() => { this.isFetchingMore.set(false); this.paginatedList?.loadComplete(); });
  }

  // ==================== Ongoing Call Builder ====================

  getCallBuilder(): any {
    const call = this.activeCallObject();
    const audioOnlyCall = call?.getType() === CometChatUIKitConstants.MessageTypes.audio;

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
            .catch((err: CometChat.CometChatException) => this.handleError(err));
        },
        onError: (error: unknown) => this.handleError(error),
      })
    );

    return callsBuilder;
  }

  // ==================== Active Call Matching ====================

  isActiveCall(call: any): boolean {
    if (!this.activeCall) return false;
    try { return this.activeCall.getSessionID() === call.getSessionID(); } catch { return false; }
  }

  trackByCallLog(_index: number, call: any): string {
    return call?.getSessionID?.() ?? _index;
  }

  // ==================== Error Handling ====================

  private handleError(err: unknown): void {
    const exception = wrapCallLogsError(err);
    if (this.onError) this.onError(exception);
    CometChatLogger.error('CometChatCallLogs', 'Error:', err);
  }

  // ==================== Keyboard Navigation ====================

  onCallLogsKeyDown(event: KeyboardEvent): void {
    const logs = this.callLogs();
    if (logs.length === 0) return;

    if (event.key === 'Enter') {
      event.preventDefault();
      const idx = this.focusedIndex();
      if (idx >= 0 && idx < logs.length) this.handleItemClick(logs[idx]);
      return;
    }

    if (event.key === ' ') {
      event.preventDefault();
      const idx = this.focusedIndex();
      if (idx >= 0 && idx < logs.length) this.handleInfoClick(logs[idx]);
      return;
    }

    const newIndex = this.listNavigationService.handleKeyNavigation(event, this.focusedIndex(), {
      itemCount: logs.length,
      wrap: false,
    });

    if (newIndex !== -1 && newIndex !== this.focusedIndex()) {
      this.focusedIndex.set(newIndex);
      this.cdr.markForCheck();
      this.scrollFocusedItemIntoView();
      if (newIndex === logs.length - 1 && this.hasMore() && !this.isFetchingMore()) {
        this.handleLoadMore();
      }
    }
  }

  getCallLogAriaLabel(call: any): string {
    return buildCallLogAriaLabel(
      call,
      this.getCallUser(call),
      this.isCallSentByMe(call),
      this.isCallMissed(call)
    );
  }

  getItemTabIndex(index: number): number {
    const currentFocused = this.focusedIndex();
    if (currentFocused === index) return 0;
    if (currentFocused === -1 && index === 0) return 0;
    return -1;
  }

  handleItemFocus(index: number): void {
    this.focusedIndex.set(index);
    this.cdr.markForCheck();
  }

  handleListFocus(): void {
    if (this.focusedIndex() === -1 && this.callLogs().length > 0) {
      this.focusedIndex.set(0);
      this.cdr.markForCheck();
    }
  }

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

  handleRetryClick(): void {
    this.callLogsService.setState(States.loading);
    this.cdr.markForCheck();
    this.pendingTimers.push(setTimeout(() => {
      this.callLogsService.setState(States.error);
      this.cdr.markForCheck();
    }, 300));
  }
}
