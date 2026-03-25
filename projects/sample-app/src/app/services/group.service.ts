import { Injectable, inject } from '@angular/core';
import { CometChat } from '@cometchat/chat-sdk-javascript';
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

  /** Create a new group. */
  async createGroup(name: string, type: string, password?: string): Promise<CometChat.Group> {
    try {
      const guid = `group_${Date.now()}`;
      const group = new CometChat.Group(guid, name, type as CometChat.GroupType);
      if (password) {
        group.setPassword(password);
      }
      const created = await CometChat.createGroup(group);
      this.toastService.showSuccess('Group created successfully');
      return created;
    } catch (error: any) {
      this.toastService.showError(error?.message ?? 'Failed to create group');
      throw error;
    }
  }

  /** Join an existing group. */
  async joinGroup(guid: string, type: string, password?: string): Promise<CometChat.Group> {
    try {
      const joined = await CometChat.joinGroup(guid, type as CometChat.GroupType, password ?? '');
      this.toastService.showSuccess('Joined group successfully');
      return joined;
    } catch (error: any) {
      this.toastService.showError(error?.message ?? 'Failed to join group');
      throw error;
    }
  }

  /** Leave a group. */
  async leaveGroup(guid: string): Promise<boolean> {
    try {
      const result = await CometChat.leaveGroup(guid);
      this.toastService.showSuccess('Left group successfully');
      return result;
    } catch (error: any) {
      this.toastService.showError(error?.message ?? 'Failed to leave group');
      throw error;
    }
  }

  /** Delete a group (owner only). */
  async deleteGroup(guid: string): Promise<boolean> {
    try {
      const result = await CometChat.deleteGroup(guid);
      this.toastService.showSuccess('Group deleted successfully');
      return result;
    } catch (error: any) {
      this.toastService.showError(error?.message ?? 'Failed to delete group');
      throw error;
    }
  }

  /** Add members to a group. */
  async addMembers(guid: string, members: CometChat.GroupMember[]): Promise<void> {
    try {
      await CometChat.addMembersToGroup(guid, members, []);
      this.toastService.showSuccess('Members added successfully');
    } catch (error: any) {
      this.toastService.showError(error?.message ?? 'Failed to add members');
      throw error;
    }
  }

  /** Unban a member from a group. */
  async unbanMember(guid: string, uid: string): Promise<void> {
    try {
      await CometChat.unbanGroupMember(guid, uid);
      this.toastService.showSuccess('Member unbanned successfully');
    } catch (error: any) {
      this.toastService.showError(error?.message ?? 'Failed to unban member');
      throw error;
    }
  }

  /** Transfer group ownership to another member. */
  async transferOwnership(guid: string, uid: string): Promise<void> {
    try {
      await CometChat.transferGroupOwnership(guid, uid);
      this.toastService.showSuccess('Ownership transferred successfully');
    } catch (error: any) {
      this.toastService.showError(error?.message ?? 'Failed to transfer ownership');
      throw error;
    }
  }
}
