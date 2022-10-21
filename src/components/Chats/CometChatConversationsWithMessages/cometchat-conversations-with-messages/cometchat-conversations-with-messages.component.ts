import { Component, OnInit, ViewChild, Input, ChangeDetectionStrategy, OnChanges, SimpleChanges, ChangeDetectorRef } from "@angular/core";
import { CometChat } from "@cometchat-pro/chat";
import * as types from '../../../Shared/Types/typesDeclairation'
import { CometChatConversationEvents } from "../../CometChatConversationEvents.service";
import { CometChatMessagesComponent } from "../../../Messages/CometChatMessages/cometchat-messages/cometchat-messages.component";
import { CometChatConversationsComponent } from "../../CometChatConversations/cometchat-conversations/cometchat-conversations.component";
import { CometChatMessageEvents } from "../../../Messages/CometChatMessageEvents.service";
import { CometChatTheme, fontHelper, localize, MessagesConfiguration } from "../../../Shared";
import { ConversationsConfiguration } from "../../../Shared/PrimaryComponents/CometChatConfiguration";
import { checkHasOwnProperty } from "../../../Shared/Helpers/CometChatHelper";

  /**
 * 
 * CometChatConversationWithMessagesComponent is a wrapper component for CometChatMessageComponent and CometChatConversations component to show chats and messages in one screen
 * 
 * @version 1.0.0
 * @author CometChatTeam
 * @copyright © 2022 CometChat Inc.
 * 
 */
