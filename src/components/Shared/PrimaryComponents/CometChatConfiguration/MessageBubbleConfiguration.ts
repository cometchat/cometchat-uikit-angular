import { messageBubbleData } from "../../../Messages/Bubbles/CometChatMessageBubble/messageBubbleData";
import { dateFormat, MessageListAlignment, MessageTimeAlignment, timeFormat } from "../../Constants/UIKitConstants";
import { AvatarConfiguration } from "./AvatarConfiguration";
import { DateConfiguration } from "./DateConfiguration";
import { MenuListConfiguration } from "./MenuListConfiguration";
import { MessageReceiptConfiguration } from "./MessageReceiptConfiguration";

/**
 * @class MessageBubbleConfiguration
 * @param {object} messageBubbleData
 * @param {callback} reactToMessage
 * @param {array} messageOptions
 * @param {string} timeAlignment
 * @param {boolean} threadReplies
 * @param {object} dateConfiguration
 */
export class MessageBubbleConfiguration {
  messageBubbleData: messageBubbleData = {
    thumbnail: true,
    title: true,
    time: true,
    readReceipt: true,
  };
  reactToMessage: any;
  messageOptions: any[] = [];
  timeAlignment: string = MessageTimeAlignment.bottom;
  threadReplies: boolean = false;
  dateConfiguration: DateConfiguration = new DateConfiguration({});
  menuListConfiguration: MenuListConfiguration = new MenuListConfiguration({});
  avatarConfiguration: AvatarConfiguration = new AvatarConfiguration({});
  messageReceiptConfiguration: MessageReceiptConfiguration = new MessageReceiptConfiguration({});
  constructor({
    messageBubbleData = {
      thumbnail: false,
      title: false,
      time: true,
      readReceipt: true,
    },
    dateConfiguration = new DateConfiguration({
      pattern: dateFormat.timeFormat,
      dateFormat: "mm:dd:yyyy",
      timeFormat: timeFormat.twelvehours
    }),
    reactToMessage = null,
    messageOptions = [],
    timeAlignment = MessageTimeAlignment.bottom,
    threadReplies = false,
    menuListConfiguration = new MenuListConfiguration({}),
    avatarConfiguration = new AvatarConfiguration({}),
    messageReceiptConfiguration = new MessageReceiptConfiguration({}),
  }) {
    this.messageBubbleData = messageBubbleData
    this.reactToMessage = reactToMessage;
    this.messageOptions = messageOptions;
    this.timeAlignment = timeAlignment;
    this.threadReplies = threadReplies;
    this.dateConfiguration = dateConfiguration
    this.menuListConfiguration = menuListConfiguration
    this.avatarConfiguration = avatarConfiguration
    this.messageReceiptConfiguration = messageReceiptConfiguration

  }
}