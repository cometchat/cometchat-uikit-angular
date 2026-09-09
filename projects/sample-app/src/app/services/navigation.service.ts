import { Injectable, inject, signal, OnDestroy } from '@angular/core';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { ChatStateService } from '@cometchat/chat-uikit-angular';

/**
 * NavigationService
 *
 * Manages which panels are visible (side panel, thread, search)
 * and handles mobile responsive navigation state.
 * All panel visibility logic lives here — components read signals
 * and call methods to trigger transitions.
 */
@Injectable({ providedIn: 'root' })
export class NavigationService implements OnDestroy {
  private chatStateService = inject(ChatStateService);

  // ── Side panel state ──
  sidePanelView = signal<
    'none' | 'user-details' | 'group-details' | 'add-members' | 'banned-members' | 'transfer-ownership' | 'search' | 'call-log-details' | 'pinned-messages'
  >('none');

  // ── Thread state ──
  threadMessage = signal<CometChat.BaseMessage | null>(null);
  showThread = signal(false);

  // ── Call log details state ──
  selectedCallLog = signal<any>(null);

  // ── Mobile state ──
  isMobile = signal(false);
  mobilePanel = signal<'selector' | 'messages' | 'side-panel'>('selector');

  // ── Go-to-message support ──
  /** The raw message ID signal (used by goToMessageId input binding) */
  goToMessageId = signal<number | null>(null);

  /** Media query listener cleanup reference */
  private mediaQuery: MediaQueryList;
  private mediaQueryHandler: (e: MediaQueryListEvent) => void;

  constructor() {
    this.mediaQuery = window.matchMedia('(max-width: 768px)');
    this.isMobile.set(this.mediaQuery.matches);

    this.mediaQueryHandler = (e: MediaQueryListEvent) => {
      this.isMobile.set(e.matches);
    };
    this.mediaQuery.addEventListener('change', this.mediaQueryHandler);
  }

  ngOnDestroy(): void {
    this.mediaQuery.removeEventListener('change', this.mediaQueryHandler);
  }

  setGotoMessageId(id: number | null): void {
    this.goToMessageId.set(id);
  }

  // ── Side panel methods ──

  /**
   * Opens the details panel for the currently active entity.
   * Shows user-details if a user is active, group-details if a group is active.
   */
  showDetailsPanel(): void {
    this.closeThreadPanel();
    const activeGroup = this.chatStateService.getActiveGroup();
    if (activeGroup) {
      this.sidePanelView.set('group-details');
    } else {
      this.sidePanelView.set('user-details');
    }
  }

  /** Opens the search panel. */
  showSearchPanel(): void {
    this.closeThreadPanel();
    this.sidePanelView.set('search');
  }

  /** Opens the add members panel. */
  showAddMembersPanel(): void {
    this.closeThreadPanel();
    this.sidePanelView.set('add-members');
  }

  /** Opens the banned members panel. */
  showBannedMembersPanel(): void {
    this.closeThreadPanel();
    this.sidePanelView.set('banned-members');
  }

  /** Opens the transfer ownership panel. */
  showTransferOwnershipPanel(): void {
    this.closeThreadPanel();
    this.sidePanelView.set('transfer-ownership');
  }

  /** Opens the call log details panel. */
  showCallLogDetailsPanel(callLog: any): void {
    this.closeThreadPanel();
    this.selectedCallLog.set(callLog);
    this.sidePanelView.set('call-log-details');
  }

  /** Closes the side panel. */
  closeSidePanel(): void {
    const wasOpen = this.sidePanelView() !== 'none';
    this.sidePanelView.set('none');
    if (wasOpen && this.isMobile() && this.mobilePanel() === 'side-panel') {
      this.mobilePanel.set('messages');
    }
  }

  /** Opens the pinned-messages panel for the active conversation. */
  showPinnedMessagesPanel(): void {
    this.closeThreadPanel();
    this.sidePanelView.set('pinned-messages');
    if (this.isMobile()) this.mobilePanel.set('side-panel');
  }

  /**
   * Whether the saved-messages list covers the conversation list.
   *
   * It lives in the LEFT column rather than the right side panel because it is
   * a way of choosing what to look at, like the conversation list it replaces —
   * not a detail of the conversation already open. Tapping a row also has to
   * open a chat in the centre panel, which a right-panel surface would end up
   * sitting beside rather than revealing.
   */
  readonly showSavedMessages = signal(false);

  /** Opens the user-level saved-messages list over the conversation list. */
  openSavedMessages(): void {
    this.closeSidePanel();
    this.closeThreadPanel();
    this.showSavedMessages.set(true);
    if (this.isMobile()) this.mobilePanel.set('selector');
  }

  closeSavedMessages(): void {
    this.showSavedMessages.set(false);
  }

  // ── Thread methods ──

  /**
   * Whether the open thread was reached from one of the left-column lists —
   * search results or saved messages.
   *
   * Such a thread replaces the message list instead of sitting beside it. The
   * list stays on the left as the context the user is working from, and the
   * reply they picked does not appear in the main list at all — it only
   * contributes to the parent's reply count — so the conversation behind the
   * thread would show them nothing they asked for.
   *
   * A pinned row counts too. The panel it was opened from lives in the right
   * column and the thread takes that column over, so leaving the conversation
   * behind it in place would show the reader a list the reply they picked is
   * not even in — the main list keeps only the parent's reply count.
   */
  readonly threadFromList = signal(false);

  /**
   * Opens the thread panel for a given parent message.
   *
   * `goToMessageId` is set here rather than by the caller, and defaults to
   * clearing it. It is a one-shot instruction to the message list, but the
   * signal outlives the jump it was set for — so a thread opened later, from
   * anywhere, used to inherit the last pinned/saved/search target and fetch
   * around a message that has nothing to do with it. A brand-new thread would
   * then show a message despite having no replies at all.
   *
   * Set BEFORE the panel opens: the list reads it as it initialises, so a
   * later assignment lands after the fetch it was meant to steer.
   */
  showThreadPanel(
    message: CometChat.BaseMessage,
    options: { fromList?: boolean; goToMessageId?: number | null } = {}
  ): void {
    this.closeSidePanel();
    this.goToMessageId.set(options.goToMessageId ?? null);
    this.threadMessage.set(message);
    this.showThread.set(true);
    this.threadFromList.set(options.fromList ?? false);
  }

  /** Closes the thread panel and clears the thread message. */
  closeThreadPanel(): void {
    const wasOpen = this.showThread();
    this.threadMessage.set(null);
    this.showThread.set(false);
    this.threadFromList.set(false);
    if (wasOpen && this.isMobile() && this.mobilePanel() === 'side-panel') {
      this.mobilePanel.set('messages');
    }
  }

  // ── Mobile navigation ──

  /** Navigate to the messages panel (mobile). */
  navigateToMessages(): void {
    this.mobilePanel.set('messages');
  }

  /** Navigate to the selector panel (mobile). */
  navigateToSelector(): void {
    this.mobilePanel.set('selector');
  }

  /** Navigate to the side panel (mobile). */
  navigateToSidePanel(): void {
    this.mobilePanel.set('side-panel');
  }

  // ── Reset ──

  /** Resets all navigation state to defaults. */
  reset(): void {
    this.sidePanelView.set('none');
    this.threadMessage.set(null);
    this.showThread.set(false);
    this.threadFromList.set(false);
    this.selectedCallLog.set(null);
    this.mobilePanel.set('selector');
    this.goToMessageId.set(null);
  }
}
