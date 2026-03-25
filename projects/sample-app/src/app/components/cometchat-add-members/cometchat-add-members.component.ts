import { Component, computed, inject, signal } from '@angular/core';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import {
  ChatStateService,
  CometChatGroupEvents,
  CometChatUIKit,
  CometChatUsersComponent,
  SelectionMode,
  TranslatePipe,
} from '@cometchat/chat-uikit-angular';
import { GroupService } from '../../services/group.service';
import { NavigationService } from '../../services/navigation.service';

/**
 * CometChatAddMembersComponent
 *
 * Side panel that wraps UIKit's CometChatUsers in multi-select mode.
 * Users select members, then click the add button to add them to the
 * active group via GroupService. Success/error toasts are handled by
 * GroupService internally.
 */
@Component({
  selector: 'cometchat-add-members',
  standalone: true,
  imports: [CometChatUsersComponent, TranslatePipe],
  templateUrl: './cometchat-add-members.component.html',
  styleUrls: ['./cometchat-add-members.component.css'],
})
export class CometChatAddMembersComponent {
  private chatStateService = inject(ChatStateService);
  private groupService = inject(GroupService);
  private navigationService = inject(NavigationService);

  /** Expose SelectionMode for the template */
  protected readonly SelectionMode = SelectionMode;

  /** Locally tracked selected users */
  protected selectedUsers = signal<Map<string, CometChat.User>>(new Map());

  /** Loading state while adding members */
  protected addLoading = signal(false);

  /** Active group from ChatStateService */
  protected group = this.chatStateService.activeGroup;

  /** Number of selected users (computed signal for reliable template reactivity) */
  protected selectedCount = computed(() => this.selectedUsers().size);

  /** Go back to the details panel */
  onClose(): void {
    this.navigationService.showDetailsPanel();
  }
  /**
   * No-op handler to prevent UIKit from setting activeUser on click.
   * When itemClick is observed, the UIKit component emits instead of
   * falling back to chatStateService.setActiveUser(), which would
   * trigger unwanted navigation.
   */
  onUserItemClick(_user: CometChat.User): void {
    // intentionally empty – selection is handled via (select)
  }

  /** Handle user selection/deselection from UIKit component */
  onSelectionChange(event: { user: CometChat.User; selected: boolean }): void {
    this.selectedUsers.update((current) => {
      const updated = new Map(current);
      if (event.selected) {
        updated.set(event.user.getUid(), event.user);
      } else {
        updated.delete(event.user.getUid());
      }
      return updated;
    });
  }

  /** Add selected users as group members */
  async onAddMembers(): Promise<void> {
    const g = this.group();
    if (!g || this.addLoading() || this.selectedCount() === 0) return;

    this.addLoading.set(true);

    try {
      const users = Array.from(this.selectedUsers().values());
      const members = users.map((user) => {
        const member = new CometChat.GroupMember(
          user.getUid(),
          CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT
        );
        return member;
      });

      await this.groupService.addMembers(g.getGuid(), members);

      // Emit ccGroupMemberAdded so action messages appear in realtime
      const loggedInUser = CometChatUIKit.getLoggedInUser();
      if (loggedInUser) {
        const actionMessages: CometChat.Action[] = users.map((user) => {
          const action = new CometChat.Action(
            g.getGuid(),
            'groupMember',
            CometChat.RECEIVER_TYPE.GROUP,
            CometChat.CATEGORY_ACTION as CometChat.MessageCategory
          );
          action.setAction(CometChat.ACTION_TYPE.MEMBER_ADDED);
          action.setActionBy(loggedInUser);
          action.setActionOn(user);
          action.setActionFor(g);
          action.setReceiver(g);
          action.setSender(loggedInUser);
          action.setMessage(`${loggedInUser.getName()} added ${user.getName()}`);
          return action;
        });

        // Update member count on the group object for consistency
        g.setMembersCount(g.getMembersCount() + users.length);

        CometChatGroupEvents.ccGroupMemberAdded.next({
          messages: actionMessages,
          usersAdded: users,
          userAddedIn: g,
          userAddedBy: loggedInUser,
        });
      }

      this.navigationService.showDetailsPanel();
    } catch {
      // GroupService already shows error toast
    } finally {
      this.addLoading.set(false);
    }
  }
}
