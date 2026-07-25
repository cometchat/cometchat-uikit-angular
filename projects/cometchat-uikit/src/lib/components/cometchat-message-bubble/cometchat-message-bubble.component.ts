

import {Component, Input, Output, EventEmitter, OnInit, OnChanges, OnDestroy, AfterViewInit, SimpleChanges, TemplateRef, ChangeDetectionStrategy, ChangeDetectorRef, inject, ViewChild, ElementRef, computed, signal, booleanAttribute, DestroyRef,} from '@angular/core';
import {CommonModule} from '@angular/common';
import {CometChat} from '@cometchat/chat-sdk-javascript';
import {DatePipe} from '@angular/common';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

import {TranslatePipe} from '../../resources/CometChatLocalize/translate.pipe';
import {CometChatLocalize} from '../../resources/CometChatLocalize/cometchat-localize';
import {CometChatLogger} from '../../utils/CometChatLogger';
import {MessageBubbleAlignment, Placement} from '../../Enums/Enums';
import {CometChatActionsIcon} from '../../modals/CometChatActionsIcon';
import {CometChatActionsView} from '../../modals/CometChatActionsView';
import {CometChatTextFormatter} from '../../formatters/cometchat-text-formatter';
import {CometChatUIKit} from '../../cometchat-uikit';
import {CometChatUIKitConstants} from '../../constants';
import {MessageUtilsService} from '../../services/message-utils.service';
import {MessageBubbleConfigService, BubblePart,} from '../../services/message-bubble-config.service';
import {COMETCHAT_GLOBAL_CONFIG, GlobalConfig} from '../../services/global-config.service';
import {CallButtonsService} from '../../services/call-buttons.service';
import {CalendarObject} from '../../resources/CometChatLocalize/localization.interfaces';

import {CometChatContextMenuComponent, ContextMenuItem,} from '../base-elements/cometchat-context-menu/cometchat-context-menu.component';
import {CometChatAvatarComponent} from '../base-elements/cometchat-avatar/cometchat-avatar.component';
import {CometChatDateComponent} from '../base-elements/cometchat-date/cometchat-date.component';
import {CometChatTextBubbleComponent} from '../cometchat-text-bubble/cometchat-text-bubble.component';
import {CometChatImagesBubbleComponent} from '../cometchat-images-bubble/cometchat-images-bubble.component';
import {CometChatVideosBubbleComponent} from '../cometchat-videos-bubble/cometchat-videos-bubble.component';
import {CometChatFilesBubbleComponent} from '../cometchat-files-bubble/cometchat-files-bubble.component';
import {CometChatAudiosBubbleComponent} from '../cometchat-audios-bubble/cometchat-audios-bubble.component';
import {CometChatVoiceNoteBubbleComponent} from '../cometchat-voice-note-bubble/cometchat-voice-note-bubble.component';
import {CometChatDeleteBubbleComponent} from '../cometchat-delete-bubble/cometchat-delete-bubble.component';
import {CometChatActionBubbleComponent} from '../cometchat-action-bubble/cometchat-action-bubble.component';
import {CometChatMessagePreviewComponent} from '../base-elements/cometchat-message-preview/cometchat-message-preview.component';
import {CometChatThreadViewComponent} from '../base-elements/cometchat-thread-view/cometchat-thread-view.component';
import {CometChatPollBubbleComponent} from '../cometchat-poll-bubble/cometchat-poll-bubble.component';
import {CometChatCollaborativeDocumentBubbleComponent} from '../cometchat-collaborative-document-bubble/cometchat-collaborative-document-bubble.component';
import {CometChatCollaborativeWhiteboardBubbleComponent} from '../cometchat-collaborative-whiteboard-bubble/cometchat-collaborative-whiteboard-bubble.component';
import {CometChatStickerBubbleComponent} from '../cometchat-sticker-bubble/cometchat-sticker-bubble.component';
import {CometChatCallBubbleComponent} from '../cometchat-call-bubble/cometchat-call-bubble.component';
import {CallButtonClickEvent} from '../cometchat-call-bubble/cometchat-call-bubble.component';
import {CometChatReactionsComponent} from '../cometchat-reactions';
import {CometChatAIAssistantMessageBubble} from '../cometchat-ai-assistant-message-bubble/cometchat-ai-assistant-message-bubble.component';
import {CometChatToolCallArgumentBubble} from '../cometchat-toolcall-argument-bubble/cometchat-toolcall-argument-bubble.component';
import {CometChatToolCallResultBubble} from '../cometchat-toolcall-result-bubble/cometchat-toolcall-result-bubble.component';
import {isVoiceNote} from '../../utils/message-metadata-utils';
import {CometChatCardBubbleComponent} from '../cometchat-card-bubble/cometchat-card-bubble.component';

const BUBBLE_TYPE_MAP: Record<string, string> = {
  text_message: 'cometchat-message-bubble__text-message',
  audio_message: 'cometchat-message-bubble__audio-message',
  delete_action: 'cometchat-message-bubble__delete-message',
  file_message: 'cometchat-message-bubble__file-message',
  groupMember_action: 'cometchat-message-bubble__group-message',
  image_message: 'cometchat-message-bubble__image-message',
  video_message: 'cometchat-message-bubble__video-message',
  extension_document_custom: 'cometchat-message-bubble__document-message',
  extension_whiteboard_custom: 'cometchat-message-bubble__whiteboard-message',
  extension_poll_custom: 'cometchat-message-bubble__poll-message',
  extension_sticker_custom: 'cometchat-message-bubble__sticker-message',
  audio_call: 'cometchat-message-bubble__audio-call',
  video_call: 'cometchat-message-bubble__video-call',
  meeting_custom: 'cometchat-message-bubble__meeting-message',
};

