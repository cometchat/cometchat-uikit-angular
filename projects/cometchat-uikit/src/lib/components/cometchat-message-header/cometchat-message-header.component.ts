
import {Component, Input, Output, EventEmitter, TemplateRef, ContentChild, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, OnDestroy, OnChanges, SimpleChanges, Signal, computed, signal, inject, Injector, HostListener, ViewChild, effect, booleanAttribute, DestroyRef,} from '@angular/core';
import {CommonModule} from '@angular/common';

import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {CometChat} from '@cometchat/chat-sdk-javascript';

import {CometChatUIEvents} from '../../events/CometChatUIEvents';
import {CometChatGroupEvents, IGroupMemberAdded, IGroupMemberKickedBanned, IGroupMemberJoined, IOwnershipChanged, IGroupLeft,} from '../../events/CometChatGroupEvents';
import {CometChatUIKit} from '../../cometchat-uikit';
import {PanelAlignment} from '../../Enums/Enums';

import {CometChatAvatarComponent} from '../base-elements/cometchat-avatar/cometchat-avatar.component';
import {CometChatDateComponent} from '../base-elements/cometchat-date/cometchat-date.component';
import {CometChatContextMenuComponent, ContextMenuItem,} from '../base-elements/cometchat-context-menu/cometchat-context-menu.component';

import {MessageHeaderService} from '../../services/message-header.service';
import {ChatStateService} from '../../services/chat-state.service';
import {COMETCHAT_GLOBAL_CONFIG, GlobalConfig} from '../../services/global-config.service';

import {TranslatePipe} from '../../resources/CometChatLocalize/translate.pipe';
import {CometChatLocalize} from '../../resources/CometChatLocalize/cometchat-localize';

import {CalendarObject} from '../../resources/CometChatLocalize/localization.interfaces';

import {CometChatOption} from '../../modals';
import {CometChatCallButtonsComponent} from '../cometchat-call-buttons/cometchat-call-buttons.component';
import {CometChatUIKitCalls} from '../../CometChatCalls';
import {CometChatErrorBoundaryComponent} from '../base-elements/cometchat-error-boundary/cometchat-error-boundary.component';

import {getHeaderAvatarImage, getHeaderAvatarName, getHeaderDisplayName, getGroupMemberCountText, isUserOnline, getLastActiveTimestamp, getLastActiveDateFormat,} from './cometchat-message-header.utils';
import {getHeaderAriaLabel, getItemAriaLabel, announceStatusChange,} from './cometchat-message-header.accessibility';

