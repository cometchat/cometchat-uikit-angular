
import {Component, Input, Output, EventEmitter, TemplateRef, ViewChild, ElementRef, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, OnDestroy, OnChanges, AfterViewInit, SimpleChanges, signal, computed, effect, Signal, inject, DestroyRef, booleanAttribute, Injector,} from '@angular/core';
import {CommonModule} from '@angular/common';
import {CometChat} from '@cometchat/chat-sdk-javascript';

import {CometChatMessageBubbleComponent} from '../cometchat-message-bubble/cometchat-message-bubble.component';
import {CometChatDateComponent} from '../base-elements/cometchat-date/cometchat-date.component';
import {CometChatButtonComponent} from '../base-elements/cometchat-button/cometchat-button.component';
import {CometChatSmartRepliesComponent} from '../base-elements/cometchat-smart-replies/cometchat-smart-replies.component';
import {CometChatConversationStarterComponent} from '../base-elements/cometchat-conversation-starter/cometchat-conversation-starter.component';
import {CometChatConversationSummaryComponent} from '../base-elements/cometchat-conversation-summary/cometchat-conversation-summary.component';
import {CometChatConfirmDialogComponent} from '../base-elements/cometchat-confirm-dialog/cometchat-confirm-dialog.component';
import {CometChatFlagMessageDialogComponent} from '../base-elements/cometchat-flag-message-dialog/cometchat-flag-message-dialog.component';
import {CometChatMessageInformationComponent} from '../cometchat-message-information/cometchat-message-information.component';
import {CometChatEmojiKeyboardComponent} from '../base-elements/cometchat-emoji-keyboard/cometchat-emoji-keyboard.component';
import {CometChatErrorBoundaryComponent, ErrorContext,} from '../base-elements/cometchat-error-boundary/cometchat-error-boundary.component';
import {ContextMenuItem} from '../base-elements/cometchat-context-menu/cometchat-context-menu.component';

import {MessageListService} from '../../services/message-list.service';
import {ChatStateService} from '../../services/chat-state.service';
import {CometChatTemplatesService} from '../../services/templates.service';
import {CometChatToastComponent, ToastType} from '../base-elements/cometchat-toast/cometchat-toast.component';
import {FormatterConfigService} from '../../services/formatter-config.service';
import {ListNavigationService} from '../../services/list-navigation.service';
import {LiveAnnouncerService} from '../../services/live-announcer.service';
import {FocusTrapService} from '../../services/focus-trap.service';
import {COMETCHAT_GLOBAL_CONFIG, GlobalConfig} from '../../services/global-config.service';
import {isSenderMessage as isSenderMessageUtil, isReceiverMessage as isReceiverMessageUtil, getLatestReceiverMessage as getLatestReceiverMessageUtil, getConversationId as getConversationIdUtil, getConversationType as getConversationTypeUtil, isMessageForCurrentConversation as isMessageForCurrentConversationUtil} from './cometchat-message-list.receipt-utils';
import {getMessagePreview as getMessagePreviewUtil, isMediaMessage as isMediaMessageUtil} from './cometchat-message-list.options-utils';
import {highlightAndScrollToElement as highlightAndScrollToElementUtil} from './cometchat-message-list.scroll-utils';
import {ConversationsService} from '../../services/conversations.service';
import {subscribeToMessageEventsImpl, subscribeToGroupEventsImpl, subscribeToCallEventsImpl, subscribeToUIDialogEventsImpl} from './cometchat-message-list.event-handlers';
import {getMessageOptionsImpl} from './cometchat-message-list.option-builders';
import {handleScrollToTopImpl, handleScrollToBottomImpl, saveScrollPositionImpl, restoreScrollPositionImpl, saveScrollPositionForReactionImpl, updateStickyDateImpl, updateIsAtBottomImpl, scrollToBottomImpl, scrollToBottomAfterLoadImpl, scrollToBottomWithRetryImpl, scrollToMessageImpl, scrollToMessageWithRetryImpl, disconnectObserversImpl} from './cometchat-message-list.scroll-handlers';
import {showEmojiKeyboardForMessageImpl, calculateEmojiKeyboardPositionImpl, onEmojiSelectedImpl, onEmojiKeyboardCloseImpl, onBubbleReactionClickImpl, onBubbleReactionListItemClickImpl} from './cometchat-message-list.reaction-handlers';
import {showDeleteConfirmationImpl, handleDeleteConfirmImpl, handleDeleteCancelImpl, getDeleteDialogTitleImpl, getDeleteDialogSubtitleImpl, getDeleteDialogConfirmTextImpl, getDeleteDialogCancelTextImpl, showFlagConfirmationImpl, handleFlagConfirmImpl, handleFlagCancelImpl} from './cometchat-message-list.delete-handlers';
import {translateMessageImpl, getTranslatedTextImpl, isMessageTranslatingImpl, isMessageTranslatedImpl, getDefaultTranslationLanguageImpl, setPreferredTranslationLanguageImpl} from './cometchat-message-list.translate-handlers';
import {handleConversationChangeImpl, handleParentMessageIdChangeImpl, subscribeToChatStateServiceImpl, scheduleDeferredConversationChangeImpl, handleUserChangeImpl, handleGroupChangeImpl, scrollToFirstUnreadOrBottomImpl} from './cometchat-message-list.conversation-handlers';
import {handleNewMessagesImpl, shouldPlaySoundImpl, playMessageSoundImpl, computeMessagesWithDateSeparatorsImpl, getReactionFingerprintImpl, getDateStringImpl} from './cometchat-message-list.message-state';
import {markInitialMessagesAsReadImpl, handleRealtimeMessageReceiptImpl, markMessagesReadOnScrollToBottomImpl, markAsReadWithRetryImpl} from './cometchat-message-list.read-handlers';
import {initializeServiceImpl, publishActiveChatChangedImpl, setupIntersectionObserversImpl} from './cometchat-message-list.init-utils';
import {handleOptionClickImpl} from './cometchat-message-list.option-click';
import {announceNewMessageImpl, announceMessageSentImpl, announceMessageFailedImpl, announceMessageDeletedImpl, announceMessageEditedImpl, announceTypingImpl, announceLoadingMoreImpl} from './cometchat-message-list.announce-utils';
import {onEditMessageImpl, onReplyMessageImpl, onReplyPreviewClickImpl, onMessageInfoImpl, closeMessageInfoImpl, copyMessageToClipboardImpl, handleMessagePrivatelyImpl, markMessageAsUnreadImpl} from './cometchat-message-list.interaction-utils';
import {handleKeydownImpl, setFocusedIndexImpl, getMessageTabIndexImpl} from './cometchat-message-list.keyboard-utils';
import {setupMessageListenerImpl, ngOnInitImpl, ngOnChangesImpl, ngAfterViewInitImpl, ngOnDestroyImpl, initializeLoggedInUserImpl, initializeFormattersImpl, configureFormattersWithUserImpl} from './cometchat-message-list.lifecycle-utils';
import {setupScrollListenersImpl, getMessageAlignmentImpl, isCallForCurrentConversationImpl, updateListStateImpl, showInlineToastImpl, notifyMessagesReadImpl, handleLifecycleErrorImpl, handleServiceErrorImpl, onBubbleErrorImpl, handleReceiptErrorImpl, shouldShowSmartRepliesForMessageImpl} from './cometchat-message-list.helper-utils';

