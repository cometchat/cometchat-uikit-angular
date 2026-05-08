import { Injectable, inject, signal } from '@angular/core';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import {
  ChatStateService,
  IPanel,
  IModal,
  IDialog,
  IShowOngoingCall,
} from '@cometchat/chat-uikit-angular';
import { NavigationService } from './navigation.service';

/**
 * AppStateService
 *
 * Manages application-level state specific to the sample app (not the UIKit).
 * Handles active tab, dialog visibility, and delegates entity selection
 * to the UIKit's ChatStateService.
 */
@Injectable({ providedIn: 'root' })
export class AppStateService {
  private chatStateService = inject(ChatStateService);
  private navigationService = inject(NavigationService);

  /** Currently active tab in the main navigation */
  activeTab = signal<'chats' | 'calls' | 'users' | 'groups'>('chats');

  /** Whether the new chat view is visible */
  showNewChat = signal(false);

  /** Whether the create group dialog is visible */
  showCreateGroup = signal(false);

  /** Whether the join group dialog is visible */
  showJoinGroup = signal(false);

  /** Group pending password entry for join flow */
  pendingJoinGroup = signal<CometChat.Group | null>(null);

  /** Whether the current active chat is a fresh conversation (no messages yet) */
  isFreshChat = signal(false);

  /** Panel content from ccShowPanel/ccHidePanel */
  panelContent = signal<IPanel | null>(null);

  /** Modal content from ccShowModal/ccHideModal */
  modalContent = signal<IModal | null>(null);

  /** Dialog content from ccShowDialog/ccHideDialog */
  dialogContent = signal<IDialog | null>(null);

  /** Ongoing call content from ccShowOngoingCall */
  ongoingCallContent = signal<IShowOngoingCall | null>(null);

  /**
   * Switches the active tab and resets navigation state.
   * Clears side panel, thread views, and overlay pages (new chat,
   * create group, join group) when changing tabs.
   */
  setActiveTab(tab: 'chats' | 'calls' | 'users' | 'groups'): void {
    this.activeTab.set(tab);
    this.showNewChat.set(false);
    this.showCreateGroup.set(false);
    this.showJoinGroup.set(false);
    this.chatStateService.clearActiveChat();
    this.navigationService.reset();
  }

  /**
   * Sets the selected user as the active chat entity.
   * Delegates to UIKit's ChatStateService which handles
   * mutual exclusivity (clears active group automatically).
   */
  setSelectedUser(user: CometChat.User): void {
    this.navigationService.setGotoMessageId(null);
    this.chatStateService.setActiveUser(user);
    this.chatStateService.setActiveGroup(null);
    this.navigationService.closeThreadPanel();
    this.navigationService.closeSidePanel();
  }

  /**
   * Sets the selected group as the active chat entity.
   * Delegates to UIKit's ChatStateService which handles
   * mutual exclusivity (clears active user automatically).
   */
  setSelectedGroup(group: CometChat.Group): void {
    this.navigationService.setGotoMessageId(null);
    this.chatStateService.setActiveGroup(group);
    this.chatStateService.setActiveUser(null);
    this.navigationService.closeThreadPanel();
    this.navigationService.closeSidePanel();
  }

  /**
   * Sets the selected conversation as the active chat entity.
   * ChatStateService automatically extracts the User or Group
   * from the conversation and sets it as active.
   */
  setSelectedConversation(conversation: CometChat.Conversation): void {
    this.navigationService.setGotoMessageId(null);
    this.chatStateService.setActiveConversation(conversation);
    this.navigationService.closeThreadPanel();
    this.navigationService.closeSidePanel();
  }

  /**
   * Resets all app state to defaults.
   * Called on logout and other full-reset scenarios.
   */
  reset(): void {
    this.activeTab.set('chats');
    this.showNewChat.set(false);
    this.showCreateGroup.set(false);
    this.showJoinGroup.set(false);
    this.pendingJoinGroup.set(null);
    this.isFreshChat.set(false);
    this.panelContent.set(null);
    this.modalContent.set(null);
    this.dialogContent.set(null);
    this.ongoingCallContent.set(null);
    this.chatStateService.clearActiveChat();
  }
}
