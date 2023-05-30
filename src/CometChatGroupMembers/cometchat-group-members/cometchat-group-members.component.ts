import { Component, OnInit, Input, ChangeDetectorRef, ChangeDetectionStrategy, TemplateRef } from "@angular/core";
import { CometChat } from "@cometchat-pro/chat";
import { Subject, Subscription } from "rxjs";
import {AvatarStyle, ListItemStyle, ChangeScopeStyle,MenuListStyle,} from 'my-cstom-package-lit'
import {  SelectionMode,States, TitleAlignment,GroupMemberUtils,GroupMembersStyle,  ListStyle, BaseStyle ,CometChatUIKitUtility } from "uikit-utils-lerna";
import {CometChatTheme, fontHelper, localize,CometChatOption, CometChatGroupEvents, CometChatUIKitConstants} from 'uikit-resources-lerna'
import { CometChatThemeService } from "../../CometChatTheme.service";
/**
*
*  CometChatGroupMembersComponent is used to render list of group members
*
* @version 1.0.0
* @author CometChatTeam
* @copyright © 2022 CometChat Inc.
*
*/
@Component({
  selector: "cometchat-group-members",
  templateUrl: "./cometchat-group-members.component.html",
  styleUrls: ["./cometchat-group-members.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CometChatGroupMembersComponent implements OnInit {
  @Input() groupMemberRequestBuilder!: CometChat.GroupMembersRequestBuilder;
  @Input() searchRequestBuilder!: CometChat.GroupMembersRequestBuilder;
  @Input() subtitleView!: TemplateRef<any>;
  @Input() listItemView!: TemplateRef<any>;
  @Input() tailView!: TemplateRef<any>;
  @Input() disableUsersPresence: boolean = false;
  @Input() menu!: TemplateRef<any>;
  @Input()   options!: ((member:CometChat.GroupMember)=>CometChatOption[]) | null;
  @Input() backButtonIconURL: string = "assets/backbutton.svg"
  @Input() closeButtonIconURL: string = "assets/close2x.svg"
  @Input() showBackButton: boolean = true;
  @Input() hideSeparator: boolean = false;
  @Input() selectionMode: SelectionMode = SelectionMode.none;
  @Input() searchPlaceholder: string = "Search Members";
  @Input() searchIconURL: string = "assets/search.svg";
  @Input() hideSearch: boolean = true;
  @Input() title: string = localize("MEMBERS");
  @Input() onError:((error:any)=>void) | null = (error:any)=>{
    console.log(error)
  }
  @Input() backdropStyle :BaseStyle = {
    height:"100%",
    width:"100%",
    background:"rgba(0, 0, 0, 0.5)"
  }
  @Input() onBack!:()=>void;
  @Input() onClose!:()=>void;
  @Input() onSelect!: (groupMember:CometChat.GroupMember)=>void;
  @Input() group!: CometChat.Group;
  @Input() emptyStateView!: TemplateRef<any>;
  @Input() errorStateView!: TemplateRef<any>;
  @Input() loadingIconURL: string = "assets/Spinner.svg";
  @Input() loadingStateView!: TemplateRef<any>;
  @Input() emptyStateText: string = localize("NO_GROUPS_FOUND")
  @Input() errorStateText: string = localize("SOMETHING_WRONG");
  @Input() titleAlignment: TitleAlignment = TitleAlignment.center;
  @Input() dropdownIconURL: string = "assets/down-arrow.svg"
  @Input() statusIndicatorStyle: any = {
    height: "10px",
    width: "10px",
    borderRadius: "16px",
    border:""
  };
  @Input() avatarStyle: AvatarStyle = {
    borderRadius: "16px",
    width: "32px",
    height: "32px",
  };
  @Input() groupMemberStyle: GroupMembersStyle = {
    width: "100%",
    height: "100%",
    background: "",
    border: "",
    borderRadius: "",
    padding:"0 100px"
  };
  @Input() groupScopeStyle: ChangeScopeStyle = new ChangeScopeStyle({
    height:"200px",
    width:"280px"
  })
  @Input() listItemStyle: ListItemStyle = {
    height: "100%",
    width: "100%",
    background: "",
    activeBackground: "transparent",
    borderRadius: "grey",
    titleFont: "",
    titleColor: "",
    border: "",
    hoverBackground: "transparent",
    separatorColor: "rgba(222 222 222 / 46%)"
  };
  listStyle:ListStyle = {}
  menuListStyle:MenuListStyle = {
    width: "",
    height: "",
    border: "none",
    borderRadius: "8px",
    background: "white",
    submenuWidth: "100%",
    submenuHeight: "100%",
    submenuBorder: "1px solid #e8e8e8",
    submenuBorderRadius: "8px",
    submenuBackground: "white",
    moreIconTint:"rgb(51, 153, 255)"
  }
  modalStyle:any = {
    height:"212px",
    width:"360px",
    background:"white",
    borderRadius:"12px",
    border:"none"
  }
  public limit:number = 30;
  moreIconURL: string = "assets/moreicon.svg";
   searchKeyword : string = "";
   onScrolledToBottom:any = null
  public isString = (data: any) => typeof data == 'string'
  public isArray = (data: any) => typeof data == 'object' && data?.length > 0
  public getOptions = (member: CometChat.GroupMember) => {
    let options = GroupMemberUtils.getViewMemberOptions(member, this.group,this.loggedInUser?.getUid(),this.themeService.theme)
    return options
  }
  selectedMember!: CometChat.GroupMember | null;
  titleAlignmentEnum: typeof TitleAlignment = TitleAlignment
  selectionmodeEnum: typeof SelectionMode = SelectionMode;
  public groupsRequest: any;
  public state: States = States.loading;
  public timeout: any;
  public groupMembers: CometChat.GroupMember[] = [];
  public scopes: string[] = []
  public membersListenerId: string = "memberlist_" + new Date().getTime();
  loggedInUser!: CometChat.User | null;
  changeScope: boolean = false;
  constructor(private ref: ChangeDetectorRef,private themeService:CometChatThemeService) {
  }
  public memberScope: any[] = []
  membersList: CometChat.GroupMember[] = [];
  closeClicked(){
    if(this.onClose){
      this.onClose()
    }
  }
  backClicked(){
    if(this.onBack){
      this.onBack()
    }
  }
  ngOnInit(): void {
    this.onScrolledToBottom = this.fetchNextGroupMembers
    this.setThemeStyle()
    this.attachListeners()
    CometChat.getLoggedinUser().then((user: CometChat.User | null) => {
      this.loggedInUser = user
      this.groupsRequest = this.getRequestBuilder();
      this.fetchNextGroupMembers();
    }).catch((error:CometChat.CometChatException)=>{
      if(this.onError){
        this.onError(error)
      }
    })
  }
  ngOnDestroy(){
    this.removeListener()
  }
  /**
   * @param  {CometChat.GroupMember} member
   */
  getStatusIndicatorColor = (member: CometChat.GroupMember) => {
    if (!this.disableUsersPresence) {
      if (member?.getStatus() == CometChatUIKitConstants.userStatusType.online) {
        return this.groupMemberStyle.onlineStatusColor || this.themeService.theme.palette.getSuccess()
      }
      else {
        return null
      }
    }
    return null
  }
  changeMemberScope(event: any) {
    CometChat.updateGroupMemberScope(this.group.getGuid(), this.selectedMember!.getUid(), event?.detail?.value).then((member: boolean) => {
     let scope:any = event?.detail?.value
      this.changeScope = false;
      this.selectedMember?.setScope(scope)
      this.updateMember(this.selectedMember)
      this.ref.detectChanges();
      CometChatGroupEvents.ccGroupMemberScopeChanged.next({
        scopeChangedFrom:this.selectedMember?.getScope(),
        scopeChangedTo:scope,
        message: this.createActionMessage(this.selectedMember!,CometChatUIKitConstants.groupMemberAction.SCOPE_CHANGE),
        group:this.group,
        updatedUser:this.selectedMember!
       })
      this.selectedMember = null
      this.changeScope = false
    })
      .catch((err: any) => {
        this.changeScope = false;
        this.selectedMember = null
        this.ref.detectChanges()
      })
  }
  handleMenuAction = (menu: any, groupMember: CometChat.GroupMember) => {
    if (menu?.detail?.data?.onClick) {
      menu?.detail?.data?.onClick(groupMember)
      return
    }
    let id = menu?.detail?.data?.id
    this.selectedMember = groupMember;
    this.memberScope = GroupMemberUtils.allowScopeChange(this.group,groupMember)
    if (id == CometChatUIKitConstants.GroupMemberOptions.changeScope) {
      this.changeScope = true;
      this.scopes = []
    }
    else if (id == CometChatUIKitConstants.GroupMemberOptions.ban) {
      this.changeScope = false;
      this.blockMember(groupMember)
    }
    else if (id == CometChatUIKitConstants.GroupMemberOptions.kick) {
      this.kickMember(groupMember)
    }
  }
  blockMember = (member: CometChat.GroupMember) => {
    CometChat.banGroupMember(this.group.getGuid(), member.getUid()).then(() => {
      this.group.setMembersCount(this.group.getMembersCount() - 1)
      this.addRemoveMember(member)
      this.ref.detectChanges()
      CometChatGroupEvents.ccGroupMemberBanned.next({
        kickedBy:this.loggedInUser!,
        kickedFrom:this.group!,
        kickedUser:member,
        message:this.createActionMessage(member,CometChatUIKitConstants.groupMemberAction.BANNED)
      })
    })
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
    actionMessage.setSentAt(CometChatUIKitUtility.getUnixTimestamp());
    actionMessage.setReceiverType(CometChatUIKitConstants.MessageReceiverType.group);
    (actionMessage as any).data = {
      extras:{
        scope:{
          new:actionOn.getScope()
        }
      }
    }
   return actionMessage
  }
  kickMember = (member: CometChat.GroupMember) => {
    CometChat.kickGroupMember(this.group.getGuid(), member.getUid()).then(() => {
      this.group.setMembersCount(this.group.getMembersCount() - 1)
      this.addRemoveMember(member)
      this.ref.detectChanges()
      CometChatGroupEvents.ccGroupMemberKicked.next({
        kickedBy:this.loggedInUser!,
        kickedFrom:this.group!,
        kickedUser:member,
        message:this.createActionMessage(member,CometChatUIKitConstants.groupMemberAction.KICKED)
      })
    })
    .catch((error:any)=>{
      if(this.onError){
        this.onError(error)
      }
    })
  }
  /**
   * @param  {CometChat.User} member
   */
  updateMemberStatus = (member: CometChat.User) => {
    let memberlist = [...this.groupMembers];
    //search for user
    let userKey = memberlist.findIndex((u: CometChat.GroupMember, k) => u.getUid() == member.getUid());
    //if found in the list, update user object
    if (userKey > -1) {
      let user: CometChat.GroupMember = memberlist[userKey];
      user.setStatus(member.getStatus())
      memberlist.splice(userKey, 1, user);
      this.groupMembers = [...memberlist];
      this.ref.detectChanges();
    }
  };
  updateMember = (member: CometChat.GroupMember | null) => {
    let memberlist = [...this.groupMembers];
    //search for user
    let userKey = memberlist.findIndex((u: CometChat.GroupMember, k) => u.getUid() == member!.getUid());
    //if found in the list, update user object
    if (userKey > -1) {
      let user: CometChat.GroupMember = memberlist[userKey];
      memberlist.splice(userKey, 1, user);
      this.groupMembers = [...memberlist];
      this.ref.detectChanges();
    }
  };
  attachListeners() {
    //Attaching User Listeners to dynamilcally update when a user comes online and goes offline
    CometChat.addUserListener(
      this.membersListenerId,
      new CometChat.UserListener({
        onUserOnline: (onlineUser: CometChat.User) => {
          /* when someuser/friend comes online, user will be received here */
          this.updateMemberStatus(onlineUser);
        },
        onUserOffline: (offlineUser: CometChat.User) => {
          /* when someuser/friend went offline, user will be received here */
          this.updateMemberStatus(offlineUser);
        },
      })
    );
    CometChat.addGroupListener(
      this.membersListenerId,
      new CometChat.GroupListener({
        onGroupMemberScopeChanged: (
          message: CometChat.Action,
          changedUser: CometChat.GroupMember,
          newScope: CometChat.GroupMemberScope,
          oldScope: CometChat.GroupMemberScope,
          changedGroup: CometChat.Group
        ) => {
          if (changedUser.getUid() == this.loggedInUser?.getUid()) {
            changedGroup.setScope(newScope)
          }
          this.updateMember(changedUser as CometChat.GroupMember)
        },
        onGroupMemberKicked: (message: CometChat.Action, kickedUser: CometChat.User, kickedBy: CometChat.User, kickedFrom: CometChat.Group) => {
          this.addRemoveMember(kickedUser as CometChat.GroupMember)
        },
        onGroupMemberBanned: (message: CometChat.Action, bannedUser: CometChat.User, bannedBy: CometChat.User, bannedFrom: CometChat.Group) => {
          this.addRemoveMember(bannedUser as CometChat.GroupMember)
        },
        onGroupMemberUnbanned: (
          message: CometChat.Action,
          unbannedUser: CometChat.User,
          unbannedBy: CometChat.User,
          unbannedFrom: CometChat.Group
        ) => {
          if (unbannedUser.getUid() == this.loggedInUser?.getUid()) {
            unbannedFrom.setHasJoined(false)
          }
          this.addRemoveMember(unbannedUser as CometChat.GroupMember)
        },
        onMemberAddedToGroup: (
          message: CometChat.Action,
          userAdded: CometChat.User,
          userAddedBy: CometChat.User,
          userAddedIn: CometChat.Group
        ) => {
         let member:CometChat.GroupMember = new CometChat.GroupMember(userAdded.getUid(), CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT)
         member.setName(userAdded.getName())
         member.setGuid(this.group.getGuid())
         member.setUid(userAdded.getUid())
          if (userAdded.getUid() == this.loggedInUser?.getUid()) {
            userAddedIn.setHasJoined(true)
          }
          this.addRemoveMember(member)
        },
        onGroupMemberLeft: (message: CometChat.Action, leavingUser: CometChat.User, group: CometChat.Group) => {
          if (leavingUser.getUid() == this.loggedInUser?.getUid()) {
            group.setHasJoined(false)
          }
          this.addRemoveMember(leavingUser as CometChat.GroupMember)
        },
        onGroupMemberJoined: (message: CometChat.Action, joinedUser: CometChat.User, joinedGroup: CometChat.Group) => {
          this.addRemoveMember(joinedUser as CometChat.GroupMember)
        },
      })
    );
  }
  removeListener() {
    CometChat.removeUserListener(this.membersListenerId);
    this.membersListenerId = "";
  }
  addRemoveMember = (member: CometChat.GroupMember) => {
    let memberlist = [...this.groupMembers];
    //search for user
    let memberKey = memberlist.findIndex((u: CometChat.GroupMember, k) => u.getUid() == member.getUid());
    //if found in the list, update user object
    if (memberKey > -1) {
      memberlist.splice(memberKey, 1);
      this.groupMembers = [...memberlist];
      this.ref.detectChanges();
    }
    else {
      this.groupMembers.push(member)
      this.ref.detectChanges();
    }
  }
  fetchNextGroupMembers = () => {
    this.onScrolledToBottom = null
    if(this.groupsRequest && this.groupsRequest.pagination && (this.groupsRequest.pagination.current_page == 0 || this.groupsRequest.pagination.current_page !=  this.groupsRequest.pagination.total_pages)){
      this.onScrolledToBottom = this.fetchNextGroupMembers
      this.state = States.loading
      this.ref.detectChanges()
      try {
        this.groupsRequest.fetchNext().then(
          (groupMembers: CometChat.GroupMember[]) => {
            this.state = States.loading
            if ((groupMembers.length <= 0 && this.groupMembers?.length <= 0) || (groupMembers.length === 0 && this.groupMembers?.length <= 0)) {
              this.state = States.empty
              this.ref.detectChanges();
            } else {
              this.state = States.loaded
              this.groupMembers = [...this.groupMembers, ...groupMembers];
              this.ref.detectChanges()
            }
          },
          (error: any) => {
            console.log(error)
            this.state = States.error
            this.ref.detectChanges();
          }
        );
      } catch (error: any) {
        console.log(error)
        this.state = States.error
        this.ref.detectChanges();
      }
    }
    else{
      this.state = States.loaded
      return
    }
  }
  getRequestBuilder() {
    if(this.searchRequestBuilder){
      return this.searchRequestBuilder.build()
    }
    else if (this.groupMemberRequestBuilder) {
      return this.groupMemberRequestBuilder.build();
    }
    else {
      return new CometChat.GroupMembersRequestBuilder(this.group.getGuid())
        .setLimit(this.limit)
        .setSearchKeyword(this.searchKeyword)
        .build();
    }
  }
  /**
   * @param  {string} key
   */
   onSearch = (key: string) => {
    this.searchKeyword = key;
    clearTimeout(this.timeout);
    this.timeout = setTimeout(() => {
      const request = this.searchRequestBuilder ? this.searchRequestBuilder.setSearchKeyword(this.searchKeyword).build() : this.getRequestBuilder();
      this.groupsRequest = request;
      this.groupMembers = [];
      this.fetchNextGroupMembers();
    }, 500);
  };
  setThemeStyle() {
    this.setGroupMembersStyle()
    this.setScopeStyle()
    this.setListItemStyle()
    this.setAvatarStyle()
    this.setStatusStyle()
    this.menuListStyle = new MenuListStyle({
      border:"none",
      borderRadius: "8px",
      background: "transparent",
      submenuWidth: "100%",
      submenuHeight: "100%",
      submenuBorder: `1px solid ${this.themeService.theme.palette.getAccent200()}`,
      submenuBorderRadius: "8px",
      submenuBackground: this.themeService.theme.palette.getBackground(),
      moreIconTint:this.themeService.theme.palette.getPrimary(),
    })
    this.modalStyle.boxShadow = `0px 0px 1px ${this.themeService.theme.palette.getAccent600()}`
    this.modalStyle.background = this.themeService.theme.palette.getBackground()
    this.ref.detectChanges();
  }
  setGroupMembersStyle(){
    let defaultStyle:GroupMembersStyle = new GroupMembersStyle({
      background:this.themeService.theme.palette.getBackground(),
      border:`1px solid ${this.themeService.theme.palette.getAccent50()}`,
      titleTextFont:fontHelper(this.themeService.theme.typography.title1),
      titleTextColor:this.themeService.theme.palette.getAccent(),
      emptyStateTextFont:fontHelper(this.themeService.theme.typography.title1),
      emptyStateTextColor:this.themeService.theme.palette.getAccent600(),
      errorStateTextFont:fontHelper(this.themeService.theme.typography.title1),
      errorStateTextColor:this.themeService.theme.palette.getAccent600(),
      loadingIconTint:this.themeService.theme.palette.getAccent600(),
      onlineStatusColor:this.themeService.theme.palette.getSuccess(),
      separatorColor:this.themeService.theme.palette.getAccent400(),
      width: "100%",
      height: "100%",
      borderRadius: "none",
      searchIconTint:this.themeService.theme.palette.getAccent600(),
      searchPlaceholderTextColor:this.themeService.theme.palette.getAccent600(),
      searchBackground:this.themeService.theme.palette.getAccent100(),
      searchPlaceholderTextFont:fontHelper(this.themeService.theme.typography.text3),
      searchTextColor:this.themeService.theme.palette.getAccent600(),
      searchTextFont:fontHelper(this.themeService.theme.typography.text3),
      searchBorderRadius:"8px",
      closeButtonIconTint:this.themeService.theme.palette.getPrimary(),
      backButtonIconTint:this.themeService.theme.palette.getPrimary(),
      padding:"0 100px",
    })
    this.groupMemberStyle = {...defaultStyle,...this.groupMemberStyle}
    this.listStyle ={
      titleTextFont : this.groupMemberStyle.titleTextFont || fontHelper(this.themeService.theme.typography.title1),
      titleTextColor : this.groupMemberStyle.titleTextColor || this.themeService.theme.palette.getAccent(),
      emptyStateTextFont : this.groupMemberStyle.emptyStateTextFont,
      emptyStateTextColor : this.groupMemberStyle.emptyStateTextColor,
      errorStateTextFont : this.groupMemberStyle.errorStateTextFont,
      errorStateTextColor : this.groupMemberStyle.errorStateTextColor,
      loadingIconTint : this.groupMemberStyle.loadingIconTint,
      separatorColor : this.groupMemberStyle.separatorColor,
      searchIconTint : this.groupMemberStyle.searchIconTint,
      searchBorder : this.groupMemberStyle.searchBorder,
      searchBorderRadius : this.groupMemberStyle.searchBorderRadius,
      searchBackground : this.groupMemberStyle.searchBackground,
      searchPlaceholderTextFont : this.groupMemberStyle.searchPlaceholderTextFont,
      searchPlaceholderTextColor : this.groupMemberStyle.searchPlaceholderTextColor,
      searchTextFont : this.groupMemberStyle.searchTextFont,
      searchTextColor : this.groupMemberStyle.searchTextColor,
    }
    this.ref.detectChanges();
  }
  setListItemStyle(){
    let defaultStyle:ListItemStyle = new ListItemStyle({
      height: "45px",
      width: "100%",
      background: this.themeService.theme.palette.getBackground(),
      activeBackground: "",
      borderRadius: "0",
      titleFont: fontHelper(this.themeService.theme.typography.title2),
      titleColor: this.themeService.theme.palette.getAccent(),
      border: "none",
      separatorColor:this.themeService.theme.palette.getAccent200(),
      hoverBackground:""
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
  setScopeStyle(){
    let defaultStyle:ChangeScopeStyle = new ChangeScopeStyle({
      titleTextFont:  fontHelper(this.themeService.theme.typography.title1),
      titleTextColor: this.themeService.theme.palette.getAccent(),
      activeTextFont: fontHelper(this.themeService.theme.typography.subtitle1),
      activeTextColor:this.themeService.theme.palette.getAccent(),
      activeTextBackground: this.themeService.theme.palette.getAccent200(),
      arrowIconTint: this.themeService.theme.palette.getAccent900(),
      textFont: fontHelper(this.themeService.theme.typography.subtitle1),
      textColor:this.themeService.theme.palette.getAccent600(),
      optionBackground: this.themeService.theme.palette.getBackground(),
      optionBorder: "none",
      optionBorderRadius: "0",
      hoverTextFont: fontHelper(this.themeService.theme.typography.subtitle1),
      hoverTextColor:  this.themeService.theme.palette.getAccent900(),
      hoverTextBackground:  this.themeService.theme.palette.getAccent100(),
      buttonTextFont: fontHelper(this.themeService.theme.typography.title2),
      buttonTextColor: this.themeService.theme.palette.getAccent("dark"),
      buttonBackground: this.themeService.theme.palette.getPrimary(),
      closeIconTint: this.themeService.theme.palette.getPrimary(),
      background:this.themeService.theme.palette.getBackground(),
      border: `1px solid ${this.themeService.theme.palette.getAccent200()}`,
      borderRadius:"8px",
      height:"200px",
      width:"280px"
    })
    this.groupScopeStyle = {...defaultStyle,...this.groupScopeStyle}
  }
  membersStyle = () => {
    return {
      padding:this.groupMemberStyle.padding
    }
  }
  // styles
  backButtonStyle = ()=> {
    return {
     height:"24px",
     width:"24px",
     border:"none",
     borderRadius:"0",
     background:"transparent",
      buttonIconTint:this.groupMemberStyle.backButtonIconTint || this.themeService.theme.palette.getPrimary()
    }
  }
  closeButtonStyle = ()=> {
    return {
      height:"24px",
      width:"24px",
      border:"none",
      borderRadius:"0",
      background:"transparent",
      buttonIconTint:this.groupMemberStyle.closeButtonIconTint || this.themeService.theme.palette.getPrimary()
    }
  }
  wrapperStyle = () => {
    return {
      height: this.groupMemberStyle.height,
      width: this.groupMemberStyle.width,
      background: this.groupMemberStyle.background || this.themeService.theme.palette.getBackground(),
      border: this.groupMemberStyle.border,
      borderRadius: this.groupMemberStyle.borderRadius
    }
  }
  getScopeStyle = () => {
    return {
      textFont: this.groupScopeStyle.textFont,
      textColor: this.groupScopeStyle.textColor
    }
  }
}
