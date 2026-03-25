import { Component, computed, effect, inject, OnInit, OnDestroy, signal, ViewChild, ViewEncapsulation } from '@angular/core';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import {
  ChatStateService,
  CometChatMessageHeaderComponent,
  CometChatMessageListComponent,
  CometChatMessageComposerComponent,
  CometChatUserEvents,
  CometChatLocalize,
  TranslatePipe,
} from '@cometchat/chat-uikit-angular';
import { Subscription } from 'rxjs';
import { NavigationService } from '../../services/navigation.service';
import { UserService } from '../../services/user.service';
import { ToastService } from '../../services/toast.service';

/**
 * CometChatMessagesComponent
 *
 * Composes UIKit's MessageHeader, MessageList, and MessageComposer
 * into a single messages view. Reads active user/group from
 * ChatStateService and wires navigation events to NavigationService.
 *
 * - Hides composer when the active user has blocked the logged-in user
 * - Header click → details panel
 * - Thread reply → thread panel
 * - Search icon → search panel
 * - Call buttons in header handle calls and overlays directly
 * - Supports goToMessageId for navigating to specific messages
 */
@Component({
  selector: 'cometchat-messages',
  standalone: true,
  imports: [
    CometChatMessageHeaderComponent,
    CometChatMessageListComponent,
    CometChatMessageComposerComponent,
    TranslatePipe,
  ],
  templateUrl: './cometchat-messages.component.html',
  styleUrls: ['./cometchat-messages.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class CometChatMessagesComponent implements OnInit, OnDestroy {
  private chatStateService = inject(ChatStateService);
  protected navigationService = inject(NavigationService);
  private userService = inject(UserService);
  private toastService = inject(ToastService);

  private subscriptions: Subscription[] = [];

  /** Reference to the UIKit message header for manual change detection */
  @ViewChild('messageHeader') messageHeaderRef?: CometChatMessageHeaderComponent;

  /** Active user from ChatStateService */
  protected activeUser = this.chatStateService.activeUser;

  /** Active group from ChatStateService */
  protected activeGroup = this.chatStateService.activeGroup;

  /** Show back button on mobile */
  protected showBackButton = computed(() => this.navigationService.isMobile());

  /**
   * Force the UIKit message header to re-evaluate when isMobile changes.
   * The UIKit's showBackButton is a plain @Input (not signal-backed),
   * so its internal computed doesn't track changes. We manually trigger
   * change detection on the child component to pick up the new value.
   */
  private showBackButtonSync = effect(() => {
    // Track the signal so the effect re-runs on change
    this.navigationService.isMobile();
    // Nudge the UIKit component's change detector
    this.messageHeaderRef?.['cdr']?.detectChanges();
  });

  /** Whether the composer should be hidden (user blocked by me) — local signal for realtime updates */
  protected isBlockedByMe = signal(false);

  /** Sync isBlockedByMe when the active user changes (switching conversations) */
  private activeUserSync = effect(() => {
    const user = this.activeUser();
    this.isBlockedByMe.set(user?.getBlockedByMe?.() ?? false);
  });

  /** goToMessageId from NavigationService, converted to string for the UIKit input */
  protected goToMessageId = computed(() => {
    const id = this.navigationService.goToMessageId();
    return id !== null ? String(id) : undefined;
  });

  // ── Lifecycle ──

  ngOnInit(): void {
    const u = this.activeUser();
    this.isBlockedByMe.set(u?.getBlockedByMe?.() ?? false);
    this.subscribeToUserEvents();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
    this.subscriptions = [];
  }

  private subscribeToUserEvents(): void {
    this.subscriptions.push(
      CometChatUserEvents.ccUserBlocked.subscribe((user: CometChat.User) => {
        const active = this.chatStateService.getActiveUser();
        if (active && active.getUid() === user.getUid()) {
          this.isBlockedByMe.set(true);
        }
      }),
      CometChatUserEvents.ccUserUnblocked.subscribe((user: CometChat.User) => {
        const active = this.chatStateService.getActiveUser();
        if (active && active.getUid() === user.getUid()) {
          this.isBlockedByMe.set(false);
        }
      }),
    );
  }

  /** Unblock the active user — called from the blocked banner */
  async onUnblockUser(): Promise<void> {
    const u = this.activeUser();
    if (!u) return;
    try {
      await this.userService.unblockUser(u.getUid());
      u.setBlockedByMe(false);
      CometChatUserEvents.ccUserUnblocked.next(u);
      this.toastService.showSuccess(
        CometChatLocalize.getLocalizedString('unblocked_successfully')
      );
    } catch {
      this.toastService.showError(
        CometChatLocalize.getLocalizedString('SOMETHING_WRONG')
      );
    }
  }

  // ── Event handlers ──

  /** Header back button click → clear active chat and go back to selector on mobile */
  onBackClick(): void {
    if (this.navigationService.isMobile()) {
      this.chatStateService.clearActiveChat();
      this.navigationService.closeSidePanel();
      this.navigationService.closeThreadPanel();
      this.navigationService.navigateToSelector();
    }
  }

  /** Header item click → show details panel */
  onHeaderItemClick(): void {
    this.navigationService.showDetailsPanel();
    if (this.navigationService.isMobile()) {
      this.navigationService.navigateToSidePanel();
    }
  }

  /** Header search click → show search panel */
  onSearchClick(): void {
    this.navigationService.showSearchPanel();
    if (this.navigationService.isMobile()) {
      this.navigationService.navigateToSidePanel();
    }
  }

  /** Thread reply click → show thread panel */
  onThreadRepliesClick(message: CometChat.BaseMessage): void {
    this.navigationService.showThreadPanel(message);
    if (this.navigationService.isMobile()) {
      this.navigationService.navigateToSidePanel();
    }
  }

}