import {CometChatSoundManager} from '../../resources/CometChatSoundManager/CometChatSoundManager';
import {CometChatLocalize} from '../../resources/CometChatLocalize/cometchat-localize';
import {TranslatePipe} from '../../resources/CometChatLocalize/translate.pipe';
import {CometChatLogger} from '../../utils/CometChatLogger';

import {States, MessageListAlignment, MessageBubbleAlignment, Placement, PanelAlignment,} from '../../Enums/Enums';
import {CalendarObject} from '../../resources/CometChatLocalize/localization.interfaces';
import {CometChatTextFormatter} from '../../formatters/cometchat-text-formatter';
import {CometChatUIKitConstants} from '../../constants';
import {CometChatActionsIcon} from '../../modals/CometChatActionsIcon';

import {CometChatUIEvents, IPanel,} from '../../events/CometChatUIEvents';

export interface MessageListItem {
  type: 'message' | 'date-separator';

  message?: CometChat.BaseMessage;

  date?: number;

  key: string;
}
@Component({
  selector: 'cometchat-message-list',
  standalone: true,
  imports: [
    CommonModule,
    CometChatMessageBubbleComponent,
    CometChatDateComponent,
    CometChatButtonComponent,
    CometChatSmartRepliesComponent,
    CometChatConversationStarterComponent,
    CometChatConversationSummaryComponent,
    CometChatConfirmDialogComponent,
    CometChatFlagMessageDialogComponent,
    CometChatMessageInformationComponent,
    CometChatEmojiKeyboardComponent,
    CometChatErrorBoundaryComponent,
    CometChatToastComponent,
    TranslatePipe,
  ],
  templateUrl: './cometchat-message-list.component.html',
  styleUrls: ['./cometchat-message-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [MessageListService],
})
export class CometChatMessageListComponent implements OnInit, OnDestroy, OnChanges, AfterViewInit {
  readonly shimmerList = CometChatUIKitConstants.shimmerList;
  private messageListService = inject(MessageListService);
  private chatStateService = inject(ChatStateService);
  private templatesService = inject(CometChatTemplatesService);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);
  private injector = inject(Injector);
  private formatterConfigService = inject(FormatterConfigService);
  private listNavigationService = inject(ListNavigationService);
  private liveAnnouncer = inject(LiveAnnouncerService);
  private focusTrapService = inject(FocusTrapService);
  private conversationsService = inject(ConversationsService);
  private globalConfig: Partial<GlobalConfig> | null = inject(COMETCHAT_GLOBAL_CONFIG, {
    optional: true,
  });
  private showScrollbarExplicitlySet = signal(false);
  private hideErrorExplicitlySet = signal(false);
  private hideReceiptsExplicitlySet = signal(false);
  private disableSoundForMessagesExplicitlySet = signal(false);
  private textFormattersExplicitlySet = signal(false);
  private hideAvatarExplicitlySet = signal(false);
  private customSoundForMessagesExplicitlySet = signal(false);
  private hideModerationViewExplicitlySet = signal(false);
  private _showScrollbar = signal(false);
  private _hideError = signal(false);
  private _hideReceipts = signal(false);
  private _disableSoundForMessages = signal(false);
  private _textFormatters = signal<CometChatTextFormatter[]>([]);
  private _hideAvatar = signal(false);
  private _customSoundForMessages = signal('');
  private _hideModerationView = signal(false);
  @Input() user?: CometChat.User;
  @Input() group?: CometChat.Group;
  @Input() parentMessageId?: number;
  @Input({ transform: booleanAttribute }) isAgentChat = false;
  @Input() messagesRequestBuilder?: CometChat.MessagesRequestBuilder;
  @Input() reactionsRequestBuilder?: CometChat.ReactionsRequestBuilder;
  @Input()
  set textFormatters(value: CometChatTextFormatter[]) {
    this._textFormatters.set(value);
    this.textFormattersExplicitlySet.set(true);
  }
  get textFormatters(): CometChatTextFormatter[] {
    return this._textFormatters();
  }
  @Input() messageAlignment: MessageListAlignment = MessageListAlignment.standard;
  @Input({ transform: booleanAttribute }) scrollToBottomOnNewMessages = false;
  @Input() quickOptionsCount = 3;
  @Input({ transform: booleanAttribute })
  set disableSoundForMessages(value: boolean) { this._disableSoundForMessages.set(value); this.disableSoundForMessagesExplicitlySet.set(true); }
  get disableSoundForMessages(): boolean { return this._disableSoundForMessages(); }
  @Input()
  set customSoundForMessages(value: string) { this._customSoundForMessages.set(value); this.customSoundForMessagesExplicitlySet.set(true); }
  get customSoundForMessages(): string { return this._customSoundForMessages(); }
  @Input() goToMessageId?: string;
  @Input({ transform: booleanAttribute })
  set showScrollbar(value: boolean) { this._showScrollbar.set(value); this.showScrollbarExplicitlySet.set(true); }
  get showScrollbar(): boolean { return this._showScrollbar(); }
  @Input({ transform: booleanAttribute })
  set hideReceipts(value: boolean) { this._hideReceipts.set(value); this.hideReceiptsExplicitlySet.set(true); }
  get hideReceipts(): boolean { return this._hideReceipts(); }
  @Input({ transform: booleanAttribute }) hideDateSeparator = false;
  @Input({ transform: booleanAttribute }) hideStickyDate = false;
  @Input({ transform: booleanAttribute })
  set hideAvatar(value: boolean) { this._hideAvatar.set(value); this.hideAvatarExplicitlySet.set(true); }
  get hideAvatar(): boolean { return this._hideAvatar(); }
  @Input({ transform: booleanAttribute }) hideGroupActionMessages = false;
  @Input({ transform: booleanAttribute })
  set hideError(value: boolean) { this._hideError.set(value); this.hideErrorExplicitlySet.set(true); }
  get hideError(): boolean { return this._hideError(); }
  @Input({ transform: booleanAttribute }) hideReplyInThreadOption = false;
  @Input({ transform: booleanAttribute }) hideTranslateMessageOption = false;
  @Input({ transform: booleanAttribute }) hideEditMessageOption = false;
  @Input({ transform: booleanAttribute }) hideDeleteMessageOption = false;
  @Input({ transform: booleanAttribute }) hideReactionOption = false;
  @Input({ transform: booleanAttribute }) hideMessagePrivatelyOption = false;
  @Input({ transform: booleanAttribute }) hideCopyMessageOption = false;
  @Input({ transform: booleanAttribute }) hideMessageInfoOption = false;
  @Input() additionalOptions: CometChatActionsIcon[] = [];
  @Input() optionsOverride?: (
    message: CometChat.BaseMessage,
    defaultOptions: CometChatActionsIcon[]
  ) => CometChatActionsIcon[];
  @Input({ transform: booleanAttribute })
  set hideModerationView(value: boolean) { this._hideModerationView.set(value); this.hideModerationViewExplicitlySet.set(true); }
  get hideModerationView(): boolean { return this._hideModerationView(); }
  @Input({ transform: booleanAttribute }) hideFlagRemarkField: boolean = false;
  @Input({ transform: booleanAttribute }) hideFlagMessageOption: boolean = false;
  @Input({ transform: booleanAttribute }) showMarkAsUnreadOption: boolean = true;
  @Input({ transform: booleanAttribute }) startFromUnreadMessages: boolean = true;
  @Input({ transform: booleanAttribute }) hideReplyOption: boolean = false;
  @Input({ transform: booleanAttribute }) disableInteraction = false;
  @Input() emptyView?: TemplateRef<any>;
  @Input() errorView?: TemplateRef<any>;
  @Input() loadingView?: TemplateRef<any>;
  @Input() headerView?: TemplateRef<any>;
  @Input() footerView?: TemplateRef<any>;
  @Input({ transform: booleanAttribute }) hideTimestamp = false;
  @Input() bubbleFooterView: TemplateRef<any> | null = null;
  @Input() appendView?: TemplateRef<any>;
  @Input() listItemTemplate: TemplateRef<any> | null = null;
  @Input() emptyStateTemplate: TemplateRef<any> | null = null;
  @Input() errorStateTemplate: TemplateRef<any> | null = null;
  @Input() loadingStateTemplate: TemplateRef<any> | null = null;
  @Input() separatorDateTimeFormat?: CalendarObject;
  @Input() stickyDateTimeFormat?: CalendarObject;
  @Input() messageSentAtDateTimeFormat?: CalendarObject;
  @Input() messageInfoDateTimeFormat?: CalendarObject;
  @Input({ transform: booleanAttribute }) showConversationStarters = false;
  @Input({ transform: booleanAttribute }) showSmartReplies = false;
  @Input() smartRepliesKeywords: string[] = ['what', 'when', 'why', 'who', 'where', 'how', '?'];
  @Input() smartRepliesDelayDuration = 10000;
  @Output() error = new EventEmitter<CometChat.CometChatException>();
  @Output() threadRepliesClick = new EventEmitter<CometChat.BaseMessage>();
  @Output() reactionClick = new EventEmitter<{ reaction: CometChat.ReactionCount; message: CometChat.BaseMessage }>();
  @Output() reactionListItemClick = new EventEmitter<{ reaction: CometChat.Reaction; message: CometChat.BaseMessage }>();
  @Output() smartReplyClick = new EventEmitter<string>();
  @Output() conversationStarterClick = new EventEmitter<string>();
  @Output() messagePrivatelyClick = new EventEmitter<{ message: CometChat.BaseMessage; user: CometChat.User }>();
  @Output() replyClick = new EventEmitter<CometChat.BaseMessage>();
  @ViewChild('listContainer') listContainer?: ElementRef<HTMLElement>;
  @ViewChild('scrollTopAnchor') scrollTopAnchor?: ElementRef<HTMLElement>;
  @ViewChild('scrollBottomAnchor') scrollBottomAnchor?: ElementRef<HTMLElement>;

  messages!: Signal<CometChat.BaseMessage[]>; loadingState!: Signal<boolean>;

  errorState!: Signal<Error | null>;

  unreadCount!: Signal<number>;
  private readonly BOTTOM_THRESHOLD = 100;

  listState = signal<States>(States.loading);
  showScrollToBottom = signal(false);

  stickyDateTimestamp = signal<number>(0);
  showStickyDateHeader = signal(false);
  isAtBottom = signal(true);
  focusedMessageIndex = signal(-1);
  isFetchingPrevious = signal(false);
  isFetchingNext = signal(false);
  hasMorePrevious = signal(true);
  hasMoreNext = signal(false);
  hideSmartReplies = signal(true);

  lastReceivedMessage = signal<CometChat.BaseMessage | undefined>(undefined);
  hideConversationStarters = signal(false);
  showNewMessagesBanner = signal(false);
  newMessagesCount = signal(0);

  unreadMessages = signal<CometChat.BaseMessage[]>([]);
  private pendingReadReceipts = new Set<number>();
  private isMarkingAsRead = false;
  showDeleteConfirmDialog = signal(false);

  messageToDelete = signal<CometChat.BaseMessage | null>(null);
  isDeleting = signal(false);

  inlineToastText = signal<string | null>(null);

  inlineToastType = signal<ToastType>(ToastType.success);
  private inlineToastTimer?: number;
  private lastUnreadMarkedMessageId = signal<number | null>(null);

  unreadDividerMessageId = signal<number | null>(null);

  markedAsUnreadCount = signal<number>(0);
  showFlagMessageDialog = signal(false);

  messageToFlag = signal<CometChat.BaseMessage | null>(null);
  isFlagging = signal(false);
  showMessageInfo = signal(false);

  messageForInfo = signal<CometChat.BaseMessage | null>(null);

  translatedMessages = signal<Map<number, string>>(new Map());

  translatingMessages = signal<Set<number>>(new Set());

  preferredTranslationLanguage = signal<string>(this.getDefaultTranslationLanguage());

  emojiKeyboardMessage = signal<CometChat.BaseMessage | null>(null);

  emojiKeyboardPosition = signal<{ top: number; left: number; side: 'left' | 'right' } | null>(null);

  footerPanelConfig = signal<IPanel | null>(null);

  showFooterPanel = signal<boolean>(false);

  showCallScreen = signal<boolean>(false);

  ongoingCallView = signal<any>(null);

  showImageModerationDialog = signal<boolean>(false);

  imageModerationDialogContent = signal<any>(null);
  private isFirstLoad = true;
  messagesWithSeparators = computed(() => this.computeMessagesWithDateSeparators());
  hasMessages = computed(() => this.messages().length > 0);
  isLoading = computed(() => this.loadingState());
  hasError = computed(() => this.errorState() !== null);
  shouldShowEmptyState = computed(() => !this.isLoading() && !this.hasError() && !this.hasMessages());
  shouldShowSmartReplies = computed(() => this.showSmartReplies && !this.hideSmartReplies() && this.lastReceivedMessage() !== undefined && !this.showFooterPanel() && !this.parentMessageId);
  shouldShowConversationStarters = computed(() => this.showConversationStarters && !this.hasMessages() && !this.hideConversationStarters() && !this.showFooterPanel() && this.listState() === States.empty && !this.parentMessageId);
  effectiveShowScrollbar = computed(() => { if (this.showScrollbarExplicitlySet()) return this._showScrollbar(); if (this.globalConfig?.showScrollbar !== undefined) return this.globalConfig.showScrollbar; return false; });
  effectiveHideError = computed(() => { if (this.hideErrorExplicitlySet()) return this._hideError(); if (this.globalConfig?.hideError !== undefined) return this.globalConfig.hideError; return false; });
  effectiveHideReceipts = computed(() => { if (this.hideReceiptsExplicitlySet()) return this._hideReceipts(); if (this.globalConfig?.hideReceipts !== undefined) return this.globalConfig.hideReceipts; return false; });
  effectiveDisableSoundForMessages = computed(() => { if (this.disableSoundForMessagesExplicitlySet()) return this._disableSoundForMessages(); if (this.globalConfig?.disableSoundForMessages !== undefined) return this.globalConfig.disableSoundForMessages; return false; });
  effectiveTextFormatters = computed(() => { if (this.textFormattersExplicitlySet()) return this._textFormatters(); if (this.globalConfig?.textFormatters !== undefined) return this.globalConfig.textFormatters; return []; });
  effectiveHideAvatar = computed(() => { if (this.hideAvatarExplicitlySet()) return this._hideAvatar(); if (this.globalConfig?.hideAvatar !== undefined) return this.globalConfig.hideAvatar; return false; });
  effectiveCustomSoundForMessages = computed(() => { if (this.customSoundForMessagesExplicitlySet()) return this._customSoundForMessages(); if (this.globalConfig?.customSoundForMessages !== undefined) return this.globalConfig.customSoundForMessages; return ''; });
  effectiveHideModerationView = computed(() => { if (this.hideModerationViewExplicitlySet()) return this._hideModerationView(); return false; });

  get effectiveLoadingView(): TemplateRef<any> | undefined { return this.loadingStateTemplate || this.loadingView || this.templatesService.resolveTemplate(this.templatesService.getMessageListTemplates(), 'loadingView'); }
  get effectiveEmptyView(): TemplateRef<any> | undefined { return this.emptyStateTemplate || this.emptyView || this.templatesService.resolveTemplate(this.templatesService.getMessageListTemplates(), 'emptyView'); }
  get effectiveErrorView(): TemplateRef<any> | undefined { return this.errorStateTemplate || this.errorView || this.templatesService.resolveTemplate(this.templatesService.getMessageListTemplates(), 'errorView'); }
  get effectiveHeaderView(): TemplateRef<any> | undefined {
    return this.headerView || this.templatesService.getMessageListTemplates().headerView;
  }
  get effectiveFooterView(): TemplateRef<any> | undefined {
    return this.footerView || this.templatesService.getMessageListTemplates().footerView;
  }
  private propsProvided = false;
  private pendingUser: CometChat.User | null = null;
  private pendingGroup: CometChat.Group | null = null;
  private conversationChangeScheduled = false;
  private loggedInUser: CometChat.User | null = null;

  activeFormatters: CometChatTextFormatter[] = [];
  private scrollListener: ((event: Event) => void) | null = null;
  private scrollTopObserver?: IntersectionObserver;
  private scrollBottomObserver?: IntersectionObserver;
  private scrollHeightBeforeLoad = 0;
  private lastSoundPlayedAt = 0;
  private readonly SOUND_THROTTLE_INTERVAL = 2000;
  private previousMessages: CometChat.BaseMessage[] = [];
  private typingAnnouncementTimeout: ReturnType<typeof setTimeout> | null = null;
  readonly States = States;
  readonly MessageListAlignment = MessageListAlignment;
  readonly MessageBubbleAlignment = MessageBubbleAlignment;
  readonly Placement = Placement;
  private messageListenerId = `message_list_${Date.now()}`;

  constructor() {
    this.messages = this.messageListService.messages;
    this.loadingState = this.messageListService.loadingState;
    this.errorState = this.messageListService.errorState;
    this.unreadCount = this.messageListService.unreadCount;
    effect(() => {
      const messages = this.messages();
      this.handleNewMessages(messages);
      this.previousMessages = [...messages];
      this.cdr.markForCheck();
    }, { allowSignalWrites: true });
    effect(() => {
      const error = this.errorState();
      if (error && !this.effectiveHideError()) {
        this.handleServiceError(error);
      }
    }, { allowSignalWrites: true });
    effect(() => {
      this.updateListState();
    }, { allowSignalWrites: true });
  }
    private setupMessageListener(): void { setupMessageListenerImpl(this as any); }
  ngOnInit(): void { try { ngOnInitImpl(this as any); } catch (error) { this.handleLifecycleError(error, 'ngOnInit'); } }
  ngOnChanges(changes: SimpleChanges): void { try { ngOnChangesImpl(this as any, changes); } catch (error) { CometChatLogger.error('CometChatMessageList', 'Error in ngOnChanges:', error); } }
  ngAfterViewInit(): void { try { ngAfterViewInitImpl(this as any); } catch (error) { this.handleLifecycleError(error, 'ngAfterViewInit'); } }
  ngOnDestroy(): void { try { ngOnDestroyImpl(this as any); } catch (error) { CometChatLogger.error('CometChatMessageList', 'Error in ngOnDestroy:', error); } }
  private async initializeLoggedInUser(): Promise<void> { return initializeLoggedInUserImpl(this as any); }
  private initializeFormatters(): void { initializeFormattersImpl(this as any); }
  private configureFormattersWithUser(): void { configureFormattersWithUserImpl(this as any); }
  private initializeService(): void { initializeServiceImpl(this as any); }
  private handleConversationChange(): void { handleConversationChangeImpl(this as any); }
  private handleParentMessageIdChange(): void { handleParentMessageIdChangeImpl(this as any); }
  private subscribeToChatStateService(): void { subscribeToChatStateServiceImpl(this as any); }
  private scheduleDeferredConversationChange(): void { scheduleDeferredConversationChangeImpl(this as any); }
  private handleUserChange(user: CometChat.User): void { handleUserChangeImpl(this as any, user); }
  private handleGroupChange(group: CometChat.Group): void { handleGroupChangeImpl(this as any, group); }
  private scrollToFirstUnreadOrBottom(): void { scrollToFirstUnreadOrBottomImpl(this as any); }
  private subscribeToMessageEvents(): void { subscribeToMessageEventsImpl(this as any); }
  private subscribeToGroupEvents(): void { subscribeToGroupEventsImpl(this as any); }
  private subscribeToCallEvents(): void { subscribeToCallEventsImpl(this as any); }
  private subscribeToUIDialogEvents(): void { subscribeToUIDialogEventsImpl(this as any); }
  private isCallForCurrentConversation(call: CometChat.Call): boolean { return isCallForCurrentConversationImpl(this as any, call); }
  private isMessageForCurrentConversation(message: CometChat.BaseMessage): boolean { return isMessageForCurrentConversationUtil(message, this.user || null, this.group || null, this.loggedInUser?.getUid() || ''); }
  private updateListState(): void { updateListStateImpl(this as any); }
  private computeMessagesWithDateSeparators(): MessageListItem[] { return computeMessagesWithDateSeparatorsImpl(this as any) as MessageListItem[]; }
  private getReactionFingerprint(message: CometChat.BaseMessage): string { return getReactionFingerprintImpl(message); }
  private getDateString(timestamp: number): string { return getDateStringImpl(timestamp); }
  getDefaultSeparatorDateFormat(): CalendarObject { return { today: CometChatLocalize.getLocalizedString('today'), yesterday: CometChatLocalize.getLocalizedString('yesterday'), otherDays: 'DD MMM, YYYY' }; }
  getDefaultStickyDateFormat(): CalendarObject { return { today: CometChatLocalize.getLocalizedString('today'), yesterday: CometChatLocalize.getLocalizedString('yesterday'), otherDays: 'DD MMM, YYYY' }; }
  getDefaultMessageDateFormat(): CalendarObject { return { today: 'hh:mm A', yesterday: 'hh:mm A', otherDays: 'hh:mm A' }; }
  getEffectiveSeparatorDateFormat(): CalendarObject {
    return this.separatorDateTimeFormat || this.getDefaultSeparatorDateFormat();
  }
  getEffectiveStickyDateFormat(): CalendarObject {
    return this.stickyDateTimeFormat || this.getDefaultStickyDateFormat();
  }
  getEffectiveMessageDateFormat(): CalendarObject {
    return this.messageSentAtDateTimeFormat || this.getDefaultMessageDateFormat();
  }
  getMessageAlignment(message: CometChat.BaseMessage): MessageBubbleAlignment { return getMessageAlignmentImpl(this as any, message); }
  getMessageOptions(message: CometChat.BaseMessage): CometChatActionsIcon[] { return getMessageOptionsImpl(this as any, message); }
  private setupIntersectionObservers(): void { setupIntersectionObserversImpl(this as any); }
  private async handleScrollToTop(): Promise<void> { return handleScrollToTopImpl(this as any); }
  private handleScrollToBottom(): void { handleScrollToBottomImpl(this as any); }
  private saveScrollPosition(): void { saveScrollPositionImpl(this as any); }
  private restoreScrollPosition(): void { restoreScrollPositionImpl(this as any); }
  private saveScrollPositionForReaction(): void { saveScrollPositionForReactionImpl(this as any); }
  private disconnectObservers(): void { disconnectObserversImpl(this as any); }
  private setupScrollListeners(): void { setupScrollListenersImpl(this as any); }
  private updateStickyDate(): void { updateStickyDateImpl(this as any); }
  private updateIsAtBottom(): void { updateIsAtBottomImpl(this as any); }
  scrollToBottom(smooth = false): void { scrollToBottomImpl(this as any, smooth); }
  private scrollToBottomAfterLoad(): void { scrollToBottomAfterLoadImpl(this as any); }
  private scrollToBottomWithRetry(retries: number): void { scrollToBottomWithRetryImpl(this as any, retries); }
  scrollToMessage(messageId: string | number): void { scrollToMessageImpl(this as any, messageId); }
  private scrollToMessageWithRetry(messageId: string | number, retries: number): void { scrollToMessageWithRetryImpl(this as any, messageId, retries); }
  private highlightAndScrollToElement(element: Element): void { highlightAndScrollToElementUtil(element); }
  refreshMessages(): void {
    this.messageListService.cleanup();
    this.initializeService();
  }
  handleKeydown(event: KeyboardEvent): void { handleKeydownImpl(this as any, event); }
  setFocusedIndex(index: number): void { setFocusedIndexImpl(this as any, index); }
  getMessageTabIndex(index: number): number { return getMessageTabIndexImpl(this as any, index); }
  announceNewMessage(senderName: string, preview: string): void { announceNewMessageImpl(this as any, senderName, preview); }
  announceMessageSent(): void { announceMessageSentImpl(this as any); }
  announceMessageFailed(): void { announceMessageFailedImpl(this as any); }
  announceMessageDeleted(): void { announceMessageDeletedImpl(this as any); }
  announceMessageEdited(): void { announceMessageEditedImpl(this as any); }
  announceTyping(name: string): void { announceTypingImpl(this as any, name); }
  private announceLoadingMore(): void { announceLoadingMoreImpl(this as any); }
  showInlineToast(text: string, type: ToastType = ToastType.success, duration = 2000): void { showInlineToastImpl(this as any, text, type, duration); }
  onInlineToastClosed(): void { if (this.inlineToastTimer) { clearTimeout(this.inlineToastTimer); } this.inlineToastText.set(null); }
  private getMessagePreview(message: CometChat.BaseMessage): string { return getMessagePreviewUtil(message); }
  private isMediaMessage(message: CometChat.BaseMessage): boolean { return isMediaMessageUtil(message); }
  private focusMessageAtIndex(index: number): void { this.setFocusedIndex(index); }
  private async markInitialMessagesAsRead(): Promise<void> { return markInitialMessagesAsReadImpl(this as any); }
  private async handleRealtimeMessageReceipt(message: CometChat.BaseMessage): Promise<void> { return handleRealtimeMessageReceiptImpl(this as any, message); }
  private async markMessagesReadOnScrollToBottom(): Promise<void> { return markMessagesReadOnScrollToBottomImpl(this as any); }
  private getLatestReceiverMessage(messages: CometChat.BaseMessage[]): CometChat.BaseMessage | undefined { return getLatestReceiverMessageUtil(messages, this.loggedInUser?.getUid() || '') ?? undefined; }
  private isReceiverMessage(message: CometChat.BaseMessage): boolean { return isReceiverMessageUtil(message, this.loggedInUser?.getUid() || ''); }
  private isSenderMessage(message: CometChat.BaseMessage): boolean { return isSenderMessageUtil(message, this.loggedInUser?.getUid() || ''); }
  private notifyUnreadCountChange(_count: number): void {}
  private notifyMessagesRead(message: CometChat.BaseMessage): void { notifyMessagesReadImpl(this as any, message); }
  private getConversationId(): string | null { return getConversationIdUtil(this.user || null, this.group || null); }
  private getConversationType(): string { return getConversationTypeUtil(this.user || null, this.group || null); }
  private publishActiveChatChanged(): void { publishActiveChatChangedImpl(this as any); }
  private handleNewMessages(currentMessages: CometChat.BaseMessage[]): void { handleNewMessagesImpl(this as any, currentMessages); }
  private shouldPlaySound(message: CometChat.BaseMessage): boolean { return shouldPlaySoundImpl(this as any, message); }
  private playMessageSound(): void { playMessageSoundImpl(this as any); }
  private handleLifecycleError(error: unknown, hook: string): void { handleLifecycleErrorImpl(this as any, error, hook); }
  private handleServiceError(error: Error): void { handleServiceErrorImpl(this as any, error); }
  onBubbleError(context: ErrorContext): void { onBubbleErrorImpl(context); }
  private handleReceiptError(error: CometChat.CometChatException, context: string): void { handleReceiptErrorImpl(this as any, error, context); }
  private async markAsReadWithRetry(message: CometChat.BaseMessage, retryCount = 0): Promise<void> { return markAsReadWithRetryImpl(this as any, message, retryCount); }
  private safeCheckScrollPosition(): boolean { try { return this.isAtBottom(); } catch { return true; } }
  private safeEmitUnreadCountChange(count: number): void { try { this.notifyUnreadCountChange(count); } catch { /* ignore */ } }
  private shouldShowSmartRepliesForMessage(message: CometChat.BaseMessage): boolean { return shouldShowSmartRepliesForMessageImpl(this as any, message); }
  handleRetryClick(): void { this.listState.set(States.loading); this.messageListService.clearError(); this.refreshMessages(); }
  onUserTyping(): void {}
  onMessageSent(): void { this.hideSmartReplies.set(true); this.hideConversationStarters.set(true); }
  onSmartReplyClick(reply: string): void { this.smartReplyClick.emit(reply); this.hideSmartReplies.set(true); CometChatUIEvents.ccComposeMessage.next(reply); }
  onSmartRepliesClose(): void { this.hideSmartReplies.set(true); }
  onConversationStarterClick(starter: string): void { this.conversationStarterClick.emit(starter); this.hideConversationStarters.set(true); CometChatUIEvents.ccComposeMessage.next(starter); }
  onNewMessagesBannerClick(): void { this.scrollToBottom(); this.showNewMessagesBanner.set(false); this.newMessagesCount.set(0); }
  showDeleteConfirmation(message: CometChat.BaseMessage): void { showDeleteConfirmationImpl(this as any, message); }
  async handleDeleteConfirm(): Promise<void> { return handleDeleteConfirmImpl(this as any); }
  handleDeleteCancel(): void { handleDeleteCancelImpl(this as any); }
  getDeleteDialogTitle(): string { return getDeleteDialogTitleImpl(); }
  getDeleteDialogSubtitle(): string { return getDeleteDialogSubtitleImpl(); }
  getDeleteDialogConfirmText(): string { return getDeleteDialogConfirmTextImpl(); }
  getDeleteDialogCancelText(): string { return getDeleteDialogCancelTextImpl(); }
  showFlagConfirmation(message: CometChat.BaseMessage): void { showFlagConfirmationImpl(this as any, message); }
  async handleFlagConfirm(event: { message: CometChat.BaseMessage; reasonId: string; remark: string }): Promise<void> { return handleFlagConfirmImpl(this as any, event); }
  handleFlagCancel(): void { handleFlagCancelImpl(this as any); }
  onEditMessage(messageId: number): void { onEditMessageImpl(this as any, messageId); }
  onReplyMessage(messageId: number): void { onReplyMessageImpl(this as any, messageId); }
  onReplyPreviewClick(quotedMessage: CometChat.BaseMessage): void { onReplyPreviewClickImpl(this as any, quotedMessage); }
  onMessageInfo(messageId: number): void { onMessageInfoImpl(this as any, messageId); }
  closeMessageInfo(): void { closeMessageInfoImpl(this as any); }
  async copyMessageToClipboard(message: CometChat.BaseMessage): Promise<void> { return copyMessageToClipboardImpl(this as any, message); }
  handleMessagePrivately(message: CometChat.BaseMessage): void { handleMessagePrivatelyImpl(this as any, message); }
  handleOptionClick(option: ContextMenuItem, message: CometChat.BaseMessage): void { handleOptionClickImpl(this as any, option, message); }
  async markMessageAsUnread(message: CometChat.BaseMessage): Promise<void> { return markMessageAsUnreadImpl(this as any, message); }
  showEmojiKeyboardForMessage(message: CometChat.BaseMessage): void { showEmojiKeyboardForMessageImpl(this as any, message); }
  private calculateEmojiKeyboardPosition(message: CometChat.BaseMessage): void { calculateEmojiKeyboardPositionImpl(this as any, message); }
  async onEmojiSelected(emoji: string): Promise<void> { return onEmojiSelectedImpl(this as any, emoji); }
  onEmojiKeyboardClose(): void { onEmojiKeyboardCloseImpl(this as any); }
  async onBubbleReactionClick(event: { reaction: CometChat.ReactionCount; message: CometChat.BaseMessage }): Promise<void> { return onBubbleReactionClickImpl(this as any, event); }
  async onBubbleReactionListItemClick(event: { reaction: CometChat.Reaction; message: CometChat.BaseMessage }): Promise<void> { return onBubbleReactionListItemClickImpl(this as any, event); }
  async translateMessage(message: CometChat.BaseMessage): Promise<void> { return translateMessageImpl(this as any, message); }
  getTranslatedText(messageId: number): string | undefined { return getTranslatedTextImpl(this as any, messageId); }
  isMessageTranslating(messageId: number): boolean { return isMessageTranslatingImpl(this as any, messageId); }
  isMessageTranslated(messageId: number): boolean { return isMessageTranslatedImpl(this as any, messageId); }
  private getDefaultTranslationLanguage(): string { return getDefaultTranslationLanguageImpl(); }
  setPreferredTranslationLanguage(language: string): void { setPreferredTranslationLanguageImpl(this as any, language); }
  trackByItem(_index: number, item: MessageListItem): string { return item.key; }
  trackByMessage(_index: number, message: CometChat.BaseMessage): string | number {
    return message.getId() || message.getMuid();
  }
}
