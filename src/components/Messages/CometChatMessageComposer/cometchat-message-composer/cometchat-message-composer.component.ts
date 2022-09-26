import { Component, OnInit, Input, Output, EventEmitter, ViewChild, ElementRef, ChangeDetectionStrategy, ChangeDetectorRef, OnChanges, SimpleChanges } from '@angular/core';
import {  getUnixTimestamp, ID, checkMessageForExtensionsData, checkHasOwnProperty } from '../../../Shared/Helpers/CometChatHelper';
import { CometChat } from '@cometchat-pro/chat';
import { MessageStatus, composerEnums, MetadataKey, MessageTypes,  messageConstants } from '../../../Shared/Constants/UIKitConstants';
import {  MessagePreviewConfiguration, EmojiKeyboardConfiguration, StickerKeyboardConfiguration, ActionSheetConfiguration, CreatePollConfiguration, } from '../../../Shared';
import {styles} from '../../../Shared/Types/interface'
import { CometChatTheme } from '../../../Shared';
import { CometChatMessageEvents } from '../../CometChatMessageEvents.service';
import { CometChatSoundManager } from '../../../Shared/PrimaryComponents/CometChatSoundManager/cometchat-sound-manager/cometchat-sound-manager';
import { helperService } from '../../../Shared/CometChatMethodHelper.service';
import { stickerKeyboardStyle } from '../../CometChatStickerKeyboard/interface';
import { fontHelper } from '../../../Shared/PrimaryComponents/CometChatTheme/Typography';
import { CometChatMessageTemplate, getDefaultTypes } from '../../CometChatMessageTemplate/cometchat-message-template';
import { actionSheetStyles, composerStyles, createPollStyle, messagePreviewStyle, toolTipStyles } from '../interface';
import { popoverStyles } from '../../../Shared/UtilityComponents/CometChatPopover/interface';
import { PopoverConfiguration } from '../../../Shared/PrimaryComponents/CometChatConfiguration/PopoverConfiguration';
import { CometChatWrapperComponent } from '../../../Shared/PrimaryComponents/CometChatTheme/CometChatThemeWrapper/cometchat-theme-wrapper.component';
  /**
*
* CometChatMessageComposer is used to send message to user or group.
*
* @version 1.0.0
* @author CometChatTeam
* @copyright © 2022 CometChat Inc.
*
*/
@Component({
  selector: 'cometchat-message-composer',
  templateUrl: './cometchat-message-composer.component.html',
  styleUrls: ['./cometchat-message-composer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CometChatMessageComposerComponent implements OnInit, OnChanges {
  @ViewChild("inputElement", { static: false }) inputElementRef!: ElementRef;
        /**
   * This properties will come from Parent.
   */
  @Input() user!: CometChat.User | null;
  @Input() group!: CometChat.Group | null;
  @Input() style: composerStyles = {
    width: "100%",
    height: "12px",
    border: "",
    borderRadius: "12px",
    background: "",
    inputBackground: "rgba(20, 20, 20, 0.04)", // done
    inputTextFont: "", // done 
    inputTextColor: "", // done
  }
  @Input() attachmentIconURL: string = "assets/resources/Plus.svg";
  @Input() liveReactionIconURL: string = "assets/resources/heart-reaction.png";
  @Input() stickerIconURL: string = "assets/resources/Stickers.svg";
  @Input() closeIconURL: string = "assets/resources/plus-rotated.svg";
  @Input() sendButtonIconURL: string = "assets/resources/Send.svg";
  @Input() emojiIconURL: string = "assets/resources/Stipop.svg";
  @Input() placeholderText: string = "Enter your message here";
  @Input() hideAttachment: boolean = false;
  @Input() hideLiveReaction: boolean = false;
  @Input() hideEmoji: boolean = false;
  @Input() showSendButton: boolean = false;
  @Input() onSendButtonClick: any = null;
  @Input() messageTypes: CometChatMessageTemplate[] = [];
  @Input() customOutgoingMessageSound: string = ""
  @Input() enableSoundForMessages: boolean = true
  @Input() enableTypingIndicator: boolean = true
  @Input() excludeMessageTypes: string[] = [];
  @Input()  createPollConfiguration: CreatePollConfiguration = new CreatePollConfiguration({})
  @Input()  stickerKeyboardConfiguration: StickerKeyboardConfiguration = new StickerKeyboardConfiguration({})
  @Input()  actionSheetConfiguration: ActionSheetConfiguration = new ActionSheetConfiguration({})
  @Input()  emojiKeyboardConfiguration: EmojiKeyboardConfiguration = new EmojiKeyboardConfiguration({})
  @Input()  messagePreviewConfiguration: MessagePreviewConfiguration = new MessagePreviewConfiguration({})
  @Input()  popoverConfiguration: PopoverConfiguration = new PopoverConfiguration({})
      /**
     * Properties for internal use
     */
  public theme = new CometChatTheme({})
  inputType: string = ""
  inputAcceptType: string = ""
  public event: any;
  messageInput: string = "";
  enableSendButton: boolean = false;
  public showCreatePoll: boolean = false;
  enableReaction: boolean = true;
  isTyping: any;
  userBlocked: boolean = false;
  emojiToggled: boolean = false;
  messageSending: boolean = false;
  messageToBeEdited: CometChat.BaseMessage | null = null;
  textToBeEdited: string = "";
  loggedInUser!: CometChat.User | null;
  parentMessageId: number = 0;
  openEditMessageWindow: boolean = false;
  checkAnimatedState = "normal";
  showActionSheetItem: boolean = false;
  showActionSheetEmoji: boolean = false;
  showSticker: boolean = false;
  ATTACH_FILE: string = composerEnums.attach_file;
  ATTACH_VIDEO: string = composerEnums.attach_video;
  ATTACH_AUDIO: string = composerEnums.attach_audio;
  ATTACH_IMAGE: string = composerEnums.attach_image;
  hideLayoutMode: boolean = false;
  title: string = "";
  layoutModeIconURL: string = "";
  layoutMode: string = "";
  actionSheetStyles: actionSheetStyles = {
    width: "100%",
    height: "100%",
    borderRadius: "8px",
    background: this.theme.palette.getAccent900(),
    titleFont: fontHelper(this.theme.typography.title1),
    titleColor: this.theme.palette.getAccent(),
    layoutModeIconTint: this.theme.palette.getAccent900("light"),
  }
  // createpoll properties
  errorText: string = "";
  createPollTitle: string = "Create Poll";
  onClose!: () => void;
  onCreatePoll!: () => void;
  createPollCloseIconURL:string=""
  defaultAnswers: number = 2;
  questionPlaceholderText: string = "Question";
  optionPlaceholderText: string = "Answer";
  answerHelpText: string = "Set Answers";
  deleteIconURL: string = "assets/resources/deleteicon.svg";
  addAnswerIconURL: string = "assets/resources/Plus.svg";
  AddAnswerButtonText: string = "Add Answer";
  createPollButtonText: string = "Send";
  types: CometChatMessageTemplate[] = [];
  defaultMessageTemplate: CometChatMessageTemplate[] = [];
  // sticker keyboard style
  emptyText: string = "";
  loadingText: string = "";
  stickerErrorText: string = "";
  onClick: any = null;
  //  emoji keyboard properties
  hideSearch: boolean = true;
  onEmojiIconClick: any = null;
  // tooltip properties
  position: string = "top"
  // messagePreview properties
  messagePreviewTitle: string = "";
  messagePreviewSubtitle: string = "";
  messagePreviewCloseButtonIconURL: string = "";
  onCloseClick: any = null;
  showMessagePreview: boolean = false
  public stickerKeyboardStyles: stickerKeyboardStyle = {
  }
  public toolTipStyles: toolTipStyles = {
    borderRadius: "8px",
    boxShadow: "0px 0px 32px rgba(20, 20, 20, 0.2)",
    height: "400px",
    width: "272px"
  }
  public emojiKeyboardTooltipStyle: toolTipStyles = {
    width: "272px",
    height: "330px",
    boxShadow: "0px 0px 32px rgba(20, 20, 20, 0.2)",
    borderRadius: "8px"
  }
  public emojiKeyboardStyle: styles = {
    borderRadius: "8px"
  }
  public isDialogOpen: boolean = false
  public messagePreviewStyles: messagePreviewStyle = {
    messagePreviewBorder: "none",
    messagePreviewBackground: "white",
    messagePreviewTitleFont: "500 12px Inter, sans-serif",
    messagePreviewTitleColor: "grey",
    messagePreviewSubtitleColor: "grey",
    messagePreviewSubtitleFont: "400 13px Inter, sans-serif",
    messagePreviewCloseButtonIconTint: "grey",
  }
  public createPollPopverStyle:popoverStyles = {
    height: "620px",
    width: "360px",
    border:"none",
    background:"white",
    borderRadius:"12px", 
    boxShadow: "0px 0px 32px rgba(20, 20, 20, 0.2)",
    top:"50%",
    left:"50%",
    transform:"translate(-50%,-50%)",
    position:"fixed"

  }
  withBackdrop:boolean=true;
  public createPollStyle: createPollStyle = {
    width: "100%",
    height: "100%",
    border: "",
    borderRadius: "8px",
    background: "white",
    placeholderTextFont: "",
    placeholderTextColor: "",
    deleteIconTint: "grey",
    titleFont: "700 22px Inter, sans-serif",
    titleColor: "rgb(20, 20, 20)",
    closeIconTint: "rgb(51, 153, 255)",
    questionBackground: "rgba(20, 20, 20, 0.08)",
    answerHelpTextFont: "500 12px Inter, sans-serif",
    answerHelpTextColor: "rgba(20, 20, 20, 0.58)",
    addAnswerIconTint: "rgb(51, 153, 255)",
    createPollButtonTextFont: "600 15px Inter, sans-serif",
    createPollButtonTextColor: "rgb(255, 255, 255)",
    createPollButtonBackground: "rgb(51, 153, 255)",
    addAnswerTextFont: "500 15px Inter, sans-serif",
    addAnswerTextColor: "rgb(51, 153, 255)",
    errorTextFont!: "400 15px Inter, sans-serif",
    optionPlaceholderTextFont: "",
    optionPlaceholderTextColor: "",
    errorTextColor: "rgb(255, 59, 48)"
  }
  constructor(private messageEvents: CometChatMessageEvents, private helperService: helperService, private ref: ChangeDetectorRef) { }
  ngOnChanges(changes: SimpleChanges): void {

    if (changes["user"] || changes["group"]) {
      this.filterMessageTypes()
    }
  }
  ngOnInit(): void {

    let i = 0;
    this.checkConfiguration();
    this.getLoggedInUserInfo();
    this.setTheme();
    this.messageEvents.subscribeEvents(this.messageEvents.onStickerClick).subscribe((data: any) => {
      this.sendSticker(data);
    })
    setTimeout(() => {
    
  // if(this.loggedInUser?.getUid() == "superhero1"){
  //     setInterval(() => {
  //       if(i <= 1000){
  //         this.sendTextMessage("hello" + i)
  //       }
  //       i++
  //     }, 10);
    
  // }
  
}, 6000);

  }
  checkConfiguration() {
    if (this.actionSheetConfiguration) {
      let defaultConfiguration: ActionSheetConfiguration = new ActionSheetConfiguration({});
      let configuration: ActionSheetConfiguration = this.actionSheetConfiguration;
      this.setActionSheetConfiguration(configuration, defaultConfiguration)
    }
    else {
      let defaultConfiguration: ActionSheetConfiguration = new ActionSheetConfiguration({})
      this.setActionSheetConfiguration(defaultConfiguration)
    }
    if (this.createPollConfiguration) {
      let defaultConfiguration: CreatePollConfiguration = new CreatePollConfiguration({})
      let configuration: CreatePollConfiguration = this.createPollConfiguration
      this.setCreatePollConfiguration(configuration, defaultConfiguration)
    }
    else {
      let defaultConfiguration: CreatePollConfiguration = new CreatePollConfiguration({})
      this.setCreatePollConfiguration(defaultConfiguration)
    }
    if (this.stickerKeyboardConfiguration) {
      let defaultConfiguration: StickerKeyboardConfiguration = new StickerKeyboardConfiguration({})
      let configuration: StickerKeyboardConfiguration = this.stickerKeyboardConfiguration
      this.setStickerKeyboardConfiguration(configuration, defaultConfiguration)
    }
    else {
      let defaultConfiguration: StickerKeyboardConfiguration = new StickerKeyboardConfiguration({})
      this.setStickerKeyboardConfiguration(defaultConfiguration)
    }
    if (this.emojiKeyboardConfiguration) {
      let defaultConfiguration: EmojiKeyboardConfiguration = new EmojiKeyboardConfiguration({})
      let configuration: EmojiKeyboardConfiguration = this.emojiKeyboardConfiguration
      this.setEmojiKeyboardConfiguration(configuration, defaultConfiguration)
    }
    else {
      let defaultConfiguration: EmojiKeyboardConfiguration = new EmojiKeyboardConfiguration({})
      this.setEmojiKeyboardConfiguration(defaultConfiguration)
    }
    if (this.messagePreviewConfiguration) {
      let defaultConfiguration: MessagePreviewConfiguration = new MessagePreviewConfiguration({})
      let configuration: MessagePreviewConfiguration = this.messagePreviewConfiguration
      this.setMessagePreviewConfiguration(configuration, defaultConfiguration)
    }
    else {
      let defaultConfiguration: MessagePreviewConfiguration = new MessagePreviewConfiguration({})
      this.setMessagePreviewConfiguration(defaultConfiguration)
    }
   this.setPopoverConfig()
  }
  setPopoverConfig() {
    let defaultConfig = new PopoverConfiguration({});
    let config:PopoverConfiguration = this.popoverConfiguration;
    this.createPollPopverStyle = checkHasOwnProperty(config, "style") ? config.style : defaultConfig!.style;
  };
  setMessagePreviewConfiguration(configuration: MessagePreviewConfiguration, defaultConfiguration?: MessagePreviewConfiguration) {
    this.messagePreviewTitle = configuration.messagePreviewTitle || defaultConfiguration!.messagePreviewTitle;
    this.messagePreviewCloseButtonIconURL = configuration.messagePreviewCloseButtonIconURL || defaultConfiguration!.messagePreviewCloseButtonIconURL;
    this.onCloseClick = configuration.onCloseClick || this.emptyInputField;
  }
  setActionSheetConfiguration(configuration: ActionSheetConfiguration, defaultConfiguration?: ActionSheetConfiguration) {
    this.hideLayoutMode = checkHasOwnProperty(configuration, "hideLayoutMode") ? configuration.hideLayoutMode : defaultConfiguration!.hideLayoutMode;
    this.title = configuration.title || defaultConfiguration!.title;
    this.layoutModeIconURL = configuration.layoutModeIconURL || defaultConfiguration!.layoutModeIconURL;
    this.layoutMode = configuration.layoutMode || defaultConfiguration!.layoutMode;
  }
  setCreatePollConfiguration(configuration: CreatePollConfiguration, defaultConfiguration?: CreatePollConfiguration) {
    this.errorText = configuration.errorText || defaultConfiguration!.errorText;
    this.createPollTitle = configuration.title || defaultConfiguration!.title;
    this.onClose = configuration.onClose || this.closePollWindow;
    this.onCreatePoll = configuration.onCreatePoll || null;
    this.defaultAnswers = configuration.defaultAnswers || defaultConfiguration!.defaultAnswers;
    this.questionPlaceholderText = configuration.questionPlaceholderText || defaultConfiguration!.questionPlaceholderText;
    this.optionPlaceholderText = configuration.optionPlaceholderText || defaultConfiguration!.optionPlaceholderText;
    this.answerHelpText = configuration.answerHelpText || defaultConfiguration!.answerHelpText;
    this.createPollCloseIconURL = configuration.closeIconURL || defaultConfiguration!.closeIconURL;
    this.deleteIconURL = configuration.deleteIconURL || defaultConfiguration!.deleteIconURL;
    this.addAnswerIconURL = configuration.addAnswerIconURL || defaultConfiguration!.addAnswerIconURL;
    this.AddAnswerButtonText = configuration.AddAnswerButtonText || defaultConfiguration!.AddAnswerButtonText;
    this.createPollButtonText = configuration.createPollButtonText || defaultConfiguration!.createPollButtonText;
  }
  setStickerKeyboardConfiguration(configuration: StickerKeyboardConfiguration, defaultConfiguration?: StickerKeyboardConfiguration) {
    this.emptyText = configuration.emptyText || defaultConfiguration!.emptyText
    this.loadingText = configuration.loadingText || defaultConfiguration!.loadingText
    this.stickerErrorText = configuration.errorText || defaultConfiguration!.errorText
    this.onClick = configuration.onClick || this.sendSticker;
  }
  setEmojiKeyboardConfiguration(configuration: EmojiKeyboardConfiguration, defaultConfiguration?: EmojiKeyboardConfiguration) {
    this.hideSearch = checkHasOwnProperty(configuration, "hideSearch") ? configuration.hideSearch : defaultConfiguration!.hideSearch;;
    this.onEmojiIconClick = configuration.onClick || this.onEmojiClick;
  }
  /**
   * getting selected emoji on click from emoji keyboard
   * @param  {string} emoji
   */
  onEmojiClick = (emoji: string) => {
    this.addEmoji(emoji);
  }
  /**
  * filtering message types adn getting default message types if user does not send.
  */
  filterMessageTypes() {
    if (this.messageTypes && this.messageTypes.length) {
      let removeitems: any = []
      for (let element of this.messageTypes) {
        if (element.type == MessageTypes.text || element.type == MessageTypes.delete || element.type == "groupMember" || element.type == MessageTypes.sticker) {
          removeitems.push(element)
        }
      }
      let arr: any = this.messageTypes.filter((item: any) => !removeitems.includes(item));
      this.types = arr
    }
    else {
      (this.defaultMessageTemplate as any) = getDefaultTypes();
      // defaultMessageTemplate
      let removeitems: any = []
      for (let element of this.defaultMessageTemplate) {
        if (element.type == MessageTypes.text || element.type == MessageTypes.delete || element.type == "groupMember" || element.type == MessageTypes.sticker) {
          removeitems.push(element)
        }
      }
      let arr: any = this.defaultMessageTemplate.filter((item: any) => !removeitems.includes(item));
      this.types = arr
    }
    this.addCallback();
    this.ref.detectChanges();
  }
  addCallback(): void {
    this.types.forEach((element: CometChatMessageTemplate) => {
      if (element.type == MessageTypes.audio) {
        element.actionCallback = this.openAudioPicker
      }
      else if (element.type == MessageTypes.video) {
        element.actionCallback = this.openvideoPicker
      }
      else if (element.type == MessageTypes.file) {
        element.actionCallback = this.openFilePicker
      }
      else if (element.type == MessageTypes.whiteboard) {
        element.actionCallback = this.shareCollaborativeWhiteboard
      }
      else if (element.type == MessageTypes.document) {
        element.actionCallback = this.shareCollaborativeDocument
      }
      else if (element.type == MessageTypes.image) {
        element.actionCallback = this.openImagePicker
      }
      else if (element.type == MessageTypes.poll) {
        element.actionCallback = this.openCreatePoll
      }
    });
  }
  openImagePicker = (): void => {
    this.inputElementRef.nativeElement.type = "file"
    this.inputElementRef.nativeElement.accept = "image/*"
    this.inputElementRef.nativeElement.click()
  }
  openFilePicker = (): void => {
    this.inputElementRef.nativeElement.type = "file"
    this.inputElementRef.nativeElement.accept = "file/*"
    this.inputElementRef.nativeElement.click()
  }
  openvideoPicker = (): void => {
    this.inputElementRef.nativeElement.type = "file"
    this.inputElementRef.nativeElement.accept = "video/*"
    this.inputElementRef.nativeElement.click()
  }
  openAudioPicker = (): void => {
    this.inputElementRef.nativeElement.type = "file"
    this.inputElementRef.nativeElement.accept = "audio/*"
    this.inputElementRef.nativeElement.click()
  }
  inputChangeHandler = (event: any): void => {
    this.showActionSheetItem = false
    switch (this.inputElementRef.nativeElement.accept) {
      case "image/*":
        this.onImgChange(event)
        break;
      case "video/*":
        this.onVideoChange(event)
        break;
      case "audio/*":
        this.onAudChange(event)
        break;
      case "file/*":
        this.onFileChange(event)
        break;
      default:
        this.onFileChange(event)
        break;
    }
  }
  openCreatePoll = () => {
    this.showActionSheetItem = false
    if (this.showCreatePoll) {
      this.showCreatePoll = false;
      this.isDialogOpen = false
    }
    else {
      this.isDialogOpen = true
      this.showCreatePoll = true;
    }
  }
  emptyInputField = () => {
    this.messageToBeEdited = null;
    this.openEditMessageWindow = false;
    this.textToBeEdited = "";
    this.messageInput = "";
    this.ref.detectChanges();
  }
  setTheme(): void {
    if (CometChatWrapperComponent.cometchattheme ) {
      this.theme = CometChatWrapperComponent.cometchattheme
     }
    this.stickerKeyboardStyles.background = this.theme.palette.getAccent100();
    this.stickerKeyboardStyles.loadingTextColor = this.theme.palette.getAccent600();
    this.stickerKeyboardStyles.loadingTextFont = fontHelper(this.theme.typography.title1);
    this.stickerKeyboardStyles.errorTextColor = this.theme.palette.getAccent600();
    this.stickerKeyboardStyles.errorTextFont = fontHelper(this.theme.typography.title1);
    this.stickerKeyboardStyles.emptyTextColor = this.theme.palette.getAccent600();
    this.stickerKeyboardStyles.emptyTextFont = fontHelper(this.theme.typography.title1);
    this.stickerKeyboardStyles.categoryBackground = this.theme.palette.getAccent900();
    this.stickerKeyboardStyles.border = "none";
    this.stickerKeyboardStyles.borderRadius = "none";
    this.messagePreviewStyles.messagePreviewBackground = this.theme.palette.getAccent900();
    this.messagePreviewStyles.messagePreviewBorder = "none";
    this.messagePreviewStyles.messagePreviewCloseButtonIconTint = this.theme.palette.getAccent500();
    this.messagePreviewStyles.messagePreviewSubtitleColor = this.theme.palette.getAccent500();
    this.messagePreviewStyles.messagePreviewSubtitleFont = fontHelper(this.theme.typography.subtitle2);
    this.messagePreviewStyles.messagePreviewTitleColor = this.theme.palette.getAccent500();
    this.messagePreviewStyles.messagePreviewTitleFont = fontHelper(this.theme.typography.caption1);
    this.createPollStyle.addAnswerIconTint = this.theme.palette.getPrimary();
    this.createPollStyle.addAnswerTextColor = this.theme.palette.getPrimary();
    this.createPollStyle.addAnswerTextFont = fontHelper(this.theme.typography.caption1);
    this.createPollStyle.answerHelpTextColor = this.theme.palette.getAccent600();
    this.createPollStyle.answerHelpTextFont = fontHelper(this.theme.typography.caption1);
    this.createPollStyle.background = this.theme.palette.getAccent900();
    this.createPollStyle.closeIconTint = this.theme.palette.getPrimary();
    this.createPollStyle.createPollButtonBackground = this.theme.palette.getPrimary();
    this.createPollStyle.createPollButtonTextColor = this.theme.palette.getAccent("dark");
    this.createPollStyle.createPollButtonTextFont = fontHelper(this.theme.typography.title1);
    this.createPollStyle.deleteIconTint = this.theme.palette.getAccent600();
    this.createPollStyle.errorTextColor = this.theme.palette.getError();
    (this.createPollStyle.errorTextFont as string)! = fontHelper(this.theme.typography.title1);
    this.createPollStyle.placeholderTextColor = this.theme.palette.getAccent900();
    this.createPollStyle.optionPlaceholderTextFont = fontHelper(this.theme.typography.subtitle1);
    this.createPollStyle.optionPlaceholderTextColor = this.theme.palette.getAccent900();
    this.createPollStyle.placeholderTextFont = fontHelper(this.theme.typography.subtitle1);
    this.createPollStyle.questionBackground = this.theme.palette.getSecondary();
    this.createPollStyle.titleColor = this.theme.palette.getAccent();
    this.createPollStyle.titleFont = fontHelper(this.theme.typography.title2);
  }
  getLoggedInUserInfo(): void {
    try {
      CometChat.getLoggedinUser()
        .then((user: CometChat.User | null) => {
          this.loggedInUser = user;
        })
        .catch((error:any) => {
          this.messageEvents.publishEvents(this.messageEvents.onError, error);
        });
    } catch (error:any) {
        this.messageEvents.publishEvents(this.messageEvents.onError, error);;
    }
  }
  changeHandler(event: any): void {
    try {
      if (this.enableTypingIndicator) {
        this.startTyping();
      }
      if (event.target.value.length > 0) {
        this.showSendButton = true
        this.messageInput = event.target.value;
        this.enableSendButton = true;
        this.hideLiveReaction = true
        this.enableReaction = false;
        this.ref.detectChanges()
      }
      if (event.target.value.length == 0) {
        this.showSendButton = false;
        this.enableSendButton = false;
        this.hideLiveReaction = false
        this.enableReaction = true;
        this.messageInput = "";
        this.ref.detectChanges()
      }
    } catch (error:any) {
        this.messageEvents.publishEvents(this.messageEvents.onError, error);;
    }
  }
  /**
   * @param  {} timer=null
   * @param  {string=""} metadata
   */
  startTyping(timer = null, metadata: string = ""): void {
    try {
      let typingInterval = timer || 5000;
      if (this.isTyping > 0) {
      }
      let { receiverId, receiverType } = this.getReceiverDetails();
      let typingMetadata = metadata || undefined;
      let typingNotification = new CometChat.TypingIndicator(
        receiverId,
        receiverType,
        typingMetadata
      );
      CometChat.startTyping(typingNotification);
      this.isTyping = setTimeout(() => {
        this.endTyping();
      }, typingInterval);
    } catch (error:any) {
        this.messageEvents.publishEvents(this.messageEvents.onError, error);;
    }
  }
  endTyping(metadata = null) {
    if (this.enableTypingIndicator) {
      try {
        let { receiverId, receiverType } = this.getReceiverDetails();
        let typingMetadata = metadata || undefined;
        let typingNotification = new CometChat.TypingIndicator(
          receiverId,
          receiverType,
          typingMetadata
        );
        CometChat.endTyping(typingNotification);
        clearTimeout(this.isTyping);
        this.isTyping = null;
      } catch (error:any) {
          this.messageEvents.publishEvents(this.messageEvents.onError, error);;
      }
    }
  }
  getReceiverDetails() {
    let receiverId!: string;
    let receiverType!: string;
    if (this.user && this.user.getUid()) {
      receiverId = this.user.getUid();
      receiverType = CometChat.RECEIVER_TYPE.USER;
    } else if (this.group && this.group.getGuid()) {
      receiverId = this.group.getGuid();
      receiverType = CometChat.RECEIVER_TYPE.GROUP;
    }
    return { receiverId: receiverId, receiverType: receiverType };
  }
  /**
   * @param  {any} event
   */
  sendMessageOnEnter(event: any) {
    try {
      if (event.keyCode === 13 && !event.shiftKey) {
        event.preventDefault();
        this.sendTextMessage(event.target.value);
        event.target.value = "";
      }
    } catch (error:any) {
        this.messageEvents.publishEvents(this.messageEvents.onError, error);;
    }
  }
  /**
   */
  type(): CometChat.User | CometChat.Group {
    let type!: CometChat.User | CometChat.Group;
    if (this.user && this.user.getUid()) {
      type = this.user
    } else if (this.group && this.group.getGuid()) {
      type = this.group
    }
    return type;
  }
  /**
   * @param  {string} data
   */
  addEmoji(data: string) {
    try {
      this.enableSendButton = true;
      this.enableReaction = false;
      this.hideLiveReaction = false
      this.showSendButton = true
      let emoji = data;
      this.messageInput = this.messageInput + emoji;
      this.ref.detectChanges()
    } catch (error:any) {
        this.messageEvents.publishEvents(this.messageEvents.onError, error);;
    }
  }
  /**
   * @param  {String=""} textMsg
   */
  sendTextMessage(textMsg: String = ""): boolean {
    try {
      //If user you are chatting with is blocked then return false
      if (this.userBlocked) {
        return false;
      }
      // Close Emoji Viewer if it is open while sending the message
      if (this.emojiToggled) {
        this.emojiToggled = false;
      }
      // Dont Send Blank text messages -- i.e --- messages that only contain spaces
      if (this.messageInput.trim().length == 0 && textMsg.trim().length == 0) {
        return false;
      }
      // wait for the previous message to be sent before sending the current message
      if (this.messageSending) {
        return false;
      }
      this.messageSending = true;
      // If its an Edit and Send Message Operation , use Edit Message Function
      if (this.messageToBeEdited) {
        this.editMessage();
        this.ref.detectChanges()
        return false;
      }
      let { receiverId, receiverType } = this.getReceiverDetails();
      let messageInput;
      if (textMsg !== null) {
        messageInput = textMsg.trim();
      } else {
        messageInput = this.messageInput.trim();
      }
      let textMessage: any = new CometChat.TextMessage(
        receiverId,
        messageInput,
        receiverType
      );
      if (this.parentMessageId) {
        textMessage.setParentMessageId(this.parentMessageId);
      }
      textMessage.setSentAt(getUnixTimestamp());
      textMessage.setMuid(ID());
      this.helperService.addMessage((textMessage as CometChat.BaseMessage), MessageStatus.inprogress)
      // play audio after action generation
      if (this.enableSoundForMessages) {
        this.playAudio();
      }
      //clearing Message Input Box
      this.messageInput = "";
      this.messageSending = false;
      // End Typing Indicator Function
      this.endTyping();
      CometChat.sendMessage(textMessage)
        .then((message: CometChat.TextMessage | CometChat.BaseMessage) => {
          let messageObject: CometChat.BaseMessage = message;
          this.helperService.addMessage(messageObject, MessageStatus.success)

          // Change the send button to reaction button
          setTimeout(() => {
            this.hideLiveReaction = false;
            this.enableSendButton = false;
            this.showSendButton = false;
            this.ref.detectChanges()
          }, 500);
        })
        .catch((error:any) => {
          this.messageEvents.publishEvents(this.messageEvents.onMessageError, {
            message: textMessage,
            error: error
          })
          this.messageSending = false;
        });
    } catch (error:any) {
        this.messageEvents.publishEvents(this.messageEvents.onError, error);;
    }
    return true;
  }
  /**
   * @param  {any} messageInput
   * @param  {any} messageType
   */
  sendMediaMessage(messageInput: any, messageType: any): boolean {
    try {
      this.toggleFilePicker();
      if (this.messageSending) {
        return false;
      }
      this.messageSending = true;
      const { receiverId, receiverType } = this.getReceiverDetails();
      let mediaMessage: any = new CometChat.MediaMessage(
        receiverId,
        messageInput,
        messageType,
        receiverType
      );
      if (this.parentMessageId) {
        mediaMessage.setParentMessageId(this.parentMessageId);
      }
      // mediaMessage.setSender(this.loggedInUser);
      // mediaMessage.setReceiver(this.type());
      mediaMessage.setType(messageType);
      mediaMessage.setMetadata({
        ["file"]: messageInput,
      });
      mediaMessage.setSentAt(getUnixTimestamp());
      mediaMessage.setMuid(ID());
      this.endTyping();
      this.messageEvents.publishEvents(this.messageEvents.onMessageSent, {
        message: mediaMessage,
        status: MessageStatus.inprogress
      });
      if (this.enableSoundForMessages) {
        this.playAudio();
      }
      this.messageSending = false;
      CometChat.sendMessage(mediaMessage)
        .then((response: CometChat.BaseMessage) => {
          this.messageSending = false;
          response.setMuid(mediaMessage.getMuid())
          this.messageEvents.publishEvents(this.messageEvents.onMessageSent, {
            message: response,
            status: MessageStatus.success
          });
        })
        .catch((error) => {
          this.messageEvents.publishEvents(this.messageEvents.onMessageError, {
            message: mediaMessage,
            error: error
          })
          this.messageSending = false;
        });
    } catch (error) {
        this.messageEvents.publishEvents(this.messageEvents.onError, error);;
    }
    return true;
  }
  /**
   * @param  {any} stickerMessage
   */
  sendSticker = (stickerMessage: any) => {
    try {
      this.messageSending = true;
      const { receiverId, receiverType } = this.getReceiverDetails();
      const customData = {
        sticker_url: stickerMessage.stickerUrl,
        sticker_name: stickerMessage.stickerName,
      };
      const customType = MessageTypes.sticker;
      const customMessage: CometChat.CustomMessage = new CometChat.CustomMessage(
        receiverId,
        receiverType,
        customType,
        customData
      );
      if (this.parentMessageId) {
        customMessage.setParentMessageId(this.parentMessageId);
      }
      customMessage.setMetadata({ incrementUnreadCount: true });
      (customMessage as any).setSentAt(getUnixTimestamp());
      customMessage.setMuid(ID());
      this.messageEvents.publishEvents(this.messageEvents.onMessageSent, {
        message: customMessage,
        status: MessageStatus.inprogress
      })
      if (this.enableSoundForMessages) {
        this.playAudio();
      }
      CometChat.sendCustomMessage(customMessage)
        .then((message) => {
          this.messageSending = false;
          this.messageEvents.publishEvents(this.messageEvents.onMessageSent, {
            message: message,
            status: MessageStatus.success
          })
        })
        .catch((error:any) => {
          this.messageEvents.publishEvents(this.messageEvents.onMessageError, {
            message: customMessage,
            error: error
          })
          this.messageSending = false;
        });
    } catch (error:any) {
        this.messageEvents.publishEvents(this.messageEvents.onError, error);;
    }
  }
  sendReaction() {
    //If user you are chatting with is blocked then return false
    if (this.userBlocked) {
      return false;
    }
    let receiverId: string = this.user ? this.user?.getUid()! : this.group?.getGuid()!;
    let receiverType = this.user ? CometChat.RECEIVER_TYPE.USER : CometChat.RECEIVER_TYPE.GROUP;
    let data = { "LIVE_REACTION": this.liveReactionIconURL };
    let transientMessage = new CometChat.TransientMessage(receiverId, receiverType, data);
    CometChat.sendTransientMessage(transientMessage);
    this.messageEvents.publishEvents(this.messageEvents.onLiveReaction, {
      reaction: this.liveReactionIconURL,
    })
    return;
  }
  shareCollaborativeDocument = () => {
    const { receiverId, receiverType } = this.getReceiverDetails();
    CometChat.callExtension(MetadataKey.extensions.document, "POST", messageConstants.V1_CREATE, {
      receiver: receiverId,
      receiverType: receiverType,
    }).catch((error:any) => { });
  };
  shareLiveReaction() {
    // to be implemented
  }
  shareCollaborativeWhiteboard = () => {
    const { receiverId, receiverType } = this.getReceiverDetails();
    CometChat.callExtension(MetadataKey.extensions.whiteboard, "POST", messageConstants.V1_CREATE, {
      receiver: receiverId,
      receiverType: receiverType,
    })
      .then((res:any) => {
      })
      .catch((error:any) => { });
  };
  playAudio() {
    if (this.customOutgoingMessageSound) {
      CometChatSoundManager.play(CometChatSoundManager.Sound.outgoingMessage, this.customOutgoingMessageSound)
    }
    else {
      CometChatSoundManager.play(CometChatSoundManager.Sound.outgoingMessage)
    }
  }
  /**
   * @param  {any} event
   */
  onVideoChange(event: any): boolean {
    try {
      if (!event.target.files[0]) {
        return false;
      }
      const uploadedFile = event.target.files[0];
      const reader: any = new FileReader();
      reader.addEventListener(
        "load",
        () => {
          const newFile = new File(
            [reader.result],
            uploadedFile.name,
            uploadedFile
          );
          this.sendMediaMessage(newFile, CometChat.MESSAGE_TYPE.VIDEO);
        },
        false
      );
      reader.readAsArrayBuffer(uploadedFile);
    } catch (error:any) {
        this.messageEvents.publishEvents(this.messageEvents.onError, error);;
    }
    return true;
  }
  /**
   * @param  {any} event
   */
  onAudChange(event: any): boolean {
    try {
      if (!event.target.files[0]) {
        return false;
      }
      const uploadedFile = event.target.files[0];
      const reader: any = new FileReader();
      reader.addEventListener(
        "load",
        () => {
          const newFile = new File(
            [reader.result],
            uploadedFile.name,
            uploadedFile
          );
          this.sendMediaMessage(newFile, CometChat.MESSAGE_TYPE.AUDIO);
        },
        false
      );
      reader.readAsArrayBuffer(uploadedFile);
    } catch (error:any) {
        this.messageEvents.publishEvents(this.messageEvents.onError, error);;
    }
    return true;
  }
  /**
   * @param  {any} event
   */
  onImgChange(event: any): boolean {
    try {
      if (!event.target.files[0]) {
        return false;
      }
      const uploadedFile = event.target.files[0];
      const reader: any = new FileReader();
      reader.addEventListener(
        "load",
        () => {
          const newFile = new File(
            [reader.result],
            uploadedFile.name,
            uploadedFile
          );
          this.sendMediaMessage(newFile, CometChat.MESSAGE_TYPE.IMAGE);
        },
        false
      );
      reader.readAsArrayBuffer(uploadedFile);
    } catch (error) {
        this.messageEvents.publishEvents(this.messageEvents.onError, error);;
    }
    return true;
  }
  /**
   * @param  {any} event
   */
  onFileChange(event: any): boolean {
    try {
      if (!event.target.files["0"]) {
        return false;
      }
      const uploadedFile = event.target.files["0"];
      var reader: any = new FileReader();
      reader.addEventListener(
        "load",
        () => {
          const newFile = new File(
            [reader.result],
            uploadedFile.name,
            uploadedFile
          );
          this.sendMediaMessage(newFile, CometChat.MESSAGE_TYPE.FILE);
        },
        false
      );
      reader.readAsArrayBuffer(uploadedFile);
    } catch (error:any) {
        this.messageEvents.publishEvents(this.messageEvents.onError, error);;
    }
    return true;
  }
  toggleFilePicker(): boolean {
    try {
      //If user you are chatting with is blocked then return false
      if (this.userBlocked) {
        return false;
      }
      this.checkAnimatedState == "normal"
        ? (this.checkAnimatedState = "animated")
        : (this.checkAnimatedState = "normal");
    } catch (error:any) {
        this.messageEvents.publishEvents(this.messageEvents.onError, error);;
    }
    return true;
  }
  editMessage() {
    try {
      const messageToBeEdited: any = this.messageToBeEdited;
      let { receiverId, receiverType } = this.getReceiverDetails();
      let messageText = this.messageInput.trim();
      let textMessage: any = new CometChat.TextMessage(
        receiverId,
        messageText,
        receiverType
      );
      textMessage.setId(messageToBeEdited.id);
      this.closeEditPreview();
      this.endTyping();
      CometChat.editMessage(textMessage)
        .then((message) => {
          this.messageInput = "";
          this.messageSending = false;
          this.enableSendButton = false;
          this.enableReaction = true;
          this.messageEvents.publishEvents(this.messageEvents.onMessageEdit, {
            message: message,
            status: MessageStatus.success
          })
        })
        .catch((error) => {
          this.messageSending = false;
          this.messageEvents.publishEvents(this.messageEvents.onMessageError, {
            message: textMessage,
            error: error
          })
        });
    } catch (error) {
        this.messageEvents.publishEvents(this.messageEvents.onError, error);;
    }
  }
  /**
   * @param  {any} previewMessage
   */
  openEditPreview(previewMessage: CometChat.BaseMessage | null) {
    try {
      this.messageToBeEdited = previewMessage;
      this.openEditMessageWindow = true;
      this.textToBeEdited = (this.messageToBeEdited as CometChat.TextMessage).getText();
      this.messageInput = this.textToBeEdited
      this.ref.detectChanges();
    } catch (error:any) {
        this.messageEvents.publishEvents(this.messageEvents.onError, error);;
    }
  }
  closeEditPreview() {
    try {
      this.openEditMessageWindow = false;
      this.messageToBeEdited = null;
      this.messageInput = "";
      this.ref.detectChanges()
    } catch (error:any) {
        this.messageEvents.publishEvents(this.messageEvents.onError, error);;
    }
  }
  /**
   * @param  {string} value
   * @param  {any} ev
   */
  toggleActionSheet(value: string, ev: any) {
    this.event = ev;
    if (value === 'item') {
      this.showSticker = false
      this.showActionSheetEmoji = false
      this.showActionSheetItem = !this.showActionSheetItem;
    }
    else if (value === 'emoji') {
      this.showSticker = false
      this.showActionSheetItem = false;
      this.showActionSheetEmoji = !this.showActionSheetEmoji;
    }
    else if (value === 'sticker') {
      this.showActionSheetEmoji = false
      this.showActionSheetItem = false;
      this.showSticker = !this.showSticker
    }
  }
  /**
   * @param  {String} message
   */
  customSendMethod(message: String) {
    if (this.onSendButtonClick) {
      this.onSendButtonClick();
    } else {
      this.sendTextMessage(message);
      this.showSendButton = false
      this.hideLiveReaction = false
      this.showActionSheetEmoji = false
      this.enableReaction = true
      this.ref.detectChanges()
    }
  }
  closePollWindow = () => {
    this.showCreatePoll = false;
    this.isDialogOpen = false
    this.ref.detectChanges()
  }
  /**
  * Props dependent styles for the CometChatMessageComposer.
  *
  */
  styles: any = {
    composerStyle: () => {
      return {
        background: this.style.background,
      }
    },
    messageInputStyle: () => {
      return {
        font: this.style.inputTextFont,
        color: this.style.inputTextColor,
        background: this.style.inputBackground,
      }
    },
    inputStickyStyle: () => {
      return {
        background: this.style.inputBackground,
      }
    },
    attchButtonIconStyle: () => {
      let background = this.showActionSheetItem ? this.theme.palette.getAccent900("dark") : this.theme.palette.getAccent600("light");
      return {
        WebkitMask: `url(${this.showActionSheetItem ? this.closeIconURL : this.attachmentIconURL})`,
        background: background,
        width: "24px",
        height: "24px",
      }
    },
    stickerBtnIconStyle: () => {
      let background = this.showSticker ? this.theme.palette.getAccent900("dark") : this.theme.palette.getAccent600("light");
      return {
        background: background,
        WebkitMask: `url(${this.showSticker ? this.closeIconURL : this.stickerIconURL})`,
        width: "24px",
        height: "24px",
        display: "inline-block",
      }
    },
    emojiBtnIconStyle: () => {
      return {
        WebkitMask: `url(${this.showActionSheetEmoji ? this.closeIconURL : this.emojiIconURL})`,
        background: this.showActionSheetEmoji ? this.theme.palette.getAccent900("dark") : this.theme.palette.getAccent600("light"),
        width: "24px",
        height: "24px",
        display: "inline-block",
      }
    },
    reactionBtnIconStyle: () => {
      return {
        background: `url(${this.liveReactionIconURL})`,
        backgroundRepeat: "no-repeat",
        height: "24px",
        width: "24px"
      }
    },
    sendBtnIconStyle: () => {
      return {
        WebkitMask: `url(${this.sendButtonIconURL})`,
        background: this.enableSendButton ? this.theme.palette.getPrimary() : this.theme.palette.getAccent600("light"),
        width: "24px",
        height: "24px",
        display: "inline-block",
      }
    }
  }
}
