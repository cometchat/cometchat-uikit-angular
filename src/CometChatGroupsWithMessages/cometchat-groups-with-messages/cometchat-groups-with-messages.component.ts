import { Component, OnInit, ViewChild, Input, ChangeDetectionStrategy, OnChanges, SimpleChanges, ChangeDetectorRef, ElementRef } from "@angular/core";
import { CometChat } from "@cometchat-pro/chat";
import { CometChatMessagesComponent } from "../../CometChatMessages/cometchat-messages/cometchat-messages.component";
import { CometChatConversationsComponent } from "../../CometChatConversations/cometchat-conversations/cometchat-conversations.component";
import {WithMessagesStyle, MessagesConfiguration,GroupsConfiguration, CreateGroupConfiguration, JoinGroupConfiguration, MessageHeaderStyle} from 'uikit-utils-lerna'
import 'my-cstom-package-lit'
import { Subscription } from "rxjs";
import { CreateGroupStyle, JoinGroupStyle, ListItemStyle } from "my-cstom-package-lit";
import { CometChatThemeService } from "../../CometChatTheme.service";
import { localize, CometChatTheme, CometChatUIKitConstants, fontHelper, CometChatGroupEvents, IGroupMemberAdded, IGroupMemberKickedBanned, IGroupMemberJoined, IOwnershipChanged, IGroupLeft } from "uikit-resources-lerna";
  /**
 *
 * CometChatGroupsWithMessagesComponent is a wrapper component for CometChatMessagesComponent and CometChatConversations component to show chats and messages in one screen
 *
 * @version 1.0.0
 * @author CometChatTeam
 * @copyright © 2022 CometChat Inc.
 *
 */
