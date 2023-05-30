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


import { AvatarStyle,ListItemStyle,DateStyle, BaseStyle} from 'my-cstom-package-lit'
import {  Subscription } from "rxjs";
import { CometChatThemeService } from "../../CometChatTheme.service";
import { localize, fontHelper, CometChatMessageTemplate, CometChatMessageEvents, IMessages, MessageStatus } from "uikit-resources-lerna";
import { MessageListConfiguration, MessageComposerConfiguration, ThreadedMessagesStyle, MessageComposerStyle } from "uikit-utils-lerna";
import { ChatConfigurator } from "../../Shared/Framework/ChatConfigurator";
/**
*
* CometChatThreadedMessagesComponent is a wrapper component for messageList, messageBubble, messageComposer  component.
*
* @version 1.0.0
* @author CometChatTeam
* @copyright © 2022 CometChat Inc.
*
*/
@Component({
  selector: "cometchat-threaded-messages",
  templateUrl: "./cometchat-threaded-messages.component.html",
  styleUrls: ["./cometchat-threaded-messages.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CometChatThreadedMessagesComponent implements OnInit, OnChanges {
  @ViewChild("messageComposerRef", { static: false }) messageComposerRef!: CometChatMessageComposerComponent;
  @ViewChild("messageListRef", { static: false }) messageListRef!: CometChatMessageListComponent;
  @Input() onClose!: (() => void) | null;
  @Input() onError!: ((error:any) => void) | null;

  @Input() parentMessage!:any;
  @Input() title:string = localize("THREAD");
  @Input() closeIconURL:string = "assets/close2x.svg";
  @Input() bubbleView!:TemplateRef<any>;
  @Input() messageActionView!:TemplateRef<any>;
  @Input() messageListConfiguration: MessageListConfiguration = new MessageListConfiguration({});
  @Input() messageComposerConfiguration: MessageComposerConfiguration = new MessageComposerConfiguration({});
  @Input() threadedMessagesStyle: ThreadedMessagesStyle = {
    width: "100%",
    height: "100%",
    background: "white",
    borderRadius: "none",
    border: "1px solid rgba(20, 20, 20, 0.1)",
    titleColor: "rgba(20, 20, 20)",
    titleFont: "700 22px Inter",
    closeIconTint: "#3399FF"
  };
  user!: CometChat.User;
  group!: CometChat.Group;
  loggedInUser!: CometChat.User | null;
  public limit:number = 30;
  requestBuilder!:CometChat.MessagesRequestBuilder;
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
  actionButtonStyle:any  = {
    height:"100%",
    width:"100%",
    border:"none",
    borderTop:"1px solid #e1e1e1",
    borderBottom:"1px solid #e1e1e1",
    borderRadius:"0",
    background:"transparent",
    buttonTextFont:"500 15px Inter",
    buttonTextColor:"black",
    padding:"8px"
  }


  buttonStyle:any = {
    height:"24px",
    width:"24px",
    border:"none",
    borderRadius:"0",
    background:"transparent",
    buttonIconTint:"#7dbfff"
  }
  titleStyle:any = {
 textFont:"700 22px Inter",
 textColor:"black",
    background:"transparent",
  }
  ccMessageSent!: Subscription;
  ccMessageEdited!: Subscription;
  ccMessageDeleted!: Subscription;
  ccMessageRead!: Subscription;
  public msgListenerId = "message_"+ new Date().getTime();
  constructor( private ref: ChangeDetectorRef,private themeService:CometChatThemeService) { }
  ngOnInit() {
    this.requestBuilder = new CometChat.MessagesRequestBuilder()
    .setCategories(ChatConfigurator.getDataSource().getAllMessageCategories())
    .setTypes(ChatConfigurator.getDataSource().getAllMessageTypes())
    .hideReplies(true)
    .setLimit(this.limit)
    .setParentMessageId(this.parentMessage!.getId())
    this.addMessageEventListeners()
    CometChat.getLoggedinUser().then((user) => {
      this.loggedInUser = user;
      if (this.parentMessage?.getSender().getUid() === this.loggedInUser?.getUid()) {
        if (this.parentMessage?.getReceiverType() === CometChat.RECEIVER_TYPE.USER) {
          this.user = this.parentMessage!.getReceiver() as CometChat.User;
        } else {
          this.group = this.parentMessage!.getReceiver() as CometChat.Group;
        }
        this.ref.detectChanges();
      } else if (this.parentMessage?.getReceiverType() === CometChat.RECEIVER_TYPE.USER) {
        this.user = this.parentMessage?.getSender();
        this.ref.detectChanges();
      }
      else if(this.parentMessage?.getReceiverType() === CometChat.RECEIVER_TYPE.GROUP){
        this.group = this.parentMessage?.getReceiver();
        this.ref.detectChanges()
      }

    }).catch((error:CometChat.CometChatException)=>{
      if(this.onError){
        this.onError(error)
      }
    })
    this.setTheme();
    this.subscribeToEvents()
  }
  ngOnChanges(change: SimpleChanges) {
  }
  ngOnDestroy(): void {
    this.unsubscribeToEvents()
    try {
      //Removing Message Listeners
      CometChat.removeMessageListener(this.msgListenerId);
    } catch (error:any) {
       if(this.onError){
this.onError(error);
}
    }
  }
  updateMessage(message:CometChat.BaseMessage){
    if(this.parentMessage?.getId() == message.getId()){
      this.parentMessage = message;
      this.ref.detectChanges()
    }
  }
  updateReceipt(messageReceipt:CometChat.MessageReceipt){
    if(Number(messageReceipt?.getMessageId()) == this.parentMessage?.getId()){
      if(messageReceipt.getReadAt()){
        this.parentMessage.setReadAt(messageReceipt.getReadAt());
      }
      else if(messageReceipt.getDeliveredAt()){
        this.parentMessage.setDeliveredAt(messageReceipt.getDeliveredAt());

      }
      this.ref.detectChanges()
    }

  }
  addMessageEventListeners() {
    try {
      CometChat.addMessageListener(
        this.msgListenerId,
        new CometChat.MessageListener({
          onMessagesDelivered: (messageReceipt: CometChat.MessageReceipt) => {
            this.updateReceipt( messageReceipt);
          },
          onMessagesRead: (messageReceipt: CometChat.MessageReceipt) => {
            this.updateReceipt( messageReceipt);
          },
          onMessageDeleted: (deletedMessage: CometChat.BaseMessage) => {
            this.updateMessage(deletedMessage);

          },
          onMessageEdited: (editedMessage: CometChat.BaseMessage) => {
            this.updateMessage( editedMessage);
          },
        })
      );
    } catch (error: any) {
      if(this.onError){
    this.onError(error);
}
    }
  }
  getThreadCount() {
    const replyCount = this.parentMessage?.getReplyCount() || 0;
    const suffix = replyCount === 1 ? localize("REPLY") : localize("REPLIES");
    return `${replyCount} ${suffix}`;
  }
  subscribeToEvents(){
    this.ccMessageSent = CometChatMessageEvents.ccMessageSent.subscribe(({status, message}: IMessages) => {
      if(status === MessageStatus.success && message?.getParentMessageId() === this.parentMessage?.getId()){
        this.ref.detectChanges();
      }
    })
    this.ccMessageEdited = CometChatMessageEvents.ccMessageEdited.subscribe(({status, message}: IMessages) => {
      if(status === MessageStatus.success && message?.getId() === this.parentMessage?.getId()){
        this.ref.detectChanges()
      }
    })
    this.ccMessageDeleted= CometChatMessageEvents.ccMessageDeleted.subscribe((message:CometChat.BaseMessage) => {
      if(message?.getId() === this.parentMessage?.getId()){
        this.ref.detectChanges()
      }
    })
    this.ccMessageRead= CometChatMessageEvents.ccMessageRead.subscribe((message:CometChat.BaseMessage) => {
      if(message?.getId() === this.parentMessage?.getId()){
        this.ref.detectChanges()
      }
    })
  }

  unsubscribeToEvents(){
    this.ccMessageDeleted?.unsubscribe()
    this.ccMessageEdited?.unsubscribe()
    this.ccMessageRead?.unsubscribe()
    this.ccMessageSent?.unsubscribe()
  }
  closeView(){
    if(this.onClose){
      this.onClose()
    }
  }

  setThreadedMessagesStyle(){
    let defaultStyle:ThreadedMessagesStyle = new ThreadedMessagesStyle({
      width: "100%",
      height: "100%",
      background: this.themeService.theme.palette.getBackground(),
      borderRadius: "none",
      border: "none",
      titleColor: this.themeService.theme.palette.getAccent(),
      titleFont: fontHelper(this.themeService.theme.typography.title1),
      closeIconTint: this.themeService.theme.palette.getPrimary()
    })
    this.threadedMessagesStyle = {
      ...defaultStyle,
      ...this.threadedMessagesStyle
    }
  }
  setTheme() {
    this.setThreadedMessagesStyle()
    this.buttonStyle.buttonIconTint = this.threadedMessagesStyle.closeIconTint || this.themeService.theme.palette.getPrimary();
    this.actionButtonStyle.background = this.themeService.theme.palette.getBackground();
    this.actionButtonStyle.buttonTextFont = fontHelper(this.themeService.theme.typography.subtitle1);
    this.actionButtonStyle.buttonTextColor = this.themeService.theme.palette.getAccent600();
    this.titleStyle = {
      textFont : this.threadedMessagesStyle.titleFont || fontHelper(this.themeService.theme.typography.title1),
      textColor:this.threadedMessagesStyle.titleColor || this.themeService.theme.palette.getAccent(),
      background:"transparent"
    };
    this.ref.detectChanges()
  }
  wrapperStyle() {
    return {
      background: this.threadedMessagesStyle.background || this.themeService.theme.palette.getBackground(),
      height: this.threadedMessagesStyle.height,
      width: this.threadedMessagesStyle.width,
      border: this.threadedMessagesStyle.border,
      borderRadius: this.threadedMessagesStyle.borderRadius
    }
  }
}
