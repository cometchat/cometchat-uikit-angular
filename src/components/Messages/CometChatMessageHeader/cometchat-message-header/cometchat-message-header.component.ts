import { Component, OnInit, Input, OnChanges, SimpleChanges, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CometChat } from '@cometchat-pro/chat';
import { listenerEnums, userStatusEnums, typingEnums, groupEnums, MessageReceiverType } from '../../../Shared/Constants/UIKitConstants';
import { localize } from '../../../Shared';
import { CometChatTheme } from "../../../Shared/PrimaryComponents/CometChatTheme/CometChatTheme";

import { DataItemConfiguration } from '../../../Shared/PrimaryComponents/CometChatConfiguration/DataItemConfiguration';
import { CometChatMessageEvents } from '../../CometChatMessageEvents.service';
import { dataItemStyle, style } from '../headerInterface';
import { inputData } from '../../../Shared/SDKDerivedComponents/CometChatDataItem/DataItemInterface';
import { userStatusType } from '../../../Shared/Constants/UIKitConstants';
import { fontHelper } from '../../../Shared/PrimaryComponents/CometChatTheme/Typography';
import { Palette } from '../../../Shared/PrimaryComponents/CometChatTheme/Palette';
  /**
*
* CometChatMessageHeader is a used to render dataItemComponent..
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
export class CometChatMessageHeaderComponent implements OnInit, OnChanges {
          /**
   * This properties will come from Parent.
   */
  @Input() user!: CometChat.User | null;
  @Input() group!: CometChat.Group | null;
  @Input() options: object = {};
  @Input() showBackButton: Boolean = false;
  @Input() backButtonIconURL: string = "assets/resources/backbutton.svg";
  @Input() dataItemConfiguration:DataItemConfiguration = new DataItemConfiguration({})
  @Input() style: style = {
    width: "",
    height: "",
    border: "",
    borderRadius: "",
    background: "",
    backButtonIconTint:"#3399FF"
  };
  @Input() enableTypingIndicator: boolean = false;
  @Input() inputData: inputData = {
    thumbnail: true,
    title: true,
    subtitle: "",
    status: true,
  };
      /**
     * Properties for internal use
     */
  public dataItemStyle: dataItemStyle = {
    height: "",
    width: "",
    background: "",
    activeBackground: "",
    borderRadius: "",
    titleFont: "",
    titleColor: "",
    subtitleFont: "",
    subtitleColor: "",
  };
  public subtitle: string = "";
  subtitleCallBack: any; //storing subtitle callback for updating header.
  isActive: boolean = false;
  userListenerId = listenerEnums.head_user_ + new Date().getTime();
  msgListenerId = listenerEnums.head_message_ + new Date().getTime();
  groupListenerId = listenerEnums.head_group_ + new Date().getTime();
  GROUP: String = MessageReceiverType.group;
  USER: String = MessageReceiverType.user;
  ONLINE: String = userStatusType.online;
  OFFLINE: String = userStatusType.offline;
  status: string = "";
  loggedInUser!: CometChat.User;
  checkNotBlocked: boolean = true;
  isTyping: boolean = false;
  showChatOption = false;
   @Input() theme: CometChatTheme = new CometChatTheme({});
  userStatusColor: any = {
    online: this.theme.palette.getPrimary(),
    offline: this.theme.palette.getAccent600(),
  }; // passing online and offline status color to DataItem
  constructor(private ref: ChangeDetectorRef, private messageEvents: CometChatMessageEvents) { }
  ngOnChanges(changes: SimpleChanges): void {
    if (changes["user"] && changes["user"].currentValue) {
      if (Object.keys(changes["user"].currentValue).length === 1) {
        this.getUserInfo(this.user!.getUid());
      }
      else {
        this.user = changes["user"].currentValue;
      }
      
      this.setThemeStyle();
      this.updateSubtitle();
    }
    else if (changes["group"] && changes["group"].currentValue) {
      if (this.group && Object.keys(this.group).length === 1) {
        this.getGroupInfo(this.group.getGuid());
      }
      else {
        this.group = changes["group"].currentValue;
      }
      this.setThemeStyle()
      this.updateSubtitle();
    }
  }
  ngOnInit() {

    try {

      this.attachListeners();
      this.getLoggedInUserInfo();
      this.checkConfiguration();
      this.ref.detectChanges()
    } catch (error:any) {
        this.messageEvents.publishEvents(this.messageEvents.onError, error);
    }
  }
  setThemeStyle() {
    
    this.dataItemStyle.background =  this.theme.palette.getBackground()
    this.dataItemStyle.activeBackground =  this.theme.palette.getBackground()
    this.dataItemStyle.titleFont = fontHelper(this.theme.typography.title2);
    this.dataItemStyle.titleColor = this.theme.palette.getAccent()
    this.dataItemStyle.subtitleFont = fontHelper(this.theme.typography.subtitle2);
    this.dataItemStyle.subtitleColor = this.user && this.user.getStatus() ? this.userStatusColor[this.user.getStatus()] : this.userStatusColor.offline;
  }
  // trigger back button event on click
  onBackButtonClick() {
    this.messageEvents.publishEvents(this.messageEvents.onBack);
  }
  /**
   * @param  {string} uid
   */
  getUserInfo(uid: string) {
    try {
      CometChat.getUser(uid)
        .then((user: CometChat.User) => {
          this.user = user;
        })
        .catch((error:any) => {
            this.messageEvents.publishEvents(this.messageEvents.onError, error);
        });
    } catch (error:any) {
        this.messageEvents.publishEvents(this.messageEvents.onError, error);
    }
  }
  /**
   * @param  {string} guid
   */
  getGroupInfo(guid: string) {
    try {
      CometChat.getGroup(guid)
        .then((group: CometChat.Group) => {
          this.group = group;
        })
        .catch((error) => {
            this.messageEvents.publishEvents(this.messageEvents.onError, error);
        });
    } catch (error) {
        this.messageEvents.publishEvents(this.messageEvents.onError, error);
    }
  }
  getLoggedInUserInfo() {
    try {
      CometChat.getLoggedinUser()
        .then((user: CometChat.User | null) => {
          this.loggedInUser = user as CometChat.User;
        })
        .catch((error:any) => {
            this.messageEvents.publishEvents(this.messageEvents.onError, error);
        });
    } catch (error:any) {
        this.messageEvents.publishEvents(this.messageEvents.onError, error);
    }
  }
  // checking if we are getting configuration from parent  and fetching default configuration.
  checkConfiguration() {
    let defaultConfig = new DataItemConfiguration({})
    if (this.dataItemConfiguration) {
      this.setdataItemConfig(this.dataItemConfiguration, defaultConfig)
    }
    else {
      this.setdataItemConfig(defaultConfig)
    }
    this.ref.detectChanges()
  }
  /**
   * @param  {DataItemConfiguration={}} config
   * @param  {DataItemConfiguration} defaultConfig
   */
  setdataItemConfig(config: DataItemConfiguration, defaultConfig?: DataItemConfiguration) {
    this.inputData = config.inputData || defaultConfig!.inputData;
    this.updateSubtitle();
 
    this.ref.detectChanges()
  }
  setSubtitle(typing: CometChat.TypingIndicator) {
    let subtitle: string;
    if (this.user) {
      if (typing.getSender().getUid() == this.user?.getUid() && this.loggedInUser && this.loggedInUser.getUid() == typing.getReceiverId()) {
        subtitle = localize("IS_TYPING")
        this.dataItemStyle.subtitleColor =this.theme.palette.getPrimary()
        this.inputData.subtitle =(user: CometChat.User | {} = {}, group: CometChat.Group | {} = {}, groupMember: CometChat.GroupMember | {} = {}) => {
          return subtitle
        }
      }
    }
    else if (this.group) {
      if (this.group.getGuid() == typing.getReceiverId()) {
        subtitle = typing.getSender().getName() + " " + localize("IS_TYPING")
        this.dataItemStyle.subtitleColor = this.theme.palette.getPrimary()
        this.inputData.subtitle =(user: CometChat.User | {} = {}, group: CometChat.Group | {} = {}, groupMember: CometChat.GroupMember | {} = {}) => {
          return subtitle
        }
      }
    }

    this.ref.detectChanges()
  }
  attachListeners() {
    try {
      CometChat.addUserListener(
        this.userListenerId,
        new CometChat.UserListener({
          onUserOnline: (onlineUser: CometChat.User) => {
            this.setThemeStyle()
            /* when someuser/friend comes online, user will be received here */
            this.updateHeader(userStatusEnums.user_online, onlineUser);
          },
          onUserOffline: (offlineUser: CometChat.User) => {
            this.setThemeStyle()
            /* when someuser/friend went offline, user will be received here */
            this.updateHeader(userStatusEnums.user_offline, offlineUser);
          },
        })
      );
      CometChat.addMessageListener(
        this.msgListenerId,
        new CometChat.MessageListener({
          onTypingStarted: (typingIndicator: CometChat.TypingIndicator) => {
            this.setSubtitle(typingIndicator)
            this.ref.detectChanges()
          },
          onTypingEnded: (typingIndicator: CometChat.TypingIndicator) => {
            this.setThemeStyle()
            this.updateSubtitle()
            this.ref.detectChanges()
        
          },
        })
      );
      CometChat.addGroupListener(
        this.groupListenerId,
        new CometChat.GroupListener({
          onGroupMemberKicked: (message: CometChat.BaseMessage, kickedUser: CometChat.GroupMember, kickedBy: CometChat.GroupMember, kickedFrom: CometChat.Group) => {
            this.updateHeader(
              groupEnums.group_member_kicked,
              kickedFrom,
              kickedUser
            );
          },
          onGroupMemberBanned: (message: CometChat.BaseMessage, bannedUser: CometChat.GroupMember, bannedBy: CometChat.GroupMember, bannedFrom: CometChat.Group) => {
            this.updateHeader(
              groupEnums.group_member_banned,
              bannedFrom,
              bannedUser
            );
          },
          onMemberAddedToGroup: (
            message: CometChat.BaseMessage,
            userAdded: CometChat.GroupMember,
            userAddedBy: CometChat.GroupMember,
            userAddedIn: CometChat.Group
          ) => {
            this.updateHeader(groupEnums.group_member_added, userAddedIn);
          },
          onGroupMemberLeft: (message: CometChat.BaseMessage, leavingUser: CometChat.GroupMember, group: CometChat.Group) => {
            this.updateHeader(groupEnums.group_member_left, group, leavingUser);
          },
          onGroupMemberJoined: (message: CometChat.BaseMessage, joinedUser: CometChat.GroupMember, joinedGroup: CometChat.Group) => {
            this.updateHeader(groupEnums.group_member_joined, joinedGroup);
          },
        })
      );
    } catch (error:any) {
        this.messageEvents.publishEvents(this.messageEvents.onError, error);
    }
  }
  ngOnDestroy() {
    try {
      //Removing User Presence , typing and Group Listeners
      this.removeListeners();
    } catch (error:any) {
        this.messageEvents.publishEvents(this.messageEvents.onError, error);
    }
  }
  removeListeners() {
    try {
      CometChat.removeUserListener(this.userListenerId);
      CometChat.removeMessageListener(this.msgListenerId);
      CometChat.removeGroupListener(this.groupListenerId);
    } catch (error:any) {
        this.messageEvents.publishEvents(this.messageEvents.onError, error);
    }
  }
  /**
   * @param  {string} key
   * @param  {CometChat.User | CometChat.Group | CometChat.TypingIndicator| null} item
   * @param  {CometChat.GroupMember | null} groupUser
   */
  updateHeader(key: string = "", item: CometChat.User | CometChat.Group | CometChat.TypingIndicator | null = null, groupUser: CometChat.GroupMember | null = null) {
    try {
      switch (key) {
        case userStatusEnums.user_online:
        case userStatusEnums.user_offline: {
          this.updateStatus((item as CometChat.User))
          break;
        }
        case groupEnums.group_member_kicked:
        case groupEnums.group_member_banned:
        case groupEnums.group_member_left:
          if (this.group &&
            this.group.getGuid() &&
            this.group.getGuid() === (item as CometChat.Group).getGuid() &&
            this.loggedInUser.getUid() !== groupUser?.getUid()
          ) {
            let membersCount = parseInt(String((item as CometChat.Group).getMembersCount()));
            if (this.group.getMembersCount()) {
              this.group.setMembersCount(membersCount);
            }
          }
          break;
        case groupEnums.group_member_joined:
          if (this.group &&
            this.group.getGuid() &&
            this.group.getGuid() === (item as CometChat.Group).getGuid()) {
            let membersCount = parseInt(String((item as CometChat.Group).getMembersCount()));
            if (this.group.getMembersCount()) {
              this.group.setMembersCount(membersCount);
            }
          }
          break;
        case groupEnums.group_member_added:
          if (this.group &&
            this.group.getGuid() &&
            this.group.getGuid() === (item as CometChat.Group).getGuid()) {
            let membersCount = parseInt(String((item as CometChat.Group).getMembersCount()));
            if (this.group.getMembersCount()) {
              this.group.setMembersCount(membersCount);
            }
          }
          break;
        case typingEnums.typing_started: {
          if (
            this.group &&
            this.group.getGuid() === (item as CometChat.Group).getGuid() && this.enableTypingIndicator
          ) {
            this.isTyping = true;
            this.status = (item as CometChat.TypingIndicator).getSender().getName() + " " + localize("IS_TYPING");
            (this.dataItemStyle as any).subtitleColor = Object.assign({}, this.dataItemStyle, { subtitleColor: this.userStatusColor.online })
            this.ref.detectChanges()
          } else if (
            this.user &&
            this.user.getUid() === (item as CometChat.TypingIndicator).getSender().getUid() &&
            this.enableTypingIndicator
          ) {
            this.isTyping = true;
            this.status = localize("IS_TYPING");
            (this.dataItemStyle as any).subtitleColor = Object.assign({}, this.dataItemStyle, { subtitleColor: this.userStatusColor.online })
            this.ref.detectChanges()
          }
          break;
        }
        case typingEnums.typing_ended: {
          if (
            this.group &&
            this.group.getGuid() === (item as CometChat.TypingIndicator).getReceiverId() &&
            this.enableTypingIndicator
          ) {
            this.status = "";
            this.isTyping = false;
            (this.dataItemStyle as any).subtitleColor = Object.assign({}, this.dataItemStyle, { subtitleColor: this.userStatusColor.offline })
            this.ref.detectChanges()
          } else if (
            this.user
            &&
            this.user.getUid() === (item as CometChat.TypingIndicator).getSender().getUid() &&
            this.enableTypingIndicator
          ) {
            if (this.user && this.user.getStatus() === CometChat.USER_STATUS.ONLINE ||
              this.group && this.user.getStatus() === CometChat.USER_STATUS.ONLINE) {
              this.status = "";
              this.isTyping = false;
              (this.dataItemStyle as any).subtitleColor = Object.assign({}, this.dataItemStyle, { subtitleColor: this.userStatusColor.offline });
              this.ref.detectChanges();
            }
          }
          break;
        }
      }
      this.ref.detectChanges();
    } catch (error:any) {
        this.messageEvents.publishEvents(this.messageEvents.onError, error);
    }
  }
  /**
   * updating subtitle based on user status
   * @param  {CometChat.User} item
   */
  updateStatus(item: CometChat.User) {
    if (this.user && this.user.getUid() && this.user.getUid() === item.getUid()) {
      this.user.setStatus(item.getStatus());
    }
    this.ref.detectChanges();
  }
  updateSubtitle = (user: CometChat.User | {} = {}, group: CometChat.Group | {} = {}, groupMember: CometChat.GroupMember | {} = {})=>{
    let subtitle:string;
    if(this.user){
      subtitle = this.user.getStatus();
    }
    else if(this.group){
      subtitle = this.group.getMembersCount() <= 1 ? this.group.getMembersCount() + " Member" : this.group.getMembersCount() + " Members"
    }
    this.inputData.subtitle = (object:any)=>{
      return subtitle;
    }

  }
  messageHeaderStyle = {
    chatHeaderStyle: () => {
      return {
        width: this.style.width,
        height: this.style.height,
        border: this.style.border,
        background: this.style.background || this.theme.palette.getBackground(),
      }
    },
    backButtonStyle: () => {
      return {
        webkitMask: `url(${this.backButtonIconURL}) no-repeat left center`,
        background: this.style.backButtonIconTint || this.theme.palette.getPrimary(),
        height: "22px",
        width: "22px"
      };
    }
  }
}
