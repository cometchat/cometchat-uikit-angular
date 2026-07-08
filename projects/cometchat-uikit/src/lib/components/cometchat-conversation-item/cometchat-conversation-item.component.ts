

import {Component, Input, Output, EventEmitter, TemplateRef, OnInit, OnDestroy, inject, computed, signal, booleanAttribute, ChangeDetectionStrategy} from '@angular/core';
import {CommonModule} from '@angular/common';
import {CometChat} from '@cometchat/chat-sdk-javascript';
import {CometChatLocalize} from '../../resources/CometChatLocalize/cometchat-localize';
import {COMETCHAT_GLOBAL_CONFIG, GlobalConfig} from '../../services/global-config.service';

import {CometChatAvatarComponent} from '../base-elements/cometchat-avatar/cometchat-avatar.component';
import {CometChatDateComponent} from '../base-elements/cometchat-date/cometchat-date.component';
import {CometChatContextMenuComponent} from '../base-elements/cometchat-context-menu/cometchat-context-menu.component';
import {TranslatePipe} from '../../resources/CometChatLocalize/translate.pipe';
import {ConversationSlots, ConversationSlotContext,} from '../../interfaces/conversation-slots.interface';
import {CalendarObject} from '../../resources/CometChatLocalize/localization.interfaces';
import {CometChatOption} from '../../modals/CometChatOption';
import {Placement} from '../../Enums/Enums';
import {CometChatMentionsFormatter} from '../../formatters/cometchat-mentions-formatter';
import {CometChatTextFormatter} from '../../formatters/cometchat-text-formatter';
import {FormatterConfigService} from '../../services/formatter-config.service';
import {HtmlSanitizerService} from '../../services/html-sanitizer.service';
import {ConversationSubtitleService} from '../../services/conversation-subtitle.service';
import {stripRichTextFormatting} from '../../utils/util';
import {CometChatUIKitConstants} from '../../constants';
import {getConversationAvatarImage, getConversationAvatarName, getConversationUserStatus, getConversationGroupType, getReceiptStatus, isURL, hasMarkdownLink, getConversationAccessibleLabel,} from './cometchat-conversation-item.utils';
import {CometChatLogger} from '../../utils/CometChatLogger';
import {convertMarkdownToHtml} from '../cometchat-text-bubble/cometchat-text-bubble.utils';
import {getAgentMessageSubtitleText} from '../../utils/agent-message-utils';

@Component({
  selector: 'cometchat-conversation-item',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, CometChatAvatarComponent, CometChatDateComponent, CometChatContextMenuComponent, TranslatePipe],
  templateUrl: './cometchat-conversation-item.component.html',
  styleUrls: ['./cometchat-conversation-item.component.css'],
})
export class CometChatConversationItemComponent implements OnInit, OnDestroy {
  private globalConfig: Partial<GlobalConfig> | null = inject(COMETCHAT_GLOBAL_CONFIG, { optional: true });

  private subtitleService = inject(ConversationSubtitleService);
  @Input({ required: true }) conversation!: CometChat.Conversation;
  @Input() isActive = false;
  @Input() isSelected = false;
  @Input() isFocused = false;
  @Input() tabIndex = -1;
  @Input() typingIndicator: CometChat.TypingIndicator | null = null;
  @Input() loggedInUser: CometChat.User | null = null;

