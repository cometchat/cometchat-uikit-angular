import {CometChat} from '@cometchat/chat-sdk-javascript';
import {CometChatUIKitConstants} from '../../constants';
import {ContextMenuItem} from '../base-elements/cometchat-context-menu/cometchat-context-menu.component';

export function handleOptionClickImpl(self: any, option: ContextMenuItem, message: CometChat.BaseMessage): void {
  switch (option.id) {
    case CometChatUIKitConstants.MessageOption.copyMessage:
      self.copyMessageToClipboard(message);
      break;
    case CometChatUIKitConstants.MessageOption.deleteMessage:
      self.showDeleteConfirmation(message);
      break;
    case CometChatUIKitConstants.MessageOption.translateMessage:
      self.translateMessage(message);
      break;
    case CometChatUIKitConstants.MessageOption.flagMessage:
      self.showFlagConfirmation(message);
      break;
    case CometChatUIKitConstants.MessageOption.sendMessagePrivately:
      self.handleMessagePrivately(message);
      break;
    case CometChatUIKitConstants.MessageOption.replyMessage:
      self.onReplyMessage(message.getId());
      break;
    case CometChatUIKitConstants.MessageOption.editMessage:
      self.onEditMessage(message.getId());
      break;
    case CometChatUIKitConstants.MessageOption.messageInformation:
      self.onMessageInfo(message.getId());
      break;
    case CometChatUIKitConstants.MessageOption.reactToMessage:
      self.showEmojiKeyboardForMessage(message);
      break;
    case CometChatUIKitConstants.MessageOption.replyInThread:
      self.threadRepliesClick.emit(message);
      break;
    case CometChatUIKitConstants.MessageOption.threadSubscription:
      self.toggleThreadSubscription(message);
      break;
    case CometChatUIKitConstants.MessageOption.pinMessage:
      self.requestPinSave('pin', message);
      break;
    case CometChatUIKitConstants.MessageOption.unpinMessage:
      self.requestPinSave('unpin', message);
      break;
    case CometChatUIKitConstants.MessageOption.saveMessage:
      self.requestPinSave('save', message);
      break;
    case CometChatUIKitConstants.MessageOption.unsaveMessage:
      self.requestPinSave('unsave', message);
      break;
    case CometChatUIKitConstants.MessageOption.markAsUnread:
      self.markMessageAsUnread(message);
      break;
    default:
      break;
  }
}
