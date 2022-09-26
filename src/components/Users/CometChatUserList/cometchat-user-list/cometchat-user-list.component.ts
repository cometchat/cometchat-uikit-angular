import {
  Component,
  Input,
  OnDestroy,
  OnInit,
  OnChanges,
  ChangeDetectorRef,
  SimpleChanges,
  ChangeDetectionStrategy,
  AfterContentInit,
} from "@angular/core";
import { CometChat } from "@cometchat-pro/chat";
import { CometChatTheme, DataItemConfiguration, fontHelper } from "../../../Shared";
import { CometChatWrapperComponent } from "../../../Shared/PrimaryComponents/CometChatTheme/CometChatThemeWrapper/cometchat-theme-wrapper.component";
import { UsersConstants } from "../../../Shared/Constants/UIKitConstants";
import { styles } from "../interface";
import { inputData, styles as dataItemStyle } from "../../../Shared/SDKDerivedComponents/CometChatDataItem/DataItemInterface";
import { CometChatUsersEvents } from "../../CometChatUsersEvents.service";
import { customView } from "../../../Shared/Types/interface";
/**
*
* CometChatUserList is a wrapper component consists of CometChatDataItem Component.
*
* @version 1.0.0
* @author CometChatTeam
* @copyright © 2022 CometChat Inc.
*
*/
@Component({
  selector: "cometchat-user-list",
  templateUrl: "./cometchat-user-list.component.html",
  styleUrls: ["./cometchat-user-list.component.scss"],
  changeDetection: ChangeDetectionStrategy.Default
})

export class CometChatUserListComponent implements OnInit, OnDestroy, OnChanges,AfterContentInit {
  /**
   * This properties will come from Parent.
   */
  @Input() limit: number = 30;
  @Input() searchKeyword: string = "";
  @Input() status: string = "";
  @Input() hideBlockedUsers: boolean = true;
  @Input() roles: string[] = [];
  @Input() tags: string[] = [];
  @Input() uids: string[] = [];
  @Input() style: styles = {
    width: "100%",
    height: "100%",
    background: "white",
    border: "",
    borderRadius: "16px",
    loadingIconTint: "grey",
    emptyStateTextFont: "700 22px Inter",
    emptyStateTextColor: "grey",
    errorStateTextFont: "700 22px Inter",
    errorStateTextColor: "grey",
    sectionHeaderTextColor: "grey",
    sectionHeaderTextFont: "500 12px Inter"
  };
  @Input() loadingIconURL: string = "assets/resources/wait.svg";
  @Input() emptyText: string = UsersConstants.NO_USERS_FOUND;
  @Input() errorText: string = UsersConstants.SOMETHING_WENT_WRONG;
  @Input() hideError: boolean = false;
  @Input() activeUser: CometChat.User | null = null;
  @Input() dataItemConfiguration: DataItemConfiguration = new DataItemConfiguration({});
  @Input() friendsOnly: boolean = false;
  @Input() customView!:customView;
  /**
   * Properties for internal use
   */
  public isError: boolean = false;
  public msgListenerId: string = UsersConstants.MESSAGE_ + new Date().getTime();
  public theme: any = new CometChatTheme({});
  public userListenerId: string = UsersConstants.USER_LIST_ + new Date().getTime();
  public inputData: inputData = {
    thumbnail: true,
    title: true,
    status: true,
    id: true
  };
  public dataItemStyle: dataItemStyle = {
    height: "52px",
    width: "100%",
    background: "",
    activeBackground: "",
    borderRadius: "",
    titleFont: "",
    titleColor: "",
    border: "1px solid rgb(222 222 222 / 46%)",
    subtitleFont: "",
    subtitleColor: "",
  }

  public loggedInUser: CometChat.User | null = null;
  public userSearches: boolean = false;
  public loader: Boolean = true;
  public usersNotFound: Boolean = false;
  public usersList: CometChat.User[] = [];
  public isActive: boolean = false;
  public usersRequest: any;
  public isOnBottom: boolean = false;
  public timeout: any;
  public USERS: String = UsersConstants.USERS;
  public SEARCH: String = UsersConstants.SEARCH;


