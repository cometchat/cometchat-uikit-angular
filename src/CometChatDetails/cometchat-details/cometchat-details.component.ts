import {
  Component,
  Input,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  TemplateRef,
  OnChanges,
  SimpleChanges,
} from "@angular/core";
import {  Subscription } from "rxjs";
import 'my-cstom-package-lit'
import {AvatarStyle, ChangeScopeStyle,ConfirmDialogStyle,ListItemStyle, } from  'my-cstom-package-lit'
import {  AddMembersConfiguration, AddMembersStyle, BannedMembersConfiguration, BannedMembersStyle,CometChatUIKitUtility,  DetailsStyle, DetailsUtils,  GroupMembersConfiguration, GroupMembersStyle, SelectionMode, TitleAlignment, TransferOwnershipConfiguration, TransferOwnershipStyle, UsersConfiguration, BaseStyle, } from "uikit-utils-lerna";
import {CometChatTheme, fontHelper, localize,CometChatOption, CometChatGroupEvents, CometChatUIKitConstants,IGroupLeft, IGroupMemberAdded, IGroupMemberKickedBanned, IGroupMemberScopeChanged,IMessages, CometChatUserEvents, CometChatMessageEvents, CometChatConversationEvents, IGroupMemberJoined, IOwnershipChanged, CometChatDetailsOption, CometChatDetailsTemplate} from 'uikit-resources-lerna'
import { CometChat } from "@cometchat-pro/chat";
import { CometChatThemeService } from "../../CometChatTheme.service";
/**
*
* CometChatDetailsComponent renders details of user or group.
*
* @version 1.0.0
* @author CometChatTeam
* @copyright © 2022 CometChat Inc.
*
*/
@Component({
  selector: "cometchat-details",
  templateUrl: "./cometchat-details.component.html",
  styleUrls: ["./cometchat-details.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CometChatDetailsComponent implements OnInit, OnChanges  {
  @Input() group!: CometChat.Group;
  @Input() user!: CometChat.User;
  @Input() title: string = localize("DETAILS");
  @Input() closeButtonIconURL: string = "assets/close2x.svg";
  @Input() hideProfile:boolean = false;
  @Input() subtitleView!: TemplateRef<any>;
  @Input() customProfileView!: TemplateRef<any>;
  @Input() data:CometChatDetailsTemplate[] = [];
  @Input() disableUsersPresence: boolean = false;
  @Input() privateGroupIcon:string ="assets/Private.svg";
  @Input() protectedGroupIcon:string = "assets/Locked.svg";
  @Input() onError:((error: any) => void) | null = (error:any)=>{
    console.log(error)
  }
  @Input() onClose!:()=>void;
  @Input() leaveButtonText: string = localize("TRANSFER_OWNERSHIP");
  @Input() cancelButtonText: string = localize("CANCEL");
  @Input() confirmDialogMessage: string = localize("TRANSFER_CONFIRM");
  @Input() addMembersConfiguration: AddMembersConfiguration = new AddMembersConfiguration({});
  @Input() bannedMembersConfiguration: BannedMembersConfiguration = new BannedMembersConfiguration({});
  @Input() groupMembersConfiguration: GroupMembersConfiguration = new GroupMembersConfiguration({});
  @Input() transferOwnershipConfiguration: TransferOwnershipConfiguration = new TransferOwnershipConfiguration({});
  @Input() leaveDialogStyle: ConfirmDialogStyle = {
    confirmButtonBackground: "RGB(51, 153, 255)",
    cancelButtonBackground: "RGBA(20, 20, 20, 0.06)",
    confirmButtonTextColor: "white",
    confirmButtonTextFont: "600 15px Inter",
    cancelButtonTextColor: "black",
    cancelButtonTextFont: "600 15px Inter",
    titleFont: "",
    titleColor: "",
    messageTextFont: "400 13px Inter",
    messageTextColor: "RGBA(20, 20, 20, 0.58)",
    background: "white",
    border:"1px solid #F2F2F2",
    height:"220px",
    width:"360px"
  }
  backiconurl = "assets/backbutton.svg"
  @Input() statusIndicatorStyle: any = {
    height: "10px",
    width: "10px",
    borderRadius: "16px",
    border:""
  };
  @Input() backdropStyle :BaseStyle = {
    height:"100%",
    width:"100%",
    background:"rgba(0, 0, 0, 0.5)"
  }
  @Input() avatarStyle: AvatarStyle = {
    borderRadius: "16px",
    width: "28px",
    height: "28px",
    border: "none",

  };
  @Input() detailsStyle: DetailsStyle = {
    width: "100%",
    height: "100%",
    border: "",
    borderRadius: "",
    padding:"0 100px"
  };
  @Input() listItemStyle: ListItemStyle = {
    height: "100%",
    width: "100%",
    background: "",
    activeBackground: "transparent",
    borderRadius: "grey",
    titleFont: "600 15px Inter",
    titleColor: "black",
    border: "",
    hoverBackground: "transparent",
    separatorColor: "rgb(222 222 222 / 46%)"
  };


  leaveGroupText:string = localize("LEAVE_GROUP")
  leaveGroupMessage:string = localize("LEAVE_CONFIRM")
  transferText:string = localize("TRANSFER_OWNERSHIP")
  transferConfirm:string = localize("TRANSFER_CONFIRM")
  defaultTemplate:CometChatDetailsTemplate[] = []
  public loggedInUser:CometChat.User | null = null;
  public openViewMembersPage:boolean = false;
  public openBannedMembersPage:boolean = false;
  public openAddMembersPage:boolean = false;
  public confirmLeaveGroupModal:boolean = false;
  public openTransferOwnershipModal:boolean = false
  selectionmodeEnum:  SelectionMode = SelectionMode.multiple;
  ccGroupMemberAdded!:Subscription;
  ccGroupMemberJoined!:Subscription;
  ccGroupMemberKicked!:Subscription;
  ccGroupMemberBanned!:Subscription;
  ccOwnershipChanged!:Subscription;
  public statusColor: any = {
    private: "",
    password: "#F7A500",
    public: ""
  }
  closeButtonStyle:any ={
    height:"24px",
    width:"24px",
    border:"none",
    borderRadius:"0",
    background:"transparent",
    buttonIconTint:this.detailsStyle.closeButtonIconTint || this.themeService.theme.palette.getPrimary()
  }
  buttonStyle:any ={
    height:"100%",
    width:"100%",
    border:"none",
    borderRadius:"0",
    background:"transparent",
    buttonTextColor: this.themeService.theme.palette.getPrimary() || "rgba(51, 153, 255)",
    buttonTextFont: "500 16px Inter"
  }
  dividerStyle:any = {
    background:"rgb(222 222 222 / 46%)",
    height:"1px",
    width:"100%"
  }

//
  getTitleStyle (){
    return {
      textFont: this.detailsStyle.titleTextFont || fontHelper(this.themeService.theme.typography.title1),
      textColor: this.detailsStyle.titleTextColor || this.themeService.theme.palette.getAccent()
    }
  }
  getCustomOptionView(option:CometChatDetailsOption){
  return option?.customView
  }
  public subtitleText:string = "";
  public userListenerId = "userlist_" + new Date().getTime();
  constructor(private ref:ChangeDetectorRef,private themeService:CometChatThemeService){}
  ngOnChanges(changes: SimpleChanges): void {
    if(changes["user"] || changes["group"]){
      if(this.loggedInUser){
       this.getTemplate()
      }
      else{
        CometChat.getLoggedinUser().then((user:CometChat.User | null)=>{
          this.loggedInUser = user as CometChat.User
          this.getTemplate()
        }).catch((error:CometChat.CometChatException)=>{
          if(this.onError){
            this.onError(error)
          }
        })
      }
    }
  }
  getTemplate(){
    if(this.data && this.data?.length > 0){
      this.defaultTemplate = this.data
      this.ref.detectChanges();
    }
    else{
      this.defaultTemplate = DetailsUtils.getDefaultDetailsTemplate(this.loggedInUser,this.user,this.group,this.themeService.theme)

      this.ref.detectChanges();
    }
  }
  removeListener(){
    CometChat.removeUserListener(this.userListenerId)
  }
  ngOnDestroy(){
    this.removeListener();
    this.data = [];
    this.defaultTemplate = [];
   if(this.onClose){
    this.onClose()
   }
 this.unsubscribeToEvents()
  }

  ngOnInit(): void {
    this.setThemeStyle()
    this.subscribeToEvents()
    this.statusColor.online = this.detailsStyle.onlineStatusColor || this.themeService.theme.palette.getSuccess()
    this.attachListeners()
    this.updateSubtitle()
  }

  subscribeToEvents(){
    this.ccGroupMemberAdded = CometChatGroupEvents.ccGroupMemberAdded.subscribe((item:IGroupMemberAdded)=>{ this.group = item?.userAddedIn!;
      this.group = item?.userAddedIn!
      this.openAddMembersPage = false;
      this.updateSubtitle()
      this.ref.detectChanges()
    })
    this.ccGroupMemberJoined = CometChatGroupEvents.ccGroupMemberJoined.subscribe((item:IGroupMemberJoined)=>{
      this.group = item?.joinedGroup;
      this.updateSubtitle()
      this.ref.detectChanges()
    });
    this.ccGroupMemberKicked = CometChatGroupEvents.ccGroupMemberKicked.subscribe((item:IGroupMemberKickedBanned)=>{
      this.group = item?.kickedFrom!;
      this.updateSubtitle()
      this.ref.detectChanges()
    });
    this.ccGroupMemberBanned = CometChatGroupEvents.ccGroupMemberBanned.subscribe((item:IGroupMemberKickedBanned)=>{
      this.group = item?.kickedFrom!;
      this.updateSubtitle()
      this.ref.detectChanges()
    });
    this.ccOwnershipChanged = CometChatGroupEvents.ccOwnershipChanged.subscribe((item:IOwnershipChanged)=>{
      this.group = item?.group!;
      this.updateSubtitle();
      this.confirmLeaveGroupModal = false;
      this.openTransferOwnershipModal = false;
      this.ref.detectChanges();
    });
  }
  unsubscribeToEvents(){
    this.ccGroupMemberAdded?.unsubscribe();
    this.ccGroupMemberJoined?.unsubscribe();
    this.ccGroupMemberKicked?.unsubscribe();
    this.ccGroupMemberBanned?.unsubscribe();
    this.ccOwnershipChanged?.unsubscribe();
  }
  checkStatusType = ()=> {
    return   this.user && !this.disableUsersPresence ? this.statusColor[this.user?.getStatus()] : this.statusColor[this.group?.getType()]
  }
  updateSubtitle() {
    const count = this.group?.getMembersCount();
    const membersText = localize(count > 1 ? "MEMBERS" : "MEMBER");
    this.subtitleText = this.user ? this.user.getStatus() : `${count} ${membersText}`;
    this.ref.detectChanges();
  }
  getButtonStyle(option:CometChatDetailsOption){
    return {
      height:"100%",
      width:"100%",
      border:"none",
      borderRadius:"0",
      buttonTextFont:option?.titleFont,
      buttonTextColor:option?.titleColor,
      background:option?.backgroundColor || "transparent"
    }
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
    } catch (error:any) {
console.log(error)
    }
  }
  getSectionHeaderStyle(template:CometChatDetailsTemplate){
    return  {
      textFont:template.titleFont,
      textColor:template.titleColor
    }
  }
  onOptionClick(option: CometChatDetailsOption) {
    const { onClick, id } = option;
    if (onClick) {
      onClick(this.user ?? this.group);
      return;
    }
    switch (id) {
      case CometChatUIKitConstants.UserOptions.viewProfile:
        if (this.user?.getLink()) {
          window.location.href = this.user.getLink();
        }
        break;
      case CometChatUIKitConstants.UserOptions.block:
        this.blockUser();
        break;
      case CometChatUIKitConstants.UserOptions.unblock:
        this.unBlockUser();
        break;
      case CometChatUIKitConstants.GroupOptions.viewMembers:
        this.viewMembers();
        break;
      case CometChatUIKitConstants.GroupOptions.addMembers:
        this.addMembers();
        break;
      case CometChatUIKitConstants.GroupOptions.bannedMembers:
        this.bannedMembers();
        break;
      case CometChatUIKitConstants.GroupOptions.leave:
        this.leaveGroup();
        break;
      case CometChatUIKitConstants.GroupOptions.delete:
        this.deleteGroup();
        break;
      default:
        break;
    }
  }
  onLeaveClick(){
    if(this.group.getOwner() == this.loggedInUser?.getUid()){
      this.openTransferOwnershipModal = true;
      this.confirmLeaveGroupModal = false
     }
     else{
      CometChat.leaveGroup(this.group.getGuid())
      .then((response:any) => {
          this.group.setMembersCount(this.group.getMembersCount() -1)
          this.group.setHasJoined(false)
          this.updateSubtitle()
          this.ref.detectChanges();
          this.openTransferOwnershipModal = false;
          this.confirmLeaveGroupModal = false;
          if(this.onClose){
            this.onClose()
          }
          CometChatGroupEvents.ccGroupLeft.next({
            userLeft:this.loggedInUser!,
            leftGroup:this.group,
            message:this.createUserLeftAction(this.loggedInUser!,CometChatUIKitConstants.groupMemberAction.LEFT)

          })
      })
      .catch((error:any)=>{
        if(this.onError){this.onError(error)}
      });
     }
  }
  createActionMessage(actionOn:CometChat.GroupMember,action:string){
    let actionMessage:CometChat.Action  = new CometChat.Action(this.group.getGuid(),CometChatUIKitConstants.MessageTypes.groupMember,CometChatUIKitConstants.MessageReceiverType.group,CometChatUIKitConstants.MessageCategory.action as any)
    actionMessage.setAction(action)
    actionMessage.setActionBy(this.loggedInUser!)
    actionMessage.setActionFor(this.group)
    actionMessage.setActionOn(actionOn)
    actionMessage.setReceiver(this.group)
    actionMessage.setSender(this.loggedInUser!)
    actionMessage.setConversationId("group_"+ this.group.getGuid())
    actionMessage.setMuid(CometChatUIKitUtility.ID())
    actionMessage.setMessage(`${this.loggedInUser?.getName()} ${action} ${actionOn.getUid()}`)
    actionMessage.setSentAt(CometChatUIKitUtility.getUnixTimestamp())
    actionMessage.setNewScope(actionOn.getScope())

   return actionMessage
  }
  createUserLeftAction(actionOn:CometChat.User,action:string){
    let actionMessage:CometChat.Action  = new CometChat.Action(this.group.getGuid(),CometChatUIKitConstants.MessageTypes.groupMember,CometChatUIKitConstants.MessageReceiverType.group,CometChatUIKitConstants.MessageCategory.action as any)
    actionMessage.setAction(action)
    actionMessage.setActionBy(this.loggedInUser!)
    actionMessage.setActionFor(this.group)
    actionMessage.setActionOn(actionOn)
    actionMessage.setReceiver(this.group)
    actionMessage.setSender(this.loggedInUser!)
    actionMessage.setConversationId("group_"+ this.group.getGuid())
    actionMessage.setMuid(CometChatUIKitUtility.ID())
    actionMessage.setMessage(`${this.loggedInUser?.getName()} ${action} ${actionOn.getUid()}`)
    actionMessage.setSentAt(CometChatUIKitUtility.getUnixTimestamp());
    return actionMessage
  }
  onCloseClick =()=>{
    if(this.onClose){
      this.onClose()
    }

  }
  onCancelClick(){
    this.confirmLeaveGroupModal = false;
  }
   blockUser(){
    // block user
    if(this.user && !this.user.getBlockedByMe()){
      CometChat.blockUsers([this.user.getUid()]).then(()=>{
        this.user.setBlockedByMe(true)
        CometChatUserEvents.ccUserBlocked
        this.getTemplate();
        if(this.onClose){
          this.onClose()
        }

      })
      .catch((error:any)=>{
        if(this.onError){
          this.onError(error)
        }
      })

    }
   }
   unBlockUser(){
// unblock user
if(this.user && this.user.getBlockedByMe()){
  CometChat.unblockUsers([this.user.getUid()]).then(()=>{
    this.user.setBlockedByMe(false)
    CometChatUserEvents.ccUserUnblocked.next(this.user)
    this.getTemplate()
  })
  .catch((error:any)=>{
    if(this.onError){
      this.onError(error)
    }
  })

}
   }
   viewMembers =()=>{
 this.openViewMembersPage = !this.openViewMembersPage
 this.openBannedMembersPage = false
 this.openAddMembersPage = false
   }
   addMembers =()=>{
    this.openAddMembersPage = !this.openAddMembersPage
    this.openBannedMembersPage = false
    this.openViewMembersPage = false
   }
   bannedMembers =()=>{
    this.openAddMembersPage = false
    this.openViewMembersPage = false
    this.openBannedMembersPage = !this.openBannedMembersPage
   }
   leaveGroup(){
    if(this.group.getOwner() == this.loggedInUser?.getUid()){
  this.leaveButtonText = this.transferText
  this.confirmDialogMessage = this.transferConfirm
     }
     else{
      this.leaveButtonText = this.leaveGroupText
      this.confirmDialogMessage = this.leaveGroupMessage
     }
    this.confirmLeaveGroupModal = true
    this.ref.detectChanges()
   }
   deleteGroup(){
CometChat.deleteGroup(this.group?.getGuid()).then(()=>{
  CometChatGroupEvents.ccGroupDeleted.next(this.group)
  if(this.onClose){
    this.onClose()
  }
})
.catch((error:any)=>{
  if(this.onError){
    this.onError(error)
  }
})
   }
   openTransferOwnership = ()=>{
     this.openTransferOwnershipModal = !this.openTransferOwnershipModal;
     this.confirmLeaveGroupModal = false;
   }
   onCloseDetails(){
     if(this.onClose){
       this.onClose()
     }
   }
  subtitleStyle = ()=>{
 if(this.user && this.user.getStatus() == CometChatUIKitConstants.userStatusType.online){
  return{
    textFont:this.detailsStyle.subtitleTextFont,
    textColor:this.themeService.theme.palette.getPrimary()
  }
 }
 else{
  return{
    textFont:this.detailsStyle.subtitleTextFont,
    textColor:this.detailsStyle.subtitleTextColor
  }
 }
  }
    /**
   * @param  {CometChat.Group} group
   */
     getGroupIcon = (group: CometChat.Group) => {
      let status;
      if (group) {
        switch (group.getType()) {
          case CometChatUIKitConstants.GroupTypes.password:
            status = this.protectedGroupIcon;
            break;
          case CometChatUIKitConstants.GroupTypes.private:
            status = this.privateGroupIcon;
            break;
          default:
            status = null
            break;
        }
      }
      return status
    }
      /**
   * @param  {CometChat.Group} group
   */
   getStatusIndicatorColor(group: CometChat.Group) {
    return this.statusColor[(group?.getType() as string)];
  }
  getTemplateOptions = (template:CometChatDetailsTemplate)=>{
    if(template.options){
      return template.options(this.user,this.group,template.id as string)
    }
    else return []
  }
  setThemeStyle() {
    this.setDetailsStyle()
    this.setAvatarStyle()
    this.setStatusStyle()
    this.setListItemStyle();
    this.setConfirmDialogStyle();
    this.statusColor.private =  this.detailsStyle.privateGroupIconBackground ;
    this.statusColor.online = this.detailsStyle.onlineStatusColor ;
    this.statusColor.password = this.detailsStyle.passwordGroupIconBackground
  }
  setConfirmDialogStyle(){
    let defaultStyle:ConfirmDialogStyle = new ConfirmDialogStyle({
      confirmButtonBackground: this.themeService.theme.palette.getPrimary(),
      cancelButtonBackground: this.themeService.theme.palette.getSecondary(),
      confirmButtonTextColor: this.themeService.theme.palette.getAccent900("light"),
      confirmButtonTextFont: fontHelper(this.themeService.theme.typography.text2),
      cancelButtonTextColor: this.themeService.theme.palette.getAccent900("dark"),
      cancelButtonTextFont: fontHelper(this.themeService.theme.typography.text2),
      titleFont: fontHelper(this.themeService.theme.typography.title1),
      titleColor: this.themeService.theme.palette.getAccent(),
      messageTextFont: fontHelper(this.themeService.theme.typography.subtitle2),
      messageTextColor: this.themeService.theme.palette.getAccent600(),
      background: this.themeService.theme.palette.getBackground(),
      height:"100%",
      width:"350px",
      border:`1px solid ${this.themeService.theme.palette.getAccent200()}`,
      borderRadius:"8px"
    })
    this.leaveDialogStyle = {...defaultStyle,...this.leaveDialogStyle}
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
      separatorColor:this.themeService.theme.palette.getAccent200(),
      hoverBackground: "transparent"
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
  setDetailsStyle(){
    let defaultStyle:DetailsStyle = new DetailsStyle({
      background:this.themeService.theme.palette.getBackground(),
      border:`1px solid ${this.themeService.theme.palette.getAccent50()}`,
      titleTextFont:fontHelper(this.themeService.theme.typography.title1),
      titleTextColor:this.themeService.theme.palette.getAccent(),
      onlineStatusColor:this.themeService.theme.palette.getSuccess(),
      privateGroupIconBackground:this.themeService.theme.palette.getSuccess(),
      passwordGroupIconBackground:"RGB(247, 165, 0)",
      closeButtonIconTint:this.themeService.theme.palette.getPrimary(),
      width: "100%",
      height: "100%",
      borderRadius: "",
      subtitleTextFont: fontHelper(this.themeService.theme.typography.subtitle2),
      subtitleTextColor:this.themeService.theme.palette.getAccent600(),
      padding:"0 100px"
    })
    this.detailsStyle = {...defaultStyle,...this.detailsStyle}
  }
  wrapperStyle = () => {
    return {
      width: this.detailsStyle.width,
      height: this.detailsStyle.height,
      border: this.detailsStyle.border,
      borderRadius:this.detailsStyle.borderRadius,
      background: this.detailsStyle.background,
    }
  }
  marginStyle = () => {
    return {
      padding:this.detailsStyle?.padding
    }
  }
}

