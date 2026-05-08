/**
 * Extracted event subscription logic for CometChatMessageListComponent.
 * Called from the component via delegation.
 */
import {DestroyRef, ChangeDetectorRef} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {CometChat} from '@cometchat/chat-sdk-javascript';
import {CometChatMessageEvents, IMessages} from '../../events/CometChatMessageEvents';
import {CometChatGroupEvents, IGroupLeft, IGroupMemberAdded, IGroupMemberKickedBanned, IGroupMemberScopeChanged, IOwnershipChanged} from '../../events/CometChatGroupEvents';
import {CometChatCallEvents} from '../../events/CometChatCallEvents';
import {CometChatUIEvents, IDialog, IShowOngoingCall} from '../../events/CometChatUIEvents';
import {MessageStatus} from '../../Enums/Enums';
import {CometChatUIKitConstants} from '../../constants';
import {CometChatLocalize} from '../../resources/CometChatLocalize/cometchat-localize';
import {MessageListService} from '../../services/message-list.service';

export interface MessageEventContext {
  destroyRef: DestroyRef;
  cdr: ChangeDetectorRef;
  parentMessageId: number | null;
  user: CometChat.User | null | undefined;
  group: CometChat.Group | null | undefined;
  messageListService: MessageListService;
  isMessageForCurrentConversation(msg: CometChat.BaseMessage): boolean;
  scrollToBottom(smooth: boolean): void;
  showInlineToast(msg: string, type?: any, duration?: number): void;
  subscribeToGroupEvents(): void;
  subscribeToCallEvents(): void;
  subscribeToUIDialogEvents(): void;
}

export function subscribeToMessageEventsImpl(ctx: MessageEventContext): void {
  CometChatMessageEvents.ccMessageSent.pipe(takeUntilDestroyed(ctx.destroyRef)).subscribe(data => {
    if (data.status === MessageStatus.inprogress) {
      const messageParentId = data.message.getParentMessageId();
      if (ctx.parentMessageId) {
        if (messageParentId !== ctx.parentMessageId) { return; }
      } else {
        if (messageParentId) { return; }
      }
      requestAnimationFrame(() => { ctx.scrollToBottom(false); });
    }
  });
  CometChatMessageEvents.ccMessageDeleted.pipe(takeUntilDestroyed(ctx.destroyRef)).subscribe((message: CometChat.BaseMessage) => {
    const messageId = message.getId();
    if (messageId) {
      const existing = ctx.messageListService.getMessageById(messageId);
      if (existing && !existing.getDeletedAt()) { ctx.messageListService.deleteMessage(messageId); }
      ctx.cdr.markForCheck();
    }
  });
  CometChatMessageEvents.ccMessageTranslated.pipe(takeUntilDestroyed(ctx.destroyRef)).subscribe((data: IMessages) => {
    if (data.status === MessageStatus.success && data.message) {
      if (ctx.isMessageForCurrentConversation(data.message)) { ctx.messageListService.updateMessageById(data.message.getId(), data.message); ctx.cdr.markForCheck(); }
    }
  });
  CometChatMessageEvents.ccMessageEdited.pipe(takeUntilDestroyed(ctx.destroyRef)).subscribe((data: IMessages) => {
    if (ctx.parentMessageId) { if (data.parentMessageId !== ctx.parentMessageId) return; } else { if (data.parentMessageId) return; }
    if (data.status === MessageStatus.success) { ctx.showInlineToast(CometChatLocalize.getLocalizedString('message_list_message_edited')); } else if (data.status === MessageStatus.error) { ctx.showInlineToast(CometChatLocalize.getLocalizedString('message_edit_error'), undefined, 3000); }
  });
  CometChatMessageEvents.ccMessageRead.pipe(takeUntilDestroyed(ctx.destroyRef)).subscribe((message: CometChat.BaseMessage) => {
    if (ctx.user && message.getReceiverType() === CometChatUIKitConstants.MessageReceiverType.user) {
      if (message.getParentMessageId() && !ctx.parentMessageId) { return; }
    }
  });
  ctx.subscribeToGroupEvents();
  ctx.subscribeToCallEvents();
  ctx.subscribeToUIDialogEvents();
}

export interface GroupEventContext {
  destroyRef: DestroyRef;
  cdr: ChangeDetectorRef;
  parentMessageId: number | null;
  group: CometChat.Group | null | undefined;
  messageListService: MessageListService;
  scrollToBottom(smooth: boolean): void;
  setGroup(group: CometChat.Group): void;
}

