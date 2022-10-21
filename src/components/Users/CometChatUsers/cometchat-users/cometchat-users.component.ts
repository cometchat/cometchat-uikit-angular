import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  ViewChild,
} from "@angular/core";
import {  CometChatTheme, fontHelper, localize } from "../../../Shared";

import { CometChat } from "@cometchat-pro/chat";
import { styles } from "../../../Shared/UtilityComponents/CometChatListBase/interface";
import { styles as userListStyles } from "../../CometChatUserList/interface"
import { UserListConfiguration } from "../../../Shared/PrimaryComponents/CometChatConfiguration/UserListConfiguration";
import { checkHasOwnProperty } from "../../../Shared/Helpers/CometChatHelper";
import { CometChatUserListComponent } from "../../CometChatUserList/cometchat-user-list/cometchat-user-list.component";

/**
*
* CometChatUser is a wrapper component consists of CometChatListBaseComponent and CometChatUseListComponent.
*
* @version 1.0.0
* @author CometChatTeam
* @copyright © 2022 CometChat Inc.
*
*/
@Component({
  selector: "cometchat-users",
  templateUrl: "./cometchat-users.component.html",
  styleUrls: ["./cometchat-users.component.scss"],
  changeDetection: ChangeDetectionStrategy.Default,
})

export class CometChatUsersComponent implements OnInit, OnChanges {
  @ViewChild("userListRef", { static: false }) userListRef!: CometChatUserListComponent;
    /**
   * This properties will come from Parent.
   */
  @Input() title: string = localize("USERS");
  @Input() searchPlaceholder: string = "Search";
  @Input() activeUser: CometChat.User | null = null;
  @Input() style: styles = {
    width: "100%",
    height: "100%",
    background: "white",
    border: "none",
    borderRadius: "",
    titleFont: "700 22px Inter",
    titleColor: "black",
    backIconTint: "grey",
    searchBorder: "none",
    searchBorderRadius: "8px",
    searchBackground: "rgba(20, 20, 20, 0.04)",
    searchTextFont: "400 15px Inter",
    searchTextColor: "black",
    searchIconTint: "grey",
  };
  userListStyle: userListStyles = {
    width: "100%",
    height: "100%",
    background: "white",
    border: "",
    borderRadius: "",
    loadingIconTint: "grey",
    emptyStateTextFont: "700 22px Inter",
    emptyStateTextColor: "grey",
    errorStateTextFont: "500 15px Inter",
    errorStateTextColor: "red",
    sectionHeaderTextColor: "grey",
    sectionHeaderTextFont: "500 12px Inter"
  }
  @Input() backButtonIconURL: string = "assets/resources/backbutton.svg";
  @Input() searchIconURL: string = "assets/resources/search.svg";
  @Input() showBackButton: boolean = false;
  @Input() hideSearch: boolean = false;
  @Input() userListConfiguration: UserListConfiguration = new UserListConfiguration({});
     /**
     * Properties for internal use
     */
   @Input() theme: CometChatTheme = new CometChatTheme({});
  public loadingIconURL!: string;
  public customView:any = null;

  public  searchKeyword: string = "";
  public status: string = "";
  public friendsOnly: boolean = false;
  public hideBlockedUsers: boolean = true;
  public roles: string[] = [];
  public uids: string[] = [];
  public hideError: boolean = false
  public limit: number = 30;
  public tags: string[] = [];
  constructor() { }


  ngOnInit() {


  }
  ngOnChanges(changes: SimpleChanges): void {
    this.checkConfiguration()
    this.setTheme()
  }
  setTheme() {
    
    this.style.background = this.theme.palette.getBackground();
    this.style.titleFont = fontHelper(this.theme.typography.title1);
    this.style.titleColor = this.theme.palette.getAccent();
    this.style.searchBackground = this.theme.palette.getAccent50();
    this.style.searchTextColor = this.theme.palette.getAccent();
    this.style.searchIconTint = this.theme.palette.getAccent500();
    this.style.backIconTint = this.theme.palette.getAccent500();
    this.style.searchTextFont = fontHelper(this.theme.typography.subtitle2);
    this.userListStyle.errorStateTextFont = fontHelper(this.theme.typography.title1)
    this.userListStyle.errorStateTextColor = this.theme.palette.getAccent400();
    this.userListStyle.emptyStateTextFont = fontHelper(this.theme.typography.title1);
    this.userListStyle.emptyStateTextColor = this.theme.palette.getAccent400();
    this.userListStyle.background = this.theme.palette.getBackground();
    this.userListStyle.loadingIconTint = this.theme.palette.getAccent600();
    this.userListStyle.sectionHeaderTextColor = this.theme.palette.getAccent600();
    this.userListStyle.sectionHeaderTextFont = fontHelper(this.theme.typography.caption1);
  }
  checkConfiguration() {
    let defaultConfig = new UserListConfiguration({});
    if (this.userListConfiguration) {
      let config = this.userListConfiguration
      this.setUserListConfig(config, defaultConfig);
      
    }
    else {
      this.setUserListConfig(defaultConfig);
    }
  }
  searchUser =(name:string)=>{
    this.userListRef.searchUsers(name)
  }
  /**
   * @param  {UserListConfiguration} config
   * @param  {UserListConfiguration} defaultConfig?
   */
  setUserListConfig(config: UserListConfiguration, defaultConfig?: UserListConfiguration) {
    this.loadingIconURL = checkHasOwnProperty(config,"loadingIconURL") ? config.loadingIconURL : defaultConfig!.loadingIconURL;
    this.searchKeyword = checkHasOwnProperty(config,"searchKeyword") ? config.searchKeyword : defaultConfig!.searchKeyword;
    this.friendsOnly = checkHasOwnProperty(config,"friendsOnly") ? config.friendsOnly : defaultConfig!.friendsOnly;
    this.hideBlockedUsers = checkHasOwnProperty(config,"hideBlockedUsers") ? config.hideBlockedUsers : defaultConfig!.hideBlockedUsers;
    this.roles = checkHasOwnProperty(config,"roles") ?config.roles : defaultConfig!.roles;
    this.uids = checkHasOwnProperty(config,"uids") ? config.uids : defaultConfig!.uids;
    this.hideError = checkHasOwnProperty(config,"hideError") ? config.hideError : defaultConfig!.hideError;
    this.limit = checkHasOwnProperty(config,"limit") ? config.limit : defaultConfig!.limit;
    this.tags = checkHasOwnProperty(config,"tags") ? config.tags : defaultConfig!.tags;
    this.status = checkHasOwnProperty(config,"status") ? config.status : defaultConfig!.status;
    this.customView = checkHasOwnProperty(config, "customView") ? config.customView : defaultConfig!.customView;
  }
  usersWrapperStyle(){
    return {
      height:this.style.height,
      width:this.style.width,
      border:this.style.border || `1px solid ${this.theme.palette.getAccent400()}`,
      borderRadius:this.style.borderRadius,
      background:this.style.background || this.theme.palette.getBackground()
    }

  }
}
