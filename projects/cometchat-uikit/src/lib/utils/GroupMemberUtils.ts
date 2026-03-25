import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatUIKitConstants } from '../constants';
import { CometChatOption } from '../modals/CometChatOption';
import { getLocalizedString } from '../resources/CometChatLocalize/cometchat-localize';
import { CometChatUIKitUtility } from '../CometChatUIKitUtility';

/**
 * Interface for the permission matrix entries.
 * Each entry maps a scope combination to allowed actions.
 */
type GroupMemberPermissions = Record<
  string,
  {
    kick: boolean;
    ban: boolean;
    unban: boolean;
    changeScope: string[];
  }
>;

/**
 * Permission matrix mapping `loggedInUserScope + targetMemberScope` to allowed actions.
 *
 * Hierarchy: owner > admin > moderator > participant
 * - Owner can act on admin, moderator, participant
 * - Admin can kick/ban moderator and participant; can change scope for admin, moderator, participant
 * - Moderator can kick/ban participant only; can change scope for participant only
 * - Participant cannot act on anyone
 * - No user can act on the owner
 */
const _allowedGroupMemberOptions: GroupMemberPermissions = {
  // Participant acting on others — no permissions
  [CometChatUIKitConstants.groupMemberScope.participant +
  CometChatUIKitConstants.groupMemberScope.participant]: {
    kick: false,
    ban: false,
    unban: false,
    changeScope: [],
  },
  [CometChatUIKitConstants.groupMemberScope.participant +
  CometChatUIKitConstants.groupMemberScope.moderator]: {
    kick: false,
    ban: false,
    unban: false,
    changeScope: [],
  },
  [CometChatUIKitConstants.groupMemberScope.participant +
  CometChatUIKitConstants.groupMemberScope.admin]: {
    kick: false,
    ban: false,
    unban: false,
    changeScope: [],
  },
  [CometChatUIKitConstants.groupMemberScope.participant +
  CometChatUIKitConstants.groupMemberScope.owner]: {
    kick: false,
    ban: false,
    unban: false,
    changeScope: [],
  },

  // Moderator acting on others
  [CometChatUIKitConstants.groupMemberScope.moderator +
  CometChatUIKitConstants.groupMemberScope.participant]: {
    kick: true,
    ban: true,
    unban: true,
    changeScope: [
      CometChatUIKitConstants.groupMemberScope.participant,
      CometChatUIKitConstants.groupMemberScope.moderator,
    ],
  },
  [CometChatUIKitConstants.groupMemberScope.moderator +
  CometChatUIKitConstants.groupMemberScope.moderator]: {
    kick: false,
    ban: false,
    unban: true,
    changeScope: [],
  },
  [CometChatUIKitConstants.groupMemberScope.moderator +
  CometChatUIKitConstants.groupMemberScope.admin]: {
    kick: false,
    ban: false,
    unban: true,
    changeScope: [],
  },
  [CometChatUIKitConstants.groupMemberScope.moderator +
  CometChatUIKitConstants.groupMemberScope.owner]: {
    kick: false,
    ban: false,
    unban: true,
    changeScope: [],
  },

  // Admin acting on others
  [CometChatUIKitConstants.groupMemberScope.admin +
  CometChatUIKitConstants.groupMemberScope.participant]: {
    kick: true,
    ban: true,
    unban: true,
    changeScope: [
      CometChatUIKitConstants.groupMemberScope.participant,
      CometChatUIKitConstants.groupMemberScope.admin,
      CometChatUIKitConstants.groupMemberScope.moderator,
    ],
  },
  [CometChatUIKitConstants.groupMemberScope.admin +
  CometChatUIKitConstants.groupMemberScope.moderator]: {
    kick: true,
    ban: true,
    unban: true,
    changeScope: [
      CometChatUIKitConstants.groupMemberScope.participant,
      CometChatUIKitConstants.groupMemberScope.admin,
      CometChatUIKitConstants.groupMemberScope.moderator,
    ],
  },
  [CometChatUIKitConstants.groupMemberScope.admin + CometChatUIKitConstants.groupMemberScope.admin]:
    {
      kick: false,
      ban: false,
      unban: true,
      changeScope: [
        CometChatUIKitConstants.groupMemberScope.participant,
        CometChatUIKitConstants.groupMemberScope.admin,
        CometChatUIKitConstants.groupMemberScope.moderator,
      ],
    },
  [CometChatUIKitConstants.groupMemberScope.admin + CometChatUIKitConstants.groupMemberScope.owner]:
    {
      kick: false,
      ban: false,
      unban: true,
      changeScope: [],
    },

  // Owner acting on others
  [CometChatUIKitConstants.groupMemberScope.owner +
  CometChatUIKitConstants.groupMemberScope.participant]: {
    kick: true,
    ban: true,
    unban: true,
    changeScope: [
      CometChatUIKitConstants.groupMemberScope.participant,
      CometChatUIKitConstants.groupMemberScope.admin,
      CometChatUIKitConstants.groupMemberScope.moderator,
    ],
  },
  [CometChatUIKitConstants.groupMemberScope.owner +
  CometChatUIKitConstants.groupMemberScope.moderator]: {
    kick: true,
    ban: true,
    unban: true,
    changeScope: [
      CometChatUIKitConstants.groupMemberScope.participant,
      CometChatUIKitConstants.groupMemberScope.admin,
      CometChatUIKitConstants.groupMemberScope.moderator,
    ],
  },
  [CometChatUIKitConstants.groupMemberScope.owner + CometChatUIKitConstants.groupMemberScope.admin]:
    {
      kick: true,
      ban: true,
      unban: true,
      changeScope: [
        CometChatUIKitConstants.groupMemberScope.participant,
        CometChatUIKitConstants.groupMemberScope.admin,
        CometChatUIKitConstants.groupMemberScope.moderator,
      ],
    },
};

