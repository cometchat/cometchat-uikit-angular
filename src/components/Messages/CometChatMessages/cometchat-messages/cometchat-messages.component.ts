import {
  Component,
  Input,
  OnInit,
  ViewChild,
  OnChanges,
  SimpleChanges,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from "@angular/core";
import { CometChat } from "@cometchat-pro/chat";
import { messageConstants, MessageListAlignment, MessageReceiverType, MessageStatus, MessageTypes } from "../../../Shared/Constants/UIKitConstants";
import { checkHasOwnProperty } from "../../../Shared/Helpers/CometChatHelper";
import { CometChatMessageComposerComponent } from "../../CometChatMessageComposer/cometchat-message-composer/cometchat-message-composer.component";
import { CometChatMessageListComponent } from "../../CometChatMessageList/cometchat-message-list/cometchat-message-list.component";
import { CometChatConversationEvents } from "../../../Chats/CometChatConversationEvents.service";
import { CometChatTheme, fontHelper } from "../../../Shared/PrimaryComponents/CometChatTheme/CometChatTheme";
import { CometChatMessageTemplate } from "../../CometChatMessageTemplate/cometchat-message-template";
import { CometChatMessageEvents } from "../../CometChatMessageEvents.service";
import { CometChatSoundManager } from "../../../Shared/PrimaryComponents/CometChatSoundManager/cometchat-sound-manager/cometchat-sound-manager";
import { LiveReactionConfiguration, localize, MessageComposerConfiguration, MessageHeaderConfiguration, MessageListConfiguration } from "../../../Shared";
import { customView } from "../../../Shared/Types/interface";
import { composerStyles } from "../../CometChatMessageComposer/interface";
import { MessageOptions } from "../../CometChatMessageOptions/CometChatMessageOptions";
import { messageInputData } from "../../../Shared/InputData/MessageInputData";
  /**
*
* CometChatMessages is a wrapper component for messageList, messageHeader, messageComposer and liveReaction component.
*
* @version 1.0.0
* @author CometChatTeam
* @copyright © 2022 CometChat Inc.
*
*/
@Component({
  selector: "cometchat-messages",
  templateUrl: "./cometchat-messages.component.html",
  styleUrls: ["./cometchat-messages.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CometChatMessagesComponent implements OnInit, OnChanges {
  // getting reference of messageList,MessageHeader and messageComposer component.
  @ViewChild("messageComposerRef", { static: false }) messageComposerRef!: CometChatMessageComposerComponent;
  @ViewChild("messageListRef", { static: false }) messageListRef!: CometChatMessageListComponent;
   /**
   * This properties will come from Parent.
   */
  @Input() user!: CometChat.User | null; //user object 
  @Input() group!: CometChat.Group | null; //group object
  @Input() hideMessageComposer: boolean = false; //hide show message composer
  @Input() messageHeaderConfiguration: MessageHeaderConfiguration = new MessageHeaderConfiguration({});
  @Input() messageListConfiguration: MessageListConfiguration = new MessageListConfiguration({});
  @Input() messageComposerConfiguration: MessageComposerConfiguration = new MessageComposerConfiguration({})
  @Input() liveReactionConfiguration: LiveReactionConfiguration = new LiveReactionConfiguration({})
  @Input() messageTypes: CometChatMessageTemplate[] = [];
  @Input() type: string = '';
  @Input() loggedInUser!: CometChat.User | null;
  @Input() customIncomingMessageSound!: string;
  @Input() customOutgoingMessageSound!: string;
  @Input() enableSoundForMessages!: boolean;
  @Input() enableSoundForCalls!: boolean;
  @Input() enableTypingIndicator!: boolean;
  @Input() style: any={
    width: "100%",
    height: "100%",
    background: "white",
    borderRadius: "none",
    border: "1px solid rgba(20, 20, 20, 0.1)",
    messageTextColor: "rgba(20, 20, 20, 0.33)",
    messageTextFont: "700 22px Inter",
    boxShadow: "rgba(20, 20, 20, 0.1)"
  };
  @Input() emptyText:string= localize("NO_CHATS_FOUND")
         /**
     * Properties for internal use
     */
  // public isMobileView: boolean = true
  public messagesStyle: any = {}
  public onMessageEdit: any;
  public onLiveReaction: any;
  public onMessageSent: any;
  public onMessageEdited: any;
   @Input() theme: CometChatTheme = new CometChatTheme({});
  public messageToBeEdited: CometChat.BaseMessage | null = null;
  public replyPreview = null;
  public liveReaction: boolean = false;
  public reactionName: string = "assets/resources/heart-reaction.png";
  public messageToReact: CometChat.BaseMessage | null = null;
  public composerStyles: composerStyles = {
    width: "100%",
    height: "100%",
    border: "none",
    borderRadius: "12px",
    background: this.theme.palette.getAccent900(),
    inputBackground: this.theme.palette.getSecondary(), // done
    inputTextFont: fontHelper(this.theme.typography.subtitle1), // done 
    inputTextColor: this.theme.palette.getAccent(), // done
  }
  public messageListStyle:any = {
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
  }
  public liveReactionTimeout: any = 0;
  public messageListTypes!:any;
  public messageComposerTypes!:any;
  public messagesTypes = [];
  /*
 messageHeaderConfiguration
 */
  options: any = [];
  showBackButton: boolean = false;
  backButtonIconURL: string = "";
  inputData: any = {};
  /*
  messageListConfiguration
  */
  alignment: string = "standard";
  excludeMessageTypes: string[] = [];
  excludeMessageOptions: {}[] = [];
  customOptions: {}[] = [];
  limit: number = 30;
  onlyUnread: boolean = false;
  hideMessagesFromBlockedUsers: boolean = true;
  hideDeletedMessages: boolean = false;
  threadParentMessageId!: number | string;
  tags: string[] = [];
  hideThreadReplies: boolean = true;
  categories: string[] | null = [];
  hideReadReceipt: boolean = false;
  loadingIconURL: string = "assets/resources/Spinner.svg";
  customView!: customView;
  parentMessageId: number = 0;
  messages: CometChat.BaseMessage[] = [];
  reachedTopOfConversation: boolean = false;
  errorText: string = "Unable to fetch messages";
  hideError: boolean = false;
  showEmojiInLargerSize: boolean = false;
  customMessageOptions: any[] = [];
  receivedMessageInputData: messageInputData = {}
  sentMessageInputData: messageInputData = {}
  placeholderText: string = localize("ENTER_YOUR_MESSAGE_HERE");
  sendButtonIconURL: string = "";
  liveReactionIcon: string = "";
  attachmentIconURL: string = "";
  stickerIconURL: string = "";
  closeIconURL: string = "";
  hideAttachment: boolean = false;
  hideLiveReaction: boolean = false;
  hideEmoji: boolean = false;
  emojiIconURL: string = "";
  showSendButton: boolean = true;
  onSendButtonClick: any;
  onMessageDelete: any;
  onMessageReact: any;
  onMessageRead: any;
  onMessageError:any;
  constructor(private conversationEvents: CometChatConversationEvents, private messageEvents: CometChatMessageEvents, private ref: ChangeDetectorRef) { }
  /**
   * 
   * CometChatMessages component is a wrapper component  consists of messageListComponent,MessageHeaderComponent and messageComposerComponent.
   * it listens to events and update messagelist messages.
   * 
   * @version 1.0.0
   * @author CometChatTeam
   * @copyright © 2022 CometChat Inc.
   * 
   */
  ngOnInit() {
    this.subscribeToEvents();
    this.checkConfiguration();
    CometChat.getLoggedinUser().then((user) => {
      this.loggedInUser = user;
    });
    this.setTheme();
  }
  checkConfiguration() {
    if (this.messageListConfiguration) {
      let configuration = this.messageListConfiguration;
      let defaultConfiguration = new MessageListConfiguration({})
      this.setMessageListConfiguration(configuration, defaultConfiguration)
    }
    else {
      let defaultConfiguration = new MessageListConfiguration({})
      this.setMessageListConfiguration(defaultConfiguration)
    }
    if (this.messageHeaderConfiguration) {
      let configuration = this.messageHeaderConfiguration;
      let defaultConfiguration = new MessageHeaderConfiguration({})
      this.setMessageHeaderConfiguration(configuration, defaultConfiguration)
    }
    else {
      let defaultConfiguration = new MessageHeaderConfiguration({});
      this.setMessageHeaderConfiguration(defaultConfiguration)
    }
    if (this.messageComposerConfiguration) {
      let configuration = this.messageComposerConfiguration;
      let defaultConfiguration = new MessageComposerConfiguration({})
      this.setMessageComposerConfiguration(configuration, defaultConfiguration)
    }
    else {
      let defaultConfiguration = new MessageComposerConfiguration({})
      this.setMessageComposerConfiguration(defaultConfiguration)
    }
    if (this.liveReactionConfiguration) {
      let configuration = this.liveReactionConfiguration;
      let defaultConfiguration = new LiveReactionConfiguration({})
      this.setLiveReactionConfiguration(configuration, defaultConfiguration)
    }
    else {
      let defaultConfiguration = new LiveReactionConfiguration({})
      this.setLiveReactionConfiguration(defaultConfiguration)
    }
  }
  setLiveReactionConfiguration(configuration: LiveReactionConfiguration, defaultConfiguration?: LiveReactionConfiguration) {
    this.liveReactionIcon = configuration.liveReactionIconURL || defaultConfiguration!.liveReactionIconURL
  }
  setInputData(senderInput:messageInputData,receiverInput:messageInputData){
    if(this.user){
      if(senderInput.time == null){
        this.sentMessageInputData.time = true
      }
      if(senderInput.thumbnail == null){
        this.sentMessageInputData.thumbnail = false
      }
      if(senderInput.title == null){
        this.sentMessageInputData.title = false
      }
      if(senderInput.readReceipt == null){
        this.sentMessageInputData.readReceipt = true
      }
      if(receiverInput.time == null){
        this.receivedMessageInputData.time = true
      }
      if(receiverInput.thumbnail == null){
        this.receivedMessageInputData.thumbnail = false
      }
      if(receiverInput.title == null){
        this.receivedMessageInputData.title = false
      }
      if(receiverInput.readReceipt == null){
        this.receivedMessageInputData.readReceipt = false
      }
    }
    else if(this.group){
      if(senderInput.time == null){
        this.sentMessageInputData.time = true
      }
      if(senderInput.thumbnail == null){
        this.sentMessageInputData.thumbnail = false
      }
      if(senderInput.title == null){
        this.sentMessageInputData.title = false
      }
      if(senderInput.readReceipt == null){
        this.sentMessageInputData.readReceipt = true
      }
      
      if(receiverInput.time == null){
        this.receivedMessageInputData.time = true
      }
      if(receiverInput.thumbnail == null){
        this.receivedMessageInputData.thumbnail = true
      }
      if(receiverInput.title == null){
        this.receivedMessageInputData.title = true
      }

    }
    if(this.alignment == MessageListAlignment.left &&  this.messageListConfiguration.alignment != MessageListAlignment.left){
      this.sentMessageInputData.readReceipt = false
      this.receivedMessageInputData.readReceipt = false
    }
  }
  setMessageListConfiguration(configuration: MessageListConfiguration, defaultConfiguration?: MessageListConfiguration) {
    this.receivedMessageInputData = {...configuration!.receivedMessageInputData} || {...defaultConfiguration!.receivedMessageInputData};
    this.sentMessageInputData = {...configuration!.sentMessageInputData} || {...defaultConfiguration!.sentMessageInputData};
    this.setInputData(this.sentMessageInputData, this.receivedMessageInputData)
    this.alignment = configuration?.alignment || defaultConfiguration!.alignment;
    this.customMessageOptions = configuration!.customMessageOptions || defaultConfiguration!.customMessageOptions;
    this.customView = configuration!.customView || defaultConfiguration!.customView;
    this.excludeMessageOptions = configuration!.excludeMessageOptions || defaultConfiguration!.excludeMessageOptions;
    this.excludeMessageTypes = configuration!.excludeMessageTypes || defaultConfiguration!.excludeMessageTypes;
    this.hideDeletedMessages = checkHasOwnProperty(configuration, "hideDeletedMessages") ? configuration!.hideDeletedMessages : defaultConfiguration!.hideDeletedMessages;
    this.hideError = checkHasOwnProperty(configuration, "hideError") ? configuration!.hideError : defaultConfiguration!.hideError;
    this.hideMessagesFromBlockedUsers = checkHasOwnProperty(configuration, "hideMessagesFromBlockedUsers") ? configuration!.hideMessagesFromBlockedUsers : defaultConfiguration!.hideMessagesFromBlockedUsers;
    this.hideThreadReplies = checkHasOwnProperty(configuration, "hideThreadReplies") ? configuration!.hideThreadReplies : defaultConfiguration!.hideThreadReplies;
    this.limit = configuration!.limit || defaultConfiguration!.limit;
    this.loadingIconURL = configuration!.loadingIconURL || defaultConfiguration!.loadingIconURL;
    if(!this.messageTypes || (this.messageTypes.length && this.messageTypes.length <= 0)){
      this.messageListTypes = configuration!.messageTypes || defaultConfiguration!.messageTypes;
    }
    else{
      this.messageListTypes = this.messageTypes;
    }
    this.onlyUnread = checkHasOwnProperty(configuration, "onlyUnread") ? configuration!.onlyUnread : defaultConfiguration!.onlyUnread;
    this.tags = configuration!.tags || defaultConfiguration!.tags;
    this.threadParentMessageId = checkHasOwnProperty(configuration, "threadParentMessageId") ? configuration!.threadParentMessageId : defaultConfiguration!.threadParentMessageId;
  }
  setMessageHeaderConfiguration(configuration: MessageHeaderConfiguration, defaultConfiguration?: MessageHeaderConfiguration) {
    this.options = configuration?.options || defaultConfiguration!.options;
    this.showBackButton = checkHasOwnProperty(configuration, "showBackButton") ? configuration?.showBackButton : defaultConfiguration!.showBackButton;
    this.backButtonIconURL = configuration?.backButtonIconURL || defaultConfiguration!.backButtonIconURL;
    this.enableTypingIndicator = checkHasOwnProperty(configuration, "enableTypingIndicator") ? configuration?.enableTypingIndicator : defaultConfiguration!.enableTypingIndicator;;
    this.inputData = configuration?.inputData || defaultConfiguration!.inputData;
  }
  setMessageComposerConfiguration(configuration: MessageComposerConfiguration, defaultConfiguration?: MessageComposerConfiguration) {
    this.sendButtonIconURL = configuration.sendButtonIconURL || defaultConfiguration!.sendButtonIconURL;
    this.liveReactionIcon = configuration.liveReactionIconURL || defaultConfiguration!.liveReactionIconURL;
    this.attachmentIconURL = configuration.attachmentIconURL || defaultConfiguration!.attachmentIconURL;
    this.stickerIconURL = configuration.stickerIconURL || defaultConfiguration!.stickerIconURL;
    this.closeIconURL = configuration.closeIconURL || defaultConfiguration!.closeIconURL;
    this.hideAttachment = checkHasOwnProperty(configuration, "hideAttachment") ? configuration.hideAttachment : defaultConfiguration!.hideAttachment;
    this.hideLiveReaction = checkHasOwnProperty(configuration, "hideLiveReaction") ? configuration.hideLiveReaction : defaultConfiguration!.hideLiveReaction;
    this.hideEmoji = checkHasOwnProperty(configuration, "hideEmoji") ? configuration.hideEmoji : defaultConfiguration!.hideEmoji;
    this.emojiIconURL = configuration.emojiIconURL || defaultConfiguration!.emojiIconURL;
    this.showSendButton = checkHasOwnProperty(configuration, "showSendButton") ? configuration.showSendButton : defaultConfiguration!.showSendButton;
    this.onSendButtonClick = configuration.onSendButtonClick || null;
    if(!this.messageTypes || (this.messageTypes.length && this.messageTypes.length <= 0)){
      this.messageComposerTypes = configuration.messageTypes || defaultConfiguration!.messageTypes;
    }
    else{
      this.messageComposerTypes = this.messageTypes;
    }
    this.customOutgoingMessageSound = checkHasOwnProperty(configuration, "customOutgoingMessageSound") ? configuration.customOutgoingMessageSound : defaultConfiguration!.customOutgoingMessageSound;
    this.enableSoundForMessages = checkHasOwnProperty(configuration, "enableSoundForMessages") ? configuration.enableSoundForMessages : defaultConfiguration!.enableSoundForMessages;
    this.enableTypingIndicator = checkHasOwnProperty(configuration, "enableTypingIndicator") ? configuration.enableTypingIndicator : defaultConfiguration!.enableTypingIndicator;
    this.excludeMessageTypes = configuration.excludeMessageTypes || defaultConfiguration!.excludeMessageTypes;
  }
  ngOnChanges(change: SimpleChanges) {
    try {
      if (change[MessageReceiverType.user] || change[MessageReceiverType.group]) {
        if (this.user) {
          if (Object.keys(this.user).length > 1) {
            this.type = CometChat.RECEIVER_TYPE.USER
          }
          else {
            CometChat.getUser(this.user)
              .then((user: CometChat.User) => {
                this.user = user
                this.type = CometChat.RECEIVER_TYPE.USER
              })
          }
        }
        else if (this.group) {
          if (Object.keys(this.group).length > 1) {
            this.type = CometChat.RECEIVER_TYPE.GROUP
          }
          else {
            CometChat.getGroup(this.group)
              .then((group: CometChat.Group) => {
                this.group = group
                this.type = CometChat.RECEIVER_TYPE.GROUP
              })
          }
        }
      }
      if (change[messageConstants.COMPOSED_THREAD_MESSAGE]) {
        // There is a valid Thread parent message , than update it's reply count
        if (change[messageConstants.COMPOSED_THREAD_MESSAGE].currentValue) {
        }
      }
      if (change[messageConstants.GROUP_MESSAGE]) {
        if (change[messageConstants.GROUP_MESSAGE].currentValue.length > 0) {
          this.addMessage(change[messageConstants.GROUP_MESSAGE].currentValue);
        }
      }
      // When There is call display proper call messages
      if (change[messageConstants.CALL_MESSAGE]) {
        let prevProps: any = { callMessage: null };
        let props: any = { callMessage: null };
        prevProps[messageConstants.CALL_MESSAGE] =
          change[messageConstants.CALL_MESSAGE].previousValue;
        props[messageConstants.CALL_MESSAGE] = change[messageConstants.CALL_MESSAGE].currentValue;
        if (prevProps.callMessage !== props.callMessage && props.callMessage) {
        }
      }
      this.checkConfiguration()
    } catch (error:any) {
        this.messageEvents.publishEvents(this.messageEvents.onError, error);
    }
  }
  ngOnDestroy() {
    this.unsubscribeToEvents()
  }
  setTheme() {
   this.messageListStyle.background = this.theme.palette.getBackground();
   this.messageListStyle.emptyStateTextFont = fontHelper(this.theme.typography.heading)
   this.messageListStyle.emptyStateTextColor = this.theme.palette.getAccent400();
   this.messageListStyle.errorStateTextFont = fontHelper(this.theme.typography.heading)
   this.messageListStyle.errorStateTextColor = this.theme.palette.getAccent400();
   this.messageListStyle.loadingIconTint = this.theme.palette.getAccent400();
   this.composerStyles.background = this.theme.palette.getAccent900()
   this.composerStyles.inputBackground = this.theme.palette.getSecondary()
   this.composerStyles.inputTextFont = fontHelper(this.theme.typography.subtitle1)
   this.composerStyles.inputTextColor = this.theme.palette.getAccent900("dark")
  }
  /**
   * on receiving message sent event from composer
   * @param  {any} event
   */
  sentMessageHandler(event: any) {
    try {
      let message: CometChat.BaseMessage = event.message
      switch (event.status) {
        case MessageStatus.inprogress: {
          this.addMessage(message);
          // this.playAudio()
          break;
        }
        case MessageStatus.success: {
          this.updateMessage(message, true);
          this.updateLastMessage(message)
          break;
        }
      }
    }
    catch (error:any) {
    }
  }
  /**
   * @param  {CometChat.BaseMessage} msg
   */
  updateLastMessage(msg: CometChat.BaseMessage) {
    this.conversationEvents.publishEvents(this.conversationEvents.updateLastMessage, msg)
  }
  /**
* subscribing to events
* 
*/
  subscribeToEvents() {
    this.onMessageEdit = this.messageEvents.onMessageEdit.subscribe((object: any) => {
      if(object?.status == MessageStatus.inprogress ){
        this.previewMessage(object.message)
      }
      else if(object?.status == MessageStatus.success){
        this.updateMessage(object.message)
     
      }
    })
    this.onMessageSent = this.messageEvents.onMessageSent.subscribe((obj: any) => {
      this.sentMessageHandler(obj)
    })
    this.onLiveReaction = this.messageEvents.onLiveReaction.subscribe((reactionName: any) => {
      this.liveReactionStart(reactionName.reaction)
      this.ref.detectChanges();
    })
    this.onMessageDelete = this.messageEvents.onMessageDelete.subscribe((messageObject: any) => {
     this.updateDeletedMessage(messageObject.message)
      this.ref.detectChanges();
    })
    this.onMessageReact = this.messageEvents.onMessageReact.subscribe((object: any) => {
      this.messageListRef.reactToMessages(object.reaction, object.message)
       this.ref.detectChanges();
     })
     this.onMessageError = this.messageEvents.onMessageError.subscribe((object: any) => {
      this.updateMessage(object.message, true)
       this.ref.detectChanges();
     })
  }
  // start live reaction
  liveReactionStart = (reactionName: string) => {
    if (this.liveReaction) {
      this.reactionName = "";
      this.liveReaction = false;
      this.ref.detectChanges();
    }
    this.reactionName = reactionName;
    this.liveReaction = true;
    this.ref.detectChanges();
    setTimeout(() => {
      this.reactionName = "";
      this.liveReaction = false;
      this.ref.detectChanges();
    }, 1500);
    this.ref.detectChanges();
  }
  updateDeletedMessage = (message:CometChat.BaseMessage)=>{
    if(this.messageListRef.hideDeletedMessages){
      this.messageListRef.removeMessage(message)
    }
    else{
      this.messageListRef.updateMessage(message)
    }
  }
  /**
 * unsubscribe to events
 * 
 */
  unsubscribeToEvents() {
    this.onMessageEdit.unsubscribe();
    this.onMessageSent.unsubscribe();
    this.onLiveReaction.unsubscribe();
    this.onMessageReact.unsubscribe();
    this.onMessageDelete.unsubscribe();
    this.onMessageError.unsubscribe()
  }
  /**
   * Plays Audio When Message is Sent
   */
  playAudio() {
    if (this.enableSoundForMessages) {
      if (this.customOutgoingMessageSound) {
        CometChatSoundManager.play(CometChatSoundManager.Sound.incomingCall,this.customOutgoingMessageSound)
      }
      else {
        CometChatSoundManager.play(CometChatSoundManager.Sound.incomingCall)
      }
    }
  }
  /**
   * Emits an Action Indicating that Group Data has been updated
   * @param
   */
  /**
   * @param  {any} message
   * @param  {any} key
   * @param  {any} group
   * @param  {any} options
   */
  groupUpdated = (message: CometChat.BaseMessage, key: any, group: any, options: any) => {
    try {
      this.addMessage(message);
    } catch (error:any) {
        this.messageEvents.publishEvents(this.messageEvents.onError, error);
    }
  };
  /**
   * messageListRef methods
   * This metthod will append message in message list
   * @param  {CometChat.BaseMessage} message
   */
  addMessage(message: CometChat.BaseMessage) {
    this.messageListRef.addMessage(message);
  }
  /**
   * This method will update the message in messageList
   * @param  {CometChat.BaseMessage} message
   */
  updateMessage(message: CometChat.BaseMessage, muid: boolean = false) {
    this.messageListRef.updateMessage(message, muid);
    this.updateLastMessage(message)
  }
  /**
   * This method will remove  the message from messageList
   * @param  {CometChat.BaseMessage} message
   */
  removeMessage(message: CometChat.BaseMessage) {
    this.messageListRef.removeMessage(message)
  }
  /**
   * This method will delete and remove  the message from messageList
   * @param  {CometChat.BaseMessage} message
   */
  deleteMessage(message: CometChat.BaseMessage) {
    this.messageListRef.deleteMessage(message)
  }
  /**
   * this method will send a text message
   * @param  {string} text
   */
  sendTextMessage(text: string) {
    this.messageComposerRef.sendTextMessage(text)
  }
  /**
   * this method will send a media message 
   * @param  {CometChat.MediaMessage} message
   * @param  {string} messageType
   */
  sendMediaMessage(message: CometChat.MediaMessage, messageType: string = "") {
    this.messageComposerRef.sendMediaMessage(message, messageType)
  }
  /**
   * this method will open preview of the message
   * @param  {CometChat.BaseMessage} message
   * @param  {string} mode
   */
  previewMessage(message: CometChat.BaseMessage, mode: string = "") {
    this.messageComposerRef.openEditPreview(message)
  }
  chatListStyle() {
    return {
      background: this.style.background || this.theme.palette.getBackground(),
      height:this.style.height,
      width:this.style.width,
      border:this.style.border,
      borderRadius:this.style.borderRadius
    }
  }
  emptyMessageStyle = ()=>{
    return {
      background: this.style.background || this.theme.palette.getBackground(),
      height:this.style.height,
      width:this.style.width,
      border:this.style.border,
      borderRadius:this.style.borderRadius,
    }
  }
}
