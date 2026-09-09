import { Component, ElementRef, EventEmitter, HostListener, inject, OnInit, Output, signal, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import {
  CometChatConversationsComponent,
  CometChatUsersComponent,
  CometChatGroupsComponent,
  CometChatCallLogsComponent,
  CometChatUIKit,
  TranslatePipe,
  safeEffect,
} from '@cometchat/chat-uikit-angular';
import { AppStateService } from '../../services/app-state.service';
import { AuthService } from '../../services/auth.service';
import { NavigationService } from '../../services/navigation.service';
import { GroupService } from '../../services/group.service';

/**
 * CometChatSelectorComponent
 *
 * Switches between UIKit list components based on the active tab.
 * Delegates item selection to AppStateService and handles
 * tab-specific actions (context menu for chats, create group button).
 */
@Component({
  selector: 'cometchat-selector',
  standalone: true,
  imports: [
    CommonModule,
    CometChatConversationsComponent,
    CometChatUsersComponent,
    CometChatGroupsComponent,
    CometChatCallLogsComponent,
    TranslatePipe,
  ],
  templateUrl: './cometchat-selector.component.html',
  styleUrls: ['./cometchat-selector.component.css'],
})
export class CometChatSelectorComponent implements OnInit {
  protected appStateService = inject(AppStateService);
  private authService = inject(AuthService);
  private navigationService = inject(NavigationService);
  private groupService = inject(GroupService);
  private elementRef = inject(ElementRef);

  protected activeTab = this.appStateService.activeTab;

  /** Emitted when the search bar in conversations is clicked */
  @Output() searchBarClick = new EventEmitter<void>();

  /** Toggle for the chats context menu dropdown */
  protected showContextMenu = signal(false);

  /** Logged-in user's display name for the context menu */
  protected loggedInUserName = signal('');

  /** Close context menu when the active tab changes */
  private tabChangeEffect = safeEffect(() => {
    this.activeTab(); // track the signal
    this.showContextMenu.set(false);
  });

  /** Close context menu on any click outside the menu wrapper */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.showContextMenu()) return;
    const menuWrapper = this.elementRef.nativeElement.querySelector('.cometchat-selector__menu-wrapper');
    if (menuWrapper && !menuWrapper.contains(event.target as Node)) {
      this.showContextMenu.set(false);
    }
  }

  ngOnInit(): void {
    const user = CometChatUIKit.getLoggedInUser();
    this.loggedInUserName.set(user?.getName() ?? '');
  }

  /** Custom menu template for conversations list */
  @ViewChild('conversationsMenu', { static: true })
  conversationsMenuRef!: TemplateRef<any>;

  /** Custom menu template for groups list */
  @ViewChild('groupsMenu', { static: true })
  groupsMenuRef!: TemplateRef<any>;

  // ── Conversation handlers ──

  onSearchBarClick(): void {
    this.searchBarClick.emit();
  }

  onConversationClick(conversation: CometChat.Conversation): void {
    this.appStateService.setSelectedConversation(conversation);

    const entity = conversation.getConversationWith();
    if (entity instanceof CometChat.User) {
      this.appStateService.setSelectedUser(entity);
    } else if (entity instanceof CometChat.Group) {
      this.appStateService.setSelectedGroup(entity);
    }

    if (this.navigationService.isMobile()) {
      this.navigationService.navigateToMessages();
    }
  }

  // ── User handlers ──

  onUserClick(user: CometChat.User): void {
    this.appStateService.setSelectedUser(user);
    if (this.navigationService.isMobile()) {
      this.navigationService.navigateToMessages();
    }
  }

  // ── Group handlers ──

  async onGroupClick(group: CometChat.Group): Promise<void> {
    if (group.getHasJoined()) {
      this.appStateService.setSelectedGroup(group);
      if (this.navigationService.isMobile()) {
        this.navigationService.navigateToMessages();
      }
      return;
    }

    const groupType = group.getType();
    if (groupType === CometChat.GROUP_TYPE.PASSWORD) {
      this.appStateService.pendingJoinGroup.set(group);
      this.appStateService.showJoinGroup.set(true);
      return;
    }

    // Public group — auto-join
    try {
      const joined = await this.groupService.joinGroup(
        group.getGuid(),
        groupType
      );
      this.appStateService.setSelectedGroup(joined);
      if (this.navigationService.isMobile()) {
        this.navigationService.navigateToMessages();
      }
    } catch {
      // Error toast already shown by GroupService
    }
  }

  // ── Call log handlers ──

  onCallLogClick(callLog: any): void {
    this.navigationService.showCallLogDetailsPanel(callLog);
    if (this.navigationService.isMobile()) {
      this.navigationService.navigateToSidePanel();
    }
  }

  // ── Context menu actions (Chats tab) ──

  toggleContextMenu(): void {
    this.showContextMenu.update((v) => !v);
  }

  closeContextMenu(): void {
    this.showContextMenu.set(false);
  }

  onNewChat(): void {
    this.showContextMenu.set(false);
    this.navigationService.closeSidePanel();
    this.navigationService.closeThreadPanel();
    this.appStateService.showNewChat.set(true);
    if (this.navigationService.isMobile()) {
      this.navigationService.navigateToMessages();
    }
  }

  /**
   * Opens the user-level saved-messages list over the conversation list.
   * No mobile navigation: it replaces this very column, so the user is already
   * looking at the right panel.
   */
  onSavedMessages(): void {
    this.showContextMenu.set(false);
    this.navigationService.openSavedMessages();
  }

  onLogout(): void {
    this.showContextMenu.set(false);
    this.authService.logout();
  }

  // ── Create group action (Groups tab) ──

  onCreateGroup(): void {
    this.appStateService.showCreateGroup.set(true);
  }
}
