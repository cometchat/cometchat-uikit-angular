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
    'none' | 'user-details' | 'group-details' | 'add-members' | 'banned-members' | 'transfer-ownership' | 'search' | 'call-log-details'
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

  // ── Thread methods ──

  /** Opens the thread panel for a given parent message. */
  showThreadPanel(message: CometChat.BaseMessage): void {
    this.closeSidePanel();
    this.threadMessage.set(message);
    this.showThread.set(true);
  }

  /** Closes the thread panel and clears the thread message. */
  closeThreadPanel(): void {
    const wasOpen = this.showThread();
    this.threadMessage.set(null);
    this.showThread.set(false);
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
    this.selectedCallLog.set(null);
    this.mobilePanel.set('selector');
    this.goToMessageId.set(null);
  }
}
