
import {contractMessageState, contractServerId, ContractMessageState} from '../../utils/state-contract';
import {FrameProbeReporter} from '../../utils/offline/frame-probe';
import {Component, Input, Output, EventEmitter, TemplateRef, ViewChild, ElementRef, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, OnDestroy, OnChanges, AfterViewInit, AfterViewChecked, SimpleChanges, signal, computed, Signal, inject, DestroyRef, booleanAttribute, Injector, untracked,} from '@angular/core';
import {
  CometChatPinSaveConfirmDialogComponent,
  PinSaveConfirmMessageAction,
} from '../base-elements/cometchat-pin-save-confirm-dialog/cometchat-pin-save-confirm-dialog.component';
import { safeEffect } from '../../utils/safe-effect';
import {CommonModule} from '@angular/common';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
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
import {ThreadSubscriptionService} from '../../services/thread-subscription.service';
import {stampThreadSubscription} from '../../utils/thread-subscription-utils';
import {PinSaveService, PinSaveAction} from '../../services/pin-save.service';
import {applyPinSaveFrom} from '../../utils/pin-save-utils';
import {CometChatThreadEvents, IThreadSubscriptionChanged} from '../../events/CometChatThreadEvents';
import {CometChatPinSaveEvents} from '../../events/CometChatPinSaveEvents';
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
import {handleNewMessagesImpl, shouldPlaySoundImpl, playMessageSoundImpl, computeMessagesWithDateSeparatorsImpl, getReactionFingerprintImpl, getDateStringImpl, trackKeyFor} from './cometchat-message-list.message-state';
import {markInitialMessagesAsReadImpl, handleRealtimeMessageReceiptImpl, markMessagesReadOnScrollToBottomImpl, markAsReadWithRetryImpl} from './cometchat-message-list.read-handlers';
import {initializeServiceImpl, publishActiveChatChangedImpl, setupIntersectionObserversImpl} from './cometchat-message-list.init-utils';
import {handleOptionClickImpl} from './cometchat-message-list.option-click';
import {OfflineHubService} from '../../services/offline-hub.service';
import {OfflineNotice} from '../../utils/offline/offline-hub';
import {offlineNoticeText} from '../../utils/offline/notices';
import {discardOfflineMessageImpl, retryOfflineMessageImpl} from './cometchat-message-list.offline-actions';
import { attachRetryOnScroll } from './cometchat-message-list.offline-scroll';
import {announceNewMessageImpl, announceMessageSentImpl, announceMessageFailedImpl, announceMessageDeletedImpl, announceMessageEditedImpl, announceTypingImpl, announceLoadingMoreImpl} from './cometchat-message-list.announce-utils';
import {onEditMessageImpl, onReplyMessageImpl, onReplyPreviewClickImpl, onMessageInfoImpl, closeMessageInfoImpl, copyMessageToClipboardImpl, handleMessagePrivatelyImpl, markMessageAsUnreadImpl} from './cometchat-message-list.interaction-utils';
import {handleKeydownImpl, setFocusedIndexImpl, getMessageTabIndexImpl} from './cometchat-message-list.keyboard-utils';
import {ngOnInitImpl, ngOnChangesImpl, ngAfterViewInitImpl, ngOnDestroyImpl, initializeLoggedInUserImpl, initializeFormattersImpl, configureFormattersWithUserImpl} from './cometchat-message-list.lifecycle-utils';
import {setupScrollListenersImpl, getMessageAlignmentImpl, isCallForCurrentConversationImpl, updateListStateImpl, showInlineToastImpl, notifyMessagesReadImpl, handleLifecycleErrorImpl, handleServiceErrorImpl, onBubbleErrorImpl, handleReceiptErrorImpl, shouldShowSmartRepliesForMessageImpl} from './cometchat-message-list.helper-utils';

import {CometChatLocalize} from '../../resources/CometChatLocalize/cometchat-localize';
import {TranslatePipe} from '../../resources/CometChatLocalize/translate.pipe';
import {CometChatLogger} from '../../utils/CometChatLogger';