  private hideReceiptsExplicitlySet = signal(false); private hideUserStatusExplicitlySet = signal(false); private hideGroupTypeExplicitlySet = signal(false);
  private disableDefaultContextMenuExplicitlySet = signal(false); private textFormattersExplicitlySet = signal(false);
  private _hideReceipts = signal(false); private _hideUserStatus = signal(false); private _hideGroupType = signal(false);
  private _disableDefaultContextMenu = signal(true); private _textFormatters = signal<CometChatTextFormatter[]>([]);
  @Input({ transform: booleanAttribute })
  set hideReceipts(value: boolean) { this._hideReceipts.set(value); this.hideReceiptsExplicitlySet.set(true); }
  get hideReceipts(): boolean { return this._hideReceipts(); }
  @Input({ transform: booleanAttribute })
  set hideUserStatus(value: boolean) { this._hideUserStatus.set(value); this.hideUserStatusExplicitlySet.set(true); }
  get hideUserStatus(): boolean { return this._hideUserStatus(); }
  @Input({ transform: booleanAttribute })
  set hideGroupType(value: boolean) { this._hideGroupType.set(value); this.hideGroupTypeExplicitlySet.set(true); }
  get hideGroupType(): boolean { return this._hideGroupType(); }
  @Input() dateFormat?: CalendarObject;
  @Input({ transform: booleanAttribute })
  set disableDefaultContextMenu(value: boolean) { this._disableDefaultContextMenu.set(value); this.disableDefaultContextMenuExplicitlySet.set(true); }
  get disableDefaultContextMenu(): boolean { return this._disableDefaultContextMenu(); }
  @Input()
  set textFormatters(value: CometChatTextFormatter[]) { this._textFormatters.set(value); this.textFormattersExplicitlySet.set(true); }
  get textFormatters(): CometChatTextFormatter[] { return this._textFormatters(); }
  effectiveHideReceipts = computed(() => { if (this.hideReceiptsExplicitlySet()) return this._hideReceipts(); return this.globalConfig?.hideReceipts ?? false; });
  effectiveHideUserStatus = computed(() => { if (this.hideUserStatusExplicitlySet()) return this._hideUserStatus(); return this.globalConfig?.hideUserStatus ?? false; });
  effectiveHideGroupType = computed(() => { if (this.hideGroupTypeExplicitlySet()) return this._hideGroupType(); return this.globalConfig?.hideGroupType ?? false; });

  effectiveDisableDefaultContextMenu = computed(() => { if (this.disableDefaultContextMenuExplicitlySet()) return this._disableDefaultContextMenu(); return this.globalConfig?.disableDefaultContextMenu ?? true; });

  effectiveTextFormatters = computed(() => { if (this.textFormattersExplicitlySet()) return this._textFormatters(); return this.globalConfig?.textFormatters ?? []; });
  @Input() slots?: Partial<ConversationSlots>;
  @Input() contextMenuOptions?: CometChatOption[];
  @Input() leadingView?: TemplateRef<{ $implicit: CometChat.Conversation }>;
  @Input() titleView?: TemplateRef<{ $implicit: CometChat.Conversation }>;
  @Input() subtitleView?: TemplateRef<{ $implicit: CometChat.Conversation }>;
  @Input() trailingView?: TemplateRef<{ $implicit: CometChat.Conversation }>;
  @Output() itemClick = new EventEmitter<CometChat.Conversation>();
  @Output() itemSelect = new EventEmitter<{
    conversation: CometChat.Conversation;
    selected: boolean;
  }>();
  @Output() avatarClick = new EventEmitter<CometChat.Conversation>();
  @Output() titleClick = new EventEmitter<CometChat.Conversation>();
  @Output() subtitleClick = new EventEmitter<CometChat.Conversation>();
  @Output() timestampClick = new EventEmitter<CometChat.Conversation>();
  @Output() badgeClick = new EventEmitter<CometChat.Conversation>();
  @Output() contextMenuOpen = new EventEmitter<CometChat.Conversation>();
  @Output() contextMenuOptionClick = new EventEmitter<{
    option: CometChatOption;
    conversation: CometChat.Conversation;
  }>();
  @Output() contextMenuKeyboardOpen = new EventEmitter<CometChat.Conversation>();

  readonly Placement = Placement;

  isHovered = false;

