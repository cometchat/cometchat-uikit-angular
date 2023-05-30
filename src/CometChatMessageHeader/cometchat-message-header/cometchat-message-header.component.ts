import { Component, OnInit, Input, ChangeDetectorRef, ChangeDetectionStrategy, TemplateRef, OnChanges, SimpleChanges } from '@angular/core';
import { CometChat } from '@cometchat-pro/chat';
import {ListItemStyle,AvatarStyle, BaseStyle} from 'my-cstom-package-lit'
import { Subscription } from 'rxjs';
import { CometChatTheme, CometChatGroupEvents, IGroupMemberAdded, IGroupMemberKickedBanned, IGroupMemberJoined, IOwnershipChanged, IGroupLeft, fontHelper, localize, CometChatUIKitConstants } from 'uikit-resources-lerna';
import {  MessageHeaderStyle } from 'uikit-utils-lerna';
import { CometChatThemeService } from '../../CometChatTheme.service';
/**
*
* CometChatMessageHeader is a used to render listitem component.
*
* @version 1.0.0
* @author CometChatTeam
* @copyright © 2022 CometChat Inc.
*
*/
@Component({
  selector: 'cometchat-message-header',
  templateUrl: './cometchat-message-header.component.html',
  styleUrls: ['./cometchat-message-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CometChatMessageHeaderComponent implements OnInit,OnChanges {
  @Input() avatarStyle: AvatarStyle = {
    borderRadius: "16px",
    width: "28px",
    height: "28px",
    border: "none",

  }
  @Input() statusIndicatorStyle: BaseStyle = {
    borderRadius: "16px",
    width: "10px",
    height: "10px",
    border: "none",
  }
  @Input() messageHeaderStyle: MessageHeaderStyle = {
    width: "100%",
    height: "100%",
  }
  @Input() listItemStyle: ListItemStyle = {
    width: "",
    height: "100%",
    border: "none",
    borderRadius: "2px",
    separatorColor: "",
    activeBackground: "transparent",
    hoverBackground: "transparent"
  }
  @Input() subtitleView: any;
  @Input() disableUsersPresence: boolean = false;
  @Input() disableTyping: boolean = false;
  @Input() protectedGroupIcon: string = "assets/Locked.svg";
  @Input() privateGroupIcon: string ="assets/Private.svg";
  @Input() menu: any;
  @Input() user!: CometChat.User;
  @Input() group!: CometChat.Group;
  @Input() backButtonIconURL: string = "assets/backbutton.svg";
  @Input() hideBackButton: boolean = false;
  @Input() listItemView!: TemplateRef<any>;
  @Input() onError:(error:any)=>void = (error:any)=>{
    console.log(error)
  }
  @Input() onBack:()=>void = ()=>{}
  msgListenerId = "message_"+ new Date().getTime();
  public groupsListenerId: string = "groupsList_" + new Date().getTime();
  userListenerId = "userlist_" + new Date().getTime();
  public subtitleText:string = "";
  public loggedInUser!:CometChat.User;
  public isTyping:boolean = false;
  theme:CometChatTheme = new CometChatTheme({})
  ccGroupMemberAdded!:Subscription;
  ccGroupLeft!:Subscription;
  ccGroupMemberJoined!:Subscription;
  ccGroupMemberKicked!:Subscription;
  ccGroupMemberBanned!:Subscription;
  ccOwnershipChanged!:Subscription;
  constructor(private ref:ChangeDetectorRef,private themeService:CometChatThemeService) {
  }
  ngOnChanges(changes: SimpleChanges): void {
    if(changes["user"] || changes["group"]){
      this.removeListener()
      if(!this.loggedInUser){
        CometChat.getLoggedinUser().then((user:CometChat.User | null)=>{
          this.loggedInUser = user as CometChat.User;
          this.attachListeners()
          this.updateSubtitle()
        }).catch((error:CometChat.CometChatException)=>{
          if(this.onError){
            this.onError(error)
          }
        })
      }
      else{
        this.attachListeners()
        this.updateSubtitle()
      }

    }
  }
  ngOnInit(): void {
    this.setListItemStyle()
    this.setAvatarStyle()
    this.setStatusStyle()
    this.setHeadersStyle()
    this.subscribeToEvents();
    this.backButtonStyle.buttonIconTint = this.messageHeaderStyle?.backButtonIconTint;
    this.statusColor.online = this.messageHeaderStyle.onlineStatusColor

  }
    // subscribe to global events
    subscribeToEvents() {
      this.ccGroupMemberAdded = CometChatGroupEvents.ccGroupMemberAdded.subscribe((item: IGroupMemberAdded) => {
            if(this.group && this.group.getGuid() == item?.userAddedIn!.getGuid()){
              this.group == item?.userAddedIn;
              this.ref.detectChanges()
              this.updateSubtitle()
            }
      })
      this.ccGroupMemberBanned = CometChatGroupEvents.ccGroupMemberBanned.subscribe((item: IGroupMemberKickedBanned) => {
        if(this.group && this.group.getGuid() == item?.kickedFrom!.getGuid()){
          this.group == item?.kickedFrom;
          this.ref.detectChanges()
          this.updateSubtitle()
        }
      })
      this.ccGroupMemberJoined = CometChatGroupEvents.ccGroupMemberJoined.subscribe((item: IGroupMemberJoined) => {
        if(this.group && this.group.getGuid() == item?.joinedGroup!.getGuid()){
          this.group == item?.joinedGroup;
          this.ref.detectChanges()
          this.updateSubtitle()
        }
      })
      this.ccGroupMemberKicked = CometChatGroupEvents.ccGroupMemberKicked.subscribe((item: IGroupMemberKickedBanned) => {
        if(this.group && this.group.getGuid() == item?.kickedFrom!.getGuid()){
          this.group == item?.kickedFrom;
          this.ref.detectChanges()
          this.updateSubtitle()
        }
      })
      this.ccOwnershipChanged = CometChatGroupEvents.ccOwnershipChanged.subscribe((item: IOwnershipChanged) => {
        if(this.group && this.group.getGuid() == item?.group!.getGuid()){
          this.group == item?.group;
          this.ref.detectChanges()
          this.updateSubtitle();
        }
      })
      this.ccGroupLeft = CometChatGroupEvents.ccGroupLeft.subscribe((item: IGroupLeft) => {
        if(this.group && this.group.getGuid() == item?.leftGroup!.getGuid() && this.loggedInUser?.getUid() == item?.userLeft?.getUid()){
          this.group == item?.leftGroup;
          this.ref.detectChanges()
          this.updateSubtitle()
        }
      })
    }
    // unsubscribe to subscribed events.
    unsubscribeToEvents() {
      this.ccGroupMemberAdded?.unsubscribe();
      this.ccGroupMemberBanned?.unsubscribe();
      this.ccGroupMemberJoined?.unsubscribe();
      this.ccGroupMemberKicked?.unsubscribe();
      this.ccOwnershipChanged?.unsubscribe();
      this.ccGroupLeft?.unsubscribe();
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
    this.listItemStyle = {...defaultStyle,...this.listItemStyle}
  }
  setAvatarStyle(){
    let defaultStyle:AvatarStyle = new AvatarStyle({
      borderRadius: "24px",
      width: "36px",
      height: "36px",
      border: "none",
      backgroundColor: this.themeService.theme.palette.getAccent700(),
      nameTextColor: this.themeService.theme.palette.getAccent900(),
      backgroundSize: "cover",
      nameTextFont: fontHelper(this.themeService.theme.typography.subtitle1),
      outerViewBorder: "",
      outerViewBorderSpacing: "",
    })
    this.avatarStyle = {...defaultStyle,...this.avatarStyle}
  }
  setStatusStyle(){
    let defaultStyle:BaseStyle = {
        height: "12px",
        width:"12px",
        border:"none",
        borderRadius:"24px",

    }
    this.statusIndicatorStyle = {...defaultStyle,...this.statusIndicatorStyle}
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
    this.messageHeaderStyle = {...defaultStyle,...this.messageHeaderStyle}
  }
  public statusColor: any = {
    online: "#00f300",
    private: "#00f300",
    password: "#F7A500",
    public: ""
  }
  backButtonStyle:any = {
    height:"24px",
    width:"24px",
    border:"none",
    borderRadius:"none",
    background:"transparent",
    buttonIconTint:"#3399FF"
  }
  checkStatusType = ()=> {
    return   this.user && !this.disableUsersPresence ? this.statusColor[this.user?.getStatus()] : this.statusColor[this.group?.getType()]
  }
  onBackClicked(){
    if(this.onBack){
      this.onBack()
    }
  }
  updateSubtitle() {
    const count = this.group?.getMembersCount();
    const membersText = localize(count > 1 ? "MEMBERS" : "MEMBER");
    if(this.user){
      this.subtitleText = this.disableUsersPresence ? "" : this.user.getStatus()
      this.ref.detectChanges();
    }
    else{
      this.subtitleText =  `${count} ${membersText}`;
      this.ref.detectChanges();
    }

  }
  getSubtitleView() {
    return this.subtitleView(this.user || this.group);
  }
  checkGroupType(): string {
    let image: string = "";
    if (this.group) {
      switch (this.group?.getType()) {
        case CometChatUIKitConstants.GroupTypes.password:
          image = this.protectedGroupIcon;
          break;
        case CometChatUIKitConstants.GroupTypes.private:
          image = this.privateGroupIcon;
          break;
        default:
          image = ""
          break;
      }
    }
    return image
  }
  updateUserStatus(user:CometChat.User){

    if (this.user && this.user.getUid() && this.user.getUid() === user.getUid()) {
      this.user.setStatus(user.getStatus());
      this.updateSubtitle()
    }
    // this.ref.detectChanges();
  }
  attachListeners() {
    try {
      if(!this.disableUsersPresence){
        CometChat.addUserListener(
          this.userListenerId,
          new CometChat.UserListener({
            onUserOnline: (onlineUser: CometChat.User) => {
              /* when someuser/friend comes online, user will be received here */
              this.updateUserStatus(onlineUser);
            },
            onUserOffline: (offlineUser: CometChat.User) => {
              /* when someuser/friend went offline, user will be received here */
              this.updateUserStatus( offlineUser);
            },
          })
        );
      }
    if(!this.disableTyping){
      CometChat.addMessageListener(
        this.msgListenerId,
        new CometChat.MessageListener({
          onTypingStarted: (typingIndicator: CometChat.TypingIndicator) => {
            this.isTyping = true;
            this.setTypingIndicatorText(typingIndicator)
          },
          onTypingEnded: (typingIndicator: CometChat.TypingIndicator) => {
            this.isTyping = false;
            this.updateSubtitle()
          },
        })
      );
    }
    CometChat.addGroupListener(
      this.groupsListenerId,
      new CometChat.GroupListener({
        onGroupMemberScopeChanged: (
          message: CometChat.Action,
          changedUser: CometChat.User,
          newScope: CometChat.GroupMemberScope,
          oldScope: CometChat.GroupMemberScope,
          changedGroup: CometChat.Group
        ) => {
          if (changedUser.getUid() == this.loggedInUser?.getUid()) {
            changedGroup.setScope(newScope)
          }
         this.group = changedGroup
         this.ref.detectChanges()
         this.updateSubtitle()
        },
        onGroupMemberKicked: (message: CometChat.Action, kickedUser: CometChat.User, kickedBy: CometChat.User, kickedFrom: CometChat.Group) => {
          if (kickedUser.getUid() == this.loggedInUser?.getUid()) {
            kickedFrom.setHasJoined(false)
          }
          this.group = kickedFrom
         this.ref.detectChanges()
             this.updateSubtitle()
        },
        onMemberAddedToGroup: (
          message: CometChat.Action,
          userAdded: CometChat.User,
          userAddedBy: CometChat.User,
          userAddedIn: CometChat.Group
        ) => {
          if (userAdded.getUid() == this.loggedInUser?.getUid()) {
            userAddedIn.setHasJoined(true)
          }
          this.group = userAddedIn
          this.ref.detectChanges()
              this.updateSubtitle()
        },
        onGroupMemberLeft: (message: CometChat.Action, leavingUser: CometChat.User, group: CometChat.Group) => {
          if (leavingUser.getUid() == this.loggedInUser?.getUid()) {
            group.setHasJoined(false)
          }
         this.group = group
         this.ref.detectChanges()
             this.updateSubtitle()
        },
        onGroupMemberJoined: (message: CometChat.Action, joinedUser: CometChat.User, joinedGroup: CometChat.Group) => {
          if (joinedUser.getUid() == this.loggedInUser?.getUid()) {
            joinedGroup.setHasJoined(true)
          }
          this.group = joinedGroup
          this.ref.detectChanges()
              this.updateSubtitle()
        },
      })
    );
    } catch (error:any) {
console.log(error)
    }
  }
  removeListener(){
    CometChat.removeMessageListener(this.msgListenerId)
    CometChat.removeUserListener(this.userListenerId)
  }
  ngOnDestroy(){
    this.removeListener()
    this.unsubscribeToEvents()
  }
  setTypingIndicatorText = (typing: CometChat.TypingIndicator) => {
    const sender = typing.getSender();
    const receiverId = typing.getReceiverId();
    const loggedInUser = this.loggedInUser;

    if (this.user && sender.getUid() === this.user?.getUid() && loggedInUser?.getUid() === receiverId) {
      this.subtitleText = localize("IS_TYPING");
      this.ref.detectChanges();
    } else if (this.group && this.group.getGuid() === receiverId) {
      this.subtitleText = `${sender.getName()} ${localize("IS_TYPING")}`;
      this.ref.detectChanges();
    }
  }

  headerStyle = () => {
      return {
        width: this.messageHeaderStyle.width,
        height: this.messageHeaderStyle.height,
        border: this.messageHeaderStyle.border,
        borderRadius:this.messageHeaderStyle.borderRadius,
        background: this.messageHeaderStyle.background ,
      }
    }
  subtitleStyle = ()=>{
 if(this.user && this.user.getStatus() == CometChatUIKitConstants.userStatusType.online){
  return{
    textFont:  this.messageHeaderStyle.subtitleTextFont,
    textColor:  this.themeService.theme.palette.getPrimary()
  }
 }
 else{
  return{
    textFont: this.isTyping ? this.messageHeaderStyle.typingIndicatorTextFont :   this.messageHeaderStyle.subtitleTextFont,
    textColor: this.isTyping ? this.messageHeaderStyle.typingIndicatorTextColor : this.messageHeaderStyle.subtitleTextColor
  }
 }
  }
}
