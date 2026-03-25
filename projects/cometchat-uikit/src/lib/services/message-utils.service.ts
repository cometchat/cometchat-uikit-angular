import { Injectable, TemplateRef } from '@angular/core';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatTextFormatter } from '../formatters/cometchat-text-formatter';
import { MessageBubbleAlignment } from '../Enums/Enums';
import { CalendarObject } from '../resources/CometChatLocalize/localization.interfaces';
import { CometChatActionsIcon } from '../modals/CometChatActionsIcon';
import { CometChatActionsView } from '../modals/CometChatActionsView';
import { CometChatLocalize } from '../resources/CometChatLocalize/cometchat-localize';
import { CometChatUIKitConstants } from '../constants';

/**
 * MessageUtilsService provides utility functions for message-related operations
 * in the CometChat Angular UIKit.
 *
 * This service is used for:
 * - Getting action message text (joined, left, kicked, etc.)
 * - Distributing message options into quick and overflow groups
 * - Determining options position based on bubble alignment
 * - Building message bubbles from templates
 * - Determining user status visibility
 */
@Injectable({ providedIn: 'root' })
export class MessageUtilsService {
  // ============================================================================
  // View Retrieval Methods
  // ============================================================================


  // ============================================================================
  // Message Options Utilities
  // ============================================================================

  /**
   * Distributes message options into quick options and overflow options.
   *
   * Quick options are shown directly on the bubble for fast access.
   * Overflow options go into a context menu.
   *
   * @param options - The array of message options to distribute
   * @param quickOptionsCount - Number of options to show as quick options (default: 2)
   * @returns Object with `quickOptions` and `overflowOptions` arrays
   */
  distributeMessageOptions(
    options: (CometChatActionsIcon | CometChatActionsView)[],
    quickOptionsCount = 2
  ): {
    quickOptions: (CometChatActionsIcon | CometChatActionsView)[];
    overflowOptions: (CometChatActionsIcon | CometChatActionsView)[];
  } {
    if (!options || options.length === 0) {
      return { quickOptions: [], overflowOptions: [] };
    }
    if (quickOptionsCount <= 0) {
      return { quickOptions: [], overflowOptions: [...options] };
    }
    const splitPoint = Math.min(options.length, quickOptionsCount);
    return {
      quickOptions: options.slice(0, splitPoint),
      overflowOptions: options.slice(splitPoint),
    };
  }

  /**
   * Gets the CSS class for options positioning based on message bubble alignment.
   *
   * - Left alignment (incoming): options on the right side
   * - Right alignment (outgoing): options on the left side
   * - Center alignment (action): no options
   *
   * @param alignment - The message bubble alignment
   * @returns CSS class name for options positioning
   */
  getOptionsPositionClass(alignment: MessageBubbleAlignment): string {
    switch (alignment) {
      case MessageBubbleAlignment.left:
        return 'cometchat-message-bubble__options--right';
      case MessageBubbleAlignment.right:
        return 'cometchat-message-bubble__options--left';
      case MessageBubbleAlignment.center:
        return '';
      default:
        return 'cometchat-message-bubble__options--left';
    }
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Determines if the user's online status should be visible.
   */
  getUserStatusVisible(user: CometChat.User | CometChat.GroupMember): boolean {
    if (!user) {
      return false;
    }
    if (typeof user.getStatus !== 'function') {
      return false;
    }
    const status = user.getStatus();
    if (status === 'online' || status === 'available') {
      return true;
    }
    return status !== undefined && status !== null && status !== '';
  }

  /**
   * Gets the localized action message text for group action messages.
   *
   * Supported actions: ADDED, JOINED, LEFT, KICKED, BANNED, UNBANNED, SCOPE_CHANGE
   *
   * @param message - The CometChat action message
   * @returns Localized action message text
   */
  getActionMessage(message: CometChat.Action | CometChat.BaseMessage): string {
    if (!message) return '';
    let actionMessage = '';
    const actionMsg = message as any;

    if (!actionMsg.hasOwnProperty('actionBy') || !actionMsg.hasOwnProperty('actionOn')) {
      return actionMessage;
    }

    const action = actionMsg.action;

    if (
      action !== CometChatUIKitConstants.groupMemberAction.JOINED &&
      action !== CometChatUIKitConstants.groupMemberAction.LEFT &&
      (!actionMsg.actionBy?.hasOwnProperty('name') || !actionMsg.actionOn?.hasOwnProperty('name'))
    ) {
      return actionMessage;
    }

    if (action === CometChatUIKitConstants.groupMemberAction.SCOPE_CHANGE) {
      if (!actionMsg.data?.extras?.scope?.new) {
        return actionMessage;
      }
    }

    const byEntity = actionMsg.actionBy;
    const onEntity = actionMsg.actionOn;
    const byString = byEntity?.name || '';
    const forString =
      action !== CometChatUIKitConstants.groupMemberAction.JOINED &&
      action !== CometChatUIKitConstants.groupMemberAction.LEFT
        ? onEntity?.name || ''
        : '';

    switch (action) {
      case CometChatUIKitConstants.groupMemberAction.ADDED:
        actionMessage = `${byString} ${CometChatLocalize.getLocalizedString('message_list_action_added')} ${forString}`;
        break;
      case CometChatUIKitConstants.groupMemberAction.JOINED:
        actionMessage = `${byString} ${CometChatLocalize.getLocalizedString('message_list_action_joined')}`;
        break;
      case CometChatUIKitConstants.groupMemberAction.LEFT:
        actionMessage = `${byString} ${CometChatLocalize.getLocalizedString('message_list_action_left')}`;
        break;
      case CometChatUIKitConstants.groupMemberAction.KICKED:
        actionMessage = `${byString} ${CometChatLocalize.getLocalizedString('message_list_action_kicked')} ${forString}`;
        break;
      case CometChatUIKitConstants.groupMemberAction.BANNED:
        actionMessage = `${byString} ${CometChatLocalize.getLocalizedString('message_list_action_banned')} ${forString}`;
        break;
      case CometChatUIKitConstants.groupMemberAction.UNBANNED:
        actionMessage = `${byString} ${CometChatLocalize.getLocalizedString('message_list_action_unbanned')} ${forString}`;
        break;
      case CometChatUIKitConstants.groupMemberAction.SCOPE_CHANGE: {
        const newScope = actionMsg.data?.extras?.scope?.new || '';
        const scopeKey = `member_scope_${newScope}`;
        const localizedScope = CometChatLocalize.getLocalizedString(scopeKey) || newScope;
        actionMessage = `${byString} ${CometChatLocalize.getLocalizedString('message_list_action_made')} ${forString} ${localizedScope}`;
        break;
      }
      default:
        break;
    }

    return actionMessage;
  }
}
