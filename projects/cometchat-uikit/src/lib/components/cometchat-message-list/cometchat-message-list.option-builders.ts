/**
 * Extracted getMessageOptions logic for CometChatMessageListComponent.
 */
import {CometChat} from '@cometchat/chat-sdk-javascript';
import {CometChatActionsIcon} from '../../modals/CometChatActionsIcon';
import {CometChatUIKitConstants} from '../../constants';
import {CometChatLocalize} from '../../resources/CometChatLocalize/cometchat-localize';
import {hasMediaCaption} from '../../utils/message-metadata-utils';

/**
 * A message disapproved by moderation shows an error indicator on its bubble and must not be
 * editable — editing would let the sender slip a rejected message back into an approved state.
 * Mirrors the bubble's `isDisapprovedByModeration` getter, guarding the SDK method in case an
 * older Chat SDK build doesn't expose `getModerationStatus`.
 */
function isDisapprovedByModeration(message: CometChat.BaseMessage): boolean {
  const getStatus = (message as any).getModerationStatus;
  if (typeof getStatus !== 'function') return false;
  return getStatus.call(message) === CometChatUIKitConstants.moderationStatus.disapproved;
}

/**
 * A locally-rejected message can have no sender yet, in which case it was authored by the logged-in
 * user — so a missing sender counts as "mine". Mirrors the React kit's `isSentByMe`.
 */
function isSentByMe(loggedInUser: CometChat.User | null, message: CometChat.BaseMessage): boolean {
  const sender = message.getSender();
  return !sender || sender.getUid() === loggedInUser?.getUid();
}

/**
 * Options for a message disapproved by moderation. Matches the React kit's `getMessageOptions`
 * whitelist: a rejected message collapses to at most Delete + Copy — every other action
 * (react/reply/thread/edit/translate/info/flag/message-privately/mark-unread) is stripped so the
 * message can't be re-shared or re-surfaced. Returned directly (no `optionsOverride`), exactly as
 * React returns this list early.
 */
function getModeratedMessageOptions(ctx: MessageOptionsContext, message: CometChat.BaseMessage): CometChatActionsIcon[] {
  const options: CometChatActionsIcon[] = [];
  const isParticipant = ctx.group?.getScope() === CometChatUIKitConstants.groupMemberScope.participant;

  // Delete: the sender can always remove it; in a group a non-participant (moderator/admin/owner)
  // can too. Mirrors React's `(isSentByMe || (!isParticipant && group))`.
  if ((isSentByMe(ctx.loggedInUser, message) || (!isParticipant && !!ctx.group)) && !ctx.hideDeleteMessageOption) {
    options.push(new CometChatActionsIcon({ id: CometChatUIKitConstants.MessageOption.deleteMessage, title: CometChatLocalize.getLocalizedString('message_list_option_delete'), iconURL: 'assets/delete.svg', onClick: () => {} }));
  }

  // Copy: text messages only (captioned media is NOT copyable here), matching React.
  if (message.getType() === 'text' && !ctx.hideCopyMessageOption) {
    options.push(new CometChatActionsIcon({ id: CometChatUIKitConstants.MessageOption.copyMessage, title: CometChatLocalize.getLocalizedString('message_list_option_copy'), iconURL: 'assets/Copy.svg', onClick: () => {} }));
  }

  return options;
}

export interface MessageOptionsContext {
  loggedInUser: CometChat.User | null;
  group: CometChat.Group | null | undefined;
  hideReactionOption: boolean;
  hideReplyOption: boolean;
  hideReplyInThreadOption: boolean;
  hideCopyMessageOption: boolean;
  hideEditMessageOption: boolean;
  hideDeleteMessageOption: boolean;
  hideTranslateMessageOption: boolean;
  hideMessageInfoOption: boolean;
  hideFlagMessageOption: boolean;
  hideMessagePrivatelyOption: boolean;
  showMarkAsUnreadOption: boolean;
  additionalOptions: CometChatActionsIcon[];
  optionsOverride?: ((message: CometChat.BaseMessage, options: CometChatActionsIcon[]) => CometChatActionsIcon[]) | null;
}

