import {
  Component,
  Input,
  OnInit,
  ViewChild,
  OnChanges,
  SimpleChanges,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  TemplateRef,
} from "@angular/core";
import { CometChat } from "@cometchat-pro/chat";
import { CometChatMessageComposerComponent } from "../../CometChatMessageComposer/cometchat-message-composer/cometchat-message-composer.component";
import { CometChatMessageListComponent } from "../../CometChatMessageList/cometchat-message-list/cometchat-message-list.component";

   import { ListItemStyle, MenuListStyle,AvatarStyle,DateStyle, BaseStyle} from 'my-cstom-package-lit'
import {  Subscription } from "rxjs";
import { CometChatThemeService } from "../../CometChatTheme.service";
import { fontHelper, CometChatMessageEvents, CometChatGroupEvents, IGroupLeft, CometChatUserEvents, CometChatUIKitConstants } from "uikit-resources-lerna";
import { MessageHeaderConfiguration, MessageListConfiguration, MessageComposerConfiguration, ThreadedMessagesConfiguration, DetailsConfiguration, MessagesStyle, MessageComposerStyle, MessageHeaderStyle, CallButtonsStyle } from "uikit-utils-lerna";
import { ChatConfigurator } from "../../Shared/Framework/ChatConfigurator";
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
  @ViewChild("messageComposerRef", { static: false }) messageComposerRef!: CometChatMessageComposerComponent;
  @ViewChild("messageListRef", { static: false }) messageListRef!: CometChatMessageListComponent;
  @Input() user!: CometChat.User;
  @Input() group!: CometChat.Group;
  @Input() hideMessageComposer: boolean = false;
  @Input() disableTyping!: boolean;
  @Input() messageHeaderConfiguration: MessageHeaderConfiguration = new MessageHeaderConfiguration({});
  @Input() messageListConfiguration: MessageListConfiguration = new MessageListConfiguration({});
  @Input() messageComposerConfiguration: MessageComposerConfiguration = new MessageComposerConfiguration({});
  @Input() threadedMessageConfiguration: ThreadedMessagesConfiguration = new ThreadedMessagesConfiguration({});
  @Input() detailsConfiguration: DetailsConfiguration = new DetailsConfiguration({});
  @Input() customSoundForIncomingMessages!: string;
  @Input() customSoundForOutgoingMessages!: string;
  @Input() disableSoundForMessages!: boolean;
  @Input() messagesStyle: MessagesStyle = {
    width: "100%",
    height: "100%",
    background: "white",
    borderRadius: "none",
    border: "1px solid rgba(20, 20, 20, 0.1)",
    messageTextColor: "rgba(20, 20, 20, 0.33)",
    messageTextFont: "700 22px Inter",
  };
  @Input() messageHeaderView!: TemplateRef<any>;
  @Input() messageComposerView!: TemplateRef<any>;
  @Input() messageListView!: TemplateRef<any>;
  @Input() hideMessageHeader: boolean = false;
  @Input() hideDetails:boolean = false;
  @Input() auxiliaryMenu!:TemplateRef<any>;
  loggedInUser!: CometChat.User | null;
  callButtonsStyle: CallButtonsStyle = {
    width: "100%",
    height: "100%",
    border: "none",
    borderRadius: "0",
    background: "transparent",
    buttonPadding:"0",
    buttonBackground:"transparent",
    buttonBorder:"0 4px",
    buttonBorderRadius:"8px"
  };
  public messageToBeEdited: CometChat.BaseMessage | null = null;
  public liveReaction: boolean = false;
  public reactionName: string = "assets/heart-reaction.png";
  public messageToReact: CometChat.BaseMessage | null = null;
  public composerStyles: MessageComposerStyle = {
    width: "100%",
    height: "100%",
    border: "none",
    borderRadius: "12px",
    background: this.themeService.theme.palette.getAccent900(),
    inputBackground: this.themeService.theme.palette.getSecondary(), // done
    textFont: fontHelper(this.themeService.theme.typography.subtitle1), // done
    textColor: this.themeService.theme.palette.getAccent(), // done
  }
  public liveReactionTimeout: any = 0;
  public openThreadedMessages:boolean = false;
  /*
 messageHeaderConfiguration
 */
  subtitleView!: TemplateRef<any>;
  disableUsersPresence: boolean = false;
  protectedGroupIcon: string = "assets/Locked.svg";
  privateGroupIcon: string ="assets/Private.svg";
  menu!: TemplateRef<any>;
  headerStyle: MessageHeaderStyle = new MessageHeaderStyle({})
  backButtonIconURL: string = "assets/backbutton.svg";
  hideBackIcon: boolean = true;
  listItemView!: TemplateRef<any>;
  onError!: (error:any)=> void;
  onBack!: ()=> void;
  avatarStyle: AvatarStyle = {
    borderRadius: "16px",
    width: "28px",
    height: "28px",
    border: "none",
    backgroundColor: "white",
    nameTextColor: "rgb(20,20,20)",
    backgroundSize: "cover",
    nameTextFont: "500 16px Inter",
    outerViewBorder: "",
    outerViewBorderSpacing: "",
  }
  statusIndicatorStyle: BaseStyle = {
    borderRadius: "16px",
    width: "10px",
    height: "10px",
    border: "none",
  }
  messageHeaderStyle: MessageHeaderStyle = {
    width: "100%",
    height: "100%",
    background: "transparent",
    border: "none",
    borderRadius: "0",
    backButtonIconTint: "#3399FF",
    onlineStatusColor: "#00f300",
    subtitleTextColor: "grey",
    subtitleTextFont: "400 14px Inter",
    typingIndicatorTextColor: "#3399FF",
    typingIndicatorTextFont: "400 13px Inter",
  }
  listItemStyle: ListItemStyle = {
    background: "white",
    titleColor: "black",
    titleFont: "500 16px Inter",
    width: "",
    height: "100%",
    border: "none",
    borderRadius: "2px",
    separatorColor: "",
    activeBackground: "transparent",
    hoverBackground:"transparent"
  }


 infoIconStyle:string = "assets/Info.svg"
 detailsButtonStyle:any = {
   height:"24px",
   width:"24px",
   border:"none",
   borderRadius:"0",
   background:"transparent",
   buttonIconTint:"#3399FF",
   padding:"0 8px"
 }
 enableCalling:boolean = false;
