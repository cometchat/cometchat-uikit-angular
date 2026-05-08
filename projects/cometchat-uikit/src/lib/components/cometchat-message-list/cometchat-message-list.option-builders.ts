/**
 * Extracted getMessageOptions logic for CometChatMessageListComponent.
 */
import {CometChat} from '@cometchat/chat-sdk-javascript';
import {CometChatActionsIcon} from '../../modals/CometChatActionsIcon';
import {CometChatUIKitConstants} from '../../constants';
import {CometChatLocalize} from '../../resources/CometChatLocalize/cometchat-localize';

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
  if (!ctx.hideCopyMessageOption && message.getType() === 'text') {
    options.push(new CometChatActionsIcon({ id: CometChatUIKitConstants.MessageOption.copyMessage, title: CometChatLocalize.getLocalizedString('message_list_option_copy'), iconURL: 'assets/Copy.svg', onClick: () => {} }));
  }
  const sender = message.getSender();
  const isOwnMessage = ctx.loggedInUser && sender?.getUid() === ctx.loggedInUser.getUid();
  if (!ctx.hideEditMessageOption && isOwnMessage && message.getType() === 'text') {
    options.push(new CometChatActionsIcon({ id: 'edit', title: CometChatLocalize.getLocalizedString('message_list_option_edit'), iconURL: 'assets/edit_icon.svg', onClick: () => {} }));
  }
  if (!ctx.hideDeleteMessageOption && isOwnMessage) {
    options.push(new CometChatActionsIcon({ id: CometChatUIKitConstants.MessageOption.deleteMessage, title: CometChatLocalize.getLocalizedString('message_list_option_delete'), iconURL: 'assets/delete.svg', onClick: () => {} }));
  }
  if (!ctx.hideTranslateMessageOption && message.getType() === 'text') {
    options.push(new CometChatActionsIcon({ id: CometChatUIKitConstants.MessageOption.translateMessage, title: CometChatLocalize.getLocalizedString('message_list_option_translate'), iconURL: 'assets/translate.svg', onClick: () => {} }));
  }
  if (!ctx.hideMessageInfoOption && isOwnMessage) {
    options.push(new CometChatActionsIcon({ id: 'info', title: CometChatLocalize.getLocalizedString('message_list_option_info'), iconURL: 'assets/info_icon.svg', onClick: () => {} }));
  }
  if (!ctx.hideFlagMessageOption && !isOwnMessage && message.getCategory() === CometChatUIKitConstants.MessageCategory.message) {
    options.push(new CometChatActionsIcon({ id: CometChatUIKitConstants.MessageOption.flagMessage, title: CometChatLocalize.getLocalizedString('message_list_option_flag_message'), iconURL: 'assets/flags.svg', onClick: () => {} }));
  }
  if (!ctx.hideMessagePrivatelyOption && ctx.group && !isOwnMessage) {
    options.push(new CometChatActionsIcon({ id: CometChatUIKitConstants.MessageOption.sendMessagePrivately, title: CometChatLocalize.getLocalizedString('message_list_option_message_privately'), iconURL: 'assets/send_message_privately.svg', onClick: () => {} }));
  }
  if (ctx.showMarkAsUnreadOption && !isOwnMessage && !message.getDeletedAt() && message.getCategory() === CometChatUIKitConstants.MessageCategory.message) {
    options.push(new CometChatActionsIcon({ id: CometChatUIKitConstants.MessageOption.markAsUnread, title: CometChatLocalize.getLocalizedString('message_list_option_mark_as_unread'), iconURL: 'assets/mark_as_unread.svg', onClick: () => {} }));
  }
  if (ctx.additionalOptions.length > 0) { options.push(...ctx.additionalOptions); }
  if (ctx.optionsOverride) { return ctx.optionsOverride(message, options); }
  return options;
}
