import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges, OnInit, SimpleChanges, TemplateRef } from '@angular/core';
import { CometChat } from '@cometchat-pro/chat';
import {  States, TitleAlignment,SelectionMode ,GroupsStyle ,  ListStyle, BaseStyle} from "uikit-utils-lerna";
import {AvatarStyle,ListItemStyle} from 'my-cstom-package-lit'
import { Subscription } from 'rxjs';
import { CometChatThemeService } from '../../CometChatTheme.service';
import { CometChatOption, localize, CometChatGroupEvents, IGroupMemberAdded, IGroupMemberKickedBanned, IGroupMemberJoined, IOwnershipChanged, IGroupLeft, CometChatUIKitConstants, fontHelper } from 'uikit-resources-lerna';
/**
*
* CometChatGroups is a wrapper component which consists of CometChatListBaseComponent and CometChatGroupListComponent.
*
* @version 1.0.0
* @author CometChatTeam
* @copyright © 2022 CometChat Inc.
*
*/
@Component({
  selector: "cometchat-groups",
  templateUrl: "./cometchat-groups.component.html",
  styleUrls: ["./cometchat-groups.component.scss"],
  changeDetection:ChangeDetectionStrategy.OnPush
})
export class CometChatGroupsComponent implements OnInit,OnChanges {
  @Input() groupsRequestBuilder!: CometChat.GroupsRequestBuilder;
  @Input() searchRequestBuilder!: CometChat.GroupsRequestBuilder;

