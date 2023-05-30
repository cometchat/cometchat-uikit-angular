import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit, TemplateRef } from '@angular/core';
import { CometChat } from '@cometchat-pro/chat';

import {AvatarStyle,BaseStyle,ListItemStyle} from 'my-cstom-package-lit'
import { Subscription } from 'rxjs';
import { CometChatOption, SelectionMode, localize, TitleAlignment, States, CometChatUserEvents, CometChatUIKitConstants, fontHelper } from 'uikit-resources-lerna';
import { UsersStyle, ListStyle } from 'uikit-utils-lerna';
import { CometChatThemeService } from '../../CometChatTheme.service';
@Component({
  selector: 'cometchat-users',
  templateUrl: './cometchat-users.component.html',
  styleUrls: ['./cometchat-users.component.scss'],
  changeDetection:ChangeDetectionStrategy.OnPush
})
export class CometChatUsersComponent implements OnInit {
  @Input() usersRequestBuilder!: CometChat.UsersRequestBuilder;
  @Input() searchRequestBuilder!: CometChat.UsersRequestBuilder;
  @Input() subtitleView!: TemplateRef<any>;
  @Input() disableUsersPresence: boolean = false;
  @Input() listItemView!: TemplateRef<any>;
  @Input() menu!: TemplateRef<any>;
  @Input() options!: ((member:CometChat.User)=>CometChatOption[]) | null;
  @Input() activeUser!: CometChat.User | null;
  @Input() hideSeparator: boolean = false;
  @Input() searchPlaceholder: string = localize("SEARCH");
  @Input() hideError: boolean = false;
  @Input() selectionMode: SelectionMode = SelectionMode.none;
  @Input() searchIconURL: string = "assets/search.svg";
  @Input() hideSearch: boolean = false;
  @Input() title: string = localize("USERS");
  @Input() onError:(error:any)=>void = (error:any)=>{
    console.log(error)
  }
  @Input() emptyStateView!: TemplateRef<any>;
  @Input() onSelect!: (user:CometChat.User)=> void;
  @Input() errorStateView!: TemplateRef<any>;
  @Input() loadingIconURL: string = "assets/Spinner.svg";
  @Input() showSectionHeader: boolean = true;
  @Input() sectionHeaderField: string = "name"
  @Input() loadingStateView!: TemplateRef<any>;
  @Input() emptyStateText: string = localize("NO_USERS_FOUND")
  @Input() errorStateText: string = localize("SOMETHING_WRONG");
  @Input() titleAlignment: TitleAlignment = TitleAlignment.left
  @Input() usersStyle: UsersStyle = {
    width: "100%",
    height: "100%",
    background: "",
    border: "",
    borderRadius: "",
    titleTextFont: "",
    titleTextColor: "",
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
    onlineStatusColor: "",
    separatorColor: "rgb(222 222 222 / 46%)",
    sectionHeaderTextFont: "",
    sectionHeaderTextColor: ""
  };
  @Input() listItemStyle: ListItemStyle = {
    height: "100%",
    width: "100%",
    background: "",
    activeBackground: "",
    borderRadius: "grey",
    titleFont: "",
    titleColor: "",
    border: "",
    separatorColor: "rgb(222 222 222 / 46%)"
  };
  @Input() statusIndicatorStyle: BaseStyle = {
    height: "10px",
    width: "10px",
    borderRadius: "16px"
  };
  @Input() avatarStyle: AvatarStyle = {
    borderRadius: "16px",
    width: "28px",
    height: "28px",

  };
  @Input() onItemClick!:(user:CometChat.User)=>void;
  searchKeyword: string = "";
  userChecked:string = "";
  listStyle:ListStyle = {}
  public usersRequest: any;
  public state: States = States.loading;
  public timeout: any;
  selectionmodeEnum: typeof SelectionMode = SelectionMode;
  public usersList: CometChat.User[] = [];
  public limit:number = 30;
  public userListenerId: string = "userlist_" + new Date().getTime();
  loggedInUser!: CometChat.User | null;
       /**
     * Events
     */
        ccUserBlocked!:Subscription;
        ccUserUnBlocked!:Subscription;
        onScrolledToBottom:any = null
  constructor(private ref: ChangeDetectorRef,private themeService:CometChatThemeService) { this.state = States.loading }
  ngOnInit(): void {
    this.onScrolledToBottom = this.fetchNextUsersList
    this.setThemeStyle()
    this.subscribeToEvents()
    CometChat.getLoggedinUser().then((user: CometChat.User | null) => {
      this.loggedInUser = user;
    }).catch((error:CometChat.CometChatException)=>{
      if(this.onError){
        this.onError(error)
      }
    })
    this.state = States.loading
    this.usersRequest = this.getRequestBuilder();
    this.fetchNextUsersList()
    this.attachListeners()

  }
  // subscribe to global events
  subscribeToEvents() {
    this.ccUserBlocked = CometChatUserEvents.ccUserBlocked.subscribe((user:CometChat.User) => {
       if(this.activeUser && user.getUid() == this.activeUser.getUid()){
         this.activeUser = user;
         this.updateUser(user)
         this.ref.detectChanges()
       }
    })
    this.ccUserUnBlocked = CometChatUserEvents.ccUserUnblocked.subscribe((user:CometChat.User) => {
      if(this.activeUser && user.getUid() == this.activeUser.getUid()){
        this.activeUser = user;
        this.updateUser(user)
        this.ref.detectChanges()
      }
    })

  }
  unsubscribeToEvents() {
    this.ccUserBlocked?.unsubscribe();
    this.ccUserUnBlocked?.unsubscribe();
  }
  ngOnDestroy() {
    this.usersRequest = null;
    this.ref.detach();
    this.removeListener();
    this.state = States.loaded;
    this.unsubscribeToEvents()

  }
  isUserSelected(user:CometChat.User){
   return user.getUid() === this.userChecked

  }
  /**
   * @param  {CometChat.User} user
   */
  onClick = (user: CometChat.User) => {
    if(this.onItemClick){
      this.onItemClick(user)
    }
  }
  /**
   * @param  {CometChat.User} user
   */
  getActiveUser = (user: CometChat.User) => {
   if(this.selectionMode == SelectionMode.none || !this.selectionMode ){
    if (user.getUid() == this.activeUser?.getUid()) {
      return true;
    }
    else {
      return false
    }
   }
   else return false;
  }
  /**
   * @param  {CometChat.User} user
   */
   getStatusIndicatorColor = (user: CometChat.User) => {
    if (!this.disableUsersPresence) {
      if (user?.getStatus() == CometChatUIKitConstants.userStatusType.online) {
        return this.usersStyle.onlineStatusColor || this.themeService.theme.palette.getSuccess()
      }
      else {
        return null
      }
    }
    return null
  }
  /**
   * @param  {CometChat.User} user
   */
  updateUser = (user: CometChat.User) => {
    let userlist = [...this.usersList];
    //search for user
    let userKey = userlist.findIndex((u: CometChat.User, k) => u.getUid() == user.getUid());
    //if found in the list, update user object
    if (userKey > -1) {
      userlist.splice(userKey, 1, user);
      this.usersList = [...userlist];
      this.ref.detectChanges();
    }
  };
  attachListeners() {
    //Attaching User Listeners to dynamilcally update when a user comes online and goes offline
    CometChat.addUserListener(
      this.userListenerId,
      new CometChat.UserListener({
        onUserOnline: (onlineUser: CometChat.User) => {
          /* when someuser/friend comes online, user will be received here */
          this.updateUser(onlineUser);
        },
        onUserOffline: (offlineUser: CometChat.User) => {
          /* when someuser/friend went offline, user will be received here */
          this.updateUser(offlineUser);
        },
      })
    );
  }
  removeListener() {
    CometChat.removeUserListener(this.userListenerId);
    this.userListenerId = "";
  }
  addMembersToList = (user:CometChat.User)=>{
    this.userChecked = user.getUid();
    this.ref.detectChanges();
    if(this.onSelect){
      this.onSelect(user)
    }
  }
  fetchNextUsersList = () => {
    this.onScrolledToBottom = null
   if(this.usersRequest && this.usersRequest.pagination && (this.usersRequest.pagination.current_page == 0 || this.usersRequest.pagination.current_page !=  this.usersRequest.pagination.total_pages)){
    this.onScrolledToBottom = this.fetchNextUsersList
    this.state = States.loading
    this.ref.detectChanges()
    try {
      this.usersRequest.fetchNext().then(
        (userList: CometChat.User[]) => {
          this.state = States.loading
          if ((userList.length <= 0 && this.usersList?.length <= 0) || (userList.length === 0 && this.usersList?.length <= 0)) {
            this.state = States.empty
            this.ref.detectChanges();
          } else {
            this.state = States.loaded
            this.usersList = [...this.usersList, ...userList];
            this.ref.detectChanges();
          }
        },
        (error: any) => {
          this.state = States.error
          this.ref.detectChanges()
        }
      );
    } catch (error: any) {
      this.state = States.error
      this.ref.detectChanges()
    }
   }
   else{
    this.state = States.loaded;
    this.ref.detectChanges()
   }
  }
  getRequestBuilder() {
    if(this.searchRequestBuilder){
      return this.searchRequestBuilder.build()
    }
    else if (this.usersRequestBuilder) {
      return this.usersRequestBuilder.build();
    }
    else {
      return new CometChat.UsersRequestBuilder()
        .friendsOnly(false)
        .setLimit(this.limit)
        .setSearchKeyword(this.searchKeyword)
        .build();
    }
  }
  /**
   * @param  {string} key
   */
   onSearch = (key: string) => {
    try {

      this.searchKeyword = key;
      clearTimeout(this.timeout);
      this.timeout = setTimeout(() => {
        this.usersRequest = this.searchRequestBuilder ? this.searchRequestBuilder.setSearchKeyword(this.searchKeyword).build() : this.getRequestBuilder();
        this.usersList = [];
        this.ref.detectChanges();
        this.fetchNextUsersList();
      }, 500);
    } catch (error) {
      if(this.onError){
        this.onError(error)
      }
    }
  };
  setThemeStyle() {
    this.setUsersStyle()
    this.setListItemStyle()
    this.setAvatarStyle()
    this.setStatusStyle()

    this.listStyle ={
      titleTextFont : this.usersStyle.titleTextFont,
      titleTextColor : this.usersStyle.titleTextColor,
      emptyStateTextFont : this.usersStyle.emptyStateTextFont,
      emptyStateTextColor : this.usersStyle.emptyStateTextColor,
      errorStateTextFont : this.usersStyle.errorStateTextFont,
      errorStateTextColor : this.usersStyle.errorStateTextColor,
      loadingIconTint : this.usersStyle.loadingIconTint,
      separatorColor : this.usersStyle.separatorColor,
      searchIconTint : this.usersStyle.searchIconTint,
      searchBorder : this.usersStyle.searchBorder,
      searchBorderRadius : this.usersStyle.searchBorderRadius,
      searchBackground : this.usersStyle.searchBackground,
      searchPlaceholderTextFont : this.usersStyle.searchPlaceholderTextFont,
      searchPlaceholderTextColor : this.usersStyle.searchPlaceholderTextColor,
      searchTextFont : this.usersStyle.searchTextFont,
      searchTextColor : this.usersStyle.searchTextColor,
      sectionHeaderTextColor:this.usersStyle.sectionHeaderTextColor,
      sectionHeaderTextFont:this.usersStyle.sectionHeaderTextFont
    }
    this.ref.detectChanges()
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
      width: "28px",
      height: "28px",
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
  setUsersStyle(){
    let defaultStyle:UsersStyle = new UsersStyle({
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
      onlineStatusColor:this.themeService.theme.palette.getSuccess(),
      sectionHeaderTextColor:this.themeService.theme.palette.getAccent600(),
      sectionHeaderTextFont:fontHelper(this.themeService.theme.typography.subtitle2),
      searchIconTint:this.themeService.theme.palette.getAccent600(),
      searchPlaceholderTextColor:this.themeService.theme.palette.getAccent600(),
      searchBackground:this.themeService.theme.palette.getAccent100(),
      searchPlaceholderTextFont:fontHelper(this.themeService.theme.typography.text3),
      searchTextColor:this.themeService.theme.palette.getAccent600(),
      searchTextFont:fontHelper(this.themeService.theme.typography.text3)
    })
    this.usersStyle = {...defaultStyle,...this.usersStyle}
  }
  userStyle = () => {
    return {
      height: this.usersStyle.height,
      width: this.usersStyle.width,
      background: this.usersStyle.background,
      border: this.usersStyle.border,
      borderRadius: this.usersStyle.borderRadius
    }
  }
}