export function getMessageOptionsImpl(ctx: MessageOptionsContext, message: CometChat.BaseMessage): CometChatActionsIcon[] {
  if (message.getDeletedAt()) return [];
  // A moderation-rejected message gets the restricted (Delete + Copy) set, matching the React kit.
  if (isDisapprovedByModeration(message)) return getModeratedMessageOptions(ctx, message);

  // Agentic messages (AI agent in group) get copy-only context menu
  if (message.getCategory() === CometChatUIKitConstants.MessageCategory.agentic) {
    if (ctx.hideCopyMessageOption) return [];
    return [
      new CometChatActionsIcon({
        id: CometChatUIKitConstants.MessageOption.copyMessage,
        title: CometChatLocalize.getLocalizedString('message_list_option_copy'),
        iconURL: 'assets/Copy.svg',
        onClick: () => {},
      }),
    ];
  }

  const options: CometChatActionsIcon[] = [];
  if (!ctx.hideReactionOption) {
    options.push(new CometChatActionsIcon({ id: CometChatUIKitConstants.MessageOption.reactToMessage, title: CometChatLocalize.getLocalizedString('message_list_option_react'), iconURL: 'assets/add_reaction_icon.svg', onClick: () => {} }));
  }
  if (!ctx.hideReplyOption && !message.getDeletedAt()) {
    options.push(new CometChatActionsIcon({ id: CometChatUIKitConstants.MessageOption.replyMessage, title: CometChatLocalize.getLocalizedString('message_list_option_reply_to_message'), iconURL: 'assets/reply.svg', onClick: () => {} }));
  }
  if (!ctx.hideReplyInThreadOption) {
    options.push(new CometChatActionsIcon({ id: CometChatUIKitConstants.MessageOption.replyInThread, title: CometChatLocalize.getLocalizedString('message_list_option_reply_in_thread'), iconURL: 'assets/reply_in_thread.svg', onClick: () => {} }));
  }
  // Copy and Edit act on the message's TEXT. A text message always has one; a media message has
  // one only when it carries a caption — so captioned media gets both options too (matching the
  // React kit's getMediaMessageOptions).
  const isTextual = message.getType() === 'text' || hasMediaCaption(message);
  if (!ctx.hideCopyMessageOption && isTextual) {
    options.push(new CometChatActionsIcon({ id: CometChatUIKitConstants.MessageOption.copyMessage, title: CometChatLocalize.getLocalizedString('message_list_option_copy'), iconURL: 'assets/Copy.svg', onClick: () => {} }));
  }
  const sender = message.getSender();
  const isOwnMessage = ctx.loggedInUser && sender?.getUid() === ctx.loggedInUser.getUid();
  if (!ctx.hideEditMessageOption && isOwnMessage && isTextual) {
    options.push(new CometChatActionsIcon({ id: 'edit', title: CometChatLocalize.getLocalizedString('message_list_option_edit'), iconURL: 'assets/edit_icon.svg', onClick: () => {} }));
  }
  if (!ctx.hideDeleteMessageOption && isOwnMessage) {
    options.push(new CometChatActionsIcon({ id: CometChatUIKitConstants.MessageOption.deleteMessage, title: CometChatLocalize.getLocalizedString('message_list_option_delete'), iconURL: 'assets/delete.svg', onClick: () => {} }));
  }
  if (!ctx.hideTranslateMessageOption && message.getType() === 'text') {
    options.push(new CometChatActionsIcon({ id: CometChatUIKitConstants.MessageOption.translateMessage, title: CometChatLocalize.getLocalizedString('message_list_option_translate'), iconURL: 'assets/translate.svg', onClick: () => {} }));
  }
  if (!ctx.hideMessageInfoOption && isOwnMessage) {
    options.push(new CometChatActionsIcon({ id: CometChatUIKitConstants.MessageOption.messageInformation, title: CometChatLocalize.getLocalizedString('message_list_option_info'), iconURL: 'assets/info_icon.svg', onClick: () => {} }));
  }
  // Developer cards get the same option set as text *minus* edit + copy
  // (both already gated to type==='text' above, so cards naturally exclude them).
  // flag / mark-as-unread are message-category-gated; include the card category so
  // a card matches the text option set, preserving the existing per-option conditions.
  const isMessageOrCard =
    message.getCategory() === CometChatUIKitConstants.MessageCategory.message ||
    message.getCategory() === CometChatUIKitConstants.MessageCategory.card;
  if (!ctx.hideFlagMessageOption && !isOwnMessage && isMessageOrCard) {
    options.push(new CometChatActionsIcon({ id: CometChatUIKitConstants.MessageOption.flagMessage, title: CometChatLocalize.getLocalizedString('message_list_option_flag_message'), iconURL: 'assets/flags.svg', onClick: () => {} }));
  }
  if (!ctx.hideMessagePrivatelyOption && ctx.group && !isOwnMessage) {
    options.push(new CometChatActionsIcon({ id: CometChatUIKitConstants.MessageOption.sendMessagePrivately, title: CometChatLocalize.getLocalizedString('message_list_option_message_privately'), iconURL: 'assets/send_message_privately.svg', onClick: () => {} }));
  }
  if (ctx.showMarkAsUnreadOption && !isOwnMessage && !message.getDeletedAt() && isMessageOrCard) {
    options.push(new CometChatActionsIcon({ id: CometChatUIKitConstants.MessageOption.markAsUnread, title: CometChatLocalize.getLocalizedString('message_list_option_mark_as_unread'), iconURL: 'assets/mark_as_unread.svg', onClick: () => {} }));
  }
  if (ctx.additionalOptions.length > 0) { options.push(...ctx.additionalOptions); }
  if (ctx.optionsOverride) { return ctx.optionsOverride(message, options); }
  return options;
}