  @Input() subtitleView!: TemplateRef<any>;
  @Input() listItemView!: TemplateRef<any>;
  @Input() menu!: TemplateRef<any>;
  @Input()   options!: ((member:CometChat.Group)=>CometChatOption[]) | null;
  @Input() activeGroup!: CometChat.Group | null;
  @Input() hideSeparator: boolean = false;
  @Input() selectionMode: SelectionMode = SelectionMode.none;
  @Input() searchPlaceholder: string = "Search Groups";
  @Input() hideError: boolean = false;
  @Input() searchIconURL: string = "assets/search.svg";
  @Input() hideSearch: boolean = false;
  @Input() title: string = localize("GROUPS");
  @Input() onError:(error:any)=>void = (error:any)=>{
    console.log(error)
  }
  @Input() onSelect!: (group:CometChat.Group)=>void;
  @Input() emptyStateView!: TemplateRef<any>;
  @Input() errorStateView!: TemplateRef<any>;
  @Input() loadingIconURL: string = "assets/Spinner.svg";
  @Input() privateGroupIcon:string ="assets/Private.svg";
  @Input() protectedGroupIcon:string = "assets/Locked.svg";
  @Input() loadingStateView!: TemplateRef<any>;
  @Input() emptyStateText: string = localize("NO_GROUPS_FOUND")
  @Input() errorStateText: string = localize("SOMETHING_WRONG");
  @Input() titleAlignment: TitleAlignment = TitleAlignment.left;
  selectionmodeEnum: typeof SelectionMode = SelectionMode;
  public state: States = States.loading;
  @Input() statusIndicatorStyle: any = {
    height: "12px",
    width: "12px",
    borderRadius: "16px"
  };
  @Input() avatarStyle: AvatarStyle = {
    borderRadius: "16px",
    width: "32px",
    height: "32px",

  };
  @Input() groupsStyle: GroupsStyle = {
    width: "100%",
    height: "100%",
    background: "",
    border: "",
    borderRadius: "",
    titleTextFont: "",
    titleTextColor: "",
    subTitleTextFont: "",
    subTitleTextColor: "",
    searchPlaceholderTextFont: "",
    searchPlaceholderTextColor: "",
    searchTextFont: "",
    searchTextColor: "",
    emptyStateTextFont: "",
    emptyStateTextColor: "",
    errorStateTextFont: "",
    errorStateTextColor: "",
    loadingIconTint: "",
    searchIconTint: "",
    searchBorder: "",
    searchBorderRadius: "",
    searchBackground: "",
    separatorColor: "rgb(222 222 222 / 46%)",
    privateGroupIconBackground: "",
    passwordGroupIconBackground: "",
  };
  @Input() listItemStyle: ListItemStyle = {};
  @Input() onItemClick!:(group:CometChat.Group)=>void;
  groupsRequest: any
  listStyle:ListStyle = {}
  public limit:number = 30;
  searchKeyword: string = "";
  public timeout: any;
  public groupsList: CometChat.Group[] = [];
  public groupsListenerId: string = "groupsList_" + new Date().getTime();
  public loggedInUser: CometChat.User | null = null;
  public statusColor: any = {
    private: "",
    password: "#F7A500",
    public: ""
  }
  onScrolledToBottom:any = null
  ccGroupMemberAdded!:Subscription;
  ccGroupLeft!:Subscription;
  ccGroupMemberJoined!:Subscription;
  ccGroupMemberKicked!:Subscription;
  ccGroupMemberBanned!:Subscription;
  ccOwnershipChanged!:Subscription;
  ccGroupDeleted!:Subscription;
  ccGroupCreated!:Subscription;
  constructor(private ref: ChangeDetectorRef,private themeService:CometChatThemeService) { this.state = States.loading }
  ngOnChanges(changes: SimpleChanges): void {

  }
  ngOnInit(): void {
    this.onScrolledToBottom = this.fetchNextGroupList
    this.setThemeStyle();
    this.subscribeToEvents()
    CometChat.getLoggedinUser().then((user: CometChat.User | null) => {
      this.loggedInUser = user;
    }).catch((error:CometChat.CometChatException)=>{
      if(this.onError){
        this.onError(error)
      }
    })
    this.state = States.loading
    this.groupsRequest = this.getRequestBuilder()
    this.fetchNextGroupList()
    this.attachListeners();


  }
      // subscribe to global events
      subscribeToEvents() {
        this.ccGroupDeleted = CometChatGroupEvents.ccGroupDeleted.subscribe((group:CometChat.Group) => {
          this.removeGroup(group)
          if(this.activeGroup && group.getGuid() == this.activeGroup.getGuid()){
            this.activeGroup = null;
            this.ref.detectChanges()
          }
       })
       this.ccGroupCreated = CometChatGroupEvents.ccGroupCreated.subscribe((group:CometChat.Group) => {
        this.addGroup(group)
       if(!this.activeGroup){
      this.activeGroup = group
       }
     })
       this.ccGroupMemberAdded = CometChatGroupEvents.ccGroupMemberAdded.subscribe((item: IGroupMemberAdded) => {
             if(this.activeGroup && this.activeGroup.getGuid() == item?.userAddedIn!.getGuid()){
               this.activeGroup == item?.userAddedIn;
               this.ref.detectChanges()
             }
             this.updateGroup(item?.userAddedIn!)
       })
       this.ccGroupMemberBanned = CometChatGroupEvents.ccGroupMemberBanned.subscribe((item: IGroupMemberKickedBanned) => {
         if(this.activeGroup && this.activeGroup.getGuid() == item?.kickedFrom!.getGuid()){
           this.activeGroup == item?.kickedFrom;
           this.ref.detectChanges()
         }
         this.updateGroup(item?.kickedFrom!)
       })
       this.ccGroupMemberJoined = CometChatGroupEvents.ccGroupMemberJoined.subscribe((item: IGroupMemberJoined) => {
         if(this.activeGroup && this.activeGroup.getGuid() == item?.joinedGroup!.getGuid()){
           this.activeGroup == item?.joinedGroup;
           this.ref.detectChanges()
         }
         this.updateGroup(item?.joinedGroup!)
       })
       this.ccGroupMemberKicked = CometChatGroupEvents.ccGroupMemberKicked.subscribe((item: IGroupMemberKickedBanned) => {
         if(this.activeGroup && this.activeGroup.getGuid() == item?.kickedFrom!.getGuid()){
           this.activeGroup == item?.kickedFrom;
           this.ref.detectChanges()
         }
         this.updateGroup(item?.kickedFrom!)
       })
       this.ccOwnershipChanged = CometChatGroupEvents.ccOwnershipChanged.subscribe((item: IOwnershipChanged) => {
         if(this.activeGroup && this.activeGroup.getGuid() == item?.group!.getGuid()){
           this.activeGroup == item?.group;
           this.ref.detectChanges();
         }
         this.updateGroup(item?.group!)
       })
       this.ccGroupLeft = CometChatGroupEvents.ccGroupLeft.subscribe((item: IGroupLeft) => {
        if(item.leftGroup.getType() == CometChatUIKitConstants.GroupTypes.private){
          this.removeGroup(item.leftGroup)
        }
        else{
          this.updateGroup(item.leftGroup)
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
  ngOnDestroy() {
    this.unsubscribeToEvents()
    this.groupsRequest = null;
    this.ref.detach();
    this.removeListener();
  }
  /**
   * @param  {CometChat.Group} group
   */
  updateGroup(group: CometChat.Group) {
    let groupsList = [...this.groupsList];
    //search for group
    let groupKey = groupsList.findIndex((g, k) => g.getGuid() === group.getGuid());
    if (groupKey > -1) {
      groupsList.splice(groupKey, 1, group);
      this.groupsList = groupsList;
      this.ref.detectChanges();
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
  attachListeners() {
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
          this.updateGroup(changedGroup)
        },
        onGroupMemberKicked: (message: CometChat.Action, kickedUser: CometChat.User, kickedBy: CometChat.User, kickedFrom: CometChat.Group) => {
          if (kickedUser.getUid() == this.loggedInUser?.getUid()) {
            kickedFrom.setHasJoined(false)
          }
          this.updateGroup(kickedFrom)
        },
        onGroupMemberBanned: (message: CometChat.Action, bannedUser: CometChat.User, bannedBy: CometChat.User, bannedFrom: CometChat.Group) => {
          if (bannedUser.getUid() == this.loggedInUser?.getUid()) {
            this.removeGroup(bannedFrom)
          }
          else {
            this.updateGroup(bannedFrom)
          }
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
          this.addGroup(unbannedFrom)
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
          this.updateGroup(userAddedIn)
        },
        onGroupMemberLeft: (message: CometChat.Action, leavingUser: CometChat.User, group: CometChat.Group) => {
          if (leavingUser.getUid() == this.loggedInUser?.getUid()) {
            group.setHasJoined(false)
          }
          this.updateGroup(group)
        },
        onGroupMemberJoined: (message: CometChat.Action, joinedUser: CometChat.User, joinedGroup: CometChat.Group) => {
          if (joinedUser.getUid() == this.loggedInUser?.getUid()) {
            joinedGroup.setHasJoined(true)
          }
          this.updateGroup(joinedGroup)
        },
      })
    );
  }
  removeListener() {
    CometChat.removeGroupListener(this.groupsListenerId);
  }
  fetchNextGroupList = () => {
    this.onScrolledToBottom = null
    this.state = States.loading
    this.ref.detectChanges()
    if(this.groupsRequest && this.groupsRequest?.pagination && (this.groupsRequest.pagination?.current_page == 0 || this.groupsRequest.pagination?.current_page !=  this.groupsRequest.pagination.total_pages)){
      this.onScrolledToBottom = this.fetchNextGroupList
    try {
      this.groupsRequest.fetchNext().then(
        (groupList: CometChat.Group[]) => {
          if ((groupList.length <= 0 && this.groupsList?.length <= 0) || (groupList.length === 0 && this.groupsList?.length <= 0)) {
            this.state = States.empty;
            this.ref.detectChanges();
          } else {
            this.state = States.loaded
            this.groupsList = [...this.groupsList, ...groupList];
            this.ref.detectChanges();
          }
        },
        (error: any) => {
          this.state = States.error
          this.ref.detectChanges();
        }
      );
    } catch (error: any) {
      this.state = States.error
      this.ref.detectChanges();
    }

  }
  else{
    this.state = States.loaded;
    this.ref.detectChanges()
  }
  }
  /**
   * @param  {CometChat.Group} group
   */
  onClick = (group: CometChat.Group) => {
    if(this.onItemClick){
      this.onItemClick(group)
    }
  }
  /**
   * @param  {CometChat.Group} group
   */
   getStatusIndicatorColor(group: CometChat.Group) {
    return (this.statusColor as any)[(group?.getType() as string)];
  }
  /**
   * @param  {CometChat.Group} group
   */
  getMemberCount = (group: CometChat.Group) => {
    return group.getMembersCount() > 1 ? group.getMembersCount() + " " + localize("MEMBERS") : group.getMembersCount() + " " + localize("MEMBER")
  }
  /**
   * @param  {CometChat.Group} group
   */
  getActiveGroup = (group: CometChat.Group) => {
   if(this.selectionMode == SelectionMode.none || !this.selectionMode ){
    if (group.getGuid() == this.activeGroup?.getGuid()) {


      return true;
    }
    else {
      return false
    }
   }
   else {
     return false
   }
  }
  getRequestBuilder() {
    if(this.searchRequestBuilder){
      return this.searchRequestBuilder.build()
    }
    else if (this.groupsRequestBuilder) {
      return this.groupsRequestBuilder.build();
    }
    else {
      return new CometChat.GroupsRequestBuilder()
        .setLimit(this.limit)
        .setSearchKeyword(this.searchKeyword)
        .build();
    }
  }
  /**
   * @param  {CometChat.Group} group
   */
  removeGroup(group: CometChat.Group) {
    let groupsList = [...this.groupsList];
    //search for group
    let groupKey = groupsList.findIndex((g, k) => g.getGuid() === group.getGuid());
    if (groupKey > -1) {
      groupsList.splice(groupKey, 1);
      this.groupsList = groupsList;
      this.ref.detectChanges();
    }
  }
  /**
   * addGroup
   * @param group
   */
  addGroup(group: CometChat.Group) {
    this.groupsList.unshift(group);
    this.ref.detectChanges()
  }
  /**
   * @param  {string} key
   */
   onSearch = (key: string) => {
    try {
      this.searchKeyword = key;
      clearTimeout(this.timeout);
      this.timeout = setTimeout(() => {
        this.groupsRequest = this.searchRequestBuilder ? this.searchRequestBuilder.setSearchKeyword(this.searchKeyword).build() : this.getRequestBuilder();
        this.groupsList = [];
        this.ref.detectChanges();
        this.fetchNextGroupList();
      }, 500);
    } catch (error) {
      if(this.onError){
        this.onError(error)
      }
    }
  };

  groupStyle = () => {
    return {
      height: this.groupsStyle.height,
      width: this.groupsStyle.width,
      background: this.groupsStyle.background,
      border: this.groupsStyle.border,
      borderRadius: this.groupsStyle.borderRadius
    }
  }
  setThemeStyle() {
    this.setListItemStyle()
    this.setAvatarStyle()
    this.setStatusStyle()
    this.setGroupsStyle()
    this.statusColor.private =  this.groupsStyle.privateGroupIconBackground ?? this.themeService.theme.palette.getSuccess();
    this.statusColor.password = this.groupsStyle.passwordGroupIconBackground ?? "#F7A500";
    this.listStyle ={
      titleTextFont : this.groupsStyle.titleTextFont,
      titleTextColor : this.groupsStyle.titleTextColor,
      emptyStateTextFont : this.groupsStyle.emptyStateTextFont,
      emptyStateTextColor : this.groupsStyle.emptyStateTextColor,
      errorStateTextFont : this.groupsStyle.errorStateTextFont,
      errorStateTextColor : this.groupsStyle.errorStateTextColor,
      loadingIconTint : this.groupsStyle.loadingIconTint,
      separatorColor : this.groupsStyle.separatorColor,
      searchIconTint : this.groupsStyle.searchIconTint,
      searchBorder : this.groupsStyle.searchBorder,
      searchBorderRadius : this.groupsStyle.searchBorderRadius,
      searchBackground : this.groupsStyle.searchBackground,
      searchPlaceholderTextFont : this.groupsStyle.searchPlaceholderTextFont,
      searchPlaceholderTextColor : this.groupsStyle.searchPlaceholderTextColor,
      searchTextFont : this.groupsStyle.searchTextFont,
      searchTextColor : this.groupsStyle.searchTextColor,
    }
  }
  setListItemStyle(){
    let defaultStyle:ListItemStyle = new ListItemStyle({
      height: "45px",
      width: "100%",
      background: this.themeService.theme.palette.getBackground(),
      activeBackground: this.themeService.theme.palette.getAccent100(),
      borderRadius: "0",
      titleFont: fontHelper(this.themeService.theme.typography.title2),
      titleColor: this.themeService.theme.palette.getAccent(),
      border: "none",
      separatorColor:this.themeService.theme.palette.getAccent200(),
      hoverBackground:this.themeService.theme.palette.getAccent50()
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
  setGroupsStyle(){
    let defaultStyle:GroupsStyle = new GroupsStyle({
      subTitleTextFont: fontHelper(this.themeService.theme.typography.subtitle2),
      subTitleTextColor: this.themeService.theme.palette.getAccent600(),
      background:this.themeService.theme.palette.getBackground(),
      border:`1px solid ${this.themeService.theme.palette.getAccent50()}`,
      titleTextFont:fontHelper(this.themeService.theme.typography.title1),
      titleTextColor:this.themeService.theme.palette.getAccent(),
      emptyStateTextFont:fontHelper(this.themeService.theme.typography.title1),
      emptyStateTextColor:this.themeService.theme.palette.getAccent600(),
      errorStateTextFont:fontHelper(this.themeService.theme.typography.title1),
      errorStateTextColor:this.themeService.theme.palette.getAccent600(),
      loadingIconTint:this.themeService.theme.palette.getAccent600(),
      separatorColor:this.themeService.theme.palette.getAccent400(),
      privateGroupIconBackground:this.themeService.theme.palette.getSuccess(),
      passwordGroupIconBackground:"RGB(247, 165, 0)",
      searchIconTint:this.themeService.theme.palette.getAccent600(),
      searchPlaceholderTextColor:this.themeService.theme.palette.getAccent600(),
      searchBackground:this.themeService.theme.palette.getAccent100(),
      searchPlaceholderTextFont:fontHelper(this.themeService.theme.typography.text3),
      searchTextColor:this.themeService.theme.palette.getAccent600(),
      searchTextFont:fontHelper(this.themeService.theme.typography.text3)
    })
    this.groupsStyle = {...defaultStyle,...this.groupsStyle}
  }
  subtitleStyle = () => {
    return {
      font: this.groupsStyle.subTitleTextFont,
      color: this.groupsStyle.subTitleTextColor
    }
  }
}