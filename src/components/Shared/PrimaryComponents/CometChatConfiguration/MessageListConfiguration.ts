import { MessageOptions } from "../../../Messages/CometChatMessageOptions/CometChatMessageOptions";
import { dateFormat, MessageListAlignment, timeFormat } from "../../Constants/UIKitConstants";
import { AvatarConfiguration } from "./AvatarConfiguration";
import { DateConfiguration } from "./DateConfiguration";
import { MessageBubbleConfiguration } from "./MessageBubbleConfiguration";
import { MessageReceiptConfiguration } from "./MessageReceiptConfiguration";
import { NewMessageIndicatorConfiguration } from "./NewMessageIndicatorConfiguration";
import { SmartReplyConfiguration } from "./SmartReplyConfiguration";
/**
 * @class MessageListConfiguration
 * @param {string} alignment
 * @param {array} messageTypes
 * @param {array} excludeMessageTypes
 * @param {array} excludeMessageOptions
 * @param {array} customMessageOptions
 * @param {number} limit
 * @param {boolean} onlyUnread
 * @param {boolean} hideMessagesFromBlockedUsers
 * @param {boolean} hideDeletedMessages
 * @param {string} threadParentMessageId
 * @param {boolean} hideThreadReplies
 * @param {array} tags
 * @param {object} dateConfiguration
  * @param {object} smartReplyConfiguration
 * @param {object} messageBubbleConfiguration
 * @param {object} messageOptionConfiguration
 * @param {object} avatarConfiguration
 * @param {object} messageReceiptConfiguration
 * @param {object} sentMessageInputData
 * @param {object} receivedMessageInputData
 * @param {string} loadingIconURL
 *  @param {any} customView
 *  @param {boolean} hideError
 */
class MessageListConfiguration {
  alignment: string = MessageListAlignment.left;
  messageTypes: any = [];

  excludeMessageTypes: any = [];
  excludeMessageOptions: any = [];
  customMessageOptions: any = [];
  limit: number = 30;
  onlyUnread: boolean = false;
  hideMessagesFromBlockedUsers: boolean = true;
  hideDeletedMessages: boolean = false;
  threadParentMessageId: string = "";
  hideThreadReplies: boolean = true;
  tags: any[] = [];
  dateConfiguration: DateConfiguration = new DateConfiguration({})
  smartReplyConfiguration: SmartReplyConfiguration = new SmartReplyConfiguration({})
  messageBubbleConfiguration: MessageBubbleConfiguration = new MessageBubbleConfiguration({})
  messageOptionConfiguration: MessageOptions = new MessageOptions({});
  newMessageIndicatorConfiguration:NewMessageIndicatorConfiguration = new NewMessageIndicatorConfiguration({})



  sentMessageInputData: any = {
    thumbnail: false,
    title: false,
    time: true,
    readReceipt: true,
  };
  receivedMessageInputData: any = {
    thumbnail: false,
    title: false,
    time: true,
    readReceipt: false,
  };
  loadingIconURL: string = "assets/resources/Spinner.svg";
  customView: any = {};
  hideError: boolean = false;


  constructor(
    {
      dateConfiguration = new DateConfiguration({
        pattern: dateFormat.dayDateFormat,
        dateFormat: "mm:dd:yyyy",
        timeFormat: timeFormat.twentyFourHours
      }),
      smartReplyConfiguration = new SmartReplyConfiguration({}),
      messageBubbleConfiguration = new MessageBubbleConfiguration({}),
      messageOptionConfiguration = new MessageOptions({}),
      alignment = MessageListAlignment.standard,
      messageTypes = [],

      excludeMessageTypes = [],
      excludeMessageOptions = [],
      customMessageOptions = [],
      limit = 30,
      onlyUnread = false,
      hideMessagesFromBlockedUsers = true,
      hideDeletedMessages = false,
      threadParentMessageId = "",
      hideThreadReplies = true,
      tags = [],

      sentMessageInputData = {
        thumbnail: false,
        title: false,
        time: true,
        readReceipt: true,
      },
      receivedMessageInputData = {
        thumbnail: true,
        title: true,
        time: true,
        readReceipt: false,
      },
      loadingIconURL = "assets/resources/Spinner.svg",
      customView = {},
      hideError = false,
      newMessageIndicatorConfiguration = new NewMessageIndicatorConfiguration({})


    }
  ) {
    this.alignment = alignment,
      this.messageTypes = messageTypes

    this.excludeMessageTypes = excludeMessageTypes
    this.excludeMessageOptions = excludeMessageOptions
    this.customMessageOptions = customMessageOptions
    this.limit = limit
    this.onlyUnread = onlyUnread
    this.hideMessagesFromBlockedUsers = hideMessagesFromBlockedUsers
    this.hideDeletedMessages = hideDeletedMessages
    this.threadParentMessageId = threadParentMessageId
    this.hideThreadReplies = hideThreadReplies
    this.tags = tags

    this.sentMessageInputData = sentMessageInputData
    this.receivedMessageInputData = receivedMessageInputData
    this.loadingIconURL = loadingIconURL
    this.customView = customView
    this.hideError = hideError
    this.dateConfiguration = dateConfiguration;
    this.smartReplyConfiguration = smartReplyConfiguration;
    this.messageBubbleConfiguration = messageBubbleConfiguration;
    this.messageOptionConfiguration = messageOptionConfiguration;
    this.newMessageIndicatorConfiguration = newMessageIndicatorConfiguration



  }

}


export { MessageListConfiguration };