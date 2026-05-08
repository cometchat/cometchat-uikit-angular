/**
 * Utility functions for GroupsService listener management.
 */

import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatLogger } from '../utils/CometChatLogger';

/** Callback interface for group listener events */
export interface GroupListenerCallbacks {
  isLoggedInUser: (user: CometChat.User) => boolean;
  updateGroupForSDKEvents: (params: {
    group: CometChat.Group;
    newScope?: string;
    newCount?: number;
    hasJoined?: boolean;
    addGroup?: boolean;
  }) => void;
  removeGroup: (guid: string) => void;
  updateGroup: (group: CometChat.Group) => void;
}

/**
 * Attaches a CometChat GroupListener with the provided callbacks.
 */
export function attachGroupListener(
  listenerId: string,
  callbacks: GroupListenerCallbacks
): void {
  const { isLoggedInUser, updateGroupForSDKEvents, removeGroup, updateGroup } = callbacks;
  try {
    CometChat.addGroupListener(
      listenerId,
      new CometChat.GroupListener({
        onGroupMemberJoined: (_msg: CometChat.Action, user: CometChat.User, group: CometChat.Group) => {
          const isLoggedIn = isLoggedInUser(user);
          updateGroupForSDKEvents({ group, newCount: group.getMembersCount(), hasJoined: isLoggedIn ? true : undefined, addGroup: isLoggedIn });
        },
        onGroupMemberLeft: (_msg: CometChat.Action, user: CometChat.User, group: CometChat.Group) => {
          if (isLoggedInUser(user)) { removeGroup(group.getGuid()); }
          else { updateGroupForSDKEvents({ group, newCount: group.getMembersCount() }); }
        },
        onGroupMemberKicked: (_msg: CometChat.Action, user: CometChat.User, _by: CometChat.User, group: CometChat.Group) => {
          if (isLoggedInUser(user)) { removeGroup(group.getGuid()); }
          else { updateGroupForSDKEvents({ group, newCount: group.getMembersCount() }); }
        },
        onGroupMemberBanned: (_msg: CometChat.Action, user: CometChat.User, _by: CometChat.User, group: CometChat.Group) => {
          if (isLoggedInUser(user)) { removeGroup(group.getGuid()); }
          else { updateGroupForSDKEvents({ group, newCount: group.getMembersCount() }); }
        },
        onGroupMemberScopeChanged: (_msg: CometChat.Action, user: CometChat.User, newScope: string, _old: string, group: CometChat.Group) => {
          if (isLoggedInUser(user)) { updateGroupForSDKEvents({ group, newScope }); }
          else { updateGroup(group); }
        },
        onMemberAddedToGroup: (_msg: CometChat.Action, user: CometChat.User, _by: CometChat.User, group: CometChat.Group) => {
          const isLoggedIn = isLoggedInUser(user);
          updateGroupForSDKEvents({ group, newCount: group.getMembersCount(), hasJoined: isLoggedIn ? true : undefined, addGroup: isLoggedIn });
        },
      })
    );
  } catch (error) {
    CometChatLogger.error('GroupsService', 'Error attaching group listener:', error);
  }
}
