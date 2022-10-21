import { Component, OnInit, ViewChild, Input, ChangeDetectionStrategy, OnChanges, SimpleChanges, ChangeDetectorRef } from "@angular/core";
import { CometChat } from "@cometchat-pro/chat";
import { checkHasOwnProperty } from "../../../Shared/Helpers/CometChatHelper";
import { CometChatMessageEvents } from "../../../Messages/CometChatMessageEvents.service";
import { CometChatUsersEvents } from "../../CometChatUsersEvents.service";
import { UsersConfiguration } from "../../../Shared/PrimaryComponents/CometChatConfiguration/UsersConfiguration";
import { CometChatTheme, fontHelper, MessagesConfiguration } from "../../../Shared";

 /**
 * 
 * CometChatUsersWithMessagesComponent is a wrapper component for CometChatMessageComponent and CometChatUsers component to show chats and messages in one screen
 * 
 * @version 1.0.0
 * @author CometChatTeam
 * @copyright © 2022 CometChat Inc.
 * 
 */
@Component({
  selector: "cometchat-users-with-messages",
  templateUrl: "./cometchat-users-with-messages.component.html",
  styleUrls: ["./cometchat-users-with-messages.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CometChatUsersWithMessagesComponent implements OnInit, OnChanges {
  /**
   * This properties will come from Parent.
   */

  @Input() isMobileView: boolean = false;
  @Input() messagesConfiguration: MessagesConfiguration = new MessagesConfiguration({});
  @Input() usersConfiguration: UsersConfiguration = new UsersConfiguration({});
  @Input() messageText: string = "Select a user to start messaging";
  @Input() style: any = {
    width: "100%",
    height: "100%",
    background: "white",
    borderRadius: "none",
    border: "1px solid rgba(20, 20, 20, 0.1)",
    messageTextColor: "rgba(20, 20, 20, 0.33)",
    messageTextFont: "700 22px Inter",
    boxShadow:"rgba(20, 20, 20, 0.1)"
  }
  @Input() user: CometChat.User | null = null;
    /**
     * Properties for internal use
     */
  public type: string = "";
  public messagesStyle:any ={
    width: "100%",
    height: "100%",
    background: "white",
    borderRadius: "none",
    border: "1px solid rgba(20, 20, 20, 0.1)",
    messageTextColor: "rgba(20, 20, 20, 0.33)",
    messageTextFont: "700 22px Inter",
    boxShadow: "rgba(20, 20, 20, 0.1)"

  }
  public checkAnimatedState: string | null = "";
   @Input() theme: CometChatTheme = new CometChatTheme({});
  public USER: String = CometChat.RECEIVER_TYPE.USER;
  public title: string = "USERS";
  public searchPlaceholder: string = "Search";
  public backButtonIconURL: string = "assets/resources/backbutton.svg";
  public searchIconURL: string = "assets/resources/search.svg";
  public showBackButton: boolean = false;
  public  hideSearch: boolean = false;
  public onItemClick: any = null;
  public onBackButtonClick: any;
  public hideMessageComposer: boolean = false;
  public messageTypes: any = [];
  public customIncomingMessageSound: string = "";
  public customOutgoingMessageSound: string = "";
  public enableSoundForMessages: boolean = true;
  public enableSoundForCalls: boolean = true;
  public enableTypingIndicator: boolean = true;
  constructor(private usersEvents: CometChatUsersEvents, private messageEvents: CometChatMessageEvents, private ref: ChangeDetectorRef) { }
  ngOnChanges() {
    if (this.isMobileView) {
      this.messagesConfiguration.messageHeaderConfiguration.showBackButton = true;
      this.messagesConfiguration.messageHeaderConfiguration = {...this.messagesConfiguration.messageHeaderConfiguration}
      this.messagesConfiguration.messageComposerConfiguration.popoverConfiguration.style.height = "100%";
      this.messagesConfiguration.messageComposerConfiguration.popoverConfiguration.style.width = "100%";
      this.messagesConfiguration = { ...this.messagesConfiguration }
    }
    else if (!this.isMobileView) {
      this.messagesConfiguration!.messageHeaderConfiguration!.showBackButton = false;
      this.messagesConfiguration.messageHeaderConfiguration = {...this.messagesConfiguration.messageHeaderConfiguration}
      this.messagesConfiguration.messageComposerConfiguration.popoverConfiguration.style.height = "620px";
      this.messagesConfiguration.messageComposerConfiguration.popoverConfiguration.style.width = "360px";
      this.messagesConfiguration = { ...this.messagesConfiguration }
    }
  }
 
  ngOnInit() {
    
    this.checkConfiguration();
    this.subscribeToEvents();
    this.setTheme()
  }
  setTheme(){

    this.messagesStyle.background = this.theme.palette.getBackground()
    this.messagesStyle.messageTextFont = fontHelper(this.theme.typography.heading)
    this.messagesStyle.messageTextColor = this.theme.palette.getAccent400()

  }
  checkConfiguration() {
    let usersDefaultConfig = new UsersConfiguration({});
    let messagesDefaultConfig = new MessagesConfiguration({});
    if ( this.usersConfiguration) {
      this.setUsersConfig(this.usersConfiguration, usersDefaultConfig);
    }
    else {
      this.setUsersConfig(usersDefaultConfig);
    }
    if (this.messagesConfiguration) {
      this.setMessagesConfig(this.messagesConfiguration, messagesDefaultConfig);
    }
    else {
      this.setMessagesConfig(messagesDefaultConfig);
    }
  }
  /**
   * @param  {UsersConfiguration} config
   * @param  {UsersConfiguration} defaultConfig?
   */
  setUsersConfig(config: UsersConfiguration, defaultConfig?: UsersConfiguration) {
    this.backButtonIconURL = config.backButtonIconURL || defaultConfig!.backButtonIconURL;
    this.hideSearch = checkHasOwnProperty(config,"hideSearch") ? config.hideSearch : defaultConfig!.hideSearch;
    this.searchIconURL = config.searchIconURL || defaultConfig!.searchIconURL;
    this.searchPlaceholder = config.searchPlaceholder || defaultConfig!.searchPlaceholder;
    this.showBackButton = checkHasOwnProperty(config,"showBackButton") ? config.showBackButton : defaultConfig!.showBackButton;
  }
  /**
   * @param  {MessagesConfiguration} config
   * @param  {MessagesConfiguration} defaultConfig?
   */
  setMessagesConfig(config: MessagesConfiguration, defaultConfig?: MessagesConfiguration) {
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
  ngOnDestroy() {
    this.unsubscribeToEvents();
  }
  // subscribe to global events
  subscribeToEvents() {
    this.onItemClick = this.usersEvents.onUserClick.subscribe((user: CometChat.User) => {
      this.user = user;
    })
    this.onBackButtonClick = this.messageEvents.onBack.subscribe(() => {
      this.user = null;
    })
  }
  // unsubscribe to subscribed events.
  unsubscribeToEvents() {
    this.onItemClick.unsubscribe();
    this.onBackButtonClick.unsubscribe();
  }
  usersWrapperStyles=()=>{
    return {
      height: this.style.height,
      width:this.style.width,
      border:this.style.border,
      borderRadius:this.style.borderRadius,
      background:this.style.background || this.theme.palette.getBackground(),
      boxShadow:this.style.boxShadow
    }

  }
  messagesWrapperStyle = ()=>{
    return {
      height:this.style.height,
      width: `calc(${this.style.width} - 280px)`,
    }

  }
  emptyMessageStyle = ()=>{
    return {
      background: this.style.background  || this.theme.palette.getBackground(),
      height:this.style.height,
      width:`calc(${this.style.width} - 280px)`,
      border:this.style.border,
      borderRadius:this.style.borderRadius,

    }
  }

  
}