  constructor(
    private formatterConfig: FormatterConfigService,
    private htmlSanitizer: HtmlSanitizerService
  ) {}
  async ngOnInit(): Promise<void> {
    if (!this.loggedInUser) {
      try {
        this.loggedInUser = await CometChat.getLoggedinUser();
      } catch (error) {
        CometChatLogger.error('CometChatConversationItem', 'Error getting logged-in user:', error);
      }
    }
  }
  ngOnDestroy(): void {
  }
  get conversationWith(): CometChat.User | CometChat.Group | null {
    try { return this.conversation?.getConversationWith() || null; }
    catch { return null; }
  }
  get isUserConversation(): boolean {
    return this.conversationWith instanceof CometChat.User;
  }
  get isGroupConversation(): boolean {
    return this.conversationWith instanceof CometChat.Group;
  }
  get isAgentConversation(): boolean {
    if (!(this.conversationWith instanceof CometChat.User)) return false;
    return typeof this.conversationWith.getRole === 'function' && this.conversationWith.getRole() === '@agentic';
  }
  get avatarImage(): string {
    return getConversationAvatarImage(this.conversationWith);
  }
  get avatarName(): string {
    return getConversationAvatarName(this.conversationWith);
  }
  get userStatus(): string {
    return getConversationUserStatus(this.conversationWith);
  }
  get groupType(): string {
    return getConversationGroupType(this.conversationWith);
  }
  get unreadCount(): number {
    if (this.isAgentConversation) return 0;
    return this.conversation.getUnreadMessageCount() || 0;
  }
  get lastMessage(): CometChat.BaseMessage | undefined {
    return this.conversation.getLastMessage();
  }
  get lastMessageTimestamp(): number {
    return this.lastMessage?.getSentAt() || 0;
  }
  get isTyping(): boolean {
    return this.typingIndicator !== null;
  }
  get isLastMessageByMe(): boolean {
    if (!this.lastMessage || !this.loggedInUser) return false;
    return this.lastMessage.getSender()?.getUid() === this.loggedInUser.getUid();
  }
  get hasLastMessage(): boolean {
    return !!this.lastMessage;
  }
  get receiptStatus(): 'wait' | 'sent' | 'delivered' | 'read' | null {
    if (this.isAgentConversation) return null;
    return getReceiptStatus(this.lastMessage, this.isLastMessageByMe);
  }
  get subtitleText(): string {
    // Agent chat: always show "click to start conversation" regardless of last message
    if (this.isAgentConversation) {
      return CometChatLocalize.getLocalizedString('conversation_start');
    }
    if (!this.lastMessage) { return CometChatLocalize.getLocalizedString('conversation_start'); }
    const typeKey = `${this.lastMessage.getType()}_${this.lastMessage.getCategory()}`; const customSubtitle = this.subtitleService.getSubtitle(typeKey, this.lastMessage); if (customSubtitle !== null) return customSubtitle;
    if (this.lastMessage.getDeletedAt()) { return CometChatLocalize.getLocalizedString('conversation_subtitle_deleted_message'); }
    const messageType = this.lastMessage.getType(); const messageCategory = this.lastMessage.getCategory();
    if (messageCategory === 'action') { return this.getActionMessageText(); }
    if (messageCategory === 'call') { return this.getCallMessageText(); }
    if (messageCategory === 'custom' && messageType === 'meeting') { return this.getMeetingMessageText(); }
    // Developer card (category "card", arbitrary type): getText() else "Card Message".
    if (messageCategory === CometChatUIKitConstants.MessageCategory.card) { return (this.lastMessage as CometChat.CardMessage).getText() || CometChatLocalize.getLocalizedString('card_message'); }
    if (messageCategory === CometChatUIKitConstants.MessageCategory.agentic) {
      return getAgentMessageSubtitleText(this.lastMessage) || CometChatLocalize.getLocalizedString('conversation_subtitle_ai_response');
    }
    switch (messageType) {
      case 'text': { const tm = this.lastMessage as CometChat.TextMessage; const rt = tm.getText() || ''; if (this.hasMarkdownLink(rt)) return rt.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'); if (this.isURL(rt)) return rt; return this.formatLastMessageSubtitle(); }
      case 'image': return CometChatLocalize.getLocalizedString('conversation_subtitle_image');
      case 'video': return CometChatLocalize.getLocalizedString('conversation_subtitle_video');
      case 'audio': return CometChatLocalize.getLocalizedString('conversation_subtitle_audio');
      case 'file': return CometChatLocalize.getLocalizedString('conversation_subtitle_file');
      case 'extension_poll': return CometChatLocalize.getLocalizedString('conversation_subtitle_poll');
      case 'extension_sticker': return CometChatLocalize.getLocalizedString('conversation_subtitle_sticker');
      case 'extension_document': return CometChatLocalize.getLocalizedString('conversation_subtitle_collaborative_document');
      case 'extension_whiteboard': return CometChatLocalize.getLocalizedString('conversation_subtitle_collaborative_whiteboard');
      default: if (messageCategory === 'custom') return this.getCustomMessageText() || messageType; return messageType;
    }
  }
  get subtitleIconName(): string {
    if (!this.lastMessage) { return 'none'; }
    const typeKey = `${this.lastMessage.getType()}_${this.lastMessage.getCategory()}`; const iconOverride = this.subtitleService.getIconOverride(typeKey); if (iconOverride !== null) return iconOverride;
    if (this.lastMessage.getDeletedAt()) { return 'deleted'; }
    const messageType = this.lastMessage.getType(); const messageCategory = this.lastMessage.getCategory();
    if (messageCategory === 'action') { return 'none'; }
    if (messageCategory === 'call') { return this.getCallIconName(); }
    if (messageCategory === 'interactive') { return 'none'; }
    if (messageCategory === CometChatUIKitConstants.MessageCategory.agentic) { return 'none'; }
    if (messageCategory === 'custom' && messageType === 'meeting') { return this.getMeetingIconName(); }
    switch (messageType) {
      case 'text': { const tm = this.lastMessage as CometChat.TextMessage; const t = tm.getText() || ''; return (this.isURL(t) || this.hasMarkdownLink(t)) ? 'link' : 'none'; }
      case 'image': return 'image';
      case 'video': return 'video';
      case 'audio': return 'audio';
      case 'file': return 'file';
      case 'extension_poll': return 'poll';
      case 'extension_sticker': return 'sticker';
      case 'extension_document': return 'collaborative-document';
      case 'extension_whiteboard': return 'collaborative-whiteboard';
      default: return 'unsupported';
    }
  }
  private getCallIconName(): string {
    const call = this.lastMessage as CometChat.Call;
    const callType = call.getType?.() || '';
    const isMissed = this.isMissedCall(call);
    if (isMissed) {
      return callType === CometChatUIKitConstants.MessageTypes.audio
        ? 'incoming-audio-call'
        : 'incoming-video-call';
    }
    return callType === CometChatUIKitConstants.MessageTypes.audio
      ? 'outgoing-audio-call'
      : 'outgoing-video-call';
  }
  private isMissedCall(call: CometChat.Call): boolean {
    const callStatus = call.getStatus?.() || ''; let initiatorUid = '';
    try { initiatorUid = call.getCallInitiator?.()?.getUid?.() || ''; } catch { try { initiatorUid = (call as any).getInitiator?.()?.getUid?.() || ''; } catch {} }
    if (!initiatorUid || initiatorUid === this.loggedInUser?.getUid()) return false;
    return [CometChatUIKitConstants.calls.unanswered, CometChatUIKitConstants.calls.cancelled, CometChatUIKitConstants.calls.busy, CometChatUIKitConstants.calls.rejected].includes(callStatus);
  }
  private getMeetingIconName(): string { try { const cm = this.lastMessage as CometChat.CustomMessage; const cd = cm.getCustomData?.() as Record<string, any> | undefined; const ct = cd?.['callType'] || ''; return ct === CometChatUIKitConstants.MessageTypes.audio ? 'meeting-audio-call' : 'meeting-video-call'; } catch { return 'meeting-video-call'; } }
  private isURL(text: string): boolean { return isURL(text); }
  private hasMarkdownLink(text: string): boolean { return hasMarkdownLink(text); }
  private formatLastMessageSubtitle(): string {
    const textMessage = this.lastMessage as CometChat.TextMessage; const rawText = textMessage.getText() || ''; const mentionedUsers = textMessage.getMentionedUsers() || [];
    if (!rawText) {
      // Fallback: no text — try metadata as last resort
      try {
        const metadata = textMessage.getMetadata?.() as Record<string, any> | undefined;
        const richText = metadata?.['richText'] as { html?: string; hasFormatting?: boolean } | undefined;
        if (richText?.html && richText?.hasFormatting) { const sanitized = this.sanitizeSubtitleHtml(richText.html); if (sanitized) return sanitized; }
      } catch {}
      return '';
    }
    if (/(\*\*|(?<!\*)\*(?!\*|\s)|__|~~|`|_(?=[^\s_])|^>\s.+|^&gt;\s.+|^ *[-*]\s|^ *\d+\.\s)/m.test(rawText) || this.hasMarkdownLink(rawText)) { const escaped = this.htmlSanitizer.escapeUserHtml(rawText); const formatters = this.getFormattersForSubtitle(); let formattedText = escaped;
      for (const formatter of formatters) { try { if (formatter instanceof CometChatMentionsFormatter) { if (this.hasSdkMentionTags(rawText) && formatter.shouldFormat(formattedText, this.lastMessage)) { formattedText = formatter.formatSdkMentions(formattedText, mentionedUsers); }
          } else if (formatter.id !== 'tiptap-formatter') { if (formatter.shouldFormat(formattedText, this.lastMessage)) { formattedText = formatter.format(formattedText); }
          } } catch {} }
      return this.sanitizeSubtitleHtml(formattedText); }
    const plainText = stripRichTextFormatting(rawText); const formatters = this.getFormattersForSubtitle();
    if (!formatters || formatters.length === 0) { return this.formatPlainMentions(plainText, mentionedUsers); }
    const hasSdkMentions = this.hasSdkMentionTags(plainText); const hasCustomFormatters = formatters.some(f => !(f instanceof CometChatMentionsFormatter) && f.id !== 'tiptap-formatter');
    if (!hasSdkMentions && !hasCustomFormatters) { return plainText; }
    const hasMentionsFormatter = formatters.some(f => f instanceof CometChatMentionsFormatter); if (!hasMentionsFormatter && !hasCustomFormatters) { return this.formatPlainMentions(plainText, mentionedUsers); }
    const escapedText = this.htmlSanitizer.escapeUserHtml(plainText); let formattedText = escapedText;
    for (const formatter of formatters) { try { if (formatter instanceof CometChatMentionsFormatter) { if (hasSdkMentions && formatter.shouldFormat(formattedText, this.lastMessage)) { formattedText = formatter.formatSdkMentions(formattedText, mentionedUsers); }
        } else if (formatter.id !== 'tiptap-formatter') { if (formatter.shouldFormat(formattedText, this.lastMessage)) { formattedText = formatter.format(formattedText); }
        } } catch (error) { CometChatLogger.error('CometChatConversationItem', 'Formatter error:', error); } }
    return this.sanitizeSubtitleHtml(formattedText);
  }
  private getFormattersForSubtitle(): CometChatTextFormatter[] {
    const effectiveFormatters = this.effectiveTextFormatters();
    const formatters =
      effectiveFormatters.length > 0
        ? effectiveFormatters
        : this.formatterConfig.getDefaultFormatters();
    return formatters.map(formatter => {
      if (formatter instanceof CometChatMentionsFormatter) { const cloned = new CometChatMentionsFormatter(); cloned.setLoggedInUser(this.loggedInUser); return cloned; }
      return formatter;
    });
  }
  private hasSdkMentionTags(text: string): boolean {
    if (!text) return false;
    return /<@uid:[^>]+>/.test(text) || /<@all:[^>]+>/.test(text);
  }
  get subtitleHasHtml(): boolean {
    if (!this.lastMessage || this.lastMessage.getDeletedAt()) return false;
    if (this.lastMessage.getType() !== 'text' || this.lastMessage.getCategory() !== 'message') return false;
    const textMessage = this.lastMessage as CometChat.TextMessage; const rawText = textMessage.getText() || '';
    if (!rawText) {
      // Fallback: no text — check metadata
      try { const metadata = textMessage.getMetadata?.() as Record<string, any> | undefined; const richText = metadata?.['richText'] as { html?: string; hasFormatting?: boolean } | undefined; if (richText?.html && richText?.hasFormatting) return true; } catch {}
      return false;
    }
    if (this.isURL(rawText) || this.hasMarkdownLink(rawText)) return false;
    if (/(\*\*|(?<!\*)\*(?!\*|\s)|__|~~|`|_(?=[^\s_])|^>\s|^&gt;\s?|^ *[-*]\s|^ *\d+\.\s)/m.test(rawText) || this.hasMarkdownLink(rawText)) return true;
    const formatters = this.getFormattersForSubtitle(); if (!formatters?.length) return false;
    const hasSdkMentions = this.hasSdkMentionTags(rawText); const hasMentionsFormatter = formatters.some(f => f instanceof CometChatMentionsFormatter);
    const hasCustomFormatters = formatters.some(f => !(f instanceof CometChatMentionsFormatter) && f.id !== 'tiptap-formatter');
    return (hasSdkMentions && hasMentionsFormatter) || hasCustomFormatters;
  }
  private sanitizeSubtitleHtml(html: string): string { if (!html) return ''; try { let processed = html; const tempDiv = document.createElement('div'); tempDiv.innerHTML = processed; const ols = tempDiv.querySelectorAll('ol'); ols.forEach(ol => { const items = ol.querySelectorAll(':scope > li'); items.forEach((li, idx) => { const span = document.createElement('span'); span.innerHTML = `${idx + 1}. ${li.innerHTML} `; li.replaceWith(span); }); const span = document.createElement('span'); span.innerHTML = ol.innerHTML; ol.replaceWith(span); }); const uls = tempDiv.querySelectorAll('ul'); uls.forEach(ul => { const items = ul.querySelectorAll(':scope > li'); items.forEach(li => { const span = document.createElement('span'); span.innerHTML = `\u2022 ${li.innerHTML} `; li.replaceWith(span); }); const span = document.createElement('span'); span.innerHTML = ul.innerHTML; ul.replaceWith(span); }); processed = tempDiv.innerHTML.replace(/<br\s*\/?>/gi, ' ').replace(/<\/p>/gi, ' ').replace(/<\/blockquote>/gi, ' ').replace(/<\/h[1-6]>/gi, ' '); let s = this.htmlSanitizer.sanitizeWithConfig(processed, { ALLOWED_TAGS: ['span', 'strong', 'em', 'b', 'i', 'u', 's', 'code', 'a'], ALLOWED_ATTR: ['class', 'data-uid', 'data-mention-type', 'data-hashtag', 'href', 'target', 'rel', 'style'] }); s = String(s).replace(/\n/g, ' ').replace(/\s{2,}/g, ' ').trim(); return s; } catch (error) { CometChatLogger.error('CometChatConversationItem', 'Sanitization error:', error); return ''; } }
  private formatPlainMentions(text: string, mentionedUsers: CometChat.User[]): string {
    if (!text) return '';
    const userMap = new Map<string, string>(); mentionedUsers.forEach(u => userMap.set(u.getUid(), u.getName()));
    let r = text.replace(/<@uid:(.*?)>/g, (_m, uid) => `@${userMap.get(uid) || uid}`);
    return r.replace(/<@all:(.*?)>/g, (_m, label) => `@${label}`);
  }
  get senderNamePrefix(): string {
    if (!this.lastMessage) return '';
    const messageCategory = this.lastMessage.getCategory();
    if (messageCategory === 'action') return '';
    if (messageCategory === 'call') return '';
    if (messageCategory === 'custom' && this.lastMessage.getType() === CometChatUIKitConstants.calls.meeting) return '';
    if (this.isGroupConversation) { if (this.isLastMessageByMe) return CometChatLocalize.getLocalizedString('conversation_subtitle_you_message') + ':'; const sender = this.lastMessage.getSender(); if (sender) return sender.getName() + ':'; }
    return '';
  }
  private getActionMessageText(): string {
    const action = this.lastMessage as CometChat.Action; const actionType = action.getAction?.() || ''; const actionBy = action.getActionBy?.(); const actionOn = action.getActionOn?.();
    let actionByName = ''; let actionOnName = '';
    if (actionBy && 'getName' in actionBy && typeof actionBy.getName === 'function') actionByName = (actionBy as any).getName() || '';
    if (actionOn && 'getName' in actionOn && typeof actionOn.getName === 'function') actionOnName = (actionOn as any).getName() || '';
    switch (actionType) {
      case 'added': return `${actionByName} ${CometChatLocalize.getLocalizedString('conversation_subtitle_added')} ${actionOnName}`;
      case 'joined': return `${actionByName} ${CometChatLocalize.getLocalizedString('conversation_subtitle_joined')}`;
      case 'left': return `${actionByName} ${CometChatLocalize.getLocalizedString('conversation_subtitle_left')}`;
      case 'kicked': return `${actionByName} ${CometChatLocalize.getLocalizedString('conversation_subtitle_kicked')} ${actionOnName}`;
      case 'banned': return `${actionByName} ${CometChatLocalize.getLocalizedString('conversation_subtitle_banned')} ${actionOnName}`;
      case 'unbanned': return `${actionByName} ${CometChatLocalize.getLocalizedString('conversation_subtitle_unbanned')} ${actionOnName}`;
      case 'scopeChanged': return `${actionByName} ${CometChatLocalize.getLocalizedString('conversation_subtitle_scope_changed')} ${actionOnName}`;
      default: return actionType;
    }
  }
  private getCallMessageText(): string {
    const call = this.lastMessage as CometChat.Call; const callStatus = call.getStatus?.() || ''; const callType = call.getType?.() || ''; const isOutgoing = this.isLastMessageByMe;
    switch (callStatus) {
      case 'initiated': return isOutgoing ? CometChatLocalize.getLocalizedString('conversation_subtitle_outgoing_call') : CometChatLocalize.getLocalizedString('conversation_subtitle_incoming_call');
      case 'ongoing': return callType === 'audio' ? CometChatLocalize.getLocalizedString('conversation_subtitle_voice_call') : CometChatLocalize.getLocalizedString('conversation_subtitle_video_call');
      case 'unanswered': return CometChatLocalize.getLocalizedString('conversation_subtitle_unasnwered_call');
      case 'rejected': return CometChatLocalize.getLocalizedString('conversation_subtitle_rejected_call');
      case 'busy': return CometChatLocalize.getLocalizedString('conversation_subtitle_busy_call');
      case 'cancelled': return CometChatLocalize.getLocalizedString('conversation_subtitle_cancelled_call');
      case 'ended': return CometChatLocalize.getLocalizedString('conversation_subtitle_ended_call');
      case 'missed': return CometChatLocalize.getLocalizedString('conversation_subtitle_missed_call');
      default: return callType === 'audio' ? CometChatLocalize.getLocalizedString('conversation_subtitle_voice_call') : CometChatLocalize.getLocalizedString('conversation_subtitle_video_call');
    }
  }
  private getCustomMessageText(): string {
    try {
      const customMessage = this.lastMessage as CometChat.CustomMessage;
      const customData = customMessage.getCustomData?.();
      if (customData && typeof customData === 'object' && 'text' in customData) return String(customData.text);
      return '';
    } catch {
      return '';
    }
  }
  private getMeetingMessageText(): string {
    try {
      const cm = this.lastMessage as CometChat.CustomMessage; const cd = cm.getCustomData?.() as Record<string, any> | undefined; const callType = cd?.['callType'] || ''; const sender = cm.getSender?.(); const isSelf = !sender || sender.getUid() === this.loggedInUser?.getUid();
      if (isSelf) { return callType === CometChatUIKitConstants.MessageTypes.audio ? CometChatLocalize.getLocalizedString('conversation_subtitle_group_voice_call_initated_self') : CometChatLocalize.getLocalizedString('conversation_subtitle_group_video_call_initated_self'); }
      const sn = sender?.getName() || ''; return callType === CometChatUIKitConstants.MessageTypes.audio ? `${sn} ${CometChatLocalize.getLocalizedString('conversation_subtitle_group_voice_call_initated')}` : `${sn} ${CometChatLocalize.getLocalizedString('conversation_subtitle_group_video_call_initated')}`;
    } catch { return CometChatLocalize.getLocalizedString('conversation_subtitle_voice_call'); }
  }
  get slotContext(): ConversationSlotContext {
    return {
      $implicit: this.conversation,
      conversation: this.conversation,
      isActive: this.isActive,
      isSelected: this.isSelected,
      unreadCount: this.unreadCount,
      isTyping: this.isTyping,
    };
  }
  get accessibleLabel(): string {
    return getConversationAccessibleLabel(this.conversationWith, this.subtitleText, this.unreadCount);
  }
  private getPlainSubtitleText(): string {
    const text = this.subtitleText;
    if (!text) return '';
    return text.replace(/<[^>]*>/g, '').trim();
  }
  handleClick(): void { this.itemClick.emit(this.conversation); }
  handleMouseDown(event: MouseEvent): void { event.preventDefault(); }
  handleAvatarClick(event: Event): void { this.avatarClick.emit(this.conversation); }
  handleTitleClick(event: Event): void { this.titleClick.emit(this.conversation); }
  handleSubtitleClick(event: Event): void { this.subtitleClick.emit(this.conversation); }
  handleTimestampClick(event: Event): void { this.timestampClick.emit(this.conversation); }
  handleBadgeClick(event: Event): void { this.badgeClick.emit(this.conversation); }
  handleContextMenuOpen(): void { this.contextMenuOpen.emit(this.conversation); }
  handleContextMenu(event: MouseEvent): void {
    if (this.effectiveDisableDefaultContextMenu()) { event.preventDefault(); }
  }
  handleContextMenuOptionClick(option: CometChatOption): void {
    this.contextMenuOptionClick.emit({ option, conversation: this.conversation });
  }
  onKeyDown(event: KeyboardEvent): void {
    // Stop propagation on handled keys so the parent list's container keydown
    // handler does not also act on them (which would double-toggle selection).
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); event.stopPropagation(); this.handleClick(); return; }
    if ((event.key === 'F10' && event.shiftKey) || event.key === 'ContextMenu') { event.preventDefault(); event.stopPropagation(); this.openContextMenuViaKeyboard(); return; }
  }
  private openContextMenuViaKeyboard(): void {
    this.isHovered = true;
    this.contextMenuOpen.emit(this.conversation);
    this.contextMenuKeyboardOpen.emit(this.conversation);
  }
}
