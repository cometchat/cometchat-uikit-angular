import { Component, OnInit, ViewChild, Input, ChangeDetectionStrategy, OnChanges, SimpleChanges, ChangeDetectorRef, ElementRef } from "@angular/core";
import { CometChat } from "@cometchat-pro/chat";
import { CometChatMessagesComponent } from "../../CometChatMessages/cometchat-messages/cometchat-messages.component";
import { CometChatConversationsComponent } from "../../CometChatConversations/cometchat-conversations/cometchat-conversations.component";
import 'my-cstom-package-lit'
import { Subscription } from "rxjs";
import { CometChatThemeService } from "../../CometChatTheme.service";
import { localize, CometChatTheme, fontHelper, CometChatUserEvents } from "uikit-resources-lerna";
import { WithMessagesStyle, MessagesConfiguration, UsersConfiguration } from "uikit-utils-lerna";
  /**
 *
 * CometChatUsersWithMessagesComponent is a wrapper component for CometChatMessagesComponent and CometChatConversations component to show chats and messages in one screen
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
  // taking reference of conversationComponent and MessagesComponent
  @ViewChild("usersRef", { static: false }) userRef!: CometChatConversationsComponent;
  @ViewChild("messagesRef", { static: false }) messageListRef!: CometChatMessagesComponent;
  @Input() user!: CometChat.User | null;
  @Input() isMobileView: boolean = false;
  @Input() messageText: string = localize("NO_USERS_SELECTED");
  @Input()  usersWithMessagesStyle: WithMessagesStyle = {
    width: "100%",
    height: "100%",
    borderRadius: "none",
    border: "none",
  };
  @Input() messagesConfiguration: MessagesConfiguration = new MessagesConfiguration({});
  @Input() usersConfiguration: UsersConfiguration = new UsersConfiguration({});
  @Input() onError:((error:any)=>void ) | null= (error:any)=>{
    console.log(error)
  }
   theme: CometChatTheme = new CometChatTheme({});
    /**
     * Properties for internal use
     */
  public loggedInUser!: CometChat.User | null;
  labelStyle:any = {
    background:"transparent",
    textFont:"700 22px Inter",
    textColor:"rgba(20, 20, 20, 0.33)"
  }
     /**
     * Events
     */
  ccUserBlocked!:Subscription;
  ccUserUnBlocked!:Subscription;
  constructor(private elementRef: ElementRef,private ref: ChangeDetectorRef,private themeService:CometChatThemeService) {
   }
   ngAfterViewInit() {
    this.updateBackdropHeight()
      }
      updateBackdropHeight(){
        const divHeight = this.elementRef.nativeElement.offsetHeight;
        const divWidth = this.elementRef.nativeElement.offsetWidth;
        let backdropStyle =  {
          height:divHeight + "px",
          width:divWidth + "px",
          background:"rgba(0, 0, 0, 0.5)"
        }
        this.messagesConfiguration.messageListConfiguration.backdropStyle = backdropStyle
        this.messagesConfiguration.detailsConfiguration.backdropStyle = backdropStyle
        this.messagesConfiguration.messageComposerConfiguration.backdropStyle = backdropStyle
        this.messagesConfiguration.detailsConfiguration.groupMembersConfiguration.backdropStyle = backdropStyle
        this.ref.detectChanges()
      }
  ngOnChanges(changes: SimpleChanges): void {
    if(changes["isMobileView"]){
      if (this.isMobileView) {

        this.messagesConfiguration.messageHeaderConfiguration.hideBackButton = false;
        this.messagesConfiguration.messageHeaderConfiguration = {...this.messagesConfiguration.messageHeaderConfiguration}
        this.messagesConfiguration = { ...this.messagesConfiguration }

      }
      else if (!this.isMobileView) {
        this.messagesConfiguration.messageHeaderConfiguration.hideBackButton = true;
        this.messagesConfiguration.messageHeaderConfiguration = {...this.messagesConfiguration.messageHeaderConfiguration}
        this.messagesConfiguration = { ...this.messagesConfiguration }
      }
      this.updateBackdropHeight()
    }
  }
  onBack = ()=>{
    this.user = null
  }
   onItemClick: ((user:CometChat.User)=>void) = (user:CometChat.User)=>{
    this.user = user;
    this.ref.detectChanges();

  };
  ngOnInit() {
    this.setWithMessagesStyle()
    if(!this.messagesConfiguration.messageHeaderConfiguration.onBack){
      this.messagesConfiguration.messageHeaderConfiguration.onBack = this.onBack
    }
    this.subscribeToEvents();
      CometChat.getLoggedinUser()
        .then((user:CometChat.User | null) => {
          this.loggedInUser = user;
        })
        .catch((error:any) => {
          if(this.onError){
            this.onError(error)
          }
        });

  }
  setWithMessagesStyle(){
    let defaultStyle:WithMessagesStyle = new WithMessagesStyle({
      width: "100%",
      height: "100%",
      background: this.themeService.theme.palette.getBackground(),
      borderRadius: "none",
      border: "none",
      messageTextColor: this.themeService.theme.palette.getAccent600(),
      messageTextFont: fontHelper(this.themeService.theme.typography.title1),
    })
    this.usersWithMessagesStyle = {
      ...defaultStyle,
      ...this.usersWithMessagesStyle
    }
    this.labelStyle.textFont = this.usersWithMessagesStyle.messageTextFont
    this.labelStyle.textColor = this.usersWithMessagesStyle.messageTextColor
  }
  ngOnDestroy() {
    this.unsubscribeToEvents();
  }

  // subscribe to global events
  subscribeToEvents() {
    this.ccUserBlocked = CometChatUserEvents.ccUserBlocked.subscribe((user:CometChat.User) => {
       if(this.user && user.getUid() == this.user.getUid()){
         this.user = user;
         this.ref.detectChanges()
       }
    })
    this.ccUserUnBlocked = CometChatUserEvents.ccUserUnblocked.subscribe((user:CometChat.User) => {
      if(this.user && user.getUid() == this.user.getUid()){
        this.user = user;
        this.ref.detectChanges()
      }
    })

  }
  // unsubscribe to subscribed events.
  unsubscribeToEvents() {
    this.ccUserBlocked?.unsubscribe();
    this.ccUserUnBlocked?.unsubscribe();
  }
  emptyMessageStyle = ()=>{
    return {
      background: this.usersWithMessagesStyle.background || this.themeService.theme.palette.getBackground(),
      height:this.usersWithMessagesStyle.height,
      width:`calc(${this.usersWithMessagesStyle.width} - 280px)`,
      border:this.usersWithMessagesStyle.border,
      borderRadius:this.usersWithMessagesStyle.borderRadius,
    }
  }
  usersWrapperStyles =  () => {
    return {
      height: this.usersWithMessagesStyle.height,
      width: this.usersWithMessagesStyle.width,
      border: this.usersWithMessagesStyle.border,
      borderRadius: this.usersWithMessagesStyle.borderRadius,
      background: this.usersWithMessagesStyle.background || this.themeService.theme.palette.getBackground(),
    }
  }
}