/**
 * A utility class for handling group member-related actions and options within CometChat.
 * Provides pure static methods — no Angular DI needed.
 *
 * Used by CometChatGroupMembers and CometChatBannedMembers components.
 */
export class GroupMemberUtils {
  /**
   * Returns available options for a member based on the permission matrix.
   * Returns `CometChatOption[]` if actions are available, or the member's scope string if no actions.
   *
   * If the target member is the group owner, returns the owner scope string (no actions allowed).
   *
   * @param groupMember - The target group member
   * @param group - The group the member belongs to
   * @param loggedInUserUid - The UID of the currently logged-in user
   * @param config - Optional flags to hide specific options
   * @returns An array of CometChatOption or the member's scope string
   */
  static getViewMemberOptions(
    groupMember: CometChat.GroupMember,
    group: CometChat.Group,
    loggedInUserUid = '',
    config?: {
      hideKickMemberOption?: boolean;
      hideBanMemberOption?: boolean;
      hideScopeChangeOption?: boolean;
    }
  ): CometChatOption[] | string {
    // Owner cannot be acted upon — return scope string
    if (group.getOwner() === groupMember.getUid()) {
      return CometChatUIKitConstants.groupMemberScope.owner;
    }

    // Determine the logged-in user's effective scope
    const loggedInUserScope: string =
      group.getOwner() === loggedInUserUid
        ? CometChatUIKitConstants.groupMemberScope.owner
        : (group.getScope() ?? CometChatUIKitConstants.groupMemberScope.participant);

    const permissionKey = loggedInUserScope + groupMember.getScope();
    const permissions = _allowedGroupMemberOptions[permissionKey];

    // If no permissions entry found, return scope string
    if (!permissions) {
      return groupMember.getScope();
    }

    const isKickAllowed = !config?.hideKickMemberOption && permissions.kick;
    const isBanAllowed = !config?.hideBanMemberOption && permissions.ban;
    const isChangeScopeAllowed =
      !config?.hideScopeChangeOption && permissions.changeScope.length > 0;

    const options: CometChatOption[] = [];

    if (isKickAllowed) {
      options.push(
        new CometChatOption({
          id: CometChatUIKitConstants.GroupMemberOptions.kick,
          title: getLocalizedString('members_remove'),
        })
      );
    }

    if (isBanAllowed) {
      options.push(
        new CometChatOption({
          id: CometChatUIKitConstants.GroupMemberOptions.ban,
          title: getLocalizedString('members_block'),
        })
      );
    }

    if (isChangeScopeAllowed) {
      options.push(
        new CometChatOption({
          id: CometChatUIKitConstants.GroupMemberOptions.changeScope,
          title: getLocalizedString('members_change_role'),
        })
      );
    }

    // If no options available, return the member's scope string
    if (options.length === 0) {
      return groupMember.getScope();
    }

    return options;
  }

