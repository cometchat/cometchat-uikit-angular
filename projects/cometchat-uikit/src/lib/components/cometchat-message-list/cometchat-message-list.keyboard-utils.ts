import {CometChatLocalize} from '../../resources/CometChatLocalize/cometchat-localize';

export function handleKeydownImpl(self: any, event: KeyboardEvent): void {
  if (self.focusTrapService.hasActiveTraps() || isEventFromOverlayImpl(event)) { return; }
  const items = self.messagesWithSeparators();
  if (items.length === 0) { return; }
  const messageIndices = items
    .map((item: any, idx: number) => (item.type === 'message' ? idx : -1))
    .filter((idx: number) => idx !== -1);
  if (messageIndices.length === 0) { return; }
  const currentFocused = self.focusedMessageIndex();
  let currentPos = messageIndices.indexOf(currentFocused);
  if (currentPos === -1) { currentPos = 0; }
  const newPos = self.listNavigationService.handleKeyNavigation(event, currentPos, {
    itemCount: messageIndices.length,
    wrap: false,
  });
  if (newPos !== -1 && messageIndices[newPos] !== self.focusedMessageIndex()) {
    self.setFocusedIndex(messageIndices[newPos]);
    if (newPos === 0 && self.hasMorePrevious() && !self.isFetchingPrevious()) {
      self.announceLoadingMore();
      self.handleScrollToTop();
    }
  }
  if (event.key === 'Enter') { event.preventDefault(); }
  if (event.key === ' ') {
    const focusedItem = items[self.focusedMessageIndex()];
    if (focusedItem?.message && self.isMediaMessage(focusedItem.message)) {
      event.preventDefault();
    }
  }
  if (event.key === 'Escape') {
    event.preventDefault();
    self.focusedMessageIndex.set(-1);
    (document.activeElement as HTMLElement)?.blur();
  }
}

export function isEventFromOverlayImpl(event: KeyboardEvent): boolean {
  const target = event.target as HTMLElement;
  if (!target || typeof target.closest !== 'function') { return false; }
  return !!(
    target.closest('cometchat-emoji-keyboard') ||
    target.closest('.cometchat-popover__content') ||
    target.closest('cometchat-confirm-dialog') ||
    target.closest('cometchat-flag-message-dialog') ||
    target.closest('cometchat-context-menu') ||
    target.closest('[aria-modal="true"]')
  );
}

export function setFocusedIndexImpl(self: any, index: number): void {
  self.focusedMessageIndex.set(index);
  if (!self.listContainer?.nativeElement) { return; }
  setTimeout(() => {
    const element = self.listContainer?.nativeElement.querySelector(
      `.cometchat-message-list__message[data-index="${index}"]`
    ) as HTMLElement;
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      element.focus();
    }
  }, 0);
}

export function getMessageTabIndexImpl(self: any, index: number): number {
  if (self.focusedMessageIndex() === -1) {
    const items = self.messagesWithSeparators();
    const firstMessageIndex = items.findIndex((item: any) => item.type === 'message');
    return index === firstMessageIndex ? 0 : -1;
  }
  return self.listNavigationService.getItemTabIndex(index, self.focusedMessageIndex());
}
