import {CometChat} from '@cometchat/chat-sdk-javascript';
import {Subject} from 'rxjs';
import {debounceTime} from 'rxjs/operators';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {CometChatLogger} from '../../utils/CometChatLogger';
import {CometChatMessageEvents} from '../../events/CometChatMessageEvents';
import {CometChatUIKitConstants} from '../../constants';
import {States, MessageListAlignment, MessageBubbleAlignment} from '../../Enums/Enums';
import {ToastType} from '../base-elements/cometchat-toast/cometchat-toast.component';
import {ErrorContext} from '../base-elements/cometchat-error-boundary/cometchat-error-boundary.component';

export function setupScrollListenersImpl(self: any): void {
  if (!self.listContainer?.nativeElement) { return; }
  const scrollSubject$ = new Subject<Event>();
  scrollSubject$.pipe(debounceTime(100), takeUntilDestroyed(self.destroyRef)).subscribe(() => {
    self.updateStickyDate();
    self.updateIsAtBottom();
  });
  self.scrollListener = (event: Event) => { scrollSubject$.next(event); };
  self.listContainer.nativeElement.addEventListener('scroll', self.scrollListener);
}

export function getMessageAlignmentImpl(self: any, message: CometChat.BaseMessage): MessageBubbleAlignment {
  const category = message.getCategory();
  if (category === CometChatUIKitConstants.MessageCategory.call) { return MessageBubbleAlignment.center; }
  if (category === CometChatUIKitConstants.MessageCategory.action) { return MessageBubbleAlignment.center; }
  if (self.messageAlignment === MessageListAlignment.left) { return MessageBubbleAlignment.left; }
  const sender = message.getSender();
  if (!sender || (self.loggedInUser && sender?.getUid() === self.loggedInUser.getUid())) { return MessageBubbleAlignment.right; }
  return MessageBubbleAlignment.left;
}

export function isCallForCurrentConversationImpl(self: any, call: CometChat.Call): boolean {
  const receiverId = call.getReceiverId();
  const receiverType = call.getReceiverType();
  if (self.user) {
    if (receiverType === CometChatUIKitConstants.MessageReceiverType.user) {
      const senderId = call.getSender()?.getUid();
      return receiverId === self.user.getUid() || senderId === self.user.getUid();
    }
    return false;
  } else if (self.group) {
    return (
      receiverType === CometChatUIKitConstants.MessageReceiverType.group &&
      receiverId === self.group.getGuid()
    );
  }
  return false;
}

export function updateListStateImpl(self: any): void {
  // In agent chat mode without parentMessageId, skip the normal state machine.
  // State is managed directly: starts as empty, transitions to loaded when messages arrive.
  if (self.isAgentChat && !self.parentMessageId) {
    const messages = self.messages();
    if (messages.length > 0) {
      self.listState.set(States.loaded);
    }
    // Don't override to 'loading' — keep empty state until messages arrive
    return;
  }
  const loading = self.loadingState();
  const error = self.errorState();
  const messages = self.messages();
  if (loading && messages.length === 0) {
    self.listState.set(States.loading);
  } else if (error && !loading && !self.effectiveHideError()) {
    // ENG-35029: Only show error state when NOT loading. A stale error from a previous
    // conversation's fetch can arrive after setUser/setGroup clears the error state but
    // before the new fetch completes. Ignoring errors during loading prevents false
    // "Something went wrong" screens when switching conversations quickly.
    self.listState.set(States.error);
  } else if (messages.length === 0) {
    self.listState.set(States.empty);
  } else {
    self.listState.set(States.loaded);
  }
}

export function showInlineToastImpl(self: any, text: string, type: ToastType = ToastType.success, duration = 2000): void {
  if (self.inlineToastTimer) { clearTimeout(self.inlineToastTimer); }
  self.inlineToastText.set(text);
  self.inlineToastType.set(type);
  self.cdr.markForCheck();
  self.inlineToastTimer = window.setTimeout(() => {
    self.inlineToastText.set(null);
    self.cdr.markForCheck();
  }, duration);
}

export function notifyMessagesReadImpl(self: any, message: CometChat.BaseMessage): void {
  try {
    CometChatMessageEvents.ccMessageRead.next(message);
  } catch (error) {
    CometChatLogger.error('CometChatMessageList', 'Error emitting message read event:', error);
  }
}

export function handleLifecycleErrorImpl(self: any, error: unknown, hook: string): void {
  const err = error instanceof Error ? error : new Error(String(error));
  CometChatLogger.error('CometChatMessageList', `Error in ${hook}:`, err);
  self.listState.set(States.error);
  self.error.emit(err as CometChat.CometChatException);
}

export function handleServiceErrorImpl(self: any, error: Error): void {
  CometChatLogger.error('CometChatMessageList', 'Service error:', error);
  if (!self.effectiveHideError()) {
    self.listState.set(States.error);
    self.error.emit(error as CometChat.CometChatException);
  }
}

export function onBubbleErrorImpl(context: ErrorContext): void {
  CometChatLogger.error(
    'CometChatMessageList',
    `Bubble render error [${context.componentName}]:`,
    context.error
  );
}

export function handleReceiptErrorImpl(self: any, error: CometChat.CometChatException, context: string): void {
  CometChatLogger.error('CometChatMessageList', `Receipt error in ${context}:`, error);
  if (error instanceof CometChat.CometChatException) { self.error.emit(error); }
}

export function shouldShowSmartRepliesForMessageImpl(self: any, message: CometChat.BaseMessage): boolean {
  if (!self.smartRepliesKeywords || self.smartRepliesKeywords.length === 0) { return true; }
  if (message.getType() !== 'text') { return false; }
  const textMessage = message as CometChat.TextMessage;
  const text = textMessage.getText()?.toLowerCase() || '';
  return self.smartRepliesKeywords.some((keyword: string) => text.includes(keyword.toLowerCase()));
}