@Component({
  selector: "cometchat-groups-with-messages",
  templateUrl: "./cometchat-groups-with-messages.component.html",
  styleUrls: ["./cometchat-groups-with-messages.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CometChatGroupsWithMessagesComponent implements OnInit, OnChanges {
  // taking reference of conversationComponent and MessagesComponent
  @ViewChild("groupRef", { static: false }) groupRef!: CometChatConversationsComponent;
  @ViewChild("messagesRef", { static: false }) messageListRef!: CometChatMessagesComponent;
  @Input() group!: CometChat.Group | null;
  @Input() isMobileView: boolean = false;
  @Input() hideCreateGroup:boolean = false;
  @Input() messageText: string = localize("NO_GROUPS_SELECTED");
  @Input() groupsWithMessagesStyle: WithMessagesStyle = {
    width: "100%",
    height: "100%",
    borderRadius: "none",
    border: "none",
  };
  @Input() messagesConfiguration: MessagesConfiguration = new MessagesConfiguration({});
  @Input() createGroupConfiguration: CreateGroupConfiguration = new CreateGroupConfiguration({});
  @Input() joinGroupConfiguration: JoinGroupConfiguration = new JoinGroupConfiguration({});
  @Input() groupsConfiguration: GroupsConfiguration = new GroupsConfiguration({});
  @Input() onError:((error:any)=>void ) | null= (error:any)=>{
    console.log(error)
  }
   theme: CometChatTheme = new CometChatTheme({});
   backdropStyle:any = {

   }
   createGroupStyle:CreateGroupStyle = {}
   joinGroupStyle:JoinGroupStyle = {}
   messageHeaderStyle:MessageHeaderStyle = {}
   listItemStyle:ListItemStyle = {}
    /**
     * Properties for internal use
     */
    createIconURL:string = "assets/create-button.svg"
  public loggedInUser!: CometChat.User | null;
  createGroupButtonStyle:any = {
    height:"24px",
    width:"24px",
    border:"none",
    borderRadius:'0',
    background:"transparent",
    buttonIconTint:"RGB(51, 153, 255)"
  }
  labelStyle:any = {
    background:"transparent",
    textFont:"700 22px Inter",
    textColor:"rgba(20, 20, 20, 0.33)"
  }
  public openCreateGroupPage:boolean = false;
  public openPasswordModal:boolean = false;
  public protectedGroup!:CometChat.Group | null;
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
  ccGroupCreated!:Subscription;
  constructor(private elementRef: ElementRef,private ref: ChangeDetectorRef,private themeService:CometChatThemeService) {
   }
  ngOnChanges(changes: SimpleChanges): void {
    if(changes["isMobileView"]){
      if (this.isMobileView) {

        this.messagesConfiguration.messageHeaderConfiguration.hideBackButton = false;
        this.messagesConfiguration.messageHeaderConfiguration = {...this.messagesConfiguration.messageHeaderConfiguration}
        this.messagesConfiguration = { ...this.messagesConfiguration }
        this.joinGroupConfiguration.messageHeaderConfiguration.hideBackButton = false;
      this.joinGroupConfiguration.messageHeaderConfiguration = {...this.joinGroupConfiguration.messageHeaderConfiguration}
      this.joinGroupConfiguration = { ...this.joinGroupConfiguration }
      }
      else if (!this.isMobileView) {
        this.messagesConfiguration.messageHeaderConfiguration.hideBackButton = true;
        this.messagesConfiguration.messageHeaderConfiguration = {...this.messagesConfiguration.messageHeaderConfiguration}
        this.messagesConfiguration = { ...this.messagesConfiguration }
        this.joinGroupConfiguration.messageHeaderConfiguration.hideBackButton = true;
        this.joinGroupConfiguration.messageHeaderConfiguration = {...this.joinGroupConfiguration.messageHeaderConfiguration}
        this.joinGroupConfiguration = { ...this.joinGroupConfiguration }
      }
      this.updateBackdropHeight()
    }
  }
  ngAfterViewInit() {
    this.updateBackdropHeight()
      }
  onBack = ()=>{
    this.group = null
  }
  openCreateGroup(){
    this.openCreateGroupPage = true
  }

  closeCreateGroup =()=>{
    this.openCreateGroupPage = false
    this.ref.detectChanges()
  }
  closeJoinGroup = ()=>{
    this.openPasswordModal = false
  }
   onItemClick: ((group:CometChat.Group)=>void) = (group:CometChat.Group)=>{
     this.openPasswordModal = false;
   if(group.getHasJoined()){
    this.group = group;
    this.ref.detectChanges();
    return;
   }
    if(group.getType() == CometChatUIKitConstants.GroupTypes.password){
      this.group = null;
      this.protectedGroup = group;
      this.openPasswordModal = true;
      this.ref.detectChanges();
      return;
    }
    CometChat.joinGroup(group).then(()=>{
        CometChatGroupEvents.ccGroupMemberJoined.next({
          joinedGroup:group,
          joinedUser:this.loggedInUser!
        })
      group.setHasJoined(true)
      this.ref.detectChanges()
      this.group = group;
      this.ref.detectChanges()
    })
    .catch((error:any)=>{
      if(this.onError){
        this.onError(error)
      }
    })
  };

  updateBackdropHeight(){
    const divHeight = this.elementRef.nativeElement.offsetHeight;
    const divWidth = this.elementRef.nativeElement.offsetWidth;
    let backdropStyle =  {
      height:divHeight + "px",
      width:divWidth + "px",
      background:"rgba(0, 0, 0, 0.5)"
    }
    this.backdropStyle = backdropStyle
    this.messagesConfiguration.messageListConfiguration.backdropStyle = backdropStyle
    this.messagesConfiguration.detailsConfiguration.backdropStyle = backdropStyle
    this.messagesConfiguration.messageComposerConfiguration.backdropStyle = backdropStyle
    this.messagesConfiguration.detailsConfiguration.groupMembersConfiguration.backdropStyle = backdropStyle
    this.ref.detectChanges()
  }
  ngOnInit() {
    this.setWithMessagesStyle()
    this.setCreateGroupStyles()
    this.setListItemStyle()
    this.setJoinGroupStyles()
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
    this.groupsWithMessagesStyle = {
      ...defaultStyle,
      ...this.groupsWithMessagesStyle
    }
    this.labelStyle.textFont = this.groupsWithMessagesStyle.messageTextFont
    this.labelStyle.textColor = this.groupsWithMessagesStyle.messageTextColor
  }
  setCreateGroupStyles = ()=>{
    let defaultStyle:CreateGroupStyle = new CreateGroupStyle({
      boxShadow: `${this.themeService.theme.palette.getAccent100()} 4px 16px 32px 4px`,
      groupTypeTextFont:  fontHelper(this.themeService.theme.typography.subtitle2),
      groupTypeBorder: `1px solid ${this.themeService.theme.palette.getAccent600()}`,
      groupTypeBorderRadius: "0",
      groupTypeTextColor:  this.themeService.theme.palette.getAccent(),
      groupTypeTextBackground: "transparent",
      groupTypeBackground: this.themeService.theme.palette.getAccent100(),
      groupTypeBoxShadow: "",
      activeGroupTypeTextFont: fontHelper(this.themeService.theme.typography.subtitle2),
      activeGroupTypeTextColor: this.themeService.theme.palette.getAccent(),
      activeGroupTypeBackground: this.themeService.theme.palette.getAccent900(),
      activeGroupTypeBoxShadow: `${this.themeService.theme.palette.getAccent200()} 0 3px 8px 0`,
      activeGroupTypeBorderRadius: "8px",
      activeGroupTypeBorder: "none",
      groupTypeTextBoxShadow: "none",
      groupTypeTextBorderRadius: "0",
      closeIconTint: this.themeService.theme.palette.getPrimary(),
      titleTextFont:  fontHelper(this.themeService.theme.typography.title1),
      titleTextColor:  this.themeService.theme.palette.getAccent(),
      errorTextFont:  fontHelper(this.themeService.theme.typography.subtitle1),
      errorTextBackground: this.themeService.theme.palette.getError(),
      errorTextBorderRadius: "8px",
      errorTextBorder: "none",
      errorTextColor:  this.themeService.theme.palette.getError(),
      nameInputPlaceholderTextFont: fontHelper(this.themeService.theme.typography.subtitle1),
      nameInputPlaceholderTextColor: this.themeService.theme.palette.getAccent600(),
      nameInputBackground: this.themeService.theme.palette.getAccent100(),
      nameInputTextFont: fontHelper(this.themeService.theme.typography.subtitle1),
      nameInputTextColor: this.themeService.theme.palette.getAccent(),
      nameInputBorder:  "none",
      nameInputBorderRadius:  "8px",
      nameInputBoxShadow: `${this.themeService.theme.palette.getAccent100()} 0 0 0 1px`,
      passwordInputPlaceholderTextFont: fontHelper(this.themeService.theme.typography.subtitle1),
      passwordInputPlaceholderTextColor: this.themeService.theme.palette.getAccent600(),
      passwordInputBackground: this.themeService.theme.palette.getAccent100(),
      passwordInputBorder:  "none",
      passwordInputBorderRadius:  "8px",
      passwordInputBoxShadow: `${this.themeService.theme.palette.getAccent100()} 0 0 0 1px`,
      passwordInputTextFont: fontHelper(this.themeService.theme.typography.subtitle1),
      passwordInputTextColor: this.themeService.theme.palette.getAccent(),
      createGroupButtonTextFont: fontHelper(this.themeService.theme.typography.text2),
      createGroupButtonTextColor: this.themeService.theme.palette.getAccent900("light"),
      createGroupButtonBackground: this.themeService.theme.palette.getPrimary(),
      createGroupButtonBorderRadius: "8px",
      createGroupButtonBorder: "none",
      height:"620px",
      width:"360px",
      borderRadius:"8px",
      background:this.themeService.theme.palette.getBackground()
    })
    this.createGroupStyle = {...defaultStyle,...this.createGroupConfiguration.createGroupStyle}

  }
  setJoinGroupStyles = ()=>{
    let defaultStyle:JoinGroupStyle = new JoinGroupStyle({
      boxShadow: `${this.themeService.theme.palette.getAccent100()} 0px 16px 32px 0px`,
      titleTextFont:  fontHelper(this.themeService.theme.typography.title1),
      titleTextColor:  this.themeService.theme.palette.getAccent(),
      passwordInputPlaceholderTextFont: fontHelper(this.themeService.theme.typography.subtitle1),
      passwordInputPlaceholderTextColor: this.themeService.theme.palette.getAccent600(),
      passwordInputBackground: this.themeService.theme.palette.getAccent100(),
      passwordInputBorder:  "none",
      passwordInputBorderRadius:  "8px",
      passwordInputBoxShadow: `${this.themeService.theme.palette.getAccent100()} 0 0 0 1px`,
      passwordInputTextFont: fontHelper(this.themeService.theme.typography.subtitle1),
      passwordInputTextColor: this.themeService.theme.palette.getAccent(),
      height:"100%",
      width:"100%",
joinButtonTextFont: fontHelper(this.themeService.theme.typography.subtitle1),
joinButtonTextColor: this.themeService.theme.palette.getAccent("dark"),
joinButtonBackground: this.themeService.theme.palette.getPrimary(),
joinButtonBorderRadius: "8px",
joinButtonBorder: "none",
background:this.themeService.theme.palette.getBackground()
    })
    this.joinGroupStyle = {...defaultStyle,...this.joinGroupConfiguration.joinGroupStyle}

  }
  setHeadersStyle(){
    let defaultStyle:MessageHeaderStyle = new MessageHeaderStyle({
      background:this.themeService.theme.palette.getBackground(),
      border:`none`,
      onlineStatusColor:this.themeService.theme.palette.getSuccess(),
      privateGroupIconBackground:this.themeService.theme.palette.getSuccess(),
      passwordGroupIconBackground:"RGB(247, 165, 0)",
      backButtonIconTint: this.themeService.theme.palette.getPrimary(),
      subtitleTextColor: this.themeService.theme.palette.getAccent600(),
      subtitleTextFont: fontHelper(this.themeService.theme.typography.subtitle2),
      typingIndicatorTextColor: this.themeService.theme.palette.getPrimary(),
      typingIndicatorTextFont: fontHelper(this.themeService.theme.typography.subtitle1),
    })
    this.messageHeaderStyle = {...defaultStyle,...this.joinGroupConfiguration.messageHeaderConfiguration.messageHeaderStyle}
  }
  setListItemStyle(){
    let defaultStyle:ListItemStyle = new ListItemStyle({
      height: "45px",
      width: "100%",
      background: this.themeService.theme.palette.getBackground(),
      activeBackground: "transparent",
      borderRadius: "0",
      titleFont: fontHelper(this.themeService.theme.typography.title2),
      titleColor: this.themeService.theme.palette.getAccent(),
      border: "none",
      separatorColor:"",
      hoverBackground:"transparent"
    })
    this.listItemStyle = {...defaultStyle,...this.joinGroupConfiguration.messageHeaderConfiguration.listItemStyle}
  }
  ngOnDestroy() {
    this.unsubscribeToEvents();
  }
  onGroupJoined = (event:any)=>{
    let group:CometChat.Group = event?.detail?.response
    this.openPasswordModal = false;
    this.protectedGroup = null;
    if(group){
      this.group = group
    }

  }
  updatedCreatedGroup(event:any){
    let group:CometChat.Group = event?.detail?.group
    if(group){
      this.group = group;
      this.openCreateGroupPage = false
      this.ref.detectChanges();
      CometChatGroupEvents.ccGroupCreated.next(group)
    }

  }
  // subscribe to global events
  subscribeToEvents() {
    this.ccGroupDeleted = CometChatGroupEvents.ccGroupDeleted.subscribe((group:CometChat.Group) => {
       if(this.group && group.getGuid() == this.group.getGuid()){
         this.group = null;
         this.ref.detectChanges()
       }
    })
    this.ccGroupCreated = CometChatGroupEvents.ccGroupCreated.subscribe((group:CometChat.Group) => {
      if(group){
        this.group = group;
        this.openCreateGroupPage = false
        this.ref.detectChanges();
      }
   })
    this.ccGroupMemberAdded = CometChatGroupEvents.ccGroupMemberAdded.subscribe((item: IGroupMemberAdded) => {
          if(this.group && this.group.getGuid() == item?.userAddedIn!.getGuid()){
            this.group = item?.userAddedIn;
            this.ref.detectChanges()
          }
    })
    this.ccGroupMemberBanned = CometChatGroupEvents.ccGroupMemberBanned.subscribe((item: IGroupMemberKickedBanned) => {
      if(this.group && this.group.getGuid() == item?.kickedFrom!.getGuid()){
        this.group = item?.kickedFrom;
        this.ref.detectChanges()
      }
    })
    this.ccGroupMemberJoined = CometChatGroupEvents.ccGroupMemberJoined.subscribe((item: IGroupMemberJoined) => {
      if(this.protectedGroup && this.protectedGroup.getGuid() == item?.joinedGroup!.getGuid()){
        this.openPasswordModal = false;
        this.protectedGroup = null;
        this.group = item?.joinedGroup;
        this.ref.detectChanges()
      }
    })
    this.ccGroupMemberKicked = CometChatGroupEvents.ccGroupMemberKicked.subscribe((item: IGroupMemberKickedBanned) => {
      if(this.group && this.group.getGuid() == item?.kickedFrom!.getGuid()){
        this.group = item?.kickedFrom;
        this.ref.detectChanges()
      }
    })
    this.ccOwnershipChanged = CometChatGroupEvents.ccOwnershipChanged.subscribe((item: IOwnershipChanged) => {
      if(this.group && this.group.getGuid() == item?.group!.getGuid()){
        this.group = item?.group;
        this.ref.detectChanges();
      }
    })
    this.ccGroupLeft = CometChatGroupEvents.ccGroupLeft.subscribe((item: IGroupLeft) => {
      if(this.group && this.group.getGuid() == item?.leftGroup!.getGuid() && this.loggedInUser?.getUid() == item?.userLeft?.getUid()){
        this.group = item?.leftGroup;
        this.ref.detectChanges()
      }
    })

  }
  // unsubscribe to subscribed events.
  unsubscribeToEvents() {
    this.ccGroupDeleted?.unsubscribe();
    this.ccGroupMemberAdded?.unsubscribe();
    this.ccGroupMemberBanned?.unsubscribe();
    this.ccGroupMemberJoined?.unsubscribe();
    this.ccGroupMemberKicked?.unsubscribe();
    this.ccOwnershipChanged?.unsubscribe();
    this.ccGroupLeft?.unsubscribe();
  }
  emptyMessageStyle = ()=>{
    return {
      background: this.groupsWithMessagesStyle.background || this.themeService.theme.palette.getBackground(),
      height:this.groupsWithMessagesStyle.height,
      width:`calc(${this.groupsWithMessagesStyle.width} - 280px)`,
      border:this.groupsWithMessagesStyle.border,
      borderRadius:this.groupsWithMessagesStyle.borderRadius,
    }
  }
  groupsWrapperStyles =  () => {
    return {
      height: this.groupsWithMessagesStyle.height,
      width: this.groupsWithMessagesStyle.width,
      border: this.groupsWithMessagesStyle.border,
      borderRadius: this.groupsWithMessagesStyle.borderRadius,
      background: this.groupsWithMessagesStyle.background || this.themeService.theme.palette.getBackground(),
    }
  }
}