export function subscribeToGroupEventsImpl(ctx: GroupEventContext): void {
  CometChatGroupEvents.ccOwnershipChanged.pipe(takeUntilDestroyed(ctx.destroyRef)).subscribe((data: IOwnershipChanged) => {
    if (ctx.group && data.group.getGuid() === ctx.group.getGuid()) { ctx.setGroup(data.group); ctx.cdr.markForCheck(); }
  });
  CometChatGroupEvents.ccGroupMemberScopeChanged.pipe(takeUntilDestroyed(ctx.destroyRef)).subscribe((data: IGroupMemberScopeChanged) => {
    if (ctx.group && data.group.getGuid() === ctx.group.getGuid()) {
      ctx.setGroup(data.group);
      if (!ctx.parentMessageId) { ctx.messageListService.addMessage(data.message); ctx.scrollToBottom(false); }
      ctx.cdr.markForCheck();
    }
  });
  CometChatGroupEvents.ccGroupMemberAdded.pipe(takeUntilDestroyed(ctx.destroyRef)).subscribe((data: IGroupMemberAdded) => {
    if (ctx.group && data.userAddedIn.getGuid() === ctx.group.getGuid()) {
      ctx.setGroup(data.userAddedIn);
      if (!ctx.parentMessageId) { data.messages.forEach(message => { ctx.messageListService.addMessage(message); }); ctx.scrollToBottom(false); }
      ctx.cdr.markForCheck();
    }
  });
  CometChatGroupEvents.ccGroupMemberBanned.pipe(takeUntilDestroyed(ctx.destroyRef)).subscribe((data: IGroupMemberKickedBanned) => {
    if (ctx.group && data.kickedFrom.getGuid() === ctx.group.getGuid()) {
      ctx.setGroup(data.kickedFrom);
      if (!ctx.parentMessageId) { ctx.messageListService.addMessage(data.message); ctx.scrollToBottom(false); }
      ctx.cdr.markForCheck();
    }
  });
  CometChatGroupEvents.ccGroupMemberKicked.pipe(takeUntilDestroyed(ctx.destroyRef)).subscribe((data: IGroupMemberKickedBanned) => {
    if (ctx.group && data.kickedFrom.getGuid() === ctx.group.getGuid()) {
      ctx.setGroup(data.kickedFrom);
      if (!ctx.parentMessageId) { ctx.messageListService.addMessage(data.message); ctx.scrollToBottom(false); }
      ctx.cdr.markForCheck();
    }
  });
  CometChatGroupEvents.ccGroupLeft.pipe(takeUntilDestroyed(ctx.destroyRef)).subscribe((data: IGroupLeft) => {
    if (ctx.group && data.leftGroup.getGuid() === ctx.group.getGuid()) {
      if (!ctx.parentMessageId) { ctx.messageListService.addMessage(data.message); ctx.scrollToBottom(false); }
      ctx.cdr.markForCheck();
    }
  });
}

export interface CallEventContext {
  destroyRef: DestroyRef;
  cdr: ChangeDetectorRef;
  parentMessageId: number | null;
  messageListService: MessageListService;
  isCallForCurrentConversation(call: CometChat.Call): boolean;
  scrollToBottom(smooth: boolean): void;
  showCallScreen: { set(v: boolean): void };
  ongoingCallView: { set(v: any): void };
}

export function subscribeToCallEventsImpl(ctx: CallEventContext): void {
  CometChatCallEvents.ccCallEnded.pipe(takeUntilDestroyed(ctx.destroyRef)).subscribe((call: CometChat.Call) => {
    ctx.showCallScreen.set(false);
    ctx.ongoingCallView.set(null);
    if (call && !ctx.parentMessageId) {
      if (ctx.isCallForCurrentConversation(call)) { ctx.messageListService.addMessage(call); ctx.scrollToBottom(false); ctx.cdr.markForCheck(); }
    }
  });
  CometChatCallEvents.ccCallRejected.pipe(takeUntilDestroyed(ctx.destroyRef)).subscribe((call: CometChat.Call) => {
    if (call && !ctx.parentMessageId) {
      if (ctx.isCallForCurrentConversation(call)) { ctx.messageListService.addMessage(call); ctx.scrollToBottom(false); ctx.cdr.markForCheck(); }
    }
  });
  CometChatCallEvents.ccOutgoingCall.pipe(takeUntilDestroyed(ctx.destroyRef)).subscribe((call: CometChat.Call) => {
    if (call && !ctx.parentMessageId) {
      if (ctx.isCallForCurrentConversation(call)) { ctx.messageListService.addMessage(call); ctx.scrollToBottom(false); ctx.cdr.markForCheck(); }
    }
  });
  CometChatCallEvents.ccCallAccepted.pipe(takeUntilDestroyed(ctx.destroyRef)).subscribe((call: CometChat.Call) => {
    if (call && !ctx.parentMessageId) {
      if (ctx.isCallForCurrentConversation(call)) { ctx.messageListService.addMessage(call); ctx.scrollToBottom(false); ctx.cdr.markForCheck(); }
    }
  });
}

export interface UIDialogEventContext {
  destroyRef: DestroyRef;
  cdr: ChangeDetectorRef;
  parentMessageId: number | null;
  imageModerationDialogContent: { set(v: any): void };
  showImageModerationDialog: { set(v: boolean): void };
  showCallScreen: { set(v: boolean): void };
  ongoingCallView: { set(v: any): void };
}

export function subscribeToUIDialogEventsImpl(ctx: UIDialogEventContext): void {
  CometChatUIEvents.ccShowDialog.pipe(takeUntilDestroyed(ctx.destroyRef)).subscribe((data: IDialog) => {
    ctx.imageModerationDialogContent.set(data.child);
    ctx.showImageModerationDialog.set(true);
    ctx.cdr.markForCheck();
  });
  CometChatUIEvents.ccHideDialog.pipe(takeUntilDestroyed(ctx.destroyRef)).subscribe(() => {
    ctx.imageModerationDialogContent.set(null);
    ctx.showImageModerationDialog.set(false);
    ctx.cdr.markForCheck();
  });
  CometChatUIEvents.ccShowOngoingCall.pipe(takeUntilDestroyed(ctx.destroyRef)).subscribe((data: IShowOngoingCall) => {
    const shouldShow = !!data.child;
    const isMatch = data.message
      ? (data.message.getParentMessageId() && ctx.parentMessageId && data.message.getParentMessageId() === ctx.parentMessageId) ||
        (!ctx.parentMessageId && !data.message?.getParentMessageId())
      : true;
    if (isMatch) {
      ctx.showCallScreen.set(shouldShow);
      ctx.ongoingCallView.set(data.child);
      ctx.cdr.markForCheck();
    }
  });
}