@Component({
  selector: 'cometchat-message-header',
  standalone: true,
  imports: [CommonModule, CometChatAvatarComponent, CometChatDateComponent, CometChatContextMenuComponent, TranslatePipe, CometChatCallButtonsComponent, CometChatErrorBoundaryComponent],
  providers: [MessageHeaderService],
  templateUrl: './cometchat-message-header.component.html',
  styleUrls: ['./cometchat-message-header.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CometChatMessageHeaderComponent implements OnInit, OnDestroy, OnChanges {
  private pendingTimers: ReturnType<typeof setTimeout>[] = [];
  private messageHeaderService = inject(MessageHeaderService); private chatStateService = inject(ChatStateService);
  private cdr = inject(ChangeDetectorRef); private injector = inject(Injector);
  private globalConfig: Partial<GlobalConfig> | null = inject(COMETCHAT_GLOBAL_CONFIG, { optional: true });

  private hideUserStatusExplicitlySet = signal(false);
  private hideVoiceCallButtonExplicitlySet = signal(false);
  private hideVideoCallButtonExplicitlySet = signal(false);

  private _hideUserStatus = signal(false);
  private _hideVoiceCallButton = signal(false);
  private _hideVideoCallButton = signal(false);
  @Input() user?: CometChat.User;
  @Input() group?: CometChat.Group;
  @Input({ transform: booleanAttribute })
  set hideUserStatus(value: boolean) { this._hideUserStatus.set(value); this.hideUserStatusExplicitlySet.set(true); }
  get hideUserStatus(): boolean { return this._hideUserStatus(); }
  @Input() showBackButton = false;
  @Input({ transform: booleanAttribute })
  set hideVoiceCallButton(value: boolean) { this._hideVoiceCallButton.set(value); this.hideVoiceCallButtonExplicitlySet.set(true); }
  get hideVoiceCallButton(): boolean { return this._hideVoiceCallButton(); }
  @Input({ transform: booleanAttribute })
  set hideVideoCallButton(value: boolean) { this._hideVideoCallButton.set(value); this.hideVideoCallButtonExplicitlySet.set(true); }
  get hideVideoCallButton(): boolean { return this._hideVideoCallButton(); }
  @Input() showSearchOption = false; @Input() showConversationSummaryButton = false; @Input() callSettingsBuilder: typeof CometChatUIKitCalls.CallSettingsBuilder = undefined;
  @Input() summaryGenerationMessageCount = 1000; @Input() enableAutoSummaryGeneration = false; @Input() lastActiveAtDateTimeFormat?: CalendarObject;
  @Input() headerView?: TemplateRef<any>; @Input() itemView?: TemplateRef<{ user?: CometChat.User; group?: CometChat.Group }>;
  @Input() leadingView?: TemplateRef<{ user?: CometChat.User; group?: CometChat.Group }>; @Input() titleView?: TemplateRef<{ user?: CometChat.User; group?: CometChat.Group }>;
  @Input() subtitleView?: TemplateRef<{ user?: CometChat.User; group?: CometChat.Group }>; @Input() trailingView?: TemplateRef<{ user?: CometChat.User; group?: CometChat.Group }>;
  @Input() backButtonView?: TemplateRef<any>; @Input() auxiliaryButtonView?: TemplateRef<{ user?: CometChat.User; group?: CometChat.Group }>;
  @Input() listItemTemplate: TemplateRef<any> | null = null; @Input() emptyStateTemplate: TemplateRef<any> | null = null;
  @Input() errorStateTemplate: TemplateRef<any> | null = null; @Input() loadingStateTemplate: TemplateRef<any> | null = null;
  @ContentChild('headerView') headerViewContent?: TemplateRef<any>; @ContentChild('itemView') itemViewContent?: TemplateRef<{ user?: CometChat.User; group?: CometChat.Group }>;
  @ContentChild('leadingView') leadingViewContent?: TemplateRef<{ user?: CometChat.User; group?: CometChat.Group }>; @ContentChild('titleView') titleViewContent?: TemplateRef<{ user?: CometChat.User; group?: CometChat.Group }>;
  @ContentChild('subtitleView') subtitleViewContent?: TemplateRef<{ user?: CometChat.User; group?: CometChat.Group }>; @ContentChild('trailingView') trailingViewContent?: TemplateRef<{ user?: CometChat.User; group?: CometChat.Group }>;
  @ContentChild('backButtonView') backButtonViewContent?: TemplateRef<any>; @ContentChild('auxiliaryButtonView') auxiliaryButtonViewContent?: TemplateRef<{ user?: CometChat.User; group?: CometChat.Group }>;
  @Output() backClick = new EventEmitter<void>(); @Output() itemClick = new EventEmitter<CometChat.User | CometChat.Group>(); @Output() searchClick = new EventEmitter<void>();
  @Output() conversationSummaryClick = new EventEmitter<{ messageCount: number }>(); @Output() error = new EventEmitter<CometChat.CometChatException>();
  @Output() voiceCallClick = new EventEmitter<CometChat.User | CometChat.Group>(); @Output() videoCallClick = new EventEmitter<CometChat.User | CometChat.Group>();

  protected currentUser = signal<CometChat.User | null>(null); protected currentGroup = signal<CometChat.Group | null>(null); private propsProvided = signal<boolean>(false);

  userSignal!: Signal<CometChat.User | null>; groupSignal!: Signal<CometChat.Group | null>; userStatusSignal!: Signal<string>;
  typingIndicatorSignal!: Signal<CometChat.TypingIndicator | null>; typingUsersSignal!: Signal<CometChat.User[]>;
  groupMemberCountSignal!: Signal<number>; lastActiveAtSignal!: Signal<number | null>;

  isUserConversation = computed(() => this.userSignal() !== null); isGroupConversation = computed(() => this.groupSignal() !== null);
  isTyping = computed(() => this.typingIndicatorSignal() !== null); shouldShowBackButton = computed(() => this.showBackButton);
  shouldShowOverflowMenu = computed(() => this.showSearchOption && this.showConversationSummaryButton);

  effectiveHideUserStatus = computed(() => { if (this.hideUserStatusExplicitlySet()) return this._hideUserStatus(); if (this.globalConfig?.hideUserStatus !== undefined) return this.globalConfig.hideUserStatus; return false; });

  effectiveHideVoiceCallButton = computed(() => { if (this.hideVoiceCallButtonExplicitlySet()) return this._hideVoiceCallButton(); return !CometChatUIKit.isCallingEnabled(); });

  effectiveHideVideoCallButton = computed(() => { if (this.hideVideoCallButtonExplicitlySet()) return this._hideVideoCallButton(); return !CometChatUIKit.isCallingEnabled(); });

  private readonly destroyRef = inject(DestroyRef);
  isOverflowMenuOpen = false; @ViewChild(CometChatContextMenuComponent) contextMenu?: CometChatContextMenuComponent;
  private previousUserStatus: string | null = null; private unreadMessageCount = 0; private autoSummaryTriggered = false;

  get effectiveHeaderView(): TemplateRef<any> | undefined { return this.headerView || this.headerViewContent; }
  get effectiveItemView(): TemplateRef<{ user?: CometChat.User; group?: CometChat.Group }> | undefined { return this.listItemTemplate || this.itemView || this.itemViewContent; }
  get effectiveLeadingView(): TemplateRef<{ user?: CometChat.User; group?: CometChat.Group }> | undefined { return this.leadingView || this.leadingViewContent; }
  get effectiveTitleView(): TemplateRef<{ user?: CometChat.User; group?: CometChat.Group }> | undefined { return this.titleView || this.titleViewContent; }
  get effectiveSubtitleView(): TemplateRef<{ user?: CometChat.User; group?: CometChat.Group }> | undefined { return this.subtitleView || this.subtitleViewContent; }
  get effectiveTrailingView(): TemplateRef<{ user?: CometChat.User; group?: CometChat.Group }> | undefined { return this.trailingView || this.trailingViewContent; }
  get effectiveBackButtonView(): TemplateRef<any> | undefined { return this.backButtonView || this.backButtonViewContent; }
  get effectiveAuxiliaryButtonView(): TemplateRef<{ user?: CometChat.User; group?: CometChat.Group }> | undefined { return this.auxiliaryButtonView || this.auxiliaryButtonViewContent; }
  get templateContext(): { user?: CometChat.User; group?: CometChat.Group } { return { user: this.currentUser() ?? undefined, group: this.currentGroup() ?? undefined }; }
  constructor() {
    this.initializeSignals();
    effect(() => { const s = this.userStatusSignal(); if (this.previousUserStatus !== null && this.previousUserStatus !== s && this.user) this.announceStatusChange(s); this.previousUserStatus = s; }, { allowSignalWrites: true });
    effect(() => {
      const su = this.chatStateService.activeUser(); const sg = this.chatStateService.activeGroup(); const up = this.propsProvided();
      if (!up) {
        this.currentUser.set(su); this.currentGroup.set(sg);
        if (su) { this.messageHeaderService.setUser(su); const uid = su.getUid?.(); if (uid) this.messageHeaderService.setupListeners(uid, 'user'); }
        else if (sg) { this.messageHeaderService.setGroup(sg); const gid = sg.getGuid?.(); if (gid) this.messageHeaderService.setupListeners(gid, 'group'); }
        else { this.messageHeaderService.cleanup(); this.setupErrorCallback(); }
        this.cdr.markForCheck();
      }
    }, { allowSignalWrites: true });
  }
  @HostListener('document:keydown.escape', ['$event'])
  handleEscapeKey(event: Event): void {
    if (this.isOverflowMenuOpen) {
      event.preventDefault();
      this.closeOverflowMenu();
    }
  }
  ngOnInit(): void {
    try {
      this.setupErrorCallback();
      if (this.user) { this.propsProvided.set(true); this.currentUser.set(this.user); this.currentGroup.set(null); this.initializeService(); }
      else if (this.group) { this.propsProvided.set(true); this.currentUser.set(null); this.currentGroup.set(this.group); this.initializeService(); }
      else { this.propsProvided.set(false); }
      this.handleAutoSummaryGeneration(); this.subscribeToGroupEvents();
    } catch (error) { this.handleLifecycleError(error, 'ngOnInit'); }
  }
  ngOnChanges(changes: SimpleChanges): void {
    try {
      if (changes['user'] && !changes['user'].firstChange) { this.handleUserChange(changes['user'].previousValue); }
      if (changes['group'] && !changes['group'].firstChange) { this.handleGroupChange(changes['group'].previousValue); }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('[CometChatMessageHeader] Error in ngOnChanges:', err);
    }
  }
  ngOnDestroy(): void {
    this.pendingTimers.forEach(t => clearTimeout(t));
    this.pendingTimers = [];
    try {
      this.messageHeaderService.cleanup();
    } catch (error) {
      // @see Requirement 2.4 (Error Boundaries spec)
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('[CometChatMessageHeader] Error in ngOnDestroy:', err);
    }
  }
  private setupErrorCallback(): void {
    this.messageHeaderService.setErrorCallback((error: CometChat.CometChatException) => {
      this.error.emit(error);
    });
  }
  private initializeService(): void {
    if (this.user && this.group) { console.warn('[CometChatMessageHeader] Both user and group provided; user takes precedence.'); }
    if (this.user) { const uid = this.user.getUid?.(); if (!uid) throw new Error('Invalid user: missing UID'); this.messageHeaderService.setUser(this.user); this.messageHeaderService.setupListeners(uid, 'user'); }
    else if (this.group) { const gid = this.group.getGuid?.(); if (!gid) throw new Error('Invalid group: missing GUID'); this.messageHeaderService.setGroup(this.group); this.messageHeaderService.setupListeners(gid, 'group'); }
  }
  private initializeSignals(): void {
    this.userSignal = this.messageHeaderService.user;
    this.groupSignal = this.messageHeaderService.group;
    this.userStatusSignal = this.messageHeaderService.userStatus;
    this.typingIndicatorSignal = this.messageHeaderService.typingIndicator;
    this.typingUsersSignal = this.messageHeaderService.typingUsers;
    this.groupMemberCountSignal = this.messageHeaderService.groupMemberCount;
    this.lastActiveAtSignal = this.messageHeaderService.lastActiveAt;
  }
  private handleUserChange(previousUser?: CometChat.User): void {
    if (!this.user) {
      if (previousUser) {
        this.messageHeaderService.cleanup();
        this.setupErrorCallback();
        this.currentUser.set(null);
      }
      return;
    }
    const userId = this.user.getUid?.();
    if (!userId) { console.error('[CometChatMessageHeader] Invalid user: missing UID'); this.emitError(new Error('Invalid user: missing UID')); return; }
    const previousUserId = previousUser?.getUid?.();
    if (previousUserId === userId) { this.messageHeaderService.setUser(this.user); this.currentUser.set(this.user); this.cdr.markForCheck(); return; }
    this.messageHeaderService.setUser(this.user);
    this.messageHeaderService.setupListeners(userId, 'user');
    this.currentUser.set(this.user);
    this.currentGroup.set(null);
    this.cdr.markForCheck();
  }
  private handleGroupChange(previousGroup?: CometChat.Group): void {
    if (!this.group) { if (previousGroup) { this.messageHeaderService.cleanup(); this.setupErrorCallback(); this.currentGroup.set(null); } return; }
    const groupId = this.group.getGuid?.();
    if (!groupId) { console.error('[CometChatMessageHeader] Invalid group: missing GUID'); this.emitError(new Error('Invalid group: missing GUID')); return; }
    const previousGroupId = previousGroup?.getGuid?.();
    if (previousGroupId === groupId) { this.messageHeaderService.setGroup(this.group); this.currentGroup.set(this.group); this.cdr.markForCheck(); return; }
    this.messageHeaderService.setGroup(this.group);
    this.messageHeaderService.setupListeners(groupId, 'group');
    this.currentUser.set(null);
    this.currentGroup.set(this.group);
    this.cdr.markForCheck();
  }
  private emitError(error: unknown): void {
    console.error('[CometChatMessageHeader] Error:', error);
    if (error instanceof CometChat.CometChatException) { this.error.emit(error); } else if (error instanceof Error) {
      const exception = new CometChat.CometChatException({
        code: 'COMPONENT_ERROR',
        message: error.message,
        details: error.stack || '',
      });
      this.error.emit(exception);
    } else {
      const exception = new CometChat.CometChatException({
        code: 'UNKNOWN_ERROR',
        message: String(error),
        details: '',
      });
      this.error.emit(exception);
    }
  }
  private handleLifecycleError(error: unknown, hook: string): void {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error(`[CometChatMessageHeader] Error in ${hook}:`, err);
    this.error.emit(err as CometChat.CometChatException);
  }
  handleBackClick(): void { this.backClick.emit(); }
  handleBackKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); this.handleBackClick(); }
  }
  handleItemClick(): void {
    const user = this.currentUser();
    const group = this.currentGroup();
    if (user) { this.itemClick.emit(user); } else if (group) { this.itemClick.emit(group); }
  }
  handleItemKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); this.handleItemClick(); }
  }
  handleSearchClick(): void { this.searchClick.emit(); }
  handleSummaryClick(): void {
    try {
      this.triggerSummaryGeneration();
    } catch (error) {
      console.error('[CometChatMessageHeader] Error triggering summary generation:', error);
      this.emitError(error);
    }
  }
  private triggerSummaryGeneration(): void {
    const user = this.currentUser(); const group = this.currentGroup();
    if (!user && !group) { const e = new Error('Cannot generate summary: No user or group configured'); console.warn('[CometChatMessageHeader]', e.message); this.emitError(e); return; }
    const receiverId = user ? user.getUid() : group!.getGuid(); const receiverType = user ? 'user' : 'group';
    CometChatUIEvents.ccShowPanel.next({ configuration: { getConversationSummary: () => CometChat.getConversationSummary(receiverId, receiverType, { lastNMessages: this.summaryGenerationMessageCount }), closeCallback: () => CometChatUIEvents.ccHidePanel.next(PanelAlignment.messageListFooter) }, position: PanelAlignment.messageListFooter });
    this.conversationSummaryClick.emit({ messageCount: this.summaryGenerationMessageCount });
  }
  private handleAutoSummaryGeneration(): void {
    if (!this.enableAutoSummaryGeneration) return;
    CometChatUIEvents.ccActiveChatChanged.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(event => {
      this.unreadMessageCount = event.unreadMessageCount ?? 0;
      if (this.unreadMessageCount >= 15) { const u = this.currentUser(); const g = this.currentGroup(); if (!u && !g) return; this.pendingTimers.push(setTimeout(() => { try { this.triggerSummaryGeneration(); } catch (e) { console.error('[CometChatMessageHeader] Error during auto-summary generation:', e); this.emitError(e); } }, 0)); }
    });
    const user = this.currentUser(); const group = this.currentGroup();
    if (user || group) { this.pendingTimers.push(setTimeout(() => { try { this.triggerSummaryGeneration(); } catch (e) { console.error('[CometChatMessageHeader] Error during auto-summary generation:', e); this.emitError(e); } }, 0)); }
    else { this.autoSummaryTriggered = false; effect(() => { const u = this.currentUser(); const g = this.currentGroup(); if ((u || g) && !this.autoSummaryTriggered) { this.autoSummaryTriggered = true; this.pendingTimers.push(setTimeout(() => { try { this.triggerSummaryGeneration(); } catch (e) { console.error('[CometChatMessageHeader] Error during auto-summary generation:', e); this.emitError(e); } }, 0)); } }, { injector: this.injector }); }
  }
  private subscribeToGroupEvents(): void {
    const loggedInUser = CometChatUIKit.getLoggedInUser();
    CometChatGroupEvents.ccGroupMemberAdded.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((item: IGroupMemberAdded) => { const group = this.currentGroup(); if (group && group.getGuid() === item.userAddedIn?.getGuid()) { if (item.usersAdded?.length > 0) item.usersAdded.forEach((u: CometChat.User) => { if (u.getUid() === loggedInUser?.getUid()) group.setHasJoined(true); }); group.setMembersCount(item.userAddedIn.getMembersCount()); this.messageHeaderService.updateGroupMemberCount(item.userAddedIn.getMembersCount()); this.cdr.markForCheck(); } });
    CometChatGroupEvents.ccGroupMemberBanned.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((item: IGroupMemberKickedBanned) => { const group = this.currentGroup(); if (group && group.getGuid() === item.kickedFrom?.getGuid()) { if (loggedInUser?.getUid() === item.kickedUser?.getUid()) group.setHasJoined(false); group.setMembersCount(item.kickedFrom.getMembersCount()); this.messageHeaderService.updateGroupMemberCount(item.kickedFrom.getMembersCount()); this.cdr.markForCheck(); } });
    CometChatGroupEvents.ccGroupMemberJoined.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((item: IGroupMemberJoined) => { const group = this.currentGroup(); if (group && group.getGuid() === item.joinedGroup?.getGuid()) { if (loggedInUser?.getUid() === item.joinedUser?.getUid()) group.setHasJoined(true); group.setMembersCount(item.joinedGroup.getMembersCount()); this.messageHeaderService.updateGroupMemberCount(item.joinedGroup.getMembersCount()); this.cdr.markForCheck(); } });
    CometChatGroupEvents.ccGroupMemberKicked.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((item: IGroupMemberKickedBanned) => { const group = this.currentGroup(); if (group && group.getGuid() === item.kickedFrom?.getGuid()) { if (loggedInUser?.getUid() === item.kickedUser?.getUid()) group.setHasJoined(false); group.setMembersCount(item.kickedFrom.getMembersCount()); this.messageHeaderService.updateGroupMemberCount(item.kickedFrom.getMembersCount()); this.cdr.markForCheck(); } });
    CometChatGroupEvents.ccOwnershipChanged.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((item: IOwnershipChanged) => { const group = this.currentGroup(); if (group && group.getGuid() === item.group?.getGuid()) { group.setOwner(item.group.getOwner()); this.cdr.markForCheck(); } });
    CometChatGroupEvents.ccGroupLeft.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((item: IGroupLeft) => { const group = this.currentGroup(); if (group && group.getGuid() === item.leftGroup?.getGuid()) { if (loggedInUser?.getUid() === item.userLeft?.getUid()) group.setHasJoined(false); group.setMembersCount(item.leftGroup.getMembersCount()); this.messageHeaderService.updateGroupMemberCount(item.leftGroup.getMembersCount()); this.cdr.markForCheck(); } });
  }
  getOverflowMenuOptions(): CometChatOption[] {
    const opts: CometChatOption[] = [];
    if (this.showSearchOption) opts.push(new CometChatOption({ id: 'search', title: CometChatLocalize.getLocalizedString('search_title'), iconURL: 'assets/search.svg', onClick: () => this.handleSearchClick() }));
    if (this.showConversationSummaryButton) opts.push(new CometChatOption({ id: 'summary', title: CometChatLocalize.getLocalizedString('ai_conversation_summary_title'), iconURL: 'assets/ai_conversation_summary.svg', onClick: () => this.handleSummaryClick() }));
    return opts;
  }
  handleOverflowMenuOptionClick(option: ContextMenuItem): void {
    if (option instanceof CometChatOption && option.onClick) { option.onClick(); }
  }
  handleVoiceCallClick(): void {
    const user = this.currentUser();
    const group = this.currentGroup();
    if (user) { this.voiceCallClick.emit(user); } else if (group) { this.voiceCallClick.emit(group); }
  }
  handleVideoCallClick(): void {
    const user = this.currentUser();
    const group = this.currentGroup();
    if (user) { this.videoCallClick.emit(user); } else if (group) { this.videoCallClick.emit(group); }
  }
  handleRetryClick(): void {
    try {
      this.messageHeaderService.cleanup();
      this.setupErrorCallback();
      if (this.user) { this.initializeService(); }
      else if (this.group) { this.initializeService(); }
      this.cdr.markForCheck();
    } catch (error) { this.handleLifecycleError(error, 'handleRetryClick'); }
  }
  handleError(error: CometChat.CometChatException): void { this.error.emit(error); }
  getAvatarImage(): string { return getHeaderAvatarImage(this.currentUser(), this.currentGroup()); }
  getAvatarName(): string { return getHeaderAvatarName(this.currentUser(), this.currentGroup()); }
  getDisplayName(): string { return getHeaderDisplayName(this.currentUser(), this.currentGroup()); }
  getTypingText(): string {
    const typingIndicator = this.typingIndicatorSignal();
    if (!typingIndicator) { return ''; }
    const user = this.currentUser();
    const group = this.currentGroup();
    if (user) { return CometChatLocalize.getLocalizedString('message_header_typing'); }
    if (group) {
      const typingUsers = this.typingUsersSignal();
      if (typingUsers.length === 0) { const s = typingIndicator.getSender(); if (s) return `${s.getName() || ''} ${CometChatLocalize.getLocalizedString('message_header_is_typing')}`; return CometChatLocalize.getLocalizedString('message_header_typing'); }
      if (typingUsers.length === 1) return `${typingUsers[0].getName() || ''} ${CometChatLocalize.getLocalizedString('message_header_is_typing')}`;
      if (typingUsers.length === 2) return `${typingUsers[0].getName() || ''} ${CometChatLocalize.getLocalizedString('message_header_and')} ${typingUsers[1].getName() || ''} ${CometChatLocalize.getLocalizedString('message_header_are_typing')}`;
            const firstName = typingUsers[0].getName() || '';
      const othersCount = typingUsers.length - 1;
      return `${firstName} ${CometChatLocalize.getLocalizedString('message_header_and')} ${othersCount} ${CometChatLocalize.getLocalizedString('message_header_others_typing')}`;
      }
    return CometChatLocalize.getLocalizedString('message_header_typing');
  }
  getTypingUsersCount(): number { return this.typingUsersSignal().length; }
  getMemberCountText(): string {
    const group = this.currentGroup();
    if (!group) return '';
    return this.groupMemberCountSignal().toString();
  }
  getMemberCount(): number {
    const group = this.currentGroup();
    if (!group) return 0;
    return this.groupMemberCountSignal();
  }
  isUserOnline(): boolean { return this.userStatusSignal() === 'online'; }
  getLastActiveTimestamp(): number | null {
    return this.lastActiveAtSignal();
  }
  getLastActiveDateFormat(): CalendarObject {
    if (this.lastActiveAtDateTimeFormat) return this.lastActiveAtDateTimeFormat;
    return {
      today: 'h:mm A',
      yesterday: '[Yesterday]',
      lastWeek: 'dddd',
      otherDays: 'DD/MM/YYYY',
      relativeTime: { minute: '1 min ago', minutes: '%d mins ago', hour: '1 hour ago', hours: '%d hours ago' },
    };
  }
  getHeaderAriaLabel(): string {
    return getHeaderAriaLabel(
      this.getDisplayName(), this.currentUser(), this.currentGroup(),
      this.userStatusSignal(), this.getMemberCount()
    );
  }
  getItemAriaLabel(): string {
    return getItemAriaLabel(
      this.getDisplayName(), this.currentUser(), this.currentGroup(),
      this.userStatusSignal(), this.getMemberCount()
    );
  }

  closeOverflowMenu(): void { this.isOverflowMenuOpen = false; }
  handleOverflowMenuStateChange(isOpen: boolean): void { this.isOverflowMenuOpen = isOpen; }
  private announceStatusChange(status: string): void {
    const user = this.currentUser();
    announceStatusChange(user?.getName?.() || '', status, this.pendingTimers);
  }
}
