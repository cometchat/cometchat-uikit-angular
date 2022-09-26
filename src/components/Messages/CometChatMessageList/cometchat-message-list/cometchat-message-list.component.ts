import {
  Component,
  Input,
  OnInit,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ChangeDetectorRef,
  ElementRef,
  ViewChild,
  ChangeDetectionStrategy,
  NgZone,
} from "@angular/core";
import { CometChat } from "@cometchat-pro/chat";
import { messageConstants, dateFormat, MetadataKey, MessageReceiverType, MessageListAlignment, tooltipPosition, messageAlignment, timeFormat, MessageStatus, MessageOptionForConstants } from "../../../Shared/Constants/UIKitConstants";
import { checkHasOwnProperty, checkMessageForExtensionsData, getUnixTimestamp } from "../../../Shared/Helpers/CometChatHelper";
import { CometChatConversationEvents } from "../../../Chats/CometChatConversationEvents.service";
import { CometChatWrapperComponent } from "../../../Shared/PrimaryComponents/CometChatTheme/CometChatThemeWrapper/cometchat-theme-wrapper.component";
import { CometChatTheme } from "../../../Shared/PrimaryComponents/CometChatTheme/CometChatTheme";
import { getDefaultTypes } from "../../CometChatMessageTemplate/cometchat-message-template";
import { MessageTypes, MessageCategory, MessageOption } from "../../../Shared/Constants/UIKitConstants";
import { CometChatMessageEvents } from '../../CometChatMessageEvents.service'
import { CometChatSoundManager } from "../../../Shared/PrimaryComponents/CometChatSoundManager/cometchat-sound-manager/cometchat-sound-manager";
import { fontHelper } from "../../../Shared/PrimaryComponents/CometChatTheme/Typography";
import { MessageOptions } from "../../../Messages/CometChatMessageOptions/CometChatMessageOptions";
import { SmartReplyConfiguration, MessageBubbleConfiguration, DateConfiguration, NewMessageIndicatorConfiguration, MessageListConfiguration, MessageHeaderConfiguration, MessageComposerConfiguration, CometChatDate, EmojiKeyboardConfiguration, localize } from "../../../Shared";
import { messageBubbleData } from "../../Bubbles/CometChatMessageBubble/messageBubbleData";
import { messageIndicatorStyles } from "../../CometChatNewMessageIndicator/interface";
import { smartReplyStyles } from "../../CometChatSmartReply/interface";
import { popoverStyles } from "../../../Shared/UtilityComponents/CometChatPopover/interface";
import { customView } from "../../../Shared/Types/interface";
  /**
*
* CometChatMessageList is a wrapper component for messageBubble , date, smartReply component
*
* @version 1.0.0
* @author CometChatTeam
* @copyright © 2022 CometChat Inc.
*
*/
@Component({
  selector: "cometchat-message-list",
  templateUrl: "./cometchat-message-list.component.html",
  styleUrls: ["./cometchat-message-list.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CometChatMessageListComponent implements OnInit, OnDestroy, OnChanges {
  // taking reference of messageList scroll window
  @ViewChild("messageWindow", { static: false }) chatWindow!: ElementRef;
  /**
   * This properties will come from Parent.
   */
  @Input() user!: CometChat.User | null;
  @Input() group!: CometChat.Group | null;
  @Input() alignment: string = MessageListAlignment.left;
  @Input() messageTypes: any = [];
  @Input() excludeMessageTypes: {}[] = [];
  @Input() excludeMessageOptions: {}[] = [];
  @Input() customOptions: {}[] = [];
  @Input() limit: number = 30;
  @Input() onlyUnread: boolean = false;
  @Input() hideMessagesFromBlockedUsers: boolean = true;
  @Input() hideDeletedMessages: boolean = false;
  @Input() threadParentMessageId!: number | string;
  @Input() style:any={
    width: "100%",
    height: "100%",
    background: "white",
    border: "",
    borderRadius: "",
    loadingIconTint: "grey",
    emptyStateTextFont: "700 22px Inter",
    emptyStateTextColor: "grey",
    errorStateTextFont: "700 22px Inter",
    errorStateTextColor: "grey",
  };
  @Input() tags: string[] = [];
  @Input() hideThreadReplies: boolean = true;
  @Input() loggedInUser!: CometChat.User | null;
  @Input() categories: string[] | null = [];
  @Input() hideReadReceipt: boolean = false;
  @Input() loadingIconURL: string = "assets/resources/Spinner.svg";
  @Input() customView!: customView;
  @Input() type: string = '';
  @Input() parentMessageId: number = 0;
  @Input() messages: CometChat.BaseMessage[] = [];
  @Input() reachedTopOfConversation: boolean = false;
  @Input() enableSoundForMessages: boolean = true;
  @Input() customIncomingMessageSound: string | null = null;
  @Input() emptyText: string = localize("NO_MESSAGES_FOUND");
  @Input() errorText: string = "Unable to fetch messages";
  @Input() hideError: boolean = false;
  @Input() smartReplyConfiguration: SmartReplyConfiguration = new SmartReplyConfiguration({});
  @Input() newMessageIndicatorConfiguration: NewMessageIndicatorConfiguration = new NewMessageIndicatorConfiguration({});
  @Input() dateConfiguration: DateConfiguration = new DateConfiguration({})
  @Input() messageBubbleConfiguration: MessageBubbleConfiguration = new MessageBubbleConfiguration({});
  @Input() emojiKeyboardConfiguration: EmojiKeyboardConfiguration = new EmojiKeyboardConfiguration({});
  @Input() customMessageOptions: any = []
  @Input() showEmojiInLargerSize: boolean = false;
       /**
     * Properties for internal use
     */
  public showActionSheetEmoji = false;
  public smartReplyStyle: smartReplyStyles = {
    textFont: "",
    background: "",
    textColor: "",
    textBackground: "",
  };
  public newMessageStyle: messageIndicatorStyles = {
    textFont: "",
    background: "",
    textColor: "",
    textBackground: "",
  };
  public toolTipStyle: popoverStyles = {
    width: "272px",
    height: "330px",
    border: "none",
    background: "white",
    borderRadius: "8px",
    boxShadow: "0px 0px 32px rgba(20, 20, 20, 0.2)"
  };
  public isEmpty:boolean =false;
  public isError:boolean=false;
  public isLoading:boolean=false;
  /**
   * callback for editMessage option
   * @param  {CometChat.BaseMessage} object
   */
  onEditMessage = (object: CometChat.BaseMessage) => {
    this.messageEvents.publishEvents(this.messageEvents.onMessageEdit, {message:object,status:MessageStatus.inprogress});
  }
  /**
   * @param  {CometChat.BaseMessage} message
   */
  getCustomView = (message:CometChat.BaseMessage) => {
		let customView;
		if (this.messageTypes && this.messageTypes.length) {
			this.messageTypes.forEach((messageTemplateObject:any) => {
				if (
					messageTemplateObject.type === message.getType() &&
					messageTemplateObject.customView
				) {
					customView = messageTemplateObject.customView;
				}
			});
			return customView;
		}
    else {
      return null
    }
	};
  /**
   *  callback for reactMessage option
   * @param  {CometChat.BaseMessage} object
   * @param  {MouseEvent} event
   * @returns pointerY
   */
  onReactMessage = (object: CometChat.BaseMessage | null = null, event: MouseEvent | null = null, reaction: string | null = null) => {
    if (reaction) {
      // if reaction is available then call extension
      this.reactToMessages(reaction, object);
      this.ref.detectChanges();
    }
    else {
      // else open emoji keyboard 
      this.showActionSheetEmoji = !this.showActionSheetEmoji;
      this.event = event;
      object!.getSender().getUid() == this.loggedInUser?.getUid() ? this.position = tooltipPosition.left : this.position = tooltipPosition.right;
      this.messageToReact = object;
      this.ref.detectChanges();
    }
  }
  /**
   * @param  {string} reaction
   */
  onreactionSelected = (reaction: string) => {
    this.showActionSheetEmoji = false;
    this.reactToMessages(reaction, this.messageToReact)
  }
  // styling for loading icon
  loadingIconStyle() {
    return {
      WebkitMask: `url(${this.loadingIconURL}) center center no-repeat`,
      background: this.style.loadingIconTint,
    }
  }
  errorTextStyle = ()=>{
    return {
      font:this.style.errorStateTextFont,
      color:this.style.errorStateTextColor,
    }
  }
  emptyTextStyle = ()=>{
    return {
      font:this.style.emptyStateTextFont,
      color:this.style.emptyStateTextColor,
    }
  }
  wrapperStyle=()=>{
    return{
      height:this.style.height,
      width:this.style.width,
      background:this.style.background,
      border:this.style.border,
      borderRadius:this.style.borderRadius
    }
  }
  /**
   * callback for copy message
   * @param  {CometChat.TextMessage} object
   */
  onCopyMessage = (object: CometChat.TextMessage) => {
    navigator.clipboard.writeText(object.getText())
  }
  /**
   * callback for deleteMessage
   * @param  {CometChat.BaseMessage} object
   */
  onDeleteMessage = (object: CometChat.BaseMessage) => {
    this.deleteMessage(object)
  }
  updateTranslatedMessage = (translation: any) => {
    const receivedMessage = translation;
    const translatedText = receivedMessage.translations[0].message_translated;
    let messageList: CometChat.BaseMessage[] = [...this.messages];
    let messageKey = messageList.findIndex(
      (m) => m.getId() === receivedMessage.msgId
    );
    let data: any;
    if (messageKey > -1) {

      const messageObj: CometChat.BaseMessage = messageList[messageKey];
      if ((messageObj as CometChat.TextMessage).getMetadata()) {
        data = (messageObj as CometChat.TextMessage).getMetadata();
      }
      else {
        (messageObj as CometChat.TextMessage).setMetadata({})
        data = (messageObj as CometChat.TextMessage).getMetadata()
      }
      data["translated_message"] = translatedText;
      const newMessageObj: CometChat.TextMessage | CometChat.BaseMessage = messageObj;
      messageList.splice(messageKey, 1, newMessageObj);
      this.messages = [...messageList];
   
      this.ref.detectChanges();
    }
  }
  /**
   * @param  {CometChat.BaseMessage} messageObject
   */
  onTranslateMessage = (messageObject: CometChat.TextMessage) => {
    CometChat.callExtension(messageConstants.MESSAGE_TRANSLATION, 'POST', messageConstants.V2_TRANSLATE, {
      "msgId": messageObject.getId(),
      "text": messageObject.getText(),
      "languages": navigator.languages
    }).then(result => {

      this.updateTranslatedMessage(result);
      this.ref.detectChanges();
      // Result of translations
    })
      .catch((error:any) => {
      });
  }
  public UnreadCount: CometChat.BaseMessage[] = [];
  public defaultMessageTemplate!: {}[];
  public messagesRequest: any;
  public messageCount: number = 0;
  public theme: any = new CometChatTheme({});
  // message bubble object to send
  @Input() sentMessageInputData: any = {
    thumbnail: true,
    title: true,
    time: true,
    readReceipt: this.hideReadReceipt ? false : true,
  };
  @Input() receivedMessageInputData: any = {
    thumbnail: false,
    title: false,
    time: true,
    readReceipt: false,
  };
  public senderStyle: any = {
    background: "",
    color: ""
  }
  public receiverStyle = {
    background: "",
    color: ""
  }
  public event: any;
  public position: string = "left"
  public arrayOfTypes: any = [];
  // date format
  public timeFormat: string = dateFormat.dayDateFormat;
  public timeStampColor: string = "";
  public timeStampFont: string = "";
  public timeStampBackground: string = "";
  // properties for internal use
  publiclastItemObject = null;
  public decoratorMessage = messageConstants.LOADING;
  public times: number = 0;
  public lastScrollTop: number = 0;
  public isOnBottom: boolean = false;
  public msgListenerId = messageConstants.MESSAGE_ + new Date().getTime();
  public groupListenerId = messageConstants.GROUP_ + new Date().getTime();
  public callListenerId = messageConstants.CALL_ + new Date().getTime();
  public prevUser: any;
  public messageList: any = [];
  public scrolledToBottom: boolean = true;
  public messageToBeEdited: CometChat.BaseMessage | null = null;
  public replyPreview: CometChat.BaseMessage | null = null;
  public liveReaction = false;
  public newMessageCount: any = ""
  public reactionName: string = "assets/resources/heart-reaction.png";
  public messageToReact: CometChat.BaseMessage | null = null;
  public types: string[] | null = [
  ];
  dateFormat: DateConfiguration = {
    pattern: dateFormat.timeFormat,
    dateFormat: "mm:dd:yyyy",
    timeFormat: timeFormat.twelvehours
  }
  // smart reply properties
  onSmartReplyClick: any = null
  // new message indicator properties
  text: string = "";
  icon: string = "";
  onIndicatorClick: any = null
  // message bubble properties
  messageBubbleData!: messageBubbleData;
  reactToMessage: CometChat.BaseMessage | null = null;
  messageOptions!: MessageOptions[];
  timeAlignment: string = "";
  constructor(private ref: ChangeDetectorRef, private conversationEvents: CometChatConversationEvents, private messageEvents: CometChatMessageEvents, private zone: NgZone) {
    try {
    } catch (error:any) {
       this.messageEvents.publishEvents(this.messageEvents.onError, error);
    }
  }
  /**
 * 
 * CometChatMessageList component consists of CometChatDateComponent,CometChatMessageBubbleComponent, CometChatNewMessageIndicatorComponent,
 * CometChatActionSheetComponent and CometChatSmartReplyComponent.
 * This component fetches all the message of the user/group 
 * 
 * @version 1.0.0
 * @author CometChatTeam
 * @copyright © 2022 CometChat Inc.
 * 
 */
  /**
   * @param  {CometChat.BaseMessage} msg
   */
  updateLastMessage(msg: CometChat.BaseMessage) {
    this.conversationEvents.publishEvents(this.conversationEvents.updateLastMessage, msg)
  }
  // custom method for user
  ngOnInit() {
    try {
      this.setTheme();
      this.checkConfiguration();
      this.isOnBottom = true;
    } catch (error:any) {
       this.messageEvents.publishEvents(this.messageEvents.onError, error);
    }
  }
  ngOnChanges(change: SimpleChanges) {
    try {
      if (CometChatWrapperComponent.cometchattheme ) {
        this.theme = CometChatWrapperComponent.cometchattheme;
        this.setTheme();
      }
      if (change[MessageReceiverType.user] || change[MessageReceiverType.group]) {
        this.setMessageTypes()
        if (this.user) {
          if (Object.keys(this.user).length > 1) {
            this.user = this.user;
            this.type = CometChat.RECEIVER_TYPE.USER;
            this.createMessageRequestObjectAndGetMessages();
          }
          else {
            CometChat.getUser(this.user)
              .then((user: CometChat.User) => {
                this.user = user;
                this.type = CometChat.RECEIVER_TYPE.USER;
                this.createMessageRequestObjectAndGetMessages();
              })
          }
        }
        else if (this.group) {
          if (Object.keys(this.group).length > 1) {
            this.group = this.group
            this.type = CometChat.RECEIVER_TYPE.GROUP
            this.createMessageRequestObjectAndGetMessages()
          }
          else {
            CometChat.getGroup(this.group)
              .then((group: CometChat.Group) => {
                this.group = group;
                this.type = CometChat.RECEIVER_TYPE.GROUP;
                this.createMessageRequestObjectAndGetMessages();
              })
          }
        }
        //Removing Previous Conversation Listeners
        CometChat.removeMessageListener(this.msgListenerId);
        CometChat.removeGroupListener(this.groupListenerId);
        CometChat.removeCallListener(this.callListenerId);
        this.msgListenerId = messageConstants.MESSAGE_ + new Date().getTime();
        this.groupListenerId = messageConstants.GROUP_ + new Date().getTime();
        this.callListenerId = messageConstants.CALL_ + new Date().getTime();
        // Attach MessageListeners for the new conversation
        this.addMessageEventListeners();
      }
      // new thread opened
      if (change[messageConstants.PARENT_MESSAGE_ID]) {
        //Removing Previous thread Listeners
        CometChat.removeMessageListener(this.msgListenerId);
        this.msgListenerId = messageConstants.MESSAGE_ + new Date().getTime();
        // Attach MessageListeners for the new conversation
        this.addMessageEventListeners();
      }
      if (change[messageConstants.MESSAGED]) {
        if (change[messageConstants.MESSAGED].currentValue.length > 0) {
          this.decoratorMessage = "";
          this.isLoading = false
        }
      }
    } catch (error:any) {
       this.messageEvents.publishEvents(this.messageEvents.onError, error);
    }
  }
  ngOnDestroy() {
    try {
      //Removing Message Listeners
      CometChat.removeMessageListener(this.msgListenerId);
      CometChat.removeGroupListener(this.groupListenerId);
      CometChat.removeCallListener(this.callListenerId);
    } catch (error:any) {
       this.messageEvents.publishEvents(this.messageEvents.onError, error);
    }
  }
  checkConfiguration() {
    if (this.smartReplyConfiguration) {
      let defaultConfiguration: SmartReplyConfiguration = new SmartReplyConfiguration({})
      let configuration: SmartReplyConfiguration = this.smartReplyConfiguration
      this.setSmartReplyConfiguration(configuration, defaultConfiguration)
    }
    else {
      let defaultConfiguration: SmartReplyConfiguration = new SmartReplyConfiguration({})
      this.setSmartReplyConfiguration(defaultConfiguration)
    }
    if (this.newMessageIndicatorConfiguration) {
      let defaultConfiguration: NewMessageIndicatorConfiguration = new NewMessageIndicatorConfiguration({})
      let configuration: NewMessageIndicatorConfiguration = this.newMessageIndicatorConfiguration
      this.setNewMessageIndicatorConfiguration(configuration, defaultConfiguration)
    }
    else {
      let defaultConfiguration: NewMessageIndicatorConfiguration = new NewMessageIndicatorConfiguration({})
      this.setNewMessageIndicatorConfiguration(defaultConfiguration)
    }
    if (this.messageBubbleConfiguration) {
      let defaultConfiguration: MessageBubbleConfiguration = new MessageBubbleConfiguration({})
      let configuration: MessageBubbleConfiguration = this.messageBubbleConfiguration
      this.setMessageBubbleConfiguration(configuration, defaultConfiguration)
    }
    else {
      let defaultConfiguration: MessageBubbleConfiguration = new MessageBubbleConfiguration({})
      this.setMessageBubbleConfiguration(defaultConfiguration)
    }
    if ( this.dateConfiguration) {
      let defaultConfiguration: DateConfiguration = new DateConfiguration({})
      let configuration: DateConfiguration = this.dateConfiguration
      this.setDateConfiguration(configuration, defaultConfiguration)
    }
    else {
      let defaultConfiguration: DateConfiguration = new DateConfiguration({})
      this.setDateConfiguration(defaultConfiguration)
    }
  }
  setDateConfiguration(configuration: DateConfiguration, defaultConfiguration?: DateConfiguration) {
    this.dateFormat = configuration || defaultConfiguration
    // this.dateFormat = configuration.
  }
  setMessageBubbleConfiguration(configuration: MessageBubbleConfiguration, defaultConfiguration?: MessageBubbleConfiguration) {
    this.messageBubbleData = configuration.messageBubbleData || defaultConfiguration!.messageBubbleData
    this.messageOptions = configuration.messageOptions || defaultConfiguration!.messageOptions;
    // this.alignment = configuration.alignment || defaultConfiguration!.alignment;
    this.timeAlignment = configuration.timeAlignment || defaultConfiguration!.timeAlignment;
  }
  setNewMessageIndicatorConfiguration(configuration: NewMessageIndicatorConfiguration, defaultConfiguration?: NewMessageIndicatorConfiguration) {
    this.text = checkHasOwnProperty(configuration, "text") ? configuration.text : defaultConfiguration!.text;
    this.icon = checkHasOwnProperty(configuration, "icon") ? configuration.icon : defaultConfiguration!.icon;
    this.onIndicatorClick = configuration.onClick || this.scrollToBottom;
  }
  setSmartReplyConfiguration(configuration: SmartReplyConfiguration, defaultConfiguration?: SmartReplyConfiguration) {
    this.onSmartReplyClick = configuration.onClick || defaultConfiguration?.onClick
  }
  setTheme() {
    this.timeStampFont = fontHelper(this.theme.typography.subtitle2);
    this.timeStampColor = this.theme.palette.getAccent600("light")
    this.timeStampBackground = this.theme.palette.getSecondary();
    this.smartReplyStyle.textFont = fontHelper(this.theme.typography.subtitle1);
    this.smartReplyStyle.background = this.theme.palette.getBackground()
    this.smartReplyStyle.textColor = this.theme.palette.getAccent()
    this.smartReplyStyle.textBackground = this.theme.palette.getAccent900()
    this.smartReplyStyle.iconTint = this.theme.palette.getAccent600()
    this.newMessageStyle.textColor = this.theme.palette.getAccent900("light")
    this.newMessageStyle.background = this.theme.palette.getPrimary()
    this.newMessageStyle.textFont = fontHelper(this.theme.typography.title1);
    this.senderStyle.background = this.theme.palette.getPrimary()
    this.receiverStyle.background = this.theme.palette.getAccent200()
    this.ref.detectChanges()
  }
  /**
   * Creates a Message Request object ( holding the config , that is the two user involved in conversation ) and gets all the messages
   * @param
   */
  createMessageRequestObjectAndGetMessages() {
    try {
      if (this.parentMessageId) {
        this.messagesRequest = this.buildMessageRequestObject(
          this.user ? this.user : this.group,
          this.type,
          this.parentMessageId
        );
      } else {
        this.messagesRequest = this.buildMessageRequestObject(
          this.user ? this.user : this.group,
          this.type,
          this.parentMessageId
        );
      }
      this.getMessages(false, true);
    } catch (error:any) {
       this.messageEvents.publishEvents(this.messageEvents.onError, error);
    }
  }
  /**
 *  filter by message types
 * 
 */
  setMessageTypes() {
    if (!this.messageTypes) {
      this.types = null;
      this.categories = null;
    }
    else if (this.messageTypes && this.messageTypes.length > 0) {
      this.setOptionsCallback(this.messageTypes)
      if (this.excludeMessageOptions.length) {
        this.messageTypes.forEach((type: any) => {
          this.excludeMessageOptions.forEach((exopt: any) => {
            type.options.forEach((option: any) => {
              if (option.id == exopt) {
                const index = type.options.indexOf(option);
                if (index > -1) {
                  type.options.splice(index, 1); // 2nd parameter means remove one item only
                }
              }
            });
          });
        });
      }
      if (this.customOptions.length) {
        this.messageTypes.forEach((element: any) => {
          element.options.push(...this.customOptions)
        });
      }
      let categories = new Set()
      for (let element of this.messageTypes) {
        if ((element as any).type) {
          this.types!.push((element as any).type)
        }
        if (element == MessageTypes.image || MessageTypes.video || MessageTypes.audio || MessageTypes.text || MessageTypes.file) {
          categories.add(MessageCategory.message)
        }
        if (element == MessageTypes.poll || MessageTypes.sticker) {
          categories.add(MessageCategory.custom)
        }
        if (element == MessageTypes.edited || MessageTypes.delete) {
          categories.add(CometChat.CATEGORY_ACTION)
        }
      }
      this.categories = [...categories] as any
    }
    else {
      (this.defaultMessageTemplate as any) = getDefaultTypes();
      // defaultMessageTemplate
      this.setOptionsCallback(this.defaultMessageTemplate)
      if (this.excludeMessageOptions.length) {
        (this.defaultMessageTemplate as any).forEach((type: any) => {
          this.excludeMessageOptions.forEach((exopt: any) => {
            type.options.forEach((option: any) => {
              if (option.id == exopt) {
                const index = type.options.indexOf(option);
                if (index > -1) {
                  type.options.splice(index, 1); // 2nd parameter means remove one item only
                }
              }
            });
          });
        });
      }
      if (this.customOptions.length) {
        (this.defaultMessageTemplate as any).forEach((element: any) => {
          element.options.push(...this.customOptions)
        });
      }
      let categories = new Set()
      for (let element of (this.defaultMessageTemplate as any)) {
        if (element.type && element.type != MessageTypes.delete && element.type && element.type != MessageTypes.edited) {
          this.types!.push(element.type)
        }
        if (element == MessageTypes.image || MessageTypes.video || MessageTypes.audio || MessageTypes.text || MessageTypes.file) {
          categories.add(MessageCategory.message)
        }
        if (element == MessageTypes.poll || MessageTypes.sticker) {
          categories.add(MessageCategory.custom)
        }
        if (element == MessageTypes.edited || MessageTypes.delete) {
          categories.add(CometChat.CATEGORY_ACTION)
        }
      }
      this.categories = [...categories] as any
    }
    if (this.excludeMessageTypes.length) {
      let newArray = this.types!.filter((val: any) => !this.excludeMessageTypes.includes(val));
      this.types = newArray
    }
    this.ref.detectChanges();
  }
  /**
   * send message options based on type
   * @param  {CometChat.BaseMessage} msgObject
   */
  setMessageOptions(msgObject: CometChat.BaseMessage): any {
    let options;
    if (this.messageTypes && this.messageTypes.length > 0) {
      this.messageTypes.forEach((element: any) => {
        if (element.type == msgObject.getType()) {
         // Checking Message types for Template object and message object to set options
			if (element.type === msgObject.getType()) {
				options = element.options.filter(
					(option:any) =>
						// Segregating Sender and receiver options.
						( ( ! msgObject.getSender() ||  this.loggedInUser?.getUid() === msgObject.getSender().getUid())&&
							option.optionFor === MessageOptionForConstants.sender) ||
						option.optionFor === MessageOptionForConstants.both ||
						(this.loggedInUser?.getUid() !== msgObject.getSender().getUid() &&
							option.optionFor === MessageOptionForConstants.receiver) ||
						option.optionFor === MessageOptionForConstants.both
				);
			}
        }
      });
    }
    else {
      (this.defaultMessageTemplate as any)?.forEach((element: any) => {
        if (element.type == msgObject.getType()) {
          options = element.options.filter(
            (option:any) =>
              // Segregating Sender and receiver options.
              ( ( ! msgObject.getSender() ||  this.loggedInUser?.getUid() === msgObject.getSender().getUid())&&
                option.optionFor === MessageOptionForConstants.sender) ||
              option.optionFor === MessageOptionForConstants.both ||
              (this.loggedInUser?.getUid() !== msgObject.getSender().getUid() &&
                option.optionFor === MessageOptionForConstants.receiver) ||
              option.optionFor === MessageOptionForConstants.both
          );
        }
      });
    }
    return options
  }
  setOptionsCallback(template: any) {
    template.forEach((type: any) => {
      type.options.forEach((element: any) => {
        switch (element.id) {
          case MessageOption.deleteMessage:
            element.callBack = this.onDeleteMessage
            break;
          case MessageOption.editMessage:
            element.callBack = this.onEditMessage
            break;
          case MessageOption.translateMessage:
            element.callBack = this.onTranslateMessage
            break;
          case MessageOption.copyMessage:
            element.callBack = this.onCopyMessage
            break;
          case MessageOption.reactToMessage:
            element.callBack = this.onReactMessage
            break;
          case MessageOption.replyMessagePrivately:
            break;
          default:
            break;
        }
      });
    })
    this.ref.detectChanges()
  }
  getMessageAlignment = (msg: CometChat.BaseMessage): string => {
    let alignment: string = "";
    if (this.alignment == MessageListAlignment.standard) {
      if (!msg.getSender() || msg.getSender() && msg.getSender().getUid() == this.loggedInUser!.getUid()) {
        alignment = messageAlignment.right
      }
      else {
        alignment = messageAlignment.left
      }
    }
    else {
      alignment = messageAlignment.left
    }
    return alignment
  }
  /**
   * Listener To Receive Messages in Real Time
   * @param
   */
  addMessageEventListeners() {
    try {
      CometChat.addMessageListener(
        this.msgListenerId,
        new CometChat.MessageListener({
          onTextMessageReceived: (textMessage: CometChat.TextMessage) => {
            this.messageUpdate(messageConstants.TEXT_MESSAGE_RECEIVED, textMessage);
          },
          onMediaMessageReceived: (mediaMessage: CometChat.MediaMessage) => {
            this.messageUpdate(messageConstants.MEDIA_MESSAGE_RECEIVED, mediaMessage);
          },
          onCustomMessageReceived: (customMessage: CometChat.CustomMessage) => {
            if (customMessage.getType() == messageConstants.CALL_TYPE_DIRECT) {
            }
            this.messageUpdate(messageConstants.CUSTOM_MESSAGE_RECEIVED, customMessage);
          },
          onMessagesDelivered: (messageReceipt: CometChat.MessageReceipt) => {
            this.messageUpdate(messageConstants.MESSAGE_DELIVERED, messageReceipt);
          },
          onMessagesRead: (messageReceipt: CometChat.MessageReceipt) => {
            this.messageUpdate(messageConstants.MESSAGE_READ, messageReceipt);
          },
          onMessageDeleted: (deletedMessage: CometChat.BaseMessage) => {
            this.messageUpdate(messageConstants.MESSAGE_DELETED, deletedMessage);
          },
          onMessageEdited: (editedMessage: CometChat.BaseMessage) => {
            this.messageUpdate(messageConstants.MESSAGE_EDITED, editedMessage);
          },
          onTransientMessageReceived: (transientMessage: CometChat.TransientMessage) => {
            let liveReaction: any = transientMessage.getData();
            if (transientMessage.getReceiverType() == CometChat.RECEIVER_TYPE.USER && this.user && transientMessage.getSender().getUid() == this.user.getUid() && transientMessage.getReceiverId() == this.loggedInUser?.getUid()) {
              this.messageEvents.publishEvents(this.messageEvents.onLiveReaction, {
                reaction: liveReaction["LIVE_REACTION"]
              })
              return;
            }
            else if (transientMessage.getReceiverType() == CometChat.RECEIVER_TYPE.GROUP && this.group && transientMessage.getReceiverId() == this.group.getGuid() && transientMessage.getSender().getUid() != this.loggedInUser?.getUid()) {
              this.messageEvents.publishEvents(this.messageEvents.onLiveReaction, {
                reaction: liveReaction["LIVE_REACTION"]
              })
              return;
            }
          },
        })
      );
      CometChat.addGroupListener(
        this.groupListenerId,
        new CometChat.GroupListener({
          onGroupMemberScopeChanged: (
            message: null | undefined,
            changedUser: any,
            newScope: any,
            oldScope: any,
            changedGroup: null | undefined
          ) => {
            this.messageUpdate(
              messageConstants.GROUP_MEMBER_SCOPE_CHANGED,
              message,
              changedGroup,
              { user: changedUser, scope: newScope }
            );
          },
          onGroupMemberKicked: (message: null | undefined, kickedUser: any, kickedBy: any, kickedFrom: null | undefined) => {
            this.messageUpdate(
              messageConstants.GROUP_MEMBER_KICKED,
              message,
              kickedFrom,
              {
                user: kickedUser,
                hasJoined: false,
              }
            );
          },
          onGroupMemberBanned: (message: null | undefined, bannedUser: any, bannedBy: any, bannedFrom: null | undefined) => {
            this.messageUpdate(
              messageConstants.GROUP_MEMBER_BANNED,
              message,
              bannedFrom,
              {
                user: bannedUser,
              }
            );
          },
          onGroupMemberUnbanned: (
            message: null | undefined,
            unbannedUser: any,
            unbannedBy: any,
            unbannedFrom: null | undefined
          ) => {
            this.messageUpdate(
              messageConstants.GROUP_MEMBER_UNBANNED,
              message,
              unbannedFrom,
              { user: unbannedUser }
            );
          },
          onMemberAddedToGroup: (
            message: null | undefined,
            userAdded: any,
            userAddedBy: any,
            userAddedIn: null | undefined
          ) => {
            this.messageUpdate(
              messageConstants.GROUP_MEMBER_ADDED,
              message,
              userAddedIn,
              {
                user: userAdded,
                hasJoined: true,
              }
            );
          },
          onGroupMemberLeft: (message: CometChat.BaseMessage, leavingUser: CometChat.GroupMember, group: CometChat.Group) => {
            this.messageUpdate(messageConstants.GROUP_MEMBER_LEFT, message, group, {
              user: leavingUser,
            });
          },
          onGroupMemberJoined: (message: CometChat.BaseMessage, joinedUser: CometChat.GroupMember, joinedGroup: CometChat.Group) => {
            this.messageUpdate(
              messageConstants.GROUP_MEMBER_JOINED,
              message,
              joinedGroup,
              {
                user: joinedUser,
              }
            );
          },
        })
      );
      CometChat.addCallListener(
        this.callListenerId,
        new CometChat.CallListener({
          onIncomingCallReceived: (call: CometChat.Call) => {
            this.messageUpdate(messageConstants.INCOMING_CALL_RECEIVED, call);
          },
          onIncomingCallCancelled: (call: CometChat.Call) => {
            this.messageUpdate(messageConstants.INCOMING_CALL_CANCELLED, call);
          },
          onOutgoingCallAccepted: (call: CometChat.Call) => {
            this.messageUpdate(messageConstants.OUTGOING_CALL_ACCEPTED, call);
          },
          onOutgoingCallRejected: (call: CometChat.Call) => {
            this.messageUpdate(messageConstants.OUTGOING_CALL_REJECTED, call);
          },
        })
      );
    } catch (error:any) {
       this.messageEvents.publishEvents(this.messageEvents.onError, error);
    }
  }
  /**
   *
   * @param
   */
  /**
   *  This Build Message Request Configuration Object , that helps in getting messages of a particular conversation
   * @param  {any=null} item
   * @param  {string=''} type
   * @param  {number} parentMessageId
   */
  buildMessageRequestObject(item: any = null, type: string = '', parentMessageId: number) {
    let messageRequestBuilt;
    if (type === CometChat.RECEIVER_TYPE.USER) {
      if (parentMessageId) {
        messageRequestBuilt = new CometChat.MessagesRequestBuilder()
          .setUID(item.uid)
          .setParentMessageId(parentMessageId)
          .setCategories(this.categories!)
          .setTypes(this.types!)
          .setLimit(this.limit)
          .setTags(this.tags)
          .withTags(this.tags ? true : false)
          .build();
      } else {
        messageRequestBuilt = new CometChat.MessagesRequestBuilder()
          .setUID(item.uid)
          .setCategories(this.categories!)
          .setTypes(this.types!)
          .hideReplies(this.hideThreadReplies)
          .setLimit(this.limit)
          .setUnread(this.onlyUnread)
          .withTags(this.tags ? true : false)
          .setTags(this.tags)
          .hideMessagesFromBlockedUsers(this.hideMessagesFromBlockedUsers)
          .hideDeletedMessages(this.hideDeletedMessages)
          .build();
      }
    } else if (type === CometChat.RECEIVER_TYPE.GROUP) {
      if (parentMessageId) {
        messageRequestBuilt = new CometChat.MessagesRequestBuilder()
          .setGUID(item.guid)
          .setParentMessageId(parentMessageId)
          .setCategories(this.categories!)
          .setTags(this.tags)
          .withTags(this.tags ? true : false)
          .setTypes(this.types!)
          .setLimit(this.limit)
          .build();
      } else {
        messageRequestBuilt = new CometChat.MessagesRequestBuilder()
          .setGUID(item.guid)
          .setCategories(this.categories!)
          .setTypes(this.types!)
          .hideReplies(this.hideThreadReplies)
          .setTags(this.tags)
          .withTags(this.tags ? true : false)
          .setUnread(this.onlyUnread)
          .hideMessagesFromBlockedUsers(this.hideMessagesFromBlockedUsers)
          .hideDeletedMessages(this.hideDeletedMessages)
          .setLimit(this.limit)
          .build();
      }
    }
    return messageRequestBuilt;
  }
  /**
   * Gets Messages For a particular conversation bases on MessageRequestConfig
   * @param
   */
  /**
   * @param  {boolean=false} scrollToBottom
   * @param  {boolean=false} newConversation
   * @param  {boolean=false} scrollToTop
   */
  getMessages(scrollToBottom: boolean = false, newConversation: boolean = false, scrollToTop: boolean = false) {
    try {
      this.decoratorMessage = messageConstants.LOADING;
      this.isLoading = true;
      this.isEmpty = false;
      this.isError = false;
      this.ref.detectChanges()
      const actionMessages = [];
      CometChat.getLoggedinUser().then(
        (user: CometChat.User | null) => {
          this.loggedInUser = user;
          this.messagesRequest.fetchPrevious().then(
            (messageList: CometChat.BaseMessage[]) => {
              // No Messages Found
              if (messageList.length === 0 && this.messages.length === 0) {
                this.isLoading = false;
                this.isEmpty = true;
                this.isError=false;
                this.decoratorMessage = this.emptyText;
                this.ref.detectChanges()
              } else {
                this.isLoading = false
                this.isEmpty = false;
                this.isError=false;
                this.decoratorMessage = "";
                this.ref.detectChanges()
              }
              if (messageList && messageList.length) {
                let lastMessage = messageList[messageList.length - 1]
                if (!lastMessage.getReadAt()) {
                  lastMessage.setEditedAt(getUnixTimestamp())
                  CometChat.markAsRead(lastMessage);
                }
              }
              messageList.forEach((message: CometChat.BaseMessage) => {
                if (
                  message.getCategory() === CometChat.CATEGORY_ACTION &&
                  message.getSender().getUid() === messageConstants.APP_SYSTEM
                ) {
                  actionMessages.push(message);
                }
                //if the sender of the message is not the loggedin user, mark it as read.
                if (message.getSender().getUid() != this.loggedInUser?.getUid()) {
                  //mark the message as delivered
                  this.markMessageAsDelivered(message);
                  if (
                    message.getSender().getUid() !== user!.getUid() &&
                    !message.getReadAt()
                  ) {
                    if (
                      message.getReceiverType() === CometChat.RECEIVER_TYPE.USER
                    ) {
                    } else if (
                      message.getReceiverType() === CometChat.RECEIVER_TYPE.GROUP
                    ) {
                    }
                  }
                }
              });
              ++this.times;
              let actionGeneratedType = messageConstants.MESSAGE_FETCHED;
              if (scrollToBottom === true) {
                actionGeneratedType = messageConstants.MESSAGE_FETCHED_AGAIN;
              }
              let prevScrollHeight = this.chatWindow.nativeElement.scrollHeight;
              if (scrollToTop) {
                this.reachedTopOfConversation = false
                // actionGeneratedType = messageConstants.OLDER_MESSAGES_FETCHED;
                //No Need for below actions if there is nothing to prepend
                if (messageList.length != 0) {
                  this.prependMessages(messageList);
                  setTimeout(() => {
                    this.chatWindow.nativeElement.scrollTop =
                      this.chatWindow.nativeElement.scrollHeight - prevScrollHeight;
                  });
                };
              }
              // Only called when the active user changes the the conversation , that is switches to some other person
              // to chat with
              if (newConversation) {
                this.messageCount = 0; //modularity
                this.setMessages(messageList)
                this.messageEvents.publishEvents(this.messageEvents.onMessageRead, messageList[messageList.length - 1])
              }
              if (
                (this.times === 1 && actionMessages.length > 5) ||
                (this.times > 1 && actionMessages.length === 30)
              ) {
                this.prependMessages(messageList)
                this.getMessages(true, false);
              } else {
              }
              this.messageCount = this.messages.length;
              this.ref.detectChanges();
            },
            (error: any) => {
              this.decoratorMessage = this.errorText
              this.isLoading = false;
              this.isEmpty = false;
              this.isError=true;
              this.messageEvents.publishEvents(this.messageEvents.onError, error);
              this.ref.detectChanges()
            }
          );
        },
        (error:any) => {
          this.isLoading = false;
          this.isEmpty = false;
          this.isError=true;
          this.ref.detectChanges()
          this.messageEvents.publishEvents(this.messageEvents.onError, error);
        }
      );
    } catch (error:any) {
       this.messageEvents.publishEvents(this.messageEvents.onError, error);
    }
    this.ref.detectChanges();
  }
  /**
   * 
   * @param
   */
  /**
   * Updates messageList on basis of user activity or group activity or calling activity
   * @param  {any=null} key
   * @param  {CometChat.MessageReceipt | CometChat.BaseMessage} message
   * @param  {CometChat.Group | null=null} group
   * @param  {any=null} options
   */
  messageUpdate(key: any = null, message: CometChat.MessageReceipt | CometChat.BaseMessage | any = null, group: CometChat.Group | null = null, options: any = null) {
    try {
      switch (key) {
        case messageConstants.TEXT_MESSAGE_RECEIVED:
        case messageConstants.MEDIA_MESSAGE_RECEIVED:
     
          this.messageReceived(message);
          break;
        case messageConstants.MESSAGE_DELIVERED:
        case messageConstants.MESSAGE_READ:
          this.messageReadAndDelivered(message);
          break;
        case messageConstants.MESSAGE_DELETED:
        case messageConstants.MESSAGE_EDITED: {
          this.messageEdited(message);
          break;
        }
        case messageConstants.GROUP_MEMBER_SCOPE_CHANGED:
        case messageConstants.GROUP_MEMBER_JOINED:
        case messageConstants.GROUP_MEMBER_LEFT:
        case messageConstants.GROUP_MEMBER_ADDED:
        case messageConstants.GROUP_MEMBER_KICKED:
        case messageConstants.GROUP_MEMBER_BANNED:
        case messageConstants.GROUP_MEMBER_UNBANNED: {
          break;
        }
        case messageConstants.CUSTOM_MESSAGE_RECEIVED:
          this.customMessageReceived(message);
          break;
        case messageConstants.INCOMING_CALL_RECEIVED:
        case messageConstants.INCOMING_CALL_CANCELLED:
        case messageConstants.OUTGOING_CALL_ACCEPTED:
        case messageConstants.OUTGOING_CALL_REJECTED:
          break;
      }
      this.ref.detectChanges()
    } catch (error:any) {
       this.messageEvents.publishEvents(this.messageEvents.onError, error);
    }
  }
  /**
   * @param  {CometChat.BaseMessage} message
   * @param  {boolean=false} muid
   */
  updateMessage(message: CometChat.BaseMessage, muid: boolean = false) {
    if (muid) {
      this.messageSent(message)
    }
    else {
      this.updateEditedMessage(message)
    }
  }
  /**
   * translate message then call update message 
   * @param  {CometChat.BaseMessage} message
   */
  // translateMessage(message: CometChat.BaseMessage) {
  // }
  /**
   * @param  {CometChat.BaseMessage} message
   */
  markMessageAsDelivered = (message: CometChat.BaseMessage) => {
    if (message.getSender().getUid() !== this.loggedInUser?.getUid() && message.hasOwnProperty("deliveredAt") === false) {
      CometChat.markAsDelivered(message);
    }
  };
  /**
   * When Message is Received
   * @param message
   */
  /**
   * @param  {CometChat.BaseMessage} message
   */
  messageReceived(message: CometChat.BaseMessage) {
    try {
      if (this.isOnBottom) {
        this.scrollToBottom();
      }
      else {
        this.UnreadCount.push(message)
        this.newMessageCount = this.UnreadCount.length > 1 ? " ↓ " + this.UnreadCount.length + " new Messages" : " ↓ " + this.UnreadCount.length + " new Message"
        this.ref.detectChanges();
      }
      this.markMessageAsDelivered(message);
      if (
        this.type === CometChat.RECEIVER_TYPE.GROUP &&
        message.getReceiverType() === CometChat.RECEIVER_TYPE.GROUP &&
        message.getReceiverId() === this.group?.getGuid()
      ) {
        this.messageReceivedHandler(message, CometChat.RECEIVER_TYPE.GROUP);
      } else if (
        this.type === CometChat.RECEIVER_TYPE.USER &&
        message.getReceiverType() === CometChat.RECEIVER_TYPE.USER &&
        message.getSender().getUid() === this.user?.getUid()
      ) {
        if ((!message.getReadAt() && !message.getParentMessageId() && this.isOnBottom) || (!message.getReadAt() && message.getParentMessageId() && this.parentMessageId && this.isOnBottom)) {
          CometChat.markAsRead(message).then(() => {
            setTimeout(() => {
              this.messageEvents.publishEvents(this.messageEvents.onMessageRead, message)
            }, 1000);
          });
          message.setEditedAt(getUnixTimestamp())
          this.messageEvents.publishEvents(this.messageEvents.onMessageRead, message)
        }
        this.messageReceivedHandler(message, CometChat.RECEIVER_TYPE.USER);
      }
    } catch (error:any) {
       this.messageEvents.publishEvents(this.messageEvents.onError, error);
    }
    this.ref.detectChanges();
  }
  /**
 * Updating the reply count of Thread Parent Message
 * @param  {CometChat.BaseMessage} messages
 */
  updateReplyCount(messages: CometChat.BaseMessage) {
    try {
      const receivedMessage = messages;
      let messageList: CometChat.BaseMessage[] = [...this.messages];
      let messageKey = messageList.findIndex(
        (m) => m.getId() === receivedMessage.getParentMessageId()
      );
      if (messageKey > -1) {
        const messageObj: CometChat.BaseMessage = messageList[messageKey];
        let replyCount = messageObj.getReplyCount() ? messageObj.getReplyCount() : 0;
        replyCount = replyCount + 1;
        messageObj.setReplyCount(replyCount);
        messageList.splice(messageKey, 1, messageObj);
        this.messages = [...messageList];
        this.ref.detectChanges();
      }
    } catch (error:any) {
       this.messageEvents.publishEvents(this.messageEvents.onError, error);
    }
  }
  /**
   * @param  {CometChat.BaseMessage} message
   * @param  {string} type
   */
  messageReceivedHandler = (message: CometChat.BaseMessage, type: string) => {
    // add received message to messages list
    if (message.getParentMessageId()) {
      this.updateReplyCount(message);
    } else {
      this.smartReplyPreview(message);
      if (this.messageCount > messageConstants.MAX_MESSAGE_COUNT) {
        this.reInitializeMessageBuilder();
      }
      this.addMessage(message);
    }
    this.playAudio();
    //handling dom lag - increment count only for main message list
    if (message.hasOwnProperty("parentMessageId") === false && this.parentMessageId) {
      ++this.messageCount;
      this.ref.detectChanges()
      //if the user has not scrolled in chat window(scroll is at the bottom of the chat window)
      if (!this.reachedTopOfConversation) {
        if (this.messageCount > messageConstants.MAX_MESSAGE_COUNT) {
          this.reInitializeMessageBuilder();
        } else {
        }
      } else {
      }
    } else if (message.hasOwnProperty("parentMessageId") === true && this.parentMessageId && this.isOnBottom) {
      if (message.getParentMessageId() === this.parentMessageId && !this.isOnBottom) {
        CometChat.markAsRead(message).then(() => {
          message.setEditedAt(getUnixTimestamp())
          setTimeout(() => {
            this.messageEvents.publishEvents(this.messageEvents.onMessageRead, message)
          }, 1000);
        });
        this.ref.detectChanges()
      }
    } else {
    }
  };
  reInitializeMessageList() {
    this.messages = [];
    CometChat.removeMessageListener(this.msgListenerId);
    CometChat.removeGroupListener(this.groupListenerId);
    CometChat.removeCallListener(this.callListenerId);
    this.msgListenerId = messageConstants.MESSAGE_ + new Date().getTime();
    this.groupListenerId = messageConstants.GROUP_ + new Date().getTime();
    this.callListenerId = messageConstants.CALL_ + new Date().getTime();
    this.createMessageRequestObjectAndGetMessages();
    // Attach MessageListeners for the new conversation
    this.addMessageEventListeners();
    this.ref.detectChanges();
  }
  reInitializeMessageBuilder = () => {
    if (!this.parentMessageId) {
      this.messageCount = 0;
    }
    this.decoratorMessage = messageConstants.LOADING;
    CometChat.removeMessageListener(this.msgListenerId);
    CometChat.removeGroupListener(this.groupListenerId);
    CometChat.removeCallListener(this.callListenerId)
    this.reInitializeMessageList()
  };
  /**
   * Sets Status of messages i.e sent/delivered/read
   * @param message
   */
  /**
   * @param  {CometChat.MessageReceipt} message
   */
  getUinx = () => {
    return String(Math.round(+new Date() / 1000))
  }
  messageReadAndDelivered(message: CometChat.MessageReceipt) {
    try {
      if (
        message.getReceiverType() == CometChat.RECEIVER_TYPE.USER &&
        message.getSender().getUid() == this.user?.getUid() &&
        message.getReceiver() == this.loggedInUser?.getUid()
      ) {
        if (message.getReceiptType() == messageConstants.DELIVERY) {
          //search for message
          let messageKey = this.messages.findIndex(
            (m: CometChat.BaseMessage) => m.getId() == (message as any).getMessageId()
          );
          if (messageKey > -1) {
            console.log(this.messages[messageKey].getId())
            this.messages[messageKey].setDeliveredAt(message.getDeliveredAt())
            this.messages[messageKey].setEditedAt(getUnixTimestamp() + messageKey)
            this.ref.detectChanges();
            this.updateLastMessage(this.messages[messageKey]);
          }
          // this.ref.detectChanges();
          this.markAllMessagAsDelivered(message,messageKey);
        } else if (message.getReceiptType() == messageConstants.READ) {
          //search for message
          let messageKey = this.messages.findIndex(
            (m: CometChat.BaseMessage) => m.getId() == (message as any).getMessageId()
          );
          if (messageKey > -1) {
            this.messages[messageKey].setReadAt(message.getReadAt());
            this.messages[messageKey].setEditedAt(getUnixTimestamp() + 123)
            this.ref.detectChanges();
            this.updateLastMessage(this.messages[messageKey]);
          }
            this.ref.detectChanges();
              this.markAllMessagAsRead(message, messageKey)
        }
      } else if (
        message.getReceiverType() === CometChat.RECEIVER_TYPE.GROUP &&
        message.getReceiver() === this.group?.getGuid()
      ) {
        return
      }
    } catch (error:any) {
       this.messageEvents.publishEvents(this.messageEvents.onError, error);
    }
    this.ref.detectChanges()
  }
  /**
   * Emits an Action Indicating that a message was deleted by the user/person you are chatting with
   * @param {CometChat.BaseMessage} message
   */
  /**
   * Detects if the message that was edit is your current open conversation window
   * @param {CometChat.BaseMessage} message
   */
  messageEdited = (message: CometChat.BaseMessage) => {
    try {
      if (
        this.type === CometChat.RECEIVER_TYPE.GROUP &&
        message.getReceiverType() === CometChat.RECEIVER_TYPE.GROUP &&
        message.getReceiverId() === this.group?.getGuid()
      ) {
        this.updateEditedMessage(message);
      } else if (
        this.type === CometChat.RECEIVER_TYPE.USER &&
        message.getReceiverType() === CometChat.RECEIVER_TYPE.USER &&
        this.loggedInUser?.getUid() === message.getReceiverId() &&
        message.getSender().getUid() === this.user?.getUid()
      ) {
        this.updateEditedMessage(message);
      } else if (
        this.type === CometChat.RECEIVER_TYPE.USER &&
        message.getReceiverType() === CometChat.RECEIVER_TYPE.USER &&
        this.loggedInUser?.getUid() === message.getSender().getUid() &&
        message.getReceiverId() === this.user?.getUid()
      ) {
        this.updateEditedMessage(message);
      }
    } catch (error:any) {
       this.messageEvents.publishEvents(this.messageEvents.onError, error);
    }
    // this.ref.detectChanges()
  };
  /**
   * Emits an Action Indicating that a message was deleted by the user/person you are chatting with
   * @param {CometChat.BaseMessage} message
   */
  updateEditedMessage = (message: CometChat.BaseMessage) => {
    try {
      //If the updated message is the current message that is opened in thread view then update thread view also
      if (message?.getId() == this.parentMessageId) {
        return;
      }
      const messageList:CometChat.BaseMessage[] = [...this.messages];
      let messageKey = messageList.findIndex((m: CometChat.BaseMessage, k) => m.getId() === message.getId());
      if (messageKey > -1) {
        messageList.splice(messageKey, 1, message);
        this.messages = [...messageList];
        this.ref.detectChanges();
      }
    } catch (error:any) {
       this.messageEvents.publishEvents(this.messageEvents.onError, error);
    }
    this.ref.detectChanges()
  };
  /**
   * Emits an Action Indicating that Group Data has been updated
   * @param
   */
  /**
   * When custom messages are received eg. Poll, Stickers emits action to update message list
   * @param message
   */
  /**
   * @param  {CometChat.BaseMessage} message
   */
  customMessageReceived(message: CometChat.BaseMessage): boolean {
    try {
      if (!this.isOnBottom) {
        this.UnreadCount.push(message)
        this.newMessageCount = this.UnreadCount.length > 1 ? " ↓ " + this.UnreadCount.length + " new Messages" : " ↓ " + this.UnreadCount.length + " new Message"
        this.ref.detectChanges()
      }
      else {
        setTimeout(() => {
          this.scrollToBottom()
        }, 500);
      }
      this.markMessageAsDelivered(message);
      if (
        this.type === CometChat.RECEIVER_TYPE.GROUP &&
        message.getReceiverType() === CometChat.RECEIVER_TYPE.GROUP &&
        message.getReceiverId() === this.group?.getGuid()
      ) {
        if ((!message.getReadAt() && !message.getParentMessageId() && this.isOnBottom) || (!message.getReadAt() && message.getParentMessageId() && this.parentMessageId && this.isOnBottom)) {
          CometChat.markAsRead(message).then(() => {
            message.setEditedAt(getUnixTimestamp())
            setTimeout(() => {
              this.messageEvents.publishEvents(this.messageEvents.onMessageRead, message)
            }, 1000);
          });
        }
        if (message.getType() === messageConstants.CALL_TYPE_DIRECT) {
        }
        if (
          message.hasOwnProperty(MetadataKey.metadata) &&
          message.getType() !== MessageTypes.sticker &&
          message.getType() !== MessageTypes.poll
        ) {
        }
        this.customMessageReceivedHandler(message, CometChat.RECEIVER_TYPE.GROUP)
      }
      else if (
        this.type === CometChat.RECEIVER_TYPE.USER &&
        message.getReceiverType() === CometChat.RECEIVER_TYPE.USER &&
        ((message.getSender().getUid() === this.user?.getUid() &&
          message.getReceiverId() === this.loggedInUser?.getUid())
          || (
            this.loggedInUser?.getUid() === message.getSender().getUid() &&
            message.getReceiverId() === this.user?.getUid()
          ))
      ) {
        if ((!message.getReadAt() && !message.getParentMessageId() && this.isOnBottom) || (!message.getReadAt() && message.getParentMessageId() && this.parentMessageId && this.isOnBottom)) {
          CometChat.markAsRead(message).then(() => {
            message.setEditedAt(getUnixTimestamp())
            setTimeout(() => {
              this.messageEvents.publishEvents(this.messageEvents.onMessageRead, message)
            }, 1000);
          });
        }
        if (
          message.hasOwnProperty(MetadataKey.metadata) &&
          message.getType() !== MessageTypes.sticker &&
          message.getType() !== MessageTypes.poll
        ) {
        }
        this.customMessageReceivedHandler(message, CometChat.RECEIVER_TYPE.USER)
      }
    } catch (error:any) {
       this.messageEvents.publishEvents(this.messageEvents.onError, error);
    }
    this.ref.detectChanges();
    return true;
  }
  /**
   * @param  {CometChat.BaseMessage} message
   * @param  {string} type
   */
  customMessageReceivedHandler = (message: CometChat.BaseMessage, type: string) => {
    // add received message to messages list
    if (message.getParentMessageId()) {
      this.updateReplyCount(message);
    } else {
      this.smartReplyPreview(message);
      setTimeout(() => {
        this.scrollToBottom();
      }, 2000);
      if (this.messageCount > messageConstants.MAX_MESSAGE_COUNT) {
        this.reInitializeMessageBuilder();
      }
      this.addMessage(message);
    }
    this.playAudio();
    //handling dom lag - increment count only for main message list
    if (message.hasOwnProperty("parentMessageId") === false && !this.parentMessageId) {
      ++this.messageCount;
      //if the user has not scrolled in chat window(scroll is at the bottom of the chat window)
      if (this.chatWindow.nativeElement.scrollHeight - this.chatWindow.nativeElement.scrollTop - this.chatWindow.nativeElement.clientHeight <= 1) {
        if (this.messageCount > messageConstants.MAX_MESSAGE_COUNT) {
          this.reInitializeMessageBuilder();
        } else {
          CometChat.markAsRead(message).then(() => {
            message.setEditedAt(getUnixTimestamp())
            setTimeout(() => {
              this.messageEvents.publishEvents(this.messageEvents.onMessageRead, message)
            }, 1000);
          });
        }
      } else {
        //if the user has scrolled in chat window
      }
    } else if (message.hasOwnProperty("parentMessageId") === true && this.parentMessageId) {
      if (message.getParentMessageId() === this.parentMessageId && this.isOnBottom) {
        CometChat.markAsRead(message).then(() => {
          message.setEditedAt(getUnixTimestamp())
          setTimeout(() => {
            this.messageEvents.publishEvents(this.messageEvents.onMessageRead, message)
          }, 1000);
        });
      }
    } else {
    }
    this.ref.detectChanges();
  };
  /** 
   * TrackBy method to update UI when a change is detected
   */
  /**
   * @param  {any} index
   * @param  {any} item
   */
  messageID(index: any, item: any) {
     return  item.editedAt || item.readAt || item.deliveredAt || item.id;
  }
  /**
   * Compares two dates and sets Date on a a new day
   */
  /**
   * @param  {number} firstDate
   * @param  {number} secondDate
   */
  isDateDifferent(firstDate: number | undefined, secondDate: number | undefined) {
    let firstDateObj: Date, secondDateObj: Date;
    firstDateObj = new Date(firstDate! * 1000);
    secondDateObj = new Date(secondDate! * 1000);
    if (
      firstDateObj.getDate() === secondDateObj.getDate() &&
      firstDateObj.getMonth() === secondDateObj.getMonth() &&
      firstDateObj.getFullYear() === secondDateObj.getFullYear()
    ) {
      return false;
    }
    return true;
  }
  /**
 * Sets the message to which reaction has to be set
 * @param
 */
  /**
   * @param  {CometChat.BaseMessage} message
   */
  reactToMessages = (emoji: string, messageObject: CometChat.BaseMessage | null) => {
    let removeEmoji:boolean = false
    let reactionObject:any = {};
    let newMessageObject!:CometChat.TextMessage | null;
    let msgObject:any = messageObject;
    const userObject:any = {};
    if(this.loggedInUser?.getAvatar()){
      userObject["avatar"] = this.loggedInUser?.getAvatar();
    }
    if(this.loggedInUser?.getName()){
      userObject["name"] = this.loggedInUser?.getName();
    }
    let uid:any = this.loggedInUser?.getUid();
    const emojiObject = {
      [emoji]: {
        [uid]: userObject,
      },
    };
    const reactionExtensionsData = checkMessageForExtensionsData(
      (messageObject as CometChat.BaseMessage),
       "reactions"
      );
    if (reactionExtensionsData) {
      if (reactionExtensionsData[emoji]) {
        //if the reactions metadata has the selected emoji/reaction for the loggedin user
        if (reactionExtensionsData[emoji][uid]) {
          delete reactionExtensionsData[emoji];
          removeEmoji = true;
        } else {
          let data:any = msgObject["metadata"]["@injected"]["extensions"][
            "reactions"
          ];
          data[emoji][uid] = userObject
         reactionObject = {
          ...data,
        };
        }
      } else {
        if (!msgObject.hasOwnProperty("metadata")) {
          msgObject["metadata"] = {};
        }
        if (!msgObject["metadata"].hasOwnProperty("@injected")) {
          msgObject["metadata"]["@injected"] = {};
        }
        if (
          !msgObject["metadata"]["@injected"].hasOwnProperty("extensions")
        ) {
          msgObject["metadata"]["@injected"]["extensions"] = {};
        }
        if (
          !msgObject["metadata"]["@injected"]["extensions"].hasOwnProperty(
            "reactions"
          )
        ) {
          msgObject["metadata"]["@injected"]["extensions"]["reactions"] = {};
        }
        let data:any = msgObject["metadata"]["@injected"]["extensions"]["reactions"];
        reactionObject = { ...data, ...emojiObject };
      }
    } else {
      if (!msgObject.hasOwnProperty("metadata")) {
        msgObject["metadata"] = {};
      }
      if (!msgObject["metadata"].hasOwnProperty("@injected")) {
        msgObject["metadata"]["@injected"] = {};
      }
      if (
        !msgObject["metadata"]["@injected"].hasOwnProperty("extensions")
      ) {
        msgObject["metadata"]["@injected"]["extensions"] = {};
      }
      if (
        !msgObject["metadata"]["@injected"]["extensions"].hasOwnProperty(
          "reactions"
        )
      ) {
        msgObject["metadata"]["@injected"]["extensions"]["reactions"] = {};
      }
      reactionObject = {
        ...emojiObject,
      };
    }
    var metadataObject:any;
   if(removeEmoji){
     metadataObject = {
      ...msgObject["metadata"],
  };
   }
   else{
     metadataObject = {
      ...msgObject["metadata"],
      "@injected": {
        ...msgObject["metadata"]["@injected"],
        extensions: {
          ...msgObject["metadata"]["@injected"]["extensions"],
          reactions: {
            ...reactionObject,
          },
        },
      },
  };
   }
    newMessageObject = messageObject as CometChat.TextMessage;
    newMessageObject.setMetadata(metadataObject)
    newMessageObject.setEditedAt(getUnixTimestamp())
    this.updateMessage(newMessageObject)
    try {
      CometChat.callExtension(messageConstants.REACTIONS, messageConstants.POST, messageConstants.V1_REACT, {
        msgId: messageObject?.getId(),
        emoji: emoji,
      })
        .then((response: any) => {
        })
        .catch((error:any) => {
          this.updateMessage((this.messageToReact as CometChat.BaseMessage))
          // Some error occured
        });
    } catch (error:any) {
       this.messageEvents.publishEvents(this.messageEvents.onError, error);
    }
  }
  /**
   * set Messages Directly , coz new conversation is opened , hence no need to prepend or append
   * @param {CometChat.BaseMessage} messages
   */
  setMessages(messages: CometChat.BaseMessage[]) {
    try {
      this.messages = [...messages];
      this.scrollToBottom();
    } catch (error:any) {
       this.messageEvents.publishEvents(this.messageEvents.onError, error);
    }
  }
  /**
   * prepend Fetched Messages
   * @param {CometChat.BaseMessage} messages
   */
  prependMessages(messages: CometChat.BaseMessage[]) {
    try {
      this.messages = [...messages, ...this.messages];
      this.messageCount = this.messages.length
      if (this.messageCount > messageConstants.MAX_MESSAGE_COUNT) {
        this.reInitializeMessageBuilder();
      }
      this.ref.detectChanges();
    } catch (error:any) {
       this.messageEvents.publishEvents(this.messageEvents.onError, error);
    }
  }
  /**
   * append Messages that are sent
   * @param {CometChat.BaseMessage} message
   */
  addMessage(message: CometChat.BaseMessage) {
    try {
      this.isEmpty = false;
      this.isError = false;
      this.isLoading = false;
      this.messages.push(message)
       if (message.getReceiverId() != this.loggedInUser?.getUid() || (message.getReceiverId() == this.loggedInUser?.getUid() && this.isOnBottom) ) {
        setTimeout(() => {
          this.scrollToBottom()
        });
      }
      ++this.messageCount
      this.ref.detectChanges();
    } catch (error:any) {
       this.messageEvents.publishEvents(this.messageEvents.onError, error);
    }
  }
  /**
   * @param  {CometChat.BaseMessage} messages
   */
  messageSent(messages: CometChat.BaseMessage) {
    const message: CometChat.BaseMessage = messages;
    const messageList: CometChat.BaseMessage[] = [...this.messages];
    let messageKey = messageList.findIndex((m: CometChat.BaseMessage) => m.getMuid() === message.getMuid());
    if (messageKey > -1) {
      message.setEditedAt(getUnixTimestamp())
      messageList.splice(messageKey, 1, message);
    }
    this.messages = messageList;
    this.ref.detectChanges()
    this.scrollToBottom();
  }
  /**
   * updates Poll Messages depending on answer given by user
   * @param {CometChat.BaseMessage} messages
   */
  updatePollMessage(message: CometChat.BaseMessage) {
    try {
      const messageList: CometChat.BaseMessage[] = [...this.messages];
      const messageId: string | number = (message as any).poll.id;
      let messageKey = messageList.findIndex((m: CometChat.BaseMessage, k) => m.getId() === messageId);
      if (messageKey > -1) {
        const messageObj: CometChat.BaseMessage = messageList[messageKey];
        const metadataObj = {
          "@injected": { extensions: { polls: (message as any).poll } },
        };
        const newMessageObj: CometChat.TextMessage = (messageObj as CometChat.TextMessage)
        newMessageObj.setMetadata(metadataObj)
        this.messageEdited(newMessageObj);
      }
    } catch (error:any) {
       this.messageEvents.publishEvents(this.messageEvents.onError, error);
    }
  }
  /**
   * update status of message ie. read or deliv
   * @param {CometChat.BaseMessage} messages
   */
  updateMessages = (messages: CometChat.BaseMessage[]) => {
    try {
      this.messages = [...messages]
      this.ref.detectChanges();
    } catch (error:any) {
       this.messageEvents.publishEvents(this.messageEvents.onError, error);
    }
  };
  /**
   * Delete the message
   * @param {CometChat.BaseMessage} message
   */
  deleteMessage = (message: CometChat.BaseMessage) => {
    try {
      const messageId: any = message.getId();
      CometChat.deleteMessage(messageId)
        .then((deletedMessage) => {
          // this.removeMessage(deletedMessage);
          if (!this.hideDeletedMessages) {
            this.removeMessage(deletedMessage);
          }
          this.ref.detectChanges()
        })
        .catch((error:any) => {
          this.messageEvents.onMessageError.publish
        });
    } catch (error:any) {
       this.messageEvents.publishEvents(this.messageEvents.onError, error);
    }
  };
  /**
   * Sets The message to be edited to pass it to the message composer
   * @param {CometChat.BaseMessage} messages
   */
  editMessage(messages: CometChat.BaseMessage) {
    try {
      this.messageToBeEdited = messages;
    } catch (error:any) {
       this.messageEvents.publishEvents(this.messageEvents.onError, error);
    }
  }
  /**
   * If the message gets deleted successfull , remove the deleted message in frontend using this function
   * @param {CometChat.BaseMessage} messages
   */
  removeMessage = (messages: CometChat.BaseMessage) => {
    try {
      let messageKey = this.messages.findIndex(
        (message: CometChat.BaseMessage) => message.getId() === messages.getId()
      );
      if (messageKey > -1) {
        if (this.hideDeletedMessages) {
          this.messages.splice(messageKey, 1);
        }
        else {
          let newMessageObj: CometChat.BaseMessage = messages;
          this.messages.splice(messageKey, 1, newMessageObj);
          this.updateLastMessage(newMessageObj)
        }
        this.messages = [...this.messages];
      }
    } catch (error:any) {
       this.messageEvents.publishEvents(this.messageEvents.onError, error);
    }
  };
  /**
   * Checks extension smartReplyPreview
   * @param {CometChat.BaseMessage} messages
   */
  smartReplyPreview(message: CometChat.BaseMessage) {
    try {
      this.replyPreview = message;
      // if (message.hasOwnProperty(MetadataKey.metadata)) {
      //   const metadata: any = (message as CometChat.TextMessage).getMetadata();
      //   if (metadata.hasOwnProperty(MetadataKey.injected)) {
      //     const injectedObject = metadata[MetadataKey.injected];
      //     if (injectedObject.hasOwnProperty(MetadataKey.extension)) {
      //       const extensionsObject = injectedObject[MetadataKey.extension];
      //       if (extensionsObject.hasOwnProperty(MetadataKey.extensions.smartReply)) {
      //         const smartReply = extensionsObject[MetadataKey.extensions.smartReply];
      //         if (smartReply.hasOwnProperty(messageConstants.ERROR) === false) {
      //           this.replyPreview = message;
      //         } else {
      //           this.replyPreview = null;
      //         }
      //       }
      //     }
      //   }
      // }
    } catch (error:any) {
       this.messageEvents.publishEvents(this.messageEvents.onError, error);
    }
  }
  closeSmartReply = ()=>{
    this.replyPreview = null;
    this.ref.detectChanges()
  }
  /**
   * Handles scroll of window
   * @param e
   */
  handleScroll(e: any) {
    try {
      const bottom =
        Math.round(e.currentTarget.scrollHeight - e.currentTarget.scrollTop) ===
        Math.round(e.currentTarget.clientHeight);
      const top = e.currentTarget.scrollTop === 0;
      if (top) {
        this.ref.reattach()
        this.reachedTopOfConversation = true;
        this.getMessages(false, false, true);
        this.isOnBottom = false
        this.UnreadCount = []
      }
      else if (bottom) {
        this.ref.reattach()
        this.reachedTopOfConversation = true;
        this.isOnBottom = true
        if (this.UnreadCount.length) {
          let lastMessage = this.UnreadCount[this.UnreadCount.length - 1]
          CometChat.markAsRead(lastMessage).then((res: any) => {
            lastMessage.setEditedAt(getUnixTimestamp())
            this.UnreadCount = [];
            this.messageEvents.publishEvents(this.messageEvents.onMessageRead, lastMessage)
          })
        }
      }
      else {
        this.ref.detach();
        this.isOnBottom = false
      }
    } catch (error:any) {
       this.messageEvents.publishEvents(this.messageEvents.onError, error);
    }
  }
  /**
   * @param  {CometChat.BaseMessage} readMessage
   */
  markAllMessagAsRead(readMessage: CometChat.MessageReceipt, messageKey:number) {
    for(let i = messageKey; i >=0; i--){
      if (!this.messages[i].getReadAt()) {
    this.messages[i].setReadAt(readMessage.getReadAt());
    this.messages[i].setEditedAt(getUnixTimestamp());
    this.ref.detectChanges();
  }
}
  }
  markAllMessagAsDelivered(readMessage: CometChat.MessageReceipt, messageKey:number) {
    for(let i = messageKey; i >=0; i--){
      if (!this.messages[i].getDeliveredAt()) {
    this.messages[i].setDeliveredAt(readMessage.getDeliveredAt());
    this.messages[i].setEditedAt(getUnixTimestamp() +  i);
    this.ref.detectChanges();
  }
}
  }
  /**
   * Scrolls to bottom of chat window
   */
  scrollToBottom = () => {
    try {
      setTimeout(() => {
        this.chatWindow.nativeElement.scroll({
          top: this.chatWindow.nativeElement.scrollHeight,
          left: 0,
        });
        this.isOnBottom = true;
        this.ref.detectChanges()
      }, 10);
    } catch (error:any) {
       this.messageEvents.publishEvents(this.messageEvents.onError, error);
    }
  }
  /**
   * Plays Audio When Message is Sent
   */
  playAudio() {
    if (this.enableSoundForMessages) {
      if (this.customIncomingMessageSound) {
        CometChatSoundManager.play(CometChatSoundManager.Sound.incomingMessage, this.customIncomingMessageSound)
      }
      else {
        CometChatSoundManager.play(CometChatSoundManager.Sound.incomingMessage)
      }
    }
  }
  /**
   * passing style based on message object 
   * @param  {CometChat.BaseMessage} messageObject
   */
  setMessageBubbleStyle(msg: CometChat.BaseMessage): any {
    let data = checkMessageForExtensionsData(msg, MetadataKey.extensions.linkpreview )
    let style: any = {
    };
    if (msg.getDeletedAt()) {
      style = {
        background: "transparent",
        border: `1px dashed ${this.theme.palette.accent400[this.theme.palette.mode]}`,
        borderRadius: "12px",
        nameTextFont: fontHelper(this.theme.typography.caption1),
        nameTextColor: this.theme.palette.getAccent600()
      }
    }
    else if (!msg.getDeletedAt() &&  !data?.links?.length &&  msg.getCategory() == MessageCategory.message && msg.getType() == MessageTypes.text && (!msg.getSender() || this.loggedInUser!.getUid() == msg.getSender().getUid())) {
      style = { 
        background: this.theme.palette.primary[this.theme.palette.mode],
        borderRadius: "12px",
        nameTextFont: fontHelper(this.theme.typography.caption1),
        nameTextColor: this.theme.palette.getAccent600()
      }
    }
    else if (!msg.getDeletedAt() && msg.getCategory() == MessageCategory.message && msg.getType() == MessageTypes.audio) {
      style = {
        borderRadius: "",
        background: "transparent",
        nameTextFont: fontHelper(this.theme.typography.caption1),
        nameTextColor: this.theme.palette.getAccent600()
      }
    }
    else if (!msg.getDeletedAt() && msg.getCategory() == MessageCategory.custom && msg.getType() == MessageTypes.sticker) {
      style = {
        borderRadius: "",
        background: "transparent",
        nameTextFont: fontHelper(this.theme.typography.caption1),
        nameTextColor: this.theme.palette.getAccent600()
      }
    }
    else {
      style = {
        background: this.theme.palette.secondary[this.theme.palette.mode],
        borderRadius: "12px",
        nameTextFont: fontHelper(this.theme.typography.caption1),
        nameTextColor: this.theme.palette.getAccent600()
      }
    }
    return style
  }
  // setting alignment of message object
  setBubbleAlignment(msg: CometChat.BaseMessage) {
    let alignment;
    if (msg.getType() == MessageTypes.groupMember) {
      alignment = { justifyContent: "center", display: "flex" };
    }
    else if (!msg.getSender() || msg.getSender() && msg.getSender().getUid() == this.loggedInUser!.getUid()) {
      alignment = { justifyContent: "flex-end", display: "flex" };
    }
    else {
      alignment = { justifyContent: "flex-start", display: "flex" };
    }
    return {
      ...alignment
    }
  }
}
