import {
  ChangeDetectorRef,
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  ChangeDetectionStrategy
} from "@angular/core";
import { CometChat } from "@cometchat-pro/chat";
import { localize, CometChatLocalize } from '../../../PrimaryComponents/CometChatLocalize/cometchat-localize'
import * as types from '../../../Types/typesDeclairation'
import { AvatarConfiguration } from '../../../PrimaryComponents/CometChatConfiguration/AvatarConfiguration'
import { StatusIndicatorConfiguration } from '../../../PrimaryComponents/CometChatConfiguration/StatusIndicatorConfiguration'
import { CometChatTheme } from '../../../PrimaryComponents/CometChatTheme/CometChatTheme'
import { MessageReceiptConfiguration } from '../../../PrimaryComponents/CometChatConfiguration/MessageReceiptConfiguration'
import { BadgeCountConfiguration } from '../../../PrimaryComponents/CometChatConfiguration/BadgeCountConfiguration'
import { chatOptionEnums, conversationConstants, dateFormat, GroupType, messageConstants } from "../../../Constants/UIKitConstants";
import { checkHasOwnProperty, checkMessageForExtensionsData } from "../../../Helpers/CometChatHelper";
import { groupTypes } from '../../../Types/interface'
import { style } from '../../listItemTypes/style'
import { CometChatWrapperComponent } from "../../../PrimaryComponents/CometChatTheme/CometChatThemeWrapper/cometchat-theme-wrapper.component";
import { CometChatConversationEvents } from "../../../../Chats/CometChatConversationEvents.service";
import { ConversationInputData } from "../../../InputData/ConversationInputData";
@Component({
  selector: "cometchat-conversation-list-item",
  templateUrl: "./cometchat-conversation-list-item.component.html",
  styleUrls: ["./cometchat-conversation-list-item.component.scss"],
})
export class CometChatConversationListItemComponent
  implements OnInit, OnChanges {
  @Input() conversationInputData!: ConversationInputData | null; //comprises of the mapping of the component’s view with the SDK’s Conversation class. If inputData is empty, nothing will be displayed. 
  @Input() avatarConfiguration: AvatarConfiguration = new AvatarConfiguration({});
  @Input() statusIndicatorConfiguration: StatusIndicatorConfiguration = new StatusIndicatorConfiguration({});
  @Input() badgeCountConfiguration: BadgeCountConfiguration = new BadgeCountConfiguration({});
  @Input() messageReceiptConfiguration: MessageReceiptConfiguration = new MessageReceiptConfiguration({});
  public theme: any = new CometChatTheme({});
  @Input() style: style = {
    background: "",
    titleColor: "",
    titleFont: "",
    subTitleColor: "",
    subTitleFont: "",
    width: "",
    height: "",
    border: "",
    borderRadius: "",
    typingIndicatorTextColor: "",
    typingIndicatorTextFont: "",
    threadIndicatorTextColor: "",
    threadIndicatorTextFont: "",
    activeBackground:""
  }; //consists of all styling properties
  @Input() showTypingIndicator: boolean = false; //Switch on/off typing indicators , will be customised from configurations as well
  @Input() typingIndicatorText: string = conversationConstants.IS_TYPING //Text to be shown when a typing indicator is received
  @Input() hideThreadIndicator: boolean = false; // Switch on/off indicator that the last message is part of the thread conversation ,  will be customised from configurations as well
  @Input() threadIndicatorText: string = conversationConstants.IN_A_THREAD //Text to be shown when the last message is received in a thread conversation
  // @Input() hideReceipt: boolean = false; // Switch on/off read receipts , will be customised from configurations as well
  @Input() isActive!: boolean; //Selected conversation
  public unreadCount: number = 0
  @Input() conversationOptions!: {}[]; //list of options available for each converstaion on hover ; predefined options include delete conversation. It can also include additional custom option. 
  @Input() conversationObject!: CometChat.Conversation | any; //  SDK’s Conversation class 
  moreIconURL: string = "assets/resources/moreicon.svg"; //Image URL for more icon
  deleteIcon: string = "assets/resources/deleteicon.svg";
  public lastMessageName!: string;
  @Input() loggedInUser!: CometChat.User | null;
  public lastMessage: string = "";
  public isThread: boolean = false;
  public isTyping: boolean = false;
  public message: string = "";
  public isHovering: boolean = false;
  public showMenuOnSelectedUser: boolean = false;
  public localize = localize;
  public messageReceiptIcons: any = {};
  public statusIndicatorStyle: any = {};
  public badgeCountStyle: any = {};
  public avatarStyle: any = {};
  public typingListenerId: string = conversationConstants.CONVERSATION__LISTENER__ID + new Date().getTime();
  // background color for group type icon and status indicator
  public statusColor: any = {
    online: "",
    private: "",
    password: "#F7A500",
    public: ""
  }
  // icon color of conversationOptions
  conversationOptionsStyle = {
    iconTint: ""
  }
  //  iconc for group type eg - password group and private group
  groupTypeIcons: groupTypes = {
    public: "",
    password: "assets/resources/Locked.svg",
    private: "assets/resources/Private.svg",
    // password: "assets/resources/password-protected-group.svg",
  }
  // date component styling
  public timeFont: string = "";
  public timeColor: string = "";
  public backgroundColor: string = "transparent";
  public timeFormat: string = dateFormat.dayDateTimeFormat
  typerName: string = "";
  setThemeStyle() {
    this.avatarStyle.backgroundColor = this.theme.palette.accent700[this.theme.palette.mode];
    this.avatarStyle.nameTextFont = `${this.theme.typography.name.fontWeight} ${this.theme.typography.name.fontSize} ${this.theme.typography.name.fontFamily}`;
    this.avatarStyle.nameTextColor = this.theme.palette.accent900[this.theme.palette.mode];
    this.timeFont = `${this.theme.typography.caption2.fontWeight} ${this.theme.typography.caption2.fontSize} ${this.theme.typography.caption2.fontFamily}`;
    this.timeColor = this.theme.palette.accent600[this.theme.palette.mode];
    this.conversationOptionsStyle.iconTint = this.theme.palette.accent600[this.theme.palette.mode];
    this.statusColor.private = this.theme.palette.success[this.theme.palette.mode];
    this.statusColor.online = this.theme.palette.success[this.theme.palette.mode];
    this.badgeCountStyle.background = this.theme.palette.primary[this.theme.palette.mode];
    this.badgeCountStyle.color = this.theme.palette.accent.dark;
    this.badgeCountStyle.font = `${this.theme.typography.caption1.fontWeight} ${this.theme.typography.caption1.fontSize} ${this.theme.typography.caption1.fontFamily}`;
    this.ref.detectChanges()
  }
  constructor(private conversationEvents: CometChatConversationEvents, private ref: ChangeDetectorRef) {
  }
  /**
* 
* CometChatConversationsListItem is comprised of title, subtitle, avatar, badgecount and more.
* with additonal CometChat SDK conversation object
* 
* @version 1.0.0
* @author CometChatTeam
* @copyright © 2022 CometChat Inc.
* 
*/
  ngOnChanges(change: SimpleChanges) {

    try {
      if (change["theme"]) {
        this.setThemeStyle()
      }
      if (change[conversationConstants.IS_ACTIVE]) {
        if (this.isActive) {
          this.showMenuOnSelectedUser = false
        }
        else {
        }
        // this.hideShowMenuOption()
      }
      if (change[conversationConstants.CONVERSATION_OBJECT]) {
       
        if (
          change[conversationConstants.CONVERSATION_OBJECT].currentValue !==
          change[conversationConstants.CONVERSATION_OBJECT].previousValue
        ) {
          this.conversationObject =  change[conversationConstants.CONVERSATION_OBJECT].currentValue;
          this.getLastMessageTimestamp(
            change[conversationConstants.CONVERSATION_OBJECT].currentValue
          );
          this.getName(change[conversationConstants.CONVERSATION_OBJECT].currentValue);
        }
      }
    } catch (error:any){
      this.conversationEvents.publishEvents(this.conversationEvents.onError, error);
    }
    // 
  }
  
  setSubtitle = (conversationObject: CometChat.Conversation): any => {
    let msgObject: CometChat.BaseMessage = conversationObject?.getLastMessage();
    var message = null;
    if (!msgObject) {
      message = "Start a conversation";
    }
    if (checkHasOwnProperty(msgObject, "deletedAt")) {
      message = localize(messageConstants.MESSAGE_IS_DELETED);
    } else {
      switch (msgObject?.getCategory()) {
        case CometChat.CATEGORY_MESSAGE:
          try {
            switch (msgObject?.getType()) {
              case CometChat.MESSAGE_TYPE.TEXT:
                message = (msgObject as CometChat.TextMessage)?.getText();
                break;
              case CometChat.MESSAGE_TYPE.MEDIA:
                message = CometChat.MESSAGE_TYPE.MEDIA;
                break;
              case CometChat.MESSAGE_TYPE.IMAGE:
                message = conversationConstants.MESSAGE_IMAGE;
                break;
              case CometChat.MESSAGE_TYPE.FILE:
                message = conversationConstants.MESSAGE_FILE;
                break;
              case CometChat.MESSAGE_TYPE.VIDEO:
                message = conversationConstants.MESSAGE_VIDEO;
                break;
              case CometChat.MESSAGE_TYPE.AUDIO:
                message = conversationConstants.MESSAGE_AUDIO;
                break;
              case CometChat.MESSAGE_TYPE.CUSTOM:
                message = conversationConstants.CUSTOM_MESSAGE;
                break;
              default:
                message = "start a conversation";
                break;
            }
            // return message;
          } catch (error:any){
          }
          break;
        case CometChat.CATEGORY_CALL:
          switch (msgObject?.getType()) {
            case CometChat.MESSAGE_TYPE.VIDEO:
              message = chatOptionEnums.video_call;
              break;
            case CometChat.MESSAGE_TYPE.AUDIO:
              message = chatOptionEnums.audio_call;
              break;
            default:
              break;
          }
          break;
        case CometChat.CATEGORY_ACTION:
          message = (msgObject as any).message;
          break;
        case CometChat.MESSAGE_TYPE.CUSTOM:
          switch (msgObject?.getType()) {
            case conversationConstants.CUSTOM_TYPE_POLL:
              message = conversationConstants.CUSTOM_MESSAGE_POLL;
              break;
            case conversationConstants.CUSTOM_TYPE_STICKER:
              message = conversationConstants.CUSTOM_MESSAGE_STICKER;
              break;
            case "meeting":
              message = "direct call";
              break;
            default:
              break;
          }
          break;
        default:
          break;
      }
    }
    if(!msgObject){
      message = message;
    }
    else{
      if (msgObject?.getCategory() == CometChat.CATEGORY_ACTION) {
        message = message;
      }
      else if (this.conversationObject?.getConversationType() != CometChat.RECEIVER_TYPE.USER) {
        if (msgObject?.getSender().getUid() == this.loggedInUser!.getUid()) {
          message = `you: ${message}`
        }
        else {
          message = `${msgObject?.getSender().getName()}:  ${message}`
        }
      }

    }
 
    return message;
  }
  // calling subtitle callback from configurations
  /**
   * @param  {CometChat.Conversation} conversation
   */
  getSubtitleValue(conversation: CometChat.Conversation) {
    let subtitle;
    if(this.conversationInputData!.subtitle){
      subtitle = this.conversationInputData!.subtitle(conversation)

    }
    else{
      subtitle = this.setSubtitle(conversation)

    }
    return subtitle
  }
  /**
   * @param  {types.messageObject} lastMessage
   */
  getTextMessage(lastMessage: types.messageObject) {
    //xss extensions data
    const xssData = checkMessageForExtensionsData(lastMessage, "xss-filter");
    if (xssData && xssData.hasOwnProperty("sanitized_text")) {
      return (xssData as any).sanitized_text;
    }
    //datamasking extensions data
    const maskedData = checkMessageForExtensionsData(lastMessage, "data-masking");
    maskedData
    if (maskedData
      && (maskedData as any).data
      && (maskedData as any).data.sensitive_data
      && (maskedData as any).data.message_masked
      && (maskedData as any).data.sensitive_data === "yes") {
      return (maskedData as any).data.message_masked;
    }
    //profanity extensions data
    const profaneData = checkMessageForExtensionsData(lastMessage, "profanity-filter");
    if (profaneData
      && (profaneData as any).profanity
      && (profaneData as any).message_clean
      && (profaneData as any).profanity === "yes") {
      return (profaneData as any).message_clean;
    }
    return (lastMessage as any).text;
  };
  ngOnInit() {
    if (CometChatWrapperComponent.cometchattheme ) {
      this.theme = CometChatWrapperComponent.cometchattheme;
    }
    this.typingIndicatorListener()
    this.checkConfiguration()
    this.setThemeStyle()
  }
  /**
   * @param  {CometChat.Conversation} conversation
   * this method finds icon or avatr from conversationObject and passes it to avatarComponent
   */
  checkAvatarValue(conversation: CometChat.Conversation) {
    let image = (conversation as any)?.conversationWith.avatar ? (conversation as any)?.conversationWith.avatar : (conversation as any)?.conversationWith.icon
    return image
  }
  // check if configurations is there 
  // avatar config method
  checkConfiguration() {
    let avatarDefaultConfig = new AvatarConfiguration({})
    let statusIndicatorDefaultConfig = new StatusIndicatorConfiguration({});
    let badgeCountDefaultConfig = new BadgeCountConfiguration({})
    let messageReceiptDefaultConfig = new MessageReceiptConfiguration({})
      this.setAvatarConfig(this.avatarConfiguration, avatarDefaultConfig)
      this.setStatusIndicatorConfig(this.statusIndicatorConfiguration, statusIndicatorDefaultConfig)
      this.setBadgeCountConfig(this.badgeCountConfiguration, badgeCountDefaultConfig)
      this.setMessageReceiptConfig(this.messageReceiptConfiguration, messageReceiptDefaultConfig)
    

  }
  /**
   * @param  {any} config
   * @param  {any} defaultConfig
   */
  setAvatarConfig(config: any = {}, defaultConfig?: any) {
    this.avatarStyle.height = config.height || defaultConfig.height;
    this.avatarStyle.width = config.width || defaultConfig.width;
    this.avatarStyle.border = config.border || defaultConfig.border;
    this.avatarStyle.borderRadius = config.borderRadius || defaultConfig.borderRadius;
    this.avatarStyle.outerViewSpacing = config.outerViewSpacing || defaultConfig.outerViewSpacing;
    this.avatarStyle.outerView = config.outerView || defaultConfig.outerView;
  }
  setStatusIndicatorConfig(config: any = {}, defaultConfig?: any) {
    this.statusIndicatorStyle.width = config.width || defaultConfig.width
    this.statusIndicatorStyle.height = config.height || defaultConfig.height
    this.statusIndicatorStyle.border = config.border || defaultConfig.border
    this.statusIndicatorStyle.borderRadius = config.borderRadius || defaultConfig.borderRadius
    this.statusIndicatorStyle.onlineBackgroundColor = config.onlineBackgroundColor || defaultConfig.onlineBackgroundColor
    this.statusIndicatorStyle.offlineBackgroundColor = config.offlineBackgroundColor || defaultConfig.offlineBackgroundColor
    this.statusIndicatorStyle.status = config.status || defaultConfig.status
  }
  setBadgeCountConfig(config: any = {}, defaultConfig?: any) {
    this.badgeCountStyle.width = config.width || defaultConfig.width;
    this.badgeCountStyle.height = config.height || defaultConfig.height;
    this.badgeCountStyle.border = config.border || defaultConfig.border;
    this.badgeCountStyle.borderRadius = config.borderRadius || defaultConfig.borderRadius;
    this.badgeCountStyle.count = config.count || defaultConfig.count;
  }
  setMessageReceiptConfig(config: any = {}, defaultConfig?: any) {
    this.messageReceiptIcons.messageWaitIcon = config.messageWaitIcon || defaultConfig.messageWaitIcon;
    this.messageReceiptIcons.messageSentIcon = config.messageSentIcon || defaultConfig.messageSentIcon;
    this.messageReceiptIcons.messageDeliveredIcon = config.messageDeliveredIcon || defaultConfig.messageDeliveredIcon;
    this.messageReceiptIcons.messageReadIcon = config.messageReadIcon || defaultConfig.messageReadIcon;
    this.messageReceiptIcons.messageErrorIcon = config.messageErrorIcon || defaultConfig.messageErrorIcon;
  }

  // 
  /**
   * hide show menu options on hover
   * @param  {any} event
   */
  hideShowMenuOption(event?: MouseEvent) {
    if (event?.type == "mouseenter") {
      this.showMenuOnSelectedUser = true;
      this.isHovering = true;
      this.ref.detectChanges()
    }
    else {
      this.showMenuOnSelectedUser = false;
      this.isHovering = false;
      this.ref.detectChanges()
    }
  }

  /**
   * @param  {CometChat.Conversation} data
   */
  getName(data: CometChat.Conversation) {
    try {
      this.lastMessageName = (data as any)?.conversationWith?.name;
    } catch (error:any){
      this.conversationEvents.publishEvents(this.conversationEvents.onError, error);
    }
  }
  /**
   * @param  {CometChat.Conversation} data
   */
  getLastMessage(data: CometChat.Conversation) {
    try {
      if (data === null) {
        return false;
      }
      if (data.hasOwnProperty(conversationConstants.LAST_MESSAGE) === false) {
        return false;
      }
      let message = null;
      const lastMessage = (data as any).lastMessage;
      if (lastMessage.hasOwnProperty(conversationConstants.DELETED_AT)) {
        message =
          (data as any).conversationWith.uid != lastMessage?.sender?.uid
            ? conversationConstants.YOU_DELETED_THIS_MESSAGE
            : conversationConstants.THIS_MESSAGE_DELETED;
      } else {
        switch (lastMessage.category) {
          case CometChat.CATEGORY_MESSAGE:
            message = this.getMessage(lastMessage);
            break;
          case CometChat.CATEGORY_ACTION:
            message = lastMessage.message;
            break;
          case CometChat.MESSAGE_TYPE.CUSTOM:
            message = this.getCustomMessage(lastMessage);
            break;
          default:
            break;
        }
      }
      this.lastMessage = message;
      return this.lastMessage;
    } catch (error:any){
      return
    }
  }
  /**
   * @param  {CometChat.Conversation} data
   */
  getLastMessageTimestamp(data: CometChat.Conversation) {
    try {
      if (data === null) {
        return false;
      }
      if (data.hasOwnProperty(conversationConstants.LAST_MESSAGE) === false) {
        return false;
      }
      if ((data as any).lastMessage.hasOwnProperty(conversationConstants.SENT_AT) === false) {
        return false;
      }
      let timestamp = null;
      const messageTimestamp: any = new Date((data as any).lastMessage.sentAt * 1000);
      const currentTimestamp = Date.now();
      const diffTimestamp = currentTimestamp - messageTimestamp;
      if (diffTimestamp < 24 * 60 * 60 * 1000) {
        timestamp = messageTimestamp.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "numeric",
          hour12: true,
        });
      } else if (diffTimestamp < 48 * 60 * 60 * 1000) {
        timestamp = conversationConstants.YESTERDAY;
      } else if (diffTimestamp < 7 * 24 * 60 * 60 * 1000) {
        timestamp = messageTimestamp.toLocaleString("en-US", {
          weekday: "long",
        });
      } else {
        timestamp = messageTimestamp.toLocaleDateString("en-US", {
          year: "2-digit",
          month: "2-digit",
          day: "2-digit",
        });
      }
      ;
      return timestamp;
    } catch (error:any){
    }
  }
  /**
   * @param  {types.messageObject} lastMessage
   */
  getMessage(lastMessage: types.messageObject) {
    try {
      let message = null;
      switch ((lastMessage as any).type) {
        case CometChat.MESSAGE_TYPE.TEXT:
          message = this.getTextMessage(lastMessage)
          break;
        case CometChat.MESSAGE_TYPE.MEDIA:
          message = conversationConstants.MEDIA_MESSAGE;
          break;
        case CometChat.MESSAGE_TYPE.IMAGE:
          message = conversationConstants.MESSAGE_IMAGE;
          break;
        case CometChat.MESSAGE_TYPE.FILE:
          message = conversationConstants.MESSAGE_FILE;
          break;
        case CometChat.MESSAGE_TYPE.VIDEO:
          message = conversationConstants.MESSAGE_VIDEO;
          break;
        case CometChat.MESSAGE_TYPE.AUDIO:
          message = conversationConstants.MESSAGE_AUDIO;
          break;
        case CometChat.MESSAGE_TYPE.CUSTOM:
          message = conversationConstants.CUSTOM_MESSAGE;
          break;
        default:
          break;
      }
      return message;
    } catch (error:any){
    }
    this.ref.detectChanges()
  }
  
  /**
   * @param  {CometChat.Conversation} lastMessage
   */
  getCustomMessage = (lastMessage: CometChat.Conversation) => {
    try {
      let message = null;
      switch ((lastMessage as any).conversationType) {
        case conversationConstants.CUSTOM_TYPE_POLL:
          message = conversationConstants.CUSTOM_MESSAGE_POLL;
          break;
        case conversationConstants.CUSTOM_TYPE_STICKER:
          message = conversationConstants.CUSTOM_MESSAGE_STICKER;
          break;
        case chatOptionEnums.direct_call:
          message = chatOptionEnums.video_call;
          break;
        default:
          break;
      }
      return message;
    } catch (error:any){
      return
    }
    this.ref.detectChanges()
  };
  // typing indicator listener 
  typingIndicatorListener() {
    CometChat.addMessageListener(
      this.typingListenerId,
      new CometChat.MessageListener({
        onTypingStarted: (typingIndicator: any) => {

          if ((this.conversationObject as any)?.conversationWith.guid == typingIndicator.receiverId) {
            this.typerName = typingIndicator.sender.name
            this.isTyping = true
            this.ref.detectChanges()
          }
          else if ((this.conversationObject as any)?.conversationWith.uid == typingIndicator?.sender?.uid && typingIndicator.receiverType != CometChat.RECEIVER_TYPE.GROUP) {
            this.typerName = ""
            this.isTyping = true
            this.ref.detectChanges()
          }
          this.ref.detectChanges()
        },
        onTypingEnded: (typingIndicator: any) => {
          if ((this.conversationObject as any)?.conversationWith.guid == typingIndicator.receiverId) {
            this.typerName = ""
            this.isTyping = false;
            this.ref.detectChanges()
          }
          else if ((this.conversationObject as any)?.conversationWith.uid == typingIndicator?.sender?.uid && typingIndicator.receiverType != CometChat.RECEIVER_TYPE.GROUP) {
            this.typerName = ""
            this.isTyping = false;
            this.ref.detectChanges()
          }
          this.ref.detectChanges()
        }
      })
    );
  }
  /**
   * @param  {CometChat.Conversation} conversation
   */
  checkStatusType(conversation: CometChat.Conversation) {
    if ((conversation as any).conversationType == CometChat.RECEIVER_TYPE.USER) {
      return this.statusColor[(conversation as any).conversationWith.status]
    }
    else {
      return this.statusColor[(conversation as any).conversationWith.type]
    }
  }
  checkGroupType(conversation: CometChat.Conversation): string {
    let image: string = "";
    if ((conversation as any).conversationType == CometChat.RECEIVER_TYPE.GROUP) {
      switch ((conversation as any).conversationWith.type) {
        case GroupType.password:
          image = this.groupTypeIcons.password
          break;
        case GroupType.private:
          image = this.groupTypeIcons.private
          break;
        default:
          image = this.groupTypeIcons.public
          break;
      }
    }
    return image
  }
    /**
     * prop dependent styles
     */
    conversationListItemStyles = {
      listItemStyle:()=>{
        return{
          height:this.style.height,
          width:this.style.width,
          border:this.style.border,
          borderRadius:this.style.borderRadius,
          background: this.isHovering || this.isActive ? this.style.activeBackground : this.style.background

        }
      },
      timestampStyle: (style: any) => {
        return {
          color: style.subTitleColor,
          maxHeight: style.height ? style.height : "16px"
        }
      },
      itemDetailStyle: (style: any) => {
        const padding = CometChatLocalize.isRTL() ? { paddingLeft: "8px" } : { paddingLeft: "8px" };
        return {
          width: "70%",
          flexGrow: "1",
          border: style.border,
          ...padding,
        };
      },
      titleStyle: (style: any) => {
        return {
          font: style.titleFont,
          color: style.titleColor,
        };
      },
      subTitleStyle: (style: any) => {
        return {
          font: style.subTitleFont,
          color: style.subTitleColor,
          width: "100%",
        };
      },
      typingTextStyle: (style: any) => {
        return {
          font: style.typingIndicatorTextFont,
          color: style.typingIndicatorTextColor,
          width: "calc(100% - 24px)",
        };
      },
      itemThreadIndicatorStyle: (style: any) => {
        return {
          font: style.threadIndicatorTextFont,
          color: style.threadIndicatorTextFont,
        };
      }
    }
}
