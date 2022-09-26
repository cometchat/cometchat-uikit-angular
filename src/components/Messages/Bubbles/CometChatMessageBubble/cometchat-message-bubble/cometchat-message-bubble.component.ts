import { Component, OnInit, Input, OnChanges, SimpleChanges, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { MessageTimeAlignment, messageAlignment, dateFormat, messageConstants, MetadataKey, timeFormat } from "../../../../Shared/Constants/UIKitConstants";
import { AvatarConfiguration } from "../../../../Shared/PrimaryComponents/CometChatConfiguration/AvatarConfiguration";
import { MessageReceiptConfiguration } from "../../../../Shared/PrimaryComponents/CometChatConfiguration/MessageReceiptConfiguration";
import { style } from '../../../../Chats/interface';
import { CometChatTheme } from "../../../../Shared/PrimaryComponents/CometChatTheme/CometChatTheme";
import { CometChat } from "@cometchat-pro/chat";
import { CometChatWrapperComponent } from "../../../../Shared/PrimaryComponents/CometChatTheme/CometChatThemeWrapper/cometchat-theme-wrapper.component";
import { checkMessageForExtensionsData, getUnixTimestamp } from '../../../../Shared/Helpers/CometChatHelper';
import { avatarStyles, baseStyle, fileBubbleStyles, groupActionStyles, messageOptionsStyle, messageReceiptStyles, placeHolderStyles, pollBubbleStyles, styles, witeboardStyles } from '../../styles';
import { DateConfiguration, localize, MenuListConfiguration, MessageBubbleConfiguration } from '../../../../Shared';
import { fontHelper } from '../../../../Shared/PrimaryComponents/CometChatTheme/Typography';
import { messageInputData } from '../../../../Shared/InputData/MessageInputData';
@Component({
  selector: 'cometchat-message-bubble',
  templateUrl: './cometchat-message-bubble.component.html',
  styleUrls: ['./cometchat-message-bubble.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CometChatMessageBubbleComponent implements OnInit, OnChanges {
  constructor(private ref: ChangeDetectorRef) { }
  @Input() messageBubbleData: messageInputData = {
    thumbnail: true,
    title: true,
    time: true,
    readReceipt: true,
  };
  @Input() updateReaction: any;
  @Input() style: style = {
    width: "100%",
    height: "auto",
    background: "",
    borderRadius: "12px",
    border: "1px solid rgba(20, 20, 20, 10%); border-width: 0 0 1px 0;",
    nameTextFont: "",
    nameTextColor: "rgb(255, 255, 255)",
    timeFont: "600 15px Inter, sans-serif",
    timeColor: "rgb(20, 20, 20)",
  };
  @Input() messageOptions: any[] = [];
  @Input() loggedInUser!: CometChat.User | null;
  @Input() alignment: string = "left";
  @Input() timeAlignment: string = "bottom";
  @Input() messageObject: CometChat.BaseMessage | null = null;
  @Input() threadReplies: boolean = false;
  @Input() customView:any;
  @Input() dateConfiguration: DateConfiguration = new DateConfiguration({});
  @Input() menuListConfiguration: MenuListConfiguration = new MenuListConfiguration({});
  @Input() avatarConfiguration: AvatarConfiguration = new AvatarConfiguration({});
  @Input() messageReceiptConfiguration: MessageReceiptConfiguration = new MessageReceiptConfiguration({});
  // translate message
  public translatedMessage: string = "";
  public optionBackgroundIcon:string = 'assets/resources/checkmark.svg';
  isTranslated: boolean = false
  messageTimeAlignment: typeof MessageTimeAlignment = MessageTimeAlignment;
  messageAlignment: typeof messageAlignment = messageAlignment;
  avatarStyle: avatarStyles = {
    backgroundColor: "",
    nameTextFont: "",
    nameTextColor: "",
    outerView: "",
    outerViewSpacing: "",
    height: "",
    width: "",
    border: "",
    borderRadius: ""
  };
  messageReceiptIcons: messageReceiptStyles = {
    messageWaitIcon: "",
    messageSentIcon: "",
    messageDeliveredIcon: "",
    messageReadIcon: "",
    messageErrorIcon: "",
  };
  groupActionStyle: groupActionStyles = {
    textFont: "",
    textColor: ""
  };
  timeStamp: number = 0;
  timeFormat: string = dateFormat.timeFormat;
  deletedText: string = localize(messageConstants.MESSAGE_IS_DELETED);
  timeStampFont: string = "";
  timeStampColor: string = "";
  public theme: any = new CometChatTheme({})
  limit: number = 3;
  moreIconURL:string=""
  isHovering: boolean = false;
  checkReaction: any[] = [];
  dateFormat:DateConfiguration = {
    pattern : dateFormat.timeFormat,
    dateFormat: "mm:dd:yyyy",
    timeFormat : timeFormat.twelvehours
  }
  placeholderStyle: placeHolderStyles = {
    textFont: "",
    textColor: ""
  };
  textBubbleStyle: styles = {
    width: "",
    height: "",
    border: "",
    background: "",
    borderRadius: "",
    textFont: "400 15px Inter, sans-serif",
    textColor: "rgb(20, 20, 20)",
  }
  fileBubbleStyle: fileBubbleStyles = {
    width: "",
    height: "",
    border: "",
    background: "",
    borderRadius: "",
    titleFont: "",
    titleColor: "",
    subtitleFont: "",
    subtitleColor: "",
    iconTint: "",
  }
  imageBubbleStyle: baseStyle = {
    width: "",
    height: "",
    border: "",
    background: "",
    borderRadius: "",
  }
  audioBubbleStyle: baseStyle = {
    // Using native view.
    width: "",
    height: "",
    border: "",
    background: "",
    borderRadius: "",
  }
  videoBubbleStyle: baseStyle = {
    // Using native view.
    width: "",
    height: "",
    border: "",
    background: "",
    borderRadius: ""
  }
  pollBubbleStyle: pollBubbleStyles = {
    width: "",
    height: "",
    border: "0 none",
    borderRadius: "",
    background: "",
    pollQuestionTextFont: "",
    pollQuestionTextColor: "",
    pollOptionTextFont: "",
    pollOptionTextColor: "",
    pollOptionBackground: "",
    selectedPollOptionBackground: "",
    optionsIconTint: "",
    totalVoteCountTextFont: "",
    totalVoteCountTextColor: "",
    votePercentTextFont: "",
    votePercentTextColor: ""
  }
  stickerBubbleStyle: baseStyle = {
    width: "",
    height: "",
    border: "",
    background: "",
    borderRadius: ""
  }
  collaborativeDocumentBubbleStyle: object = {
    width: "",
    height: "",
    titleFont: "",
    titleColor: "",
    subTitleFont: "",
    subTitleColor: "",
    iconTint: "",
    background: "",
    borderRadius: "",
    backgroundColor: "",
    border: "",
    buttonTextFont: "",
    buttonTextColor: "",
    buttonBackgroundColor: "",
    documentBackgroundColor: "",
  }
  collaborativeWhiteBoardBubbleStyle: witeboardStyles = {
    width: "",
    height: "",
    titleFont: "",
    titleColor: "",
    subTitleFont: "",
    subTitleColor: "",
    iconTint: "",
    background: "",
    borderRadius: "",
    buttonBackgroundColor: "",
    whiteBoardBackgroundColor: "",
    buttonTextColor: "",
    buttonTextFont: "",
  }
  deleteBubbleStyle: styles = {
    width: "",
    height: "",
    border: "",
    background: "",
    borderRadius: "",
    textFont: "",
    textColor: "",
  };
  subMenuStyle:any = {

  }
  public optionsIcon: messageOptionsStyle = {};
  // local method for messageoption callback
  MESSAGE_TYPE_TEXT: String = CometChat.MESSAGE_TYPE.TEXT;
  MESSAGE_TYPE_IMAGE: String = CometChat.MESSAGE_TYPE.IMAGE;
  MESSAGE_TYPE_VIDEO: String = CometChat.MESSAGE_TYPE.VIDEO;
  MESSAGE_TYPE_AUDIO: String = CometChat.MESSAGE_TYPE.AUDIO;
  MESSAGE_TYPE_FILE: String = CometChat.MESSAGE_TYPE.FILE;
  MESSAGE_TYPE_CUSTOM: String = CometChat.MESSAGE_TYPE.CUSTOM;
  CATEGORY_CALL: String = CometChat.CATEGORY_CALL;
  GROUP_MEMBER: String = "groupMember";
  ngOnInit() {
    this.setThemeStyle()
    if(!this.messageObject?.getSender() || this.messageObject?.getSender().getUid() == this.loggedInUser?.getUid()){
      this.subMenuStyle.right = "0"
      
    }
    else{
      this.subMenuStyle.left = "0"

    }
    this.checkConfiguration();

    this.checkReaction = checkMessageForExtensionsData(
      this.messageObject as CometChat.BaseMessage,
      "reactions"
    );
  }
  ngOnChanges(changes: SimpleChanges) {
  
    let translatedMessageObject:any = this.messageObject
    if (translatedMessageObject && translatedMessageObject.data.metadata && translatedMessageObject.data.metadata["translated_message"]) {
      this.isTranslated = true;
      this.translatedMessage = translatedMessageObject.data.metadata["translated_message"];
      this.ref.detectChanges();
    }
    else {
      this.isTranslated = false;
      this.ref.detectChanges();
    }
    if (changes["messageObject"] && changes["messageObject"].currentValue) {
      this.messageObject = changes["messageObject"].currentValue;
      this.setThemeStyle()
       if (this.messageObject!.getSentAt()) {
        this.timeStamp = this.messageObject!.getSentAt();
      
      }
    }
  }
  setThemeStyle() {
    if (CometChatWrapperComponent.cometchattheme ) {
      this.theme = CometChatWrapperComponent.cometchattheme
     }
    this.textBubbleStyle.linkPreviewTitleColor = this.theme.palette.getAccent("light");
    this.textBubbleStyle.linkPreviewTitleFont = fontHelper(this.theme.typography.title1);
    this.textBubbleStyle.linkPreviewSubtitleColor = this.theme.palette.getAccent600("light");
    this.textBubbleStyle.linkPreviewSubtitleFont = fontHelper(this.theme.typography.subtitle2);
    this.textBubbleStyle.textColor = !this.messageObject!.getSender() || this.messageObject!.getSender() && this.messageObject!.getSender().getUid() == this.loggedInUser!.getUid() ?  this.theme.palette.getAccent900("light") : this.theme.palette.getAccent900("dark");
    this.fileBubbleStyle.titleFont = fontHelper(this.theme.typography.title1);
    this.fileBubbleStyle.subtitleFont = fontHelper(this.theme.typography.subtitle2);
    this.fileBubbleStyle.subtitleColor = this.theme.palette.getAccent600("light");
    this.fileBubbleStyle.iconTint = this.theme.palette.getPrimary();
    this.pollBubbleStyle.pollQuestionTextColor = this.theme.palette.getAccent("light");
    this.pollBubbleStyle.pollQuestionTextFont = fontHelper(this.theme.typography.subtitle1);
    this.pollBubbleStyle.pollOptionTextColor = (this.theme.palette.getAccent("light") as any);
    this.pollBubbleStyle.pollOptionTextFont = fontHelper(this.theme.typography.subtitle1);
    this.pollBubbleStyle.totalVoteCountTextFont = fontHelper(this.theme.typography.subtitle2);
    this.pollBubbleStyle.totalVoteCountTextColor = this.theme.palette.getAccent600("light");
    this.pollBubbleStyle.votePercentTextColor = this.theme.palette.getAccent600("light");
    this.pollBubbleStyle.votePercentTextFont = fontHelper(this.theme.typography.subtitle1);
    this.pollBubbleStyle.selectedPollOptionBackground = this.theme.palette.getPrimary();
    this.pollBubbleStyle.pollOptionBackground = this.theme.palette.getAccent100("light");
    this.pollBubbleStyle.optionsIconTint = this.theme.palette.getAccent600("light");
    this.timeStampFont = fontHelper(this.theme.typography.caption2);
    this.timeStampColor = this.theme.palette.getAccent600();
    this.optionsIcon!.iconTint = this.theme.palette.getAccent600();
    this.optionsIcon!.borderRadius = "8px";
    this.subMenuStyle.titleColor = this.theme.palette.getAccent600();
    this.subMenuStyle.titleFont = fontHelper(this.theme.typography.subtitle1);
    this.subMenuStyle.background =this.theme.palette.getAccent900()
    this.optionsIcon!.border = `1px solid ${ this.theme.palette.getAccent200()}` ;
    this.optionsIcon.background =  this.theme.palette.getAccent900()
    this.deleteBubbleStyle.textColor =this.theme.palette.getAccent400()
    this.deleteBubbleStyle.textFont = fontHelper(this.theme.typography.subtitle1);
    this.groupActionStyle.textColor = this.theme.palette.getAccent600("light");
    this.groupActionStyle.textFont = fontHelper(this.theme.typography.subtitle2);
    this.placeholderStyle.textFont = fontHelper(this.theme.typography.subtitle1);
    this.placeholderStyle.textColor = this.theme.palette.getAccent("light");
    this.ref.detectChanges()
  }
  // get avatar image for user or group
  checkAvatarValue(messageObject: CometChat.BaseMessage): string {
    if (messageObject.getSender().getAvatar()) {
      return messageObject.getSender().getAvatar();
    }
    else {
      return ""
    }
  }
  // hide show menu options on hover
  hideShowMenuOption(event?: MouseEvent) {
    if (event && event.type == "mouseenter") {
      this.isHovering ? this.isHovering = false : this.isHovering = true;
      this.ref.detectChanges()
    }
    else if (event && event.type == "mouseleave") {
      !this.isHovering ? this.isHovering = true : this.isHovering = false;
      this.ref.detectChanges()
    }
  }
  checkConfiguration() {
    if (this.menuListConfiguration) {
      let defaultConfiguration: MenuListConfiguration = new MenuListConfiguration({})
      let configuration: MenuListConfiguration = this.menuListConfiguration
      this.setMenuListConfiguration(configuration, defaultConfiguration)
    }
    else {
      let defaultConfiguration: MenuListConfiguration = new MenuListConfiguration({})
      this.setMenuListConfiguration(defaultConfiguration)
    }
    if (this.avatarConfiguration) {
      let defaultConfig = new AvatarConfiguration({})
      this.setAvatarConfig(this.avatarConfiguration, defaultConfig)
    }
    else {
      let defaultConfig = new AvatarConfiguration({});
      this.setAvatarConfig(defaultConfig)
    }
    if (this.messageReceiptConfiguration) {
      let defaultConfig = new MessageReceiptConfiguration({})
      this.setMessageReceiptConfig(this.messageReceiptConfiguration, defaultConfig)
    }
    else {
      let defaultConfig =  new MessageReceiptConfiguration({})
      this.setMessageReceiptConfig(defaultConfig)
    }
    if (this.dateConfiguration) {
      let defaultConfiguration: DateConfiguration = new DateConfiguration({})
      let configuration: DateConfiguration = this.dateConfiguration
      this.setDateConfiguration(configuration, defaultConfiguration)
    }
    else {
      let defaultConfiguration: DateConfiguration = new DateConfiguration({})
      this.setDateConfiguration(defaultConfiguration)
    }
  }
  setMenuListConfiguration(configuration: MenuListConfiguration, defaultConfiguration?: MenuListConfiguration){
    this.limit = configuration.mainMenuLimit || defaultConfiguration!.mainMenuLimit;
    this.moreIconURL = configuration.moreIconURL || defaultConfiguration!.moreIconURL;
    this.ref.detectChanges();
  }
  setDateConfiguration(configuration: DateConfiguration, defaultConfiguration?: DateConfiguration){
    this.dateFormat.dateFormat = configuration.dateFormat || defaultConfiguration!.dateFormat
    this.dateFormat.pattern = configuration.pattern || defaultConfiguration!.pattern
    this.dateFormat.timeFormat = configuration.timeFormat || defaultConfiguration!.timeFormat
  }
  setAvatarConfig(config: any = {}, defaultConfig?: any) {
    this.avatarStyle.height = config.height || defaultConfig.height;
    this.avatarStyle.width = config.width || defaultConfig.width;
    this.avatarStyle.border = config.border || defaultConfig.border;
    this.avatarStyle.borderRadius = config.borderRadius || defaultConfig.borderRadius;
    this.avatarStyle.outerView = config.outerView || defaultConfig.outerView;
    this.avatarStyle.outerViewSpacing = config.outerViewSpacing || defaultConfig.outerViewSpacing;
  }
  setMessageReceiptConfig(config: any = {}, defaultConfig?: any) {
    this.messageReceiptIcons.messageWaitIcon = config.messageWaitIcon || defaultConfig.messageWaitIcon;
    this.messageReceiptIcons.messageSentIcon = config.messageSentIcon || defaultConfig.messageSentIcon;
    this.messageReceiptIcons.messageDeliveredIcon = config.messageDeliveredIcon || defaultConfig.messageDeliveredIcon;
    this.messageReceiptIcons.messageReadIcon = config.messageReadIcon || defaultConfig.messageReadIcon;
    this.messageReceiptIcons.messageErrorIcon = config.messageErrorIcon || defaultConfig.messageErrorIcon;
  }
  // message bubble styling
  messageBubbleStyle = {
    messageHoverStyle: () => {
      return {
        width: this.style.width,
        height: this.style.height,
      }
    },
    messageGutterStyle: () => {
      return {
        width: this.style.width,
        background: "rgb(51, 153, 255)",
      }
    },
    messageKitReceiptStyle: () => {
      let justifyContent;
      this.alignment === "right" && this.messageBubbleData.readReceipt ? justifyContent = { justifyContent: "flex-end" } : { justifyContent: "flex-start" };
      return {
        ...justifyContent,
      };
    },
    userNameStyle: () => {
      let justifyContent = this.alignment === "right" ? { justifyContent: "flex-end" } : { justifyContent: "flex-start" };
      return {
        font: this.style.nameTextFont || "500 12px Inter, sans-serif",
        color: this.style.nameTextColor ||"rgba(20, 20, 20, 0.58)" ,
        ...justifyContent,
      };
    },
    nameFontStyle: () => {
      return {
        font: this.style.nameTextFont,
        color: this.style.nameTextColor
      }
    },
    timeStampStyle: () => {
      let lineHeight;
      let fontSize;
      if (this.timeAlignment === "top") {
        lineHeight = { lineHeight: "20px" }
        fontSize = { fontSize: "13px" }
      } else {
        lineHeight = { lineHeight: "12px" };
        fontSize = { fontSize: "11px" };
      }
      return {
        font: this.style.timeFont,
        color: this.style.timeColor,
        ...fontSize,
        ...lineHeight,
      }
    },
    bubbleBackground: () => {
      return {
        border: this.style.border,
        background: this.style.background,
        borderRadius: this.style.borderRadius,
      }
    },
    messageOptionStyles:()=>{
      let right = {right:this.messageObject?.getReceiverId() != this.loggedInUser?.getUid() ? "20px" : "none"}
      return{
        ...right 
      }
    },
    translatedMessageStyle:()=>{
      return{
        color:this.theme.palette.getAccent500(),
        font: fontHelper(this.theme.typography.caption2)
      }
    },
    translatedMessageTextStyle:()=>{
      return{
        color: this.messageObject?.getReceiverId() != this.loggedInUser?.getUid() ?  this.theme.palette.getAccent900("light") : this.theme.palette.getAccent900("dark"),
        font:fontHelper(this.theme.typography.subtitle2)
      }
    }
  }
}