//
public ccLiveReaction!: Subscription;
public ccGroupDeleted!: Subscription;
public ccGroupLeft!:Subscription;
public ccUserBlocked!: Subscription;
public ccUserUnBlocked!:Subscription;
  threadMessageObject!:CometChat.BaseMessage | null;
  parentBubbleView!:TemplateRef<any>;
  openDetails:boolean = false;
  constructor( private ref: ChangeDetectorRef,private themeService:CometChatThemeService) { }
  ngOnInit() {
    this.subscribeToEvents()
    this.setMessagesStyle()


    CometChat.getLoggedinUser().then((user) => {
      this.loggedInUser = user;
    }).catch((error:CometChat.CometChatException)=>{
      if(this.onError){
        this.onError(error)
      }
    })
    if (ChatConfigurator.names.includes('calling')) {
      this.enableCalling = true
    }
  }
  subscribeToEvents(){
    this.ccLiveReaction = CometChatMessageEvents.ccLiveReaction.subscribe((reactionName: any) => {
      this.liveReactionStart(reactionName)
      this.ref.detectChanges();
    })
    this.ccGroupDeleted = CometChatGroupEvents.ccGroupDeleted.subscribe((group:CometChat.Group)=>{
      if(this.group && this.group.getGuid() == group.getGuid()){
        this.openDetails = false;
        this.openThreadedMessages = false;
        this.group = group
        this.ref.detectChanges()
      }
    })
    this.ccGroupLeft = CometChatGroupEvents.ccGroupLeft.subscribe((item:IGroupLeft)=>{
      if(this.group && this.group.getGuid() == item.leftGroup.getGuid()){
        if(this.loggedInUser?.getUid() == item?.userLeft.getUid()){
          this.openDetails = false;
          this.openThreadedMessages = false;
        }
        this.group = item.leftGroup;
        this.ref.detectChanges();
      }
    })
    this.ccUserBlocked = CometChatUserEvents.ccUserBlocked.subscribe((user:CometChat.User) => {
      if(this.user && user.getUid() == this.user.getUid()){
        this.user = user;
        this.ref.detectChanges()
      }
   })
   this.ccUserUnBlocked = CometChatUserEvents.ccUserUnblocked.subscribe((user:CometChat.User) => {
     if(this.user && user.getUid() == this.user.getUid()){
       this.user = user;
       this.ref.detectChanges()
     }
   })
  }
  unsubscribeToEvents(){
     this.ccLiveReaction?.unsubscribe()
 this.ccGroupDeleted?.unsubscribe()
 this.ccGroupLeft?.unsubscribe()
 this.ccUserBlocked?.unsubscribe()
 this.ccUserUnBlocked?.unsubscribe()
  }
  setMessagesStyle(){
    let defaultStyle:MessagesStyle = new MessagesStyle({
      width: "100%",
      height: "100%",
      background: this.themeService.theme.palette.getBackground(),
      borderRadius: "none",
      border: "none",
      messageTextColor: this.themeService.theme.palette.getAccent600(),
      messageTextFont: fontHelper(this.themeService.theme.typography.title1),
    })
    this.messagesStyle = {
      ...defaultStyle,
      ...this.messagesStyle
    }
  }
  getAuxilaryView(){
    if(this.messageHeaderConfiguration.menu){
      return this.messageHeaderConfiguration.menu
    }
    else if(this.auxiliaryMenu){
      return this.auxiliaryMenu
    }
    else{
      return null;
    }
  }
  openThreadView = (message:CometChat.BaseMessage,bubble:TemplateRef<any>)=>{
this.threadMessageObject=message
this.parentBubbleView=bubble
this.openThreadedMessages = true;
this.ref.detectChanges();
  }
  openDetailsPage =()=>{
    this.openDetails = true
  }
  closeDetailsPage =()=>{
    this.openDetails = false
  }
  closeThreadView = ()=>{
    this.threadMessageObject = null;
this.openThreadedMessages = false;
this.ref.detectChanges();
  }
  /**
   * @param  {string} reactionName
   */
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

  ngOnChanges(change: SimpleChanges) {
    try {
    if (change[CometChatUIKitConstants.MessageReceiverType.user] || change[CometChatUIKitConstants.MessageReceiverType.group]) {
      this.openThreadedMessages = false;
      this.openDetails = false;
      if (this.user) {
        if (Object.keys(this.user).length === 1) {
          CometChat.getUser(this.user)
            .then((user: CometChat.User) => {
              this.user = user
            })
        }
      } else if (this.group) {
        if (Object.keys(this.group).length === 1) {
          CometChat.getGroup(this.group)
            .then((group: CometChat.Group) => {
              this.group = group
            })
        }
      }
    }
    } catch (error: any) {
if(this.onError){
  this.onError(error)
}
    }
  }
  ngOnDestroy() {
    this.ccLiveReaction.unsubscribe();
    this.openThreadedMessages = false;
    this.openDetails = false;

  }
  chatListStyle() {
    return {
      background: this.messagesStyle.background || this.themeService.theme.palette.getBackground(),
      height: this.messagesStyle.height,
      width: this.messagesStyle.width,
      border: this.messagesStyle.border,
      borderRadius: this.messagesStyle.borderRadius
    }
  }
  /**
   * public methods
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
   * this method will open preview of the message
   * @param  {CometChat.BaseMessage} message
   * @param  {string} mode
   */
  previewMessage(message: CometChat.TextMessage, mode: string = "") {
    this.messageComposerRef.messageToBeEdited = message
    this.messageComposerRef.openEditPreview()
  }
}
