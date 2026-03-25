import { Component, inject, signal } from '@angular/core';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import {
  CometChatUsersComponent,
  CometChatGroupsComponent,
  TranslatePipe,
} from '@cometchat/chat-uikit-angular';
import { AppStateService } from '../../services/app-state.service';
import { NavigationService } from '../../services/navigation.service';
import { GroupService } from '../../services/group.service';

type NewChatTab = 'users' | 'groups';

/**
 * CometChatNewChatComponent
 *
 * Full-screen overlay for starting a new conversation.
 * Displays Users and Groups tabs with UIKit list components.
 * Handles user selection (set active + close) and group join flow
 * (auto-join public, password dialog for protected, skip private).
 */
@Component({
  selector: 'cometchat-new-chat',
  standalone: true,
  imports: [
    CometChatUsersComponent,
    CometChatGroupsComponent,
    TranslatePipe,
  ],
  templateUrl: './cometchat-new-chat.component.html',
  styleUrls: ['./cometchat-new-chat.component.css'],
})
export class CometChatNewChatComponent {
  private appStateService = inject(AppStateService);
  private navigationService = inject(NavigationService);
  private groupService = inject(GroupService);

  /** Currently active tab within the new chat view */
  protected activeTab = signal<NewChatTab>('users');

  /** Switch between Users and Groups tabs */
  onTabChange(tab: NewChatTab): void {
    this.activeTab.set(tab);
  }

  /** Close the new chat overlay */
  onBack(): void {
    this.appStateService.showNewChat.set(false);
    if (this.navigationService.isMobile()) {
      this.navigationService.navigateToSelector();
    }
  }

  /** Handle user selection — set active user and close */
  onUserClick(user: CometChat.User): void {
    this.appStateService.activeTab.set('chats');
    this.appStateService.setSelectedUser(user);
    this.appStateService.showNewChat.set(false);

    if (this.navigationService.isMobile()) {
      this.navigationService.navigateToMessages();
    }
  }

  /** Handle group selection — join flow if needed */
  async onGroupClick(group: CometChat.Group): Promise<void> {
    if (group.getHasJoined()) {
      this.appStateService.activeTab.set('chats');
      this.appStateService.setSelectedGroup(group);
      this.appStateService.showNewChat.set(false);

      if (this.navigationService.isMobile()) {
        this.navigationService.navigateToMessages();
      }
      return;
    }

    const groupType = group.getType();

    if (groupType === CometChat.GROUP_TYPE.PASSWORD) {
      // Show join group dialog for password-protected groups
      this.appStateService.pendingJoinGroup.set(group);
      this.appStateService.showJoinGroup.set(true);
      this.appStateService.showNewChat.set(false);
      return;
    }

    if (groupType === CometChat.GROUP_TYPE.PRIVATE) {
      // Private groups require invitation — cannot join directly
      return;
    }

    // Public group — auto-join
    try {
      const joined = await this.groupService.joinGroup(
        group.getGuid(),
        groupType
      );
      this.appStateService.activeTab.set('chats');
      this.appStateService.setSelectedGroup(joined);
      this.appStateService.showNewChat.set(false);

      if (this.navigationService.isMobile()) {
        this.navigationService.navigateToMessages();
      }
    } catch {
      // Error toast already shown by GroupService
    }
  }

  /** Keyboard handler for tab buttons */
  onTabKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      const next: NewChatTab = this.activeTab() === 'users' ? 'groups' : 'users';
      this.activeTab.set(next);

      const tablist = (event.target as HTMLElement).closest('[role="tablist"]');
      if (tablist) {
        const tabs = tablist.querySelectorAll<HTMLElement>('[role="tab"]');
        tabs.forEach((t) => {
          if (t.getAttribute('aria-selected') === 'false') {
            t.focus();
          }
        });
      }
    }
  }
}