const CONTENT_TYPE_MAP: Record<string, string> = {
  text_message: 'text',
  image_message: 'image',
  video_message: 'video',
  audio_message: 'audio',
  file_message: 'file',

  extension_poll_custom: 'poll',
  extension_sticker_custom: 'sticker',
  extension_document_custom: 'document',
  extension_whiteboard_custom: 'whiteboard',
  meeting_custom: 'meeting',

  groupMember_action: 'action',

  assistant_agentic: 'ai-assistant',
  tool_result_agentic: 'tool-result',
  tool_arguments_agentic: 'tool-arguments',
};

@Component({
  selector: 'cometchat-message-bubble',
  standalone: true,
  templateUrl: './cometchat-message-bubble.component.html',
  styleUrls: ['./cometchat-message-bubble.component.css'],
  imports: [CommonModule, CometChatContextMenuComponent, CometChatAvatarComponent, CometChatDateComponent, CometChatTextBubbleComponent, CometChatImagesBubbleComponent, CometChatVideosBubbleComponent, CometChatAudiosBubbleComponent, CometChatVoiceNoteBubbleComponent, CometChatFilesBubbleComponent, CometChatDeleteBubbleComponent, CometChatActionBubbleComponent, CometChatMessagePreviewComponent, CometChatThreadViewComponent, CometChatPollBubbleComponent, CometChatCollaborativeDocumentBubbleComponent, CometChatCollaborativeWhiteboardBubbleComponent, CometChatStickerBubbleComponent, CometChatCallBubbleComponent, CometChatReactionsComponent, CometChatAIAssistantMessageBubble, CometChatToolCallArgumentBubble, CometChatToolCallResultBubble, CometChatCardBubbleComponent, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CometChatMessageBubbleComponent
  implements OnInit, OnChanges, OnDestroy, AfterViewInit
{
  @Input({ required: true }) message!: CometChat.BaseMessage;
  @Input() alignment: MessageBubbleAlignment = MessageBubbleAlignment.right;
  @Input() group: CometChat.Group | null = null;
  @Input() options: (CometChatActionsIcon | CometChatActionsView)[] = [];
  @Input() quickOptionsCount = 2;
  @Input() leadingView: TemplateRef<any> | null = null;
  @Input() headerView: TemplateRef<any> | null = null;
  @Input() replyView: TemplateRef<any> | null = null;
  @Input() contentView: TemplateRef<any> | null = null;
  @Input() bottomView: TemplateRef<any> | null = null;
  @Input() footerView: TemplateRef<any> | null = null;
  @Input() statusInfoView: TemplateRef<any> | null = null;
  @Input() threadView: TemplateRef<any> | null = null;
  @Input({ transform: booleanAttribute }) hideThreadView = false;
  @Input() bubbleView: TemplateRef<any> | null = null;
  @Input({ transform: booleanAttribute })
  set hideAvatar(value: boolean) { this._hideAvatar.set(value); this.hideAvatarExplicitlySet.set(true); }
  get hideAvatar(): boolean { return this._hideAvatar(); }
  @Input() hideSenderName = false;
  @Input({ transform: booleanAttribute })
  set hideReceipts(value: boolean) { this._hideReceipts.set(value); this.hideReceiptsExplicitlySet.set(true); }
  get hideReceipts(): boolean { return this._hideReceipts(); }
  @Input() hideTimestamp = false;
  @Input({ transform: booleanAttribute }) hideStatusInfoView = false;
  @Input() showError = false;
  @Input({ transform: booleanAttribute })
  set hideModerationView(value: boolean) { this._hideModerationView.set(value); this.hideModerationViewExplicitlySet.set(true); }
  get hideModerationView(): boolean { return this._hideModerationView(); }
  @Input()
  set textFormatters(value: CometChatTextFormatter[] | undefined) { if (value != null) { this._textFormatters.set(value); this.textFormattersExplicitlySet.set(true); } }
  get textFormatters(): CometChatTextFormatter[] { return this._textFormatters(); }
  @Input() dateFormat?: CalendarObject;
  @Input() isSelected = false;
  @Input() ariaPosinset?: number;
  @Input() ariaSetsize?: number;
  @Input() translatedText?: string;
  @Input() reactionsRequestBuilder?: CometChat.ReactionsRequestBuilder;
  @Input() disableInteraction = false;
  /** When true (and left-aligned), reserve the avatar column even though the avatar is hidden, so
   *  batch-continuation messages align under the first message of the batch. */
  @Input({ transform: booleanAttribute }) reserveLeadingSpace = false;
  @Output() optionClick = new EventEmitter<ContextMenuItem>();
  @Output() replyPreviewClick = new EventEmitter<CometChat.BaseMessage>();
  @Output() avatarClick = new EventEmitter<CometChat.User>();
  @Output() threadRepliesClick = new EventEmitter<CometChat.BaseMessage>();
  @Output() reactionClick = new EventEmitter<{ reaction: CometChat.ReactionCount; message: CometChat.BaseMessage }>();
  @Output() reactionListItemClick = new EventEmitter<{ reaction: CometChat.Reaction; message: CometChat.BaseMessage }>();
  @Output() mediaToggle = new EventEmitter<CometChat.BaseMessage>();
  @Output() messageActionsOpen = new EventEmitter<CometChat.BaseMessage>();
  @ViewChild('bubbleWrapper') bubbleWrapperRef!: ElementRef<HTMLDivElement>;
  @ViewChild('contentViewRef') contentViewRef?: ElementRef<HTMLElement>;
  @ViewChild(CometChatContextMenuComponent) contextMenuRef?: CometChatContextMenuComponent;

  protected isHovering = false; protected isMobile = false; private hoverTimeoutRef: ReturnType<typeof setTimeout> | null = null;
  loggedInUser: CometChat.User | null = null; contentViewWidth = signal(0); private contentViewResizeObserver: ResizeObserver | null = null;

  private readonly cdr = inject(ChangeDetectorRef); private readonly messageUtils = inject(MessageUtilsService);
  private readonly bubbleConfigService = inject(MessageBubbleConfigService); private readonly callButtonsService = inject(CallButtonsService);
  private readonly datePipe = new DatePipe('en-US'); private readonly destroyRef = inject(DestroyRef);
  private globalConfig: Partial<GlobalConfig> | null = inject(COMETCHAT_GLOBAL_CONFIG, { optional: true });

  private hideReceiptsExplicitlySet = signal(false); private hideAvatarExplicitlySet = signal(false); private textFormattersExplicitlySet = signal(false); private hideModerationViewExplicitlySet = signal(false);
  private _hideReceipts = signal(false); private _hideAvatar = signal(false); private _textFormatters = signal<CometChatTextFormatter[]>([]); private _hideModerationView = signal(false);
  readonly MessageBubbleAlignment = MessageBubbleAlignment; readonly Placement = Placement;
  effectiveHideReceipts = computed(() => { if (this.hideReceiptsExplicitlySet()) return this._hideReceipts(); return this.globalConfig?.hideReceipts ?? false; });
  effectiveHideAvatar = computed(() => { if (this.hideAvatarExplicitlySet()) return this._hideAvatar(); return this.globalConfig?.hideAvatar ?? false; });
  effectiveTextFormatters = computed((): CometChatTextFormatter[] | undefined => { if (this.textFormattersExplicitlySet()) return this._textFormatters(); return this.globalConfig?.textFormatters; });
  effectiveHideModerationView = computed(() => { if (this.hideModerationViewExplicitlySet()) return this._hideModerationView(); return false; });
  ngOnInit(): void {
    this.loggedInUser = CometChatUIKit.getLoggedInUser();
    this.detectMobileDevice();
    this.setupMobileResizeListener();
    this.bubbleConfigService.configChanged$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.cdr.markForCheck();
    });
  }
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['message']) { this.cdr.markForCheck(); }
  }
  ngAfterViewInit(): void { this.setupContentViewResizeObserver(); }
  ngOnDestroy(): void { this.clearHoverTimeout(); this.contentViewResizeObserver?.disconnect(); this.contentViewResizeObserver = null; }
  get messageId(): string | number { if (!this.message) return ''; return this.message.getId() || this.message.getMuid() || ''; }
  get messageType(): string { if (!this.message) return ''; return this.message.getType() || ''; }
  get messageCategory(): string { if (!this.message) return ''; return this.message.getCategory() || ''; }
  get bubbleClassName(): string { switch (this.alignment) { case MessageBubbleAlignment.left: return 'cometchat-message-bubble-incoming'; case MessageBubbleAlignment.right: return 'cometchat-message-bubble-outgoing'; case MessageBubbleAlignment.center: return 'cometchat-message-bubble-action'; default: return 'cometchat-message-bubble-outgoing'; } }
  get bubbleTypeClassName(): string {
    if (!this.message) return '';
    // Developer card type is arbitrary, so key the bubble-type class by
    // CATEGORY (not type_category) so the card gets the standard text-like container.
    if (this.messageCategory === CometChatUIKitConstants.MessageCategory.card) return 'cometchat-message-bubble__card-message';
    return BUBBLE_TYPE_MAP[`${this.messageType}_${this.messageCategory}`] || '';
  }
  /** A voice note is an audio message tagged with metadata.audioType (see isVoiceNote). */
  private isVoiceNoteMessage(): boolean {
    return isVoiceNote(this.message);
  }
  get contentType(): string { return this.getBubbleType(); }
  /** True for the multi-attachment per-type bubbles — used to force a consistent batch width. */
  get isBatchBubble(): boolean {
    const t = this.contentType;
    return t === 'images-batch' || t === 'videos-batch' || t === 'audios-batch' || t === 'files-batch';
  }
  getBubbleType(): string {
    if (!this.message) return 'unsupported';
    const category = this.messageCategory; const type = this.messageType;
    if (category === CometChatUIKitConstants.MessageCategory.call || category === 'call') return 'call';
    if (category === CometChatUIKitConstants.MessageCategory.action || category === 'action') return 'action';
    if (category === CometChatUIKitConstants.MessageCategory.message || category === 'message') { if (type === CometChatUIKitConstants.MessageTypes.image) return 'images-batch'; if (type === CometChatUIKitConstants.MessageTypes.video) return 'videos-batch'; if (type === CometChatUIKitConstants.MessageTypes.file) return 'files-batch'; if (type === CometChatUIKitConstants.MessageTypes.audio) return this.isVoiceNoteMessage() ? 'voice-note' : 'audios-batch'; return 'text'; }
    if (category === CometChatUIKitConstants.MessageCategory.custom || category === 'custom') { if (type === CometChatUIKitConstants.ExtensionTypes.poll) return 'poll'; if (type === CometChatUIKitConstants.ExtensionTypes.sticker) return 'sticker'; if (type === CometChatUIKitConstants.ExtensionTypes.document) return 'document'; if (type === CometChatUIKitConstants.ExtensionTypes.whiteboard) return 'whiteboard'; if (type === CometChatUIKitConstants.calls.meeting) return 'meeting'; }
    if (category === CometChatUIKitConstants.MessageCategory.card || category === 'card') return 'card';
    return CONTENT_TYPE_MAP[`${type}_${category}`] || 'unsupported';
  }
  get shouldShowLeadingView(): boolean { if (this.alignment === MessageBubbleAlignment.center) return false; if (this.effectiveHideAvatar()) return false; if (this.effectiveLeadingView) return true; return this.alignment === MessageBubbleAlignment.left; }
  get shouldShowHeaderView(): boolean { if (this.alignment === MessageBubbleAlignment.center) return false; if (this.hideSenderName) return false; if (this.effectiveHeaderView) return true; return this.alignment === MessageBubbleAlignment.left; }
  get shouldShowReplyView(): boolean { if (this.isDeleted) return false; if (this.messageCategory === CometChatUIKitConstants.MessageCategory.action) return false; return this.quotedMessage !== null; }
  get shouldShowStatusInfoView(): boolean {
    if (this.hideStatusInfoView) { return false; }
    if (this.alignment === MessageBubbleAlignment.center) { return false; }
    if (this.messageCategory === CometChatUIKitConstants.MessageCategory.action) { return false; }
    if (this.messageCategory === CometChatUIKitConstants.MessageCategory.call) { return false; }
    if (this.messageCategory == CometChatUIKitConstants.MessageCategory.custom && this.messageType == 'meeting') return false;
    return true;
  }
  get sender(): CometChat.User | null { if (!this.message) return null; return this.message.getSender() || this.loggedInUser || null; }
  get isOutgoing(): boolean { if (!this.message || !this.loggedInUser) return false; const sender = this.message.getSender(); if (!sender) return true; return sender.getUid() === this.loggedInUser.getUid(); }
  get isOutgoingStyle(): boolean { return this.alignment === MessageBubbleAlignment.right; }
  get isDeleted(): boolean { if (!this.message) return false; return !!this.message.getDeletedAt(); }
  get quotedMessage(): CometChat.BaseMessage | null {
    if (!this.message) return null;
    if (typeof (this.message as any).getQuotedMessage === 'function') {
      const quoted = (this.message as any).getQuotedMessage();
      if (!quoted) return null;
      // ENG-35031: The SDK may return a plain object without prototype methods when
      // the message is received from the server. Ensure it has the required methods.
      if (typeof quoted.getType !== 'function') {
        try {
          const type = quoted.type || quoted.messageType || 'text';
          const receiverId = quoted.receiverId || '';
          const receiverType = quoted.receiverType || 'user';
          // Use TextMessage as a universal wrapper since it has all the base methods
          const reconstructed = new CometChat.TextMessage(
            receiverId,
            type === 'text' ? (quoted.text || quoted.data?.text || '') : '',
            receiverType
          );
          if (quoted.id) reconstructed.setId(quoted.id);
          if (quoted.sentAt) reconstructed.setSentAt(quoted.sentAt);
          if (quoted.sender) {
            const sender = new CometChat.User({ uid: quoted.sender.uid || '', name: quoted.sender.name || '' });
            reconstructed.setSender(sender);
          }
          if (quoted.deletedAt) reconstructed.setDeletedAt(quoted.deletedAt);
          // Override getType to return the actual type
          (reconstructed as any)._originalType = type;
          const origGetType = reconstructed.getType.bind(reconstructed);
          (reconstructed as any).getType = () => (reconstructed as any)._originalType || origGetType();
          return reconstructed;
        } catch {
          return null;
        }
      }
      return quoted;
    }
    return null;
  }
  get isEdited(): boolean { if (!this.message) return false; return !!this.message.getEditedAt() && this.message.getType() == CometChatUIKitConstants.MessageTypes.text && this.message.getCategory() == CometChatUIKitConstants.MessageCategory.message; }
  get actionMessageText(): string {
    if (!this.message) { return ''; }
    const category = this.messageCategory;
    if (category === CometChatUIKitConstants.MessageCategory.call) { return this.getCallMessageText(); }
    if (category === CometChatUIKitConstants.MessageCategory.action) { return this.messageUtils.getActionMessage(this.message as CometChat.Action); }
    return '';
  }
  private getCallMessageText(): string {
    if (!this.message) return '';
    const callMessage = this.message as any; const callStatus = callMessage.getStatus?.() || callMessage.status || ''; const isSentByMe = this.isOutgoing;
    const L = CometChatLocalize.getLocalizedString.bind(CometChatLocalize);
    if (isSentByMe) { switch (callStatus) { case CometChatUIKitConstants.calls.initiated: return L('conversation_subtitle_outgoing_call'); case CometChatUIKitConstants.calls.cancelled: return L('conversation_subtitle_cancelled_call'); case CometChatUIKitConstants.calls.rejected: return L('conversation_subtitle_rejected_call'); case CometChatUIKitConstants.calls.busy: return L('conversation_subtitle_missed_call'); case CometChatUIKitConstants.calls.ended: return L('conversation_subtitle_ended_call'); case CometChatUIKitConstants.calls.ongoing: return L('conversation_subtitle_answered_call'); case CometChatUIKitConstants.calls.unanswered: return L('conversation_subtitle_unasnwered_call'); default: return L('conversation_subtitle_outgoing_call'); } }
    switch (callStatus) { case CometChatUIKitConstants.calls.initiated: return L('conversation_subtitle_incoming_call'); case CometChatUIKitConstants.calls.ongoing: return L('conversation_subtitle_answered_call'); case CometChatUIKitConstants.calls.ended: return L('conversation_subtitle_ended_call'); case CometChatUIKitConstants.calls.unanswered: case CometChatUIKitConstants.calls.cancelled: return L('conversation_subtitle_missed_call'); case CometChatUIKitConstants.calls.busy: return L('conversation_subtitle_busy_call'); case CometChatUIKitConstants.calls.rejected: return L('conversation_subtitle_rejected_call'); default: return L('conversation_subtitle_outgoing_call'); }
  }
  get callStatusClass(): string {
    if (!this.message || this.messageCategory !== CometChatUIKitConstants.MessageCategory.call) return '';
    const s = this.getCallMessageText(); const L = CometChatLocalize.getLocalizedString.bind(CometChatLocalize);
    if (s === L('conversation_subtitle_outgoing_call')) return 'cometchat-message-bubble__outgoing-call';
    if (s === L('conversation_subtitle_incoming_call')) return 'cometchat-message-bubble__incoming-call';
    if (s === L('conversation_subtitle_cancelled_call')) return 'cometchat-message-bubble__cancelled-call';
    if (s === L('conversation_subtitle_rejected_call')) return 'cometchat-message-bubble__rejected-call';
    if (s === L('conversation_subtitle_busy_call')) return 'cometchat-message-bubble__busy-call';
    if (s === L('conversation_subtitle_ended_call')) return 'cometchat-message-bubble__ended-call';
    if (s === L('conversation_subtitle_answered_call')) return 'cometchat-message-bubble__answered-call';
    if (s === L('conversation_subtitle_unasnwered_call')) return 'cometchat-message-bubble__unanswered-call';
    if (s === L('conversation_subtitle_missed_call')) return 'cometchat-message-bubble__missed-call';
    return '';
  }
  get callIconUrl(): string {
    if (!this.message || this.messageCategory !== CometChatUIKitConstants.MessageCategory.call) return '';
    const isVideo = this.messageType === CometChatUIKitConstants.MessageTypes.video; const s = this.getCallMessageText(); const L = CometChatLocalize.getLocalizedString.bind(CometChatLocalize);
    if (isVideo) { if (s === L('conversation_subtitle_outgoing_call')) return 'assets/outgoing_video_no_fill.svg'; if (s === L('conversation_subtitle_incoming_call')) return 'assets/incoming_video_no_fill.svg'; if (s === L('conversation_subtitle_missed_call')) return 'assets/missed_video_call_no_fill.svg'; if (s === L('conversation_subtitle_ended_call')) return 'assets/call_end_no_fill.svg'; return 'assets/video_call_button.svg'; }
    if (s === L('conversation_subtitle_outgoing_call')) return 'assets/phone_outgoing_no_fill.svg'; if (s === L('conversation_subtitle_incoming_call')) return 'assets/phone_incoming_no_fill.svg'; if (s === L('conversation_subtitle_missed_call')) return 'assets/phone_missed_no_fill.svg'; if (s === L('conversation_subtitle_ended_call')) return 'assets/call_end_no_fill.svg'; return 'assets/audio_call_button.svg';
  }
  get callIconErrorColor(): boolean {
    if (!this.message || this.messageCategory !== CometChatUIKitConstants.MessageCategory.call) { return false; }
    const callMessage = this.message as any;
    const callStatus = callMessage.getStatus?.() || callMessage.status || '';
    return (
      callStatus === CometChatUIKitConstants.calls.unanswered ||
      callStatus === CometChatUIKitConstants.calls.cancelled ||
      callStatus === CometChatUIKitConstants.calls.ended ||
      callStatus === CometChatUIKitConstants.calls.busy ||
      callStatus === CometChatUIKitConstants.calls.rejected
    );
  }
  get contextMenuPlacement(): Placement {
    if (this.alignment === MessageBubbleAlignment.left) { return Placement.right; }
    return Placement.left;
  }
  get effectiveQuickOptionsCount(): number {
    return this.quickOptionsCount;
  }
  get distributedOptions(): {
    quickOptions: (CometChatActionsIcon | CometChatActionsView)[];
    overflowOptions: (CometChatActionsIcon | CometChatActionsView)[];
  } {
    return this.messageUtils.distributeMessageOptions(
      this.options,
      this.effectiveQuickOptionsCount
    );
  }
  get optionsPositionClass(): string {
    return this.messageUtils.getOptionsPositionClass(this.alignment);
  }
  get receiptClass(): string { if (!this.message) return ''; const r = this.message.getReadAt(); const d = this.message.getDeliveredAt(); const s = this.message.getSentAt(); if (r) return 'cometchat-receipts-read'; if (d) return 'cometchat-receipts-delivered'; if (s && this.message.getId()) return 'cometchat-receipts-sent'; return 'cometchat-receipts-wait'; }
  get receiptAriaLabel(): string { if (!this.message) return ''; const r = this.message.getReadAt(); const d = this.message.getDeliveredAt(); const s = this.message.getSentAt(); if (r) return CometChatLocalize.getLocalizedString('message_status_read'); if (d) return CometChatLocalize.getLocalizedString('message_status_delivered'); if (s) return CometChatLocalize.getLocalizedString('message_status_sent'); return CometChatLocalize.getLocalizedString('message_status_sending'); }
  get calendarObject(): CalendarObject { return this.dateFormat || { today: 'hh:mm A', yesterday: 'hh:mm A', otherDays: 'hh:mm A' }; }
  get replyCount(): number { if (!this.message) return 0; return this.message.getReplyCount() || 0; }
  get unreadReplyCount(): number { if (!this.message) return 0; return this.message.getUnreadRepliesCount() || 0; }
  get shouldShowThreadView(): boolean { if (this.hideThreadView) return false; if (this.isDeleted) return false; if (this.messageCategory === CometChatUIKitConstants.MessageCategory.action) return false; return this.replyCount > 0; }
  get reactions(): CometChat.ReactionCount[] { if (!this.message) return []; return this.message.getReactions() || []; }
  get hasReactions(): boolean { return this.reactions.length > 0; }
  get shouldShowReactions(): boolean { if (this.isDeleted) return false; if (this.messageCategory === CometChatUIKitConstants.MessageCategory.action) return false; return this.hasReactions; }
  get moderationStatus(): string { if (!this.message) return CometChatUIKitConstants.moderationStatus.unmoderated; if (typeof (this.message as any).getModerationStatus === 'function') return (this.message as any).getModerationStatus() || CometChatUIKitConstants.moderationStatus.unmoderated; return CometChatUIKitConstants.moderationStatus.unmoderated; }
  get isPendingModeration(): boolean { return this.moderationStatus === CometChatUIKitConstants.moderationStatus.pending; }
  get isDisapprovedByModeration(): boolean { return this.moderationStatus === CometChatUIKitConstants.moderationStatus.disapproved; }
  // Only the sender sees the moderation notice — a disapproved message is invisible to everyone else,
  // so showing "your message was blocked" to a viewer would be wrong. Mirrors the React kit's
  // getIsMessageModerated (`loggedInUser === sender`); isOutgoing treats a not-yet-sent (senderless)
  // message as mine too.
  get shouldShowModerationIndicator(): boolean { if (this.effectiveHideModerationView()) return false; if (this.isDeleted) return false; if (this.messageCategory === CometChatUIKitConstants.MessageCategory.action) return false; if (!this.isOutgoing) return false; return this.isDisapprovedByModeration; }
  /** SDK error on the message — either set directly on it or stashed in its metadata. */
  private get messageError(): { code?: string } | null { const m = this.message as any; if (!m) return null; return m.error || m.getMetadata?.()?.error || null; }
  /** Any send/processing error — drives the error receipt tick (see {@link showErrorReceipt}). */
  get hasMessageError(): boolean { return !!this.messageError; }
  // A message the server refused on policy grounds (e.g. a disallowed attachment type) carries
  // ERR_PERMISSION_DENIED. Sender-only, and a message rejected before reaching the server has no
  // sender yet — so a missing sender counts as mine. Mirrors React's getIsPermissionDeniedError.
  get isPermissionDeniedError(): boolean { if (!this.message) return false; if (this.messageError?.code !== 'ERR_PERMISSION_DENIED') return false; return this.isOutgoing; }
  get shouldShowPermissionDeniedIndicator(): boolean { if (this.isDeleted) return false; if (this.messageCategory === CometChatUIKitConstants.MessageCategory.action) return false; return this.isPermissionDeniedError; }
  /**
   * True when EITHER block notice (moderation-disapproved or permission-denied) is showing. Both
   * render the same footer banner, so the body must get the same treatment for both: square off the
   * bottom corners and drop the batch media-padding, so the banner reads as the bubble's rounded
   * bottom instead of a detached card floating over a strip of bubble background.
   */
  get shouldShowBlockNotice(): boolean { return this.shouldShowModerationIndicator || this.shouldShowPermissionDeniedIndicator; }
  /** Localization key for whichever block notice is showing (moderation takes precedence). */
  get moderationIndicatorTextKey(): string { return this.shouldShowModerationIndicator ? 'moderation_block_message' : 'file_type_not_allowed'; }
  // Besides the explicit `showError` input, a disapproved message or one carrying a send error flips
  // the sender's receipt to the error tick — matching React's MessageReceiptUtils.getReceiptStatus.
  get showErrorReceipt(): boolean { if (this.showError) return true; return this.isOutgoing && (this.isDisapprovedByModeration || this.hasMessageError); }
  moderationIndicatorWidth = computed(() => { const w = this.contentViewWidth(); return w >= 240 ? `calc(${w}px + var(--cometchat-padding-1) * 2)` : '240px'; });

  get messageTypeKey(): string { if (!this.message) return ''; return `${this.messageType}_${this.messageCategory}`; }
  get effectiveLeadingView(): TemplateRef<any> | null { return this.getEffectiveView('leadingView', this.leadingView); }
  get effectiveHeaderView(): TemplateRef<any> | null { return this.getEffectiveView('headerView', this.headerView); }
  get effectiveReplyView(): TemplateRef<any> | null { return this.getEffectiveView('replyView', this.replyView); }
  get effectiveContentView(): TemplateRef<any> | null { return this.getEffectiveView('contentView', this.contentView); }
  get effectiveBottomView(): TemplateRef<any> | null { return this.getEffectiveView('bottomView', this.bottomView); }
  get effectiveFooterView(): TemplateRef<any> | null { return this.getEffectiveView('footerView', this.footerView); }
  get effectiveStatusInfoView(): TemplateRef<any> | null { return this.getEffectiveView('statusInfoView', this.statusInfoView); }
  get effectiveThreadView(): TemplateRef<any> | null { return this.getEffectiveView('threadView', this.threadView); }
  get effectiveBubbleView(): TemplateRef<any> | null { return this.getEffectiveView('bubbleView', this.bubbleView); }
  private getEffectiveView(part: BubblePart, inputView: TemplateRef<any> | null): TemplateRef<any> | null { if (inputView) return inputView; const sv = this.bubbleConfigService.getView(this.messageTypeKey, part); return sv || null; }
  onMouseEnter(): void { this.clearHoverTimeout(); this.isHovering = true; this.cdr.markForCheck(); }
  onMouseLeave(): void { this.clearHoverTimeout(); this.hoverTimeoutRef = setTimeout(() => { this.isHovering = false; this.cdr.markForCheck(); }, 150); }
  onBodyClick(): void {
    if (this.isMobile) { this.isHovering = !this.isHovering; this.cdr.markForCheck(); }
  }
  onOptionClick(option: ContextMenuItem): void { this.isHovering = false; this.cdr.markForCheck(); this.optionClick.emit(option); this.restoreFocusToBubble(); }
  onReplyPreviewClick(event?: MouseEvent): void {
    if (event) { event.stopPropagation(); }
    if (this.quotedMessage) { this.replyPreviewClick.emit(this.quotedMessage); }
  }
  onReplyPreviewKeyDown(event: KeyboardEvent): void { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); event.stopPropagation(); if (this.quotedMessage) this.replyPreviewClick.emit(this.quotedMessage); } }
  onAvatarClick(): void {
    if (this.sender) { this.avatarClick.emit(this.sender); }
  }
  onThreadClick(): void { this.threadRepliesClick.emit(this.message); }
  onReactionClick(reaction: CometChat.ReactionCount): void { this.reactionClick.emit({ reaction, message: this.message }); }
  onReactionListItemClick(event: { reaction: CometChat.Reaction; message: CometChat.BaseMessage }): void { this.reactionListItemClick.emit(event); }
  private detectMobileDevice(): void { this.isMobile = window.innerWidth <= 768; }
  private setupMobileResizeListener(): void {
    const handler = () => {
      const wasMobile = this.isMobile;
      this.isMobile = window.innerWidth <= 768;
      if (wasMobile !== this.isMobile) { this.cdr.markForCheck(); }
    };
    window.addEventListener('resize', handler);
    this.destroyRef.onDestroy(() => window.removeEventListener('resize', handler));
  }
  private clearHoverTimeout(): void {
    if (this.hoverTimeoutRef) { clearTimeout(this.hoverTimeoutRef); this.hoverTimeoutRef = null; }
  }
  private setupContentViewResizeObserver(): void {
    if (!this.contentViewRef?.nativeElement) return;
    const el = this.contentViewRef.nativeElement;
    let destroyed = false;
    this.destroyRef.onDestroy(() => { destroyed = true; });
    this.contentViewResizeObserver = new ResizeObserver(entries => {
      if (destroyed) return;
      for (const e of entries) { const w = e.contentRect.width; if (this.contentViewWidth() !== w) this.contentViewWidth.set(w); }
    });
    this.contentViewResizeObserver.observe(el); this.contentViewWidth.set(el.offsetWidth);
  }
  get accessibleLabel(): string {
    const parts: string[] = [this.sender?.getName() || CometChatLocalize.getLocalizedString('accessibility_unknown_sender')];
    const typeKey = `accessibility_message_type_${this.messageType}`; const typeLabel = CometChatLocalize.getLocalizedString(typeKey);
    parts.push(typeLabel || CometChatLocalize.getLocalizedString('accessibility_message_type_custom'));
    const preview = this.getContentPreview(); if (preview) parts.push(preview);
    const timestamp = this.getFormattedTimestamp(); if (timestamp) parts.push(timestamp);
    if (this.hasReactions) { const rs = this.getReactionsSummary(); if (rs) parts.push(rs); }
    if (this.isEdited) parts.push(CometChatLocalize.getLocalizedString('accessibility_message_edited'));
    return parts.join(', ');
  }
  getAriaLabel(): string {
    if (this.isDeleted) { const sn = this.sender?.getName() || CometChatLocalize.getLocalizedString('accessibility_unknown_sender'); return CometChatLocalize.getLocalizedString('accessibility_message_deleted_from').replace('{sender}', sn); }
    return this.accessibleLabel;
  }
  private getContentPreview(): string {
    if (this.isDeleted) return '';
    switch (this.messageType) {
      case 'text': { const tm = this.message as CometChat.TextMessage; return this.truncateText(tm.getText?.() || '', 100); }
      case 'image': return CometChatLocalize.getLocalizedString('accessibility_image_message');
      case 'video': return CometChatLocalize.getLocalizedString('accessibility_video_message');
      case 'audio': return CometChatLocalize.getLocalizedString('accessibility_audio_message');
      case 'file': { const fm = this.message as CometChat.MediaMessage; return fm.getAttachment?.()?.getName?.() || CometChatLocalize.getLocalizedString('accessibility_file_message'); }
      default: if (this.messageType === CometChatUIKitConstants.ExtensionTypes.poll) { const cd = (this.message as any).getCustomData?.(); return cd?.question || CometChatLocalize.getLocalizedString('accessibility_poll_message'); } return '';
    }
  }
  private truncateText(text: string, maxLength: number): string {
    if (!text || text.length <= maxLength) { return text; }
    return text.substring(0, maxLength).trim() + '...';
  }
  private getFormattedTimestamp(): string {
    if (!this.message) { return ''; }
    const sentAt = this.message.getSentAt();
    if (!sentAt) { return ''; }
    const timestamp = sentAt > 9999999999 ? sentAt : sentAt * 1000;
    return this.datePipe.transform(timestamp, 'short') || '';
  }
  private getReactionsSummary(): string { const reactions = this.reactions; if (!reactions?.length) return ''; const totalCount = reactions.reduce((sum, r) => sum + (r.getCount?.() || 0), 0); if (totalCount === 1) return CometChatLocalize.getLocalizedString('accessibility_one_reaction'); return CometChatLocalize.getLocalizedString('accessibility_reactions_count').replace('{count}', totalCount.toString()); }
  private getMessageTypeLabel(): string { switch (this.messageType) { case 'text': return CometChatLocalize.getLocalizedString('accessibility_message_type_text'); case 'image': return CometChatLocalize.getLocalizedString('accessibility_message_type_image'); case 'video': return CometChatLocalize.getLocalizedString('accessibility_message_type_video'); case 'audio': return CometChatLocalize.getLocalizedString('accessibility_message_type_audio'); case 'file': return CometChatLocalize.getLocalizedString('accessibility_message_type_file'); default: return CometChatLocalize.getLocalizedString('accessibility_message_type_custom'); } }
  get isMediaMessage(): boolean {
    return ['audio', 'video', 'image'].includes(this.messageType);
  }
  onKeyDown(event: KeyboardEvent): void {
    if (this.disableInteraction) { if (event.key === ' ' && this.isMediaMessage) { event.preventDefault(); this.mediaToggle.emit(this.message); } return; }
    switch (event.key) {
      case 'Enter': event.preventDefault(); this.openMessageActions(); break;
      case ' ': event.preventDefault(); if (this.isMediaMessage) { this.mediaToggle.emit(this.message); } else if (this.options.length > 0) { this.isHovering = !this.isHovering; this.cdr.markForCheck(); } break;
      case 'F10': if (event.shiftKey) { event.preventDefault(); this.openMessageActions(); } break;
      case 'ContextMenu': event.preventDefault(); this.openMessageActions(); break;
      case 'Escape': if (this.isHovering) { event.preventDefault(); event.stopPropagation(); this.isHovering = false; this.cdr.markForCheck(); this.restoreFocusToBubble(); } break;
    }
  }
  private openMessageActions(): void {
    if (this.options.length > 0) { this.isHovering = true; this.cdr.markForCheck(); this.messageActionsOpen.emit(this.message); }
  }
  private restoreFocusToBubble(): void {
    setTimeout(() => {
      if (this.bubbleWrapperRef?.nativeElement) { this.bubbleWrapperRef.nativeElement.focus(); }
    }, 0);
  }
  getDocumentUrl(): string {
    if (!this.message) return '';
    try { const m = (this.message as any).getMetadata?.() as Record<string, any> | null; if (!m) return ''; const inj = m['@injected']; if (inj?.['extensions']?.['document']?.['document_url']) return inj['extensions']['document']['document_url']; if (m['data']?.['document_url']) return m['data']['document_url']; const cd = (this.message as any).getCustomData?.(); if (cd?.['document_url']) return cd['document_url']; return ''; }
    catch (error) { CometChatLogger.warn('CometChatMessageBubble', 'Error extracting document URL:', error); return ''; }
  }
  getWhiteboardUrl(): string {
    if (!this.message) return '';
    try { const m = (this.message as any).getMetadata?.() as Record<string, any> | null; if (!m) return ''; const inj = m['@injected']; if (inj?.['extensions']?.['whiteboard']?.['board_url']) return inj['extensions']['whiteboard']['board_url']; if (m['data']?.['board_url']) return m['data']['board_url']; const cd = (this.message as any).getCustomData?.(); if (cd?.['board_url']) return cd['board_url']; return ''; }
    catch (error) { CometChatLogger.warn('CometChatMessageBubble', 'Error extracting whiteboard URL:', error); return ''; }
  }
  getCallButtonText(): string {
    if (!this.message) { return ''; }
    const callMessage = this.message as any;
    const callStatus = callMessage.getStatus?.() || '';
    if (callStatus === CometChatUIKitConstants.calls.ongoing || callStatus === CometChatUIKitConstants.calls.initiated) return CometChatLocalize.getLocalizedString('message_list_join_call');
    if (callStatus === CometChatUIKitConstants.calls.ended) { return CometChatLocalize.getLocalizedString('message_list_join_call'); }
    return '';
  }
  onCallBubbleJoinClick(event: CallButtonClickEvent): void {
    const msg = event.message as any; const sessionId = event.sessionId || msg?.getCustomData?.()?.sessionID || msg?.getCustomData?.()?.sessionId || msg?.getSessionId?.() || '';
    const callType = msg?.getCustomData?.()?.callType || msg?.getType?.(); const isAudioOnly = callType === CometChatUIKitConstants.MessageTypes.audio;
    if (sessionId) this.callButtonsService.joinMeeting(sessionId, isAudioOnly);
  }
}