  constructor(private ref: ChangeDetectorRef, private userEvents: CometChatUsersEvents) {
  }
  ngAfterContentInit(): void {
      if(this.usersList && this.usersList.length <=0){
      this.loader = true;
      this.usersRequest = this.getRequestBuilder();
      this.fetchNextUsertList()
    }
  }
  ngOnChanges(change: SimpleChanges) {
    if (!this.activeUser && !this.isOnBottom) {
      this.loader = true;
      this.fetchNextUsertList();
    }
    if (CometChatWrapperComponent.cometchattheme ) {
      this.theme = CometChatWrapperComponent.cometchattheme;
    }
    this.setThemeStyle();
    try {
      if (change["user"]) {
        if (
          change["user"].previousValue !== change["user"]?.currentValue
        ) {
          const userlist: CometChat.User[] = [...this.usersList];
          let userKey = userlist.findIndex(
            (u, k) => u.getUid() === change["user"]?.currentValue?.uid
          );
          //if found in the list, update user object
          if (userKey > -1) {
            let userObj = userlist[userKey];
            let newUserObj = Object.assign(
              {},
              userObj,
              change["user"]?.currentValue
            );
            userlist.splice(userKey, 1, newUserObj);
            this.usersList = [...userlist];
          }
        }
      }
    } catch (error:any) {
      this.userEvents.publishEvents(this.userEvents.onError, error)
    }
  }
  ngOnInit() {



    this.dataItemConfiguration.avatarConfiguration.height = "28px";
    this.dataItemConfiguration.avatarConfiguration.width = "28px";
    this.dataItemConfiguration.statusIndicatorConfiguration.height = "8px";
    this.dataItemConfiguration.statusIndicatorConfiguration.width = "8px";
    this.checkConfiguration()
    try {
      this.loader = true
      CometChat.getLoggedinUser().then(
        (user: CometChat.User | null) => {
          this.loggedInUser = user;
          this.attachListeners();
          // this.fetchNextUsertList();
        },
        (error) => {
          this.userEvents.publishEvents(this.userEvents.onError, error)
        }
      );
    } catch (error:any) {
      this.userEvents.publishEvents(this.userEvents.onError, error)
    }
  }
  getRequestBuilder() {
    let withTags:boolean = this.tags && this.tags.length > 0  ? true : false
    return new CometChat.UsersRequestBuilder()
      .friendsOnly(this.friendsOnly)
      .setLimit(this.limit)
      .setTags(this.tags)
      .withTags(withTags)
      .hideBlockedUsers(this.hideBlockedUsers)
      .setRoles(this.roles)
      .setSearchKeyword(this.searchKeyword)
      .setUIDs(this.uids)
      .setStatus(this.status)
      .build();
  }
  ngOnDestroy() {
    try {
      this.usersRequest = null;
      this.ref.detach();
      this.removeListener()
    } catch (error:any) {
      this.userEvents.publishEvents(this.userEvents.onError, error)
    }
  }
  removeListener() {
    CometChat.removeUserListener(this.userListenerId);
    this.userListenerId = "";
  }
  setThemeStyle() {
    this.dataItemStyle.background = this.theme.palette.getBackground();
    this.dataItemStyle.titleFont = fontHelper(this.theme.typography.title1);
    this.dataItemStyle.titleColor = this.theme.palette.getAccent();
    this.dataItemStyle.subtitleFont = fontHelper(this.theme.typography.subtitle2);
    this.dataItemStyle.subtitleColor = this.theme.palette.getAccent600();
    this.dataItemStyle.activeBackground = this.theme.palette.getAccent50()
  }
  /**
   * Search User Based on their Name
   * @param String searchKey
   */
  searchUsers(searchKey: any) {
    try {
      this.searchKeyword = searchKey
      this.usersNotFound = false;
      if (this.timeout) {
        clearTimeout(this.timeout);
      }
      this.userSearches = true;
      this.loader = true;
      this.timeout = setTimeout(() => {
        this.usersRequest = this.getRequestBuilder()
        //Empty Intial User List before searching user list according to search key
        this.usersList = [];
        this.fetchNextUsertList();
      }, 500);
    } catch (error:any) {
      this.userEvents.publishEvents(this.userEvents.onError, error)
      this.isError = true
    }
  }



