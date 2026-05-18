import { Component, computed, effect, inject, signal, TemplateRef, ViewChild, ViewEncapsulation, OnInit, OnDestroy } from '@angular/core';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { Subscription } from 'rxjs';
import {
  ChatStateService,
  CometChatAvatarComponent,
  CometChatConfirmDialogComponent,
  CometChatConversationEvents,
  CometChatGroupEvents,
  CometChatGroupMembersComponent,
  CometChatMessageEvents,
  CometChatUIKit,
  ConversationsService,
  TranslatePipe,
  CometChatLocalize,
  IGroupMemberAdded,
  IGroupMemberKickedBanned,
} from '@cometchat/chat-uikit-angular';
import { GroupService } from '../../services/group.service';
import { NavigationService } from '../../services/navigation.service';
import { AppStateService } from '../../services/app-state.service';
import { ToastService } from '../../services/toast.service';
import { CometChatBannedMembersComponent } from '../cometchat-banned-members/cometchat-banned-members.component';
import { CometChatTransferOwnershipComponent } from '../cometchat-transfer-ownership/cometchat-transfer-ownership.component';

@Component({
  selector: 'cometchat-group-details',
  standalone: true,
  imports: [
    CometChatAvatarComponent,
    CometChatConfirmDialogComponent,
    CometChatGroupMembersComponent,
    CometChatBannedMembersComponent,
    TranslatePipe,
    CometChatTransferOwnershipComponent
  ],
  templateUrl: './cometchat-group-details.component.html',
  styleUrls: ['./cometchat-group-details.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class CometChatGroupDetailsComponent implements OnInit, OnDestroy {
  private chatStateService = inject(ChatStateService);
  private conversationsService = inject(ConversationsService);
  private groupService = inject(GroupService);
  private navigationService = inject(NavigationService);
  private appStateService = inject(AppStateService);
  private toastService = inject(ToastService);

  private subscriptions: Subscription[] = [];
  private groupListenerId = '';

  protected leaveLoading = signal(false);

  /** Confirmation dialog visibility */
  protected showDeleteChatConfirm = signal(false);
  protected showDeleteGroupConfirm = signal(false);
  protected showLeaveGroupConfirm = signal(false);

  /** Transfer ownership dialog and panel visibility */
  protected showTransferOwnershipDialog = signal(false);
  protected showTransferOwnershipPanel = signal(false);

  /** Toggle between 'members' and 'banned' list */
  protected activeListTab = signal<'members' | 'banned'>('members');

  /**
   * Tracks whether a message has been sent/received for the active group.
   * Used to reactively enable the delete chat button when the conversation
   * initially had no messages but one arrives while the panel is open.
   */
  protected hasReceivedMessage = signal(false);

  /**
   * Standalone member count signal — initialized from the group object,
   * then updated reactively by group events (add, kick, ban).
   */
  protected memberCount = signal(0);

  protected group = this.chatStateService.activeGroup;
  protected conversation = this.chatStateService.activeConversation;

  protected userScope = computed(() => {
    const g = this.group();
    return g?.getScope?.() ?? '';
  });

  protected isOwner = computed(() => {
    const g = this.group();
    const loggedInUser = CometChatUIKit.getLoggedInUser();
    if (!g || !loggedInUser) return false;
    return g.getOwner() === loggedInUser.getUid();
  });
  protected isAdmin = computed(() => this.userScope() === CometChat.GROUP_MEMBER_SCOPE.ADMIN);
  protected canAddMembers = computed(() => this.isOwner() || this.isAdmin());
  protected canViewBanned = computed(() => this.isOwner() || this.isAdmin());
  protected canDeleteGroup = computed(() => this.isOwner());

  /** Whether delete chat should be disabled (fresh conversation with no messages) */
  protected isDeleteChatDisabled = computed(() => {
    if (this.hasReceivedMessage()) return false;
    const conv = this.conversation();
    if (conv) return !conv.getLastMessage?.();
    // ENG-35099: When opened from Groups tab, conversation() is null because
    // setActiveConversation() was never called — only setActiveGroup() was.
    // Enable delete if a group is active.
    const g = this.group();
    return !g;
  });

  @ViewChild('emptyHeader', { static: true })
  emptyHeaderRef!: TemplateRef<void>;

  @ViewChild('deleteChatDialog') deleteChatDialog!: CometChatConfirmDialogComponent;
  @ViewChild('deleteGroupDialog') deleteGroupDialog!: CometChatConfirmDialogComponent;
  @ViewChild('leaveGroupDialog') leaveGroupDialog!: CometChatConfirmDialogComponent;

  ngOnInit(): void {
    // Initialize member count from the group object
    this.memberCount.set(this.group()?.getMembersCount?.() ?? 0);
    this.subscribeToMessageEvents();
    this.subscribeToGroupEvents();
    this.attachSDKGroupListener();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
    if (this.groupListenerId) {
      CometChat.removeGroupListener(this.groupListenerId);
    }
  }

  /**
   * Subscribe to message sent/received events so the delete chat button
   * becomes enabled when a message arrives for a previously empty conversation.
   */
  private subscribeToMessageEvents(): void {
    const markHasMessage = (message: any) => {
      const g = this.group();
      if (!g) return;
      const msg = message?.message ?? message;
      if (!msg) return;
      const receiverId = msg.getReceiverId?.();
      if (receiverId === g.getGuid()) {
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

  /**
   * Subscribe to group member events to keep the member count in sync.
   */
  private subscribeToGroupEvents(): void {
    const guid = this.group()?.getGuid();
    if (!guid) return;

    this.subscriptions.push(
      CometChatGroupEvents.ccGroupMemberAdded.subscribe((data: IGroupMemberAdded) => {
        if (data.userAddedIn?.getGuid() === guid) {
          // Use the group object's updated member count as source of truth.
          // The add-members component calls setMembersCount() on the group
          // object before emitting this event, so getMembersCount() reflects
          // the correct total. Using set() instead of update() avoids
          // double-counting if the SDK listener also fires.
          const updatedCount = data.userAddedIn.getMembersCount();
          if (updatedCount > 0) {
            this.memberCount.set(updatedCount);
          } else {
            this.memberCount.update((c) => c + data.usersAdded.length);
          }
        }
      }),
      CometChatGroupEvents.ccGroupMemberKicked.subscribe((data: IGroupMemberKickedBanned) => {
        if (data.kickedFrom?.getGuid() === guid) {
          this.memberCount.update((c) => c - 1);
        }
      }),
      CometChatGroupEvents.ccGroupMemberBanned.subscribe((data: IGroupMemberKickedBanned) => {
        if (data.kickedFrom?.getGuid() === guid) {
          this.memberCount.update((c) => c - 1);
        }
      }),
    );
  }

  /**
   * Effect that watches sidePanelView changes. When navigating back
   * from add-members to group-details, refreshes the member count
   * from the group object to ensure it reflects any newly added members.
   */
  private previousPanelView = this.navigationService.sidePanelView();
  private panelVisibilityEffect = effect(() => {
    const currentView = this.navigationService.sidePanelView();
    if (this.previousPanelView === 'add-members' && currentView === 'group-details') {
      const count = this.group()?.getMembersCount?.() ?? 0;
      if (count > 0) {
        this.memberCount.set(count);
      }
    }
    this.previousPanelView = currentView;
  }, { allowSignalWrites: true });

  /**
   * Attach SDK GroupListener for real-time group member events.
   * Updates member count and group state when other users perform actions
   * (matches HomeComponent's SDK group listener pattern).
   */
  private attachSDKGroupListener(): void {
    const g = this.group();
    if (!g) return;

    this.groupListenerId = `GroupDetailsListener_${Date.now()}`;
    const loggedInUser = CometChatUIKit.getLoggedInUser();

    CometChat.addGroupListener(
      this.groupListenerId,
      new CometChat.GroupListener({
        onGroupMemberBanned: (
          _message: CometChat.Action,
          _bannedUser: CometChat.User,
          _bannedBy: CometChat.User,
          bannedFrom: CometChat.Group
        ) => {
          if (bannedFrom.getGuid() !== g.getGuid()) return;
          this.memberCount.set(bannedFrom.getMembersCount());
          this.chatStateService.setActiveGroup(bannedFrom);
        },
        onGroupMemberKicked: (
          _message: CometChat.Action,
          _kickedUser: CometChat.User,
          _kickedBy: CometChat.User,
          kickedFrom: CometChat.Group
        ) => {
          if (kickedFrom.getGuid() !== g.getGuid()) return;
          this.memberCount.set(kickedFrom.getMembersCount());
          this.chatStateService.setActiveGroup(kickedFrom);
        },
        onMemberAddedToGroup: (
          _message: CometChat.Action,
          _userAdded: CometChat.User,
          _userAddedBy: CometChat.User,
          userAddedIn: CometChat.Group
        ) => {
          if (userAddedIn.getGuid() !== g.getGuid()) return;
          this.memberCount.set(userAddedIn.getMembersCount());
        },
        onGroupMemberJoined: (
          _message: CometChat.Action,
          _joinedUser: CometChat.User,
          joinedGroup: CometChat.Group
        ) => {
          if (joinedGroup.getGuid() !== g.getGuid()) return;
          this.memberCount.set(joinedGroup.getMembersCount());
        },
        onGroupMemberLeft: (
          _message: CometChat.Action,
          _leavingUser: CometChat.User,
          leftGroup: CometChat.Group
        ) => {
          if (leftGroup.getGuid() !== g.getGuid()) return;
          this.memberCount.set(leftGroup.getMembersCount());
          this.chatStateService.setActiveGroup(leftGroup);
        },
        onGroupMemberScopeChanged: (
          _message: CometChat.Action,
          changedUser: CometChat.User,
          _newScope: CometChat.GroupMemberScope,
          _oldScope: CometChat.GroupMemberScope,
          changedGroup: CometChat.Group
        ) => {
          if (changedGroup.getGuid() !== g.getGuid()) return;
          if (changedUser.getUid() === loggedInUser?.getUid()) {
            this.chatStateService.setActiveGroup(changedGroup);
          }
        },
      })
    );
  }

  setActiveListTab(tab: 'members' | 'banned'): void {
    this.activeListTab.set(tab);
  }

  onClose(): void {
    this.navigationService.closeSidePanel();
    if (this.navigationService.isMobile()) {
      this.navigationService.navigateToMessages();
    }
  }

  onAddMembers(): void {
    this.navigationService.showAddMembersPanel();
  }

  /** Show delete chat confirmation */
  onDeleteChatClick(): void {
    if (this.isDeleteChatDisabled()) return;
    this.showDeleteChatConfirm.set(true);
  }

  /** Confirm delete chat */
  async onDeleteChatConfirm(): Promise<void> {
    const g = this.group();
    if (!g) return;

    try {
      // Use UIKit's ConversationsService to delete + remove from list
      this.conversationsService.removeConversation(g.getGuid());
      await CometChat.deleteConversation(g.getGuid(), 'group');
      this.toastService.showSuccess(
        CometChatLocalize.getLocalizedString('chat_deleted_successfully')
      );
      this.deleteChatDialog?.setSuccess();
      this.showDeleteChatConfirm.set(false);
      this.chatStateService.clearActiveChat();
      this.navigationService.reset();
    } catch {
      this.deleteChatDialog?.setError();
    }
  }

  onDeleteChatCancel(): void {
    this.showDeleteChatConfirm.set(false);
  }

  /** Show leave group confirmation or transfer ownership dialog for owners */
  onLeaveGroupClick(): void {
    if (this.isOwner()) {
      this.showTransferOwnershipDialog.set(true);
    } else {
      this.showLeaveGroupConfirm.set(true);
    }
  }

  /** Confirm leave group */
  async onLeaveGroupConfirm(): Promise<void> {
    const g = this.group();
    if (!g || this.leaveLoading()) return;
    this.leaveLoading.set(true);
    try {
      // Call SDK to leave the group
      await CometChat.leaveGroup(g.getGuid());

      // Remove conversation from list
      this.conversationsService.removeConversation(g.getGuid());

      // Emit ccGroupLeft event (wrapped in try-catch so event errors don't affect the leave flow)
      try {
        const loggedInUser = CometChatUIKit.getLoggedInUser();
        if (loggedInUser) {
          const action = new CometChat.Action(
            g.getGuid(),
            'groupMember',
            CometChat.RECEIVER_TYPE.GROUP,
            CometChat.CATEGORY_ACTION as CometChat.MessageCategory
          );
          action.setAction(CometChat.ACTION_TYPE.MEMBER_LEFT);
          action.setActionBy(loggedInUser);
          action.setActionOn(loggedInUser);
          action.setActionFor(g);
          action.setReceiver(g);
          action.setSender(loggedInUser);

          CometChatGroupEvents.ccGroupLeft.next({
            userLeft: loggedInUser,
            leftGroup: g,
            message: action,
          });
        }
      } catch {
        // Event emission errors should not block the leave flow
      }

      this.toastService.showSuccess(
        CometChatLocalize.getLocalizedString('group_left_successfully')
      );
      this.leaveGroupDialog?.setSuccess();
      this.showLeaveGroupConfirm.set(false);
      this.chatStateService.clearActiveChat();
      this.navigationService.reset();
    } catch (error: unknown) {
      const errMsg = (error as { message?: string })?.message ?? '';
      // Show user-friendly toast for the error
      if (errMsg.toLowerCase().includes('owner')) {
        this.toastService.showError(
          CometChatLocalize.getLocalizedString('details_transfer_ownership_message')
        );
      } else {
        this.toastService.showError(
          errMsg || CometChatLocalize.getLocalizedString('leave_group_error')
        );
      }
      this.leaveGroupDialog?.setError();
    } finally {
      this.leaveLoading.set(false);
    }
  }

  onLeaveGroupCancel(): void {
    this.showLeaveGroupConfirm.set(false);
  }

  /** Open the transfer ownership panel */
  onTransferOwnershipClick(): void {
    this.showTransferOwnershipDialog.set(false);
    this.showTransferOwnershipPanel.set(true);
  }

  /** Close the transfer ownership dialog */
  onTransferOwnershipCancel(): void {
    this.showTransferOwnershipDialog.set(false);
  }

  /** Close the transfer ownership panel */
  onTransferOwnershipPanelClose(): void {
    this.showTransferOwnershipPanel.set(false);
  }

  /** Show delete group confirmation */
  onDeleteGroupClick(): void {
    if (!this.isOwner()) return;
    this.showDeleteGroupConfirm.set(true);
  }

  /** Confirm delete group */
  async onDeleteGroupConfirm(): Promise<void> {
    const g = this.group();
    if (!g || !this.isOwner()) return;

    try {
      await this.groupService.deleteGroup(g.getGuid());

      // Remove conversation from list
      this.conversationsService.removeConversation(g.getGuid());

      CometChatGroupEvents.ccGroupDeleted.next(g);
      this.toastService.showSuccess(
        CometChatLocalize.getLocalizedString('group_left_and_chat_deleted')
      );
      this.deleteGroupDialog?.setSuccess();
      this.showDeleteGroupConfirm.set(false);
      this.chatStateService.clearActiveChat();
      this.navigationService.reset();
    } catch {
      this.deleteGroupDialog?.setError();
    }
  }

  onDeleteGroupCancel(): void {
    this.showDeleteGroupConfirm.set(false);
  }
}
