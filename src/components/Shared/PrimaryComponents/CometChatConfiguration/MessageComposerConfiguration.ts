import { ActionSheetConfiguration } from "./ActionSheetConfiguration"
import { CreatePollConfiguration } from "./CreatePollConfiguration"
import { EmojiKeyboardConfiguration } from "./EmojiKeyboardConfiguration"
import { MessagePreviewConfiguration } from "./MessagePreviewConfiguration"
import { PopoverConfiguration } from "./PopoverConfiguration"
import { StickerKeyboardConfiguration } from "./StickerKeyboardConfiguration"
/**
 * @class MessageComposerConfiguration
 * @param {string} placeholderText
 * @param {boolean} sendButtonIconURL
 * @param {callback} liveReactionIcon
 * @param {callback} attachmentIconURL
 * @param {number} stickerIconURL
 * @param {string} closeIconURL
 * @param {boolean} hideAttachment
 * @param {boolean} hideLiveReaction
 * @param {boolean} hideEmoji
 * @param {string} emojiIconURL
 * @param {boolean} showSendButton
 * @param {callback} onSendButtonClick
 * @param {array} messageTypes
 * @param {string} customOutgoingMessageSound
 * @param {boolean} enableSoundForMessages
 * @param {boolean} enableTypingIndicator
 * @param {array} excludeMessageTypes
 * @param {object} createPollConfiguration
 * @param {object} stickerKeyboardConfiguration
 * @param {object} actionSheetConfiguration
 * @param {object} emojiKeyboardConfiguration
 * @param {object} messagePreviewConfiguration
 */

class MessageComposerConfiguration {
  placeholderText: string = "Enter your text here"
  sendButtonIconURL: string = "assets/resources/Send.svg"
  liveReactionIconURL: string = "assets/resources/heart-reaction.png"
  attachmentIconURL: string = "assets/resources/Plus.svg"
  stickerIconURL: string = "assets/resources/Stickers.svg"
  closeIconURL: string = "assets/resources/plus-rotated.svg"
  hideAttachment: boolean = false
  hideLiveReaction: boolean = false
  hideEmoji: boolean = false
  emojiIconURL: string = "assets/resources/Stipop.svg"
  showSendButton: boolean = true
  onSendButtonClick: any = null;
  messageTypes: any[] = []
  customOutgoingMessageSound: string = ""
  enableSoundForMessages: boolean = true
  enableTypingIndicator: boolean = true
  excludeMessageTypes: string[] = []
  createPollConfiguration: CreatePollConfiguration = new CreatePollConfiguration({})
  stickerKeyboardConfiguration: StickerKeyboardConfiguration = new StickerKeyboardConfiguration({})
  actionSheetConfiguration: ActionSheetConfiguration = new ActionSheetConfiguration({})
  emojiKeyboardConfiguration: EmojiKeyboardConfiguration = new EmojiKeyboardConfiguration({})
  messagePreviewConfiguration: MessagePreviewConfiguration = new MessagePreviewConfiguration({})
  popoverConfiguration: PopoverConfiguration = new PopoverConfiguration({})
  constructor(
    {
      placeholderText = "Enter your message here",
      sendButtonIconURL = "assets/resources/Send.svg",
      liveReactionIconURL = "assets/resources/heart-reaction.png",
      attachmentIconURL = "assets/resources/Plus.svg",
      stickerIconURL = "assets/resources/Stickers.svg",
      closeIconURL = "assets/resources/plus-rotated.svg",
      hideAttachment = false,
      hideLiveReaction = false,
      hideEmoji = false,
      emojiIconURL = "assets/resources/Stipop.svg",
      showSendButton = false,
      onSendButtonClick = null,
      messageTypes = [],
      customOutgoingMessageSound = "",
      enableSoundForMessages = true,
      enableTypingIndicator = true,
      excludeMessageTypes = [],
      createPollConfiguration = new CreatePollConfiguration({}),
      popoverConfiguration = new PopoverConfiguration({}),
      stickerKeyboardConfiguration = new StickerKeyboardConfiguration({}),
      actionSheetConfiguration = new ActionSheetConfiguration({}),
      emojiKeyboardConfiguration = new EmojiKeyboardConfiguration({}),
      messagePreviewConfiguration = new MessagePreviewConfiguration({})

    }
  ) {
    this.placeholderText = placeholderText
    this.sendButtonIconURL = sendButtonIconURL;
    this.liveReactionIconURL = liveReactionIconURL;
    this.attachmentIconURL = attachmentIconURL;
    this.stickerIconURL = stickerIconURL;
    this.closeIconURL = closeIconURL;
    this.hideAttachment = hideAttachment;
    this.hideLiveReaction = hideLiveReaction;
    this.hideEmoji = hideEmoji;
    this.emojiIconURL = emojiIconURL;
    this.showSendButton = showSendButton;
    this.onSendButtonClick = onSendButtonClick;
    this.messageTypes = messageTypes;
    this.customOutgoingMessageSound = customOutgoingMessageSound;
    this.enableSoundForMessages = enableSoundForMessages;
    this.enableTypingIndicator = enableTypingIndicator;
    this.excludeMessageTypes = excludeMessageTypes;
    this.messagePreviewConfiguration = messagePreviewConfiguration
    this.createPollConfiguration = createPollConfiguration
    this.stickerKeyboardConfiguration = stickerKeyboardConfiguration
    this.actionSheetConfiguration = actionSheetConfiguration
    this.emojiKeyboardConfiguration = emojiKeyboardConfiguration
    this.popoverConfiguration = popoverConfiguration;
  }
}

export { MessageComposerConfiguration };