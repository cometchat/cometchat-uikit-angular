import { Injectable, inject } from '@angular/core';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatLocalize } from '@cometchat/chat-uikit-angular';
import { ToastService } from './toast.service';

/**
 * GroupService
 *
 * Wraps CometChat SDK group operations with toast notifications
 * for success and error feedback.
 */
@Injectable({ providedIn: 'root' })
export class GroupService {
  private toastService = inject(ToastService);

  /** Shorthand for a localized string. */
  private t(key: string): string {
    return CometChatLocalize.getLocalizedString(key);
  }

  /**
   * The message to show when an SDK call fails.
   * The SDK's own message is English-only, so the localized fallback is shown
   * to the user and the raw detail goes to the console for debugging.
   */
  private failureMessage(error: unknown, key: string): string {
    if (error instanceof Error) {
      // eslint-disable-next-line no-console
      console.error('[GroupService]', error);
    }
    return this.t(key);
  }

  /** Create a new group. */
  async createGroup(name: string, type: string, password?: string): Promise<CometChat.Group> {
    try {
      const guid = `group_${Date.now()}`;
      const group = new CometChat.Group(guid, name, type as CometChat.GroupType);
      if (password) {
        group.setPassword(password);
      }
      const created = await CometChat.createGroup(group);
      this.toastService.showSuccess(this.t('group_created_successfully'));
      return created;
    } catch (error: unknown) {
      this.toastService.showError(this.failureMessage(error, 'group_create_failed'));
      throw error;
    }
  }

  /** Join an existing group. */
  async joinGroup(guid: string, type: string, password?: string): Promise<CometChat.Group> {
    try {
      const joined = await CometChat.joinGroup(guid, type as CometChat.GroupType, password ?? '');
      this.toastService.showSuccess(this.t('group_joined_successfully'));
      return joined;
    } catch (error: unknown) {
      this.toastService.showError(this.failureMessage(error, 'group_join_failed'));
      throw error;
    }
  }

  /** Leave a group. */
  async leaveGroup(guid: string): Promise<boolean> {
    try {
      const result = await CometChat.leaveGroup(guid);
      this.toastService.showSuccess(this.t('group_left_toast'));
      return result;
    } catch (error: unknown) {
      this.toastService.showError(this.failureMessage(error, 'leave_group_error'));
      throw error;
    }
  }

  /** Delete a group (owner only). */
  async deleteGroup(guid: string): Promise<boolean> {
    try {
      const result = await CometChat.deleteGroup(guid);
      this.toastService.showSuccess(this.t('group_deleted_successfully'));
      return result;
    } catch (error: unknown) {
      this.toastService.showError(this.failureMessage(error, 'group_delete_failed'));
      throw error;
    }
  }

  /** Add members to a group. */
  async addMembers(guid: string, members: CometChat.GroupMember[]): Promise<void> {
    try {
      await CometChat.addMembersToGroup(guid, members, []);
      this.toastService.showSuccess(this.t('members_added_successfully'));
    } catch (error: unknown) {
      this.toastService.showError(this.failureMessage(error, 'members_add_failed'));
      throw error;
    }
  }

  /** Unban a member from a group. */
  async unbanMember(guid: string, uid: string): Promise<void> {
    try {
      await CometChat.unbanGroupMember(guid, uid);
      this.toastService.showSuccess(this.t('member_unbanned_toast'));
    } catch (error: unknown) {
      this.toastService.showError(this.failureMessage(error, 'member_unban_failed'));
      throw error;
    }
  }

  /** Transfer group ownership to another member. */
  async transferOwnership(guid: string, uid: string): Promise<void> {
    try {
      await CometChat.transferGroupOwnership(guid, uid);
      this.toastService.showSuccess(this.t('ownership_transferred_successfully'));
    } catch (error: unknown) {
      this.toastService.showError(this.failureMessage(error, 'ownership_transfer_failed'));
      throw error;
    }
  }
}
