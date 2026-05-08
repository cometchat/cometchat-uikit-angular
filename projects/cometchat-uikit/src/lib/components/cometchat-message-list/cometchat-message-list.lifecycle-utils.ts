import {SimpleChanges, effect, DestroyRef} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {CometChat} from '@cometchat/chat-sdk-javascript';
import {CometChatUIEvents, IPanel} from '../../events/CometChatUIEvents';
import {PanelAlignment, States} from '../../Enums/Enums';
import {CometChatLogger} from '../../utils/CometChatLogger';
import {CometChatMentionsFormatter} from '../../formatters/cometchat-mentions-formatter';

export function setupMessageListenerImpl(self: any): void {
  CometChat.addMessageListener(
    self.messageListenerId,
    new CometChat.MessageListener({
      onMessagesDelivered: (_messageReceipt: CometChat.MessageReceipt) => {
        setTimeout(() => { self.cdr.detectChanges(); }, 500);
      },
      onMessagesRead: (_messageReceipt: CometChat.MessageReceipt) => {
        setTimeout(() => { self.cdr.detectChanges(); }, 500);
      },
    })
  );
}

export function ngOnInitImpl(self: any): void {
  self.messageListenerId = `message_list_${Date.now()}`;
  self.initializeLoggedInUser().then(() => {
    self.configureFormattersWithUser();
    self.setupMessageListener();
  });
  self.initializeFormatters();
  self.subscribeToMessageEvents();
  if (!self.user && !self.group) {
    self.propsProvided = false;
    self.subscribeToChatStateService();
  } else {
    self.propsProvided = true;
    self.initializeService();
  }
  CometChatUIEvents.ccShowPanel.pipe(takeUntilDestroyed(self.destroyRef as DestroyRef)).subscribe((panel: IPanel) => {
    if (panel.position === PanelAlignment.messageListFooter) {
      self.footerPanelConfig.set(panel);
      self.showFooterPanel.set(true);
    }
  });
  CometChatUIEvents.ccHidePanel.pipe(takeUntilDestroyed(self.destroyRef as DestroyRef)).subscribe((alignment: void | PanelAlignment) => {
    if (alignment === PanelAlignment.messageListFooter || alignment === undefined) {
      self.footerPanelConfig.set(null);
      self.showFooterPanel.set(false);
    }
  });
}

export function ngOnChangesImpl(self: any, changes: SimpleChanges): void {
  const userChange = changes['user'];
  const groupChange = changes['group'];
  const goToMessageIdChange = changes['goToMessageId'];
  if ((userChange && !userChange.firstChange) || (groupChange && !groupChange.firstChange)) {
    self.handleConversationChange();
  }
  if (changes['parentMessageId'] && !changes['parentMessageId'].firstChange) {
    self.handleParentMessageIdChange();
  }
  const conversationAlsoChanged =
    (userChange && !userChange.firstChange) || (groupChange && !groupChange.firstChange);
  if (
    goToMessageIdChange &&
    !goToMessageIdChange.firstChange &&
    self.goToMessageId &&
    !conversationAlsoChanged &&
    !self.conversationChangeScheduled
  ) {
    self.scrollToMessage(self.goToMessageId);
  }
  const hideGroupActionChange = changes['hideGroupActionMessages'];
  if (hideGroupActionChange && !hideGroupActionChange.firstChange) {
    self.messageListService.setHideGroupActionMessages(self.hideGroupActionMessages);
    self.messageListService.clearMessages();
    self.messageListService.fetchPreviousMessages().then(() => {
      self.scrollToBottomAfterLoad();
    });
  }
}

export function ngAfterViewInitImpl(self: any): void {
  self.setupIntersectionObservers();
  self.setupScrollListeners();
  // Re-setup observers when list transitions to loaded state
  effect(
    () => {
      const state = self.listState();
      if (state === States.loaded) {
        setTimeout(() => { self.setupIntersectionObservers(); }, 0);
      }
    },
    { injector: self.injector }
  );
}

export function ngOnDestroyImpl(self: any): void {
  if (self.messageListenerId) {
    CometChat.removeMessageListener(self.messageListenerId);
  }
  self.disconnectObservers();
  self.pendingReadReceipts.clear();
  if (self.typingAnnouncementTimeout) {
    clearTimeout(self.typingAnnouncementTimeout);
    self.typingAnnouncementTimeout = null;
  }
  if (self.scrollListener && self.listContainer?.nativeElement) {
    self.listContainer.nativeElement.removeEventListener('scroll', self.scrollListener);
    self.scrollListener = null;
  }
}

export async function initializeLoggedInUserImpl(self: any): Promise<void> {
  try {
    self.loggedInUser = await CometChat.getLoggedinUser();
  } catch (error) {
    CometChatLogger.error('CometChatMessageList', 'Error getting logged-in user:', error);
  }
}

export function initializeFormattersImpl(self: any): void {
  const effectiveFormatters = self.effectiveTextFormatters();
  if (effectiveFormatters && effectiveFormatters.length > 0) {
    self.activeFormatters = [...effectiveFormatters];
  } else {
    self.activeFormatters = self.formatterConfigService.getDefaultFormatters();
  }
}

export function configureFormattersWithUserImpl(self: any): void {
  if (!self.loggedInUser) { return; }
  self.activeFormatters.forEach((formatter: any) => {
    if (formatter instanceof CometChatMentionsFormatter) {
      formatter.setLoggedInUser(self.loggedInUser);
    }
  });
}
