import { Component, OnInit, ViewChild, Input, ChangeDetectionStrategy, OnChanges, SimpleChanges, ChangeDetectorRef, ElementRef } from "@angular/core";
import { CometChat } from "@cometchat-pro/chat";
import { CometChatMessagesComponent } from "../../CometChatMessages/cometchat-messages/cometchat-messages.component";
import { CometChatConversationsComponent } from "../../CometChatConversations/cometchat-conversations/cometchat-conversations.component";
import {WithMessagesStyle, MessagesConfiguration,ConversationsConfiguration} from 'uikit-utils-lerna'
import {CometChatTheme, fontHelper, localize,CometChatOption, CometChatGroupEvents, CometChatUIKitConstants,IGroupLeft, IGroupMemberAdded, IGroupMemberKickedBanned, IGroupMemberScopeChanged,IMessages, CometChatUserEvents, CometChatMessageEvents, CometChatConversationEvents, IGroupMemberJoined, IOwnershipChanged} from 'uikit-resources-lerna'

import 'my-cstom-package-lit'
import { Subscription } from "rxjs";
import { CometChatThemeService } from "../../CometChatTheme.service";
  /**
 *
 * CometChatConversationsWithMessagesComponent is a wrapper component for CometChatMessagesComponent and CometChatConversations component to show chats and messages in one screen
 *
 * @version 1.0.0
 * @author CometChatTeam
 * @copyright © 2022 CometChat Inc.
 *
 */