  /**
   * Returns the allowed scopes for a scope change operation.
   * The member's current scope is moved to the front of the list if present.
   *
   * @param group - The group the member belongs to
   * @param groupMember - The member whose scope may be changed
   * @returns An array of allowed scope strings
   */
  static allowScopeChange(group: CometChat.Group, groupMember: CometChat.GroupMember): string[] {
    const loggedInUserScope: string =
      group.getScope() ?? CometChatUIKitConstants.groupMemberScope.participant;
    const permissionKey = loggedInUserScope + groupMember.getScope();
    const permissions = _allowedGroupMemberOptions[permissionKey];

    if (!permissions) {
      return [];
    }

    // Clone the array to avoid mutating the permission matrix
    const scopes = [...permissions.changeScope];

    // Move the member's current scope to the front if present
    if (scopes.length > 0 && scopes.includes(groupMember.getScope())) {
      const index = scopes.indexOf(groupMember.getScope());
      scopes.splice(index, 1);
      scopes.unshift(groupMember.getScope());
    }

    return scopes;
  }

  /**
   * Creates a CometChat.GroupMember from a User with participant scope.
   *
   * @param user - The user to convert
   * @param group - The group the member will belong to
   * @returns A new GroupMember with participant scope
   */
  static createParticipantGroupMember(
    user: CometChat.User,
    group: CometChat.Group
  ): CometChat.GroupMember {
    const groupMember = new CometChat.GroupMember(
      user.getUid(),
      CometChatUIKitConstants.groupMemberScope.participant as CometChat.GroupMemberScope
    );
    groupMember.setName(user.getName());
    groupMember.setGuid(group.getGuid());
    groupMember.setUid(user.getUid());
    groupMember.setAvatar(user.getAvatar());
    groupMember.setStatus(user.getStatus());
    return groupMember;
  }

  /**
   * Creates an Action message for group member operations (kick, ban, scope change).
   *
   * @param actionOn - The group member the action is performed on
   * @param action - The action type (e.g., kicked, banned, scopeChanged)
   * @param group - The group where the action occurs
   * @param loggedInUser - The user performing the action
   * @returns A CometChat.Action message
   */
  static createActionMessage(
    actionOn: CometChat.GroupMember,
    action: string,
    group: CometChat.Group,
    loggedInUser: CometChat.User
  ): CometChat.Action {
    const actionMessage = new CometChat.Action(
      group.getGuid(),
      CometChatUIKitConstants.MessageTypes.groupMember,
      CometChatUIKitConstants.MessageReceiverType.group,
      CometChatUIKitConstants.MessageCategory.action as CometChat.MessageCategory
    );
    actionMessage.setAction(action);
    actionMessage.setActionBy(loggedInUser);
    actionMessage.setSender(loggedInUser);
    actionMessage.setMessage(`${loggedInUser.getUid()} ${action} ${actionOn.getUid()}`);
    actionMessage.setActionFor(group);
    actionMessage.setActionOn(actionOn);
    actionMessage.setReceiver(group);
    actionMessage.setConversationId('group_' + group.getGuid());
    actionMessage.setMuid(CometChatUIKitUtility.ID());
    actionMessage.setSentAt(CometChatUIKitUtility.getUnixTimestamp());
    actionMessage.setReceiverType(CometChatUIKitConstants.MessageReceiverType.group);
    actionMessage.setData({
      extras: {
        scope: {
          new: actionOn.getScope(),
        },
      },
    });
    return actionMessage;
  }
}
