import { Component, OnInit, OnDestroy, Input, OnChanges, SimpleChanges, ChangeDetectorRef } from "@angular/core";
import { CometChat } from "@cometchat-pro/chat";
import { GroupsConstants } from "../../../Shared/Constants/UIKitConstants";
import { localize } from "../../../Shared/PrimaryComponents/CometChatLocalize/cometchat-localize";
import {DataItemConfiguration} from '../../../Shared/PrimaryComponents/CometChatConfiguration/DataItemConfiguration'
import { CometChatTheme,fontHelper } from "../../../Shared/PrimaryComponents/CometChatTheme/CometChatTheme";
import { inputData } from "../../../Shared/SDKDerivedComponents/CometChatDataItem/DataItemInterface";
import { styles as dataItemStyle } from "../../../Shared/SDKDerivedComponents/CometChatDataItem/DataItemInterface"
import {  groupListStyle } from "../interface";
import { customView } from "../../../Shared/Types/interface";
import { CometChatGroupEvents } from "../../CometChatGroupEvents.service";
import { CometChatWrapperComponent } from "../../../Shared/PrimaryComponents/CometChatTheme/CometChatThemeWrapper/cometchat-theme-wrapper.component";
/**
*
* CometChatGroupList is a wrapper component consists of CometChatDataItem Component.
*
* @version 1.0.0
* @author CometChatTeam
* @copyright © 2022 CometChat Inc.
*
*/
@Component({
  selector: "cometchat-group-list",
  templateUrl: "./cometchat-group-list.component.html",
  styleUrls: ["./cometchat-group-list.component.scss"],
})
export class CometChatGroupListComponent implements OnInit, OnDestroy, OnChanges {
  /**
   * This properties will come from Parent.
   */
  @Input() limit: number = 30;
  @Input() searchKeyword: string = "";
  @Input() joinedOnly: boolean = false;
  @Input() tags: string[] = [];
  @Input() style: groupListStyle = {
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
  };
  @Input() loadingIconURL: string = "assets/resources/wait.svg";
  @Input() customView!: customView;
  @Input() emptyText: string = localize("NO_GROUPS_FOUND");
  @Input() errorText: string = localize("SOMETHING_WRONG");
  @Input() hideError: boolean = false;
  @Input() activeGroup: CometChat.Group | null = null;
  @Input() dataItemConfiguration: DataItemConfiguration = new DataItemConfiguration({})
  /**
  * Properties for internal use
  */
  public theme: any = new CometChatTheme({});
  public loader: boolean = true;
  public isError: boolean = false;
  public isEmpty: boolean = false;
  public inputData: inputData = {
    thumbnail: true,
    status: true,
    title: true,
    subtitle: "",
    id: false,
  };
  public dataItemStyle: dataItemStyle = {
    height: "",
    width: "",
    background: "",
    activeBackground: "",
    borderRadius: "",
    titleFont: "",
    titleColor: "",
    border: "1px solid #f8f8f8",
    subtitleFont: "",
    subtitleColor: "",
  };
  public msgListenerId = GroupsConstants.MESSAGE_ + new Date().getTime();
  public timeout: any;
  public loggedInUser: CometChat.User | null = null;
  public groupList: CometChat.Group[] = [];
  public groupRequest: any = null;
  public groupListenerId = GroupsConstants.GROUP_LIST_ + new Date().getTime();
  public openCreateGroupView: boolean = false;
  public GROUPS: String = localize("GROUPS");
  public SEARCH: String = localize("SEARCH");
  public isBottom: boolean = false;
  constructor(private ref: ChangeDetectorRef, private groupEvents: CometChatGroupEvents) {
  }
  ngOnChanges(change: SimpleChanges) {
    if (!this.isBottom && !this.activeGroup) {
      this.getGroups();
      if (!this.dataItemConfiguration.inputData.subtitle) {
        this.inputData.subtitle = this.getSubtitle;
      }
    }
  }
  ngOnInit() {
    if (CometChatWrapperComponent.cometchattheme) {
      this.theme = CometChatWrapperComponent.cometchattheme;
    }
    this.setThemeStyle();
    this.setDataItemConfiguration();
    this.attachListeners();
    CometChat.getLoggedinUser()
    .then((user: CometChat.User | null) => {
      this.loggedInUser = user;
      this.groupRequest = this.groupListRequestBuilder();
      this.getGroups()
    
    })
    .catch((error:any) => {
      this.groupEvents.publishEvents(this.groupEvents.onError, error)
      this.isError = true;
    });
  }
  onClick(group: CometChat.Group) {
    this.groupEvents.publishEvents(this.groupEvents.onGroupClick, group)
  }
  /**
   * @param  {CometChat.Group} group
   */
  getSubtitle = (group: CometChat.Group) => {
    return group.getMembersCount() && group.getMembersCount() <= 1 ? group.getMembersCount() + " " + localize("MEMBER") : group.getMembersCount() + " " + localize("MEMBERS")
  }

