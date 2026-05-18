import { Component, computed, effect, inject, signal, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import {
  ChatStateService,
  CometChatAvatarComponent,
  CometChatConfirmDialogComponent,
  CometChatUserEvents,
  CometChatMessageEvents,
  ConversationsService,
  TranslatePipe,
  CometChatLocalize,
} from '@cometchat/chat-uikit-angular';
import { Subscription } from 'rxjs';
import { UserService } from '../../services/user.service';
import { NavigationService } from '../../services/navigation.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'cometchat-user-details',
  standalone: true,
  imports: [CometChatAvatarComponent, CometChatConfirmDialogComponent, TranslatePipe],
  templateUrl: './cometchat-user-details.component.html',
  styleUrls: ['./cometchat-user-details.component.css'],
})
export class CometChatUserDetailsComponent implements OnInit, OnDestroy {
  private chatStateService = inject(ChatStateService);
  private conversationsService = inject(ConversationsService);
  private userService = inject(UserService);
  private navigationService = inject(NavigationService);
  private toastService = inject(ToastService);

  private subscriptions: Subscription[] = [];

  /** Confirmation dialog visibility */
  protected showBlockConfirm = signal(false);
  protected showDeleteConfirm = signal(false);

  /**
   * Tracks whether a message has been sent/received for the active user.
   * Enables the delete chat button reactively when a message arrives
   * for a previously empty conversation.
   */
  protected hasReceivedMessage = signal(false);

  /** Active user from ChatStateService */
  protected user = this.chatStateService.activeUser;

  /** Active conversation from ChatStateService */
  protected conversation = this.chatStateService.activeConversation;

  /** Whether the user is blocked by the logged-in user — local signal for explicit control */
  protected isBlocked = signal(false);

  /** Sync isBlocked when the active user changes (switching conversations) */
  private activeUserSync = effect(() => {
    const u = this.user();
    this.isBlocked.set(u?.getBlockedByMe?.() ?? false);
    this.hasReceivedMessage.set(false);
  },{ allowSignalWrites: true});

  /** Whether the user is online */
  protected isOnline = computed(() => {
    const u = this.user();
    if (!u) return false;
    return u.getStatus?.() === 'online';
  });

  /** Whether delete should be disabled (no conversation or no messages yet) */
  protected isDeleteDisabled = computed(() => {
    if (this.hasReceivedMessage()) return false;
    const conv = this.conversation();
    if (conv) return !conv.getLastMessage?.();
    // ENG-35099: When opened from Users tab, conversation() is null because
    // setActiveConversation() was never called — only setActiveUser() was.
    // Enable delete if a user is active (CometChat.deleteConversation works
    // even without a conversation object in ChatStateService).
    const u = this.user();
    return !u;
  });

  /** Show status (hidden when user is blocked) */
  protected showStatus = computed(() => !this.isBlocked());

  @ViewChild('blockDialog') blockDialog!: CometChatConfirmDialogComponent;
  @ViewChild('deleteDialog') deleteDialog!: CometChatConfirmDialogComponent;

  ngOnInit(): void {
    // Initialize blocked state from the active user
    const u = this.user();
    this.isBlocked.set(u?.getBlockedByMe?.() ?? false);
    this.subscribeToUserEvents();
    this.subscribeToMessageEvents();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  private subscribeToUserEvents(): void {
    this.subscriptions.push(
      CometChatUserEvents.ccUserBlocked.subscribe((user) => {
        this.updateUserAfterBlockUnblock(user);
        if (this.isActiveUser(user)) {
          this.isBlocked.set(user.getBlockedByMe?.() ?? true);
        }
      }),
      CometChatUserEvents.ccUserUnblocked.subscribe((user) => {
        this.updateUserAfterBlockUnblock(user);
        if (this.isActiveUser(user)) {
          this.isBlocked.set(user.getBlockedByMe?.() ?? false);
        }
      }),
    );
  }

  /**
   * Subscribe to message sent/received events so the delete chat button
   * becomes enabled when a message arrives for a previously empty conversation.
   */
  private subscribeToMessageEvents(): void {
    const markHasMessage = (message: any) => {
      const u = this.user();
      if (!u) return;
      const msg = message?.message ?? message;
      if (!msg) return;
      const receiverId = msg.getReceiverId?.();
      const senderId = msg.getSender?.()?.getUid?.();
      if (receiverId === u.getUid() || senderId === u.getUid()) {
        this.hasReceivedMessage.set(true);
      }
    };

    this.subscriptions.push(
      CometChatMessageEvents.ccMessageSent.subscribe(markHasMessage),
      CometChatMessageEvents.onTextMessageReceived.subscribe(markHasMessage),
      CometChatMessageEvents.onMediaMessageReceived.subscribe(markHasMessage),
      CometChatMessageEvents.onCustomMessageReceived.subscribe(markHasMessage),
    );
  }

  onClose(): void {
    this.navigationService.closeSidePanel();
    if (this.navigationService.isMobile()) {
      this.navigationService.navigateToMessages();
    }
  }

  onBlockActionClick(): void {
    if (this.isBlocked()) {
      this.onUnblockUser();
    } else {
      this.showBlockConfirm.set(true);
    }
  }

  onDeleteActionClick(): void {
    if (this.isDeleteDisabled()) return;
    this.showDeleteConfirm.set(true);
  }

  async onBlockConfirm(): Promise<void> {
    const u = this.user();
    if (!u) return;

    try {
      await this.userService.blockUser(u.getUid());
      u.setBlockedByMe(true);
      CometChatUserEvents.ccUserBlocked.next(u);
      this.toastService.showSuccess(
        CometChatLocalize.getLocalizedString('blocked_successfully')
      );
      this.blockDialog?.setSuccess();
      this.showBlockConfirm.set(false);
    } catch {
      this.blockDialog?.setError();
    }
  }

  private async onUnblockUser(): Promise<void> {
    const u = this.user();
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

  async onDeleteConfirm(): Promise<void> {
    const u = this.user();
    if (!u) return;

    try {
      // Use UIKit's ConversationsService to remove from list
      this.conversationsService.removeConversation(u.getUid());
      await CometChat.deleteConversation(u.getUid(), 'user');
      this.toastService.showSuccess(
        CometChatLocalize.getLocalizedString('chat_deleted_successfully')
      );
      this.deleteDialog?.setSuccess();
      this.showDeleteConfirm.set(false);
      this.chatStateService.clearActiveChat();
      this.navigationService.reset();
    } catch {
      this.deleteDialog?.setError();
    }
  }

  onBlockCancel(): void {
    this.showBlockConfirm.set(false);
  }

  onDeleteCancel(): void {
    this.showDeleteConfirm.set(false);
  }

  private updateUserAfterBlockUnblock(user: CometChat.User): void {
    const activeUser = this.chatStateService.getActiveUser();
    if (activeUser && activeUser.getUid() === user.getUid()) {
      this.chatStateService.setActiveUser(user);
    }
  }

  private isActiveUser(user: CometChat.User): boolean {
    const activeUser = this.chatStateService.getActiveUser();
    return !!activeUser && activeUser.getUid() === user.getUid();
  }
}