@Component({
  selector: "cometchat-conversations-with-messages",
  templateUrl: "./cometchat-conversations-with-messages.component.html",
  styleUrls: ["./cometchat-conversations-with-messages.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CometChatConversationsWithMessagesComponent implements OnInit, OnChanges {
  // taking reference of conversationComponent and MessagesComponent
  @ViewChild("conversationRef", { static: false }) conversationRef!: CometChatConversationsComponent;
  @ViewChild("messagesRef", { static: false }) messageListRef!: CometChatMessagesComponent;
  @Input() user!: CometChat.User | null;
  @Input() group!: CometChat.Group | null;
  @Input() isMobileView: boolean = false;
  @Input() messageText: string = localize("NO_CHATS_SELECTED");
  @Input() conversationsWithMessagesStyle: WithMessagesStyle = {};
  @Input() messagesConfiguration: MessagesConfiguration = new MessagesConfiguration({});
  @Input() conversationConfiguration: ConversationsConfiguration = new ConversationsConfiguration({});
  @Input() onError:((error:any)=>void ) | null= (error:any)=>{
    console.log(error)
  }
   theme: CometChatTheme = new CometChatTheme({});
    /**
     * Properties for internal use
     */
  public loggedInUser!: CometChat.User | null;
  public activeConversation!: CometChat.Conversation | null;
  labelStyle:any = {
    background:"transparent",
    textFont:"700 22px Inter",
    textColor:"rgba(20, 20, 20, 0.33)"
  }
  public hideSearch:boolean = true;
     /**
     * Events
     */
  ccGroupMemberAdded!:Subscription;
  ccGroupLeft!:Subscription;
  ccGroupMemberJoined!:Subscription;
  ccGroupMemberKicked!:Subscription;
  ccGroupMemberBanned!:Subscription;
  ccOwnershipChanged!:Subscription;
  ccGroupDeleted!:Subscription;

  public ccConversationDeleted!:Subscription;

  constructor(private elementRef: ElementRef,private ref: ChangeDetectorRef,private themeService:CometChatThemeService) {
   }
  ngOnChanges(changes: SimpleChanges): void {

  if(changes["isMobileView"]){
    if (this.isMobileView) {

      this.messagesConfiguration.messageHeaderConfiguration.hideBackButton = false;
      this.messagesConfiguration.messageHeaderConfiguration = {...this.messagesConfiguration.messageHeaderConfiguration}
      this.messagesConfiguration = { ...this.messagesConfiguration }

    }
    else if (!this.isMobileView) {
      this.messagesConfiguration.messageHeaderConfiguration.hideBackButton = true;
      this.messagesConfiguration.messageHeaderConfiguration = {...this.messagesConfiguration.messageHeaderConfiguration}
      this.messagesConfiguration = { ...this.messagesConfiguration }
    }
    this.updateBackdropHeight()
  }
   if(changes["user"] || changes["group"]){
    this.setActiveChat();
   }
  }

  onBack = ()=>{
    this.user = null
    this.group = null
    this.activeConversation = null
  }
  setWithMessagesStyle(){
    let defaultStyle:WithMessagesStyle = new WithMessagesStyle({
      width: "100%",
      height: "100%",
      background: this.themeService.theme.palette.getBackground(),
      borderRadius: "none",
      border: "none",
      messageTextColor: this.themeService.theme.palette.getAccent600(),
      messageTextFont: fontHelper(this.themeService.theme.typography.title1),
    })
    this.conversationsWithMessagesStyle = {
      ...defaultStyle,
      ...this.conversationsWithMessagesStyle
    }
    this.labelStyle.textFont = this.conversationsWithMessagesStyle.messageTextFont
    this.labelStyle.textColor = this.conversationsWithMessagesStyle.messageTextColor
  }
  public onItemClick: ((conversation:CometChat.Conversation)=>void) = (conversation:CometChat.Conversation)=>{
    this.activeConversation = conversation
    if (conversation.getConversationType() && conversation.getConversationType() == CometChatUIKitConstants.MessageReceiverType.user) {
      this.group = null
      this.user = conversation.getConversationWith() as CometChat.User;
      this.ref.detectChanges()
    }
    else if (conversation.getConversationType() && conversation.getConversationType() == CometChatUIKitConstants.MessageReceiverType.group) {
      this.user = null
      this.group = conversation.getConversationWith() as CometChat.Group
      this.ref.detectChanges()
    }
  };
  ngAfterViewInit() {
this.updateBackdropHeight()
  }
  updateBackdropHeight(){
    const divHeight = this.elementRef.nativeElement.offsetHeight;
    const divWidth = this.elementRef.nativeElement.offsetWidth;
    let backdropStyle =  {
      height:divHeight + "px",
      width:divWidth + "px",
      background:"rgba(0, 0, 0, 0.5)"
    }
    this.messagesConfiguration.messageListConfiguration.backdropStyle = backdropStyle
    this.conversationConfiguration.backdropStyle = backdropStyle
    this.messagesConfiguration.detailsConfiguration.backdropStyle = backdropStyle
    this.messagesConfiguration.messageComposerConfiguration.backdropStyle = backdropStyle
    this.messagesConfiguration.detailsConfiguration.groupMembersConfiguration.backdropStyle = backdropStyle
    this.ref.detectChanges()
  }
  setActiveChat(){
    let type:string = this.user ? CometChatUIKitConstants.MessageReceiverType.user : CometChatUIKitConstants.MessageReceiverType.group
    this.activeConversation = null
    let conversationWith:string = this.user?.getUid()! || this.group?.getGuid()!
    CometChat.getConversation(conversationWith,type).then((conversation:CometChat.Conversation)=>{
      this.activeConversation = conversation
      this.ref.detectChanges()
    })
    .catch((error:any)=>{
      if(this.onError){
        this.onError(error)
      }
    })
  }
  ngOnInit() {
    this.setWithMessagesStyle()
    if(!this.messagesConfiguration.messageHeaderConfiguration.onBack){
      this.messagesConfiguration.messageHeaderConfiguration.onBack = this.onBack
    }
    this.subscribeToEvents();
      CometChat.getLoggedinUser()
        .then((user:CometChat.User | null) => {
          this.loggedInUser = user;
        })
        .catch((error:any) => {
          if(this.onError){
            this.onError(error)
          }
        });

  }
  ngOnDestroy() {
    this.unsubscribeToEvents();
  }
  // subscribe to global events
  subscribeToEvents() {
    this.ccConversationDeleted = CometChatConversationEvents.ccConversationDeleted.subscribe((conversation: CometChat.Conversation) => {
      this.removeActiveChatList(conversation) //to make m messages section empty after deleting conversation from conversationlist
    })
    this.ccGroupDeleted = CometChatGroupEvents.ccGroupDeleted.subscribe((group:CometChat.Group) => {
       if(this.group && group.getGuid() == this.group.getGuid()){
         this.group = null;
         this.activeConversation = null;
         this.ref.detectChanges()
       }
    })
    this.ccGroupMemberAdded = CometChatGroupEvents.ccGroupMemberAdded.subscribe((item: IGroupMemberAdded) => {
          if(this.group && this.group.getGuid() == item?.userAddedIn!.getGuid()){
            this.group == item?.userAddedIn;
            this.ref.detectChanges()
          }
    })
    this.ccGroupMemberBanned = CometChatGroupEvents.ccGroupMemberBanned.subscribe((item: IGroupMemberKickedBanned) => {
      if(this.group && this.group.getGuid() == item?.kickedFrom!.getGuid()){
        this.group == item?.kickedFrom;
        this.ref.detectChanges()
      }
    })
    this.ccGroupMemberJoined = CometChatGroupEvents.ccGroupMemberJoined.subscribe((item: IGroupMemberJoined) => {
      if(this.group && this.group.getGuid() == item?.joinedGroup!.getGuid()){
        this.group == item?.joinedGroup;
        this.ref.detectChanges()
      }
    })
    this.ccGroupMemberKicked = CometChatGroupEvents.ccGroupMemberKicked.subscribe((item: IGroupMemberKickedBanned) => {
      if(this.group && this.group.getGuid() == item?.kickedFrom!.getGuid()){
        this.group == item?.kickedFrom;
        this.ref.detectChanges()
      }
    })
    this.ccOwnershipChanged = CometChatGroupEvents.ccOwnershipChanged.subscribe((item: IOwnershipChanged) => {
      if(this.group && this.group.getGuid() == item?.group!.getGuid()){
        this.group == item?.group;
        this.activeConversation?.setConversationWith(this.group)
        this.ref.detectChanges();
      }
    })
    this.ccGroupLeft = CometChatGroupEvents.ccGroupLeft.subscribe((item: IGroupLeft) => {
      if(this.group && this.group.getGuid() == item?.leftGroup!.getGuid() && this.loggedInUser?.getUid() == item?.userLeft?.getUid()){
this.group == null
this.activeConversation = null
      }
    })
  }
  // unsubscribe to subscribed events.
  unsubscribeToEvents() {
    this.ccConversationDeleted?.unsubscribe();
    this.ccGroupDeleted?.unsubscribe();
    this.ccGroupMemberAdded?.unsubscribe();
    this.ccGroupMemberBanned?.unsubscribe();
    this.ccGroupMemberJoined?.unsubscribe();
    this.ccGroupMemberKicked?.unsubscribe();
    this.ccOwnershipChanged?.unsubscribe();
    this.ccGroupLeft?.unsubscribe();
  }
  /**
   * remove active chat screen after deleting the conversation.
   * @param  {CometChat.Conversation} conversation
   */
   removeActiveChatList(conversation: CometChat.Conversation) {
    const conversationType = conversation.getConversationType();
    const conversationWith = conversation.getConversationWith();
    if (conversationType === CometChatUIKitConstants.MessageReceiverType.user && this.user && this.user.getUid() === (conversationWith as CometChat.User).getUid()) {
      this.user = null;
      this.ref.detectChanges();
    } else if (conversationType === CometChatUIKitConstants.MessageReceiverType.group && this.group && this.group.getGuid() === (conversationWith as CometChat.Group).getGuid()) {
      this.group = null;
      this.ref.detectChanges();
    } else {
      return;
    }
  }
  emptyMessageStyle = ()=>{
    return {
      background: this.conversationsWithMessagesStyle.background || this.themeService.theme.palette.getBackground(),
      height:this.conversationsWithMessagesStyle.height,
      width:`calc(${this.conversationsWithMessagesStyle.width} - 280px)`,
      border:this.conversationsWithMessagesStyle.border,
      borderRadius:this.conversationsWithMessagesStyle.borderRadius,
    }
  }
  chatsWrapperStyles =  () => {
    return {
      height: this.conversationsWithMessagesStyle.height,
      width: this.conversationsWithMessagesStyle.width,
      border: this.conversationsWithMessagesStyle.border,
      borderRadius: this.conversationsWithMessagesStyle.borderRadius,
      background: this.conversationsWithMessagesStyle.background || this.themeService.theme.palette.getBackground(),
    }
  }
}