import {States, MessageListAlignment, MessageBubbleAlignment, Placement,} from '../../Enums/Enums';
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

  /** True when this message is the FIRST of a multi-attachment batch (same metadata.batchId run). */
  isFirstInBatch?: boolean;

  /** True when this message is the LAST of a multi-attachment batch (same metadata.batchId run). */
  isLastInBatch?: boolean;
}
@Component({
  selector: 'cometchat-message-list',
  standalone: true,
  imports: [
    CometChatPinSaveConfirmDialogComponent,
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
export class CometChatMessageListComponent implements OnInit, OnDestroy, OnChanges, AfterViewInit, AfterViewChecked {
  readonly shimmerList = CometChatUIKitConstants.shimmerList;
  private messageListService = inject(MessageListService);
  private offlineHubService = inject(OfflineHubService);
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
  private threadSubscription = inject(ThreadSubscriptionService);
  private pinSave = inject(PinSaveService);
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
  /**
   * The thread's parent message, for thread mode.
   *
   * Preferred over {@link parentMessageId}: the id alone cannot answer "is this
   * thread followed right now", and a reply arriving over the socket carries no
   * subscription flag of its own — it has to inherit the parent's. The id used
   * for scoping is derived from this when it is present.
   */
  @Input() parentMessage?: CometChat.BaseMessage;
  /**
   * Parent message id, for thread mode.
   *
   * @deprecated Pass {@link parentMessage} instead — the id is derived from it.
   * Still honoured when `parentMessage` is absent, so existing callers keep
   * working; they just opt out of realtime subscription state on replies.
   */
  @Input()
  set parentMessageId(value: number | undefined) {
    this.parentMessageIdInput = value;
  }
  get parentMessageId(): number | undefined {
    return this.parentMessage?.getId() ?? this.parentMessageIdInput;
  }
  private parentMessageIdInput?: number;
  @Input({ transform: booleanAttribute }) isAgentChat = false;
  @Input({ transform: booleanAttribute }) loadLastAgentConversation = false;
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
  /**
   * Offline support only: hide the notices the list shows about unsent
   * messages (removed, not sent, queue full, cache reset). Has no effect while
   * offline support is off, when no such notice is ever raised.
   */
  @Input({ transform: booleanAttribute }) hideOfflineNotices = false;
  @Input({ transform: booleanAttribute }) hideStickyDate = false;
  @Input({ transform: booleanAttribute })
  set hideAvatar(value: boolean) { this._hideAvatar.set(value); this.hideAvatarExplicitlySet.set(true); }
  get hideAvatar(): boolean { return this._hideAvatar(); }
  @Input({ transform: booleanAttribute }) hideGroupActionMessages = false;
  @Input({ transform: booleanAttribute })
  set hideError(value: boolean) { this._hideError.set(value); this.hideErrorExplicitlySet.set(true); }
  get hideError(): boolean { return this._hideError(); }
  @Input({ transform: booleanAttribute }) hideReplyInThreadOption = false;
  /**
   * Hide the `Follow thread` / `Unfollow thread` option without turning the
   * feature off — for apps that want the thread-header control only.
   */
  @Input({ transform: booleanAttribute }) hideThreadSubscriptionOption = false;
  @Input({ transform: booleanAttribute }) hidePinMessageOption = false;
  @Input({ transform: booleanAttribute }) hideUnpinMessageOption = false;
  @Input({ transform: booleanAttribute }) hideSaveMessageOption = false;
  @Input({ transform: booleanAttribute }) hideUnsaveMessageOption = false;
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
  @Input({ transform: booleanAttribute }) hideFlagRemarkField = false;
  @Input({ transform: booleanAttribute }) hideFlagMessageOption = false;
  @Input({ transform: booleanAttribute }) showMarkAsUnreadOption = true;
  @Input({ transform: booleanAttribute }) startFromUnreadMessages = true;
  @Input({ transform: booleanAttribute }) hideReplyOption = false;
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
  // eslint-disable-next-line @angular-eslint/no-output-native -- public output, renaming it would break integrators
  @Output() error = new EventEmitter<CometChat.CometChatException>();
  @Output() threadRepliesClick = new EventEmitter<CometChat.BaseMessage>();
  @Output() reactionClick = new EventEmitter<{ reaction: CometChat.ReactionCount; message: CometChat.BaseMessage }>();
  @Output() reactionListItemClick = new EventEmitter<{ reaction: CometChat.Reaction; message: CometChat.BaseMessage }>();
  @Output() smartReplyClick = new EventEmitter<string>();
  @Output() conversationStarterClick = new EventEmitter<string>();
  @Output() messagePrivatelyClick = new EventEmitter<{ message: CometChat.BaseMessage; user: CometChat.User }>();
  @Output() replyClick = new EventEmitter<CometChat.BaseMessage>();
  /** Emitted whenever a thread's subscription changes, whoever caused it. */
  @Output() threadSubscriptionChange = new EventEmitter<IThreadSubscriptionChanged>();
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

  constructor() {
    this.messages = this.messageListService.messages;
    this.loadingState = this.messageListService.loadingState;
    this.errorState = this.messageListService.errorState;
    this.unreadCount = this.messageListService.unreadCount;
    safeEffect(() => {
      const messages = this.messages();
      this.handleNewMessages(messages);
      this.previousMessages = [...messages];
      this.cdr.markForCheck();
    });
    safeEffect(() => {
      const error = this.errorState();
      if (error && !this.effectiveHideError()) {
        this.handleServiceError(error);
      }
    });
    // Offline (D83): a first-page load that failed while messages are on screen keeps them (no error
    // view) and reaches `error` once. The service never emits this with offline off.
    this.messageListService.loadError$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(error => this.error.emit(error as CometChat.CometChatException));
    safeEffect(() => {
      this.updateListState();
    });
    // Offline path: a send of this chat that turns failed is announced, since
    // the row only changes its icon (a11y). The hub never emits with offline off.
    this.offlineHubService.sendState$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(event => {
      if (event.state !== 'failed' || !event.message) return;
      const loggedInUid = this.loggedInUser?.getUid?.() ?? '';
      if (!isMessageForCurrentConversationUtil(event.message, this.user || null, this.group || null, loggedInUid)) return;
      // This list's thread level too, as `visibleOfflineNotices` does: a thread
      // panel and the main list are both mounted on the same chat, so without
      // it a failed reply was read out twice to a screen-reader user.
      const level = Number(event.message.getParentMessageId?.() ?? 0) || 0;
      if (level !== (Number(this.parentMessageId) || 0)) return;
      this.liveAnnouncer.announce(CometChatLocalize.getLocalizedString('message_list_not_sent_tap_to_retry'), 'polite');
    });
  }
  ngOnInit(): void { try { ngOnInitImpl(this as any); } catch (error) { this.handleLifecycleError(error, 'ngOnInit'); } }
  ngOnChanges(changes: SimpleChanges): void { try { ngOnChangesImpl(this as any, changes); } catch (error) { CometChatLogger.error('CometChatMessageList', 'Error in ngOnChanges:', error); } }
  ngAfterViewInit(): void { try { ngAfterViewInitImpl(this as any); } catch (error) { this.handleLifecycleError(error, 'ngAfterViewInit'); } }
  /** Debug/source builds only: report committed rows to the installed frame probe. */
  ngAfterViewChecked(): void { this.frameProbe.report(this.messages(), () => trackKeyFor(this)); }
  private readonly frameProbe = new FrameProbeReporter('message-list');
  /** Set when the list is destroyed; pending scroll frames and retries check it and stop. */
  isDestroyed = false;
  ngOnDestroy(): void { this.isDestroyed = true; try { ngOnDestroyImpl(this as any); } catch (error) { CometChatLogger.error('CometChatMessageList', 'Error in ngOnDestroy:', error); } }
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
  /**
   * Typed context, not `this as any`: a group event in the open group updates the
   * list's group in place (the service's setGroup would clear the list) and adds
   * the action row unless group actions are hidden.
   */
  private subscribeToGroupEvents(): void {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const list = this;
    subscribeToGroupEventsImpl({
      destroyRef: this.destroyRef,
      cdr: this.cdr,
      messageListService: this.messageListService,
      get parentMessageId() { return list.parentMessageId ?? null; },
      get group() { return list.group; },
      get hideGroupActionMessages() { return list.hideGroupActionMessages; },
      scrollToBottom: smooth => this.scrollToBottom(smooth),
      setGroup: group => { this.group = group; },
    });
  }
  private subscribeToCallEvents(): void { subscribeToCallEventsImpl(this as any); }
  private subscribeToUIDialogEvents(): void { subscribeToUIDialogEventsImpl(this as any); }
  private isCallForCurrentConversation(call: CometChat.Call): boolean { return isCallForCurrentConversationImpl(this as any, call); }
  private isMessageForCurrentConversation(message: CometChat.BaseMessage): boolean { return isMessageForCurrentConversationUtil(message, this.user || null, this.group || null, this.loggedInUser?.getUid() || ''); }
  private updateListState(): void { updateListStateImpl(this as any); }
  private computeMessagesWithDateSeparators(): MessageListItem[] { return computeMessagesWithDateSeparatorsImpl(this as any) as MessageListItem[]; }
  private getReactionFingerprint(message: CometChat.BaseMessage): string { return getReactionFingerprintImpl(message); }
  private getDateString(timestamp: number): string { return getDateStringImpl(timestamp); }
  getDefaultSeparatorDateFormat(): CalendarObject { return { today: CometChatLocalize.getLocalizedString('today'), yesterday: CometChatLocalize.getLocalizedString('yesterday'), otherDays: CometChatLocalize.getDatePattern('monthName') }; }
  getDefaultStickyDateFormat(): CalendarObject { return { today: CometChatLocalize.getLocalizedString('today'), yesterday: CometChatLocalize.getLocalizedString('yesterday'), otherDays: CometChatLocalize.getDatePattern('monthName') }; }
  getDefaultMessageDateFormat(): CalendarObject {
    const time = CometChatLocalize.getTimePattern();
    return { today: time, yesterday: time, otherDays: time };
  }
  getEffectiveSeparatorDateFormat(): CalendarObject {
    return this.separatorDateTimeFormat || this.getDefaultSeparatorDateFormat();
  }
  getEffectiveStickyDateFormat(): CalendarObject {
    return this.stickyDateTimeFormat || this.getDefaultStickyDateFormat();
  }
  getEffectiveMessageDateFormat(): CalendarObject {
    return this.messageSentAtDateTimeFormat || this.getDefaultMessageDateFormat();
  }
  /** State-contract identifiers (data-cc-*): no message text, never read by screen readers. */
  contractId(message: CometChat.BaseMessage): string { return contractServerId(message); }
  contractState(message: CometChat.BaseMessage): ContractMessageState { return contractMessageState(message); }
  contractMine(message: CometChat.BaseMessage): boolean { return this.getMessageAlignment(message) === MessageBubbleAlignment.right; }
  getMessageAlignment(message: CometChat.BaseMessage): MessageBubbleAlignment { return getMessageAlignmentImpl(this as any, message); }

  /**
   * Should this bubble hide its timestamp/receipt footer?
   *
   * Two rules combine. In an agent chat only the user's own side carries a
   * footer. In a batch, only the last bubble does — except when the bubble is
   * pinned or saved, because those indicators live in the footer and hiding it
   * would hide the very badge that explains why the message is marked.
   *
   * The pin/save calls stay optional: messages reach here from mocks and from
   * SDK versions predating the accessors.
   */
  shouldHideStatusInfoView(item: MessageListItem): boolean {
    const message = item.message;
    if (!message) return false;

    if (this.isAgentChat && this.getMessageAlignment(message) !== MessageBubbleAlignment.right) {
      return true;
    }
    const marked = message.isPinned?.() || message.isSaved?.();
    return item.isLastInBatch === false && !marked;
  }
  getMessageOptions(message: CometChat.BaseMessage): CometChatActionsIcon[] { return getMessageOptionsImpl(this as any, message); }

  // ==================== Thread Subscription ====================

  /**
   * The feature gate. Off by default and read from global config only — there
   * is no capability flag on app settings to feature-detect from, so only the
   * integrator knows whether the threads endpoints are live for their app.
   */
  get threadSubscriptionEnabled(): boolean { return !!this.globalConfig?.enableThreadSubscription && this.threadSubscription.isSupported(); }

  /**
   * Handles the `threadSubscription` sheet option. The service resolves a reply
   * to its parent thread, so choosing the option on a reply toggles the thread
   * being read rather than minting a subscription rooted at the reply.
   */
  toggleThreadSubscription(message: CometChat.BaseMessage): void { this.threadSubscription.toggle(message); }

  // ==================== Pin / Save ====================

  /**
   * App-level flags, resolved once and then read synchronously by the option
   * builder. They start false so a sheet opened before the flags resolve omits
   * the options rather than offering something the app has turned off.
   */
  pinMessageEnabled = false;
  saveMessageEnabled = false;

  /**
   * An explicit global-config value wins over the SDK's app-level flag. The
   * flags are provisioned server-side, so without an override there is no way
   * to develop against the feature before they are switched on.
   */
  private async resolvePinSaveFlags(): Promise<void> {
    const pinOverride = this.globalConfig?.enablePinMessage;
    const saveOverride = this.globalConfig?.enableSaveMessage;
    this.pinMessageEnabled = pinOverride ?? (await this.pinSave.isPinEnabled());
    this.saveMessageEnabled = saveOverride ?? (await this.pinSave.isSaveEnabled());
    this.cdr.markForCheck();
  }

  /** The unpin/unsave awaiting confirmation, or null. One at a time. */
  // Narrowed to the removing half of each pair: only those ask before acting, so
  // the type now says what `requestPinSave` already enforced by hand — and the
  // shared confirm dialog accepts exactly these.
  pendingPinSave = signal<{ action: PinSaveConfirmMessageAction; message: CometChat.BaseMessage } | null>(null);

  /**
   * Entry point from the action sheet.
   *
   * Pinning and saving run immediately: they add something, and the same menu
   * undoes them in one click. Removing is confirmed, because the pin is
   * conversation-wide — taking it away acts for everyone in the chat, not just
   * the person who tapped — and because a save can be the only remaining
   * pointer to a message buried far up the history.
   */
  requestPinSave(action: PinSaveAction, message: CometChat.BaseMessage): void {
    if (action === 'unpin' || action === 'unsave') {
      this.pendingPinSave.set({ action, message });
      this.cdr.markForCheck();
      return;
    }
    void this.runPinSave(action, message);
  }

  confirmPinSave(): void {
    const pending = this.pendingPinSave();
    this.pendingPinSave.set(null);
    if (pending) void this.runPinSave(pending.action, pending.message);
  }

  cancelPinSave(): void {
    this.pendingPinSave.set(null);
    this.cdr.markForCheck();
  }

  private async runPinSave(action: PinSaveAction, message: CometChat.BaseMessage): Promise<void> {
    // The service surfaces the toast, publishes on the bus and reverts on
    // failure; a null result means it failed, so there is nothing to swap in.
    await this.pinSave.run(action, message);
    this.cdr.markForCheck();
  }

  /**
   * Keep bubbles current when a pin or save happens anywhere — another user
   * pinning in this conversation, or this user saving on another device.
   *
   * The three pin/save attributes are PATCHED onto the row already on screen
   * rather than the row being swapped for the event's message. A pin/save
   * payload describes that one change and is not a complete message: the save
   * response carries no quoted message, so swapping it in erased the reply
   * preview from a bubble that had one — it came back only on the refetch a
   * conversation switch triggers. Reactions and moderation state were exposed to
   * the same loss.
   *
   * Patching still has to CLEAR on unpin/unsave, which is why all three keys are
   * always passed: `applyPinSave` writes whatever it is given, including
   * `undefined`, where copying only truthy values would leave a stale marker.
   */
  private subscribeToPinSaveEvents(): void {
    const refresh = ({ message }: { message: CometChat.BaseMessage }) => {
      const id = message?.getId?.();
      if (!id) return;
      const held = this.messageListService.getMessageById(id);
      const target = held ?? message;
      if (held) applyPinSaveFrom(held, message);
      // Re-set even when the object is unchanged by identity: the service emits a
      // new array, which is what makes the list's computeds recompute. Identity
      // is preserved, so `trackBy` keeps the DOM node and any open viewer with it.
      this.messageListService.updateMessageById(id, target);
      this.cdr.markForCheck();
    };
    // Merged views: a bubble has to redraw on this user's own optimistic flip as
    // well as on someone else's confirmed one.
    CometChatPinSaveEvents.pinned$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(refresh);
    CometChatPinSaveEvents.unpinned$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(refresh);
    CometChatPinSaveEvents.saved$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(refresh);
    CometChatPinSaveEvents.unsaved$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(refresh);
  }

  /**
   * Keep the list in agreement when the state changes elsewhere — the thread
   * header, or an auto-subscribe the backend performed when the user replied.
   *
   * Re-rendering alone is not enough: the option's title is read off the message
   * object, so the flag is written onto every held message belonging to that
   * thread. That keeps the source of truth coherent for a direct read and for a
   * bubble that remounts before the next fetch.
   */
  private subscribeToThreadEvents(): void {
    CometChatThreadEvents.ccThreadSubscriptionChanged
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ parentMessageId, subscribed }) => {
        stampThreadSubscription(
          [this.parentMessage, ...this.messageListService.messages()],
          parentMessageId,
          subscribed
        );
        this.threadSubscriptionChange.emit({ parentMessageId, subscribed });
        this.cdr.markForCheck();
      });
  }
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
  private notifyUnreadCountChange(_count: number): void {
    // Clear the unread count in the conversation list when messages are marked as read
    const conversationId = this.getConversationId();
    if (conversationId) {
      this.conversationsService.updateConversationUnreadCount(conversationId, _count);
    }
    // Also clear the message list unread divider and count
    if (_count === 0) {
      this.unreadDividerMessageId.set(null);
      this.markedAsUnreadCount.set(0);
      this.showScrollToBottom.set(false);
      this.showNewMessagesBanner.set(false);
      this.newMessagesCount.set(0);
    }
  }
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
  /** Adds a message to the list (used by parent components for temporary messages). */
  addMessage(message: CometChat.BaseMessage): void { this.messageListService.addMessage(message); }
  /** Removes a message from the list by ID (used by parent components to remove temporary messages). */
  removeMessage(messageId: number): void { this.messageListService.removeMessage(messageId); }
  onUserTyping(): void {}
  onMessageSent(): void { this.hideSmartReplies.set(true); this.hideConversationStarters.set(true); }
  onSmartReplyClick(reply: string): void { this.smartReplyClick.emit(reply); this.hideSmartReplies.set(true); CometChatUIEvents.ccComposeMessage.next(reply); }
  onSmartRepliesClose(): void { this.hideSmartReplies.set(true); }
  onConversationStarterClick(starter: string): void { this.conversationStarterClick.emit(starter); this.hideConversationStarters.set(true); CometChatUIEvents.ccComposeMessage.next(starter); }
  onNewMessagesBannerClick(): void { this.scrollToBottom(); this.showNewMessagesBanner.set(false); this.newMessagesCount.set(0); }
  showDeleteConfirmation(message: CometChat.BaseMessage): void { showDeleteConfirmationImpl(this as any, message); }
  async handleDeleteConfirm(): Promise<void> {
    const discard = this.offlineDiscardTarget;
    if (discard && discard === this.messageToDelete()) {
      // A second confirm while the discard runs is swallowed (Android: actionsInFlight); it must
      // not fall through to a server delete of the unsent message (id 0).
      if (this.offlineDiscardRunning) return;
      this.offlineDiscardRunning = true;
      try {
        return await this.discardOfflineMessage(discard);
      } finally {
        this.offlineDiscardRunning = false;
        if (this.offlineDiscardTarget === discard) this.offlineDiscardTarget = null;
      }
    }
    this.offlineDiscardTarget = null;
    return handleDeleteConfirmImpl(this as any);
  }
  handleDeleteCancel(): void { this.offlineDiscardTarget = null; handleDeleteCancelImpl(this as any); }
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

  // ── Offline support (ON path only) ──
  /**
   * After the SDK's catch-up sweep: one cumulative read receipt for the newest
   * message of the open chat, if the user is at the bottom (README §3.6).
   */
  private readonly offlineSweepReceipt = this.offlineHubService.messageSync$
    .pipe(takeUntilDestroyed())
    .subscribe(event => {
      if (event.gen !== this.offlineHubService.gen || !this.isAtBottom()) return;
      const latest = this.getLatestReceiverMessage(this.messages());
      if (latest && latest.getId() && !latest.getReadAt()) void this.messageListService.markAsRead(latest);
    });
  /**
   * Offline (README §3.7): after a PARTIAL sweep the list may reset to the
   * newest window. A reader at the bottom stays there; anyone scrolled up gets
   * the existing scroll-to-bottom ("jump to latest") button instead of a jump.
   */
  private readonly offlineNewestWindowReset = (() => {
    let seen = 0;
    return safeEffect(() => {
      const count = this.messageListService.newestWindowReset();
      if (count === seen) return;
      seen = count;
      if (untracked(() => this.isAtBottom())) setTimeout(() => this.scrollToBottom(), 0);
      else this.showScrollToBottom.set(true);
    });
  })();
  /** Detaches the scroll-to-load listeners while a "Connect to load more" footer may load on scroll. */
  private detachOfflineScrollRetry: (() => void) | null = null;
  /**
   * UIK-READ-03: once the connection is back, scrolling to the end the footer
   * stands at loads, as tapping the footer does. The listeners exist only while
   * the footer shows and the connection is back, so offline off adds none.
   */
  private readonly offlineRetryOnScroll = (() => {
    const detach = () => {
      this.detachOfflineScrollRetry?.();
      this.detachOfflineScrollRetry = null;
    };
    this.destroyRef.onDestroy(detach);
    return safeEffect(() => {
      const active =
        this.messageListService.offlineFooter() === 'connect_to_load_more' &&
        this.messageListService.offlineFooterRetryable();
      untracked(() => {
        detach();
        if (active) this.detachOfflineScrollRetry = attachRetryOnScroll(this as any);
      });
    });
  })();
  /** `connect_to_load_more` while an offline read could not go past the saved messages. */
  get offlineFooter(): string { return this.messageListService.offlineFooter(); }
  /** Offline (D84 rule 3): nothing on screen and no connection says "Connect to load messages", not an error with Retry. */
  get offlineConnectToLoad(): boolean { return this.messageListService.offlineConnectToLoad?.() === true; }
  /** The edge the "Connect to load more" row stands at: `previous` is the top of the list, `next` the bottom. */
  get offlineFooterEdge(): 'previous' | 'next' { return this.messageListService.offlineRetryDirection(); }
  /** A tap on the "Connect to load more" row. */
  retryOfflineRead(): void { void this.readBlockedEdge(this.messageListService.offlineRetryDirection(), false); }
  /**
   * Offline (D84 rule 9): the connection is back, so the page behind each "Connect to load more"
   * row loads once by itself, the older edge first. An edge whose direction is already reading
   * stays as it is: its own read settles it.
   */
  private readonly offlineEdgeReload = (() => {
    this.messageListService.edgeReload$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      const edges = this.messageListService.offlineBlockedEdges();
      const generation = this.messageListService.getFetchGeneration();
      void (async () => {
        if (edges.previous) await this.readBlockedEdge('previous', true);
        if (edges.next && this.messageListService.getFetchGeneration() === generation) await this.readBlockedEdge('next', true);
      })();
    });
  })();
  private async readBlockedEdge(direction: 'previous' | 'next', keepOther: boolean): Promise<void> {
    const newer = direction === 'next';
    // One read per direction at a time, shared with scrolling (Android: one `inProgress` for the list).
    const fetching = newer ? this.isFetchingNext : this.isFetchingPrevious;
    if (fetching()) return;
    const wasEmpty = !this.hasMessages();
    const generation = this.messageListService.getFetchGeneration();
    fetching.set(true);
    const hasMore = await this.messageListService.retryOfflineRead(keepOther ? direction : undefined);
    fetching.set(false);
    // The user opened another chat meanwhile: this answer is for the old one.
    if (this.messageListService.getFetchGeneration() !== generation) return;
    (newer ? this.hasMoreNext : this.hasMorePrevious).set(
      hasMore || this.offlineFooter === 'connect_to_load_more'
    );
    if (wasEmpty) this.scrollToBottomAfterLoad();
  }
  /** Retry an own unsent message (user-invoked; taps while one runs are ignored). */
  async retryOfflineMessage(message: CometChat.BaseMessage): Promise<void> { await retryOfflineMessageImpl(this as any, message); }
  /** The unsent message the open delete dialog will discard (offline support only). */
  private offlineDiscardTarget: CometChat.BaseMessage | null = null;
  /** The discard of {@link offlineDiscardTarget} is under way (a double confirm runs it once). */
  private offlineDiscardRunning = false;
  /** Delete on an own unsent message: today's confirm dialog, then a device-only discard. */
  requestOfflineDiscard(message: CometChat.BaseMessage): void {
    this.offlineDiscardTarget = message;
    this.showDeleteConfirmation(message);
  }
  /** Remove an own message that has not been sent, from this device (BEH-SEND-36/37). */
  async discardOfflineMessage(message: CometChat.BaseMessage): Promise<void> { await discardOfflineMessageImpl(this as any, message); }
  /** Notices this list shows: sends of this chat, and cache resets when no conversation list is mounted. */
  get visibleOfflineNotices(): OfflineNotice[] {
    if (this.hideOfflineNotices) return [];
    const loggedInUid = this.loggedInUser?.getUid?.() ?? '';
    return this.offlineHubService.notices().filter(notice => {
      if (notice.kind === 'unsent_messages_lost' || notice.kind === 'unsent_messages_maybe_lost') return !this.offlineHubService.hasConversationList;
      // Either the message the notice is about, or one of them when it covers
      // several (the kill switch): both say which list it belongs to.
      const about = notice.message ?? notice.scopeMessage;
      if (!about) return true;
      // This list's chat AND its thread level: a thread panel and the main list each show their own
      // (Android: acceptsOfflineSendRow), so a send in the panel is not told twice.
      const level = Number(about.getParentMessageId?.() ?? 0) || 0;
      if (level !== (Number(this.parentMessageId) || 0)) return false;
      return isMessageForCurrentConversationUtil(about, this.user || null, this.group || null, loggedInUid);
    });
  }
  offlineNoticeText(notice: OfflineNotice): string { return offlineNoticeText(notice); }
  canCopyOfflineNotice(notice: OfflineNotice): boolean { return notice.kind === 'unsent_message_removed' && notice.message?.getType?.() === 'text'; }
  copyOfflineNotice(notice: OfflineNotice): void { if (notice.message) void this.copyMessageToClipboard(notice.message); this.offlineHubService.dismissNotice(notice); }
  dismissOfflineNotice(notice: OfflineNotice): void { this.offlineHubService.dismissNotice(notice); }
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
