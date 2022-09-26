import { Component, OnInit, Input, OnChanges, SimpleChanges } from "@angular/core";
import { CometChat } from "@cometchat-pro/chat";
import { CometChatMessageEvents } from "../../../Messages/CometChatMessageEvents.service";
import { CometChatTheme, fontHelper, localize, MessagesConfiguration } from "../../../Shared";
import { GroupsConfiguration } from "../../../Shared/PrimaryComponents/CometChatConfiguration/GroupsConfiguratio";
import { JoinProtectedGroupConfiguration } from "../../../Shared/PrimaryComponents/CometChatConfiguration/JoinProtectedGroupConfiguration";
import { CometChatWrapperComponent } from "../../../Shared/PrimaryComponents/CometChatTheme/CometChatThemeWrapper/cometchat-theme-wrapper.component";
import { checkHasOwnProperty } from "../../../Shared/Helpers/CometChatHelper";
import { GroupType } from "../../../Shared/Constants/UIKitConstants";
import { CometChatGroupEvents } from "../../CometChatGroupEvents.service";
import { joinGroupStyle } from "../../CometChatJoinProtectedGroup/interface";
import { CometChatMessageTemplate } from "../../../Messages/CometChatMessageTemplate/cometchat-message-template";
/**
*
* CometChatGroupsWithMessages is a wrapper component consists of CometChatGroups and CometChatMessages component.
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
})
export class CometChatGroupsWithMessagesComponent implements OnInit, OnChanges {
  /**
  * This properties will come from Parent.
  */
  @Input() isMobileView: boolean = false;
  @Input() messagesConfiguration: MessagesConfiguration = new MessagesConfiguration({});
  @Input() groupsConfiguration: GroupsConfiguration = new GroupsConfiguration({});
  @Input() joinProtectedGroupConfiguration: JoinProtectedGroupConfiguration = new JoinProtectedGroupConfiguration({});
  @Input() messageText: string = localize("SELECT__GROUP");
  @Input() style: any = {
    width: "100%",
    height: "100%",
    background: "white",
    borderRadius: "none",
    // border: "1px solid rgba(20, 20, 20, 0.1)",
    border: "none",
    messageTextColor: "rgba(20, 20, 20, 0.33)",
    messageTextFont: "700 22px Inter",
    boxShadow: "rgba(20, 20, 20, 0.1)"
  }
  @Input() group: CometChat.Group | null = null;
    /**
  * Properties for internal use
  */

  public type: string = "";
  public onGroupJoined: any;
  public isEmpty: boolean = true
  public protectedGroup: CometChat.Group | null = null;
  public onGroupClick: any = null
  public onBackButtonClick: any = null;
  public openPasswordModal: boolean = false
  public joinedOnly:boolean=false
  public hideCreateGroup:boolean=false
  public createGroupIconURL:string="assets/resources/create-button.svg"
  public backButtonIconURL!: string;
  public hideSearch!: boolean;
  public searchIconURL!: string;
  public searchPlaceholder!: string;
  public showBackButton!: boolean;
  public hideMessageComposer!: boolean;
  public messageTypes!: CometChatMessageTemplate[];
  public customIncomingMessageSound!: string;
  public customOutgoingMessageSound!: string;
  public enableSoundForMessages!: boolean;
  public enableSoundForCalls!: boolean;
  public enableTypingIndicator!: boolean;
  public joinGroupStyle :joinGroupStyle={
    width: "100%",
    boxShadow:"none",
    height: "100%",
    background: "rgb(255, 255, 255)",
    border: "none",
    borderRadius: "none",
    titleTextFont: "700 22px Inter",
    titleTextColor: "rgba(20, 20, 20, 0.69)",
    errorTextFont: "500 15px Inter",
    errorTextColor: "red",
    passwordTextFont:"400 15px Inter",
    passwordTextColor:"rgb(20, 20, 20)",
    passwordPlaceholderTextFont:"400 15px Inter",
    passwordPlaceholderTextColor:"rgba(20, 20, 20, 0.6)",
    passwordInputBackground:"rgba(20, 20, 20, 0.04)",
    passwordInputBorder: "none",
    passwordInputBorderRadius: "8px",
    passwordInputBoxShadow:"rgba(20, 20, 20, 0.04) 0px 0px 0px 1px",
    joinButtonTextFont:"600 15px Inter",
    joinButtonTextColor:"rgb(255, 255, 255)",
    joinButtonBackground:"rgb(51, 153, 255)",
    joinButtonBorderRadius:"8px"
  };
  public messagesStyle:any ={
    width: "100%",
    height: "100%",
    background: "white",
    borderRadius: "none",
    border: "1px solid rgba(20, 20, 20, 0.1)",
    boxShadow: "rgba(20, 20, 20, 0.1)",
    messageTextColor: "rgba(20, 20, 20, 0.33)",
    messageTextFont: "700 22px Inter",

  }
  public theme:any = new CometChatTheme({});
  constructor(private groupEvents: CometChatGroupEvents, private messageEvents: CometChatMessageEvents) { }
  ngOnChanges(changes: SimpleChanges): void {

    if (this.isMobileView) {
      this.messagesConfiguration.messageHeaderConfiguration.isMobileView = true;
      this.joinProtectedGroupConfiguration.messageHeaderConfiguration.isMobileView = true;
      this.messagesConfiguration = { ...this.messagesConfiguration }
      this.groupsConfiguration.popoverConfiguration.style.height = "100%";
      this.groupsConfiguration.popoverConfiguration.style.width = "100%";
      this.messagesConfiguration.messageComposerConfiguration.popoverConfiguration.style.height = "100%";
      this.messagesConfiguration.messageComposerConfiguration.popoverConfiguration.style.width = "100%";
      this.groupsConfiguration.popoverConfiguration =  this.groupsConfiguration.popoverConfiguration;
    }
    else if (!this.isMobileView) {
      this.messagesConfiguration!.messageHeaderConfiguration!.isMobileView = false;
      this.joinProtectedGroupConfiguration.messageHeaderConfiguration.isMobileView = false;
      this.messagesConfiguration = { ...this.messagesConfiguration };
      this.groupsConfiguration.popoverConfiguration.style.height = "620px";
      this.groupsConfiguration.popoverConfiguration.style.width = "360px";
      this.messagesConfiguration.messageComposerConfiguration.popoverConfiguration.style.height = "620px";
      this.messagesConfiguration.messageComposerConfiguration.popoverConfiguration.style.width = "360px";
      this.groupsConfiguration.popoverConfiguration =  this.groupsConfiguration.popoverConfiguration
      
      
    }
  }
  ngOnInit() {
    this.setGroupsConfig();
    this.setMessagesConfig();
    this.setTheme();
    this.subscribeToEvents();
  }
  setTheme() {
    if (CometChatWrapperComponent.cometchattheme ) {
      this.theme = CometChatWrapperComponent.cometchattheme;
    }
    this.joinGroupStyle.background = this.theme.palette.getBackground();
    this.joinGroupStyle.errorTextColor = this.theme.palette.getError();
    this.joinGroupStyle.errorTextFont = fontHelper(this.theme.typography.text1);
    this.joinGroupStyle.passwordInputBackground = this.theme.palette.getAccent50();
    this.joinGroupStyle.passwordInputBoxShadow = `${this.theme.palette.getAccent50()} 0px 0px 0px 1px`;
    this.joinGroupStyle.passwordPlaceholderTextColor = this.theme.palette.getAccent();
    this.joinGroupStyle.passwordPlaceholderTextFont = fontHelper(this.theme.typography.subtitle1);
    this.joinGroupStyle.passwordTextColor = this.theme.palette.getAccent900();
    this.joinGroupStyle.passwordTextFont = fontHelper(this.theme.typography.subtitle2);
    this.joinGroupStyle.titleTextFont = fontHelper(this.theme.typography.heading);
    this.joinGroupStyle.titleTextColor = this.theme.palette.getAccent700();
    this.joinGroupStyle.joinButtonBackground = this.theme.palette.getPrimary();
    this.joinGroupStyle.joinButtonTextColor = this.theme.palette.getAccent900("light");
    this.joinGroupStyle.joinButtonTextFont = fontHelper(this.theme.typography.title1);
    this.messagesStyle.background = this.theme.palette.getBackground()
    this.messagesStyle.messageTextFont = fontHelper(this.theme.typography.heading)
    this.messagesStyle.messageTextColor = this.theme.palette.getAccent400()
  }

  /**
   * @param  {GroupsConfiguration} config
   * @param  {GroupsConfiguration} defaultConfig?
   */
  setGroupsConfig() {
    let defaultConfig = new GroupsConfiguration({});
    let config:GroupsConfiguration = this.groupsConfiguration;
    this.backButtonIconURL = config.backButtonIconURL || defaultConfig!.backButtonIconURL;
    this.hideSearch = checkHasOwnProperty(config,"hideSearch") ? config.hideSearch : defaultConfig!.hideSearch;
    this.searchIconURL = config.searchIconURL || defaultConfig!.searchIconURL;
    this.searchPlaceholder = config.searchPlaceholder || defaultConfig!.searchPlaceholder;
    this.showBackButton = checkHasOwnProperty(config,"showBackButton") ? config.showBackButton : defaultConfig!.showBackButton;
    this.hideCreateGroup = checkHasOwnProperty(config,"hideCreateGroup") ? config.hideCreateGroup : defaultConfig!.hideCreateGroup;
    this.createGroupIconURL = config.createGroupIconURL || defaultConfig!.createGroupIconURL;
  }
  /**
   * @param  {MessagesConfiguration} config
   * @param  {MessagesConfiguration} defaultConfig?
   */
  setMessagesConfig() {
    let defaultConfig = new MessagesConfiguration({});
    let config:MessagesConfiguration = this.messagesConfiguration;
    this.hideMessageComposer = checkHasOwnProperty(config,"hideMessageComposer") ? config.hideMessageComposer : defaultConfig!.hideMessageComposer; //hide show message composer
    this.messageTypes =checkHasOwnProperty(config,"messageTypes") ? config.messageTypes : defaultConfig!.messageTypes;
    this.customIncomingMessageSound =checkHasOwnProperty(config,"customIncomingMessageSound") ? config.customIncomingMessageSound : defaultConfig!.customIncomingMessageSound;
    this.customOutgoingMessageSound =checkHasOwnProperty(config,"customOutgoingMessageSound") ? config.customOutgoingMessageSound : defaultConfig!.customOutgoingMessageSound;
    this.enableSoundForMessages = checkHasOwnProperty(config,"enableSoundForMessages") ? config.enableSoundForMessages : defaultConfig!.enableSoundForMessages;
    this.enableSoundForCalls = checkHasOwnProperty(config,"enableSoundForCalls") ? config.enableSoundForCalls : defaultConfig!.enableSoundForCalls;
    this.enableTypingIndicator = checkHasOwnProperty(config,"enableTypingIndicator") ? config.enableTypingIndicator : defaultConfig!.enableTypingIndicator;
    this.messagesConfiguration.messageListConfiguration = config.messageListConfiguration || defaultConfig!.messageListConfiguration;
    this.messagesConfiguration.messageHeaderConfiguration = config.messageHeaderConfiguration || defaultConfig!.messageHeaderConfiguration;
    this.messagesConfiguration.messageComposerConfiguration = config.messageComposerConfiguration || defaultConfig!.messageComposerConfiguration;
  }
  subscribeToEvents() {
    this.onGroupClick = this.groupEvents.onGroupClick.subscribe((group: CometChat.Group) => {
      this.isEmpty = false
      this.protectedGroup = null;
      this.openPasswordModal = false;
      this.checkHasJoined(group)
    })
    this.onBackButtonClick = this.messageEvents.onBack.subscribe(() => {
      this.protectedGroup = null;
      this.openPasswordModal = false;
      this.isEmpty = true;
      this.group = null;
    })
    this.onGroupJoined = this.groupEvents.onGroupMemberJoin.subscribe((group: CometChat.Group) => {
      this.group = null;
      this.isEmpty = false;
      this.openPasswordModal = false;
      this.group = group;
    })
  }
  // unsubscribe to subscribed events.
  unsubscribeToEvents() {
    this.onGroupClick.unsubscribe();
    this.onBackButtonClick.unsubscribe();
    this.onGroupJoined.unsubscribe();
  }
  /**
   * @param  {CometChat.Group} group
   */
  checkHasJoined(group: CometChat.Group) {
    this.isEmpty = false;
    if (group.getHasJoined()) {
      this.group = null;
      this.group = group;
    }
    else {
      if (group.getType() == GroupType.public) {
        this.joinGroup(group)
      }
      else if (group.getType() == GroupType.password) {
        this.group = null
        this.protectedGroup = group;
        this.openPasswordModal = true;
      }
    }
  }
  /**
   * @param  {CometChat.Group} groupData
   */
  joinGroup(groupData: CometChat.Group) {
    let group: CometChat.Group = groupData
    let guid: string = group.getGuid();
    let type: any = group.getType();
    try {
      CometChat.joinGroup(guid, type)
        .then((response: any) => {
          group.setHasJoined(true);
          group.setMembersCount(response.membersCount);
          this.group = group;
          this.groupEvents.publishEvents(this.groupEvents.onGroupMemberJoin, response)
        })
        .catch((error:any) => {
          this.group = null;
          this.groupEvents.publishEvents(this.groupEvents.onError, error)
        });
    } catch (error:any) {
    }
  }
      /**
   * Props dependent styles of CometChatCreateGroup
   */
  styles: any = {
    groupsWrapperStyles: () => {
      return {
        height: this.style.height,
        width: this.style.width,
        border: this.style.border,
        borderRadius: this.style.borderRadius,
        background: this.style.background,
        boxShadow: this.style.boxShadow
      }
    },
    messagesWrapperStyle: () => {
      return {
        height: this.style.height,
        width: `calc(${this.style.width} - 280px)`,
        
      }
    },

    emptyMessageStyle : ()=>{
      return {
        background: this.style.background,
        height:this.style.height,
        width:`calc(${this.style.width} - 280px)`,
        border:this.style.border,
        borderRadius:this.style.borderRadius,
        font:this.style.messageTextFont,
        color:this.style.messageTextColor
      }
    }
  }
}
