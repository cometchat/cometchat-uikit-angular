import { Component, computed, inject, OnInit, OnDestroy, signal, ViewEncapsulation } from '@angular/core';
import { Subscription } from 'rxjs';
import {
  CometChatMessageListComponent,
  CometChatMessageComposerComponent,
  CometChatThreadHeaderComponent,
  CometChatUserEvents,
  CometChatLocalize,
  ChatStateService,
  TranslatePipe,
} from '@cometchat/chat-uikit-angular';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { NavigationService } from '../../services/navigation.service';
import { UserService } from '../../services/user.service';
import { ToastService } from '../../services/toast.service';

/**
 * CometChatThreadedMessagesComponent
 *
 * Displays a threaded message view using the UIKit's CometChatThreadHeader,
 * MessageList in thread mode, and a MessageComposer.
 *
 * - Reads thread message from NavigationService.threadMessage signal
 * - Passes parentMessage to ThreadHeader for preview + reply count
 * - Passes parentMessageId to MessageList and MessageComposer for thread mode
 * - Hides "Reply in thread" option since we're already in a thread
 * - Back click delegates to NavigationService.closeThreadPanel()
 */
@Component({
  selector: 'cometchat-threaded-messages',
  standalone: true,
  imports: [
    CometChatThreadHeaderComponent,
    CometChatMessageListComponent,
    CometChatMessageComposerComponent,
    TranslatePipe,
  ],
  templateUrl: './cometchat-threaded-messages.component.html',
  styleUrls: ['./cometchat-threaded-messages.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class CometChatThreadedMessagesComponent implements OnInit, OnDestroy {
  private navigationService = inject(NavigationService);
  private chatStateService = inject(ChatStateService);
  private userService = inject(UserService);
  private toastService = inject(ToastService);

  private subscriptions: Subscription[] = [];

  /** Controls composer visibility based on user block state */
  protected showComposer = signal(true);

  /** The parent message for this thread */
  protected parentMessage = this.navigationService.threadMessage;

  /** Parent message ID for the UIKit list and composer */
  protected parentMessageId = computed(() => this.parentMessage()?.getId());

  /** Reply count from the parent message */
  protected replyCount = computed(() =>
    this.parentMessage()?.getReplyCount?.() ?? 0
  );

  ngOnInit(): void {
    this.initComposerVisibility();
    this.subscribeToUserEvents();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
    this.subscriptions = [];
  }

  /** Close the thread panel */
  onBackClick(): void {
    this.navigationService.closeThreadPanel();
  }

  /** Unblock the active user — called from the blocked banner */
  async onUnblockUser(): Promise<void> {
    const user = this.chatStateService.getActiveUser();
    if (!user) return;
    try {
      await this.userService.unblockUser(user.getUid());
      user.setBlockedByMe(false);
      CometChatUserEvents.ccUserUnblocked.next(user);
      this.toastService.showSuccess(
        CometChatLocalize.getLocalizedString('unblocked_successfully')
      );
    } catch {
      this.toastService.showError(
        CometChatLocalize.getLocalizedString('SOMETHING_WRONG')
      );
    }
  }

  /** Check initial block state from the active user and parent message sender */
  private initComposerVisibility(): void {
    const activeUser = this.chatStateService.getActiveUser();
    const parentMsg = this.parentMessage();
    // Also check the parent message sender for a potentially more up-to-date block state
    const sender = parentMsg?.getSender?.();
    const userToCheck = (sender instanceof CometChat.User) ? sender : activeUser;

    if (this.isUserBlocked(userToCheck)) {
      this.showComposer.set(false);
      return;
    }

    // Subscribe reactively to active user changes so stale state is caught
    this.subscriptions.push(
      this.chatStateService.activeUser$.subscribe((user: CometChat.User | null) => {
        if (user) {
          this.showComposer.set(!this.isUserBlocked(user));
        }
      })
    );
  }

  /** Returns true if the user is blocked in either direction */
  private isUserBlocked(user: CometChat.User | null | undefined): boolean {
    if (!user) return false;
    return !!(user.getBlockedByMe() || user.getHasBlockedMe());
  }

  /** Subscribe to user block/unblock events to toggle composer visibility */
  private subscribeToUserEvents(): void {
    this.subscriptions.push(
      CometChatUserEvents.ccUserBlocked.subscribe((user: CometChat.User) => {
        if (this.isUserBlocked(user)) {
          this.showComposer.set(false);
        }
      }),
      CometChatUserEvents.ccUserUnblocked.subscribe((user: CometChat.User) => {
        if (!this.isUserBlocked(user)) {
          this.showComposer.set(true);
        }
      }),
    );
  }
}