  /**
   * @param  {DataItemConfiguration} config
   * @param  {DataItemConfiguration} defaultConfig?
   */
  setDataItemConfiguration() {
    let config:DataItemConfiguration = this.dataItemConfiguration;
    let defaultConfig:DataItemConfiguration = new DataItemConfiguration({})
    this.inputData = config.inputData || defaultConfig?.inputData;
    if(!config.inputData.subtitle){
      this.inputData.subtitle = this.getSubtitle;
    }
  }
  /**
  * check is there is any active conversation and mark it as active
  * @param  {CometChat.Group} group
  */
  isGroupActive(group: CometChat.Group) {
    return this.activeGroup && this.activeGroup.getGuid() == group.getGuid() ? true : false;
  }
  setThemeStyle() {
    this.dataItemStyle.background = this.theme.palette.getBackground();
    this.dataItemStyle.titleFont = fontHelper(this.theme.typography.title1);
    this.dataItemStyle.titleColor = this.theme.palette.getAccent();
    this.dataItemStyle.subtitleFont = fontHelper(this.theme.typography.subtitle2);
    this.dataItemStyle.subtitleColor = this.theme.palette.getAccent600();
    this.dataItemStyle.activeBackground = this.theme.palette.getAccent50()
  }
  ngOnDestroy() {
    this.removeListener()
  }
  removeListener() {
    CometChat.removeGroupListener(this.groupListenerId);
  }
  /**
   * Listener for group activities happening in real time
   * @param function callback
   */
  attachListeners() {
    try {
      CometChat.addGroupListener(
        this.groupListenerId,
        new CometChat.GroupListener({
          onGroupMemberScopeChanged: (
            message: CometChat.Action,
            changedUser: CometChat.User,
            newScope: CometChat.GroupMemberScope,
            oldScope: CometChat.GroupMemberScope,
            changedGroup: CometChat.Group
          ) => {
            if(changedUser.getUid() == this.loggedInUser?.getUid()){
              changedGroup.setScope(newScope)
            }
            this.updateGroup(changedGroup)
          },
          onGroupMemberKicked: (message: CometChat.Action, kickedUser: CometChat.User, kickedBy: CometChat.User, kickedFrom: CometChat.Group) => {
            if(kickedUser.getUid() == this.loggedInUser?.getUid()){
              kickedFrom.setHasJoined(false)
            }
            this.updateGroup(kickedFrom)
          },
          onGroupMemberBanned: (message: CometChat.Action, bannedUser: CometChat.User, bannedBy: CometChat.User, bannedFrom: CometChat.Group) => {
            if(bannedUser.getUid() == this.loggedInUser?.getUid()){
             this.removeGroup(bannedFrom)
            }
            else{
              this.updateGroup(bannedFrom)
            }
          },
          onGroupMemberUnbanned: (
            message: CometChat.Action,
            unbannedUser: CometChat.User,
            unbannedBy: CometChat.User,
            unbannedFrom: CometChat.Group
          ) => {
            if(unbannedUser.getUid() == this.loggedInUser?.getUid()){
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
            if(userAdded.getUid() == this.loggedInUser?.getUid()){
              userAddedIn.setHasJoined(true)
            }
            this.updateGroup(userAddedIn)
          },
          onGroupMemberLeft: (message: CometChat.Action, leavingUser: CometChat.User, group: CometChat.Group) => {
            if(leavingUser.getUid() == this.loggedInUser?.getUid()){
              group.setHasJoined(false)
            }
            this.updateGroup(group)
          },
          onGroupMemberJoined: (message: CometChat.Action, joinedUser: CometChat.User, joinedGroup: CometChat.Group) => {
            if(joinedUser.getUid() == this.loggedInUser?.getUid()){
              joinedGroup.setHasJoined(true)
            }
            this.updateGroup(joinedGroup)
          },
        })
      );
    } catch (error:any) {
      this.groupEvents.publishEvents(this.groupEvents.onError, error)
    }
  }
  /**
   * Builds a request for fetching a list of group matching the serach key
   * @param String searchKey
   */
  groupListRequestBuilder() {
    let withTags: boolean = this.tags && this.tags.length > 0 ? true : false;
    return new CometChat.GroupsRequestBuilder()
      .setLimit(this.limit)
      .setSearchKeyword(this.searchKeyword)
      .setTags(this.tags)
      .withTags(withTags)
      .joinedOnly(this.joinedOnly)
      .build();
  }
  /**
   * Fetches list of groups according to the group request config , if a user is loggedIn correctly
   */
  getGroups = () => {
    try {
      this.isEmpty = false;
      this.loader = true;
      this.isError = false;
      this.fetchNextGroups()
        .then((groupList: CometChat.Group[]) => {
          if ((groupList.length <= 0 && this.groupList?.length <= 0) || (this.searchKeyword && groupList.length === 0 && this.groupList?.length <= 0)) {
            this.isEmpty = true;
            this.loader = false;
            this.isError = false;
            return;
          }
          this.groupList = [...this.groupList, ...groupList];
          this.isEmpty = false;
          this.loader = false;
          this.isError = false;
        })
        .catch((error: any) => {
          this.groupEvents.publishEvents(this.groupEvents.onError, error)
          this.isError = true;
          this.isEmpty = false;
          this.loader = false;
        });
  
    } catch (error:any) {
      this.groupEvents.publishEvents(this.groupEvents.onError, error)
    }
  };
  /**
   * Fetches list of groups according to the group request config
   * @param Event action
   */
  fetchNextGroups() {
      return this.groupRequest.fetchNext();
  }
  /**
   * Searches for a list of groups matching the search key
   * @param  {string} key
   */
  searchGroup(key: string) {
    try {
      this.searchKeyword = key;
      this.ref.detectChanges()
      if (this.timeout) {
        clearTimeout(this.timeout);
      }
      this.timeout = setTimeout(() => {
        this.groupRequest = this.groupListRequestBuilder();
        this.groupList = [];
        this.getGroups();
      }, 500);
    } catch (error:any) {
      this.groupEvents.publishEvents(this.groupEvents.onError, error)
    }
  }
  /**
 * public methods 
 */
  /**
   * updateGroup
  * @param group 
  */
  updateGroup(group: CometChat.Group) {
    try {
      let groupList = [...this.groupList];
      //search for group
      let groupKey = groupList.findIndex((g, k) => g.getGuid() === group.getGuid());
      if (groupKey > -1) {
        groupList.splice(groupKey, 1, group);
        this.groupList = groupList;
        this.ref.detectChanges();
      }
    } catch (error:any) {
      this.groupEvents.publishEvents(this.groupEvents.onError, error)
    }
  }
  /**
   * removeGroup
   * @param group 
   */
  removeGroup(group: CometChat.Group) {
    try {
      let groupList = [...this.groupList];
      //search for group
      let groupKey = groupList.findIndex((g, k) => g.getGuid() === group.getGuid());
      if (groupKey > -1) {
        groupList.splice(groupKey, 1);
        this.groupList = groupList;
        this.ref.detectChanges();
      }
    } catch (error:any) {
      this.groupEvents.publishEvents(this.groupEvents.onError, error)
    }
  }
  /**
   * addGroup
   * @param group 
   */
  addGroup(group: CometChat.Group) {
    this.groupList.unshift(group);
    this.ref.detectChanges()
  }
  /**
    * public methods  ends here
    */
  /**
   * Handles scroll action on GroupList and fetches more groups if user scrolls to bottom of group list
   * @param Event action
   */
  handleScroll(e: any) {
      this.isBottom =
        Math.round(e.currentTarget.scrollHeight - e.currentTarget.scrollTop) ===
        Math.round(e.currentTarget.clientHeight);
      if (this.isBottom) this.getGroups();
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
        WebkitMask: `url(${this.loadingIconURL})`,
        background: this.style.loadingIconTint
      }
    },
    groupListStyles: () => {
      return {
        height: this.style.height,
        width: this.style.width,
        border: this.style.border,
        borderRadius: this.style.borderRadius,
        background: this.style.background
      }
    }
  }
}