  checkConfiguration() {
    let defaultConfig = new DataItemConfiguration({})
    if (this.dataItemConfiguration) {
      this.setDataItemConfiguration(this.dataItemConfiguration, defaultConfig)
    }
    else {
      this.setDataItemConfiguration(defaultConfig)
    }
  }
  setDataItemConfiguration(config: DataItemConfiguration, defaultConfig?: DataItemConfiguration) {
    this.inputData = config.inputData || defaultConfig?.inputData;
  }
  /**
   * @param  {any} config
   * @param  {any} defaultConfig
   */

  onClick(user: CometChat.User) {
    this.userEvents.publishEvents(this.userEvents.onUserClick, user)

  }
  /**
   * If User scrolls to the bottom of the current user list than fetch next items of the user list and append
   * @param Event e
   */
  handleScroll(e: any) {
    try {
      const bottom =
        Math.round(e.currentTarget.scrollHeight - e.currentTarget.scrollTop) ===
        Math.round(e.currentTarget.clientHeight);
      this.isOnBottom = bottom
      if (bottom) {   this.fetchNextUsertList() };
    } catch (error:any) {
      this.userEvents.publishEvents(this.userEvents.onError, error)
    }
  }
  /**
   * check is there is any active conversation and mark it as active
   * @param  {CometChat.User} user
   */
  IsUserActive(user: CometChat.User) {
    return this.activeUser && this.activeUser.getUid() == user.getUid() ? true : false;
  }
  /**
   * Get List of users that are users of the current user
   *
   */
  fetchNextUsertList() {
    try {
      this.loader = true;
      // this.usersRequest = this.getRequestBuilder();
      this.ref.detectChanges();
      this.usersRequest.fetchNext().then(
        (userList: any) => {
          this.isError = true
          if ((userList.length <= 0 && this.usersList?.length <= 0) || (this.userSearches && userList.length === 0 && this.usersList?.length <= 0)) {
            this.usersNotFound = true;
            this.loader = false;
            this.isError = false;
            this.ref.detectChanges();
          } else {
            this.usersNotFound = false;
            this.userSearches = false;
            this.usersList = [...this.usersList, ...userList];
            this.loader = false;
            this.isError = false;
            this.ref.detectChanges();
          }
        },
        (error: any) => {
          this.isError = true;
          this.loader = false;
          this.ref.detectChanges()
          this.userEvents.publishEvents(this.userEvents.onError, error)
        }
      );
    } catch (error:any) {
      this.userEvents.publishEvents(this.userEvents.onError, error)
    }
  }
  /**
   * This function updates the status ( online / offline ) , in real-time when getting signals from the listerners
   * @param {CometChat.User} user
   */
  updateUser = (user: CometChat.User) => {
    try {
      let userlist = [...this.usersList];
      //search for user
      let userKey = userlist.findIndex((u: CometChat.User, k) => u.getUid() == user.getUid());
      //if found in the list, update user object
      if (userKey > -1) {
        userlist.splice(userKey, 1, user);
        this.usersList = [...userlist];
        this.ref.detectChanges();
      }
    } catch (error:any) {
      this.userEvents.publishEvents(this.userEvents.onError, error)
    }
  };
  addUser = (user: CometChat.User) => {
    this.usersList.push(user);
    this.ref.detectChanges;
  }
  // adding listeners on init
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
  /**
  * Props dependent styles for the CometChatUserList.
  *
  */
  styles: any = {
    wrapperStyle: () => {
      return {
        height: this.style.height,
        width: this.style.width,
        background: this.style.background,
        border: this.style.border,
        borderRadius: this.style.borderRadius
      }
    },
    errorTextStyle: () => {
      return {
        font: this.style.errorStateTextFont,
        color: this.style.errorStateTextColor
      }
    },
    emptyTextStyle: () => {
      return {
        font: this.style.emptyStateTextFont,
        color: this.style.emptyStateTextColor
      }
    },
    loadingIconStyle: () => {
      return {
        WebkitMask: `url(${this.loadingIconURL}) center center no-repeat`,
        background: this.style.loadingIconTint
      }
    },
    alphabetStyle: () => {
      return {
        color: this.style.sectionHeaderTextColor,
        font: this.style.sectionHeaderTextFont
      }
    },
    userListStyles: () => {
      return {
        background: this.style.background
      }
    }
  }
}