@Component({
  selector: "cometchat-conversations-with-messages",
  templateUrl: "./cometchat-conversations-with-messages.component.html",
  styleUrls: ["./cometchat-conversations-with-messages.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CometChatConversationsWithMessagesComponent implements OnInit, OnChanges {
  // taking reference of conversationComponent and MessagesComponent
  @ViewChild("conversationRef", { static: false }) conversationRef!: CometChatConversationsComponent;
  @ViewChild("messagesRef", { static: false }) messageListRef!: CometChatMessagesComponent;
      /**
   * This properties will come from Parent.
   */
  @Input() isMobileView: boolean = false;
  @Input() messageText: string = localize("NO_CHATS_SELECTED");
  @Input() style: any = {
    width: "100%",
    height: "100%",
    background: "transparent",
    borderRadius: "none",
    border: "none",
    messageTextColor: "rgba(20, 20, 20, 0.33)",
    messageTextFont: "700 22px Inter",
  };
  @Input() messagesConfiguration: MessagesConfiguration = new MessagesConfiguration({});
  @Input() conversationConfiguration: ConversationsConfiguration = new ConversationsConfiguration({});
  @Input() user!: CometChat.User | null;
  @Input() group!: CometChat.Group | null;
    /**
     * Properties for internal use
     */
  public lastMessage!: types.messageObject;
  public item: any = null;
  public type: string = "";
  public loggedInUser!: CometChat.UserObj | null;
  public viewDetailScreen: boolean = false;
  public threadMessageView: boolean = false;
  public activeConversation!: CometChat.Conversation | null;
  public checkAnimatedState: string | null = "";
  public GROUP: String = CometChat.RECEIVER_TYPE.GROUP;
  public USER: String = CometChat.RECEIVER_TYPE.USER;
  public messagesStyle:any ={
    width: "100%",
    height: "100%",
    background: "white",
    borderRadius: "none",
    border: "1px solid rgba(20, 20, 20, 0.1)",
    messageTextColor: "rgba(20, 20, 20, 0.33)",
    messageTextFont: "700 22px Inter",
    boxShadow: "rgba(20, 20, 20, 0.1)"
  };
  public conversationStyle:any ={
    width: "100%",
    height: "100%",
    background: "white",
    borderRadius: "none",
    border: "1px solid rgba(20, 20, 20, 0.1)",
  };
  public searchPlaceHolder:string = "assets/resources/Spinner.svg";
  public searchIconURL:string = "assets/resources/search.svg";
  public backButtonIconURL:string = "assets/resources/backbutton.svg";
  public hideSearch:boolean = true;
  public showBackButton:boolean = false;
  public hideMessageComposer: boolean = false;
  public messageTypes: any = [];
  public customIncomingMessageSound: string = "";
  public customOutgoingMessageSound: string = "";
  public enableSoundForMessages: boolean = true;
  public enableSoundForCalls: boolean = true;
  public enableTypingIndicator: boolean = true;
  public onconversationDeleted: any = null;
  public onMessageRead: any;
  public onItemClick: any = null;
  public onBackButtonClick: any;
  @Input() theme: CometChatTheme = new CometChatTheme({});
  constructor(private conversationEvents: CometChatConversationEvents, private messageEVents: CometChatMessageEvents, private ref: ChangeDetectorRef) {
   }
  ngOnChanges(changes: SimpleChanges): void {
    if (this.isMobileView) {
      this.messagesConfiguration.messageHeaderConfiguration.showBackButton = true;
      this.messagesConfiguration.messageHeaderConfiguration = {...this.messagesConfiguration.messageHeaderConfiguration}
      this.messagesConfiguration.messageComposerConfiguration.popoverConfiguration.style.height = "100%";
      this.messagesConfiguration.messageComposerConfiguration.popoverConfiguration.style.width = "100%";
      this.messagesConfiguration = { ...this.messagesConfiguration }


    }
    else if (!this.isMobileView) {
      this.messagesConfiguration.messageHeaderConfiguration.showBackButton = false;
      this.messagesConfiguration.messageHeaderConfiguration = {...this.messagesConfiguration.messageHeaderConfiguration}
      this.messagesConfiguration.messageComposerConfiguration.popoverConfiguration.style.height = "620px";
      this.messagesConfiguration.messageComposerConfiguration.popoverConfiguration.style.width = "360px";
      this.messagesConfiguration = { ...this.messagesConfiguration }
    }
  }
  ngOnInit() {
    this.setTheme()
    this.subscribeToEvents();
    try {
      CometChat.getLoggedinUser()
        .then((user) => {
          (this.loggedInUser as any) = user;
        })
        .catch((error:any) => {
          this.conversationEvents.publishEvents(this.conversationEvents.onError, error)
        });
    } catch (error:any) {
      this.conversationEvents.publishEvents(this.conversationEvents.onError, error)
    }
  }
  setTheme(){
    
    this.messagesStyle.background = this.theme.palette.getBackground()
    this.messagesStyle.messageTextFont = fontHelper(this.theme.typography.heading)
    this.messagesStyle.messageTextColor = this.theme.palette.getAccent400();
    this.conversationStyle.background = this.theme.palette.getBackground()
    this.conversationStyle.border = `1px solid ${this.theme.palette.getAccent400()}`
  }
  checkConfiguration() {
    let conversationDefaultConfig = new ConversationsConfiguration({});
    let messagesDefaultConfig = new MessagesConfiguration({});
      this.setConversationConfig(this.conversationConfiguration, conversationDefaultConfig);
      this.setMessagesConfig(this.messagesConfiguration, messagesDefaultConfig);
  }
    /**
   * @param  {ConversationsConfiguration} config
   * @param  {ConversationsConfiguration} defaultConfig?
   */
     setConversationConfig(config: ConversationsConfiguration, defaultConfig?: ConversationsConfiguration) {
      this.backButtonIconURL = config.backButtonIconURL || defaultConfig!.backButtonIconURL;
      this.hideSearch = checkHasOwnProperty(config,"hideSearch") ? config.hideSearch : defaultConfig!.hideSearch;
      this.searchIconURL = config.searchIconURL || defaultConfig!.searchIconURL;
      this.searchPlaceHolder = config.searchPlaceholder || defaultConfig!.searchPlaceholder;
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
    this.onItemClick = this.conversationEvents.onItemClick.subscribe((data: any) => {
      this.activeConversation = data
      if (data.conversationType && data.conversationType == this.USER) {
        (this.group as any) = null
        this.user = data.conversationWith;
        this.ref.detectChanges()
      }
      else if (data.conversationType && data.conversationType == this.GROUP) {
        (this.user as any) = null
        this.group = data.conversationWith
        this.ref.detectChanges()
      }
    })
    this.onconversationDeleted = this.conversationEvents.onDeleteConversation.subscribe((conversation: any) => {
      this.updatedMessageList(conversation) //to make m messages section empty after deleting conversation from conversationlist
    })
    this.onMessageRead = this.messageEVents.onMessageRead.subscribe((messageReceipt: any) => {
      this.conversationRef.resetUnreadCount()
    })
    this.onBackButtonClick = this.messageEVents.onBack.subscribe(() => {
      this.activeConversation = null;
      this.group = null;
      this.user=null;
    })
  }
  // unsubscribe to subscribed events.
  unsubscribeToEvents() {
    this.onItemClick.unsubscribe();
    this.onconversationDeleted.unsubscribe();
    this.onMessageRead.unsubscribe();
    this.onBackButtonClick.unsubscribe();
  }
  /**
   * remove active chat screen after deleting the conversation.
   * @param  {CometChat.Conversation} conversation
   */
  updatedMessageList(conversation: CometChat.Conversation) {
    if (this.user && (this.user as any).uid && (conversation as any).conversationWith.uid && (this.user as any).uid == (conversation as any).conversationWith.uid) {
      (this.user as any) = null
      this.ref.detectChanges()
    }
    else if (this.group && (this.group as any).guid && (conversation as any).conversationWith.guid && (this.group as any).guid == (conversation as any).conversationWith.guid) {
      (this.group as any) = null
      this.ref.detectChanges()
    }
    else {
      return
    }
  }
  /**
   * Updates the last message  in the conversation list 
   */
  /**
   * @param  {types.messageObject} message
   */
  updateLastMessage(message: types.messageObject) {
    try {
      this.lastMessage = message;
    } catch (error:any) {
      this.conversationEvents.publishEvents(this.conversationEvents.onError, error)
    }
  }
  emptyMessageStyle = ()=>{

    return {
      background: this.style.background || this.theme.palette.getBackground(),
      height:this.style.height,
      width:`calc(${this.style.width} - 280px)`,
      border:this.style.border,
      borderRadius:this.style.borderRadius,
     
    }
  }
  chatsWrapperStyles =  () => {
    return {
      height: this.style.height,
      width: this.style.width,
      border: this.style.border,
      borderRadius: this.style.borderRadius,
      background: this.style.background || this.theme.palette.getBackground(),
      boxShadow: this.style.boxShadow
    }
  }
}
